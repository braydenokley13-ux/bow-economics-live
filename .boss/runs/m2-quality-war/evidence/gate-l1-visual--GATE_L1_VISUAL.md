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
