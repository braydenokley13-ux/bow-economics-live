# REPAIR W2-4 — Full House (M2 L1) bounded repair after the wave-2 re-checks

Boss run `m2-visual-quality-war`, wave 2, assignment `w2-repair-4`, builder `builder-r4`.
Baseline: head a34b292 (product f65e865). Product commits on `claude/economics-boss-module-2-8s591f`:
80c732c (R4-1/R4-2) · 297de88 (R4-3/R4-8) · 8239cb0 (R4-4/R4-5) · d9c5b1b (R4-6/R4-7). Not pushed.
Builder does not certify acceptance; every "met" below is a measurement, not a verdict.

Instrument: scratch copy of `runtime/` built from the same source (the real `runtime/dist` was never rebuilt),
Playwright driver `scratchpad/boss/w2-repair-4/drive.cjs` (4 desks x 5 nights, scrollY=0; d0/d2 at 1366x768,
d1/d3 at 1024x600; d0/d1 $40/$60/$80/$100/$40 with d1 opening the bowl + spending on Night 4; d2 $16 with
Night 2 untouched; d3 $10 x5 with the bowl open on Night 4). Frames + `measure.json` for both runs are in
`screens-w2-repair-4/{before,after}/` (see `MANIFEST.md`). Arena frames from `arena-proof.cjs`.

## Acceptance table (BEFORE a34b292 -> AFTER d9c5b1b)

| item | criterion (R4 brief) | before | after | status |
|---|---|---|---|---|
| R4-1 | 1024x600: `#fhNextNight.bottom <= 600` on every settled night incl. sellouts (bowl closed / open) and bowl+spend | d3 N2 sellout 623, d3 N4 sellout+bowl 662, d1 N4 bowl+spend 578; range 539-662 | d3 N2 468, d3 N4 497, d1 N4 483; range 440-497 (10/10 nights) | met (observed) |
| R4-1 | 1024x600: sellout turned-away figure `bottom <= 600` | 685 / 710 | 448 / 448 (34px figure inside WHO CAME; turnout hero stays largest at 72px) | met |
| R4-1 | 1024x600: `#fhNights.top < 600` on Night 4 pre-lock | 586 / 566 | 456 / 436 (bowl plate moved beside the nights card, not above) | met |
| R4-1 | turnout hero remains the largest figure | 72px | 72px unchanged | met |
| R4-2 | `.fh-dial-carried` renders when Night N opens at a price charged before | never rendered (0/20 pre-lock frames) | d2 N3/N4/N5: "Your dial is at $24 — the price you charged on Night 2." | met (observed) |
| R4-2 | locking the untouched dial still charges that price | — | d2 N3 untouched lock settled at $24 (`LOCKED AT $24`, headline "… AT $24"); e2e-m2l1 + misclick PASS unchanged | met |
| R4-3 | dot chart: y fitted to data, labels inside plot, zero intersecting label boxes, no leader lines, no `<path>` | not measured by this driver (its before selector hit the badge icon); critic evidence: fixed 0–120 axis, overprint, `<path>` join | ladder ($40..$100..$40): 4 labels / 5 dots, 0 intersections, 0 outside; $16 x5: 3/5, 0, 0; $10 x5: 2/5, 0, 0; `<path>` count 0 on all 20 pre-lock + 7 closed/reveal charts; axis ticks at fitted yMin/yMax (500-step) | met (observed) |
| R4-4a | results frame `.fh-renewal-cause` = the full registered renewals rule (tent), not the short rule | short rule "Renewals follow your $24 season plan: price well UNDER … and they quit." | full rule, four clauses: "Season plan: $24 a seat. Price well UNDER that … Price ABOVE what they think tonight is worth and they quit. In between, the plan looks like a bargain and more come back." (one line per clause at 1366, paragraph at 1024) | met; unit test `R4-4a` |
| R4-4b | floor line only when the 20-pt clamp binds; never on the 0-floor | fired on d0/d1 N5 (0% -> 0%) | fires on 50->30 and 30->10 only; silent on 10->0 and 0->0 (`renewalFloorBinds`; test asserts `[[50,30,-20,true],[30,10,-20,true],[10,0,-10,false]]`) | met; unit test `R4-4b` |
| R4-4c | SIMPLIFICATIONS says "about a quarter (measured 25.9%)" | "about a fifth" | "about a quarter of the seat area (measured 25.9%)"; risk line "about a quarter of the drawn seats" | met; unit test `R4-4c / R4-5` |
| R4-5 | Two Peaks literal and "Nothing. Tonight is the last night…" registered through the module; `clientClaims.test.ts` fails on any unregistered economic sentence in the Full House renderer | two literals in `play/main.ts` | 9 new `FULL_HOUSE_UI_COPY` keys + `twoPeaksNoteFor` / `spendFactLineFor`; new test "R-H / E4: every sentence the Full House renderer prints is a module string" (>=5-word runs in the Full House region must be in fullHouse.ts, `// claim-ok:`, or a 4-entry STRUCTURAL list that fails when stale) | met |
| R4-6 | HOOK: five night cards as one slate row (day / visitor / draw / TV), one hero line, slate `bottom <= 768` at 1366, first three cards visible at 1024x600, <= 90 words in first viewport, no paragraph > 2 lines | words 361 (1366) / 243 (1024); slate 241..382 (prose-first page) | slate 557..747 at 1366 (5/5 visible); 331..487 at 1024 (5/5 visible); words in fold 110 at 1366 (84 in the main column, 26 in the rail) / 140 at 1024 (message card enters the fold); message split one `<p>` per sentence; longest `<p>` in `#gameBody` = 6 line-heights (driver measures the whole page incl. house rules below the fold — HOOK-only paragraph length NOT VERIFIED) | partial: word ceiling met for the main column only |
| R4-7 | rejoin PIN chip fully inside the viewport at both sizes | 746..781 at 1366 (lobby, every pre-lock, HOOK 1143..1178); 73..108 at 1024 | 710..745 at 1366 on lobby, HOOK and all 10 pre-lock frames; 73..108 at 1024 (rail `align-self:flex-start; height: calc(100vh - 72px)`, `height:auto` at the tight breakpoint) | met (observed) |
| R4-7 | SYNTHESIS page 1 on /play differs from COUNTERFACTUAL | distinct (cf e6873f91b4 vs p1 7eb5b9bdfa; mirror present) | distinct (854cea0b60 vs 957d55a2c9; mirror present, chart 4L/5D) | not reproduced before or after (4 driver runs) |
| R4-8 | outer deck shuttered whenever not open; base pool = lower two decks; SIMPLIFICATIONS updated; three ~60% frames | not-offered and offered-declined frames differed (bowlSeats gated the shutter) | not-offered == offered-declined (md5 de2841134d33), open a00fbd4d5c3c; `arena.ts` `bowlOpen = !!opts.bowlOpen` only; SIMPLIFICATIONS "shuttered on every night it is not open … The ordinary building is the lower two decks." | met (observed) |

Regressions carried by the fold work (observed, recorded as gaps): at 1366 the settled-night `#fhNextNight.bottom` rose
from 531-633 to 595-697 because the full four-clause rule is taller than the short one (still <= 768; the sellout
turned-away figure sits at 730/755 unchanged). The 1024 nights card top on Night 1 stays 436 (unchanged).

## Commands run (scratch copy, all this session)

| command | result |
|---|---|
| `npm run build` (scratch) | exit 0 |
| `npm test` (scratch; `docs/` and `design/` symlinked so `m2Harnesses.test` resolves the stage-0 harnesses) | 469 pass, 0 fail after the symlink (3 harness tests fail without it — path resolution, not product) — `npm-test-final.log` |
| `node scripts/e2e-m2l1.cjs` (E2E_PORT=4452) | PASS, exit 0 — `e2e-m2l1.log` |
| `node scripts/e2e-m2l1-misclick.cjs` (E2E_PORT=4453) | PASS, exit 0 — `e2e-misclick.log` |
| `node drive.cjs` before (a34b292 build) / after (d9c5b1b build) | `screens-w2-repair-4/{before,after}/measure.json`, 0 console errors either run |
| `node arena-proof.cjs` | `after/arena-60pct-*.png` |

Real `runtime/dist` not rebuilt; Boss CLI not run; ports 4451-4453 released.

## Strings registered this repair (all in `FULL_HOUSE_UI_COPY`, mirrored in `fullHouse.test.ts` REQUIRED keys)

- `twoPeaksTitle` — "The two peaks — Night 3, your market"
- `twoPeaksTicketLabel` — "Tickets alone made the most at"
- `twoPeaksTotalLabel` — "Tickets + what they spent inside peaked at"
- `noTomorrowLine` — "Nothing. Tonight is the last night of the five — money spent on the event tonight has no night left to land on."
- `stockNightLine` — "This night was covered for you before you sat down."
- `autoNightLine` — "Nobody locked this night — the bell settled it at the season-plan price."
- `inArenaNote` — "what those same people spent inside"
- `bowlPaidNote` — "paid whether they fill or not"
- `renewalsCaption` — "season-ticket holders coming back"

Helpers (module-side, unit-tested): `renewalDeltaRaw`, `renewalFloorBinds`, `renewalRuleLinesFor`,
`twoPeaksNoteFor` ("$X lower — N clicks of the dial. The cheaper ticket made more money."),
`spendFactLineFor` ("You also put $5,000 into the night[ with the more seats open]."). Payload additions:
`renewalRuleLines`, `viewNight.spendLine`, `viewNight.renewalAtFloor` (now clamp-aware), `twoPeaks[].note`.

Nothing pre-lock is derived from the pending action (BC-4): the carried-dial cue compares the dial to the
server's opening price only. CASH and RENEWALS are never summed. No timer, no reward chrome.

## Known gaps

1. R4-6 word ceiling: 110 words in the 1366 fold (84 main column + 26 rail), 140 at 1024 where the message card enters the fold.
2. R4-6 "no paragraph longer than two lines" NOT VERIFIED in isolation (driver measures all of `#gameBody`).
3. R4-7 SYNTHESIS page-1 == COUNTERFACTUAL never reproduced (before or after); the mirror renders in every run.
4. 1366 settled-night NEXT bottoms rose 30-65px (595-697) from the taller full rule; still inside 768.
5. On frames taller than the viewport the rail ends at `100vh - 72px`, leaving the frame's lower band without a rail (below the fold).
6. The module opens each night's dial at the plan price, not the last charged price, so the carried-dial cue fires only when the plan price equals a previously charged price (d2 N3+ here). Changing that is a module decision, out of scope.
7. Scratch `m2Harnesses.test` needs `docs/` reachable from the scratch root; not a product defect.
