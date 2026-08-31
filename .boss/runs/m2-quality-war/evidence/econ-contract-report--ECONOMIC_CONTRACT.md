# Module 2 "Money in Motion" — Economic Learning Contract

Economic Truth Critic, run `m2-quality-war`, assignment `econ-contract`, wave 1.
Written **before** architecture candidates A/B/C are drafted. This is a contract, not a design:
it says what M2 must teach and what any mechanic claiming to teach it must instantiate.

**Evidence status.** No Boss evidence ids exist in `.boss/runs/m2-quality-war/events.jsonl` as of
sequence 6 (RunCreated + five RoleActivated). Nothing here is browser-observed: `runtime/node_modules`
is absent, so no build, no test run, no played session was possible this session.

- **Observed (source):** `runtime/src/modules/boxOffice.ts`, `runtime/src/test/boxOffice.test.ts`,
  `docs/gauntlet/module-2/PROTOTYPE_SPEC.md`, `docs/ECONOMICS_CONCEPT_MAP.md`, `docs/TRACK_101_MAP.md`,
  `docs/PRODUCT_DECISIONS.md` D2/D13/D15–D18.
- **Observed (computation):** every numeric claim about the Box Office model below comes from a
  brute-force sweep of the module's own exported constants and pure functions
  (`MARKETS`, `peakPriceOf`, `zoneFor`, `attendanceFor`, `revenueBreakdownFor`, `payrollTargetForH2`),
  transcribed verbatim into a Node script over the full legal price grid ($10–$120, $5 steps) × 4 markets
  × 3 zones. Faithful to source, **not executed against the compiled module** — a builder should re-run
  it as a property test before treating the numbers as certified.
- **Not verified by me:** every real-world sports fact proposed below (Sports Reality's gate, and it must
  date them); any gameplay rating; anything about how the current prototype feels in a room.

---

## mechanism-verdicts

### Prior finding that constrains the whole module (highest severity, stated first)

The one M2 model that exists does not instantiate two of the four concepts its ledger claims, and the
two it does instantiate are solvable without economic reasoning. This is not a Box Office review — that
comes later — but the contract must be written so that no candidate repeats it.

1. **"Pricing under uncertainty" is not instantiated. The hidden curve is fully revealed before commitment.**
   `boxOffice.ts:374` returns `revenueBreakdownFor(price, market, null)` — the *true* attendance and
   revenue — as `preview` on every pre-lock dial tick, and the module header (lines 17–30) documents this
   as a deliberate server-authoritative round trip. REVEAL then calls the identical function on the
   identical inputs (`boxOffice.ts:389`). **A student can sweep the dial across all 23 prices, read the
   exact revenue at each, and lock the maximum. REVEAL can therefore not surprise anyone, and the
   `ECONOMICS_CONCEPT_MAP.md` line "the true demand curve is hidden, not random" is false as built.**
   The curve's *formula* is hidden; its *graph* is handed over point by point on request.

2. **"Incentives — short-term cash vs. protecting the fan base" is not instantiated; the tension does not
   exist in the arithmetic.** Because revenue is single-peaked (asserted by the module's own test at
   `boxOffice.test.ts:147`), overpricing in Homestand 1 earns *less than* the sweet spot in Homestand 1
   *and* cripples Homestand 2. Computed two-homestand optima, all four markets: Legacy 278,600 at $45–50
   (sweet); Expansion 170,750 at $25–30 (sweet); Riverside 266,240 at $55–60 (sweet); Capital 267,635 at
   $85–90 (sweet). **The myopic optimum and the long-run optimum are the same action for every seat.**
   There is no short-term temptation to resist, so nothing about incentives is experienced.

Everything below is written to prevent both failure modes: *an asserted concept with no mechanism* and
*a mechanism whose optimum is discoverable without economics*.

### The two tests every M2 concept must pass

- **INSTANTIATION TEST.** Name the state transition that would break if the concept were false. If the
  concept can be deleted from the model and the model still produces identical numbers, the concept is
  decoration, not mechanism.
- **REASONING TEST.** Name what the student must reason about that a mechanical search cannot supply. If
  a sweep, a copy of a neighbour, or "always pick the middle" reaches the optimum, the mechanic teaches
  search, not economics.

### Per-concept verdicts

| # | Concept | 50-min grade 5–6 verdict | Minimum instantiation for it to be genuinely experienced |
|---|---|---|---|
| C1 | **Revenue = price × quantity (the hump)** | TEACHABLE, but **cannot carry a lesson alone** — it is a 5-minute discovery, and by itself it is search, not reasoning. | Price must be committed **before** the payoff at that price is knowable, and the student must face at least two prices that are right under different conditions. A live true-value preview across the whole domain disqualifies the mechanic (see finding 1). |
| C2 | **Demand shifters (things other than price move demand)** | TEACHABLE and, in my judgment, **mandatory wherever C1 appears**. Opponent, day, team form, weather are all legible to an 11-year-old with zero basketball knowledge. | The same price must produce visibly different attendance across announced, attributable conditions, and the student must be able to say afterwards *which* factor moved the crowd. Never a random draw with no name. |
| C3 | **Revenue composition (gate vs. local media vs. national media vs. sponsorship vs. in-arena spend)** | TEACHABLE. The kid-legible payload is: *the money you control least is the money that pays you most.* | The sources must have structurally different properties — one you set, one you can grow slowly, one fixed and equal, one that scales with bodies not with price — and at least one decision must turn on that difference. Passive display pipes (the current prototype) do not instantiate it. |
| C4 | **Market size (structural, inherited, unequal)** | TEACHABLE, and pairs with C3. | Assignment must be visibly exogenous and **never scored or ranked**, and the class evidence must contain at least one path where a small market beats a big one on the dimension being compared. Otherwise it teaches destiny. |
| C5 | **Joint product / externality ("you cannot play a game alone")** | TEACHABLE — this is the least-known and most valuable thing in the whole M2 space. | My payoff must be a function of another seat's decision *through the product*, not through competition for a scarce prize: a marquee visitor fills my building; a broke opponent empties it. If it resolves as "we competed and I won," it is M1 L3 again with new nouns. |
| C6 | **Revenue sharing (redistribution + moral hazard)** | TEACHABLE only **after** C5 is felt. Without C5 it lands as charity or as taxation, and it teaches politics rather than economics. | Sharing must raise the *sharer's own* payoff through the product (so it is not altruism) **and** visibly dull someone's incentive to grow revenue (so it is not free). Both effects must be readable off class evidence. |
| C7 | **Incentives (a rule changes behavior)** | TEACHABLE, and this is D2's named M2 concept that no other module owns. | The same student must act **twice under two different rules** with the rule as the only change, and their own behavior must differ. One-shot rule commentary is not an incentive lesson. |
| C8 | **Institutional design / unintended consequences** | TEACHABLE at the top of the module, and this is the deepest ceiling M2 has. High execution risk: it degrades into a civics debate the instant the rule is discussed but not run. | The class-chosen rule must be **executed** and land on the chooser's own books, and at least two proposed rules must be defensible with different, visible winners and losers. |
| C9 | **Path dependence (yesterday's flow constrains today's options)** | TEACHABLE; already proven as a pattern in M1 (D17/D18) and in `roundTwoOpening`. | The *starting state* of the later round must differ, the student must be able to name the choice that caused it, and every reachable opening must retain a decision that matters (see R5). |
| C10 | **Invest now to earn later (spend-to-grow)** | TEACHABLE, but **boundary risk with M4** (expected value) — keep it deterministic-with-lag, not probabilistic-with-EV. | The payoff must arrive at least one round after the cost, and the intervening round must be visibly worse for having paid. If cost and payoff land together, it is not investment, it is a purchase. |
| C11 | **Price discrimination / segmentation** | TEACHABLE but **collides with M1 L1**: allocating capacity across price tiers is structurally the constrained-allocation verb students already spent a lesson on. Use only if the module needs a third pricing lesson, which I argue it does not. | Distinct buyer groups with genuinely different willingness to pay, and a fixed capacity that forces one group's gain to be another's loss. |
| C12 | **Complements / the loss leader (the ticket is not the product)** | TEACHABLE and delightful at this age. Best used as a **twist inside another lesson**, not a lesson. | Per-fan ancillary revenue must be large enough that the total-revenue-maximizing ticket price is *below* the ticket-revenue-maximizing price, and the two must be visibly different numbers. (Note: the current model has this at $5/fan, which shifts the optimum by ~$2.50 — invisible on a $5 grid. That is a decoration, not a mechanism.) |
| C13 | **Sunk cost** | TEACHABLE but **owned in substance by M1 L2** (dead cap, cost of revising a commitment). Skip. | — |
| C14 | **Public subsidy / who pays for the arena** | TEACHABLE and extremely real, but it is a civics-and-fairness lesson wearing an economics coat, and it is the hardest to keep from becoming teacher-opinion transmission in 50 minutes. Recommend: a synthesis reference, not a lesson. | — |

### Which concepts pair naturally in one lesson

- **C1 + C2 + C12** — one lesson. C1 alone is thin and C1 without C2 actively teaches a falsehood (see FL2).
- **C3 + C4** — one lesson. "Where the money comes from" and "not everyone's comes from the same place"
  are the same discovery seen from two sides.
- **C5 + C4** — one lesson. Interdependence is the reason market size matters to *other people*.
- **C6 + C7 + C8** — one lesson, and only in that order internally: share → see the incentive move →
  name the rule you would write.
- **C9 + C10** — a spine, not a lesson. Path dependence should thread all three lessons (D18 precedent,
  CLAUDE.md §9) rather than being a lesson topic.

**Anti-pairing:** C1 and C6 in one lesson. Price discovery and redistribution compete for the same
40 minutes and the second always loses.

---

## false-lesson-risks

Ordered by how badly the false version damages a grade 5–6 mental model.

| id | False lesson | Why it is false | Design property that prevents it (falsifiable) |
|---|---|---|---|
| **FL1** | **"A franchise's goal is to make the most revenue."** | Owners trade money for wins and for franchise value; teams routinely price below the short-run revenue-maximizing point to protect renewals, fill the building for the television product, and keep families in the arena. A single-scoreboard game teaches that money is the point of sports business, which is both economically wrong and the least interesting thing about the domain. | **Two non-collapsible scoreboards from lesson 1**, cash and something the student cares about (crowd, wins, fan trust), with **no action weakly best on both for all seats**. Brute-force verifiable (R4). The current model has one scoreboard and therefore currently teaches FL1. |
| **FL2** | **"Price controls attendance."** | Price is one shifter among many; opponent, form, day, and season dominate the variance in real gate data. A model where attendance is a pure function of price teaches that the operator controls the crowd. | **C2 mandatory wherever C1 appears** (R7): demand must move for announced, attributable reasons the student did not choose, and the debrief must be able to separate "my price" from "my Tuesday opponent." |
| **FL3** | **"Charging a high price is greedy and gets punished; charging low is kind."** | The most likely accidental lesson in this space, and it is moral, not economic. Underpricing is *also* destructive: you cannot pay the payroll, you cannot sign the player, and in the real world resellers capture the surplus you gave away. | **Symmetric error consequences** (R6). Observed violation in the existing model: overpricing shrinks the Homestand-2 demand curve permanently (`OVER_ZONE_DEMAND_MULT = 0.7`), while underpricing leaves the curve untouched and only adds a payroll debt. Computed for Legacy: an over-zone team's best possible H2 result clears payroll by **$400**; an under-zone team who priced at the $10 floor clears by **$44,000**. That is a ~100× asymmetry in favour of the cheap price, and it is a value judgment presented as arithmetic. |
| **FL4** | **"Revenue sharing is charity / the rich teams being nice."** | Sharing exists because the product is jointly produced and because a league of insolvent teams is worth less to everyone including the payers — and it carries a real cost, dulling the recipient's incentive to grow its own revenue (the reason real systems attach performance conditions). | Sharing must be shown to **raise the payer's own payoff through the product**, and must **visibly dull an incentive somewhere in the same session**. If students leave saying "sharing is fair," the lesson failed; the target sentence is "sharing helped, and here is what it cost." |
| **FL5** | **"The real team's decision was right, because that is what happened."** | Outcome bias, and it directly contradicts what M1 L3 already taught (decision quality vs. outcome luck, D18). M2 must not undo it. | Any commit-then-reveal historical beat must present the decision-maker's **information at the time**, and must include **at least one comparable real case that went the other way**. The reveal never says "correct"; it says "here is what they did and what happened." |
| **FL6** | **"Small markets lose because they are badly run; big markets win because they spend."** | Market size is inherited; capped leagues weaken the payroll-to-wins link; small markets demonstrably win titles. | **C4's instantiation rule**: exogenous, visible, unscored assignment, plus at least one small-market winning path present in the class evidence. Additional observed risk in the current model: market assignment is by seat/join order, and I computed that an **Expansion Team** seat that overprices in H1 cannot meet payroll in H2 at *any* legal price (best achievable 52,500 vs. a 75,000 bill), while a Legacy seat making the identical mistake can. The card, not the student, decides whether recovery exists. |
| **FL7** | **"More money buys more wins."** | Weak in capped leagues; the whole point of M1's cap module is that allocation beats spend. | If money converts to team quality anywhere in M2, the conversion must have **diminishing returns or a visible failure path**, and the class evidence must contain a cheap team that is good. |
| **FL8** | **"TV money is free money."** | It is payment for a product the league must deliver, it is contracted and shared, and it constrains the teams (start times, schedule, playoff format). | If national money appears as a fixed pipe, the debrief must name what the league gives up to get it. A pipe with no obligation attached teaches a subsidy, not a contract. |
| **FL9** | **"A league is 30 competing businesses."** | It is co-opetition: rivals on the floor, partners in the product. | This is C5's payload; if the module never makes a student's payoff depend on a *rival's health*, the module has taught the wrong shape of the industry. |
| **FL10** | **"There is a right price, and good operators find it."** | The direct product of a single-peaked, fully-previewable model. Real pricing is a bet under uncertainty about people. | R2 + R3: commitment before information, and REVEAL must carry information the student could not have read pre-commit. |

---

## dominant-strategies

For each mechanic family this module might use: where the exploit lives, how a 10-year-old finds it
without meaning to, and what breaks it.

### Family 1 — Price-setting against a hidden demand curve

- **Sweep-the-dial (OBSERVED, current model).** If a pre-commit preview returns true values, the optimum
  is read, not reasoned. Confirmed in source (`boxOffice.ts:374`) and by computation: single-peaked
  revenue (the module's own test, `boxOffice.test.ts:147`) plus a full-domain true preview makes the
  optimum trivially locatable in seconds. **Breakers:** commitment before measurement; a limited number of
  costly probes; a noisy or partial signal; or a preview that shows *last* period's demand rather than
  this period's.
- **Myopia is optimal (OBSERVED).** When each round's objective is "maximize revenue" and the later round
  rewards the same action, there is no intertemporal tension. Computed: the two-homestand optimum is a
  sweet-spot H1 price for all four markets. **Breaker:** the later round must reward an action the earlier
  round penalizes, for at least some seats — i.e. a genuine short-run/long-run conflict, not a reward for
  the same choice twice.
- **Memorize-the-number.** If demand is stationary, round 2 is round 1 with a stopwatch. **Breaker:** C2
  demand shifters between rounds.
- **Bracket-the-middle.** Any interior single peak on a bounded dial is bisectable in three moves.
  **Breaker:** make the objective multi-dimensional (R4) so no single number is best; or make the peak
  conditional on the night, not on the market.
- **Copy the neighbour / copy the board.** If the projector shows live per-team revenue while decisions
  are open, the room converges on whoever is winning — and it builds a leaderboard, which D4 forbids.
  **Breaker:** no comparative money display while any decision is open.

### Family 2 — Revenue allocation / pot-splitting

- **Free-ride.** Contribute nothing, receive from the pot. **Breakers:** a shared-product term so that the
  pot's health feeds back into the defector's own revenue; contribution conditions with teeth.
- **Vote-my-assignment.** Every big market votes against sharing, every small market for it; the outcome
  is decided by how many of each the class was dealt, and no student reasons at all. **Breakers:** decide
  the rule **before** market assignment is known (a defensible veil-of-ignorance device, and honest —
  real leagues bind these rules for years across changing circumstances); or require a supermajority so
  the two sides must trade.
- **Grab-then-defect.** Accept the shared money, then behave as if unshared. **Breaker:** the rule must
  actually bind the next round's action space, not merely transfer cash.

### Family 3 — Institution design / voting

- **Headcount dominance.** Whichever market type is more numerous simply wins; economics becomes a poll.
  **Breakers:** supermajority; asymmetric stakes (the big markets *are* the pot, so they must be bought,
  not outvoted); a rule that must clear a viability test — no team may be left unable to field a product.
- **Guess-the-teacher's-answer.** Students perform the "fair" rule they think is wanted. **Breakers:** at
  least two rules must survive the session with different, visible winners and losers, and the debrief
  must be scripted to show a real cost for the fair-looking option.
- **Do nothing.** If the status quo is safe and every proposal is risky, inaction dominates and no
  institution is ever designed. **Breaker:** the status quo must be visibly failing someone by the time
  the vote opens — which is exactly what the preceding lesson should have produced.

### Family 4 — Commit-then-reveal historical operation

- **Guess-what-happened.** Students optimize for matching history rather than reasoning; the famous case
  is famous *because* of its outcome, so the answer leaks. **Breakers:** withhold the case's identity
  until after commitment; use contested cases, or paired cases where near-identical decisions ended
  differently; grade the reasoning, never the match.
- **Outcome bias by construction.** Any scoring that rewards matching the real result teaches FL5.
  **Breaker:** no matching score exists anywhere in the module.
- **Fandom advantage.** A basketball fan who knows the ending is playing a different game — a direct
  violation of CLAUDE.md §3. **Breaker:** the economics must be decidable from the briefing sheet alone;
  domain knowledge may add colour, never accuracy.

### Family 5 — Any multi-round money loop (cross-cutting)

- **Snowball / rich-get-richer.** If revenue funds quality and quality raises revenue with no brake, round
  1's leader wins by construction and the rest of the class is spectating — the same failure the cap
  module exists to prevent. **Breakers:** diminishing returns; a mean-reverting term; a bounded catch-up
  channel; and R5's recoverability invariant.
- **Death spiral.** The mirror image, and worse in a classroom: a student whose remaining decisions cannot
  change anything. **OBSERVED in the current model:** an Expansion-market seat in the over zone faces a
  75,000 payroll bill and a best-case H2 revenue of 52,500 at any legal price. **Breaker:** R5.

---

## synthesis-map-verdict

Three arcs. Each lists per-lesson mechanism, the ordering argument, and the synthesis chain
(experienced moment → class evidence → real sports → formal term → beyond sports). Real-sports anchors
are **proposals for Sports Reality to verify and date** — I certify none of them.

### ARC A — "The Flow" — *my money loop → other people are in my loop → we write the rule*  **(my bet)**

**L1 "Full House" — the flow you steer, not the number you guess.** Mechanism: operate several game
nights across one homestand/season. Two levers (what to charge, what to put back into the night), two
scoreboards (cash on hand, and the crowd/fan trust that determines next week's demand). The schedule is
public: a marquee visitor Saturday, a bottom team on a Tuesday, so the profitable price **moves night to
night** and no single number survives the lesson. Prices commit before outcomes are knowable.
Concepts: C1 + C2 + C12, with C9 threading.
- Experienced moment: locking the same price for Saturday and Tuesday and watching Tuesday's building sit
  empty — *or* the sweeter version, discovering you could have charged far more on Saturday.
- Class evidence: a board grid of nights × the room's prices, showing the best price **moved** and that no
  team's single number was right for all nights.
- Real sports (unverified, for Sports Reality): variable and dynamic ticket pricing — the practice of
  charging different prices by opponent and date; the marquee-visitor premium.
- Formal term: **revenue**; **demand**; *what people will pay changes with more than price*.
- Beyond sports: flights and hotels priced by date; a bake sale on a rainy day; a lemonade stand on the
  day of the parade.

**L2 "You Don't Play Alone" — my revenue is partly made by other people's teams.** Mechanism: the class is
the league; the schedule links seats. Your gate depends on who visits, and who visits is a classmate's
team, in a market they did not choose. Structural inequality is dealt openly and never scored.
Concepts: C5 + C4 + C3, with C9 threading.
- Experienced moment: doing everything right and still watching the building sit half empty because the
  team you hosted has collapsed — and the mirror moment, getting rich off someone else's star.
- Class evidence: each team's revenue split into *what I earned* and *what the schedule handed me*.
- Real sports (unverified): national media money divided equally across the league versus local media
  money that is not; the gate lift a marquee road team brings to the buildings it visits.
- Formal term: **market size**; **shared product**; **spillover** (name "externality" only if the room is
  ready for it).
- Beyond sports: one great store bringing foot traffic to a whole mall; a group project where one person's
  work sets everyone's grade; a neighbourhood where one closed shop empties the street.

**L3 "Writing the Rule" — you designed an incentive; now live under it.** Mechanism: the room proposes and
adopts a sharing rule (a share of local revenue into a common pot), **then plays another season under it**.
High sharing visibly stops paying anyone to grow local revenue; zero sharing visibly breaks the product
that L2 proved everyone depends on. The room then meets the real league's compromise.
Concepts: C6 + C7 + C8, with C9 closing the module.
- Experienced moment: watching your own rule change what you *want* to do — the moment a student says
  "wait, now there's no point in me even trying to sell out."
- Class evidence: the vote, then the same room's two seasons side by side, before and after, with the
  behaviour change visible in the room's own numbers.
- Real sports (unverified): league revenue-sharing systems and the conditions attached to receiving a full
  share; a luxury-tax distribution; a labour negotiation fought over how revenue is split.
- Formal term: **incentive**; **revenue sharing**; **rules change behaviour**; **unintended consequence**.
- Beyond sports: a group-grade policy; tipping pooled across a restaurant's staff; taxes; chores paid from
  a shared jar.

**Ordering: forced, in all three positions.** You cannot feel that someone else is in your loop before you
have a loop (L1→L2). You cannot design an institution for a problem you have not suffered (L2→L3); a rule
debate held before L2 is a civics lesson, and a rule debate held after L2 is a response to something the
room lived. The escalation also deliberately rhymes with M1's *me → my past → everyone else* without
repeating its verbs: M1's other teams were **rivals for scarce inputs**; M2's other teams are
**co-producers of the product**. That contrast is itself a teachable moment in the module finale.

### ARC B — "The Ticket Window" — *price → the night → the resale market*

L1 as Arc A's L1. L2 "The Ticket Isn't The Product": ancillary spend is large enough that the cheap ticket
can earn more, so the total-revenue price sits below the ticket-revenue price (C12 as a real mechanism,
not a $5 decoration). L3 "Who Gets The Seat": tiered pricing and a resale market that captures the surplus
you leave on the table (C11 + willingness to pay).
- Strengths: the most concrete arc for 11-year-olds, the cheapest to build, and the resale mechanic is a
  genuinely startling reveal.
- **Why I do not bet on it:** ordering between L2 and L3 is *free*, which is the signature of a topic list
  rather than an arc; it drops **incentives** and **path dependence**, both named for M2 in D2; C11 repeats
  M1 L1's allocation verb with new nouns; and three consecutive pricing lessons will read as one lesson
  stretched to three.

### ARC C — "The Owner's Problem" — *two scoreboards → winning changes the money → the league puts on a brake*

L1 "Two Scoreboards": revenue funds payroll; banking cash and chasing wins are different objectives and you
cannot max both (C1 + FL1's antidote as the lesson's spine). L2 "The Loop Closes": winning raises demand
raises revenue funds payroll — compounding with a lag, and a visible path where it does not work
(C9 + C10 + C7). L3 "The Brake": the league taxes or shares to stop the loop running away; students feel a
rule land on their own books (C6 + C7 + C8).
- Strengths: it kills FL1 in the first ten minutes of the module, and the money↔winning loop is the truest
  single sentence about sports business.
- **Why I do not bet on it as the frame:** it is a payroll-and-spending arc, and payroll is M1's territory
  (cap, dead cap, allocation). It risks reading as "Module 1 again, with a bank account." It is also the
  most vulnerable to FL7 — if money buys wins in the model, that is the lesson students take, whatever the
  debrief says.

### The bet

**Arc A**, with **one non-negotiable transplant from Arc C: the two-scoreboard structure must be present
from L1 onward** (this is R4 below, and it is the only reliable antidote to FL1). Reasons:

1. It is the only arc whose ordering is *forced at every seam*, and forced ordering is what makes three
   lessons a module rather than three lessons.
2. It covers exactly D2's named M2 concepts — revenue, incentives, path dependence — at depth, without
   trespassing on M3 (information/evaluation: Arc A never asks the student to judge a player) or M4
   (expected value/negotiation: Arc A's L3 is rule-writing, not bilateral bargaining).
3. It uses class interdependence where it **materially changes the economics** (CLAUDE.md §8): in L2 and
   L3 the other students are not spectacle, they are the mechanism.
4. Its ceiling is the highest thing in the M2 space. A fifth-grader who leaves saying *"we made a rule and
   the rule changed what everybody wanted to do"* has learned something most adults have not.

**The bet's principal risk, stated plainly:** L3 is the hardest lesson to build in this entire track. A
rule that is discussed but not *run* is a debate club, and a 50-minute lesson that spends 25 minutes voting
has no economics in it. If the L3 prototype cannot get from vote to played consequence inside ~20 minutes,
Arc A's third lesson should fall back to Arc C's L3 (the league's brake as a *given* rule the students
operate under and then argue about) rather than shipping a discussion.

---

## required-repairs

Hard requirements. Any architecture that reaches my gate is judged against these; each is falsifiable, and
each should be discharged by a property test or a named artifact, not by an assurance.

- **R1 — No dominant strategy.** For each lesson's signature loop, a brute-force sweep of the full legal
  action space must show (a) the payoff-maximizing action differs across at least two of the round's
  conditions, and (b) no single fixed action rule is optimal for a majority of seats in every round.
  *Evidence:* a committed property test. *Currently failed by the Box Office model.*
- **R2 — Commitment precedes information.** No view may return, for an uncommitted action, a value equal to
  what that action will produce. *Evidence:* an assertion that the pre-commit view's payoff field is not
  the post-reveal computation on the same inputs. *Currently failed (`boxOffice.ts:374` vs `:389`).*
- **R3 — REVEAL must carry information.** For every seat, at least one revealed quantity must be
  underivable from anything the seat could see before committing. A reveal that restates a known number is
  theatre and will be cited as such.
- **R4 — Two non-collapsible scoreboards.** The student's outcome must have at least two dimensions that
  cannot be summed into one number, and there must exist no action that is weakly best on both dimensions
  for all seats. *Antidote to FL1.*
- **R5 — Recoverability invariant.** For every reachable state at the start of every later round, at least
  one legal action must satisfy that round's stated obligation, brute-force verified over the whole
  reachable state space. *Currently failed:* an Expansion-market seat in the over zone faces a 75,000 bill
  against a best-case 52,500 at any legal price.
- **R6 — Symmetric error consequences.** The modelled penalty for erring high and erring low must be within
  the same order of magnitude, or the asymmetry must be defended in writing on economic grounds.
  *Currently failed:* ~100× asymmetry against the high price (Legacy: 400 vs 44,000 of payroll headroom).
- **R7 — Attributable exogenous movement.** Every change in demand not caused by the student must be
  announced before the decision and nameable at debrief. No unexplained variance anywhere; uncertainty
  during play must become interpretable afterward (CLAUDE.md §1).
- **R8 — Structural inequality is exogenous, visible, and unscored.** Market/franchise assignment must be
  deterministic and attributable, shown to the student, and never ranked on the board. The class evidence
  must contain at least one small-market success path.
- **R9 — No pooled comparison without its controlling variable.** Any board chart comparing seats must
  carry the variable that makes the comparison meaningful. *Currently failed:* `ScatterPoint`
  (`boxOffice.ts:545`) carries franchise, price, revenue and zone but **no market id**, so the projector
  pools four demand curves peaking at $30/$50/$60/$90 into one cloud and calls it a class-generated demand
  curve. The teacher cannot make that board true.
- **R10 — Every ledgered concept has a code-level instantiation pointer, or is deleted from the ledger.**
  Concepts that fail the INSTANTIATION and REASONING tests must be removed from
  `ECONOMICS_CONCEPT_MAP.md`, not restated. *Currently failed by two of the four M2 entries.*
- **R11 — Simplifications ledger with misconception risk** (CLAUDE.md §3). Minimum required entries for any
  arc in this space: the share of team revenue that gate money actually represents; treating national money
  as a fixed pipe with no obligations (FL8); the absence of a cost side; linear demand; a horizon of two or
  three periods standing in for a season; and any money→wins conversion (FL7). Each entry names the
  misconception and the debrief line that defuses it.
- **R12 — Real-sports anchor per lesson, dated by Sports Reality, and non-load-bearing.** The economics must
  be fully decidable from what is on screen; sports knowledge may raise engagement and may never raise
  accuracy (CLAUDE.md §3).
- **R13 — No money leaderboard.** No board surface ranks teams by revenue or cash at any point, and no
  comparative money display is live while a decision is open (D4, plus the copy-the-board exploit).
- **R14 — Path dependence must be attributable and non-fatal.** The student must be able to name the choice
  that produced today's opening state, and every reachable opening must contain a decision whose outcome
  differs materially. Combined with R5, this is CLAUDE.md §1's "bad decisions matter but stay generally
  recoverable."
- **R15 — Historical reveals carry the decision-maker's information set, at least one counter-case, and no
  matching score.** *Antidote to FL5, and required to protect what M1 L3 already taught.*
- **R16 — The synthesis map must be complete before the build is called done.** Every lesson supplies the
  full chain — experienced moment → class evidence → real sports → formal term → beyond sports — with the
  class-evidence link naming the actual aggregate field that produces it. A formalization line that cannot
  be computed from session state is not a synthesis, it is a script.

### Dissent recorded

I record formal dissent, now, against any decision to carry the Box Office model forward without repairing
R2, R5, R6, and R10 first. As it stands the model's central claim — pricing under uncertainty — is false
at the mechanism level (the true curve is served point-by-point before commitment), its incentive tension
does not exist in the arithmetic (the myopic and long-run optima coincide for all four markets), it can
strand a student in an unwinnable round through no fault of their own, and its asymmetric penalties teach a
moral about greed rather than an economics of price. A decision to proceed does not erase this dissent.
