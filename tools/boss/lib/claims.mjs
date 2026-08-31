// Ported from bow-decision-challenges tools/boss/lib/claims.mjs @ 9313c91.
// Economics changes: hard contradictions are tracked structurally while reasons
// accumulate (the source detected them by regexing English reason strings);
// the DC-specific "ai-off-works" kind is removed; "e2e-pass" joins the command
// family; "sports-reality-current" and "teacher-transferable" gain
// deterministic screens (a screen can contradict a claim, but confirmation of
// judgment claims still requires an independent read-only reviewer).
import { existsSync } from "node:fs";
import path from "node:path";

import { hashFile, invariant, isNonEmptyString, loadConfig } from "./core.mjs";

function evidenceFileCheck(root, evidence) {
  if (!evidence.path) return { valid: true, reason: null };
  const absolute = path.resolve(root, evidence.path);
  if (!existsSync(absolute)) return { valid: false, reason: `Evidence file is missing: ${evidence.path}` };
  if (evidence.sha256 && hashFile(absolute) !== evidence.sha256) {
    return { valid: false, reason: `Evidence hash changed: ${evidence.path}` };
  }
  return { valid: true, reason: null };
}

export function verifyEvidenceIntegrity(root, evidence) {
  invariant(evidence && isNonEmptyString(evidence.id), "Evidence record is invalid.");
  return evidenceFileCheck(root, evidence);
}

function evidenceHasKind(evidence, kind) {
  const tags = Array.isArray(evidence.metadata?.tags) ? evidence.metadata.tags : [];
  return evidence.kind === kind || tags.includes(kind);
}

function commandPassed(evidence) {
  const exitCode = evidence.metadata?.exitCode;
  return Number.isInteger(exitCode) && exitCode === 0;
}

const COMMAND_CLAIM_KINDS = Object.freeze({
  "tests-pass": "test",
  "build-pass": "build",
  "lint-pass": "lint",
  "typecheck-pass": "typecheck",
  "ci-pass": "ci",
  "e2e-pass": "e2e",
});

export function reconcileClaimAutomatically(root, state, claimId) {
  const claim = state.claims[claimId];
  invariant(claim, `Unknown claim: ${claimId}`, "CLAIM_NOT_FOUND");
  const reasons = [];
  const evidence = [];
  let hardContradiction = false;
  const flag = (reason, hard = true) => {
    reasons.push(reason);
    if (hard) hardContradiction = true;
  };

  for (const evidenceId of claim.evidenceIds ?? []) {
    const record = state.evidence[evidenceId];
    if (!record) {
      flag(`Referenced evidence does not exist: ${evidenceId}`);
      continue;
    }
    const integrity = verifyEvidenceIntegrity(root, record);
    if (!integrity.valid) flag(integrity.reason);
    evidence.push(record);
  }
  if (evidence.length === 0) flag("Claim has no recorded evidence.");

  let deterministic = true;
  if (Object.hasOwn(COMMAND_CLAIM_KINDS, claim.kind)) {
    const expected = COMMAND_CLAIM_KINDS[claim.kind];
    const matching = evidence.filter((record) => evidenceHasKind(record, expected));
    if (matching.length === 0) flag(`No ${expected} command evidence is linked.`);
    for (const record of matching) {
      if (!commandPassed(record)) flag(`${expected} evidence ${record.id} has a nonzero or missing exit code.`);
    }
  } else if (claim.kind === "viewport-verified") {
    const viewport = claim.metadata?.viewport;
    if (!isNonEmptyString(viewport)) flag("Viewport claim does not name metadata.viewport.");
    const matching = evidence.some((record) =>
      ["screenshot", "browser-trace"].includes(record.kind) && record.metadata?.viewport === viewport,
    );
    if (!matching) flag(`No screenshot or browser trace proves viewport ${viewport ?? "(missing)"}.`);
  } else if (claim.kind === "sports-reality-current") {
    // E3: a real-world roster/contract/rule claim must be dated and fresh.
    const maxAgeDays = Number(loadConfig(root).project.sportsRealityMaxAgeDays ?? 400);
    const reports = evidence.filter((record) => evidenceHasKind(record, "sports-reality-report"));
    if (reports.length === 0) flag("No sports-reality-report evidence is linked.");
    const reference = Date.parse(claim.recordedAt ?? new Date().toISOString());
    for (const record of reports) {
      const verifiedAsOf = record.metadata?.verifiedAsOf;
      if (!isNonEmptyString(verifiedAsOf) || !Number.isFinite(Date.parse(verifiedAsOf))) {
        flag(`Sports-reality evidence ${record.id} has no verifiedAsOf source date.`);
      } else if (reference - Date.parse(verifiedAsOf) > maxAgeDays * 24 * 60 * 60 * 1000) {
        flag(`Sports-reality evidence ${record.id} was verified ${verifiedAsOf}, older than ${maxAgeDays} days.`);
      }
    }
    // Freshness screens deterministically; factual correctness still needs the
    // Sports Reality Director's judgment.
    deterministic = false;
    if (!hardContradiction) flag("Real-world accuracy itself requires Sports Reality review; dating alone cannot confirm it.", false);
  } else if (claim.kind === "teacher-transferable") {
    // E12: transfer evidence must be fresh-context and teacher-facing, not
    // builder notes.
    const reports = evidence.filter((record) => evidenceHasKind(record, "teacher-transfer-report"));
    if (reports.length === 0) flag("No teacher-transfer-report evidence is linked.");
    for (const record of reports) {
      if (record.metadata?.freshContext !== true) {
        flag(`Teacher-transfer evidence ${record.id} is not marked freshContext; builder-anchored review does not prove transfer.`);
      }
      const tags = Array.isArray(record.metadata?.tags) ? record.metadata.tags : [];
      if (tags.includes("builder-notes")) {
        flag(`Teacher-transfer evidence ${record.id} lives in builder notes, not teacher-facing material.`);
      }
    }
    deterministic = false;
    if (!hardContradiction) flag("Transfer quality itself requires independent Teacher Transfer judgment.", false);
  } else {
    deterministic = false;
    flag("This claim requires independent judgment; evidence existence alone cannot confirm it.", false);
  }

  return {
    id: claimId,
    status: hardContradiction ? "contradicted" : deterministic && reasons.length === 0 ? "confirmed" : "not-confirmed",
    reasons,
    checkedEvidence: evidence.map((record) => record.id),
    deterministic,
  };
}
