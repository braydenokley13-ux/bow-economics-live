/**
 * FOUR WAYS THE CONTROL PATH COULD HURT A LIVE ROOM.
 *
 * All four were found by reading the runtime for the Module 1 rebuild, and
 * none of them was reachable from any existing test, because every existing
 * test drives the session the way a well-behaved class does.
 *
 *  1. ADVANCE COULD REWIND THE WHOLE ROOM. `phases.indexOf(session.phase)`
 *     returns -1 for a stored phase the registered module does not declare,
 *     and `phases[-1 + 1]` is `phases[0]`. The `!next` guard does not fire, so
 *     ADVANCE sent the class back to the first phase of the lesson with the
 *     projector following it. Reachable whenever a stored phase and a
 *     registered module disagree — the snapshot loader checks a row for `id`
 *     and `code` and nothing else.
 *
 *  2. REVEAL COULD REWIND, AND FIRE `onPhaseExit` BACKWARDS. REVEAL is a jump,
 *     not a step, so it can name a phase the class is already past. Both M1
 *     lessons that implement `onPhaseExit` use it to auto-resolve pending work
 *     "because the phase offering it is being left"; run in reverse that
 *     resolves work the room has already been shown.
 *
 *  3. THE MODULE WAS TOLD THE ROOM WAS EMPTY AT THE MOMENT IT CLOSED. Both
 *     `closeRound` and the teacher `hook` path reduced with `seatIds: []`,
 *     while `RoundContract.unresolved` was handed the real roster to build the
 *     teacher's per-desk close preview. The runtime named exactly who had not
 *     committed and then closed the round without telling the module anyone
 *     existed.
 *
 *  4. THE CARRY ARRIVED WITH NO PROVENANCE. The seed envelope was
 *     `{lessonModuleId, state}`, so a module inheriting a room could not tell
 *     whether that room had finished — although D39 explicitly permits linking
 *     one that has not.
 */
import assert from "node:assert/strict";
import test from "node:test";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";
import { SessionBus } from "../server/sessionBus.js";
import type { LessonModule, ReduceContext, ReduceResult } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

type ProbeState = {
  /** Every roster the module was shown, in call order, tagged by what asked. */
  rosters: { via: string; seatIds: string[] }[];
  /** Every onPhaseExit transition, in call order. */
  exits: { from: CanonicalPhase; to: CanonicalPhase }[];
  /** The seed envelope exactly as the runtime handed it over. */
  seedSeen: unknown;
  closed: string[];
};

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "PLAY", "REVEAL", "SYNTHESIS", "COMPLETE"];

/**
 * A module that records what the runtime tells it, and nothing else. It is
 * deliberately not a lesson: a probe that also had economics could pass these
 * tests for the wrong reason.
 */
function probeModule(id = "probe"): LessonModule<ProbeState> {
  return {
    id,
    title: "Control-path probe",
    phases: PHASES,
    initialState: (input) => ({ rosters: [], exits: [], seedSeen: input.seed ?? null, closed: [] }),
    reduce(state, action, ctx: ReduceContext): ReduceResult<ProbeState> {
      const rosters = [...state.rosters, { via: action.type, seatIds: [...ctx.seatIds] }];
      if (action.type === "teacher:closeRound") {
        return { ok: true, state: { ...state, rosters, closed: [...state.closed, `n=${ctx.seatIds.length}`] } };
      }
      return { ok: true, state: { ...state, rosters } };
    },
    allowedActions: () => ["noop", "teacher:closeRound", "teacher:ping"],
    studentView: (state) => ({ seated: true, rosters: state.rosters.length }),
    teacherView: (state) => ({ ...state }),
    boardView: () => ({}),
    aggregate: () => ({}),
    onPhaseExit(state, fromPhase, toPhase) {
      return { ...state, exits: [...state.exits, { from: fromPhase, to: toPhase }] };
    },
    round: {
      closeHook: "teacher:closeRound",
      noun: "round",
      currentKey: (_s, phase) => (phase === "PLAY" ? "r1" : null),
      fallbackPolicy: "Nothing carries.",
      unresolved: (_s, phase, seatIds) =>
        phase === "PLAY"
          ? seatIds.map((seatId) => ({ seatId, label: seatId, fallback: "nothing", selfFallback: "nothing" }))
          : [],
    },
  };
}

async function harness(extra: LessonModule<ProbeState>[] = []) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "bow-control-"));
  const bus = new SessionBus();
  const repo = new SnapshotRepository(path.join(dir, "snap.json"), { bus });
  await repo.whenReady();
  const service = new SessionService(repo);
  const mod = probeModule();
  service.registerModule(mod);
  for (const m of extra) service.registerModule(m);
  return {
    service,
    repo,
    mod,
    cleanup: () => fsp.rm(dir, { recursive: true, force: true }),
  };
}

test("ADVANCE refuses a room whose stored phase the module does not declare, instead of rewinding it", async () => {
  const h = await harness();
  try {
    const created = await h.service.createSession({ lessonModuleId: "probe", title: "t" });
    const key = created.teacherKey!;
    const code = created.session.code;

    // Put the room into a phase the module never declares — exactly what a
    // snapshot written by a different build of this lesson looks like. The
    // loader validates `id` and `code` only, so this is a reachable state, not
    // a contrived one.
    const row = (await h.repo.getSessionByCode(code))!;
    await h.repo.updateSession(row.id, { phase: "COUNTERFACTUAL" }, row.version);

    await assert.rejects(
      () => h.service.control(code, { type: "advance" }, key),
      (err: { code?: string; status?: number }) => {
        assert.equal(err.code, "phase_not_in_module", "the room must be told what is wrong, not silently moved");
        return true;
      },
    );

    const after = (await h.repo.getSessionByCode(code))!;
    assert.equal(after.phase, "COUNTERFACTUAL", "the refused ADVANCE must not have moved the room at all");
    assert.notEqual(after.phase, PHASES[0], "the room must never be sent back to the first phase of the lesson");
  } finally {
    await h.cleanup();
  }
});

test("REVEAL refuses to pull a room backwards, and does not fire onPhaseExit in reverse", async () => {
  const h = await harness();
  try {
    const created = await h.service.createSession({ lessonModuleId: "probe", title: "t" });
    const key = created.teacherKey!;
    const code = created.session.code;

    await h.service.control(code, { type: "advance" }, key); // LOBBY -> PLAY
    await h.service.control(code, { type: "advance" }, key); // PLAY -> REVEAL
    const atSynthesis = await h.service.control(code, { type: "advance" }, key); // REVEAL -> SYNTHESIS
    assert.equal(atSynthesis.session.phase, "SYNTHESIS");

    const before = (await h.repo.getSessionByCode(code))!.state as ProbeState;
    const exitsBefore = before.exits.length;

    await assert.rejects(
      () => h.service.control(code, { type: "reveal" }, key),
      (err: { code?: string }) => {
        assert.equal(err.code, "phase_would_rewind");
        return true;
      },
    );

    const after = (await h.repo.getSessionByCode(code))!;
    assert.equal(after.phase, "SYNTHESIS", "a refused reveal must leave the room where it was");
    const state = after.state as ProbeState;
    assert.equal(state.exits.length, exitsBefore, "onPhaseExit must not fire on a transition that was refused");
    for (const e of state.exits) {
      assert.ok(
        PHASES.indexOf(e.to) > PHASES.indexOf(e.from),
        `onPhaseExit fired backwards: ${e.from} -> ${e.to}. Every module that implements it reads "from" as "actually leaving".`,
      );
    }
  } finally {
    await h.cleanup();
  }
});

test("REVEAL still works forwards, so the guard has not disabled the control", async () => {
  const h = await harness();
  try {
    const created = await h.service.createSession({ lessonModuleId: "probe", title: "t" });
    const key = created.teacherKey!;
    const code = created.session.code;
    await h.service.control(code, { type: "advance" }, key); // LOBBY -> PLAY
    const revealed = await h.service.control(code, { type: "reveal" }, key);
    assert.equal(revealed.session.phase, "REVEAL", "a forward jump to REVEAL is the control's whole job");
    // And re-pressing it while already there stays the no-op D-precedent set.
    const again = await h.service.control(code, { type: "reveal" }, key);
    assert.equal(again.session.phase, "REVEAL");
    const state = (await h.repo.getSessionByCode(code))!.state as ProbeState;
    assert.deepEqual(
      state.exits,
      [{ from: "LOBBY", to: "PLAY" }, { from: "PLAY", to: "REVEAL" }],
      "re-pressing reveal in REVEAL is not a transition and must fire nothing",
    );
  } finally {
    await h.cleanup();
  }
});

test("the module is told who is in the room when the round closes and when a hook fires", async () => {
  const h = await harness();
  try {
    const created = await h.service.createSession({ lessonModuleId: "probe", title: "t" });
    const key = created.teacherKey!;
    const code = created.session.code;
    await h.service.control(code, { type: "advance" }, key); // -> PLAY, opens round r1

    const a = await h.service.join(code, "Desk one");
    const b = await h.service.join(code, "Desk two");
    const c = await h.service.join(code, "Desk three");
    assert.ok(a.seat.id && b.seat.id && c.seat.id);

    await h.service.control(code, { type: "hook", hook: "ping" }, key);
    await h.service.control(code, { type: "closeNow" }, key);

    const state = (await h.repo.getSessionByCode(code))!.state as ProbeState;

    const hook = state.rosters.find((r) => r.via === "teacher:ping");
    assert.ok(hook, "the hook must have reached the module");
    assert.equal(hook!.seatIds.length, 3, `a teacher hook saw ${hook!.seatIds.length} desks in a room of 3`);

    const close = state.rosters.find((r) => r.via === "teacher:closeRound");
    assert.ok(close, "the close must have reached the module");
    assert.equal(
      close!.seatIds.length,
      3,
      `the round closed with ${close!.seatIds.length} desks visible to the module, in a room of 3 — ` +
        "a fallback policy that acts on the uncommitted desks cannot see them",
    );
    assert.deepEqual(state.closed, ["n=3"]);
  } finally {
    await h.cleanup();
  }
});

test("the seed envelope names the room it came from and whether that room had finished", async () => {
  const h = await harness();
  try {
    const first = await h.service.createSession({ lessonModuleId: "probe", title: "L1" });
    const key = first.teacherKey!;
    const firstId = first.session.id;
    await h.service.control(first.session.code, { type: "advance" }, key); // -> PLAY, still live

    // Linked while the source is still running — D39 permits it, and this is
    // the case the module could not previously detect.
    const live = await h.service.createSession({
      lessonModuleId: "probe",
      title: "L2 from a live room",
      sourceSessionId: firstId,
      teacherKey: key,
    });
    const liveSeed = ((await h.repo.getSessionById(live.session.id))!.state as ProbeState).seedSeen as Record<string, unknown>;
    assert.equal(liveSeed["lessonModuleId"], "probe");
    assert.equal(liveSeed["sourceSessionId"], firstId, "the module must be able to name the room it inherited");
    assert.equal(liveSeed["sourcePhase"], "PLAY");
    assert.equal(liveSeed["sourceEnded"], false, "a carry out of a room still in play must be detectable by the module");
    assert.ok("state" in liveSeed, "provenance must be additive — the state is still there");

    // Now finish the source and link again.
    await h.service.control(first.session.code, { type: "end" }, key);
    const done = await h.service.createSession({
      lessonModuleId: "probe",
      title: "L2 from a finished room",
      sourceSessionId: firstId,
      teacherKey: key,
    });
    const doneSeed = ((await h.repo.getSessionById(done.session.id))!.state as ProbeState).seedSeen as Record<string, unknown>;
    assert.equal(doneSeed["sourceEnded"], true, "a finished source must read as finished");
  } finally {
    await h.cleanup();
  }
});

test("an unlinked session still gets no seed at all", async () => {
  const h = await harness();
  try {
    const solo = await h.service.createSession({ lessonModuleId: "probe", title: "standalone" });
    const seen = ((await h.repo.getSessionById(solo.session.id))!.state as ProbeState).seedSeen;
    assert.equal(seen, null, "no source session means undefined, not an empty envelope a module might trust");
  } finally {
    await h.cleanup();
  }
});
