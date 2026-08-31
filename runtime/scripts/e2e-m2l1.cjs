#!/usr/bin/env node
/**
 * End-to-end proof for Module 2, Lesson 1 — "Full House."
 *
 * Everything runs through real Chromium pages against /teach, /play and
 * /board, the way a class would actually play it: one teacher, one
 * projector, four student devices at the classroom Chromebook shape.
 *
 * Run from runtime/: `node scripts/e2e-m2l1.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * Four desks, four deliberately different lines, so the class evidence the
 * board draws is a real spread and not four copies of one number:
 *   Desk 1 · New York — reads the card every night (34 / 48 / 40 / 90 / 34),
 *            spends on the night before the big one, opens the upper bowl
 *   Desk 2 · Memphis  — holds the season-plan price all five nights
 *   Desk 3 · New York — flat $70 every night, and never locks Night 5
 *            (proving the teacher's bell auto-commits a desk that stalled)
 *   Desk 4 · Memphis  — joins LATE, at Night 3, and still has real books
 *
 * Asserted along the way: the pre-lock screen shows no outcome; the board
 * shows nothing about a night that is still open; the Two Peaks release is
 * a teacher decision; the shock night turns people away; Night 5 replays
 * Night 1's card; every reveal stage renders; zero console errors.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = 4307;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-m2l1-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l1");

const consoleErrors = [];
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

/* --------------------------------------------------------------- UI helpers -- */

/** Drives the real range input the way a finger does: set, then fire input + change. */
async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial");
  await page.$eval(
    "#fhPriceDial",
    (el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    price,
  );
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price);
}

async function bumpSpend(page, clicks) {
  for (let i = 0; i < clicks; i += 1) await page.click("#fhSpendUp");
}

async function lockNight(page) {
  await page.click("#fhLock");
  await page.waitForSelector(".fh-locked-recap", { timeout: 15000 });
}

async function waitForNight(page, label) {
  await page.waitForFunction(
    (l) => document.querySelector(".fh-card-night")?.textContent?.includes(l),
    label,
    { timeout: 20000 },
  );
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });

  console.log("[e2e-m2l1] starting server...");
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();
  console.log("[e2e-m2l1] server up on", BASE);

  let browser;
  try {
    browser = await chromium.launch();
    const viewport = { width: 1280, height: 800 };
    const chromebook = { width: 1024, height: 600 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const d1 = await browser.newPage({ viewport: chromebook });
    const d2 = await browser.newPage({ viewport: chromebook });
    const d3 = await browser.newPage({ viewport: chromebook });
    const d4 = await browser.newPage({ viewport: chromebook });
    for (const [label, page] of [
      ["teach", teach],
      ["board", board],
      ["desk1", d1],
      ["desk2", d2],
      ["desk3", d3],
      ["desk4", d4],
    ]) {
      watchConsole(page, label);
      page.on("dialog", (dlg) => dlg.accept());
    }

    /* ---- the teacher opens a room ---- */
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "E2E M2 L1 class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    console.log("[e2e-m2l1] session created, code", code);

    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage .label");

    async function join(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
      await page.waitForSelector(".fh-desk-name", { timeout: 20000 });
    }
    await join(d1, "Rae & Ben");
    await join(d2, "Nour & Ivy");
    await join(d3, "Ari & Tal");
    console.log("[e2e-m2l1] three pairs joined (the fourth joins late, at Night 3)");

    /* ---- LOBBY: markets are assigned deterministically and shown ---- */
    const d1Handle = (await d1.textContent(".fh-desk-name")).trim();
    const d2Handle = (await d2.textContent(".fh-desk-name")).trim();
    const d3Handle = (await d3.textContent(".fh-desk-name")).trim();
    assert.match(d1Handle, /Desk 1 · New York Knicks/);
    assert.match(d2Handle, /Desk 2 · Memphis Grizzlies/);
    assert.match(d3Handle, /Desk 3 · New York Knicks/);
    await board.waitForFunction(() => document.querySelectorAll(".fh-desk-chip").length >= 3, null, { timeout: 20000 });
    const lobbyBoard = await board.evaluate(() => document.body.innerText);
    assert.match(lobbyBoard, /New York Knicks/);
    assert.match(lobbyBoard, /Memphis Grizzlies/);
    assert.equal(/\b(Rae|Ben|Nour|Ivy|Ari|Tal)\b/.test(lobbyBoard), false, "a student name reached the projector");
    console.log("[e2e-m2l1] LOBBY: desks assigned, markets alternate, no student name on the board");
    await board.screenshot({ path: path.join(SCREEN_DIR, "01-board-lobby-desks.png") });

    /* ---- HOOK ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('HOOK')");
    await d1.waitForFunction(() => document.body.innerText.includes("run the building"), null, { timeout: 20000 });
    await d1.screenshot({ path: path.join(SCREEN_DIR, "02-play-hook.png"), fullPage: true });
    await board.screenshot({ path: path.join(SCREEN_DIR, "03-board-hook.png") });
    console.log("[e2e-m2l1] HOOK rendered on /play and /board");

    /* ---- PLAY ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    for (const p of [d1, d2, d3]) await p.waitForSelector("#fhPlayRoot", { timeout: 20000 });

    // The blind commitment, asserted on the real screen: the pre-lock page shows
    // the card, the dials and the pair's own history, and no outcome at all.
    const preLock = await d1.evaluate(() => document.body.innerText);
    assert.match(preLock, /No preview/i);
    assert.equal(/came|turnout|you will make|revenue/i.test(preLock.replace(/Making it an event/gi, "")), false, "the pre-lock screen previews an outcome");
    console.log("[e2e-m2l1] blind commitment confirmed on the student screen — no outcome before the lock");

    const NIGHTS = [
      { label: "Night 1", d1: 34, d2: 16, d3: 70, d4: null },
      { label: "Night 2", d1: 48, d2: 16, d3: 70, d4: null },
      { label: "Night 3", d1: 40, d2: 16, d3: 70, d4: 30 },
      { label: "Night 4", d1: 90, d2: 16, d3: 70, d4: 84 },
      { label: "Night 5", d1: 34, d2: 16, d3: null, d4: 24 },
    ];

    for (let i = 0; i < NIGHTS.length; i += 1) {
      const night = NIGHTS[i];
      console.log(`[e2e-m2l1] --- ${night.label} ---`);
      for (const p of [d1, d2, d3]) await waitForNight(p, night.label);

      // Desk 4 joins late, mid-window, at Night 3.
      if (i === 2) {
        await join(d4, "Sam & Jo");
        await d4.waitForSelector("#fhPlayRoot", { timeout: 20000 });
        const lateHandle = (await d4.textContent(".fh-desk-name")).trim();
        assert.match(lateHandle, /Desk 4 · Memphis Grizzlies/);
        const lateBody = await d4.evaluate(() => document.body.innerText);
        assert.match(lateBody, /covered/i, "a late desk must be told which nights were covered for it");
        console.log("[e2e-m2l1] Desk 4 joined late at Night 3 and arrived with real, labelled books");
        await d4.screenshot({ path: path.join(SCREEN_DIR, "06-play-late-joiner.png"), fullPage: true });
      }

      await setPrice(d1, night.d1);
      if (i === 2) await bumpSpend(d1, 8); // $40,000 on the night before the shock — pays off on Night 4
      if (i === 3) await d1.check("#fhBowl"); // open the upper bowl on the shock night
      await lockNight(d1);

      await setPrice(d2, night.d2);
      await lockNight(d2);

      if (night.d3 !== null) {
        await setPrice(d3, night.d3);
        await lockNight(d3);
      } else {
        console.log("[e2e-m2l1] Desk 3 never locks Night 5 — the bell must auto-commit it at the plan price");
      }

      if (night.d4 !== null && i >= 2) {
        await setPrice(d4, night.d4);
        await lockNight(d4);
      }

      if (i === 0) {
        // Nothing about an open night may reach the projector.
        const openBoard = await board.evaluate(() => document.body.innerText);
        assert.equal(openBoard.includes("$34"), false, "a locked price for the still-open night reached the projector");
        assert.match(openBoard, /Desks locked in/i);
        await board.screenshot({ path: path.join(SCREEN_DIR, "04-board-night1-open.png") });
        await d1.screenshot({ path: path.join(SCREEN_DIR, "05-play-night1-dials.png"), fullPage: true });
      }

      // The teacher rings the bell. Every desk settles at once.
      await teach.click("#btnCloseNight");
      if (i < NIGHTS.length - 1) {
        for (const p of [d1, d2, d3]) await waitForNight(p, NIGHTS[i + 1].label);
      } else {
        await d1.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 20000 });
      }
      console.log(`[e2e-m2l1] ${night.label} settled for every desk`);

      if (i === 2) {
        // The Two Peaks release is a teacher decision, not a timer.
        const before = await board.evaluate(() => document.body.innerText);
        assert.equal(before.includes("THE TWO PEAKS"), false, "the Two Peaks panel appeared without the teacher releasing it");
        await teach.click("#btnTwoPeaks");
        await board.waitForFunction(() => document.body.innerText.includes("THE TWO PEAKS"), null, { timeout: 20000 });
        const after = await board.evaluate(() => document.body.innerText);
        assert.match(after, /The cheaper ticket made more money/);
        console.log("[e2e-m2l1] Two Peaks released by the teacher, on the room's own Night 3 curve");
        await board.screenshot({ path: path.join(SCREEN_DIR, "07-board-two-peaks.png") });
      }

      if (i === 3) {
        const shockPlay = await d2.evaluate(() => document.body.innerText);
        assert.match(shockPlay, /FULL HOUSE/, "Memphis holding the plan price through the shock should sell out");
        assert.match(shockPlay, /could not get a seat/, "a sold-out night must report the people it turned away");
        console.log("[e2e-m2l1] the shock night sold a building out and reported the fans turned away");
        await d2.screenshot({ path: path.join(SCREEN_DIR, "08-play-shock-soldout.png"), fullPage: true });
      }
    }

    // Desk 3's unlocked Night 5 must have been auto-committed, and labelled.
    // (Each /play page polls on its own ~1.2s cadence — wait for THIS page to
    // catch up to the closed window before reading it.)
    await d3.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 20000 });
    const d3Body = await d3.evaluate(() => document.body.innerText);
    assert.match(d3Body, /auto/i, "the auto-committed night is not labelled on the desk that stalled");
    console.log("[e2e-m2l1] Desk 3's un-locked Night 5 was auto-committed at the plan price and flagged as such");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "09-teach-after-play.png"), fullPage: true });

    /* ---- REVEAL, staged ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    for (let i = 0; i < 7; i += 1) {
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnRevealNext");
      await resp;
      if (i === 4) {
        // Stages 1-5 put the five nights up one at a time, each labelled by card.
        await board.waitForFunction(() => document.body.innerText.includes("N5"), null, { timeout: 20000 });
        const staged = await board.evaluate(() => document.body.innerText);
        assert.match(staged, /N1 · N2 · N3 · N4 · N5/);
        assert.equal(staged.includes("THE TWO PEAKS"), false, "Two Peaks landed before its own stage");
      }
    }
    await board.waitForFunction(() => document.body.innerText.includes("Fullest house"), null, { timeout: 20000 });
    const revealBoard = await board.evaluate(() => document.body.innerText);
    assert.match(revealBoard, /THE TWO PEAKS/);
    assert.match(revealBoard, /Median renewals/i);
    assert.match(revealBoard, /modeled on real market differences/i);
    console.log("[e2e-m2l1] REVEAL played through all 7 stages — Two Peaks, then per-market books");
    await board.screenshot({ path: path.join(SCREEN_DIR, "10-board-reveal-books.png") });

    /* ---- ADAPT: the room's whole curve, both markets, one labelled series each ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('ADAPT')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("ADAPT"), null, { timeout: 20000 });
    const adaptBoard = await board.evaluate(() => document.body.innerText);
    assert.match(adaptBoard, /charge LESS and make MORE/i);
    const curvePoints = await board.evaluate(() => document.querySelectorAll(".scatter-svg circle").length);
    assert.ok(curvePoints >= 15, `expected the room's whole curve on the board, got ${curvePoints} points`);
    await board.screenshot({ path: path.join(SCREEN_DIR, "11-board-adapt-curve.png") });
    console.log(`[e2e-m2l1] ADAPT: questions plus the room's whole curve — ${curvePoints} class points, two labelled series`);

    /* ---- COUNTERFACTUAL: Night 1 vs Night 5 ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('COUNTERFACTUAL')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("COUNTERFACTUAL"), null, { timeout: 20000 });
    const cfBoard = await board.evaluate(() => document.body.innerText);
    assert.match(cfBoard, /Night 1 vs Night 5/i);
    assert.match(cfBoard, /same price/i);
    assert.match(cfBoard, /We can show you what the money would have done/);
    const repeatRows = await board.evaluate(() => document.querySelectorAll(".fh-repeat-row").length);
    assert.ok(repeatRows >= 3, `expected a repeat-card row per desk, got ${repeatRows}`);
    await d1.waitForFunction(() => document.body.innerText.toUpperCase().includes("WHAT IF?"), null, { timeout: 20000 });
    const cfPlay = await d1.evaluate(() => document.body.innerText);
    assert.match(cfPlay, /Same price every night/);
    assert.match(cfPlay, /The most cash the five nights could give/);
    console.log("[e2e-m2l1] COUNTERFACTUAL: N1-vs-N5 on the board, per-desk replays on /play");
    await board.screenshot({ path: path.join(SCREEN_DIR, "12-board-counterfactual-n1-n5.png") });
    await d1.screenshot({ path: path.join(SCREEN_DIR, "13-play-counterfactual.png"), fullPage: true });

    /* ---- SYNTHESIS ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("SYNTHESIS"), null, { timeout: 20000 });
    const synth = await board.evaluate(() => document.body.innerText);
    for (const title of [
      "REVENUE = PRICE × PEOPLE",
      "THE CARD MOVED THE CROWD",
      "THE TICKET IS NOT THE PRODUCT",
      "NIGHT 5 WAS NIGHT 1",
      "TWO BOOKS, NO EXCHANGE RATE",
      "YOUR JOB IS REAL",
    ]) {
      assert.ok(synth.includes(title), `synthesis card missing: ${title}`);
    }
    assert.match(synth, /4,066/); // the dated Fever attendance figure
    assert.match(synth, /2009/); // the dated dynamic-pricing anchor
    assert.equal(/\b(Rae|Ben|Nour|Ivy|Ari|Tal|Sam|Jo)\b/.test(synth), false, "a student name reached the synthesis board");
    console.log("[e2e-m2l1] SYNTHESIS: all six cards computed from this class's own numbers, with dated real anchors");
    await board.screenshot({ path: path.join(SCREEN_DIR, "14-board-synthesis.png") });

    /* ---- COMPLETE ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('COMPLETE')");
    await board.waitForFunction(() => document.body.innerText.toUpperCase().includes("FULL HOUSE — COMPLETE"), null, { timeout: 20000 });
    await board.screenshot({ path: path.join(SCREEN_DIR, "15-board-complete.png") });
    console.log("[e2e-m2l1] COMPLETE reached on all three surfaces");

    if (consoleErrors.length > 0) {
      console.error("[e2e-m2l1] CONSOLE ERRORS DETECTED:\n" + consoleErrors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("[e2e-m2l1] zero console errors across all 6 pages");
      console.log("[e2e-m2l1] PASS — full Full House arc verified end to end across /teach, /play and /board.");
    }
  } catch (error) {
    console.error("[e2e-m2l1] FAILED:", error);
    console.error("[e2e-m2l1] server log tail:\n" + serverLog.split("\n").slice(-40).join("\n"));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
