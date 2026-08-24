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
- Loop: **experience → class evidence/reveal → student reasoning → teacher
  formalization.** The reveal is where the lesson lands, not the play itself.
- Bad decisions matter but stay generally recoverable. Uncertainty during play
  must become interpretable afterward, never a shrug.

## 2. Source authority hierarchy

1. **Founder instructions this session** — outrank everything below.
2. **`docs/PRODUCT_DECISIONS.md`** (D1–D16) — standing decision log, holds
   until superseded. Read first, always.
3. **State docs** — `docs/TRACK_101_MAP.md`, `docs/RAMAZ_READINESS.md` —
   current status, not standing decisions.
4. **`docs/gauntlet/`** — design/verification evidence, not sacred spec.
5. **`docs/intel/` + the two root PDFs** — historical raw material, already
   distilled into D1–D16; consult only when a question demands the primary
   source, don't re-read broadly (§4).

**Nothing is "proven"** by a legacy asset, a passing suite, or a prior verdict
(D10). "Classroom-proven" means survived a real classroom session with real
students — nothing has yet. See the readiness ladder in `RAMAZ_READINESS.md`.

## 3. Fable / Sonnet division of responsibility

Fable owns product judgment, prioritization, major tradeoffs. Strong Sonnet
workers own execution: build, integration, verification.

Default loop: **Fable judgment → strong Lead Sonnet build → one focused
independent verification pass when warranted → repair → ship.**

- Don't convene multi-agent debates for reversible decisions one strong
  worker can make.
- Extra workers only when expected value clearly exceeds token cost.
- Full multi-agent gauntlets (economics/gameplay/runtime prosecution +
  judgment, as M1 got) are for foundational refoundations — a new module's
  core design, a runtime architecture call — not per-lesson iteration.

## 4. Token-efficient workflow

Best product per token, not maximum thoroughness per task.

- No broad rereads of `docs/intel/` or the root PDFs — cite by D-number,
  don't re-derive.
- No unnecessary new doc files.
- Update state docs tersely, at end of run — not continuously mid-task.

## 5. Track 101 structure

Four-module spine is founder-fixed (D1, D2) — don't add, remove, or reorder
without an explicit founder call:

- **M1 "The Cap"** — scarcity, opportunity cost, constrained allocation,
  cap-as-institution. L1 Draft Day, L2 Trade Deadline, L3 Why the Line Exists.
- **M2 "Money in Motion"** — revenue, incentives, path dependence. Prototype:
  "The Box Office."
- **M3 "Measuring Players"** — information, uncertainty, evaluation. Not yet
  designed, no legacy anchor (both candidates discarded as quiz-theater, D9).
- **M4 "Draft Day"** — uncertainty, expected value, negotiation taught inside
  draft mechanics, not a separate unit.

Build status per module: `TRACK_101_MAP.md`. Classroom-readiness rung per
module: `RAMAZ_READINESS.md`.

## 6. Economics through consequential action

Every lesson turns on decisions whose consequences the student experiences
and can attribute to their own choice.

- No decision-screens or menu-quizzes wearing sports nouns.
- No XP, levels, badges, leaderboards, or progression systems (D4). The class
  reveal *is* the reward system.
- Real student-to-student interaction only when another participant
  materially changes the economics (hidden rival bid, shared shrinking
  pool) — never multiplayer for spectacle.

## 7. State persistence across lessons

Persist franchise state when yesterday's choice creates today's problem — L1
roster → L2 trade deadline is the canonical case. Reset deliberately when a
controlled comparison needs a clean baseline (L2 → L3). Normalize carried
state only where playability requires it (an absent student gets a stock
franchise, not a broken one).

## 8. Scope discipline

Sports-business motif only, for now. Two recorded future options — preserve,
don't build: BOW course certificates for students; alternate motifs for the
same economics, matched to student interest. Don't build certificate systems,
motif-abstraction layers, commerce, or enterprise features. Scope is Track
101, grades 5–6, only (D6).

## 9. Classroom / teacher / display philosophy

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

## 10. No premature generic engine

Each module owns its state shape and reducer behind the small `LessonModule`
contract (`runtime/src/shared/lessonModule.ts`): `phases`, `initialState`, a
pure `reduce`, three view functions (`studentView`/`teacherView`/`boardView`),
`aggregate`. The runtime never inspects a module's state.

Don't extract a shared "economics engine" or platform abstraction from two
data points. `docs/EMERGING_PRIMITIVES.md` tracks cross-module patterns for
visibility only, not as a mandate to extract — wait for a third, genuinely
different module to strain the contract.

## 11. Verification expectations

New lesson content nearing acceptance gets **one fresh-context, independent
verification pass**, on meaningful issues only: economic truth (no false
lessons, no dominant exploit), student clarity, classroom operability,
reveal/debrief quality, critical reliability, obvious accessibility blockers.
Repair blockers, re-verify only those, ship. Full gauntlets are for
foundational work only (§3).

## 12. End-of-run discipline

- Append new numbered decisions to `PRODUCT_DECISIONS.md` — never rewrite or
  delete history.
- Update `TRACK_101_MAP.md` / `RAMAZ_READINESS.md` if status actually changed.
- Keep `runtime/README.md` accurate on test/build status and known gaps.
- Never claim "passing" or "ready" without having run the command this
  session.
- Leave the tree clean, committed, and pushed to the working branch.

## Repo map

- `docs/` — decision log (`PRODUCT_DECISIONS.md`), state docs
  (`TRACK_101_MAP.md`, `RAMAZ_READINESS.md`, `ECONOMICS_CONCEPT_MAP.md`,
  `EMERGING_PRIMITIVES.md`, `SOURCE_LEDGER.md`), `gauntlet/module-N/` design +
  verification evidence, `intel/` historical source extraction (read rarely).
- `design/` — `VISUAL_IDENTITY.md` (the Cap Room register, dark palette,
  tokens) plus rendered contrast/CVD proof assets.
- `runtime/` — live-session server + three surfaces: `src/shared/`
  (`lessonModule.ts` contract, `phases.ts` canonical phase list), `src/server/`
  (session service, snapshot persistence, HTTP server), `src/modules/` (one
  file per lesson module — `draftDay.ts`, `boxOffice.ts`, `lobbyDemo.ts`),
  `src/client/{play,teach,board}/` (the three surfaces, plus `client/shared/`
  for poll/outbox/storage plumbing), `src/test/` (one file per module/service).

## Commands

Run from `runtime/`:

```
npm install    # install deps
npm run dev    # build + run dev server (localhost:4300 — /teach /play /board)
npm run build  # tsc compile + copy static assets to dist/
npm start      # run compiled build without rebuilding
npm test       # build + run full test suite (node:test)
```

No database, no external service, no internet access required — one Node
process, one machine (D12).
