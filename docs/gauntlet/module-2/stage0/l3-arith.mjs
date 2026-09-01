#!/usr/bin/env node
// l3-arith.mjs — Stage-0 arithmetic harness, Module 2 "Money in Motion" / assignment proto-l2-l3.
//
// PURPOSE
// -------
// Three candidate designs (A, B, C — see docs/gauntlet/module-2/DESIGN_{A,B,C}*.md) converge on
// a load-bearing claim for Lesson 3's signature board moment ("the same hand, twice" / "before /
// after, in your own numbers"): that a revenue-sharing rule which taxes a seat's OWN GATE at rate
// `s` (and leaves per-fan ancillary/in-arena spend untaxed) makes that seat's own revenue-
// maximizing ticket price FALL as `s` rises — the arithmetic proof that "sharing helped, and here
// is what it cost" is a mechanism, not a debrief assertion.
//
// Design A names this claim explicitly as INFERRED, NOT VERIFIED and specifies exactly this check
// (DESIGN_A_BOXOFFICE_EVOLVED.md §5, U3): "brute-force the take function across share levels to
// confirm the optimal price falls monotonically in s and by more than one dial step at plausible
// shares." This script is that brute force, run for real for the first time.
//
// MODEL (stated so the arithmetic is auditable, not hidden)
// -----------------------------------------------------------
// Linear demand, capacity-clamped, per market:
//   q(p) = clamp(base - sensitivity * p, 0, capacity)
// Per-night take under a sharing rule that shares ONLY the gate (price × quantity), leaving
// per-fan ancillary/in-arena spend fully with the host (Design A's explicit L3 formula, "Take =
// (1 − s) × own gate + equal share of pot + national money" — pot/national are additive constants
// that do not depend on this seat's own price and are omitted here because they cannot move the
// argmax; only the own-gate/own-ancillary split, which DOES move the argmax, is modeled):
//   take(p, s) = (1 - s) * p * q(p)  +  ancillaryPerFan * q(p)
// This is a genuinely different formula from Design C's L3 spec, where SHARE taxes "gate + in-
// arena + local media" uniformly — a uniform scalar tax on a price-independent-share of ALL
// revenue does NOT move the price argmax (scaling a function by a positive constant does not move
// its maximizer). That distinction is the reason this harness exists rather than being assumed:
// see README-L2L3.md "Modeling notes" for the algebra and the cross-design implication.
//
// MARKETS (modeled, not measured — see SR-1 in SPORTS_REALITY_INPUT.md and R11 simplifications)
// -------------------------------------------------------------------------------------------
// New York and Memphis are the only two markets with fully specified linear-demand constants in
// the source design docs (DESIGN_C_FIRSTPRINCIPLES.md, L1 "SYSTEM THAT REACTS"). Nightly bills are
// adapted from DESIGN_B_REFOUND.md's L1 figures for the same two markets (also modeled). No
// constants are invented for Golden State / OKC — the docs do not specify demand curves for them,
// and fabricating base/sensitivity values for this harness would not be "modeled on" anything.
//
// EXIT CODE IS THE EVIDENCE. Do not edit the pass thresholds to force green.

const MARKETS = {
  NEW_YORK: {
    label: 'New York (Knicks-scale) — modeled, DESIGN_C L1',
    capacity: 19800,
    base: 34000,
    sensitivity: 300, // fans lost per $1 of price
    ancillaryPerFan: 18,
    nightlyBill: 520000, // modeled, adapted from DESIGN_B L1 "building bill ≈ $520,000/night"
  },
  MEMPHIS: {
    label: 'Memphis (Grizzlies-scale) — modeled, DESIGN_C L1',
    capacity: 17794,
    base: 16000,
    sensitivity: 260,
    ancillaryPerFan: 12,
    nightlyBill: 210000, // modeled, adapted from DESIGN_B L1 "building bill ≈ $210,000/night"
  },
};

const SHARES = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
const PRICE_MIN = 10;
const PRICE_MAX = 120;
const PRICE_STEP = 2;

function priceGrid() {
  const grid = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) grid.push(p);
  return grid;
}

function quantity(market, price) {
  const raw = market.base - market.sensitivity * price;
  return Math.max(0, Math.min(market.capacity, raw));
}

function take(market, price, share) {
  const q = quantity(market, price);
  const gate = price * q;
  const ancillary = market.ancillaryPerFan * q;
  return (1 - share) * gate + ancillary;
}

// Brute force: full price grid, exact argmax (ties broken toward the lower price, i.e. the first
// grid point reaching the max — a deterministic, reproducible tie-break).
function optimizeForShare(market, share) {
  let best = null;
  for (const p of priceGrid()) {
    const t = take(market, p, share);
    if (!best || t > best.take + 1e-9) {
      best = { price: p, take: t, quantity: quantity(market, p) };
    }
  }
  return best;
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtPrice(n) {
  return '$' + n.toFixed(0);
}

// ---------------------------------------------------------------------------------------------
// RUN
// ---------------------------------------------------------------------------------------------

const results = {}; // market key -> [{share, price, take, quantity}]
for (const [key, market] of Object.entries(MARKETS)) {
  results[key] = SHARES.map((s) => ({ share: s, ...optimizeForShare(market, s) }));
}

console.log('='.repeat(96));
console.log('L3 ARITHMETIC HARNESS — Module 2 revenue-sharing price-shift claim (Stage-0, brute force)');
console.log('='.repeat(96));
console.log(`Price grid: $${PRICE_MIN}–$${PRICE_MAX} step $${PRICE_STEP} (${priceGrid().length} points)`);
console.log(`Share levels tested: ${SHARES.map((s) => `${Math.round(s * 100)}%`).join(', ')}`);
console.log('');

for (const [key, market] of Object.entries(MARKETS)) {
  console.log('-'.repeat(96));
  console.log(`MARKET: ${market.label}`);
  console.log(
    `  capacity=${market.capacity}  base=${market.base}  sensitivity=${market.sensitivity}/fan-per-$1  ` +
      `ancillary=$${market.ancillaryPerFan}/fan  nightlyBill=${money(market.nightlyBill)}`
  );
  console.log('-'.repeat(96));
  const header = ['share', 'p*', 'quantity', 'take', 'Δprice vs s=0', 'Δsteps', 'margin vs bill'];
  console.log(header.map((h) => h.padEnd(16)).join(''));
  const rows = results[key];
  const baseline = rows[0];
  for (const r of rows) {
    const deltaPrice = r.price - baseline.price;
    const deltaSteps = deltaPrice / PRICE_STEP;
    const margin = r.take - market.nightlyBill;
    console.log(
      [
        `${Math.round(r.share * 100)}%`,
        fmtPrice(r.price),
        Math.round(r.quantity).toString(),
        money(r.take),
        (deltaPrice <= 0 ? '' : '+') + deltaPrice.toFixed(0),
        deltaSteps.toFixed(2),
        (margin >= 0 ? '+' : '') + money(margin),
      ]
        .map((c) => String(c).padEnd(16))
        .join('')
    );
  }
  console.log('');
}

// ---------------------------------------------------------------------------------------------
// CLAIM EVALUATION
// ---------------------------------------------------------------------------------------------

console.log('='.repeat(96));
console.log('CLAIM VERDICTS');
console.log('='.repeat(96));

const claimResults = { i: [], ii: [], iii: [], iv: [] };

for (const [key, market] of Object.entries(MARKETS)) {
  const rows = results[key];
  const prices = rows.map((r) => r.price);

  // (i) own optimal price falls as s rises — compare each step to the previous.
  let fallsEachStep = true;
  for (let idx = 1; idx < rows.length; idx++) {
    if (prices[idx] > prices[idx - 1] + 1e-9) fallsEachStep = false;
  }
  // A market that never moves at all also fails (i) — "falls" requires strict movement somewhere.
  const everMoves = prices[prices.length - 1] < prices[0] - 1e-9;
  const claimIPass = fallsEachStep && everMoves;
  claimResults.i.push({ market: key, pass: claimIPass, fallsEachStep, everMoves });

  // (ii) monotonic — no reversals anywhere in the full sequence (weakly non-increasing).
  let monotonic = true;
  for (let idx = 1; idx < prices.length; idx++) {
    if (prices[idx] > prices[idx - 1] + 1e-9) monotonic = false;
  }
  claimResults.ii.push({ market: key, pass: monotonic });

  // (iii) drop by MORE than one dial step ($2) between s=0 and a plausible tested share.
  // Report the first share level (if any) at which the cumulative drop first exceeds one step,
  // and whether the drop at the largest tested share (50%) exceeds one step.
  const dropAt = (shareIdx) => rows[0].price - rows[shareIdx].price;
  const dropsByStep = rows.map((r, idx) => ({ share: r.share, drop: dropAt(idx), steps: dropAt(idx) / PRICE_STEP }));
  const dropAt50 = dropsByStep[dropsByStep.length - 1];
  const firstExceeding = dropsByStep.find((d) => d.steps > 1 + 1e-9);
  const claimIIIPass = dropAt50.steps > 1 + 1e-9;
  claimResults.iii.push({
    market: key,
    pass: claimIIIPass,
    dropAt50Steps: dropAt50.steps,
    dropAt50Dollars: dropAt50.drop,
    firstExceedingShare: firstExceeding ? firstExceeding.share : null,
  });

  // (iv) no market becomes unwinnable — best achievable take must clear the nightly bill at
  // every tested share level.
  const shortfalls = rows.filter((r) => r.take < market.nightlyBill);
  claimResults.iv.push({ market: key, pass: shortfalls.length === 0, shortfalls });
}

function overall(list) {
  return list.every((r) => r.pass);
}

console.log('');
console.log('CLAIM (i) — each seat\'s own optimal price falls as s rises:');
for (const r of claimResults.i) {
  console.log(
    `  ${r.pass ? 'PASS' : 'FAIL'}  ${r.market.padEnd(12)} fallsEachStep=${r.fallsEachStep}  everMoves=${r.everMoves}`
  );
}
console.log(`  OVERALL: ${overall(claimResults.i) ? 'PASS' : 'FAIL'}`);

console.log('');
console.log('CLAIM (ii) — the fall is monotonic (no reversals across s=0%..50%):');
for (const r of claimResults.ii) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.market.padEnd(12)}`);
}
console.log(`  OVERALL: ${overall(claimResults.ii) ? 'PASS' : 'FAIL'}`);

console.log('');
console.log('CLAIM (iii) — the fall exceeds one dial step ($2) by s=50% (the signature board moment):');
for (const r of claimResults.iii) {
  console.log(
    `  ${r.pass ? 'PASS' : 'FAIL'}  ${r.market.padEnd(12)} drop@50%=${money(r.dropAt50Dollars)} (${r.dropAt50Steps.toFixed(
      2
    )} steps)` + (r.firstExceedingShare != null ? ` firstExceedsAt=${Math.round(r.firstExceedingShare * 100)}%` : ' NEVER EXCEEDS 1 STEP')
  );
}
console.log(`  OVERALL: ${overall(claimResults.iii) ? 'PASS' : 'FAIL'}`);

console.log('');
console.log('CLAIM (iv) — no market becomes unwinnable (best take ≥ nightly bill) under any tested rule:');
for (const r of claimResults.iv) {
  if (r.pass) {
    console.log(`  PASS  ${r.market.padEnd(12)} clears bill at every tested share`);
  } else {
    console.log(`  FAIL  ${r.market.padEnd(12)} shortfall at share(s): ${r.shortfalls.map((s) => Math.round(s.share * 100) + '%').join(', ')}`);
  }
}
console.log(`  OVERALL: ${overall(claimResults.iv) ? 'PASS' : 'FAIL'}`);

const allPass =
  overall(claimResults.i) && overall(claimResults.ii) && overall(claimResults.iii) && overall(claimResults.iv);

console.log('');
console.log('='.repeat(96));
console.log(`FINAL VERDICT: ${allPass ? 'ALL LOAD-BEARING CLAIMS HOLD' : 'AT LEAST ONE LOAD-BEARING CLAIM FAILS'}`);
console.log('='.repeat(96));

if (!allPass) {
  console.log('');
  console.log('This is a finding, not a bug to paper over. See README-L2L3.md "Modeling notes" for the');
  console.log('reading: the New York-scale market is capacity-bound near its s=0 optimum, so the sharing');
  console.log('rule can only push its optimal price down to the capacity boundary, not further — the');
  console.log('"more than one dial step" claim does not hold for a market whose building already sells out.');
}

process.exit(allPass ? 0 : 1);
