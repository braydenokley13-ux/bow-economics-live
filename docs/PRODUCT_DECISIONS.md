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

## D13. Module 1 playability rulings

MODULE 1 PLAYABILITY RULINGS. L1 is rebuilt around a reversible Roster Wall with a live Foregone Panel (every placement stays editable pre-lock; opportunity cost is ambient, not a end-of-round report). L2 gets a continuous Offer Slider (bid under hidden rival uncertainty) plus a dead-cap bite (~10% cut-fee, D11 rider a) so revision costs something. L3 is refounded as a live head-to-head draft (two paired Draft Boards, shared shrinking pool, alternating turns) — gated on fictional-names-only shared screens and a pre-play "hold that feeling" reframe line before L3's first turn; founder may override before any live class. Vertical slice = L1. Module 2's central prototype is "The Box Office" (Box Office Operator role, Price Dial, hidden per-seat demand curves, zone-based Homestand-2 inheritance carrying `ROUND2[state.r1]`'s path-dependence pattern forward as a lived starting state, not a text card). Visual identity system = "the Cap Room" (broadcast-control-room register, dark palette, no mascots/badges per D4) in `design/`.

- **Status:** ACTIVE
- **Date:** 2026-08-22
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/PLAYABILITY_SPEC.md; docs/gauntlet/module-2/PROTOTYPE_SPEC.md; design/VISUAL_IDENTITY.md.

## D14. Round-1 gauntlet verdicts and repair charter

ROUND-1 GAUNTLET VERDICTS. Independent fresh-context verification of the built `m1l1-draft-day` returned three rulings: gameplay **FUNCTIONAL** (below the classroom STRONG bar — forced-click ADAPT for max-spenders, anonymous Class Gallery reveal, alarm-red on a fully legal at-cap spend); economics **SOUND WITH REQUIRED REPAIRS** (FATAL — the market made price a perfect, unbroken proxy for value, and the "guided narrow" assist silently pointed students toward priciest-not-best); runtime **ACCEPT WITH REQUIRED REPAIRS** (BLOCKING — `/control` and the teacher view had zero authentication, so any device holding the join code could hijack or spy on the whole class). A 12-point batched repair charter followed: market value-inversions (busts/gems) and a neutral price-ascending helper, a permanent rival-poach shock replacing the always-reversible one, franchise-named reveals, honest three-zone cap language (no false "OVER THE LINE"), rescue affordances at $0 headroom, a RISK BUFFER synthesis card, a per-session teacher bearer key gating `/control`/`/teacher`, restore-after-`end`, rejoin-PIN lockout after 5 failures, and corrupt-snapshot quarantine-and-boot-fresh. All 12 were applied to the codebase.

- **Status:** ACTIVE
- **Date:** 2026-08-22
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/VERIFY_GAMEPLAY.md, VERIFY_ECONOMICS.md, VERIFY_RUNTIME.md; runtime/README.md "Repair charter round 1".

## D15. Round-2 ruling — ADAPT budget must equal remaining cap room

ROUND-2 RULING. Fresh-context re-verification (107/107 tests, real Playwright UI pass, zero console errors LOBBY→COMPLETE) confirmed 8 of 10 repair-charter items fully FIXED and found one new MODERATE issue: the ADAPT repair stipend ignores a team's overall remaining cap room, so 65% of full-$100M-spend builds can repair past the cap (up to +$20M) with no over-cap indicator anywhere, and the SCARCITY card's "spent to the cap" count silently flips because it reads live post-repair spend instead of spend locked at lock time. Ruling: the ADAPT repair budget must equal the team's actual remaining cap room, not a flat stipend — the $100M cap stays absolutely inviolable everywhere, with no stipend line item. This was property-tested by brute-forcing all 688 valid $100M-locked builds (17,408 total shock/repair-path builds checked) with no remaining cap-overflow case found. Synthesis cards (SCARCITY, RISK BUFFER) must be recomputed from each team's locked-at-time spend, not live spend, so a repair action can never retroactively change what a team is credited with having done at lock. Round-2 gameplay rating: **STRONG** — every round-1 gameplay complaint is genuinely fixed and verified live; this is a gameplay-tested candidate, not yet a fully certified one.

- **Status:** ACTIVE
- **Date:** 2026-08-22
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/VERIFY_ROUND2.md.

## D16. Round-3 certification — L1 is a classroom-ready candidate

ROUND-3 CERTIFICATION. A targeted re-check of round-2's two named blockers, against the applied repair (commit `29225ea`: cap-inviolable ADAPT budget, locked-at-time SCARCITY/RISK BUFFER numbers), confirms both **FIXED**: the ADAPT budget is now arithmetic-identical to a normal placement's affordability check (no overflow possible by construction, confirmed live at $100M/$0 remaining); RISK BUFFER's repair-budget claim is now mechanically true (a leftover team's budget is provably larger than a spent-to-cap team's for an identical loss) rather than asserted over flat, identical numbers. 143/143 tests passing. Ruling: **CLASSROOM-READY CANDIDATE.** Standard D10 caveat still applies in full: gameplay-tested is not classroom-proven — a real classroom session is still required.

- **Status:** ACTIVE
- **Date:** 2026-08-24
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/VERIFY_ROUND2.md ("ROUND 3 CERTIFICATION" section).

## D17. L2 Trade Deadline — charter, build, and acceptance

L2 CHARTER AND ACCEPTANCE. Module 1 Lesson 2 ("The Trade Deadline: Undo Isn't Free," `m1l2-trade-deadline`) was rechartered from PLAYABILITY_SPEC's forced-injury opener to **voluntary revision under changed circumstances** — L1's built shock already owns involuntary loss, so L2's disruption is a deterministic, path-dependent midseason report on each franchise's actual L1 roster (L1's busts/gems surface; L1 draft-day ratings kept as history, midseason form layered on top). Charter rulings, all shipped: (a) L1 franchise state carries into L2 via an opaque `sourceSessionId` seed resolved by the runtime and mapped entirely inside the L2 module; students claim their own franchise; seats without valid L1 state get an honestly-labeled stock expansion franchise; (b) three real deadline paths — STAND PAT (affirmative, reasoned lock), CUT+VETERAN (safe, known value), CUT+SEALED BID (scarce named targets, fewer than demand; floor–ceiling bands resolving publicly at reveal); (c) bids compete against the room's other teams for real plus a hidden per-target seller reserve, so a solo bid still faces hidden-information pricing; (d) the cut commits at submission — a losing bidder keeps the hole and the dead cap, with a brute-force-verified ≥2-affordable-rescue guarantee in a restricted aftermath window open only to open-slot teams (closes the wait-and-see exploit); (e) dead cap ~10% per D11 rider (a), $100M cap inviolable through every reachable sequence (brute-forced); (f) teacher-paced per-target reveal theater; synthesis cards computed from locked-at-lock-time numbers per D15. Approved builder deviations: stepped $5M sealed bids (not a continuous slider), four scarce targets (not one prospect), trimmed phase list LOBBY/HOOK/PLAY/REVEAL/ADAPT/SYNTHESIS/COMPLETE. Runtime gained two lesson-agnostic extensions: the opaque creation seed and an optional `onPhaseExit` lifecycle hook (guaranteed cross-phase only — a same-phase control never fires it).

Verification (focused, per CLAUDE.md discipline — not a full gauntlet): independent fresh-context round returned **ACCEPT WITH REQUIRED REPAIRS, rating STRONG**; one blocker (teacher advancing out of REVEAL early stranded unresolved bids as a false "roster full" and undercounted synthesis aggregates) repaired via auto-resolve-on-exit with teacher warning; targeted re-verification confirmed all findings **FIXED**, final verdict **ACCEPT**, and its one new moderate (same-phase "Jump to REVEAL" silently bulk-resolving) was root-cause fixed and regression-tested. 227/227 tests; two rerunnable Playwright e2e proofs (full arc from a genuinely played L1 session; early-advance path), zero console errors. Ruling: **L2 is a classroom-ready candidate.** D10 caveat in full force: not classroom-proven until it survives a real class.

- **Status:** ACTIVE
- **Date:** 2026-08-24
- **Owner:** CEO
- **Evidence:** docs/gauntlet/module-1/VERIFY_L2.md (verdict + re-verification); runtime/README.md; runtime/src/test/tradeDeadline.test.ts; runtime/scripts/e2e-l2.cjs, e2e-l2-early-advance.cjs.

## D18. L3 recharter, build, and acceptance — "Free Agency: The Signing Window"

L3 RECHARTER AND ACCEPTANCE. On a direct founder instruction this session, Module 1 Lesson 3 was refounded from D13's head-to-head draft ("Why the Line Exists") into **"Free Agency: The Signing Window" (`m1l3-free-agency`)** — compete in a market under constraint, closing the module arc (L1 *I can't have everything* → L2 *my past constrains me* → L3 *everyone else is constrained too, and their choices change my opportunities*). This supersedes the L3 portion of D13 and the L2→L3 clean-reset posture; the old design remains in PLAYABILITY_SPEC.md as unbuilt history, and its institutional content (why the league designs these rules) is absorbed into L3's cap-rise institution and SYNTHESIS. Full charter: docs/gauntlet/module-1/L3_CHARTER.md.

Signature mechanic: a four-day market inside PLAY — one binding sealed offer per team per day (or an explicit hold), teacher-paced day closes resolving every agent simultaneously (top offer at-or-above the public asking price signs *at the offer price*; unsigned agents' asks move by demand: 0 offers −$10M, 1 −$5M, 2+ **+$5M**, floor $10M; day-4 desperation — top offer signs even below ask). Cap rises $100M→$130M (institutions adjust; guarantees $30–80M room for every carried franchise while fully preserving L1/L2 path dependence, dead cap included). Seed chain: prefers a completed `m1l2-trade-deadline` session, falls back to `m1l1-draft-day`, else honest stock expansion franchises. Hidden playoff factors on the eight fixed agents (one riser, one star shrinker, honest public hints) feed a staged module finale: window recap → factor reveals → standings/top-4 → semis/final (deterministic; ties by cap room then name) → computed GM Awards (THE BARGAIN, THE WALK-AWAY, PERFECT TIMING, IRON BOOKS — one-off in-fiction reveal cards, not a progression layer; D4 stands) → COUNTERFACTUAL (personal what-ifs + class-level patience-dividend/dead-cap-drag cards + debate prompts) → SYNTHESIS closing the whole three-lesson arc. Durable game rule set during repair: **withdrawing an offer (by any action path, including a hold that clears one) ends that team's market day** — editing stays free; talk is only cheap until you want your slot back.

Verification (focused, per CLAUDE.md §11): independent fresh-context round returned **ACCEPT WITH REQUIRED REPAIRS, rating STRONG** (no blockers; R1 rules-visibility and R2 zero-cost interest-count fake required; two award-algorithm moderates, two minors). All six repaired; targeted re-verification independently confirmed five FIXED against the verifier's own repros and found one narrow R2 bypass (`doHoldDay`), which was root-cause fixed along the verifier's prescribed path and regression-tested (the verifier's stated ship condition). 313/313 tests incl. cap-inviolability at $130M and day-1 viability property tests; four rerunnable Playwright e2e proofs (full L1→L2→L3 chain played for real; L3 early-advance; both L2 proofs re-run green after the seam change); zero console errors; committed screenshot evidence in docs/gauntlet/module-1/screens-l3/. Approved builder deviations: `stockFranchiseFor`/`formFor` exported from tradeDeadline (visibility-only), award algorithms and sub-4-team bracket shape as documented implementation judgment. L2's COMPLETE copy now tees up L3 (D11 rider f, final seam). Ruling: **L3 is a classroom-ready candidate, and Module 1 is a complete three-lesson arc of classroom-ready candidates.** D10 caveat in full force: nothing is classroom-proven until it survives a real class.

- **Status:** ACTIVE
- **Date:** 2026-08-24
- **Owner:** CEO (recharter mandated by Founder instruction this session)
- **Evidence:** docs/gauntlet/module-1/L3_CHARTER.md; docs/gauntlet/module-1/VERIFY_L3.md (verdict + re-verification + repair record); runtime/src/modules/freeAgency.ts; runtime/src/test/freeAgency.test.ts; runtime/scripts/e2e-l3.cjs, e2e-l3-early-advance.cjs; runtime/README.md.

## D19. BOW Boss control plane adopted — adapted copy with provenance; Economics constitution is its own law

The BOW Boss development control plane (first implemented in `bow-decision-challenges`) is
adopted for this repository after a code-level audit of the source implementation (its doctor and
27-eval suite were run and verified green in the source repo this session, per D10 — no README
claim was trusted). Architecture ruling on the one-core-or-two-copies question: **adapted copy
with provenance, not a shared package** — the core is ~2.7k dependency-free lines, this is the
first reusability test, and premature extraction is the exact platform mistake §30 of the port
program forbids. Every ported file names the source commit (`9313c91`); deliberate differences
and backport candidates are mapped in `docs/development/ECONOMICS_BOSS_PORT.md`. Revisit
extraction when a third product needs Boss or a shared harness defect must be fixed twice in one
quarter.

Standing consequences:

- **Two development modes.** Prototype Mode (fast, reversible, never creates a Boss run) vs Boss
  Mode (post-prototype convergence; founder activates). Boss levels 1–4; level 4 is
  CLASSROOM_RELEASE. `.boss/runs/<id>/events.jsonl` is the source of truth; run state is never
  hand-edited.
- **Roles are stable; models are routed resources.** The CLAUDE.md §3 Fable/Sonnet division of
  responsibility is retired; no model name holds permanent organizational authority. Role
  contracts live in `.boss/config/roles.json`; dated routing priors live in
  `.boss/config/models.json`.
- **Permanent Economics review functions:** Sports Reality (real sports-business version of the
  economics; dated facts; rights/source surfacing), Economic Truth (mechanisms, exploits, false
  lessons, the synthesis map), Teacher Transfer (fresh-context random-teacher standard — a hard
  gate at classroom release), Player/Gameplay (MAGNETIC–REFOUND scale; FUNCTIONAL is below the
  bar for important experiences), Classroom/Projector (three coupled surfaces), Visual
  Experience (premium bar, no CSS ceiling; Chromebook is a performance constraint, not an
  excuse).
- **Founder invariants made explicit in CLAUDE.md:** the real world of sports business (NBA
  first, real people frequently, reality never a fandom test, simplify the interface before the
  economics) and the random-teacher standard. Future non-sports BOW Economics courses are
  separate products with their own play systems, never selectable motifs of this one.
- **Constitution separation is machine-checked:** Decision Challenges assessment law (rubric,
  evidence modes, standards, assessment-integrity blocking, its critic roster) is excluded by
  `constitutionExclusions` in `.boss/config/project.json`, enforced by doctor and eval E1.
- Status language: Economics Boss is **implemented, harness-tested (44/44 evals + CLI smoke),
  and independently reviewed** — not "proven." The first real Boss-controlled program (Module 2)
  is the actual test and requires explicit founder activation; this port deliberately performed
  no Module 2 product work.

- **Status:** ACTIVE
- **Date:** 2026-08-31
- **Owner:** CEO (program mandated by Founder instruction this session)
- **Evidence:** docs/development/ECONOMICS_BOSS_PORT.md; tools/boss/test/ (44/44 this session);
  `npm run boss:doctor` green this session; source audit against bow-decision-challenges@9313c91.

## D20. Module 2 "Money in Motion" — architecture ruling, build, and program acceptance

MODULE 2 PROGRAM RULING (first real Economics Boss run, `m2-quality-war`, Level 3 Quality War).
Architecture war: three genuinely competing candidates (A: Box Office evolved; B: refound; C:
clean-room first principles, produced with the existing prototype withheld from its context) were
judged on played Stage-0 prototypes plus independent Sports Reality, Economic Truth, and Gameplay
reviews — all three converged on **Candidate C** without a meeting. The Box Office lesson and
both losing candidates were killed on evidence (sunk cost received no vote); Box Office's
operate-don't-choose patterns survive inside C. Decision record with the binding build charter
BC-1..BC-7: `docs/gauntlet/module-2/ARCHITECTURE_SELECTION.md`.

The module as built: **L1 "Full House"** (price the night blind against real NBA night cards,
CASH/RENEWALS two books, Two Peaks reveal), **L2 "You Don't Play Alone"** (host the league —
the visiting club's Draw is the dominant term in your gate; reinvest-in-Draw; decomposition
reveal), **L3 "Writing the Rule"** (rule dials → sealed two-thirds vote → lived-under season →
Kings 22-8 commit-then-reveal capstone → the revisit-able "Economics You Learned" finale).
L2→L3 seeds via the m1 opaque-seed pattern; L1→L2 deliberately does not seed (D9 grounds
recorded in the module header).

Verification: each lesson passed independent fresh-context gates for gameplay (all three
**STRONG**), economic truth (every blocking finding repaired and re-verified by the owning
critic, including BC-1 proven by independent computation — sharing moves behavior through the
differential reinvest instrument, capacity-bound markets honestly immobile), teacher transfer
(**TRANSFER: READY** on all three), classroom/projector (fit, privacy, fallbacks, choreography),
and sports reality (all real-world facts dated and verified, Kings capstone facts confirmed).
Durable module discipline established: **every rendered claim on any surface is a computed,
audited atom** (value/quantifier/bound/noun/level + rendered-string drift, mutation-proven), and
e2e instruments assert occlusion/ellipsization/ink-collision at class size on both projector
shapes plus 1024x600 first-contact.

Open at ruling time, carried to the founder: the visual premium clause is **VERIFIED-UNMET**
(three consecutive advisory SERVICEABLE-NOT-PREMIUM re-grades, explicitly non-blocking for
classroom use — founder decides: accept, or commission an independent second visual review and a
polish wave); a pre-existing M1 L3 client race makes its e2e flaky (documented with a bounded fix
path in `docs/gauntlet/module-2/E2E_L3_FLAKE_NOTE.md`; not a Module 2 regression — reproduced at
a pre-M2 checkpoint); non-blocking backlogs live in the gate docs. D10 in full force: all three
lessons are **classroom-ready candidates**; nothing is classroom-proven until it survives a real
class.

- **Status:** ACTIVE
- **Date:** 2026-09-01
- **Owner:** CEO (program activated by Founder instruction; founder controls merge to main)
- **Evidence:** `.boss/runs/m2-quality-war/` (event-sourced run history, 100+ evidence records);
  docs/gauntlet/module-2/ (design war, gates, re-checks, analyst reports); final-head sweep
  evidence ids final-suite, final-e2e-m2l1/l2/l3, final-e2e-m1l2/l2ea/l3ea/l3-retry.
