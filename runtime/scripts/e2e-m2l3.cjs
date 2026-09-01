#!/usr/bin/env node
/**
 * End-to-end proof for Module 2, Lesson 3 — "Writing the Rule" (the module finale).
 *
 * Everything runs through real Chromium pages against /teach, /play and /board,
 * the way a class would actually play it: one teacher, one projector, TWELVE
 * student devices at the classroom Chromebook shape. Twelve is not decoration —
 * the two-thirds test, the histogram and the pot rows all scale with the class,
 * and a guard that only ever sees four desks cannot fail at the size the fit
 * defects appear.
 *
 * Run from runtime/: `node scripts/e2e-m2l3.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * The whole arc is played: LOBBY -> HOOK (Boston commit-then-reveal) -> PLAY
 * (three offer rounds, the two-thirds test, three season weeks) -> REVEAL (five
 * staged beats) -> CONSEQUENCE -> COUNTERFACTUAL -> ARGUE (the Kings 22-8
 * capstone) -> SYNTHESIS (every finale card) -> COMPLETE.
 *
 * Asserted along the way:
 *   - EVERY board frame FITS at 1366x768 AND 1920x1080, with no scrolling.
 *     A projector cannot scroll, so overflow is a failure, not a nuisance.
 *   - no board frame silently truncates text (declared ellipsis or clipped box);
 *   - the evidence tier clears the 2.6%-of-screen-height back-row floor;
 *   - FIRST CONTACT at 1024x600, on every desk, at every decision moment: the
 *     decision set is unoccluded by hit test, never merely inside the box;
 *   - the occlusion instrument is proven able to see a defect before any of its
 *     passes is allowed to mean anything (non-vacuity by poisoning a live frame);
 *   - BC-6 fix 4: the histogram is ABSENT from board and desk during round 1 and
 *     present after it closes;
 *   - BC-6 fix 2: the voter's own club and market size are on the proposal
 *     screen, before round 1;
 *   - BC-6 fix 3: a paid-in / took-out / net column is on the desk's own screen;
 *   - BC-1: the board's arrow frame carries a moved arrow AND a flat one;
 *   - no board frame at any phase carries a seat identity;
 *   - the week bell auto-commits a desk that never locked;
 *   - the capstone reveals 22-8 and the finale pages every card;
 *   - zero console errors on every surface.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const PORT = 4309;
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-m2l3-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l3");
const DESKS = 12;

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
const privacyScans = [];

async function assertFullyVisible(page, selector, label) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return { found: true, top: r.top, bottom: r.bottom, left: r.left, right: r.right, vh: window.innerHeight, vw: window.innerWidth, text: (el.textContent || "").slice(0, 60) };
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
 * Two limbs, because there are two ways to lose text without overflowing:
 *   (a) any element that DECLARES `text-overflow: ellipsis`;
 *   (b) any element that clips its own content horizontally.
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
          out.push({ why: `clipped horizontally: scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`, cls: el.className || el.tagName, text: text.slice(0, 46) });
        }
      }
      return out;
    });
    assert.equal(
      offenders.length,
      0,
      `${label} @ ${shape.width}x${shape.height}: the projector is silently truncating text the room needs to read —\n  ${offenders.map((o) => `${o.cls}: "${o.text}" (${o.why})`).join("\n  ")}`,
    );
    ellipsisScans.push(`${label}@${shape.width}`);
  }
  await board.setViewportSize({ width: 1600, height: 900 });
  await board.waitForTimeout(150);
}

/**
 * NO SILENT OVERLAP ON THE BOARD.
 *
 * The sibling defect to silent truncation, and the one the truncation guard
 * cannot see: a `white-space: nowrap` cell in a column that is too narrow does
 * not clip and does not overflow its container — it simply draws on top of the
 * cell beside it. The projector screenshots caught "SMALL MARKET" printed
 * through "PRICE $60", which every geometric guard in this file passed. This
 * hit-tests every table row's cells against each other.
 */
async function assertNoOverlap(board, label) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(240);
    const offenders = await board.evaluate(() => {
      const out = [];
      for (const row of document.querySelectorAll(".wr-board-row")) {
        const cells = [...row.children].filter((c) => (c.textContent || "").trim().length > 0);
        for (let i = 0; i + 1 < cells.length; i += 1) {
          const a = cells[i].getBoundingClientRect();
          const b = cells[i + 1].getBoundingClientRect();
          // A cell's INK, not its box: a right-aligned cell legitimately has
          // slack, so measure the text itself with a range.
          const inkRight = (el) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            const rect = r.getBoundingClientRect();
            return rect.width > 0 ? rect.right : el.getBoundingClientRect().right;
          };
          const inkLeft = (el) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            const rect = r.getBoundingClientRect();
            return rect.width > 0 ? rect.left : el.getBoundingClientRect().left;
          };
          if (inkRight(cells[i]) > inkLeft(cells[i + 1]) + 1) {
            out.push({
              left: (cells[i].textContent || "").trim().slice(0, 30),
              right: (cells[i + 1].textContent || "").trim().slice(0, 30),
              by: Math.round(inkRight(cells[i]) - inkLeft(cells[i + 1])),
              boxes: `${Math.round(a.left)}..${Math.round(a.right)} vs ${Math.round(b.left)}..${Math.round(b.right)}`,
            });
          }
        }
      }
      return out;
    });
    assert.equal(
      offenders.length,
      0,
      `${label} @ ${shape.width}x${shape.height}: the projector is printing one cell on top of another —\n  ${offenders
        .map((o) => `"${o.left}" overlaps "${o.right}" by ${o.by}px (${o.boxes})`)
        .join("\n  ")}`,
    );
  }
  await board.setViewportSize({ width: 1600, height: 900 });
  await board.waitForTimeout(150);
}

/** The projector may never be handed a seat identity, at any phase. */
async function assertBoardPrivacy(board, label) {
  const text = await board.evaluate(() => document.body.innerHTML);
  assert.equal(/seat-\d/.test(text), false, `${label}: a seat id reached the projector`);
  assert.equal(/Pair \d/.test(text), false, `${label}: a student-device handle reached the projector`);
  privacyScans.push(label);
}

/* ------------------------------------------------------ the occlusion -- */

/**
 * THE OCCLUSION INSTRUMENT.
 *
 * Geometry cannot see a z-index defect: a box can measure perfectly inside the
 * viewport and be entirely behind an opaque fixed bar. This probes what the
 * pair's finger would hit. For each named element it takes three points inside
 * the element's own box — centre, lower third, and an inset top-left corner —
 * and requires `document.elementFromPoint` to return that element or something
 * inside it. "In the box" is not accepted as "in the field of view".
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
      assert.ok(p.inViewport, `${label}: ${r.name} has a probe point OFF SCREEN at ${p.at} (${p.x},${p.y}) — box ${r.rect.top}..${r.rect.bottom} in a ${r.vh}px viewport`);
      assert.ok(
        p.top,
        `${label}: ${r.name} is OCCLUDED at its ${p.at} (${p.x},${p.y}) — the top element there is ${p.hit}, not ${r.sel}. Box ${r.rect.top}..${r.rect.bottom} in a ${r.vh}px viewport.`,
      );
    }
    occlusionChecks.push(`${label}: ${r.name}`);
  }
}

/**
 * NON-VACUITY, proven on a live frame in this run rather than argued.
 *
 * The pinned commit bar is temporarily grown in memory until it covers the
 * target, the SAME probe is re-run, and the run fails if the probe still
 * reports the target as the top element. Then the bar is restored and the
 * honest probe is re-asserted, so the proof cannot leave the page poisoned.
 */
async function proveOcclusionInstrumentBites(desk, sel, name) {
  const before = await probeOcclusion(desk, [{ sel, name }]);
  assertUnoccluded(before, `non-vacuity baseline for ${name}`);
  const grew = await desk.evaluate((s) => {
    const bar = document.getElementById("wrLockBar");
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
    const bar = document.getElementById("wrLockBar");
    if (bar) {
      bar.style.height = bar.dataset.e2ePrevHeight || "";
      delete bar.dataset.e2ePrevHeight;
    }
  });
  assert.equal(
    stillTop.length,
    0,
    `NON-VACUITY FAILED: with the commit bar deliberately raised over ${name}, the occlusion probe still reported it as the top element at ${stillTop.join(", ")}. The instrument cannot see the defect it exists to catch.`,
  );
  const after = await probeOcclusion(desk, [{ sel, name }]);
  assertUnoccluded(after, `non-vacuity restore for ${name}`);
  nonVacuityProofs.push(`${name}: poisoned frame caught at all ${poisoned[0].probes.length} probe points`);
}

/**
 * FIRST CONTACT on the rule-writing screen, at 1024x600, with no manual scroll.
 *
 * The decision set here is the SHARE dial, the CONDITION control and the commit
 * button — plus, per BC-6 fix 2, the voter's own club identity, which Stage-0
 * hid behind a veil for the entire vote and which the play review named as one
 * of the three defects that capped that loop at FUNCTIONAL.
 */
async function assertRoundsFirstContact(desk, label) {
  const targets = [
    { sel: "#wrShareDial", name: "the SHARE dial" },
    { sel: "#wrCondition", name: "the CONDITION control" },
    { sel: "#wrPropose", name: "PUT IT IN" },
    { sel: "#wrVeil", name: "the veil announcement" },
  ];
  assertUnoccluded(await probeOcclusion(desk, targets), label);
  const m = await desk.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), text: (el.textContent || "").trim().slice(0, 60) };
    };
    const bar = document.querySelector("#wrLockBar");
    const band = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    const inBand = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= -1 && r.bottom <= band + 1 && r.width > 0 && r.height > 0;
    };
    return {
      vh: window.innerHeight,
      dialInBand: inBand("#wrShareDial"),
      conditionInBand: inBand("#wrCondition"),
      submit: box("#wrPropose"),
      submitDisabled: !!document.querySelector("#wrPropose")?.disabled,
      liveDecisionControlsInBand: [...document.querySelectorAll("#wrRoundsRoot input, #wrRoundsRoot button")].filter((el) => {
        if (el.disabled) return false;
        const r = el.getBoundingClientRect();
        return r.top >= -1 && r.bottom <= band + 1 && r.width > 0 && r.height > 0;
      }).length,
      // BC-6 fix 2: the voter's club identity must be on screen WHILE voting.
      identity: (document.querySelector("#wrRoundsRoot .fh-market-facts")?.textContent || "").trim(),
    };
  });
  assert.equal(m.vh, 600, `${label}: the fold guard must run at the 1024x600 classroom shape`);
  assert.ok(m.dialInBand, `${label}: the SHARE dial is outside the content band at the moment of decision`);
  assert.ok(m.conditionInBand, `${label}: the CONDITION control is outside the content band at the moment of decision`);
  assert.ok(m.submit && m.submit.bottom <= m.vh + 1, `${label}: PUT IT IN is below the fold`);
  assert.ok(
    m.liveDecisionControlsInBand >= 2,
    `${label}: only ${m.liveDecisionControlsInBand} live DECISION control(s) in the visible band — the commit button must never be the only thing the pair can press`,
  );
  assert.ok(m.identity.length > 0, `${label}: BC-6 fix 2 — the voter's own club is not on the proposal screen`);
  assert.match(m.identity, /(BIG MARKET|SMALL MARKET)/, `${label}: the voter's market size is not on the proposal screen — got "${m.identity}"`);
  foldChecks.push(label);
}

/** FIRST CONTACT on a season week: both dials, the visitor, the schedule strip, LOCK. */
async function assertSeasonFirstContact(desk, label, weekNumber) {
  const hasRookie = await desk.evaluate(() => !!document.querySelector("#wrRookie"));
  const targets = [
    { sel: "#wrPriceDial", name: "the PRICE dial" },
    { sel: "#wrReinvestUp", name: "the REINVEST stepper (+)" },
    { sel: "#wrReinvestDown", name: "the REINVEST stepper (-)" },
    { sel: "#wrLock", name: "LOCK IT IN" },
    { sel: "#wrWeekCard .hl-matchup", name: "who is visiting you" },
    { sel: "#wrPlayRoot .hl-slate-block", name: "the three-week schedule strip" },
    { sel: "#wrRuleStrip", name: "the rule in force" },
  ];
  if (hasRookie) targets.push({ sel: "#wrRookie", name: "the rookie card" });
  assertUnoccluded(await probeOcclusion(desk, targets), label);
  const m = await desk.evaluate(() => {
    const bar = document.querySelector("#wrLockBar");
    const band = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    const inBand = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= -1 && r.bottom <= band + 1 && r.width > 0 && r.height > 0;
    };
    const lock = document.querySelector("#wrLock");
    return {
      vh: window.innerHeight,
      weekNum: (document.querySelector(".hl-week-num")?.textContent ?? "").trim(),
      dialInBand: inBand("#wrPriceDial"),
      reinvestInBand: inBand("#wrReinvestUp") && inBand("#wrReinvestDown"),
      lockBottom: lock ? Math.round(lock.getBoundingClientRect().bottom) : null,
      lockDisabled: !!lock?.disabled,
      rowCount: document.querySelectorAll("#wrPlayRoot .hl-slate-block .fh-slate-row").length,
      openRowVisible: (() => {
        const el = document.querySelector("#wrPlayRoot .hl-slate-block .fh-slate-row.hl-open-week");
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top >= -1 && r.bottom <= window.innerHeight + 1;
      })(),
      liveDecisionControlsInBand: [...document.querySelectorAll("#wrPlayRoot input, #wrPlayRoot button")].filter((el) => {
        if (el.disabled) return false;
        const r = el.getBoundingClientRect();
        return r.top >= -1 && r.bottom <= band + 1 && r.width > 0 && r.height > 0;
      }).length,
    };
  });
  assert.equal(m.vh, 600, `${label}: the fold guard must run at the 1024x600 classroom shape`);
  assert.ok(m.weekNum.includes(`Week ${weekNumber} of`), `${label}: the week header does not name week ${weekNumber} — got "${m.weekNum}"`);
  assert.ok(m.dialInBand, `${label}: the PRICE dial is outside the content band at the moment of decision`);
  assert.ok(m.reinvestInBand, `${label}: a REINVEST stepper is outside the content band at the moment of decision`);
  assert.ok(m.lockBottom !== null && m.lockBottom <= m.vh + 1, `${label}: LOCK IT IN is below the fold — bottom ${m.lockBottom}`);
  assert.ok(m.rowCount >= 2, `${label}: the schedule strip is not open on first contact (${m.rowCount} rows)`);
  assert.ok(m.openRowVisible, `${label}: the schedule strip's CURRENT week row is not visible without scrolling`);
  assert.ok(
    (m.dialInBand && m.reinvestInBand) || m.lockDisabled,
    `${label}: LOCK IT IN is armed while the dials are outside the band — the house-price/0% default is committable blind`,
  );
  assert.ok(m.liveDecisionControlsInBand >= 2, `${label}: only ${m.liveDecisionControlsInBand} live DECISION control(s) in the band`);
  foldChecks.push(label);
}

/* --------------------------------------------------------- UI helpers -- */

/**
 * A dial, driven the way a pair drives it: a real pointer drag to land near the
 * target, then arrow keys to the exact legal step. A programmatic `el.value = x`
 * works on a control that is off screen, behind an opaque bar, or zero-sized. A
 * real pointer press does not — Playwright's mouse dispatches at viewport
 * coordinates, so it hits whatever is actually on top.
 */
async function driveDial(page, selector, readoutSel, target, renderReadout) {
  // The 1.5s poll can re-mount this surface at any moment, which detaches the
  // handle mid-gesture. That is a harness race, not a product defect, so the
  // GESTURE is retried — never replaced by a programmatic `el.value = x`, which
  // would work on a control that is off screen or behind a bar and would make
  // the reachability assertions below vacuous.
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.waitForSelector(selector);
      const handle = await page.$(selector);
      await handle.scrollIntoViewIfNeeded();
      const dial = await page.$eval(selector, (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, min: Number(el.min), max: Number(el.max) };
      });
      assert.ok(dial.w > 40 && dial.h > 8, `${selector} is not a reachable control: ${dial.w}x${dial.h}`);
      const frac = (target - dial.min) / (dial.max - dial.min);
      const thumb = 11;
      const targetX = dial.x + thumb + frac * (dial.w - thumb * 2);
      const cy = dial.y + dial.h / 2;
      const topAt = await page.evaluate(
        ({ x, y, sel }) => {
          const el = document.querySelector(sel);
          const hit = document.elementFromPoint(x, y);
          return { ok: !!hit && (hit === el || el.contains(hit)), hit: hit ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ""}` : "nothing" };
        },
        { x: dial.x + dial.w / 2, y: cy, sel: selector },
      );
      assert.ok(topAt.ok, `${selector} cannot be pressed: the top element at its centre is ${topAt.hit}`);
      await page.mouse.move(dial.x + dial.w / 2, cy);
      await page.mouse.down();
      await page.mouse.move(targetX, cy, { steps: 6 });
      await page.mouse.up();
      break;
    } catch (e) {
      if (attempt >= 3 || !/not attached|detached|Element is not/i.test(String(e && e.message))) throw e;
      await page.waitForTimeout(400);
    }
  }
  // The poll can re-mount this surface between presses (a proposal landing on
  // the server changes the mount key), which silently drops keyboard focus. So
  // the control is re-focused on every step rather than once: the presses stay
  // real input events, and a re-render costs a retry instead of the run.
  for (let i = 0; i < 120; i += 1) {
    const cur = Number(await page.$eval(selector, (el) => el.value));
    if (cur === target) break;
    await page.focus(selector);
    await page.keyboard.press(cur < target ? "ArrowRight" : "ArrowLeft");
  }
  try {
    await page.waitForFunction(
      ({ sel, want }) => document.querySelector(sel)?.textContent === want,
      { sel: readoutSel, want: renderReadout(target) },
      { timeout: 15000 },
    );
  } catch (e) {
    const got = await page.evaluate((sel) => ({ readout: document.querySelector(sel)?.textContent ?? "MISSING", url: location.href }), readoutSel);
    const val = await page.evaluate((sel) => document.querySelector(sel)?.value ?? "MISSING", selector);
    throw new Error(`driveDial(${selector} -> ${target}): readout ${readoutSel} says "${got.readout}", control value "${val}", wanted "${renderReadout(target)}"`);
  }
  realDialDrives.push(`${selector}=${target}`);
}

async function stepReinvest(page, target) {
  const cur = Number((await page.$eval("#wrReinvestReadout", (el) => el.textContent)).replace("%", ""));
  const clicks = Math.abs(target - cur) / 5;
  for (let i = 0; i < clicks; i += 1) await page.click(target > cur ? "#wrReinvestUp" : "#wrReinvestDown");
  await page.waitForFunction((t) => document.getElementById("wrReinvestReadout")?.textContent === `${t}%`, target, { timeout: 15000 });
}

/**
 * Page the finale, and prove the press LANDED.
 *
 * A control press can be lost to a re-render or to a version conflict; a run
 * that then waits forever reports a timeout instead of the thing that actually
 * happened. This retries the press and fails with the page the projector is
 * really on.
 */
async function pageSynth(teach, board, wantPage, button = "#btnSynthPage") {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST").catch(() => null);
    await teach.click(button);
    await resp;
    try {
      // `.fh-synth-pager` is CSS-uppercased, so innerText comes back shouting.
      await board.waitForFunction((p) => new RegExp(`Card ${p} of`, "i").test(document.body.innerText), wantPage, { timeout: 8000 });
      return;
    } catch {
      /* the press did not land — try again */
    }
  }
  const now = await board.evaluate(() => (document.querySelector(".fh-synth-pager")?.textContent ?? "").trim());
  throw new Error(`the finale would not page to card ${wantPage} after four presses of ${button} — the projector is on "${now}"`);
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
  let teach = null;
  let board = null;
  try {
    await waitForServer();

    teach = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    board = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    watchConsole(teach, "teach");
    watchConsole(board, "board");
    teach.on("dialog", (d) => d.accept());

    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l3-write-rule");
    await teach.fill("#title", "E2E M2 L3 twelve-desk class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    console.log(`[e2e-m2l3] session ${code}`);

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
    console.log(`[e2e-m2l3] ${DESKS} pairs joined`);

    await board.waitForFunction((n) => document.querySelectorAll(".hl-club-chip.live").length >= n, DESKS, { timeout: 30000 });
    await assertBoardFrameFits(board, "LOBBY");
    await assertNoEllipsization(board, "LOBBY");
    await assertBoardPrivacy(board, "LOBBY");
    await board.screenshot({ path: path.join(SCREEN_DIR, "01-board-lobby.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "02-play-lobby.png") });

    // ---- HOOK: Boston, commit then reveal --------------------------------
    await advanceTo(teach, "HOOK");
    // Wait on the HOOK frame's own element, never on a loose text match: the
    // LOBBY frame lists a club called Boston, so /BOSTON/i is satisfied by the
    // frame we are trying to leave.
    await board.waitForSelector("#wrBoardHook", { timeout: 30000 });
    const hookText = await board.evaluate(() => document.body.innerText);
    assert.match(hookText, /June 2025/, "the HOOK's real position must carry its season stamp on the board");
    assert.equal(/24 hours|Holiday|Porzingis/.test(hookText), false, "the board leaked what Boston did before the reveal");
    await assertFullyVisible(board, "#wrBoardHook", "HOOK: Boston's position");
    await assertBackRowType(board, "#wrBoardHook", "HOOK: Boston's position");
    await assertBoardFrameFits(board, "HOOK (held)");
    await assertNoEllipsization(board, "HOOK (held)");
    await assertBoardPrivacy(board, "HOOK");
    await board.screenshot({ path: path.join(SCREEN_DIR, "03-board-hook.png") });

    for (let i = 0; i < DESKS; i += 1) {
      await desks[i].waitForSelector("#wrHookPay");
      await desks[i].click(i % 3 === 0 ? "#wrHookPay" : "#wrHookBreak");
    }
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "04-play-hook.png") });
    await teach.click("#btnCommitReveal");
    await board.waitForSelector("#wrBoardHookReveal", { timeout: 25000 });
    const revealText = await board.textContent("#wrBoardHookReveal");
    assert.match(revealText, /Holiday/, "the reveal must name what Boston actually did");
    assert.match(revealText, /Harden/, "the counter-case must land in the same breath (R15)");
    await assertBackRowType(board, "#wrBoardHookSplit", "HOOK: the room's split");
    await assertBoardFrameFits(board, "HOOK (revealed)");
    await assertNoEllipsization(board, "HOOK (revealed)");
    await board.screenshot({ path: path.join(SCREEN_DIR, "05-board-hook-reveal.png") });

    // ---- PLAY: three offer rounds ----------------------------------------
    await advanceTo(teach, "PLAY");
    for (const p of desks) await p.waitForSelector("#wrRoundsRoot", { timeout: 40000 });

    // BC-6 fix 4 — the histogram is WITHHELD until round 1 has closed.
    const heldBoard = await board.evaluate(() => ({ held: !!document.querySelector("#wrBoardHeld"), hist: document.querySelectorAll(".wr-board-histbar").length }));
    assert.equal(heldBoard.held, true, "round 1 must be blind on the projector");
    assert.equal(heldBoard.hist, 0, "the projector showed a histogram during round 1 — the anti-herding rule is not implemented");
    const heldDesk = await desks[0].evaluate(() => document.querySelector("#wrHistogram")?.textContent ?? "");
    assert.match(heldDesk, /blind on purpose/, "the desk must say the histogram is being held, not just omit it");
    await assertBoardFrameFits(board, "PLAY round 1 (histogram held)");
    await assertNoEllipsization(board, "PLAY round 1");
    await assertBoardPrivacy(board, "PLAY round 1");
    await board.screenshot({ path: path.join(SCREEN_DIR, "06-board-round1-held.png") });

    // First contact on the rule-writing screen, every desk, no manual scroll.
    for (let i = 0; i < DESKS; i += 1) await assertRoundsFirstContact(desks[i], `round 1 first contact, desk ${i + 1}`);
    await proveOcclusionInstrumentBites(desks[0], "#wrShareDial", "the SHARE dial at first contact");

    // A room that trades: big markets low, small markets high, converging.
    const ROUND_SHARES = [
      [0, 10, 45, 55, 50, 5, 60, 10, 45, 5, 50, 15],
      [10, 20, 40, 45, 40, 15, 50, 20, 40, 15, 45, 20],
      [25, 25, 35, 35, 30, 25, 35, 25, 30, 25, 30, 25],
    ];
    for (let round = 0; round < 3; round += 1) {
      for (let i = 0; i < DESKS; i += 1) {
        await desks[i].waitForSelector("#wrShareDial", { timeout: 30000 });
        await driveDial(desks[i], "#wrShareDial", "#wrShareReadout", ROUND_SHARES[round][i], (v) => `${v}%`);
        if (i % 2 === 0) await desks[i].click("#wrCondition");
        await desks[i].click("#wrPropose");
      }
      if (round === 0) await desks[0].screenshot({ path: path.join(SCREEN_DIR, "07-play-round1.png") });
      // The pacing control names what the NEXT press does, so it is the honest
      // thing to wait on: after round 3 there is no "round 4" frame to look for.
      const want = round < 2 ? `Close round ${round + 2} of 3` : "Run the two-thirds test";
      await teach.click("#btnRuleStep");
      await teach.waitForFunction((w) => (document.getElementById("btnRuleStep")?.textContent ?? "").includes(w), want, { timeout: 25000 });
      if (round === 0) {
        // ...and now the histogram is up, anonymous and unsorted.
        await board.waitForSelector(".wr-board-histbar", { timeout: 20000 });
        const hist = await board.evaluate(() => ({
          bars: document.querySelectorAll(".wr-board-histbar").length,
          text: document.body.innerText,
        }));
        assert.ok(hist.bars > 0, "the histogram did not appear after round 1 closed");
        assert.equal(/Desk \d/.test(hist.text), false, "the histogram named a desk");
        assert.equal(/\$/.test(hist.text), false, "the histogram carried money");
        await assertBackRowType(board, ".wr-board-median", "ROUNDS: the running middle number");
        await assertBoardFrameFits(board, "PLAY round 2 (histogram up)");
        await assertNoEllipsization(board, "PLAY round 2");
        await assertBoardPrivacy(board, "PLAY round 2");
        await board.screenshot({ path: path.join(SCREEN_DIR, "08-board-round2-histogram.png") });
        for (let i = 0; i < 3; i += 1) await assertRoundsFirstContact(desks[i], `round 2 first contact, desk ${i + 1}`);
      }
    }

    // ---- the two-thirds test --------------------------------------------
    await teach.click("#btnRuleStep");
    await board.waitForSelector("#wrBoardAdoption", { timeout: 25000 });
    const adoption = await board.textContent("#wrBoardAdoption");
    assert.match(adoption, /ADOPTED|old rule holds/, `the adoption frame said nothing decisive: "${adoption}"`);
    assert.match(adoption, /SHARE \d+%/, "the adopted share is not printed");
    assert.match(adoption, /CONDITION (ON|OFF)/, "the adopted condition is not printed — BC-6 fix 1 requires it to be a real adopted decision");
    await assertFullyVisible(board, "#wrBoardAdoption", "ADOPTION: the rule");
    await assertBackRowType(board, "#wrBoardAdoption", "ADOPTION: the rule");
    await assertBoardFrameFits(board, "PLAY adoption");
    await assertNoEllipsization(board, "PLAY adoption");
    await assertBoardPrivacy(board, "PLAY adoption");
    await board.screenshot({ path: path.join(SCREEN_DIR, "09-board-adoption.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "10-play-adoption.png") });
    console.log(`[e2e-m2l3] adopted: ${adoption.trim()}`);

    // ---- the season ------------------------------------------------------
    await teach.click("#btnRuleStep");
    for (const p of desks) await p.waitForSelector("#wrPlayRoot", { timeout: 40000 });

    // The pre-lock screen carries no outcome of any kind.
    const preLock = await desks[0].evaluate(() => ({ result: !!document.querySelector("#wrResult"), text: document.body.innerText }));
    assert.equal(preLock.result, false, "the pre-lock screen showed a settled week");
    assert.match(preLock.text, /No preview/, "the pre-lock screen must say there is no preview");

    for (let i = 0; i < DESKS; i += 1) await assertSeasonFirstContact(desks[i], `week 1 first contact, desk ${i + 1}`, 1);
    await proveOcclusionInstrumentBites(desks[0], "#wrPriceDial", "the PRICE dial on a season week");
    await assertBoardFrameFits(board, "PLAY week 1");
    await assertNoEllipsization(board, "PLAY week 1");
    await assertNoOverlap(board, "PLAY week 1");
    await assertBoardPrivacy(board, "PLAY week 1");
    await board.screenshot({ path: path.join(SCREEN_DIR, "11-board-week1.png") });

    const PRICES = [56, 44, 58, 46, 42, 60, 40, 54, 48, 62, 44, 52];
    const REINVESTS = [0, 40, 10, 35, 25, 5, 20, 15, 30, 10, 40, 0];
    // Desk 12 deliberately never locks in week 1: the bell must auto-commit it.
    for (let i = 0; i < DESKS - 1; i += 1) {
      await driveDial(desks[i], "#wrPriceDial", "#wrPriceReadout", PRICES[i], (v) => `$${v}`);
      await stepReinvest(desks[i], REINVESTS[i]);
      await desks[i].click("#wrLock");
      await desks[i].waitForSelector(".fh-locked-recap", { timeout: 20000 });
    }
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "12-play-week1-locked.png") });
    await teach.click("#btnCloseWeek");
    for (const p of desks) await p.waitForFunction(() => /Week 2 of/.test(document.querySelector(".hl-week-num")?.textContent ?? ""), null, { timeout: 30000 });
    console.log("[e2e-m2l3] week 1 settled");

    // The desk that never locked settles AUTO, and says so on its own screen.
    const autoText = await desks[DESKS - 1].evaluate(() => document.querySelector("#wrResult .hl-split-title")?.textContent ?? "");
    assert.match(autoText, /AUTO/, "the desk that never locked was not marked AUTO on its own screen");

    // BC-6 fix 3: the paid-in / took-out / net column, on the desk's own device,
    // reachable without scrolling and not behind the commit bar.
    for (let i = 0; i < DESKS; i += 1) {
      const t = await desks[i].evaluate(() => ({
        paid: document.querySelector("#wrTransfer [data-wr-paid]")?.textContent ?? "",
        took: document.querySelector("#wrTransfer [data-wr-took]")?.textContent ?? "",
        net: document.querySelector("#wrTransfer [data-wr-net]")?.textContent ?? "",
        line: document.querySelector("#wrTransfer .hl-give-note")?.textContent ?? "",
      }));
      assert.match(t.paid, /^-?\$[\d,]+$/, `desk ${i + 1}: no paid-in figure in the transfer column`);
      assert.match(t.took, /^-?\$[\d,]+$/, `desk ${i + 1}: no took-out figure in the transfer column`);
      assert.match(t.net, /^-?\$[\d,]+$/, `desk ${i + 1}: no net figure in the transfer column`);
      assert.match(t.line, /own two dials/, `desk ${i + 1}: the transfer column does not separate the pot from the club's own dials`);
    }
    assertUnoccluded(
      await probeOcclusion(desks[0], [
        { sel: "#wrTransfer", name: "the paid-in / took-out column (BC-6 fix 3)" },
        { sel: "#wrResult", name: "the week's settlement" },
      ]),
      "after the week 1 bell, desk 1",
    );
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "13-play-week1-result.png") });

    // Week 2 — the rookie lands.
    await board.waitForSelector("#wrBoardRookie", { timeout: 25000 });
    const rookie = await board.textContent("#wrBoardRookie");
    assert.match(rookie, /ROOKIE LANDED AT/, "the rookie card is not on the projector before week 2 is priced");
    assert.match(rookie, /lottery/i, "the rookie card must say plainly that this is NOT how the real league does it (SR C-1)");
    await assertFullyVisible(board, "#wrBoardRookie", "week 2: the rookie card");
    await assertBackRowType(board, "#wrBoardRookie", "week 2: the rookie card");
    await assertBoardFrameFits(board, "PLAY week 2 (rookie)");
    await assertNoEllipsization(board, "PLAY week 2");
    await board.screenshot({ path: path.join(SCREEN_DIR, "14-board-week2-rookie.png") });

    for (let week = 2; week <= 3; week += 1) {
      for (let i = 0; i < DESKS; i += 1) await assertSeasonFirstContact(desks[i], `week ${week} first contact, desk ${i + 1}`, week);
      for (let i = 0; i < DESKS; i += 1) {
        await driveDial(desks[i], "#wrPriceDial", "#wrPriceReadout", PRICES[(i + week) % DESKS], (v) => `$${v}`);
        await stepReinvest(desks[i], REINVESTS[(i + week) % DESKS]);
        await desks[i].click("#wrLock");
        await desks[i].waitForSelector(".fh-locked-recap", { timeout: 20000 });
      }
      await teach.click("#btnCloseWeek");
      if (week < 3) {
        for (const p of desks) await p.waitForFunction((w) => new RegExp(`Week ${w} of`).test(document.querySelector(".hl-week-num")?.textContent ?? ""), week + 1, { timeout: 30000 });
      }
      console.log(`[e2e-m2l3] week ${week} settled`);
    }

    // ---- REVEAL: five staged beats --------------------------------------
    await advanceTo(teach, "REVEAL");
    await board.waitForFunction(() => /HOLDING|STAGE/i.test(document.body.innerText), null, { timeout: 25000 });
    let arrowFrameSeen = false;
    let potFrameSeen = false;
    let eraFrameSeen = false;
    for (let stage = 1; stage <= 5; stage += 1) {
      await teach.click("#btnRevealNext");
      await board.waitForFunction((s) => new RegExp(`Stage ${s} of`).test(document.body.innerText), stage, { timeout: 25000 });
      await assertFullyVisible(board, "#wrBoardHeadline", `REVEAL stage ${stage}: the headline`);
      await assertBackRowType(board, "#wrBoardHeadline", `REVEAL stage ${stage}: the headline`);
      if (stage === 3) {
        const potRows = await board.evaluate(() => document.querySelectorAll("[data-wr-pot]").length);
        assert.equal(potRows, DESKS, `REVEAL stage ${stage}: ${potRows} pot rows for ${DESKS} desks`);
        await assertBackRowType(board, "[data-wr-pot] .wr-board-handle", `REVEAL stage ${stage}: a pot row handle`);
        potFrameSeen = true;
      }
      if (stage === 4) {
        // BC-1 on the projector: a moved arrow standing beside a flat one.
        const arrows = await board.evaluate(() => [...document.querySelectorAll("[data-wr-arrow]")].map((r) => r.textContent));
        assert.equal(arrows.length, DESKS, `REVEAL stage ${stage}: ${arrows.length} arrow rows for ${DESKS} desks`);
        const moved = await board.evaluate(() => document.querySelectorAll("[data-wr-arrow] .wr-board-arrow.moved").length);
        const flat = await board.evaluate(() => document.querySelectorAll("[data-wr-arrow] .wr-board-arrow.flat").length);
        assert.ok(moved > 0, "BC-1: no arrow moved on the reveal frame");
        assert.ok(flat > 0, "BC-1: no arrow held flat on the reveal frame — the 'why didn't New York move?' beat is missing");
        arrowFrameSeen = true;
      }
      if (stage === 5) {
        const eraRows = await board.evaluate(() => document.querySelectorAll("[data-wr-era]").length);
        assert.equal(eraRows, DESKS, `REVEAL stage ${stage}: ${eraRows} before/after rows for ${DESKS} desks`);
        eraFrameSeen = true;
      }
      await assertBoardFrameFits(board, `REVEAL stage ${stage}`);
      await assertNoEllipsization(board, `REVEAL stage ${stage}`);
      await assertNoOverlap(board, `REVEAL stage ${stage}`);
      await assertBoardPrivacy(board, `REVEAL stage ${stage}`);
      await board.screenshot({ path: path.join(SCREEN_DIR, `15-board-reveal-${stage}.png`) });
    }
    assert.ok(potFrameSeen && arrowFrameSeen && eraFrameSeen, "a staged reveal beat never rendered its own evidence");

    // ---- CONSEQUENCE -----------------------------------------------------
    await advanceTo(teach, "CONSEQUENCE");
    await board.waitForSelector("#wrBoardEra", { timeout: 25000 });
    await assertBackRowType(board, "#wrBoardEra", "CONSEQUENCE: the effort line");
    await assertBoardFrameFits(board, "CONSEQUENCE");
    await assertNoEllipsization(board, "CONSEQUENCE");
    await assertNoOverlap(board, "CONSEQUENCE");
    await assertBoardPrivacy(board, "CONSEQUENCE");
    await board.screenshot({ path: path.join(SCREEN_DIR, "16-board-consequence.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "17-play-consequence.png") });

    // ---- COUNTERFACTUAL ---------------------------------------------------
    await advanceTo(teach, "COUNTERFACTUAL");
    await board.waitForSelector("#wrBoardCf", { timeout: 25000 });
    await teach.click("#btnCounterfactual");
    await board.waitForFunction((n) => document.querySelectorAll("[data-wr-cf]").length === n, DESKS, { timeout: 25000 });
    const honesty = await board.textContent("#wrBoardHonesty");
    assert.match(honesty, /cannot show you what you would have done/, "the counterfactual's honest limit is not on the projector");
    await assertBackRowType(board, "#wrBoardCf", "COUNTERFACTUAL: the line");
    await assertBoardFrameFits(board, "COUNTERFACTUAL");
    await assertNoEllipsization(board, "COUNTERFACTUAL");
    await assertNoOverlap(board, "COUNTERFACTUAL");
    await assertBoardPrivacy(board, "COUNTERFACTUAL");
    await board.screenshot({ path: path.join(SCREEN_DIR, "18-board-counterfactual.png") });

    // ---- ARGUE: the Kings 22-8 capstone ----------------------------------
    await advanceTo(teach, "ARGUE");
    await board.waitForSelector("#wrBoardArgue", { timeout: 25000 });
    const argueText = await board.evaluate(() => document.body.innerText);
    assert.match(argueText, /2013/, "the capstone must carry its date on the board");
    assert.equal(/22-8/.test(argueText), false, "the board leaked the owners' vote before the reveal");
    await assertBoardFrameFits(board, "ARGUE (held)");
    await assertNoEllipsization(board, "ARGUE (held)");
    await board.screenshot({ path: path.join(SCREEN_DIR, "19-board-argue.png") });
    for (let i = 0; i < DESKS; i += 1) {
      await desks[i].waitForSelector("#wrKingsDeny");
      await desks[i].click(i % 4 === 0 ? "#wrKingsApprove" : "#wrKingsDeny");
    }
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "20-play-argue.png") });
    await teach.click("#btnCommitReveal");
    await board.waitForSelector("#wrBoardKingsReveal", { timeout: 25000 });
    const kings = await board.textContent("#wrBoardKingsReveal");
    assert.match(kings, /22-8/, "the capstone reveal must carry the real vote");
    assert.match(kings, /May 15, 2013/, "the capstone reveal must carry its date");
    const kingsSplit = await board.textContent("#wrBoardKingsSplit");
    assert.match(kingsSplit, /Nobody is scored/, "the capstone must say there is no matching score (FL5)");
    await assertBackRowType(board, "#wrBoardKingsSplit", "ARGUE: the room's split");
    await assertBoardFrameFits(board, "ARGUE (revealed)");
    await assertNoEllipsization(board, "ARGUE (revealed)");
    await assertBoardPrivacy(board, "ARGUE");
    await board.screenshot({ path: path.join(SCREEN_DIR, "21-board-argue-reveal.png") });

    // ---- SYNTHESIS: the module finale ------------------------------------
    await advanceTo(teach, "SYNTHESIS");
    await board.waitForSelector("#wrBoardCard", { timeout: 25000 });
    const pageCount = Number((await board.textContent(".fh-synth-pager")).match(/of (\d+)/)[1]);
    assert.ok(pageCount >= 6, `the module finale must cover the module: ${pageCount} cards`);
    const titlesSeen = new Set();
    for (let page = 1; page <= pageCount; page += 1) {
      const card = await board.evaluate(() => ({
        title: document.querySelector("#wrBoardCard h3")?.textContent ?? "",
        rails: [...document.querySelectorAll("#wrBoardCard .wr-board-rail > span")].map((n) => n.textContent.trim()),
        ourClass: document.querySelector("#wrBoardOurClass")?.textContent ?? "",
      }));
      assert.ok(card.title.length > 0, `finale card ${page}: no title`);
      titlesSeen.add(card.title);
      assert.deepEqual(
        card.rails,
        ["REMEMBER WHEN", "OUR CLASS", "IN SPORTS", "ECONOMISTS CALL THIS", "OUTSIDE SPORTS"],
        `finale card ${page} ("${card.title}") does not carry all five rails`,
      );
      assert.ok(card.ourClass.length > 20, `finale card ${page}: the OUR CLASS rail is empty — the finale must be computed, not a glossary`);
      await assertFullyVisible(board, "#wrBoardCard", `SYNTHESIS card ${page}`);
      await assertBackRowType(board, "#wrBoardCard h3", `SYNTHESIS card ${page}: title`);
      await assertBackRowType(board, "#wrBoardOurClass", `SYNTHESIS card ${page}: the OUR CLASS rail`);
      await assertBoardFrameFits(board, `SYNTHESIS card ${page}`);
      await assertNoEllipsization(board, `SYNTHESIS card ${page}`);
      await assertBoardPrivacy(board, `SYNTHESIS card ${page}`);
      await board.screenshot({ path: path.join(SCREEN_DIR, `22-board-synthesis-${page}.png`) });
      if (page < pageCount) await pageSynth(teach, board, page + 1);
    }
    assert.equal(titlesSeen.size, pageCount, "the finale repeated a card instead of paging through all of them");
    // Back navigation must actually move the projector backwards.
    await pageSynth(teach, board, pageCount - 1, "#btnSynthPageBack");

    // The pairs have the whole set on their own device — revisit-able.
    const deskCards = await desks[0].evaluate(() => ({
      cards: document.querySelectorAll("#wrFinale .wr-card").length,
      rails: document.querySelectorAll("#wrFinale .wr-card:first-child .wr-rail").length,
    }));
    assert.equal(deskCards.cards, pageCount, `the student device carries ${deskCards.cards} finale cards, the board has ${pageCount}`);
    assert.equal(deskCards.rails, 5, "a finale card on the student device does not carry all five rails");
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "23-play-synthesis.png") });

    // ---- COMPLETE ---------------------------------------------------------
    await advanceTo(teach, "COMPLETE");
    await board.waitForFunction(() => /YOUR RULE/i.test(document.body.innerText), null, { timeout: 25000 });
    await assertBoardFrameFits(board, "COMPLETE");
    await assertNoEllipsization(board, "COMPLETE");
    await assertBoardPrivacy(board, "COMPLETE");
    await board.screenshot({ path: path.join(SCREEN_DIR, "24-board-complete.png") });
    await desks[0].screenshot({ path: path.join(SCREEN_DIR, "25-play-complete.png") });

    assert.equal(consoleErrors.length, 0, `console errors:\n${consoleErrors.join("\n")}`);
    console.log(
      `[e2e-m2l3] PASS — ${boardFramesChecked.length / 2} board frames checked at 2 projector shapes, ` +
        `${ellipsisScans.length / 2} frames scanned for silent truncation, ${privacyScans.length} board privacy scans, ` +
        `${foldChecks.length} 1024x600 first-contact assertions (rule rounds + all three weeks, every desk), ` +
        `${occlusionChecks.length} elementFromPoint occlusion probes, ` +
        `${realDialDrives.length} dials driven by real mouse drag + keyboard, ${pageCount} finale cards paged, zero console errors`,
    );
    for (const p of nonVacuityProofs) console.log(`[e2e-m2l3] NON-VACUITY — ${p}`);
  } catch (error) {
    failure = error;
    try {
      const dump = board ? await board.evaluate(() => document.body.innerText) : "no board page";
      console.error(`[e2e-m2l3] board at failure:\n${dump}`);
      const t = teach ? await teach.evaluate(() => (document.getElementById("controls")?.innerText ?? "").slice(0, 600)) : "no teach page";
      console.error(`[e2e-m2l3] teach controls at failure:\n${t}`);
    } catch {
      /* best effort */
    }
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

main().catch((error) => {
  console.error(`[e2e-m2l3] FAIL — ${error.message}`);
  if (consoleErrors.length > 0) console.error(consoleErrors.join("\n"));
  process.exit(1);
});
