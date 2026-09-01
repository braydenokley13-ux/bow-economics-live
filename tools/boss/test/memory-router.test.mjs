// Ported unchanged from bow-decision-challenges tools/boss/test/memory-router.test.mjs @ 9313c91.
import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { bossPaths } from "../lib/core.mjs";
import { rankExperiments } from "../lib/experiments.mjs";
import { addLesson, addPrecedent, promoteLesson, retrievePrecedents } from "../lib/memory.mjs";
import { recommendModel } from "../lib/router.mjs";
import { makeRepo } from "./helpers.mjs";

test("lesson cannot claim repeated evidence from one run", () => {
  const root = makeRepo();
  const index = bossPaths(root).lessons;
  addLesson(index, {
    id: "lesson-a",
    statement: "A synthetic observation should not become permanent truth after one run.",
    scope: ["harness"],
    confidence: 0.5,
    sourceRuns: ["run-a"],
    evidence: ["run-a:evidence-a"],
    counterexamples: [],
    reviewAt: "2099-01-01T00:00:00.000Z",
  });
  promoteLesson(index, "lesson-a", "provisional", { reason: "worth checking again" });
  assert.throws(() => promoteLesson(index, "lesson-a", "repeated-evidence", {
    sourceRuns: ["run-a"],
    evidence: ["run-a:evidence-b"],
  }), (error) => error.code === "LESSON_EVIDENCE_INSUFFICIENT");
});

test("permanent lesson promotion requires founder approval", () => {
  const root = makeRepo();
  const index = bossPaths(root).lessons;
  addLesson(index, {
    id: "lesson-a",
    statement: "Repeated synthetic evidence still needs founder approval before becoming constitutional.",
    scope: ["harness"],
    confidence: 0.8,
    sourceRuns: ["run-a", "run-b"],
    evidence: ["a", "b"],
    counterexamples: [],
    reviewAt: "2099-01-01T00:00:00.000Z",
  });
  promoteLesson(index, "lesson-a", "provisional", { reason: "provisional" });
  promoteLesson(index, "lesson-a", "repeated-evidence", { sourceRuns: ["run-b"], evidence: ["b"] });
  promoteLesson(index, "lesson-a", "candidate-precedent", { reason: "candidate" });
  assert.throws(() => promoteLesson(index, "lesson-a", "founder-approved-rule", { reason: "missing founder" }), (error) => error.code === "FOUNDER_APPROVAL_REQUIRED");
});

test("stale precedent is surfaced but not applicable", () => {
  const root = makeRepo();
  const index = bossPaths(root).precedents;
  addPrecedent(index, {
    id: "precedent-a",
    issue: "How a synthetic state boundary should be chosen.",
    decision: "Use the narrower synthetic boundary.",
    context: "The original decision had one writer and no migration requirement.",
    alternatives: ["shared global state"],
    evidence: ["run-a:evidence"],
    dissent: [],
    outcome: "The narrow boundary remained stable.",
    scope: ["state"],
    confidence: 0.7,
    reviewTrigger: "multiple writers",
    reviewAt: "2020-01-01T00:00:00.000Z",
  });
  const results = retrievePrecedents(index, ["state"], new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(results[0].stale, true);
  assert.equal(results[0].applicable, false);
});

test("router rejects unsupported cost and context constraints", () => {
  const root = makeRepo();
  assert.throws(() => recommendModel(root, {
    complexity: 5,
    ambiguity: 5,
    coding: 5,
    longHorizon: 5,
    visual: 5,
    speed: 1,
    risk: 5,
    maxRelativeCost: 1,
    minContextTokens: 900000,
  }), (error) => error.code === "NO_MODEL_ROUTE");
});

test("build-to-learn favors a cheap reversible information-gain experiment", () => {
  const result = rankExperiments({
    developmentIntent: "build-to-learn",
    candidates: [
      { name: "small playable probe", evidenceGap: "whether the gesture is understandable", informationGain: 5, productValue: 3, cost: 1, risk: 1, reversibility: 5, dependencyUnlock: 4 },
      { name: "full production build", evidenceGap: "whether the gesture is understandable", informationGain: 4, productValue: 5, cost: 5, risk: 4, reversibility: 1, dependencyUnlock: 3 },
    ],
  });
  assert.equal(result.recommendation, "small playable probe");
  assert.match(result.note, /ordinal/);
});

test("router routes the Boss lead to claude-fable-5-1 and never to a superseded id", () => {
  const root = makeRepo();
  const lead = recommendModel(root, { complexity: 5, ambiguity: 5, coding: 3, longHorizon: 5, visual: 5, speed: 0, risk: 5 });
  assert.equal(lead.model, "claude-fable-5-1");
  const everyRoute = [lead, recommendModel(root, { speed: 5, coding: 2, risk: 0 }), recommendModel(root, { visual: 5, coding: 4, risk: 3, maxRelativeCost: 3 })];
  for (const route of everyRoute) {
    assert.notEqual(route.model, "claude-fable-5", "a superseded id must never be recommended");
    for (const alternative of route.alternatives) assert.notEqual(alternative.model, "claude-fable-5");
  }
});
