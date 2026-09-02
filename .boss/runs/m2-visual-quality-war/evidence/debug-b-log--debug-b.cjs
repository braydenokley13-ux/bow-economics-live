const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const ROOT = "/home/user/bow-economics-live/runtime";
const PORT = 4459;
const BASE = `http://localhost:${PORT}`;
const SCRATCH = "/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-recheck-regression";
const SNAPSHOT_FILE = path.join(SCRATCH, `debugb-snap-${Date.now()}.json`);

async function waitForServer() {
  for (let i=0;i<100;i++){ try{const r=await fetch(`${BASE}/api/lessons`); if(r.ok) return;}catch{} await new Promise(r=>setTimeout(r,150)); }
  throw new Error("no server");
}
async function main() {
  const server = spawn(process.execPath, [path.join(ROOT,"dist","server","index.js")], { cwd: ROOT, env: {...process.env, PORT:String(PORT), RUNTIME_SNAPSHOT_FILE: SNAPSHOT_FILE}, stdio:["ignore","pipe","pipe"] });
  let log=""; server.stdout.on("data",d=>log+=d); server.stderr.on("data",d=>log+=d);
  await waitForServer();
  console.log("server up", server.pid);
  const browser = await chromium.launch();
  const teach = await browser.newPage({ viewport:{width:1366,height:768} });
  teach.on("dialog", d=>d.accept());
  teach.on("console", m => { if (m.type()==="error") console.log("[teach console.error]", m.text()); });
  await teach.goto(`${BASE}/teach`);
  await teach.selectOption("#lesson","m2l1-full-house");
  await teach.fill("#title","debugB");
  await teach.click("#create");
  await teach.waitForSelector("#room:not([hidden])");
  const code = (await teach.textContent("#code")).trim();
  console.log("code", code);

  const d1 = await browser.newPage({ viewport: {width:1024,height:600} });
  d1.on("dialog", d=>d.accept());
  d1.on("console", m => { if (m.type()==="error") console.log("[d1 console.error]", m.text()); });
  d1.on("pageerror", e => console.log("[d1 pageerror]", e.message));
  await d1.goto(`${BASE}/play`);
  await d1.fill("#joinCode", code);
  await d1.fill("#joinName", "Ari & Tal");
  await d1.click("#btnJoin");
  await d1.waitForSelector("#gameCard:not([hidden])");
  console.log("d1 joined");

  await teach.click("#btnAdvance");
  await teach.waitForSelector(".phasechip.current:text('HOOK')");
  console.log("teach at HOOK");
  await teach.click("#btnAdvance");
  await teach.waitForSelector(".phasechip.current:text('PLAY')");
  console.log("teach at PLAY");

  await d1.waitForSelector("#fhPlayRoot", { timeout: 20000 });
  console.log("d1 has fhPlayRoot");
  await d1.waitForFunction((l)=>document.querySelector(".fh-card-night")?.textContent?.includes(l), "Night 1", {timeout:20000});
  console.log("d1 shows Night 1");

  const hasDial = await d1.evaluate(() => !!document.getElementById("fhPriceDial"));
  console.log("has fhPriceDial:", hasDial);
  const dialVal = await d1.evaluate(() => document.getElementById("fhPriceDial")?.value);
  console.log("dial current value:", dialVal);
  const readoutBefore = await d1.evaluate(() => document.getElementById("fhPriceReadout")?.textContent);
  console.log("readout before:", readoutBefore);

  await d1.$eval("#fhPriceDial", (el, v) => { el.value=String(v); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); }, 41);
  await d1.waitForTimeout(500);
  const readoutAfter = await d1.evaluate(() => document.getElementById("fhPriceReadout")?.textContent);
  console.log("readout after setting to 41 + waiting 500ms:", readoutAfter);
  const dialValAfter = await d1.evaluate(() => document.getElementById("fhPriceDial")?.value);
  console.log("dial value after:", dialValAfter);

  await d1.screenshot({ path: path.join(SCRATCH, "debugB-state.png") });
  const bodySnippet = await d1.evaluate(() => (document.getElementById("gameBody")?.innerText ?? "").trim().slice(0,400));
  console.log("body snippet:", bodySnippet);

  await browser.close();
  server.kill();
  await new Promise(r=>setTimeout(r,300));
}
main().catch(e=>{ console.error("FATAL", e); process.exit(1); });
