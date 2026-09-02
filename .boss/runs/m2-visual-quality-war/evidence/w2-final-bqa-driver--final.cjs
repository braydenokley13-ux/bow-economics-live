#!/usr/bin/env node
/* W2 FINAL browser re-check at head 84d8983 (repair 4). One viewport per run. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = "/home/user/bow-economics-live/runtime";
const PORT = 4441;
const BASE = `http://127.0.0.1:${PORT}`;
const SCRATCH = "/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-final-browser";
const SCREEN_DIR = "/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-w2-browser-final";
fs.mkdirSync(SCREEN_DIR, { recursive: true });

const VP = process.argv[2] === "1024x600" ? { width: 1024, height: 600, tag: "1024x600" } : { width: 1366, height: 768, tag: "1366x768" };
const SNAPSHOT_FILE = path.join(ROOT, ".e2e-scratch", `snap-w2final-${VP.tag}-${Date.now()}.json`);
const OUT_FILE = path.join(SCRATCH, `measurements-${VP.tag}.json`);
const md5 = (t) => crypto.createHash("md5").update((t || "").replace(/\s+/g, " ").trim()).digest("hex").slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { viewport: VP.tag, vh: VP.height, nights: {}, pin: {}, reveal: [], synth: [], dead: {}, forbidden: {}, theme: {}, notes: [] };
function rec(k, v) { out.nights[k] = v; console.log(`[${VP.tag}] ${k} ${JSON.stringify(v).slice(0,300)}`); }

async function waitForServer() { for (let i=0;i<200;i++){ try{ const r=await fetch(`${BASE}/api/lessons`); if(r.ok) return; }catch{} await sleep(150);} throw new Error("no server"); }

const CLAIM_WORDS = ["project","forecast","estimate","expected","preview","target","profit","readiness","momentum","time remaining","strong round","of capacity","weather"];
function forbiddenCount(text) { const c={}; const l=(text||"").toLowerCase(); for(const w of CLAIM_WORDS){ const n=(l.match(new RegExp(w,"g"))||[]).length; if(n>0)c[w]=n; } return c; }

async function themeAudit(page) {
  return page.evaluate(() => {
    const gold = "244, 185, 66"; const root = document.getElementById("gameBody");
    if (!root) return { checked: 0, violationCount: 0, violations: [] };
    const v = []; let checked = 0;
    for (const el of root.querySelectorAll("*")) { checked++; if (el.closest("svg")) continue;
      const cs = getComputedStyle(el);
      const props = { fontFamily: cs.fontFamily, color: cs.color, borderTopColor: cs.borderTopColor, borderLeftColor: cs.borderLeftColor, backgroundColor: cs.backgroundColor, backgroundImage: cs.backgroundImage, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow };
      if (/Bebas/i.test(props.fontFamily)) v.push({ tag: el.tagName, prop: "fontFamily", val: props.fontFamily });
      for (const [k, val] of Object.entries(props)) { if (k === "fontFamily") continue; if (typeof val === "string" && val.includes(gold)) v.push({ tag: el.tagName, cls: String(el.className).slice(0,50), prop: k, val: val.slice(0,70) }); } }
    return { checked, violationCount: v.length, violations: v.slice(0, 10) };
  });
}
async function setPrice(page, price) { await page.waitForSelector("#fhPriceDial"); await page.$eval("#fhPriceDial",(el,v)=>{el.value=String(v);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));},price); await page.waitForFunction((p)=>document.getElementById("fhPriceReadout")?.textContent===`$${p}`,price); }
async function lockNight(page) { page.once("dialog",(d)=>d.accept()); await page.click("#fhLock"); await page.waitForSelector(".fh-locked-recap, #fhResult",{timeout:15000}); }
async function waitForNight(page,l){ await page.waitForFunction((x)=>document.querySelector(".fh-card-night")?.textContent?.includes(x),l,{timeout:20000}); }
async function deadRegion(page){ return page.evaluate(()=>{ const m=document.querySelector(".fh-main"); if(!m)return null; const k=[...m.children].filter(e=>e.getBoundingClientRect().height>0); const last=k[k.length-1]; if(!last)return null; return Math.round(m.getBoundingClientRect().bottom-last.getBoundingClientRect().bottom); }); }
async function pinRect(page){ return page.evaluate(()=>{ const el=document.querySelector(".fh-pin-chip"); if(!el)return null; const r=el.getBoundingClientRect(); return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1),vw:window.innerWidth,vh:window.innerHeight,inside:r.top>=0&&r.left>=0&&r.bottom<=window.innerHeight&&r.right<=window.innerWidth}; }); }

async function measureResult(page) {
  return page.evaluate(() => {
    const R=(sel)=>{const el=document.querySelector(sel); if(!el)return null; const r=el.getBoundingClientRect(); return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),h:+r.height.toFixed(1),fontSize:getComputedStyle(el).fontSize,text:(el.textContent||"").replace(/\s+/g," ").trim().slice(0,90)};};
    const leaves=Array.from(document.querySelectorAll("#gameBody *")).filter(e=>e.children.length===0&&(e.textContent||"").trim());
    const figs=leaves.map(e=>{const r=e.getBoundingClientRect();return {text:(e.textContent||"").trim().slice(0,32),fontSize:parseFloat(getComputedStyle(e).fontSize),top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),inTurned:!!e.closest(".fh-turned")};}).filter(f=>f.fontSize>=24&&(f.bottom-f.top)>0).sort((a,b)=>b.fontSize-a.fontSize);
    const turnedEl=leaves.find(e=>e.closest(".fh-turned")&&/^\d[\d,]*$/.test((e.textContent||"").trim())&&parseFloat(getComputedStyle(e).fontSize)>=24);
    let turned=null; if(turnedEl){const r=turnedEl.getBoundingClientRect(); const fs=parseFloat(getComputedStyle(turnedEl).fontSize); const rank=figs.findIndex(f=>f.inTurned&&f.fontSize===fs); turned={text:turnedEl.textContent.trim(),fontSize:fs,top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),rankAmongFigures:rank};}
    const body=document.body.innerText;
    return { vh: window.innerHeight,
      headline: R(".fh-sellout")||R(".fh-result-head"),
      sellout: !!document.querySelector(".fh-sellout"),
      fhNextNight: R("#fhNextNight"), fhNights: R("#fhNights"), fhBooks: R("#fhBooks"), fhTonight: R("#fhTonight"),
      cash: R(".fh-cash-line")||R(".fh-chain"), renewals: R(".fh-renewals"),
      figures: figs.slice(0,6), turned, bodyText: body, scrollY: window.scrollY,
      docScroll: document.documentElement.scrollHeight };
  });
}

async function main() {
  const server = spawn(process.execPath,[path.join(ROOT,"dist/server/index.js")],{cwd:ROOT,env:{...process.env,PORT:String(PORT),RUNTIME_SNAPSHOT_FILE:SNAPSHOT_FILE},stdio:["ignore","pipe","pipe"]});
  await waitForServer(); console.log(`[${VP.tag}] server up`);
  const browser = await chromium.launch();
  const errs=[];
  const teach=await browser.newPage({viewport:{width:1366,height:768}});
  const board=await browser.newPage({viewport:{width:1920,height:1080}});
  const desks=[]; for(let i=0;i<4;i++) desks.push(await browser.newPage({viewport:{width:VP.width,height:VP.height}}));
  const [d1,d2,d3,d4]=desks;
  for(const [l,p] of [["teach",teach],["board",board],["d1",d1],["d2",d2],["d3",d3],["d4",d4]]){ p.on("console",m=>{if(m.type()==="error")errs.push(`[${l}] ${m.text()}`);}); p.on("pageerror",e=>errs.push(`[${l}] ${e.message}`)); p.on("dialog",d=>d.accept()); }
  try {
    await teach.goto(`${BASE}/teach`); await teach.selectOption("#lesson","m2l1-full-house"); await teach.fill("#title",`W2 final ${VP.tag}`); await teach.click("#create");
    await teach.waitForSelector("#room:not([hidden])"); const code=(await teach.textContent("#code")).trim();
    await board.goto(`${BASE}/board?code=${code}`); await board.waitForSelector("#stage .label");
    async function join(page,name){ await page.goto(`${BASE}/play`); await page.fill("#joinCode",code); await page.fill("#joinName",name); await page.click("#btnJoin"); await page.waitForSelector("#gameCard:not([hidden])"); await page.waitForSelector(".fh-desk-name",{timeout:20000}); }
    await join(d1,"Rae & Ben"); await join(d2,"Nour & Ivy"); await join(d3,"Ari & Tal"); await join(d4,"Sam & Jo");

    await sleep(500);
    const lobbyBody=await d1.evaluate(()=>document.getElementById("gameBody").innerText);
    out.dead.LOBBY={md5:md5(lobbyBody),dead:await deadRegion(d1)}; out.forbidden.LOBBY=forbiddenCount(lobbyBody);
    await teach.click("#btnAdvance");
    await d1.waitForFunction(()=>document.body.innerText.includes("run the building"),null,{timeout:20000});
    await sleep(400);
    const hookBody=await d1.evaluate(()=>document.getElementById("gameBody").innerText);
    out.dead.HOOK={md5:md5(hookBody),dead:await deadRegion(d1)}; out.forbidden.HOOK=forbiddenCount(hookBody);
    await d1.screenshot({path:path.join(SCREEN_DIR,`01-hook-${VP.tag}.png`)});
    await teach.click("#btnAdvance");
    for(const p of desks) await p.waitForSelector("#fhPlayRoot",{timeout:20000});
    await d1.evaluate(()=>window.scrollTo(0,0));
    out.pin.prelock=await pinRect(d1);
    const prelockBody=await d1.evaluate(()=>document.body.innerText);
    out.forbidden.prelock=forbiddenCount(prelockBody); out.theme.prelock=await themeAudit(d1);
    out.dead.PLAY_PRELOCK={dead:await deadRegion(d1)};
    await d1.screenshot({path:path.join(SCREEN_DIR,`02-prelock-${VP.tag}.png`)});

    // d1: normal; d2: $16 plan price, bowl CLOSED -> sellout; d3: $120 -> zero turnout; d4: bowl OPEN + spend
    const NIGHTS=[
      {label:"Night 1",p:{d1:40,d2:16,d3:120,d4:44}},
      {label:"Night 2",p:{d1:48,d2:16,d3:120,d4:44}},
      {label:"Night 3",p:{d1:40,d2:16,d3:120,d4:38}},
      {label:"Night 4",p:{d1:52,d2:16,d3:120,d4:36}},
      {label:"Night 5",p:{d1:34,d2:16,d3:120,d4:30}},
    ];
    for(let i=0;i<NIGHTS.length;i++){
      const n=NIGHTS[i]; const L=n.label.replace(" ","");
      for(const p of desks) await waitForNight(p,n.label);
      for(const [pn,pp] of [["desk1",d1],["desk4",d4]]) {
        await pp.evaluate(()=>window.scrollTo(0,0)); await pp.waitForTimeout(150);
        const pre=await pp.evaluate(()=>{const R=(s)=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect();return{top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),h:+r.height.toFixed(1)};};return{vh:window.innerHeight,fhNights:R("#fhNights"),fhTonight:R("#fhTonight"),fhBooks:R("#fhBooks"),fhLock:R("#fhLock"),fhBowl:R("#fhBowl"),doc:document.documentElement.scrollHeight};});
        out.nights["prelock-"+pn+"-"+L]=pre; out.pin["prelock-"+pn+"-"+L]=await pinRect(pp);
        console.log("["+VP.tag+"] prelock-"+pn+"-"+L, JSON.stringify(pre));
        if(pn==="desk1") await pp.screenshot({path:path.join(SCREEN_DIR,"05-prelock-"+L+"-"+VP.tag+".png")});
      }
      await setPrice(d1,n.p.d1); await lockNight(d1);
      await setPrice(d2,n.p.d2); await lockNight(d2);
      await setPrice(d3,n.p.d3); await lockNight(d3);
      await setPrice(d4,n.p.d4);
      // d4 opens the bowl every night AND spends event money from night 2 on
      const bowl=await d4.$("#fhBowl");
      if(bowl){ const pressed=await d4.$eval("#fhBowl",e=>e.getAttribute("aria-pressed")); if(pressed!=="true"){ await d4.click("#fhBowl"); await d4.waitForFunction(()=>document.getElementById("fhBowl")?.getAttribute("aria-pressed")==="true",null,{timeout:8000}).catch(()=>out.notes.push(`${L} d4 bowl toggle did not latch`)); } }
      if(i>=1){ for(let k=0;k<8;k++) await d4.click("#fhSpendUp").catch(()=>{}); }
      await lockNight(d4);
      await teach.click("#btnCloseNight");
      for(const [name,p] of [["desk1",d1],["desk2",d2],["desk3",d3],["desk4",d4]]){
        const ok=await p.waitForSelector("#fhResult",{timeout:20000}).then(()=>true).catch(()=>false);
        if(!ok){ out.notes.push(`${name} ${L}: no #fhResult`); continue; }
        await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(200);
        await p.screenshot({path:path.join(SCREEN_DIR,`10-${name}-${L}-${VP.tag}.png`)});
        const m=await measureResult(p);
        out.forbidden[`result-${name}-${L}`]=forbiddenCount(m.bodyText);
        out.pin[`result-${name}-${L}`]=await pinRect(p);
        rec(`${name}-${L}`,{...m,bodyText:undefined,bodySnippet:m.bodyText.replace(/\s+/g," ").slice(0,300)});
        if(name==="desk1"||name==="desk2"||name==="desk4") out.theme[`result-${name}-${L}`]=await themeAudit(p);
      }
      for(const p of desks){ if(await p.$("#fhNextNight")){ await p.click("#fhNextNight",{timeout:20000}).catch(()=>{}); await p.waitForFunction(()=>!document.querySelector("#fhResult"),null,{timeout:20000}).catch(()=>{}); } }
      if(i<NIGHTS.length-1) for(const p of desks) await waitForNight(p,NIGHTS[i+1].label);
      else await d1.waitForFunction(()=>document.body.innerText.includes("in the books"),null,{timeout:20000}).catch(()=>{});
    }
    async function waitTextChange(page,prev,ms){ const dl=Date.now()+ms; let t=prev; while(Date.now()<dl){ t=await page.evaluate(()=>document.getElementById("gameBody").innerText); if(t!==prev) return t; await sleep(150);} return t; }
    await teach.click("#btnAdvance");
    await d1.waitForFunction(()=>document.body.innerText.includes("Beat"),null,{timeout:20000}).catch(()=>{});
    await sleep(600);
    let b0=await d1.evaluate(()=>document.getElementById("gameBody").innerText);
    out.reveal.push([0,md5(b0)]); out.forbidden["reveal-0"]=forbiddenCount(b0);
    await d1.screenshot({path:path.join(SCREEN_DIR,`20-reveal-0-${VP.tag}.png`)});
    let prev=b0;
    for(let s=1;s<=7;s++){ await teach.click("#btnRevealNext"); const t=await waitTextChange(d1,prev,6000); prev=t; out.reveal.push([s,md5(t)]); out.forbidden[`reveal-${s}`]=forbiddenCount(t); if(s===7) await d1.screenshot({path:path.join(SCREEN_DIR,`20-reveal-7-${VP.tag}.png`)}); }
    out.dead.REVEAL={dead:await deadRegion(d1)};
    await teach.click("#btnAdvance"); await sleep(900);
    out.dead.ADAPT={dead:await deadRegion(d1)}; out.forbidden.ADAPT=forbiddenCount(await d1.evaluate(()=>document.body.innerText));
    await teach.click("#btnAdvance"); await sleep(900);
    out.dead.COUNTERFACTUAL={dead:await deadRegion(d1)}; out.forbidden.COUNTERFACTUAL=forbiddenCount(await d1.evaluate(()=>document.body.innerText));
    await teach.click("#btnAdvance"); await sleep(1100);
    let ps=await d1.evaluate(()=>document.getElementById("gameBody").innerText);
    for(let pg=1;pg<=6;pg++){ const t=pg===1?ps:await waitTextChange(d1,ps,6000); ps=t; out.synth.push([pg,md5(t)]); out.forbidden[`synth-${pg}`]=forbiddenCount(await d1.evaluate(()=>document.body.innerText)); if(pg===1) await d1.screenshot({path:path.join(SCREEN_DIR,`21-synth-1-${VP.tag}.png`)}); if(pg<6) await teach.click("#btnSynthPage"); }
    out.dead.SYNTHESIS={dead:await deadRegion(d1)};
    await d1.screenshot({path:path.join(SCREEN_DIR,`21-synth-6-${VP.tag}.png`)});
    out.theme.synth6=await themeAudit(d1);
    await teach.click("#btnAdvance"); await sleep(1000);
    const cb=await d1.evaluate(()=>document.getElementById("gameBody").innerText);
    out.dead.COMPLETE={md5:md5(cb),dead:await deadRegion(d1)}; out.forbidden.COMPLETE=forbiddenCount(cb);
    await d1.screenshot({path:path.join(SCREEN_DIR,`22-complete-${VP.tag}.png`)});
    out.consoleErrors=errs;
    fs.writeFileSync(OUT_FILE,JSON.stringify(out,null,2));
    console.log(`[${VP.tag}] DONE -> ${OUT_FILE}`);
  } finally { await browser.close(); server.kill(); }
}
main().catch(e=>{ console.error("FAILED",e); fs.writeFileSync(OUT_FILE,JSON.stringify(out,null,2)); process.exitCode=1; });
