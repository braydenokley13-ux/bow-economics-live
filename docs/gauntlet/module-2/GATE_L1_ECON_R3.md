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

---

## W3 ADJUDICATION

Economic Truth Critic · Boss run `m2-quality-war` · assignment `w3-econ-adjudicate` · 2026-09-01.
Owning-critic adjudication of the blocking dissent **`econ-l1-two-book-baseline`** (R5), which this
role filed at round 3. Fresh context; I built none of the repair. I re-derived every number below
myself rather than reading the repair's own instrument.

**Evidence basis.**

- **Observed (source, this session):** `runtime/src/modules/fullHouse.ts` at HEAD `72b7a2f`
  (`seasonFrontier`, `renewalsCornerSeason`, `renewalMarginalCost`, `replaysFor`, `synthesisCards`'s
  `seasonTradeoff`, `repeatRowFor`, `pathDependenceCardBody`, `repeatSummary`, `HOUSE_RULES`,
  `spendRuleFor`, `SIMPLIFICATIONS`, the `renewalFans` comment at 108-146) and
  `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` (P14 limb (v), P16).
- **Observed (computation, run by me this session):** `npm run build --prefix runtime` (clean);
  `npm test` from `runtime/` -> **352/352 pass**; `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`
  -> **16/16 PASS**. Then eight probes of my own in the scratchpad, all importing
  `runtime/dist/modules/fullHouse.js` so no shipped constant is re-declared: **(P1)** my own exact
  forward season DP over (renewals x carry) with true Pareto extraction over the final states,
  written independently of `seasonFrontier` and using only `curveFor`/`settleNight`/`renewalDelta`/
  `replayPlan`; **(P2/P3/P6/P7/P10)** real rooms driven through the shipped reducer
  (`takeSeat`/`setPrice`/`setSpend`/`lock`/`teacher:closeNight`) and then through the shipped
  `studentView`/`boardView`/`synthesisCards`, so every string quoted below is a string the product
  prints — including a 672-room price x renewals-path sweep of the floored copy branches;
  **(P4)** a `HOUSE_RULES` truth audit over all 280 card-price states per market plus every partial
  dial level; **(P5)** the frontier's per-point marginal-cost sequence; **(P8)** P16's own floored-case
  coverage; **(P9)** a constant re-test at five `(renewalFans, planSlope)` pairs against a **patched
  copy** of `dist/` in the scratchpad. Mutation testing of P16 was likewise done against a scratchpad
  copy of `dist/` and a scratchpad copy of the harness. **No repository file was modified except this
  gate document.**
- **NOT VERIFIED by me:** all real-world sports facts (Sports Reality's lane); projector legibility,
  fold behaviour and how any of this reads in a room; browser truth (I ran no browser and booted no
  server — nothing was listening on 4300 before or after).
- **Carried, out of scope this round:** gate N2, N4, N6, N7, N8, N9; N-i / N-j / N-k.

---

### mechanism-verdicts

#### Highest-severity finding first

**W3-a — NEW (economic-truth, non-blocking, required before the wave closes). The R6 floor repair
fixed the row and then printed a new false sentence over it: at the one-sided floor the projector
says "nobody walked in either time" beside a crowd of 542 / 670 people it prints in the same
clause.** This is R6's own defect class — a card asserting something the crowd numbers next to it
refute — reintroduced by R6's repair, in the band R6 named as the reachable one.

`repeatRowFor` sets `floored = rawWantedN1 < 0 || rawWantedN5 < 0` (an OR, correctly). But both copy
sites that consume it treat `floored` as if it meant *both* nights:
`pathDependenceCardBody` (`allFloored = readable.length === 0 && pool.length > 0`, line 3132) and
`repeatSummary` (`readable.length === 0`, line 2977). **[computed]**, the rendered card, from my own
probe of an ordinary five-desk room in which one Memphis pair held **$58** on Night 1 and Night 5
while the other four changed their Night-5 price:

> `1 desk charged the same price on both nights. Same day, same visiting club, same price — and at
> that price nobody walked in either time. Desk 1 · Memphis Grizzlies: 670 then 0 — -670 people — at
> this price demand ran out before the door on one of the two nights ...`

and the board summary beneath it, **[computed]** from the shipped `boardView`:

> `... 0 drew a bigger crowd the second time, 1 drew a smaller one. ... On every one of them the
> price was above what anybody in this model would pay, so nobody came either night — and a crowd of
> nobody cannot show what moved underneath it.`

670 people came on Night 1. The card says so and then says nobody came. A third site,
`repeatSummary`'s `flooredLine`, has the same bug in mixed rooms: **[computed]** with one readable
same-price desk present, the summary prints *"1 priced high enough that nobody wanted in at all"*
about the same 670-fan desk.

**[computed]** reachability, two independent sweeps: a 224-room flat sweep hits it at exactly
**$84 (New York)** and **$58 (Memphis)** — the two prices R6 itself named; a 672-room sweep that also
varies the Nights 2-4 prices (and so the renewals path) hits it in **11 rooms**, band **$82-$84
(New York)** and **$58 (Memphis)**. Narrow, and it is exactly the corner a "higher price, more money"
pair reaches at Memphis. **[computed]** P16 cannot catch it: of its 60 swept cases, **24 are floored
and all 24 are BOTH-nights-floored — zero are one-sided**, and P16 tests `repeatRowFor` only, never
`pathDependenceCardBody` or `repeatSummary`. No unit test covers either branch (`allFloored` and the
`readable.length === 0` branch appear nowhere in `runtime/src/test/`).

This does **not** touch the dissent under adjudication. It is filed as **W3-R10** below.

#### 1. R5 limb (i) — the printed renewals line is undominated. **MET.**

**[computed]**, my own exact DP, written independently of `seasonFrontier`: the true Pareto set is
**22 points (New York) / 24 (Memphis)**, and it matches the shipped `seasonFrontier` **point for
point, renewals and cash, with zero mismatches in both markets**. Every shipped frontier plan replays
through the shipped `replayPlan` exactly (**0 replay failures**), and **0 dominated pairs** exist
inside it. `renewalsCornerSeason` returns **100% @ $2,234,548 (NY)** and **100% @ $1,845,068 (MEM)**;
my DP's maximum-renewals point is the same number in both markets. The cash corner **65% @
$2,416,884 / $1,962,968** equals `bestFoundSeason` with a **$0** gap.

The dominated flat line is no longer the renewals row. **[computed]** the shipped `replaysFor` now
prints four rows, and the corner beats "never moved the dial" on **both** books
(NY +$996,336 and +20 points; MEM +$999,636 and +20 points) — and the flat row's own note says so out
loud: *"Never moved the dial. Safe, and beatable on BOTH books at once ... Doing nothing is not what
protecting your plan holders costs."* The dissent's requirement that the flat line stay as an honest
"what if we did nothing" row while being labelled beatable is met in the product's own copy.

#### 2. R5 limb (ii) — the implied exchange rate is the model's own. **MET, exactly.**

**[computed]** the shipped `TWO BOOKS, NO EXCHANGE RATE` card now prints: *"35 renewal points cost
$182,336 — about $5,210 a point on average."* My DP's true average marginal cost over exactly that
65% -> 100% range is **$5,209.6 -> $5,210**; Memphis prints **$3,369** against my **$3,369**. Ratio
**1.0000** in both markets. The 47x (NY) / 70x (MEM) error the dissent was filed on is **gone**, not
reduced — the printed rate is now the frontier's own rate by construction, because both quoted
corners are frontier points.

The richest sentence the dissent said was unspoken is now spoken, in both surfaces: the card prints
*"the cheapest points go for about $715 each and the last one costs $51,478"* and the counterfactual
row prints *"Protecting the base starts cheap and ends expensive."* **[computed]** both numbers
reproduce exactly on my own DP ($715 / $51,478 New York; $80 / $30,000 Memphis), and the dearest step
is genuinely the **last** point (99 -> 100) in both markets.

*One recorded simplification, not a falsehood (W3-R12):* **[computed]** the per-point cost is not
monotone — walking New York from the cash corner it runs
`$950, $1,648, $2,952, $1,100, $1,798, $715 ... $9,372, $13,500, $30,000, $51,478`, with **7 local
drops (New York) / 8 (Memphis)**. The trend is unmistakable (sub-$3,000 below 93%, $9,000-$51,478
above it) and "starts cheap and ends expensive" is true of it, but "*that rising price*" describes a
sawtooth, and the cheapest step is at 71 -> 77, not at the start. This belongs in `SIMPLIFICATIONS`.

#### 3. R5 limb (iii) — a property pins every printed season line to the frontier. **MET.**

P14 limb (v) is real and does the work: (v.a) replays every frontier point through the shipped
reducer, (v.b) checks pairwise non-domination, (v.c) requires the staged corner to be on the frontier
**and** to beat the flat line on both books, (v.d) requires the implied $/point to equal
`averageOverRange` and to sit inside `[cheapest, dearest]`, (v.e) requires `dearest > 5 x cheapest`,
(v.f) pins the cash corner to `bestFoundSeason`. **[computed]** I reproduced (v.a), (v.b), (v.c) and
(v.d) independently and all hold. Limb (v) was added inside P14 rather than as a new property, which
respects the wave's non-goal.

*Residual (W3-R11):* **P14's own title is now false.** It reads *"the never-move-the-dial line is not
Pareto-dominated"*, while its strongest limb (v.c) **requires** `corner.cash > flat.cash &&
corner.renewals >= flat.renewals` — i.e. requires that the flat line **is** dominated. The limb-(i)
comment block ("not Pareto-dominated *by the most-cash line*") is still true; the unqualified title
is not. A gate instrument whose headline asserts the negation of its own binding limb is how the next
round reads this evidence backwards.

#### 4. `HOUSE_RULES` — **[computed]** all five are now true of the model, or explicitly bounded.

Audited over all **280 card-price states per market** and, for the spend clauses, every partial dial
level.

- **[0]** — `PRICE_MIN` 10 / `PRICE_MAX` 120 match the printed `$10-$120`. **TRUE in source.** (The
  on-screen "dollars and nothing else" claim is browser truth — NOT VERIFIED by me.)
- **[1]** — matches `curveFor` term for term. **TRUE.** Residual imprecision carried from R3: the
  enumerated list still omits the desk's own price, introduced one rule earlier.
- **[2] — the R7 repair is CORRECT, and stronger than "bounded".** **[computed]** the full dial's
  renewals gain never exceeds **+2** — histogram over 280 states: New York `{0: 173, 1: 6, 2: 101}`,
  Memphis `{0: 183, 1: 5, 2: 92}`; **0 states exceed +2 at any partial dial level in either market**,
  so "AT MOST two points" is exact. And the named zero case is not a hedge, it is a complete
  characterisation: **[computed]** of the 173 / 183 zero-gain states, **0 occur off the
  `RENEWAL_DELTA_CEIL` / `RENEWAL_DELTA_FLOOR` clamp** — every single one is a night whose price had
  already pushed renewals to the top or the bottom, which is exactly what the sentence says. Clause 1
  ("never changes tonight's crowd") **0 violations / 280**; clause 2 ("tonight's books visibly worse")
  **0 violations / 280**. `spendRuleFor` carries the same bound in the same words on the student
  screen, and the `SIMPLIFICATIONS` entry R7 required is present, with the 62% / 65% measurement in
  it. **R7 DISCHARGED.**
- **[3]** — `net = total - bill - spend - bowlCost` unconditionally; **[computed]** an empty building
  at $120 nets exactly `-bill` in both markets. **TRUE.**
- **[4]** — **[computed]** one dial step under the plan price is still **+1**; the $10 floor is
  **-20 (NY) / -9 (MEM)**; `renewalReferencePrice` rises with Draw and a national listing pulls it
  down ($24.0 -> $56.2 at New York N3). **TRUE**, with R3's recorded offset residual (renewals turn
  negative $2.0-$5.0 *above* the reference line; **[computed]** all ten market-card pairs, unchanged).

#### 5. The floored branch does kill the identity-edge row. **MET at row level.**

**[computed]** at **$58 Memphis**, flat, through the shipped reducer and the shipped
`computeAggregate`: `floored=true`, `biggestChannel="none"`, and the row prints
*"-670 people — at this price demand ran out before the door on one of the two nights, so the crowd
cannot show what moved underneath it (renewals -1,075)"*. The old *"0 then 0 — 0 people, and that is
renewals -1,250"* is gone: at $120 flat the row now prints *"nobody wanted in at $120 on either
night, so the crowd was 0 both times — underneath it renewals -1,250, and none of it could reach the
door"*, which is true. `pathDependenceCardBody` and `repeatSummary` both filter floored rows out of
every "moved most by" claim. The **row** is repaired. The **card sentence layered on top of it** is
W3-a / W3-R10.

#### 6. P16 can fail. **[computed]** — four mutations, run against scratchpad copies.

Baseline: the copied harness against the copied `dist` **PASSes P16** and all 16. Then:

| mutation | where | P16 |
|---|---|---|
| swap the `renewals` / `spend` labels in `biggestChannel` | product | **FAIL** |
| `floored = false` (delete the floor detection) | product | **FAIL** |
| `if (floored)` -> `if (false)` (restore the old self-refuting floored copy) | product | **FAIL** |
| drop the price channel from the harness's own recompute | harness recompute | **FAIL** |

R9's replacement limb is live in both directions: it bites when the product lies and it bites when
the independent recompute is perturbed. **The tautology is gone. R9 DISCHARGED.**

#### 7. R8 — the `renewalFans` comment is corrected in code, and still false on the teacher surface.

`fullHouse.ts:122-135` now withdraws the ceiling claim explicitly, names what was actually swept
(`renewalFans 10-60 x planSlope 1.2-3.6`), records 30/4.5 and 30/6.0 as passing with headroom, and
ends "Do not cite this comment as a reason not to sweep." Constants unchanged, as declared.
**Correct.**

But **[computed]**, my own re-test against a patched copy of `dist/`, the same refuted claim is still
live in `SIMPLIFICATIONS[1]`, which is **teacher-facing**: *"25 is the largest setting at which they
still do [trade off]."*

| constants | P14 margin (NY / MEM) | range | cash share | Pareto pts | four bars | N5 beat |
|---|---|---|---|---|---|---|
| 25 / 3.6 (shipped) | 15 / 15 | 35 / 35 | 7.54% / 6.01% | 22 / 24 | PASS | +600 |
| 30 / 4.5 | **16 / 15** | 36 / 35 | 8.66% / 5.63% | 24 / 24 | **PASS** | **+720** |
| 30 / 6.0 | **17 / 16** | 37 / 36 | 8.25% / 5.15% | 24 / 25 | **PASS** | **+720** |
| **35 / 6.0** | **15 / 15** | 35 / 35 | 7.89% / 4.81% | 15 / 25 | **PASS** | **+840** |
| 30 / 3.6 | 15 / **14** | — | — | — | FAIL (MEM) | — |

25 is not the largest such setting; **[computed]** 35/6.0 passes all four P14 bars in both markets
with a **40% larger** beat. (I am not prescribing a retune — I checked P14's four bars only, not all
16 properties, and constant retuning is a declared non-goal of this wave. I am recording that the
sentence a teacher reads is false.) Filed **W3-R13**.

Two further stale source comments, same class, non-blocking: `fullHouse.ts:1595-1596` says carried
renewals move the base "by up to 500 fans" — **[computed]** at `renewalFans 25` it is **±1,250**; and
`fullHouse.ts:152-158` still states the flat *"The whole dial is worth about +2 points"* that R7
refuted and that R7's own repair replaced everywhere else. Filed **W3-R14**.

---

### false-lesson-risks

| id | risk | status at W3 | basis |
|---|---|---|---|
| **FL-G** — *"protecting your season-ticket base costs about $1.2 million"* (the dissent) | **KILLED.** **[computed]** the card now prints $5,210 (NY) / $3,369 (MEM) a point, which equals my own DP's true average marginal cost over exactly the printed range, ratio 1.0000. The staged renewals line is a frontier corner, undominated, and beats the flat line on both books. The 47x / 70x error is gone. | **[computed]** independent exact DP, point-for-point identical to `seasonFrontier` |
| **NEW FL-J** — *"nobody walked in either time"* said over a crowd of 670 | **LIVE, non-blocking, narrow, flatly self-refuting on the projector.** **[computed]** 11 of 672 swept rooms; band $82-$84 (NY) / $58 (MEM); both the synthesis card and the board summary; a third site (`flooredLine`) has it in mixed rooms. Introduced by the R6 repair. | **[computed]** 672-room sweep + rendered `synthesisCards` / `boardView` |
| **NEW FL-K** — *"25 fans a point is the largest honest setting"* | **LIVE on the TEACHER surface.** **[computed]** 30/4.5, 30/6.0 and 35/6.0 all pass P14's four bars in both markets; 35/6.0 gives a 40% larger beat. The code comment was corrected; `SIMPLIFICATIONS[1]` was not. | **[computed]** patched-`dist` re-test, 5 constant pairs |
| **FL-I** — *"the whole event dial is worth about +2 renewal points"* | **DEFUSED.** **[computed]** "AT MOST two" is exact (0/280 states exceed it at any dial level) and the named zero case is a complete characterisation (0/173 and 0/183 zero-gain states occur off the clamp). Ledger entry present. | **[computed]** 280 states/market + every partial dial level |
| **FL-H** — *"the Night-5 crowd changed by 1,250 renewal fans"* over an unchanged crowd | **DEFUSED at row level.** `floored` flag, `biggestChannel = "none"`, honest copy at $58 and at $120. Its card-level residue is FL-J. | **[computed]** rendered rows, both markets |
| **FL-E / FL-F** (round 2) | **STILL DEFUSED**; P16 now actually tests them (four mutations flip it to FAIL). | **[computed]** mutation testing |
| **FL-A / FL-B / FL-C / FL3 / "the ceiling is a number the game got wrong"** | **STILL DEFUSED.** **[computed]** my DP's cash corner equals `bestFoundSeason` with a $0 gap in both markets. | **[computed]** |
| **FL2 / FL10 / FL6** | **UNCHANGED**, carried (gate N6 out of scope). | harness P3/P10 |
| minor, observed, predates this repair | in a **one-desk** room the two-books card prints *"Best full house each market managed: New York Knicks 0% ... Median renewals: New York Knicks 0%"* for a market nobody played — `computeAggregate`'s `books` maps all `MARKETS` unfiltered (line 1203) and the card maps it unfiltered (line 3066). Not part of this dissent; recorded so it is not lost. | **[computed]** rendered card, Memphis-only room |

---

### dominant-strategies

1. **The season frontier — no dominant book, and the interior is thick. Cleared.** **[computed]**
   22 (NY) / 24 (MEM) truly undominated points on my own DP, matching the shipped one exactly;
   **0 dominated pairs** inside the shipped frontier; every point replayable through the shipped
   reducer with **0 failures**. A desk playing for cash gives up 35 points of reachable range; a desk
   playing for renewals gives up 7.54% / 6.01% of season cash.
2. **"Never move the dial" is still a dominated strategy — and the product now SAYS SO.** This is the
   dissent's substance and it is repaired at the surface, not merely in a field: **[computed]** the
   flat row's own note calls it *"beatable on BOTH books at once"* and quantifies both gaps
   (+$996,336 / +20 points at New York; +$999,636 / +20 at Memphis). It is retained as the honest
   "what if we did nothing" row, which is exactly what R5 permitted. **Cleared.**
3. **Spend the maximum on Night 3 — one right night. Cleared, unchanged** (harness P13 reproduces;
   not re-derived by me this round — carried from R3).
4. **The Night-4 capacity option — strictly dominated and declared. Unchanged** (carried from R3;
   not re-derived this round).
5. **No cheap-is-kind exploit.** **[computed]** the $10 floor is still **-20 (NY) / -9 (MEM)** on
   every card.
6. **Not re-tested this round, NOT VERIFIED:** gate N4, N6, N7, N8, N9.

---

### synthesis-map-verdict

- **TWO BOOKS, NO EXCHANGE RATE — NOT MET at round 3, now MET.** The card stages the model's central
  formalization between two **frontier corners**, both undominated, both replayable; the exchange
  rate a room infers is **[computed]** the model's own average marginal cost to four decimal places;
  and the card now names the second half of the concept it exists to teach — **rising marginal cost**
  — with the model's own numbers ($715 cheapest, $51,478 for the last point). R16 link 2 **regains
  MET**. The concept named is *incommensurability plus rising marginal cost*, and both halves are now
  said. One simplification to record: the rise is a trend, not monotone (W3-R12).
- **NIGHT 5 WAS NIGHT 1 — MET at row level, NOT SOUND at card level.** The decomposition, the
  `floored` flag, the filtered "moved most by" claims and the honest both-floored copy are all
  correct and **[computed]** verified in rendered rooms. But the opener and the verdict the card wraps
  around them are false in the one-sided-floor band (W3-a / W3-R10). The link is repaired; one
  sentence on top of it is not.
- **REVENUE = PRICE x PEOPLE · THE TICKET IS NOT THE PRODUCT · THE CARD MOVED THE CROWD** — unchanged
  and sound; not re-derived this round beyond confirming the retune did not touch them.
- **Simplifications ledger (gate N1) — MET, with one entry now false (W3-R13) and one entry missing
  (W3-R12).** The R7 entry the last round required is present and accurate. `SIMPLIFICATIONS[1]`
  carries the ceiling claim R8 refuted.
- **Beyond-sports link — unchanged.**

---

### required-repairs

#### The dissent

**R5's three falsifiable limbs are all met, verified by my own exact DP rather than by the repair's
own instrument:** (i) the staged renewals line is an undominated frontier corner that beats the flat
line on both books, and the flat line is retained and labelled beatable in the product's own copy;
(ii) the implied exchange rate equals the model's true average marginal cost over exactly the printed
range, ratio 1.0000 in both markets, against a 47x-70x error at round 3; (iii) P14 limb (v) pins
every printed season line to the model's own frontier and is a real check, not a label.

**DISSENT econ-l1-two-book-baseline: DISCHARGED**

R6, R7 and R9 — the three non-blocking repairs opened alongside it — are also discharged on their own
terms: **[computed]** the floored row flags itself and names no channel; `HOUSE_RULES[2]` /
`spendRuleFor` are bounded exactly and the zero case is a complete characterisation with a ledger
entry; P16's dominance limb fails under four independent mutations. **R8 is discharged in code and
NOT discharged on the teacher surface** (W3-R13).

#### NON-BLOCKING (required before the wave closes)

**W3-R10 — `floored` means "either night"; two copy sites read it as "both nights".**
**[computed]** 11 of 672 swept rooms print *"at that price nobody walked in either time"* (synthesis
card, `pathDependenceCardBody` line 3146) and *"nobody came either night"* (board summary,
`repeatSummary` line 2978) over a desk whose Night-1 crowd is printed in the same sentence as 542 or
670; a third site, `flooredLine` (line 2986), says *"priced high enough that nobody wanted in at
all"* about the same desk in mixed rooms. Band $82-$84 (New York) / **$58 (Memphis)** — the exact
corner R6 named as reachable. *Discharge:* the three sites branch on both-nights-floored rather than
on `floored`, and the one-sided case gets copy that is true of it; and **[computed]** P16's floored
band, which is 24 of 24 both-nights cases and zero one-sided, sweeps at least one one-sided pair per
market, with the card-level opener and verdict under test somewhere (they are under test nowhere
today).

**W3-R11 — P14's title asserts the negation of its own binding limb.** It reads *"the
never-move-the-dial line is not Pareto-dominated"*; limb (v.c) requires that it **is** dominated by
the staged corner. *Discharge:* the title says what limb (i) actually tests ("not dominated by the
most-cash line") or states both facts.

**W3-R12 — the frontier's marginal cost is not monotone, and no ledger entry says so.**
**[computed]** 7 local drops (New York) / 8 (Memphis) along the 35-point range; the cheapest step sits
at 71 -> 77, not at the start. The card's *"That rising price"* is true as a trend and not as a shape.
*Discharge:* a `SIMPLIFICATIONS` entry recording that the printed cheapest/dearest are the extremes of
a sawtoothed sequence with a strong rising trend, and what a sharp student who reads two adjacent
points could otherwise conclude.

**W3-R13 — `SIMPLIFICATIONS[1]` still carries the claim R8 refuted, on the teacher surface.**
*"25 is the largest setting at which they still do."* **[computed]** 30/4.5, 30/6.0 and 35/6.0 pass
all four P14 bars in both markets; 35/6.0 gives +840 fans against the shipped +600. *Discharge:* the
entry states what was actually swept and what the constraint actually is (the arithmetic felt-scale
ceiling, which stands), or matches the corrected code comment at 122-135. The felt-scale conflict
itself remains **ACCEPTED-WITH-REASON** and is not reopened.

**W3-R14 — two stale source comments beside shipped constants.** `fullHouse.ts:1595-1596` says
carried renewals move the base "by up to 500 fans" (**[computed]** ±1,250 at `renewalFans 25`);
`fullHouse.ts:152-158` still states the flat "the whole dial is worth about +2 points" that R7
refuted and replaced everywhere else. *Discharge:* both corrected to the measured numbers.

**Carried, NOT VERIFIED this round:** N-i / N-j / N-k (R2), gate N2, N4, N6, N7, N8, N9.

---

### Dissent

`econ-l1-two-book-baseline` is **DISCHARGED**. I record **no new blocking dissent**. W3-R10 through
W3-R14 are non-blocking and belong to this wave's close-out, not to a gate.

For the record, since the discharged dissent's own history is the argument for saying it: FL-G was
raised at round 2 as N-h and filed non-blocking at 15-30x, went unrepaired through the round the wave
called final, and reached 47x-70x before it blocked. The pattern that produced W3-R10 and W3-R13 is
the same one — a repair that fixes the mechanism and leaves the sentence, or fixes the comment and
leaves the ledger. Neither is blocking today. Both are how a 15x becomes a 70x.

**DISSENT econ-l1-two-book-baseline: DISCHARGED**
