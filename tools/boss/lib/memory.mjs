// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import {
  invariant,
  isNonEmptyString,
  normalizeId,
  now,
  readJson,
  writeJsonAtomic,
} from "./core.mjs";

const LESSON_STATUSES = [
  "observation",
  "provisional",
  "repeated-evidence",
  "candidate-precedent",
  "founder-approved-rule",
  "retired",
];

export function addLesson(indexPath, input) {
  const index = readJson(indexPath);
  const id = normalizeId(input.id, "lesson id");
  invariant(!index.lessons.some((lesson) => lesson.id === id), `Lesson exists: ${id}`, "LESSON_EXISTS");
  invariant(isNonEmptyString(input.statement) && input.statement.length >= 10, "Lesson statement is too short.", "INVALID_LESSON");
  invariant(Array.isArray(input.scope) && input.scope.length > 0, "Lesson scope is required.", "INVALID_LESSON");
  invariant(Array.isArray(input.sourceRuns) && input.sourceRuns.length > 0, "Lesson needs a source run.", "INVALID_LESSON");
  invariant(Array.isArray(input.evidence) && input.evidence.length > 0, "Lesson needs evidence.", "INVALID_LESSON");
  const confidence = Number(input.confidence);
  invariant(Number.isFinite(confidence) && confidence >= 0 && confidence <= 1, "Lesson confidence must be 0–1.", "INVALID_LESSON");
  const lesson = {
    id,
    statement: input.statement,
    status: "observation",
    scope: input.scope,
    confidence,
    sourceRuns: [...new Set(input.sourceRuns)],
    evidence: [...new Set(input.evidence)],
    counterexamples: input.counterexamples ?? [],
    createdAt: now(),
    updatedAt: now(),
    reviewAt: input.reviewAt,
    founderApproval: null,
    history: [],
  };
  invariant(Number.isFinite(Date.parse(lesson.reviewAt)), "Lesson reviewAt must be an ISO date.", "INVALID_LESSON");
  index.lessons.push(lesson);
  writeJsonAtomic(indexPath, index);
  return lesson;
}

export function promoteLesson(indexPath, id, nextStatus, input = {}) {
  const index = readJson(indexPath);
  const lesson = index.lessons.find((candidate) => candidate.id === id);
  invariant(lesson, `Unknown lesson: ${id}`, "LESSON_NOT_FOUND");
  invariant(LESSON_STATUSES.includes(nextStatus), `Unknown lesson status: ${nextStatus}`, "INVALID_LESSON_STATUS");
  const current = LESSON_STATUSES.indexOf(lesson.status);
  const next = LESSON_STATUSES.indexOf(nextStatus);
  invariant(nextStatus === "retired" || next === current + 1, `Lesson promotion must advance one maturity step; ${lesson.status} → ${nextStatus} is not allowed.`, "LESSON_PROMOTION_BYPASS");
  if (nextStatus === "repeated-evidence") {
    const runs = new Set([...(lesson.sourceRuns ?? []), ...(input.sourceRuns ?? [])]);
    invariant(runs.size >= 2, "Repeated-evidence requires at least two distinct source runs.", "LESSON_EVIDENCE_INSUFFICIENT");
    lesson.sourceRuns = [...runs];
    lesson.evidence = [...new Set([...(lesson.evidence ?? []), ...(input.evidence ?? [])])];
  }
  if (nextStatus === "founder-approved-rule") {
    invariant(isNonEmptyString(input.founder) && isNonEmptyString(input.reason), "Permanent rule promotion requires named founder approval and reason.", "FOUNDER_APPROVAL_REQUIRED");
    lesson.founderApproval = { founder: input.founder, reason: input.reason, at: now() };
  }
  lesson.history.push({ from: lesson.status, to: nextStatus, at: now(), reason: input.reason ?? null });
  lesson.status = nextStatus;
  lesson.updatedAt = now();
  writeJsonAtomic(indexPath, index);
  return lesson;
}

export function addPrecedent(indexPath, input) {
  const index = readJson(indexPath);
  const id = normalizeId(input.id, "precedent id");
  invariant(!index.precedents.some((precedent) => precedent.id === id), `Precedent exists: ${id}`, "PRECEDENT_EXISTS");
  for (const field of ["issue", "decision", "context", "outcome", "reviewTrigger"]) {
    invariant(isNonEmptyString(input[field]), `Precedent ${field} is required.`, "INVALID_PRECEDENT");
  }
  for (const field of ["alternatives", "evidence", "scope"]) {
    invariant(Array.isArray(input[field]) && input[field].length > 0, `Precedent ${field} is required.`, "INVALID_PRECEDENT");
  }
  const confidence = Number(input.confidence);
  invariant(Number.isFinite(confidence) && confidence >= 0 && confidence <= 1, "Precedent confidence must be 0–1.", "INVALID_PRECEDENT");
  const precedent = {
    id,
    issue: input.issue,
    decision: input.decision,
    context: input.context,
    alternatives: input.alternatives,
    evidence: input.evidence,
    dissent: input.dissent ?? [],
    outcome: input.outcome,
    scope: input.scope,
    confidence,
    active: true,
    reviewTrigger: input.reviewTrigger,
    reviewAt: input.reviewAt ?? null,
    createdAt: now(),
  };
  if (precedent.reviewAt !== null) invariant(Number.isFinite(Date.parse(precedent.reviewAt)), "Precedent reviewAt must be an ISO date.", "INVALID_PRECEDENT");
  index.precedents.push(precedent);
  writeJsonAtomic(indexPath, index);
  return precedent;
}

export function retrievePrecedents(indexPath, scopes, at = new Date()) {
  const index = readJson(indexPath);
  const wanted = new Set(scopes);
  return index.precedents
    .filter((precedent) => precedent.active)
    .map((precedent) => {
      const overlap = precedent.scope.filter((scope) => wanted.has(scope));
      const stale = precedent.reviewAt ? Date.parse(precedent.reviewAt) < at.getTime() : false;
      return { ...precedent, overlap, applicable: overlap.length > 0 && !stale, stale };
    })
    .filter((precedent) => precedent.overlap.length > 0)
    .sort((left, right) => Number(right.applicable) - Number(left.applicable) || right.confidence - left.confidence);
}
