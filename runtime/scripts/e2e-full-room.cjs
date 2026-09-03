#!/usr/bin/env node
/**
 * W8 — THE FULL ROOM, in a browser.
 *
 * `latency-harness.cjs` proves the SERVER holds 32 desks (p99 21ms to every
 * desk, against 14ms at 16 — doubling the room costs seven milliseconds). That
 * is not the whole question. The other half is whether the three SURFACES hold
 * a room that size: 32 desk tiles on a console a teacher has to read standing
 * up, 32 dials in a histogram, a 32-row unresolved list under a running clock,
 * and a projector that still fits at 1366x768.
 *
 * So: 32 seats driven through the real API (a Chromium page each is a fact
 * about this machine, not about the product), and the three surfaces opened as
 * REAL browser pages against them.
 *
 *   1. /teach renders a 32-desk room and stays usable: the room read bins
 *      every desk without becoming a comb, the deck is on screen unscrolled,
 *      and the TIME CUT list scrolls inside its own card rather than pushing
 *      the closing controls off the page.
 *   2. The console does not drive itself. 32 desks polling is exactly the
 *      shape that produced a 230-request-per-second storm before the presence
 *      rule; this measures the rate with the room at full size.
 *   3. /board fits at both projector shapes with 32 desks in the class
 *      evidence, and carries nothing seat-private while the night is open.
 *   4. A real desk in that room can still price and lock, promptly.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-full-room.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4320);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-fullroom-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-full-room");

/** The founder's stress number. 16 is the normal room; 16 must not be the cliff edge. */
const DESKS = Number(process.env.DESKS ?? 32);
const PROJECTOR_SHAPES = [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }];

const consoleErrors = [];
const notModified = new WeakSet();

async function api(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/** Every card's own box, so "it fits" is measured rather than eyeballed. */
async function boardFits(board, label) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(400);
    const over = await board.evaluate(() => {
      const stage = document.getElementById("stage");
      return stage ? { scroll: stage.scrollHeight, client: stage.clientHeight } : null;
    });
    assert.ok(over, `${label}: no #stage at ${shape.width}x${shape.height}`);
    assert.ok(
      over.scroll <= over.client + 1,
      `${label}: the projector overflows at ${shape.width}x${shape.height} — ${over.scroll}px of content in ${over.client}px`,
    );
  }
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await assertPortFree(PORT, path.basename(__filename));
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const serverLog = [];
  server.stdout.on("data", (d) => serverLog.push(String(d)));
  server.stderr.on("data", (d) => serverLog.push(String(d)));

  let browser;
  try {
    await waitForServer();

    // The room, through the real API. The 32nd desk is a real seat with a real
    // device token taking real actions; what it is not is a 32nd Chromium.
    const created = await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ lessonModuleId: "m2l1-full-house", title: "Full room" }),
    });
    const code = created.session.code;
    const key = created.teacherKey;
    const tokens = [];
    for (let i = 0; i < DESKS - 1; i += 1) {
      const joined = await api(`/api/sessions/${code}/join`, {
        method: "POST",
        body: JSON.stringify({ displayName: `Pair ${i + 1}` }),
      });
      tokens.push(joined.deviceToken);
    }

    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
    const teach = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    teach.on("dialog", (d) => d.accept());
    teach.on("pageerror", (e) => consoleErrors.push(`[teach] pageerror: ${e.message}`));
    let teachRequests = 0;
    teach.on("request", (r) => { if (r.url().includes("/api/")) teachRequests += 1; });
    teach.on("response", (r) => { if (r.status() === 304) notModified.add(r.request()); });
    teach.on("requestfailed", (r) => {
      // The projector preview is an iframe of /board that the console DESTROYS
      // when the session ends. A frame torn down with a long-lived SSE stream
      // and a poll in flight reports both as ERR_ABORTED, the same way closing
      // a tab does. That is the teardown working, not a failed request — and it
      // is carved out by FRAME, so a genuinely failed request on the console
      // itself still fails the run.
      if (r.frame()?.name() === "ppBoard" && r.failure()?.errorText === "net::ERR_ABORTED") return;
      if (notModified.has(r)) return; // Chromium reports a bodyless 304 as ERR_ABORTED
      consoleErrors.push(`[teach] request failed: ${r.url()} :: ${r.failure()?.errorText}`);
    });
    // What a real teacher's console already holds after starting the room:
    // /teach reopens from remembered code + key, not from a query parameter.
    await teach.addInitScript(([c, k]) => {
      try {
        localStorage.setItem("bow-teach-session-code", c);
        localStorage.setItem("bow-teach-session-key", k);
      } catch { /* private mode */ }
    }, [code, key]);
    await teach.goto(`${BASE}/teach`);
    await teach.waitForSelector("#controls:not([hidden])", { timeout: 20000 });

    const board = await browser.newPage({ viewport: PROJECTOR_SHAPES[0] });
    board.on("pageerror", (e) => consoleErrors.push(`[board] pageerror: ${e.message}`));
    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage");

    // The 32nd desk is a real browser, so the run still measures what a student
    // in a full room actually experiences.
    const desk = await browser.newPage({ viewport: { width: 1024, height: 600 } });
    desk.on("pageerror", (e) => consoleErrors.push(`[desk] pageerror: ${e.message}`));
    await desk.goto(`${BASE}/play`);
    await desk.fill("#joinCode", code);
    await desk.fill("#joinName", `Pair ${DESKS}`);
    await desk.click("#btnJoin");
    await desk.waitForSelector("#gameCard:not([hidden])");

    await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "advance" }) });
    await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "advance" }) });
    for (const t of tokens) {
      await api(`/api/sessions/${code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: JSON.stringify({ type: "takeSeat" }) });
    }
    await desk.waitForSelector("#fhPlayRoot", { timeout: 30000 });
    await teach.waitForFunction((n) => (document.getElementById("seatCount")?.textContent || "").startsWith(String(n)), DESKS, { timeout: 20000 });
    console.log(`[full-room] ${DESKS} desks seated, three surfaces live`);

    /* -- 2. The console must not drive itself at full size. ----------------- */
    // 32 desks polling is exactly the shape that produced a sustained ~230
    // requests/second storm before presence writes were made silent.
    teachRequests = 0;
    const rateT0 = Date.now();
    await teach.waitForTimeout(10_000);
    const rate = teachRequests / ((Date.now() - rateT0) / 1000);
    assert.ok(rate < 3, `the console polled ${teachRequests} times in 10s (${rate.toFixed(1)}/s) with ${DESKS} desks — it is being driven by the room's own traffic`);
    console.log(`[full-room] teacher console: ${rate.toFixed(2)} req/s with ${DESKS} desks on the poll`);

    /* -- 1. The console holds a room this size. ----------------------------- */
    // Half the room prices and commits; the rest is left for the bell, which is
    // also what makes the TIME CUT list long.
    const PRICE_LADDER = [16, 18, 20, 22, 24, 26, 28, 30, 34, 38, 42, 48, 52, 56, 60, 24];
    const committed = Math.min(Math.floor(DESKS / 2), tokens.length);
    const prices = Array.from({ length: committed }, (_, i) => PRICE_LADDER[i % PRICE_LADDER.length]);
    for (let i = 0; i < prices.length; i += 1) {
      await api(`/api/sessions/${code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${tokens[i]}` }, body: JSON.stringify({ type: "setPrice", price: prices[i] }) });
      await api(`/api/sessions/${code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${tokens[i]}` }, body: JSON.stringify({ type: "lock" }) });
    }
    await teach.waitForFunction(
      (want) => (document.getElementById("roomCount")?.textContent || "").startsWith(want),
      `${committed} of ${DESKS}`,
      { timeout: 20000 },
    );
    const room = await teach.evaluate(() => {
      const bars = [...document.querySelectorAll("#roomHist .room-bar")];
      const deck = document.getElementById("deck").getBoundingClientRect();
      const tcList = document.querySelector("#timecut ul.tc-list");
      const tcBox = tcList?.getBoundingClientRect();
      return {
        bars: bars.length,
        counted: bars.reduce((n, b) => n + Number(b.querySelector("u")?.textContent || 0), 0),
        spread: document.getElementById("roomSpread")?.textContent || "",
        deckTop: Math.round(deck.top),
        deckBottom: Math.round(deck.bottom),
        viewport: window.innerHeight,
        scrollY: Math.round(window.scrollY),
        page: document.documentElement.scrollHeight,
        unresolvedRows: document.querySelectorAll("#timecut ul.tc-list li").length,
        tcScrolls: tcList ? tcList.scrollHeight > tcList.clientHeight + 1 : false,
        tcHeight: tcBox ? Math.round(tcBox.height) : null,
        deskChips: document.querySelectorAll("#deskGrid .desk-chip").length,
        deskGridHeight: (() => {
          const g = document.getElementById("deskGrid");
          return g ? Math.round(g.getBoundingClientRect().height) : null;
        })(),
        deskScrolls: (() => {
          const g = document.getElementById("deskGrid");
          return g ? g.scrollHeight > g.clientHeight + 1 : false;
        })(),
      };
    });
    assert.equal(room.counted, DESKS, `every desk must land in exactly one bar — counted ${room.counted} of ${DESKS}`);
    assert.ok(room.bars <= 12, `${room.bars} bars is a comb, not a shape`);
    assert.ok(room.deckBottom <= room.viewport + 2 && room.deckTop >= 0, `the deck is off screen at ${DESKS} desks: top ${room.deckTop}, bottom ${room.deckBottom}`);
    assert.equal(room.scrollY, 0, "measured without scrolling");
    // The unresolved list is the one part of the console that grows with the
    // room. It must scroll inside its own card, or a 32-desk class pushes the
    // closing controls the teacher is reaching for down the page.
    assert.equal(room.unresolvedRows, DESKS - committed, `the TIME CUT list should name every uncommitted desk, found ${room.unresolvedRows}`);
    // A short list need not scroll; a long one must, or the closing controls the
    // teacher is reaching for get pushed down the page.
    if (room.unresolvedRows >= 12) {
      assert.ok(room.tcScrolls, "the unresolved list is not scrolling inside its card — it is growing the page instead");
    }
    assert.ok(room.tcHeight !== null && room.tcHeight <= 260, `the unresolved list is ${room.tcHeight}px tall at ${DESKS} desks`);
    // THE DESKS grows with the room too, and it is one chip per desk rather than
    // one row, so it is the biggest thing on the console at 32 desks. Same rule:
    // it scrolls inside its card or it pushes the controls off the page.
    assert.equal(room.deskChips, DESKS, `the walk-to list drew ${room.deskChips} chips for ${DESKS} desks`);
    assert.ok(room.deskGridHeight !== null && room.deskGridHeight <= 320, `the walk-to list is ${room.deskGridHeight}px tall at ${DESKS} desks`);
    assert.ok(room.deskScrolls, "the walk-to list is not scrolling inside its card — it is growing the page instead");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-teach-32-desks.png") });
    console.log(`[full-room] console at ${DESKS} desks: ${room.bars} bars, all ${room.counted} counted, ${room.unresolvedRows} unresolved in a ${room.tcHeight}px scroller, ${room.deskChips} desk chips in a ${room.deskGridHeight}px scroller, deck at y=${room.deckTop} of ${room.page}px`);

    /* -- 4. A real desk in that room can still act. ------------------------- */
    const t0 = Date.now();
    await desk.$eval("#fhPriceDial", (el) => {
      el.value = "44";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await desk.click("#fhLock");
    await desk.waitForSelector(".fh-locked-recap", { timeout: 15000 });
    const lockMs = Date.now() - t0;
    await teach.waitForFunction(
      (want) => (document.getElementById("roomCount")?.textContent || "").startsWith(want),
      `${committed + 1} of ${DESKS}`,
      { timeout: 15000 },
    );
    const seenMs = Date.now() - t0;
    assert.ok(seenMs < 4000, `the teacher saw lock ${committed + 1} ${seenMs}ms after it happened`);
    console.log(`[full-room] a desk in a full room locked in ${lockMs}ms; the console had it ${seenMs}ms after the click`);

    /* -- 3. The projector fits a 32-desk class, and carries nothing private. */
    await boardFits(board, "night open");
    const openText = await board.textContent("#stage");
    for (const p of new Set(prices)) {
      assert.ok(!new RegExp(`\\$${p}\\b`).test(openText), `the projector is showing a live dial ($${p}) while the night is open`);
    }
    await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "hook", hook: "closeNight" }) });
    for (let n = 0; n < 4; n += 1) {
      await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "hook", hook: "closeNight" }) });
    }
    await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "advance" }) }); // REVEAL
    let frames = 0;
    for (let stage = 0; stage < 7; stage += 1) {
      await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: "hook", hook: "revealNext" }) }).catch(() => {});
      await board.waitForTimeout(500);
      await boardFits(board, `reveal stage ${stage + 1}`);
      frames += 1;
    }
    await board.setViewportSize(PROJECTOR_SHAPES[0]);
    await board.screenshot({ path: path.join(SCREEN_DIR, "02-board-32-desks-reveal.png") });
    for (const phase of ["advance", "advance", "advance", "advance", "advance"]) {
      await api(`/api/sessions/${code}/control`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify({ type: phase }) }).catch(() => {});
      await board.waitForTimeout(500);
      await boardFits(board, "post-reveal phase");
      frames += 1;
    }
    await board.screenshot({ path: path.join(SCREEN_DIR, "03-board-32-desks-late.png") });
    console.log(`[full-room] projector fits a ${DESKS}-desk class on ${frames * PROJECTOR_SHAPES.length} frames across both shapes`);

    assert.deepEqual(consoleErrors, [], `console errors during the run:\n${consoleErrors.join("\n")}`);
    console.log(`[full-room] PASS — ${DESKS} desks, three surfaces, screens in docs/gauntlet/module-2/screens-full-room/`);
  } catch (err) {
    console.error(`[full-room] FAIL: ${err.message}`);
    if (serverLog.length) console.error(serverLog.join(""));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(SNAPSHOT_FILE, { force: true });
  }
}

void main();
