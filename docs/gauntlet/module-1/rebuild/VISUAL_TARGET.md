# Module 1 rebuild — the visual target, read off the founder's three mockups

The founder supplied three rendered mockups as the QUALITY BAR for the Module 1 rebuild.
They are a **visual north star, not a product specification**: their data is invented, their
franchise ("San Antonio Summit") does not exist, and several of their meters ("Team OVR",
"Fan Trust", "Franchise Value", "Level 1 / 150 XP") are forbidden or unproven in this product.
This file records what the mockups actually show, what is worth taking, and what must not be
copied — so the visual lane can work from a written target instead of from memory.

Recorded 2026-09-03 by the lead integrator, from the images supplied in the founder brief.

---

## Mockup A — the teacher console ("Teach", live Free Agency phase)

**Layout.** Full-bleed dark app. Left rail ~176px: BOW compass wordmark at top, then a vertical
nav (Overview, Teach, Students, Teams, Trades, Pricing, Cap & Finance, Arena, Standings,
History), a "View / All Teams" select pinned low, and a persistent identity chip
("DC · Director / Control Center") at the bottom-left. A "Class Chat 12" pill sits below it.

**Header band.** Left: eyebrow "Module 1" in violet, then a large display title
("Build Your Franchise") and a live-state subtitle ("You are live with 28 of 30 students").
Right of it, four glass stat cards in a row:
- LIVE PHASE — a ring progress indicator + phase name (FREE AGENCY) + clock 08:42 "of 15:00"
- ROUND — "3 / 4" with a four-segment progress bar, filled segments in violet
- GRADE BAND — a **two-state segmented control, 5–6 / 7–8**, active state filled violet
- TIME CUT — "05:00", "Will advance to Round 4", with a small clock glyph

**Main region — the desk grid.** A filter row: segmented pills "All Desks 28 / Unresolved 6 /
Rising Risk 5" (counts baked into the chip), a "Sort by / Activity" select, and a
grid-vs-list view toggle. Then a scrollable grid of 4 columns of desk cards. Each card:
a numbered circle, student name + real NBA club underneath, a right-aligned status dot+label
(On Track green / Unresolved red / Rising Risk amber), a kebab menu, and a three-cell
metric strip — **Cap Room** (signed dollars, negative in red), **Team OVR**, **Trend**
(a tiny sparkline, coloured by status). Below the grid, a compact "overflow" strip of
smaller chips for desks 21–30, including two greyed "Vacant" seats.

**Right rail ~420px — four stacked panels:**
1. ROOM INTELLIGENCE — "Unresolved Desks 6" as a big red figure, then an inline run of
   desk chips with their deficits (`2 M. Patel −$2.1M`), a "+3 more", and a full-width
   "View Unresolved" button.
2. EMERGING TRADEOFFS — three rows, each a tradeoff sentence with a right-aligned desk count
   ("Short-term talent vs. long-term flexibility — 12 desks"), then "Explore Tradeoffs".
3. WHAT TO ASK NEXT — three question rows with a small glyph, then "Load More Prompts".
4. INTERESTING CONTRASTS — a two-column vs table (Best Cap Space `19 B. White` vs Least Cap
   Space `14 A. Jackson`; Highest OVR vs Lowest OVR; Most Improved vs Declining), "View All".
5. AT TIME CUT (05:00) — a checklist of four things the close will do, then "Preview Round 4".

**Bottom action bar** — full width, elevated: Pause Round · Add Time +2:00 · Broadcast
(Message class) · Spotlight (Select desk) on the left; Start Final Call and a violet primary
"End Phase & Time Cut / Advance to Round 4" on the right.

### What to take
- **The console is a director's monitor wall, and every panel answers a question a standing
  teacher actually has.** "Who do I walk to", "what should I ask", "what happens when I close".
  Our THE ROOM / THE DESKS / WATCH FOR already do this; the mockup shows the *density and
  composition* they should be presented at.
- **Named contrasts as a first-class panel.** INTERESTING CONTRASTS is a better shape than a
  paragraph: two desks, one axis, side by side. This is directly a §22 "conflicting definitions
  of success" affordance.
- **AT TIME CUT as an explicit, enumerated preview of what closing does.** Our TIME CUT already
  computes per-desk fallbacks; the mockup shows them as a pre-close checklist.
- **The grade-band control lives in the header, is two-state, and is always visible.** It is a
  property of the room, not a setting buried in creation.
- **Status is never colour alone** — every dot carries a word.
- **Per-desk sparkline.** A trend glyph is more scannable than a number for "is this desk
  moving". Only legitimate if the model actually holds a per-desk time series.
- The bottom action bar keeps destructive/irreversible controls (End Phase) visually separated
  from soft ones (Add Time), with the primary in brand violet.

### What must NOT be copied
- **Team OVR** as a franchise quality meter. A single 0–100 "team overall" is exactly the
  meter-shuffling the founder forbids unless the economics computes it honestly. If a roster
  quality figure exists it must be defined, computed, and defensible — and probably should not
  be a single scalar at all.
- The **live per-desk deficit chips showing negative cap room as a failure state**. Being over
  a threshold is a legitimate NBA position with consequences, not a red error.
- "Class Chat" — no student-to-student chat is in scope.
- Nav entries (Pricing, Arena, Standings, History) imply a whole franchise app; Module 1 is
  three ~55-minute classes.

---

## Mockup B — the projector / class results

**Layout.** 16:9, cinematic. Full-bleed night-cityscape photo behind a violet-black scrim in
the header. Left: "MODULE 1 · FRONT OFFICE DECISIONS" eyebrow, then an enormous display
"CLASS RESULTS" and a subhead "You made the calls. Here are the consequences."
Top-right: a "YOUR GOAL" card restating the objective.

**Three-column body.**
- Left ~330px: CLASS STANDINGS — a ranked list, rank number, a small team glyph, team name,
  and one dollar figure. Rank 1 is highlighted with a violet border and fill. Footnote:
  "Results reflect 10-year franchise outlook".
- Centre: a hero card — "CLASS CHAMPION / TEAM 4 / BUILDING A SUSTAINABLE CHAMPION" over an
  arena-with-trophy image, and to its right three big stat rows, each with a circular glyph,
  a label, a huge figure, a qualitative word (ELITE / VERY HIGH), and a 10-year sparkline.
- Bottom-centre: HOW STRATEGIES COMPARED — four labelled strategy cards (INVEST & DEVELOP,
  STAR POWER, BALANCED APPROACH, COST CUTTERS), each with a colour, a 3-line description, a
  count of teams that chose it, an average figure, and a small trend line.
- Bottom-right: KEY TAKEAWAY — a lightbulb glyph and one sentence.
- Footer bar: identity chip, a centred pull-quote, and a "MODULE 2 / Full House →" next-step.

### What to take
- **Scale.** The headline is genuinely huge; the room reads one thing first. Our board rule
  ("one headline number or line before the chart populates") is right, and this is the size
  it should be at.
- **Cinematic environmental imagery behind a scrim**, with data always winning the eye.
- **HOW STRATEGIES COMPARED is the single best idea in the three mockups**: cluster the class
  by the *strategy they actually pursued*, name each strategy, show how many desks chose it,
  and compare outcomes across strategies rather than ranking individuals. This is exactly the
  argument-generating class evidence §22 asks for, and it is strictly better than a leaderboard.
- The explicit "next module" affordance in the footer — continuity made visible.

### What must NOT be copied
- **A single ranked leaderboard by one universal franchise score.** §22 forbids it and D4
  forbids the progression register. "CLASS CHAMPION" with a trophy is a reward system.
  The rebuild's reveal must carry **conflicting definitions of success**, side by side, with no
  single winner — the disagreement is the product.
- **"Franchise Value $892M" and a 10-year outlook.** Nothing in a 55-minute lesson can honestly
  compute a ten-year franchise valuation. If a long-horizon figure appears at all it must be
  labelled as what it is (a stated model, with its assumptions on screen), not as a result.
- Confetti/trophy iconography (D4).
- "Team 4 / Team 1" naming: real clubs, or the module's own desk handles — never "Team N".

---

## Mockup C — the student device ("You're the GM", Round 1)

**Layout.** Same left rail, gold accent instead of violet. Header: "MODULE 1" eyebrow,
"You're the GM", subtitle "Every decision has a trade-off." Right of it, four glass stat
cards — Budget ($24.0M "Available this round"), Roster Balance (72, "Team OVR"), Fan Trust
(58%, "Neutral"), Staff Capacity (3/5 "Actions this round") — then the same **5–6 / 7–8
segmented control** with an info glyph.

**Franchise identity band.** A large card: a drawn team crest, franchise name
("San Antonio Summit"), three facts (Market Size: Medium · Conference: Western · Arena:
Summit Center (17,500)), a wide photographic arena-at-night image with the building's name
lit on it, and a right-hand "Franchise Outlook" panel with two sentences and a
"View Outlook →" link.

**Decision region.** "ROUND 1 / Your First Moves", a one-line setup, a right-aligned
"Round Deadline / 6 Days Left". Then **four numbered decision cards** in a row, each with a
gold line-art glyph, a title (Invest in Roster / Shape Our Identity / Grow the Brand / Build
the Front Office), two lines of description, a "Potential Impact" row of two coloured chips
naming the metrics it moves, and a "Make Decision →" button.

**Footer strip.** Pro Tip · Learning Focus This Round (four concept chips: Opportunity Cost,
Budget Constraints, Trade-offs, Strategic Priorities) · History ("No decisions made yet.").

**Left rail bottom.** "ST Student GM / Rookie Manager", "Level 1", an XP bar, "150 XP".

### What to take
- **The franchise identity band is the strongest single element for the rebuild.** A large,
  named, pictured place with three concrete facts is what makes "this is MY franchise" land,
  and it is what the persistence requirement (§6) needs a visual home for. Ours must carry a
  **real** NBA club, a real market, a real building, and a real financial position.
- **Constraint state lives in the header and never scrolls away.** Our Cap Meter already does
  this; the mockup shows it as a row of distinct constrained resources rather than one bar.
- **"Potential Impact" chips on a decision, before you take it.** Naming which dimensions a
  choice moves — without numbers — is honest scaffolding, and is a natural 5–6 affordance that
  7–8 can have withheld.
- **"Learning Focus This Round"** is the right register for vocabulary timing — but it must
  appear AFTER the experience, not before it (§20: experience first, formalize second). In the
  mockup it is pre-loaded, which inverts the loop.
- A visible **History** affordance, empty at the start, that fills with the pair's own
  decisions. This is the surface where §6's carry becomes legible.

### What must NOT be copied
- **Level 1 / 150 XP / "Rookie Manager"** — a direct D4 violation. No XP, no levels, no ranks.
- **Fan Trust and Team OVR as bare 0–100 meters.** Unless the model computes them honestly and
  a student can attribute a change to their own choice, they are decoration.
- **Four generic decision cards ("Shape Our Identity", "Grow the Brand")** — this is the
  decision-card menu the founder explicitly rules out. The mockup's centre is a menu of four
  abstractions; the rebuild's centre must be an actual constrained allocation the pair operates.
- **"6 Days Left"** as a fake deadline; our TIME CUT is real, server-clocked, and teacher-held.
- The nine-item left nav: a lesson is not a franchise-management app.

---

## Synthesis — the seven qualities the mockups actually establish

1. **Dark premium, near-black with a single brand accent.** Already our register; the mockups
   run it at higher polish and larger scale than M1 currently does.
2. **A named, pictured, factual place you belong to.** The franchise band. M1 today has none.
3. **Constraints live in a persistent header strip, several distinct resources, never one bar.**
4. **Information density is allowed — on the teacher surface.** Three columns, many panels.
   The student surface stays quiet; the board stays enormous and sparse.
5. **Data is part of the world**: sparklines inside desk cards, trend lines inside strategy
   cards, a ring inside a phase chip. Not a chart pasted on a page.
6. **Class evidence is composed as a comparison of strategies, not a ranking of people.**
7. **The grade band is a visible, first-class property of the room on both student and teacher
   surfaces.**

## The three hard prohibitions the mockups violate

- **No XP / level / rank / trophy / champion register** (D4).
- **No uncomputed meter.** Team OVR, Fan Trust, Franchise Value, and the 10-year outlook are
  all forbidden unless the economic model computes them honestly and a student can attribute
  a change to their own decision. Default posture: they do not exist.
- **No invented franchise.** San Antonio Summit / Summit Center / "Team 4" are out. Real NBA
  clubs, named as typographic wordmarks with no logo art, per the M2 sports-reality rule.
