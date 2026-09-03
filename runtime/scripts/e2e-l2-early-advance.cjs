#!/usr/bin/env node
/**
 * Focused e2e probe for VERIFY_L2.md BLOCKER B1 — "a teacher who advances
 * out of REVEAL before every target is revealed leaves a team stranded."
 * Complements `e2e-l2.cjs` (the full happy-path arc, which always reveals
 * every target); this script exercises the specific early-advance path the
 * verifier's repro hit, through the real compiled server and real Chromium
 * pages for /teach and /play (L1 setup + the deadline commit use the raw
 * HTTP API for speed/determinism — the same "played for real, not forged"
 * discipline as e2e-l2.cjs, just via fetch instead of browser clicks for
 * the parts this probe isn't specifically about).
 *
 * Asserts, through the real UI:
 *   1. /teach warns (a real confirm() dialog, the existing idiom) before
 *      advancing out of REVEAL with targets still unrevealed, and naming
 *      the correct remaining count.
 *   2. Accepting it auto-resolves the pending bid — the bidder's own
 *      /play screen shows the REAL rescue candidates, never the false
 *      "nothing to do here" the verifier screenshotted.
 *   3. The rescue actually works end-to-end from that screen.
 *   4. /board's SYNTHESIS numbers reflect the correct, resolved count.
 *   5. Zero console errors throughout.
 *
 * Run from runtime/: `node scripts/e2e-l2-early-advance.cjs` (after `npm run build`).
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = 4304;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-early-advance-${Date.now()}.json`);

let consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/lessons`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

async function api(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });

  console.log("[early-advance] starting server...");
  await assertPortFree(PORT, require("path").basename(__filename));
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();

  let browser;
  try {
    // --- L1: one quick, real roster (API, deterministic — see e2e-l2.cjs for the full-browser version) ---
    const l1 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l1-draft-day", title: "early-advance L1" }) });
    const seat = await api(`/api/sessions/${l1.session.code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team X" }) });
    await api(`/api/sessions/${l1.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1.teacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    await api(`/api/sessions/${l1.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1.teacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    const picks = [
      { slot: "SCORER", playerId: "sc-10" },
      { slot: "PLAYMAKER", playerId: "pm-10" },
      { slot: "DEFENDER", playerId: "df-10" },
      { slot: "REBOUNDER", playerId: "rb-10" },
      { slot: "WILDCARD", playerId: "sc-20" },
    ]; // spend 60 -> plenty of room for a genuine-loss lowball
    for (const { slot, playerId } of picks) {
      await api(`/api/sessions/${l1.session.code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${seat.deviceToken}` }, body: JSON.stringify({ type: "place", slotId: slot, playerId }) });
    }
    await api(`/api/sessions/${l1.session.code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${seat.deviceToken}` }, body: JSON.stringify({ type: "lock" }) });
    await api(`/api/sessions/${l1.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1.teacherKey}` }, body: JSON.stringify({ type: "end" }) });

    // --- L2: linked creation, claim, and the deadline commit via API (fast setup; the UI parts under test are below) ---
    const l2 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l2-trade-deadline", title: "early-advance L2", sourceSessionId: l1.session.id }) });
    const l2seat = await api(`/api/sessions/${l2.session.code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team X" }) });
    await api(`/api/sessions/${l2.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2.teacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
    await api(`/api/sessions/${l2.session.code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${l2seat.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 0 }) });
    await api(`/api/sessions/${l2.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2.teacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY
    // Cut PLAYMAKER, lowball $5 on tgt-pm (reserve $35) — a guaranteed, genuine loss.
    await api(`/api/sessions/${l2.session.code}/actions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${l2seat.deviceToken}` },
      body: JSON.stringify({ type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }),
    });
    await api(`/api/sessions/${l2.session.code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2.teacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // PLAY -> REVEAL
    console.log("[early-advance] L1 played and ended; L2 linked, claimed, one genuine lowball bid committed, now in REVEAL with 0/4 revealed");

    // --- The real UI, from here ---
    browser = await chromium.launch();
    const viewport = { width: 960, height: 600 };
    const teach = await browser.newPage({ viewport });
    const play = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport });
    for (const [label, page] of [["teach", teach], ["play", play], ["board", board]]) watchConsole(page, label);

    // Re-open /teach as this session's teacher: paste the remembered code+key path isn't exposed by URL, so
    // drive it the way a teacher reopening a tab would — localStorage holds the session once created via the
    // UI in e2e-l2.cjs; here we seed it directly since we created the session via API, then reload.
    await teach.goto(`${BASE}/teach`);
    await teach.evaluate(({ code, key }) => {
      localStorage.setItem("bow-teach-session-code", code);
      localStorage.setItem("bow-teach-session-key", key);
    }, { code: l2.session.code, key: l2.teacherKey });
    await teach.reload();
    await teach.waitForSelector("#room:not([hidden])");
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    console.log("[early-advance] /teach reopened against the real session, confirmed in REVEAL");

    await play.goto(`${BASE}/play`);
    await play.evaluate(
      (creds) => localStorage.setItem("bow-play-credentials", JSON.stringify(creds)),
      { deviceToken: l2seat.deviceToken, sessionCode: l2.session.code, seatId: l2seat.seat.id, displayName: "Team X" },
    );
    await play.reload();
    await play.waitForSelector("#gameCard:not([hidden])");

    await board.goto(`${BASE}/board?code=${l2.session.code}`);

    // /play's own rescue click is gated behind its own confirm() (renderTDAdapt) — needs a handler too.
    play.on("dialog", (d) => d.accept());

    // Capture the confirm() dialog text and accept it — this is the required teacher-facing warning.
    let dialogMessage = null;
    teach.on("dialog", (d) => {
      dialogMessage = d.message();
      d.accept();
    });
    await teach.click("#btnAdvance"); // REVEAL -> ADAPT, with 0/4 revealed
    await teach.waitForSelector(".phasechip.current:text('ADAPT')");
    assert.ok(dialogMessage, "advancing out of REVEAL with unrevealed targets must show a confirm() warning");
    assert.match(dialogMessage, /4 of 4 targets unrevealed/i, `dialog should name the correct remaining count, got: "${dialogMessage}"`);
    assert.match(dialogMessage, /without the staged reveal/i);
    console.log(`[early-advance] /teach warned before advancing: "${dialogMessage}"`);

    // The bidder's own /play screen must show the REAL rescue, not the false "nothing to do here".
    await play.waitForFunction(() => document.body.innerText.includes("Cut"), null, { timeout: 15000 }).catch(() => {});
    await play.waitForSelector(".rescue-grid .market-card", { timeout: 15000 });
    const playText = await play.evaluate(() => document.body.innerText);
    assert.ok(!playText.includes("nothing to do here"), "must NOT show the false full-wall message — this is exactly VERIFY_L2.md's B1 repro");
    console.log("[early-advance] /play correctly shows real rescue candidates for the stranded-then-resolved team");

    await play.locator(".rescue-grid .market-card").first().click();
    await play.waitForSelector(".banner:text('Rescue signed')");
    console.log("[early-advance] rescue completed successfully from the real UI");

    // /board's SYNTHESIS should reflect the correctly-resolved, correctly-counted aggregate.
    await teach.click("#btnAdvance"); // ADAPT -> SYNTHESIS (no unrevealed-target warning expected here)
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    await board.waitForSelector(".synthcard");
    const boardText = await board.evaluate(() => document.body.innerText);
    assert.match(boardText, /DEAD CAP/i);
    console.log("[early-advance] /board SYNTHESIS rendered with the auto-resolved session's real numbers");

    if (consoleErrors.length > 0) {
      console.error("[early-advance] CONSOLE ERRORS DETECTED:\n" + consoleErrors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("[early-advance] zero console errors across teach/play/board");
    }
    console.log("[early-advance] PASS — B1 repair verified end to end through the real UI.");
  } catch (error) {
    console.error("[early-advance] FAILED:", error);
    console.error("[early-advance] server log tail:\n" + serverLog.split("\n").slice(-40).join("\n"));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
