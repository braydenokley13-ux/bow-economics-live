# GATE L2 PLAY — Module 2 Lesson 2, "You Don't Play Alone" (m2l2-host-league)

Independent Player / Gameplay gate. Run `m2-quality-war`, assignment `gate-l2-play`.
Played blind in a real browser (Chromium 1194, `/opt/pw-browsers`) against the built
runtime on PORT 4371 before any `?debug` or harness inspection.

Evidence produced by this gate: `gate-l2-play` (this file + `screens-l2-gate/`).
Evidence read as build claims, not as verdicts: `l2-e2e` (via
`runtime/scripts/e2e-m2l2.cjs`), `l2-tuning`, `l2-tests`. Other L2 gate verdicts were
not read — fresh context.

**Sessions actually played**

| id | desks | league | strategies per desk |
| --- | --- | --- | --- |
| A | 4 | 6 clubs | D1 schedule-reading adaptive (me) · D2 always-max reinvest (40%) · D3 always-zero free-ride · D4 chaotic ($118 → $10 → never locked / AUTO) |
| B | 10 | 12 clubs | D1 floor price $10 · D2 ceiling price $120 · D3 house-price free-ride · D4 house + 40% every week · D5 adaptive (shock-adjacent) · D6 copy-the-leader · D7 chaotic · D8 adaptive mixed-timing · D9 never locks (AUTO ×3) · D10 house + rising reinvest |
| C | 4 | 6 clubs | measurement pass — 1024×600 fold geometry on the pairs-on-one-device default |

---

## what-the-student-plays

A pair runs one real NBA club's building for three "weeks." Each week they turn **two
dials and press one button**: a seat price ($10–$120, opening at a club-specific house
price) and a REINVEST share (0–40% in 5-point steps) that buys DRAW next week. Then
`LOCK IT IN` and wait for the teacher's bell.

The thing that makes it a game rather than a pricing worksheet is the **schedule strip**:
before pricing, the desk can see all three of its weeks — who HOSTS at their building and
whose building they VISIT — with each opponent's live Draw printed and the line "the Draw
numbers are not [fixed] — every one of them is another desk still deciding." Observed
(session A, desk 1): my three home visitors were Memphis 62, Golden State 30, Oklahoma
City 71, so I knew at minute one that week 2 would be my thin night and week 3 my fat one,
and I priced $64 / $38 / $78 for exactly that reason. **That is real anticipation and it is
the strongest thing in this build.**

After the bell, the private settlement decomposes the door into three named blocks — "Your
building at $64 · 3,270", "Your own Draw (44) · 3,536", "Memphis visiting (Draw 62) ·
7,228" — then four revenue pipes, the weekly bill, the reinvest cost, and KEPT. Below that,
a purple card: "Your club visited Boston. Your Draw put 4,726 extra people in their
building and $349,724 on THEIR books. You do not get any of it."

Class-facing: a projector schedule while the week is open (nothing about crowds), a
teacher-released **Handed-To-You bar** (every desk's night as a stacked bar, each bar
footed with the visiting clubs that filled it and the dollars they brought), a five-beat
REVEAL ladder, ADAPT, ARGUE, five synthesis cards.

Decision density: **six dial-moves per pair across the whole lesson**, one of which the app
itself retires (see biggest-failure #4). No student-to-student messaging; the only channel
between desks is Draw, which is exactly the right channel.

---

## pull-rating

**RATING: FUNCTIONAL**

This is above the stage-0 loop — the schedule creates anticipation, the decomposition is
genuinely readable, and another desk's choices move my numbers in a way I can name. It is
not yet STRONG, and the wave contract requires STRONG. Three defects sit directly on
student-pull and BC-5, and the largest is not a polish item: **the payoff beat does not
appear on the student's screen when it fires.**

Sub-judgements, all from play:

- **Decision density across three weeks** — thin but adequate for 50 minutes *until week
  3*, where the app tells the desk in writing that reinvest now buys nothing this lesson,
  collapsing the final third to one dial.
- **Anticipation between weeks — do you care who visits you next?** YES, observed. I
  re-read the schedule strip before every lock in both sessions, and watched opponents'
  Draw move between weeks (Golden State 30 → 26 → 22 as desk 3 free-rode; Memphis 62 → 68 →
  73 as desk 2 reinvested). This is the build's best mechanic.
- **Replay pull** — weak. Outcome is dominated by which club you were dealt (bill size,
  seat count, schedule luck), there is no counterfactual anywhere ("at $56 you would
  have…"), and no week can be a loss. "What if we'd done something different?" — one of the
  four target sentences in CLAUDE.md §1 — has no fuel in this build.

### BC-5 attribution test, run on myself, written before opening anything

| week | my prediction, before looking | what the UI said | verdict |
| --- | --- | --- | --- |
| A/W1 | "$64 is above house; Memphis's Draw 62 is high, so the visitor fills most of it; big crowd" | building 3,270 · own Draw 3,536 · **Memphis 7,228 ($592,696)**; 14,034 came, 70.8% | **correct, from the private device alone** |
| A/W2 | "Golden State collapsed to 26, so my crowd should fall; my $38 cut should partly cover it" | building **7,560** (price cut) · own Draw 4,368 · **Golden State 2,224**; 14,152 came — same crowd, inverted composition, KEPT down $230k | **correct, and the composition flip is a real "our decision caused that" moment** |
| A/W3 | "OKC at Draw 65 fills it; I can charge $78" | 13,597 came, KEPT $1,701,312 — best week of the class | correct |

**BC-5: PASS on the private surface and on the Handed-To-You bar** (every bar is footed
with the named visiting clubs and their dollars, at both 4 and 10 desks — observed
`screens-l2-gate/A-04-handedto-g1.png`, `B-02-handedto-g1.png`, `B-03-handedto-g2.png`).
**BC-5: FAILS in placement**, not in content — see below. Two carve-outs: (a) at the $120
end of the dial all three blocks read `0 · $0` and the bar is blank, so a desk that priced
high has literally nothing to attribute (observed B/D2 week 1); (b) "Local media and
sponsors" moves week to week ($878,000 → $974,000 for one desk; $882,000 for a desk that
drew 423 people) with no driver stated anywhere in the UI. BC-5 as written asks about the
*gate*, so this is not a contract breach, but a pair that asks "why did that number move?"
gets nothing.

### Interdependence — felt, or harness-only?

**Felt, observed on the student device, not just in the aggregate.** Three legible
channels: the opponent's Draw printed on my own schedule strip and visibly changing between
weeks; the visitor block in my own settlement carrying their club name and Draw; and the
road card telling me what my Draw earned *on their books*. Session B desk 3's settlement
read "Your Draw put **0** extra people in their building and **$0** on THEIR books" —
because the desk they visited had priced at $120 and sold nothing. A student can trace that.
The 10-desk board bar and the "39% of every dollar that came through a door was brought by a
club somebody else was running" line land the room-level version.

### Free-riding — trap visible, or scripted slap?

Played it twice. **Economics, not a slap** — and appropriately un-moralised: the reveal row
is titled "WHAT YOU GAVE, WHAT YOU GOT" and the teacher script explicitly says "Do not call
this out as cheating." Observed outcomes:

- A/D3 (0% for three weeks): Draw 30 → 18, own-Draw home block decayed 1,980 → 1,584 →
  1,188 seats, finished **last in cash** ($2,554,128) — but its worst week was the week it
  hosted the shocked club, so *the desk itself would blame the schedule, not its own dial.*
- B/D3 (0% for two weeks, then 40%): Draw 30 → 38, finished **7th of 10** ($2,503,140), and
  its private ADAPT card reads "Net **+$1,338,104**" as a *taker* — i.e. the private screen
  tells the free-rider they came out ahead while the cash column says they came out behind.

So the trap is visible on the projector (the gave/got pair) but **confounded on the desk**:
the punishment for free-riding is entangled with schedule luck, and the desk's own "Net"
figure points the opposite way from its cash. A pair can free-ride for three weeks and never
be shown the cost *of the choice*, only the cost of their calendar.

### The two books — real choices both ways?

Partly. DRAW does pay you at home (the "Your own Draw" block is in your own gate), so
reinvest is not pure altruism — good. But measured ROI is poor and never stated: B/D4 paid
**$260,374** in week 1 to move Draw 71 → 75, worth ≈$3.5k per Draw point per home week at
that club's price — roughly $28k of own-cash return on a $260k spend, with the rest landing
on other desks' books by design. And nothing in the lesson ever *pays off* a high Draw:
B/D5 went 38 → 62 and finished 5th; B/D4 went 71 → 80 and finished 2nd; A/D3 fell to 18 and
finished last. The tension is a genuine decision in weeks 1–2 and an **asserted** rather
than **felt** one at the end — deliberately deferred to L3 and to next-lesson carry, but it
does mean the second of the two dials never visibly wins anything on screen.

### Honesty pass

- **Nothing is sweepable pre-commit.** Verified in both sessions: the pre-lock screen carries
  no outcome and says "No preview. Nothing on this screen tells you what this week will
  make."; the board shows the pairings and `0/N locked in` and nothing about crowds while a
  week is open. Clean.
- **No clean dominant line found.** Floor price ($10) sold out the building and finished
  **8th of 10** (B/D1, $2,328,930). Ceiling price ($120) sold *zero* tickets in week 1 and
  finished 6th (B/D2). Copy-the-leader finished 4th. Mixed timing (reinvest early, price to
  the schedule, zero in week 3 — B/D8) finished **1st** at $3,882,875, which is the line the
  design wants to reward. Good.
- **One soft line the harness does not test: doing nothing is not clearly punished.** A/D4
  never locked in week 3 and its AUTO settlement ($46 house price, 0% reinvest) produced
  **$1,466,842 — the second-best single week in that class**, beating every week I priced
  deliberately at desk 1 except one. In session B the AUTO desk finished 9th, so this is
  schedule-dependent rather than systematic — but it is reachable, and a pair that discovers
  it has discovered that the dial is optional.
- **The mid-lesson release is a projector-only beat.** Pressing "Release the Handed-To-You
  bar" changes the board; **the student devices show nothing at all** (verified: desk 1's
  DOM is unchanged across the press). It is a real teacher moment and a good one, but it is
  not a *player* moment — the pull at that instant is entirely the teacher's to generate.
- Console: zero product errors on `/play` and `/board` across all three sessions. One 404 on
  `/teach` (asset, not behaviour).
- Incidental resilience observation, unattributed: my host process died mid-week-3 in
  session B. Every desk showed "offline — retrying" / "syncing… (3 pending)", and on server
  restart from snapshot all nine queued locks flushed and state was intact. Not a product
  defect I can attribute, and the client-side queue behaved.

---

## biggest-failure

**On the pairs-on-one-device default, the consequence is below the fold. The bell rings and
the desk shows the next week's price dial.**

Measured live at 1024×600 (session C, `screens-l2-gate/C-02-after-bell-fold.png`):

```
after the week bell:  page height 1543px · viewport 600px · auto-scrolled to y=261
  visible window          261 – 861
  what is at eye level    the REINVEST instruction paragraph  (elementFromPoint(500,300))
  #hlSplit  (the three-block decomposition, the BC-5 artifact)   y = 749  — bottom edge
  KEPT / Draw change                                             y ≈ 1050 — OFF SCREEN
  #hlRoad  ("...$349,724 on THEIR books. You do not get any of it.")  y = 1103 — OFF SCREEN
```

The single most important sentence in the lesson — the externality line that the whole
synthesis is built on — sits ~500px below the fold, under the controls for a week that has
not started. The app does auto-scroll, but it lands the pair on the dial, not on the result.
A grade-5 pair that does not think to scroll experiences the bell as *nothing happening*.

The same geometry hurts first contact: at week 1 the page is 1100px in a 600px viewport and
**`LOCK IT IN` is at y=650 — below the fold** (`C-01-prelock-fold.png`), with the schedule
strip, the thing the anticipation mechanic runs on, at y≈900. The first thing the pair sees
is a rejoin-PIN card and a 90-word REINVEST paragraph that runs off the bottom of the screen
mid-sentence.

This is why the rating is FUNCTIONAL rather than STRONG. The content that satisfies BC-5
exists and is well built; it is placed where the student is not looking at the moment it
matters. `l2-e2e` cannot catch this — it asserts the elements are *in the DOM* and that the
*projector* frames fit; it never asks whether a 1024×600 desk can see the result without
scrolling.

---

## moment-by-moment-notes

Screenshots: `docs/gauntlet/module-2/screens-l2-gate/`.

**LOBBY → HOOK.** `A-01-hook-board.png`. The 2016-17 Lakers-vs-Grizzlies local-media split
(≈$149M vs under $10M, ESPN, September 2017) with its stamp on the board is a good cold
open; the board's "This room is the league" club grid scales cleanly to 12 clubs at 10 desks
(`B-01-week1-schedule.png`). One conflict a fifth-grader will hit immediately: the HOOK
defines DRAW as "how many people your club's name puts in **somebody else's** building," and
then every settlement screen contains a block called "**Your own Draw (44)**" filling *your*
building. Both statements are on screen within four minutes of each other.

**PLAY week 1.** `A-02-play-week1-desk1.png`, `C-01-prelock-fold.png`. Two dials, one
button, no preview. The schedule strip earns its place — I made a different price in each of
three weeks *because of it*. Below-fold problem as above. Minor: the reinvest `+` button
stays enabled at the 40% cap, so the last click does nothing.

**The bell / week-1 settlement.** `A-03-week1-result-desk1.png`, `C-02-after-bell-fold.png`.
The decomposition itself is the best-designed screen in the build — three named blocks that
sum exactly to the "CAME" figure, an honest ledger, and the road card. Placement is the
failure above. Second-order defect on the same screen: the played row of the schedule strip
**retro-updates to the visitor's current Draw**, so on one screen the recap header says "W1
vs Memphis · **D62**" while the strip two inches below says "Week 1 · played · HOST Memphis
· **Draw 73**." Observed in both sessions. That is precisely the number a pair is meant to
reason with.

**The star departure.** The shock lands on a **league-office** club in both sessions
(Milwaukee 38 → 12 in A, New Orleans 72 → 12 in B), so no student desk is blamed — good
call, and it is on the projector and on every desk before week 2 is priced. But the desk that
*hosts* the collapsed club eats ~$600k through no decision of its own (A/D3 week 2: 6,818
came, 37.7% full) and this is also the desk whose free-riding the reveal will later name.
The two stories collide on the same row.

**Mid-lesson Handed-To-You release.** `A-04-handedto-g1.png`. Strong projector object; the
stacked bars with per-bar visiting-club footers are the clearest artefact in the lesson, and
the pager holds 5 bars per group and names them at 10 desks. Two notes: (1) it is
board-only — nothing changes on the desks; (2) the headline says "Point at the club that
paid for your night," but on most bars the visually biggest blocks are *local media* and
*the national check*. A student who literally follows the instruction points at the wrong
block. The 39%-of-door-money statistic is about the door only; the picture is about total
revenue.

**Week 3.** The reinvest paragraph gains a sentence: "This is the LAST week. Draw you buy
now brings you no more money in this lesson." Honest, and it retires the dial. From here the
final week is one decision.

**REVEAL, five distinct beats** (`A-06`…`A-10`, `B-05`, `B-06`).
1. *Who filled your building?* — the bar again, now three weeks. Strong.
2. *What you gave, what you got* — gave/got/Draw per desk, with the LeBron 2010/2014
   Cleveland case attached. This is the best beat in the lesson and the one that makes
   free-riding arguable without accusing anyone.
3. *Four pipes, one club* — the $76B / 2025-26–2035-36 national deal, plus the Chase Center
   ownership aside. Correct register.
4. *Small building, big night* — **broken by uncontrolled comparison.** In session B it
   compared Oklahoma City hosting Boston at its house price ($760,554) against **New York
   hosting Golden State at the $10 price that desk had chosen** ($490,672), and concluded
   "The small market won that week, and it won it on **WHO WAS VISITING**." It did not. It
   won it on the other desk's price. The board asserts a causal claim that the decomposition
   the class just learned directly refutes, and the teacher reads it aloud. Synthesis card 4
   repeats the same sentence verbatim.
5. *What you did after you saw it* — **an unfalsifiable claim.** Session A: "Before the bar:
   20.1%… After it: 10% — down 10.1 points. Nobody told this room to move." Session B, where
   I pushed every desk to 40% in week 3: "Before the bar: 17%… After it: 36% — **up 19
   points**. Nobody told this room to move." Same framing either direction. Worse, in
   session A the drop was *caused by the app's own week-3 sentence* telling desks that
   reinvest no longer pays this lesson — the board credits the bar for a move the product
   scripted.

**ADAPT.** `A-11-adapt-desk3.png`. The private three-week roll-up (where the money came
from, gave/got/Net, average reinvest, all three settlements stacked) is excellent material
for pair talk and is the right thing to have on the desk while the board holds the
questions. Note the Net/cash contradiction described above.

**ARGUE.** `A-12-argue.png`. Luka Dončić to the Lakers, 1–2 February 2025, with the Cooper
Flagg counter-case in the same breath and an explicit "outcome is not the same thing as
decision quality." Good.

**SYNTHESIS / COMPLETE.** `A-13`, `A-14`, `A-15`. Five cards: shared product, spillover /
externality, the check nobody controls, market size is not destiny, each built from *this
room's* numbers with a named desk and a real dollar figure, plus a fixed set of
outside-sports generalisations. The close hands forward to L3 ("this room writes the rule
that decides how much of it gets shared") — that is forward pull, not replay pull.

**Standings, for the record.**
Session A (4 desks): D1 adaptive $3,768,326 · D4 chaotic+AUTO $3,443,051 · D2 max-reinvest
$3,417,468 · D3 free-ride $2,554,128.
Session B (10 desks): D8 mixed-timing $3,882,875 · D4 max-reinvest $3,769,984 · D10
$3,305,171 · D6 copy-leader $3,204,925 · D5 $2,842,765 · D2 ceiling-price $2,742,914 · D3
free-ride $2,503,140 · D1 floor-price $2,328,930 · D9 never-played $2,126,280 · D7 chaotic
$1,961,902.
No week in either session produced a negative KEPT. A building that sold **zero tickets**
still kept **$734,000** (B/D2 week 1). That is defensible league economics — gate is a fifth
of revenue and the model says so — but it means a pair cannot lose, and their KEPT number
carries no reference point telling them whether it was any good.

---

## required-repairs

### BLOCKING — must clear before this lesson can be rated STRONG

**R1 — Stage the consequence.** After the week bell, the settlement must be the first thing
on the student's screen at 1024×600 without scrolling, with the KEPT figure and the road /
"on THEIR books" card above the fold. The next week's price dial must not occupy the fold at
the moment the result lands.
*Falsifiable:* at viewport 1024×600, immediately after `closeWeek` and with no manual
scroll, the bounding boxes of `#hlSplit`, the KEPT row, and `#hlRoad` are all fully inside
`0..600`; `#hlPriceDial` is not. Assert in `e2e-m2l2.cjs` for weeks 1 and 2 at 4 and 12
desks.

**R2 — `LOCK IT IN` and the schedule strip above the fold at week 1.** The primary action
and the anticipation surface must be reachable without scrolling on first contact.
*Falsifiable:* at 1024×600 on entering PLAY week 1 (rejoin-PIN card shown *and* dismissed),
`#hlLock` bottom ≤ 600 and at least the "Week 2" row of the schedule strip is fully visible.

**R3 — Delete or condition reveal stage 5's causal claim.** "Before the bar / after it …
Nobody told this room to move" fires in both directions and, in session A, credited the bar
for a change the app's own week-3 copy caused. Either (a) drop the causal framing and show
the three weekly averages without narration, or (b) suppress the beat entirely unless the
Handed-To-You bar was released before week 3 *and* remove the week-3 "brings you no more
money" sentence that manufactures the drop.
*Falsifiable:* a scripted run where every desk holds reinvest constant across all three
weeks must not produce a "nobody told this room to move" sentence; and no run may attribute
a week-3 move to the bar while the week-3 copy tells desks reinvest no longer pays.

**R4 — Fix the "SMALL BUILDING, BIG NIGHT" comparison (reveal 4 + synthesis card 4).** The
exhibit must not attribute a revenue gap to "WHO WAS VISITING" when the two desks priced
differently. Either select the pair under a price-similarity constraint, or state both
prices in the sentence and let the room argue.
*Falsifiable:* the selected pair satisfies |price_A − price_B| ≤ $6, or the rendered sentence
contains both desks' prices. Assert against a seeded state where one desk priced $10.

### NON-BLOCKING — fix before classroom release, not gating STRONG

**R5 — Schedule-strip Draw for played weeks.** A played row must print the Draw the game was
actually played against, matching the recap header on the same screen. *Falsifiable:* after
week 1 settles, the `Week 1 · played` row's Draw equals the value in the `WEEK 1 — HOW IT
WENT VS X · DRAW n` header.

**R6 — The $120 dead zone.** A price that yields exactly zero attendance across all three
blocks leaves the desk with a blank bar and nothing to attribute, and reads as broken rather
than expensive. Put a floor under the visitor block, or shorten the dial's top end.
*Falsifiable:* at every price in $10..$120, for every club, total attendance > 0 and the
visiting-club block > 0.

**R7 — Name the local-media driver.** "Local media and sponsors" moves week to week with no
stated cause and can exceed a large-market club's figure at a club that drew 423 people.
Either label the driver in the settlement row or hold it constant within the lesson.
*Falsifiable:* the settlement row carries a one-clause driver, and a pair given two of their
own weeks can state why the number moved.

**R8 — Reconcile "Your own Draw" with the HOOK's definition of DRAW.** The board says DRAW
is people your name puts in *somebody else's* building; the settlement puts your own Draw in
your own gate. One sentence in the HOOK fixes it.
*Falsifiable:* no two surfaces in the same session state mutually exclusive definitions of
DRAW.

**R9 — Reconcile the private "Net" with the cash column.** A free-riding desk reading "Net
+$1,338,104" while sitting 7th in cash gets the opposite of the intended signal. Label what
Net is *not*.
*Falsifiable:* the ADAPT card's Net figure carries a clause distinguishing it from money the
desk keeps.

**R10 — Compress the REINVEST instruction paragraph.** ~90 words of rules sit between the
dials and the button on every single week and consume the fold. Move the mechanics to a
disclosure and leave one line at the dial.
*Falsifiable:* the always-visible reinvest copy is ≤ 25 words at every week.

**R11 — Disable the reinvest `+` at the 40% cap.** Currently the button stays enabled and
the click does nothing.

### Recorded, not required

The absence of any counterfactual ("at the house price you would have taken …") is the main
thing standing between this loop and a class asking to play it again. That is a design call
for the founder, not a defect: the build deliberately refuses previews, and a *post-hoc*
counterfactual would not violate that. Recorded as the highest-value non-blocking
opportunity for pull.

### Formal dissent

None recorded. If the run advances this lesson as STRONG without clearing R1–R4, treat this
paragraph as dissent on the ground that BC-5 is satisfied in the DOM but not in the
student's field of view, and that two projector beats state causal claims the play does not
support.

---

## RE-CHECK AFTER L2 REPAIR

Owning-critic confirm-or-refute of dissent `play-l2-below-bar`, run `m2-quality-war`,
assignment `recheck-l2-play`. Fresh sessions played in real Chromium against the built
runtime on PORT 4381 (server killed at end; no listener remains). Six desks, every desk at
the 1024×600 pairs-on-one-device default, teacher at 1280×900, board at 1600×900.
Screenshots: `screens-l2-gate/r1-*`.

Evidence produced: `recheck-l2-play` (this section + `screens-l2-gate/r1-*`).
Evidence read as build claims, not verdicts: `l2-e2e-r1` (exit 0), `l2-tests-r1` (exit 0).
Zero console errors on `/play`, `/teach`, `/board` across both sessions (observed).

**Sessions played**

| id | desks | strategies |
| --- | --- | --- |
| R-A | 6 | D1 schedule-adaptive (me, $78/$46/$76) · D2 free-ride (house price, 0/0/0) · D3 max reinvest (40/40/40) · D4 floor price $10 all weeks · D5 ceiling $120 then house · D6 house + 20%. Handed-To-You released **after the week-2 bell** (the path the shipped e2e drives). |
| R-B | 6 | Price-extreme probe: both big-market desks (D1 New York, D3 Golden State) held at **$10** all three weeks, small markets at house price; Handed-To-You released **during the week-2 open window**. |

### Per-repair verdicts

**R1 — stage the consequence. CONFIRMED, with a reachable exception (new finding N-1).**
Observed, every desk, both bells, no manual scroll: page at `scrollY 0`, `#hlSplit`
219..330, KEPT 337..376, `#hlRoad` 383..436 in a 600px viewport; `#hlPriceDial` at
1131..1174, off-screen. The bell now lands the pair on the result
(`r1-05-afterbell-w1-desk1.png`). This is a real repair and the screen is the best in the
build.
*Exception:* on any **sold-out** week a FULL HOUSE banner pushes `#hlRoad` to 531..584 while
the fixed lock bar occupies **539..600 at z-index 20**. Hit-tested with
`elementFromPoint` at the road card's own centre and lower third: `#hlLockBar`, not
`#hlRoad`. The externality sentence — "…$350,064 on THEIR books. You do not get any of it."
— is behind an opaque bar and unreadable (observed R-B/D1 and R-B/D3 week 1, R-A/D4 week 2;
`r1-17-afterbell-fullhouse-desk1-w1.png`). `assertSettlementAboveFold` passes it because it
tests `bottom <= vh+1` and never tests occlusion — the same "in the box, not in the field of
view" blind spot the original R1 named, one layer down. Low price is the most common naive
grade-5 strategy; this fires in most classes.

**R2 — LOCK IT IN and the schedule strip above the fold. CONFIRMED as specified; the fold
problem rotated rather than cleared (new finding N-2).** Observed on all six desks at first
contact: `#hlLock` 548..592, all three schedule rows fully visible at 348..486, page 1002px
(`r1-03-prelock-w1-fold.png`). But `#hlPriceDial` measures **595..617** and the reinvest
stepper below it — i.e. **both dials are now under or below the fixed lock bar at the moment
of decision**, on every desk. A pair can complete a turn by pressing the pinned LOCK IT IN at
the default $56 / 0% without ever seeing a dial. R2's falsifiable clause did not assert the
decision surface, only the button and the strip.

**R3 — reveal stage 5's causal claim. CONFIRMED in substance; two residual copy defects
(N-3).** "Nobody told this room to move" is gone. The beat now teaches the horizon rule
("investment dies when there is no tomorrow to collect in") and refuses to choose a cause.
Residuals, both observed:
- *Off-by-one on the bar clause.* `sawBarBeforeWeek3` = `barReleasedAtWeek < WEEK_COUNT - 1`.
  In R-A the teacher released the bar after the week-2 bell — the room read the bar on the
  projector while pricing week 3 — and the board printed "This room did **NOT** see the
  Handed-To-You bar before it played week 3, so nothing on this frame can be about the bar."
  That is false about the room, and it is the release point `e2e-m2l2.cjs` itself drives.
- *Self-contradiction in the DOWN branch.* The DOWN sentence names the bar unconditionally
  ("…and whatever they made of the bar"), so it fires four sentences after the NOT-seen
  clause. Observed in R-A (`r1-12-board-reveal-5.png`). R-B, released in the week-2 window,
  printed the correct "did see" clause (`r1-19-board-reveal-5-bar-seen.png`).

**R4 — "SMALL BUILDING, BIG NIGHT". CONFIRMED.** The gap is now split by the same three
blocks the room has read all lesson, the driver is computed rather than asserted, and both
prices print either way. Watched under the exact condition that broke it: R-B, New York at
**$10** hosting Draw 26 ($490,672) against Oklahoma City at **$46** hosting Boston Draw 60
($811,826); gap $321,154, of which $279,928 is the visitor block, and the board says so
(`r1-18-board-reveal-4-price-extreme.png`). In R-A no honest pair existed and the beat said
so rather than inventing one. Claim now matches the data. *Play cost, recorded not blocking:*
beat 4 is five lines of prose with no exhibit, and can be a dead beat entirely.

**Free-rider comparison separates choice from schedule luck. CONFIRMED as an instrument;
empty for the desk it exists to inform (N-4).** Board reveal 2 now prints per desk
"spent $X · dealt $A/$B" under the legend "These bars are what the **DESKS CHOSE**, not what
they were dealt" (`r1-12-board-reveal-2.png`). The private ADAPT card splits into
"EVERYTHING YOUR DRAW MOVED — MOST OF IT THE DRAW YOU WERE DEALT" (Net, now carrying "This is
not money you kept or lost" — old R9 closed) and "WHAT YOUR OWN DECISIONS DID", with a
within-desk counterfactual: "Same schedule, same prices, same everything — except you put
nothing back. That is the only fair thing to compare yourself to, because nobody chose their
calendar." That is a genuine luck control and the first "what if we'd done something
different" in the build. Observed R-A: D1 spent $429,581 → **+$270,243** own cash; D4 spent
$105,724 → +$27,982; D6 spent $687,711 → **−$155,919**; D3 spent $1,255,738 → **−$269,638**.
*Residual:* the free-riding desk's block reads $0 / $0 / $0 under a sentence describing a
counterfactual identical to what it did (`r1-13-adapt-desk2-freerider.png`). D2 free-rode
three weeks, finished **2nd of 6 in cash ($3,722,096)**, and neither its card nor the board
shows it what the choice cost — the board's class line says reinvesting was worth
**−$127,332** to these desks' own books. The confound is gone; the consequence still is not
there. (Economically that is the externality doing its job; as play it means the free-rider
never feels a cost.)

**Unchanged, verified again:** the Handed-To-You release is still projector-only — desk 1's
rendered text is byte-identical across the press (observed). Old R5 (schedule strip
retro-updates played weeks: recap header "W1 vs Memphis · D62" beside strip row "Week 1 ·
played · HOST Memphis · Draw 54") still present. R10 confirmed fixed: reinvest copy is one
line plus a "HOW THE REINVEST DIAL WORKS" disclosure. Week 3 now reads "LAST WEEK. Draw you
buy now earns you nothing more in this lesson — it is what your club carries into the next
one," which points at an L3 that does not exist yet.

### RATING: FUNCTIONAL

Upper end of FUNCTIONAL, and materially better than the graded build. It is not STRONG.

**The single remaining cause, stated precisely: only one of the two dials carries a
consequence the desk can feel inside the lesson.** The price dial has consequence but no
counterfactual — nothing anywhere tells a pair what $46 would have taken on the night they
priced $78. The reinvest dial now has a counterfactual but the product itself prices its own-
book return at roughly nothing (negative for the two heaviest reinvestors; −$127,332 across
the room on the board) and then tells the desk in week 3 that it earns nothing more this
lesson. Across three weeks the pair therefore plays one live dial and one dial the game says
does not pay, against a schedule they did not choose, for a KEPT number with no reference
point and no week that can be lost. That is what caps the pull.

**Structural or repairable — the wave contract's kill condition: REPAIRABLE.** The kill
condition is not met and this slot should not return to architecture-level rework. The
evidence for that: the repair wave moved the hardest previously-blocking defect (staging the
consequence) without touching architecture, and the four findings above (N-1 occlusion, N-2
dials below the fold, N-3 bar-clause off-by-one and self-contradiction, N-4 empty free-rider
counterfactual) are all bounded copy/layout/instrument work inside the existing
`LessonModule`. The pull ceiling itself is closed by one bounded feature — a post-hoc price
counterfactual on the settlement screen — which the graded gate already recorded as "the
highest-value non-blocking opportunity for pull" and which does not violate the build's
no-preview rule.

**DISSENT play-l2-below-bar: NOT DISCHARGED**

### Required repairs to discharge

**N-1 (BLOCKING).** The road card must be legible after every bell, not merely
box-inside-viewport. *Falsifiable:* at 1024×600 immediately after `closeWeek`, for the
centre point and the lower third of `#hlRoad`, `document.elementFromPoint` returns a node
inside `#hlRoad`. Assert on a seeded sold-out week (FULL HOUSE rendered) as well as a normal
week. The same occlusion assertion belongs on `#hlSplit` and the KEPT row.

**N-2 (BLOCKING).** The decision surface must be reachable on first contact. *Falsifiable:*
at 1024×600 on entering PLAY week 1, `#hlPriceDial` and the reinvest stepper are fully inside
`0..600` and not occluded by `#hlLockBar` under `elementFromPoint`.

**N-3 (BLOCKING).** Reveal 5 must not state a false fact about the room, and must not
contradict itself. *Falsifiable:* releasing the bar at any point before week 3 is locked
renders the "did see" clause; and no rendered `#hlChange` string names the bar as a candidate
cause while also asserting nothing on the frame can be about it.

**N-4 (BLOCKING for STRONG).** A desk that spent $0 must be shown what its choice cost, in
the same luck-controlled form the reinvesting desks get. *Falsifiable:* for a desk with
average share 0%, the "WHAT YOUR OWN DECISIONS DID" block carries a non-degenerate
counterfactual (e.g. same schedule, same prices, 20% back in) rather than three zeroes.

**N-5 (the rating ceiling, non-blocking for the repairs above but required for STRONG).** A
post-hoc price counterfactual on the settlement screen, so the dial the pair touches every
week is the one that answers "what if we'd done something different."

### Not verified in this re-check

12-desk scale (played at 6; `l2-e2e-r1` asserts 12 and reports exit 0 — read as build claim,
not observed here); board privacy; teacher transfer; economic truth of the demand model;
projector back-row legibility. Those belong to their owning critics.

### Formal dissent

`play-l2-below-bar` stands, on the narrowed ground stated above: the settlement is staged
correctly in the common case but is occluded in the sold-out case, both decision dials are
now off the fold at the moment of decision, and the lesson's second dial still carries no
felt consequence. The cause is repairable and the kill condition is not met.
