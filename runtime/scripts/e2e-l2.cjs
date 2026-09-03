#!/usr/bin/env node
/**
 * End-to-end proof for Module 1, Lesson 2 — "The Trade Deadline."
 *
 * Drives the REAL compiled server (a child process, not a mock) through the
 * full L2 arc via real Playwright browser pages against /teach, /play, and
 * /board. L1's roster is produced by actually playing Draft Day through the
 * real HTTP API (join/place/lock/advance/end) — never a hand-forged
 * snapshot — so the L1->L2 seed this proves is the real thing a teacher's
 * class would produce.
 *
 * Run from runtime/: `node scripts/e2e-l2.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * Four L2 teams are exercised across all three deadline paths plus both
 * seat-claiming normalizations:
 *   - Alpha  (carried, L1 spend $100M/at-cap)  -> STAND PAT
 *   - Beta   (carried, L1 spend $60M)          -> CUT + VETERAN (a real upgrade)
 *   - Gamma  (carried, L1 spend $70M)          -> CUT + SEALED BID, wins
 *   - Delta  (STOCK expansion franchise)       -> CUT + SEALED BID, loses -> ADAPT rescue
 * Gamma and Delta both bid on the same scarce target (tgt-pm) so the
 * competing-bids/lost-bid/reserve mechanics are exercised for real.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = 4301;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-1", "screens-l2");

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

/* ------------------------------------------------------------- L1 via API -- */

async function api(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function playL1Team(l1Code, deviceToken, picks) {
  for (const { slot, playerId } of picks) {
    await api(`/api/sessions/${l1Code}/actions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${deviceToken}` },
      body: JSON.stringify({ type: "place", slotId: slot, playerId }),
    });
  }
  await api(`/api/sessions/${l1Code}/actions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${deviceToken}` },
    body: JSON.stringify({ type: "lock" }),
  });
}

const ALPHA_PICKS = [
  { slot: "SCORER", playerId: "sc-30" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-30" },
  { slot: "REBOUNDER", playerId: "rb-20" },
  { slot: "WILDCARD", playerId: "sc-10" },
]; // spend 100 -> at the L1 cap, headed for STAND PAT
const BETA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" }, // 58 rating -> the veteran (65) is a real upgrade
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // spend 60 -> plenty of deadline budget, headed for CUT + VETERAN
const GAMMA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-20" }, // Andre Lopez, the market's own PLAYMAKER gem
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // spend 70 -> headed for CUT + SEALED BID, winning bid

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });

  console.log("[e2e] starting server...");
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
  console.log("[e2e] server up on", BASE);

  let browser;
  try {
    /* --------------------------------------------------- L1: real class play -- */
    console.log("[e2e] === L1: playing Draft Day through the real API to produce genuine carried state ===");
    const l1Create = await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ lessonModuleId: "m1l1-draft-day", title: "E2E L1 class" }),
    });
    const l1Code = l1Create.session.code;
    const l1TeacherKey = l1Create.teacherKey;
    const l1SessionId = l1Create.session.id;

    const alphaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Alpha" }) });
    const betaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Beta" }) });
    const gammaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Gamma" }) });

    await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
    await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY

    await playL1Team(l1Code, alphaJoin.deviceToken, ALPHA_PICKS);
    await playL1Team(l1Code, betaJoin.deviceToken, BETA_PICKS);
    await playL1Team(l1Code, gammaJoin.deviceToken, GAMMA_PICKS);
    console.log("[e2e] all three L1 teams built and locked their rosters");

    // Walk the rest of L1's phases to a real COMPLETE, then end class — the normal end-of-lesson flow.
    let l1Phase = "PLAY";
    while (l1Phase !== "COMPLETE") {
      const r = await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) });
      l1Phase = r.session.phase;
    }
    await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "end" }) });
    console.log(`[e2e] L1 session ${l1SessionId} ended (code ${l1Code}) — this is the real, ended-class seed for L2`);

    /* --------------------------------------------------- L2: real browser play -- */
    console.log("[e2e] === L2: driving /teach, /play x4, /board through real Chromium pages ===");
    browser = await chromium.launch();
    // A modest viewport keeps the handful of proof screenshots small (docs/gauntlet asks for small PNGs) without
    // affecting anything about the actual test — every surface here is responsive down to phone width already.
    const viewport = { width: 960, height: 600 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport });
    const alpha = await browser.newPage({ viewport });
    const beta = await browser.newPage({ viewport });
    const gamma = await browser.newPage({ viewport });
    const delta = await browser.newPage({ viewport });
    for (const [label, page] of [["teach", teach], ["board", board], ["alpha", alpha], ["beta", beta], ["gamma", gamma], ["delta", delta]]) {
      watchConsole(page, label);
      page.on("dialog", (d) => d.accept()); // this UI's confirm() gates on final deadline decisions
    }

    // The link list only answers a teacher of a room on this server, because it
    // hands out every live class's join code. A real teacher's console already
    // holds the key from the lesson they just ran; this harness drove L1
    // through the API, so it puts that key where /teach keeps it.
    await teach.addInitScript((key) => {
      try { localStorage.setItem("bow-teach-session-key", key); } catch { /* private mode */ }
    }, l1TeacherKey);
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m1l2-trade-deadline");
    await teach.waitForSelector("#sourceSessionRow:not([hidden])");
    await teach.waitForSelector(`#sourceSession option[value="${l1SessionId}"]`, { state: "attached" });

    // A session that has not finished is still linkable, and sometimes should
    // be — but never by accident. The books carried forward are whatever that
    // room had at the instant this one was created, so a league linked mid-week
    // arrives half-played and nothing downstream can tell.
    {
      const stillLive = await api("/api/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${l1TeacherKey}` },
        body: JSON.stringify({ lessonModuleId: "m1l1-draft-day", title: "period 4, still running" }),
      });
      await teach.reload();
      await teach.selectOption("#lesson", "m1l2-trade-deadline");
      await teach.waitForSelector(`#sourceSession option[value="${stillLive.session.id}"]`, { state: "attached" });

      await teach.selectOption("#sourceSession", stillLive.session.id);
      await teach.waitForSelector("#sourceLiveWarn:not([hidden])", { timeout: 10000 });
      const warn = (await teach.textContent("#sourceLiveWarn")).trim();
      assert.match(warn, /has not finished/i, `the live-source warning says nothing useful: "${warn}"`);
      assert.match(warn, /exactly as they stand right now/i);

      // And it must go away for the finished session, or it is wallpaper.
      await teach.selectOption("#sourceSession", l1SessionId);
      await teach.waitForFunction(() => document.getElementById("sourceLiveWarn")?.hidden === true, null, { timeout: 10000 });
      console.log("[e2e] the picker warns before a still-running session is linked, and stands down for a finished one");
    }

    await teach.selectOption("#sourceSession", l1SessionId);
    await teach.fill("#title", "E2E L2 class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const l2Code = (await teach.textContent("#code")).trim();
    console.log("[e2e] L2 session created, code", l2Code);

    await board.goto(`${BASE}/board?code=${l2Code}`);
    await board.waitForSelector("#stage .label");

    // Join all four L2 seats before HOOK opens (a real class doesn't wait for the teacher to advance first).
    async function join(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", l2Code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
    }
    await join(alpha, "Alpha");
    await join(beta, "Beta");
    await join(gamma, "Gamma");
    await join(delta, "Delta");
    console.log("[e2e] all four teams joined L2");

    await teach.click("#btnAdvance"); // LOBBY -> HOOK
    await teach.waitForSelector(".phasechip.current:text('HOOK')");

    // Claim sequentially so the carried-franchise assignment is deterministic (Alpha=index0/Ironworks,
    // Beta=index1/Northstar, Gamma=index2/Harbor — L1 join order) and to prove the double-claim guard holds
    // even under a real HTTP round trip, not just the unit-test reducer.
    async function claimCarried(page, index) {
      await page.waitForSelector(`.claim-card[data-carried-index="${index}"]`);
      await page.click(`.claim-card[data-carried-index="${index}"]`);
      await page.waitForSelector(".report-row");
    }
    await claimCarried(alpha, 0);
    await claimCarried(beta, 1);
    await claimCarried(gamma, 2);
    await delta.waitForSelector(".claim-card.stock");
    await delta.click(".claim-card.stock");
    await delta.waitForSelector(".report-row");
    console.log("[e2e] Alpha/Beta/Gamma claimed their carried L1 franchises; Delta claimed a stock expansion franchise");

    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-teach-hook.png"), fullPage: true });
    await alpha.screenshot({ path: path.join(SCREEN_DIR, "02-play-midseason-report.png") });

    await teach.click("#btnAdvance"); // HOOK -> PLAY
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    for (const page of [alpha, beta, gamma, delta]) await page.waitForSelector("#tdWall");

    // Alpha: STAND PAT.
    await alpha.click('[data-reason="protect-cap-room"]');
    await alpha.waitForSelector(".banner:text('locked in')");
    console.log("[e2e] Alpha stood pat");

    // Beta: CUT SCORER + sign the veteran (a real upgrade: 58 -> 65 rated).
    await beta.click('.roster-slot[data-slot="SCORER"]');
    await beta.waitForSelector('.veteran-card[data-veteran-id="vet-sc"]');
    await beta.click('.veteran-card[data-veteran-id="vet-sc"]');
    await beta.waitForSelector(".banner:text('locked in')");
    console.log("[e2e] Beta cut its Scorer and signed the veteran");

    // Gamma & Delta: both cut PLAYMAKER and bid on tgt-pm (reserve $35). Gamma bids high and wins;
    // Delta bids low and loses — the real competing-bids-plus-a-lost-bid scenario.
    async function cutAndBid(page, targetTotal) {
      await page.click('.roster-slot[data-slot="PLAYMAKER"]');
      await page.waitForSelector('.target-card[data-target-id="tgt-pm"]');
      const clicks = targetTotal / 5 - 1; // stepper starts at the $5M minimum
      for (let i = 0; i < clicks; i += 1) {
        await page.click('.target-card[data-target-id="tgt-pm"] [data-step="1"]');
      }
      await page.waitForSelector(`.target-card[data-target-id="tgt-pm"] [data-readout]:text('$${targetTotal}M')`);
      await page.click('.target-card[data-target-id="tgt-pm"] [data-submit-bid]');
      await page.waitForSelector(".banner:text('locked in')");
    }
    await cutAndBid(gamma, 40); // clears the $35 reserve
    await cutAndBid(delta, 10); // a lowball — must lose
    console.log("[e2e] Gamma bid $40 and Delta bid $10 on the same scarce target (Deshawn Ruiz)");

    await beta.screenshot({ path: path.join(SCREEN_DIR, "03-play-committed-recap.png") });

    await teach.click("#btnAdvance"); // PLAY -> REVEAL
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");

    // Teacher-triggered staged reveal: click through every target.
    for (let i = 0; i < 4; i += 1) {
      await teach.click("#btnRevealNext");
      await teach.waitForTimeout(250);
    }
    await board.waitForSelector(".synthesis-note:text('Every target has been revealed')");
    console.log("[e2e] teacher revealed all four deadline targets");

    await board.screenshot({ path: path.join(SCREEN_DIR, "04-board-reveal-theater.png") });

    // Stand-pat teams stay engaged during the reveal too — Alpha's own REVEAL screen (polling live, no
    // reload needed — this is the same SPA page since HOOK) must show its stand-pat decision as context.
    await alpha.waitForSelector(".eyebrow:text('Stood pat')");
    const alphaRevealText = await alpha.evaluate(() => document.body.innerText);
    assert.match(alphaRevealText, /protecting our cap room/i, "Alpha's REVEAL recap should show its own stand-pat reason");

    // Each page polls independently on its own ~1.2s cadence — wait for THEIR OWN recap to actually show the
    // outcome word, rather than racing a single evaluate() against whatever poll tick happened to land first.
    await gamma.waitForFunction(() => document.body.innerText.includes("WON"), null, { timeout: 15000 });
    await delta.waitForFunction(() => document.body.innerText.includes("LOST"), null, { timeout: 15000 });
    console.log("[e2e] confirmed: Gamma's bid WON, Delta's bid LOST — verified from their own REVEAL screens");

    await teach.click("#btnAdvance"); // REVEAL -> ADAPT
    await teach.waitForSelector(".phasechip.current:text('ADAPT')");

    // Delta has the open slot; rescue it. Alpha/Beta/Gamma should have nothing to do.
    await delta.waitForSelector(".rescue-grid .market-card");
    await delta.locator(".rescue-grid .market-card").first().click();
    await delta.waitForSelector(".banner:text('Rescue signed')");
    console.log("[e2e] Delta rescued its open PLAYMAKER slot");

    await gamma.waitForFunction(() => document.body.innerText.includes("nothing to do here"), null, { timeout: 15000 });

    await delta.screenshot({ path: path.join(SCREEN_DIR, "05-play-adapt-rescue.png") });

    await teach.click("#btnAdvance"); // ADAPT -> SYNTHESIS
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    await board.waitForSelector(".synthcard");
    const boardSynthesisText = await board.evaluate(() => document.body.innerText);
    assert.match(boardSynthesisText, /DEAD CAP/i);
    assert.match(boardSynthesisText, /NO DOMINANT STRATEGY/i);
    console.log("[e2e] SYNTHESIS cards rendered on the board with real session numbers");

    await board.screenshot({ path: path.join(SCREEN_DIR, "06-board-synthesis.png") });
    await teach.screenshot({ path: path.join(SCREEN_DIR, "07-teach-aggregate.png"), fullPage: true });

    await teach.click("#btnAdvance"); // SYNTHESIS -> COMPLETE
    await teach.waitForSelector(".phasechip.current:text('COMPLETE')");
    await board.waitForSelector(".label:text('Trade Deadline Complete')");
    console.log("[e2e] reached COMPLETE on /board");

    if (consoleErrors.length > 0) {
      console.error("[e2e] CONSOLE ERRORS DETECTED:\n" + consoleErrors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("[e2e] zero console errors across all 6 pages");
    }
    console.log("[e2e] PASS — full L2 arc verified end to end.");
  } catch (error) {
    console.error("[e2e] FAILED:", error);
    console.error("[e2e] server log tail:\n" + serverLog.split("\n").slice(-40).join("\n"));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
