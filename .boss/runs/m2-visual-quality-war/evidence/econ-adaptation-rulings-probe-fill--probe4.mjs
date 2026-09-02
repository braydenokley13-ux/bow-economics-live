import { CARDS, MARKETS, PRICE_GRID, RENEWALS_START, curveFor, settleNight } from "/home/user/bow-economics-live/runtime/dist/modules/fullHouse.js";
console.log("SELLOUT vs CASH-BEST (renewals 50, no spend, bowl closed)");
for (const m of MARKETS) for (const c of CARDS) {
  const curve = curveFor(m, c, RENEWALS_START, 0);
  let best=null;
  for (const p of PRICE_GRID) { const s = settleNight(m,curve,p,0,false,false); if(!best||s.net>best.s.net) best={p,s}; }
  const so = PRICE_GRID.map(p=>({p,s:settleNight(m,curve,p,0,false,false)})).filter(x=>x.s.soldOut);
  const hi = so.length? so[so.length-1] : null;
  console.log(`${m.id} ${c.id}: cash-best $${best.p} fill ${best.s.fillPct}% net $${best.s.net.toLocaleString()} | best SELLOUT price ${hi?`$${hi.p} net $${hi.s.net.toLocaleString()} (${(100*hi.s.net/best.s.net).toFixed(0)}% of best)`:"none reachable"}`);
}
