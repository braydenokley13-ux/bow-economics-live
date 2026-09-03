#!/usr/bin/env node
/**
 * ACTION INTEGRITY (W2) — a slow poll must never visually undo a decision the
 * server has already applied.
 *
 * The transport serialises its own fetches, so two POLLS cannot land out of
 * order. Actions are a different request on a different socket, which opens a
 * window nothing was closing:
 *
 *     t0  the desk's poll leaves, carrying session version 10
 *     t1  the pair locks; the POST lands; the room is now version 11
 *     t2  the t0 response arrives, still version 10, and is rendered
 *     t3  the next poll arrives and puts version 11 back
 *
 * Between t2 and t3 the pair watches their own committed decision come undone
 * on screen — the price dial back where it was, the LOCK button armed again —
 * and a fifth-grader's response to that is to press it again. Nothing is lost
 * on the server, which is exactly why it had never shown up in a state test.
 *
 * This drives the window deterministically: the poll is HELD at the transport
 * with `page.route`, the lock is submitted underneath it, and the stale body is
 * then released. The desk must still be locked.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-stale-poll.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4322);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-stalepoll-${Date.now()}.json`);

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  await assertPortFree(PORT, path.basename(__filename));
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on("data", (b) => process.stderr.write(`[server] ${b}`));
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });

  try {
    await waitForServer();

    const teach = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "E2E stale-poll");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])", { timeout: 20000 });
    const code = (await teach.textContent("#code")).trim();

    const desk = await browser.newPage({ viewport: { width: 1024, height: 600 } });
    desk.on("dialog", (dlg) => dlg.accept()); // LOCK IT IN is behind a confirm guard
    teach.on("dialog", (dlg) => dlg.accept());
    await desk.goto(`${BASE}/play`);
    await desk.fill("#joinCode", code);
    await desk.fill("#joinName", "Pair 1");
    await desk.click("#btnJoin");
    await desk.waitForSelector("#gameCard:not([hidden])", { timeout: 20000 });

    await teach.click("#btnAdvance"); // HOOK
    await teach.click("#btnAdvance"); // PLAY
    await desk.waitForSelector("#fhPriceDial", { timeout: 25000 });

    /* ---- hold the next /api/me response, lock underneath it, then release. */
    let held = null;
    await desk.route("**/api/me", async (route) => {
      if (held) return route.continue();
      // Fetch the STALE body now — before the lock — and sit on it.
      const response = await route.fetch();
      const body = await response.text();
      // The poller is ETagged, so most ticks come back 304 with no body at all.
      // A 304 carries no frame and cannot undo anything: keep looking until a
      // real payload is in hand, which is the only thing that can.
      if (response.status() !== 200 || body.length === 0) return route.fulfill({ status: response.status(), headers: response.headers(), body });
      held = { route, body, status: response.status(), headers: response.headers() };
    });

    // Move the room so the next tick misses its ETag and carries a real body:
    // this desk's own price. The frame that gets held is therefore "price 40,
    // not locked" — the exact frame that would undo the lock.
    await desk.$eval("#fhPriceDial", (el) => {
      el.value = "40";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await desk.waitForFunction(() => document.getElementById("fhPriceReadout")?.textContent === "$40", null, { timeout: 15000 });

    // Give the poller a beat to issue the request that will be held.
    await desk.waitForFunction(() => true);
    for (let i = 0; i < 60 && !held; i += 1) await new Promise((r) => setTimeout(r, 100));
    assert.ok(held, "no /api/me poll was captured — the window this test drives does not exist as described");
    const staleVersion = JSON.parse(held.body).session.version;

    await desk.click("#fhLock");
    // The POST is what makes this real: the server is now strictly ahead of the
    // body being held.
    await desk.waitForFunction(
      () => !!document.querySelector(".fh-locked-recap") || !!document.querySelector(".hl-gate-band"),
      null,
      { timeout: 20000 },
    );
    const lockedBefore = await desk.evaluate(() => ({
      locked: !!document.querySelector(".fh-locked-recap"),
      dial: !!document.querySelector("#fhPriceDial"),
    }));
    assert.equal(lockedBefore.locked, true, "the desk never reached its locked screen");

    // Watch the DOM ITSELF, not a sample of it. A stale frame is repaired by the
    // very next poll, so polling the DOM at 100ms can miss a revert a student
    // sitting in front of it would see. A MutationObserver cannot.
    await desk.evaluate(() => {
      window.__revertSeen = 0;
      window.__renders = 0;
      const body = document.getElementById("gameBody");
      const obs = new MutationObserver(() => {
        window.__renders += 1;
        if (!document.querySelector(".fh-locked-recap") && document.querySelector("#fhPriceDial")) window.__revertSeen += 1;
      });
      obs.observe(body, { childList: true, subtree: true });
      window.__obs = obs;
    });
    // NON-VACUITY: the watcher must be able to see the thing it is watching for.
    await desk.evaluate(() => {
      const recap = document.querySelector(".fh-locked-recap");
      window.__parkedClass = recap.className;
      recap.className = "fh-poisoned-recap";
      const probe = document.createElement("input");
      probe.type = "range";
      probe.id = "fhPriceDial";
      probe.id = "fhPriceDial";
      document.getElementById("gameBody").appendChild(probe);
    });
    await desk.waitForFunction(() => window.__revertSeen > 0, null, { timeout: 5000 });
    await desk.evaluate(() => {
      document.getElementById("fhPriceDial")?.remove();
      document.querySelector(".fh-poisoned-recap").className = window.__parkedClass;
      window.__revertSeen = 0;
      window.__renders = 0;
    });

    // Release the stale body into the client, and prove it actually arrived —
    // a pass on a frame that was never delivered proves nothing.
    let delivered = 0;
    const countDelivery = (res) => {
      if (res.url().endsWith("/api/me") && res.status() === 200) delivered += 1;
    };
    desk.on("response", countDelivery);
    await held.route.fulfill({ status: held.status, headers: held.headers, body: held.body });
    await desk.unroute("**/api/me");

    // Let the client render it, and render whatever comes after it.
    await new Promise((r) => setTimeout(r, 2500));
    const seen = await desk.evaluate(() => ({ reverts: window.__revertSeen, renders: window.__renders }));
    assert.ok(seen.renders > 0, "the desk never re-rendered after the stale body was released — this test proved nothing");
    assert.equal(
      seen.reverts,
      0,
      `a stale poll (version ${staleVersion}) undid a committed decision on the student's own screen ${seen.reverts} time(s)`,
    );
    desk.off("response", countDelivery);
    assert.ok(delivered > 0, "the stale body was never delivered to the client — this test proved nothing");
    const finalState = await desk.evaluate(() => !!document.querySelector(".fh-locked-recap"));
    assert.equal(finalState, true, "the desk did not finish locked");

    /* ---- OVER-BLOCKING: a gate that refuses everything also "passes" above. */
    await teach.click("#btnCloseNight");
    await desk.waitForFunction(
      () => /Night 2 of/.test(document.body.innerText) || /NIGHT 2/i.test(document.body.innerText),
      null,
      { timeout: 25000 },
    );
    console.log("[stale-poll] the desk still followed the room to Night 2 — the gate refuses old frames, not new ones");
    console.log(`[stale-poll] PASS — a version-${staleVersion} body arriving after the lock did not undo it (${seen.renders} renders observed)`);
  } finally {
    await browser.close();
    server.kill("SIGTERM");
    try { fs.unlinkSync(SNAPSHOT_FILE); } catch { /* nothing to clean */ }
  }
}

main().catch((error) => {
  console.error("[stale-poll] FAIL —", error.message);
  process.exitCode = 1;
});
