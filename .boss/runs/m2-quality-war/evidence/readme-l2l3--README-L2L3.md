# Stage-0 — Lesson 2 (hosting/externality) and Lesson 3 (rule-writing)

Builder deliverable, assignment `proto-l2-l3`, Boss run `m2-quality-war`. Status of everything
below: **built, played by script, not classroom-tested.** Nothing here is "classroom-proven"
(CLAUDE.md §13) — these are Stage-0 falsifiability instruments, not finished lessons.

Files in this directory (this builder's scope only — `l1*.html` and `README-L1.md` belong to
another builder and are not touched or read for content here beyond the shared CSS/action-naming
convention, which is deliberately matched for consistency across the Stage-0 set):

- `l2-hosting.html` — the L2 "somebody else's building" HOST/externality loop (Design B "Somebody
  Else's Building" + Design C "You Don't Play Alone" convergence).
- `l3-rule.html` — the L3 rule-writing loop, with Design B's "operate a given real rule" fallback
  as a toggle (Design C "Writing the Rule", most fully specified of the three).
- `l3-arith.mjs` — a Node, no-dependency brute-force harness that settles the arithmetic claim all
  three designs' L3 depends on: **does a sharing rule move a seat's own optimal price down?**

---

## `l2-hosting.html` — what it implements

A six-desk mini-league (1 human desk + 5 deterministic bots), four weeks, fixed round-robin
schedule (hardcoded host/away pairs, not randomly generated — every desk hosts exactly twice and
travels exactly twice across the season). Every week the human makes two decisions:

- **OPEN THE HOUSE** — sections (0–5), a capacity commitment that costs cash *before* the crowd is
  known (Design B's verb), active only on the human's home weeks.
- **BUILD THE DRAW** — reinvest 0–40% of the desk's *own last home gate* into Draw, which decays
  weekly if unspent, has the same ceiling for every market (a big market cannot buy dominance), and
  pays off a week later, elsewhere too (Design C's verb).

After each week's commit, the **DECOMPOSITION REVEAL** splits the human's home-night gate into
"what your decision did" (own market strength × your open sections) and "what the visitor's draw
did" (the visiting desk's printed Draw, converted to fans against your remaining capacity) — framed
per-matchup ("your home night vs Charlotte"), per Design C's U2 fallback note, rather than as a
league-wide leaderboard that could read as "your fault." On away weeks the reveal instead shows
"money you generated elsewhere" — the dollar value the human's own Draw put in the host's building,
landing on the host's books, not the human's — which is the loop's other half and the thing the
task asked to make visible ("the human's Draw also fills bot buildings").

A light equal-split "national pot" line (fixed base + a small term in total league Draw) is
included per C3's three-pipe structure, but it is informational only — the pool mechanic with real
teeth (a share dial, a condition, adoption) is L3's job, not L2's, and is not duplicated here.

**Bots are deterministic, not random.** Three seed-selected scenarios rotate team names/starting
parameters; within a scenario every bot's section-opening and reinvest behavior is a fixed lookup
table (e.g. Charlotte never reinvests — the design docs' predicted "converges on never spend on
Draw" equilibrium; Oklahoma City ramps reinvestment 10%→40% across the season — a small-market
"builds its way up" path per R8). Cleveland's Draw is cut by a scripted, printed "star departs"
event at week 3, echoing SR-11 (LeBron 2010), to test whether an attributable exogenous shock reads
clearly in the log.

**Omitted from this Stage-0:** Design A's separate "call your showcase" road-decision (B/C don't
have it, and the task named B/C as the convergent design for L2); a full recoverability brute-force
proof (that discipline is exercised properly in `l3-arith.mjs` instead, per the assignment's split
of labor); price-setting (L2's verb is HOST, not PRICE — no price dial here, ticket+ancillary
revenue is a flat modeled `$40/fan` regardless of week, deliberately, to keep the decomposition
reveal isolated to the host/draw mechanism it is testing).

**Bug found and fixed during self-verification:** the first implementation updated a desk's "last
home gate" (the base the reinvest dial spends against) *before* computing that week's reinvestment,
which let the dial spend against the gate that had just landed the same week instead of the prior
one — Draw hit its ceiling in a single commit for any well-off desk, killing the gradual-growth
feel Design C's C10 depends on. Fixed by reordering: reinvest against the *prior* `lastHomeGate`,
then update it for next week. Confirmed via the Playwright driver (see Evidence in the builder
report) that Draw now grows over 1–2 weeks rather than maxing immediately.

## `l3-rule.html` — what it implements

Two dials (Design C's, the most specified of the three): **SHARE** (0–60%, 5-point steps — the
fraction of local revenue pooled and split equally) and **CONDITION** (on/off — must a desk
reinvest ≥15% to collect its *full* pool share, "the teeth"). Three 90-second offer rounds: each
round the human sets a proposal, commits, and sees an **anonymous, unsorted histogram** of all six
desks' current proposals plus the running median (no names, no ranking, per R13/D4) — matching
Design C's exact mechanic, including the between-round argument beats a real teacher would run live
(this Stage-0 has no argument step; it is arithmetic, not a facilitation tool). Bots drift their
proposal toward the running median at a fixed per-bot rate each round (one bot — the market
assigned Cleveland's slot — is a scripted holdout, drift rate 0, to test whether the negotiation
can still clear two-thirds without unanimous convergence).

**Adoption:** two-thirds of desks within ±10 points of the round-3 median, exactly as specified.
If it clears, the adopted share is the median and the adopted condition is the round-3 majority
vote; if not, status quo (5%, no condition) holds, printed as "a legitimate outcome, not a failure
state," per the design docs' own framing.

**LIVE UNDER IT:** one week under the old rule (SHARE 0%), one week under the adopted rule, same
six desks. On both weeks the human sets their own REINVEST dial by hand — a real "same hand, twice"
data point, not just a computed abstraction — while all five bots **re-optimize by brute force**
over the reinvest grid `{0,10,20,30,40}` under the take formula below. The BEFORE/AFTER board shows
every desk's reinvest and take, before and after, plus the room's mean reinvest shift.

**Fallback toggle (Design B's prescription):** a button skips the three-round vote entirely and
sets a modeled, real-NBA-scale share (labeled explicitly as an order-of-magnitude stand-in, not the
league's actual formula), then runs the identical before/after season under it. Exercised in
Playwright evidence below — no console errors, distinct adopted-rule object (`fallback: true`).

**Take formula used for both the negotiation's economics and the live season** (this is the model
`l3-arith.mjs` also brute-forces, restated here for one auditable source of truth):

```
localRevenue(base, r%)  = base + BONUS_SCALE * sqrt(r% * base)      // Draw-style diminishing returns
take(base, r%, s, poolShare, condition)
  = (1 - s/100) * localRevenue(base, r%)                             // gate + ancillary, shared
  + (condition && r% < 15 ? 0 : poolShare)                           // the teeth
  - (r% * base / 100)                                                // reinvestment cost, unshared
```

**Modeling simplification, stated plainly:** the pool that funds `poolShare` in the AFTER season is
sized from every desk's *actual BEFORE-season reinvest choice* (a fixed reference point), not from
a fully solved simultaneous equilibrium of everyone's AFTER-season reinvest choices — each bot then
best-responds to that fixed pool. This is a single-round best-response, not a Nash equilibrium; it
is deterministic, reproducible, and defensible for a Stage-0 instrument, but a full build would need
to decide whether iterating to a fixed point (or accepting the single-round approximation) matters
for the classroom-visible number.

**Omitted from this Stage-0:** the Celtics/Harden commit-then-reveal hook (Beat 1 in Design C) and
the Kings-vote ARGUE capstone — both are narrative/historical reveal beats with no arithmetic to
brute-force, and are lower-risk than the two things this file exists to test (can a room reach
adoption in three rounds, and does the adopted rule visibly move reinvest behavior).

---

## `l3-arith.mjs` — the load-bearing claim, brute-forced

Design A names the claim explicitly as **inferred, not verified** and specifies this exact check
(`DESIGN_A_BOXOFFICE_EVOLVED.md` §5, U3): *"brute-force the take function across share levels to
confirm the optimal price falls monotonically in `s` and by more than one dial step at plausible
shares."* This script is that brute force, run for real for the first time, over the full $10–$120
(step $2) price grid for `s ∈ {0, 0.1, 0.2, 0.3, 0.4, 0.5}`, for the two markets (New York, Memphis)
that have fully specified linear-demand constants anywhere in the three design docs
(`DESIGN_C_FIRSTPRINCIPLES.md` L1 "SYSTEM THAT REACTS"; nightly bills adapted from
`DESIGN_B_REFOUND.md` L1, both **modeled, not measured** — see SR-1).

**Model:** `q(p) = clamp(base − sensitivity·p, 0, capacity)`;
`take(p, s) = (1 − s)·p·q(p) + ancillaryPerFan·q(p)` — the sharing rule taxes *only the gate*, and
leaves per-fan ancillary/in-arena spend fully with the host, which is Design A's own stated L3
formula ("Take = (1 − s) × own gate + equal share of pot + national money"). This choice matters
and is not arbitrary: **if a sharing rule instead taxed all local revenue uniformly (Design C's
broader "gate + in-arena + local media" sharing base), a proportional tax cannot move a price
argmax at all** — scaling a function by a positive constant `(1−s)` does not change where it peaks.
The price-shift mechanism the signature board moment depends on requires an *untaxed* revenue
stream sitting alongside the taxed one; that is present in Design A's exact wording and used here.
**This is worth flagging to whichever candidate's L3 gets built**, because Design C's own stated
sharing base (all local revenue) would need this narrowing (share the gate only, not the ancillary)
to produce the price-movement claim at all — as written, Design C's formula produces zero price
movement, only a reinvest-marginal-return effect (which is what `l3-rule.html` actually tests, and
does find working).

### Run it

```
node docs/gauntlet/module-2/stage0/l3-arith.mjs
echo "exit: $?"
```

### Real output, this session (exit code 1 — see builder report for the full transcript)

```
CLAIM (i) — each seat's own optimal price falls as s rises:
  FAIL  NEW_YORK     fallsEachStep=true  everMoves=false
  PASS  MEMPHIS      fallsEachStep=true  everMoves=true
  OVERALL: FAIL

CLAIM (ii) — the fall is monotonic (no reversals across s=0%..50%):
  PASS  NEW_YORK
  PASS  MEMPHIS
  OVERALL: PASS

CLAIM (iii) — the fall exceeds one dial step ($2) by s=50% (the signature board moment):
  FAIL  NEW_YORK     drop@50%=$0 (0.00 steps) NEVER EXCEEDS 1 STEP
  PASS  MEMPHIS      drop@50%=$6 (3.00 steps) firstExceedsAt=40%
  OVERALL: FAIL

CLAIM (iv) — no market becomes unwinnable (best take ≥ nightly bill) under any tested rule:
  PASS  NEW_YORK     clears bill at every tested share
  PASS  MEMPHIS      clears bill at every tested share
  OVERALL: PASS

FINAL VERDICT: AT LEAST ONE LOAD-BEARING CLAIM FAILS
```

### The finding, stated plainly

**Memphis (a market whose demand never reaches capacity) behaves exactly as claimed:** its optimal
price falls monotonically from $24 (s=0%) to $18 (s=50%), a 3-grid-step drop that first exceeds one
step at s=40% — the signature board moment is real and computable for this market.

**New York (a market whose "neutral card" demand already exceeds capacity at every price near its
optimum) does not move.** Its capacity-constrained optimum sits at a fixed grid point ($48) for
every tested share from 0% to 50% — because once demand exceeds capacity, taking a *lower* price to
capture more of the untaxed ancillary stream stops paying off: there are no more empty seats to
fill, so lowering price only gives away gate money for zero additional attendance. The signature
board moment **requires slack demand.** A market whose building is already effectively sold out at
its L1-tuned constants gets no price movement from a sharing rule, no matter how high the share.

This is not a coding defect — it is re-derivable by hand (see the algebra in the script's header
comment) and it is a genuine, previously-unverified property of the design as currently specified.
**It should not be papered over by retuning New York's constants until the test passes**; the
correct next step is a design decision (does L3 need a different, less-saturated market slate than
L1's, or does the "sharing changes your price" moment get scoped to only the markets where it's
true, with a different signature moment for saturated markets — e.g., a *sections/capacity* shift
instead of a price shift for a sold-out market) that Economic Truth or the winning architecture's
owner should make with this evidence in hand, not this builder.

---

## Stage-0 questions this evidence speaks to

From the design docs' own uncertainty lists:

- **Design B U2 / Design C U2** ("does the room attribute the money to the visitor, or to itself?")
  — `l2-hosting.html`'s decomposition reveal is framed per-matchup (Design C's fallback if the
  per-desk framing reads as accusation) from the start, and its log records the exact dollar split
  every week, which is what a real classroom pilot would need to score attribution accuracy against.
  This Stage-0 does not itself answer the human-subjects question (no students played it) — it only
  proves the mechanism is computable and legible enough to test.
- **Design A U3 / Design C's L3 arithmetic claim** — answered directly and honestly above: **true
  for markets with slack demand, false for capacity-saturated ones**, a materially more precise
  answer than any design doc currently has.
- **Design C U3** ("can a room design and adopt a rule in eight minutes / three rounds?") —
  `l3-rule.html`'s negotiation converges to a two-thirds-adopted rule within three rounds in the
  scripted playthrough (see builder report), but this is deterministic bot drift, not real
  ten-year-olds; it demonstrates the *mechanism* can produce adoption, not that a real room will.
- **Design B U3 / the L3 fallback** — the "operate a given real rule" toggle is built and exercised
  (see builder report evidence); it produces a distinct, valid before/after season with no special
  handling required, confirming the fallback path is not a late add-on risk.

## How to run everything

```
node docs/gauntlet/module-2/stage0/l3-arith.mjs; echo "exit: $?"
```

Open `l2-hosting.html` and `l3-rule.html` directly in a browser (`file://` — fully offline, no
build step, no dependencies). Add `?debug=1` to either URL to reveal the hidden economic constants
that are otherwise kept in a closure and never shown to a student. Both files expose
`window.__stage0` (full JSON-able session log) and `window.__stage0Actions = { setControl(name,
value), commit(), advance(), newRun(seed) }` for scripted driving.
