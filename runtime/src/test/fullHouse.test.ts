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
  OBSERVER_ACTION,
  OBSERVER_MESSAGE,
  observersOf,
  CARDS,
  FULL_HOUSE_UI_COPY,
  MARKETS,
  NIGHT_COUNT,
  OBJECTIVE_COPY,
  PRICE_GRID,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  RENEWALS_START,
  RENEWAL_DELTA_FLOOR,
  GATE_PACKED_FLOOR,
  GATE_BUSY_FLOOR,
  REVEAL_STEPS,
  SIMPLIFICATIONS,
  TWO_PEAKS_CARD_ID,
  CF_ROWS_PER_PAGE,
  bestFoundSeason,
  computeAggregate,
  synthesisCards,
  orderRepeatRows,
  pathDependenceCardBody,
  repeatSummary,
  curveFor,
  fullHouseModule,
  renewalDelta,
  renewalDeltaRaw,
  renewalFloorBinds,
  renewalReferencePrice,
  renewalRuleFor,
  renewalRuleLinesFor,
  renewalShortRuleFor,
  dialCarriedLineFor,
  spendFactLineFor,
  turnoutCauseFor,
  twoPeaksNoteFor,
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

/** Four desks that played all five nights at prices that move — a live deck. */
function playedOut(): FullHouseState {
  let state = seated(4);
  const prices = [34, 58, 70, 46, 34];
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    const p = prices[i]!;
    state = playNight(state, { "seat-1": p, "seat-2": p + 6, "seat-3": p - 6, "seat-4": p });
  }
  return state;
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

test("R4-5: the renewals book is still moving where the pair is actually deciding", () => {
  // The shipped straight-then-clipped gouging arm hit its 20-point limit about
  // $9 above the reference price, which on N1/N2/N5 is below the night's own
  // cash optimum: 43 of the 56 legal prices on N2 returned the identical -20,
  // so a pair playing the money book WELL scored exactly as badly on renewals
  // as a pair pricing $120 to an empty building. Two things have to hold for
  // the second book to be a book at all rather than a night-shaped tax.
  for (const market of MARKETS) {
    for (const card of CARDS) {
      const curve = curveFor(market, card, RENEWALS_START, 0);
      const net = (p: number) => settleNight(market, curve, p, 0, false, card.bowlOffer).net;
      const cashOpt = PRICE_GRID.reduce((a, p) => (net(p) > net(a) ? p : a));
      // (1) the night's own cash-best price is never on the floor
      assert.ok(
        renewalDelta(market, card, cashOpt, 0) > RENEWAL_DELTA_FLOOR,
        `${market.id} ${card.id}: the cash-best price $${cashOpt} already sits on the renewals floor, so every price at or above it reads the same`,
      );
      // (2) across the prices a pair actually argues over, the book discriminates
      const best = Math.max(...PRICE_GRID.map(net));
      const band = PRICE_GRID.filter((p) => net(p) >= best - Math.abs(best) * 0.15);
      const counts = new Map<number, number>();
      for (const p of band) {
        const v = renewalDelta(market, card, p, 0);
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const longest = Math.max(...counts.values());
      assert.ok(
        longest <= Math.ceil(band.length / 3),
        `${market.id} ${card.id}: ${longest} of the ${band.length} prices within 15% of the night's best net read the identical renewals number`,
      );
    }
  }
});

test("R4-5: gouging always costs more than gouging less, and the 20-point limit is still real", () => {
  for (const market of MARKETS) {
    for (const card of CARDS) {
      const reference = renewalReferencePrice(market, card);
      const above = PRICE_GRID.filter((p) => p > reference);
      // strictly monotone before the clamp: the bent arm never stops biting
      for (let i = 1; i < above.length; i += 1) {
        const lo = renewalDeltaRaw(market, card, above[i - 1]!, 0);
        const hi = renewalDeltaRaw(market, card, above[i]!, 0);
        assert.ok(hi <= lo, `${market.id} ${card.id}: $${above[i]} is not worse for renewals than $${above[i - 1]}`);
      }
      // and on a card the dial can genuinely gouge, the limit is still reached
      if (reference < 40) {
        assert.equal(
          renewalDelta(market, card, PRICE_MAX, 0),
          RENEWAL_DELTA_FLOOR,
          `${market.id} ${card.id}: $${PRICE_MAX} no longer reaches the one-night limit`,
        );
        assert.ok(renewalDeltaRaw(market, card, PRICE_MAX, 0) < RENEWAL_DELTA_FLOOR);
      }
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


/* ------------------------------------------- the demand floor, said honestly -- */

test("W3-R10: a one-sided demand floor is never described as 'nobody came either night'", () => {
  // $58 Memphis flat is the corner the econ critic reached: 670 people on Night
  // 1, nobody on Night 5. `floored` is an OR over the two nights, and all three
  // copy sites used to read it as an AND — printing "at that price nobody walked
  // in either time" in the same clause as the 670.
  let state = seated(2);
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, { "seat-1": 58, "seat-2": 58 });
  const rows = computeAggregate(state).repeatCard;
  const mem = rows.find((r) => r.marketId === "memphis")!;
  assert.equal(mem.floored, true, "$58 Memphis must trip the demand floor on one of the two nights");
  assert.equal(mem.bothFloored, false, "this is the ONE-SIDED case");
  assert.ok(mem.n1Turnout > 0, "Night 1 drew a real crowd — that is what makes the old sentence false");
  assert.equal(mem.n5Turnout, 0);

  const card = pathDependenceCardBody([mem], [mem]);
  const summary = repeatSummary([mem]);
  for (const sentence of [card, summary]) {
    assert.equal(/nobody walked in either time/.test(sentence), false, `false over a crowd of ${mem.n1Turnout}: ${sentence}`);
    assert.equal(/nobody came either night/.test(sentence), false, sentence);
    assert.equal(/nobody wanted in at all/.test(sentence), false, sentence);
    assert.match(sentence, /one of the two nights/i, "the honest fact must still be said");
  }
  // The both-nights branch must survive: at $120 nobody comes either time, and
  // there the strong sentence is TRUE and must still be printed.
  let both = seated(1);
  for (let i = 0; i < NIGHT_COUNT; i += 1) both = playNight(both, { "seat-1": PRICE_MAX });
  const bothRow = computeAggregate(both).repeatCard[0]!;
  assert.equal(bothRow.bothFloored, true);
  assert.match(pathDependenceCardBody([bothRow], [bothRow]), /nobody walked in either time/);
});

/* --------------------------------------------- the paged repeat card's order -- */

test("W3-2: no COUNTERFACTUAL group repeats a row while a differing row is un-shown", () => {
  // A clustered room is what a real room produces: the model is deterministic,
  // so two desks in the same market on the same line produce byte-identical
  // rows. Grouping by desk number put two of them in group 1 and every row worth
  // arguing about in group 4.
  let state = seated(6);
  // seats 1/3/5 are New York, 2/4/6 Memphis. Desks 1 and 3 play an identical
  // line; desk 5 differs; the Memphis desks cluster the same way.
  const flat = { "seat-1": 24, "seat-2": 16, "seat-3": 24, "seat-4": 16, "seat-5": 40, "seat-6": 34 };
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, flat);
  const rows = computeAggregate(state).repeatCard;
  assert.equal(rows.length, 6);
  const sig = (r: (typeof rows)[number]): string => `${r.marketId}|${r.n1Price}|${r.n1Turnout}|${r.n5Turnout}|${r.channelLine}`;
  const allSigs = rows.map(sig);
  assert.ok(new Set(allSigs).size < allSigs.length, "this fixture must actually contain duplicate rows");
  for (let from = 0; from < rows.length; from += CF_ROWS_PER_PAGE) {
    const group = rows.slice(from, from + CF_ROWS_PER_PAGE);
    const groupSigs = group.map(sig);
    const shownElsewhere = rows.filter((r) => !group.includes(r)).map(sig);
    const duplicated = groupSigs.length !== new Set(groupSigs).size;
    const differingUnshown = shownElsewhere.some((x) => !groupSigs.includes(x));
    assert.equal(
      duplicated && differingUnshown,
      false,
      `a group reads one row twice while a differing row waits: ${groupSigs.join(" || ")}`,
    );
  }
  // Every desk is still on the card — ordering, never dropping.
  assert.equal(new Set(rows.map((r) => r.deskHandle)).size, 6);
  assert.deepEqual(
    orderRepeatRows(rows).map((r) => r.deskHandle).sort(),
    rows.map((r) => r.deskHandle).sort(),
    "ordering is a permutation",
  );
});

/* ------------------------------------------------------------- synthesis -- */

test("synthesis cards are computed from this class's locked-at-time numbers", () => {
  let state = seated(4);
  // Two desks in each market, at different prices, so the room supplies a
  // like-for-like pair (same market, same night) for the REVENUE card.
  const prices = { "seat-1": 34, "seat-2": 24, "seat-3": 70, "seat-4": 46 };
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, prices);
  const agg = computeAggregate(state);
  // W3: the projector shows ONE card at a time under the teacher's own pager (it
  // was a six-card dashboard grid shrunk to 11.2px bodies to make it fit). Every
  // card must still reach the room, in order, and the pager must wrap.
  type SynthBoard = {
    cards: { id: string; body: string }[];
    cardCount: number;
    synthPage: number;
    synthPageCount: number;
    synthRail: boolean;
  };
  const seen: { id: string; body: string }[] = [];
  let pageState = state;
  const pages = (fullHouseModule.boardView(pageState, "SYNTHESIS") as SynthBoard).synthPageCount;
  assert.equal(pages, 6, "six cards, one per projector frame");
  for (let i = 0; i < pages; i += 1) {
    const frame = fullHouseModule.boardView(pageState, "SYNTHESIS") as SynthBoard;
    assert.equal(frame.cards.length, 1, "more than one card on a projector frame");
    assert.equal(frame.synthPage, i + 1);
    // The sourcing rail and the exit question land on the last card only.
    assert.equal(frame.synthRail, i === pages - 1);
    seen.push(frame.cards[0]!);
    const next = act(pageState, { type: "teacher:synthPage" } as unknown as LessonAction, "SYNTHESIS", "teacher");
    assert.ok(next.ok, "the teacher's synthesis pager was rejected");
    pageState = next.state;
  }
  assert.deepEqual(
    seen.map((c) => c.id),
    ["revenue", "shifters", "loss-leader", "path-dependence", "two-books", "real-world"],
  );
  // Wraps, so a teacher who wants a card back never hits a dead control.
  assert.equal((fullHouseModule.boardView(pageState, "SYNTHESIS") as SynthBoard).synthPage, 1);

  // The revenue card must quote a price this room actually charged.
  const revenue = seen.find((c) => c.id === "revenue")!;
  assert.match(revenue.body, /\$34|\$70/);
  // The Two Peaks card must quote the peaks computed off a REAL desk's frozen curve.
  const peak = agg.twoPeaks[0]!;
  const lossLeader = seen.find((c) => c.id === "loss-leader")!;
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

test("the empty-room synthesis deck is honest rather than fabricated", () => {
  // It is the full rehearsal deck now, not one apology card — but nothing the
  // projector prints may be readable as this room's own arithmetic. The board
  // stages one card per frame, so walk every frame.
  type Frame = { cards: { id: string; title: string; body: string }[]; cardCount: number; synthPageCount: number };
  let state = empty();
  const first = fullHouseModule.boardView(state, "SYNTHESIS") as Frame;
  assert.ok(first.cardCount > 1, "the empty-room deck is still one apology card");
  for (let i = 0; i < first.synthPageCount; i += 1) {
    const frame = fullHouseModule.boardView(state, "SYNTHESIS") as Frame;
    for (const card of frame.cards) {
      assert.match(card.title, /^REHEARSAL — /, `${card.id} could be read as a played card`);
      if (/\$[\d,]|\d+%/.test(card.body)) assert.match(card.body, /Every figure above is a STAND-IN/);
    }
    state = ok(act(state, { type: "teacher:synthPage" }, "SYNTHESIS", "teacher"));
  }
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
test("one fallback per lesson: the bell and a teacher's early exit settle an unlocked desk identically", () => {
  // The two paths used to disagree. Leaving PLAY honoured the pair's pending
  // dials; the bell settled the same desk at the season plan. Same room, same
  // student action, two different economies depending on which control the
  // teacher happened to press — and the bell is the path a real class takes
  // every night. The policy that survives is the one the product PROMISES in
  // three places (the bell's confirm line, the WATCH FOR flag, the desk's AUTO
  // badge): a desk that never locked did not choose. Honouring an unlocked dial
  // would also dissolve LOCK IT IN, the lesson's signature commitment beat.
  const plan = (id: string) => MARKETS.find((m) => m.id === id)!.planPrice;

  let exited = seated(2);
  exited = ok(act(exited, { type: "setPrice", price: 56 }, "PLAY", "seat-1")); // set, deliberately NOT locked
  exited = ok(act(exited, { type: "setSpend", spend: 20_000 }, "PLAY", "seat-1"));
  const afterExit = fullHouseModule.onPhaseExit!(exited, "PLAY", "REVEAL");
  const exitNight = afterExit.desks["seat-1"]!.nights[0]!;

  let belled = seated(2);
  belled = ok(act(belled, { type: "setPrice", price: 56 }, "PLAY", "seat-1"));
  belled = ok(act(belled, { type: "setSpend", spend: 20_000 }, "PLAY", "seat-1"));
  belled = ok(act(belled, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  const bellNight = belled.desks["seat-1"]!.nights[0]!;

  assert.equal(exitNight.price, bellNight.price, "the two close paths settle an unlocked desk at different prices");
  assert.equal(exitNight.spend, bellNight.spend, "the two close paths settle an unlocked desk at different spends");
  assert.equal(exitNight.price, plan("new-york"), "an unlocked desk must settle at its season plan price");
  assert.equal(exitNight.spend, 0, "an unlocked desk must settle having spent nothing");
  assert.equal(exitNight.auto, true, "the night must still be flagged as one nobody locked");

  // A locked desk is untouched by any of this: it settles at what it committed.
  let locked = seated(2);
  locked = ok(act(locked, { type: "setPrice", price: 56 }, "PLAY", "seat-1"));
  locked = ok(act(locked, { type: "lock" }, "PLAY", "seat-1"));
  const afterLock = fullHouseModule.onPhaseExit!(locked, "PLAY", "REVEAL");
  assert.equal(afterLock.desks["seat-1"]!.nights[0]!.price, 56);
  assert.equal(afterLock.desks["seat-1"]!.nights[0]!.auto, false);

  // A desk that touched nothing is unchanged, and the nights nobody ever saw
  // are still auto-played at the plan price.
  assert.equal(afterExit.desks["seat-2"]!.nights[0]!.price, plan("memphis"));
  assert.equal(afterExit.nightIndex, NIGHT_COUNT);
  assert.equal(afterExit.desks["seat-1"]!.nights[1]!.price, plan("new-york"));
});

test("Full House declares a round contract naming the fallback per desk", () => {
  const contract = fullHouseModule.round!;
  let state = seated(2);
  assert.equal(contract.currentKey(state, "PLAY"), "N1");
  assert.equal(contract.currentKey(state, "REVEAL"), null, "no round is open outside PLAY");

  // Both desks unresolved at the start of a night; each is named.
  const before = contract.unresolved(state, "PLAY", ["seat-1", "seat-2"]);
  assert.equal(before.length, 2);

  // A desk sitting on a dial it never locked is told what the dial is NOT worth.
  state = ok(act(state, { type: "setPrice", price: 56 }, "PLAY", "seat-1"));
  const dialled = contract.unresolved(state, "PLAY", ["seat-1", "seat-2"]).find((u) => u.seatId === "seat-1")!;
  assert.match(dialled.fallback, /NOT the \$56/, "the teacher must see the number the desk is about to lose");
  assert.match(dialled.fallback, /\$24/, "and the number it will actually settle at");

  // Locking removes the desk from the unresolved list entirely.
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  const after = contract.unresolved(state, "PLAY", ["seat-1", "seat-2"]);
  assert.deepEqual(after.map((u) => u.seatId), ["seat-2"]);

  // The declared policy and what the close actually does must agree.
  assert.match(contract.fallbackPolicy, /season plan/);
  const closed = ok(act(state, { type: contract.closeHook }, "PLAY", "teacher"));
  assert.equal(closed.desks["seat-2"]!.nights[0]!.price, MARKETS.find((m) => m.id === "memphis")!.planPrice);
});

/* ------------------------------------- m2-visual-quality-war wave 2, Lane C -- */

/**
 * R-9 (ECON_ADAPTATION_RULINGS §7 K1, contract §G, BLOCKING). `onPhaseExit`
 * force-sets `twoPeaksReleased` when PLAY closes, so before this gate every
 * desk's private payload carried its own market's peak prices, gap and revenue
 * figures from REVEAL stage 0 — the answer to the lesson's centrepiece reveal,
 * six teacher presses before the room is shown it. The student gate must match
 * the board's exactly. A client-side gate would not be tested by anything.
 */
test("R-9: a desk never carries Two Peaks before the board has released it", () => {
  let state = seated(4);
  const prices = { "seat-1": 34, "seat-2": 24, "seat-3": 90, "seat-4": 60 };
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, prices, { "seat-1": 40_000 });
  // The state the manual fallback actually produces: released by the phase exit,
  // reveal stage still 0. That is precisely the leak this gate closes.
  state = fullHouseModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(state.twoPeaksReleased, true, "leaving PLAY must still force the release flag");
  assert.equal(state.revealStage, 0, "the phase exit must not advance the staged reveal");

  for (let stage = 0; stage < NIGHT_COUNT + 1; stage += 1) {
    const at = { ...state, revealStage: stage, twoPeaksReleased: true };
    for (const seatId of Object.keys(at.desks)) {
      const view = fullHouseModule.studentView(at, seatId, "REVEAL") as {
        twoPeaks: unknown[];
        twoPeaksReleased: boolean;
      };
      assert.deepEqual(view.twoPeaks, [], `desk ${seatId} carried Two Peaks at reveal stage ${stage}`);
      assert.equal(view.twoPeaksReleased, false, `desk ${seatId} was told Two Peaks was up at stage ${stage}`);
      // and the peak figures themselves are nowhere in the payload
      const board = fullHouseModule.boardView(at, "REVEAL") as { twoPeaks: unknown[] };
      assert.deepEqual(board.twoPeaks, [], `the board itself leaked Two Peaks at stage ${stage}`);
    }
  }

  for (let stage = NIGHT_COUNT + 1; stage <= REVEAL_STEPS; stage += 1) {
    const at = { ...state, revealStage: stage, twoPeaksReleased: true };
    for (const seatId of Object.keys(at.desks)) {
      const view = fullHouseModule.studentView(at, seatId, "REVEAL") as {
        twoPeaks: { marketId: string }[];
        twoPeaksReleased: boolean;
      };
      assert.equal(view.twoPeaksReleased, true, `desk ${seatId} was denied Two Peaks at stage ${stage}`);
      assert.equal(view.twoPeaks.length > 0, true, `desk ${seatId} got an empty Two Peaks at stage ${stage}`);
      // still only its own market — the private surface stays private
      const marketId = at.desks[seatId]!.marketId;
      assert.equal(view.twoPeaks.every((t) => t.marketId === marketId), true);
    }
  }

  // The release flag is still necessary as well as the stage: a teacher who has
  // advanced the reveal without the flag set sees nothing.
  const unreleased = { ...state, revealStage: REVEAL_STEPS, twoPeaksReleased: false };
  const view = fullHouseModule.studentView(unreleased, "seat-1", "REVEAL") as { twoPeaks: unknown[] };
  assert.deepEqual(view.twoPeaks, []);
});

/**
 * R-1 / contract §G: every claim-bearing label the /play surface renders is a
 * module string. If a key disappears the renderer silently falls back to a
 * client literal, which is exactly the drift this wave exists to stop.
 */
test("uiCopy reaches the desk in every student phase, with every registered key", () => {
  const REQUIRED = [
    "nextNightLabel",
    "doorsLine",
    "fillQualifier",
    "whoCameLabel",
    "historyTitle",
    "historyCaption",
    "twoBooksLine",
    "chainLabels",
    // W2 repair-2: the labels the rebuilt /play surface prints. Every one of
    // them is a word the pair reads, so every one of them is registered here
    // rather than typed into the renderer (contract G, R-1).
    "extraSeatsLabel",
    "cameLabel",
    "openSeatsLabel",
    "moreSeatsOpenLabel",
    "moreSeatsClosedLabel",
    "seasonQualifier",
    "tonightQualifier",
    "noNightsYetLine",
    "moreLabel",
    // W2 repair-4 R4-5: the sentences the renderer used to author.
    "twoPeaksTitle",
    "twoPeaksTicketLabel",
    "twoPeaksTotalLabel",
    "noTomorrowLine",
    "stockNightLine",
    "autoNightLine",
    "inArenaNote",
    "bowlPaidNote",
    "renewalsCaption",
  ];
  const CHAIN = ["tickets", "inArena", "bill", "event", "bowl", "cash", "renewals"];

  let state = seated(2);
  const check = (label: string, view: unknown) => {
    const ui = (view as { uiCopy?: Record<string, unknown> }).uiCopy;
    assert.ok(ui, `${label} carried no uiCopy`);
    assert.deepEqual(Object.keys(ui!).sort(), [...REQUIRED].sort(), `${label} uiCopy keys drifted`);
    for (const key of REQUIRED) {
      if (key === "nextNightLabel") continue; // legitimately null on the last night
      if (key === "chainLabels") {
        assert.deepEqual(Object.keys(ui![key] as object).sort(), [...CHAIN].sort(), `${label} chainLabels drifted`);
        for (const c of CHAIN) assert.equal(typeof (ui![key] as Record<string, string>)[c], "string");
        continue;
      }
      assert.equal(typeof ui![key], "string", `${label} uiCopy.${key} is not a string`);
      assert.ok((ui![key] as string).length > 0, `${label} uiCopy.${key} is empty`);
    }
  };

  // an unseated join, then every phase with a real desk, at every night
  check("unseated", fullHouseModule.studentView(empty(), "seat-9", "LOBBY"));
  for (const phase of ALL_PHASES) check(`night 0 ${phase}`, fullHouseModule.studentView(state, "seat-1", phase));
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    state = playNight(state, { "seat-1": 34, "seat-2": 24 });
    for (const phase of ALL_PHASES) check(`after night ${i + 1} ${phase}`, fullHouseModule.studentView(state, "seat-1", phase));
  }

  // The two-books sentence is OBJECTIVE_COPY's own clause, not a retyped copy.
  const ui = (fullHouseModule.studentView(state, "seat-1", "COMPLETE") as { uiCopy: { twoBooksLine: string; fillQualifier: string } }).uiCopy;
  assert.equal(OBJECTIVE_COPY.startsWith(ui.twoBooksLine), true, "twoBooksLine has drifted from OBJECTIVE_COPY");
  assert.match(ui.twoBooksLine, /do not add up to one number/);
  // R-2: the fill qualifier names the denominator that actually moves.
  assert.equal(ui.fillQualifier, "of the seats you opened tonight");
  assert.equal(/capacity/i.test(ui.fillQualifier), false);
  // R-3: no chain label calls either book a profit or a revenue total.
  for (const value of Object.values(FULL_HOUSE_UI_COPY.chainLabels)) {
    assert.equal(/profit|revenue|total/i.test(value), false, `chain label "${value}" grades or totals the books`);
  }
  // D4 / no student-facing timer: the bell line is teacher-paced.
  assert.match(FULL_HOUSE_UI_COPY.doorsLine, /your teacher rings the bell/);
});

test("nextNightLabel is the next night's printed facts, and null when there is no next night", () => {
  let state = seated(1);
  const labelAt = (s: FullHouseState) =>
    (fullHouseModule.studentView(s, "seat-1", "PLAY") as { uiCopy: { nextNightLabel: string | null } }).uiCopy
      .nextNightLabel;

  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    const card = CARDS[i]!;
    const tv = card.tv === "national" ? "national TV" : card.tv === "local" ? "local TV" : "not on TV";
    assert.equal(labelAt(state), `NEXT: NIGHT ${i + 1} → ${card.day} · Draw ${card.draw} · ${tv}`);
    state = playNight(state, { "seat-1": 34 });
  }
  assert.equal(labelAt(state), null, "the books-closed desk was offered a sixth night");

  // Printed facts only: the label never carries a settlement quantity or a
  // demand constant, at any night (BC-4).
  let s2 = seated(1);
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    const label = labelAt(s2) ?? "";
    const market = MARKETS.find((m) => m.id === "new-york")!;
    const curve = curveFor(market, CARDS[i]!, RENEWALS_START, 0);
    const outcome = settleNight(market, curve, 34, 0, false, false);
    for (const [name, q] of Object.entries({
      turnout: outcome.turnout,
      gate: outcome.gate,
      total: outcome.total,
      base: curve.base,
    })) {
      if (q === 0) continue;
      assert.equal(label.includes(String(q)), false, `nextNightLabel leaked ${name} on night ${i + 1}`);
      assert.equal(label.includes(q.toLocaleString()), false, `nextNightLabel leaked ${name} on night ${i + 1}`);
    }
    s2 = playNight(s2, { "seat-1": 34 });
  }
});

/**
 * The settled headline is composed in the module so the renderer prints a
 * sentence instead of assembling one out of loose figures (R-1). Both forms
 * must equal the facts the settlement actually produced.
 */
test("resultHeadline equals the settled facts, for a normal night and for a sellout", () => {
  const market = MARKETS.find((m) => m.id === "new-york")!;

  // normal night: night 1, $34, nothing sold out
  let state = seated(1);
  state = playNight(state, { "seat-1": 34 });
  const curve = curveFor(market, CARDS[0]!, RENEWALS_START, 0);
  const outcome = settleNight(market, curve, 34, 0, false, false);
  const view = fullHouseModule.studentView(state, "seat-1", "PLAY") as {
    lastNight: { resultHeadline: string; soldOut: boolean; turnout: number };
    history: { resultHeadline: string }[];
  };
  assert.equal(outcome.soldOut, false, "this test needs a night that does not sell out");
  assert.equal(view.lastNight.resultHeadline, `NIGHT 1 · ${outcome.turnout.toLocaleString()} CAME AT $34`);
  assert.equal(view.history[0]!.resultHeadline, view.lastNight.resultHeadline, "history and lastNight disagree");
  // no grading word, no money, no fill percentage in the headline
  assert.equal(/profit|great|strong|nice|best|worst|\$\d{4,}/i.test(view.lastNight.resultHeadline), false);

  // sellout: the cheapest legal price on night one fills New York's building
  const sold = playNight(seated(1), { "seat-1": PRICE_MIN });
  const soldView = fullHouseModule.studentView(sold, "seat-1", "PLAY") as {
    lastNight: { resultHeadline: string; soldOut: boolean; turnout: number; seatsOpen: number; turnedAway: number };
  };
  const n = soldView.lastNight;
  assert.equal(n.soldOut, true, "this test needs a night that sells out");
  assert.equal(
    n.resultHeadline,
    `FULL HOUSE · ${n.turnout.toLocaleString()} of ${n.seatsOpen.toLocaleString()} · ${n.turnedAway.toLocaleString()} turned away`,
  );
  assert.equal(/CAME AT/.test(n.resultHeadline), false, "a sellout still rendered the ordinary headline");
});

/**
 * R-7 (the arena picture) and R-10 (the never-printed forgiveness line). The
 * teacher surface carries the ledger; an entry without its misconception risk
 * is not a record, it is a footnote.
 */
test("R-7 / R-10: the ledger records the three simplifications the rebuild adds", () => {
  const find = (needle: RegExp) => SIMPLIFICATIONS.find((s) => needle.test(s.what));
  const arena = find(/evenly-lit proportion/);
  const bowl = find(/upper bowl is a Night-4-only third state|third state of the same picture/i);
  const renewals = find(/forgiveness line/i);

  for (const [label, entry] of Object.entries({ arena, bowl, renewals })) {
    assert.ok(entry, `SIMPLIFICATIONS has no ${label} entry`);
    assert.ok(entry!.why.length > 0, `${label} records no reason`);
    assert.ok(entry!.risk.length > 0, `${label} records no misconception risk`);
  }
  // each risk names the specific wrong conclusion, not a generic caution
  assert.match(arena!.risk, /cheap seats filled first/i);
  assert.match(bowl!.risk, /denominator/i);
  assert.match(renewals!.risk, /Night 4/);
  assert.match(renewals!.what, /renewalReferencePrice/);
  // and the ledger reaches the teacher, where it is read out loud
  const state = seated(2);
  const teach = fullHouseModule.teacherView(state, "PLAY") as {
    simplifications: { what: string; why: string; risk: string }[];
  };
  assert.equal(teach.simplifications.length, SIMPLIFICATIONS.length);
  assert.equal(teach.simplifications.every((s) => s.risk.length > 0), true);
});

/* ------------------------------------------------------------------ W2 repair 4 */

test("R4-4a: the settled night's cause is the FULL renewals rule, carrying the apex clause the short form lacks", () => {
  for (const market of MARKETS) {
    const lines = renewalRuleLinesFor(market);
    assert.equal(lines.join(" "), renewalRuleFor(market), "the lines are the registered rule, character for character");
    assert.equal(lines.length, 4, "a lead sentence and the three arms of the tent");
    assert.match(lines[1]!, /UNDER/);
    assert.match(lines[2]!, /ABOVE/);
    assert.match(lines[3]!, /^In between, the plan looks like a bargain and more come back\.$/);
    // the compression the results frame used to print as the cause has no apex
    assert.doesNotMatch(renewalShortRuleFor(market), /In between|more come back/);
  }
  // and the student payload carries both forms, on every night, so the frame
  // that shows a settled movement can print the whole tent
  let state = seated(2);
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    const view = fullHouseModule.studentView(state, "seat-1", "PLAY") as {
      renewalRule: string;
      renewalRuleLines: string[];
      market: { planPrice: number };
    };
    const market = MARKETS.find((m) => m.planPrice === view.market.planPrice)!;
    assert.equal(view.renewalRule, renewalRuleFor(market), `night ${i + 1} renewalRule`);
    assert.deepEqual(view.renewalRuleLines, renewalRuleLinesFor(market), `night ${i + 1} renewalRuleLines`);
    state = playNight(state, { "seat-1": 34, "seat-2": 24 });
  }
});

test("R4-4b: the floor line fires only when the one-night clamp bound — never on the book's 0 floor, never at exactly the clamp", () => {
  // Every number here comes off RENEWAL_DELTA_FLOOR rather than a literal, so
  // the property survives a retune of the clamp instead of failing as a stale
  // transcript of one (W6 `econ-l1-renewals-dead-arm` moved it).
  const F = RENEWAL_DELTA_FLOOR;
  assert.equal(renewalFloorBinds(F - 9, F), true);
  assert.equal(renewalFloorBinds(F, F), false, "the rule asked for exactly the clamp, not more");
  assert.equal(renewalFloorBinds(F - 9, F + 10), false, "the book's own floor took the rest");
  assert.equal(renewalFloorBinds(F - 9, 0), false);
  assert.equal(renewalFloorBinds(-5, -5), false);
  const ny = MARKETS.find((m) => m.id === "new-york")!;
  assert.ok(renewalDeltaRaw(ny, CARDS[0]!, PRICE_MIN, 0) < F, "the $10 New York night asks for more than the clamp");
  assert.equal(renewalDelta(ny, CARDS[0]!, PRICE_MIN, 0), F);
  // Three $10 nights in New York. The first two clamp; the third finds a stock
  // too small to absorb the whole clamp, so the book's own 0 floor takes the
  // rest and the clamp line must go quiet.
  let state = seated(2);
  for (let i = 0; i < 3; i += 1) state = playNight(state, { "seat-1": PRICE_MIN, "seat-2": 24 });
  const history = (
    fullHouseModule.studentView(state, "seat-1", "PLAY") as {
      history: { renewalsBefore: number; renewalsAfter: number; renewalMove: number; renewalAtFloor: boolean }[];
    }
  ).history;
  const walked: [number, number, number, boolean][] = [];
  let stock = RENEWALS_START;
  for (let i = 0; i < 3; i += 1) {
    const after = Math.max(0, Math.min(100, stock + F));
    walked.push([stock, after, after - stock, after - stock === F]);
    stock = after;
  }
  assert.deepEqual(
    history.map((h) => [h.renewalsBefore, h.renewalsAfter, h.renewalMove, h.renewalAtFloor]),
    walked,
  );
  assert.equal(walked[0]![3], true, "the first $10 night must be a clamped night");
  assert.equal(walked[walked.length - 1]![3], false, "the last night must be the book's floor, not the clamp");
});

test("R5-5: the carried-dial cue never names a night the pair did not price, and the dial resets to the plan price", () => {
  const market = MARKETS[0]!;
  const carried = (state: FullHouseState, seat: SeatId = "seat-1") =>
    (fullHouseModule.studentView(state, seat, "PLAY") as { dialCarriedLine: string | null; price: number });

  // a desk that chose a price, then let the next night settle at that dial
  let state = seated(2);
  state = playNight(state, { "seat-1": market.planPrice, "seat-2": market.planPrice });
  // the dial reopens at the plan price — the reducer resets it, it does not keep
  // the last price charged
  assert.equal(carried(state).price, market.planPrice);
  // seat-1 actually charged the plan price on Night 1, so the cue may name it
  assert.equal(carried(state).dialCarriedLine, dialCarriedLineFor(market.planPrice, CARDS[0]!.label));

  // a desk the BELL auto-committed: nobody at that desk chose the plan price
  let auto = seated(2);
  auto = ok(act(auto, { type: "setPrice", price: market.planPrice }, "PLAY", "seat-2"));
  auto = ok(act(auto, { type: "lock" }, "PLAY", "seat-2"));
  auto = ok(act(auto, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  const autoNights = (fullHouseModule.studentView(auto, "seat-1", "PLAY") as { history: { auto: boolean; price: number }[] }).history;
  assert.equal(autoNights[0]!.auto, true);
  assert.equal(autoNights[0]!.price, market.planPrice);
  assert.equal(carried(auto).price, market.planPrice);
  assert.equal(carried(auto).dialCarriedLine, null);

  // a seat that joins late: the desk manager covered the missed nights at the
  // plan price, so those nights are not the pair's either
  const withLate = ok(act(auto, { type: "takeSeat" }, "PLAY", "seat-late"));
  const lateView = fullHouseModule.studentView(withLate, "seat-late", "PLAY") as { history: { stock: boolean }[]; dialCarriedLine: string | null };
  assert.ok(lateView.history.length > 0, "a seat that joins after Night 1 is handed covered nights");
  assert.equal(lateView.history[0]!.stock, true);
  assert.equal(lateView.dialCarriedLine, null);
});

test("R5-2: every settled night carries a turnout cause that is true of that night and varies with it", () => {
  // the four limbs of the registered sentence, against the settlement they describe
  assert.equal(
    turnoutCauseFor(10, "Night 4", 22_200, 22_200, 4_750),
    "Night 4 \u00b7 at $10, more people wanted in than the 22,200 seats you opened. The limit was the seats, not the price.",
  );
  assert.equal(
    turnoutCauseFor(10, "Night 2", 19_800, 19_800, 0),
    "Night 2 \u00b7 at $10, exactly the 19,800 seats you opened filled. The price and the seats met at the same number.",
  );
  assert.equal(
    turnoutCauseFor(120, "Night 1", 0, 19_800, 0),
    "Night 1 \u00b7 at $120, nobody wanted in, so all 19,800 seats you opened stayed empty. The limit was the price, not the seats.",
  );
  assert.equal(
    turnoutCauseFor(46, "Night 3", 4_690, 19_800, 0),
    "Night 3 \u00b7 at $46, 4,690 people wanted in and you opened 19,800 seats. The limit was the price, not the seats.",
  );

  // driven through the module: a desk that sells out and a desk that draws nobody
  // are told different things about their own crowd, on every night.
  let state = seated(2);
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, { "seat-1": PRICE_MIN, "seat-2": PRICE_MAX });
  const sellouts = (fullHouseModule.studentView(state, "seat-1", "PLAY") as {
    history: { turnoutCause: string; turnout: number; seatsOpen: number; turnedAway: number; price: number; label: string }[];
  }).history;
  const empties = (fullHouseModule.studentView(state, "seat-2", "PLAY") as {
    history: { turnoutCause: string; turnout: number; seatsOpen: number; turnedAway: number; price: number; label: string }[];
  }).history;
  assert.equal(sellouts.length, NIGHT_COUNT);
  for (let i = 0; i < NIGHT_COUNT; i += 1) {
    const a = sellouts[i]!;
    const b = empties[i]!;
    // computed from the model, not hand-written per night
    assert.equal(a.turnoutCause, turnoutCauseFor(a.price, a.label, a.turnout, a.seatsOpen, a.turnedAway));
    assert.equal(b.turnoutCause, turnoutCauseFor(b.price, b.label, b.turnout, b.seatsOpen, b.turnedAway));
    // R5-2: two materially different nights never render the same sentence
    assert.notEqual(a.turnoutCause, b.turnoutCause);
    // every night names its own card, so two identical settlements still differ
    assert.match(a.turnoutCause, new RegExp(`^${a.label} `));
  }
  // no night in either season previews another night, grades the choice, or
  // reaches across into the renewals book
  for (const n of [...sellouts, ...empties]) {
    assert.doesNotMatch(n.turnoutCause, /renewal|season|profit|should|better|worse|best|good|bad|next night|tomorrow|try/i);
  }
});

test("R4-4c / R4-5: the ledger says a quarter, and the renderer's former sentences are module strings", () => {
  const bowl = SIMPLIFICATIONS.find((s) => /third state of the same picture/i.test(s.what))!;
  assert.match(bowl.what, /about a quarter/);
  assert.doesNotMatch(bowl.what + bowl.risk, /about a fifth/);
  assert.match(bowl.what, /shuttered on every night it is not open/);
  assert.equal(twoPeaksNoteFor(12, 6), "$12 lower — 6 clicks of the dial. The cheaper ticket made more money.");
  assert.equal(spendFactLineFor(0, false), null);
  assert.equal(spendFactLineFor(5000, false), "You also put $5,000 into the night.");
  assert.equal(spendFactLineFor(0, true), "You also put $0 into the night with the more seats open.");
  assert.equal(FULL_HOUSE_UI_COPY.noTomorrowLine.startsWith("Nothing. Tonight is the last night of the five"), true);

  // the settled night carries its spend line; the reveal's Two Peaks entries carry the gap sentence
  let state = seated(2);
  for (let i = 0; i < NIGHT_COUNT; i += 1) state = playNight(state, { "seat-1": 34, "seat-2": 24 }, i === 0 ? { "seat-1": 40_000 } : {});
  const history = (fullHouseModule.studentView(state, "seat-1", "PLAY") as { history: { spendLine: string | null }[] }).history;
  assert.equal(history[0]!.spendLine, "You also put $40,000 into the night.");
  assert.equal(history[1]!.spendLine, null);
  const at = { ...fullHouseModule.onPhaseExit!(state, "PLAY", "REVEAL"), revealStage: REVEAL_STEPS, twoPeaksReleased: true };
  const peaks = (fullHouseModule.studentView(at, "seat-1", "REVEAL") as { twoPeaks: { gapDollars: number; gapSteps: number; note: string }[] }).twoPeaks;
  assert.ok(peaks.length > 0);
  for (const p of peaks) assert.equal(p.note, twoPeaksNoteFor(p.gapDollars, p.gapSteps));
});

/* -------------------------------------------------- THE ROOM (W6) -- */

type RoomRead = {
  deskCount: number;
  lockedCount: number;
  spread: { min: number; max: number; median: number; range: number };
  decidingCount: number;
  bins: { from: number; to: number; count: number; lockedCount: number; handles: string[] }[];
  movement: { raised: number; held: number; lowered: number; basis: number; noOwnPrior: number; deciding: number };
  firstNight: boolean;
  movementLine: string;
  spreadLine: string;
};
const roomOf = (state: FullHouseState): RoomRead | null =>
  (fullHouseModule.teacherView(state, "PLAY") as Record<string, unknown>)["room"] as RoomRead | null;

test("the room read never reaches the projector while a night is open", () => {
  // R13 is the reason this lesson's reveal lands at all: the class commits
  // blind. A live histogram of everyone's dial on the projector would end that
  // in one press, so the read exists on the teacher's console and nowhere else.
  let state = seated(4);
  for (const [i, price] of [24, 30, 36, 42].entries()) {
    state = ok(act(state, { type: "setPrice", price }, "PLAY", `seat-${i + 1}`));
  }
  assert.ok(roomOf(state), "the teacher must have the read");
  const board = JSON.stringify(fullHouseModule.boardView(state, "PLAY"));
  for (const price of [24, 30, 36, 42]) {
    assert.ok(
      !board.includes(`"price":${price}`),
      `the projector is carrying a live dial (${price}) while the night is open`,
    );
  }
  assert.ok(!board.includes("movement"), "the projector is carrying the class movement read");
  assert.ok(!board.includes("spreadLine"), "the projector is carrying the class spread read");
});

test("the room read counts the spread and the shape of the live dials", () => {
  let state = seated(4);
  for (const [i, price] of [20, 24, 24, 40].entries()) {
    state = ok(act(state, { type: "setPrice", price }, "PLAY", `seat-${i + 1}`));
    state = ok(act(state, { type: "lock" }, "PLAY", `seat-${i + 1}`));
  }
  const room = roomOf(state)!;
  assert.deepEqual(room.spread, { min: 20, max: 40, median: 24, range: 20 });
  assert.equal(room.bins.reduce((n, b) => n + b.count, 0), 4, "every desk lands in exactly one bin");
  assert.ok(room.bins.every((b) => b.from % 2 === 0), "a bar edge must be a price a desk could have chosen");
  assert.match(room.spreadLine, /\$20 and \$40/);
  assert.equal(room.deskCount, 4);
});

test("the spread is a fact about decisions — an untouched room has no spread to read out", () => {
  // Rendered on the console at nought-of-six locked, this sentence said "The
  // room is between $16 and $24, middle $20" — which was not the room, it was
  // the two season plan prices the dials open on. A teacher reading it out has
  // told the class a spread nobody chose.
  const untouched = roomOf(seated(4))!;
  assert.equal(untouched.spread, null, "no decisions, no spread");
  assert.doesNotMatch(untouched.spreadLine, /between/, `invented a spread: "${untouched.spreadLine}"`);
  assert.match(untouched.spreadLine, /Nothing is committed yet/);
  assert.equal(untouched.bins.reduce((n, b) => n + b.count, 0), 4, "the dials are still drawn — as positions");
  assert.equal(untouched.bins.reduce((n, b) => n + b.lockedCount, 0), 0, "and none of them is a decision");

  // Part-way through a night the sentence says how many it speaks for, and
  // speaks only for them.
  let state = seated(4);
  state = ok(act(state, { type: "setPrice", price: 20 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-2"));
  // seat-3 has moved its dial a long way and NOT committed: it must not widen
  // the spread the teacher is about to say out loud.
  state = ok(act(state, { type: "setPrice", price: 90 }, "PLAY", "seat-3"));
  const part = roomOf(state)!;
  assert.deepEqual(part.spread, { min: 20, max: 40, median: 30, range: 20 });
  assert.match(part.spreadLine, /The 2 in so far are between \$20 and \$40/, part.spreadLine as string);
  assert.equal(part.bins.reduce((n, b) => n + b.count, 0), 4, "the uncommitted dial is still on the histogram");
  assert.ok(
    part.bins.some((b) => b.from <= 90 && 90 <= b.to && b.lockedCount === 0),
    "and it is drawn where it actually is, as an undecided position",
  );

  const one = roomOf(ok(act(ok(act(seated(4), { type: "setPrice", price: 20 }, "PLAY", "seat-1")), { type: "lock" }, "PLAY", "seat-1")))!;
  assert.match(one.spreadLine, /One desk is in, at \$20\./, one.spreadLine as string);
});

test("movement is counted over committed decisions, not over open dials", () => {
  // The obvious version reports moves nobody made: the dial reopens each night
  // at the desk's season plan price, so a pair who has not touched anything yet
  // looks like it cut its price. A lock is the only thing here that means "we
  // decided".
  let state = seated(3);
  // seat-1 and seat-2 price night 1 themselves; seat-3 never locks and is
  // auto-committed by the bell.
  state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "teacher:closeNight" }, "PLAY", "teacher"));

  // Night two. seat-1 raises and locks; seat-2 lowers and locks; seat-3, whose
  // night one the bell committed, also locks.
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "setPrice", price: 20 }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-2"));
  const midNight = roomOf(state)!;
  assert.equal(midNight.movement.deciding, 1, "seat-3 has not committed, so it is deciding — not moving");
  assert.equal(midNight.movement.basis, 2);

  state = ok(act(state, { type: "lock" }, "PLAY", "seat-3"));
  const room = roomOf(state)!;
  assert.equal(room.movement.raised, 1);
  assert.equal(room.movement.lowered, 1);
  assert.equal(room.movement.held, 0);
  assert.equal(room.movement.basis, 2, "only the two desks that priced their own night count");
  assert.equal(room.movement.noOwnPrior, 1, "the bell-committed desk is reported, not counted as adaptation");
  assert.equal(room.movement.deciding, 0);
  assert.match(room.movementLine, /1 raised, 0 held, 1 lowered/);
});

test("an untouched dial is never reported as a price cut", () => {
  // The defect this exists for: night two reopens every dial at the season plan
  // price. A desk that has done nothing at all was being counted as "lowered".
  let state = seated(2);
  state = playNight(state, { "seat-1": 48, "seat-2": 48 });
  const room = roomOf(state)!;
  assert.equal(room.movement.lowered, 0, "nobody has decided anything on this night yet");
  assert.equal(room.movement.basis, 0);
  assert.equal(room.decidingCount, 2);
  assert.match(room.movementLine, /Nobody is in yet/);
});

test("the room read goes away once the five-night window is closed", () => {
  // After the last bell there is no live dial to read, and the staged REVEAL
  // owns the numbers. A stale histogram beside it would compete with it.
  let state = seated(2);
  for (let n = 0; n < 5; n += 1) {
    state = playNight(state, { "seat-1": 30, "seat-2": 34 });
  }
  assert.equal(roomOf(state), null);
});

test("a first night reports no movement rather than inventing some", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 26 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  const room = roomOf(state)!;
  assert.equal(room.movement.basis, 0);
  assert.equal(room.firstNight, true);
  assert.match(room.movementLine, /First night/);
});

test("every desk lands in exactly one bar, locked and deciding kept apart", () => {
  let state = seated(4);
  for (const [i, price] of [20, 24, 24, 40].entries()) {
    state = ok(act(state, { type: "setPrice", price }, "PLAY", `seat-${i + 1}`));
  }
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-2"));
  const room = roomOf(state)!;
  assert.equal(room.bins.reduce((n, b) => n + b.count, 0), 4);
  assert.equal(room.bins.reduce((n, b) => n + b.lockedCount, 0), 1);
  assert.ok(room.bins.every((b) => b.lockedCount <= b.count), "a bar cannot hold more decisions than desks");
});

test("W6: the locked pair gets the gate call, and only a locked pair does", () => {
  let state = seated(4);
  const bad = (r: ReturnType<typeof fullHouseModule.reduce>): string => {
    assert.equal(r.ok, false, "expected a refusal");
    return (r as { ok: false; reason: string }).reason;
  };

  // Before the lock there is no call to make: the dials are still the work.
  assert.equal(
    (fullHouseModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>)["gateCall"],
    undefined,
    "an undecided desk was offered the waiting beat",
  );
  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1")), /commit your price first/);

  state = ok(act(state, { type: "setPrice", price: 34 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));

  const gate = (fullHouseModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>)["gateCall"] as {
    bands: { id: string }[];
    called: string | null;
    heading: string;
    foot: string;
    room: { locked: number; seated: number; line: string };
  };
  assert.ok(gate, "the locked desk was left with nothing to do");
  assert.deepEqual(
    gate.bands.map((b) => b.id),
    ["packed", "busy", "quiet"],
  );
  assert.equal(gate.called, null);
  // The room line is an AGGREGATE. /play must never learn which desk is which.
  assert.equal(gate.room.locked, 1);
  assert.equal(gate.room.seated, 4);
  assert.match(gate.room.line, /1 of 4/);
  assert.ok(!/seat-/.test(JSON.stringify(gate)), "the room line leaked a seat identity onto a private surface");

  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "PLAY", "teacher")), /seated pair/);
  assert.match(bad(act(state, { type: "gateCall", band: "sold" }, "PLAY", "seat-1")), /packed, busy or quiet/);
  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "REVEAL", "seat-1")), /during PLAY/);

  // Changeable while the night is open; the last one standing is what freezes.
  state = ok(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "gateCall", band: "quiet" }, "PLAY", "seat-1"));
  assert.equal(
    ((fullHouseModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>)["gateCall"] as { called: string }).called,
    "quiet",
  );
  assert.equal(
    (fullHouseModule.studentView(state, "seat-2", "PLAY") as Record<string, unknown>)["gateCall"],
    undefined,
    "an unlocked desk was shown the waiting beat",
  );
});

test("W6: the bell answers the call it was actually given, and calls nothing else", () => {
  let state = seated(4);
  for (const seatId of ["seat-1", "seat-2", "seat-3", "seat-4"]) {
    state = ok(act(state, { type: "setPrice", price: 24 }, "PLAY", seatId));
    state = ok(act(state, { type: "lock" }, "PLAY", seatId));
  }
  state = ok(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "gateCall", band: "quiet" }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "teacher:closeNight" }, "PLAY", "teacher"));

  const nightOf = (seatId: SeatId) => {
    const v = fullHouseModule.studentView(state, seatId, "PLAY") as {
      history: { call: { called: string; actual: string; right: boolean; line: string } | null; turnout: number; seatsOpen: number; fillPct: number }[];
    };
    return v.history[0]!;
  };

  const one = nightOf("seat-1");
  assert.ok(one.call, "the call the pair made never came back");
  assert.equal(one.call!.called, "packed");
  // Recomputed from the numbers printed beside it, never trusted. Fill is of the
  // seats OPENED, which on the bowl night is not capacity (R-2).
  const fill = one.turnout / one.seatsOpen;
  assert.equal(one.call!.actual, fill >= GATE_PACKED_FLOOR ? "packed" : fill >= GATE_BUSY_FLOOR ? "busy" : "quiet");
  assert.equal(one.call!.right, one.call!.called === one.call!.actual);
  assert.match(one.call!.line, /^You called PACKED\./);
  assert.match(one.call!.line, new RegExp(`${one.turnout.toLocaleString()} came`));
  // Forecasting language only. Reading a crowd and pricing well are different
  // skills, and the product must never let one stand in for the other.
  assert.ok(!/good|bad|wrong price|mistake|should have/i.test(one.call!.line), `the call's answer judged the decision: ${one.call!.line}`);

  assert.equal(nightOf("seat-2").call!.called, "quiet");
  assert.equal(nightOf("seat-3").call, null, "a desk that made no call was handed a verdict on one");

  // The pending call does not survive its own night.
  state = ok(act(state, { type: "setPrice", price: 24 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  assert.equal(
    ((fullHouseModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>)["gateCall"] as { called: string | null }).called,
    null,
    "night 1's call carried into night 2",
  );
});

/* ------------------------------------------- the late arrival (W6) -- */

test("a pair who arrives after the fifth bell is landed honestly, not left finding a desk", () => {
  // Every figure this room has already been shown — the class curve, the two
  // peaks, the repeat rows, the synthesis cards — is computed over the desks
  // that played. Seating a new desk during REVEAL would silently re-derive
  // numbers the teacher has read out loud. So it is not seated; what it must
  // never get is what it used to get, which was "finding your desk…" for the
  // rest of the period behind a refusal nobody was told about.
  let state = seated(3);
  for (let night = 0; night < NIGHT_COUNT; night += 1) {
    for (const seat of ["seat-1", "seat-2", "seat-3"]) {
      state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", seat));
      state = ok(act(state, { type: "lock" }, "PLAY", seat));
    }
    state = ok(act(state, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  }

  // The action is ACCEPTED — a definitive refusal is what stranded the device.
  assert.ok(
    (fullHouseModule.allowedActions("REVEAL") as readonly string[]).includes("takeSeat"),
    "takeSeat must stay offered after the nights close, or the runtime refuses it before the module can answer",
  );
  const before = Object.keys(state.desks).length;
  state = ok(act(state, { type: "takeSeat" }, "REVEAL", "seat-late"));
  assert.equal(Object.keys(state.desks).length, before, "a late pair was given a desk and rewrote the room's evidence");
  assert.deepEqual([...observersOf(state)], ["seat-late"], "the late pair was not recorded anywhere");

  // Its own screen is told the truth, in the module's words.
  const view = fullHouseModule.studentView(state, "seat-late", "REVEAL") as Record<string, unknown>;
  assert.equal(view["seated"], false);
  assert.equal(view["observer"], true);
  assert.equal(view["message"], OBSERVER_MESSAGE);
  assert.equal(view["observerAction"], OBSERVER_ACTION);
  assert.doesNotMatch(String(view["message"]), /finding your desk/i);
  // ...and it says what to DO, not only what went wrong.
  assert.match(String(view["observerAction"]), /nearest desk/i);

  // The teacher is told, because this is a pair standing in the room.
  const teacher = fullHouseModule.teacherView(state, "REVEAL") as Record<string, unknown>;
  const flags = teacher["watchFor"] as { id: string; label: string; desks: string[]; urgency: string }[];
  const flag = flags.find((f) => f.id === "late-observers");
  assert.ok(flag, "the console said nothing about a pair that cannot join");
  assert.equal(flag.urgency, "now");
  assert.match(flag.label, /1 pair arrived after the last night closed/);
  assert.equal(/seat-/.test(JSON.stringify(flag)), false, "the console flag carries a seat identity");

  // Repeating it is idempotent, and a second late pair is counted.
  state = ok(act(state, { type: "takeSeat" }, "REVEAL", "seat-late"));
  assert.equal(observersOf(state).length, 1, "the same device was recorded twice");
  state = ok(act(state, { type: "takeSeat" }, "SYNTHESIS", "seat-later"));
  assert.equal(observersOf(state).length, 2);

  // And the projector never carries any of it.
  const board = JSON.stringify(fullHouseModule.boardView(state, "REVEAL"));
  assert.equal(/seat-late|observerSeats/.test(board), false, "the projector is carrying the observer list");
});

test("a late pair during PLAY still gets a real desk — the observer path is only for a closed room", () => {
  // The path that matters is unchanged: a pair arriving at Night 3 gets a desk
  // with the nights it missed played at its own plan price and labelled.
  let state = seated(2);
  state = ok(act(state, { type: "teacher:closeNight" }, "PLAY", "teacher"));
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-late"));
  assert.ok(state.desks["seat-late"], "a late pair was refused a desk while nights were still open");
  assert.equal(observersOf(state).length, 0, "a pair that CAN be seated must never be recorded as an observer");
  const view = fullHouseModule.studentView(state, "seat-late", "PLAY") as Record<string, unknown>;
  assert.equal(view["seated"], true);
});

/* ------------------------------------------------------------------------ */
/* THE DESKS — the walk-to list                                             */
/* ------------------------------------------------------------------------ */

type Strip = {
  countLine: string;
  entries: { seatId: string; label: string; state: string; stateLabel: string; note: string | null; flag: boolean }[];
};
const stripOf = (state: FullHouseState, phase: CanonicalPhase = "PLAY"): Strip | null =>
  ((fullHouseModule.teacherView(state, phase) as Record<string, unknown>)["deskStrip"] as Strip | null) ?? null;

test("the desk strip names every live desk, and says which ones have not committed", () => {
  assert.equal(stripOf(empty()), null, "an empty room has no walk-to list");

  const state = seated(3);
  const strip = stripOf(state)!;
  assert.ok(strip);
  assert.equal(strip.entries.length, 3);
  assert.match(strip.countLine, /0 of 3 locked · night 1 of 5/);
  for (const e of strip.entries) {
    assert.equal(e.state, "deciding");
    assert.equal(e.stateLabel, "Still dialling");
    assert.match(e.label, /^Desk \d+ · /);
    assert.ok(e.seatId, "a chip with no seat id cannot be paired with the pair sitting there");
  }

  // One desk commits: the strip must move with it, and only it.
  const one = ok(act(state, { type: "lock" }, "PLAY", "seat-2"));
  const after = stripOf(one)!;
  assert.match(after.countLine, /1 of 3 locked/);
  const locked = after.entries.filter((e) => e.state === "in");
  assert.equal(locked.length, 1);
  assert.equal(locked[0]!.seatId, "seat-2");
  assert.equal(locked[0]!.stateLabel, "Locked Night 1");
});

test("a desk the bell has been deciding for is named as such, and a settled room stops asking", () => {
  // Two desks play; the third never locks and the bell settles it, twice.
  let state = seated(3);
  state = playNight(state, { "seat-1": 40, "seat-2": 30 });
  state = playNight(state, { "seat-1": 44, "seat-2": 32 });
  const strip = stripOf(state)!;
  const stranded = strip.entries.find((e) => e.seatId === "seat-3")!;
  assert.match(String(stranded.note), /never once locked a night of its own/i);
  const decided = strip.entries.find((e) => e.seatId === "seat-1")!;
  assert.equal(decided.note, null, "a desk that has been deciding for itself was flagged anyway");

  // After the fifth bell there is nothing left to walk over about tonight.
  let done = state;
  for (let i = 0; i < 3; i += 1) done = playNight(done, { "seat-1": 40, "seat-2": 30, "seat-3": 50 });
  const closed = stripOf(done)!;
  assert.match(closed.countLine, /all five nights settled/);
  for (const e of closed.entries) assert.equal(e.state, "closed");
});

test("the walk-to list is teacher-only — no seat id and no desk strip ever reaches the projector", () => {
  const state = ok(act(seated(3), { type: "lock" }, "PLAY", "seat-1"));
  for (const phase of ["LOBBY", "HOOK", "PLAY", "REVEAL", "COUNTERFACTUAL", "SYNTHESIS"] as const) {
    const board = JSON.stringify(fullHouseModule.boardView(state, phase));
    assert.equal(board.includes("deskStrip"), false, `the projector carries the walk-to list in ${phase}`);
    assert.equal(/seat-\d/.test(board), false, `a seat id reached the projector in ${phase}`);
  }
  // And a student never gets one either — it is a list of other people's desks.
  const student = JSON.stringify(fullHouseModule.studentView(state, "seat-1", "PLAY"));
  assert.equal(student.includes("deskStrip"), false, "a student device carries the teacher's walk-to list");
});

test("a late desk is annotated but is not a reason to walk over", () => {
  // Two desks play a night, then a third pair arrives. Their books carry a night
  // they did not play, which the teacher needs to know when reading them — but
  // it is not a malfunction, and the console must not send the teacher across
  // the room for it.
  let state = seated(2);
  state = playNight(state, { "seat-1": 40, "seat-2": 30 });
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-9"));
  const late = stripOf(state)!.entries.find((e) => e.seatId === "seat-9")!;
  assert.match(String(late.note), /Joined at Night 2; the first 1 night was covered for them\./);
  assert.equal(late.flag, false, "a late desk was marked as a reason to walk over");

  // But once that same pair has sat through a night they COULD have locked and
  // let the bell take it, they are.
  const stranded = stripOf(playNight(state, { "seat-1": 40, "seat-2": 30 }))!.entries.find((e) => e.seatId === "seat-9")!;
  assert.match(String(stranded.note), /never once locked a night of its own/i);
  assert.equal(stranded.flag, true);
});

test("a zero-desk rehearsal walks the whole synthesis deck, marked REHEARSAL, never as the room's own arithmetic", () => {
  // `gate-l2-teacher` B5, the L1 regression. /teach tells a first-time teacher
  // to open an empty session and advance through every phase. This deck used to
  // collapse to one placeholder, so the rehearsal that the product prescribes
  // taught the teacher one sixth of the phase where they talk the most.
  const cold = empty();
  const rehearsal = synthesisCards(cold, computeAggregate(cold));
  const played = playedOut();
  const live = synthesisCards(played, computeAggregate(played));
  assert.equal(rehearsal.length, live.length, "the rehearsal deck is a different length from the live deck");
  assert.deepEqual(
    rehearsal.map((c) => c.title.replace(/^REHEARSAL — /, "")),
    live.map((c) => c.title),
    "the rehearsal deck teaches card titles the live deck does not have",
  );
  for (const card of rehearsal) {
    assert.match(card.title, /^REHEARSAL — /, `${card.id} could be mistaken for a live card`);
    assert.ok(card.body.trim().length > 40, `${card.id} is a stub`);
  }
  // Every card carrying a made-up figure says so; the one card with no figures
  // in it is the same sentence live and in rehearsal, and does not need to.
  for (const card of rehearsal) {
    if (/\$[\d,]|\d+%/.test(card.body)) {
      assert.match(card.body, /Every figure above is a STAND-IN/, `${card.id} prints figures with no stand-in warning`);
    }
  }
});

test("a live room never sees a REHEARSAL card or a REHEARSAL watch flag", () => {
  const state = playedOut();
  for (const card of synthesisCards(state, computeAggregate(state))) {
    assert.equal(/REHEARSAL/.test(card.title), false, `${card.id} leaked the rehearsal deck into a played room`);
    assert.equal(/STAND-IN/.test(card.body), false, `${card.id} leaked a stand-in warning into a played room`);
  }
  const teach = JSON.stringify(fullHouseModule.teacherView(state, "PLAY"));
  assert.equal(teach.includes("REHEARSAL"), false, "a live room's WATCH FOR carried a rehearsal flag");
});

test("a zero-desk rehearsal shows WATCH FOR in every phase it exists in, always marked", () => {
  const cold = empty();
  for (const phase of ["PLAY", "REVEAL", "ADAPT", "COUNTERFACTUAL", "SYNTHESIS"] as const) {
    const view = fullHouseModule.teacherView(cold, phase) as Record<string, unknown>;
    const flags = view["watchFor"] as { label: string; desks: string[]; action: string }[];
    assert.ok(flags.length > 0, `WATCH FOR was empty in ${phase} — the prescribed rehearsal teaches nothing there`);
    for (const f of flags) {
      assert.match(f.label, /^REHEARSAL — /, `an unmarked flag rendered in a rehearsal ${phase}`);
      assert.ok(f.desks.length > 0, "a flag rendered with no desks named");
      assert.ok(f.action.trim().length > 30, "a flag rendered with no instruction");
    }
  }
});
