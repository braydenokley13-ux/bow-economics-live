# ANALYST_W1 — Product Analyst reconciliation, wave 1

Run `m2-visual-quality-war` · assignment `analyst-w1` · actor `analyst-w1` · read-only (Read/Grep/Glob only; no server booted, no file modified).

Labels: **OBSERVED** = I read it off a screenshot with the Read tool, off a source file, or off the run ledger this session. **INFERRED** = reasoned from source without exercising it. **NOT VERIFIED** = I could not establish it.

## evidence-review

**Highest-severity finding first: the wave's own terminal deliverable does not exist.** `docs/gauntlet/module-2/premium/VISUAL_REFERENCE_CONTRACT.md` is OBSERVED at `STATUS: DRAFT SKELETON` with all 33 rows (A1–A10, B1–B8, C1–C6, D1–D4, E1–E5, F1–F6) having **empty** `Required implementation`, `Allowed adaptation` and `Acceptance evidence` cells. The wave-1 pass condition's terminal clause is "the analyst's reconciliation recommends proceeding to the Full House build **under a frozen reference-to-product contract**" (`.boss/runs/m2-visual-quality-war/contract.md:59`). There is nothing frozen. Not one acceptance measurement exists in the repository. Wave 2 as currently specified is unfalsifiable.

**What is on file and authentic.** I re-derived, not accepted, the load-bearing claims:

| Claim | Source | My verification |
|---|---|---|
| Settled night renders below the fold behind the next decision | `kid-a-basketball-baseline-fold-measure`, `kid-b-shot-night1-result-viewport`/`-full`, `kid-c-fold-viewport`/`-fullpage`, `second-visual-review-play-sellout` | **OBSERVED, independently.** I viewed `18-play-night2-with-night1-result.png` (viewport) against `18b-…-full.png`: at 1366x768, scrollY=0, the visible screen is Night 2's card + dial + LOCK IT IN; "NIGHT 1 — HOW IT WENT" starts at y≈655 and the box-score row is cut mid-figure; `KEPT $215,384` (y≈886) and `Renewals 50% → 30% (-20)` (y≈910) are off-screen. Three critics, three ports (4403/4404/4405), three different price lines, same structural fact. |
| The sellout is cut by the fold | `kid-a-basketball-baseline-sellout-cut`, `kid-c-sellout`, `second-visual-review-play-sellout` | **OBSERVED.** In `24-play-night4-sellout.png` the whole 1366x768 viewport is Night 5's dials; "FULL HOUSE" first appears at y≈745 as a ~20px sliver at the bottom edge. |
| `/teach` buries every live control | `second-visual-review-teach-top`, `baseline-browser-qa-teach-cutoff-1366` | **OBSERVED.** `45-teach-play-TOP-1366x768.png` shows the join code "BOWGHH" at display size plus two localhost URLs owning the entire first viewport; the visible content ends inside the director notes at "ASK". Corroborated independently by DOM measurement in `baseline-browser-qa-report` (`scrollY=269`, `bodyScrollHeight 1526`, no `position:sticky/fixed` for the panel, no `scrollIntoView` in `teach/main.ts`). |
| Projector caveats outweigh the evidence; charts framed; HUD on every public frame | `second-visual-review-board-reveal5`, `-board-cf`, `-board-synth1` | **OBSERVED with one correction.** In `31-board-reveal-stage5@1920x1080.png` the renewals-rule paragraph occupies the top third, the scatter sits inside a visibly bordered dark rectangle, the "N1 Tue" legend swatch is a near-black dot on near-black ground, and `v79 · REVEAL` renders top-right. **Correction to `premium-direction-memo`:** the modelling caveat is set **bolder** than the claim it qualifies, but it is *grey and smaller*, not "brighter" — the memo's phrase "bolder and brighter" overstates by one term. The finding survives; the wording does not. |
| Counterfactual bar chips collide; synthesis cards are prose | `second-visual-review-board-cf`, `-board-synth1` | **OBSERVED.** In `36-board-counterfactual@1366x768.png` "15,812" overhangs its bar into the card edge and "14,142"/"13,567"/"14,740"/"15,340" sit on their bar ends; the 4-line bold white summary is the largest block on the frame. In `39-board-synthesis-card1@1920x1080.png` "REVENUE = PRICE × PEOPLE" is five lines of prose with no computed visual and ~250px of dead space beneath. |
| 1024x600 lock control | `baseline-browser-qa-lock-1024`, `kid-a-basketball-baseline-1024` | **OBSERVED.** `12-play-night1-prelock-1024x600.png`: the PIN card ("4595") owns the top ~140px; the dial is cut mid-card; LOCK IT IN is off-screen. |
| Kid A's Two Peaks stage-0 spoiler | `kid-a-basketball-baseline-reveal-frozen` | **OBSERVED IN SOURCE, and stronger than Kid A stated.** See disproof (6). |

**Labelling discipline.** All three kid reports carry `SIMULATED KID / AGENT-PLAYTESTED` in their first three lines and explicitly disclaim HUMAN-TESTED / CLASSROOM-PROVEN (OBSERVED). `REVIEW_VISUAL_2.md` and `BASELINE_QA.md` carry AGENT-PLAYTESTED and correct NOT-VERIFIED sections. No human claim slips in anywhere I read. One gap: the ledger text of `kid-b-casual-baseline-dissent` omits the SIMULATED KID label that `kid-a-basketball-baseline-dissent` carries; the report file has it. Advisory.

**Not on file / NOT VERIFIED.**
- **`economic-truth-report` is not recorded in the ledger.** `ECON_ADAPTATION_RULINGS.md` exists on disk and is substantively complete (E1–E30 + R-1…R-8), but `.boss/runs/m2-visual-quality-war/events.jsonl` head 79 contains **zero** `EvidenceRecorded` events for it, its role `econ-truth-w1` is still `active`, and `.boss/runs/…/evidence/` holds no econ artifact (OBSERVED). Wave-1 required evidence item 4 is procedurally unmet.
- **`test` and `git-diff`** are in the run-level required-evidence list and neither is in the ledger (OBSERVED). Wave 1 is an audit wave that must not touch code, so `git-diff` cannot be satisfied here and belongs to wave 2. `test` is claimable cheaply: `ECON_ADAPTATION_RULINGS.md` asserts `npm test` → exit 0, 461/461 and the L1 harness → "ALL 16 PROPERTIES HOLD" as OBSERVED this session, but that claim sits inside an unrecorded report. **I did not run either command; NOT VERIFIED by me.**
- **No Module 1 pixel baseline at this head exists in wave-1 evidence.** All 100+ recorded frames are M2 L1 (OBSERVED, `.boss/runs/…/evidence/` listing). Contract row G asserts "Module 1 rendered output unchanged (**pixel baseline in wave-1 evidence**)" — that statement is false as written. 23 older M1 PNGs exist under `docs/gauntlet/module-1/screens*/` but their capture head is unknown to this wave (NOT VERIFIED as a usable regression baseline).
- **Chromebook performance budget: NOT VERIFIED**, and correctly self-declared as such by `second-visual-review-report`. Still absent from the repo.
- **Rollback-condition check.** I could not run `git status`; whether any wave-1 activity modified product code or run state is **NOT VERIFIED by me**. `BASELINE_QA.md` states its driver lives in scratch and never in the repo, and `REVIEW_VISUAL_2.md` states it drove `runtime/dist` without changing source (both INFERRED from the reports, not confirmed).
- **No Sports Reality role ran**, yet Q7 (the drawn bowl must not resemble MSG/FedExForum) was answered "confirmed" by the Boss lead. Sports Reality is a permanent review function under CLAUDE.md §5 and is not in this run's required roles (OBSERVED).
- **No contrast/CVD proof assets exist for a violet-accent, green-money Module 2 palette.** `design/` holds the rendered proof for the gold ramp. Q1(a) retires gold; the replacement ramp is unproven (INFERRED from the visual review's conflict 7, which names exactly this; I did not open the design assets).

## disproof-attempts

**(1) Attempt to disprove "premium is genuinely unmet." FAILED — the verdict stands, with one partial hit.**

I tried three ways. (a) *Is the verdict inherited?* No. `REVIEW_VISUAL_2.md` states it read only the prior gate's `## visual-verdict` header afterward, and its finding set does not overlap the prior gate's: `GATE_L1_VISUAL.md:40` H1 was *projector clipping at SYNTHESIS at both viewports*; the new H1 is */teach scroll geometry*. The two reviews also **disagree on a fact** — I viewed `39-board-synthesis-card1@1920x1080.png` and observed no clipping, which is what an independently re-derived review looks like, not an inherited one. (b) *Does any surface meet the references?* No. §0 requires exactly one hero figure per state at 72–96px (≥64px after re-composition, §7); OBSERVED, no `/play` element exceeds 32px anywhere in the lesson and no `/board` frame carries a 72–96px figure. §0 forbids a frame box on plots; OBSERVED, every scatter I viewed sits in a bordered rectangle. §6.2's arena does not exist. §4's class-results table does not exist. (c) *Does the verdict rest only on spatial composition?* No — H6 (11px body copy in `ink-muted`, against the identity's own ≥14px restriction), P1, P2, P4, P5, P6, P7 and P9 are craft, asset and identity-law findings independent of layout, and I confirmed P1, P2, P4, P6, P7 by eye.

**Partial hit.** H9 and direction item 5 ("Introduce the grid"; "750px of unused width waiting for it") are composition *preference*, not reference law — §7 requires re-composition to 1366x768, not width-filling. This preference sits in direct tension with `premium-direction-memo` experience-risk 6 ("any premium layer that pushes the commitment control further down is a net loss") and with the 1024x600 constraint where LOCK IT IN is already off-screen. Kid C asked for the wide two-column desk (repair 7); Kid A did not. **This is an unresolved conflict the contract must settle with a measurement, not a taste.** It does not move the verdict.

**(2) Attempt to disprove kid independence / find persona leakage. FAILED, and the strongest counter-evidence is the disagreement.** Three separate sessions, three ports, three market/price lines, each citing its own measurements in its own units (Kid A: DOM tops 758/813 in a 768 viewport; Kid B: fullPage screenshot pairs plus a `python3` word count and a DOM dial query `{min:10,max:120,step:2,value:24}`; Kid C: y-coordinates 661/886/910 and 760–890). None of them reproduces another's numbers. Decisively: **they do not converge on severity.** Kid A = WEAK/blocking, Kid B = WEAK/blocking, **Kid C = FUNCTIONAL with no dissent recorded** on the same observed defect. Leaked framing produces matching verdicts; this did not. Each also reaches findings the others miss (Kid C's board-counterfactual structural exclusion — only desks that *held* a price get named in front of the room, OBSERVED by me in `36-board-counterfactual@1366x768.png`, where all three named rows are "same price"; Kid A's reveal freeze; Kid B's end-of-play summary table as the positive template).

**One real leakage vector, named.** Kid B frames its biggest-failure in the reference spec's own words and cites "VISUAL_REFERENCE_SPEC §2" twice. The *framing* was supplied; the *measurement* was not. I could not read the individual assignment prompts (NOT VERIFIED whether the fold was named to any critic in advance). Since I reproduced the underlying fact myself from two frames, the finding survives regardless of how it was framed.

**(3) Attempt to disprove the blocking student-pull dissents as disproportionate. PARTIALLY SUCCEEDED — this is the most important thing in this report after the contract.**

The prior independent gameplay critic **already knew about the fold defect and explicitly rated it non-blocking while holding STRONG.** OBSERVED, `docs/gauntlet/module-2/GATE_L1_PLAY.md:987–1018`: "RATING: STRONG … Held for the third round"; and in the same section's NON-BLOCKING list, verbatim: "**Chromebook fold buries LOCK IT IN and the FULL HOUSE plate (P9)**". Line 994 reasons "Not below STRONG: the private `/play` counterfactual is untouched by the fold defect."

So: **viewport truth did not change. The lens and the bar changed.** Two things changed legitimately, one did not.

- *Legitimate change #1 — the bar.* The founder references introduced §2 "the consequence gets its own screen," a standard that did not exist at `gate-l1-play-r3`. A defect that was non-blocking against the old bar can be blocking against a new one. That is honest re-rating, and Kid B says so explicitly.
- *Legitimate change #2 — new observation, but only in Kid A.* `kid-a-basketball-baseline-dissent` carries findings the prior gate did not have: the byte-identical student device across all eight REVEAL frames (md5 `05aa7a5185a8c10e1dcbde46ce5b736f`), the Two Peaks stage-0 spoiler, and renewals falling 50%→0% with no alarm and a printed rule that mispredicts the pair's own largest result. **Kid A's blocking severity is supported by new evidence.**
- *Not legitimate as new evidence — Kid B.* `kid-b-casual-baseline-dissent` rests **entirely** on the fold defect. It contributes no observation the prior STRONG round lacked. It is a re-weighting of a known, previously-non-blocking fact under a persona and a new standard. That is a defensible position for a persona critic to hold, but the Boss lead must not read three blocking-flavoured student-pull findings as three independent discoveries: **it is one structural defect, re-rated; plus one genuinely new defect (Kid A's reveal staging); plus one critic (Kid C) who saw the same thing and did not dissent.**

"Should not ship as-is" is therefore **supported for Kid A, supported-as-judgement-not-discovery for Kid B, and contradicted by Kid C's own FUNCTIONAL/no-dissent on the same facts.** The honest reading is: the fold defect is real, is the top build priority, and was already on the repair list before this wave; it is not new information and should not be presented to the founder as such.

**(4) Attempt to confirm the wave-1 pass condition is met. FAILED — it is not met.** Clause by clause, against `contract.md:23–30, 59`:

| Required item | On file? | Authentic? |
|---|---|---|
| `browser-trace` — fresh baseline by independent Browser QA, not builder, both viewports, every phase | **YES** — `baseline-browser-qa-manifest` (167 PNGs / 33 states / 4 desks, late joiner, stalled desk) + `-manifest-class12` (12 desks) | **YES.** Distinct actor (`browser-qa-w1`), no builder ran in wave 1. Console logs `[]` both runs. |
| `visual-report` — SECOND INDEPENDENT review, explicit verdict, ranked causes, every conflicting reference decision named | **YES** — `second-visual-review-report`: VERIFIED-UNMET, H1–H9 ranked, P1–P10, 15 reference-conflicts | **YES.** Six of its citations independently re-derived by me; one wording overstatement found in a *different* document, not this one. |
| `gameplay-report` ×3 personas with prosecution questions + honest label | **YES** — `kid-a-basketball-baseline-report`, `kid-b-baseline-report`, `kid-c-report` | **YES.** All three answer the prosecution set; all three labelled correctly. |
| `economic-truth-report` — ruling on every conflicting element + ClaimAtom baseline | **FILE YES, LEDGER NO** — `ECON_ADAPTATION_RULINGS.md` on disk; **zero evidence events**; role still `active` | Content is substantively complete and self-falsifying (it overturns one of the Boss lead's own PRELIMINARY ADAPTATIONs at E9, and states at §6 that contract row G6 is false today). **Procedurally unrecorded.** |
| `analyst-report` | This document | — |
| **`VISUAL_REFERENCE_CONTRACT.md` frozen, per surface, with ACCEPTANCE EVIDENCE** | **NO — empty skeleton, 33 rows, 0 acceptance measurements** | **Fails.** |
| (run-level) `test` | **NO** in ledger; asserted 461/461 + 16/16 inside the unrecorded econ report; **NOT VERIFIED by me** | — |
| (run-level) `git-diff` | **NO** — and correctly so for a read-only audit wave; belongs to wave 2 | — |

**(5) Attempt to find recommendations that contradict product law or the wave's non-goals. Four found; none is a law breach, three are scope/authority problems, one is a genuine trap.**

- **The genuine trap — the consequence gate.** `second-visual-review-report` direction 2 and `KID_C_BASELINE.md` repair 1 both propose gating the next night's dials behind the settled-night state ("until the pair dismisses it or the teacher opens the doors" / "a 'seen it' beat the teacher paces"). A *teacher-paced* gate adds five clicks to a 50-minute period and collides with the existing `minuteBudget`; a *pair-dismissed* gate creates a desk that has not reached its dial when the bell rings. Neither breaks law — `onPhaseExit`/`closeNight` auto-commit at the plan price already covers the stalled desk (OBSERVED, `fullHouse.ts:2019-2034`) — but the contract must state which mechanism, and must state that auto-commit survives it.
- **Authority — Q1 was a founder question answered by the lead.** `premium-direction-memo` labels Q1 "**(founder, blocking the token layer)**"; `second-visual-review-report` reference-conflict 7 says the gold/violet decision "needs an **explicit founder ruling** plus a same-commit update to `VISUAL_IDENTITY.md`; it is **not a builder's call**." The appended "Boss lead rulings" section rules Q1 = (a) retire gold, money off-white, positive money green, framing it as "fidelity to the founder direction, not a new founder decision." That framing is contestable: the founder's authority attaches to five images, and *retiring the standing money-accent of the shipped product* is an inference from them, made by the lead, against two roles that escalated it. It also (i) has no contrast/CVD proof for the new ramp, and (ii) interacts with reference-conflict 6 — green applied to both books puts a green CASH figure beside a green renewals figure and invites exactly the summing `fullHouse.ts` forbids. **This is my recorded dissent.**
- **Scope — Kid A R8 ("give the opponent a record and a skid").** Inventing a specific visiting club with a fabricated record is content work under Sports Reality (contract row G: "No new real-world sports fact without Sports Reality verification"), not a visual restyle, and no Sports Reality role ran. Must be excluded from waves 2–3 or routed.
- **Scope — Kid B repair 2 ("stop repeating the guidance paragraph verbatim every night").** `renewalRuleFor(market)` is module-owned registered copy that `ECON_ADAPTATION_RULINGS` §2.2 requires be called, not re-implemented. Suppressing it on nights 2–5 is a decision about *whether* a registered claim reaches the screen. Not a breach; needs Economic Truth sign-off before it becomes a build instruction.
- Checked and clean: no recommendation anywhere proposes a pre-lock preview, a summed book, reward chrome, a student timer, a countdown, seat-private data on `/board`, or a Module 1 change. Kid C's repair 9 (name an *adapting* desk on the board) is a selection, not a ranking, and is compatible with E16's "stable desk order, never sorted by outcome" — but it is new aggregate logic, not restyle, and currently belongs to no wave.

**(6) Kid A's Two Peaks spoiler — REAL, WORSE THAN STATED, AND ORPHANED. OBSERVED in source.**

The two view functions gate the same object differently:

```
// studentView, REVEAL branch — runtime/src/modules/fullHouse.ts:2230
twoPeaksReleased: state.twoPeaksReleased,
twoPeaks: state.twoPeaksReleased ? computeAggregate(state).twoPeaks.filter(...) : [],

// boardView, REVEAL branch — runtime/src/modules/fullHouse.ts:2522
twoPeaksReleased: state.twoPeaksReleased && state.revealStage >= NIGHT_COUNT + 1,
twoPeaks: state.revealStage >= NIGHT_COUNT + 1 ? agg.twoPeaks : [],
```

The board carries a stage gate; the student device does not. And `onPhaseExit` (`fullHouse.ts:2030`) sets `twoPeaksReleased = true` unconditionally on leaving PLAY. Therefore **on entry to REVEAL the flag is always true, so every student device shows its market's Two Peaks at stage 0 — in every session, not only when a teacher skips the release button.** Kid A attributed it to a teacher who advances without pressing the button; the source says it is unconditional. This is the lesson's punchline reaching all thirty desks six stages before the room, and it is the one wave-1 finding that is a *correctness* defect rather than a taste or layout defect.

**In scope for this program? Yes. Assigned to a wave? No.** The Boss lead's Q6 ruling scopes wave 2 to `/play` restyle "restyle only, no new mechanics" and wave 3 to `/board`, `/teach` rail and synthesis. A three-line change to `studentView`'s REVEAL branch is a module change and falls in neither. `premium-direction-memo` §9 asks the reveal mirror to be "deliberately subordinate" — which is **unachievable by restyle**, because the mirror currently shows strictly *more* than the board. Either wave 2 gets an explicit carve-out for this fix plus a test asserting the student REVEAL payload carries no `twoPeaks` at stages 0–5, or the direction memo's §9 must be marked unreachable.

**Two further orphans, same class.** Kid A's finding that the printed renewals rule mispredicts the student's own largest result (charged $90, renewals rose 9 points) was explicitly deferred to Economic Truth by Kid A — and `ECON_ADAPTATION_RULINGS.md` does not address it (OBSERVED; it rules on reference elements E1–E30, not on existing module copy). **Nobody has adjudicated whether that is a model defect or a copy defect.** Likewise the renewals 50%→0% collapse with no alarm state. Both are unowned at wave-1 close.

**(7) What the reference-to-product contract must contain to make wave 2 falsifiable.** See `recommendation`.

## biggest-failure

**The contract that this entire wave exists to produce is empty, and the wave is being closed as if it were not.**

`contract.md:12` states the wave's purpose: "establishes, with fresh evidence, whether premium is genuinely unmet and why, **and freezes the reference-to-product contract before any pixel is built**." Half of that was done superbly — the audit is thorough, independently re-derivable, and I confirmed its load-bearing claims myself. The other half does not exist: `VISUAL_REFERENCE_CONTRACT.md` has 33 rows and **zero** filled `Required implementation`, `Allowed adaptation` or `Acceptance evidence` cells (OBSERVED). Not one number. No px threshold, no fold position, no figure count, no viewport assertion.

This matters more than any single defect on any screen, for a specific reason: `ECON_ADAPTATION_RULINGS.md` §0 establishes that **no test in this repository reads a single line of `runtime/src/client/**`**, and that a builder can compute a projected attendance in the client, print a target band, or label CASH as "Total Profit" while `npm test` stays 461/461 green and the L1 harness still reports all 16 properties holding. Wave 1 therefore proved that the *only* thing standing between wave 2 and a silent economic-truth regression is a written contract with measurements in it — and then did not write one.

Compounding it, the skeleton that does exist contains a **false statement of state**: row G asserts "Every rendered economic claim audited (ClaimAtom / render-drift limbs keep biting)" and "Module 1 rendered output unchanged (pixel baseline in wave-1 evidence)". `ECON_ADAPTATION_RULINGS.md` §6 says the first is untrue for L1 today. I observed that the second is untrue too: there is no M1 frame anywhere in this run's evidence directory. A contract that ships to a builder asserting two protections that do not exist is worse than a contract with blank cells.

## recommendation

**REPAIR — bounded, no review needs re-running.**

Not PASS: the pass condition's terminal clause (a frozen reference-to-product contract) is unmet, the `economic-truth-report` is not in the ledger and its role is still `active`, and two contract non-negotiables assert protections that do not exist.
Not ROLLBACK: the rollback trigger is review activity modifying product code or run state. Nothing I read indicates it, but **I could not verify it read-only** — the lead should run `git status` and `git diff --stat` against `128236a2856e847ac38129a8b318bd13e7b2ebce` before freezing. If clean, rollback is not triggered.
Not KILL: the kill condition requires VERIFIED-MET. The second review returned VERIFIED-UNMET and I independently corroborated six of its citations across three surfaces.

### Repair actions before wave 2 opens (all cheap; none is a new review)

1. Record `ECON_ADAPTATION_RULINGS.md` as `economic-truth-report` evidence and complete `econ-truth-w1`, including its four blocking economic-truth dissents (E1, E8, E14, E16/E17).
2. Record a `test` artifact by actually running `cd runtime && npm test` and `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` this session. A test that did not run in the ledger is not green (CLAUDE.md §13).
3. **Capture the Module 1 pixel baseline at the wave-2 base head, by the independent Browser QA, before any build starts** — `/play`, `/teach`, `/board` at 1366x768 and 1920x1080 across L1/L2/L3 key states. Then correct contract row G to cite it. Without this, "Module 1 unchanged" is unfalsifiable, and Q1(a) touches the shared theme.
4. Correct contract row G6 to state what is true today (per `ECON_ADAPTATION_RULINGS` §6): L1 registers no ClaimAtom and no test reads `runtime/src/client/**`. Replace the assertion with the requirement — R-1 lands before or with the first rebuilt surface, with its mutation limb shown to go red.
5. Return Q1 (retire gold / violet + green money) to the founder as the two roles asked, with the CVD/contrast consequence attached. If the founder is unavailable, the lead may proceed under (a) but must record it as a lead ruling on a founder-escalated question, and must commission re-rendered contrast/CVD proof assets for the new M2 ramp as a wave-2 deliverable.
6. Assign the Two Peaks student-mirror stage gate (disproof 6) to a wave, with an explicit carve-out from "restyle only, no new mechanics."
7. Route to Economic Truth, as a bounded addendum: (a) does the printed renewals rule mispredict a real student line (Kid A's Night-4 case)? (b) is suppressing the repeated `renewalRuleFor` box on nights 2–5 acceptable? Neither is ruled today.
8. Route Q7 (drawn bowl must not resemble an identifiable building) to a Sports Reality reviewer rather than a lead confirmation.

### Required contract items — the acceptance measurements wave 2 must be judged against

Every row of `VISUAL_REFERENCE_CONTRACT.md` needs a cell in `Acceptance evidence` that a critic can falsify with a screenshot or a DOM measurement. `ECON_ADAPTATION_RULINGS.md` §6 already supplies the row-by-row econ bindings (A6, A7, B1/D1, B3, B5, B6, C2–C6, D3, E1–E4, F1, F3, F5). The rows with **no** binding from any wave-1 role and which therefore must be authored: **A1, A2, A3, A4, A5, A8, A9, A10, B2, B4, B7, B8, C1, D2, D4, E5, F2, F4, F6**. A2 and A4 are the disputed rows (gold vs violet; condensed display face) and must carry the Q1 ruling text verbatim plus the `VISUAL_IDENTITY.md` update commitment.

Measurements the wave-1 reports already imply, stated so they can go straight into cells:

**`/play` (wave-2 scope)**
- **C1.** After the bell, at 1366x768 with `scrollY=0`: the settled night's headline, turnout/fill figure, the `CAME × PRICE = TICKET MONEY` chain, `KEPT` and the renewals movement all have `getBoundingClientRect().bottom ≤ 768`, **and** the next night's `#fhLock` is *not* in the same first viewport. Asserted at all five nights, including a sellout night and a zero-attendance night. *(Today: result top 655–758px, KEPT at ~886. Fails.)*
- **C4/B4.** Sellout: `FULL HOUSE` headline `top < 200px` and the turned-away count `bottom ≤ 768` at `scrollY=0`; the turned-away count is the second-largest figure on the frame. *(Today: headline at y≈745. Fails.)*
- **A5/B2.** `#fhPriceReadout` computed `font-size ≥ 64px` at 1366x768; **no** other element in the pre-lock state exceeds it; `#pinDisplay` is strictly smaller at every moment, including the first 20 seconds after join. *(Today: 28px price vs 32px PIN. Fails.)*
- **Viewport.** At 1024x600 with the PIN card **un-collapsed**: `#fhLock` and its caption both have `bottom ≤ 600` at `scrollY=0`. *(Today: `#fhLock.top = 664`; with the PIN collapsed, `553` with the caption at 603–616. Fails both.)*
- **C2 (dashboard test, from `premium-direction-memo` risk 2).** At most **two** figures ≥34px on the settled-night state.
- **C2 (hero-identity test, risk 3).** On the settled night the largest figure is the **turnout**, not the money.
- **B3/G (blind commit).** On every pre-lock state, no element's text is a function of the pending price/spend/bowl other than the dial's own dollar echo. Discharged by `ECON` R-1's e2e limb **plus** its mutation proof: inject a client-side projection into a scratch `dist`, record the limb going red; inject a `Target $110–$120` literal, record the same.
- **C4/A7.** Every fill number, bar, gauge and arena picture is labelled "of the seats you opened tonight"; the string "of Capacity" appears **zero** times on any night the bowl can open (`ECON` R-2).
- **B6/H6.** `.fh-blind-note` computed `font-size ≥ 14px` and its colour passes the identity's contrast floor at that size. *(Today: 11px in `rgb(115,123,140)`. Fails.)*
- **B2/P1.** At the default dial position the tick label's bounding box does not intersect the knob's, at 1366x768 **and** 1024x600. *(Today: the knob strikes through "PLAN $24". Fails — OBSERVED by me in three frames.)*
- **A10/P9.** Every new animation ships a `prefers-reduced-motion` rule; measured duration ≤120ms under `reduce`; no money figure uses overshoot/spring easing.
- **G/two books.** No rendered figure is a function of both books; CASH and RENEWALS never share font-family + size + colour in the same row (`premium-direction-memo` NN3, and the standing offender is OBSERVED today in the desk header).
- **H7.** No `/play` state has more than 200px of contiguous empty region below its last content block at 1366x768.

**`/board`**
- **E1/E5.** At 1920x1080 **and** 1366x768 with **15 desks**, every frame fits without clipping (`#stage` is `overflow:hidden` — clipping is silent), exactly **one** element ≥72px, and **no** caveat/footnote element has font-weight or font-size ≥ the claim it qualifies.
- **A6.** Zero border/rect around any plot; every mark carries a separating ring; every legend swatch passes contrast against `--surface-void`. *(Today: framed plots and a near-black "N1 Tue" swatch. Fails.)*
- **E2 (class results, Q2/wave 3).** Columns limited to DESK / TICKET PRICE / WHO CAME + bar / FILL. **No** per-desk revenue column, **no** per-desk profit column, **no** collapsed "profit" (`ECON` E16, blocking dissent). Stable desk order asserted by test, never sorted by outcome. Pages past 8 desks (Q4). Prompts come from `ADAPT_QUESTIONS` / `ARGUE_PROMPT` / `EXIT_PROMPT` verbatim; the reference prompt "Why didn't the highest price always win?" does not ship (`ECON` E17, blocking dissent — it is false in 99–100% of rooms on Night 4).
- **Privacy.** `fullHouse.test.ts:263` (boardView never handed a seat id) stays green; zero student names on any `/board` frame.
- **P2.** Value-chip bounding boxes do not intersect bar-end bounding boxes at 1366x768 with 12 desks. *(Today: four collisions OBSERVED in one frame. Fails.)*
- **P4.** `#hud` absent from `/board` unless a query flag is set. *(Today: `v79 · REVEAL`, `v83 · COUNTERFACTUAL`, `v84 · SYNTHESIS` render on every public frame including COMPLETE. Fails.)*
- **D3/P7.** Each of the six synthesis cards carries a visual computed from the class's own locked numbers; the demand card is realized dots for **one market × one card** (never a fitted curve); the tradeoffs card is a **two-axis frontier**, never a balance scale; the shifter chips are DAY / DRAW / TV with RENEWALS and LAST NIGHT'S EVENT MONEY in a separately-labelled "carried" group; **"Weather" appears zero times** (`ECON` E27).

**`/teach`**
- **F4/F5.** At 1366x768, in **every** phase and at every director-note length, `#btnAdvance`, `#btnCloseNight`, `#btnRevealNext` and the first `.teamtile` all have `bottom ≤ 768` at `scrollY=0` — asserted by e2e at every phase, at 4 and 12 desks. *(Today: `#btnCloseNight.top = 1288`, `#btnAdvance.top = 1242`, first tile at 1670, in an 1826px document. Fails.)*
- **F1.** Elapsed clock only, teacher-only; no countdown; if the clock ships, the session start timestamp is exposed server-side (`createdAt` exists on `SessionRow` but does not reach `/teach` today — `ECON` E24/R-6).
- **F3.** No `Proj. Attendance`, no `Readiness` score; three-state pill plus `teacherWatchFor` flags only.
- **P3.** Desk-tile text does not wrap mid-token at 12–15 desks, measured by rendered line boxes, not `textContent`.

**Cross-cutting**
- **Forbidden-vocabulary grep** over rendered template literals in `runtime/src/client/{play,board,teach}/main.ts`: `project`, `forecast`, `estimate`, `expected`, `preview` (outside `HOUSE_RULES[0]`), `target`, `profit`, `readiness`, `momentum`, `time remaining`, `Strong Round`, `trophy`, `Forecast` — count **0**.
- **M1 regression:** the wave-2 base-head M1 baseline diffed frame-for-frame after the build.
- **Selector stability:** `node runtime/scripts/e2e-m2l1.cjs` and `e2e-m2l1-misclick.cjs` green — these are the drift limb the rebuild will actually feel, since every selector the wave touches is asserted there.
- **Record `SIMPLIFICATIONS`** for the two new arena-picture simplifications (evenly-lit seat pool; the Night-4 denominator change) before the wave closes (`ECON` R-7).

### Dissent

**Recorded. Category `process`, severity `blocking` — scoped to the decision to open wave 2 build, not to acceptance of the wave-1 audit evidence.**

The wave-1 audit is strong and I confirmed its load-bearing claims independently. But the build must not open, because (a) `VISUAL_REFERENCE_CONTRACT.md` is an empty 33-row skeleton with zero acceptance measurements while `ECON_ADAPTATION_RULINGS.md` §0 establishes that *no test in this repository reads a line of `runtime/src/client/**`* — the contract is the only control on the wave; (b) that skeleton asserts two protections that do not exist (row G6's claim audit; row G's M1 pixel baseline, which is absent from all wave-1 evidence); (c) the `economic-truth-report` carrying four blocking economic-truth dissents is unrecorded and its role is still `active`; (d) Q1, labelled founder-blocking by the Experience Director and "not a builder's call" by the visual critic, was ruled by the Boss lead, retires the shipped product's money accent, and has no contrast/CVD proof for its replacement ramp; (e) the one *correctness* defect wave 1 found — the student device showing the Two Peaks at REVEAL stage 0 in every session, `fullHouse.ts:2230` vs `:2522` — belongs to no wave under the Q6 scoping.

Supporting evidence ids: `second-visual-review-report`, `second-visual-review-teach-top`, `second-visual-review-board-reveal5`, `kid-a-basketball-baseline-report`, `kid-a-basketball-baseline-reveal-frozen`, `premium-direction-memo`, `baseline-browser-qa-report`.

**Independence.** I directed nothing in this wave, wrote no product code, and modified no repository file. If any of the above is implemented, I should not be the sole certifier of the result.

---
