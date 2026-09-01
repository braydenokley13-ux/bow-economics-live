import { CARDS, MARKETS, PRICE_GRID, RENEWALS_START, curveFor, settleNight } from "/home/user/bow-economics-live/runtime/dist/modules/fullHouse.js";

// Does the highest-priced desk sometimes have the highest cash on a night?
// Simulate class price draws under several plausible student behaviours.
const behaviours = {
  "timid (all $10-$40)": () => 10 + 2*Math.floor(Math.random()*16),      // 10..40
  "spread (all legal)":  () => 10 + 2*Math.floor(Math.random()*56),      // 10..120
  "mid ($20-$60)":       () => 20 + 2*Math.floor(Math.random()*21),
  "aggressive ($60-$120)": () => 60 + 2*Math.floor(Math.random()*31),
};
const N = 4000;
for (const [name, draw] of Object.entries(behaviours)) {
  for (const cardIdx of [0,1,2,3,4]) {
    const card = CARDS[cardIdx];
    let hpWinsCash = 0, hpWinsFill = 0;
    for (let t=0;t<N;t++) {
      // 6-desk class, alternating markets like deskOrder does
      const rows = [];
      for (let d=0; d<6; d++) {
        const m = MARKETS[d % 2];
        const p = draw();
        const curve = curveFor(m, card, RENEWALS_START, 0);
        const s = settleNight(m, curve, p, 0, false, false);
        rows.push({ p, net: s.net, fill: s.fillPct, m: m.id });
      }
      const maxP = Math.max(...rows.map(r=>r.p));
      const maxNet = Math.max(...rows.map(r=>r.net));
      const maxFill = Math.max(...rows.map(r=>r.fill));
      const hp = rows.filter(r=>r.p===maxP);
      if (hp.some(r=>r.net===maxNet)) hpWinsCash++;
      if (hp.some(r=>r.fill===maxFill)) hpWinsFill++;
    }
    console.log(`${name.padEnd(22)} ${card.id}: highest price also highest CASH in ${(100*hpWinsCash/N).toFixed(1)}% of classes; highest FILL in ${(100*hpWinsFill/N).toFixed(1)}%`);
  }
  console.log("");
}
