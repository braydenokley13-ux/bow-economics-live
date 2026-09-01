# M2 L1 "Full House" — Economic Truth gate (built lesson)

Economic Truth Critic · Boss run `m2-quality-war` · assignment `gate-l1-econ` · 2026-08-31.
Fresh context. I built none of this: not the module, not its tests, not `l1-tuning-harness.mjs`.
I received the artifacts before any builder self-evaluation.

**Evidence basis.**

- **Observed (source):** `runtime/src/modules/fullHouse.ts` (all 1,527 lines),
  `runtime/src/test/fullHouse.test.ts`, `runtime/src/client/{play,board,teach}/main.ts` (M2 L1
  branches), `runtime/src/server/http.ts`, `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`,
  `ARCHITECTURE_SELECTION.md` (BC-1..BC-7), `ECONOMIC_CONTRACT.md` (R1–R16),
  `DESIGN_C_FIRSTPRINCIPLES.md` (L1 + the R11 ledger), `SELECTION_ECON_REVIEW.md`
  (`sel-econ-review`), `SELECTION_SR_REVIEW.md` C-2/C-3 (`sel-sr-review`),
  `docs/ECONOMICS_CONCEPT_MAP.md`, `docs/TRACK_101_MAP.md`.
- **Observed (computation, run by me this session against the built module):**
  `npm run build --prefix runtime` (clean); `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`
  → **11/11 PASS**, worst R6 ratio 1.38x at memphis N2, Memphis 100% fill on N2/N4 — I reproduce
  `l1-bc2-harness-pass` and do not dispute it. Then six disposable probe scripts of my own,
  importing `runtime/dist/modules/fullHouse.js` so no constant is re-declared: full-dial × full-card
  × reachable-renewals × carry sweeps, exhaustive 2^5 spend schedules, Pareto sets on both books,
  policy-vs-policy season simulations, and a full four-desk session driven through the real reducer
  to SYNTHESIS. Every number tagged **[computed]** below came from those runs.
- **Observed (served app):** a real server booted on `PORT=4312` from `dist/server/index.js`, two
  seats joined over `/api/sessions/:code/join`, dials moved via `/api/sessions/:code/actions`, and
  the raw JSON of `/api/me`, `/api/sessions/:code/board` and `/api/sessions/:code/teacher` inspected
  mid-PLAY. Server killed; snapshot written to scratch, not to the repo.
- **Not read, to preserve independence:** `gate-l1-sr` (the Sports Reality gate for this same
  lesson), `l1-e2e-browser`, `readme-l1`, `play-review`.
- **NOT VERIFIED by me:** every real-world sports fact in `SOURCE_NOTES` (Sports Reality's lane);
  anything about how this feels in a room; the Playwright E2E claim (`l1-e2e-pass`) — I did not run
  a browser.
- **Required context that does not exist:** a **recorded simplifications ledger for the built
  lesson**. `DESIGN_C_FIRSTPRINCIPLES.md` has one; the product carries only `BOARD_HONESTY_LINE`,
  `HORIZON_LINE` and `SOURCE_NOTES`, and `docs/ECONOMICS_CONCEPT_MAP.md` still describes the killed
  Box Office lesson as M2's content with no entry for Full House. Stated as **NOT VERIFIED /
  ABSENT**, not inferred as fine.

Closed forms used throughout (`q = clamp(base − sens·p, 0, seatsOpen)`, per-fan in-arena `a`):
ticket-revenue argmax `base/(2·sens)`; total-revenue argmax `base/(2·sens) − a/2`; the gap between
them is exactly `a/2`, which is what Two Peaks measures.

---

## mechanism-verdicts

### Highest-severity finding first

**The RENEWALS tent is one-sided over the legal dial. Its low arm is unreachable, a house rule shown
to every student states behaviour the model never executes, and R4 is therefore satisfied on its
letter and defeated on its purpose — FL3 by construction, the same defect `sel-econ-review` ruled
blocking for Candidate A's L1.**

`renewalDelta` (fullHouse.ts:393) is `clamp(round(6 − 0.6·|p − planPrice| + spend/eventRenewalDollars), −20, +12)`.
It is a tent in `|p − planPrice|`. But `PRICE_MIN` is $10 and the plan prices are $24 (New York) and
$16 (Memphis), so the dial cannot travel far enough *below* the plan price for the low arm to bite.
**[computed]**, spend 0:

| market | plan | Δ at the $10 floor | Δ at plan | Δ at $120 | grid points below plan | worst Δ below plan | worst Δ above plan |
|---|---|---|---|---|---|---|---|
| New York | $24 | **−2** | +6 | −20 | 7 of 56 | −2 | −20 (floor first hit at $68) |
| Memphis | $16 | **+2** | +6 | −20 | 3 of 56 | **+2 (never negative)** | −20 (floor first hit at $60) |

`HOUSE_RULES[4]` is on every student's screen: *"Charge far below it and the plan looks like a
waste, so they stop buying it too."* **At Memphis that sentence can never fire — every legal price
below the plan price still *gains* renewals. At New York its entire reachable range is 2 points
against the high arm's 20.** The module docstring (fullHouse.ts:385–391) claims the two-sided shape
"is what keeps this book from collapsing into 'cheap is always kind' (the FL3 failure mode)." At the
shipped constants the book has collapsed exactly that way. Observed in a real session: my Desk 4
held the $12 floor at Memphis for five nights and finished at **70 renewals**, twenty points *above*
where it started.

The consequence is structural, not cosmetic. **[computed]** over every market × card × renewals
0–100 in steps of 10, the Pareto set on (cash, renewals) is **always exactly the closed interval
[planPrice, cash-argmax]**:

| market · card · renewals | undominated prices | share of the 56-point dial |
|---|---|---|
| new-york N1 r=0 | $24–$28 | 3/56 |
| new-york N1 r=50 | $24–$34 | 6/56 |
| new-york N3 r=50 | $24–$40 | 9/56 |
| new-york N4 r=50 | $24–$90 | 23/56 |
| memphis N1 r=0 | $16–$20 | 3/56 |
| memphis N3 r=50 | $16–$30 | 8/56 |

Every price above the night's cash optimum is **weakly dominated on both books at every reachable
state** (checked exhaustively; zero exceptions). Every price below the plan price is likewise
dominated. On the three quiet cards the entire two-book tradeoff is **3 to 9 prices out of 56** —
85–95% of the dial is strictly dominated. So the model says: erring low is a values choice, erring
high is never a legitimate choice, only a mistake. That is a moral about greed dressed as
arithmetic, and it is the exact finding `sel-econ-review` recorded against A-L1 ("R4 is satisfied on
its letter and defeated on its purpose") arriving through the tent's short arm instead of a monotone
second book. `l1-tuning-harness` P5 and the in-suite R4 test cannot catch it: both compare argmaxes,
neither examines the shape or checks for two-book domination — which is precisely the separate check
`sel-econ-review` ruled must be run ("satisfying per-book regret does not satisfy R6 if one error
direction is weakly dominated on both books").

There is a second, deeper problem with the upper arm's **sign**. In the real business, a premium on a
marquee night is the season plan's selling point: plan holders bought that seat at plan price and
their seat just got more valuable. Undercutting your own plan on a quiet night is the move that kills
renewals. The model has the quiet-night half right and the marquee-night half **backwards** — and it
is load-bearing, because on N4 the cash-correct price ($90 NY / $84 Memphis) drives the renewals move
to its −20 floor. A student who prices the biggest night correctly is told the fans punished them
maximally for it.

### Per-concept, delete-it-and-numbers-change

| concept | deletable term | verdict |
|---|---|---|
| **C1 revenue = price × quantity** | `gate = price × turnout` (fullHouse.ts:365) | **INSTANTIATED.** Committed before measurable; `l1-tuning-harness` P3 and my sweep agree the argmax moves $34/$48/$40/$90 (NY) and $24/$36/$30/$84 (Memphis). |
| **C2 demand shifters** | `drawBase`/`weekendBase`/`tvBase` on `base`, `drawSens`/`weekendSens`/`tvSens` on `sens` | **INSTANTIATED, and correctly.** Both intercept *and* slope are keyed to the card, which is the structural fix `sel-econ-review` said A-L1 lacked. Delete them and all five nights return identical numbers. |
| **C12 loss leader** | `market.ancillary` | **INSTANTIATED at real magnitude.** Two Peaks gap is exactly `a/2` → 3–5 dial steps, not the legacy model's invisible $2.50. |
| **C9 path dependence** | `market.renewalFans` | **INSTANTIATED.** **[computed]** N5 replays N1: a plan-price desk draws +1,440 more fans at New York, a $54 desk draws 2,880 fewer. Attributable from the desk's own renewals column. |
| **C10 invest now, earn later** | `market.eventFans` (next night's base) | **INSTANTIATED in the arithmetic, UNREASONABLE-ABOUT in play.** See the P9 ruling below. |
| **R4 two books** | — | **LETTER PASSES, PURPOSE FAILS.** See above. |

### Ruling on P9 (the night-spend dial): the mechanism is real; the *taught claim* is currently unlearnable

The builder honestly weakened P9 from "spend early" to "WHEN you spend decides whether it pays." I
rule that the weakened claim is **true in the model and a genuine marginal-spend-vs-marginal-return
mechanism — and that it is not teachable as built, because the information it requires is never
shown.**

Why it is real: the return on a dollar of night spend is `eventFans × (tomorrow's price + a)` plus a
renewals term. **[computed]**, at the cash-argmax price path, the season cash change from spending
the maximum on each night:

| market | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|
| New York ($120k dial) | −$11,652 | −$13,464 | **+$57,260** | −$60,340 | −$120,000 |
| Memphis ($60k dial) | +$50,684 | +$23,628 | **+$76,110** | −$27,070 | −$60,000 |

That is not decoration. $120,000 buys 1,200 New York fans; they are worth $66 each if tomorrow is N2
and $108 each if tomorrow is N4. The dial pays only when tomorrow's price is high enough — a clean
marginal-return story, and the exhaustive 2^5 schedule search confirms the optimum is *spend on N3
only* at New York and *N1+N2+N3* at Memphis, i.e. **the two markets give opposite answers to "spend
early?"**, which is a feature (it kills a fixed rule).

Why it is not teachable as built: **the pair is never shown tomorrow's card.** I grepped every view
builder and all three client surfaces — `cardView` is called only on `CARDS[state.nightIndex]`, there
is no forward schedule on `/play`, `/board` or even `/teach`, and `history` only carries settled
nights. The dial's on-screen label reads *"Making it an event — pays off next night"* with no way to
know what the next night is. So the decision the mechanism rewards is a blind bet on unannounced
information, which is R7's target ("every change in demand not caused by the student must be
announced before the decision, and nameable at debrief"), and there is no debrief surface that
attributes it: no aggregate field records spend timing, and the only place the module speaks about it
is a counterfactual note that is itself wrong (below).

**Verdict: not mush, and not decorative — a true mechanism with its information channel missing.**
Repairable in one screen (print the five-night slate, or at minimum tomorrow's day/visitor/TV), and
until then the claim must not be spoken in the debrief.

### Ruling on N4 (the capacity option): a fake decision as shipped, salvageable into a real one

**[computed]** over every reachable state (renewals 0/25/50/75/100 × carry 0/max, both markets), the
best achievable night with the bowl open is **exactly the best achievable night with it closed, minus
the bowl cost** — $95,000 at New York and $42,000 at Memphis, in every single cell, with zero
exceptions:

```
new-york  r=50 carry=0 : closed best $90 -> $1,229,600 | open best $90 -> $1,134,600 | -$95,000
memphis   r=50 carry=0 : closed best $84 -> $1,102,400 | open best $84 -> $1,042,400*  | -$42,000
```

The reason is structural. On N4 demand exceeds the closed building only at **$10–$64** (New York) and
**$10–$60** (Memphis), while the cash optimum sits at **$90** and **$84**. At the optimum the
building is 81% full and **zero** fans are turned away — I observed exactly this in a live session:
Desk 1 priced N4 at $90 *and* bought the bowl, drew 16,980 into 22,200 seats, turned away nobody, and
paid $95,000 for air. So the option is never part of the joint optimum; it is only ever a hedge
against a pricing error the same pair is making at the same moment.

`l1-tuning-harness` P11 does not test this. It compares open-vs-closed **at a fixed price**, which is
the wrong comparison for a simultaneous two-dial decision. P11 passes and the option is still
dominated.

An option that is never optimal *can* be honest design — a tempting trap that teaches opportunity
cost is legitimate, and the real-world version is genuinely instructive (a club that has already sold
its plan holders their seats at a printed price cannot raise it, so it buys capacity instead). But
this build does not treat it as a trap. `SHOCK_REVEAL_COPY` tells the room:

> "Six opposing clubs moved Fever games out of their own buildings and into bigger ones, **for exactly
> the reason some of you just paid to open more seats.**"

That sentence congratulates, with a real-world citation, a decision the model punishes by exactly
$95,000 at every price a well-played desk would choose. It is also not the same decision: the Fever's
hosts moved buildings because their prices were rigid, and price rigidity does not exist in this
model. **Ruling: as shipped, a fake decision with copy that validates it — blocking.** Two honest
exits, both cheap: (a) make it a real conditional decision by giving N4 a price ceiling or a plan-
holder allocation, so capacity is the only instrument left; or (b) keep it dominated, delete the
validating half of the reveal copy, and replace it with the opportunity-cost line the model actually
supports ("you can buy seats or you can price them — the room that priced it did not need the seats").

### Ruling on R6 (the BC-2 repair): DISCHARGED, and it holds outside the harness's window

`l1-tuning-harness` P1 tests offsets of $2–$10 only. I re-tested at **$10, $20, $30, $40** from the
continuous argmax. **[computed]** worst ratio anywhere is **1.53x** (memphis N4 at ±$30, low side
worse) and **1.29x** (new-york N2 at ±$30). The 16.5x New York asymmetry `sel-econ-review` recorded is
gone; the total-revenue optimum now sits clear of the capacity kink on every card. BC-2's R6 limb is
discharged, at a stricter bar than the one it was tested at.

One consequence the build did not follow through: `CAPACITY_DEFENCE_COPY` still says *"Night 4 is the
one night where charging too little hurts more than charging too much... On the other four nights the
two mistakes cost about the same."* **[computed]** at N4, ±$10 and ±$20 the *high* side is worse
(1.02x, 1.01x); the low side only becomes worse at ±$30 (1.53x), and N2 shows the same shape (1.29x
at ±$30). This is leftover defence-in-writing for an asymmetry the retune removed. It is a small
falsehood in teacher-facing copy about the room's own numbers.

### BC-4 (nothing sweepable pre-commit): DISCHARGED on the wire, not only in types

Verified against a running server, not the type system. Seat A's `/api/me` payload mid-PLAY with both
dials moved and the night unlocked is 1,980 bytes and contains: `card`, `price`, `spend`, `openBowl`,
`spendCap`, dial bounds, `books`, `rules`, empty `history`, `market` (capacity, bill, planPrice,
eventMax, bowlSeats, bowlCost) and a message. Checked against the true settlement for that exact
pending action:

```
turnout=14142 on wire: false      gate=480828 on wire: false     inArena=254556 on wire: false
total=735384 on wire: false       net=195384 on wire: false       base=23390 on wire: false
sens=272 on wire: false           seat B's id on A's wire: false
```

`/board` mid-PLAY carried `curves: []`, `settledCards: []`, `lockedCount`, `deskCount` and the card —
no price, no seat id. `/teacher` (bearer-key gated) does carry live pending prices; correct for a
control room, and a note for the Classroom reviewer that a mirrored `/teach` window would leak them.
**No preview exists at any price. R2 and BC-4 are discharged. `econ-boxoffice-unrepaired` finding (1)
is discharged for this lesson.**

### Real-figure economics (magnitudes)

**[computed]** at the cash optimum, per night, spend 0:

| | price | turnout | gate | in-arena | bill | net | margin | fill |
|---|---|---|---|---|---|---|---|---|
| NY N1 | $34 | 14,142 | $480,828 | $254,556 | $520,000 | $215,384 | 29% | 71.4% |
| NY N4 | $90 | 16,200 | $1,458,000 | $291,600 | $520,000 | $1,229,600 | 70% | 81.8% |
| MEM N1 | $24 | 12,060 | $289,440 | $144,720 | $280,000 | $154,160 | 36% | 67.8% |
| MEM N4 | $84 | 14,400 | $1,209,600 | $172,800 | $280,000 | $1,102,400 | 80% | 80.9% |

Internally consistent: `gate = price × turnout` exactly, `in-arena = a × turnout` exactly, bills scale
sensibly per seat ($26.26 NY vs $15.74 Memphis). **No C-2-style pipe inconsistency exists in L1,
because L1 has no pipes at all** — there is no media, sponsorship or national line anywhere in the
model. Four magnitude items are nonetheless open:

1. **The lesson's title never happens at correct play.** Fill at the cash optimum is 60–82% in both
   markets. A "full house" is only reachable at or near the $10 floor. The board publishes
   `bestFillPct` and `fullHouseNights` as the non-money success metric that discharges BC-2/R8 — and
   in my session Memphis earned 100% fill and **4 sold-out nights** by pricing at $12–$16 while
   banking roughly half the cash. The R8 repair works, but the metric that carries it rewards
   underpricing and nothing on the board says so. That is a third, implicit scoreboard reading
   "cheap = full = good," pointing the same direction as the tent defect.
2. **The board runs a cross-market money comparison.** `MarketBooks.medianCash` is on the REVEAL
   board: observed New York $1,289,252 vs Memphis $749,556. R13's letter holds (no per-desk rank), but
   `DESIGN_C_FIRSTPRINCIPLES.md`'s own R8 discharge says "no cross-market money comparison exists on
   any board surface," and one does.
3. **The shipped source note and the shipped model disagree about what market size means.**
   `SOURCE_NOTES[0]` puts "Grizzlies under $10M vs Lakers about $149M" on the synthesis board — a 15x
   gap — beside the room's own evidence that Memphis banked ~83% of New York's season cash
   (**[computed]** $1,807,186 vs $2,193,736 at card-reading play). The reconciling sentence ("market
   size shows up in media, not at the gate") is true, is the whole point, and appears nowhere; its
   designated home is L2's pipe table, and **L2 does not exist** (`TRACK_101_MAP.md` still lists the
   killed Box Office as M2's build state).
4. **"Real NBA scale" is claimed and not quite met on the price axis.** The dial ceiling is $120 and
   New York's plan price is $24; the Knicks' real average ticket sits above the top of the dial. The
   `SOURCE_NOTES` disclaimer covers dollar figures generically ("a modeled magnitude, not an audited
   club financial") but not the price range, and `DESIGN_C` claims "nothing is scaled down."

`sel-sr-review` **C-3 is unrepaired in the built lesson**: N3's card asserts as fact that national TV
pushes tonight's turnout down ("the whole country can watch it free at home"), which C-3 recorded as
NOT VERIFIED. The model in fact applies **two** national-TV effects — **[computed]** New York
`base −4,620` *and* `sens +45` (Memphis `−5,770` / `+55`) — i.e. a free substitute both shrinks demand
and makes it more price-elastic. The second effect is the better economics and is never named
anywhere. Verification of the sign belongs to `gate-l1-sr`; the undisclosed second channel is mine.

---

## false-lesson-risks

Ordered by damage to a grade 5–6 mental model.

| id | risk | status in the built lesson | basis |
|---|---|---|---|
| **FL3** — *"charging high is greedy and gets punished; charging low is kind"* | **LIVE, structural, worst risk in the lesson.** Every price above the night's cash optimum is dominated on both books at every reachable state; the renewals book's low arm costs at most 2 points at New York and is strictly positive at Memphis. The undominated set is always [plan price, cash argmax], so on the frontier more money always means fewer renewals, one-directionally. | **[computed]**, exhaustive |
| **New: "the real clubs agreed with you"** (outcome/authority bias on a dominated action) | **LIVE.** `SHOCK_REVEAL_COPY` cites six real clubs to validate the N4 capacity purchase, which the model makes strictly dominated by $95,000 / $42,000 at every reachable state. A pair that bought it hears the product tell them they were right; their books say otherwise and nothing reconciles the two. Adjacent to FL5, and worse, because the product supplies the bias rather than merely failing to prevent it. | Observed in copy + **[computed]** |
| **New: "the game's ceiling is a number the game got wrong"** | **LIVE.** The COUNTERFACTUAL card labelled "The most cash the five nights could give" is beatable. See `dominant-strategies`. A strong pair can end the lesson above the stated maximum. | **[computed]** |
| **FL10** — *"there is a right price and good operators find it"* | **DEFUSED.** The argmax moves $34/$48/$40/$90 (NY) and $24/$36/$30/$84 (Memphis) across the four distinct cards, and moves again with the desk's own renewals (NY N1: $28 at r=0, $34 at r=50, $40 at r=100). No fixed price is within one step of the optimum on more than one of four cards. | **[computed]**, `l1-tuning-harness` P3/P10 |
| **FL2** — *"price controls attendance"* | **DEFUSED.** Same price, different card, visibly different crowd; the synthesis "shifters" card reads it off the room's own points (observed: $70 drew 4,350 on Tuesday and 8,660 on Saturday). | Observed in a real session |
| **FL6** — *"small markets have empty buildings"* | **DEFUSED at the fill metric, RE-OPENED at the cash metric.** Memphis reaches 100% fill and 4 sold-out nights (BC-2/R8 discharged); but the REVEAL board also shows New York's median cash 1.7x Memphis's, and no line explains that the gap is media, not gate. | Observed |
| **FL1** — *"a franchise's goal is to make the most revenue"* | **PARTLY DEFUSED.** Two genuinely non-summable books exist and are never added. But the frontier is one-directional (FL3 above), the cash book is where all the skill lives, and every night at correct play returns a 29–80% margin with no payroll anywhere in the model — season-equivalent net of roughly $17.5M for New York on gate plus concessions alone. Nothing in the product ledgers "this is the building's night, not the club's year." | **[computed]** + absent ledger |
| **FL8** — *"TV money is free money"* | **NOT APPLICABLE in L1** (no media pipe). Ledger obligation transfers to L2, unbuilt. | Observed |
| **FL5** — *outcome bias on history* | **DEFUSED for the pricing decisions.** No matching score anywhere; the counterfactual states its own limit ("we cannot show you what you would have done"). Broken only by the N4 reveal line above. | Observed |
| **FL7** — *money buys wins* | **NO SURFACE.** L1 has no money→quality conversion. | Observed |

---

## dominant-strategies

**Headline: there is no dominant fixed line, and reading the card is worth 32–50% of the cash book.
That specific claim of the lesson survives my attack.** The exploits I did find are on the other
dials and in the debrief, not on the price dial.

### 1. Fixed-price lines vs card-reading (full 56-point dial, five nights, spend 0) — **[computed]**

| market | policy | season cash | renewals |
|---|---|---|---|
| New York | do nothing (auto-commit at the $24 plan price) | $1,291,132 | 80 |
| | best possible fixed price ($38) | $1,656,560 | 40 |
| | card-reading (per-night cash argmax) | **$2,193,736** | 22 |
| Memphis | do nothing (auto-commit at the $16 plan price) | $875,672 | 80 |
| | best possible fixed price ($30) | $1,203,748 | 40 |
| | card-reading (per-night cash argmax) | **$1,807,186** | 25 |

**Cost of ignoring the information, quantified:**
- vs the *best possible* fixed price — which itself requires knowing all five cards in advance and is
  therefore not available to an uninformed pair: **$537,176 (32.4%) at New York, $603,438 (50.1%) at
  Memphis.**
- vs doing nothing at all (the auto-commit line a stalled desk gets): **$902,604 (1.70x) at New York,
  $931,514 (2.06x) at Memphis.**

The lesson's claim that reading the night card *is* the skill is **supported**.

### 2. Information-free heuristics a real pair would actually try — **[computed]**, % of card-reading cash

| heuristic | New York | Memphis |
|---|---|---|
| plan price every night ("do nothing") | 59% (ren 80) | 49% (ren 80) |
| repeat last night's price | 59% (ren 80) | 49% (ren 80) |
| plan + $14 every night | 76% (ren 40) | 67% (ren 40) |
| price ≈ plan + 0.6 × Draw | 73% (ren 0) | 62% (ren 0) |
| "raise $10 if we sold out, cut $10 if fill < 70%" | 71% (ren 56) | 53% (ren 68) |

No heuristic is dominant; "plan + $14" is on the Pareto frontier and gives up 24–33% of cash, which
is the right shape (a defensible lazy line that visibly costs money). The naive feedback rule is the
realistic failure mode and it fails loudly: **[computed]**, a Memphis desk running it prices N4 at $16
and turns away **7,466 people**. That is the beat the lesson wants.

### 3. FOUND — "pick the middle" succeeds on the one card the design says it fails on

`DESIGN_C_FIRSTPRINCIPLES.md` calls N3 "the first night where 'just pick the middle' fails visibly."
**[computed]**, the midpoint of the N1 and N2 optima lands **exactly** on the N3 optimum in 5 of 10
reachable renewals states and **within one dial step in all 10**:

```
new-york  r=50 : N1 $34  N2 $48  avg $42  |  N3 optimum $40   (1 step)
new-york  r=75 : N1 $36  N2 $52  avg $44  |  N3 optimum $44   EXACT
memphis   r=25 : N1 $22  N2 $34  avg $28  |  N3 optimum $28   EXACT
memphis   r=50 : N1 $24  N2 $36  avg $30  |  N3 optimum $30   EXACT
memphis   r=75 : N1 $26  N2 $38  avg $32  |  N3 optimum $32   EXACT
```

Not a dominant strategy — it covers one card of four, and N4 defeats it by $50+ — but it is a design
claim falsified by the shipped constants, and it lands on the Two Peaks card, which is the lesson's
signature reveal. Any teacher script that says "the middle fails here" will be contradicted by the
room's own board.

### 4. FOUND — the capacity option is strictly dominated everywhere

Covered under mechanism-verdicts. Exhaustive over reachable states: open-best = closed-best −
bowlCost, in every cell, both markets. `l1-tuning-harness` P11 does not detect it because it holds
price fixed.

### 5. FOUND — the COUNTERFACTUAL board understates its own ceiling and mis-names the reason

`replaysFor` (fullHouse.ts:837) shows students a line labelled **"The most cash the five nights could
give"**, computed as *cash-optimal price every night + maximum spend on N1 and N2*, with the note
*"Best price every night, spend early."* **[computed]** against an exhaustive search over all 32
all-or-nothing spend schedules (and both bowl settings) at the same price policy:

| market | shipped "most cash" card | true maximum found | shortfall | true best spend schedule |
|---|---|---|---|---|
| New York | $2,187,524 | **$2,250,996** | **$63,472** | N3 only |
| Memphis | $1,882,218 | **$1,960,498** | **$78,280** | N1 + N2 + N3 |

Two separate defects. (a) The card's claimed ceiling is **beatable by a well-played desk**, which will
happen in a room with a strong pair and will cost the product its credibility at exactly the moment
it is asking students to trust a counterfactual. (b) The note *"spend early"* is **false at New York**
— **[computed]** spending the maximum on N1 costs $11,652 and on N2 costs $13,464, while N3 pays
$57,260 — and it is the only place in the whole product that says anything about *when* to spend, so
it directly contradicts the P9 claim the harness certifies.

### 6. NAMED, not cleared — reading the room's own posted curve

After a night settles, `/board` publishes every desk's (price, turnout) in each market. With two
distinct prices in your market, `base` and `sens` for that card are exactly determined. N5 replays
N1's card, so on N5 the only residual unknown is the desk's own renewals drift. Observed on the wire:
`new-york N1 published points: ($34,14142) ($70,4350)` — two points, one line. This is not a defect
(extrapolating a known curve onto a changed card is the job, and it is the reason the board exists),
but `sel-econ-review` asked that it be *named rather than claimed as cleared*, and it is still not
named in any product or teacher copy.

### Cleared

- **No money leaderboard.** No board surface sorts by money; per-desk money never reaches `/board`.
  (Cross-market medians do — see magnitudes item 2.)
- **No live comparison while a decision is open.** Verified on the wire: `curves: []` during PLAY.
- **No RNG.** The reducer is deterministic; every shifter is printed.
- **Fandom advantage.** Draw is a printed 0–100 number; a non-fan prices identically. R12 holds.

---

## synthesis-map-verdict

Judged on the two things I can check from code: **is every number computed from *this* session's
locked-at-time state (D15), and does each named concept pass delete-it-and-numbers-change in the
built lesson?**

**D15 discipline: PASSES, and I verified the hard case.** `SettledNight.hidden` freezes the curve at
lock. `computeAggregate` draws Two Peaks from a real desk's frozen N3 curve, never from today's
state. I confirmed by mutating a desk's current `renewals` to 5 and `cash` to −999 after the fact: the
Two Peaks output was byte-identical. Observed in a live session: the shipped harness reports the N3
peaks as $48/$40 at renewals 50, while my session's real desk (which had drifted to a different
renewals level) produced **$48/$38, gap 5 steps** — different numbers because it is that desk's real
night, which is exactly what D15 asks for. `hidden` never crosses `viewNight`; verified structurally,
by value, and on the wire.

**Two Peaks copy states the true relationship. PASSES.** The gap between the ticket-revenue argmax and
the total-revenue argmax is exactly `a/2` — a fact about complements, not a tuning accident — and the
card says it correctly: *"tickets alone made the most money at $48. Add what those same people spent
inside the building and the best price drops to $38 — $10 lower, 5 clicks."* I checked the underlying
totals: total revenue is $752,304 at $38 against $733,524 at $48, so "the cheaper ticket made more
money" is true as stated. One honesty gap: this line is drawn from the **hidden model curve**, not
from prices the room charged. It is the only place hidden structure is revealed, which is legitimate
under R3 — but `BOARD_HONESTY_LINE` speaks about realism, not about provenance, and nothing tells the
room that this particular curve is the answer key rather than their own points.

**FAILS — the "REVENUE = PRICE × PEOPLE" card pools markets and cards (R9).** It takes the minimum and
maximum price across `agg.curves` with no filter on `marketId` or `cardId`. Observed verbatim from a
real four-desk session:

> "Across 20 priced nights this room charged as little as $12 (16,080 came) and as much as $90 (16,980
> came). Neither number alone is the money. The money is the two of them multiplied — which is why the
> biggest crowd and the biggest night are almost never the same night."

The $12 is a **Memphis N1** price and the $90 is a **New York N4** price: two different buildings, two
different capacities, two different cards. Worse, the card's own numbers refute its own closing
sentence — the *higher* price drew the *bigger* crowd (16,980 > 16,080), which is precisely the
opposite of what a demand curve looks like. This is the synthesis card for the module's headline
concept and it is the one board surface whose job is formalization. `sel-econ-review` R9 named exactly
this failure in the legacy `ScatterPoint`; the aggregate here carries `marketId` and `cardId` (R9's
schema requirement is met) and then this card discards both.

**The "shifters" card is sound in its matched branch, weak in its fallback.** When two desks in one
market charged the same price on N1 and N2 it produces genuine evidence ("Same price, different
crowd" — observed: $70 → 4,350 Tuesday vs 8,660 Saturday). When no price matches, the fallback
compares the best Tuesday crowd at one price to the best Saturday crowd at a *different* price and
then asserts "nothing else moved the crowd." That fallback is a confounded comparison presented as
evidence, and it fires whenever the room's prices do not coincide.

**The "path-dependence," "two-books" and "real-world" cards are computed from session state and
correct.** The N1↔N5 card names desks and quotes their own two turnouts; `two-books` quotes real
per-market best fill and median renewals.

**R16 status: NOT MET.** Three of the chain's links cannot be earned from session state as built:

1. *"Money you spend on the night lands on the next night"* → the class evidence for **when** it pays
   does not exist (no aggregate field records spend timing) and the one line that speaks to it is
   wrong.
2. *"Two books, and the choice between them"* → the class evidence shows a one-directional frontier;
   the honest formalization from these numbers is "high prices cost renewals," not "each book has its
   own best price."
3. *"Gate is how the building makes money"* → the correction that gate is a minority of club revenue
   is deferred to an L2 that does not exist, and there is no R11 ledger in the product to hold it in
   the meantime.

The **beyond-sports** link (`BEYOND_SPORTS_LINE` — Friday flights, Tuesday movie tickets and popcorn,
milk at the back of the shop) is the strongest part of the chain: the popcorn and the milk are exactly
the complement/loss-leader mechanism the model instantiates, at the right level for eleven-year-olds,
and they generalize the mechanism rather than the sports noun.

---

## required-repairs

Each is falsifiable and should be discharged by a committed property test or a named artifact, not by
an assurance. I do not implement fixes.

### BLOCKING (category: economic-truth)

**B1 — Make the RENEWALS book two-sided over the *reachable* dial, or stop claiming it is.**
*Falsifiable discharge (all three):* (i) assert `renewalDelta(market, PRICE_MIN, 0) < 0` for every
market, and that the renewals penalty reachable **below** the plan price is at least one third of the
penalty reachable **above** it; (ii) assert that for at least one card and reachable state there
exists a price **strictly above** that night's cash argmax which is **strictly better on the renewals
book** — i.e. the two-book frontier is not one-directional; (iii) if (ii) cannot be met by tuning,
delete the second sentence of `HOUSE_RULES[4]`, delete the FL3 claim from the module docstring, and
supply the written economic defence R6's escape clause requires plus the debrief line that defuses
"high prices are greedy." The economically true repair, and the one I recommend, is to make the tent
**night-conditional**: a premium above the plan price on a high-Draw night should *raise* renewals
(the plan holder just got a bargain) while undercutting the plan on a quiet night should *lower* them.
That is the real mechanism, it makes N4 a genuine two-book dilemma instead of a one-way street, and it
gives the debrief a sentence worth having.

**B2 — Fix or delete the "most cash the five nights could give" counterfactual.**
*Falsifiable discharge:* assert that no reachable desk policy (price grid × spend schedule × bowl)
produces season cash strictly greater than the number printed on that card, for both markets. As
shipped it is beatable by **$63,472** (New York) and **$78,280** (Memphis). Either compute the true
maximum, or relabel the line honestly ("a strong line: best price every night") and delete the false
note **"spend early"** — spending early loses money at New York.

**B3 — Rule on N4 and make the copy match the model.**
*Falsifiable discharge, option (a):* introduce a constraint that makes capacity the binding instrument
on N4 (an N4 price ceiling, or a plan-holder allocation that cannot be repriced) and then assert that
for at least one reachable state the joint optimum has `openBowl = true`. *Option (b):* accept the
option as a deliberate opportunity-cost trap, assert in the suite that it is dominated at every
reachable state so nobody later mistakes it for a live lever, **and rewrite `SHOCK_REVEAL_COPY`** to
remove "for exactly the reason some of you just paid to open more seats" — the product may not cite
six real clubs to validate a decision its own model punishes by $95,000. Either way, replace
`l1-tuning-harness` P11, which tests the wrong comparison.

**B4 — Give the night-spend dial the information its mechanism requires, or stop teaching the claim.**
*Falsifiable discharge:* print the five-night slate (or at minimum tomorrow's day, visitor Draw and TV)
on `/play` and `/board` before the first commitment, and add an aggregate field recording spend timing
and its realized next-night return so the debrief can attribute it. Assert that the pre-commit view
carries tomorrow's card facts and still carries no outcome (the BC-4 leak test must stay green). Until
then, P9's claim ("WHEN you spend decides whether it pays") must not appear in the teacher script.

**B5 — The "REVENUE = PRICE × PEOPLE" synthesis card must not pool markets or cards.**
*Falsifiable discharge:* assert that the low and high price quoted on that card share a `marketId`
**and** a `cardId`, and that the quoted turnouts move in the opposite direction to the quoted prices.
Observed failure: "$12 (16,080 came) ... $90 (16,980 came)" across two markets and two cards, with the
higher price drawing the bigger crowd.

### NON-BLOCKING (required before the wave closes)

**N1 — Record the built lesson's simplifications (R11).** The product carries none. Minimum entries,
each with its misconception and its defusing line: gate as a minority of club revenue (and that its
designated correction lives in an unbuilt L2); costs lumped into one nightly bill with no payroll;
linear demand with a capacity kink; the renewals tent as a *modeled* behaviour, not a measured one;
revenue ≠ profit; the horizon compression (already in `HORIZON_LINE`); and the price dial's ceiling
sitting below the real club's average ticket.

**N2 — Update `docs/ECONOMICS_CONCEPT_MAP.md` and `docs/TRACK_101_MAP.md`.** Both still describe the
killed Box Office lesson as M2's content. R10 requires an instantiation pointer per ledgered concept;
Full House has none, and the entries that exist point at a lesson that was killed by `arch-selection`.

**N3 — Fix `CAPACITY_DEFENCE_COPY`.** Its asymmetry claim is leftover from the pre-BC-2 constants.
**[computed]** at N4 the high side is worse at ±$10 and ±$20 (1.02x, 1.01x); the low side only becomes
worse at ±$30 (1.53x), and N2 shows the same shape (1.29x). Either restate it at the error size it is
true for, or drop it — BC-2 removed the asymmetry it was written to defend.

**N4 — Fix the design claim about N3, or fix N3.** "Just pick the middle" is exactly or nearly exactly
right on N3 at every reachable state. Either move N3's optimum off the N1/N2 midpoint (retune `drawSens`
or the national-TV terms) or strike the claim from the design doc and any teacher script derived from it.

**N5 — Repair the "shifters" card fallback branch.** It compares crowds at *different* prices and then
asserts the card caused the difference. Assert the card only fires when a matched price exists in the
same market across two cards; otherwise print the honest version ("no two desks charged the same price
on both nights — here is what that means").

**N6 — Decide on `medianCash` on the REVEAL board.** Either remove the cross-market money comparison
(as `DESIGN_C`'s own R8 discharge promises) or add the sentence that makes it true: market size shows
up in media money, not at the gate.

**N7 — Name the two national-TV channels, and route C-3 to `gate-l1-sr`.** The model applies both a
base cut and a **sensitivity increase** for a national window; only the base cut is on the card. The
elasticity effect (a free substitute makes buyers more price-sensitive) is the better economics and
should be either taught or ledgered. The directional sign itself is Sports Reality's to verify.

**N8 — Name the posted-curve channel.** Two published board points determine a card's line exactly.
Not a defect; it should be named in the teacher notes as the intended skill rather than left as an
unstated affordance.

**N9 — `boxOfficeModule` is still registered in `runtime/src/server/index.ts`.** `arch-selection`
killed the lesson and deferred code removal to the build wave. A teacher can still select a lesson
whose model `econ-boxoffice-unrepaired` indicts.

---

## Dissent recorded

I record formal dissent, **blocking, category economic-truth**, against certifying M2 L1 "Full House"
as economically sound in its current build, on **B1** and **B3**.

On **B1**: the lesson ships a house rule on every student's screen — *"Charge far below it and the
plan looks like a waste, so they stop buying it too"* — that its own model never executes. At Memphis
every legal price below the plan price *gains* renewals; at New York the entire reachable penalty is
2 points against the other arm's 20. The consequence is not cosmetic: **[computed]** exhaustively,
every price above the night's cash optimum is weakly dominated on both books at every reachable state,
and the undominated set is always exactly [plan price, cash argmax] — 3 to 9 of 56 prices on the quiet
cards. R4's letter is satisfied and its purpose is defeated, which is verbatim the finding
`sel-econ-review` recorded as blocking against Candidate A's L1 and which BC-2 was written to prevent.
As built, the room's own numbers teach that pricing high is never a legitimate choice.

On **B3**: `SHOCK_REVEAL_COPY` cites six real clubs to tell a pair that buying the N4 capacity option
was the same move real professionals made, while the model charges them exactly $95,000 (New York) or
$42,000 (Memphis) for it at every price a well-played desk would choose, in every reachable state. A
product may build a trap; it may not congratulate the student for walking into it with a real-world
citation.

Both are repairable and neither requires a refound. A decision to proceed does not erase this dissent.
