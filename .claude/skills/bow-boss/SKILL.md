---
name: bow-boss
description: Operate a post-prototype BOW Economics Boss development run with falsifiable contracts, persistent event state, evidence, independent analysis, targeted specialists, deterministic gates, and founder-controlled ship decisions. Do not use for first prototypes.
model: inherit
effort: high
---

# BOW Economics Boss

BOW Boss is the post-prototype development control plane. The runtime is `tools/boss/`; this
skill teaches you to operate it. Do not hand-edit run state and do not replace runtime commands
with prose.

## Entry check

Before any command:

1. Read `CLAUDE.md` and `docs/PRODUCT_DECISIONS.md` for the affected product area.
2. Confirm a playable prototype exists and the founder explicitly activated Boss or asked to
   resume an existing Boss run.
3. If either is false, use `bow-prototype` or ask for the missing founder decision. Do not create
   a run.
4. Run `npm run boss:doctor`.
5. Run `npm run boss -- activate --level <1-4> --scopes <comma-list>` and show the required roles
   and evidence before creating the run.

## New run

Create a complete wave contract from `.boss/templates/wave-contract.json`. Goalposts must be
falsifiable before implementation. Then:

```bash
npm run boss -- run create <run-id> \
  --level <1-4> \
  --development-intent <build-to-learn|build-to-ship> \
  --intent "<founder intent>" \
  --contract <contract.json> \
  --scopes <comma-list> \
  --actor <lead-identity>
```

The command rejects Level 0, protected-branch work, incomplete contracts, and unexplained dirty
trees.

## Resume

Never infer run state from chat memory:

```bash
npm run boss -- run resume <run-id>
```

Read `.boss/runs/<run-id>/SUMMARY.md`, the current contract, missing roles/evidence, open dissent,
and latest gate. Resume from the first unmet dependency.

## Operating loop

1. Reserve lanes and hot files before parallel edits.
2. Route models from task needs; roles retain authority regardless of model choice.
3. Activate only deterministic required roles plus specialists justified by uncertainty. Prefer
   workstream leads who manage bounded workers over Boss micromanaging every worker; ownership
   stays explicit through lanes and reservations, and evidence rolls upward.
4. Give each role bounded context and the machine output keys in its agent contract. Boss
   consumes compressed briefs, evidence bundles, gate results, and disagreement maps — it does
   not personally perform routine code inspection, testing, QA, research, or asset production.
5. Builders record command/file evidence and explicit claims. They never certify acceptance.
6. Reconcile code-provable claims automatically. Judgment claims — gameplay pull, teacher
   transfer, real-sports strength, economic truth — require a completed independent read-only
   role; a deterministic screen can contradict them but never confirm them.
7. Give the Analyst objective artifacts before builder self-evaluation. The Analyst attempts to
   disprove success.
8. Record formal dissent. Blocking dissent remains visible until resolved.
9. Hold a meeting only when evidence conflict or an irreversible cross-functional decision makes
   the expected value exceed the cost. Independent pre-opinions come first.
10. Evaluate the gate. Record PASS only when the runtime says eligible. A founder override may
    accept risk; it does not rewrite evidence into a pass.
11. Choose PASS, REPAIR, ROLLBACK, or KILL within the recorded failure budget.
12. At a ship boundary, commit evidence, record a rollback checkpoint, prepare the ship case,
    run the ship gate, and present the case. The founder controls merge to main.

## Economics-specific review posture

- **Sports Reality** is product design, not fact-checking: for real-world scopes the run needs a
  dated `sports-reality-report`; a fictional placeholder where a real situation is materially
  stronger is a finding, and a rights/source ambiguity is surfaced as evidence, never silently
  judged safe or used as an excuse to fictionalize the product.
- **Teacher Transfer** reviews start cold: teacher-facing material first, builder context after.
  Facilitation knowledge that exists only in builder notes is a failing finding.
- **Economic Truth** owns the synthesis map: experienced moment → class result → real sports
  example → formal economic term → outside-sports generalization. A fun simulation that teaches
  false economics fails.
- **Classroom/Projector** review treats the three surfaces as one session; `/board` privacy and
  manual teacher fallbacks are non-negotiable.
- Player pull is rated MAGNETIC / STRONG / FUNCTIONAL / WEAK / REFOUND. For important Track 101
  experiences FUNCTIONAL is below the target bar.

## Progressive references

Read `.claude/skills/bow-boss/references/OPERATIONS.md` when you need exact commands for roles,
evidence, claims, meetings, Git lanes, memory, or ship cases. Read
`docs/development/ECONOMICS_BOSS_PORT.md` when changing the harness itself.

## Hard rules

- `events.jsonl` is the source of truth; never edit it or `state.json` manually.
- A test that was not run is not green.
- Browser truth is mandatory for changed student-facing product behavior.
- Builders do not serve as Analyst or gating critics for their own wave.
- Do not summon the full roster.
- Do not auto-merge main.
- Do not silently promote a lesson or mutate standing product decisions (D1–D18 and successors).
- Do not start real product programs (Module 2 and beyond) without explicit founder activation.
