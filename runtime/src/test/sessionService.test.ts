import assert from "node:assert/strict";
import { test } from "node:test";
import { lobbyDemoModule } from "../modules/lobbyDemo.js";
import { ServiceError, SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";

function freshService(): SessionService {
  const repo = new SnapshotRepository(null); // in-memory only, no disk I/O
  const service = new SessionService(repo);
  service.registerModule(lobbyDemoModule);
  return service;
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

test("createSession issues a unique join code and starts in the lesson's first phase", async () => {
  const service = freshService();
  const payload = await service.createSession({ lessonModuleId: "lobby-demo", title: "Period 3" });
  assert.match(payload.session.code, /^BOW[A-Z0-9]{3}$/);
  assert.equal(payload.session.phase, "LOBBY");
  assert.equal(payload.session.ended, false);
  assert.equal(payload.seats.length, 0);
});

test("createSession rejects an unregistered lesson module", async () => {
  const service = freshService();
  await expectServiceError(service.createSession({ lessonModuleId: "nope", title: "" }), 400, "unknown_module");
});

test("join creates a seat, returns a device token and a rejoin PIN", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const payload = await service.join(session.code, "Alex");
  assert.equal(payload.seat.displayName, "Alex");
  assert.ok(payload.deviceToken && payload.deviceToken.length > 20);
  assert.match(payload.rejoinPin ?? "", /^\d{4}$/);
});

test("join supports a pair joining as one seat via a combined display name", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const payload = await service.join(session.code, "Sam & Jordan");
  assert.equal(payload.seat.displayName, "Sam & Jordan");
});

test("join against an unknown code 404s", async () => {
  const service = freshService();
  await expectServiceError(service.join("BOWZZZ", "Alex"), 404, "not_found");
});

test("duplicate-join: the same name in the same session is rejected, not silently duplicated", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.join(session.code, "Alex");
  await expectServiceError(service.join(session.code, "Alex"), 409, "name_taken");
  await expectServiceError(service.join(session.code, "  alex  "), 409, "name_taken"); // case/space-insensitive
});

test("the same name is allowed again in a different session", async () => {
  const service = freshService();
  const a = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const b = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.join(a.session.code, "Alex");
  const second = await service.join(b.session.code, "Alex");
  assert.equal(second.seat.displayName, "Alex");
});

/* ------------------------------------------------------------------ resume -- */

test("resumeByToken returns the same seat instantly, no code or name needed", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
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
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
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
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.join(session.code, "Alex");
  await expectServiceError(service.rejoin(session.code, "Alex", "0000"), 401, "bad_rejoin");
});

/* -------------------------------------------------------------- phase gate -- */

test("phase-gate: an action submitted while the session is in LOBBY is rejected", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 409, "rejected");
});

test("phase-gate: the same action succeeds once the teacher advances to PLAY", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  const result = await service.submitAction(joined.deviceToken!, { type: "pick", color: "red" });
  assert.equal((result.view as { myPick: string }).myPick, "red");
});

test("phase-gate: paused sessions reject student actions with 423", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  await service.control(session.code, { type: "pause" });
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 423, "paused");
});

test("phase-gate: frozen sessions reject student actions with 423", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  await service.control(session.code, { type: "freeze" });
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 423, "frozen");
});

test("phase-gate: ended sessions reject student actions with 410", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  await service.control(session.code, { type: "end" });
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "red" }), 410, "session_ended");
});

/* --------------------------------------------------------- action-validation -- */

test("action-validation: a malformed action (bad color) is rejected by the module's reducer, not silently accepted", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const joined = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  await expectServiceError(service.submitAction(joined.deviceToken!, { type: "pick", color: "not-a-color" }), 409, "rejected");
});

test("action-validation: an action from a retired token is rejected before it ever reaches the reducer", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" });
  await expectServiceError(service.submitAction("bogus-token", { type: "pick", color: "red" }), 401, "retired");
});

/* -------------------------------------------------------------- reducer via aggregation -- */

test("teacher aggregate view reflects picks made through the full service path", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const a = await service.join(session.code, "Alex");
  const b = await service.join(session.code, "Blake");
  await service.control(session.code, { type: "advance" }); // PLAY
  await service.submitAction(a.deviceToken!, { type: "pick", color: "red" });
  await service.submitAction(b.deviceToken!, { type: "pick", color: "red" });
  await service.control(session.code, { type: "reveal" });
  const teacher = await service.teacherView(session.code);
  const view = teacher.view as { tally: Record<string, number> };
  assert.equal(view.tally.red, 2);
});

/* ------------------------------------------------------------- teacher controls -- */

test("control: advance walks the module's declared phase order and stops at the last phase", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  let payload = await service.control(session.code, { type: "advance" }); // PLAY
  assert.equal(payload.session.phase, "PLAY");
  payload = await service.control(session.code, { type: "advance" }); // REVEAL
  assert.equal(payload.session.phase, "REVEAL");
  payload = await service.control(session.code, { type: "advance" }); // SYNTHESIS
  assert.equal(payload.session.phase, "SYNTHESIS");
  payload = await service.control(session.code, { type: "advance" }); // COMPLETE
  assert.equal(payload.session.phase, "COMPLETE");
  await expectServiceError(service.control(session.code, { type: "advance" }), 400, "no_next_phase");
});

test("control: reveal jumps directly to REVEAL regardless of current phase", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const payload = await service.control(session.code, { type: "reveal" });
  assert.equal(payload.session.phase, "REVEAL");
});

test("control: pause/unpause and freeze/unfreeze toggle their flags", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  let payload = await service.control(session.code, { type: "pause" });
  assert.equal(payload.session.paused, true);
  payload = await service.control(session.code, { type: "unpause" });
  assert.equal(payload.session.paused, false);
  payload = await service.control(session.code, { type: "freeze" });
  assert.equal(payload.session.frozen, true);
  assert.equal(payload.session.paused, true, "freeze implies paused");
  payload = await service.control(session.code, { type: "unfreeze" });
  assert.equal(payload.session.frozen, false);
});

test("control: end stops all further student actions and control actions except restore", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.control(session.code, { type: "end" });
  await expectServiceError(service.control(session.code, { type: "advance" }), 410, "session_ended");
});

test("one-click recovery: restore reverts to the checkpoint captured before the last risky transition", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  const alex = await service.join(session.code, "Alex");
  await service.control(session.code, { type: "advance" }); // LOBBY -> PLAY, checkpoint = LOBBY state
  await service.submitAction(alex.deviceToken!, { type: "pick", color: "green" });
  const beforeRestore = await service.teacherView(session.code);
  assert.equal(beforeRestore.session.phase, "PLAY");
  assert.equal(beforeRestore.session.hasCheckpoint, true);

  const restored = await service.control(session.code, { type: "restore" });
  assert.equal(restored.session.phase, "LOBBY");
  const view = restored.view as { pickedCount: number };
  assert.equal(view.pickedCount, 0, "the pick made during PLAY is gone — restore reverted the whole state");
});

test("restore with no checkpoint yet is a clean 400, not a crash", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await expectServiceError(service.control(session.code, { type: "restore" }), 400, "no_checkpoint");
});

test("control: hook forwards to the module's reducer as a teacher: action, and an unhandled hook is a clean rejection", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  // lobby-demo does not implement any hooks, so this proves the wiring end-to-end
  // (reaches the reducer) without silently succeeding.
  await expectServiceError(service.control(session.code, { type: "hook", hook: "shock" }), 400, "hook_rejected");
});

test("board view never includes seat-level data", async () => {
  const service = freshService();
  const { session } = await service.createSession({ lessonModuleId: "lobby-demo", title: "" });
  await service.join(session.code, "Alex");
  const board = await service.boardView(session.code);
  const serialized = JSON.stringify(board);
  assert.doesNotMatch(serialized, /Alex/, "board payload leaked a student's display name");
});
