# M2 L1 "Full House" — Economic Truth RE-CHECK, repair round 2

Economic Truth Critic · Boss run `m2-quality-war` · assignment `recheck2-l1-econ` · 2026-09-01.
Fresh context. I built none of this and none of either repair. FOCUSED scope: confirm-or-refute the
round-2 repair of the blocking dissent `econ-l1-season-books` (R1/R2/R3 of `GATE_L1_ECON_R1.md`), by
the same method the round-1 re-check used — my own exact season DP, re-run at the new constants.

**Evidence basis.**

- **Observed (source, this session):** `runtime/src/modules/fullHouse.ts` at HEAD `51d1e32`
  (`MARKETS` constants, `renewalDelta`, `renewalReferencePrice`, `spendRuleFor`, `renewalRuleFor`,
  `bestFoundSeason`, `replaysFor`, `synthesisCards`, `computeAggregate`/`repeatCard`, `HOUSE_RULES`,
  `SIMPLIFICATIONS`, `CAPACITY_DEFENCE_COPY`, `SHOCK_REVEAL_COPY`, `shifterCardBody`),
  `runtime/src/client/play/main.ts` (renewal rule and spend rule rendering, pre-lock),
  `runtime/src/client/teach/main.ts` (simplifications panel),
  `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` (P14).
- **Observed (computation, run by me this session):** `npm run build --prefix runtime` (clean);
  `npm test` from `runtime/` -> **352/352 pass**; `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`
  -> **14/14 PASS**. Then three probes of my own in the scratchpad, importing
  `runtime/dist/modules/fullHouse.js` so no constant is re-declared: (a) an **exact backward dynamic
  program** over (renewals 0-100 x carry) covering all 56 prices x all 25/13 spend levels x 5 nights,
  scalarized as `cash + lambda * finalRenewals` and swept over 17 lambdas — a global optimum per
  lambda, not a heuristic search; (b) a night-level sweep of cash-argmax vs renewals-argmax and the
  N4 bowl option over 210 reachable states per market; (c) a five-night trace of four named policies
  through the real `curveFor`/`settleNight`/`renewalDelta` to measure the Night-5 channels. Every
  number tagged **[computed]** came from those runs.
- **NOT VERIFIED by me:** all real-world sports facts (Sports Reality's lane); anything about how
  this reads in a room or on a projector; browser truth (I ran no browser and booted no server).
- **Out of scope this round, carried unverified:** the full P1-P13 re-run (spot-checked only, as
  assigned); gate N4 ("pick the middle" on N3); N6 `medianCash`; N7/N8 channel naming; N9
  `boxOfficeModule` registration.

---

## mechanism-verdicts

### Highest-severity finding first

**NEW FINDING (BLOCKING, economic-truth) — the retune cut `renewalFans` 60/55 -> 10 without touching
`eventFans`, and that inverted which channel drives Night 5. The `NIGHT 5 WAS NIGHT 1` synthesis card
now states a cause that is, for any desk that spent on Night 4, the smaller channel and often the
WRONG SIGN.**

The card (`synthesisCards`, `id: "path-dependence"`) prints a desk's two turnouts and then asserts:

> "Same day, same visiting club, same price — and a different crowd walked in, because four nights of
> your own choices had already moved your renewals."

Night 5's demand base carries **two** carried-state terms, not one:
`market.renewalFans * (renewals - 50)` and `carryFans = round(eventFans * lastNightSpend)`.
At the shipped constants those are **10 fans per renewal point** against **+1,200 fans (New York) /
+960 (Memphis)** for a maxed Night-4 spend dial. **[computed]**, real model, five-night traces:

| market | line | N1 -> N5 turnout | renewals into N5 | renewals term | Night-4 carry term |
|---|---|---|---|---|---|
| New York | $34/$48/$40/$90/$34, no spend | 14,142 -> 13,982 (**-160**) | 34% (from 50%) | -160 | 0 |
| New York | same prices, **$120,000 on N4** | 14,142 -> **15,202 (+1,060)** | **36%** (from 50%) | **-140** | **+1,200** |
| Memphis | $24/$36/$30/$84/$24, no spend | 12,060 -> 11,960 (-100) | 40% | -100 | 0 |
| Memphis | same prices, **$60,000 on N4** | 12,060 -> **12,940 (+880)** | **42%** (from 50%) | **-80** | **+960** |
| New York | flat plan, **$120,000 on N4** | 16,862 -> 18,322 (+1,460) | 76% | +240 | +1,200 |

In the New York row the desk's renewals fell **fourteen points** and 1,060 **more** people walked in.
`repeatCard` selects on `samePrice` only and carries no spend field, so this desk is exactly the kind
the card quotes. The room is shown a bigger crowd and told renewals caused it, while the desk's own
renewals column on the same board says renewals went down. Even in the best case for the card — the
flat plan with a Night-4 spend — the renewals channel supplies **240 of 1,460 fans (16%)**.

This is not the retune's only cost on that link: with no Night-4 spend at all the whole renewals
signal is now **+240 / -500 fans** on a 14,000-17,000 crowd (**+1.4% / -3.0%**), which is the
assignment's own figure and which I confirm. The mechanism is still real and still correctly signed;
it is now a small effect that a larger, differently-caused effect routinely swamps. `l1-tuning-harness`
P6 cannot catch this: both of its scenarios run **zero spend on Night 4**.

Related, and the same confusion: **`HOUSE_RULES[1]` is false and contradicts `HOUSE_RULES[2]`.**
Rule 1: *"Everything that will move tonight's crowd is printed on tonight's card ... Nothing else
moves it."* Rule 2, two lines later, says event money "lands on the NEXT night" — i.e. something not
on tonight's card moves tonight's crowd, by up to 1,200 fans, and so do carried renewals by up to 500.
Both channels are disclosed elsewhere on the same screen (`spendRule`, `renewalRule`, `spendReceipt`),
so nothing is hidden; the sentence that says nothing else exists is simply untrue of the model.

### 1. Season-level two-book frontier (R1) — **CONFIRMED, and it is a genuine frontier**

I re-ran my own exact DP. It reproduces the builders' P14 corners **exactly**, and I dispute none of
them. **[computed]:**

| market | never move the dial | most cash (DP, lambda=0) | most renewals | cost of buying every point |
|---|---|---|---|---|
| New York | $1,215,532 · **80%** | **$2,359,868 · 53%** | $2,194,836 · **100%** | $165,032 = **6.99%** of season cash |
| Memphis | $830,312 · **80%** | **$1,923,684 · 54%** | $1,808,240 · **100%** | $115,444 = **6.00%** |

All three round-1 discharge limbs are met:

- **(i) the flat line is no longer Pareto-dominated by the printed best line.** It ends **27 renewal
  points ahead** at New York and **26** at Memphis. At the old constants it was dominated by
  $1,452,308 **and +12 points**. The sign is corrected.
- **(ii) the cash-max season gives up a material share of the reachable range** — 47 points (NY) /
  46 (MEM), and buying them back costs 6.0-7.0% of season cash against the round-1 measurements of
  **1.15% / 0.47%** (and 3.4% / 4.7% with the spend dial off). A 6-15x widening.
- **(iii) it is asserted at season scale.** P14 is a season-scale property with four named bars
  (>=15 points, >=30 points of range, >=4% of cash, DP corner match). It is the right shape of test
  and it is the one the round-1 report said did not exist.

The interior is real, not two corners. **[computed]** my lambda sweep and P14 agree on a monotone,
**convex** frontier — New York 53%@$2,359,868 -> 64%@$2,355,848 -> 68%@$2,352,952 -> 82%@$2,329,548 ->
94%@$2,292,876 -> 95%@$2,288,308 -> 97%@$2,262,856 -> 100%@$2,194,836 (8 distinct points; Memphis 7).
Rising marginal cost per renewal point — about **$1,045/point** from 53% to 82%, about
**$18,700/point** from 95% to 100% — is exactly the shape a real season-ticket book has.

The mechanism that produces it is coherent and is the one the copy names. **[computed]** decomposition
of the New York cash-max line's renewal moves: N1 $24 **+6**, N2 $40 **-11**, N3 $42 **+10**,
N4 $94 **+10**, N5 $34 **-12**. The losses land on the quiet and TV-suppressed cards, where
`renewalReferencePrice` is low ($24 on N1/N5, $27 on N2) and the cash optimum is far above it; the
big cards still pay on both books. Raising `planSlope` 0.6 -> 1.8 is what makes the gouge arm outweigh
the tent peak there. Nothing here depends on renewals being lagged cash.

**Residual (non-blocking, see false-lesson-risks FL-D):** the flat plan is still **strictly dominated**
by an achievable line — **[computed]** $2,329,548 at **82%** renewals (feasible, spend cap respected)
beats it by $1,114,016 **and +2 renewal points**. "Never move the dial" is not on the frontier, so the
exchange rate the COUNTERFACTUAL card implies (27 points for $1.14M) is 15-30x steeper than the true
marginal one.

### 2. Spend -> renewals channel disclosed and correctly sized (R3) — **CONFIRMED**

`eventRenewalDollars` 24,000/10,000 -> **60,000/30,000**, so the whole dial is now worth
`eventMax / eventRenewalDollars` = **+2.0 points in both markets** (was +5 New York / +6 Memphis).
**[computed]** `spendRuleFor` prints "the full $120,000 dial is worth about **+2 renewal points** —
real, but small next to what your price does" (New York) and the $60,000 / +2 equivalent at Memphis.
The arithmetic is right: `Math.round((eventMax / eventRenewalDollars) * 10) / 10` = 2.0 exactly, and
`renewalDelta` adds `spend / eventRenewalDollars` before rounding, so +2 is the true ceiling.

Disclosure is on a **student** surface and **pre-commit**, twice:
`HOUSE_RULES[2]` ("It also nudges RENEWALS up a little on the night you spend it: the whole dial is
worth about two points") in the PLAY rules panel, and `market.spendRule` rendered beside the spend
stepper in `runtime/src/client/play/main.ts:2151`. Both sit inside collapsed `<details>` elements —
**observed in source, NOT VERIFIED in a browser** — so the channel is disclosed but one click deep.
R3's first discharge limb is met.

### 3. Previously-false `HOUSE_RULES` clauses (item 3) — **CONFIRMED FIXED**

- **N-a, the "not on national TV" clause: gone, and the replacement is true.** `HOUSE_RULES[4]` now
  says the Draw raises the price plan holders forgive "and a national-TV listing pulls that line back
  down". **[computed]** `renewalReferencePrice`: N1 $24 -> N3 $56.2 -> N4 $111.4 (New York), and N3's
  national listing pulls its reference from a would-be $97.6 down to $56.2. TV moves the line, not
  whether the arm fires — which is what the rule now says.
- **N-b, "below the plan price": now "well UNDER".** **[computed]** one dial step under plan is still
  **+1** on every card in both markets, two steps is -4, the $10 floor is **-20 (NY) / -9 (MEM)**.
  "Well under" is true; the old "below" was false at the first step.
- **N-d, the harness's stale P5 row: fixed.** P5 now prints "N4 cash $90 vs renewals **$108**" at New
  York. **[computed]** I get renewals-best $108 (+12) on that card. The printed row matches the model.

### 4. Other rewritten copy checked against the new constants (item 4)

- **`CAPACITY_DEFENCE_COPY` — TRUE as shipped, with an overstated source comment.** The student-facing
  claims check out: **[computed]** at +/-$10 the two errors are within **1%** on all 5 cards in both
  markets (ratios 0.99-1.00x); Night 4 at +/-$30 is **1.52x** (NY, low -$205,200 vs high -$135,000) and
  **1.54x** (MEM) — "about half again as much" is right. But the doc comment above it claims the two
  errors are "within 2% of each other on EVERY card in BOTH markets" at **$20** as well, and that is
  **false**: at Memphis N1/N5 the low side is truncated by the $10 price floor, so $20 out costs
  **-$65,660** low against **-$134,000** high (**0.49x**). The shipped sentence says "a couple of
  dollars", so no student-facing statement is wrong; the justification in the artifact is.
- **`SHOCK_REVEAL_COPY` — still TRUE.** **[computed]** over 42 reachable states per market, the best
  Night 4 with the bowl open is worse than with it closed by **exactly -$95,000 / -$42,000, zero
  exceptions**, and it only ever pays at or below $56 against cash optima of $90 / $84.
- **`shifterCardBody` N5 fallback (gate N5) — REWRITTEN and now honest.** The confounded branch no
  longer closes with "nothing else moved the crowd"; it says "Those are two different prices, so this
  pair does not prove it on its own — part of that gap is the price," and points the room at a clean
  comparison. Correct. **[observed]** the final unreachable return at line 2486 still carries the old
  "Nothing else moved the crowd" sentence, but it fires only when no market has both N1 and N2 curve
  points, i.e. never in a played session.
- **`SIMPLIFICATIONS` ledger — EXISTS and is accurate.** Six entries on the `/teach` surface
  (`teach/main.ts:475`), each with what / why / misconception risk. **[computed]** I checked every
  quantitative claim: "10 fans per renewal point" matches `renewalFans`; "$18 New York, $12 Memphis"
  matches `ancillary`; the entry naming the round-1 defect ("when it was large, chasing renewals also
  maximised cash") is a correct account of what I measured last round. Gate N1 is discharged. Two
  departures are still unlisted: `renewalReferencePrice` itself (the modelled claim that a plan
  holder's sense of "what tonight is worth" is a printed linear function of Draw and TV), and the
  absence of any rival entertainment or secondary market.
- **`replaysFor` notes — CONFIRMED computed from their own rows.** **[computed]** `renewalGap` = 80-53
  = **27** (NY) / 80-54 = **26** (MEM), both > 0, so both notes take the tradeoff branch and print
  "$1,144,336 more ... and it paid 27 renewal points for it" (NY; Memphis $1,093,372 / 26). The
  degenerate branch ("ahead on both books") exists and would fire if a future retune collapsed the
  frontier again. The flat note's premise — "Nobody's plan ever looked like a waste or a rip-off" — is
  **true**: at the plan price `renewalDelta` = +6 on every card, so the flat line lands at exactly 80%.

### 5. P1-P13 spot-check at the new constants (item 5) — no regression found

`npm test` **352/352** and the harness **14/14**, both run by me this session. Spot-checks of my own:

- **P5 / R4 dominance:** **[computed]** over 210 reachable states per market (5 cards x renewals 0-100
  step 5 x carry {0, max}), the cash-argmax and renewals-argmax are identical in **0/210** states;
  minimum separation **$10 (NY) / $8 (MEM)**. "No price is best on both" holds.
- **Tent reachability:** **[computed]** the $10 floor costs **-20 (NY) / -9 (MEM)** on every card,
  unchanged by the retune (`RENEWAL_UNDERCUT_SLOPE` untouched). The low arm still binds inside the
  legal dial; the cheap-is-kind exploit stays dead.
- **N4 bowl dominance (P11/B3):** **[computed]** strictly dominated at every state, margin exactly
  -$95,000 / -$42,000. Unchanged.
- **B2 / P13 cash ceiling:** **[computed]** my exact DP at lambda=0 returns **$2,359,868** (NY) and
  **$1,923,684** (MEM) — **identical to `bestFoundSeason`, gap $0**, on the same price and spend path
  (24/40/42/94/34 with $120,000 on N3; 18/32/32/88/24 with $5,000 on N1 and $60,000 on N3). The
  printed line is the global optimum of the no-bowl policy space, and the card still hedges it as
  "the best line we could search out". Correct and conservative.
- **One new asymmetry worth naming (non-blocking):** **[computed]** at New York Night 4 the worst
  renewals penalty available anywhere above the reference price is **-3** (the $120 dial top is only
  $8.60 above a $111.40 reference), while the cash optimum $90 pays **+9**. On the lesson's biggest,
  most dramatic night the two books point the same way at New York. P5 still passes there ($90 vs
  $108, $18 apart), but the night-level tension the module advertises is nearly absent on N4.

---

## false-lesson-risks

| id | risk | status at round 2 | basis |
|---|---|---|---|
| **NEW FL-E** — *"the Night 5 crowd changed because your renewals changed"* | **LIVE, worst risk in the lesson now.** Asserted on the `NIGHT 5 WAS NIGHT 1` synthesis card. For any quoted desk that spent on Night 4 the renewals term is 10-16% of the swing and can be the opposite sign: New York 14,142 -> 15,202 (+1,060) with renewals **down** 14 points. | **[computed]** five-night traces + `computeAggregate` source |
| **NEW FL-F** — *"nothing except tonight's card moves tonight's crowd"* | **LIVE, small but flatly false.** `HOUSE_RULES[1]` against `HOUSE_RULES[2]`: carried renewals (up to 500 fans) and last night's event spend (up to 1,200) both move the base. Both are disclosed elsewhere; the sentence denying they exist is not. | **[computed]** + copy read |
| **NEW FL-D** — *"protecting your season-ticket base costs about $1.1M"* | **LIVE, magnitude only.** The COUNTERFACTUAL baseline is off the frontier: 82% renewals is available for **$30,320** (1.3% of cash), not $1.14M. The card never claims an exchange rate, but the two rows it prints imply one 15-30x too steep. | **[computed]** exact DP |
| **FL-A** (round 1) — *"there is one best line and it is better at everything"* | **DEFUSED — this is the repair's headline win.** Most-cash now ends 27 (NY) / 26 (MEM) renewal points BELOW the flat line, and the full frontier costs 6.0-7.0% of season cash to traverse. | **[computed]** exact DP, reproduces P14 |
| **FL-B** (round 1) — *"the money you spend only buys tomorrow's crowd"* | **DEFUSED.** The channel is cut to +2 points, named in `HOUSE_RULES[2]`, and sized in `spendRuleFor` on the student's own screen before the commit. | **[computed]** + source |
| **FL-C** (round 1) — *"the bargain bonus is off on a national-TV night"* | **DEFUSED.** Clause struck; the replacement (TV moves the forgiveness line) is true of `renewalReferencePrice`. | **[computed]** |
| **FL3** — *"charging high is greedy, charging low is kind"* | **STILL DEFUSED.** $10 floor -20 / -9; 44 reachable states per market carry an undominated price above the night's cash optimum. | **[computed]**, harness P12 |
| **"the game's ceiling is a number the game got wrong"** | **STILL DEFUSED.** Exact DP gap $0 against the printed line, in both markets. | **[computed]** |
| **N5 fallback** — *"nothing else moved the crowd"* (gate N5) | **DEFUSED on the reachable branch.** The confounded fallback now names the price as part of the gap. | Observed in source |
| **FL2 / FL10, FL6** | **UNCHANGED** — four distinct cash optima; `medianCash` cross-market comparison still carried (gate N6, out of scope). | Harness P3/P10 |

---

## dominant-strategies

### 1. The season frontier — **no dominant book, first time in this build**

**[computed]** the cash corner ($2,359,868 / 53% NY) and the renewals corner ($2,194,836 / 100%) are
both undominated, with six undominated points between them. Round 1's finding — "the conservative book
is never a legitimate choice" — is **refuted at the new constants**. A desk playing for renewals gives
up real money; a desk playing for cash gives up 47 points of a 100-point book.

### 2. "Never move the dial" is still a dominated strategy — and that is the honest reading

**[computed]** $2,329,548 at 82% renewals beats the flat plan on **both** books ($1,114,016 and
+2 points). The flat plan is a naive baseline, not the renewals-optimal policy, and the product never
claims otherwise. Economically this is correct — flat pricing across a five-night spread of Draws
should be inefficient. The defect is presentational (FL-D): the only renewals-friendly line the room
is shown is one nobody should play.

### 3. Spend the maximum on Night 3 — a single dominant action, now correctly bounded

**[computed]** (harness P9, reproduced) maxing the dial on N3 is cash-positive at **+$14,800 (NY) /
+$35,760 (MEM)** *and* worth +2 renewal points; every other night is cash-negative
(NY N1 -$33,808, N2 -$47,980, N4 -$55,532, N5 -$120,000). Round 1 found N1-N3 all cash-positive; the
retune narrowed the free lunch to one night. A dial with exactly one right night is a lesson about
timing, not an exploit, and both of its effects are now published pre-commit. **Cleared.**

### 4. The Night-4 capacity option — still strictly dominated, still declared

**[computed]** 42/42 states per market, margin exactly -$95,000 / -$42,000; P11 and `SHOCK_REVEAL_COPY`
both say so. Unchanged from round 1.

### 5. Not re-tested this round

Gate N4 ("pick the middle" on N3), the posted-curve channel (N8), `medianCash` (N6). **NOT VERIFIED.**

---

## synthesis-map-verdict

**Three of the four evidence-bearing links are sound; the path-dependence link is now broken, and it
is broken by the same constant change that fixed the two-book link.**

- **TWO BOOKS, NO EXCHANGE RATE — REPAIRED.** The card's season sentence is computed from the same two
  rows the COUNTERFACTUAL card prints and reads, at the shipped constants: "the most cash we could find
  was $2,359,868 and ended at 53% renewals; never touching the dial made $1,215,532 and ended at 80%.
  More money, fewer season-ticket holders." **[computed]** every figure in that sentence is exact, and
  the degenerate branch (`gap <= 0`) exists so a future retune changes the sentence instead of falsifying
  it. R16 link 2 ("Two books, and the choice between them") is **MET** for the first time. The residual
  is magnitude, not direction (FL-D).
- **REVENUE = PRICE x PEOPLE — unchanged and sound.** Grouped by `marketId` **and** `cardId`, with a
  `high.turnout < low.turnout` guard before it will quote. Untouched by the retune.
- **THE TICKET IS NOT THE PRODUCT — unchanged and sound.** **[computed]** P4 reproduces: New York N3
  ticket peak $48 vs total peak $40 (4 dial steps), Memphis $36 vs $30 (3 steps).
- **NIGHT 5 WAS NIGHT 1 — NEWLY BROKEN.** The card names one cause; the model has two, and at the new
  constants the unnamed one is 5x larger (New York +1,200 carry fans against a best-case +240 from
  renewals). For a spending desk the named cause can point the wrong way. R16 link 1 ("money you spend
  lands on the next night") and the path-dependence link now **collide on the same card**, and the card
  resolves the collision in favour of the smaller channel. **NOT MET.**
- **THE CARD MOVED THE CROWD — improved.** The confounded fallback is honest about the price confound.
- **Simplifications ledger (gate N1) — MET.** Six entries, teacher surface, accurate. Two departures
  still unlisted (see mechanism-verdicts item 4).
- **Beyond-sports link — unchanged and still the strongest part of the chain.**

---

## required-repairs

### BLOCKING (category: economic-truth)

**R4 — `NIGHT 5 WAS NIGHT 1` must not attribute the Night-5 crowd to renewals when Night-4 spend moved
it more.** *Falsifiable discharge (either limb):* (a) `repeatCard` carries the desk's Night-4 spend and
its converted carry fans, the card quotes both channels with their sizes, and it only makes the renewals
claim for desks whose renewals term is the larger of the two — today **[computed]** a quoted New York
desk can show 14,142 -> 15,202 while its renewals fell 14 points, with the renewals term contributing
-140 of that +1,060; **or** (b) assert `carryFansFor` is zero into Night 5 by construction (no spend
offered on Night 4), so the only carried channel is renewals. Fixing the sentence alone is acceptable
under (a) only if the numbers it prints are the ones that caused the crowd. A synthesis card that names
the wrong cause is worse than one that names none: the room's own evidence refutes it on the projector.

### NON-BLOCKING (required before the wave closes)

**N-g — `HOUSE_RULES[1]` contradicts `HOUSE_RULES[2]` and is false.** "Nothing else moves it" is untrue
of a model where carried renewals move the base by up to 500 fans and last night's event money by up to
1,200. Suggested shape: "Everything NEW about tonight is on tonight's card. Two things you already did
also come with you: your renewals, and last night's event money." Same for the `NightCard.notes` doc
comment at `fullHouse.ts:284`.

**N-h — the COUNTERFACTUAL card's renewals-friendly row is off the frontier.** *[computed]* 82%
renewals costs $30,320, not $1,144,336. Add a fourth row from the model's own renewals corner (New York
$2,194,836 / 100%, Memphis $1,808,240 / 100%) so the room sees the frontier's real shape — cheap points
first, expensive points last — instead of an implied exchange rate 15-30x too steep. This is the
economically richest sentence available in the build and it is currently unspoken.

**N-i — `CAPACITY_DEFENCE_COPY`'s source comment overstates the measurement.** It claims the two errors
are within 2% at $20 either side on every card in both markets; **[computed]** Memphis N1/N5 are 0.49x
(-$65,660 low against -$134,000 high) because the $10 price floor truncates the low side. The shipped
sentence ("a couple of dollars") is true; the comment that certifies it is not.

**N-j — two departures missing from `SIMPLIFICATIONS`:** `renewalReferencePrice` (a plan holder's sense
of "what tonight is worth" is a printed linear function of Draw and TV, with no memory, no service and
no winning), and the absence of any rival entertainment or resale market.

**N-k — the unreachable `shifterCardBody` tail (`fullHouse.ts:2486`) still says "Nothing else moved the
crowd."** Dead in a played session; delete it rather than leave a false sentence in the file.

**N-l — carried unrepaired and out of scope this round:** gate N2 (concept map / track map pointers),
N4 ("pick the middle" on N3), N6 (`medianCash` cross-market), N7 (second national-TV channel), N8
(posted-curve channel), N9 (`boxOfficeModule` still registered). **NOT VERIFIED** this round.

---

## Ruling on the round-2 claims

| claim | verdict | my numbers |
|---|---|---|
| `renewalFans` 60/55 -> 10; renewals no longer lagged cash | **CONFIRMED** | a renewal point is now 10 fans (~$340-$500 of later-night cash, was ~$3,100); the cash-max season ends 27/26 points below flat |
| `planSlope` 0.6 -> 1.8 | **CONFIRMED** as the mechanism that makes the gouge arm bite | NY cash-max renewal path +6/-11/+10/+10/-12 = 53% |
| `eventRenewalDollars` $60k / $30k | **CONFIRMED** | whole dial = +2.0 points in both markets, printed |
| P14 (exact season DP + lambda sweep) pins the season claim | **CONFIRMED** | my independent DP reproduces every corner exactly; four named bars, season scale |
| the two-books card teaches the tradeoff at the scale P14 shows (80% vs ~53-54%, ~$1.1M) | **CONFIRMED** | $1,144,336 / 27 pts (NY); $1,093,372 / 26 pts (MEM) |
| HOUSE_RULES / CAPACITY_DEFENCE / N5 fallback / P5 rewritten from measurements | **CONFIRMED for HOUSE_RULES[2] and [4], the N5 fallback and P5; REFUTED for the CAPACITY_DEFENCE source comment**; `HOUSE_RULES[1]` was never re-examined and is false | see mechanism-verdicts 3-4 |
| SIMPLIFICATIONS ledger added | **CONFIRMED**, accurate, two gaps | six entries, `/teach` |
| COUNTERFACTUAL notes computed from their own rows | **CONFIRMED** | `renewalGap` 27/26 > 0, both notes take the tradeoff branch |
| no new false statement introduced by the retune | **REFUTED** | the `NIGHT 5 WAS NIGHT 1` card; see R4 |

## Dissent

The round-1 dissent `econ-l1-season-books` was recorded on **R1**, **R2** and **R3**. All three are
discharged against their own falsifiable conditions: R1 by an exact season DP that reproduces P14's
corners and shows a convex, 8-point, 6-7%-of-cash-wide frontier with the flat line no longer dominated;
R2 because both COUNTERFACTUAL notes are now read off the two rows they sit beside and the degenerate
branch exists; R3 because the spend dial's renewals effect is cut to +2 points and named with its
magnitude on the student's own screen before the commitment.

**DISSENT econ-l1-season-books: DISCHARGED**

I record a **new** formal dissent, **blocking, category economic-truth**, `econ-l1-n5-attribution`, on
**R4**: cutting `renewalFans` to 10 without touching `eventFans` made last night's event money the
dominant carried channel into Night 5, and the `NIGHT 5 WAS NIGHT 1` synthesis card still attributes
the whole crowd change to renewals — for a spending desk, with the wrong sign. The card that formalises
path dependence currently teaches the wrong path. A decision to proceed does not erase this dissent.
