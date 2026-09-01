# M2 L1 "Full House" — Economic Truth RE-CHECK, repair round 3

Economic Truth Critic · Boss run `m2-quality-war` · assignment `recheck3-l1-econ` · 2026-09-01.
Fresh context. I built none of this model and none of any repair round. Two rulings were assigned:
**RULING 1** on the blocking dissent `econ-l1-n5-attribution`, and **RULING 2** on the
builder-flagged `renewalFans 25 / planSlope 3.6` tradeoff, which the builder explicitly referred to
this role rather than accepting.

**Evidence basis.**

- **Observed (source, this session):** `runtime/src/modules/fullHouse.ts` at HEAD `b3e6ba5`
  (`MARKETS`, `curveFor`, `settleNight`, `renewalDelta`, `renewalReferencePrice`, `repeatRowFor`,
  `RepeatRow`, `computeAggregate`, `pathDependenceCardBody`, `synthesisCards`, `replaysFor`,
  `bestFoundSeason`, `replayPlan`, `HOUSE_RULES`, `SIMPLIFICATIONS`, `spendRuleFor`,
  `renewalRuleFor`, `applyNight`/`closeNight`), and
  `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` (P13-P16).
- **Observed (computation, run by me this session):** `npm run build --prefix runtime` (clean);
  `npm test` from `runtime/` -> **352/352 pass**; `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`
  -> **16/16 PASS**. Then six probes of my own in the scratchpad, all importing
  `runtime/dist/modules/fullHouse.js` so no shipped constant is re-declared:
  (A) a 168-case full-season identity sweep with an independent price AND spend on every one of the
  five nights in both markets, far wider than P16's 36 cases; (A2) an exhaustive 224-case flat-price
  sweep over the whole legal dial; (A3) five real rooms driven through an exact clone of the
  unexported `applyNight`, then through the shipped `computeAggregate` + `synthesisCards`, so the
  strings below are the strings the projector prints; (A4) a `HOUSE_RULES` truth audit over all
  280 card-price states per market; (B/D/E) my own **exact season DP** — forward over
  (renewals x carry) keeping max cash per state, then **true Pareto extraction over the final
  states**, which is strictly stronger than the harness's lambda sweep because it finds
  non-convex-hull points too — validated at **16,800/16,800 exact matches** against the shipped
  `curveFor`/`settleNight`/`renewalDelta` before I trusted a single number from it; (C) an
  **84-point (renewalFans x planSlope) constant sweep** with both P14 and the Player gate's felt bar
  scored at every point; (F/G) played-price and dominant-strategy probes.
  Every number tagged **[computed]** came from those runs.
- **NOT VERIFIED by me:** all real-world sports facts (Sports Reality's lane); anything about how any
  of this reads in a room or on a projector, including whether the decomposition line fits the fold;
  browser truth (I ran no browser and booted no server — I confirmed nothing was listening on 4300).
- **Carried unverified, out of scope this round:** gate N2, N4, N6, N7, N8, N9 (see R2's N-l).

---

## mechanism-verdicts

### Highest-severity finding first

**NEW BLOCKING (economic-truth) — the module's headline two-book claim is priced against a
Pareto-dominated baseline, and the exchange rate it implies is 47x-70x too steep. This is R2's
non-blocking N-h, unrepaired through the FINAL repair round, and round 3 made it worse.**

`replaysFor` and the `TWO BOOKS, NO EXCHANGE RATE` synthesis card both print exactly two season
lines: the cash corner and "never moved the dial". **[computed]**, my exact DP, verified against the
shipped functions:

| market | most cash (= the printed line, exact match) | never move the dial | what the card implies a renewals book costs | what it actually costs |
|---|---|---|---|---|
| New York | $2,416,884 / **65%** | $1,238,212 / **80%** | **$1,178,672** for 15 points | **$25,050** (1.04% of season cash) — **47x** |
| Memphis | $1,962,968 / **65%** | $845,432 / **80%** | **$1,117,536** for 15 points | **$15,900** (0.81%) — **70x** |

And the flat line is **strictly Pareto-dominated**: **[computed]** New York **84% @ $2,391,834**
beats it by **$1,153,622 AND +4 renewal points**; Memphis **80% @ $1,947,068** beats it by
**$1,101,636** at the same renewals. The only renewals-friendly season the room is ever shown is one
that no desk should play. R2 measured this at 15-30x and filed it non-blocking. At 47-70x, on the
module's own formalization card, on the last surface of the last lesson beat, it is no longer a
magnitude nit: the room is led to conclude that protecting a season-ticket base costs about $1.2
million when the model says it costs $25,050. That is a false economic lesson at the synthesis, which
is the one place the charter says the economics must be named correctly.

The richest sentence in this build remains unspoken. **[computed]** the true frontier is a smooth,
**22-point (New York) / 24-point (Memphis)** curve with textbook rising marginal cost:

```
New York:  65% $2,416,884  ->  77% $2,401,196   (~$715-$1,900 per renewal point)
           ->  93% $2,377,098  ->  97% $2,332,976   (~$9,000-$13,500 per point)
           ->  100% $2,234,548                      ($51,478 for the LAST point)
Memphis:   65% $1,962,968 -> 80% $1,947,068 -> 93% $1,931,668 -> 100% $1,845,068
           (marginal cost $80/point at the cheap end, $30,000/point at the last)
```

Cheap points first, ruinous points last — a real season-ticket book's shape, computed, on the room's
own model, and currently replaced on the projector by a two-row comparison that gets it wrong by a
factor of fifty.

### 1. RULING 1 — the N5 decomposition (R4 / dissent `econ-l1-n5-attribution`) — **the named defect is REPAIRED**

The repair's three claims, checked by my own probe, not by re-reading the harness.

- **The identity is exact by construction, not by luck.** N5 is `repeatOf: "N1"` with identical
  `day`/`weekend`/`draw`/`tv`, so `curveFor`'s `sens` and its whole card term are the same integer on
  both nights; `renewalFans*(r-50)` and `carryFans` are integers, so `Math.round` distributes;
  `turnout + turnedAway = wanted` always. The claimed identity therefore has to close wherever
  `wanted` is not clamped. **[computed]** over **168 full-season cases** (independent price and spend
  on all five nights, both markets), residual **0** in every case where demand stays off its floor.
- **The card names the true dominant channel, from data.** **[computed]** `biggestChannel` matched my
  own independent recompute in **168/168** cases. Of **18** swept cases where the crowd went UP while
  renewals went DOWN — the dissent's exact case — the card named **"spend" 18 times and "renewals" 0
  times**.
- **The rendered copy is right, not just the field.** **[computed]** driving five real rooms through
  the shipped `computeAggregate` + `synthesisCards`, the `NIGHT 5 WAS NIGHT 1` card printed:
  - dissent case (three desks, same price both nights, $120k/$60k on Night 4): *"Desk 1 · New York
    Knicks: 14,142 then 14,792 — +650 people, and that is renewals -550 and Night 4's $120,000 of
    event money +1,200 ... Read the split: on these desks renewals were NOT the biggest thing that
    changed. Last night's event money was."* The old card asserted the opposite of this.
  - renewals-led room: *"+600 people, and that is renewals +600 ... For every desk on this card the
    biggest thing that changed was its own renewals."* True.
  - mixed room: *"1 of these 2 desks were moved most by their own renewals, the rest by last night's
    event money."* True.
  - capacity-clamped desk: *"wanted in -1,250 (renewals -1,250) · seats only allowed -380."* The
    clamp is named rather than hidden. Correct.

R4's discharge limb (a) is met: `repeatCard` carries the Night-4 spend and its converted carry fans,
the card quotes both channels with their sizes, and it makes the renewals claim only where renewals
is the larger channel for the desks it quotes.

### 2. RULING 1, residual — **the identity does NOT close at the demand floor, and the card then prints a self-refuting line**

`settleNight` floors `wanted` at 0. `repeatRowFor` has a branch for the capacity clamp at the top and
**none for the floor at the bottom**. **[computed]**, exhaustive 224-case flat-price sweep over the
whole legal dial: **102 of 224** seasons break the identity, worst residual **+1,250 fans**. The
breaking band is **$84-$120 at New York (19 of 56 prices)** and **$58-$120 at Memphis (32 of 56 — a
clear majority of the dial)**. The rendered card, from my own probe of a $120-flat room:

> `Desk 1 · New York Knicks: 0 then 0 — 0 people, and that is renewals -1,250 · Desk 2 · Memphis
> Grizzlies: 0 then 0 — 0 people, and that is renewals -1,250. For every desk on this card the
> biggest thing that changed was its own renewals`

Zero people, then zero people, and the projector says the biggest thing that changed was 1,250 fans
of renewals — and the opener above it says "a different crowd walked in". The partial case is worse
because it is more reachable: **[computed]** a New York desk flat at **$84** gets 542 people on Night
1 and 0 on Night 5 and the card prints *"-542 people, and that is renewals -1,025"*. This is the same
defect class the dissent named — a card asserting a channel size that the model's own crowd numbers
refute — in a corner the repair did not cover. It is narrower than the original (it needs a very high
price held on both Night 1 and Night 5), but at Memphis it starts at $58, which a grade-5 pair
believing "higher price, more money" reaches without trying, and the card preferentially quotes
exactly the same-price desks this hits.

P16 cannot catch it: it sweeps only `planPrice`, `PRICE_MIN` and `planPrice + 20`, none of which
reach the floor in either market.

### 3. RULING 1 — **`HOUSE_RULES`: four of five are true of the model; `HOUSE_RULES[2]` contains a clause that is false in about two-thirds of the state space**

- **`HOUSE_RULES[0]`** — dial ranges and the no-preview claim match `PRICE_MIN`/`PRICE_MAX`/
  `SPEND_STEP` and the PLAY payload. **TRUE** in source. *(That the dials "show dollars and nothing
  else" on screen is browser truth — NOT VERIFIED by me.)*
- **`HOUSE_RULES[1]` (the R2 N-g rewrite) — TRUE, and the repair is correct.** `curveFor` reads
  exactly `card.draw`, `card.weekend`, `card.tv`, `renewals` and `carryFans`; the rule now names all
  five and the two carried ones explicitly. The old "Nothing else moves it" contradiction with rule
  [2] is gone. One residual imprecision, not a repair: the enumerated list does not include the
  desk's own price, which moves tonight's crowd more than anything else — rule [0] introduces the
  price dial one line earlier, so this reads as an omission rather than a falsehood.
- **`HOUSE_RULES[2]` — the first two clauses TRUE, the third FALSE across most of the dial.** "Money
  you spend on the night never changes tonight's crowd" is true (`carry` enters the NEXT night's
  base). "Tonight's books are visibly worse for it" is true (`net` subtracts `spend`). But *"the whole
  dial is worth about two points"* — repeated pre-commit on the student's own screen by
  `spendRuleFor` and again in `marketFacts` — is **[computed] false in 173/280 (62%) of New York
  card-price states and 183/280 (65%) at Memphis**, where the dial buys **exactly zero** renewal
  points, because `renewalDelta` clamps to `[-20, +12]` **after** adding the spend term. And it is
  false where it matters most: **[computed]** at each night's own cash-best price the dial buys
  **0 points on Night 1, Night 2 and Night 5** in both markets, and it buys **0 points on Night 5 of
  the printed "most cash we could find" line itself**. Round 3 caused part of this: **[computed]** the
  zero-value share tracks `planSlope` — 32%/34% at 0.6, 56%/57% at 1.8 (round 2), **62%/65% at 3.6**
  (round 3). R2 verified "+2 is the true ceiling", which is correct, and did not check how often the
  realized value is zero.
- **`HOUSE_RULES[3]`** — `net = total - bill - spend - bowlCost` unconditionally. **TRUE.**
- **`HOUSE_RULES[4]` — TRUE as shipped.** **[computed]** one dial step under the plan price is still
  **+1** ("well UNDER" is the right hedge); the $10 floor is **-20 (NY) / -9 (MEM)** on every card;
  `renewalReferencePrice` rises with Draw and a national listing pulls it down ($97.6 -> $56.2 at New
  York N3). One residual imprecision: because the bargain bonus is at its +12 ceiling at the
  reference price, renewals do not actually turn negative until **$2.0-$5.0 above** the "worth" line
  (**[computed]** all ten market-card pairs). The reference price is not printed to students as a
  number, so no student can catch the offset; it stays a modelling simplification rather than a lie.

### 4. RULING 2(a) — **the season two-book frontier is economically REAL at these constants. Margin-at-bar is not a sign the claim is marginal; it is a sign P14 limb (i) measures the wrong baseline.**

My exact DP reproduces the shipped functions **exactly**: flat line $1,238,212/80% and $845,432/80%
match `replayPlan`; cash corner $2,416,884/65% and $1,962,968/65% match `bestFoundSeason` with a **$0
gap**, so the line the room reads IS the global optimum of the no-bowl policy space.

The tension is material and honest to teach:

- **[computed]** **22 (NY) / 24 (MEM) truly undominated season points** — I extracted the full Pareto
  set, not the convex hull, so this is a strictly stronger statement than P14's 6/8 lambda points.
- **[computed]** traversing it costs **7.54% (NY) / 6.01% (MEM)** of season cash against a 4% bar.
- **[computed]** marginal cost per renewal point rises from **$715-$950** at the cheap end to
  **$51,478 (NY) / $30,000 (MEM)** for the last point — a **>50x** rise. That convexity is the real
  economics, and it is the strongest thing in the module.
- **[computed]** night-level tension is intact: over 210 reachable states per market the cash-argmax
  and the renewals-argmax coincide in **0/210**, minimum separation **$8 (NY) / $6 (MEM)**.

So the answer to the builder's question (a) is: **the frontier is real, and it is not marginal.**

The zero headroom sits on **one** limb, and it is the limb with the least economic content. P14
limb (i) asks whether the flat line ends ahead of the *cash-max* line on renewals. It does, by
exactly 15/15. But **[computed]** the flat line is **Pareto-dominated by other achievable lines**, so
limb (i) can pass with a baseline that is off the frontier — and today it does. The three limbs that
carry real economic weight all have headroom: range **35 vs 30**, cash share **7.54%/6.01% vs 4%**,
Pareto points **22/24 vs 4**. The correct reading is not "the tradeoff has become marginal"; it is
"P14 is pinned against a strategy nobody should play, and so is the card."

### 5. RULING 2(b) — **the felt-scale conflict IS structural. And the source comment that says so overstates its case: a strictly better constant set exists.**

**[computed]**, an 84-point sweep over `renewalFans` in {10,15,20,25,30,35,40,45,50,60,80,100} x
`planSlope` in {1.2,1.8,2.4,3.0,3.6,4.5,6.0}, scoring P14's four bars and the Player gate's
>=10%-of-capacity bar at every point, in both markets:

- **P14 passes only at `renewalFans <= 30`** (and there only at `planSlope >= 3.0`).
- **The felt bar is first met at `renewalFans ~ 100`** (12.1% / 13.5% of capacity).
- **The two regions are disjoint by more than 3x. No pair satisfies both. STRUCTURAL — confirmed.**

The arithmetic reason, which no retune escapes: renewals start at 50 and clamp to [0,100], so the
renewals channel can move the crowd by at most `renewalFans x 50` fans. 10% of a real NBA capacity is
1,980 (MSG) / 1,780 (FedExForum) fans, so the bar needs **`renewalFans >= 39.6`** *even at a
theoretical full 50-point swing* — and on the honest plan-price line the model actually produces
(+24 points, itself capped by the +12/night `RENEWAL_DELTA_CEIL`) it needs **`renewalFans >= 82.5`
(NY) / 74.1 (MEM)**. At that size a renewal point is worth more future gate-plus-ancillary cash than
it costs to buy, the cash-max season starts buying renewals, and P14's margin collapses to 8-9
**[computed]** — which is precisely the `econ-l1-season-books` defect round 2 repaired. Real arena
capacity is a founder invariant (CLAUDE.md §3), so the denominator cannot move. The conflict is
arithmetic, not tuning.

**But the specific "these are the only constants" framing is refuted.** The source comment at
`fullHouse.ts:119-131` states: *"every point at `renewalFans >= 30` fails P14 at every `planSlope`
tried"*. **[computed]** on the fine spend grid (step $5,000, the real dial), in both markets:

| constants | P14 | NY margin | MEM margin | range | cash share | Pareto pts | felt swing (plan line) |
|---|---|---|---|---|---|---|---|
| **25 / 3.6 (shipped)** | PASS | **15 (headroom 0)** | **15 (headroom 0)** | 35/35 | 7.54% / 6.01% | 22 / 24 | +600 (3.0% / 3.4% cap) |
| **30 / 4.5** | **PASS** | **16** | **15** | 36/35 | 8.66% / 5.63% | 24 / 25 | **+720 (3.6% / 4.0% cap)** |
| **30 / 6.0** | **PASS** | **17** | **16** | 37/36 | 8.25% / 5.15% | 24 / 26 | +720 (3.6% / 4.0% cap) |
| 30 / 3.6 | FAIL | 15 | **14** | — | — | — | — |
| 32 / 3.6 | FAIL | 14 | 14 | — | — | — | — |
| 35 / any | FAIL | 13 | 13 | — | — | — | — |

`renewalFans 30` with `planSlope` raised to 4.5 or 6.0 passes all four P14 bars in both markets
**with headroom on the margin bar** and delivers a **20% larger** Night-5 beat. It still does not
reach 10% of capacity — nothing does — but it strictly dominates the shipped pair on both of the
things this wave is arguing about. I am not prescribing it (I do not implement, and any candidate
must be re-run against all 16 properties — **[computed]** the spend-dial zero-value share worsens
slightly, 62%/65% -> 63%/66%, so it interacts with finding 3). I am refuting the premise that zero
headroom is the price of economic truth. It is not; it is the price of having swept `planSlope` only
at `renewalFans <= 25`.

---

## false-lesson-risks

| id | risk | status at round 3 | basis |
|---|---|---|---|
| **NEW FL-G (WORST IN THE BUILD)** — *"protecting your season-ticket base costs about $1.2 million"* | **LIVE and BLOCKING.** Implied by the two rows of `replaysFor` and restated on `TWO BOOKS, NO EXCHANGE RATE`. **[computed]** 80% renewals is available for **$25,050 (NY) / $15,900 (MEM)**; the implied rate is **47x / 70x** too steep, and the "renewals-friendly" line shown is Pareto-dominated. Was R2's N-h at 15-30x; unrepaired, now worse. | **[computed]** exact DP + true Pareto set |
| **NEW FL-H** — *"the Night-5 crowd changed by 1,250 renewal fans"* said over a crowd that did not change | **LIVE, narrow but flatly self-refuting on the projector.** The identity does not close at the demand floor; **[computed]** 102/224 flat seasons break it, residual to +1,250; the card prints *"0 then 0 — 0 people, and that is renewals -1,250"*. Reachable from $84 (NY) / **$58 (MEM)** upward. | **[computed]** 224-case dial sweep + rendered card |
| **NEW FL-I** — *"the whole event dial is worth about +2 renewal points"* | **LIVE, and it is a pre-commit student claim.** **[computed]** false (buys 0) in **62% / 65%** of card-price states, and at the night cash-best price on **N1, N2 and N5** in both markets. Worsened by round 3's `planSlope` 1.8 -> 3.6 (56% -> 62%). | **[computed]** 280 states/market |
| **FL-E** (round 2, the dissent) — *"the Night 5 crowd changed because your renewals changed"* | **DEFUSED — this is round 3's real win.** **[computed]** 18/18 inversion cases name the spend channel, 0 name renewals; `biggestChannel` correct 168/168; the rendered card says "renewals were NOT the biggest thing that changed" where that is true. | **[computed]** rendered `synthesisCards` |
| **FL-F** (round 2) — *"nothing except tonight's card moves tonight's crowd"* | **DEFUSED.** `HOUSE_RULES[1]` now names both carried channels; it matches `curveFor` term for term. | source + **[computed]** |
| **FL-D** (round 2, magnitude) | **ESCALATED to FL-G above.** | — |
| **FL-A / FL-B / FL-C** (round 1) | **STILL DEFUSED** at the new constants (cash-max ends 15 points below flat; the spend channel is named and sized; the TV clause is true of `renewalReferencePrice`). | **[computed]** |
| **FL3** — *"charging high is greedy, charging low is kind"* | **STILL DEFUSED.** **[computed]** the $10 floor is **-20 (NY) / -9 (MEM)** on every card; 0/210 states have one price best on both books. | **[computed]**, harness P12 |
| **"the game's ceiling is a number the game got wrong"** | **STILL DEFUSED.** **[computed]** my DP's cash corner equals `bestFoundSeason` exactly, gap **$0**, both markets. | **[computed]** |
| **FL2 / FL10 / FL6** | **UNCHANGED**, carried (gate N6 out of scope). | harness P3/P10 |

---

## dominant-strategies

### 1. The season frontier — no dominant book, and the interior is thick

**[computed]** 22 (NY) / 24 (MEM) undominated season outcomes; the cash corner and the renewals
corner are both legitimate; a desk playing for cash gives up 35 points of a reachable range, a desk
playing for renewals gives up 6.01-7.54% of season cash. No exploit here.

### 2. "Never move the dial" is a DOMINATED strategy — and it is the only renewals-friendly line the room is shown

**[computed]** New York 84% @ $2,391,834 beats it by $1,153,622 **and +4 renewal points**; Memphis
80% @ $1,947,068 beats it by $1,101,636 at equal renewals. R2 recorded this as presentational. It is
now load-bearing, because P14's binding limb and both counterfactual notes and the synthesis card all
hang off this one dominated point. See FL-G and R5.

### 3. Spend the maximum on Night 3 — one right night, correctly bounded

**[computed]** maxing the dial changes best-cash by **N1 -$40,384 · N2 -$51,484 · N3 +$17,984 ·
N4 -$54,908 · N5 -$120,000** (New York) and **-$13,920 · -$20,660 · +$37,710 · -$23,640 · -$60,000**
(Memphis). Exactly one cash-positive night, in both markets. That is a lesson about timing, not an
exploit. **Cleared** — but note the renewals half of the dial's advertised value is fictional at most
prices (FL-I), so the dial is currently oversold on the one book it is oversold on.

### 4. The Night-4 capacity option — strictly dominated, and declared

**[computed]** over 42 reachable N4 states per market, opening the bowl changes best-cash by exactly
**-$95,000 (NY) / -$42,000 (MEM)** in **every single state**; it pays in **0 of 42**.
`SHOCK_REVEAL_COPY` says so. Unchanged and correct.

### 5. No cheap-is-kind exploit

**[computed]** the $10 floor costs -20 (NY) / -9 (MEM) renewal points on every card; the low arm
still bites inside the legal dial.

### 6. Not re-tested this round

Gate N4 ("pick the middle" on N3), the posted-curve channel (N8), `medianCash` (N6), the second
national-TV channel (N7). **NOT VERIFIED.**

---

## synthesis-map-verdict

**The link the dissent broke is repaired. The link P14 exists to defend is the one now broken.**

- **NIGHT 5 WAS NIGHT 1 — REPAIRED, and it is the best-built card in the module.** Every quoted desk
  carries its own computed split; the verdict sentence branches on `renewalsLed` rather than
  asserting a cause; the capacity clamp is named. **[computed]** correct in 168/168 sweep cases and in
  all five rooms I rendered. R16 link 1 and the path-dependence link no longer collide. **MET**, with
  one reachable corner (the demand floor, FL-H) that must be closed before it can be called sound.
- **TWO BOOKS, NO EXCHANGE RATE — NOT MET.** The card's season sentence is computed rather than
  asserted, and both numbers in it are real. But the comparison it stages is between the cash corner
  and a **dominated** point, so the only quantity a room can take away from it — what renewals cost —
  is wrong by **47x-70x**, and the frontier's actual shape (cheap first points, $51,478 for the last
  one) is never said. The formal economic concept this module exists to name is **incommensurability
  plus rising marginal cost**; the card gets the first half right and the second half backwards.
  R16 link 2 **regresses to NOT MET** at round 3, for a different reason than it failed at round 1.
- **REVENUE = PRICE x PEOPLE — unchanged and sound.** Grouped by `marketId` AND `cardId`, with a
  `high.turnout < low.turnout` guard. **[computed]** untouched by the retune.
- **THE TICKET IS NOT THE PRODUCT — unchanged and sound** (harness P4 reproduces).
- **THE CARD MOVED THE CROWD — unchanged; the confounded fallback is still honest about the price.**
- **Simplifications ledger (gate N1) — MET and improved.** **[computed]** the "25 fans per renewal
  point" entry matches `renewalFans`; the entry that records the felt-scale tradeoff is accurate as
  far as it goes and correctly tells the teacher to read the split rather than the bar. Two gaps
  carried from R2 remain unlisted (`renewalReferencePrice` as a modelled construct; no rival
  entertainment or resale market), and a third is now needed (the spend dial's renewals value is zero
  at most prices — FL-I).
- **Beyond-sports link — unchanged and still the strongest part of the chain.**

---

## required-repairs

### RULING 1 — dissent `econ-l1-n5-attribution`

The repair's three claims are **CONFIRMED by my own probe**, not accepted on the harness's word:
`repeatRowFor` computes each desk's exact channel split, the identity closes with residual 0
everywhere demand is off its floor (168 independent full-season cases, wider than P16's 36), the card
names the largest channel from data in 168/168 cases including 18/18 sign inversions, the rendered
copy in five real rooms says the true thing, and `HOUSE_RULES[1]` is now true of `curveFor` term for
term. R4's discharge limb (a) is met on its own falsifiable terms.

**DISSENT econ-l1-n5-attribution: DISCHARGED**

Two findings raised by that verification are **not** part of the discharged dissent and are filed
separately below (R6, R7). One correction to the assignment's framing: **it is not the case that
every `HOUSE_RULE` is now true of the model** — `HOUSE_RULES[2]`'s "+2 points" clause is false in
about two-thirds of the state space (R7).

### RULING 2 — the `renewalFans 25 / planSlope 3.6` tradeoff

**(a) The frontier is REAL.** 22/24 truly undominated season points, 7.54%/6.01% of season cash to
traverse, marginal cost rising >50x. The tension is material and honest to teach. Margin-at-bar is
**not** evidence the claim went marginal — it is evidence that P14's weakest limb is pinned against a
Pareto-dominated baseline (R5).

**(b) The felt-scale conflict is STRUCTURAL** — 84 swept constant pairs plus an arithmetic ceiling
(`renewalFans x 50` fans against a real 19,800/17,794-seat denominator) put the two requirements more
than 3x apart with no overlap. **Economics says keep P14 and lose the bar length**: a bar the room can
see that encodes an inverted two-book frontier is worse than a number the teacher has to read out,
because the whole module is built to make the two books not add up (CLAUDE.md §8, "a fun simulation
that teaches false economics fails"). The Player critic's bar is the right instinct and the wrong
lever.

**The honest synthesis copy that this ruling then requires:** the Night-5 beat must be presented as a
*measurement*, never as a *spectacle* — "read your two numbers and your split", not "look how much
the bar moved". And the SIMPLIFICATIONS entry must stop implying the smallness is only a projector
problem: the reason a renewal point is worth only 25 fans inside these five nights is that its real
value lands **next season, outside the model**, and that is exactly why the two books cannot be added.
Said that way the constraint becomes the lesson instead of an apology for it.

**Ruling on how the wave records it: SPLIT.**
- The **felt-scale gap** is **ACCEPTED-WITH-REASON** — structural, measured, and economics keeps P14.
- The **zero-headroom framing is an OPEN REPAIR (non-blocking, R8)**: the source comment's claim that
  every `renewalFans >= 30` fails P14 at every `planSlope` is **REFUTED** — 30/4.5 and 30/6.0 pass
  all four bars in both markets with headroom and a 20% larger beat. A false justification comment
  standing next to a shipped constant is how the next retune gets talked out of a real option.

### BLOCKING (category: economic-truth)

**R5 — the two-book season claim must be staged against the frontier, not against a dominated line.**
*Falsifiable discharge (all three limbs):* (i) `replaysFor` and the `TWO BOOKS, NO EXCHANGE RATE` card
carry at least one **undominated** renewals-friendly season from the model's own frontier — today
**[computed]** New York 84% @ $2,391,834 and Memphis 80% @ $1,947,068 both beat "never moved the dial"
on **both** books, so the row the room is asked to admire is one no desk should play; (ii) whatever
the card implies renewals cost is within a stated factor of the model's true marginal cost —
**[computed]** today it implies $1,178,672 for 15 points where the model charges $25,050, a **47x**
error at New York and **70x** at Memphis; (iii) a property in `l1-tuning-harness` asserts limb (i) at
season scale, i.e. that every season line the product PRINTS is on the Pareto frontier of its own DP —
P14 does not test this today and passes with a dominated baseline. Keeping the flat line as the
"what if we did nothing" row is fine and honest; presenting it as the price of renewals is not.

### NON-BLOCKING (required before the wave closes)

**R6 — `repeatRowFor` has no branch for the demand floor.** **[computed]** 102/224 flat seasons break
the identity (worst residual +1,250 fans); the reachable band starts at $84 (NY) and **$58 (MEM)**;
the card then prints *"0 then 0 — 0 people, and that is renewals -1,250"* and an opener claiming "a
different crowd walked in". *Discharge:* the row carries a `floored` flag alongside `clamped`, the
copy says what actually happened when nobody wanted in at that price, and P16's sweep includes at
least one price above each market's zero-demand threshold.

**R7 — `HOUSE_RULES[2]` / `spendRuleFor` / `marketFacts` overstate the spend dial's renewals value.**
**[computed]** false (buys exactly 0 points) in **173/280 (62%)** New York and **183/280 (65%)**
Memphis card-price states, and at the night cash-best price on N1, N2 and N5 in both markets — a
pre-commit claim on the student's own screen. *Discharge:* either the sentence is bounded ("up to two
points, and nothing at all if your price has already pushed renewals to the top or the bottom of
their range") or the ceiling/floor is applied before the spend term so the claim becomes true. Add
the departure to `SIMPLIFICATIONS`.

**R8 — the `renewalFans` justification comment at `fullHouse.ts:119-131` is false.** It asserts every
`renewalFans >= 30` fails P14 at every `planSlope` tried; **[computed]** 30/4.5 (margins 16/15) and
30/6.0 (17/16) pass all four bars in both markets on the fine spend grid, with a +720-fan beat instead
of +600. *Discharge:* correct the comment to what was actually swept, or move to a constant set that
carries headroom on the margin bar after a full 16-property re-run.

**R9 — P16's dominance limb is a tautology.** `if (top.size > 0 && top.size < Math.max(...channels.map(c => c.size))) ok = false;` — `top.size` **is** that maximum, so the condition can never be true and the
limb tests nothing. The property's stated purpose ("the board must never credit the smaller channel")
is carried entirely by its inversion clause. I verified the underlying behaviour independently
(168/168 correct), so this is a defective *check*, not a defective model — but a property that cannot
fail is not evidence, and this one is cited in the repair's own discharge argument.

**N-h (R2) — SUPERSEDED by R5 and escalated to blocking.**
**N-i / N-j / N-k (R2)** — the `CAPACITY_DEFENCE_COPY` source comment, the two missing
`SIMPLIFICATIONS` entries, and the dead `shifterCardBody` tail: **NOT RE-CHECKED this round** (out of
assigned scope). Carried.

**N-l (R2) — gate N2, N4, N6, N7, N8, N9 remain carried and NOT VERIFIED.**

---

## Dissent

`econ-l1-n5-attribution` is **DISCHARGED** on its own falsifiable terms (R4 limb (a)), verified by my
own probe rather than by the harness that the repair also wrote.

I record a **new formal dissent, blocking, category economic-truth: `econ-l1-two-book-baseline`,
on R5.** The module's central formalization — the two books that do not add up — is staged on the
projector against a season line that is Pareto-dominated by achievable play, and the exchange rate the
room is led to infer is wrong by a factor of 47 (New York) to 70 (Memphis). This was raised at round 2
as N-h, filed non-blocking at 15-30x, left unrepaired through the round the wave calls final, and made
worse by round 3's constants. Meanwhile the true frontier the model already contains — 22 and 24
undominated points, a renewal point costing $715 at the cheap end and $51,478 at the last — is the
richest economics in this build and is never said out loud. A decision to proceed does not erase this
dissent.
