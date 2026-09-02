const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const ROOT = "/home/user/bow-economics-live/runtime";
const OUT = process.argv[2];
const PORT = 4447;
const BASE = `http://localhost:${PORT}`;
const SNAP = path.join(OUT, "snap.json");
const CLAIM_WORDS = ["project","forecast","estimate","expected","preview","target","profit","readiness","momentum","time remaining","strong round","of capacity","weather"];
const notes = [];
const log = (...a) => { console.log(...a); notes.push(a.join(" ")); };

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT,"dist","server","index.js")], { cwd: ROOT, env: {...process.env, PORT:String(PORT), RUNTIME_SNAPSHOT_FILE: SNAP}, stdio:["ignore","pipe","pipe"] });
  server.stdout.on("data",()=>{}); server.stderr.on("data",d=>process.stderr.write(d));
  for (let i=0;i<60;i++){ try{ const r = await fetch(`${BASE}/api/lessons`); if(r.ok) break; }catch{} await new Promise(r=>setTimeout(r,250)); }
  const browser = await chromium.launch();
  const mk = async () => (await browser.newContext({ viewport:{width:1366,height:768}, deviceScaleFactor:1 })).newPage();
  const teach = await mk();
  const desks = [];
  for (let i=0;i<4;i++) desks.push(await mk());
  for (const p of [teach,...desks]) p.on("dialog", d=>d.accept());

  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson","m2l1-full-house");
  await teach.fill("#title","Econ W2 confirm");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  log("code", code);
  const names = ["Rae & Ben","Nour & Ivy","Ari & Tal","Sam & Fay"];
  for (let i=0;i<4;i++){
    const p = desks[i];
    await p.goto(`${BASE}/play`);
    await p.fill("#joinCode", code); await p.fill("#joinName", names[i]);
    await p.click("#btnJoin");
    await p.waitForSelector("#gameCard:not([hidden])");
    await p.waitForSelector(".fh-desk-name",{timeout:20000});
    log("desk",i+1,(await p.textContent(".fh-desk-name")).trim());
  }
  const adv = async () => { await teach.click("#btnAdvance"); await new Promise(r=>setTimeout(r,900)); };
  await adv(); // HOOK
  await adv(); // PLAY

  const setPrice = async (p, v) => {
    await p.waitForSelector("#fhPriceDial",{timeout:20000});
    await p.evaluate((v)=>{const d=document.getElementById("fhPriceDial"); d.value=String(v); d.dispatchEvent(new Event("input",{bubbles:true})); d.dispatchEvent(new Event("change",{bubbles:true}));}, v);
    await new Promise(r=>setTimeout(r,250));
  };
  const lock = async (p) => { await p.click("#fhLock"); await new Promise(r=>setTimeout(r,500)); };
  const snapText = async (p) => p.evaluate(()=>document.getElementById("gameBody")?.innerText ?? "");
  const scan = (label, text) => {
    const low = text.toLowerCase();
    const hits = CLAIM_WORDS.filter(w=>low.includes(w));
    if (hits.length) log("VOCAB HIT", label, JSON.stringify(hits));
    return hits;
  };
  const dump = {};

  // prices per night per desk: d1 NY, d2 MEM, d3 NY, d4 MEM
  const PLAN = [ [34,16,60,16], [48,36,90,18], [40,30,120,30], [90,16,60,84], [34,16,120,24] ];
  for (let night=0; night<5; night++){
    for (let i=0;i<4;i++){
      const p=desks[i];
      await p.waitForSelector("#fhPriceDial",{timeout:25000});
      if (night===3 && i===0){ await p.click("#fhBowl"); await new Promise(r=>setTimeout(r,300)); }
      await setPrice(p, PLAN[night][i]);
      if (night===0 && i===0){
        await p.screenshot({path: path.join(OUT,"shots","01-prelock-n1-desk1.png")});
        const t = await snapText(p); dump["prelock-n1-desk1"]=t; scan("prelock-n1-desk1", t);
      }
      if (night===3 && i===1){
        await p.screenshot({path: path.join(OUT,"shots","02-prelock-n4-desk2-bowl-offer.png")});
        const t = await snapText(p); dump["prelock-n4-desk2"]=t; scan("prelock-n4-desk2", t);
      }
      await lock(p);
    }
    await teach.click("#btnCloseNight");
    await new Promise(r=>setTimeout(r,1500));
    for (let i=0;i<4;i++){
      const p=desks[i];
      const ok = await p.waitForSelector("#fhResult",{timeout:25000}).then(()=>true).catch(()=>false);
      if (!ok){ log("no result state night",night+1,"desk",i+1); continue; }
      const t = await snapText(p);
      const key = `result-n${night+1}-desk${i+1}`;
      dump[key]=t; scan(key,t);
      const shot = true;
      if (shot) await p.screenshot({path: path.join(OUT,"shots",`res-n${night+1}-d${i+1}.png`)});
      // measurements
      const m = await p.evaluate(()=>{
        const g=(s)=>document.querySelector(s);
        const r=(e)=>e?e.getBoundingClientRect():null;
        const figs=[...document.querySelectorAll("#fhResult *")].filter(e=>e.children.length===0 && /[0-9]/.test(e.textContent||"")).map(e=>({t:(e.textContent||"").trim().slice(0,30), fs:parseFloat(getComputedStyle(e).fontSize)})).filter(x=>x.fs>=34);
        const txt=(s)=>{const e=g(s);return e?(e.textContent||"").trim():null;};
        const gold=[...document.querySelectorAll("#fhResult *")].filter(e=>{const cs=getComputedStyle(e);const s=(cs.backgroundImage||"")+" "+(cs.backgroundColor||"")+" "+(cs.borderColor||"")+" "+(cs.boxShadow||"");return /rgb\((2[0-4][0-9]|25[0-5]),\s*(1[5-9][0-9]|2[0-2][0-9]),\s*([0-9]|[1-9][0-9]|1[0-3][0-9])\)/.test(s);}).map(e=>e.className||e.tagName).slice(0,12);
        return {
          hero: r(g(".fh-who-came")), head: r(g(".fh-result-head")||g(".fh-sellout")),
          chain: r(g(".fh-chain")), renew: r(g(".fh-renewals")), lock: !!g("#fhLock"),
          turned: r(g(".fh-turned")), figs,
          headFs: g(".fh-result-head")?parseFloat(getComputedStyle(g(".fh-result-head")).fontSize):null,
          resale: r(g(".fh-resale")), resaleText: txt(".fh-resale"),
          next: r(g("#fhNextNight")), what: r(g(".fh-what")),
          arenaLabels: [...document.querySelectorAll(".fh-arena-labels span")].map(e=>(e.textContent||"").trim()).filter(Boolean),
          cause: txt(".fh-renewal-cause"), floorLine: txt(".fh-renewal-floor"),
          callback: txt(".fh-repeat-callback"),
          rail: (()=>{const e=[...document.querySelectorAll("#fhResult .fh-rail, #fhResult [class*=rail], #fhResult [class*=dock]")][0];return e?(e.innerText||"").replace(/\n/g," | "):null;})(),
          bodyTop: (document.getElementById("gameBody")||document.body).innerText.split("\n").slice(0,40),
          gold,
          scrollY: window.scrollY, vh: window.innerHeight,
        };
      });
      dump[key+"__measure"]=m;
      await p.click("#fhNextNight").catch(()=>{});
      await new Promise(r=>setTimeout(r,600));
    }
    log("night",night+1,"settled");
  }
  // REVEAL: student two peaks gate
  await adv();
  for (let stage=0; stage<=7; stage++){
    const t = await snapText(desks[0]);
    const has = /two peaks|peaked at|cheaper ticket/i.test(t);
    log(`REVEAL stage ${stage}: student twoPeaks panel = ${has}`);
    dump[`reveal-stage-${stage}`]=t; scan(`reveal-${stage}`,t);
    if (stage===0) await desks[0].screenshot({path:path.join(OUT,"shots","reveal-stage0-desk1.png")});
    if (has) { await desks[0].screenshot({path:path.join(OUT,"shots",`reveal-stage${stage}-desk1.png`)}); break; }
    const btn = await teach.$("#btnRevealNext"); if(!btn) break;
    await btn.click(); await new Promise(r=>setTimeout(r,900));
  }
  fs.writeFileSync(path.join(OUT,"dump.json"), JSON.stringify(dump,null,1));
  fs.writeFileSync(path.join(OUT,"drive.log"), notes.join("\n"));
  await browser.close();
  server.kill();
  process.exit(0);
})().catch(e=>{ console.error("DRIVER FAILED", e); process.exit(1); });
