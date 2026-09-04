/**
 * THE PRESS CONFERENCE — server-owned primitive.
 *
 * Two things are under test together, because the founder's brief makes them
 * one feature: CLOCK HONESTY (a FINAL CALL deadline must never elapse while
 * the room is paused, whether the pause is an ordinary `pause`, a `freeze`,
 * or a press conference calling a desk to the podium) and THE PODIUM ITSELF
 * (a public, seat-anonymous view the board and the spotlighted desk share,
 * and a teacher-private shortlist/picker that never reaches a student).
 *
 * `pcTestModule` below is a minimal, self-contained fixture built for this
 * file alone — not real gameplay content, and deliberately independent of
 * every real lesson module (another builder is mid-edit on `fullHouse.ts`
 * and the modules under active development are not this file's business).
 * It declares a round contract (so the clock-honesty tests have a FINAL CALL
 * to drive) and both optional `LessonModule` methods this feature adds
 * (`spotlightView`, `pressCandidates`); `lobbyDemoModule` — which declares
 * neither — is reused for the "a module with nothing to say" tests.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { lobbyDemoModule } from "../modules/lobbyDemo.js";
import type { LessonModule } from "../shared/lessonModule.js";
import { SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";

/* ------------------------------------------------------------- fixture module -- */

type PcState = {
  locked: Record<string, boolean>;
  roundKey: string;
  rounds: number;
};

const pcTestModule: LessonModule<PcState> = {
  id: "pc-test-round",
  title: "Press Conference Test Fixture",
  phases: ["LOBBY", "PLAY", "REVEAL", "SYNTHESIS", "COMPLETE"],

  initialState() {
    return { locked: {}, roundKey: "round-1", rounds: 0 };
  },

  reduce(state, action, ctx) {
    if (action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `lock is only accepted during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk can lock" };
      return { ok: true, state: { ...state, locked: { ...state.locked, [ctx.seatId]: true } } };
    }
    if (action.type === "teacher:closeRound") {
      return { ok: true, state: { locked: {}, roundKey: `round-${state.rounds + 2}`, rounds: state.rounds + 1 } };
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    return phase === "PLAY" ? ["lock"] : [];
  },

  studentView(state, seatId, phase) {
    return { phase, locked: Boolean(state.locked[seatId]) };
  },

  teacherView(state, phase) {
    return { phase, rounds: state.rounds };
  },

  boardView(state, phase) {
    return { phase, rounds: state.rounds };
  },

  aggregate(state) {
    return { rounds: state.rounds };
  },

  /** The public podium: whether this desk had locked, and nothing else about it. */
  spotlightView(state, seatId) {
    return { locked: Boolean(state.locked[seatId]) };
  },

  /** Every desk that locked early is a candidate — a stand-in for "interesting reasoning". */
  pressCandidates(state, phase) {
    if (phase !== "PLAY") return [];
    return Object.keys(state.locked)
      .filter((id) => state.locked[id])
      .map((seatId) => ({ seatId, label: `DESK ${seatId.slice(0, 6).toUpperCase()}`, why: "locked before anyone else" }));
  },

  round: {
    closeHook: "teacher:closeRound",
    noun: "round",
    currentKey(state, phase) {
      return phase === "PLAY" ? state.roundKey : null;
    },
    fallbackPolicy: "an unlocked desk carries nothing into the next round.",
    unresolved(state, phase, seatIds) {
      if (phase !== "PLAY") return [];
      return seatIds
        .filter((id) => !state.locked[id])
        .map((seatId) => ({
          seatId,
          label: `Desk ${seatId.slice(0, 6)}`,
          fallback: "their pick carries nothing forward",
          selfFallback: "your pick carries nothing forward",
        }));
    },
  },
};

/* ---------------------------------------------------------------- helpers -- */

function freshService(): { svc: SessionService; repo: SnapshotRepository } {
  const repo = new SnapshotRepository(null); // in-memory only, no disk I/O
  const svc = new SessionService(repo);
  svc.registerModule(pcTestModule);
  svc.registerModule(lobbyDemoModule);
  return { svc, repo };
}

/** Creates a pc-test-round session, joins `names.length` seats, and advances to PLAY. */
async function inPlay(names: string[], mod: string = pcTestModule.id) {
  const { svc, repo } = freshService();
  const created = await svc.createSession({ lessonModuleId: mod, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const seats = [];
  for (const name of names) seats.push(await svc.join(code, name));
  await svc.control(code, { type: "advance" }, key); // LOBBY -> PLAY
  return { svc, repo, code, key, seats };
}

/** Pushes a session's `pausedAt` back into the past by `ms`, without waiting for real time to pass. */
async function backdatePause(repo: SnapshotRepository, code: string, ms: number): Promise<void> {
  const row = (await repo.getSessionByCode(code))!;
  assert.ok(row.pausedAt, "backdatePause called on a session that is not paused");
  const outcome = await repo.updateSession(row.id, { pausedAt: new Date(Date.parse(row.pausedAt!) - ms).toISOString() }, row.version);
  assert.ok(outcome.ok, "backdatePause failed to write");
}

/* -------------------------------------------------------- (a) clock honesty -- */

test("(a) pausing during FINAL CALL and resuming 30s later leaves the same remaining time", async () => {
  const { svc, repo, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  await svc.control(code, { type: "pause" }, key);

  // Simulate 30 real seconds of pause without a 30-second test.
  await backdatePause(repo, code, 30_000);

  const resumed = await svc.control(code, { type: "unpause" }, key);
  const remaining = Date.parse(resumed.round!.endsAt!) - Date.now();
  assert.ok(
    remaining > 18_000 && remaining <= 20_500,
    `expected ~20s of final call restored after a 30s pause, got ${remaining}ms`,
  );
  assert.equal(resumed.session.pausedAt, null, "pausedAt must be cleared on resume");
});

test("(a) a freeze -> unfreeze cycle shifts the clock exactly the same way as pause -> unpause", async () => {
  const { svc, repo, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  await svc.control(code, { type: "freeze" }, key);
  await backdatePause(repo, code, 10_000);
  const resumed = await svc.control(code, { type: "unfreeze" }, key);
  const remaining = Date.parse(resumed.round!.endsAt!) - Date.now();
  assert.ok(remaining > 18_500 && remaining <= 20_500, `expected ~20s restored, got ${remaining}ms`);
  assert.equal(resumed.session.frozen, false);
  assert.equal(resumed.session.paused, false);
});

/* ------------------------------------------------- (b) sweepRound while paused -- */

test("(b) sweepRound never closes a round while the room is paused, however far past the deadline", async () => {
  const { svc, repo, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 5_000 }, key);
  await svc.control(code, { type: "pause" }, key);

  // Push the deadline itself into the past, the way roundLifecycle.test.ts
  // does for the un-paused expiry case — but this time paused.
  const row = (await repo.getSessionByCode(code))!;
  await repo.updateSession(
    row.id,
    { round: { ...row.round!, finalCallEndsAt: new Date(Date.now() - 60_000).toISOString() } },
    row.version,
  );

  const stillPaused = await svc.teacherView(code, key);
  assert.equal(stillPaused.round?.status, "FINAL_CALL", "a paused room must not have settled its round");
  assert.equal((stillPaused.view as { rounds: number }).rounds, 0, "the module must not have been asked to close anything");

  // And a second, independent read (board) must agree — sweepRound is shared.
  const board = await svc.boardView(code);
  assert.equal(board.round?.status, "FINAL_CALL");
});

/* ---------------------------------------------------- (c) pressConference itself -- */

test("(c) pressConference pauses the room and sets the spotlight; endPressConference clears both", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  const seatId = seats[0]!.seat.id;

  const called = await svc.control(code, { type: "pressConference", seatId }, key);
  assert.equal(called.session.paused, true);
  assert.ok(called.session.pausedAt, "pausedAt must be recorded the instant the podium opens");
  assert.deepEqual(called.spotlight, { seatId, label: called.spotlight!.label, since: called.spotlight!.since });
  assert.ok(called.spotlight!.since.length > 0);

  const ended = await svc.control(code, { type: "endPressConference" }, key);
  assert.equal(ended.spotlight, null);
  assert.equal(ended.session.paused, false);
  assert.equal(ended.session.pausedAt, null);
});

test("(c) the manual picker can call up a seat the module never proposed, and still gets a real label", async () => {
  const { svc, code, key, seats } = await inPlay(["A"]);
  // Nobody has locked, so pressCandidates() is empty — the picker must still work.
  const teacher = await svc.teacherView(code, key);
  assert.deepEqual(teacher.pressCandidates, []);
  const called = await svc.control(code, { type: "pressConference", seatId: seats[0]!.seat.id }, key);
  assert.equal(called.spotlight!.label, "A FRONT OFFICE", "no module label exists for this seat — the founder-specified fallback must be used, never the display name");
});

test("(c) a seat the module DOES propose is called up under the module's own label", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  await svc.submitAction(seats[0]!.deviceToken!, { type: "lock" });
  const teacher = await svc.teacherView(code, key);
  assert.equal(teacher.pressCandidates.length, 1);
  const candidate = teacher.pressCandidates[0]!;
  assert.equal(candidate.seatId, seats[0]!.seat.id);
  assert.ok(candidate.why.length > 0);

  const called = await svc.control(code, { type: "pressConference", seatId: candidate.seatId }, key);
  assert.equal(called.spotlight!.label, candidate.label, "the podium label must match the module's own shortlist label");
});

test("(c) pressConference against an unknown or foreign seat is refused, not silently accepted", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  await assert.rejects(svc.control(code, { type: "pressConference", seatId: "not-a-real-seat" }, key), (err: unknown) => {
    return (err as { status?: number }).status === 404;
  });
});

/* ------------------------------------------- (d) board never receives the seat id -- */

test("(d) the board payload carries the label and the module's public view, and never the seat id", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  const seatId = seats[0]!.seat.id;
  await svc.submitAction(seats[0]!.deviceToken!, { type: "lock" });
  await svc.control(code, { type: "pressConference", seatId }, key);

  const board = await svc.boardView(code);
  assert.ok(board.spotlight, "the board must carry a spotlight while a press conference is running");
  assert.deepEqual(board.spotlight, { label: board.spotlight!.label, view: { locked: true } });
  const serialized = JSON.stringify(board);
  assert.doesNotMatch(serialized, new RegExp(seatId), "the board payload leaked the spotlighted seat's id");
  for (const s of seats) {
    assert.doesNotMatch(serialized, new RegExp(s.seat.displayName), "the board payload leaked a display name");
  }
});

/* ----------------------------------------- (e) a non-podium seat's own payload -- */

test("(e) a seat that is NOT at the podium sees mine:false and no seat id anywhere in its payload", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  const podiumSeatId = seats[0]!.seat.id;
  await svc.control(code, { type: "pressConference", seatId: podiumSeatId }, key);

  const other = await svc.resumeByToken(seats[1]!.deviceToken!);
  assert.deepEqual(other.session.spotlight, { label: other.session.spotlight!.label, mine: false });
  const serialized = JSON.stringify(other);
  assert.doesNotMatch(serialized, new RegExp(podiumSeatId), "a non-podium seat's own payload named the podium seat's id");

  const mine = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(mine.session.spotlight!.mine, true);
  assert.deepEqual(mine.view, { locked: false }, "the podium seat's own view must be the public spotlightView, not its private studentView");
});

/* -------------------------------------------- (f) a module with nothing to say -- */

test("(f) a module with neither optional method yields spotlight.view === null on the board and pressCandidates === [] to the teacher", async () => {
  const { svc, repo } = freshService();
  const created = await svc.createSession({ lessonModuleId: lobbyDemoModule.id, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const joined = await svc.join(code, "Alex");

  const teacherBefore = await svc.teacherView(code, key);
  assert.deepEqual(teacherBefore.pressCandidates, []);

  const called = await svc.control(code, { type: "pressConference", seatId: joined.seat.id }, key);
  assert.equal(called.spotlight!.label, "A FRONT OFFICE");

  const board = await svc.boardView(code);
  assert.deepEqual(board.spotlight, { label: "A FRONT OFFICE", view: null });
  void repo;
});

/* -------------------------------------------------- (g) restore/end clear it -- */

test("(g) end clears the spotlight", async () => {
  const { svc, code, key, seats } = await inPlay(["A"]);
  await svc.control(code, { type: "pressConference", seatId: seats[0]!.seat.id }, key);
  const ended = await svc.control(code, { type: "end" }, key);
  assert.equal(ended.spotlight, null);
});

test("(g) restore clears the spotlight and, reverting into a live room, shifts a running final call", async () => {
  const { svc, repo, code, key, seats } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  // A checkpoint captured HERE (pre-freeze, live, mid final-call) is what
  // "restore" will revert to below.
  await svc.control(code, { type: "freeze" }, key); // checkpoint = pre-freeze, live
  await svc.control(code, { type: "pressConference", seatId: seats[0]!.seat.id }, key);
  await backdatePause(repo, code, 15_000);

  const restored = await svc.control(code, { type: "restore" }, key);
  assert.equal(restored.spotlight, null, "restore must clear the podium even though it never called endPressConference");
  assert.equal(restored.session.paused, false, "the checkpoint predates the freeze/press-conference — restoring into it is a real resume");
  assert.equal(restored.session.pausedAt, null);
  const remaining = Date.parse(restored.round!.endsAt!) - Date.now();
  assert.ok(remaining > 18_000 && remaining <= 20_500, `restore-as-resume must shift the clock too, got ${remaining}ms`);
});

/* --------------------------------------------------- (h) snapshot round-trip -- */

test("(h) a snapshot round-trip preserves pausedAt and spotlight", async () => {
  const path = `/tmp/claude-0/-home-user-bow-economics-live/c38d3784-113a-52a9-9efb-c9b845006a27/scratchpad/pc-snapshot-${Date.now()}.json`;
  const repoA = new SnapshotRepository(path, { flushDelayMs: 0 });
  const svc = new SessionService(repoA);
  svc.registerModule(pcTestModule);
  const created = await svc.createSession({ lessonModuleId: pcTestModule.id, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const joined = await svc.join(code, "Alex");
  await svc.control(code, { type: "pressConference", seatId: joined.seat.id }, key);
  await repoA.flushToDisk();

  const repoB = new SnapshotRepository(path, { flushDelayMs: 0 });
  await repoB.whenReady();
  const row = await repoB.getSessionByCode(code);
  assert.ok(row);
  assert.ok(row!.pausedAt, "pausedAt did not survive the snapshot round-trip");
  assert.deepEqual(row!.spotlight, { seatId: joined.seat.id, label: "A FRONT OFFICE", since: row!.spotlight!.since });
});
