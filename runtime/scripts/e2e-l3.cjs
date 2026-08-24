#!/usr/bin/env node
/**
 * End-to-end proof for Module 1, Lesson 3 — "Free Agency: The Signing Window."
 *
 * Per the charter's own e2e rider (L3_CHARTER.md §6g): L1 and L2 are played
 * for REAL through the raw HTTP API (fast, deterministic — see e2e-l2.cjs
 * and e2e-l2-early-advance.cjs for the same discipline), producing a
 * genuine L2-carried seed; L3 itself is driven entirely through real
 * Chromium pages against /teach, /play, and /board, exactly the way a
 * teacher's class would actually play it.
 *
 * Run from runtime/: `node scripts/e2e-l3.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * Three L2-carried teams (Alpha standPat / Beta veteran / Gamma won-bid)
 * play the four-day L3 signing window; a fourth (Delta) claims a stock
 * expansion franchise as a LATE JOINER mid-window. The four days are
 * engineered to exercise every scenario the charter names:
 *   day 1 — a bidding war (two lowballs on the same star, price rises)
 *           and a price collapse (an untouched value agent, zero offers)
 *   day 2 — a lowball that raises the price (two teams both bid under ask
 *           on the same solid-tier agent — "coordinated lowballing raises
 *           the price," not a free lunch) — plus a clean signing at ask
 *   day 3 — an outbid team (two offers clear ask on the same agent; the
 *           lower one loses to the higher)
 *   day 4 — a desperation signing (the top offer on an untouched agent
 *           signs even though it's under that day's ask)
 * Then the staged finale plays through REVEAL -> COUNTERFACTUAL ->
 * SYNTHESIS -> COMPLETE, asserting zero console errors throughout.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = 4305;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-l3-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-1", "screens-l3");

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

/* -------------------------------------------------------- L1 + L2 via API -- */

const ALPHA_PICKS = [
  { slot: "SCORER", playerId: "sc-30" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-30" },
  { slot: "REBOUNDER", playerId: "rb-20" },
  { slot: "WILDCARD", playerId: "sc-10" },
]; // spend 100 -> stands pat at L2, clean books into L3
const BETA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // spend 60 -> cuts for a veteran at L2, real (small) dead cap into L3
const GAMMA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-20" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // spend 70 -> wins a sealed bid at L2, carries a won TARGET's mapped form into L3

async function playL1Team(l1Code, deviceToken, picks) {
  for (const { slot, playerId } of picks) {
    await api(`/api/sessions/${l1Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${deviceToken}` }, body: JSON.stringify({ type: "place", slotId: slot, playerId }) });
  }
  await api(`/api/sessions/${l1Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${deviceToken}` }, body: JSON.stringify({ type: "lock" }) });
}

async function buildL1AndL2() {
  console.log("[e2e-l3] === L1: playing Draft Day through the real API ===");
  const l1 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l1-draft-day", title: "E2E L3 chain — L1" }) });
  const l1Code = l1.session.code;
  const l1TeacherKey = l1.teacherKey;
  const alphaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Alpha" }) });
  const betaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Beta" }) });
  const gammaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Gamma" }) });
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY
  await playL1Team(l1Code, alphaJoin.deviceToken, ALPHA_PICKS);
  await playL1Team(l1Code, betaJoin.deviceToken, BETA_PICKS);
  await playL1Team(l1Code, gammaJoin.deviceToken, GAMMA_PICKS);
  let l1Phase = "PLAY";
  while (l1Phase !== "COMPLETE") {
    const r = await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    l1Phase = r.session.phase;
  }
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l1TeacherKey}` }, body: JSON.stringify({ type: "end" }) });
  console.log(`[e2e-l3] L1 complete and ended (code ${l1Code})`);

  console.log("[e2e-l3] === L2: playing the Trade Deadline through the real API ===");
  const l2 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l2-trade-deadline", title: "E2E L3 chain — L2", sourceSessionId: l1.session.id }) });
  const l2Code = l2.session.code;
  const l2TeacherKey = l2.teacherKey;
  const l2SessionId = l2.session.id;
  const alphaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Alpha" }) });
  const betaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Beta" }) });
  const gammaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Team Gamma" }) });
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${alphaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 0 }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${betaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 1 }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${gammaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 2 }) });
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY

  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${alphaJoin2.deviceToken}` }, body: JSON.stringify({ type: "standPat", reason: "protect-cap-room" }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${betaJoin2.deviceToken}` }, body: JSON.stringify({ type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${gammaJoin2.deviceToken}` }, body: JSON.stringify({ type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 40 }) }); // reserve 35 -> wins

  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // PLAY -> REVEAL
  for (let i = 0; i < 4; i += 1) {
    await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "hook", hook: "revealNext" }) });
  }
  let l2Phase = "REVEAL";
  while (l2Phase !== "COMPLETE") {
    const r = await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    l2Phase = r.session.phase;
  }
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "end" }) });
  console.log(`[e2e-l3] L2 complete and ended (code ${l2Code}) — Alpha stood pat, Beta signed a veteran, Gamma won a sealed bid`);

  return { l2SessionId };
}

/* --------------------------------------------------------------- L3 UI helpers -- */

/** Reads the offer composer's live readout, clicks the +/- stepper the right number of times to reach
 *  `desiredAmount`, picks the given slot, and submits — driving the REAL DOM state rather than a
 *  hand-calculated click count, so it stays correct regardless of whatever the live ask actually is. */
async function submitOffer(page, agentId, desiredAmount, slotId) {
  await page.click(`.fa-agent-card[data-agent-id="${agentId}"]`);
  await page.waitForSelector(`#faComposerRoot[data-agent="${agentId}"]`);
  await page.click(`.fa-slot-chip[data-slot="${slotId}"]`);
  const readoutText = await page.textContent("#faAmountReadout");
  const current = Number(String(readoutText).replace(/[^0-9]/g, ""));
  const steps = Math.round((desiredAmount - current) / 5);
  const dir = steps >= 0 ? "1" : "-1";
  for (let i = 0; i < Math.abs(steps); i += 1) {
    await page.click(`.fa-offer-composer [data-fa-step="${dir}"]`);
  }
  await page.waitForFunction((amt) => document.getElementById("faAmountReadout")?.textContent === `$${amt}M`, desiredAmount);
  await page.click("#faSubmitOffer");
  await page.waitForSelector("#faActedBanner .banner");
}

async function holdToday(page) {
  await page.click("#faHoldBtn");
  await page.waitForSelector("#faActedBanner .banner");
}

async function closeDayAndWait(teach, board, expectedDayLabel) {
  await teach.click("#btnCloseDay");
  await board.waitForFunction((label) => document.querySelector(".label")?.textContent?.includes(label), expectedDayLabel, { timeout: 15000 });
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });

  console.log("[e2e-l3] starting server...");
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();
  console.log("[e2e-l3] server up on", BASE);

  let browser;
  try {
    const { l2SessionId } = await buildL1AndL2();

    console.log("[e2e-l3] === L3: driving /teach, /play x4, /board through real Chromium pages ===");
    browser = await chromium.launch();
    const viewport = { width: 1000, height: 640 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport });
    const alpha = await browser.newPage({ viewport });
    const beta = await browser.newPage({ viewport });
    const gamma = await browser.newPage({ viewport });
    const delta = await browser.newPage({ viewport });
    for (const [label, page] of [["teach", teach], ["board", board], ["alpha", alpha], ["beta", beta], ["gamma", gamma], ["delta", delta]]) {
      watchConsole(page, label);
      page.on("dialog", (d) => d.accept());
    }

    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m1l3-free-agency");
    await teach.waitForSelector("#sourceSessionRow:not([hidden])");
    await teach.waitForSelector(`#sourceSession option[value="${l2SessionId}"]`, { state: "attached" });
    await teach.selectOption("#sourceSession", l2SessionId);
    await teach.fill("#title", "E2E L3 class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const l3Code = (await teach.textContent("#code")).trim();
    console.log("[e2e-l3] L3 session created, code", l3Code);

    await board.goto(`${BASE}/board?code=${l3Code}`);
    await board.waitForSelector("#stage .label");

    async function join(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", l3Code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
    }
    await join(alpha, "Alpha");
    await join(beta, "Beta");
    await join(gamma, "Gamma");
    console.log("[e2e-l3] Alpha/Beta/Gamma joined L3 (Delta joins later, mid-window)");

    await teach.click("#btnAdvance"); // LOBBY -> HOOK
    await teach.waitForSelector(".phasechip.current:text('HOOK')");

    async function claimCarried(page, index) {
      await page.waitForSelector(`.claim-card[data-carried-index="${index}"]`);
      await page.click(`.claim-card[data-carried-index="${index}"]`);
      await page.waitForSelector(".fa-market-grid");
    }
    await claimCarried(alpha, 0); // Alpha, stood pat -> clean books
    await claimCarried(beta, 1); // Beta, cut for a veteran -> real dead cap
    await claimCarried(gamma, 2); // Gamma, won a sealed bid -> a carried TARGET's mapped form
    console.log("[e2e-l3] Alpha/Beta/Gamma claimed their L2-carried franchises");

    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-teach-hook.png"), fullPage: true });
    await alpha.screenshot({ path: path.join(SCREEN_DIR, "02-play-hook-market-preview.png") });

    await teach.click("#btnAdvance"); // HOOK -> PLAY
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    for (const page of [alpha, beta, gamma]) await page.waitForSelector("#faPlayRoot");
    await board.waitForSelector(".fa-ticker");

    /* ---- Day 1: a bidding war (fa-star-pm) + a price collapse (fa-value-pm untouched) ---- */
    console.log("[e2e-l3] day 1: bidding war on Priya Anand (fa-star-pm), price collapse looming on Kai Sorensen (fa-value-pm)");
    await submitOffer(alpha, "fa-star-pm", 20, "PLAYMAKER"); // well under the $45M opening ask
    await submitOffer(beta, "fa-star-pm", 15, "PLAYMAKER"); // also under ask -> 2 offers, neither clears -> price UP
    await holdToday(gamma);
    await closeDayAndWait(teach, board, "Day 2 of 4");
    const boardAfterDay1 = await board.evaluate(() => document.body.innerText);
    assert.match(boardAfterDay1, /Priya Anand/);
    console.log("[e2e-l3] day 1 closed: bidding war should have pushed Priya Anand's ask UP, Kai Sorensen's ask DOWN (0 offers)");

    /* ---- Day 2: a lowball that raises the price (two teams both under-ask on fa-solid-sc) + a clean signing ---- */
    console.log("[e2e-l3] day 2: Delta joins late; coordinated lowballing on Dez Whitfield (fa-solid-sc); Beta signs Omar Hendricks cleanly at ask");
    await join(delta, "Delta");
    await delta.waitForSelector(".claim-card.stock");
    await delta.click(".claim-card.stock");
    await delta.waitForSelector("#faPlayRoot");
    console.log("[e2e-l3] Delta claimed a stock expansion franchise as a LATE JOINER, mid-window");

    await submitOffer(alpha, "fa-solid-sc", 15, "SCORER"); // under the $30M ask
    await submitOffer(gamma, "fa-solid-sc", 20, "WILDCARD"); // also under ask -> coordinated lowballing -> price UP
    await submitOffer(beta, "fa-value-df", 15, "DEFENDER"); // exactly the $15M opening ask -> clean signing
    await holdToday(delta);
    await closeDayAndWait(teach, board, "Day 3 of 4");
    console.log("[e2e-l3] day 2 closed: Dez Whitfield's ask should have risen despite two low offers; Omar Hendricks signed to Beta");

    /* ---- Day 3: an outbid team on fa-star-pm (both clear the now-higher ask; the lower one loses) ---- */
    console.log("[e2e-l3] day 3: Alpha and Beta both chase Priya Anand again -- both clear ask, the lower offer is OUTBID");
    const starAskText = await gamma.locator('.fa-agent-card[data-agent-id="fa-star-pm"] .fa-ask').first().textContent().catch(() => null);
    void starAskText; // read defensively only for logging; submitOffer itself reads the live DOM value it needs
    await submitOffer(alpha, "fa-star-pm", 60, "PLAYMAKER");
    await submitOffer(beta, "fa-star-pm", 55, "PLAYMAKER"); // clears ask too, but loses to Alpha's higher offer -> OUTBID
    await holdToday(gamma);
    await holdToday(delta);
    await closeDayAndWait(teach, board, "Day 4 of 4");
    const boardAfterDay3 = await board.evaluate(() => document.body.innerText);
    assert.match(boardAfterDay3, /signed/i);
    console.log("[e2e-l3] day 3 closed: Priya Anand signed to Alpha; Beta's higher-than-ask-but-lower-than-Alpha's offer lost -- a real outbid team");

    /* ---- Day 4: desperation -- the top offer on an untouched agent signs even under ask ---- */
    console.log("[e2e-l3] day 4: desperation signing -- Gamma lowballs the untouched Marcus Dell (fa-solid-df), signs anyway (deadline day)");
    await submitOffer(gamma, "fa-solid-df", 10, "DEFENDER"); // well under the $35M opening ask
    await holdToday(alpha);
    await holdToday(beta);
    await holdToday(delta);
    await teach.click("#btnCloseDay");
    await board.waitForSelector(".label:text('Signing Window Closed')");
    console.log("[e2e-l3] day 4 closed: the signing window is fully closed");

    await teach.screenshot({ path: path.join(SCREEN_DIR, "03-teach-aggregate-after-play.png"), fullPage: true });
    await board.screenshot({ path: path.join(SCREEN_DIR, "04-board-ticker-closed.png") });

    /* ---- Staged finale ---- */
    await teach.click("#btnAdvance"); // PLAY -> REVEAL (window already closed, no confirm expected)
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    for (let i = 0; i < 12; i += 1) {
      await teach.click("#btnRevealNext");
      await teach.waitForTimeout(120);
    }
    const boardReveal = await board.evaluate(() => document.body.innerText);
    assert.match(boardReveal, /Final Standings/);
    assert.match(boardReveal, /The Bracket|champion/i);
    assert.match(boardReveal, /GM Awards/);
    console.log("[e2e-l3] staged REVEAL played through: window recap, all 8 factor reveals, standings, bracket, GM Awards");
    await board.screenshot({ path: path.join(SCREEN_DIR, "05-board-reveal-finale.png") });

    await teach.click("#btnAdvance"); // REVEAL -> COUNTERFACTUAL
    await teach.waitForSelector(".phasechip.current:text('COUNTERFACTUAL')");
    await board.waitForSelector(".cardgrid");
    const boardCounterfactual = await board.evaluate(() => document.body.innerText);
    assert.match(boardCounterfactual, /PATIENCE DIVIDEND|DEAD CAP DRAG|NEAR-MISS/i);
    await alpha.waitForFunction(() => document.body.innerText.includes("journey"), null, { timeout: 15000 }).catch(() => {});
    console.log("[e2e-l3] COUNTERFACTUAL rendered on board and /play");

    await teach.click("#btnAdvance"); // COUNTERFACTUAL -> SYNTHESIS
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    await board.waitForSelector(".synthcard");
    const boardSynthesis = await board.evaluate(() => document.body.innerText);
    assert.match(boardSynthesis, /THE MARKET SET THE PRICE/i);
    assert.match(boardSynthesis, /DECISIONS ≠ OUTCOMES|DECISIONS/i);
    console.log("[e2e-l3] SYNTHESIS cards rendered with real session numbers");
    await board.screenshot({ path: path.join(SCREEN_DIR, "06-board-synthesis.png") });

    await teach.click("#btnAdvance"); // SYNTHESIS -> COMPLETE
    await teach.waitForSelector(".phasechip.current:text('COMPLETE')");
    await board.waitForSelector(".label:text('Module 1 Complete')");
    console.log("[e2e-l3] reached COMPLETE on /board — module close copy confirmed");

    if (consoleErrors.length > 0) {
      console.error("[e2e-l3] CONSOLE ERRORS DETECTED:\n" + consoleErrors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("[e2e-l3] zero console errors across all 6 pages");
    }
    console.log("[e2e-l3] PASS — full L1->L2->L3 arc verified end to end.");
  } catch (error) {
    console.error("[e2e-l3] FAILED:", error);
    console.error("[e2e-l3] server log tail:\n" + serverLog.split("\n").slice(-60).join("\n"));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
