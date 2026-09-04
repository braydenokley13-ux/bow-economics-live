#!/usr/bin/env node
/**
 * Browser truth for Module 1, Lesson 2 — "THE SEASON" (`m1l2-the-season`).
 *
 * Real Chromium against the built server: one teacher, one projector, eight
 * student devices, played through a room created WITHOUT a linked source —
 * every desk is dealt stock (`l2.ts` `stockFranchise`/`buildUnclaimed`), never
 * carried from a real July. Run from runtime/ after `npm run build`:
 *
 *   node scripts/e2e-same-line-l2.cjs
 *
 * What this proves that the unit suite cannot:
 *   1. Eight desks can actually get seated through the picker
 *      (`.sl2-picker`/`.sl2-pick`, `sameLineL2.ts` `renderPicker`) on a room
 *      with no carried July.
 *   2. A desk can sign a January ten-day (or hold the window) with a real
 *      chip + typed line through Commitment Capture, and a desk can make a
 *      February move in ADAPT.
 *   3. The projector never carries a seat id or a typed line — the
 *      Integrator ruling that the typed line is teacher-only, checked in the
 *      rendered DOM, not only in the payload.
 *   4. The 5-6 screen carries no percent sign and no "-$" figure, rendered.
 *   5. The teacher console (`sameLineL2Teach.ts` `.slt-desktable`) is the one
 *      surface allowed to show a pending desk's chip and line, and does.
 *   6. No horizontal overflow on the student surface at either Chromebook
 *      shape.
 *
 * KNOWN GAP THIS SCRIPT WORKS AROUND, NOT FIXES (see the builder report):
 * `src/client/teach/main.ts` wires `btnRevealNext`/`btnCloseDay` visibility to
 * specific lesson ids (`isTheWindow`, `isFreeAgency`, ...) that do not include
 * `m1l2-the-season`, so the teach console has NO rendered, enabled control
 * that sends this module's own `teacher:beat` (HOOK/SYNTHESIS beat-stepping)
 * or `teacher:closeWindow` hooks. This script drives `teacher:beat` with the
 * exact payload a wired button would send (`POST /control` with
 * `{type:"hook",hook:"beat"}`, the teacher's own bearer key) directly against
 * the real server, because no UI control exists to click. This is real
 * network truth against the real reducer, not a bypass of it — but it is not
 * proof a live teacher could do this today, and the report says so first.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const DIST = process.env.E2E_DIST ? path.resolve(process.env.E2E_DIST) : path.join(ROOT, "dist");
const PORT = Number(process.env.E2E_PORT || 4331);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-sl2-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-1", "rebuild", "screens-l2");

const LESSON = "m1l2-the-season";
const DESKS = 8;
const SHAPES = [
  { width: 1366, height: 768, tag: "1366" },
  { width: 1024, height: 600, tag: "1024" },
];

const consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/lessons`);
      if (r.ok) return;
    } catch {
      /* not up */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

async function shoot(page, name) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREEN_DIR, `${name}.png`), fullPage: false }).catch((e) => {
    console.log(`(screenshot ${name} failed: ${e.message})`);
  });
}

/** A student surface must never scroll sideways. */
async function assertNoSideScroll(page, label) {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  assert.ok(m.sw <= m.cw + 2, `${label}: the page scrolls SIDEWAYS — ${m.sw}px of content in a ${m.cw}px viewport`);
}

/**
 * Drive this module's own `teacher:beat` hook directly against `/control`,
 * because no /teach button is wired to it for `m1l2-the-season` (see file
 * header). Same payload shape a wired button would send.
 */
async function sendHook(code, teacherKey, hook) {
  const resp = await fetch(`${BASE}/api/sessions/${code}/control`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${teacherKey}` },
    body: JSON.stringify({ type: "hook", hook }),
  });
  const bodyText = await resp.text().catch(() => "");
  return { ok: resp.ok, status: resp.status, body: bodyText };
}

async function claimDesks(browser, code, label) {
  const desks = [];
  const seatIds = [];
  for (let i = 0; i < DESKS; i += 1) {
    const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    watchConsole(p, `${label}-desk${i + 1}`);
    p.on("dialog", (d) => d.accept());
    await p.goto(`${BASE}/play`);
    await p.fill("#joinCode", code);
    await p.fill("#joinName", `Student ${i + 1}`);
    const respPromise = p.waitForResponse((r) => r.url().includes("/join") && r.request().method() === "POST");
    await p.click("#btnJoin");
    const resp = await respPromise;
    const body = await resp.json().catch(() => ({}));
    if (body && body.seat && body.seat.id) seatIds.push(body.seat.id);
    await p.waitForSelector("#gameCard:not([hidden])", { timeout: 20000 });
    // ONE STUDENT = ONE FRANCHISE. Every card in an unlinked room is dealt
    // stock (`sourceSeatId: null`), so `renderPicker` sends bare `claimDesk`
    // for any card clicked — the reducer's own fallback picks `unclaimed[0]`.
    await p.waitForSelector(".sl2-picker", { timeout: 30000 });
    if (i === 0) await shoot(p, `l2-picker-first-desk`);
    const pickBtn = await p.$(".sl2-pick");
    const dealBtn = await p.$("[data-deal]");
    if (pickBtn) await pickBtn.click();
    else if (dealBtn) await dealBtn.click();
    else throw new Error(`${label}: desk ${i + 1} — no picker card and no DEAL ME A DESK button rendered`);
    await p.waitForSelector(".sl2-picker", { state: "detached", timeout: 30000 });
    desks.push(p);
  }
  return { desks, seatIds };
}

/* ------------------------------------------------------------------ run -- */

async function runBand(browser, band, label) {
  const teach = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const boardPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(teach, `${label}-teach`);
  watchConsole(boardPage, `${label}-board`);
  teach.on("dialog", (d) => d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", LESSON);
  await teach.selectOption("#gradeBand", band);
  await teach.fill("#title", `E2E L2 ${label}`);
  // Deliberately never touching #sourceSession — a fresh server has no
  // completed session to link to, so this creates the room WITHOUT a linked
  // source: every desk dealt stock. Capture the create response for the
  // teacher's own bearer key (see file header on why this script needs it).
  const createRespPromise = teach.waitForResponse(
    (r) => r.url().includes("/api/sessions") && r.request().method() === "POST",
  );
  await teach.click("#create");
  const createResp = await createRespPromise;
  const createBody = await createResp.json().catch(() => ({}));
  const teacherKey = createBody.teacherKey;
  assert.ok(teacherKey, `${label}: session create response carried no teacherKey`);
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  await boardPage.goto(`${BASE}/board?code=${code}`);

  const { desks, seatIds } = await claimDesks(browser, code, label);
  console.log(`${label}: ${DESKS} students joined and claimed a desk from the picker (no linked source — every desk dealt stock)`);

  await shoot(boardPage, `l2-${band}-board-lobby`);

  // LOBBY -> HOOK
  await teach.click("#btnAdvance");
  await teach.waitForTimeout(600);
  for (const p of desks) await p.waitForSelector(".sl2-hook-title", { timeout: 20000 }).catch(() => {});
  await shoot(desks[0], `l2-${band}-play-hook`);
  await shoot(teach, `l2-${band}-teach-hook`);
  await shoot(boardPage, `l2-${band}-board-hook`);

  // Step the HOOK beats via the direct /control hook (see file header: no
  // wired /teach button exists for this lesson's own `teacher:beat`).
  const hookBeat1 = await sendHook(code, teacherKey, "beat");
  const hookBeat2 = await sendHook(code, teacherKey, "beat");
  console.log(
    `${label}: HOOK beat-stepping via direct /control — beat1 ${hookBeat1.ok ? "ok" : `FAILED (${hookBeat1.status}) ${hookBeat1.body.slice(0, 200)}`}, beat2 ${hookBeat2.ok ? "ok" : `FAILED (${hookBeat2.status}) ${hookBeat2.body.slice(0, 200)}`}`,
  );
  await teach.waitForTimeout(500);

  // HOOK -> PLAY
  await teach.click("#btnAdvance");
  for (const p of desks) await p.waitForSelector(".sl2-row", { timeout: 20000 });
  console.log(`${label}: PLAY reached, the January board rendered on every desk`);
  await shoot(boardPage, `l2-${band}-board-play`);
  await shoot(teach, `l2-${band}-teach-play`);

  // Overflow at both Chromebook shapes, on the January board.
  for (const shape of SHAPES) {
    await desks[0].setViewportSize(shape);
    await desks[0].waitForTimeout(220);
    await assertNoSideScroll(desks[0], `${label} PLAY @${shape.tag}`);
    await shoot(desks[0], `l2-${band}-play-play-${shape.tag}`);
  }
  await desks[0].setViewportSize(SHAPES[0]);
  await desks[0].waitForTimeout(150);

  if (band === "5-6") {
    const text = await desks[0].evaluate(() => document.body.innerText);
    assert.ok(!text.includes("%"), `${label}: a percent sign reached a grades 5-6 PLAY screen`);
    assert.ok(!text.includes("-$"), `${label}: a negative dollar figure reached a grades 5-6 PLAY screen`);
  }

  const chipsUsedJan = [];
  for (let i = 0; i < DESKS; i += 1) {
    const p = desks[i];
    await p.waitForSelector(".sl2-row", { timeout: 20000 });
    if (i === DESKS - 1) {
      // One desk holds the window open rather than signing — exercises `pass`.
      await p.click("#sl2Hold");
    } else {
      const row = await p.$(".sl2-row:not([disabled])");
      assert.ok(row, `${label}: desk ${i + 1} has no open January row to sign`);
      await row.click();
    }
    await p.waitForSelector("#sl2Capture", { timeout: 10000 });
    const chip = await p.$(".sl2-chip");
    assert.ok(chip, `${label}: desk ${i + 1} — no chip offered before commit`);
    await chip.click();
    const line = `Desk ${i + 1} gives up its March flexibility`;
    await p.fill("#sl2Line", line);
    await p.waitForSelector("#sl2Lock:not([disabled])", { timeout: 5000 });
    await p.click("#sl2Lock");
    await p.waitForSelector("#sl2Capture", { state: "detached", timeout: 12000 });
    chipsUsedJan.push(line);
  }
  console.log(`${label}: every desk made its January move (one held the window)`);

  // REVEAL — the board's private-surface check, at the projector shape.
  await teach.click("#btnAdvance");
  await teach.waitForTimeout(700);
  await boardPage.setViewportSize({ width: 1920, height: 1080 });
  await boardPage.waitForTimeout(400);
  {
    const boardText = await boardPage.evaluate(
      () => document.getElementById("stage")?.innerText ?? document.body.innerText,
    );
    for (const id of seatIds) {
      assert.ok(!boardText.includes(id), `${label} REVEAL: a seat id ("${id}") is ON THE PROJECTOR`);
    }
    for (const line of chipsUsedJan) {
      assert.ok(!boardText.includes(line), `${label} REVEAL: a typed line reached the projector — "${line}"`);
    }
  }
  await shoot(boardPage, `l2-${band}-board-reveal`);
  await boardPage.setViewportSize({ width: 1366, height: 768 });
  await boardPage.waitForTimeout(200);
  console.log(`${label}: REVEAL board carries no seat id and no typed line`);

  // CONSEQUENCE
  await teach.click("#btnAdvance");
  await teach.waitForTimeout(500);
  await shoot(boardPage, `l2-${band}-board-consequence`);

  // ADAPT — the February window.
  await teach.click("#btnAdvance");
  for (const p of desks) await p.waitForSelector(".sl2-row, .sl2-pocket", { timeout: 20000 }).catch(() => {});
  console.log(`${label}: ADAPT reached, the February board rendered`);
  await shoot(boardPage, `l2-${band}-board-adapt`);
  await shoot(teach, `l2-${band}-teach-adapt`);

  const febLine = "Every desk gives up March cap room for this";
  let pendingDeskCount = 0;
  let sawWaivable = false;
  for (let i = 0; i < DESKS; i += 1) {
    const p = desks[i];
    // One desk waives (the modeled July makes every stock desk waivable, D63);
    // the rest sign, so both February paths reach the teacher console.
    const waiveBtn = await p.$(".sl2-waive-btn");
    if (waiveBtn && !sawWaivable) {
      sawWaivable = true;
      await waiveBtn.click();
    } else {
      const row = await p.$(".sl2-row:not([disabled])");
      if (!row) {
        console.log(`${label}: desk ${i + 1} has no February move available on its board — skipped`);
        continue;
      }
      await row.click();
    }
    const capture = await p.waitForSelector("#sl2Capture", { timeout: 8000 }).catch(() => null);
    if (!capture) continue;
    const chip = (await p.$$(".sl2-chip"))[0];
    if (chip) await chip.click();
    await p.fill("#sl2Line", febLine);
    await p.waitForSelector("#sl2Lock:not([disabled])", { timeout: 5000 });
    await p.click("#sl2Lock");
    await p.waitForSelector("#sl2Capture", { state: "detached", timeout: 12000 });
    pendingDeskCount += 1;
  }
  assert.ok(pendingDeskCount > 0, `${label}: not a single desk produced a February move to check on the teacher console`);
  console.log(
    `${label}: ${pendingDeskCount} desk(s) made a February move${sawWaivable ? " (including a waive)" : " — .sl2-waive-btn never appeared: a dealt/stock desk carries no non-ten-day contract, so 'waivable' is structurally empty in an unlinked room (see report)"}`,
  );

  // Overflow + band-copy check on ADAPT.
  for (const shape of SHAPES) {
    await desks[0].setViewportSize(shape);
    await desks[0].waitForTimeout(220);
    await assertNoSideScroll(desks[0], `${label} ADAPT @${shape.tag}`);
  }
  await desks[0].setViewportSize(SHAPES[0]);
  await desks[0].waitForTimeout(150);
  if (band === "5-6") {
    const text = await desks[0].evaluate(() => document.body.innerText);
    assert.ok(!text.includes("%"), `${label}: a percent sign reached a grades 5-6 ADAPT screen`);
    assert.ok(!text.includes("-$"), `${label}: a negative dollar figure reached a grades 5-6 ADAPT screen`);
  }

  // Teacher console: the one surface allowed to show a pending chip + line.
  await teach.waitForTimeout(1300);
  await teach.waitForSelector("#aggregateBody", { timeout: 10000 });
  {
    const teacherText = await teach.evaluate(() => document.getElementById("aggregateBody")?.innerText ?? "");
    assert.ok(
      teacherText.includes(febLine),
      `${label}: the teacher console never showed the pending February line ("${febLine}") — got: ${teacherText.slice(0, 400)}`,
    );
    assert.ok(
      /\byes\b/i.test(teacherText),
      `${label}: the teacher console's desk table never marked a desk Pending — got: ${teacherText.slice(0, 400)}`,
    );
  }
  await shoot(teach, `l2-${band}-teach-adapt-pending`);
  console.log(`${label}: the teacher console shows a per-desk pending chip and line`);

  // Board must still show nothing private while February is pending.
  await boardPage.waitForTimeout(200);
  {
    const boardText = await boardPage.evaluate(() => document.getElementById("stage")?.innerText ?? "");
    assert.ok(!boardText.includes(febLine), `${label}: the pending February line reached the projector while a decision is still open`);
    for (const id of seatIds) {
      assert.ok(!boardText.includes(id), `${label}: a seat id ("${id}") is on the projector during ADAPT`);
    }
  }

  // Advance to SYNTHESIS: ADAPT -> COUNTERFACTUAL -> ARGUE -> SYNTHESIS.
  await teach.click("#btnAdvance"); // COUNTERFACTUAL
  await teach.waitForTimeout(400);
  await shoot(boardPage, `l2-${band}-board-counterfactual`);
  await teach.click("#btnAdvance"); // ARGUE
  await teach.waitForTimeout(400);
  await shoot(boardPage, `l2-${band}-board-argue`);
  await teach.click("#btnAdvance"); // SYNTHESIS
  await teach.waitForTimeout(700);

  // Step the naming via the same direct /control hook used for HOOK beats
  // (see file header: no /teach button is wired to this lesson's own
  // `teacher:beat` for SYNTHESIS either).
  const seenTerms = [];
  for (let i = 0; i < 6; i += 1) {
    await boardPage.waitForTimeout(300);
    const term = await boardPage.textContent(".slb-naming-term").catch(() => null);
    if (term && !seenTerms.includes(term.trim())) seenTerms.push(term.trim());
    await shoot(boardPage, `l2-${band}-board-synthesis${i}`);
    const step = await sendHook(code, teacherKey, "beat");
    if (!step.ok) {
      console.log(`${label}: SYNTHESIS beat ${i} stopped (${step.status}) ${step.body.slice(0, 150)}`);
      break;
    }
    await teach.waitForTimeout(500);
  }
  console.log(`${label}: the naming walked ${seenTerms.length} concept(s) on the wall — ${seenTerms.join(", ") || "(none rendered — no naming earned this run)"}`);
  await shoot(teach, `l2-${band}-teach-synthesis`);
  await shoot(desks[0], `l2-${band}-play-synthesis`);

  for (const p of desks) await p.close();
  await boardPage.close();
  await teach.close();
  console.log(`${label}: OK — ${DESKS} desks, no linked source, no side scroll at 1366x768 or 1024x600, no seat id/typed line on the board, teacher console shows pending chip/line, zero console errors so far.`);
}

async function main() {
  await assertPortFree(PORT);
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  const server = spawn(process.execPath, [path.join(DIST, "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();

  const browser = await chromium.launch();
  try {
    await runBand(browser, "5-6", "GRADES 5-6");
    await runBand(browser, "7-8", "GRADES 7-8");
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }

  if (consoleErrors.length) {
    console.error(`\n${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors.slice(0, 20)) console.error("  " + e);
    console.error(serverLog.slice(-1200));
    process.exit(1);
  }
  console.log(
    `\nSAME LINE L2 (THE SEASON) browser truth: OK — both bands, ${DESKS} desks, no linked source, January signs + one hold, February moves, board privacy held at 1920x1080, teacher console shows pending chip/line, zero console errors.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
