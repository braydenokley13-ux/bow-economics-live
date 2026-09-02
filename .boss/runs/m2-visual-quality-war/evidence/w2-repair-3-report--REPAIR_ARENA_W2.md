# REPAIR_ARENA_W2 — the drawn arena's fill encoding, framing and third state

Run `m2-visual-quality-war`, wave 2, assignment `w2-repair-3-arena-fill`, actor `builder-r3`.
Owned file: `runtime/src/client/shared/arena.ts` (plus the two arena entries in `SIMPLIFICATIONS`,
`runtime/src/modules/fullHouse.ts`, granted by the Boss lead). Base head `aea9b06`.
TECHNICALLY VERIFIED (scratch build) + AGENT-PLAYTESTED (scratch e2e drove the real product).
Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN. I do not certify my own work.

Screens: `screens-w2-repair-3/` · full tables `measurements-before.txt` / `measurements-after.txt`.

## The instrument
`prove.cjs` renders `arenaSvg` at fills 0 / .2 / .385 / .5 / .714 / .9 / .961 / 1.0, bowl-closed and
bowl-open, into the FOUR boxes `/play` actually measured on this build (outcome panel 500x116 @1366
and 448x92 @1024; locked-waiting building 900x240 @1366 and 900x150 @1024 — harvested from the live
product by `measure.cjs`), screenshots each at deviceScaleFactor 2, and classifies pixels:
lit seat = `b>85 && b-r>25 && mean>50`; warm (house light) = `r>88 && r-b>26 && g>40`.
Per-deck shares are measured through `Path2D` masks rebuilt from the module's own geometry
constants, so "every open deck is lit to the same proportion" is a pixel measurement, not a claim.

## Measured, outcome panel 500x116 @1366 (PANEL lit % of the panel's own pixels)

| fill | BEFORE lit% | AFTER lit% | AFTER lower/club/bowl deck lit% | AFTER warm% |
|---|---|---|---|---|
| 0 (nobody came) | 0.43 | 0.08 | 0 / 0 / — | **0.00** (before **4.35**) |
| 0.200 | 7.58 | 2.24 | 17.0 / 18.4 / — | 0.84 |
| 0.385 | 15.15 | 4.50 | 36.2 / 35.3 / — | 0.84 |
| 0.500 | 25.12 | 5.87 | 47.3 / 45.8 / — | 0.84 |
| 0.714 | 25.97 | 8.49 | 69.0 / 66.1 / — | 0.84 |
| 0.900 | 31.55 | 10.66 | 86.7 / 83.5 / — | 0.84 |
| 0.961 | 35.15 | 11.39 | 92.6 / 88.7 / — | 0.84 |
| 1.000 (sellout) | 37.80 | 12.09 | 97.8 / 93.3 / — | 1.71 (gold rim) |
| 0.9 bowl OPEN | 31.55 (identical to closed) | 14.40 | 86.7 / 83.5 / **77.2** | 0.84 |
| 1.0 bowl OPEN | 37.80 (identical to closed) | 16.25 | 97.8 / 93.4 / **90.0** | 1.49 |
| `lit:"idle"` | 0.18 | 0.08 | 0 / 0 / — | 0.00 |

Monotonic at every step. 0.714 vs 1.000 = 8.49 vs 12.09 = **+3.60 points, +42% relative**
(before: 25.97 vs 37.80 on this classifier, but the two frames differed only by an outer-ring dim —
see `01/02/03-BEFORE-*`). The same ladder holds at 448x92, 900x240 and 900x150 (tables).

**The R-7 defect is visible in the BEFORE numbers**: at fill 0.2 the old drawing lit
lower 42.6% / club 4.2% / bowl 0.3% — the inside-out seat allocation the model does not have.
AFTER: 17.0 / 18.4. The residual 3-8% spread at high fill is overlay strokes (aisles, concourse
shadows, the near roof lip) eating proportionally more of a thinner deck, not allocation: each
deck's seam radius is `sqrt(rIn^2 + fill*(rOut^2 - rIn^2))`, i.e. equal lit AREA share by
construction, computed from one `fill` for all decks.

## What the picture does now
- **Hard fill boundary.** Each open deck is lit from its own front row back to the equal-area seam;
  a bright rail sits just inside the seam, a hard dark line on it, unmistakably dark seats above it.
  No brightness ramp carries the number.
- **0% is a dark building.** `turnout === 0` (and `lit:"idle"`) switch the house off: no floods, no
  gate glow, no lit floor, court paint down to 6% — measured 0.00% warm pixels.
- **Third state.** `bowlSeats` + `bowlOpen:false` draws the top deck SHUTTERED (a ribbed cover, no
  seats, no rows); `bowlOpen:true` puts it in the pool, lit to the same proportion, with a violet
  rail on its lip. Compare `08-` and `09-`.
- **Whole building in frame.** Panoramic viewBox per view (`width/4.6` outcome, `width/4.74` hero),
  the silhouette fitted inside it, `preserveAspectRatio="xMidYMid meet"` at `width/height="100%"`,
  edges faded to void so a letterbox band is seamless. Nothing is cropped at any container aspect.
  The locked-waiting panel is a complete dark building (`10-`), not a clipped quadrant (`04-`).
- **Cheaper.** 146-159 drawn elements per SVG, down from 279-291 (-47%); 57-69 kB down from 88-109 kB.
- Rights: no team colours, logos, marks or identifiable architecture — generic bowl, violet/void
  palette, gold only as floodlight and wood (`SPORTS_REALITY_W2` review holds).

## Not fixed / carried
1. `play/main.ts` does not pass `bowlSeats`/`bowlOpen`, so **the third state does not render in the
   product yet** — the top deck renders as an ordinary open deck on every night. One-line caller
   change specified for repair 2.
2. The `ARENA OUTCOME` legend is still wrong (amber swatches, none in the drawing) — repair 2 owns it.
3. At 116px of panel height the whole building can only be ~100px tall. Raising the frame to
   150-160px would scale it linearly; I cannot change `play/main.ts`.
