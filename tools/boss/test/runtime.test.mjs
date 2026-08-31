// Ported unchanged from bow-decision-challenges tools/boss/test/runtime.test.mjs @ 9313c91.
import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { test } from "node:test";

import { bossPaths } from "../lib/core.mjs";
import { appendRunEvent, loadRun, projectionFresh, readRunEvents } from "../lib/events.mjs";
import { createRun, makeRepo } from "./helpers.mjs";

test("event replay is deterministic and the materialized projection is fresh", () => {
  const root = makeRepo();
  createRun(root);
  const first = loadRun(root, "synthetic-run").state;
  const second = loadRun(root, "synthetic-run").state;
  assert.deepEqual(second, first);
  assert.equal(projectionFresh(root, "synthetic-run").fresh, true);
  assert.equal(first.eventCount, 1);
  assert.match(first.eventHead, /^[a-f0-9]{64}$/);
});

test("tampering with an event breaks the hash chain", () => {
  const root = makeRepo();
  createRun(root);
  const paths = bossPaths(root, "synthetic-run");
  const event = JSON.parse(readFileSync(paths.events, "utf8").trim());
  event.data.intent = "tampered intent";
  writeFileSync(paths.events, `${JSON.stringify(event)}\n`);
  assert.throws(() => readRunEvents(root, "synthetic-run"), (error) => error.code === "EVENT_HASH_MISMATCH");
});

test("resume ignores and safely archives an interrupted final event line", () => {
  const root = makeRepo();
  createRun(root);
  const paths = bossPaths(root, "synthetic-run");
  appendFileSync(paths.events, '{"schemaVersion":1,"sequence":2');
  const interrupted = loadRun(root, "synthetic-run");
  assert.equal(interrupted.state.eventCount, 1);
  assert.equal(interrupted.state.warnings.length, 1);

  appendRunEvent(root, "synthetic-run", "MetricRecorded", { metric: "toolCalls", value: 1 }, "lead-a", "lead-integrator");
  const resumed = loadRun(root, "synthetic-run");
  assert.equal(resumed.state.eventCount, 2);
  assert.equal(resumed.state.metrics.toolCalls, 1);
});

test("stale state projection is detected against the event head", () => {
  const root = makeRepo();
  createRun(root);
  const paths = bossPaths(root, "synthetic-run");
  const state = JSON.parse(readFileSync(paths.state, "utf8"));
  state.eventHead = "0".repeat(64);
  writeFileSync(paths.state, `${JSON.stringify(state)}\n`);
  const freshness = projectionFresh(root, "synthetic-run");
  assert.equal(freshness.fresh, false);
  assert.match(freshness.reason, /event head/);
});

test("founder override persists without deleting the Boss recommendation", () => {
  const root = makeRepo();
  createRun(root);
  appendRunEvent(root, "synthetic-run", "FounderOverrideRecorded", {
    wave: 1,
    subject: "ship timing",
    bossRecommendation: "REPAIR",
    decision: "show the build in a controlled review",
    founderReason: "time-bound learning opportunity",
    riskAccepted: "known visual defect",
    reviewTrigger: "after review",
  }, "founder-a", "founder");
  const state = loadRun(root, "synthetic-run").state;
  assert.equal(state.overrides[0].bossRecommendation, "REPAIR");
  assert.equal(state.overrides[0].decision, "show the build in a controlled review");
});
