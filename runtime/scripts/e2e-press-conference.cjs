#!/usr/bin/env node
/**
 * Browser truth for the PRESS CONFERENCE primitive and two THE WINDOW picker
 * edges. Real Chromium against the built server. Run from runtime/ after
 * `npm run build`:
 *
 *   node scripts/e2e-press-conference.cjs
 *
 * Path A — press conference: the board shows the podium label and never the
 * seat id or a pending offer price; the podium seat sees its own podium view,
 * every other seat sees the lock; the teacher control reads "at the podium";
 * and — the 2026-09-04 regression — BOTH play pages return to their own game
 * within seconds of endPressConference (keyed renderers must remount after a
 * body takeover).
 * Path C — INVITE FIRST (§12.2): invite never pauses the room; a decline is
 * usable exactly once per seat and the invite card must say so plainly once
 * spent; the board never says "podium" or the question before an accept and
 * never says the word "decline" at any point; a teacher Cancel invite clears
 * the card without consuming that seat's one decline.
 * Path B — picker: a full club reads FULL and is disabled; a student who loses
 * the race for the last desk sees the refusal text inline and can pick again.
 *
 * Originally written by the Browser QA role in the scratchpad (that role does
 * not write repository files); adopted here unchanged in substance.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const DIST = process.env.E2E_DIST ? path.resolve(process.env.E2E_DIST) : path.join(ROOT, "dist");
const PORT = Number(process.env.E2E_PORT || 4327);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-pc-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-1", "rebuild", "screens-l1");

const LESSON = "m1l1-the-window";

const consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/lessons`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

async function shoot(page, name) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREEN_DIR, `${name}.png`), fullPage: false });
}

async function createSession(browser, band) {
  const teach = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watchConsole(teach, "teach");
  teach.on("dialog", (d) => d.accept());
  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", LESSON);
  await teach.selectOption("#gradeBand", band);
  await teach.fill("#title", `QA PC ${Date.now()}`);
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  return { teach, code };
}

async function joinStudent(browser, code, name, label) {
  const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(p, label);
  p.on("dialog", (d) => d.accept());
  await p.goto(`${BASE}/play`);
  await p.fill("#joinCode", code);
  await p.fill("#joinName", name);
  const respPromise = p.waitForResponse((r) => r.url().includes("/join") && r.request().method() === "POST");
  await p.click("#btnJoin");
  const resp = await respPromise;
  const body = await resp.json();
  await p.waitForSelector("#gameCard:not([hidden])");
  return { page: p, seatId: body.seat.id, deviceToken: body.deviceToken };
}

/* ============================================================ PATH A ==== */
async function pathA(browser) {
  const results = [];
  const { teach, code } = await createSession(browser, "5-6");
  const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(board, "board");
  await board.goto(`${BASE}/board?code=${code}`);

  const s1 = await joinStudent(browser, code, "Student 1", "s1");
  await s1.page.waitForSelector(".sl-pick[data-index=\"0\"]", { timeout: 20000 });
  await s1.page.click(".sl-pick[data-index=\"0\"]");
  await s1.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s2 = await joinStudent(browser, code, "Student 2", "s2");
  await s2.page.waitForSelector(".sl-pick[data-index=\"1\"]", { timeout: 20000 });
  await s2.page.click(".sl-pick[data-index=\"1\"]");
  await s2.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s1Club = (await s1.page.textContent(".hq-title")).trim();
  console.log(`PATH A: Student 1 club = "${s1Club}", seatId=${s1.seatId}`);

  await teach.click("#btnAdvance"); // HOOK
  await teach.waitForTimeout(400);
  await teach.click("#btnAdvance"); // PLAY
  await s1.page.waitForSelector(".sl-board .sl-row", { timeout: 20000 });
  await s2.page.waitForSelector(".sl-board .sl-row", { timeout: 20000 });
  await board.waitForTimeout(400);

  await shoot(board, "pc-before-board");
  await shoot(s1.page, "pc-before-play-s1");
  await shoot(s2.page, "pc-before-play-s2");
  await shoot(teach, "pc-before-teach");

  // Optional: Student 1 submits an offer within a few clicks.
  let offerAmountText = null;
  try {
    const row = await s1.page.waitForSelector(".sl-row[data-reach='yes']", { timeout: 5000 });
    const pickId = await row.getAttribute("data-player");
    await s1.page.click(`.sl-row[data-player="${pickId}"]`);
    await s1.page.waitForSelector("#slCommit", { timeout: 5000 });
    offerAmountText = (await s1.page.textContent("#slRead")) || null;
    await s1.page.click("#slCommit");
    await s1.page.waitForSelector(".sl-committed", { timeout: 5000 });
    console.log(`PATH A: Student 1 submitted an offer of "${offerAmountText}"`);
  } catch (e) {
    console.log(`PATH A: Student 1 offer submission skipped (${e.message.split("\n")[0]})`);
    offerAmountText = null;
  }

  // Teacher calls Student 1 to the podium via the manual seat picker (UI only,
  // same bearer-key path as every other control click on this console).
  const picker = teach.locator("#pcSeatPicker");
  await picker.waitFor({ state: "visible", timeout: 10000 });
  const candidateLabel = await picker.locator(`option[value="${s1.seatId}"]`).innerText();
  console.log(`PATH A: teacher payload candidate label for Student 1 = "${candidateLabel}"`);
  await picker.selectOption({ value: s1.seatId });
  await teach.click("#btnPcCallPicked");
  await teach.waitForTimeout(500);
  await board.waitForTimeout(400);

  await shoot(board, "pc-during-board");
  await shoot(s1.page, "pc-during-play-s1-podium");
  await shoot(s2.page, "pc-during-play-s2-locked");
  await shoot(teach, "pc-during-teach");

  // ---- assertions: board takeover ----
  const boardText = await board.evaluate(() => document.getElementById("stage").innerText);
  results.push(["board shows PRESS CONFERENCE text", boardText.includes("PRESS CONFERENCE")]);
  results.push([`board shows the candidate label the teacher payload gave ("${candidateLabel}")`, boardText.includes(candidateLabel)]);
  results.push(["board innerText excludes seatId", !boardText.includes(s1.seatId)]);
  const boardHtml = await board.evaluate(() => document.getElementById("stage").innerHTML);
  results.push(["board DOM/HTML excludes seatId", !boardHtml.includes(s1.seatId)]);
  if (offerAmountText) {
    const priceDigits = offerAmountText.replace(/[^0-9]/g, "");
    const priceMatch = priceDigits.length >= 5 ? boardText.replace(/[^0-9]/g, "").includes(priceDigits) : false;
    results.push([`board excludes pending offer price ("${offerAmountText.trim()}")`, !priceMatch]);
  } else {
    results.push(["board excludes pending offer price", "NOT VERIFIED (no offer was submitted)"]);
  }

  // ---- assertions: student 2 lock screen ----
  const s2Text = await s2.page.evaluate(() => document.body.innerText);
  results.push(["Student 2 sees the lock screen (pc-lock)", (await s2.page.$(".pc-lock")) !== null]);
  results.push(["Student 2's screen is NOT their own game board", !(await s2.page.$(".sl-board"))]);

  // ---- assertions: student 1 podium ----
  results.push(["Student 1 sees the podium view (pc-podium)", (await s1.page.$(".pc-podium")) !== null]);
  const s1PodiumText = await s1.page.evaluate(() => document.body.innerText);
  results.push(["Student 1 podium text mentions the candidate label", s1PodiumText.includes(candidateLabel)]);

  // ---- assertions: teacher console ----
  const endBtnDisabled = await teach.isDisabled("#btnEndPressConference");
  results.push(["teacher 'End press conference' control is enabled", !endBtnDisabled]);
  const pcState = (await teach.textContent("#pcState")) || "";
  results.push(["teacher pcState shows 'at the podium'", pcState.includes("at the podium")]);
  const clockNoteVisible = await teach.isVisible("#pcClockNote");
  results.push(["teacher clock note visibility observed", clockNoteVisible ? "visible: " + (await teach.textContent("#pcClockNote")) : "hidden (no FINAL_CALL running — expected, no clock to report)"]);

  // ---- end press conference ----
  await teach.click("#btnEndPressConference");
  // Give this several poll cycles (poll = 1.2s) before judging, not one.
  let s1Board = false, s2Board = false;
  for (let i = 0; i < 6 && !(s1Board && s2Board); i += 1) {
    await s1.page.waitForTimeout(700);
    s1Board = (await s1.page.$(".sl-board")) !== null;
    s2Board = (await s2.page.$(".sl-board")) !== null;
  }
  await board.waitForTimeout(400);
  await shoot(board, "pc-after-board");
  await shoot(s1.page, "pc-after-play-s1");
  await shoot(s2.page, "pc-after-play-s2");
  await shoot(teach, "pc-after-teach");

  const boardTextAfter = await board.evaluate(() => document.getElementById("stage").innerText);
  results.push(["board returns to normal frame (no PRESS CONFERENCE text)", !boardTextAfter.includes("PRESS CONFERENCE")]);
  const s1StuckText = (await s1.page.evaluate(() => document.body.innerText)).slice(0, 120).replace(/\n/g, " | ");
  const s2StuckText = (await s2.page.evaluate(() => document.body.innerText)).slice(0, 120).replace(/\n/g, " | ");
  results.push(["Student 1's play page returns to own game (.sl-board) within ~4.2s of endPressConference", s1Board ? true : `FAIL — still showing: "${s1StuckText}"`]);
  results.push(["Student 2's play page returns to own game (.sl-board) within ~4.2s of endPressConference", s2Board ? true : `FAIL — still showing: "${s2StuckText}"`]);

  await s1.page.close();
  await s2.page.close();
  await board.close();
  await teach.close();
  return results;
}

/* ============================================================ PATH C ==== */
/**
 * §12.2 INVITE FIRST, full lifecycle: invite (no pause, no podium) -> decline
 * (one-time, then the card must say so plainly and drop the button) ->
 * re-invite -> accept (podium goes live) -> end -> a clean second invite that
 * gets cancelled by the teacher instead of answered (no decline consumed).
 */
async function pathC(browser) {
  const results = [];
  const FIRST_QUESTION = "What is your plan for tonight, honestly?";
  const { teach, code } = await createSession(browser, "5-6");
  const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(board, "c-board");
  await board.goto(`${BASE}/board?code=${code}`);

  const s1 = await joinStudent(browser, code, "Student 1", "c-s1");
  await s1.page.waitForSelector(".sl-pick[data-index=\"0\"]", { timeout: 20000 });
  await s1.page.click(".sl-pick[data-index=\"0\"]");
  await s1.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s2 = await joinStudent(browser, code, "Student 2", "c-s2");
  await s2.page.waitForSelector(".sl-pick[data-index=\"1\"]", { timeout: 20000 });
  await s2.page.click(".sl-pick[data-index=\"1\"]");
  await s2.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s1Club = (await s1.page.textContent(".hq-title")).trim();
  const s2Club = (await s2.page.textContent(".hq-title")).trim();
  console.log(`PATH C: Student 1 club = "${s1Club}", Student 2 club = "${s2Club}"`);

  await teach.click("#btnAdvance"); // HOOK
  await teach.waitForTimeout(400);
  await teach.click("#btnAdvance"); // PLAY
  await s1.page.waitForSelector(".sl-board .sl-row", { timeout: 20000 });
  await s2.page.waitForSelector(".sl-board .sl-row", { timeout: 20000 });
  await teach.waitForSelector("#pcCandidates .pc-cand-list li", { timeout: 20000 });

  /* -------------------------------------------------- STEP 1: invite -- */
  await teach.fill("#pcQuestion", FIRST_QUESTION);
  const firstCandLi = teach.locator("#pcCandidates .pc-cand-list li").first();
  const firstCandLabel = (await firstCandLi.locator("b").innerText()).trim();
  // Twin desks on THE WINDOW are labelled "<club name> A/B"; two students on
  // two different clubs are each the sole occupant of their own desk, so the
  // shortlist label for each is exactly its club name + " A".
  const invIsS1 = firstCandLabel === `${s1Club} A`;
  const invIsS2 = firstCandLabel === `${s2Club} A`;
  results.push([`first candidate label ("${firstCandLabel}") matches exactly one of the two seated desks`, invIsS1 !== invIsS2]);
  const inv = invIsS1 ? s1 : s2;
  const other = invIsS1 ? s2 : s1;
  const invLabel = invIsS1 ? `${s1Club} A` : `${s2Club} A`;
  console.log(`PATH C: first candidate ("${firstCandLabel}") is ${invIsS1 ? "Student 1" : "Student 2"}`);

  await firstCandLi.locator("button").click();
  await teach.waitForTimeout(500);
  await inv.page.waitForSelector(".pc-invite", { timeout: 10000 }).catch(() => {});
  await board.waitForTimeout(300);

  await shoot(teach, "pc-invite-1-teach");
  await shoot(board, "pc-invite-1-board");
  await shoot(inv.page, "pc-invite-1-play-invited");
  await shoot(other.page, "pc-invite-1-play-other");

  results.push(["invited seat sees the invite card (.pc-invite)", (await inv.page.$(".pc-invite")) !== null]);
  results.push(["invite card shows ACCEPT", await inv.page.isVisible('[data-pc-invite="accept"]').catch(() => false)]);
  results.push(["invite card shows NOT THIS TIME (first invite, decline available)", await inv.page.isVisible('[data-pc-invite="decline"]').catch(() => false)]);

  const meInv1 = await (await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${inv.deviceToken}` } })).json();
  results.push(["invited seat's own /api/me: session.paused is false (an invite never pauses the room)", meInv1.session.paused === false]);
  results.push(["invited seat's own /api/me: pressInvite.canDecline is true (first invite)", meInv1.pressInvite?.canDecline === true]);
  results.push(["invited seat's own /api/me: pressInvite carries the question", meInv1.pressInvite?.question === FIRST_QUESTION]);

  results.push(["other student's page shows no lock screen (.pc-lock)", (await other.page.$(".pc-lock")) === null]);
  results.push(["other student's page still shows its own game board (.sl-board)", (await other.page.$(".sl-board")) !== null]);

  const boardTextInvite = await board.evaluate(() => document.getElementById("stage").innerText);
  results.push(["board shows no PRESS CONFERENCE podium while only invited (no pause yet)", !boardTextInvite.includes("PRESS CONFERENCE")]);
  results.push(["board does not show the question yet", !boardTextInvite.includes(FIRST_QUESTION)]);

  const pcStateInvite = (await teach.textContent("#pcState")) || "";
  results.push([`teacher pcState reads "invited — waiting" ("${pcStateInvite}")`, pcStateInvite.includes("invited — waiting")]);

  /* -------------------------------------------------- STEP 2: decline -- */
  await inv.page.click('[data-pc-invite="decline"]');
  await inv.page.waitForSelector(".pc-invite", { state: "detached", timeout: 10000 }).catch(() => {});
  await teach.waitForTimeout(1500); // teacher console polls; give it a full cycle
  await board.waitForTimeout(300);

  await shoot(inv.page, "pc-invite-2-play-invited");
  await shoot(teach, "pc-invite-2-teach");
  await shoot(board, "pc-invite-2-board");

  results.push(["invite card disappears from the invited seat's page after decline", (await inv.page.$(".pc-invite")) === null]);
  results.push(["no podium appears anywhere after a decline (.pc-podium)", (await inv.page.$(".pc-podium")) === null]);
  results.push(["no lock appears anywhere after a decline (.pc-lock, other student)", (await other.page.$(".pc-lock")) === null]);
  const declinedLi = teach.locator(".pc-cand", { hasText: invLabel });
  results.push([`teacher candidate list marks ${invLabel} as having used its decline`, (await declinedLi.locator(".pc-cand-declined").count()) > 0]);
  const boardTextDecline = await board.evaluate(() => document.getElementById("stage").innerText);
  const boardHtmlDecline = await board.evaluate(() => document.getElementById("stage").innerHTML);
  results.push(["board innerText never contains the word 'decline'", !/decline/i.test(boardTextDecline)]);
  results.push(["board innerHTML never contains the word 'decline'", !/decline/i.test(boardHtmlDecline)]);

  /* --------------------------------------------- STEP 3: re-invite/accept -- */
  const picker = teach.locator("#pcSeatPicker");
  await picker.waitFor({ state: "visible", timeout: 10000 });
  await picker.selectOption({ value: inv.seatId });
  await teach.click("#btnPcInvitePicked");
  await inv.page.waitForSelector(".pc-invite", { timeout: 10000 }).catch(() => {});

  await shoot(inv.page, "pc-invite-3-play-invited-card");

  results.push(["re-invited card has NO decline button (decline already used)", (await inv.page.$('[data-pc-invite="decline"]')) === null]);
  const nodeclineText = ((await inv.page.textContent(".pc-invite-nodecline")) || "").trim();
  results.push([`re-invited card plainly states the decline is used ("${nodeclineText}")`, /already used your one decline/i.test(nodeclineText)]);

  await inv.page.click('[data-pc-invite="accept"]');
  await inv.page.waitForSelector(".pc-podium", { timeout: 10000 }).catch(() => {});
  await other.page.waitForSelector(".pc-lock", { timeout: 10000 }).catch(() => {});
  await board.waitForTimeout(400);

  await shoot(inv.page, "pc-invite-3-play-invited-podium");
  await shoot(other.page, "pc-invite-3-play-other-lock");
  await shoot(board, "pc-invite-3-board");

  const invPodiumText = await inv.page.evaluate(() => document.body.innerText);
  results.push(["accept: invited seat shows the podium (.pc-podium)", (await inv.page.$(".pc-podium")) !== null]);
  results.push(["accept: podium page shows the question text", invPodiumText.includes(FIRST_QUESTION)]);
  results.push(["accept: other student sees the lock screen (.pc-lock)", (await other.page.$(".pc-lock")) !== null]);

  const boardTextAccept = await board.evaluate(() => document.getElementById("stage").innerText);
  const boardHtmlAccept = await board.evaluate(() => document.getElementById("stage").innerHTML);
  results.push(["accept: board shows the question text", boardTextAccept.includes(FIRST_QUESTION)]);
  results.push(["accept: board shows the podium label", boardTextAccept.includes(invLabel)]);
  results.push(["accept: board innerText excludes the seat id", !boardTextAccept.includes(inv.seatId) && !boardTextAccept.includes(other.seatId)]);
  results.push(["accept: board innerHTML excludes the seat id", !boardHtmlAccept.includes(inv.seatId) && !boardHtmlAccept.includes(other.seatId)]);

  /* -------------------------------------------------- STEP 4: end -- */
  await teach.click("#btnEndPressConference");
  let invBoardBack = false, otherBoardBack = false;
  for (let i = 0; i < 8 && !(invBoardBack && otherBoardBack); i += 1) {
    await inv.page.waitForTimeout(650);
    invBoardBack = (await inv.page.$(".sl-board")) !== null;
    otherBoardBack = (await other.page.$(".sl-board")) !== null;
  }
  await shoot(inv.page, "pc-invite-4-play-invited");
  await shoot(other.page, "pc-invite-4-play-other");
  results.push(["invited seat's page returns to its own game (.sl-board) within ~5.2s of endPressConference", invBoardBack]);
  results.push(["other seat's page returns to its own game (.sl-board) within ~5.2s of endPressConference", otherBoardBack]);

  /* --------------------------------------------- STEP 5: invite + cancel -- */
  await picker.selectOption({ value: other.seatId });
  await teach.click("#btnPcInvitePicked");
  await other.page.waitForSelector(".pc-invite", { timeout: 10000 }).catch(() => {});
  await shoot(other.page, "pc-invite-5-play-other-invited");

  await teach.click("#btnCancelInvite");
  await other.page.waitForSelector(".pc-invite", { state: "detached", timeout: 10000 }).catch(() => {});
  await shoot(other.page, "pc-invite-5-play-other-cancelled");

  results.push(["second student's invite card disappears after teacher Cancel invite", (await other.page.$(".pc-invite")) === null]);
  const meOther = await (await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${other.deviceToken}` } })).json();
  results.push(["cancelled invite: no decline consumed (session.paused false, no lingering pressInvite)", meOther.session.paused === false && meOther.pressInvite === null]);
  const otherLabel = invIsS1 ? `${s2Club} A` : `${s1Club} A`;
  const otherLi = teach.locator(".pc-cand", { hasText: otherLabel });
  results.push([`teacher candidate list still shows no decline used for ${otherLabel} (Cancel invite is not a decline)`, (await otherLi.locator(".pc-cand-declined").count()) === 0]);

  await s1.page.close();
  await s2.page.close();
  await board.close();
  await teach.close();
  return results;
}

/* ============================================================ PATH B ==== */
async function pathBFullCards(browser) {
  const results = [];
  const { teach, code } = await createSession(browser, "5-6");
  await teach.click("#btnAdvance").catch(() => {}); // not required for lobby picker; leave in LOBBY

  const s1 = await joinStudent(browser, code, "Student 1", "b1");
  await s1.page.waitForSelector(".sl-pick[data-index=\"0\"]", { timeout: 20000 });
  await s1.page.click(".sl-pick[data-index=\"0\"]");
  await s1.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s2 = await joinStudent(browser, code, "Student 2", "b2");
  await s2.page.waitForSelector(".sl-pick[data-index=\"0\"]", { timeout: 20000 });
  await s2.page.click(".sl-pick[data-index=\"0\"]");
  await s2.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const s3 = await joinStudent(browser, code, "Student 3", "b3");
  await s3.page.waitForSelector(".sl-picker", { timeout: 20000 });
  const card0Text = (await s3.page.textContent(".sl-pick[data-index=\"0\"] .sl-pick-open")).trim();
  results.push(["card 0 reads FULL/0 desks open for a fresh loader", /0/.test(card0Text) || /full/i.test(card0Text)]);
  const card0Disabled = await s3.page.getAttribute(".sl-pick[data-index=\"0\"]", "disabled");
  results.push(["card 0 is disabled for Student 3", card0Disabled !== null]);
  console.log(`PATH B (full-cards): card 0 open-text="${card0Text}" disabled=${card0Disabled !== null}`);

  await s1.page.close();
  await s2.page.close();
  await s3.page.close();
  await teach.close();
  return results;
}

async function pathBRace(browser) {
  const results = [];
  const { teach, code } = await createSession(browser, "5-6");

  const A = await joinStudent(browser, code, "Student A", "raceA");
  await A.page.waitForSelector(".sl-pick[data-index=\"1\"]", { timeout: 20000 });
  await A.page.click(".sl-pick[data-index=\"1\"]");
  await A.page.waitForSelector(".sl-picker", { state: "detached", timeout: 20000 });

  const B = await joinStudent(browser, code, "Student B", "raceB");
  await B.page.waitForSelector(".sl-pick[data-index=\"1\"]", { timeout: 20000 });
  // Confirm B's picker currently reads "1 desk open" on index 1 before the race.
  const openBefore = (await B.page.textContent(".sl-pick[data-index=\"1\"] .sl-pick-open")).trim();
  results.push(['B sees "1 desk open" on index 1 before the race', /^1 desk open/i.test(openBefore)]);

  // Student C fills index 1 via the raw API (join + chooseClub), bypassing UI
  // entirely so its timing is exact and does not compete with B's own page.
  const joinResp = await fetch(`${BASE}/api/sessions/${code}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "Student C" }),
  });
  const cBody = await joinResp.json();
  const clubIdIndex1 = await B.page.getAttribute(".sl-pick[data-index=\"1\"]", "data-club");

  // Intercept B's OWN NEXT poll response and hold it a beat: this is what
  // "act within ~300ms of C's pick" means on a real device with a 1200ms poll
  // — the click has to land on the DOM before B's page has had a chance to
  // learn, on its own, that the desk just filled. Removed again immediately
  // after so every later poll goes through unmodified.
  let releaseHold = () => {};
  const held = new Promise((resolve) => { releaseHold = resolve; });
  await B.page.route("**/api/me", async (route) => {
    await held;
    await route.continue();
  }, { times: 1 });

  await fetch(`${BASE}/api/sessions/${code}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cBody.deviceToken}` },
    body: JSON.stringify({ type: "chooseClub", clubId: clubIdIndex1 }),
  }); // C's pick has resolved server-side: the desk is now full.
  // Click B's still-stale "1 desk open" card while its poll is held back.
  await B.page.click('.sl-pick[data-index="1"]');
  releaseHold();

  // Assert within 3s: B's picker shows the refusal text inside .sl-picker .sl-err
  let refusalText = null;
  try {
    await B.page.waitForFunction(
      () => {
        const el = document.querySelector(".sl-picker .sl-err");
        return el && el.textContent && el.textContent.trim().length > 0;
      },
      { timeout: 3000 },
    );
    refusalText = (await B.page.textContent(".sl-picker .sl-err")).trim();
  } catch (e) {
    refusalText = null;
  }
  results.push(["B's picker shows the refusal text in .sl-picker .sl-err within 3s", refusalText]);
  results.push(["refusal text matches 'Both front offices at ... are taken. Pick another club.'", refusalText ? /Both front offices at .* are taken\. Pick another club\./.test(refusalText) : false]);

  if (refusalText) await shoot(B.page, "pick-race-refused");

  // Other cards must be enabled again (not disabled).
  const otherDisabledStates = [];
  for (let i = 0; i < 8; i += 1) {
    if (i === 1) continue;
    const el = await B.page.$(`.sl-pick[data-index="${i}"]`);
    if (!el) continue;
    const disabled = await el.getAttribute("disabled");
    otherDisabledStates.push({ i, disabled });
  }
  const anyWronglyDisabled = otherDisabledStates.filter((s) => s.disabled !== null);
  results.push(["other cards are enabled again (not disabled) after refusal", anyWronglyDisabled.length === 0 ? true : JSON.stringify(anyWronglyDisabled)]);

  // B can then successfully pick another card and reach the seated screen.
  let reachedSeated = false;
  try {
    const openIndex = otherDisabledStates.find((s) => s.disabled === null)?.i;
    if (openIndex !== undefined) {
      await B.page.click(`.sl-pick[data-index="${openIndex}"]`);
      await B.page.waitForSelector(".sl-picker", { state: "detached", timeout: 10000 });
      reachedSeated = (await B.page.$(".hq-title")) !== null;
    }
  } catch (e) {
    reachedSeated = `error: ${e.message.split("\n")[0]}`;
  }
  results.push(["B successfully picks another card and reaches the seated screen", reachedSeated]);

  await A.page.close();
  await B.page.close();
  await teach.close();
  return results;
}

/* -------------------------------------------------------------------- run */
async function main() {
  await assertPortFree(PORT, "press-conference QA");
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  const server = spawn(process.execPath, [path.join(DIST, "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();

  const browser = await chromium.launch();
  const report = {};
  try {
    console.log("\n=== PATH A: PRESS CONFERENCE ===");
    report.pathA = await pathA(browser);
    console.log("\n=== PATH C: INVITE FIRST (invite / decline / re-invite / accept / end / cancel) ===");
    report.pathC = await pathC(browser);
    console.log("\n=== PATH B: full front offices (loser sees FULL, disabled) ===");
    report.pathBFull = await pathBFullCards(browser);
    console.log("\n=== PATH B: the club-picker race ===");
    report.pathBRace = await pathBRace(browser);
  } catch (e) {
    console.error("\nHARNESS THREW:", e);
    report.threw = String(e && e.stack ? e.stack : e);
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }

  console.log("\n\n================ RESULTS ================");
  for (const [name, results] of Object.entries(report)) {
    if (name === "threw") { console.log("THREW:", results); continue; }
    console.log(`\n-- ${name} --`);
    for (const [label, val] of results) {
      console.log(`  [${val === true ? "PASS" : val === false ? "FAIL" : "INFO"}] ${label}${typeof val === "string" ? ` -> ${val}` : ""}`);
    }
  }
  console.log(`\nconsole/page errors captured: ${consoleErrors.length}`);
  for (const e of consoleErrors) console.log("  " + e);
  console.log("\nserver log tail:\n" + serverLog.slice(-1500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
