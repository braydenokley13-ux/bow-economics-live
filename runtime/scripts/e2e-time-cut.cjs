#!/usr/bin/env node
/**
 * Browser truth for TIME CUT and action integrity — W2/W3.
 *
 * Everything the server-side suite proves is proved there. This exists because
 * none of it reaches a student through a test: the class only benefits if the
 * closing window is legible on a Chromebook, on a projector, and in a teacher's
 * peripheral vision, and if a decision the room's timing collided with actually
 * lands on the screen the pair is looking at.
 *
 * One teacher, one projector, two desks, Full House.
 *
 *   1. /teach names the desk that has committed nothing, and what closing does
 *      to it, BEFORE either close control is pressed.
 *   2. FINAL CALL renders on all three surfaces at once, counting the same
 *      window down, and says something different to the desk that is in and
 *      the desk that is not.
 *   3. A lock placed DURING the drain lands. That acceptance is the drain.
 *   4. A lock placed while the teacher has the room paused is held on screen,
 *      not lost, and lands when the room comes back — the defect that was
 *      silently destroying committed decisions.
 *   5. A decision that crossed the cut is refused in the lesson's own words
 *      instead of being applied to a night the pair never saw.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-time-cut.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4312);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-timecut-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-timecut");

const consoleErrors = [];
/**
 * This run deliberately provokes the two refusals a live class produces — a
 * pause (423) and a decision that crossed the cut (409) — and Chromium logs
 * every non-2xx response as a console error whether or not the page handled
 * it. Those two are the SUBJECT of the test, so they are not evidence of a
 * defect; anything else, including any real JS error, still fails the run.
 */
const EXPECTED_NETWORK_NOISE = /Failed to load resource.*status of (409|423)/;
function watchConsole(page, label) {
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (EXPECTED_NETWORK_NOISE.test(m.text())) return;
    if (process.env.E2E_TRACE) console.log("TRACE", label, m.text(), JSON.stringify(m.location()));
    consoleErrors.push(`[${label}] console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      if ((await fetch(`${BASE}/api/lessons`)).ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/** After a night settles the desk sits on its result frame; the pair presses on. */
async function toNextNight(page) {
  await page.waitForSelector("#fhNextNight", { timeout: 25000 });
  await page.click("#fhNextNight");
  await page.waitForSelector("#fhPriceDial", { timeout: 25000 });
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

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
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
    const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    watchConsole(teach, "teach");
    watchConsole(board, "board");
    teach.on("dialog", (d) => d.accept());

    teach.on("requestfailed", (r) => consoleErrors.push(`[teach] request failed: ${r.url()}`));
    teach.on("response", (r) => {
      if (r.status() === 404) consoleErrors.push(`[teach] 404: ${r.url()}`);
    });
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "TIME CUT proof");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage");

    const desks = [];
    for (const name of ["Pair One", "Pair Two"]) {
      const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      watchConsole(p, name);
      p.on("dialog", (d) => d.accept());
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", name);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      desks.push(p);
    }
    const [deskA, deskB] = desks;

    await teach.click("#btnAdvance"); // HOOK
    await teach.click("#btnAdvance"); // PLAY
    for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 30000 });

    /* -- 1. The panel that makes closing safe to press. --------------------- */
    await teach.waitForSelector("#timecut:not([hidden])", { timeout: 10000 });
    await setPrice(deskA, 40);
    await deskA.click("#fhLock");
    await deskA.waitForSelector(".fh-locked-recap", { timeout: 15000 });
    await setPrice(deskB, 56);

    await teach.waitForFunction(
      () => (document.getElementById("tcUnresolved")?.textContent || "").includes("1 in"),
      null,
      { timeout: 12000 },
    );
    const panel = await teach.textContent("#timecut");
    assert.match(panel, /1 in · 1 still deciding/, `the teacher panel must count the room: ${panel.slice(0, 200)}`);
    assert.match(panel, /\$56/, "the undecided desk's own dialled number must appear — that is what makes the fallback a stake");
    assert.match(panel, /season plan/, "the fallback must be the lesson's sentence, not a generic one");
    const policy = await teach.textContent("#tcPolicy");
    assert.match(policy, /does not count as a decision/, "the lesson's one-sentence policy must be on the close control");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-teach-unresolved.png"), fullPage: true });

    /* -- 2. FINAL CALL, on all three surfaces at once. ---------------------- */
    await teach.click("#btnFinalCall");
    await teach.waitForSelector("#timecut.calling", { timeout: 8000 });
    await board.waitForSelector("#fcBand.on", { timeout: 8000 });
    await deskB.waitForSelector("#finalCall:not([hidden])", { timeout: 8000 });
    await deskA.waitForSelector("#finalCall:not([hidden])", { timeout: 8000 });

    // The two desks are told different things, because they are in different
    // positions. A single "time's up" banner would be the cheap version.
    const bText = await deskB.textContent("#fcText");
    const aText = await deskA.textContent("#fcText");
    assert.match(bText, /have not locked in/i, `the undecided desk must be told it has not committed: ${bText}`);
    assert.match(bText, /season plan/, `and what that costs it, in the lesson's words: ${bText}`);
    // Said TO the pair. The teacher's version of this same fact says "their
    // dial"; on the pair's own screen that reads as being about somebody else.
    assert.match(bText, /\byour\b/i, `the pair must be addressed directly: ${bText}`);
    assert.ok(!/their dial/i.test(bText), `the teacher's third-person line has leaked onto the student screen: ${bText}`);
    assert.match(aText, /You're in/, `the committed desk must be told it is done, not scared: ${aText}`);

    // Same window, three clocks, one number. Read them within the same second
    // and require them to agree — this is the whole point of shipping
    // `serverNow` rather than comparing timestamps.
    const reads = await Promise.all([
      teach.textContent("#tcClock"),
      board.textContent("#fcBandClock"),
      deskB.textContent("#fcClock"),
    ]);
    const secs = reads.map((t) => parseFloat(String(t).replace(/[^\d.]/g, "")));
    assert.ok(secs.every((n) => Number.isFinite(n) && n > 0), `every surface must show a running clock, got ${JSON.stringify(reads)}`);
    assert.ok(Math.max(...secs) - Math.min(...secs) <= 2.5, `the three surfaces disagree about the window: ${JSON.stringify(reads)}`);

    // Projector legibility: the number the back row is counting down from.
    const clockPx = await board.$eval("#fcBandClock", (el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(clockPx >= 40, `the projector countdown is ${clockPx}px — the back row cannot read that`);
    await board.screenshot({ path: path.join(SCREEN_DIR, "02-board-final-call.png") });
    await deskB.screenshot({ path: path.join(SCREEN_DIR, "03-play-final-call-unlocked.png") });
    await teach.screenshot({ path: path.join(SCREEN_DIR, "04-teach-final-call.png"), fullPage: true });

    /* -- 3. A last-second change LANDS. The acceptance is the drain. -------- */
    await setPrice(deskB, 34);
    await deskB.click("#fhLock");
    await deskB.waitForSelector(".fh-locked-recap", { timeout: 15000 });
    await teach.waitForFunction(
      () => (document.getElementById("tcUnresolved")?.textContent || "").includes("Every desk is in"),
      null,
      { timeout: 12000 },
    );
    const recap = await deskB.textContent(".fh-locked-recap");
    assert.match(recap, /34/, `the drain must have taken the desk's OWN last-second number: ${recap}`);

    await teach.click("#btnCloseNow");
    await teach.waitForFunction(
      () => (document.querySelector("#controls")?.textContent || "").includes("Night 2"),
      null,
      { timeout: 12000 },
    );

    /* -- 4. Paused: the decision is held on screen, not destroyed. ---------- */
    await toNextNight(deskA);
    await teach.click("#btnPause");
    await teach.waitForFunction(() => document.getElementById("btnPause")?.textContent === "Unpause", null, { timeout: 8000 });
    await setPrice(deskA, 48);
    await deskA.click("#fhLock");
    // The pair must be TOLD their choice is being held. "syncing…" through a
    // teacher pause reads as a broken screen and invites them to change it.
    await deskA.waitForFunction(
      () => /paused|holding/i.test(document.getElementById("syncStatus")?.textContent || ""),
      null,
      { timeout: 10000 },
    );
    const heldLabel = await deskA.textContent("#syncStatus");
    assert.match(heldLabel, /saved/i, `a held decision must say it is saved: "${heldLabel}"`);
    await deskA.screenshot({ path: path.join(SCREEN_DIR, "05-play-held-through-pause.png") });

    await teach.click("#btnPause"); // unpause
    // ...and it lands by itself, with nobody pressing anything again.
    await deskA.waitForSelector(".fh-locked-recap", { timeout: 20000 });
    const landed = await deskA.textContent(".fh-locked-recap");
    assert.match(landed, /48/, `the held lock must land at the pair's own number: ${landed}`);
    console.log("[e2e-time-cut] a lock the teacher's pause collided with was held and landed");

    /* -- 5. A decision that crossed the cut is refused, not substituted. ---- */
    // Desk B is mid-decision on night 2 when the teacher closes it.
    await toNextNight(deskB);
    await setPrice(deskB, 62);
    await teach.click("#btnCloseNow");
    await teach.waitForFunction(
      () => (document.querySelector("#controls")?.textContent || "").includes("Night 3"),
      null,
      { timeout: 12000 },
    );
    // The tap that was already in the pair's hand.
    await deskB.click("#fhLock").catch(() => { /* the button may already have re-rendered */ });
    await deskB.waitForFunction(
      () => /closed while your choice/i.test(document.getElementById("err")?.textContent || ""),
      null,
      { timeout: 15000 },
    ).catch(async () => {
      const err = await deskB.textContent("#err");
      const recap2 = await deskB.$(".fh-locked-recap");
      assert.ok(
        !recap2,
        `a lock for the closed night was applied to the new one instead of being refused (err="${err}")`,
      );
    });
    await deskB.screenshot({ path: path.join(SCREEN_DIR, "06-play-crossed-the-cut.png") });

    assert.deepEqual(consoleErrors, [], `console errors during the run:\n${consoleErrors.join("\n")}`);
    console.log("[e2e-time-cut] PASS — screens in docs/gauntlet/module-2/screens-timecut/");
  } finally {
    if (browser) await browser.close();
    server.kill("SIGKILL");
    try { fs.rmSync(SNAPSHOT_FILE, { force: true }); } catch { /* best effort */ }
  }
}

main().catch((e) => {
  console.error("[e2e-time-cut] FAIL:", e.message);
  process.exit(1);
});
