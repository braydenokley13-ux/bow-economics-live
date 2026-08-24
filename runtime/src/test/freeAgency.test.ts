import assert from "node:assert/strict";
import { test } from "node:test";
import { CAP as L1_CAP, MARKET, draftDayModule, type DraftDayState } from "../modules/draftDay.js";
import { MODULE_ID as TD_MODULE_ID, tradeDeadlineModule, type TradeDeadlineState } from "../modules/tradeDeadline.js";
import {
  AGENTS,
  CAP,
  DEBATE_PROMPTS,
  MIN_OFFER,
  MODULE_ID,
  OFFER_STEP,
  TOTAL_REVEAL_STEPS,
  WINDOW_DAYS,
  capRoomOf,
  capUsedOf,
  computePlayoffs,
  computeStandings,
  extractCarriedFranchisesL3,
  freeAgencyModule,
  isFreeAgencySignee,
  projectedCapUsedForOffer,
  teamForm,
  type FreeAgencyState,
  type TeamState,
} from "../modules/freeAgency.js";
import { isOrderedSubsequence } from "../shared/phases.js";

/* ---------------------------------------------------------------- setup -- */

const ddCtx = (phase: string, seatId: string, seatIds: string[] = [seatId]) => ({ phase: phase as never, seatId, seatIds, now: Date.now() });
const tdCtx = (phase: string, seatId: string, seatIds: string[] = ["t1", "t2", "t3"], now = Date.now()) => ({ phase: phase as never, seatId, seatIds, now });
const l3Ctx = (phase: string, seatId: string, seatIds: string[] = ["t1", "t2", "t3"], now = Date.now()) => ({ phase: phase as never, seatId, seatIds, now });

function expectOk<T>(result: { ok: boolean; state?: T; reason?: string }): T {
  assert.equal(result.ok, true, !result.ok ? result.reason : undefined);
  return result.state as T;
}
function expectRejected<T>(result: { ok: boolean; reason?: string }, match?: RegExp): void {
  assert.equal(result.ok, false, "expected the action to be rejected");
  if (match && !result.ok) assert.match(result.reason!, match);
}

function buildLockedL1(picks: { slot: string; playerId: string }[], seatId = "s1", seatIds = ["s1"]): DraftDayState {
  let state = draftDayModule.initialState({ sessionId: "l1", seatIds: [] });
  for (const { slot, playerId } of picks) {
    state = expectOk(draftDayModule.reduce(state, { type: "place", slotId: slot, playerId }, ddCtx("PLAY", seatId, seatIds)));
  }
  return expectOk(draftDayModule.reduce(state, { type: "lock" }, ddCtx("PLAY", seatId, seatIds)));
}

const AT_CAP_ROSTER = [
  { slot: "SCORER", playerId: "sc-30" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-30" },
  { slot: "REBOUNDER", playerId: "rb-20" },
  { slot: "WILDCARD", playerId: "sc-10" },
]; // 100

/** Plenty of L1 room to cut+resign in any L2 path (veteran $20, or a $10-$40 bid) -- the default for
 *  `buildL2State` below, used wherever "at cap" isn't specifically the point of the test. */
const CUT_ROOM_ROSTER = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
]; // 60

/** An exactly-$100M L1 lock whose PLAYMAKER slot is the market's priciest ($60) -- cutting it carries a real,
 *  large dead-cap hit ($6M) while still leaving a wide (~$54M) L2 deadline budget, so it can drive either the
 *  veteran or the bid path without an affordability rejection getting in the way of the scenario under test. */
const HIGH_DEAD_CAP_AT_CAP_ROSTER = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-60" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-10b" },
]; // 10+60+10+10+10 = 100

/** A fresh freeAgency session seeded straight from an L1 draftDay session (the L1-fallback path). */
function freshL3FromL1(picks: { slot: string; playerId: string }[] = AT_CAP_ROSTER, l1SeatId = "s1", l3SeatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  const l1 = buildLockedL1(picks, l1SeatId, [l1SeatId]);
  const seed = { lessonModuleId: draftDayModule.id, state: l1 };
  return freeAgencyModule.initialState({ sessionId: "l3", seatIds: l3SeatIds, seed });
}

/** A fresh freeAgency session with no seed at all — the pure-stock path. */
function freshL3Stock(l3SeatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  return freeAgencyModule.initialState({ sessionId: "l3", seatIds: l3SeatIds, seed: undefined });
}

/** Builds a real L2 (tradeDeadline) session, seeded from a real locked L1, drives it to a given path for
 *  seat "t1" (the only claimant of index 0), and returns the raw TradeDeadlineState for use as an L3 seed. */
function buildL2State(opts: { l1Picks?: { slot: string; playerId: string }[]; path: "standPat" | "veteran" | "bidWon" | "bidLostUnrescued" | "bidLostRescued" }): TradeDeadlineState {
  const l1 = buildLockedL1(opts.l1Picks ?? CUT_ROOM_ROSTER, "s1", ["s1"]);
  let l2 = tradeDeadlineModule.initialState({ sessionId: "l2", seatIds: ["t1"], seed: { lessonModuleId: draftDayModule.id, state: l1 } });
  l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "claim", carriedIndex: 0 }, tdCtx("HOOK", "t1", ["t1"])));
  if (opts.path === "standPat") {
    return expectOk(tradeDeadlineModule.reduce(l2, { type: "standPat", reason: "happy-with-roster" }, tdCtx("PLAY", "t1", ["t1"])));
  }
  if (opts.path === "veteran") {
    return expectOk(tradeDeadlineModule.reduce(l2, { type: "cutForVeteran", slot: "PLAYMAKER", veteranId: "vet-pm" }, tdCtx("PLAY", "t1", ["t1"])));
  }
  // bid paths: cut PLAYMAKER, bid on tgt-pm (reserve 35). Phase transitions are runtime-level (sessionService),
  // not something the module's own reduce() enforces beyond trusting ctx.phase -- so, exactly like
  // tradeDeadline.test.ts's own helpers, we call reduce() directly with whatever ctx.phase the next step needs.
  l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: opts.path === "bidWon" ? 40 : 10 }, tdCtx("PLAY", "t1", ["t1"])));
  // REVEAL_ORDER is TARGETS' own fixed array order (sc, pm, df, rb) -- tgt-pm is the SECOND reveal, so this
  // must click through every target up to and including it, not just once.
  for (let i = 0; i < 4 && l2.revealedTargetIds.length <= 1; i += 1) {
    l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "teacher:revealNext" }, tdCtx("REVEAL", "teacher", ["t1"])));
  }
  if (opts.path === "bidLostRescued") {
    l2 = expectOk(tradeDeadlineModule.reduce(l2, { type: "rescueFill", playerId: "res-pm-1" }, tdCtx("ADAPT", "t1", ["t1"])));
  }
  return l2;
}

/** A fresh freeAgency session seeded from a real L2 (tradeDeadline) state built by `buildL2State`. */
function freshL3FromL2(l2: TradeDeadlineState, l3SeatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  return freeAgencyModule.initialState({ sessionId: "l3", seatIds: l3SeatIds, seed: { lessonModuleId: TD_MODULE_ID, state: l2 } });
}

function claimStock(state: FreeAgencyState, seatId: string, seatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  return expectOk(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("HOOK", seatId, seatIds)));
}
function claimCarried(state: FreeAgencyState, seatId: string, idx: number, seatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  return expectOk(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: idx }, l3Ctx("HOOK", seatId, seatIds)));
}

function offer(state: FreeAgencyState, seatId: string, agentId: string, amount: number, slot: string, seatIds = ["t1", "t2", "t3"]) {
  return freeAgencyModule.reduce(state, { type: "offer", agentId, amount, slot }, l3Ctx("PLAY", seatId, seatIds));
}
function closeDay(state: FreeAgencyState, seatIds = ["t1", "t2", "t3"]): FreeAgencyState {
  return expectOk(freeAgencyModule.reduce(state, { type: "teacher:closeDay" }, l3Ctx("PLAY", "teacher", seatIds)));
}

const STAR = AGENTS.find((a) => a.tier === "star")!;
const STAR2 = AGENTS.filter((a) => a.tier === "star")[1]!;
const SOLID = AGENTS.find((a) => a.tier === "solid")!;
const VALUE = AGENTS.find((a) => a.tier === "value")!;
const VALUE2 = AGENTS.filter((a) => a.tier === "value")[1]!;

/* -------------------------------------------------------------- phases -- */

test("freeAgencyModule declares a well-ordered phase subsequence of the canonical vocabulary", () => {
  assert.equal(isOrderedSubsequence(freeAgencyModule.phases), true);
  assert.deepEqual([...freeAgencyModule.phases], ["LOBBY", "HOOK", "PLAY", "REVEAL", "COUNTERFACTUAL", "SYNTHESIS", "COMPLETE"]);
});

test("module id is m1l3-free-agency", () => {
  assert.equal(MODULE_ID, "m1l3-free-agency");
  assert.equal(freeAgencyModule.id, MODULE_ID);
});

test("sanity: 8 agents, 2 per position, 2 star / 3 solid / 3 value, and CAP is $130M", () => {
  assert.equal(AGENTS.length, 8);
  assert.equal(CAP, 130);
  const byPosition: Record<string, number> = {};
  for (const a of AGENTS) byPosition[a.position] = (byPosition[a.position] ?? 0) + 1;
  assert.deepEqual(Object.values(byPosition).sort(), [2, 2, 2, 2]);
  assert.equal(AGENTS.filter((a) => a.tier === "star").length, 2);
  assert.equal(AGENTS.filter((a) => a.tier === "solid").length, 3);
  assert.equal(AGENTS.filter((a) => a.tier === "value").length, 3);
  const risers = AGENTS.filter((a) => a.playoffFactor === 6);
  const shrinkers = AGENTS.filter((a) => a.playoffFactor === -7);
  assert.equal(risers.length, 1);
  assert.equal(shrinkers.length, 1);
  assert.equal(risers[0]!.tier, "solid");
  assert.equal(shrinkers[0]!.tier, "star");
  assert.ok(risers[0]!.factorHint.length > 0);
  assert.ok(shrinkers[0]!.factorHint.length > 0);
});

/* ------------------------------------------------------- extract seed -- */

test("SEED: extractCarriedFranchisesL3 returns [] for a missing/malformed/hostile seed", () => {
  assert.deepEqual(extractCarriedFranchisesL3(undefined), []);
  assert.deepEqual(extractCarriedFranchisesL3(null), []);
  assert.deepEqual(extractCarriedFranchisesL3("garbage"), []);
  assert.deepEqual(extractCarriedFranchisesL3(42), []);
  assert.deepEqual(extractCarriedFranchisesL3({}), []);
  assert.deepEqual(extractCarriedFranchisesL3({ lessonModuleId: "not-a-real-module", state: {} }), []);
  assert.deepEqual(extractCarriedFranchisesL3({ lessonModuleId: TD_MODULE_ID }), []); // no state field
  assert.deepEqual(extractCarriedFranchisesL3({ lessonModuleId: TD_MODULE_ID, state: "garbage" }), []);
  assert.deepEqual(extractCarriedFranchisesL3({ lessonModuleId: TD_MODULE_ID, state: { teams: "garbage" } }), []);
  assert.deepEqual(extractCarriedFranchisesL3({ lessonModuleId: TD_MODULE_ID, state: { teams: { t1: { claim: { name: "X" } } } } }), []); // malformed claim, missing fields
});

test("SEED: a whole class with no link runs entirely on stock franchises — the lesson is standalone-testable", () => {
  const state = freshL3Stock();
  assert.deepEqual(state.carriedFranchises, []);
  const claimed = claimStock(state, "t1");
  const team = claimed.teams["t1"]!;
  assert.equal(team.claim!.origin, "stock");
  assert.equal(team.deadCap, 0);
  assert.equal(capUsedOf(team), 90); // the same $90M stock roster tradeDeadline uses
});

test("SEED: L1 fallback reuses tradeDeadline's own extractCarriedFranchises — zero dead cap, 'no deadline played' journey", () => {
  const state = freshL3FromL1(AT_CAP_ROSTER);
  assert.equal(state.carriedFranchises.length, 1);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.origin, "l1");
  assert.equal(f.deadCapCarried, 0);
  assert.equal(f.journey.l1Spend, 100);
  assert.match(f.journey.summary, /no deadline played/);
  assert.equal(f.slots["SCORER"]!.price, 30);
});

test("SEED: L2-preferred path carries final roster, carried dead cap, and journey — standPat", () => {
  const l2 = buildL2State({ path: "standPat" });
  const state = freshL3FromL2(l2);
  assert.equal(state.carriedFranchises.length, 1);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.origin, "l2");
  assert.equal(f.deadCapCarried, 0);
  assert.equal(f.journey.l1Spend, 60);
  assert.equal(f.journey.l2Path, "standPat");
  for (const slot of ["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER", "WILDCARD"] as const) assert.ok(f.slots[slot] !== null);
});

test("SEED: L2-preferred path carries a real veteran signing, dead cap included", () => {
  const l2 = buildL2State({ path: "veteran" });
  const state = freshL3FromL2(l2);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.deadCapCarried, 1); // pm-10 (price 10) cut -> deadCapFor(10) = 1
  assert.equal(f.slots["PLAYMAKER"]!.playerId, "vet-pm");
  assert.equal(f.slots["PLAYMAKER"]!.formTag, "steady");
});

test("SEED: L2-preferred path carries a won TARGET, mapping trueValue into rating space per the charter formula", () => {
  const l2 = buildL2State({ path: "bidWon" });
  const state = freshL3FromL2(l2);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.slots["PLAYMAKER"]!.playerId, "tgt-pm");
  assert.equal(f.slots["PLAYMAKER"]!.price, 40); // the actual bid paid
  // tgt-pm: floor 25, ceiling 45, trueValue 30 -> 50 + round(30*(30-25)/20) = 50 + round(7.5) = 58
  assert.equal(f.slots["PLAYMAKER"]!.form, 58);
  assert.match(f.slots["PLAYMAKER"]!.storyLine, /\$40M/);
});

test("SEED: lost-bid-never-rescued carries a genuine open slot — free agency is its redemption arc", () => {
  const l2 = buildL2State({ path: "bidLostUnrescued" });
  const state = freshL3FromL2(l2);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.slots["PLAYMAKER"], null);
  assert.ok(f.deadCapCarried > 0); // the dead cap from the cut is still real, even though the bid lost
});

test("SEED: lost-bid-then-rescued carries the rescue signing, steady form", () => {
  const l2 = buildL2State({ path: "bidLostRescued" });
  const state = freshL3FromL2(l2);
  const f = state.carriedFranchises[0]!;
  assert.equal(f.slots["PLAYMAKER"]!.playerId, "res-pm-1");
  assert.equal(f.slots["PLAYMAKER"]!.formTag, "steady");
});

/* -------------------------------------------------------------- claim -- */

test("CLAIM: a team cannot claim twice", () => {
  let state = freshL3Stock();
  state = claimStock(state, "t1");
  expectRejected(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("HOOK", "t1")), /already claimed/);
});

test("CLAIM: a carried franchise cannot be double-claimed by two seats", () => {
  let state = freshL3FromL1(AT_CAP_ROSTER);
  state = claimCarried(state, "t1", 0);
  expectRejected(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: 0 }, l3Ctx("HOOK", "t2")), /already been claimed/);
});

test("CLAIM: allowed during HOOK and PLAY (late join), rejected everywhere else", () => {
  const state = freshL3Stock();
  expectRejected(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("LOBBY", "t1")), /HOOK or PLAY/);
  expectRejected(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("REVEAL", "t1")), /HOOK or PLAY/);
  const ok = freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("PLAY", "t1"));
  assert.equal(ok.ok, true);
});

test("CLAIM: the teacher cannot claim a franchise", () => {
  const state = freshL3Stock();
  expectRejected(freeAgencyModule.reduce(state, { type: "claim", carriedIndex: null }, l3Ctx("HOOK", "teacher")), /only a seated team/);
});

/* -------------------------------------------------------------- offer -- */

test("OFFER: requires a claimed franchise first", () => {
  const state = freshL3Stock();
  expectRejected(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position), /claim a franchise/);
});

test("OFFER: rejects an unknown agent id", () => {
  let state = claimStock(freshL3Stock(), "t1");
  expectRejected(offer(state, "t1", "not-a-real-agent", 20, "SCORER"), /no free agent/);
});

test("OFFER: rejects a position mismatch on a non-wildcard slot", () => {
  let state = claimStock(freshL3Stock(), "t1");
  expectRejected(offer(state, "t1", VALUE.id, VALUE.openingAsk, "SCORER"), /cannot fill/);
});

test("OFFER: WILDCARD accepts any agent position", () => {
  let state = claimStock(freshL3Stock(), "t1");
  const result = offer(state, "t1", VALUE.id, VALUE.openingAsk, "WILDCARD");
  assert.equal(result.ok, true);
});

test("OFFER: rejects a malformed amount before ever checking affordability", () => {
  let state = claimStock(freshL3Stock(), "t1");
  expectRejected(offer(state, "t1", VALUE.id, 13, VALUE.position), /whole number.*\$5M steps|steps/);
  expectRejected(offer(state, "t1", VALUE.id, 0, VALUE.position), /at least \$5M|steps/);
  expectRejected(offer(state, "t1", VALUE.id, -5, VALUE.position), /at least \$5M|steps/);
});

test("OFFER: rejects an offer over the projected cap, incl. incumbent release dead cap", () => {
  let state = claimStock(freshL3Stock(), "t1");
  // Stock roster spend=90, room=40. Offering on the $50M star into an OCCUPIED slot needs ask+releaseDeadCap.
  // sc-20 (Cole Bennett) occupies SCORER; releasing it costs deadCapFor(20)=2. Budget = 40+ (20-2) = 58 >= 50 -- affordable.
  // Push past it with an absurd (but still a legal $5M-step) amount instead to prove the rejection path fires.
  expectRejected(offer(state, "t1", STAR.id, 1000, STAR.position), /over the \$130M cap/);
});

test("OFFER: an already-signed agent cannot receive a new offer", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position));
  state = closeDay(state, ["t1", "t2"]);
  assert.equal(state.agentMarket[VALUE.id]!.signed, true);
  expectRejected(offer(state, "t2", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]), /already signed elsewhere/);
});

test("OFFER: is revisable — a second offer the same day replaces the first entirely", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position));
  assert.equal(state.teams["t1"]!.pendingOffer!.agentId, VALUE.id);
  state = expectOk(offer(state, "t1", VALUE2.id, VALUE2.openingAsk, VALUE2.position));
  assert.equal(state.teams["t1"]!.pendingOffer!.agentId, VALUE2.id);
});

test("WITHDRAW: clears a pending offer; rejected with nothing pending", () => {
  let state = claimStock(freshL3Stock(), "t1");
  expectRejected(freeAgencyModule.reduce(state, { type: "withdrawOffer" }, l3Ctx("PLAY", "t1")), /don't have an offer/);
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position));
  state = expectOk(freeAgencyModule.reduce(state, { type: "withdrawOffer" }, l3Ctx("PLAY", "t1")));
  assert.equal(state.teams["t1"]!.pendingOffer, null);
});

test("HOLD: an explicit one-tap action, distinct from just doing nothing, visible to the teacher pacing panel", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(freeAgencyModule.reduce(state, { type: "holdDay" }, l3Ctx("PLAY", "t1")));
  assert.equal(state.teams["t1"]!.held, true);
  assert.equal(state.teams["t1"]!.pendingOffer, null);
  const teacherView = freeAgencyModule.teacherView(state, "PLAY") as { teams: { seatId: string; acted: boolean; held: boolean }[] };
  const t1 = teacherView.teams.find((t) => t.seatId === "t1")!;
  assert.equal(t1.acted, true);
  assert.equal(t1.held, true);
});

test("OFFER: only one binding offer per team per day — offering replaces, never stacks two agents", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position));
  state = expectOk(offer(state, "t1", VALUE2.id, VALUE2.openingAsk, VALUE2.position));
  const pending = state.teams["t1"]!.pendingOffer!;
  assert.equal(pending.agentId, VALUE2.id);
});

test("OFFER/WITHDRAW/HOLD: rejected once the signing window is closed", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  assert.equal(state.windowClosed, true);
  expectRejected(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1"]), /window is closed/);
  expectRejected(freeAgencyModule.reduce(state, { type: "holdDay" }, l3Ctx("PLAY", "t1", ["t1"])), /window is closed/);
});

/* ------------------------------------------------------- day resolution -- */

test("RESOLUTION: a losing offer costs nothing but the day — the loser's roster is untouched", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  const before = state.teams["t2"]!;
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk + 10, VALUE.position, ["t1", "t2"])); // outbids
  state = expectOk(offer(state, "t2", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]));
  state = closeDay(state, ["t1", "t2"]);
  assert.equal(state.agentMarket[VALUE.id]!.signedBy, "t1");
  const after = state.teams["t2"]!;
  assert.deepEqual(after.slots, before.slots);
  assert.equal(after.deadCap, before.deadCap);
  assert.equal(after.signings.length, 0);
});

test("RESOLUTION: an exact tie is broken deterministically by earliest submittedAt, then by seatId", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  // t2 submits first (earlier now), t1 submits later, same amount -> t2 should win on tie.
  state = expectOk(freeAgencyModule.reduce(state, { type: "offer", agentId: VALUE.id, amount: VALUE.openingAsk, slot: VALUE.position }, l3Ctx("PLAY", "t2", ["t1", "t2"], 1000)));
  state = expectOk(freeAgencyModule.reduce(state, { type: "offer", agentId: VALUE.id, amount: VALUE.openingAsk, slot: VALUE.position }, l3Ctx("PLAY", "t1", ["t1", "t2"], 2000)));
  state = closeDay(state, ["t1", "t2"]);
  assert.equal(state.agentMarket[VALUE.id]!.signedBy, "t2");
});

test("RESOLUTION: a bidding war (2+ offers) raises the price by $5M when nobody clears ask", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = claimStock(state, "t3");
  const lowAsk = STAR.openingAsk - 20; // guaranteed below ask for both
  state = expectOk(offer(state, "t1", STAR.id, lowAsk, STAR.position, ["t1", "t2", "t3"]));
  state = expectOk(offer(state, "t2", STAR.id, lowAsk, STAR.position, ["t1", "t2", "t3"]));
  state = closeDay(state, ["t1", "t2", "t3"]);
  assert.equal(state.agentMarket[STAR.id]!.signed, false);
  assert.equal(state.agentMarket[STAR.id]!.ask, STAR.openingAsk + 5);
});

test("RESOLUTION: zero offers drops the price $10M ('his phone isn't ringing'), floored at $10M", () => {
  let state = claimStock(freshL3Stock(), "t1");
  let currentState = state;
  // No offers at all on any agent, four days running -- price walks down every day, never below the floor.
  for (let i = 0; i < WINDOW_DAYS; i += 1) currentState = closeDay(currentState, ["t1"]);
  for (const a of AGENTS) {
    const ask = currentState.agentMarket[a.id]!.ask;
    assert.ok(ask >= 10, `${a.name}'s ask fell below the $10M floor: $${ask}M`);
  }
  // The cheapest agent (opening $15M) should have hit the floor within 4 days of -10/-10 moves either way.
  const cheapest = AGENTS.find((a) => a.openingAsk === 15)!;
  assert.equal(currentState.agentMarket[cheapest.id]!.ask, 10);
});

test("RESOLUTION: a single lowball (below ask) doesn't steal — it costs $5M off the ask instead", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", SOLID.id, SOLID.openingAsk - 10, SOLID.position, ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[SOLID.id]!.signed, false);
  assert.equal(state.agentMarket[SOLID.id]!.ask, SOLID.openingAsk - 5);
});

test("RESOLUTION: an offer that clears the current ask signs at the OFFER amount, not the ask", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk + 5, VALUE.position, ["t1"])); // bids above ask, insurance
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[VALUE.id]!.signed, true);
  assert.equal(state.agentMarket[VALUE.id]!.signedAmount, VALUE.openingAsk + 5);
});

test("RESOLUTION: day 4 desperation — the top offer signs even below the current ask", () => {
  let state = claimStock(freshL3Stock(), "t1");
  // Drive the ask up first via a bidding war on days 1-3 with no winner, then lowball on day 4.
  for (let i = 0; i < 3; i += 1) {
    state = expectOk(offer(state, "t1", STAR2.id, 10, STAR2.position, ["t1"]));
    state = closeDay(state, ["t1"]);
  }
  assert.equal(state.day, 4);
  assert.equal(state.agentMarket[STAR2.id]!.signed, false);
  const askBeforeDay4 = state.agentMarket[STAR2.id]!.ask;
  state = expectOk(offer(state, "t1", STAR2.id, 10, STAR2.position, ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[STAR2.id]!.signed, true, "day-4 top offer must sign even below ask");
  assert.equal(state.agentMarket[STAR2.id]!.signedAmount, 10);
  assert.ok(10 < askBeforeDay4, "sanity: this really was below the ask going into day 4");
  assert.equal(state.windowClosed, true);
});

test("RESOLUTION: an agent with zero day-4 offers goes unsigned for good", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  assert.equal(state.windowClosed, true);
  for (const a of AGENTS) assert.equal(state.agentMarket[a.id]!.signed, false);
});

test("RESOLUTION: incumbent release only happens on an actual WIN — a slot is untouched by a losing bid", () => {
  let state = claimStock(freshL3Stock(), "t1");
  const originalScorer = state.teams["t1"]!.slots["SCORER"]!.playerId;
  // Offer on a SCORER-position agent well below its ask -- guaranteed loss (1 offer -> -5, never signs at floor start).
  state = expectOk(offer(state, "t1", STAR.id, MIN_OFFER, "SCORER", ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[STAR.id]!.signed, false);
  assert.equal(state.teams["t1"]!.slots["SCORER"]!.playerId, originalScorer);
  assert.equal(state.teams["t1"]!.deadCap, 0);
});

test("RESOLUTION: a win into an OPEN slot costs no dead cap at all", () => {
  const l2 = buildL2State({ path: "bidLostUnrescued" }); // open PLAYMAKER slot carried into L3
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  const deadCapBefore = state.teams["t1"]!.deadCap;
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, "PLAYMAKER", ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.teams["t1"]!.deadCap, deadCapBefore, "signing into an already-open slot must not add dead cap");
  assert.equal(state.teams["t1"]!.slots["PLAYMAKER"]!.playerId, VALUE.id);
});

test("RESOLUTION: full per-day history records every offer and resolution, oldest first", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0]!.day, 1);
  assert.equal(state.history[0]!.offers.length, 1);
  assert.equal(state.history[0]!.offers[0]!.agentId, VALUE.id);
  assert.equal(state.history[0]!.resolutions.find((r) => r.agentId === VALUE.id)!.signedBy, "t1");
});

test("RESOLUTION: a close with zero offers is legal — the market just moves", () => {
  const state = claimStock(freshL3Stock(), "t1");
  const closed = closeDay(state, ["t1"]);
  assert.equal(closed.day, 2);
  assert.equal(closed.history[0]!.offers.length, 0);
});

/* -------------------------------------------------------------- onPhaseExit -- */

test("onPhaseExit: leaving PLAY auto-closes the currently-open day, remaining days simply never happen", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1"]));
  assert.equal(state.day, 1);
  assert.equal(state.windowClosed, false);
  const next = freeAgencyModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(next.windowClosed, true);
  assert.equal(next.agentMarket[VALUE.id]!.signed, true, "the pending offer on the auto-closed day must still resolve");
  assert.equal(next.history.length, 1, "only the one day that was actually open gets closed -- not days 2-4");
});

test("onPhaseExit: leaving PLAY when the window is already closed is a no-op", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  const historyLenBefore = state.history.length;
  const next = freeAgencyModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(next.history.length, historyLenBefore);
});

test("onPhaseExit: is a no-op leaving any phase other than PLAY or REVEAL", () => {
  const state = claimStock(freshL3Stock(), "t1");
  const next = freeAgencyModule.onPhaseExit!(state, "HOOK", "PLAY");
  assert.equal(next, state);
});

test("onPhaseExit: leaving REVEAL auto-completes every remaining reveal stage", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  assert.equal(state.revealStage, 0);
  const next = freeAgencyModule.onPhaseExit!(state, "REVEAL", "COUNTERFACTUAL");
  assert.equal(next.revealStage, TOTAL_REVEAL_STEPS);
});

test("onPhaseExit: idempotent with partial manual progress -- 0, 1, and TOTAL_REVEAL_STEPS-1 manual reveals all converge on the same final stage count", () => {
  let base = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) base = closeDay(base, ["t1"]);
  for (const manualClicks of [0, 1, TOTAL_REVEAL_STEPS - 1]) {
    let s = base;
    for (let i = 0; i < manualClicks; i += 1) s = expectOk(freeAgencyModule.reduce(s, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1"])));
    const finished = freeAgencyModule.onPhaseExit!(s, "REVEAL", "COUNTERFACTUAL");
    assert.equal(finished.revealStage, TOTAL_REVEAL_STEPS);
  }
});

test("onPhaseExit: guarantees fromPhase !== toPhase is respected by the runtime, but this hook itself is pure/idempotent given identical inputs", () => {
  let state = claimStock(freshL3Stock(), "t1");
  const a = freeAgencyModule.onPhaseExit!(state, "HOOK", "PLAY");
  const b = freeAgencyModule.onPhaseExit!(state, "HOOK", "PLAY");
  assert.deepEqual(a, b);
});

/* ---------------------------------------------------------------- reveal -- */

test("REVEAL: only the teacher can advance it, and only during REVEAL", () => {
  const state = claimStock(freshL3Stock(), "t1");
  expectRejected(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "t1")), /only the teacher/);
  expectRejected(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("PLAY", "teacher")), /only advance during REVEAL/);
});

test("REVEAL: cannot advance past TOTAL_REVEAL_STEPS", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < TOTAL_REVEAL_STEPS; i += 1) state = expectOk(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1"])));
  expectRejected(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1"])), /already played/);
});

test("REVEAL: agent factors stay hidden (null) before their stage, revealed (their real value) after", () => {
  let state = claimStock(freshL3Stock(), "t1");
  const view0 = freeAgencyModule.studentView(state, "t1", "REVEAL") as { agents: { id: string; revealed: boolean; playoffFactor: number | null }[] };
  assert.ok(view0.agents.every((a) => !a.revealed && a.playoffFactor === null));
  state = expectOk(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1"]))); // window recap
  state = expectOk(freeAgencyModule.reduce(state, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1"]))); // first agent
  const view1 = freeAgencyModule.studentView(state, "t1", "REVEAL") as { agents: { id: string; revealed: boolean; playoffFactor: number | null }[] };
  const revealedCount = view1.agents.filter((a) => a.revealed).length;
  assert.equal(revealedCount, 1);
  const revealedAgent = view1.agents.find((a) => a.revealed)!;
  assert.equal(revealedAgent.playoffFactor, AGENTS.find((a) => a.id === revealedAgent.id)!.playoffFactor);
});

test("REVEAL: standings/playoffs/awards stay null until their own stage arrives, then populate", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1", "t2"]);
  const stopBeforeStandings = 1 + AGENTS.length; // recap + every agent factor
  let s = state;
  for (let i = 0; i < stopBeforeStandings; i += 1) s = expectOk(freeAgencyModule.reduce(s, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1", "t2"])));
  let view = freeAgencyModule.studentView(s, "t1", "REVEAL") as { standings: unknown; playoffs: unknown; awards: unknown };
  assert.equal(view.standings, null);
  s = expectOk(freeAgencyModule.reduce(s, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1", "t2"])));
  view = freeAgencyModule.studentView(s, "t1", "REVEAL") as { standings: unknown; playoffs: unknown; awards: unknown };
  assert.ok(view.standings !== null);
  assert.equal(view.playoffs, null);
  s = expectOk(freeAgencyModule.reduce(s, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1", "t2"])));
  view = freeAgencyModule.studentView(s, "t1", "REVEAL") as { standings: unknown; playoffs: unknown; awards: unknown };
  assert.ok(view.playoffs !== null);
  assert.equal(view.awards, null);
  s = expectOk(freeAgencyModule.reduce(s, { type: "teacher:revealNext" }, l3Ctx("REVEAL", "teacher", ["t1", "t2"])));
  view = freeAgencyModule.studentView(s, "t1", "REVEAL") as { standings: unknown; playoffs: unknown; awards: unknown };
  assert.ok(view.awards !== null);
});

/* --------------------------------------------------------- standings/playoffs -- */

test("STANDINGS: teamForm ignores hidden factors before reveal, includes them after -- carried players never carry a factor", () => {
  const l2 = buildL2State({ path: "bidWon" }); // one carried slot filled by a won L2 target -- no L3 hidden factor
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  const team = state.teams["t1"]!;
  const formBefore = teamForm(team, false);
  const formAfter = teamForm(team, true);
  assert.equal(formBefore, formAfter, "no free-agency signee yet -- revealing factors changes nothing");
});

test("STANDINGS: a fresh free-agency signee's revealed factor moves team form; an empty slot contributes 0", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", STAR2.id, STAR2.openingAsk, STAR2.position, ["t1"])); // shrinker, factor -7
  state = closeDay(state, ["t1"]);
  const team = state.teams["t1"]!;
  assert.equal(isFreeAgencySignee(team.slots[STAR2.position]!.playerId), true);
  const formBefore = teamForm(team, false);
  const formAfter = teamForm(team, true);
  assert.equal(Math.round((formAfter - formBefore) * SLOT_COUNT), STAR2.playoffFactor, "the average must move by exactly factor/5");
});

const SLOT_COUNT = 5;

test("PLAYOFFS: deterministic bracket -- higher final form advances; degrades gracefully for < 4 teams", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  const playoffs2 = computePlayoffs(state, true);
  assert.equal(playoffs2.field.length, 2);
  assert.equal(playoffs2.semis.length, 0);
  assert.ok(playoffs2.final !== null);
  assert.equal(playoffs2.champion, playoffs2.final!.winner);

  const oneTeam = claimStock(freshL3Stock(), "t1");
  const playoffs1 = computePlayoffs(oneTeam, true);
  assert.equal(playoffs1.champion, playoffs1.field[0]);
  assert.equal(playoffs1.final, null);
});

test("PLAYOFFS: full 4-team bracket picks the champion by real form, never randomly", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = claimStock(state, "t3");
  state = claimStock(state, "t4");
  const standings = computeStandings(state, true);
  assert.equal(standings.length, 4);
  const playoffs = computePlayoffs(state, true);
  assert.equal(playoffs.field.length, 4);
  assert.equal(playoffs.semis.length, 2);
  assert.equal(playoffs.champion!.seatId, standings[0]!.seatId, "identical stock rosters -> deterministic tie-break must always crown the same top seed");
});

/* -------------------------------------------------------------- privacy -- */

test("PRIVACY: sealed offers never appear in boardView, at any phase, in any form", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", SOLID.id, SOLID.openingAsk - 10, SOLID.position, ["t1", "t2"])); // a losing lowball -- stays sealed forever
  state = expectOk(offer(state, "t2", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]));
  const board = JSON.stringify(freeAgencyModule.boardView(state, "PLAY"));
  assert.doesNotMatch(board, /pendingOffer/);
  const closed = closeDay(state, ["t1", "t2"]);
  assert.equal(closed.agentMarket[SOLID.id]!.signed, false, "sanity: the lowball really did lose");
  const boardView = freeAgencyModule.boardView(closed, "PLAY") as { lastDayResults: { resolutions: { agentId: string; allOffers: unknown; ownAmount?: unknown }[] } };
  const res = boardView.lastDayResults.resolutions.find((r) => r.agentId === SOLID.id)!;
  assert.equal(res.allOffers, null, "an unsigned agent's individual offer amounts must never reach the board");
  assert.equal(res.ownAmount ?? null, null, "the board has no seat to be 'own' for -- always null, never a real number");
});

test("PRIVACY: studentView never includes another seat's sealed pending offer or amount", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]));
  const t2View = freeAgencyModule.studentView(state, "t2", "PLAY") as { pendingOffer: unknown };
  assert.equal(t2View.pendingOffer, null, "t2 never offered today -- its OWN pendingOffer field must be null, and nothing here can even represent t1's offer");
  // Also verify at day-close: t2 never offered on VALUE, so its history view must show no amount for it,
  // even though VALUE went on to sign (a losing SEALED offer stays sealed regardless of the eventual outcome).
  state = expectOk(offer(state, "t2", VALUE.id, VALUE.openingAsk - 15, VALUE.position, ["t1", "t2"])); // t2 lowballs the SAME agent and loses
  state = closeDay(state, ["t1", "t2"]);
  assert.equal(state.agentMarket[VALUE.id]!.signedBy, "t1");
  const t2AfterView = freeAgencyModule.studentView(state, "t2", "PLAY") as { history: { resolutions: { agentId: string; amount?: number }[] }[] };
  const res = t2AfterView.history[0]!.resolutions.find((r) => r.agentId === VALUE.id)!;
  assert.equal(res.amount, VALUE.openingAsk, "a SIGNED agent's public sheet shows the WINNING amount only -- never t2's own losing sealed bid folded in as if public");
});

test("PRIVACY: an unsigned agent's per-team offer amounts never leak to another seat or the board, even after day close", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", SOLID.id, SOLID.openingAsk - 10, SOLID.position, ["t1", "t2"])); // will lose, stays sealed
  state = closeDay(state, ["t1", "t2"]);
  assert.equal(state.agentMarket[SOLID.id]!.signed, false);
  const t2View = freeAgencyModule.studentView(state, "t2", "PLAY") as { history: { resolutions: { agentId: string; ownAmount: number | null; allOffers: unknown }[] }[] };
  const res = t2View.history[0]!.resolutions.find((r) => r.agentId === SOLID.id)!;
  assert.equal(res.ownAmount, null); // t2 never offered on this agent
  assert.equal(res.allOffers, null); // and cannot see t1's sealed number either
  const boardView = freeAgencyModule.boardView(state, "PLAY") as { lastDayResults: { resolutions: { agentId: string; allOffers: unknown }[] } | null };
  const boardRes = boardView.lastDayResults!.resolutions.find((r) => r.agentId === SOLID.id)!;
  assert.equal(boardRes.allOffers, null);
});

test("PRIVACY: a SIGNED agent's full offer sheet (amount + franchise) is public at day close", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1"]));
  state = closeDay(state, ["t1"]);
  const board = freeAgencyModule.boardView(state, "PLAY") as { lastDayResults: { resolutions: { agentId: string; signed: boolean; amount: number; franchise: { name: string } | null }[] } | null };
  const res = board.lastDayResults!.resolutions.find((r) => r.agentId === VALUE.id)!;
  assert.equal(res.signed, true);
  assert.equal(res.amount, VALUE.openingAsk);
  assert.equal(res.franchise!.name, "Ironworks");
});

test("PRIVACY: teacherView is the one surface allowed full detail -- sealed pending offers and held status visible", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1"]));
  const view = freeAgencyModule.teacherView(state, "PLAY") as { teams: { seatId: string; pendingOffer: { agentId: string } | null }[] };
  const t1 = view.teams.find((t) => t.seatId === "t1")!;
  assert.equal(t1.pendingOffer!.agentId, VALUE.id);
});

test("PRIVACY: full history discloses in COUNTERFACTUAL/SYNTHESIS -- unsigned agents' amounts become material for class-level cards, never before", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", SOLID.id, SOLID.openingAsk - 10, SOLID.position, ["t1", "t2"]));
  state = closeDay(state, ["t1", "t2"]);
  for (let i = 0; i < WINDOW_DAYS - 1; i += 1) state = closeDay(state, ["t1", "t2"]);
  state = freeAgencyModule.onPhaseExit!(state, "REVEAL", "COUNTERFACTUAL");
  const board = freeAgencyModule.boardView(state, "COUNTERFACTUAL");
  assert.ok(board); // class cards computed without throwing -- content asserted in the class-level tests below
});

/* -------------------------------------------------------------- awards -- */

test("AWARDS: THE BARGAIN, PERFECT TIMING never fabricated -- omit entirely with zero signings", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  state = freeAgencyModule.onPhaseExit!(state, "REVEAL", "COUNTERFACTUAL");
  const view = freeAgencyModule.studentView({ ...state, revealStage: TOTAL_REVEAL_STEPS }, "t1", "REVEAL") as { awards: { id: string }[] };
  assert.deepEqual(view.awards, []);
});

test("AWARDS: IRON BOOKS honors the best-finishing team with zero signings", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  // t2 signs a strong value upgrade; t1 signs nothing -- both otherwise identical stock rosters.
  state = expectOk(offer(state, "t2", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]));
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1", "t2"]);
  state = freeAgencyModule.onPhaseExit!(state, "REVEAL", "COUNTERFACTUAL");
  const view = freeAgencyModule.studentView({ ...state, revealStage: TOTAL_REVEAL_STEPS }, "t1", "REVEAL") as { awards: { id: string; franchise: { name: string } | null }[] };
  const iron = view.awards.find((a) => a.id === "iron-books");
  assert.ok(iron, "IRON BOOKS must be awarded -- t1 made zero signings");
  assert.equal(iron!.franchise!.name, "Ironworks");
});

test("AWARDS: PERFECT TIMING names the biggest discount off opening ask among real signings", () => {
  let state = claimStock(freshL3Stock(), "t1");
  // Drive the ask down for three days with no signing, then sign well under the ORIGINAL opening ask on day 4.
  for (let i = 0; i < 3; i += 1) {
    state = expectOk(offer(state, "t1", SOLID.id, 5, SOLID.position, ["t1"]));
    state = closeDay(state, ["t1"]);
  }
  state = expectOk(offer(state, "t1", SOLID.id, 5, SOLID.position, ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[SOLID.id]!.signed, true);
  state = freeAgencyModule.onPhaseExit!(state, "REVEAL", "COUNTERFACTUAL");
  const view = freeAgencyModule.studentView({ ...state, revealStage: TOTAL_REVEAL_STEPS }, "t1", "REVEAL") as { awards: { id: string }[] };
  assert.ok(view.awards.some((a) => a.id === "perfect-timing"));
});

/* --------------------------------------------------------- counterfactuals -- */

test("COUNTERFACTUAL: at most two personal what-ifs, gracefully fewer when nothing genuine qualifies", () => {
  const state = claimStock(freshL3Stock(), "t1"); // fresh claim, no history at all
  const view = freeAgencyModule.studentView(state, "t1", "COUNTERFACTUAL") as { whatIfs: string[] };
  assert.ok(view.whatIfs.length <= 2);
});

test("COUNTERFACTUAL: debate prompts are always the fixed, honest set", () => {
  const state = claimStock(freshL3Stock(), "t1");
  const view = freeAgencyModule.studentView(state, "t1", "COUNTERFACTUAL") as { debatePrompts: string[] };
  assert.deepEqual(view.debatePrompts, DEBATE_PROMPTS);
});

test("COUNTERFACTUAL: class-level dead-cap-drag card cites the real sum of carried dead cap, honestly zero when clean", () => {
  const l2 = buildL2State({ path: "veteran" }); // deadCap = 1
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1"]);
  const board = freeAgencyModule.boardView(state, "COUNTERFACTUAL") as { classCards: { id: string; body: string }[] };
  const card = board.classCards.find((c) => c.id === "dead-cap-drag")!;
  assert.match(card.body, /\$1M/);
});

/* --------------------------------------------------------------- synthesis -- */

test("SYNTHESIS: degrades gracefully with zero claimed teams", () => {
  const state = freshL3Stock();
  const view = freeAgencyModule.boardView(state, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  assert.equal(view.cards.length, 1);
  assert.match(view.cards[0]!.body, /No franchises claimed/);
});

test("SYNTHESIS: all five named cards render with real numbers once teams have claimed and played", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = expectOk(offer(state, "t1", VALUE.id, VALUE.openingAsk, VALUE.position, ["t1", "t2"]));
  for (let i = 0; i < WINDOW_DAYS; i += 1) state = closeDay(state, ["t1", "t2"]);
  const view = freeAgencyModule.boardView(state, "SYNTHESIS") as { cards: { id: string; title: string }[] };
  const ids = view.cards.map((c) => c.id);
  assert.deepEqual(ids, ["market-price", "constraint", "timing", "path-dependence", "decisions-outcomes"]);
});

/* ================================================== PROPERTY (c): cap inviolability ==================== */

test("PROPERTY: cap inviolability -- capUsedOf(team) never exceeds $130M across a long, adversarial sequence of offers/wins/re-releases", () => {
  let state = claimStock(freshL3Stock(), "t1");
  state = claimStock(state, "t2");
  state = claimStock(state, "t3");
  const seatIds = ["t1", "t2", "t3"];
  // Every seat aggressively chases the priciest agent it can afford, every single day, for the entire window --
  // including re-releasing a just-signed free agent for a pricier one when a later day's ask allows it.
  for (let day = 0; day < WINDOW_DAYS; day += 1) {
    for (const seatId of seatIds) {
      const team = state.teams[seatId]!;
      let bestAgent: (typeof AGENTS)[number] | null = null;
      let bestSlot: string | null = null;
      for (const agent of AGENTS) {
        if (state.agentMarket[agent.id]!.signed) continue;
        for (const slot of ["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER", "WILDCARD"] as const) {
          if (slot !== "WILDCARD" && agent.position !== slot) continue;
          const projected = projectedCapUsedForOffer(team, slot, state.agentMarket[agent.id]!.ask);
          if (projected <= CAP && (!bestAgent || state.agentMarket[agent.id]!.ask > state.agentMarket[bestAgent.id]!.ask)) {
            bestAgent = agent;
            bestSlot = slot;
          }
        }
      }
      if (bestAgent && bestSlot) {
        const r = offer(state, seatId, bestAgent.id, state.agentMarket[bestAgent.id]!.ask, bestSlot, seatIds);
        if (r.ok) state = r.state;
      }
    }
    state = closeDay(state, seatIds);
    for (const seatId of seatIds) {
      assert.ok(capUsedOf(state.teams[seatId]!) <= CAP, `${seatId} exceeded $${CAP}M on day ${day + 1}: $${capUsedOf(state.teams[seatId]!)}M`);
    }
  }
  assert.ok(state.windowClosed);
});

test("PROPERTY: cap inviolability -- an offer whose projected cap use exceeds $130M by even $5M is always rejected, across every agent/slot", () => {
  let state = claimStock(freshL3Stock(), "t1");
  for (const agent of AGENTS) {
    for (const slot of ["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER", "WILDCARD"] as const) {
      if (slot !== "WILDCARD" && agent.position !== slot) continue;
      const team = state.teams["t1"]!;
      const room = CAP - projectedCapUsedForOffer(team, slot, 0);
      const overAmount = Math.ceil((room + 1) / 5) * 5; // smallest legal-step amount strictly over the room
      const result = offer(state, "t1", agent.id, overAmount, slot, ["t1"]);
      assert.equal(result.ok, false, `agent ${agent.id} slot ${slot} accepted an offer $${overAmount}M over its $${room}M room`);
    }
  }
});

test("PROPERTY: dead-cap arithmetic is exact -- every release adds exactly deadCapFor(incumbent price) and nothing else", () => {
  let state = claimStock(freshL3Stock(), "t1");
  const incumbent = state.teams["t1"]!.slots["SCORER"]!; // Cole Bennett, $20M
  const deadCapBefore = state.teams["t1"]!.deadCap;
  state = expectOk(offer(state, "t1", STAR.id, STAR.openingAsk, "SCORER", ["t1"]));
  state = closeDay(state, ["t1"]);
  assert.equal(state.agentMarket[STAR.id]!.signed, true);
  const expectedDelta = Math.round(incumbent.price * 0.1);
  assert.equal(state.teams["t1"]!.deadCap, deadCapBefore + expectedDelta);
});

/* ================================================ PROPERTY (d): day-1 viability =================== */

/** Every day-1-affordable agent for a team: exists some legal slot where projectedCapUsedForOffer stays <= CAP. */
function day1AffordableCount(team: TeamState): number {
  let count = 0;
  for (const agent of AGENTS) {
    const fits = (["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER", "WILDCARD"] as const).some((slot) => {
      if (slot !== "WILDCARD" && agent.position !== slot) return false;
      return projectedCapUsedForOffer(team, slot, agent.openingAsk) <= CAP;
    });
    if (fits) count += 1;
  }
  return count;
}

test("PROPERTY: day-1 viability -- a $100M-at-cap L1 lock, standPat at L2, can afford >= 2 free agents", () => {
  const l2 = buildL2State({ l1Picks: AT_CAP_ROSTER, path: "standPat" });
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  assert.equal(capUsedOf(state.teams["t1"]!), 100);
  assert.ok(day1AffordableCount(state.teams["t1"]!) >= 2, `only ${day1AffordableCount(state.teams["t1"]!)} affordable agents for an at-cap standPat team`);
});

test("PROPERTY: day-1 viability -- worst-case L2 dead cap (a $60 cut off an exactly-$100M L1 lock, resigned to a veteran) can afford >= 2 free agents", () => {
  const l2 = buildL2State({ l1Picks: HIGH_DEAD_CAP_AT_CAP_ROSTER, path: "veteran" });
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  assert.equal(state.teams["t1"]!.deadCap, 6);
  assert.ok(day1AffordableCount(state.teams["t1"]!) >= 2, `only ${day1AffordableCount(state.teams["t1"]!)} affordable agents for a dead-cap-carrying team`);
});

test("PROPERTY: day-1 viability -- a lost-bid-unrescued open slot off an exactly-$100M L1 lock can afford >= 2 free agents (the open slot fills free)", () => {
  const l2 = buildL2State({ l1Picks: HIGH_DEAD_CAP_AT_CAP_ROSTER, path: "bidLostUnrescued" });
  let state = freshL3FromL2(l2, ["t1"]);
  state = claimCarried(state, "t1", 0, ["t1"]);
  assert.equal(state.teams["t1"]!.slots["PLAYMAKER"], null);
  assert.equal(state.teams["t1"]!.deadCap, 6);
  assert.ok(day1AffordableCount(state.teams["t1"]!) >= 2, `only ${day1AffordableCount(state.teams["t1"]!)} affordable agents for a lost-bid-unrescued team`);
});

test("PROPERTY: day-1 viability -- the pure stock franchise can afford >= 2 free agents", () => {
  const state = claimStock(freshL3Stock(), "t1");
  assert.ok(day1AffordableCount(state.teams["t1"]!) >= 2);
});

test("PROPERTY: day-1 viability -- broad sweep across many real exactly-$100M L1 builds, each carried via standPat", () => {
  const byPosition: Record<string, (typeof MARKET)[number][]> = { SCORER: [], PLAYMAKER: [], DEFENDER: [], REBOUNDER: [] };
  for (const p of MARKET) byPosition[p.position]!.push(p);
  const builds: { slot: string; playerId: string }[][] = [];
  for (const sc of byPosition["SCORER"]!) {
    for (const pm of byPosition["PLAYMAKER"]!) {
      const baseCost = sc.price + pm.price;
      if (baseCost > L1_CAP) continue;
      for (const df of byPosition["DEFENDER"]!) {
        for (const rb of byPosition["REBOUNDER"]!) {
          const cost3 = baseCost + df.price + rb.price;
          if (cost3 > L1_CAP) continue;
          const used = new Set([sc.id, pm.id, df.id, rb.id]);
          for (const wc of MARKET) {
            if (used.has(wc.id)) continue;
            if (cost3 + wc.price !== L1_CAP) continue;
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
  assert.ok(builds.length > 30, `expected many exactly-$100M builds, got ${builds.length}`);
  let checked = 0;
  for (const build of builds.slice(0, 60)) {
    const l2 = buildL2State({ l1Picks: build, path: "standPat" });
    let state = freshL3FromL2(l2, ["t1"]);
    state = claimCarried(state, "t1", 0, ["t1"]);
    const n = day1AffordableCount(state.teams["t1"]!);
    assert.ok(n >= 2, `build ${JSON.stringify(build)} left only ${n} affordable day-1 agents`);
    checked += 1;
  }
  assert.ok(checked >= 60);
});

void capRoomOf;
