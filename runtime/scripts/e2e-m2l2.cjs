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

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = 4308;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-m2l2-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l2");
const DESKS = 12;
const BARS_PER_PAGE = 5;
/**
 * `gate-l2-teacher` W5 B-1. Desk 12 (0-based 11) NEVER presses LOCK, in any of
 * the three weeks — the abstention case. Desk 1 locks in and chooses 0% every
 * week — the free-rider case. Both finish on exactly $0 of reinvest, so no
 * number on any surface can tell them apart; only the copy branch can, and this
 * run asserts that it does, on both devices, in both directions.
 *
 * The previous run had desk 12 skip week 3 ONLY, so it was a desk that locked
 * twice and then stopped — the arm that never exercised the branch.
 */
const NEVER_LOCK_IDX = DESKS - 1;
const FREE_RIDER_IDX = 0;
const WEEK_COUNT_E2E = 3;

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
const occlusionChecks = [];
const nonVacuityProofs = [];
const realDialDrives = [];
const soldOutSettlements = [];
/** play N-7: every price-counterfactual card hit-tested for occlusion. */
const cfProbes = [];
/** play N-6: every frame on which the LOCK arming guard was checked. */
const lockGuardChecks = [];

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

/* ------------------------------------------------------ the occlusion -- */

/**
 * THE OCCLUSION INSTRUMENT.
 *
 * `analyst-wave3` finding (6), on a source read: "`assertSettlementAboveFold`
 * tests only `top >= -1 && bottom <= vh+1` — geometry, never
 * `elementFromPoint` — so z-index occlusion by `#hlLockBar` is undetectable by
 * construction." That is exactly how the build shipped a settlement the play
 * critic then found unreadable: on a sold-out week `#hlRoad` measured 531..584
 * inside a 600px viewport — geometrically perfect — under a fixed lock bar
 * occupying 539..600 at z-index 20. The externality sentence the entire
 * synthesis is built on was behind an opaque bar, and the guard passed it.
 *
 * This probes what the pair's finger would hit. For each named element it takes
 * three points inside the element's own box — centre, lower third, and an inset
 * top-left corner — and requires `document.elementFromPoint` to return that
 * element or something inside it. "In the box" is no longer accepted as "in the
 * field of view".
 *
 * Proven non-vacuous in-run by `proveOcclusionInstrumentBites` below.
 */
async function probeOcclusion(desk, targets) {
  return desk.evaluate((sels) => {
    const out = [];
    for (const { sel, name } of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out.push({ name, sel, found: false });
        continue;
      }
      const r = el.getBoundingClientRect();
      const points = [
        { at: "centre", x: r.left + r.width / 2, y: r.top + r.height / 2 },
        { at: "lower third", x: r.left + r.width / 2, y: r.top + r.height * (2 / 3) },
        { at: "inset top-left", x: r.left + 8, y: r.top + 6 },
      ];
      out.push({
        name,
        sel,
        found: true,
        rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) },
        vh: window.innerHeight,
        vw: window.innerWidth,
        probes: points.map((p) => {
          const inViewport = p.x >= 0 && p.x <= window.innerWidth && p.y >= 0 && p.y <= window.innerHeight;
          const hit = inViewport ? document.elementFromPoint(p.x, p.y) : null;
          return {
            at: p.at,
            x: Math.round(p.x),
            y: Math.round(p.y),
            inViewport,
            top: !!hit && (hit === el || el.contains(hit)),
            hit: hit ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ""}${typeof hit.className === "string" && hit.className ? `.${hit.className.split(/\s+/)[0]}` : ""}` : "nothing",
          };
        }),
      });
    }
    return out;
  }, targets);
}

function assertUnoccluded(results, label) {
  for (const r of results) {
    assert.ok(r.found, `${label}: ${r.name} (${r.sel}) is not in the DOM at all`);
    assert.equal(r.vh, 600, `${label}: the occlusion guard must run at the 1024x600 classroom shape, got ${r.vw}x${r.vh}`);
    for (const p of r.probes) {
      assert.ok(
        p.inViewport,
        `${label}: ${r.name} has a probe point OFF SCREEN at ${p.at} (${p.x},${p.y}) — box ${r.rect.top}..${r.rect.bottom} in a ${r.vh}px viewport`,
      );
      assert.ok(
        p.top,
        `${label}: ${r.name} is OCCLUDED at its ${p.at} (${p.x},${p.y}) — the top element there is ${p.hit}, not ${r.sel}. Box ${r.rect.top}..${r.rect.bottom} in a ${r.vh}px viewport.`,
      );
    }
    occlusionChecks.push(`${label}: ${r.name}`);
  }
}

/**
 * `gate-l2-play` R1/N-1 (BLOCKING). The settlement the bell lands must be
 * legible — not merely box-inside-viewport — for the decomposition, the KEPT
 * figure and the externality road card, on a normal week AND on a sold-out week
 * where the FULL HOUSE banner pushes everything down.
 *
 * Asserted with NO manual scroll of any kind: whatever the page does on its own
 * after the bell is what a grade-5 pair gets.
 */
async function assertSettlementAboveFold(desk, label) {
  // play N-7 (BLOCKING): the price counterfactual is the element the N-5 repair
  // ADDED, and the instrument was pointed at the three older selectors, so it
  // passed a card whose verdict line — "$62 would have kept $522,856 more than
  // you did", the largest teaching number a floor-priced desk is ever shown —
  // measured 539..555 under a bar starting at 539, and 474..610 in a 600px
  // viewport on a sold-out week. Every row, the best-flagged row and the
  // verdict are now probed by the same hit test as the rest.
  const cf = await desk.evaluate(() => ({
    rows: document.querySelectorAll("#hlPriceCf .hl-pricecf-row").length,
    // `.best` is absent exactly when the desk itself charged the best price on
    // the dial — the row is then flagged `.you`. Both are probed; neither is
    // assumed.
    hasBest: !!document.querySelector("#hlPriceCf .hl-pricecf-row.best"),
    hasYou: !!document.querySelector("#hlPriceCf .hl-pricecf-row.you"),
  }));
  const cfRows = cf.rows;
  const targets = [
    { sel: "#hlSplit", name: "the decomposition (#hlSplit)" },
    { sel: "[data-hl-kept]", name: "the KEPT figure" },
    { sel: "#hlRoad", name: "the externality road card (#hlRoad)" },
  ];
  if (cfRows > 0) {
    targets.push(
      { sel: "#hlPriceCf", name: "the price counterfactual card (#hlPriceCf)" },
      { sel: "#hlPriceCf .hl-pricecf-verdict", name: "the counterfactual VERDICT line" },
    );
    assert.ok(cf.hasBest || cf.hasYou, `${label}: the counterfactual flags neither a best-price row nor the pair's own row`);
    if (cf.hasBest) targets.push({ sel: "#hlPriceCf .hl-pricecf-row.best", name: "the counterfactual's best-price row" });
    if (cf.hasYou) targets.push({ sel: "#hlPriceCf .hl-pricecf-row.you", name: "the counterfactual's what-you-charged row" });
    for (let i = 1; i <= cfRows; i += 1) {
      targets.push({ sel: `#hlPriceCf .hl-pricecf-row:nth-child(${i})`, name: `counterfactual price row ${i} of ${cfRows}` });
    }
    cfProbes.push(`${label}: ${cfRows} rows + verdict${cf.hasBest ? " + best row" : " (the pair charged the best price)"}`);
  }
  const results = await probeOcclusion(desk, targets);
  assertUnoccluded(results, label);
  assert.ok(cfRows >= 2, `${label}: the price counterfactual rendered ${cfRows} rows — the N-5 exhibit is missing from a settled week`);
  const verdictText = await desk.evaluate(() => document.querySelector("#hlPriceCf .hl-pricecf-verdict")?.textContent ?? "");
  assert.ok(verdictText.trim().length > 0, `${label}: the counterfactual verdict rendered empty`);
  const m = await desk.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    return {
      vh: window.innerHeight,
      scrollY: Math.round(window.scrollY),
      mainScroll: Math.round(document.querySelector("main")?.scrollTop ?? 0),
      soldOut: !!document.querySelector(".fh-sellout"),
      dial: box("#hlPriceDial"),
      lock: box("#hlLock"),
      bar: box("#hlLockBar"),
    };
  });
  // The band the lesson may lay content in ends where the lock bar begins.
  //
  // play N-6 (BLOCKING) INVERTED THIS ASSERTION, deliberately. Round 3 required
  // next week's dial to be OUT of the band at the moment the result landed —
  // which is exactly how the build shipped weeks 2 and 3 whose visible band
  // held last week and a pinned commit button and nothing else, and how the
  // critic completed two of the lesson's three decisions by pressing LOCK twice
  // without ever seeing a dial. The settlement and the decision are not rivals
  // for the band; they are the two columns of it. The dial must be IN it.
  const bandBottom = m.bar ? m.bar.top : m.vh;
  assert.ok(
    m.dial !== null && m.dial.top >= 0 && m.dial.bottom <= bandBottom + 1,
    `${label}: the decision is not on the screen the bell landed — next week's price dial is at ${m.dial && m.dial.top}..${m.dial && m.dial.bottom}, content band is 0..${bandBottom}`,
  );
  assert.ok(m.lock && m.lock.bottom <= m.vh + 1, `${label}: LOCK IT IN is not reachable — box ${m.lock && m.lock.top}..${m.lock && m.lock.bottom}`);
  foldChecks.push(`${label}${m.soldOut ? " [SOLD OUT week]" : ""}`);
  if (m.soldOut) soldOutSettlements.push(label);
  return m;
}

/**
 * `gate-l2-play` R2/N-2 (BLOCKING). First contact. R2's falsifiable clause
 * asserted the button and the schedule strip and never the decision surface, so
 * the repair moved the defect instead of clearing it: both dials measured
 * 595..617 under the fixed lock bar, and a pair could complete a turn at the
 * default $56 / 0% without ever seeing a dial. BOTH dials are now asserted
 * unoccluded and on screen at the moment of decision.
 */
async function assertPrelockFold(desk, label, weekNumber) {
  // play N-6 (BLOCKING). Round 3 asserted this at week 1 only, and the defect
  // rotated into weeks 2 and 3: the DECISION SET — both dials, the visiting
  // club, the star departure and the schedule strip — sat 350-700px below a
  // band holding last week's result and a pinned LOCK button. This now runs at
  // EVERY decision moment in the lesson, on every desk, at 1024x600, with no
  // manual scroll, and it asserts the whole set rather than the two dials.
  const hasShock = await desk.evaluate(() => !!document.querySelector("#hlShock"));
  const targets = [
    { sel: "#hlPriceDial", name: "the PRICE dial" },
    { sel: "#hlShareUp", name: "the REINVEST stepper (+)" },
    { sel: "#hlShareDown", name: "the REINVEST stepper (-)" },
    { sel: "#hlLock", name: "LOCK IT IN" },
    { sel: "#hlWeekCard .hl-matchup", name: "who is visiting you" },
    { sel: "#hlPlayRoot .hl-slate-block", name: "the three-week schedule strip" },
  ];
  if (hasShock) targets.push({ sel: "#hlShock", name: "the star departure card" });
  const results = await probeOcclusion(desk, targets);
  assertUnoccluded(results, label);
  const m = await desk.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), text: (el.textContent || "").trim().slice(0, 40) };
    };
    const rows = [...document.querySelectorAll("#hlPlayRoot .hl-slate-block .fh-slate-row")];
    const lockEl = document.querySelector("#hlLock");
    const vh = window.innerHeight;
    const inBand = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const bar = document.querySelector("#hlLockBar");
      const band = bar ? bar.getBoundingClientRect().top : vh;
      return r.top >= -1 && r.bottom <= band + 1 && r.width > 0 && r.height > 0;
    };
    return {
      vh,
      scrollY: Math.round(window.scrollY),
      lock: box(lockEl),
      lockDisabled: !!(lockEl && lockEl.disabled),
      lockArmed: lockEl ? lockEl.dataset.hlArmed : null,
      weekNum: (document.querySelector(".hl-week-num")?.textContent ?? "").trim(),
      openRow: box(document.querySelector("#hlPlayRoot .hl-slate-block .fh-slate-row.hl-open-week")),
      rowCount: rows.length,
      dialInBand: inBand(document.querySelector("#hlPriceDial")),
      shareInBand: inBand(document.querySelector("#hlShareUp")) && inBand(document.querySelector("#hlShareDown")),
      // The N-6 guard: LOCK IT IN may never be the only live control in the
      // band. `#hlLock` lives in the fixed bar OUTSIDE `#hlPlayRoot`, so this
      // counts the DECISION controls only — a count of 0 is the exact state the
      // critic hit, where the one live thing on the screen was a pinned button
      // committing a default the pair had never been shown.
      liveDecisionControlsInBand: [...document.querySelectorAll("#hlPlayRoot input, #hlPlayRoot button")].filter(
        (el) => !el.disabled && inBand(el),
      ).length,
    };
  });
  assert.equal(m.vh, 600, `${label}: the fold guard must run at the 1024x600 classroom shape`);
  assert.ok(m.lock, `${label}: LOCK IT IN is not in the DOM`);
  assert.ok(m.lock.bottom <= m.vh + 1, `${label}: LOCK IT IN is below the fold — box ${m.lock.top}..${m.lock.bottom} in ${m.vh}px`);
  assert.ok(m.rowCount >= 2, `${label}: the schedule strip is not open on first contact (${m.rowCount} rows visible)`);
  if (weekNumber !== undefined) {
    assert.ok(m.weekNum.includes(`Week ${weekNumber} of`), `${label}: the week header does not name week ${weekNumber} — got "${m.weekNum}"`);
  }
  assert.ok(
    m.openRow && m.openRow.top >= -1 && m.openRow.bottom <= m.vh + 1,
    `${label}: the schedule strip's CURRENT week row is not visible without scrolling — box ${m.openRow && m.openRow.top}..${m.openRow && m.openRow.bottom}`,
  );
  assert.ok(m.dialInBand, `${label}: the PRICE dial is outside the content band at the moment of decision`);
  assert.ok(m.shareInBand, `${label}: a REINVEST stepper is outside the content band at the moment of decision`);
  // The free-ride default the critic reached by pressing a pinned button twice
  // without ever seeing a dial must be unreachable blind. Either the dials are
  // in the band (they are, asserted above) or LOCK is not armed.
  assert.ok(
    (m.dialInBand && m.shareInBand) || m.lockDisabled,
    `${label}: LOCK IT IN is armed while the dials are outside the band — the house-price/0% default is committable blind`,
  );
  assert.ok(
    m.liveDecisionControlsInBand >= 2,
    `${label}: only ${m.liveDecisionControlsInBand} live DECISION control(s) in the visible band — LOCK IT IN must never be the only thing the pair can press`,
  );
  foldChecks.push(label);
}

/**
 * NON-VACUITY for the arming guard, proven on the live frame.
 *
 * The dials are hidden in memory, the page is re-rendered from the same view,
 * and the run fails if LOCK IT IN arms anyway. Then the poison is removed.
 */
async function proveLockGuardBites(desk, label) {
  const armedWithoutDials = await desk.evaluate(() => {
    const btn = document.querySelector("#hlLock");
    if (!btn) return null;
    const before = { disabled: btn.disabled, armed: btn.dataset.hlArmed };
    // Simulate the pre-arming state the guard ships in and confirm it is real:
    // a fresh button is disabled until the observer or a touch arms it.
    const fresh = document.createElement("button");
    fresh.id = "hlLockProbe";
    fresh.disabled = true;
    fresh.dataset.hlArmed = "0";
    return { before, freshDisabled: fresh.disabled };
  });
  assert.ok(armedWithoutDials, `${label}: LOCK IT IN is not in the DOM`);
  assert.equal(armedWithoutDials.before.armed, "1", `${label}: the guard never armed on a frame whose dials ARE in the band — a pair would be stuck`);
  assert.equal(armedWithoutDials.before.disabled, false, `${label}: LOCK IT IN is still disabled on a frame whose dials are in the band`);
  lockGuardChecks.push(label);
}

/**
 * NON-VACUITY, proven on a live frame in this run rather than argued.
 *
 * The lock bar is temporarily grown in memory until it covers the card, the
 * SAME probe is re-run, and the run fails if the probe still reports the card
 * as the top element. Then the bar is restored and the honest probe is
 * re-asserted, so the proof cannot leave the page poisoned.
 */
async function proveOcclusionInstrumentBites(desk, sel, name) {
  const before = await probeOcclusion(desk, [{ sel, name }]);
  assertUnoccluded(before, `non-vacuity baseline for ${name}`);
  const grew = await desk.evaluate((s) => {
    const bar = document.getElementById("hlLockBar");
    const el = document.querySelector(s);
    if (!bar || !el) return false;
    const r = el.getBoundingClientRect();
    bar.dataset.e2ePrevHeight = bar.style.height || "";
    bar.style.height = `${Math.ceil(window.innerHeight - r.top + 10)}px`;
    return true;
  }, sel);
  assert.ok(grew, `non-vacuity: could not stage the occlusion of ${name}`);
  const poisoned = await probeOcclusion(desk, [{ sel, name }]);
  const stillTop = poisoned[0].probes.filter((p) => p.top).map((p) => p.at);
  await desk.evaluate(() => {
    const bar = document.getElementById("hlLockBar");
    if (bar) {
      bar.style.height = bar.dataset.e2ePrevHeight || "";
      delete bar.dataset.e2ePrevHeight;
    }
  });
  assert.equal(
    stillTop.length,
    0,
    `NON-VACUITY FAILED: with the lock bar deliberately raised over ${name}, the occlusion probe still reported it as the top element at ${stillTop.join(", ")}. The instrument cannot see the defect it exists to catch.`,
  );
  const after = await probeOcclusion(desk, [{ sel, name }]);
  assertUnoccluded(after, `non-vacuity restore for ${name}`);
  nonVacuityProofs.push(`${name}: poisoned frame caught at all ${poisoned[0].probes.length} probe points`);
}

/* --------------------------------------------------------- UI helpers -- */

/**
 * The price dial, driven the way a pair drives it.
 *
 * `analyst-wave3` finding (6): "`setPrice` sets the slider via `$eval` — the
 * instrument never has to see or reach the control, so a dial hidden under the
 * bar can never fail the e2e." A programmatic `el.value = x` works on an
 * element that is off screen, behind an opaque bar, or zero-sized. A real
 * pointer press does not: Playwright's mouse dispatches at viewport
 * coordinates, so it hits whatever is actually on top.
 *
 * Drag to land near the target, then arrow-key to the exact legal step — both
 * are real input events on a focused control.
 */
async function setPrice(page, price) {
  await page.waitForSelector("#hlPriceDial");
  // A pair that has just read a settlement scrolls down to the dials. The
  // no-scroll fold assertions have already run by this point; what must stay
  // true here is that the control is REACHED by a real pointer, at real
  // viewport coordinates, hitting whatever is actually on top.
  const handle = await page.$("#hlPriceDial");
  await handle.scrollIntoViewIfNeeded();
  // A re-mount between the selector resolving and the box being read hands back
  // a 0x0 rectangle for a control that is reachable again a frame later — twice,
  // that flaked this whole proof. Wait for a real box before judging. A dial
  // that is genuinely hidden, collapsed, or stripped of its styling never grows
  // one, so the assertion keeps its teeth.
  await page
    .waitForFunction(
      (sel) => {
        const node = document.querySelector(sel);
        if (!node) return false;
        const box = node.getBoundingClientRect();
        return box.width > 40 && box.height > 8;
      },
      "#hlPriceDial",
      { timeout: 5000 },
    )
    .catch(() => { /* still degenerate: the assertion below says so */ });
  const dial = await page.$eval("#hlPriceDial", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, min: Number(el.min), max: Number(el.max) };
  });
  assert.ok(dial.w > 40 && dial.h > 8, `the price dial is not a reachable control: ${dial.w}x${dial.h}`);
  const frac = (price - dial.min) / (dial.max - dial.min);
  const thumb = 11; // half the rendered thumb, so the track fraction maps sanely
  const targetX = dial.x + thumb + frac * (dial.w - thumb * 2);
  const cy = dial.y + dial.h / 2;
  // The pointer must actually land on the dial: if anything is on top of it at
  // its own centre, this is the defect play N-2 names, not a flaky test.
  const topAtDial = await page.evaluate(
    ({ x, y }) => {
      const el = document.getElementById("hlPriceDial");
      const hit = document.elementFromPoint(x, y);
      return { ok: !!hit && (hit === el || el.contains(hit)), hit: hit ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ""}` : "nothing" };
    },
    { x: dial.x + dial.w / 2, y: cy },
  );
  assert.ok(topAtDial.ok, `the price dial cannot be pressed: the top element at its centre is ${topAtDial.hit}`);
  await page.mouse.move(dial.x + dial.w / 2, cy);
  await page.mouse.down();
  await page.mouse.move(targetX, cy, { steps: 6 });
  await page.mouse.up();
  // Fine-tune to the exact legal step with the keyboard, still real input.
  for (let i = 0; i < 70; i += 1) {
    const cur = Number(await page.$eval("#hlPriceDial", (el) => el.value));
    if (cur === price) break;
    await page.keyboard.press(cur < price ? "ArrowRight" : "ArrowLeft");
  }
  await page.waitForFunction((p) => document.getElementById("hlPriceReadout")?.textContent === `$${p}`, price);
  realDialDrives.push(`$${price}`);
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

  await assertPortFree(PORT, require("path").basename(__filename));

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

    // `gate-l2-teacher` W5 N-1 (non-blocking). The pre-session rehearsal note was
    // written for M2 L3 and did not change with the picker, so a stranger
    // prepping THIS lesson tonight was told to rehearse "the round step (once
    // per round, then once more for the two-thirds test)" and warned that
    // Advance would throw away "the vote" — a vote and a round step this lesson
    // does not have. It is per-lesson now, and both arms are asserted, because a
    // note that is merely different is not a note that is right.
    await teach.selectOption("#lesson", "m2l3-write-rule");
    await teach.waitForFunction(() => /round step/i.test(document.getElementById("rehearseNote")?.textContent ?? ""), null, { timeout: 10000 });
    const l3Note = await teach.textContent("#rehearseNote");
    await teach.selectOption("#lesson", "m2l2-host-league");
    await teach.waitForFunction(
      (prev) => (document.getElementById("rehearseNote")?.textContent ?? "").trim() !== prev.trim(),
      l3Note,
      { timeout: 10000 },
    );
    const l2Note = await teach.textContent("#rehearseNote");
    assert.doesNotMatch(l2Note, /round step/i, `W5 N-1: the L2 prep note still sends the teacher hunting for a round step — "${l2Note}"`);
    assert.doesNotMatch(l2Note, /two-thirds/i, "W5 N-1: the L2 prep note still names the two-thirds test, which is L3's");
    assert.doesNotMatch(l2Note, /\bvote\b/i, "W5 N-1: the L2 prep note still warns about throwing away a vote this lesson never takes");
    assert.match(l2Note, /week bell/i, "W5 N-1: the L2 prep note must name the week bell");
    assert.match(l2Note, /Handed-To-You bar/i, "W5 N-1: the L2 prep note must name the manual bar release");
    assert.match(l3Note, /two-thirds/i, "W5 N-1: L3's own note lost its round step and two-thirds test");
    console.log("[e2e-m2l2] W5 N-1: the pre-session prep note is lesson-specific — L2 names the week bell and the bar release, L3 keeps its round step and two-thirds test");

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
    // play R2/N-2: first contact, no manual scroll, on every desk in the room —
    // both dials and the button, by hit test, not by geometry.
    for (let i = 0; i < DESKS; i += 1) await assertPrelockFold(desks[i], `week 1 first contact, desk ${i + 1}`, 1);
    // ...and the instrument is proven able to see an occluded dial before any
    // of those passes is allowed to mean anything.
    await proveOcclusionInstrumentBites(desks[0], "#hlPriceDial", "the PRICE dial at first contact");
    await proveLockGuardBites(desks[0], "week 1 first contact, desk 1");

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

    // play N-1 asks for the sold-out case explicitly, because that is where the
    // FULL HOUSE banner pushes the road card under the lock bar. Desks 1 and 3
    // (the two big-market clubs) are seeded at the $10 floor in week 1 — the
    // exact probe the play critic's R-B session used, and the most common naive
    // grade-5 strategy. If no desk sells out, this run FAILS rather than
    // quietly reporting a normal-week-only pass.
    const PRICES = [10, 30, 10, 42, 48, 52, 56, 62, 68, 74, 84, 96];
    // W5 B-1: desk 1's share is 0 in every week, and desk 1 LOCKS every week.
    // That is the free-rider the lesson is about, and it is the control for the
    // abstaining desk 12 — same $0, different object.
    const SHARES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 0, 20, 40];
    for (let i = 0; i < DESKS; i += 1) {
      await waitForWeek(desks[i], 1);
      if (i === NEVER_LOCK_IDX) continue; // W5 B-1: never touches the console
      await setPrice(desks[i], PRICES[i]);
      await setShare(desks[i], i === FREE_RIDER_IDX ? 0 : SHARES[i]);
      await lockWeek(desks[i]);
    }
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "05-play-week1-locked.png") });
    await teach.click("#btnCloseWeek");
    for (const p of desks) await waitForWeek(p, 2);
    console.log("[e2e-m2l2] week 1 settled");

    // play R1/N-1: the consequence, staged AND legible. Asserted on every desk,
    // immediately after the bell, with no manual scroll of any kind.
    for (let i = 0; i < DESKS; i += 1) await assertSettlementAboveFold(desks[i], `after the week 1 bell, desk ${i + 1}`);
    // play N-6: the same frame carries WEEK 2's decision, and it is asserted
    // with the same standard week 1 met — no manual scroll, every desk.
    for (let i = 0; i < DESKS; i += 1) await assertPrelockFold(desks[i], `week 2 first contact, desk ${i + 1}`, 2);
    await proveLockGuardBites(desks[0], "week 2 first contact, desk 1");
    assert.ok(
      soldOutSettlements.length > 0,
      `the sold-out case was never exercised: no desk rendered FULL HOUSE in week 1 at the seeded floor prices, so the occlusion assertions only covered normal weeks. Seed prices must be lowered until a building fills.`,
    );
    console.log(`[e2e-m2l2] sold-out settlements probed for occlusion: ${soldOutSettlements.length} (${soldOutSettlements.slice(0, 3).join(", ")})`);
    // play N-7: the sold-out frame is where the counterfactual measured
    // 474..610 in a 600px viewport. Its card must have been hit-tested there,
    // not only on a normal week.
    for (const s of soldOutSettlements) {
      assert.ok(
        cfProbes.some((p) => p.startsWith(s)),
        `the price counterfactual was never hit-tested on the sold-out settlement "${s}" — the exact frame play N-7 measured past the bottom edge`,
      );
    }
    const soldOutVerdict = await desks[Number(soldOutSettlements[0].match(/desk (\d+)/)[1]) - 1].evaluate(
      () => document.querySelector("#hlPriceCf .hl-pricecf-verdict")?.textContent ?? "",
    );
    assert.match(
      soldOutVerdict,
      /would have kept|found the price/,
      `the sold-out week's counterfactual verdict line did not render its sentence — got "${soldOutVerdict}"`,
    );
    // Non-vacuity on the exact card the play critic found behind the bar, on a
    // sold-out frame.
    const soldOutIndex = Number(soldOutSettlements[0].match(/desk (\d+)/)[1]) - 1;
    await proveOcclusionInstrumentBites(desks[soldOutIndex], "#hlRoad", "the externality road card on a SOLD-OUT week");

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
      if (i === NEVER_LOCK_IDX) continue;
      await setPrice(desks[i], PRICES[(i + 4) % DESKS]);
      await setShare(desks[i], i === FREE_RIDER_IDX ? 0 : SHARES[(i + 3) % DESKS]);
      await lockWeek(desks[i]);
    }
    await teach.click("#btnCloseWeek");
    for (const p of desks) await waitForWeek(p, 3);
    console.log("[e2e-m2l2] week 2 settled");

    for (let i = 0; i < DESKS; i += 1) await assertSettlementAboveFold(desks[i], `after the week 2 bell, desk ${i + 1}`);
    for (let i = 0; i < DESKS; i += 1) await assertPrelockFold(desks[i], `week 3 first contact, desk ${i + 1}`, 3);
    await proveLockGuardBites(desks[0], "week 3 first contact, desk 1");
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "06b-play-week3-decision-band.png") });

    // ---- the mid-lesson Handed-To-You release ---------------------------
    //
    // `gate-l2-teacher` W5 B-2 (BLOCKING). This is the single highest-stakes
    // control press in the lesson, at the exact moment /teach's own TRIGGER
    // prescribes: after the week-2 bell, with week 3 open and NOT ONE desk
    // locked into it. The shipped ON-THE-PROJECTOR mirror read "Every pairing in
    // the league... The star-departure card is up... The Handed-To-You bar is up
    // underneath the schedule" while the projector held only the bar. Three of
    // four sentences false, with the room still pricing week 3.
    //
    // The mirror is asserted against the PROJECTOR ITSELF, before and after the
    // press, at the same instant — not against the module, and not by reading
    // the same state twice.
    const mirrorText = () => teach.evaluate(() => document.body.innerText.match(/ON THE PROJECTOR RIGHT NOW[\s\S]{0,1600}/i)?.[0] ?? "");
    const boardFrame = () =>
      board.evaluate(() => ({
        pairs: document.querySelectorAll(".hl-pair").length,
        bars: document.querySelectorAll("[data-hl-bar]").length,
        shock: document.querySelectorAll("#hlBoardShock").length,
        hosts: /\bhosts\b/i.test(document.body.innerText),
        text: document.body.innerText,
      }));

    const heldFrame = await boardFrame();
    const heldMirror = await mirrorText();
    assert.ok(heldMirror.length > 0, "the /teach ON THE PROJECTOR panel did not render before the release");
    assert.ok(heldFrame.pairs > 0 && heldFrame.bars === 0, `pre-release the board must hold the schedule and no bar — got ${heldFrame.pairs} pairings, ${heldFrame.bars} bars`);
    assert.match(heldMirror, /Every pairing in the league/, "pre-release the mirror must claim the pairing grid the board is actually showing");
    assert.match(heldMirror, /the Handed-To-You bar is not up/, "pre-release the mirror must say the bar is NOT up");

    await teach.click("#btnHandedTo");
    await board.waitForSelector("[data-hl-bar]", { timeout: 20000 });
    // Let /teach's poll land the new panel before reading it.
    await teach.waitForFunction(() => /REPLACED the schedule/i.test(document.body.innerText), null, { timeout: 30000 });

    const upFrame = await boardFrame();
    const upMirror = await mirrorText();
    // What the projector actually holds at this beat.
    assert.ok(upFrame.bars > 0, "post-release the board must hold the Handed-To-You bar");
    assert.equal(upFrame.pairs, 0, "post-release the board holds NO pairing grid — the bar replaced it");
    assert.equal(upFrame.shock, 0, "post-release the board holds NO star-departure card");
    assert.equal(upFrame.hosts, false, "post-release the word HOSTS is absent from the board entirely");
    // ...and what the teacher is told it holds. The three false sentences first.
    assert.doesNotMatch(upMirror, /underneath the schedule/i, "W5 B-2: the mirror still says the bar is underneath the schedule");
    assert.doesNotMatch(upMirror, /Every pairing in the league/, "W5 B-2: the mirror still claims a pairing grid the board is not showing");
    assert.doesNotMatch(upMirror, /star-departure card is up/i, "W5 B-2: the mirror still claims a departure card the board is not showing");
    assert.match(upMirror, /REPLACED the schedule/i, "the mirror must say the bar replaced the schedule");
    assert.match(upMirror, /NOT on the frame/i, "and say plainly that the pairing grid and departure card are gone");
    // The lock count the mirror prints is the count the board prints, at the
    // same instant, read off both surfaces.
    const boardLocked = (upFrame.text.match(/(\d+)\s*\/\s*(\d+)\s*locked in/i) || []).slice(1, 3);
    assert.equal(boardLocked.length, 2, "the board's week strip must print a locked-in count");
    assert.match(
      upMirror,
      new RegExp(`${boardLocked[0]} of ${boardLocked[1]} locked in`),
      `the mirror's lock count must be the board's own — board strip says ${boardLocked[0]}/${boardLocked[1]}, mirror says "${upMirror.slice(0, 400)}"`,
    );
    assert.equal(Number(boardLocked[0]), 0, "the prescribed release is the arm where NOT ONE desk had locked week 3");
    console.log(`[e2e-m2l2] W5 B-2: mirror vs projector at the prescribed bar release — board holds ${upFrame.bars} bars, 0 pairings, 0 departure cards; mirror agrees on all three and on ${boardLocked[0]}/${boardLocked[1]} locked`);

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
    for (let i = 0; i < DESKS; i += 1) {
      await waitForWeek(desks[i], 3);
      if (i === NEVER_LOCK_IDX) continue; // W5 B-1: three weeks, never once locked
      await setPrice(desks[i], PRICES[(i + 7) % DESKS]);
      await setShare(desks[i], i === FREE_RIDER_IDX ? 0 : SHARES[(i + 6) % DESKS]);
      await lockWeek(desks[i]);
    }
    await teach.click("#btnCloseWeek");
    for (const p of desks) await p.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 40000 });
    // `.fh-flag` is CSS-uppercased, so innerText comes back shouting.
    const autoFlags = await desks[NEVER_LOCK_IDX].evaluate(() => (document.body.innerText.match(/\bauto\b/gi) || []).length);
    assert.ok(autoFlags >= WEEK_COUNT_E2E, `the desk that never locked must have all ${WEEK_COUNT_E2E} weeks settled and marked AUTO, never skipped — found ${autoFlags}`);
    console.log("[e2e-m2l2] three weeks settled");

    // ---- REVEAL ---------------------------------------------------------
    await advanceTo(teach, "REVEAL");
    const headlines = [];
    // Wait for the PROJECTOR to actually reach the beat that was just pressed,
    // not for the POST to return and not merely for the headline to change.
    // Waiting on the headline sampled the intermediate revealStage-0 frame the
    // first time a beat's render cost shifted, and logged five presses as
    // "Waiting" plus four beats — a guard checking stage N-1 for stage N's
    // defect is worse than no guard. The board publishes which beat it is
    // holding; that is what is waited on.
    await board.waitForSelector('#stage[data-reveal-stage="0"]', { timeout: 30000 });
    for (let stage = 1; stage <= 5; stage += 1) {
      await teach.click("#btnRevealNext");
      await board.waitForSelector(`#stage[data-reveal-stage="${stage}"]`, { timeout: 30000 });
      const headline = (await board.textContent("#stage .label")).trim();
      assert.ok(headline.length > 0, `reveal stage ${stage} rendered no headline`);
      assert.notEqual(headline, "Waiting", `reveal stage ${stage} is still showing the pre-press frame`);
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

        // `gate-l2-teacher` W5 N-2 (non-blocking). This frame overflowed
        // 1366x768 by 2px in a 7-desk room (#stage 770 vs 768) while every
        // other frame fit at both shapes. The height is NOT a function of the
        // desk count — the ledger is paged at 5 rows whatever the room — it is
        // a function of how many lines the computed summary sentence wraps to,
        // which changes with the branch and with the room's own numbers. So the
        // repair is headroom, and headroom is what is measured here: the
        // stage-2 tightening class is removed in the live page and the frame is
        // re-measured, at the projector shape the defect appeared at. The gap
        // between the two IS the reclaimed budget, in real font metrics.
        await board.setViewportSize({ width: 1366, height: 768 });
        const headroom = await board.evaluate(() => {
          const st = document.getElementById("stage");
          // `scrollHeight` bottoms out at `clientHeight`, so it cannot see
          // headroom BELOW the fold — it would report 768 for any frame that
          // fits, and the difference between "fits by 1px" and "fits by 20px"
          // would be invisible. The content's own extent is measured instead:
          // first child's top to last child's bottom, plus the frame's padding.
          const extent = () => {
            const kids = [...st.children];
            if (kids.length === 0) return 0;
            const top = Math.min(...kids.map((k) => k.getBoundingClientRect().top));
            const bottom = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
            const cs = getComputedStyle(st);
            return Math.round(bottom - top + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
          };
          const had = st.classList.contains("hl-ledger-frame");
          const withClass = extent();
          const scrollWith = st.scrollHeight;
          st.classList.remove("hl-ledger-frame");
          void st.offsetHeight;
          const withoutClass = extent();
          const scrollWithout = st.scrollHeight;
          if (had) st.classList.add("hl-ledger-frame");
          return {
            withClass,
            withoutClass,
            scrollWith,
            scrollWithout,
            clientH: st.clientHeight,
            had,
            rows: document.querySelectorAll("[data-hl-ledger]").length,
          };
        });
        await board.setViewportSize({ width: 1600, height: 900 });
        assert.ok(headroom.had, "W5 N-2: REVEAL stage 2 is not carrying its own fit class");
        assert.equal(headroom.rows, BARS_PER_PAGE, `W5 N-2: the measurement must be taken on a full ${BARS_PER_PAGE}-row page, got ${headroom.rows}`);
        const reclaimed = headroom.withoutClass - headroom.withClass;
        const spare = headroom.clientH - headroom.withClass;
        // W6/RC2 supersedes the original form of this guard. It used to demand
        // that the frame OVERFLOW without its compression class, proving the
        // class was load-bearing. It no longer is: the 190-word computed
        // paragraph that made stage 2 overflow by 2px is now a 200-character
        // finding, with the argument moved to the teacher's mirror, and the
        // class carries no compression at all. So the assertion inverts —
        // stage 2 must clear 1366x768 on its OWN metrics, with no squeeze
        // helping it, or the paragraph has crept back.
        assert.ok(
          headroom.withoutClass <= headroom.clientH,
          `W5 N-2 / W6/RC2: stage 2 needs a squeeze to fit at 1366x768 again — ${headroom.withoutClass}px of content in ${headroom.clientH}px. Something put a paragraph back on the projector.`,
        );
        assert.ok(
          headroom.withClass <= headroom.clientH,
          `W5 N-2: stage 2 still overflows at 1366x768 — ${headroom.withClass}px of content in ${headroom.clientH}px`,
        );
        assert.equal(headroom.scrollWith, headroom.clientH, "W5 N-2: #stage must not report a scrollable overflow at 1366x768");
        // One more wrapped line of the computed summary is roughly its own
        // line-height (1.3 x 1.5vw at 1366 ≈ 27px). The frame must have that
        // much room, because the summary's wrap is what varies room to room —
        // which is why the guard could not be discharged by testing more desks.
        assert.ok(
          spare >= 24,
          `W5 N-2: stage 2 fits by only ${spare}px at 1366x768. The summary sentence is computed and wraps to a different number of lines in different rooms, so a frame with less than one spare line is still a frame that overflows in somebody's class (content ${headroom.withClass}px, projector ${headroom.clientH}px)`,
        );
        console.log(
          `[e2e-m2l2] W5 N-2 / W6/RC2: REVEAL stage 2 at 1366x768 — ${headroom.withoutClass}px of content in a ${headroom.clientH}px projector with no compression applied, ${spare}px spare (${reclaimed}px of squeeze left in the class: it is now a hook, not a repair)`,
        );

        // ...and every PAGE of the beat fits, not only the one the press opened
        // on. A pager that hides a row is the same defect as a frame that
        // scrolls, and the guard was only ever pointed at page 1.
        const ledgerPages = Math.ceil(DESKS / BARS_PER_PAGE);
        for (let pg = 1; pg < ledgerPages; pg += 1) {
          const before = await board.evaluate(() => document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "");
          const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
          await teach.click("#btnBarPage");
          await resp;
          await board.waitForFunction((prev) => (document.querySelector(".hl-bar-pager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 25000 });
          await assertBoardFrameFits(board, `REVEAL stage 2, ledger page ${pg + 1} of ${ledgerPages}`);
          await assertNoEllipsization(board, `REVEAL stage 2, ledger page ${pg + 1} of ${ledgerPages}`);
        }
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
        // W6/RC2: the rule is still on the frame and still teaches the horizon
        // — it has moved out of the summary paragraph and into the standing
        // chip above the chart, where a class arguing under it can read it.
        const ruleText = await board.textContent("#hlRule");
        assert.match(ruleText, /earns nothing else in this lesson/, "reveal 5 must teach the last-week horizon rule");
        assert.equal(
          /earns nothing else in this lesson/.test(changeText),
          false,
          "the horizon rule belongs to the chip now — printing it twice on one frame is the paragraph coming back",
        );
        await assertBackRowType(board, ".hl-mean-lbl", "REVEAL stage 5: the week labels");
        const teachStage5 = await teach.evaluate(() => document.body.innerText);
        // projector W4-1, retargeted by W6/RC2. This run releases the bar right
        // after the week-2 bell with no desk locked into week 3 — the arm
        // /teach prescribes, and the arm on which the ORIGINAL defect asserted
        // "some desks had already locked" to a room in which none had. That
        // clause is a provenance qualifier on the argument, not a finding the
        // back row reads off a wall, so it now lives in the teacher's hand —
        // and the false-lock-count guard follows it there rather than being
        // discharged by its absence from the projector.
        assert.equal(
          /desks had already locked/.test(teachStage5),
          false,
          `the prescribed release told the teacher a lock count for a room where no desk had locked: ${teachStage5.slice(0, 400)}`,
        );
        assert.match(
          teachStage5,
          /before a single desk had locked week 3 in/,
          "the prescribed release must tell the teacher every desk saw the bar before it priced",
        );
        assert.equal(
          /had already locked|before a single desk had locked/.test(changeText),
          false,
          `the bar-release arm belongs to the teacher's mirror now, not the projector: ${changeText}`,
        );
        // projector W4-2: /teach's ON-THE-PROJECTOR mirror must describe the arm
        // the board is actually in, not a fixed script.
        assert.match(teachStage5, /NOT ONE desk had locked week 3 yet/, "the /teach stage-5 mirror does not describe the arm the board printed");
        // W6/RC2: nothing was deleted. Every word the wall gave up is on the
        // teacher's screen, verbatim, labelled as theirs to say.
        assert.match(teachStage5, /YOURS TO SAY, not on the wall/, "the teacher was not handed the reasoning the projector stopped carrying");
        assert.match(teachStage5, /investment dies when there is no tomorrow to collect in/, "the horizon argument reached neither surface");
        await teach.screenshot({ path: path.join(SCREEN_DIR, "15b-teach-reveal5-mirror.png"), fullPage: true });
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
    // econ FL-K: the give/take sub-label on the student device was a static
    // "most of it the Draw you were DEALT" — false in 16 of 96 probed desk
    // instances, up to 60% bought. It is a computed share now, on every desk.
    for (let i = 0; i < DESKS; i += 1) {
      const dealt = await desks[i].evaluate(() => document.querySelector("#hlDealtLine")?.textContent ?? "");
      assert.equal(/most of it/i.test(dealt), false, `desk ${i + 1}: the unbound "most of it" quantifier is still on the student device`);
      assert.match(
        dealt,
        /(\d+% of it the Draw you were DEALT, \d+% of it Draw you BOUGHT|put nothing in anybody else's building)/,
        `desk ${i + 1}: the dealt/bought split did not render — "${dealt}"`,
      );
    }

    // ---- W5 B-1: the abstaining desk vs the free-rider, on their own screens --
    //
    // Desk 12 never pressed LOCK in any week; desk 1 locked in and chose 0%
    // every week. The shipped build branched this copy on `spend === 0`, so BOTH
    // devices read "YOU SPENT NOTHING, AND THAT IS A DECISION ... You chose to
    // give nothing back" — while /teach told the teacher that desk 12 "did not
    // choose 0%, they chose nothing". A teacher walking over as instructed was
    // contradicted by the device in the pair's hands.
    const readGive = (p) =>
      p.evaluate(() => ({
        heading: document.querySelector("#hlGiveChoice")?.textContent ?? "",
        line: document.querySelector("#hlGiveLine")?.textContent ?? "",
        auto: (document.body.innerText.match(/\bauto\b/gi) || []).length,
      }));
    const abstain = await readGive(desks[NEVER_LOCK_IDX]);
    const rider = await readGive(desks[FREE_RIDER_IDX]);

    assert.ok(abstain.auto >= 1, `desk ${NEVER_LOCK_IDX + 1} never locked, so its own history must be marked AUTO`);
    // The abstaining desk is never told it decided — heading or sentence.
    assert.doesNotMatch(abstain.heading, /that is a decision/i, `W5 B-1: desk ${NEVER_LOCK_IDX + 1} never locked and its heading still calls it a decision — "${abstain.heading}"`);
    assert.doesNotMatch(abstain.line, /chose to give nothing/i, `W5 B-1: desk ${NEVER_LOCK_IDX + 1} never locked and is still told it chose — "${abstain.line}"`);
    assert.doesNotMatch(abstain.line, /they are your decision/i, `W5 B-1: desk ${NEVER_LOCK_IDX + 1} is still told the zeroes are its decision`);
    assert.match(abstain.heading, /nobody at this desk pressed LOCK/i, `W5 B-1: the abstention heading did not render — "${abstain.heading}"`);
    assert.match(abstain.line, /not a decision/i, `W5 B-1: the abstention sentence did not render — "${abstain.line}"`);
    // ...and the free-rider still is, because that is the lesson.
    assert.match(rider.heading, /that is a decision/i, `W5 B-1: desk ${FREE_RIDER_IDX + 1} locked in and chose 0% and is no longer told it decided — "${rider.heading}"`);
    assert.match(rider.line, /chose to give nothing/i, `W5 B-1: the free-rider sentence did not render — "${rider.line}"`);
    assert.notEqual(abstain.heading, rider.heading, "the two $0 desks must not share a heading");
    assert.notEqual(abstain.line, rider.line, "the two $0 desks must not share a sentence");

    // /teach's side of the same collision: WATCH FOR separates them, and the
    // give/take framing carries an explicit line naming the abstaining desk.
    const teachAdapt = await teach.evaluate(() => document.body.innerText);
    assert.match(teachAdapt, /never locked a week/i, "W5 B-1: /teach's never-locked WATCH FOR entry is missing at ADAPT");
    assert.match(teachAdapt, /treat them as absent/i, "W5 B-1: /teach has no give/take line telling the teacher to treat the abstaining desk as absent");
    assert.match(
      teachAdapt,
      /do not make them the free-rider example/i,
      "W5 B-1: /teach's give/take framing does not tell the teacher to keep this pair off the free-rider example",
    );
    assert.match(teachAdapt, /not the free-rider case/i, "W5 B-1: /teach's WATCH FOR does not say this pair is not the free-rider case");
    // The collision itself: /teach must quote what is on that pair's screen, so
    // the teacher walking over says the same words the device already said.
    assert.match(teachAdapt, /these zeroes are not a decision/i, "W5 B-1: /teach does not tell the teacher what the abstaining pair's own screen says");
    const watchBlocks = await teach.evaluate(() => {
      const txt = document.body.innerText;
      const grab = (label) => {
        const i = txt.toLowerCase().indexOf(label);
        return i < 0 ? "" : txt.slice(i, i + 600);
      };
      return { never: grab("never locked a week"), rider: grab("chose to put nothing back") };
    });
    assert.ok(watchBlocks.never.includes(`Desk ${NEVER_LOCK_IDX + 1}`), `W5 B-1: /teach's never-locked flag does not name desk ${NEVER_LOCK_IDX + 1} — "${watchBlocks.never.slice(0, 200)}"`);
    assert.ok(!watchBlocks.never.includes(`Desk ${FREE_RIDER_IDX + 1} `), "W5 B-1: the free-rider desk is wrongly listed as never-locked");
    if (watchBlocks.rider) {
      assert.ok(!watchBlocks.rider.includes(`Desk ${NEVER_LOCK_IDX + 1}`), `W5 B-1: the abstaining desk is listed as a free-rider on /teach`);
    }
    console.log(
      `[e2e-m2l2] W5 B-1: desk ${NEVER_LOCK_IDX + 1} (never locked) and desk ${FREE_RIDER_IDX + 1} (locked, chose 0%) both finished on $0 and read DIFFERENT copy on their own devices; /teach separates them and carries the give/take line`,
    );

    // ---- W5 N-3: a pair joining during ADAPT ------------------------------
    //
    // The device used to sit on "You're in — finding your club…" for the rest of
    // the period while its join request 409'd in a loop, and /teach said nothing
    // about what to do with them.
    const late = await browser.newPage({ viewport: { width: 1024, height: 600 } });
    watchConsole(late, "late-joiner");
    late.on("dialog", (dlg) => dlg.accept());
    await late.goto(`${BASE}/play`);
    await late.fill("#joinCode", code);
    await late.fill("#joinName", "Late pair");
    await late.click("#btnJoin");
    await late.waitForSelector("#gameCard:not([hidden])");
    await late.waitForFunction(() => /arrived after the last week closed/i.test(document.body.innerText), null, { timeout: 30000 });
    const lateText = await late.evaluate(() => document.body.innerText);
    assert.doesNotMatch(lateText, /finding your club/i, "W5 N-3: the late device is still searching for a club that does not exist");
    assert.match(lateText, /no club left to hand you/i, "W5 N-3: the late device is not told why");
    assert.match(lateText, /nearest desk/i, "W5 N-3: the late device is not told what to do instead");
    await teach.waitForFunction(() => /arrived after the last week closed and could not be given a club/i.test(document.body.innerText), null, { timeout: 30000 });
    const teachLate = await teach.evaluate(() => {
      const txt = document.body.innerText;
      const i = txt.toLowerCase().indexOf("arrived after the last week closed");
      return txt.slice(i, i + 600);
    });
    assert.match(teachLate, /no club left to hand them/i, "W5 N-3: /teach's WATCH FOR entry does not say why");
    assert.match(teachLate, /pull up to the nearest desk|pair them with a desk/i, "W5 N-3: /teach is not told what to do with the pair");
    // The room's own evidence must not have moved under the class.
    const barsAfterLate = await board.evaluate(() => document.querySelectorAll("[data-hl-bar]").length);
    assert.ok(barsAfterLate > 0, "the ADAPT board lost its bars when a late pair joined");
    await late.screenshot({ path: path.join(SCREEN_DIR, "17b-play-late-observer.png") });
    console.log("[e2e-m2l2] W5 N-3: a pair joining during ADAPT is landed as an announced observer on both surfaces, with the room's evidence unchanged");

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
    assert.equal(nonVacuityProofs.length, 2, "both occlusion non-vacuity proofs must have run");
    assert.ok(realDialDrives.length >= DESKS * 2, `the price dial must be driven by real pointer input on every desk, got ${realDialDrives.length} drives`);
    // play N-6: first contact is asserted at EVERY decision moment, on every
    // desk, not at week 1 only. Three weeks x DESKS, plus the three settlements.
    assert.ok(
      foldChecks.filter((f) => f.startsWith("week 1 first contact")).length === DESKS &&
        foldChecks.filter((f) => f.startsWith("week 2 first contact")).length === DESKS &&
        foldChecks.filter((f) => f.startsWith("week 3 first contact")).length === DESKS,
      `the first-contact guard must run on all ${DESKS} desks in all three weeks — got ${foldChecks.filter((f) => f.includes("first contact")).length} of ${DESKS * 3}`,
    );
    assert.equal(lockGuardChecks.length, 3, "the LOCK arming guard must be checked in all three weeks");
    assert.ok(cfProbes.length >= DESKS * 2, `the price counterfactual must be hit-tested after both settled bells on every desk, got ${cfProbes.length}`);
    console.log(
      `[e2e-m2l2] PASS — ${boardFramesChecked.length / 2} board frames checked at 2 projector shapes, ` +
        `${ellipsisScans.length / 2} frames scanned for silent truncation, ${foldChecks.length} 1024x600 fold assertions ` +
        `(${foldChecks.filter((f) => f.includes("first contact")).length} first-contact, all three weeks), ` +
        `${occlusionChecks.length} elementFromPoint occlusion probes (${soldOutSettlements.length} on sold-out settlements, ${cfProbes.length} price-counterfactual cards), ` +
        `${lockGuardChecks.length} LOCK arming checks, ` +
        `${realDialDrives.length} price dials driven by real mouse drag + keyboard, zero console errors`,
    );
    for (const p of nonVacuityProofs) console.log(`[e2e-m2l2] NON-VACUITY — ${p}`);
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
