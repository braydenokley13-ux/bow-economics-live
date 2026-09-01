# Model probes run by econ-truth-w1 (all against runtime/dist/modules/fullHouse.js, the shipped build)

- probe1.mjs — cash-best price, gate-best price, sellout ceiling, turnout/net at $120, ticketPeak
  vs totalPeak, for every market x card. Source of the cash-best table in the report.
- probe2.mjs — 4,000 simulated 6-desk classes per (behaviour x card): does the highest-priced desk
  also have the highest cash / the highest fill? Source of the E17 table.
- probe3.mjs — Night-4 fill denominator with the upper bowl open vs closed (New York); sellout
  turnaway counts at $10 for every market x card; share of distinct price pairs on one card where
  the lower price makes more cash.
- probe4.mjs — cash-best fill and net vs the best reachable sellout price and net, every market x
  card. Source of the "sellout is worth 28-68% of best cash" finding and of the Memphis
  N1/N3/N5 "no sellout reachable at any legal price" finding.
- probe5.mjs — ARGUE_PROMPT satisfiability: 3,000 simulated seasons per (behaviour x desk count),
  is there at least one same-market same-night pair where the lower price made more cash.
- npm-test.log — `cd runtime && npm test`, exit 0, 461/461, this session.
