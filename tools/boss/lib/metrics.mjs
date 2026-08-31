// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { existsSync, readdirSync } from "node:fs";

import { bossPaths, now, writeJsonAtomic } from "./core.mjs";
import { loadRun } from "./events.mjs";

export function aggregateMetrics(root) {
  const paths = bossPaths(root);
  const aggregate = {
    schemaVersion: 1,
    updatedAt: now(),
    runs: 0,
    waves: 0,
    repairs: 0,
    rollbacks: 0,
    kills: 0,
    meetings: 0,
    agentsActivated: 0,
    gateFailures: 0,
    claimsContradicted: 0,
    repeatedFindings: {},
    roleUsefulness: {},
    routingOutcomes: [],
  };
  const runIds = existsSync(paths.runs)
    ? readdirSync(paths.runs, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name)
    : [];
  for (const runId of runIds) {
    const { state } = loadRun(root, runId);
    aggregate.runs += 1;
    aggregate.waves += state.metrics.waves;
    aggregate.repairs += state.metrics.repairs;
    aggregate.rollbacks += state.metrics.rollbacks;
    aggregate.kills += state.metrics.kills;
    aggregate.meetings += state.metrics.meetings;
    aggregate.agentsActivated += state.metrics.agentsActivated;
    aggregate.gateFailures += state.metrics.gateFailures;
    aggregate.claimsContradicted += state.metrics.claimsContradicted;
    for (const wave of Object.values(state.waves)) {
      for (const assignment of Object.values(wave.assignments)) {
        const current = aggregate.roleUsefulness[assignment.role] ?? { activations: 0, completed: 0, concerns: 0 };
        current.activations += 1;
        if (["completed", "completed-with-concerns"].includes(assignment.status)) current.completed += 1;
        if (assignment.status === "completed-with-concerns") current.concerns += 1;
        aggregate.roleUsefulness[assignment.role] = current;
      }
    }
    aggregate.routingOutcomes.push(...state.modelRoutes);
  }
  writeJsonAtomic(paths.metrics, aggregate);
  return aggregate;
}
