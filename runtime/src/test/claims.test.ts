/**
 * THE SHARED CLAIM ATOM, AND THE COPY IT WAS EXTRACTED FROM.
 *
 * `shared/claims.ts` exists because the pattern had already drifted once while
 * being hand-copied: `writeTheRule.ts`'s copy silently dropped the `board`
 * field, so D24's projector/teacher split was structurally unavailable in that
 * lesson and nothing failed. The extraction is only worth anything if the same
 * thing cannot happen again, so this file does two jobs.
 *
 *  1. It tests the shared implementation's own behaviour, including the
 *     COVERAGE limb that the Module 2 audit did not have — the one that catches
 *     an unregistered number printed beside a registered one.
 *
 *  2. It asserts that the shared implementation and `hostTheLeague.ts`'s
 *     original agree, atom for atom. The original is deliberately NOT migrated
 *     (CLAUDE.md §25: do not refactor a shipped, gate-passed lesson for
 *     tidiness), so this is the thing standing between two copies and a third
 *     silent divergence.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { auditAll, auditCoverage, auditSurface, claim, claimWord, onBoard, renderClaim } from "../shared/claims.js";
import type { ClaimSurface } from "../shared/claims.js";
import { claim as htlClaim, claimWord as htlClaimWord } from "../modules/hostTheLeague.js";

test("a number reaches a claim string only through the atom's own rendering", () => {
  const a = claim("gate", 1_234_567, "money");
  assert.equal(a.rendered, "$1,234,567");
  assert.equal(renderClaim(1_234_567, "money"), a.rendered);
  assert.equal(renderClaim(0.5, "percent1"), "0.5%");
  assert.equal(renderClaim(49.94, "percent"), "50%");
  assert.equal(renderClaim(12.4, "int"), "12");
});

test("money never renders a minus sign, because a lesson says 'short by', not '-$4M'", () => {
  assert.equal(renderClaim(-4_000_000, "money"), "$4,000,000");
});

test("a surface that prints what it computed, and says true things about it, passes", () => {
  const spent = claim("spent", 15_044_000, "money", { assertsSign: "positive" });
  const nobody = claimWord("nobody", "nobody", true);
  const s: ClaimSurface = {
    surface: "reveal.1",
    text: "You spent $15,044,000, and nobody in the room went past the first apron.",
    claims: [spent, nobody],
  };
  assert.deepEqual(auditSurface(s), []);
});

test("the render limb catches a hand-formatted second copy of a value", () => {
  const atom = { ...claim("spent", 15_044_000, "money"), rendered: "$15.0M" };
  const s: ClaimSurface = { surface: "reveal.1", text: "You spent $15.0M.", claims: [atom] };
  const found = auditSurface(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "render");
  assert.match(found[0]!.detail, /renders as "\$15,044,000"/);
});

test("the render limb catches an atom whose substring is not on the surface at all", () => {
  const s: ClaimSurface = {
    surface: "reveal.1",
    text: "You spent a lot.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  const found = auditSurface(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "render");
});

test("the sign limb catches a sentence that asserts more than the number supports", () => {
  const s: ClaimSurface = {
    surface: "reveal.2",
    text: "You came out $0 ahead.",
    claims: [claim("ahead", 0, "money", { assertsSign: "positive" })],
  };
  const found = auditSurface(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "sign");
});

test("the bounds limb catches a figure outside the range that makes the sentence printable", () => {
  const s: ClaimSurface = {
    surface: "reveal.3",
    text: "Your share of the room was 140%.",
    claims: [claim("share", 140, "percent", { bounds: { min: 0, max: 100 } })],
  };
  const found = auditSurface(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "bounds");
});

test("the quantifier limb catches a word the surface prints but cannot support, when a second derivation disagrees", () => {
  // This is the limb with teeth, and the reason it needed one. `claimWord` sets
  // value from `claims`, so comparing the two only asks whether a constructor
  // ran. The defect that actually ships is a reveal whose sentence says
  // "nobody" because the code that BUILT the sentence computed the predicate
  // one way, while the model says otherwise. Only a second, independent
  // derivation can see that, so the audit takes one.
  const s: ClaimSurface = {
    surface: "reveal.4",
    text: "So nobody drew a wall tonight.",
    claims: [claimWord("nobodyWall", "nobody", true)],
  };
  assert.deepEqual(auditSurface(s), [], "self-consistent on its own terms");
  const found = auditSurface(s, { nobodyWall: { predicate: false } });
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "quantifier");
  assert.match(found[0]!.detail, /recomputing it independently gives false/);
});

test("a numeric atom fails when a second derivation of the same quantity disagrees", () => {
  const s: ClaimSurface = {
    surface: "reveal.6",
    text: "You spent $15,044,000.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  assert.deepEqual(auditSurface(s), []);
  const found = auditSurface(s, { spent: { value: 15_294_000 } });
  assert.equal(found.length, 1);
  assert.match(found[0]!.detail, /recomputing it independently gives 15294000/);
});

test("an atom the harness did not recompute is not silently treated as verified", () => {
  // A recomputation map that names other atoms must not make this one pass for
  // free; it simply gets the weaker limbs, and the lesson's harness is
  // responsible for covering everything its reveal argues.
  const s: ClaimSurface = {
    surface: "reveal.7",
    text: "You spent $15,044,000.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  assert.deepEqual(auditSurface(s, { somethingElse: { value: 1 } }), []);
});

test("the absent limb makes a self-contradiction falsifiable rather than proof-read", () => {
  const s: ClaimSurface = {
    surface: "reveal.5",
    text: "Nothing on this frame is about the wall. The wall cost you the trade.",
    claims: [claimWord("noWallCause", "Nothing on this frame is about the wall", true, "The wall cost you")],
  };
  const found = auditSurface(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "absent");
});

test("COVERAGE catches an unregistered number printed beside a registered one", () => {
  // This is the hole the Module 2 economic-truth critic left on record as its
  // own limit: every declared atom can be correct while an undeclared figure
  // sits in the same sentence, and the undeclared one is the unchecked one.
  const s: ClaimSurface = {
    surface: "synthesis.1",
    text: "You spent $15,044,000 of the $18,500,000 you could have spent.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  const found = auditCoverage(s);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.limb, "coverage");
  assert.match(found[0]!.detail, /\$18,500,000/);
});

test("COVERAGE exempts non-economic runs by naming them, never by loosening the pattern", () => {
  const s: ClaimSurface = {
    surface: "synthesis.2",
    text: "In 2026-27 you spent $15,044,000 across 3 signing days.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  assert.ok(auditCoverage(s).length > 0, "unexempted runs must be reported");
  assert.deepEqual(auditCoverage(s, ["2026", "27", "3"]), []);
});

test("COVERAGE does not report a digit run that is part of a claimed rendering", () => {
  const s: ClaimSurface = {
    surface: "synthesis.3",
    text: "$15,044,000.",
    claims: [claim("spent", 15_044_000, "money")],
  };
  assert.deepEqual(auditCoverage(s), []);
});

test("onBoard prefers the short rendering and falls back to the full one (D24)", () => {
  assert.equal(onBoard({ text: "long", board: "short", claims: [] }), "short");
  assert.equal(onBoard({ text: "long", claims: [] }), "long");
});

test("auditAll runs both limbs over every surface", () => {
  const good: ClaimSurface = { surface: "a", text: "$1,000.", claims: [claim("x", 1000, "money")] };
  const bad: ClaimSurface = { surface: "b", text: "$1,000 and $2,000.", claims: [claim("x", 1000, "money")] };
  assert.deepEqual(auditAll([good]), []);
  const found = auditAll([good, bad]);
  assert.equal(found.length, 1);
  assert.equal(found[0]!.surface, "b");
});

/* ------------------------------------------------------ the anti-drift limb -- */

test("the shared atom and hostTheLeague's original agree, so the copies cannot drift apart in silence", () => {
  const cases: [string, number, "money" | "percent" | "percent1" | "int"][] = [
    ["a", 0, "money"],
    ["b", 1, "money"],
    ["c", 1_234_567, "money"],
    ["d", 164_961_000, "money"],
    ["e", 0.5, "percent1"],
    ["f", 33.333, "percent1"],
    ["g", 49.94, "percent"],
    ["h", 12.4, "int"],
    ["i", 12.6, "int"],
  ];
  for (const [id, value, format] of cases) {
    const mine = claim(id, value, format);
    const theirs = htlClaim(id, value, format);
    assert.equal(
      mine.rendered,
      theirs.rendered,
      `renderings diverged for ${value} as ${format}: shared "${mine.rendered}" vs hostTheLeague "${theirs.rendered}"`,
    );
    assert.equal(mine.value, theirs.value);
    assert.equal(mine.format, theirs.format);
    assert.equal(mine.assertsSign, theirs.assertsSign);
  }
});

test("the shared claimWord and hostTheLeague's original agree", () => {
  for (const claims of [true, false]) {
    const mine = claimWord("q", "most", claims, "nobody");
    const theirs = htlClaimWord("q", "most", claims, "nobody");
    assert.deepEqual({ ...mine }, { ...theirs });
  }
});

test("negative money is where the two implementations are ALLOWED to differ, and the difference is recorded", () => {
  // hostTheLeague's `money()` is its own module-local formatter and is not
  // exported, so this asserts only the shared rule and pins it: a lesson never
  // prints a minus sign at a student. If a future migration changes this, the
  // failure should be read as a decision to make, not a bug to paper over.
  assert.equal(renderClaim(-1, "money"), "$1");
});
