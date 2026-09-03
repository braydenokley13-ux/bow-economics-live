#!/usr/bin/env node
/**
 * Browser truth for THE DECK — the sticky live bar on /teach (W6/W7).
 *
 * The console is ~2800px tall in a live Full House night: setup card, join
 * code, TIME CUT, the room read, a full page of director script, then the
 * control rows. The night bell — the control a teacher presses five times in
 * fifty minutes — was somewhere in the middle of that. A teacher standing in
 * front of twelve pairs does not scroll to find it.
 *
 * The deck hosts (never duplicates) the live controls. This proves:
 *
 *   1. It is on screen without scrolling, while the page underneath it is
 *      several viewports tall.
 *   2. It hosts the phase's real control and Advance — and there is exactly ONE
 *      of each button in the document, because they were MOVED, not copied.
 *   3. The bell fired from the deck actually closes the night: the listener
 *      survived the move, and the confirm still runs.
 *   4. It says when the room is held, because it is the one strip a teacher is
 *      guaranteed to be looking at.
 *   5. It stands down when the session ends and every button goes home.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-teach-deck.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4318);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-deck-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-teach-deck");

const PRICES = [22, 26, 30, 34, 38, 44];
const consoleErrors = [];
const notModified = new WeakSet();

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/** The deck exactly as the console has rendered it, plus what it is hosting. */
async function readDeck(teach) {
  return teach.evaluate(() => {
    const deck = document.getElementById("deck");
    const box = deck.getBoundingClientRect();
    return {
      on: deck.classList.contains("on"),
      held: deck.classList.contains("held"),
      where: document.getElementById("deckWhere")?.textContent || "",
      sub: document.getElementById("deckSub")?.textContent || "",
      hosting: [...document.querySelectorAll("#deckSlot .btn")].map((b) => b.id),
      labels: [...document.querySelectorAll("#deckSlot .btn")].map((b) => b.textContent.replace(/\s+/g, " ").trim()),
      // Sticky-bottom truth: where the strip actually sits without scrolling,
      // and how much page there is under it.
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      viewport: window.innerHeight,
      scrollY: Math.round(window.scrollY),
      pageHeight: document.documentElement.scrollHeight,
      // Duplication is the failure this design exists to make impossible.
      bellNodes: document.querySelectorAll("#btnCloseNight, [id='btnCloseNight']").length,
      advanceNodes: document.querySelectorAll("#btnAdvance").length,
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

    // A real teacher laptop, not a tall test window: the whole point is that the
    // console does not fit and the deck does not care.
    const teach = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    teach.on("dialog", (d) => d.accept());
    teach.on("pageerror", (e) => consoleErrors.push(`[teach] pageerror: ${e.message}`));
    teach.on("response", (r) => { if (r.status() === 304) notModified.add(r.request()); });
    teach.on("requestfailed", (r) => {
      if (notModified.has(r)) return; // Chromium reports a bodyless 304 as ERR_ABORTED
      consoleErrors.push(`[teach] request failed: ${r.url()} :: ${r.failure()?.errorText}`);
    });
    await teach.goto(`${BASE}/teach`);

    // Before a session exists there is nothing to direct, so the deck stays away.
    let deck = await readDeck(teach);
    assert.equal(deck.on, false, "the deck must not be on the setup screen");

    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "The deck");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();

    const desks = [];
    for (let i = 0; i < PRICES.length; i += 1) {
      const p = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      p.on("pageerror", (e) => consoleErrors.push(`[desk${i + 1}] pageerror: ${e.message}`));
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", `Pair ${i + 1}`);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      desks.push(p);
    }

    /* -- 1/2. In LOBBY the deck already carries the flow control. ---------- */
    await teach.waitForFunction(() => document.getElementById("deck").classList.contains("on"), null, { timeout: 15000 });
    deck = await readDeck(teach);
    assert.deepEqual(deck.hosting, ["btnAdvance"], `LOBBY has one live control: ${JSON.stringify(deck.hosting)}`);
    assert.match(deck.sub, /6 joined/, `the deck must read the room in LOBBY: "${deck.sub}"`);

    await teach.click("#btnAdvance"); // HOOK
    await teach.click("#btnAdvance"); // PLAY
    for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 30000 });
    await teach.waitForFunction(
      () => [...document.querySelectorAll("#deckSlot .btn")].some((b) => b.id === "btnCloseNight"),
      null,
      { timeout: 15000 },
    );

    deck = await readDeck(teach);
    assert.ok(deck.hosting.includes("btnCloseNight"), `the night bell belongs on the deck: ${JSON.stringify(deck.hosting)}`);
    assert.equal(deck.hosting[deck.hosting.length - 1], "btnAdvance", "Advance sits last, after the phase's own control");
    assert.equal(deck.bellNodes, 1, `the bell must be MOVED, not copied — found ${deck.bellNodes} of it`);
    assert.equal(deck.advanceNodes, 1, `Advance must be MOVED, not copied — found ${deck.advanceNodes} of it`);
    assert.match(deck.where, /window is open/i, `the deck must say where the class is: "${deck.where}"`);
    assert.match(deck.sub, /0 of 6 locked in/, `the deck must count the room: "${deck.sub}"`);
    assert.ok(
      deck.labels.some((l) => /Night 1/.test(l)),
      `the bell keeps its full label on the deck: ${JSON.stringify(deck.labels)}`,
    );

    // THE DEFECT THIS FIXES: the page is several viewports tall and the strip
    // is still on screen at scroll 0.
    assert.ok(deck.pageHeight > deck.viewport * 1.5, `the console should be taller than the screen: ${deck.pageHeight}px`);
    assert.equal(deck.scrollY, 0, "measured without scrolling");
    assert.ok(
      deck.bottom <= deck.viewport + 2 && deck.top >= 0,
      `the deck must be on screen unscrolled: top ${deck.top}, bottom ${deck.bottom}, viewport ${deck.viewport}`,
    );
    await teach.screenshot({ path: path.join(SCREEN_DIR, "01-deck-play.png") });
    console.log(
      `[teach-deck] PLAY: deck hosts ${deck.hosting.join(" + ")} at y=${deck.top} of a ${deck.pageHeight}px console`,
    );

    /* -- 4. Held rooms say so on the strip the teacher is watching. -------- */
    await teach.click("#btnPause");
    await teach.waitForFunction(() => document.getElementById("deck").classList.contains("held"), null, { timeout: 15000 });
    deck = await readDeck(teach);
    assert.match(deck.sub, /Paused/, `a paused room must say so on the deck: "${deck.sub}"`);
    await teach.screenshot({ path: path.join(SCREEN_DIR, "02-deck-held.png") });
    await teach.click("#btnPause"); // unpause
    await teach.waitForFunction(() => !document.getElementById("deck").classList.contains("held"), null, { timeout: 15000 });
    console.log("[teach-deck] a held room is legible from the deck");

    /* -- 3. The bell fired FROM the deck really closes the night. ---------- */
    for (let i = 0; i < desks.length; i += 1) {
      await desks[i].waitForSelector("#fhPriceDial");
      await desks[i].$eval("#fhPriceDial", (el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, PRICES[i]);
      await desks[i].click("#fhLock");
      await desks[i].waitForSelector(".fh-locked-recap", { timeout: 15000 });
    }
    await teach.waitForFunction(
      () => (document.getElementById("deckSub")?.textContent || "").startsWith("6 of 6"),
      null,
      { timeout: 15000 },
    );
    // Click it as it sits in the deck, by its position on screen — not by a
    // selector the harness could resolve to a copy somewhere else.
    const bellBox = await teach.evaluate(() => {
      const b = document.querySelector("#deckSlot #btnCloseNight");
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    assert.ok(bellBox, "the bell must be in the deck to be pressed from it");
    await teach.mouse.click(bellBox.x, bellBox.y);
    await teach.waitForFunction(
      () => (document.querySelector("#deckSlot #btnCloseNight")?.textContent || "").includes("Night 2"),
      null,
      { timeout: 15000 },
    );
    for (const p of desks) await p.waitForSelector("#fhNextNight", { timeout: 20000 });
    console.log("[teach-deck] the bell fired from the deck closed the night — the listener survived the move");

    /* -- 5. Session over: the deck stands down and everything goes home. --- */
    await teach.click("#btnEnd");
    await teach.waitForFunction(() => !document.getElementById("deck").classList.contains("on"), null, { timeout: 15000 });
    deck = await readDeck(teach);
    assert.equal(deck.hosting.length, 0, `the deck must empty when the class ends: ${JSON.stringify(deck.hosting)}`);
    const home = await teach.evaluate(() => ({
      bell: document.getElementById("btnCloseNight")?.closest("section")?.id ?? null,
      advance: document.getElementById("btnAdvance")?.closest("section")?.id ?? null,
      strayMarks: document.getElementById("controls")?.innerHTML.includes("deck:") ?? false,
    }));
    assert.equal(home.bell, "controls", `the bell must go back to its own row, not vanish: ${home.bell}`);
    assert.equal(home.advance, "controls", `Advance must go back to its own row: ${home.advance}`);
    assert.equal(home.strayMarks, false, "the deck's home markers must be cleaned up");
    console.log("[teach-deck] class over: the deck stands down and every control is home");

    assert.deepEqual(consoleErrors, [], `console errors during the run:\n${consoleErrors.join("\n")}`);
    console.log("[teach-deck] PASS — screens in docs/gauntlet/module-2/screens-teach-deck/");
  } catch (err) {
    console.error(`[teach-deck] FAIL: ${err.message}`);
    if (serverLog.length) console.error(serverLog.join(""));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(SNAPSHOT_FILE, { force: true });
  }
}

void main();
