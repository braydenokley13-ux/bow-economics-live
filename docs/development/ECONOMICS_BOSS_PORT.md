# Economics Boss — port audit, architecture, and provenance

Status: implemented, harness-tested, independently reviewed (see §8)
Date: 2026-08-31
Source: `bow-decision-challenges` `tools/boss` + `.boss` at commit `9313c91`
(branch `claude/bow-boss-audit-adapt-eiezv7`), the first implemented BOW Boss.

This document records the audit of the source implementation, the
architecture decision for reuse, and exactly what changed in the port. It is
the reference when changing the harness itself.

## 1. Source audit

Verified by direct code reading, `npm run boss:doctor` (all green), and
`npm run boss:test` (27/27) in the source repository this session — not from
its README.

**Excellent, genuinely product-agnostic (ported nearly unchanged):**

- `core.mjs` — atomic fsync'd writes, directory locking, canonical hashing,
  git snapshots, path-overlap logic.
- `events.mjs` — hash-chained append-only history, crash-safe append/replay,
  truncated-tail quarantine, deterministic projection, projection-freshness
  detection.
- `gates.mjs` — deterministic wave/ship gates over roles, evidence integrity,
  claims, dissent, meetings, budgets, ownership, branch protection;
  PASS-cannot-bypass-gate; repair-budget enforcement.
- `operations.mjs` — meeting economics (expected-value ratio, independent
  pre-opinions), lanes/reservations with overlap rejection.
- `memory.mjs` — lesson maturity ladder (observation → provisional →
  repeated-evidence → candidate-precedent → founder-approved-rule) with
  two-run evidence and named founder approval; stale-precedent surfacing.
- `router.mjs` (needs-based model routing over dated priors), `metrics.mjs`,
  `experiments.mjs`, `report.mjs`, `cli.mjs`, the run-state protection hook,
  and the agent-file generator concept.

**Accidental Decision Challenges coupling found in "core" code (fixed here):**

1. `gates.mjs` hardcoded DC role names in the level-1 ceremony check → now
   read from `levels.json` `releaseOnlyRoles`.
2. `generate-agents.mjs` hardcoded a DC bash-role list and the product name →
   now driven by a per-role `tools` field in `roles.json` and
   `project.json.displayName`.
3. `doctor.mjs` hardcoded DC's exact viewports → now validates shape from
   `project.json.requiredViewports`.
4. `claims.mjs` carried the DC-specific `ai-off-works` kind, and detected hard
   contradictions by regexing English reason strings → kind removed; hard
   contradictions now tracked structurally as reasons accumulate.

**Weaknesses noted but accepted:** `models.json` priors go stale by design
(dated, sourced, and marked as priors, not evidence); token budgets are soft
and honor-reported; judgment claims rely on the CLI-enforced
independent-reviewer path. None blocks first use.

**Not overbuilt:** every subsystem the founder listed exists and is exercised
by evals; nothing was found that a second product would delete.

## 2. Architecture decision — one core or two copies?

**Decision: adapted copy with provenance, not a shared package.**

- The core is ~2.7k lines of dependency-free Node stdlib; duplication cost is
  low and inspection cost is low.
- This port is the *first* test of Boss reusability. Extracting a versioned
  shared package now would freeze abstractions before two products have
  exercised them — exactly the premature platform engineering the program
  forbids.
- Repo independence matters: Economics must run one-machine/no-network (D12);
  a package dependency adds installation and version-skew surface for zero
  present benefit.
- Divergence is managed, not ignored: every ported file carries a provenance
  header naming the source commit; this document maps every deliberate
  difference. The decoupling fixes above are backport candidates to Decision
  Challenges.
- Revisit trigger: when a third product needs Boss, or when a harness defect
  must be fixed in both repos twice within one quarter, evaluate extraction
  with that evidence.

## 3. What is Boss Core vs Economics constitution

Core (shared philosophy, portable code): event history, run state, wave
contracts, activation engine, role machinery, model routing, evidence objects,
claims, contradiction detection, gates, meetings, dissent, ownership/lanes,
founder overrides, memory/lessons/precedents, metrics, experiments,
ship-cases, PASS/REPAIR/ROLLBACK/KILL, doctor, CLI, agent generation, hooks.

Constitution (product-specific, deliberately different from DC):

- `project.json` — sacred constraints (experience-before-formalization,
  real-sports-business-truth, fandom-never-a-prerequisite, no-false-economics,
  random-teacher-standard, student-privacy-across-surfaces, …), blocking
  dissent categories (economic-truth, teacher-transfer, classroom-reliability,
  student-privacy, data-loss), the three surfaces, viewports, protected paths,
  and `constitutionExclusions` — an explicit machine-checked list of DC
  assessment identifiers that may never appear in this constitution
  (doctor check `constitution-separation`, eval E1).
- `roles.json` — 21 roles. Economics-specific permanent functions:
  **sports-reality-director**, **economic-truth-critic**,
  **teacher-transfer-critic**, **player-gameplay-critic**,
  **classroom-projector-critic**, **visual-experience-director**. DC's
  assessment/standards/AI roster does not exist here.
- `levels.json` — level 4 is CLASSROOM_RELEASE: minimum evidence includes
  `teacher-transfer-report`, `synthesis-map`, and `projector-report` (the
  Teacher Transfer and Synthesis hard gates).
- `activation-rules.json` — deterministic review triggers for economic-model,
  sports-reality, rights/source, teacher-surface, projector, synthesis,
  gameplay, visual, persistence/seed-chain, privacy, architecture,
  performance, accessibility, copy, classroom-release scopes.
- `claims.mjs` screens — `sports-reality-current` (dated, fresh
  `verifiedAsOf`) and `teacher-transferable` (fresh-context, not
  builder-notes) can be deterministically contradicted; confirmation of all
  judgment claims still requires a completed independent read-only reviewer.

## 4. Deterministic software vs model judgment

Code enforces: event integrity and resume; gate eligibility; role
independence (builder ≠ analyst/critic actor); required-role and
required-evidence presence; evidence hashes; command exit codes; claim
screens; meeting economics and pre-opinion independence; ownership conflicts;
budgets; branch protection; ship-gate clean-tree + rollback checkpoint;
constitution separation; prototype/Boss boundary (level 0 refuses a run).

Model judgment (never fabricated by code): whether gameplay is MAGNETIC,
whether a random teacher could run it, whether the economics is true and the
synthesis map is honest, whether real-world content is materially stronger
than fiction, visual quality, and every PASS/REPAIR/ROLLBACK/KILL call —
recorded as evidence, claims, and dissent that the deterministic layer then
holds them to.

## 5. Harness evals

Inherited from the source and passing here (adapted where the constitution
differs): false test claim, viewport claim without artifact, CI contradiction,
low-value meeting rejection, missing pre-opinions, ownership collision,
duplicate lane, prototype-cannot-activate, builder self-certification,
required-critic omission, PASS bypass, level-1 ceremony, repair-budget
exhaustion, ship rollback integrity, malformed role output, lesson promotion
laws, stale precedent, router constraints, experiment ranking, deterministic
replay, tampered chain, interrupted resume, stale projection, founder
override persistence.

New Economics-specific evals (`tools/boss/test/economics.test.mjs`), E1–E12
per the founder program: constitution separation (shipped-clean +
injected-bleed detection), real-sports activation, stale/undated real-world
facts, player-pull claim without independent evidence, teacher-transfer claim
without fresh-context evidence, synthesis omission at classroom release,
teacher-surface/projector/economic-model activation triggers, rights/source
surfacing without fabricated blocking, prototype ceremony, hidden facilitator
knowledge (builder-notes transfer evidence), and roster-level independence.

Suite: `npm run boss:test` — 44/44 this session. Doctor: all green this
session. CLI smoke: one synthetic level-1 run in a scratch fixture exercised
create (dirty-tree rejection first), role activation, command evidence,
deterministic claim confirmation, gate (correctly ineligible: missing
teacher-transfer/classroom reviews for a `teach` scope), REPAIR verdict,
resume, and doctor run-projection freshness.

## 6. What deliberately did not port

- DC's assessment law, rubric semantics, evidence modes, standards mapping,
  AI red-team/evaluation roles, district evidence framing — excluded and
  machine-blocked (`constitutionExclusions`).
- DC's `.claude/rules/` path-scoped assessment rules — no Economics
  equivalent yet; CLAUDE.md and the constitution carry the law.
- Nothing else was dropped; no DC behavior was silently weakened.

## 7. Known weaknesses / open questions

- No real Boss-controlled product run has happened yet; the first Module 2
  program is the real test. Do not call Economics Boss "proven."
- Teacher-transfer and sports-reality screens are deterministic *filters*,
  not proof of quality; the roles' judgment is the substance.
- `models.json` must be re-dated when routing priors change; it is a routing
  prior, never authority.
- Cross-product lesson flow (DC ↔ Economics) is manual; a lesson learned in
  one repo reaches the other only by deliberate `lesson add` with scope
  recorded. Cross-product evidence is valuable (founder program §32) but not
  automated.
- The workstream-lead pattern (lanes + reservations + budgets) exists in the
  runtime but has not yet been exercised by a real multi-lane program.

## 8. Independent review

A fresh-context independent review of this port ran after implementation and
before ship; findings and dispositions are recorded in the run log of the
port program (see the founder-facing ship case and the commit history of this
branch).
