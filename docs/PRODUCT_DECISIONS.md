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
Durable module discipline established: **every registered claim is a computed, audited atom**
(value/quantifier/bound/noun/level plus rendered-string drift, mutation-proven) — with the
owning critic's honest limit on record: rendered-but-unregistered prose remains structurally
invisible to the audit (W5-1..W5-3 narrow, not close, that hole) — and
e2e instruments assert occlusion/ellipsization/ink-collision at class size on both projector
shapes plus 1024x600 first-contact.

Open at ruling time, carried to the founder: the visual premium clause is **VERIFIED-UNMET**
(three consecutive advisory SERVICEABLE-NOT-PREMIUM re-grades, explicitly non-blocking for
classroom use — founder decides: accept, or commission an independent second visual review and a
polish wave); a pre-existing M1 L3 client race makes its e2e flaky (documented with a bounded fix
path in `docs/gauntlet/module-2/E2E_L3_FLAKE_NOTE.md`; reproduced at a pre-M2 checkpoint, so it predates M2; the rate difference between heads is
unresolved at n=6 and M2 ships in the same shared play client); non-blocking backlogs live in the gate docs. D10 in full force: all three
lessons are **classroom-ready candidates**; nothing is classroom-proven until it survives a real
class.

- **Status:** ACTIVE
- **Date:** 2026-09-01
- **Owner:** CEO (program activated by Founder instruction; founder controls merge to main)
- **Evidence:** `.boss/runs/m2-quality-war/` (event-sourced run history, 100+ evidence records);
  docs/gauntlet/module-2/ (design war, gates, re-checks, analyst reports); final-head sweep
  evidence ids final-suite, final-e2e-m2l1/l2/l3, final-e2e-m1l2/l2ea/l3ea/l3-retry.

## D21. Founder rulings on the three Module 2 wave-2 questions (FD-1, FD-2, FD-3)

The Module 2 premium quality war surfaced three questions the Boss could not answer without the
founder. All three are now ruled, and the rulings hold until superseded.

**FD-1 — the shape of the two-book trade-off. ACCEPTED as the honest computed frontier.** Module 2
teaches "most fans are cheap to keep, the last ones are ruinous" — rising opportunity cost — rather
than "you cannot have both". The model does not support the stronger story and the product will not
manufacture scarcity the model does not have. The frontier visual is drawn from `seasonFrontier` and
`renewalMarginalCost`, both axes in the two books' own units, the gap printed in dollars and people
and never as a percent to students. No frame may be captioned "you gave up almost nothing to keep the
fans" — to a ten-year-old that reads "keep prices low, it's free," the false lesson an earlier repair
removed. This closes the option of retuning the model's constants for the picture's sake.

**FD-2 — reading burden on the pre-lock decision screen. RULED: short critical rules in view, full
rules one tap away.** The earlier ≤60-word first-viewport budget was artificial; a modest increase is
acceptable where it protects comprehension, but student pull is the thing being protected and the
decision screen must still read as a decision rather than a page of paragraphs. Economic Truth's R-L
concern — that moving the full rules behind a disclosure weakens the "printed before the commitment"
requirement — is answered by this ruling: reachable-in-one-tap satisfies it, dumping every rule onto
the surface does not.

**FD-3 — arena fill encoding. RULED: do not stall a wave on an art rewrite.** Preserve the meaningful
deck and seam structure and the truthful printed fill figure. Improve the visual encoding only where
a bounded strong implementation exists. A seat-by-seat or heavy-WebGL bowl is not required to close a
wave unless evidence shows the current encoding is unusable. The standing advisory dissent about
mid-range fill legibility is dispositioned by this ruling, not by a rebuild.

- **Status:** ACTIVE
- **Date:** 2026-09-02
- **Owner:** Founder (ruled directly; recorded by the Boss lead)
- **Evidence:** `.boss/runs/m2-visual-quality-war/` wave-2 verdict and the wave-3 contract;
  `docs/gauntlet/module-2/premium/DIRECTION_W2.md` Q2 (the frontier probe figures);
  `docs/gauntlet/module-2/premium/REVIEW_VISUAL_W2.md` (the fill-ladder measurements).

## D22. Program sequence after Module 2 wave 3 — runtime architecture, then dual-band M1, then M2 for 7–8

Founder-set order of programs. None of this is built inside wave 3; wave 3 finishes the product
surfaces first so the next program audits the real post-wave-3 product rather than an intermediate
build.

1. **Classroom Runtime Architecture War** — the smallest strong classroom runtime that can reliably
   run real Ramaz classes, support M1 and M2 and both grade bands and non-founder instructors, and
   leave deliberate seams for later reuse. Explicitly NOT a universal BOW platform, not a wholesale
   copy of another product's architecture, and not a rewrite of working systems because a cleaner
   one can be imagined. The repo is authoritative: the program inspects what exists before it
   proposes anything. Its behavioural requirements — teacher-controlled progression with automatic
   assistance never removing teacher control at important moments; a draft/locked distinction where
   the lesson needs one; a TIME CUT that closes submissions, keeps valid ones, gives missing students
   an honest lesson-defined fallback and lets the class move; realtime that feels instant but is
   never the only source of truth, with canonical state winning every disagreement; boring refresh
   and reconnect on all three surfaces; a projector treated as a distinct scoped client rather than
   one inheriting every teacher power; meaningful event history rather than clickstream surveillance;
   seeded reproducible uncertainty plus teacher-triggered predefined shocks; bounded teacher recovery
   powers and no God Mode — are requirements on behaviour, not mandated tables, APIs, schemas,
   libraries or infrastructure. It certifies itself against classroom chaos (student refresh,
   disconnect, duplicate and stale submits, two tabs, sleep/wake; teacher refresh, double-trigger,
   TIME CUT mid-submit; projector refresh and missed events; duplicate, delayed, missed and
   out-of-order updates; twelve to sixteen simultaneous submissions), not against schema cleanliness.
2. **Module 1 redesigned for both grade bands from birth** — one M1 architecture with a shared
   economic world, shared persistent franchise logic and shared consequences, plus grade-specific
   depth and scaffolding. Not M1 for 5–6 followed by a fork. This is where the BOW grade-band pattern
   is established.
3. **Module 2 adapted to grades 7–8** using that grade-profile system, preserving the proven core
   economics and classroom experience.
4. **A full Sports Business I gauntlet** across both bands, then real Ramaz human classroom evidence.

**Grade bands (D6 superseded in scope only).** Ramaz wants Sports Business I for grades 5–6 AND
grades 7–8, run as separate classes. The model is a shared simulation with a grade-band depth layer —
one core sports-business world, economic engine, consequence model and class runtime, with a grade
profile selecting copy, scaffolding, visible information, control complexity, reasoning demands,
numerical burden, ambiguity, counterfactual questions, teacher prompts, synthesis depth and
vocabulary timing. Two independent codebases are not the default. Grades 7–8 must not be the same
worksheet with harder numbers: 5–6 identify and explain the relevant trade-off; 7–8 defend a decision
with evidence, reason under uncertainty, compare alternatives, and judge decision quality separately
from outcome. The economic world stays authentic for both, and each band is prosecuted on its own
evidence — one band's simulated-student verdict never proves the other's. The runtime should
eventually carry separate simultaneous class instances, each with its own lesson, phase, teacher,
roster, decisions, projector state, progress and grade-band profile.

**Teacher Transfer stays a hard product requirement and is now also a business-model requirement:**
the founder must not be a hidden runtime dependency for either band.

- **Status:** ACTIVE
- **Date:** 2026-09-02
- **Owner:** Founder (program sequence and scope ruled directly; recorded by the Boss lead)
- **Evidence:** founder instruction of 2026-09-02; wave-3 ship case section
  "TECHNICAL REALITY HANDOFF FOR CLASSROOM RUNTIME WAR" carries the repo-grounded inputs.

## D23. Live-classroom runtime contract for Module 2 — transport, action integrity, TIME CUT, recovery, presence

- **Decision:** The M2 live runtime holds five standing rules, all now implemented and
  browser-proven. (a) TRANSPORT: push/realtime is primary, the server is the only truth,
  and poll/refetch reconciliation is the fallback — realtime is a delivery optimisation
  and is never itself authoritative. (b) ACTION INTEGRITY: a valid student action inside
  an open decision window is applied exactly once OR receives an explicit authoritative
  refusal naming a legitimate semantic reason (stale, wrong phase, duplicate, retired
  credential, past TIME CUT). A transport or version race is never a legitimate reason to
  lose a student's choice. (c) TIME CUT: the teacher holds both FINAL CALL and CLOSE NOW;
  fairness is adjudicated on server time, never on an untrusted client clock; each lesson
  defines its own economically honest fallback for an uncommitted desk — there is no
  universal mystery fallback and no random one. (d) RECOVERY: automatic safe checkpoints
  at pre-reveal boundaries; a returning student receives current authoritative state plus
  a compact "while you were away" recap, and the class is never rewound. (e) PRESENCE: the
  teacher's room view carries committed decisions and teacher-private diagnostics; the
  projector is structurally never handed a seat identity.
- **Grounds:** Founder runtime instruction of this program; every clause is a behaviour
  requirement, with schema and system design left to the build.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Founder (behaviour); lead integrator (design and evidence)
- **Evidence:** `runtime/scripts/e2e-time-cut.cjs`, `e2e-realtime.cjs`, `e2e-away.cjs`,
  `e2e-teach-room.cjs`, `concurrency-harness.cjs`, `e2e-full-room.cjs` at 16 and 32 desks.

## D24. A computed finding may be split by SURFACE — the projector gets the finding, the teacher gets the argument

- **Decision:** When a computed finding is too long for the projector, the repair is to
  split WHERE it renders, never WHETHER it exists. A `Claimed` value carries `text` (the
  whole finding, which the claim audit recomputes and which the teacher's script prints in
  full under an explicit "yours to say, not on the wall" label) and an optional `board`
  (the short rendering the projector shows). Deleting the reasoning to fit a frame is
  forbidden; so is putting a paragraph on a wall a class is meant to read in one look.
- **Grounds:** M2 L2's REVEAL put 13 lines of argument on the projector at stage 2 and 10
  at stage 5. Cutting them would have destroyed the economics; keeping them destroyed the
  reveal. A test now fails if a finding reaches neither surface.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** commit "W6/RC2"; `hostTheLeague.test.ts` "no REVEAL summary puts a
  paragraph on the projector" and "every word the projector gave up is in the teacher's hand".

## D25. Drawn magnitude must equal modeled magnitude, and it is measured, not eyeballed

- **Decision:** Any product drawing whose SIZE carries a quantity — a crowd wedge, a bar,
  a building — must be measured against the model in a browser, by an instrument that
  poisons itself before its result is believed. Where a projection makes equal inputs draw
  unequally, the renderer corrects by MEASURING the projected area rather than by an
  analytic approximation. What a drawing may encode is limited to quantities the model
  actually holds: L3's league floor draws opening cash (a real 5x spread) and refuses to
  draw seat counts (a 24% spread that would render as twelve identical shapes and teach
  nothing).
- **Grounds:** L2's crowd attribution drew a true quarter of the house as anywhere from
  14.6% to 35.4% of the drawing. L3's league floor drew the student's own club's $2.4M
  taller than the $2.6M beside it, because a YOU badge was an extra layout row on one
  column. Both are `<economic_truth>` violations — visual drama misrepresenting
  magnitude — and neither was visible without measuring.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `runtime/scripts/arena-wedge-fidelity.cjs` (worst wedge 7.3%, tolerance
  10%, poison rejects a 40/20/20/20 house offered as equal quarters);
  `e2e-m2l3.cjs` league-floor instrument (worst bar 0.4% of the tallest, tolerance 4%,
  one baseline, poison rejects a stretched bar).

## D26. The student device paces WITH the projector, never ahead of it

- **Decision:** During a teacher-paced reveal, the student device shows this desk's own
  version of the beat that is currently up, and nothing belonging to a beat the teacher
  has not pressed. The gate lives in the module payload, not the renderer, so the numbers
  are not merely unrendered but unsent — and the invariant is assertable without a
  browser. Each lesson's reveal also gives the desk at least one thing to DO; M2 L2 and
  M2 L3 both take a single call from the pair before the beat that settles it.
- **Grounds:** L2's desk carried every number all five beats are about from beat 0 and
  then never changed: a pair that looked down had already read the answer to every
  question the room was about to be asked. A DOM diff across all six presses came back
  byte-identical. The student device was defeating the classroom choreography the lesson
  is built on.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `hostTheLeague.test.ts` "no reveal beat's numbers reach the desk before
  the teacher presses it"; `e2e-m2l2.cjs` per-beat DOM diff plus a planted-ledger poison.

## D27. Page width belongs to the layout, never to a control

- **Decision:** A surface's dimensions may not be derived from the presence of a button or
  any other control. Layout-scoped CSS classes carry layout facts.
- **Grounds:** L2's two-column decision band took its 1000px width from the lock-bar rule,
  so the one screen in the lesson with nothing left to commit — the season finale —
  silently rendered at 640px: the evidence column collapsed 608px to 248px and the price
  counterfactual grew from 150px to 382px and fell off the bottom of a Chromebook. This
  class of defect appears only on the last screen of the lesson, in front of the class.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-m2l2.cjs` "the finale is not allowed to be a narrower page than the
  weeks that led to it".

## D28. Dead air inside a decision phase is a design defect, and the fix is a free commitment

- **Decision:** Where a lesson leaves a committed pair with nothing to do while the rest of
  the room finishes, it owes them a stake rather than a waiting message. The standing
  answer for M2 is THE GATE CALL: before the bell, the pair calls how full the building
  gets — packed / busy / quiet — for no money, changeable until the bell, and the
  settlement answers the call they actually made. A pair that never called is handed
  nothing. Its bands are measured against the lesson's own outcome distribution, never
  guessed, and its answer stays forecasting language: "you read it" or "the night did not
  go the way you read it", never a verdict on the price. The same screen carries an
  aggregate room line (N of M desks in) so the wait is finite and legible without ever
  naming a seat.
- **Grounds:** L1 and L2 both told a locked pair, three to five times a lesson, that there
  was nothing to do but find out. That is several minutes of dead air inside the phase the
  lesson is named after, at the exact moment the pair is most invested. A free prediction
  costs the economics nothing, is honest about what is knowable, and converts the wait
  into the second-cheapest kind of engagement there is: having said it out loud first.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `fullHouse.test.ts` / `hostTheLeague.test.ts` W6 gate-call tests (bands,
  aggregate-only room line, all four semantic rejections, changeability, no carry across
  the bell, forecasting-only language); `e2e-m2l1.cjs` and `e2e-m2l2.cjs` above-fold and
  answer-names-the-call-actually-made assertions plus a DOM-poison non-vacuity check.

## D29. A second book that returns one number over most of its dial is not a second book

- **Decision:** Where a lesson claims a decision trades two objectives off against each
  other, both objectives must respond across the range the pair is actually deciding in.
  A clipped arm that reads the same value at the cash-best price and at a price nobody
  would ever choose is informationless, and the claim it supports is false however good
  the settlement arithmetic is. Curves are bent, not clipped, and the property is
  asserted where the decision lives — near the optimum — not merely at the extremes.
- **Grounds:** L1's renewals book returned the identical -20 at 43 of 56 legal prices,
  including the cash optimum. Worse, the season-scale two-book property (harness P14) had
  been passing *because of* that clip. Deepening the floor changed nothing; the near-field
  slope is what carries the trade-off.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `fullHouse.test.ts` R4-5 (the band is not flat at the cash optimum; no
  single value occupies more than a third of the prices near the best net; gouging always
  costs more than gouging less); harness P14 limbs (i)-(v.f).

## D30. THE ROOM belongs to every lesson with a live decision window, and reads that lesson's own economics

- **Decision:** Every lesson with an open decision window gives the teacher a private live
  read of spread, shape and movement, on `/teach` and nowhere else. It is not one panel
  reused: each lesson bins the dial its own economics turn on (L1 price, L2 the reinvest
  dial, L3 the proposed share while the rule is being written and the reinvest dial once
  the season opens), and each authors its own heading, spread sentence and movement
  sentence. Movement is claimed only against a number that desk chose itself — never a
  bell-committed round, an auto-settled week, or a round the desk sat out.
- **Grounds:** A teacher standing up cannot count twelve dials, and the arithmetic they
  cannot do is exactly the arithmetic that picks the next question. The renderer is
  generic; the words are not, because "locked in" is wrong in a stage where desks propose
  a number at the league rather than committing a dial.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `fullHouse.test.ts`, `hostTheLeague.test.ts`, `writeTheRule.test.ts` THE
  ROOM tests, including a poisoned instrument (counting AUTO weeks as decisions, and
  letting uncommitted dials into the spread, both fail); `e2e-m2l2.cjs` / `e2e-m2l3.cjs`
  browser assertions that the read is on the console and on neither the projector nor a
  desk.

## D31. The console shows the projector, it does not describe it

- **Decision:** `/teach` carries a live mirror of `/board` for the room it is driving. It
  is an iframe of the board itself — same page, same session, same poll — scaled by
  transform and made completely inert (`pointer-events: none`), never a second renderer
  fed board data. It is capped to a monitor-sized box, collapsible, and disappears with
  the session.
- **Grounds:** A teacher directing a class faces the room, which means facing away from
  the board. The director panel can say what is on the projector; only the projector can
  show whether the reveal actually landed. A mirror built from a second renderer can drift
  from the board and quietly misreport the room's own evidence; an iframe structurally
  cannot, and it carries nothing private for the same structural reason — it is exactly
  what the class can already see.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-m2l1.cjs` projector-preview assertions at HOOK and at REVEAL stage 5
  (pointed at this room, inert at its centre point, the projector's own shape, not
  reflowed, showing the board's own words, and tracking the room from one to the other).

## D32. A surface never moves backwards

- **Decision:** Every polled surface refuses a frame older than one it has already drawn,
  compared on the session version the server never lowers, scoped to the room and reset
  when the surface is pointed at another one. Equal versions pass — the same version
  legitimately carries a countdown tick or a recap arriving. The frame returned by an
  ACTION or a teacher CONTROL goes through the same gate, because that is the frame that
  moves the surface forward and therefore the one that sets the floor.
- **Grounds:** The transport serialises its own fetches, so two polls cannot land out of
  order; an action is a different request on a different socket. Reproduced in the
  browser: a poll held at the transport, a lock submitted underneath it, and the released
  body drew the pair's own committed decision back into an unlocked dial. Nothing was lost
  on the server — which is why no state test had ever seen it — but a fifth-grader
  watching their decision come undone presses it again.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `freshness.test.ts` (monotonicity, equal-version acceptance, room change,
  reset, unreadable payloads passed through); `scripts/e2e-stale-poll.cjs`, which drives
  the window deterministically and includes an over-blocking limb — the desk must still
  follow the room to the next night.

## D33. The way back to a seat survives a refresh

- **Decision:** A pair's rejoin PIN must be reachable on their own device for the whole
  lesson, not only in the twenty seconds after they join. Where the PIN banner collapses,
  the affordance that reopens it is restored from stored credentials on every load.
- **Grounds:** The PIN is the one thing that moves a pair to another device when this one
  dies, and a refresh is not an unusual event on a classroom Chromebook. Full House was
  already safe — its desk rail carries the digits permanently — which is exactly why the
  gap in the other two lessons went unnoticed.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-m2l2.cjs` mid-week refresh (strip restored, drawn, opens this seat's
  own PIN, decision intact) — proven to fail without the repair; `e2e-away.cjs` reloads a
  Full House desk and rejoins from a second device on the PIN its rail still carries.

## D34. THE DESKS — the room, named

- **Decision:** Every M2 lesson exposes a teacher-only walk-to list beside THE ROOM: the
  module's own desk handle, the pair actually sitting there, what that desk is doing right
  now, and at most one note. THE ROOM keeps its job of describing shape and naming nobody;
  THE DESKS does the join a teacher was otherwise making in their head, standing up,
  mid-class. Modules own the vocabulary (a desk in L3's offer rounds has a *number in*, it
  has not *locked* anything) and own which of their notes is a reason to walk over
  (`flag`) rather than context for reading that desk's books.
- **Grounds:** The console had a join list of student names with no desks and a WATCH FOR
  list of desk handles with no names. The one question a teacher asks during a live window
  — *who do I walk to* — was the one question neither list answered.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `fullHouse.test.ts`, `hostTheLeague.test.ts`, `writeTheRule.test.ts` (state
  vocabulary per lesson; never in `boardView`, never in a student view); `e2e-m2l1.cjs`
  Night 1 (three chips, the split named, the filter, nothing of it on the projector).

## D35. A signal that changes with nothing but time must be part of what re-sends the body

- **Decision:** The console shows when a desk's device has gone silent, measured on the
  server's clock and reported in buckets (30s+ / 1m+ / 5m+ / 15m+), with the bucket in the
  teacher payload's ETag fingerprint.
- **Grounds:** Three separate ways to get this wrong, all of them shipped somewhere first.
  Subtracting a server timestamp from the console's own `Date.now()` reads every desk in
  the room as gone on a laptop whose clock has drifted. A live millisecond count inside a
  conditionally-cached payload freezes at whatever it was when the body was last sent and
  then lies about how long. And a fact that bumps no session version answers 304 forever —
  the same failure already recorded for the rejoin lockout pill. The threshold is the same
  AWAY_MS that opens a student's own "while you were away" recap, so the console and the
  returning pair never disagree about who was gone.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-away.cjs` — the console marks exactly the one offline desk, in bucket
  language, while it is still dark; the assertion timed out against the pre-repair ETag.

## D36. A pair is never blamed for a night they were not in the room for

- **Decision:** Teacher-facing flags about a desk that "has never committed" count only the
  rounds that pair was actually present for. Nights covered by the desk manager before a
  late pair arrived, and weeks a league-office club was run before a handover, are context
  on the chip and never a reason to walk over.
- **Grounds:** Caught by its own test: a pair who joined at Night 2 was being reported to
  the teacher as having "never once locked a night of its own" before they had taken a
  single turn. A console that sends a teacher across the room to scold a pair for a night
  they were not there for is worse than a console with no flags at all.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `fullHouse.test.ts` "a late desk is annotated but is not a reason to walk
  over".

## D37. The link picker skips what this build cannot open, and says so when it fails

- **Decision:** `listSessions` skips rows naming a lesson module this build does not
  register instead of throwing, and /teach distinguishes "nothing to link to" from "could
  not read the list".
- **Grounds:** One stale snapshot — a renamed module, a session carried over from an older
  build — threw out of the whole listing, so the "link to a previous session" picker
  returned nothing for every lesson and the console swallowed the error. A teacher would
  have concluded yesterday's session was gone and started an unlinked room, silently
  breaking the L1 -> L2 -> L3 chain the module rests on. A session whose module is gone is
  exactly the one thing the picker cannot offer anyway.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `sessionService.test.ts` "a session built by a lesson this build no longer
  registers does not take the whole picker down" — proven to fail without the repair.

## D38. No grade-band seam is built until a second band exists to switch on

- **Decision:** No `gradeBand` field, context, or switch is added to the session, the
  module contract, or any lesson. Recorded instead: if a 7-8 band is ever built, it
  attaches at exactly two places — `createSession` input carried onto the session row, and
  the `initialState` context each module already receives — and nothing else in the runtime
  needs to know.
- **Grounds:** Track 101 is grades 5-6 only (D6), and no 7-8 content exists to select. A
  field with no consumer cannot be tested, cannot be proven, and invites content forks
  nobody has designed — the same premature-generality trap CLAUDE.md section 12 forbids for
  the lesson engine. Naming the attachment point costs nothing and keeps the future change
  small; shipping an unused switch does not.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** None required — this decision is not to build.

## D39. Linking a session that has not finished is allowed, but never silent

- **Decision:** The link picker warns, before the room is created, when the selected
  source session is still live: the books carried forward are whatever that room holds at
  the instant this one is created. Linking a live session stays permitted — a period that
  ran long, a class split across two days — the warning only makes it deliberate.
- **Grounds:** The picker lists live sessions ("live, PLAY") beside finished ones and the
  seed is read at creation time, so a mis-click carried a half-played league into the next
  lesson with nothing downstream able to tell: L3's own seed note says the books "walked in
  from this room's own Lesson 2 session", which stays true and stops being the whole truth.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-l2.cjs` — a still-running L1 raises the warning, a finished one clears
  it.

## D40. The rehearsal the console prescribes is the whole lesson, marked

- **Decision:** Every lesson that ships a directing panel must be fully walkable with zero
  desks in the session, because that is what `/teach` tells a first-time teacher to do. A
  cold walk shows the real WATCH FOR flag shapes with stand-in desks, and the complete
  synthesis deck — every card the live room gets, none dropped. Every stand-in title is
  prefixed `REHEARSAL — ` and every stand-in figure carries a STAND-IN sentence, so nothing
  a rehearsing teacher sees can be mistaken for a room's own arithmetic. Dated real-world
  content is left unmarked: it is the same sentence tomorrow, and marking it would be a lie
  in the other direction.
- **Grounds:** M2 L2 was repaired for this under `gate-l2-teacher` B5 and its two siblings
  were not. M2 L1 rendered NO watch flags at all with zero desks and collapsed a six-card
  synthesis deck to one placeholder; M2 L3 kept all its cards but computed them against an
  empty room, so the prescribed rehearsal put sentences like "Nobody in this room ended
  down on the pot this time" on the projector as statements of fact. In both cases a teacher
  who did exactly what the product instructed met the room's only diagnostic panel, and most
  of the phase where they talk the most, for the first time in front of students.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-rehearsal.cjs` — all three directed lessons walked cold: L1 6 cards /
  4 flags, L2 5 cards / 4 flags, L3 7 cards / 5 flags, every one marked on the projector,
  with an unmarked-flag poison frame caught in each lesson. Unit: `fullHouse.test.ts`,
  `writeTheRule.test.ts` (deck length and titles must match the live deck exactly).

## D41. The console never claims a surface the selected lesson does not have

- **Decision:** The pre-session note promises a directing panel only for lessons whose
  module authors one; the other lessons are told plainly that they ship none and must be
  prepared from their own lesson plan. The lesson picker says which kind each option is,
  lists the directed lessons first, and never opens on an undirected one. The connection
  test is labelled as a connection test, not offered as a lesson.
- **Grounds:** One sentence promised "the directing panel — what to say, what to ask, what
  to hold back, and the line for each reveal" for all seven registered lessons, while three
  ship it. The picker then opened on Draft Day, one of the four without it, under a comment
  claiming it was the module teachers actually run class with — so the console's own default
  contradicted the paragraph directly beneath it, and a teacher who rehearsed Draft Day was
  left hunting for a panel that does not exist.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-rehearsal.cjs` — the picker opens on a directed lesson, the connection
  test is labelled, and the note under Draft Day says no directing panel and does not carry
  the director promise.

## D42. The console carries a class clock, on the server's clock

- **Decision:** THE DECK shows minutes elapsed since the session was created, painted from
  the session's `createdAt` corrected once by the server/console skew read at first paint,
  and repainted on its own 15-second beat rather than by polling. `createdAt` is constant,
  so it is ETag-safe; the live minute is never sent in a cacheable body (D35).
- **Grounds:** Every director panel is written in minute budgets ("Now — 6 min") and the
  teacher had no way to know where they were against them. A console that budgets a period
  and does not say the time makes the teacher do the one piece of arithmetic they cannot do
  while directing a room.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-rehearsal.cjs` — the strip reads MIN 0 at creation and repaints to
  MIN 7 on its own beat when the console's wall clock is pushed forward, with no poll and no
  press.

## D43. A pair whose device died can be put back in their own desk

- **Decision:** The console can reseat any seat: it mints a fresh 4-digit rejoin PIN, shows it
  to the teacher to read aloud, and retires the old device token in the same write. The desk,
  its books, its history and its identity in the room's evidence are untouched — the pair
  rejoins under the same name on a spare device and lands in the seat they already held.
  Minting a credential for someone else's seat requires the teacher key and never crosses
  sessions. Every M2 lesson's LOBBY script now tells the room to write the PIN down somewhere
  that is not the screen showing it.
- **Grounds:** Rejoin assumes the pair still holds something the seat will accept — the device
  token, or the PIN their device showed once at join. A dead Chromebook takes both in the same
  instant, and such a pair is not locked out (so `unlockRejoin` does nothing for them); they
  are simply outside. In a fifty-minute period the only moves left were to rejoin as a NEW seat
  — a fresh desk and a blank book in the middle of the evidence the class is about to be shown
  — or to lose the pair for the rest of the lesson.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-away.cjs` — a genuinely offline device is reseated from the console and
  the pair rejoins on a second laptop keeping `Desk 1 · New York Knicks`. Unit:
  `sessionService.test.ts` (old token and old PIN both dead; teacher key required; no
  cross-session reach).

## D44. The console says whether a projector is really watching

- **Decision:** The Projector card carries BOARD LIVE / BOARD QUIET / BOARD NOT SEEN, from a
  coarse bucket of when a `/board` poll last arrived (in memory, never on the session row, so
  a projector poll neither bumps the version nor writes to disk). The console's own embedded
  mirror polls with `preview=1` and is deliberately NOT counted; the bucket is in the teacher
  ETag fingerprint (D35).
- **Grounds:** A teacher says "look at the board" with their back to it. A dead HDMI cable, a
  sleeping projector, or a `/board` tab left on yesterday's code are all silent from the
  console — and the console's own preview iframe looks perfect throughout, because it is this
  laptop's copy of the page rather than the one on the wall.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-rehearsal.cjs` — BOARD NOT SEEN while only the console's own mirror is
  polling, BOARD LIVE once a real projector opens the room, and back to BOARD QUIET after it
  closes.

## D45. Device health outlives the decision window; undo depth is stated everywhere

- **Decision:** THE DESKS no longer stands down when PLAY ends. Outside PLAY it becomes a
  device-health strip: it appears only when a device has gone quiet, shows only those desks,
  and says plainly that nothing on it is about a decision. And every skip-content confirm, plus
  Restore itself, carries one shared sentence saying the undo is ONE step deep.
- **Grounds:** A Chromebook that dies in REVEAL leaves a pair watching the class's whole
  payoff on a black screen, and the console said nothing because the panel keyed off PLAY. On
  undo, two of six confirm branches claimed "Restore last good state is the only way back" and
  four said nothing, so the same click read as recoverable in one lesson and unqualified in the
  next — and "the only way back" was never the whole truth, because there is exactly one
  checkpoint and no second step backwards.
- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** Lead integrator
- **Evidence:** `e2e-away.cjs` (a genuinely offline device is marked quiet on the console);
  the undo sentence is one shared constant, so the six branches cannot drift apart again.

## D46. Lesson 1's second book reads differently at every price worth taking

The W6 repair `econ-l1-renewals-dead-arm` bent the renewals gouging arm instead
of clipping it, and then paid for the two-book season claim by tripling the
near-field slope (`planSlope` 3.6 -> 9.0) and deepening the one-night limit
(-20 -> -26). Measured at those shipped constants, `renewalDelta` returned the
-26 floor at **41 of the 56 legal prices on Nights 1 and 5, and on 50% of the
whole price grid**. Three quarters of the dial returned one number; the board's
own class line printed median renewals New York 2%, Memphis 0%. The defect the
bend existed to kill was still shipping — a pair could not read its own choice
out of the second book, and gouging past about $48 was free.

The season-scale claim (harness P14 limb i: the never-move-the-dial line must
end at least 15 renewal points ahead of the most-cash line) does not need a
steep New York arm. It needs a steep **Memphis** one: Memphis prices off a $16
plan against New York's $24, so the same dollar of gouging is half again as
large a share of the ticket, and the season cash-maximising policy is what
notices. `planSlope` is now per-market — New York 3.2, Memphis 4.1 — at
`RENEWAL_GOUGE_BEND` 9, chosen by exact forward DP over (renewals x carry), the
same DP P14 runs. Both markets clear all four P14 bars with headroom (margin
17/16 against 15; range 37/36 against 30; renewals cost 7.2%/4.6% of season cash
against 4%), both sit mid-plateau rather than on a knife edge, and floor-binding
falls from 50% of the grid to 8%. Where the limit still binds it binds only
above three times the night's cash-best price, in a building that already draws
nobody — which is the only place a flat penalty is honest.

The suite property that guarded this was asserting the opposite of what the
lesson wants ("$120 still reaches the one-night limit on every gougeable card")
and passed happily on the broken constants. It now asserts what the desk is
owed: the arm bites monotonically all the way up, the limit never binds at a
price where people are still walking in, and the limit is still reachable
somewhere so it is not dead code.

Also repaired in the same pass: `repeatRowFor`'s floor predicate was `raw < 0`,
so a night whose raw demand landed on exactly zero counted as readable. A desk
that drew 0 then 0 was told a crowd hit zero "on one of the two nights". The
predicate is "did anybody come" — `<= 0` — in the product and in the harness.

## D47. The finale deck a desk holds is a high-water mark, not the current page

D26's rule is that a desk never reads ahead of the projector, and Lesson 3's
finale now hands each desk the cards the board has reached. That has to be the
furthest card the projector has EVER turned to (`synthSeen`), not `synthPage`:
the teacher's own Back button, and the forward wrap past the last card, would
otherwise take cards off thirty screens in the middle of the discussion those
cards are for. Reading ahead is the thing forbidden; looking back is the thing
the desk copy promises.

## D48. Module 1 architecture ruling — "THE SAME LINE", candidate D plus five sourced grafts

MODULE 1 ARCHITECTURE SELECTION. Module 1 is rebuilt from the ground up on **Candidate D,
"THE SAME LINE"** (`docs/gauntlet/module-1/rebuild/DESIGN_D_CHALLENGER.md`), with five named
grafts. Decision record and the binding 23-item build charter BC-1..BC-23:
`docs/gauntlet/module-1/rebuild/ARCHITECTURE_SELECTION.md`.

**The war.** Four genuinely competing directions were designed independently against an Economic
Learning Contract written before any of them existed, each shipping a PLAYABLE Stage-0 L1 loop:
A FRONT OFFICE UNDER PRESSURE (eight face-up pressure cards), B THE FRANCHISE (inherit one real
club's actual books), C CLEAN ROOM (five doors — you pick how you pay, not who you sign, produced
with the existing M1 withheld), D THE SAME LINE (you hold a position relative to lines drawn in the
same place for every desk, and the lines move). Three independent lenses prosecuted all four by
executing their models, not by reading their prose.

**The lenses conflicted, and the conflict resolved on inspection rather than by compromise.**
Sports Reality ranked C > A > D > B and blocked B; Economic Truth ranked B > A > C > D and blocked
D; Player/Classroom ranked D > B > C > A and rated only D and B STRONG. The apparent Economic-Truth
/ Gameplay contradiction about D was not one: Economic Truth enumerated legal three-day *plans*
scored on D's five displayed readings, Gameplay swept the *continuous bid space* scored on who the
student actually got. Both hold, and together they say — **D's bid is the richest input in the war
and D's five readings are the poorest register of it. The defect is not the mechanic; the reveal
does not measure what the mechanic produces.** D's own author had already named that repair. Two
prosecutors and the design converge on one fix, which no other candidate's fatal has.

**Killed on evidence, not on taste.** A is dead and not repairable: no pair can ever lose anything
to a rival (`rivalsTake()` sweeps only cards the pair declined), its central strategic premise was
falsified by computation, and its intellectual reveal is never produced by its own model. B is
disqualified by an interaction neither lens could see alone — the repair Sports Reality's block
requires deletes the very cards that produced B's first-place economic evidence, so B's ranking
rests on a model we are not allowed to build; and B's shipped reveal ranks desks by two composite
scalars, which is the §0 defect at the prize. C is the best document in the war, owns the best
cap-as-institution object anywhere, and its loop is FUNCTIONAL — below the bar for the first thing
a student ever plays (CLAUDE.md §5) — with a repair its own instrument cannot detect.

**The five grafts, each on a named prosecutor's finding:** (1) from C, the five lines rendered as
five different KINDS of object — a compulsion, a permission system, a price, a confiscation, a
prohibition; (2) from C, the frozen forgone receipt and THE SAME PLAYER COST EVERY DESK A DIFFERENT
THING, which works better in D because D's tie-break always awards a contested player; (3) from B,
THE SAME MOVE, TWO BOOKS as L1's intellectual reveal; (4) from B, the director voice wholesale plus
THE TWIN DESK and its falsifiable P-TWIN property, the instrument against the dead seats every
candidate shipped; (5) from A, THE POCKETS as the repair for D's degenerate over-cap tool ladder,
plus A's invented-constants header and its rule that no real person is a decision object unless the
situation is dated and sourced. A base plus five sourced grafts — not a design average.

**Three findings every candidate failed, and which therefore discriminated nothing** — carried into
the charter as obligations: the persistence property P1 is unsatisfied in all four; every candidate
ships at least one seat with no game; no candidate allocates the 55 minutes, and none produced
executable evidence that the 7–8 band faces a different economic object.

- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** CEO / lead integrator
- **Evidence:** `docs/gauntlet/module-1/rebuild/` — ECONOMIC_CONTRACT.md, DESIGN_A..D, the four
  Stage-0 prototypes in `stage0/`, ARCHITECTURE_SELECTION.md (three prosecutions, full rankings and
  blockers). All four prototypes were played in real Chromium by the lead with zero console errors.

## D49. The three questions the Module 1 selection could not settle, ruled under standing founder invariants

The architecture selection surfaced three genuine calibration questions. None is a pair of
incompatible visions, so per the founder's froth instruction they are ruled here rather than
escalated; all three are revisable on real classroom evidence.

**Q1 — how many of the five cap lines does L1 carry, at which band? RULED: all five are DRAWN in
both bands; the number that are LIVE differs.** The five-line ladder is the war's best
cap-as-institution object and is the module's title concept, so neither band loses it. But five
lines is not five decision variables: at grades 5–6, L1 makes exactly **two** lines live constraints
the student can hit — the cap (a permission system) and the first apron (a confiscation) — chosen
because they are two different KINDS of object, which is the whole point of the ladder. The other
three are drawn, labelled by what they do, and never bind in L1. At grades 7–8 all five are live.
This satisfies BC-16's ≤2-variables rule and BC-1's ladder requirement simultaneously, which the
selection record correctly says cannot both be met with five live lines at 5–6.

**Q2 — open sequential bidding at 5–6, or hidden simultaneous in both bands? RULED: hidden
simultaneous in both bands, with a 5–6 scaffold that is not a change of mechanic.** Design Rule 12
prescribes the split and rates itself LOW confidence; the dossier records that it has no source at
all. Against that, CLAUDE.md §8 names "hidden rival bid" explicitly as legitimate student-to-student
interaction, the sealed typed number is D's spine, and it earned the war's only STRONG. Forking the
mechanic by band would also break BC-17's one-reducer requirement. Grades 5–6 instead get the
scaffolding the productive-failure evidence actually demands: the shared pool's remaining supply is
visible, and each player carries a public count of how many desks are in on him — never who, and
never how much. That is a scaffold on INFORMATION, not a different game. Revisit with real
classroom evidence; running both variants at 5–6 remains the right first live comparison.

**Q3 — does the module admit its staging out loud? RULED: yes, in the module's own voice, and this
is already founder policy.** Every candidate with a player market places real people in a July 2026
free agency none of them was in. CLAUDE.md §3 and the founder's §17 already answer this: prefer real
or closely modelled facts, record what was simplified and why, and where a frozen snapshot makes a
better stable simulation, say "based on the NBA as of [date]" and freeze it deliberately. So the
student surface says so — these are real contracts real clubs really signed, on the dates shown,
gathered into one window so you can shop them — and the staging is registered in the simplifications
ledger with its misconception risk. The alternative (restricting the board to genuinely available
dated free agents) shrinks the board below BC-13's frontier requirement and costs the real
2016/2025/2026 cap-growth triple two charter items depend on.

- **Status:** ACTIVE
- **Date:** 2026-09-03
- **Owner:** CEO / lead integrator (all three revisable by the founder, and by classroom evidence)
- **Evidence:** `ARCHITECTURE_SELECTION.md` §7; `NBA_FINANCIAL_TRUTH.md` §6.4 rules 1, 6 and 12 and
  §7.11; CLAUDE.md §3, §8; founder brief §17.

## D50. Module 1 is a bounded living NBA league — the social architecture, locked by the founder

The founder ruled the whole social layer in one pass. It supersedes any conflicting agent selection,
including the "no counter" ruling in `TRADE_MECHANIC_FROTH.md` §4.

**The shape: C — hybrid economic ecosystem.** Not sixteen independent simulations with a
leaderboard, not an unrestricted NBA sandbox. L1 emphasises **competitive scarcity** ("your choice
can reduce my options"); L3 emphasises **cooperative exchange / gains from trade** ("your assets may
solve my problem while mine solve yours"). The product test: *does something another student does
meaningfully change what I can do next?*

**The fantasy is the franchise; the cap is invisible physics.** M1 is not a salary-cap simulator.
The student thinks about players, needs, talent, assets, contention, flexibility, offers, and what
other franchises are doing. Emotional loop: WANT → CHOOSE → LOSE SOMETHING → WORLD CHANGES → ADAPT →
NEGOTIATE → DEFEND.

The eleven locked rulings:

1. **Information — meaningful but incomplete.** Public: roster, broad financial position, obvious
   roster construction, broad needs, league activity, modeled market intelligence ("THREE FRANCHISES
   ACTIVE IN THE CENTER MARKET"). Never public: exact acceptance thresholds, private objectives,
   predetermined winning moves, or invented private preferences of real people presented as fact.
   Information itself becomes economically useful.
2. **Tradeable assets — same engine, different freedom.** 5–6: curated players plus draft picks
   ("the better player now, but one of my future picks"). 7–8: a richer bounded pool that may
   include contract/flexibility implications where truthfully modeled. More GM power, not harder
   arithmetic.
3. **Trade construction — guided at 5–6, freer at 7–8.** 5–6 gets a guided builder (choose franchise
   → what do you want → what will you give → see the tradeoff → send) and still authors the trade;
   three preset answers is not compliance. 7–8 constructs packages inside a bounded eligible pool.
4. **Proposal budget: ~two active outgoing proposals, one counter per negotiation.** Negotiating
   attention is itself scarce. No spam, no floods, no endless trade chats.
5. **Negotiation depth: one counter.** OFFER → ACCEPT/DECLINE/COUNTER → FINAL ACCEPT/DECLINE. This
   overturns the earlier no-counter selection.
6. **The server blocks illegality; it does not block bad strategy.** Canonical server truth owns
   ownership, validity, timing, modeled legality, availability, executability. Illegal: block and
   explain. Legal but lopsided: a bounded advisory ("UNUSUAL VALUE — far from current modeled market
   value") with SEND ANYWAY. A student may value an asset differently, knowingly overpay, or make a
   mistake; those choices are the evidence. The machine is never the authoritative GM.
7. **A completed trade is a league event.** The transaction belongs to the two franchises; the
   moment belongs to the class. The projector makes the room look up, with broadcast restraint —
   never a transaction table.
8. **`/teach` is director + commissioner, not an approvals queue.** No teacher sign-off on normal
   legal transactions. Powers: open/close trade window, final call, spotlight deal, call boardroom,
   trigger authored shock, compare strategies. More importantly it surfaces classroom intelligence
   the teacher should not have to find by hand — DISCUSSION OPPORTUNITY, MARKET COLLISION, CONTRAST.
   Software runs normality; the teacher directs meaning.
9. **L2 is a shared event with franchise-specific consequences.** Not sixteen unrelated RNG cards,
   not a reset. Your earlier strategy collides with new information; the same development lands
   differently because each franchise inherited a different position. And: a different outcome does
   not retroactively prove a different decision quality.
10. **Final evaluation is evidence, not a machine verdict.** Truthful descriptive outcomes are fine
    (roster profile, flexibility, future assets, exposure, adaptation). `DECISION QUALITY = 87/100`
    and "team 6 made the best decisions" are forbidden. The Boardroom reconstructs the student's
    actual history and makes them defend STRATEGY / ALTERNATIVE / RISK / ADAPTATION / DECISION
    QUALITY-given-what-they-knew-then.
11. **Both bands are designed from birth**, never 5–6 first with complexity bolted on. Same world,
    engine, franchise identity, consequences, and social league; different cognition.

Standing constraints restated as part of this ruling: the phone lights up only when the kid should
care; social uncertainty is bounded and real, never invented private NBA intentions; HQ is the
stage and the moving league is the product; the projector shows only what is worth looking up for
(~75% restraint, ~25% earned spectacle); "living league" does not license all 30 franchises, a full
CBA sandbox, unlimited trades, unrestricted chat, or a notification centre. Boundaries are a
feature.

- **Status:** ACTIVE — supersedes `TRADE_MECHANIC_FROTH.md` §4 on counters and on the L3 builder.
- **Date:** 2026-09-03
- **Owner:** Founder
- **Evidence:** founder ruling, this session, verbatim in the run transcript.

## D51. The board prints what a player DID, not only what he costs

A commissioned Sports Reality research pass pulled the 2025-26 box-score line for all twelve named
free agents on the L1 board from basketball-reference and raised one finding as **blocking**:

> The board's price ordering currently asserts a quality ordering that the real production
> contradicts, and the module gives students no data with which to notice.

It is true, and it is worse than it sounds. Ordered by price the bigs read Vučević → Nance →
Horford → Nurkić → Robinson. Ordered by points last season they read almost exactly backwards.
Nance costs **$100,000 more** than Vučević for 3.7 points a game against 15.1. The most expensive
card on the board scored 5.7. A ten-year-old reading price alone learns that the expensive player
is the better player, which on these twelve real contracts is false.

**Ruling: price never ships alone.** Each named card carries four numbers — points, rebounds,
assists, and the one that separates him from the next card in his role (blocks for a big, three-point
percentage for a guard or a wing) — plus **his age on the day he signed** and **the real term of the
real deal**. All six together or none: production without age and term teaches that NBA front
offices are incompetent, which is a different false lesson. The money is buying years and youth, and
with age and term on the card that becomes arguable rather than baffling. Registered as
simplifications S8 and S9.

The same two ladders go on the **projector market table**, right-aligned beside each other, because
the disagreement between them is the point and a wall is where a room can see it at once. And the
leading number goes on the **list row**, unclicked, so a student meets the inversion before opening
anything.

Consequences accepted:

- **Ten data errors were found and fixed**, including one that had been handing the Boston seat a
  Bird-rights tie-break it never had (Chicago held Simons' rights, and Chicago is not a desk in this
  room), two wrong signing dates, and two asks that were averages being charged against a cap.
  Detail and sources in `docs/gauntlet/module-1/rebuild/PLAYER_PRODUCTION_RESEARCH.md`.
- **Three unsourced scouting lines were struck** rather than kept because they sounded right.
- **Two asks stay averages and say so on the card.** Dividing a reported total by a raise ladder to
  produce a plausible first-year salary would be an invented dollar figure printed as an NBA fact.
- **Truth cost the harness something.** Removing Boston's phantom claim on Simons narrowed that
  seat's frontier: P-VEC now fails at three seat/environment pairs rather than two. The board is
  genuinely too thin — twelve named players against sixteen desks — and that is a board-depth
  problem to fix with more researched contracts, never by restoring a false one.
- A **classroom-suitability flag** was recorded and decided: Mitchell Robinson's hand injury is
  printable, its cause is not, and nothing in the module references it.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Lead, on a blocking Sports Reality finding
- **Evidence:** `docs/gauntlet/module-1/rebuild/PLAYER_PRODUCTION_RESEARCH.md`; the tripwire test
  "the price ordering on this board really is upside down" in `runtime/src/test/sameLineL1.test.ts`.

## D52. The board is seventeen contracts, because four seats had no middle

D51 said board thinness was the reason P-VEC failed, and that the repair was
more researched contracts. This is that repair. A per-seat probe of the opening
reachable sets made the shape of the problem exact rather than suspected:

| seat | reachable named players | what they cost |
|---|---:|---|
| memphis / brooklyn / boston / sacramento | 6 | three of the six are minimum-scale and all cost the same $2,449,421, so really four prices |
| new-york | 4 | $2,449,421 and $15,044,000, **and nothing in between** |
| detroit / milwaukee | 11 | healthy |
| minnesota | 7 | healthy |

Five real contracts added, every source opened first-hand on 2026-09-04 and
listed in the addendum to `FREE_AGENT_BOARD_RESEARCH.md`: **Precious Achiuwa**
(BIG, $5,477,000), **Jaxson Hayes** (BIG, $6,000,000), **Josh Okogie** (WING,
$6,000,000), **Tim Hardaway Jr.** (WING, $6,065,000) and **José Alvarado**
(GUARD, $4,439,656, New York's own on Bird rights). Twelve named contracts
became seventeen.

Three of them earn their place on truth rather than arithmetic:

- **Achiuwa played all season for Sacramento, which is a desk in this room, and
  Sacramento still could not simply keep him.** The reporting is explicit: the
  Kings held only his *Non-Bird* rights and the deal exceeded what those rights
  allow, so they had to spend their entire bi-annual exception. A club that has
  a player and cannot re-sign him with rights is the apron lesson in one line.
- **Hardaway's real first-year salary is $6,065,000 and the taxpayer mid-level
  is $6,064,000.** Four of the eight clubs in this room miss the best shooter
  available to them by one thousand dollars. Nobody invented that.
- **Alvarado is what gives New York a middle**, and he is unrestricted, so every
  other desk may bid. New York's advantage is the rights, not exclusivity.

Four candidates were rejected and the reasons are recorded, because a rejection
nobody wrote down gets re-proposed: **Landry Shamet** (Early Bird is a *capped*
tool and the module's own-player tool has no ceiling — shipping him would let a
desk offer him thirty million), **Quinten Post** (two pages of the same
publisher disagree on his salary, and he arrived on a restricted-free-agent
offer sheet the module does not model), **Ariel Hukporti** (2.2 points a game at
$3,400,000 is a dominated card — noise, not choice), and **Tarik Biberovic** (no
NBA box score to print).

One consequence in the product: the projector market table fits twelve rows of
back-row-readable type at 1366×768, and there are now seventeen players. It
shows twelve and **counts the rest out loud** under the table. A wall that
silently drops rows hides the players nobody has bid on, which on a scarcity
board are exactly the rows a teacher wants to point at.

**Amended 2026-09-04 by D53: the diagnosis in the first paragraph was wrong.**
Board thinness was real and the five contracts are worth keeping on their own
merits, but it was not why P-VEC failed. The sweep against the deeper board
still failed at three seat/environment pairs, and the actual cause turned out to
be two defects in `readingsFor`. D53 records them. This entry stands as written
because the decision log is not rewritten — but the causal claim it opens with
is superseded, and nobody should cite it as evidence that board depth fixes a
Pareto frontier.

- **Status:** ACTIVE (causal claim superseded by D53)
- **Date:** 2026-09-04
- **Owner:** Lead
- **Evidence:** the addendum to `docs/gauntlet/module-1/rebuild/FREE_AGENT_BOARD_RESEARCH.md`;
  `runtime/scripts/same-line-sweep.mjs`.


## D53. The module was computing its own named false lesson, and its flexibility reading rewarded crossing a line

Two defects in `readingsFor`, both in the five numbers the class argues from,
both confirmed first-hand against the built engine before anything was changed.
An independent economic-truth prosecution found them while being asked a
narrower question, and refuted the question's own premise on the way.

**V1 — a minimum body counted as a hole filled.** `applySigning` refuses to
close a job for a generic minimum body and says why in seventeen lines: a roster
hole and a roster spot are not the same thing, and treating them as the same
collapsed every constrained seat's frontier when it last shipped. `readingsFor`
then counted the body anyway. Measured at Boston: sign one generic body,
`openJobs` stays `[BIG, WING]` and `readings.jobsClosed` says **1**. Sign three
— $7,348,263 of bodies, zero holes actually filled — and it says **2**, topping
two of the five class readings. The projector's `rd-cheap-jobs` claim then
argued *from* that number: "the desk that closed the most holes closed two…
spending more did not buy more here." The module was manufacturing the exact
false lesson it exists to break, on the surface the room reasons from.

There were **three** job-closing definitions and they disagreed: the engine's
(generic excluded, capped), the reading's (generic included, capped), and a
third in the reveal (generic included, **uncapped** — two bigs against one open
big job read as two holes closed). There is one now, `jobClosingSignings`, and
all three call it.

**V2 — room left rose when you spent.** The reading was measured to "the next
line above where the club finished", and that reference moves when you cross it.
Measured at Boston:

| committed | ROOM LEFT printed | what the club could actually sign |
|---:|---:|---:|
| $203,623,048 | $5,391,952 | $6,064,000 |
| $209,014,999 | **$1** | $6,064,000 |
| $209,015,000 | **$12,671,000** | $6,064,000 |

One dollar of payroll multiplied the displayed figure by 12.67 million, in the
direction that rewards crossing the first apron, at the exact moment the club
loses the big exception and the small one. The label on that number is "what you
can still do", and across the whole range what the club could do never moved.

Room left is now measured to **the line the club started the window under** —
its own line, the one this lesson is named for — so it falls monotonically as
money is committed, and going past it is an outcome rather than a reset. The
value may be negative; it is **never rendered** with a minus sign. Surfaces
print `PAST IT BY $4,510,000`, and the module hands every student payload a
pre-rendered string plus a magnitude, so no client can leak a sign onto a grade
5-6 screen. Simplify the interface before simplifying the economics.

Both repairs together clear P-VEC at all eight seats in all three rival
environments. Neither alone does. That is the correction to D52: board depth was
never the binding constraint.

> **This claim is wrong, and the run that was still going when it was written
> is what disproves it. See D58.** The full eight-seat sweep finished
> 2026-09-04: eight of nine properties hold and all four mutants are caught,
> but **P-VEC still fails at `sacramento/cheap-room` — 3 distinct outcome
> vectors against a floor of 4.** Seven seats clear it in all three
> environments; one does not, in one environment. The two engine repairs in
> this decision are real and are keepers — M3 and M4 both fail as required, so
> the harness can now see the defects they fixed — but "all eight seats"
> was written before the evidence and the evidence says otherwise. The
> correction to D52 stands; this sentence does not.

Two prosecution findings were **rejected** and the reasons matter:

- Adding `contestedWon` as a sixth class-facing reading. It is identically zero
  across all 6,730 Boston plans and all 1,672 New York plans in the quiet room —
  a reading of what the room did, not what the desk did — and the founder's
  "outcome is not decision quality" bars a success number a desk tops because
  rivals happened not to bid.
- Weakening P-VEC for hard-capped seats on the grounds that an apron team really
  has no choices. It is false in this model — corrected, Boston's quiet-room
  frontier holds **eight** distinct outcomes, not three — and false about the
  league, where a club $5.4M under the first apron has five genuinely different
  postures. It would also have retired the instrument that detects four students
  spending a lesson watching.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Lead
- **Evidence:** `runtime/src/test/sameLineL1.test.ts` — "a minimum body never
  closes a hole, on any surface" and "room left never rises because you spent
  money", both mutation-checked (each fails when its defect is reintroduced into
  the built engine); `runtime/scripts/same-line-sweep.mjs` mutants M3 and M4.

## D54. The harness gets a property that is not about the frontier's shape, and mutants that can reach the readings

Both D53 defects shipped straight through an exhaustive sweep that reported
ALL PROPERTIES HOLD. That is the failure this harness exists to prevent, so the
instrument is repaired alongside the product.

Why it was blind. Every property was a property of the **Pareto frontier's
shape**, and the defects did not deform the frontier — they described a
different world than the one the desk was playing in, internally consistently.
And every poison mutant patched `world` *data*, so the poison limb could not
reach `readingsFor` at all. Half the model had no mutant that could touch it.

Three changes:

- **P-AGREE**, a consistency invariant rather than a shape property: over every
  plan at every seat, the holes-closed reading must equal the number of holes
  the position actually lost. V1 violated it on the cheapest plan available to
  every desk in the room.
- **The readings go through a swappable binding**, so a mutant can poison the
  reading layer. This is the change that makes the next V1 findable.
- **M3 `a-body-fills-a-hole`** (breaks P-AGREE) and **M4 `spending-buys-room`**
  (breaks P-VEC), each reintroducing a defect that genuinely shipped. Both are
  caught.

Also added, and explicitly **not** a gate: `--seat boston,new-york` narrows the
sweep for diagnosis. The full sweep is roughly cubic in board size and costs
30-plus minutes at twenty market entries, which is fine for a gate and useless
for chasing one seat's frontier. A filtered run prints `PARTIAL` on its verdict
line and says it is not a gate result, because a partial pasted into a document
is otherwise indistinguishable from a pass.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Lead
- **Evidence:** `runtime/scripts/same-line-sweep.mjs` — the poison limb prints
  each mutant and the property it was required to break.

## D55. The board prints what a veteran-minimum deal actually charges

Found on a projector screenshot, not by any assertion. The board told the room
"Nikola Vučević — HE IS ASKING $3,900,000"; four minutes later the reveal
printed "Nikola Vučević · Sacramento · $2,449,421". Nothing on any of the three
surfaces connected them.

Both figures are correct and the gap is real NBA law, not a simplification: a
veteran-minimum contract pays the player his full service-based minimum while
charging the club only the two-year-veteran amount, with the league reimbursing
the difference. It is the reason no club in this room is ever completely stuck —
which makes it one of the better facts in the lesson, and it was being delivered
as an unexplained contradiction. The only inference available to a ten-year-old
is that a desk talked him down or that the board lied, and the second costs you
every other number in the lesson.

Now said in three places, and **only where it applies**: on the composer's ask
line when the minimum is the selected tool, in the wire the moment the deal
settles, and on the projector beside any signing that landed on the charge. The
gating is not incidental — shipped ungated for one build, the note printed "only
$2,449,421 of that counts against your money" directly above a $4,300,000 offer
made with the small exception. Two contradictory numbers a hand's width apart is
worse than the silence it was written to fix.

Two smaller repairs shipped alongside, both found the same way:

- **Every card in the 5-6 band claimed the chosen tool was the only way to pay
  the player.** The composer branched on whether tool BUTTONS were rendered, and
  5-6 renders none by design, so "It is the only way you have that reaches him"
  printed under cards where the desk had four legal tools. The module now sends
  the real count to both bands and the copy is derived from it.
- **The `/teach` surface had never been screenshotted** in this lesson's browser
  run, the same blind spot that let the projector ship with its stylesheet
  unlinked. Two frames are now captured every run, guarded by a computed-style
  check that an unstyled console cannot pass.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Lead
- **Evidence:** `runtime/src/test/sameLineL1.test.ts` — "a veteran-minimum
  signing never prints a number the room cannot explain" (mutation-checked) and
  "a card never tells a desk it has one way to pay when it has four", which
  checks the count against the engine rather than against itself;
  `runtime/scripts/e2e-same-line-l1.cjs` asserts the note rendered on the desk
  whose only route is the minimum and absent on the desk paying full freight.

## D56. The lesson gets the stage it was missing: the naming

CLAUDE.md §1 ends the loop on **explicit economics formalization** and calls
that stage essential — "the simulation does not replace economics instruction,
it makes it understandable." An economic-truth prosecution went looking for the
map from the five class readings to named economic concepts and reported it
could not verify the map because **there was no map**. `SYNTHESIS` shipped the
readings, the forgone list, and a placeholder string reading "Look up — this
part is the whole room's." The words *scarcity* and *opportunity cost* appeared
nowhere in the product.

So the room had an afternoon and not a lesson. This is the stage.

**The name is earned, never asserted.** Every naming opens with what THIS room
did, in this room's own numbers, computed from live state — and a concept whose
evidence the room did not produce is **not shown at all**. A quiet window with
no contested signing gets no COMPETITION SETS PRICE frame. A naming with an
invented moment would be worse than no naming: it teaches the concept and
teaches that the numbers on the wall are decoration.

What that looks like on the wall, from a real eight-desk run:

> **WHAT HAPPENED HERE** — Minnesota signed Jaxson Hayes. The same moment it
> did, 10 other players went out of its reach: Trendon Watford, Nikola Vučević,
> Gary Payton II, Larry Nance Jr., Anfernee Simons, Jonathan Kuminga, and 4
> more. Nobody took them away. No rival outbid it for them. Its own signing did
> that.
>
> **OPPORTUNITY COST**
>
> **OUTSIDE BASKETBALL** — The hour you spent on this lesson is an hour you did
> not spend on anything else, and that hour is the real price of it.

**The band decides the list.** 5-6 gets exactly two — scarcity and opportunity
cost — and only here. 7-8 gets those plus the two that need them to stand on:
*an institution* (the lines are a rule thirty clubs and a union agreed on, not a
law of nature) and *competition sets price* (he never raised his price; the
other desks in the room raised it). Both bands' lists are pinned by test.

**Three surfaces, three jobs.** The wall carries the concept and the
generalisation, and is structurally never handed a seat identity. The pair's own
screen carries **their** case of it — their forgone list by name, their hole
never filled, their own wall — because "opportunity cost" is a phrase and
"signing Kelly Oubre Jr. is what put Mitchell Robinson out of your reach" is
something that happened to you. Reading order on both is moment, then case, then
the term: a pair that meets the word first stops reading.

**The console leads with the question, and says what not to say.** The hard part
of a naming is the order — a teacher who says "opportunity cost" before a
student has said the idea has turned the best moment of the hour into
vocabulary. So `/teach` prints ASK FIRST, then LISTEN FOR (what a right answer
sounds like when a twelve-year-old says it badly), then NOT YET in red, and only
then the term. No timer: the teacher advances one concept at a time and the
control names how many are left.

Teacher-paced with the same beat control as the reveal, which meant the control
had to learn a third phase — it was REVEAL-only, so a teacher reaching the
naming could not move it. Every concept is a projector frame that fits, clears
the back-row type floor, and carries no student name.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Lead
- **Evidence:** `runtime/src/test/sameLineL1.test.ts` — "the naming is earned
  from the room's own numbers, and both bands get their list" and "a naming is
  never shown for something the room did not do";
  `runtime/scripts/e2e-same-line-l1.cjs` walks every earned concept on the wall
  in both bands and screenshots each;
  `docs/gauntlet/module-1/rebuild/screens-l1/*-board-naming*.png`.

## D57. The pair could commit an amount they had never seen

**Found by looking at the screen, not by a test.** Every assertion in the suite
was green — 705 unit tests, a two-band browser e2e that explicitly checks
"PUT THE OFFER IN is not below the fold" at 1024×600 and 1366×768 — and the
product was still broken at the resolution `PLATFORM_REALITY.md` §34 names as
first contact.

Measured at 1024×600 on the committed build:

- The player card was clamped to the viewport (`max-height: calc(100vh − band
  − 44px)` = 447px) with its contents in a nested `overflow-y: auto` scroller.
- The composer inside that scroller was **661px tall**. The pair saw **125px of
  it**: the ask line and one payment tool.
- `PUT THE OFFER IN` was `position: sticky` — transparent to layout — so it
  floated across the bottom, over whatever text was beneath it.
- The price (`$4,300,000`), the dial that sets it, and the total were at
  y752, y873 and y863, in a 600px viewport.

So the loudest control on a student's screen committed a number that was not on
that screen. That is not a decision; it is a dare. It also breaks the founder's
third emotional beat — *"signing him changes what else I can do"* — which
cannot land on a figure the pair never saw.

**The repair.** The three things the pair is deciding leave the scroller and
become the card's floor:

1. `offerMath(card)` extracts the arithmetic once, so the bar and the composer
   can never disagree about what is being offered.
2. `offerBar(card)` renders the money, the dial and the button as a sibling of
   the card body, `position: sticky; bottom: 0`.
3. The nested scroller is gone. The card is the height it needs and the **page**
   scrolls, once. `.sl-card-scroll` is renamed `.sl-card-body` because it no
   longer scrolls.
4. `.sl-card` lost `overflow: hidden`. Clipping makes an element the sticky
   containing block for its subtree, so with it the bar silently stopped
   pinning — the corners are now rounded by the two children that touch them.
5. The bar's background is two layers over an **opaque** base; a single
   translucent gradient let THE RISK and the payment tools read straight
   through the money. A 22px fade above it says "there is more up there"
   rather than leaving a sentence that looks broken.

**Two smaller repairs found in the same pass:**

- **The dial's total used the tool's default term, not the pair's.** The input
  handler read `num(chosen["years"], 1)` while the composer rendered
  `term ?? maxYears`. A 7-8 desk that set four years on a two-year tool and
  then dragged the money watched the total silently revert to the two-year
  figure — a wrong number, on the decision surface, only while they were
  moving it. Both now read `offerMath`.
- **The rejoin PIN covered the lesson.** The expanded card is fixed at
  x74–374 y468–586 at 1024×600, squarely over the forgone panel — the one
  place on the screen that says what a signing cost. It auto-collapsed on a
  20-second timer, which is right for a pair who joins in the lobby and wrong
  for one who joins late. It now collapses on the first frame of any phase past
  LOBBY, and the reopen chip is parked inside the rail at every width (measured
  at 1366×768 it had been printing across "$2,180,704 of cap room").

**Evidence.** `runtime/scripts/e2e-same-line-l1.cjs` —
`assertDecisionAboveFold` now checks the amount, the dial and the total, not
only the button; mutation-checked by putting the money and dial back inside the
composer, which fails with *"the dial sits at 576-602 in a 600px viewport"*.
705 unit tests pass; the e2e passes both bands. Screens:
`docs/gauntlet/module-1/rebuild/screens-l1/*-play-composer-1024.png`.

**Recorded, not repaired.** At 1024×600 the three-column shell leaves the board
309px, so its name column is ~54px and most real NBA names wrap to two or three
lines ("Gary Payton II" takes three). Every number is present and legible; the
rhythm is poor. Fixing it means either dropping the cap sheet below the fold —
which removes the money panel and makes things worse — or reflowing that panel
into a horizontal strip, which is a design change, not a tweak. Left as a known
gap rather than half-solved.

## D58. The gate failed: Sacramento cannot close a hole, and one pair could sit clubless unseen

Two findings from the same pass. The first is a **gate failure**; the second is
a teacher-transfer defect found while waiting for it.

### D58.1 — `sacramento/cheap-room` is a dead seat

The full eight-seat sweep finished 2026-09-04. **Eight of nine properties hold
and all four mutants are caught** — M3 and M4, added in D54 precisely because
the harness could not previously see the two defects D53 fixed, both fail as
required. But:

```
FAIL P-VEC — sacramento/cheap-room: frontier holds 3 distinct outcome vectors
VERDICT: 1 PROPERTIES FAILED
```

D53's written claim that the two engine repairs "clear P-VEC at all eight seats
in all three rival environments" was made while that run was still going. It is
wrong, and D53 now carries the correction inline. The repairs are keepers; the
claim was not evidence.

**Why it fails, from `--seat sacramento --verbose` (10,852 plans, 5,695
Pareto-optimal rows, three distinct vectors).**

| plan | holes closed | job-years | cheapest hole closed | longest | room left |
|---|---|---|---|---|---|
| sign nobody | 0 | 0 | — | 0 | $6,155,628 |
| one minimum body | 0 | 0 | — | 1 | $3,706,207 |
| close one hole | **1** | 4 | $3,150,000 | 4 | $3,005,628 |

*(An earlier draft of this decision read "every plan on Sacramento's frontier
reads `jobsClosed: 0`". That was generalised from the first twelve rows of the
dump before the whole frontier was counted, and it is wrong — the third vector
closes a hole. Corrected here rather than quietly: the same discipline this
decision applies to D53 applies to itself.)*

Sacramento is **not priced out of the board.** It sits $6,155,628 under the
first apron and can legally reach eleven of the seventeen named players,
including four wings and five bigs — its own two open jobs. It closes a hole
in plenty of plans; it wins Watford at $3,150,000 by out-bidding the
cheap-room rival's $2,900,000 by one bid step.

What it can never do is **close both holes**, and that is arithmetic, not a
bug: the cheapest wing asks $2,900,000 and the cheapest big asks $3,900,000,
so any pair of real signings costs at least $6,800,000 against $6,155,628 of
room. Every two-hole plan is illegal at this seat.

That collapses the frontier to three points, because the class-facing readings
cannot tell *which* hole a desk closed — only how many, how cheaply, and for
how long. Filling the wing and filling the big are genuinely different
decisions that produce the same vector shape, and the cheaper one dominates.
So a pair here is choosing between "nothing", "a body who fills nothing", and
"one hole, at a price" — real, but one short of the floor BC-13 sets for a seat
to carry a decision worth arguing about.

**Not yet repaired, and two of the three obvious repairs are wrong:**

- Changing Sacramento's committed figure or dead money — it is cited
  (`salaryswish.com/teams/kings`, 2026-09-03) and the founder's rule is do not
  invent numbers to save mechanics.
- Moving its open jobs — no pair of real players on this board fits inside
  $6,155,628 at any position, so which two holes it has changes nothing.
- Calling it "the real NBA is like that" — true of a club up against a hard
  line, and still a seat one vector short of the bar.

**What is actually going on, verified against the built engine.** Two holes are
not merely legal at this seat — they are *comfortably* legal, and the thing
that makes them legal is the veteran-minimum charge D55 modelled:

```
sign Watford  on a minimum deal — charged $2,449,421 -> committed $205,308,793, jobs left [BIG]
sign Vucevic  on a minimum deal — charged $2,449,421 -> committed $207,758,214, jobs left []
                                   both holes closed, $1,256,786 still under the apron
```

Sacramento's two-hole plan costs it $4,898,842 of cap charge against
$6,155,628 of room, because both players' real 2026 deals were veteran
minimums and the league pays the difference. It fails in cheap-room for one
reason: **a rival bidding the ask ($2,900,000, $3,900,000) beats a $2,449,421
minimum offer, and out-bidding forfeits the subsidy that made the second
signing affordable.** Sacramento can win either player at $3,150,000 through
the big exception — and the moment it does, the other hole is out of reach.

That is not a bug. It is the sharpest piece of economics in the module: the
cheapest way to fill two holes only works while nobody else wants those
players, and the price of winning a contest is the mechanism that made your
plan work. The defect is that the class-facing readings cannot see it — they
count holes, years, price and room, so "won the wing at a price" and "won the
big at a price" are the same vector, and the seat reports three outcomes where
a pair experiences several.

**Three admissible repairs, none taken yet:**

1. **Widen the cheap end with sourced players.** A big asking at or under
   $3,255,628 makes the two-hole plan winnable outright. But
   `FREE_AGENT_BOARD_RESEARCH.md`'s twenty-seven sourced signings hold **no big
   under $3,900,000** — Vučević is the floor — so this needs new research with
   real sources, not a number chosen to clear a property. (The table does hold
   one high-confidence player not on the board: **LeBron James**, WING,
   2 yr / $7,946,884, AAV $3,973,442, year 1 $3,876,529, a veteran minimum with
   a 5% raise. That widens the wing end and would not, on its own, fix this
   seat.)
2. **Soften the rival model.** Rejected on sight: weakening the adversary to
   pass a property is how a harness stops being evidence.
3. **Restate P-VEC to its intent**, as P-HOLD was already restated in this
   harness when a literal reading became impossible to satisfy honestly. That
   is only admissible with a falsifier at least as strong as the current one,
   and with M1-M4 still failing. It is a real option, not an escape hatch, and
   it needs its own argument.

Left open deliberately. Forcing a fix today would mean inventing a contract or
blunting the adversary, and both are worse than a recorded failing gate.

**A filtered sweep is still not a gate result.** The Sacramento-only run
reports `POISON: at least one mutant went unnoticed` — correctly, because a
single-seat sweep cannot reach every mutant, and `P-TWIN … between 0` because
there is no second club to vary. Both are artefacts of `--seat`, already
documented, and neither weakens the full run's verdict.

### D58.2 — a pair with no club was invisible to the teacher

The module holds `CLUBS.length * 2` = **16 desks**. A pair joining after that
lands as an observer with an honest screen ("EVERY CLUB IS TAKEN … there is
none left to hand you without changing numbers this room has already seen").
That refusal is right: inventing a seventeenth franchise would duplicate a
position and quietly change numbers the room has already seen.

The silence was wrong. `state.observers` was module state **no view exposed**,
so a teacher who split thirty-four students into seventeen pairs had one pair
behind a dead screen for the whole of PLAY with nothing on the console to say
so — the teacher's eyesight was the only detector. Under CLAUDE.md §4 and
D50 §8 that is the console's job.

`intelligence()` now emits a `watch` item naming the count and the room's
capacity, with the instruction: sit them with a desk that has one, or give them
the room's job — pick a club to shadow, predict its next move out loud, check
yourself when the day closes.

**Recorded, not claimed:** the observer screen itself has still never been
reviewed against the MAGNETIC/STRONG bar. It is honest and it is short; whether
fifteen minutes behind it is acceptable is a question for the player-gameplay
review, not something this decision settles.

**Evidence.** Full sweep output above, reproducible with
`node scripts/same-line-sweep.mjs`; `--seat sacramento --verbose` for the
frontier dump. `runtime/src/test/sameLineL1.test.ts` — "a pair with no club is
on the teacher's console, not only on its own dead screen". 706 unit tests and
the two-band browser e2e pass, run 2026-09-04.

## D59. The October 1 recharter — founder amendments of 2026-09-04, reconciled against the repo as it stands

The founder's master run instruction of 2026-09-04 ("BOW_FABLE_5_1_MASTER_RUN_PROMPT")
issued a set of rulings that outrank every earlier decision here and every section of the
attached Bible compilation. This decision records each ruling, what it supersedes in this
log, and what the repo actually held at HEAD `671b288` when it arrived — so the next
context executes the amended product and not the old one. Nothing below is deleted from
history; superseded decisions stay in place with this pointer.

**The student's sentence is "I ran an NBA franchise."** Authority progression RUN THE
TEAM → RUN THE BUSINESS → RUN THE LEAGUE. Teaching progression WORLD → DECISION →
CONSEQUENCE → ADAPTATION → CLASS EVIDENCE → ARGUMENT → EXPLICIT ECONOMICS, then retrieval.

### The rulings, and what each supersedes

1. **ONE STUDENT = ONE FRANCHISE, both bands.** Twelve to sixteen students are twelve to
   sixteen independently controlled franchises. Advice and collaboration never transfer
   ownership; co-GM is an optional accommodation. *Supersedes* the pairs-on-one-device
   default in CLAUDE.md §11 and every "pair" in D20–D58 copy. *Repo truth:* every built
   module is already one runtime seat = one desk (`fullHouse.ts:784`, `hostTheLeague.ts:557`,
   `writeTheRule.ts:542`, `sameLine/l1.ts:139-149`); "pair" is copy, not mechanics. The one
   place club IDENTITY is shared is THE SAME LINE's twin desk (two desks per club, D48
   graft 4, BC-14). Ruled here: **a twin is two franchises that started from the same real
   club's books on the same date, run independently from that day on.** They are labelled
   so on every surface, they never transact with each other by any route, and no incumbent
   NBA player is ever a trade object in Track 101 — only contracts the room itself signed
   (unique by construction: `taken` is room-wide) and each franchise's own draft picks
   (`$0` salary, labelled by franchise). That keeps the asset ledger honest without
   sourcing sixteen unique clubs before October 1. Moving to unique clubs stays open:
   `FRANCHISE_STATES.md` §1–§2 sources twelve usable real seats; a room that exceeds the
   sourced count would still twin.
2. **ALL SIX WEEKS FOR BOTH BANDS by October 1.** *Supersedes* the D22 program sequence
   (5–6 first, then 7–8 adapted) and the Bible §37 note "not a second band across all six
   weeks before the first band is premium." Every wave designs both bands; the 7–8 lens is
   mandatory on every substantial week.
3. **WEEK 2 = CHANGED CONDITIONS AND ADAPTATION; WEEK 3 = THE ONLINE TRADE DEADLINE WAR
   ROOM + FRONT OFFICE REVIEW.** *Supersedes* D17/D18's chronology (trade deadline as L2,
   free agency as L3) and the Bible §4 map wherever it keeps that order. *Repo truth:* the
   Module 1 rebuild (D48) already designed this order — `ARC_DESIGN.md` Act 1 THE OFFSEASON
   (built: `m1l1-the-window`), Act 2 THE SEASON CHANGES (not built), Act 3 THE DEADLINE then
   THE BOARDROOM (not built). The first M1 chain (`m1l1-draft-day`, `m1l2-trade-deadline`,
   `m1l3-free-agency`) is therefore **retired from the live picker** in this decision, the
   D20 way: deregistered in `server/index.ts`, files and tests kept as history, e2e scripts
   left in place and no longer part of any claim. Its three recorded defects — the
   arrival-time sealed-bid tie-break (`freeAgency.ts:850`, `tradeDeadline.ts:791`), the
   no-release claim path (`tradeDeadline.ts:898`), the `faPlayMounted` composer race — leave
   the product with it and are not reproduced in THE SAME LINE (in-model tie-break
   `engine.ts:824-852`; no claim step; own renderer). `TRACK_101_MAP.md` and
   `RAMAZ_READINESS.md` rows for the old chain are struck to "superseded".
4. **WEEK 6 HAS MULTIPLE CONSEQUENTIAL INSTITUTIONAL DECISIONS, both bands.** One slider,
   one poll, or two cosmetic controls do not satisfy it. *Repo truth:* `writeTheRule.ts`
   holds one negotiated decision (share 0–60%) with the reinvestment condition as a boolean
   rider on the same ballot (`:461`, `:3916-3932`); the condition's floor (15%) and dock
   (half) are authored constants (`:293-294`). The starting point for the second decision
   is to make that condition's terms a negotiated institution of its own, with its own
   stakes, threshold and lived consequence — investigated first, before any new engine.
5. **A SHARING RULE MAY RATIONALLY HURT SOME FRANCHISES.** *Supersedes* any reading of
   D20/GATE_L3 that the summit must be "sharing pays the payer." The Bible §36.5 finding
   (big markets' own best share is 0% at league equilibrium) is a lesson, not a bug: the
   conflict is preserved and taught, and the constants are never retuned to manufacture
   unanimity.
6. **EXPERIENCE FIRST, THEN EXPLICIT NAMING, NON-EXAMPLES AND LATER RETRIEVAL.** No
   permanent vocabulary ban; prior named concepts return. D56's naming stage is the model.
7. **SIXTY MINUTES, PROTECTED ENDING.** *Supersedes* the 90-minute finale wherever the
   Bible §16 assumes it. Phase budgets total 60 including transitions, naming and transfer;
   a compressed path always keeps a choice, a consequence, an argument, the economics and a
   transfer.
8. **HONEST DOLLARS.** Internal dollars are never presented as NBA dollars without a
   visible translation. *Repo truth:* THE SAME LINE runs at real 2026–27 scale (cap
   $164,961,000; `world.ts` LINES) with a stated payroll definition (BC-7); Module 2 runs
   modeled per-night dollars at real capacity (`fullHouse.ts:2389-2392`). The Week 3→4 seam
   is therefore a UNITS seam and is designed as one (D60 when built), never a silent
   rescale. Grades 7–8 receive substantially more real-contract context, not longer copy.
9. **BUILDERS NEVER CERTIFY THEIR OWN SIGNIFICANT WORK; fresh critics where consequential,
   not for every button.** Unchanged from CLAUDE.md §5; restated because the Bible's prior
   master prompt over-specified councils.

### The six-week mapping this decision selects

| Week | Student name | Module | Anchor economics | Status at 671b288 |
|---|---|---|---|---|
| 1 | THE WINDOW — the offseason | `m1l1-the-window` | scarcity, opportunity cost (7–8 adds institution, competition sets price) | built; sweep gate open at `sacramento/cheap-room` (D58) |
| 2 | THE SEASON — the contract is fixed, the value is not | `m1l2-the-season` (new, Act 2 of `ARC_DESIGN.md`) | revision cost vs sunk cost; decision quality vs outcome; first Press Conference + Tape | not built |
| 3 | THE DEADLINE — the war room, then the boardroom | `m1l3-the-deadline` (new, Act 3) | gains from trade, market pricing under salary matching, scarce attention; Front Office Review | not built |
| 4 | THE BILL COMES DUE | `m2l1-full-house` extended with an M1 seed | revenue and cost coverage over one stated horizon; two books | built without any carry or payroll (`fullHouse.ts:2909`) |
| 5 | YOU DON'T PLAY ALONE — the pool | `m2l2-host-league` extended with a W4 seed and a binding in-session distribution | externality (visitor draw), shared resource, unequal contribution | built; no seed by earlier decision (`hostTheLeague.ts:3205`); pool lives only in W6 today |
| 6 | THE BOARD OF GOVERNORS | `m2l3-write-rule` extended to two negotiated institutions | institutions and incentives; decision vs outcome capstone | built with one decision |

Market-price learning now lives in Week 1 (hidden simultaneous offers, demand-moved asks,
interest counts) and Week 3 (what a contract fetches in a room of sixteen valuations).

### What is KEPT, EXTENDED, REPLACED

- KEEP: the `LessonModule` contract; THE SAME LINE world, engine, sweep and naming stage;
  Full House's blind commitment, GATE CALL, two books, repeat-night path dependence; Host
  the League's Draw and DEALT vs BY-CHOICE; Writing the Rule's sealed vote, not-adopted
  arm, counterfactual and Kings capstone; the runtime's TIME CUT, rejoin, quarantine,
  presence and push/refetch.
- EXTEND: L1 gains franchise choice and a seed export; Full House gains an M1 seed and the
  bill; Host the League gains a W4 seed and the pool ritual; Writing the Rule gains the
  second institution; `/teach` gains a director for Module 1; the runtime gains a
  server-honest pause for the Press Conference.
- REPLACE: the first M1 chain (retired); "pair" as the unit of the room (copy sweep, module
  by module, as each is touched — never a blind global rename).

### Not claimed

No image-to-product comparison was possible: the five founder mockups arrived as images
in the run prompt and were read; the Bible's "docs/design" directory does not exist in the
repo and no repository copy of `BOW_ECONOMICS_PRODUCT_BIBLE.md`, `BOW_FABLE_GAP_MAP.md`,
`BOW_FABLE_BUILD_PLAN.md`, `BOW_FABLE_ACCEPTANCE_MATRIX.md` or `BOW_VISUAL_NORTH_STARS.md`
exists — the uploaded PDF (`Bow Sports Capital Economics Bible.pdf`, 302 pages) is the
only copy, and its §36 "current implementation truth" predates the M1 rebuild (it is
grounded at `eadc041`). This log, not the PDF, is the canonical decision record; the PDF
is consulted by section.

- **Status:** ACTIVE
- **Date:** 2026-09-04
- **Owner:** Founder (rulings 1–9, verbatim in the run instruction); lead (the mapping,
  the retirement, and the twin ruling under ruling 1 — revisable by the founder)
- **Evidence:** `npm test` 706/706 at 671b288 before any change this session;
  `npm run boss:doctor` PASS; three read-only reconnaissance reports this session (M1
  seats/arc, M2 carry/institutions, runtime/client extension points) — findings cited
  inline above by file:line.

## D60. Four specs landed with integrator rulings; the campaign fans out across builders

Four implementation specs were written 2026-09-04 from experience-director deliveries and
carry provisional integrator rulings in their headers, each for the founder to confirm or
overturn. Recorded here so the rulings are decisions, not spec footnotes.

- `docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md` — the typed reasoning line is
  teacher-only; **stretch is dropped from Week 2** (a waive leaves this season's cap hit and
  tax salary unchanged and carries as dead money; misconception risk recorded: "a waived
  player is free next year" — Week 4's bill names the dead money); job reports are authored
  per player, deterministic; a dealt-July desk may podium for its own February, never July;
  the 90-second Front Office Review lives in Week 3.
- `docs/gauntlet/module-1/rebuild/W3_THE_DEADLINE_SPEC.md` — **the build proceeds while
  the sweep problem (TRADE_MECHANIC_FROTH §6.1) is open**: Week 3 ships on a conditional
  property over a DECLARED family of modelled market environments, printed with every
  sweep result ("proven for these environments, argued beyond them"); the director's
  dissent is recorded, not absorbed. Collusion between friends is live economics with no
  pair-transacts-twice rule; two market hours; the season settles before the Boardroom;
  the Clippers cap-circumvention material stays out of Track 101.
- `docs/gauntlet/module-2/W4_THE_BILL_DIRECTION.md` — the roster earns nothing at the gate
  until a renewals term exists and the HOOK says so out loud; the counterfactual is cut to
  one page; `clearedTheBill` becomes per-own-bill coverage (a bar at 5-6, a percent at 7-8);
  Week 1 is untouched; a destination strip shows only sourced destinations.
- `docs/gauntlet/module-2/W5_W6_SPEC.md` — one active franchise, one vote (no weighting);
  **institution 2 is THE FLOOR** because it hurts the opposite coalition from THE SHARE;
  two institutions, both bands; the Week 5 levy sits below the plausible Week 6 outcome
  ("$2 of every $10" working value, tuning sweep before ship); a collective rule is never
  softened for the franchise it breaks.

**Carry record, final.** `CarriedFranchise` carries `committed` (cap hit), `deadMoney`,
`holds`, `unattributed` and `taxSalary`; the provisional `holdsVerified` flag is gone
because Sports Reality sourced all eight tax-salary figures (`W4_BILL_RESEARCH.md` §8).
Every later week charges cash on `taxSalary` and shows position from `committed`.

**Operating model (founder call, 2026-09-04).** The single-builder pace was rejected by
the founder as incompatible with the scope. Fable orchestrates, integrates and judges;
opus experience-director agents write specs; sonnet builders build under strict file
ownership, many in parallel; Sports Reality and critic passes run as their own agents.
Builders never certify their own work; the orchestrator runs the suite and the browser.

- **Status:** ACTIVE (rulings provisional until the founder confirms)
- **Date:** 2026-09-04
- **Owner:** lead-integrator (rulings), founder (operating model)
- **Evidence:** the four spec files above; `runtime/src/modules/sameLine/carry.ts`;
  `runtime/src/test/sameLineCarry.test.ts` (every club reconciles: residual ≥ 0, < $6M).

## D61. Economic Truth review of W3 / W5 / W6 before the reducers landed — rulings adopted

An independent Economic Truth pass (opus, 2026-09-04, computed against the compiled
modules; scripts in session scratch) rated `W3_THE_DEADLINE_SPEC.md` and `W5_W6_SPEC.md`
FALSE LESSON as written. The builders were stopped and redirected before the composer,
the floor ballot and the pool ritual landed. Adopted:

- **W3 R1 replaced by the room-absorption rule.** "Incoming ≤ outgoing" on both sides
  makes only exactly-equal-salary trades legal (14 distinct salaries on the board; the
  market clears nothing; R2–R4 and the seed-out become dead code; the spec's own
  consequence chapter describes trades §3 forbids). Now: OUT bar = salary sent + cap room
  remaining after the trade; legal iff incoming ≤ OUT bar. A desk ending over the cap
  matches 100%; a desk with room absorbs. Simplification recorded: real below-apron clubs
  get 125% / 200% bands — misconception risk "cap room is worthless in a trade" is the
  one avoided, "every trade must be even" the one still carried into the debrief.
- **Picks carry an in-lesson cost**: the settle prints "open again next season" from
  `yearsRemaining`, so a rental bought with a pick reopens the hole; `picksOwed` still
  carries to Week 4 as OWED.
- **The sweep declares its family** (desk count ∈ {12,16}; surplus-role distribution;
  prices from the real BOARD; inbox concentration spread / one-hub) and names four
  non-covered environments (one-hub, no-inventory, price-degenerate, friends bloc).
  The critic's dissent from D60's "build proceeds" is recorded: R1, not the sweep, was
  the blocker.
- 5–6 may withdraw its single live accept before the hour closes (no speed premium);
  the inbox cap is rationing, never "attention priced"; blocked reaches aggregate to
  one board integer; twin copy: "same books on day one — different rooms answered them".
- **W6 THE FLOOR is a flat dollar line per week** ($300,000 working value; 7–8 chooses
  among three lines), not a percent of own revenue: the percent form binds the same
  big-market coalition as the share (Lakers, Boston, Philadelphia) and does not invert;
  the flat line binds seven small markets and matches the real absolute floor
  ($148,465,000 = 90% of the cap, identical for every club). `adopted.condition` is
  repointed at the floor ballot so the second vote is never cosmetic. Tuning sweep
  before ship.
- **W5 ritual rebuilt around what the model produces**: "the bars IN are different; the
  bars OUT are the same." No scripted chip counts, no "big pays / small takes" (Miami is
  a net receiver; Draw, not market size, sets the optimum). THE FREE RIDE is defined on
  reinvest, never on pool contributions. The Week 5 levy uses Week 6's base
  (`gate + localMedia`) so the room's own rule is a true escalation. "Reinvest zero" is
  verified non-dominant at 20% and 50% levies — the spec's NOT VERIFIED line is closed.
- **Owed**: W5 has no synthesis chains and W6 has format only (R-10) — being drafted;
  W3's GAINS FROM TRADE and SUBJECTIVE VALUE chains need real examples that fit (R-7);
  the missing simplification ledger entries (R-9).

- **Status:** ACTIVE (provisional for the founder)
- **Date:** 2026-09-04
- **Owner:** lead-integrator; Economic Truth critic (findings)
- **Evidence:** critic report in session transcript; computations against
  `runtime/dist/modules/{hostTheLeague,writeTheRule}.js` shipped constants.

## D62. A collective rule must be obeyable; W5/W6 chain repairs; R-7 examples adopted

Fresh-context Economic Truth review of the W5/W6 synthesis chains
(`docs/gauntlet/module-2/W5_W6_ECON_TRUTH_REVIEW.md`, formal dissent recorded) and the
Sports Reality R-7 pass (`docs/gauntlet/module-1/rebuild/W3_R7_REAL_EXAMPLES.md`). Adopted:

- **A collective rule must be obeyable.** No adopted institution in Track 101 may impose an
  obligation a franchise cannot discharge at any legal setting from any reachable state. D59
  ruling 5 permits a rule that rationally hurts a franchise; it does not permit a rule no action
  can satisfy — that converts an incentive into a lump-sum penalty on being small and teaches
  the opposite of the term it is named for. Every institution ships with a printed feasibility
  sweep: per adopted level, who is bound, at what cost, and who cannot comply. Recorded against
  THE FLOOR at $300,000/week, measured infeasible at the 40% dial for Memphis, Milwaukee,
  Indiana, Denver and New Orleans; the $300,000 working value is withdrawn and the sweep sets
  the working value and the three 7–8 lines. The units defect (percent dial compared to a
  dollar line — the floor never moved a dollar) is repaired in the same wave.
- **W6 INCENTIVE chain is killed as written** and re-derived only after the sweep. W6
  FREE RIDING loses the luxury-tax example (that is THE FLOOR's logic, not free riding); W5
  SHARED RESOURCE says plainly that the real pot is not split evenly (confidential formula) and
  the equal split is a recorded simplification; W5 SPILLOVER pairs THE VISITOR LINE with THE
  ROAD LINE (what your own Draw put on someone else's books) — the received line alone is a
  gift, not a spillover; W6 EXTERNALITY stops claiming a free 5–6 slot; W6 INSTITUTION adds
  "under the league's own threshold, not ours". 5–6 pool surfaces print reinvest in dollars,
  never the percent dial.
- **R-13 (provisional for the founder):** EXTERNALITY is named at 7–8 in Week 5, where the
  experience is; "spillover" is the plain-word gloss inside that chain, not a second 7–8 term.
  At 5–6 the two-step stays: spillover (W5) → externality (W6).
- **R-14 (provisional for the founder):** W5 INCENTIVE's class number is the computed no-bowl
  counterfactual (the same three weeks with no levy), exposed as a teacher press at 7–8 — an
  exception to the spec's `showsCounterfactual=false` at 7–8 — rather than a "before" week the
  room never played.
- **R-7 adopted:** the Boston–Chicago Simons/Vučević swap (2026-02-05) carries GAINS FROM
  TRADE and the Denver–Brooklyn Porter/Johnson-plus-2032-first (2025-07-08) carries SUBJECTIVE
  VALUE, replacing two examples that did not instantiate their terms. The naming shape gains a
  `real` line (L3 first; L1/L2 back-fill owed) so the dated fact is never improvised aloud. The
  spec's R1 text is updated to the D61 room-absorption rule the code already implements.

- **Status:** ACTIVE (provisional for the founder on R-13 and R-14)
- **Date:** 2026-09-04
