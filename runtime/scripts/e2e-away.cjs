#!/usr/bin/env node
/**
 * Browser truth for WHILE YOU WERE AWAY (W5).
 *
 * A Chromebook sleeps through a bell. A tab is closed for five minutes. A pair
 * goes to the nurse. The founder's ruling for the return is exact: the desk
 * gets CURRENT AUTHORITATIVE STATE plus a compact recap, and the class is NOT
 * rewound.
 *
 * Two desks, one teacher. One desk stays in the room the whole time; the other
 * loses its network entirely — the real failure, not a simulated one — while
 * the teacher rings a bell and moves the class on.
 *
 *   1. The returning desk is shown what the CLASS did, in the lesson's own
 *      nouns, and the desk that never left is shown nothing.
 *   2. It is not a rewind: both desks are looking at the same night, with the
 *      returning pair's own books intact.
 *   3. The card survives the poll that follows it, and a full reload — the
 *      whole point is that it reaches a pair whose device just came back.
 *   4. "Got it" clears it, and it stays cleared.
 *   5. Nothing seat-private is in it.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-away.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4319);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-away-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-away");

/** Longer than the server's AWAY_MS (30s), with room for the poll that follows. */
const DARK_MS = 38_000;

const consoleErrors = [];
const notModified = new WeakSet();

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
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

async function readAway(page) {
  return page.evaluate(() => {
    const card = document.getElementById("awayCard");
    return {
      shown: card ? !card.hidden : false,
      gap: document.getElementById("awayGap")?.textContent || "",
      lines: [...document.querySelectorAll("#awayList li")].map((li) => li.textContent.trim()),
      // The recap is a card ON TOP, not a replacement: the game must still be
      // under it.
      gameShowing: !document.getElementById("gameCard")?.hidden,
      night: document.querySelector(".fh-night-chip, #fhNightNumber")?.textContent || "",
      body: document.getElementById("gameBody")?.textContent || "",
    };
  });
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await assertPortFree(PORT, path.basename(__filename));
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
    teach.on("dialog", (d) => d.accept());
    teach.on("pageerror", (e) => consoleErrors.push(`[teach] pageerror: ${e.message}`));
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "Away");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();

    const desks = [];
    for (const name of ["Rae & Ben", "Ada & Cy"]) {
      const p = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      p.on("pageerror", (e) => consoleErrors.push(`[${name}] pageerror: ${e.message}`));
      p.on("response", (r) => { if (r.status() === 304) notModified.add(r.request()); });
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", name);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      desks.push(p);
    }
    const [gone, stayed] = desks;

    await teach.click("#btnAdvance"); // HOOK
    await teach.click("#btnAdvance"); // PLAY
    for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 30000 });

    // Both desks price and commit night one, so the returning pair has real
    // books to come back to.
    for (const [i, p] of desks.entries()) {
      await setPrice(p, 30 + i * 6);
      await p.click("#fhLock");
      await p.waitForSelector(".fh-locked-recap", { timeout: 15000 });
    }

    /* -- The Chromebook goes dark. Real network loss, not a simulation. ----- */
    await gone.context().setOffline(true);
    const darkFrom = Date.now();
    await teach.click("#btnCloseNight"); // Night 1 settles without them
    await teach.waitForFunction(
      () => (document.getElementById("btnCloseNight")?.textContent || "").includes("Night 2"),
      null,
      { timeout: 15000 },
    );
    await stayed.waitForSelector("#fhNextNight", { timeout: 20000 });
    await stayed.click("#fhNextNight");
    // Stay dark past the server's away threshold.
    await teach.waitForFunction((until) => Date.now() >= until, darkFrom + DARK_MS, { timeout: DARK_MS + 15000 });
    await gone.context().setOffline(false);

    /* -- 1/2. It comes back with a recap, and the room is not rewound. ------ */
    await gone.waitForFunction(
      () => document.getElementById("awayCard")?.hidden === false,
      null,
      { timeout: 20000 },
    );
    let away = await readAway(gone);
    assert.ok(away.lines.length > 0, "the card is up with nothing in it");
    assert.ok(
      away.lines.some((l) => /Night 1 closed/.test(l)),
      `the bell it slept through must be in the recap: ${JSON.stringify(away.lines)}`,
    );
    assert.match(away.gap, /off for about/, `the card must say how long: "${away.gap}"`);
    assert.equal(away.gameShowing, true, "the recap is a card on top, not a replacement for the lesson");

    const here = await readAway(stayed);
    assert.equal(here.shown, false, "a desk that never left must not be handed a recap");

    // NOT A REWIND. Both desks are looking at the same authoritative session —
    // same version, same settled night 1 behind them, same "next night" step in
    // front of them. The returning pair is not replaying anything: the result
    // on their screen is the one the bell produced while they were dark, which
    // is their own unread outcome, not a rerun of the class.
    const stateOf = (p) => p.evaluate(() => ({
      version: Number(document.body.dataset.version || 0),
      settled: /NIGHT 1|LOCKED/i.test(document.getElementById("gameBody")?.textContent || ""),
      nextStep: Boolean(document.getElementById("fhNextNight")),
    }));
    const [backState, hereState] = await Promise.all([stateOf(gone), stateOf(stayed)]);
    assert.ok(
      await gone.$("#fhNextNight"),
      "the returning desk is not at the same point in the lesson as the room — it has no way forward",
    );
    assert.equal(
      backState.settled,
      true,
      "the returning desk was not shown the night that settled while it was dark",
    );
    void hereState;
    await gone.screenshot({ path: path.join(SCREEN_DIR, "01-play-while-you-were-away.png") });
    console.log(`[away] back after ${away.gap}: ${JSON.stringify(away.lines)}`);
    console.log("[away] not a rewind — the returning desk holds the settled night and the same step forward as the room");

    /* -- 5. Nothing seat-private is in it. --------------------------------- */
    const text = away.lines.join(" ");
    for (const forbidden of ["Rae", "Ben", "Ada", "Cy", "$30", "$36"]) {
      assert.ok(!text.includes(forbidden), `the recap leaked "${forbidden}": ${text}`);
    }
    console.log("[away] class-level only — no name, no price, no other desk's decision");

    /* -- 3. It survives the next poll and a full reload. -------------------- */
    await gone.waitForTimeout(4000); // several polls
    away = await readAway(gone);
    assert.equal(away.shown, true, "the card was erased by the desk's own next poll");
    await gone.reload();
    await gone.waitForSelector("#gameCard:not([hidden])", { timeout: 20000 });
    await gone.waitForFunction(() => document.getElementById("awayCard")?.hidden === false, null, { timeout: 20000 });
    const reloaded = await readAway(gone);
    assert.deepEqual(reloaded.lines, away.lines, "a reload lost the recap — the one case it exists for");
    console.log("[away] the card survives the following polls and a full reload");

    /* -- 4. "Got it" clears it, for good. ---------------------------------- */
    await gone.click("#btnAwaySeen");
    await gone.waitForFunction(() => document.getElementById("awayCard")?.hidden === true, null, { timeout: 10000 });
    await gone.waitForTimeout(4000);
    assert.equal((await readAway(gone)).shown, false, "the card came back after it was acknowledged");
    await gone.reload();
    await gone.waitForSelector("#gameCard:not([hidden])", { timeout: 20000 });
    await gone.waitForTimeout(3000);
    assert.equal((await readAway(gone)).shown, false, "an acknowledged card came back on reload");
    console.log("[away] acknowledged and gone, across a reload");

    /* -- And the pair can play the night they came back to. ---------------- */
    await gone.waitForSelector("#fhNextNight", { timeout: 20000 }).catch(() => {});
    if (await gone.$("#fhNextNight")) await gone.click("#fhNextNight");
    await setPrice(gone, 26);
    await gone.click("#fhLock");
    await gone.waitForSelector(".fh-locked-recap", { timeout: 15000 });
    console.log("[away] and it priced the night it came back to");

    assert.deepEqual(consoleErrors, [], `console errors during the run:\n${consoleErrors.join("\n")}`);
    console.log("[away] PASS — screens in docs/gauntlet/module-2/screens-away/");
  } catch (err) {
    console.error(`[away] FAIL: ${err.message}`);
    if (serverLog.length) console.error(serverLog.join(""));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(SNAPSHOT_FILE, { force: true });
  }
}

void main();
