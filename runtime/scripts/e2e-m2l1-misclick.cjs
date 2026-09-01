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
 * This asserts the repair on both limbs:
 *   1. a confirm() now guards the click, names the night, the desks that have
 *      not locked and the nights that will never happen — and CANCELLING it
 *      leaves the session in PLAY with nothing settled;
 *   2. accepting it settles the currently-open night on the dials as they
 *      stand ($56), not on the plan price, per D17's auto-resolve-on-exit
 *      precedent.
 *
 *   node runtime/scripts/e2e-m2l1-misclick.cjs
 */
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

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

    /* ---- limb 2: accepting honours the dials the pair actually set ---- */
    teach.once("dialog", async (d) => d.accept());
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    await play.waitForFunction(() => document.body.innerText.includes("Your five nights"), null, { timeout: 20000 });
    const playText = await play.evaluate(() => document.body.innerText);
    await play.screenshot({ path: path.join(SCREEN_DIR, "misclick-03-play-after-advance.png"), fullPage: true });
    assert.ok(
      playText.includes(`$${SET_PRICE}`),
      `the pair's own $${SET_PRICE} was discarded — this is the D1 defect, not the repair`,
    );
    const teacherKey = await teach.evaluate(() => localStorage.getItem("bow-teach-session-key"));
    const teacher = await (
      await fetch(`${BASE}/api/sessions/${code}/teacher`, { headers: { Authorization: `Bearer ${teacherKey}` } })
    ).json();
    const nights = teacher.view.desks[0].nightsPlayed;
    assert.equal(nights, 5, `expected all five nights settled by the exit, got ${nights}`);
    console.log(`[misclick] accepted: five nights settled, and Night 1 kept the pair's own $${SET_PRICE}`);

    assert.deepEqual(errors, [], `console errors: ${errors.join(" | ")}`);
    console.log("[misclick] zero console errors");
    console.log("[misclick] PASS — the misclick is guarded, cancellable, and no longer throws away a set price.");
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
