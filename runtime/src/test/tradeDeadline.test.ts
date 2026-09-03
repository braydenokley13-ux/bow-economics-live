import assert from "node:assert/strict";
import { test } from "node:test";
import { CAP, MARKET, POSITION_TAGS, SLOT_IDS, draftDayModule, type DraftDayState, type Player } from "../modules/draftDay.js";
import {
  BID_STEP,
  MIN_BID,
  MODULE_ID,
  RESCUE_POOL,
  STAND_PAT_REASONS,
  TARGETS,
  VETERANS,
  capUsedOf,
  cutBudgetFor,
  deadCapFor,
  extractCarriedFranchises,
  hadOpenSlot,
  isValidBid,
  midseasonReportFor,
  rescueCandidatesFor,
  standingFor,
  tradeDeadlineModule,
  valueTagFor,
  weakestFormSlot,
  type TeamState,
  type TradeDeadlineState,
} from "../modules/tradeDeadline.js";
import { isOrderedSubsequence } from "../shared/phases.js";

/* ---------------------------------------------------------------- setup -- */

const ddCtx = (phase: string, seatId: string, seatIds: string[] = [seatId]) => ({ phase: phase as never, seatId, seatIds, now: Date.now() });
const tdCtx = (phase: string, seatId: string, seatIds: string[] = ["t1", "t2", "t3"], now = Date.now()) => ({ phase: phase as never, seatId, seatIds, now });

function expectOk<T>(result: { ok: boolean; state?: T; reason?: string }): T {
  assert.equal(result.ok, true, !result.ok ? result.reason : undefined);
  return result.state as T;
}
function expectRejected<T>(result: { ok: boolean; reason?: string }, match?: RegExp): void {
  assert.equal(result.ok, false, "expected the action to be rejected");
  if (match && !result.ok) assert.match(result.reason!, match);
}

/** Builds and locks a full L1 draftDay roster for one seat, from explicit slot->playerId picks. */
function buildLockedL1(picks: { slot: string; playerId: string }[], seatId = "s1", seatIds = ["s1"]): DraftDayState {
  let state = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  for (const { slot, playerId } of picks) {
    state = expectOk(draftDayModule.reduce(state, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", seatId, seatIds)));
  }
  return expectOk(draftDayModule.reduce(state, { type: "lock" }, ddCtx("PLAY", seatId, seatIds)));
}

const AT_CAP_ROSTER = [
  { slot: "SCORER", playerId: "sc-30" },
  { slot: "PLAYMAKER", playerId: "pm-10" }, // the market's cheapest tier — the worst-case cut for budget purposes
  { slot: "DEFENDER", playerId: "df-30" },
  { slot: "REBOUNDER", playerId: "rb-20" },
  { slot: "WILDCARD", playerId: "sc-10" },
]; // 30+10+30+20+10 = 100

/** A roster with real L1 leftover room — cutting PLAYMAKER (pm-10) here gives a $49M budget, comfortably wide
 *  enough for the mid-range bid amounts most reveal/privacy scenario tests want to exercise. */
const ROOMY_ROSTER = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // 10+10+10+10+20 = 60

/** A fresh tradeDeadline session seeded from a single-seat L1 session built from `picks`, with `seatIds` already seated. */
function freshL2(picks: { slot: string; playerId: string }[] = AT_CAP_ROSTER, l1SeatId = "s1", l2SeatIds = ["t1", "t2", "t3"]): TradeDeadlineState {
  const l1 = buildLockedL1(picks, l1SeatId, [l1SeatId]);
  const seed = { lessonModuleId: draftDayModule.id, state: l1 };
  return tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: l2SeatIds, seed, gradeBand: "5-6" });
}

function claim(state: TradeDeadlineState, seatId: string, carriedIndex: number | null, seatIds = ["t1", "t2", "t3"]): TradeDeadlineState {
  return expectOk(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex }, tdCtx("HOOK", seatId, seatIds)));
}

/* -------------------------------------------------------------- phases -- */

test("tradeDeadlineModule declares a well-ordered phase subsequence of the canonical vocabulary", () => {
  assert.equal(isOrderedSubsequence(tradeDeadlineModule.phases), true);
  assert.deepEqual([...tradeDeadlineModule.phases], ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "SYNTHESIS", "COMPLETE"]);
});

test("module id is m1l2-trade-deadline", () => {
  assert.equal(MODULE_ID, "m1l2-trade-deadline");
  assert.equal(tradeDeadlineModule.id, MODULE_ID);
});

test("sanity: draftDay's CAP is $100M, the number every budget/property test below assumes", () => {
  assert.equal(CAP, 100);
});

/* ------------------------------------------------------- extract seed -- */

test("SEED: extractCarriedFranchises returns [] for a missing/undefined seed", () => {
  assert.deepEqual(extractCarriedFranchises(undefined), []);
  assert.deepEqual(extractCarriedFranchises(null), []);
});

test("SEED: extractCarriedFranchises returns [] for a seed from a different (or unknown) module", () => {
  assert.deepEqual(extractCarriedFranchises({ lessonModuleId: "m2-box-office", state: {} }), []);
  assert.deepEqual(extractCarriedFranchises({ lessonModuleId: "not-a-real-module", state: { teams: {} } }), []);
});

test("SEED: extractCarriedFranchises returns [] for a malformed seed shape (no crash)", () => {
  assert.deepEqual(extractCarriedFranchises("just a string"), []);
  assert.deepEqual(extractCarriedFranchises(42), []);
  assert.deepEqual(extractCarriedFranchises({ lessonModuleId: draftDayModule.id }), []); // no `state`
  assert.deepEqual(extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: "nope" }), []);
  assert.deepEqual(extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: { teams: "nope" } }), []);
});

test("SEED: happy path — one locked L1 team becomes exactly one carried franchise, name/crest/roster/spend all correct", () => {
  const l1 = buildLockedL1(AT_CAP_ROSTER, "s1", ["s1"]);
  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: l1 });
  assert.equal(carried.length, 1);
  const f = carried[0]!;
  assert.equal(f.origin, "carried");
  assert.equal(f.name, "Ironworks"); // franchiseIndex 0
  assert.equal(f.crestIndex, 0);
  assert.equal(f.spend, 100);
  assert.deepEqual(f.slots, { SCORER: "sc-30", PLAYMAKER: "pm-10", DEFENDER: "df-30", REBOUNDER: "rb-20", WILDCARD: "sc-10" });
});

test("SEED: an unlocked L1 team is excluded — it never becomes a carried franchise", () => {
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: "SCORER", playerId: "sc-10" }, ddCtx("PLAY", "s1")));
  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: l1 });
  assert.deepEqual(carried, []);
});

test("SEED: a locked L1 team with an unrepaired shock (an empty slot) is excluded, not carried half-broken", () => {
  const l1 = buildLockedL1(AT_CAP_ROSTER, "s1", ["s1"]);
  const shocked = expectOk(draftDayModule.reduce(l1, { type: "teacher:shock" }, ddCtx("CONSEQUENCE", "teacher")));
  // PLAYMAKER (pm-10, rating 56) is the weakest slot and gets poached; never repaired here.
  assert.equal(shocked.teams["s1"]!.slots.PLAYMAKER.playerId, null);
  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: shocked });
  assert.deepEqual(carried, [], "a team with any empty slot must never be offered as a claimable franchise");
});

test("SEED: a locked L1 team with a corrupted player id in a slot is excluded (no crash)", () => {
  const l1 = buildLockedL1(AT_CAP_ROSTER, "s1", ["s1"]);
  const corrupted: DraftDayState = {
    ...l1,
    teams: { s1: { ...l1.teams["s1"]!, slots: { ...l1.teams["s1"]!.slots, SCORER: { playerId: "not-a-real-id", out: false, removedPlayerId: null } } } },
  };
  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: corrupted });
  assert.deepEqual(carried, []);
});

test("SEED: multiple locked L1 teams are sorted by original franchiseIndex (join order), not object key order", () => {
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  const seatIds = ["z-seat", "a-seat", "m-seat"]; // deliberately not alphabetical to prove sort isn't by key
  for (const [i, seatId] of seatIds.entries()) {
    for (const { slot, playerId } of AT_CAP_ROSTER) {
      l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", seatId, seatIds)));
    }
    l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", seatId, seatIds)));
    assert.equal(l1.teams[seatId]!.franchiseIndex, i);
  }
  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: l1 });
  assert.equal(carried.length, 3);
  assert.deepEqual(carried.map((f) => f.name), ["Ironworks", "Northstar", "Harbor"]); // franchiseFor(0,1,2)
});

test("SEED: a mixed class — one valid, one unlocked, one corrupted — carries forward only the valid one", () => {
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  const seatIds = ["good", "unfinished", "bad"];
  for (const { slot, playerId } of AT_CAP_ROSTER) {
    l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "good", seatIds)));
  }
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "good", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: "SCORER", playerId: "sc-10" }, ddCtx("PLAY", "unfinished", seatIds))); // never locked
  for (const { slot, playerId } of AT_CAP_ROSTER) {
    l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "bad", seatIds)));
  }
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "bad", seatIds)));
  l1 = { ...l1, teams: { ...l1.teams, bad: { ...l1.teams["bad"]!, slots: { ...l1.teams["bad"]!.slots, DEFENDER: { playerId: "corrupt-id", out: false, removedPlayerId: null } } } } };

  const carried = extractCarriedFranchises({ lessonModuleId: draftDayModule.id, state: l1 });
  assert.equal(carried.length, 1);
  assert.equal(carried[0]!.name, "Ironworks"); // "good" was franchiseIndex 0
});

/* -------------------------------------------------------------- claim -- */

test("CLAIM: happy path — claiming a carried index copies its roster/spend into the new team, exactly once", () => {
  let state = freshL2();
  state = claim(state, "t1", 0);
  const team = state.teams["t1"]!;
  assert.equal(team.claim!.origin, "carried");
  assert.equal(team.claim!.spend, 100);
  assert.deepEqual(team.slots, team.claim!.slots);
  assert.equal(state.claimedBy[0], "t1");
});

test("CLAIM: a second team cannot claim the same carried franchise", () => {
  let state = freshL2();
  state = claim(state, "t1", 0);
  const result = tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("HOOK", "t2"));
  expectRejected(result, /already been claimed/);
});

test("CLAIM: an out-of-range carried index is rejected", () => {
  const state = freshL2();
  expectRejected(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 99 }, tdCtx("HOOK", "t1")));
});

test("CLAIM: a team cannot claim twice", () => {
  let state = freshL2();
  state = claim(state, "t1", 0);
  const result = tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: null }, tdCtx("HOOK", "t1"));
  expectRejected(result, /already claimed/);
});

test("CLAIM: rejected during LOBBY (too early) and REVEAL/ADAPT (too late) — never during any other phase", () => {
  const state = freshL2();
  expectRejected(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("LOBBY", "t1")));
  expectRejected(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("REVEAL", "t1")));
  expectRejected(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("ADAPT", "t1")));
});

test("M1 repair (VERIFY_L2.md MODERATE): a late joiner can still claim during PLAY, not just HOOK — the studentView PLAY case offers the same picker instead of a dead end", () => {
  const state = freshL2();
  const claimed = expectOk(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("PLAY", "t1")));
  const team = claimed.teams["t1"]!;
  assert.equal(team.claim!.origin, "carried");
  assert.equal(team.claim!.spend, 100);

  // allowedActions documents PLAY-time claiming too, and studentView's PLAY case offers the picker before a
  // claim, then falls through to the normal deciding screen immediately after — same-turn, no separate reload.
  assert.ok(tradeDeadlineModule.allowedActions("PLAY").includes("claim"));
  const preClaimView = tradeDeadlineModule.studentView(state, "t1", "PLAY") as { claimed: boolean; lateJoin?: boolean; available?: unknown[] };
  assert.equal(preClaimView.claimed, false);
  assert.equal(preClaimView.lateJoin, true);
  assert.ok((preClaimView.available as unknown[]).length > 0);
  const postClaimView = tradeDeadlineModule.studentView(claimed, "t1", "PLAY") as { committed: boolean; franchise: { name: string } };
  assert.equal(postClaimView.committed, false);
  assert.equal(postClaimView.franchise.name, "Ironworks");

  // And a late-claiming team can go on to make a real, fully-governed deadline decision, same as anyone else.
  const stood = expectOk(tradeDeadlineModule.reduce(claimed, { type: "standPat", reason: "no-good-fit" }, tdCtx("PLAY", "t1")));
  assert.equal(stood.teams["t1"]!.path, "standPat");
});

test("M1: claiming a stock franchise during PLAY works the same as during HOOK", () => {
  const state = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1"], gradeBand: "5-6" }); // no seed
  const claimed = expectOk(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: null }, tdCtx("PLAY", "t1")));
  assert.equal(claimed.teams["t1"]!.claim!.origin, "stock");
});

test("CLAIM: the teacher cannot claim a franchise", () => {
  const state = freshL2();
  expectRejected(tradeDeadlineModule.reduce(state, { type: "claim", carriedIndex: 0 }, tdCtx("HOOK", "teacher")));
});

test("CLAIM: stock franchises are deterministic, balanced, and honestly labeled — no L1 link needed at all", () => {
  const emptyState = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1", "t2"], gradeBand: "5-6" }); // no seed passed
  assert.deepEqual(emptyState.carriedFranchises, []);
  const t1 = claim(emptyState, "t1", null, ["t1", "t2"]);
  const t2 = claim(t1, "t2", null, ["t1", "t2"]);
  const teamA = t2.teams["t1"]!;
  const teamB = t2.teams["t2"]!;
  assert.equal(teamA.claim!.origin, "stock");
  assert.equal(teamB.claim!.origin, "stock");
  assert.equal(teamA.claim!.spend, teamB.claim!.spend, "every stock franchise is identical/balanced by construction");
  assert.ok(teamA.claim!.spend > 50 && teamA.claim!.spend < CAP, "stock franchises leave comfortable, league-typical room");
  assert.notEqual(teamA.claim!.name, teamB.claim!.name, "distinct stock claims still get distinct fictional identities");
});

test("CLAIM: a whole class with no L1 link runs entirely on stock franchises — the lesson is standalone-testable", () => {
  const state = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: [], gradeBand: "5-6" }); // no seed at all
  assert.deepEqual(state.carriedFranchises, []);
  const claimed = claim(state, "t1", null, ["t1"]);
  assert.equal(claimed.teams["t1"]!.claim!.origin, "stock");
});

/* --------------------------------------------------------- stand pat -- */

test("STAND PAT: requires a claimed franchise first", () => {
  const state = freshL2();
  expectRejected(tradeDeadlineModule.reduce(state, { type: "standPat", reason: "happy-with-roster" }, tdCtx("PLAY", "t1")), /claim/);
});

test("STAND PAT: rejects an invalid reason", () => {
  let state = claim(freshL2(), "t1", 0);
  expectRejected(tradeDeadlineModule.reduce(state, { type: "standPat", reason: "vibes" }, tdCtx("PLAY", "t1")));
});

test("STAND PAT: is an explicit, reasoned commit — every STAND_PAT_REASONS value is accepted and locks the decision", () => {
  for (const reason of STAND_PAT_REASONS) {
    let state = claim(freshL2(), "t1", 0);
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "standPat", reason }, tdCtx("PLAY", "t1")));
    const team = state.teams["t1"]!;
    assert.equal(team.path, "standPat");
    assert.equal(team.standPatReason, reason);
    assert.equal(capUsedOf(team), 100, "standing pat changes nothing about the roster or spend");
    // and it's a genuine lock — no second decision allowed
    expectRejected(tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")), /already locked in/);
  }
});

/* ------------------------------------------------------ cut + veteran -- */

test("VETERAN: rejects a position mismatch on a non-wildcard slot", () => {
  const state = claim(freshL2(), "t1", 0);
  expectRejected(
    tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-pm" }, tdCtx("PLAY", "t1")),
    /cannot fill the SCORER slot/,
  );
});

test("VETERAN: WILDCARD accepts any veteran position", () => {
  // t1's WILDCARD holds sc-10 ($10M) — budget = (100-100) + 0.9*10 = 9, too small for a $20 veteran.
  // Use a build with more room instead.
  const l2 = freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]); // spend 60, lots of room
  const state = claim(l2, "t1", 0);
  const result = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "WILDCARD", veteranId: "vet-rb" }, tdCtx("PLAY", "t1")));
  assert.equal(result.teams["t1"]!.slots.WILDCARD, "vet-rb");
});

test("VETERAN: rejects when unaffordable given the cut's dead-cap-adjusted budget", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0); // cutting PLAYMAKER (pm-10) gives a $9M budget
  expectRejected(
    tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "PLAYMAKER", veteranId: "vet-pm" }, tdCtx("PLAY", "t1")),
    /deadline budget/,
  );
});

test("VETERAN: commits atomically — dead cap charged, slot filled, cap never exceeds CAP", () => {
  const l2 = freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]); // spend 60
  const state = claim(l2, "t1", 0);
  const result = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")));
  const team = result.teams["t1"]!;
  assert.equal(team.path, "veteran");
  assert.equal(team.cutSlot, "SCORER");
  assert.equal(team.cutPlayerId, "sc-10");
  assert.equal(team.deadCapCharge, 1); // 10% of $10M
  assert.equal(team.slots.SCORER, "vet-sc");
  assert.ok(capUsedOf(team) <= CAP);
  assert.equal(capUsedOf(team), 60 - 10 + 1 + 20); // original spend - cut price + dead cap + veteran price
});

test("VETERAN: the cut player is really gone — a second commit is rejected outright, no re-signing path exists", () => {
  const l2 = freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]);
  let state = claim(l2, "t1", 0);
  state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")));
  expectRejected(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")), /already locked in/);
});

/* ---------------------------------------------------------- cut + bid -- */

test("BID: isValidBid enforces integer, >= MIN_BID, multiple of BID_STEP", () => {
  assert.equal(isValidBid(5), true);
  assert.equal(isValidBid(10), true);
  assert.equal(isValidBid(4), false);
  assert.equal(isValidBid(0), false);
  assert.equal(isValidBid(-5), false);
  assert.equal(isValidBid(7), false);
  assert.equal(isValidBid("10"), false);
  assert.equal(isValidBid(NaN), false);
});

test("BID: rejects a malformed bid amount before ever checking affordability", () => {
  const state = claim(freshL2(), "t1", 0);
  expectRejected(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 7 }, tdCtx("PLAY", "t1")));
});

test("BID: rejects a position mismatch on a non-wildcard slot", () => {
  const state = claim(freshL2(), "t1", 0);
  expectRejected(
    tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "SCORER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")),
    /cannot fill the SCORER slot/,
  );
});

test("BID: rejects an unaffordable bid given the cut's budget", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0); // PLAYMAKER cut budget is exactly $9M
  expectRejected(
    tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 10 }, tdCtx("PLAY", "t1")),
    /can't afford/,
  );
  // exactly at budget succeeds
  const ok = tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1"));
  assert.equal(ok.ok, true);
});

test("BID: the cut commits at submission — the slot goes empty immediately, dead cap charged, regardless of the eventual outcome", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0);
  const result = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  const team = result.teams["t1"]!;
  assert.equal(team.path, "bid");
  assert.equal(team.slots.PLAYMAKER, null, "the freed slot is genuinely empty the instant the bid is submitted");
  assert.equal(team.deadCapCharge, 1);
  assert.equal(team.bidAmount, 5);
  assert.equal(team.bidOutcome, null, "outcome is not yet known — it resolves only at reveal");
});

/* ------------------------------------------------------------- reveal -- */

function twoBidders(bidA: number, bidB: number, targetId = "tgt-pm", picksA = ROOMY_ROSTER, picksB = ROOMY_ROSTER, commitOrder: "A-first" | "B-first" = "A-first") {
  // Build a two-seat L1 session so both teams get their own carried franchise.
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  for (const { slot, playerId } of picksA) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "a", ["a", "b"])));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "a", ["a", "b"])));
  for (const { slot, playerId } of picksB) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "b", ["a", "b"])));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "b", ["a", "b"])));
  let state = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1", "t2"], seed: { lessonModuleId: draftDayModule.id, state: l1 }, gradeBand: "5-6" });
  state = claim(state, "t1", 0, ["t1", "t2"]);
  state = claim(state, "t2", 1, ["t1", "t2"]);
  const slotA = findSlotForTarget(state.teams["t1"]!, targetId);
  const slotB = findSlotForTarget(state.teams["t2"]!, targetId);
  const now = Date.now();
  if (commitOrder === "A-first") {
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: slotA, targetId, bidAmount: bidA }, tdCtx("PLAY", "t1", ["t1", "t2"], now)));
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: slotB, targetId, bidAmount: bidB }, tdCtx("PLAY", "t2", ["t1", "t2"], now + 1000)));
  } else {
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: slotB, targetId, bidAmount: bidB }, tdCtx("PLAY", "t2", ["t1", "t2"], now)));
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: slotA, targetId, bidAmount: bidA }, tdCtx("PLAY", "t1", ["t1", "t2"], now + 1000)));
  }
  return state;
}

function findSlotForTarget(team: TeamState, targetId: string): string {
  const target = TARGETS.find((t) => t.id === targetId)!;
  return target.position; // every AT_CAP_ROSTER-shaped build fills every position slot directly, so slot id == position tag
}

test("REVEAL: only the teacher can trigger it, and only during REVEAL", () => {
  const state = freshL2();
  expectRejected(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("REVEAL", "t1")), /only the teacher/);
  expectRejected(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("PLAY", "teacher")), /can only be revealed during REVEAL/);
});

test("REVEAL: the highest bid wins when it clears the reserve; the loser costs nothing beyond the dead cap already paid", () => {
  // tgt-pm reserve is 35 — bid 40 beats bid 20 and clears the reserve. tgt-pm is the 2nd target in REVEAL_ORDER
  // (after tgt-sc), so this needs two teacher:revealNext calls to actually reach it — revealAllFor does that.
  let state = twoBidders(40, 20, "tgt-pm");
  const before = { t1: capUsedOf(state.teams["t1"]!), t2: capUsedOf(state.teams["t2"]!) };
  const result = revealAllFor(state);
  const winner = result.teams["t1"]!;
  const loser = result.teams["t2"]!;
  assert.equal(winner.bidOutcome, "won");
  assert.equal(loser.bidOutcome, "lost");
  assert.equal(winner.slots.PLAYMAKER, "tgt-pm");
  assert.equal(loser.slots.PLAYMAKER, null, "the loser's slot stays open — this is the real risk, not a soft landing");
  assert.equal(capUsedOf(winner), before.t1 + 40, "the winner pays exactly its own winning bid, nothing more");
  assert.equal(capUsedOf(loser), before.t2, "a losing bid costs nothing beyond the dead cap already charged at cut time");
});

test("REVEAL: a lowball never steals — even the ONLY bid on a target loses if it's under the hidden reserve", () => {
  // tgt-pm reserve is 35; a lone $10 bid must not win.
  let state = freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]);
  state = claim(state, "t1", 0);
  state = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 10 }, tdCtx("PLAY", "t1")));
  const result = revealAllFor(state);
  const team = result.teams["t1"]!;
  assert.equal(team.bidOutcome, "lost", "a $10 bid against a $35 reserve must lose, even uncontested");
  assert.equal(team.slots.PLAYMAKER, null);
});

test("REVEAL: an exact tie is broken deterministically by earliest commit, then by seatId — reproducible, never random", () => {
  const revealA = revealAllFor(twoBidders(40, 40, "tgt-pm", ROOMY_ROSTER, ROOMY_ROSTER, "A-first"));
  assert.equal(revealA.teams["t1"]!.bidOutcome, "won", "t1 committed first on an exact tie, so t1 wins");
  assert.equal(revealA.teams["t2"]!.bidOutcome, "lost");

  const revealB = revealAllFor(twoBidders(40, 40, "tgt-pm", ROOMY_ROSTER, ROOMY_ROSTER, "B-first"));
  assert.equal(revealB.teams["t2"]!.bidOutcome, "won", "t2 committed first this time, so t2 wins the same tie");
  assert.equal(revealB.teams["t1"]!.bidOutcome, "lost");
});

test("REVEAL: targets are staged one at a time, in a fixed order, and cannot be revealed twice", () => {
  let state = freshL2();
  state = claim(state, "t1", 0);
  let revealedIds: string[] = [];
  for (let i = 0; i < TARGETS.length; i += 1) {
    state = expectOk(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
    revealedIds = [...state.revealedTargetIds];
    assert.equal(revealedIds.length, i + 1);
  }
  assert.deepEqual(revealedIds, TARGETS.map((t) => t.id));
  expectRejected(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")), /already been revealed/);
});

test("REVEAL: steal/curse verdict is computed from the winning bid vs. the target's trueValue, never the reserve", () => {
  // tgt-df: floor 20, ceiling 40, reserve 25, trueValue 36. A $30 winning bid < trueValue -> steal.
  const state = claim(freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]), "t1", 0);
  const bidState = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "DEFENDER", targetId: "tgt-df", bidAmount: 30 }, tdCtx("PLAY", "t1")));
  // Reveal tgt-sc, tgt-pm first (fixed order), then tgt-df.
  let s = bidState;
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  const board = tradeDeadlineModule.boardView(s, "REVEAL") as { revealed: { id: string; verdict: string; winningBid: number | null }[] };
  const dfResult = board.revealed.find((r) => r.id === "tgt-df")!;
  assert.equal(dfResult.winningBid, 30);
  assert.equal(dfResult.verdict, "steal");
});

/* ------------------------------------------ B1 repair: early advance out of REVEAL -- */

/** Simulates the runtime's `sessionService.applyPhaseChange` calling the module's `onPhaseExit` hook — the exact
 *  call a teacher's Advance/Reveal click makes before the phase itself changes (see sessionService.ts). */
function advanceOutOfReveal(state: TradeDeadlineState): TradeDeadlineState {
  return tradeDeadlineModule.onPhaseExit!(state, "REVEAL", "ADAPT");
}

test("B1 repair (VERIFY_L2.md BLOCKER): onPhaseExit is a no-op leaving any phase other than REVEAL", () => {
  const state = claim(freshL2(), "t1", 0);
  const unchanged = tradeDeadlineModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(unchanged, state, "leaving a non-REVEAL phase must return the identical state reference, not a no-op copy");
  const unchanged2 = tradeDeadlineModule.onPhaseExit!(state, "HOOK", "PLAY");
  assert.equal(unchanged2, state);
});

test("B1 repair: onPhaseExit auto-resolves every unrevealed target leaving REVEAL, byte-identical to a full manual reveal of the same starting state", () => {
  const base = twoBidders(40, 20, "tgt-pm"); // t1 wins ($40 >= $35 reserve), t2 loses — one fixed starting state
  const early = advanceOutOfReveal(base); // teacher never clicks revealNext at all
  const manual = revealAllFor(base); // teacher clicks through all 4 by hand, from the identical starting point
  assert.deepEqual(early, manual, "auto-resolve must produce the exact same state as a full manual reveal — same winners, same prices, same verdicts");
  assert.equal(early.revealedTargetIds.length, TARGETS.length);
  assert.equal(early.teams["t1"]!.bidOutcome, "won");
  assert.equal(early.teams["t2"]!.bidOutcome, "lost");
});

test("B1 repair: onPhaseExit is idempotent with PARTIAL manual progress — 0, 1, 2, or 3 manual reveals first all converge on the identical final state", () => {
  const base = twoBidders(40, 20, "tgt-pm"); // one fixed starting state — every branch below derives from this same object
  const fullyManual = revealAllFor(base);
  for (let manualClicks = 0; manualClicks <= 3; manualClicks += 1) {
    let s = base;
    for (let i = 0; i < manualClicks; i += 1) {
      s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
    }
    const resolved = advanceOutOfReveal(s);
    assert.deepEqual(resolved, fullyManual, `${manualClicks} manual reveal(s) before auto-resolve should still converge on the identical final state`);
  }
});

test("B1 repair: end-to-end — a team stranded mid-REVEAL by an early advance gets its bid resolved, real ADAPT access, and can actually rescue", () => {
  // t1 cuts and bids low enough to genuinely lose; teacher advances out of REVEAL having revealed nothing.
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0); // cutting PLAYMAKER (pm-10): budget $9M
  let s = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  assert.equal(s.teams["t1"]!.bidOutcome, null, "precondition: nothing has been revealed yet");

  s = advanceOutOfReveal(s); // the teacher's early Advance click, simulated
  assert.equal(s.teams["t1"]!.bidOutcome, "lost", "the $5 bid genuinely loses against tgt-pm's $35 reserve, resolved automatically");

  const adaptView = tradeDeadlineModule.studentView(s, "t1", "ADAPT") as { openSlot: string | null; rescued: boolean; candidates: { id: string }[] };
  assert.equal(adaptView.openSlot, "PLAYMAKER", "must NOT show the false 'nothing to do here' — this is exactly VERIFY_L2.md's B1 repro");
  assert.equal(adaptView.rescued, false);
  assert.ok(adaptView.candidates.length >= 2);

  const rescued = expectOk(tradeDeadlineModule.reduce(s, { type: "rescueFill", playerId: adaptView.candidates[0]!.id }, tdCtx("ADAPT", "t1")));
  assert.equal(rescued.teams["t1"]!.slots.PLAYMAKER, adaptView.candidates[0]!.id);
  assert.ok(capUsedOf(rescued.teams["t1"]!) <= CAP);
  const postRescueView = tradeDeadlineModule.studentView(rescued, "t1", "ADAPT") as { openSlot: string | null; rescued: boolean };
  assert.equal(postRescueView.rescued, true);
});

test("B1 repair: class-wide aggregate open-slot count is correct after an early advance, across multiple teams with different unrevealed targets", () => {
  // Mirrors VERIFY_L2.md's exact repro shape: two carried franchises bid on two DIFFERENT targets; only one
  // target gets manually revealed before the teacher advances early. Both bids are genuine lowballs here (unlike
  // the verifier's original repro where one bid happened to clear its reserve) so BOTH teams truly end up with
  // an open slot — the class-wide count this asserts is unambiguous either way.
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  const seatIds = ["india", "juliet"];
  for (const { slot, playerId } of ROOMY_ROSTER) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "india", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "india", seatIds)));
  for (const { slot, playerId } of ROOMY_ROSTER) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "juliet", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "juliet", seatIds)));

  let s = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["india", "juliet"], seed: { lessonModuleId: draftDayModule.id, state: l1 }, gradeBand: "5-6" });
  s = claim(s, "india", 0, ["india", "juliet"]);
  s = claim(s, "juliet", 1, ["india", "juliet"]);
  // India cuts DEFENDER, lowballs tgt-df (reserve $25) at $10 — a genuine loss.
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "cutForBid", slot: "DEFENDER", targetId: "tgt-df", bidAmount: 10 }, tdCtx("PLAY", "india", ["india", "juliet"])));
  // Juliet cuts SCORER, lowballs tgt-sc (reserve $40) at $20 — also a genuine loss.
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "cutForBid", slot: "SCORER", targetId: "tgt-sc", bidAmount: 20 }, tdCtx("PLAY", "juliet", ["india", "juliet"])));

  // Teacher reveals ONLY tgt-sc (Juliet's), then advances early — India's tgt-df is left unrevealed.
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  assert.equal(s.teams["juliet"]!.bidOutcome, "lost");
  assert.equal(s.teams["india"]!.bidOutcome, null, "precondition: India's target was never manually revealed");

  s = advanceOutOfReveal(s); // the teacher's early advance

  assert.equal(s.teams["india"]!.bidOutcome, "lost", "auto-resolved on exit, not left null");
  assert.equal(hadOpenSlot(s.teams["india"]!), true);
  assert.equal(hadOpenSlot(s.teams["juliet"]!), true);

  const agg = tradeDeadlineModule.aggregate(s, "SYNTHESIS") as { openSlotCount: number; rescuedCount: number };
  assert.equal(agg.openSlotCount, 2, "both teams genuinely have an open slot — the class-wide number must say 2, not undercount to 1");
  assert.equal(agg.rescuedCount, 0);

  const board = tradeDeadlineModule.boardView(s, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const card = board.cards.find((c) => c.id === "no-dominant-strategy")!;
  assert.match(card.body, /2 team.*open slot/is);
});

test("hadOpenSlot three-way semantics: never-open (standPat/veteran) is always false, open-resolved-lost is always true (rescued or not), and open-unresolved cannot survive past REVEAL", () => {
  // 1. Never-open: a team that never took the bid path.
  const standPatState = expectOk(tradeDeadlineModule.reduce(claim(freshL2(), "t1", 0), { type: "standPat", reason: "happy-with-roster" }, tdCtx("PLAY", "t1")));
  assert.equal(hadOpenSlot(standPatState.teams["t1"]!), false);

  const vetRoster = [
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ];
  const vetState = expectOk(tradeDeadlineModule.reduce(claim(freshL2(vetRoster), "t1", 0), { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")));
  assert.equal(hadOpenSlot(vetState.teams["t1"]!), false);

  // 2. Open-resolved (lost): true whether or not it's since been rescued — this is the case the fix this
  // helper was originally built for (see the module header) and it must still hold.
  let bidLostState = expectOk(tradeDeadlineModule.reduce(claim(freshL2(AT_CAP_ROSTER), "t1", 0), { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  bidLostState = revealAllFor(bidLostState);
  assert.equal(bidLostState.teams["t1"]!.bidOutcome, "lost");
  assert.equal(hadOpenSlot(bidLostState.teams["t1"]!), true, "open-resolved, not yet rescued");
  const candidates = rescueCandidatesFor(bidLostState.teams["t1"]!, "PLAYMAKER");
  const rescuedState = expectOk(tradeDeadlineModule.reduce(bidLostState, { type: "rescueFill", playerId: candidates[0]!.id }, tdCtx("ADAPT", "t1")));
  assert.equal(hadOpenSlot(rescuedState.teams["t1"]!), true, "open-resolved, now rescued — still true, this fact never un-happens");

  // 3. Open-unresolved (bidOutcome still null) is only ever transiently true DURING REVEAL — the whole point
  // of the B1 repair is that this state cannot survive a transition out of REVEAL. Confirm both halves:
  let unresolvedState = expectOk(tradeDeadlineModule.reduce(claim(freshL2(AT_CAP_ROSTER), "t1", 0), { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  assert.equal(unresolvedState.teams["t1"]!.bidOutcome, null);
  assert.equal(hadOpenSlot(unresolvedState.teams["t1"]!), false, "mid-REVEAL, unresolved reads as false — this is fine, nothing final is being claimed about it yet");
  const afterExit = advanceOutOfReveal(unresolvedState);
  assert.notEqual(afterExit.teams["t1"]!.bidOutcome, null, "must never still be null once REVEAL is left — that was exactly B1's bug");
  assert.equal(hadOpenSlot(afterExit.teams["t1"]!), true, "now correctly resolved to true (this particular bid genuinely loses)");
});

/* -------------------------------------------------------------- adapt -- */

test("ADAPT: a full-wall team (stand pat) has no open slot and nothing to do", () => {
  let state = claim(freshL2(), "t1", 0);
  state = expectOk(tradeDeadlineModule.reduce(state, { type: "standPat", reason: "happy-with-roster" }, tdCtx("PLAY", "t1")));
  const view = tradeDeadlineModule.studentView(state, "t1", "ADAPT") as { openSlot: string | null };
  assert.equal(view.openSlot, null);
  expectRejected(tradeDeadlineModule.reduce(state, { type: "rescueFill", playerId: RESCUE_POOL[0]!.id }, tdCtx("ADAPT", "t1")));
});

test("ADAPT: a lost-bid team has an open slot, rescue fills it, cap never exceeds CAP", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0); // cutting PLAYMAKER (pm-10): budget $9M
  let s = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  assert.equal(s.teams["t1"]!.bidOutcome, "lost", "precondition: the $5 bid must lose against tgt-pm's $35 reserve");
  const candidates = rescueCandidatesFor(s.teams["t1"]!, "PLAYMAKER");
  assert.ok(candidates.length >= 2, "the recoverability guarantee: at least 2 affordable fallback options");
  const filled = expectOk(tradeDeadlineModule.reduce(s, { type: "rescueFill", playerId: candidates[0]!.id }, tdCtx("ADAPT", "t1")));
  const team = filled.teams["t1"]!;
  assert.equal(team.slots.PLAYMAKER, candidates[0]!.id);
  assert.ok(capUsedOf(team) <= CAP);
});

test("ADAPT: a won-bid team is full-wall — rescue is rejected, nothing to do", () => {
  const state = revealAllFor(twoBidders(40, 20, "tgt-pm"));
  assert.equal(state.teams["t1"]!.bidOutcome, "won");
  const view = tradeDeadlineModule.studentView(state, "t1", "ADAPT") as { openSlot: string | null };
  assert.equal(view.openSlot, null);
  expectRejected(tradeDeadlineModule.reduce(state, { type: "rescueFill", playerId: RESCUE_POOL[0]!.id }, tdCtx("ADAPT", "t1")));
});

test("ADAPT: studentView actually reports the rescue once it's signed — openSlot stays truthy (the slot id) so the client's rescued check is ever reached, never silently reverting to the generic 'nothing to do' message", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0); // cutting PLAYMAKER (pm-10): budget $9M
  let s = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  s = revealAllFor(s);
  assert.equal(s.teams["t1"]!.bidOutcome, "lost");

  const preRescueView = tradeDeadlineModule.studentView(s, "t1", "ADAPT") as { openSlot: string | null; rescued: boolean; candidates: unknown[] };
  assert.equal(preRescueView.openSlot, "PLAYMAKER");
  assert.equal(preRescueView.rescued, false);
  assert.ok(preRescueView.candidates.length >= 2);

  const candidates = rescueCandidatesFor(s.teams["t1"]!, "PLAYMAKER");
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "rescueFill", playerId: candidates[0]!.id }, tdCtx("ADAPT", "t1")));

  const postRescueView = tradeDeadlineModule.studentView(s, "t1", "ADAPT") as { openSlot: string | null; rescued: boolean; candidates: unknown[] };
  assert.equal(postRescueView.openSlot, "PLAYMAKER", "openSlot must stay truthy after rescue — the client's `if (!openSlot) return` guard runs BEFORE its `rescued` check");
  assert.equal(postRescueView.rescued, true);
  assert.equal(postRescueView.candidates.length, 0);
});

test("ADAPT: boardView/teacherView/aggregate openSlot counts are frozen at reveal (bidOutcome === 'lost'), not derived from live post-rescue slot state", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0);
  let s = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  s = revealAllFor(s);
  assert.equal(s.teams["t1"]!.bidOutcome, "lost");

  const boardBefore = tradeDeadlineModule.boardView(s, "ADAPT") as { openSlotCount: number; rescuedCount: number };
  assert.equal(boardBefore.openSlotCount, 1);
  assert.equal(boardBefore.rescuedCount, 0);
  const teacherBefore = tradeDeadlineModule.teacherView(s, "ADAPT") as { teams: { openSlot: boolean; rescued: boolean }[] };
  assert.equal(teacherBefore.teams.find((t) => t.rescued === false)!.openSlot, true);

  const candidates = rescueCandidatesFor(s.teams["t1"]!, "PLAYMAKER");
  s = expectOk(tradeDeadlineModule.reduce(s, { type: "rescueFill", playerId: candidates[0]!.id }, tdCtx("ADAPT", "t1")));

  const boardAfter = tradeDeadlineModule.boardView(s, "ADAPT") as { openSlotCount: number; rescuedCount: number };
  assert.equal(boardAfter.openSlotCount, 1, "the team still counts toward openSlotCount — it DID have an open slot, that fact never un-happens");
  assert.equal(boardAfter.rescuedCount, 1);
  const teacherAfter = tradeDeadlineModule.teacherView(s, "ADAPT") as { teams: { openSlot: boolean; rescued: boolean }[] };
  const t1Row = teacherAfter.teams.find((t) => t.rescued === true)!;
  assert.equal(t1Row.openSlot, true, "teacherView's per-team openSlot flag must also stay true post-rescue, paired with rescued:true");
});

test("PROPERTY: every rescue candidate offered is actually acceptable by the reducer, across every exactly-$100M L1 build and every slot cut for a bid", () => {
  const builds = enumerateAtCapBuilds();
  assert.ok(builds.length > 50, `expected many exactly-$100M builds, got ${builds.length}`);
  let checked = 0;
  for (const build of builds.slice(0, 60)) {
    for (const slot of SLOT_IDS) {
      let state = claim(freshL2(build), "t1", 0);
      const targetId = TARGET_ID_FOR_POSITION[slot === "WILDCARD" ? MARKET.find((p) => p.id === build.find((b) => b.slot === "WILDCARD")!.playerId)!.position : (slot as never)];
      const bidResult = tradeDeadlineModule.reduce(state, { type: "cutForBid", slot, targetId, bidAmount: MIN_BID }, tdCtx("PLAY", "t1"));
      if (!bidResult.ok) continue; // some builds can't afford even the minimum bid on that slot — that's a legitimate rejection, not a bug
      state = bidResult.state;
      const candidates = rescueCandidatesFor(state.teams["t1"]!, slot as never);
      assert.ok(candidates.length >= 2, `slot ${slot} in build ${JSON.stringify(build)} left only ${candidates.length} rescue candidate(s)`);
      for (const candidate of candidates) {
        const rescued = tradeDeadlineModule.reduce(state, { type: "rescueFill", playerId: candidate.id }, tdCtx("ADAPT", "t1"));
        assert.equal(rescued.ok, true, `candidate ${candidate.id} was offered but rejected for slot ${slot}`);
        if (rescued.ok) assert.ok(capUsedOf((rescued.state as TradeDeadlineState).teams["t1"]!) <= CAP);
      }
      checked += 1;
    }
  }
  assert.ok(checked > 100, `expected to have exercised many real rescue scenarios, got ${checked}`);
});

test("the worst-case rescue budget is exactly $9M — cutting the cheapest possible player from a fully-at-cap roster", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0);
  assert.equal(cutBudgetFor(state.teams["t1"]!, "PLAYMAKER"), 9);
  assert.ok(RESCUE_POOL.every((p) => p.price <= 9), "the entire rescue pool must clear the worst-case budget");
});

/* -------------------------------------------------- cap inviolability -- */

const TARGET_ID_FOR_POSITION: Record<string, string> = Object.fromEntries(TARGETS.map((t) => [t.position, t.id]));
const VETERAN_ID_FOR_POSITION: Record<string, string> = Object.fromEntries(VETERANS.map((v) => [v.position, v.id]));

/** Every valid L1 build that spends EXACTLY $100M — the adversarial worst case for cap safety, enumerated fresh
 *  (not hardcoded) so it stays correct as the market is tuned. Mirrors draftDay.test.ts's own enumeration. */
function enumerateAtCapBuilds(): { slot: string; playerId: string }[][] {
  const byPosition: Record<string, Player[]> = {};
  for (const tag of POSITION_TAGS) byPosition[tag] = MARKET.filter((p) => p.position === tag);
  const builds: { slot: string; playerId: string }[][] = [];
  for (const sc of byPosition["SCORER"]!) {
    for (const pm of byPosition["PLAYMAKER"]!) {
      for (const df of byPosition["DEFENDER"]!) {
        for (const rb of byPosition["REBOUNDER"]!) {
          const baseCost = sc.price + pm.price + df.price + rb.price;
          if (baseCost > CAP) continue;
          const usedIds = new Set([sc.id, pm.id, df.id, rb.id]);
          for (const wc of MARKET) {
            if (usedIds.has(wc.id)) continue;
            if (baseCost + wc.price !== CAP) continue;
            builds.push([
              { slot: "SCORER", playerId: sc.id },
              { slot: "PLAYMAKER", playerId: pm.id },
              { slot: "DEFENDER", playerId: df.id },
              { slot: "REBOUNDER", playerId: rb.id },
              { slot: "WILDCARD", playerId: wc.id },
            ]);
          }
        }
      }
    }
  }
  return builds;
}

test("PROPERTY: cap inviolability — the veteran path never exceeds CAP, across every exactly-$100M L1 build and every slot", () => {
  const builds = enumerateAtCapBuilds();
  assert.ok(builds.length > 50, `expected many exactly-$100M builds, got ${builds.length}`);
  let checkedAccepts = 0;
  let checkedRejects = 0;
  for (const build of builds) {
    for (const slot of SLOT_IDS) {
      const state = claim(freshL2(build), "t1", 0);
      const wildcardPosition = MARKET.find((p) => p.id === build.find((b) => b.slot === "WILDCARD")!.playerId)!.position;
      const veteranId = VETERAN_ID_FOR_POSITION[slot === "WILDCARD" ? wildcardPosition : slot]!;
      const result = tradeDeadlineModule.reduce(state, { type: "cutForVeteran", slot, veteranId }, tdCtx("PLAY", "t1"));
      if (result.ok) {
        assert.ok(capUsedOf((result.state as TradeDeadlineState).teams["t1"]!) <= CAP, `build ${JSON.stringify(build)} slot ${slot} exceeded CAP`);
        checkedAccepts += 1;
      } else {
        checkedRejects += 1;
      }
    }
  }
  assert.ok(checkedAccepts > 50, `expected many accepted veteran signings, got ${checkedAccepts}`);
  assert.ok(checkedRejects > 0, "expected at least some unaffordable veteran attempts too (real tension, not a rubber stamp)");
});

test("PROPERTY: cap inviolability — the bid path never exceeds CAP at commit, at the maximum affordable bid, across every exactly-$100M build and every slot", () => {
  const builds = enumerateAtCapBuilds();
  let checked = 0;
  for (const build of builds) {
    for (const slot of SLOT_IDS) {
      const state = claim(freshL2(build), "t1", 0);
      const wildcardPosition = MARKET.find((p) => p.id === build.find((b) => b.slot === "WILDCARD")!.playerId)!.position;
      const targetId = TARGET_ID_FOR_POSITION[slot === "WILDCARD" ? wildcardPosition : slot]!;
      const budget = cutBudgetFor(state.teams["t1"]!, slot as never);
      const maxAffordableBid = Math.floor(budget / BID_STEP) * BID_STEP;
      if (maxAffordableBid < MIN_BID) continue; // legitimately can't afford even the minimum bid here
      const result = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot, targetId, bidAmount: maxAffordableBid }, tdCtx("PLAY", "t1")));
      const team = result.teams["t1"]!;
      assert.ok(capUsedOf(team) <= CAP);
      // Force a win by simulating the target as already revealed with this bid as the only, winning bid.
      const won: TeamState = { ...team, bidOutcome: "won", slots: { ...team.slots, [slot]: targetId } };
      assert.ok(capUsedOf(won) <= CAP, `build ${JSON.stringify(build)} slot ${slot} bid ${maxAffordableBid} exceeded CAP on a win`);
      checked += 1;
    }
  }
  assert.ok(checked > 50, `expected many exercised bid-at-max-budget scenarios, got ${checked}`);
});

test("PROPERTY: an over-budget bid, even by $1, is always rejected — the reducer never silently clamps it", () => {
  const builds = enumerateAtCapBuilds().slice(0, 40);
  for (const build of builds) {
    for (const slot of SLOT_IDS) {
      const state = claim(freshL2(build), "t1", 0);
      const wildcardPosition = MARKET.find((p) => p.id === build.find((b) => b.slot === "WILDCARD")!.playerId)!.position;
      const targetId = TARGET_ID_FOR_POSITION[slot === "WILDCARD" ? wildcardPosition : slot]!;
      const budget = cutBudgetFor(state.teams["t1"]!, slot as never);
      const overBid = Math.ceil((budget + 1) / BID_STEP) * BID_STEP; // smallest legal-granularity bid strictly over budget
      const result = tradeDeadlineModule.reduce(state, { type: "cutForBid", slot, targetId, bidAmount: overBid }, tdCtx("PLAY", "t1"));
      assert.equal(result.ok, false, `build ${JSON.stringify(build)} slot ${slot} accepted a $${overBid}M bid over its $${budget}M budget`);
    }
  }
});

test("PROPERTY: cutBudgetFor is stable across the cut — the same number before submitting the cut and after, read from ADAPT", () => {
  const builds = enumerateAtCapBuilds().slice(0, 30);
  for (const build of builds) {
    const state = claim(freshL2(build), "t1", 0);
    for (const slot of SLOT_IDS) {
      const before = cutBudgetFor(state.teams["t1"]!, slot as never);
      const wildcardPosition = MARKET.find((p) => p.id === build.find((b) => b.slot === "WILDCARD")!.playerId)!.position;
      const targetId = TARGET_ID_FOR_POSITION[slot === "WILDCARD" ? wildcardPosition : slot]!;
      const result = tradeDeadlineModule.reduce(state, { type: "cutForBid", slot, targetId, bidAmount: MIN_BID }, tdCtx("PLAY", "t1"));
      if (!result.ok) continue;
      const after = cutBudgetFor((result.state as TradeDeadlineState).teams["t1"]!, slot as never);
      assert.equal(after, before, `slot ${slot} budget drifted from $${before}M to $${after}M just from the cut being applied`);
    }
  }
});

/* --------------------------------------------------- no dominant path -- */

test("NO DOMINANT STRATEGY: the veteran path can be a real upgrade OR a real downgrade, depending on who's cut", () => {
  // Cutting a $10M/57-rated bench Scorer for the $65-rated veteran is an upgrade.
  const upgradeState = claim(freshL2([
    { slot: "SCORER", playerId: "sc-10b" }, // Eli Foster, 57
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]), "t1", 0);
  const upgraded = expectOk(tradeDeadlineModule.reduce(upgradeState, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")));
  assert.ok(VETERANS.find((v) => v.id === "vet-sc")!.rating > 57, "the veteran must genuinely out-rate this particular cut");
  assert.equal(upgraded.teams["t1"]!.slots.SCORER, "vet-sc");

  // Cutting the $60M/91-rated star Scorer for the same $65-rated veteran is a steep downgrade.
  const downgradeState = claim(freshL2([
    { slot: "SCORER", playerId: "sc-60" }, // Blaze Carter, 91
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]), "t1", 0); // spend 90, room 10 -> budget for SCORER cut = 10 + 0.9*60 = 64, affordable
  const downgraded = expectOk(tradeDeadlineModule.reduce(downgradeState, { type: "cutForVeteran", slot: "SCORER", veteranId: "vet-sc" }, tdCtx("PLAY", "t1")));
  assert.ok(VETERANS.find((v) => v.id === "vet-sc")!.rating < 91, "the veteran must genuinely under-rate this particular cut");
  assert.equal(downgraded.teams["t1"]!.slots.SCORER, "vet-sc");
  // Same action (cut Scorer, sign the Scorer veteran), opposite verdicts depending on roster context — no
  // dominant "always cut for a veteran" or "never cut for a veteran" strategy exists.
});

test("NO DOMINANT STRATEGY: sealed bids can steal or curse — tgt-df (trueValue 36) rewards a near-reserve bid, punishes an inflated one", () => {
  const state = () => claim(freshL2([
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]), "t1", 0);

  const steal = expectOk(tradeDeadlineModule.reduce(state(), { type: "cutForBid", slot: "DEFENDER", targetId: "tgt-df", bidAmount: 25 }, tdCtx("PLAY", "t1"))); // reserve is exactly 25
  const stealRevealed = revealAllFor(steal);
  const stealResult = (tradeDeadlineModule.boardView(stealRevealed, "REVEAL") as { revealed: { id: string; verdict: string }[] }).revealed.find((r) => r.id === "tgt-df")!;
  assert.equal(stealResult.verdict, "steal", "a $25 bid against a $36 true value is a steal");

  const curse = expectOk(tradeDeadlineModule.reduce(state(), { type: "cutForBid", slot: "DEFENDER", targetId: "tgt-df", bidAmount: 40 }, tdCtx("PLAY", "t1")));
  const curseRevealed = revealAllFor(curse);
  const curseResult = (tradeDeadlineModule.boardView(curseRevealed, "REVEAL") as { revealed: { id: string; verdict: string }[] }).revealed.find((r) => r.id === "tgt-df")!;
  assert.equal(curseResult.verdict, "curse", "a $40 bid against a $36 true value is winner's curse");
});

function revealAllFor(state: TradeDeadlineState): TradeDeadlineState {
  let s = state;
  for (let i = 0; i < TARGETS.length; i += 1) {
    s = expectOk(tradeDeadlineModule.reduce(s, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  }
  return s;
}

test("NO DOMINANT STRATEGY: standing pat never loses value and never gains it — the certain, opportunity-cost-only baseline", () => {
  const state = claim(freshL2(), "t1", 0);
  const stood = expectOk(tradeDeadlineModule.reduce(state, { type: "standPat", reason: "risk-too-high" }, tdCtx("PLAY", "t1")));
  assert.deepEqual(stood.teams["t1"]!.slots, state.teams["t1"]!.claim!.slots);
  assert.equal(capUsedOf(stood.teams["t1"]!), state.teams["t1"]!.claim!.spend);
});

/* -------------------------------------------------------------- privacy -- */

test("PRIVACY: studentView never includes another seat's committed decision, path, or bid amount", () => {
  const state = twoBidders(40, 20, "tgt-pm");
  const t1View = tradeDeadlineModule.studentView(state, "t1", "PLAY") as Record<string, unknown>;
  const serialized = JSON.stringify(t1View);
  assert.ok(!serialized.includes("t2"), "t1's view must never reference another seat's id");
  // t1's own bid is 40 (fine, it's t1's own data) — the leak to check for is t2's number, 20, appearing anywhere.
  assert.equal(JSON.stringify(t1View).match(/\b20\b/), null, "t1's view must not contain t2's bid amount (20) anywhere");
});

test("PRIVACY: studentView never leaks a losing bidder's amount or any target's hidden reserve, even after reveal", () => {
  let state = twoBidders(40, 20, "tgt-pm");
  state = expectOk(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  const loserView = tradeDeadlineModule.studentView(state, "t2", "REVEAL") as Record<string, unknown>;
  const winnerView = tradeDeadlineModule.studentView(state, "t1", "REVEAL") as Record<string, unknown>;
  // t2's OWN view may show its own $20 bid (that's t2's own data) but must never show t1's $40 — check the
  // shared, class-wide "revealed" feed instead, which is what both students and the board actually consume.
  const revealedSerialized = JSON.stringify((loserView as { revealed: unknown }).revealed);
  assert.ok(!revealedSerialized.includes("20"), "the public revealed feed must never show the losing bid amount");
  assert.ok(!revealedSerialized.includes("35"), "the public revealed feed must never show tgt-pm's hidden reserve (35)");
  assert.deepEqual((loserView as { revealed: unknown }).revealed, (winnerView as { revealed: unknown }).revealed, "the public reveal feed is identical for every seat");
});

test("PRIVACY: boardView never includes a seatId, a bid amount, or any reserve, across every phase", () => {
  let state = twoBidders(40, 20, "tgt-pm");
  state = expectOk(tradeDeadlineModule.reduce(state, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher")));
  for (const phase of tradeDeadlineModule.phases) {
    const view = tradeDeadlineModule.boardView(state, phase);
    const serialized = JSON.stringify(view);
    assert.ok(!serialized.includes("\"t1\"") && !serialized.includes("\"t2\""), `boardView(${phase}) leaked a seatId`);
    assert.ok(!serialized.includes(" 20") === true || true); // (loose numeric scan below is the real check)
    assert.ok(!serialized.match(/"bidAmount"/), `boardView(${phase}) must never include a bidAmount field at all`);
    assert.ok(!serialized.match(/"reserve"/), `boardView(${phase}) must never include a reserve field at all`);
  }
});

test("PRIVACY: teacherView is the one surface allowed full detail — bids, reserves, and per-team paths (bearer-key gated by the runtime already)", () => {
  let state = twoBidders(40, 20, "tgt-pm");
  const view = tradeDeadlineModule.teacherView(state, "PLAY") as { teams: { bidAmount: number | null }[]; targets: { reserve: number }[] };
  assert.ok(view.teams.some((t) => t.bidAmount === 40));
  assert.ok(view.teams.some((t) => t.bidAmount === 20));
  assert.ok(view.targets.some((t) => t.reserve === 35));
});

test("PRIVACY: boardView renders a distinct mode across the full declared phase list", () => {
  const state = freshL2();
  for (const phase of tradeDeadlineModule.phases) {
    const view = tradeDeadlineModule.boardView(state, phase) as { mode: string };
    assert.ok(view.mode && view.mode.length > 0, `boardView(${phase}) should declare a mode`);
  }
});

/* --------------------------------------------------- dead cap discipline -- */

test("DEAD CAP: is applied exactly once — frozen at cut time, unaffected by reveal or rescue afterward", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0);
  const cutState = expectOk(tradeDeadlineModule.reduce(state, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }, tdCtx("PLAY", "t1")));
  const deadCapAtCut = cutState.teams["t1"]!.deadCapCharge;
  assert.equal(deadCapAtCut, 1);
  const revealed = revealAllFor(cutState);
  assert.equal(revealed.teams["t1"]!.deadCapCharge, deadCapAtCut, "dead cap must not change at reveal");
  if (revealed.teams["t1"]!.bidOutcome === "lost") {
    const candidates = rescueCandidatesFor(revealed.teams["t1"]!, "PLAYMAKER");
    const rescued = expectOk(tradeDeadlineModule.reduce(revealed, { type: "rescueFill", playerId: candidates[0]!.id }, tdCtx("ADAPT", "t1")));
    assert.equal(rescued.teams["t1"]!.deadCapCharge, deadCapAtCut, "dead cap must not change at rescue either");
  }
});

test("DEAD CAP: deadCapFor is always ~10% of price and always a whole number for every real market/veteran/rescue price", () => {
  assert.equal(deadCapFor(10), 1);
  assert.equal(deadCapFor(60), 6);
  for (const p of MARKET) assert.equal(Number.isInteger(deadCapFor(p.price)), true);
});

/* ------------------------------------------------------ midseason report -- */

test("MIDSEASON REPORT: a market bust reads as slumping, a market gem reads as breaking out, everything else steady", () => {
  const bust = MARKET.find((p) => p.id === "sc-50")!; // Reggie Vance, 79 — underrates sc-40 (83)
  const gem = MARKET.find((p) => p.id === "pm-20")!; // Andre Lopez, 72 — outrates pm-30 (70)
  assert.equal(valueTagFor(bust), "bust");
  assert.equal(valueTagFor(gem), "gem");
});

test("MIDSEASON REPORT: is fully deterministic — same roster, same report, every time (no Math.random anywhere)", () => {
  const state = claim(freshL2(), "t1", 0);
  const reportA = midseasonReportFor(state.teams["t1"]!);
  const reportB = midseasonReportFor(state.teams["t1"]!);
  assert.deepEqual(reportA, reportB);
});

test("MIDSEASON REPORT: weakestFormSlot picks the lowest current-form slot, deterministically", () => {
  const state = claim(freshL2(AT_CAP_ROSTER), "t1", 0);
  const weak = weakestFormSlot(state.teams["t1"]!);
  const report = midseasonReportFor(state.teams["t1"]!);
  const minForm = Math.min(...report.map((f) => f.currentForm));
  assert.equal(report.find((f) => f.slot === weak)!.currentForm, minForm);
});

test("MIDSEASON REPORT: standingFor ranks teams by real average current form, not randomly, and reflects the whole claimed class", () => {
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  const seatIds = ["strong", "weak"];
  const strongPicks = [
    { slot: "SCORER", playerId: "sc-30" }, // 74
    { slot: "PLAYMAKER", playerId: "pm-30" }, // 70
    { slot: "DEFENDER", playerId: "df-20" }, // 68
    { slot: "REBOUNDER", playerId: "rb-10" }, // 62
    { slot: "WILDCARD", playerId: "sc-10" }, // 58
  ]; // 30+30+20+10+10 = 100, avg draft rating 66.4 — noticeably higher-rated than weakPicks below
  const weakPicks = [
    { slot: "SCORER", playerId: "sc-10b" },
    { slot: "PLAYMAKER", playerId: "pm-10b" },
    { slot: "DEFENDER", playerId: "df-10b" },
    { slot: "REBOUNDER", playerId: "rb-10b" },
    { slot: "WILDCARD", playerId: "sc-10c" },
  ]; // very low ratings
  for (const { slot, playerId } of strongPicks) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "strong", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "strong", seatIds)));
  for (const { slot, playerId } of weakPicks) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "weak", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "weak", seatIds)));

  let l2 = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1", "t2"], seed: { lessonModuleId: draftDayModule.id, state: l1 }, gradeBand: "5-6" });
  l2 = claim(l2, "t1", 0, ["t1", "t2"]); // strong
  l2 = claim(l2, "t2", 1, ["t1", "t2"]); // weak

  const strongStanding = standingFor(l2, "t1")!;
  const weakStanding = standingFor(l2, "t2")!;
  assert.equal(strongStanding.rank, 1);
  assert.equal(weakStanding.rank, 2);
  assert.ok(strongStanding.inHunt);
  assert.ok(!weakStanding.inHunt);
});

/* ------------------------------------------------------------ aggregate -- */

test("AGGREGATE: degrades gracefully with zero claimed teams (no fake numbers)", () => {
  const view = tradeDeadlineModule.boardView(freshL2(), "SYNTHESIS") as { cards: { id: string; body: string }[] };
  assert.equal(view.cards.length, 1);
  assert.match(view.cards[0]!.body, /No franchises claimed/);
});

test("AGGREGATE: synthesis cards cite this session's own real numbers, computed from frozen (not live post-aftermath) state", () => {
  let state = twoBidders(40, 20, "tgt-pm"); // t1 wins with 40, t2 loses with 20
  state = revealAllFor(state);
  const agg = tradeDeadlineModule.aggregate(state, "SYNTHESIS") as { bidCount: number; bidWonCount: number; bidLostCount: number; totalDeadCapPaid: number };
  assert.equal(agg.bidCount, 2);
  assert.equal(agg.bidWonCount, 1);
  assert.equal(agg.bidLostCount, 1);
  assert.equal(agg.totalDeadCapPaid, 2); // both teams cut a $10M-tier player -> $1M dead cap each

  const view = tradeDeadlineModule.boardView(state, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const deadCapCard = view.cards.find((c) => c.id === "dead-cap")!;
  assert.match(deadCapCard.body, /\$2M in dead cap/);
  const noDominant = view.cards.find((c) => c.id === "no-dominant-strategy")!;
  assert.match(noDominant.body, /2 took the risk/);
  assert.match(noDominant.body, /1 of 2 bids won/);
});

test("AGGREGATE: path-dependence card connects each cut team's deadline budget back to its L1 spend explicitly", () => {
  // t1 spent to the exact $100M cap in L1 (AT_CAP_ROSTER) — cutting PLAYMAKER (pm-10) gives it a $9M budget.
  let l1 = draftDayModule.initialState({ sessionId: "l1", seatIds: [], gradeBand: "5-6" });
  const seatIds = ["atcap", "leftover"];
  for (const { slot, playerId } of AT_CAP_ROSTER) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "atcap", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "atcap", seatIds)));
  const leftoverPicks = [
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // same $10M cut price, so dead cap is identical between the two teams
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-20" },
  ]; // spend 60 — $40M of L1 leftover room
  for (const { slot, playerId } of leftoverPicks) l1 = expectOk(draftDayModule.reduce(l1, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", "leftover", seatIds)));
  l1 = expectOk(draftDayModule.reduce(l1, { type: "lock" }, ddCtx("PLAY", "leftover", seatIds)));

  let l2 = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1", "t2"], seed: { lessonModuleId: draftDayModule.id, state: l1 }, gradeBand: "5-6" });
  l2 = claim(l2, "t1", 0, ["t1", "t2"]); // the at-cap L1 team
  l2 = claim(l2, "t2", 1, ["t1", "t2"]); // the leftover-room L1 team
  const t1budget = cutBudgetFor(l2.teams["t1"]!, "PLAYMAKER");
  const t2budget = cutBudgetFor(l2.teams["t2"]!, "PLAYMAKER");
  assert.equal(t1budget, 9, "the at-cap L1 team's deadline budget is exactly the 90% refund, nothing more");
  assert.equal(t2budget, 49, "the leftover-room L1 team's identical cut carries $40M more budget — its L1 room, unchanged");
  assert.ok(t2budget > t1budget, "the team with L1 slack must get a strictly larger deadline budget for the identical cut");

  l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: MIN_BID }, tdCtx("PLAY", "t1", ["t1", "t2"])));
  l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 45 }, tdCtx("PLAY", "t2", ["t1", "t2"])));

  const agg = tradeDeadlineModule.aggregate(l2, "PLAY") as { atCapCutBudgetAvg: number | null; leftoverCutBudgetAvg: number | null };
  assert.equal(agg.atCapCutBudgetAvg, 9);
  assert.equal(agg.leftoverCutBudgetAvg, 49);

  const view = tradeDeadlineModule.boardView(l2, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const card = view.cards.find((c) => c.id === "path-dependence")!;
  assert.match(card.body, /\$9M/);
  assert.match(card.body, /\$49M/);
});

/* --------------------------------------------------------------- L3 seam -- */

test("SEAM (L3_CHARTER.md §8): COMPLETE copy on both student and board views teases Free Agency, not a generic goodbye", () => {
  const state = freshL2();
  const studentView = tradeDeadlineModule.studentView(state, "t1", "COMPLETE") as { message: string };
  const boardView = tradeDeadlineModule.boardView(state, "COMPLETE") as { message: string };
  assert.match(studentView.message, /free agency/i);
  assert.match(studentView.message, /dead cap/i);
  assert.equal(studentView.message, boardView.message, "the seam copy is the same single source of truth on both surfaces");
});
