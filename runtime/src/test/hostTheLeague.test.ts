/**
 * Module 2 · Lesson 2 "You Don't Play Alone" — reducer and property tests.
 *
 * Four jobs:
 *  1. the runtime contract (phases, action gating, teacher hooks, seating);
 *  2. PRIVACY — no view on any surface at any phase carries a hidden demand
 *     constant, another desk's cash, or a seat identity on the projector;
 *  3. the INTERDEPENDENCE IDENTITY (BC-5): a home week's crowd and its dollars
 *     decompose exactly into this-building-and-this-price + my-own-Draw +
 *     the-visitor's-Draw, with residual 0 and no negative block, everywhere in
 *     the reachable state space;
 *  4. determinism — bots, schedule and the star departure are pure functions of
 *     state, so the same session replays to the same numbers every time.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  BARS_PER_PAGE,
  BOT_SHARES,
  CLUBS,
  DRAW_MAX,
  DRAW_MIN,
  DRAW_START,
  MARKET_PROFILES,
  MAX_DESKS,
  NATIONAL,
  OFFSETS,
  OPTIMUM_BAND_TOLERANCE,
  PRICE_GRID,
  PRICE_MAX,
  PRICE_MIN,
  REVEAL_STEPS,
  SHARE_GRID,
  SHARE_MAX,
  WEEK_COUNT,
  GATE_PACKED_FLOOR,
  GATE_BUSY_FLOOR,
  MODELED_DOLLARS_LINE,
  MODELED_DOLLARS_SHORT,
  OBJECTIVE_COPY,
  barReleaseArm,
  botShareFor,
  computeAggregate,
  giveAndTakeSummary,
  giveAndTakeSummaryBoard,
  reinvestBaseline,
  reinvestChangeLineBoard,
  dealtLineClaimed,
  deskChoiceHeadingClaimed,
  deskChoiceLineClaimed,
  neverLockedFor,
  neverLockedFramingClaimed,
  playBoardComposition,
  teachPlayMirrorClaimed,
  drawGain,
  hostSlotFor,
  hostTheLeagueModule,
  localMediaFor,
  moduleClaims,
  nextDraw,
  priceCounterfactualFor,
  reinvestChangeLine,
  reinvestRuleFor,
  roomCashAtShiftedShares,
  roomCashAtUniformShare,
  sawBarBeforeWeek3,
  scheduleFor,
  teachStage5MirrorClaimed,
  settleHome,
  spilloverClaim,
  synthesisCards,
  visitorSlotFor,
  type HostLeagueState,
} from "../modules/hostTheLeague.js";
import { isOrderedSubsequence, type CanonicalPhase } from "../shared/phases.js";
import type { LessonAction, SeatId } from "../shared/lessonModule.js";

/* ------------------------------------------------------------- helpers -- */

const ctx = (phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") => ({
  phase,
  seatId,
  seatIds: ["seat-1", "seat-2", "seat-3", "seat-4"],
  now: 0,
});

const empty = (): HostLeagueState => hostTheLeagueModule.initialState({ sessionId: "s1", seatIds: [] });

function ok(result: ReturnType<typeof hostTheLeagueModule.reduce>): HostLeagueState {
  assert.equal(result.ok, true, result.ok ? "" : `expected ok, got: ${result.reason}`);
  return (result as { ok: true; state: HostLeagueState }).state;
}
function bad(result: ReturnType<typeof hostTheLeagueModule.reduce>): string {
  assert.equal(result.ok, false, "expected rejection");
  return (result as { ok: false; reason: string }).reason;
}
function act(state: HostLeagueState, action: LessonAction, phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") {
  return hostTheLeagueModule.reduce(state, action, ctx(phase, seatId));
}

/** The module's own money formatting, so an assertion never invents a second one. */
const money = (n: number): string => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

function seated(count: number): HostLeagueState {
  let state = empty();
  for (let i = 1; i <= count; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  return state;
}

/** Plays one week for every seated desk at the given dials, then closes the week. */
function playWeek(state: HostLeagueState, price: (i: number) => number, share: (i: number) => number): HostLeagueState {
  let next = state;
  const seats = Object.keys(next.seatToSlot);
  seats.forEach((seatId, i) => {
    next = ok(act(next, { type: "setPrice", price: price(i) }, "PLAY", seatId));
    next = ok(act(next, { type: "setShare", share: share(i) }, "PLAY", seatId));
    next = ok(act(next, { type: "lock" }, "PLAY", seatId));
  });
  return ok(act(next, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
}

function fullSession(desks = 6): HostLeagueState {
  let state = seated(desks);
  const prices = [24, 44, 60, 36, 78, 52, 30, 66, 40, 56, 20, 90];
  const shares = [0, 20, 40, 10, 30, 5, 15, 25, 35, 0, 40, 10];
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    state = playWeek(
      state,
      (i) => prices[(i + w) % prices.length]!,
      (i) => shares[(i + w * 3) % shares.length]!,
    );
  }
  return state;
}

function walk(value: unknown, path: string, onNumber: (n: number, p: string) => void, onKey: (k: string) => void): void {
  if (typeof value === "number") return onNumber(value, path);
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, onNumber, onKey));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      onKey(k);
      walk(v, `${path}.${k}`, onNumber, onKey);
    }
  }
}

/** Hidden demand parameters. None of these may ever be a key in any view. */
const FORBIDDEN_KEYS = [
  "base0",
  "sens",
  "ownDrawFans",
  "visitorDrawFans",
  "effortScale",
  "drawDollars",
  "localBase",
  "ancillary",
  "profileId",
  "seatToSlot",
  "curve",
  "hidden",
];

const ALL_PHASES = hostTheLeagueModule.phases;

/* ----------------------------------------------------- runtime contract -- */

test("hostTheLeague declares an ordered subsequence of the canonical phases", () => {
  assert.equal(isOrderedSubsequence(hostTheLeagueModule.phases), true);
  assert.deepEqual(
    [...hostTheLeagueModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "ARGUE", "SYNTHESIS", "COMPLETE"],
  );
  assert.equal(hostTheLeagueModule.id, "m2l2-host-league");
});

test("desks claim clubs in join order and the league grows to keep spare clubs", () => {
  const state = seated(5);
  assert.deepEqual(
    Object.keys(state.seatToSlot).map((s) => state.seatToSlot[s]),
    [0, 1, 2, 3, 4],
  );
  assert.equal(state.deskCount, 5);
  assert.ok(state.leagueSize >= 7, `league should keep spare clubs, got ${state.leagueSize}`);
  assert.ok(state.clubs.slice(0, state.leagueSize).some((c) => c.seatId === null), "at least one bot club must exist");
  // Idempotent.
  const again = ok(act(state, { type: "takeSeat" }, "LOBBY", "seat-1"));
  assert.deepEqual(again.seatToSlot, state.seatToSlot);
});

test("the league seats at most MAX_DESKS and refuses the next one with a reason", () => {
  let state = empty();
  for (let i = 1; i <= MAX_DESKS; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  assert.equal(state.deskCount, MAX_DESKS);
  const reason = bad(act(state, { type: "takeSeat" }, "LOBBY", `seat-${MAX_DESKS + 1}`));
  assert.match(reason, /full/);
});

test("phase guards: dials only in PLAY, teacher hooks only from the teacher", () => {
  const state = seated(4);
  assert.match(bad(act(state, { type: "setPrice", price: 40 }, "HOOK")), /only run a week during PLAY/);
  assert.match(bad(act(state, { type: "lock" }, "REVEAL")), /only run a week during PLAY/);
  assert.match(bad(act(state, { type: "teacher:closeWeek" }, "PLAY", "seat-1")), /only the teacher/);
  assert.match(bad(act(state, { type: "teacher:closeWeek" }, "HOOK", "teacher")), /weeks close during PLAY/);
  assert.match(bad(act(state, { type: "setPrice", price: 40 }, "PLAY", "teacher")), /only a seated pair/);
  assert.match(bad(act(state, { type: "nope" }, "PLAY")), /unknown action/);
});

/**
 * `gate-l2-teacher` W5 N-3. A pair joining after the last week closed used to be
 * refused ("clubs are handed out in LOBBY, HOOK or PLAY"), which the device
 * retried in a 409 loop under "You're in — finding your club…" for the rest of
 * the period, while `/teach` listed them and said nothing about what to do.
 * They are recorded as observers now: accepted, told the truth, and named to the
 * teacher — and no club is invented for them, because seating a desk after the
 * weeks are closed would re-derive numbers the room has already been shown.
 */
/**
 * `gate-l2-teacher` W5 B-1 (BLOCKING). The desk that never pressed LOCK was
 * told by its own device that it had CHOSEN, on the same beat `/teach` was
 * telling the teacher that pair "did not choose 0%, they chose nothing". Both
 * desks below spend exactly $0, so no arithmetic distinguishes them; only the
 * abstention atom does, and every surface must read it.
 */
test("W5 B-1: a desk that never locked is never told it chose, and the desk that chose zero still is", () => {
  // Desk 1 never presses LOCK. Desk 2 locks in and picks 0% every week.
  let state = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (const [i, seatId] of Object.keys(state.seatToSlot).entries()) {
      if (i === 0) continue; // desk 1 abstains, all three weeks
      state = ok(act(state, { type: "setPrice", price: 44 }, "PLAY", seatId));
      state = ok(act(state, { type: "setShare", share: i === 1 ? 0 : 20 }, "PLAY", seatId));
      state = ok(act(state, { type: "lock" }, "PLAY", seatId));
    }
    state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  }

  const agg = computeAggregate(state);
  const abstainer = agg.giveAndTake.find((r) => r.neverLocked);
  const chooser = agg.giveAndTake.find((r) => !r.neverLocked && r.spend === 0);
  assert.ok(abstainer, "the abstaining desk is on the ledger");
  assert.ok(chooser, "and so is a desk that locked in and chose 0%");
  assert.equal(abstainer!.spend, 0);
  assert.equal(chooser!.spend, 0, "both spent exactly $0 — the arithmetic cannot tell them apart");
  assert.equal(abstainer!.chosenWeeks, 0);
  assert.ok(chooser!.chosenWeeks > 0);

  // One predicate, read the same way everywhere.
  const abstainClub = state.clubs.find((c) => c.deskNumber === abstainer!.deskNumber)!;
  const chooseClub = state.clubs.find((c) => c.deskNumber === chooser!.deskNumber)!;
  assert.equal(neverLockedFor(abstainClub), true);
  assert.equal(neverLockedFor(chooseClub), false);

  // The abstaining desk's own card and heading.
  const aLine = deskChoiceLineClaimed(abstainer!).text;
  const aHead = deskChoiceHeadingClaimed(abstainer!).text;
  assert.doesNotMatch(aLine, /chose to give nothing/, "the abstaining desk is not told it chose to give nothing");
  assert.doesNotMatch(aLine, /they are your decision/, "nor that the zeroes are its decision");
  assert.doesNotMatch(aHead, /that is a decision/, "and the heading above them does not say it either");
  assert.match(aLine, /not a decision/, "it is told what actually happened instead");
  assert.match(aHead, /nobody at this desk pressed LOCK/);

  // The chooser is still told, plainly, that it decided. The lesson needs this.
  const cLine = deskChoiceLineClaimed(chooser!).text;
  const cHead = deskChoiceHeadingClaimed(chooser!).text;
  assert.match(cLine, /chose to give nothing/);
  assert.match(cHead, /that is a decision/);

  // /teach: the two WATCH FOR limbs, and the give/take framing line.
  const teach = hostTheLeagueModule.teacherView(state, "ADAPT") as Record<string, unknown>;
  const flags = teach["watchFor"] as { id: string; desks: string[]; action: string }[];
  const never = flags.find((f) => f.id === "never-locked");
  const rider = flags.find((f) => f.id === "free-rider");
  assert.ok(never!.desks.some((d) => d.includes(`Desk ${abstainer!.deskNumber}`)));
  assert.ok(!never!.desks.some((d) => d.includes(`Desk ${chooser!.deskNumber}`)));
  assert.ok(rider!.desks.some((d) => d.includes(`Desk ${chooser!.deskNumber}`)));
  assert.ok(!rider!.desks.some((d) => d.includes(`Desk ${abstainer!.deskNumber}`)), "the abstaining desk is never the free-rider example");
  assert.match(never!.action, /not a decision/, "the teacher is quoted the words on that pair's own screen");

  const framing = neverLockedFramingClaimed(state);
  assert.ok(framing, "the give/take framing carries a line for this room");
  assert.match(framing!.text, new RegExp(`Desk ${abstainer!.deskNumber}`));
  assert.match(framing!.text, /treat them as absent/);
  const q2 = (teach["director"] as { ask: { q: string; answer: string | null }[] }).ask[1]!;
  assert.match(String(q2.answer), /treat them as absent/, "and it is attached to the question that sends the room to those numbers");

  // A room where everybody locked prints no framing line at all.
  assert.equal(neverLockedFramingClaimed(fullSession(6)), null);

  // The sweep sees both surfaces for both desks.
  const surfaces = moduleClaims(state).map((s) => s.surface);
  for (const n of [abstainer!.deskNumber, chooser!.deskNumber]) {
    assert.ok(surfaces.includes(`play:desk-${n}:choiceLine`));
    assert.ok(surfaces.includes(`play:desk-${n}:choiceHeading`));
  }
  assert.ok(surfaces.includes("teach:give-take:neverLocked"));
});

/**
 * `gate-l2-teacher` W5 B-2 (BLOCKING). At the bar release `/teach` itself
 * prescribes, the ON-THE-PROJECTOR mirror described a pairing grid, a
 * star-departure card and a bar "underneath the schedule" — while the projector
 * held only the bar. The mirror is composed from the frame `boardView` sends.
 */
test("W5 B-2: the PLAY mirror is composed from the board frame, on both sides of the bar release", () => {
  let state = seated(7);
  for (let w = 0; w < WEEK_COUNT - 1; w += 1) state = playWeek(state, () => 50, (i) => (i % 2 === 0 ? 0 : 20));

  // Week 3 open, nothing locked into it, bar still held.
  const held = state;
  const heldFrame = hostTheLeagueModule.boardView(held, "PLAY") as Record<string, unknown>;
  const heldMirror = teachPlayMirrorClaimed(held).text;
  assert.ok((heldFrame["pairings"] as unknown[]).length > 0, "the board is holding the schedule");
  assert.equal((heldFrame["bars"] as unknown[]).length, 0, "and no bar");
  assert.match(heldMirror, /Every pairing in the league/);
  assert.match(heldMirror, /the Handed-To-You bar is not up/);

  // The prescribed press.
  const up = ok(act(held, { type: "teacher:handedTo" }, "PLAY", "teacher"));
  const upFrame = hostTheLeagueModule.boardView(up, "PLAY") as Record<string, unknown>;
  const upMirror = teachPlayMirrorClaimed(up).text;
  assert.equal((upFrame["pairings"] as unknown[]).length, 0, "the bar takes the frame — no pairings are sent");
  assert.equal(upFrame["shock"], null, "and no star-departure card");
  assert.ok((upFrame["bars"] as unknown[]).length > 0, "the bar is up");
  assert.doesNotMatch(upMirror, /underneath the schedule/, "the exact false sentence W5 B-2 found");
  assert.doesNotMatch(upMirror, /Every pairing in the league/, "no pairing grid is claimed on a frame that has none");
  assert.doesNotMatch(upMirror, /star-departure card is up/, "no departure card either");
  assert.match(upMirror, /REPLACED the schedule/);
  assert.match(upMirror, new RegExp(`${upFrame["lockedCount"]} of ${upFrame["deskCount"]} locked in`), "and the lock count is the board's own");

  // The composition the two surfaces share.
  const comp = playBoardComposition(up);
  assert.equal(comp.barsUp, true);
  assert.equal(comp.showsPairings, false);
  assert.equal(comp.showsShock, false);
  assert.equal(comp.lockedCount, upFrame["lockedCount"]);

  // /teach's own panel, not just the builder.
  const panel = (hostTheLeagueModule.teacherView(up, "PLAY") as Record<string, unknown>)["projectorNow"] as { title: string; lines: string[] };
  assert.match(panel.title, /REPLACED the schedule/);
  assert.deepEqual(panel.lines, [upMirror]);
  assert.ok(moduleClaims(up).some((s) => s.surface === "teach:play:projectorMirror"));
});

test("a pair arriving after the weeks close is recorded as an observer, not refused", () => {
  const state = seated(4);
  const late = ok(act(state, { type: "takeSeat" }, "ADAPT", "seat-9"));
  assert.deepEqual(late.observerSeats, ["seat-9"], "the late pair is recorded");
  assert.equal(late.seatToSlot["seat-9"], undefined, "and is NOT given a club");
  assert.equal(late.deskCount, state.deskCount, "so no desk count moves after the season");
  // Idempotent: the device retries, and a retry may not duplicate the record.
  const again = ok(act(late, { type: "takeSeat" }, "ADAPT", "seat-9"));
  assert.deepEqual(again.observerSeats, ["seat-9"], "a retry does not duplicate the pair");

  const view = hostTheLeagueModule.studentView(late, "seat-9", "ADAPT") as Record<string, unknown>;
  assert.equal(view["seated"], false);
  assert.equal(view["observer"], true, "the device is told it is an observer rather than left searching");
  assert.doesNotMatch(String(view["message"]), /finding your club/i, "and never left on the lie");
  assert.match(String(view["observerAction"]), /nearest desk/i, "and is told what to do instead");

  const teach = hostTheLeagueModule.teacherView(late, "ADAPT") as Record<string, unknown>;
  const flags = teach["watchFor"] as { id: string; desks: string[]; action: string }[];
  const flag = flags.find((f) => f.id === "late-observers");
  assert.ok(flag, "/teach gets a WATCH FOR entry for the pair standing in the doorway");
  assert.equal(flag!.desks.length, 1);
  assert.match(flag!.action, /no club left to hand them/i);

  // A seat that already has a club is untouched by the late path.
  const seatedLate = ok(act(late, { type: "takeSeat" }, "SYNTHESIS", "seat-1"));
  assert.deepEqual(seatedLate.observerSeats, ["seat-9"], "an already-seated pair is never recorded as an observer");
});

test("dial validation rejects off-grid prices and shares", () => {
  const state = seated(2);
  assert.match(bad(act(state, { type: "setPrice", price: 41 }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setPrice", price: PRICE_MAX + 2 }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setPrice", price: "40" }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setShare", share: 7 }, "PLAY")), /5-point steps/);
  assert.match(bad(act(state, { type: "setShare", share: SHARE_MAX + 5 }, "PLAY")), /5-point steps/);
  for (const p of [PRICE_MIN, 44, PRICE_MAX]) ok(act(state, { type: "setPrice", price: p }, "PLAY"));
  for (const s of SHARE_GRID) ok(act(state, { type: "setShare", share: s }, "PLAY"));
});

test("a locked desk cannot change its dials until the week closes", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 44 }, "PLAY"));
  state = ok(act(state, { type: "lock" }, "PLAY"));
  assert.match(bad(act(state, { type: "setPrice", price: 60 }, "PLAY")), /locked/);
  state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  ok(act(state, { type: "setPrice", price: 60 }, "PLAY"));
});

test("the week bell auto-commits an unlocked desk at its house price, marked AUTO, never a zero", () => {
  let state = seated(3);
  state = ok(act(state, { type: "setPrice", price: 90 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  const slot2 = state.seatToSlot["seat-2"]!;
  const w = state.clubs[slot2]!.weeks[0]!;
  assert.equal(w.auto, true);
  assert.equal(w.share, 0);
  assert.ok(w.home.turnout > 0, "an auto-committed desk still plays a real week");
  assert.equal(state.clubs[state.seatToSlot["seat-1"]!]!.weeks[0]!.auto, false);
});

test("leaving PLAY settles every remaining week and releases the bar; leaving REVEAL plays out the stages", () => {
  let state = seated(4);
  state = ok(act(state, { type: "setPrice", price: 50 }, "PLAY", "seat-1"));
  state = hostTheLeagueModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(state.weekIndex, WEEK_COUNT);
  assert.equal(state.barReleased, true);
  // ONE FALLBACK PER LESSON. This path used to honour the pair's pending dial
  // ($50) while the teacher's own week bell settled the same club at its house
  // price — two different economies for the same student action, decided by
  // which control the teacher pressed. Both paths now apply the policy the
  // product promises: a club that never locked did not choose.
  const slot = state.seatToSlot["seat-1"]!;
  assert.notEqual(state.clubs[slot]!.weeks[0]!.price, 50, "an unlocked dial must not commit itself");
  assert.equal(state.clubs[slot]!.weeks[0]!.auto, true, "and the week must be flagged as one nobody locked");
  state = hostTheLeagueModule.onPhaseExit!(state, "REVEAL", "ADAPT");
  assert.equal(state.revealStage, REVEAL_STEPS);
});

test("the week bell and a teacher's early exit settle an unlocked club identically", () => {
  const build = (): ReturnType<typeof seated> => {
    let s2 = seated(4);
    return ok(act(s2, { type: "setPrice", price: 50 }, "PLAY", "seat-1"));
  };
  const exited = hostTheLeagueModule.onPhaseExit!(build(), "PLAY", "REVEAL");
  const belled = ok(act(build(), { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  const slot = exited.seatToSlot["seat-1"]!;
  assert.equal(
    exited.clubs[slot]!.weeks[0]!.price,
    belled.clubs[slot]!.weeks[0]!.price,
    "the two close paths settle an unlocked club at different prices",
  );
});

test("You Don't Play Alone declares a round contract naming the fallback per club", () => {
  const contract = hostTheLeagueModule.round!;
  let state = seated(4);
  assert.equal(contract.currentKey(state, "PLAY"), "W1");
  assert.equal(contract.currentKey(state, "REVEAL"), null);

  state = ok(act(state, { type: "setPrice", price: 50 }, "PLAY", "seat-1"));
  const seatIds = ["seat-1", "seat-2", "seat-3", "seat-4"];
  const dialled = contract.unresolved(state, "PLAY", seatIds).find((u) => u.seatId === "seat-1")!;
  assert.match(dialled.fallback, /NOT the \$50/, "the teacher must see the number the club is about to lose");

  // League-office clubs have no seat and are never listed as unresolved.
  assert.ok(contract.unresolved(state, "PLAY", seatIds).every((u) => seatIds.includes(u.seatId)));

  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  assert.ok(!contract.unresolved(state, "PLAY", seatIds).some((u) => u.seatId === "seat-1"));
});

test("teacher pacing hooks are gated and cannot be double-fired", () => {
  let state = seated(6);
  assert.match(bad(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher")), /close week 1 first/);
  state = playWeek(state, () => 44, () => 20);
  state = ok(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher"));
  assert.equal(state.barReleased, true);
  assert.match(bad(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher")), /already up/);
  assert.match(bad(act(state, { type: "teacher:revealNext" }, "PLAY", "teacher")), /during REVEAL/);
  for (let i = 0; i < REVEAL_STEPS; i += 1) state = ok(act(state, { type: "teacher:revealNext" }, "REVEAL", "teacher"));
  assert.match(bad(act(state, { type: "teacher:revealNext" }, "REVEAL", "teacher")), /already played/);
});

test("the bar pager wraps in both directions and never leaves a dead control", () => {
  let state = fullSession(12);
  const rows = computeAggregate(state).homeRevenueDecomposition.length;
  const pages = Math.ceil(rows / BARS_PER_PAGE);
  assert.ok(pages > 1, "12 desks must need more than one projector group");
  for (let i = 0; i < pages; i += 1) state = ok(act(state, { type: "teacher:barPage" }, "REVEAL", "teacher"));
  assert.equal(state.barPage, 0, "paging all the way round returns to the first group");
  state = ok(act(state, { type: "teacher:barPageBack" }, "REVEAL", "teacher"));
  assert.equal(state.barPage, pages - 1);
});

/* -------------------------------------------------- the schedule and bots -- */

test("every club hosts exactly one and visits exactly one, every week, with no self-hosting", () => {
  for (let size = 6; size <= CLUBS.length; size += 1) {
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      const pairs = scheduleFor(w, size);
      assert.equal(pairs.length, size);
      const hosts = new Set(pairs.map((p) => p.host));
      const visitors = new Set(pairs.map((p) => p.visitor));
      assert.equal(hosts.size, size, `week ${w} size ${size}: a club hosts twice`);
      assert.equal(visitors.size, size, `week ${w} size ${size}: a club travels twice`);
      for (const p of pairs) assert.notEqual(p.host, p.visitor, "a club may never host itself");
      for (const p of pairs) {
        assert.equal(visitorSlotFor(p.host, w, size), p.visitor);
        assert.equal(hostSlotFor(p.visitor, w, size), p.host);
      }
    }
    // No pairing repeats across the three weeks.
    const seen = new Set<string>();
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      for (const p of scheduleFor(w, size)) {
        const key = `${p.host}>${p.visitor}`;
        assert.equal(seen.has(key), false, `pairing ${key} repeats at size ${size}`);
        seen.add(key);
      }
    }
  }
  assert.deepEqual([...OFFSETS], [1, 2, 3]);
});

test("most live desks host another live desk — an interdependence lesson cannot be mostly bots", () => {
  for (const deskCount of [4, 6, 8, 12, 15]) {
    const state = seated(deskCount);
    let liveHostedLive = 0;
    let total = 0;
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      for (let slot = 0; slot < deskCount; slot += 1) {
        total += 1;
        if (visitorSlotFor(slot, w, state.leagueSize) < deskCount) liveHostedLive += 1;
      }
    }
    // At the smallest supported class the ring is tightest and the floor is
    // lowest; from eight desks up it should be the overwhelming majority.
    const bar = deskCount >= 8 ? 0.7 : 0.55;
    assert.ok(
      liveHostedLive / total >= bar,
      `${deskCount} desks: only ${liveHostedLive}/${total} home weeks host a live desk`,
    );
    // and every desk hosts a live desk at least once across the three weeks
    for (let slot = 0; slot < deskCount; slot += 1) {
      const any = [0, 1, 2].some((w) => visitorSlotFor(slot, w, state.leagueSize) < deskCount);
      assert.ok(any, `${deskCount} desks: desk ${slot + 1} never hosts a live desk`);
    }
  }
});

test("bot policy is deterministic, ladder-based, and never reads a desk's decisions", () => {
  for (let slot = 0; slot < CLUBS.length; slot += 1) {
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      const a = botShareFor(slot, w, false);
      const b = botShareFor(slot, w, false);
      assert.equal(a, b);
      assert.equal(a, BOT_SHARES[(slot + w) % BOT_SHARES.length]);
      assert.equal(botShareFor(slot, w, true), 0, "a club that just lost its star is not spending");
    }
  }
});

test("the same session replays to identical numbers — no RNG anywhere", () => {
  const a = fullSession(8);
  const b = fullSession(8);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.deepEqual(computeAggregate(a), computeAggregate(b));
});

test("the star departure is exogenous, lands on a league-office club, and is announced before week 2 is priced", () => {
  let state = seated(6);
  assert.equal(state.shockSlot, null, "nothing is announced before week 1 is played");
  state = playWeek(state, () => 44, () => 40);
  assert.notEqual(state.shockSlot, null, "the departure is set the moment week 2 opens");
  const shock = state.clubs[state.shockSlot!]!;
  assert.equal(shock.seatId, null, "the shock never lands on a desk that reinvested — it is exogenous");
  assert.equal(shock.starGone, true);
  assert.ok(shock.draw <= 15, `the shock must bite, got Draw ${shock.draw}`);
  // It is on the pre-commit student payload for every desk, before any dial moves.
  for (const seatId of Object.keys(state.seatToSlot)) {
    const v = hostTheLeagueModule.studentView(state, seatId, "PLAY") as Record<string, unknown>;
    const s = v["shock"] as { line: string } | null;
    assert.ok(s && s.line.includes("lost their best player"), "week 2's card must print the departure before commitment");
  }
});

/* ----------------------------------- the interdependence identity (BC-5) -- */

test("a home week decomposes EXACTLY into building+price, own Draw and visitor Draw — residual 0, no negative block", () => {
  let states = 0;
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 5) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 5) {
        for (const price of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, price);
          states += 1;
          assert.equal(s.bareFans + s.ownFans + s.visitorFans, s.turnout, `fans residual at ${profile.id} ${hd}/${vd}/$${price}`);
          assert.equal(
            s.bareDollars + s.ownDollars + s.visitorDollars,
            s.doorMoney,
            `dollars residual at ${profile.id} ${hd}/${vd}/$${price}`,
          );
          assert.equal(s.gate + s.inArena, s.doorMoney);
          assert.ok(s.bareFans >= 0 && s.ownFans >= 0 && s.visitorFans >= 0, "no block may be negative");
          assert.ok(s.turnout <= capacity, "turnout may never exceed the building");
        }
      }
    }
  }
  assert.ok(states > 15_000, `sweep must be wide, only covered ${states} states`);
});

test("delete the visitor term and every home week returns the identical number — C5's instantiation test", () => {
  // The contract's INSTANTIATION test, run as arithmetic: if the visiting
  // club's Draw did not enter the host's demand, holding everything else fixed
  // would leave the gate unchanged. It does not.
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    const low = settleHome(profile, capacity, 40, 15, 44);
    const high = settleHome(profile, capacity, 40, 90, 44);
    assert.notEqual(low.turnout, high.turnout);
    assert.ok(
      high.turnout >= low.turnout * 1.8,
      `${profile.id}: a Draw-90 visitor must roughly double a Draw-15 visitor's crowd (got ${low.turnout} -> ${high.turnout})`,
    );
    assert.ok(high.visitorDollars > high.bareDollars * 0.5, `${profile.id}: the marquee visitor block must be material`);
  }
});

test("the money one desk's Draw earns on the road is exactly the visitor block on the host's books", () => {
  const state = fullSession(8);
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    for (const w of club.weeks) {
      const host = state.clubs[w.roadHostSlot]!;
      const hostWeek = host.weeks.find((x) => x.week === w.week)!;
      assert.equal(w.roadDollars, hostWeek.home.visitorDollars, "the road number must be the host's own visitor block");
      assert.equal(w.roadTurnoutLift, hostWeek.home.visitorFans);
    }
  }
});

test("the aggregate's per-desk decomposition closes to the desk's own total, every desk", () => {
  const agg = computeAggregate(fullSession(10));
  assert.ok(agg.homeRevenueDecomposition.length >= 10);
  for (const row of agg.homeRevenueDecomposition) {
    assert.equal(row.residual, 0);
    assert.equal(row.fromBuilding + row.fromOwnDraw + row.fromVisitorDraw + row.localMedia + row.national, row.total);
    assert.ok(row.fromVisitorDraw >= 0 && row.fromOwnDraw >= 0 && row.fromBuilding >= 0);
    assert.equal(row.visitors.length, row.weeksPlayed);
  }
  // Rows are ordered by desk number, never by money (R13).
  const numbers = agg.homeRevenueDecomposition.map((r) => r.deskNumber);
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
});

/* --------------------------------------------------- the economic shape -- */

test("the national cheque is identical for every club and is the tallest single pipe", () => {
  const agg = computeAggregate(fullSession(8));
  const nationals = new Set(agg.pipes.map((p) => p.national));
  assert.equal(nationals.size, 1, "the national cheque must be identical for every club");
  let nationalTallest = 0;
  for (const p of agg.pipes) {
    assert.equal(p.national, NATIONAL * p.gate / Math.max(1, p.gate) > 0 ? p.national : p.national);
    assert.ok(p.national >= p.inArena, `${p.deskHandle}: national is beaten by in-arena spend`);
    // The C3 payload is "the money you control least pays you most", and it is
    // true for almost every club — but it is NOT rigged. A desk that prices
    // high into marquee visitors can out-gate the cheque, and a big market that
    // reinvests hard can out-earn it on local media (which is realistic: the
    // Lakers' local deal ran about three quarters of a per-club national share
    // in the leaked year). Its own bar says so, and the director tells the
    // teacher to ask that desk what it did.
    if (p.national >= p.gate && p.national >= p.localMedia) nationalTallest += 1;
    assert.ok(p.gatePct <= 45, `${p.deskHandle}: gate share ${p.gatePct}% is implausible for an NBA club`);
  }
  assert.ok(
    nationalTallest >= Math.ceil(agg.pipes.length * 0.6),
    `the national cheque is the tallest pipe for only ${nationalTallest} of ${agg.pipes.length} desks`,
  );
});

test("no fixed reinvest share is cash-best for every market, and the best share falls as the season runs out", () => {
  const best = (profileId: string, weeksLeft: number): number => {
    const profile = MARKET_PROFILES.find((m) => m.id === profileId)!;
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    let door = 0;
    let bestPrice = PRICE_MIN;
    for (const price of PRICE_GRID) {
      const s = settleHome(profile, capacity, DRAW_START, DRAW_START, price);
      if (s.doorMoney > door) {
        door = s.doorMoney;
        bestPrice = price;
      }
    }
    const perPoint =
      settleHome(profile, capacity, DRAW_START + 1, DRAW_START, bestPrice).doorMoney -
      settleHome(profile, capacity, DRAW_START, DRAW_START, bestPrice).doorMoney +
      profile.drawDollars;
    let bestNet = -Infinity;
    let bestShare = 0;
    for (const share of SHARE_GRID) {
      const spend = Math.round((share / 100) * door);
      const gain = nextDraw(profile, DRAW_START, spend) - nextDraw(profile, DRAW_START, 0);
      const net = gain * perPoint * weeksLeft - spend;
      if (net > bestNet) {
        bestNet = net;
        bestShare = share;
      }
    }
    return bestShare;
  };
  const bigWeek1 = best("new-york", 2);
  const smallWeek1 = best("memphis", 2);
  assert.notEqual(bigWeek1, smallWeek1, "big and small markets must not share one optimal reinvest share");
  assert.ok(bigWeek1 > 0 && bigWeek1 < SHARE_MAX, `the big market's best share must be interior, got ${bigWeek1}`);
  assert.ok(smallWeek1 > 0 && smallWeek1 < SHARE_MAX, `the small market's best share must be interior, got ${smallWeek1}`);
  assert.ok(best("new-york", 1) < bigWeek1, "the best share must fall as the payoff horizon shortens");
  assert.equal(best("new-york", 0), 0, "on the last week the cash-best share is zero, and the screen says so");
});

test("Draw's ceiling is market-independent and its returns diminish", () => {
  // The ceiling is an ASYMPTOTE, not the top of the scale: gain shrinks toward
  // the cap while decay does not, so Draw settles where the two meet. The
  // design's requirement is that the settling point is IDENTICAL for every
  // market, which is what makes "a big market cannot buy dominance" structural.
  const ceilingOf = (profile: (typeof MARKET_PROFILES)[number]): number => {
    let d = DRAW_MIN;
    for (let i = 0; i < 200; i += 1) d = nextDraw(profile, d, 1_000_000_000);
    return d;
  };
  const ceilings = new Set(MARKET_PROFILES.map(ceilingOf));
  assert.equal(ceilings.size, 1, `markets settle at different Draw ceilings: ${[...ceilings].join(", ")}`);
  assert.ok([...ceilings][0]! >= 80 && [...ceilings][0]! < DRAW_MAX, "the ceiling must be high and below the top of the scale");
  for (const profile of MARKET_PROFILES) {
    assert.equal(nextDraw(profile, DRAW_MIN, 0), DRAW_MIN, "the floor is hard");
    const small = drawGain(profile, DRAW_START, profile.effortScale);
    const big = drawGain(profile, DRAW_START, profile.effortScale * 4);
    assert.ok(big > small, "more money buys more Draw");
    assert.ok(big < small * 2, "but with sharply diminishing returns");
    assert.ok(
      drawGain(profile, 85, profile.effortScale * 4) < drawGain(profile, 30, profile.effortScale * 4),
      "a club near the ceiling gains less than one far from it",
    );
  }
});

test("every club clears its weekly bill from every reachable state at some legal price (R5)", () => {
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 10) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 10) {
        let clears = false;
        for (const price of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, price);
          if (s.doorMoney + localMediaFor(profile, hd) + NATIONAL - profile.bill >= 0) clears = true;
        }
        assert.ok(clears, `${profile.id} cannot clear its bill at Draw ${hd}/${vd}`);
      }
    }
  }
});

test("every building can reach a full house, and the cash-best price moves with the visitor", () => {
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    let maxFill = 0;
    for (const price of PRICE_GRID) maxFill = Math.max(maxFill, settleHome(profile, capacity, 90, 90, price).fillPct);
    assert.ok(maxFill >= 95, `${profile.id} can only reach ${maxFill}% fill`);

    const argmax = (vd: number): number => {
      let best = -1;
      let bestPrice = PRICE_MIN;
      for (const price of PRICE_GRID) {
        const s = settleHome(profile, capacity, DRAW_START, vd, price);
        if (s.doorMoney > best) {
          best = s.doorMoney;
          bestPrice = price;
        }
      }
      return bestPrice;
    };
    assert.ok(argmax(90) - argmax(15) >= 20, `${profile.id}: the best price must move with the visitor's Draw`);
  }
});

/* ---------------------------------------------------------- the privacy -- */

test("the pre-lock student view carries nothing derived from the pending dials", () => {
  let state = seated(4);
  state = ok(act(state, { type: "setPrice", price: 66 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "setShare", share: 35 }, "PLAY", "seat-1"));
  const view = hostTheLeagueModule.studentView(state, "seat-1", "PLAY");

  const slot = state.seatToSlot["seat-1"]!;
  const club = state.clubs[slot]!;
  const profile = MARKET_PROFILES.find((m) => m.id === club.profileId)!;
  const capacity = CLUBS[slot]!.capacity;
  const visitor = state.clubs[visitorSlotFor(slot, 0, state.leagueSize)]!;
  const outcome = settleHome(profile, capacity, club.draw, visitor.draw, 66);

  const numbers: number[] = [];
  const keys: string[] = [];
  walk(view, "$", (n) => numbers.push(n), (k) => keys.push(k));
  for (const [label, quantity] of Object.entries({
    turnout: outcome.turnout,
    gate: outcome.gate,
    inArena: outcome.inArena,
    doorMoney: outcome.doorMoney,
    visitorDollars: outcome.visitorDollars,
    bareDollars: outcome.bareDollars,
  })) {
    if (quantity === 0) continue;
    assert.equal(numbers.includes(quantity), false, `pre-lock view leaked ${label} (${quantity})`);
  }
  for (const key of keys) {
    for (const word of ["preview", "project", "estimate", "expected", "forecast"]) {
      assert.equal(key.toLowerCase().includes(word), false, `pre-lock view carries a "${key}" field`);
    }
  }
});

test("no view on any surface, at any phase, carries a hidden demand constant", () => {
  let state = fullSession(6);
  state = { ...state, barReleased: true, revealStage: REVEAL_STEPS };
  const views: unknown[] = [];
  for (const phase of ALL_PHASES) {
    for (const seatId of Object.keys(state.seatToSlot)) views.push(hostTheLeagueModule.studentView(state, seatId, phase));
    views.push(hostTheLeagueModule.teacherView(state, phase));
    views.push(hostTheLeagueModule.boardView(state, phase));
  }
  views.push(hostTheLeagueModule.aggregate(state, "SYNTHESIS"));

  for (const view of views) {
    walk(view, "$", () => {}, (key) => {
      assert.equal(FORBIDDEN_KEYS.includes(key), false, `view leaked a hidden parameter under key "${key}"`);
    });
  }

  // Structural absence is not enough: assert the actual constants never appear.
  // Every profile's base0 strictly exceeds the biggest building in the league,
  // so a crowd can never collide with one by accident.
  // `base0`, `effortScale` and `localBase` are the three constants a leak would
  // actually be worth something: base0 is the demand intercept, effortScale is
  // the Draw exchange rate, localBase is the market's structural media money.
  // None of them is a quantity any view legitimately publishes.
  const forbidden = new Set<number>();
  for (const m of MARKET_PROFILES) {
    forbidden.add(m.base0);
    forbidden.add(m.effortScale);
    forbidden.add(m.localBase);
  }
  for (const view of views) {
    walk(view, "$", (n, path) => {
      assert.equal(forbidden.has(n), false, `view leaked a hidden constant (${n}) at ${path}`);
    }, () => {});
  }
});

test("a student view never carries another desk's cash, and the board never carries a seat identity", () => {
  const state = fullSession(6);
  const cashByDesk = new Map<number, number>();
  for (const c of state.clubs) if (c.seatId) cashByDesk.set(c.slot, c.cash);

  for (const seatId of Object.keys(state.seatToSlot)) {
    const mine = state.seatToSlot[seatId]!;
    for (const phase of ALL_PHASES) {
      const view = hostTheLeagueModule.studentView(state, seatId, phase);
      const numbers: number[] = [];
      walk(view, "$", (n) => numbers.push(n), () => {});
      for (const [slot, cash] of cashByDesk) {
        if (slot === mine || cash === 0) continue;
        assert.equal(numbers.includes(cash), false, `desk ${mine + 1}'s ${phase} view carries desk ${slot + 1}'s cash`);
      }
      assert.equal(JSON.stringify(view).includes("seat-"), false, `student view leaked a seat id in ${phase}`);
    }
  }

  assert.equal(hostTheLeagueModule.boardView.length, 2, "boardView must take (state, phase) only");
  for (const phase of ALL_PHASES) {
    const raw = JSON.stringify(hostTheLeagueModule.boardView(state, phase));
    for (const seatId of Object.keys(state.seatToSlot)) {
      assert.equal(raw.includes(seatId), false, `board view leaked seat id ${seatId} in ${phase}`);
    }
    // No board surface may carry cash at all — that is the money leaderboard D4
    // and R13 forbid, and it is the one number this lesson keeps private.
    const numbers: number[] = [];
    walk(JSON.parse(raw), "$", (n) => numbers.push(n), () => {});
    for (const cash of cashByDesk.values()) {
      if (cash === 0) continue;
      assert.equal(numbers.includes(cash), false, `board view carries a desk's cash in ${phase}`);
    }
  }
});

test("the board never ranks a desk by money — bar and ledger rows come out in desk order", () => {
  const state = { ...fullSession(9), barReleased: true, revealStage: 1 };
  const board = hostTheLeagueModule.boardView(state, "REVEAL") as Record<string, unknown>;
  const bars = board["bars"] as { deskHandle: string }[];
  const numbers = bars.map((b) => Number(b.deskHandle.replace(/^Desk (\d+).*$/, "$1")));
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
  const agg = computeAggregate(state);
  assert.deepEqual(
    agg.giveAndTake.map((g) => g.deskNumber),
    [...agg.giveAndTake.map((g) => g.deskNumber)].sort((a, b) => a - b),
  );
});

/* --------------------------------------------------- reveal and synthesis -- */

test("the board shows nothing about a week that is still open", () => {
  let state = seated(5);
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY", "seat-1"));
  const board = hostTheLeagueModule.boardView(state, "PLAY") as Record<string, unknown>;
  assert.deepEqual(board["bars"], []);
  assert.equal(board["barReleased"], false);
  assert.ok(Array.isArray(board["pairings"]), "the schedule IS public before the commitment");
});

test("every reveal stage renders its own beat and nothing else", () => {
  let state = fullSession(6);
  const seen: string[] = [];
  for (let i = 1; i <= REVEAL_STEPS; i += 1) {
    state = ok(act({ ...state, revealStage: i - 1 }, { type: "teacher:revealNext" }, "REVEAL", "teacher"));
    const board = hostTheLeagueModule.boardView(state, "REVEAL") as Record<string, unknown>;
    assert.equal(board["revealStage"], i);
    assert.ok(String(board["stageHeadline"] ?? "").length > 0, `stage ${i} has no headline`);
    seen.push(String(board["stageHeadline"]));
    const populated = [
      (board["bars"] as unknown[]).length > 0,
      (board["ledger"] as unknown[]).length > 0,
      (board["pipes"] as unknown[]).length > 0,
      board["smallMarketPath"] !== null,
      board["meanShareByWeek"] !== null,
    ].filter(Boolean).length;
    assert.equal(populated, 1, `stage ${i} put ${populated} panels on the projector at once`);
  }
  assert.equal(new Set(seen).size, REVEAL_STEPS, "every stage must be its own beat");
});

test("synthesis cards are computed from the room's own weeks and name the class's own numbers", () => {
  const state = fullSession(8);
  const agg = computeAggregate(state);
  const cards = synthesisCards(state, agg);
  assert.ok(cards.length >= 4);
  const ids = cards.map((c) => c.id);
  assert.deepEqual(ids, ["shared-product", "spillover", "composition", "market-size", "beyond"]);
  for (const c of cards) assert.ok(c.body.length > 60, `card ${c.id} is empty`);
  // The shared-product card quotes a real matchup from this room.
  const biggest = [...agg.visitorLedger].sort((a, b) => b.gateLift - a.gateLift)[0]!;
  assert.ok(cards[0]!.body.includes(biggest.visitorClub), "the shared-product card must quote the room's own biggest matchup");
  // gate-l2-teacher B5: with no weeks played the deck used to collapse to a
  // single placeholder titled YOU DON'T PLAY ALONE — a title that exists nowhere
  // in the live deck — so the rehearsal the product PRESCRIBES did not rehearse
  // the beat the console itself calls "the part the simulation does not do for
  // you". It now renders all five templates, and every one of them is marked so
  // it can never be read as a live room's arithmetic.
  const emptyCards = synthesisCards(empty(), computeAggregate(empty()));
  assert.equal(emptyCards.length, 5, "the zero-desk rehearsal must render the whole deck, not a placeholder");
  for (const c of emptyCards) {
    assert.match(c.title, /^REHEARSAL — /, `rehearsal card ${c.id} must be unmistakably marked`);
    assert.match(c.body, /STAND-IN/, `rehearsal card ${c.id} must say its figures are not real`);
  }
  assert.equal(
    emptyCards.some((c) => /YOU DON'T PLAY ALONE/.test(c.title)),
    false,
    "no card title may exist that the live deck does not have — the SYNTHESIS time cut names card titles",
  );
});

test("gate-l2-teacher B5: the prescribed zero-student rehearsal renders WATCH FOR at every phase", () => {
  const state = empty();
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const flags = view["watchFor"] as { id: string; label: string; desks: string[]; action: string }[];
    assert.ok(flags.length > 0, `${phase}: WATCH FOR rendered nothing at all with zero desks — the rehearsal cannot rehearse it`);
    for (const f of flags) {
      assert.match(f.label, /^REHEARSAL — /, `${phase}: a zero-desk watch flag must be marked as a rehearsal`);
      assert.ok(f.desks.length > 0 && f.action.length > 0, `${phase}: flag ${f.id} is hollow`);
    }
  }
  // And the moment one real desk exists, the samples are gone.
  const live = seated(6);
  const liveFlags = hostTheLeagueModule.teacherView(live, "PLAY") as Record<string, unknown>;
  for (const f of (liveFlags["watchFor"] as { label: string }[]) ?? []) {
    assert.equal(/REHEARSAL/.test(f.label), false, "a live room must never be shown rehearsal flags");
  }
});

test("the director layer covers every phase with a minute budget and something to do", () => {
  const state = fullSession(6);
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const d = view["director"] as { minuteBudget: string; now: string[]; ask: unknown[]; timeCut: string };
    assert.ok(d.minuteBudget.length > 0, `${phase} has no minute budget`);
    assert.ok(d.now.length > 0, `${phase} has no NOW`);
    assert.ok(d.ask.length > 0, `${phase} has no ASK`);
    assert.ok(d.timeCut.length > 0, `${phase} has no TIME CUT`);
    const projector = view["projectorNow"] as { title: string; lines: string[] };
    assert.ok(projector.title.length > 0, `${phase} has no projector mirror`);
    assert.ok(projector.lines.length > 0, `${phase} projector mirror is empty`);
  }
  const play = hostTheLeagueModule.teacherView(state, "PLAY") as Record<string, unknown>;
  assert.ok((play["simplifications"] as unknown[]).length >= 6, "the simplifications ledger must ship on the teacher surface");
  assert.ok((play["studentScreen"] as string[]).length > 0);
});

test("watch flags never name a desk that is not there, and never fire empty", () => {
  const state = fullSession(6);
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const flags = view["watchFor"] as { id: string; desks: string[] }[];
    for (const f of flags) assert.ok(f.desks.length > 0, `flag ${f.id} fired with no desks`);
  }
});

test("a late desk inherits a club the league office has been running, marked as covered", () => {
  let state = seated(5);
  state = playWeek(state, () => 44, () => 20);
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-late"));
  const slot = state.seatToSlot["seat-late"]!;
  const club = state.clubs[slot]!;
  assert.equal(club.joinedAtWeek, 2);
  assert.equal(club.weeks.length, 1, "the club kept playing while nobody was at the desk");
  assert.equal(club.weeks[0]!.stock, true, "and its own screen says so");
  assert.notEqual(club.cash, 0);
  assert.notEqual(slot, state.shockSlot, "a late desk is never handed the club whose star just left");
});

/* ---- the repairs from the five L2 gates, made falsifiable ---------------- */

test("econ B1: the give/take instrument measures the DECISION — silent in a room where nobody reinvested", () => {
  // The failure this replaces: `gave` correlated 0.959 with the DEALT
  // `startDraw` and only 0.644 with mean reinvest share, so the board named a
  // desk that spent $0 as the room's biggest giver, and harness P3's "visible"
  // limb reproduced in full with every desk at zero.
  let zero = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) zero = playWeek(zero, () => 50, () => 0);
  const zeroAgg = computeAggregate(zero);
  assert.equal(zeroAgg.choiceTotals.anySpend, false);
  for (const r of zeroAgg.giveAndTake) {
    assert.equal(r.spend, 0, `${r.deskHandle} spent nothing but the row says otherwise`);
    assert.equal(r.gaveByChoice, 0, `${r.deskHandle} gave nothing it chose to give, but the instrument says ${r.gaveByChoice}`);
    assert.equal(r.receivedByChoice, 0, `${r.deskHandle} received nothing anybody chose to give`);
    assert.equal(r.netByChoice, 0);
    assert.equal(r.ownGain, 0, "a desk that spent nothing cannot have gained anything by spending");
  }
  // ...and the DEALT ledger in that same room is loud, which is precisely the
  // confound. If this stops being true the instrument has stopped being needed.
  const dealtSpread = Math.max(...zeroAgg.giveAndTake.map((r) => r.net)) - Math.min(...zeroAgg.giveAndTake.map((r) => r.net));
  assert.ok(dealtSpread > 500_000, `the dealt ledger should still show a large spread at zero reinvest, got ${dealtSpread}`);

  // A room that DOES spend produces a non-zero instrument, and only for the
  // desks that actually spent.
  let mixed = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) mixed = playWeek(mixed, () => 50, (i) => (i % 2 === 0 ? 0 : SHARE_MAX));
  const mixedAgg = computeAggregate(mixed);
  assert.equal(mixedAgg.choiceTotals.anySpend, true);
  for (const r of mixedAgg.giveAndTake) {
    if (r.spend === 0) {
      assert.equal(r.gaveByChoice, 0, `${r.deskHandle} spent nothing and must give nothing by choice`);
      assert.equal(r.ownGain, 0);
    } else {
      assert.ok(r.gaveByChoice > 0, `${r.deskHandle} spent ${r.spend} and must show up as a giver by choice`);
    }
  }
  assert.ok(mixedAgg.choiceTotals.gaveByChoice > 0);
});

test("econ B1/B6: no surface or script attributes `gave` to a desk's spending", () => {
  // Every place the old instrument was read as if it measured spending.
  let zero = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) zero = playWeek(zero, () => 50, () => 0);
  const agg = computeAggregate(zero);
  const spill = synthesisCards(zero, agg).find((c) => c.id === "spillover")!;
  assert.match(spill.body, /Nobody in this room put a single dollar back/, "the spillover card must not invent givers in a room that spent nothing");
  assert.equal(/most of what it earned/i.test(spill.body), false, "the falsified 'most' quantifier must be gone");

  // And in a room that did spend, the card prints the MEASURED share and the
  // biggest giver is the biggest SPENDER, not the biggest dealt Draw.
  let mixed = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) mixed = playWeek(mixed, () => 50, (i) => (i % 2 === 0 ? 0 : SHARE_MAX));
  const mixedAgg = computeAggregate(mixed);
  const card = synthesisCards(mixed, mixedAgg).find((c) => c.id === "spillover")!;
  const mixedPct = mixedAgg.choiceTotals.externalPct;
  if (mixedPct !== null) {
    assert.match(card.body, new RegExp(`${mixedPct}% of the value it created`));
  } else {
    // econ B7: this is the OVER-INVESTED room the old card printed "0% of the
    // value it created landed somewhere the desk that paid for it never sees"
    // over, in the same paragraph as the dollars that did exactly that.
    assert.match(card.body, /over-investment AND spillover/, "an over-invested room must get the honest branch, not a percentage");
    assert.equal(/% of the value it created/.test(card.body), false, "no share may print where the value created went the wrong way");
  }
  const namedGiver = [...mixedAgg.giveAndTake].sort((a, b) => b.gaveByChoice - a.gaveByChoice)[0]!;
  assert.ok(namedGiver.spend > 0, "the card may only name a giver that actually spent");
  assert.match(card.body, new RegExp(namedGiver.deskHandle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  // ADAPT Q3's answer key: computed, and pointing at a surface that is live.
  const teach = hostTheLeagueModule.teacherView(mixed, "ADAPT") as Record<string, unknown>;
  const q3 = (teach["director"] as { ask: { q: string; answer: string | null }[] }).ask.at(-1)!;
  assert.equal(/by a distance/i.test(String(q3.answer)), false, "the falsified ADAPT Q3 magnitude must be gone");
  assert.match(String(q3.answer), /BOTH/, "the true answer is that the dial pays the desk AND the buildings it visits");
  assert.equal(
    String(q3.answer).includes(spilloverClaim(mixedAgg.choiceTotals).text),
    true,
    "the answer key must be the SAME computed sentence the card and the board carry, not a second hand-written copy of it",
  );
  assert.match(String(q3.answer), /own screen/, "the ADAPT Q3 answer must point at a surface the teacher can actually put up");
});

test("econ B7 (N9): no printed share is ever above 100%, and none is 0% while a room gave money away", () => {
  // The measured failure: `externalPct = gaveByChoice / (ownGain + gaveByChoice)`
  // printed 0% beside $1,577,412 of spillover in the alternating 0%/40% room
  // (and in the one-spender-versus-eleven-free-riders room), and above 100% in
  // 58 of 200 random rooms, because `ownGain` goes negative whenever the room
  // over-invests. Every one of those rooms is reachable and several are the
  // likeliest teacher set-pieces in the lesson.
  const patterns: { label: string; share: (i: number) => number }[] = [
    { label: "all 10%", share: () => 10 },
    { label: "all 20%", share: () => 20 },
    { label: "all 25%", share: () => 25 },
    { label: "all 40%", share: () => SHARE_MAX },
    { label: "alternating 0/40", share: (i) => (i % 2 === 0 ? 0 : SHARE_MAX) },
    { label: "one spender, rest free-riding", share: (i) => (i === 0 ? SHARE_MAX : 0) },
  ];
  for (const p of patterns) {
    let room = seated(12);
    for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => 50, p.share);
    const agg = computeAggregate(room);
    const ct = agg.choiceTotals;
    if (ct.externalPct !== null) {
      assert.ok(ct.externalPct >= 0 && ct.externalPct <= 100, `${p.label}: printed share ${ct.externalPct}% is outside 0-100`);
      assert.ok(
        !(ct.externalPct === 0 && ct.gaveByChoice > 0),
        `${p.label}: printed 0% beside ${ct.gaveByChoice} of measured spillover`,
      );
    }
    // Wherever the share is withheld, the room is told why, in dollars — and
    // told WHICH situation it is in. econ N11/B9: withholding the percentage is
    // a fact about the denominator, never a verdict about the room.
    const body = synthesisCards(room, agg).find((c) => c.id === "spillover")!.body;
    if (ct.externalPct === null && ct.anySpend) {
      assert.match(body, /no share to print here/, `${p.label}: the room must be told why the share is withheld`);
      assert.match(body, new RegExp(money(ct.spend).replace(/[$,]/g, "\\$&")), `${p.label}: the dollars must print where the share cannot`);
      if (ct.roomJointGain > 0) {
        // econ N17/B11: the noun this branch is entitled to is the one the joint
        // figure decides. The LEVEL is a separate, separately-computed sentence.
        assert.match(body, /the room as a whole still came out ahead/, `${p.label}: a room that came out ahead must be told so, not told it over-invested`);
      } else if (ct.roomJointGain < 0) {
        assert.match(body, /this room over-invested/, `${p.label}: a room that came out behind over-invested`);
      }
    }
    // And the "paid YOU" claim never prints against a negative private column.
    if (ct.ownGain < 0) assert.equal(/paid YOU/.test(body), false, `${p.label}: "paid YOU" printed against ${ct.ownGain}`);
  }
});

test("econ B8 (N10): the room-total sentence never disagrees in SIGN with the joint effect", () => {
  // The measured failure: in a mixed 0-40% room the board and the SPILLOVER
  // card told the class reinvesting cost these desks $1,153,068 when the room
  // was $546,124 better off for having done it. The private column is a sum of
  // one-desk-at-a-time partials; the residue is `receivedByChoice`, which the
  // split charges to the payer and never returns to the room's books.
  const patterns: ((i: number) => number)[] = [() => 10, () => 20, (i) => (i % 3) * 15, (i) => (i % 2 === 0 ? 0 : SHARE_MAX), () => SHARE_MAX];
  for (const share of patterns) {
    for (const price of [30, 50, 70]) {
      let room = seated(8);
      for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, share);
      const agg = computeAggregate(room);
      const ct = agg.choiceTotals;
      if (!ct.anySpend) continue;
      const text = spilloverClaim(ct).text;
      const saysBetter = /better off/.test(text);
      const saysWorse = /worse off/.test(text);
      const sign = Math.sign(ct.roomJointGain);
      if (sign > 0) assert.ok(saysBetter && !saysWorse, `joint +${ct.roomJointGain} but the sentence says: ${text}`);
      if (sign < 0) assert.ok(saysWorse && !saysBetter, `joint ${ct.roomJointGain} but the sentence says: ${text}`);
      // The private column may still be negative — it just may never be the
      // room-level verdict. It must be labelled as a per-desk sum.
      assert.match(text, /Desk by desk/, "the sum of partials must be labelled as a sum of partials");
      assert.match(text, /Counted as one room/, "the joint figure must be published beside it");
    }
  }
});

test("play R4 / econ B3: the small-market exhibit attributes from the decomposition, and prints both prices", () => {
  // The reachable case the econ gate probed: odd desks at $110, even desks at
  // $30. The old selector printed "it won it on WHO WAS VISITING" over an $80
  // price gap.
  let state = seated(10);
  for (let w = 0; w < WEEK_COUNT; w += 1) state = playWeek(state, (i) => (i % 2 === 0 ? 110 : 30), () => 10);
  const path = computeAggregate(state).smallMarketPath;
  if (path.found) {
    assert.ok(path.line.includes(`priced at $${path.smallPrice},`), `the exhibit must print the small-market desk's price: ${path.line}`);
    assert.ok(path.line.includes(`priced at $${path.bigPrice},`), `the exhibit must print the big-market desk's price: ${path.line}`);
    // The three blocks account for the whole gap, exactly.
    assert.equal(
      path.gapFromVisitor + path.gapFromBuildingAndPrice + path.gapFromOwnDraw,
      path.smallDoorMoney - path.bigDoorMoney,
      "the attribution must decompose the gap exactly, not approximately",
    );
    // econ B3, round 3. A causal claim about MARKET SIZE may only print when
    // the win survives holding the price still. In this $110-vs-$30 room it
    // does not, and the exhibit must say so instead of naming a block.
    if (!path.survivesPriceControl) {
      assert.equal(path.driver, "price", "a win that vanishes under the price control was carried by price");
      assert.match(path.line, /THE PRICE GAP carried it/);
      assert.equal(/WHO WAS VISITING carried it/.test(path.line), false, "a price-driven gap may never be attributed to the visitor");
    } else {
      const parts: Record<string, number> = {
        visitor: path.gapFromVisitor,
        "building-and-price": path.gapFromBuildingAndPrice,
        "own-draw": path.gapFromOwnDraw,
      };
      const biggest = Object.entries(parts).sort((a, b) => b[1] - a[1])[0]![0];
      const claimable = path.gapFromVisitor <= path.smallDoorMoney - path.bigDoorMoney;
      if (biggest === "visitor" && claimable) assert.equal(path.driver, "visitor");
      assert.notEqual(path.driver, "price", "a surviving win must name a block, not price");
    }
    // A block larger than the gap it explains must never print alone: all three
    // block figures are on the exhibit, every time.
    assert.ok(path.line.includes(`${money(path.gapFromVisitor)} the visiting club`), `the visitor block must print: ${path.line}`);
    assert.ok(path.line.includes(`${money(path.gapFromBuildingAndPrice)} the building and the price`), `the building block must print: ${path.line}`);
    assert.ok(path.line.includes(`${money(path.gapFromOwnDraw)} that desk's own Draw`), `the own-Draw block must print: ${path.line}`);
    // ...and the two price-controlled figures the room needs to check it.
    assert.ok(path.line.includes(money(path.gapAtSmallPrice)) && path.line.includes(money(path.gapAtBigPrice)), "both controlled gaps must print");
  }
  // A room priced uniformly is where the visitor SHOULD carry it, and does —
  // and where the price control is vacuous, which is the point of running it.
  let flat = seated(10);
  for (let w = 0; w < WEEK_COUNT; w += 1) flat = playWeek(flat, () => 50, () => 10);
  const flatPath = computeAggregate(flat).smallMarketPath;
  if (flatPath.found) {
    assert.equal(flatPath.survivesPriceControl, true, "at one price for the whole room the win cannot be a price gap");
    assert.notEqual(flatPath.driver, "price", "with one price for the whole room, price cannot be the driver");
    // The named driver is the recomputed largest block among the blocks that
    // are not larger than the gap they explain.
    const gap = flatPath.smallDoorMoney - flatPath.bigDoorMoney;
    const named: Record<string, number> = {
      visitor: flatPath.gapFromVisitor,
      "building-and-price": flatPath.gapFromBuildingAndPrice,
      "own-draw": flatPath.gapFromOwnDraw,
    };
    if (flatPath.gapFromVisitor <= gap && flatPath.gapFromVisitor >= flatPath.gapFromBuildingAndPrice && flatPath.gapFromVisitor >= flatPath.gapFromOwnDraw) {
      assert.equal(flatPath.driver, "visitor");
      assert.match(flatPath.line, /WHO WAS VISITING carried it/);
    }
    assert.ok(named[flatPath.driver] !== undefined, `unexpected driver ${flatPath.driver}`);
  }
});

test("econ B9 (N11): no surface ever says over-investment in a room that came out jointly ahead", () => {
  // The measured failure: the `externalPct === null` branch named the situation
  // from `created = ownGain + gaveByChoice` — the aggregate the module's own
  // ChoiceTotals docstring forbids using at room level — and printed
  // "over-investment" in 173 of 177 plausible-price rooms that the joint figure,
  // three clauses later on the same card, said were up to $2.4M BETTER off.
  // Privately unprofitable and socially profitable is under-provision under a
  // positive externality: the concept this module is named for, and the exact
  // opposite of the noun that printed. It was on the projector, the SPILLOVER
  // card and the teacher's answer key.
  const prices: { label: string; f: (i: number) => number }[] = [
    { label: "flat $50", f: () => 50 },
    { label: "flat $70", f: () => 70 },
    { label: "$110/$30", f: (i) => (i % 2 === 0 ? 110 : 30) },
    { label: "spread", f: (i) => [30, 42, 56, 68, 84, 96, 46, 62][i % 8]! },
  ];
  const shares: { label: string; f: (i: number) => number }[] = [
    { label: "all 10%", f: () => 10 },
    { label: "all 25%", f: () => 25 },
    { label: "all 30%", f: () => 30 },
    { label: "all 40%", f: () => SHARE_MAX },
    { label: "alternating 0/40", f: (i) => (i % 2 === 0 ? 0 : SHARE_MAX) },
    { label: "one spender", f: (i) => (i === 0 ? SHARE_MAX : 0) },
  ];
  let ahead = 0;
  let behind = 0;
  let withheld = 0;
  for (const P of prices) {
    for (const S of shares) {
      let room = seated(12);
      for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, P.f, S.f);
      const agg = computeAggregate(room);
      const ct = agg.choiceTotals;
      if (!ct.anySpend) continue;
      if (ct.externalPct === null) withheld += 1;
      if (ct.roomJointGain > 0) ahead += 1;
      else if (ct.roomJointGain < 0) behind += 1;
      // EVERY claim-carrying surface in the lesson, not only the SPILLOVER card:
      // the same sentence reaches board:reveal-2, teach:adapt-q3 and synthesis.
      for (const surface of moduleClaims(room)) {
        if (ct.roomJointGain > 0) {
          assert.equal(
            /over-invest/i.test(surface.text),
            false,
            `${P.label} · ${S.label} · ${surface.surface}: "over-invest" printed in a room $${Math.round(ct.roomJointGain).toLocaleString()} BETTER off`,
          );
        }
        if (ct.roomJointGain < 0 && ct.externalPct === null) {
          assert.equal(
            /the room as a whole still came out ahead/.test(surface.text),
            false,
            `${P.label} · ${S.label} · ${surface.surface}: "came out ahead" printed in a room that came out behind`,
          );
        }
        // econ N17/FL-L: the retired clause may not come back anywhere, in any
        // arm, on any surface. It was a marginal claim decided by a total.
        assert.equal(
          /less went back in than this room's own numbers would justify/.test(surface.text),
          false,
          `${P.label} · ${S.label} · ${surface.surface}: the retired FL-L clause is back on a surface`,
        );
      }
      // The branch word is an ATOM, so the audit can see it — not prose beside one.
      const spill = spilloverClaim(ct);
      if (ct.externalPct === null) {
        const noun = spill.claims.find((c) => c.id === "spillover.branchNoun");
        assert.ok(noun, `${P.label} · ${S.label}: the branch noun carries no claim atom`);
        assert.equal(
          noun!.rendered,
          ct.roomJointGain > 0
            ? "the room as a whole still came out ahead"
            : ct.roomJointGain < 0
              ? "this room over-invested"
              : "the room came out exactly level",
          `${P.label} · ${S.label}: the branch noun is not the one roomJointGain names`,
        );
      }
    }
  }
  // The cross-tab must be non-vacuous in BOTH directions or this proves nothing.
  assert.ok(withheld > 0, "no room in the sweep withheld the share — the branch under test never fired");
  assert.ok(ahead > 0, "no room in the sweep came out jointly ahead — the N11 case was never exercised");
  assert.ok(behind > 0, "no room in the sweep came out jointly behind — the over-investment case was never exercised");
});

test("econ B11 (N17): the level instrument reproduces the room's ACTUAL books exactly, and reduces to the room's own weeks", () => {
  // `roomCashAtShares` is the whole basis of the level sentence, so the first
  // thing it has to survive is the identity: fed each week's own share back, it
  // must land on the number the reducer actually settled, to the dollar. If it
  // drifts here it is not this room's books and no sentence built on it means
  // anything.
  for (const desks of [8, 12]) {
    for (const price of [30, 50, 70, 110]) {
      for (const shape of [() => 0, () => 10, () => 25, () => SHARE_MAX, (i: number) => (i % 2 === 0 ? 0 : SHARE_MAX), (i: number) => SHARE_GRID[i % SHARE_GRID.length]!]) {
        let room = seated(desks);
        for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, shape);
        const settled = room.clubs
          .filter((c) => c.seatId !== null && c.weeks.length > 0)
          .reduce((sum, c) => sum + c.weeks.reduce((t, w) => t + w.net, 0), 0);
        assert.equal(
          roomCashAtShiftedShares(room, 0),
          settled,
          `${desks} desks · $${price}: the level instrument disagrees with the room's settled cash`,
        );
      }
    }
  }
});

test("econ B11/FL-L (N17, BLOCKING): no surface tells a room to put MORE back in where a one-step increase lowers room cash", () => {
  // THE BLOCKING FAILURE, stated as a property. The retired clause — "less went
  // back in than this room's own numbers would justify" — was a claim about the
  // room's LEVEL decided by the SIGN of a total. It fired only at shares >= 25%
  // and the room's own books peak at 10-15%, so a uniform +5pp step made those
  // rooms jointly WORSE off in 68 of 86 rooms the econ critic measured. The
  // prescription is now built from `roomOptimum` and may only print where the
  // room's own one-step gradient agrees.
  const PRESCRIBE_MORE = "putting more back in would have left this room holding more money";
  const PRESCRIBE_LESS = "the dollars past it cost this room more than they brought back";
  const arms: Record<string, number> = {};
  let checkedMore = 0;
  let checkedLess = 0;
  let upHurtRooms = 0;
  for (const desks of [8, 12]) {
    for (const price of [30, 50, 70, 90, 110]) {
      for (const shape of [
        () => 0,
        () => 5,
        () => 10,
        () => 15,
        () => 25,
        () => SHARE_MAX,
        (i: number) => (i % 2 === 0 ? 0 : SHARE_MAX),
        (i: number) => (i === 0 ? SHARE_MAX : 0),
        (i: number) => SHARE_GRID[i % SHARE_GRID.length]!,
      ]) {
        let room = seated(desks);
        for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, shape);
        const ct = computeAggregate(room).choiceTotals;
        if (!ct.anySpend) continue;
        const opt = ct.roomOptimum;
        arms[opt.relation] = (arms[opt.relation] ?? 0) + 1;
        const base = roomCashAtShiftedShares(room, 0);
        const up = roomCashAtShiftedShares(room, 5);
        const down = roomCashAtShiftedShares(room, -5);
        if (up <= base) upHurtRooms += 1;
        const label = `${desks} desks · $${price} · band ${opt.bandLo}-${opt.bandHi}% · level ${opt.actualShare}% · ${opt.relation}`;
        // EVERY claim-carrying surface, because the same builder reaches
        // board:reveal-2, teach:adapt-q3 and synthesis:spillover.
        for (const surface of moduleClaims(room)) {
          if (surface.text.includes(PRESCRIBE_MORE)) {
            checkedMore += 1;
            assert.ok(up > base, `${label} · ${surface.surface}: told to put MORE back in, but +5pp on every dial moves the room ${base} -> ${up}`);
          }
          if (surface.text.includes(PRESCRIBE_LESS)) {
            checkedLess += 1;
            assert.ok(down > base, `${label} · ${surface.surface}: told it overspent, but -5pp on every dial moves the room ${base} -> ${down}`);
          }
        }
        // And the range printed is the range computed, on every surface.
        for (const surface of moduleClaims(room)) {
          const lo = surface.claims.find((c) => c.id === "spillover.bandLo");
          const hi = surface.claims.find((c) => c.id === "spillover.bandHi");
          if (!lo || !hi) continue;
          assert.equal(lo.value, opt.bandLo, `${label} · ${surface.surface}: printed low edge`);
          assert.equal(hi.value, opt.bandHi, `${label} · ${surface.surface}: printed high edge`);
          assert.ok(lo.value <= opt.bestShare && hi.value >= opt.bestShare, `${label}: the printed range excludes its own best setting ${opt.bestShare}%`);
          assert.ok(surface.text.includes(lo.rendered) && surface.text.includes(hi.rendered), `${label} · ${surface.surface}: an edge is not on the surface`);
        }
      }
    }
  }
  // Non-vacuity in every direction, or this test proves nothing.
  assert.ok(checkedMore > 0, 'no room in the sweep printed "put more back in" — the FL-L arm was never exercised');
  assert.ok(checkedLess > 0, 'no room in the sweep printed the overspend clause — that arm was never exercised');
  assert.ok(upHurtRooms > 0, "no room in the sweep was one where a +5pp step hurts — N17's falsifying region is not covered");
  assert.ok((arms["below"] ?? 0) > 0 && (arms["above"] ?? 0) > 0 && (arms["inside"] ?? 0) > 0, `the level arms are not all reachable: ${JSON.stringify(arms)}`);
});

test("econ B12 (N18): the level relation and its range are what the room's own curve says, not what any sign says", () => {
  // N18: the old limb audited sign(joint) — true of almost every reachable room
  // — while the sentence beside it asserted a level. This asserts the level
  // itself, recomputed here from `roomCashAtUniformShare` rather than read off
  // `roomOptimum`, and asserts the relation's five-way branch independently.
  for (const desks of [8, 12]) {
    for (const price of [30, 50, 90]) {
      for (const shape of [() => 0, () => 10, () => 25, () => SHARE_MAX, (i: number) => SHARE_GRID[i % SHARE_GRID.length]!]) {
        let room = seated(desks);
        for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, shape);
        const opt = computeAggregate(room).choiceTotals.roomOptimum;
        const curve = SHARE_GRID.map((s) => roomCashAtUniformShare(room, s));
        const max = Math.max(...curve);
        const floorAt = max - (max - Math.min(...curve)) * OPTIMUM_BAND_TOLERANCE;
        const label = `${desks} desks · $${price}`;
        assert.equal(curve[SHARE_GRID.indexOf(opt.bestShare)], max, `${label}: bestShare is not the argmax of the room's own curve`);
        for (const s of SHARE_GRID) {
          const inBand = s >= opt.bandLo && s <= opt.bandHi;
          if (inBand) assert.ok(curve[SHARE_GRID.indexOf(s)]! >= floorAt, `${label}: ${s}% is inside the printed band but below the band floor`);
        }
        // The band must be contiguous around the best and stop where the curve does.
        if (opt.bandLo > 0) assert.ok(curve[SHARE_GRID.indexOf(opt.bandLo) - 1]! < floorAt, `${label}: the band stops short of a setting that qualifies`);
        if (opt.bandHi < SHARE_MAX) assert.ok(curve[SHARE_GRID.indexOf(opt.bandHi) + 1]! < floorAt, `${label}: the band stops short of a setting that qualifies`);
        // The five-way relation, re-derived.
        const base = roomCashAtShiftedShares(room, 0);
        const want =
          opt.actualShare < opt.bandLo
            ? roomCashAtShiftedShares(room, 5) > base
              ? "below"
              : "underButFlat"
            : opt.actualShare > opt.bandHi
              ? roomCashAtShiftedShares(room, -5) > base
                ? "above"
                : "overButFlat"
              : "inside";
        assert.equal(opt.relation, want, `${label}: the printed relation is not the one the room's own curve and gradient give`);
      }
    }
  }
});

test("econ FL-M (N21): the composition card claims no unbound superlative, and counts the desks the national check really leads", () => {
  // The measured failure: the title "THE BIGGEST CHECK IS THE ONE NOBODY
  // CONTROLS" was false for 28-30 of every 100 desk-instances at every price
  // probed — a desk's local media routinely beats its national check.
  let sawMinority = false;
  for (const desks of [8, 12]) {
    for (const price of [30, 50, 70, 90, 110]) {
      let room = seated(desks);
      for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, () => 10);
      const agg = computeAggregate(room);
      const card = synthesisCards(room, agg).find((c) => c.id === "composition")!;
      const label = `${desks} desks · $${price}`;
      assert.equal(/BIGGEST CHECK/.test(card.title), false, `${label}: the unbound superlative is back in the title`);
      const want = agg.pipes.filter((p) => p.national >= p.gate && p.national >= p.inArena && p.national >= p.localMedia).length;
      if (want < agg.pipes.length) sawMinority = true;
      const atom = card.claims!.find((c) => c.id === "composition.nationalBiggestCount");
      assert.ok(atom, `${label}: the counted superlative carries no atom`);
      assert.equal(atom!.value, want, `${label}: printed count`);
      assert.match(card.body, new RegExp(`on ${want} of ${agg.pipes.length} desks`), `${label}: the count is not on the card`);
    }
  }
  assert.ok(sawMinority, "no probed room had a desk whose national check was NOT its biggest pipe — FL-M was never exercised");
});

test("econ FL-K: the give/take sub-label prints the measured dealt share, never an unbound 'most'", () => {
  // The measured failure: a static string on the student device — "Everything
  // your Draw moved — MOST OF IT the Draw you were DEALT" — false in 16 of 96
  // probed desk-instances (worst: 60% of a desk's give was BOUGHT, not dealt),
  // and false in exactly the high-reinvest rooms the lesson wants to celebrate.
  for (const share of [() => 0, () => 20, () => SHARE_MAX]) {
    let room = seated(12);
    for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => 90, share);
    const agg = computeAggregate(room);
    for (const row of agg.giveAndTake) {
      const line = dealtLineClaimed(row);
      assert.equal(/most of it/i.test(line.text), false, `desk ${row.deskNumber}: the unbound quantifier is still on the student device`);
      if (row.gave > 0) {
        const dealtPct = Math.round((Math.max(0, row.gave - row.gaveByChoice) / row.gave) * 100);
        assert.ok(line.text.includes(`${dealtPct}% of it the Draw you were DEALT`), `desk ${row.deskNumber}: printed share is not the computed one — ${line.text}`);
        const atom = line.claims.find((c) => c.id === "desk.dealtPct");
        assert.equal(atom?.value, dealtPct, `desk ${row.deskNumber}: the atom does not carry the printed value`);
      }
    }
  }
});

test("projector W4-1: the stage-5 lock clause is true about the room on every release arm", () => {
  // The measured failure, observed live on the arm /teach itself prescribes:
  // "some desks had already locked" printed to a room in which ZERO desks had.
  // `barReleasedAtWeek === WEEK_COUNT - 1` covers two different rooms and the
  // copy asserted the messy one unconditionally.
  const played = fullSession(6);
  const arm = (at: number | null, lockedAt: number | null): HostLeagueState =>
    ({ ...played, barReleased: at !== null, barReleasedAtWeek: at, lockedAtBarRelease: lockedAt }) as HostLeagueState;

  const prescribed = arm(WEEK_COUNT - 1, 0);
  assert.equal(barReleaseArm(prescribed), "lastWeekNoneLocked");
  const prescribedLine = reinvestChangeLine(computeAggregate(prescribed), prescribed);
  assert.equal(/desks had already locked/.test(prescribedLine), false, "the prescribed release must not claim desks had locked when none had");
  assert.match(prescribedLine, /before a single desk had locked week 3 in/);

  const midWeek = arm(WEEK_COUNT - 1, 4);
  assert.equal(barReleaseArm(midWeek), "lastWeekSomeLocked");
  const midLine = reinvestChangeLine(computeAggregate(midWeek), midWeek);
  assert.match(midLine, /4 of 6 desks had already locked/, "a mid-week-3 release must print the measured lock count");

  const never = arm(null, null);
  assert.equal(barReleaseArm(never), "never");
  const week2 = arm(1, 0);
  assert.equal(barReleaseArm(week2), "beforeLastWeek");
  // A snapshot written before the stamp existed asserts nothing either way.
  const legacy = { ...played, barReleased: true, barReleasedAtWeek: WEEK_COUNT - 1 } as HostLeagueState;
  delete (legacy as { lockedAtBarRelease?: unknown }).lockedAtBarRelease;
  assert.equal(barReleaseArm(legacy), "lastWeekLockCountUnknown");
  const legacyLine = reinvestChangeLine(computeAggregate(legacy), legacy);
  assert.equal(/desks had already locked/.test(legacyLine), false);
  assert.equal(/before a single desk had locked/.test(legacyLine), false);
});

test("projector W4-2: /teach's stage-5 mirror follows the clause the board actually printed", () => {
  // The measured failure: the ON-THE-PROJECTOR mirror was byte-identical across
  // all four release arms and told the teacher "this board deliberately refuses
  // to choose" in the arm where the board had already chosen — coaching a
  // two-candidate argument the screen behind them had closed.
  const played = fullSession(6);
  const arms: { at: number | null; lockedAt: number | null; label: string }[] = [
    { at: null, lockedAt: null, label: "C · never pressed" },
    { at: 1, lockedAt: 0, label: "B · during week 2" },
    { at: WEEK_COUNT - 1, lockedAt: 0, label: "A · the prescribed release" },
    { at: WEEK_COUNT - 1, lockedAt: 4, label: "D · mid week 3" },
  ];
  const seen = new Set<string>();
  for (const a of arms) {
    const state = { ...played, barReleased: a.at !== null, barReleasedAtWeek: a.at, lockedAtBarRelease: a.lockedAt } as HostLeagueState;
    const mirror = teachStage5MirrorClaimed(state);
    const boardLine = reinvestChangeLine(computeAggregate(state), state);
    seen.add(mirror.text);
    const boardChose = !sawBarBeforeWeek3(state);
    if (boardChose) {
      assert.match(boardLine, /the bar is not on the table|nothing on this frame can be about the bar/, `arm ${a.label}: the board did not in fact choose`);
      assert.match(mirror.text, /this board has ALREADY chosen/, `arm ${a.label}: the mirror promises an open argument the board has closed`);
      assert.equal(/refuses to choose/.test(mirror.text), false, `arm ${a.label}: the invariant coaching is still printed`);
    } else {
      assert.match(mirror.text, /refuses to choose/, `arm ${a.label}: the mirror must say the board is holding both candidates`);
      assert.equal(/ALREADY chosen/.test(mirror.text), false, `arm ${a.label}`);
    }
    if (a.lockedAt !== null && a.lockedAt > 0 && a.at === WEEK_COUNT - 1) {
      assert.match(mirror.text, /4 of 6 desks had already locked/, `arm ${a.label}: the mirror must name who could have used the bar`);
    }
  }
  assert.equal(seen.size, arms.length, "the mirror is still invariant across arms — that is the defect");
});

test("projector R-1 / play N-3: the bar clause is true about the room at every release point, and the DOWN branch never contradicts it", () => {
  // The measured failure, two-arm probe by the projector critic and observed
  // independently by the play critic: `barReleasedAtWeek < WEEK_COUNT - 1`
  // scored the release /teach ITSELF prescribes ("it lands hardest after WEEK
  // 2") as "after week 3", so the projector told a room that had been reading
  // the bar while it priced week 3 that it had never seen it.
  const played = fullSession(6);
  // weekIndex at press time, by release point.
  const cases: { at: number | null; released: boolean; saw: boolean; what: string }[] = [
    { at: null, released: false, saw: false, what: "never released" },
    { at: 1, released: true, saw: true, what: "during the week-2 open window" },
    { at: 2, released: true, saw: true, what: "after the week-2 bell — the /teach-prescribed release" },
    { at: WEEK_COUNT, released: true, saw: false, what: "after the final bell" },
  ];
  for (const c of cases) {
    const state: HostLeagueState = { ...played, barReleased: c.released, barReleasedAtWeek: c.at };
    assert.equal(sawBarBeforeWeek3(state), c.saw, `release ${c.what}: the controlling variable is wrong`);
    const line = reinvestChangeLine(computeAggregate(state), state);
    if (c.saw) {
      assert.equal(/did NOT see the Handed-To-You bar/.test(line), false, `release ${c.what}: the board told the room something untrue about itself`);
    } else {
      assert.match(line, /did NOT see the Handed-To-You bar/, `release ${c.what}: the room did not see it and must be told so`);
      // The self-contradiction: the DOWN sentence used to name the bar
      // unconditionally, four sentences after this clause.
      assert.equal(/whatever they made of the bar/.test(line), false, `release ${c.what}: the frame names the bar it just ruled out`);
    }
  }
});

test("play N-4: a desk that gave nothing is told what it chose, and what the room's spending put in its building", () => {
  let room = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => 50, (i) => (i === 0 ? 0 : 20));
  const agg = computeAggregate(room);
  const rider = agg.giveAndTake.find((r) => r.spend === 0)!;
  const spender = agg.giveAndTake.find((r) => r.spend > 0)!;
  assert.equal(rider.gaveByChoice, 0);
  assert.equal(rider.ownGain, 0);
  const riderLine = deskChoiceLineClaimed(rider).text;
  assert.match(riderLine, /chose to give nothing/, "the free-rider's block must name the decision, not read as a missing number");
  assert.ok(riderLine.includes(money(rider.receivedByChoice)), "the free-rider must be shown what the room's spending put in its building");
  assert.equal(
    /except you put nothing back/.test(riderLine),
    false,
    "a desk that put nothing back may not be offered a counterfactual identical to what it did",
  );
  const spenderLine = deskChoiceLineClaimed(spender).text;
  assert.match(spenderLine, /except you put nothing back/, "a spender still gets the luck-controlled counterfactual");
  assert.equal(/chose to give nothing/.test(spenderLine), false);
});

test("play N-5: the post-hoc price counterfactual reproduces the week it re-prices, and never claims a better price is worse", () => {
  const played = fullSession(8);
  let checked = 0;
  for (const club of played.clubs.filter((c) => c.seatId !== null)) {
    for (const w of club.weeks) {
      const cf = priceCounterfactualFor(played, club, w);
      // The identity that makes this a measurement and not an illustration: at
      // the price they actually charged, the counterfactual IS the week.
      const atYours = cf.rows.find((r) => r.you)!;
      assert.equal(atYours.kept, w.net, `${club.slot} week ${w.week + 1}: the counterfactual does not reproduce the settled week`);
      assert.equal(cf.yourKept, w.net);
      assert.ok(cf.bestDelta >= 0, "the best price on the dial can never keep less than the price they charged");
      assert.equal(cf.foundBest, cf.bestPrice === w.price);
      if (cf.foundBest) assert.equal(cf.bestDelta, 0);
      checked += 1;
    }
  }
  assert.ok(checked >= 20, `expected a real sweep, checked ${checked} weeks`);
});

test("CLAIM AUDIT: every rendered claim string agrees with the reducer in sign, quantifier and bound", () => {
  // The systemic instrument. This is the in-suite limb; the sweep over many
  // rooms and the mutation proof live in the L2 tuning harness (P11).
  const rooms: HostLeagueState[] = [];
  for (const share of [() => 0, () => 10, () => SHARE_MAX, (i: number) => (i % 2 === 0 ? 0 : SHARE_MAX)]) {
    for (const price of [(i: number) => (i % 2 === 0 ? 110 : 30), () => 50]) {
      let room = seated(8);
      for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, price, share);
      rooms.push(room);
    }
  }
  let atoms = 0;
  for (const room of rooms) {
    for (const surface of moduleClaims(room)) {
      for (const a of surface.claims) {
        atoms += 1;
        // STRUCTURAL BINDING: the printed fragment is the value's rendering.
        const rendered =
          a.format === "money"
            ? money(a.value)
            : a.format === "percent"
              ? `${Math.round(a.value)}%`
              : a.format === "percent1"
                ? `${Math.round(a.value * 10) / 10}%`
                : `${Math.round(a.value)}`;
        assert.equal(a.rendered, a.quantifier ? a.rendered : rendered, `${surface.surface}/${a.id}: rendered fragment drifted from its value`);
        assert.ok(surface.text.includes(a.rendered), `${surface.surface}/${a.id}: "${a.rendered}" is not on the surface`);
        if (a.absent !== undefined) {
          assert.equal(surface.text.includes(a.absent), false, `${surface.surface}/${a.id}: forbidden phrase "${a.absent}" is on the surface`);
        }
        // SIGN
        if (a.assertsSign === "positive") assert.ok(a.value > 0, `${surface.surface}/${a.id}: sentence asserts positive, value is ${a.value}`);
        if (a.assertsSign === "negative") assert.ok(a.value < 0, `${surface.surface}/${a.id}: sentence asserts negative, value is ${a.value}`);
        if (a.assertsSign === "nonNegative") assert.ok(a.value >= 0, `${surface.surface}/${a.id}: sentence asserts non-negative, value is ${a.value}`);
        if (a.assertsSign === "zero") assert.equal(a.value, 0, `${surface.surface}/${a.id}: sentence asserts zero`);
        // BOUND
        if (a.bounds?.min !== undefined) assert.ok(a.value >= a.bounds.min, `${surface.surface}/${a.id}: ${a.value} below bound ${a.bounds.min}`);
        if (a.bounds?.max !== undefined) assert.ok(a.value <= a.bounds.max, `${surface.surface}/${a.id}: ${a.value} above bound ${a.bounds.max}`);
      }
    }
  }
  assert.ok(atoms > 200, `the sweep must actually cover the lesson's claims, saw ${atoms} atoms`);
});

test("play R3 / econ FL-F: reveal 5 never claims spontaneity, and always carries the last-week rule", () => {
  const held = fullSession(6); // fullSession never releases the bar mid-lesson
  const line = reinvestChangeLine(computeAggregate(held), held);
  assert.equal(/[Nn]obody told this room to move/.test(line), false, "the unfalsifiable causal claim must be gone");
  assert.match(line, /LAST week|last-week rule/i, "the beat must carry its controlling variable");
  assert.match(line, /earns nothing else in this lesson/, "the horizon effect must be stated, not implied");
  assert.match(line, /did NOT see the Handed-To-You bar before it played week 3/, "a room that never saw the bar must be told the bar cannot be the cause");

  // A room that DID see the bar before week 3 gets the bar named as one
  // candidate, never as the cause.
  const saw: HostLeagueState = { ...held, barReleased: true, barReleasedAtWeek: 1 };
  const sawLine = reinvestChangeLine(computeAggregate(saw), saw);
  assert.match(sawLine, /did see the Handed-To-You bar/);
  assert.equal(/[Nn]obody told this room to move/.test(sawLine), false);

  // A room that held its dial flat across all three weeks must not be narrated
  // as having moved in either direction.
  let flat = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) flat = playWeek(flat, () => 50, () => 20);
  const flatLine = reinvestChangeLine(computeAggregate(flat), flat);
  assert.match(flatLine, /level/);
  assert.equal(/went UP|went DOWN/.test(flatLine), false, "a flat room must not be described as moving");
});

test("econ B4/B5: the two false printed rules are gone, and what replaces them is true of the model", () => {
  // B5 — the Draw-to-cash claim. A Draw point pays $12,000/week in local media
  // plus $4,704-$7,722 on every home night; there is a real exchange rate.
  assert.equal(/cannot turn Draw back into cash/i.test(OBJECTIVE_COPY), false);
  assert.match(OBJECTIVE_COPY, /pays you back/i);
  for (const profile of MARKET_PROFILES) {
    assert.ok(profile.drawDollars > 0, "the local-media Draw term is what makes the old claim false — it must exist");
  }

  // B4 — the maintenance rule. No numeric break-even share may be printed at
  // all, because the true one is 5-20% depending on Draw and door money and
  // computing it on the student screen would be a demand-curve preview (R2).
  for (const week of [1, 2, WEEK_COUNT]) {
    const rule = reinvestRuleFor(week);
    const all = [rule.line, ...rule.detail].join(" ");
    assert.equal(/\d+\s*%/.test(all), false, `week ${week}'s reinvest rule still prints a percentage: ${all}`);
    assert.equal(/about a fifth/i.test(all), false, "the falsified 'about a fifth' rule must be gone");
    assert.ok(rule.line.split(/\s+/).length <= 25, `the always-visible rule is ${rule.line.split(/\s+/).length} words — it consumes the fold`);
  }
  // The replacement claim — "near the top of the scale no share on this dial can
  // hold it at all" — is arithmetic, and this is the arithmetic.
  const maintenanceRule = reinvestRuleFor(1).detail.join(" ");
  assert.match(maintenanceRule, /no share on this dial can hold it/);
  for (const profile of MARKET_PROFILES) {
    const ceilingGain = drawGain(profile, 89, 1_000_000_000);
    assert.ok(ceilingGain < 4, `at Draw 89 the maximum possible gain is ${ceilingGain}, which does NOT fall short of the 4-point decay`);
    const lowGain = drawGain(profile, 30, 1_000_000_000);
    assert.ok(lowGain > ceilingGain, "the rule claims it climbs fastest when Draw is low");
  }
  // The last week says the horizon out loud.
  assert.match(reinvestRuleFor(WEEK_COUNT).line, /LAST WEEK/);
});

test("sr BLOCKING-1: no club renders a factual claim about a different club", () => {
  // The shipped failure: the four anchor clubs' identity sentences rode on the
  // shared profile line, so "the biggest market in American sports, and the
  // league's biggest gate" printed under Detroit, and "one of the league's
  // smallest markets — and the 2025 champions" printed under Denver. Any class
  // of nine or more desks hit at least three false lines, on the private screen.
  const CLUB_SPECIFIC = [
    /biggest market in American sports/i,
    /biggest gate/i,
    /2025 champions/i,
    /OWNS its building/i,
    /OWNS THE BUILDING/i,
    /concert money/i,
    /Chase Center/i,
    /Crypto\.com/i,
  ];
  for (const profile of MARKET_PROFILES) {
    for (const re of CLUB_SPECIFIC) {
      assert.equal(re.test(profile.plainLine), false, `profile ${profile.id}'s shared line makes a club-specific claim: ${profile.plainLine}`);
      assert.equal(re.test(profile.sizeLabel), false, `profile ${profile.id}'s size label makes a club-specific claim: ${profile.sizeLabel}`);
    }
  }
  // The identity sentences still exist — on the clubs they are true of, and
  // nowhere else.
  const withIdentity = CLUBS.filter((c) => c.identityLine);
  assert.ok(withIdentity.length >= 4, "the verified anchor clubs must keep their sentences");
  assert.ok(withIdentity.length < CLUBS.length, "most clubs must carry no club-specific claim at all");
  assert.match(CLUBS.find((c) => c.short === "New York")!.identityLine!, /biggest gate/);
  assert.equal(CLUBS.find((c) => c.short === "Detroit")!.identityLine, undefined);
  assert.equal(CLUBS.find((c) => c.short === "Denver")!.identityLine, undefined);
  assert.equal(CLUBS.find((c) => c.short === "Miami")!.identityLine, undefined);

  // ...and the student view carries exactly its own club's line.
  const state = seated(12);
  for (const seatId of Object.keys(state.seatToSlot)) {
    const slot = state.seatToSlot[seatId]!;
    for (const phase of ["LOBBY", "HOOK"] as CanonicalPhase[]) {
      const view = hostTheLeagueModule.studentView(state, seatId, phase) as Record<string, unknown>;
      if (phase === "HOOK") assert.equal(view["identityLine"] ?? null, CLUBS[slot]!.identityLine ?? null);
    }
  }
});

test("sr BLOCKING-2: the modelled-dollars caption states no universal the bars falsify", () => {
  assert.equal(/for every club in this league/i.test(MODELED_DOLLARS_LINE), false, "'the biggest single pipe for every club' is false by week 1");
  assert.match(MODELED_DOLLARS_LINE, /Near a club's house price/);
  // The desk gets the one sentence that changes how a pair reads a number; the
  // full methodology stays on the board at SYNTHESIS. A student HOOK banner
  // that is five sentences of parabola-shape prose is not a disclosure a
  // ten-year-old reads, it is one they scroll past.
  assert.ok(MODELED_DOLLARS_SHORT.length * 3 < MODELED_DOLLARS_LINE.length, "the desk's disclosure is not meaningfully shorter than the board's");
  assert.match(MODELED_DOLLARS_SHORT, /shrunk to classroom size/i);
  assert.match(MODELED_DOLLARS_SHORT, /SHARES/);
  const hookDesk = hostTheLeagueModule.studentView(seated(4), "seat-1", "HOOK") as Record<string, unknown>;
  assert.equal(hookDesk["modeledDollarsLine"], MODELED_DOLLARS_SHORT, "the desk still carries the board's paragraph");
  const hookBoard = hostTheLeagueModule.boardView(seated(4), "HOOK") as Record<string, unknown>;
  assert.equal(hookBoard["modeledDollarsLine"], MODELED_DOLLARS_LINE, "the full disclosure must survive somewhere");
  // And the counterexamples are real: local media overtakes the national check
  // at Draw 50 on the new-york profile, and Boston starts at 55.
  const ny = MARKET_PROFILES.find((m) => m.id === "new-york")!;
  const boston = CLUBS.find((c) => c.short === "Boston")!;
  assert.ok(localMediaFor(ny, boston.startDraw) > NATIONAL, "Boston must falsify the old universal before anybody prices");
});

test("teacher B3: a desk that never locked is never presented as a free-rider", () => {
  // Six desks; desk 6 never touches a dial and is auto-settled every week.
  let state = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (let i = 0; i < 5; i += 1) {
      const seatId = `seat-${i + 1}`;
      state = ok(act(state, { type: "setPrice", price: 50 }, "PLAY", seatId));
      state = ok(act(state, { type: "setShare", share: 0 }, "PLAY", seatId));
      state = ok(act(state, { type: "lock" }, "PLAY", seatId));
    }
    state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  }
  const view = hostTheLeagueModule.teacherView(state, "REVEAL") as Record<string, unknown>;
  const flags = view["watchFor"] as { id: string; desks: string[] }[];
  const freeRider = flags.find((f) => f.id === "free-rider");
  const never = flags.find((f) => f.id === "never-locked");
  assert.ok(never, "a desk that never locked must be flagged as such");
  assert.ok(never!.desks.some((d) => d.includes("Desk 6")), "the never-locked desk must be named on its own flag");
  assert.equal(
    freeRider?.desks.some((d) => d.includes("Desk 6")) ?? false,
    false,
    "the never-locked desk must NOT be offered to the teacher as the protagonist of the free-riding argument",
  );
  assert.ok(freeRider!.desks.length >= 5, "the desks that CHOSE 0% are still the free-riding case");
  // The teacher can now see it on the desk card too.
  const desks = view["desks"] as { handle: string; neverLocked: boolean; autoWeeks: number }[];
  const d6 = desks.find((d) => d.handle.includes("Desk 6"))!;
  assert.equal(d6.neverLocked, true);
  assert.equal(d6.autoWeeks, WEEK_COUNT);
});

/* ---------------------------------------- the projector is not a lecture -- */

/**
 * W6/RC2. The projector's REVEAL summaries had accreted a clause per econ
 * finding — every one correct, every one necessary — until stages 2 and 5 were
 * holding 190 and 150 words of body copy at 1.5vw in front of a room of
 * ten-year-olds. A wall of text is not a consequence beat; it is a paragraph
 * nobody in the back row reads and no teacher can narrate.
 *
 * The repair splits WHERE each sentence renders, not WHETHER it exists. So this
 * test has two halves and neither is optional: the wall stays short, AND every
 * word it no longer holds is in the teacher's hand instead.
 */
const WORDS = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * The budget is in CHARACTERS, not words, because characters are what decide
 * lines. `.hl-summary` is 1.5vw on an 88vw box: at 1366x768 that is a 20.5px
 * face in a 1202px column, about 118 characters a line at this font's average
 * advance. Three lines is what a projector frame can spare under a chart
 * without the reader losing the chart. 340 is those three lines.
 *
 * The real guard is `e2e-m2l2.cjs`, which measures actual overflow of `#stage`
 * at both projector shapes. This one fails first, in milliseconds, and says why.
 */
const PROJECTOR_SUMMARY_CHARS = 340;

/** Rooms whose findings take different branches, so the budget holds on all of them. */
function summaryRooms(): { label: string; state: HostLeagueState }[] {
  let noSpend = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) noSpend = playWeek(noSpend, (i) => 20 + i * 8, () => 0);
  let heavy = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) heavy = playWeek(heavy, (i) => 30 + i * 6, () => 40);
  let flat = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) flat = playWeek(flat, () => 50, () => 20);
  let rising = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) rising = playWeek(rising, () => 44, () => 5 + w * 15);
  const mixed = fullSession(9);
  return [
    { label: "nobody reinvested", state: noSpend },
    { label: "everybody reinvested hard", state: heavy },
    { label: "the room held flat", state: flat },
    { label: "the room went up", state: rising },
    { label: "mixed, twelve desks", state: fullSession(12) },
    { label: "mixed, nine desks", state: mixed },
    { label: "mixed, saw the bar early", state: { ...mixed, barReleased: true, barReleasedAtWeek: 1 } },
  ];
}

test("W6/RC2: no REVEAL summary puts a paragraph on the projector", () => {
  for (const { label, state } of summaryRooms()) {
    const agg = computeAggregate(state);
    for (const [stage, text] of [
      ["2 — what you gave, what you got", giveAndTakeSummaryBoard(agg)],
      ["5 — what you did in the last week", reinvestChangeLineBoard(agg, state)],
      ["1 — the Handed-To-You bar", agg.barSummary],
    ] as const) {
      assert.ok(
        text.length <= PROJECTOR_SUMMARY_CHARS,
        `${label}: reveal stage ${stage} puts ${text.length} characters (${WORDS(text)} words) on the projector — budget ${PROJECTOR_SUMMARY_CHARS}, about three readable lines: "${text}"`,
      );
      assert.ok(text.trim().length > 0, `${label}: reveal stage ${stage} left the projector with no finding at all`);
    }
  }
});

test("W6/RC2: every word the projector gave up is in the teacher's hand", () => {
  for (const { label, state } of summaryRooms()) {
    const agg = computeAggregate(state);
    const mirrorFor = (stage: number): string[] => {
      const view = hostTheLeagueModule.teacherView({ ...state, revealStage: stage }, "REVEAL") as Record<string, unknown>;
      const p = view["projectorNow"] as { title: string; lines: string[] };
      return p.lines;
    };
    for (const [stage, full, board] of [
      [2, giveAndTakeSummary(agg), giveAndTakeSummaryBoard(agg)],
      [5, reinvestChangeLine(agg, state), reinvestChangeLineBoard(agg, state)],
    ] as const) {
      const lines = mirrorFor(stage).join("\n");
      assert.ok(lines.includes(full), `${label}: stage ${stage}'s full finding is on neither surface — the reasoning was deleted, not moved`);
      assert.ok(lines.includes(board), `${label}: the mirror does not tell the teacher what is literally on the frame at stage ${stage}`);
      // The short rendering may never assert something the long one does not.
      assert.ok(WORDS(board) < WORDS(full), `${label}: stage ${stage}'s board rendering is not shorter than the full finding`);
    }
  }
});

test("W6/RC2: the reinvest chart carries the comparison its sentence makes", () => {
  for (const { label, state } of summaryRooms()) {
    const agg = computeAggregate(state);
    const base = reinvestBaseline(agg);
    const [w1, w2, w3] = agg.meanShareByWeek;
    if (w3 === null || (w1 === null && w2 === null)) {
      assert.equal(base, null, `${label}: a room with no before must draw no reference line`);
      continue;
    }
    const before = [w1, w2].filter((x): x is number => typeof x === "number");
    const expected = Math.round((before.reduce((a, b) => a + b, 0) / before.length) * 10) / 10;
    assert.equal(base, expected, `${label}: the line on the chart and the mean in the sentence must be the same number`);
    // The sentence prints the same figure, so the two can never disagree.
    assert.match(reinvestChangeLineBoard(agg, state), new RegExp(`${expected}%`.replace(".", "\\.")));
  }
});

/* ------------------------------------------------------- the desk's reveal -- */

/**
 * W6 — THE DESK MUST NOT SPOIL THE BOARD.
 *
 * The reveal is five teacher-paced beats on the projector. The desk used to
 * carry every number all five of them are about from beat 0: the season
 * decomposition, the whole give-and-take ledger, the four pipes. A pair that
 * looked down had already read the answer to every question the room was about
 * to be asked, and a DOM diff of the desk across all six presses came back
 * byte-identical.
 *
 * Gating that in the renderer alone would have left the numbers sitting in the
 * payload one devtools panel away, and put the choreography somewhere no unit
 * test can reach. The beat a number belongs to is a property of the lesson, so
 * this asserts it on the payload the lesson emits.
 */
test("W6: no reveal beat's numbers reach the desk before the teacher presses it", () => {
  let state = fullSession(6);
  const KEY_BEAT: [string, number][] = [
    ["doorBlocks", 1],
    ["give", 2],
    ["mine", 3],
    ["bestNight", 4],
    ["ownReinvest", 5],
  ];
  for (let beat = 0; beat <= REVEAL_STEPS; beat += 1) {
    const view = hostTheLeagueModule.studentView({ ...state, revealStage: beat }, "seat-1", "REVEAL") as Record<string, unknown>;
    assert.equal(view["deskBeat"], beat, `the desk does not know which beat it is on at stage ${beat}`);
    for (const [key, itsBeat] of KEY_BEAT) {
      if (beat >= itsBeat) {
        assert.ok(view[key] !== undefined, `beat ${itsBeat} is up but the desk was not given "${key}"`);
      } else {
        assert.equal(view[key], undefined, `at beat ${beat} the desk already holds "${key}", which belongs to beat ${itsBeat}`);
      }
    }
    // The three ledger sentences belong to beat 2 with the ledger they describe.
    for (const key of ["giveLine", "giveHeading", "dealtLine"]) {
      if (beat < 2) assert.equal(view[key], "", `at beat ${beat} the desk is already printing "${key}"`);
      else assert.ok(String(view[key] ?? "").length > 0, `beat 2 is up but "${key}" is empty`);
    }
  }
  // ADAPT is after the reveal: everything is on the table.
  const adapt = hostTheLeagueModule.studentView(state, "seat-1", "ADAPT") as Record<string, unknown>;
  assert.equal(adapt["deskBeat"], REVEAL_STEPS, "ADAPT must show the whole reveal, not beat 0");
  for (const [key] of KEY_BEAT) assert.ok(adapt[key] !== undefined, `ADAPT is missing "${key}"`);
});

test("W6: the pair's one reveal call is taken before the beat that answers it, and only from a seat", () => {
  const state = fullSession(6);
  const atStage = (n: number): HostLeagueState => ({ ...state, revealStage: n });

  assert.match(bad(act(atStage(0), { type: "ledgerPredict", choice: "gave" }, "PLAY", "seat-1")), /during REVEAL/);
  assert.match(bad(act(atStage(0), { type: "ledgerPredict", choice: "gave" }, "REVEAL", "teacher")), /seated pair/);
  assert.match(bad(act(atStage(0), { type: "ledgerPredict", choice: "maybe" }, "REVEAL", "seat-1")), /gave or took/);
  assert.match(bad(act(atStage(2), { type: "ledgerPredict", choice: "gave" }, "REVEAL", "seat-1")), /already on the projector/);

  const called = ok(act(atStage(1), { type: "ledgerPredict", choice: "gave" }, "REVEAL", "seat-1"));
  const before = hostTheLeagueModule.studentView(called, "seat-1", "REVEAL") as Record<string, unknown>;
  assert.equal(before["prediction"], "gave");
  assert.equal(before["predictOpen"], false, "a pair that has called must not be asked again");
  assert.equal(before["predictionResolved"], null, "the call may not be settled before the ledger goes up");

  const after = hostTheLeagueModule.studentView({ ...called, revealStage: 2 }, "seat-1", "REVEAL") as Record<string, unknown>;
  const resolved = after["predictionResolved"] as { actual: string; right: boolean; line: string };
  assert.ok(resolved, "beat 2 did not settle the call");
  assert.ok(resolved.actual === "gave" || resolved.actual === "took");
  // The verdict is the room's own arithmetic, not a hand-written branch: it has
  // to agree with the ledger the same payload prints.
  const give = after["give"] as { gave: number; received: number };
  assert.equal(resolved.actual, give.gave > give.received ? "gave" : "took", "the verdict disagrees with the ledger beside it");
  assert.equal(resolved.right, resolved.actual === "gave");
  assert.match(resolved.line, /You called/);

  // A desk that never called is never shown a verdict on a call it did not make.
  const silent = hostTheLeagueModule.studentView({ ...called, revealStage: 2 }, "seat-2", "REVEAL") as Record<string, unknown>;
  assert.equal(silent["prediction"], null);
  assert.equal(silent["predictionResolved"], null);
  assert.equal(silent["predictOpen"], false, "the call closes for everyone once the ledger is up");
});

test("W6: the locked pair gets the gate call, and only a locked pair does", () => {
  let state = seated(4);
  // Before the lock there is no call to make: the dials are still the work.
  const preLock = hostTheLeagueModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>;
  assert.equal(preLock["gateCall"], undefined, "an undecided desk was offered the waiting beat");
  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1")), /commit your price first/);

  state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));

  const offered = hostTheLeagueModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>;
  const gate = offered["gateCall"] as { prompt: string; bands: { id: string }[]; called: string | null; room: { locked: number; seated: number; line: string } };
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

  // Rejections are semantic, never transport-shaped.
  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "PLAY", "teacher")), /seated pair/);
  assert.match(bad(act(state, { type: "gateCall", band: "maybe" }, "PLAY", "seat-1")), /packed, busy or quiet/);
  assert.match(bad(act(state, { type: "gateCall", band: "packed" }, "REVEAL", "seat-1")), /during PLAY/);

  // The call is changeable while the week is open — a misclick must not cost a
  // fifth-grader a whole week — and the LAST one standing is what is frozen.
  state = ok(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1"));
  assert.equal((hostTheLeagueModule.studentView(state, "seat-1", "PLAY") as { gateCall: { called: string } }).gateCall.called, "packed");
  state = ok(act(state, { type: "gateCall", band: "quiet" }, "PLAY", "seat-1"));
  assert.equal((hostTheLeagueModule.studentView(state, "seat-1", "PLAY") as { gateCall: { called: string } }).gateCall.called, "quiet");

  // A desk that never called is never asked to answer for one.
  const silent = hostTheLeagueModule.studentView(state, "seat-2", "PLAY") as Record<string, unknown>;
  assert.equal(silent["gateCall"], undefined, "an unlocked desk was shown the waiting beat");
});

test("W6: the settled week answers the call it was actually given, and calls nothing else", () => {
  let state = seated(4);
  for (const seatId of ["seat-1", "seat-2", "seat-3", "seat-4"]) {
    state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", seatId));
    state = ok(act(state, { type: "lock" }, "PLAY", seatId));
  }
  state = ok(act(state, { type: "gateCall", band: "packed" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "gateCall", band: "quiet" }, "PLAY", "seat-2"));
  state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));

  const weekOf = (seatId: string) => {
    const v = hostTheLeagueModule.studentView(state, seatId, "PLAY") as { history: { call: { called: string; actual: string; right: boolean; line: string } | null; turnout: number; capacity: number }[] };
    return v.history[0]!;
  };

  const one = weekOf("seat-1");
  assert.ok(one.call, "the call the pair made never came back");
  assert.equal(one.call!.called, "packed");
  // The verdict must be the settled week's OWN arithmetic, recomputed here from
  // the numbers printed beside it rather than trusted.
  const fill = one.turnout / one.capacity;
  const expected = fill >= GATE_PACKED_FLOOR ? "packed" : fill >= GATE_BUSY_FLOOR ? "busy" : "quiet";
  assert.equal(one.call!.actual, expected, "the verdict disagrees with the crowd on the same card");
  assert.equal(one.call!.right, one.call!.called === one.call!.actual);
  assert.match(one.call!.line, /You called PACKED\./);
  assert.match(one.call!.line, new RegExp(`${one.turnout.toLocaleString()} came`));
  // Forecasting language only: the call is about reading a crowd, never about
  // whether the PRICE was any good (economic truth — outcome is not decision
  // quality).
  assert.ok(!/good|bad|wrong price|mistake|should have/i.test(one.call!.line), `the call's verdict judged the decision: ${one.call!.line}`);

  const two = weekOf("seat-2");
  assert.equal(two.call!.called, "quiet");
  // Two desks at the same price in different buildings may land in different
  // bands; what may never happen is one desk's call reaching another's week.
  assert.notEqual(one.call!.called, two.call!.called);

  const three = weekOf("seat-3");
  assert.equal(three.call, null, "a desk that made no call was handed a verdict on one");

  // The pending call does not survive its own week: week 2 starts uncalled.
  state = ok(act(state, { type: "setPrice", price: 30 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  assert.equal(
    (hostTheLeagueModule.studentView(state, "seat-1", "PLAY") as { gateCall: { called: string | null } }).gateCall.called,
    null,
    "week 1's call carried into week 2",
  );
});
