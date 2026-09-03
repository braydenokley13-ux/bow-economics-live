#!/usr/bin/env node
/**
 * M2 L1 "Full House" — the teacher-misclick repro from `gate-l1-qa` D1/D3
 * (BLOCKING dissent `qa-teacher-misclick`), driven in a real browser.
 *
 * The gate's exact scenario: one seat, advance to PLAY, set a price and do NOT
 * lock it, then click the teacher's primary Advance button instead of the night
 * bell. Before the repair this silently ended the five-night window with no
 * dialog AND discarded the $56 the pair had dialled, settling all five nights
 * at the flat season-plan price.
 *
 * This asserts the repair on three limbs:
 *   1. a confirm() now guards the click, names the night, the desks that have
 *      not locked and the nights that will never happen — and CANCELLING it
 *      leaves the session in PLAY with nothing settled;
 *   2. accepting it settles every night the same way the teacher's own bell
 *      does: an uncommitted desk goes to its season plan price with nothing
 *      spent, marked AUTO. This limb used to assert the OPPOSITE — that the
 *      exit honoured the $56 on the dial — and that divergence was the defect,
 *      not the repair: the same room, the same student action, and two
 *      different economies depending on which control the teacher happened to
 *      press. Reproduced directly against the module (a desk showing $56
 *      settled at $56 through the exit and $24 through the bell, which is the
 *      path a real class takes every night). D17 governs M1 L2's unresolved
 *      BIDS; it does not license M2 from having one fallback. The product
 *      promises the bell's version in three places — the bell's own confirm
 *      line, the WATCH FOR flag, and the desk's AUTO badge — and honouring an
 *      unlocked dial would dissolve LOCK IT IN, the signature commitment beat
 *      of all three Module 2 lessons;
 *   3. and because that fallback is real, the misclick has to be survivable:
 *      Restore puts the five nights back.
 *
 *   node runtime/scripts/e2e-m2l1-misclick.cjs
 */
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.resolve(__dirname, "..");
const PORT = 4316;
const BASE = `http://localhost:${PORT}`;
const SCRATCH = path.join(ROOT, ".e2e-scratch");
const SCREEN_DIR = path.resolve(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l1-repair");
const SET_PRICE = 56;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  const snapshot = path.join(SCRATCH, `snapshot-m2l1-misclick-${Date.now()}.json`);
  await assertPortFree(PORT, require("path").basename(__filename));
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: snapshot },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/lessons`);
      if (res.ok) return { server, snapshot, log: () => log };
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`server never came up:\n${log}`);
}

async function main() {
  const { server, snapshot, log } = await boot();
  const browser = await chromium.launch();
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const teach = await ctx.newPage();
    const play = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    for (const [name, page] of [["teach", teach], ["play", play]]) {
      page.on("console", (m) => m.type() === "error" && errors.push(`${name}: ${m.text()}`));
      page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
    }

    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "Misclick repro");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();

    await play.goto(`${BASE}/play`);
    await play.fill("#joinCode", code);
    await play.fill("#joinName", "Rae & Ben");
    await play.click("#btnJoin");
    await play.waitForSelector("#gameCard:not([hidden])");
    await play.waitForSelector(".fh-desk-name", { timeout: 20000 });

    await teach.click("#btnAdvance"); // LOBBY -> HOOK
    await teach.click("#btnAdvance"); // HOOK -> PLAY
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    await play.waitForSelector("#fhPriceDial");

    // gate-l1-qa D2: the primary commit control's touch target at 1366x768.
    const lockBox = await play.locator("#fhLock").boundingBox();
    console.log(`[misclick] LOCK IT IN measures ${Math.round(lockBox.width)}x${Math.round(lockBox.height)}px at 1366x768`);
    assert.ok(lockBox.height >= 44, `LOCK IT IN is ${lockBox.height}px tall — under the 44px touch target`);

    // Set a real price. Do NOT lock it. This is the pair mid-decision.
    await play.evaluate((price) => {
      const dial = document.getElementById("fhPriceDial");
      dial.value = String(price);
      dial.dispatchEvent(new Event("input", { bubbles: true }));
      dial.dispatchEvent(new Event("change", { bubbles: true }));
    }, SET_PRICE);
    await play.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, SET_PRICE);
    await sleep(1200); // let the outbox flush the setPrice action
    await play.screenshot({ path: path.join(SCREEN_DIR, "misclick-01-play-set-not-locked.png"), fullPage: true });

    /* ---- limb 1: the guard exists, and cancelling it changes nothing ---- */
    let dialogText = null;
    teach.once("dialog", async (d) => {
      dialogText = d.message();
      await d.dismiss();
    });
    await teach.click("#btnAdvance");
    await sleep(1500);
    assert.ok(dialogText, "no confirm() appeared — one tap still ends the five-night window silently");
    console.log(`[misclick] confirm() text: ${dialogText}`);
    for (const fragment of ["Night 1 of 5", "still open", "never be played", "has not locked"]) {
      assert.ok(dialogText.includes(fragment), `the warning does not say "${fragment}"`);
    }
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    const stillOpen = await (await fetch(`${BASE}/api/sessions/${code}/board`)).json();
    const phaseAfterCancel = stillOpen.phase ?? stillOpen.session?.phase ?? (await teach.textContent(".phasechip.current")).trim();
    assert.equal(phaseAfterCancel, "PLAY", `cancelling the dialog advanced the session anyway (phase ${phaseAfterCancel})`);
    console.log("[misclick] cancelled: session is still in PLAY, nothing settled");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "misclick-02-teach-cancelled.png"), fullPage: true });

    /* ---- limb 2: accepting settles exactly as the night bell does ---- */
    // The warning the teacher is agreeing to has to be TRUE. It used to promise
    // the dial would be honoured, which stopped being the case when the two
    // close paths were unified onto the bell's policy.
    assert.ok(
      /season plan price with nothing spent, marked AUTO/.test(dialogText),
      `the warning does not state the real fallback: ${dialogText}`,
    );
    assert.ok(
      !/whatever price is on/.test(dialogText),
      `the warning still promises the pair's dial will be honoured, which is no longer what happens: ${dialogText}`,
    );

    const teacherKey = await teach.evaluate(() => localStorage.getItem("bow-teach-session-key"));
    const readTeacher = async () =>
      (await (await fetch(`${BASE}/api/sessions/${code}/teacher`, { headers: { Authorization: `Bearer ${teacherKey}` } })).json());

    teach.once("dialog", async (d) => d.accept());
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    await play.waitForFunction(() => document.body.innerText.includes("Your five nights"), null, { timeout: 20000 });
    await play.screenshot({ path: path.join(SCREEN_DIR, "misclick-03-play-after-advance.png"), fullPage: true });

    const settled = await readTeacher();
    const desk = settled.view.desks[0];
    assert.equal(desk.nightsPlayed, 5, `expected all five nights settled by the exit, got ${desk.nightsPlayed}`);
    assert.notEqual(
      desk.price,
      SET_PRICE,
      `the exit honoured an unlocked $${SET_PRICE} dial — the bell would not have, and one lesson cannot have two fallbacks`,
    );

    // The pair's own screen has to SAY the night was settled for them rather
    // than by them. A number appearing with no explanation is how a pair
    // concludes the game cheated.
    const history = await play.evaluate(() => document.body.innerText);
    assert.ok(
      /AUTO/i.test(history),
      "the desk's nights are not marked AUTO — a pair whose dial was not used must be told so, not left to infer it",
    );
    console.log(`[misclick] accepted: five nights settled at the plan price ($${desk.price}), marked AUTO — same as the bell`);

    /* ---- limb 3: and the misclick is recoverable ---- */
    // An honest fallback that cannot be undone is still a class lost to one
    // stray click.
    teach.once("dialog", async (d) => d.accept());
    await teach.click("#btnRestore");
    await teach.waitForSelector(".phasechip.current:text('PLAY')", { timeout: 15000 });
    const restored = (await readTeacher()).view.desks[0];
    assert.equal(restored.nightsPlayed, 0, `Restore did not bring the five nights back (nightsPlayed ${restored.nightsPlayed})`);
    assert.equal(restored.price, SET_PRICE, `Restore did not bring back the pair's own $${SET_PRICE} on the dial`);
    console.log(`[misclick] restored: back in PLAY, five nights unplayed, the pair's $${SET_PRICE} still on the dial`);

    assert.deepEqual(errors, [], `console errors: ${errors.join(" | ")}`);
    console.log("[misclick] zero console errors");
    console.log("[misclick] PASS — the misclick is guarded, cancellable, honestly described, and recoverable.");
  } catch (error) {
    console.error("[misclick] FAILED:", error);
    console.error("[misclick] server log tail:\n" + log().split("\n").slice(-12).join("\n"));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill("SIGTERM");
    try {
      fs.rmSync(snapshot, { force: true });
    } catch {
      /* scratch only */
    }
  }
}

void main();
