# Module 2 "Money in Motion" — Central Prototype Spec

**Working title: "The Box Office."** One playable experience, built to LessonModule
spec, chosen as the single strongest demonstration of Module 2's durable concepts
(revenue, incentives, path dependence). It is not the whole module — L2's
revenue-sharing dial and L3's multi-season parity chart are named but deferred
(see §h). Same discipline as `docs/gauntlet/module-1/PLAYABILITY_SPEC.md`: one
physical metaphor carries the whole thing, decisions emerge from operating a
system, not from menus.

## What survives from `101-M2-L2`, and what dies

`101-M2-L2` ("Small Markets, Big Money") is a choose-your-own-adventure case file:
three pre-written text cards per round ("Plan A / Plan B / Plan C"), a button
click, a paragraph of consequence, four metric bars nudged by hardcoded deltas.
This **is** a decision screen — info → choose A/B/C → continue — the exact pattern
the product philosophy forbids, however good the prose is.

**Dies:** the card-picker UI, the four abstract metric bars (Owner Backing /
Small-Market Trust / etc. as button-driven deltas), the fixed three-option menu,
all hardcoded flavor text.

**Survives, transformed:** the one structurally excellent thing in the file —
`ROUND2[state.r1]`: round 2's entire situation is a lookup keyed on round 1's
outcome. REALITY_CHECK independently verified this is the cleanest path-dependence
mechanic in the whole portfolio, and it is worth keeping as a **pattern**, not as
code. The Box Office reimplements it as `roundTwoOpening(zone(state.r1))`, where
`state.r1` is no longer a chosen card ID but a **continuous number the student set
themselves** (a ticket price), banded into a zone after the fact. This is strictly
more "operate the world" than the original: nothing is picked from a menu, the
zone is discovered, not declared. The legacy's specific revenue-sharing numbers
and owner/small-market framing are good raw material for the *next* prototype
(L2's revenue-sharing lesson) and are not reused here.

## (a) Play fantasy

*"I run ticket prices for my team's homestand, and the mess I'm dealing with today
is the one my own price created last time."*

## (b) Core activity

Role: **Box Office Operator** (not GM — a deliberate break from Module 1's
GM-as-roster-builder). Named objects, all on one screen, the **Box Office
Counter**:

- **Price Dial** — the one manipulable object. A continuous slider, $10–$120 in
  $5 steps, for this homestand's ticket price. Nothing else is clicked or chosen.
- **Fan Meter** — a stadium-bowl grid of seat dots that live-fills or empties as
  the dial moves, previewing (not yet locking) how many fans show up at that
  price.
- **Revenue Flow** — three visible pipes feeding one total: Ticket Revenue (price
  × fans, moves live with the dial), TV Revenue (fixed, given — "your national
  deal, same no matter what you charge"), Merch Revenue (small, scales with
  fans). The total is what will fund the team's **Payroll Bill**, a fixed target
  line shown throughout ("$75,000 due this homestand") — this is the traceable
  dollar the curriculum asks for: ticket price → attendance → revenue → what the
  team can afford.

Each pair is silently assigned one of four **Market Cards** (Legacy Original,
Expansion Team, Riverside Market, Capital Market) at LOBBY, deterministically by
seat/join order — not `Math.random()`, attributable, same discipline as Module
1's Hidden Rival Indicator. Each card sets a true, hidden demand curve (base fan
interest and price sensitivity), so the room does not converge on one "correct"
price — the spread is honest, not manufactured.

## (c) Core loop

**SET** (drag the dial, watch the Fan Meter and Revenue Flow ripple live) →
**LOCK** (commit the homestand's price) → **REVEAL** (the true outcome lands —
Fan Meter animates to the real attendance, Revenue Flow posts the real total) →
**INHERIT** (a new pressure opens Homestand 2, shaped by where Homestand 1
landed) → **SET again** under that pressure → **LOCK** → **REVEAL** → **COMPARE**
(own two-homestand path plus the whole class's) → **ARGUE**.

The fun beat is the live ripple during SET: because revenue = price × fans, and
fans fall as price rises, the Revenue Flow number visibly climbs, peaks, and
falls as the dial slides past the sweet spot — a hump the student *finds*, not one
that's explained. That discovery, plus the tension of not knowing the true curve
until REVEAL, is the loop's own reward — no points system needed.

## (d) How path dependence is felt

Round 1's price is compared to that market's true revenue-maximizing price and
banded into a zone — never shown to the student as a number, only lived through:

- **Overpriced zone** (priced well above the sweet spot): Homestand 2 opens with
  the Fan Meter already half-empty *before the student touches the dial* —
  "word got around that your seats are expensive" — and the true demand curve
  itself has shifted down. Getting fans back costs more than it would have cost
  to keep them.
- **Underpriced zone** (priced well below): Homestand 2 opens with a full Fan
  Meter but the Payroll Bill banner shows a shortfall already carried over from
  Homestand 1 — a packed house that didn't pay the bills. Raising price now
  risks the very fans who showed up.
- **Sweet-spot zone**: Homestand 2 opens with a modest surplus and a real choice
  — bank it safely or reinvest in the stadium experience for growth (upside with
  risk). This keeps the strongest students in genuine tension too, not just
  correcting the extremes.

This is `ROUND2[state.r1]` reborn as `roundTwoOpening(zone)`: the *starting
state* of the second round — not a text paragraph — is what changed. The student
walks into Homestand 2 and the world has already moved because of what they did
in Homestand 1. That is the felt version of "yesterday's choice creates today's
problem."

## (e) The revenue tradeoff

**Price vs. attendance**, live and moment-to-moment during SET — curriculum M2L1's
own framing, the best-supported tension in the source material. **Short-term cash
vs. fan base**, round-to-round — the overpriced path banks a bigger check in
Homestand 1 but starts Homestand 2 in a hole it dug itself. Both tradeoffs are
visible on one screen; neither requires the words "elasticity" or "demand curve."

## (f) Class reveal

A live **Class Scatter** on the board view: one dot per pair per homestand
(price on the x-axis, revenue on the y-axis), populating as pairs lock. By the
end of Homestand 1 the room sees a cloud with a hump — a real, class-generated
demand curve, made of their own prices, argued over before anyone names it
"elasticity." After Homestand 2, each pair's two dots connect with a line, so the
board also shows who moved their price and which direction the pressure pushed
them — direct fuel for "did changing your price work, and why?"

## (g) Concept ledger seed

- **Primary:** revenue (price × quantity, felt as a hump, not a formula); path
  dependence (Homestand 1's outcome sets Homestand 2's starting conditions).
- **Secondary:** incentives (the pull toward short-term cash vs. protecting the
  fan base); pricing under real uncertainty (the true demand curve is hidden,
  not random).
- **Experienced moment:** dragging the Price Dial and watching Revenue Flow
  climb, peak, and fall while the Fan Meter empties — the sweet spot is
  discovered mid-drag, not explained beforehand.
- **Class evidence:** the Class Scatter's hump-shaped cloud, plus the connected
  two-dot lines showing who recovered and who didn't in Homestand 2.
- **Formalization line:** "Every dot up there is a real price one of you set.
  Look at the shape — charging more doesn't make more money forever, because
  people stop showing up. That hump is why almost nobody landed the same
  answer. And for some of you, Homestand 2 opened already broken — not by bad
  luck, but by your own price from Homestand 1."
- **Beyond sports:** concert and movie ticket pricing; a school car-wash or
  bake-sale price point; a small shop that raises prices and loses regulars
  versus one that runs a sale and can't cover the register.

## (h) Prototype vs. deferred

**The prototype must demonstrate:** the live Price Dial / Fan Meter / Revenue
Flow feel with an honest, discoverable hump; the two-homestand path-dependence
bridge (zone-based `roundTwoOpening`, altering Homestand 2's *starting state*,
not just its text); the Class Scatter reveal across both homestands; a synthesis
that names revenue and path dependence using the room's own dots.

**Deferred to the rest of the module (not this build):** TV and merch as
*interactive* levers — here they are passive, visible pipes only, enough to
teach "revenue funds payroll" without a second dial; the revenue-sharing knob
and big-market/small-market pairing (curriculum L2 — the legacy file's real
content home, to be rebuilt as an operated dial, not a card picker, in a later
prototype); the multi-season parity chart and cap-vs-no-cap comparison
(curriculum L3); any live multiplayer head-to-head — a solo-operator-plus-class-
aggregate structure already carries the economics honestly here, so a second
live participant is not required to make the tension real (the module-2 rule:
multiplayer only when it materially changes the economics).

## (i) Implementation shape

A single `LessonModule<BoxOfficeState>` registered against the runtime in
`runtime/src/shared/lessonModule.ts`.

**Phases used** (ordered subsequence of `CANONICAL_PHASES`, all ten):
`LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ADAPT → COUNTERFACTUAL → ARGUE →
SYNTHESIS → COMPLETE`.

- `LOBBY` — assign each seat a Market Card deterministically from seat order.
- `HOOK` — fantasy line + one teacher-driven demo drag of the dial.
- `PLAY` — Homestand 1: students SET and LOCK a price.
- `REVEAL` — Homestand 1 outcome resolves; Fan Meter/Revenue Flow animate to the
  true values; Class Scatter begins populating.
- `CONSEQUENCE` — the zone computes and Homestand 2's starting state is set;
  the "Empty Seats" / "Cash Crunch" / "Raise or Hold" banner appears — the new
  pressure named plainly, on-screen, before anyone touches the dial again.
- `ADAPT` — a short framing beat: "Homestand 2 opens under this. What's your
  plan?" (paired verbal note, no rebuild — mirrors Module 1's brief Adapt stage).
- `COUNTERFACTUAL` — this **is** the second run: Homestand 2, SET and LOCK
  again under the altered starting state. Framed explicitly to students as
  "same market, new conditions, try again" — the counterfactual is lived, not a
  hypothetical toggle.
- `ARGUE` — Homestand 2 REVEAL folds in here with the debrief: Class Scatter
  shows both homestands connected per pair; cold-call 2–3 pairs.
- `SYNTHESIS` — teacher formalizes using the room's own scatter (line above).
- `COMPLETE` — exit prompt: "what did yesterday's price cost you today?"

**State** (pure, server-authoritative):
```
{
  phase, seatMarket: Record<SeatId, MarketCardId>,
  priceH1, priceH2: Record<SeatId, number | null>,
  zone: Record<SeatId, "over" | "under" | "sweet" | null>,
}
```
Attendance/revenue are **derived**, not stored: `attendance(price, market, zone)`
and `revenue(price, market, zone)` are pure functions of a linear demand curve
(`fans = clamp(baseFans − sensitivity × price, 0, capacity)`), so `reduce()`
only ever records a locked price and a computed zone — REVEAL and ARGUE render
by calling the same pure functions the reducer used, guaranteeing the board
never shows a number the reducer didn't produce. No RNG anywhere; the "honest
uncertainty" is that the curve's constants are never surfaced to the student, not
that any output is randomized.

**Views:**
- `studentView` — own Market Card (flavor only), Price Dial state, live local
  preview of Fan Meter/Revenue Flow (recomputed client-side from the same pure
  function for instant drag feedback, submitted only on LOCK), Payroll Bill
  line, own zone banner in CONSEQUENCE/COUNTERFACTUAL.
- `teacherView` — per-seat lock status, zone distribution counts, a manual
  reveal trigger (fallback for the synchronized Class Scatter reveal, matching
  Module 1's teacher-fallback rider).
- `boardView` — Class Scatter (both homestands), zone-distribution tally, no
  per-seat private data.

**Build-cost class:** same tier as Module 1's cheapest lesson (Draft Day) plus
Module 1 L2's async-submit/teacher-triggered-reveal pattern for the scatter —
no bidding engine, no turn-based multiplayer, no live opponent, no new
simulation engine. Placeholder-acceptable visuals: the Fan Meter can ship as a
plain grid of filled/unfilled dot icons and the Revenue Flow as three labeled
number readouts with a simple bar — the spatial metaphor that must survive into
any polish pass is **the Box Office Counter**: one dial, one stadium-fill
graphic, one flowing total, exactly as named above.
