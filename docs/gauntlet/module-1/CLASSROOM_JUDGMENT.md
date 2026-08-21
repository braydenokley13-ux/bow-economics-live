# Module 1 Classroom Judgment — "The Cap"

**Judge role:** Classroom/product judge, scoring for a real one-teacher, one-period,
Chromebook-cart classroom of 10–12-year-olds — not for engineering elegance alone.

**Method.** Each design scored 1–10 on six criteria. Scores are diagnostic, not additive —
the winner is chosen on fit to the charter and product bar, not on whichever total is
highest. Design A = Legacy-Maximal, Design B = Refounded, Design C = First-Principles.

## Scores at a glance

| Criterion | A (Legacy) | B (Refounded) | C (First-Principles) |
|---|---|---|---|
| Student Pull | 6 | 9 | 8 |
| Role Clarity | 8 | 7 | 8 |
| One-Teacher Operability | 9 | 7 | 7 |
| Debrief Quality | 7 | 9 | 9 |
| Time Realism | 8 | 7 | 7 |
| Feasibility | 9 | 6 | 7 |
| **Total (reference only)** | **47** | **45** | **46** |

---

## Student Pull

**A — 6.** Building a roster from real players is inherently likable, but Lesson 2's decision
is picking one of four pre-authored strategy cards (Star Chaser/Balanced/Future/Safe) whose
deltas fire immediately — that reads as choosing a label, not pricing anything. Lesson 3 is
almost entirely projector-driven with the student reduced to ranking two dot-plots. Nothing here
is bad, but nothing produces a "wait, WHAT?" moment either.

**B — 9.** Two genuine surprises carry this design: discovering your build was silently played
under a different cap rule than your neighbor's, then watching your own roster get re-priced
live under the other two rules with no rebuild; and blind-bidding a slider against a hidden
rival number you only learn after locking. The Lesson 3 "you're already partly cap-jailed and
didn't know it" opener is a strong hook few 11-year-olds will see coming.

**C — 8.** Lesson 2's simultaneous class-wide reveal — everyone finding out at once whether
their risky pick paid off — is the single most dramatic beat written across all three designs.
Lesson 1 is deliberately uncertainty-free (a defensible sequencing choice) so it under-delivers
on its own, and Lesson 3's fairness-by-design frustration ("hold that feeling") is a real hook
but a two-edged one that must be handled with care.

## Role Clarity

**A — 8.** "Pick a GM style, that sets your budget and your priority stat" is legible in
seconds, and the four live meters make the role's job (spend without breaking things) visible
immediately.

**B — 7.** "You are a GM with a budget" is instantly clear, but the regime layer (Hard/Soft/No
Cap+Tax) adds a rule-within-a-rule a student must absorb before the first purchase — not hard,
but one more beat than A or C need before play starts.

**C — 8.** "$100M, five slots, fill them all" is about as clean as a scarcity role gets. The
Lesson 3 group split (No-Cap Big/Small Market vs. Cap) is explained in one line per group and
doesn't muddy the core GM identity.

## One-Teacher Operability

**A — 9.** Fully individual decisions throughout, a staggered (not synchronized) shock, and
scripted 30-second rescues at every step. A teacher can circulate and let the system carry the
pacing; nothing requires the whole room to be in the same place at the same second except the
final reveal, which is facilitator-triggered off already-submitted data.

**B — 7.** Workable, but the design's own risk section names the real cost: L2 and L3 reveals
require an announced hard lock-time because "a single straggler holds up the room," and the L1
counterfactual reveal asks the teacher to actively drive a live tool (pick volunteers, trigger
re-pricing) rather than just circulate. Multi-day continuity also means a teacher may need to
troubleshoot a missing save on session two or three.

**C — 7.** Also depends on a synchronized lock-then-reveal moment in L2 (explicitly the
design's top self-flagged delivery risk), and L3 requires standing up two differently-configured
conditions in one room rather than one uniform ruleset — a real but manageable increase in setup
complexity over A.

## Debrief Quality

**A — 7.** The L2 tax-line tally and L1 scatter are solid, direct aggregations. L3's two
dot-plots (cap vs. recomputed no-cap, built from the class's own submitted numbers) is a
genuinely evidence-based closer, though it's a recomputation of numbers already submitted rather
than something that happened live today — one derivative step removed from the room's felt
experience.

**B — 9.** The Deadline Board (won/lost/overpaid vs. the tax line) is exactly the debrief the
curriculum wants, with zero interpretation needed. The capstone Wins-vs-Flexibility-Remaining
scatter is the richest single artifact across all nine lessons in the portfolio: it exposes a
non-obvious tradeoff (winning now vs. keeping options open) that has no single right answer and
guarantees disagreement.

**C — 9.** Lesson 3's split-room chart is the most scientifically honest "why the cap exists"
evidence of the three designs — it isolates one variable (the rule) while holding the market
constant, so the class's own data either shows the gap or shows it closed, with nothing else to
explain the difference. Lesson 2's safe-vs-risky-outcome scatter is a close second, teaching
that neither strategy dominates using the room's own real, divergent results.

## Time Realism

**A — 8.** All three minute-by-minute plans sum correctly, and the staggered shock in L1
specifically avoids the single biggest classroom timing hazard (a room-wide freeze waiting on
slow finishers).

**B — 7.** Plans sum correctly, but the design's own risk list admits the hard-lock-time
requirement isn't proven, and L1 stacks freeze → reveal → debrief in the last 17 minutes of a
45-minute period — tight if the build phase runs long.

**C — 7.** Plans sum correctly; L2 allots only two minutes (25–27) between "students still
revising" and "everyone locked for the simultaneous reveal," which is thin for 25–30 students of
uneven pace, and L3 spends real minutes briefing two different rule conditions.

## Feasibility

**A — 9.** Reuses two legacy engines nearly verbatim, including the portfolio's only asset with
a passing test suite; changes are bounded (copy fixes, one field rename, curveball reweighting).
No new simulation logic is required anywhere, and no realtime sync is needed. Lowest technical
risk by a clear margin.

**B — 6.** The most infrastructure of the three: a multi-day, per-student save/resume system
(with a printable fallback code) across all three lessons, a live cross-regime re-pricing engine,
and an entirely new three-token "cap jail" state machine. The design's own risk section names
continuity as "the single biggest fragility" — an honest and correct call.

**C — 7.** Lesson 1 is the cheapest lesson in the whole portfolio (deterministic, no simulation).
Lesson 2's simultaneous class-wide resolution is real technical risk, self-flagged by the design
as the top delivery risk, but it only has to survive once (not across three days of state), and
Lesson 3 reuses the same build UI three ways rather than inventing new mechanics — a lighter
continuity burden than B by deliberate design.

---

## Winner: Design C — First-Principles

Design C wins on the strength of the one thing this module's charter names as its most
distinctive learning goal: making the cap legible as *an institution that exists for a reason*.
Its Lesson 3 is a true controlled comparison — same market, one changed variable (the rule) —
and the resulting chart is the most direct, most honestly-earned piece of evidence for
competitive balance in any of the nine lessons across all three designs. Paired with Lesson 2's
simultaneous blind reveal (the strongest single dramatic beat in the portfolio) and a clean,
grade-appropriate number system ($100M in $10M steps, five slots priced $10–60M), it delivers
real student pull without the heaviest engineering lift. Its continuity strategy is also the more
defensible one for a real cart of shared Chromebooks: one continuity hop (L1→L2), not three days
of resumable state, and the L2→L3 seam is an explicit, argued tradeoff rather than an
unacknowledged gap. Design B is a close second and arguably more thematically unified around the
cap-as-institution idea across all three lessons, not just the last one — but its win comes at
the cost of the portfolio's highest technical and operability risk (multi-day save/resume, a live
re-pricing engine, a new token-lock state machine, hard lock-time choreography), which matters
more for a product one teacher must run solo, live, on real hardware. Design A is the safest and
cheapest build and the best-operated of the three, but its Lesson 2 decision is closer to
selecting a label than pricing anything, which undercuts the product bar's core requirement that
economics itself generate the drama.

## Grafts — strongest elements worth pulling into C later

1. **Regime-blind counterfactual re-pricing (Design B, L1).** Re-pricing a student's *own*
   already-built roster live under a rule they didn't get is a sharper, more personal
   counterfactual than C currently offers anywhere — worth adding as an individual-level beat
   alongside C's class-level comparisons.
2. **Cap Jail / flexibility-token locking (Design B, L3).** A genuinely novel way to teach
   opportunity cost as *lost future optionality*, not just lost dollars — the single most
   sophisticated economic idea in the portfolio and a strong candidate for a future module or a
   C Lesson 3 extension.
3. **Continuous-slider pricing against a hidden rival range (Design B, L2).** A real PRICE/BID
   mechanic under genuine uncertainty, stronger than a menu pick and a good complement to (or
   replacement for) C's floor/ceiling replacement cards.
4. **Attributable, non-random shocks (Design A, L1).** Reweighting a shock to depend on a
   student's own weakest metric (rather than `Math.random()`) turns coincidence into
   consequence — apply this discipline to any shock event C or a later module introduces.
5. **Staggered, non-synchronized events (Design A, L1).** Firing a shock as each student locks
   in, rather than on a shared clock, removes a classroom timing hazard that both B and C
   currently accept as risk — worth grafting into C's L2 to de-risk its own self-flagged top
   delivery concern.

## What Design C must fix before build

1. **De-risk the Lesson 2 simultaneous reveal.** The design's own author names this the top
   delivery risk. Needs a concrete fallback before spec-freeze: a manual teacher re-trigger, a
   short grace window, or a staggered-by-row reveal — not just a risk note.
2. **Pilot and lock the numeric scale.** $100M/$10M steps/five slots at $10–60M is flagged as
   untested with real students. Confirm the mental math lands for grade 5–6 before treating the
   numbers as final.
3. **Author the fairness framing directly into the product, not just the design note.** The
   Lesson 3 Big Market/Small Market split needs fictional team names, the recommended real-sport
   anchor, and an explicit teacher script for the "hold that feeling" moment built into the UI
   and facilitator guide — this cannot stay a marginal note given a real student could feel
   singled out.
4. **Write the L2→L3 continuity-seam transition explicitly.** A 10-year-old expecting their same
   roster back needs a plain in-product line ("new question, new teams, same league") or the
   deliberate seam will read as a bug.
5. **Resolve the open questions before handoff to engineering:** decide the dead-cap/revision-cost
   question in L2 (currently flagged for piloting both ways) and make pairs-vs-individuals a hard
   default rather than ad hoc teacher judgment, since both affect UI flow and the minute-by-minute
   pacing math.
