// Ported from bow-decision-challenges tools/boss/lib/gates.mjs @ 9313c91.
// Economics changes: the level-1 ceremony check reads releaseOnlyRoles from
// levels config instead of a hardcoded product-specific role list.
import { existsSync } from "node:fs";
import path from "node:path";

import {
  gitSnapshot,
  hashFile,
  invariant,
  loadConfig,
  pathOverlaps,
} from "./core.mjs";

function completeAssignments(wave) {
  return Object.values(wave.assignments).filter((assignment) =>
    ["completed", "completed-with-concerns"].includes(assignment.status),
  );
}

function evidenceMatches(record, requiredKind) {
  const tags = Array.isArray(record.metadata?.tags) ? record.metadata.tags : [];
  return record.kind === requiredKind || tags.includes(requiredKind);
}

function checkEvidenceFile(root, record) {
  if (!record.path) return null;
  const absolute = path.resolve(root, record.path);
  if (!existsSync(absolute)) return `Evidence ${record.id} file is missing.`;
  if (record.sha256 && hashFile(absolute) !== record.sha256) return `Evidence ${record.id} hash no longer matches.`;
  return null;
}

function result(id, passed, message, severity = "blocking") {
  return { id, passed, message, severity };
}

export function detectReservationConflicts(state) {
  const active = Object.values(state.reservations).filter((reservation) => reservation.status === "active");
  const conflicts = [];
  for (let left = 0; left < active.length; left += 1) {
    for (let right = left + 1; right < active.length; right += 1) {
      const a = active[left];
      const b = active[right];
      if (a.owner === b.owner) continue;
      if (pathOverlaps(a.path, b.path)) conflicts.push({ left: a.id, right: b.id, pathA: a.path, pathB: b.path });
    }
  }
  return conflicts;
}

export function evaluateGate(root, state, { gate = "wave" } = {}) {
  const config = loadConfig(root);
  const wave = state.waves[String(state.currentWave)];
  invariant(wave, `Current wave ${state.currentWave} is missing.`, "WAVE_NOT_FOUND");
  const checks = [];
  const completed = completeAssignments(wave);
  const completedRoles = new Set(completed.map((assignment) => assignment.role));

  for (const role of wave.activation.roles) {
    checks.push(result(`role:${role}`, completedRoles.has(role), completedRoles.has(role) ? `${role} completed.` : `${role} is required and incomplete.`));
  }

  const blockingRoleSet = new Set(wave.activation.blockingRoles ?? []);
  for (const role of blockingRoleSet) {
    checks.push(result(`blocking-role:${role}`, completedRoles.has(role), completedRoles.has(role) ? `${role} blocking review is present.` : `${role} cannot be omitted.`));
  }

  const roleById = new Map(config.roles.roles.map((role) => [role.id, role]));
  const builderActors = new Set(completed.filter((assignment) => roleById.get(assignment.role)?.mode === "builder").map((assignment) => assignment.actor));
  const independentViolations = completed.filter((assignment) => {
    const mode = roleById.get(assignment.role)?.mode;
    return ["read-only", "advisor"].includes(mode) && builderActors.has(assignment.actor);
  });
  checks.push(result(
    "role-independence",
    independentViolations.length === 0,
    independentViolations.length === 0
      ? "Builders and independent reviewers are different actors."
      : `Builder self-certification detected: ${independentViolations.map((item) => `${item.actor}/${item.role}`).join(", ")}.`,
  ));

  const analyst = completed.find((assignment) => assignment.role === "product-analyst");
  if (wave.activation.roles.includes("product-analyst")) {
    const analystRole = roleById.get("product-analyst");
    const missingSections = analystRole.outputSections.filter((section) => !Object.hasOwn(analyst?.sections ?? {}, section));
    checks.push(result(
      "analyst-contract",
      Boolean(analyst) && missingSections.length === 0,
      !analyst ? "Independent Analyst is missing." : missingSections.length ? `Analyst output is missing: ${missingSections.join(", ")}.` : "Analyst output contract is complete.",
    ));
  }

  const waveEvidence = wave.evidenceIds.map((id) => state.evidence[id]).filter(Boolean);
  for (const requiredKind of wave.activation.evidence) {
    const present = waveEvidence.some((record) => evidenceMatches(record, requiredKind));
    checks.push(result(`evidence:${requiredKind}`, present, present ? `${requiredKind} evidence is present.` : `${requiredKind} evidence is required.`));
  }
  for (const record of waveEvidence) {
    const integrityFailure = checkEvidenceFile(root, record);
    checks.push(result(`evidence-integrity:${record.id}`, integrityFailure === null, integrityFailure ?? `Evidence ${record.id} hash is intact.`));
  }

  const claims = wave.claimIds.map((id) => state.claims[id]).filter(Boolean);
  if (state.level >= 2) {
    checks.push(result("claim-ledger-present", claims.length > 0, claims.length ? "Wave contains progress claims." : "Level 2+ wave needs at least one explicit progress claim."));
  }
  const badClaims = claims.filter((claim) => claim.status !== "confirmed");
  checks.push(result(
    "claims-reconciled",
    badClaims.length === 0,
    badClaims.length === 0 ? "All claims are confirmed." : `Unconfirmed or contradicted claims: ${badClaims.map((claim) => `${claim.id}:${claim.status}`).join(", ")}.`,
  ));

  const openDissent = wave.dissentIds.map((id) => state.dissent[id]).filter((dissent) => dissent?.status === "open");
  const blockingCategories = new Set(config.project.blockingDissentCategories);
  const blockingDissent = openDissent.filter((dissent) => dissent.severity === "blocking" || blockingCategories.has(dissent.category));
  checks.push(result(
    "blocking-dissent",
    blockingDissent.length === 0,
    blockingDissent.length === 0 ? "No unresolved blocking dissent." : `Blocking dissent remains: ${blockingDissent.map((item) => item.id).join(", ")}.`,
  ));

  const openMeetings = wave.meetingIds.map((id) => state.meetings[id]).filter((meeting) => meeting?.status === "open");
  checks.push(result("meetings-closed", openMeetings.length === 0, openMeetings.length ? `Open meetings: ${openMeetings.map((meeting) => meeting.id).join(", ")}.` : "All meetings are closed."));

  const meetingBudget = wave.activation.softMeetingBudget;
  const budgetAdjusted = Boolean(wave.budgetAdjustment?.meetingReason);
  checks.push(result(
    "meeting-budget",
    wave.meetingIds.length <= meetingBudget || budgetAdjusted,
    wave.meetingIds.length <= meetingBudget
      ? `Meeting count ${wave.meetingIds.length}/${meetingBudget}.`
      : budgetAdjusted ? "Meeting soft budget exceeded with a recorded reason." : `Meeting soft budget exceeded: ${wave.meetingIds.length}/${meetingBudget}.`,
  ));

  const agentBudget = wave.activation.softAgentBudget;
  const agentBudgetAdjusted = Boolean(wave.budgetAdjustment?.agentReason);
  checks.push(result(
    "agent-budget",
    Object.keys(wave.assignments).length <= agentBudget || agentBudgetAdjusted,
    Object.keys(wave.assignments).length <= agentBudget
      ? `Agent count ${Object.keys(wave.assignments).length}/${agentBudget}.`
      : agentBudgetAdjusted ? "Agent soft budget exceeded with a recorded reason." : `Agent soft budget exceeded: ${Object.keys(wave.assignments).length}/${agentBudget}.`,
  ));

  if (state.level === 1) {
    const releaseOnlyRoles = config.levels.releaseOnlyRoles ?? [];
    const unnecessary = releaseOnlyRoles.filter((role) => completedRoles.has(role) && !wave.activation.roles.includes(role));
    checks.push(result(
      "level-1-ceremony",
      unnecessary.length === 0 && wave.meetingIds.length === 0,
      unnecessary.length === 0 && wave.meetingIds.length === 0
        ? "Level 1 stayed bounded."
        : `Level 1 invoked unjustified ceremony: ${[...unnecessary, ...(wave.meetingIds.length ? ["meeting"] : [])].join(", ")}.`,
    ));
  }

  const budget = wave.contract.iterationBudget;
  checks.push(result(
    "failure-budget",
    wave.repairs <= budget.maximumRepairs && state.currentWave <= budget.maximumWaves,
    `Repairs ${wave.repairs}/${budget.maximumRepairs}; waves ${state.currentWave}/${budget.maximumWaves}.`,
  ));

  const reservationConflicts = detectReservationConflicts(state);
  checks.push(result("ownership-conflicts", reservationConflicts.length === 0, reservationConflicts.length ? `Conflicting reservations: ${reservationConflicts.map((item) => `${item.left}<->${item.right}`).join(", ")}.` : "No active ownership conflicts."));

  const gitState = gitSnapshot(root);
  checks.push(result("protected-branch", gitState.branch !== config.project.defaultBranch, gitState.branch === config.project.defaultBranch ? `Boss implementation cannot run directly on ${config.project.defaultBranch}.` : `Branch ${gitState.branch} is not protected.`));
  if (gate === "ship") {
    checks.push(result("clean-tree", !gitState.dirty, gitState.dirty ? `Ship gate requires a clean tree; ${gitState.statusLines.length} path(s) changed.` : "Git tree is clean."));
    checks.push(result("rollback-checkpoint", state.checkpoints.length > 0, state.checkpoints.length ? "Rollback checkpoint is recorded." : "Ship gate requires a rollback checkpoint."));
  }

  const blockingFailures = checks.filter((check) => !check.passed && check.severity === "blocking");
  const recommendation = blockingFailures.length === 0 ? "PASS" : "REPAIR";
  return {
    gate,
    wave: state.currentWave,
    evaluatedCommit: gitState.commit,
    evaluatedBranch: gitState.branch,
    eligible: blockingFailures.length === 0,
    recommendation,
    checks,
    blockingFailures: blockingFailures.map((check) => check.id),
  };
}

export function assertVerdictAllowed(state, verdict) {
  invariant(["PASS", "REPAIR", "ROLLBACK", "KILL"].includes(verdict), `Invalid verdict: ${verdict}`);
  const wave = state.waves[String(state.currentWave)];
  if (verdict === "PASS") {
    const latest = wave.gates.at(-1);
    invariant(latest?.eligible === true, "PASS requires the latest recorded gate to be eligible. Founder override may accept risk but cannot rewrite gate evidence.", "PASS_GATE_BLOCKED");
  }
  if (verdict === "REPAIR") {
    invariant(wave.repairs < wave.contract.iterationBudget.maximumRepairs, "Repair budget is exhausted; choose ROLLBACK, KILL, or record an explicit budget amendment.", "FAILURE_BUDGET_EXCEEDED");
  }
}
