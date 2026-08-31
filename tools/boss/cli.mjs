#!/usr/bin/env node
// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { activationPlan } from "./lib/activation.mjs";
import { reconcileClaimAutomatically } from "./lib/claims.mjs";
import {
  BossError,
  bossPaths,
  configFingerprint,
  copyImmutableEvidence,
  findRepoRoot,
  gitSnapshot,
  hashFile,
  invariant,
  isNonEmptyString,
  jsonInput,
  listFlag,
  loadConfig,
  normalizeId,
  now,
  parseArgv,
  requireFlag,
  runProcess,
  toRelative,
  writeJsonAtomic,
} from "./lib/core.mjs";
import { runDoctor } from "./lib/doctor.mjs";
import { rankExperiments } from "./lib/experiments.mjs";
import {
  appendRunEvent,
  loadRun,
  projectionFresh,
  validateContract,
} from "./lib/events.mjs";
import { assertVerdictAllowed, evaluateGate } from "./lib/gates.mjs";
import { addLesson, addPrecedent, promoteLesson, retrievePrecedents } from "./lib/memory.mjs";
import { aggregateMetrics } from "./lib/metrics.mjs";
import {
  laneData,
  meetingCloseData,
  meetingOpenData,
  meetingOpinionData,
  reservationData,
  roleDefinition,
  validateRoleCompletion,
} from "./lib/operations.mjs";
import { persistHumanViews, writeShipCase } from "./lib/report.mjs";
import { recommendModel } from "./lib/router.mjs";

const HELP = `BOW Boss development control plane

This CLI is for post-prototype Boss runs. First prototypes use the bow-prototype skill and do
not create a run.

Core commands:
  boss doctor [--json]
  boss activate --level <1-4> --scopes <comma-list> [--json]
  boss route recommend --needs <json-or-file> [--run <id>] [--actor <name>]
  boss run create <id> --level <1-4> --development-intent <build-to-learn|build-to-ship> --intent <text> --contract <json-file> --scopes <list> --actor <name>
  boss run status|resume <id> [--json]
  boss run amend-contract <id> --contract <file> --reason <text> --actor <name>
  boss wave start|close <id> ...
  boss role activate|complete|fail <id> ...
  boss evidence file|command <id> ...
  boss claim add|reconcile <id> ...
  boss dissent add|resolve <id> ...
  boss meeting open|opinion|close <id> ...
  boss gate evaluate <id> [--gate wave|ship] --actor <name>
  boss verdict record <id> --value PASS|REPAIR|ROLLBACK|KILL --reason <text> --actor <name>
  boss override record <id> ...
  boss git lane-register|reserve|release|checkpoint <id> ...
  boss lesson add|promote ...
  boss precedent add|query ...
  boss ship-case <id> --actor <name>
  boss experiment evaluate --input <json-file> [--run <id>] --actor <name>
  boss budget adjust <id> --agent-reason <text>|--meeting-reason <text> --actor <name>
  boss metric record <id> --name <metric> --value <number> --actor <name>
  boss metrics aggregate

Evidence command syntax:
  boss evidence command <run> --id <id> --kind <kind> --label <label> --actor <name> -- <command> <args...>
`;

function print(value, asJson = false) {
  if (asJson || typeof value !== "string") process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else process.stdout.write(`${value.endsWith("\n") ? value : `${value}\n`}`);
}

function actor(flags) {
  return String(flags.actor ?? process.env.BOSS_ACTOR ?? "claude");
}

function event(root, runId, type, data, eventActor, role = null) {
  const result = appendRunEvent(root, runId, type, data, eventActor, role);
  persistHumanViews(root, result.state);
  return result;
}

function metadata(flags, root) {
  const parsed = flags.metadata ? jsonInput(String(flags.metadata), root) : {};
  const tags = listFlag(flags.tags);
  return tags.length ? { ...parsed, tags: [...new Set([...(parsed.tags ?? []), ...tags])] } : parsed;
}

function evidencePath(root, runId, id, suffix = "json") {
  const paths = bossPaths(root, runId);
  const safeId = normalizeId(id, "evidence id");
  return path.join(paths.evidence, `${safeId}--record.${suffix}`);
}

function findIndependentReviewer(root, state, wave, reviewer) {
  const config = loadConfig(root);
  const roleMap = new Map(config.roles.roles.map((item) => [item.id, item]));
  return Object.values(wave.assignments).find((assignment) =>
    assignment.actor === reviewer &&
    ["completed", "completed-with-concerns"].includes(assignment.status) &&
    roleMap.get(assignment.role)?.mode === "read-only",
  );
}

function commandDoctor(root, flags) {
  const result = runDoctor(root);
  if (flags.json) print(result, true);
  else {
    for (const item of result.checks) print(`${item.passed ? "PASS" : item.severity === "warning" ? "WARN" : "FAIL"}  ${item.id}  ${item.message}`);
    print(`\n${result.ok ? "BOW Boss harness is valid." : "BOW Boss harness has blocking installation errors."}`);
  }
  if (!result.ok) process.exitCode = 1;
}

function commandRun(root, action, positional, flags) {
  const runId = positional[2];
  invariant(runId, `run ${action} requires a run id.`);
  if (action === "create") {
    const level = Number(requireFlag(flags, "level"));
    const scopes = listFlag(requireFlag(flags, "scopes"));
    const contract = validateContract(jsonInput(requireFlag(flags, "contract"), root));
    const activation = activationPlan(root, level, scopes);
    const developmentIntent = requireFlag(flags, "development-intent");
    invariant(["build-to-learn", "build-to-ship"].includes(developmentIntent), "--development-intent must be build-to-learn or build-to-ship.");
    const base = gitSnapshot(root);
    const config = loadConfig(root);
    invariant(base.branch !== config.project.defaultBranch, `Create a feature branch before starting Boss; ${config.project.defaultBranch} is founder-merge-only.`, "PROTECTED_BRANCH");
    if (base.dirty) {
      invariant(flags["allow-dirty"] === true && isNonEmptyString(flags["dirty-reason"]), "Dirty tree detected. Commit/stash it, or use --allow-dirty with --dirty-reason so the risk is recorded.", "DIRTY_TREE");
    }
    const result = event(root, runId, "RunCreated", {
      level,
      developmentIntent,
      intent: requireFlag(flags, "intent"),
      contract,
      scopes,
      activation,
      base: {
        branch: base.branch,
        commit: base.commit,
        configHash: configFingerprint(root),
        originMain: base.originMain,
        dirtyAtStart: base.dirty,
        dirtyReason: base.dirty ? flags["dirty-reason"] : null,
        dirtyPaths: base.statusLines,
      },
    }, actor(flags), "lead-integrator");
    print({ runId: result.state.runId, level: result.state.levelName, requiredRoles: activation.roles, requiredEvidence: activation.evidence, summary: toRelative(root, result.paths.summary) }, Boolean(flags.json));
    return;
  }

  if (action === "status" || action === "resume") {
    const before = projectionFresh(root, runId);
    const loaded = loadRun(root, runId);
    if (action === "resume") {
      writeJsonAtomic(loaded.paths.state, loaded.state);
      persistHumanViews(root, loaded.state);
    }
    if (flags.json) print({ ...loaded.state, projectionWasFresh: before.fresh, warnings: loaded.state.warnings }, true);
    else print(readFileSync(loaded.paths.summary, "utf8"));
    return;
  }

  if (action === "amend-contract") {
    const { state } = loadRun(root, runId);
    const contract = validateContract(jsonInput(requireFlag(flags, "contract"), root));
    event(root, runId, "ContractAmended", {
      wave: state.currentWave,
      contract,
      reason: requireFlag(flags, "reason"),
    }, actor(flags), "lead-integrator");
    print(`Contract amendment recorded for ${runId} wave ${state.currentWave}.`);
    return;
  }
  throw new BossError(`Unknown run action: ${action}`, "UNKNOWN_COMMAND");
}

function commandWave(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  if (action === "start") {
    const current = state.waves[String(state.currentWave)];
    invariant(current.status !== "active", `Wave ${state.currentWave} is still active; close it first.`, "WAVE_ACTIVE");
    const next = state.currentWave + 1;
    invariant(next <= current.contract.iterationBudget.maximumWaves, "Wave budget is exhausted.", "FAILURE_BUDGET_EXCEEDED");
    const contract = validateContract(jsonInput(requireFlag(flags, "contract"), root));
    const scopes = listFlag(flags.scopes ?? state.scopes.join(","));
    const activation = activationPlan(root, state.level, scopes);
    event(root, runId, "WaveStarted", { wave: next, contract, activation, scopes }, actor(flags), "lead-integrator");
    print(`Started ${runId} wave ${next}.`);
    return;
  }
  if (action === "close") {
    const status = String(flags.status ?? "closed");
    invariant(["closed", "rolled-back", "killed"].includes(status), `Invalid wave close status: ${status}`);
    event(root, runId, "WaveClosed", { wave: state.currentWave, status, reason: requireFlag(flags, "reason") }, actor(flags), "lead-integrator");
    print(`Closed ${runId} wave ${state.currentWave} as ${status}.`);
    return;
  }
  throw new BossError(`Unknown wave action: ${action}`, "UNKNOWN_COMMAND");
}

function commandRole(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  const wave = state.waves[String(state.currentWave)];
  if (action === "activate") {
    const role = requireFlag(flags, "role");
    roleDefinition(root, role);
    const roleActor = requireFlag(flags, "actor");
    const assignmentId = normalizeId(String(flags.assignment ?? `${role}-${roleActor}`), "assignment id");
    invariant(!wave.assignments[assignmentId], `Assignment already exists: ${assignmentId}`, "ASSIGNMENT_EXISTS");
    const model = flags.model ? String(flags.model) : null;
    if (model) {
      const modelDef = loadConfig(root).models.models.find((candidate) => candidate.id === model && candidate.status === "active");
      invariant(modelDef, `Unsupported or inactive model: ${model}`, "UNSUPPORTED_MODEL");
    }
    event(root, runId, "RoleActivated", {
      wave: state.currentWave,
      assignmentId,
      role,
      actor: roleActor,
      model,
      reason: String(flags.reason ?? (wave.activation.roles.includes(role) ? "deterministic activation" : "uncertainty-driven activation")),
      ephemeral: false,
    }, actor(flags), "lead-integrator");
    print(`Activated ${role} as ${assignmentId} for ${roleActor}.`);
    return;
  }
  if (action === "complete") {
    const assignmentId = requireFlag(flags, "assignment");
    const output = jsonInput(requireFlag(flags, "output"), root);
    const completionActor = actor(flags);
    const validated = validateRoleCompletion(root, state, {
      wave: state.currentWave,
      assignmentId,
      status: output.status,
      sections: output.sections,
      evidenceIds: output.evidenceIds,
    });
    invariant(validated.assignment.actor === completionActor, `Completion actor ${completionActor} does not own ${assignmentId}.`, "ROLE_ACTOR_MISMATCH");
    event(root, runId, "RoleCompleted", {
      wave: state.currentWave,
      assignmentId,
      status: output.status,
      sections: output.sections,
      evidenceIds: output.evidenceIds,
      cost: output.cost ?? null,
    }, completionActor, validated.assignment.role);
    if (output.dissent) {
      const dissentId = normalizeId(output.dissent.id ?? `${assignmentId}-dissent`, "dissent id");
      event(root, runId, "DissentRecorded", {
        id: dissentId,
        wave: state.currentWave,
        category: output.dissent.category,
        severity: output.dissent.severity,
        finding: output.dissent.finding,
        evidenceIds: output.dissent.evidenceIds ?? [],
        blocking: output.dissent.severity === "blocking",
      }, completionActor, validated.assignment.role);
    }
    print(`Completed ${assignmentId}.`);
    return;
  }
  if (action === "fail") {
    const assignmentId = requireFlag(flags, "assignment");
    const assignment = wave.assignments[assignmentId];
    invariant(assignment, `Unknown assignment: ${assignmentId}`, "ASSIGNMENT_NOT_FOUND");
    event(root, runId, "RoleFailed", { wave: state.currentWave, assignmentId, reason: requireFlag(flags, "reason") }, actor(flags), assignment.role);
    print(`Marked ${assignmentId} failed.`);
    return;
  }
  if (action === "propose-ephemeral") {
    const id = normalizeId(requireFlag(flags, "id"), "ephemeral role id");
    event(root, runId, "EphemeralRoleProposed", {
      id,
      wave: state.currentWave,
      name: requireFlag(flags, "name"),
      question: requireFlag(flags, "question"),
      justification: requireFlag(flags, "justification"),
      context: listFlag(requireFlag(flags, "context")),
      outputContract: listFlag(requireFlag(flags, "output")),
      tokenBudget: Number(flags["token-budget"] ?? 8000),
    }, actor(flags), "lead-integrator");
    print(`Proposed ephemeral specialist ${id}.`);
    return;
  }
  if (action === "evaluate-ephemeral") {
    const id = requireFlag(flags, "id");
    invariant(state.ephemeralRoles[id], `Unknown ephemeral role: ${id}`, "EPHEMERAL_ROLE_NOT_FOUND");
    event(root, runId, "EphemeralRoleEvaluated", {
      id,
      addedValue: requireFlag(flags, "added-value"),
      duplicatedRoles: listFlag(flags["duplicated-roles"]),
      evidenceIds: listFlag(flags.evidence),
      recommendation: String(flags.recommendation ?? "do-not-promote"),
    }, actor(flags), "lead-integrator");
    print(`Evaluated ephemeral specialist ${id}.`);
    return;
  }
  throw new BossError(`Unknown role action: ${action}`, "UNKNOWN_COMMAND");
}

function commandEvidence(root, action, runId, flags, remainder) {
  const { state } = loadRun(root, runId);
  const id = normalizeId(requireFlag(flags, "id"), "evidence id");
  invariant(!state.evidence[id], `Evidence id already exists: ${id}`, "IMMUTABLE_EVIDENCE");
  const kind = requireFlag(flags, "kind");
  const label = requireFlag(flags, "label");
  let record;
  let exitCode = 0;
  if (action === "file") {
    const copied = copyImmutableEvidence(requireFlag(flags, "file"), bossPaths(root, runId).evidence, id);
    record = {
      id,
      wave: state.currentWave,
      kind,
      label,
      path: toRelative(root, copied.destination),
      sha256: copied.sha256,
      size: copied.size,
      metadata: metadata(flags, root),
    };
  } else if (action === "command") {
    invariant(remainder.length > 0, "Evidence command needs a command after --.", "MISSING_COMMAND");
    const [command, ...args] = remainder;
    const result = runProcess(command, args, { cwd: root });
    exitCode = result.exitCode;
    const outputPath = evidencePath(root, runId, id);
    invariant(!existsSync(outputPath), `Evidence path already exists: ${outputPath}`, "IMMUTABLE_EVIDENCE");
    const commandRecord = {
      recordedAt: now(),
      command: [command, ...args],
      cwd: ".",
      exitCode: result.exitCode,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    writeJsonAtomic(outputPath, commandRecord);
    record = {
      id,
      wave: state.currentWave,
      kind,
      label,
      path: toRelative(root, outputPath),
      sha256: hashFile(outputPath),
      size: statSync(outputPath).size,
      metadata: {
        ...metadata(flags, root),
        command: [command, ...args],
        exitCode: result.exitCode,
        signal: result.signal,
      },
    };
  } else {
    throw new BossError(`Unknown evidence action: ${action}`, "UNKNOWN_COMMAND");
  }
  event(root, runId, "EvidenceRecorded", record, actor(flags), String(flags.role ?? "builder"));
  print({ id, kind, path: record.path, exitCode }, Boolean(flags.json));
  if (exitCode !== 0) process.exitCode = exitCode;
}

function commandClaim(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  const wave = state.waves[String(state.currentWave)];
  if (action === "add") {
    const id = normalizeId(requireFlag(flags, "id"), "claim id");
    invariant(!state.claims[id], `Claim exists: ${id}`, "CLAIM_EXISTS");
    const evidenceIds = listFlag(flags.evidence);
    for (const evidenceId of evidenceIds) invariant(state.evidence[evidenceId], `Unknown evidence: ${evidenceId}`, "MISSING_EVIDENCE");
    event(root, runId, "ClaimRecorded", {
      id,
      wave: state.currentWave,
      kind: requireFlag(flags, "kind"),
      statement: requireFlag(flags, "statement"),
      claimant: actor(flags),
      evidenceIds,
      metadata: metadata(flags, root),
    }, actor(flags), String(flags.role ?? "builder"));
    print(`Recorded claim ${id}.`);
    return;
  }
  if (action === "reconcile") {
    const id = requireFlag(flags, "id");
    let reconciliation = reconcileClaimAutomatically(root, state, id);
    if (flags.status) {
      const status = String(flags.status);
      invariant(["confirmed", "not-confirmed", "contradicted"].includes(status), `Invalid claim status: ${status}`);
      const reviewer = actor(flags);
      invariant(findIndependentReviewer(root, state, wave, reviewer), `Judgment reconciliation requires a completed independent read-only role owned by ${reviewer}.`, "INDEPENDENT_REVIEW_REQUIRED");
      reconciliation = {
        id,
        status,
        reasons: [requireFlag(flags, "reason")],
        checkedEvidence: state.claims[id]?.evidenceIds ?? [],
        deterministic: false,
      };
    }
    event(root, runId, "ClaimReconciled", reconciliation, actor(flags), String(flags.role ?? "product-analyst"));
    print(reconciliation, Boolean(flags.json));
    return;
  }
  throw new BossError(`Unknown claim action: ${action}`, "UNKNOWN_COMMAND");
}

function commandDissent(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  if (action === "add") {
    const id = normalizeId(requireFlag(flags, "id"), "dissent id");
    invariant(!state.dissent[id], `Dissent exists: ${id}`, "DISSENT_EXISTS");
    const category = requireFlag(flags, "category");
    const severity = requireFlag(flags, "severity");
    invariant(["advisory", "important", "blocking"].includes(severity), `Invalid dissent severity: ${severity}`);
    event(root, runId, "DissentRecorded", {
      id,
      wave: state.currentWave,
      category,
      severity,
      finding: requireFlag(flags, "finding"),
      evidenceIds: listFlag(flags.evidence),
      blocking: severity === "blocking" || loadConfig(root).project.blockingDissentCategories.includes(category),
    }, actor(flags), String(flags.role ?? "critic"));
    print(`Recorded dissent ${id}.`);
    return;
  }
  if (action === "resolve") {
    const id = requireFlag(flags, "id");
    invariant(state.dissent[id], `Unknown dissent: ${id}`, "DISSENT_NOT_FOUND");
    event(root, runId, "DissentResolved", { id, resolution: requireFlag(flags, "resolution"), evidenceIds: listFlag(flags.evidence) }, actor(flags), "lead-integrator");
    print(`Resolved dissent ${id}; history remains preserved.`);
    return;
  }
  throw new BossError(`Unknown dissent action: ${action}`, "UNKNOWN_COMMAND");
}

function commandMeeting(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  if (action === "open") {
    const data = meetingOpenData(root, state, {
      id: requireFlag(flags, "id"),
      wave: state.currentWave,
      type: requireFlag(flags, "type"),
      question: requireFlag(flags, "question"),
      why: requireFlag(flags, "why"),
      attendees: listFlag(requireFlag(flags, "attendees")),
      evidenceIds: listFlag(requireFlag(flags, "evidence")),
      expectedValue: requireFlag(flags, "expected-value"),
      estimatedCost: requireFlag(flags, "estimated-cost"),
      tokenBudget: flags["token-budget"],
      revisitCondition: flags["revisit-condition"],
    });
    event(root, runId, "MeetingOpened", data, actor(flags), "lead-integrator");
    print(`Opened ${data.type} ${data.id}. Independent pre-opinions are now required.`);
    return;
  }
  if (action === "opinion") {
    const data = meetingOpinionData(state, {
      id: requireFlag(flags, "id"),
      attendee: requireFlag(flags, "attendee"),
      position: requireFlag(flags, "position"),
      reasoning: requireFlag(flags, "reasoning"),
      evidenceIds: listFlag(flags.evidence),
      seenOthers: false,
    });
    event(root, runId, "MeetingOpinionRecorded", data, actor(flags), data.attendee);
    print(`Recorded independent opinion from ${data.attendee}.`);
    return;
  }
  if (action === "close") {
    const data = meetingCloseData(root, state, {
      id: requireFlag(flags, "id"),
      decision: jsonInput(requireFlag(flags, "decision"), root),
    });
    event(root, runId, "MeetingClosed", data, actor(flags), "lead-integrator");
    print(`Closed meeting ${data.id}.`);
    return;
  }
  throw new BossError(`Unknown meeting action: ${action}`, "UNKNOWN_COMMAND");
}

function commandGate(root, runId, flags) {
  const { state } = loadRun(root, runId);
  const evaluation = evaluateGate(root, state, { gate: String(flags.gate ?? "wave") });
  event(root, runId, "GateEvaluated", evaluation, actor(flags), "lead-integrator");
  print(evaluation, Boolean(flags.json));
  if (!evaluation.eligible) process.exitCode = 2;
}

function commandVerdict(root, runId, flags) {
  const { state } = loadRun(root, runId);
  const value = requireFlag(flags, "value").toUpperCase();
  assertVerdictAllowed(state, value);
  event(root, runId, "VerdictRecorded", {
    wave: state.currentWave,
    verdict: value,
    reason: requireFlag(flags, "reason"),
    evidenceIds: listFlag(flags.evidence),
  }, actor(flags), "lead-integrator");
  print(`Recorded ${value} for ${runId} wave ${state.currentWave}.`);
}

function commandOverride(root, runId, flags) {
  const { state } = loadRun(root, runId);
  event(root, runId, "FounderOverrideRecorded", {
    wave: state.currentWave,
    subject: requireFlag(flags, "subject"),
    bossRecommendation: requireFlag(flags, "boss-recommendation"),
    decision: requireFlag(flags, "decision"),
    founderReason: String(flags.reason ?? "not provided"),
    riskAccepted: requireFlag(flags, "risk-accepted"),
    reviewTrigger: String(flags["review-trigger"] ?? "next retrospective"),
  }, actor(flags), "founder");
  print("Founder override recorded. The underlying evidence and dissent remain unchanged.");
}

function commandGit(root, action, runId, flags) {
  const { state } = loadRun(root, runId);
  if (action === "lane-register") {
    const data = laneData(state, {
      id: requireFlag(flags, "id"),
      owner: requireFlag(flags, "owner"),
      branch: requireFlag(flags, "branch"),
      worktree: requireFlag(flags, "worktree"),
      baseCommit: String(flags["base-commit"] ?? state.base.commit),
      integrationOrder: flags["integration-order"],
    });
    event(root, runId, "LaneRegistered", data, actor(flags), "lead-integrator");
    print(`Registered lane ${data.id}.`);
    return;
  }
  if (action === "reserve") {
    const data = reservationData(state, {
      id: requireFlag(flags, "id"),
      path: requireFlag(flags, "path"),
      owner: requireFlag(flags, "owner"),
      laneId: flags.lane,
      reason: flags.reason,
      sharedHotspot: flags["shared-hotspot"] === true,
    });
    event(root, runId, "PathReserved", data, actor(flags), "lead-integrator");
    print(`Reserved ${data.path} for ${data.owner}.`);
    return;
  }
  if (action === "release") {
    const id = requireFlag(flags, "id");
    invariant(state.reservations[id], `Unknown reservation: ${id}`, "RESERVATION_NOT_FOUND");
    event(root, runId, "PathReleased", { id, reason: requireFlag(flags, "reason") }, actor(flags), "lead-integrator");
    print(`Released reservation ${id}.`);
    return;
  }
  if (action === "checkpoint") {
    const snapshot = gitSnapshot(root);
    invariant(!snapshot.dirty, "Rollback checkpoints require a clean committed tree.", "DIRTY_TREE");
    event(root, runId, "RollbackCheckpointRecorded", { commit: snapshot.commit, branch: snapshot.branch, reason: requireFlag(flags, "reason") }, actor(flags), "lead-integrator");
    print(`Recorded rollback checkpoint ${snapshot.commit}.`);
    return;
  }
  throw new BossError(`Unknown git action: ${action}`, "UNKNOWN_COMMAND");
}

function commandLesson(root, action, flags) {
  const indexPath = bossPaths(root).lessons;
  if (action === "add") {
    const lesson = addLesson(indexPath, jsonInput(requireFlag(flags, "input"), root));
    print(lesson, Boolean(flags.json));
    return;
  }
  if (action === "promote") {
    const lesson = promoteLesson(indexPath, requireFlag(flags, "id"), requireFlag(flags, "status"), {
      sourceRuns: listFlag(flags.runs),
      evidence: listFlag(flags.evidence),
      founder: flags.founder,
      reason: flags.reason,
    });
    print(lesson, Boolean(flags.json));
    return;
  }
  throw new BossError(`Unknown lesson action: ${action}`, "UNKNOWN_COMMAND");
}

function commandPrecedent(root, action, flags) {
  const indexPath = bossPaths(root).precedents;
  if (action === "add") {
    const precedent = addPrecedent(indexPath, jsonInput(requireFlag(flags, "input"), root));
    print(precedent, Boolean(flags.json));
    return;
  }
  if (action === "query") {
    print(retrievePrecedents(indexPath, listFlag(requireFlag(flags, "scopes"))), true);
    return;
  }
  throw new BossError(`Unknown precedent action: ${action}`, "UNKNOWN_COMMAND");
}

function commandShipCase(root, runId, flags) {
  let { state } = loadRun(root, runId);
  const prepared = writeShipCase(root, state);
  const evidenceId = normalizeId(`ship-case-wave-${state.currentWave}-${state.eventCount}`, "evidence id");
  if (!state.evidence[evidenceId]) {
    event(root, runId, "EvidenceRecorded", {
      id: evidenceId,
      wave: state.currentWave,
      kind: "ship-case",
      label: `Ship case for wave ${state.currentWave}`,
      path: prepared.relativePath,
      sha256: hashFile(prepared.filePath),
      size: statSync(prepared.filePath).size,
      metadata: prepared.metadata,
    }, actor(flags), "lead-integrator");
    state = loadRun(root, runId).state;
    event(root, runId, "ShipCasePrepared", { wave: state.currentWave, path: prepared.relativePath, ...prepared.metadata }, actor(flags), "lead-integrator");
  }
  print({ path: prepared.relativePath, ...prepared.metadata }, Boolean(flags.json));
}

function commandBudget(root, runId, flags) {
  const { state } = loadRun(root, runId);
  invariant(isNonEmptyString(flags["agent-reason"]) || isNonEmptyString(flags["meeting-reason"]), "Budget adjustment needs --agent-reason or --meeting-reason.");
  event(root, runId, "BudgetAdjusted", {
    wave: state.currentWave,
    agentReason: flags["agent-reason"] ?? null,
    meetingReason: flags["meeting-reason"] ?? null,
    tokenReason: flags["token-reason"] ?? null,
  }, actor(flags), "lead-integrator");
  print(`Recorded soft-budget adjustment for ${runId} wave ${state.currentWave}.`);
}

function commandMetric(root, runId, flags) {
  const name = requireFlag(flags, "name");
  const value = Number(requireFlag(flags, "value"));
  invariant(Number.isFinite(value), "Metric value must be numeric.");
  event(root, runId, "MetricRecorded", { metric: name, value, note: flags.note ?? null }, actor(flags), "lead-integrator");
  print(`Recorded metric ${name} += ${value}.`);
}

function dispatch(root, argv) {
  const parsed = parseArgv(argv);
  const [group, action] = parsed.positional;
  if (!group || ["help", "--help", "-h"].includes(group)) {
    print(HELP);
    return;
  }
  if (group === "doctor") return commandDoctor(root, parsed.flags);
  if (group === "activate") {
    const plan = activationPlan(root, Number(requireFlag(parsed.flags, "level")), listFlag(requireFlag(parsed.flags, "scopes")));
    print(plan, true);
    return;
  }
  if (group === "route" && action === "recommend") {
    const recommendation = recommendModel(root, jsonInput(requireFlag(parsed.flags, "needs"), root));
    if (parsed.flags.run) event(root, String(parsed.flags.run), "ModelRouteRecorded", recommendation, actor(parsed.flags), "lead-integrator");
    print(recommendation, true);
    return;
  }
  if (group === "experiment" && action === "evaluate") {
    const evaluation = rankExperiments(jsonInput(requireFlag(parsed.flags, "input"), root));
    if (parsed.flags.run) event(root, String(parsed.flags.run), "HarnessExperimentRecorded", evaluation, actor(parsed.flags), "lead-integrator");
    print(evaluation, true);
    return;
  }
  if (group === "run") return commandRun(root, action, parsed.positional, parsed.flags);
  const runId = parsed.positional[2];
  if (["wave", "role", "evidence", "claim", "dissent", "meeting", "gate", "verdict", "override", "git", "budget", "metric"].includes(group)) {
    invariant(runId, `${group} ${action} requires a run id.`);
  }
  if (group === "wave") return commandWave(root, action, runId, parsed.flags);
  if (group === "role") return commandRole(root, action, runId, parsed.flags);
  if (group === "evidence") return commandEvidence(root, action, runId, parsed.flags, parsed.remainder);
  if (group === "claim") return commandClaim(root, action, runId, parsed.flags);
  if (group === "dissent") return commandDissent(root, action, runId, parsed.flags);
  if (group === "meeting") return commandMeeting(root, action, runId, parsed.flags);
  if (group === "gate" && action === "evaluate") return commandGate(root, runId, parsed.flags);
  if (group === "verdict" && action === "record") return commandVerdict(root, runId, parsed.flags);
  if (group === "override" && action === "record") return commandOverride(root, runId, parsed.flags);
  if (group === "git") return commandGit(root, action, runId, parsed.flags);
  if (group === "budget" && action === "adjust") return commandBudget(root, runId, parsed.flags);
  if (group === "metric" && action === "record") return commandMetric(root, runId, parsed.flags);
  if (group === "lesson") return commandLesson(root, action, parsed.flags);
  if (group === "precedent") return commandPrecedent(root, action, parsed.flags);
  if (group === "ship-case") return commandShipCase(root, action, parsed.flags);
  if (group === "metrics" && action === "aggregate") return print(aggregateMetrics(root), true);
  throw new BossError(`Unknown command: ${parsed.positional.join(" ")}`, "UNKNOWN_COMMAND");
}

try {
  const root = findRepoRoot();
  dispatch(root, process.argv.slice(2));
} catch (error) {
  if (error instanceof BossError) {
    process.stderr.write(`BOW Boss [${error.code}]: ${error.message}\n`);
    if (error.details && process.env.BOSS_DEBUG) process.stderr.write(`${JSON.stringify(error.details, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    process.stderr.write(`BOW Boss [UNEXPECTED]: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
