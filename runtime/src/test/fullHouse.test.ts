/**
 * Module 2 · Lesson 1 "Full House" — reducer and property tests.
 *
 * Three jobs:
 *  1. the runtime contract (phases, action gating, teacher hooks, view privacy);
 *  2. the BLIND-COMMIT guarantee that earned the Stage-0 STRONG rating — no
 *     view, at any phase, for any surface, carries a demand constant or
 *     anything derived from an action that has not been committed yet;
 *  3. the BC-2 retune, asserted in-suite so a constant edit that quietly
 *     re-breaks R6 or R8 fails `npm test`, not just the standalone harness.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CARDS,
  MARKETS,
  NIGHT_COUNT,
  PRICE_GRID,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  RENEWALS_START,
  REVEAL_STEPS,
  TWO_PEAKS_CARD_ID,
  bestFoundSeason,
  computeAggregate,
  curveFor,
  fullHouseModule,
  renewalDelta,
  renewalReferencePrice,
  replayPlan,
  settleNight,
  ticketPeakPrice,
  totalPeakPrice,
  type FullHouseState,
  type Market,
} from "../modules/fullHouse.js";
import { isOrderedSubsequence, type CanonicalPhase } from "../shared/phases.js";
import type { LessonAction, SeatId } from "../shared/lessonModule.js";

/* ------------------------------------------------------------- helpers -- */

const ctx = (phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") => ({
  phase,
  seatId,
  seatIds: ["seat-1", "seat-2", "seat-3", "seat-4"],
  now: 0,
});

const empty = (): FullHouseState => fullHouseModule.initialState({ sessionId: "s1", seatIds: [] });

function ok(result: ReturnType<typeof fullHouseModule.reduce>): FullHouseState {
  assert.equal(result.ok, true, result.ok ? "" : `expected ok, got: ${result.reason}`);
  return (result as { ok: true; state: FullHouseState }).state;
}

function act(state: FullHouseState, action: LessonAction, phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") {
  return fullHouseModule.reduce(state, action, ctx(phase, seatId));
}

/** Seats N desks and walks the session to PLAY. */
function seated(count: number): FullHouseState {
  let state = empty();
  for (let i = 1; i <= count; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  return state;
}

/** Plays one night for every seated desk at the given price, then rings the bell. */
function playNight(state: FullHouseState, prices: Record<SeatId, number>, spends: Record<SeatId, number> = {}): FullHouseState {
  let next = state;
  for (const [seatId, price] of Object.entries(prices)) {
    next = ok(act(next, { type: "setPrice", price }, "PLAY", seatId));
    const spend = spends[seatId];
    if (spend !== undefined) next = ok(act(next, { type: "setSpend", spend }, "PLAY", seatId));
    next = ok(act(next, { type: "lock" }, "PLAY", seatId));
  }
  return ok(act(next, { type: "teacher:closeNight" }, "PLAY", "teacher"));
}

/** Every number appearing anywhere in a view payload, with its key path. */
function walkNumbers(value: unknown, path = "", out: { path: string; n: number }[] = []): { path: string; n: number }[] {
  if (typeof value === "number") out.push({ path, n: value });
  else if (Array.isArray(value)) value.forEach((v, i) => walkNumbers(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) walkNumbers(v, `${path}.${k}`, out);
  }
  return out;
}

function walkKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => walkKeys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out.push(k);
      walkKeys(v, out);
    }
  }
  return out;
}

/** Names of the hidden demand parameters. None of these may ever be a key in any view. */
const FORBIDDEN_KEYS = [
  "base",
  "base0",
  "sens",
  "sens0",
  "drawBase",
  "drawSens",
  "weekendBase",
  "weekendSens",
  "tvBase",
  "tvSens",
  "renewalFans",
  "eventFans",
  "eventRenewalDollars",
  "planSlope",
  "ancillary",
  "hidden",
  "curve",
];

const ALL_PHASES = fullHouseModule.phases;

/* ----------------------------------------------------- runtime contract -- */

test("fullHouse declares an ordered subsequence of the canonical phases", () => {
  assert.equal(isOrderedSubsequence(fullHouseModule.phases), true);
  assert.deepEqual(
    [...fullHouseModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "COUNTERFACTUAL", "SYNTHESIS", "COMPLETE"],
  );
});

test("desks are handed out deterministically and markets alternate, visibly and unranked", () => {
  const state = seated(4);
  const desks = Object.values(state.desks);
  assert.deepEqual(desks.map((d) => d.deskNumber), [1, 2, 3, 4]);
  assert.deepEqual(desks.map((d) => d.marketId), ["new-york", "memphis", "new-york", "memphis"]);
  // Idempotent: a second takeSeat from the same seat changes nothing.
  const again = ok(act(state, { type: "takeSeat" }, "LOBBY", "seat-1"));
  assert.deepEqual(Object.keys(again.desks), Object.keys(state.desks));
  assert.equal(again.deskOrder.length, 4);
});

test("only the teacher can ring the night bell, release Two Peaks, or advance the reveal", () => {
  const state = seated(1);
  assert.equal(act(state, { type: "teacher:closeNight" }, "PLAY", "seat-1").ok, false);
  assert.equal(act(state, { type: "teacher:twoPeaks" }, "PLAY", "seat-1").ok, false);
  assert.equal(act(state, { type: "teacher:revealNext" }, "REVEAL", "seat-1").ok, false);
  // and a pair cannot price outside PLAY
  assert.equal(act(state, { type: "setPrice", price: 40 }, "HOOK").ok, false);
  assert.equal(act(state, { type: "lock" }, "REVEAL").ok, false);
});

test("the price and spend dials reject anything off the legal grid", () => {
  const state = seated(1);
  assert.equal(act(state, { type: "setPrice", price: 41 }, "PLAY").ok, false); // off the $2 grid
  assert.equal(act(state, { type: "setPrice", price: 8 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "setPrice", price: 200 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "setSpend", spend: 1234 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "setSpend", spend: 999_999 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "setBowl", open: true }, "PLAY").ok, false); // N1 has no capacity option
  assert.equal(ok(act(state, { type: "setPrice", price: 40 }, "PLAY")).desks["seat-1"]!.price, 40);
});

test("a locked night cannot be changed — the commitment is irreversible", () => {
  let state = seated(1);
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY"));
  state = ok(act(state, { type: "lock" }, "PLAY"));
  assert.equal(act(state, { type: "setPrice", price: 20 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "setSpend", spend: 5_000 }, "PLAY").ok, false);
  assert.equal(act(state, { type: "lock" }, "PLAY").ok, false);
});

/* --------------------------------------------------- the blind commitment -- */

test("BLIND COMMIT: the pre-lock student view carries nothing derived from the pending action", () => {
  let state = seated(1);
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY"));
  state = ok(act(state, { type: "setSpend", spend: 20_000 }, "PLAY"));
  const view = fullHouseModule.studentView(state, "seat-1", "PLAY");

  const market = MARKETS.find((m) => m.id === "new-york")!;
  const curve = curveFor(market, CARDS[0]!, RENEWALS_START, 0);
  const outcome = settleNight(market, curve, 40, 20_000, false, false);

  const numbers = walkNumbers(view).map((e) => e.n);
  for (const [label, quantity] of Object.entries({
    turnout: outcome.turnout,
    gate: outcome.gate,
    inArena: outcome.inArena,
    total: outcome.total,
    net: outcome.net,
    fillPct: outcome.fillPct,
    turnedAway: outcome.turnedAway,
    base: curve.base,
    sens: curve.sens,
  })) {
    // A zero is not a leak — the pre-lock view is full of honest zeros (cash on
    // night one, a spend dial at rest). Every other settlement quantity here is
    // non-zero at this price, so the check still has teeth.
    if (quantity === 0) continue;
    assert.equal(
      numbers.includes(quantity),
      false,
      `pre-lock view leaked ${label} (${quantity}) — the pair could read the answer off the wire`,
    );
  }
  // and there is no FIELD that even looks like a projection. (The word "preview"
  // does appear in the house rules, where it is the product telling the pair
  // there isn't one — copy, not a payload.)
  for (const key of walkKeys(view)) {
    for (const word of ["preview", "project", "estimate", "expected", "forecast"]) {
      assert.equal(key.toLowerCase().includes(word), false, `pre-lock view carries a "${key}" field`);
    }
  }
});

test("no view on any surface, at any phase, before or after lock, carries a demand constant", () => {
  // Build a fully played session so every phase has real content to render.
  let state = seated(4);
  const prices = { "seat-1": 34, "seat-2": 24, "seat-3": 90, "seat-4": 60 };
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, prices, { "seat-1": 40_000 });
  state = { ...state, twoPeaksReleased: true, revealStage: REVEAL_STEPS };

  const views: unknown[] = [];
  for (const phase of ALL_PHASES) {
    for (const seatId of Object.keys(state.desks)) views.push(fullHouseModule.studentView(state, seatId, phase));
    views.push(fullHouseModule.teacherView(state, phase));
    views.push(fullHouseModule.boardView(state, phase));
  }
  views.push(fullHouseModule.aggregate(state, "SYNTHESIS"));

  for (const view of views) {
    for (const key of walkKeys(view)) {
      assert.equal(FORBIDDEN_KEYS.includes(key), false, `view leaked a hidden demand parameter under key "${key}"`);
    }
  }

  // Structural check is not enough on its own: also assert the actual curve
  // numbers never appear. Every card's `base` is strictly larger than its
  // market's capacity, so a turnout can never collide with one by accident.
  const forbiddenValues = new Set<number>();
  for (const market of MARKETS) {
    for (const card of CARDS) {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      assert.ok(curve.base > market.capacity, `card ${card.id} base must exceed capacity for this test to be sound`);
      forbiddenValues.add(curve.base);
    }
    forbiddenValues.add(market.base0);
  }
  for (const view of views) {
    for (const entry of walkNumbers(view)) {
      assert.equal(forbiddenValues.has(entry.n), false, `view leaked a demand base (${entry.n}) at ${entry.path}`);
    }
  }
});

test("boardView is never handed a seat identity and never carries one", () => {
  let state = seated(3);
  state = playNight(state, { "seat-1": 34, "seat-2": 24, "seat-3": 90 });
  assert.equal(fullHouseModule.boardView.length, 2, "boardView must take (state, phase) only");
  for (const phase of ALL_PHASES) {
    const raw = JSON.stringify(fullHouseModule.boardView(state, phase));
    for (const seatId of Object.keys(state.desks)) {
      assert.equal(raw.includes(seatId), false, `board view leaked seat id ${seatId} in ${phase}`);
    }
    assert.equal(/seatId/i.test(raw), false, `board view carries a seatId field in ${phase}`);
  }
  // The board identifies desks by the fictional handle device instead.
  const board = fullHouseModule.boardView(state, "REVEAL") as { curves: { deskHandle: string }[] };
  assert.ok(board.curves.every((c) => /^Desk \d+ · /.test(c.deskHandle)));
});

test("a student never sees another seat's books", () => {
  let state = seated(2);
  state = playNight(state, { "seat-1": 34, "seat-2": 24 });
  const own = fullHouseModule.studentView(state, "seat-1", "REVEAL") as { history: { price: number }[] };
  assert.deepEqual(own.history.map((h) => h.price), [34]);
  const raw = JSON.stringify(fullHouseModule.studentView(state, "seat-1", "PLAY"));
  assert.equal(raw.includes("seat-2"), false);
});

/* ------------------------------------------------- BC-2: the retuned constants -- */

test("BC-2 / R6: error costs stay within 3x of each other at every market, card and reachable state", () => {
  // Regret measured at equal distance from the TRUE (continuous) total-revenue
  // argmax — the metric the selection econ review ruled correct, not equal grid
  // offsets. Tolerance 3.0 is Design C's own stated bar (which it failed at
  // 16.5x); the review's fallback bar is one order of magnitude, so this is the
  // stricter of the two.
  const TOLERANCE = 3.0;
  const revenueAt = (market: Market, curve: { base: number; sens: number }, price: number): number => {
    const q = Math.min(market.capacity, Math.max(0, Math.round(curve.base - curve.sens * price)));
    return price * q + market.ancillary * q;
  };
  let worst = 0;
  let worstLabel = "";
  for (const market of MARKETS) {
    for (const card of CARDS) {
      for (let renewals = 0; renewals <= 100; renewals += 10) {
        for (const carry of [0, Math.round(market.eventFans * market.eventMax)]) {
          const curve = curveFor(market, card, renewals, carry);
          let peak = { price: PRICE_MIN, revenue: -Infinity };
          for (let p = PRICE_MIN; p <= PRICE_MAX; p += 0.05) {
            const v = revenueAt(market, curve, p);
            if (v > peak.revenue) peak = { price: p, revenue: v };
          }
          for (const d of [2, 4, 6, 8, 10]) {
            if (peak.price - d < PRICE_MIN || peak.price + d > PRICE_MAX) continue;
            const lossLow = peak.revenue - revenueAt(market, curve, peak.price - d);
            const lossHigh = peak.revenue - revenueAt(market, curve, peak.price + d);
            const ratio = Math.max(lossLow, lossHigh) / Math.max(1, Math.min(lossLow, lossHigh));
            if (ratio > worst) {
              worst = ratio;
              worstLabel = `${market.id} ${card.id} renewals ${renewals} carry ${carry} +/-$${d}`;
            }
          }
        }
      }
    }
  }
  assert.ok(worst <= TOLERANCE, `worst error-cost asymmetry ${worst.toFixed(2)}x at ${worstLabel} (bar ${TOLERANCE}x)`);
});

test("BC-2 / R8: every market can genuinely fill its building at some legal price", () => {
  for (const market of MARKETS) {
    const fills = CARDS.map((card) => {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      return Math.max(...PRICE_GRID.map((p) => settleNight(market, curve, p, 0, false, card.bowlOffer).turnout / market.capacity));
    });
    const best = Math.max(...fills);
    const cardsAtBar = fills.filter((f) => f >= 0.95).length;
    assert.ok(best >= 0.95, `${market.id} tops out at ${(best * 100).toFixed(1)}% fill — R8 not repaired`);
    assert.ok(cardsAtBar >= 2, `${market.id} only reaches a full house on ${cardsAtBar} card(s)`);
  }
});

test("the cash-best price is a different price on every card, in both markets", () => {
  for (const market of MARKETS) {
    const optima = CARDS.filter((c) => c.repeatOf === null).map((card) => totalPeakPrice(market, curveFor(market, card, RENEWALS_START, 0)));
    assert.equal(new Set(optima).size, optima.length, `${market.id} repeats an optimum across cards: ${optima.join(",")}`);
    assert.ok(Math.max(...optima) - Math.min(...optima) >= 6 * PRICE_STEP, `${market.id} optima are too bunched`);
    // and no single fixed price is right on more than two of the four distinct cards
    const coverage = Math.max(...PRICE_GRID.map((p) => optima.filter((o) => Math.abs(o - p) <= PRICE_STEP).length));
    assert.ok(coverage <= 2, `${market.id}: one fixed price is right on ${coverage} of ${optima.length} cards`);
  }
});

test("Two Peaks: the ticket-revenue max and the total-revenue max are at least two dial steps apart", () => {
  const card = CARDS.find((c) => c.id === TWO_PEAKS_CARD_ID)!;
  for (const market of MARKETS) {
    const curve = curveFor(market, card, RENEWALS_START, 0);
    const gapSteps = (ticketPeakPrice(market, curve) - totalPeakPrice(market, curve)) / PRICE_STEP;
    assert.ok(gapSteps >= 2, `${market.id} ${card.id}: Two Peaks gap is only ${gapSteps} steps`);
  }
});

test("R4: the cash book and the renewals book never agree, and each is strictly worse on the other", () => {
  for (const market of MARKETS) {
    for (const card of CARDS) {
      for (let renewals = 0; renewals <= 100; renewals += 10) {
        const curve = curveFor(market, card, renewals, 0);
        const cashBest = PRICE_GRID.reduce((a, p) =>
          settleNight(market, curve, p, 0, false, card.bowlOffer).net > settleNight(market, curve, a, 0, false, card.bowlOffer).net ? p : a,
        );
        const renewBest = PRICE_GRID.reduce((a, p) => (renewalDelta(market, card, p, 0) > renewalDelta(market, card, a, 0) ? p : a));
        assert.notEqual(cashBest, renewBest, `${market.id} ${card.id} @${renewals}: one price is best on both books`);
        assert.ok(renewalDelta(market, card, cashBest, 0) < renewalDelta(market, card, renewBest, 0));
        assert.ok(
          settleNight(market, curve, renewBest, 0, false, card.bowlOffer).net <
            settleNight(market, curve, cashBest, 0, false, card.bowlOffer).net,
        );
      }
    }
  }
});

test("R5: from every reachable state at least one legal price clears the night's bill", () => {
  for (const market of MARKETS) {
    for (const card of CARDS) {
      for (let renewals = 0; renewals <= 100; renewals += 10) {
        const curve = curveFor(market, card, renewals, 0);
        const best = Math.max(...PRICE_GRID.map((p) => settleNight(market, curve, p, 0, false, card.bowlOffer).net));
        assert.ok(best > 0, `${market.id} ${card.id} @renewals ${renewals} cannot clear its bill from any price`);
      }
    }
  }
});

test("the top of the dial is not dead on the biggest night (an aggressive pair still gets a gradient)", () => {
  const shock = CARDS.reduce((a, b) => (b.draw > a.draw ? b : a));
  for (const market of MARKETS) {
    const curve = curveFor(market, shock, RENEWALS_START, 0);
    for (const p of PRICE_GRID) {
      assert.ok(settleNight(market, curve, p, 0, false, shock.bowlOffer).turnout > 0, `${market.id} draws nobody at $${p} on ${shock.id}`);
    }
  }
});

/* ----------------------------------------------- path dependence and the loop -- */

test("REPEAT CARD: N5 replays N1 and the crowd moves with the desk's own renewals", () => {
  // seat-1 (New York) holds the plan price all five nights: renewals climb, so
  // the same card draws MORE the second time. seat-3 (also New York) undercuts
  // its own season-plan price all week — the arm the B1 repair made reachable —
  // so renewals fall and the same card draws LESS.
  const ny = MARKETS.find((m) => m.id === "new-york")!;
  let state = seated(3);
  const under = ny.planPrice - 8;
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    state = playNight(state, { "seat-1": ny.planPrice, "seat-2": 20, "seat-3": under });
  }
  const rows = computeAggregate(state).repeatCard;
  const climber = rows.find((r) => r.deskHandle.startsWith("Desk 1"))!;
  const faller = rows.find((r) => r.deskHandle.startsWith("Desk 3"))!;
  assert.equal(climber.samePrice, true);
  assert.equal(faller.samePrice, true);
  assert.ok(climber.n5Turnout > climber.n1Turnout, "renewals climbed but the N5 crowd did not");
  assert.ok(faller.n5Turnout < faller.n1Turnout, "renewals fell but the N5 crowd did not");
  assert.ok(climber.renewalsAtN5 > climber.renewalsStart);
  assert.ok(faller.renewalsAtN5 < faller.renewalsStart);
});

test("the night-spend dial pays one night late and never touches tonight's gate", () => {
  const ny = MARKETS.find((m) => m.id === "new-york")!;
  let a = seated(1);
  let b = seated(1);
  a = playNight(a, { "seat-1": 34 }, { "seat-1": ny.eventMax });
  b = playNight(b, { "seat-1": 34 }, { "seat-1": 0 });
  const nightA = a.desks["seat-1"]!.nights[0]!;
  const nightB = b.desks["seat-1"]!.nights[0]!;
  assert.equal(nightA.settlement.turnout, nightB.settlement.turnout, "spend changed TONIGHT's crowd");
  assert.ok(nightA.settlement.net < nightB.settlement.net, "the night you pay for it must be visibly worse");
  a = playNight(a, { "seat-1": 34 });
  b = playNight(b, { "seat-1": 34 });
  assert.ok(
    a.desks["seat-1"]!.nights[1]!.settlement.turnout > b.desks["seat-1"]!.nights[1]!.settlement.turnout,
    "the payoff never arrived on the next night",
  );
});

test("debt locks the night-spend dial to $0 and is never terminal", () => {
  let state = seated(1);
  // Price at the very top of the dial on the quiet card: almost nobody comes, the bill still lands.
  state = playNight(state, { "seat-1": PRICE_MAX });
  const desk = state.desks["seat-1"]!;
  assert.ok(desk.cash < 0, "a near-empty building should not clear the bill");
  const view = fullHouseModule.studentView(state, "seat-1", "PLAY") as { spendCap: number; books: { inDebt: boolean } };
  assert.equal(view.spendCap, 0);
  assert.equal(view.books.inDebt, true);
  assert.equal(act(state, { type: "setSpend", spend: 5_000 }, "PLAY").ok, false);
  // Recoverable: the best price on the next card clears the bill and then some.
  const market = MARKETS.find((m) => m.id === "new-york")!;
  const curve = curveFor(market, CARDS[1]!, desk.renewals, 0);
  assert.ok(Math.max(...PRICE_GRID.map((p) => settleNight(market, curve, p, 0, false, false).net)) > 0);
});

/**
 * gate-l1-econ B3 ruling, taken as option (b): the Night-4 capacity option is
 * kept as a DELIBERATE opportunity-cost trap, and the copy that congratulated
 * a pair for taking it is gone (see SHOCK_REVEAL_COPY). Option (a) — retuning
 * so the bowl is part of a best night — was rejected because it requires the
 * cash optimum to sit against the capacity clamp on N4, which is exactly the
 * geometry BC-2/R6 was repaired to remove (16.5x error asymmetry), and because
 * a best line that opens the bowl deletes the FULL HOUSE / turned-away beat the
 * play gate recorded as the lesson's strongest moment.
 *
 * So it must be provably dominated, and provably not inert: it is a partial
 * refund on your own underpricing, never part of a best night.
 */
test("N4 capacity option: never part of a best night, still a live hedge against underpricing", () => {
  for (const market of MARKETS) {
    const shock = CARDS.find((c) => c.bowlOffer)!;
    for (let renewals = 0; renewals <= 100; renewals += 10) {
      for (const carry of [0, Math.round(market.eventFans * market.eventMax)]) {
        const curve = curveFor(market, shock, renewals, carry);
        const bestClosed = Math.max(...PRICE_GRID.map((p) => settleNight(market, curve, p, 0, false, true).net));
        const bestOpen = Math.max(...PRICE_GRID.map((p) => settleNight(market, curve, p, 0, true, true).net));
        assert.ok(
          bestOpen < bestClosed,
          `${market.id} @renewals ${renewals}/carry ${carry}: opening the bowl reaches ${bestOpen} against ${bestClosed} closed — it is no longer a trap, and the reveal copy says it is`,
        );
        // and the trap has teeth only where the desk has already underpriced
        const cashBest = PRICE_GRID.reduce((a, p) =>
          settleNight(market, curve, p, 0, false, true).net > settleNight(market, curve, a, 0, false, true).net ? p : a,
        );
        const helpful = PRICE_GRID.filter(
          (p) => settleNight(market, curve, p, 0, true, true).net > settleNight(market, curve, p, 0, false, true).net,
        );
        assert.ok(helpful.length > 0, `${market.id}: the capacity option is inert — it never helps at any price`);
        assert.ok(
          Math.max(...helpful) < cashBest,
          `${market.id}: the capacity option helps at or above the night's cash-best price, so it is not the trap the copy describes`,
        );
      }
    }
  }
});

/**
 * gate-l1-econ B1 (BLOCKING dissent `econ-l1-renewals-tent`). Two falsifiable
 * limbs, both from the gate's own prescription.
 */
test("B1: the renewals low arm binds inside the legal dial, in every market", () => {
  for (const market of MARKETS) {
    for (const card of CARDS) {
      const reference = renewalReferencePrice(market, card);
      assert.ok(
        renewalDelta(market, card, PRICE_MIN, 0) < 0,
        `${market.id} ${card.id}: the $${PRICE_MIN} floor still GAINS renewals — the low arm is unreachable`,
      );
      const worstBelow = Math.min(...PRICE_GRID.filter((p) => p <= reference).map((p) => renewalDelta(market, card, p, 0)));
      const worstAbove = Math.min(...PRICE_GRID.filter((p) => p >= reference).map((p) => renewalDelta(market, card, p, 0)));
      assert.ok(
        Math.abs(worstBelow) >= Math.abs(worstAbove) / 3,
        `${market.id} ${card.id}: reachable penalty below (${worstBelow}) is under a third of the penalty above (${worstAbove})`,
      );
    }
  }
});

test("B1: the two-book frontier is not one-directional — some price above a night's cash optimum is undominated", () => {
  for (const market of MARKETS) {
    let found = 0;
    for (const card of CARDS) {
      for (let renewals = 0; renewals <= 100; renewals += 10) {
        const curve = curveFor(market, card, renewals, 0);
        const points = PRICE_GRID.map((p) => ({
          p,
          cash: settleNight(market, curve, p, 0, false, card.bowlOffer).net,
          ren: renewalDelta(market, card, p, 0),
        }));
        const cashBest = points.reduce((a, b) => (b.cash > a.cash ? b : a));
        const undominated = points.filter(
          (a) => !points.some((b) => b.p !== a.p && b.cash >= a.cash && b.ren >= a.ren && (b.cash > a.cash || b.ren > a.ren)),
        );
        if (undominated.some((u) => u.p > cashBest.p)) found += 1;
      }
    }
    assert.ok(found > 0, `${market.id}: every price above every night's cash optimum is dominated on both books (FL3 by construction)`);
  }
});

test("B2: the counterfactual's strongest line is not beaten by an exhaustive spend search", () => {
  for (const market of MARKETS) {
    const printed = bestFoundSeason(market);
    const levels = [0, market.eventMax];
    // every all-or-nothing spend schedule, priced night-by-night at its cash best
    for (let mask = 0; mask < 1 << NIGHT_COUNT; mask += 1) {
      const spends = CARDS.map((_c, i) => levels[(mask >> i) & 1]!);
      let renewals = RENEWALS_START;
      let carry = 0;
      const prices: number[] = [];
      for (let i = 0; i < CARDS.length; i += 1) {
        const card = CARDS[i]!;
        const price = totalPeakPrice(market, curveFor(market, card, renewals, carry));
        prices.push(price);
        renewals = Math.min(100, Math.max(0, renewals + renewalDelta(market, card, price, spends[i]!)));
        carry = Math.round(market.eventFans * spends[i]!);
      }
      const rival = replayPlan(market, { prices, spends });
      assert.ok(
        rival.cash <= printed.cash,
        `${market.id}: a plain spend schedule beats the printed line by $${rival.cash - printed.cash}`,
      );
    }
    // and every fixed-price line, with and without a full-season spend
    for (const price of PRICE_GRID) {
      for (const spend of levels) {
        const rival = replayPlan(market, { prices: CARDS.map(() => price), spends: CARDS.map(() => spend!) });
        assert.ok(rival.cash <= printed.cash, `${market.id}: a flat $${price} line beats the printed line`);
      }
    }
  }
});

test("gate-l1-sr F1: no night card's visiting club can be a club a desk in this room is running", () => {
  const forbidden = MARKETS.flatMap((m) => [m.club, m.club.split(" ").slice(-1)[0]!, m.building]);
  for (const card of CARDS) {
    for (const word of forbidden) {
      assert.equal(card.visitor.includes(word), false, `${card.id}'s visitor names ${word}`);
    }
    // and no champion framing: the champion changes every June and is currently a desk in this room
    for (const text of [card.visitor, ...card.notes]) {
      assert.equal(/defending champion|the champions/i.test(text), false, `${card.id} still carries a champion frame: ${text}`);
    }
  }
});

/* --------------------------------------------------- pacing and fallbacks -- */

test("the night bell auto-commits any desk that never locked, at the plan price, and says so", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 90 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  const one = state.desks["seat-1"]!.nights[0]!;
  const two = state.desks["seat-2"]!.nights[0]!;
  assert.equal(one.price, 90);
  assert.equal(one.auto, false);
  assert.equal(two.price, MARKETS.find((m) => m.id === "memphis")!.planPrice);
  assert.equal(two.auto, true);
  assert.equal(state.nightIndex, 1);
});

test("leaving PLAY early closes every remaining night and releases the Two Peaks panel", () => {
  let state = seated(2);
  state = playNight(state, { "seat-1": 34, "seat-2": 24 });
  assert.equal(state.nightIndex, 1);
  const after = fullHouseModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(after.nightIndex, NIGHT_COUNT);
  assert.equal(after.twoPeaksReleased, true);
  assert.equal(after.desks["seat-1"]!.nights.length, NIGHT_COUNT);
  // and the auto-played nights are flagged, not silently presented as the pair's own
  assert.equal(after.desks["seat-1"]!.nights.filter((n) => n.auto).length, NIGHT_COUNT - 1);
});

test("leaving REVEAL early plays out every remaining reveal stage", () => {
  let state = seated(1);
  state = fullHouseModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(state.revealStage, 0);
  const after = fullHouseModule.onPhaseExit!(state, "REVEAL", "ADAPT");
  assert.equal(after.revealStage, REVEAL_STEPS);
});

test("the board shows nothing about a night that is still open", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 90 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  const board = fullHouseModule.boardView(state, "PLAY") as { curves: { cardId: string }[]; lockedCount: number };
  assert.equal(board.curves.length, 0, "the open night's prices are on the projector before the bell");
  assert.equal(board.lockedCount, 1, "the board may show a lock count, and only a lock count");
  const raw = JSON.stringify(board);
  assert.equal(raw.includes("90"), false, "the open night's locked price reached the projector");
});

test("Two Peaks cannot be released before Night 3 has actually been played", () => {
  let state = seated(1);
  assert.equal(act(state, { type: "teacher:twoPeaks" }, "PLAY", "teacher").ok, false);
  for (let i = 0; i < 3; i += 1) state = playNight(state, { "seat-1": 40 });
  state = ok(act(state, { type: "teacher:twoPeaks" }, "PLAY", "teacher"));
  assert.equal(state.twoPeaksReleased, true);
  assert.equal(act(state, { type: "teacher:twoPeaks" }, "PLAY", "teacher").ok, false);
});

test("a late seat gets an honest playable desk, not a broken one", () => {
  let state = seated(1);
  state = playNight(state, { "seat-1": 34 });
  state = playNight(state, { "seat-1": 48 });
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-late"));
  const desk = state.desks["seat-late"]!;
  assert.equal(desk.joinedAtNight, 3);
  assert.equal(desk.nights.length, 2, "the nights it missed must exist, not be blank");
  assert.equal(desk.nights.every((n) => n.stock), true);
  assert.notEqual(desk.cash, 0, "a late desk arrives with real books");
  const view = fullHouseModule.studentView(state, "seat-late", "PLAY") as { history: { stock: boolean }[]; joinedAtNight: number };
  assert.equal(view.joinedAtNight, 3);
  assert.equal(view.history.every((h) => h.stock), true, "the covered nights must be labelled as covered");
});

/* ------------------------------------------------------------- synthesis -- */

test("synthesis cards are computed from this class's locked-at-time numbers", () => {
  let state = seated(4);
  // Two desks in each market, at different prices, so the room supplies a
  // like-for-like pair (same market, same night) for the REVENUE card.
  const prices = { "seat-1": 34, "seat-2": 24, "seat-3": 70, "seat-4": 46 };
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, prices);
  const agg = computeAggregate(state);
  const board = fullHouseModule.boardView(state, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const ids = board.cards.map((c) => c.id);
  assert.deepEqual(ids, ["revenue", "shifters", "loss-leader", "path-dependence", "two-books", "real-world"]);

  // The revenue card must quote a price this room actually charged.
  const revenue = board.cards.find((c) => c.id === "revenue")!;
  assert.match(revenue.body, /\$34|\$70/);
  // The Two Peaks card must quote the peaks computed off a REAL desk's frozen curve.
  const peak = agg.twoPeaks[0]!;
  const lossLeader = board.cards.find((c) => c.id === "loss-leader")!;
  assert.ok(lossLeader.body.includes(`$${peak.ticketPeakPrice}`) && lossLeader.body.includes(`$${peak.totalPeakPrice}`));
  assert.ok(peak.gapSteps >= 2);
});

test("locked-at-time: the Two Peaks numbers do not move when a desk's later state moves (D15)", () => {
  let state = seated(1);
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, { "seat-1": 34 });
  const before = computeAggregate(state).twoPeaks;
  // Mutate the desk's CURRENT renewals — the frozen Night-3 curve must be unaffected.
  const desk = state.desks["seat-1"]!;
  const moved: FullHouseState = { ...state, desks: { ...state.desks, "seat-1": { ...desk, renewals: 5, cash: -999 } } };
  assert.deepEqual(computeAggregate(moved).twoPeaks, before);
});

test("the empty-room synthesis card is honest rather than fabricated", () => {
  const board = fullHouseModule.boardView(empty(), "SYNTHESIS") as { cards: { id: string; body: string }[] };
  assert.equal(board.cards.length, 1);
  assert.match(board.cards[0]!.body, /No nights are in the books yet/);
});

test("aggregate curve points always carry their market and their card (R9)", () => {
  let state = seated(2);
  state = playNight(state, { "seat-1": 34, "seat-2": 24 });
  for (const point of computeAggregate(state).curves) {
    assert.ok(point.marketId && point.cardId && point.deskHandle);
  }
});

test("no board surface ranks anybody by money (D4/R13)", () => {
  let state = seated(3);
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, { "seat-1": 34, "seat-2": 24, "seat-3": 90 });
  state = { ...state, revealStage: REVEAL_STEPS, twoPeaksReleased: true };
  for (const phase of ALL_PHASES) {
    const raw = JSON.stringify(fullHouseModule.boardView(state, phase));
    for (const word of ["rank", "leaderboard", "winner", "score", "place", "badge", "xp", "level"]) {
      assert.equal(new RegExp(`"[^"]*${word}[^"]*"\\s*:`, "i").test(raw), false, `board carries a "${word}" field in ${phase}`);
    }
  }
  // The per-market books the board does show are medians, never a sorted list of desks.
  const reveal = fullHouseModule.boardView(state, "REVEAL") as { books: { medianCash: number; deskCount: number }[] };
  assert.equal(reveal.books.length, MARKETS.length);
});

test("real figures in product copy carry a season stamp (BC-3)", async () => {
  const mod = await import("../modules/fullHouse.js");
  for (const note of mod.SOURCE_NOTES) {
    assert.match(note, /\b(19|20)\d\d\b/, `source note has no date: ${note}`);
  }
  assert.match(mod.SHOCK_REVEAL_COPY, /2023/);
  assert.match(mod.SHOCK_REVEAL_COPY, /2024/);
  assert.match(mod.DYNAMIC_PRICING_COPY, /2009/);
  assert.match(mod.BOARD_HONESTY_LINE, /modeled on real market differences/i);
  // gate-l1-sr F2: the champion reference must be the current one, and no stale one may survive.
  assert.equal(
    mod.SOURCE_NOTES.some((n: string) => /Oklahoma City/i.test(n)),
    false,
    "the stale 2025 champion note is still shipping",
  );
  // gate-l1-sr F5: FedExForum must not be claimed as a single listed season capacity.
  const capacityNote = mod.SOURCE_NOTES.find((n: string) => n.includes("Building capacities"))!;
  assert.match(capacityNote, /modeled seat count/i);
  assert.match(capacityNote, /16,667/);
  // gate-l1-sr F3: the horizon line may no longer invite anyone to multiply one modeled night by eight real dates.
  assert.equal(/eight real home dates/i.test(mod.HORIZON_LINE), false);
  assert.match(mod.MODELED_DOLLARS_LINE, /shrunk to classroom size/i);
});

test("gate-l1-sr F4: every real figure that reaches a screen carries its stamp at the point of use", () => {
  // The capacity is printed on the board tiles, the HOOK panel and EVERY night
  // card. Its season stamp must travel with it, not live once at SYNTHESIS.
  for (const market of MARKETS) {
    assert.match(market.capacityNote, /\b(19|20)\d\d|modeled seat count/, `${market.id} capacity has no point-of-use stamp`);
  }
  let state = seated(2);
  const play = fullHouseModule.studentView(state, "seat-1", "PLAY") as { market: { capacity: number; capacityNote: string } };
  assert.equal(play.market.capacityNote.length > 0, true, "the play card's capacity reaches a student with no stamp");
  const lobby = fullHouseModule.boardView(state, "LOBBY") as { markets: { capacity: number; capacityNote: string }[] };
  assert.equal(lobby.markets.every((m) => m.capacityNote.length > 0), true, "the board's capacity tiles carry no stamp");
  const hook = fullHouseModule.boardView(state, "HOOK") as { markets: { capacityNote: string }[]; modeledDollarsLine: string };
  assert.equal(hook.markets.every((m) => m.capacityNote.length > 0), true);
  assert.ok(hook.modeledDollarsLine.length > 0, "the money scale is still only stated at SYNTHESIS");
  state = playNight(state, { "seat-1": 34, "seat-2": 24 });
  assert.ok(state.nightIndex === 1);
});

/**
 * gate-l1-qa D1/D3 (BLOCKING dissent `qa-teacher-misclick`). The teacher's
 * primary Advance is one tap from the night bell. It still ends the window —
 * that is the manual fallback — but the night the room is actually mid-decision
 * on now settles on the dials the pairs set, per D17's auto-resolve-on-exit
 * precedent, instead of throwing away a real price for the plan price.
 */
test("teacher misclick: leaving PLAY settles the open night on the dials as they stand", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 56 }, "PLAY", "seat-1")); // set, deliberately NOT locked
  state = ok(act(state, { type: "setSpend", spend: 20_000 }, "PLAY", "seat-1"));
  const after = fullHouseModule.onPhaseExit!(state, "PLAY", "REVEAL");
  const n1 = after.desks["seat-1"]!.nights[0]!;
  assert.equal(n1.price, 56, "the price the pair had actually set was thrown away");
  assert.equal(n1.spend, 20_000, "the night spend the pair had actually set was thrown away");
  assert.equal(n1.auto, true, "the night must still be flagged as one nobody locked");
  // a desk that touched nothing is unchanged: it still settles at the plan price
  assert.equal(after.desks["seat-2"]!.nights[0]!.price, MARKETS.find((m) => m.id === "memphis")!.planPrice);
  // and the nights nobody ever saw are still auto-played at the plan price
  assert.equal(after.nightIndex, NIGHT_COUNT);
  assert.equal(after.desks["seat-1"]!.nights[1]!.price, MARKETS.find((m) => m.id === "new-york")!.planPrice);
  // the night bell itself is unchanged: an unlocked desk is the "did nothing" line
  let belled = seated(1);
  belled = ok(act(belled, { type: "setPrice", price: 56 }, "PLAY", "seat-1"));
  belled = ok(act(belled, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  assert.equal(belled.desks["seat-1"]!.nights[0]!.price, MARKETS.find((m) => m.id === "new-york")!.planPrice);
});
