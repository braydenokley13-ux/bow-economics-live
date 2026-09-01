import { CARDS, MARKETS, renewalDelta, renewalReferencePrice, PRICE_GRID } from "/home/user/bow-economics-live/runtime/dist/modules/fullHouse.js";
for (const m of MARKETS) {
  console.log(`\n=== ${m.id} plan $${m.planPrice} premiumSpan ${m.premiumSpan} planSlope ${m.planSlope}`);
  for (const c of CARDS) {
    const ref = renewalReferencePrice(m, c);
    const d90 = renewalDelta(m, c, 90, 0);
    // highest price that still gains renewals
    const gains = PRICE_GRID.filter(p => renewalDelta(m,c,p,0) > 0);
    const best = PRICE_GRID.reduce((a,p)=> renewalDelta(m,c,p,0) > renewalDelta(m,c,a,0) ? p : a, PRICE_GRID[0]);
    console.log(` ${c.id} draw${c.draw} tv=${c.tv}: reference price $${ref.toFixed(2)} | renewals-best price $${best} (+${renewalDelta(m,c,best,0)}) | delta at $90 = ${d90} | delta at $120 = ${renewalDelta(m,c,120,0)} | gains renewals up to $${Math.max(...gains)}`);
  }
}
console.log("\n--- Kid A case: New York, N4, $90, bowl open, spend 0 ---");
const ny = MARKETS[0], n4 = CARDS[3];
console.log("reference price:", renewalReferencePrice(ny,n4).toFixed(2), "| renewalDelta:", renewalDelta(ny,n4,90,0));
console.log("Memphis N4 $90:", renewalDelta(MARKETS[1],n4,90,0), "ref", renewalReferencePrice(MARKETS[1],n4).toFixed(2));
