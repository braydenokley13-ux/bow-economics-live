#!/usr/bin/env node
/**
 * M1 EXTENDED pixel-baseline capture — Draft Day (L1), Trade Deadline (L2),
 * Free Agency (L3) across /play, /teach, /board.
 *
 * Extends shots-m1.cjs: (1) scrubs the session code and rejoin PIN (in
 * addition to clock-like strings) so /play and /teach become byte-stable
 * across two independent runs; (2) drives L1 through join/lobby/hook/first
 * PLAY/locked-roster/REVEAL/SYNTHESIS; (3) drives L2 (linked to a REAL,
 * API-completed L1 session, exactly the technique in
 * runtime/scripts/e2e-l2.cjs) through lobby/midseason-report/decision-screen
 * /reveal; (4) drives L3 (linked to a REAL, API-completed L1->L2 chain,
 * exactly the technique in runtime/scripts/e2e-l3.cjs) through
 * lobby/day-1-market/one-reveal-state, tolerating the documented composer
 * race with one retry.
 *
 * Never modifies repository files. Boots its OWN server (given --port) with
 * its own --snapshot file and writes only into --out. Rerunnable.
 *
 * Usage: node shots-m1-extended.cjs --port 4431 --out /path/to/outdir --dist /path/to/runtime/dist --root /path/to/runtime
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const PORT = arg("port", "4431");
const OUT = path.resolve(arg("out", "./m1-baseline-extended"));
const ROOT = path.resolve(arg("root", "/home/user/bow-economics-live/runtime"));
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(OUT, "snap.json");

fs.mkdirSync(OUT, { recursive: true });
try { fs.unlinkSync(SNAPSHOT_FILE); } catch { /* fine if absent */ }

const manifest = [];
const notes = []; // free-text observations (races, retries, anything not byte-deterministic by design)

async function waitForServer() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/lessons`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up on " + BASE);
}

/* ---------------------------------------------------------- raw API helper -- */
async function api(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

/* -------------------------------------------------- scrub clocks / session -- */
async function scrubClocks(page) {
  return page.evaluate(() => {
    const TIME_RE = /\b\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM|am|pm)?\b/;
    const hits = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || "").trim();
      if (t && TIME_RE.test(t)) {
        el.setAttribute("data-qa-clock-hidden", "true");
        el.style.visibility = "hidden";
        hits.push(t);
      }
    }
    return hits;
  });
}

/** Scrubs the session join code (#code, #boardUrl which embeds ?code=, and
 *  any leaf element whose own text equals or contains the code) and the
 *  rejoin PIN (#pinDisplay / .pinbox / .pin) by visibility:hidden. */
async function scrubSession(page, code) {
  return page.evaluate((code) => {
    const hits = [];
    const hide = (el, why) => {
      if (getComputedStyle(el).visibility !== "hidden") {
        el.style.visibility = "hidden";
        hits.push(why);
      }
    };
    for (const sel of ["#code", "#pinDisplay", ".pinbox", ".pin", "#boardUrl", "#joinUrl"]) {
      document.querySelectorAll(sel).forEach((el) => hide(el, `${sel}:"${(el.textContent || "").trim()}"`));
    }
    if (code) {
      for (const el of document.querySelectorAll("body *")) {
        if (el.children.length > 0) continue;
        const t = (el.textContent || "").trim();
        if (t && t.includes(code)) hide(el, `text-match:"${t}"`);
      }
    }
    return hits;
  }, code);
}

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

async function shot(page, name, meta, code) {
  const hiddenClocks = await scrubClocks(page);
  const hiddenSession = code ? await scrubSession(page, code) : [];
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, animations: "disabled" });
  manifest.push({ file: name, ...meta, scrubbedClockStrings: hiddenClocks, scrubbedSessionStrings: hiddenSession });
  console.log("[shots-m1-ext] wrote", name);
}

const VP_STUDENT = { width: 1366, height: 768 };
const VP_TEACH = { width: 1366, height: 768 };
const VP_BOARD = { width: 1920, height: 1080 };

/* ============================================================ L1 backbone == */
// Deterministic picks reused from runtime/scripts/e2e-l2.cjs / e2e-l3.cjs so
// this exact combination is already proven to be valid, affordable, and
// distinct across positions.
const ALPHA_PICKS = [
  { slot: "SCORER", playerId: "sc-30" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-30" },
  { slot: "REBOUNDER", playerId: "rb-20" },
  { slot: "WILDCARD", playerId: "sc-10" },
];
const BETA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
];
const GAMMA_PICKS = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-20" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
];

async function playL1TeamViaApi(l1Code, deviceToken, picks) {
  for (const { slot, playerId } of picks) {
    await api(`/api/sessions/${l1Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${deviceToken}` }, body: JSON.stringify({ type: "place", slotId: slot, playerId }) });
  }
  await api(`/api/sessions/${l1Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${deviceToken}` }, body: JSON.stringify({ type: "lock" }) });
}

/** Builds a REAL, ended L1 class of three teams (Alpha/Beta/Gamma) purely
 *  through the raw HTTP API — the exact technique e2e-l2.cjs and e2e-l3.cjs
 *  use to produce genuine carried state for the next lesson, never a
 *  hand-forged snapshot. Returns the L1 session id for linking. */
async function buildCompletedL1() {
  const l1 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l1-draft-day", title: "M1-ext seed L1" }) });
  const l1Code = l1.session.code;
  const teacherKey = l1.teacherKey;
  const alphaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Alpha" }) });
  const betaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Beta" }) });
  const gammaJoin = await api(`/api/sessions/${l1Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Gamma" }) });
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${teacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${teacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY
  await playL1TeamViaApi(l1Code, alphaJoin.deviceToken, ALPHA_PICKS);
  await playL1TeamViaApi(l1Code, betaJoin.deviceToken, BETA_PICKS);
  await playL1TeamViaApi(l1Code, gammaJoin.deviceToken, GAMMA_PICKS);
  let phase = "PLAY";
  while (phase !== "COMPLETE") {
    const r = await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${teacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    phase = r.session.phase;
  }
  await api(`/api/sessions/${l1Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${teacherKey}` }, body: JSON.stringify({ type: "end" }) });
  return l1.session.id;
}

/** Builds a REAL, ended L1->L2 chain (Alpha standPat / Beta veteran / Gamma
 *  won bid) purely through the raw HTTP API — exactly e2e-l3.cjs's
 *  buildL1AndL2(), reused here to seed L3. */
async function buildCompletedL1AndL2() {
  const l1SessionId = await buildCompletedL1();
  const l2 = await api("/api/sessions", { method: "POST", body: JSON.stringify({ lessonModuleId: "m1l2-trade-deadline", title: "M1-ext seed L2", sourceSessionId: l1SessionId }) });
  const l2Code = l2.session.code;
  const l2TeacherKey = l2.teacherKey;
  const alphaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Alpha" }) });
  const betaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Beta" }) });
  const gammaJoin2 = await api(`/api/sessions/${l2Code}/join`, { method: "POST", body: JSON.stringify({ displayName: "Gamma" }) });
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // LOBBY -> HOOK
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${alphaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 0 }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${betaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 1 }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${gammaJoin2.deviceToken}` }, body: JSON.stringify({ type: "claim", carriedIndex: 2 }) });
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // HOOK -> PLAY
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${alphaJoin2.deviceToken}` }, body: JSON.stringify({ type: "standPat", reason: "protect-cap-room" }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${betaJoin2.deviceToken}` }, body: JSON.stringify({ type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }) });
  await api(`/api/sessions/${l2Code}/actions`, { method: "POST", headers: { Authorization: `Bearer ${gammaJoin2.deviceToken}` }, body: JSON.stringify({ type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 40 }) });
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) }); // PLAY -> REVEAL
  for (let i = 0; i < 4; i += 1) {
    await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "hook", hook: "revealNext" }) });
  }
  let phase = "REVEAL";
  while (phase !== "COMPLETE") {
    const r = await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "advance" }) });
    phase = r.session.phase;
  }
  await api(`/api/sessions/${l2Code}/control`, { method: "POST", headers: { Authorization: `Bearer ${l2TeacherKey}` }, body: JSON.stringify({ type: "end" }) });
  return l2.session.id;
}

/* ==================================================================== L1 == */
async function captureL1(browser) {
  console.log("[shots-m1-ext] === L1 Draft Day: browser-driven capture ===");
  const play1 = await browser.newPage({ viewport: VP_STUDENT });
  const play2 = await browser.newPage({ viewport: VP_STUDENT });
  const teach = await browser.newPage({ viewport: VP_TEACH });
  const board = await browser.newPage({ viewport: VP_BOARD });
  for (const p of [play1, play2, teach, board]) p.on("dialog", (d) => d.accept());

  await play1.goto(`${BASE}/play`);
  await settle(play1);
  await shot(play1, "l1-01-play-join@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "join", viewport: "1366x768" }, null);

  await teach.goto(`${BASE}/teach`);
  await teach.waitForSelector("#lesson option", { state: "attached" });
  await teach.selectOption("#lesson", "m1l1-draft-day");
  await teach.fill("#title", "M1-ext L1 capture");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  console.log("[shots-m1-ext] L1 session created, code", code);

  await board.goto(`${BASE}/board?code=${code}`);
  await board.waitForSelector("#stage .label");

  async function join(page, name) {
    const respPromise = page.waitForResponse((r) => r.url().includes("/join") && r.request().method() === "POST");
    await page.goto(`${BASE}/play`);
    await page.fill("#joinCode", code);
    await page.fill("#joinName", name);
    await page.click("#btnJoin");
    const resp = await respPromise;
    const body = await resp.json().catch(() => ({}));
    await page.waitForSelector("#gameCard:not([hidden])");
    return body.deviceToken;
  }
  const token1 = await join(play1, "Riverdale Duo");
  await join(play2, "Maple Court");

  await settle(play1);
  await shot(play1, "l1-02-play-lobby@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "lobby", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l1-03-teach-lobby@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "lobby", viewport: "1366x768" }, code);
  await settle(board);
  await shot(board, "l1-04-board-lobby@1920x1080.png", { lesson: "m1l1-draft-day", surface: "board", state: "lobby", viewport: "1920x1080" }, code);

  await teach.click("#btnAdvance"); // LOBBY -> HOOK
  await teach.waitForSelector(".phasechip.current:text('HOOK')");
  for (const p of [play1, teach, board]) await settle(p);
  await shot(play1, "l1-05-play-hook@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "hook", viewport: "1366x768" }, code);
  await shot(teach, "l1-06-teach-hook@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "hook", viewport: "1366x768" }, code);
  await shot(board, "l1-07-board-hook@1920x1080.png", { lesson: "m1l1-draft-day", surface: "board", state: "hook", viewport: "1920x1080" }, code);

  await teach.click("#btnAdvance"); // HOOK -> PLAY
  await teach.waitForSelector(".phasechip.current:text('PLAY')");
  for (const p of [play1, teach, board]) await settle(p);
  await shot(play1, "l1-08-play-play@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "first-play", viewport: "1366x768" }, code);
  await shot(teach, "l1-09-teach-play@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "first-play", viewport: "1366x768" }, code);
  await shot(board, "l1-10-board-play@1920x1080.png", { lesson: "m1l1-draft-day", surface: "board", state: "first-play", viewport: "1920x1080" }, code);

  // Lock play1's roster via the real API using the deviceToken captured from
  // its own real DOM join above (mixing API+DOM exactly as instructed).
  await playL1TeamViaApi(code, token1, ALPHA_PICKS);
  await play1.waitForSelector("#btnLock[disabled]");
  await settle(play1);
  await shot(play1, "l1-11-play-locked-roster@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "locked-roster", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l1-12-teach-locked-roster@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "locked-roster", viewport: "1366x768" }, code);

  await teach.click("#btnAdvance"); // PLAY -> REVEAL
  await teach.waitForSelector(".phasechip.current:text('REVEAL')");
  for (const p of [play1, teach, board]) await settle(p);
  await shot(play1, "l1-13-play-reveal@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "reveal", viewport: "1366x768" }, code);
  await shot(teach, "l1-14-teach-reveal@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "reveal", viewport: "1366x768" }, code);
  await shot(board, "l1-15-board-reveal@1920x1080.png", { lesson: "m1l1-draft-day", surface: "board", state: "reveal", viewport: "1920x1080" }, code);

  // Advance through CONSEQUENCE / ADAPT / COUNTERFACTUAL / ARGUE to SYNTHESIS
  // (teacher-paced advance; no per-student gating on these phases).
  let guard = 0;
  while (true) {
    const chip = await teach.textContent(".phasechip.current").catch(() => "");
    if (chip && chip.trim().toUpperCase() === "SYNTHESIS") break;
    const respPromise = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
    await teach.click("#btnAdvance");
    await respPromise;
    await teach.waitForTimeout(150);
    guard += 1;
    if (guard > 8) throw new Error("L1 never reached SYNTHESIS");
  }
  for (const p of [play1, teach, board]) await settle(p);
  await shot(play1, "l1-16-play-synthesis@1366x768.png", { lesson: "m1l1-draft-day", surface: "play", state: "synthesis", viewport: "1366x768" }, code);
  await shot(teach, "l1-17-teach-synthesis@1366x768.png", { lesson: "m1l1-draft-day", surface: "teach", state: "synthesis", viewport: "1366x768" }, code);
  await shot(board, "l1-18-board-synthesis@1920x1080.png", { lesson: "m1l1-draft-day", surface: "board", state: "synthesis", viewport: "1920x1080" }, code);

  await play1.close(); await play2.close(); await teach.close(); await board.close();
}

/* ==================================================================== L2 == */
async function captureL2(browser) {
  console.log("[shots-m1-ext] === L2 Trade Deadline: browser-driven capture (linked to a real completed L1) ===");
  const l1SessionId = await buildCompletedL1();

  const alpha = await browser.newPage({ viewport: VP_STUDENT });
  const beta = await browser.newPage({ viewport: VP_STUDENT });
  const gamma = await browser.newPage({ viewport: VP_STUDENT });
  const teach = await browser.newPage({ viewport: VP_TEACH });
  const board = await browser.newPage({ viewport: VP_BOARD });
  for (const p of [alpha, beta, gamma, teach, board]) p.on("dialog", (d) => d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.waitForSelector("#lesson option", { state: "attached" });
  await teach.selectOption("#lesson", "m1l2-trade-deadline");
  await teach.waitForSelector("#sourceSessionRow:not([hidden])");
  await teach.waitForSelector(`#sourceSession option[value="${l1SessionId}"]`, { state: "attached" });
  await teach.selectOption("#sourceSession", l1SessionId);
  await teach.fill("#title", "M1-ext L2 capture");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  console.log("[shots-m1-ext] L2 session created, code", code);

  await board.goto(`${BASE}/board?code=${code}`);
  await board.waitForSelector("#stage .label");

  async function join(page, name) {
    await page.goto(`${BASE}/play`);
    await page.fill("#joinCode", code);
    await page.fill("#joinName", name);
    await page.click("#btnJoin");
    await page.waitForSelector("#gameCard:not([hidden])");
  }
  await join(alpha, "Alpha");
  await join(beta, "Beta");
  await join(gamma, "Gamma");

  await settle(alpha);
  await shot(alpha, "l2-01-play-lobby@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "play", state: "lobby", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l2-02-teach-lobby@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "teach", state: "lobby", viewport: "1366x768" }, code);
  await settle(board);
  await shot(board, "l2-03-board-lobby@1920x1080.png", { lesson: "m1l2-trade-deadline", surface: "board", state: "lobby", viewport: "1920x1080" }, code);

  await teach.click("#btnAdvance"); // LOBBY -> HOOK
  await teach.waitForSelector(".phasechip.current:text('HOOK')");

  async function claimCarried(page, index) {
    await page.waitForSelector(`.claim-card[data-carried-index="${index}"]`);
    await page.click(`.claim-card[data-carried-index="${index}"]`);
    await page.waitForSelector(".report-row");
  }
  await claimCarried(alpha, 0);
  await claimCarried(beta, 1);
  await claimCarried(gamma, 2);

  await settle(alpha);
  await shot(alpha, "l2-04-play-midseason-report@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "play", state: "midseason-report", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l2-05-teach-hook@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "teach", state: "hook", viewport: "1366x768" }, code);

  await teach.click("#btnAdvance"); // HOOK -> PLAY
  await teach.waitForSelector(".phasechip.current:text('PLAY')");
  for (const p of [alpha, beta, gamma]) await p.waitForSelector("#tdWall");

  await settle(alpha);
  await shot(alpha, "l2-06-play-deadline-decision@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "play", state: "deadline-decision-screen", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l2-07-teach-play@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "teach", state: "deadline-decision-screen", viewport: "1366x768" }, code);
  await settle(board);
  await shot(board, "l2-08-board-play@1920x1080.png", { lesson: "m1l2-trade-deadline", surface: "board", state: "deadline-decision-screen", viewport: "1920x1080" }, code);

  // Alpha stands pat -- one real decision so REVEAL has something to show.
  await alpha.click('[data-reason="protect-cap-room"]');
  await alpha.waitForSelector(".banner:text('locked in')");

  await teach.click("#btnAdvance"); // PLAY -> REVEAL
  await teach.waitForSelector(".phasechip.current:text('REVEAL')");
  for (let i = 0; i < 4; i += 1) {
    const respPromise = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
    await teach.click("#btnRevealNext");
    await respPromise;
  }
  await settle(board);
  await shot(board, "l2-09-board-reveal@1920x1080.png", { lesson: "m1l2-trade-deadline", surface: "board", state: "reveal", viewport: "1920x1080" }, code);
  await settle(alpha);
  await shot(alpha, "l2-10-play-reveal@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "play", state: "reveal", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l2-11-teach-reveal@1366x768.png", { lesson: "m1l2-trade-deadline", surface: "teach", state: "reveal", viewport: "1366x768" }, code);

  await alpha.close(); await beta.close(); await gamma.close(); await teach.close(); await board.close();
}

/* ==================================================================== L3 == */
async function submitOfferWithRetry(page, agentId, desiredAmount, slotId) {
  async function attempt() {
    await page.click(`.fa-agent-card[data-agent-id="${agentId}"]`);
    await page.waitForSelector(`#faComposerRoot[data-agent="${agentId}"]`, { timeout: 8000 });
    const box = await page.locator("#faComposerRoot .fa-offer-composer").boundingBox();
    const vp = page.viewportSize();
    if (!box || !vp) throw new Error("composer has no bounding box");
    const within = box.y >= 0 && box.y < vp.height && box.y + box.height > 0;
    if (!within) throw new Error(`composer opened off-screen (box.y=${box.y}, box.height=${box.height}, vp=${vp.width}x${vp.height})`);
    await page.click(`.fa-slot-chip[data-slot="${slotId}"]`, { timeout: 8000 });
    const readoutText = await page.textContent("#faAmountReadout");
    const current = Number(String(readoutText).replace(/[^0-9]/g, ""));
    const steps = Math.round((desiredAmount - current) / 5);
    const dir = steps >= 0 ? "1" : "-1";
    for (let i = 0; i < Math.abs(steps); i += 1) {
      await page.click(`.fa-offer-composer [data-fa-step="${dir}"]`);
    }
    await page.waitForFunction((amt) => document.getElementById("faAmountReadout")?.textContent === `$${amt}M`, desiredAmount, { timeout: 8000 });
    await page.click("#faSubmitOffer");
    await page.waitForSelector("#faActedBanner .banner", { timeout: 8000 });
  }
  try {
    await attempt();
    return { ok: true, retried: false };
  } catch (err) {
    notes.push(`L3 day-1 offer composer race hit on first attempt (${err.message}); retrying once per known-issue tolerance.`);
    try {
      await attempt();
      return { ok: true, retried: true };
    } catch (err2) {
      notes.push(`L3 day-1 offer composer FAILED even after one retry: ${err2.message}. Recorded the resulting DOM state as-is (not a submitted offer).`);
      return { ok: false, retried: true, error: err2.message };
    }
  }
}

async function holdToday(page) {
  await page.click("#faHoldBtn");
  await page.waitForSelector("#faActedBanner .banner", { timeout: 8000 });
}

async function waitForDay(page, day) {
  await page.waitForFunction((d) => document.querySelector(".fa-day-pill")?.textContent?.includes(`DAY ${d} OF 4`), day, { timeout: 15000 });
}

async function captureL3(browser) {
  console.log("[shots-m1-ext] === L3 Free Agency: browser-driven capture (linked to a real completed L1->L2) ===");
  const l2SessionId = await buildCompletedL1AndL2();

  const alpha = await browser.newPage({ viewport: VP_STUDENT });
  const beta = await browser.newPage({ viewport: VP_STUDENT });
  const gamma = await browser.newPage({ viewport: VP_STUDENT });
  const teach = await browser.newPage({ viewport: VP_TEACH });
  const board = await browser.newPage({ viewport: VP_BOARD });
  for (const p of [alpha, beta, gamma, teach, board]) p.on("dialog", (d) => d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.waitForSelector("#lesson option", { state: "attached" });
  await teach.selectOption("#lesson", "m1l3-free-agency");
  await teach.waitForSelector("#sourceSessionRow:not([hidden])");
  await teach.waitForSelector(`#sourceSession option[value="${l2SessionId}"]`, { state: "attached" });
  await teach.selectOption("#sourceSession", l2SessionId);
  await teach.fill("#title", "M1-ext L3 capture");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  console.log("[shots-m1-ext] L3 session created, code", code);

  await board.goto(`${BASE}/board?code=${code}`);
  await board.waitForSelector("#stage .label");

  async function join(page, name) {
    await page.goto(`${BASE}/play`);
    await page.fill("#joinCode", code);
    await page.fill("#joinName", name);
    await page.click("#btnJoin");
    await page.waitForSelector("#gameCard:not([hidden])");
  }
  await join(alpha, "Alpha");
  await join(beta, "Beta");
  await join(gamma, "Gamma");

  await settle(alpha);
  await shot(alpha, "l3-01-play-lobby@1366x768.png", { lesson: "m1l3-free-agency", surface: "play", state: "lobby", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l3-02-teach-lobby@1366x768.png", { lesson: "m1l3-free-agency", surface: "teach", state: "lobby", viewport: "1366x768" }, code);
  await settle(board);
  await shot(board, "l3-03-board-lobby@1920x1080.png", { lesson: "m1l3-free-agency", surface: "board", state: "lobby", viewport: "1920x1080" }, code);

  await teach.click("#btnAdvance"); // LOBBY -> HOOK
  await teach.waitForSelector(".phasechip.current:text('HOOK')");

  async function claimCarried(page, index) {
    await page.waitForSelector(`.claim-card[data-carried-index="${index}"]`);
    await page.click(`.claim-card[data-carried-index="${index}"]`);
    await page.waitForSelector(".fa-market-grid");
  }
  await claimCarried(alpha, 0);
  await claimCarried(beta, 1);
  await claimCarried(gamma, 2);

  await teach.click("#btnAdvance"); // HOOK -> PLAY
  await teach.waitForSelector(".phasechip.current:text('PLAY')");
  for (const p of [alpha, beta, gamma]) await p.waitForSelector("#faPlayRoot");
  await board.waitForSelector(".fa-ticker");
  for (const p of [alpha, beta, gamma]) await waitForDay(p, 1);

  await settle(alpha);
  await shot(alpha, "l3-04-play-day1-market@1366x768.png", { lesson: "m1l3-free-agency", surface: "play", state: "day-1-market", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l3-05-teach-day1@1366x768.png", { lesson: "m1l3-free-agency", surface: "teach", state: "day-1-market", viewport: "1366x768" }, code);
  await settle(board);
  await shot(board, "l3-06-board-day1@1920x1080.png", { lesson: "m1l3-free-agency", surface: "board", state: "day-1-market", viewport: "1920x1080" }, code);

  const offerResult = await submitOfferWithRetry(alpha, "fa-value-df", 5, "DEFENDER");
  console.log("[shots-m1-ext] L3 day-1 offer result:", offerResult);
  if (!offerResult.ok) {
    // fall back to a hold so the day can still close deterministically
    await holdToday(alpha);
  }
  await holdToday(beta);
  await holdToday(gamma);

  await teach.click("#btnCloseDay");
  await board.waitForFunction(() => document.querySelector(".label")?.textContent?.includes("Day 2 of 4"), null, { timeout: 15000 });
  for (const p of [alpha, beta, gamma]) { await holdToday(p); }
  await teach.click("#btnCloseDay");
  await board.waitForFunction(() => document.querySelector(".label")?.textContent?.includes("Day 3 of 4"), null, { timeout: 15000 });
  for (const p of [alpha, beta, gamma]) { await holdToday(p); }
  await teach.click("#btnCloseDay");
  await board.waitForFunction(() => document.querySelector(".label")?.textContent?.includes("Day 4 of 4"), null, { timeout: 15000 });
  for (const p of [alpha, beta, gamma]) { await holdToday(p); }
  await teach.click("#btnCloseDay");
  await board.waitForSelector(".label:text('Signing Window Closed')");

  await teach.click("#btnAdvance"); // PLAY -> REVEAL
  await teach.waitForSelector(".phasechip.current:text('REVEAL')");
  for (let i = 0; i < 3; i += 1) {
    const respPromise = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
    await teach.click("#btnRevealNext");
    await respPromise;
  }
  await settle(board);
  await shot(board, "l3-07-board-reveal@1920x1080.png", { lesson: "m1l3-free-agency", surface: "board", state: "reveal", viewport: "1920x1080" }, code);
  await settle(alpha);
  await shot(alpha, "l3-08-play-reveal@1366x768.png", { lesson: "m1l3-free-agency", surface: "play", state: "reveal", viewport: "1366x768" }, code);
  await settle(teach);
  await shot(teach, "l3-09-teach-reveal@1366x768.png", { lesson: "m1l3-free-agency", surface: "teach", state: "reveal", viewport: "1366x768" }, code);

  await alpha.close(); await beta.close(); await gamma.close(); await teach.close(); await board.close();
}

/* ===================================================================== main == */
async function main() {
  console.log("[shots-m1-ext] starting server on port", PORT, "snapshot", SNAPSHOT_FILE);
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  let browser;
  const consoleErrors = [];
  try {
    await waitForServer();
    console.log("[shots-m1-ext] server up on", BASE);
    browser = await chromium.launch();
    browser.on("disconnected", () => {});

    // Attach a console/pageerror watcher to every new page.
    const origNewPage = browser.newPage.bind(browser);
    browser.newPage = async (opts) => {
      const p = await origNewPage(opts);
      p.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`); });
      p.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
      return p;
    };

    await captureL1(browser);
    await captureL2(browser);
    await captureL3(browser);

    fs.writeFileSync(
      path.join(OUT, "manifest.json"),
      JSON.stringify({ port: PORT, out: OUT, capturedAt: new Date().toISOString(), shots: manifest, notes, consoleErrors }, null, 2),
    );
    console.log("[shots-m1-ext] manifest written:", path.join(OUT, "manifest.json"));
    console.log(`[shots-m1-ext] ${manifest.length} screenshots, ${notes.length} notes, ${consoleErrors.length} console errors`);
    if (consoleErrors.length > 0) console.error("[shots-m1-ext] CONSOLE ERRORS:\n" + consoleErrors.join("\n"));
  } catch (error) {
    console.error("[shots-m1-ext] FAILED:", error);
    console.error("[shots-m1-ext] server log tail:\n" + serverLog.split("\n").slice(-60).join("\n"));
    fs.writeFileSync(
      path.join(OUT, "manifest.json"),
      JSON.stringify({ port: PORT, out: OUT, capturedAt: new Date().toISOString(), shots: manifest, notes, consoleErrors, FAILED: String(error) }, null, 2),
    );
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
