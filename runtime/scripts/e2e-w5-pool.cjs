#!/usr/bin/env node
/**
 * Browser truth for the Week 5 pool ritual in Host the League (m2l2-host-league).
 *
 * Boot/session/join/phase-advance scaffolding copied from
 * runtime/scripts/e2e-m2l2.cjs (Host the League) and
 * runtime/scripts/e2e-press-conference.cjs / e2e-w4-bill.cjs (linked-session
 * creation via raw POST /api/sessions with sourceSessionId).
 *
 * Run from runtime/ after `npm run build`:
 *   node scripts/e2e-w5-pool.cjs
 *
 * For BOTH grade bands, an UNLINKED room: six desks join, lock a week, each
 * saves a pool position (chip + line), the three weeks are played via the
 * teacher, and THE POOL's six teacher-paced stages (THE BILL LINE, FILL, THE
 * BOWL STANDS, DRAW, NET, THE FREE RIDE) are walked on the projector with the
 * assertions the assignment specifies. One LINKED 5-6 room carries a real
 * Full House session into Host the League via sourceSessionId and checks the
 * HOOK how-you-got-here card.
 *
 * Assertions are collected per bucket (`check(bucket, label, cond, detail)`)
 * rather than thrown, so one failing claim does not abort the rest of a
 * band's run or the other bands/room in this single execution — the run
 * still exits non-zero overall if anything failed.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4392);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-w5-pool-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-w5");

const LESSON_ID = "m2l2-host-league";
const FULL_HOUSE_ID = "m2l1-full-house";
const DESKS = 6;
const STAGE_NAMES = ["THE BILL LINE", "FILL", "THE BOWL STANDS", "DRAW", "NET", "THE FREE RIDE"];

/* THE POOL must fit 100vh, scroll-free, on the projector at all three shapes
 * a classroom actually runs (a 1920x1080 or 1366x768 short-throw projector,
 * or a 1024x600 Chromebook mirrored to a TV). `hlPoolFitEvidence` reopens the
 * board at each shape per stage rather than once for the whole run, since a
 * frame's height is a function of ITS OWN content, not a property of the page. */
const PROJECTOR_VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1024x600", width: 1024, height: 600 },
];
const DEFAULT_BOARD_VIEWPORT = { width: 1920, height: 1080 };
// The one element each exclusive stage frame guarantees is on screen — named
// in the BUILD spec per stage (BILL LINE's sentence headline, FILL's chart,
// THE BOWL's hero total, DRAW's shared hero, NET's always-visible page
// eyebrow, THE FREE RIDE's hero draw figure).
const STAGE_HERO_SELECTOR = {
  1: "#hlPoolBillHeadline",
  2: "#hlPoolFill",
  3: "#hlPoolBowl",
  4: "#hlPoolDrawHero",
  5: "#hlPoolNetPager",
  6: "#hlPoolFreeRideHero",
};

const consoleErrors = [];
function watchConsole(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${label}] console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/lessons`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function shoot(page, name) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREEN_DIR, `${name}.png`) }).catch(() => {});
}

/**
 * BUILD item 5, per stage: reopen the board at all three projector shapes,
 * assert the stage fits `#stage` with zero scroll and that the stage's own
 * hero element sits inside the viewport, and save one screenshot per shape.
 * Restores `DEFAULT_BOARD_VIEWPORT` before returning so the rest of this
 * band's run (paging, the next press) sees the viewport it expects.
 */
async function checkFitAcrossViewports(bucket, board, stageNo, stageName, shotPrefix) {
  const heroSel = STAGE_HERO_SELECTOR[stageNo];
  for (const vp of PROJECTOR_VIEWPORTS) {
    await board.setViewportSize({ width: vp.width, height: vp.height });
    // Let layout settle before measuring — a resize can land mid-reflow.
    await board.waitForTimeout(120);
    const measured = await board.evaluate((sel) => {
      const stageEl = document.getElementById("stage");
      const fit = stageEl ? stageEl.scrollHeight <= stageEl.clientHeight : false;
      const heroEl = sel ? document.querySelector(sel) : null;
      let heroInView = false;
      if (heroEl) {
        const r = heroEl.getBoundingClientRect();
        heroInView = r.bottom > 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0;
      }
      return { fit, scrollHeight: stageEl ? stageEl.scrollHeight : -1, clientHeight: stageEl ? stageEl.clientHeight : -1, heroPresent: !!heroEl, heroInView };
    }, heroSel);
    check(
      bucket,
      `pool stage ${stageNo}/6 (${stageName}) @ ${vp.name}: #stage fits with zero scroll`,
      measured.fit,
      `scrollHeight=${measured.scrollHeight} clientHeight=${measured.clientHeight}`,
    );
    check(
      bucket,
      `pool stage ${stageNo}/6 (${stageName}) @ ${vp.name}: the stage's own hero element (${heroSel}) is present and in the viewport`,
      measured.heroPresent && measured.heroInView,
      measured,
    );
    await shoot(board, `${shotPrefix}-${vp.name}`);
  }
  await board.setViewportSize(DEFAULT_BOARD_VIEWPORT);
  await board.waitForTimeout(60);
}

/* -------------------------------------------------------- result ledger -- */
const results = {};
let anyFail = false;
function check(bucket, label, cond, detail) {
  if (!results[bucket]) results[bucket] = [];
  results[bucket].push({ label, val: !!cond, detail });
  if (!cond) anyFail = true;
  const tag = cond ? "PASS" : "FAIL";
  console.log(`[${tag}] (${bucket}) ${label}${detail !== undefined ? ` -> ${typeof detail === "string" ? detail.slice(0, 300) : JSON.stringify(detail)}` : ""}`);
}

/* --------------------------------------------------------------- helpers -- */

async function createSessionUI(browser, lessonId, band, title) {
  const teach = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watchConsole(teach, `teach-${slug(title)}`);
  teach.on("dialog", (d) => d.accept());
  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", lessonId);
  if (band) await teach.selectOption("#gradeBand", band).catch(() => {});
  await teach.fill("#title", title);
  const respPromise = teach.waitForResponse((r) => r.url().endsWith("/api/sessions") && r.request().method() === "POST");
  await teach.click("#create");
  const resp = await respPromise;
  const body = await resp.json().catch(() => ({}));
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  return { teach, code, sessionId: body?.session?.id, teacherKey: body?.teacherKey };
}

async function createSessionRaw({ lessonModuleId, title, gradeBand, sourceSessionId, teacherKey }) {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(teacherKey ? { authorization: `Bearer ${teacherKey}` } : {}) },
    body: JSON.stringify({ lessonModuleId, title, gradeBand, ...(sourceSessionId ? { sourceSessionId } : {}) }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`createSession(${lessonModuleId}) failed: ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function controlRaw(code, teacherKey, body) {
  const res = await fetch(`${BASE}/api/sessions/${code}/control`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${teacherKey}` },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`control(${code}, ${JSON.stringify(body)}) failed: ${res.status} ${JSON.stringify(j)}`);
  return j;
}

async function advanceTo(teach, phase) {
  await teach.click("#btnAdvance");
  await teach.waitForSelector(`.phasechip.current:text('${phase}')`);
}

async function joinDesk(browser, code, name, label, viewport) {
  const p = await browser.newPage({ viewport: viewport || { width: 1366, height: 768 } });
  watchConsole(p, label);
  p.on("dialog", (d) => d.accept());
  await p.goto(`${BASE}/play`);
  await p.fill("#joinCode", code);
  await p.fill("#joinName", name);
  const respPromise = p.waitForResponse((r) => r.url().includes("/join") && r.request().method() === "POST");
  await p.click("#btnJoin");
  const resp = await respPromise;
  const body = await resp.json().catch(() => ({}));
  await p.waitForSelector("#gameCard:not([hidden])");
  await p.waitForSelector(".fh-desk-name", { timeout: 30000 });
  return { page: p, seatId: body?.seat?.id ?? null };
}

async function joinFH(browser, code, name, label) {
  const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(p, label);
  p.on("dialog", (d) => d.accept());
  await p.goto(`${BASE}/play`);
  await p.fill("#joinCode", code);
  await p.fill("#joinName", name);
  await p.click("#btnJoin");
  await p.waitForSelector("#gameCard:not([hidden])");
  await p.waitForSelector(".fh-desk-name", { timeout: 20000 });
  return p;
}

async function setDial(page, dialSel, readoutSel, price) {
  await page.waitForSelector(dialSel);
  await page.$eval(
    dialSel,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    price,
  );
  await page.waitForFunction(
    ({ sel, p }) => document.querySelector(sel)?.textContent === `$${p}`,
    { sel: readoutSel, p: price },
    { timeout: 10000 },
  );
}

async function setShareHL(page, share) {
  const clicks = share / 5;
  for (let i = 0; i < clicks; i += 1) await page.click("#hlShareUp");
  await page.waitForFunction((s) => document.getElementById("hlShareReadout")?.textContent === `${s}%`, share, { timeout: 10000 });
}

async function lockWeekHL(page) {
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

/**
 * DEFECT (found live in this run, not assumed): `renderHLPlay` in
 * play/main.ts memoizes on `` `${weekNumber}|${locked}|${history.length}` ``
 * — none of which change when a pool position is saved — so the DOM never
 * re-renders `#hlPoolCurrent` no matter how long a poll cycle waits. The
 * click submits the action to the server (confirmed via the room-wide FAIL
 * evidence below, not just this call), but the student device never shows a
 * confirmation that the save took. This helper does not throw on that
 * timeout — it reports ok:false so the calling band's run continues and the
 * rest of the pool-ritual evidence is still collected in this run.
 */
async function savePoolPosition(page, chip, line) {
  await page.waitForSelector("#hlPoolPosition", { timeout: 20000 });
  await page.click(`#hlPoolPosition .hl-pool-chip[data-chip="${chip}"]`);
  await page.fill("#hlPoolLine", line);
  await page.click("#hlPoolSubmit");
  try {
    await page.waitForFunction((l) => (document.getElementById("hlPoolCurrent")?.textContent || "").includes(l), line, { timeout: 6000 });
    return { ok: true };
  } catch {
    return { ok: false, reason: "#hlPoolCurrent never rendered the saved line within 6s — renderHLPlay's mount-key omits poolPosition, so the client never re-renders the confirmation" };
  }
}

/* ------------------------------------------------------ unlinked band run -- */

async function runUnlinkedBand(browser, band) {
  const bucket = `unlinked-${band}`;
  const title = `E2E W5 POOL ${band} ${Date.now()}`;
  const { teach, code } = await createSessionUI(browser, LESSON_ID, band, title);
  const board = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  watchConsole(board, `${band}-board`);
  await board.goto(`${BASE}/board?code=${code}`);
  await board.waitForSelector("#stage .label");

  const desks = [];
  for (let i = 0; i < DESKS; i += 1) {
    const d = await joinDesk(browser, code, `Pair ${i + 1}`, `${band}-desk${i + 1}`);
    desks.push(d);
  }
  check(bucket, "six desks joined", desks.every((d) => !!d.page), desks.map((d) => d.seatId));
  await board.waitForFunction((n) => document.querySelectorAll(".hl-club-chip.live").length >= n, DESKS, { timeout: 30000 }).catch(() => {});
  await shoot(board, `w5-${band}-board-lobby`);

  /* ---- HOOK: the levy line on the student device ---- */
  await advanceTo(teach, "HOOK");
  await desks[0].page.waitForFunction(() => !!document.getElementById("hlLevyLine"), null, { timeout: 20000 }).catch(() => {});
  const levyText = await desks[0].page.evaluate(() => (document.getElementById("hlLevyLine")?.textContent || "").trim());
  check(bucket, "play HOOK shows the levy line (#hlLevyLine)", levyText.length > 0, levyText);
  await shoot(board, `w5-${band}-board-hook`);
  await shoot(desks[0].page, `w5-${band}-play-hook`);

  /* ---- PLAY: three weeks, driven by the teacher ---- */
  await advanceTo(teach, "PLAY");
  for (const d of desks) await d.page.waitForSelector("#hlPlayRoot", { timeout: 30000 });

  const PRICES = [10, 34, 48, 62, 78, 92];
  const SHARES = [0, 10, 20, 30, 0, 15];
  const CHIPS = ["nothing", "a little", "a lot"];
  const privateWords = desks.map((_, i) => `priv${band.replace("-", "")}d${i + 1}zz`);

  for (let week = 1; week <= 3; week += 1) {
    for (const d of desks) await waitForWeek(d.page, week);
    for (let i = 0; i < DESKS; i += 1) {
      const d = desks[i].page;
      if (week === 1) {
        const preLockPanel = await d.evaluate(() => !!document.getElementById("hlPoolSubmit"));
        check(bucket, `week1 desk${i + 1}: the pool SAVE control is not offered/interactable before LOCK`, !preLockPanel, preLockPanel ? "present before lock" : "absent before lock — the panel only renders once the desk has locked");
      }
      await setDial(d, "#hlPriceDial", "#hlPriceReadout", PRICES[i]);
      await setShareHL(d, SHARES[i]);
      await lockWeekHL(d);
      if (week === 1) {
        const postLock = await d.evaluate(() => {
          const b = document.getElementById("hlPoolSubmit");
          return { present: !!b, disabled: b ? b.disabled : null };
        });
        check(bucket, `week1 desk${i + 1}: the pool SAVE control is present and enabled after LOCK`, postLock.present === true && postLock.disabled === false, postLock);
        const savedResult = await savePoolPosition(d, CHIPS[i % 3], privateWords[i]);
        check(
          bucket,
          `week1 desk${i + 1}: after SAVE, the device's own screen echoes back the saved pool position (DEFECT if this fails — see renderHLPlay mount-key note)`,
          savedResult.ok,
          savedResult.ok ? "echoed" : savedResult.reason,
        );
      }
    }
    await teach.click("#btnCloseWeek");
    if (week < 3) {
      for (const d of desks) await waitForWeek(d.page, week + 1);
    }
  }
  for (const d of desks) {
    await d.page.waitForFunction(() => !!document.querySelector("#hlSplit") && !document.querySelector("#hlLockBar"), null, { timeout: 40000 }).catch(() => {});
  }
  check(bucket, "all three weeks settled via the teacher", true, "btnCloseWeek pressed x3");

  /* ---- REVEAL: the five-stage season reveal, then THE POOL ---- */
  await advanceTo(teach, "REVEAL");
  for (let s = 1; s <= 5; s += 1) {
    await teach.click("#btnRevealNext");
    await board.waitForSelector(`#stage[data-reveal-stage="${s}"]`, { timeout: 30000 }).catch(() => {});
  }
  await shoot(teach, `w5-${band}-teach-pool-ready`);

  const seatIds = desks.map((d) => d.seatId).filter((x) => !!x);
  let netFrameSnapshotForCompare = "";

  for (let i = 1; i <= 6; i += 1) {
    const stageName = STAGE_NAMES[i - 1];
    const btnTextBefore = (await teach.textContent("#btnPoolStage").catch(() => "")).trim();
    check(bucket, `teacher shows the next pool stage's name before press ${i} of 6 (${stageName})`, btnTextBefore.includes(stageName) && btnTextBefore.includes(`(${i} of 6)`), btnTextBefore);

    const boardLabelBefore = await board.evaluate(() => document.querySelector("#stage .label")?.textContent ?? "");
    await teach.click("#btnPoolStage");
    await board
      .waitForFunction((prev) => (document.querySelector("#stage .label")?.textContent ?? "") !== prev, boardLabelBefore, { timeout: 20000 })
      .catch(() => {});
    // The frame's own motion (D63: 500ms hold + 500ms unveil + up to ~240ms
    // stagger) is real, not just a network wait — a screenshot taken right
    // after the press lands inside the hold and shows a frame with only the
    // persistent label/footer visible, which is misleading evidence of a
    // broken frame rather than a mid-animation one. Settle before reading
    // anything visual.
    await board.waitForTimeout(1300);

    const boardLabel = await board.evaluate(() => document.querySelector("#stage .label")?.textContent ?? "");
    const boardText = await board.evaluate(() => document.body.innerText);
    check(bucket, `pool stage ${i}/6: the projector label names the stage (THE POOL — ${stageName})`, boardLabel.includes(stageName), boardLabel);

    for (const id of seatIds) {
      check(bucket, `pool stage ${i}/6 (${stageName}): board text excludes seat id ${id}`, !boardText.includes(id));
    }
    for (const w of privateWords) {
      check(bucket, `pool stage ${i}/6 (${stageName}): board text excludes a private pool-position line ("${w}")`, !boardText.includes(w));
    }
    if (band === "5-6") {
      const pctHit = boardText.match(/.{0,20}%.{0,5}/);
      const negHit = boardText.match(/.{0,10}-\$.{0,10}/);
      check(bucket, `pool stage ${i}/6 (${stageName}) [5-6]: board text has no "%"`, !pctHit, pctHit ? pctHit[0] : undefined);
      check(bucket, `pool stage ${i}/6 (${stageName}) [5-6]: board text has no "-$"`, !negHit, negHit ? negHit[0] : undefined);
    }

    if (i === 1) {
      const rows = await board.evaluate(() => [...document.querySelectorAll("#hlPoolBillLine .hl-pool-row")].map((r) => r.textContent.trim()));
      check(bucket, "THE BILL LINE: one row per desk, each with a dollar figure", rows.length === DESKS && rows.every((r) => /\$/.test(r)), rows);
    }
    if (i === 2) {
      const heights = await board.evaluate(() => [...document.querySelectorAll("#hlPoolFill .hl-mean-bar")].map((el) => el.style.height));
      check(bucket, "FILL: bars IN differ in height across clubs", new Set(heights).size > 1, heights);
      const grandTotalHit = boardText.match(/grand total.{0,40}/i);
      check(bucket, "FILL: no grand total on this frame (D62 finding — that is stage 3's own reveal)", !grandTotalHit, grandTotalHit ? grandTotalHit[0] : undefined);
    }
    if (i === 3) {
      const bowlText = await board.evaluate(() => document.getElementById("hlPoolBowl")?.textContent ?? "");
      check(bucket, "THE BOWL STANDS: THE BOWL total is present with a dollar figure", /\$/.test(bowlText), bowlText.trim());
      const hasVisitorLine = (await board.$("#hlPoolVisitorLine")) !== null && /THE VISITOR LINE/i.test(boardText);
      check(bucket, "THE BOWL STANDS: THE VISITOR LINE appears at this stage", hasVisitorLine, boardText.slice(0, 500));
      const hasRoadLine = /ROAD LINE/i.test(boardText) || (await board.$("[id*='Road']")) !== null;
      check(
        bucket,
        "THE BOWL STANDS: THE ROAD LINE appears at this stage (D62 repair 1 — computed server-side by roadLineFor/roadLine in hostTheLeague.ts, same stage as visitorLine)",
        hasRoadLine,
        hasRoadLine ? "found" : "NOT FOUND on the board — client type HLPoolBoard (board/main.ts) and hlPoolRitualHtml() never read or render the `roadLine` field the module computes",
      );
    }
    if (i === 4) {
      const heights = await board.evaluate(() => [...document.querySelectorAll("#hlPoolDraw .hl-pool-drawbar")].map((el) => el.style.height));
      check(bucket, "DRAW: the six drawn bars are all the same height (equal out)", heights.length > 0 && new Set(heights).size === 1, heights);
      const ghostCount = await board.evaluate(() => document.querySelectorAll("#hlPoolDraw .hl-pool-ghost").length);
      check(bucket, "DRAW: FILL is ghosted behind the equal bars for contrast (unequal in, equal out)", ghostCount === heights.length && ghostCount > 0, ghostCount);
      const heroText = await board.evaluate(() => document.getElementById("hlPoolDrawHero")?.textContent ?? "");
      check(bucket, "DRAW: the shared draw figure is printed once, at hero scale, not six times", /\$/.test(heroText), heroText);
    }
    if (i === 5) {
      const pagerBefore = await board.evaluate(() => document.getElementById("hlPoolNetPager")?.textContent?.trim() ?? "");
      check(bucket, "NET stage 1: pager reads Group 1 of 2 (6 desks over a 5-per-page cap)", /Group 1 of 2/.test(pagerBefore), pagerBefore);
      const netP1Text = await board.evaluate(() => document.getElementById("hlPoolNet")?.innerText ?? "");
      const pageBtnVisible = await teach.isVisible("#btnPoolPage").catch(() => false);
      check(bucket, "NET stage: the teacher's page control is visible", pageBtnVisible);
      if (pageBtnVisible) {
        await teach.click("#btnPoolPage");
        await board
          .waitForFunction((prev) => (document.getElementById("hlPoolNetPager")?.textContent?.trim() ?? "") !== prev, pagerBefore, { timeout: 20000 })
          .catch(() => {});
        const pagerAfter = await board.evaluate(() => document.getElementById("hlPoolNetPager")?.textContent?.trim() ?? "");
        const netP2Text = await board.evaluate(() => document.getElementById("hlPoolNet")?.innerText ?? "");
        check(bucket, "NET stage: pressing the page control advances to Group 2 of 2", /Group 2 of 2/.test(pagerAfter), pagerAfter);
        check(bucket, "NET stage: page 2's frame text is visibly different from page 1's", netP2Text.length > 0 && netP2Text !== netP1Text, { p1: netP1Text.slice(0, 200), p2: netP2Text.slice(0, 200) });
        await shoot(board, `w5-${band}-board-net-page2`);
        await teach.click("#btnPoolPageBack");
        await board
          .waitForFunction((prev) => (document.getElementById("hlPoolNetPager")?.textContent?.trim() ?? "") !== prev, pagerAfter, { timeout: 20000 })
          .catch(() => {});
      }
      netFrameSnapshotForCompare = await board.evaluate(() => document.getElementById("hlPoolFrame")?.innerText ?? "");
    }
    if (i === 6) {
      const rows = await board.evaluate(() => [...document.querySelectorAll("#hlPoolFreeRide .hl-pool-row")].map((r) => r.textContent.trim()));
      check(bucket, "THE FREE RIDE renders (2-3 rows) and is the last stage pressed", rows.length >= 2 && rows.length <= 3, rows);
      const heroText = await board.evaluate(() => document.getElementById("hlPoolFreeRideHero")?.textContent ?? "");
      check(bucket, "THE FREE RIDE has a headline (its top row's drawn total at hero scale)", /\$/.test(heroText), heroText);
      const freeRideFrameText = await board.evaluate(() => document.getElementById("hlPoolFrame")?.innerText ?? "");
      check(
        bucket,
        "THE FREE RIDE's frame is visibly different from NET's frame",
        freeRideFrameText.length > 0 && freeRideFrameText !== netFrameSnapshotForCompare,
        { net: netFrameSnapshotForCompare.slice(0, 200), freeRide: freeRideFrameText.slice(0, 200) },
      );
    }
    await checkFitAcrossViewports(bucket, board, i, stageName, `w5-${band}-board-${slug(stageName)}`);
  }

  const btnTextEnd = (await teach.textContent("#btnPoolStage").catch(() => "")).trim();
  const btnDisabledEnd = await teach.isDisabled("#btnPoolStage").catch(() => false);
  check(bucket, "teacher's pool-stage control disables once every stage has played", btnDisabledEnd, btnTextEnd);
  check(bucket, 'teacher\'s pool-stage control reads "Every pool stage has played" at the end', /every pool stage has played/i.test(btnTextEnd), btnTextEnd);
  await shoot(teach, `w5-${band}-teach-pool-end`);

  const bandErrors = consoleErrors.filter((e) => e.includes(`[${band}-`));
  check(bucket, "zero console/page errors on this band's play/board/teach surfaces", bandErrors.length === 0, bandErrors.join(" | "));

  if (!results[bucket].some((r) => !r.val)) console.log(`OK w5-pool ${band} unlinked`);
}

/* --------------------------------------------------------- linked 5-6 room -- */

async function runLinkedRoom(browser) {
  const bucket = "linked-5-6";
  const fh = await createSessionUI(browser, FULL_HOUSE_ID, "5-6", `E2E W5 LINKED FH ${Date.now()}`);
  const f1 = await joinFH(browser, fh.code, "Pair 1", "linked-fh-d1");
  const f2 = await joinFH(browser, fh.code, "Pair 2", "linked-fh-d2");

  await fh.teach.click("#btnAdvance"); // HOOK
  await fh.teach.waitForSelector(".phasechip.current:text('HOOK')");
  await fh.teach.click("#btnAdvance"); // PLAY
  await fh.teach.waitForSelector(".phasechip.current:text('PLAY')");
  await f1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
  await f2.waitForSelector("#fhPlayRoot", { timeout: 20000 });

  await setDial(f1, "#fhPriceDial", "#fhPriceReadout", 48);
  await f1.click("#fhLock");
  await f1.waitForSelector(".fh-locked-recap", { timeout: 20000 });
  await setDial(f2, "#fhPriceDial", "#fhPriceReadout", 34);
  await f2.click("#fhLock");
  await f2.waitForSelector(".fh-locked-recap", { timeout: 20000 });

  await fh.teach.click("#btnCloseNight");
  await new Promise((r) => setTimeout(r, 600));
  check(bucket, "Full House (m2l1-full-house) played to at least one settled night via the teacher", true, `night 1 closed on session ${fh.code}`);

  if (!fh.sessionId || !fh.teacherKey) {
    check(bucket, "captured the Full House session id + teacher key needed to link Host the League", false, { sessionId: fh.sessionId, hasKey: !!fh.teacherKey });
    console.log("OK w5-pool linked-5-6 -- NOT VERIFIED (could not capture source session id/teacher key; see FAIL above)");
    return;
  }

  await controlRaw(fh.code, fh.teacherKey, { type: "end" });
  check(bucket, "the Full House session was ended before being used as a Week 4 link", true);

  const hl = await createSessionRaw({
    lessonModuleId: LESSON_ID,
    title: `E2E W5 LINKED HL ${Date.now()}`,
    gradeBand: "5-6",
    sourceSessionId: fh.sessionId,
    teacherKey: fh.teacherKey,
  });
  const hlCode = hl.session.code;
  const hlTeacherKey = hl.teacherKey;
  check(bucket, "Host the League session created linked via sourceSessionId (raw API — /teach has no UI wiring for this link)", true, `code=${hlCode}`);

  const h1 = await joinDesk(browser, hlCode, "Pair A", "linked-hl-d1");
  const h2 = await joinDesk(browser, hlCode, "Pair B", "linked-hl-d2");
  await controlRaw(hlCode, hlTeacherKey, { type: "advance" }); // HOOK
  await h1.page.waitForFunction(() => !!document.getElementById("hlLevyLine") || !!document.getElementById("hlHowYouGotHere"), null, { timeout: 20000 }).catch(() => {});
  await h2.page.waitForFunction(() => !!document.getElementById("hlLevyLine") || !!document.getElementById("hlHowYouGotHere"), null, { timeout: 20000 }).catch(() => {});

  const text1 = await h1.page.evaluate(() => document.body.innerText);
  const text2 = await h2.page.evaluate(() => document.body.innerText);
  const combined = `${text1}\n${text2}`;
  const cardPresent = (await h1.page.$("#hlHowYouGotHere")) !== null || (await h2.page.$("#hlHowYouGotHere")) !== null;
  check(bucket, "the HOOK how-you-got-here card renders (#hlHowYouGotHere) on at least one desk", cardPresent, cardPresent ? "present" : "ABSENT on both linked desks");
  check(bucket, "the how-you-got-here card shows a cash-opening dollar figure", /Opening cash/i.test(combined) && /\$-?[\d,]+/.test(combined), combined.slice(0, 400));
  const stockHit = combined.match(/.{0,60}stock.{0,60}/i);
  check(bucket, 'the seed note does not say "stock"', !stockHit, stockHit ? stockHit[0] : "no match");
  await shoot(h1.page, "w5-5-6-play-linked-hook");

  const linkedErrors = consoleErrors.filter((e) => e.includes("[linked-"));
  check(bucket, "zero console/page errors on the linked-room surfaces", linkedErrors.length === 0, linkedErrors.join(" | "));

  if (!results[bucket].some((r) => !r.val)) console.log("OK w5-pool linked-5-6");
}

/* ------------------------------------------------------------------ main -- */

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await assertPortFree(PORT, path.basename(__filename));

  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  const browser = await chromium.launch();
  try {
    await waitForServer();

    try {
      await runUnlinkedBand(browser, "5-6");
    } catch (e) {
      check("unlinked-5-6", "band threw before completing", false, e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : String(e));
    }

    try {
      await runUnlinkedBand(browser, "7-8");
    } catch (e) {
      check("unlinked-7-8", "band threw before completing", false, e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : String(e));
    }

    try {
      await runLinkedRoom(browser);
    } catch (e) {
      check("linked-5-6", "linked-room flow threw before completing", false, e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : String(e));
      console.log("OK w5-pool linked-5-6 -- NOT VERIFIED (see FAIL above; linked-room flow threw)");
    }

    check("global", "zero console/page errors across the whole run", consoleErrors.length === 0, consoleErrors.slice(0, 20).join("\n"));
  } finally {
    await browser.close();
    server.kill("SIGTERM");
    try {
      fs.rmSync(SNAPSHOT_FILE, { force: true });
    } catch {
      /* best effort */
    }
  }

  console.log("\n\n================ FINAL RESULTS ================");
  for (const [b, list] of Object.entries(results)) {
    const fails = list.filter((r) => !r.val).length;
    console.log(`\n-- ${b} — ${list.length - fails}/${list.length} passed --`);
    for (const r of list) {
      if (!r.val) console.log(`  [FAIL] ${r.label}${r.detail !== undefined ? ` -> ${typeof r.detail === "string" ? r.detail.slice(0, 400) : JSON.stringify(r.detail)}` : ""}`);
    }
  }
  console.log(`\nconsole/page errors captured: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 40)) console.log("  " + e);
  console.log("\nserver log tail:\n" + serverLog.slice(-1500));

  if (anyFail) {
    console.error("\n[e2e-w5-pool] FAIL — see FAIL lines above");
    process.exit(1);
  }
  console.log("\n[e2e-w5-pool] PASS");
}

main().catch((e) => {
  console.error("[e2e-w5-pool] HARNESS THREW:", e);
  process.exit(1);
});
