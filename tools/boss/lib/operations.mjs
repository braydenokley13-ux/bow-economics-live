// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { existsSync } from "node:fs";

import {
  invariant,
  isNonEmptyString,
  isObject,
  loadConfig,
  normalizeId,
  pathOverlaps,
} from "./core.mjs";

export function roleDefinition(root, roleId) {
  const role = loadConfig(root).roles.roles.find((candidate) => candidate.id === roleId);
  invariant(role, `Unknown role: ${roleId}`, "UNKNOWN_ROLE");
  return role;
}

export function validateRoleCompletion(root, state, input) {
  const wave = state.waves[String(input.wave ?? state.currentWave)];
  invariant(wave, `Wave ${input.wave ?? state.currentWave} does not exist.`, "WAVE_NOT_FOUND");
  const assignment = wave.assignments[input.assignmentId];
  invariant(assignment, `Unknown role assignment: ${input.assignmentId}`, "ASSIGNMENT_NOT_FOUND");
  invariant(assignment.status === "active", `Assignment ${input.assignmentId} is ${assignment.status}.`, "ASSIGNMENT_NOT_ACTIVE");
  const role = roleDefinition(root, assignment.role);
  invariant(isObject(input.sections), "Role output sections must be an object.", "MALFORMED_ROLE_OUTPUT");
  const missing = role.outputSections.filter((section) => !Object.hasOwn(input.sections, section));
  invariant(missing.length === 0, `${role.name} output is missing required sections: ${missing.join(", ")}.`, "MALFORMED_ROLE_OUTPUT");
  invariant(Array.isArray(input.evidenceIds), "Role output evidenceIds must be an array.", "MALFORMED_ROLE_OUTPUT");
  for (const evidenceId of input.evidenceIds) {
    invariant(state.evidence[evidenceId], `Role output references missing evidence: ${evidenceId}`, "MISSING_EVIDENCE");
  }
  const validStatuses = ["completed", "completed-with-concerns"];
  invariant(validStatuses.includes(input.status), `Invalid completion status: ${input.status}`, "MALFORMED_ROLE_OUTPUT");
  return { assignment, role, wave };
}

export function meetingOpenData(root, state, input) {
  const config = loadConfig(root).meetings;
  invariant(config.types.includes(input.type), `Unknown meeting type: ${input.type}`, "INVALID_MEETING");
  invariant(isNonEmptyString(input.question), "Meeting question is required.", "INVALID_MEETING");
  invariant(isNonEmptyString(input.why), "Meeting value justification is required.", "INVALID_MEETING");
  invariant(Array.isArray(input.attendees) && input.attendees.length >= 2, "A meeting needs at least two attendees.", "INVALID_MEETING");
  invariant(Array.isArray(input.evidenceIds) && input.evidenceIds.length > 0, "A meeting needs an evidence packet.", "INVALID_MEETING");
  for (const evidenceId of input.evidenceIds) invariant(state.evidence[evidenceId], `Meeting references missing evidence: ${evidenceId}`, "MISSING_EVIDENCE");
  const expectedValue = Number(input.expectedValue);
  const estimatedCost = Number(input.estimatedCost);
  invariant(Number.isFinite(expectedValue) && expectedValue > 0, "Meeting expectedValue must be positive.", "INVALID_MEETING");
  invariant(Number.isFinite(estimatedCost) && estimatedCost > 0, "Meeting estimatedCost must be positive.", "INVALID_MEETING");
  invariant(expectedValue / estimatedCost >= config.minimumExpectedValueRatio, "Meeting cost is not justified by expected value; use independent memos or record a budget exception.", "MEETING_NOT_WARRANTED");
  const tokenBudget = Number(input.tokenBudget ?? config.defaultTokenBudget);
  invariant(Number.isInteger(tokenBudget) && tokenBudget > 0 && tokenBudget <= config.maximumTokenBudget, `Meeting token budget must be 1–${config.maximumTokenBudget}.`, "INVALID_MEETING");
  return {
    id: normalizeId(input.id, "meeting id"),
    wave: input.wave ?? state.currentWave,
    type: input.type,
    question: input.question,
    why: input.why,
    attendees: [...new Set(input.attendees)],
    evidenceIds: input.evidenceIds,
    expectedValue,
    estimatedCost,
    tokenBudget,
    revisitCondition: input.revisitCondition ?? "New material evidence changes the decision basis.",
  };
}

export function meetingOpinionData(state, input) {
  const meeting = state.meetings[input.id];
  invariant(meeting, `Unknown meeting: ${input.id}`, "MEETING_NOT_FOUND");
  invariant(meeting.status === "open", `Meeting ${input.id} is not open.`, "MEETING_CLOSED");
  invariant(meeting.attendees.includes(input.attendee), `${input.attendee} is not an attendee.`, "INVALID_MEETING_OPINION");
  invariant(!meeting.opinions[input.attendee], `${input.attendee} already recorded a pre-opinion.`, "DUPLICATE_MEETING_OPINION");
  invariant(input.seenOthers === false, "Pre-opinions must be independent and recorded before seeing other opinions.", "MEETING_INDEPENDENCE");
  invariant(isNonEmptyString(input.position) && isNonEmptyString(input.reasoning), "Opinion position and reasoning are required.", "INVALID_MEETING_OPINION");
  return {
    id: input.id,
    attendee: input.attendee,
    position: input.position,
    reasoning: input.reasoning,
    evidenceIds: input.evidenceIds ?? [],
    seenOthers: false,
  };
}

export function meetingCloseData(root, state, input) {
  const meeting = state.meetings[input.id];
  invariant(meeting, `Unknown meeting: ${input.id}`, "MEETING_NOT_FOUND");
  invariant(meeting.status === "open", `Meeting ${input.id} is not open.`, "MEETING_CLOSED");
  const missingOpinions = meeting.attendees.filter((attendee) => !meeting.opinions[attendee]);
  invariant(missingOpinions.length === 0, `Independent pre-opinions are missing from: ${missingOpinions.join(", ")}.`, "MEETING_OPINIONS_MISSING");
  invariant(isObject(input.decision), "Meeting decision must be an object.", "INVALID_MEETING_DECISION");
  const required = loadConfig(root).meetings.requiredDecisionFields;
  const missing = required.filter((field) => !Object.hasOwn(input.decision, field));
  invariant(missing.length === 0, `Meeting decision is missing: ${missing.join(", ")}.`, "INVALID_MEETING_DECISION");
  return { id: input.id, decision: input.decision };
}

export function reservationData(state, input) {
  invariant(isNonEmptyString(input.path), "Reservation path is required.", "INVALID_RESERVATION");
  invariant(isNonEmptyString(input.owner), "Reservation owner is required.", "INVALID_RESERVATION");
  const normalizedPath = input.path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
  invariant(normalizedPath && !normalizedPath.startsWith("../") && !normalizedPath.startsWith("/"), "Reservation must be a repository-relative path.", "INVALID_RESERVATION");
  const conflict = Object.values(state.reservations).find((reservation) =>
    reservation.status === "active" && reservation.owner !== input.owner && pathOverlaps(reservation.path, normalizedPath),
  );
  invariant(!conflict, `Path conflicts with ${conflict?.id} owned by ${conflict?.owner}: ${conflict?.path}`, "OWNERSHIP_CONFLICT");
  if (input.laneId) invariant(state.lanes[input.laneId], `Unknown lane: ${input.laneId}`, "LANE_NOT_FOUND");
  return {
    id: normalizeId(input.id, "reservation id"),
    path: normalizedPath,
    owner: input.owner,
    laneId: input.laneId ?? null,
    reason: input.reason ?? "Implementation ownership",
    sharedHotspot: input.sharedHotspot === true,
  };
}

export function laneData(state, input) {
  invariant(isNonEmptyString(input.owner), "Lane owner is required.", "INVALID_LANE");
  invariant(isNonEmptyString(input.branch), "Lane branch is required.", "INVALID_LANE");
  invariant(input.branch !== "main", "A Boss lane cannot own main.", "PROTECTED_BRANCH");
  invariant(isNonEmptyString(input.worktree), "Lane worktree path is required.", "INVALID_LANE");
  invariant(existsSync(input.worktree), `Lane worktree does not exist: ${input.worktree}`, "WORKTREE_NOT_FOUND");
  invariant(!Object.values(state.lanes).some((lane) => lane.status === "active" && lane.branch === input.branch), `Branch is already registered to a lane: ${input.branch}`, "DUPLICATE_LANE");
  return {
    id: normalizeId(input.id, "lane id"),
    owner: input.owner,
    branch: input.branch,
    worktree: input.worktree,
    baseCommit: input.baseCommit,
    integrationOrder: Number(input.integrationOrder ?? 1),
  };
}
