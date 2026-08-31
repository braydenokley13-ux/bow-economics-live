// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { existsSync, readFileSync } from "node:fs";

import {
  BossError,
  appendLineSynced,
  bossPaths,
  canonicalJson,
  invariant,
  isNonEmptyString,
  isObject,
  loadConfig,
  normalizeRunId,
  sha256,
  unique,
  withDirectoryLock,
  writeJsonAtomic,
  writeTextAtomic,
} from "./core.mjs";

export const EVENT_TYPES = Object.freeze([
  "RunCreated",
  "ContractAmended",
  "WaveStarted",
  "WaveClosed",
  "RoleActivated",
  "RoleCompleted",
  "RoleFailed",
  "EvidenceRecorded",
  "ClaimRecorded",
  "ClaimReconciled",
  "DissentRecorded",
  "DissentResolved",
  "MeetingOpened",
  "MeetingOpinionRecorded",
  "MeetingClosed",
  "GateEvaluated",
  "VerdictRecorded",
  "FounderOverrideRecorded",
  "LaneRegistered",
  "PathReserved",
  "PathReleased",
  "RollbackCheckpointRecorded",
  "BudgetAdjusted",
  "MetricRecorded",
  "EphemeralRoleProposed",
  "EphemeralRoleEvaluated",
  "ModelRouteRecorded",
  "HarnessExperimentRecorded",
  "LessonLinked",
  "PrecedentLinked",
  "ShipCasePrepared",
  "RunClosed"
]);

const EVENT_TYPE_SET = new Set(EVENT_TYPES);

const CONTRACT_STRING_FIELDS = [
  "hypothesis",
  "whyThisMatters",
  "passCondition",
  "repairCondition",
  "rollbackCondition",
  "killCondition",
];

const CONTRACT_ARRAY_FIELDS = [
  "uncertainties",
  "requiredEvidence",
  "nonGoals",
  "sacredConstraints",
];

export function validateContract(contract) {
  invariant(isObject(contract), "Wave contract must be an object.", "INVALID_CONTRACT");
  for (const field of CONTRACT_STRING_FIELDS) {
    invariant(isNonEmptyString(contract[field]) && contract[field].trim().length >= 20, `Contract ${field} must contain at least 20 characters.`, "INVALID_CONTRACT");
  }
  for (const field of CONTRACT_ARRAY_FIELDS) {
    invariant(Array.isArray(contract[field]) && contract[field].length > 0, `Contract ${field} must be a non-empty array.`, "INVALID_CONTRACT");
    invariant(contract[field].every((item) => isNonEmptyString(item)), `Contract ${field} contains an empty item.`, "INVALID_CONTRACT");
  }
  const budget = contract.iterationBudget;
  invariant(isObject(budget), "Contract iterationBudget is required.", "INVALID_CONTRACT");
  invariant(Number.isInteger(budget.maximumWaves) && budget.maximumWaves >= 1 && budget.maximumWaves <= 20, "maximumWaves must be 1–20.", "INVALID_CONTRACT");
  invariant(Number.isInteger(budget.maximumRepairs) && budget.maximumRepairs >= 0 && budget.maximumRepairs <= 20, "maximumRepairs must be 0–20.", "INVALID_CONTRACT");
  invariant(Number.isInteger(budget.softTokenBudget) && budget.softTokenBudget >= 0, "softTokenBudget must be a non-negative integer.", "INVALID_CONTRACT");
  invariant(isNonEmptyString(budget.reason) && budget.reason.trim().length >= 10, "Iteration budget needs a reason.", "INVALID_CONTRACT");
  return contract;
}

function eventBody(event) {
  const { hash: _hash, ...body } = event;
  return body;
}

export function computeEventHash(event) {
  return sha256(canonicalJson(eventBody(event)));
}

function validateEventShape(event) {
  invariant(isObject(event), "Runtime event must be an object.", "INVALID_EVENT");
  invariant(event.schemaVersion === 1, `Unsupported event schema: ${event.schemaVersion}`, "EVENT_SCHEMA_VERSION");
  invariant(Number.isInteger(event.sequence) && event.sequence > 0, "Event sequence must be a positive integer.", "INVALID_EVENT");
  invariant(normalizeRunId(event.runId) === event.runId, `Invalid event run id: ${event.runId}`, "INVALID_EVENT");
  invariant(EVENT_TYPE_SET.has(event.type), `Unknown event type: ${event.type}`, "INVALID_EVENT");
  invariant(isNonEmptyString(event.timestamp) && Number.isFinite(Date.parse(event.timestamp)), "Event timestamp must be ISO-compatible.", "INVALID_EVENT");
  invariant(isNonEmptyString(event.actor), "Event actor is required.", "INVALID_EVENT");
  invariant(event.role === null || event.role === undefined || isNonEmptyString(event.role), "Event role must be a string or null.", "INVALID_EVENT");
  invariant(isObject(event.data), "Event data must be an object.", "INVALID_EVENT");
  invariant(event.previousHash === null || /^[a-f0-9]{64}$/.test(event.previousHash), "Event previousHash is invalid.", "INVALID_EVENT");
  invariant(/^[a-f0-9]{64}$/.test(event.hash), "Event hash is invalid.", "INVALID_EVENT");
  invariant(computeEventHash(event) === event.hash, `Event ${event.sequence} hash mismatch.`, "EVENT_HASH_MISMATCH");
}

function validateKnownPayload(event, root) {
  const data = event.data;
  if (event.type === "RunCreated") {
    invariant(event.sequence === 1, "RunCreated must be the first event.", "INVALID_EVENT");
    invariant(Number.isInteger(data.level) && data.level >= 1 && data.level <= 4, "Boss level must be 1–4.", "INVALID_EVENT");
    invariant(["build-to-learn", "build-to-ship"].includes(data.developmentIntent), "RunCreated requires developmentIntent: build-to-learn or build-to-ship.", "INVALID_EVENT");
    validateContract(data.contract);
    invariant(isNonEmptyString(data.intent), "Founder intent is required.", "INVALID_EVENT");
    invariant(Array.isArray(data.scopes) && data.scopes.length > 0, "At least one changed scope is required.", "INVALID_EVENT");
    invariant(isObject(data.base) && isNonEmptyString(data.base.branch) && isNonEmptyString(data.base.commit), "Git base is required.", "INVALID_EVENT");
    invariant(isObject(data.activation) && Array.isArray(data.activation.roles), "Activation plan is required.", "INVALID_EVENT");
  }
  if (event.type === "RoleActivated") {
    const config = loadConfig(root);
    const known = new Set(config.roles.roles.map((role) => role.id));
    invariant(known.has(data.role) || data.ephemeral === true, `Unknown role: ${data.role}`, "UNKNOWN_ROLE");
    invariant(isNonEmptyString(data.assignmentId) && isNonEmptyString(data.actor), "Role assignment id and actor are required.", "INVALID_EVENT");
  }
  if (["EvidenceRecorded", "ClaimRecorded", "DissentRecorded", "MeetingOpened", "LaneRegistered", "PathReserved"].includes(event.type)) {
    invariant(isNonEmptyString(data.id), `${event.type} requires data.id.`, "INVALID_EVENT");
  }
}

export function readRunEvents(root, runId) {
  const normalized = normalizeRunId(runId);
  const paths = bossPaths(root, normalized);
  invariant(existsSync(paths.events), `Run does not exist: ${normalized}`, "RUN_NOT_FOUND");
  const raw = readFileSync(paths.events, "utf8");
  const lines = raw.split("\n");
  const events = [];
  let truncatedTail = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      const remaining = lines.slice(index + 1).some((candidate) => candidate.trim());
      if (remaining) {
        throw new BossError(`Corrupt event history at line ${index + 1}.`, "EVENT_HISTORY_CORRUPT");
      }
      truncatedTail = line;
    }
  }
  verifyEventHistory(events, normalized, root);
  return { events, truncatedTail, paths };
}

export function verifyEventHistory(events, runId, root) {
  invariant(events.length > 0, "Event history is empty.", "EVENT_HISTORY_EMPTY");
  let previousHash = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    validateEventShape(event);
    validateKnownPayload(event, root);
    invariant(event.sequence === index + 1, `Expected sequence ${index + 1}; got ${event.sequence}.`, "EVENT_SEQUENCE_GAP");
    invariant(event.runId === runId, `Event ${event.sequence} belongs to ${event.runId}, not ${runId}.`, "EVENT_RUN_MISMATCH");
    invariant(event.previousHash === previousHash, `Event ${event.sequence} previousHash mismatch.`, "EVENT_CHAIN_BROKEN");
    previousHash = event.hash;
  }
  invariant(events[0].type === "RunCreated", "First event must be RunCreated.", "EVENT_HISTORY_INVALID");
}

function newWave(number, contract, activation) {
  return {
    number,
    status: "active",
    contract,
    contractAmendments: [],
    activation,
    assignments: {},
    evidenceIds: [],
    claimIds: [],
    dissentIds: [],
    meetingIds: [],
    gates: [],
    verdict: null,
    repairs: 0,
    startedAt: null,
    closedAt: null,
  };
}

function getWave(state, waveNumber) {
  const wave = state.waves[String(waveNumber)];
  invariant(wave, `Wave ${waveNumber} does not exist.`, "WAVE_NOT_FOUND");
  return wave;
}

export function projectRun(events) {
  invariant(events.length > 0 && events[0].type === "RunCreated", "Run cannot be projected without RunCreated.", "EVENT_HISTORY_INVALID");
  const created = events[0];
  const initialWave = newWave(1, created.data.contract, created.data.activation);
  initialWave.startedAt = created.timestamp;
  const state = {
    schemaVersion: 1,
    runId: created.runId,
    status: "active",
    level: created.data.level,
    levelName: created.data.activation.levelName,
    developmentIntent: created.data.developmentIntent,
    intent: created.data.intent,
    scopes: created.data.scopes,
    base: created.data.base,
    createdAt: created.timestamp,
    updatedAt: created.timestamp,
    currentWave: 1,
    waves: { "1": initialWave },
    evidence: {},
    claims: {},
    dissent: {},
    meetings: {},
    lanes: {},
    reservations: {},
    checkpoints: [],
    overrides: [],
    ephemeralRoles: {},
    modelRoutes: [],
    harnessExperiments: [],
    linkedLessons: [],
    linkedPrecedents: [],
    shipCases: [],
    metrics: {
      waves: 1,
      repairs: 0,
      rollbacks: 0,
      kills: 0,
      meetings: 0,
      agentsActivated: 0,
      gateFailures: 0,
      claimsContradicted: 0,
      evidenceRecorded: 0,
      tokenEstimate: 0,
      toolCalls: 0,
    },
    eventCount: 0,
    eventHead: null,
    warnings: [],
  };

  for (const event of events) {
    state.updatedAt = event.timestamp;
    switch (event.type) {
      case "RunCreated":
        break;
      case "ContractAmended": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.contractAmendments.push({
          at: event.timestamp,
          actor: event.actor,
          reason: event.data.reason,
          previous: wave.contract,
          next: event.data.contract,
        });
        wave.contract = event.data.contract;
        break;
      }
      case "WaveStarted": {
        const number = event.data.wave;
        state.waves[String(number)] = newWave(number, event.data.contract, event.data.activation);
        state.waves[String(number)].startedAt = event.timestamp;
        state.currentWave = number;
        state.metrics.waves += 1;
        break;
      }
      case "WaveClosed": {
        const wave = getWave(state, event.data.wave);
        wave.status = event.data.status ?? "closed";
        wave.closedAt = event.timestamp;
        break;
      }
      case "RoleActivated": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.assignments[event.data.assignmentId] = {
          assignmentId: event.data.assignmentId,
          role: event.data.role,
          actor: event.data.actor,
          model: event.data.model ?? null,
          reason: event.data.reason ?? null,
          ephemeral: event.data.ephemeral === true,
          status: "active",
          activatedAt: event.timestamp,
          completedAt: null,
          sections: null,
          evidenceIds: [],
          cost: null,
        };
        state.metrics.agentsActivated += 1;
        break;
      }
      case "RoleCompleted": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        const assignment = wave.assignments[event.data.assignmentId];
        if (assignment) {
          assignment.status = event.data.status ?? "completed";
          assignment.completedAt = event.timestamp;
          assignment.sections = event.data.sections;
          assignment.evidenceIds = event.data.evidenceIds ?? [];
          assignment.cost = event.data.cost ?? null;
        }
        break;
      }
      case "RoleFailed": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        const assignment = wave.assignments[event.data.assignmentId];
        if (assignment) {
          assignment.status = "failed";
          assignment.completedAt = event.timestamp;
          assignment.failure = event.data.reason;
        }
        break;
      }
      case "EvidenceRecorded": {
        state.evidence[event.data.id] = { ...event.data, recordedAt: event.timestamp, actor: event.actor };
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.evidenceIds = unique([...wave.evidenceIds, event.data.id]);
        state.metrics.evidenceRecorded += 1;
        break;
      }
      case "ClaimRecorded": {
        state.claims[event.data.id] = {
          ...event.data,
          status: "pending",
          reasons: [],
          recordedAt: event.timestamp,
          reconciledAt: null,
        };
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.claimIds = unique([...wave.claimIds, event.data.id]);
        break;
      }
      case "ClaimReconciled": {
        const claim = state.claims[event.data.id];
        if (claim) {
          claim.status = event.data.status;
          claim.reasons = event.data.reasons ?? [];
          claim.checkedEvidence = event.data.checkedEvidence ?? [];
          claim.reconciledAt = event.timestamp;
          claim.reconciledBy = event.actor;
          if (event.data.status === "contradicted") state.metrics.claimsContradicted += 1;
        }
        break;
      }
      case "DissentRecorded": {
        state.dissent[event.data.id] = {
          ...event.data,
          status: "open",
          recordedAt: event.timestamp,
          actor: event.actor,
        };
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.dissentIds = unique([...wave.dissentIds, event.data.id]);
        break;
      }
      case "DissentResolved": {
        const dissent = state.dissent[event.data.id];
        if (dissent) {
          dissent.status = "resolved";
          dissent.resolution = event.data.resolution;
          dissent.resolvedAt = event.timestamp;
          dissent.resolvedBy = event.actor;
        }
        break;
      }
      case "MeetingOpened": {
        state.meetings[event.data.id] = {
          ...event.data,
          status: "open",
          opinions: {},
          openedAt: event.timestamp,
          decision: null,
        };
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.meetingIds = unique([...wave.meetingIds, event.data.id]);
        state.metrics.meetings += 1;
        break;
      }
      case "MeetingOpinionRecorded": {
        const meeting = state.meetings[event.data.id];
        if (meeting) meeting.opinions[event.data.attendee] = { ...event.data, at: event.timestamp, actor: event.actor };
        break;
      }
      case "MeetingClosed": {
        const meeting = state.meetings[event.data.id];
        if (meeting) {
          meeting.status = "closed";
          meeting.decision = event.data.decision;
          meeting.closedAt = event.timestamp;
        }
        break;
      }
      case "GateEvaluated": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.gates.push({ ...event.data, at: event.timestamp, actor: event.actor });
        if (!event.data.eligible) state.metrics.gateFailures += 1;
        break;
      }
      case "VerdictRecorded": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.verdict = { ...event.data, at: event.timestamp, actor: event.actor };
        if (event.data.verdict === "REPAIR") {
          wave.repairs += 1;
          state.metrics.repairs += 1;
        }
        if (event.data.verdict === "ROLLBACK") state.metrics.rollbacks += 1;
        if (event.data.verdict === "KILL") state.metrics.kills += 1;
        break;
      }
      case "FounderOverrideRecorded":
        state.overrides.push({ ...event.data, at: event.timestamp, actor: event.actor });
        break;
      case "LaneRegistered":
        state.lanes[event.data.id] = { ...event.data, status: "active", registeredAt: event.timestamp };
        break;
      case "PathReserved":
        state.reservations[event.data.id] = { ...event.data, status: "active", reservedAt: event.timestamp };
        break;
      case "PathReleased": {
        const reservation = state.reservations[event.data.id];
        if (reservation) {
          reservation.status = "released";
          reservation.releasedAt = event.timestamp;
          reservation.releaseReason = event.data.reason;
        }
        break;
      }
      case "RollbackCheckpointRecorded":
        state.checkpoints.push({ ...event.data, at: event.timestamp, actor: event.actor });
        break;
      case "BudgetAdjusted": {
        const wave = getWave(state, event.data.wave ?? state.currentWave);
        wave.budgetAdjustment = { ...event.data, at: event.timestamp, actor: event.actor };
        break;
      }
      case "MetricRecorded":
        if (Number.isFinite(Number(event.data.value)) && Object.hasOwn(state.metrics, event.data.metric)) {
          state.metrics[event.data.metric] += Number(event.data.value);
        }
        break;
      case "EphemeralRoleProposed":
        state.ephemeralRoles[event.data.id] = { ...event.data, status: "proposed", proposedAt: event.timestamp };
        break;
      case "EphemeralRoleEvaluated": {
        const role = state.ephemeralRoles[event.data.id];
        if (role) Object.assign(role, { ...event.data, status: "evaluated", evaluatedAt: event.timestamp });
        break;
      }
      case "ModelRouteRecorded":
        state.modelRoutes.push({ ...event.data, at: event.timestamp, actor: event.actor });
        break;
      case "HarnessExperimentRecorded":
        state.harnessExperiments.push({ ...event.data, at: event.timestamp, actor: event.actor });
        break;
      case "LessonLinked":
        state.linkedLessons = unique([...state.linkedLessons, event.data.id]);
        break;
      case "PrecedentLinked":
        state.linkedPrecedents = unique([...state.linkedPrecedents, event.data.id]);
        break;
      case "ShipCasePrepared":
        state.shipCases.push({ ...event.data, at: event.timestamp, actor: event.actor });
        break;
      case "RunClosed":
        state.status = event.data.status ?? "closed";
        state.closedAt = event.timestamp;
        break;
      default:
        throw new BossError(`No projector for ${event.type}.`, "MISSING_PROJECTOR");
    }
  }
  state.eventCount = events.length;
  state.eventHead = events.at(-1).hash;
  return state;
}

export function appendRunEvent(root, runId, type, data, actor, role = null) {
  const normalized = normalizeRunId(runId);
  invariant(EVENT_TYPE_SET.has(type), `Unknown event type: ${type}`, "INVALID_EVENT");
  invariant(isNonEmptyString(actor), "Event actor is required.");
  const paths = bossPaths(root, normalized);

  return withDirectoryLock(paths.lock, () => {
    let events = [];
    if (existsSync(paths.events)) {
      const history = readRunEvents(root, normalized);
      events = history.events;
      if (history.truncatedTail !== null) {
        const recoveryPath = `${paths.events}.interrupted-tail-${Date.now()}.txt`;
        writeTextAtomic(recoveryPath, history.truncatedTail);
        writeTextAtomic(paths.events, `${events.map((item) => JSON.stringify(item)).join("\n")}\n`);
      }
    }
    if (type === "RunCreated") invariant(events.length === 0, `Run already exists: ${normalized}`, "RUN_EXISTS");
    else invariant(events.length > 0, `Run does not exist: ${normalized}`, "RUN_NOT_FOUND");

    const event = {
      schemaVersion: 1,
      sequence: events.length + 1,
      runId: normalized,
      type,
      timestamp: new Date().toISOString(),
      actor,
      role,
      data,
      previousHash: events.length ? events.at(-1).hash : null,
      hash: "",
    };
    event.hash = computeEventHash(event);
    validateEventShape(event);
    validateKnownPayload(event, root);
    appendLineSynced(paths.events, JSON.stringify(event));
    events = [...events, event];
    const state = projectRun(events);
    writeJsonAtomic(paths.state, state);
    return { event, state, paths };
  });
}

export function loadRun(root, runId) {
  const { events, truncatedTail, paths } = readRunEvents(root, runId);
  const state = projectRun(events);
  if (truncatedTail !== null) state.warnings.push("Interrupted final event line ignored; run remains at the previous committed event.");
  return { events, state, paths, truncatedTail };
}

export function projectionFresh(root, runId) {
  const { state, paths } = loadRun(root, runId);
  if (!existsSync(paths.state)) return { fresh: false, reason: "state.json is missing", expected: state, actual: null };
  let actual;
  try {
    actual = JSON.parse(readFileSync(paths.state, "utf8"));
  } catch {
    return { fresh: false, reason: "state.json is malformed", expected: state, actual: null };
  }
  const fresh = actual.eventCount === state.eventCount && actual.eventHead === state.eventHead;
  return { fresh, reason: fresh ? null : "state.json does not match the event head", expected: state, actual };
}
