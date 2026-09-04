# Run index — the October 1 campaign (D59)

One compact pointer file. Canonical records live where they always did; this
says where, and what the exact next action is. Update at every campaign
boundary and before any context compaction. Never a second decision log.

- **Working branch:** `claude/bow-economics-campaign-6blby0` (founder controls merge to main).
- **Baseline at campaign start:** `671b288` — `npm test` 706/706, `npm run boss:doctor` PASS, 2026-09-04.
- **Founder amendments:** D59 (`docs/PRODUCT_DECISIONS.md`), rulings 1–9.
- **Six-week mapping:** D59 table. Student names: THE WINDOW · THE SEASON · THE DEADLINE ·
  THE BILL COMES DUE · YOU DON'T PLAY ALONE · THE BOARD OF GOVERNORS.
- **Bible:** `Bow Sports Capital Economics Bible.pdf` (root; 302 pp). Text extraction is
  session-scratch, not checked in. Consult by section; §36 is stale (grounded at `eadc041`).
- **Boss runs:** `m2-quality-war` (L3, wave 5) and `m2-visual-quality-war` (L3, wave 3) are
  still marked active from the M2 program; neither is this campaign's run. Prototype-mode
  work in this campaign creates no run; a Boss run is opened only at convergence.

## Twelve-cell status (week × band)

| Week | 5–6 | 7–8 | Incoming seam | Outgoing seam |
|---|---|---|---|---|
| 1 THE WINDOW | built, gate open (D58) | built (5 live lines, term choice, 4 namings) | — | none yet |
| 2 THE SEASON | not built | not built | needs L1 seed | — |
| 3 THE DEADLINE | not built | not built | needs L2 seed | needs roster + books → W4 |
| 4 THE BILL COMES DUE | built without carry | no band consumer | none (`fullHouse.ts:2909`) | none |
| 5 YOU DON'T PLAY ALONE | built without carry | no band consumer | none by decision (`hostTheLeague.ts:3205`) | m2l2→m2l3 seed exists |
| 6 BOARD OF GOVERNORS | built, one decision | no band consumer | m2l2 seed, provenance unread | — |

## Operating model (founder call, 2026-09-04)

Fable orchestrates, integrates and judges. Design specs go to opus experience-director agents;
bounded builds go to sonnet builders under strict file ownership; Sports Reality / critic passes
run as their own agents. Never one builder at a time — every wave fans out across independent
files and converges in this file. Builders never certify their own work.

## Campaigns

- **C0 Orient/recharter — DONE 2026-09-04:** D59; old chain retired from the picker; state docs.
- **C1 Ownership + first causal seam — ACTIVE.** Done in tree: `chooseClub` (student picks the
  club; two front offices per club, the second labelled a twin; DEAL ME ONE fallback); the club
  picker on `/play`; `sameLine/carry.ts` (`extractWindowCarry`: committed, taxSalary, holds,
  unattributed, openJobs, signings, forgone, band; refuses the other band; drops a bad desk with a
  reason); `world.ts` gains sourced `taxSalary` + `holds` for all eight clubs (W4_BILL_RESEARCH §8);
  L1 teacher strip in the console's shape + seat→club map on the roster. In flight: Full House
  reads the carry (builder); L1 teach console panel (builder); Press Conference runtime (builder).
- **C2 THE SEASON** — spec in flight (`docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md`).
- **C3 THE DEADLINE** — spec in flight (`docs/gauntlet/module-1/rebuild/W3_THE_DEADLINE_SPEC.md`).
- **C4 THE BILL** — spec in flight (`docs/gauntlet/module-2/W4_THE_BILL_SPEC.md`).
- **C5 W5/W6** — spec in flight (`docs/gauntlet/module-2/W5_W6_SPEC.md`); band plumbing +
  one-student copy in `hostTheLeague.ts` / `writeTheRule.ts` (builder).
- C6 director/stage · C7 gauntlet + founder packet.

## Hot files (reserve before parallel writes)

`runtime/src/modules/sameLine/l1.ts` · `runtime/src/modules/fullHouse.ts` ·
`runtime/src/client/play/main.ts` · `runtime/src/client/teach/main.ts` ·
`runtime/src/client/board/main.ts` · `runtime/src/server/sessionService.ts`.

## Evidence paths

`runtime/src/test/*.test.ts` (unit) · `runtime/scripts/same-line-sweep.mjs` (L1 economics
gate, exit code is the verdict) · `runtime/scripts/e2e-*.cjs` (browser truth; screenshots
under `docs/gauntlet/module-*/screens-*`).

## Unresolved dissent / open findings

- P-VEC fails at `sacramento/cheap-room` (D58): three admissible repairs, none taken.
- Twin desks vs unique clubs (D59 ruling 1): twins kept for October 1; unique-club path recorded.
- Week 6 economics: sharing hurts big markets at equilibrium (Bible §36.5) — taught, not tuned (D59 ruling 5).

## Exact next action

Integrate the C1 wave as builders report: `npm test` (whole tree), the L1 e2e
(`node scripts/e2e-same-line-l1.cjs`), a Full House carry e2e, then commit + push. Then turn each
landed spec into sonnet build waves by file ownership (module file + its own client renderer +
its own test file; the three `main.ts` dispatch lines are integrated by the orchestrator).
