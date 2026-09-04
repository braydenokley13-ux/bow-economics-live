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

## Campaigns

- **C0 Orient/recharter — DONE 2026-09-04:** D59; old chain retired from the picker; state docs.
- **C1 Ownership + first causal seam — ACTIVE.** L1 club choice (curated, twins labelled,
  no first-arrival privilege beyond the second slot); L1 seed export (commitments, line
  position, open jobs, club, band); Full House reads an `m1l1-the-window` seed and opens
  on the desk's own obligation with a stated units bridge.
- C2 THE SEASON + Press Conference/Tape · C3 THE DEADLINE · C4 THE BILL · C5 pool + two
  institutions · C6 director/stage · C7 gauntlet + founder packet.

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

C1: add `chooseClub` to `sameLine/l1.ts` (student picks a club; two slots per club; the
second slot is labelled a twin), export `carryOut()` for the seed, and write the
`m1l1-the-window` seed reader in `fullHouse.ts`.
