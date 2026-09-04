# W5/W6 synthesis chains — fresh Economic Truth review (2026-09-04)

Independent review of the UNREVIEWED chains appended to `W5_W6_SPEC.md`, by a
fresh-context Economic Truth critic (the drafting critic recused). Claims marked
**observed** were computed this session against `runtime/dist/modules/*.js`
(scripts in session scratch); **read** claims cite source lines. No Boss run
covers this work; nothing here is Boss-recorded evidence yet.

## Verdicts per chain

| Chain | Verdict | Core finding |
|---|---|---|
| W6 INCENTIVE (both bands) | **KILL as written** | (a) THE FLOOR is arithmetically inert as shipped: `writeTheRule.ts:1145` and `:1284` compare `r.reinvest` (a percent dial, 0..40) against `floor.level` (dollars 200,000–400,000) → every club non-compliant → no-bonfire guard returns every payout unchanged. The floor never docks or redistributes a dollar. (b) Even units-fixed, $300,000/week is infeasible for 5 of 16 clubs at the maximum 40% dial (observed, week-1 Draws, revenue-maximising price): Memphis $263,955 · Milwaukee $257,517 · Indiana $255,552 · Denver $266,890 · New Orleans $287,754. Indiana (Draw 26) and Milwaukee (Draw 38) cannot comply in week 1 at any legal setting. A rule you cannot obey is a lump-sum tax on being small, not an incentive. (c) Copy "the floor fined nobody" is false — forfeiting half a draw is a fine. |
| W5 SHARED RESOURCE | REPAIR | Our pot is an equal split; the NBA's is a confidential market-size-adjusted formula in which some big markets receive. Beside "$400,000,000 moved in 2024-25" this teaches "the NBA splits it evenly". No `SIMPLIFICATIONS` entry covers it. Replacement Real sentence: *"the NBA moved roughly $400,000,000 to its lower-revenue clubs in 2024-25; every club pays in off its own local money, but the real league does not split it evenly — how much each club gets back is worked out by a formula the league keeps confidential, and ours splits evenly so the shape is visible (Sportico 2025-10-21, `W4_BILL_RESEARCH.md` §5)."* Plus a `SIMPLIFICATIONS` entry, risk "the real shared pot is split equally". |
| W5 SPILLOVER | REPAIR | THE VISITOR LINE sums the **received** side only (`visitorDollars`); the given side (`SettledWeek.roadDollars`, `hostTheLeague.ts:1260`) appears nowhere. Received-only teaches "other clubs' stars pay me" — a gift, not a spillover you caused. Model check is base-mismatched (`perFan = price + ancillary` vs bowl base `gate + localMedia`); drafted figures not reproducible (observed: $5,328,044 visitor vs $4,321,965 bowl, 16 desks, week 1, house prices). Replacement class number: THE VISITOR LINE beside THE ROAD LINE (what your own Draw put on somebody else's books on your away night), both teacher-pressed, no seat identity. |
| W5 EXTERNALITY (7–8) | REPAIR | Real link sourced to a product string (`identityLine`), undated. Example points at the own-Draw channel, not the visitor channel. Replacement: *"when LeBron James left Cleveland in 2010 and returned in 2014, the buildings whose numbers moved were not only Cleveland's — attendance moved in every arena on his schedule, and not one of those buildings paid him or the Cavaliers for it."* Owed: a dated, sourced road-attendance-lift figure. |
| W6 EXTERNALITY (retrieval) | REPAIR | "Spends no new-term slot" is false at 5–6 (that room met *spillover*, never *externality*; spec `:77` already allocates the slot). Moment is a stakes moment, not an externality. Memphis/Golden State disparity is not an externality; the streetlight is a public-good example colliding with FREE RIDING. Replacement opening: *Moment: last week your gate moved because of who visited you, and what you did to their building was never charged to anybody; this week you wrote a rule that sits on top of exactly that. Outside: a neighbour repaints and lifts every house price on the street; nobody sends a cheque.* |
| W6 FREE RIDING (7–8) | REPAIR | Non-taxpayers receiving half the tax pot are paid for staying under a line — THE FLOOR's logic, not free riding. Class number depends on `forfeited`/`bonus`, always zero today. Replacement Real: *"every club's home gate rises when a big draw is the visitor, and the visiting club is paid nothing for it — a club that lets its own roster slide still sells tickets on the nights the league's stars come to town."* Cut the trailing Oklahoma City line (a non-example for a different claim, already at `hostTheLeague.ts:3038`). |
| W6 INSTITUTION (7–8) | PASS, caveat | Insert "voted 22–8 to deny the sale, under the league's own threshold, not ours". "You lived three weeks inside it" is false for the floor half until the floor is repaired. |
| W5 INCENTIVE (7–8) | REPAIR | "The room's reinvest fell when the bowl arrived" — no before/after exists; the levy runs every week. Mechanism is real (observed mean best-response reinvest 11.9% at levy 0 → 8.4% at 20% → 5.3% at 50%) but the drafted 20.6% → 15.6% is not reproducible. Replacement class number: the room's reinvest line beside THE COUNTERFACTUAL (same three weeks, no bowl) — which spec `:46` forbids at 7–8. Founder call: teacher press at 7–8, or move the term. |
| Convergence lines | W5 PASS · W6 REPAIR (contingent on the floor moving money) | |

## Dominant strategies

- **The floor manufactures the free rider it condemns.** Once compliance is infeasible or dearer than the dock, the best response is to reinvest *less* (docked either way, bank the cash). At a 5% share the dock is ≈$34,000/club/week against a compliance cost above $150,000: nobody complies, the room concludes floors do nothing.
- Abstain-to-lower-the-bar: closed in code. Bloc voting: the spec's structural answer (institution 2 inverts the coalition) is void while the floor is inert. W5 reinvest-zero: non-dominant at 0/20/50% levies (observed) — D61's closure holds.

## Band compliance

- 5–6 term count PASS on the number; FAIL on the accounting (W6 EXTERNALITY claims a free slot).
- 5–6 no-percent FAIL in the chains' own class numbers: THE REINVEST LINE is a percent dial; `FreeRideRow.meanReinvestShare` is a percent. Both must be dollar-denominated at 5–6 (`reinvestPaid`, `reinvestSpend` exist). NOT VERIFIED end-to-end — no renderer existed at review time.
- 5–6 no negatives PASS (`netDirectionLine`).
- 7–8 ≤4 PASS on count; SPILLOVER and EXTERNALITY spend two slots on one concept.

**R-13 recommendation: name EXTERNALITY at 7–8 in Week 5, and drop SPILLOVER as its own 7–8 term** (keep "spillover" as the plain-word gloss inside the EXTERNALITY chain). At 5–6 keep spillover (W5) → externality (W6): a genuine two-step.

## Real-example flags (for Sports Reality)

$148,465,000 vs 90% of $164,961,000 = $148,464,900 ($100 off, rounding unstated) · "twenty clubs under the line" implies ten 2024-25 taxpayers, confirm · "$193,000,000 … roughly $4,000,000 a night" denominator unstated · 2026-27 cap figure and the LeBron-2014 "sold out within hours" claim need dating and a real source · `hostTheLeague.ts:355-358` documents the levy base as "doorMoney + localMedia"; code computes `gate + localMedia` (code is right; fix the comment).

## Required repairs (ranked)

1. **BLOCKING** — fix the units at `writeTheRule.ts:1145`/`:1284` (compare `reinvestSpend` dollars), then re-tune the level so no club faces a floor it cannot clear at some legal dial from any reachable Draw. A tuning sweep must print, per adopted level, who is bound and who is unreachable.
2. **BLOCKING** — replace W5 INCENTIVE's class number with the no-bowl counterfactual and make it reachable at 7–8 (founder call).
3. Add THE ROAD LINE beside THE VISITOR LINE; re-derive the model-check figures on a like-for-like base.
4. Re-map three real examples (SHARED RESOURCE, FREE RIDING, W5 EXTERNALITY) per the replacement sentences; add the equal-split `SIMPLIFICATIONS` entry.
5. Close the 5–6 percent leaks (THE REINVEST LINE, `meanReinvestShare`); stop the W6 EXTERNALITY "no slot" claim.

## Formal dissent (recorded)

The critic dissents against shipping THE FLOOR at any level not clearable by every club, and against ordering any Week 6 synthesis chain before the units fix and the feasibility sweep exist. A room that adopts a floor and watches nothing happen — or watches the same five small markets docked whatever they do — has been taught something false about institutions, in the module's finale. Proposed decision: see D62.

Not verified: browser run (no ritual renderer at review time); `npm test`; W6 league sizing; the drafted chain figures.
