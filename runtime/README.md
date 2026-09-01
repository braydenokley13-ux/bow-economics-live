# BOW Economics — Track 101 Live-Session Runtime

**Status: candidate.** Technically verified — the server logic is covered by
real tests (458 passing, see below), `npm run build` and `npm test` are
green, and `m1l1-draft-day`, `m1l2-trade-deadline`, and `m1l3-free-agency`
have all been driven end-to-end with Playwright against the real compiled
server (L1: create → join → advance → build → lock → reveal → shock → adapt
→ repair → synthesis → complete; L2: `runtime/scripts/e2e-l2.cjs` — L1 played
for real through the API to produce a genuine seed, then linked L2 creation,
claiming, all three deadline paths incl. competing bids and a loss,
teacher-staged reveal, aftermath rescue, synthesis, zero console errors; L3:
`runtime/scripts/e2e-l3.cjs` — L1 and L2 both played for real through the API
to produce a genuine seed, then linked L3 creation, claiming incl. a late
joiner, a real four-day signing window (student pages run at the classroom
Chromebook shape, 1024×600, with an explicit on-screen check the offer
composer is reachable there — see N1 below) exercising a bidding war, a
price collapse, coordinated lowballing that still raises the ask, an outbid
team, and a day-4 desperation signing, the full staged finale through
COMPLETE, zero console errors) as well as smoke-tested by hand for
restart-survival. It has **not** been gameplay-tested by a fresh student
audience and it has **not** been run in a classroom, or anything resembling
one. Fresh-context verification rounds have run against this runtime's L1
(`docs/gauntlet/module-1/VERIFY_GAMEPLAY.md`, `VERIFY_ECONOMICS.md`,
`VERIFY_RUNTIME.md`) and L3 (`VERIFY_L3.md`), and every required repair from
both has been applied — see "Repair charter round 1" and L3's own "Repair
round" below. Per Decision D12, a live classroom session still requires an
independent fresh-context verification pass on this state before use.

This package builds the **runtime the gameplay team plugs a lesson into**,
plus real Track 101 lessons: `m1l1-draft-day` (Module 1, Lesson 1 — "Draft
Day"), the Roster Wall / salary-cap build described in
`docs/gauntlet/module-1/PLAYABILITY_SPEC.md`; `m1l2-trade-deadline` (Module
1, Lesson 2 — "The Trade Deadline"), which carries a completed L1 session's
locked rosters forward (see below) and adds a midseason report, stand
pat/veteran/sealed-bid deadline decisions, and a teacher-staged reveal;
`m1l3-free-agency` (Module 1, Lesson 3 — "Free Agency: The Signing Window,"
the **module close**), which carries a completed L2 (preferred) or L1
(fallback) session forward into a four-day open market under a newly-risen
$130M cap (see below). (`m2-box-office`, the Module 2 prototype for
price-setting under hidden demand, was superseded per D20 and is no longer
registered — see `docs/RAMAZ_READINESS.md`.) `lobby-demo` (students tap a color,
teacher reveals the class distribution on the board) also still ships,
unchanged, as the minimal proof the runtime itself is genuinely
lesson-agnostic.

## Module 1, Lesson 2 — The Trade Deadline (L1→L2 carry-forward)

`src/modules/tradeDeadline.ts`. Each L2 franchise picks up exactly where its
L1 roster left off: a midseason report (deterministic — a market bust reads
as slumping, a gem as breaking out, computed off L1's own price/rating data,
never `Math.random`), then one irreversible deadline decision — **stand
pat** (an explicit, reasoned lock), **cut + sign a known veteran** (safe,
dead-cap bite), or **cut + sealed bid** on a scarce, teacher-revealed target
against a hidden rival bid *and* a hidden seller reserve (a lowball never
wins). A team that cuts and loses its bid keeps the dead-cap hit and a real
open slot, rescued only in a restricted ADAPT window — full-wall teams get
nothing to do there, closing the "wait and see" exploit.

**The seed.** The runtime itself stays lesson-agnostic: `POST /api/sessions`
takes an optional `sourceSessionId`; the server resolves it to that other
session's own `{lessonModuleId, state}` and hands it to the new module's
`initialState` as an opaque `seed` (`shared/lessonModule.ts`). Only
`tradeDeadline.ts` (`extractCarriedFranchises`) knows what a
`m1l1-draft-day` seed means — it reads every *locked* L1 team, silently
skips anything invalid (never locked, a slot still empty from an unrepaired
shock, a corrupted id), and turns the rest into claimable franchises
students pick up by name/crest on `/play`. A missing/unlinked/malformed seed
just yields an empty pool — every seat then gets an honest, deterministic
stock "expansion franchise," so the lesson runs standalone too. `/teach`
exposes this as a "link to a completed Draft Day session" dropdown at
create-session time.

## Module 1, Lesson 3 — Free Agency: The Signing Window (module close)

`src/modules/freeAgency.ts`, built against
`docs/gauntlet/module-1/L3_CHARTER.md`. The season's stretch run: the
league's new TV deal raises the salary cap from $100M to $130M, so every
franchise suddenly has room — but every franchise's books arrive exactly as
L1/L2 left them, dead cap included. Eight fixed free agents (two per
position, star/solid/value tiers) hit the market for a four-day signing
window run entirely inside PLAY (a day is a module-internal counter, not a
runtime phase). Each day, each team submits **at most one binding, sealed
offer** (or holds — an explicit one-tap action so the teacher's pacing panel
can tell "waiting on the market" from "hasn't looked yet"); a payload-free
`teacher:closeDay` hook resolves every still-open agent simultaneously and
deterministically: the top offer signs if it clears the agent's live asking
price (or unconditionally on day 4 — desperation), otherwise the price moves
by demand (0 offers −$10M, 1 offer −$5M, 2+ offers **+$5M** — coordinated
lowballing still raises the price, floored at $10M). **A losing offer costs
nothing but the day** — unlike L2's sealed bid, a roster slot's incumbent is
only ever released, with the standing ~10% dead-cap bite, the instant a
signing actually wins. Each of the eight agents carries a hidden
"playoff factor" (most ±2, one riser +6, one shrinker −7, both with an
honest public hint) revealed only in a teacher-staged finale
(`teacher:revealNext`): a window recap, one factor reveal per agent
(signed first, then unsigned), final standings, a staged semifinal+final
bracket (deterministic — higher final team form advances), and GM Awards
(THE BARGAIN, PERFECT TIMING, IRON BOOKS, THE WALK-AWAY) computed from the
session's own real market history, omitting gracefully when nobody
qualifies. COUNTERFACTUAL and SYNTHESIS close the loop with personal
what-ifs, class-level cards (the patience dividend, the near-miss on the
riser, the dead-cap drag), and five economics cards computed from frozen
history — this is also the **module's own close**, so its COMPLETE copy
closes the whole three-lesson arc, not just L3.

**The seed**, preferred `m1l2-trade-deadline`, falling back to
`m1l1-draft-day`, else stock: `extractCarriedFranchisesL3` in
`freeAgency.ts` snapshots each claimable franchise — final roster, carried
dead cap, and a journey summary — at session-creation time, frozen (D15)
from then on. It reuses tradeDeadline's own `extractCarriedFranchises`
(L1 fallback), `stockFranchiseFor` (the stock-only fallback), and `formFor`
(the L2-carried midseason-form snapshot) directly rather than re-declaring
any of them — those three were made `export`s in `tradeDeadline.ts`
specifically for this (pure visibility change, zero behavior change to
L1/L2). A won L2 sealed-bid TARGET's dollar `trueValue` maps into the same
0-100 form scale every other occupant uses via an explicit, documented
formula (`targetForm`), never silently conflated with a rating.

**Teacher notes.** `/teach`'s create-session flow gains an m1l3 option whose
source-session picker accepts either a completed Trade Deadline (L2,
preferred) or Draft Day (L1, fallback) session, labeled `[L2]`/`[L1]` in the
dropdown. The control room gains a **"Close signing day"** button (shows
live acted/pending counts, legal even with zero offers) alongside the
existing **"Reveal next"** button, reused for L3's own staged finale. Leaving
PLAY early — on any day — **permanently ends the signing window**: only the
day actually open gets auto-closed (`onPhaseExit`, the exact same resolution
math as the button), remaining days simply never happen. `/teach` warns with
a `confirm()` before this, naming the real day/team counts, the same
established idiom as L2's own early-REVEAL-advance warning. **The market is
tuned for 6+ teams** — eight fixed agents against a smaller class still
plays (prices just fall faster, since fewer teams means fewer rival offers
driving the demand curve up), but the "no dominant strategy" tension the
charter names is sharpest with real competition for a scarce 2-star tier.

**Repair round (post-verification, `docs/gauntlet/module-1/VERIFY_L3.md` —
ACCEPT WITH REQUIRED REPAIRS, rating STRONG).** Six findings, all repaired:
the market's own governing rules (one offer a day, the 0/1/2+ price-move
rule, day-4 desperation) are now readable in a compact collapsible panel on
both HOOK's market preview and the PLAY composer (R1); withdrawing an offer
now **locks the team out of a new offer for the rest of that day**
(`outForDay`, editing a standing offer stays free) — closing a free
submit-then-retract loop that could fake the public interest-count signal
with zero cost, framed in-fiction as "pulling out of talks" (R2); THE
WALK-AWAY now picks the most-negative-factor agent a team genuinely engaged
(stood at close, or withdrew) and never signed, so it can actually spotlight
the −7 star shrinker instead of deterministically landing on the cheapest
value player every session (M1); IRON BOOKS now fires for a real
whole-class hold, not just when at least one other team signed someone (M2);
the offer composer scrolls into view when it opens, confirmed reachable and
submittable at the classroom Chromebook shape (1024×600) in `e2e-l3.cjs`
(N1); the teacher aggregate shows an agent's name, not its raw id (N2).

## Module 2, Lesson 1 — Full House (`m2l1-full-house`)

The selected Module 2 architecture's anchor lesson (`docs/gauntlet/module-2/
ARCHITECTURE_SELECTION.md`, Candidate C). A pair runs a real NBA club's
**building**: five game nights, two dials committed **blind**, two books that
cannot be summed.

**Phases:** `LOBBY → HOOK → PLAY → REVEAL → ADAPT → COUNTERFACTUAL →
SYNTHESIS → COMPLETE`. All five nights live inside PLAY, paced by a teacher
**night bell** ("Open the doors"); the design's mid-play ADAPT questions ship
in the teacher panel and the canonical ADAPT phase carries them after the
curves. CONSEQUENCE and ARGUE are not declared — the design's L1 flow has no
separate block for either (consequence is felt during PLAY, the argue prompt
rides on COUNTERFACTUAL).

**Blind commitment is structural, not a convention.** `base` and
`sensitivity` are module-scope constants and are never serialized to any
view, pre- or post-lock. The pre-lock student payload contains the printed
card, the dials' dollar positions, printed operating facts (capacity,
tonight's bill, the season-plan price) and the pair's own realized history —
and nothing derived from the pending action. Asserted in
`fullHouse.test.ts` by settling the pending action and proving none of its
quantities appear in the payload.

**Two books (R4).** CASH and RENEWALS. RENEWALS answers to the season-ticket
plan price and to what a plan holder thinks the night is worth: price well
under the plan price and the plan looks worthless, price above what the night
is worth and they quit, and in between (well above it on a big card) the plan
looks like a bargain. Neither error direction is dominated, and the cash-best
price is never the renewals-best price in any reachable state.

The tension holds at SEASON scale too, which it did not after repair round 1:
the max-cash season used to end with MORE renewals than never touching the
dial, so the two notes printed beside those rows on the student device were
false (`gate-l1-econ-r1` R1, blocking dissent `econ-l1-season-books`). Cause:
`renewalFans` was 60/55, which made a renewal point worth ~$3,100 of
later-night cash — renewals were lagged cash, not a rival book. Repaired at
the constants (`renewalFans` 10, `planSlope` 1.8, `eventRenewalDollars`
$60,000/$30,000) and pinned by harness **P14**, an exact season DP:
New York never-move-the-dial **$1,215,532 / 80%** against most-cash
**$2,359,868 / 53%**; Memphis **$830,312 / 80%** against **$1,923,684 / 54%**.
Every COUNTERFACTUAL note is now read off those two rows rather than asserted.

**BC-2 (the two constant defects the selection econ review named) is
repaired at the shipped constants.** R6: worst error-cost asymmetry is now
**1.38×** (was 16.5× against the low side at New York), measured at equal
distance from the true continuous argmax across every market × card ×
reachable renewals/carry state. R8: **Memphis reaches 100% fill** on two
cards (was capped at 75.3% at any legal price); the board carries fill % and
sold-out nights, a non-money success metric, so the small market's path is
visible inside L1. Re-verify with
`node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` from the repo
root (14 properties, exit 0 only when all hold; it imports the built module
so it can never drift from the shipped constants).

**Teacher controls.** `Open the doors` settles every desk simultaneously
against the card printed before anyone touched a dial (a desk that never
locked auto-commits at the plan price, flagged `auto` on its own screen — the
button carries that as a tooltip); `Release the Two Peaks` is a manual reveal,
unavailable until Night 3 has actually been played and carrying its own reason
either way; `Reveal next` names the beat it will land ("Reveal 4 of 7 —
Night 4 — the shock"). Every one of them has an automatic fallback: leaving
PLAY closes all remaining nights and releases Two Peaks; leaving REVEAL plays
out every remaining stage.

**Director layer.** `/teach` renders a per-phase director panel for this
lesson — NOW with a minute budget, ON THE PROJECTOR RIGHT NOW (alive in every
phase, not just PLAY), WATCH FOR computed from live state with desks named as
data, TRIGGER, ASK with the answers, DON'T EXPLAIN YET, TIME CUT, the seven
named reveal beats with a line for each, what the student screen is offering,
and the simplifications ledger. Ported from `DESIGN_C_FIRSTPRINCIPLES.md`'s
"TEACHER FLOW"; see `teacherDirector()` in `fullHouse.ts`. It is intelligence,
not a script to read aloud.

**Board privacy.** Desks appear as `Desk 4 · Memphis Grizzlies` with a
crest — never a student name, never a seat id. Markets are assigned
deterministically and visibly (odd desks New York, even desks Memphis) and
never ranked; no board surface sorts by money.

**Late/absent seats.** A seat joining mid-window gets a desk, a market, and
the nights it missed played at the plan price by "the desk manager,"
labelled `covered` on its own history — real books, not a blank sheet.

**Self-hosted fonts.** `src/client/shared/fonts/` holds the latin subsets of
Bebas Neue (display) and Space Grotesk (numerals), 36KB total, copied into
`dist/client/shared/fonts/` at build time and served off this origin. No CDN
and no network call — the zero-internet promise is unchanged. Both are SIL
Open Font License 1.1; the license text is not vendored (see the note at the
top of `theme.css`). Before this the repo declared the families and shipped no
font file, with "Arial Narrow" ahead of Bebas and "Courier New" behind Space
Grotesk, so every dollar figure in BOTH modules rendered in Courier
(`gate-l1-visual` P1).

**End-to-end proof.** `node scripts/e2e-m2l1.cjs` (after `npm run build`)
drives one teacher, one projector and four Chromebook-shaped student pages
through the whole arc, including a late joiner at Night 3, a desk that never
locks Night 5, the teacher-released Two Peaks, and all seven reveal stages.
It also asserts the SYNTHESIS heading and the first row of cards are *fully
inside the viewport* at 1366x768 and 1920x1080 — rendered boxes, not strings
in `innerText` — because `#stage` used to centre-flex inside
`body{overflow:hidden}` and silently behead its own peak beats while text
assertions passed (`gate-l1-projector` repair 2). `#stage` scrolls now, so
nothing is ever unreachable. Screenshots land in
`docs/gauntlet/module-2/screens-l1/`.

## Module 2, Lesson 2 — You Don't Play Alone (`m2l2-host-league`)

Module 2's interdependence lesson, built against `DESIGN_C_FIRSTPRINCIPLES.md`
(L2) and the binding charter's BC-3, BC-5 and BC-7. Every desk runs a real NBA
club's building inside **one league**. Each week you HOST one club and VISIT
another, and every club in the league is either another desk or the league
office. Your home gate is a direct function of the visiting club's **DRAW** —
and that Draw is another desk's own doing.

**Phases:** `LOBBY → HOOK → PLAY → REVEAL → ADAPT → ARGUE → SYNTHESIS →
COMPLETE`. All three weeks live inside PLAY, paced by a teacher **week bell**
("Close the week"). The design's mid-lesson decomposition reveal is a
teacher-released panel *during* PLAY (`Release the Handed-To-You bar`), exactly
the pattern L1's Two Peaks release established, so the room plays its last week
knowing what it now knows and the board can then show whether the room changed
its mind. COUNTERFACTUAL is not declared: this lesson's counterfactual is
another desk's decision, which the room lived rather than replayed.

**Two books that do not add up (R4):** CASH and DRAW. The reinvest dial trades
one for the other and there is no exchange rate — a Draw point is not a dollar,
and most of the money a Draw point earns lands on *other* desks' books.

**The decomposition is computed, not asserted (BC-5).** `settleHome` runs the
same clamped settlement three times — at the league Draw floor for both clubs,
then with the host's own Draw, then with the visitor's — and returns the three
differences. They sum to the turnout exactly, are non-negative by monotonicity,
and survive the capacity clamp (on a sold-out night the visitor block is
exactly the extra people the visitor got through the door). Residual is 0 by
construction in fans and in dollars, swept over 473,984 states by the tuning
harness and over 15k+ states in the suite. This is the repair for the Stage-0
attribution defect `PLAY_REVIEW.md` named, where the prototype printed "what
your decision did (your own draw × your open sections)" over a figure that did
not move when Draw went 30 → 100.

**Blind commitment is structural.** `base0`, `sens`, `ownDrawFans`,
`visitorDrawFans`, `effortScale`, `localBase` and `drawDollars` are
module-scope constants and are never serialized to any view, pre- or post-lock.
The pre-lock payload carries this week's pairing, every club's printed Draw,
the three-week schedule, the dial positions and the desk's own history — and
nothing derived from the pending price or share.

**Pipe magnitudes, re-derived (SELECTION_SR_REVIEW C-2).** C-2 found Design C's
indicative L2 pipe table inconsistent with its own gate-share ledger, with
SR-1 ("the Knicks have the league's highest gate") and with its own horizon
compression — a per-night-sized gate printed beside a per-season-sized national
figure. Everything here is on **one** scale: one week is one home date; the
real per-club national share (~$200M/yr over 41 dates ≈ $4.9M/date) shrunk by
the same ~5× this product shrinks ticket prices gives `NATIONAL = $950,000`,
identical for every club. At the shipped constants a New York home week at a
neutral matchup takes $665,280 at the gate against $2,659,120 of weekly revenue
(25.0%); Memphis is 18.9%. Both sit inside the ledgered fifth-to-a-quarter band
*at the house price* — away from it the share moves a long way (8.1% at $120),
so the student-facing caption no longer states the band as a universal. The
national check is the tallest single pipe for a typical club without being half
of the biggest market's revenue; it is **not** tallest for every club (local
media overtakes it above Draw 50 on the new-york profile, so Boston and the
Lakers clear it from week 1). The earlier claim that "New York has the league's
highest gate" is **retracted** (`gate-l2-sr` MODERATE-3): demand is
capacity-independent and turnout is clamped, so a bigger building on the same
profile out-gates Madison Square Garden on a sold-out night. The module header
carries the same corrected derivation.

**No RNG anywhere.** Schedule, bots and the week-2 star departure are pure
functions of state. The departure lands on the lowest-numbered league-office
club — chosen *exogenously*, because choosing it by "highest Draw" would have
taught the opposite of the lesson (reinvest, and get punished for it) — and it
is printed on every desk's card before anybody prices week 2.

**Bots and late joiners.** Clubs with no desk are run by the league office on a
published share ladder and are labelled as such on every surface. A desk that
joins late claims a club that has been playing all along and inherits its real
books, marked `covered` on its own screen. The league always keeps at least two
league-office clubs, and it seats at most 18 desks.

**Tuning harness.** `node docs/gauntlet/module-2/stage0/l2-tuning-harness.mjs`
(after `npm run build`) — 11 falsifiable properties with an honest exit code,
run against the built module and the *real reducer*, so every season it plays
is a season a class could play. At the shipped constants all 11 hold: no
dominant reinvest line (an adaptive line beats always-max, always-zero and
copy-the-leader at both a big-market and a small-market seat, by $123k-$870k);
the externality is material (a Draw-90 visitor draws 2.2-2.6× a Draw-15
visitor's crowd at the same price); free-riding is punished *and* visible on an instrument that measures the
DECISION — and P3 now carries the control it lacked: the same room played with
every desk at 0% must produce a by-choice ledger that is identically silent,
while the dealt ledger in that same room still shows a ~$2.0M net spread (which
is exactly the confound the old P3 was reading as free-rider evidence); no seat
can be stranded (every club clears
its weekly bill from every reachable state, with $242k-$291k of room at the
cash-best price in the worst case); the decomposition residual is 0; the
cash-best price moves $28-$32 with the visitor's Draw; error costs are
symmetric off the capacity clamp (worst ratio 1.02) and, on the clamp, run
against the *low* price at every offset so the model never teaches that
charging less is the safe mistake; every building can fill; the Draw ceiling
settles at 87 for every market.

**End-to-end proof.** `node scripts/e2e-m2l2.cjs` (after `npm run build`)
drives one teacher, one projector and **twelve** Chromebook-shaped student
pages through the whole arc. Twelve is the point: the Handed-To-You bar is
paged five desks at a time, and a guard that only sees four desks cannot fail
at the size the fit defect appears. Every board frame is asserted to FIT at
1366×768 *and* 1920×1080 (`scrollHeight <= clientHeight`, not "reachable by
scrolling"), the evidence tier is asserted above the 2.6%-of-height back-row
floor, and the run also proves the pre-lock screen shows no outcome, the board
shows nothing about an open week, the star departure reaches every desk before
week 2 is priced, the week bell auto-commits a desk that never locked, and all
five reveal stages render their own beat. Screenshots land in
`docs/gauntlet/module-2/screens-l2/`.

Two instruments were added in the five-gate repair round, because the existing
guards could not see either defect. **Silent truncation:** CSS ellipsis produces
zero overflow and zero clipping, so the fit instrument passed schedule frames on
which every club name had been thrown away at 11 and 12 desks. Every element
under `#stage` is now scanned at both projector shapes for a declared
`text-overflow: ellipsis` and for horizontal self-clipping
(`scrollWidth > clientWidth` under a non-visible overflow); reintroducing the
original rule makes the run fail with 13 named offenders. **The 1024×600
fold:** 48 assertions per run, on every desk, with no manual scroll — after
each week bell the decomposition, the KEPT figure and the road card must all sit
inside `0..600` and next week's price dial must not, and `LOCK IT IN` must be
above the fold in every week.

**No L1 → L2 seeding, deliberately.** D9 persists state only where yesterday's
choice creates today's problem, and in this lesson today's problem is created
by the *other desks' decisions today* — the visitor term is the whole
mechanism. Three specific reasons, recorded in the module header: BC-5 binds
the decomposition to be attributable from the UI alone, and a carried per-desk
demand term adds a fourth channel nobody in the room created this lesson; L1
runs two markets across every desk while L2 gives every desk its own club, so
the design's "carry your market forward" limb is not implementable as written;
and L1's carried cash would be mechanically inert, because the equal national
check clears any carried debt inside week 1. What is carried is the lesson-level
chain, in copy. If a later gate wants mechanical continuity, the cheapest
honest limb is L1 renewals → this club's `base0` offset, printed on a
how-you-got-here card and named inside the `fromBuilding` block.

## Module 2, Lesson 3 — Writing the Rule (`m2l3-write-rule`)

The module finale. The room writes a revenue-sharing rule on two dials, votes
it in at two-thirds, and then plays a season **under the rule it wrote**.

**The arc, in one PLAY phase and six more.** LOBBY (how you got here) → HOOK
(Boston, June 2025, commit-then-reveal) → PLAY, which holds three offer rounds
(teacher-paced, NOT timed — there is no timer anywhere in this lesson), the
two-thirds test and three season weeks, because the canonical phase
list is strictly increasing and a season cannot come after `REVEAL` → REVEAL
(five staged beats) → CONSEQUENCE → COUNTERFACTUAL → ARGUE (the Kings 22-8
Board-of-Governors capstone) → SYNTHESIS (the module finale cards) → COMPLETE.

**BC-1, the charter's binding condition, and what it actually required.** The
Stage-0 arithmetic harness (`l3-arith.mjs`, exit 1) had already refuted the
naive claim every candidate design leaned on — that a sharing rule makes every
seat's ticket price fall. With linear demand `q = B − k·p` and untaxed per-fan
in-arena spend `a`, the own-take maximiser is `p*(s) = B/(2k) − a/(2(1−s))`, so
the price move is `a·s/(2(1−s))`: driven entirely by the **untaxed** stream,
exactly zero under a binding capacity clamp, and exactly zero again if the rule
taxes every stream uniformly. This module ships that arithmetic as the lesson
rather than fighting it:

- **The signature instrument is the differential reinvest response**, not a
  price drop. A club keeps `kappa(s) = 1 − s(N−1)/N` of every extra local
  dollar; Draw is bought with square-root returns; so the cash-optimal reinvest
  goes as `kappa²` — the `(1−s)²` form the charter names. Measured at the
  shipped constants, brute-forced over the shipped dial through the shipped
  settlement: **new-york 25%→5%, golden-state 30%→15%, oklahoma-city 35%→10%,
  memphis 20%→5%** across share 0→60. Every one clears the charter's two-dial-
  step floor; the smallest is three steps.
- **A moving arrow beside a flat one.** The two small-market profiles are
  unclamped at their optimum and their best price falls $6–$8 with the share;
  the two big-market profiles are capacity-bound (99%+ full at their own
  optimum) and their best price **does not move at all**. The board prints both,
  and the teacher's ASK is "why didn't New York move?" — the answer is on the
  room's own numbers: you cannot discount a seat you do not have.
- **The taxed base coexists with an untaxed stream.** The pot is skimmed from
  gate + local media; what fans spend inside the building is never taxed, and
  the national check is never taxed. Harness P3 re-derives the argmax with the
  in-arena term deleted and asserts the price movement **vanishes**.

**The four named Stage-0 fixes (BC-6), all in.** The CONDITION is a real adopted
decision with teeth (under it, a club reinvesting below 15% collects half its
share and the forfeit is redistributed to the compliant clubs — it changes the
cash-best reinvest at six measured (profile × share) points, against Stage-0's
0 of 14); the voter's own club, market size, bill, Draw and cash are on the
proposal screen before round 1; every settled week carries a **paid in / took
out / net** column on the desk's own device, first in the document; and the
proposal histogram is **withheld until round 1 has closed**, anonymous and
unsorted thereafter.

**L2 → L3 seeding: yes, opaquely, and the grounds are recorded.** D9 persists
state where yesterday's choice creates today's problem, and here it literally
does — the inequality the room argues about is the room's own L2 inequality, and
the signature CONSEQUENCE panel is the room's mean reinvest in L2 beside its
mean in L3 (the C7 evidence that a rule changed the same students' behaviour).
Without the seed that panel has no left-hand bar. Each club's Draw, cash and
mean reinvest cross; nothing else does. An absent, malformed, foreign or
partially-corrupt seed is not an error: the league opens on a stock spread,
every panel that would otherwise assert something about Lesson 2 says plainly
that this room has no Lesson 2 numbers, and the lesson plays identically.
`/teach` offers the link when the lesson is L3, listing completed
`m2l2-host-league` sessions.

**The module finale — "ECONOMICS YOU LEARNED".** Seven computed cards, each
carrying five rails: REMEMBER WHEN (a moment out of this class's own data), OUR
CLASS (a pattern computed from state and claim-atomed), IN SPORTS (the dated
real example), ECONOMISTS CALL THIS (the formal term), OUTSIDE SPORTS (the
generalization). It is paged one card at a time on the projector and rendered in
full on every student device, so pairs can revisit it while the teacher talks.

**Claim binding.** The L2 pattern is carried as a pattern, not an import: every
rendered claim string on every surface — board, teacher director, projector
mirror, per-desk transfer line, finale card — is built by a builder that takes
the computed value and renders it, and emits the relations it asserts (sign,
quantifier, bound, absent phrase) as machine-checkable atoms. `moduleClaims()`
sweeps 438 atoms across 109 surfaces in four rooms.

**Tuning harness.** `node docs/gauntlet/module-2/stage0/l3-tuning-harness.mjs`
(from the repo root, after `npm run build --prefix runtime`). Ten properties,
honest exit code, no warn tier: BC-1's three limbs; no-dominant-proposal
(measured at league equilibrium, replaying the whole season at every share on
the dial); adoption mechanics; the differential-response scale and the
condition's bite; no unwinnable seat over 780 reachable cases; the pot identity
on both branches of the condition; the claim audit with five mutation proofs
(SIGN / QUANTIFIER / BOUND / NOUN / LEVEL, all five caught); and determinism.
**All ten hold at the shipped constants**, run this session.

**End-to-end proof.** `node scripts/e2e-m2l3.cjs` (after `npm run build`) drives
one teacher, one projector and **twelve** Chromebook-shaped student pages
through the whole arc including the capstone and every finale card. Measured
this session: 26 board frames checked at both projector shapes, 25 frames
scanned for silent truncation, 22 board-privacy scans, 51 first-contact
assertions at 1024×600 (the rule-writing screen and all three season weeks, on
every desk), **16 frames scanned for text-vs-ink overprint**, 342
`elementFromPoint` occlusion probes, 71 dials driven by real mouse drag plus
keyboard, seven finale cards paged, zero console errors. It also proves, in the
browser: that a proposal posted after the round closes is refused by the server
and does not move the room's middle number; that a pair joining after the league
closes lands somewhere playable with the teacher told; that round 2 opens at
`0/12` on both the projector and the console; that the student device is not
byte-identical across the five reveal stages; and that both Kings term sheets
render with their real figures before a two-press capstone.
Screenshots land in `docs/gauntlet/module-2/screens-l3/`.

Three product defects were found by these instruments and fixed rather than
argued: the paid-in/took-out column sat at 503..653 in a 600px viewport behind
the pinned commit bar (the settlement is now ordered pot-first, with the six
revenue lines in a disclosure); the REVEAL frame stacked three twelve-row tables
into 967px of a 768px projector (one chart at a time now, which is the
projector's own rule); and the market-size cell printed straight through the
price cell at twelve desks. That last one produced a **new instrument** — a
silent-**overlap** guard, the sibling of the silent-truncation guard: a
`white-space: nowrap` cell in a too-narrow column neither clips nor overflows,
it simply draws on top of its neighbour, and every geometric guard in the file
passed it. The guard range-measures each row cell's ink and fails on any
overlap, at both projector shapes.

The classroom/projector gate then found the defect *that* guard could not see:
the round histogram's gold bars printed straight through the veil paragraph the
teacher is told to read twice — four columns, 10px at 1366×768 and 14px at
1920×1080, on the frame the room stares at for two of three rounds. It was
arithmetic, not chance (a 24vh container, a bar allowed 23vh, and the tick label
living inside the same column), and three shipped guards missed it: the fit
guard could not see an overflow inside a fixed-height box, the truncation guard
saw nothing truncated, and the overlap guard only inspects `.wr-board-row`
cells. Both halves are repaired: the bar now sizes as a percentage of a WELL
that is whatever the column has left after the tick, so the budget includes the
label by construction at any type size; and `assertNoInkCollision` measures
every TEXT LINE on the frame as real ink with a Range and tests it against every
painted non-ancestor element. That guard is proven able to bite in-run —
`proveInkGuardBites` re-stages the exact defect in memory, requires the scan to
fail, then restores the page and re-asserts it clean.

## Repair charter round 1 (post-verification)

A fresh-context verification round produced three rulings — gameplay
FUNCTIONAL (below the STRONG bar), economics SOUND WITH REQUIRED REPAIRS,
runtime ACCEPT WITH REQUIRED REPAIRS — and every required repair from all
three has been applied to this codebase:

- **Runtime:** a per-session teacher key now gates `/control` and the
  teacher view (closing a gap where any student holding only the join code
  could pause/skip/end the session or read every team's private build
  pre-reveal — see "Teacher authentication" below); `restore` can revive a
  session the teacher ended by mistake; rejoin-PIN attempts lock a seat out
  after 5 failures until the teacher clears it; a corrupted snapshot file is
  quarantined and the server boots fresh instead of crashing the whole
  classroom.
- **Gameplay/economics (`m1l1-draft-day`):** the player market was redesigned
  so price correlates with value but never determines it (closing a real
  "buy the priciest thing" false lesson and a shock-reroll exploit); the
  shock now permanently removes a player (poached by a rival franchise) with
  a repair stipend, so recovery is a genuine choice, never a guaranteed free
  reroll or a free upgrade; the Class Gallery reveal is now labeled with
  fictional franchise identities so a class can point at its own bar; cap-
  meter language no longer flags a fully legal max-spend build as "over the
  line"; a student stuck with zero affordable options now gets a concrete
  rescue suggestion instead of silence; the SYNTHESIS stage gained a new
  RISK BUFFER card and two rewritten cards, all grounded in this session's
  real numbers.

Full detail is in `src/modules/draftDay.ts`'s inline comments (tagged
G1-G7) and `src/server/sessionService.ts`'s (tagged R1-R4).

## Running it

```
npm install
npm run dev
```

Then open `http://localhost:4300/teach` (or the machine's LAN IP for
students/projector on other devices), `/play`, and `/board`. `npm run build`
compiles; `npm start` runs the compiled build without rebuilding; `npm test`
builds and runs the test suite. No database, no external service, no
internet access required — everything lives in one Node process on one
machine, as D12 requires.

## Architecture

Three static-file surfaces (`/teach`, `/play`, `/board` — plain HTML +
vanilla TypeScript compiled to browser-native ES modules, no UI framework)
talk to one JSON HTTP API served by a single `node:http` server (`src/server/
http.ts`). There is no client bundler: the TS compiler is configured with
`module: NodeNext`, so its output is already standard ES modules with the
explicit `.js` import extensions both Node and browsers require — one
compiler, zero extra build tooling, for both server and client code.

```
src/
  shared/       phases.ts, lessonModule.ts   — the contract (below)
  server/       crypto.ts, repository.ts, snapshotRepository.ts,
                sessionService.ts, http.ts, index.ts
  modules/      draftDay.ts                  — Module 1 Lesson 1, "Draft Day"
                tradeDeadline.ts             — Module 1 Lesson 2, "The Trade Deadline" (L1 seed + deadline)
                freeAgency.ts                — Module 1 Lesson 3, "Free Agency" (L2/L1 seed + signing window, module close)
                boxOffice.ts                 — Module 2 prototype, "The Box Office"
                lobbyDemo.ts                 — the proof-of-loop lesson
  client/       teach/, play/, board/,
                shared/ (api, poll, storage, outbox, crest)
  test/         313 tests over crypto, every reducer, the service layer
                (incl. the L1->L2 and L2/L1->L3 seeds), and snapshot persistence
scripts/        e2e-l2.cjs                   — rerunnable Playwright L2 proof (full happy-path arc)
                e2e-l2-early-advance.cjs     — focused probe: advancing out of REVEAL early
                e2e-l3.cjs                   — rerunnable Playwright L3 proof (full L1->L2->L3 arc)
                e2e-l3-early-advance.cjs     — focused probe: advancing out of PLAY early
                e2e-m2l2.cjs                 — rerunnable 12-desk M2 L2 proof (every board frame fits, both shapes)
                e2e-m2l3.cjs                 — rerunnable 12-desk M2 L3 proof (full arc incl. capstone + finale)
```

**Teacher authentication (R1).** `POST /api/sessions` issues a per-session
teacher key alongside the join code — a high-entropy opaque token, hashed
at rest exactly like a student device token, returned exactly once (in the
create-session response) and never again. Every subsequent `POST /control`
and `GET .../teacher` call must present it as `Authorization: Bearer
<teacherKey>`; a student's join code alone opens `/play` but nothing on
`/teach`. `/teach` stores the key in its own `localStorage` slot (separate
from the remembered join code) and refuses to silently reopen a remembered
session without it. There is still no login, no password, no multi-teacher
account system — this is one secret per session, sized for "the teacher's
own laptop, projected to the room," not a hosted multi-tenant deployment.

**Session store.** `SnapshotRepository` (`src/server/snapshotRepository.ts`)
is in-memory Maps as the source of truth, with every mutation queued onto a
single write-chain that serializes writes to a JSON file: write to a temp
file, then `fs.rename` over the real path — atomic on the same filesystem, so
a crash mid-write leaves the old snapshot or the new one, never a corrupt
half-write. On boot, the file is loaded back into memory if present. This
was tested directly: 10 sequential session creates followed by a read-back
parse, and a full "kill the process, start a new `SnapshotRepository`
pointed at the same file" simulation that confirms phase, version, and seat
data all survive.

**Transport: short-interval polling with ETag/If-None-Match, not SSE or
WebSockets.** All three surfaces poll a versioned state endpoint (1–1.5s for
`/teach` and `/play`, 1s for `/board`) with `If-None-Match`; an unchanged
session answers `304` with an empty body. This was chosen deliberately over
a push transport:

- A real classroom AP is exactly the environment most likely to silently
  kill a long-lived connection — idle timeouts, captive-portal-style
  proxying, a laptop that sleeps and wakes on a different channel. SSE and
  WebSockets need reconnect logic to recover from that; polling's failure
  mode is *already* "try again next tick," with no separate reconnect path
  to write, test, or get wrong live in a classroom.
- At ~35 clients polling every 1–2s, that is roughly 20–35 requests/second
  against one Node process serving small JSON payloads (a `304` has no
  body) — trivial load, so the "keep a persistent connection open"
  argument for SSE/WS buys nothing at this scale.
- `/board`'s "auto-reconnect" requirement and `/play`'s "instant resume"
  requirement both fall out of the same mechanism for free: there is
  nothing to "reconnect," a poll either succeeds or it doesn't, and the next
  one fires on schedule regardless (`src/client/shared/poll.ts`).

The one place this deliberately does *not* use polling is action
submission — `POST .../actions` and `POST .../control` are sent immediately
on interaction, not queued for the next poll tick.

## Adapted from bow-finlit — what and why (D10: nothing here is proven by
donor pedigree; each choice is justified on its own)

| Donor module | Verdict | What happened |
|---|---|---|
| `api/_lib/crypto.ts` | **Ported, trimmed.** | scrypt PIN hashing, SHA-256 token hashing, and the readable-join-code generator carried over close to verbatim (`src/server/crypto.ts`) — pure `node:crypto`, zero finlit coupling in the original. The founder-session HMAC cookie signer was **dropped**: this product is one teacher on one laptop running the server for their own class; there is no second party to authenticate, so a signed session cookie protects nothing. If a hosted multi-teacher deployment appears later, the donor's pattern is what to bring back. |
| `api/_lib/repository.ts` | **Adapted.** | The interface shape — typed rows, a patch type, a version-conflict-as-value update result — ports directly (`src/server/repository.ts`); that shape is what lets `sessionService` be unit-tested with no server running. The concrete backend does not port: the donor pairs this interface with Supabase, which D12 rules out entirely (no external DB, no cloud). The one implementation shipped, `SnapshotRepository`, is new. |
| `shared/classroom.ts` phase gate | **Adapted, not ported.** | The donor's gate is a fixed 35-item `StepId` union with a hand-authored per-phase ceiling map — exactly the shape the LessonModule contract cannot use, since lessons declare their phase list at *registration* time, not compile time. What carried over is the algorithm's spirit: one phase position, an action must match the session's current phase (no queued future actions, no stale replays), a hard stop while paused/frozen/ended. See `SessionService.assertActionable` and `.control()` in `src/server/sessionService.ts`. |
| `app/src/net/save-coordinator.ts` | **Adapted in concept, reimplemented much smaller.** | The donor reconciles repeated saves of *one continuous state blob* with a revision/rebase model, because a queued write can go stale mid-flight and must be re-derived rather than replayed. Track 101 student actions are discrete one-shot commands (tap a color), not continuous edits — there is no "newer local edit" to rebase a stale one onto, so that machinery has nothing to attach to. `src/client/shared/outbox.ts` keeps the parts that do generalize: durable-first (write before send), one in flight at a time, drop a definitive rejection instead of looping forever, retry a network failure on a timer and on `online`. Full reasoning is in that file's header comment. |
| `api/_lib/service.ts` teacher controls | **Adapted.** | Auth-gated phase PATCH / pause / reveal generalizes to `SessionService.control()`'s advance/reveal/pause/freeze/hook/end/restore. The donor's one finlit-specific side effect (auto-logging a named event on two hardcoded phases) is dropped — nothing here needs an event log yet. |
| `shared/classroom.ts` `StepId`/`GATE_COPY`, `config/`, `run-state.ts` scoring | **Dropped entirely.** | This is bow-finlit's actual lesson content and copy — not reusable for a different subject by design, and out of scope for a runtime that is supposed to be content-agnostic. |
| A dedicated projector/display surface | **New, not in either candidate.** | Neither `101-pre-course` nor `bow-finlit` has one (RUNTIME_CHECK.md). `/board` (shell in `src/client/board/`, data in `SessionService.boardView`) is built from scratch against the LessonModule contract, with distinct REVEAL and SYNTHESIS presentation modes. |

## The LessonModule contract (for the gameplay team)

A lesson is one object implementing `LessonModule<TState>`
(`src/shared/lessonModule.ts`), registered once via
`service.registerModule(myModule)` in `src/server/index.ts`. The runtime
never inspects `TState` — it stores whatever the module returns and calls
the module's own view functions to render each surface.

```ts
interface LessonModule<TState> {
  id: string;
  title: string;
  phases: readonly CanonicalPhase[];       // an ordered subset of the vocabulary below
  initialState(input): TState;             // input.seed is an opaque {lessonModuleId, state} from another
                                            // session (see "L1->L2 carry-forward" above), or undefined
  reduce(state, action, ctx): { ok: true; state: TState } | { ok: false; reason: string };
  allowedActions(phase): readonly string[]; // docs/UI hint only — reduce() is the real gate
  studentView(state, seatId, phase): unknown;
  teacherView(state, phase): unknown;
  boardView(state, phase): unknown;
  aggregate(state, phase): unknown;
}
```

**Canonical phase vocabulary** (`src/shared/phases.ts`):
`LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ADAPT → COUNTERFACTUAL → ARGUE
→ SYNTHESIS → COMPLETE`. A lesson's `phases` must be a strictly increasing
subsequence of this order (`isOrderedSubsequence`, enforced at
`registerModule` time) — a lesson can skip phases (`lobby-demo` uses
`LOBBY, PLAY, REVEAL, SYNTHESIS, COMPLETE`) but cannot reorder them.

**What the runtime guarantees, so a module doesn't have to:**
- An action is only ever handed to `reduce()` while the session is not
  ended, not frozen, not paused (`assertActionable`); a module's own
  `reduce` is responsible for checking the action is valid for `ctx.phase`.
- Every state mutation is applied via optimistic concurrency
  (`Repository.updateSession`'s `expectedVersion`), so two near-simultaneous
  writes can't silently clobber each other.
- The teacher's **advance** control walks `phases` in order; **reveal**
  jumps straight to a `REVEAL` phase if the module declares one; **pause**
  is a resumable hold; **freeze** is a harder stop (implies pause) meant as
  the moment before **one-click recovery** — and **unfreeze clears both
  flags**, because freeze is one gesture and its inverse has to be one gesture
  (`gate-l1-projector`: unfreeze used to clear only `frozen`, leaving the
  projector reading PAUSED with no control anywhere still saying "Unfreeze").
  A deliberate pause that a freeze was layered on top of is NOT restored; **hook** forwards to `reduce()`
  as a synthetic `{ type: "teacher:<hookName>" }` action — a module that
  wants a shock-event or rerun-counterfactual button handles that type
  itself and rejects anything it doesn't recognize (see `lobbyDemo.ts`'s
  comment for why it deliberately implements none).
- **Restore last good state**: before every `advance`/`reveal`/`freeze`/
  `hook`, the runtime snapshots `(phase, state, paused, frozen)` as a
  checkpoint; `control({type:"restore"})` reverts to it atomically. One level
  of undo, not a full history — deliberately simple.
- `boardView` must never return anything seat-identifying; this is
  structurally true today because `boardView(state, phase)` is never handed
  a `seatId` at all.

## Tests

```
npm test
```

**458 tests, 458 passing** (`node --test`, no test framework dependency), run
this session (wave 4, `build-l3-rule`). Forty-one of those are M2 L3's
(`writeTheRule.test.ts`): the runtime contract and the manual-fallback
discipline on every phase exit, the untrusted L2 seed (absent, foreign,
malformed and partially-corrupt all degrade to a playable stock league), the
two-thirds test and its status-quo branch, the pot identity on both branches of
the condition, BC-1's two teaching objects, projector privacy at every phase,
and the claim sweep. Three of them failed on first run and found three real
defects — an unlocked live desk was being credited with the league office's
best-response reinvest instead of settling at nothing reinvested as every
surface promised; the subsidy card shipped an atom its own sentence never
rendered; and a half-step median's rounding was undocumented. Four of those tests are newer still and
belong to the econ N17/N18 level repair: econ B11 (the level instrument
reproduces the room's settled cash to the dollar), econ B11/FL-L (no surface
tells a room to put MORE back in where a one-step increase lowers room cash, on
every claim-carrying surface), econ B12 (the printed sweet-spot range and its
five-way relation are what the room's own cash-by-share curve says), and econ
FL-M (the composition card carries no unbound superlative and counts the desks
the national check actually leads). Both instruments were proven non-vacuous
this session by a source-level mutation of `roomOptimumFor`'s relation branch:
tests 259/260 failed and harness P11 reported 228 LEVEL disagreements. Six
earlier tests belong to the
claim-audit work: `CLAIM AUDIT` (every rendered board/synthesis/ADAPT claim
string recomputed against the reducer in sign, quantifier and bound), econ B7
(no printed share above 100%, none at 0% beside measured spillover), econ B8
(the room-total sentence never disagrees in sign with the joint effect),
projector R-1 / play N-3 (the Handed-To-You bar clause is true about the room at
every release point, and the DOWN branch never contradicts it), play N-4 (a desk
that gave nothing is told what it chose), and play N-5 (the post-hoc price
counterfactual reproduces the week it re-prices and never claims a better price
keeps less). Two pre-existing tests were rewritten to assert the repaired
behaviour rather than the falsified behaviour they were pinning. The rest are
354 for Module 1, the shared runtime and Module 2 Lesson 1,
unchanged, plus 34 new `hostTheLeague.test.ts` tests for Module 2 Lesson 2:
the interdependence identity (decomposition residual 0 with no negative block
over a 15k-state sweep), C5's instantiation test (delete the visitor term and
every home week returns a different number), hidden-constant and cross-desk
cash leak assertions across every phase and surface, the board carrying no
seat identity and no desk's cash at all, schedule properties (every club hosts
one and visits one, no self-hosting, no repeated pairing, most live desks host
live desks), bot and replay determinism, the exogenous star departure,
teacher-fallback behaviour, the paged bar's wrap-around, and late-seat
handling. Module 2 Lesson 1's `fullHouse.test.ts` block is unchanged.
Coverage: PIN/token crypto round-trips (`crypto.test.ts`); the `lobby-demo`
reducer/aggregate/views including rejected malformed and out-of-phase
actions (`lobbyDemo.test.ts`); the `m1l1-draft-day` reducer, market design
properties (no dominant opening roster, verified by brute force; neutral
candidate ordering; no-identical-restore after a shock), franchise
assignment, and synthesis-card content (`draftDay.test.ts`); the
`m1l2-trade-deadline` reducer — seed extraction/normalization, claiming, all
three deadline paths, staged reveal (deterministic tiebreak, reserve
prevents a lowball from winning), the aftermath rescue guarantee (brute-forced
≥2 affordable options across every exactly-$100M L1 build), cap-inviolability
property tests across every path, view-leak tests confirming no seat's
bid/reserve ever reaches another seat or the board, and the L3 seam copy
(`tradeDeadline.test.ts`); the `m1l3-free-agency` reducer — seed extraction
from a real L2 state (every deadline path incl. a won TARGET's mapped form
and a lost-bid-unrescued open slot), from L1 fallback, and from a malformed/
hostile seed; offer/withdraw/hold validation incl. the R2 repair (withdraw
locks the day, editing a standing offer never does, the next day is
unaffected, a withdrawn offer is frozen for the finale but never appears in
that day's own history); day resolution incl. exact tiebreaks, a bidding
war, a price collapse, a single lowball, an offer that clears ask signing
at the OFFER amount not the ask, day-4 desperation, and an agent with zero
day-4 offers going unsigned for good; both `onPhaseExit` paths (leaving
PLAY auto-closes only the open day, leaving REVEAL auto-completes every
remaining stage) with idempotency checks; view-privacy tests confirming
sealed offers and unsigned-agent amounts never leak to another seat or the
board before the finale discloses them; GM Award computation incl. the M1
repair (THE WALK-AWAY correctly picks an engaged-then-walked star shrinker
over a milder value agent, falls through when the shrinker was never
engaged, credits a withdrawn engagement, and omits gracefully) and the M2
repair (IRON BOOKS fires for a genuine whole-class zero-signing hold);
counterfactual/synthesis computation; and the two charter-required property
tests — cap inviolability (an adversarial multi-day sequence, exhaustive
over-cap rejection across every agent/slot, and exact dead-cap arithmetic)
and day-1 viability (≥2 affordable agents for the at-cap-standPat,
high-dead-cap, lost-bid-unrescued, and pure-stock extremes, plus a 60-build
sweep over real exactly-$100M L1 locks) (`freeAgency.test.ts`); the
`m2-box-office` demand-curve and path-dependence reducer
(`boxOffice.test.ts`); atomic writes, restart-survival, and
corrupted-snapshot quarantine (`snapshotRepository.test.ts`, including an
optimistic-concurrency-conflict case); and the full service layer — session
create (now asserting a teacher key is issued), the **L1→L2 seed** (linked
creation through a session actually played via the API, an ended source
session, a missing/wrong-module source, malformed/never-locked L1 state),
join, **duplicate-join** (same name twice is rejected, not silently
duplicated), device-token **resume**, rejoin-PIN token rotation and
**lockout after 5 failures** with teacher-only unlock, the **phase gate**
(LOBBY blocks an action PLAY allows; paused/frozen/ended each reject with
the right status), **action validation** (malformed payloads and retired
tokens rejected before or by the reducer), **teacher-key enforcement** on
every control/teacher-view call, and every teacher control including
checkpoint **restore — including reviving a session the teacher ended by
mistake** (`sessionService.test.ts`).

`npm run build` and `npm test` are both green as of this writing.

## Dependencies

Zero runtime npm dependencies. Dev-only: `typescript`, `@types/node`. This
was a deliberate choice for cold-start speed on a teacher's laptop and to
avoid an entire class of "does this still work on this Chromebook/Node
version" risk — the HTTP layer is a small manual router
(`src/server/http.ts`) over `node:http`, justified there as reasonable
specifically because the route table is small and fixed (a dozen API routes,
three static pages), not a general-purpose framework being reinvented.

## Known gaps / not yet done

- **Module 1 Lesson 3 e2e flake (pre-existing client race).** `e2e-l3.cjs` fails
  intermittently (~1 in 3 at some heads) at day-3 `submitOffer`: `faPlayMounted`'s
  poll-driven remount can wipe `#faComposerRoot` while a click is pending. Reproduced
  at a pre-Module-2 checkpoint, so it predates M2 — but the rate difference between
  heads is unresolved at n=6, and M2's lessons ship inside the same shared
  `client/play/main.ts`. Bounded fix path in `docs/gauntlet/module-2/E2E_L3_FLAKE_NOTE.md`.

- No client-side module registry — `/play`, `/teach`, and `/board`'s
  renderers special-case each module's view shape by its `module` tag
  (`lobby-demo`, `m1l1-draft-day`, `m2-box-office`, `m1l2-trade-deadline`,
  `m1l3-free-agency`, `m2l1-full-house`, `m2l2-host-league`,
  `m2l3-write-rule`, with a generic
  JSON-dump fallback for anything else).
  Adding another real lesson module means writing its render functions too;
  the *server* contract is fully generic today, the client shell is not yet.
- `GET /api/sessions` (the session list) is still unauthenticated — it
  returns code/title/phase for every session ever created on the box, not
  seat- or team-identifying data. Lower severity than the R1 gap it was
  found alongside (that one is closed); worth gating in a future round if
  this ever runs somewhere less trusted than one teacher's own laptop.
- `SnapshotRepository` keeps every session/seat ever created in memory for
  the process lifetime — there is no archive/prune path. Not a problem at
  classroom scale (one class, a handful of sessions per day), worth
  revisiting for a long-running deployment.
- **Module 2 Lesson 1 (`m2l1-full-house`) known gaps.** (a) Arena
  capacities and the "2025 defending champions" line come from model
  knowledge, not from the dated sports-reality ledger in
  `docs/gauntlet/module-2/SPORTS_REALITY_INPUT.md` — they carry season
  stamps in copy but have **not** been independently re-verified by a
  sports-reality pass. (b) The lesson has never been timed against a real
  50-60 minute period; the five-night pace is a teacher judgement with no
  in-product clock. (c) `boxOffice` (`m2-box-office`) has been deregistered
  from the lesson picker (superseded per D20); `boxOffice.ts` and its tests
  remain in the tree as history. (d) The night-spend dial's returns are linear in
  dollars, so the interesting decision is *when* to spend, not how much;
  the harness asserts the timing spread but the dial has no interior
  optimum. (e) The Night-4 capacity option never beats simply pricing the
  shock night correctly — it is a hedge for a desk that priced low, and the
  debrief must say so rather than present it as a rival strategy.
- **Module 2 Lesson 3 (`m2l3-write-rule`) known gaps.** (a) **The design's
  intellectual summit does not hold at the shipped constants and is not
  claimed anywhere in the product.** DESIGN_C hoped the room's own arithmetic
  would show an interior best share above zero for *every* market including the
  biggest — "sharing is not charity; it pays the payer, through the product."
  Measured at league equilibrium (harness P4, replaying the whole season at
  every share on the dial): the small markets' own best share is 55–60%, the
  big markets' is 0%. The cause is structural rather than a tuning miss and it
  collides with BC-1b: a capacity-bound building is barely exposed to a weak
  visiting club, so what a big market loses when the league decays is a
  sustainable price, not a full house — worth far less than what it pays in.
  Forcing the summit would require a model in which a marquee visitor doubles
  Madison Square Garden's crowd, which is false of a building that sells out.
  BC-1b is binding and the summit is design prose, so BC-1b was kept. The
  module never asserts the summit on any surface; the SIMPLIFICATIONS ledger
  carries the whole finding, and the counter-argument on the board is the real
  one (the payers accept it in a collectively bargained agreement, and in the
  leaked year the Lakers still cleared about $115M after paying in). This needs
  an economics ruling, not a builder's.
  (b) The veil of ignorance is weaker for a big market than the design assumed:
  the rookie lands on the club with the least money in the bank after week 1,
  which in a stock league is never a big market. It is genuinely unknowable at
  vote time (cash is never ranked on any surface) and exactly nameable
  afterwards, and the module says out loud that this is **not** how the real
  league does it — but a big market cannot realistically be insuring itself.
  (c) The lesson has not been played by a human. Five independent gates (play,
  economics, sports reality, teacher transfer, classroom/projector) have now
  run on it and their blocking findings were repaired in wave 4 — see
  `docs/gauntlet/module-2/GATE_L3_*.md` and the repair notes below. Nothing here
  is classroom-proven (D10).
  (d) The board's ROUNDS frame now carries the histogram with the ±10 band drawn
  on it and a live in-band gauge ("right now N of M would pass; K are needed"),
  which is what rounds 2 and 3 were missing. Round 1 is still deliberately thin
  and that thinness is earned.
  (e) **Repaired in wave 4, carried here so the next reader knows what changed.**
  The vote is SEALED at the close of round 3 (a post-close proposal is refused by
  the reducer and the adopted rule reads the recorded round, not a live control);
  a desk with no number in ABSTAINS rather than being recorded at a 5% nobody
  proposed, with no relief on the two-thirds denominator; `closeRound` clears the
  live proposal so rounds 2 and 3 count honestly; a late joiner is handed a
  league-office club or landed as an announced observer, never a silent 409; the
  condition can no longer destroy half the pot when nobody complies; the L2→L3
  before/after bar is drawn in DOLLARS A WEEK because the two lessons' dials are
  percentages of different bases; REVEAL stage 4 branches on whether anything
  actually moved and always prints WHY; the Kings capstone renders both term
  sheets and lands in two presses (the room's own tally, then the owners' 22-8);
  and the finale no longer teaches a supermajority relocation rule the NBA does
  not have.
  (f) **Still open, not repaired this wave.** No elapsed clock on `/teach` against
  the minute-keyed TIME CUT lines; the reveal half is still budgeted at ~28
  minutes against a 7–15 minute debrief standard (the desk now has a per-stage
  lens and one prediction, but CONSEQUENCE and REVEAL stage 5 remain closely
  related frames); finale cards 6 and 7 still cover neighbouring Seattle /
  Milwaukee arena material; the round histogram is not split by market size; and
  no non-16:9 projector shape has been measured.
- **Module 2 Lesson 2 (`m2l2-host-league`) known gaps.** (a) Real content is
  *dated* in `SOURCE_NOTES` but has **not** been re-verified by an independent
  sports-reality pass this wave; arena capacities and the club→market-size
  groupings come from model knowledge against `SPORTS_REALITY_INPUT.md`'s four
  verified markets. (b) Only four market profiles exist, so two real clubs of
  the same market size share one demand curve — a deliberate honesty trade
  (inventing twenty club-specific constants under real names is the failure the
  architecture review flagged in a rival design), ledgered in
  `SIMPLIFICATIONS`. (c) The lesson has never been timed against a real 50-60
  minute period. (d) C3's "a decision turns on pipe composition" is instantiated
  as the intertemporal trade (fast gate money now vs slow Draw money later), not
  as a solvency squeeze: the equal national check clears every club's bill from
  every reachable state, so cash pressure is never manufactured. (e) Design C's
  L2 carries six real anchors; two were cut here (SR-10 entirely, SR-12 reduced
  to one line) per the SR review's own watch item, and the M1 cap bridge lives
  on the last synthesis card rather than as its own beat. (f) The national check
  is the tallest single pipe for almost every desk but not for all of them — a
  desk that prices high into marquee visitors, or a big market that reinvests
  hard, can out-earn it; the board prints each desk's real percentages and the
  director tells the teacher to ask that desk what it did. (g) **After the
  five-gate repair round:** the gave/got board now carries two instruments — the
  DEALT totals (mostly Draw a desk was handed) and the BY-CHOICE figures
  recomputed against a never-reinvested counterfactual — and every question
  about a decision reads the second. The by-choice figures are a *ceteris
  paribus* partial derivative (one desk's spending varied, every other input
  held at what actually happened); they are not a general-equilibrium answer and
  no surface claims they are. (h) Still open from `gate-l2-econ`, out of this
  repair's scope and unfixed: `SIMPLIFICATIONS[5]`'s "at any legal price, from
  any state" is false in the strong form (reachable weekly nets of −$12,000 to
  −$60,000 at $120), `SIMPLIFICATIONS[7]`'s "within 3x" is only true under the
  harness's per-offset band definition, the weekly bill never binds anywhere in
  the reachable space, the three-block attribution is exact but *order-dependent*
  and undisclosed, and `visitorDrawFans ≈ 1.33 × ownDrawFans` — the constant that
  produces the lesson's headline — is not in the ledger. (i) Still open from
  `gate-l2-sr`: MODERATE-5 (the 2026 Knicks title is not absorbed into the
  money-does-not-buy-wins counter), MINOR-6/7/8, and the `capacityNote` restamp
  to 2026-27. (j) Still open from `gate-l2-play`: R5 (a played schedule row
  retro-updates to the visitor's *current* Draw), R6 (the $120 dead zone), R7
  (the local-media driver is unnamed on the settlement row), R9 (the ADAPT "Net"
  figure vs the cash column). (k) Still open from `gate-l2-teacher`: N3 (no
  elapsed clock against absolute-minute TIME CUT triggers), N4 (Pause vs Freeze
  are undistinguished on the surface). (l) Still open from `gate-l2-projector`:
  P-3 (freeze blanks the projector — the /teach mirror now tells the truth about
  it, but the board still shows one word), P-4, P-5, P-6, P-8, P-9. (m) **After
  the wave-4 claim-audit round:** every claim-carrying string in this lesson is
  now built by a builder that interpolates `ClaimAtom.rendered` (rendered *from*
  the computed value) and emits the relations it asserts; `moduleClaims(state)`
  sweeps them and the harness's P11 recomputes each one. A claim-carrying
  surface added without registering it in `moduleClaims` is invisible to the
  audit — that is the one way to reintroduce the defect class, and it is not
  detected automatically. (n) The room-total sentence now publishes the JOINT
  effect (`choiceTotals.roomJointGain`) beside the sum of per-desk partials.
  Two independent computations of that joint figure — the module's re-settled
  arithmetic and the harness's all-zero replay through the reducer — agree in
  sign in every swept room but differ by up to **$6,944** in magnitude, because
  the replay lets league-office clubs re-derive their reinvest *dollars* from a
  poorer door while the arithmetic version holds bots at their actual spend per
  the module's declared carve-out. The printed figure is the carve-out-matched
  one; the discrepancy is a scope difference, not an error, and is not disclosed
  on any student-facing surface. (n2) **The LEVEL sentence (econ N17/N18,
  wave-4 repair 2).** The SPILLOVER card's prescription is no longer a direction
  word branched off `sign(roomJointGain)`; it prints the room's own computed
  sweet-spot RANGE, from `roomOptimum`, which re-runs the identical season at
  every setting on the dial through `roomCashAtShares`. That instrument
  reproduces the room's settled cash exactly at the room's own dials and agreed
  with a full reducer replay to **$0** on ±5pp shifts and on uniform worlds over
  120 probed rooms. A direction word prints only where the room's level is
  outside its own band AND a one-step move that way measurably pays; the two
  `underButFlat` / `overButFlat` arms are where those disagree and they
  prescribe nothing. Known limits: the band edge depends on
  `OPTIMUM_BAND_TOLERANCE` (5% of the curve's spread), which is a rendering
  choice and not derived from anything; the band is a UNIFORM-share comparative
  static while a real room's dials are heterogeneous, which is exactly what the
  `Flat` arms exist to disclose; and `underButFlat` has not been observed in any
  sweep run so far, so that arm's copy is untested against real output. (o) The
  post-hoc price counterfactual (play
  N-5) re-prices **one settled week only**. A different price would have bought
  a different reinvest dollar and therefore a different Draw the following week;
  the card says so in words but does not model it, and no surface shows what a
  different price would have done to the *season*. (p) The free-rider's block
  (play N-4) is now honestly *presented* — "chose to give nothing", with what
  the room's spending put in its building — but it still shows three zeroes.
  The play critic's N-4 also floated a non-degenerate counterfactual (e.g. the
  same schedule at 20% back in); that was out of this bundle's scope and is not
  built.
- **Module 2 Lesson 1 — the COUNTERFACTUAL pager label (`gate-l1-projector`
  W3F-1), NOT VERIFIED, flagged for the owning critic.** `analyst-wave3` refuted
  the closure of `proj-l1-cf-pager-label` on provenance: the dissent was
  resolved by the lead integrator on an e2e exit code, and `GATE_L1_PROJECTOR.md`
  still ends at W3 FINAL with W3F-1 recorded as BLOCKING; no owning-critic
  adjudication line exists. This wave deliberately did **not** touch the label.
  The intent question the critic has to rule on: the shipped repair replaced the
  false positional range ("DESKS 1-3 OF 12" over rows headed Desk 2, Desk 3, Desk
  4) with named desks, but `cfPageDeskNames` (`fullHouse.ts:709-713`) renders
  `deskHandle.split(" · ")[0]`, which **drops the franchise name** — the pager
  reads "Group 1 of 4 — Desk 2, Desk 3, Desk 4" while the rows underneath are
  headed "Desk 2 · Memphis". The false identity claim is gone and desk numbers
  are unique, so nothing on the projector is untrue; what is unverified is
  whether a teacher reading the pager aloud against club-headed rows satisfies
  W3F-1's intent, or whether the finding wanted the handle carried whole. Same
  drop in the three `/teach` labels (`fullHouse.ts:2373-2380`). This is the
  projector critic's call, not the builder's.
- The teacher-key/rejoin-lockout mechanisms are new as of this round and
  have only been exercised by unit tests and one manual Playwright pass
  (which exercises the *happy* teacher-key path via normal UI clicks, not
  the lockout/unlock UI) — worth deliberately exercising the "PIN LOCKED /
  Unlock" flow and a lost-teacher-key recovery scenario in the next
  fresh-context verification round.
