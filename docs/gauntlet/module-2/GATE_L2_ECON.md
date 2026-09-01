# Gate — Module 2 Lesson 2 "You Don't Play Alone" — ECONOMIC TRUTH

Boss run `m2-quality-war`, assignment `gate-l2-econ`. Independent gate on the BUILT module
(`runtime/src/modules/hostTheLeague.ts`). Fresh context; not the builder of this model.

**Evidence status.**

- **Observed (source):** `runtime/src/modules/hostTheLeague.ts`, `runtime/src/test/hostTheLeague.test.ts`,
  `runtime/src/client/play/main.ts`, `docs/gauntlet/module-2/ECONOMIC_CONTRACT.md`,
  `ARCHITECTURE_SELECTION.md` (BC-5), `DESIGN_C_FIRSTPRINCIPLES.md` (L2),
  `docs/gauntlet/module-2/stage0/l2-tuning-harness.mjs`.
- **Observed (computation, this session):** `npm run build --prefix runtime` (exit 0), then ten probe
  scripts importing the **compiled** `runtime/dist/modules/hostTheLeague.js` and driving the **real
  reducer** (`takeSeat` → `setPrice`/`setShare`/`lock` → `teacher:closeWeek`) — not a transcription.
  Includes a 254,016-combination exhaustive best-response search over the (price × reinvest) grid for
  weeks 1–2 with an inner week-3 price sweep, and an 18,549,440-state solvency sweep. Builder harness
  `l2-tuning` re-run this session: exit 0, 11/11.
- **Not verified by me:** every real-world sports fact (Sports Reality's gate, `sr-l2-anchor-copy`,
  `gate-l2-sr`); any gameplay or projector rating; anything about how this plays in a room.
  No browser session was run. Boss evidence ids referenced: `l2-tuning`, `l2-tests`, `l2-e2e`,
  `sel-econ-review`, `proto-l2`, `gate-l2-sr`.

---

## mechanism-verdicts

### N1 — HIGHEST SEVERITY. The class-evidence instrument for the lesson's own thesis measures the deal, not the decision. (observed)

`GiveAndTakeRow.gave` (module :981) sums `roadDollars` over the season — the dollars a club's Draw put
in other buildings. Draw is *dealt* (`ClubDef.startDraw`, 26–72, uncorrelated with market by design)
and only partly bought. In a 12-desk room where six desks reinvest 0% and six reinvest 40% every week
(real reducer, price $50 for all):

```
corr(gave, startDraw) = 0.959      corr(gave, meanShare) = 0.644
corr(net,  startDraw) = -0.904     corr(net,  meanShare) = -0.536
Desk 11 · New Orleans  share  0%  startDraw 72  gave $1,523,568  received $430,528  net -$1,093,040
Desk 12 · Chicago      share 40%  startDraw 28  gave   $734,728  received $992,460  net   +$257,732
```

The room's biggest **giver** spent nothing; a desk that reinvested the legal maximum for three straight
weeks reads on the board as a **taker**. In a room where *nobody* reinvests at all, the same board
already produces gave/received spreads of $293,088–$1,523,568 and nets from −$1,093,040 to +$745,824.

This instrument is load-bearing three times over, and each use is false as built:

1. **Teacher script, ADAPT Q3** (:2379–2381) answers "You put money into your Draw. Who got most of that
   money back — you, or the buildings you visited?" with *"The buildings they visited, **by a distance**
   — the WHAT YOU GAVE, WHAT YOU GOT board has each desk's two numbers. A desk that reinvested hard
   usually gave more than it got."* The board does not measure that, and the magnitude is wrong (see N3).
2. **Synthesis card `spillover`** (:2484–2492) opens *"When you put money into your club, most of what it
   earned did not land on your books"* and then names `biggestGiver` = the minimum-`net` desk. In the run
   above that desk is New Orleans, which put **$0** into its club. The card names a real desk in the room
   and attributes to its spending something it never spent.
3. **Harness P1/P3** (`l2-tuning`, harness :313–326) certifies "free-riding is punished AND visible"
   partly on `banker.net > 0 && feeder.net < 0 && banker.gave < feeder.gave`. That exact pattern
   reproduces with **every desk at 0%** (Desk 1 New York net +$342,556, Desk 2 Memphis net −$613,280),
   because New York was dealt startDraw 44 and Memphis 62. P3's "visible" limb is confounded and
   certifies nothing about free-riding.

This is the failure family that killed Candidate A at selection (`sel-econ-review`: "a closing reveal
that blames the student for a shock the model applied silently"). **BLOCKING.**

### N2 — The externality is REAL and material. C5 passes the delete-it test. (observed)

Not a rounding error. Marginal value of one Draw point per week, at house prices:

| my profile | my home gate lift | my local media | lands on the host I visit | external share |
|---|---|---|---|---|
| new-york | $7,696 | $12,000 | $6,272–$10,296 | 24.2–34.3% |
| golden-state | $7,722 | $12,000 | $6,272–$10,296 | 24.1–34.3% |
| oklahoma-city | $5,162 | $12,000 | $6,272–$10,296 | 26.8–37.5% |
| memphis | $4,704 | $12,000 | $6,272–$10,296 | 27.3–38.1% |

Whole-season, real reducer, 8 desks, others fixed at 10%, focal desk deviating from 0%:

```
share  5%: my cash +$224,192 | every other club +$145,608 | external 39% of value created
share 10%: my cash +$274,616 | every other club +$213,660 | external 44%
share 15%: my cash +$285,834 | every other club +$265,364 | external 48%   <- private optimum
share 20%: my cash +$239,836 | every other club +$291,216 | external 55%
share 40%: my cash  -$43,759 | every other club +$349,764 | external 100%
```

**Verdict: INSTANTIATED.** Delete `visitorDrawFans` and every home night returns the same number
regardless of who visited; delete it and the room's own barSummary drops from ~40% of door dollars to 0.
The marginal claim is textbook-correct: at the private optimum private marginal net is ~0, so *at the
margin* essentially all remaining value is external. The lesson has a genuine positive externality.

### N3 — but the SPILLOVER card's quantifier is false. (observed)

"**Most** of what it earned did not land on your books" is false on the totals a desk actually produced:
at the private optimum 52% lands on the desk's own books, 48% elsewhere (all clubs); counting only live
desks it is 60/40 in the desk's own favour, and at a modest 5% dial it is 61/39. The true sentence is
"about half," or the marginal sentence ("every extra dollar past the point where it pays *you* is
earning for somebody else"). The card also cannot be checked by the room, because no surface shows this
split — the numbers it does show (N1) are the wrong ones. **BLOCKING (numeric claim in a formalization
card).**

### N4 — The private return that drives the dial is a private annuity, not the shared product. (observed)

`drawDollars` = $12,000 per Draw point per week is 1.6–2.6× the home-gate lift and is identical in every
market. Delete-it test on the local-media Draw term, New York seat, three weeks:

```
drawDollars = 12,000 : cash-optimal (w1,w2) reinvest = (20%, 5%), gain over 0/0 = +$314,914
drawDollars =      0 : cash-optimal (w1,w2) reinvest = ( 5%, 0%), gain over 0/0 =  +$26,322
```

The reinvest decision is ~92% driven by a private local-media pipe. That is defensible economics
(drawing power really does move local rights money) and it is what makes C3 non-decorative — a decision
does turn on pipe lags. It also means the lesson's felt story ("I paid, they got it") is the tail of the
decision, not the dog. **INSTANTIATED but mis-narrated.** Ledger it.

### N5 — Two books: DRAW is instrumental, and OBJECTIVE_COPY says the opposite. (observed)

`OBJECTIVE_COPY` (:1136), rendered on the **student** HOOK surface (:1604) and the **board** (:1853):

> "You can buy Draw with cash. **You cannot turn Draw back into cash.**"

False of the model. A Draw point pays $12,000/week in local media plus $4,704–$7,722 per home night in
gate + in-arena. There is a computable exchange rate: Memphis-profile, cash-max path (25/5/0) vs
draw-max path (35/40/25) costs **$336,852 for +13 Draw = $25,912 per Draw point**. A real frontier
exists (R4 satisfied: cash-argmax ≠ draw-argmax), which is exactly why the "no exchange rate" sentence
is unnecessary as well as untrue. **BLOCKING copy defect.**

### N6 — Bill pressure is decorative; no seat is unwinnable. (observed)

18,549,440-state sweep of (profile × club × hostDraw × visitorDraw × price × share∈{0,40}): the harness's
R5 invariant holds (at least one legal price clears the bill from every state), and cumulative cash never
goes negative in any probed session (minimum final cash $319,212 in a 12-desk room pricing $120 with zero
reinvest all season). **No unwinnable seat: CONFIRMED.**

But the bill never binds anywhere in the reachable space. A desk that plays as badly as the grid allows
($110 every week, 152 people through the door in week 3) finishes with $3,015,105. CASH in this lesson is
a score, not a constraint, and `HOUSE_RULES[4]` ("Your bill is due every week whether 400 people come or
19,000 do") implies a pressure that does not exist. The ledger admits this and defends it; the student
copy does not. **Bill pressure: NOT REAL. Non-blocking, must be named.**

Two ledger sentences overstate it and are on the **teacher** surface (`simplifications`, :1816):

- `SIMPLIFICATIONS[5]`: "The weekly bill is always clearable, **at any legal price, from any state**."
  False. Reachable counterexamples in a 12-desk zero-reinvest room at $120: Chicago week 2 net −$12,000,
  week 3 net −$60,000; Golden State week 3 net −$36,000. (New-york-profile margin is
  `12,000×(draw−10) − 180,000`, negative below Draw 25; Chicago starts at 28 and decays to 20.) The
  module header (:132) makes the same overstatement. Harness P4 tests the weaker, correct invariant.
- `SIMPLIFICATIONS[7]`: "Everywhere the building does NOT fill, the two mistakes cost within 3x."
  Defensible only under the harness's per-offset definition (band A = the *low probe* does not fill).
  Read plainly it is false: golden-state at Draw 85/100, peak $90, ±$10 → under costs $168,432 vs over
  $13,210 = 12.75×. The teacher will read the plain sentence.

### N7 — Decomposition: residual 0 confirmed; uniqueness is not. (observed)

`settleHome`'s three-channel split is exact — max fan residual **0** over the full sweep, all blocks
non-negative, `HomeDecomposition.residual` 0 in every session probed. BC-5's arithmetic claim holds.

What does not hold is the implied uniqueness. The split is a *sequential* attribution (bare at
Draw 10/10 → add host Draw → add visitor Draw). Reverse the order and the visitor block changes by up to
**9,360 fans** (New York, Draw 100 hosting Draw 82 at $22: own-first credits the visitor **252** people,
visitor-first credits **9,612**, on a 19,812 sell-out). In 1,643 of 31,641 sampled sold-out nights the
visitor is credited **zero** fans. The chosen order is the conservative one (it understates the lesson's
own thesis), which is the right direction — but nothing on any surface discloses that the attribution is
order-dependent, and the module header presents "residual 0 by construction" as if it settled the
question. Residual 0 ≠ unique attribution. This is L1's largest-block-naming lesson, unrepeated in kind
but unledgered. **Non-blocking; ledger + one board honesty line required.**

### N8 — C3, C4, C9/C10 verdicts. (observed)

- **C3 (composition): INSTANTIATED.** Four pipes with structurally different shapes; national 28.4–59.5%
  of a club's total and gate 18.2–28.6% across probed sessions — inside the ledgered band and consistent
  with BC-3's re-derivation. A decision turns on the lag (N4). "The money you control least pays you
  most" is true of the model.
- **C4 (market size): INSTANTIATED, with a false-cause defect in its board line.** `startDraw` is
  genuinely uncorrelated with market size; the Draw ceiling is identical in every market (harness P9,
  settling Draw 87 everywhere with unlimited money); `smallMarketPathFrom` reads the room's own weeks and
  says so honestly when no pair exists. The defect is in the sentence it prints — see FL-A below.
- **C9/C10 (path dependence, invest-then-earn): INSTANTIATED.** Reinvest costs this week and pays next;
  the intervening week is visibly worse. Correctly deterministic-with-lag, no EV (M4 boundary respected).
- **C7 (incentives): NOT INSTANTIATED in this lesson**, and correctly so — it is L3's. No claim to repair.

---

## false-lesson-risks

Ordered by damage to a grade 5–6 model.

| id | False lesson this build can teach | Evidence | Severity |
|---|---|---|---|
| **FL-A** | **"The small market won because of who was visiting"** — when it won because of price. `smallMarketPathFrom` (:1084–1092) maximizes the door-money gap subject only to `smallVisitorDraw > bigVisitorDraw`; it never controls for price. Probed run (odd desks $110, even desks $30): the board prints *"Desk 9 · Denver … took $621,054 … Desk 10 · Philadelphia … took $19,456. The small market won that week, and it won it on WHO WAS VISITING."* Philadelphia priced **$110** and drew **152 people**; Denver priced **$30**. The cause is an $80 price gap. This is R9 (no pooled comparison without its controlling variable) failing on the projector, and it is a synthesis card too (`market-size`). | observed, real reducer | **BLOCKING** |
| **FL-B** | **"Your classmates' spending is what fills your building."** The whole room moving from 0% to 40% reinvest for three straight weeks moves the visitor block by **30%** ($9,850,960 → $12,803,064). At realistic dials (0→10%) it moves **19%**. So ≥70% — in practice ~81% — of the "handed to you" money is the *dealt* startDraw plus the schedule rotation. `barSummaryFrom` is honest about this ("Nobody in this room decided that about their own building"), but `ADAPT_QUESTIONS[1]` ("Somebody in this room made your best week. Who, and **what did they do** to make it?") and its scripted answer ("Whatever they did, they did it to raise their OWN Draw") invite students to attribute to a decision what was overwhelmingly a deal. | observed | **BLOCKING** (copy/script) |
| **FL-C** | **"Generosity is what the dial measures."** Reinvest is privately cash-optimal at 10–20% (N2). Free-riding at 0% is *punished* — good. But because the give/take board mis-ranks (N1), a room reading it learns "the desks who gave most are the ones who spent most," which is false, and L3 then opens on an inverted picture of who the payers are. | observed | **BLOCKING** (same repair as N1) |
| **FL-D** | **"You cannot turn attention into money."** `OBJECTIVE_COPY` (N5). Also hides the private return that actually drives the optimal dial, so a student reasoning correctly from the printed rules reaches the wrong dial. | observed | **BLOCKING** |
| **FL-E** | **"About a fifth of your door money holds your Draw steady."** `reinvestRuleFor` (:1390), rendered on the **student** play surface (`client/play/main.ts:2755`). Measured break-even (drawGain ≥ DRAW_DECAY=4) at house price, every profile: Draw 20–50 → **5%**; Draw 60–70 → **10%**; Draw 80 → **20%**; Draw 90 → **no legal share holds it**. Desks start at Draw 26–72, so the printed rule is 2–4× too high for most of the room and unachievable at the top. A student who follows the printed number over-spends by ~$200,000–$400,000 a season. | observed | **BLOCKING** |
| **FL-F** | **"The room changed its mind."** REVEAL stage 5 / `reinvestChangeLine` (:1987) compares week-3 mean reinvest against weeks 1–2. Week 3 is structurally different: reinvest in the last week buys Draw that earns nothing in this lesson, so the cash-rational move is 0% for **every** desk (measured: best week-3 share = 0 for all 8 desks probed; reinvesting 40% costs $216,901–$568,155). A flat reading therefore already indicates a large attitude change, and a *fall* is rational play being read as indifference. The instrument confounds insight with backward induction. The dial's last-week text does disclose the endgame honestly (:1389), so this is not a trap — but the board line has no controlling variable. | observed | non-blocking, repair required |
| **FL-G** | **"The visitor is most of the reason people come."** `HOOK_COPY` says "What you no longer own is most of the reason people show up." Measured across probed sessions the visitor block is **38–41%** of door dollars and is the biggest block on only **5–8 of 12** bars. The board copy adapts honestly (`barSummaryFrom` prints the real count and the real percentage), so the room is not misled — but the HOOK sets an expectation the arithmetic does not meet, and DESIGN_C's subtitle ("*most* of what filled your building was somebody else's team") is not true of the shipped constants. | observed | non-blocking |
| **FL-H** | **"The visitor matters more than you do."** `visitorDrawFans` is 1.33–1.34× `ownDrawFans` in every profile. That single undefended constant is what makes the headline block the visitor's. It is not in `SIMPLIFICATIONS`, not defended in the module header, and (I do **not** verify the sports fact — Sports Reality's call) it is the direction real gate data is usually claimed to run the other way. The lesson's headline is a constant choice, not a discovery. | observed (code); real-world magnitude **NOT VERIFIED** | non-blocking, ledger required |
| **FL-I** | **"Clubs cannot lose money."** Correctly ledgered (`SIMPLIFICATIONS[5]`) — except the ledger sentence itself is false in the strong form and the bill never binds (N6). | observed | non-blocking |

FL5 (outcome bias) is **well defended**: `ARGUE_COPY` carries the Luka trade *and* the Flagg lottery in
the same breath and says outcome is not decision quality in both directions. FL7 (money buys wins) is
removed structurally: identical Draw ceiling, verified by harness P9 and by `drawGain`'s ceiling term.
FL8 is said out loud in `PIPES_REVEAL_COPY` and in the ledger. R7 holds — no RNG anywhere, shock
announced before commitment on a deterministically chosen bot club, and `seatDesk` excludes `shockSlot`
so no desk inherits it.

---

## dominant-strategies

Exhaustive, through the real reducer. 8 desks, focal desk = slot 0 (New York), all other desks fixed at
$50/15%. Full enumeration of weeks 1–2 over the entire legal grid (56 prices × 9 shares)² = **254,016
combinations**, each with an inner 56-price week-3 sweep.

```
BEST CASH  $4,126,480   at  w1 $66/15%   w2 $58/10%   w3 $74/0%
best cash by (share1/share2), top:  15/10 $4,126,480 · 15/15 $4,121,907 · 20/10 $4,109,605
                            worst:   0/40 $3,765,151 ·  0/35 $3,787,109 · 40/40 $3,793,183 · 0/0 $3,794,262
```

**R1 verdicts.**

- **No fixed reinvest rule.** The optimum is strictly interior (15%/10%), and both corners (0/0 and
  40/40) sit at the bottom of the distribution. Always-max costs $333,297; always-zero costs $332,218.
  Confirms `l2-tuning` P1's conclusion by exhaustion rather than by three named policies.
- **No fixed price.** The cash-best price moves every week for every desk because it tracks the visiting
  club's Draw. 12-desk room, argmax price by week: New York 66→56→72, Memphis 46→62→54, Boston 54→72→64,
  Philadelphia 72→56→48, New Orleans 48→42→58. R1(a) satisfied.
- **Best response is not constant across seats or environments.** Best response to a room at 0% is 10%;
  to a room at 10% it is 15%; to a room at 25–40% it is 15%. Small markets buy more Draw per dollar
  (`effortScale` 67,000–76,000 vs 129,000–132,000), so no single share is optimal for a majority.

**Week-3 backward induction (the harness does not test this).** Reinvest in week 3 raises `drawAfter`,
which no week-3 quantity consumes (`localMediaFor` is keyed to the Draw carried *into* the week;
`roadDollars` uses `drawBefore`). Cash-optimal week-3 share = **0 for every desk**, verified for all
eight:

```
New York       best 0%  cost of 40% = $568,155      Memphis        best 0%  cost = $270,586
Golden State   best 0%  cost of 40% = $458,139      Oklahoma City  best 0%  cost = $277,358
Milwaukee      best 0%  cost of 40% = $293,990      Boston         best 0%  cost = $301,702
Indiana        best 0%  cost of 40% = $216,901      L.A. Lakers    best 0%  cost = $516,096
```

**Is it a trap? No — it is disclosed** (`reinvestRuleFor`, :1389: "This is the LAST week. Draw you buy now
brings you no more money in this lesson — it is what your club carries into the next one"), and the
teacher's week-3 note names the discomfort deliberately. **Is it taught? Not on the board.** REVEAL
stage 5 measures exactly this week without controlling for it (FL-F). The endgame is honest at the dial
and unhandled at the projector.

**Free-riding.** Not profitable: 0% is beaten at the same seat by the interior line by $332,218 (8.8% of
final cash). But it is **invisible** on the instrument that claims to show it, and it can read as the
opposite (N1). The economics is right; the evidence surface inverts it.

**Private vs social.** Uniform-share league sweep (8 desks, price $50): league cash peaks at 10%
($28,718,394) against 0% ($26,349,834) and 40% ($25,114,118). Unilateral deviation from a 10% room is
15%. Marginal deviation from 0%: my +$285,834 vs the rest of the league +$265,364 at 15%. The
under-provision wedge is real but small and never resolves against the student — nobody is punished for
investing, which is the right shape for a lesson that hands L3 a problem rather than a grievance.

**Copy-the-neighbour / sweep.** Not available. No preview anywhere (verified in source: no view returns a
payoff for an uncommitted action), no comparative money display while a decision is open, `drawTable`
carries Draw only. R2/R13 hold.

---

## synthesis-map-verdict

Five cards, `synthesisCards` (:2454). Every card is computed from the class's own weeks — the right
architecture, and R16's "class-evidence link names the actual aggregate field" is satisfied in form.

| card | locked at time? | delete-it-and-numbers-change | verdict |
|---|---|---|---|
| `shared-product` | Yes — reads `homeRevenueDecomposition` and `visitorLedger` after the weeks are in the books | Delete `visitorDrawFans`: every home night returns the same number regardless of visitor; the printed % goes to 0 | **PASS**. The percentage it prints (38–41%) is the room's own arithmetic and the card does not overclaim. |
| `spillover` | Yes | Delete the cross-desk term: `roadDollars`/`gave` become 0 | **FAIL.** The claim ("most … did not land on your books") is false on totals (52/48 the other way), and the named evidence measures startDraw, not spending (N1/N3). |
| `composition` | Yes — reads `pipes` | Delete `NATIONAL`: every printed percentage moves | **PASS.** Percentages verified in-band (national 28.4–59.5%, gate 18.2–28.6%). Carries the FL8 antidote. |
| `market-size` | Yes — reads `smallMarketPath`, and says so honestly when the room produced no pair | Delete the profile spread: the pair vanishes | **FAIL on the causal sentence.** "It won it on WHO WAS VISITING" is asserted without controlling for price and is demonstrably false in reachable rooms (FL-A). The card is otherwise the right shape. |
| `beyond` | Yes | n/a — bridge card, cap figures are Sports Reality's | **PASS**, contingent on `gate-l2-sr`. |

**The chain.** Experienced moment → class evidence → real sports → formal term → beyond sports is
complete and each link names a computable field: the Handed-To-You bar (`homeRevenueDecomposition`), the
visitor ledger (`visitorLedger`), the pipes (`pipes`), the small-market pair (`smallMarketPath`), the
room's own reinvest series (`meanShareByWeek`). `BEYOND_SPORTS_LINE` is four correct externality
analogies. **EXTERNALITY and SPILLOVER are earned at SYNTHESIS and withheld before it** — verified in the
teacher script's `dontExplainYet` at every earlier phase. That discipline is intact.

**Where the map is not yet true:** two of five cards state a cause or a magnitude the model does not
produce, and both are the cards carrying the module's two named concepts (spillover, market size). A
synthesis card that names a real desk and misattributes what that desk did is worse than no card.

**Simplifications ledger.** Nine entries, on the teacher surface, each with `what`/`why`/`risk` — the
right structure and better than any predecessor in this repo. Three defects: two entries are false as
written (N6), and the single most load-bearing constant choice in the lesson (`visitorDrawFans` >
`ownDrawFans`, FL-H) is absent from it.

---

## required-repairs

### BLOCKING — economic-truth. The lesson does not pass this gate until each is discharged.

- **B1 (N1, FL-C).** The give/take instrument must measure what its question asks, or the question and
  the script must change. Either add a column that isolates Draw *bought this lesson* from Draw *dealt*
  (`drawStart` is already on the row; the reinvest-attributable lift is computable by re-running
  `roadDollars` at the club's `startDraw`), or restate the board, the ADAPT Q3 answer and the `spillover`
  card so they claim only what `gave`/`received` supports: *dollars your club's drawing power put in
  other buildings, most of which you started with.* Discharge: a property test asserting that no surface
  or script attributes `gave` to a desk's spending, plus the corr(gave, meanShare) figure recorded.
- **B2 (N1.3).** Harness P3's "visible" limb is confounded and must be re-specified — the pattern it
  asserts reproduces at zero reinvest for every desk. `l2-tuning`'s 11/11 does not certify free-rider
  visibility today.
- **B3 (FL-A).** `smallMarketPathFrom` must control for price before printing a cause: require the two
  compared weeks to be within one or two price steps, or drop the causal clause and print both prices
  beside both door figures. This is on the projector and in a synthesis card.
- **B4 (FL-E).** `reinvestRuleFor`'s "about a fifth of your door money keeps your Draw where it is" is
  false across the reachable range and is on a student surface. Either make it true (retune
  `effortScale`/`DRAW_DECAY`) or state the rule the model actually implements. Discharge: a property test
  asserting the printed break-even share matches the computed one at every reachable Draw, or that no
  numeric break-even is printed.
- **B5 (N5, FL-D).** `OBJECTIVE_COPY`'s "You cannot turn Draw back into cash" is false and is on both the
  student and board surfaces. Rewrite to the true statement (Draw pays you back slowly, through your
  local money and your own gate, and pays other buildings at the same time). The two-book structure
  survives the correction — the frontier is real ($25,912/Draw point).
- **B6 (N3).** `spillover` card: replace "most" with the measured share, or state the marginal version.

### NON-BLOCKING — required repairs, recorded.

- **R-a (FL-B).** `ADAPT_QUESTIONS[1]` and its scripted answer over-attribute the visitor block to
  classmates' decisions. At most 30% of that block is anything the room did. Reframe as "who was dealt
  the club that made your best week, and what could they have done to make it bigger?"
- **R-b (FL-F).** REVEAL stage 5 must carry its controlling variable: week 3 is the last week, the dial
  pays nothing in-lesson, and a rational room lowers it. Print that beside the before/after numbers.
- **R-c (N6).** Correct `SIMPLIFICATIONS[5]` ("at any legal price, from any state" — false; reachable
  weekly nets of −$12,000 to −$60,000) and the same overstatement in the module header at :132. Correct
  or qualify `SIMPLIFICATIONS[7]`'s "within 3x" to match the harness's own band definition.
- **R-d (N6).** Add a ledger entry: the weekly bill never binds; CASH in this lesson is a score, not a
  solvency constraint. `HOUSE_RULES[4]` implies pressure that does not exist.
- **R-e (N7).** Add a ledger entry for the attribution ordering: the three blocks are exact and
  non-negative but not unique, they are computed host-Draw-first, and on a sold-out night that credits the
  visitor with the residual only. Consider a symmetric split on clamped nights; at minimum disclose it,
  and stop presenting "residual 0" as if it settled attribution.
- **R-f (FL-H).** Add a ledger entry for `visitorDrawFans` ≈ 1.33 × `ownDrawFans`. It is the constant that
  produces the lesson's headline and it is currently undefended. Its real-world direction is Sports
  Reality's to verify — **NOT VERIFIED by me.**
- **R-g (N4).** Ledger the local-media Draw term as the dominant private return on the reinvest dial
  (92% of the decision), so the debrief does not tell students the dial is mostly a gift.
- **R-h (FL-G).** `HOOK_COPY`'s "most of the reason people show up" is not true of the shipped constants
  (38–41%, biggest block on 5–8 of 12 bars). The board copy is already honest; align the HOOK to it.

### Overall

**SOUND WITH REQUIRED REPAIRS.**

The model underneath is the strongest economics in this repo: a genuine positive externality worth
24–48% of the value a desk creates, an interior reinvest optimum with no dominant line under exhaustive
search, a price optimum that moves every week for every seat, an exact and non-negative decomposition,
no RNG, no unwinnable seat, no preview, no leaderboard, and FL5/FL7/FL8 defended in the deal rather than
in the debrief. BC-5's arithmetic limb is discharged.

It fails this gate on its **evidence surfaces and its stated rules**, not on its mechanism: the board and
the synthesis cards attribute to student decisions what the deal produced, and four printed rule
statements — two of them on student screens — are false of the model they describe. Every blocking item
is a copy, selector or instrument repair, none requires re-architecting the model, and B1/B3 are the two
that matter most because they hand L3 an inverted picture of who the payers in this room are.

### Dissent recorded

I record formal dissent against any decision to advance L2 to a classroom rung, or to build L3 on this
lesson's output, while **B1** and **B3** stand. L3's entire premise is that the room legislates a problem
it has just lived. If the room's evidence board names the desk that spent nothing as the biggest giver
and the desk that spent the maximum as a taker, and if the projector tells the room a price gap was a
market-size result, then L3 will be arguing about a distribution the room never actually produced. A
decision to proceed does not erase this dissent.

---

## RE-CHECK AFTER L2 REPAIR

Boss run `m2-quality-war`, assignment `recheck-l2-econ`. Owning-critic confirm-or-refute of dissent
`econ-l2-evidence-surfaces` against the consolidated repair (`repair-l2-round1`). Same critic, fresh
probes, current tree.

**Evidence status.**

- **Observed (computation, this session):** `npm run build --prefix runtime` (exit 0);
  `npm test --prefix runtime` → **397/397 pass**, matching `l2-tests-r1`; `l2-tuning` harness re-run
  against current dist → **exit 0, 11/11**. Ten fresh probe scripts driving the compiled
  `runtime/dist/modules/hostTheLeague.js` through the real reducer (`takeSeat` → `setPrice`/`setShare`
  → `lock` → `teacher:closeWeek`): 12-desk correlation rooms, a 200-room random price/share sweep, a
  200-room *plausible* sweep (prices within ±$20 of house price), a 40-room small-market price-control
  sweep, a full break-even audit over all four profiles × Draw 20–100, an 8-desk × 9-share week-3
  backward-induction sweep, and two source-level mutants of `baselineDrawPathFor` run against a
  sandboxed copy of the harness.
- **Not verified by me:** any real-world sports fact (`gate-l2-sr`); any gameplay, projector, visual or
  teacher-transfer rating; anything about how this plays in a room. No browser session. Boss evidence
  ids referenced: `gate-l2-econ`, `l2-tuning`, `l2-tests-r1`, `l2-e2e-r1`, `sel-econ-review`.
- Two `dist/server/index.js` processes were left running by an earlier assignment; both killed.

### Claim-by-claim

**C1 — by-choice instrument feeds board / SPILLOVER / ADAPT Q3 / student card / P3.
CONFIRMED (instrument), with a NEW BLOCKING defect in the aggregate it publishes.**

Correlation attack re-run on the identical room from N1 (12 desks, $50 for all, six at 0%, six at 40%):

```
                corr with startDraw     corr with meanShare
dealt   gave         0.959                   0.644      <- the old, confounded instrument
gaveByChoice         0.175                   0.918      <- the shipped instrument
netByChoice         -0.309                  -0.854
spend                0.399                   0.955
```

The corrected instrument tracks the decision, not the deal. **The old inversion is gone:** every $0
spender now shows `gaveByChoice` $0 (Desk 11 New Orleans, startDraw 72, spend $0 → gave-by-choice $0,
against $1,523,568 on the dealt ledger), and the room's biggest giver is Desk 12 · Chicago —
startDraw 28, spend $1,112,561, gave-by-choice $404,248. **The room's biggest giver can no longer be a
$0 spender: CONFIRMED.** In an all-zero 12-desk room every by-choice figure is exactly 0 while the
dealt ledger still spreads $1,838,864, and `giveAndTakeSummary` says so out loud. N1 and FL-C are
discharged as to the instrument. Board (`board/main.ts:1417-1428`), student card
(`play/main.ts:2945-2949`), `spillover`, `adaptSpendAnswer` and harness P3 all read the by-choice
fields. Sign audit over 200 random rooms: no negative `gaveByChoice`, no negative `receivedByChoice`,
no zero-spend desk with a non-zero by-choice figure.

**N9 — NEW, BLOCKING. `choiceTotals.externalPct` is degenerate, and it prints on the SPILLOVER card,
the reveal-2 caption and the ADAPT Q3 answer key.** (observed)

`externalPct = created > 0 ? round(gaveByChoice / created * 100) : 0` where
`created = ownGain + gaveByChoice` (module :1223–1229). `ownGain` is the sum of per-desk private
partials and goes negative in any room that over-invests. Measured, real reducer, 12 desks:

```
room                       ownGain        gaveByChoice   externalPct PRINTED
all 10% @ $50           +$2,009,355        $2,250,116        53%     ok
all 15% @ $50           +$1,597,258        $2,774,784        63%     ok
all 20% @ $50             +$644,340        $3,052,688        83%     ok
all 25% @ $50             -$516,816        $3,247,296       119%     <- over 100%
alternating 0%/40%      -$2,944,850        $1,577,412         0%     <- zero, with $1.58M given
all 40% @ $50           -$4,474,764        $3,617,232         0%     <- zero, with $3.62M given
one desk 40%, rest 0%     -$501,426          $348,412         0%     <- the free-rider demo room
```

`externalPct > 100%` in **58 of 200** random rooms. The 0% branch fires in the three most likely
teacher-set-piece rooms in the lesson, including the one-spender-versus-eleven-free-riders room. The
shipped card in the alternating room reads:

> "Putting money back into your club paid YOU and it paid the buildings you visited. Across this room,
> reinvesting was worth **-$2,944,850** to the desks' own books and put $1,577,412 on other clubs'
> books — **0% of the value it created landed somewhere the desk that paid for it never sees.**"

Three defects in one sentence: "paid YOU" against a negative figure; a printed 0% beside a printed
$1,577,412 that contradicts it; and the module's own named concept quantified at zero in the room that
demonstrates it best. This is N3 in a new form — the repair replaced a false quantifier ("most") with a
computed number that is false or incoherent across a large, reachable and pedagogically likely part of
the space. The same string is on the projector caption and in the teacher's ADAPT Q3 answer key.

**N10 — NEW, BLOCKING. The aggregate sentence reverses sign against the joint effect it appears to
describe.** (observed)

`ownGain` totals are a sum of one-desk-at-a-time partials. Compared with the joint quantity a room
would take the sentence to mean — this room's cash against the same room where nobody reinvested,
same prices, same schedule:

```
room               sum of partials (PRINTED)     joint effect (actual - nobody-spends)
all 10% @ $50            +$2,009,355                    +$3,865,331
all 20% @ $50              +$644,340                    +$3,208,920
mixed 0-40% @ $50        -$1,153,068                      +$546,124   <- SIGN REVERSAL
all 40% @ $50            -$4,474,764                    -$1,345,012
all 15% @ $30            +$1,040,789                    +$2,377,233
```

In the mixed room the board and the SPILLOVER card tell a class that reinvesting cost them $1.15M when
the room is $546,124 better off for having done it — the residue is `receivedByChoice`, which the split
charges to the payer's external column and never returns to the room's own books. The per-desk partial
is the right instrument and I do not dispute it; the *room-total* sentence built on a sum of partials
teaches "investing destroyed value" where the true lesson is "investing created value that landed on
other people's books." Decomposition check: `sum(ownGain) + sum(receivedByChoice)` tracks the joint
figure to within 0.2–13%, so the fix is a sentence, not a model change.

**C2 — the $110-vs-$30 case: does the printed driver now name price? REFUTED.**

Both prices are now printed on the exhibit — that half is CONFIRMED (`smallMarketPathFrom` :1379,
board `main.ts:1456`). The causal sentence is not repaired. Replayed the exact adversarial room from
FL-A (12 desks, odd desks $110, even desks $30, all 0%):

```
PRINTED: "Desk 2 · Memphis ... priced at $30, that building took $612,612 ... Desk 3 · Golden State
... priced at $110, it took $31,944. The small market won that week by $580,668, and the three blocks
say why: $236,184 of that gap is the visiting club. WHO WAS VISITING carried it."

driver = "visitor"    (Memphis hostDraw 58 / visitor 67; Golden State hostDraw 26 / visitor 34)

Same two nights, price held constant:
  both at $30 : Memphis $612,612  vs  Golden State $669,864   -> the SMALL MARKET LOSES by $57,252
  both at $50 : Memphis $724,532  vs  Golden State $699,984   -> small wins by $24,548
  both at $110: Memphis $364,292  vs  Golden State  $31,944   -> small wins by $332,348
```

At the small market's own price the result **reverses**. The board still asserts "WHO WAS VISITING
carried it" over an $80 price gap, which is R9 failing on the projector and in a synthesis card — the
identical finding, in the identical room. Splitting the gap by the three blocks does not control for
price, because price moves all three blocks: Golden State's BUILDING-AND-PRICE block is $0 at $110 and
$422,760 at $30. The `gapFromBuildingAndPrice` figure is measured at each side's own price and
therefore cannot carry the price effect.

Sweep of 40 rooms (10 price patterns × 4 share patterns), price-controlling the printed pair at each
side's own price:

- **driver = "visitor" in 40 of 40 rooms.** The `building-and-price` and `own-draw` branches never
  fired in any probed room. `smallMarketPathFrom` searches every small×big×week pair and *prefers* a
  visitor-driven one (`bestVisitorDriven ?? bestAny`, :1362–1365) — selection on the conclusion across
  a large candidate set, so a confirming pair is essentially always available. The "name the real
  driver" repair is effectively unreachable.
- **7 of 40 printed pairs fail the price control** (the small market's win does not survive at both
  sides' prices). Worst: `random2/0%` — "Desk 5 · Milwaukee won by $195,668 … WHO WAS VISITING carried
  it" ($60 vs New York's $100), where the small market **loses at both common prices**: -$212,172 at
  $60 and -$169,932 at $100. The entire "win" is the price gap.
- **23 of 40 rooms print a visitor block larger than the whole gap.** Worst: gap $300,564, printed
  "$660,464 of that gap is the visiting club" (220%), with `bare` $0 and `own` -$359,900 computed and
  never rendered. Board stage 4 renders `path.line` only (`board/main.ts:1457`), so a class cannot
  reconcile the arithmetic it is shown.

**B3 stands. NOT DISCHARGED.**

**C3 — audit of every rewritten rule against the model.**

| rule | verdict |
|---|---|
| `reinvestRuleFor` (B4/FL-E) | **CONFIRMED.** No numeric break-even is printed. The shape printed *is* the model: break-even share is non-decreasing in Draw on all four profiles (5% at Draw 20–60, 10% at 65–75, 15% at 80, 25% at 85), break-even **dollars** non-decreasing too ($17,752 → $306,360), and no legal share holds a Draw from **90** upward (`DRAW_GAIN_MAX` term = 3.40 < `DRAW_DECAY` 4 at unlimited spend) — "near the top of the scale" is accurate against `DRAW_MAX` 100. Profile-independent as the comment claims. No curve leaked (R2 intact). |
| `OBJECTIVE_COPY` (B5/FL-D/N5) | **CONFIRMED.** The false "You cannot turn Draw back into cash" is gone; the replacement ("pays you back … through your local media money and your own gate, a week late — and it pays the buildings you visit at the same time") is true of `localMediaFor`, `ownDrawFans` and `visitorDrawFans`, and the two-book structure survives. |
| `reinvestChangeLine` week-3 horizon (R-b/FL-F) | **CONFIRMED.** The horizon paragraph is emitted on **every** branch (level / up / down / week-3-unplayed / single-week), verified by execution, and `barReleasedAtWeek` is a real controlling variable. The underlying claim is true of the model: re-measured, cash-optimal week-3 share is **0% for all 8 desks**, cost of 40% $210,651–$508,776. `REVEAL_STAGES[4].say` teaches it and explicitly refuses to resolve the two causes. |
| `giveAndTakeSummary` (N1) | CONFIRMED as to the instrument; carries the N9/N10 aggregate defects. |
| `HOOK_COPY` "most of the reason people show up" (R-h) | **NOT REPAIRED.** Unchanged. |
| `SIMPLIFICATIONS[5]` "always clearable, at any legal price, from any state" (R-c) | **NOT REPAIRED, still false.** Reachable counterexample re-measured: 12 desks, all $120, all 0% → Chicago week 3 net **-$60,000**. |
| `SIMPLIFICATIONS[7]` "within 3x" (R-c) | **NOT REPAIRED.** Unchanged. |
| ledger entries R-d (bill never binds), R-e (attribution order-dependence), R-f (`visitorDrawFans` ≈ 1.33×`ownDrawFans`), R-g (local-media annuity drives ~92% of the dial) | **NOT ADDED.** `SIMPLIFICATIONS` is still nine entries, unchanged. |

**C4 — is the by-choice counterfactual itself honest? PARTIALLY CONFIRMED.**

The construction is sound: the never-reinvested path with schedule, prices and every other club's Draw
held at actual is a clean partial derivative, week 1 is identical under both paths by construction, and
the three carve-outs (stock weeks, bot clubs, the pinned shock club) are the right ones — pretending a
spending path could have dodged an exogenous announced shock would invent a decision nobody had (R7).
No misleading **per-desk** sign was found in 200 random rooms.

Two honesty gaps:

- **Ceteris-paribus is disclosed on the private surface only.** The student card says it
  (`play/main.ts:2949`: "Same schedule, same prices, same everything — except you put nothing back").
  The projector caption, the SPILLOVER card and the ADAPT Q3 answer key say nothing about holding
  other desks' prices and Draws fixed. The formalization card is the one surface where the assumption
  must be visible. **Non-blocking, required.**
- **The three carve-outs are an unrecorded simplification.** They exist only in a source comment
  (module :1041–1059). Per CLAUDE.md §3 a modelling choice this load-bearing belongs in
  `SIMPLIFICATIONS` with its misconception risk. **Non-blocking, required.**
- Minor: 83 desk-instances across 200 *random* rooms spend > $0 and show `gaveByChoice` $0 (worst:
  L.A. Lakers, spend $1,124,826, empty gave bar) — sell-out clamping or a road host at a price where
  nobody comes. In 200 **plausible** rooms (prices within ±$20 of house price) this occurs **0 times in
  2,120 spender-desks**, so it is an extreme-price artefact. **Non-blocking, name it.**

**C5 — does P3 actually bite? CONFIRMED.**

Harness re-run against current dist: exit 0, 11/11. Two source-level mutants of `baselineDrawPathFor`,
applied to a sandboxed copy of dist and run through a sandboxed copy of the harness:

```
M1  counterfactual spend := actual spend (by-choice collapses to 0)
    -> P3 FAIL: feeder spent $844,418, gaveByChoice $0.       harness exit 1
M2  baseline path pinned to a fixed floor (Draw 10) — the old dealt confound reintroduced
    -> P3 FAIL on the CONTROL limb: "by-choice instrument silent = false";
       banker spent $0 but shows gaveByChoice $836,468.       harness exit 1
```

The control limb catches exactly the confound B2 named. **B2 DISCHARGED.**

### Disposition of the original blocking set

| id | status |
|---|---|
| B1 (give/take instrument measures the deal) | **DISCHARGED** — corr with meanShare 0.918 vs 0.175 with startDraw; $0 spenders read $0 |
| B2 (harness P3 confounded) | **DISCHARGED** — mutation-tested, control limb bites |
| B3 (small-market cause asserted without price control) | **NOT DISCHARGED** — reverses under price control in the same room; driver="visitor" 40/40 |
| B4 (false break-even on a student screen) | **DISCHARGED** |
| B5 (`OBJECTIVE_COPY`) | **DISCHARGED** |
| B6 ("most" quantifier on the SPILLOVER card) | **NOT DISCHARGED** — replaced by `externalPct`, which prints 0% or >100% (N9) |
| R-a (ADAPT Q1 over-attribution) | DISCHARGED — answer key now carries the 19–30% proportion |
| R-b (reveal 5 horizon) | DISCHARGED |
| R-c, R-d, R-e, R-f, R-g, R-h | **NOT REPAIRED** |

### required-repairs (this round)

**BLOCKING — economic-truth.**

- **B7 (N9).** `externalPct` must not print when `created <= 0`, and must not print above 100%. State
  the two dollar figures and let the split be read, or branch to an honest over-investment sentence
  ("this room spent $6.58M and $1.58M of it landed on other people's books, while the room's own books
  are $2.94M worse — that is over-investment plus spillover, and both are real"). Also fix "paid YOU"
  against a negative `ownGain`. Discharge: a property test asserting no printed percentage exceeds 100
  and none is 0 while `gaveByChoice > 0`.
- **B8 (N10).** The room-total sentence must not read as a joint effect. Either label it as a sum of
  per-desk private returns, or publish the joint figure beside it. Discharge: a test asserting the
  printed total does not disagree in **sign** with `cash(actual) - cash(nobody-spends)` at the same
  prices.
- **B3 (unchanged).** Either require the compared pair to be within one or two price steps, or drop
  "WHO WAS VISITING carried it" and print all three block figures beside both door figures on the
  projector. A block larger than the gap it explains must never print alone.

**NON-BLOCKING — required, recorded.**

- Disclose the ceteris-paribus assumption on the SPILLOVER card and the reveal-2 caption, not only on
  the student device.
- Add the by-choice carve-outs (stock weeks, bot clubs, pinned shock club) to `SIMPLIFICATIONS`.
- R-c, R-d, R-e, R-f, R-g, R-h remain open and unaddressed.

### Overall

The **mechanism** re-confirms: no dominant line, interior optimum, real externality, exact
decomposition, no RNG, no unwinnable seat, 397/397, 11/11. The instrument repair is genuine and well
made — B1, B2, B4, B5 are properly discharged and the mutation test shows the harness now defends
them. The lesson still fails this gate on the two surfaces that carry its two named concepts: the
SPILLOVER card's quantifier is false or incoherent in reachable rooms (a new form of the same defect),
and the MARKET SIZE claim still asserts a cause that reverses under price control in the exact room the
original gate probed.

### Dissent

**DISSENT econ-l2-evidence-surfaces: NOT DISCHARGED.**

I maintain formal dissent against advancing L2 to a classroom rung or building L3 on this lesson's
output while **B3**, **B7** and **B8** stand. B1 no longer supports the dissent; B3 does, unchanged,
and B6 has been replaced by a worse defect — a synthesis card that prints "0% of the value it created
landed somewhere the desk that paid for it never sees" in the same paragraph as $1,577,412 that did
exactly that. L3 opens on the room's belief about who paid whom. A decision to proceed does not erase
this dissent.
