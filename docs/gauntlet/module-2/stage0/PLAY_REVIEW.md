# PLAY_REVIEW — Module 2 Stage-0 architecture war

Independent Player / Gameplay critic, Boss run `m2-quality-war`, assignment `stage0-play`.
Method: Playwright + Chromium at `file://`, UI-level play (sliders dragged, buttons clicked, only
on-screen text read), then scripted strategy sweeps through `window.__stage0Actions`, then `?debug=1`
**after** blind play to confirm the true curves. Screenshots in `screens-play/`.

Evidence classes used below: **observed** = I saw it in the browser; **measured** = produced by a
scripted sweep whose numbers are reproduced here; **inferred** = reasoning from measured values;
**NOT VERIFIED** = requires real students or artifacts I was not given.

Coverage honesty: L1A, L1B, L1C, L2 played to completion under 6+ strategies each including a
different-seed replay. **L3 could not be played to completion by any strategy — it hard-blocks (see
below); its second half was inspected by forcing the state machine from the console, which is not
play.** No Boss evidence ids were supplied to me with this assignment, so I cite file paths, screenshot
names and reproducible action sequences instead; if evidence ids are required for the gate, they must
be attached by the Lead Integrator to these observations.

---

## what-the-student-plays

### l1a-replay-dial.html — "The Replay Dial"
Beat by beat: read THE BOOK (last Saturday's fixed price/turnout/money) → read TONIGHT'S SLATE (three
real NBA opponents, each with a 5-dot Draw heat rating) → drag one price dial from $10–$120 while a
**live REPLAY readout** recomputes fans and money *against last Saturday's curve* → LOCK → REVEAL of
three separate night outcomes → Continue → Round 2 repeats the dial three times, once per night, each
night now carrying one printed shifter → final side-by-side of Round 1 vs Round 2 totals.
**Genuine decisions: 4** (one blanket price, then three per-night prices). Everything else is Continue.

### l1b-release.html — "Season on Sale"
Wave 1: with no schedule in existence, choose 0–100 blocks to sell as season passes at $70,000/block,
irreversible → SCHEDULE DROPS (six real opponents with printed Draw 20–95) → Wave 2: sell more passes
at $85,000 → six nights, each: read the card and a printed comparable ("a comparable Tuesday last
season released 18 blocks and cleared about $10,700/block"), then choose how many held blocks to
release; you never set a price, the rate falls as you release more → per-night reveal → season books.
**Genuine decisions: 8** (two pass waves + six releases). Structurally the richest action space of the
three L1 rivals — and, as measured below, seven of the eight are worth nothing.

### l1c-blind-price.html — "Price the Night, Blind"
Five nights. Each night: read a printed card (day, opponent description, Draw x/100, national TV
yes/no, occasional pre-announced shock) and your own accumulating history table (price, turnout, fill
for every night you have already played) → set a price with **no preview of any kind** → LOCK →
reveal of turnout, gate, in-arena spend and the new Renewals number → next night. Night 5 replays
Night 1's exact card. After Night 5 a "Two Peaks" panel reveals Night 3's real curve (ticket-max $54
vs total-max $48) and a Night 1 vs Night 5 comparison.
**Genuine decisions: 5**, all consequential, all irreversible, none previewable.

### l2-hosting.html — "Somebody Else's Building"
Four weeks in a six-desk mini-league; two home, two away (observed: the season is four weeks, not the
six the framing implies). Home week: two dials — OPEN THE HOUSE (0–5 sections, cost lands before the
crowd is known) and BUILD THE DRAW (reinvest 0–40% of last week's gate) → COMMIT → **decomposition
reveal** splitting your gate into "what your decision did" vs "what the visitor's draw did" → league
digest of every matchup. Away week: sections are explicitly not yours; you see the money your own Draw
generated *on someone else's books*.
**Genuine decisions: 6 slider settings, of which 2 (away-week sections) are inert.**

### l3-rule.html — "Writing the Rule"
Three offer rounds: set SHARE (0–60% of local revenue pooled) and a CONDITION checkbox (must reinvest
≥15% to collect), submit, see an anonymous unsorted histogram of six desks and a running median, move
or hold → adoption test (two-thirds within ±10 of the round-3 median) → then "live under it": one week
under the old rule, one under the new, then a before/after table.
**What the student actually plays: 3 proposals and then a wall.** After the first live-week COMMIT the
page renders an empty panel with no continue control (`l3-live-before-reveal-blank.png`). The entire
"live under the rule" payoff is unreachable.

---

## pull-rating

### l3-rule.html — REFOUND (as playable; UNRATEABLE as designed)
Observed: from `liveBefore/decide`, clicking COMMIT THE WEEK moves state to `liveBefore/reveal`, where
the only visible button in the document is "New run" (`newRunBtn`); `advanceBtn3` is present but not
displayed, and the reveal panel is empty. Identical dead end via the fallback toggle
(`l3-fallback-deadend.png`). Both routes to the lesson's payoff are closed. Biggest boredom source is
moot — the student cannot reach the part that would or would not be boring.
Of what *is* playable: three slider submissions against five simulated desks that converge on you
anyway. Measured sensitivity is real (proposals `[0,0,0]`→adopted 22.5%; `[30,30,30]`→32.5%;
`[35,35,35]`→35%; `[60,60,60]`→**no adoption**, fallback share 5%), so holding out has genuine bite —
that is the one good bone here. But three submissions is not a loop, and in a real room the pull comes
from the argument, which no prototype can evidence. NOT VERIFIED: everything about whether a room
converges in eight minutes.

### l1a-replay-dial.html — WEAK
Biggest boredom source: **the only interactive number on screen is decorative.** The REPLAY readout is
a live, exactly-sweepable revenue curve — I swept it in 2-dollar steps and found its peak at exactly
$100 ($909,500) — and it is computed against a night that is not the night you are pricing. Measured:
Round 1's actual gate is *monotone increasing* over the entire dial ($10→$445,380 … $100→$2,536,600 …
$120→$2,595,360). There is no interior optimum inside the action space; the dominant line is "shove it
to the ceiling," and the ceiling binds (`?debug=1` confirms Saturday's ticket-max price is ≈$143, off
the dial). So the student is invited to find a peak that exists only in a readout that does not govern
the outcome. That is fake uncertainty with false precision, which is worse than no readout.
Second: from $80 to $120 the Round-1 payoff moves 5% while Tuesday's crowd goes 1,938 → 0. The
decision is nearly payoff-irrelevant while looking precise, and an empty building carries no cost
because gate is the only number scored.
Round 2 is better — measured per-night optima 50/82/94 are genuinely interior and genuinely different —
but arrives after the lesson has already taught "max the dial."

### l1b-release.html — WEAK
Biggest boredom source: **the titular loop is strictly dominated and the whole game is decided on
screen two.** Measured over ten strategies and three seeds, every time:

| line | cash |
|---|---|
| sell 0 in Wave 1, **all 100 blocks in Wave 2**, release nothing | **$9,580,000** |
| all 100 in Wave 1 | $8,080,000 |
| hoard, dump 40 on the finale | $5,451,200 |
| draw-weighted spreading | $3,697,442 |
| no passes, spread releases | $1,563,750 |

`?debug=1` explains it: a pass block is $85,000 plus $9/seat × 200 seats × 6 nights = $95,800, while
the best possible released block (peak $28,900 on the finale) tops out near $30,700. Passes beat
releases threefold, unconditionally, on every night, at every draw. The economically-correct play is
therefore: skip the blind wave (waiting is free — nothing punishes it), sell everything at the higher
price, then click Continue six times with an empty inventory bar. Two of the eight decisions matter and
one of those two is trivial.
Also measured: `newRun(seed)` changes **nothing** in this file — schedule, draws, comparables and
outcomes are byte-identical across seeds 0,1,2,3,7,42. There is no second run; the premise "sell next
season before you know what next season is" is false on replay.
What is genuinely good and should survive whatever wins: releasing 40 blocks at once crushed the going
rate from $28,900 to $5,780 and the reveal printed both, and the counterfactual rate is shown even when
you release zero. That is the most legible quantity→price feedback in the whole war.

### l2-hosting.html — FUNCTIONAL (below the Track 101 bar)
Biggest boredom source: **both dials have corner solutions, and one run reveals them.** Measured across
three seeds, sections is monotone in cash (seed 0: 1→$228k, 2→$430k, 3→$588k, 4→$702k, 5→$816k) and
reinvest is monotone *against* cash (max sections + 0% reinvest = $816,218; max sections + 40% reinvest
= $346,548). So: "open everything, invest nothing," forever, and the DRAW dial saturates at 100 by
week 2 anyway when you do use it. Six weeks of framing, four weeks of season, two live decisions.
It is rated FUNCTIONAL rather than WEAK because the decomposition reveal is a real moment — "you made
$96,640 in other clubs' buildings and kept $720,000 of your own" is exactly the "our decision caused
*that*?" shape — and the dominant "never invest" line is arguably the intended trap that L3 exists to
fix. But a trap the student walks into once, in a slider with a visibly monotone answer, is a
demonstration, not a game.
Attribution honesty defect, measured: the reveal labels your home line "**what your decision did (your
own draw × your open sections)**" and prints $216,000 in week 1 at Draw 30 and $216,000 in week 3 at
Draw 100, same sections. Home own-crowd is 1,800 × sections and is **independent of your own Draw**. A
student who correctly reads the label and correctly reads the number learns something false.

### l1c-blind-price.html — STRONG
Biggest boredom source: the objective is never stated. CASH and RENEWALS both sit on screen with no
told relationship, so an aggressive or careless pair can play the whole lesson without knowing what
they are trying to do. That is a fixable copy problem, not a structural one.
Everything else holds up under attack. No preview exists, so nothing can be swept pre-commit.
Measured strategy spread is wide and graded: hill-climbed optimum `[14,30,50,54,28]` = $3,785,170 /
98% renewals; flat $50 = $2,959,440 / 15%; draw-scaled-high = $1,401,230; flat $10 = $1,744,200 with
100% renewals. Radically different lines stay interesting because they fail in *different currencies*.
The optimum requires per-night differentiation tracking the printed Draw, so learning the system
demonstrably makes you better. Path dependence is felt, not declared: same card on Night 1 and Night 5,
3,200 fans then 2,080, and the game says out loud "the only thing that changed since then is you."
The end-of-run reveal makes the uncertainty interpretable rather than a shrug: it prints Night 3's real
curve, ticket-max $54 against total-max $48, and names the lesson ("the cheaper ticket made more
money"). This is the only one of the five where I finished a run wanting to immediately run it again to
test a theory I had formed. Not MAGNETIC: it is still five rounds of one slider, the shock night is
announced rather than discovered, and there is no other player.

### L1 head-to-head ranking

**1. l1c-blind-price (STRONG) — should anchor Lesson 1.** It is the only rival where the pre-commit
information is honest (there is none to game), where no dominant line exists after five runs of
attack, where the strategy landscape is graded rather than cornered, where the post-hoc reveal makes
yesterday's uncertainty legible, and where two live currencies create a real tension instead of one
monotone number. It also owns the best economics beat in the war (two peaks, cheaper ticket makes more
money) and the best path-dependence beat (N1 vs N5, same card, your own doing).

**2. l1b-release (WEAK).** Ranked second only for the parts worth stealing: quantity-not-price as the
control, the falling going rate as visible market feedback, printed counterfactual rates, and the
intertemporal "spend it on Utah or save it for OKC" question. As shipped, the pass price destroys all
of it and the file has no replay value at all. The good idea is real; this build is not a candidate.

**3. l1a-replay-dial (WEAK).** Ranked last because its central bet failed in the direction the design
itself feared, and failed harder: the Replay readout is not merely "homework instead of discovery," it
is an actively misleading precision instrument attached to a decision whose true optimum is outside the
dial. Its headline reveal (see below) teaches the opposite of its lesson. Round 2's three-dial slate is
the salvageable half and it is close to what L1C already does better.

---

## biggest-failure

**l1a-replay-dial's closing reveal states a false cause, and no line of play can escape it.**

Round 1 prices three nights at one price; Round 2 prices them separately; the game then prints, as its
final sentence, e.g. `Round 1 total was $2,536,600. Difference: $-944,112 less by pricing per night
instead of once.` (`l1a-r2-after.png`).

Measured, per-night brute force, best achievable in each round:

| seed | best Round 1 (one price) | best Round 2 (three prices) |
|---|---|---|
| 0 | $2,595,360 at $120 | $1,646,980 at 50/82/94 |
| 1 | $2,378,610 at $114 | $1,527,812 at 44/80/92 |
| 2 | $2,196,700 at $110 | $1,411,800 at 42/78/88 |

`?debug=1` shows why: Round 2's slate is not Round 1's slate. Saturday's Draw drops 92 → 50 (star
ruled out) and Thursday carries a 0.85 base multiplier (national TV). Round 2 is a strictly poorer
demand world. **A student cannot win the comparison the game asks them to make, and the game attributes
the loss to per-night pricing rather than to the demand shock it silently applied.** The intended
lesson of the whole lesson — one price for three different nights is wrong — is contradicted by the
lesson's own scoreboard, on every seed, under every strategy. That is a fun simulation teaching false
economics, which CLAUDE.md §8 rules out on its own.

Runner-up, and the reason it is only runner-up: L3 is hard-blocked (a bug, repairable in an hour).
L1A's failure is in the experiment design, not the code.

---

## moment-by-moment-notes

**l1a-replay-dial** — Strongest felt moment: the Round-1 reveal at $100 printing **138 fans out of
19,800** against Memphis while OKC drew 16,828 on the same price (`l1a-r1-result100.png`). That is a
genuine gasp and the correct one. Weakest: sweeping the dial across its full range and watching the
REPLAY readout draw a clean hump peaking at exactly $100, then discovering by brute force that the real
answer was "$120, and higher if you could" (`l1a-r1-dial100.png`). The second weakest is the closing
comparison line (`l1a-r2-after.png`). Also flat: the 5-dot Draw ratings are the only adaptation signal
and they don't separate — Thursday and Saturday both read 3 dots in Round 2 with per-night optima $82
and $94 (`l1a-r2-start.png`).

**l1b-release** — Strongest: dumping 40 held blocks on the OKC finale and reading `Going rate achieved
$5,780/block` next to five earlier nights where the untouched rate had been printed at $12,400,
$20,100, $25,600, $12,840, $25,160 (`l1b-end-hoard.png`). You can *see* your own glut. That single
screen is the best economics-made-visible artifact in the war. Weakest: the six night screens in the
dominant line, where the inventory bar reads zero, the release dial has nothing to move, and the
student clicks Continue six times to reach a books page (`l1b-n1-start.png`, `l1b-w2-start.png`).
Second weakest: Wave 1, framed as the big blind bet, is dominated by simply doing nothing, because
nothing at all punishes waiting for the higher Wave-2 price.

**l1c-blind-price** — Strongest: Night 5's card reading *"Same card as Night 1. Same visitor, same day.
The only thing that changed since then is you,"* then turnout landing at 2,080 against Night 1's 3,200
at the identical price (`l1c-n5.png`, `l1c-end-flat50.png`). Second strongest: the Two Peaks panel
naming $54 vs $48 after the fact (`l1c-end-postrun-full.png`). Weakest: pricing Night 1 with a
literally empty history table — the game says "your first price is a cold guess — that's the point,"
which is defensible design but is felt as a shrug on the very first commitment (`l1c-01-open.png`).
Second weakest, and a real bug: the aggressive line (flat $120) returns **$0 cash and 0% renewals for
the entire five-night season**, including the Draw-97 shock night. Nobody buys a Knicks ticket at $120
in this model. An aggressive pair gets five blank buildings and no gradient to learn from.

**l2-hosting** — Strongest: the away week, where the screen says sections are *not your decision* and
then reports $164,560 you generated **on Cleveland's books** (`l2-week2-away-decide.png`, `l2-w2.png`).
That is the module's whole thesis in one panel and it lands. Second: the season-complete line, "you
made $96,640 in other clubs' buildings and kept $720,000 of what your own building earned"
(`l2-season-complete.png`). Weakest: week 3's decomposition printing "what your decision did (your own
draw × your open sections) $216,000" — the identical number to week 1 despite Draw having gone 30 →
100 (`l2-w3.png`). Also weak: the DRAW meter jumping 30.0 → 74.8 → 100.0 in two weeks off $3,000 and
$43,000 of reinvestment, after which the dial is dead for the rest of the season. And the final table
lists every desk's cash side by side (`l2-season-complete.png`) — flagged as Stage-0-review-only, but
it is a leaderboard and D4 says no.

**l3-rule** — Strongest: submitting 60% three times and being told the room did **not** reach
two-thirds, then being dropped to a 5% share nobody chose (measured; `l3-r3-adopt.png` shows the
adopted-path variant). Consequence for intransigence is real and rare in school software. Weakest, and
disqualifying: `l3-live-before-reveal-blank.png` — after COMMIT THE WEEK in the live phase the panel is
empty, no result, no button, run over. Forcing the state machine from the console shows what the
student never sees: a before/after table where New York and Golden State move reinvest 10% → 20% and
lose money, Charlotte moves 30% → 20% and gains $88,130, closing with "the rule changed what desks
wanted to do — nobody told them to move" (`l3-liveafter-reveal-forced.png`,
`l3-beforeafter-table-forced.png`). That content is promising; I am not allowed to rate content I could
not reach by playing, and I do not.

---

## required-repairs

Each is falsifiable by replaying the file and rerunning the stated sweep.

### Blocks selection

**l1a-replay-dial**
1. The Round-1-vs-Round-2 comparison must compare like with like. Hold the Round-2 slate's demand
   parameters identical to Round 1's (or compute and print the counterfactual "your Round-2 prices
   applied to the Round-1 slate"). *Test:* best-achievable Round 2 ≥ best-achievable Round 1 on every
   seed, brute-forced. Currently fails 3/3.
2. The action space must contain the optimum. Extend the dial ceiling (or lower the demand base) until
   Round 1's gate curve has an interior maximum. *Test:* `gate(price)` over the dial range is
   non-monotone on every seed. Currently monotone increasing on 3/3.
3. Either the Replay readout must predict something about tonight, or it must go. If it stays, the
   REVEAL must print, side by side, "the Replay said X / tonight paid Y / here is the difference and
   why." *Test:* a critic who sweeps the readout to its peak and locks there does not finish in the
   bottom half of the strategy set. Currently the readout's peak ($100) is beaten by the ceiling ($120)
   on every seed.

**l1b-release**
4. Season passes must not dominate nightly release. Price the pass (or the per-seat ancillary) so that
   at least one non-trivial mixed line beats "sell 100 in Wave 2." *Test:* across ≥10 strategies × 3
   seeds, the max-cash line releases ≥20 blocks across the six nights. Currently the winner releases 0
   in 30/30 runs.
5. Waiting for Wave 2 must carry risk. Something (a bad-schedule branch, a buyer-pool that shrinks, a
   pass price that can fall) must make the blind Wave-1 bet sometimes right. *Test:* Wave 1 = 100 beats
   Wave 2 = 100 on at least one seed. Currently 0/6 seeds.
6. `newRun(seed)` must actually vary the season. *Test:* schedule, draws and comparables differ across
   seeds 0,1,2. Currently byte-identical across six seeds.

**l3-rule**
7. Fix the `liveBefore/reveal` dead end on both the voted path and the fallback path. *Test:* a
   click-only session from load to the before/after table, with no console calls, on both paths.
   Currently 0/2 paths complete.
8. The "before" week must render its own result. *Test:* the liveBefore reveal names your reinvest,
   your take, and at least one other desk's, before the new rule binds. Currently renders nothing.
   (Note: repairs 7–8 restore playability; they do not entitle anyone to a pull rating. L3 must be
   re-played end-to-end by a Player critic before selection, and I did not rate its core loop.)

### Fix during build

**l1a-replay-dial**
9. Give the Draw dots resolution that matches the underlying spread, or print the numeric Draw as L1B
   and L1C do. Two nights reading 3 dots with optima $82 and $94 gives the student no basis to adapt.
10. Score something besides gate. At $120 Tuesday draws zero and the game approves; an empty building
    must cost.

**l1b-release**
11. Keep the printed counterfactual going-rate on zero-release nights. It is the best attribution
    device in the war and any winning design should inherit it.

**l1c-blind-price**
12. State the objective on screen in one line before Night 1. Two live currencies with no stated
    relationship is the only real boredom risk here.
13. Repair the top of the price range: a flat-$120 season returning $0 across all five nights,
    including the Draw-97 shock night, gives aggressive pairs no gradient and is not credible at MSG
    prices. *Test:* every price in the dial range returns non-zero turnout on the highest-draw night.
14. Give Night 1 one anchor (a league-average price, or last season's own number) so the first
    commitment is a judgement rather than a coin toss. Do not add a preview.

**l2-hosting**
15. Relabel or re-model the home decomposition. Either your own Draw must affect your home crowd, or
    the line must stop being called "your own draw × your open sections." *Test:* holding sections
    fixed and varying Draw 30 → 100 changes the printed "what your decision did" figure. Currently it
    does not.
16. Make sections a real trade-off. Cost must rise, or crowd must saturate, fast enough that 5 is not
    always best. *Test:* the cash-optimal section count differs across at least two of the four weeks.
    Currently 5 on all weeks, all seeds.
17. Slow the DRAW meter so reinvest stays live for the whole season. *Test:* draw does not reach the
    cap before the final week under a 20% policy. Currently caps in week 2.
18. Drop the all-desk cash table, or replace it with matchup-level comparison. It is a leaderboard.
19. Reconcile "six weeks" framing with the four-week season.

**All five**
20. Pairs-on-one-device is **NOT VERIFIED** in every file. Only l1c names a partner in its own copy;
    none has a surface built for two hands, a "you two disagree" moment, or anything a second student
    holds. That is a build-time requirement, not a Stage-0 excuse.

### Open — cannot be answered without real students

- Design A U1's own threshold ("median pair moves the dial ≥8 times before locking, and ≥half say
  something out loud about the difference between last week and tonight"). The `adjustCountBeforeLock`
  / `timeToLockMs` instrumentation exists and works (I read it in `window.__stage0.log`), but scripted
  play cannot generate an honest adjust-count and I will not launder one. What I *can* say from the
  build: the readout invites sweeping, and sweeping it leads to a worse answer than the ceiling.
- Design B U1 ("≥6 of 8 pairs change release size between nights for a reason they can state"). Open on
  the human half. Answered on the mechanical half: in the dominant line there is no release to change.
- Design C U1 ("≥70% move N3 price in the shifter-indicated direction; ≥60% give an economic reason").
  Open. The build at least makes the correct direction inferable from the printed card plus history —
  I could do it, unaided, from the UI alone.
- L2 attribution thresholds (both B and C phrase them as "can pairs name the visitor"). I could
  attribute the away-week money correctly from the UI alone; I could **not** attribute the home-week
  money correctly, because the label is false. Human threshold open; the instrument is currently
  miscalibrated against it.
- L3's entire uncertainty list — eight-minute adoption, convergence-through-argument vs herding on the
  median, and whether the room's talk is economic or moral. Nothing here is answerable from a
  single-seat prototype with five simulated desks, and less so from one that dead-ends.
