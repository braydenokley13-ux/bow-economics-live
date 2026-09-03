/**
 * W3 Lane S — ruling R-5, contract §D2/§E6.
 *
 * The synthesis is where the experience becomes economics, and its two most
 * important pictures used to be sentences. R-5 makes them computed. This limb
 * holds the three things a renderer could otherwise get wrong quietly:
 *
 *  1. TRACEABILITY. Every number a caption prints is also a field on the same
 *     payload. If a builder ever writes a figure into a client template, or a
 *     caption drifts from the field it was read off, this goes red — which is
 *     the module-side half of the DOM audit the wave asks for.
 *  2. THE DEMAND VISUAL IS DOTS, NOT A CURVE. One market, one card, one mark per
 *     desk-night that was actually played, and no mark for a night nobody played.
 *  3. THE FRONTIER IS THE MODEL'S OWN LINE, AND IT BENDS. The payload's endpoints
 *     are `seasonFrontier`'s own corners, the two halves of the bend add back up
 *     to the whole line, and the last points cost strictly more than the first.
 *     A flat frontier would teach "keeping the fans was free" — the false lesson
 *     a previous repair removed — so the bend is asserted, not assumed.
 *
 * The card set, order, staging and bodies are E27-frozen; this file also pins
 * that `visual` did not disturb them.
 */
import assert from "node:assert/strict";
import test from "node:test";
import type { LessonAction, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";
import {
  CARDS,
  MARKETS,
  NIGHT_COUNT,
  computeAggregate,
  frontierVisualForDesk,
  fullHouseModule,
  seasonFrontier,
  synthesisCards,
} from "../modules/fullHouse.js";
import type { FullHouseState, SynthesisVisual } from "../modules/fullHouse.js";

const ctx = (phase: CanonicalPhase, seatId: SeatId | "teacher") => ({
  sessionId: "s1",
  phase,
  seatId,
  seatIds: ["seat-1", "seat-2", "seat-3", "seat-4"],
  now: 0,
});

function ok(result: ReturnType<typeof fullHouseModule.reduce>): FullHouseState {
  assert.equal(result.ok, true, result.ok ? "" : `expected ok, got: ${result.reason}`);
  return (result as { ok: true; state: FullHouseState }).state;
}
const act = (state: FullHouseState, action: LessonAction, phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") =>
  fullHouseModule.reduce(state, action, ctx(phase, seatId));

function seated(count: number): FullHouseState {
  let state = fullHouseModule.initialState({ sessionId: "s1", seatIds: [], gradeBand: "5-6" });
  for (let i = 1; i <= count; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  return state;
}
function playNight(state: FullHouseState, prices: Record<SeatId, number>): FullHouseState {
  let next = state;
  for (const [seatId, price] of Object.entries(prices)) {
    next = ok(act(next, { type: "setPrice", price }, "PLAY", seatId));
    next = ok(act(next, { type: "lock" }, "PLAY", seatId));
  }
  return ok(act(next, { type: "teacher:closeNight" }, "PLAY", "teacher"));
}

/** Four desks, two per market, five nights, prices that give the room a like-for-like pair. */
function playedRoom(nights = NIGHT_COUNT): FullHouseState {
  let state = seated(4);
  const prices: Record<SeatId, number> = { "seat-1": 34, "seat-2": 24, "seat-3": 70, "seat-4": 46 };
  for (let i = 0; i < nights; i += 1) state = playNight(state, prices);
  return state;
}

const visualOf = (state: FullHouseState, id: string): SynthesisVisual | undefined =>
  synthesisCards(state, computeAggregate(state)).find((c) => c.id === id)?.visual;

/* ------------------------------------------------------------ traceability -- */

const CAPTION_KEYS = new Set(["caption", "gapCaption", "bendCaption", "roomCaption", "axisCaption", "ownCaption", "note"]);

/** Numbers a caption is allowed to print: every numeric leaf, plus digits inside non-caption strings. */
function allowedNumbers(value: unknown, into = new Set<number>()): Set<number> {
  if (typeof value === "number") into.add(value);
  else if (Array.isArray(value)) value.forEach((v) => allowedNumbers(v, into));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string" && !CAPTION_KEYS.has(k)) for (const n of digitsIn(v)) into.add(n);
      else allowedNumbers(v, into);
    }
  }
  return into;
}
function captionsIn(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => captionsIn(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string" && CAPTION_KEYS.has(k)) out.push(v);
      else captionsIn(v, out);
    }
  }
  return out;
}
const digitsIn = (s: string): number[] =>
  [...s.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0]!.replace(/,/g, ""))).filter((n) => Number.isFinite(n));

test("R-5: every figure a synthesis caption prints is a field on the same payload", () => {
  const state = playedRoom();
  for (const card of synthesisCards(state, computeAggregate(state))) {
    if (!card.visual) continue;
    const allowed = allowedNumbers(card.visual);
    for (const caption of captionsIn(card.visual)) {
      for (const n of digitsIn(caption)) {
        assert.equal(allowed.has(n), true, `card ${card.id}: caption prints ${n}, which is not a field on its payload — "${caption}"`);
      }
    }
  }
});

test("R-5: the three visuals land on the three cards, and no other card grew one", () => {
  const state = playedRoom();
  const cards = synthesisCards(state, computeAggregate(state));
  assert.deepEqual(
    cards.map((c) => c.id),
    ["revenue", "shifters", "loss-leader", "path-dependence", "two-books", "real-world"],
    "E27: card set and order are frozen",
  );
  assert.equal(cards.find((c) => c.id === "revenue")?.visual?.kind, "dots");
  assert.equal(cards.find((c) => c.id === "shifters")?.visual?.kind, "shifters");
  assert.equal(cards.find((c) => c.id === "two-books")?.visual?.kind, "frontier");
  for (const id of ["loss-leader", "path-dependence", "real-world"]) {
    assert.equal(cards.find((c) => c.id === id)?.visual, undefined, `${id} must not have grown a visual`);
  }
});

test("R-5: no synthesis visual anywhere names weather, and none prints a percent", () => {
  const state = playedRoom();
  for (const card of synthesisCards(state, computeAggregate(state))) {
    if (!card.visual) continue;
    const json = JSON.stringify(card.visual);
    assert.equal(/weather/i.test(json), false, `${card.id}: "weather" is not in this model and may not be drawn`);
    for (const caption of captionsIn(card.visual)) {
      assert.equal(/\d\s*%/.test(caption), false, `${card.id}: a percent is never the figure a student reads — "${caption}"`);
    }
  }
});

/* -------------------------------------------------------------------- dots -- */

test("R-5: the demand visual is realized dots for one market on one card", () => {
  const state = playedRoom();
  const v = visualOf(state, "revenue");
  assert.equal(v?.kind, "dots");
  if (v?.kind !== "dots") return;
  const agg = computeAggregate(state);
  const source = agg.curves.filter((p) => p.marketId === v.marketId && p.cardId === v.cardId);
  assert.equal(v.dots.length, source.length, "one dot per desk-night of that market on that card");
  assert.equal(v.deskCount, v.dots.length);
  for (const dot of v.dots) {
    assert.ok(
      source.some((p) => p.price === dot.price && p.turnout === dot.turnout && p.soldOut === dot.soldOut),
      `a dot at $${dot.price} / ${dot.turnout} does not match any night this room played`,
    );
  }
  assert.equal(v.lowPrice, Math.min(...v.dots.map((d) => d.price)));
  assert.equal(v.highPrice, Math.max(...v.dots.map((d) => d.price)));
  assert.ok(v.turnoutAxisMax >= Math.max(...v.dots.map((d) => d.turnout)));
  assert.ok(CARDS.some((c) => c.id === v.cardId && c.label === v.cardLabel && c.day === v.day && c.draw === v.draw));
});

test("R-5: a night the room has not played has no dot", () => {
  const state = playedRoom(2); // only N1 and N2 are in the books
  const v = visualOf(state, "revenue");
  assert.equal(v?.kind, "dots");
  if (v?.kind !== "dots") return;
  assert.ok(["N1", "N2"].includes(v.cardId), `dots were drawn for ${v.cardId}, which nobody played`);
  const played = computeAggregate(state).curves;
  assert.equal(played.some((p) => p.cardId === "N3"), false, "guard: N3 must be unplayed in this fixture");
});

/* ---------------------------------------------------------------- shifters -- */

test("R-5: the shifter chips are DAY / DRAW / TV, with the two carried terms in their own group", () => {
  const state = playedRoom();
  const v = visualOf(state, "shifters");
  assert.equal(v?.kind, "shifters");
  if (v?.kind !== "shifters") return;
  assert.deepEqual(v.tonight.map((c) => c.key), ["DAY", "DRAW", "TV"]);
  assert.deepEqual(v.carried.map((c) => c.key), ["RENEWALS", "LAST NIGHT'S EVENT MONEY"]);
  assert.equal(v.nights.length, 2);
  const market = MARKETS.find((m) => m.id === v.marketId)!;
  assert.equal(v.club, market.club);
  for (const night of v.nights) {
    const card = CARDS.find((c) => c.id === night.cardId)!;
    assert.equal(night.day, card.day);
    assert.equal(night.draw, card.draw);
  }
  assert.equal(v.tonight[0]!.a, v.nights[0]!.day);
  assert.equal(v.tonight[0]!.b, v.nights[1]!.day);
});

/* ---------------------------------------------------------------- frontier -- */

test("R-5: the frontier is seasonFrontier's own points, in both markets, and it bends", () => {
  const state = playedRoom();
  const v = visualOf(state, "two-books");
  assert.equal(v?.kind, "frontier");
  if (v?.kind !== "frontier") return;
  assert.equal(v.markets.length, MARKETS.length, "both markets are drawn");
  for (const panel of v.markets) {
    const market = MARKETS.find((m) => m.id === panel.marketId)!;
    const model = [...seasonFrontier(market)].reverse();
    assert.deepEqual(
      panel.line.map((p) => [p.renewals, p.cash]),
      model.map((p) => [p.renewals, p.cash]),
      "the line is the model's own undominated seasons, not a fit",
    );
    // Renewals ascending, cash falling — a frontier, not a scatter.
    for (let i = 1; i < panel.line.length; i += 1) {
      assert.ok(panel.line[i]!.renewals > panel.line[i - 1]!.renewals);
      assert.ok(panel.line[i]!.cash < panel.line[i - 1]!.cash);
    }
    assert.equal(panel.cashBestCash, panel.line[0]!.cash);
    assert.equal(panel.cashBestRenewals, panel.line[0]!.renewals);
    assert.equal(panel.cornerCash, panel.line[panel.line.length - 1]!.cash);
    assert.equal(panel.cornerRenewals, panel.line[panel.line.length - 1]!.renewals);
    assert.equal(panel.gapDollars, panel.cashBestCash - panel.cornerCash);
    assert.equal(panel.gapPoints, panel.cornerRenewals - panel.cashBestRenewals);
    assert.equal(panel.fansPerPoint, market.renewalFans);
    assert.equal(panel.gapFans, panel.gapPoints * market.renewalFans);
    // The bend: the two halves are the whole line, and the last points cost more.
    assert.equal(panel.cheapPoints + panel.dearPoints, panel.gapPoints);
    assert.equal(panel.cheapCost + panel.dearCost, panel.gapDollars);
    assert.ok(panel.dearPoints > 0 && panel.cheapPoints > 0);
    assert.ok(
      panel.dearPerPoint > panel.cheapPerPoint * 3,
      `${panel.club}: the last points must cost visibly more than the first, or the picture teaches that keeping the fans was free (cheap $${panel.cheapPerPoint}/pt vs dear $${panel.dearPerPoint}/pt)`,
    );
    assert.ok(panel.kneeRenewals > panel.cashBestRenewals && panel.kneeRenewals < panel.cornerRenewals);
    assert.ok(panel.cashAxisMax >= panel.cashBestCash && panel.cashAxisMin <= panel.cornerCash);
  }
});

test("R-5 / E16: board frontier dots are anonymous, full-season only, and carry no desk identity", () => {
  let state = playedRoom();
  // A desk that joins after the room has started has a short season and no dot.
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-late"));
  const v = visualOf(state, "two-books");
  if (v?.kind !== "frontier") return assert.fail("expected a frontier visual");
  const desks = Object.values((state as unknown as { desks: Record<string, { marketId: string; nights: unknown[] }> }).desks);
  const fullCount = desks.filter((d) => d.nights.length >= NIGHT_COUNT).length;
  const plotted = v.markets.reduce((n, p) => n + p.deskDotCount, 0);
  assert.equal(plotted, fullCount, "only desks with a full five nights are plotted");
  assert.equal(
    v.markets.reduce((n, p) => n + p.partialDeskCount, 0),
    desks.length - fullCount,
  );
  for (const panel of v.markets) {
    for (const dot of panel.deskDots) {
      assert.deepEqual(Object.keys(dot).sort(), ["cash", "renewals"], "a projector dot may not carry a desk identity");
    }
    assert.equal(panel.ownDot, undefined, "the board payload never carries an own-dot");
  }
  assert.equal(/deskHandle|seat-/.test(JSON.stringify(v)), false, "no seat or handle may reach the projector frontier");
});

test("R-5 / D2: the /play mirror carries the pair's own dot and its own market only", () => {
  const state = playedRoom();
  const board = visualOf(state, "two-books");
  const desks = (state as unknown as { desks: Record<string, { marketId: string; cash: number; renewals: number }> }).desks;
  const seen = new Set<string>();
  for (const [seatId, desk] of Object.entries(desks)) {
    const mine = frontierVisualForDesk(board, desk as never);
    if (mine?.kind !== "frontier") return assert.fail("expected a frontier visual");
    assert.equal(mine.markets.length, 1, "a device sees its own market only");
    assert.equal(mine.markets[0]!.marketId, desk.marketId);
    assert.deepEqual(mine.markets[0]!.deskDots, [], "no other desk's money reaches a student device");
    const own = mine.markets[0]!.ownDot!;
    assert.equal(own.cash, desk.cash);
    assert.equal(own.renewals, desk.renewals);
    assert.equal(own.gapToLine, own.ceilingCash - own.cash);
    // Nobody else's cash is anywhere in this payload.
    for (const [otherSeat, other] of Object.entries(desks)) {
      if (otherSeat === seatId || other.cash === desk.cash) continue;
      assert.equal(
        JSON.stringify(mine).includes(String(other.cash)),
        false,
        `${seatId}'s mirror contains ${otherSeat}'s season cash`,
      );
    }
    seen.add(`${own.cash}|${own.renewals}`);
  }
  assert.ok(seen.size > 1, "guard: the fixture must give desks different books");
});

test("R-5: an unplayed room draws no half-drawn visual on any card", () => {
  // The deck itself is now the full REHEARSAL walk-through (`gate-l2-teacher`
  // B5), so the count is no longer 1. What R-5 is actually about still holds:
  // a computed picture needs a played curve, and a room with no curves gets no
  // picture rather than an empty pair of axes.
  const state = seated(4);
  const cards = synthesisCards(state, computeAggregate(state));
  for (const card of cards) assert.equal(card.visual, undefined, `${card.id} drew a visual with nothing to draw`);
});
