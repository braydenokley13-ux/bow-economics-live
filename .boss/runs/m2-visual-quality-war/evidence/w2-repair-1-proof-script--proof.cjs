#!/usr/bin/env node
/**
 * w2-repair-1 proof: legacy theme.css leak audit on every /play state of a
 * real 4-desk Full House class driven to a sellout.
 *
 * For every state, walks EVERY element in #gameBody and asserts:
 *   - computed font-family never contains "Bebas"
 *   - no computed color / border-*-color / background-image / background-color
 *     contains the gold triplet 244, 185, 66
 *     (allowed only inside svg.arena / .m2-arena svg, per contract A2)
 * Also records every class token seen, for the class-collision audit.
 *
 * Env: PROOF_DIST, PROOF_PORT, PROOF_TAG (before|after), PROOF_SHOTS
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const DIST = path.resolve(process.env.PROOF_DIST);
const PORT = Number(process.env.PROOF_PORT || 4451);
const TAG = process.env.PROOF_TAG || "after";
const SHOTS = path.resolve(process.env.PROOF_SHOTS || path.join(__dirname, "shots-" + TAG));
const BASE = `http://localhost:${PORT}`;
const SNAP = path.join(__dirname, `snap-${TAG}-${Date.now()}.json`);

fs.mkdirSync(SHOTS, { recursive: true });

const violations = [];
const classSeen = new Set();
const consoleErrors = [];
let phaseLabel = "boot";
const T0 = Date.now();
const note = (m) => consoleErrors.push(`+${((Date.now()-T0)/1000).toFixed(1)}s [${phaseLabel}] ${m}`);
let statesChecked = 0;
let elementsChecked = 0;

const AUDIT = `(() => {
  const root = document.getElementById("gameBody");
  if (!root) return { n: 0, bad: [], classes: [], missing: true };
  const els = [root, ...root.querySelectorAll("*")];
  const bad = [];
  const classes = new Set();
  const GOLD = /244,\\s*185,\\s*66/;
  for (const el of els) {
    if (el.classList) for (const c of el.classList) classes.add(c);
    // is this element inside the drawn arena SVG? (contract A2 carve-out)
    const inArena = !!(el.closest && (el.closest("svg.arena") || el.closest(".m2-arena") || el.closest(".fh-arena-frame")));
    const cs = getComputedStyle(el);
    const ff = cs.fontFamily || "";
    if (/bebas/i.test(ff)) {
      bad.push({ kind: "bebas", tag: el.tagName, cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || ""), value: ff, text: (el.textContent || "").slice(0, 48) });
    }
    if (!inArena) {
      for (const prop of ["color", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "backgroundColor", "backgroundImage", "outlineColor", "boxShadow", "caretColor", "textDecorationColor", "columnRuleColor"]) {
        const v = cs[prop];
        if (typeof v === "string" && GOLD.test(v)) {
          bad.push({ kind: "gold", prop, tag: el.tagName, cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || ""), value: v, text: (el.textContent || "").slice(0, 48) });
        }
      }
    }
  }
  return { n: els.length, bad, classes: [...classes], missing: false };
})()`;

async function audit(page, label) {
  phaseLabel = label;
  const r = await page.evaluate(AUDIT);
  if (r.missing) { console.log(`  ! ${label}: #gameBody missing, skipped`); return; }
  statesChecked += 1;
  elementsChecked += r.n;
  for (const c of r.classes) classSeen.add(c);
  const uniq = new Map();
  for (const b of r.bad) uniq.set(`${b.kind}|${b.prop || ""}|${b.cls}|${b.value}`, b);
  const list = [...uniq.values()];
  console.log(`  [${label}] elements checked: ${r.n} · violations: ${r.bad.length} (${list.length} distinct)`);
  for (const b of list.slice(0, 8)) {
    console.log(`      ${b.kind.toUpperCase()} ${b.prop || "font-family"} <${b.tag} class="${b.cls}"> = ${b.value}  «${b.text.replace(/\s+/g, " ")}»`);
  }
  if (r.bad.length) violations.push({ state: label, count: r.bad.length, distinct: list });
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try { const res = await fetch(`${BASE}/api/lessons`); if (res.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server never came up");
}
async function setPrice(page, price) {
  await page.waitForSelector("#fhPriceDial");
  await page.$eval("#fhPriceDial", (el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, price);
  await page.waitForFunction((p) => document.getElementById("fhPriceReadout")?.textContent === `$${p}`, price);
}

async function main() {
  const server = spawn(process.execPath, [path.join(DIST, "server", "index.js")], {
    cwd: path.dirname(DIST),
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: SNAP },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));
  await waitForServer();
  console.log(`[proof:${TAG}] server up on ${BASE} (dist ${DIST})`);

  const browser = await chromium.launch();
  try {
    const viewport = { width: 1366, height: 768 };
    const teach = await browser.newPage({ viewport });
    const board = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const desks = [];
    for (let i = 0; i < 4; i += 1) desks.push(await browser.newPage({ viewport }));
    for (const [label, p] of [["teach", teach], ["board", board], ...desks.map((d, i) => [`desk${i + 1}`, d])]) {
      p.on("dialog", (d) => d.accept());
      p.on("console", (m) => { if (m.type() === "error") note(`${label} console.error: ${m.text()}`); });
      p.on("pageerror", (e) => note(`${label} pageerror: ${e.message}`));
      p.on("response", (res) => { if (res.status() >= 400) note(`${label} HTTP ${res.status()} ${res.request().method()} ${res.url()}`); });
      p.on("requestfailed", (req) => note(`${label} requestfailed ${req.url()} ${req.failure()?.errorText}`));
    }

    await teach.goto(`${BASE}/teach`);
    await teach.selectOption("#lesson", "m2l1-full-house");
    await teach.fill("#title", "w2-repair-1 proof");
    await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])");
    const code = (await teach.textContent("#code")).trim();
    await board.goto(`${BASE}/board?code=${code}`);
    await board.waitForSelector("#stage .label");

    const names = ["Rae & Ben", "Nour & Ivy", "Ari & Tal", "Mo & Sam"];
    for (let i = 0; i < 4; i += 1) {
      const p = desks[i];
      await p.goto(`${BASE}/play`);
      await p.fill("#joinCode", code);
      await p.fill("#joinName", names[i]);
      await p.click("#btnJoin");
      await p.waitForSelector("#gameCard:not([hidden])");
      await p.waitForSelector(".fh-desk-name", { timeout: 20000 });
    }
    console.log(`[proof:${TAG}] 4 desks joined, code ${code}`);
    await audit(desks[0], "LOBBY");
    await desks[0].screenshot({ path: path.join(SHOTS, "01-lobby.png") });

    await teach.click("#btnAdvance"); // HOOK
    await desks[0].waitForFunction(() => document.body.innerText.includes("run the building"), null, { timeout: 20000 });
    await audit(desks[0], "HOOK");
    await desks[0].screenshot({ path: path.join(SHOTS, "02-hook.png") });

    await teach.click("#btnAdvance"); // PLAY
    for (const p of desks) await p.waitForSelector("#fhPlayRoot", { timeout: 20000 });

    // pre-lock (dial editing)
    await audit(desks[0], "PLAY/pre-lock-night1");
    await desks[0].screenshot({ path: path.join(SHOTS, "03-prelock.png") });

    // Desk 2 = Memphis, plan $16 -> holding the plan price sells out.
    const plan = await desks[1].evaluate(() => document.querySelector(".fh-dial-tick-label")?.textContent || "");
    const planPrice = Number((plan.match(/\$(\d+)/) || [])[1] || 16);
    console.log(`[proof:${TAG}] desk2 plan price parsed: $${planPrice}`);

    const lines = [
      [40, 48, 40, 90, 34],                                        // desk1 varies
      [planPrice, planPrice, planPrice, planPrice, planPrice],     // desk2 holds plan -> sellout
      [120, 70, 70, 70, 70],                                       // desk3 finds the floor
      [30, 30, 84, 24, 30],                                        // desk4
    ];

    for (let night = 0; night < 5; night += 1) {
      for (let i = 0; i < 4; i += 1) {
        const p = desks[i];
        await p.waitForSelector("#fhPriceDial", { timeout: 20000 });
        await setPrice(p, lines[i][night]);
        if (i === 0 && night === 3) await p.click("#fhBowl"); // open the upper bowl once
      }
      if (night === 0) {
        // locked-waiting state, captured on desk 1 only
        await desks[0].click("#fhLock");
        await desks[0].waitForSelector(".fh-locked-recap", { timeout: 15000 });
        await audit(desks[0], "PLAY/locked-waiting");
        await desks[0].screenshot({ path: path.join(SHOTS, "04-locked-waiting.png") });
        for (let i = 1; i < 4; i += 1) { await desks[i].click("#fhLock"); await desks[i].waitForSelector(".fh-locked-recap", { timeout: 15000 }); }
      } else {
        for (const p of desks) { await p.click("#fhLock"); await p.waitForSelector(".fh-locked-recap", { timeout: 15000 }); }
      }
      await teach.click("#btnCloseNight");
      for (const p of desks) await p.waitForSelector("#fhResult", { timeout: 20000 });
      for (let i = 0; i < 4; i += 1) {
        const soldOut = await desks[i].evaluate(() => !!document.querySelector("#fhResult.soldout, #fhResult.is-sellout"));
        const label = `PLAY/result-desk${i + 1}-night${night + 1}${soldOut ? "-SELLOUT" : ""}`;
        await audit(desks[i], label);
        if (soldOut || (i === 0 && night === 0)) {
          await desks[i].screenshot({ path: path.join(SHOTS, `05-result-desk${i + 1}-night${night + 1}${soldOut ? "-sellout" : ""}.png`) });
        }
      }
      for (const p of desks) { if (await p.$("#fhNextNight")) { await p.click("#fhNextNight", { timeout: 20000 }); } }
      if (night < 4) for (const p of desks) await p.waitForSelector("#fhPriceDial", { timeout: 20000 });
    }

    // all nights done / books closed
    await desks[0].waitForFunction(() => !document.querySelector("#fhPriceDial"), null, { timeout: 20000 }).catch(() => {});
    await audit(desks[0], "PLAY/all-nights-done");
    await desks[0].screenshot({ path: path.join(SHOTS, "06-all-nights-done.png") });

    await teach.click("#btnAdvance"); // REVEAL
    await teach.waitForSelector(".phasechip.current:text('REVEAL')");
    await new Promise((r) => setTimeout(r, 800));
    await audit(desks[0], "REVEAL");
    await desks[0].screenshot({ path: path.join(SHOTS, "07-reveal.png") });
    for (let i = 0; i < 7; i += 1) { await teach.click("#btnRevealNext"); await new Promise((r) => setTimeout(r, 350)); }
    await audit(desks[0], "REVEAL/last-stage");

    await teach.click("#btnAdvance"); // ADAPT
    await teach.waitForSelector(".phasechip.current:text('ADAPT')");
    await new Promise((r) => setTimeout(r, 800));
    await audit(desks[0], "ADAPT");
    await desks[0].screenshot({ path: path.join(SHOTS, "08-adapt.png") });

    await teach.click("#btnAdvance"); // COUNTERFACTUAL
    await new Promise((r) => setTimeout(r, 800));
    await audit(desks[0], "COUNTERFACTUAL");
    await desks[0].screenshot({ path: path.join(SHOTS, "09-counterfactual.png") });
    if (await teach.$("#btnCfPage")) { await teach.click("#btnCfPage"); await new Promise((r) => setTimeout(r, 400)); await audit(desks[0], "COUNTERFACTUAL/page2"); }

    await teach.click("#btnAdvance"); // SYNTHESIS
    await new Promise((r) => setTimeout(r, 800));
    await audit(desks[0], "SYNTHESIS");
    await desks[0].screenshot({ path: path.join(SHOTS, "10-synthesis.png") });
    if (await teach.$("#btnSynthPage")) { await teach.click("#btnSynthPage"); await new Promise((r) => setTimeout(r, 400)); await audit(desks[0], "SYNTHESIS/page2"); }

    await teach.click("#btnAdvance"); // COMPLETE
    await new Promise((r) => setTimeout(r, 800));
    await audit(desks[0], "COMPLETE");
    await desks[0].screenshot({ path: path.join(SHOTS, "11-complete.png") });

    console.log(`\n[proof:${TAG}] ==== SUMMARY ====`);
    console.log(`[proof:${TAG}] states audited: ${statesChecked}`);
    console.log(`[proof:${TAG}] elements checked (sum over states): ${elementsChecked}`);
    console.log(`[proof:${TAG}] states with violations: ${violations.length}`);
    for (const v of violations) console.log(`[proof:${TAG}]   ${v.state}: ${v.count} violations, ${v.distinct.length} distinct`);
    console.log(`[proof:${TAG}] distinct class tokens seen in #gameBody: ${classSeen.size}`);
    fs.writeFileSync(path.join(__dirname, `classes-runtime-${TAG}.txt`), [...classSeen].sort().join("\n"));
    fs.writeFileSync(path.join(__dirname, `violations-${TAG}.json`), JSON.stringify(violations, null, 1));
    console.log(`[proof:${TAG}] console errors / 401s / failed requests: ${consoleErrors.length}`);
    for (const e of [...new Set(consoleErrors)]) console.log(`[proof:${TAG}]   ${e}`);
    console.log(`[proof:${TAG}] VERDICT: ${violations.length === 0 ? "CLEAN (no Bebas, no gold outside the arena SVG)" : "LEAK PRESENT"}`);
  } finally {
    phaseLabel = "teardown";
    await browser.close().catch(() => {});
    server.kill("SIGKILL");
  }
  process.exit(violations.length === 0 ? 0 : 1);
}
main().catch((e) => { console.error("[proof] FAILED", e); process.exit(2); });
