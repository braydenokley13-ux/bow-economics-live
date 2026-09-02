#!/usr/bin/env node
/**
 * M1 (Draft Day, m1l1-draft-day) pixel-baseline capture.
 *
 * Boots the REAL compiled server, creates a real session via /teach, joins
 * two real student seats via /play, opens /board, and captures a
 * deterministic sequence of screenshots across LOBBY / HOOK / first-PLAY.
 *
 * Usage: node shots-m1.cjs --port 4407 --out /path/to/outdir
 *
 * Never modifies repository files. Reusable/rerunnable: each run boots its
 * own server on the given port with its own snapshot file (derived from
 * --out) and writes only into --out.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = "/home/user/bow-economics-live/runtime";

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const PORT = arg("port", "4407");
const OUT = path.resolve(arg("out", "./m1-baseline"));
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(OUT, "snap.json");

fs.mkdirSync(OUT, { recursive: true });
// Reusable across runs: never inherit a snapshot from a previous run of this script.
try { fs.unlinkSync(SNAPSHOT_FILE); } catch { /* fine if absent */ }

const manifest = [];

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
  throw new Error("server never came up on " + BASE);
}

/** Best-effort clock/timestamp scrub: hides any leaf element whose own text
 *  matches a wall-clock-ish pattern (HH:MM[:SS] optionally with AM/PM, or a
 *  literal "Date"/weekday token). Logs anything it actually hid so the report
 *  can name it. This repo's three surfaces were not found to render any wall
 *  clock or timestamp text (grepped for Date.now/toLocaleTimeString/
 *  toLocaleString across src/client — none produce visible time-of-day text),
 *  so in practice this is expected to be a no-op every call; kept as a
 *  defensive pass rather than skipped, since a screenshot script should not
 *  assume a UI never changes for that.
 */
async function scrubClocks(page, label) {
  const hidden = await page.evaluate(() => {
    const TIME_RE = /\b\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM|am|pm)?\b/;
    const hits = [];
    const all = document.querySelectorAll("body *");
    for (const el of all) {
      if (el.children.length > 0) continue; // leaf nodes only
      const t = (el.textContent || "").trim();
      if (t && TIME_RE.test(t)) {
        el.setAttribute("data-qa-clock-hidden", "true");
        el.style.visibility = "hidden";
        hits.push(t);
      }
    }
    return hits;
  });
  if (hidden.length > 0) {
    console.log(`[shots-m1] scrubbed ${hidden.length} clock-like string(s) on ${label}:`, hidden);
  }
  return hidden;
}

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

async function shot(page, out, name, viewport, label) {
  const hidden = await scrubClocks(page, label);
  const file = path.join(out, name);
  await page.screenshot({ path: file, animations: "disabled" });
  manifest.push({
    file: name,
    surface: label,
    viewport: `${viewport.width}x${viewport.height}`,
    scrubbedClockStrings: hidden,
  });
  console.log("[shots-m1] wrote", name);
}

async function main() {
  console.log("[shots-m1] starting server on port", PORT, "snapshot", SNAPSHOT_FILE);
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  let browser;
  try {
    await waitForServer();
    console.log("[shots-m1] server up on", BASE);

    browser = await chromium.launch();
    const vpStudent = { width: 1366, height: 768 };
    const vpTeach = { width: 1366, height: 768 };
    const vpBoard = { width: 1920, height: 1080 };

    for (const [label, page] of []) void 0; // no-op, keeps lint-style symmetry with e2e-l2.cjs's pattern

    const play1Page = await browser.newPage({ viewport: vpStudent });
    const teachPage = await browser.newPage({ viewport: vpTeach });
    const boardPage = await browser.newPage({ viewport: vpBoard });
    const play2Page = await browser.newPage({ viewport: vpStudent });

    const consoleErrors = [];
    for (const [label, page] of [["play1", play1Page], ["teach", teachPage], ["board", boardPage], ["play2", play2Page]]) {
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(`[${label}] console.error: ${msg.text()}`);
      });
      page.on("pageerror", (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
      page.on("dialog", (d) => d.accept());
    }

    /* ---------------------------------------------- 01: /play join screen -- */
    // Before any session exists / before joining — the plain join form.
    await play1Page.goto(`${BASE}/play`);
    await settle(play1Page);
    await shot(play1Page, OUT, "m1-01-play-join@1366x768.png", vpStudent, "play");

    /* ------------------------------------------- create m1l1-draft-day session -- */
    await teachPage.goto(`${BASE}/teach`);
    await teachPage.waitForSelector("#lesson option", { state: "attached" });
    await teachPage.selectOption("#lesson", "m1l1-draft-day");
    await teachPage.fill("#title", "M1 baseline capture");
    await teachPage.click("#create");
    await teachPage.waitForSelector("#room:not([hidden])");
    const code = (await teachPage.textContent("#code")).trim();
    console.log("[shots-m1] session created, code", code);

    /* -------------------------------------------------------- /board opens -- */
    await boardPage.goto(`${BASE}/board?code=${code}`);
    await boardPage.waitForSelector("#stage .label");

    /* ----------------------------------------- join two fictional students -- */
    async function join(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
    }
    await join(play1Page, "Riverdale Duo"); // fictional pair name, per D14/shared-screen privacy default
    await join(play2Page, "Maple Court");

    /* ------------------------------------------------------------ LOBBY set -- */
    await settle(play1Page);
    await shot(play1Page, OUT, "m1-02-play-lobby@1366x768.png", vpStudent, "play");

    await settle(teachPage);
    await shot(teachPage, OUT, "m1-03-teach-lobby@1366x768.png", vpTeach, "teach");

    await settle(boardPage);
    await shot(boardPage, OUT, "m1-04-board-lobby@1920x1080.png", vpBoard, "board");

    /* --------------------------------------------------- advance to HOOK -- */
    await teachPage.click("#btnAdvance"); // LOBBY -> HOOK
    await teachPage.waitForSelector(".phasechip.current:text('HOOK')");
    for (const page of [play1Page, teachPage, boardPage]) await settle(page);

    await shot(play1Page, OUT, "m1-05-play-hook@1366x768.png", vpStudent, "play");
    await shot(teachPage, OUT, "m1-06-teach-hook@1366x768.png", vpTeach, "teach");
    await shot(boardPage, OUT, "m1-07-board-hook@1920x1080.png", vpBoard, "board");

    /* ----------------------------------------------- advance to first PLAY -- */
    await teachPage.click("#btnAdvance"); // HOOK -> PLAY
    await teachPage.waitForSelector(".phasechip.current:text('PLAY')");
    for (const page of [play1Page, teachPage, boardPage]) await settle(page);

    await shot(play1Page, OUT, "m1-08-play-play@1366x768.png", vpStudent, "play");
    await shot(teachPage, OUT, "m1-09-teach-play@1366x768.png", vpTeach, "teach");
    await shot(boardPage, OUT, "m1-10-board-play@1920x1080.png", vpBoard, "board");

    fs.writeFileSync(
      path.join(OUT, "manifest.json"),
      JSON.stringify(
        {
          port: PORT,
          out: OUT,
          sessionCode: code,
          capturedAt: new Date().toISOString(),
          shots: manifest,
          consoleErrors,
        },
        null,
        2,
      ),
    );
    console.log("[shots-m1] manifest written:", path.join(OUT, "manifest.json"));
    if (consoleErrors.length > 0) {
      console.error("[shots-m1] CONSOLE ERRORS:\n" + consoleErrors.join("\n"));
    } else {
      console.log("[shots-m1] zero console errors across all pages");
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main().catch((err) => {
  console.error("[shots-m1] FAILED:", err);
  process.exitCode = 1;
});
