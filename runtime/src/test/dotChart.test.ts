/**
 * W2 repair-5 R5-3: the "your nights so far" chart may not drop the two nights
 * the lesson argues from.
 *
 * De-collision used to be pure suppression from a two-row candidate list, so at
 * a same-price pair — exactly the pair the Night-5 callback names — the earlier
 * night's label silently vanished under the later one, and a flat $16 season
 * rendered three labels for five nights. The rule that no two label boxes may
 * intersect is not relaxed here; the placement is.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { dotChart } from "../client/shared/m2ui.js";

const labelsOf = (svg: string): string[] => [...svg.matchAll(/class="pt-label"[^>]*>([^<]*)</g)].map((m) => m[1]!);
const dotsOf = (svg: string): number => (svg.match(/class="pt"/g) ?? []).length;

const AXES = { xLabel: "PRICE", yLabel: "PEOPLE", xMin: 10, xMax: 120, width: 420, height: 132 };

test("R5-3: the same-price pair the Night-5 callback names is always labelled", () => {
  // $46 / $60 / $80 / $100 / $46 — N1 and N5 share a price and sit on the same
  // vertical, which is the case that lost a label.
  const svg = dotChart(
    [
      { x: 46, y: 10_878, label: "N1 $46 · 10,878", priority: true },
      { x: 60, y: 11_600, label: "N2 $60 · 11,600" },
      { x: 80, y: 3_170, label: "N3 $80 · 3,170" },
      { x: 100, y: 13_450, label: "N4 $100 · 13,450" },
      { x: 46, y: 9_903, label: "N5 $46 · 9,903", priority: true },
    ],
    { ...AXES, yMin: 2_500, yMax: 14_000 },
  );
  const labels = labelsOf(svg);
  assert.equal(dotsOf(svg), 5);
  assert.ok(labels.includes("N1 $46 · 10,878"), `N1 was dropped: ${labels.join(" | ")}`);
  assert.ok(labels.includes("N5 $46 · 9,903"), `N5 was dropped: ${labels.join(" | ")}`);
});

test("R5-3: a flat season at one price still labels the callback pair, and no chart joins its dots", () => {
  // $16 five times: every mark on one vertical, two of them at the same crowd.
  const svg = dotChart(
    [
      { x: 16, y: 14_740, label: "N1 $16 · 14,740", priority: true },
      { x: 16, y: 17_794, label: "N2 $16 · 17,794" },
      { x: 16, y: 14_526, label: "N3 $16 · 14,526" },
      { x: 16, y: 17_794, label: "N4 $16 · 17,794" },
      { x: 16, y: 15_340, label: "N5 $16 · 15,340", priority: true },
    ],
    { ...AXES, yMin: 14_000, yMax: 18_500 },
  );
  const labels = labelsOf(svg);
  assert.equal(dotsOf(svg), 5);
  assert.ok(labels.includes("N1 $16 · 14,740"), `N1 was dropped: ${labels.join(" | ")}`);
  assert.ok(labels.includes("N5 $16 · 15,340"), `N5 was dropped: ${labels.join(" | ")}`);
  // E3: dots only — a path would assert a curve through five nights that are
  // not all comparable.
  assert.equal(svg.includes("<path"), false);
});

test("R5-3: a priority mark is placed before a later night that is not one", () => {
  // N1 is priority and N4 is not; both want the same row. The one the lesson
  // names gets it.
  const svg = dotChart(
    [
      { x: 46, y: 10_000, label: "N1 $46 · 10,000", priority: true },
      { x: 47, y: 10_010, label: "N4 $47 · 10,010" },
    ],
    { ...AXES, yMin: 9_000, yMax: 11_000, width: 200, height: 90 },
  );
  assert.ok(labelsOf(svg).includes("N1 $46 · 10,000"));
});
