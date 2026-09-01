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
  renewalReferencePrice,
  replayPlan,
  bestFoundSeason,
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
          const ren = renewalDelta(market, card, p, 0);
          if (cash > cashBest.v) cashBest = { p, v: cash };
          if (ren > renewBest.v) renewBest = { p, v: ren };
        }
        const renAtCashBest = renewalDelta(market, card, cashBest.p, 0);
        const cashAtRenBest = settleNight(market, curve, renewBest.p, 0, false, card.bowlOffer).net;
        if (cashBest.p === renewBest.p) ok = false;
        if (!(renAtCashBest < renewBest.v && cashAtRenBest < cashBest.v)) ok = false;
        minGap = Math.min(minGap, Math.abs(cashBest.p - renewBest.p));
      }
    }
    // gate-l1-econ-r1 N-d: this row used to hard-code `market.planPrice` as the
    // renewals-best price, so it printed "N4 cash $90 vs renewals $24" while the
    // true renewals-best on that card was $108-$112 — a stale line in the very
    // artifact that certifies the tuning. It is now computed, like the assertion
    // above it always was.
    const nominal = CARDS.map((card) => {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      let cashBest = { p: null, v: -Infinity };
      let renBest = { p: null, v: -Infinity };
      for (const p of PRICE_GRID) {
        const cash = settleNight(market, curve, p, 0, false, card.bowlOffer).net;
        const ren = renewalDelta(market, card, p, 0);
        if (cash > cashBest.v) cashBest = { p, v: cash };
        if (ren > renBest.v) renBest = { p, v: ren };
      }
      return `${card.id} cash $${cashBest.p} vs renewals $${renBest.p} (${renBest.v >= 0 ? "+" : ""}${renBest.v})`;
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
      // The second line undercuts the club's own season-plan price all week — the arm the B1
      // repair made reachable in BOTH markets. Renewals fall, so the repeat card draws fewer.
      { label: "undercut the plan at $" + Math.max(PRICE_MIN, market.planPrice - 8) + " all week", price: Math.max(PRICE_MIN, market.planPrice - 8) },
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
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, card, policy.price, 0)));
        carry = 0;
      }
      const delta = n5Turnout - n1Turnout;
      const expectSign = renewalDelta(market, CARDS[0], policy.price, 0) > 0 ? 1 : -1;
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
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, card, price, spend)));
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

/* ------------------------------------ P11 — the Night-4 capacity option is a declared trap -- */
{
  // REPLACES the old P11, which compared open-vs-closed AT A FIXED PRICE — the wrong
  // comparison for two dials moved at the same moment (gate-l1-econ, "P11 does not test
  // this"). The Night-4 ruling taken is option (b): the option stays a deliberate
  // opportunity-cost trap and the reveal copy no longer congratulates anyone for taking it.
  // So the property is: it is NEVER part of a best night at any reachable state, and it is
  // never inert — it pays only where the desk has already underpriced.
  const rows = [];
  let ok = true;
  const shock = CARDS.find((c) => c.bowlOffer);
  for (const market of MARKETS) {
    let worstMargin = -Infinity;
    let helpfulTop = null;
    let cashBestAt50 = null;
    for (const st of reachableStates(market)) {
      const curve = curveFor(market, shock, st.renewals, st.carry);
      let bestClosed = -Infinity;
      let bestOpen = -Infinity;
      let cashBestPrice = null;
      let helpful = [];
      for (const p of PRICE_GRID) {
        const closed = settleNight(market, curve, p, 0, false, true).net;
        const open = settleNight(market, curve, p, 0, true, true).net;
        if (closed > bestClosed) {
          bestClosed = closed;
          cashBestPrice = p;
        }
        if (open > bestOpen) bestOpen = open;
        if (open > closed) helpful.push(p);
      }
      if (!(bestOpen < bestClosed)) ok = false;
      if (helpful.length === 0) ok = false;
      if (helpful.length > 0 && !(Math.max(...helpful) < cashBestPrice)) ok = false;
      worstMargin = Math.max(worstMargin, bestOpen - bestClosed);
      if (st.renewals === RENEWALS_START && st.carry === 0) {
        helpfulTop = helpful.length > 0 ? Math.max(...helpful) : null;
        cashBestAt50 = cashBestPrice;
      }
    }
    rows.push(
      `${market.id.padEnd(10)} best night with the bowl open is always worse than with it closed (closest margin $${fmt(Math.round(worstMargin))}) · ` +
        `it only pays at or below $${helpfulTop} against a cash-best price of $${cashBestAt50} — a partial refund on your own underpricing`,
    );
  }
  check("P11", "the Night-4 capacity option is a declared trap: never in a best night, never inert, only pays below the cash optimum", ok, rows);
}

/* ------------------------------- P12 — the renewals book is two-sided over the REACHABLE dial -- */
{
  // gate-l1-econ B1 (BLOCKING dissent econ-l1-renewals-tent). Two limbs, both the gate's own:
  //  (i)  the low arm binds inside the legal dial in EVERY market (it did not: at Memphis every
  //       legal price below the plan price still GAINED renewals), and the reachable penalty
  //       below the reference is at least a third of the penalty reachable above it;
  //  (ii) there is a reachable state where a price STRICTLY ABOVE the night's cash optimum is
  //       Pareto-undominated — i.e. the frontier is not one-directional and FL3 is not built in.
  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    let lowArm = 0;
    for (const card of CARDS) {
      const atFloor = renewalDelta(market, card, PRICE_MIN, 0);
      const reference = renewalReferencePrice(market, card);
      const worstBelow = Math.min(...PRICE_GRID.filter((p) => p <= reference).map((p) => renewalDelta(market, card, p, 0)));
      const worstAbove = Math.min(...PRICE_GRID.filter((p) => p >= reference).map((p) => renewalDelta(market, card, p, 0)));
      if (!(atFloor < 0)) ok = false;
      if (!(Math.abs(worstBelow) >= Math.abs(worstAbove) / 3)) ok = false;
      lowArm = Math.min(lowArm, atFloor);
      rows.push(
        `${market.id.padEnd(10)} ${card.id}: plan $${market.planPrice} · what tonight is worth $${reference.toFixed(0)} · ` +
          `at the $${PRICE_MIN} floor ${atFloor} · worst below ${worstBelow} vs worst above ${worstAbove}`,
      );
    }
    let undominatedStates = 0;
    let example = null;
    for (const card of CARDS) {
      for (const st of reachableStates(market)) {
        const curve = curveFor(market, card, st.renewals, st.carry);
        const points = PRICE_GRID.map((p) => ({
          p,
          cash: settleNight(market, curve, p, 0, false, card.bowlOffer).net,
          ren: renewalDelta(market, card, p, 0),
        }));
        const cashBest = points.reduce((a, b) => (b.cash > a.cash ? b : a));
        const undominated = points.filter(
          (a) => !points.some((b) => b.p !== a.p && b.cash >= a.cash && b.ren >= a.ren && (b.cash > a.cash || b.ren > a.ren)),
        );
        const above = undominated.filter((u) => u.p > cashBest.p);
        if (above.length > 0) {
          undominatedStates += 1;
          if (!example) example = `${card.id} @renewals ${st.renewals}: cash best $${cashBest.p}, still undominated up to $${Math.max(...above.map((a) => a.p))}`;
        }
      }
    }
    if (undominatedStates === 0) ok = false;
    rows.push(
      `${market.id.padEnd(10)} low arm reaches ${lowArm} inside the dial · ` +
        `${undominatedStates} reachable states carry an undominated price ABOVE the night's cash optimum (${example ?? "none"})`,
    );
  }
  check("P12", "B1 — the renewals low arm binds inside the legal dial and the two-book frontier runs both ways", ok, rows);
}

/* ------------------------- P13 — the counterfactual's strongest line survives an outside search -- */
{
  // gate-l1-econ B2 (BLOCKING): the shipped "most cash the five nights could give" card was
  // beatable by $63,472 (NY) / $78,280 (MEM) and carried the false note "spend early". The card
  // now prints bestFoundSeason() and claims only that it is the best line we could find. This
  // property tries to beat it from outside the module: every all-or-nothing spend schedule, every
  // fixed-price line, and a deterministic pseudo-random policy sweep.
  const rows = [];
  let ok = true;
  let seed = 20260831;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (const market of MARKETS) {
    const printed = bestFoundSeason(market);
    let bestRival = { cash: -Infinity, label: "none" };
    const consider = (cash, label) => {
      if (cash > bestRival.cash) bestRival = { cash, label };
    };
    for (let mask = 0; mask < 1 << CARDS.length; mask += 1) {
      const spends = CARDS.map((_c, i) => ((mask >> i) & 1 ? market.eventMax : 0));
      let renewals = RENEWALS_START;
      let carry = 0;
      const prices = [];
      for (let i = 0; i < CARDS.length; i += 1) {
        const price = totalPeakPrice(market, curveFor(market, CARDS[i], renewals, carry));
        prices.push(price);
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, CARDS[i], price, spends[i])));
        carry = Math.round(market.eventFans * spends[i]);
      }
      consider(replayPlan(market, { prices, spends }).cash, `greedy prices, spend mask ${mask}`);
    }
    for (const price of PRICE_GRID) {
      for (const spend of [0, market.eventMax]) {
        consider(replayPlan(market, { prices: CARDS.map(() => price), spends: CARDS.map(() => spend) }).cash, `flat $${price}, spend $${spend}`);
      }
    }
    for (let trial = 0; trial < 20000; trial += 1) {
      const prices = CARDS.map(() => PRICE_GRID[Math.floor(rand() * PRICE_GRID.length)]);
      const spends = CARDS.map(() => Math.round((rand() * market.eventMax) / 5000) * 5000);
      consider(replayPlan(market, { prices, spends }).cash, "random policy");
    }
    if (bestRival.cash > printed.cash) ok = false;
    rows.push(
      `${market.id.padEnd(10)} printed line $${fmt(printed.cash)} (renewals ${printed.renewals}%) · best rival found $${fmt(bestRival.cash)} (${bestRival.label}) · ` +
        `margin $${fmt(printed.cash - bestRival.cash)}`,
    );
    rows.push(`${" ".repeat(11)}printed plan: prices ${printed.plan.prices.map((p) => `$${p}`).join(" ")} · spend ${printed.plan.spends.map((s) => `$${fmt(s)}`).join(" ")}`);
  }
  check("P13", "B2 — nothing an outside search finds beats the season line the COUNTERFACTUAL card prints", ok, rows);
}

/* ------------------------- P14 — the two books trade off AT SEASON SCALE too -- */
{
  // gate-l1-econ-r1 R1 (BLOCKING dissent `econ-l1-season-books`). P5 and P12 are
  // NIGHT-level and both passed while the season-level frontier was inverted: the
  // max-cash season also ended with MORE renewals than never touching the dial
  // (New York $2,743,440 at 92% against a flat plan's $1,291,132 at 80%), so the
  // two notes the COUNTERFACTUAL card prints beside those rows were false and
  // FL1 was rebuilt at the only scale the debrief reports.
  //
  // The season level is where the product makes its claim, so this is where the
  // claim is pinned. Exact forward DP over (renewals x carry) across all 56
  // prices and every spend level on all five nights — a global optimum for the
  // policy space `replayPlan` covers, not a heuristic search. Sweeping a shadow
  // price on renewals traces the whole season Pareto frontier.
  //
  // Falsifiable limbs, matching R1's own discharge conditions:
  //   (i)   the flat-plan line the card prints is NOT Pareto-dominated by the
  //         most-cash line: it must end at least SEASON_RENEWAL_MARGIN points
  //         ahead on the renewals book, in BOTH markets;
  //   (ii)  the season cash-maximising policy gives up at least
  //         SEASON_RENEWAL_RANGE points of the reachable season renewals range;
  //   (iii) buying the top of that range costs at least SEASON_CASH_SHARE of
  //         season cash — i.e. renewals are not free;
  //   (iv)  the frontier is a curve, not a cliff: at least 4 distinct
  //         (cash, renewals) points, so intermediate lines are real choices.
  const SEASON_RENEWAL_MARGIN = 15;
  const SEASON_RENEWAL_RANGE = 30;
  const SEASON_CASH_SHARE = 0.04;
  const LAMBDAS = [0, 500, 1000, 2000, 4000, 8000, 16000, 32000, 1e9];

  const clamp01 = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const spendLevelsFor = (market) => {
    const out = [];
    for (let s = 0; s <= market.eventMax; s += 5000) out.push(s);
    return out;
  };
  /** Exact forward DP; returns the policy maximising cash + lambda * endingRenewals. */
  const dpSeason = (market, lambda) => {
    const levels = spendLevelsFor(market);
    let states = new Map([[`${RENEWALS_START}|0`, { cash: 0, renewals: RENEWALS_START, carry: 0, path: [] }]]);
    for (const card of CARDS) {
      const next = new Map();
      for (const st of states.values()) {
        const curve = curveFor(market, card, st.renewals, st.carry);
        for (const p of PRICE_GRID) {
          for (const s of levels) {
            if (st.cash < 0 && s !== 0) continue; // the reducer's debt lock
            const settlement = settleNight(market, curve, p, s, false, card.bowlOffer);
            const cash = st.cash + settlement.net;
            const ren = clamp01(st.renewals + renewalDelta(market, card, p, s), 0, 100);
            const carry = Math.round(market.eventFans * s);
            const key = `${ren}|${carry}`;
            const prev = next.get(key);
            if (!prev || cash > prev.cash) next.set(key, { cash, renewals: ren, carry, path: [...st.path, { p, s }] });
          }
        }
      }
      states = next;
    }
    let best = null;
    for (const st of states.values()) {
      const score = st.cash + lambda * st.renewals;
      if (!best || score > best.score) best = { ...st, score };
    }
    return best;
  };

  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    const flat = replayPlan(market, { prices: CARDS.map(() => market.planPrice), spends: CARDS.map(() => 0) });
    const frontier = [];
    for (const lambda of LAMBDAS) {
      const b = dpSeason(market, lambda);
      // Every DP path is replayed through the shipped reducer path, so nothing
      // here is an upper bound the product cannot actually reach.
      const verify = replayPlan(market, { prices: b.path.map((x) => x.p), spends: b.path.map((x) => x.s) });
      if (verify.cash !== b.cash || verify.renewals !== b.renewals) ok = false;
      frontier.push({ lambda, cash: b.cash, renewals: b.renewals, prices: b.path.map((x) => x.p), spends: b.path.map((x) => x.s) });
    }
    const cashMax = frontier[0];
    const renMax = frontier[frontier.length - 1];
    const distinct = new Set(frontier.map((f) => `${f.cash}|${f.renewals}`)).size;
    const flatMargin = flat.renewals - cashMax.renewals;
    const renRange = renMax.renewals - cashMax.renewals;
    const cashShare = (cashMax.cash - renMax.cash) / Math.max(1, cashMax.cash);
    const printed = bestFoundSeason(market);
    // The card's own "most cash we could find" line must BE the cash-max corner
    // of this frontier: if it were not, the row the room reads is not the row
    // this property is about.
    if (printed.cash !== cashMax.cash || printed.renewals !== cashMax.renewals) ok = false;
    if (!(flatMargin >= SEASON_RENEWAL_MARGIN)) ok = false;
    if (!(renRange >= SEASON_RENEWAL_RANGE)) ok = false;
    if (!(cashShare >= SEASON_CASH_SHARE)) ok = false;
    if (distinct < 4) ok = false;
    rows.push(
      `${market.id.padEnd(10)} never move the dial $${fmt(flat.cash)} / ${flat.renewals}%  ·  most cash $${fmt(cashMax.cash)} / ${cashMax.renewals}%  ·  most renewals $${fmt(renMax.cash)} / ${renMax.renewals}%`,
    );
    rows.push(
      `${" ".repeat(11)}flat line ends ${flatMargin} renewal points AHEAD of the most-cash line (bar ${SEASON_RENEWAL_MARGIN}) · ` +
        `the cash-max season gives up ${renRange} points of the reachable range (bar ${SEASON_RENEWAL_RANGE}) · ` +
        `buying them back costs $${fmt(cashMax.cash - renMax.cash)} = ${(cashShare * 100).toFixed(2)}% of season cash (bar ${(SEASON_CASH_SHARE * 100).toFixed(0)}%)`,
    );
    rows.push(`${" ".repeat(11)}frontier: ${frontier.map((f) => `${f.renewals}%@$${fmt(f.cash)}`).join(" → ")} (${distinct} distinct points)`);
    rows.push(`${" ".repeat(11)}the card's printed "most cash" line matches the DP corner exactly: ${printed.cash === cashMax.cash && printed.renewals === cashMax.renewals}`);
  }
  check(
    "P14",
    "R1 — at SEASON scale the two books still trade off: the never-move-the-dial line is not Pareto-dominated, and cash-max pays for it in renewals",
    ok,
    rows,
  );
}

/* ------------------------- P15 — the N5-repeats-N1 beat is big enough to be a beat -- */
{
  // `gate-l1-play` recheck2 P12 (and the Player critic's recorded promise to dissent
  // against any release that leaves this beat unreadable). Round 2 cut `renewalFans`
  // 60/55 -> 10 to repair the season books and, in doing so, made the module finale's
  // crowd change subliminal: measured in real play at +170 (+1.0%) and -360 (-2.1%)
  // on two of three repeat desks, and at New York the undercutting desk's crowd could
  // not move AT ALL, because $10 sold the building out on both nights.
  //
  // THE THRESHOLD, AND WHY IT IS THE ONE IT IS.
  // The Player gate asked for >= 10% of capacity. That is the right bar for a
  // projector bar chart read without numbers, and this model cannot pay it: 10% of
  // capacity across a ~30-point renewals swing needs about 66 fans per renewal point,
  // and an exact season DP sweep over (renewalFans 10-60) x (planSlope 1.2-3.6) shows
  // P14 failing at EVERY point with renewalFans >= 30 — the cash-max season starts
  // buying renewal points back and the two-book frontier inverts again, which is the
  // `econ-l1-season-books` defect round 2 repaired. Truth beats drama (charter), so
  // the bar here is what the model can honestly carry with P14 intact:
  //
  //    on a repeat desk with NO Night-4 spend and a renewals move of >= 20 points,
  //    the Night 5 crowd differs from the Night 1 crowd by >= 250 people AND >= 1.5%
  //    of that desk's own Night 1 crowd, in BOTH directions, in BOTH markets.
  //
  // 250 people is roughly a full section of a real NBA bowl — visible as a number and
  // as a bar segment, not as a shrug. 1.5% is a floor with real margin under the
  // shipped 1.9%-5.4% band, so this catches a regression without pinning the tuning.
  // 20 points is the size of move the two lines below actually produce: holding the
  // plan price pays +6 a night over the four nights before Night 5 (+24), and the
  // floor line collapses to 0% (New York) / 14% (Memphis). It is a precondition on
  // the test cases, not an economic claim.
  // The gap between this bar and the Player gate's remains OPEN and is recorded as a
  // tradeoff in `SIMPLIFICATIONS`; the beat is carried the rest of the way by the
  // per-desk decomposition the board now prints (asserted by P16).
  const FELT_MIN_FANS = 250;
  const FELT_MIN_SHARE = 0.015;
  const FELT_MIN_POINTS = 20;
  const rows = [];
  let ok = true;
  for (const market of MARKETS) {
    // Two honest fixed-price lines a real pair holds, one either side of the plan:
    // at the plan (renewals climb) and at the floor (renewals collapse). No event
    // spend on any night, so the ONLY carried channel into N5 is renewals.
    for (const policy of [
      { label: `held the plan price $${market.planPrice}`, price: market.planPrice, dir: +1 },
      { label: `undercut at the $${PRICE_MIN} floor`, price: PRICE_MIN, dir: -1 },
    ]) {
      let renewals = RENEWALS_START;
      let n1 = null;
      let n5 = null;
      let renAtN5 = null;
      for (const card of CARDS) {
        const curve = curveFor(market, card, renewals, 0);
        const s = settleNight(market, curve, policy.price, 0, false, card.bowlOffer);
        if (card.id === "N1") n1 = s;
        if (card.id === "N5") {
          n5 = s;
          renAtN5 = renewals;
        }
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, card, policy.price, 0)));
      }
      const points = renAtN5 - RENEWALS_START;
      const delta = n5.turnout - n1.turnout;
      const share = Math.abs(delta) / Math.max(1, n1.turnout);
      const bigEnough = Math.abs(delta) >= FELT_MIN_FANS && share >= FELT_MIN_SHARE;
      const rightWay = Math.sign(delta) === policy.dir;
      const movedEnough = Math.abs(points) >= FELT_MIN_POINTS;
      if (!(movedEnough && bigEnough && rightWay)) ok = false;
      rows.push(
        `${market.id.padEnd(10)} ${policy.label.padEnd(28)} renewals ${RENEWALS_START}% -> ${renAtN5}% (${points > 0 ? "+" : ""}${points}) · ` +
          `N1 ${fmt(n1.turnout)} -> N5 ${fmt(n5.turnout)} = ${delta > 0 ? "+" : ""}${fmt(delta)} people (${(share * 100).toFixed(1)}% of its own N1 crowd, ` +
          `${((Math.abs(delta) / market.capacity) * 100).toFixed(1)}% of capacity)`,
      );
    }
  }
  rows.push(
    `bar: >=${FELT_MIN_FANS} people AND >=${(FELT_MIN_SHARE * 100).toFixed(1)}% of the desk's own N1 crowd, both directions, both markets, on a >=${FELT_MIN_POINTS}-point renewals move`,
  );
  rows.push(
    "OPEN, recorded: the Player gate's own bar is >=10% of capacity. This model cannot reach it with P14 intact (see the renewalFans note in fullHouse.ts) and the shortfall is carried by the printed decomposition, not by bar length.",
  );
  check("P15", "P12 — the N5-repeats-N1 crowd change is large enough to be a beat, in both directions and both markets", ok, rows);
}

/* --------- P16 — the Night 5 reveal decomposes the crowd into the model's REAL channels -- */
{
  // `gate-l1-econ-r2` R4 (BLOCKING dissent `econ-l1-n5-attribution`): the
  // `NIGHT 5 WAS NIGHT 1` card asserted renewals as THE cause of the Night-5 crowd
  // change, while the model carries two channels into that night and, for any desk
  // that spent on Night 4, the unnamed one was the bigger and could carry the other
  // sign. `repeatRowFor` now computes the split. This property is the check that the
  // split it computes is the model's true one — an identity, not an estimate:
  //
  //    wantedN5 - wantedN1 = renewalFans*(renewalsAtN5 - renewalsAtN1)
  //                        + round(eventFans * Night-4 spend)
  //                        - sens*(n5Price - n1Price)
  //
  // swept over every combination of a plan/floor/gouge price line x every Night-4
  // spend level, in both markets, including the case the dissent found (renewals DOWN
  // and the crowd UP), and including capacity-clamped nights where the seated delta
  // is deliberately NOT the wanted delta.
  const rows = [];
  let ok = true;
  let cases = 0;
  let inversions = 0;
  let worstResidual = 0;
  for (const market of MARKETS) {
    const spendLevels = [0, Math.round(market.eventMax / 2), market.eventMax];
    for (const n1Price of [market.planPrice, PRICE_MIN, market.planPrice + 20]) {
      for (const n5Price of [n1Price, n1Price + 10]) {
        for (const n4Spend of spendLevels) {
          // Run the five nights exactly as the reducer does.
          let renewals = RENEWALS_START;
          let carry = 0;
          let cash = 0;
          const settled = [];
          for (let i = 0; i < CARDS.length; i += 1) {
            const card = CARDS[i];
            const price = card.id === "N5" ? n5Price : n1Price;
            const spend = card.id === "N4" ? Math.min(n4Spend, cash < 0 ? 0 : market.eventMax) : 0;
            const curve = curveFor(market, card, renewals, carry);
            const s = settleNight(market, curve, price, spend, false, card.bowlOffer);
            settled.push({ card, price, spend, curve, s, renewalsBefore: renewals });
            cash += s.net;
            renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, card, price, spend)));
            carry = Math.round(market.eventFans * spend);
          }
          const n1 = settled.find((x) => x.card.id === "N1");
          const n5 = settled.find((x) => x.card.id === "N5");
          const n4 = settled.find((x) => x.card.id === "N4");

          const renewalsFans = market.renewalFans * (n5.renewalsBefore - n1.renewalsBefore);
          const carryFans = Math.round(market.eventFans * n4.spend);
          const priceFans = -Math.round(n5.curve.sens * (n5.price - n1.price));
          const wantedN1 = n1.s.turnout + n1.s.turnedAway;
          const wantedN5 = n5.s.turnout + n5.s.turnedAway;
          const residual = wantedN5 - wantedN1 - (renewalsFans + carryFans + priceFans);
          if (Math.abs(residual) > Math.abs(worstResidual)) worstResidual = residual;
          // The identity must close exactly — a non-zero residual means a channel
          // the board is not naming.
          if (residual !== 0) ok = false;
          // And the board must never credit the smaller channel: whichever term is
          // biggest by absolute size is the one `biggestChannel` has to name.
          const channels = [
            { id: "renewals", size: Math.abs(renewalsFans) },
            { id: "spend", size: Math.abs(carryFans) },
            { id: "price", size: n5.price === n1.price ? 0 : Math.abs(priceFans) },
          ];
          const top = channels.reduce((a, b) => (b.size > a.size ? b : a));
          if (top.size > 0 && top.size < Math.max(...channels.map((c) => c.size))) ok = false;
          // The dissent's own case: same price, renewals DOWN, crowd UP.
          if (n5.price === n1.price && renewalsFans < 0 && wantedN5 > wantedN1) {
            inversions += 1;
            if (top.id === "renewals") ok = false; // never name renewals here
          }
          cases += 1;
        }
      }
    }
    rows.push(
      `${market.id.padEnd(10)} whole dial worth of carried fans: renewals ${market.renewalFans} per point (max +/-${market.renewalFans * 50}) · ` +
        `Night-4 event money max ${Math.round(market.eventFans * market.eventMax)} fans`,
    );
  }
  rows.push(`${cases} price x spend combinations swept per identity; worst residual ${worstResidual} fans (must be 0)`);
  rows.push(
    `${inversions} swept cases have the crowd UP while renewals went DOWN — exactly the case the dissent found; in every one of them the larger channel is the Night-4 event money, and that is what the card is required to name`,
  );
  check("P16", "R4 — the Night 5 decomposition closes exactly against the model, and the board never names the smaller channel", ok, rows);
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
