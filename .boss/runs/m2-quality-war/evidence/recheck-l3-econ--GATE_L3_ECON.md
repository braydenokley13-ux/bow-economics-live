# GATE_L3_ECON — Economic Truth, Module 2 Lesson 3 "Writing the Rule"

Boss run `m2-quality-war`, assignment `gate-l3-econ`. Independent gate on the BUILT
module (`runtime/src/modules/writeTheRule.ts`), fresh context, not the builder.

Baseline: `GATE_L1_ECON_R3.md` closed-form sharing analysis; `l3-arith-harness`
(exit 1); BC-1 in `ARCHITECTURE_SELECTION.md`.

Method: `runtime` built at head (`npm run build`, clean). Every number below is
from **my own** replay driving the shipped reducer (`takeSeat` / `setPrice` /
`setReinvest` / `lock` / `teacher:closeWeek`) — not the builder's harness. Six
mutants injected into a scratch copy of `dist/` (repo never modified). Scratchpad:
`/tmp/claude-0/-home-user-bow-economics-live/2c7a1860-ee1d-5f9b-8309-ead93875cd08/scratchpad/`.
No server left running. No git operations.

**VERDICT: BLOCKED (economic-truth).** Six blocking repairs. The BC-1 mechanism
itself is sound and is the strongest thing in this module; what fails is what the
mechanism is allowed to say when it is not firing, and the instrument that was
supposed to be policing the saying.

---

## mechanism-verdicts

### M1 — BC-1c, the untaxed stream is load-bearing: **VERIFIED (observed)**
I deleted it rather than trusting the claim. Setting `ancillary = 0` on all four
profiles at runtime drives every market's price move to **exactly $0**:

| club | move (s=0 → s=60), ancillary intact | move, ancillary deleted |
|---|---|---|
| New York | $0 | $0 |
| Memphis | **$6** | **$0** |
| Golden State | $0 | $0 |
| Oklahoma City | **$6** | **$0** |
| Milwaukee | **$6** | **$0** |
| Boston | $0 | $0 |

Closed form cross-checked against the shipped brute force with κ = 1 − s(N−1)/N,
p* = B/2k − a/2κ: Memphis s=0 → 46.17 vs shipped 46; s=20 → 44.97 vs 44; s=60 →
40.17 vs 40 (all within the $2 grid). `taxedLocal = gate + localMedia`; in-arena
and the $950k national check are untaxed. The `l3-arith-harness` refutation is
respected, not evaded. **This is a real mechanism, not decoration.**

Independence of the two instruments also confirmed: after deleting `ancillary`
the *reinvest* response still moves (κ² is untouched by `a`). Correct.

### M2 — BC-1b, moving arrow beside flat arrow: **VERIFIED with a false sub-claim**
At 6 desks on opening draws, three small markets move $6 and three big markets are
flat. But the build's claim that capacity-bound markets "stay flat at ≥99% fill" is
**NOT VERIFIED**: Golden State is flat at **98.7% fill, `soldOut=false`, 0 turned
away**. Its flatness is a next-step clamp, not a visible full building. `flatDeskName()`
correctly requires `soldOut`, so the *named* desk is always genuinely full — the
taught moment survives. The ≥99% figure does not. Non-blocking; correct the claim.

### M3 — BC-1a, differential reinvest response: **VERIFIED; the build's ">=3 steps" is the max, not the floor**
Per-club dial-step span across the full share grid (my brute force through the
shipped settlement): OKC **5**, New York **3**, Memphis **3**, Golden State **3**,
Milwaukee **2**, **Boston 1**. Charter BC-1 requires ≥2 steps; Boston misses at 1.
The board never over-claims (it prints the maximum mover and a count), so this is
non-blocking — but "≥3 dial steps across adopted shares" is true of one desk, not
of the league, and should be stated that way.

Semantic note: κ(s) is **club-independent**. "Differential" here means *across
adopted shares*, not *across market type* — every club's r* falls by the same
proportional factor. Honest, and the copy does not claim otherwise. Do not let the
word drift into "big markets respond differently."

### M4 — CONDITION dock-and-redistribute: **REAL MECHANISM, thin at modal shares, and it leaks**
Real, not decoration: it changes `bestReinvestUnder`. But its bite is concentrated:

| adopted share | desks whose best reinvest CONDITION moves | size of move |
|---|---|---|
| 10–40% | **1 of 6** (Boston) | +5 (one step) |
| 50% | 2 of 6 | +5 |
| 60% | 4 of 6 | +5 to +10 |

**Conservation failure (blocking).** The module comment claims "a compliance pool,
not a bonfire." Measured at s=40%, CONDITION ON, 6 live desks, 3 weeks:

| scenario | paid in | took out | destroyed |
|---|---|---|---|
| all comply (20%) | $11,432,562 | $11,432,562 | **$0** |
| half comply | $10,521,251 | $10,521,255 | $0 (rounding) |
| one defector | $11,053,059 | $11,053,064 | $0 (rounding) |
| **nobody complies** | $10,189,377 | $5,094,696 | **$5,094,681 (50.0%)** |

When `compliantCount === 0`, `bonus = 0` and the forfeited half is annihilated. This
is reachable in week 1 of a real class: a live desk that never locks settles at
`reinvest = 0` (`settleWeek`, `honorPendingDials=false` on `teacher:closeWeek`), so
six unlocked desks destroy half the pot. It is a transfer teaching that
redistribution burns money, and no surface shows a destination for the difference.

### M5 — the lived-under season is attributable: **VERIFIED where the rule fires**
Pot net is exactly zero-sum league-wide whenever ≥1 club complies (measured $0 /
−$4 / −$5, rounding only). PAID IN / TOOK OUT / NET per desk (BC-6 fix 3) does let a
gain be split between transfer and own dial. Settlement order is clean: all buildings
settle on opening Draws, then the pot forms, then it pays out, then Draw moves — no
club's week depends on another's payout. **But attribution only has content when the
dial actually moved, which fails at the modal outcome — see F1.**

### M6 — L2→L3 seeding: **HONEST ON THE VOTE, BROKEN ON THE CONSEQUENCE BAR**
Honest half (observed): `extractCarriedClubs` validates per field, refuses a foreign
`lessonModuleId`, clamps Draw to 10–100 and floors cash at one national check
($950k) so an L2 debt does not break L3. L2's and L3's `CLUBS` arrays are
slot-for-slot identical in name **and** `profileId`, so the seed cannot move a
franchise onto another market. Critically, the seed **cannot distort the vote**: I
re-ran the per-club ideal share under a deliberately extreme seed (New York
draw=100/$9M, Memphis draw=10/$950k) and every club's argmax was unchanged — BIG
0%, small 60%. Carried state is economically inert for the rule choice. Fair.

Broken half (blocking, F3): the two lessons' reinvest dials share a scale (0–40 in
5s) but **not a base**. L2 spends `share% × doorMoney` (gate + in-arena). L3 spends
`reinvest% × localRevenue` (gate + in-arena + **local media**).

| club | L2 base | L3 base | ratio |
|---|---|---|---|
| New York | $1,624,584 | $2,842,584 | 1.75× |
| Boston | $1,532,480 | $2,992,480 | **1.95×** |
| Golden State | $1,605,240 | $2,435,240 | 1.52× |
| Oklahoma City | $660,672 | $903,672 | 1.37× |
| Memphis | $489,888 | $659,888 | 1.35× |
| Milwaukee | $536,036 | $646,036 | 1.21× |
| **league** | — | — | **+62.5%** |

A room that puts back the **identical dollars** in both lessons reads **38.5% lower**
on the L3 dial. L2 dial 20% ≡ L3 dial 12.3% in dollars. The module's signature C7
panel prints "Last lesson this room put back X%… Under the rule you wrote, it put
back Y%. **Effort went down by Z%**" — a units artifact presented as behaviour, and
the teacher answer key then names it moral hazard.

### M7 — Kings capstone, outcome ≠ decision quality: **PRESERVED**
`kings-no-score` carries `absent: "you got it right"` and the audit's forbidden-phrase
check runs on it. `ARGUE_REVEAL_COPY` leaves the verdict open (Seattle a 2026
expansion frontrunner). Teacher answer: "There is no right answer and the real vote
was 22-8, not unanimous. Eight owners voted the other way and they were not stupid."
The subsidy-coda card says "Outcome is not decision quality, in both directions."
`HOOK_REVEAL_COPY` does the same for Boston/OKC-Harden. No repair.

### M8 — board privacy: **PRESERVED** (economics-adjacent)
`leagueTable` exposes desk number, market label and Draw — never cash. Rookie
allocation is by lowest cash, which is on no shared surface, so it is genuinely
unknowable in advance and exactly nameable after; `ROOKIE_COPY` discloses that this
is NOT the NBA lottery and gives the 14.0% figure. No repair.

---

## false-lesson-risks

### F1 — BLOCKING · the modal outcome is the one where the lesson has nothing to say, and the teacher is still told to ask the contrast question
The mechanism's attractor is STATUS QUO 5% (see dominant-strategies). At 5% my
replay produces this on the projector and in the director:

```
ARROWS: "Under this rule the best thing to put back into Desk 1 · New York fell
 from 15% to 15% — 0 clicks of the dial. 0 of 6 desks saw that move. On price it
 splits: 0 desks' best price came down, and 6 desks' best price did not move at all."
flatDeskName() -> null      (all six arrow rows: soldOut = false)
REVEAL stage 4 say: 'Ask it in these words: "why didn't the big market move?"
 The answer is on their own screen — their building was already full, and you
 cannot discount a seat you do not have.'
```

Nothing moved anywhere, so there is no contrast; and **no desk is full**, so the
stated reason is not the operative one. The teacher is directed to ask a
false-premise question at the module's designated peak. Stage 5 ships a low-share
fallback line; **stage 4 does not.** At 30% the same machinery is excellent
(OKC 35→15, 4 clicks; New York named, `soldOut=true`) — the defect is entirely in
the unfired branch.

### F2 — BLOCKING · a printed falsehood on a student-facing synthesis card
Card `composition` ("THE MONEY YOU CONTROL LEAST IS THE MONEY THAT PAYS YOU MOST")
prints, verbatim from my replay at 6 desks, share 0%:

> "This room sold **$17,605,406** of tickets in three weeks. The national television
> check, which nobody in this room set and the pot never touched, was
> **$17,100,000** — **more than the whole room took at the gate**."

$17.10M is not more than $17.61M. Reachable at n=6 s=0% ($17.61M vs $17.10M), n=6
s=30% ($17.21M vs $17.10M), n=8 s=0% ($23.12M vs $22.80M). Six pairs is the minimum
league and a completely ordinary classroom. The card's whole concept is inverted
while the copy asserts it. Root cause is F5.

### F3 — BLOCKING · the C7 "effort went down" bar is not like-for-like
See M6. The panel the entire D9 seeding decision was justified by ("the C7 evidence
that a rule changed the same students' behaviour") compares percentages of bases
that differ by up to 1.95×. Moral hazard may be real in the room; this bar cannot
establish it, and the module presents it as if it does.

### F4 — BLOCKING · the pot bonfire
See M4. Redistribution that destroys 50% of the money is a false lesson about a
transfer, and it is silent.

### F5 — BLOCKING · the claim audit cannot detect a wrong number or a wrong quantifier
This is econ-truth load-bearing because P9's "438 atoms / 109 surfaces, 5/5 mutants"
is the evidence offered that printed economics matches the model. My own six-mutant
panel against the shipped 41-test suite:

| mutant | detected? |
|---|---|
| wrong **sign** (`pot-total` asserts negative) | **CAUGHT** (41→40 pass, 1 fail) |
| wrong **bound** (`adopted-share` max 3) | **CAUGHT** |
| **economics** (tax in-arena too → uniform tax, argmax must freeze) | **CAUGHT** |
| wrong **quantifier** (`synth-national-bigger` inverted to `national < gate`) | **SURVIVED — 41 pass, 0 fail** |
| frozen quantifier word (`era-direction` pinned to "went down") | **SURVIVED** |
| **value drift** (`pot-total` doubled) | **SURVIVED** |

The value-drift mutant makes the board print
`"$15,284,066 went through the pot over three weeks"` against a true `agg.potTotal`
of **$7,642,033** — a 2× falsehood on the projector — and the full suite passes 41/41.

Two structural causes, both in `writeTheRule.ts`:
1. The audit asserts `s.text.includes(atom.rendered)`, and `atom.rendered` is
   derived from `atom.value` by `renderClaim` inside `claim()`. Atom and sentence are
   built from the *same* expression, so the check is **tautological for values**. It
   verifies a sentence quotes its own atom; it never compares an atom to an
   independently computed model value.
2. `claimWord(id, word, claims)` renders `word` **unconditionally**;
   `atom.quantifier.claims` is stored and **never asserted against anything**. Where
   the author varies the word by branch (`era-direction`, `adopted-passed`,
   `transfer-direction`, `synth-seeded`, `reveal-holding`) the sentence is safe. Where
   the word is constant and only the boolean varies, a false quantifier still prints.
   Constant-word atoms: `arrow-any-flat-price`, `pot-two-sided`,
   `synth-road-someone-else`, **`synth-national-bigger`**, **`consequence-nobody-decided`**.
   The first three are count-qualified and read fine at zero; the last two are
   reachable printed falsehoods (F2, F6).

The wave contract requires "a seeded wrong-sign/**quantifier**/bound claim must fail
it." Sign yes, bound yes, **quantifier no.** The instrument is not non-vacuous as
specified.

### F6 — BLOCKING · the teacher answer key contradicts itself in the unseeded branch
`consequenceAnswerClaimed` at 6 desks, no seed, produced by my replay at both 5% and 30%:

> "…There are **no Lesson 2 numbers** linked to this session, so the before-and-after
> bar has one bar in it. **0 desks put back less than they did last lesson** — and
> nobody had to decide to try less."

Two sentences apart: there is no last lesson, and here is a count of desks measured
against it. In an unseeded session every `reinvestEra.l2` is `null`, so `dropped` is
structurally always 0 and the moral-hazard phrase always prints anyway. The audit is
blind to it (F5, cause 2).

### F7 — BLOCKING · the visible three-week scoreboard rewards the behaviour the lesson names as moral hazard
League **total cash** is *increasing* in the adopted share — $32.28M at 0% rising
monotonically to **$34.86M at 60%** — because the reinvest dollars saved exceed the
gate lost inside a three-week horizon. The cost lands in end-of-season **Draw**,
which falls with share for 5 of 6 clubs (New York 61→48, Golden State 59→47, Memphis
70→61, OKC 77→70), and Draw is never priced in dollars on any student surface. A room
reading its own bank balances can correctly conclude *high sharing made this league
richer*. The `terminalDrawDollars` credit that carries the cost exists only inside
`projectFrom`, an internal optimizer. The horizon compression is ledgered
(SIMPLIFICATIONS entry 2) for *dollar scale*; the **incentive-sign inversion it
creates is not ledgered at all**, and it is the misconception this lesson is named
after.

### F8 — BLOCKING (narrow) · the withdrawn summit claim is still on a teacher surface
`rehearsalWatchFor(PLAY)` still instructs:

> "Pull that voice immediately. It is the whole lesson: **sharing is not charity here,
> it pays the payer through the product**. Do not say that sentence — make them say it."

`SIMPLIFICATIONS` entry 5 explicitly withdraws exactly that proposition, and my
replay refutes it at every accounting (below). The **live** flag `big-for-sharing` is
already repaired ("Ask only: why would you pay for that?") — only the rehearsal
sample is stale. The rehearsal panel is precisely what a random competent teacher
reads *before* class, so it trains them to elicit a false economic proposition as
"the whole lesson." One string; cheap; blocking under the random-teacher invariant.

### F9 — non-blocking · "sharing is theft" has no student-facing counter
See the summit ruling. Recorded and surfaced as a ledger item, absent from every
synthesis rail and every board line.

---

## dominant-strategies

All payoffs below are **own three-week cash from a full replay of the shipped
reducer**, not an analytic proxy.

**(1) No dominant proposal — P4 CONFIRMED independently.**
Exhaustive sweep, 6 desks, each club's own proposal over the full 13-point `SHARE_GRID`
against opponents drawn from {0,15,30,45,60}⁵ = **3,125 opponent profiles per club**.

| desk | best-response in 100% of profiles | best single strategy (hit rate) |
|---|---|---|
| New York [BIG] | **none** | 10% (82%), 0% (80%), 50% (79%) |
| Golden State [BIG] | **none** | 10% (**89%**), 15% (81%), 0% (78%) |
| Boston [BIG] | **none** | 10% (84%), 0% (83%), 50% (81%) |
| Memphis [sml] | **none** | 60% (48%), 20% (44%), 45% (44%) |
| Oklahoma City [sml] | **none** | 60% (48%), 45% (44%), 20% (43%) |
| Milwaukee [sml] | **none** | 60% (48%), 45% (44%), 20% (43%) |

No strategy reaches 100% for any club. The two-thirds band is what kills dominance:
an extreme proposal sometimes tips the room to status quo. **P4 stands.**

**(2) Headcount trap — does NOT fire. VERIFIED.**
Under sincere play (BIG proposes 0, small proposes 60), at every desk count 6–18 a
small-market **headcount majority never wins**:

| desks | big/small | median | in band / needed | outcome |
|---|---|---|---|---|
| 7 | 3/4 | 60% | 4 / 5 | status quo 5% |
| 9 | 4/5 | 60% | 5 / 6 | status quo 5% |
| 11 | 5/6 | 60% | 6 / 8 | status quo 5% |
| 13 | 6/7 | 60% | 7 / 9 | status quo 5% |
| 15 | 7/8 | 60% | 8 / 10 | status quo 5% |
| 17 | 8/9 | 60% | 9 / 12 | status quo 5% |
| 18 | 8/10 | 60% | 10 / 12 | status quo 5% |

`ADOPT_COPY` earns its sentence. Good design, correctly reasoned in `runAdoption`.

**(3) Status-quo attractor — the real dominant outcome. BLOCKING (F1).**
Over the same 5⁶ = **15,625 uniform proposal profiles**, driving `runAdoption`:

- **STATUS QUO rate: 71.0%**
- adopted-share histogram: 5%: **71.0%** · 25%: 5.5% · 40%: 5.5% · 10%: 4.7% ·
  55%: 4.7% · 0%/15%/30%/45%/60%: 1.7% each
- under **fully sincere** play: **100%** status quo, at every desk count 6–18

And at 5% the differential instrument is **exactly zero steps for every desk** and
the price move is **$0 for every desk** — identical to no rule at all. The lesson's
most likely single outcome is the one in which its signature payload is null. This is
not a bug in the vote (the supermajority is right); it is an unhandled branch.

**(4) Vote-my-assignment — FIRES. Non-blocking, but name it.**
Ideal share is a pure function of the market profile and of nothing else:

| accounting | BIG markets | small markets | league total |
|---|---|---|---|
| cash only (3wk) | **0%** (all three) | **60%** (all three) | 60% |
| cash + untaxed terminal Draw | **0%** | **60%** | 5% |
| cash + terminal taxed **and redistributed** at 1/N | **0%** | 45–60% | **5%** |

Invariant to carried state, Draw, cash and week (re-verified under an extreme seed).
A student told only "you are a big market" plays optimally without economic reasoning.
This is the real NBA politics and I do not ask for it to be tuned away — but there is
no within-type dispersion for a student to discover, so the dial rewards identity, not
analysis. The three offer rounds and the histogram are what must carry the reasoning.

**(5) Median-copy — the only guaranteed-adoption line.**
The histogram is public after round 1 (BC-6 fix 4 correctly withholds it before).
Copying the posted median guarantees band membership and therefore adoption. Not
payoff-dominant, but it is the sole escape from the 71% status-quo attractor, so a
room that discovers it will converge on it. Anti-herding is preserved for round 1
only, by design; note that rounds 2–3 are herding by construction and that this is
the mechanism working, not failing.

---

## synthesis-map-verdict

**PARTIALLY VERIFIED — the map is unusually good and two rails are load-bearing-false.**

Five-rail structure (`rememberWhen` / `ourClass` / `inSports` / `economistsCall` /
`outsideSports`) is correct and the two computed rails really are computed from the
room's own state. Concept coverage against `ECONOMICS_CONCEPT_MAP` C3/C5/C6/C7/C8/C9
plus the C14 coda is complete; `moduleClaims` registers every card including
zero-atom ones, so a future computed line is a detectable hole. Naming discipline is
right: **REVENUE SHARING / REDISTRIBUTION / MORAL HAZARD / INCENTIVE / INSTITUTIONAL
DESIGN / UNINTENDED CONSEQUENCE / SHARED PRODUCT / SPILLOVER→EXTERNALITY / REVENUE
COMPOSITION / PATH DEPENDENCE / PUBLIC SUBSIDY / OPPORTUNITY COST**, each with a
genuine outside-sports generalization (tip pools, group grades, late-homework
penalties, bottle deposits, the mall anchor store, base-salary-plus-tips, the
eighth-grade subject choice). "Revenue is never profit" is defended by the Packers
record-revenue-with-an-operating-loss line — that is exactly the right defence.
`COUNTERFACTUAL_HONESTY` ("we can show you what the money would have done; we cannot
show you what you would have done") is the correct epistemic limit and the
counterfactual replay honours it by holding every action fixed.

Defects on the map:
- **`composition` card asserts a comparison the model contradicts at 6–8 desks (F2).**
  The concept is inverted while the card names it. Blocking.
- **`incentives` card body is `era.text + arrows.text`**, so it inherits both the
  incommensurable before/after bar (F3) and the null arrow line at status quo (F1).
  Its `rememberWhen` — "the moment somebody in this room said out loud that there was
  no point trying to sell the building out any more" — is a scripted memory that the
  5% branch will not have produced. Blocking by inheritance.
- **`revenue-sharing` card is the best card in the module** and names both halves
  (REDISTRIBUTION and MORAL HAZARD) with real dated figures. It is also the card that
  must absorb the summit ruling and currently does not (F9).
- `SIMPLIFICATIONS` **is** surfaced — to `studentView` at SYNTHESIS and to
  `teacherView`. That is better than a ledger and I credit it. It is still a raw list,
  carried by no rail and by no board line.

---

## required-repairs

### Ruling on the builder's BLOCKING-CANDIDATE (the summit)

The design hoped for an interior best share above zero for **every** market
("sharing pays the payer, through the product"). I tested it three ways at league
equilibrium and it fails every way: all three BIG desks have **argmax 0%**, monotone
decreasing, on cash-only, on cash-plus-untaxed-terminal, and on the fair accounting
where the terminal Draw credit is taxed **and redistributed at 1/N**. League total is
maximised at 0–5%; sharing in this model is a transfer with a moral-hazard cost, not a
pie-grower. The builder's characterisation is confirmed and I found the reason is
structural, exactly as `SIMPLIFICATIONS` entry 5 states: a capacity-bound building
loses a sustainable price, not a full house, when the visitor weakens, and that is
worth far less than what it pays in.

**RULING: this is TRUE ECONOMICS, not a false lesson. Do not tune the summit into
existence.** Forcing it would require a marquee visitor to double a sold-out Madison
Square Garden, which is false about the real world, and would break BC-1b's flat
arrow — the module would buy a nicer moral by lying about capacity. Big markets
opposing revenue sharing is the actual politics of the actual league (Lakers and
Warriors alone paid over $88M of the $163.6M pool in 2021-22), and a Track 101 lesson
that lets fifth-graders discover a genuine distributive conflict is worth more than
one that pretends the conflict dissolves under arithmetic.

**But honest-in-the-ledger is not honest-in-the-room.** The withdrawal is recorded in
`SIMPLIFICATIONS` entry 5 with cause and misconception risk (which satisfies CLAUDE.md
§3), and the ledger does reach the student device at SYNTHESIS — yet **no synthesis
rail, no board line and no reveal stage says it**, while a teacher surface still
asserts the opposite (F8). The blocking condition is the gap between the ledger and
the taught text, not the economics.

**What the synthesis must say** (content requirement, not wording — I do not
implement):
1. On the `revenue-sharing` card, in the room's own numbers: the payers **really did
   end worse off**, this is what a transfer is, and no arithmetic in this lesson makes
   them whole. Name it: **REDISTRIBUTION IS A TRANSFER, NOT A FREE LUNCH.**
2. Immediately beside it, the counter as an *argument owners actually have*, not a sum
   the class can settle: the payers agree to it in a collectively bargained deal
   because they need 29 solvent opponents to have a league to sell; and in the leaked
   year the Lakers still cleared about $115M after paying in.
3. State the horizon honestly (F7): three weeks shows the transfer; the cost of the
   lost effort lands in **Draw**, next season, which this lesson does not price.
4. Leave the question open on the board. "Was your rule fair?" is the right ending for
   grades 5–6 and the module already has the Kings vote to model that disagreement is
   not failure.

### BLOCKING

- **B1 (F1)** Handle the status-quo / no-movement branch as a first-class outcome.
  Reveal stage 4 must not ask "why didn't the big market move?" when `flatDeskName()`
  is `null` or when no arrow moved; it needs its own honest line ("nobody's best
  number moved, and here is why 5% is too small to change anyone's mind" — the
  *arithmetic* is the payload there, and it is a good one). Same for the `incentives`
  card's `rememberWhen`. Given a **71% status-quo rate**, this branch is the modal
  class, not an edge case.
- **B2 (F2)** `synth-national-bigger` must not print a comparative the model
  contradicts. The card needs branch text for `gate >= national`, and the concept
  needs restating so it survives both branches.
- **B3 (F3)** Make the L2/L3 reinvest comparison like-for-like — same base, or convert
  to dollars, or drop the "effort went down by Z%" sentence. The C7 evidence panel and
  the D9 seeding rationale both rest on it.
- **B4 (F4)** Close the `compliantCount === 0` pot bonfire. Either redistribute the
  forfeited half evenly (no bonfire, matching the comment) or make the destruction
  visible and taught. Silent annihilation of 50% of a transfer is a false lesson.
- **B5 (F5)** Make the claim audit non-vacuous as the wave contract specifies:
  (a) assert `atom.quantifier.claims` against an **independently recomputed** relation,
  so an inverted quantifier fails; (b) recompute at least the money/percent atom values
  from the reducer rather than from the atom's own expression, so a **value drift
  fails**. Until then, P9's "5/5 mutants" is not evidence that any printed number
  matches the model, and I will not accept it as such.
- **B6 (F6, F8)** Two strings: the unseeded branch of `consequenceAnswerClaimed` must
  not count desks against a lesson that was not linked; and `rehearsalWatchFor` must
  carry the same repaired open question the live `big-for-sharing` flag already has,
  not "it pays the payer through the product."
- **B7 (summit)** Ship items 1–4 of the ruling above into the synthesis and the board.

### NON-BLOCKING

- **N1 (M2)** Correct the "capacity-bound markets stay flat at ≥99% fill" claim:
  Golden State is flat at **98.7% fill and not sold out**. The named flat desk is
  always genuinely full, so the taught moment is fine; the evidence sentence is not.
- **N2 (M3)** Restate BC-1a as "up to 5 dial steps; ≥2 for five of six desks, Boston 1"
  rather than "≥3 across adopted shares."
- **N3 (M3)** In any doc or debrief, do not let "differential" drift into "big and
  small markets respond differently" — κ(s) is club-independent.
- **N4 (M4)** The CONDITION moves exactly one desk by one step at 10–40%. It is a real
  mechanism; it is nearly inert at the shares a room is most likely to adopt. Consider
  whether the room's own anti-moral-hazard tool should bite where the room actually
  legislates. Tuning question, not a truth defect.
- **N5 (F7)** Ledger the horizon's **incentive-sign inversion** in `SIMPLIFICATIONS`,
  not just its dollar scale. B7 item 3 covers the taught half; the ledger should carry
  the mechanism.
- **N6 (dominant-strategies 4)** Record that ideal share is fully determined by market
  profile, so the offer rounds — not the dial — must carry the reasoning.

### VERIFIED, NO REPAIR

BC-1c (deletion-proven), pot zero-sum, settlement ordering and attributability,
supermajority defeating headcount, no dominant proposal (P4), seed cannot distort the
vote, slot→franchise parity between L2 and L3, board cash privacy, rookie
unknowable-then-nameable with the lottery disclosed, Kings and Boston both preserving
outcome ≠ decision quality.

---

### DISSENT l3-sharing-argmax: DISCHARGED

Grounds, and the limits of the discharge. The dissent's content was that the naive
shared L3 signature is false arithmetic: sharing does not move a capacity-saturated
market's optimal price, and a uniformly-taxed all-revenue base moves no argmax. This
build does not evade that finding — it is constructed on it, and I re-derived every
load-bearing piece myself rather than accepting the harness:

1. The uniform-tax refutation is respected. `taxedLocal = gate + localMedia`, with
   in-arena and the national check untaxed. My injected mutation that taxes in-arena
   as well (making the tax uniform over the price-sensitive base) **froze every price
   argmax and was caught** by the module's own BC-1 property. Non-vacuous.
2. The untaxed stream is load-bearing by **deletion**, not assertion: `ancillary = 0`
   drives all four markets' price moves to exactly $0. The closed form
   p* = B/2k − a/2κ, κ = 1 − s(N−1)/N reproduces the shipped brute force within the
   dial grid.
3. The capacity clamp is honoured, not papered over: the two big-market profiles are
   genuinely clamped at their optimum and their price does **not** move, and the
   non-movement is the taught object rather than an embarrassment. `flatDeskName()`
   correctly refuses to name a desk that is not actually sold out.
4. The signature instrument is **not** a uniform price drop. It is the reinvest
   response, r* ∝ κ(s)², moving up to **5 dial steps** (OKC 35%→10%), ≥2 steps for
   five of six desks, brute-forced through the shipped settlement so the printed
   arrow cannot drift from the model.

That is BC-1a, BC-1b and BC-1c met on my own computation. The dissent is about
**whether the arithmetic is true**, and it is. **DISCHARGED.**

The discharge is scoped and does not launder the rest of this gate. It does not cover
what the module *says* when the instrument does not fire (F1), the audit's inability
to police what it says (F5), or the L2/L3 base mismatch (F3). Those are new findings
recorded below as their own blocking items, not a re-litigation of `l3-sharing-argmax`.

### FORMAL DISSENT — econ-l3-claim-audit-vacuous

Recorded so it survives any later decision. **The claim-audit family cannot detect a
wrong printed number.** Doubling `pot-total` in the atom makes the board print
`$15,284,066` against a true `agg.potTotal` of `$7,642,033`, and the entire 41-test
suite passes 41/41; an inverted quantifier and a frozen quantifier word likewise
survive. The audit checks that a sentence quotes its own atom and that the atom's
declared sign and bounds hold — it never compares an atom to an independently computed
model value, and it never asserts `quantifier.claims` at all. Wave 4's hypothesis was
that this instrument "can close L2's entire claim-vs-model defect class." On this
evidence it closes the sign and bound sub-classes and leaves the value and quantifier
sub-classes open, and **F2 is a live instance of the open class shipping a falsehood to
students.** I dissent from any wave reconciliation that treats the claim-audit family
as having closed the claim-vs-model defect class, and from any use of "438 atoms / 109
surfaces / 5/5 mutants" as evidence that printed economics matches the reducer, until
B5 lands and a value-drift mutant fails the suite.

*Nothing here is classroom-proven (D10). No real class has run this lesson.*

---

## RE-CHECK AFTER W4 FINAL REPAIR

Boss run `m2-quality-war`, assignment `recheck-l3-econ`. Owning-critic confirm-or-refute
of the two L3 econ dissents, fresh drive of the repaired build at HEAD (`b23719e`).

Method, this session: `npm run build` clean; `npm test` **455 pass / 0 fail**;
`node docs/gauntlet/module-2/stage0/l3-tuning-harness.mjs` **exit 0, all 10 properties**.
Nine mutants of my own design injected into an isolated copy of `dist/` in
`/tmp/claude-0/-home-user-bow-economics-live/2c7a1860-ee1d-5f9b-8309-ead93875cd08/scratchpad/mut/`
— repo never modified. Both vote arms driven through the shipped reducer. Servers stopped.
No git operations.

### DISSENT econ-l3-claim-audit-vacuous: NOT DISCHARGED

**Confirmed repaired.** The COVERAGE / VALUE / QUANTIFIER limbs are real and they bite. My
own injections, patched into the compiled module at the claim-construction site (not into the
surface objects the builder's own mutants poison), every one **CAUGHT**:

| # | my injection | limb that caught it |
|---|---|---|
| A1 | `pot-total` doubled — my original surviving mutant, re-run | VALUE |
| A2 | `synth-gate-total` × 1.12 (novel, subtle magnitude) | VALUE |
| A3b | `transfer-net-${deskNumber}` × 1.5 (novel, per-desk generic-id path) | VALUE |
| A4 | `era-l3-mean` + 3 points (novel, percent format) | VALUE |
| A5 | `pot-two-sided` pinned false (novel; a constant-word atom I named in F5) | QUANTIFIER |
| A6 | `synth-seeded` inverted with word **and** boolean flipped together, internally consistent | QUANTIFIER |
| A7 | `arrow-any-flat-price` inverted | QUANTIFIER |
| A8 | brand-new atom `pot-burn-total` with no entry in `truthFor` | **COVERAGE** |

`truthFor` genuinely re-derives from `state.clubs[*].weeks[*]` and the shipped brute-force
primitives, not from the aggregate the copy reads. Harness at head: 663 atoms / 171 surfaces /
6 rooms / 8 mutation limbs CAUGHT. The live 6-desk falsehood branch is exercised and the
`composition` card now prints a sentence true in **both** branches ("every dollar of it arrived
whether this room sold a seat or not"). **F2 and F5's sign/bound/value/quantifier sub-classes
are closed on the registered atom set. I credit the repair.**

**Why it is still not discharged — two gaps, both narrow, both live.**

**R1 (blocking) — the play surface's rendered claim is not the claim that is audited, and I
exploited it.** `moduleClaims` registers `play:desk-N:transferLine` from `agg.potFlows`, i.e.
three-week **season** totals (`writeTheRule.ts:2261`). The string the student device actually
renders is built by the same `transferLineClaimed` from a **single week's** `w.pot`
(`writeTheRule.ts:3101-3114`, rendered at `src/client/play/main.ts:3281` inside `wrTransferHtml`).
The audited string is never rendered; the rendered string is never registered. Observed at head,
12 desks, uniform play:

```
AUDITED  (play:desk-1:transferLine) : You paid $2,064,279 into the pot and took $1,353,435 back out...
RENDERED (studentView seat-0)       : You paid   $723,293 into the pot and took   $478,716 back out...
```

Injection **A9** — `paidIn: w.pot.paidIn * 1.4` on the studentView path only — makes the student
device read *"You paid $1,012,610 into the pot and took $478,716 back out. On the pot alone,
$244,577 left you"*, which is not arithmetic, and the harness **passes 10/10, exit 0**. COVERAGE
cannot refuse an atom it never sees, so "refuses to pass any atom lacking an independently
recomputed value" is true only of the registered set, and registration is decoupled from
rendering. Repair: register the per-week instances (or feed the play path the season row the
audit checks), and add a limb asserting that each registered surface's text is a string some
view function actually emits. Related, cheap: the week row ends "Everything else your books did
**this season** came off your own two dials" over one week's numbers.

**R2 (blocking, small) — the instrument is not in the suite.** `npm test` is 455 tests and
`src/test/writeTheRule.test.ts:634-659` still asserts only `s.text.includes(atom.rendered)` plus
sign and bounds — the tautology this dissent was recorded against. COVERAGE / VALUE / QUANTIFIER
/ LEVEL exist **only** in `docs/gauntlet/module-2/stage0/l3-tuning-harness.mjs`, which is wired
into no npm script and runs only when somebody remembers. This dissent's own stated discharge
condition was "a value-drift mutant fails **the suite**." It fails the harness. Wire the harness
into `npm test` (or port the four limbs into the suite) and R2 closes.

### DISSENT econ-l3-signature-reachability: NOT DISCHARGED

**RULING ON THE ARCHITECTURAL QUESTION, which the repair got right: outcome-adaptive teaching
DOES discharge reachability.** A null reading of a real instrument is economic content, not an
absence of content. In the status-quo arm the module now teaches: this rule was too small to
change anyone's best move at any desk, and the number you refused would have moved 3 of 6 desks
by up to 5 clicks — same brute force, same settlement, at a share the room itself named. That is
a genuine, computed, attributable BC-1 payload in both arms, and it is better economics than a
retuned supermajority would have been. **I confirm: do not tune the vote. BC-1 is reachable as
teaching in both arms.** Verified in my own drive: stage 4 branches on `agg.arrowsMovedAny` in
name, headline and `say`; `arrowWhyLine` carries a branch for all-flat and for no-sold-out-desk
and is printed on `/board` stage 4 and on every `/play` lens.

**Also confirmed repaired, by my own measurement:**

- **The pot bonfire is closed.** My F4 case exactly — 6 desks, 40%, CONDITION ON, nobody ever
  locks so every desk settles at `reinvest = 0` — now pays in **$10,189,377** and pays out
  **$10,189,374**: **$3 destroyed (rounding)**, against **$5,094,681 (50.0%)** at the gate.
  `settleWeek` line 899, `if (compliant[i] || compliantCount === 0) return evenShare;`, and the
  counterfactual replay carries the same guard at line 1564.
- **The L2/L3 bar is dollars a week** (`era-l2-dollars` / `era-l3-dollars` / `era-delta-dollars`),
  the sentence says why, and the harness LEVEL limb recomputes the direction from dollars. B3 met.
- **The rehearsal summit claim is gone**, and replaced by its refutation: "do not tell them
  sharing pays the payer back. In this model it does not: the payers really do end worse off."
  F8 met.
- **The CONSEQUENCE ASK is computed from the same beat as its answer** (`consequenceAskClaimed`
  → `consequenceBeat`), and `consequence-ask-direction` is registered and independently
  recomputed. B6 met on both strings; the unseeded branch now prints "no Lesson 2 to measure
  against" and counts nothing.
- **B7 items 1-4 are on the `revenue-sharing` card**, including REDISTRIBUTION IS A TRANSFER,
  NOT A FREE LUNCH, the payers' collectively-bargained counter with the Lakers' ~$115M, and the
  honest horizon in the `ourClass` rail.

**Why it is still not discharged.** Driving the sincere 6-desk status-quo arm (BIG propose 0%,
small propose 60%, seeded from L2 — the arm P5 puts at 71% of proposal profiles):

**R3 (blocking, highest severity in this re-check) — the module tells a room that wrote no rule
that it wrote one.** In that arm `board:adoption` prints *"NOT ADOPTED — the old rule holds at
SHARE 5%"*, while `reinvestEraLineClaimed` — which has no `rule.how` branch — prints *"**Under
the rule you wrote**, it put back $264,882 a week."* Registered surfaces carrying it:
`board:consequence:era`, `teach:consequence:answerKey`, `synthesis:incentives`. Through the view
functions it reaches **13 surface/phase combinations across all three surfaces**, including
`/board` REVEAL and CONSEQUENCE (the projector), `/play` SYNTHESIS (the student device) and
`/teach` throughout. No atom covers the phrase, so the audit is structurally blind to it — this
is R1's class on a second surface. `adoptedScriptClaimed` already models the fix: it branches
per arm and registers `script-arm`.

**R4 (blocking) — stage 4 and stage 5 contradict each other in that arm, and the contradiction
is the module's own false lesson.** Stage 4: *"The best price and the best thing to put back are
exactly where they were **with no rule at all**, at all 6 desks."* Stage 5 and the teacher's ASK,
two beats later: *"Effort went down by $135,118 a week… did anybody DECIDE to try less — or did
it just stop being worth it?"*, answer *"The answer you are fishing for is the second half: it
stopped being worth it."* That is a moral-hazard attribution in a room whose own instrument just
showed **zero incentive movement at every desk**; the fall is whatever the room's dials happened
to do. `consequenceBeat` consults `agg.arrowsMovedAny` in its `noL2` branch and **not** in its
`down` / `up` / `flat` branches (`writeTheRule.ts:2299-2367`) — the guard exists and was not
applied where an L2 seed is present. It sits on the teacher answer key, so the random-teacher
standard makes it worse, not better. The `down` branch needs the same `arrowsMovedAny` split the
`noL2` branch already has.

**R5 (non-blocking) — the counterfactual column can name a share nobody argued about, or move
nothing.** Sweep of 1,000 six-desk rooms over a 10-point proposal grid, driven through
`runAdoption`: 5 rooms print *"At 30% — the number this room argued about and did not pass"*
where `runnerUp <= share` forces the fallback `REAL_RULE_SHARE = 30` (`writeTheRule.ts:1448`) and
nobody proposed 30; 3 rooms print a would-move column that moves **0 of 6** desks while the
stage-4 script tells the teacher *"those are the dials it would have moved."* Both need a room
clustering at 0-5%, so this is a tail, not the modal case. The `arrow-would-share` atom's value
is correct in every one — the falsehood is in the unatomed noun phrase around it, which is R1's
class a third time. Either gate the sentence on `wouldMoved > 0` and on the share having been
proposed, or say "at 30%, the league office's own number" when the fallback fires.

**R6 (non-blocking) — scripted memories of moments the arm did not produce.** `synthesis:incentives`
`rememberWhen` ("The moment somebody in this room worked out that trying harder had got cheaper
to skip") and `synthesis:revenue-sharing` `rememberWhen` ("Week 1, the moment the pot formed:
money left 0 desks and came back out in equal portions") both print in rooms where the pot never
formed and nothing moved. My F1 note on `rememberWhen` was not carried into the repair. Zero-atom
rails, unauditable by construction.

**R7 (non-blocking, shared with projector) — on-frame tension at stage 4 in the no-movement arm.**
The board renders `arrowsWouldMove` (three price arrows visibly moving) with `arrowWhy` beneath
reading *"Nobody's best price moved."* The counterfactual column header disambiguates it, so this
is defensible; two lines that read as contradictory on one projector frame is the projector
gate's call as much as mine.

### VERDICT OF THE RE-CHECK

**BLOCKED (economic-truth)**, on R1, R2, R3, R4. Materially narrower than the gate: the audit's
value and quantifier sub-classes really are closed on the registered set, the bonfire is really
closed, the dollars bar and both teacher strings are really fixed, and outcome-adaptive teaching
is the right answer to reachability and is ruled sufficient. What remains is one structural gap
(registered ≠ rendered) showing up at three sites, one missing branch guard, and one unwired
harness. None of them requires a redesign.

**Both dissents stand.** They are recorded so a later reconciliation cannot treat the
claim-vs-model defect class as closed, or the signature as true-of-its-arm, on the strength of a
harness that passes. *Nothing here is classroom-proven (D10).*
