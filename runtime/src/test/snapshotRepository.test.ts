import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { SnapshotRepository } from "../server/snapshotRepository.js";

async function tempFile(): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "bow-runtime-test-"));
  return { dir, file: path.join(dir, "snapshot.json") };
}

test("writes are atomic: the snapshot file is always valid JSON, never a partial write", async () => {
  const { dir, file } = await tempFile();
  try {
    const repo = new SnapshotRepository(file);
    await repo.whenReady();
    for (let i = 0; i < 10; i += 1) {
      await repo.createSession({
        code: `BOW${i}`,
        title: `s${i}`,
        lessonModuleId: "lobby-demo",
        phase: "LOBBY",
        state: { picks: {} },
      });
    }
    await repo.flushToDisk();
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw); // throws if not valid JSON
    assert.equal(parsed.sessions.length, 10);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a fresh repository pointed at an existing snapshot restores full state after a simulated restart", async () => {
  const { dir, file } = await tempFile();
  try {
    const first = new SnapshotRepository(file);
    await first.whenReady();
    const session = await first.createSession({
      code: "BOWXYZ",
      title: "Restart test",
      lessonModuleId: "lobby-demo",
      phase: "PLAY",
      state: { picks: { "seat-1": "red" } },
    });
    const seat = await first.createSeat({
      sessionId: session.id,
      displayName: "Alex",
      displayNameNormalized: "alex",
      deviceTokenHash: "hash-a",
      rejoinPinHash: "hash-p",
    });
    await first.updateSession(session.id, { phase: "REVEAL" }, session.version);
    await first.flushToDisk();

    // Simulate a process restart: a brand new repository instance, same file.
    const second = new SnapshotRepository(file);
    await second.whenReady();
    const restoredSession = await second.getSessionByCode("BOWXYZ");
    const restoredSeat = await second.getSeatById(seat.id);

    assert.ok(restoredSession);
    assert.equal(restoredSession?.phase, "REVEAL");
    assert.equal(restoredSession?.version, 2);
    assert.ok(restoredSeat);
    assert.equal(restoredSeat?.displayName, "Alex");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a repository with no snapshot file yet starts empty rather than throwing", async () => {
  const { dir, file } = await tempFile();
  try {
    const repo = new SnapshotRepository(path.join(dir, "does-not-exist.json"));
    await repo.whenReady();
    assert.deepEqual(await repo.listSessions(), []);
    void file;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("updateSession enforces optimistic concurrency via expectedVersion", async () => {
  const { dir, file } = await tempFile();
  try {
    const repo = new SnapshotRepository(file);
    await repo.whenReady();
    const session = await repo.createSession({
      code: "BOWCC1",
      title: "conflict test",
      lessonModuleId: "lobby-demo",
      phase: "LOBBY",
      state: {},
    });
    const stale = await repo.updateSession(session.id, { phase: "PLAY" }, 999);
    assert.equal(stale.ok, false);
    if (!stale.ok) assert.equal(stale.conflict, true);

    const fresh = await repo.updateSession(session.id, { phase: "PLAY" }, session.version);
    assert.equal(fresh.ok, true);
    await repo.flushToDisk();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
