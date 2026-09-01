# M2 L1 "Full House" — Economic Truth RE-CHECK, repair round 1

Economic Truth Critic · Boss run `m2-quality-war` · assignment `recheck-l1-econ` · 2026-09-01.
Fresh context. I built none of this and none of the repair. Scope is `GATE_L1_ECON.md`'s own
blocking findings, re-run by its own repro methods — no new scope invented.

**Evidence basis.**

- **Observed (source, this session):** `runtime/src/modules/fullHouse.ts` (repaired
  `renewalDelta`/`renewalReferencePrice`, `bestFoundSeason`, `replaysFor`, `revenueCardBody`,
  `shifterCardBody`, `spendRuleFor`, `slateView`, `HOUSE_RULES`, `SHOCK_REVEAL_COPY`,
  `CAPACITY_DEFENCE_COPY`, `OBJECTIVE_COPY`), `runtime/src/test/fullHouse.test.ts` (the four new
  B1/B2/N4 tests), `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` (P11/P12/P13),
  `runtime/src/client/play/main.ts` (replay + books rendering).
- **Observed (computation, run by me this session):** `npm run build --prefix runtime` (clean);
  `npm test` from `runtime/` → **351/351 pass**; `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`
  → **13/13 PASS**, which I reproduce and do not dispute. Then five probe scripts of my own in the
  scratchpad, importing `runtime/dist/modules/fullHouse.js` so no constant is re-declared: the tent
  shape over the full dial; night-level Pareto sets over 110 states per market (renewals 0–100 step
  10 × carry {0,max} × 5 cards); an **exact dynamic program** over (renewals × carry) covering all
  56 prices × all spend levels × 5 nights, which is a global optimum, not a heuristic search; the
  same DP restricted to spend 0; a spend/renewals decomposition; and a four-desk session driven
  through the real reducer to COUNTERFACTUAL and SYNTHESIS. Every number tagged **[computed]** came
  from those runs.
- **NOT VERIFIED by me:** every real-world sports fact (Sports Reality's lane); anything about how
  this feels in a room; browser truth (I ran no browser this session and booted no server).
- **Still ABSENT (gate N1/N2, non-blocking, unchanged):** no simplifications ledger exists in the
  product (`grep -i simplif runtime/src/modules/fullHouse.ts` → nothing);
  `docs/ECONOMICS_CONCEPT_MAP.md` line 23 still heads M2 as "The Box Office".

---

## mechanism-verdicts

### Highest-severity finding first

**NEW FINDING (BLOCKING, economic-truth) — the repair fixed the night-level frontier and inverted
the season-level one. The maximum-cash season is now also a near-maximum-renewals season, the
product's own "renewals-friendly" counterfactual is strictly dominated on BOTH books, and the two
notes printed beside it on the student device are false.**

The old defect was FL3 ("high is always wrong"). It is gone (finding 1 below). What replaced it is
FL1: the two books no longer trade off at the scale the lesson actually reports them.

**[computed]**, exact DP over prices × spend × 5 nights, both markets:

| market | flat plan (plan price ×5) | best line the product prints | max-renewals line |
|---|---|---|---|
| New York | $1,291,132 · **80%** | **$2,743,440 · 92%** | 100% at $2,711,980 |
| Memphis | $875,672 · **80%** | **$2,251,204 · 96%** | 100% at $2,240,564 |

The best-cash line beats the flat plan by **$1,452,308 and +12 renewal points** (New York) and
**$1,375,532 and +16 points** (Memphis). The whole season Pareto frontier is 8 renewal points wide
at New York and 4 at Memphis, costing **1.15%** and **0.47%** of season cash respectively. With the
spend dial forced to zero it is no better: the max-cash season lands at **85%** (NY) / **81%** (MEM)
renewals — still at or above the flat plan's 80% — and buying every remaining renewal point costs
**3.4%** / **4.7%** of cash.

Observed verbatim on the `/play` COUNTERFACTUAL surface from my own four-desk session (Desk 1, New
York, card-reading line $34/$48/$40/$90/$34):

```
What you actually did:              $2,458,676 | 65%
Same price every night ($24):       $1,291,132 | 80%
   "Never moved the dial. Renewals stay high; the big nights leave money on the table."
The best five nights we could find: $2,743,440 | 92%
   "... Look at what it costs on the renewals side."
```

Both notes are refuted by the numbers on the same card. Renewals do **not** stay high on the flat
line — they end 12 points *below* the strong line. The strong line **costs nothing** on the renewals
side; it gains. Desk 3 (a moderate $24/$36/$30/$84/$24 line) finished **$2,504,992 at 84%** — also
strictly better than the flat plan on both books. A pair that reads this card learns "there is one
best line and it is better at everything," which is precisely FL1 and precisely what R4 exists to
prevent. `l1-tuning-harness` P5 and P12 cannot catch it: both are **night-level** properties, and
the defect is at season scale — the only scale the COUNTERFACTUAL card and the TWO BOOKS card report.

Two mechanisms cause it, and both are new or newly load-bearing:

1. **Renewals are an input to cash, not a rival book.** `market.renewalFans` (60 NY / 55 MEM) makes
   every renewal point worth 55–60 base fans on every later night. **[computed]** New York N1, +10
   renewal points moves best net from $215,384 to $246,692 (+$31,308). Renewals are lagged cash.
   That was true before the repair too, but the old tent's punishment of high prices masked it; the
   new bargain arm removes the mask.
2. **The night-spend dial buys renewals, and nothing says so.** `renewalDelta` adds
   `spend / eventRenewalDollars` — up to **+5** points a night at New York ($120,000 / $24,000) and
   **+6** at Memphis ($60,000 / $10,000). **[computed]**, the printed best line's renewals gain
   **13 points at New York and 15 at Memphis** from the spend term alone; strip it and the same
   prices end at 79% / 81%. This channel appears in **no** rule, card or label:
   `HOUSE_RULES[2]` says spend "lands on the NEXT night"; `spendRuleFor` says "Every $100 here brings
   about 1 extra person NEXT night" and nothing else; `HOUSE_RULES[4]` ties renewals to price only.
   An undisclosed, unattributable channel on the very dial B4 was opened up to make legible — R7.

### 1. Weak-dominance defect (gate B1 limb ii) — **FIXED**

The one-directional frontier is gone. **[computed]** over my own 110-state grid per market (renewals
0–100 step 10 × carry {0, max} × 5 cards), Pareto-undominated on (cash, renewals):

| market · card · r=50 · carry 0 | cash argmax | undominated set | above argmax |
|---|---|---|---|
| new-york N1 | $34 | $24–$34 | 0 |
| new-york N2 | $48 | $28–$48 | 0 |
| **new-york N3** | $40 | $40,$42,$46,$50,$52,$56 | **5** |
| **new-york N4** | $90 | $90,$92,$100,$108 | **3** |
| memphis N1 | $24 | $16–$24 | 0 |
| **memphis N3** | $30 | $30,$32,$38,$42,$44,$48 | **5** |
| **memphis N4** | $84 | $84,$92,$98 | **2** |

**38 of 110 cells per market carry an undominated price strictly above the night's cash optimum**
(128 such price-states at New York, 129 at Memphis). On the narrower 22-state grid the harness
sweeps I reproduce the builder's claimed **44** exactly. The quiet cards now point the renewals book
*down* from the cash optimum and the big cards point it *up*, so no fixed moral about greed is
extractable. The gate's B1(ii) discharge condition is met.

### 2. The tent's low arm and its taught rule (gate B1 limb i) — **FIXED, with two copy defects**

**[computed]**, spend 0, at the $10 floor: **−20 at New York, −9 at Memphis**, on every card. The
builder's claim reproduces exactly. Reachable-below penalty is ≥ 1/3 of reachable-above on every
card. Behaviourally confirmed in the harness's own P6 row: a Memphis desk holding $10 all week now
ends at **5%** renewals (it ended at 70% before the repair, per the gate's live session); the
New York equivalent ends at 0%. The cheap-is-kind exploit is dead. My session's Desk 4
($12/$16/$16/$40/$12 at Memphis) finished at **60%** renewals and $1,211,552 — worse than the flat
plan on both books, which is the right shape for a lazy cheap line.

`HOUSE_RULES[4]` is now mostly true of the model, but it carries two false clauses:

- **NEW FINDING (non-blocking):** *"On a big night — high Draw, **not on national TV** — a strong
  price makes their plan look like a bargain and MORE of them come back."* The national-TV clause is
  false. **[computed]** the bargain bonus peaks at **+12 on N3 (draw 88, national TV)** at $56 (NY)
  / $48 (MEM) — *identical* to its peak on N4 (draw 97, no TV). National TV moves only *where* the
  peak sits (reference $56.2 vs $111.4 at NY), never *whether* it fires. N3 is the Two Peaks card and
  the one card where the above-optimum choice is widest; the rule tells the room that arm is switched
  off there.
- **Precision nit:** *"Charge BELOW the plan price and the plan looks like a waste, so they stop
  buying it."* At exactly one dial step below plan ($22 NY, $14 MEM) the move is still **+1** —
  renewals rise. True from two steps down; false at the first.

### 3. N4 as a declared trap (gate B3) — **FIXED**

**[computed]** over 42 reachable states per market (renewals 0–100 step 5 × carry {0,max}): the best
achievable N4 with the bowl open is worse than the best with it closed by **exactly $95,000 (NY) /
$42,000 (MEM) in every cell, zero exceptions**. The option remains strictly dominated, which is the
gate's option (b), taken deliberately.

Copy audit — every string that touches it:

- `SHOCK_REVEAL_COPY`: the congratulating clause is gone. Its replacement is **true**: "Opening more
  of this building never beat pricing it right — it only ever handed part of the money back to a desk
  that had already priced too low." **[computed]** at r=50 the bowl gains at $22–$56 (NY) / $12–$56
  (MEM), always strictly below the $90 / $84 cash optimum. The Fever citation is now used to name the
  *difference* ("They could not raise the price... You could"), which is the honest reading.
- Board gating: `settledCards.includes("N4")` — it lands after the bell, never before the decision.
- N4 card note ("It costs money before you know who shows up") and the `/play` checkbox ("$95,000,
  paid whether they fill or not") are neutral and accurate. No string congratulates.

**P11 now tests the actual choice.** The old version compared open-vs-closed at a fixed price; the
new one maximises over the whole dial on both bowl settings and additionally asserts the option is
never inert and only ever pays *below* the cash optimum. The committed suite test
("N4 capacity option: never part of a best night, still a live hedge against underpricing") asserts
the same three limbs over renewals 0–100 × carry {0,max}. Correct comparison, correct property.

### 4. The cash-ceiling claim (gate B2) — **FIXED, and stronger than claimed**

I did not re-run the builder's search; I ran an **exact DP** over (renewals × carry) covering all 56
prices and all 25/13 spend levels on every night — a provable global optimum for the no-bowl policy
space `replayPlan` covers. **[computed]:**

| market | printed "best five nights we could find" | my exact DP optimum | gap |
|---|---|---|---|
| New York | $2,743,440 (prices 24/36/46/100/40, spend 110k/120k/120k/0/0) | **$2,743,440** (identical path) | **$0** |
| Memphis | $2,251,204 (prices 16/28/34/94/28, spend 55k/50k/60k/0/0) | **$2,251,204** (identical path) | **$0** |

Both DP paths satisfy the `cash < 0` spend cap, so they are feasible, not upper bounds. The
$63,472 / $78,280 shortfall the gate found is gone. The card's hedged label ("Not a proven maximum —
the best line we could search out") is *more* conservative than the truth, which is the right
direction. The false **"spend early"** note is deleted and replaced by a schedule read off the
searched plan ("event money on N1 and N2 and N3"), which matches the returned plan exactly. B2's
falsifiable discharge condition is met.

### 5. Class REVENUE card (gate B5) — **FIXED**

`revenueCardBody` groups `agg.curves` by `marketId` **and** `cardId`, requires `spread > 0`, and
requires `high.turnout < low.turnout` before quoting. Observed verbatim from my real session:

> "Night 2, Memphis Grizzlies — the same night in the same building. One desk charged $16 and 17,662
> came. Another charged $30 and 14,255 came. Higher price, smaller crowd: that is a demand curve, and
> it is only readable one night at a time."

One market, one card, higher price → smaller crowd. The gate's exact failure ("$12 (16,080) ... $90
(16,980)" across two markets) cannot recur. The no-usable-group fallback is honest and declines to
quote rather than pooling.

### 6. Night-spend information (gate B4) — **PARTLY FIXED**

`slateView()` (all five nights: day, visitor, draw, TV, repeatOf, bowlOffer) is on the student view
and the board; `nextCard` is on both PLAY views; `spendRuleFor` prints the payback rule before the
commitment. **[computed]** the rule's arithmetic is correct: `Math.round(1/eventFans)` = $100 (NY,
`eventFans` 0.01) and $63 (MEM, 0.016 → 62.5); at Memphis $60,000 buys `round(0.016 × 60000)` = 960
carry fans, i.e. $62.50 each, so "about 1 extra person" per $63 is honest. "It comes back as nothing
at all if tomorrow sells out without them" is true (`turnout = min(seatsOpen, wanted)`). Carrying no
outcome and no demand constant, it does not reopen BC-4 by inspection.

**NOT FIXED:** the dial's *other* effect — up to +5/+6 renewals a night — is still not disclosed
anywhere. See the headline finding. The gate's B4 also asked for an aggregate field recording spend
timing and its realized return so the debrief can attribute it; **[observed]** no such field exists
in `FullHouseAggregate`, and no synthesis card mentions when anybody spent.

### Carried from the gate, re-verified, still open

- **N3 (`CAPACITY_DEFENCE_COPY`) — NOT FIXED, and now demonstrably false in two directions.**
  **[computed]** at r=50: on **N4 the two errors cost exactly the same** at ±$10 ($15,000 each) and
  ±$20 ($60,000 each); the low side is worse only at ±$30 (1.52x NY / 1.54x MEM). Meanwhile "on the
  other four nights the two mistakes cost about the same" is false at Memphis N1/N5, where the
  **high** side is **2.04x** worse at ±$20 and **4.59x** worse at ±$30, and at Memphis N3 (2.25x at
  ±$30). The copy asserts the opposite of the model on the two quiet Memphis cards.
- **N5 (shifters fallback) — NOT FIXED.** Observed in my session, the confounded branch fired:
  "the best Tuesday crowd was 16,862 at $24; the best Saturday crowd was 17,836 at $36... **nothing
  else moved the crowd**" — two different prices presented as evidence that only the card moved it.
- **N1 (simplifications ledger) and N2 (concept-map / track-map pointers) — NOT FIXED.** Absent.

### Regression check — nothing the repair broke elsewhere

`npm test` 351/351 and the harness 13/13, both run by me this session. P1's R6 symmetry survives the
retune (worst 1.38x at memphis N2 against a 3.0x bar); P3's four distinct optima are unchanged
($34/$48/$40/$90 NY, $24/$36/$30/$84 MEM); P4's Two Peaks gap is 4 steps NY / 3 steps MEM. C1, C2,
C9, C10 and C12 all still pass delete-it-and-numbers-change.

---

## false-lesson-risks

| id | risk | status after repair round 1 | basis |
|---|---|---|---|
| **NEW FL-A** — *"there is one best line and it is better at everything"* (FL1 restored at season scale) | **LIVE, worst risk in the lesson now.** The printed best line beats the flat plan by $1.45M **and +12 renewals** (NY) / $1.38M **and +16** (MEM). The season Pareto frontier is 1.15% / 0.47% of cash wide. The two notes on the COUNTERFACTUAL card assert a tradeoff the same card's numbers refute. | **[computed]** exact DP + observed on `/play` |
| **NEW FL-B** — *"the money you spend on the night only buys tomorrow's crowd"* | **LIVE.** The dial also buys 5–6 renewal points a night (13–15 across the printed best line); no rule, label or card says so, so the effect is unattributable at debrief and the pair cannot reason about it during play. R7. | **[computed]** + copy grep |
| **NEW FL-C** — *"the bargain bonus is switched off on a national-TV night"* | **LIVE, small.** `HOUSE_RULES[4]`'s "not on national TV" clause. The bonus peaks at +12 on N3 (national) exactly as on N4 (no TV). | **[computed]** |
| **FL3** — *"charging high is greedy and gets punished; charging low is kind"* | **DEFUSED.** 38/110 states per market carry an undominated price above the cash optimum; the $10 floor now costs 20 (NY) / 9 (MEM) points per night and ends a week at 0–5% renewals. | **[computed]** |
| **"the real clubs agreed with you"** (gate's new finding on N4) | **DEFUSED.** The validating clause is deleted; the replacement names the price-rigidity difference and states the trap. | Observed in copy |
| **"the game's ceiling is a number the game got wrong"** | **DEFUSED.** Exact DP finds a $0 gap against the printed line, and the label no longer claims a maximum. | **[computed]** |
| **FL2 / FL10** | **STILL DEFUSED.** Four distinct optima; card-conditional argmaxes. | **[computed]**, harness P3/P10 |
| **FL6** — *"small markets have empty buildings"* | **DEFUSED at fill, still RE-OPENED at cash.** `medianCash` cross-market comparison unchanged (gate N6). | Observed |
| **FL1** (original form) | **RE-OPENED at season scale.** See FL-A. | **[computed]** |
| **"cheap = full = good"** (gate magnitude item 1) | **DEFUSED by the low arm.** Full house is still only reachable near the $10 floor, but the floor now costs the renewals book its whole book. | **[computed]**, harness P2/P6 |

---

## dominant-strategies

### 1. NEW — the strong line is season-dominant across both books

**[computed]**, exact DP: the printed best line at New York ($2,743,440 / 92%) **weakly dominates the
flat plan ($1,291,132 / 80%) on both books**, and so does an ordinary moderate desk line — my
session's Desk 3 ($24/$36/$30/$84/$24) finished $2,504,992 / **84%**. The gate's B1(ii) condition was
met at the *night* level and violated at the *season* level, which is where the product reports. This
is the mirror image of the defect B1 was written to remove: before, the top of the dial was never a
legitimate choice; now, the conservative *book* is never a legitimate choice.

### 2. NEW — spend is a near-free renewals purchase

Maximum spend on N1–N3 is cash-positive at both markets (harness P9: NY +$21,392 / +$28,064 /
+$63,840; MEM +$52,504 / +$48,508 / +$73,820) **and** adds 13–15 renewal points **[computed]**. A dial
that pays on both books at once, on three of five nights, with one of its two effects undocumented,
is the closest thing to a dominant action in this build. It is not a *fixed* rule — N4 and N5 spend
loses money in both markets — so the "when you spend decides whether it pays" claim survives on the
cash book. It does not survive on the renewals book, where spending is unconditionally good.

### 3. The capacity option — still strictly dominated, now correctly labelled

**[computed]** 42/42 cells per market, margin exactly −$95,000 / −$42,000. Not a live lever; the copy
and P11 both now say so. **FIXED** as a truth-in-labelling matter.

### 4. "Pick the middle" on N3 (gate item 3, non-blocking N4) — **NOT RE-TESTED**

Out of my assigned scope this round. **NOT VERIFIED** whether the renewals retune moved N3 off the
N1/N2 midpoint. The cash argmaxes are unchanged ($34/$48/$40 NY, $24/$36/$30 MEM), so I expect it is
unchanged, but I did not sweep the reachable renewals states for it and will not claim it.

### 5. NEW — the evidence artifact prints a stale renewals claim

`l1-tuning-harness.mjs` P5's **assertion** is correct (it computes `renewBest` over the grid), but its
printed row hard-codes `renewals $${market.planPrice}` and therefore reports "N4 cash $90 vs renewals
$24" for New York. **[computed]** the renewals-best price on New York N4 is **$108–$112 (+12)**, not
$24 (+6). A reviewer or teacher reading the harness output is told the model still peaks renewals at
the plan price on every card — the exact behaviour the repair removed. Non-blocking, but it is a false
line in the artifact that certifies the repair.

### Cleared / unchanged

No money leaderboard; no live comparison during PLAY (`curves: []` gated on `settledCards`); no RNG;
no fandom advantage (Draw is a printed 0–100). The posted-curve channel (gate N8) is still unnamed.

---

## synthesis-map-verdict

**The formalization chain is stronger on two links and broken on one, and the break is new.**

- **REVENUE = PRICE × PEOPLE — FIXED, and now genuinely instantiated.** One market, one card, and a
  structural requirement that the quoted crowds move against the quoted prices before the card will
  speak at all. The closing sentence is no longer refuted by its own numbers. This was the module's
  headline-concept card and it now does its job. B5's discharge condition (shared `marketId` **and**
  `cardId`, turnouts opposed to prices) is met in code and observed in a session.
- **THE TICKET IS NOT THE PRODUCT — unchanged and sound.** Observed: "$48 ... $40 — $8 lower, 4 clicks
  of the dial." The gap is exactly `ancillary/2` by construction, computed from a real desk's frozen
  N3 curve. D15 discipline unaffected by the repair.
- **NIGHT 5 WAS NIGHT 1 — unchanged and sound**, and better served by the new tent: observed, four
  desks charged the same price on both nights, and the crowds moved with their own renewals column
  (Desk 1: 14,142 → 15,042 at $34; Desk 3: 16,862 → 18,542 at $24).
- **TWO BOOKS, NO EXCHANGE RATE — FAILS, newly.** The card asserts *"no price is best on both. Every
  night you chose which book to feed."* The first sentence is true per night (**[computed]**, harness
  P5's assertion holds at every reachable state, minimum argmax separation $2). The second is false at
  the scale the room will actually argue about: the class's own COUNTERFACTUAL card shows the
  strongest line winning both books, so the room's evidence contradicts the room's formalization.
  R16 link 2 ("Two books, and the choice between them") is **still NOT MET** — for the opposite reason
  it failed at the gate.
- **THE CARD MOVED THE CROWD — still conditional.** The matched branch is sound; the fallback fired in
  my session and asserted "nothing else moved the crowd" while quoting two different prices. Gate N5,
  unrepaired.
- **R16 link 1 ("money you spend lands on the next night") — improved but not earned.** The slate and
  the payback rule make the decision informed; no aggregate field records spend timing or its realized
  return, so the class still cannot attribute it at debrief, and the renewals half of the dial is
  invisible.
- **R16 link 3 ("gate is how the building makes money") — unchanged, deferred to an unbuilt L2, with
  no product-side ledger holding it. NOT MET.**
- **Beyond-sports link — unchanged and still the strongest part of the chain.**

**Net: 2 of the 3 broken synthesis links from the gate are repaired (B5 fully, B2 fully), 1 is
repaired-and-re-broken (the two-book link), and the R11 ledger the whole map depends on still does
not exist.**

---

## required-repairs

### BLOCKING (category: economic-truth)

**R1 — Restore a season-level two-book tradeoff, or stop reporting the two books at season level.**
This supersedes gate B1, which is otherwise discharged.
*Falsifiable discharge (all three):* (i) assert that the flat-plan line printed on the COUNTERFACTUAL
card is **not** Pareto-dominated by the "best five nights we could find" line, in either market —
today it is dominated by $1,452,308 / +12 points (NY) and $1,375,532 / +16 points (MEM); (ii) assert
that the season cash-maximising policy gives up at least some stated minimum share of the reachable
renewals range — today the whole frontier is 1.15% (NY) / 0.47% (MEM) of cash wide, and 3.4% / 4.7%
with the spend dial off; (iii) assert this at the **season** level, not the night level — P5 and P12
are night-level and both pass while this is broken. The economically true repair is to stop letting
renewals pay for themselves: either cut `renewalFans` so a renewal point is not lagged cash (New York
is currently 60 fans/point ≈ $3,100 a night), or cap the bargain arm so that the big-night premium
that maximises cash sits **above** the reference price rather than below it (NY N4: cash optimum $90,
reference $111.4 — the cash-optimal price is currently *inside* the bonus ramp, which is what makes
maximising cash also maximise renewals).

**R2 — Delete or rewrite the two false notes on the COUNTERFACTUAL card.**
*Falsifiable discharge:* assert that the flat-plan note's renewals claim ("Renewals stay high") is
true relative to the strongest line's renewals in both markets, and that the strongest line's note
("Look at what it costs on the renewals side") is only emitted when that line's renewals are
**lower** than the flat plan's. Both are false as shipped and both render on the student device.
This must not be closed by fixing the copy alone if R1 is unresolved — honest copy about a degenerate
frontier still leaves R16 link 2 unearned.

**R3 — Disclose the night-spend dial's renewals channel, or remove it.**
*Falsifiable discharge:* assert that some pre-commit student-visible string names the renewals effect
of the spend dial with its magnitude (up to +5/night at New York, +6 at Memphis), **or** assert
`renewalDelta(market, card, p, s) === renewalDelta(market, card, p, 0)` for all s. Today the dial
silently supplies 13 of the 42 renewal points on New York's printed best line and 15 of 46 on
Memphis's, on a dial whose entire published rule is about tomorrow's crowd. R7.

### NON-BLOCKING (required before the wave closes)

**N-a — `HOUSE_RULES[4]`: strike the "not on national TV" clause.** The bargain arm peaks at +12 on
N3 (draw 88, national) exactly as on N4 (draw 97, none). National TV moves the reference price
($56.2 vs $111.4 at NY), not the size of the bonus. As written, the rule tells the room the arm is
off on the Two Peaks card, which is the card where the above-optimum choice is widest.

**N-b — `HOUSE_RULES[4]`: the first clause is false at one dial step below plan.** At $22 (NY) and
$14 (MEM) renewals still move **+1**. Either say "well below" or move `RENEWAL_UNDERCUT_SLOPE`.

**N-c — `CAPACITY_DEFENCE_COPY` (gate N3, unrepaired and now measured more sharply).** At N4 the two
errors cost **exactly the same** at ±$10 and ±$20; at Memphis N1/N5 the **high** side is 2.04x worse
at ±$20 and 4.59x worse at ±$30, so "on the other four nights the two mistakes cost about the same"
is false in the opposite direction from the one the copy defends.

**N-d — `l1-tuning-harness` P5's printed row hard-codes `market.planPrice` as the renewals-best
price.** It reports "N4 cash $90 vs renewals $24"; the true renewals-best on New York N4 is $108–$112.
The assertion is right; the evidence line is stale and contradicts the repair it sits beside.

**N-e — gate N5 (shifters fallback), N1 (simplifications ledger), N2 (concept map / track map), N6
(`medianCash`), N7 (the second national-TV channel), N8 (posted-curve channel), N9 (`boxOfficeModule`
still registered) are all carried forward unrepaired.** N1 in particular: the product still records no
simplification, and this round added two more that need entries — renewals as an input to demand
(`renewalFans`), and the modelled claim that plan holders reward a high walk-up price on a big night.

**N-f — gate N4 ("pick the middle" on N3): NOT VERIFIED this round.** Out of assigned scope; the cash
argmaxes are unchanged, so I expect it is unchanged, but I did not re-sweep it and do not certify it.

---

## Ruling on the builder's own flag (assignment item 5)

The builder flagged that the retune shrank the season two-book gap from 22%-vs-80% to
~66%-vs-80% renewals and asked whether the tension still teaches. **My ruling: the flag understates
what happened, and the answer is no.** The greedy card-reading line the builder measured ends at 65%
(NY) / 70% (MEM) **[computed]**, close to their figure. But the line the *product itself prints on the
student device* — `bestFoundSeason`, the exact global optimum — ends at **92% (NY) / 96% (MEM)**,
**above** the flat plan's 80%. The gap did not shrink; **it changed sign on the comparison the lesson
actually shows the room.** With the spend dial off it is still 85% / 81% versus 80%, i.e. gone rather
than small. The second book is below teachability: it no longer poses a choice at the season scale,
it poses a free bonus, and the two sentences printed beside it are false. The night-level tension the
repair correctly created is real and is worth keeping; it is simply not what the debrief reports.

---

## Dissent

The gate's blocking dissent `econ-l1-renewals-tent` was recorded on **B1** and **B3**. Both are
discharged: B1's low arm binds inside the legal dial at −20 (NY) / −9 (MEM) and the two-book frontier
now runs both ways at 38 of 110 states per market; B3's capacity option is strictly dominated at every
one of 42 reachable states per market, P11 tests the joint choice, and no copy string congratulates a
desk for taking it.

**DISSENT econ-l1-renewals-tent: DISCHARGED**

I record a **new** formal dissent, **blocking, category economic-truth**, `econ-l1-season-books`, on
**R1/R2/R3**: the repair removed the night-level one-directional frontier and, in the same move,
collapsed the season-level one. The lesson's own COUNTERFACTUAL card shows a maximising line that
beats the conservative line by $1.45M **and twelve renewal points**, under a note that says to look at
what it cost on the renewals side. Two books that never trade off are one book with two columns, and
R4's purpose is defeated a second time, from the other direction. A decision to proceed does not erase
this dissent.
