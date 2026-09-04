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
- **C2 THE SEASON — SERVER + CLIENT LANDED, BROWSER TRUTH IN FLIGHT.** `m1l2-the-season` (33/33);
  client reconciled to the real reducer (fixed-price market, `claimDesk {sourceSeatId}`, the
  inferred negotiation UI removed). `scripts/e2e-same-line-l2.cjs` being written.
- **C3 THE DEADLINE — ENGINE FINISHING.** Client renderers landed; engine adding the public desk key
  (`holderId`/`toDesk`), `withdrawAccept` (5-6), `books.taxSalaryText`, per-object `annualText`,
  `naming` (with a `real` line, D62), per-desk `settled`, `spotlightView`/`pressCandidates`.
  R-7 real examples adopted into §9 (`W3_R7_REAL_EXAMPLES.md`); §3 R1 text now matches D61.
- **C4 THE BILL — LANDED; QA FINDINGS BEING FIXED.** Browser truth (`scripts/e2e-w4-bill.cjs`,
  `module-2/screens-w4/`): linked and unlinked rooms play; board ledger at step 7 carries no seat
  id. Defects: RENEWALS "%" at 5-6, doc references on the student screen, `-$` outflows at 5-6 —
  builder on it. /teach could not link Full House at all — fixed (table-driven links for the chain).
- **C5 W5/W6.** W5 landed on all three surfaces (levy line, how-you-got-here, pool position, six-
  stage ritual with VISITOR + ROAD lines, teacher stage controls, director beats) — 89/89;
  `scripts/e2e-w5-pool.cjs` being written; board/teach visuals reuse generic classes (Visual
  pass owed). W6: THE FLOOR settlement repointed to the floor ballot in dollars, reducer wired,
  63/63; D62 feasibility sweep + level retune + harness P6 repoint in flight; views next.
- **Cross-cutting landed:** Press Conference §12.2 safeguards (invite first, decline once per
  session, teacher first question) — 30/30, browser harness being extended. Fidelity notes for
  the founder: the Bible says "first Press Conference of the course is invited" and "decline once
  per course"; the build gates every shortlist call through invite and counts the decline per
  session (no cross-session seat memory exists yet). Suite: 876/877 at the last full run (P6 since repointed and green in isolation); a whole-tree
  run is owed once the in-flight builders land. L1 e2e green both bands; L2 e2e green both bands
  (unlinked, found the /teach gap now fixed and the modeled-July gap, D63); W5 e2e found three
  board/play defects, fixed, rerun in flight. L1 apron-on-holds repair in flight.
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

Integrate as builders report: W6 floor views (wave 3b, engine payload contract → client wiring
on /play /teach /board → e2e), W4 5-6 percent/negative leaks + unlinked-room band, W2 unlinked
room modeled July (D63), L3 browser harness, Sports Reality real lines for the five owed naming
cards, L1 apron repair (sweep running). Then `npm test` (whole tree) + every `e2e-*.cjs` for a
green checkpoint, commit + push. Then: critic passes per landed week (Teacher Transfer,
Player/Gameplay, Classroom/Projector, Visual Experience on the W5 ritual), R-14 no-bowl
counterfactual press at 7–8, RUN_INDEX/TRACK_101_MAP/RAMAZ_READINESS/runtime README.
