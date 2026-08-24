# BOW Model V5 — Architecture + Future Strategy Extraction

Source: `BOW_Model_V5_Final.pdf` (120 pages, "Final canonical model," dated August 20, 2026). All citations are page numbers in that PDF. This document extracts only what bears on runtime/session architecture and on protecting future optionality; it does not restate V5's curriculum, pricing, or business-model detail except where needed to bound scope.

## 1. How V5 frames itself (context for everything below)

V5 separates three statement types — **DECISION** (adopt now), **WORKING SPEC** (build/test at Ramaz, details may change), **HYPOTHESIS** (do not scale until a named trigger is met) — so architecture and pedagogy aren't confused with aspiration (p.2). The recommended model is "Model E": a small shared **BOW Core** (identity, canon, class/session primitives, privacy rules, event envelope) plus **distinct product-specific runtimes**, bridged only where a bridge earns its keep (p.8–9, p.65): "Do not build BOW Core as a separate infrastructure program. Extract a shared contract only after at least two products need the same behavior" (p.10). This YAGNI discipline is the load-bearing idea behind everything below.

## 2. Runtime boundaries

V5's minimum technical shape assigns clear ownership per boundary (p.10):

| Boundary | Ownership |
|---|---|
| `bow-canon` | Concepts, objectives, mappings, glossary, version rules |
| `bow-economics-live` | Player, facilitator, display, session engine, economy kernels, debrief recipes |
| `bow-challenges` | Challenge content/version spine, evidence graph, attempts, teacher readings |
| `bow-educator` | Shared entry shell + product-specific launch/review routes — **not** a universal cockpit |
| `sim-library` | Canonical registry, health, run resources, curation, promotion state |
| `bow-web` | Public discovery, adoption, support, links into the correct product |

This repo (`bow-economics-live`) is named explicitly as the Economics live-session runtime boundary. The GitHub portfolio disposition (p.66–67) confirms: **KEEP AS RUNTIME** for the Economics runtime and for `bow-decision-challenges`; **KEEP + ELEVATE** BOW-WEBSITE as the canonical control plane; **KEEP INDEPENDENT** for `sim-library` ("It does not become the runtime," p.67); everything else is incubated, mined-and-sunset, migrated-and-archived, or archived. "What not to do": don't rewrite all 76 legacy experiences into one framework before flagships are proven; don't run multiple production identity/org/billing/entitlement systems; don't force every experience into one Next.js codebase (p.65, p.67).

**Control-plane vs. runtime split** (p.65–66): the control plane (BOW-WEBSITE) owns user/participant identity, organizations, memberships, roles, plans/subscriptions, Access/Sponsor grants, entitlements, content catalog, versions, session index, usage records, approved evidence references, support/audit. The **runtime owns**: interaction state, the economic/financial engine itself, timers, private information, scoring/evidence derivation, facilitator-specific controls, runtime recovery, presentation, detailed event vocabulary. "A session starts in the control plane, which checks entitlement and produces a short-lived signed launch. The selected runtime validates the launch, runs the experience, writes its own detailed state, and returns a standardized completion, usage, and evidence summary. The control plane never needs to understand every bid, contract, portfolio decision, or rubric event" (p.66). This is the single most important boundary line for any team building inside `bow-economics-live`: it defines what this repo owns outright versus what it merely reports back.

Implementation-architecture layer table for the Economics runtime specifically (p.44–45): Player app, Facilitator app, Display app, Session engine, Economy kernels, Event/debrief, Registry adapter — each with a stated non-negotiable (e.g., session engine: "Deterministic replay where randomness is seeded and recorded"; economy kernels: "Pure, testable rules separate from UI"; registry adapter: "The registry never becomes the live runtime"). Vendor selection is explicitly deferred: "Do not decide the vendor too early... The product contract should remain portable: authoritative rooms, events, snapshots, and reconnect are requirements; a specific database or messaging vendor is an implementation choice" (p.45).

## 3. Live-session / classroom-session model

Room assumptions (p.29): one facilitator, one shared display, one device per student/team; a normal class is 50–60 minutes; join friction must consume seconds; accounts are off by default (short session code + safe alias/role); the network, a device, or a student *will* fail, and "recovery and role reassignment are part of the product, not an operations footnote."

Student join flow (p.30): stable join URL/QR → 4–6 character class code → name/initials/alias per session privacy setting → role + private info + one-sentence goal → readiness check. Target median join time: **under 60 seconds**.

Grouping rules (p.30) name when to use individual, pairs, teams, or whole-class-network structures, keyed to whether peers must materially affect each other's outcome — not used decoratively.

"Controlled productive chaos protocol" (p.30): Before (state/movement/timing/freeze rules and what stays private) → During (display shows only what students need) → Freeze (one action stops submissions, preserves state, shows neutral screen) → Recover (facilitator can reassign role, activate bot, reopen student, invalidate a malformed round *without rebuilding the class*) → After (display flips from play-state to evidence-state).

The canonical **room-state machine** (p.116): `LOBBY → PREDICTION → BRIEFING → LIVE → PAUSED/FROZEN → CLOSED → DEBRIEF → COMPLETE`, with invalid transitions rejected server-side.

Default lesson rhythm (55 minutes, p.28–29) is a *default, not a template prison*: 0–5 hook+prediction, 5–12 compact teaching, 12–15 join+role, 15–27 round 1, 27–34 reveal, 34–40 theory, 40–49 change/round 2, 49–55 debrief+exit. "A negotiation may need one long run; a draft-distribution lab may need several short runs" (p.29).

## 4. Player / facilitator / display surface patterns

V5 fixes a **three-surface pattern** as the immediate build target: Player, Facilitator, Class Display, sitting on top of a Session Engine and Economy Kernels (p.29 diagram; p.44–45; p.113–114). Required first-release behavior per surface (p.114):

- **Player**: join code, alias, role/private info, one-screen goal, validated action, immediate feedback, reconnect, keyboard-complete flow.
- **Facilitator**: create session, assign/group, start/pause/freeze/advance/end, reveal, named shock, rerun, class data, reassign, bot, restore snapshot.
- **Display**: join/readiness, prediction, public live state, freeze/event, class metrics, graph, comparison, debrief. Non-negotiable: "No private or identified data."

Facilitator control room has three layers — always-visible run controls, simulation-specific controls supplied by the sim contract, and recovery/diagnostics hidden until needed (p.31). **Control semantics** must not be conflated: PAUSE stops timers/transitions but leaves the current screen visible; FREEZE switches every student to a neutral attention screen while preserving state; REVEAL publishes a defined subset of hidden info/metrics (never a student's private value by name); SHOCK applies a versioned, economically valid scenario change with instructor preview; RERUN creates a linked comparison round pinned to the same participants/starting state; END closes actions, writes a final snapshot, opens the debrief recipe, reversible only via explicit restore (p.31). Anti-cockpit rules: no more than 7 primary controls live; no raw event stream/DB vocabulary/dev errors on the teaching surface; no shock button without an explanation and reset-policy preview; no AI interpretation shown as fact — suggestions must cite the class pattern that triggered them; no control that changes a student's committed choice without a visible audit record (p.31–32).

Display states each have one job and one privacy rule (p.32): Join, Ready room, Prediction, Live system, Freeze/event, Class data, Compare, Debrief — e.g., Prediction shows "anonymous distribution of initial beliefs... no correct-answer cue"; Live system shows "no personally identifying performance ranking." Default is anonymous aggregates; a student may be spotlighted only via opt-in safe alias when learning value exceeds social cost, and private willingness-to-pay, cost, contract, medical, or bargaining data "must never be projected during play" (p.32).

Feedback grammar (p.43) standardizes treatment of six feedback types (action accepted/blocked, uncertain outcome, counterpart response, collective consequence, revision) so screens stay legible under time pressure.

## 5. State, versioning, replay, event/session concepts

**Class-generated data schema** — the minimum record set every session must be able to produce (p.33–34): Session, Participant/role, Prediction, Action, Transaction, Snapshot (round, public state, hidden-state hash, rule/policy version), Facilitator (which control fired, when, why if destructive), Outcome, Explanation, Technical (disconnect/retry/latency/recovery/client version — kept separate from student behavior).

**Reliability requirements** (p.45): authoritative server state (clients cannot self-award resources or submit impossible actions); seeded randomness recorded with every outcome so any stochastic result is reproducible; snapshots before start, before every shock, and at round close, restorable by the facilitator; reconnect restores role/state without a new identity, with bot takeover available; graceful degraded mode plus a printable/offline fallback per Ramaz-ready lesson; load testing above expected class size with weak-network simulation; no sensitive student data in logs, ephemeral session identity by default.

**Platform records and contracts** (p.68–69) define the versioning/evidence spine at the control-plane level: `ExperienceVersion` (immutable approved version of a simulation/challenge/World/evidence contract), `Session` (control-plane index for a runtime run), `UsageRecord` (idempotent commercial unit), `EvidenceReference` (approved pointer/summary only — detailed evidence stays runtime-governed). Minimum shared **contracts**: `SimulationManifest`, `LaunchContract`, `SessionContract`, `ControlContract`, `EventEnvelope` (version, session, actor role, event type, payload, sequence, timestamp, support level, technical status), `EvidenceContract`, `DebriefRecipe`, `UsageMeter`. Separation rule: "Plan describes packaging. Subscription describes a paid relationship. Access Grant describes free authority. Sponsor Grant describes who funded access. Entitlement describes what the software permits. Never collapse these into one subscription tier field" (p.68).

**Debrief-as-product event chain** (p.33): Events → Metrics → Patterns → Reveal → Debrief, gated by "the system may describe what happened; the teacher and model explain why." Debrief recipe requires: a named pre-registered prediction/misconception; declared events/metrics/invalid-run criteria; one headline pattern + up to 3 metrics + up to 2 graphs; explicit mechanism/model-boundary/counterfactual language; suggested (never scripted) questions; a compact session receipt (p.34).

**Experience truth states** — a controlled vocabulary preventing scope inflation of claims (p.108): Discovered → Reachable → Playable → Ramaz-tested → Ramaz-ready → Transfer-ready → Evidence-bearing, each with an explicit "may claim" and "may not claim" (e.g., Playable "may claim: an adult completed the critical path" but "may not claim: students understand or teachers can facilitate it"). This vocabulary should be adopted directly for any status field this repo exposes about its own experiences.

**Reusable contracts** (Appendix B, p.107–108): Lesson Blueprint (identity, learning, experience, system, facilitation, data, debrief, validation fields) and Simulation Contract (purpose, agents, incentives, constraints, information, actions, transitions, metrics, controls, debrief, quality) are the two schemas later agents should reuse when specifying any new Track 101 lesson or simulation, rather than inventing new templates per lesson.

## 6. Architectural warnings and known technical failure modes

V5's adversarial review (p.48) and unresolved-risk ledger (p.49) are the two highest-value pages for a build team. Named risks: **founder dependence** (a Brayden-led lesson may not transfer — test: non-founder facilitator run once Ramaz quality is real); **real-time complexity** (multiplayer/recovery can consume engineering and class time — test: three vertical slices, load/reconnect tests, strict "live only when needed" rule); **student sample** (one school/grade may not generalize); **sports staleness** (mitigate with dated instructor notes + versioned data packs); **false evidence** (dashboards can imply learning/causality without support — mitigate via session-bound claim language and explicit "data truth" rules, p.34: never present one stochastic outcome as proof, never compare groups run under different rules without naming the difference, never retain student names merely because the event system can); **library debt** (76 records become a maintenance sink without active-shelf limits); **motif ambition** (multiple Worlds → shallow reskins); **product merger** (shared code can quietly force shared pedagogy across products).

Prototype **kill tests** — conditions that should fail a prototype outright (p.41): a student can succeed by clicking a highlighted/consistently-positioned option; the first consequential action arrives after five minutes of interface explanation; a "live multiplayer" build is functionally simultaneous single-player; the teacher can only see a score or must inspect raw student screens to debrief; changing the economic rule changes only the story copy, not the state transition; luck determines the lesson's claimed conclusion and the display hides the outcome distribution; the visual skin is premium but student verbs remain read→click→read.

The **76-experience audit** (Appendix A, p.75–106) is a concrete catalogue of failure modes actually observed in the existing GitHub portfolio, useful as a pre-flight checklist before calling any new build "Ramaz-ready": dead/404 deployments where a build was never published; deployments requiring a bound external Google Sheet not present in the repo; results-submission endpoints wired to a placeholder string so nothing is ever recorded; syntax errors that break every interaction on first click despite a fully rendered UI; CI pipelines that run tests but never publish; experiences gated behind a prior module/account so they can't be reached and verified; deployment **regressions** (a URL live one date, 404 two days later — flagged as worse than a link that was never right, p.103); duplicated app logic with a CI workflow file that "contains HTML instead of YAML"; scored outcomes contradicting their own printed scorecard; a single dominant strategy that "wins" every scenario, defeating the intended decision tension. The recurring meta-pattern: **polish and "reachability" are not evidence of a working decision system** — only an adult completing the critical path, then a non-founder facilitator completing it, count as real signal (p.108).

Direct browser playtesting for V5 itself was blocked by an administrator-enforced policy; V5's KEEP/REFINE judgments rely on the Simulation Library's previously recorded end-to-end playtests, not fresh verification — every KEEP is explicitly "provisional until live classroom validation" (p.39, p.75).

## 7. Future-strategy extraction — protecting optionality without pulling forward scope

**Motifs beyond sports.** Sports is the flagship motif "because it produces immediate roles, stakes, identity, negotiation, uncertainty, and cultural pull" (p.52) but is bounded, not definitional: "A new World must change role, institution, narrative meaning, or mechanic — not only nouns and art" (p.15). Four escalating levels — Flavor, Case variant, Motif, World — each carry their own comparability rule, so reskins never get marketed as validated new content (p.36). **Creator economy** is named the leading next-candidate motif "because it supports platforms, contracts, pricing, audience/network effects, sponsorships, and risk" (p.36, p.69); food/retail, cities, and music/entertainment are further hypotheses, not a build list (p.37). Trigger to productize a second motif: "only after one shared mechanic delivers equal or better learning, student pull, and debrief quality without confusing comparability" (p.37) — proof-gated, not roadmap-gated.

**Control-plane boundary.** The one structural decision worth protecting company-wide is §2's control-plane/runtime split (p.65–66). As long as `bow-economics-live` keeps interaction state, private information, and detailed events inside itself and reports back only a standardized completion/usage/evidence summary through signed launches, every future product (Financial Literacy, Decision Challenges, BOW League, partner-embedded runtimes) can plug into the same control plane later without this repo being rewritten.

**Reusable primitives worth banking now, at zero extra scope cost:** the Lesson Blueprint and Simulation Contract schemas (p.107); the Experience truth-state vocabulary (p.108); the room-state machine and control semantics (p.31, p.116); the class-generated-data record set (p.33–34); the concept canon's minimal record shape (durable ID, plain-language definition, objectives, prerequisites, model boundary, version, owner, p.9) — designed as "an interoperability contract" other subjects can link to later "without forcing them into one runtime" (p.10). None require building beyond what Track 101 already needs; they only require *naming things the same way* V5 already names them, preserving the option to federate later at zero cost now.

## 8. V5 future ideas that must NOT become current build requirements

Most of Part IV/V's company-scale material is sequenced far behind the current Ramaz/Track 101 build and gated on evidence that does not yet exist. Must not leak into current-scope decisions:

- **BOW League** (p.59–60) — "Do not launch BOW League merely to add subscriptions... launch when the persistent experience is something students voluntarily return to"; prototype-only until school adoption is proven (p.72).
- **BOW Studio / enterprise custom Decision Challenges / branded Worlds / white-label** (p.60–61) — later monetization layer.
- **BOW Exchange / creator marketplace / certified configurators** (p.62–63) — "game-changing only after trust exists" (p.62); not the first product.
- **BOW Infrastructure / partner API tiers and pricing** (p.61–62) — a partner-facing product, irrelevant to classroom work now.
- **District/Access sponsorship programs, School Complete/Department pricing ladders** (p.57–59) — commercial packaging, not architecture.
- **National Decision League, certifications, talent pathways, research partnerships** (p.62–63) — activated only when the prior layer "creates the proof" (p.63).
- **A second motif as a shipped product** — remains a hypothesis pending a validated pilot (p.50, p.69).
- **Financial Literacy redesign or a merged Economics/Financial-Literacy runtime** — forbidden by name: "no planned merger trigger" (p.49); "This document does not rebuild Financial Literacy" (p.14).
- **Economics × School-Day arm** (teacher-transfer, standards, procurement product) — a hypothesis sequenced behind proven Ramaz quality (p.17, p.50).
- **One universal runtime, universal score, or motif marketplace** — rejected: "the pedagogy and synchronization needs differ" (p.13); "Do not build all of this" (p.63).
- **$10B revenue-portfolio math** (p.54–56) — an illustrative ceiling test ("not a plan... not a forecast"), not a design target.
- **Migrating all 76 legacy simulations onto the new runtime, or consolidating every repository into BOW-WEBSITE's codebase** before flagships are proven (p.65, p.67, p.113).

## Note on escalation

No consequential architectural ambiguity requiring a DECISION PACKET was found during this extraction: V5 already resolves its own open questions through the explicit DECISION / WORKING SPEC / HYPOTHESIS ledger (p.49–50) and states triggers for revisiting each. The one open item flagged *inside* the source document itself — a labeling conflict for Track 201 Module 2 Lesson 3 ("Cap Space ≠ Cash Flow" vs. "The Ownership Equation," p.18) — sits in Track 201 (grades 7–8), outside this mission's Track 101 (grades 5–6) scope, and V5 already assigns it to the formal curriculum registry to resolve before slide redesign, not to this architecture extraction.
