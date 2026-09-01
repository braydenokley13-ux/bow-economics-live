#!/usr/bin/env node
/**
 * End-to-end proof for Module 2, Lesson 2 — "You Don't Play Alone."
 *
 * Everything runs through real Chromium pages against /teach, /play and
 * /board, the way a class would actually play it: one teacher, one projector,
 * TWELVE student devices at the classroom Chromebook shape. Twelve is not a
 * decoration — the Handed-To-You bar is paged, and a guard that only ever sees
 * four desks cannot fail at the size the fit defect appears.
 *
 * Run from runtime/: `node scripts/e2e-m2l2.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * Asserted along the way:
 *   - EVERY board frame FITS at 1366x768 AND 1920x1080, with no scrolling.
 *     A projector cannot scroll, so overflow is a failure, not a nuisance.
 *   - the evidence tier clears the 2.6%-of-screen-height back-row floor;
 *   - the pre-lock student screen carries no outcome of any kind;
 *   - the board shows nothing about a week that is still open;
 *   - the star departure is on the board and on every desk BEFORE week 2 is
 *     priced;
 *   - the decomposition is attributable from the UI alone (BC-5): a desk's own
 *     three blocks are on its own device, and the room's bar names the visiting
 *     club on every bar;
 *   - the week bell auto-commits a desk that never locked;
 *   - every reveal stage renders its own beat;
 *   - zero console errors on every surface.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = 4308;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-m2l2-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l2");
const DESKS = 12;
const BARS_PER_PAGE = 5;

const consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/lessons`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/* ---------------------------------------------------- projector guards -- */

const PROJECTOR_SHAPES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];
/** 2.6% of screen height — the projector review's measured back-row floor. */
const BACK_ROW_FLOOR_PCT = 2.6;
const boardFramesChecked = [];
const ellipsisScans = [];
const foldChecks = [];

async function assertFullyVisible(page, selector, label) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      vh: window.innerHeight,
      vw: window.innerWidth,
      text: (el.textContent || "").slice(0, 60),
    };
  }, selector);
  assert.ok(result.found, `${label}: element ${selector} not in the DOM at all`);
  assert.ok(
    result.top >= -1 && result.bottom <= result.vh + 1,
    `${label}: "${result.text}" is clipped vertically — box ${Math.round(result.top)}..${Math.round(result.bottom)} in a ${result.vh}px viewport`,
  );
  assert.ok(
    result.left >= -1 && result.right <= result.vw + 1,
    `${label}: "${result.text}" is clipped horizontally — box ${Math.round(result.left)}..${Math.round(result.right)} in a ${result.vw}px viewport`,
  );
}

/**
 * EVERY board frame, at BOTH projector shapes, must FIT.
 *
 * Called on every frame the run visits, not on a named subset, and it fails on
 * overflow rather than on unreachability — "reachable by scrolling" is the
 * substitution the L1 projector gate already rejected once.
 */
async function assertBoardFrameFits(board, label, restore = { width: 1600, height: 900 }) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(280);
    const fit = await board.evaluate(() => {
      const s = document.getElementById("stage");
      if (!s) return null;
      return {
        scrollH: s.scrollHeight,
        clientH: s.clientHeight,
        parts: [...s.children].map((c) => `${(c.className || c.tagName).toString().slice(0, 30)}:${Math.round(c.getBoundingClientRect().height)}px`),
      };
    });
    assert.ok(fit, `${label}: no #stage`);
    assert.ok(
      fit.scrollH <= fit.clientH + 1,
      `${label} @ ${shape.width}x${shape.height}: #stage OVERFLOWS by ${fit.scrollH - fit.clientH}px — ${fit.scrollH}px of content in a ${fit.clientH}px projector. A projector cannot scroll. Slots: ${fit.parts.join(" · ")}`,
    );
    boardFramesChecked.push(`${label}@${shape.width}`);
  }
  if (restore) {
    await board.setViewportSize(restore);
    await board.waitForTimeout(150);
  }
}

async function assertBackRowType(page, selector, label) {
  const m = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const px = parseFloat(getComputedStyle(el).fontSize);
    return { found: true, rendered: px, pct: (px / window.innerHeight) * 100, text: (el.textContent || "").slice(0, 40) };
  }, selector);
  assert.ok(m.found, `${label}: ${selector} is not on the frame at all`);
  assert.ok(
    m.pct >= BACK_ROW_FLOOR_PCT - 0.01,
    `${label}: "${m.text}" renders at ${m.rendered.toFixed(1)}px = ${m.pct.toFixed(2)}% of screen height, under the ${BACK_ROW_FLOOR_PCT}% back-row floor`,
  );
}


/**
 * NO SILENT TRUNCATION ANYWHERE ON THE BOARD.
 *
 * `gate-l2-projector` P-1 (BLOCKING): every club name on the weekly schedule was
 * ellipsized away at 11 and 12 desks at BOTH projector shapes — `Desk 1 · ...
 * HOSTS  Golden S...` — on the one frame the room lives in for most of PLAY.
 * The existing fit instrument PASSED those frames, because CSS ellipsis is
 * silent: overflow and clipping are both zero when the browser is quietly
 * throwing the text away. This is the guard that can see it.
 *
 * Two limbs, because there are two ways to lose text without overflowing:
 *   (a) any element that DECLARES `text-overflow: ellipsis` — the mechanism
 *       itself, banned outright on this board;
 *   (b) any element that clips its own content horizontally
 *       (`scrollWidth > clientWidth` under a non-visible overflow).
 */
async function assertNoEllipsization(board, label) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(260);
    const offenders = await board.evaluate(() => {
      const stage = document.getElementById("stage");
      if (!stage) return [];
      const out = [];
      for (const el of stage.querySelectorAll("*")) {
        const text = (el.textContent || "").trim();
        if (text.length === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.textOverflow === "ellipsis") {
          out.push({ why: "declares text-overflow:ellipsis", cls: el.className || el.tagName, text: text.slice(0, 46) });
          continue;
        }
        const clipsX = cs.overflowX !== "visible";
        if (clipsX && el.scrollWidth > el.clientWidth + 1) {
          out.push({
            why: `clipped horizontally: scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`,
            cls: el.className || el.tagName,
            text: text.slice(0, 46),
          });
        }
      }
      return out;
    });
    assert.equal(
      offenders.length,
      0,
      `${label} @ ${shape.width}x${shape.height}: the projector is silently truncating text the room needs to read —\n  ${offenders
        .map((o) => `${o.cls}: "${o.text}" (${o.why})`)
        .join("\n  ")}`,
    );
    ellipsisScans.push(`${label}@${shape.width}`);
  }
  await board.setViewportSize({ width: 1600, height: 900 });
  await board.waitForTimeout(150);
}

/* -------------------------------------------------- the Chromebook fold -- */

/**
 * `gate-l2-play` R1 (BLOCKING). At 1024x600 the bell used to leave the pair
 * looking at the REINVEST instruction paragraph for a week that had not started,
 * with the decomposition's bottom edge at y=749, KEPT at ~1050 and the
 * externality sentence — the one the whole synthesis is built on — at y=1103,
 * in a 600px viewport. The consequence of the week the room had just played was
 * ~500px below the fold.
 *
 * Asserted with NO manual scroll of any kind: whatever the page does on its own
 * after the bell is what a grade-5 pair gets.
 */
async function assertSettlementAboveFold(desk, label) {
  const m = await desk.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    return {
      vh: window.innerHeight,
      vw: window.innerWidth,
      scrollY: Math.round(window.scrollY),
      split: box("#hlSplit"),
      kept: box("[data-hl-kept]"),
      road: box("#hlRoad"),
      dial: box("#hlPriceDial"),
      lock: box("#hlLock"),
    };
  });
  assert.equal(m.vh, 600, `${label}: the fold guard must run at the 1024x600 classroom shape, got ${m.vw}x${m.vh}`);
  for (const [name, sel] of [["the decomposition (#hlSplit)", "split"], ["the KEPT figure", "kept"], ["the road card (#hlRoad)", "road"]]) {
    const b = m[sel];
    assert.ok(b, `${label}: ${name} is not on the screen at all after the bell`);
    assert.ok(
      b.top >= -1 && b.bottom <= m.vh + 1,
      `${label}: ${name} is NOT above the fold after the bell — box ${b.top}..${b.bottom} in a ${m.vh}px viewport (page is at scrollY ${m.scrollY})`,
    );
  }
  assert.ok(
    m.dial === null || m.dial.top >= m.vh,
    `${label}: next week's price dial is occupying the fold at the moment the result lands — box ${m.dial && m.dial.top}..${m.dial && m.dial.bottom}`,
  );
  assert.ok(m.lock && m.lock.bottom <= m.vh + 1, `${label}: LOCK IT IN is not reachable without scrolling — box ${m.lock && m.lock.top}..${m.lock && m.lock.bottom}`);
  foldChecks.push(label);
}

/**
 * `gate-l2-play` R2 (BLOCKING). First contact: LOCK IT IN was at y=650 in a
 * 600px viewport, and the schedule strip — the surface the whole anticipation
 * mechanic runs on — was at y~900.
 */
async function assertPrelockFold(desk, label) {
  const m = await desk.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), text: (el.textContent || "").trim().slice(0, 40) };
    };
    const rows = [...document.querySelectorAll("#hlPlayRoot .hl-slate-block .fh-slate-row")];
    return {
      vh: window.innerHeight,
      scrollY: Math.round(window.scrollY),
      lock: box(document.querySelector("#hlLock")),
      week2: box(rows[1] || null),
      rowCount: rows.length,
    };
  });
  assert.equal(m.vh, 600, `${label}: the fold guard must run at the 1024x600 classroom shape`);
  assert.ok(m.lock, `${label}: LOCK IT IN is not in the DOM`);
  assert.ok(m.lock.bottom <= m.vh + 1, `${label}: LOCK IT IN is below the fold — box ${m.lock.top}..${m.lock.bottom} in ${m.vh}px`);
  assert.ok(m.rowCount >= 2, `${label}: the schedule strip is not open on first contact (${m.rowCount} rows visible)`);
  assert.ok(
    m.week2 && m.week2.top >= -1 && m.week2.bottom <= m.vh + 1,
    `${label}: the Week 2 row of the schedule strip is not visible without scrolling — box ${m.week2 && m.week2.top}..${m.week2 && m.week2.bottom} ("${m.week2 && m.week2.text}")`,
  );
  foldChecks.push(label);
}

/* --------------------------------------------------------- UI helpers -- */

async function setPrice(page, price) {
  await page.waitForSelector("#hlPriceDial");
  await page.$eval(
    "#hlPriceDial",
    (el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    price,
  );
  await page.waitForFunction((p) => document.getElementById("hlPriceReadout")?.textContent === `$${p}`, price);
}

async function setShare(page, share) {
  const clicks = share / 5;
  for (let i = 0; i < clicks; i += 1) await page.click("#hlShareUp");
  await page.waitForFunction((s) => document.getElementById("hlShareReadout")?.textContent === `${s}%`, share);
}

async function lockWeek(page) {
  await page.click("#hlLock");
  await page.waitForSelector(".fh-locked-recap", { timeout: 20000 });
}

async function waitForWeek(page, weekNumber) {
  await page.waitForFunction(
    (w) => document.querySelector(".hl-week-num")?.textContent?.includes(`Week ${w} of`),
    weekNumber,
    { timeout: 30000 },
  );
}

async function advanceTo(teach, phase) {
  await teach.click("#btnAdvance");
  await teach.waitForSelector(`.phasechip.current:text('${phase}')`);
}

/* ------------------------------------------------------------- the run -- */

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });

  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

  const browser = await chromium.launch();
  let failure = null;
  try {
    await waitForServer();

    const teach = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const board = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    watchConsole(teach, "teach");
    watchConsole(board, "board");
    teach.on("dialog", (d) => d.accept());

    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l2-host-league");
    await teach.fill("#title", "E2E M2 L2 twelve-desk class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    console.log(`[e2e-m2l2] session ${code}`);

    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage .label");

    // ---- twelve pairs join --------------------------------------------
    const desks = [];
    for (let i = 0; i < DESKS; i += 1) {
      const p = await browser.newPage({ viewport: { width: 1024, height: 600 } });
      watchConsole(p, `desk${i + 1}`);
      p.on("dialog", (dlg) => dlg.accept());
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", `Pair ${i + 1}`);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      await p.waitForSelector(".fh-desk-name", { timeout: 30000 });
      desks.push(p);
    }
    console.log(`[e2e-m2l2] ${DESKS} pairs joined`);

    await board.waitForFunction((n) => document.querySelectorAll(".hl-club-chip.live").length >= n, DESKS, { timeout: 30000 });
    await assertBoardFrameFits(board, "LOBBY");
    await board.screenshot({ path: path.join(SCREEN_DIR, "01-board-lobby.png") });

    // ---- HOOK ----------------------------------------------------------
    await advanceTo(teach, "HOOK");
    // `.label` is CSS-uppercased, so innerText comes back shouting — match loosely.
    await board.waitForFunction(() => /same league/i.test(document.body.innerText), null, { timeout: 30000 });
    await assertFullyVisible(board, ".hl-hook-real", "HOOK: the real local-media numbers");
    await assertBackRowType(board, ".hl-hook-real", "HOOK: the real local-media numbers");
    // BC-3 / C-4: the stamp must be ON THE BOARD, not only in a ledger.
    const hookText = await board.evaluate(() => document.body.innerText);
    assert.match(hookText, /2016-17/, "the HOOK's real numbers must carry their season stamp on the board");
    assert.match(hookText, /ESPN/, "the HOOK's real numbers must name their source on the board");
    await assertBoardFrameFits(board, "HOOK");
    await board.screenshot({ path: path.join(SCREEN_DIR, "02-board-hook.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "03-play-hook.png") });

    // ---- PLAY: week 1 ---------------------------------------------------
    await advanceTo(teach, "PLAY");
    for (const p of desks) await p.waitForSelector("#hlPlayRoot", { timeout: 40000 });

    // The pre-lock screen carries no outcome of any kind.
    const preLock = await desks[0].evaluate(() => ({
      hasResult: !!document.querySelector(".fh-result"),
      hasSplit: !!document.querySelector("#hlSplit"),
      text: document.body.innerText,
    }));
    assert.equal(preLock.hasResult, false, "the pre-lock screen showed a settled week");
    assert.equal(preLock.hasSplit, false, "the pre-lock screen showed a decomposition");
    assert.match(preLock.text, /No preview/, "the pre-lock screen must say there is no preview");
    // play R2: first contact, no manual scroll, on every desk in the room.
    for (let i = 0; i < DESKS; i += 1) await assertPrelockFold(desks[i], `week 1 first contact, desk ${i + 1}`);

    // The board shows nothing about a week that is still open.
    const openWeekBoard = await board.evaluate(() => ({ bars: document.querySelectorAll("[data-hl-bar]").length, text: document.body.innerText }));
    assert.equal(openWeekBoard.bars, 0, "the board showed decomposition bars while week 1 was still open");
    assert.match(openWeekBoard.text, /WEEK 1 OF 3/, "the board must post the week's schedule");
    await assertBoardFrameFits(board, "PLAY week 1 (schedule)");
    await assertBackRowType(board, ".hl-pair-host", "PLAY: the pairing host name");
    await assertBackRowType(board, ".hl-pair-visitor", "PLAY: the visiting club name");
    await assertBackRowType(board, ".hl-pair-draw", "PLAY: the visiting club's Draw");
    await assertNoEllipsization(board, "PLAY week 1 (schedule)");
    // The names must be WHOLE, not merely un-clipped: assert the rendered text
    // still contains the club the module put there.
    const scheduleNames = await board.evaluate(() => ({
      hosts: [...document.querySelectorAll(".hl-pair-host")].map((n) => n.textContent.trim()),
      visitors: [...document.querySelectorAll(".hl-pair-visitor")].map((n) => n.textContent.trim()),
    }));
    for (const n of [...scheduleNames.hosts, ...scheduleNames.visitors]) {
      assert.ok(!n.endsWith("...") && !n.endsWith("\u2026"), `the schedule truncated a club name: "${n}"`);
    }
    await board.screenshot({ path: path.join(SCREEN_DIR, "04-board-week1.png") });

    const PRICES = [22, 30, 36, 42, 48, 52, 56, 62, 68, 74, 84, 96];
    const SHARES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 0, 20, 40];
    for (let i = 0; i < DESKS; i += 1) {
      await waitForWeek(desks[i], 1);
      await setPrice(desks[i], PRICES[i]);
      await setShare(desks[i], SHARES[i]);
      await lockWeek(desks[i]);
    }
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "05-play-week1-locked.png") });
    await teach.click("#btnCloseWeek");
    for (const p of desks) await waitForWeek(p, 2);
    console.log("[e2e-m2l2] week 1 settled");

    // play R1: the consequence, staged. Asserted on every desk, immediately
    // after the bell, with no manual scroll of any kind.
    for (let i = 0; i < DESKS; i += 1) await assertSettlementAboveFold(desks[i], `after the week 1 bell, desk ${i + 1}`);

    // BC-5 on the private surface: the desk's own three blocks, on its own device.
    await desks[0].waitForSelector("#hlSplit");
    const split = await desks[0].evaluate(() => {
      const rows = [...document.querySelectorAll("#hlSplit .hl-split-row")].map((r) => r.textContent.trim());
      return { rows, road: document.querySelector("#hlRoad")?.textContent ?? "" };
    });
    assert.equal(split.rows.length, 3, "the desk's own settlement must carry all three door blocks");
    assert.match(split.rows[2], /visiting/i, "the third block must name the visiting club");
    assert.match(split.road, /on THEIR books/, "the desk must be told what its own Draw earned on the road");
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "06-play-week1-result.png") });

    // ---- PLAY: week 2, the star departure -------------------------------
    await board.waitForSelector("#hlBoardShock", { timeout: 20000 });
    const shockText = await board.textContent("#hlBoardShock");
    assert.match(shockText, /lost their best player/, "the departure must be on the projector before week 2 is priced");
    await assertFullyVisible(board, "#hlBoardShock", "week 2: the star-departure card");
    await assertBackRowType(board, "#hlBoardShock", "week 2: the star-departure card");
    for (const p of desks) {
      const s = await p.evaluate(() => document.querySelector("#hlShock")?.textContent ?? "");
      assert.match(s, /lost their best player/, "every desk must see the departure before it prices week 2");
    }
    await assertBoardFrameFits(board, "PLAY week 2 (shock)");
    await assertNoEllipsization(board, "PLAY week 2 (schedule + shock)");
    await board.screenshot({ path: path.join(SCREEN_DIR, "07-board-week2-shock.png") });

    for (let i = 0; i < DESKS; i += 1) {
      await waitForWeek(desks[i], 2);
      await setPrice(desks[i], PRICES[(i + 4) % DESKS]);
      await setShare(desks[i], SHARES[(i + 3) % DESKS]);
      await lockWeek(desks[i]);
    }
    await teach.click("#btnCloseWeek");
    for (const p of desks) await waitForWeek(p, 3);
    console.log("[e2e-m2l2] week 2 settled");

    for (let i = 0; i < DESKS; i += 1) await assertSettlementAboveFold(desks[i], `after the week 2 bell, desk ${i + 1}`);

    // ---- the mid-lesson Handed-To-You release ---------------------------
    await teach.click("#btnHandedTo");
    await board.waitForSelector("[data-hl-bar]", { timeout: 20000 });
    await assertPagedBars(board, teach, "PLAY (mid-lesson release)", "08");

    // ---- PLAY: week 3, one desk deliberately never locks -----------------
    // Charter B: LOCK IT IN above the fold in EVERY week, not just the first.
    for (let i = 0; i < DESKS; i += 1) {
      const lock = await desks[i].evaluate(() => {
        const el = document.querySelector("#hlLock");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
      });
      assert.ok(lock, `week 3, desk ${i + 1}: LOCK IT IN is not in the DOM`);
      assert.ok(lock.bottom <= lock.vh + 1, `week 3, desk ${i + 1}: LOCK IT IN is below the fold — box ${lock.top}..${lock.bottom} in ${lock.vh}px`);
      foldChecks.push(`week 3 lock, desk ${i + 1}`);
    }
    for (let i = 0; i < DESKS - 1; i += 1) {
      await waitForWeek(desks[i], 3);
      await setPrice(desks[i], PRICES[(i + 7) % DESKS]);
      await setShare(desks[i], SHARES[(i + 6) % DESKS]);
      await lockWeek(desks[i]);
    }
    await teach.click("#btnCloseWeek");
    for (const p of desks) await p.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 40000 });
    // `.fh-flag` is CSS-uppercased, so innerText comes back shouting.
    const autoFlag = await desks[DESKS - 1].evaluate(() => /\bauto\b/i.test(document.body.innerText));
    assert.ok(autoFlag, "the desk that never locked must be settled and marked AUTO, never skipped");
    console.log("[e2e-m2l2] three weeks settled");

    // ---- REVEAL ---------------------------------------------------------
    await advanceTo(teach, "REVEAL");
    const headlines = [];
    // Wait for the PROJECTOR to actually change beat, not for the POST to
    // return. A fixed sleep here samples the previous stage twice and reports
    // five presses as three beats — exactly the blind spot this guard exists
    // to close.
    let prevHeadline = (await board.textContent("#stage .label")).trim();
    for (let stage = 1; stage <= 5; stage += 1) {
      await teach.click("#btnRevealNext");
      await board.waitForFunction(
        (prev) => ((document.querySelector("#stage .label") || {}).textContent || "").trim() !== prev,
        prevHeadline,
        { timeout: 30000 },
      );
      const headline = (await board.textContent("#stage .label")).trim();
      prevHeadline = headline;
      assert.ok(headline.length > 0, `reveal stage ${stage} rendered no headline`);
      headlines.push(headline);
      if (stage === 1) {
        await assertPagedBars(board, teach, "REVEAL stage 1", "09");
      } else {
        await assertBoardFrameFits(board, `REVEAL stage ${stage}`);
        await assertNoEllipsization(board, `REVEAL stage ${stage}`);
        await board.screenshot({ path: path.join(SCREEN_DIR, `1${stage}-board-reveal-${stage}.png`) });
      }
      if (stage === 2) {
        // econ B1: the beat that exists to make free-riding arguable must be
        // reading the by-choice instrument, and must say so.
        await assertBackRowType(board, "#hlLedger .hl-ledger-draw", "REVEAL stage 2: the per-desk foot");
        await assertBackRowType(board, "#hlLedgerSummary", "REVEAL stage 2: the class summary");
        const ledgerText = await board.evaluate(() => document.body.innerText);
        assert.match(ledgerText, /spent \$/, "the ledger must print what each desk actually spent");
        assert.match(ledgerText, /YOUR spending|nobody in this room put a dollar back/i, "the ledger legend must name the by-choice instrument");
      }
      if (stage === 3) {
        // gate-l2-projector P-2: "gate 24.5% · national 33.9%" is the lesson's
        // most surprising true number and rendered at 2.13% of screen height.
        await assertBackRowType(board, ".hl-pipe-nums", "REVEAL stage 3: the pipe percentages");
      }
      if (stage === 4) {
        const pathText = await board.textContent("#hlPath");
        if (/runs one of the league's smallest markets/.test(pathText)) {
          const prices = pathText.match(/priced at \$\d+/g) ?? [];
          assert.equal(prices.length, 2, `the small-market exhibit must print BOTH desks' prices, got: ${pathText}`);
        }
      }
      if (stage === 5) {
        const changeText = await board.textContent("#hlChange");
        assert.equal(/[Nn]obody told this room to move/.test(changeText), false, "reveal 5 must not claim spontaneity it cannot see");
        assert.match(changeText, /earns nothing else in this lesson/, "reveal 5 must teach the last-week horizon rule");
        await assertBackRowType(board, ".hl-mean-lbl", "REVEAL stage 5: the week labels");
      }
    }
    assert.equal(new Set(headlines).size, 5, `every reveal stage must be its own beat, got: ${headlines.join(" | ")}`);
    // Stage 2 is the give-and-take ledger; stage 3 the pipes; stage 5 the means.
    console.log(`[e2e-m2l2] reveal stages: ${headlines.join(" | ")}`);

    // ---- ADAPT ----------------------------------------------------------
    await advanceTo(teach, "ADAPT");
    await board.waitForFunction(() => /what moved your money/i.test(document.body.innerText), null, { timeout: 30000 });
    await assertBoardFrameFits(board, "ADAPT");
    await assertNoEllipsization(board, "ADAPT");
    await board.screenshot({ path: path.join(SCREEN_DIR, "16-board-adapt.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "17-play-adapt.png") });

    // ---- ARGUE ----------------------------------------------------------
    await advanceTo(teach, "ARGUE");
    await board.waitForSelector("#hlArgue", { timeout: 20000 });
    const argue = await board.textContent("#hlArgue");
    assert.match(argue, /Cooper Flagg/, "the ARGUE exhibit must ship its counter-case in the same breath");
    assert.match(argue, /2025/, "the ARGUE exhibit must carry its date");
    await assertFullyVisible(board, "#hlArgue", "ARGUE: the exhibit");
    await assertBoardFrameFits(board, "ARGUE");
    await board.screenshot({ path: path.join(SCREEN_DIR, "18-board-argue.png") });

    // ---- SYNTHESIS ------------------------------------------------------
    await advanceTo(teach, "SYNTHESIS");
    await board.waitForSelector(".synthcard", { timeout: 20000 });
    const cardCount = Number(await teach.evaluate(() => {
      const m = document.getElementById("pagerNow")?.textContent?.match(/card \d+ of (\d+)/i);
      return m ? m[1] : "1";
    }));
    for (let i = 0; i < Math.max(1, cardCount); i += 1) {
      const title = (await board.textContent(".synthcard h3")).trim();
      await assertFullyVisible(board, ".synthcard", `SYNTHESIS card ${i + 1} (${title})`);
      await assertBackRowType(board, ".synthcard p", `SYNTHESIS card ${i + 1} body`);
      await assertBoardFrameFits(board, `SYNTHESIS card ${i + 1}`);
      await assertNoEllipsization(board, `SYNTHESIS card ${i + 1}`);
      await board.screenshot({ path: path.join(SCREEN_DIR, `19-board-synthesis-${i + 1}.png`) });
      if (i < cardCount - 1) {
        const before = title;
        await teach.click("#btnSynthPage");
        await board.waitForFunction((t) => (document.querySelector(".synthcard h3")?.textContent ?? "").trim() !== t, before, { timeout: 20000 });
      }
    }

    // ---- COMPLETE -------------------------------------------------------
    await advanceTo(teach, "COMPLETE");
    await board.waitForFunction(() => /complete/i.test(document.body.innerText), null, { timeout: 30000 });
    await assertBoardFrameFits(board, "COMPLETE");
    await board.screenshot({ path: path.join(SCREEN_DIR, "20-board-complete.png") });
    await teach.screenshot({ path: path.join(SCREEN_DIR, "21-teach-director.png"), fullPage: true });

    assert.deepEqual(consoleErrors, [], `console errors:\n${consoleErrors.join("\n")}`);
    console.log(
      `[e2e-m2l2] PASS — ${boardFramesChecked.length / 2} board frames checked at 2 projector shapes, ` +
        `${ellipsisScans.length / 2} frames scanned for silent truncation, ${foldChecks.length} 1024x600 fold assertions, zero console errors`,
    );
  } catch (error) {
    failure = error;
  } finally {
    await browser.close();
    server.kill("SIGTERM");
    try {
      fs.rmSync(SNAPSHOT_FILE, { force: true });
    } catch {
      /* best effort */
    }
  }
  if (failure) throw failure;
}

/**
 * The class-scale instrument for the Handed-To-You bar.
 *
 * At twelve desks the bar pages, so this walks EVERY group at BOTH projector
 * shapes and asserts, per group: every rendered bar's own box is fully inside
 * the viewport, the class summary's box is fully inside the viewport, the
 * evidence tier clears the back-row floor, and `#stage` does not overflow at
 * all. Then, across groups, that the union of desks the room was actually shown
 * is all twelve. Drop a bar and the union check fails; let a group overflow and
 * the per-bar check fails.
 */
async function assertPagedBars(board, teach, label, screenPrefix) {
  const pages = Math.ceil(DESKS / BARS_PER_PAGE);
  const seen = new Set();
  for (let group = 0; group < pages; group += 1) {
    for (const shape of PROJECTOR_SHAPES) {
      await board.setViewportSize(shape);
      await board.waitForTimeout(300);
      const tag = `${label} group ${group + 1}/${pages} @ ${shape.width}x${shape.height}`;
      const barCount = await board.evaluate(() => document.querySelectorAll("[data-hl-bar]").length);
      assert.ok(barCount > 0, `${tag}: no bars rendered at all`);
      assert.ok(barCount <= BARS_PER_PAGE, `${tag}: ${barCount} bars in one group — the projector cap is not being applied`);
      for (let b = 1; b <= barCount; b += 1) {
        await assertFullyVisible(board, `#hlBars .hl-bar-row:nth-child(${b})`, `${tag}: bar ${b} of ${barCount}`);
        await assertBackRowType(board, `#hlBars .hl-bar-row:nth-child(${b}) .hl-bar-handle`, `${tag}: bar ${b} desk handle`);
      }
      await assertFullyVisible(board, "#hlBarSummary", `${tag}: the class summary`);
      await assertBackRowType(board, "#hlBarSummary", `${tag}: the class summary`);
      // gate-l2-projector P-2: the visiting-club attribution under every bar is
      // the BC-5 evidence and rendered at 1.78% of screen height, well under the
      // back-row floor. It is the exact text ADAPT question 2 sends students to.
      await assertBackRowType(board, "#hlBars .hl-bar-row:nth-child(1) .hl-bar-foot", `${tag}: the visiting-club attribution`);
      const fit = await board.evaluate(() => {
        const s = document.getElementById("stage");
        return {
          scrollH: s.scrollHeight,
          clientH: s.clientHeight,
          parts: [...s.children].map((c) => `${c.className || c.tagName} ${Math.round(c.getBoundingClientRect().height)}px`),
        };
      });
      assert.ok(
        fit.scrollH <= fit.clientH + 1,
        `${tag}: #stage overflows by ${fit.scrollH - fit.clientH}px — the room would have to scroll mid-reveal. Slots: ${fit.parts.join(" · ")}`,
      );
      boardFramesChecked.push(`${label}-g${group + 1}@${shape.width}`);
      if (shape.width === 1366) {
        const handles = await board.evaluate(() => [...document.querySelectorAll("#hlBars .hl-bar-handle")].map((n) => n.textContent.trim()));
        for (const h of handles) seen.add(h);
        // Every bar must name the visiting clubs that filled it — that is the
        // "attribute a night's gate from the UI alone" condition (BC-5).
        const feet = await board.evaluate(() => [...document.querySelectorAll("#hlBars .hl-bar-foot")].map((n) => n.textContent.trim()));
        for (const f of feet) assert.ok(f.length > 0, `${tag}: a bar carried no visiting-club attribution`);
        await board.screenshot({ path: path.join(SCREEN_DIR, `${screenPrefix}-board-bar-group${group + 1}.png`) });
      }
    }
    if (group < pages - 1) {
      const before = await board.evaluate(() => document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "");
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnBarPage");
      await resp;
      await board.waitForFunction((prev) => (document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 25000 });
    }
  }
  assert.equal(seen.size, DESKS, `${label}: the room was shown ${seen.size} desks, not all ${DESKS}`);
  // Back navigation must actually move the projector backwards.
  const before = await board.evaluate(() => document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "");
  const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
  await teach.click("#btnBarPageBack");
  await resp;
  await board.waitForFunction((prev) => (document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 25000 });
  await board.setViewportSize({ width: 1600, height: 900 });
  await board.waitForTimeout(150);
}

main().catch((error) => {
  console.error(`[e2e-m2l2] FAIL — ${error.message}`);
  if (consoleErrors.length > 0) console.error(consoleErrors.join("\n"));
  process.exit(1);
});
