# REPAIR 2 — /play composition (pre-lock, results, back-half mirrors, F1)

Assignment `w2-repair-2-composition`, run `m2-visual-quality-war` wave 2.
Commits `7a34460` (F1+D1), `92dbd1f` (pre-lock + settled night), `2bdfca4` (back-half mirrors).
Screens + measurement JSON: `screens-w2-repair-2/`. Nothing here is accepted; the Analyst decides.

## Acceptance measurements (OBSERVED, Playwright, scrollY=0, 4 desks x 5 nights)

| item | 1366x768 | 1024x600 | before |
|---|---|---|---|
| A1 `#fhNights` top | 475 (bottom 761) | 436 | 769 / 788 — outside the viewport |
| A1 rows visible | dots + caption inside the fold | same | none |
| pre-lock `#fhLock` | 304..360 | 268..324 | 664 (1024) |
| A3 first-viewport words | **281** | **223** | 231 — FAILS the "under 120" target |
| A6 PIN band | not rendered on M2; rail chip only | same | 48px band + empty strip |
| B1 causal line (`.fh-renewal-cause`) | 276..364 every night | 274..383 every night | absent |
| B2 `.fh-resale` bottom (sellout) | 603 | 574 | 939-965 |
| B2 `.fh-what` vs `#fhNextNight` | what 424..618, next 645..707 | what above next | next was above what |
| B3 RENEWALS bottom | 414 | **400** | 604 / 639 |
| B3 `#fhNextNight` bottom | 707 max (sellout) | **574** (581 on N5) | 779-789 / top 705 |
| B4 FULL HOUSE | Inter 800, 60px, panel ground | 38px | 40px in a gold banner |
| B4 figures >= 34px on the sellout | **2** (turnout 72, turned-away 40) | 1 | 3 |
| B5 legend | deleted; picture labelled directly | same | 3 swatches, 2 identical |
| C1 REVEAL innerText | **8 distinct md5s, stages 0-7** | — | 1 md5 for 0-5, 1 for 6-7 |
| C2 SYNTHESIS innerText | **6 distinct md5s, pages 1-6** | — | 1 md5 for all six |
| C4 dead region | LOBBY 182 · REVEAL 22 · SYNTHESIS 100 · COMPLETE 110 | — | 401 / 268 / 471 / 415 |
| forbidden vocabulary in `#gameBody` | 0 on every PLAY and results state | 0 | 0 |

HOOK still renders 2 negating uses of "preview" (`HOUSE_RULES[0]`, the allowed case) — 0 elsewhere.

## Commands run (scratch copy of `runtime/` only; the real `runtime/dist` was never rebuilt)
- `npm test` in the scratch copy: **468 pass / 0 fail** (three times: after F1, after stage 2, after stage 3).
- `E2E_PORT=4462 node scripts/e2e-m2l1.cjs`: **exit 0**, zero console errors, 56 pre-lock states audited by the R-1 limb.
- `E2E_PORT=4463 node scripts/e2e-m2l1-misclick.cjs`: **exit 0**.
- F1 proof, mirror-diff proof and the measurement matrix: scratch scripts, outputs in `screens-w2-repair-2/`.

## Every new student-facing string (all registered in `fullHouse.ts`; Economic Truth reviews these)
1. `spendShortRuleFor(m)` — "Every $100 here brings about 1 extra person NEXT night, and nobody extra tonight." (Memphis: $60)
2. `renewalShortRuleFor(m)` — "Renewals follow your $24 season plan: price well UNDER it and the plan looks like a waste, price ABOVE what tonight is worth to them and they quit." (Memphis: $16)
3. `nightFactLineFor` — "You charged $10 · Saturday · draw 97/100"
4. `repeatCallbackLineFor` — "Night 1's card again · $46 → 10,878 then · $24 → 16,187 tonight"
5. `dialCarriedLineFor` — "Your dial is at $24 — the price you charged on Night 2."
6. `renewalFloorLineFor` — "The renewals rule takes at most 20 points off in one night. Tonight's price asked for more than that."
7. `extraSeatsLabel` — "MORE SEATS" (also replaces `chainLabels.bowl` "UPPER BOWL")
8. `cameLabel` — "came — the lit seats"
9. `openSeatsLabel` — "empty — the dark seats above the line"
10. `moreSeatsOpenLabel` — "More seats open"
11. `moreSeatsClosedLabel` — "More seats closed"
12. `seasonQualifier` — "season so far"
13. `tonightQualifier` — "tonight"
14. `noNightsYetLine` — "No nights yet. Your first dot lands here after the first bell."
15. `moreLabel` — "More about tonight"

Client literals added (no economic claim; F1/B8 plumbing, not module copy):
- "This desk was opened on another device. Rejoin with your PIN." (`play/main.ts`, the signed-out line)
- "signed out" (sync label)
- The two suppressed rejection reasons are the module's own strings, matched not printed.
