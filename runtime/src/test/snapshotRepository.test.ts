import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
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
        teacherKeyHash: "hash-t",
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
      teacherKeyHash: "hash-t",
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
      teacherKeyHash: "hash-t",
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

/* ------------------------------------------------------------------- R4 -- */

test("R4: a corrupted snapshot file is quarantined (renamed aside) and the repository still boots empty, not crashed", async () => {
  const { dir, file } = await tempFile();
  try {
    await writeFile(file, "{ this is not valid json !!!", "utf8");
    const repo = new SnapshotRepository(file);
    await repo.whenReady(); // must NOT throw — this is the whole point of the repair
    assert.deepEqual(await repo.listSessions(), [], "a corrupted file must boot to a fresh, empty store");

    // The original bad file must be moved aside, not deleted and not left in place.
    const entries = await readdir(dir);
    assert.ok(!entries.includes("snapshot.json"), "the corrupted file should no longer sit at the real path");
    const quarantined = entries.filter((f) => f.includes(".corrupt-"));
    assert.equal(quarantined.length, 1, "exactly one quarantined copy should exist");
    const quarantinedContent = await readFile(path.join(dir, quarantined[0]!), "utf8");
    assert.equal(quarantinedContent, "{ this is not valid json !!!", "the quarantined file preserves the original bad bytes");

    // The repository is still fully usable after a corruption — a fresh session can be created and persisted.
    await repo.createSession({
      code: "BOWNEW",
      title: "post-corruption",
      lessonModuleId: "lobby-demo",
      phase: "LOBBY",
      state: {},
      teacherKeyHash: "hash-t",
    });
    await repo.flushToDisk();
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.sessions.length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("R4: a genuine filesystem read error (not ENOENT, not a parse failure) still propagates", async () => {
  const { dir } = await tempFile();
  try {
    // Pointing the snapshot path AT a directory (not a file) forces a real
    // fs error other than ENOENT/EISDIR-on-read, distinct from "corrupt
    // JSON" — this must still surface, not be silently swallowed as if it
    // were a parse failure.
    const repo = new SnapshotRepository(dir);
    await assert.rejects(() => repo.whenReady());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
