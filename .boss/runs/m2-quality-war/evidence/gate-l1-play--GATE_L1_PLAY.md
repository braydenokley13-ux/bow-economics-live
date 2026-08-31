# GATE_L1_PLAY — Module 2 · Lesson 1 "Full House" (built lesson)

Independent Player / Gameplay critic. Boss run `m2-quality-war`, assignment `gate-l1-play`.
Fresh context; I did not build any part of this lesson.

**Method.** Real server (`runtime/dist/server/index.js`, PORT 4311), real Chromium via Playwright,
one browser context per surface: `/teach`, `/board`, and five `/play` seats at the 1024x600
Chromebook shape. I drove the UI only — range input, +/- buttons, checkbox, LOCK IT IN, and the
teacher's own buttons — reading each screen before choosing the next price, so Desk 1's line is a
genuine blind adaptive line and not a script. Two sessions were created; per mid-task scope
reduction from the Lead Integrator, **session A is the full arc** (LOBBY → HOOK → 5 blind nights
with teacher bell → manual Two Peaks → 7-stage REVEAL → ADAPT → COUNTERFACTUAL → SYNTHESIS →
COMPLETE) and **session B is a controlled experiment run to COUNTERFACTUAL** to isolate the two
dials the assignment names. Screenshots in `docs/gauntlet/module-2/screens-l1-gate/`.

**Evidence classes.** *observed* = I saw it on a rendered surface. *measured* = produced by a
script importing the shipped module (`runtime/dist/modules/fullHouse.js`), run only **after** blind
play. *inferred* = reasoning from those. *NOT VERIFIED* = requires real students or artifacts I was
not given.

**Boss evidence ids referenced:** `play-review` (the Stage-0 STRONG claim I was told to test, not
inherit), `l1-e2e` / `l1-e2e-browser` (builder's own three-surface proof), `l1-tuning-harness` and
`l1-tuning` (BC-2 constant sweeps), `l1-tests`, `arch-selection` (BC-1..BC-7 charter). Dominance
work is deliberately **not duplicated** here — the Economic Truth gate owns exhaustive dominance;
where I state a landscape fact I either measured that one specific thing myself (and say so) or I
rely on `l1-tuning-harness` and say so.

**Reliance / honesty.** Console-error count is **NOT VERIFIED**: my own server process was killed
three times by my sandbox harness mid-run, so every console error I captured is
`ERR_CONNECTION_REFUSED` from my infrastructure, not from the product. Nothing in this report rests
on those. Incidentally *observed*: after each kill, restarting the server against the same snapshot
file restored the session mid-night with all five desks' locks intact and `/play` resumed correctly.
Real-classroom timing, real 10–11-year-old attention, and real discussion volume are **NOT
VERIFIED** — I can judge structure and dead air, not a room.

---

## what-the-student-plays

Two students share one device and run one NBA building for five home nights. Odd desks get the
Knicks at MSG (19,800 seats, $520,000 nightly bill, $24 season plan); even desks get the Grizzlies
at FedExForum (17,794 seats, $280,000 bill, $16 plan). Two scoreboards run all lesson and never
collapse into one number: **CASH** and **RENEWALS**.

Each night, three surfaces move together:

1. The board and the desk show the same printed card — day, visiting club, Draw x/100, TV listing,
   and one or two plain-language notes ("The champions are in the building. That pulls hard. It is
   also on national TV — the whole country can watch it free at home. Two things pulling opposite
   ways."). `a04-play-night1-dials.png`, `a11-play-night4-shock-card.png`.
2. The pair sets **PRICE OF A SEAT** ($10–$120, step $2) and optionally **MAKING IT AN EVENT**
   ($0–$120,000 NY / $0–$60,000 MEM, $5,000 steps, "pays off next night… never changes tonight's
   crowd"). On Night 4 only, a third control appears: **open 2,400 more seats for $95,000, paid
   whether they fill or not**. Then LOCK IT IN. There is no preview of any kind; the screen says so.
3. The teacher rings **Open the doors**. Every desk settles at once and gets a full night recap —
   came / of / fill %, tickets, spent inside, money in, bill, event spend, Kept, and the renewals
   move — plus a running five-row history table. `a07-play-night1-result.png`.

Night 5 is Night 1's exact card, and the card says so **before** the pair prices it: "Same card as
Night 1. Same day, same visiting club, same TV. The only thing that has changed since Night 1 is
you." `a14-play-night5-repeat-card.png`.

After the fifth bell the pairs stop touching controls for the rest of the period. The teacher clicks
through seven REVEAL stages (five nights added to the room's scatter one at a time, then Two Peaks,
then per-market season books), then ADAPT (three discussion questions), then COUNTERFACTUAL (the
room's N1-vs-N5 table on the board; on each desk, "what you actually did" vs "same price every
night" vs "the most cash the five nights could give," each with its renewals cost), then SYNTHESIS
(six cards computed from this room's own numbers, with dated real anchors), then COMPLETE.

**Genuine decisions per pair: 11** — five prices, five event-spend amounts, one capacity checkbox.
Of these, the five prices are large and graded; the five spends are consequential but, as measured
below, cash-negative under every price a student will plausibly choose; the capacity checkbox is
never part of a best line. Everything after the fifth bell is read-and-discuss with zero input.

---

## pull-rating

**RATING: FUNCTIONAL**

The Stage-0 loop survived. The classroom layer built around it has not yet earned STRONG.

What survived intact and is genuinely good: the blind commitment, the two non-summable books, the
graded strategy spread, the repeat-card beat, the Two Peaks reveal, and — new and better than
Stage-0 — a per-desk COUNTERFACTUAL panel that puts your actual season against the lazy season and
the maximum season *with the renewals price of each attached*. `a22-play-counterfactual.png`. The
teacher's WATCH FOR panel names real desks for real reasons ("Held the same price 3+ nights: Desk 2
— your best ADAPT voice"). Session A's board produced the single best classroom moment I saw: four
desks charged the same price on N1 and N5, **one drew a bigger crowd and two drew a smaller one**,
and the board said so in one line. `a21-board-counterfactual.png`.

**Biggest boredom source: the projector during PLAY.** For roughly half the period the board's only
job is a lock counter and a chart the room cannot read yet (see biggest-failure). A pair that locks
early sees "Locked. Nothing to do but find out — the doors open when your teacher rings the bell."
and then waits — five separate times, with no countdown, no "3 desks still deciding," no partial
tease, nothing to re-decide. `a05-play-locked-waiting.png`. The reveal *beat* exists (the bell is a
single synchronized settle and that lands), but the **anticipation** in front of it is unfurnished:
the design gives the teacher a bell and gives the room nothing to do while the bell is coming. In a
class of 12–15 desks the slowest desk sets the tempo five times and the fastest desk has five idle
stretches. That is the fixable pacing hole, and it is fixable without touching the economics.

Decision density across a 50–60 min shape (*inferred* from the built arc, timing NOT VERIFIED): five
decision windows in roughly the first half, then a fully teacher-driven second half of eleven clicks
(7 reveal stages + 4 phase advances) during which the student device never accepts input. The back
half is not dead — the /play REVEAL page carries the pair's own five nights and their own market's
Two Peaks, and COUNTERFACTUAL is strong — but it is entirely reading. Whether that half lands is
carried by discussion quality, which is NOT VERIFIED.

Not WEAK: the loop demonstrably produces reasoning, surprise, attribution and argument. Not STRONG:
the one thing the port was supposed to add — the room as evidence — currently renders a picture that
argues against the lesson (below), the second dial is an unsignposted cash trap, and the third
control is a decision no informed player takes.

### Did the three verified STRONG beats survive?

**1. Nothing sweepable pre-commit — SURVIVED, verified.** *Observed* on every pre-lock screen across
ten desk-seasons: card, dials, own history, and the line "No preview. Nothing on this screen tells
you what tonight will make." The board during an open night shows only the card and "n/5 DESKS
LOCKED IN" — no price, no outcome (`a06-board-night1-all-locked.png`). One qualification the
Stage-0 review could not have: from Night 2 onward the board carries the room's *settled* points, so
a sharp desk can read the room's realized demand off the projector. That is history, not preview,
and I judge it a gain, not a leak.

**2. N5-repeats-N1 — SURVIVED, and the class layer made it better.** *Observed*, Desk 1 session A:
$20 both nights, 17,950 then 16,630, renewals 50% → 28%. Desk 4 session B (flat $16, heavy event
spend): 14,740 then **17,794 — FULL HOUSE**, renewals 50% → 98%. The board printed both directions
in one sentence. The solo version of this beat is now *weaker* than the room version: a single desk
sees a 7% dip and could shrug; a room that sees one desk gain 3,054 people and three desks lose
people at unchanged prices cannot shrug. Caveat: a desk whose own delta is small (Desk 2 session B,
14,740 → 14,465) gets almost nothing personally and depends on the board to feel it.

**3. Two Peaks — SURVIVED as a statement, weakened as a proof.** *Observed*: teacher-gated (nothing
appears until `Release the Two Peaks` is clicked), lands in big type for both markets at once —
NY $52 tickets-only vs $42 total, MEM $38 vs $32 — and closes with "The cheaper ticket made more
money." `a10-board-two-peaks.png`, `a17-board-reveal-twopeaks.png`. It also reappears on each
student's own device for their own market. The weakening: the panel **asserts** two prices, and the
chart directly above it plots people-vs-price, not money-vs-price, with no marker at $52 or $42. The
room is told a conclusion it cannot check against the picture it is looking at.

### The N4 capacity option — is the choice fake?

**Ruling: not inert, but never part of a best line — a consolation prize, not a strategy. The
builder's own flag is confirmed.**

*Observed*, controlled A/B in session B — two New York desks, identical five-night line, identical
$54 on Night 4, one control differing:

| desk | Night 4 | attendance | Kept |
|---|---|---|---|
| B-Desk 1 | $54, no bowl | 19,800 / 19,800 — FULL HOUSE, 1,560 turned away | $905,600 |
| B-Desk 3 | $54, bowl open | 21,360 / 22,200 (96.2%) | $922,920 |

Bowl gain: **+$17,320 on a $95,000 outlay** — real, but 1.9% of the night.

*Measured*, sweeping the shipped constants across the whole legal dial on N4 at renewals 50:

| market | best without bowl | best with bowl | delta |
|---|---|---|---|
| New York | $1,229,600 at $90 | $1,134,600 at $90 | **−$95,000** |
| Memphis | $1,102,400 at $84 | $1,060,400 at $84 | **−$42,000** |

The bowl is positive only below about $56 — i.e. only when you have already given up $200k–$320k by
underpricing the shock night. Its entire positive range is a partial refund on a pricing mistake.
Session A Desk 3 ($110 + bowl) shows the other tail: 10,200 of 22,200 and $95,000 burned.

The gameplay cost is worse than the arithmetic. Taking the bowl **deletes the best beat on the
biggest night**: B-Desk 1 got the FULL HOUSE banner and "1,560 people wanted in and could not get a
seat. Those seats changed hands again outside the building. That money is not missing from your
books — you never asked for it." B-Desk 3, for $17,320, got 96.2% and no such line
(`a12-play-shock-soldout.png`). So the checkbox is a real decision whose correct answer is almost
always no, whose payoff is an order of magnitude below the dial's, and whose yes-branch trades the
lesson's most vivid sentence for a rounding error.

### The NIGHT-SPEND dial — real decisions or noise?

**Ruling: not noise. It is the most consequential *unexplained* control in the lesson — a
cash-losing, renewals-buying dial whose payback rule is never stated anywhere.**

*Observed*, controlled across the two sessions — same market, same $16 every night, five nights,
only the spend dial differing:

| desk | night spend | final CASH | final RENEWALS |
|---|---|---|---|
| A-Desk 2 (Memphis) | $0 every night | **$875,672** | 80% |
| B-Desk 4 (Memphis) | $60,000 (max) every night | **$669,584** | **100%** |

$300,000 spent bought back about $94,000 of crowd and +20 points of renewals. The dial moved the
season by 24% of cash — it is emphatically not a slider-wiggle.

*Measured*, from the shipped constants: spend converts at `eventFans` extra bodies next night —
0.01/dollar in New York, 0.016/dollar in Memphis — and each extra body is worth `price + ancillary`
($18 NY, $12 MEM). Break-even next-night price is therefore **$82 in New York and about $50 in
Memphis**. Below that the dial loses cash by construction, and it pays nothing at all if next night
sells out. Renewals convert at $24,000/point (NY) and $10,000/point (MEM), capped.

So the dial is honest and consequential — and completely illegible. The label says "pays off next
night," which is true in people and false in money at any price a fifth-grader will pick. Nothing on
`/play`, nothing on the board, and nothing in the seven reveal stages states the payback rule, the
renewals purchase, or the sold-out waste. The only mention anywhere is three words inside the
counterfactual card: "Best price every night, **spend early**." A pair that reasons "more promotion
is better" is punished for it and never told why.

---

## biggest-failure

**The board's class evidence — the whole point of porting this lesson to a room — renders as a
connected line through five different demand nights, so it contains upward-sloping segments that say
"we charged more and more people came." And it is exactly the picture the room is instructed to
argue from.**

*Observed*, `a19-board-adapt.png` and `a16-board-reveal-nights.png`: 25 desk-nights are plotted as
price vs people, one series per market, and the points are joined into a per-market polyline sorted
by price. Because N1 (draw 22), N3 (draw 88, national TV) and N4 (draw 97) are three different
demand worlds, the joined line does this:

- New York runs **flat at ~19,600 from $52 to $66**, then falls to 0 at ~$95, then **climbs back up
  to 10,200 at $110**.
- Memphis sits near zero from $66 to $110 with a rising segment at the cheap end.

The board calls it "THE ROOM'S OWN CURVE." The footnote calls both series "demand curves." Nothing
on the chart says which dot is which night; the dots differ in size with no key. Then COUNTERFACTUAL
prints, in the room's face: *"Somebody in this room made more money by charging less. Explain how —
using the two lines on the board, not a guess."* `a21-board-counterfactual.png`. The two lines on
the board, read literally by a ten-year-old, contain a stretch where the expensive nights drew the
crowd. A fan-shaped scatter would have been honest; the joining stroke and the "curve" label are
what make it false.

This is the highest-severity finding because it is simultaneously (a) the single largest thing the
built lesson adds over the Stage-0 page I was asked to re-test, (b) the designated argue-fuel of
ADAPT and COUNTERFACTUAL, (c) on the projector for most of the period, and (d) a picture that
teaches against the mechanism the lesson exists to teach. It is not a rendering bug — the geometry
is correct for the data; the mistake is pooling and joining five demand worlds into one labelled
"curve." It is also bounded and tunable: colour or shape by night, drop the joining stroke, or let
the teacher step one night at a time (the REVEAL stages already do this — at stage 1 the picture is
honest; by stage 5 it is not).

Runner-up (structural, harder): the top third of the dial is a dead zone. *Observed*, session A Desk
3 — $90 on N1 drew **0 of 19,800** and $96 on N3 drew **0**. *Measured*, every price above roughly
$92 on N1 returns the identical outcome (0 fans, −$520,000). The pair that explores the top of the
slider — in grade 5–6, that pair exists in every room — gets the same answer to five different
questions, no gradient to learn from, a 0% renewals floor by Night 3, and their own dots pinned to
the axis on the projector. Cash is recoverable (session B Desk 5 opened $100 → 0 fans → −$520,000
and was back above zero by Night 4); renewals are not (it finished at 15%). "Zero people came to
Madison Square Garden" is also the one number in the lesson that a sports-literate student will not
believe.

---

## moment-by-moment-notes

*Strongest moment observed.* Night 4 settles and Desk 2's screen reads
`17,794 of 17,794 (100%) — FULL HOUSE` followed by "7,796 people wanted in and could not get a seat.
Those seats changed hands again outside the building. That money is not missing from your books —
you never asked for it." `a12-play-shock-soldout.png`. It is a win and a loss in the same panel, in
plain words, on the biggest card. This is the beat the whole lesson should be built around, and the
N4 capacity checkbox is currently the one control that can take it away from you.

*Second strongest.* `a21-board-counterfactual.png` — the N1-vs-N5 table. Five desks, four with
unchanged prices, crowds moving in both directions, and one line that names the cause without
naming the answer. Nothing in Module 1 or Stage-0 matches it for argue-fuel-per-pixel.

*Third.* The per-desk WHAT IF panel, `a22-play-counterfactual.png`: "$2,072,848 · 32%" against
"Same price every night ($24): $1,291,132 · 80%" against "The most cash the five nights could give:
$2,187,524 · 25%." Every counterfactual carries its renewals price, so the max-cash line does not
read as "you should have done this." My blind adaptive line landed within 5.2% of max cash; the
Stage-0 hill-climb line replicated on Desk 5 landed at 78% of it. The landscape is graded, not
cornered — consistent with `l1-tuning-harness`, which I did not re-run.

*Weakest moment.* REVEAL stages 1–5, `a16-board-reveal-nights.png`. Five separate teacher clicks
whose entire visible effect is "five more dots appear on the chart, and the headline gains one more
· N3." No stage headline, no per-night sentence, no callout of what changed. Whatever drama the
7-stage staging was meant to buy, the board spends four of those clicks silently — and each click
makes the chart less honest than the click before it.

*Second weakest.* The five waits. `a05-play-locked-waiting.png` is the whole screen a locked pair
looks at until the bell: locked price, "Nothing to do but find out," and their own history table.
Structurally fine once; five times in twenty minutes with no signal about how many desks are left is
where a fast pair goes off-task.

*A leak, observed.* With Night 4 **open** and 0/5 desks locked, the board already displayed: "That
was a real thing, and it happened two seasons ago. Indiana Fever home attendance went from 4,066 a
game in 2023 to 17,036 a game in 2024… six opposing clubs moved Fever games out of their own
buildings and into bigger ones, **for exactly the reason some of you just paid to open more seats**."
`a13-board-night5-open.png` shows the same block. Nobody had paid anything yet — the sentence is
false at the moment it renders, and it nudges the room toward the capacity option before a single
desk commits, on the one night where the option is a trap.

*Copy snag, observed.* SYNTHESIS card NIGHT 5 WAS NIGHT 1 ends "Same day, same visiting club, same
price — **different building**." `a23-board-synthesis.png`. On the beat whose entire point is "the
only thing that changed was you," the summary card blames the building. The COUNTERFACTUAL board and
the `/play` card both get this right; the synthesis card contradicts them.

*Chromebook fit, observed.* `a11-play-night4-shock-card.png` at 1024x600: the REJOIN PIN block holds
the top ~200px permanently, so on the shock night the card, both dials, the capacity checkbox and
LOCK sit below it and the history table is a scroll away. Two students sharing one screen are
scrolling to compare tonight's card against their own five rows at the moment that comparison
matters most.

*Late/stalled desks, observed.* A desk that never locks is auto-committed at the season-plan price by
the bell and the history row is labelled `AUTO` (session A Desk 4, N5, $16). Correct and legible;
consistent with `l1-e2e`.

*Board privacy, observed.* No student name reached `/board` in any phase, including SYNTHESIS. Desk
handles and market names only. The teacher console does show names and live dial positions — correct
for that surface.

---

## required-repairs

Falsifiable. Blocking items are blocking on **student-pull** authority.

### BLOCKING

**P1 — Stop drawing a curve through five different demand nights.**
*Test:* on the ADAPT board, with a room whose desks priced across the whole dial, no rendered series
may contain a segment where a higher price is paired with a higher attendance; and every plotted
point must be attributable to a night by colour, shape, or an on-screen key.
*Acceptable fixes (builder's choice):* drop the joining stroke and ship an honest scatter; or
colour/segment strictly per night; or make ADAPT show one night at a time under teacher control.
*Also:* stop calling the pooled picture "THE ROOM'S OWN CURVE" / "demand curves" while it pools
nights, and do not instruct the room to reason "using the two lines on the board" until the lines
survive this test.

**P2 — Make the night-spend dial's payback legible before the student commits.**
*Test:* a fresh pair reading only `/play` can state, before locking, that event money buys people
*next* night, that it is wasted if next night sells out, and roughly what price it needs to pay for
itself. Today a max-spend pair loses $206,088 of $875,672 (observed) with no on-screen or
post-lesson explanation of why.
*Acceptable fix:* one line on the dial in the same register as "No preview…" (e.g. "Every $1 brings
about 1 extra fan for every $100 of next night's ticket — it only pays back on a night you can
charge for"), plus one reveal stage or synthesis line naming what the spend bought. Do not fix this
by removing the dial; the controlled comparison shows it carries real, attributable consequence.

**P3 — Fix the pre-commit leak on the Night 4 board.**
*Test:* with Night 4 open and 0 desks locked, the board contains no sentence asserting that desks
have already used the capacity option, and no content that recommends or previews the option's
value. The Fever anchor is excellent and dated (`SR-6`) — move it to the Night 4 *settlement* or to
REVEAL, where "some of you just paid to open more seats" becomes true.

### NON-BLOCKING (repair before classroom release; none of these alone sinks the loop)

**P4 — Give the five REVEAL night-stages something to say.** One headline per stage naming what that
night's dots show ("N3: the biggest draw of the five, and the emptiest building in the room").
*Test:* each of stages 1–5 changes at least one line of board text, not only the chart.

**P5 — Furnish the wait.** On `/play` after lock, show how many desks are still deciding (a count,
never a name, never a price); on `/board` during an open night, show something that builds toward the
bell. *Test:* a locked pair can tell, without asking the teacher, whether the bell is thirty seconds
or three minutes away.

**P6 — Rule on the N4 capacity option.** As built it is a decision no informed player takes and its
yes-branch deletes the FULL HOUSE / turned-away beat. Either (a) cut it and let the shock night be a
pure pricing decision, or (b) give it a range where it beats the best pricing line — e.g. make the
extra seats cheaper, or let the shock demand exceed capacity by enough that the bowl pays at the
cash-optimal price. *Test for (b):* there exists at least one market where `max(net | bowl) >
max(net | no bowl)` on N4. Today that is false in both markets by $95,000 (NY) and $42,000 (MEM),
measured. Whichever way it is resolved, a desk that opens the bowl and still turns people away must
keep the turned-away line.

**P7 — Soften the dead zone at the top of the dial.** *Test:* no legal price on any card returns
exactly 0 attendance, and two prices $10 apart in the top third of the dial never return identical
outcomes. A floor of a few hundred stubborn fans keeps the high-price explorer inside the game and
removes the one number a sports-literate student will refuse to believe.

**P8 — Fix the SYNTHESIS NIGHT 5 WAS NIGHT 1 card.** Replace "different building" with the
attribution the rest of the lesson uses: the only thing that changed was five nights of your own
choices. *Test:* the synthesis card's causal claim matches the `/play` card and the COUNTERFACTUAL
board.

**P9 — Reclaim the top of the Chromebook fold.** *Test:* at 1024x600, the card, both dials and LOCK
IT IN are reachable without scrolling on every night, including Night 4 with the capacity checkbox.
Collapse the rejoin PIN after first use.

---

## dissent

None recorded. The FUNCTIONAL rating is a **repair** finding, not a kill finding: the Stage-0 STRONG
loop survived the port intact and every named cause above is bounded and tunable. If the Lead
Integrator wishes to record STRONG on the strength of the loop alone, I dissent — the classroom
layer is the thing this wave was built to prove, and P1 currently makes the room's own evidence
argue against the lesson.
