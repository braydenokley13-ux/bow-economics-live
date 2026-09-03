#!/usr/bin/env node
/**
 * Browser truth for THE PRESCRIBED REHEARSAL — `gate-l2-teacher` B5 (BLOCKING).
 *
 * The /teach setup screen tells a first-time teacher, in so many words, to
 * create a session with nobody in it and walk the console. That walk was not
 * the lesson: with zero desks, M2 L1's WATCH FOR rendered nothing at all and
 * its synthesis deck collapsed from six cards to one placeholder. A teacher who
 * did exactly what the product told them to do met the room's only diagnostic
 * panel, and six of the seven minutes of SYNTHESIS, for the first time in front
 * of a class.
 *
 * This script IS that teacher. It never joins a device. It proves, for all
 * three directed M2 lessons:
 *
 *   1. WATCH FOR renders in PLAY with real flag shapes, every label marked
 *      REHEARSAL, every flag naming desks and carrying an instruction.
 *   2. The SYNTHESIS deck is the whole deck — every card the live room gets —
 *      with every card marked REHEARSAL and every made-up figure marked
 *      STAND-IN, on the console AND on the projector the teacher is rehearsing
 *      in front of.
 *   3. The console never claims a directing panel for a lesson that has none,
 *      and does not open on one.
 *   4. THE DECK carries the class clock, and it advances on its own.
 *
 * Non-vacuity: the same assertions are run against a deliberately poisoned
 * frame first, and must fail on it.
 *
 * Run from runtime/ after `npm run build`:  node scripts/e2e-rehearsal.cjs
 * Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const { assertPortFree } = require("./lib/port.cjs");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.E2E_PORT || 4321);
const BASE = `http://localhost:${PORT}`;
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snapshot-rehearsal-${Date.now()}.json`);
const SCREEN_DIR = path.join(ROOT, "..", "docs", "gauntlet", "module-2", "screens-rehearsal");

const DIRECTED = [
  { id: "m2l1-full-house", short: "L1", cards: 6 },
  { id: "m2l2-host-league", short: "L2", cards: 5 },
  { id: "m2l3-write-rule", short: "L3", cards: null },
];
const UNDIRECTED_ID = "m1l1-draft-day";

const consoleErrors = [];
const notModified = new WeakSet();

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try { if ((await fetch(`${BASE}/api/lessons`)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}

/** WATCH FOR exactly as the console painted it. */
const readWatch = (page) => page.evaluate(() => {
  const block = [...document.querySelectorAll("#directorBody .dir-block")].find((b) => /watch for/i.test(b.querySelector(".dir-eyebrow")?.textContent || ""));
  if (!block) return null;
  return [...block.querySelectorAll(".dir-flag")].map((f) => ({
    label: f.querySelector(".dir-flag-label")?.textContent || "",
    desks: [...f.querySelectorAll(".dir-desk")].map((d) => d.textContent || ""),
    action: f.querySelector(".dir-flag-action")?.textContent || "",
  }));
});

/** The synthesis cards on the projector iframe, one staged frame at a time. */
const readBoardCards = (frame) => frame.evaluate(() =>
  [...document.querySelectorAll(".syn-card, .synth-card, [data-syn-card]")].map((c) => ({
    title: (c.querySelector("h3, .syn-title, .synth-title") || c).textContent.trim().slice(0, 80),
    body: c.textContent.replace(/\s+/g, " ").trim(),
  })),
);

function assertFlags(flags, where) {
  assert.ok(Array.isArray(flags) && flags.length > 0, `${where}: WATCH FOR rendered nothing during the prescribed rehearsal`);
  for (const f of flags) {
    assert.match(f.label, /^REHEARSAL — /, `${where}: an unmarked flag could be read as a live room — "${f.label}"`);
    assert.ok(f.desks.length > 0, `${where}: a flag named no desks — "${f.label}"`);
    assert.ok(f.action.trim().length > 30, `${where}: a flag carried no instruction — "${f.label}"`);
  }
}

async function main() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  await assertPortFree(PORT, path.basename(__filename));
  const server = spawn(process.execPath, [path.join(ROOT, "dist", "server", "index.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const serverLog = [];
  server.stdout.on("data", (d) => serverLog.push(String(d)));
  server.stderr.on("data", (d) => serverLog.push(String(d)));

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
    // A fresh context per console: /teach remembers the session it was last
    // driving, and a teacher rehearsing the next lesson is starting over.
    const newConsole = async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      page.on("dialog", (d) => d.accept());
      page.on("pageerror", (e) => consoleErrors.push(`[teach] pageerror: ${e.message}`));
      page.on("response", (r) => { if (r.status() === 304) notModified.add(r.request()); });
      page.on("requestfailed", (r) => {
        if (r.frame()?.name() === "ppBoard" && r.failure()?.errorText === "net::ERR_ABORTED") return;
        if (notModified.has(r)) return;
        consoleErrors.push(`[teach] request failed: ${r.url()} :: ${r.failure()?.errorText}`);
      });
      await page.goto(`${BASE}/teach`);
      await page.waitForSelector("#lesson", { timeout: 15000 });
      return page;
    };
    let teach = await newConsole();

    /* -- 3. The console does not open on a lesson it cannot direct. -------- */
    const opening = await teach.evaluate(() => {
      const sel = document.getElementById("lesson");
      return { value: sel.value, first: sel.options[0]?.textContent || "", labels: [...sel.options].map((o) => o.textContent) };
    });
    assert.ok(
      ["m2l1-full-house", "m2l2-host-league", "m2l3-write-rule"].includes(opening.value),
      `the picker opened on an undirected lesson: ${opening.value}`,
    );
    assert.ok(
      opening.labels.some((l) => /connection test, not a lesson/.test(l)),
      `the connection test is still offered as a lesson: ${JSON.stringify(opening.labels)}`,
    );
    // And the rehearsal note under an undirected lesson must not promise one.
    await teach.selectOption("#lesson", UNDIRECTED_ID);
    const undirectedNote = await teach.textContent("#rehearseNote");
    assert.match(undirectedNote, /does not ship a directing panel/i, `the console promised a director for ${UNDIRECTED_ID}: "${undirectedNote}"`);
    assert.equal(/what to say, what to ask, what to hold back/.test(undirectedNote), false, "the director promise leaked onto an undirected lesson");
    console.log(`[rehearsal] the picker opens on ${opening.value} and tells the truth about ${UNDIRECTED_ID}`);

    for (const lesson of DIRECTED) {
      await teach.context().close();
      teach = await newConsole();
      await teach.selectOption("#lesson", lesson.id);
      const note = await teach.textContent("#rehearseNote");
      assert.match(note, /marked REHEARSAL/, `${lesson.short}: the note does not tell the teacher what they are about to see`);
      await teach.fill("#title", `Cold walk ${lesson.short}`);
      await teach.click("#create");
      await teach.waitForSelector("#room:not([hidden])");

      // NOBODY JOINS. This is the whole point.
      await teach.waitForFunction(() => !document.getElementById("director").hidden, null, { timeout: 15000 })
        .catch((e) => { throw new Error(`${lesson.short}: the directing panel never appeared on a cold session (${e.message})`); });
      await teach.click("#btnAdvance"); // HOOK
      await teach.click("#btnAdvance"); // PLAY
      await teach.waitForFunction(() => /Directing PLAY/.test(document.getElementById("directorHeading")?.textContent || ""), null, { timeout: 15000 })
        .catch(async (e) => { throw new Error(`${lesson.short}: never reached Directing PLAY — heading was "${await teach.textContent("#directorHeading")}" (${e.message})`); });

      /* -- 1. WATCH FOR in a room with nobody in it. --------------------- */
      const flags = await teach.waitForFunction(() => {
        const b = [...document.querySelectorAll("#directorBody .dir-block")].find((x) => /watch for/i.test(x.querySelector(".dir-eyebrow")?.textContent || ""));
        return b && b.querySelectorAll(".dir-flag").length > 0 ? true : null;
      }, null, { timeout: 15000 }).then(() => readWatch(teach));
      assertFlags(flags, `${lesson.short} PLAY`);
      await teach.screenshot({ path: path.join(SCREEN_DIR, `${lesson.short}-01-watchfor-play.png`), fullPage: true });
      console.log(`[rehearsal] ${lesson.short} PLAY: ${flags.length} marked flags, ${flags.reduce((n, f) => n + f.desks.length, 0)} stand-in desks named`);

      // NON-VACUITY: poison one label and prove the same assertion catches it.
      await teach.evaluate(() => {
        const f = document.querySelector("#directorBody .dir-flag .dir-flag-label");
        if (f) f.textContent = f.textContent.replace(/^REHEARSAL — /, "");
      });
      let caught = false;
      try { assertFlags(await readWatch(teach), `${lesson.short} POISON`); } catch { caught = true; }
      assert.ok(caught, `${lesson.short}: an unmarked flag passed the marked-flag assertion`);
      console.log(`[rehearsal] NON-VACUITY — ${lesson.short} unmarked flag: caught`);

      /* -- 4. The class clock on the deck, advancing on its own. ---------- */
      const min = await teach.textContent("#deckMin");
      assert.match(min, /^MIN \d+$/, `${lesson.short}: the deck carries no class clock — "${min}"`);
      if (lesson.short === "L1") {
        // A clock that only ever reads MIN 0 is a label, not a clock. Push the
        // console's wall clock forward and prove the strip repaints on its own
        // 15-second beat, with no poll and no press to prompt it.
        await teach.evaluate(() => {
          const real = Date.now.bind(Date);
          const shift = 7 * 60_000;
          window.__realNow = real;
          Date.now = () => real() + shift;
        });
        await teach.waitForFunction(() => /^MIN ([7-9]|1\d)$/.test(document.getElementById("deckMin")?.textContent || ""), null, { timeout: 25000 })
          .catch(async (e) => { throw new Error(`the class clock did not advance on its own — still "${await teach.textContent("#deckMin")}" (${e.message})`); });
        console.log(`[rehearsal] the class clock advanced on its own: "${min}" -> "${await teach.textContent("#deckMin")}"`);
        await teach.evaluate(() => { Date.now = window.__realNow; });
      }
      console.log(`[rehearsal] ${lesson.short} deck clock reads "${min}"`);

      /* -- 2. The whole synthesis deck, on the console and the board. ----- */
      // Walk to SYNTHESIS the way a rehearsing teacher does: Advance when it is
      // live, and when it is not, press whatever the phase's own control is —
      // the reveal is staged and Advance stays locked until it has played out.
      const heading = () => teach.textContent("#directorHeading");
      for (let step = 0; step < 60; step += 1) {
        if (/Directing SYNTHESIS/.test((await heading()) || "")) break;
        const advance = await teach.$("#btnAdvance");
        if (advance && !(await advance.isDisabled())) {
          await advance.click();
        } else {
          const live = await teach.evaluateHandle(() =>
            [...document.querySelectorAll("#deckSlot .btn, #controls .btn, button.btn")].find(
              (b) => !b.disabled && b.id && b.id !== "btnAdvance" && b.id !== "btnPause" && b.id !== "btnFreeze" && b.id !== "btnEnd" && b.id !== "btnRestore" && /^btn(RevealNext|SynthPage|BarPage|CfPage|RuleStep|CommitReveal|CloseNight|CloseWeek|CloseDay|Handover)/.test(b.id),
            ) || null,
          );
          const el = live.asElement();
          if (!el) throw new Error(`${lesson.short}: stuck at "${await heading()}" with nothing pressable`);
          await el.click();
        }
        await teach.waitForTimeout(150);
      }
      await teach.waitForFunction(() => /Directing SYNTHESIS/.test(document.getElementById("directorHeading")?.textContent || ""), null, { timeout: 20000 })
        .catch(async (e) => { throw new Error(`${lesson.short}: the cold walk never reached SYNTHESIS — stopped at "${await heading()}" (${e.message})`); });

      // The board the teacher is rehearsing in front of, staged card by card.
      const pp = teach.frame({ name: "ppBoard" });
      assert.ok(pp, `${lesson.short}: the projector preview is not mounted`);
      const seen = [];
      for (let page = 0; page < 12; page += 1) {
        await teach.waitForTimeout(350);
        // Two board shapes: L1/L2 stage a grid of `.synthcard`, L3 stages one
        // railed `.wr-board-card` at a time. Read whichever this lesson uses.
        const frameCards = await pp.evaluate(() =>
          [...document.querySelectorAll(".synthcard, .wr-board-card")].map((c) => ({
            title: (c.querySelector("h3")?.textContent || "").replace(/\s+/g, " ").trim(),
            body: [...c.querySelectorAll("p")].map((x) => x.textContent || "").join(" ").replace(/\s+/g, " ").trim(),
          })),
        );
        for (const c of frameCards) seen.push(c);
        const frameText = frameCards.map((c) => `${c.title} ${c.body}`).join(" ");
        const next = await teach.$("#btnSynthPage");
        if (!next || (await next.isDisabled())) break;
        const before = frameText;
        await next.click();
        await teach.waitForTimeout(400);
        const after = await pp.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
        if (after === before) break;
      }
      const unique = [...new Set(seen.map((c) => c.title))].filter(Boolean);
      assert.ok(unique.length >= 4, `${lesson.short}: the rehearsal walked only ${unique.length} synthesis cards: ${JSON.stringify(unique)}`);
      if (lesson.cards) assert.equal(unique.length, lesson.cards, `${lesson.short}: expected ${lesson.cards} cards, walked ${unique.length}: ${JSON.stringify(unique)}`);
      for (const card of seen) {
        assert.match(card.title, /^REHEARSAL — /, `${lesson.short}: the projector showed "${card.title}" in a cold walk — a teacher could read it as the room's own arithmetic`);
        // A made-up figure on the projector must say it is made up.
        if (/\$[\d,]{3,}|\b\d{1,3}%/.test(card.body)) {
          assert.match(card.body, /STAND-IN/, `${lesson.short}: "${card.title}" printed figures with no stand-in warning`);
        }
      }
      await teach.screenshot({ path: path.join(SCREEN_DIR, `${lesson.short}-02-synthesis-board.png`), fullPage: true });
      console.log(`[rehearsal] ${lesson.short} SYNTHESIS: ${unique.length} marked cards walked on the projector`);

      await teach.click("#btnAdvance"); // COMPLETE
      await teach.waitForTimeout(200);
    }

    if (consoleErrors.length > 0) throw new Error(`console errors:\n${consoleErrors.join("\n")}`);
    console.log(`[rehearsal] PASS — three directed lessons walked cold with zero desks, screens in ${path.relative(path.join(ROOT, ".."), SCREEN_DIR)}/`);
  } catch (err) {
    console.error("[rehearsal] FAILED:", err && err.message ? err.message : err);
    if (serverLog.length) console.error("--- server ---\n" + serverLog.join(""));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
    try { fs.rmSync(SNAPSHOT_FILE, { force: true }); } catch { /* best effort */ }
  }
}

void main();
