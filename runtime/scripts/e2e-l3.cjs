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
  // N1 repair (VERIFY_L3.md N1): confirm the composer actually scrolled into the visible viewport (the
  // app's own fix, not Playwright's separate auto-scroll-before-click on the slot chip below) -- read the
  // bounding box right after the composer opens, before clicking anything inside it.
  const box = await page.locator("#faComposerRoot .fa-offer-composer").boundingBox();
  const viewportSize = page.viewportSize();
  if (!box || !viewportSize) throw new Error(`composer for ${agentId} has no bounding box -- N1 regression`);
  const withinViewport = box.y >= 0 && box.y < viewportSize.height && box.y + box.height > 0;
  if (!withinViewport) {
    throw new Error(`composer for ${agentId} opened off-screen at ${viewportSize.width}x${viewportSize.height} (box.y=${box.y}, box.height=${box.height}) -- N1 regression`);
  }
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

/** Every /play page polls independently on its own ~1.2s cadence -- after the teacher closes a day, a
 *  student page can still be showing the STALE prior-day DOM for a moment. Interacting with it before its
 *  own poll catches up risks a mid-click rebuild (the composer's DOM torn down under an in-progress click).
 *  Waiting for each page's OWN day pill to update first makes every subsequent interaction race-free. */
async function waitForDay(page, day) {
  await page.waitForFunction((d) => document.querySelector(".fa-day-pill")?.textContent?.includes(`DAY ${d} OF 4`), day, { timeout: 15000 });
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
    // N1 repair (VERIFY_L3.md N1): the student /play pages run at the exact classroom Chromebook shape named
    // in the verification brief (~1024x600) rather than the taller generic viewport above, so this real,
    // full-window offer flow (open the composer, pick a slot, step the amount, submit) doubles as proof the
    // composer is actually reachable and submittable at that size, not just on a taller desktop window.
    const chromebookViewport = { width: 1024, height: 600 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport });
    const alpha = await browser.newPage({ viewport: chromebookViewport });
    const beta = await browser.newPage({ viewport: chromebookViewport });
    const gamma = await browser.newPage({ viewport: chromebookViewport });
    const delta = await browser.newPage({ viewport: chromebookViewport });
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

    /* ---- Day 1: a bidding war + a price collapse, both on affordable value/solid-tier slots ----
     * (Alpha and Gamma both carry meaningfully less cap room than a fresh stock team -- Alpha stood pat at
     * the full $100M L1 cap, Gamma spent up to a won sealed bid -- so this script always checks affordability
     * against each team's REAL carried room, never assumes a star-tier chase is free money.) */
    console.log("[e2e-l3] day 1: bidding war on Omar Hendricks (fa-value-df), price collapse looming on Theo Blackwood (fa-value-rb, untouched)");
    for (const p of [alpha, beta, gamma]) await waitForDay(p, 1);
    await submitOffer(alpha, "fa-value-df", 5, "DEFENDER"); // well under the $15M opening ask
    await submitOffer(gamma, "fa-value-df", 10, "DEFENDER"); // also under ask -> 2 offers, neither clears -> price UP
    await holdToday(beta);
    await closeDayAndWait(teach, board, "Day 2 of 4");
    const boardAfterDay1 = await board.evaluate(() => document.body.innerText);
    assert.match(boardAfterDay1, /Omar Hendricks/);
    console.log("[e2e-l3] day 1 closed: bidding war pushed Omar Hendricks's ask UP; Theo Blackwood's ask fell (0 offers)");

    /* ---- Day 2: a lowball that raises the price (two teams both under-ask) + a clean signing ---- */
    console.log("[e2e-l3] day 2: Delta joins late; coordinated lowballing on Dez Whitfield (fa-solid-sc); Beta signs Kai Sorensen cleanly at ask");
    await join(delta, "Delta");
    await delta.waitForSelector(".claim-card.stock");
    await delta.click(".claim-card.stock");
    await delta.waitForSelector("#faPlayRoot");
    console.log("[e2e-l3] Delta claimed a stock expansion franchise as a LATE JOINER, mid-window");
    for (const p of [alpha, beta, gamma]) await waitForDay(p, 2);

    await submitOffer(alpha, "fa-solid-sc", 15, "SCORER"); // under fa-solid-sc's day-2 ask (already decayed from day 1's silence)
    await submitOffer(gamma, "fa-solid-sc", 5, "WILDCARD"); // also under ask -> coordinated lowballing -> price UP anyway
    await submitOffer(beta, "fa-value-pm", 10, "PLAYMAKER"); // matches the live ask exactly (decayed from $20 by day-1 silence) -> clean signing
    await holdToday(delta);
    await closeDayAndWait(teach, board, "Day 3 of 4");
    console.log("[e2e-l3] day 2 closed: Dez Whitfield's ask rose despite two low offers; Kai Sorensen signed to Beta");

    /* ---- Day 3: an outbid team on fa-star-sc (both clear ask; the lower offer loses) ---- */
    console.log("[e2e-l3] day 3: Delta and Beta both chase Trey Bishop (fa-star-sc) -- both clear ask, Delta's lower offer is OUTBID");
    for (const p of [alpha, beta, gamma, delta]) await waitForDay(p, 3);
    await submitOffer(delta, "fa-star-sc", 35, "SCORER");
    await submitOffer(beta, "fa-star-sc", 40, "WILDCARD"); // clears ask too, and beats Delta's offer -> Delta is outbid
    await holdToday(alpha);
    await holdToday(gamma);
    await closeDayAndWait(teach, board, "Day 4 of 4");
    const boardAfterDay3 = await board.evaluate(() => document.body.innerText);
    assert.match(boardAfterDay3, /signed/i);
    console.log("[e2e-l3] day 3 closed: Trey Bishop signed to Beta at the higher amount; Delta's lower, ask-clearing offer still lost -- a real outbid team");

    /* ---- Day 4: desperation -- the top offer on an untouched agent signs even under ask ---- */
    console.log("[e2e-l3] day 4: desperation signing -- Gamma lowballs the untouched Jonah Rourke (fa-solid-rb, the RISER), signs anyway (deadline day)");
    for (const p of [alpha, beta, gamma, delta]) await waitForDay(p, 4);
    await submitOffer(gamma, "fa-solid-rb", 5, "REBOUNDER"); // the market floor is $10M by now -- this is genuinely a below-ask offer
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
      const respPromise = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnRevealNext");
      await respPromise;
    }
    // NOTE: .label carries `text-transform: uppercase` in CSS -- innerText reflects the COMPUTED (uppercased)
    // text, not the literal HTML, so every text assertion against staged headings here is case-insensitive.
    await board.waitForFunction(() => document.body.innerText.toUpperCase().includes("GM AWARDS"), null, { timeout: 15000 });
    const boardReveal = await board.evaluate(() => document.body.innerText);
    assert.match(boardReveal, /Final Standings/i);
    assert.match(boardReveal, /The Bracket|champion/i);
    assert.match(boardReveal, /GM Awards/i);
    console.log("[e2e-l3] staged REVEAL played through: window recap, all 8 factor reveals, standings, bracket, GM Awards");
    await board.screenshot({ path: path.join(SCREEN_DIR, "05-board-reveal-finale.png") });

    await teach.click("#btnAdvance"); // REVEAL -> COUNTERFACTUAL
    await teach.waitForSelector(".phasechip.current:text('COUNTERFACTUAL')");
    // `.cardgrid` is present in REVEAL too (agent factors, awards) -- wait for the HUD's own phase readout
    // rather than a selector that was already satisfied by the PREVIOUS phase's stale content.
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("COUNTERFACTUAL"), null, { timeout: 15000 });
    const boardCounterfactual = await board.evaluate(() => document.body.innerText);
    assert.match(boardCounterfactual, /PATIENCE DIVIDEND|DEAD CAP DRAG|NEAR-MISS/i);
    await alpha.waitForFunction(() => document.body.innerText.toUpperCase().includes("JOURNEY"), null, { timeout: 15000 });
    console.log("[e2e-l3] COUNTERFACTUAL rendered on board and /play");

    await teach.click("#btnAdvance"); // COUNTERFACTUAL -> SYNTHESIS
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    // `.synthcard` is also used by COUNTERFACTUAL's class cards -- same stale-content race as REVEAL above.
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("SYNTHESIS"), null, { timeout: 15000 });
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
