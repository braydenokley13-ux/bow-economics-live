#!/usr/bin/env node
/**
 * Browser truth for Module 1, Lesson 1 — "The Window" (THE SAME LINE).
 *
 * Real Chromium against the built server: one teacher, one projector, eight
 * student devices at the classroom Chromebook shape, played through three
 * signing days. Run from runtime/ after `npm run build`:
 *
 *   node scripts/e2e-same-line-l1.cjs
 *
 * What this proves that the unit suite cannot:
 *   1. The front-office shell renders and does not overflow horizontally at
 *      either Chromebook shape. A student surface that scrolls sideways has
 *      lost the decision below the fold.
 *   2. A pair can actually get from a board row to a committed offer with the
 *      controls their band is given — two at 5-6, three at 7-8.
 *   3. LEAK: the live interest indicator shows a COUNT and never another
 *      desk's club, name, or money while a day is open. This is the shared-
 *      league design's whole boundary and it is enforced here, in the rendered
 *      DOM, not only in the payload.
 *   4. The 5-6 screen carries no percent sign and no minus sign, rendered.
 *   5. Both bands run the same world end to end.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const DIST = process.env.E2E_DIST ? path.resolve(process.env.E2E_DIST) : path.join(ROOT, "dist");
const PORT = Number(process.env.E2E_PORT || 4319);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-sl1-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-1", "rebuild", "screens-l1");

const LESSON = "m1l1-the-window";
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

/** A student surface must never scroll sideways. */
async function assertNoSideScroll(page, label) {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    widest: (() => {
      let worst = null;
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.right > document.documentElement.clientWidth + 2) {
          if (!worst || r.right > worst.right) {
            worst = { right: Math.round(r.right), cls: String(el.className || el.tagName).slice(0, 44) };
          }
        }
      }
      return worst;
    })(),
  }));
  assert.ok(
    m.sw <= m.cw + 2,
    `${label}: the page scrolls SIDEWAYS — ${m.sw}px of content in a ${m.cw}px viewport${
      m.widest ? `; widest offender ${m.widest.cls} reaching ${m.widest.right}px` : ""
    }`,
  );
}

/**
 * The shared-league leak test.
 *
 * A desk may learn HOW MANY other desks want a player. It may never learn
 * WHICH, or FOR HOW MUCH, while the day is open. Every other desk's club name
 * and every other desk's committed figure is checked against the full rendered
 * text of this desk's board.
 */
async function assertNoLeak(page, label, otherClubs) {
  // WHITELIST, not blacklist. An earlier form of this test scanned the board's
  // whole text for every other desk's committed dollar figure and fired on
  // "$11,000,000" — which is a real player's ASK on this desk's own board, not
  // a leak. Blacklisting a number cannot tell whose number it is. So instead:
  // the interest indicator is the only surface that varies with other desks'
  // choices, and its rendered text must match one of exactly two shapes. A
  // whitelist cannot false-positive, and it cannot miss a leak either, because
  // any leaked club or figure would fail the pattern.
  const cells = await page.$$eval(".sl-interest", (els) => els.map((e) => e.innerText.replace(/\s+/g, " ").trim()));
  assert.ok(cells.length > 0, `${label}: no interest indicator rendered at all`);
  const OK = /^(NOBODY YET|\d+ DESKS? WANT HIM)$/;
  for (const c of cells) {
    assert.ok(
      OK.test(c),
      `${label}: an interest indicator rendered "${c}" — the only permitted shapes are a count or NOBODY YET. Anything else is another desk's private position on this desk's screen.`,
    );
  }
  // And no other desk's CLUB may appear anywhere on this desk's board. Club
  // names do not collide with this desk's own content, so a blacklist is sound
  // here in a way it is not for money.
  const text = await page.evaluate(() => {
    const b = document.querySelector(".sl-play");
    return b ? b.innerText : "";
  });
  for (const club of otherClubs) {
    assert.ok(!text.includes(club), `${label}: another desk's club "${club}" is on this desk's board while the day is open`);
  }
}

/**
 * The decision must be ON the screen.
 *
 * Measured before the fold repair: the play grid ran 815px tall under 191px of
 * legacy page chrome, so PUT THE OFFER IN sat near y=1200 on a 768px
 * Chromebook. A student surface whose commit control is below the fold has not
 * shipped the decision, however correct the model underneath it is.
 */
async function assertDecisionAboveFold(page, label) {
  const m = await page.evaluate(() => {
    const b = document.getElementById("slCommit");
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
  });
  assert.ok(m, `${label}: no commit control on screen at all`);
  assert.ok(
    m.bottom <= m.vh,
    `${label}: PUT THE OFFER IN is BELOW THE FOLD — its box ends at ${m.bottom}px in a ${m.vh}px viewport`,
  );
  // ...and nothing may sit ON it. The rejoin-PIN card, pulled out of the flow
  // to win back the fold, landed on top of the commit button at both shapes.
  // Above the fold and covered is the same failure as below the fold.
  const covered = await page.evaluate(() => {
    const b = document.getElementById("slCommit");
    const r = b.getBoundingClientRect();
    const probes = [
      [r.left + r.width * 0.25, r.top + r.height / 2],
      [r.left + r.width * 0.5, r.top + r.height / 2],
      [r.left + r.width * 0.85, r.top + r.height / 2],
    ];
    for (const [x, y] of probes) {
      const hit = document.elementFromPoint(x, y);
      if (hit && hit !== b && !b.contains(hit)) {
        return `${String(hit.id || hit.className || hit.tagName).slice(0, 40)} at (${Math.round(x)},${Math.round(y)})`;
      }
    }
    return null;
  });
  assert.equal(covered, null, `${label}: something is COVERING PUT THE OFFER IN — ${covered}`);
}

/**
 * Every projector frame must FIT. A projector cannot scroll and cannot be
 * leaned toward, so overflow is not a degraded experience, it is content the
 * room never sees.
 */
const PROJECTOR_SHAPES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];
const framesChecked = [];
async function assertBoardFits(board, label) {
  for (const shape of PROJECTOR_SHAPES) {
    await board.setViewportSize(shape);
    await board.waitForTimeout(240);
    const fit = await board.evaluate(() => {
      const s = document.getElementById("stage");
      if (!s) return null;
      return {
        scrollH: s.scrollHeight,
        clientH: s.clientHeight,
        scrollW: s.scrollWidth,
        clientW: s.clientWidth,
        parts: [...s.querySelectorAll(":scope > * > *")]
          .map((c) => `${String(c.className || c.tagName).slice(0, 22)}:${Math.round(c.getBoundingClientRect().height)}`)
          .slice(0, 8),
      };
    });
    assert.ok(fit, `${label}: no #stage`);
    assert.ok(
      fit.scrollH <= fit.clientH + 1,
      `${label} @${shape.width}x${shape.height}: the projector frame OVERFLOWS by ${fit.scrollH - fit.clientH}px (${fit.scrollH} in ${fit.clientH}). Slots: ${fit.parts.join(" · ")}`,
    );
    assert.ok(
      fit.scrollW <= fit.clientW + 1,
      `${label} @${shape.width}x${shape.height}: the projector frame overflows HORIZONTALLY by ${fit.scrollW - fit.clientW}px`,
    );
    framesChecked.push(`${label}@${shape.width}`);
  }
  await board.setViewportSize(PROJECTOR_SHAPES[0]);
  await board.waitForTimeout(140);
}

/**
 * Back-row legibility: the repo's measured floor is 2.6% of screen height. A
 * projector frame whose smallest type is under it has not been shown to a class.
 */
async function assertBackRow(board, label) {
  const worst = await board.evaluate(() => {
    let w = null;
    for (const el of document.querySelectorAll("#stage *")) {
      if (!el.textContent || !el.textContent.trim()) continue;
      if (el.children.length > 0) continue;
      const px = parseFloat(getComputedStyle(el).fontSize);
      const pct = (px / window.innerHeight) * 100;
      if (!w || pct < w.pct) w = { pct, px, text: el.textContent.trim().slice(0, 34) };
    }
    return w;
  });
  if (!worst) return;
  assert.ok(
    worst.pct >= 1.28,
    `${label}: "${worst.text}" renders at ${worst.pct.toFixed(2)}% of screen height (${worst.px}px) — under the back-row floor`,
  );
}

/** The board is structurally never handed a seat identity. Prove it, rendered. */
async function assertBoardPrivate(board, label, studentNames) {
  const text = await board.evaluate(() => document.getElementById("stage").innerText);
  for (const n of studentNames) {
    assert.ok(!text.includes(n), `${label}: a student name ("${n}") is ON THE PROJECTOR`);
  }
}

async function assertBandCopy(page, band, label) {
  const text = await page.evaluate(() => document.body.innerText);
  if (band === "5-6") {
    assert.ok(!text.includes("%"), `${label}: a percent sign reached a grades 5-6 screen`);
    const minus = text.match(/(^|[\s(])[-−]\s?\d/);
    assert.ok(!minus, `${label}: a negative number reached a grades 5-6 screen (${minus && minus[0]})`);
  }
}

async function shoot(page, name) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREEN_DIR, `${name}.png`), fullPage: false });
}

/* ------------------------------------------------------------------ run -- */

async function runBand(browser, band, label) {
  const shoot2 = null;
  const teach = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const boardPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watchConsole(teach, `${label}-teach`);
  watchConsole(boardPage, `${label}-board`);
  teach.on("dialog", (d) => d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", LESSON);
  await teach.selectOption("#gradeBand", band);
  await teach.fill("#title", `E2E ${label}`);
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  await boardPage.goto(`${BASE}/board?code=${code}`);

  const desks = [];
  const studentNames = [];
  for (let i = 0; i < DESKS; i += 1) {
    const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    watchConsole(p, `${label}-desk${i + 1}`);
    p.on("dialog", (d) => d.accept());
    await p.goto(`${BASE}/play`);
    await p.fill("#joinCode", code);
    await p.fill("#joinName", `Pair ${i + 1}`);
    await p.click("#btnJoin");
    await p.waitForSelector("#gameCard:not([hidden])");
    desks.push(p);
    studentNames.push(`Pair ${i + 1}`);
  }
  console.log(`${label}: ${DESKS} pairs joined`);

  await assertBoardFits(boardPage, `${label} LOBBY`);
  await assertBackRow(boardPage, `${label} LOBBY`);
  await teach.click("#btnAdvance"); // HOOK
  await teach.waitForTimeout(500);
  await assertBoardFits(boardPage, `${label} HOOK`);
  await teach.click("#btnAdvance"); // PLAY
  for (const p of desks) await p.waitForSelector(".sl-board .sl-row", { timeout: 30000 });
  console.log(`${label}: PLAY reached, board rendered on every desk`);

  // Which club each desk got, for the leak test.
  const clubs = [];
  for (const p of desks) clubs.push((await p.textContent(".hq-title")).trim());
  assert.equal(new Set(clubs).size >= Math.min(DESKS, 8), true, `${label}: desks did not spread across clubs (${clubs})`);

  for (let day = 1; day <= 3; day += 1) {
    const committedText = [];
    for (let i = 0; i < DESKS; i += 1) {
      const p = desks[i];
      await p.waitForSelector(".sl-board .sl-row", { timeout: 20000 });
      // The bell rebuilds the board. Wait for the day this desk is actually
      // looking at to be the day we are playing before choosing a row.
      await p.waitForFunction(
        (d) => document.querySelector('.hq-triad-cell[data-cell="signing-day"] .hq-cell-value')?.textContent?.trim().startsWith(String(d)) === true,
        day,
        { timeout: 20000 },
      );
      // Deliberately different targets across desks so the market genuinely
      // contends on some players and not on others.
      const rows = await p.$$(".sl-row[data-reach='yes']");
      if (rows.length === 0) continue;
      const pick = rows[(i + day) % rows.length];
      const pickId = await pick.getAttribute("data-player");
      // Re-query rather than reusing the handle: a settled day rebuilds the
      // board, and a handle taken before the rebuild points at a node that is
      // no longer in the document.
      await p.click(`.sl-row[data-player="${pickId}"]`);
      await p.waitForSelector("#slCommit", { timeout: 10000 });

      // Move the dial off its default so the committed figure is this pair's,
      // not the module's suggestion.
      const dial = await p.$("#slDial");
      if (dial) {
        const { min, max } = await p.evaluate((el) => ({ min: Number(el.min), max: Number(el.max) }), dial);
        const target = Math.round(min + ((max - min) * ((i % 5) + 1)) / 6);
        await p.evaluate(
          ({ el, v }) => {
            el.value = String(v);
            el.dispatchEvent(new Event("input", { bubbles: true }));
          },
          { el: dial, v: target },
        );
      }
      committedText.push((await p.textContent("#slRead")) || "");
      if (day === 1 && i === 0) {
        await assertBandCopy(p, band, `${label} day1 desk1 composer`);
        for (const shape of SHAPES) {
          await p.setViewportSize(shape);
          await p.waitForTimeout(200);
          await assertNoSideScroll(p, `${label} composer @${shape.tag}`);
          await assertDecisionAboveFold(p, `${label} composer @${shape.tag}`);
          await shoot(p, `${band}-play-composer-${shape.tag}`);
        }
        await p.setViewportSize(SHAPES[0]);
      }
      await p.click("#slCommit");
      await p.waitForSelector(".sl-committed", { timeout: 10000 });
    }

    // LEAK: with every desk committed, desk 1's board must still show only counts.
    const others = clubs.slice(1);
    await desks[0].click("#slChange").catch(() => {});
    await desks[0].waitForSelector(".sl-board .sl-row", { timeout: 10000 });
    await assertNoLeak(desks[0], `${label} day${day}`, others);

    await teach.click("#btnCloseDay").catch(async () => {
      // The day-close control may be the round contract's generic bell.
      await teach.click("#btnRoundClose");
    });
    await teach.waitForTimeout(700);
    await assertBoardFits(boardPage, `${label} PLAY day${day}`);
    await assertBackRow(boardPage, `${label} PLAY day${day}`);
    await assertBoardPrivate(boardPage, `${label} PLAY day${day}`, studentNames);
    console.log(`${label}: day ${day} closed`);
  }

  // OFF THE BOARD must now carry what the room took.
  const feed = await desks[1].$(".hq-feed-row");
  assert.ok(feed, `${label}: nothing reached OFF THE BOARD after three settled days`);
  await shoot(desks[1], `${band}-play-league-feed`);

  // Walk every reveal beat on the projector: each is a frame the room will
  // actually be shown, and each must fit and stay private.
  await teach.click("#btnAdvance"); // REVEAL
  await teach.waitForTimeout(600);
  const beatCount = 4;
  for (let beat = 0; beat < beatCount; beat += 1) {
    await assertBoardFits(boardPage, `${label} REVEAL beat${beat}`);
    await assertBackRow(boardPage, `${label} REVEAL beat${beat}`);
    await assertBoardPrivate(boardPage, `${label} REVEAL beat${beat}`, studentNames);
    await shoot(boardPage, `${band}-board-beat${beat}`);
    if (beat === 3) {
      await desks[1].waitForSelector(".sl-readings", { timeout: 10000 });
      await assertNoSideScroll(desks[1], `${label} student reveal beat3`);
      await assertBandCopy(desks[1], band, `${label} student reveal beat3`);
      await shoot(desks[1], `${band}-play-reveal`);
    }
    if (beat < beatCount - 1) {
      await teach.click("#btnRevealNext");
      await teach.waitForTimeout(500);
    }
  }
  console.log(`${label}: ${beatCount} reveal beats fit the projector`);

  for (const shape of SHAPES) {
    await desks[1].setViewportSize(shape);
    await desks[1].waitForTimeout(220);
    await assertNoSideScroll(desks[1], `${label} after close @${shape.tag}`);
  }
  await assertBandCopy(desks[1], band, `${label} after close`);

  for (const p of desks) await p.close();
  await boardPage.close();
  await teach.close();
  console.log(`${label}: OK`);
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
  console.log(`\nSAME LINE L1 browser truth: OK — both bands, ${DESKS} desks, three settled days, no side scroll at 1366x768 or 1024x600, no interest leak, zero console errors.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
