import { CARDS, MARKETS, PRICE_GRID, RENEWALS_START, curveFor, settleNight, ticketPeakPrice, totalPeakPrice } from "/home/user/bow-economics-live/runtime/dist/modules/fullHouse.js";

const fmt = (n) => n.toLocaleString("en-US");
for (const m of MARKETS) {
  console.log(`\n=== ${m.id}  cap ${fmt(m.capacity)} bill $${fmt(m.bill)} plan $${m.planPrice} anc $${m.ancillary}`);
  for (const c of CARDS) {
    const curve = curveFor(m, c, RENEWALS_START, 0);
    let bestCash = -1e18, bestP = 0, bestGate = -1e18, bestGP = 0;
    const rows = [];
    for (const p of PRICE_GRID) {
      const s = settleNight(m, curve, p, 0, false, false);
      if (s.net > bestCash) { bestCash = s.net; bestP = p; }
      if (s.gate > bestGate) { bestGate = s.gate; bestGP = p; }
      rows.push([p, s]);
    }
    // sellout threshold: highest price at which soldOut
    const soldOutPrices = rows.filter(([p, s]) => s.soldOut).map(([p]) => p);
    const maxSellout = soldOutPrices.length ? Math.max(...soldOutPrices) : null;
    const at120 = rows.find(([p]) => p === 120)[1];
    console.log(` ${c.id} draw${c.draw} ${c.day} tv=${c.tv}: cash-best $${bestP} (net $${fmt(bestCash)}), gate-best $${bestGP}, sellout up to $${maxSellout}, at $120 turnout ${fmt(at120.turnout)} net $${fmt(at120.net)} | ticketPeak $${ticketPeakPrice(m,curve)} totalPeak $${totalPeakPrice(m,curve)}`);
  }
}
