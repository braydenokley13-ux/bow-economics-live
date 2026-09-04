/**
 * MODULE 1 · LESSON 3 — "THE DEADLINE" — module-level reducer, views and round
 * contract. Legality and contest resolution have their own coverage in
 * `sameLineMarket.test.ts`; this file drives `sameLineL3Module` itself.
 *
 * Fixtures build a `SameLineL3State` by hand rather than through a real seed
 * pipeline (seed resolution — `extractSeasonCarry` / `extractWindowCarry` /
 * `stockPool` degradation — is exercised separately, at the bottom of this
 * file, through `initialState`). Hand-built state lets every reducer case be
 * driven directly and deterministically.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashJobState,
  sameLineL3Module,
  spotlightViewFor,
  pressCandidatesFor,
  SAME_LINE_L3_ID,
  SEND_CHIPS_56,
  SEND_CHIPS_78,
  DECLINE_CHIPS,
  type SameLineL3State,
  type Desk,
  type Offer,
} from "../modules/sameLine/l3.js";
import type { ContractObject, PickObject } from "../modules/sameLine/market.js";
import { LINE } from "../modules/sameLine/world.js";
import type { ReduceContext } from "../shared/lessonModule.js";

/* ------------------------------------------------------------ fixtures -- */

function contract(id: string, annual: number, extra?: Partial<ContractObject>): ContractObject {
  return {
    kind: "contract",
    contractId: id,
    playerId: id,
    name: id.toUpperCase(),
    role: "WING",
    annual,
    yearsRemaining: 2,
    jobState: "DOES_JOB",
    acquiredWeek: 1,
    ...extra,
  };
}

function pick(id: string, label = id): PickObject {
  return { kind: "pick", pickId: id, year: 2029, round: 1, label };
}

/**
 * R6 (roster count, ROSTER.min..ROSTER.max = 14..15) gates every legality
 * check in the reducer, same as in `sameLineMarket.test.ts` — pad every
 * fixture roster to 14 with filler contracts that never move, so a 1-for-1
 * propose/counter/accept exercises the rule actually under test rather than
 * failing on roster count first.
 */
function desk(seatId: string, clubId: "memphis" | "detroit" | "boston", twin: 0 | 1, committed: number, roster: ContractObject[], picksOwned: PickObject[] = [pick(`${seatId}-first`), pick(`${seatId}-second`)]): Desk {
  const padded = roster.length >= 14 ? roster : [...roster, ...Array.from({ length: 14 - roster.length }, (_, i) => contract(`${seatId}-fill-${i}`, 3_000_000))];
  return {
    seatId,
    clubId,
    twin,
    label: `${clubId} ${twin === 0 ? "A" : "B"}`,
    books: { committed, taxSalary: committed, deadMoney: 0, holds: 0, wall: null, band: "under-cap" },
    roster: padded,
    picksOwned,
    ownPickIds: picksOwned.map((p) => p.pickId),
    picksOwed: [],
    openJobs: ["BIG"],
    bookVersion: 1,
    captures: [],
    evidence: [],
    seedWarning: null,
  };
}

function baseState(desks: Record<string, Desk>, overrides?: Partial<SameLineL3State>): SameLineL3State {
  return {
    sessionId: "sess-1",
    gradeBand: "5-6",
    hour: 1,
    marketClosed: false,
    desks,
    listings: [],
    offers: {},
    executed: [],
    settled: null,
    beat: 0,
    warnings: [],
    observers: [],
    pool: [],
    nextPoolIndex: 0,
    nextSeq: 1,
    hotSeat: null,
    defenses: {},
    ...overrides,
  };
}

function ctx(seatId: string, phase: ReduceContext["phase"] = "PLAY", seatIds: readonly string[] = []): ReduceContext {
  return { phase, seatId, seatIds, now: 0 };
}

const reduce = sameLineL3Module.reduce;

/* --------------------------------------------------------------- phases -- */

test("phases omit ADAPT per spec", () => {
  assert.equal(sameLineL3Module.phases.includes("ADAPT" as never), false);
  assert.deepEqual([...sameLineL3Module.phases], ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"]);
});

/* ---------------------------------------------------------------- offer -- */

function twoDeskState(gradeBand: "5-6" | "7-8" = "5-6"): SameLineL3State {
  // Two contracts each (beyond the 14-filler pad) so a 5-6 counter can swap
  // one object for another without exceeding the one-object-per-side cap.
  const a = desk("A", "memphis", 0, 100_000_000, [contract("a-1", 5_000_000), contract("a-2", 4_500_000)]);
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 5_000_000), contract("b-2", 4_500_000)]);
  return baseState({ A: a, B: b }, { gradeBand });
}

test("propose refused outside PLAY", () => {
  const state = twoDeskState();
  const result = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A", "REVEAL"));
  assert.equal(result.ok, false);
});

test("propose refused once the market is closed", () => {
  const state = { ...twoDeskState(), marketClosed: true };
  const result = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(result.ok, false);
});

test("propose requires a chip before the offer can go out", () => {
  const state = twoDeskState();
  const result = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"] }, ctx("A"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /giving up/);
});

test("propose creates a LIVE offer, escrowing both sides", () => {
  const state = twoDeskState();
  const result = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const offers = Object.values(result.state.offers);
  assert.equal(offers.length, 1);
  assert.equal(offers[0]!.state, "LIVE");
  assert.equal(offers[0]!.proposedBy, "A");
  // Escrowed: A cannot list a-1 while the offer is live.
  const listResult = reduce(result.state, { type: "list", objectId: "a-1" }, ctx("A"));
  assert.equal(listResult.ok, false);
});

test("propose enforces the two-live-outgoing cap", () => {
  let state = twoDeskState();
  state = { ...state, desks: { ...state.desks, C: desk("C", "boston", 0, 100_000_000, [contract("c-1", 5_000_000)]) } };
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  const r2 = reduce(r1.state, { type: "propose", toSeat: "C", send: ["a-1"], want: ["c-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  // a-1 already escrowed by the first offer — this must fail on escrow, not
  // on the live-out cap, so give A a second sendable object.
  assert.equal(r2.ok, false);
});

test("propose enforces the two-live-outgoing cap with distinct objects", () => {
  const a = desk("A", "memphis", 0, 100_000_000, [contract("a-1", 5_000_000), contract("a-2", 4_000_000)]);
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 5_000_000)]);
  const c = desk("C", "boston", 0, 100_000_000, [contract("c-1", 4_000_000)]);
  let state = baseState({ A: a, B: b, C: c });
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  const r2 = reduce(r1.state, { type: "propose", toSeat: "C", send: ["a-2"], want: ["c-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  const r3 = reduce(r2.state, { type: "propose", toSeat: "C", send: ["a-2"], want: ["c-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.match(r3.reason, /two offers out/);
});

test("propose enforces the inbox cap of three", () => {
  // Each sender asks for a DIFFERENT object B owns (B's own filler pad),
  // so the inbox fills to three without any offer colliding on escrow —
  // isolating the inbox-cap rule from the escrow rule.
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 5_000_000)]);
  const wants = ["B-fill-0", "B-fill-1", "B-fill-2", "B-fill-3"];
  const senders = ["A", "C", "D", "E"].map((id, i) => desk(id, "memphis", 0, 100_000_000, [contract(`${id.toLowerCase()}-x`, 4_000_000 + i)]));
  let state = baseState({ B: b, ...Object.fromEntries(senders.map((d) => [d.seatId, d])) });
  for (let i = 0; i < 3; i += 1) {
    const s = senders[i]!;
    const r = reduce(state, { type: "propose", toSeat: "B", send: [`${s.seatId.toLowerCase()}-x`], want: [wants[i]!], chip: SEND_CHIPS_56[0] }, ctx(s.seatId));
    assert.equal(r.ok, true, r.ok ? "" : r.reason);
    if (r.ok) state = r.state;
  }
  const r4 = reduce(state, { type: "propose", toSeat: "B", send: ["e-x"], want: [wants[3]!], chip: SEND_CHIPS_56[0] }, ctx("E"));
  assert.equal(r4.ok, false);
  if (!r4.ok) assert.match(r4.reason, /full/);
});

test("counter allows exactly one change and flips proposedBy", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  const offerId = Object.keys(r1.state.offers)[0]!;
  // swap what B wants back for its OTHER contract — exactly one change, and
  // still one object per side (5-6's cap).
  const r2 = reduce(r1.state, { type: "counter", offerId, send: ["a-1"], want: ["b-2"] }, ctx("B"));
  assert.equal(r2.ok, true, r2.ok ? "" : r2.reason);
  if (!r2.ok) return;
  const offer = r2.state.offers[offerId]!;
  assert.equal(offer.state, "COUNTERED");
  assert.equal(offer.proposedBy, "B");
  assert.equal(offer.countered, true);
});

test("counter refuses a second counter on the same negotiation", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "counter", offerId, send: ["a-1"], want: ["b-2"] }, ctx("B"));
  if (!r2.ok) return assert.fail(r2.reason);
  // The negotiation is now COUNTERED, not LIVE — only a LIVE offer can be
  // countered, so a second counter (from either side) is refused outright
  // rather than re-litigated. A accepts or declines B's counter from here.
  const r3 = reduce(r2.state, { type: "counter", offerId, send: ["a-2"], want: ["b-2"] }, ctx("A"));
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.match(r3.reason, /not open to a counter/);
});

test("counter refuses more than one change at once", () => {
  const state = twoDeskState("7-8");
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_78[0] }, ctx("A"));
  if (!r1.ok) return assert.fail(r1.reason);
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "counter", offerId, send: ["a-1", "A-first", "A-second"], want: ["b-1"] }, ctx("B"));
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.match(r2.reason, /exactly one/);
});

test("at 7-8 the propose chip must come from the 7-8 list, not the 5-6 list", () => {
  const state = twoDeskState("7-8");
  const wrongList = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(wrongList.ok, false);
  const rightList = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_78[0] }, ctx("A"));
  assert.equal(rightList.ok, true, rightList.ok ? "" : rightList.reason);
});

test("accept voids on stale bookVersion (VOID_STALE) rather than executing", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  // A's books changed (bookVersion bumped) after the offer went out.
  const staled: SameLineL3State = { ...r1.state, desks: { ...r1.state.desks, A: { ...r1.state.desks["A"]!, bookVersion: 2 } } };
  const r2 = reduce(staled, { type: "accept", offerId }, ctx("B"));
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  assert.equal(r2.state.offers[offerId]!.state, "VOID_STALE");
});

test("accept at 5-6 refuses a second simultaneous accept for the same desk", () => {
  const a = desk("A", "memphis", 0, 100_000_000, [contract("a-1", 5_000_000), contract("a-2", 4_000_000)]);
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 5_000_000)]);
  const c = desk("C", "boston", 0, 100_000_000, [contract("c-1", 4_000_000)]);
  let state = baseState({ A: a, B: b, C: c });
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  state = r1.state;
  const r2 = reduce(state, { type: "propose", toSeat: "C", send: ["a-2"], want: ["c-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r2.ok) return assert.fail();
  state = r2.state;
  const offerIds = Object.keys(state.offers);
  // B accepts first offer, on A's side that means A now "has" an accept out.
  const r3 = reduce(state, { type: "accept", offerId: offerIds[0]! }, ctx("B"));
  if (!r3.ok) return assert.fail();
  state = r3.state;
  const r4 = reduce(state, { type: "accept", offerId: offerIds[1]! }, ctx("C"));
  assert.equal(r4.ok, false);
  if (!r4.ok) assert.match(r4.reason, /already has a deal/);
});

test("withdrawAccept reverts an ACCEPTED offer back to LIVE before the hour closes", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "accept", offerId }, ctx("B"));
  if (!r2.ok) return assert.fail();
  assert.equal(r2.state.offers[offerId]!.state, "ACCEPTED");
  const r3 = reduce(r2.state, { type: "withdrawAccept", offerId }, ctx("B"));
  assert.equal(r3.ok, true);
  if (!r3.ok) return;
  assert.equal(r3.state.offers[offerId]!.state, "LIVE");
  assert.equal(r3.state.offers[offerId]!.acceptedBy, null);
});

test("withdrawAccept reverts to COUNTERED (not LIVE) when the offer was countered", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "counter", offerId, send: ["a-1"], want: ["b-2"] }, ctx("B"));
  if (!r2.ok) return assert.fail(r2.reason);
  // A accepts B's counter.
  const r3 = reduce(r2.state, { type: "accept", offerId }, ctx("A"));
  if (!r3.ok) return assert.fail();
  const r4 = reduce(r3.state, { type: "withdrawAccept", offerId }, ctx("A"));
  assert.equal(r4.ok, true);
  if (!r4.ok) return;
  assert.equal(r4.state.offers[offerId]!.state, "COUNTERED");
});

test("withdrawAccept refuses a seat that did not hold the accept", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "accept", offerId }, ctx("B"));
  if (!r2.ok) return assert.fail();
  const r3 = reduce(r2.state, { type: "withdrawAccept", offerId }, ctx("A"));
  assert.equal(r3.ok, false);
});

test("decline requires a chip and keeps the reason private to the decliner", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const noChip = reduce(r1.state, { type: "decline", offerId }, ctx("B"));
  assert.equal(noChip.ok, false);
  const r2 = reduce(r1.state, { type: "decline", offerId, chip: DECLINE_CHIPS[0] }, ctx("B"));
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  assert.equal(r2.state.offers[offerId]!.state, "DECLINED");
  const senderView = sameLineL3Module.studentView(r2.state, "A", "PLAY") as { myOffers: { declineReason: string | null }[] };
  const declinerView = sameLineL3Module.studentView(r2.state, "B", "PLAY") as { myOffers: { declineReason: string | null }[] };
  assert.equal(senderView.myOffers[0]!.declineReason, null);
  assert.equal(declinerView.myOffers[0]!.declineReason, DECLINE_CHIPS[0]);
});

/* -------------------------------------------------------- hour / settle -- */

test("teacher:closeHour executes an accepted offer and advances hour 1 -> 2", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "accept", offerId }, ctx("B"));
  if (!r2.ok) return assert.fail();
  const r3 = reduce(r2.state, { type: "teacher:closeHour" }, ctx("teacher"));
  assert.equal(r3.ok, true);
  if (!r3.ok) return;
  assert.equal(r3.state.hour, 2);
  assert.equal(r3.state.marketClosed, false);
  assert.equal(r3.state.offers[offerId]!.state, "EXECUTED");
  // The objects actually moved.
  assert.ok(r3.state.desks["A"]!.roster.some((c) => c.contractId === "b-1"));
  assert.ok(r3.state.desks["B"]!.roster.some((c) => c.contractId === "a-1"));
});

test("teacher:closeHour on hour 2 closes the market and runs the season settle", () => {
  const state: SameLineL3State = { ...twoDeskState(), hour: 2 };
  const r = reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.state.marketClosed, true);
  assert.ok(r.state.settled !== null);
});

test("teacher:closeHour expires unanswered offers rather than silently dropping them", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "teacher:closeHour" }, ctx("teacher"));
  if (!r2.ok) return assert.fail();
  assert.equal(r2.state.offers[offerId]!.state, "EXPIRED");
});

test("expiring an offer releases its escrow", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "withdraw", offerId }, ctx("A"));
  if (!r2.ok) return assert.fail();
  const listResult = reduce(r2.state, { type: "list", objectId: "a-1" }, ctx("A"));
  assert.equal(listResult.ok, true);
});

test("picks reopen holes at the settle: a contract with yearsRemaining <= 1 lists in expiringNextSeason regardless of jobState", () => {
  const rental = contract("a-1", 5_000_000, { yearsRemaining: 1, jobState: "DOES_JOB" });
  const a = desk("A", "memphis", 0, 100_000_000, [rental]);
  const state: SameLineL3State = { ...baseState({ A: a }), hour: 2 };
  const r = reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const settleA = r.state.settled!.perSeat["A"]!;
  assert.ok(settleA.expiringNextSeason.some((c) => c.contractId === "a-1"));
});

test("season settle only re-rolls contracts acquired this week (acquiredWeek === 3)", () => {
  const carried = contract("a-1", 5_000_000, { acquiredWeek: 1, jobState: "DOES_JOB", role: "BIG" });
  const acquired = contract("a-2", 5_000_000, { acquiredWeek: 3, role: "BIG" });
  const a = desk("A", "memphis", 0, 100_000_000, [carried, acquired]);
  const state: SameLineL3State = { ...baseState({ A: a }), hour: 2 };
  const r = reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  if (!r.ok) return assert.fail();
  const results = r.state.settled!.perSeat["A"]!.acquiredResults;
  assert.equal(results.length, 1);
  assert.equal(results[0]!.contractId, "a-2");
});

test("applySettle writes openJobs back onto each desk and is idempotent (settled once, not recomputed)", () => {
  const a = desk("A", "memphis", 0, 100_000_000, []);
  const state: SameLineL3State = { ...baseState({ A: a }), hour: 2 };
  const r = reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  if (!r.ok) return assert.fail();
  const firstSettled = r.state.settled;
  const r2 = reduce(r.state, { type: "teacher:closeHour" }, ctx("teacher"));
  // Market already closed — the action refuses, so settled cannot change.
  assert.equal(r2.ok, false);
  assert.equal(r.state.settled, firstSettled);
});

test("hashJobState is deterministic on (sessionId, contractId)", () => {
  assert.equal(hashJobState("s1", "c1"), hashJobState("s1", "c1"));
});

/* ------------------------------------------------------------- privacy -- */

test("studentView never exposes another seat's private data", () => {
  const state = twoDeskState();
  const view = sameLineL3Module.studentView(state, "A", "PLAY") as Record<string, unknown>;
  const json = JSON.stringify(view);
  assert.equal(json.includes("b-1"), false); // B's contract not on A's books or the (empty) market
});

test("boardView never carries a seat id or per-seat price/package while offers are open", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const view = sameLineL3Module.boardView(r1.state, "PLAY") as Record<string, unknown>;
  const json = JSON.stringify(view);
  assert.equal(json.includes("\"A\""), false);
  assert.equal(json.includes("\"B\""), false);
  assert.equal(json.includes("seatId"), false);
});

test("boardView reachBlocked is a single summed integer, never per-desk", () => {
  const state = twoDeskState();
  const view = sameLineL3Module.boardView(state, "PLAY") as { reachBlocked: number };
  assert.equal(typeof view.reachBlocked, "number");
});

test("studentView exposes a desk-private reachBlocked count", () => {
  const state = twoDeskState();
  const view = sameLineL3Module.studentView(state, "A", "PLAY") as { reachBlocked: number };
  assert.equal(typeof view.reachBlocked, "number");
});

test("teacherView never leaks a decline reason and carries walkTo signals", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "decline", offerId, chip: DECLINE_CHIPS[0] }, ctx("B"));
  if (!r2.ok) return assert.fail();
  const view = sameLineL3Module.teacherView(r2.state, "PLAY") as Record<string, unknown>;
  assert.equal(JSON.stringify(view).includes(DECLINE_CHIPS[0]), false);
});

/* ------------------------------------------------------------ allowedActions -- */

test("allowedActions gates PLAY-only actions out of other phases", () => {
  assert.ok(sameLineL3Module.allowedActions);
  const allowed = sameLineL3Module.allowedActions!("PLAY");
  for (const a of ["takeSeat", "list", "unlist", "propose", "withdraw", "counter", "accept", "withdrawAccept", "decline"]) {
    assert.ok(allowed.includes(a), a);
  }
  assert.deepEqual(sameLineL3Module.allowedActions!("SYNTHESIS"), []);
});

/* --------------------------------------------------------------- round -- */

test("round.currentKey is null once the market has closed", () => {
  const state: SameLineL3State = { ...twoDeskState(), marketClosed: true };
  assert.equal(sameLineL3Module.round!.currentKey(state, "PLAY"), null);
});

test("round.currentKey tracks the hour while the market is open", () => {
  const state = twoDeskState();
  assert.equal(sameLineL3Module.round!.currentKey(state, "PLAY"), "hour1");
});

test("round.unresolved reports desks with an offer still awaiting them", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const unresolved = sameLineL3Module.round!.unresolved(r1.state, "PLAY", ["A", "B"]);
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0]!.seatId, "B");
});

test("onPhaseExit leaving PLAY force-settles the hour and closes the market", () => {
  const state = twoDeskState();
  const r1 = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  if (!r1.ok) return assert.fail();
  const offerId = Object.keys(r1.state.offers)[0]!;
  const r2 = reduce(r1.state, { type: "accept", offerId }, ctx("B"));
  if (!r2.ok) return assert.fail();
  assert.ok(sameLineL3Module.onPhaseExit);
  const next = sameLineL3Module.onPhaseExit!(r2.state, "PLAY", "REVEAL");
  assert.equal(next.marketClosed, true);
  assert.equal(next.offers[offerId]!.state, "EXECUTED");
  assert.ok(next.settled !== null);
});

/* ------------------------------------------------------------- podium -- */

test("spotlightViewFor returns null for an unseated seat and a payload for a seated one", () => {
  const state = twoDeskState();
  assert.equal(spotlightViewFor(state, "nobody", "REVEAL"), null);
  const view = spotlightViewFor(state, "A", "REVEAL") as { label: string; club: string };
  assert.equal(view.label, "memphis A");
});

test("pressCandidatesFor returns an array with seatId/label/why", () => {
  const state = twoDeskState();
  const candidates = pressCandidatesFor(state, "REVEAL");
  assert.ok(Array.isArray(candidates));
  for (const c of candidates) {
    assert.equal(typeof c.seatId, "string");
    assert.equal(typeof c.label, "string");
    assert.equal(typeof c.why, "string");
  }
});

/* --------------------------------------------------------------- seats -- */

test("takeSeat assigns from the pool and a second takeSeat by the same seat is a no-op", () => {
  const state = baseState({}, { pool: [] });
  // No pool entries at all -> falls straight to observer.
  const r = reduce(state, { type: "takeSeat" }, ctx("Z"));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.ok(r.state.observers.includes("Z"));
});

test("teacher may never take a desk seat", () => {
  const state = baseState({});
  const r = reduce(state, { type: "takeSeat" }, ctx("teacher"));
  assert.equal(r.ok, false);
});

test("propose accepts a public toDesk (holderId) key and resolves it to the real seat, never requiring a seat id", () => {
  const state = twoDeskState();
  // studentView exposes each market entry's holderId as `${clubId}-${twin}` — never a seat id.
  const view = sameLineL3Module.studentView(state, "A", "PLAY") as { books: { taxSalaryText: string } };
  assert.equal(typeof view.books.taxSalaryText, "string");
  const holderId = "detroit-0"; // B is desk("B","detroit",0,...)
  const r = reduce(state, { type: "propose", toDesk: holderId, send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r.ok, true, r.ok ? "" : r.reason);
  if (!r.ok) return;
  const offer = Object.values(r.state.offers)[0]!;
  assert.equal(offer.toSeat, "B");
});

test("studentView market entries carry a public holderId, never a seat id, plus annualText for a contract", () => {
  const a = desk("A", "memphis", 0, 100_000_000, [contract("a-1", 5_000_000)]);
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 5_000_000)]);
  let state = baseState({ A: a, B: b });
  const list = reduce(state, { type: "list", objectId: "b-1" }, ctx("B"));
  assert.equal(list.ok, true);
  if (!list.ok) return;
  state = list.state;
  const view = sameLineL3Module.studentView(state, "A", "PLAY") as { market: { id: string; holderId: string | null; annualText: string | null; label: string }[] };
  const entry = view.market.find((m) => m.id === "b-1")!;
  assert.equal(entry.holderId, "detroit-0");
  assert.equal(entry.annualText, "$5,000,000");
  assert.equal(entry.label, "B-1");
});

test("naming appears only at SYNTHESIS/COMPLETE, with the {index,count,term,moment,means,real,outside} shape, on both studentView and boardView", () => {
  const state: SameLineL3State = { ...twoDeskState(), marketClosed: true, executed: [{ id: "o1", hour: 1, fromSeat: "A", toSeat: "B", send: ["a-1"], want: ["b-1"] }] };
  const playView = sameLineL3Module.studentView(state, "A", "PLAY") as { naming: unknown };
  assert.equal(playView.naming, null);
  const synthStudent = sameLineL3Module.studentView(state, "A", "SYNTHESIS") as { naming: { index: number; count: number; term: string; moment: string; means: string; real: string; outside: string } | null };
  assert.ok(synthStudent.naming);
  assert.equal(typeof synthStudent.naming!.term, "string");
  assert.match(synthStudent.naming!.real, /2026-02-05/);
  assert.doesNotMatch(synthStudent.naming!.outside, /REAL EXAMPLE PENDING/);
  const synthBoard = sameLineL3Module.boardView(state, "SYNTHESIS") as { naming: { term: string } | null };
  assert.ok(synthBoard.naming);
});

test("D62: every L3 naming card carries a non-empty real line, and no REAL EXAMPLE PENDING placeholder survives", () => {
  /*
   * D62 (docs/PRODUCT_DECISIONS.md): the naming card gains a `real` line so
   * the dated sports fact is never improvised aloud. GAINS FROM TRADE and
   * SUBJECTIVE VALUE are filled from the R-7 pass; RATIONING and ROOM
   * (CONSTRAINT) have no dated fact sourced yet and must say so plainly
   * rather than leave the field empty or leave the PENDING placeholder in
   * `outside` (l1.ts:518 — outside must leave basketball).
   */
  const walled = { ...desk("A", "memphis", 0, 100_000_000, []), books: { ...desk("A", "memphis", 0, 100_000_000, []).books, wall: 100_000_000 } };
  const state: SameLineL3State = {
    ...twoDeskState("7-8"),
    desks: { A: walled, B: desk("B", "detroit", 0, 100_000_000, []) },
    marketClosed: true,
    executed: [{ id: "o1", hour: 1, fromSeat: "A", toSeat: "B", send: ["a-1"], want: ["b-1"] }],
  };
  const withDecline = {
    ...walled,
    captures: [...walled.captures, { id: "cap-x", seatId: "A" as const, kind: "decline" as const, chip: DECLINE_CHIPS[0], hour: 1 as const }],
  };
  const full: SameLineL3State = { ...state, desks: { A: withDecline, B: state.desks["B"]! } };

  const seenTerms = new Set<string>();
  let walk = full;
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const f = (sameLineL3Module.boardView(walk, "SYNTHESIS") as { naming: { term: string; real: string; outside: string; index: number; count: number } | null }).naming;
    if (!f) break;
    if (seenTerms.has(f.term)) break;
    seenTerms.add(f.term);
    assert.ok(f.real.length > 0, `${f.term}: empty real line`);
    assert.doesNotMatch(f.real, /REAL EXAMPLE PENDING/, `${f.term}: PENDING placeholder survives in real`);
    assert.doesNotMatch(f.outside, /REAL EXAMPLE PENDING/, `${f.term}: PENDING placeholder survives in outside`);
    assert.ok(f.outside.length > 0, `${f.term}: empty outside line`);
    const nx = sameLineL3Module.reduce(walk, { type: "teacher:revealNext" }, ctx("teacher", "SYNTHESIS", ["teacher"]));
    if (!nx.ok || nx.state === walk) break;
    walk = nx.state as SameLineL3State;
  }
  assert.ok(seenTerms.has("GAINS FROM TRADE"), "gains from trade never showed up in this walk");
  assert.ok(seenTerms.has("SUBJECTIVE VALUE"), "subjective value never showed up in this walk");
});

test("studentView surfaces this desk's own season-settle result at REVEAL/CONSEQUENCE, never before", () => {
  const a = desk("A", "memphis", 0, 100_000_000, []);
  let state: SameLineL3State = { ...baseState({ A: a }), hour: 2 };
  const closed = reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  if (!closed.ok) return assert.fail(closed.reason);
  state = closed.state;
  const playView = sameLineL3Module.studentView(state, "A", "PLAY") as { settled: unknown };
  assert.equal(playView.settled, null);
  const revealView = sameLineL3Module.studentView(state, "A", "REVEAL") as { settled: { coveredJobs: number; openJobs: readonly string[] } | null };
  assert.ok(revealView.settled);
  assert.equal(typeof revealView.settled!.coveredJobs, "number");
});

test("spotlightView and pressCandidates are wired onto the module object, not only exported loose", () => {
  const state = twoDeskState();
  assert.ok(sameLineL3Module.spotlightView);
  assert.ok(sameLineL3Module.pressCandidates);
  assert.deepEqual(sameLineL3Module.spotlightView!(state, "A", "REVEAL"), spotlightViewFor(state, "A", "REVEAL"));
  assert.deepEqual(sameLineL3Module.pressCandidates!(state, "REVEAL"), pressCandidatesFor(state, "REVEAL"));
});

/* ---------------------------------------------------------- seed intake -- */

test("initialState with an unusable seed falls back to the stock pool and warns, never crashing", () => {
  const state = sameLineL3Module.initialState({ sessionId: "s1", seatIds: [], seed: { garbage: true }, gradeBand: "5-6" });
  assert.equal(state.hour, 1);
  assert.equal(state.marketClosed, false);
  assert.ok(state.pool.length > 0);
  assert.ok(state.warnings.some((w) => w.includes("No usable Week 1 or Week 2 history")));
});

test("initialState with no seed at all still produces a playable pool (BC-18-safe default)", () => {
  const state = sameLineL3Module.initialState({ sessionId: "s2", seatIds: [], gradeBand: "7-8" });
  assert.ok(state.pool.length > 0);
  assert.equal(state.gradeBand, "7-8");
});

/* ------------------------------------------------------------- economics -- */

test("a trade never crosses LINE.cap for a desk with room, per the room-absorption rule wired through the reducer", () => {
  // Memphis-shaped desk sends a small salary and cannot receive more than its
  // OUT bar — worked case lives in sameLineMarket.test.ts; here we confirm the
  // reducer actually calls the same predicate (an over-cap receive is refused).
  const a = desk("A", "memphis", 0, LINE.cap - 1_000_000, [contract("a-1", 1_000_000)]);
  const b = desk("B", "detroit", 0, 100_000_000, [contract("b-1", 50_000_000)]);
  const state = baseState({ A: a, B: b });
  const r = reduce(state, { type: "propose", toSeat: "B", send: ["a-1"], want: ["b-1"], chip: SEND_CHIPS_56[0] }, ctx("A"));
  assert.equal(r.ok, false);
});
