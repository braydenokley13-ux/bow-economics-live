#!/usr/bin/env node
/**
 * Browser truth for THE ROOM — the live class read on /teach (W6).
 *
 * The console used to hand a teacher sixteen desk tiles during an open night
 * and leave the reading to them: how far apart is this room, what shape is it
 * in, who moved and which way. That is the arithmetic a teacher cannot do while
 * standing up, and it is exactly the arithmetic that picks the next question.
 *
 * Twelve desks, one teacher, one projector, Full House.
 *
 *   1. The read is there while the night is open, counts every desk exactly
 *      once, and names the real spread.
 *   2. Night one claims no movement rather than inventing some.
 *   3. After a bell, movement is counted from each desk's own last night — and
 *      a desk the bell auto-committed is reported separately, not counted as
 *      adaptation.
 *   4. THE PROJECTOR NEVER CARRIES IT. The class commits blind; a live
 *      histogram on the board would end that in one press.
 *   5. It goes away when the window closes, so it cannot compete with the
 *      staged reveal.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-teach-room.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4317);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-teachroom-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-teach-room");

/** Prices for the twelve desks on night one — a deliberately split room. */
const N1 = [20, 22, 22, 24, 26, 26, 28, 34, 36, 38, 44, 48];
/** Night two: seven raise, two hold, two lower, and one desk is left for the bell. */
const N2 = [26, 30, 22, 30, 32, 26, 34, 30, 42, 34, 50, null];

const consoleErrors = [];
const notModified = new WeakSet();

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial");
  await page.$eval("#fhPriceDial", (el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, price);
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price);
}

/** The read, as the console has actually rendered it. */
async function readRoom(teach) {
  return teach.evaluate(() => {
    const bars = [...document.querySelectorAll("#roomHist .room-bar")].map((b) => ({
      count: Number(b.querySelector("u")?.textContent || 0),
      title: b.getAttribute("title") || "",
    }));
    return {
      hidden: document.getElementById("liveroom")?.hidden ?? true,
      count: document.getElementById("roomCount")?.textContent || "",
      spread: document.getElementById("roomSpread")?.textContent || "",
      note: document.getElementById("roomNote")?.textContent || "",
      chips: [...document.querySelectorAll("#roomMove .room-chip")].map((c) => c.textContent.replace(/\s+/g, " ").trim()),
      bars,
      axis: [...document.querySelectorAll("#roomAxis span")].map((s) => s.textContent),
    };
  });
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await assertPortFree(PORT, require("path").basename(__filename));
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
    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

    const teach = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    teach.on("dialog", (d) => d.accept());
    teach.on("pageerror", (e) => consoleErrors.push(`[teach] pageerror: ${e.message}`));
    teach.on("response", (r) => { if (r.status() === 304) notModified.add(r.request()); });
    teach.on("requestfailed", (r) => {
      if (notModified.has(r)) return; // Chromium reports a bodyless 304 as ERR_ABORTED
      consoleErrors.push(`[teach] request failed: ${r.url()} :: ${r.failure()?.errorText}`);
    });
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "The room");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();

    const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    board.on("pageerror", (e) => consoleErrors.push(`[board] pageerror: ${e.message}`));
    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage");

    const desks = [];
    for (let i = 0; i < N1.length; i += 1) {
      const p = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      p.on("pageerror", (e) => consoleErrors.push(`[desk${i + 1}] pageerror: ${e.message}`));
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", `Pair ${i + 1}`);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      desks.push(p);
    }

    await teach.click("#btnAdvance"); // HOOK
    await teach.click("#btnAdvance"); // PLAY
    for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 30000 });

    /* -- 1/2. Night one: the shape is real, the movement is not invented. --- */
    for (let i = 0; i < desks.length; i += 1) {
      await setPrice(desks[i], N1[i]);
      await desks[i].click("#fhLock");
      await desks[i].waitForSelector(".fh-locked-recap", { timeout: 15000 });
    }
    await teach.waitForFunction(
      () => (document.getElementById("roomCount")?.textContent || "").startsWith("12 of 12"),
      null,
      { timeout: 15000 },
    );
    let room = await readRoom(teach);
    assert.equal(room.hidden, false, "the read must be on the console while a night is open");
    const total = room.bars.reduce((n, b) => n + b.count, 0);
    assert.equal(total, N1.length, `every desk must land in exactly one bar — counted ${total} of ${N1.length}`);
    assert.match(room.spread, /\$20 and \$48/, `the spread must be the real one: "${room.spread}"`);
    assert.ok(room.axis.length >= 2 && room.axis.length <= 12, `a projector histogram, not a comb: ${room.axis.length} bars`);
    assert.ok(
      !room.chips.some((c) => /raised|lowered|held/.test(c)),
      `night one must claim no movement: ${JSON.stringify(room.chips)}`,
    );
    assert.match(room.note, /First night/, `night one must say so: "${room.note}"`);
    assert.match(room.note, /never shows this while the night is open/, "the read must carry its own guard");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-teach-room-night1.png"), fullPage: true });
    console.log(`[teach-room] night 1: ${room.spread.trim()} across ${room.axis.length} bars, no movement claimed`);

    /* -- 4. The projector is not carrying any of it. ----------------------- */
    const boardText = await board.textContent("#stage");
    for (const price of [...new Set(N1)]) {
      assert.ok(
        !new RegExp(`\\$${price}\\b`).test(boardText),
        `the projector is showing a live dial ($${price}) while the night is open`,
      );
    }
    assert.ok(!/raised|lowered|spread/i.test(boardText), "the projector is carrying the class read");
    console.log("[teach-room] the projector shows none of it — the room still commits blind");

    /* -- 3. Night two: movement measured from each desk's own last night. --- */
    await teach.click("#btnCloseNight");
    await teach.waitForFunction(
      // the bell is hosted by the deck while a night is live, so read the button itself
      () => (document.getElementById("btnCloseNight")?.textContent || "").includes("Night 2"),
      null,
      { timeout: 15000 },
    );
    for (let i = 0; i < desks.length; i += 1) {
      if (N2[i] === null) continue; // left for the bell — no decision of its own
      await desks[i].waitForSelector("#fhNextNight", { timeout: 20000 });
      await desks[i].click("#fhNextNight");
      await setPrice(desks[i], N2[i]);
      await desks[i].click("#fhLock");
      await desks[i].waitForSelector(".fh-locked-recap", { timeout: 15000 });
    }
    const raised = N2.filter((p, i) => p !== null && p > N1[i]).length;
    const held = N2.filter((p, i) => p !== null && p === N1[i]).length;
    const lowered = N2.filter((p, i) => p !== null && p < N1[i]).length;
    await teach.waitForFunction(
      (want) => (document.getElementById("roomMove")?.textContent || "").includes(`${want} raised`),
      raised,
      { timeout: 15000 },
    );
    room = await readRoom(teach);
    assert.ok(room.chips.some((c) => c.startsWith(`${raised} raised`)), `raised: ${JSON.stringify(room.chips)}`);
    assert.ok(room.chips.some((c) => c.startsWith(`${held} held`)), `held: ${JSON.stringify(room.chips)}`);
    assert.ok(room.chips.some((c) => c.startsWith(`${lowered} lowered`)), `lowered: ${JSON.stringify(room.chips)}`);
    // The twelfth desk has not committed anything this night, so it is
    // "deciding" — never counted as having moved. Before this was fixed its
    // untouched dial, reopened at the season plan price, was being reported as
    // a price cut.
    assert.ok(
      room.chips.some((c) => c === "1 still deciding"),
      `the uncommitted desk must be deciding, not moving: ${JSON.stringify(room.chips)}`,
    );
    assert.equal(raised + held + lowered + 1, N1.length, "eleven decisions and one desk still out");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "02-teach-room-night2-movement.png"), fullPage: true });
    console.log(`[teach-room] night 2: ${raised} raised, ${held} held, ${lowered} lowered — counted from each desk's own last night`);

    /* -- 3b. A bell-committed desk is reported, never called adaptation. ---- */
    await teach.click("#btnCloseNight"); // desk 12 is auto-committed here
    await teach.waitForFunction(
      () => (document.getElementById("btnCloseNight")?.textContent || "").includes("Night 3"),
      null,
      { timeout: 15000 },
    );
    for (let i = 0; i < desks.length; i += 1) {
      await desks[i].waitForSelector("#fhNextNight", { timeout: 20000 });
      await desks[i].click("#fhNextNight");
      await desks[i].click("#fhLock");
      await desks[i].waitForSelector(".fh-locked-recap", { timeout: 15000 });
    }
    await teach.waitForFunction(
      () => /bell-committed night/.test(document.getElementById("roomMove")?.textContent || ""),
      null,
      { timeout: 20000 },
    );
    room = await readRoom(teach);
    const autoChip = room.chips.find((c) => c.includes("bell-committed"));
    assert.ok(autoChip, `the auto-committed desk must be reported: ${JSON.stringify(room.chips)}`);
    assert.match(autoChip, /^1 /, `exactly one desk was auto-committed: "${autoChip}"`);
    console.log(`[teach-room] the bell-committed desk is reported separately: "${autoChip}"`);

    /* -- 5. The read stands down when the window closes. ------------------- */
    for (let n = 0; n < 3; n += 1) await teach.click("#btnCloseNight");
    await teach.waitForFunction(() => document.getElementById("liveroom")?.hidden === true, null, { timeout: 15000 });
    console.log("[teach-room] window closed: the read stands down for the staged reveal");

    assert.deepEqual(consoleErrors, [], `console errors during the run:\n${consoleErrors.join("\n")}`);
    console.log("[teach-room] PASS — screens in docs/gauntlet/module-2/screens-teach-room/");
  } catch (err) {
    console.error(`[teach-room] FAIL: ${err.message}`);
    if (serverLog.length) console.error(serverLog.join(""));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(SNAPSHOT_FILE, { force: true });
  }
}

void main();
