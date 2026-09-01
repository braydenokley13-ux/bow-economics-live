# ANALYST_WAVE2 — Module 2 L1 "Full House"

**Scope note / independence:** read-only, fresh context, no builder self-evaluation consumed before artifacts. I have Read/Grep/Glob only — **I could not re-execute** `npm test`, the tuning harness, or the e2e. Every command result below is *recorded stdout/exit code*, not re-run by me. That is a NOT VERIFIED boundary on the whole deterministic tier.

## evidence-review

| Claimed improvement | Evidence | Verdict |
|---|---|---|
| Full suite green after final repairs (352/352, fail 0) | `l1-tests-r3` exit 0, 01:50Z | CONFIRMED (recorded) |
| BC-2 discharged, 16/16 harness properties | `l1-tuning-r3` exit 0 | CONFIRMED-WITH-DEFECT — `gate-l1-econ-r3` R9: P16's dominance limb is a tautology (`top.size < max(...)` where `top.size` **is** the max) and cannot fail; it is cited in the repair's own discharge |
| Three-surface arc, zero console errors | `l1-e2e-r3` exit 0 | CONFIRMED at **4 desks only** (script header: desks 1–4) |
| "COUNTERFACTUAL scatter fully above the fold" | `l1-e2e-r3` stdout | CONTRADICTION — true for `#fhCfScatter` at 4 desks; `gate-l1-play-r3` measures 6/10 rows + class summary off-screen at 10 desks. I confirmed independently from `r3-11-...-1366-10desks.png` and `r3-12-...-1920-10desks.png`: **4 of 10 desks visible, no summary, at both resolutions** |
| Play rating STRONG held 3 rounds | `gate-l1-play-r3` | CONFIRMED (rating), with dissent explicitly outside the rating |
| N5 attribution honest (`econ-l1-n5-attribution` DISCHARGED) | `gate-l1-econ-r3` (168 cases, residual 0) | CONFIRMED on `/board`; **CONTRADICTION on `/play`** — `gate-l1-play-r3` observes the private counterfactual still attributing all of +1,760 to renewals. Discharge recorded unqualified |
| Two-book season tension real | `gate-l1-econ-r2/r3` (independent DP) | CONFIRMED (frontier 22/24 undominated) — but the **shipped card** misprices it 47x/70x (open dissent) |
| Teacher TRANSFER READY | `gate-l1-teacher-r3` | CONFIRMED, **scoped** to 7 claims, 3-desk session; honestly labelled |
| Premium visual bar (contract clause) | `gate-l1-visual` = SERVICEABLE-NOT-PREMIUM | **NOT CONFIRMED** — no re-grade exists; role status still `active` in SUMMARY |
| Projector blocking #2 "`#stage` must fit its content" | `board/index.html:25-26` | **NOT CONFIRMED / goalpost substituted** — repaired with `overflow-y:auto`, none of the three named remedies (scale/tighten/split). Never re-adjudicated by the projector critic |
| SR R1 (release-blocking champion collision) | `fullHouse.ts:360-364` | CONFIRMED by my own read; **no SR re-check exists** — repair unverified by the owning critic |
| Module 1 untouched and green | `l1-tests-r3` (unit), `m1-e2e-regression` 00:59Z | PARTIAL — unit green after last change; **browser regression predates round 3**, which edited shared `theme.css` (contains `gate-l1-play R6`, a round-3 repair) and `board/main.ts`/`play/main.ts` |

## disproof-attempts

**(1) Resolution provenance.** All 8 wave-2 `DissentResolved` events quote a named critic's own DISCHARGED line, and I verified each line exists in the gate file (`GATE_L1_ECON_R1.md:420`, `_R2.md:360`, `_R3.md:342`, `GATE_L1_TEACHER.md:613,707`, `GATE_L1_PLAY.md:591,798`). No resolution rests on builder claims alone. **Angle fails to disprove** — this is the run's strongest property. One qualification: `econ-l1-n5-attribution` was discharged on board evidence while a second critic recorded the same defect live on `/play`; nobody reconciled that.

**(2) Goalpost drift.** P12/felt-scale and P14 margin-at-bar are recorded honestly — the harness prints its lowered bar *and* the Player gate's unmet 10% bar inside the PASS line, and the critic states he did not verify the tuning argument. Not laundered. **But two moves are laundered.** (a) SUMMARY calls `econ-l1-two-book-baseline` a "narrow fix"; the critic calls it the module's *central formalization* staged against a Pareto-dominated line, raised at round 2 as N-h, left unrepaired, **made worse by round 3's constants** (15–30x → 47–70x). (b) The felt-scale acceptance rests on a builder ceiling claim the same report **refutes**: R8 shows `renewalFans 30 / planSlope 4.5` passes all four P14 bars in both markets *with headroom* and a **+720 beat**. A 20% larger beat was available and never swept to a 16-property green.

**(3) Evidence gaps (nobody ever verified).** Real students (D10) · real projector optics/throw/ambient · CVD separation of the blue/orange series *as projected* · 1024x600 Chromebook fold for the dial/LOCK IT IN/FULL HOUSE plate · legitimate rejoin-PIN from a second device · seat-unlock flow · mid-class **server process** restart · `Restore last good state` · real network/25–35 devices · 1920x1080 full-arc QA parity · econ gate items N2/N4/N6–N9 (`GATE_L1_ECON_R3.md:426`) · SR F2–F11 repairs · every visual repair.

**(4) Regression surface.** Unit-level M1 green after the last change. Browser-level: `m1-e2e-regression` (00:59:18Z) precedes the round-3 edits to shared client files (01:50Z). Per CLAUDE.md §13 the M1 browser claim is stale by one repair round.

**(5) Are the open dissents wider than framed?** Both, yes. Play: it is not a fold cosmetic — the e2e guard written for it *cannot detect it at any class size*, and the round-3 acceptance of the smaller N5 beat was explicitly conditioned on the printed decomposition reaching the projector, which at class size it does not. Econ: not narrow — it is the synthesis card the lesson's formalization lands on, degraded across rounds, plus R7 (`HOUSE_RULES[2]` false in 62–65% of states, on the student's **pre-commit** screen) which is filed non-blocking but is false economics on a student surface (§8).

## biggest-failure

**At real class size the lesson's argue phase does not reach the room, and the harness written to guard it cannot see the failure.** Observed by me at 10 desks, 1366x768 *and* 1920x1080: 4 of 10 desk rows render, the class summary does not, while the largest type on the board instructs the room to argue from that evidence. This is the phase carrying the round-3 accepted trade (decomposition instead of drama). `l1-e2e-r3`'s green line about the fold is measured on a 4-desk session and on one element.

## recommendation

**REPAIR.** Not PASS: the contract clause "meets the premium visual bar" has no affirmative artifact and the visual role never completed; two blocking dissents are open; the class-scale defect is observed, not alleged. Not ROLLBACK (no M1 regression in evidence; 352/352). Not KILL (STRONG held three independent rounds; the kill condition is not met).

**Next highest-leverage repair:** make the COUNTERFACTUAL frame survive 12–15 desks (cap/paginate/teacher-advance) **and** change the e2e to assert per-row + summary visibility at that desk count — one fix that closes the open play dissent and repairs the evidence instrument that hid it. Bundle the two cheap truth fixes: stage the two-books card against the model's own frontier (closes `econ-l1-two-book-baseline`), and bound or correct `HOUSE_RULES[2]`. Then a single narrow re-check by the visual and projector critics on rendered output, and one M1 browser re-run after the last commit.

**DO NOT SPEND NEXT WAVE ON:** re-litigating P12/felt-scale bar length or further constant retuning for drama (structural, and the 30/4.5 option is a note, not a wave) · new harness properties (fix R9's dead limb, don't add) · L2/L3 build on top of an anchor with two open blocking dissents · broad visual polish beyond fold/legibility · any claim of classroom readiness (D10 unmet).

**Formal dissent, blocking, gate-recommendation:** I dissent against any PASS verdict for Wave 2. The premium-visual contract clause is NOT VERIFIED, and the projector's "must fit its content" discharge condition was substituted with a scrollbar and never re-adjudicated by its owning critic. A decision to proceed does not erase this.
