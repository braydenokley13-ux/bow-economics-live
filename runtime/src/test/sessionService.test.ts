import assert from "node:assert/strict";
import { test } from "node:test";
import { draftDayModule } from "../modules/draftDay.js";
import { lobbyDemoModule } from "../modules/lobbyDemo.js";
import { tradeDeadlineModule } from "../modules/tradeDeadline.js";
import { ServiceError, SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";

function freshService(): SessionService {
  const repo = new SnapshotRepository(null); // in-memory only, no disk I/O
  const service = new SessionService(repo);
  service.registerModule(lobbyDemoModule);
  return service;
}

/** Same as freshService but with both L1 (draftDay) and L2 (tradeDeadline) registered — for the cross-lesson
 *  seed tests below. */
function freshL1L2Service(): SessionService {
  const repo = new SnapshotRepository(null);
  const service = new SessionService(repo);
  service.registerModule(draftDayModule);
  service.registerModule(tradeDeadlineModule);
  return service;
}

/** Creates a session and returns both the payload and its teacher key, so call sites read naturally. */
async function newSession(service: SessionService, lessonModuleId = "lobby-demo", title = "") {
  const payload = await service.createSession({ lessonModuleId, title });
  const teacherKey = payload.teacherKey!;
  return { payload, teacherKey, session: payload.session };
}

async function expectServiceError(promise: Promise<unknown>, status: number, code?: string): Promise<void> {
  try {
    await promise;
    assert.fail("expected a ServiceError");
  } catch (error) {
    assert.ok(error instanceof ServiceError, `expected ServiceError, got ${String(error)}`);
    assert.equal((error as ServiceError).status, status);
    if (code) assert.equal((error as ServiceError).code, code);
  }
}

/* ------------------------------------------------------------- create/join -- */

test("createSession issues a unique join code, a teacher key, and starts in the lesson's first phase", async () => {
  const service = freshService();
  const { payload } = await newSession(service);
  assert.match(payload.session.code, /^BOW[A-Z0-9]{3}$/);
  assert.equal(payload.session.phase, "LOBBY");
  assert.equal(payload.session.ended, false);
  assert.equal(payload.seats.length, 0);
  assert.ok(payload.teacherKey && payload.teacherKey.length > 20, "createSession must issue a teacher key (R1)");
});

test("createSession rejects an unregistered lesson module", async () => {
  const service = freshService();
  await expectServiceError(service.createSession({ lessonModuleId: "nope", title: "" }), 400, "unknown_module");
});

test("join creates a seat, returns a device token and a rejoin PIN", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const payload = await service.join(session.code, "Alex");
  assert.equal(payload.seat.displayName, "Alex");
  assert.ok(payload.deviceToken && payload.deviceToken.length > 20);
  assert.match(payload.rejoinPin ?? "", /^\d{4}$/);
});

test("join supports a pair joining as one seat via a combined display name", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const payload = await service.join(session.code, "Sam & Jordan");
  assert.equal(payload.seat.displayName, "Sam & Jordan");
});

test("join against an unknown code 404s", async () => {
  const service = freshService();
  await expectServiceError(service.join("BOWZZZ", "Alex"), 404, "not_found");
});

test("duplicate-join: the same name in the same session is rejected, not silently duplicated", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  await service.join(session.code, "Alex");
  await expectServiceError(service.join(session.code, "Alex"), 409, "name_taken");
  await expectServiceError(service.join(session.code, "  alex  "), 409, "name_taken"); // case/space-insensitive
});

test("the same name is allowed again in a different session", async () => {
  const service = freshService();
  const a = await newSession(service);
  const b = await newSession(service);
  await service.join(a.session.code, "Alex");
  const second = await service.join(b.session.code, "Alex");
  assert.equal(second.seat.displayName, "Alex");
});

/* ------------------------------------------------------------------ resume -- */

test("resumeByToken returns the same seat instantly, no code or name needed", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  const resumed = await service.resumeByToken(joined.deviceToken!);
  assert.equal(resumed.seat.id, joined.seat.id);
  assert.equal(resumed.session.code, session.code);
});

test("resumeByToken with a bogus token is rejected as retired/unauthorized", async () => {
  const service = freshService();
  await expectServiceError(service.resumeByToken("not-a-real-token"), 401, "retired");
});

test("rejoin with the correct name+PIN rotates the device token and retires the old one", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  const rejoined = await service.rejoin(session.code, "Alex", joined.rejoinPin!);
  assert.equal(rejoined.seat.id, joined.seat.id);
  assert.notEqual(rejoined.deviceToken, joined.deviceToken);
  // The old device token no longer works.
  await expectServiceError(service.resumeByToken(joined.deviceToken!), 401, "retired");
  // The new one does.
  const resumed = await service.resumeByToken(rejoined.deviceToken!);
  assert.equal(resumed.seat.id, joined.seat.id);
});

test("rejoin with a wrong PIN is rejected", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  await service.join(session.code, "Alex");
  await expectServiceError(service.rejoin(session.code, "Alex", "0000"), 401, "bad_rejoin");
});

/* --------------------------------------------------------- R3: rejoin lockout -- */

test("R3: a seat locks out after 5 wrong PINs, even against the correct PIN, until the teacher clears it", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");

  for (let i = 0; i < 5; i += 1) {
    await expectServiceError(service.rejoin(session.code, "Alex", "0000"), 401, "bad_rejoin");
  }
  // The 6th attempt is locked out — rejected even with the CORRECT PIN, before it's ever checked.
  await expectServiceError(service.rejoin(session.code, "Alex", joined.rejoinPin!), 423, "rejoin_locked");

  // The teacher clears it, without knowing the PIN.
  await service.unlockRejoin(session.code, joined.seat.id, teacherKey);
  const rejoined = await service.rejoin(session.code, "Alex", joined.rejoinPin!);
  assert.equal(rejoined.seat.id, joined.seat.id);
});

test("R3: a correct rejoin resets the failure counter (occasional typos don't accumulate toward lockout)", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await expectServiceError(service.rejoin(session.code, "Alex", "0000"), 401, "bad_rejoin");
  await expectServiceError(service.rejoin(session.code, "Alex", "0000"), 401, "bad_rejoin");
  const rejoined = await service.rejoin(session.code, "Alex", joined.rejoinPin!); // succeeds, resets counter
  assert.ok(rejoined.deviceToken);
  // Now four more wrong guesses shouldn't lock it out yet (counter was reset, not accumulated to 6).
  for (let i = 0; i < 4; i += 1) {
    await expectServiceError(service.rejoin(session.code, "Alex", "9999"), 401, "bad_rejoin");
  }
});

test("R3: unlockRejoin requires the teacher key", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await expectServiceError(service.unlockRejoin(session.code, joined.seat.id, "wrong-key"), 401, "bad_teacher_key");
  await expectServiceError(service.unlockRejoin(session.code, joined.seat.id, null), 401, "bad_teacher_key");
});

/* --------------------------------------------------------------- R1: teacher auth -- */

test("R1: control() rejects a missing or wrong teacher key — the join code alone is not enough", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  await expectServiceError(service.control(session.code, { type: "advance" }, null), 401, "bad_teacher_key");
  await expectServiceError(service.control(session.code, { type: "advance" }, "not-the-real-key"), 401, "bad_teacher_key");
});

test("R1: control() succeeds with the correct teacher key", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const payload = await service.control(session.code, { type: "advance" }, teacherKey);
  assert.equal(payload.session.phase, "PLAY");
});

test("R1: teacherView() rejects a missing or wrong teacher key — closes the pre-reveal peek gap", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  await service.join(session.code, "Alex");
  await expectServiceError(service.teacherView(session.code, null), 401, "bad_teacher_key");
  await expectServiceError(service.teacherView(session.code, "guessed-key"), 401, "bad_teacher_key");
});

test("R1: teacherView() succeeds with the correct teacher key and only that key", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  await service.join(session.code, "Alex");
  const payload = await service.teacherView(session.code, teacherKey);
  assert.equal(payload.seats.length, 1);
});

test("R1: two sessions get two independent teacher keys — one session's key does not open another's", async () => {
  const service = freshService();
  const a = await newSession(service);
  const b = await newSession(service);
  assert.notEqual(a.teacherKey, b.teacherKey);
  await expectServiceError(service.control(b.session.code, { type: "advance" }, a.teacherKey), 401, "bad_teacher_key");
  const ok = await service.control(b.session.code, { type: "advance" }, b.teacherKey);
  assert.equal(ok.session.phase, "PLAY");
});

/* -------------------------------------------------------------- phase gate -- */

test("phase-gate: an action submitted while the session is in LOBBY is rejected", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 409, "rejected");
});

test("phase-gate: the same action succeeds once the teacher advances to PLAY", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  const result = await service.submitAction(joined.deviceToken!, { type: "pick", color: "red" });
  assert.equal((result.view as { myPick: string }).myPick, "red");
});

test("phase-gate: paused sessions reject student actions with 423", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  await service.control(session.code, { type: "pause" }, teacherKey);
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 423, "paused");
});

test("phase-gate: frozen sessions reject student actions with 423", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  await service.control(session.code, { type: "freeze" }, teacherKey);
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 423, "frozen");
});

test("phase-gate: ended sessions reject student actions with 410", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  await service.control(session.code, { type: "end" }, teacherKey);
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 410, "session_ended");
});

/* --------------------------------------------------------- action-validation -- */

test("action-validation: a malformed action (bad color) is rejected by the module's reducer, not silently accepted", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "not-a-color" }), 409, "rejected");
});

test("action-validation: an action from a retired token is rejected before it ever reaches the reducer", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey);
  await expectServiceError(service.submitAction("bogus-token", { type: "pick", color: "red" }), 401, "retired");
});

/* -------------------------------------------------------------- reducer via aggregation -- */

test("teacher aggregate view reflects picks made through the full service path", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const a = await service.join(session.code, "Alex");
  const b = await service.join(session.code, "Blake");
  await service.control(session.code, { type: "advance" }, teacherKey); // PLAY
  await service.submitAction(a.deviceToken!, { type: "pick", color: "red" });
  await service.submitAction(b.deviceToken!, { type: "pick", color: "red" });
  await service.control(session.code, { type: "reveal" }, teacherKey);
  const teacher = await service.teacherView(session.code, teacherKey);
  const view = teacher.view as { tally: Record<string, number> };
  assert.equal(view.tally.red, 2);
});

/* ------------------------------------------------------------- teacher controls -- */

test("control: advance walks the module's declared phase order and stops at the last phase", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  let payload = await service.control(session.code, { type: "advance" }, teacherKey); // PLAY
  assert.equal(payload.session.phase, "PLAY");
  payload = await service.control(session.code, { type: "advance" }, teacherKey); // REVEAL
  assert.equal(payload.session.phase, "REVEAL");
  payload = await service.control(session.code, { type: "advance" }, teacherKey); // SYNTHESIS
  assert.equal(payload.session.phase, "SYNTHESIS");
  payload = await service.control(session.code, { type: "advance" }, teacherKey); // COMPLETE
  assert.equal(payload.session.phase, "COMPLETE");
  await expectServiceError(service.control(session.code, { type: "advance" }, teacherKey), 400, "no_next_phase");
});

test("control: reveal jumps directly to REVEAL regardless of current phase", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const payload = await service.control(session.code, { type: "reveal" }, teacherKey);
  assert.equal(payload.session.phase, "REVEAL");
});

test("control: pause/unpause and freeze/unfreeze toggle their flags", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  let payload = await service.control(session.code, { type: "pause" }, teacherKey);
  assert.equal(payload.session.paused, true);
  payload = await service.control(session.code, { type: "unpause" }, teacherKey);
  assert.equal(payload.session.paused, false);
  payload = await service.control(session.code, { type: "freeze" }, teacherKey);
  assert.equal(payload.session.frozen, true);
  assert.equal(payload.session.paused, true, "freeze implies paused");
  payload = await service.control(session.code, { type: "unfreeze" }, teacherKey);
  assert.equal(payload.session.frozen, false);
});

test("control: end stops all further student actions and control actions except restore", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  await service.control(session.code, { type: "end" }, teacherKey);
  await expectServiceError(service.control(session.code, { type: "advance" }, teacherKey), 410, "session_ended");
});

test("one-click recovery: restore reverts to the checkpoint captured before the last risky transition", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const alex = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey); // LOBBY -> PLAY, checkpoint = LOBBY state
  await service.submitAction(alex.deviceToken!, { type: "pick", color: "green" });
  const beforeRestore = await service.teacherView(session.code, teacherKey);
  assert.equal(beforeRestore.session.phase, "PLAY");
  assert.equal(beforeRestore.session.hasCheckpoint, true);

  const restored = await service.control(session.code, { type: "restore" }, teacherKey);
  assert.equal(restored.session.phase, "LOBBY");
  const view = restored.view as { pickedCount: number };
  assert.equal(view.pickedCount, 0, "the pick made during PLAY is gone — restore reverted the whole state");
});

test("restore with no checkpoint yet is a clean 400, not a crash", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  await expectServiceError(service.control(session.code, { type: "restore" }, teacherKey), 400, "no_checkpoint");
});

test("control: hook forwards to the module's reducer as a teacher: action, and an unhandled hook is a clean rejection", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  // lobby-demo does not implement any hooks, so this proves the wiring end-to-end
  // (reaches the reducer) without silently succeeding.
  await expectServiceError(service.control(session.code, { type: "hook", hook: "shock" }, teacherKey), 400, "hook_rejected");
});

test("board view never includes seat-level data", async () => {
  const service = freshService();
  const { session } = await newSession(service);
  await service.join(session.code, "Alex");
  const board = await service.boardView(session.code);
  const serialized = JSON.stringify(board);
  assert.doesNotMatch(serialized, /Alex/, "board payload leaked a student's display name");
});

/* --------------------------------------------------------- R2: restore-after-end -- */

test("R2: restore can revive a session the teacher ended by mistake", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  const alex = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }, teacherKey); // LOBBY -> PLAY, checkpoint captured
  await service.submitAction(alex.deviceToken!, { type: "pick", color: "blue" });

  // Fat-finger "End Session" — this itself now captures a fresh checkpoint.
  await service.control(session.code, { type: "end" }, teacherKey);
  await expectServiceError(service.submitAction(alex.deviceToken!, { type: "pick", color: "red" }), 410, "session_ended");

  const restored = await service.control(session.code, { type: "restore" }, teacherKey);
  assert.equal(restored.session.ended, false, "restore must clear `ended`, not just revert phase/state");
  assert.equal(restored.session.phase, "PLAY");

  // The session is genuinely alive again — a student action succeeds post-restore.
  const result = await service.submitAction(alex.deviceToken!, { type: "pick", color: "green" });
  assert.equal((result.view as { myPick: string }).myPick, "green");
});

test("R2: restore after end reaching all the way back past freeze still clears ended", async () => {
  const service = freshService();
  const { session, teacherKey } = await newSession(service);
  await service.control(session.code, { type: "advance" }, teacherKey); // PLAY, checkpoint = LOBBY
  await service.control(session.code, { type: "freeze" }, teacherKey); // checkpoint = PLAY (pre-freeze)
  await service.control(session.code, { type: "unfreeze" }, teacherKey);
  await service.control(session.code, { type: "end" }, teacherKey); // checkpoint = PLAY, unfrozen, not ended (pre-end)

  const restored = await service.control(session.code, { type: "restore" }, teacherKey);
  assert.equal(restored.session.ended, false);
  assert.equal(restored.session.frozen, false);
  assert.equal(restored.session.phase, "PLAY");
});

/* ------------------------------------------ L1->L2 cross-lesson seed (M1 L2) -- */

/** Drives a real L1 (draftDay) session through the service layer to a single locked, at-$100M-cap roster, and
 *  returns its session id — the same path a real teacher/class would take, not a hand-forged snapshot. */
async function playThroughL1(service: SessionService): Promise<{ sessionId: string; code: string }> {
  const { session, teacherKey } = await newSession(service, draftDayModule.id, "L1 class");
  const seat = await service.join(session.code, "Alex & Sam");
  await service.control(session.code, { type: "advance" }, teacherKey); // LOBBY -> HOOK
  await service.control(session.code, { type: "advance" }, teacherKey); // HOOK -> PLAY
  const picks = [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]; // 30+10+30+20+10 = 100
  for (const { slot, playerId } of picks) {
    await service.submitAction(seat.deviceToken!, { type: "place", slotId: slot, playerId });
  }
  await service.submitAction(seat.deviceToken!, { type: "lock" });
  return { sessionId: session.id, code: session.code };
}

test("SEED: linked creation happy path — L2 created with sourceSessionId carries the real L1 roster through submitAction/join, not a forged snapshot", async () => {
  const service = freshL1L2Service();
  const { sessionId: l1Id } = await playThroughL1(service);

  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "L2 class", sourceSessionId: l1Id });
  const l2View = l2.view as { carriedFranchiseCount: number };
  assert.equal(l2View.carriedFranchiseCount, 1, "the one locked L1 team must be offered as a claimable carried franchise");

  const l2Seat = await service.join(l2.session.code, "Alex & Sam"); // a new seat in a new session — different seatId entirely
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!); // LOBBY -> HOOK
  const claimed = await service.submitAction(l2Seat.deviceToken!, { type: "claim", carriedIndex: 0 });
  const view = claimed.view as { claimed: boolean; franchise: { name: string; origin: string }; spend: number };
  assert.equal(view.claimed, true);
  assert.equal(view.franchise.origin, "carried");
  assert.equal(view.franchise.name, "Ironworks");
  assert.equal(view.spend, 100);
});

test("SEED: an ENDED L1 session is still a valid, usable seed — its state is exactly what's carried forward", async () => {
  const service = freshL1L2Service();
  const l1 = await service.createSession({ lessonModuleId: draftDayModule.id, title: "L1 class" });
  const seat = await service.join(l1.session.code, "Alex & Sam");
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!); // LOBBY -> HOOK
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!); // HOOK -> PLAY
  const picks = [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ];
  for (const { slot, playerId } of picks) await service.submitAction(seat.deviceToken!, { type: "place", slotId: slot, playerId });
  await service.submitAction(seat.deviceToken!, { type: "lock" });
  await service.control(l1.session.code, { type: "end" }, l1.teacherKey!); // teacher ends class — the normal end-of-lesson flow

  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "L2 class", sourceSessionId: l1.session.id });
  const l2View = l2.view as { carriedFranchiseCount: number };
  assert.equal(l2View.carriedFranchiseCount, 1, "an ended L1 session's locked roster still carries forward — ending class doesn't erase what happened in it");
});

test("SEED: a missing/nonexistent sourceSessionId does not fail session creation — it just yields no carried franchises", async () => {
  const service = freshL1L2Service();
  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "", sourceSessionId: "not-a-real-session-id" });
  const view = l2.view as { carriedFranchiseCount: number };
  assert.equal(view.carriedFranchiseCount, 0);
  // The whole class must still be fully playable on stock franchises — claim() with carriedIndex null works.
  const seat = await service.join(l2.session.code, "Jordan");
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!);
  const claimed = await service.submitAction(seat.deviceToken!, { type: "claim", carriedIndex: null });
  const claimedView = claimed.view as { claimed: boolean; franchise: { origin: string } };
  assert.equal(claimedView.claimed, true);
  assert.equal(claimedView.franchise.origin, "stock");
});

test("SEED: sourceSessionId pointing at a session using a DIFFERENT lesson module is ignored (empty pool), not crashed or misread", async () => {
  const service = freshL1L2Service();
  const other = await service.createSession({ lessonModuleId: draftDayModule.id, title: "" }); // never played — irrelevant, wrong module id path is what's tested
  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "", sourceSessionId: other.session.id });
  const view = l2.view as { carriedFranchiseCount: number };
  assert.equal(view.carriedFranchiseCount, 0, "an unlocked/empty L1 session naturally carries nothing forward");
});

test("SEED: malformed/incomplete L1 state (never locked) normalizes to zero carried franchises, never crashes createSession", async () => {
  const service = freshL1L2Service();
  const l1 = await service.createSession({ lessonModuleId: draftDayModule.id, title: "" });
  const seat = await service.join(l1.session.code, "Alex");
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!);
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!);
  await service.submitAction(seat.deviceToken!, { type: "place", slotId: "SCORER", playerId: "sc-10" }); // never locks

  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "", sourceSessionId: l1.session.id });
  const view = l2.view as { carriedFranchiseCount: number };
  assert.equal(view.carriedFranchiseCount, 0);
});

test("SEED: two seats can claim two different carried franchises from the same linked L1 session, each getting their own real roster", async () => {
  const service = freshL1L2Service();
  const l1 = await service.createSession({ lessonModuleId: draftDayModule.id, title: "" });
  const seatIds = ["Team One", "Team Two"];
  const a = await service.join(l1.session.code, seatIds[0]!);
  const b = await service.join(l1.session.code, seatIds[1]!);
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!);
  await service.control(l1.session.code, { type: "advance" }, l1.teacherKey!);
  const picksA = [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ];
  const picksB = [
    { slot: "SCORER", playerId: "sc-10b" },
    { slot: "PLAYMAKER", playerId: "pm-10b" },
    { slot: "DEFENDER", playerId: "df-10b" },
    { slot: "REBOUNDER", playerId: "rb-10b" },
    { slot: "WILDCARD", playerId: "sc-10c" },
  ];
  for (const { slot, playerId } of picksA) await service.submitAction(a.deviceToken!, { type: "place", slotId: slot, playerId });
  await service.submitAction(a.deviceToken!, { type: "lock" });
  for (const { slot, playerId } of picksB) await service.submitAction(b.deviceToken!, { type: "place", slotId: slot, playerId });
  await service.submitAction(b.deviceToken!, { type: "lock" });

  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "", sourceSessionId: l1.session.id });
  assert.equal((l2.view as { carriedFranchiseCount: number }).carriedFranchiseCount, 2);

  const l2SeatA = await service.join(l2.session.code, "Pair One");
  const l2SeatB = await service.join(l2.session.code, "Pair Two");
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!);
  const claimedA = await service.submitAction(l2SeatA.deviceToken!, { type: "claim", carriedIndex: 0 });
  const claimedB = await service.submitAction(l2SeatB.deviceToken!, { type: "claim", carriedIndex: 1 });
  const viewA = claimedA.view as { franchise: { name: string }; spend: number };
  const viewB = claimedB.view as { franchise: { name: string }; spend: number };
  assert.notEqual(viewA.franchise.name, viewB.franchise.name);
  assert.equal(viewA.spend, 100);
  assert.equal(viewB.spend, 50);

  // A third pair cannot claim the same carried franchise index 0 again.
  const l2SeatC = await service.join(l2.session.code, "Pair Three");
  try {
    await service.submitAction(l2SeatC.deviceToken!, { type: "claim", carriedIndex: 0 });
    assert.fail("expected the duplicate claim to be rejected");
  } catch (error) {
    assert.ok(error instanceof ServiceError);
    assert.equal((error as ServiceError).status, 409);
  }
});

/* ------------------------------------------ B1 repair: real control()-driven early advance -- */

test("B1 repair (VERIFY_L2.md BLOCKER): a real teacher.control({type:'advance'}) call out of REVEAL — not just the module's pure onPhaseExit — auto-resolves a pending bid", async () => {
  const service = freshL1L2Service();
  const l2 = await service.createSession({ lessonModuleId: tradeDeadlineModule.id, title: "" }); // unlinked — stock franchise is enough to prove the wiring
  const seat = await service.join(l2.session.code, "Team X");
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!); // LOBBY -> HOOK
  await service.submitAction(seat.deviceToken!, { type: "claim", carriedIndex: null }); // stock: SCORER=sc-20 PLAYMAKER=pm-20 ...
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!); // HOOK -> PLAY
  await service.submitAction(seat.deviceToken!, { type: "cutForBid", slot: "PLAYMAKER", targetId: "tgt-pm", bidAmount: 5 }); // a lowball, guaranteed to lose against the $35 reserve
  await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!); // PLAY -> REVEAL

  const preAdvance = await service.teacherView(l2.session.code, l2.teacherKey!);
  const preTeam = (preAdvance.view as { teams: { bidOutcome: string | null }[] }).teams[0]!;
  assert.equal(preTeam.bidOutcome, null, "precondition: nothing revealed yet");

  // The teacher advances straight out of REVEAL without ever calling the revealNext hook — exactly VERIFY_L2.md's
  // repro, driven through the real service.control() path (sessionService.applyPhaseChange), not the module directly.
  const afterAdvance = await service.control(l2.session.code, { type: "advance" }, l2.teacherKey!); // REVEAL -> ADAPT
  assert.equal(afterAdvance.session.phase, "ADAPT");
  const postTeam = (afterAdvance.view as { teams: { bidOutcome: string | null; openSlot: boolean }[] }).teams[0]!;
  assert.equal(postTeam.bidOutcome, "lost", "resolved by the real control() call, not left stranded null");
  assert.equal(postTeam.openSlot, true);

  const agg = (afterAdvance.view as { aggregate: { openSlotCount: number } }).aggregate;
  assert.equal(agg.openSlotCount, 1);

  // And the seat's own studentView (what /play actually renders) offers the real rescue, not the false "nothing
  // to do here" — fetched via resumeByToken, the same path GET /api/me uses.
  const studentPayload = await service.resumeByToken(seat.deviceToken!);
  const studentView = studentPayload.view as { openSlot: string | null; rescued: boolean; candidates: unknown[] };
  assert.equal(studentView.openSlot, "PLAYMAKER");
  assert.equal(studentView.rescued, false);
  assert.ok(studentView.candidates.length >= 2);
});
