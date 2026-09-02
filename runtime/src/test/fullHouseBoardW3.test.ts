/**
 * Module 2 · Lesson 1 "Full House" — WAVE 3, LANE B: the projector payload.
 *
 * The frame this covers is the per-night CLASS RESULTS frame and the left rail
 * (VISUAL_REFERENCE_CONTRACT E2/E4; ECON_ADAPTATION_RULINGS R-2, R-4/E16, E18,
 * E19). These tests exist because the column law is economics, not styling:
 *
 *  - per-desk money must never reach `/board` (E16), so the payload is asserted
 *    to have NO money-bearing key and no money-bearing value at all;
 *  - fill is per-desk, over the seats that desk opened (R-2), so every row
 *    carries its own denominator and the rail never carries a class-wide
 *    capacity number (E18);
 *  - nothing about an OPEN night goes to the projector (R13), and the last bell
 *    closes on a held state so the staged REVEAL is still the first whole
 *    picture (E19);
 *  - desk order is stable across all five night frames, and a building past
 *    eight desks pages rather than shrinking (Q4).
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_CLASS_RESULTS_COPY,
  BOARD_RESULTS_ROWS_PER_PAGE,
  CARDS,
  MARKETS,
  NIGHT_COUNT,
  computeAggregate,
  classResultsFor,
  fullHouseModule,
  type ClassResults,
  type FullHouseState,
} from "../modules/fullHouse.js";
import type { LessonAction, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

const ctx = (phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") => ({
  phase,
  seatId,
  seatIds: [] as SeatId[],
  now: 0,
});

function ok(result: ReturnType<typeof fullHouseModule.reduce>): FullHouseState {
  assert.equal(result.ok, true, result.ok ? "" : `expected ok, got: ${result.reason}`);
  return (result as { ok: true; state: FullHouseState }).state;
}
const act = (state: FullHouseState, action: LessonAction, phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") =>
  fullHouseModule.reduce(state, action, ctx(phase, seatId));

function seated(count: number): FullHouseState {
  let state = fullHouseModule.initialState({ sessionId: "s1", seatIds: [] });
  for (let i = 1; i <= count; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  return state;
}

/** Plays one night for every seated desk, then rings the bell. */
function playNight(state: FullHouseState, price: (i: number) => number, bowl = false): FullHouseState {
  let next = state;
  const seats = Object.keys(next.desks) as SeatId[];
  seats.forEach((seatId, i) => {
    next = ok(act(next, { type: "setPrice", price: price(i) }, "PLAY", seatId));
    if (bowl) {
      const attempt = act(next, { type: "setBowl", open: true }, "PLAY", seatId);
      if (attempt.ok) next = (attempt as { ok: true; state: FullHouseState }).state;
    }
    next = ok(act(next, { type: "lock" }, "PLAY", seatId));
  });
  return ok(act(next, { type: "teacher:closeNight" }, "PLAY", "teacher"));
}

const boardPlay = (state: FullHouseState) => fullHouseModule.boardView(state, "PLAY") as Record<string, unknown>;
const results = (state: FullHouseState) => boardPlay(state)["classResults"] as ClassResults | null | undefined;

function walk(value: unknown, path = "", out: { path: string; key: string; value: unknown }[] = []) {
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out.push({ path: `${path}.${k}`, key: k, value: v });
      walk(v, `${path}.${k}`, out);
    }
  }
  return out;
}

/* ------------------------------------------------ E19 / R13: held state -- */

test("no class-results frame exists before the first bell, or while a night is open", () => {
  let state = seated(4);
  assert.equal(results(state) ?? null, null, "a frame existed before any night settled");
  const seats = Object.keys(state.desks) as SeatId[];
  for (const seatId of seats) {
    state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY", seatId));
    state = ok(act(state, { type: "lock" }, "PLAY", seatId));
  }
  assert.equal(results(state) ?? null, null, "locked prices for a still-open night reached the projector");
  const view = boardPlay(state);
  assert.equal(JSON.stringify(view).includes('"price":40'), false, "the open night's price reached the board payload");
});

test("the frame carries the LAST SETTLED night only, and the last bell holds everything", () => {
  let state = seated(4);
  for (let n = 0; n < NIGHT_COUNT; n += 1) {
    state = playNight(state, (i) => 30 + i * 6, CARDS[n]!.bowlOffer && n === 3);
    const view = boardPlay(state);
    if (n < NIGHT_COUNT - 1) {
      const frame = view["classResults"] as ClassResults;
      assert.ok(frame, `no class-results frame after the ${CARDS[n]!.label} bell`);
      assert.equal(frame.cardId, CARDS[n]!.id, "the frame is not the night that just settled");
      const ids = new Set(frame.groups.flatMap((g) => g.rows.map(() => frame.cardId)));
      assert.deepEqual([...ids], [CARDS[n]!.id], "more than one night on one frame");
    } else {
      assert.equal(view["allNightsDone"], true);
      assert.equal(view["held"], true);
      assert.equal(view["classResults"] ?? null, null, "the last bell put the fifth night up before the staged REVEAL");
    }
  }
});

/* --------------------------------------- E16 / R-4: the column law holds -- */

test("no per-desk money, and no money at all, can reach the class-results payload", () => {
  let state = seated(12);
  state = playNight(state, (i) => 30 + (i % 5) * 8);
  const frame = results(state)!;
  assert.ok(frame);

  const allowedRowKeys = ["deskHandle", "crestIndex", "price", "turnout", "seatsOpen", "fillPct", "soldOut", "openBowl"];
  for (const group of frame.groups) {
    for (const row of group.rows) {
      assert.deepEqual(Object.keys(row).sort(), [...allowedRowKeys].sort(), "a class-results row grew a column");
    }
  }

  // The DATA half of the payload — everything computed per desk. The `copy`
  // half is the registered constant block and is asserted by identity instead,
  // because E16's own explanatory footnote necessarily names the two books.
  const MONEY_KEYS = /cash|renewal|gate|net|revenue|profit|money|total|inarena|bill|spend|debt|books|median/i;
  for (const node of walk(frame.groups)) {
    assert.equal(MONEY_KEYS.test(node.key), false, `money-bearing key "${node.key}" reached the class-results data at ${node.path}`);
  }
  const asText = JSON.stringify(frame.groups).toLowerCase();
  for (const word of ["profit", "revenue", "cash", "renewals", "of capacity", "target", "expected"]) {
    assert.equal(asText.includes(word), false, `the class-results data carries the word "${word}"`);
  }
  assert.equal(frame.copy, BOARD_CLASS_RESULTS_COPY, "the frame's copy is not the registered constant block");
  // And the copy block itself carries no forbidden vocabulary.
  const copyText = Object.values(BOARD_CLASS_RESULTS_COPY).join(" ").toLowerCase();
  for (const word of ["profit", "of capacity", "target", "expected", "forecast", "project", "readiness", "momentum", "weather"]) {
    assert.equal(copyText.includes(word), false, `the registered board copy carries the forbidden word "${word}"`);
  }
});

test("fill is per desk, over the seats that desk opened, and the qualifier says so", () => {
  let state = seated(4);
  for (let n = 0; n < 4; n += 1) state = playNight(state, () => 30, n === 3);
  const frame = results(state)!;
  assert.equal(frame.cardId, "N4");
  assert.equal(frame.copy.fillQualifier, "of the seats that desk opened");
  assert.equal(/of capacity/i.test(JSON.stringify(frame)), false);
  for (const group of frame.groups) {
    const market = MARKETS.find((m) => m.id === group.marketId)!;
    for (const row of group.rows) {
      const expected = market.capacity + (row.openBowl ? market.bowlSeats : 0);
      assert.equal(row.seatsOpen, expected, `${row.deskHandle} does not print its own denominator`);
      assert.equal(row.fillPct, Math.round((row.turnout / row.seatsOpen) * 1000) / 10);
      assert.ok(row.seatsOpen > 0);
    }
    assert.equal(group.capacityNote, market.capacityNote, "a building lost its own capacity note");
  }
  const bowlRows = frame.groups.flatMap((g) => g.rows).filter((r) => r.openBowl);
  assert.ok(bowlRows.length > 0, "the bowl night produced no desk with a larger denominator to test");
});

/* ------------------------------------------- E2: order, groups, buildings -- */

test("desk order is stable across all five night frames", () => {
  let state = seated(12);
  const seen: string[][] = [];
  for (let n = 0; n < NIGHT_COUNT; n += 1) {
    state = playNight(state, (i) => 24 + i * 4);
    const view = boardPlay(state);
    const frame = (view["classResults"] as ClassResults | null) ?? classResultsFor(state, computeAggregate(state), CARDS[n]!.id);
    seen.push(frame!.groups.flatMap((g) => g.rows.map((r) => r.deskHandle)));
  }
  for (let i = 1; i < seen.length; i += 1) {
    assert.deepEqual(seen[i], seen[0], `desk order changed between night 1 and night ${i + 1}`);
  }
  assert.equal(seen[0]!.length, 12);
});

test("one building per group, and a building past eight desks pages instead of shrinking", () => {
  let state = seated(20);
  state = playNight(state, (i) => 26 + (i % 4) * 10);
  const frame = results(state)!;
  // 20 desks alternate: 10 New York, 10 Memphis. Each building pages 8 + 2.
  assert.equal(frame.groups.length, 4);
  for (const group of frame.groups) {
    assert.ok(group.rows.length <= BOARD_RESULTS_ROWS_PER_PAGE);
    const clubs = new Set(group.rows.map((r) => r.deskHandle.split(" · ")[1]));
    assert.equal(clubs.size, 1, "a group mixed two buildings");
    assert.equal([...clubs][0], group.club, "a group's rows are not its own building");
  }
  const nyGroups = frame.groups.filter((g) => g.marketId === "new-york");
  assert.deepEqual(nyGroups.map((g) => g.rows.length), [8, 2]);
  assert.deepEqual(nyGroups.map((g) => `${g.group}/${g.groupCount}`), ["1/2", "2/2"]);
  const nyOrder = nyGroups.flatMap((g) => g.rows.map((r) => r.deskHandle));
  assert.deepEqual([...nyOrder].sort((a, b) => Number(a.split(" ")[1]) - Number(b.split(" ")[1])), nyOrder, "paging broke desk order");
  // The bar's basis is the building's own largest open seat count, never a
  // class-wide number and never a share of a mixed pool.
  for (const group of frame.groups) {
    assert.equal(group.barBasis, Math.max(...group.rows.map((r) => r.seatsOpen)));
  }
});

test("the frame names its night and its buildings from registered card and market facts", () => {
  let state = seated(4);
  state = playNight(state, () => 30);
  const frame = results(state)!;
  assert.equal(frame.cardLabel, CARDS[0]!.label);
  assert.equal(frame.day, CARDS[0]!.day);
  assert.equal(frame.visitor, CARDS[0]!.visitor);
  assert.equal(frame.nightNumber, 1);
  assert.equal(frame.nightCount, NIGHT_COUNT);
  assert.equal(frame.copy, BOARD_CLASS_RESULTS_COPY);
  for (const group of frame.groups) {
    const market = MARKETS.find((m) => m.id === group.marketId)!;
    assert.equal(group.club, market.club);
    assert.equal(group.building, market.building);
    assert.equal(group.capacity, market.capacity);
  }
});

/* -------------------------------------------------------- E4: the rail --- */

test("every board frame carries the left rail, with per-market capacity and no class-wide number", () => {
  let state = seated(4);
  const sumOfCapacities = MARKETS.reduce((a, m) => a + m.capacity, 0);
  const phases: CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "COUNTERFACTUAL", "SYNTHESIS", "COMPLETE"];
  for (let n = 0; n < NIGHT_COUNT; n += 1) state = playNight(state, (i) => 28 + i * 6);
  for (const phase of phases) {
    const view = fullHouseModule.boardView(state, phase) as Record<string, unknown>;
    const rail = view["rail"] as Record<string, unknown> | undefined;
    assert.ok(rail, `${phase} has no rail`);
    assert.equal(rail["nightCount"], NIGHT_COUNT);
    assert.equal((rail["pips"] as unknown[]).length, NIGHT_COUNT);
    const markets = rail["markets"] as { club: string; capacity: number; capacityNote: string }[];
    assert.equal(markets.length, MARKETS.length);
    for (const m of markets) {
      const source = MARKETS.find((x) => x.club === m.club)!;
      assert.equal(m.capacity, source.capacity);
      assert.equal(m.capacityNote, source.capacityNote);
    }
    assert.equal(JSON.stringify(rail).includes(String(sumOfCapacities)), false, `${phase}'s rail carries one class-wide capacity number`);
  }
});

test("the rail's pips report which nights have settled, and never run past five", () => {
  let state = seated(2);
  for (let n = 0; n <= NIGHT_COUNT; n += 1) {
    const rail = (fullHouseModule.boardView(state, "PLAY") as Record<string, unknown>)["rail"] as {
      nightNumber: number;
      pips: { state: string }[];
    };
    assert.ok(rail.nightNumber >= 1 && rail.nightNumber <= NIGHT_COUNT);
    assert.equal(rail.pips.filter((p) => p.state === "settled").length, Math.min(n, NIGHT_COUNT));
    if (n < NIGHT_COUNT) state = playNight(state, () => 30);
  }
});
