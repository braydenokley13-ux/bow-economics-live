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

---

# RE-RATE AFTER REPAIR ROUND 1

Same Player / Gameplay critic, fresh session, Boss run `m2-quality-war`, assignment `recheck-l1-play`.
I did not build any part of the repair.

**Method (observed unless marked).** Rebuilt `runtime/dist` this session, ran the shipped server on
**PORT 4332**, real Chromium via Playwright, six pages: `/teach` (1280x900), `/board` (1600x900), four
`/play` seats at 1024x600. One complete session, LOBBY → HOOK → 5 blind nights with the teacher's bell
→ manual Two Peaks after N3 → 7 REVEAL stages → ADAPT → COUNTERFACTUAL → SYNTHESIS → COMPLETE. I read
each screen before choosing the next price; no scripted line. Four deliberately different strategies:

| desk | market | line played |
|---|---|---|
| 1 · Rae & Ben | New York | adaptive card-reader $20/$34/$44/$54+bowl/$40, event money on N1 and N3 |
| 2 · Nour & Ivy | Memphis | season-plan $16 all five nights, **max $60,000 event spend every night** |
| 3 · Ari & Tal | New York | high-price explorer $88/$70/$70/$70, then stalled on N5 (auto-committed $24) |
| 4 · Sam & Jo | Memphis | under-plan $10–$12 all five nights, bowl on N4 |

Final books: D1 $2,055,692 / 68% · D2 $729,584 / 100% · D3 $737,644 / 34% · D4 $530,660 / 25%.
Zero console errors across all six pages (observed, this session — unlike the first gate, my server
survived). Screenshots `docs/gauntlet/module-2/screens-l1-gate/r1-01…r1-18`. Server killed; port 4332
confirmed closed. Boss evidence referenced: `arch-selection` (BC charter), `l1-e2e` /
`l1-e2e-browser` (builder proof, not inherited), `l1-tuning-harness` (constants), `gate-l1-econ`
(renewals tent). Real 10–11-year-olds, real timing and real discussion volume remain **NOT VERIFIED**;
I rate structural pull, not felt pull.

## 1 · Does the unpooled chart produce honest, legible argue-fuel?

**Honest: yes. Legible: half the room. Money-comparable: no.**

*Observed* `r1-11-board-reveal-allnights.png`, `r1-13-board-adapt.png`: 20 desk-nights, one mark each,
**colour = market** (blue NY / orange MEM), **shape = night** (dot / square / triangle / diamond /
ring), **no joining stroke**, an on-chart key naming both encodings, labelled axes ($10…$120 ·
0k…25k), and the caption "Compare dots of the SAME colour and the SAME shape — that is one building on
one night, and only that is a demand curve. Different nights are different crowds, so they are never
joined up." No rendered series contains an upward-sloping segment, because there are no series. The
picture no longer argues against the lesson. **P1's geometry test passes.**

Three defects remain, in severity order.

**1a — The COUNTERFACTUAL board tells the room to read dots that are not on the screen.** *Observed*
`r1-14-board-counterfactual.png`: the instruction in the largest type on the board reads "Find one
night on the board — one colour, one shape — where two desks in the same building charged different
prices… Explain how, using those dots, not a guess." The scatter is **not rendered in the
COUNTERFACTUAL phase** — it exists in REVEAL and ADAPT only. The room's designated argue-fuel points
off-screen at the exact moment the argument is asked for. This is new: it was introduced by the repair
rewriting the prompt to reference the chart without putting the chart on that phase.

**1b — The Memphis half of the evidence is an unreadable blob.** *Observed*, same two shots: all ten
Memphis desk-nights land between $10 and $16 and render as ~10 overlapping orange marks inside a
~50px box; N1-dot, N2-square, N3-triangle and N5-ring are indistinguishable on a projector. This is
not bad luck — the Memphis plan price is $16 and the renewals rule punishes undercutting it, so a
Memphis room will bunch at the low end every time. Half the class is asked to argue from a smudge.
The New York half is genuinely readable (blue N3 triangles at $44/12.8k vs $70/4.5k is a real,
comparable, arguable pair).

**1c — The chart shows people; the argument is about money.** The instruction asserts "Somebody in this
room made more money by charging less," but PEOPLE WHO CAME is the only axis. To answer, a pair of
grade-5 students must multiply 12,822 x $44 against 4,450 x $70 off gridline estimates. In this room
the N4 blue diamonds actually **contradict** the assertion in money terms ($54 → 22,200 → $983,400 vs
$70 → 17,400 → **$1,011,200**), so a sharp desk that picks the wrong comparable pair reaches the
opposite conclusion and is right. *Inferred*: the assertion is safe on N1/N3 and false on N4; nothing
on the board steers the room to a valid pair.

**1d — Headline copy still contradicts its own caption.** The chart is still titled "THE ROOM'S OWN
CURVE · N1 · N2 · N3 · N4 · N5" and the footnote still says "These demand curves are modeled on real
market differences," two lines above a caption explaining that the picture is *not* a curve. P1's
third clause ("stop calling the pooled picture a curve") is not discharged, though the harm is now
copy-level, not geometry-level.

## 2 · Does Two Peaks land as proof?

**Yes — this is the strongest repair in the round.** *Observed* `r1-05-board-two-peaks.png`: two money
panels, each with a dashed "tickets alone" curve and a solid "tickets + what they spend inside" curve,
**both peaks marked with a labelled dot and a drop-line**, the peak prices in big type ($50 → $40 New
York, $40 → $34 Memphis), a legend, the dial translation "$10 lower · 5 clicks of the dial," and the
claim last: "The cheaper ticket made more money." The eye can verify the claim without the sentence:
the solid peak is visibly left of and above the dashed peak. The room is no longer told a conclusion
it cannot check. It also reappears per-market on `/play` at REVEAL (observed on Desk 2).

Two smaller notes. (i) *Observed* text collision at 1600x900: "Tickets + what they spend inside peak
at$34" — no space before the Memphis figure, and the "$50"/"$40" right-hand numbers crowd the label
line. (ii) *Observed pacing*: released after Night 3, the panel prints the profit-maximising price band
onto the projector **before the room prices Night 4**, the biggest decision of the lesson. Teacher-gated,
so it is a teachable choice, not a leak — but `/teach` gives no guidance that holding it until after N4
preserves the last blind decision.

## 3 · Do tomorrow's card + payback line make the night-spend a reasoned decision?

**Yes, before the commit. No, after it.**

*Observed* `r1-01-play-night1-dials.png`: above the spend dial sits a boxed "TOMORROW · Night 2 ·
Saturday · a solid playoff club · draw 51/100 · local TV" plus "Every $100 here brings about 1 extra
person NEXT night — nobody extra tonight. That person pays tomorrow's ticket price and spends inside
the building, so the money comes back only on a night you can charge for. It comes back as nothing at
all if tomorrow sells out without them." Memphis correctly prints **$63**, its own conversion rate.
On Night 5 the block becomes "AFTER TONIGHT — Nothing. Tonight is the last night of the five — money
spent on the event tonight has no night left to land on." Two further honest guards *observed*: a desk
in the red has the dial locked at $0 with the reason printed (Desk 3, N2 onward). The chain
now exists: tomorrow's card + rate + waste condition = a decidable question. That is a real repair.

What is missing is the **receipt**. Desk 2 spent $300,000 across five nights and Desk 1 $60,000; no
night recap, no REVEAL stage, no `/play` season replay and no SYNTHESIS card ever says how many extra
people that money brought, or that it was wasted. Desk 2's N2 and N4 both sold out — the exact
"nothing at all" case the pre-commit copy warns about — and the recap prints "Making it an event
−$60,000" beside "1,708 people wanted in and could not get a seat" **without connecting them**
(observed, `r1-07-play-shock-soldout.png`). The rule is now stated; it is still never confirmed or
refuted by the game. A pair that ignored the paragraph learns nothing afterwards.

Also *observed*: the payback paragraph is three lines of the smallest grey type on the screen — the
most economically load-bearing sentence in the student surface rendered at the lowest visual priority.

## 4 · Regression check on the felt loop after the renewals retune

**No regression. Pricing is now consequential in both directions — and the reason is invisible.**

*Observed*, one session, four desks:

| desk | price vs plan | renewals path |
|---|---|---|
| 1 · NY | above plan ($34/$44/$54 vs $24) | 50 → 47 → 55 → 65 → 72 → 68 |
| 2 · MEM | exactly at plan, max spend | 50 → 62 → 74 → 86 → 98 → **100** |
| 3 · NY | far above plan ($88, empty building) | 50 → **30** → 16 → 20 → 28 → 34 |
| 4 · MEM | **below** plan ($10–$12), full houses | 50 → 43 → 37 → 33 → 29 → **25** |

Desk 4 is the retune working: a desk that fills its building every night and still watches its second
book fall for five straight nights. That is the two-books tension the module exists to teach, and it
did not exist in the old shape. The `/play` two-scoreboard header keeps it in the pair's face all
lesson. Desk 1 shows the other arm — above-plan pricing *gaining* renewals on big cards.

**The regression risk this creates:** nothing anywhere tells a student that pricing below the season
plan costs renewals. *Observed*, exhaustively across this session: `/play` prints only "Season plan
$16 a seat"; the night recap prints the delta with no cause; the seven REVEAL stages, ADAPT,
COUNTERFACTUAL and all six SYNTHESIS cards never state the rule. (Cross-checked against the shipped
client copy: the only student-facing strings containing "season plan" are the card chip, the dial
label, the empty-history line and the counterfactual row — no explanation anywhere.) So the dial that
drives half the scoreboard is now exactly where the night-spend dial was before this repair round:
consequential, honest, and unexplained. Desk 4's pair finishes the period at 25% renewals with a full
building and no sentence to attribute it to. Per CLAUDE.md §1, uncertainty during play must become
interpretable afterward — here it does not.

Other loop beats re-verified this session (all *observed*): blind commitment intact ("No preview…");
the bell as a single synchronized settle; FULL HOUSE + turned-away line intact, and **it now survives
the bowl** (Desk 1 opened the bowl at $54, filled 22,200 and still turned away 700 — the repair kept
the best sentence in the lesson on the yes-branch); N5-repeats-N1 landing hard on Desk 2 (14,740 →
17,794 at an unchanged $16); the stalled desk auto-committed at the plan price and labelled `AUTO`;
no student name on `/board` in any phase; the teacher's WATCH FOR panel naming three real desks for
three real reasons (`r1-17-teach-console.png`).

Still unrepaired from the first gate, and re-observed this session: the top-of-dial dead zone ($88 in
New York on N1 → **0 of 19,800**, −$520,000, −20 renewals in one night — P7); the unfurnished
`/play` wait (`r1-03`, no "how many desks are left" — P5); the Chromebook fold (the rejoin PIN still
holds the top ~200px and LOCK IT IN sits at y≈947 in a 600px viewport, so every pair scrolls to price
every night — P9); the SYNTHESIS card "NIGHT 5 WAS NIGHT 1" still ending "same price — **different
building**" (P8). One new copy note: the repaired REVENUE card correctly quotes one market and one
night, but the pair it quotes is "$20 and 17,950 came / $88 and 0 came" — the lesson's headline
economics card now rests on the one number a sports-literate student will refuse to believe.

## 5 · Rating

**RATING: STRONG**

Movement from FUNCTIONAL is earned on four things I verified this session, not inherited: the class
evidence is no longer false (1); Two Peaks is a picture that proves its own sentence (2); the
night-spend dial became a decidable question instead of an unsignposted trap (3); and the renewals
retune gave under-pricing a real cost, which turns the two books from a display into a dilemma (4).
The loop produces reasoning, surprise, attribution and argument, and the class layer now supplies
argue-fuel that survives being read literally by a ten-year-old.

Not MAGNETIC, for one reason above all others: **the second half of the period is still eleven teacher
clicks during which no student device accepts input**, and five of those clicks (REVEAL stages 1–5)
change nothing on the board except the chart title gaining "· N4" and five more dots appearing. There
is no per-stage sentence, no callout, no "look what N3 did." *Observed* across all seven stages this
session.

**Biggest remaining boredom source: REVEAL stages 1–5 on the projector.** It is the moment the lesson
converts private play into public evidence, and it currently spends four of its five beats silently.
Runner-up, unchanged from the first gate: the five locked-and-waiting stretches on `/play`.

*Not felt, only structural.* I cannot judge whether a real pair leans forward at the bell, whether the
argument at ADAPT actually breaks out, or whether the room stays with a chart for four minutes. Those
remain NOT VERIFIED until a real class plays it.

## Repairs still required (updated)

**BLOCKING (student-pull):**

- **P1-b (new) — put the dots on the COUNTERFACTUAL board, or stop pointing at them.** *Test:* every
  phase whose copy instructs the room to read the chart renders the chart in that phase.
- **P10 (new) — name the renewals rule somewhere the student sees it.** *Test:* a pair that priced
  below the season plan all five nights can state, by the end of the period, why their renewals fell
  while their building was full. One dial-side line pre-commit plus one REVEAL or SYNTHESIS line is
  enough; do not soften the mechanic.

**NON-BLOCKING, in order:** separate the Memphis cluster (jitter, per-market panels, or a per-market
x-scale) so the low-price half of the room is readable on a projector (1b) · give REVEAL stages 1–5 one
sentence each (P4, unrepaired) · give the room a money view of its **own** dots, or steer the
"charged less, made more" prompt to a valid pair, since N4 contradicts it (1c) · retitle the pooled
chart and its footnote (1d) · print a receipt for the night-spend at settlement or REVEAL (P2 second
clause) · P5, P7, P8, P9 unchanged from the first gate · fix the "peak at$34" text collision.

## Dissent

**DISSENT play-board-curve-pooled: DISCHARGED.**

The joined polyline is gone, every mark is attributable to a market and a night by two independent
encodings plus an on-screen key, the caption states the comparison rule in student language, and no
rendered series contains a higher-price/higher-attendance segment. The residue — the surviving "CURVE"
headline (1d), the Memphis cluster (1b), and the chart-less COUNTERFACTUAL instruction (1a) — is
recorded above as separate findings, not as continuation of this dissent.

**New dissent recorded: `play-l1-renewals-unexplained` (BLOCKING, student-pull).** The renewals book
now drives half the outcome and half the classroom argument, and no student-facing surface states the
rule that governs it at any point in the period. This is the same failure class the round just
repaired on the night-spend dial, relocated. I do not consider the lesson classroom-ready while a desk
can finish at 25% renewals with a full building and no available explanation.
