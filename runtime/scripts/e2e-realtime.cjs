#!/usr/bin/env node
/**
 * Browser truth for the push transport — W4.
 *
 * Two things the Node harness cannot prove, because it models the client
 * rather than running it:
 *
 *   1. a real Chromium EventSource against this server actually delivers, and
 *      the three surfaces repaint from a teacher's press in well under the poll
 *      interval they used to wait out;
 *   2. when the stream is unavailable — which on a school AP is a WHEN — every
 *      surface still works, on its original interval, with nothing broken and
 *      nothing said to the room.
 *
 * The second limb is the important one. It is run by blocking the stream route
 * at the browser, so the page takes the failure path for real rather than being
 * asked politely not to use the feature.
 *
 * Run from runtime/ after `npm run build`: node scripts/e2e-realtime.cjs
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4313);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-realtime-${Date.now()}.json`);

/** The poll intervals each surface falls back to. A push repaint must beat these by a wide margin. */
const POLL_MS = { board: 1000, play: 1200, teach: 1500 };

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/** Milliseconds from a teacher control returning to a surface showing it. */
async function timeToShow(control, page, predicate) {
  const t0 = Date.now();
  await control();
  await page.waitForFunction(predicate, null, { timeout: 20000, polling: 20 });
  return Date.now() - t0;
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let browser;
  const errors = [];
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
    const ctx = await browser.newContext();

    const teach = await ctx.newPage({ viewport: { width: 1280, height: 900 } });
    teach.on("dialog", (d) => d.accept());
    teach.on("pageerror", (e) => errors.push(`teach: ${e.message}`));
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();

    const board = await ctx.newPage({ viewport: { width: 1366, height: 768 } });
    board.on("pageerror", (e) => errors.push(`board: ${e.message}`));
    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage");

    const play = await ctx.newPage({ viewport: { width: 1366, height: 768 } });
    play.on("dialog", (d) => d.accept());
    play.on("pageerror", (e) => errors.push(`play: ${e.message}`));
    await play.goto(`${BASE}/play`);
    await play.fill("#joinCode", code);
    await play.fill("#joinName", "Pair One");
    await play.click("#btnJoin");
    await play.waitForSelector("#gameCard:not([hidden])");

    // Every surface marks which transport is carrying it on its own document.
    for (const [page, label] of [[teach, "teach"], [board, "board"], [play, "play"]]) {
      await page.waitForFunction(() => document.documentElement.dataset.push === "on", null, { timeout: 10000 })
        .catch(() => { throw new Error(`${label} never connected its push stream`); });
    }

    /* -- 1. Push: the room repaints inside a fraction of a poll interval. --- */
    const pause = () => teach.click("#btnPause");
    const boardMs = await timeToShow(pause, board, () => /Paused/i.test(document.getElementById("stage")?.textContent || ""));
    const playMs = await timeToShow(
      () => teach.click("#btnPause"), // unpause
      play,
      () => !/paused/i.test(document.getElementById("gameBody")?.textContent || ""),
    );
    console.log(`[e2e-realtime] push: teacher -> projector ${boardMs}ms, teacher -> desk ${playMs}ms`);
    assert.ok(boardMs < POLL_MS.board / 2, `projector took ${boardMs}ms — the push path is not carrying it`);
    assert.ok(playMs < POLL_MS.play / 2, `desk took ${playMs}ms — the push path is not carrying it`);

    /* -- 2. No stream: every surface still works, on its own interval. ------ */
    // Blocked at the browser, so the pages take the real failure path.
    const fallbackCtx = await browser.newContext();
    await fallbackCtx.route("**/api/sessions/*/stream", (route) => route.abort());
    const teach2 = await fallbackCtx.newPage({ viewport: { width: 1280, height: 900 } });
    const board2 = await fallbackCtx.newPage({ viewport: { width: 1366, height: 768 } });
    teach2.on("dialog", (d) => d.accept());
    teach2.on("pageerror", (e) => errors.push(`teach-nostream: ${e.message}`));
    board2.on("pageerror", (e) => errors.push(`board-nostream: ${e.message}`));

    await teach2.goto(`${BASE}/teach`);
    // The reopen form lives inside a <details>; open it before filling.
    await teach2.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await teach2.fill("#reopenCode", code);
    const keyText = await teach.textContent("#teacherKeyValue");
    await teach2.fill("#reopenKey", keyText.trim());
    await teach2.click("#btnReopen");
    await teach2.waitForSelector("#room:not([hidden])", { timeout: 15000 });
    await board2.goto(`${BASE}/board?code=${code}`);
    await board2.waitForSelector("#stage");
    // The console says which transport is carrying it, so a teacher debugging a
    // laggy room is not guessing.
    for (const page of [teach2, board2]) {
      await page.waitForFunction(() => document.documentElement.dataset.push === "off", null, { timeout: 12000 });
    }
    // ...and the teacher console says which transport it is on, so "the room
    // feels laggy" is answerable instead of a guess.
    await teach2.waitForFunction(
      () => (document.getElementById("status")?.textContent || "").includes("polling"),
      null,
      { timeout: 12000 },
    );

    const fallbackMs = await timeToShow(
      () => teach2.click("#btnPause"),
      board2,
      () => /Paused/i.test(document.getElementById("stage")?.textContent || ""),
    );
    console.log(`[e2e-realtime] no stream: teacher -> projector ${fallbackMs}ms (poll interval ${POLL_MS.board}ms)`);
    assert.ok(fallbackMs < 4000, `with no stream the projector never caught up (${fallbackMs}ms) — the fallback is broken`);
    assert.ok(fallbackMs > 60, `${fallbackMs}ms is faster than a poll — the stream block did not take effect, so this limb proved nothing`);

    assert.deepEqual(errors, [], `page errors:\n${errors.join("\n")}`);
    console.log("[e2e-realtime] PASS — push carries the room, and blocking it costs latency and nothing else");
  } finally {
    if (browser) await browser.close();
    server.kill("SIGKILL");
    try { fs.rmSync(SNAPSHOT_FILE, { force: true }); } catch { /* best effort */ }
  }
}

main().catch((e) => { console.error("[e2e-realtime] FAIL:", e.message); process.exit(1); });
