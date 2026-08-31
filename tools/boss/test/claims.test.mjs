// Ported from bow-decision-challenges tools/boss/test/claims.test.mjs @ 9313c91.
// Economics changes: the DC-specific ai-off eval is replaced by the
// sports-reality freshness and teacher-transfer screens (E3/E12 live in
// economics.test.mjs; this file keeps the inherited deterministic evals).
import assert from "node:assert/strict";
import { test } from "node:test";

import { reconcileClaimAutomatically } from "../lib/claims.mjs";
import { appendRunEvent, loadRun } from "../lib/events.mjs";
import { createRun, makeRepo, recordCommandEvidence, recordEvidence } from "./helpers.mjs";

function claim(root, kind, metadata, evidenceIds) {
  appendRunEvent(root, "synthetic-run", "ClaimRecorded", {
    id: "claim-a",
    wave: 1,
    kind,
    statement: "The synthetic implementation satisfies the exact behavior named by this claim.",
    claimant: "builder-a",
    evidenceIds,
    metadata,
  }, "builder-a", "builder");
  return loadRun(root, "synthetic-run").state;
}

test("test failure claimed as pass is contradicted by the exit code", () => {
  const root = makeRepo();
  createRun(root);
  recordCommandEvidence(root, "synthetic-run", { id: "tests", kind: "test", exitCode: 1 });
  const state = claim(root, "tests-pass", {}, ["tests"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "contradicted");
  assert.match(result.reasons.join(" "), /nonzero/);
});

test("viewport verification without the named screenshot is contradicted", () => {
  const root = makeRepo();
  createRun(root);
  recordEvidence(root, "synthetic-run", { id: "shot", kind: "screenshot", metadata: { viewport: "1366x768" } });
  const state = claim(root, "viewport-verified", { viewport: "1920x1080" }, ["shot"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "contradicted");
  assert.match(result.reasons.join(" "), /1920x1080/);
});

test("CI pass claim is contradicted by a failed CI command", () => {
  const root = makeRepo();
  createRun(root);
  recordCommandEvidence(root, "synthetic-run", { id: "ci", kind: "ci", exitCode: 2 });
  const state = claim(root, "ci-pass", {}, ["ci"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "contradicted");
});

test("e2e pass claim is confirmed only by a passing e2e command", () => {
  const root = makeRepo();
  createRun(root);
  recordCommandEvidence(root, "synthetic-run", { id: "e2e", kind: "e2e", exitCode: 0 });
  const state = claim(root, "e2e-pass", {}, ["e2e"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "confirmed");
});
