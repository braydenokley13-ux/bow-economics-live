// Ported unchanged from bow-decision-challenges tools/boss/test/coordination.test.mjs @ 9313c91.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { loadRun } from "../lib/events.mjs";
import {
  laneData,
  meetingCloseData,
  meetingOpenData,
  meetingOpinionData,
  reservationData,
} from "../lib/operations.mjs";
import { createRun, makeRepo, recordEvidence } from "./helpers.mjs";

test("a low-value meeting is rejected before spending tokens", () => {
  const root = makeRepo();
  createRun(root);
  recordEvidence(root, "synthetic-run", { id: "packet", kind: "git-diff" });
  const state = loadRun(root, "synthetic-run").state;
  assert.throws(() => meetingOpenData(root, state, {
    id: "meeting-a",
    type: "architecture-review",
    question: "Should two independent memos be enough for this reversible naming choice?",
    why: "The choice is reversible and has no evidence conflict.",
    attendees: ["architecture-critic", "engineering-reviewer"],
    evidenceIds: ["packet"],
    expectedValue: 1,
    estimatedCost: 3,
    tokenBudget: 5000,
  }), (error) => error.code === "MEETING_NOT_WARRANTED");
});

test("meeting close requires independent opinions from every attendee", () => {
  const root = makeRepo();
  createRun(root);
  recordEvidence(root, "synthetic-run", { id: "packet", kind: "git-diff" });
  const state = loadRun(root, "synthetic-run").state;
  const opened = meetingOpenData(root, state, {
    id: "meeting-a",
    type: "architecture-review",
    question: "Which irreversible data boundary should this implementation use?",
    why: "Two disciplines disagree and the migration would be costly to reverse.",
    attendees: ["architecture-critic", "security-privacy-reviewer"],
    evidenceIds: ["packet"],
    expectedValue: 4,
    estimatedCost: 2,
    tokenBudget: 12000,
  });
  state.meetings[opened.id] = { ...opened, status: "open", opinions: {} };
  const opinion = meetingOpinionData(state, {
    id: opened.id,
    attendee: "architecture-critic",
    position: "Use the narrower boundary.",
    reasoning: "It is easier to reverse and reduces shared state.",
    evidenceIds: ["packet"],
    seenOthers: false,
  });
  state.meetings[opened.id].opinions[opinion.attendee] = opinion;
  assert.throws(() => meetingCloseData(root, state, {
    id: opened.id,
    decision: { decision: "narrow", disagreementMap: [], dissent: [], actions: [], revisitEvidence: [] },
  }), (error) => error.code === "MEETING_OPINIONS_MISSING");
});

test("overlapping path ownership by different actors is rejected", () => {
  const root = makeRepo();
  const state = createRun(root);
  state.reservations.first = {
    id: "first",
    path: "runtime/src/shared",
    owner: "builder-a",
    laneId: null,
    status: "active",
  };
  assert.throws(() => reservationData(state, {
    id: "second",
    path: "runtime/src/shared/lessonModule.ts",
    owner: "builder-b",
  }), (error) => error.code === "OWNERSHIP_CONFLICT");
});

test("duplicate worktree branch ownership is rejected", () => {
  const root = makeRepo();
  const state = createRun(root);
  const lanePath = path.join(root, "lane-a");
  mkdirSync(lanePath);
  state.lanes.first = { id: "first", branch: "boss/shared", worktree: lanePath, owner: "builder-a", status: "active" };
  assert.throws(() => laneData(state, {
    id: "second",
    owner: "builder-b",
    branch: "boss/shared",
    worktree: lanePath,
    baseCommit: state.base.commit,
  }), (error) => error.code === "DUPLICATE_LANE");
});
