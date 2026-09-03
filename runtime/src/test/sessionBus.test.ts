/**
 * The change bus, and the one property that makes the push transport safe:
 * a nudge carries no state, so losing one, duplicating one, or never having a
 * bus at all can only ever cost latency.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionBus } from "../server/sessionBus.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";
import { fullHouseModule } from "../modules/fullHouse.js";
import { SessionService } from "../server/sessionService.js";

test("a subscriber is nudged on every session write, with the new version", async () => {
  const bus = new SessionBus();
  const repo = new SnapshotRepository(null, { bus });
  const service = new SessionService(repo);
  service.registerModule(fullHouseModule);

  const created = await service.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const session = (await repo.getSessionByCode(created.session.code))!;

  const seen: number[] = [];
  const off = bus.subscribe(session.id, (n) => seen.push(n.version));
  await service.control(created.session.code, { type: "advance" }, created.teacherKey!);
  assert.deepEqual(seen, [session.version + 1]);
  off();
  await service.control(created.session.code, { type: "advance" }, created.teacherKey!);
  assert.equal(seen.length, 1, "unsubscribing must actually stop the nudges");
});

test("a seat joining nudges the room even though it moves no session state", async () => {
  // The teacher's live join list is built out of exactly this, and a join does
  // not bump session.version — so without its own nudge a new arrival would sit
  // invisible until the next slow reconciliation tick.
  const bus = new SessionBus();
  const repo = new SnapshotRepository(null, { bus });
  const service = new SessionService(repo);
  service.registerModule(fullHouseModule);
  const created = await service.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const session = (await repo.getSessionByCode(created.session.code))!;

  const epochs: number[] = [];
  bus.subscribe(session.id, (n) => epochs.push(n.seatEpoch));
  await service.join(created.session.code, "Pair One");
  assert.ok(epochs.length >= 1, "a join must nudge the room");
  assert.ok(epochs.at(-1)! > 0, "the seat epoch must move so the nudge is distinguishable from the last one");
});

test("nudges are scoped to one session — a busy room never wakes the room next door", async () => {
  const bus = new SessionBus();
  const repo = new SnapshotRepository(null, { bus });
  const service = new SessionService(repo);
  service.registerModule(fullHouseModule);
  const a = await service.createSession({ lessonModuleId: fullHouseModule.id, title: "A" });
  const b = await service.createSession({ lessonModuleId: fullHouseModule.id, title: "B" });
  const bId = (await repo.getSessionByCode(b.session.code))!.id;

  let woke = 0;
  bus.subscribe(bId, () => { woke += 1; });
  await service.control(a.session.code, { type: "advance" }, a.teacherKey!);
  assert.equal(woke, 0);
});

test("a listener that throws is dropped without silencing the rest of the room", () => {
  const bus = new SessionBus();
  let good = 0;
  bus.subscribe("s", () => { throw new Error("this connection is gone"); });
  bus.subscribe("s", () => { good += 1; });
  bus.publish("s", 2);
  bus.publish("s", 3);
  assert.equal(good, 2, "one dead connection must not stop the projector being told");
  assert.equal(bus.listenerCount("s"), 1, "the dead listener must be dropped, not retried forever");
});

test("the listener count is bounded, and refusing a subscription is safe", () => {
  // Refusing means that surface polls instead, which is the designed fallback.
  // Accepting without limit means a reconnect loop can pin the process.
  const bus = new SessionBus();
  const offs = [];
  for (let i = 0; i < 400; i += 1) offs.push(bus.subscribe("s", () => {}));
  assert.ok(bus.listenerCount("s") <= 200, `bus accepted ${bus.listenerCount("s")} listeners`);
  for (const off of offs) off();
  assert.equal(bus.listenerCount("s"), 0);
});

test("a repository with no bus behaves exactly as before — push is additive", async () => {
  const repo = new SnapshotRepository(null);
  const service = new SessionService(repo);
  service.registerModule(fullHouseModule);
  const created = await service.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const after = await service.control(created.session.code, { type: "advance" }, created.teacherKey!);
  assert.equal(after.session.phase, "HOOK");
});
