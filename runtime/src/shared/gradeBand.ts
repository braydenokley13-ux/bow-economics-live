/**
 * THE GRADE BAND.
 *
 * Ramaz runs Sports Business I as two separate classes — grades 5-6 and grades
 * 7-8 — and D22 sets the model: ONE sports-business world, one economic engine,
 * one consequence model and one classroom runtime, with a profile selecting
 * copy, scaffolding, visible information, reasoning demand and vocabulary
 * timing. Not two products, and specifically not the same worksheet with
 * harder numbers.
 *
 * WHY THIS EXISTS NOW AND NOT BEFORE. D38 refused to build this seam while no
 * second band existed to switch on, and named the exact attachment points a
 * future band would need: `createSession` input carried onto the session row,
 * and the `initialState` context each module already receives. That refusal was
 * right and the naming was nearly right. A platform audit found a THIRD point
 * D38 did not name, and it is the one that can actually hurt a class: the
 * cross-lesson seed envelope. Without a band stamped on it, a 7-8 room seeded
 * from a 5-6 room accepts the carry silently and there is nothing anywhere in
 * the runtime able to notice. So the seam is three points, and D38 is amended
 * rather than quietly exceeded.
 *
 * WHAT A BAND IS NOT. It is not a difficulty setting and it is not a content
 * fork. The economics is identical in both bands — the same reducer resolves
 * the same market by the same rules, and a test asserts that differentially.
 * What differs is what a desk is shown, how much of the reasoning the product
 * does for it, and what it is asked to defend afterwards.
 */

export const GRADE_BANDS = ["5-6", "7-8"] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];

export const DEFAULT_BAND: GradeBand = "5-6";

export const isGradeBand = (v: unknown): v is GradeBand =>
  typeof v === "string" && (GRADE_BANDS as readonly string[]).includes(v);

/** Read a band off untrusted input, falling back rather than throwing. */
export const bandOrDefault = (v: unknown): GradeBand => (isGradeBand(v) ? v : DEFAULT_BAND);

/**
 * The profile, as a set of switches a module reads rather than a set of
 * strings it prints.
 *
 * Every field here is grounded in the pedagogy evidence gathered for this
 * module (`docs/gauntlet/module-1/rebuild/NBA_FINANCIAL_TRUTH.md` §6), not in
 * an intuition about what younger students can handle.
 */
export type GradeProfile = {
  readonly band: GradeBand;

  /**
   * Decision-relevant variables visible in one choice.
   *
   * §6.4 rule 1: two at 5-6, three to four at 7-8, never more than four at
   * either. In this module that is the difference between choosing WHO and HOW
   * MUCH, and also choosing WHICH TOOL.
   */
  readonly maxVariables: 2 | 3 | 4;

  /**
   * Words in any blocking instruction — a screen a pair must read before they
   * can act.
   *
   * §6.4 rule 2, derived from oral-reading-fluency norms: a 40-word screen is
   * about 25-35 seconds at the tenth percentile of grade 5. The 7-8 budget is
   * 70. Depth at 7-8 is bought with conceptual density, never with word count.
   */
  readonly maxBlockingWords: 40 | 70;

  /**
   * Whether the product runs the first round WITH the class before letting them
   * play it alone.
   *
   * This is the highest-stakes switch in the file and the least intuitive. The
   * problem-solving-before-instruction meta-analysis (Sinha & Kapur 2021, 53
   * studies) splits at exactly this band boundary: g = +0.50 for grades 6-10
   * and g = -0.09 for grades 2-5. BOW's whole loop is experience-then-name.
   * Running it UNSCAFFOLDED at 5-6 is running the one condition the evidence
   * found negative, so at 5-6 the exploration phase is scaffolded — a worked
   * first day, a visible constraint, and the product naming the trade-off the
   * pair is facing — while 7-8 meets the constraint cold. Both bands keep the
   * consolidation; only the front half is released.
   */
  readonly scaffoldFirstRound: boolean;

  /**
   * Whether the product NAMES the trade-off a pair is currently facing, in
   * words, while they are facing it.
   *
   * §6.4 rule 3. At 7-8 the same sentence would do the reasoning the student is
   * there to do.
   */
  readonly namesTheTradeoff: boolean;

  /**
   * Whether the product RUNS the counterfactual, or asks the student to
   * construct it.
   *
   * §6.4 rule 8, and the developmental evidence that mature counterfactual
   * reasoning is not reliable in all children before about twelve.
   */
  readonly showsCounterfactual: boolean;

  /**
   * Whether any percentage, ratio or student-computed rate may be rendered.
   *
   * §6.2 is unambiguous and this is a hard gate, not a preference: grade 5 has
   * NO percent standard, no ratio standard and no negative-number standard.
   * Percent arrives at grade 6, signed arithmetic at 7, multi-step percent at
   * 7, rate of change at 8.
   */
  readonly allowsPercentages: boolean;

  /**
   * Whether a running total may ever be shown as a negative number.
   *
   * Always false at 5-6 (§6.2 again): going past a line is a BLOCKED action
   * with a plain-language reason, never a minus sign.
   */
  readonly allowsNegatives: boolean;

  /** New economic terms this lesson may name. §6.4 rule 10: two, then three to four. */
  readonly maxNewTerms: 2 | 3 | 4;

  /**
   * What a desk owes at the end.
   *
   * §6.4 rule 9, tracking the CCSS shift that happens at exactly the 5/6
   * boundary: W.5.1 asks for an opinion supported by reasons, W.6.1 for an
   * argument supported by evidence, W.7.1a adds acknowledging an opposing
   * claim. So 5-6 makes two moves and 7-8 makes three, the third being the
   * strongest case against their own decision.
   */
  readonly argumentMoves: 2 | 3;

  /**
   * Whether the debrief must converge on one nameable mechanism.
   *
   * §6.4 rule 5. At 5-6 it must — "both teams were right" is the failure mode.
   * At 7-8 a defensible disagreement is allowed, but it must be adjudicated by
   * evidence rather than left at everyone having an opinion, which is the
   * multiplist failure this age is most prone to.
   */
  readonly debriefMustConverge: boolean;
};

const PROFILES: Readonly<Record<GradeBand, GradeProfile>> = {
  "5-6": {
    band: "5-6",
    maxVariables: 2,
    maxBlockingWords: 40,
    scaffoldFirstRound: true,
    namesTheTradeoff: true,
    showsCounterfactual: true,
    allowsPercentages: false,
    allowsNegatives: false,
    maxNewTerms: 2,
    argumentMoves: 2,
    debriefMustConverge: true,
  },
  "7-8": {
    band: "7-8",
    maxVariables: 3,
    maxBlockingWords: 70,
    scaffoldFirstRound: false,
    namesTheTradeoff: false,
    showsCounterfactual: false,
    allowsPercentages: true,
    allowsNegatives: true,
    maxNewTerms: 4,
    argumentMoves: 3,
    debriefMustConverge: false,
  },
};

export const profileFor = (band: GradeBand): GradeProfile => PROFILES[band];
