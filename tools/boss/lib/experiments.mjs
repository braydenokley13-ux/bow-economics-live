// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { invariant, isNonEmptyString } from "./core.mjs";

const DIMENSIONS = ["informationGain", "productValue", "cost", "risk", "reversibility", "dependencyUnlock"];

function rating(candidate, key) {
  const value = Number(candidate[key]);
  invariant(Number.isFinite(value) && value >= 0 && value <= 5, `${candidate.name}.${key} must be an ordinal rating from 0 to 5.`, "INVALID_EXPERIMENT");
  return value;
}

export function rankExperiments(input) {
  invariant(["build-to-learn", "build-to-ship"].includes(input.developmentIntent), "Experiment evaluation needs build-to-learn or build-to-ship.", "INVALID_EXPERIMENT");
  invariant(Array.isArray(input.candidates) && input.candidates.length >= 2, "Compare at least two candidate next moves.", "INVALID_EXPERIMENT");
  const weights = input.developmentIntent === "build-to-learn"
    ? { informationGain: 2, productValue: 1, cost: -1.5, risk: -1, reversibility: 1, dependencyUnlock: 1 }
    : { informationGain: 0.75, productValue: 2, cost: -1, risk: -2, reversibility: 0.5, dependencyUnlock: 1 };
  const ranked = input.candidates.map((candidate) => {
    invariant(isNonEmptyString(candidate.name) && isNonEmptyString(candidate.evidenceGap), "Every candidate needs a name and evidenceGap.", "INVALID_EXPERIMENT");
    const ratings = Object.fromEntries(DIMENSIONS.map((key) => [key, rating(candidate, key)]));
    const score = DIMENSIONS.reduce((total, key) => total + ratings[key] * weights[key], 0);
    return {
      name: candidate.name,
      evidenceGap: candidate.evidenceGap,
      ratings,
      score,
      stopCondition: candidate.stopCondition ?? "Stop when the named evidence gap is answered.",
    };
  }).sort((left, right) => right.score - left.score || left.ratings.cost - right.ratings.cost);
  return {
    developmentIntent: input.developmentIntent,
    recommendation: ranked[0].name,
    ranked,
    note: "Scores compare explicit 0–5 ordinal judgments; they are a decision aid, not precise expected-value mathematics.",
  };
}
