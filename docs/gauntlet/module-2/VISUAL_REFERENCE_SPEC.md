# VISUAL_REFERENCE_SPEC — Module 2 premium wave (founder-approved references)

Run `m2-visual-quality-war`. The founder attached five rendered mockups as the **primary design
spec** for this wave. The image files are not in the repository; this document is the Boss lead's
direct visual inspection of each one, written so that builders and critics who cannot see the
images work from the same decisions. Where a decision is described here as OBSERVED it was read
off the pixels; PRELIMINARY ADAPTATION notes are the Boss lead's first read of a functional or
economic mismatch and are confirmed or overturned in the reference-to-product contract
(`VISUAL_REFERENCE_CONTRACT.md`), never silently.

Default rule (founder): **if a reference shows a clear design decision, preserve it.** Deviate only
for a concrete reason (functional mismatch, classroom usability, economic truth, technical
feasibility, viewport failure, or a demonstrably stronger implementation), and record
REFERENCE DECISION → CONCRETE PROBLEM → REPLACEMENT → EVIDENCE.

## 0. The system all five share (OBSERVED)

**Canvas.** Near-black with a faint blue-violet cast (about `#07070d`–`#0b0b14`), not neutral
grey-black. No visible grain. Everything sits on this one ground; there is no lighter "page" area.

**Panels.** Cards are barely lighter than the ground (about `#0f0f1a`–`#13131f`), with a 1px
hairline border at roughly 6–8% white, corner radius about 14–16px on cards and 10–12px on
inner chips. No drop shadows on cards. No card-inside-card nesting deeper than two levels.
Panels are separated by 16–20px gutters; content padding inside a card is 20–24px. Cards are
laid out on a strict grid — equal heights within a row, aligned edges, generous margins (the
main content column starts ~40px from the sidebar and ends ~40px from the right edge).

**Accent.** One accent hue: **violet** (buttons, slider fills, progress pips, active nav,
icon badges, breadcrumb text). Solid CTA buttons are a violet gradient (about `#5b3df0` →
`#7a5cff`) with a soft same-hue outer glow and white 18–20px semibold label; secondary buttons
are the same violet as a 1px outline on the dark panel. Icon badges are 36–44px circles of
deep violet-tinted panel (`#231a4a`-ish) holding a 16–18px violet line icon. Breadcrumbs and
"section labels that are links" are violet text. Gold does not appear as a UI accent anywhere
(the only warm element is the arena's floodlights and one trophy glyph — see §2).

**Semantic colour.** Profit / positive money is **green** (about `#22c55e`) — green digits,
green bars. Attention states on the teacher surface: green "Locked In", amber "Adjusting", red
"Needs Attention" as pills (tinted background, coloured text, 1px same-colour border at ~40%).
Fill/attendance bars are violet. Nothing else is coloured.

**Ink.** Headlines pure off-white (`#f4f4f8`), body `#c9c9d6`, labels/eyebrows `#8a8a9c`,
faint captions `#62627a`. Eyebrow labels are 11–12px, ALL CAPS, letter-spaced ~0.08em, often
preceded by an icon badge.

**Type.** One humanist grotesque family throughout (Inter-class; the current product's Inter
is the right family). Weights: page H1 52–56px semibold (600); big figures 72–96px bold
(700) with tight tracking and tabular digits; card figures 34–40px semibold; card labels
12px caps; body 14–15px regular; captions 12–13px. **No condensed display face on the
student or teacher surfaces.** The projector uses one heavy, wide, all-caps display setting
for its headline only (see §4). Money is set in the same grotesque, not a mono face.

**Numerical hierarchy.** Exactly one hero figure per surface state (the price on the pricing
screen; the price again on results; "CLASS RESULTS" on the projector). Stat cards carry one
34–40px figure each with a 12px caps label above and a 13px muted qualifier below
("per ticket", "of 21,000 Capacity", "After costs"). Deltas are small pills with an arrow
glyph and a green tint. Nothing competes with the hero figure.

**Charts.** Minimal: a single smooth line on a hairline axis with two or three axis labels, no
gridlines, no frame box, one highlighted point with a small dark chip label. Bars are 6–8px
tall rounded pills. A radial gauge is a thin 270° arc with the percentage inside.

**Arena / environment.** A photoreal aerial render of a bowl arena at night, lit violet, court
at centre, city bokeh beyond, floodlight warmth at the rim. It is used as (a) a hero image
bleeding off the right edge behind the header/cards on student and synthesis screens, fading
into the canvas with a left-side gradient so cards remain fully legible, and (b) a framed
"ARENA OUTCOME" panel on results where seat sections are lit to show fill. It never sits
behind body text without the fade. **We do not own that render.** The replacement is our own
drawn arena (SVG/canvas bowl with lit tiers, court, glow) that can also encode fill — see §6.

**Navigation.** A 220–240px left sidebar: brand mark top-left (an 8-point compass-star with a
violet glow and the "BOW / ECONOMICS" wordmark), a short vertical nav (active item has a
violet left bar and a tinted background), then a "Round 3 of 4" card with four pill-shaped
progress pips (violet filled / grey empty), then a bottom identity card ("DC · Director ·
Control Center" with a chevron). The sidebar is the same on student, teacher and synthesis
screens; the projector has a narrower left rail with only round pips and one summary card.

**Voice.** Copy is short, plain, second person: "Set your ticket price to maximize revenue and
fill your arena." "Here's how your pricing decision performed." "What would you change next
round?" One sentence per card.

**Motion / theatre.** None visible in stills. The heightened elements are: the arena render,
the glow on the primary button, the lit arena outcome, and the projector's oversized headline.

## 1. STUDENT — pricing screen (reference "Full House / Set your ticket price")

Layout, 16:9, left to right, top to bottom (OBSERVED):

- Sidebar as §0 (nav: Overview·active, Pricing, Forecast, Arena, Finances, History).
- Header: violet breadcrumb "Module 2 • Money in Motion • Lesson 1"; H1 "Full House";
  one-line subtitle. Top-right: a "Your Goal / Maximize Revenue" card with a target icon badge.
- Row 1 (three columns, ~40/28/32): **SET YOUR TICKET PRICE** card — eyebrow with ⓘ, giant
  "$114", "per ticket" under it, round − and + buttons either side of the figure, a full-width
  slider with a large violet knob and violet fill to the left of the knob, "$20 … $250" end
  labels, helper line "Find the sweet spot between price and attendance." **DEMAND AT A
  GLANCE** card — small downward-sloping curve, y labels High/Med/Low, x labels $20 / Price /
  $250, current price as a highlighted point with a "$114" chip, footnote "• Higher prices
  reduce demand." Third column: the arena render, hero-sized, bleeding off the top-right.
- Row 2: four equal stat cards, each with an icon badge + caps label + 44px figure + qualifier:
  PROJECTED ATTENDANCE 15,250 / 72% of Capacity · PROJECTED REVENUE $1,739,000 · PROJECTED
  PROFIT $689,000 (green) · ARENA CAPACITY 21,000.
- Row 3: **KEY INSIGHT** card (bulb badge, two lines of advisory copy) beside a large solid
  violet CTA "Lock In Price →" with a lock icon and a caption below it, "Set your price and
  see what happens."

Design decisions to preserve: immediate lesson identity; one visible goal; price as the single
hero figure with a physical dial (−/+ and slider); restrained demand information in its own
small card; a row of four equal stat cards; one large primary action, bottom-right; the arena
present on screen; nothing school-like (no instruction paragraphs, no PIN block at the top).

PRELIMINARY ADAPTATION (to be confirmed in the contract):

- **Projected attendance / revenue / profit and the demand-at-a-glance curve are a pre-lock
  revenue preview.** The real lesson prices blind (BC-4; `fullHouse.ts` header: "there is no
  revenue preview of any kind, and nothing derived from the pending action is ever in the
  pre-lock view"). Economic-truth deviation. Replacement: the same four-card row carries the
  **printed operating facts a real desk has** (tonight's card: visiting club's Draw, day, TV;
  capacity; tonight's building bill; season-plan price) and the pair's **own books** (CASH,
  RENEWALS); the "at a glance" card becomes **your own history** — the realized price →
  turnout points of nights already played, which is exactly the information the pair has.
- "Maximize Revenue" as the goal: the lesson runs **two books that cannot be summed** (cash and
  renewals). The goal card must show both, or the copy teaches a false single objective.
- Sidebar nav items (Forecast, Finances, History…) name screens the product does not have.
  Preserve the sidebar's shape and restraint; populate it with the lesson's real structure
  (lesson identity, night progress pips, desk identity), not fictional destinations.
- Round 3 of 4 → Night N of 5.
- The second dial (event spend, "making it an event") and the Night-4 upper-bowl option exist
  in the product and not in the reference; they take the same visual grammar as the price dial,
  subordinate in size.

## 2. STUDENT — round results (reference "Round Results")

Layout (OBSERVED): same sidebar; H1 "Round Results", subtitle "Here's how your pricing
decision performed."; goal card. Row of five cards: YOUR TICKET PRICE $114 (+ a violet pill
"Target: $110–$120") · ACTUAL ATTENDANCE 15,250 of 21,000 Capacity 72% · ARENA FILL as a
radial gauge, 72% inside, "15,250 / 21,000" beneath · TOTAL REVENUE $1,739,000 "What fans
paid" · TOTAL PROFIT $689,000 green "After costs". Below-left: **WHAT HAPPENED?** card, three
lines of plain explanation, then two delta pills ("+1,250 vs. projected attendance",
"+$139,000 vs. projected revenue"). Below-right, dominant: **ARENA OUTCOME** panel — the lit
arena render with a legend "Filled / Available / Unavailable". Bottom: solid violet CTA "Adjust
for Next Round → Review insights and set your next price." Footer strip: trophy glyph, "Strong
Round! You're building momentum. Keep optimizing to maximize profits." and a "View Round
History" button.

Preserve: the result is a **separate, larger state** than the decision (the consequence gets
its own screen); one row of result figures; a plain "what happened" explanation; the arena as
the consequence's picture, with fill visible; a single CTA forward.

PRELIMINARY ADAPTATION:

- "Target: $110–$120" reveals the hidden optimum → economic-truth deviation; drop.
- "vs. projected" deltas depend on a projection that does not exist → replace with the pair's
  own **night-over-night** deltas and the settled facts the model does report (turnout, gate,
  in-arena money, turned-away count on a sellout, renewals movement, the building bill).
- "Strong Round! You're building momentum" + trophy = reward iconography (D4, sacred
  constraint `no-gamification-layer`). Replace with the night's **factual headline** ("FULL
  HOUSE — 17,794 of 17,794 · 7,796 turned away" or "Night 2 · 14,875 came at $84"). The
  moment stays loud; it is not a badge.
- The arena outcome panel is the flagship consequence visual and should encode **realized
  fill** (lit sections in proportion to turnout) and the **sellout** state (whole bowl lit +
  an edge flash). This is where the wave's "cinematic when something matters" belongs on the
  student surface.

## 3. STUDENT — economics synthesis (reference "Full House · Economics Synthesis")

Layout (OBSERVED): same sidebar; eyebrow "Results • Round 3 of 4"; H1 "Full House"; subtitle
"Economics Synthesis"; goal card; arena render top-right. Row of four stat cards (Your Price,
Attendance 72%, Revenue, Profit-green). A two-column card: **What happened?** (three lines) |
**Key Insight** — bold one-liner "Higher prices reduced demand." plus one plain line "Revenue
depends on both price and quantity." Section heading "Economics You Learned — Connecting your
decisions to economic principles." Four concept cards, each with icon badge, title, one-line
description, a small visual (a demand curve with the pair's point; the equation
"$114 × 15,250 = $1,739,000" with Price/Quantity/Revenue captions; four icon chips for demand
shifters; a balance-scale illustration for tradeoffs), and a one-line takeaway in an inset
footer. Bottom: "What would you change next round? Think about price, demand, and your goal."
with a solid violet "Plan Next Round →" CTA.

Preserve: the synthesis opens on the pair's **own numbers**; concept cards are named, visual,
and short; one takeaway line each; very little prose; a forward question at the end.

PRELIMINARY ADAPTATION:

- The product's synthesis is the lesson's ceremonial close, staged by the teacher on the board
  one card at a time (6–7 cards), with a student mirror. Keep the staging; give the cards this
  visual grammar (badge, name, visual, one takeaway) on both surfaces; the small visuals must
  be computed from the class's own locked numbers, never illustrative.
- "Weather" is not a demand shifter for an indoor NBA night; use the lesson's real shifters
  (day of week, the visiting club's Draw, TV, the event spend).
- "Plan Next Round" does not exist at the end of a lesson; the forward question is the exit
  prompt ("Which night did you get wrong, and what on the card should have told you?").

## 4. PROJECTOR — class results (reference "CLASS RESULTS")

Layout (OBSERVED, 16:9): narrow left rail (brand mark; ROUND 3 OF 4 pips card; ALL TEAMS
21,000 Total Capacity card; DC card at the bottom). Header: violet breadcrumb "Module 2 •
Lesson 1  Full House"; **CLASS RESULTS** in a heavy, wide, all-caps display setting about
110px tall; subtitle "Here's how each team did this round."; goal card top-right; the arena
render behind the top-right quadrant, fading down into the table. Main: one table, six rows,
each row ~64px tall: crest circle + "Team N" | TICKET PRICE Per Ticket | ARENA FILL % of
Capacity (figure + violet bar) | TOTAL REVENUE All Tickets (figure + violet bar) | TOTAL
PROFIT After Costs (green figure + green bar). Column headers carry an icon badge, a caps
label and a small qualifier. Row figures are ~28px. Bottom strip: **DISCUSSION PROMPTS**
(bulb badge) with two numbered prompt cards — "Which team balanced price and attendance
best?" / "Why didn't the highest price always win?" — and the compass-star mark at right.

Preserve: one headline that fills the room; one table, big rows, few columns, a bar beside
every number so the comparison reads from the back of the class; discussion prompts on the
frame itself; the arena as atmosphere, never behind text; big type, no fine detail.

PRELIMINARY ADAPTATION:

- This frame is a **night's class evidence** in the product (per-desk price · fill · gate ·
  cash/renewals after each night closes, real desks with real club names), and the seasonal
  books at the end. Rows scale to class size (up to ~15 desks): keep 64px rows to ~8 desks,
  then compress; never drop below projector legibility.
- "Total profit" → the product's **CASH** book (gate + in-arena − bill − spend) and
  **RENEWALS**; a single "profit" column would collapse the two books the lesson is built on.
- Discussion prompts come from the module's own registered copy (`ADAPT_QUESTIONS`,
  `ARGUE_PROMPT`), so the claim audit still covers them.
- The lesson's existing peak frames (Two Peaks; the seven reveal stages; the staged
  synthesis) keep their choreography and take this frame's grammar: heavy headline, one
  evidence block, footnote rail.

## 5. TEACHER — live class director (reference "Teach • Full House")

Layout (OBSERVED, 16:9): sidebar (nav incl. Teach·active, Students; a "View: All Teams"
dropdown; DC card). Header: eyebrow "Module 2 • Lesson 1"; H1 "Teach • Full House" (Teach in
violet); subtitle "Live Class Director". Right of the header, three status cards: **Class
Status ● Live / Students connected 28 / 30**; **Round 3 of 4** with pips; **Time Remaining**
radial 08:42 of 15:00. A filter bar: "All Teams 28 | ● Locked In 12 | ● Adjusting 10 | ● Needs
Attention 6", "Sort by Readiness", grid/list toggle. A 4×3 grid of team cards: number badge,
name, status pill; rows Ticket Price (violet figure), Proj. Attendance, Readiness (four dots);
footer "Last update 1m ago"; a pagination line "Showing 1–12 of 28 teams". Right: **Director
Rail** — WATCH FOR (four bullets), DON'T EXPLAIN YET (four bullets), ASK (one prompt + "Use
This Prompt" button), TIMEOUT (one line + "Start Time Cut"), RECOVERY (one line + "Activate
Recovery"). Footer bar: Class Chat · Pause Round · Add Time +2:00 · … · "Open Projector View"
(outline) · "Reveal Class Results" (solid violet, eye icon).

Preserve: dense-but-calm monitor wall; one card per desk with a status pill readable in a
glance; the Director Rail's NOW / WATCH FOR / DON'T EXPLAIN YET / ASK / TIME CUT / RECOVERY
structure at the right edge; the reveal control as the single loudest button, bottom-right;
the projector link beside it; state summary cards top-right; no decoration.

PRELIMINARY ADAPTATION:

- "Proj. Attendance" and a per-team "Readiness" score are projections the model does not
  make. Desk cards show what is true: locked/adjusting/stalled, the locked price and spend (or
  "not yet"), last night's realized turnout and fill, the books, and the module's own watch
  flags (`teacherWatchFor`: stalled, repeat-price, …).
- "Time Remaining 08:42 of 15:00" implies a countdown budget the lesson does not set. Teacher
  pacing is manual with a manual fallback (sacred constraint). Replacement candidate: an
  **elapsed** class/phase clock that makes the existing TIME CUT line ("Past minute 45?")
  actionable — no student-facing timer, no auto-advance.
- "Class Chat", "Add Time" are features that do not exist; omit. "Pause Round" maps to the
  existing Pause/Freeze controls.
- The product's existing teacher content (NOW / SAY lines / bell / what students see /
  simplifications) already exists as copy; the wave moves it into the rail's grammar and does
  not remove any facilitation knowledge.

## 6. Assets this wave must produce (Boss lead's read)

1. **Module-2 design tokens** layered over the shared theme without touching Module 1's
   rendered output (scope by module id on the document root).
2. **The arena** — our own drawn bowl (SVG or canvas): aerial three-quarter view, tiered
   seating rings, court at centre, violet stage lighting, floodlight warmth at the rim, city
   haze behind. Must render as (a) hero backdrop with fade and (b) a fill-encoding outcome
   panel (sections light in proportion to turnout; sellout lights everything).
3. **The brand mark** — 8-point compass-star with violet glow (compass, not a reward star: D4).
4. **Icon set** — 12–16 line icons at 16–18px (ticket, people, arena, dollar, trend, bulb,
   target, lock, eye, clock, pause, projector, chevron, alert). Drawn SVG, no emoji.
5. **Charts** — history line, radial gauge, horizontal bar pills, the Two Peaks curves and the
   reveal-stage curves restyled to §0's chart rules.
6. **Motion** — the identity's existing vocabulary (commitment settle, sellout edge flash,
   staggered mark population, synthesis rise) implemented on the changed surfaces, with the
   reduced-motion collapse.

## 7. Viewports

Student and teacher: 1366×768 (Chromebook) is the design target; the references are ~1672×941
(16:9) and must be re-composed, not scaled, to 1366×768 — the sidebar narrows, the four-card
row stays a row, the hero figure stays ≥64px. Projector: 1920×1080 and 1366×768. Student
first-contact at 1024×600 must still reach the lock control (existing e2e instrument).
