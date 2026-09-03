/**
 * THE CLAIM ATOM — a printed number that can be re-derived and disagreed with.
 *
 * A lesson's reveal is made of sentences about money. Each sentence asserts
 * things beyond the digits it contains: that a figure is positive, that it is
 * inside a bound, that "most" or "nobody" or "more than" is a true description
 * of the room. Prose cannot be tested. An atom can: it carries the computed
 * `value`, the exact substring `rendered` FROM that value, and the relations
 * the surrounding sentence claims — so an external audit can recompute each
 * relation independently and fail on disagreement.
 *
 * WHY THIS FILE EXISTS RATHER THAN A FOURTH COPY. The pattern was invented in
 * `modules/hostTheLeague.ts` and hand-copied into `modules/writeTheRule.ts`,
 * where it had ALREADY DRIFTED before anyone noticed: the copy dropped the
 * `board` field, so the projector/teacher split that D24 exists to provide was
 * structurally unavailable in that lesson. `modules/fullHouse.ts` — the module
 * with the strongest loop in the product — has no atoms at all. A third and
 * fourth consumer arriving (Module 1's three lessons) is exactly the threshold
 * CLAUDE.md §12 names for extraction: not two data points, but a defect that
 * has already had to be reasoned about twice.
 *
 * WHAT THIS IS NOT. It is not an economics engine and must never become one.
 * Nothing here computes a quantity, formats a currency, decides what a number
 * MEANS, or knows anything about basketball. It is a container plus a
 * comparison. Every value that enters it was computed by a lesson's own
 * reducer, which is the only place economics is allowed to live.
 *
 * The existing copies in `hostTheLeague.ts` and `writeTheRule.ts` are
 * deliberately left in place: migrating a shipped, gate-passed lesson to a new
 * import for tidiness is the refactor CLAUDE.md §25 forbids. `claims.test.ts`
 * instead asserts that this implementation and the original agree, so the two
 * cannot drift apart in silence the way the first two copies did.
 */

/** What the surrounding sentence asserts about the sign of a value. */
export type ClaimSign = "positive" | "negative" | "nonNegative" | "zero" | "any";

export type ClaimAtom = {
  /** Stable id. The audit dispatches its independent recomputation on this. */
  id: string;
  /** The exact substring the surface must contain. Rendered FROM `value`. */
  rendered: string;
  /** The computed number the substring was built from. */
  value: number;
  /** `percent1` is a one-decimal percentage. */
  format: "money" | "percent" | "percent1" | "int";
  /** The sign the surrounding sentence asserts about `value`. */
  assertsSign: ClaimSign;
  /** Hard bounds the value must obey for the sentence to be printable at all. */
  bounds?: { min?: number; max?: number };
  /**
   * A quantifier or causal word the sentence uses, with the predicate it
   * claims. The audit recomputes the predicate independently and fails on
   * disagreement; `word` must be present in the rendered surface.
   */
  quantifier?: { word: string; claims: boolean };
  /**
   * A phrase that must NOT appear anywhere in the rendered surface. This is how
   * a self-contradiction is made falsifiable rather than proof-read.
   */
  absent?: string;
};

/**
 * A computed finding, in two renderings (D24).
 *
 * `text` is authoritative: every clause the economics needs, and the string the
 * claim audit recomputes against. `board` is what the PROJECTOR is allowed to
 * hold — the finding itself, short enough to read from the back row in one
 * breath. Deleting reasoning to fit a frame is forbidden; so is putting a
 * paragraph on a wall a class is meant to read in one look. A surface with no
 * `board` rendering keeps using `text`.
 */
export type Claimed = { text: string; board?: string; claims: readonly ClaimAtom[] };

/** What the projector shows for a finding: its short rendering, or its only one. */
export const onBoard = (c: Claimed): string => c.board ?? c.text;

/** Whole dollars, grouped. Never a negative sign — a lesson says "short by", not "-$4M". */
const moneyOf = (value: number): string => "$" + Math.abs(Math.round(value)).toLocaleString("en-US");

export function renderClaim(value: number, format: ClaimAtom["format"]): string {
  switch (format) {
    case "money":
      return moneyOf(value);
    case "percent":
      return `${Math.round(value)}%`;
    case "percent1":
      return `${Math.round(value * 10) / 10}%`;
    case "int":
      return `${Math.round(value)}`;
  }
}

/**
 * Build a claim atom. The ONLY way a number reaches a claim string: callers
 * interpolate `atom.rendered`, never a separately formatted copy of the value.
 */
export function claim(
  id: string,
  value: number,
  format: ClaimAtom["format"],
  opts: { assertsSign?: ClaimSign; bounds?: { min?: number; max?: number } } = {},
): ClaimAtom {
  return {
    id,
    rendered: renderClaim(value, format),
    value,
    format,
    assertsSign: opts.assertsSign ?? "any",
    ...(opts.bounds ? { bounds: opts.bounds } : {}),
  };
}

/** A claim about a WORD rather than a number — the quantifier limb of the audit. */
export function claimWord(id: string, word: string, claims: boolean, absent?: string): ClaimAtom {
  return {
    id,
    rendered: word,
    value: claims ? 1 : 0,
    format: "int",
    assertsSign: "any",
    quantifier: { word, claims },
    ...(absent === undefined ? {} : { absent }),
  };
}

/** One claim-carrying surface: the rendered text plus every relation it asserts. */
export type ClaimSurface = { surface: string; text: string; claims: readonly ClaimAtom[] };

/* ------------------------------------------------------------- the audit -- */

export type AuditFinding = {
  readonly surface: string;
  readonly atom: string;
  readonly limb: "render" | "sign" | "bounds" | "quantifier" | "absent" | "coverage";
  readonly detail: string;
};

/**
 * Audit one surface's rendered text against every relation it claims.
 *
 * This is the generic half — the half that needs no knowledge of any lesson.
 * A lesson's own harness adds the limb this cannot do: independently
 * RECOMPUTING each atom's `value` from a replayed reducer, and comparing. That
 * limb is where a wrong number is caught; this one catches a number that was
 * computed correctly and then printed, described, or contradicted wrongly.
 */
/**
 * An INDEPENDENT recomputation of what an atom claims, supplied by a lesson's
 * own harness and keyed by atom id.
 *
 * Without this, the quantifier limb is tautological: `claimWord` sets
 * `value = claims ? 1 : 0`, so asking whether they agree asks whether a
 * constructor did its job. The limb only has teeth when a SECOND derivation of
 * the same predicate — computed from a replayed reducer, by different code than
 * the one that built the sentence — is compared against the one the surface
 * printed. Same for a numeric atom: `expected` is the value the harness got
 * when it recomputed the quantity itself.
 *
 * A lesson that supplies none of these gets the render, sign, bounds, absent
 * and coverage limbs, which are real but weaker. A lesson whose reveal carries
 * an economic argument owes the recomputation.
 */
export type Recomputed = Readonly<Record<string, { value?: number; predicate?: boolean }>>;

export function auditSurface(s: ClaimSurface, recomputed: Recomputed = {}): readonly AuditFinding[] {
  const out: AuditFinding[] = [];
  const push = (atom: string, limb: AuditFinding["limb"], detail: string) =>
    out.push({ surface: s.surface, atom, limb, detail });

  for (const atom of s.claims) {
    // RENDER: the substring must actually be in the text, and must be the one
    // the value produces. A caller who formats a second copy by hand can print
    // a number that no longer tracks the model.
    const expected = atom.quantifier ? atom.rendered : renderClaim(atom.value, atom.format);
    if (expected !== atom.rendered) {
      push(atom.id, "render", `atom carries "${atom.rendered}" but its value renders as "${expected}"`);
    }
    if (!s.text.includes(atom.rendered)) {
      push(atom.id, "render", `"${atom.rendered}" does not appear in the rendered surface`);
    }

    // SIGN: what the sentence around the number asserts about it.
    const v = atom.value;
    const signOk =
      atom.assertsSign === "any" ||
      (atom.assertsSign === "positive" && v > 0) ||
      (atom.assertsSign === "negative" && v < 0) ||
      (atom.assertsSign === "nonNegative" && v >= 0) ||
      (atom.assertsSign === "zero" && v === 0);
    if (!signOk) push(atom.id, "sign", `sentence asserts ${atom.assertsSign} but value is ${v}`);

    if (atom.bounds) {
      if (atom.bounds.min !== undefined && v < atom.bounds.min) {
        push(atom.id, "bounds", `value ${v} is below the stated minimum ${atom.bounds.min}`);
      }
      if (atom.bounds.max !== undefined && v > atom.bounds.max) {
        push(atom.id, "bounds", `value ${v} is above the stated maximum ${atom.bounds.max}`);
      }
    }

    if (atom.quantifier) {
      if (!s.text.includes(atom.quantifier.word)) {
        push(atom.id, "quantifier", `the word "${atom.quantifier.word}" is claimed but not present`);
      }
      const asserted = atom.value === 1;
      if (asserted !== atom.quantifier.claims) {
        push(
          atom.id,
          "quantifier",
          `the predicate behind "${atom.quantifier.word}" is ${atom.quantifier.claims} but the atom's value says ${asserted}`,
        );
      }
      // The limb with teeth: a SECOND derivation of the same predicate.
      const independent = recomputed[atom.id]?.predicate;
      if (independent !== undefined && independent !== atom.quantifier.claims) {
        push(
          atom.id,
          "quantifier",
          `the surface says "${atom.quantifier.word}" on a predicate it computed as ${atom.quantifier.claims}, ` +
            `but recomputing it independently gives ${independent}`,
        );
      }
    }

    // The same second derivation, for a number.
    const independentValue = recomputed[atom.id]?.value;
    if (independentValue !== undefined && independentValue !== atom.value) {
      push(
        atom.id,
        "render",
        `the surface printed ${atom.value}, but recomputing it independently gives ${independentValue}`,
      );
    }

    if (atom.absent !== undefined && s.text.includes(atom.absent)) {
      push(atom.id, "absent", `"${atom.absent}" must not appear on this surface, and does`);
    }
  }
  return out;
}

/**
 * COVERAGE: every number-shaped run in a rendered surface must belong to an
 * atom.
 *
 * This is the limb that closes the hole the Module 2 economic-truth critic left
 * on record as its own honest limit: "rendered-but-unregistered prose remains
 * structurally invisible to the audit." A sentence can be perfectly audited for
 * every atom it declares and still print an unregistered figure beside them,
 * and the unregistered one is exactly the one nobody checked.
 *
 * Runs that are not economic claims — a year, an ordinal, a roster count — are
 * exempted by listing them, never by loosening the pattern.
 */
export function auditCoverage(s: ClaimSurface, exempt: readonly string[] = []): readonly AuditFinding[] {
  const claimed = new Set(s.claims.map((a) => a.rendered));
  const out: AuditFinding[] = [];
  // Any run of digits, optionally $-prefixed, optionally grouped, optionally %.
  const RUN = /\$?\d[\d,]*(?:\.\d+)?%?/g;
  for (const match of s.text.matchAll(RUN)) {
    const run = match[0];
    if (claimed.has(run)) continue;
    if (exempt.includes(run)) continue;
    // A run that is a substring of a claimed rendering is part of that atom.
    if ([...claimed].some((c) => c.includes(run))) continue;
    out.push({
      surface: s.surface,
      atom: run,
      limb: "coverage",
      detail: `"${run}" is printed on this surface and belongs to no atom — nothing recomputes it`,
    });
  }
  return out;
}

/** Audit a whole set of surfaces. Empty means every claim held. */
export function auditAll(
  surfaces: readonly ClaimSurface[],
  exempt: readonly string[] = [],
  recomputed: Recomputed = {},
): readonly AuditFinding[] {
  return surfaces.flatMap((s) => [...auditSurface(s, recomputed), ...auditCoverage(s, exempt)]);
}
