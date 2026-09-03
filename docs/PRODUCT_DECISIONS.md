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
