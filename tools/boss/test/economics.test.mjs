// Economics-specific synthetic harness evals (E1–E12 of the Boss port program).
// Each eval simulates a way the harness could be fooled in this product and
// asserts the deterministic machinery catches it.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { activationPlan } from "../lib/activation.mjs";
import { reconcileClaimAutomatically } from "../lib/claims.mjs";
import { loadConfig } from "../lib/core.mjs";
import { detectConstitutionBleed } from "../lib/doctor.mjs";
import { appendRunEvent, loadRun } from "../lib/events.mjs";
import { evaluateGate } from "../lib/gates.mjs";
import { activate, complete, createRun, makeRepo, recordEvidence } from "./helpers.mjs";

function addClaim(root, kind, metadata, evidenceIds, id = "claim-a") {
  appendRunEvent(root, "synthetic-run", "ClaimRecorded", {
    id,
    wave: 1,
    kind,
    statement: "The builder asserts the exact quality named by this claim kind.",
    claimant: "builder-a",
    evidenceIds,
    metadata,
  }, "builder-a", "builder");
  return loadRun(root, "synthetic-run").state;
}

// E1 — a Decision Challenges assessment rule must not silently become an
// Economics blocking gate.
test("E1: the shipped constitution carries no Decision Challenges assessment law", () => {
  const root = makeRepo();
  const bleed = detectConstitutionBleed(loadConfig(root));
  assert.deepEqual(bleed, []);
  const plan = activationPlan(root, 2, ["assessment", "rubric", "nysed"]);
  assert.deepEqual(plan.matchedRules, []);
  assert.deepEqual(plan.blockingRoles, []);
});

test("E1: constitution bleed is detected when DC assessment law is injected", () => {
  const root = makeRepo();
  const rulesPath = path.join(root, ".boss", "config", "activation-rules.json");
  const rules = JSON.parse(readFileSync(rulesPath, "utf8"));
  rules.rules.push({ id: "smuggled", scopes: ["rubric"], roles: ["economic-truth-critic"], evidence: [], blocking: true });
  writeFileSync(rulesPath, JSON.stringify(rules));
  const projectPath = path.join(root, ".boss", "config", "project.json");
  const project = JSON.parse(readFileSync(projectPath, "utf8"));
  project.blockingDissentCategories.push("assessment-integrity");
  writeFileSync(projectPath, JSON.stringify(project));
  const bleed = detectConstitutionBleed(loadConfig(root));
  assert.ok(bleed.includes("rubric"));
  assert.ok(bleed.includes("assessment-integrity"));
});

// E2 — a lesson touching real-world content cannot claim realism without the
// Sports Reality review actually completing.
test("E2: real-world scope requires a completed Sports Reality review", () => {
  const root = makeRepo();
  const state = createRun(root, { level: 2, scopes: ["rosters"] });
  assert.ok(state.waves["1"].activation.roles.includes("sports-reality-director"));
  assert.ok(state.waves["1"].activation.blockingRoles.includes("sports-reality-director"));
  const gate = evaluateGate(root, state);
  assert.equal(gate.checks.find((item) => item.id === "blocking-role:sports-reality-director").passed, false);
  assert.equal(gate.checks.find((item) => item.id === "evidence:sports-reality-report").passed, false);
});

// E3 — a current roster/contract/rule claim with no source date, or a stale
// one, is contradicted.
test("E3: undated real-world evidence contradicts a sports-reality-current claim", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["rosters"] });
  recordEvidence(root, "synthetic-run", { id: "facts", kind: "sports-reality-report", metadata: {} });
  const state = addClaim(root, "sports-reality-current", {}, ["facts"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "contradicted");
  assert.match(result.reasons.join(" "), /verifiedAsOf/);
});

test("E3: stale real-world evidence contradicts; fresh evidence still needs judgment", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["rosters"] });
  recordEvidence(root, "synthetic-run", { id: "stale", kind: "sports-reality-report", metadata: { verifiedAsOf: "2020-01-01" } });
  const staleState = addClaim(root, "sports-reality-current", {}, ["stale"], "claim-stale");
  const stale = reconcileClaimAutomatically(root, staleState, "claim-stale");
  assert.equal(stale.status, "contradicted");
  assert.match(stale.reasons.join(" "), /older than/);

  recordEvidence(root, "synthetic-run", { id: "fresh", kind: "sports-reality-report", metadata: { verifiedAsOf: new Date().toISOString().slice(0, 10) } });
  const freshState = addClaim(root, "sports-reality-current", {}, ["fresh"], "claim-fresh");
  const fresh = reconcileClaimAutomatically(root, freshState, "claim-fresh");
  assert.equal(fresh.status, "not-confirmed");
  assert.equal(fresh.deterministic, false);
});

// E4 — "Gameplay is STRONG" from the builder cannot pass without independent
// playability judgment.
test("E4: a builder gameplay-strong claim stays unconfirmed and fails the gate", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["gameplay"] });
  recordEvidence(root, "synthetic-run", { id: "notes", kind: "builder-notes" });
  const state = addClaim(root, "gameplay-strong", {}, ["notes"]);
  const reconciliation = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(reconciliation.status, "not-confirmed");
  assert.equal(reconciliation.deterministic, false);
  const gate = evaluateGate(root, state);
  assert.equal(gate.checks.find((item) => item.id === "claims-reconciled").passed, false);
});

// E5 — "Any teacher can run this" without fresh-context transfer evidence
// fails.
test("E5: teacher-transferable without a transfer report is contradicted", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["teach"] });
  recordEvidence(root, "synthetic-run", { id: "notes", kind: "builder-notes" });
  const state = addClaim(root, "teacher-transferable", {}, ["notes"]);
  const result = reconcileClaimAutomatically(root, state, "claim-a");
  assert.equal(result.status, "contradicted");
  assert.match(result.reasons.join(" "), /teacher-transfer-report/);
});

test("E5: the classroom-release level requires teacher-transfer evidence at the gate", () => {
  const root = makeRepo();
  const state = createRun(root, { level: 4, scopes: ["release"] });
  const gate = evaluateGate(root, state);
  assert.equal(gate.checks.find((item) => item.id === "evidence:teacher-transfer-report").passed, false);
});

// E6 — a lesson that cannot map gameplay to explicit economics fails the
// highest readiness gate.
test("E6: the classroom-release gate requires a synthesis map", () => {
  const root = makeRepo();
  const state = createRun(root, { level: 4, scopes: ["release"] });
  const gate = evaluateGate(root, state);
  assert.equal(gate.checks.find((item) => item.id === "evidence:synthesis-map").passed, false);
});

test("E6: synthesis scope requires the synthesis map and both reviewing critics", () => {
  const root = makeRepo();
  const plan = activationPlan(root, 2, ["synthesis"]);
  assert.ok(plan.evidence.includes("synthesis-map"));
  assert.ok(plan.blockingRoles.includes("economic-truth-critic"));
  assert.ok(plan.blockingRoles.includes("teacher-transfer-critic"));
});

// E7 — a /teach interaction change activates Teacher Transfer and Classroom
// review deterministically.
test("E7: teacher-surface scope activates blocking transfer and classroom review", () => {
  const root = makeRepo();
  const plan = activationPlan(root, 1, ["teacher-controls"]);
  assert.ok(plan.blockingRoles.includes("teacher-transfer-critic"));
  assert.ok(plan.blockingRoles.includes("classroom-projector-critic"));
  assert.ok(plan.evidence.includes("teacher-transfer-report"));
});

// E8 — a public board change activates projector/classroom review.
test("E8: board scope activates blocking projector review with projector evidence", () => {
  const root = makeRepo();
  const plan = activationPlan(root, 1, ["projector"]);
  assert.ok(plan.blockingRoles.includes("classroom-projector-critic"));
  assert.ok(plan.evidence.includes("projector-report"));
});

// E9 — an economic model change activates Economic Truth review.
test("E9: economic-model scopes activate blocking Economic Truth review", () => {
  const root = makeRepo();
  for (const scope of ["demand", "cap", "revenue", "incentives"]) {
    const plan = activationPlan(root, 1, [scope]);
    assert.ok(plan.blockingRoles.includes("economic-truth-critic"), `${scope} must trigger economic-truth-critic`);
    assert.ok(plan.evidence.includes("economic-truth-report"), `${scope} must require economic-truth-report`);
  }
});

// E10 — a rights/source ambiguity is surfaced as evidence and stays visible,
// without becoming either a silent safety claim or a fabricated blocker.
test("E10: rights/source questions surface Sports Reality evidence without blocking", () => {
  const root = makeRepo();
  const plan = activationPlan(root, 1, ["data-source"]);
  assert.ok(plan.roles.includes("sports-reality-director"));
  assert.ok(plan.evidence.includes("rights-source-report"));
  assert.ok(!plan.blockingRoles.includes("sports-reality-director"));

  const state = createRun(root, { level: 1, scopes: ["data-source"] });
  appendRunEvent(root, "synthetic-run", "DissentRecorded", {
    id: "rights-question",
    wave: 1,
    category: "rights-source",
    severity: "important",
    finding: "An official data source creates a material source ambiguity that the founder must see.",
    evidenceIds: [],
    blocking: false,
  }, "sports-reality-a", "sports-reality-director");
  const after = loadRun(root, "synthetic-run").state;
  const gate = evaluateGate(root, after);
  assert.equal(gate.checks.find((item) => item.id === "blocking-dissent").passed, true);
  assert.equal(after.dissent["rights-question"].status, "open");
  assert.ok(!loadConfig(root).project.blockingDissentCategories.includes("rights-source"));
});

// E11 — a cheap reversible repair must not trigger release-level ceremony.
test("E11: level-1 activation stays clear of release-only ceremony roles", () => {
  const root = makeRepo();
  const plan = activationPlan(root, 1, ["copy"]);
  const releaseOnly = loadConfig(root).levels.releaseOnlyRoles;
  for (const role of releaseOnly) {
    assert.ok(!plan.roles.includes(role), `${role} must not activate for a level-1 copy repair`);
  }
});

// E12 — facilitator behavior that exists only in builder notes fails the
// transfer screen even when a transfer report exists.
test("E12: builder-notes transfer evidence is contradicted; fresh-context evidence needs judgment", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["teach"] });
  recordEvidence(root, "synthetic-run", { id: "anchored", kind: "teacher-transfer-report", metadata: { tags: ["builder-notes"], freshContext: true } });
  const anchoredState = addClaim(root, "teacher-transferable", {}, ["anchored"], "claim-anchored");
  const anchored = reconcileClaimAutomatically(root, anchoredState, "claim-anchored");
  assert.equal(anchored.status, "contradicted");
  assert.match(anchored.reasons.join(" "), /builder notes/);

  recordEvidence(root, "synthetic-run", { id: "cold", kind: "teacher-transfer-report", metadata: { freshContext: true } });
  const coldState = addClaim(root, "teacher-transferable", {}, ["cold"], "claim-cold");
  const cold = reconcileClaimAutomatically(root, coldState, "claim-cold");
  assert.equal(cold.status, "not-confirmed");
  assert.equal(cold.deterministic, false);
});

// The independence machinery inherited from the source still holds under the
// Economics roster: a builder actor completing the transfer review is caught.
test("independence: a builder cannot also serve as the transfer critic for the same wave", () => {
  const root = makeRepo();
  createRun(root, { level: 2, scopes: ["teach"] });
  complete(root, "synthetic-run", activate(root, "synthetic-run", "builder", "same-actor"), "builder", "same-actor");
  complete(root, "synthetic-run", activate(root, "synthetic-run", "teacher-transfer-critic", "same-actor"), "teacher-transfer-critic", "same-actor");
  const gate = evaluateGate(root, loadRun(root, "synthetic-run").state);
  const independence = gate.checks.find((item) => item.id === "role-independence");
  assert.equal(independence.passed, false);
});
