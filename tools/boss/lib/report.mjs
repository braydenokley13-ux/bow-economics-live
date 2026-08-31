// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { existsSync } from "node:fs";
import path from "node:path";

import { bossPaths, gitSnapshot, writeTextAtomic } from "./core.mjs";

function bullets(values, empty = "None") {
  if (!values || values.length === 0) return `- ${empty}`;
  return values.map((value) => `- ${value}`).join("\n");
}

export function renderContract(state, waveNumber = state.currentWave) {
  const wave = state.waves[String(waveNumber)];
  const contract = wave.contract;
  return `# Wave ${waveNumber} contract\n\n` +
    `Run: \`${state.runId}\`  \nLevel: ${state.level} — ${state.levelName}\n\n` +
    `## Hypothesis\n\n${contract.hypothesis}\n\n` +
    `## Why this matters\n\n${contract.whyThisMatters}\n\n` +
    `## Uncertainties\n\n${bullets(contract.uncertainties)}\n\n` +
    `## Required evidence\n\n${bullets(contract.requiredEvidence)}\n\n` +
    `## Non-goals\n\n${bullets(contract.nonGoals)}\n\n` +
    `## Sacred constraints\n\n${bullets(contract.sacredConstraints)}\n\n` +
    `## Pass condition\n\n${contract.passCondition}\n\n` +
    `## Repair condition\n\n${contract.repairCondition}\n\n` +
    `## Rollback condition\n\n${contract.rollbackCondition}\n\n` +
    `## Kill condition\n\n${contract.killCondition}\n\n` +
    `## Iteration / failure budget\n\n` +
    `- Maximum waves: ${contract.iterationBudget.maximumWaves}\n` +
    `- Maximum repairs: ${contract.iterationBudget.maximumRepairs}\n` +
    `- Soft token budget: ${contract.iterationBudget.softTokenBudget || "unavailable"}\n` +
    `- Reason: ${contract.iterationBudget.reason}\n`;
}

export function renderSummary(state) {
  const wave = state.waves[String(state.currentWave)];
  const assignments = Object.values(wave.assignments);
  const evidence = wave.evidenceIds.map((id) => state.evidence[id]).filter(Boolean);
  const claims = wave.claimIds.map((id) => state.claims[id]).filter(Boolean);
  const dissent = wave.dissentIds.map((id) => state.dissent[id]).filter(Boolean);
  const latestGate = wave.gates.at(-1);
  const roleLines = assignments.length
    ? assignments.map((item) => `- ${item.role} — ${item.actor} — ${item.status}${item.model ? ` — ${item.model}` : ""}`)
    : ["- No roles activated yet"];
  const evidenceLines = evidence.length
    ? evidence.map((item) => `- ${item.id} — ${item.kind} — ${item.label}`)
    : ["- No evidence recorded yet"];
  const claimLines = claims.length
    ? claims.map((item) => `- ${item.id} — ${item.status} — ${item.statement}`)
    : ["- No claims recorded yet"];
  const dissentLines = dissent.length
    ? dissent.map((item) => `- ${item.id} — ${item.category}/${item.severity}/${item.status} — ${item.finding}`)
    : ["- No dissent recorded"];
  const gateLines = latestGate
    ? latestGate.checks.map((check) => `- ${check.passed ? "PASS" : "FAIL"} — ${check.id}: ${check.message}`)
    : ["- Gate not evaluated"];

  return `# BOW Boss run: ${state.runId}\n\n` +
    `Status: **${state.status}**  \n` +
    `Level: **${state.level} — ${state.levelName}**  \n` +
    `Intent: **${state.developmentIntent}**  \n` +
    `Wave: **${state.currentWave}**  \n` +
    `Base: \`${state.base.branch}@${state.base.commit}\`  \n` +
    `Event head: \`${state.eventCount}:${state.eventHead}\`  \n` +
    `Updated: ${state.updatedAt}\n\n` +
    `## Founder intent\n\n${state.intent}\n\n` +
    `## Hypothesis\n\n${wave.contract.hypothesis}\n\n` +
    `## Required roles\n\n${bullets(wave.activation.roles)}\n\n` +
    `## Role status\n\n${roleLines.join("\n")}\n\n` +
    `## Required evidence\n\n${bullets(wave.activation.evidence)}\n\n` +
    `## Evidence recorded\n\n${evidenceLines.join("\n")}\n\n` +
    `## Claim ledger\n\n${claimLines.join("\n")}\n\n` +
    `## Dissent\n\n${dissentLines.join("\n")}\n\n` +
    `## Latest gate\n\n${latestGate ? `Recommendation: **${latestGate.recommendation}**\n\n` : ""}${gateLines.join("\n")}\n\n` +
    `## Decision pending\n\n${wave.verdict ? `Recorded verdict: **${wave.verdict.verdict}**` : "A gate and founder decision are still pending."}\n`;
}

export function persistHumanViews(root, state) {
  const paths = bossPaths(root, state.runId);
  writeTextAtomic(paths.contract, renderContract(state));
  writeTextAtomic(paths.summary, renderSummary(state));
  return paths;
}

export function buildShipCase(root, state) {
  const gitState = gitSnapshot(root);
  const wave = state.waves[String(state.currentWave)];
  const latestGate = wave.gates.at(-1);
  const analyst = Object.values(wave.assignments).find((assignment) => assignment.role === "product-analyst" && ["completed", "completed-with-concerns"].includes(assignment.status));
  const critics = Object.values(wave.assignments).filter((assignment) => assignment.role !== "builder" && assignment.role !== "lead-integrator");
  const limitations = Object.values(state.dissent).filter((item) => item.status === "open");
  const rollback = state.checkpoints.at(-1);

  const markdown = `# BOW Boss ship case\n\n` +
    `Run: \`${state.runId}\`  \nWave: ${state.currentWave}  \nPrepared commit: \`${gitState.commit}\`  \nBranch: \`${gitState.branch}\`\n\n` +
    `## Objective\n\n${state.intent}\n\n` +
    `## Hypothesis\n\n${wave.contract.hypothesis}\n\n` +
    `## Meaningful diff\n\nBase \`${state.base.commit}\` → head \`${gitState.commit}\`. See recorded \`git-diff\` evidence.\n\n` +
    `## Testing and browser evidence\n\n${bullets(wave.evidenceIds.map((id) => `${id}: ${state.evidence[id]?.kind ?? "missing"} — ${state.evidence[id]?.label ?? "missing"}`))}\n\n` +
    `## Analyst verdict\n\n${analyst ? `Recommendation: **${analyst.sections.recommendation ?? "not stated"}**\n\nBiggest failure: ${analyst.sections["biggest-failure"] ?? "not stated"}` : "Independent Analyst not completed."}\n\n` +
    `## Specialist verdicts\n\n${bullets(critics.map((item) => `${item.role}: ${item.status}`))}\n\n` +
    `## Gate\n\n${latestGate ? `Eligible: **${latestGate.eligible ? "yes" : "no"}**  \nRecommendation: **${latestGate.recommendation}**  \nBlocking failures: ${latestGate.blockingFailures.join(", ") || "none"}` : "No gate recorded."}\n\n` +
    `## Known limitations and unresolved dissent\n\n${bullets(limitations.map((item) => `${item.category}/${item.severity}: ${item.finding}`))}\n\n` +
    `## Founder overrides\n\n${bullets(state.overrides.map((item) => `${item.subject}: ${item.decision}; risk accepted: ${item.riskAccepted}`))}\n\n` +
    `## Rollback path\n\n${rollback ? `Checkpoint \`${rollback.commit}\`: ${rollback.reason}` : `Return to base \`${state.base.commit}\`; no later checkpoint recorded.`}\n\n` +
    `## Boss recommendation\n\n**${latestGate?.recommendation ?? "REPAIR"}**\n\n` +
    `The founder controls final merge to main. This document prepares the case; it does not merge or ship.\n`;

  return {
    markdown,
    metadata: {
      runId: state.runId,
      wave: state.currentWave,
      branch: gitState.branch,
      commit: gitState.commit,
      eligible: latestGate?.eligible === true,
      recommendation: latestGate?.recommendation ?? "REPAIR",
      rollbackCommit: rollback?.commit ?? state.base.commit,
    },
  };
}

export function writeShipCase(root, state) {
  const paths = bossPaths(root, state.runId);
  const shipCase = buildShipCase(root, state);
  const fileName = `wave-${state.currentWave}-${shipCase.metadata.commit.slice(0, 12)}.md`;
  const filePath = path.join(paths.shipCases, fileName);
  if (!existsSync(filePath)) writeTextAtomic(filePath, shipCase.markdown);
  return { ...shipCase, filePath, relativePath: path.relative(root, filePath).replaceAll(path.sep, "/") };
}
