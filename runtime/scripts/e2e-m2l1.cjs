#!/usr/bin/env node
/**
 * End-to-end proof for Module 2, Lesson 1 — "Full House."
 *
 * Everything runs through real Chromium pages against /teach, /play and
 * /board, the way a class would actually play it: one teacher, one
 * projector, four student devices at the classroom Chromebook shape.
 *
 * Run from runtime/: `node scripts/e2e-m2l1.cjs` (after `npm run build`).
 * Requires PLAYWRIGHT_BROWSERS_PATH to point at a pre-installed Chromium —
 * this script never calls `playwright install`.
 *
 * Four desks, four deliberately different lines, so the class evidence the
 * board draws is a real spread and not four copies of one number:
 *   Desk 1 · New York — reads the card every night (34 / 48 / 40 / 90 / 34),
 *            spends on the night before the big one, opens the upper bowl
 *   Desk 2 · Memphis  — holds the season-plan price all five nights
 *   Desk 3 · New York — flat $70 every night, and never locks Night 5
 *            (proving the teacher's bell auto-commits a desk that stalled)
 *   Desk 4 · Memphis  — joins LATE, at Night 3, and still has real books
 *
 * Asserted along the way: the pre-lock screen shows no outcome; the board
 * shows nothing about a night that is still open; the Two Peaks release is
 * a teacher decision; the shock night turns people away; Night 5 replays
 * Night 1's card; every reveal stage renders; zero console errors.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
/**
 * The build under test. Defaults to this checkout's own `dist`. The mutation
 * limb below (R-1) runs the whole script against a SCRATCH COPY of `dist` with
 * a defect injected into `client/play/main.js`, which is why the path is a
 * parameter: `E2E_DIST=/path/to/scratch/dist node scripts/e2e-m2l1.cjs`.
 * The server serves its client assets from its own directory, so a copied dist
 * serves the copied (mutated) client.
 */
const DIST = process.env.E2E_DIST ? path.resolve(process.env.E2E_DIST) : path.join(ROOT, "dist");
const PORT = Number(process.env.E2E_PORT || 4307);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-m2l1-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-l1");

const consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
}

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
  throw new Error("server never came up");
}


/* ---------------------------------------------------- projector visibility -- */

/**
 * gate-l1-projector repair 2 (BLOCKING): `#stage` was centre-flexed inside
 * `body{overflow:hidden}`, so a frame taller than the viewport silently lost its
 * top AND bottom with no scrollbar and no signal — and a text assertion on
 * `innerText` passed while the room could not see the text. Presence is not
 * legibility. These helpers assert the element's rendered box is fully inside
 * the viewport (or reachable by scrolling `#stage`, which is now scrollable),
 * at every projector resolution the review measured.
 */
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
    result.top >= 0 && result.bottom <= result.vh + 1,
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
 * `gate-l1-projector` W3, BLOCKING repair 3. What used to be here was
 * `assertStageScrollable`, which passed an overflowing stage as long as
 * `overflow-y` computed to `auto` or `scroll` — i.e. it encoded the exact
 * substitution ("reachable by scrolling") that the gate had already rejected,
 * and it was only called on three named frames. Ten of twenty-four board frames
 * overflowed the projector while this instrument was green.
 *
 * The condition is per-phase and unqualified — "no board phase may require
 * scrolling a projector" — so this is called on every frame the run visits, not
 * on a named subset, and it fails on overflow rather than on unreachability.
 */
const PROJECTOR_SHAPES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];
/** 2.6% of screen height — the projector review's measured back-row floor. */
const BACK_ROW_FLOOR_PCT = 2.6;
const boardFramesChecked = [];

async function assertBoardFrameFits(board, label, restore = { width: 1600, height: 900 }) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(260);
    const fit = await board.evaluate(() => {
      const s = document.getElementById("stage");
      if (!s) return null;
      return {
        scrollH: s.scrollHeight,
        clientH: s.clientHeight,
        // Whoever repairs this next needs to know WHICH slot grew.
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

/**
 * Rendered type, as a share of screen height, against the back-row floor. HTML
 * type holds the floor because it is set in `vw`; SVG type does not, because it
 * scales with the box its chart is drawn in — which is how the compaction repair
 * shrank the class chart's own axis to 1.30% while the HTML around it passed.
 */
async function assertBackRowType(page, selector, label, { svg = false } = {}) {
  const m = await page.evaluate(
    ({ sel, isSvg }) => {
      const el = document.querySelector(isSvg ? `${sel} text` : sel);
      if (!el) return { found: false };
      const px = parseFloat(getComputedStyle(el).fontSize);
      let rendered = px;
      if (isSvg) {
        const svgEl = document.querySelector(sel);
        rendered = px * (svgEl.getBoundingClientRect().width / svgEl.viewBox.baseVal.width);
      }
      return { found: true, rendered, pct: (rendered / window.innerHeight) * 100, text: (el.textContent || "").slice(0, 40) };
    },
    { sel: selector, isSvg: svg },
  );
  assert.ok(m.found, `${label}: ${selector} is not on the frame at all`);
  assert.ok(
    m.pct >= BACK_ROW_FLOOR_PCT - 0.01,
    `${label}: "${m.text}" renders at ${m.rendered.toFixed(1)}px = ${m.pct.toFixed(2)}% of screen height, under the ${BACK_ROW_FLOOR_PCT}% back-row floor`,
  );
}

/* --------------------------------------------------------------- UI helpers -- */

/** Drives the real range input the way a finger does: set, then fire input + change. */
async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial");
  await page.$eval(
    "#fhPriceDial",
    (el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    price,
  );
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price);
}

async function bumpSpend(page, clicks) {
  for (let i = 0; i < clicks; i += 1) await page.click("#fhSpendUp");
}

const gateCalls = [];

async function lockNight(page) {
  await page.click("#fhLock");
  await page.waitForSelector(".fh-locked-recap", { timeout: 15000 });
}


/**
 * THE GATE CALL — the locked-and-waiting beat (W6 `play-l1-locked-dead-time`).
 *
 * A pair that commits early sits in front of a dark building until the slowest
 * desk finishes, five times in a fifty-minute class, and the screen used to say
 * so in as many words. Three things have to be true of the repair and none is
 * provable from the module alone: the card is ON the locked screen and reachable
 * without a scroll at Chromebook height, a real press registers the call, and
 * the room line never carries a seat identity onto a private surface.
 */
async function callTheGate(page, band, label) {
  const seen = await page.evaluate(() => {
    const gate = document.getElementById("fhGate");
    if (!gate) return null;
    const r = gate.getBoundingClientRect();
    const first = gate.querySelector(".hl-gate-band").getBoundingClientRect();
    const probe = document.elementFromPoint(Math.round(first.left + first.width / 2), Math.round(first.top + first.height / 2));
    return {
      bottom: Math.round(r.bottom),
      top: Math.round(r.top),
      vh: window.innerHeight,
      bands: [...gate.querySelectorAll(".hl-gate-band")].map((b) => b.dataset.band),
      room: gate.querySelector(".hl-gate-room")?.textContent?.trim() ?? "",
      text: gate.textContent,
      reachable: Boolean(probe && probe.closest(".hl-gate-band")),
    };
  });
  assert.ok(seen, `${label}: the locked desk has no gate call — it is back to having nothing to do`);
  assert.deepEqual(seen.bands, ["packed", "busy", "quiet"], `${label}: the gate call's bands are wrong`);
  assert.ok(seen.bottom <= seen.vh + 1, `${label}: the gate call is below the fold — box ${seen.top}..${seen.bottom} in ${seen.vh}px`);
  assert.ok(seen.reachable, `${label}: the gate call's first band is occluded and cannot be pressed`);
  assert.match(seen.room, /\d+ of \d+ desks|All \d+ desks/, `${label}: the room line does not say how much of the room is in: "${seen.room}"`);
  assert.ok(!/seat-\d/.test(seen.text), `${label}: the gate call leaked a seat identity onto a private surface`);
  await page.click(`#fhGate .hl-gate-band[data-band="${band}"]`);
  await page.waitForFunction(
    (b) => document.querySelector(`#fhGate .hl-gate-band[data-band="${b}"]`)?.getAttribute("aria-pressed") === "true",
    band,
    { timeout: 20000 },
  );
  gateCalls.push(`${label}:${band}`);
}

async function waitForNight(page, label) {
  await page.waitForFunction(
    (l) => document.querySelector(".fh-card-night")?.textContent?.includes(l),
    label,
    { timeout: 20000 },
  );
}

/* ------------------------------------------------ R-1: the rendered-claim limb -- */

/**
 * ECON_ADAPTATION_RULINGS R-1 (BLOCKING) and VISUAL_REFERENCE_CONTRACT G.
 *
 * Every economic-truth protection this lesson has stops at the module boundary:
 * `fullHouse.test.ts`'s BLIND COMMIT walks the PAYLOAD, and nothing in this
 * repository used to read the rendered DOM. A builder could compute a projected
 * attendance in `play/main.ts` from `history` + `card` + `market.capacity`,
 * print "Target: $110-$120" as a literal, or draw a fitted demand curve, and
 * every command in the repo stayed green.
 *
 * This limb closes that. At every pre-lock PLAY state the script drives it:
 *   1. reads the desk's OWN payload from the server (`GET /api/me` with the
 *      device token the page is holding) — the exact inputs, no DOM parsing;
 *   2. recomputes the settlement the module WOULD produce for the dials as they
 *      stand, with the module's own `curveFor` + `settleNight` out of the build
 *      under test;
 *   3. asserts none of `turnout`, `gate`, `inArena`, `total`, `net`, `fillPct`,
 *      `turnedAway`, `curve.base`, `curve.sens` is in `#gameBody`'s text;
 *   4. asserts the text carries none of the forbidden claim vocabulary, with
 *      `HOUSE_RULES[0]` (the registered sentence that says there is NO preview)
 *      removed from the text first, since it is the product saying the opposite.
 *
 * ABSTENTION, stated so it cannot be mistaken for coverage: if a recomputed
 * quantity happens to equal a number the payload legitimately carries (a price,
 * the bill, a past night's turnout in `history`), the limb cannot tell a leak
 * from a coincidence, so it SKIPS that quantity and logs the skip. The pre-lock
 * payload provably carries no settlement quantity for the OPEN night
 * (`fullHouse.test.ts` BLIND COMMIT), so every number in it is legitimately
 * printable and this abstention never hides a leak of a number that is not
 * already on the screen for an honest reason.
 */
const CLAIM_WORDS = [
  "project",
  "forecast",
  "estimate",
  "expected",
  "preview",
  "target",
  "profit",
  "readiness",
  "momentum",
  "time remaining",
  "strong round",
  "of capacity",
  "weather",
];

let fullHouse = null;
async function loadModuleUnderTest() {
  if (!fullHouse) {
    const url = require("node:url").pathToFileURL(path.join(DIST, "modules", "fullHouse.js")).href;
    fullHouse = await import(url);
  }
  return fullHouse;
}

/** The device token the page itself is holding — the same one its own fetches use. */
async function deviceTokenOf(page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem("bow-play-credentials");
      return raw ? JSON.parse(raw).deviceToken : null;
    } catch {
      return null;
    }
  });
}

/** Every number anywhere in a payload — what this desk may legitimately print. */
function allNumbersIn(value, out = new Set()) {
  if (typeof value === "number") out.add(value);
  else if (Array.isArray(value)) value.forEach((v) => allNumbersIn(v, out));
  else if (value && typeof value === "object") for (const v of Object.values(value)) allNumbersIn(v, out);
  return out;
}

const claimLimb = { checked: 0, skipped: [] };

async function assertNoRenderedClaim(page, label) {
  const mod = await loadModuleUnderTest();
  const token = await deviceTokenOf(page);
  assert.ok(token, `${label}: the desk page holds no device token — the claim limb cannot read its payload`);
  const res = await fetch(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.ok(res.ok, `${label}: /api/me returned ${res.status}`);
  const view = (await res.json()).view;

  if (view.phase !== "PLAY" || view.locked || !view.card) return; // not a pre-lock desk right now
  const market = mod.MARKETS.find((m) => m.id === view.market.id);
  const card = mod.CARDS[view.card.index - 1];
  assert.ok(market && card, `${label}: could not resolve the desk's market/card from its own payload`);

  const carryFans = view.spendReceipt ? view.spendReceipt.fans : 0;
  const curve = mod.curveFor(market, card, view.books.renewals, carryFans);
  const outcome = mod.settleNight(market, curve, view.price, view.spend, view.openBowl, card.bowlOffer);

  const body = await page.evaluate(() => document.getElementById("gameBody")?.innerText ?? "");
  assert.ok(body.length > 0, `${label}: #gameBody is empty — the limb would pass on a blank screen`);
  // Whole figures only: "1,232" on a settled night's cash chain must not read
  // as a leak of a hidden 232. Every printed token is normalised to a number
  // and compared exactly, so an injected turnout still trips the limb.
  const printedFigures = new Set(
    (body.match(/[0-9][0-9,]*(?:\.[0-9]+)?/g) ?? []).map((t) => Number(t.replace(/,/g, ""))).filter((n) => Number.isFinite(n)),
  );

  const legitimate = allNumbersIn(view);
  const quantities = {
    turnout: outcome.turnout,
    gate: outcome.gate,
    inArena: outcome.inArena,
    total: outcome.total,
    net: outcome.net,
    fillPct: outcome.fillPct,
    turnedAway: outcome.turnedAway,
    "curve.base": curve.base,
    "curve.sens": curve.sens,
  };
  for (const [name, raw] of Object.entries(quantities)) {
    const q = Math.abs(raw);
    if (q === 0) continue; // an honest zero is everywhere on this screen
    if (legitimate.has(raw) || legitimate.has(q)) {
      claimLimb.skipped.push(`${label}: ${name}=${raw} coincides with a number this desk may print`);
      continue;
    }
    const needle = q.toLocaleString("en-US");
    const found = name === "fillPct" ? body.includes(`${needle}%`) : printedFigures.has(q);
    assert.equal(
      found,
      false,
      `${label}: the pre-lock desk RENDERED ${name} (${needle}) for a night nobody has locked — ` +
        `that is a preview of the pending action (BC-4 / R-1). Dials: $${view.price}, spend $${view.spend}, bowl ${view.openBowl}.`,
    );
  }

  // R-1's own exception: the registered sentence that says there is NO preview
  // is not a preview. The second line is the /play renderer's blind note, which
  // says the same thing in the renderer's own words — FLAGGED, not blessed: it
  // is a client literal making an economic statement, and it belongs in the
  // module payload beside HOUSE_RULES[0]. Recorded as a known gap for the
  // /play rebuild; excepted here so the limb reports leaks, not this.
  const NON_CLAIM_SENTENCES = [
    mod.HOUSE_RULES[0],
    "No preview. Nothing on this screen tells you what tonight will make.",
  ];
  let withoutRules = body;
  for (const sentence of NON_CLAIM_SENTENCES) withoutRules = withoutRules.split(sentence).join(" ");
  const lower = withoutRules.toLowerCase();
  for (const word of CLAIM_WORDS) {
    assert.equal(
      lower.includes(word),
      false,
      `${label}: the pre-lock desk rendered the forbidden word "${word}" — ` +
        `${withoutRules.slice(Math.max(0, lower.indexOf(word) - 60), lower.indexOf(word) + 60).replace(/\s+/g, " ")}`,
    );
  }
  claimLimb.checked += 1;
}

/**
 * The results state owns the desk after the bell (contract C). A pair leaves it
 * by pressing NEXT; a desk that never presses it is auto-committed by the next
 * bell exactly as a stalled desk is today. Tolerant on purpose: a desk with no
 * settled night yet (the late joiner) and a build where the control does not
 * exist yet both fall through without failing.
 */
async function acknowledgeResult(page, label) {
  // Wait for the results state itself: right after the bell a desk may still be
  // showing the open night until its own poll lands (the night card is on both
  // screens, so it is no signal).
  const settled = await page
    .waitForSelector("#fhResult", { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!settled) return false;
  if (!(await page.$("#fhNextNight"))) return false;
  // The desk re-renders on its own poll cadence; a handle taken a moment ago
  // can detach before the click lands, so resolve the selector at click time.
  await page.click("#fhNextNight", { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector("#fhResult"), null, { timeout: 20000 }).catch(() => {});
  console.log(`[e2e-m2l1] ${label} pressed NEXT out of its result state`);
  return true;
}

/* ------------------------------------------- the class-scale instrument -- */

/**
 * `gate-l1-play` recheck3 P11-b (BLOCKING dissent `play-l1-repairs-below-fold`)
 * and the wave-2 analyst's biggest-failure finding, which is as much about THIS
 * FILE as about the board.
 *
 * The old guard asserted `assertFullyVisible` on `#fhCfScatter` and
 * `#stage > .exit-prompt` only. Both sit at the TOP of the COUNTERFACTUAL
 * layout, and everything that overflows overflows BENEATH them — so both
 * assertions passed at any class size, including a ten-desk session where the
 * room could see four repeat rows out of ten and no class summary at all. A
 * guard that cannot fail at the size the defect appears is not evidence.
 *
 * This is the repaired instrument. It runs a REAL twelve-desk session, and at
 * both projector shapes it asserts, per teacher-advanced group:
 *   - every rendered repeat row's own box is fully inside the viewport;
 *   - the class summary's box is fully inside the viewport;
 *   - `#stage` does not overflow AT ALL — the projector's "must fit its
 *     content" condition, not "is reachable by scrolling";
 * and then, across all groups, that the union of desk handles the room was
 * actually shown is all twelve. Partial content cannot pass silently: drop a
 * row from a group and the union check fails; let a group overflow and the
 * per-row check fails.
 */
async function classScaleCounterfactual(browser) {
  const DESKS = 12;
  const label = `[e2e-m2l1][12-desk]`;
  const teach = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(teach, "teach-12");
  watchConsole(board, "board-12");
  teach.on("dialog", (d) => d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", "m2l1-full-house");
  await teach.fill("#title", "E2E M2 L1 twelve-desk class");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  await board.goto(`${BASE}/board?code=${code}`);
  await board.waitForSelector("#stage .label");

  // Twelve pairs, twelve different prices spread across the dial, so the class
  // evidence is a real spread and every row's decomposition is different.
  const PRICES = [10, 14, 18, 22, 26, 30, 36, 42, 50, 58, 70, 84];
  const desks = [];
  for (let i = 0; i < DESKS; i += 1) {
    const p = await browser.newPage({ viewport: { width: 1024, height: 600 } });
    watchConsole(p, `desk${i + 1}-12`);
    // LOCK IT IN is behind a confirm guard; without a handler Playwright
    // auto-DISMISSES it and the desk silently never locks.
    p.on("dialog", (dlg) => dlg.accept());
    await p.goto(`${BASE}/play`);
    await p.fill("#joinCode", code);
    await p.fill("#joinName", `Pair ${i + 1}`);
    await p.click("#btnJoin");
    await p.waitForSelector("#gameCard:not([hidden])");
    await p.waitForSelector(".fh-desk-name", { timeout: 20000 });
    desks.push(p);
  }
  console.log(`${label} ${DESKS} pairs joined`);

  await teach.click("#btnAdvance"); // HOOK
  await teach.waitForSelector(".phasechip.current:text('HOOK')");
  await teach.click("#btnAdvance"); // PLAY
  await teach.waitForSelector(".phasechip.current:text('PLAY')");
  for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 30000 });

  // Night 1 and Night 5 are priced by hand at the SAME price on each desk — the
  // repeat card's own case. Nights 2-4 settle on the teacher's bell at the plan
  // price (the auto-commit path), which keeps the run inside a sane wall clock.
  for (let night = 1; night <= 5; night += 1) {
    if (night === 1 || night === 5) {
      for (let i = 0; i < DESKS; i += 1) {
        await waitForNight(desks[i], `Night ${night}`);
        await setPrice(desks[i], PRICES[i]);
        // R-1 at class scale: twelve different pre-lock desks, twelve different dials.
        await assertNoRenderedClaim(desks[i], `${label} Night ${night} · desk ${i + 1} at $${PRICES[i]}`);
        await lockNight(desks[i]);
      }
    }
    await teach.click("#btnCloseNight");
    for (let i = 0; i < DESKS; i += 1) await acknowledgeResult(desks[i], `${label} Night ${night} · desk ${i + 1}`);
    if (night < 5) {
      await desks[0].waitForFunction((l) => document.querySelector(".fh-card-night")?.textContent?.includes(l), `Night ${night + 1}`, { timeout: 30000 });
    }
  }
  await desks[0].waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 30000 });
  console.log(`${label} five nights settled across ${DESKS} desks`);

  for (const phase of ["REVEAL", "ADAPT", "COUNTERFACTUAL"]) {
    await teach.click("#btnAdvance");
    await teach.waitForSelector(`.phasechip.current:text('${phase}')`);
  }
  await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("COUNTERFACTUAL"), null, { timeout: 30000 });

  // Three rows per group (fullHouse.CF_ROWS_PER_PAGE) — four groups at twelve desks.
  const CF_ROWS_PER_PAGE = 3;
  const pageCount = Math.ceil(DESKS / CF_ROWS_PER_PAGE);
  const shapes = [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ];
  const seen = new Set();
  let groups = 0;
  for (let group = 0; group < pageCount; group += 1) {
    groups += 1;
    for (const shape of shapes) {
      await board.setViewportSize(shape);
      await board.waitForTimeout(300);
      const tag = `${label} COUNTERFACTUAL group ${group + 1}/${pageCount} @ ${shape.width}x${shape.height}`;

      const rowCount = await board.evaluate(() => document.querySelectorAll("#fhCfRows .fh-repeat-row").length);
      assert.ok(rowCount > 0, `${tag}: no repeat rows rendered at all`);
      assert.ok(
        rowCount <= CF_ROWS_PER_PAGE,
        `${tag}: ${rowCount} rows in one group — the projector cap is not being applied`,
      );

      // PER-ROW visibility. This is the assertion the old guard did not have.
      for (let r = 1; r <= rowCount; r += 1) {
        await assertFullyVisible(board, `#fhCfRows .fh-repeat-row:nth-child(${r})`, `${tag}: repeat row ${r} of ${rowCount}`);
      }
      // The class summary — off-screen by 947px at ten desks before this repair,
      // and then on screen at 2.05% of screen height, under a LARGER caveat, once
      // paging made it the only carrier of the room-level pattern (W3-1).
      await assertFullyVisible(board, "#fhCfSummary", `${tag}: the class summary`);
      await assertBackRowType(board, "#fhCfSummary", `${tag}: the class summary`);
      // W3F-4: the evidence-tier type the projector critic measured — the row
      // handle (the pager label's own vocabulary) and the chart axis — must
      // both clear the back-row floor, not just the class summary above.
      await assertBackRowType(board, "#fhCfRows .fh-repeat-handle", `${tag}: the repeat row desk handle`);
      await assertBackRowType(board, ".scatter-svg", `${tag}: the two-column chart's axis`, { svg: true });
      await assertFullyVisible(board, "#fhCfScatter", `${tag}: the class scatter`);
      await assertFullyVisible(board, "#stage > .exit-prompt", `${tag}: the argue prompt`);

      // The projector's own condition (gate-l1-projector repair 2): the stage
      // must FIT its content, not merely be able to scroll to it.
      const fit = await board.evaluate(() => {
        const s = document.getElementById("stage");
        return {
          scrollH: s.scrollHeight,
          clientH: s.clientHeight,
          // Whoever has to repair this next needs to know WHICH slot grew.
          parts: [...s.children].map((c) => `${c.className || c.tagName} ${Math.round(c.getBoundingClientRect().height)}px`),
        };
      });
      assert.ok(
        fit.scrollH <= fit.clientH + 1,
        `${tag}: #stage still overflows — ${fit.scrollH}px of content in a ${fit.clientH}px projector; the room would have to scroll mid-argument. Slots: ${fit.parts.join(" · ")}`,
      );

      if (shape.width === 1366) {
        const handles = await board.evaluate(() =>
          [...document.querySelectorAll("#fhCfRows .fh-repeat-handle")].map((n) => n.textContent.trim().split(" same price")[0].split(" $")[0]),
        );
        for (const h of handles) seen.add(h);

        // `gate-l1-projector` §W3 FINAL ADJUDICATION W3F-1: after
        // `orderRepeatRows` sorted by teaching value instead of desk number,
        // the pager label kept claiming a positional desk range ("DESKS 1-3
        // OF 12") over rows that were no longer that range. The label must
        // now NAME the desks in the group, and this asserts the named desks
        // are exactly the rows actually rendered beneath it — not merely
        // present somewhere on the card.
        const pagerText = await board.evaluate(() => document.getElementById("fhCfPager")?.textContent?.trim() ?? "");
        assert.doesNotMatch(
          pagerText,
          /desks?\s+\d+\s*-\s*\d+/i,
          `${tag}: pager label "${pagerText}" still claims a positional desk range`,
        );
        // The pager prints "Desk N" (no franchise — the row itself carries
        // that a moment later); compare the same reduction against the rows
        // actually rendered, so a dropped or extra desk in the label still
        // fails this even though the franchise suffix differs by design.
        const namedInPager = pagerText
          .replace(/^Group \d+ of \d+\s*[—-]\s*/i, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const deskNumbersInPager = namedInPager.map((s) => s);
        const deskNumbersInRows = handles.map((h) => h.split(" · ")[0]);
        assert.deepEqual(
          deskNumbersInPager,
          deskNumbersInRows,
          `${tag}: pager label names [${deskNumbersInPager.join(" | ")}] but the rows rendered beneath it are [${deskNumbersInRows.join(" | ")}]`,
        );

        await board.screenshot({ path: path.join(SCREEN_DIR, `16-board-cf-12desks-group${group + 1}.png`) });
      }
    }
    if (group < pageCount - 1) {
      // Wait for the PROJECTOR to actually change groups, not for the POST to
      // return. A fixed sleep here silently sampled group 1 twice and skipped
      // group 2 entirely — exactly the class of blind spot this instrument
      // exists to close.
      const before = await board.evaluate(() => document.getElementById("fhCfPager")?.textContent?.trim() ?? "");
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnCfPage");
      await resp;
      await board.waitForFunction(
        (prev) => (document.getElementById("fhCfPager")?.textContent?.trim() ?? "") !== prev,
        before,
        { timeout: 20000 },
      );
    }
  }
  // W3-2: the back control must actually move the projector backwards.
  {
    const before = await board.evaluate(() => document.getElementById("fhCfPager")?.textContent?.trim() ?? "");
    const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
    await teach.click("#btnCfPageBack");
    await resp;
    await board.waitForFunction((prev) => (document.getElementById("fhCfPager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 20000 });
    const after = await board.evaluate(() => document.getElementById("fhCfPager")?.textContent?.trim() ?? "");
    assert.notEqual(after, before, "the back-a-group control did not move the projector");
    console.log(`${label} COUNTERFACTUAL: back-a-group moved the projector from "${before}" to "${after}"`);
    await assertBoardFrameFits(board, `${label} COUNTERFACTUAL after back-a-group`, { width: 1366, height: 768 });
  }
  assert.equal(
    seen.size,
    DESKS,
    `the room was only ever shown ${seen.size} of ${DESKS} desks across ${groups} groups — rows are being dropped, not paged (${[...seen].join(" | ")})`,
  );
  console.log(`${label} COUNTERFACTUAL: all ${DESKS} desk rows and the class summary fully inside the viewport across ${groups} teacher-advanced groups, at 1366x768 and 1920x1080, with #stage not overflowing`);

  // The private surface must carry the same decomposition as the board.
  const cfPlay = await desks[11].evaluate(() => document.body.innerText);
  assert.match(
    cfPlay,
    /Where that change came from/i,
    "the desk's own COUNTERFACTUAL card does not carry the channel split — econ-l1-n5-attribution is still live on /play",
  );

  await teach.click("#btnAdvance"); // SYNTHESIS
  await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
  await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("SYNTHESIS"), null, { timeout: 30000 });
  // W3 N1: staged one card at a time. At class scale, every card must fit AND
  // stay above the back-row type floor at both shapes — the previous repair
  // bought fit here by dropping the bodies to 11.20px / 1.46% of screen height.
  const synthTitles = new Set();
  for (let card = 0; card < 6; card += 1) {
    for (const shape of shapes) {
      await board.setViewportSize(shape);
      await board.waitForTimeout(320);
      const tag = `${label} SYNTHESIS card ${card + 1} of 6 @ ${shape.width}x${shape.height}`;
      await assertFullyVisible(board, "#stage > .label", `${tag}: heading`);
      await assertFullyVisible(board, "#fhSynthClose", `${tag}: the closing beyond-sports line`);
      await assertFullyVisible(board, ".cardgrid .synthcard:nth-child(1) h3", `${tag}: the card title`);
      await assertFullyVisible(board, ".cardgrid .synthcard:nth-child(1) p", `${tag}: the card body`);
      await assertBackRowType(board, ".cardgrid .synthcard:nth-child(1) p", `${tag}: the card body`);
      const fit = await board.evaluate(() => {
        const s = document.getElementById("stage");
        return { scrollH: s.scrollHeight, clientH: s.clientHeight };
      });
      assert.ok(fit.scrollH <= fit.clientH + 1, `${tag}: #stage overflows (${fit.scrollH} > ${fit.clientH}) — the ceremonial close still needs a scroll`);
      if (shape.width === 1366) {
        synthTitles.add(await board.textContent(".cardgrid .synthcard:nth-child(1) h3"));
        if (card === 0) await board.screenshot({ path: path.join(SCREEN_DIR, "17-board-synthesis-12desks-1366.png") });
      }
    }
    if (card < 5) {
      const before = await board.evaluate(() => document.getElementById("fhSynthPager")?.textContent?.trim() ?? "");
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnSynthPage");
      await resp;
      await board.waitForFunction((prev) => (document.getElementById("fhSynthPager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 20000 });
    }
  }
  assert.equal(synthTitles.size, 6, `the pager showed ${synthTitles.size} distinct cards, not 6: ${[...synthTitles].join(" | ")}`);
  console.log(`${label} SYNTHESIS: all six cards staged one at a time, each fitting both shapes with body type above the back-row floor`);

  for (const p of desks) await p.close();
  await board.close();
  await teach.close();
}

/**
 * THE PROJECTOR PREVIEW on /teach (W6).
 *
 * A teacher directing a class faces the room, not the board. The console can
 * SAY what the projector is showing; this makes it possible to see it. The
 * whole claim rests on two things being true at once — it is the real board,
 * and it is not a control — so both are measured on the live frame, not
 * asserted from the source.
 */
async function assertProjectorPreview(teach, board, code, label) {
  // 1. It is mounted, and it is pointed at THIS room.
  const mount = await teach.evaluate(() => {
    const sec = document.getElementById("projpreview");
    const frame = document.getElementById("ppFrame");
    const el = document.getElementById("ppBoard");
    const r = frame?.getBoundingClientRect();
    const card = sec?.getBoundingClientRect();
    return {
      hidden: sec?.hidden ?? true,
      collapsed: sec?.classList.contains("collapsed") ?? false,
      src: el?.getAttribute("src") || "",
      pointerEvents: el ? getComputedStyle(el).pointerEvents : "",
      scale: frame ? getComputedStyle(frame).getPropertyValue("--pp-scale").trim() : "",
      width: r ? Math.round(r.width) : 0,
      height: r ? Math.round(r.height) : 0,
      overflowsCard: !!(r && card) && (r.right > card.right + 1 || r.bottom > card.bottom + 1),
    };
  });
  assert.equal(mount.hidden, false, `${label}: the projector preview is not on the console`);
  assert.equal(mount.collapsed, false, `${label}: this run needs the preview open`);
  assert.equal(mount.src, `/board?code=${code}`, `${label}: the preview is pointed at "${mount.src}"`);
  assert.equal(mount.pointerEvents, "none", `${label}: the preview is clickable — a mirror is not a control`);
  assert.ok(mount.width > 200, `${label}: the preview is ${mount.width}px wide, which is not a projector anybody can read`);
  assert.ok(
    Math.abs(mount.height - (mount.width * 720) / 1280) <= 2,
    `${label}: the preview is ${mount.width}x${mount.height}, which is not the projector's shape`,
  );
  assert.equal(mount.overflowsCard, false, `${label}: the scaled board is spilling out of its card`);
  const scale = Number(mount.scale);
  assert.ok(
    Math.abs(scale * 1280 - mount.width) <= 1,
    `${label}: the board is drawn at scale ${mount.scale} inside a ${mount.width}px box — it has been reflowed, not mirrored`,
  );

  // 2. Nothing in it can be pressed. `pointer-events` is the mechanism; this is
  //    the consequence, measured where a teacher would actually miss.
  const hitCentre = await teach.evaluate(() => {
    const r = document.getElementById("ppFrame").getBoundingClientRect();
    const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
    return el ? el.id || el.tagName : "";
  });
  assert.notEqual(hitCentre, "ppBoard", `${label}: a press in the middle of the preview lands inside the board`);

  // 3. It is showing what the room is showing. Compared against the projector
  //    itself on the same frame, not against what the console claims.
  const real = await board.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").trim());
  const mirrored = await teach.evaluate(() => {
    const doc = document.getElementById("ppBoard")?.contentDocument;
    return doc ? (doc.body.innerText || "").replace(/\s+/g, " ").trim() : "";
  });
  assert.ok(mirrored.length > 40, `${label}: the preview is blank (${mirrored.length} chars)`);
  // The two clients poll independently, so they are compared on a stable
  // fingerprint of the frame rather than character-for-character: the words the
  // board is built out of, minus the live counters that legitimately differ by
  // one poll between two clients.
  const fingerprint = (text) =>
    text
      .toUpperCase()
      .replace(/[^A-Z ]+/g, " ")
      .split(" ")
      .filter((w) => w.length >= 5);
  const want = fingerprint(real);
  const got = new Set(fingerprint(mirrored));
  const missing = want.filter((w) => !got.has(w));
  assert.ok(
    want.length > 0 && missing.length / want.length < 0.25,
    `${label}: the preview is not showing the projector — ${missing.length} of ${want.length} of the board's own words are absent: ${missing.slice(0, 12).join(", ")}`,
  );

  // 4. NON-VACUITY: the comparison above must be able to fail. A word the board
  //    is not showing must not be found in something claiming to mirror it.
  assert.equal(got.has("ZZZZQQQQ"), false, `${label}: the preview comparison finds words nobody rendered`);
  return { real, mirrored, width: mount.width };
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });

  console.log("[e2e-m2l1] starting server...");
  await assertPortFree(PORT, require("path").basename(__filename));
  const server = spawn(process.execPath, [path.join(DIST, "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
  await waitForServer();
  console.log("[e2e-m2l1] server up on", BASE);

  let browser;
  try {
    browser = await chromium.launch();
    const viewport = { width: 1280, height: 800 };
    const chromebook = { width: 1024, height: 600 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const d1 = await browser.newPage({ viewport: chromebook });
    const d2 = await browser.newPage({ viewport: chromebook });
    const d3 = await browser.newPage({ viewport: chromebook });
    const d4 = await browser.newPage({ viewport: chromebook });
    const d5 = await browser.newPage({ viewport: chromebook });
    for (const [label, page] of [
      ["teach", teach],
      ["board", board],
      ["desk1", d1],
      ["desk2", d2],
      ["desk3", d3],
      ["desk4", d4],
    ]) {
      watchConsole(page, label);
      page.on("dialog", (dlg) => dlg.accept());
    }

    /* ---- the teacher opens a room ---- */
    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "E2E M2 L1 class");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    console.log("[e2e-m2l1] session created, code", code);

    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage .label");

    async function join(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
      await page.waitForSelector(".fh-desk-name", { timeout: 20000 });
    }
    async function join5(page, name) {
      await page.goto(`${BASE}/play`);
      await page.fill("#joinCode", code);
      await page.fill("#joinName", name);
      await page.click("#btnJoin");
      await page.waitForSelector("#gameCard:not([hidden])");
      await page.waitForFunction(
        () => (document.getElementById("gameBody")?.innerText ?? "").trim().length > 0,
        null,
        { timeout: 20000 },
      );
    }
    await join(d1, "Rae & Ben");
    await join(d2, "Nour & Ivy");
    await join(d3, "Ari & Tal");
    console.log("[e2e-m2l1] three pairs joined (the fourth joins late, at Night 3)");

    /* ---- LOBBY: markets are assigned deterministically and shown ---- */
    const d1Handle = (await d1.textContent(".fh-desk-name")).trim();
    const d2Handle = (await d2.textContent(".fh-desk-name")).trim();
    const d3Handle = (await d3.textContent(".fh-desk-name")).trim();
    assert.match(d1Handle, /Desk 1 · New York Knicks/);
    assert.match(d2Handle, /Desk 2 · Memphis Grizzlies/);
    assert.match(d3Handle, /Desk 3 · New York Knicks/);
    await board.waitForFunction(() => document.querySelectorAll(".fh-desk-chip").length >= 3, null, { timeout: 20000 });
    const lobbyBoard = await board.evaluate(() => document.body.innerText);
    assert.match(lobbyBoard, /New York Knicks/);
    assert.match(lobbyBoard, /Memphis Grizzlies/);
    assert.equal(/\b(Rae|Ben|Nour|Ivy|Ari|Tal)\b/.test(lobbyBoard), false, "a student name reached the projector");
    console.log("[e2e-m2l1] LOBBY: desks assigned, markets alternate, no student name on the board");
    await board.screenshot({ path: path.join(SCREEN_DIR, "01-board-lobby-desks.png") });
    await assertBoardFrameFits(board, "LOBBY");

    /* ---- HOOK ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('HOOK')");
    await d1.waitForFunction(() => document.body.innerText.includes("run the building"), null, { timeout: 20000 });
    await d1.screenshot({ path: path.join(SCREEN_DIR, "02-play-hook.png"), fullPage: true });
    await board.screenshot({ path: path.join(SCREEN_DIR, "03-board-hook.png") });
    await assertBoardFrameFits(board, "HOOK");
    const hookMirror = await assertProjectorPreview(teach, board, code, "HOOK");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "03b-teach-projector-preview.png") });
    console.log(`[e2e-m2l1] HOOK rendered on /play and /board — and on the console's own ${hookMirror.width}px projector preview`);

    /* ---- PLAY ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('PLAY')");
    for (const p of [d1, d2, d3]) await p.waitForSelector("#fhPlayRoot", { timeout: 20000 });

    // The blind commitment, asserted on the real screen: the pre-lock page shows
    // the card, the dials and the pair's own history, and no outcome at all.
    const preLock = await d1.evaluate(() => document.body.innerText);
    assert.match(preLock, /No preview/i);
    assert.equal(/came|turnout|you will make|revenue/i.test(preLock.replace(/Making it an event/gi, "")), false, "the pre-lock screen previews an outcome");
    console.log("[e2e-m2l1] blind commitment confirmed on the student screen — no outcome before the lock");

    const NIGHTS = [
      { label: "Night 1", d1: 34, d2: 16, d3: 70, d4: null },
      { label: "Night 2", d1: 48, d2: 16, d3: 70, d4: null },
      { label: "Night 3", d1: 40, d2: 16, d3: 70, d4: 30 },
      { label: "Night 4", d1: 90, d2: 16, d3: 70, d4: 84 },
      { label: "Night 5", d1: 34, d2: 16, d3: null, d4: 24 },
    ];

    for (let i = 0; i < NIGHTS.length; i += 1) {
      const night = NIGHTS[i];
      console.log(`[e2e-m2l1] --- ${night.label} ---`);
      for (const p of [d1, d2, d3]) await waitForNight(p, night.label);
      // R-1, state 1: the desk as the night opens, dials untouched.
      for (const [name, p] of [["desk1", d1], ["desk2", d2], ["desk3", d3]]) {
        await assertNoRenderedClaim(p, `${night.label} · ${name} · dials at rest`);
      }

      // `gate-l1-play` recheck2 R6 / P2 second clause (BLOCKING, carried): the
      // event-spend receipt was a forward-looking conditional ("if there is room
      // for them") that nothing ever came back to confirm or refute. Desk 1 put
      // $40,000 into Night 3, which lands on Night 4 — and Desk 1 sells Night 4
      // out. On Night 5's screen, Night 4's settlement must say what that money
      // actually bought, in seats, not in intentions.
      // (Since the /play rebuild the settlement owns the desk as a results state
      // before Night 5's dials — the verdict is read there, before NEXT; see the
      // i === 3 block below.)

      // Desk 4 joins late, mid-window, at Night 3.
      if (i === 2) {
        await join(d4, "Sam & Jo");
        await d4.waitForSelector("#fhPlayRoot", { timeout: 20000 });
        const lateHandle = (await d4.textContent(".fh-desk-name")).trim();
        assert.match(lateHandle, /Desk 4 · Memphis Grizzlies/);
        const lateBody = await d4.evaluate(() => document.body.innerText);
        assert.match(lateBody, /covered/i, "a late desk must be told which nights were covered for it");
        console.log("[e2e-m2l1] Desk 4 joined late at Night 3 and arrived with real, labelled books");
        await d4.screenshot({ path: path.join(SCREEN_DIR, "06-play-late-joiner.png"), fullPage: true });
      }

      await setPrice(d1, night.d1);
      if (i === 2) await bumpSpend(d1, 8); // $40,000 on the night before the shock — pays off on Night 4
      // gate-l1-visual P2: the capacity option is a drawn two-state plate now,
      // not a default OS checkbox, so it is pressed rather than checked.
      if (i === 3) {
        await d1.click("#fhBowl");
        await d1.waitForFunction(() => document.getElementById("fhBowl")?.getAttribute("aria-pressed") === "true", null, { timeout: 10000 });
      }
      // R-1, state 2: the desk with the dials as the pair set them, still unlocked.
      await assertNoRenderedClaim(d1, `${night.label} · desk1 · dials set at $${night.d1}`);
      await lockNight(d1);

      // THE DESKS, on the one frame where the room is genuinely split: Desk 1 is
      // committed and the other two are still dialling. THE ROOM says the shape;
      // this has to say WHO, by name, or the teacher does that join standing up.
      if (i === 0) {
        await teach.waitForFunction(
          () => /1 of 3 locked/.test(document.getElementById("deskCount")?.textContent ?? ""),
          null,
          { timeout: 20000 },
        );
        const strip = await teach.evaluate(() => {
          const sec = document.getElementById("desks");
          return {
            hidden: sec?.hidden ?? true,
            count: document.getElementById("deskCount")?.textContent ?? "",
            note: document.getElementById("deskNote")?.textContent ?? "",
            filter: document.getElementById("deskFilter")?.textContent ?? "",
            chips: [...document.querySelectorAll("#deskGrid .desk-chip")].map((c) => ({
              cls: c.className,
              handle: c.querySelector(".dk-handle")?.textContent ?? "",
              who: c.querySelector(".dk-who")?.textContent ?? "",
              state: c.querySelector(".dk-state")?.textContent ?? "",
            })),
          };
        });
        assert.equal(strip.hidden, false, "the walk-to list is not on the console while the night is open");
        assert.match(strip.count, /1 of 3 locked · night 1 of 5/);
        assert.equal(strip.chips.length, 3, `the walk-to list drew ${strip.chips.length} chips for 3 desks`);
        const byWho = Object.fromEntries(strip.chips.map((c) => [c.who, c]));
        // The join the console used to make the teacher do in their head.
        assert.ok(byWho["Rae & Ben"], "the pair running Desk 1 is not named on their own chip");
        assert.match(byWho["Rae & Ben"].handle, /Desk 1 · New York Knicks/);
        assert.match(byWho["Rae & Ben"].state, /Locked Night 1/);
        assert.match(byWho["Nour & Ivy"].state, /Still dialling/);
        assert.match(byWho["Nour & Ivy"].cls, /attn/, "a desk that has not committed is not marked as needing the teacher");
        assert.equal(/attn|quiet/.test(byWho["Rae & Ben"].cls), false, "a committed desk is marked as needing the teacher");
        assert.match(strip.note, /2 of 3 desks could use you/);
        assert.match(strip.note, /real names never reach the projector/i);

        // Filter down to the ones that need walking to, then back.
        assert.match(strip.filter, /Only the 2 that need me/);
        await teach.click("#deskFilter");
        await teach.waitForFunction(() => document.querySelectorAll("#deskGrid .desk-chip").length === 2, null, { timeout: 10000 });
        const filtered = await teach.evaluate(() =>
          [...document.querySelectorAll("#deskGrid .desk-chip")].map((c) => c.querySelector(".dk-who")?.textContent ?? ""),
        );
        assert.deepEqual(filtered.sort(), ["Ari & Tal", "Nour & Ivy"]);
        await teach.click("#deskFilter");
        await teach.waitForFunction(() => document.querySelectorAll("#deskGrid .desk-chip").length === 3, null, { timeout: 10000 });

        // Real names are the whole point of this panel and the whole reason it
        // may never exist on the projector.
        const boardNow = await board.evaluate(() => document.body.innerText);
        assert.equal(/Rae|Ben|Nour|Ivy|Ari|Tal/.test(boardNow), false, "a student name reached the projector while the walk-to list was up");
        await teach.screenshot({ path: path.join(SCREEN_DIR, "05c-teach-desks-night1.png") });
        console.log("[e2e-m2l1] THE DESKS: 3 chips, the split named, the filter working, nothing of it on the projector");
      }

      await setPrice(d2, night.d2);
      await assertNoRenderedClaim(d2, `${night.label} · desk2 · dials set at $${night.d2}`);
      await lockNight(d2);

      if (night.d3 !== null) {
        await setPrice(d3, night.d3);
        await assertNoRenderedClaim(d3, `${night.label} · desk3 · dials set at $${night.d3}`);
        await lockNight(d3);
      } else {
        console.log("[e2e-m2l1] Desk 3 never locks Night 5 — the bell must auto-commit it at the plan price");
      }

      if (night.d4 !== null && i >= 2) {
        await setPrice(d4, night.d4);
        await assertNoRenderedClaim(d4, `${night.label} · desk4 · dials set at $${night.d4}`);
        await lockNight(d4);
      }

      if (i === 0) {
        await callTheGate(d1, "packed", "Night 1, desk 1");
        await callTheGate(d2, "quiet", "Night 1, desk 2");
        // A misclick must not cost a fifth-grader a whole night: the call is
        // changeable while the night is open, and the LAST one is what freezes.
        await callTheGate(d2, "busy", "Night 1, desk 2 changing its mind");
        await d1.screenshot({ path: path.join(SCREEN_DIR, "05b-play-night1-locked-gatecall.png") });
        // Nothing about an open night may reach the projector.
        const openBoard = await board.evaluate(() => document.body.innerText);
        assert.equal(openBoard.includes("$34"), false, "a locked price for the still-open night reached the projector");
        assert.match(openBoard, /Desks locked in/i);
        await board.screenshot({ path: path.join(SCREEN_DIR, "04-board-night1-open.png") });
        await assertBoardFrameFits(board, "PLAY · Night 1 open");
        await d1.screenshot({ path: path.join(SCREEN_DIR, "05-play-night1-dials.png"), fullPage: true });
      }

      // The gate call is private to the desk that made it. A pair's reading of
      // its own crowd is not the room's business until the room's own reveal.
      if (i === 0) {
        const boardText = await board.evaluate(() => document.body.innerText);
        assert.ok(
          !/PACKED|BUSY|QUIET/.test(boardText),
          "a desk's private gate call reached the projector while the night was still open",
        );
      }

      // The teacher rings the bell. Every desk settles at once.
      await teach.click("#btnCloseNight");
      if (i === 0) {
        const answered = await Promise.all(
          [d1, d2, d3].map((p) =>
            p
              .waitForSelector("#fhResult", { timeout: 20000 })
              .then(() =>
                p.evaluate(() => {
                  const el = document.getElementById("fhGateResult");
                  return el ? { line: el.textContent.trim(), right: el.classList.contains("right") } : null;
                }),
              ),
          ),
        );
        assert.ok(answered[0], "desk 1 called the gate and the bell said nothing about it");
        assert.match(answered[0].line, /^You called PACKED\./, `desk 1's answer does not name its own call: "${answered[0].line}"`);
        assert.ok(answered[1], "desk 2 called the gate and the bell said nothing about it");
        assert.match(
          answered[1].line,
          /^You called BUSY\./,
          `desk 2's answer resolved the call it CHANGED AWAY from: "${answered[1].line}"`,
        );
        for (const a of [answered[0], answered[1]]) {
          assert.ok(
            !/good|bad|mistake|should have|wrong price/i.test(a.line),
            `the gate call's answer judged the DECISION instead of the reading: "${a.line}"`,
          );
        }
        assert.equal(answered[2], null, "desk 3 never called the gate and was handed a verdict on one anyway");
        // NON-VACUITY: an answer naming a call the desk never made must be caught.
        const poisonCaught = await d1.evaluate(() => {
          const el = document.getElementById("fhGateResult");
          const before = el.textContent;
          el.textContent = "You called QUIET. 100 came — 1% of the seats you opened. You read it.";
          const bad = /^You called PACKED\./.test(el.textContent.trim());
          el.textContent = before;
          return !bad;
        });
        assert.ok(poisonCaught, "the gate-call answer check does not bite");
        console.log(`[e2e-m2l1] the gate call: ${gateCalls.join(" · ")} — answered on the desk that made it, silent on the desk that did not, absent from the projector`);
        console.log("[e2e-m2l1] NON-VACUITY — an answer resolving a call the desk never made is rejected");
      }
      // The settled night owns the desk until the pair presses NEXT (contract C).
      if (i === 3) {
        // Desk 1's Night-4 results state must rule on the $40,000 it put into Night 3.
        await d1.waitForSelector("#fhSpendVerdict", { timeout: 20000 });
        const verdict = (await d1.textContent("#fhSpendVerdict")).trim();
        assert.match(
          verdict,
          /bought nothing|could not get in|every one of them got in/,
          `the next-night receipt does not rule on last night's event money: "${verdict}"`,
        );
        assert.match(verdict, /\$40,000/, "the verdict does not name the money it is ruling on");
        console.log(`[e2e-m2l1] spend receipt settled after the fact: "${verdict}"`);
        // The sellout beat lives on the results state — read it before NEXT.
        await d2.waitForFunction(() => !!document.querySelector("#fhResult"), null, { timeout: 20000 });
        const shockPlay = await d2.evaluate(() => document.getElementById("gameBody")?.innerText ?? "");
        assert.match(shockPlay, /FULL HOUSE/, "Memphis holding the plan price through the shock should sell out");
        assert.match(shockPlay, /could not get a seat/, "a sold-out night must report the people it turned away");
        console.log("[e2e-m2l1] the shock night sold a building out and reported the fans turned away");
        await d2.screenshot({ path: path.join(SCREEN_DIR, "08-play-shock-soldout.png"), fullPage: true });
      }
      for (const [name, p] of [["desk1", d1], ["desk2", d2], ["desk3", d3], ["desk4", d4]]) {
        if (p === d4 && i < 2) continue; // Desk 4 has not joined yet
        await acknowledgeResult(p, `${night.label} · ${name}`);
      }
      if (i < NIGHTS.length - 1) {
        for (const p of [d1, d2, d3]) await waitForNight(p, NIGHTS[i + 1].label);
      } else {
        await d1.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 20000 });
      }
      console.log(`[e2e-m2l1] ${night.label} settled for every desk`);
      // W3 BLOCKING repair 3: EVERY board frame, not a named subset. These are
      // the frames that measured +152px (N1-N3) and +280px (N4, with the Two
      // Peaks panel stacked under the card banner and the lock counter).
      await assertBoardFrameFits(board, `PLAY · after the ${night.label} bell`);

      if (i === 2) {
        // The Two Peaks release is a teacher decision, not a timer.
        const before = await board.evaluate(() => document.body.innerText);
        assert.equal(before.includes("THE TWO PEAKS"), false, "the Two Peaks panel appeared without the teacher releasing it");
        await teach.click("#btnTwoPeaks");
        await board.waitForFunction(() => document.body.innerText.includes("THE TWO PEAKS"), null, { timeout: 20000 });
        const after = await board.evaluate(() => document.body.innerText);
        assert.match(after, /The cheaper ticket made more money/);
        console.log("[e2e-m2l1] Two Peaks released by the teacher, on the room's own Night 3 curve");
        await board.screenshot({ path: path.join(SCREEN_DIR, "07-board-two-peaks.png") });
        // `gate-l1-projector` W3: the punchline measured box 820..849 in a 768px
        // viewport — the beat was orphaned on the surface where the teacher
        // releases it. It must LAND on screen, at both shapes, with the money
        // view's own type above the back-row floor.
        for (const shape of PROJECTOR_SHAPES) {
          await board.setViewportSize(shape);
          await board.waitForTimeout(260);
          const tag = `PLAY · Two Peaks released @ ${shape.width}x${shape.height}`;
          await assertFullyVisible(board, ".fh-peaks-punch", `${tag}: the punchline`);
          await assertBackRowType(board, ".fh-money-svg", `${tag}: the money view's peak labels`, { svg: true });
        }
        await board.setViewportSize({ width: 1600, height: 900 });
        await board.waitForTimeout(150);
        await assertBoardFrameFits(board, "PLAY · Two Peaks released");
      }

    }

    // Desk 3's unlocked Night 5 must have been auto-committed, and labelled.
    // (Each /play page polls on its own ~1.2s cadence — wait for THIS page to
    // catch up to the closed window before reading it.)
    await d3.waitForFunction(() => document.body.innerText.includes("in the books"), null, { timeout: 20000 });
    const d3Body = await d3.evaluate(() => document.body.innerText);
    assert.match(d3Body, /auto/i, "the auto-committed night is not labelled on the desk that stalled");
    console.log("[e2e-m2l1] Desk 3's un-locked Night 5 was auto-committed at the plan price and flagged as such");
    await assertBoardFrameFits(board, "PLAY · five nights in the books");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "09-teach-after-play.png"), fullPage: true });

    /* ---- REVEAL, staged ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("REVEAL"), null, { timeout: 20000 });
    await assertBoardFrameFits(board, "REVEAL stage 0");
    for (let i = 0; i < 7; i += 1) {
      const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
      await teach.click("#btnRevealNext");
      await resp;
      await board.waitForTimeout(900);
      await assertBoardFrameFits(board, `REVEAL stage ${i + 1}`);
      if (i === 4) {
        // Stages 1-5 put the five nights up one at a time. Each press now NAMES
        // its own beat on the projector (gate-l1-play "REVEAL stages 1-5 spend
        // four of their five beats silently"; gate-l1-teacher TT-B2), and a
        // running "Nights up" line still says how much of the room's evidence
        // is on screen. The headline is not "the room's own curve": the picture
        // pools five demand worlds, so it says what it is (gate-l1-play P1).
        await board.waitForFunction(
          () => /N1 . N2 . N3 . N4 . N5/.test(document.body.innerText),
          null,
          { timeout: 20000 },
        );
        const staged = await board.evaluate(() => document.body.innerText);
        assert.match(staged, /Nights up: N1 · N2 · N3 · N4 · N5/);
        assert.match(staged, /NIGHT 5 · NIGHT 1'S CARD AGAIN/, "the fifth reveal beat does not name itself");
        assert.match(staged, /THE RENEWALS RULE/, "the renewals rule never reaches the room (gate-l1-play P10)");
        assert.equal(staged.includes("THE TWO PEAKS"), false, "Two Peaks landed before its own stage");
        // `gate-l1-play` recheck2, BLOCKING dissent `play-l1-repairs-below-fold`:
        // presence in the DOM was never the claim. The rule measured a rendered
        // TOP of 764 in a 768px viewport and 1073 in a 1080px one — the room saw
        // none of it, while /teach told the teacher it was "on the screen now".
        // It must be fully inside the projector without a scroll, at both shapes.
        for (const shape of PROJECTOR_SHAPES) {
          await board.setViewportSize(shape);
          await board.waitForTimeout(250);
          const tag = `REVEAL stage 5 @ ${shape.width}x${shape.height}`;
          await assertFullyVisible(board, "#fhRenewalsRule", `${tag}: the renewals rule`);
          // The compacted chart's own SVG type is the thing the compaction
          // repair shrank to 1.56% while the HTML around it stayed legible.
          await assertBackRowType(board, ".scatter-svg", `${tag}: the compacted chart's axis`, { svg: true });
        }
        await board.setViewportSize({ width: 1600, height: 900 });
        await board.waitForTimeout(250);
        console.log("[e2e-m2l1] REVEAL stage 5: the renewals rule is fully above the fold at 1366x768 and 1920x1080");
        // The preview has to TRACK. A mirror that showed the HOOK correctly and
        // then froze on it is worse than no mirror at all: a teacher would say
        // "look at the board" at the wrong stage and believe they had checked.
        const revealMirror = await assertProjectorPreview(teach, board, code, "REVEAL stage 5");
        assert.match(revealMirror.mirrored, /THE RENEWALS RULE/i, "the preview is stuck on an earlier frame");
        assert.equal(/RUN THE BUILDING/i.test(revealMirror.mirrored), false, "the preview is still showing the HOOK during REVEAL");
        await teach.screenshot({ path: path.join(SCREEN_DIR, "10b-teach-projector-preview-reveal.png") });
        console.log("[e2e-m2l1] the console's projector preview tracked the room from HOOK to REVEAL stage 5");
      }
      if (i === 5) {
        // gate-l1-projector repair 2, SPLIT limb: the Two Peaks money view owns
        // stage 6. It used to be carried under the season books on stage 7 as
        // well, which made the final REVEAL frame 962px tall in a 768px
        // projector. Each beat owns its own screen now, so Two Peaks is asserted
        // on its own stage and must be GONE by the books.
        await board.waitForFunction(() => document.body.innerText.includes("THE TWO PEAKS"), null, { timeout: 20000 });
        const peaksStage = await board.evaluate(() => document.body.innerText);
        assert.match(peaksStage, /The cheaper ticket made more money/);
        assert.equal(peaksStage.includes("Fullest house"), false, "the season books landed before their own stage");
        console.log("[e2e-m2l1] REVEAL stage 6: the Two Peaks money view has the projector to itself");
      }
    }
    await board.waitForFunction(() => document.body.innerText.includes("Fullest house"), null, { timeout: 20000 });
    const revealBoard = await board.evaluate(() => document.body.innerText);
    assert.equal(
      revealBoard.includes("THE TWO PEAKS"),
      false,
      "the final REVEAL beat still stacks the Two Peaks panel under the season books — the frame the projector review measured at 962px in a 768px viewport",
    );
    assert.match(revealBoard, /Median renewals/i);
    assert.match(revealBoard, /modeled on real market differences/i);
    console.log("[e2e-m2l1] REVEAL played through all 7 stages — Two Peaks, then per-market books");
    await board.screenshot({ path: path.join(SCREEN_DIR, "10-board-reveal-books.png") });

    // A pair walks in during the reveal. The five nights are in the books and the
    // teacher has already read numbers out loud, so seating them would silently
    // re-derive the room's own results — but "finding your desk…" forever is a
    // student stranded on a spinner for the rest of the period. The landing has to
    // be honest, and the console has to be told a body is in the room.
    await join5(d5, "Kit & Ros");
    const strandedBody = await d5.evaluate(() => document.body.innerText);
    assert.equal(
      /finding your desk/i.test(strandedBody),
      false,
      "a pair who arrived during REVEAL is still being told we are finding their desk",
    );
    assert.match(strandedBody, /arrived after the last night closed/i);
    assert.match(strandedBody, /five nights are already in the books/i);
    assert.match(strandedBody, /pull your chair up to the nearest desk/i);
    // They are an observer, not a desk: no dials, no lock, no books of their own.
    const strandedControls = await d5.evaluate(() => ({
      dials: document.querySelectorAll("#fhPrice, #fhSpend, #fhBowl").length,
      lock: document.querySelectorAll("#fhLock").length,
    }));
    assert.deepEqual(strandedControls, { dials: 0, lock: 0 }, "the observer landing handed a late pair a live desk");
    await d5.screenshot({ path: path.join(SCREEN_DIR, "10c-play-reveal-observer.png"), fullPage: true });

    // The projector must not grow a sixth desk out of it.
    const observerBoard = await board.evaluate(() => document.body.innerText);
    assert.equal(/Kit|Ros/.test(observerBoard), false, "a late pair's student names reached the projector");
    assert.equal(/Desk 5/.test(observerBoard), false, "a late observer was drawn on the projector as a desk");

    // And /teach is told, without a seat id, with something to actually do.
    await teach.waitForFunction(
      () => document.body.innerText.includes("arrived after the last night closed"),
      null,
      { timeout: 20000 },
    );
    const observerFlag = await teach.evaluate(() => {
      const el = [...document.querySelectorAll(".dir-flag")].find((n) =>
        n.textContent?.includes("arrived after the last night closed"),
      );
      return el ? { cls: el.className, text: el.innerText } : null;
    });
    assert.ok(observerFlag, "the console never flagged the pair standing in the doorway");
    assert.match(observerFlag.cls, /\bnow\b/, "the late-arrival flag is not marked as needing the teacher now");
    assert.match(observerFlag.text, /Late pair 1/);
    assert.match(observerFlag.text, /pair them with a desk near the door/i);
    assert.equal(/Kit|Ros|seat_/.test(observerFlag.text), false, "the console named the late pair instead of the desk");
    await teach.screenshot({ path: path.join(SCREEN_DIR, "10d-teach-late-observer.png") });
    console.log("[e2e-m2l1] a pair arriving during REVEAL lands as an honest observer, and the console is told to seat them beside a desk");

    /* ---- ADAPT: the room's whole curve, both markets, one labelled series each ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('ADAPT')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("ADAPT"), null, { timeout: 20000 });
    const adaptBoard = await board.evaluate(() => document.body.innerText);
    assert.match(adaptBoard, /charge LESS and make MORE/i);
    // gate-l1-play P1: one mark per desk-night, shaped by night (circle / square /
    // triangle / diamond / ring), and NO joining stroke — a line through five demand
    // worlds is what made the projector argue against the lesson.
    const curvePoints = await board.evaluate(
      () => document.querySelectorAll(".scatter-svg circle, .scatter-svg rect, .scatter-svg polygon").length,
    );
    assert.ok(curvePoints >= 15, `expected every desk-night marked on the board, got ${curvePoints} marks`);
    const joins = await board.evaluate(() => document.querySelectorAll(".scatter-svg path").length);
    assert.equal(joins, 0, "the class chart is joining points across different nights again");
    const shapes = await board.evaluate(() =>
      new Set([...document.querySelectorAll(".scatter-svg circle, .scatter-svg rect, .scatter-svg polygon")].map((n) => n.tagName)).size,
    );
    assert.ok(shapes >= 2, "every night is drawn with the same mark — the room cannot tell the nights apart");
    assert.match(adaptBoard, /SAME colour and the SAME shape/i);
    await board.screenshot({ path: path.join(SCREEN_DIR, "11-board-adapt-curve.png") });
    await assertBoardFrameFits(board, "ADAPT");
    for (const shape of PROJECTOR_SHAPES) {
      await board.setViewportSize(shape);
      await board.waitForTimeout(200);
      await assertBackRowType(board, ".scatter-svg", `ADAPT @ ${shape.width}: the class chart's axis`, { svg: true });
    }
    await board.setViewportSize({ width: 1600, height: 900 });
    console.log(`[e2e-m2l1] ADAPT: questions plus the room's whole curve — ${curvePoints} class points, two labelled series`);

    /* ---- COUNTERFACTUAL: Night 1 vs Night 5 ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('COUNTERFACTUAL')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("COUNTERFACTUAL"), null, { timeout: 20000 });
    const cfBoard = await board.evaluate(() => document.body.innerText);
    assert.match(cfBoard, /Night 1 vs Night 5/i);
    assert.match(cfBoard, /same price/i);
    assert.match(cfBoard, /We can show you what the money would have done/);
    const repeatRows = await board.evaluate(() => document.querySelectorAll(".fh-repeat-row").length);
    assert.ok(repeatRows >= 3, `expected a repeat-card row per desk, got ${repeatRows}`);
    await d1.waitForFunction(() => document.body.innerText.toUpperCase().includes("WHAT IF?"), null, { timeout: 20000 });
    const cfPlay = await d1.evaluate(() => document.body.innerText);
    assert.match(cfPlay, /Same price every night/);
    assert.match(cfPlay, /The most cash we could find/); // gate-l1-econ B2: no beatable 'maximum' claim
    // gate-l1-econ-r1 R2 (BLOCKING dissent econ-l1-season-books): the note beside
    // the strongest line used to assert a renewals cost the row's own numbers
    // refuted. It is read off the two rows now, so it can only claim a cost when
    // there is one — and at the shipped constants there is.
    assert.match(cfPlay, /renewal points? for it/, "the strongest line's note does not state what it cost on the renewals book");
    assert.match(cfPlay, /no exchange rate/i);
    // The board's own argue-fuel must be ON the board in the phase that asks for
    // it (gate-l1-play 1a / P1-b, BLOCKING).
    const cfMarks = await board.evaluate(() => document.querySelectorAll(".scatter-svg circle, .scatter-svg rect, .scatter-svg polygon").length);
    assert.ok(cfMarks >= 10, `COUNTERFACTUAL tells the room to read dots on the board; found ${cfMarks} marks rendered`);
    // Same dissent, second half: the scatter measured a rendered TOP of 720/839/1007
    // in viewports of 768/900/1080, so the prompt in the largest type on this board
    // pointed at dots nobody could see. Rendered is not shown.
    for (const shape of PROJECTOR_SHAPES) {
      await board.setViewportSize(shape);
      await board.waitForTimeout(250);
      const tag = `COUNTERFACTUAL @ ${shape.width}x${shape.height}`;
      await assertFullyVisible(board, "#fhCfScatter", `${tag}: the class scatter the prompt sends the room to`);
      await assertFullyVisible(board, "#stage > .exit-prompt", `${tag}: the argue prompt`);
      // `gate-l1-play` W3-1: paging made the class summary the ONLY carrier of
      // the room-level pattern, and it rendered at 2.05% of screen height under
      // a LARGER caveat.
      await assertBackRowType(board, "#fhCfSummary", `${tag}: the class summary`);
      await assertBackRowType(board, ".scatter-svg", `${tag}: the two-column chart's axis`, { svg: true });
    }
    await board.setViewportSize({ width: 1600, height: 900 });
    await board.waitForTimeout(250);
    await assertBoardFrameFits(board, "COUNTERFACTUAL");
    console.log("[e2e-m2l1] COUNTERFACTUAL: scatter fully above the fold at 1366x768 and 1920x1080");
    // R4 (`econ-l1-n5-attribution`): every repeat row states which channel moved
    // its crowd, in its own fans — never a bare renewals claim.
    const cfBoardAfter = await board.evaluate(() => document.body.innerText);
    assert.match(
      cfBoardAfter,
      /renewals [-+]?[\d,]+|event money [-+]?[\d,]+|nothing carried over/,
      "the Night 1 vs Night 5 board does not decompose any desk's crowd change into its channels",
    );
    console.log("[e2e-m2l1] COUNTERFACTUAL: N1-vs-N5 on the board, per-desk replays on /play");
    await board.screenshot({ path: path.join(SCREEN_DIR, "12-board-counterfactual-n1-n5.png") });
    await d1.screenshot({ path: path.join(SCREEN_DIR, "13-play-counterfactual.png"), fullPage: true });

    /* ---- SYNTHESIS ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
    await board.waitForFunction(() => document.getElementById("hud")?.textContent?.includes("SYNTHESIS"), null, { timeout: 20000 });
    // W3 N1: the six-card dashboard grid is staged ONE card per frame under the
    // teacher's own pager (it was previously made to fit by shrinking its bodies
    // to 11.2px on a projector). Every card must still reach the room, and every
    // page must fit at both shapes — a pager that hides a card is the same defect
    // in a new place.
    let synth = "";
    for (let card = 0; card < 6; card += 1) {
      synth += "\n" + (await board.evaluate(() => document.body.innerText));
      await assertBoardFrameFits(board, `SYNTHESIS card ${card + 1} of 6`);
      if (card < 5) {
        const before = await board.evaluate(() => document.getElementById("fhSynthPager")?.textContent?.trim() ?? "");
        const resp = teach.waitForResponse((r) => r.url().includes("/control") && r.request().method() === "POST");
        await teach.click("#btnSynthPage");
        await resp;
        await board.waitForFunction((prev) => (document.getElementById("fhSynthPager")?.textContent?.trim() ?? "") !== prev, before, { timeout: 20000 });
      }
    }
    for (const title of [
      "REVENUE = PRICE × PEOPLE",
      "THE CARD MOVED THE CROWD",
      "THE TICKET IS NOT THE PRODUCT",
      "NIGHT 5 WAS NIGHT 1",
      "TWO BOOKS, NO EXCHANGE RATE",
      "YOUR JOB IS REAL",
    ]) {
      assert.ok(synth.includes(title), `synthesis card never reached the projector across the six staged frames: ${title}`);
    }
    assert.match(synth, /4,066/); // the dated Fever attendance figure
    assert.match(synth, /2009/); // the dated dynamic-pricing anchor
    assert.equal(/\b(Rae|Ben|Nour|Ivy|Ari|Tal|Sam|Jo)\b/.test(synth), false, "a student name reached the synthesis board");
    console.log("[e2e-m2l1] SYNTHESIS: all six cards computed from this class's own numbers, with dated real anchors");
    await board.screenshot({ path: path.join(SCREEN_DIR, "14-board-synthesis.png") });

    // The two projector shapes the classroom review measured. The heading and
    // the FIRST ROW of card titles are the exact elements it found beheaded at
    // both resolutions, so they are the ones asserted — as rendered boxes inside
    // the viewport, not as strings inside innerText.
    for (const shape of PROJECTOR_SHAPES) {
      const label = `SYNTHESIS @${shape.width}x${shape.height}`;
      await board.setViewportSize(shape);
      await board.waitForTimeout(400);
      await assertFullyVisible(board, "#stage > .label", label + " heading");
      await assertFullyVisible(board, ".cardgrid .synthcard:nth-child(1) h3", label + " card title");
      await assertFullyVisible(board, ".cardgrid .synthcard:nth-child(1) p", label + " card body");
      await assertFullyVisible(board, "#fhSynthClose", label + " the beyond-sports close");
      // W3 N1: this frame was un-clipped by SHRINKING — 11.20px bodies and
      // 9.29px sources at 1366x768. Fit is not the only condition.
      await assertBackRowType(board, ".cardgrid .synthcard:nth-child(1) h3", label + " card title");
      await assertBackRowType(board, ".cardgrid .synthcard:nth-child(1) p", label + " card body");
      await board.screenshot({ path: path.join(SCREEN_DIR, `14-board-synthesis-${shape.width}.png`) });
      console.log(`[e2e-m2l1] ${label}: the staged card is inside the viewport and above the back-row type floor`);
    }
    await board.setViewportSize({ width: 1600, height: 900 });

    /* ---- COMPLETE ---- */
    await teach.click("#btnAdvance");
    await teach.waitForSelector(".phasechip.current:text('COMPLETE')");
    await board.waitForFunction(() => document.body.innerText.toUpperCase().includes("FULL HOUSE — COMPLETE"), null, { timeout: 20000 });
    await board.screenshot({ path: path.join(SCREEN_DIR, "15-board-complete.png") });
    await assertBoardFrameFits(board, "COMPLETE", null);
    console.log("[e2e-m2l1] COMPLETE reached on all three surfaces");

    for (const page of [d1, d2, d3, d4, d5]) await page.close();
    await board.close();
    await teach.close();

    /* ---- the class-scale COUNTERFACTUAL, at 12 desks ---- */
    await classScaleCounterfactual(browser);

    /* ---- R-1: the limb is only evidence if it actually ran ---- */
    assert.ok(
      claimLimb.checked >= 20,
      `the rendered-claim limb ran on only ${claimLimb.checked} pre-lock desks — a limb that barely ran is not evidence`,
    );
    console.log(
      `[e2e-m2l1] R-1 rendered-claim limb: ${claimLimb.checked} pre-lock desk states audited against a recomputed settlement; ` +
        `${claimLimb.skipped.length} quantity checks abstained on a numeric coincidence`,
    );
    for (const skip of claimLimb.skipped.slice(0, 12)) console.log(`[e2e-m2l1]   abstained — ${skip}`);

    if (consoleErrors.length > 0) {
      console.error("[e2e-m2l1] CONSOLE ERRORS DETECTED:\n" + consoleErrors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log(`[e2e-m2l1] zero console errors across every page of both sessions (4-desk arc + 12-desk class-scale run)`);
      console.log(`[e2e-m2l1] projector fit asserted on ${boardFramesChecked.length / 2} board frames x 2 shapes (1366x768 and 1920x1080): scrollHeight <= clientHeight on every one.`);
      console.log("[e2e-m2l1] PASS — full Full House arc verified end to end across /teach, /play and /board.");
    }
  } catch (error) {
    console.error("[e2e-m2l1] FAILED:", error);
    console.error("[e2e-m2l1] server log tail:\n" + serverLog.split("\n").slice(-40).join("\n"));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 200));
  }
}

main();
