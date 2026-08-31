# CLAUDE.md — BOW Economics Live

Operating manual for agents working this repo. Durable principles only — for
specifics, follow the pointers instead of restating them here.

## 1. Mission and quality bar

Track 101 (grades 5–6, D6) lessons put students **inside** a sports-business
economic system — not worksheets, not decision-card menus. Economics itself
creates the tension: scarcity, opportunity cost, constraints, incentives,
uncertainty, bargaining, competition, risk, path dependence.

Success sounds like: "That was fun." / "Can we do it again?" / "Our decision
caused that?" / "What if we'd done something different?"

- One 50–60 min live class, real student discussion, ~7–15 min debrief.
- Loop: **experience → consequence → adaptation → class evidence → argument →
  explicit economics formalization.** Students experience the mechanism first;
  then the teacher names it ("That thing you just experienced has a name:
  opportunity cost."). The explicit teaching stage is essential — the
  simulation does not replace economics instruction, it makes it
  understandable.
- Bad decisions matter but stay generally recoverable. Uncertainty during play
  must become interpretable afterward, never a shrug.
- Every major experience must ultimately connect: experienced moment → class
  result → real sports example → formal economic term → outside-sports
  generalization. Synthesis work is high-value product work, not lesson-plan
  polish.

## 2. Source authority hierarchy

1. **Founder instructions this session** — outrank everything below.
2. **`docs/PRODUCT_DECISIONS.md`** (D1 onward) — standing decision log, holds
   until superseded. Read first, always.
3. **State docs** — `docs/TRACK_101_MAP.md`, `docs/RAMAZ_READINESS.md` —
   current status, not standing decisions.
4. **`docs/gauntlet/`** — design/verification evidence, not sacred spec.
5. **`docs/intel/` + the two root PDFs** — historical raw material, already
   distilled into the decision log; consult only when a question demands the
   primary source, don't re-read broadly.

**Nothing is "proven"** by a legacy asset, a passing suite, or a prior verdict
(D10). "Classroom-proven" means survived a real classroom session with real
students — nothing has yet. See the readiness ladder in `RAMAZ_READINESS.md`.

## 3. The real world of sports business — founder invariant

BOW Economics is built around the **real world of sports business**, not
merely fictional sports-themed economics. Use real players, teams, leagues,
executives, contracts, salaries, rules, trades, historical and current
situations, statistics, and league economics wherever doing so materially
improves the experience.

- **NBA/basketball is the primary world** for Track 101. Other sports appear
  when they provide a dramatically better economic example, when cross-league
  comparison itself teaches, or when a real situation is too useful to ignore.
  Never disconnected sports trivia.
- **Real people appear frequently.** Don't default to "Player A" / "Team Blue"
  when a real situation would be materially stronger — recognizable people
  create attachment, opinions, argument, and memorability.
- **Reality must never become a fandom test.** A student who knows little
  basketball must still succeed; a fan may perceive extra strategic depth.
  Design accessible core information plus optional domain depth. Sports
  knowledge may raise engagement; it may never be a prerequisite for the
  economics.
- **Accuracy:** prefer real or closely modeled contracts, salaries, cap rules,
  and league financial systems where practical. **Simplify the interface
  before simplifying the economics.** When the economics must be simplified,
  record what changed, why, and the misconception risk.
- **Rights/source discipline:** real-world content is mandatory as product
  direction, but distinguish public names and facts from photography,
  likeness, logos, marks, video, and proprietary datasets. Never make blanket
  legal claims; when a rights/source issue materially affects design, create
  evidence and escalate. Uncertainty here is never an excuse to sterilize the
  product into fictional sports. (Student names on shared screens stay
  fictional — that is privacy, not fandom.)

## 4. Random-teacher standard — founder invariant

A random competent teacher must eventually be able to run an unbelievable
session — great pacing, student excitement, meaningful reveals, strong
discussion, correct economics, memorable synthesis — without hidden founder
knowledge. Teacher Transfer is a first-class product risk with its own
fresh-context review and a hard gate at the highest readiness level: a lesson
is not classroom-ready if only the founder knows how to make it great.
`/teach` may evolve toward a live class director (NOW / WATCH FOR / DON'T
EXPLAIN YET / ASK / TRIGGER / SYNTHESIS); preserve that architectural room.

## 5. Development modes — Prototype Mode vs Boss Mode

```text
IDEA -> PROTOTYPE MODE -> playable prototype -> founder reaction
     -> founder-controlled promise threshold -> BOSS MODE
     -> convergence / hardening / quality war
```

- **Prototype Mode** (`.claude/skills/bow-prototype/SKILL.md`): the first
  playable expression of an idea. Fast, reversible, browser-first. No critic
  courts, no meetings, no gates, and it **never creates a Boss run**. It may
  recommend graduation; only the founder activates Boss.
- **Boss Mode** (`.claude/skills/bow-boss/SKILL.md`): post-prototype
  convergence under the deterministic control plane in `tools/boss/` and
  `.boss/`. Levels: 0 prototype (Boss off) · 1 bounded repair · 2 meaningful
  feature · 3 quality war · 4 classroom release. Every wave starts from a
  frozen falsifiable contract; `.boss/runs/<id>/events.jsonl` is the source of
  truth; never hand-edit run state or gate results. Run `npm run boss:doctor`
  first, then `npm run boss -- ...`.

**Roles are stable. Models are dynamically routed resources.** No model name
holds permanent organizational authority. Role contracts live in
`.boss/config/roles.json` and `.claude/agents/`; dated model routing priors
live separately in `.boss/config/models.json`. Boss controls the development
process; evidence determines advancement; builders never certify their own
work; the independent Product Analyst tries to disprove success. The founder
controls final merge to main.

Permanent Economics review functions: **Sports Reality** (find the real
sports-business version of the economics; verify and date facts; surface
rights/source questions), **Economic Truth** (mechanisms, incentives, dominant
strategies, false lessons, the synthesis map), **Teacher Transfer**
(fresh-context "could I run an outstanding class tomorrow?"), **Player /
Gameplay** (what is the student actually playing? MAGNETIC / STRONG /
FUNCTIONAL / WEAK / REFOUND — FUNCTIONAL is below the bar for important
Track 101 experiences), **Classroom / Projector** (the three coupled surfaces
and the room itself), **Visual Experience** (premium interactive
sports-business media, never technically-functional school UI; no CSS/SVG
ceiling — Chromebook compatibility is a performance constraint, not
permission to be visually cheap).

## 6. Token and attention economy

Best product per token. Executive attention is scarcer than worker execution:
Boss consumes compressed briefs, evidence bundles, gate results, and
disagreement maps; workstream leads manage bounded workers. No broad rereads
of `docs/intel/`; cite by D-number. No unnecessary new doc files. Update state
docs tersely at end of run.

## 7. Track 101 structure

Four-module spine is founder-fixed (D1, D2) — don't add, remove, or reorder
without an explicit founder call:

- **M1 "The Cap"** — scarcity, opportunity cost, constrained allocation,
  cap-as-institution. L1 Draft Day, L2 Trade Deadline, L3 Free Agency: The
  Signing Window (rechartered per D18; the module finale).
- **M2 "Money in Motion"** — revenue, incentives, path dependence. Prototype:
  "The Box Office."
- **M3 "Measuring Players"** — information, uncertainty, evaluation. Not yet
  designed, no legacy anchor (both candidates discarded as quiz-theater, D9).
- **M4 "Draft Day"** — uncertainty, expected value, negotiation taught inside
  draft mechanics, not a separate unit.

Build status per module: `TRACK_101_MAP.md`. Classroom-readiness rung per
module: `RAMAZ_READINESS.md`.

## 8. Economics through consequential action

Every lesson turns on decisions whose consequences the student experiences
and can attribute to their own choice.

- No decision-screens or menu-quizzes wearing sports nouns.
- No XP, levels, badges, leaderboards, or progression systems (D4). The class
  reveal *is* the reward system.
- Real student-to-student interaction only when another participant
  materially changes the economics (hidden rival bid, shared shrinking
  pool) — never multiplayer for spectacle.
- A fun simulation that teaches false economics fails.

## 9. State persistence across lessons

Persist franchise state when yesterday's choice creates today's problem — the
L1 roster → L2 deadline → L3 free-agency books chain is the canonical case
(D18 superseded the earlier L2→L3 clean-reset posture). Reset deliberately
only when a controlled comparison genuinely needs a clean baseline. Normalize
carried state only where playability requires it (an absent student gets a
stock franchise, not a broken one).

## 10. Scope discipline

Sports-business is the world of this course. Recorded future options —
preserve, don't build: BOW course certificates; possible future BOW Economics
courses in other coherent domains (e.g. business/entrepreneurship). Those are
**separate products/courses with their own curricula and play systems, not
selectable motifs or cosmetic skins of this one** — build no world selector,
motif system, or motif-abstraction layer, and no commerce or enterprise
features. Scope is Track 101, grades 5–6, only (D6).

## 11. Classroom / teacher / display philosophy

Three surfaces, one session:

- **`/play`** — student device, private. Never shows another seat's data.
- **`/teach`** — control room: pause/freeze/reveal/shock/restore. Gated by a
  per-session bearer key (D14).
- **`/board`** — projector, public. Never shows student-private data;
  `boardView` is structurally never handed a seat identity.

Teacher paces phases; every synchronized reveal ships a manual teacher
fallback, never a pure timer. Defaults: pairs on one device, fictional names
only on shared screens. Runtime survives refresh, rejoin, mid-class restart
(snapshot persistence; a corrupt snapshot is quarantined, server boots fresh).
The classroom itself is part of the product: projector legibility, reveal
choreography, and classroom drama get their own review.

## 12. No premature generic engine

Each module owns its state shape and reducer behind the small `LessonModule`
contract (`runtime/src/shared/lessonModule.ts`): `phases`, `initialState`, a
pure `reduce`, three view functions (`studentView`/`teacherView`/`boardView`),
`aggregate`. The runtime never inspects a module's state.

Don't extract a shared "economics engine" or platform abstraction from two
data points. `docs/EMERGING_PRIMITIVES.md` tracks cross-module patterns for
visibility only, not as a mandate to extract. The same restraint applies to
the Boss harness: it exists to make BOW products better, never to become a
generic AI-agent framework.

## 13. Release truth

- A test that did not run is not green; never claim "passing" or "ready"
  without having run the command this session.
- Browser truth is mandatory for changed student-facing behavior; unit tests
  do not substitute for playing the product.
- Do not say "verified" when you only reasoned.
- "Classroom-proven" is reserved for surviving a real class (D10).
- Copy is human, concrete, grade-appropriate, in the Cap Room register — no
  startup language or marketing voice.

## 14. End-of-run discipline

- Append new numbered decisions to `PRODUCT_DECISIONS.md` — never rewrite or
  delete history.
- Update `TRACK_101_MAP.md` / `RAMAZ_READINESS.md` if status actually changed.
- Keep `runtime/README.md` accurate on test/build status and known gaps.
- Leave the tree clean, committed, and pushed to the working branch. The
  founder controls merge to main.

## Repo map

- `docs/` — decision log (`PRODUCT_DECISIONS.md`), state docs
  (`TRACK_101_MAP.md`, `RAMAZ_READINESS.md`, `ECONOMICS_CONCEPT_MAP.md`,
  `EMERGING_PRIMITIVES.md`, `SOURCE_LEDGER.md`), `gauntlet/module-N/` design +
  verification evidence, `intel/` historical source extraction (read rarely),
  `development/ECONOMICS_BOSS_PORT.md` (harness architecture + provenance).
- `design/` — `VISUAL_IDENTITY.md` (the Cap Room register, dark palette,
  tokens) plus rendered contrast/CVD proof assets.
- `runtime/` — live-session server + three surfaces: `src/shared/`
  (`lessonModule.ts` contract, `phases.ts`), `src/server/`, `src/modules/`
  (one file per lesson module), `src/client/{play,teach,board}/`, `src/test/`.
- `.boss/`, `tools/boss/` — development control plane; never product logic.
- `.claude/` — agents (generated from `.boss/config/roles.json` — edit the
  config, then `npm run boss:agents`), skills (mode workflows), settings
  (run-state protection hook).

## Commands

Product (run from `runtime/`, or via root aliases `npm test` / `npm run build`):

```
npm install    # install deps
npm run dev    # build + run dev server (localhost:4300 — /teach /play /board)
npm run build  # tsc compile + copy static assets to dist/
npm start      # run compiled build without rebuilding
npm test       # build + run full test suite (node:test)
```

Control plane (run from repo root):

```
npm run boss:doctor   # validate the harness installation and run integrity
npm run boss -- ...   # operate a Boss run (see .claude/skills/bow-boss/)
npm run boss:test     # deterministic harness eval suite
npm run boss:agents   # regenerate .claude/agents from roles.json
npm run boss:check    # agents + tests + doctor
```

No database, no external service, no internet access required — one Node
process, one machine (D12).
