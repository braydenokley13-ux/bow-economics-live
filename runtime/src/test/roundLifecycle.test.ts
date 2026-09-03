/**
 * W2/W3 — TIME CUT and action integrity, at the service boundary.
 *
 * Two founder requirements are proved here, together, because they are the same
 * requirement seen from two ends:
 *
 *  - a valid student action inside an open window is applied EXACTLY ONCE, or
 *    refused with a reason the student can be told. A transport race, a teacher
 *    pause, or a phase advance landing a beat early are none of them legitimate
 *    reasons to destroy a decision;
 *  - the teacher gets FINAL CALL (announce, keep taking decisions, settle on the
 *    server's clock) and CLOSE NOW (settle immediately), and cannot press either
 *    without being shown who has committed nothing and what it does to them.
 *
 * Full House is the lesson under test because it is the one with the tightest
 * round (a night) and the most consequential fallback.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fullHouseModule } from "../modules/fullHouse.js";
import { ServiceError, SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";

function service(): SessionService {
  const s = new SessionService(new SnapshotRepository(null));
  s.registerModule(fullHouseModule);
  return s;
}

/** Drive a session to PLAY with `names.length` seated desks. */
async function inPlay(names: string[]) {
  const svc = service();
  const created = await svc.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const seats = [];
  for (const name of names) seats.push(await svc.join(code, name));
  await svc.control(code, { type: "advance" }, key); // LOBBY -> HOOK
  await svc.control(code, { type: "advance" }, key); // HOOK -> PLAY
  for (const seat of seats) await svc.submitAction(seat.deviceToken!, { type: "takeSeat" });
  return { svc, code, key, seats };
}

async function caught(promise: Promise<unknown>): Promise<ServiceError> {
  try {
    await promise;
    assert.fail("expected a ServiceError");
  } catch (error) {
    assert.ok(error instanceof ServiceError, `expected ServiceError, got ${String(error)}`);
    return error;
  }
}

/* ------------------------------------------------------- retryability -- */

test("a pause refuses the action as RETRYABLE — the decision is held, not destroyed", async () => {
  const { svc, code, key, seats } = await inPlay(["A"]);
  await svc.control(code, { type: "pause" }, key);
  const err = await caught(svc.submitAction(seats[0]!.deviceToken!, { type: "lock", id: "act-1" }));
  assert.equal(err.status, 423);
  assert.equal(err.retryable, true, "a paused room is the teacher holding the room, not a ruling on the student's choice");

  // And the held action lands the moment the room moves — which is the whole point.
  await svc.control(code, { type: "unpause" }, key);
  const ok = await svc.submitAction(seats[0]!.deviceToken!, { type: "lock", id: "act-1" });
  assert.equal(ok.disposition, "applied");
});

test("a freeze refuses as RETRYABLE; an ended session refuses as DEFINITIVE", async () => {
  const { svc, code, key, seats } = await inPlay(["A"]);
  await svc.control(code, { type: "freeze" }, key);
  const frozen = await caught(svc.submitAction(seats[0]!.deviceToken!, { type: "lock", id: "f1" }));
  assert.equal(frozen.retryable, true);

  await svc.control(code, { type: "unfreeze" }, key);
  await svc.control(code, { type: "end" }, key);
  const ended = await caught(svc.submitAction(seats[0]!.deviceToken!, { type: "lock", id: "f2" }));
  assert.equal(ended.status, 410);
  assert.equal(ended.retryable, false, "nothing about an ended session will ever accept this action — holding it would be a lie");
});

test("a module refusal is DEFINITIVE — retrying a decision the lesson ruled on would only spin", async () => {
  const { svc, seats } = await inPlay(["A"]);
  const err = await caught(svc.submitAction(seats[0]!.deviceToken!, { type: "setPrice", price: 999_999, id: "bad" }));
  assert.equal(err.status, 409);
  assert.equal(err.retryable, false);
});

/* --------------------------------------------------------- idempotency -- */

test("the same action id applied twice is applied ONCE and reported as a duplicate", async () => {
  const { svc, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  const first = await svc.submitAction(token, { type: "setPrice", price: 40, id: "dup-1" });
  assert.equal(first.disposition, "applied");
  const second = await svc.submitAction(token, { type: "setPrice", price: 40, id: "dup-1" });
  assert.equal(second.disposition, "duplicate");
  // The retry must not have moved the session on: a duplicate is a read, not a write.
  assert.equal(second.session.version, first.session.version);
});

test("a retry of an action that landed just before a phase advance reports success, not 'wrong phase'", async () => {
  // The exact live-class race: a pair taps LOCK IT IN, the response is lost on a
  // flaky AP, the teacher advances, and the client retries. Before the
  // idempotency ring the retry came back as a definitive refusal and the pair
  // was told their lock did not count — while the server was holding it.
  const { svc, code, key, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  await svc.submitAction(token, { type: "lock", id: "race-1" });
  await svc.control(code, { type: "advance" }, key); // PLAY -> REVEAL
  const retry = await svc.submitAction(token, { type: "lock", id: "race-1" });
  assert.equal(retry.disposition, "duplicate", "the ring must be checked BEFORE the phase gate, or a landed action reads as a refusal");
});

test("the applied-action ring is bounded and keeps the newest ids", async () => {
  const { svc, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  for (let i = 0; i < 70; i += 1) {
    await svc.submitAction(token, { type: "setPrice", price: 20 + (i % 10) * 2, id: `ring-${i}` });
  }
  const recent = await svc.submitAction(token, { type: "setPrice", price: 40, id: "ring-69" });
  assert.equal(recent.disposition, "duplicate", "the newest ids must still be remembered");
  const evicted = await svc.submitAction(token, { type: "setPrice", price: 40, id: "ring-0" });
  assert.equal(evicted.disposition, "applied", "the ring is bounded — the oldest id has aged out, as designed");
});

/* ------------------------------------------------------------ TIME CUT -- */

test("FINAL CALL announces a server deadline and KEEPS TAKING decisions — the drain is the acceptance", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  const called = await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  assert.equal(called.round?.status, "FINAL_CALL");
  assert.ok(called.round?.endsAt, "a final call with no deadline is not a final call");
  const remaining = Date.parse(called.round!.endsAt!) - Date.parse(called.round!.serverNow);
  assert.ok(remaining > 15_000 && remaining <= 20_000, `expected ~20s of window, got ${remaining}ms`);

  const late = await svc.submitAction(seats[1]!.deviceToken!, { type: "lock", id: "late-1" });
  assert.equal(late.disposition, "applied", "a last-second change must LAND during the final call, not vanish");
});

test("the final call length is clamped — no zero-second window, no window that outlives the lesson", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  const tiny = await svc.control(code, { type: "finalCall", durationMs: 10 }, key);
  assert.ok(Date.parse(tiny.round!.endsAt!) - Date.parse(tiny.round!.serverNow) >= 4_000);
  await svc.control(code, { type: "cancelFinalCall" }, key);
  const huge = await svc.control(code, { type: "finalCall", durationMs: 9_000_000 }, key);
  assert.ok(Date.parse(huge.round!.endsAt!) - Date.parse(huge.round!.serverNow) <= 120_000);
});

test("an expired final call settles the round on the next read — no timer, restart-safe", async () => {
  const { svc, code, key, seats } = await inPlay(["A"]);
  await svc.submitAction(seats[0]!.deviceToken!, { type: "setPrice", price: 40 });
  await svc.control(code, { type: "finalCall", durationMs: 5_000 }, key);
  const before = await svc.teacherView(code, key);
  assert.equal((before.view as { nightNumber: number }).nightNumber, 1, "nothing settles while the window is open");

  // Reach past the clock rather than waiting on it: the deadline is persisted
  // state, and the sweep is what makes it real on whichever surface reads first.
  const repo = (svc as unknown as { repo: SnapshotRepository }).repo;
  const row = (await repo.getSessionByCode(code))!;
  await repo.updateSession(row.id, { round: { ...row.round!, finalCallEndsAt: new Date(Date.now() - 1).toISOString() } }, row.version);

  const after = await svc.teacherView(code, key);
  assert.equal(after.round?.status, "CLOSED");
  assert.equal(after.round?.closedBy, "final_call_expired");
  assert.equal((after.view as { nightNumber: number }).nightNumber, 2, "the expired window must SETTLE the night, not merely stop accepting");
});

test("CLOSE NOW settles immediately, from OPEN or from a running final call", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  const closed = await svc.control(code, { type: "closeNow" }, key);
  assert.equal(closed.round?.closedBy, "close_now");
  assert.equal((closed.view as { nightNumber: number }).nightNumber, 2);

  await svc.control(code, { type: "finalCall", durationMs: 60_000 }, key);
  const cut = await svc.control(code, { type: "closeNow" }, key);
  assert.equal(cut.round?.closedBy, "close_now");
  assert.equal((cut.view as { nightNumber: number }).nightNumber, 3, "close now must cut a running final call short, not queue behind it");
});

test("cancelling a final call returns the room to OPEN and settles nothing", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  const cancelled = await svc.control(code, { type: "cancelFinalCall" }, key);
  assert.equal(cancelled.round?.status, "OPEN");
  assert.equal(cancelled.round?.endsAt, null);
  assert.equal((cancelled.view as { nightNumber: number }).nightNumber, 1, "a cancelled final call must not have settled the night");
  await expectRejected(svc.control(code, { type: "cancelFinalCall" }, key), "no_final_call");
});

async function expectRejected(promise: Promise<unknown>, code: string): Promise<void> {
  const err = await caught(promise);
  assert.equal(err.code, code);
}

test("an abandoned final call cannot arm itself against the NEXT round", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 60_000 }, key);
  // The teacher rings the bell by hand instead, moving the lesson to night 2.
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const next = await svc.teacherView(code, key);
  assert.equal(next.round?.status, "OPEN", "the record must re-key to the new night, not keep counting down on it");
  assert.equal(next.round?.endsAt, null);
});

test("the clock's close and the teacher's bell settle to the SAME economics", async () => {
  // One fallback per lesson, on every path. If these two diverge, the lesson
  // teaches a different thing depending on which control the teacher pressed.
  const byBell = await inPlay(["A", "B"]);
  await byBell.svc.submitAction(byBell.seats[0]!.deviceToken!, { type: "setPrice", price: 56 });
  const bell = await byBell.svc.control(byBell.code, { type: "hook", hook: "closeNight" }, byBell.key);

  const byClock = await inPlay(["A", "B"]);
  await byClock.svc.submitAction(byClock.seats[0]!.deviceToken!, { type: "setPrice", price: 56 });
  const cut = await byClock.svc.control(byClock.code, { type: "closeNow" }, byClock.key);

  // Seat ids are per-session UUIDs; everything else about the two settlements
  // must be identical, down to the cent.
  const settlement = (v: unknown) =>
    (v as { desks: Record<string, unknown>[] }).desks.map(({ seatId: _seatId, ...rest }) => rest);
  assert.deepEqual(
    settlement(cut.view),
    settlement(bell.view),
    "an unlocked dial must settle identically whether the teacher rang the bell or the clock ran out",
  );
});

/* ------------------------------------- who is unresolved, and what happens -- */

test("/teach is told who has committed nothing and exactly what closing does to them", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B", "C"]);
  await svc.submitAction(seats[0]!.deviceToken!, { type: "lock" });
  const view = await svc.teacherView(code, key);
  assert.ok(view.timeCut, "the close controls must never be offered without the panel that says who they close on");
  assert.equal(view.timeCut!.resolvedCount, 1);
  assert.equal(view.timeCut!.unresolved.length, 2);
  for (const seat of view.timeCut!.unresolved) {
    assert.ok(seat.label.length > 0, "an unresolved desk must be named the way the teacher sees it on the roster");
    assert.match(seat.fallback, /season plan/, "the fallback must be stated in the lesson's own terms, not a generic one");
  }
  assert.ok(view.timeCut!.policy.length > 20, "the lesson states its own policy in one sentence");
});

test("a desk's own screen and its teacher's panel cannot disagree about whether it has committed", async () => {
  const { svc, code, key, seats } = await inPlay(["A", "B"]);
  await svc.submitAction(seats[0]!.deviceToken!, { type: "lock" });
  const teacher = await svc.teacherView(code, key);
  const unresolvedIds = new Set(teacher.timeCut!.unresolved.map((u) => u.seatId));

  const committed = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(committed.committed, true);
  assert.equal(committed.fallback, null);
  assert.ok(!unresolvedIds.has(committed.seat.id));

  const undecided = await svc.resumeByToken(seats[1]!.deviceToken!);
  assert.equal(undecided.committed, false);
  assert.ok(undecided.fallback && undecided.fallback.length > 0, "a desk warned it has not locked must be told what that costs it");
  assert.ok(unresolvedIds.has(undecided.seat.id));
  assert.equal(
    undecided.fallback,
    teacher.timeCut!.unresolved.find((u) => u.seatId === undecided.seat.id)!.fallback,
    "one contract, two audiences — the pair and the teacher read the same sentence",
  );
});

test("outside an open round there is nothing to close and nothing to warn about", async () => {
  const svc = service();
  const created = await svc.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const seat = await svc.join(code, "A");
  const lobby = await svc.teacherView(code, key);
  assert.equal(lobby.round, null);
  assert.equal(lobby.timeCut, null);
  assert.equal((await svc.resumeByToken(seat.deviceToken!)).committed, null);
  await expectRejected(svc.control(code, { type: "finalCall" }, key), "no_open_round");
  await expectRejected(svc.control(code, { type: "closeNow" }, key), "no_open_round");
});

/* --------------------------------------------------------------- recovery -- */

test("restore puts the round lifecycle back too, not only the lesson state", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 60_000 }, key);
  const closed = await svc.control(code, { type: "closeNow" }, key);
  assert.equal((closed.view as { nightNumber: number }).nightNumber, 2);

  const restored = await svc.control(code, { type: "restore" }, key);
  assert.equal((restored.view as { nightNumber: number }).nightNumber, 1, "the night the teacher cut by mistake must come back");
  assert.equal(restored.round?.status, "FINAL_CALL", "and it must come back mid-final-call, where it actually was");
});

test("every checkpoint says in words what pressing Restore would undo", async () => {
  const { svc, code, key } = await inPlay(["A"]);
  await svc.control(code, { type: "finalCall", durationMs: 20_000 }, key);
  const after = await svc.teacherView(code, key);
  assert.ok(after.session.hasCheckpoint);
  assert.ok(
    after.session.checkpointLabel && after.session.checkpointLabel.length > 0,
    "undo with no idea what it undoes is not a recovery mechanism",
  );
});


/* ------------------------------------------------- crossing the time cut -- */

test("a decision that crossed the cut is refused in the lesson's own words, not applied to the next round", async () => {
  // Without this the action is not LOST, which reads like a pass — it is
  // SUBSTITUTED: a lock placed on a night whose card the pair never saw,
  // indistinguishable to them from the decision they meant to make.
  const { svc, code, key, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  const before = await svc.resumeByToken(token);
  const wasLookingAt = before.round!.key;

  await svc.control(code, { type: "closeNow" }, key); // night 1 settles, night 2 opens
  const err = await caught(svc.submitAction(token, { type: "lock", id: "crossed", round: wasLookingAt }));
  assert.equal(err.status, 409);
  assert.equal(err.code, "stale_round");
  assert.equal(err.retryable, false, "resending it would only apply it to the wrong night faster");
  assert.match(err.message, /night/, "the refusal must be in the lesson's noun, not the runtime's");

  const after = await svc.resumeByToken(token);
  assert.equal(after.committed, false, "the crossed lock must NOT have been applied to the new night");
});

test("an action stamped with the round now open is applied normally", async () => {
  const { svc, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  const now = (await svc.resumeByToken(token)).round!.key;
  const ok = await svc.submitAction(token, { type: "lock", id: "current", round: now });
  assert.equal(ok.disposition, "applied");
});

test("an unstamped action is still accepted — an out-of-step client is not locked out of the lesson", async () => {
  const { svc, seats } = await inPlay(["A"]);
  const ok = await svc.submitAction(seats[0]!.deviceToken!, { type: "lock", id: "unstamped" });
  assert.equal(ok.disposition, "applied");
});

test("a held action that crosses the cut while it is held is refused, not applied to the wrong round", async () => {
  // The full sequence the outbox creates: paused (held, retryable), then the
  // teacher closes the night before unpausing. The retry must not land.
  const { svc, code, key, seats } = await inPlay(["A"]);
  const token = seats[0]!.deviceToken!;
  const roundKey = (await svc.resumeByToken(token)).round!.key;
  await svc.control(code, { type: "pause" }, key);
  const held = await caught(svc.submitAction(token, { type: "lock", id: "held-1", round: roundKey }));
  assert.equal(held.retryable, true);
  await svc.control(code, { type: "closeNow" }, key);
  await svc.control(code, { type: "unpause" }, key);
  const retry = await caught(svc.submitAction(token, { type: "lock", id: "held-1", round: roundKey }));
  assert.equal(retry.code, "stale_round");
});
