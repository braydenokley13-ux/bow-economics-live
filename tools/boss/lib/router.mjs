// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { invariant, loadConfig } from "./core.mjs";

const NEED_WEIGHTS = Object.freeze({
  complexity: "deepReasoning",
  ambiguity: "deepReasoning",
  coding: "agenticCoding",
  longHorizon: "longHorizon",
  visual: "visualJudgment",
  speed: "fastBoundedWork",
});

function clampNeed(value) {
  const number = Number(value ?? 0);
  invariant(Number.isFinite(number) && number >= 0 && number <= 5, `Routing needs must be between 0 and 5; got ${value}.`);
  return number;
}

export function recommendModel(root, request) {
  const config = loadConfig(root);
  const needs = Object.fromEntries(Object.keys(NEED_WEIGHTS).map((key) => [key, clampNeed(request[key])]));
  const maxRelativeCost = request.maxRelativeCost === undefined ? 5 : clampNeed(request.maxRelativeCost);
  const minContextTokens = Number(request.minContextTokens ?? 0);
  const candidates = config.models.models
    .filter((model) => model.status === "active")
    .filter((model) => model.relativeCost <= maxRelativeCost)
    .filter((model) => model.contextTokens >= minContextTokens)
    .map((model) => {
      let capability = 0;
      let weight = 0;
      for (const [need, capabilityName] of Object.entries(NEED_WEIGHTS)) {
        const importance = needs[need];
        capability += importance * Number(model.capabilities[capabilityName] ?? 0);
        weight += importance;
      }
      const normalizedCapability = weight === 0 ? 0 : capability / weight;
      const risk = clampNeed(request.risk ?? 0);
      const costPenalty = model.relativeCost * Math.max(0.2, (5 - risk) / 5);
      const latencyPenalty = model.relativeLatency * (needs.speed / 5);
      const score = normalizedCapability * 10 - costPenalty - latencyPenalty;
      return { model, score: Number(score.toFixed(3)), normalizedCapability: Number(normalizedCapability.toFixed(3)) };
    })
    .sort((left, right) => right.score - left.score || left.model.relativeCost - right.model.relativeCost);

  invariant(candidates.length > 0, "No active model satisfies the routing constraints.", "NO_MODEL_ROUTE");
  const winner = candidates[0];
  const runnerUp = candidates[1];
  return {
    model: winner.model.id,
    provider: winner.model.provider,
    score: winner.score,
    confidence: runnerUp ? Math.min(1, Math.max(0.1, (winner.score - runnerUp.score + 1) / 5)) : 0.5,
    rationale: {
      needs,
      risk: clampNeed(request.risk ?? 0),
      maxRelativeCost,
      minContextTokens,
      capabilityScore: winner.normalizedCapability,
      priorOnly: true,
      historicalSamples: config.models.historicalPerformance.filter((entry) => entry.model === winner.model.id).length,
    },
    alternatives: candidates.slice(1, 4).map((candidate) => ({
      model: candidate.model.id,
      score: candidate.score,
    })),
  };
}
