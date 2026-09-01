#!/usr/bin/env node
/**
 * drive-m2l1.cjs — reusable Boss capture driver for M2 L1 "Full House"
 * (m2l1-full-house), across /play, /teach, /board.
 *
 * Boots its own server (its own RUNTIME_SNAPSHOT_FILE, its own PORT), creates
 * a Full House session, joins N desks with fictional pair names and
 * deliberately different pricing lines, drives the full five-night arc, the
 * Two Peaks release, all seven REVEAL stages, ADAPT, all COUNTERFACTUAL
 * pages, all SYNTHESIS cards, COMPLETE — and at every named checkpoint
 * ("state") captures a canonical, stably-named screenshot set.
 *
 * Never modifies repository source. Only ever writes inside --out (may be a
 * repo docs/ directory — that is the intended screenshot destination) and
 * inside this tool's own .snapshots/ scratch directory (never inside the
 * repo). Kills its own server on exit, success or failure.
 *
 * CLI:
 *   node drive-m2l1.cjs --port 4402 --out <dir> --desks 4 --late 1 --stall 1
 *        [--prefix baseline] [--surfaces play,teach,board]
 *        [--states night-1-open,books-closed,...] [--repo-root <path>]
 *
 * --desks   N          number of student desks (pairs). 1-4 uses the four
 *                       hand-authored "detailed" lines (dial/spend/bowl
 *                       actions every night, matching runtime/scripts/
 *                       e2e-m2l1.cjs). >4 adds "flat" desks that only lock
 *                       explicitly at Night 1 and Night 5 and otherwise let
 *                       the teacher's bell auto-commit Nights 2-4 (the same
 *                       class-scale simplification e2e-m2l1.cjs uses for its
 *                       12-desk run) — deterministic, bounded wall clock.
 * --late    0|1        adds one desk that joins LATE, at Night 3.
 * --stall   0|1        adds one desk that never locks Night 5 (proves the
 *                       teacher's bell auto-commits a stalled desk).
 * --prefix  <string>   filename prefix (default "run").
 * --surfaces            comma list of play,teach,board (default all three) —
 *                       used to skip a surface entirely (e.g. class-scale
 *                       runs that only want /teach and /board).
 * --states              comma list of state keys to actually save screenshots
 *                       for (default: every state the arc visits). The arc is
 *                       always driven in full regardless of this filter —
 *                       this only trims what gets written to disk.
 * --repo-root           override the repo root (default: two levels above
 *                       runtime/scripts, i.e. this file assumes the standard
 *                       layout unless overridden).
 *
 * Outputs into --out:
 *   <prefix>-<NN>-<surface>-<state>@<WxH>.png   (NN shared across all
 *                                                surfaces captured for one
 *                                                state, in arc order)
 *   manifest.json   { filename: { surface, state, viewport, note } }
 *   console.json    [ { page, state, type, text } ]  (errors + warnings)
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

/* ------------------------------------------------------------------- args - */

function parseArgs(argv) {
  const args = {
    port: "4300",
    out: null,
    desks: "4",
    late: "0",
    stall: "0",
    prefix: "run",
    surfaces: "play,teach,board",
    states: "",
    "repo-root": "/home/user/bow-economics-live",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = "1";
      }
    }
  }
  return args;
}

const argv = parseArgs(process.argv.slice(2));
if (!argv.out) {
  console.error("[drive-m2l1] --out <dir> is required");
  process.exit(1);
}
const PORT = Number(argv.port);
const OUT = path.resolve(argv.out);
const DESKS = Math.max(1, Number(argv.desks) || 4);
const LATE = Number(argv.late) === 1;
const STALL = Number(argv.stall) === 1;
const PREFIX = argv.prefix || "run";
const SURFACES = new Set(String(argv.surfaces).split(",").map((s) => s.trim()).filter(Boolean));
const STATE_FILTER = argv.states ? new Set(String(argv.states).split(",").map((s) => s.trim()).filter(Boolean)) : null;
const REPO_ROOT = path.resolve(argv["repo-root"]);
const BASE = `http://localhost:${PORT}`;

const TOOL_DIR = __dirname;
const SNAPSHOT_DIR = path.join(TOOL_DIR, ".snapshots"); // never inside the repo
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, `${PREFIX}-${PORT}-${Date.now()}.json`);

fs.mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- helpers - */

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
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

async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial", { timeout: 30000 });
  await page.$eval(
    "#fhPriceDial",
    (el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    price,
  );
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price, { timeout: 15000 });
}

async function bumpSpend(page, clicks) {
  for (let i = 0; i < clicks; i += 1) await page.click("#fhSpendUp");
}

async function lockNight(page) {
  await page.click("#fhLock");
  await page.waitForSelector(".fh-locked-recap", { timeout: 30000 });
}

async function waitForNight(page, label) {
  await page.waitForFunction(
    (l) => document.querySelector(".fh-card-night")?.textContent?.includes(l),
    label,
    { timeout: 30000 },
  );
}

async function waitForPhase(teachPage, phaseName) {
  await teachPage.waitForSelector(`.phasechip.current:text('${phaseName}')`, { timeout: 30000 });
}

async function waitForBoardHud(board, phaseName) {
  await board.waitForFunction(
    (p) => document.getElementById("hud")?.textContent?.includes(p),
    phaseName,
    { timeout: 30000 },
  );
}

function pricesForDesks(n) {
  const twelve = [10, 14, 18, 22, 26, 30, 36, 42, 50, 58, 70, 84];
  if (n <= 12) return twelve.slice(0, n);
  const out = twelve.slice();
  for (let i = 12; i < n; i += 1) out.push(10 + ((i * 7) % 90));
  return out;
}

/* -------------------------------------------------------- desk configuration - */

/**
 * <=4 desks: the four hand-authored lines from runtime/scripts/e2e-m2l1.cjs —
 * a real spread of behavior (reads the card every night / holds the plan
 * price / flat price + never locks Night 5 / joins late with real books).
 * >4 desks: desks 0-3 keep those same detailed lines; desks 4+ are "flat"
 * desks that lock explicitly only at Night 1 and Night 5 (same value both
 * times — the repeat-card case) and let the teacher's bell auto-commit
 * Nights 2-4, exactly as runtime/scripts/e2e-m2l1.cjs's own 12-desk
 * classScaleCounterfactual() does, so a 12-desk run finishes in bounded time.
 */
function buildDeskConfigs() {
  const detailedNames = ["Rae & Ben", "Nour & Ivy", "Ari & Tal", "Sam & Jo"];
  const detailedNights = [
    [34, 48, 40, 90, 34], // Desk 1 — reads the card every night, opens the upper bowl on the shock night
    [16, 16, 16, 16, 16], // Desk 2 — holds the season-plan price all five nights
    [70, 70, 70, 70, STALL ? null : 70], // Desk 3 — flat $70; never locks Night 5 if --stall
    [null, null, 30, 84, 24], // Desk 4 — joins LATE at Night 3
  ];
  const flatPrices = pricesForDesks(Math.max(DESKS, 12));
  const cfgs = [];
  const lateFlatIdx = LATE && DESKS > 4 ? Math.min(4, DESKS - 1) : -1;
  const stallFlatIdx = STALL && DESKS > 4 ? Math.min(5, DESKS - 1) : -1;
  for (let i = 0; i < DESKS; i += 1) {
    if (i < 4 && i < Math.min(DESKS, 4)) {
      const nightPrices = detailedNights[i].slice();
      const lateAtNightIndex = i === 3 && LATE && DESKS >= 4 ? 2 : null;
      if (lateAtNightIndex !== null) {
        // real books before joining: nights 0,1 stay null (unplayed)
      }
      cfgs.push({
        idx: i,
        name: detailedNames[i],
        nightPrices,
        lateAtNightIndex,
        joined: lateAtNightIndex === null,
        spendNight: i === 0 ? 2 : null, // Desk 1 bumps event spend during Night 3 — pays off Night 4
        bowlNight: i === 0 ? 3 : null, // Desk 1 opens the upper bowl on the shock night (Night 4)
        detailed: true,
      });
    } else {
      const p = flatPrices[i];
      const nightPrices = [p, null, null, null, i === stallFlatIdx ? null : p];
      cfgs.push({
        idx: i,
        name: `Pair ${i + 1}`,
        nightPrices,
        lateAtNightIndex: i === lateFlatIdx ? 2 : null,
        joined: i !== lateFlatIdx,
        spendNight: null,
        bowlNight: null,
        detailed: false,
      });
    }
  }
  return cfgs;
}

/* --------------------------------------------------------------- run state - */

const manifest = {};
const consoleLog = [];
let currentState = "boot";
let seq = 0;

function watchConsole(page, label) {
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") {
      consoleLog.push({ page: label, state: currentState, type: t, text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleLog.push({ page: label, state: currentState, type: "pageerror", text: err.message });
  });
}

async function main() {
  console.log(`[drive-m2l1] booting server on ${BASE} (snapshot ${SNAPSHOT_FILE})`);
  const server = spawn(
    process.execPath,
    [path.join(REPO_ROOT, "runtime", "dist", "server", "index.js")],
    {
      cwd: path.join(REPO_ROOT, "runtime"),
      env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  let browser;
  let exitCode = 0;
  try {
    await waitForServer();
    console.log("[drive-m2l1] server up");

    browser = await chromium.launch();
    const teach = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const board = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    watchConsole(teach, "teach");
    watchConsole(board, "board");

    const cfgs = buildDeskConfigs();
    for (const cfg of cfgs) {
      const page = await browser.newPage({ viewport: { width: cfg.idx === 0 ? 1366 : 1024, height: cfg.idx === 0 ? 768 : 600 } });
      watchConsole(page, `desk${cfg.idx + 1}`);
      page.on("dialog", (dlg) => dlg.accept()); // #fhLock is behind a confirm() guard
      cfg.page = page;
    }

    async function shot(page, surface, stateKey, w, h, nn, note) {
      const fname = `${PREFIX}-${nn}-${surface}-${stateKey}@${w}x${h}.png`;
      const fpath = path.join(OUT, fname);
      await page.screenshot({ path: fpath, fullPage: false });
      manifest[fname] = { surface, state: stateKey, viewport: `${w}x${h}`, note: note || "" };
      return fname;
    }

    async function capture(stateKey, note) {
      currentState = stateKey;
      if (STATE_FILTER && !STATE_FILTER.has(stateKey)) {
        console.log(`[drive-m2l1] (arc) ${stateKey} — not in --states, skipping capture`);
        return;
      }
      seq += 1;
      const nn = String(seq).padStart(2, "0");
      const desk1 = cfgs[0];
      if (SURFACES.has("play") && desk1 && desk1.joined) {
        await desk1.page.setViewportSize({ width: 1366, height: 768 });
        await desk1.page.waitForTimeout(120);
        await shot(desk1.page, "play", stateKey, 1366, 768, nn, note);
        if (stateKey === "lobby" || stateKey === "night-1-open") {
          await desk1.page.setViewportSize({ width: 1024, height: 600 });
          await desk1.page.waitForTimeout(150);
          await shot(desk1.page, "play", stateKey, 1024, 600, nn, `${note} (1024x600 first-contact/lock-reachability check)`);
          await desk1.page.setViewportSize({ width: 1366, height: 768 });
          await desk1.page.waitForTimeout(120);
        }
      }
      if (SURFACES.has("teach")) {
        await teach.setViewportSize({ width: 1366, height: 768 });
        await teach.waitForTimeout(120);
        await shot(teach, "teach", stateKey, 1366, 768, nn, note);
        await teach.setViewportSize({ width: 1920, height: 1080 });
        await teach.waitForTimeout(120);
        await shot(teach, "teach", stateKey, 1920, 1080, nn, note);
        await teach.setViewportSize({ width: 1366, height: 768 });
        await teach.waitForTimeout(100);
      }
      if (SURFACES.has("board")) {
        await board.setViewportSize({ width: 1920, height: 1080 });
        await board.waitForTimeout(150);
        await shot(board, "board", stateKey, 1920, 1080, nn, note);
        await board.setViewportSize({ width: 1366, height: 768 });
        await board.waitForTimeout(150);
        await shot(board, "board", stateKey, 1366, 768, nn, note);
        await board.setViewportSize({ width: 1920, height: 1080 });
        await board.waitForTimeout(100);
      }
      console.log(`[drive-m2l1] captured state "${stateKey}" (seq ${nn})`);
    }

    async function joinDesk(cfg) {
      await cfg.page.goto(`${BASE}/play`);
      await cfg.page.fill("#joinCode", code);
      await cfg.page.fill("#joinName", cfg.name);
      await cfg.page.click("#btnJoin");
      await cfg.page.waitForSelector("#gameCard:not([hidden])", { timeout: 20000 });
      await cfg.page.waitForSelector(".fh-desk-name", { timeout: 20000 });
      cfg.joined = true;
      console.log(`[drive-m2l1] desk ${cfg.idx + 1} (${cfg.name}) joined`);
    }

    /* ---- open the room ---- */
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", `${PREFIX} Full House capture`);
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])", { timeout: 20000 });
    const code = (await teach.textContent("#code")).trim();
    console.log(`[drive-m2l1] session ${code} created`);

    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage .label", { timeout: 20000 });

    for (const cfg of cfgs) {
      if (cfg.joined) await joinDesk(cfg);
    }

    await capture("lobby", "LOBBY — desks assigned, before HOOK; first contact for the 1024x600 lock-reachability check");

    /* ---- HOOK ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "HOOK");
    await cfgs[0].page.waitForFunction(() => document.body.innerText.includes("run the building"), null, { timeout: 20000 });
    await capture("hook", "HOOK — objective and rules");

    /* ---- PLAY: five nights ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "PLAY");
    for (const cfg of cfgs) {
      if (cfg.joined) await cfg.page.waitForSelector("#fhPlayRoot", { timeout: 20000 });
    }

    for (let i = 0; i < 5; i += 1) {
      const label = `Night ${i + 1}`;
      for (const cfg of cfgs) {
        if (cfg.joined) await waitForNight(cfg.page, label);
      }
      await capture(`night-${i + 1}-open`, `PLAY ${label} open — pre-lock dial UI visible`);

      for (const cfg of cfgs) {
        if (!cfg.joined && cfg.lateAtNightIndex === i) {
          await joinDesk(cfg);
          await cfg.page.waitForSelector("#fhPlayRoot", { timeout: 20000 });
          await waitForNight(cfg.page, label);
        }
      }
      if (cfgs.some((c) => c.lateAtNightIndex === i)) {
        await capture(`night-${i + 1}-late-joiner`, `PLAY ${label} — late desk arrives with real, labelled books`);
      }

      for (const cfg of cfgs) {
        if (!cfg.joined) continue;
        const price = cfg.nightPrices[i];
        if (price === null || price === undefined) continue; // let the teacher's bell auto-commit this desk this night
        await setPrice(cfg.page, price);
        if (cfg.spendNight === i) await bumpSpend(cfg.page, 8);
        if (cfg.bowlNight === i) {
          await cfg.page.click("#fhBowl");
          await cfg.page.waitForFunction(() => document.getElementById("fhBowl")?.getAttribute("aria-pressed") === "true", null, { timeout: 10000 });
        }
        await lockNight(cfg.page);
      }

      await teach.click("#btnCloseNight");
      if (i < 4) {
        const nextLabel = `Night ${i + 2}`;
        for (const cfg of cfgs) {
          if (cfg.joined && cfg.lateAtNightIndex !== i + 1) {
            try {
              await waitForNight(cfg.page, nextLabel);
            } catch {
              /* a desk polling slowly — tolerated, later waits will catch up */
            }
          }
        }
      } else {
        await cfgs[0].page.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 30000 });
      }
      await capture(`night-${i + 1}-settled`, `PLAY ${label} settled — box score / history`);

      if (i === 2) {
        // Two Peaks is gated on nightIndex>=3 — a teacher decision, not a timer.
        await teach.click("#btnTwoPeaks");
        await board.waitForFunction(() => document.body.innerText.includes("THE TWO PEAKS"), null, { timeout: 20000 });
        await capture("two-peaks-released", "Two Peaks money view released by the teacher after Night 3");
      }
    }
    await capture("books-closed", "All five nights in the books — allNightsDone summary, still PLAY phase");

    /* ---- REVEAL (7 stages) ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "REVEAL");
    await waitForBoardHud(board, "REVEAL");
    await capture("reveal-0", "REVEAL stage 0 (opening)");
    for (let s = 1; s <= 7; s += 1) {
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnRevealNext");
      await resp;
      await board.waitForTimeout(700);
      await capture(`reveal-${s}`, `REVEAL stage ${s} of 7`);
    }

    /* ---- ADAPT ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "ADAPT");
    await waitForBoardHud(board, "ADAPT");
    await capture("adapt", "ADAPT — questions plus the room's whole curve");

    /* ---- COUNTERFACTUAL (paged, CF_ROWS_PER_PAGE = 3) ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "COUNTERFACTUAL");
    await waitForBoardHud(board, "COUNTERFACTUAL");
    const CF_ROWS_PER_PAGE = 3;
    const cfPageCount = Math.max(1, Math.ceil(DESKS / CF_ROWS_PER_PAGE));
    await capture("cf-1", `COUNTERFACTUAL page 1 of ${cfPageCount}`);
    for (let p = 2; p <= cfPageCount; p += 1) {
      const before = await board.evaluate(() => document.getElementById("fhCfPager")?.textContent?.trim() ?? "");
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnCfPage");
      await resp;
      await board.waitForFunction((prev) => (document.getElementById("fhCfPager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 20000 });
      await capture(`cf-${p}`, `COUNTERFACTUAL page ${p} of ${cfPageCount}`);
    }

    /* ---- SYNTHESIS (6 cards) ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "SYNTHESIS");
    await waitForBoardHud(board, "SYNTHESIS");
    await capture("synth-1", "SYNTHESIS card 1 of 6");
    for (let c = 2; c <= 6; c += 1) {
      const before = await board.evaluate(() => document.getElementById("fhSynthPager")?.textContent?.trim() ?? "");
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnSynthPage");
      await resp;
      await board.waitForFunction((prev) => (document.getElementById("fhSynthPager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 20000 });
      await capture(`synth-${c}`, `SYNTHESIS card ${c} of 6`);
    }

    /* ---- COMPLETE ---- */
    await teach.click("#btnAdvance");
    await waitForPhase(teach, "COMPLETE");
    await board.waitForFunction(() => document.body.innerText.toUpperCase().includes("FULL HOUSE — COMPLETE"), null, { timeout: 20000 });
    await capture("complete", "COMPLETE — session closed on all three surfaces");

    fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, "console.json"), JSON.stringify(consoleLog, null, 2));
    console.log(`[drive-m2l1] DONE — ${Object.keys(manifest).length} screenshots, ${consoleLog.length} console errors/warnings`);
    console.log(`[drive-m2l1] manifest: ${path.join(OUT, "manifest.json")}`);
    console.log(`[drive-m2l1] console log: ${path.join(OUT, "console.json")}`);
  } catch (err) {
    exitCode = 1;
    console.error("[drive-m2l1] FAILED:", err);
    console.error("[drive-m2l1] server log tail:\n" + serverLog.split("\n").slice(-60).join("\n"));
    try {
      fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
      fs.writeFileSync(path.join(OUT, "console.json"), JSON.stringify(consoleLog, null, 2));
    } catch {
      /* best effort */
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 250));
  }
  process.exitCode = exitCode;
}

main();
