# W4 — THE BILL COMES DUE: experience direction

<!-- Written from the experience-director's inline delivery, 2026-09-04. This is direction and risk, not the full spec: the director's contract stopped short of a spec. Design authority: D59 ruling 8, W4_BILL_RESEARCH.md. -->

> **Integrator rulings on the open questions (provisional, for the founder):**
> 1. **The roster earns something in Week 4 — in renewals, not tonight's cash.** A carried roster whose signings DO THE JOB shifts the renewals book; the this-season curves and the Two Peaks reveal stay tuned as they are. Until that term is built, the product SAYS OUT LOUD on the HOOK that tonight's crowd does not depend on the roster and that the roster's payoff lands in the renewals line and in Weeks 5–6. Silence is the one option refused.
> 2. **The cut to pay for the bill:** the counterfactual pages shrink to one (the desk's own night), and the seventh reveal step is folded into the ledger moment. Recorded for the founder.
> 3. **Unequal feasibility is the lesson**, measured per desk as coverage of its OWN bill (a filled bar at 5-6, a percentage at 7-8), never a class ranking; it is Week 5's setup.
> 4. **Week 1 is not touched to plant the bill.** Week 4 opens with "nothing in the window told you this was coming — it never does."
> 5. **Human dependency cadence:** a quiet destination strip on every settlement plus one dramatised ledger moment; only sourced destinations ship (escrow, the tax pool, revenue sharing) until Sports Reality dates the rest.

## direction

**Target sentence:** "The players I signed in the window have a price, and I found out what it is on a Tuesday in January." The week's feeling is not *did I win the night* — it is a line appearing on five consecutive settlements that the desk did not choose tonight and cannot argue with. The reveal must turn the desk **backward at its own signing**, not sideways at a classmate's number.

**The one structural move that decides whether this week works.** Observed: `fullHouse.ts` demand depends only on the *visitor's* Draw, day and TV (`MARKETS` 216–273; `CARDS` 489–594). The home roster never touches the crowd. Add a payroll line to that model and a student reasoning correctly from what the product shows concludes *players are pure cost and produce nothing* — which is false economics, and it retroactively makes "sign nobody" the right Week 1 play. Direction: give the carried roster **one revenue channel this week, in renewals, not in tonight's cash**. A stronger carried roster shifts the renewals book (next season's money), leaving the tuned this-season curves, the R6/R8 repairs and the Two Peaks reveal untouched (BC-2, `GATE_L1_ECON_R1/R2/R3`). This simultaneously repairs the second failure below. If the founder declines the mechanic, the product must *say out loud* that the crowd here does not depend on your roster and that the roster's payoff lands in Weeks 5–6 — silence is the one option that teaches the false lesson.

**Renewals must not collapse under the bill.** `GATE_L1_ECON_R1` was fought specifically to stop RENEWALS being lagged cash. An existential this-season bill makes the cash book dominate: a desk that must clear a number rationally stops paying for next season. Two counterweights: the roster→renewals channel above, and a **W5 seed in which the pool draw visibly derives from renewals**, so protecting the second book is rational inside the arc rather than virtuous.

**Coverage, not a verdict.** `clearedTheBill` (`fullHouse.ts:1126`, set at `:1729`) is a binary and should be demoted from the headline. Inferred from the published constants (`BILL_MODEL`, `LUXURY_TAX`, `W4_BILL_RESEARCH` §8): a New York or Minnesota desk carries a per-night players line near or above the doors, while an under-the-tax desk barely feels one. Whether a desk clears is then mostly assigned by which club it drew in Week 1. The week must report **how much of *your* bill you covered, night by night** — a filled bar at 5-6 (no percent, `profileFor("5-6").allowsPercentages === false`), a percentage and a negative at 7-8. Unequal feasibility is defensible and is the Week 5 setup, but only if the product measures each desk against its own number.

**Attribution is the whole reveal.** `Obligation.signings` already carries name, annual, tool and `coveredThrough` (`fullHouse.ts:846–855`). Every settlement should be able to say *which* signature wrote tonight's line, in dollars. Without that the bill is a difficulty setting; with it, "our decision caused that" is available on Night 1.

**Human dependency = where the money goes, always; never who starves when you fail.** Name destinations on every settlement (a small, quiet destination strip), dramatize once on the season ledger. The strongest sourced destination is the **luxury tax transfer** — half goes to clubs that stayed under; 2024-25: $461.2M, $11.5M to each of 20 (`W4_BILL_RESEARCH` §3, HIGH) — because the money a taxed desk pays this week literally arrives as someone else's check in Week 5. Second strongest: **players' escrow** (51/49 BRI, >$480M returned in 2024-25, §2, HIGH).

**Public/private split, restated for this week.** Payroll and tax status are *real-world public*. The board may carry all eight franchises' bills from Night 1 while tonight's price stays blind until settlement (BC-4). That is honest, dramatic, and it seeds Week 5's inequality argument for free.

**Press Conference / Tape.** Bible §13.2 assigns W4 the gate call as the Commitment Capture — correct: the existing free fill call (`GATE_CALL_PROMPT`, `:1391`) plus one chip, two inputs, no form. The week's own Tape type is not in the bible table: call it **THE SIGNATURE** — the Week 1 decision shown beside the line it wrote. Hard constraint below.

## experience-risks

Ranked, highest severity first.

1. **Payroll as pure cost teaches "never sign anyone."** Observed model independence (above). Course-level false lesson; also poisons Week 1 retroactively. Highest severity because it is a truth failure, not a fun failure.
2. **The bill kills the second book.** The module's only STRONG-rated mechanic (`stage0/PLAY_REVIEW.md`) is the two rival books. Existential this-season cash dominates next-season renewals. Undoes `GATE_L1_ECON_R1`.
3. **`MODELED_DOLLARS_LINE` becomes false on contact.** `fullHouse.ts:2856-2857` states "tonight's bill is what it costs to open the doors, **not what the players are paid**." The moment `payrollLine` (`:708`, `:740`) is in `net`, that pre-commit sentence is a lie on the student's own screen — the exact defect class `GATE_L1_ECON_R3` R7 was raised on. Must be rewritten in the same wave, not after.
4. **A behind desk loses a lever for the rest of the lesson.** "A desk in debt cannot spend on the night" (`:1522`) was tuned without a payroll line. With one, a high-tax desk can be locked to one dial from Night 1 while its neighbour keeps two. Recoverable-in-principle is not recoverable-in-feeling. Re-examine with the bill in.
5. **Sixty minutes cannot absorb five new artifacts.** W4 already runs seven reveal steps, CF pages and synthesis cards, and is now asked to add the bill, the human dependency, Commitment Capture, a Press Conference and a 7-8 translation table (D59 ruling 7). Something existing must be cut to pay for it; if nothing is cut, the protected ending is what silently goes.
6. **Retroactive punishment of Week 1.** Nothing in the window told the desk a bill was coming. A Press Conference that asks "why did you sign him?" with Week 4 knowledge violates §12.3 and, worse, teaches the room that the course sets traps. Six-week trust is the asset at risk.
7. **Human-dependency facts are unsourced.** NOT VERIFIED in any repo evidence: arena/event-staff employment structure, city arena-debt service, and any dated basketball-operations hiring freeze. Only escrow, the tax pool and Memphis revenue sharing ($28M, 2021-22) are sourced (`W4_BILL_RESEARCH` §2/§3/§5). Copy cannot be written for 3 of the 4–6 destinations until Sports Reality sources them with dates.
8. **Dead money cannot yet be attributed to the student.** `carry.ts:159` takes `deadMoney` from the real club, and Week 3 is not built (D59 mapping). The founder brief's "dead money from a Week 3 waive" does not exist. Present it as inherited, with the real player named if sourced — never as the desk's own choice.
9. **Two money scales at grade 5.** A real $203.6M beside a modeled $412,683 is a comprehension hazard, not rigour. One number and names at 5-6; the table is a 7-8 authority artifact.

## non-negotiables

- No NBA player is ever shown unpaid because a desk mispriced tickets. Contracts are guaranteed and escrow-backed; that would be false economics dressed as pathos.
- Human dependency is roles and institutions with real dated consequences (hiring freeze, renewal price rise, a fixed public debt payment that does not care about your season) — never a named suffering individual, never a fictional sympathetic character. Each destination carries a source and read date, or it does not ship.
- The bill is stated as a **season**, never a night, using the §6 sentences verbatim per band; each night names its fifth and says so.
- Modeled dollars carry a visible translation on every surface where they appear — student, board, teacher (D59 ruling 8). `MODEL_SCALE` stated once as a reversible multiplication.
- Missing the bill is a consequence, never game over, and never silently removes a control the desk had.
- Dead money is unrecoverable and never offered as recoverable; no mechanic lets a desk "win it back."
- 5-6: no percent, no negative, no two-column table, ≤40 blocking words, ≤2 new terms, 2 argument moves, debrief converges. 7-8: ≤70 words, ≤4 terms, 3 moves including the strongest case against its own pricing (`gradeBand.ts` PROFILES).
- Blind commitment holds: no private price on any shared surface before settlement. Payroll and tax may be board-public from Night 1 because they are public in reality.
- The Tape reconstructs the Week 1 information state and asks a forward question ("what would you tell yourself in the window?"), never a gotcha. Decline-once and invited-first-appearance protections apply (§12.2).
- No XP, ranks or leaderboards; bill coverage is never a class ranking (D4).
- The W4→W5 seed stamps the band and is refused across bands (BC-18), splits state from evidence (ARC_DESIGN §2), and carries both books plus tax actually paid.
- This direction is advisory and I am not eligible to certify the result; a fresh critic must review the built week (CLAUDE.md §5).

## open-questions

1. **Does the roster earn anything in Week 4?** My recommendation is a carried-roster term in renewals only. Founder call, because it touches tuned constants and the module's rated mechanic.
2. **What is cut from Full House to pay for the bill in 60 minutes?** The lesson is currently being asked to carry two lessons; naming the cut is a product decision I may not make.
3. **Is unequal feasibility the lesson?** Some Week-1 clubs appear structurally unable to clear (inferred arithmetic on `BILL_MODEL`/§8, not run). Accept and teach it as the Week 5 setup, or handicap it?
4. **May Week 1 be touched to plant "the bill is coming,"** or must Week 4 absorb the surprise with an opening line that says nothing told you?
5. **Human dependency cadence:** a quiet destination strip on every settlement plus one dramatized ledger moment (my recommendation), or a single reveal-only beat?

**Formal dissent recorded:** if the week ships with payroll as pure cost and no roster payoff channel or explicit statement of that limitation (risk 1), I dissent — that is a false-economics failure under CLAUDE.md §8, and a final decision to ship does not erase it.
