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
- **C2 THE SEASON — BUILD WAVE LIVE.** Spec landed (`W2_THE_SEASON_SPEC.md`, rulings in D60).
  Builders: server (`sameLine/l2.ts`, `seasonCarry.ts`, `seasonData.ts`, two tests) · client
  (`client/shared/sameLineL2*.ts/.css` + dispatch lines) · Sports Reality research
  (`W2_SEASON_RESEARCH.md`, job reports + February market).
- **C3 THE DEADLINE — BUILD WAVE LIVE.** Spec landed (`W3_THE_DEADLINE_SPEC.md`, D60). Builder:
  engine (`sameLine/l3.ts`, `market.ts`, `deadlineCarry.ts`, two tests, `same-line-l3-sweep.mjs`).
  Client renderers follow once the engine's payloads are real.
- **C4 THE BILL — BUILD WAVE LIVE.** Direction landed (`W4_THE_BILL_DIRECTION.md`, D60). Builder:
  `fullHouse.ts` carry intake + the five direction items + tests.
- **C5 W5/W6 — BUILD WAVE LIVE.** Spec landed (`W5_W6_SPEC.md`, D60). Builders: `hostTheLeague.ts`
  band + one-student plumbing · `writeTheRule.ts` THE FLOOR institution + band + one-student copy.
  Week 5 pool ritual build follows the plumbing.
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
- L1 apron test: `bandOf(committed)` tests the wall on the cap hit including holds; the real test is Apron Team
  Salary = committed − holds after the transaction (W2_SEASON_RESEARCH.md). Detroit is misclassified by
  $28,834,548. Bounded repair owed to `engine.ts`/`world.ts` under the L1 sweep gate; W2/W3 build the correct rule.
- W2 research dissent adopted (spec rulings 6–11): verdict never a function of price; price twins carry the
  DECISION QUALITY vs OUTCOME moment; prorated ten-day/February charges.

## Exact next action

Integrate as builders report (Press Conference runtime → L1 teach console → Full House → W2
server → W2 client → W3 engine → W6 floor → hostTheLeague plumbing): fix tsc, wire
`spotlightView`/`pressCandidates` onto each module, `npm test` (whole tree), the L1/L2 e2e
scripts, commit + push after each green integration. Then: W3 client renderers, W5 pool ritual,
critic passes (Economic Truth, Teacher Transfer, Player/Gameplay) per landed week.
