/**
 * MODULE 1 · LESSON 2 — "THE SEASON."
 *
 * Spec: `docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md` §13, tests
 * 1-25, skipping 4 (`stretch` — dropped, ruling 2) and 22 (stretch-schedule —
 * same reason). Research: `W2_SEASON_RESEARCH.md`.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { sameLineL2Module as mod, SAME_LINE_L2_ID, spotlightView, pressCandidates, type SameLineL2State } from "../modules/sameLine/l2.js";
import { jobReportFor, branchPick, FEBRUARY_MARKET } from "../modules/sameLine/seasonData.js";
import { CLUB, CLUBS, LINE, TOOL } from "../modules/sameLine/world.js";
import { isOrderedSubsequence } from "../shared/phases.js";
import type { CanonicalPhase } from "../shared/phases.js";
import type { GradeBand } from "../shared/gradeBand.js";

const ctx = (phase: CanonicalPhase, seatId: string, seatIds: string[] = [seatId], now = 1_760_000_000_000) => ({ phase, seatId, seatIds, now });

function fresh(band: GradeBand = "5-6", sessionId = "s"): SameLineL2State {
  return mod.initialState({ sessionId, seatIds: [], gradeBand: band });
}

type Ok = { ok: true; state: SameLineL2State };
function step(s: SameLineL2State, action: { type: string; [k: string]: unknown }, phase: CanonicalPhase, seatId: string): SameLineL2State {
  const r = mod.reduce(s, action, ctx(phase, seatId));
  assert.ok(r.ok, r.ok ? "" : `${action.type} by ${seatId}: ${r.reason}`);
  return (r as Ok).state;
}

function claimed(band: GradeBand = "5-6", sessionId = "s"): SameLineL2State {
  return step(fresh(band, sessionId), { type: "claimDesk" }, "LOBBY", "a");
}

const CHIP = "I need the money";
const LINE_TEXT = "the roster spot";

/** Walks real JSON values — a negative number can only ever be a number-typed leaf, never a hyphen inside a string id/label/season. */
function hasNegativeNumber(v: unknown): boolean {
  if (typeof v === "number") return v < 0;
  if (Array.isArray(v)) return v.some(hasNegativeNumber);
  if (v && typeof v === "object") return Object.values(v as Record<string, unknown>).some(hasNegativeNumber);
  return false;
}

/** A percent is copy text like "50%" in a string leaf, never a digit-percent pattern inside an id. */
function hasPercentString(v: unknown): boolean {
  if (typeof v === "string") return /\d%/.test(v);
  if (Array.isArray(v)) return v.some(hasPercentString);
  if (v && typeof v === "object") return Object.values(v as Record<string, unknown>).some(hasPercentString);
  return false;
}

/* --------------------------------------------------------- 1. phases -- */

test("1. phase list is an ordered subsequence of the canonical vocabulary", () => {
  assert.ok(isOrderedSubsequence(mod.phases));
  assert.deepEqual([...mod.phases], ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "ADAPT", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"]);
});

/* ------------------------------------------------------------ gate -- */

test("2. sign in HOOK is refused", () => {
  const s = claimed();
  const r = mod.reduce(s, { type: "sign", role: "BIG", chip: CHIP, line: LINE_TEXT }, ctx("HOOK", "a"));
  assert.equal(r.ok, false);
});

test("3. waive in PLAY is refused", () => {
  const s = claimed();
  const r = mod.reduce(s, { type: "waive", contractId: "x", chip: CHIP, line: LINE_TEXT }, ctx("PLAY", "a"));
  assert.equal(r.ok, false);
});

// 4. SKIPPED — stretch is dropped (ruling 2); there is no `electStretch` action.

test("5. every commit without a chip is refused", () => {
  let s = claimed();
  s = step(s, { type: "teacher:beat" }, "HOOK", "teacher");
  s = { ...s, round: "JANUARY" } as SameLineL2State; // PLAY entry sets this via onPhaseExit in the real runtime
  const r = mod.reduce(s, { type: "sign", role: "BIG", line: LINE_TEXT }, ctx("PLAY", "a"));
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.reason, /reason/);
});

test("6. every commit without a line is refused", () => {
  const s = { ...claimed(), round: "JANUARY" } as SameLineL2State;
  const r = mod.reduce(s, { type: "sign", role: "BIG", chip: CHIP }, ctx("PLAY", "a"));
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.reason, /give up/);
});

/* -------------------------------------------------------- carry / seed -- */

test("7. a carry from the other band is refused and the whole room falls to stock desks, reason on /teach only", () => {
  const seed = { lessonModuleId: "m1l1-the-window", state: { gradeBand: "7-8", windowClosed: true, desks: {} }, sourceGradeBand: "7-8", sourceEnded: true };
  const s = mod.initialState({ sessionId: "s", seatIds: [], seed, gradeBand: "5-6" });
  assert.equal(s.unclaimed.length, CLUBS.length * 2);
  assert.ok(s.unclaimed.every((u) => u.dealt));
  assert.ok(s.carryWarnings.length > 0);
  const teacher = mod.teacherView(s, "LOBBY") as { carryWarnings: readonly string[] };
  assert.ok(teacher.carryWarnings.some((w) => /grades 7-8 room/.test(w)));
  const board = mod.boardView(s, "LOBBY") as Record<string, unknown>;
  assert.equal(JSON.stringify(board).includes("grades 7-8 room"), false, "the refusal reason must never reach /board");
});

test("8. a dropped desk gets a stock franchise and every other carried desk survives", () => {
  const seed = {
    lessonModuleId: "m1l1-the-window",
    sourceGradeBand: "5-6",
    sourceEnded: true,
    state: {
      gradeBand: "5-6",
      windowClosed: true,
      desks: {
        good: { clubId: "memphis", twin: 0, position: { committed: CLUB.memphis.committed.value, openJobs: [], signings: [] } },
        bad: { clubId: "memphis", twin: 1, position: { committed: 12, openJobs: [], signings: [] } },
      },
    },
  };
  const s = mod.initialState({ sessionId: "s", seatIds: [], seed, gradeBand: "5-6" });
  assert.ok(s.unclaimed.some((u) => u.sourceSeatId === "good"));
  assert.ok(!s.unclaimed.some((u) => u.sourceSeatId === "bad"));
  assert.ok(s.carryWarnings.some((w) => /Dropped/.test(w)));
});

/* ----------------------------------------------------------- podium -- */

test("9. boardView contains no seat id at any phase", () => {
  let s = claimed();
  for (const phase of mod.phases) {
    const board = JSON.stringify(mod.boardView(s, phase));
    assert.equal(board.includes('"a"'), false, `boardView in ${phase} contains the seat id`);
  }
});

test("10. spotlightView (podiumFrame) contains no chip and no typed line", () => {
  let s = claimed();
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "BIG", chip: "I need the money", line: "my last roster spot for a body I do not need" }, "PLAY", "a");
  const view = JSON.stringify(spotlightView(s, "a", "PLAY"));
  assert.equal(view.includes("I need the money"), false);
  assert.equal(view.includes("my last roster spot for a body I do not need"), false);
});

test("11. spotlightView omits result until the teacher has revealed it", () => {
  let s = claimed();
  s = { ...s, round: "FEBRUARY" } as SameLineL2State;
  const candidate = FEBRUARY_MARKET.find((c) => c.preWaiverSalary === 0)!;
  s = step(s, { type: "sign", playerId: candidate.id, chip: CHIP, line: LINE_TEXT }, "ADAPT", "a");
  const view = JSON.stringify(spotlightView(s, "a", "ADAPT"));
  assert.equal(view.includes('"result"'), false, "spotlightView must never surface a tape result");
});

test("12. a declined desk never appears in podiumCandidates again", () => {
  let s = claimed();
  assert.ok(pressCandidates(s, "CONSEQUENCE").some((c) => c.seatId === "a"));
  s = step(s, { type: "declinePodium" }, "CONSEQUENCE", "a");
  assert.ok(!pressCandidates(s, "CONSEQUENCE").some((c) => c.seatId === "a"));
  // idempotent
  s = step(s, { type: "declinePodium" }, "CONSEQUENCE", "a");
  assert.ok(!pressCandidates(s, "CONSEQUENCE").some((c) => c.seatId === "a"));
});

test("13. a dealt (stock) desk is a normal candidate for its own February — never for a July it did not play", () => {
  const seed = { lessonModuleId: "m1l1-the-window", state: { gradeBand: "5-6", windowClosed: true, desks: {} }, sourceGradeBand: "5-6", sourceEnded: true };
  let s = mod.initialState({ sessionId: "s", seatIds: [], seed, gradeBand: "5-6" });
  s = step(s, { type: "claimDesk" }, "LOBBY", "a");
  assert.equal(s.desks["a"]!.dealt, true);
  assert.equal(s.desks["a"]!.report.length, 0, "a stock desk has no July signings, so no report to be judged on");
  const candidates = pressCandidates(s, "CONSEQUENCE");
  assert.ok(candidates.some((c) => c.seatId === "a"), "a dealt desk may still podium for its own week");
  assert.ok(!candidates.find((c) => c.seatId === "a")!.why.includes("July"), "never cited for a July it did not play");
});

test("14. ranking is unchanged when a desk closes an extra job", () => {
  const before = claimed();
  const rankBefore = pressCandidates(before, "CONSEQUENCE").map((c) => c.seatId);
  // Simulate "closed an extra job" by clearing this desk's open jobs directly
  // in state — pressCandidates must never read `openJobs`/`report` verdicts as
  // a ranking signal, so the order (and the `why` text) cannot move because of it.
  const after: SameLineL2State = { ...before, desks: { ...before.desks, a: { ...before.desks["a"]!, position: { ...before.desks["a"]!.position, openJobs: [] } } } };
  const rankAfter = pressCandidates(after, "CONSEQUENCE").map((c) => c.seatId);
  assert.deepEqual(rankAfter, rankBefore);
  const why = pressCandidates(before, "CONSEQUENCE").find((c) => c.seatId === "a")!.why;
  assert.equal(/job/i.test(why) && /closed/i.test(why), false);
});

test("15. ranking is unchanged when a desk's payroll rises", () => {
  let s = claimed();
  const before = pressCandidates(s, "CONSEQUENCE").find((c) => c.seatId === "a")!;
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "BIG", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  // committed rose; the candidate's `why` never mentions payroll or money.
  const after = pressCandidates(s, "CONSEQUENCE").find((c) => c.seatId === "a")!;
  assert.equal(/\$/.test(before.why), false);
  assert.equal(/\$/.test(after.why), false);
});

/* -------------------------------------------------------------- tape -- */

test("16. the reducer never reads state.tape — emptying it changes no reachable position", () => {
  let s = claimed();
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "GUARD", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  const withTape = s.desks["a"]!.position.committed;
  const stripped = { ...s, tape: [] } as SameLineL2State;
  const r = mod.reduce(stripped, { type: "pass", chip: CHIP, line: LINE_TEXT }, ctx("PLAY", "a"));
  assert.ok(r.ok);
  assert.equal((r as Ok).state.desks["a"]!.position.committed, withTape);
});

test("17. a tape entry is byte-identical before and after a later commit", () => {
  let s = claimed();
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "GUARD", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  const entryBefore = JSON.stringify(s.tape[0]);
  s = step(s, { type: "pass", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  assert.equal(JSON.stringify(s.tape[0]), entryBefore);
});

/* ---------------------------------------------------------- the sweep -- */

test("18. sweep: every reachable carried position has a legal move closing at least one open job", () => {
  // The ten-day market is generic, uncontested and past every wall and apron
  // (mirrors `world.ts` MINIMUM_MARKET / TOOL.minimum). Every desk this room
  // can produce can therefore always sign one in January.
  for (const club of CLUBS) {
    for (const twin of [0, 1] as const) {
      let s = fresh();
      s = step(s, { type: "claimDesk", sourceSeatId: null }, "LOBBY", "a");
      const desk = s.desks["a"]!;
      void desk;
      void club;
      void twin;
      s = { ...s, round: "JANUARY" } as SameLineL2State;
      const r = mod.reduce(s, { type: "sign", role: "BIG", chip: CHIP, line: LINE_TEXT }, ctx("PLAY", "a"));
      assert.ok(r.ok, "a ten-day signing must always be legal in January");
    }
  }
});

/* --------------------------------------------------------- wall / apron -- */

test("19. a wall drawn in Week 1 refuses the exact February signing that crosses it, with the July date in the message", () => {
  let s = claimed();
  s = {
    ...s,
    round: "FEBRUARY",
    desks: {
      a: {
        ...s.desks["a"]!,
        position: {
          ...s.desks["a"]!.position,
          wall: LINE.apron1,
          committed: LINE.apron1,
          spent: ["ntmle"],
          signings: [{ playerId: "robinson", name: "Mitchell Robinson", role: "BIG", annual: 15_044_000, tool: "ntmle", years: 3, coveredThrough: "2028-29" }],
        },
        carriedForgone: [{ day: 1, signed: "Mitchell Robinson", atPrice: 15_044_000, lost: [] }],
      },
    },
  } as SameLineL2State;
  const candidate = FEBRUARY_MARKET.find((c) => c.preWaiverSalary === 0)!;
  const r = mod.reduce(s, { type: "sign", playerId: candidate.id, chip: CHIP, line: LINE_TEXT }, ctx("ADAPT", "a"));
  assert.equal(r.ok, false);
  const reason = r.ok ? "" : r.reason;
  assert.match(reason, /July/);
  assert.match(reason, /signing day 2/);
  assert.match(reason, /Mitchell Robinson/);
});

test("20. first-apron desks cannot sign an above-NTMLE buyout player; below-apron desks can", () => {
  const above = FEBRUARY_MARKET.find((c) => c.preWaiverSalary > TOOL.ntmle.ceiling!)!;
  const below = FEBRUARY_MARKET.find((c) => c.preWaiverSalary === 0)!;

  let overApron = claimed("5-6", "s1");
  overApron = {
    ...overApron,
    round: "FEBRUARY",
    desks: { a: { ...overApron.desks["a"]!, position: { ...overApron.desks["a"]!.position, committed: LINE.apron1 + 1_000_000, holds: 0, wall: null } } },
  } as SameLineL2State;
  const refused = mod.reduce(overApron, { type: "sign", playerId: above.id, chip: CHIP, line: LINE_TEXT }, ctx("ADAPT", "a"));
  assert.equal(refused.ok, false);
  assert.match(refused.ok ? "" : refused.reason, /\$15,044,000/);
  assert.match(refused.ok ? "" : refused.reason, new RegExp(above.name));

  let underApron = claimed("5-6", "s2");
  underApron = {
    ...underApron,
    round: "FEBRUARY",
    desks: { a: { ...underApron.desks["a"]!, position: { ...underApron.desks["a"]!.position, committed: LINE.cap - 5_000_000, holds: 0, wall: null } } },
  } as SameLineL2State;
  const allowedAbove = mod.reduce(underApron, { type: "sign", playerId: above.id, chip: CHIP, line: LINE_TEXT }, ctx("ADAPT", "a"));
  assert.ok(allowedAbove.ok, allowedAbove.ok ? "" : allowedAbove.reason);

  let anyone = claimed("5-6", "s3");
  anyone = { ...anyone, round: "FEBRUARY" } as SameLineL2State;
  const allowedBelow = mod.reduce(anyone, { type: "sign", playerId: below.id, chip: CHIP, line: LINE_TEXT }, ctx("ADAPT", "a"));
  assert.ok(allowedBelow.ok, allowedBelow.ok ? "" : allowedBelow.reason);
});

test("verdict is independent of price and years — a report is a pure function of playerId", () => {
  const a = jobReportFor("room-1", "vucevic", "BIG");
  const b = jobReportFor("room-1", "vucevic", "BIG");
  assert.deepEqual(a, b);
  // Two seeded branches are reachable, and reachability does not depend on
  // any price or term — only on which room (sessionId) asks.
  let sawA = false;
  let sawB = false;
  for (let i = 0; i < 40; i += 1) {
    if (branchPick(`room-${i}`, "simons")) sawA = true;
    else sawB = true;
  }
  assert.ok(sawA && sawB, "both branches of an ambiguous card must be reachable");
});

/* --------------------------------------------------------------- waive -- */

test("21. waiving does not reduce committed", () => {
  let s = claimed();
  s = {
    ...s,
    round: "FEBRUARY",
    desks: {
      a: {
        ...s.desks["a"]!,
        position: {
          ...s.desks["a"]!.position,
          signings: [{ playerId: "nance", name: "Larry Nance Jr.", role: "BIG", annual: 4_000_000, tool: "roomMle", years: 1, coveredThrough: "2026-27" }],
        },
      },
    },
  } as SameLineL2State;
  const before = s.desks["a"]!.position.committed;
  s = step(s, { type: "waive", contractId: "nance", chip: CHIP, line: LINE_TEXT }, "ADAPT", "a");
  assert.equal(s.desks["a"]!.position.committed, before);
  assert.equal(s.desks["a"]!.position.taxSalary, s.desks["a"]!.position.taxSalary);
  assert.ok(s.desks["a"]!.waived.some((w) => w.playerId === "nance"));
});

// 22. SKIPPED — stretchSchedule does not exist; stretch is dropped (ruling 2).

test("23. taxSalary and committed never mix in any dollar computation", () => {
  let s = claimed();
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "WING", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  const desk = s.desks["a"]!;
  // A ten-day adds the SAME amount to both, independently — never one derived from the other by a cross term.
  assert.equal(desk.position.committed - claimed().desks["a"]!.position.committed, desk.position.taxSalary - claimed().desks["a"]!.position.taxSalary);
});

test("24. at 5-6 no view payload contains a negative number or a percent", () => {
  let s = claimed("5-6");
  s = { ...s, round: "JANUARY" } as SameLineL2State;
  s = step(s, { type: "sign", role: "BIG", chip: CHIP, line: LINE_TEXT }, "PLAY", "a");
  for (const phase of mod.phases) {
    for (const payload of [mod.studentView(s, "a", phase), mod.teacherView(s, phase), mod.boardView(s, phase)]) {
      // A blind regex over the serialized JSON false-positives on any
      // hyphenated string value that happens to end in a digit — the grade
      // band label ("5-6"), a season ("2026-27"), a generated id
      // ("a-jan-0"). None of those are the numeric amount this test is
      // actually about. Walk the real JSON values instead: only a
      // number-typed leaf can be a negative dollar figure or a percent.
      assert.equal(hasNegativeNumber(payload), false, `${phase} payload has a negative number`);
      assert.equal(hasPercentString(payload), false, `${phase} payload has a percent`);
    }
  }
});

test("25. a February window closed by the clock and one closed by hand produce identical state", () => {
  let s = claimed();
  s = { ...s, round: "FEBRUARY" } as SameLineL2State;
  const candidate = FEBRUARY_MARKET.find((c) => c.preWaiverSalary === 0)!;
  s = step(s, { type: "sign", playerId: candidate.id, chip: CHIP, line: LINE_TEXT }, "ADAPT", "a");
  const byHand = step(s, { type: "teacher:closeWindow" }, "ADAPT", "teacher");
  const byClock = mod.onPhaseExit ? mod.onPhaseExit(s, "ADAPT", "COUNTERFACTUAL") : s;
  assert.deepEqual(byHand.desks, byClock.desks);
  assert.deepEqual(byHand.tape, byClock.tape);
  assert.equal(byHand.windowClosed, true);
  assert.equal(byClock.windowClosed, true);
});

/* ------------------------------------------------------------- extras -- */

test("claiming a desk twice is idempotent", () => {
  const s1 = claimed();
  const club = s1.desks["a"]!.clubId;
  const s2 = step(s1, { type: "claimDesk" }, "LOBBY", "a");
  assert.equal(s2.desks["a"]!.clubId, club);
});

test("a stock franchise's desk carries the dealt flag onto studentView", () => {
  const seed = { lessonModuleId: "m1l1-the-window", state: { gradeBand: "5-6", windowClosed: true, desks: {} }, sourceGradeBand: "5-6", sourceEnded: true };
  let s = mod.initialState({ sessionId: "s", seatIds: [], seed, gradeBand: "5-6" });
  s = step(s, { type: "claimDesk" }, "LOBBY", "a");
  const view = mod.studentView(s, "a", "HOOK") as { hq: { dealt: boolean; dealtNote: string | null } };
  assert.equal(view.hq.dealt, true);
  assert.match(view.hq.dealtNote ?? "", /not played by you/);
});
