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
- **C1 Ownership + first causal seam — ACTIVE, nearly closed.** Landed: `chooseClub` + club picker (twins, DEAL
  ME ONE); `sameLine/carry.ts` `extractWindowCarry` on the final record (committed · taxSalary · holds ·
  unattributed); sourced `taxSalary`/`holds` for all eight clubs; L1 teach console panel
  (`sameLineL1Teach.ts`, screens under `screens-l1/`); L1 implements the Press Conference contract
  (`spotlightView`/`pressCandidates`); the refused-pick dead-picker regression (hunt on 0dffaf4) fixed at
  `play/main.ts` onRejected. In flight: Press Conference runtime (board render + tests), Full House carry
  intake's five W4 direction items. Owed: an e2e that races two seats for one desk; L1 apron-on-holds repair.
- **C2 THE SEASON — SERVER GREEN, CLIENT RECONCILING.** `sameLine/l2.ts` + `seasonCarry.ts` +
  `seasonData.ts` registered as `m1l2-the-season` (33/33). Every club/twin slot a carried
  franchise does not fill is dealt stock. Press Conference runs through `spotlightView`/
  `pressCandidates` (no `callToPodium`); stretch dropped (ruling 2). Client renderers
  (`sameLineL2*.ts`) built against inferred payloads — field-by-field reconciliation in flight;
  L2 e2e script owed. Research: `W2_SEASON_RESEARCH.md`.
- **C3 THE DEADLINE — ENGINE + CLIENT IN FLIGHT.** Engine (`l3.ts`, `market.ts`, `deadlineCarry.ts`)
  mid-build; `sameLineMarket.test.ts` had 7 red D61 cases at the last full run. Client renderers
  (`sameLineL3*.ts`) landed tsc-clean; SEND OFFER disabled until the engine exposes a public desk
  key (`holderId`, not a seat id), `withdrawAccept` (5-6), `books.taxSalaryText`, per-object
  `annualText`, `naming`, per-desk `settled`, `spotlightView`/`pressCandidates` — all requested.
- **C4 THE BILL — MODULE + CLIENT LANDED, BROWSER TRUTH IN FLIGHT.** `fullHouse.ts` carry intake
  (86/86); play/board/teach render roster note, destinations, night share, coverage, the
  seventh-step ledger. QA harness running; screens will land under `module-2/screens-w4/`.
- **C5 W5/W6 — MODULES IN FLIGHT.** `hostTheLeague.ts`: seed IN (real Full House shape:
  `desks`/`deskOrder`, `marketId`, `cash`, `clearedTheBill`), levy on `gate + localMedia`,
  exact split, six-stage ritual, `poolPosition`, THE VISITOR LINE, `spotlightView`/`pressCandidates`;
  tests being written separately; synthesis/director beats in flight; no client wiring yet.
  `writeTheRule.ts`: THE FLOOR was an unreachable skeleton with a dollar-vs-percent unit bug —
  wave 2 (settlement repoint to the floor ballot, reduce wiring, tests) in flight; views next.
- **Cross-cutting landed:** Press Conference runtime + `scripts/e2e-press-conference.cjs` (20 PASS;
  stuck-podium remount regression fixed); §12.2 safeguards (invite first, decline once, teacher
  first question) in flight; L1 apron-on-holds bounded repair in flight; fresh Economic Truth
  review of the W5/W6 chains and R-7 (W3 real examples) in flight.
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
