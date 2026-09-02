const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const BASE = "http://localhost:4444";
const SCR = "/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-w2-kid-c-final";
const PAY = "/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-final-kid-c";
const log = {};
const SELS = ["#fhNights",".fh-renewal-cause",".fh-renewal-floor",".fh-arena-frame",".fh-arena-labels",".fh-history-row","#fhTonight",".fh-result-head",".fh-next",".fh-slate-row",".fh-dial-carried",".fh-dial-plan",".fh-pin-chip",".fh-cockpit",".fh-rules-summary",".fh-hook-line","#fhNextNight","#gameBody",".fh-desk-head",".fh-card",".fh-slate","#fhResult",".fh-result-headline",".fh-boxscore",".fh-cause",".fh-why","#fhLock","#fhPriceDial",".fh-dials",".fh-history",".fh-nights-chart",".fh-chart","svg","#pinCard","#pinDisplay",".fh-next",".fh-books",".fh-topstrip",".fh-hook-slate",".fh-slate-card"];
async function snap(page, name, opts = {}) {
  await page.waitForTimeout(320);
  if (!opts.noScroll) await page.evaluate(() => window.scrollTo(0, 0));
  const d = await page.evaluate((sels) => {
    const out = { text: (document.getElementById("gameBody") || document.body).innerText, vh: window.innerHeight, vw: window.innerWidth, docH: document.documentElement.scrollHeight, rects: {} };
    for (const s of sels) {
      const els = [...document.querySelectorAll(s)];
      if (!els.length) continue;
      out.rects[s] = els.slice(0, 6).map((e) => { const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height), txt: (e.innerText || e.textContent || "").slice(0, 90).replace(/\n/g, " | ") }; });
    }
    return out;
  }, SELS);
  log[name] = d;
  await page.screenshot({ path: `${SCR}/${name}.png`, fullPage: false });
  if (opts.full) await page.screenshot({ path: `${SCR}/${name}-full.png`, fullPage: true });
  return d;
}
async function setPrice(p, v) {
  await p.waitForSelector("#fhPriceDial");
  const meta = await p.$eval("#fhPriceDial", (e) => ({ min: +e.min, max: +e.max, step: +e.step }));
  const val = Math.min(meta.max, Math.max(meta.min, Math.round(v / meta.step) * meta.step));
  await p.$eval("#fhPriceDial", (e, val) => { e.value = String(val); e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }, val);
  await p.waitForTimeout(180);
  return { meta, val };
}
(async () => {
  const browser = await chromium.launch();
  const teach = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  teach.on("dialog", (d) => d.accept());
  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson", "m2l1-full-house");
  await teach.fill("#title", "Kid C final recheck");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  const board = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await board.goto(`${BASE}/board?code=${code}`);
  // kid first contact at 1024x600
  const kid = await browser.newPage({ viewport: { width: 1024, height: 600 } });
  kid.on("dialog", (d) => d.accept());
  await kid.goto(`${BASE}/play`);
  await kid.fill("#joinCode", code);
  await kid.fill("#joinName", "Rae & Ben");
  await kid.screenshot({ path: `${SCR}/00-join-1024x600.png` });
  await kid.click("#btnJoin");
  await kid.waitForSelector("#gameCard:not([hidden])");
  await snap(kid, "01-lobby-1024x600");
  const others = [];
  for (const n of ["Tam & Zo", "Kip & Lu", "Ada & Vin"]) {
    const p = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    p.on("dialog", (d) => d.accept());
    await p.goto(`${BASE}/play`);
    await p.fill("#joinCode", code); await p.fill("#joinName", n); await p.click("#btnJoin");
    await p.waitForSelector("#gameCard:not([hidden])");
    others.push(p);
  }
  await kid.setViewportSize({ width: 1366, height: 768 });
  await snap(kid, "02-lobby-1366", { full: true });
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('HOOK')");
  await snap(kid, "03-hook", { full: true });
  await board.screenshot({ path: `${SCR}/03b-board-hook.png` });
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('PLAY')");
  const KID = [45, 120, 12, 40, 45];
  const notes = [];
  for (let n = 0; n < 5; n++) {
    await kid.waitForSelector("#fhPriceDial");
    const pre = await snap(kid, `04-n${n + 1}-pre`, { full: true });
    if (n === 0) { await kid.setViewportSize({ width: 1024, height: 600 }); await snap(kid, "04b-n1-pre-1024x600", { full: true }); await kid.setViewportSize({ width: 1366, height: 768 }); await kid.waitForTimeout(300); }
    const pm = await setPrice(kid, KID[n]);
    notes.push({ night: n + 1, priceMeta: pm });
    if (n === 3) { const b = await kid.$("#fhBowl"); if (b) { log[`bowlbtn-n${n + 1}`] = await b.innerText(); try { await kid.click("#fhBowl", { timeout: 4000, force: true }); } catch {} } for (let i = 0; i < 2; i++) { const u = await kid.$("#fhSpendUp"); if (u) await u.click(); } }
    if (n === 2) { const u = await kid.$("#fhSpendUp"); if (u) await u.click(); }
    await snap(kid, `05-n${n + 1}-set`);
    await kid.click("#fhLock");
    await kid.waitForTimeout(400);
    for (let i = 0; i < others.length; i++) {
      const p = others[i];
      if (await p.$("#fhPriceDial")) { await setPrice(p, [30, 55, 25, 70][ (i + n) % 4 ]); await p.click("#fhLock"); await p.waitForTimeout(200); }
    }
    await teach.click("#btnCloseNight");
    await kid.waitForTimeout(700);
    await snap(kid, `06-n${n + 1}-settled`, { full: true });
    if (n === 4) { await kid.setViewportSize({ width: 1024, height: 600 }); await snap(kid, "06-n5-settled-1024", {}); await kid.setViewportSize({ width: 1366, height: 768 }); await kid.waitForTimeout(300); }
    const nb = await kid.$("#fhNextNight");
    if (nb) { log[`nextbtn-n${n + 1}`] = await nb.innerText(); for (let a = 0; a < 5; a++) { try { await kid.click("#fhNextNight", { timeout: 4000, force: true }); break; } catch { await kid.waitForTimeout(600); } } await kid.waitForTimeout(600); }
    for (const p of others) { try { await p.click("#fhNextNight", { timeout: 2000 }); } catch {} }
    if (n < 4) await snap(kid, `06b-n${n + 1}-afternext`);
  }
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('REVEAL')");
  for (let s = 0; s <= 7; s++) {
    await snap(kid, `07-reveal-${s}`);
    await board.waitForTimeout(250);
    await board.screenshot({ path: `${SCR}/07b-board-reveal-${s}.png` });
    log[`board-reveal-${s}`] = { text: await board.$eval("#stage", (e) => e.innerText) };
    if (s < 7) { await teach.click("#btnRevealNext"); await teach.waitForTimeout(500); }
  }
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('ADAPT')");
  await snap(kid, "08-adapt", { full: true });
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('COUNTERFACTUAL')");
  await snap(kid, "09-cf-0", { full: true });
  await board.screenshot({ path: `${SCR}/09b-board-cf.png` });
  log["board-cf"] = { text: await board.$eval("#stage", (e) => e.innerText) };
  await teach.click("#btnCfPage"); await teach.waitForTimeout(600);
  await snap(kid, "09-cf-1");
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('SYNTHESIS')");
  for (let s = 0; s < 6; s++) {
    await snap(kid, `10-synth-${s}`);
    await board.waitForTimeout(250);
    await board.screenshot({ path: `${SCR}/10b-board-synth-${s}.png` });
    log[`board-synth-${s}`] = { text: await board.$eval("#stage", (e) => e.innerText) };
    if (s < 5) { await teach.click("#btnSynthPage"); await teach.waitForTimeout(600); }
  }
  await teach.click("#btnAdvance"); await teach.waitForSelector(".phasechip.current:text('COMPLETE')");
  await snap(kid, "11-complete", { full: true });
  log["_notes"] = notes;
  fs.writeFileSync(`${PAY}/kidc-log.json`, JSON.stringify(log, null, 1));
  await browser.close();
  console.log("DONE");
})().catch((e) => { fs.writeFileSync(`${PAY}/kidc-log.json`, JSON.stringify(log, null, 1)); console.error("ERR", e.message); process.exit(1); });
