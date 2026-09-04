/**
 * WHAT LEAVES THE SEASON — the seed reader Week 3 calls.
 *
 * Same discipline as `sameLineCarry.test.ts`: play a real room through the
 * module's own reducer, wrap it in the exact envelope shape
 * `sessionService.createSession` builds, and read it back. A carry says only
 * what the room actually did, refuses the wrong band outright, and drops one
 * bad desk without losing a good classmate.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { sameLineL2Module as mod, SAME_LINE_L2_ID, type SameLineL2State } from "../modules/sameLine/l2.js";
import { extractSeasonCarry, SEASON_CARRY_VERSION, defaultPicksFor } from "../modules/sameLine/seasonCarry.js";
import { FEBRUARY_MARKET } from "../modules/sameLine/seasonData.js";
import { CLUB } from "../modules/sameLine/world.js";
import type { CanonicalPhase } from "../shared/phases.js";
import type { GradeBand } from "../shared/gradeBand.js";

const ctx = (phase: CanonicalPhase, seatId: string, seatIds: string[] = [seatId]) => ({ phase, seatId, seatIds, now: 1_760_000_000_000 });
type Ok = { ok: true; state: SameLineL2State };

function step(s: SameLineL2State, action: { type: string; [k: string]: unknown }, phase: CanonicalPhase, seatId: string): SameLineL2State {
  const r = mod.reduce(s, action, ctx(phase, seatId));
  assert.ok(r.ok, r.ok ? "" : `${action.type} by ${seatId}: ${r.reason}`);
  return (r as Ok).state;
}

/** One desk, signed a ten-day in January and a February buyout, real reducer path. */
function playedRoom(band: GradeBand, sessionId = "src"): SameLineL2State {
  let s = mod.initialState({ sessionId, seatIds: [], gradeBand: band });
  s = step(s, { type: "claimDesk" }, "LOBBY", "a");
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "WING", chip: "I need the roster spot", line: "a January minimum charge" }, "PLAY", "a");
  s = step(s, { type: "teacher:closeWindow" }, "PLAY", "teacher");
  s = { ...s, round: "FEBRUARY" } as SameLineL2State;
  const candidate = FEBRUARY_MARKET.find((c) => c.preWaiverSalary === 0)!;
  s = step(s, { type: "sign", playerId: candidate.id, chip: "I need the money", line: "the rest of my roster flexibility" }, "ADAPT", "a");
  s = step(s, { type: "teacher:closeWindow" }, "ADAPT", "teacher");
  assert.equal(s.windowClosed, true);
  return s;
}

function envelope(state: SameLineL2State, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lessonModuleId: SAME_LINE_L2_ID,
    state,
    sourceSessionId: state.sessionId,
    sourcePhase: "COMPLETE",
    sourceEnded: true,
    sourceGradeBand: state.gradeBand,
    ...over,
  };
}

test("a played room carries a franchise with its January and February pickups, and its own picks", () => {
  const s = playedRoom("5-6");
  const carry = extractSeasonCarry(envelope(s), "5-6");
  assert.ok(carry.ok, carry.ok ? "" : carry.reason);
  assert.equal(carry.version, SEASON_CARRY_VERSION);
  assert.equal(carry.franchises.length, 1);
  const f = carry.franchises[0]!;
  assert.equal(f.clubId, "memphis");
  assert.equal(f.roster.filter((r) => r.acquiredWeek === 2).length, 2, "one January and one February pickup");
  const january = f.roster.find((r) => r.name.includes("ten-day"));
  assert.ok(january);
  assert.equal(january!.jobState, "UNPLAYED", "a week-2 pickup has no authored report yet");
  assert.deepEqual(f.picks, defaultPicksFor("memphis", 0));
  assert.equal(f.committed, s.desks["a"]!.position.committed);
  assert.equal(f.taxSalary, s.desks["a"]!.position.taxSalary);
});

test("a room from the other band is refused outright", () => {
  const s = playedRoom("7-8");
  const carry = extractSeasonCarry(envelope(s), "5-6");
  assert.equal(carry.ok, false);
  assert.match(carry.ok ? "" : carry.reason, /grades 7-8 room and this is a grades 5-6 room/);
});

test("the wrong module and a stateless envelope are each refused with a reason", () => {
  assert.equal(extractSeasonCarry(undefined, "5-6").ok, false);
  assert.equal(extractSeasonCarry({ lessonModuleId: "m1l1-the-window", state: {} }, "5-6").ok, false);
  const noState = extractSeasonCarry({ lessonModuleId: SAME_LINE_L2_ID, sourceGradeBand: "5-6" }, "5-6");
  assert.equal(noState.ok, false);
});

test("one malformed desk is dropped with a reason, and a good classmate survives", () => {
  let s = playedRoom("5-6");
  s = step(s, { type: "claimDesk" }, "LOBBY", "b"); // second desk, untouched — the good classmate
  const broken = {
    ...s,
    desks: {
      ...s.desks,
      a: { ...s.desks["a"]!, position: { ...s.desks["a"]!.position, committed: -5 } },
    },
  };
  const carry = extractSeasonCarry(envelope(broken as unknown as SameLineL2State), "5-6");
  assert.ok(carry.ok);
  assert.equal(carry.franchises.length, 1);
  assert.equal(carry.franchises[0]!.sourceSeatId, "b");
  assert.ok(carry.warnings.some((w) => /Dropped/.test(w)));
});

test("waiving carries as dead money owed, never as a change to this season's committed", () => {
  let s = playedRoom("5-6");
  s = {
    ...s,
    round: "FEBRUARY",
    windowClosed: false,
    desks: {
      a: {
        ...s.desks["a"]!,
        position: {
          ...s.desks["a"]!.position,
          signings: [
            ...s.desks["a"]!.position.signings,
            { playerId: "nance", name: "Larry Nance Jr.", role: "BIG", annual: 4_000_000, tool: "roomMle", years: 1, coveredThrough: "2026-27" },
          ],
        },
      },
    },
  } as SameLineL2State;
  const beforeCommitted = s.desks["a"]!.position.committed;
  s = step(s, { type: "waive", contractId: "nance", chip: "I need the roster spot", line: "the last month of a deal I already paid for" }, "ADAPT", "a");
  const carry = extractSeasonCarry(envelope(s), "5-6");
  assert.ok(carry.ok);
  const f = carry.franchises[0]!;
  assert.equal(f.committed, beforeCommitted, "a waive never changes this season's committed");
  assert.equal(f.deadMoneyIncurred, 4_000_000);
  assert.ok(!f.roster.some((r) => r.contractId === "nance"), "a waived contract does not carry as a live roster entry");
});

test("tape is EVIDENCE only — never read by a reducer, and the carry passes it through unread", () => {
  const s = playedRoom("5-6");
  // Same mutation-test idiom as sameLineL2.test.ts's own reducer test: strip
  // the tape and confirm no reachable position moves, so the carry's own
  // "never read by a reducer" claim about `tape` is not merely asserted here.
  const stripped = { ...s, tape: [] } as SameLineL2State;
  const r = mod.reduce(stripped, { type: "claimDesk" }, ctx("LOBBY", "z"));
  assert.ok(r.ok);
  assert.deepEqual((r as Ok).state.desks["a"], s.desks["a"]);
  const carry = extractSeasonCarry(envelope(s), "5-6");
  assert.ok(carry.ok);
  assert.ok(carry.franchises[0]!.tape.length > 0, "the carry still hands the tape forward as evidence");
});

test("defaultPicksFor is deterministic and labels the franchise's own club", () => {
  const p1 = defaultPicksFor("boston", 0);
  const p2 = defaultPicksFor("boston", 0);
  assert.deepEqual(p1, p2);
  assert.equal(p1.length, 2);
  assert.ok(p1.every((p) => p.label.includes(CLUB.boston.name)));
  assert.notDeepEqual(defaultPicksFor("boston", 0), defaultPicksFor("boston", 1));
});
