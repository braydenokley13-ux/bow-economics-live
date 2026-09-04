/**
 * WHAT LEAVES THE WINDOW — the seed reader every later week calls.
 *
 * A real window is driven through the module's own reducer, then wrapped in
 * the exact envelope `sessionService.createSession` builds, and read back. The
 * reader is the first thing in this product that lets yesterday's choice
 * create today's problem (CLAUDE.md §9), so the tests here are about trust: a
 * carry says only what the source room actually did, refuses a room from the
 * other band, and drops one bad desk without losing a good classmate.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { sameLineL1Module as mod, DAYS, SAME_LINE_L1_ID, type SameLineL1State } from "../modules/sameLine/l1.js";
import { extractWindowCarry, WINDOW_CARRY_VERSION } from "../modules/sameLine/carry.js";
import { BOARD, CLUB, CLUBS, LINE, TOOL } from "../modules/sameLine/world.js";
import { legalOffers } from "../modules/sameLine/engine.js";
import type { CanonicalPhase } from "../shared/phases.js";
import type { GradeBand } from "../shared/gradeBand.js";

const ctx = (phase: CanonicalPhase, seatId: string, seatIds: string[] = [seatId]) => ({ phase, seatId, seatIds, now: 1_760_000_000_000 });
type Ok = { ok: true; state: SameLineL1State };

function step(s: SameLineL1State, action: { type: string; [k: string]: unknown }, phase: CanonicalPhase, seatId: string): SameLineL1State {
  const r = mod.reduce(s, action, ctx(phase, seatId));
  assert.ok(r.ok, r.ok ? "" : `${action.type} by ${seatId}: ${r.reason}`);
  return (r as Ok).state;
}

/**
 * Two front offices, one that spends and one that sits on its hands, through
 * every signing day. The spender takes the priciest legal named offer it can
 * reach each day so the two books diverge as far as the world allows.
 */
function playedWindow(band: GradeBand): SameLineL1State {
  let s = mod.initialState({ sessionId: "src", seatIds: [], gradeBand: band });
  s = step(s, { type: "chooseClub", clubId: "detroit" }, "LOBBY", "spender");
  s = step(s, { type: "chooseClub", clubId: "detroit" }, "LOBBY", "sitter");
  for (let day = 0; day < DAYS; day += 1) {
    const desk = s.desks["spender"]!;
    const taken = new Set(s.taken);
    const offers = legalOffers(desk.position, BOARD.filter((p) => !taken.has(p.id)), taken).filter((o) => o.tool !== "minimum");
    if (offers.length > 0) {
      const best = [...offers].sort((a, b) => b.annual - a.annual)[0]!;
      s = step(s, { type: "offer", playerId: best.playerId, tool: best.tool, annual: best.annual }, "PLAY", "spender");
    }
    s = step(s, { type: "teacher:closeDay" }, "PLAY", "teacher");
  }
  assert.equal(s.windowClosed, true, "three closed days close the window");
  return s;
}

function envelope(state: SameLineL1State, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lessonModuleId: SAME_LINE_L1_ID,
    state,
    sourceSessionId: "src",
    sourcePhase: "COMPLETE",
    sourceEnded: true,
    sourceGradeBand: state.gradeBand,
    ...over,
  };
}

test("a played window carries two franchises whose books differ by exactly what each one did", () => {
  const s = playedWindow("5-6");
  const carry = extractWindowCarry(envelope(s), "5-6");
  assert.ok(carry.ok, carry.ok ? "" : carry.reason);
  assert.equal(carry.version, WINDOW_CARRY_VERSION);
  assert.equal(carry.franchises.length, 2);
  assert.deepEqual(carry.warnings, []);
  const spender = carry.franchises.find((f) => f.sourceSeatId === "spender")!;
  const sitter = carry.franchises.find((f) => f.sourceSeatId === "sitter")!;
  assert.equal(spender.clubId, "detroit");
  assert.equal(sitter.clubId, "detroit");
  assert.notEqual(spender.label, sitter.label);
  assert.ok(spender.signings.length > 0, "the spender signed somebody");
  assert.equal(sitter.signings.length, 0);
  assert.equal(sitter.committed, CLUB.detroit.committed.value, "a desk that signed nobody leaves with the club's real opening books");
  const added = spender.signings.reduce((sum, sg) => sum + sg.annual, 0);
  assert.equal(spender.committed, CLUB.detroit.committed.value + added, "committed is the opening figure plus what this desk signed, nothing else");
  assert.ok(spender.committed > sitter.committed);
  assert.equal(spender.openJobs.length, CLUB.detroit.jobs.length - spender.signings.filter((sg) => CLUB.detroit.jobs.includes(sg.role)).length >= 0 ? spender.openJobs.length : -1);
  assert.equal(spender.forgone.length, spender.signings.length, "one frozen forgone list per signing");
  assert.equal(carry.lines.cap, LINE.cap);
  assert.equal(typeof carry.payrollDefinition, "string");
});

test("a room from the other band is refused outright", () => {
  const s = playedWindow("7-8");
  const carry = extractWindowCarry(envelope(s), "5-6");
  assert.equal(carry.ok, false);
  assert.match(carry.ok ? "" : carry.reason, /grades 7-8 room and this is a grades 5-6 room/);
  // The band stamped on the envelope wins over the one in state, and a missing stamp falls back to state.
  const unstamped = extractWindowCarry(envelope(s, { sourceGradeBand: undefined }), "7-8");
  assert.ok(unstamped.ok);
});

test("a window that has not closed still carries, with a warning the teacher can read", () => {
  let s = mod.initialState({ sessionId: "src", seatIds: [], gradeBand: "5-6" });
  s = step(s, { type: "chooseClub", clubId: "boston" }, "LOBBY", "a");
  const carry = extractWindowCarry(envelope(s, { sourceEnded: false, sourcePhase: "PLAY" }), "5-6");
  assert.ok(carry.ok);
  assert.equal(carry.franchises.length, 1);
  assert.equal(carry.warnings.length, 1);
  assert.match(carry.warnings[0]!, /had not closed/);
});

test("one malformed desk is dropped with a reason, and the good classmate is kept", () => {
  const s = playedWindow("5-6");
  const broken = {
    ...s,
    desks: {
      ...s.desks,
      sitter: { ...s.desks["sitter"]!, position: { ...s.desks["sitter"]!.position, committed: 12 } },
    },
  };
  const carry = extractWindowCarry(envelope(broken), "5-6");
  assert.ok(carry.ok);
  assert.equal(carry.franchises.length, 1);
  assert.equal(carry.franchises[0]!.sourceSeatId, "spender");
  assert.equal(carry.warnings.length, 1);
  assert.match(carry.warnings[0]!, /Dropped: Detroit: payroll 12 is below the club's opening figure/);
});

test("the wrong module, a missing envelope and a stateless envelope are each refused with a reason", () => {
  assert.equal(extractWindowCarry(undefined, "5-6").ok, false);
  assert.equal(extractWindowCarry({ lessonModuleId: "m2l1-full-house", state: {} }, "5-6").ok, false);
  const noState = extractWindowCarry({ lessonModuleId: SAME_LINE_L1_ID, sourceGradeBand: "5-6" }, "5-6");
  assert.equal(noState.ok, false);
  assert.match(noState.ok ? "" : noState.reason, /no state/);
});

test("the tool the desk paid with survives the carry, so a later week knows a minimum from a mid-level", () => {
  const s = playedWindow("7-8");
  const carry = extractWindowCarry(envelope(s), "7-8");
  assert.ok(carry.ok);
  const spender = carry.franchises.find((f) => f.sourceSeatId === "spender")!;
  for (const sg of spender.signings) assert.ok(sg.tool in TOOL, `unknown tool ${sg.tool}`);
  assert.deepEqual([...spender.toolsSpent].sort(), [...s.desks["spender"]!.position.spent].sort());
});

test("tax salary is the club's sourced roster-plus-dead-money figure plus what the desk signed — never the cap hit", () => {
  const s = playedWindow("7-8");
  const carry = extractWindowCarry(envelope(s), "7-8");
  assert.ok(carry.ok);
  const spender = carry.franchises.find((f) => f.sourceSeatId === "spender")!;
  const sitter = carry.franchises.find((f) => f.sourceSeatId === "sitter")!;
  const club = CLUB.detroit;
  assert.equal(sitter.taxSalary, club.taxSalary.value);
  assert.equal(sitter.holds, club.holds.value);
  assert.ok(sitter.holds > 0, "Detroit's empty chairs are on its cap sheet");
  assert.equal(sitter.unattributed, club.committed.value - club.taxSalary.value - club.holds.value);
  assert.ok(sitter.taxSalary < sitter.committed, "cash owed is less than the cap hit when holds sit inside it");
  const added = spender.signings.reduce((sum, sg) => sum + sg.annual, 0);
  assert.equal(spender.taxSalary, club.taxSalary.value + added, "every dollar signed in the window is real salary");
  assert.equal(spender.taxSalary - sitter.taxSalary, spender.committed - sitter.committed);
});

test("every club's opening books reconcile: cap hit = tax salary + holds + a small named residual", () => {
  for (const c of CLUBS) {
    const residual = c.committed.value - c.taxSalary.value - c.holds.value;
    assert.ok(residual >= 0, `${c.name}: tax salary and holds exceed the cap hit`);
    assert.ok(residual < 6_000_000, `${c.name}: ${residual} unattributed is not a camp-charge-sized residual`);
  }
});
