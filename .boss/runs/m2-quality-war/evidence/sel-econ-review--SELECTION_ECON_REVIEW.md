# Module 2 — Selection Economic Review (independent, pre-opinion)

Economic Truth Critic · Boss run `m2-quality-war` · assignment `sel-econ-review` · 2026-08-31.
Fresh context. I built none of the three candidates and none of the Stage-0 harnesses.

**Evidence basis.** Observed (source): `design-a`, `design-b`, `design-c`, `econ-contract-report`,
`readme-l2l3`, `l3-arith-harness`, and the script `docs/gauntlet/module-2/stage0/l3-arith.mjs`.
Observed (computation, run by me this session): `node docs/gauntlet/module-2/stage0/l3-arith.mjs`
(exit 1, transcript reproduced by me and matching `readme-l2l3`), plus my own independent sweep over
Design C's published New York / Memphis constants — every number in this review tagged **[computed]**
was produced by that sweep and is re-derivable by hand from the closed forms given below.
**Not read, per assignment scope:** `proto-l1a`, `proto-l1b`, `proto-l1c`, `proto-l2`, `proto-l3`,
`readme-l1`, and the Stage-0 play review. Fun is not my lane.
**Not verified by me:** every real-world sports fact (`sr-input-report` owns those); anything about
how any candidate feels in a room; Design A's and Design B's arithmetic, because **neither publishes
constants** — see the falsifiability finding in `dominant-strategies`.

Closed forms used throughout (linear demand `q = clamp(B − k·p, 0, cap)`, per-fan ancillary `a`,
gate-only sharing rate `s`):

- ticket-revenue argmax `p_t* = B/(2k)`
- total-revenue argmax `p_T* = B/(2k) − a/2`
- sharing argmax `p*(s) = B/(2k) − a/(2(1−s))`, so the sharing-induced price move is
  **`a·s / (2(1−s))`, and it is zero whenever the capacity clamp binds at `p*`**
- reinvest argmax under Design C's L3 take function `r* ∝ (1−s)²`

---

## mechanism-verdicts

Per candidate, per lesson. Each verdict answers: does the mechanic instantiate the claimed concept
(delete-it-and-numbers-change), can a sweep/copy reach the optimum without economic reasoning, and is
any taught claim false at mechanism level.

### Highest-severity finding first

**A-L3 does not instantiate C6, and its arithmetic teaches the inverse of the lesson it claims.**
`design-a` L3 Beat 3 returns the room to "one homestand, same market, same L1 Box Office Counter,
same three-night slate structure" — a **solo** pricing round. Its take function is
`(1 − s)·own gate + equal share of pot + national money`. There is **no term in any seat's payoff
that depends on any other seat's decision.** L2's interdependence is switched off for the entire
lesson in which the sharing rule is executed. Consequences, all at mechanism level:

1. For a net payer, take is **strictly and monotonically decreasing in `s`**, with no offsetting
   channel of any kind. The design's own stated FL4 antidote — "sharing must *raise the payer's own
   payoff through the product*" — has no mechanism. `design-a` asserts it in a parenthesis
   ("a league where nobody can afford to put on a show has no shows to sell"); nothing in the model
   computes it. The contract's C6 minimum instantiation is **not met**.
2. The target sentence "sharing helped, and here is what it cost" is therefore **unearnable from the
   room's own numbers**. Only the cost half is computable. What A's L3 actually demonstrates is
   "sharing is a tax that made the league poorer" — the design says so itself ("the league's total
   revenue, before and after — lower"). That is FL4 inverted and it lands on the module finale.
3. A's own signature board moment ("every pair's arrow points the same way") additionally rests on
   an untaxed ancillary stream that `design-a` never states it has. A's stated reason for the price
   move is that "the HOUSE cost of a high price is not shared" — but HOUSE is R4's *non-money* second
   book. A uniform tax on the cash book **cannot move the cash argmax** (scaling by `(1−s)` does not
   move a maximizer). The only thing that can move it is untaxed in-arena spend, which the sharing
   base must then exclude. Under that reading the move is `a·s/(2(1−s))` — and it is **zero for any
   capacity-saturated market** (`l3-arith-harness`, my re-run, and my closed form agree).

I treat A-L3 as blocking on economic-truth in its current form. See `required-repairs`.

### Candidate A — "The Box Office, Evolved"

| Lesson | Concept claimed | Instantiated? | Sweep/copy reachable? | False claim at mechanism level? |
|---|---|---|---|---|
| **A-L1 "Full House"** | C1, C2, C12, C9, R4 two books | **Partly.** C1 and C12 yes (gate line, per-fan line — deletable terms exist). C2 **as specified is decoration for the price decision.** | **Yes — dominant strategy present as specified.** | **Yes.** |
| **A-L2 "You Don't Play Alone"** | C5, C4, C3, C10 | **Yes.** Two-sided crossing term (showcase × host capacity × congestion); delete the visitor term and every host night returns the same number. Strongest C5 instantiation in the war after B's. | Not by sweep — the payoff depends on a simultaneous hidden choice by another seat. Congestion makes "everyone showcases at the biggest market" self-defeating. Clean. | Not found. Congestion is a real rivalry-in-attention effect and is honestly labelled a simplification. |
| **A-L3 "Writing the Rule"** | C6, C7, C8, C9 | **No** for C6 (see above). C7 is instantiated *only* under the untaxed-ancillary reading, and then only for slack-demand markets. C8 (rule executed on the chooser's books) yes. | The rule-writing beat is not sweepable. The played season under it is A-L1 again. | **Yes** — the "sharing raises the payer's payoff" claim and the "all arrows move" claim. |

**A-L1's false claim, stated precisely.** `design-a` specifies "a hidden linear demand curve per
market, shifted by three named, announced, attributable **multipliers** — opponent draw, day-of-week,
and the HOUSE state." **[computed]** A multiplicative level shifter `q = m·(B − k·p)` leaves the
argmax price *exactly invariant*: my sweep over C's NY constants returns argmax **$48 at m = 0.6,
m = 1.0 and m = 1.6**. An additive intercept shift moves it: **$34 / $48 / $60** for `B − 8000 / B /
B + 8000`. Therefore, as A specifies its own demand system:

- The lesson's stated payload — *"the profitable price **moves** night to night"* and *"no single
  number survives the lesson"* — is **false in A's own model**. What moves is the crowd, not the
  best price. A student who prices at the Replay peak every night is **exactly optimal on the cash
  book on every night**, and the class evidence would show it.
- A's dissent-resolution claim that "lock the Replay peak is now a heuristic, not a solution … it is
  right only when tonight's mix matches last week's, which the slate generator must ensure is never
  true" is **wrong under multiplicative shifters**: it is right on every night regardless of mix.
- This is repairable in one line (shift the intercept and/or the sensitivity, never the level), but
  it is not currently repaired, and it is the exact failure mode `econ-boxoffice-unrepaired`
  finding (2) describes, reintroduced by a different route.

**A-L1's R4 structure re-creates FL3.** A specifies "cash peaks at an interior price; the house is
monotonically better as price falls." **[inferred from spec]** With a single-peaked cash book and a
monotone-decreasing house book, **every price above the cash peak is weakly worse on both books** —
strictly dominated. Every price below the cash peak is a defensible tradeoff. The model therefore
encodes "pricing high is never a legitimate choice; pricing low always is," which is FL3 with the
sign preserved. R4 is satisfied on its letter (no action best on both) and defeated on its purpose.

### Candidate B — "Substantial Refound"

| Lesson | Concept claimed | Instantiated? | Sweep/copy reachable? | False claim at mechanism level? |
|---|---|---|---|---|
| **B-L1 "Season on Sale"** | C1 (quantity side), C2, C12, C9, C10, intertemporal tension | **Concept yes, constraint no.** The release→rate transition is a real inverse-demand instantiation. But the *intertemporal* tension rests on a false scarcity — see below. | **Not fully cleared.** The release dial has the same bisectable single-peak structure the design says it killed. Protection is the absent preview, not the verb. | **Yes — one, and it is structural.** |
| **B-L2 "Somebody Else's Building"** | C5, C4, C3, C10, C9 | **C5 yes** (visitor DRAW enters the host's crowd; deletable crossing term). **C10/C3 at risk of being decoration** — see the dominated-lever finding. | Sections/DRAW is a best-response problem, not sweepable. But "never spend on DRAW" is a candidate dominant strategy the design *predicts and endorses*. | Not found beyond the DRAW dominance question. |
| **B-L3 "Who Keeps the Money"** | C6, C7, C8, C9 | **Yes, and this is the best C6 instantiation in the war.** The visitor's-share dial pays a team for value it creates in someone else's building — that is internalising the externality L2 just taught, not a transfer. The condition dial is the moral-hazard brake. Both are *differential*, not uniform, so both move argmaxes. | Not sweepable; payoffs depend on a flipped schedule and on others' DRAW. The veil (rule binds a season whose home/road shape flips) genuinely defeats vote-my-assignment. | Not found. |

**B-L1's structural falsehood.** `design-b` states: "Blocks you did not release earn nothing tonight
and are still yours tomorrow. **Blocks you released are gone.**" The building is 100 blocks; six
nights draw down that one stock. **Arena capacity is a flow, not a stock** — a seat sold on Tuesday
is available again on Thursday. As written, the constraint that produces B's headline R1 repair
("the season-optimal plan is not the sequence of per-night optima") is a fiction. The *pass* stock is
real and sound (season-ticket holders do occupy a seat on every date, which is exactly why clubs cap
season allocations on premium dates). The nightly-consumption stock is not. If capacity regenerates
nightly — as it must — the cross-night linkage reduces to the pass/spot tradeoff, "path dependence
felt eight times" dies, and B's claimed repair of `econ-boxoffice-unrepaired` finding (2) needs
re-deriving from the pass channel alone. Not fatal; not currently true.

**B's second mechanism-truth item.** "Price is what the system does back to them when they decide how
much to put on the market" is legitimate economics (quantity-setting against inverse demand) and it
carries a real misconception risk B does not ledger: real box offices **post prices**; they do not
run a market-clearing auction. A student can leave B-L1 believing sellers do not set prices. R11
entry required.

**One genuine economic-truth advantage to B, which no other candidate has.** **[computed]** In
price-setting, a multiplicative demand shifter leaves the decision variable unmoved (argmax $48 at
every multiplier). In quantity-setting, the same shifter moves the decision variable directly
(`q* = m·B/2`). B's verb is therefore **structurally immune to the shifter trap that A-L1 fell into**
and that C-L1 avoids only by explicitly keying sensitivity as well as base to the card.

### Candidate C — "Clean-Room First Principles"

| Lesson | Concept claimed | Instantiated? | Sweep/copy reachable? | False claim at mechanism level? |
|---|---|---|---|---|
| **C-L1 "Full House"** | C1, C2, C12, C9, C10, R4 | **Yes, and verifiable.** C keys **both `base` and `sensitivity`** to the night card — the one design that avoids the multiplicative trap by construction. C12 verified real at its own constants. | **Cleared on the price dial** — no payoff field exists pre-commit (strongest R2 discharge in the war). Copy-a-neighbour survives across nights (same market, same card, prior night's curve is posted). Minor. | **Yes — two, both computed off C's own published constants.** |
| **C-L2 "You Don't Play Alone"** | C5, C4, C3, C9, C10 | **C5 yes** (visitor term in `base`; C names the deletable term). **C3 weak** — C concedes this itself; the fast-pipe/slow-pipe decision is one lag choice, thin but non-zero. | Reinvest under diminishing returns to a market-independent ceiling has an interior optimum; not sweepable because the visitor's Draw is another desk's choice. | The market-independent Draw ceiling is a playability guardrail presented as a fact. Ledgered as "money buys Draw, never wins" but the **equal ceiling** is not ledgered. |
| **C-L3 "Writing the Rule"** | C6, C7, C8, C9, C14 (synthesis only) | **C7 yes and it is the only C7 mechanism in the war that survives the `l3-sharing-argmax` dissent intact** — see below. **C6's redistribution half yes; C6's "pays the payer" half is asserted, not computed.** | The high-share endgame is degenerate — see `dominant-strategies`. | **Yes** — the "interior best share > 0 for every market, including the biggest" summit claim. |

**C-L1 false claim 1 — R6 fails at C's own constants, against the *low* price.** **[computed]** At
New York (`cap 19800, B 34000, k 300, a 18`) the total-revenue argmax is $48 and the capacity kink is
at $47.33, so the optimum sits **one grid step above a hard clamp**. Regret for erring one step high
vs one step low:

| market | Δ | over-price regret | under-price regret | ratio (under/over) |
|---|---|---|---|---|
| New York | $2 | $1,600 | $26,400 | **16.50×** |
| New York | $4 | $5,600 | $66,000 | **11.79×** |
| New York | $6 | $12,000 | $105,600 | **8.80×** |
| Memphis | $2 | $240 | $1,840 | **7.67×** |
| Memphis | $4 | $2,560 | $5,760 | 2.25× |
| Memphis | $6 | $6,960 | $11,760 | 1.69× |

C's own claimed R6 test is "`loss(p* + Δ) / loss(p* − Δ)` within 3× across the grid." **It fails at
both of C's markets at Δ = $2, and fails at New York at every Δ tested.** The asymmetry runs the
opposite way from the legacy Box Office model's: here the *cheap* price is punished up to 16.5× harder
than the expensive one. Two notes: (a) at Memphis the asymmetry is a pure grid artifact — the true
peak is $24.77 and $24 is the nearest grid point — which shows R6-as-grid-offsets is the wrong metric
(this partially vindicates A's dispute); (b) at New York it is **real structure**, the capacity kink,
and it is real economics, but it is currently undefended and undebriefed.

**C-L1 false claim 2 — the resale line is a rhetorical loss, not an arithmetic one.** Both `design-a`
and `design-c` claim resale capture "discharges R6 without a value judgment." It does not add a
dollar. The team's loss from underpricing is the forgone gate, already fully counted on the cash
book; resale capture is buyer surplus transferred to a third party. Presenting it as an additional,
"real, dollar-denominated" loss of the same order **double-counts one loss and inflates the case
against the low price** on top of the 16.5× structural asymmetry above. Two anti-low-price devices
stacked on one book.

**C-L1 false claim 3 (FL6 by construction, stronger than C's own weakness #5 admits).** **[computed]**
Memphis's maximum possible fill at its own constants is **75.3% at the $10 price floor** and **54.8%
at its optimum**; New York is **99.0% at its optimum and 100% at the floor**. Memphis therefore
**cannot fill its building at any legal price on any night of L1.** The board will show the big market
sold out and the small market half dark, five nights running, in a lesson whose R8 obligation is to
contain a small-market success path. C's stated small-market path ("Memphis hosting a Draw-90 visitor
out-earns New York hosting a Draw-15 visitor") lives entirely in L2, is **not verified** — no visitor
term is specified — and holds at best on **one night's gate**, while C's own pipe table gives New York
$3.2M weekly local media against Memphis's $0.25M, so the full weekly take favours the big market
always. R8's "at least one small-market success path in the class evidence" is currently satisfied by
a cherry-picked sub-metric.

**C-L3's summit claim is unverified and structurally doubtful.** C writes: "for **every** market
including the biggest one in the room, there is an interior best share that is greater than zero …
This is the module's intellectual summit and **it is arithmetic, not assertion**." No arithmetic is
supplied. **[inferred]** The claim needs the pot to raise recipients' Draw by more than it costs the
payer. But C's own moral-hazard term reduces *everyone's* reinvest incentive — **[computed]** from C's
L3 take function `r* ∝ (1−s)²`, so `r*` falls 36% → 29% → 23% → 18% → 13% → 9% across `s = 0 … 0.5`.
The pot payout is unconditional except the 15% CONDITION switch, so a recipient may bank it. If the
room votes CONDITION off, sharing plausibly *lowers* total league Draw and the payer's own gate falls
too — the summit claim inverts. This must be brute-forced before it is spoken aloud in a classroom.

---

## false-lesson-risks

Ordered by damage to a grade 5–6 mental model, worst first. FL ids are the contract's.

### The single worst false-lesson risk in the war

**A-L3's "sharing is a tax that makes the league poorer" (FL4, inverted).** It is worst on all three
axes that matter: it lands on the **module finale**, on **C7/C6 — the concepts D2 names for M2 that
no other module owns** — and it is **structural, not tunable**: A's L3 has no cross-seat term at all,
so no retune produces the "sharing pays the payer" half. A room that plays A-L3 as specified has the
room's own numbers proving sharing cost them, and a teacher asserting the opposite. That is exactly
the shape CLAUDE.md §8 forbids: "a fun simulation that teaches false economics fails," and it is a
worse failure than the legacy model's, because the legacy model merely failed to teach a concept
while this one teaches its negation with the class's own evidence behind it.

### Full register

| Risk | Carried by | Severity | Basis |
|---|---|---|---|
| **FL4 inverted** — "sharing is a tax that makes everyone poorer" | **A** (structural, L3) | Blocking | Observed in `design-a` L3 take function; no cross-seat term exists |
| **FL4 inverted, weaker form** — sharing's payer-benefit asserted not computed | **C** (L3 summit claim) | High | Inferred; C supplies no arithmetic for the claim it labels arithmetic |
| **FL10 / "there is a right price"** — the best price never actually moves | **A** (L1, multiplicative shifters) | High | **[computed]** argmax $48 at m = 0.6/1.0/1.6 |
| **FL3 inverted** — "price high; low prices are for suckers" | **C** (L1: 16.5× low-side regret + resale double-count), **A** (L1: every price above the cash peak dominated on both books) | High | **[computed]** for C; **[inferred from spec]** for A |
| **FL6 / destiny** — "small markets have empty buildings" | **C** (L1 two-market slate; Memphis max fill 75.3%) | High | **[computed]** |
| **"Sellers don't set prices"** (new; not in the contract's register) | **B** (L1 quantity verb) | Medium | Observed in `design-b`; not ledgered under R11 |
| **False scarcity** — "a stadium's seats run out over a season" | **B** (L1 nightly block consumption) | Medium | Observed in `design-b` L1 beat 4 |
| **FL7 / money buys wins** | None operated. **C** ledgers the money→Draw substitution; **B** removes the surface entirely; **A** has no conversion. | Cleared | Observed |
| **FL5 / outcome bias** | None. All three ship counter-cases (Boston 2025 ↔ OKC/Harden 2012; C adds Kings 22-8 and Luka/Flagg) with no matching score. C's are the most complete and dated. | Cleared, subject to `sr-input-report` | Observed |
| **FL8 / TV money is free** | **C** ledgers and debriefs it explicitly ("in exchange they say when your team plays"). **A** names it in a repair. **B** ledgers it. | Cleared | Observed |
| **FL9 / 30 competing businesses** | Cleared in **B-L2/L3** and **C-L2**; cleared in **A-L2** but **re-broken in A-L3**, which switches the league off for the finale. | Mixed | Observed |
| **FL1 / revenue is the goal** | All three carry two boards. **A's** and **C's** second board is monotone in price, which makes it a tiebreaker rather than a genuine second objective; **B's** CASH↔BASE has two-sided structure on both axes. | Mixed | Inferred |

---

## dominant-strategies

Sweep test applied per candidate: *can a student reach the payoff-maximising action by mechanical
search, by copying a neighbour, or by one fixed rule, without reasoning about scarcity, conditions or
other people?*

### A — one found (blocking), one cleared, one dead lever

- **A-L1 — FOUND. "Lock the Replay peak."** **[computed]** Under A's own stated multiplicative
  shifter model the cash argmax is invariant to opponent draw, day-of-week and HOUSE state: sweep
  returns **$48 at every multiplier**. The Replay readout is computed on last period's shifters —
  which, under multiplication, has the *same peak* as tonight. So the fixed rule "read the Replay
  peak, lock it" is optimal on the cash book for every seat in every round. This is R1(b) failed
  outright, and it is the same class of failure as the legacy preview leak arriving through the front
  door instead of the back. Breaker: shifters must move the intercept and/or the sensitivity.
- **A-L2 — CLEARED.** Simultaneous hidden booking + showcase with a congestion term. No fixed rule
  survives: "always Big Room" loses rent on a dark night, "always showcase at the biggest market" is
  defeated by congestion, "always small room" forfeits the marquee upside. Best C5 clearance in the
  war alongside B-L2. Copy-the-neighbour fails because the neighbour's payoff depended on a choice
  they made blind.
- **A-L3 — partially degenerate.** The rule-writing beat is not sweepable, but the played season
  under it is A-L1 with a scalar on the cash book. If the untaxed-ancillary reading is not adopted,
  the *same* fixed rule from A-L1 remains optimal under every share, and the signature board moment
  produces a row of flat arrows.

### B — one found (self-declared), one un-cleared, one cleared

- **B-L2 — FOUND, and the design endorses it.** `design-b`'s teacher flow says: *"WATCH FOR: the room
  converging on 'never spend on DRAW' (the predicted equilibrium and the desired one — do not rescue
  it; it **is** the finding)."* B cannot have this both ways. If "never spend on DRAW" is optimal for
  every seat in every week, then **R1(b) fails for B-L2** and C10 and half of C3 are decoration on
  the lesson's second lever — the contract's own INSTANTIATION test, applied to B's own words. If it
  is *not* optimal for every seat, the predicted convergence is a misprediction and the finding B
  builds its L2 debrief on does not exist. B must pick one and brute-force it. (There is a coherent
  third reading — DRAW under-provision is a real free-rider result where the *private* optimum is
  positive but below the social optimum — but that is a different, better finding and B does not
  state it.)
- **B-L1 — NOT CLEARED, and unfalsifiable as written.** The release dial is a bounded single-peaked
  search exactly like the price dial B killed; B's stated justification for the kill ("bisectable in
  three moves") applies verbatim to its own replacement. B's actual protection is the absent preview,
  which A and C also have. Whether the season-optimal release path differs from the per-night optima
  cannot be checked, because **`design-b` publishes no constants at all** ("every dollar figure I
  propose is an illustrative shape … not a specified constant"). This is a real disadvantage in a
  truth review: B is the only candidate whose central R1 claim I cannot test even in principle.
- **B-L3 — CLEARED, and best in class.** The visitor's-share dial and the pool dial tax *different*
  bases (one night's gate to the traveller; local revenue to a pot) and the condition dial gates
  payout on effort. None of these is a uniform scalar on the whole objective, so all three genuinely
  move argmaxes. The schedule flip is a real veil that defeats vote-my-assignment. Two-thirds
  adoption defeats headcount dominance.

### C — one found (endgame degeneracy), the rest cleared

- **C-L3 — FOUND, at high adopted shares.** **[computed]** From C's own L3 take function,
  `r* ∝ (1−s)²`: reinvest optimum falls 36% → 9% of base as `s` goes 0 → 50%, and to 5.8% at `s = 60%`
  (C's dial maximum). At the top of the dial the optimal action for **every** seat in **every** week
  is "reinvest ≈ 0." That is simultaneously C's intended moral-hazard lesson and a **12-minute season
  in which no decision matters** — an R14 violation ("every reachable opening must contain a decision
  whose outcome differs materially") produced by the room's own vote. The CONDITION switch is the only
  brake and the room may vote it off. Breaker: floor the Draw decay, or make CONDITION non-optional,
  or cap the SHARE dial where the interior optimum survives (brute-force the cap).
- **C-L1 — CLEARED on search.** No payoff field exists pre-commit; base *and* sensitivity are keyed to
  the card so the argmax genuinely moves; N4 is capacity-clipped, which is a different optimisation
  rule entirely (raise to the kink, or buy capacity). **Copy-a-neighbour is partially open:** every
  pair in a market faces the identical card, and the previous night's full room curve is posted, so on
  N2–N5 a pair can read the market's realised curve and interpolate. That is not fatal — extrapolating
  a known curve onto a changed card is the actual job, and C's own U1 fallback proposes exactly that —
  but it should be named rather than claimed as cleared.
- **C-L2 — CLEARED.** Payoff depends on the visiting desk's Draw, which is another pair's choice.

### Cross-cutting

- **No candidate has a money leaderboard.** R13 is met in design by all three.
- **Snowball is braked in all three** (equal national pipe; Draw decay + market-independent ceiling in
  B and C). **Death spiral** is addressed by named brute-force invariants in all three and **verified
  in none**: `l3-arith-harness` claim (iv) is the only evidence, and it covers 2 markets × 6 shares ×
  1 card × no debt states. That is not the reachable state space.

---

## synthesis-map-verdict

Judged on one question: **is each link in the chain produced by the mechanism, or asserted over it?**
A synthesis is honestly earned only when the class-evidence link names an aggregate field that the
reducer actually computes and the formal-term link is what that field means.

**Rank for economic truth: C > B > A.**

1. **C — most honestly earned, and the only one I could falsify.** C is the sole candidate that
   publishes constants, which is why this review contains numbers about C and none about A or B. Its
   chains name real aggregate fields (`nightCurves`, `twoPeaks`, `repeatCard`,
   `homeRevenueDecomposition`, `reinvestByEra`, `potFlows`, `counterfactualTransfers`), and the
   L1 N1-vs-N5 repeated card is the cleanest path-dependence attribution artifact proposed anywhere in
   this track. Its L3 chain survives the `l3-sharing-argmax` dissent because its signature is a
   **reinvest** delta, not a price delta. C also alone states the honest limit of its own
   counterfactual on the board ("we can show you what the money would have done; we cannot show you
   what you would have done"), which is a genuine anti-outcome-bias move. **Its lead is on
   falsifiability and self-correction, not on instrument design** — and three of its links are
   currently false or unverified at its own constants (Memphis never fills; R6 fails 16.5×; the
   "interior best share > 0 for every market" summit).
2. **B — soundest instruments, least verifiable chain.** B's L3 chain is the truest economics in the
   war: a visitor's-share dial *is* internalising an externality, and pairing it with a condition dial
   is precisely why real leagues attach performance conditions to shared revenue. `agg.valueCreatedVsCaptured`
   is the best-conceived single aggregate proposed by anyone. But B publishes no constants, one of its
   L1 links rests on a false constraint (nightly-consumed capacity), and its L2 chain's "invest in
   DRAW" link is one brute force away from being a dominated lever.
3. **A — the most rhetorically confident chain and the least mechanically supported.** A-L1's chain
   ends at *"the thing that moves demand besides price"* while its own multiplier model makes the best
   price immobile; A-L3's chain ends at *"sharing helped, and here is what it cost"* while its own
   take function can only compute the cost. A-L2's chain, in isolation, is excellent and would be a
   loss to the track — that lesson's synthesis is fully earned by its mechanism.

**R16 status, all three: NOT MET.** Every chain names aggregate fields, which is the right shape, but
R16 requires that each formalization line be *computable from session state*. Three named lines are
currently not computable from any specified model: A's "sharing helped" (no product term), C's
"interior best share > 0 for every market" (no computation supplied), and B's "the season plan beats
the nightly plan" (no constants).

---

## required-repairs

Falsifiable, per candidate, ordered within each by severity. Each must be discharged by a committed
property test or a named artifact, not by an assurance.

### If A wins

1. **A-L3-R1 (blocking).** Restore a cross-seat product term to L3, or L3 does not teach C6. The
   minimum: L3's played season must run **B/C's hosting loop, not A-L1's solo counter**, so that a
   payer's own take can rise with `s` through the recipients' health. Discharge: brute-force the
   payer's take as a function of `s` and show an interior maximum at `s > 0` **for the largest market
   in the room**. If no such maximum exists, delete the "sharing pays the payer" line from the
   teacher script and from the concept ledger (R10), and re-scope C6 to redistribution + moral hazard
   only — honest, and a smaller lesson.
2. **A-L1-R1 (blocking).** Replace multiplicative demand shifters with intercept and/or sensitivity
   shifters. Discharge: a committed property test asserting the cash argmax **differs across at least
   two of each round's cards for every market**. **[computed]** — as specified, it does not differ at
   all.
3. **A-L3-R2/R3.** State explicitly that the sharing base is **gate only** and that per-fan in-arena
   spend is **untaxed**, and anchor it to the real system that works that way (the NFL's road-gate
   pool with unshared concessions), not to NBA local-revenue sharing, which is a broad base. Without
   this the price-movement claim has no mechanism at all.
4. **A-L1-R4/R6.** Give the second book (HOUSE) non-monotone structure in price, or accept in writing
   that every price above the cash peak is dominated on both books and supply the debrief line that
   defuses the resulting FL3. Discharge: assert that for some reachable state, some price *above* the
   cash peak is not weakly dominated.
5. **A-R11.** Ledger: gate's true share of team revenue; national money's obligations; the resale
   figure as forgone-revenue framing, **not** an additional loss.

### If B wins

1. **B-L1 (high).** Resolve the capacity-stock contradiction. Either state that "blocks" are
   season-long seat allocations (in which case the nightly chain and "path dependence felt eight
   times" must be rewritten and the intertemporal tension re-derived from the pass channel alone), or
   model spot capacity as regenerating nightly. Discharge: a written model statement plus the R1
   brute force below.
2. **B-R1 (high).** **Publish constants.** B is currently unfalsifiable on its own load-bearing claims.
   Discharge: `base`, `sensitivity`/rate function, per-fan spend, bills, DRAW decay and ceiling, then
   the brute force B itself specifies: the season-optimal release path differs from the per-night
   optima for a stated majority of slates.
3. **B-L2 (high).** Resolve the DRAW lever. Brute-force the reinvest grid against the reachable range
   of opponents' DRAW. If "never spend" is optimal for every seat every week, **the lever must change
   or C10 and C3 come out of the ledger (R10)**; the free-rider framing ("private optimum positive but
   below the room's") is the version worth building, and it needs an interior optimum to exist.
4. **B-R11.** Ledger the quantity-verb misconception: real clubs post prices; this model clears a
   market. Supply the defusing line.
5. **B-R6.** Once constants exist, run the symmetric-error check at equal distance from the argmax
   (see the R6 ruling below), not at equal grid offsets.

### If C wins

1. **C-L1-R8 (high).** Retune Memphis so a small market can fill its building on some reachable card,
   or replace Memphis in L1 with a market whose demand reaches capacity on a strong night.
   **[computed]** currently max fill **75.3%** at the price floor, **54.8%** at the optimum, against
   New York's **99–100%**. Discharge: assert at least one reachable (card, price) with small-market
   fill ≥ 95%, and require the L1 board to carry a non-gate success metric (fill %, renewals) so the
   small market's path is visible **inside L1**, not deferred to L2.
2. **C-L1-R6 (high).** The 16.5× low-side asymmetry at the New York kink must be either retuned (move
   the total-revenue optimum clear of the capacity kink) **or defended in writing on economic grounds
   with a debrief line** — R6's own escape clause. The economics is defensible ("when your building is
   already sold out, cutting the price gives away money for nobody new"), but it is currently
   undefended, and it is stacked with the resale line into a two-device case against the low price.
   Also: **drop the claim that resale "discharges R6."** It re-labels a loss the cash book already
   counts.
3. **C-L3-C6 (high).** Brute-force the "interior best share > 0 for every market" summit claim before
   it is spoken. **[computed]** the moral-hazard term (`r* ∝ (1−s)²`) cuts every seat's reinvest, so
   the product channel may run backwards. If the claim holds only with CONDITION on, say so, and make
   the board moment "sharing paid us **because** we attached teeth" rather than "sharing pays the
   payer."
4. **C-L3-R14 (medium).** Cap the SHARE dial, floor Draw decay, or make CONDITION mandatory, so the
   post-vote season is not a 12-minute stretch where reinvest-0 is optimal for everyone.
5. **C-L2-R7/R11 (medium).** The Draw ceiling being identical for every market is a playability
   guardrail, not a fact — ledger it with its misconception ("any club can become equally popular by
   spending"). And state the L3 rookie-allocation rule ("worst record picks first") **before the
   vote**, not at debrief, per the R7 ruling below.
6. **C-R10.** Strike C3 from the ledger if the fast-pipe/slow-pipe decision cannot name a state
   transition that breaks when the composition difference is deleted. C already flags this itself.

### Rulings on the recorded R-disputes

**A's dispute — R6's metric (headroom vs regret). SUSTAINED IN PART.**
A is right that payroll headroom is a level, not a penalty, and that regret is the correct quantity;
the contract's original 400-vs-44,000 figure measures a level. **[computed]** confirmation that the
metric matters: at Memphis, C's own R6 test reports 7.67× at Δ = $2 and 1.69× at Δ = $6 for the *same*
model — pure grid-offset artifact, because the true peak is $24.77 and the grid point is $24. But A's
own restatement ("N dial steps above and below the frontier") inherits that defect and adds another.
**R6 is hereby restated as:** *regret measured at equal distance from the true per-book argmax (not at
equal grid offsets), computed independently on each book, must be within one order of magnitude for
every market and every reachable state — **except** where the asymmetry is produced by a named
structural feature (a capacity clamp, a floor), in which case R6's written-defence clause applies and
the design must supply the defence and the debrief line.* Two riders A does not get: (i) a loss the
cash book already counts may not be re-counted as a second penalty (the resale line); (ii) satisfying
per-book regret does not satisfy R6 if one error direction is **weakly dominated on both books** —
that is FL3 by construction and it must be checked separately.

**B's dispute — R7 amendment for a named risk set. GRANTED, with five conditions.**
B is right that R7 read literally outlaws all post-commitment surprise and thereby removes risk from a
module about operating under uncertainty; CLAUDE.md §1 asks that uncertainty be *interpretable
afterward*, not absent. R7's target is unnamed variance. **Amendment adopted:** post-commitment events
are permitted when (1) the complete risk set and its trigger conditions are shown before commitment;
(2) resolution is deterministic and reproducible — no RNG, or a stated visible rule committed in
advance; (3) the debrief panel names the applied event **and its cause**, with the counterfactual;
(4) no risk event may move a seat from recoverable to unrecoverable — R5 dominates R7; (5) the risk
set may not be a seat's *only* source of variance, or students learn "stuff happens" instead of
"conditions differ." Note this amendment also governs **C's L3 rookie arrival**, which is currently
announced-as-coming but whose allocation rule is stated only at debrief; under condition (1) C must
state "the worst record picks first" **before the vote**.

**C's dispute 1 — R6 scoped to hold the visitor fixed. GRANTED.**
Correct on the merits. R6 governs the consequence of the *student's own* error; the cross-visitor
spread is C5 itself, and compressing it would delete the module's most valuable concept to satisfy a
rule written against a moral lesson about greed. R6 is within-card from here on. **This grant does not
discharge R6 for C** — **[computed]** C fails the within-card test at its own constants (16.5× at New
York, 7.67× at Memphis, against C's own stated 3× threshold). Repair 2 above still stands.

**C's dispute 2 — R1(b) evaluated per adopted rule. GRANTED IN PART, with a rider.**
Per-rule evaluation is correct: the rule determining what is optimal *is* C7, and failing the union
form is evidence the incentive works, not evidence of a defect. **But the union form is replaced, not
dropped.** The new R1(b) has two limbs: (i) *under each adopted rule setting*, no fixed action rule is
payoff-optimal for a majority of seats in every round; and (ii) *across rule settings*, the argmax must
demonstrably move — that is the C7 evidence and it must be brute-forced, not asserted. **Rider (R14):**
no adopted rule reachable by the room may produce a played season in which one fixed action is optimal
for every seat in every round. **[computed]** C's dial reaches that state: at `s = 0.6`, `r*` is 5.8%
of base and falling as `(1−s)²`, i.e. effectively "reinvest nothing," for everyone. Cap the dial, floor
the decay, or make the condition mandatory.

### What discharges the two open dissents

**`econ-boxoffice-unrepaired` — NOT DISCHARGED by any candidate, on any of its three findings.**
All three *specify* repairs; none is *demonstrated*, and I do not certify specifications.

- **Finding (1), fake uncertainty.** Discharged by a committed assertion that the pre-commit view
  carries no field equal to the settlement function on the pending action. **C's form is strongest**
  (no payoff field exists at all) and would discharge it on the day the assertion is committed and
  run. **B's** is equivalent in principle, unverifiable in practice (no constants). **A's** Replay
  Dial satisfies the assertion's letter and **fails its purpose** — **[computed]** under A's stated
  multiplicative shifters, last period's peak *is* tonight's peak, so the leak is closed and the
  exploit survives. A must fix the shifter model before its R2 claim means anything.
- **Finding (2), myopia optimal / no incentive tension.** Discharged by a brute force showing the
  payoff argmax **moves across the round's conditions** at the design's actual constants. **[computed]**
  A currently fails this by construction; B cannot be tested; C is structurally provided for
  (base *and* sensitivity keyed to the card) but has published no per-card constants, so it is
  **specified, not verified**. Note the contract's finding (2) was about a *two-period* conflict; only
  C's C10 lag and B's pass/spot tradeoff create one, and B's rests on the capacity-stock question.
- **Finding (3), unwinnable market.** Discharged only by the brute-force reachability invariant all
  three name. **[computed]** the existing evidence (`l3-arith-harness` claim (iv): both markets clear
  their bill at every share, margins +$303,200 NY and +$27,720 Memphis at `s = 50%`) covers **2 markets
  × 6 shares × 1 card × zero debt states** and is not the reachable space. Required: the M1 precedent
  (D15's 17,408-path cap brute force, D17's ≥2-affordable-rescues proof) applied over
  (market × card × carried state × debt × adopted rule).

**`l3-sharing-argmax` — I uphold it, and I rule on how it is discharged.**
The dissent is correct on both limbs and I re-ran it this session (exit 1; New York `p* = $48` at every
share 0–50%, Memphis $24 → $18). Both limbs are re-derivable in closed form and neither is a coding
defect: the sharing price move is `a·s/(2(1−s))` and it is **identically zero whenever the capacity
clamp binds at the optimum**; and a uniform tax `(1−s)` on the whole objective cannot move any argmax.
**Do not retune New York until the test passes.** Discharge requires all four of:

1. **Stop making price the L3 signature.** The rule's behavioural bite must be carried by an
   instrument that survives uniform taxation — that is, a **differential** between a taxed return and
   an untaxed cost or stream. Two exist in the war and both work: **C's reinvest channel**
   (**[computed]** `r* ∝ (1−s)²`; 36% → 9% across `s = 0…0.5` — a large, robust, capacity-independent
   mover) and **B's visitor's-share dial** (pays a club for value created in another building, which
   raises the return on DRAW rather than scaling the whole objective). Either is a stronger C7
   instrument than the price arrow, and neither is capacity-sensitive.
2. **If a price channel is kept anyway** (A's mechanism), the sharing base must **exclude per-fan
   in-arena spend in writing**, anchored to the real system that does that, and the price-shift board
   moment may be claimed **only for markets with slack demand at their `s = 0` optimum**, asserted by
   brute force across the whole market slate, not one market.
3. **Turn the big-market non-movement into taught economics rather than hiding it — and it is
   genuinely better economics than the uniform arrows.** A sold-out seller has no discount to give:
   the marginal fan does not exist, so the rule cannot reach the price. What it can reach is what that
   club **builds and spends** — capacity/sections and reinvestment. The honest board moment is
   therefore a **paired** one: a slack market's arrow moves down, a saturated market's arrow does not,
   and the room is asked why. That is a *sharper* C7 lesson than a row of parallel arrows, because it
   shows the rule's bite depends on which constraint you are under — and it is directly usable as the
   beyond-sports link (a tax changes behaviour only where behaviour has room to change). It costs
   Candidate A its stated module thesis, which is a fact about A, not an argument against the finding.
4. **The saturated market needs its own signature quantity.** For a capacity-bound seat the rule's
   measurable behavioural response is the **sections/capacity decision** (B's verb, C's N4 capacity
   option) or the reinvest dial — both must be present in whatever L3 gets built, and the before/after
   aggregate must record them, not just price.

### Dissent recorded

I record formal dissent, blocking, category economic-truth, against selecting **Candidate A's Lesson 3
as specified**. Its take function contains no cross-seat term, so the C6 instantiation bar the contract
sets ("sharing must raise the *sharer's own* payoff through the product") cannot be met by any tuning,
and its signature board moment is refuted for capacity-saturated markets by `l3-arith-harness`. As
written, A's module finale teaches with the class's own numbers that revenue sharing is a tax that made
the league poorer — the inverse of FL4's antidote, on the one concept D2 assigns to M2 that no other
module owns. I additionally dissent, blocking, against building **A's L1 demand system as specified**:
**[computed]** multiplicative shifters leave the cash argmax invariant ($48 at m = 0.6, 1.0, 1.6), so
"lock the Replay peak" is a dominant strategy and the lesson's stated payload — that the profitable
price moves night to night — is false in its own model. Both are repairable; neither is repaired. A
decision to proceed does not erase this dissent.
