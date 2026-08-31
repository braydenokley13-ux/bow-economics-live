// Ported from bow-decision-challenges tools/boss/test/gates.test.mjs @ 9313c91.
// Economics changes: product-coupled evals now exercise the Economics constitution
// (economic-truth, teacher-transfer/classroom activation, config-driven ceremony roles).
import assert from "node:assert/strict";
import { test } from "node:test";

import { activationPlan } from "../lib/activation.mjs";
import { appendRunEvent, loadRun } from "../lib/events.mjs";
import { assertVerdictAllowed, evaluateGate } from "../lib/gates.mjs";
import { validateRoleCompletion } from "../lib/operations.mjs";
import { activate, complete, contract, createRun, makeRepo } from "./helpers.mjs";

test("Prototype Level 0 cannot create a Boss activation plan", () => {
  const root = makeRepo();
  assert.throws(() => activationPlan(root, 0, ["student"]), (error) => error.code === "PROTOTYPE_ONLY");
});

test("a builder cannot certify the same wave as independent Analyst", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["architecture"] });
  complete(root, "synthetic-run", activate(root, "synthetic-run", "builder", "same-actor"), "builder", "same-actor");
  complete(root, "synthetic-run", activate(root, "synthetic-run", "product-analyst", "same-actor"), "product-analyst", "same-actor");
  const gate = evaluateGate(root, loadRun(root, "synthetic-run").state);
  const independence = gate.checks.find((item) => item.id === "role-independence");
  assert.equal(independence.passed, false);
  assert.match(independence.message, /self-certification/);
});

test("required economic-truth critic cannot be omitted", () => {
  const root = makeRepo();
  createRun(root, { level: 1, scopes: ["demand"] });
  const gate = evaluateGate(root, loadRun(root, "synthetic-run").state);
  assert.equal(gate.checks.find((item) => item.id === "blocking-role:economic-truth-critic").passed, false);
});

test("teach scope deterministically requires transfer and classroom critics", () => {
  const root = makeRepo();
  const state = createRun(root, { level: 2, scopes: ["teach"] });
  assert.ok(state.waves["1"].activation.roles.includes("teacher-transfer-critic"));
  assert.ok(state.waves["1"].activation.roles.includes("classroom-projector-critic"));
  const gate = evaluateGate(root, state);
  assert.equal(gate.checks.find((item) => item.id === "blocking-role:teacher-transfer-critic").passed, false);
});

test("PASS cannot bypass an ineligible or absent gate", () => {
  const root = makeRepo();
  const state = createRun(root);
  assert.throws(() => assertVerdictAllowed(state, "PASS"), (error) => error.code === "PASS_GATE_BLOCKED");
});

test("Level 1 rejects accidental Level 4 ceremony", () => {
  const root = makeRepo();
  createRun(root, { level: 1, scopes: ["copy"] });
  const assignment = activate(root, "synthetic-run", "reliability-reviewer", "qa-a");
  complete(root, "synthetic-run", assignment, "reliability-reviewer", "qa-a");
  const gate = evaluateGate(root, loadRun(root, "synthetic-run").state);
  assert.equal(gate.checks.find((item) => item.id === "level-1-ceremony").passed, false);
});

test("repair verdict is blocked when the failure budget is exhausted", () => {
  const root = makeRepo();
  createRun(root, { contract: contract({ iterationBudget: { maximumWaves: 1, maximumRepairs: 1, softTokenBudget: 0, reason: "One repair is enough for this bounded synthetic scenario." } }) });
  appendRunEvent(root, "synthetic-run", "VerdictRecorded", { wave: 1, verdict: "REPAIR", reason: "first repair", evidenceIds: [] }, "lead-a", "lead-integrator");
  const state = loadRun(root, "synthetic-run").state;
  assert.throws(() => assertVerdictAllowed(state, "REPAIR"), (error) => error.code === "FAILURE_BUDGET_EXCEEDED");
});

test("ship gate requires rollback integrity", () => {
  const root = makeRepo();
  createRun(root, { level: 4, scopes: ["release"] });
  const gate = evaluateGate(root, loadRun(root, "synthetic-run").state, { gate: "ship" });
  assert.equal(gate.checks.find((item) => item.id === "rollback-checkpoint").passed, false);
});

test("malformed role output is rejected before an event is appended", () => {
  const root = makeRepo();
  createRun(root);
  const assignmentId = activate(root, "synthetic-run", "product-analyst", "analyst-a");
  const state = loadRun(root, "synthetic-run").state;
  assert.throws(() => validateRoleCompletion(root, state, {
    assignmentId,
    status: "completed",
    sections: { recommendation: "PASS" },
    evidenceIds: [],
  }), (error) => error.code === "MALFORMED_ROLE_OUTPUT");
});
