import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAP,
  MARKET,
  SLOT_IDS,
  capStateOf,
  draftDayModule,
  spentOf,
  weakestSlotOf,
  type DraftDayState,
  type TeamState,
} from "../modules/draftDay.js";
import { isOrderedSubsequence } from "../shared/phases.js";

const ctx = (phase: string, seatId = "seat-1", seatIds: string[] = [seatId]) => ({
  phase: phase as never,
  seatId,
  seatIds,
  now: Date.now(),
});

const empty = (): DraftDayState => draftDayModule.initialState({ sessionId: "s1", seatIds: [] });

function place(state: DraftDayState, seatId: string, slotId: string, playerId: string) {
  return draftDayModule.reduce(state, { type: "place", slotId, playerId }, ctx("PLAY", seatId));
}

function expectOk(result: ReturnType<typeof draftDayModule.reduce>): DraftDayState {
  assert.equal(result.ok, true, !result.ok ? result.reason : undefined);
  if (!result.ok) throw new Error("unreachable");
  return result.state;
}

/** Builds a full, locked five-slot roster for one seat from explicit player ids. */
function buildAndLock(
  state: DraftDayState,
  seatId: string,
  picks: { slot: string; playerId: string }[],
): DraftDayState {
  let s = state;
  for (const { slot, playerId } of picks) {
    s = expectOk(place(s, seatId, slot, playerId));
  }
  s = expectOk(draftDayModule.reduce(s, { type: "lock" }, ctx("PLAY", seatId)));
  return s;
}

const CHEAP_FULL_ROSTER = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
];

test("draftDayModule declares a well-ordered phase subsequence covering the full canonical vocabulary", () => {
  assert.equal(isOrderedSubsequence(draftDayModule.phases), true);
  assert.deepEqual(
    [...draftDayModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "ADAPT", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"],
  );
});

test("market has 20 fictional players across 4 positions with distinct ratings", () => {
  assert.equal(MARKET.length, 20);
  const ratings = new Set(MARKET.map((p) => p.rating));
  assert.equal(ratings.size, 20, "ratings should be pairwise distinct so shock targeting never needs a tie-break in practice");
  for (const p of MARKET) {
    assert.ok(p.price >= 10 && p.price <= 60 && p.price % 10 === 0, `${p.name} price must be a $10M step between 10 and 60`);
  }
});

test("place rejects outside PLAY phase", () => {
  const result = draftDayModule.reduce(empty(), { type: "place", slotId: "SCORER", playerId: "sc-10" }, ctx("LOBBY"));
  assert.equal(result.ok, false);
});

test("place rejects a teacher trying to build a roster", () => {
  const result = draftDayModule.reduce(empty(), { type: "place", slotId: "SCORER", playerId: "sc-10" }, ctx("PLAY", "teacher"));
  assert.equal(result.ok, false);
});

test("place rejects an unknown player id", () => {
  const result = place(empty(), "seat-1", "SCORER", "not-a-player");
  assert.equal(result.ok, false);
});

test("place rejects a position mismatch (non-wildcard slot)", () => {
  const result = place(empty(), "seat-1", "SCORER", "pm-10");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /cannot fill the SCORER slot/);
});

test("place allows any position into the WILDCARD slot", () => {
  const result = place(empty(), "seat-1", "WILDCARD", "rb-40");
  assert.equal(result.ok, true);
});

test("place rejects filling an already-occupied slot", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = place(state, "seat-1", "SCORER", "sc-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /occupied/);
});

test("place rejects the same player twice on one wall (even via wildcard)", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = place(state, "seat-1", "WILDCARD", "sc-10");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /already on your wall/);
});

test("place rejects going over the $100M cap", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60")); // 60
  state = expectOk(place(state, "seat-1", "PLAYMAKER", "pm-30")); // 90
  // signing a $20M player now would land at $110M — over the cap
  const result = place(state, "seat-1", "DEFENDER", "df-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /over the \$100M cap/);
});

test("place accepts a full roster with money left over", () => {
  let state = empty();
  for (const { slot, playerId } of CHEAP_FULL_ROSTER) {
    state = expectOk(place(state, "seat-1", slot, playerId));
  }
  const team = state.teams["seat-1"]!;
  assert.equal(spentOf(team), 60); // 10+10+10+10+20
});

test("place accepts a placement that lands exactly on the cap", () => {
  let state = empty();
  for (const { slot, playerId } of [
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-60" },
  ]) {
    state = expectOk(place(state, "seat-1", slot, playerId));
  }
  const team = state.teams["seat-1"]!;
  assert.equal(spentOf(team), 100); // 10+10+10+10+60
});

test("remove frees the slot and the budget, reversibly", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  assert.equal(spentOf(state.teams["seat-1"]!), 60);
  state = expectOk(draftDayModule.reduce(state, { type: "remove", slotId: "SCORER" }, ctx("PLAY", "seat-1")));
  assert.equal(spentOf(state.teams["seat-1"]!), 0);
  // and it can be re-placed afterward — the whole point of the reversible wall
  state = expectOk(place(state, "seat-1", "SCORER", "sc-30"));
  assert.equal(spentOf(state.teams["seat-1"]!), 30);
});

test("remove rejects an already-empty slot", () => {
  const result = draftDayModule.reduce(empty(), { type: "remove", slotId: "SCORER" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
});

test("lock rejects an incomplete roster", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = draftDayModule.reduce(state, { type: "lock" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /fill all five slots/);
});

test("lock succeeds once all five slots are filled and freezes further edits", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  assert.equal(state.teams["seat-1"]!.locked, true);
  const result = place(state, "seat-1", "SCORER", "sc-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /locked/);
});

test("capStateOf reports semantic thresholds", () => {
  assert.equal(capStateOf(0), "ok");
  assert.equal(capStateOf(59), "ok");
  assert.equal(capStateOf(60), "warning");
  assert.equal(capStateOf(79), "warning");
  assert.equal(capStateOf(80), "critical");
  assert.equal(capStateOf(99), "critical");
  assert.equal(capStateOf(100), "maxed");
});

test("studentView PLAY foregone panel lists only players priced above what's left, live", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as { foregone: { id: string }[]; remaining: number };
  assert.equal(view.remaining, 40);
  // every $60M and $50M-tier player is now out of reach (remaining is 40)
  assert.ok(view.foregone.some((p) => p.id === "pm-60"));
  assert.ok(!view.foregone.some((p) => p.id === "pm-40")); // 40 is exactly affordable
});

test("studentView never includes another seat's roster", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  state = expectOk(place(state, "seat-2", "SCORER", "sc-10"));
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as { spent: number };
  assert.equal(view.spent, 60); // seat-1's own spend only, unaffected by seat-2
});

test("weakestSlotOf picks the lowest-rated filled slot, deterministically", () => {
  const team = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-40" }, // rating 85
    { slot: "PLAYMAKER", playerId: "pm-10" }, // rating 57 — lowest
    { slot: "DEFENDER", playerId: "df-20" }, // rating 69
    { slot: "REBOUNDER", playerId: "rb-20" }, // rating 70
    { slot: "WILDCARD", playerId: "sc-10" }, // rating 59
  ]).teams["seat-1"]!;
  assert.equal(weakestSlotOf(team), "PLAYMAKER");
});

test("shock is deterministic and repeatable for the same roster shape", () => {
  const build = () =>
    buildAndLock(empty(), "seat-1", [
      { slot: "SCORER", playerId: "sc-40" },
      { slot: "PLAYMAKER", playerId: "pm-10" },
      { slot: "DEFENDER", playerId: "df-20" },
      { slot: "REBOUNDER", playerId: "rb-20" },
      { slot: "WILDCARD", playerId: "sc-10" },
    ]);
  const teamA = build().teams["seat-1"]!;
  const teamB = build().teams["seat-1"]!;
  assert.equal(weakestSlotOf(teamA), weakestSlotOf(teamB));
});

test("teacher:shock hits every locked team's own weakest slot and frees the salary", () => {
  let state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-40" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — rating 57
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]);
  const spentBefore = spentOf(state.teams["seat-1"]!);
  const result = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  const team = result.state.teams["seat-1"]!;
  assert.equal(team.shockSlot, "PLAYMAKER");
  assert.equal(team.slots.PLAYMAKER.playerId, null);
  assert.equal(team.slots.PLAYMAKER.out, true);
  assert.equal(team.slots.PLAYMAKER.removedPlayerId, "pm-10");
  assert.equal(spentOf(team), spentBefore - 10); // pm-10 cost $10M, refunded
});

test("teacher:shock only applies to locked rosters, never unlocked ones", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60")); // not locked
  const result = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.state.teams["seat-1"]!.shockSlot, null);
});

test("teacher:shock rejects a non-teacher caller and rejects outside CONSEQUENCE", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const byStudent = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "seat-1"));
  assert.equal(byStudent.ok, false);
  const wrongPhase = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("PLAY", "teacher"));
  assert.equal(wrongPhase.ok, false);
});

test("teacher:shock cannot be applied twice", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const first = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(first.ok, true);
  if (!first.ok) throw new Error("unreachable");
  const second = draftDayModule.reduce(first.state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(second.ok, false);
});

test("adaptFill repairs the shocked slot with a constrained, affordable, position-matched candidate", () => {
  let state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" }, // rating 79
    { slot: "PLAYMAKER", playerId: "pm-10" }, // rating 57 — weakest
    { slot: "DEFENDER", playerId: "df-20" }, // rating 69
    { slot: "REBOUNDER", playerId: "rb-20" }, // rating 70
    { slot: "WILDCARD", playerId: "sc-10" }, // rating 59
  ]); // spent = 30+10+20+20+10 = 90
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  state = shocked.state; // PLAYMAKER freed: spent now 80, remaining 20

  // wrong-position candidate rejected (df-10 is unused and a DEFENDER, not eligible for the PLAYMAKER slot)
  const wrongPos = draftDayModule.reduce(state, { type: "adaptFill", playerId: "df-10" }, ctx("ADAPT", "seat-1"));
  assert.equal(wrongPos.ok, false);

  const result = draftDayModule.reduce(state, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.state.teams["seat-1"]!.slots.PLAYMAKER.playerId, "pm-20");
});

test("adaptFill rejects a candidate the team can no longer afford", () => {
  let state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent = 30+10+30+20+10 = 100, remaining 0
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  state = shocked.state; // weakest is pm-10 (rating 57) freed, remaining budget = 10
  const tooExpensive = draftDayModule.reduce(state, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(tooExpensive.ok, false);
  const affordable = draftDayModule.reduce(state, { type: "adaptFill", playerId: "pm-10" }, ctx("ADAPT", "seat-1"));
  assert.equal(affordable.ok, true);
});

test("adaptFill rejects when the team wasn't hit by the shock", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const result = draftDayModule.reduce(state, { type: "adaptFill", playerId: "sc-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(result.ok, false);
});

test("adaptFill rejects outside ADAPT phase", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const result = draftDayModule.reduce(state, { type: "adaptFill", playerId: "sc-20" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
});

test("aggregate computes real class-wide numbers used by the synthesis cards", () => {
  let state = empty();
  state = buildAndLock(state, "seat-1", [
    { slot: "SCORER", playerId: "sc-60" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // star signer, spent = 60+10+10+10+10=100, has a cheap $10 fill too
  state = buildAndLock(state, "seat-2", [
    { slot: "SCORER", playerId: "sc-20" },
    { slot: "PLAYMAKER", playerId: "pm-20" },
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // balanced (no player over $30M), spent = 20*4+10=90

  const agg = draftDayModule.aggregate(state, "REVEAL") as {
    lockedTeams: number;
    spentToCapCount: number;
    starSignerCount: number;
    starSignerCheapFillCount: number;
    balancedCount: number;
  };
  assert.equal(agg.lockedTeams, 2);
  assert.equal(agg.starSignerCount, 1);
  assert.equal(agg.starSignerCheapFillCount, 1);
  assert.equal(agg.balancedCount, 1);
});

test("boardView never includes a seatId or any per-team identifying key", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const view = draftDayModule.boardView(state, "REVEAL");
  const serialized = JSON.stringify(view);
  assert.ok(!serialized.includes("seat-1"), "boardView must not leak seat identity");
});

test("boardView renders distinct modes across the full phase list", () => {
  const state = empty();
  for (const phase of draftDayModule.phases) {
    const view = draftDayModule.boardView(state, phase) as { mode: string };
    assert.ok(view.mode && view.mode.length > 0, `boardView(${phase}) should declare a mode`);
  }
});

test("synthesis cards degrade gracefully with zero locked rosters (no fake data)", () => {
  const view = draftDayModule.boardView(empty(), "SYNTHESIS") as { cards: { id: string; body: string }[] };
  assert.equal(view.cards.length, 1);
  assert.match(view.cards[0]!.body, /No rosters locked/);
});

test("synthesis cards cite real session numbers once rosters are locked", () => {
  let state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-60" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]);
  const view = draftDayModule.boardView(state, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const scarcity = view.cards.find((c) => c.id === "scarcity")!;
  assert.match(scarcity.body, /1 team/);
  const oppCost = view.cards.find((c) => c.id === "opportunity-cost")!;
  assert.match(oppCost.body, /1 of 1 teams signed a \$60M star/);
});
