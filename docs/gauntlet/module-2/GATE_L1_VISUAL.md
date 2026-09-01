# GATE_L1_VISUAL — Module 2, L1 "Full House"

Run `m2-quality-war` · assignment `gate-l1-visual` · Visual Experience Director.
Judged from rendered browser output only: server booted on PORT 4335 from `runtime/dist`,
full arc driven through real Chromium against `/teach`, `/play`, `/board` (mechanics copied
from `runtime/scripts/e2e-m2l1.cjs`; four desks, two markets, late joiner, stalled desk,
shock night, staged reveal). 69 screenshots at 1366x768 with 1920x1080 duplicates of the key
states, in `docs/gauntlet/module-2/screens-l1-visual/`. Zero console errors observed.

Bar applied: `design/VISUAL_IDENTITY.md` — the Cap Room register, premium interactive
sports-business media. Evidence ids below are screenshot filenames in that directory.
Observed = visible in a screenshot. Inferred = corroborated by source read, not by pixels.
NOT VERIFIED = could not be judged from this evidence.

Performance budget: NOT VERIFIED — no Chromebook-class budget document was supplied to this
review, and no frame/CPU measurement was taken. Nothing below asks for raster video, WebGL,
or per-frame canvas work; every upgrade named is SVG/CSS/static-asset-weight, so the budget
question is deferrable but must be answered before an art pass ships.

## visual-verdict

**Overall: SERVICEABLE-NOT-PREMIUM.** It is legibly the same product family as Module 1 —
same dark palette, same tokens, same arena backdrop, and the copy is in the Cap Room voice.
It is not yet premium sports-business media: the surfaces are stacks of bordered `<div>`
panels with native form controls, the money is set in a Courier fallback, and the two beats
that should be the loudest in the lesson are the quietest pixels on the screen.

| Surface | Verdict | Boundary |
|---|---|---|
| `/board` | SERVICEABLE-NOT-PREMIUM | LOBBY and HOOK frames are the strongest art in the module (`04-board-lobby-desks@1920.png`, `07-board-hook@1920.png`). SYNTHESIS drops to **SCHOOL-UI** (`35-board-synthesis@1920.png`, `35b-board-synthesis-full.png`) and the live PLAY frame drops to **SCHOOL-UI** (`23-board-after-shock.png`). |
| `/play` | SERVICEABLE-NOT-PREMIUM | Three states drop to **SCHOOL-UI**: the sellout result (`21-play-shock-soldout.png`), the upper-bowl decision (`18-play-upperbowl-checked.png`), the nightly P&L (`15-play-night2-with-result.png`). |
| `/teach` | SERVICEABLE-NOT-PREMIUM | Competent dark admin console (`26-teach-after-play@1920.png`). Not the director's monitor wall the identity specifies; emoji glyphs on control buttons are the one outright register break. |

No finding here is blocking under my authority (advisory). Two findings likely trip other
BOW laws and are flagged for the reviewers who own them — see G1 (Classroom/Projector) and
G6 (CVD/colour-only encoding, VISUAL_IDENTITY colour law).

## hierarchy-findings

**H1 — The projector clips its own content at both peak beats.** OBSERVED.
`board/index.html` sets `body { overflow: hidden }` with `#stage { height:100vh;
justify-content:center }`, so any frame taller than the viewport loses its top *and* bottom
with no scroll and no signal. At SYNTHESIS the top row of cards is beheaded mid-heading
("...PRODUCT" is the only word left of card 3) and the sourcing lines are cut off the bottom
— at 1366x768 *and* at 1920x1080 (`35-board-synthesis@1920.png`, `35b-board-synthesis-full.png`).
During PLAY on the shock night the night card is cut off the top and Two Peaks is cut off the
bottom (`23-board-after-shock.png`). The ceremonial close of the lesson is literally
unreadable in the room. Flagged for Classroom/Projector — this is a legibility failure, not
only an aesthetic one.

**H2 — The lesson's title moment is a table cell.** OBSERVED. FULL HOUSE — the sellout the
lesson is named after — renders as monospace text inside a ledger row at the same size and
weight as every other digit on the screen: `17,794 of 17,794 (100%) — FULL HOUSE`, below the
fold, underneath the *next* night's controls (`21-play-shock-soldout.png`). The line that
carries the whole economic point — "7,796 people wanted in and could not get a seat" — is
12px grey body text at the bottom of that same box. Nothing about the frame says a building
just sold out.

**H3 — The rejoin PIN outranks tonight's decision on every `/play` screen, all lesson long.**
OBSERVED. The PIN block is the largest, highest, most contrasted element in the first
viewport at 1366x768; LOCK IT IN is below the fold on a fresh Night 1 (`09b-play-night1-fresh-viewport.png`),
and the PIN is *still* the biggest thing on screen during COUNTERFACTUAL at the end of the
lesson (`34-play-counterfactual@1920.png`). A session-recovery affordance is sitting in the
hero slot of the student's decision surface.

**H4 — The projector's most emphasised text is a disclaimer.** OBSERVED. On every REVEAL
stage, "8,632 people in this room's five nights wanted a seat and could not get one" is set
in muted grey, and directly beneath it the modelling caveat is set **bolder and brighter**
(`28-board-reveal-stage5@1920.png`). The eye lands on the footnote. The same caveat block
eats the bottom ~12% of the HOOK frame in five dense lines (`07-board-hook@1920.png`).
The sourcing discipline is right; its type weight is inverted.

**H5 — Reveals open on the evidence, not the headline.** OBSERVED. Identity requires the
class-reveal to open on one headline number/line, then let the evidence land. Two Peaks puts
"The cheaper ticket made more money." at the *bottom* of the panel, under the charts, while a
stale gold `0/4 DESKS LOCKED IN` counter sits above it as the brightest object in the frame
(`20-board-two-peaks@1920.png`). ADAPT opens on three lines of question copy in the UI font
with no headline number at all (`31-board-adapt-curve@1920.png`).

**H6 — `/teach` is a narrow column, not a monitor wall.** OBSERVED. At 1920x1080 the console
is a ~1000px centred column with the bottom fifth of the screen empty, while inside that
column the four desk cards are so cramped that team names and "80% renewals" wrap to two
lines (`26-teach-after-play@1920.png`). The identity's room-wide aggregate histogram along
the top is absent (four KPI chips instead), and the reveal trigger — required to be large and
unmistakable — is a small tan button sixth in a row of six.

## production-quality-gaps

Ranked by damage to the bar. Each names the concrete upgrade.

**P1 — The typographic identity is never actually delivered.** OBSERVED + INFERRED.
`runtime/src/client/shared/theme.css:39-41` declares
`--font-display: "Arial Narrow", "Bebas Neue", Impact, ...` (Arial Narrow *ahead* of Bebas)
and `--font-number: "Space Grotesk", "Courier New", ...`, and the repo ships **no** font file
and **no** `@font-face` / webfont link (`find` for woff/ttf/otf: zero hits; grep for
`@font-face|googleapis` in `src/client`: zero hits). Rendered result: every dollar figure in
the product is Courier — a typewriter face — not the scoreboard-odometer Space Grotesk the
identity specifies, and "FULL HOUSE" is a letterspaced grotesk, not a condensed broadcast
lower-third (`21-play-shock-soldout.png`, `04-board-lobby-desks@1920.png`). This is why the
money "feels like a spreadsheet cell" — it literally is set in a spreadsheet-era face.
*Upgrade:* self-host subset WOFF2 of Bebas Neue (display) and Space Grotesk (numerals,
`tabular-nums` for columns, proportional for standalone readouts), `font-display: swap`,
reorder the stacks so the real faces come first and the system stack is genuinely a fallback.
Two files, ~60-80KB total, no runtime cost. This is a repo-wide fix, not an M2 fix — Module 1
is rendering on the same fallbacks.

**P2 — The three highest-drama controls and results are native browser widgets.** OBSERVED.
The shock-night "open more of the building" decision — the one irreversible bet in the lesson
— is a default OS checkbox in a thin red-bordered row (`18-play-upperbowl-checked.png`). The
price dial is a native `<input type=range>` painted with a green→red rainbow gradient, which
also mis-signals economics (high price reads as "danger" and the palette's traffic-light ramp
is reserved for cap state, not for price) (`09-play-night1-fresh.png`). The nightly result is
an unstyled two-column monospace ledger where "Kept $215,384" — the number the whole night was
about — has the same weight as "Tickets" (`15-play-night2-with-result.png`).
*Upgrade:* replace all three with drawn components — a physical two-state "OPEN THE UPPER
BOWL" plate that shows the $95,000 cost as a torn-off cash chip; a dial track built from the
palette (inset well, gold indicator, a single marked "season plan" notch) with no hue ramp;
and a settlement card where PEOPLE × PRICE = MONEY IN and KEPT are typeset as a broadcast
box-score, one dominant number, the rest as supporting rows.

**P3 — The peak backdrop is used for four phases and sits directly behind the data.**
OBSERVED + INFERRED. `board/main.ts:75,81` toggles `.peak` for reveal, adapt, counterfactual
*and* synthesis, so the `reveal-synthesis-backdrop.svg` starburst is on for the entire back
half of the lesson instead of the two beats the identity reserves it for — and its brightest
point lands in the centre of the scatter plot, washing the marks
(`31-board-adapt-curve@1920.png`, `28-board-reveal-stage5@1920.png`). Worse, the backdrop's
faint star specks are the same size and value as small chart marks; there are grey specks
sitting inside the plot area that read as data (`28-board-reveal-stage1@1920.png`, near
$30/14k). *Upgrade:* one quiet analysis backdrop (near-flat `surface-panel` with a barely-there
floodlight gradient) for REVEAL/ADAPT/COUNTERFACTUAL; keep the starburst for SYNTHESIS alone
and dim it to ≤35% behind any chart region; kill specks inside the plot rect.

**P4 — Charts are drawn into bordered cards and violate the chart-series law.** OBSERVED.
Identity: charts render directly on the panel/backdrop, never in a separate framed card. Two
Peaks lives inside a gold-bordered rounded card floating on the backdrop
(`20-board-two-peaks@1920.png`); each counterfactual desk is its own bordered card
(`33-board-counterfactual@1920.png`). The counterfactual bars encode Night 1 vs Night 5 as
**blue vs violet with no in-frame legend and no second channel** — colour-only, and blue/violet
is the worst pair to hand a deuteranope; violet is also a reserved token (turn indicator /
L3 war room), not a chart series. Bars are flat full-height rectangles with numbers dropped
inside them — no 4px rounded data end, no 2px gap discipline. Scatter marks carry no 2px
`surface-panel` ring, so overlapping desk-nights merge. *Upgrade:* drop the card frames;
re-encode N1/N5 as `series-1`/`series-2` plus a labelled "N1"/"N5" chip on the first row and a
hatch on N1; add the mark ring; apply the bar end-cap spec. Flagged for whoever owns the CVD
proof — this is a colour-law regression, not taste.

**P5 — Typography collides, and the staged reveal moves its own data.** OBSERVED. In every
Two Peaks render at both viewports the sentence runs into the number: "Tickets + what they
spend inside peak at**$40**" with no space and no baseline relationship
(`20-board-two-peaks.png`, `20-board-two-peaks@1920.png`, `28-board-reveal-stage7@1920.png`).
Separately, the staged class chart rescales its y-axis between stages (17k at stage 1, 20k by
stage 5), so already-revealed dots visibly jump as new nights land
(`28-board-reveal-stage1@1920.png` vs `28-board-reveal-stage5@1920.png`) — the room watches
the evidence move. *Upgrade:* give the peak readout its own right-aligned column with a
leader rule; lock both axes to the final domain before stage 1 so points only ever get added.

**P6 — There is no motion vocabulary in this module.** OBSERVED (stills) + INFERRED (source).
The four keyframes in `theme.css` (`arrive`, `fadeSlideIn`, `tearShake`, `settle`) are all
Module 1 roster-wall classes; no `fh-*` selector carries an animation, and `/board` has three
transitions total (backdrop cross-fade, bar height, a width). The identity's reveal spec —
anticipatory pause then 500ms unveil, dot plots populating at 40ms stagger — is not
implemented: the class chart appears complete. The lock is a text swap, not a commitment
settle. NOT VERIFIED: I cannot certify frame-level behaviour from stills; what I can certify
is that no motion is defined for this module's elements and no arrival/settle artifact appears
across the state pairs I captured. *Upgrade:* three motions only — 40ms staggered mark
population on the class chart, a 200ms firm settle on lock, and a 260ms sellout beat (see
direction D1). Reduced-motion collapse per the identity rule.

**P7 — Nothing on `/play` reads as a place or an object.** OBSERVED. The desk surface is a
single ~610px centred column of stacked rounded panels on a flat void, with ~55% of a 1366
Chromebook screen dead black on both sides and no environment at all
(`09b-play-night1-fresh-viewport.png`). The night card — the one thing in the lesson that
*is* an object in the fiction, a printed card handed to you before doors — is a bordered box
with a heading; the draw pips are the only object-like detail in the module and they work.
Team identity is a 24px crest and a text string. *Upgrade:* give the desk a room (the arena
backdrop at low opacity through a window band behind the header, floodlight falloff top-left),
and make the night card an actual card — stock texture, perforated edge, the day/opponent as a
printed header, the draw pips and TV chip as printed marks, the bill as a stamp.

**P8 — `/teach` register breaks.** OBSERVED. System emoji (🔔, ⏰, ☑) on control-room buttons;
"done" as a lowercase word in a slot sized for a big number; four KPI chips where the identity
asks for a room-wide cap/attendance histogram (`26-teach-after-play@1920.png`).
*Upgrade:* replace emoji with drawn 16px glyphs in `ink-secondary`; widen to a true two-column
monitor wall at ≥1440px (left: phase + triggers, right: desk small-multiples); promote the
reveal trigger to a full-width primary control with the stage counter inside it.

**P9 — The COMPLETE frame's copy collides with the backdrop's window mullions.** OBSERVED —
the paragraph crosses a bright window frame line mid-sentence (`38-board-complete@1920.png`).
*Upgrade:* a darkened scrim band behind board body copy, or shift the backdrop's light
architecture out of the centre-weighted text column.

### Genuinely good — do not regress these

- The LOBBY and HOOK board frames have real art direction: floodlight shafts, window
  mullions, depth, and real clubs/buildings named with their real seat counts. That frame
  reads as a place (`04-board-lobby-desks@1920.png`).
- The Two Peaks curves themselves are close to the dataviz method already: gold solid vs grey
  dashed, marked peaks with price callouts, no plot frame, muted axis labels — the *content*
  of the premium chart is there; it is the framing and hierarchy around it that is cheap
  (`20-board-two-peaks@1920.png`).
- The class scatter's shape-per-night + hue-per-market encoding is disciplined and correct:
  two hues, five shapes, no joining stroke, legend spelling both channels
  (`31-board-adapt-curve@1920.png`).
- Waiting states are named, never spinners: "Locked. Nothing to do but find out — the doors
  open when your teacher rings the bell." (`12-play-locked-waiting@1920.png`).
- Visiting-club Draw as five gold pips is the one true broadcast-graphic detail in `/play`
  (`18-play-upperbowl-checked.png`).
- `/teach`'s WATCH FOR block is genuinely teacher-directing content, not admin chrome.
- Palette, tokens and dark register are consistent with Module 1 — one product family, no
  gamification chrome, no badges/XP anywhere in the arc (D4 clean).

## direction

The three highest-value art-pass upgrades for the module, in order. Together they are the
difference between "dark-mode worksheet" and "software the business side of a franchise uses",
and none of them requires raster video or canvas.

**D1 — Build the sellout as a moment, on both surfaces.** FULL HOUSE is the name of the
lesson and currently it is eight monospace characters in a table row. Promote it to a
composed beat: on `/play`, the settlement card turns into a filled-house plate — the
attendance bar completes to 100% and locks with a single gold edge flash (260ms, no bounce),
FULL HOUSE set in the display face across the card, and the turned-away count given its own
line as a Space Grotesk number with a short label ("7,796 could not get in"), not a grey
sentence. On `/board`, a sellout anywhere in the room raises a one-line house state during
PLAY. This is the single highest-value change in the module: it is the emotional peak, it is
already computed, and it currently renders as nothing.

**D2 — Re-compose `/board` as a fixed 16:9 frame with a fitted type ramp.** The projector
surface currently overflows and silently clips its own peak beats. Every board mode should
lay out to a guaranteed-fitting frame: a headline slot (display face, one line, opens the
beat), an evidence slot (chart or cards, on the backdrop, never in a card frame), and a
footnote rail that is smaller and dimmer than everything above it. SYNTHESIS in particular
must stop being six paragraph cards at once — stage the six cards under the existing teacher
trigger, one or two at a time, in the ceremonial register, on the starburst backdrop that is
then earned. This fixes H1, H4, H5, P3 and P4's framing in one pass.

**D3 — Ship the fonts and draw the two dials.** Self-host Bebas Neue and Space Grotesk and
reorder the stacks (P1) — every number in both modules gets its scoreboard voice back for
~70KB and zero runtime cost, and it is the cheapest premium delta available anywhere in this
repo. In the same pass, replace the native range input and native checkbox with drawn
Cap-Room controls: a price dial with an inset track, a gold indicator, one printed "season
plan" notch and no hue ramp; and an upper-bowl plate that reads as a physical, costly,
one-night switch. Those two widgets are what a student's hands are on for the entire lesson.

Recorded stance: none of the above is blocking under Visual Experience authority. H1 (board
clipping) and P4's colour-only N1/N5 encoding are handed to Classroom/Projector and to the
colour/CVD owner respectively, either of whom may make them blocking under their own law.
This review directed nothing in the current build, so it is free to certify it; if any of D1-D3
is implemented at my direction, a different reviewer must judge the rendered result.

---

## W3 RE-GRADE

Run `m2-quality-war` · assignment `w3-visual-regrade` · Visual Experience Director.
Affirmative re-grade against `design/VISUAL_IDENTITY.md`, judged from rendered browser output
only. Server booted on PORT 4363 from `runtime/dist` at HEAD `72b7a2f`; full arc driven through
real Chromium (mechanics from `runtime/scripts/e2e-m2l1.cjs`: four desks, two markets, late
joiner, stalled desk, shock night, teacher-released Two Peaks, seven staged reveal beats,
paged counterfactual). **82 screenshots** at 1366x768 with 1920x1080 spot duplicates, all
`w3-` prefixed, in `docs/gauntlet/module-2/screens-l1-visual/`. Zero console errors across
every page. A second instrumented pass measured `#stage` overflow and computed type sizes per
board frame at both projector shapes.

Observed = visible in a `w3-` screenshot or in a measured computed style. Inferred =
corroborated by source read. NOT VERIFIED = could not be judged from this evidence.

**Independence — read before using this document.** The original gate directed D1–D3 and
recorded that "if any of D1–D3 is implemented at my direction, a different reviewer must
judge the rendered result." D1 (sellout beat), D2 (fitted board frame) and D3 (fonts, drawn
controls) were the repair set. This re-grade is therefore **advisory input, not certification**,
and Visual Experience must not be the sole certifier of the premium clause. Because the verdict
below is NOT AFFIRMED, the conflict does not launder a pass — but a second reviewer is still
required before any future AFFIRMED.

**Performance budget: NOT VERIFIED.** Still no Chromebook-class budget document supplied and no
frame/CPU measurement taken. One datum: the two self-hosted webfonts total **36,056 bytes**
(`bebas-neue-latin.woff2` 13,768 B + `space-grotesk-latin.woff2` 22,288 B) — under half the
~70–80KB the original review estimated.

### Per-surface grades

| Surface | W2 verdict | W3 verdict | Movement |
|---|---|---|---|
| `/play` | SERVICEABLE-NOT-PREMIUM | **SERVICEABLE-NOT-PREMIUM** (top of band) | Real movement; two named defects still bar premium |
| `/board` | SERVICEABLE-NOT-PREMIUM | **SERVICEABLE-NOT-PREMIUM**, with SYNTHESIS and PLAY+TWO-PEAKS at **SCHOOL-UI** | Best frames improved; the two weakest failed differently, not less |
| `/teach` | SERVICEABLE-NOT-PREMIUM | **SERVICEABLE-NOT-PREMIUM** | Reveal trigger improved; every other named defect intact |

**PREMIUM CLAUSE: NOT AFFIRMED (verdict: SERVICEABLE-NOT-PREMIUM).**

### What changed the grade upward (observed)

- **The typographic identity now actually ships.** Two self-hosted WOFF2 files under
  `runtime/src/client/shared/fonts/`; measured computed families are `"Bebas Neue"` on board
  headlines and Space Grotesk on money. No dollar figure in the product is Courier any more
  (`w3-15-play-night2-with-result.png`, `w3-21-play-shock-soldout.png`,
  `w3-28-board-reveal-stage7@1920.png`). This is the largest single premium delta in the wave.
- **The sellout is a composed beat on `/play`.** FULL HOUSE set large in the display face across
  a gold-edged plate, the attendance bar completing to a solid gold rule, and `7,256` given its
  own line as a Space Grotesk number with the label "could not get in"
  (`w3-21-play-shock-soldout.png`). This is the lesson's title moment rendered as a moment.
- **The nightly result is a broadcast box score.** CAME × PRICE = TICKET MONEY across the top
  as three labelled cells, then supporting rows, then KEPT as the one dominant number
  (`w3-15-play-night2-with-result.png`).
- **REVEAL stage 7 is the best board frame in the module** — Bebas headline, the room's own
  turned-away number in bright white above the evidence, two clean market cards, caveat
  demoted below both (`w3-28-board-reveal-stage7@1920.png`).
- **SYNTHESIS and COUNTERFACTUAL no longer clip.** Measured `#stage` overflow **0px** at both
  1366x768 and 1920x1080 (`w3-35-board-synthesis.png`, `w3-33-board-counterfactual.png`).
- **The rejoin PIN no longer outranks the decision.** Dismissible ("Got it"), auto-hides at
  20s, collapses to a small `REJOIN PIN` chip. Measured box on join: top 90px, height 103px;
  LOCK IT IN sits at y≈667 in a 768px viewport, i.e. above the fold with the PIN still open
  (`w3-03c-play-pin-visible-on-join.png`, `w3-03d-play-pin-dismissed.png`,
  `w3-09-play-night1-fresh-viewport.png`).

### Original findings — FIXED / NOT FIXED

| Id | Finding | Status | Evidence |
|---|---|---|---|
| H1 | Projector clips its own peak beats | **PARTIALLY FIXED** — SYNTHESIS/COUNTERFACTUAL/REVEAL-7 now 0px overflow; **PLAY+Two-Peaks overflows 164px at 1366x768 and 229px at 1920x1080**, REVEAL stage 5 overflows 133px at 1366x768, ADAPT overflows 29px/39px | `w3-23-board-after-shock.png`, `w3-23-board-after-shock@1920.png`, `w3-28-board-reveal-stage5.png`, `w3-31-board-adapt-curve.png` |
| H2 | Title moment is a table cell | **FIXED** | `w3-21-play-shock-soldout.png` |
| H3 | Rejoin PIN in the hero slot | **FIXED** | `w3-03c` / `w3-03d` / `w3-09` |
| H4 | Most-emphasised board text is a disclaimer | **PARTIALLY FIXED** — caveat demoted on REVEAL-7; on the PLAY frame the modelling note is now five lines of **`accent-gold`** body copy and the brightest block in frame | `w3-23-board-after-shock@1920.png` vs `w3-28-board-reveal-stage7@1920.png` |
| H5 | Reveals open on evidence, not headline | **PARTIALLY FIXED** — every beat now names itself in Bebas and REVEAL leads with the turned-away number; ADAPT still opens on three lines of question copy with no headline number | `w3-31-board-adapt-curve.png` |
| H6 | `/teach` is a column, not a monitor wall | **NOT FIXED** — still a ~1040px centred column at 1920x1080 with ~440px dead on each side; desk names still wrap to three lines; no room-wide histogram (four KPI chips) | `w3-26c-teach-after-play@1920.png` |
| P1 | Typographic identity never delivered | **FIXED** | measured computed families; all `w3-` shots |
| P2 | Three highest-drama controls are native widgets | **PARTIALLY FIXED** — box score FIXED, upper-bowl plate FIXED (drawn OPEN plate with the $95,000 cost and "paid whether they fill or not"); **the price dial is unchanged**: still `<input type=range>` with `background: linear-gradient(90deg, var(--cap-safe), var(--cap-tight) 55%, var(--over-the-line))` at `theme.css:564-571` | `w3-18-play-upperbowl-pressed.png`, `w3-09-play-night1-fresh-viewport.png` |
| P3 | Peak backdrop behind the data, specks read as marks | **NOT FIXED** — starburst still centred behind the ADAPT/REVEAL/COUNTERFACTUAL scatter with its brightest point inside the plot rect; faint specks still sit inside the plot area at chart-mark size | `w3-31-board-adapt-curve.png`, `w3-28-board-reveal-stage5.png` |
| P4 | Chart card-frames + colour-only N1/N5 | **PARTIALLY FIXED** — scatter is no longer in a card frame and the class chart now uses `series-1`/`series-2` hue with per-night shapes (correct); **counterfactual bars are still blue vs violet, colour-only, no in-frame N1/N5 legend, still flat full-height rectangles with numbers inside, still no 4px data-end**; scatter marks still carry no 2px `surface-panel` ring, so overlapping desk-nights merge | `w3-33-board-counterfactual.png`, `w3-31-board-adapt-curve.png` |
| P5 | Two Peaks type collision; reveal rescales its axis | **FIXED (collision)** — the peak readout now has its own right-aligned column. Axis lock NOT VERIFIED from this pass | `w3-23-board-after-shock@1920.png` |
| P6 | No motion vocabulary | **NOT FIXED** — zero `@keyframes` for any `fh-*` element; the only Full House motion in `theme.css` is `.fh-fill-bar{transition:width 500ms}` and a 140ms border/background transition on `.fh-bowl-plate`. No staggered mark population, no commitment settle, no sellout beat | source read + no arrival artifact across state pairs |
| P7 | `/play` reads as no place | **NOT FIXED** — single centred column on flat void, ~55% of a 1366 panel dead black, no window band, no floodlight falloff, night card still a bordered box | `w3-09-play-night1-fresh-viewport.png` |
| P8 | `/teach` register breaks | **NOT FIXED (contrary to the repair brief)** — emoji are still in `runtime/src/client/teach/main.ts`: `🔔` at lines 238, 239, 272, `⚡` at 606, `⚠` at 750, and `🔔` is **rendered** on the bell button in this session. "done" is still a lowercase word in the big-number NIGHT slot. No histogram. The reveal trigger IS improved — now a wide gold-outlined control naming its own stage ("Reveal 1 of 7 — Night 1 — the quiet Tuesday") | `w3-26b-teach-after-play-viewport.png`, `w3-26c-teach-after-play@1920.png` |
| P9 | COMPLETE copy collides with backdrop mullions | **NOT FIXED** — "no forecast," / "not the" / "s team." are still cut by a bright vertical mullion and the diagonal light shaft | `w3-38-board-complete@1920.png` |

### New findings this pass

**N1 — SYNTHESIS was un-clipped by shrinking, not by staging, and is now SCHOOL-UI.**
OBSERVED (measured). At 1366x768 the six synthesis card bodies compute to **11.20px** Inter and
the smallest live text on the frame is **9.29px**; at 1920x1080 they are 15.74px and 13.06px.
The frame carries roughly 850 words in a three-by-two dashboard grid plus a five-line sourcing
rail — the exact composition `VISUAL_IDENTITY.md` forbids on `/board` ("max type size, minimum
simultaneous elements… one chart, one number, or one reveal state at a time, never a dashboard
grid"). D2's staging recommendation was not implemented: there is no synthesis stage control on
`/teach` (button ids are `btnAdvance`, `btnReveal`, `btnPause`, `btnFreeze`, `btnRestore`,
`btnEnd`, `btnShock`, `btnCounterfactual`, `btnRevealNext`, `btnCloseDay`, `btnCloseNight`,
`btnTwoPeaks`, `btnCfPage` — no synthesis pager). The clipping gate passes and the room still
cannot read the ceremonial close. `w3-35-board-synthesis.png`, `w3-35-board-synthesis@1920.png`.

**N2 — The "season plan" notch is drawn in the wrong place on the price dial.** OBSERVED. The
track runs $10–$120; the label "season plan $24" is rendered centred under the track while the
thumb at $24 sits ~16% along it. On Desk 2 the plan is $16 and the label is still centred. A
student reading the track sees the plan marked near mid-scale when it is near the left end —
this is a mislabelled axis on the control the whole lesson turns on.
`w3-09-play-night1-fresh-viewport.png`, `w3-21b-play-shock-soldout-viewport.png`.

**N3 — D1's board half never shipped.** OBSERVED + INFERRED. The direction was a sellout raising
a one-line house state on `/board` during PLAY. Desk 2 sold out on Night 4 and the projector
showed only the stale gold `0/4 DESKS LOCKED IN` counter; `client/board/main.ts` carries no
sellout/full-house PLAY branch. `w3-23-board-after-shock.png`.

**N4 — Semantic cap tokens are being spent on non-cap meanings across `/play`.** OBSERVED.
The price track uses the reserved three-zone cap ramp (P2 above); KEPT renders in a `cap-safe`
green and the building bill in an `over-the-line` red on the settlement card; the Night-1
attendance bar is a blue→violet gradient and `accent-violet` is reserved for the L3 turn
indicator. Flagged for the colour/CVD owner, who may make it blocking under the colour law —
under my own authority it is advisory. `w3-15-play-night2-with-result.png`.

### Shortest path to PREMIUM, per surface

**`/play` (two items).** (1) Replace the native range with a drawn dial: inset well, gold
indicator, **one printed notch at the actual season-plan price**, no hue ramp — this kills P2's
last clause, N2 and half of N4 in one component. (2) Ship the three motions already specified:
40ms staggered mark population, a 200ms firm settle on lock, a 260ms sellout edge flash, with
the reduced-motion collapse. Nothing else on `/play` is between it and premium.

**`/board` (two items).** (1) Stage SYNTHESIS under a teacher pager, one or two cards at a time,
so the type ramp can go back up — the frame currently trades legibility for fit. (2) Apply the
fitted-frame discipline to the three frames that still overflow (PLAY+Two-Peaks, REVEAL stage 5
at 1366, ADAPT) and dim/quiet the analysis backdrop behind every plot rect, killing the specks
inside it. The projector gate currently accepts "reachable by scrolling" for exactly these
frames; on a projector that is not reachable at all.

**`/teach` (one item).** Widen to a real two-column monitor wall at ≥1440px, replace the five
remaining emoji with drawn 16px `ink-secondary` glyphs, and put a room-wide attendance/fill
histogram where the four KPI chips are.

### Recorded stance

No finding here is blocking under Visual Experience authority. Handed on: H1's three remaining
overflow frames and N1's 9.3–11.2px projector type to **Classroom/Projector**; P4's colour-only
N1/N5 bars and N4's token misuse to the **colour/CVD owner**. Either may make them blocking
under their own law. Formal dissent is recorded against any framing of the wave's premium
clause as satisfied: three of my nine original production-quality gaps (P3, P6, P7, P9) are
untouched, P2's principal control is untouched, P8 is untouched and its repair was reported as
done when it was not, and the projector's ceremonial close now fails as illegibility instead
of as clipping. The direction was largely right; roughly half of it shipped.

---

## W3 FINAL RE-GRADE

Run `m2-quality-war` · assignment `w3-visual-final` · Visual Experience Director.
Bounded final re-grade of the changed states against `design/VISUAL_IDENTITY.md`, judged from
rendered browser output only. Server booted on PORT 4365 from `runtime/dist` at HEAD `f9dcda1`;
full arc driven through real Chromium (mechanics from `runtime/scripts/e2e-m2l1.cjs`: four desks,
two markets, late joiner at Night 3, stalled desk, teacher-released Two Peaks, shock night, seven
staged reveal beats, paged counterfactual, six staged synthesis cards). **47 screenshots**, all
`w3f-` prefixed, in `docs/gauntlet/module-2/screens-l1-visual/`, at 1366x768 and 1920x1080. A
parallel instrumented pass measured `#stage` overflow, computed type size and family per frame,
and the price-dial notch geometry. **Zero console errors** across every page.

Observed = visible in a `w3f-` screenshot or in a measured computed style. Inferred = corroborated
by source read. NOT VERIFIED = could not be judged from this evidence.

**Independence.** This reviewer directed D1–D3 and the W3 shortest-path items; the changes under
review implement them. This document is therefore **advisory input, not certification**, and
Visual Experience must not be the sole certifier of the premium clause. The verdict is NOT
AFFIRMED, so the conflict does not launder a pass — but a second reviewer is required before any
future AFFIRMED.

**Performance budget: NOT VERIFIED.** Still no Chromebook-class budget document supplied and no
frame/CPU measurement taken. Nothing changed this wave adds raster, WebGL or per-frame canvas; the
two webfonts remain 36,056 B total.

### Per-surface grades

| Surface | W3 verdict | W3 FINAL verdict | Movement |
|---|---|---|---|
| `/play` | SERVICEABLE-NOT-PREMIUM (top of band) | **SERVICEABLE-NOT-PREMIUM** (top of band) | Dial de-ramped and notched correctly; one new collision defect |
| `/board` | SERVICEABLE-NOT-PREMIUM, SYNTHESIS + PLAY/TWO-PEAKS at **SCHOOL-UI** | **SERVICEABLE-NOT-PREMIUM** — no frame remains SCHOOL-UI | Both SCHOOL-UI states left the band; analysis frames unchanged |
| `/teach` | SERVICEABLE-NOT-PREMIUM | **SERVICEABLE-NOT-PREMIUM** | Emoji verified gone; every other named defect intact |

**PREMIUM CLAUSE: NOT AFFIRMED (verdict: SERVICEABLE-NOT-PREMIUM; blocking: no).**

### Did the two SCHOOL-UI states leave SCHOOL-UI? — YES, both

**board SYNTHESIS — LEFT SCHOOL-UI.** OBSERVED + measured. The six-card dashboard grid is gone.
One card per frame under `#btnSynthPage`, card bodies at **21.86px = 2.85% of screen height** at
1366x768 (was 11.20px / 1.46%), titles at 32.78px in real Bebas Neue, `#stage` overflow 0px on all
six cards at both shapes, generous negative space, the starburst backdrop finally reserved for a
frame that earns it. This is the ceremonial register the identity asks for.
`w3f-15-board-synth-card1-1366.png`, `w3f-15b-board-synth-card6-1920.png`.
It is not premium: the card is still a bordered rounded `<div>` holding a heading and a paragraph
(the identity's own DON'T), the "beyond-sports" close renders at roughly the same size and weight
as the card body it is meant to follow, and **card 6 reverts** — a five-paragraph, ~200-word
sourcing rail whose smallest live text measures **12.98px = 1.69% of screen height** occupies the
bottom quarter of the last frame of the lesson. Correct discipline, wrong volume, on the one frame
the room is looking at longest. Handed to Classroom/Projector.

**board PLAY + Two Peaks — LEFT SCHOOL-UI.** OBSERVED + measured. `#stage` fits at both shapes
(was +164px / +229px). Slots measure `fh-play-strip:52px · fh-peaks-board:564px ·
synthesis-note:49px` — the live PLAY frame genuinely collapses to a strip while evidence is up, and
the strip still carries the night, the card line and the lock counter. The punchline renders at
24.59px = 3.20% of screen height and lands on frame; the caveat below it is now muted and smaller
(H4 fixed here); P5's type collision is gone — the peak readout has its own right-aligned column.
`w3f-08-board-play-twopeaks-1366.png`, `w3f-08b-board-play-twopeaks-1920.png`.
It is not premium: the beat still **opens on the evidence and closes on the headline** — "The
cheaper ticket made more money." sits at the bottom of the panel under two charts and two wrapped
legends, which is H5 unrepaired at the module's mid-lesson peak; the whole panel is still a
bordered rounded card floating on the backdrop (P4's framing clause); and two charts plus two
legends plus a banner is a dashboard grid on the surface the identity restricts to one thing.

### Emoji — VERIFIED GONE, but the replacement is not a drawn glyph

OBSERVED (rendered) then grep. Rendered glyph scan of `/teach` body text at PLAY returns only
`▸ (U+25B8)` and `◗ (U+25D7)`; `/board` and `/play` return none.
`rg` over `runtime/src/client/teach/main.ts` for the five previously-named characters
(`🔔 ⏰ ☑ ⚡ ⚠`) returns **zero hits**, and a full emoji-range grep of `teach/main.ts` returns
**0**. The prior finding is discharged: no emoji reaches the control room.
`w3f-10-teach-after-play.png`, `w3f-10b-teach-after-play-1920.png`, `w3f-10c-teach-after-play-viewport.png`.

The repair is not what P8 asked for. `teach/main.ts:59-61` defines
`BELL_GLYPH = <span class="btn-glyph">◗</span>`, `GLYPH_HIT = "/"`, `GLYPH_WARN = "!"` — Unicode
text characters set in a 16px bordered box (`theme.css:2257`), not drawn 16px marks. Rendered, the
bell control carries a small outlined square containing a half-disc that reads as nothing in
particular; a room-full-of-people cue has become an unreadable pictogram. Register break closed,
meaning not replaced.

### Changed-state findings

**F1 — The season-plan notch is now geometrically correct, and its label collides with the thumb
on the default state of every night.** OBSERVED + measured. Correctness first: track $10–$120,
`--plan-frac` with the 15px thumb-radius inset, measured notch centre 474.3px against a computed
thumb centre of 473.4px on Desk 1 (plan $24) and 433.5 against 432.6 on Desk 2 (plan $16). W3's N2
is FIXED. But `.fh-dial-notch{top:-3px}` puts an 18px tick and its "PLAN $24" label directly under
a 30px thumb, and every night **opens with the dial parked on the plan price** — so the first thing
every pair sees, five times a lesson, is a gold ring struck through its own label.
`w3f-04-play-n1-fresh-viewport.png`, `w3f-09b-play-shock-soldout-viewport.png`.

**F2 — The price dial is de-ramped but under-drawn.** OBSERVED. The reserved cap ramp is gone
(`theme.css:571` is now an inset well, `linear-gradient(180deg,#080d14,#141c27)` with an inset
shadow) and N4's worst clause with it. It remains an `input[type=range]` rendering as a thin flat
empty bar with no fill behind the thumb, no zone marks, no docked readout relationship — the
identity's DON'T for a meter reads "a generic progress bar in one flat colour"; this is its
inverse and lands in the same place. The control the whole lesson turns on is correct and plain.

**F3 — The plot scrim trades one identity breach for another.** OBSERVED.
`board/main.ts:686` draws `rect fill:rgba(8,13,20,0.62) rx:6` behind every plot. It works: the
starburst no longer washes the marks and the specks inside the plot rect are suppressed (P3's
principal harm gone). What it leaves is a hard-edged rounded rectangle around the plot on every
analysis frame — "never a bounding box/frame around the plot" in the chart law, met as a fill
rather than a stroke. `w3f-12-board-adapt-1366.png`, `w3f-11-board-reveal-stage5-1366.png`.

**F4 — Axis type clears the floor; the mark ring is 4 shapes out of 5.** OBSERVED + measured. The
ADAPT axis renders at 24.17px = **2.69% of screen height**, above the 2.6% back-row floor, and the
width-computed scaling holds at both shapes. `fhMark` (`board/main.ts:620-632`) now carries
`stroke:var(--surface-panel); stroke-width:2` on circle, square, triangle and diamond — P4's
mark-ring clause is fixed for those. The N5 "ring" mark is `fill:none; stroke:<market colour>`
with no separator, and it is visibly the one that merges: at $10–$16 in ADAPT the orange N2 square,
N5 ring and N1 circle fuse into a single unreadable blob. `w3f-12-board-adapt-1366.png`.

**F5 — The counterfactual summary is full-width and legible; the bars beside it are unchanged.**
OBSERVED + measured. `#fhCfSummary` measures 21.86px = 2.85% of screen height, full-bleed white
bold across the frame — W3's shortest-path item for this frame is delivered. The bars above it are
still **blue vs violet, colour-only, with no in-frame N1/N5 legend**, still flat full-height
rectangles with the numbers dropped inside them, still no 4px rounded data-end and no 2px gap
discipline; `accent-violet` remains a reserved L3 token spent here. P4's colour clause is
untouched. `w3f-13-board-cf-1366.png`, `w3f-13b-board-cf-1920.png`. Held open for the colour/CVD owner.

### Carried findings — status unchanged this wave

| Id | Status | Evidence |
|---|---|---|
| H4 | **PARTIALLY FIXED, unchanged** — demoted on Two Peaks and REVEAL-7; on REVEAL stage 5 the room's own number ("7,732 people … could not get one") sits below the chart and below a three-line grey caption, with the bolder blue-grey caveat directly under it | `w3f-11-board-reveal-stage5-1366.png` |
| H5 | **NOT FIXED** — ADAPT still opens on three lines of question copy with no headline number; Two Peaks still closes on its punchline instead of opening on it | `w3f-12-board-adapt-1366.png`, `w3f-08-board-play-twopeaks-1366.png` |
| H6 | **NOT FIXED** — at 1920x1080 `/teach` is still a ~1040px centred column with ~440px dead on each side; desk names and pair names still wrap to three lines; still four KPI chips, no room-wide histogram; "done" is still a lowercase word in the big-number NIGHT slot | `w3f-10b-teach-after-play-1920.png` |
| P6 | **NOT FIXED** — no staggered mark population, no commitment settle on lock, no sellout beat. NOT VERIFIED at frame level from stills; what is verified is that no such motion is defined | source read + state pairs |
| P7 | **NOT FIXED** — `/play` is still a ~615px centred column on flat void with ~55% of a 1366 panel dead black, no window band, no floodlight falloff; the night card is still a bordered box | `w3f-04-play-n1-fresh-viewport.png` |
| P9 | **NOT FIXED** — the COMPLETE paragraph still crosses a bright vertical mullion and the diagonal light shaft mid-sentence ("no forecast," / "not the" / "else's team.") | `w3f-16-board-complete-1920.png` |
| N4 | **PARTIALLY FIXED** — the cap ramp is off the dial; KEPT still renders `cap-safe` green, the building bill `over-the-line` red, and the attendance bar is still a green→gold gradient | `w3f-09-play-shock-soldout.png` |

### Not regressed — still the strongest work in the module

FULL HOUSE as a composed plate with `7,256 could not get in` on its own line; the CAME × PRICE =
TICKET MONEY box score with KEPT as the one dominant number (`w3f-09-play-shock-soldout.png`); the
LOBBY/HOOK/COMPLETE backdrop art; REVEAL stage 7; the shape-per-night + hue-per-market encoding
with its two-channel legend; named waiting states, no spinners; no XP/badges/leaderboards anywhere
in the arc (D4 clean on M2).

### What stands between here and PREMIUM

Three things, none of them a repair of what was just changed.

1. **`/play` has no place and no motion.** A centred column on flat void with half a Chromebook
   panel dead black, and a lesson whose five commitments, five settlements and one sellout all
   land as instant DOM swaps. The room, and the three motions already specified (40ms staggered
   mark population, 200ms firm settle on lock, 260ms sellout edge flash, with the reduced-motion
   collapse), are the remaining distance on this surface.
2. **`/board`'s analysis frames still open on evidence and still frame their charts.** ADAPT,
   REVEAL-5 and COUNTERFACTUAL each lead with paragraph copy, put the room's own number last, and
   draw the plot inside a hard-edged rect; COUNTERFACTUAL's bars remain colour-only. The
   headline-slot / evidence-slot / footnote-rail ramp that SYNTHESIS and Two Peaks now have has not
   reached them.
3. **`/teach` is not a monitor wall.** A 1040px column with 880px of dead screen, three-line name
   wraps, "done" as a big number, no histogram, and control glyphs that no longer offend but no
   longer signify.

**Blocking judgement.** P6, P7, P9 and H6 are advisory and, in this reviewer's honest assessment,
**not blocking for a classroom-quality bar**. None of them stops a competent teacher running a
good session: the lesson's peaks (FULL HOUSE, Two Peaks, the staged SYNTHESIS) now land legibly
on the surfaces that carry them, and the room can read every projector frame at both shapes. They
are a polish wave, not a classroom gate. The one carried item with a legibility edge is P9, which
puts body copy across a lit mullion on the final frame — handed to Classroom/Projector, who may
make it blocking under their own law. F5's colour-only N1/N5 bars and N4's residual token misuse
are handed to the colour/CVD owner on the same terms.

### Recorded dissent

Formal dissent is **maintained**, narrowed. The wave's premium clause is not satisfied and should
not be recorded as satisfied: the two SCHOOL-UI states were genuinely repaired, but P6, P7 and P9
are untouched across three consecutive re-grades, H6 is untouched, P4's colour clause is untouched,
and P8's repair replaced emoji with characters rather than with drawn marks. The direction was
right and roughly two-thirds of it has now shipped; the surfaces are at the top of
SERVICEABLE-NOT-PREMIUM and are not premium.
