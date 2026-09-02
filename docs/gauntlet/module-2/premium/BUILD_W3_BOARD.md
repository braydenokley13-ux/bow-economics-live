# BUILD_W3_BOARD — wave 3, lane B (`/board`, contract §E1–§E5)

Builder `builder-w3-board`. Port 4452. Scratch copy of `runtime/`; the real
`runtime/dist` was never rebuilt. No `npm run boss` command was run.
Nothing below is certified by me — these are measurements and the things I did
not measure.

## STAGE B1 — the module payload (VERIFIED, handed over)

Status: built, full suite green, both e2e scripts green from the scratch copy.

**Patch:** `<scratch>/handover/B1-fullHouse.patch` (git-apply-clean against head
`621e63b`), plus the new file
`<scratch>/handover/B1-fullHouseBoardW3.test.ts` →
`runtime/src/test/fullHouseBoardW3.test.ts`.
`<scratch>` = `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w3-board`.

### What changed in `runtime/src/modules/fullHouse.ts`

1. **`CurvePoint` gains exactly three fields — `crestIndex`, `seatsOpen`,
   `openBowl`** — each with the contract row and ruling in the comment.
   Contract §E2 names `seatsOpen`/`openBowl` on `CurvePoint` as the authorised
   location; `crestIndex` is required by E2's DESK column ("handle + market
   crest") and is already public on the LOBBY board via `assignments`.
   **No money field was added.** OBSERVED: a `node:test` asserts the row key set
   is exactly `deskHandle, crestIndex, price, turnout, seatsOpen, fillPct,
   soldOut, openBowl` and that no key or value matching
   `cash|renewal|gate|net|revenue|profit|money|total|inarena|bill|spend|debt|books|median`
   reaches the class-results data.

   Why the frame cannot be drawn without them: `fillPct` alone gives a rate but
   not a denominator, and E2 words FILL "of the seats that desk opened" while
   E18 forbids one class-wide capacity number — so the denominator has to be per
   desk and printed. It differs between the two buildings and again on Night 4
   for a desk that opened the bowl. `openBowl` is what says why that desk's
   denominator is larger; without it the larger denominator reads as an error.

2. **`computeAggregate` builds `curves` in `state.deskOrder` order** instead of
   `Object.values(state.desks)` order, with any desk missing from `deskOrder`
   appended rather than dropped. E2 acceptance 4 (stable desk order across all
   five night frames) depends on this; object-key order survives a snapshot
   round-trip only by convention.

3. **New block `W3: the projector`** placed immediately before the module
   object, so the whole column law reads in one place:
   - `BOARD_CLASS_RESULTS_COPY` — every sentence and column label the frame can
     render, as registered constants. Includes `fillQualifier` =
     `"of the seats that desk opened"` and the E16 footnote
     `"No desk's money is on this board. Cash and renewals stay on each desk's
     own screen until the season is read out."`
   - `BOARD_RESULTS_ROWS_PER_PAGE = 8` (Q4).
   - `ClassResultRow` / `ClassResultsGroup` / `ClassResults` types.
   - `classResultsFor(state, agg, cardId)` — returns `null` before the first
     bell; groups by market, then by at most 8 desks per group; each group
     carries its own `capacity` and `capacityNote`; `barBasis` is the building's
     own largest open seat count.
   - `boardRailFor(state, agg)` — E4: night pips plus per-market capacity with
     each market's `capacityNote`. No class-wide capacity number.

4. **`boardView` wiring, two lines.** `classResults` is added to the PLAY
   open-night payload only, built from `settledCards[last]`; the
   `allNightsDone` branch stays held (E19). `rail` is attached once at the
   `tag(...)` return so every frame carries it and the nine payloads cannot
   drift.

### Commands run (this session, from the scratch copy)

- `npm run build` — clean.
- `npm test` — **486 tests, 486 pass, 0 fail** (18.1s).
- `E2E_PORT=4452 node scripts/e2e-m2l1.cjs` — PASS. Its own output:
  "projector fit asserted on 28 board frames x 2 shapes (1366x768 and
  1920x1080): scrollHeight <= clientHeight on every one", "zero console errors
  across every page of both sessions (4-desk arc + 12-desk class-scale run)",
  "R-1 rendered-claim limb: 56 pre-lock desk states audited".
- `E2E_PORT=4452 node scripts/e2e-m2l1-misclick.cjs` — PASS.

### The 9 new tests (`runtime/src/test/fullHouseBoardW3.test.ts`)

1. no class-results frame before the first bell, or while a night is open (R13)
2. the frame carries the last settled night only, and the last bell holds
   everything (E19)
3. no per-desk money, and no money at all, reaches the payload (E16/R-4)
4. fill is per desk over the seats that desk opened, incl. the bowl night (R-2)
5. desk order is stable across all five night frames (E2 acceptance 4)
6. one building per group, and a building past 8 desks pages (Q4) — at 20 desks
   New York splits 8 + 2 with desk order preserved
7. the frame names its night and buildings from registered card/market facts
8. every board frame carries the rail, per-market capacity, and no class-wide
   capacity number (E4/E18)
9. the rail's pips report which nights have settled and never run past five

### Not done in B1 / NOT VERIFIED

- No `/board` renderer change is in B1. The payload is additive and inert until
  stage B2 renders it; head's board renderer ignores unknown view fields.
- Economic Truth has not reviewed the `CurvePoint` change. I am the builder.
- I did not measure whether the extra three fields change the class scatter's
  rendered output. INFERRED (not measured): they cannot, because `fhCurveSvg`
  reads only `marketId, cardId, deskHandle, price, turnout, fillPct, soldOut`.
  The e2e's board-frame fit and back-row-type limbs passed unchanged, which is
  consistent with no visual change but is not a pixel comparison.
- Module 1 is untouched by B1 (the change is inside `fullHouse.ts` only).
