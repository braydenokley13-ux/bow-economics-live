# Product Decisions — Track 101 Refoundation

Numbered log of standing CEO decisions for the BOW Economics Track 101 refoundation. Each decision holds until superseded or explicitly overridden by the founder. Audience: future agents and the founder.

---

## D1. Four-module spine is founder-fixed; existing content is candidate, not canon

The four-module Track 101 spine is founder-fixed. All existing lesson content is candidate material, not canon: keep the 4x3 skeleton shape, rewrite objectives against the product bar, reuse only code-verified mechanics.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/EXECUTIVE_BRIEF.md §6 (Recommended Decisions #1) — splits the discard-and-rebuild vs. salvage-skeleton disagreement between CURRICULUM_CRITIQUE and CURRICULUM_PRODUCT_TRANSLATION.

## D2. Provisional module map

M1 "The Cap: building a team under scarcity" (scarcity, opportunity cost, constrained allocation, cap-as-institution); M2 "Money in Motion" (revenue, incentives, path dependence); M3 "Measuring Players" (information, uncertainty, evaluation); M4 "Draft Day" (uncertainty, expected value, negotiation — negotiation is taught inside draft mechanics such as pick trades, resolving the planned-Negotiation-vs-produced-Draft contradiction). Founder may override; cheap to change since M4 builds last.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/CURRICULUM_RECONSTRUCTION.md #6 (Module 4 planned as "Negotiation Basics," produced entirely as draft content, never reconciled).

## D3. V5 scope struck to architecture vocabulary only

V5 Parts on commerce/monetization/platform build order, and all predetermined counts (eight flagships, twelve sims, 70/20/10 motif split), are struck from scope. Kept from V5 as guidance: control verbs (PAUSE/FREEZE/REVEAL/SHOCK/RERUN/END), room-state machine (LOBBY..COMPLETE), evidence-truth vocabulary, control-plane vs runtime split.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/V5_PROSECUTION.md (pp.40,47,52-74,69) — V5's predetermined counts and Day 1-15 commerce build order directly contradict founder mandate.

## D4. No gamification layer in the Track 101 runtime

No XP, levels, badges, or BOW-ID gamification layer in the Track 101 runtime. Consequence visibility and class reveals are the reward system. Revisit only with live classroom evidence of a motivation gap; identity/progression would belong to the future control plane, not this runtime. Founder may override.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/CURRICULUM_RECONSTRUCTION.md #12 — the XP/levels/"BOW ID" layer is the most fully-designed system in the source material, in unresolved tension with the anti-leaderboard mandate.

## D5. Code-level verification required before any legacy asset builds

No legacy asset enters a build on V5's verdict alone; code-level verification is required (one of eight spot-checked V5 KEEPs was refuted).

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/REALITY_CHECK.md — code read of `101-M4-L3` shows a hardcoded `correctIndex` answer key against V5's "no defects found" KEEP verdict.

## D6. Near-term scope: Track 101, grades 5-6, only

Near-term scope is Track 101, grades 5-6, only. No Track 201/301 work.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/EXECUTIVE_BRIEF.md §6 (Recommended Decisions #3) — re-scope any near-term pilot/gauntlet to Track 101 only.

## D7. No cross-module continuity requirement for the Module 1 gauntlet

Cross-module continuity is not required for the Module 1 gauntlet; designers may propose cheap forward hooks.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/EXECUTIVE_BRIEF.md §6 (Recommended Decisions #7) — no current asset spans multiple modules; forcing it now risks scope creep before Module 1 is proven.

## D8. Runtime architecture pending evidence

Runtime architecture is pending evidence: 101-pre-course smoke test vs. a bow-finlit pattern port. Assigned to a runtime scout; decision packet expected in docs/intel/RUNTIME_CHECK.md.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/REALITY_CHECK.md — `101-pre-course` has never been build-tested; `bow-finlit` (471/471 tests) is the account's only proven live-classroom runtime but is not Track 101-themed.
- **Amendment (2026-08-21, Founder):** The runtime architecture decision will weigh all candidate foundations as unproven equals. `bow-finlit`'s passing test suite grants it no default or privileged status in this evaluation — see D10.

## D9. Discarded from Track 101 (repos preserved, never deleted)

Discarded: `101-M4-L3` (fixed-answer trivia; refutes its V5 KEEP), `101-M3-L2` Stats-vs-Scouts (quiz with sports nouns), the non-sports `-ECON` tycoon repos (off-theme). `101-M4-L2` is an empty repo — Module 4 Lesson 2 must be designed fresh.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/PORTFOLIO_T101.md (Ranked: Top 5 weakest/discardable) — full triage detail per repo.

## D10. Nothing is proven yet

NOTHING IS PROVEN YET. No architecture, runtime, simulation, or pattern in the legacy portfolio is to be described or treated as "proven." Passing test suites, V5 verdicts, and code reading are evidence to be independently checked, not credentials. Any runtime/architecture candidate (including 101-pre-course and bow-finlit-derived patterns) enters evaluation as an unproven candidate and must pass this project's own independent verification before adoption into any build. "Classroom-proven" is reserved exclusively for experiences that have survived real classroom sessions. Any earlier language in these docs or in docs/intel/ reports calling a legacy asset "proven" is superseded by this decision and must be read as "claimed, unverified."

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** Founder
- **Evidence:** Founder decision, issued directly. Supersedes all prior "proven" language describing legacy assets in this document, docs/TRACK_101_MAP.md, docs/SOURCE_LEDGER.md, and docs/intel/ reports; see also D8 amendment.

## D11. Module 1 design ruling

MODULE 1 DESIGN RULING. Winner of the Module 1 design gauntlet: Design C (First-Principles), docs/gauntlet/module-1/DESIGN_C_FIRSTPRINCIPLES.md. The Economics Prosecutor (ranking on economic truth) and the Classroom Judge (ranking on operability/student pull) independently converged on C; Design A had two fatal structural flaws (costless cap-expansion exploit; a no-cap counterfactual that likely cannot differ from the capped result), Design B misframed the cap as a per-student assignment rather than a shared institution and carried the highest technical risk. Evidence: docs/gauntlet/module-1/PROSECUTION.md and CLASSROOM_JUDGMENT.md.

Build charter riders (must be satisfied before classroom use): (a) revision carries a dead-cap cost — a simple flat cut-fee (~10% of the cut player's value) with grade-appropriate copy, resolving the prosecutor's "undo was free" flag; (b) pairs-on-one-device is the default play mode, solo supported; (c) Lesson 3 uses fictional team names with fairness framing written into product copy and the facilitator script; (d) every synchronized reveal ships with a manual teacher-triggered fallback; (e) numeric scale locked at $100M cap / $10M steps / five slots pending pilot validation; (f) explicit in-product transition copy for the L2→L3 continuity seam.

Graft queue (post-pilot enhancements, NOT build-blockers, no design-averaging): B's regime-blind counterfactual re-pricing; B's cap-jail flexibility-token locking; B's continuous-slider pricing against a hidden rival range; A's attributable non-random shocks tied to a student's weakest metric; A's staggered event firing.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/PROSECUTION.md, docs/gauntlet/module-1/CLASSROOM_JUDGMENT.md, docs/gauntlet/module-1/DESIGN_C_FIRSTPRINCIPLES.md.

## D12. Runtime foundation ruling

RUNTIME FOUNDATION RULING. The Track 101 live-session runtime will be a NEW runtime adapting bow-finlit's narrowly content-coupled modules (crypto layer, repository interface with swappable backends, offline save-coordinator, phase-gate algorithm re-vocabularied for Track 101) plus a net-new projector/display surface (Option B of docs/intel/RUNTIME_CHECK.md). 101-pre-course is retained as reference for its game-loop shape only — it lacks phase gating, resume, freeze/recover, offline queue, and a display surface, and its persistence is unverified under multi-instance load. D10 compliance: bow-finlit's modules were independently re-verified this session by our own scout (471/471 on a fresh run) and remain classroom-unproven; the assembled runtime must pass an independent fresh-context verification gauntlet (refresh, reconnect, duplicate joins, late joins, bad state, Chromebook-class load) before any real classroom session.

- **Status:** ACTIVE
- **Date:** 2026-08-21
- **Owner:** CEO
- **Evidence:** docs/intel/RUNTIME_CHECK.md; D8, D10.
