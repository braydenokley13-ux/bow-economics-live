// Ported from bow-decision-challenges tools/boss/test/helpers.mjs @ 9313c91.
// Economics changes: fixture contract copy speaks this product's law, and
// recordCommandEvidence writes an authentic command record for evals.
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

import { activationPlan } from "../lib/activation.mjs";
import { configFingerprint, findRepoRoot, gitSnapshot, runProcess } from "../lib/core.mjs";
import { appendRunEvent, loadRun } from "../lib/events.mjs";

const sourceRoot = findRepoRoot(import.meta.dirname);

export function contract(overrides = {}) {
  return {
    hypothesis: "The bounded implementation will measurably improve the named behavior without weakening BOW laws.",
    whyThisMatters: "This matters because the affected student or teacher path cannot advance safely without credible evidence.",
    uncertainties: ["Whether the implementation produces the intended result in the real affected path."],
    requiredEvidence: ["A deterministic command or browser artifact that directly exercises the hypothesis."],
    nonGoals: ["Unrelated lesson redesign and economic-model expansion are excluded."],
    sacredConstraints: ["Economic truth, teacher transfer, student privacy, and classroom reliability cannot be weakened."],
    passCondition: "All required roles and evidence confirm the improvement with no unresolved blocking contradiction.",
    repairCondition: "The direction remains promising, but a bounded evidence gap or repairable regression remains.",
    rollbackCondition: "The implementation causes a material regression or cannot preserve a sacred constraint.",
    killCondition: "Repeated valid evidence shows the underlying hypothesis is false or not worth further investment.",
    iterationBudget: {
      maximumWaves: 2,
      maximumRepairs: 2,
      softTokenBudget: 0,
      reason: "Two bounded waves are proportionate to this synthetic harness scenario."
    },
    ...overrides,
  };
}

export function makeRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "bow-boss-test-"));
  mkdirSync(path.join(root, ".boss"), { recursive: true });
  cpSync(path.join(sourceRoot, ".boss", "config"), path.join(root, ".boss", "config"), { recursive: true });
  cpSync(path.join(sourceRoot, ".boss", "schemas"), path.join(root, ".boss", "schemas"), { recursive: true });
  mkdirSync(path.join(root, ".boss", "runs"), { recursive: true });
  mkdirSync(path.join(root, ".boss", "lessons"), { recursive: true });
  mkdirSync(path.join(root, ".boss", "precedents"), { recursive: true });
  mkdirSync(path.join(root, ".boss", "metrics"), { recursive: true });
  cpSync(path.join(sourceRoot, ".boss", "lessons", "index.json"), path.join(root, ".boss", "lessons", "index.json"));
  cpSync(path.join(sourceRoot, ".boss", "precedents", "index.json"), path.join(root, ".boss", "precedents", "index.json"));
  writeFileSync(path.join(root, "package.json"), '{"name":"boss-fixture","private":true}\n');
  writeFileSync(path.join(root, "README.md"), "synthetic Boss test fixture\n");
  runProcess("git", ["init", "-b", "boss/synthetic"], { cwd: root });
  runProcess("git", ["config", "user.email", "boss@example.test"], { cwd: root });
  runProcess("git", ["config", "user.name", "BOW Boss Test"], { cwd: root });
  runProcess("git", ["add", "."], { cwd: root });
  runProcess("git", ["commit", "-m", "fixture"], { cwd: root });
  return root;
}

export function createRun(root, options = {}) {
  const runId = options.runId ?? "synthetic-run";
  const level = options.level ?? 2;
  const scopes = options.scopes ?? ["architecture"];
  const activation = activationPlan(root, level, scopes);
  const base = gitSnapshot(root);
  appendRunEvent(root, runId, "RunCreated", {
    level,
    developmentIntent: options.developmentIntent ?? "build-to-learn",
    intent: options.intent ?? "Exercise one synthetic harness behavior without changing BOW product semantics.",
    contract: options.contract ?? contract(),
    scopes,
    activation,
    base: {
      branch: base.branch,
      commit: base.commit,
      configHash: configFingerprint(root),
      originMain: null,
      dirtyAtStart: false,
      dirtyReason: null,
      dirtyPaths: [],
    },
  }, "lead-a", "lead-integrator");
  return loadRun(root, runId).state;
}

export function recordEvidence(root, runId, input) {
  const state = loadRun(root, runId).state;
  appendRunEvent(root, runId, "EvidenceRecorded", {
    id: input.id,
    wave: state.currentWave,
    kind: input.kind,
    label: input.label ?? input.id,
    path: input.path ?? null,
    sha256: input.sha256 ?? null,
    size: input.size ?? 0,
    metadata: input.metadata ?? {},
  }, input.actor ?? "builder-a", input.role ?? "builder");
}

export function activate(root, runId, role, actor, assignmentId = `${role}-${actor}`) {
  const state = loadRun(root, runId).state;
  appendRunEvent(root, runId, "RoleActivated", {
    wave: state.currentWave,
    assignmentId,
    role,
    actor,
    model: null,
    reason: "synthetic test",
    ephemeral: false,
  }, "lead-a", "lead-integrator");
  return assignmentId;
}

export function sectionsFor(root, role) {
  const roles = JSON.parse(readFileSync(path.join(root, ".boss", "config", "roles.json"), "utf8")).roles;
  const definition = roles.find((candidate) => candidate.id === role);
  return Object.fromEntries(definition.outputSections.map((section) => [section, `Synthetic evidence-backed ${section}.`]));
}

export function complete(root, runId, assignmentId, role, actor, options = {}) {
  const state = loadRun(root, runId).state;
  appendRunEvent(root, runId, "RoleCompleted", {
    wave: state.currentWave,
    assignmentId,
    status: options.status ?? "completed",
    sections: options.sections ?? sectionsFor(root, role),
    evidenceIds: options.evidenceIds ?? [],
    cost: options.cost ?? null,
  }, actor, role);
}

// Writes the artifact `boss evidence command` would produce, then records the
// evidence event pointing at it — the shape the authenticity check requires.
export function recordCommandEvidence(root, runId, { id, kind, exitCode = 0, actor = "builder-a" }) {
  const state = loadRun(root, runId).state;
  const artifact = {
    recordedAt: new Date().toISOString(),
    command: ["node", "-e", `process.exit(${exitCode})`],
    cwd: ".",
    exitCode,
    signal: null,
    stdout: "",
    stderr: "",
  };
  const relative = `.boss/runs/${state.runId}/evidence/${id}--record.json`;
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  const body = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(absolute, body);
  const sha256 = createHash("sha256").update(body).digest("hex");
  appendRunEvent(root, runId, "EvidenceRecorded", {
    id,
    wave: state.currentWave,
    kind,
    label: id,
    path: relative,
    sha256,
    size: body.length,
    metadata: { command: artifact.command, exitCode, signal: null },
  }, actor, "builder");
}
