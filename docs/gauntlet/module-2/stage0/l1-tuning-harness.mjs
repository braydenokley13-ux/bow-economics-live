#!/usr/bin/env node
/**
 * M2 L1 "FULL HOUSE" — constant-tuning harness (BC-2 discharge attempt).
 *
 * Deterministic brute force over the SHIPPED constants. It imports the built
 * module (runtime/dist/modules/fullHouse.js) rather than re-declaring any
 * number, so this harness cannot drift from the lesson: if a constant moves,
 * this moves with it.
 *
 * Run from the repo root, after `npm run build --prefix runtime`:
 *     node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs
 *
 * Exit 0 only when every property below holds.
 *
 * The two defects this exists to kill (SELECTION_ECON_REVIEW.md, "If C wins"
 * repairs 1 and 2, and build charter BC-2):
 *
 *   R6  — error costs ran 16.5x against the LOW price at New York, because
 *         the total-revenue optimum sat one grid step above a hard capacity
 *         clamp. TOLERANCE ADOPTED HERE: regret is measured at equal
 *         distance from the TRUE (continuous) per-book argmax — not at equal
 *         grid offsets, which the review showed is an artifact — and the
 *         worse-side/better-side ratio must stay <= 3.0 for every
 *         market x card x reachable state, at every offset from $2 to $10.
 *         3.0 is the threshold Design C set for itself and failed; the
 *         review's own restated bar is one order of magnitude, so 3.0 is the
 *         stricter of the two and is what this harness enforces. There is no
 *         "the shock night is exempt" clause: the shock card is measured on
 *         the same 3.0 bar as every other card.
 *
 *   R8  — Memphis could not exceed 75.3% fill at any legal price on any
 *         night, so the projector would show the big market sold out and the
 *         small market half dark, five nights running. Bar: every market
 *         must reach >= 95% fill at some legal price, and on more than one
 *         card.
 *
 * Everything else here guards the things a retune could plausibly break: a
 * flat strategy landscape, a collapsed Two Peaks gap, a dead second book, an
 * unrecoverable market, a dead event dial, a dominant fixed price.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..", "..", "..");
const DIST = path.join(REPO, "runtime", "dist", "modules", "fullHouse.js");

if (!fs.existsSync(DIST)) {
  console.error(`[l1-tuning] built module not found at ${DIST}`);
  console.error("[l1-tuning] run `npm run build --prefix runtime` first — this harness never re-declares constants.");
  process.exit(2);
}

const mod = await import(path.toNamespaceObject ? DIST : DIST);
const {
  MARKETS,
  CARDS,
  PRICE_MIN,
  PRICE_MAX,
  PRICE_STEP,
  PRICE_GRID,
  RENEWALS_START,
  TWO_PEAKS_CARD_ID,
  curveFor,
  settleNight,
  renewalDelta,
  ticketPeakPrice,
  totalPeakPrice,
} = mod;
void createRequire;

/* ------------------------------------------------------------- helpers -- */

const REGRET_OFFSETS = [2, 4, 6, 8, 10];
const REGRET_TOLERANCE = 3.0;
const FILL_BAR = 0.95;

/** Reachable (renewals, carry) states: renewals is clamped 0-100 by the reducer; carry is 0..eventFans*eventMax. */
function reachableStates(market) {
  const states = [];
  for (let r = 0; r <= 100; r += 10) {
    for (const carry of [0, Math.round(market.eventFans * market.eventMax)]) {
      states.push({ renewals: r, carry });
    }
  }
  return states;
}

/** Total revenue (gate + in-arena) at any real-valued price, capacity-clamped, no costs. */
function totalRevenue(market, curve, price) {
  const q = Math.min(market.capacity, Math.max(0, Math.round(curve.base - curve.sens * price)));
  return price * q + market.ancillary * q;
}

/** Continuous argmax of total revenue, found by a fine scan then golden refinement. */
function continuousTotalPeak(market, curve) {
  let best = PRICE_MIN;
  let bestVal = -Infinity;
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += 0.05) {
    const v = totalRevenue(market, curve, p);
    if (v > bestVal) {
      bestVal = v;
      best = p;
    }
  }
  return { price: Math.round(best * 100) / 100, revenue: bestVal };
}

function fmt(n) {
  return typeof n === "number" ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(n);
}

const results = [];
function check(id, title, ok, detail) {
  results.push({ id, title, ok, detail });
  const flag = ok ? "PASS" : "FAIL";
  console.log(`${flag}  ${id} — ${title}`);
  for (const line of detail) console.log(`        ${line}`);
}

console.log("=".repeat(96));
console.log("M2 L1 FULL HOUSE — constant-tuning harness (BC-2)");
console.log("=".repeat(96));
console.log(`Price dial: $${PRICE_MIN}-$${PRICE_MAX} step $${PRICE_STEP} (${PRICE_GRID.length} points)`);
console.log(`Cards: ${CARDS.map((c) => c.id).join(", ")}   Markets: ${MARKETS.map((m) => m.id).join(", ")}`);
console.log(`Reachable states swept per market x card: ${reachableStates(MARKETS[0]).length}`);
console.log("");

/* ------------------------------------------------- P1 — R6 error symmetry -- */
{
  const rows = [];
  let worst = { ratio: 0 };
  let ok = true;
  for (const market of MARKETS) {
    for (const card of CARDS) {
      let cardWorst = { ratio: 0 };
      for (const st of reachableStates(market)) {
        const curve = curveFor(market, card, st.renewals, st.carry);
        const peak = continuousTotalPeak(market, curve);
        for (const d of REGRET_OFFSETS) {
          const lo = peak.price - d;
          const hi = peak.price + d;
          if (lo < PRICE_MIN || hi > PRICE_MAX) continue; // offset leaves the legal dial — not an error a pair can make
          const lossLow = peak.revenue - totalRevenue(market, curve, lo);
          const lossHigh = peak.revenue - totalRevenue(market, curve, hi);
          const a = Math.max(lossLow, lossHigh);
          const b = Math.max(1, Math.min(lossLow, lossHigh));
          const ratio = a / b;
          if (ratio > cardWorst.ratio) cardWorst = { ratio, d, renewals: st.renewals, carry: st.carry, lossLow, lossHigh, peak: peak.price };
        }
      }
      if (cardWorst.ratio > worst.ratio) worst = { ...cardWorst, market: market.id, card: card.id };
      if (cardWorst.ratio > REGRET_TOLERANCE) ok = false;
      rows.push(
        `${market.id.padEnd(10)} ${card.id}  worst ratio ${cardWorst.ratio.toFixed(2).padStart(6)}x at +/-$${cardWorst.d} ` +
          `(p*=$${cardWorst.peak}, renewals ${cardWorst.renewals}, low loss $${fmt(Math.round(cardWorst.lossLow))}, high loss $${fmt(Math.round(cardWorst.lossHigh))})`,
      );
    }
  }
  rows.push(`WORST OVERALL: ${worst.ratio.toFixed(2)}x (${worst.market} ${worst.card}) against a ${REGRET_TOLERANCE.toFixed(1)}x bar`);
  check("P1", `R6 — error costs symmetric within ${REGRET_TOLERANCE}x at every market x card x reachable state`, ok, rows);
}

/* ------------------------------------------------------- P2 — R8 full house -- */
{
  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    const perCard = [];
    for (const card of CARDS) {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      let best = 0;
      let bestPrice = null;
      for (const p of PRICE_GRID) {
        const s = settleNight(market, curve, p, 0, false, card.bowlOffer);
        const fill = s.turnout / market.capacity;
        if (fill > best) {
          best = fill;
          bestPrice = p;
        }
      }
      perCard.push({ card: card.id, fill: best, price: bestPrice });
    }
    const cardsAtBar = perCard.filter((c) => c.fill >= FILL_BAR);
    const bestOverall = perCard.reduce((a, b) => (b.fill > a.fill ? b : a));
    if (cardsAtBar.length < 2) ok = false;
    rows.push(
      `${market.id.padEnd(10)} best fill ${(bestOverall.fill * 100).toFixed(1)}% on ${bestOverall.card} at $${bestOverall.price} · ` +
        `cards reaching ${(FILL_BAR * 100).toFixed(0)}%: ${cardsAtBar.length === 0 ? "NONE" : cardsAtBar.map((c) => `${c.card}@$${c.price}`).join(", ")}`,
    );
    rows.push(`${" ".repeat(11)}per-card max fill: ${perCard.map((c) => `${c.card} ${(c.fill * 100).toFixed(1)}%`).join(" · ")}`);
  }
  check("P2", `R8 — every market reaches a full house (>=${FILL_BAR * 100}% fill) on at least two cards`, ok, rows);
}

/* -------------------------------------------------- P3 — optima are distinct -- */
{
  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    const optima = CARDS.slice(0, 4).map((card) => {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      return { card: card.id, price: totalPeakPrice(market, curve) };
    });
    const distinct = new Set(optima.map((o) => o.price));
    const spread = Math.max(...optima.map((o) => o.price)) - Math.min(...optima.map((o) => o.price));
    if (distinct.size !== optima.length || spread < 6 * PRICE_STEP) ok = false;
    rows.push(`${market.id.padEnd(10)} ${optima.map((o) => `${o.card} $${o.price}`).join(" · ")}  (distinct ${distinct.size}/4, spread $${spread})`);
  }
  check("P3", "graded landscape — the cash-best price is a different price on every card", ok, rows);
}

/* ------------------------------------------------------ P4 — Two Peaks gap -- */
{
  const rows = [];
  let ok = true;
  const card = CARDS.find((c) => c.id === TWO_PEAKS_CARD_ID);
  for (const market of MARKETS) {
    const curve = curveFor(market, card, RENEWALS_START, 0);
    const tp = ticketPeakPrice(market, curve);
    const gp = totalPeakPrice(market, curve);
    const steps = (tp - gp) / PRICE_STEP;
    if (steps < 2) ok = false;
    const qAtTicket = Math.min(market.capacity, Math.max(0, curve.base - curve.sens * tp));
    const qAtTotal = Math.min(market.capacity, Math.max(0, curve.base - curve.sens * gp));
    rows.push(
      `${market.id.padEnd(10)} ${card.id}: ticket peak $${tp} (${fmt(qAtTicket)} fans) · total peak $${gp} (${fmt(qAtTotal)} fans) · ` +
        `gap $${tp - gp} = ${steps} dial steps`,
    );
  }
  // Also report where the gap is largest anywhere, as tuning information.
  let widest = { steps: -1 };
  for (const market of MARKETS) {
    for (const c of CARDS) {
      const curve = curveFor(market, c, RENEWALS_START, 0);
      const steps = (ticketPeakPrice(market, curve) - totalPeakPrice(market, curve)) / PRICE_STEP;
      if (steps > widest.steps) widest = { steps, market: market.id, card: c.id };
    }
  }
  rows.push(`widest gap anywhere: ${widest.steps} steps (${widest.market} ${widest.card})`);
  check("P4", `Two Peaks — ticket-revenue max and total-revenue max differ by >=2 dial steps on ${TWO_PEAKS_CARD_ID}, both markets`, ok, rows);
}

/* ------------------------------------------ P5 — two books, no exchange rate -- */
{
  const rows = [];
  let ok = true;
  let minGap = Infinity;
  for (const market of MARKETS) {
    for (const card of CARDS) {
      for (const st of reachableStates(market)) {
        const curve = curveFor(market, card, st.renewals, st.carry);
        let cashBest = { p: null, v: -Infinity };
        let renewBest = { p: null, v: -Infinity };
        for (const p of PRICE_GRID) {
          const cash = settleNight(market, curve, p, 0, false, card.bowlOffer).net;
          const ren = renewalDelta(market, p, 0);
          if (cash > cashBest.v) cashBest = { p, v: cash };
          if (ren > renewBest.v) renewBest = { p, v: ren };
        }
        const renAtCashBest = renewalDelta(market, cashBest.p, 0);
        const cashAtRenBest = settleNight(market, curve, renewBest.p, 0, false, card.bowlOffer).net;
        if (cashBest.p === renewBest.p) ok = false;
        if (!(renAtCashBest < renewBest.v && cashAtRenBest < cashBest.v)) ok = false;
        minGap = Math.min(minGap, Math.abs(cashBest.p - renewBest.p));
      }
    }
    const nominal = CARDS.map((card) => {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      let cashBest = { p: null, v: -Infinity };
      for (const p of PRICE_GRID) {
        const cash = settleNight(market, curve, p, 0, false, card.bowlOffer).net;
        if (cash > cashBest.v) cashBest = { p, v: cash };
      }
      return `${card.id} cash $${cashBest.p} vs renewals $${market.planPrice}`;
    });
    rows.push(`${market.id.padEnd(10)} ${nominal.join(" · ")}`);
  }
  rows.push(`smallest cash-argmax / renewals-argmax separation over all reachable states: $${minGap}`);
  check("P5", "R4 — the cash-best price is never the renewals-best price, and each is strictly worse on the other book", ok, rows);
}

/* ------------------------------------------------- P6 — repeat-card movement -- */
{
  const rows = [];
  let ok = true;
  const n1 = CARDS.find((c) => c.id === "N1");
  const n5 = CARDS.find((c) => c.id === "N5");
  for (const market of MARKETS) {
    // Two honest lines a real pair could hold: the season-plan price (renewals climb) and a
    // consistently expensive price that still draws a crowd on the quiet card (renewals fall).
    for (const policy of [
      { label: "held the plan price all week", price: market.planPrice },
      { label: "held $" + (market.planPrice + 30) + " all week", price: market.planPrice + 30 },
    ]) {
      if (policy.price > PRICE_MAX) continue;
      let renewals = RENEWALS_START;
      let carry = 0;
      let n1Turnout = null;
      let n5Turnout = null;
      for (const card of CARDS) {
        const curve = curveFor(market, card, renewals, carry);
        const s = settleNight(market, curve, policy.price, 0, false, card.bowlOffer);
        if (card.id === "N1") n1Turnout = s.turnout;
        if (card.id === "N5") n5Turnout = s.turnout;
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, policy.price, 0)));
        carry = 0;
      }
      const delta = n5Turnout - n1Turnout;
      const expectSign = renewalDelta(market, policy.price, 0) > 0 ? 1 : -1;
      const gotSign = Math.sign(delta);
      if (gotSign !== expectSign || Math.abs(delta) < 100) ok = false;
      rows.push(
        `${market.id.padEnd(10)} ${policy.label.padEnd(30)} same price both nights: N1 ${fmt(n1Turnout)} -> N5 ${fmt(n5Turnout)} (${delta > 0 ? "+" : ""}${fmt(delta)} fans, renewals ended ${renewals}%)`,
      );
    }
  }
  check("P6", "C9 — N5 replays N1's card and the crowd moves, in the direction the desk's own renewals moved", ok, rows);
}

/* ------------------------------------------------- P7 — recoverability (R5) -- */
{
  const rows = [];
  let ok = true;
  let worst = { margin: Infinity };
  for (const market of MARKETS) {
    for (const card of CARDS) {
      for (const st of reachableStates(market)) {
        const curve = curveFor(market, card, st.renewals, st.carry);
        let best = -Infinity;
        let bestP = null;
        for (const p of PRICE_GRID) {
          const net = settleNight(market, curve, p, 0, false, card.bowlOffer).net;
          if (net > best) {
            best = net;
            bestP = p;
          }
        }
        if (best <= 0) ok = false;
        if (best < worst.margin) worst = { margin: best, market: market.id, card: card.id, renewals: st.renewals, price: bestP };
      }
    }
  }
  rows.push(
    `thinnest reachable night: ${worst.market} ${worst.card} at renewals ${worst.renewals}% — best legal action clears the building bill by $${fmt(Math.round(worst.margin))} (at $${worst.price})`,
  );
  check("P7", "R5 — from every reachable state at least one legal price clears the night's bill", ok, rows);
}

/* ----------------------------------------- P8 — the aggressive line has a gradient -- */
{
  const rows = [];
  let ok = true;
  const shock = CARDS.reduce((a, b) => (b.draw > a.draw ? b : a));
  for (const market of MARKETS) {
    const curve = curveFor(market, shock, RENEWALS_START, 0);
    let zeroes = 0;
    for (const p of PRICE_GRID) {
      if (settleNight(market, curve, p, 0, false, shock.bowlOffer).turnout <= 0) zeroes += 1;
    }
    const atTop = settleNight(market, curve, PRICE_MAX, 0, false, shock.bowlOffer);
    if (zeroes > 0) ok = false;
    rows.push(`${market.id.padEnd(10)} ${shock.id}: dead prices ${zeroes}/${PRICE_GRID.length} · at the $${PRICE_MAX} top of the dial ${fmt(atTop.turnout)} fans still come ($${fmt(atTop.total)} in)`);
  }
  check("P8", "PLAY_REVIEW fix 13 — on the biggest night every legal price returns a real crowd (no dead top of the dial)", ok, rows);
}

/* --------------------------------------------------- P9 — the event dial is live -- */
{
  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    // Marginal season value of spending the max on night i, holding every night at its own cash-best price.
    const seasonWithSpendOn = (spendNightIndex) => {
      let cash = 0;
      let renewals = RENEWALS_START;
      let carry = 0;
      for (let i = 0; i < CARDS.length; i += 1) {
        const card = CARDS[i];
        const curve = curveFor(market, card, renewals, carry);
        const price = totalPeakPrice(market, curve);
        const spend = i === spendNightIndex ? market.eventMax : 0;
        const s = settleNight(market, curve, price, spend, false, card.bowlOffer);
        cash += s.net;
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, price, spend)));
        carry = Math.round(market.eventFans * spend);
      }
      return cash;
    };
    const baseline = seasonWithSpendOn(-1);
    const deltas = CARDS.map((c, i) => ({ card: c.id, delta: seasonWithSpendOn(i) - baseline }));
    const last = deltas[deltas.length - 1].delta;
    const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
    const spread = best.delta - Math.min(...deltas.map((d) => d.delta));
    // The falsifiable claim is NOT "spend early" (which would be a fixed rule and therefore a
    // dominant strategy). It is that WHEN you spend decides whether it pays at all: at least one
    // night where the max spend is strictly profitable, a final night where it is strictly a
    // waste, and a spread between best and worst night worth more than the whole dial.
    if (!(best.delta > 0 && last < 0 && spread > market.eventMax)) ok = false;
    rows.push(
      `${market.id.padEnd(10)} season cash change from spending the max on each night: ${deltas.map((d) => `${d.card} ${d.delta >= 0 ? "+" : ""}$${fmt(Math.round(d.delta))}`).join(" · ")}`,
    );
    rows.push(
      `${" ".repeat(11)}best night to spend: ${best.card} (+$${fmt(Math.round(best.delta))}) · spread across nights $${fmt(Math.round(spread))} vs a $${fmt(market.eventMax)} dial`,
    );
  }
  check("P9", "C10 — WHEN you spend on the night decides whether it pays: profitable on some night, pure waste on the last, spread bigger than a night's bill", ok, rows);
}

/* ------------------------------------------- P10 — no dominant fixed price rule -- */
{
  const rows = [];
  let ok = true;
  // Measured over the four DISTINCT cards only. N5 is N1's card by construction, so any price that
  // is right on N1 is trivially right on N5 too — counting it would measure the design's own
  // path-dependence beat as if it were a dominant-strategy defect.
  const distinctCards = CARDS.filter((c) => c.repeatOf === null);
  for (const market of MARKETS) {
    const optima = distinctCards.map((card) => totalPeakPrice(market, curveFor(market, card, RENEWALS_START, 0)));
    let bestCoverage = 0;
    let bestPrice = null;
    for (const p of PRICE_GRID) {
      const covered = optima.filter((o) => Math.abs(o - p) <= PRICE_STEP).length;
      if (covered > bestCoverage) {
        bestCoverage = covered;
        bestPrice = p;
      }
    }
    if (bestCoverage > 2) ok = false;
    rows.push(
      `${market.id.padEnd(10)} best single fixed price $${bestPrice} lands within one dial step of the night's best on ${bestCoverage}/${distinctCards.length} distinct cards`,
    );
  }
  check("P10", "R1 — no single fixed price is right on more than two of the four distinct cards", ok, rows);
}

/* ------------------------------------ P11 — the capacity option is a real decision -- */
{
  const rows = [];
  let ok = true;
  const shock = CARDS.find((c) => c.bowlOffer);
  for (const market of MARKETS) {
    const curve = curveFor(market, shock, RENEWALS_START, 0);
    let helps = null;
    let hurts = null;
    for (const p of PRICE_GRID) {
      const closed = settleNight(market, curve, p, 0, false, true).net;
      const open = settleNight(market, curve, p, 0, true, true).net;
      if (open > closed && helps === null) helps = { p, gain: open - closed };
      if (open < closed && hurts === null) hurts = { p, loss: closed - open };
    }
    if (!helps || !hurts) ok = false;
    rows.push(
      `${market.id.padEnd(10)} opening ${fmt(market.bowlSeats)} more seats for $${fmt(market.bowlCost)}: ` +
        `helps from $${helps ? helps.p : "-"} (+$${helps ? fmt(helps.gain) : "-"}) · pure cost from $${hurts ? hurts.p : "-"} (-$${hurts ? fmt(hurts.loss) : "-"})`,
    );
  }
  check("P11", "the Night-4 capacity option is conditional on your own price — it helps low and wastes money high", ok, rows);
}

/* --------------------------------------------------------------- verdict -- */
console.log("");
console.log("=".repeat(96));
const failed = results.filter((r) => !r.ok);
if (failed.length === 0) {
  console.log(`VERDICT: ALL ${results.length} PROPERTIES HOLD — BC-2's two named defects are repaired at the shipped constants.`);
  console.log("=".repeat(96));
  process.exit(0);
}
console.log(`VERDICT: ${failed.length} of ${results.length} PROPERTIES FAIL — ${failed.map((f) => f.id).join(", ")}`);
console.log("=".repeat(96));
process.exit(1);
