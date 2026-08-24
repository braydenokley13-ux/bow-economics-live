/**
 * The canonical phase vocabulary for the classroom loop.
 *
 * Every LessonModule declares its own ordered subset of this list — it does
 * not have to use all ten, and it can skip around the vocabulary as long as
 * the subset it picks stays in this relative order. The runtime never
 * hard-codes lesson content; this list is the one shared language between
 * the runtime, the teacher console, and every lesson module.
 */
export const CANONICAL_PHASES = [
  "LOBBY",
  "HOOK",
  "PLAY",
  "REVEAL",
  "CONSEQUENCE",
  "ADAPT",
  "COUNTERFACTUAL",
  "ARGUE",
  "SYNTHESIS",
  "COMPLETE",
] as const;

export type CanonicalPhase = (typeof CANONICAL_PHASES)[number];

export const isCanonicalPhase = (value: unknown): value is CanonicalPhase =>
  typeof value === "string" && (CANONICAL_PHASES as readonly string[]).includes(value);

const CANONICAL_INDEX: ReadonlyMap<CanonicalPhase, number> = new Map(
  CANONICAL_PHASES.map((phase, index) => [phase, index]),
);

/** Position of a phase in the canonical vocabulary (not in any one lesson's subset). */
export const canonicalIndex = (phase: CanonicalPhase): number => CANONICAL_INDEX.get(phase) ?? -1;

/**
 * True when a lesson's declared phase list is a strictly increasing subsequence
 * of the canonical order. This is the one rule a LessonModule's `phases` must
 * satisfy — the runtime rejects registration otherwise.
 */
export function isOrderedSubsequence(phases: readonly CanonicalPhase[]): boolean {
  if (phases.length === 0) return false;
  let last = -1;
  for (const phase of phases) {
    const index = canonicalIndex(phase);
    if (index <= last) return false;
    last = index;
  }
  return true;
}
