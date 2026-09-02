#!/usr/bin/env node
/* Regression re-check after repairs — m2-visual-quality-war wave 2. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = "/home/user/bow-economics-live/runtime";
const DIST = path.join(ROOT, "dist");
const PORT = 4448;
const BASE = `http://localhost:${PORT}`;
const SCRATCH = "/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-recheck-regression";
const SNAPSHOT_FILE = path.join(SCRATCH, `snap-${Date.now()}.json`);
const SCREEN_DIR = "/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-w2-regression-recheck";

const results = [];
function record(id, text) { results.push({ id, text }); console.log(`[RESULT ${id}] ${text}`); }

async function waitForServer() {
  for (let i = 0; i < 100; i += 1) {
    try { const r = await fetch(`${BASE}/api/lessons`); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}
async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial");
  await page.$eval("#fhPriceDial", (el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, price);
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price, { timeout: 75000 });
}
async function lockNight(page) {
  await page.click("#fhLock");
  await page.waitForSelector(".fh-locked-recap", { timeout: 45000 });
}
async function waitForNight(page, label) {
  await page.waitForFunction((l) => document.querySelector(".fh-card-night")?.textContent?.includes(l), label, { timeout: 45000 });
}
async function domSnapshot(page) {
  return page.evaluate(() => ({
    hasResult: !!document.getElementById("fhResult"),
    hasNext: !!document.getElementById("fhNextNight"),
    hasLock: !!document.getElementById("fhLock"),
    hasPlayRoot: !!document.getElementById("fhPlayRoot"),
    cardNight: document.querySelector(".fh-card-night")?.textContent?.trim() ?? null,
    bodyEmpty: (document.getElementById("gameBody")?.innerText ?? "").trim().length === 0,
    bodySnippet: (document.getElementById("gameBody")?.innerText ?? "").trim().slice(0, 140).replace(/\s+/g, " "),
    joinCardHidden: document.getElementById("joinCard")?.hidden,
    gameCardHidden: document.getElementById("gameCard")?.hidden,
    errText: document.getElementById("err")?.textContent ?? "",
    syncText: document.getElementById("syncStatus")?.textContent ?? "",
  }));
}
async function deviceTokenOf(page) {
  return page.evaluate(() => { try { const raw = localStorage.getItem("bow-play-credentials"); return raw ? JSON.parse(raw).deviceToken : null; } catch { return null; } });
}
async function meView(base, token) {
  const res = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  return { status: res.status, view: body.view };
}
async function createSession(teach, lesson, title) {
  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", lesson);
  await teach.fill("#title", title);
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  return (await teach.textContent("#code")).trim();
}
async function join(browser, base, code, name, viewport = { width: 1024, height: 600 }) {
  const p = await browser.newPage({ viewport });
  p.on("dialog", (d) => d.accept());
  await p.goto(`${base}/play`);
  await p.fill("#joinCode", code);
  await p.fill("#joinName", name);
  await p.click("#btnJoin");
  await p.waitForSelector("#gameCard:not([hidden])");
  return p;
}
async function joinFH(browser, base, code, name, viewport) {
  const p = await join(browser, base, code, name, viewport);
  await p.waitForSelector(".fh-desk-name", { timeout: 20000 });
  return p;
}
async function rejoinFreshContext(browser, base, code, name, pin, viewport = { width: 1366, height: 768 }) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p.on("dialog", (d) => d.accept());
  await p.goto(`${base}/play`);
  await p.click("#btnShowRejoin");
  await p.fill("#rejoinCode", code);
  await p.fill("#rejoinName", name);
  await p.fill("#rejoinPin", pin);
  await p.click("#btnRejoin");
  await p.waitForSelector("#gameCard:not([hidden])");
  return { ctx, page: p };
}
async function advance(teach, phase) {
  await teach.click("#btnAdvance");
  await teach.waitForSelector(`.phasechip.current:text('${phase}')`);
}

async function main() {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  console.log("[recheck] starting server on", PORT);
  const server = spawn(process.execPath, [path.join(DIST, "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => { serverLog += d.toString(); });
  server.stderr.on("data", (d) => { serverLog += d.toString(); });
  server.on("exit", (code, sig) => { serverLog += `\n!!! SERVER EXITED code=${code} signal=${sig}\n`; });
  await waitForServer();
  console.log("[recheck] server up, pid", server.pid);
  try {

  const consoleErrors = [];
  function watch(page, label) {
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`); });
    page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror ${e.message}`));
  }

  /* ===================================================================
   * BLOCK A: blocking repro re-test — rejoin-by-PIN must show the join
   * card with the signed-out line, never "offline — retrying", never a
   * blank #gameBody, within one poll and after reload. Desk B keeps
   * playing.
   * =================================================================== */
  let browserA;
  try {
    browserA = await chromium.launch();
    const teach = await browserA.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachA"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck A rejoin");
    const a = await joinFH(browserA, BASE, code, "Rae & Ben", { width: 1366, height: 768 });
    watch(a, "deskA"); a.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK");
    await advance(teach, "PLAY");
    await a.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    await waitForNight(a, "Night 1");
    await setPrice(a, 50);
    await lockNight(a);
    await teach.click("#btnCloseNight");
    await a.waitForSelector("#fhResult", { timeout: 20000 });
    const pin = (await a.textContent("#pinDisplay").catch(() => "")).trim() || (await (async () => { await a.click("#btnShowPin").catch(() => {}); return (await a.textContent("#pinDisplay").catch(() => "")).trim(); })());
    record("A-pin", `PIN captured: "${pin}"`);

    const before = await domSnapshot(a);
    record("A-before-rejoin", `Desk A before B rejoins: hasResult=${before.hasResult} gameCardHidden=${before.gameCardHidden} snippet="${before.bodySnippet}"`);

    // Desk B rejoins the SAME seat via PIN.
    const b = await rejoinFreshContext(browserA, BASE, code, "Rae & Ben", pin, { width: 1366, height: 768 });
    watch(b.page, "deskB"); b.page.on("dialog", (d) => d.accept());
    record("A-b-rejoined", "Desk B (fresh context) rejoined via PIN.");

    // Give A exactly ONE poll tick (poll interval 1200ms) to notice, without reload.
    await a.waitForTimeout(1600);
    const afterOnePoll = await domSnapshot(a);
    record("A-within-one-poll", `Desk A within one poll tick after B's rejoin, NO reload: joinCardHidden=${afterOnePoll.joinCardHidden} gameCardHidden=${afterOnePoll.gameCardHidden} errText="${afterOnePoll.errText}" syncText="${afterOnePoll.syncText}" bodyEmpty=${afterOnePoll.bodyEmpty}`);
    await a.screenshot({ path: path.join(SCREEN_DIR, "A1-desk-a-within-one-poll.png") });
    const oneShotOk = afterOnePoll.joinCardHidden === false && afterOnePoll.errText.includes("This desk was opened on another device") && afterOnePoll.syncText !== "offline — retrying";
    record("A-within-one-poll-verdict", oneShotOk ? "PASS: join card shown with signed-out line, not offline-retrying" : "FAIL: did not show expected signed-out state within one poll");

    // Now reload the (already signed-out) original tab — must NOT go blank.
    await a.reload();
    await a.waitForTimeout(800);
    const afterReload = await domSnapshot(a);
    record("A-after-reload", `Desk A after reload: joinCardHidden=${afterReload.joinCardHidden} gameCardHidden=${afterReload.gameCardHidden} errText="${afterReload.errText}" syncText="${afterReload.syncText}" bodyEmpty=${afterReload.bodyEmpty}`);
    await a.screenshot({ path: path.join(SCREEN_DIR, "A2-desk-a-after-reload.png") });
    const reloadOk = afterReload.joinCardHidden === false && afterReload.errText.includes("This desk was opened on another device");
    record("A-after-reload-verdict", reloadOk ? "PASS: join card + signed-out line survive reload" : "FAIL");

    // Desk B must keep playing unaffected.
    const bSnap = await domSnapshot(b.page);
    record("A-desk-b-state", `Desk B (the rejoined device) state: hasResult=${bSnap.hasResult} gameCardHidden=${bSnap.gameCardHidden} snippet="${bSnap.bodySnippet}"`);
    await b.page.click("#fhNextNight").catch((e) => record("A-desk-b-next-error", "B could not click NEXT: " + e.message));
    await b.page.waitForTimeout(600);
    const bAfterNext = await domSnapshot(b.page);
    record("A-desk-b-after-next", `Desk B after NEXT click: hasResult=${bAfterNext.hasResult} hasLock=${bAfterNext.hasLock} cardNight=${bAfterNext.cardNight} — B keeps playing: ${bAfterNext.gameCardHidden === false ? "YES" : "NO"}`);
    await b.page.screenshot({ path: path.join(SCREEN_DIR, "A3-desk-b-still-playing.png") });

    // Never "offline - retrying" anywhere in the whole sequence for A.
    record("A-no-offline-string", (afterOnePoll.syncText === "offline — retrying" || afterReload.syncText === "offline — retrying") ? "FAIL: offline-retrying string appeared" : "PASS: never showed offline-retrying");

    record("A-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await a.close(); await b.ctx.close(); await teach.close();
  } catch (e) { record("A-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserA) await browserA.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK B: late join mid-window at Night 3.
   * =================================================================== */
  let browserB;
  try {
    consoleErrors.length = 0;
    browserB = await chromium.launch();
    const teach = await browserB.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachB"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck B late join");
    const d1 = await joinFH(browserB, BASE, code, "Ari & Tal", { width: 1024, height: 600 });
    watch(d1, "d1B"); d1.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK"); await advance(teach, "PLAY");
    await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    for (let n = 1; n <= 2; n += 1) {
      await waitForNight(d1, `Night ${n}`);
      await setPrice(d1, 40 + n);
      await lockNight(d1);
      await teach.click("#btnCloseNight");
      await d1.waitForSelector("#fhResult", { timeout: 20000 });
      await d1.click("#fhNextNight");
      await d1.waitForFunction(() => !document.querySelector("#fhResult"), null, { timeout: 20000 }).catch(() => {});
    }
    await waitForNight(d1, "Night 3");
    const late = await joinFH(browserB, BASE, code, "Sam & Jo", { width: 1024, height: 600 });
    watch(late, "lateB"); late.on("dialog", (d) => d.accept());
    const lateSnap = await domSnapshot(late);
    record("B-late-join-n3", `Fresh desk joining mid-window at Night 3: hasResult=${lateSnap.hasResult} hasLock=${lateSnap.hasLock} cardNight=${lateSnap.cardNight} bodyEmpty=${lateSnap.bodyEmpty} snippet="${lateSnap.bodySnippet}"`);
    await late.screenshot({ path: path.join(SCREEN_DIR, "B1-late-join-night3.png") });
    record("B-verdict", (lateSnap.hasLock && !lateSnap.hasResult) ? "PASS: late joiner lands on live dials, not stale results" : `NEEDS-REVIEW: hasLock=${lateSnap.hasLock} hasResult=${lateSnap.hasResult}`);
    record("B-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await late.close(); await d1.close(); await teach.close();
  } catch (e) { record("B-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserB) await browserB.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK C: double-click #btnCloseNight within 300ms; /api/me for a
   * skipped night.
   * =================================================================== */
  let browserC;
  try {
    consoleErrors.length = 0;
    browserC = await chromium.launch();
    const teach = await browserC.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachC"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck C double bell");
    const d1 = await joinFH(browserC, BASE, code, "Rae & Ben", { width: 1024, height: 600 });
    watch(d1, "d1C"); d1.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK"); await advance(teach, "PLAY");
    await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    await waitForNight(d1, "Night 1");
    await setPrice(d1, 45);
    await lockNight(d1);
    const token = await deviceTokenOf(d1);
    const meBefore = await meView(BASE, token);
    record("C-before", `Before double-click: phase=${meBefore.view.phase} history.length=${(meBefore.view.history||[]).length}`);

    const c1 = teach.click("#btnCloseNight");
    await new Promise((r) => setTimeout(r, 300));
    const c2 = teach.click("#btnCloseNight");
    await Promise.all([c1, c2]).catch((e) => record("C-click-error", "double-click threw: " + e.message));
    await teach.waitForTimeout(1500);
    const meAfter = await meView(BASE, token);
    record("C-after", `After two #btnCloseNight clicks 300ms apart: phase=${meAfter.view.phase} history.length=${(meAfter.view.history||[]).length} — a jump from 0 to 2 in history.length means a night was silently skipped (never played) for this desk.`);
    record("C-verdict", (meAfter.view.history||[]).length <= 1 ? "PASS: at most one night settled from the double-click" : "FAIL: a night was skipped (history jumped by 2)");
    const deskSnap = await domSnapshot(d1);
    record("C-desk-render", `Desk render after double bell: hasResult=${deskSnap.hasResult} bodyEmpty=${deskSnap.bodyEmpty} cardNight=${deskSnap.cardNight}`);
    await d1.screenshot({ path: path.join(SCREEN_DIR, "C1-desk-after-double-bell.png") });
    record("C-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await d1.close(); await teach.close();
  } catch (e) { record("C-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserC) await browserC.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK D: 10x #fhNextNight clicks at 50ms spanning a re-render.
   * =================================================================== */
  let browserD;
  try {
    consoleErrors.length = 0;
    browserD = await chromium.launch();
    const teach = await browserD.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachD"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck D poll race");
    const d1 = await joinFH(browserD, BASE, code, "Ari & Tal", { width: 1024, height: 600 });
    watch(d1, "d1D"); d1.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK"); await advance(teach, "PLAY");
    await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    await waitForNight(d1, "Night 1");
    await setPrice(d1, 33);
    await lockNight(d1);
    await teach.click("#btnCloseNight");
    await d1.waitForSelector("#fhResult", { timeout: 20000 });

    const clickErrors = [];
    for (let i = 0; i < 10; i += 1) {
      try { await d1.click("#fhNextNight", { timeout: 2000 }); } catch (e) { clickErrors.push(`click ${i}: ${e.message.split("\n")[0]}`); }
      await d1.waitForTimeout(50);
    }
    await d1.waitForTimeout(1500);
    const finalSnap = await domSnapshot(d1);
    record("D-final", `After 10x #fhNextNight @ 50ms spanning re-renders: hasResult=${finalSnap.hasResult} hasLock=${finalSnap.hasLock} bodyEmpty=${finalSnap.bodyEmpty} cardNight=${finalSnap.cardNight} snippet="${finalSnap.bodySnippet}" — click errors: ${clickErrors.length ? clickErrors.join(" | ") : "none"}`);
    record("D-verdict", finalSnap.bodyEmpty ? "FAIL: blank body after the race" : "PASS: coherent, non-blank");
    await d1.screenshot({ path: path.join(SCREEN_DIR, "D1-poll-race-final.png") });
    record("D-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await d1.close(); await teach.close();
  } catch (e) { record("D-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserD) await browserD.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK E: Night 5 results -> NEXT -> books closed; REVEAL while another
   * desk sits un-acked.
   * =================================================================== */
  let browserE;
  try {
    consoleErrors.length = 0;
    browserE = await chromium.launch();
    const teach = await browserE.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachE"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck E final night");
    const d1 = await joinFH(browserE, BASE, code, "Rae & Ben", { width: 1024, height: 600 });
    const d2 = await joinFH(browserE, BASE, code, "Nour & Ivy", { width: 1024, height: 600 });
    watch(d1, "d1E"); watch(d2, "d2E"); d1.on("dialog", (d) => d.accept()); d2.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK"); await advance(teach, "PLAY");
    await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    await d2.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    for (let n = 1; n <= 5; n += 1) {
      await waitForNight(d1, `Night ${n}`); await waitForNight(d2, `Night ${n}`);
      await setPrice(d1, 40 + n); await lockNight(d1);
      await setPrice(d2, 40 + n); await lockNight(d2);
      await teach.click("#btnCloseNight");
      if (n < 5) {
        await d1.waitForSelector("#fhResult", { timeout: 20000 });
        await d1.click("#fhNextNight");
        await d1.waitForFunction(() => !document.querySelector("#fhResult"), null, { timeout: 20000 }).catch(() => {});
        await d2.waitForSelector("#fhResult", { timeout: 20000 });
        await d2.click("#fhNextNight");
        await d2.waitForFunction(() => !document.querySelector("#fhResult"), null, { timeout: 20000 }).catch(() => {});
      }
    }
    await d1.waitForSelector("#fhResult", { timeout: 20000 });
    const n5Result = await domSnapshot(d1);
    record("E-n5-result", `After Night 5 bell (all nights done): d1 hasResult=${n5Result.hasResult} snippet="${n5Result.bodySnippet}"`);
    await d1.click("#fhNextNight");
    await d1.waitForFunction(() => !document.querySelector("#fhResult"), null, { timeout: 20000 }).catch(() => {});
    await d1.waitForTimeout(400);
    const afterN5Next = await domSnapshot(d1);
    record("E-after-n5-next", `d1 after NEXT out of N5 results: hasResult=${afterN5Next.hasResult} hasLock=${afterN5Next.hasLock} bodyEmpty=${afterN5Next.bodyEmpty} snippet="${afterN5Next.bodySnippet}"`);
    record("E-books-closed-verdict", (!afterN5Next.hasLock && !afterN5Next.bodyEmpty) ? "PASS: coherent books-closed state, no dial to lock" : "NEEDS-REVIEW");
    await d1.screenshot({ path: path.join(SCREEN_DIR, "E1-books-closed.png") });

    const d2StillInResults = await domSnapshot(d2);
    record("E-d2-still-in-results", `d2 (never pressed NEXT) still in N5 results: hasResult=${d2StillInResults.hasResult}`);
    await advance(teach, "REVEAL");
    await d2.waitForTimeout(1500);
    const d2AfterReveal = await domSnapshot(d2);
    record("E-d2-after-reveal", `Teacher advanced to REVEAL while d2 un-acked in N5 results: d2 now hasResult=${d2AfterReveal.hasResult} bodyEmpty=${d2AfterReveal.bodyEmpty} snippet="${d2AfterReveal.bodySnippet}"`);
    record("E-d2-verdict", d2AfterReveal.bodyEmpty ? "FAIL: d2 went blank" : "PASS: d2 remained coherent");
    await d2.screenshot({ path: path.join(SCREEN_DIR, "E2-d2-during-reveal-unacked.png") });
    record("E-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await d1.close(); await d2.close(); await teach.close();
  } catch (e) { record("E-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserE) await browserE.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK F: onUnchanged — sync label returns to "synced" after a
   * transient non-OK response.
   * =================================================================== */
  let browserF;
  try {
    consoleErrors.length = 0;
    browserF = await chromium.launch();
    const teach = await browserF.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachF"); teach.on("dialog", (d) => d.accept());
    const code = await createSession(teach, "m2l1-full-house", "recheck F transient error");
    const d1 = await joinFH(browserF, BASE, code, "Rae & Ben", { width: 1024, height: 600 });
    watch(d1, "d1F"); d1.on("dialog", (d) => d.accept());
    await advance(teach, "HOOK"); await advance(teach, "PLAY");
    await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    await d1.waitForTimeout(1500);
    const before = await domSnapshot(d1);
    record("F-before", `sync label before injected failure: "${before.syncText}"`);

    // Intercept exactly the next 2 /api/me calls with a 500, then let it
    // through normally, to simulate a transient blip (not a sign-out code).
    let intercepted = 0;
    await d1.route("**/api/me", async (route) => {
      if (intercepted < 2) {
        intercepted += 1;
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "transient_test", message: "injected transient failure" } }) });
      } else {
        await route.continue();
      }
    });
    await d1.waitForFunction(() => document.getElementById("syncStatus")?.textContent === "offline — retrying", null, { timeout: 6000 }).catch(() => {});
    const duringFailure = await domSnapshot(d1);
    record("F-during-failure", `sync label during injected 500s: "${duringFailure.syncText}" gameCardHidden=${duringFailure.gameCardHidden}`);
    await d1.unroute("**/api/me");
    await d1.waitForFunction(() => document.getElementById("syncStatus")?.textContent === "synced", null, { timeout: 6000 }).catch(() => {});
    const afterRecovery = await domSnapshot(d1);
    record("F-after-recovery", `sync label after route unblocked (should self-heal via next successful /api/me): "${afterRecovery.syncText}"`);
    record("F-verdict", afterRecovery.syncText === "synced" ? "PASS: sync label returns to synced after transient non-OK response clears" : `FAIL: sync label stuck at "${afterRecovery.syncText}"`);
    await d1.screenshot({ path: path.join(SCREEN_DIR, "F1-sync-recovered.png") });
    record("F-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await d1.close(); await teach.close();
  } catch (e) { record("F-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserF) await browserF.close().catch(() => {}); }

  /* ===================================================================
   * BLOCK G: Module 1 /play (m1l1) still polls and renders — poll.ts is
   * shared.
   * =================================================================== */
  let browserG;
  try {
    consoleErrors.length = 0;
    browserG = await chromium.launch();
    const teach = await browserG.newPage({ viewport: { width: 1366, height: 768 } });
    watch(teach, "teachG"); teach.on("dialog", (d) => d.accept());
    await teach.goto(`${BASE}/teach`);
    const options = await teach.$$eval("#lesson option", (opts) => opts.map((o) => o.value));
    record("G-lesson-options", `Available /teach lesson options: ${options.join(", ")}`);
    const m1lesson = options.find((o) => o.startsWith("m1l1")) || options.find((o) => o.includes("draft-day"));
    if (!m1lesson) { record("G-verdict", "FAIL: no m1l1/draft-day lesson option found in /teach"); }
    else {
      const code = await createSession(teach, m1lesson, "recheck G m1 poll");
      const d1 = await join(browserG, BASE, code, "Rae & Ben", { width: 1024, height: 600 });
      watch(d1, "d1G"); d1.on("dialog", (d) => d.accept());
      await d1.waitForTimeout(1500);
      const initial = await domSnapshot(d1);
      record("G-initial-render", `M1 (${m1lesson}) desk after join: gameCardHidden=${initial.gameCardHidden} bodyEmpty=${initial.bodyEmpty} syncText="${initial.syncText}" snippet="${initial.bodySnippet}"`);
      await advance(teach, "HOOK");
      await d1.waitForTimeout(1500);
      const afterHook = await domSnapshot(d1);
      record("G-after-hook", `M1 desk after teacher advances to HOOK (proves poll delivered a fresh phase without a manual reload): bodyEmpty=${afterHook.bodyEmpty} syncText="${afterHook.syncText}" snippet="${afterHook.bodySnippet}"`);
      record("G-verdict", (!afterHook.bodyEmpty && afterHook.syncText === "synced") ? "PASS: M1 /play still polls and renders correctly (shared poll.ts change is additive-safe)" : `NEEDS-REVIEW: bodyEmpty=${afterHook.bodyEmpty} sync="${afterHook.syncText}"`);
      await d1.screenshot({ path: path.join(SCREEN_DIR, "G1-m1-play-after-hook.png") });
      await d1.close();
    }
    record("G-console-errors", `console/page errors this block: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);
    await teach.close();
  } catch (e) { record("G-block-error", "BLOCK THREW: " + (e && e.stack ? e.stack : String(e))); } finally { if (browserG) await browserG.close().catch(() => {}); }

  } finally {
    fs.writeFileSync(path.join(SCRATCH, "results.json"), JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(SCRATCH, "server.log"), serverLog);
    console.log("\n=== RESULTS TABLE ===");
    for (const r of results) console.log(`- [${r.id}] ${r.text}`);
    server.kill();
    await new Promise((r) => setTimeout(r, 300));
  }
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
