/**
 * THE GRADE-BAND SEAM — three attachment points, and the one D38 did not name.
 *
 * D38 refused to build this seam while no second band existed to switch on,
 * and named the two places a future band would attach: `createSession` input
 * carried onto the session row, and the `initialState` context. That refusal
 * was right. The naming was one short.
 *
 * The third is the cross-lesson SEED ENVELOPE. Without a band stamped on it, a
 * 7-8 room seeded from a 5-6 room accepts the carry in silence — the receiving
 * module sees a well-formed envelope from the right module id and has every
 * reason to trust it, and nothing in the runtime is able to notice. That is a
 * class playing a lesson built on another class's franchise, and the first
 * person to find out would be the teacher, live.
 *
 * These tests pin all three, plus the two things that must NOT be true: a band
 * cannot change after creation, and a room written before bands existed must
 * still open.
 */
import assert from "node:assert/strict";
import test from "node:test";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";
import { SessionBus } from "../server/sessionBus.js";
import { GRADE_BANDS, bandOrDefault, isGradeBand, profileFor } from "../shared/gradeBand.js";
import type { GradeBand } from "../shared/gradeBand.js";
import type { LessonModule } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

type BandState = { band: GradeBand; seed: unknown };

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "PLAY", "COMPLETE"];

const bandProbe: LessonModule<BandState> = {
  id: "band-probe",
  title: "Band probe",
  phases: PHASES,
  initialState: (input) => ({ band: input.gradeBand, seed: input.seed ?? null }),
  reduce: (state) => ({ ok: true, state }),
  allowedActions: () => [],
  studentView: (state) => ({ band: state.band }),
  teacherView: (state) => ({ ...state }),
  boardView: () => ({}),
  aggregate: () => ({}),
};

async function harness() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "bow-band-"));
  const file = path.join(dir, "snap.json");
  const bus = new SessionBus();
  const repo = new SnapshotRepository(file, { bus });
  await repo.whenReady();
  const service = new SessionService(repo);
  service.registerModule(bandProbe);
  return { service, repo, file, dir, cleanup: () => fsp.rm(dir, { recursive: true, force: true }) };
}

test("both bands exist, and an unrecognised value becomes the default rather than an error", () => {
  assert.deepEqual([...GRADE_BANDS], ["5-6", "7-8"]);
  assert.ok(isGradeBand("5-6") && isGradeBand("7-8"));
  assert.ok(!isGradeBand("9-10") && !isGradeBand("") && !isGradeBand(undefined));
  // A teacher three minutes before a lesson must not be able to fail to create
  // a room by mistyping.
  assert.equal(bandOrDefault("9-10"), "5-6");
  assert.equal(bandOrDefault(undefined), "5-6");
  assert.equal(bandOrDefault("7-8"), "7-8");
});

test("POINT 1 — the band travels from createSession onto the session row and the console", async () => {
  const h = await harness();
  try {
    for (const band of GRADE_BANDS) {
      const created = await h.service.createSession({ lessonModuleId: "band-probe", title: band, gradeBand: band });
      assert.equal(created.session.gradeBand, band, "the console must be able to show which class this room is for");
      const row = (await h.repo.getSessionById(created.session.id))!;
      assert.equal(row.gradeBand, band);
    }
  } finally {
    await h.cleanup();
  }
});

test("POINT 2 — the band reaches the module's initialState", async () => {
  const h = await harness();
  try {
    for (const band of GRADE_BANDS) {
      const created = await h.service.createSession({ lessonModuleId: "band-probe", title: "t", gradeBand: band });
      const state = (await h.repo.getSessionById(created.session.id))!.state as BandState;
      assert.equal(state.band, band, "a dual-band module has to know at creation; it is fixed for the life of the room");
    }
  } finally {
    await h.cleanup();
  }
});

test("POINT 3 — the seed envelope stamps the SOURCE room's band, so a cross-band carry is detectable", async () => {
  const h = await harness();
  try {
    const first = await h.service.createSession({ lessonModuleId: "band-probe", title: "L1 5-6", gradeBand: "5-6" });
    const key = first.teacherKey!;

    const sameBand = await h.service.createSession({
      lessonModuleId: "band-probe",
      title: "L2 5-6",
      gradeBand: "5-6",
      sourceSessionId: first.session.id,
      teacherKey: key,
    });
    const sameSeed = ((await h.repo.getSessionById(sameBand.session.id))!.state as BandState).seed as Record<string, unknown>;
    assert.equal(sameSeed["sourceGradeBand"], "5-6");

    // The dangerous one: a 7-8 room pulling a 5-6 room's franchises forward.
    const crossBand = await h.service.createSession({
      lessonModuleId: "band-probe",
      title: "L2 7-8 from a 5-6 room",
      gradeBand: "7-8",
      sourceSessionId: first.session.id,
      teacherKey: key,
    });
    const crossState = (await h.repo.getSessionById(crossBand.session.id))!.state as BandState;
    assert.equal(crossState.band, "7-8", "the new room is a 7-8 room");
    const crossSeed = crossState.seed as Record<string, unknown>;
    assert.equal(
      crossSeed["sourceGradeBand"],
      "5-6",
      "the module must be ABLE to see that the books it is inheriting came from the other class",
    );
    assert.notEqual(
      crossSeed["sourceGradeBand"],
      crossState.band,
      "and the mismatch must be visible by comparison, not by inference",
    );
  } finally {
    await h.cleanup();
  }
});

test("the runtime does not JUDGE a cross-band carry — that call belongs to the module", async () => {
  // Deliberate. Only the module knows whether its own state means the same
  // thing in both bands; the runtime owes the fact, not the ruling. What would
  // be wrong is the runtime silently allowing it with no fact attached, which
  // is what it did before.
  const h = await harness();
  try {
    const first = await h.service.createSession({ lessonModuleId: "band-probe", title: "a", gradeBand: "5-6" });
    const second = await h.service.createSession({
      lessonModuleId: "band-probe",
      title: "b",
      gradeBand: "7-8",
      sourceSessionId: first.session.id,
      teacherKey: first.teacherKey!,
    });
    assert.ok(second.session.id, "creation succeeds; the module decides what to do with the mismatch");
  } finally {
    await h.cleanup();
  }
});

test("a band is fixed at creation and cannot be patched afterwards", async () => {
  const h = await harness();
  try {
    const created = await h.service.createSession({ lessonModuleId: "band-probe", title: "t", gradeBand: "5-6" });
    const row = (await h.repo.getSessionById(created.session.id))!;
    // SessionPatch structurally omits gradeBand. This asserts the runtime
    // behaviour rather than the type: a patch carrying it changes nothing.
    await h.repo.updateSession(row.id, { gradeBand: "7-8" } as never, row.version);
    const after = (await h.repo.getSessionById(created.session.id))!;
    assert.equal(after.gradeBand, "5-6", "a room does not change class mid-lesson");
  } finally {
    await h.cleanup();
  }
});

test("a room written before bands existed still opens, as the band that existed then", async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "bow-band-old-"));
  const file = path.join(dir, "snap.json");
  try {
    // A snapshot from a build with no `gradeBand` anywhere in it.
    await fsp.writeFile(
      file,
      JSON.stringify({
        version: 1,
        sessions: [
          {
            id: "s1",
            code: "OLDROOM",
            title: "a room from before",
            lessonModuleId: "band-probe",
            phase: "PLAY",
            paused: false,
            frozen: false,
            ended: false,
            state: { band: "5-6", seed: null },
            version: 4,
            checkpoint: null,
            teacherKeyHash: "x",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        seats: [],
      }),
    );
    const repo = new SnapshotRepository(file, { bus: new SessionBus() });
    await repo.whenReady();
    const row = await repo.getSessionByCode("OLDROOM");
    assert.ok(row, "the upgrade must not be a way to lose a room that may be mid-period");
    assert.equal(row!.gradeBand, "5-6");
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test("the two profiles differ on the things the evidence says they must, and agree on the rest", () => {
  const young = profileFor("5-6");
  const older = profileFor("7-8");

  // The highest-stakes switch in the file: the productive-failure moderator
  // splits at exactly this boundary (g = +0.50 at grades 6-10, g = -0.09 at
  // grades 2-5), so the younger band's exploration is scaffolded and the older
  // band's is not.
  assert.equal(young.scaffoldFirstRound, true);
  assert.equal(older.scaffoldFirstRound, false);

  // The hard maths gate. Grade 5 has no percent, ratio or negative-number
  // standard, so neither may be rendered.
  assert.equal(young.allowsPercentages, false);
  assert.equal(young.allowsNegatives, false);
  assert.equal(older.allowsPercentages, true);

  // Reading and load budgets, from the fluency norms and the multivariable
  // reasoning evidence.
  assert.ok(young.maxBlockingWords < older.maxBlockingWords);
  assert.ok(young.maxVariables < older.maxVariables);
  assert.ok(older.maxVariables <= 4, "four is the ceiling at BOTH bands, not a target");

  // The CCSS opinion-to-argument shift lands exactly on this boundary.
  assert.equal(young.argumentMoves, 2);
  assert.equal(older.argumentMoves, 3);

  // The product does the counterfactual for the younger band and withholds it
  // from the older one.
  assert.equal(young.showsCounterfactual, true);
  assert.equal(older.showsCounterfactual, false);

  // And a debrief that ends in "everyone was right" is the failure mode at
  // 5-6, while a defensible disagreement is legitimate at 7-8.
  assert.equal(young.debriefMustConverge, true);
  assert.equal(older.debriefMustConverge, false);
});

test("a profile is a set of switches, not a set of strings — nothing here is copy", () => {
  for (const band of GRADE_BANDS) {
    for (const [key, value] of Object.entries(profileFor(band))) {
      if (key === "band") continue;
      assert.ok(
        typeof value === "boolean" || typeof value === "number",
        `${band}.${key} is a ${typeof value}; a profile that carries prose is a content fork wearing a config file`,
      );
    }
  }
});
