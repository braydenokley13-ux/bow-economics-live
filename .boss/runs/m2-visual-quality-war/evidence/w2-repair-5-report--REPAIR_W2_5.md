# W2 REPAIR 5 — Full House /play: the settled night (R5-1 … R5-5)

Builder `builder-r5`, run `m2-visual-quality-war`, wave 2, assignment `w2-repair-5`.
Head at start: `10755ed`. Nothing here is certified by me — this is what I changed and
what I measured. Labels: OBSERVED (seen in the DOM or a frame), INFERRED (read from
source), NOT VERIFIED.

Method: a 12-desk, 5-night class driven end to end against a scratch build with
Playwright (`drive5.cjs` in the assignment scratch folder), four price configurations
crossed with both viewports and both markets: the ladder `$46/$60/$80/$100/$46` (a
same-price pair), `$10 x5` with the upper bowl opened and the event dial maxed on
Night 4 (the densest settled state), `$120 x5` (zero turnout), `$16 x5` (a flat
season), plus one desk that never locks so the bell auto-commits Nights 1–3. Every
number below is `getBoundingClientRect()` at `scrollY = 0`, 1366x768 and 1024x600.

## Commands run this session (scratch copy of `runtime/`, not the real `dist/`)

| command | exit |
| --- | --- |
| `npm test` (build + 477 tests) | 0 |
| `node scripts/e2e-m2l1.cjs` (E2E_PORT=4452) | 0 |
| `node scripts/e2e-m2l1-misclick.cjs` | 0 |

One earlier `e2e-m2l1.cjs` run exited 1 against a stale server left holding port 4452
by the previous run; killing it and re-running the same build gave exit 0. OBSERVED,
harness artifact, not a product finding. A second scratch artifact worth recording:
`copy-static.mjs` reads `<runtime>/../design/assets`, so a scratch copy of `runtime/`
alone builds a dist whose eight `client/assets/*.svg` 404 — both e2e scripts fail on
console errors until `design/` is linked next to it.

## R5-1 — the advance control was clipped on the densest settled state

At head, `#fhNextNight` sat under WHAT HAPPENED at 1366x768 — the column that grows
with the night (bowl receipt, spend verdict, resale sentence, the Night-5 callback).
I reproduced the class of defect browser-qa reported (`w2-final-bqa-1366-overflow`,
bottom 811): worst in my matrix was **bottom 790** on a Night-5 sellout that repeats an
earlier card, and 736 on bowl-open + event money + sellout. I did not reproduce 811
exactly; theirs is a 12-desk class, mine a different seating.

The control now renders under the CASH chain — the shortest column — at both shapes,
which is where 1024x600 already put it in repair 4. Its position no longer depends on
how much the night has to say. The two columns are also better balanced: the ~250px of
empty CASH column the advisory named now carries the control.

| desk (market, viewport) | night | state | NEXT bottom BEFORE | NEXT bottom AFTER | turned-away bottom AFTER | figures >=34px AFTER | dead region AFTER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| d1-1366-cheap-NY (vh 768) | N1 | sellout | 732 | 511 | 717 | 2 (19,800@72, 870@40) | 4 |
| d1-1366-cheap-NY (vh 768) | N2 | sellout | 732 | 511 | 717 | 2 (19,800@72, 3,000@40) | 4 |
| d1-1366-cheap-NY (vh 768) | N3 | ordinary | 595 | 479 | n/a | 1 (19,410@72) | 4 |
| d1-1366-cheap-NY (vh 768) | N4 | sellout + bowl open + event money | 736 | 573 | 742 | 2 (22,200@72, 4,750@40) | 0 |
| d1-1366-cheap-NY (vh 768) | N5 | sellout + repeat card | 790 | 497 | 717 | 2 (19,800@72, 820@40) | 4 |
| d2-1366-ladder-MEM (vh 768) | N1 | ordinary | 630 | 479 | n/a | 1 (4,690@72) | 4 |
| d2-1366-ladder-MEM (vh 768) | N2 | ordinary | 630 | 479 | n/a | 1 (5,810@72) | 4 |
| d2-1366-ladder-MEM (vh 768) | N3 | zero turnout | 595 | 479 | n/a | 1 (0@72) | 4 |
| d2-1366-ladder-MEM (vh 768) | N4 | ordinary | 595 | 479 | n/a | 1 (10,750@72) | 4 |
| d2-1366-ladder-MEM (vh 768) | N5 | ordinary | 625 | 465 | n/a | 1 (3,740@72) | 4 |
| d3-1366-high-NY (vh 768) | N1 | zero turnout | 630 | 479 | n/a | 1 (0@72) | 4 |
| d3-1366-high-NY (vh 768) | N2 | zero turnout | 630 | 479 | n/a | 1 (0@72) | 4 |
| d3-1366-high-NY (vh 768) | N3 | zero turnout | 595 | 479 | n/a | 1 (0@72) | 4 |
| d3-1366-high-NY (vh 768) | N4 | ordinary | 595 | 479 | n/a | 1 (10,450@72) | 4 |
| d3-1366-high-NY (vh 768) | N5 | zero turnout | 608 | 465 | n/a | 1 (0@72) | 4 |
| d4-1366-flat16-MEM (vh 768) | N1 | ordinary | 595 | 479 | n/a | 1 (14,740@72) | 4 |
| d4-1366-flat16-MEM (vh 768) | N2 | sellout | 697 | 511 | 717 | 2 (17,794@72, 238@40) | 4 |
| d4-1366-flat16-MEM (vh 768) | N3 | ordinary | 595 | 479 | n/a | 1 (14,526@72) | 4 |
| d4-1366-flat16-MEM (vh 768) | N4 | sellout | 697 | 511 | 742 | 2 (17,794@72, 7,256@40) | 0 |
| d4-1366-flat16-MEM (vh 768) | N5 | ordinary | 625 | 465 | n/a | 1 (15,340@72) | 4 |
| d5-1024-cheap-NY (vh 600) | N1 | sellout | 468 | 468 | 458 | 2 (19,800@64, 870@34) | 0 |
| d5-1024-cheap-NY (vh 600) | N2 | sellout | 468 | 468 | 458 | 2 (19,800@64, 3,000@34) | 0 |
| d5-1024-cheap-NY (vh 600) | N3 | ordinary | 454 | 454 | n/a | 1 (19,410@64) | 0 |
| d5-1024-cheap-NY (vh 600) | N4 | sellout + bowl open + event money | 526 | 526 | 458 | 2 (22,200@64, 4,750@34) | 0 |
| d5-1024-cheap-NY (vh 600) | N5 | sellout + repeat card | 454 | 454 | 458 | 2 (19,800@64, 820@34) | 0 |
| d6-1024-ladder-MEM (vh 600) | N1 | ordinary | 454 | 454 | n/a | 1 (4,690@64) | 0 |
| d6-1024-ladder-MEM (vh 600) | N2 | ordinary | 454 | 454 | n/a | 1 (5,810@64) | 0 |
| d6-1024-ladder-MEM (vh 600) | N3 | zero turnout | 454 | 454 | n/a | 1 (0@64) | 25 |
| d6-1024-ladder-MEM (vh 600) | N4 | ordinary | 454 | 454 | n/a | 1 (10,750@64) | 0 |
| d6-1024-ladder-MEM (vh 600) | N5 | ordinary | 440 | 440 | n/a | 1 (3,740@64) | 0 |
| d7-1024-high-NY (vh 600) | N1 | zero turnout | 454 | 454 | n/a | 1 (0@64) | 25 |
| d7-1024-high-NY (vh 600) | N2 | zero turnout | 454 | 454 | n/a | 1 (0@64) | 25 |
| d7-1024-high-NY (vh 600) | N3 | zero turnout | 454 | 454 | n/a | 1 (0@64) | 25 |
| d7-1024-high-NY (vh 600) | N4 | ordinary | 454 | 454 | n/a | 1 (10,450@64) | 0 |
| d7-1024-high-NY (vh 600) | N5 | zero turnout | 440 | 440 | n/a | 1 (0@64) | 25 |
| d8-1024-flat16-MEM (vh 600) | N1 | ordinary | 454 | 454 | n/a | 1 (14,740@64) | 0 |
| d8-1024-flat16-MEM (vh 600) | N2 | sellout | 468 | 468 | 458 | 2 (17,794@64, 238@34) | 0 |
| d8-1024-flat16-MEM (vh 600) | N3 | ordinary | 454 | 454 | n/a | 1 (14,526@64) | 0 |
| d8-1024-flat16-MEM (vh 600) | N4 | sellout | 468 | 468 | 458 | 2 (17,794@64, 7,256@34) | 0 |
| d8-1024-flat16-MEM (vh 600) | N5 | ordinary | 440 | 440 | n/a | 1 (15,340@64) | 0 |
| d9-1366-auto-NY (vh 768) | N1 | ordinary | 634 | 479 | n/a | 1 (16,862@72) | 4 |
| d9-1366-auto-NY (vh 768) | N2 | sellout | 736 | 511 | 717 | 2 (19,800@72, 514@40) | 4 |
| d9-1366-auto-NY (vh 768) | N3 | ordinary | 634 | 479 | n/a | 1 (17,462@72) | 4 |
| d9-1366-auto-NY (vh 768) | N4 | ordinary | 595 | 479 | n/a | 1 (15,150@72) | 4 |
| d9-1366-auto-NY (vh 768) | N5 | ordinary | 660 | 465 | n/a | 1 (11,603@72) | 4 |
| d10-1366-cheap-MEM (vh 768) | N1 | ordinary | 595 | 479 | n/a | 1 (16,750@72) | 4 |
| d10-1366-cheap-MEM (vh 768) | N2 | sellout | 697 | 511 | 717 | 2 (17,794@72, 1,441@40) | 4 |
| d10-1366-cheap-MEM (vh 768) | N3 | ordinary | 595 | 479 | n/a | 1 (15,300@72) | 4 |
| d10-1366-cheap-MEM (vh 768) | N4 | sellout + bowl open + event money | 736 | 573 | 742 | 2 (19,594@72, 5,231@40) | 0 |
| d10-1366-cheap-MEM (vh 768) | N5 | ordinary | 683 | 465 | n/a | 1 (16,860@72) | 4 |
| d11-1366-bowl-part-NY (vh 768) | N1 | ordinary | 595 | 479 | n/a | 1 (19,038@72) | 4 |
| d11-1366-bowl-part-NY (vh 768) | N2 | sellout | 697 | 511 | 717 | 2 (19,800@72, 1,806@40) | 4 |
| d11-1366-bowl-part-NY (vh 768) | N3 | ordinary | 595 | 479 | n/a | 1 (18,318@72) | 4 |
| d11-1366-bowl-part-NY (vh 768) | N4 | sellout + bowl open + event money | 736 | 573 | 742 | 2 (22,200@72, 4,050@40) | 0 |
| d11-1366-bowl-part-NY (vh 768) | N5 | ordinary | 683 | 465 | n/a | 1 (17,888@72) | 4 |
| d12-1366-bowl-part-MEM (vh 768) | N1 | ordinary | 595 | 479 | n/a | 1 (14,740@72) | 4 |
| d12-1366-bowl-part-MEM (vh 768) | N2 | sellout | 697 | 511 | 717 | 2 (17,794@72, 238@40) | 4 |
| d12-1366-bowl-part-MEM (vh 768) | N3 | ordinary | 595 | 479 | n/a | 1 (14,526@72) | 4 |
| d12-1366-bowl-part-MEM (vh 768) | N4 | sellout + bowl open + event money | 736 | 573 | 742 | 2 (19,594@72, 5,456@40) | 0 |
| d12-1366-bowl-part-MEM (vh 768) | N5 | ordinary | 683 | 465 | n/a | 1 (15,500@72) | 4 |
Worst case after, across all 60 settled desk-nights: `#fhNextNight` bottom **573** at
1366x768 and **526** at 1024x600 (repair 4's band, unregressed). Turned-away figure
bottom worst **742** at 1366 and **545** at 1024 — inside the fold on every sellout, and
the second-largest figure on the frame in every case. The turnout is the largest figure
on all 60 frames, and no frame carries more than two figures at >=34px. Largest
contiguous dead region below the last content block: **69px** (a zero night at 1024).
No horizontal scroll at either shape. OBSERVED.

## R5-2 — the settled night now explains its turnout

New registered helper `turnoutCauseFor` (`runtime/src/modules/fullHouse.ts`), carried as
`turnoutCause` by `viewNight`, rendered verbatim under the hero as `.fh-turnout-cause`.
Four limbs — sold out with a queue, exact fill, nobody came, ordinary night — each
opening with the night's own card, so two materially different nights never read the
same. It names which side bound the crowd: what people would pay at this price on this
card, or the seats the desk opened.

| night | rendered turnout cause |
| --- | --- |
| zero turnout (desk 3 NY, N1 at $120) | Night 1 · at $120, nobody wanted in, so all 19,800 seats you opened stayed empty. The limit was the price, not the seats. |
| sellout with a queue (desk 1 NY, N4 at $10, bowl open + $120,000 event money) | Night 4 · at $10, more people wanted in than the 22,200 seats you opened. The limit was the seats, not the price. |
| ordinary night (desk 2 Memphis, N1 at $46) | Night 1 · at $46, 4,690 people wanted in and you opened 17,794 seats. The limit was the price, not the seats. |
Claim discipline: both quantities in the sentence are already printed on the same frame
(the turnout in the hero; the turned-away count on a sellout), so it discloses no new
point of the demand curve — no slope, no base, no other price. It grades nothing, it
previews nothing, and it says nothing about the renewals book. INFERRED from the model,
asserted in `src/test/fullHouse.test.ts` ("R5-2: every settled night carries a turnout
cause…"): the string equals `turnoutCauseFor` of the night's own settled facts on all
five nights of two seasons, a sellout season and a zero season never render the same
sentence for the same night, and no rendered cause matches the grading/preview
vocabulary.

Room paid for without shrinking the hero: the WHO CAME card's own flex gap (`.m2-result-hero`
is a wrapping flex row with a 26px gap, so a fourth child cost 26px of air — the card now
sets 14px), the fill line that was printed twice (hero card, and again word for word under
the drawing — the duplicate is gone), and 32px of arena frame at 1366 (150 -> 118; 1024
unchanged at 104). The lit bowl, its labels and the turned-away figure all stay in the
same frame as the hero: worst arena card bottom 755 at 1366x768. OBSERVED.

## R5-3 — the chart stops dropping the pair the Night-5 callback names

De-collision was pure suppression from a two-row candidate list, so at a same-price pair
the earlier label vanished under the later one. `DotPoint` now takes `priority`; `/play`
marks the latest night and the night whose card it repeats (`slate[].repeatOf`), those
are placed first, and every label is tried against every row the plot has, nearest to its
mark first, centred and then to either side. The no-intersection rule is unchanged; the
per-character width estimate is corrected 6.3 -> 7.8 units, because boxes that cleared in
the old model still intersected in the DOM (that is why the first attempt at this repair
produced labelled-but-overlapping frames).

| desk | frame | labels/dots BEFORE | labels/dots AFTER | intersecting boxes AFTER | labels AFTER |
| --- | --- | --- | --- | --- | --- |
| d2-1366-ladder-MEM | books closed | 4/5 | 5/5 | 0 | N5 $46 · 3,740 · N4 $100 · 10,750 · N3 $80 · 0 · N2 $60 · 5,810 · N1 $46 · 4,690 |
| d2-1366-ladder-MEM | REVEAL | 4/5 | 5/5 | 0 | N5 $46 · 3,740 · N4 $100 · 10,750 · N3 $80 · 0 · N2 $60 · 5,810 · N1 $46 · 4,690 |
| d4-1366-flat16-MEM | books closed | 3/5 | 5/5 | 0 | N5 $16 · 15,340 · N4 $16 · 17,794 · N3 $16 · 14,526 · N2 $16 · 17,794 · N1 $16 · 14,740 |
| d4-1366-flat16-MEM | REVEAL | 3/5 | 5/5 | 0 | N5 $16 · 15,340 · N4 $16 · 17,794 · N3 $16 · 14,526 · N2 $16 · 17,794 · N1 $16 · 14,740 |
| d6-1024-ladder-MEM | books closed | 4/5 | 5/5 | 0 | N5 $46 · 3,740 · N4 $100 · 10,750 · N3 $80 · 0 · N2 $60 · 5,810 · N1 $46 · 4,690 |
| d6-1024-ladder-MEM | REVEAL | 4/5 | 5/5 | 0 | N5 $46 · 3,740 · N4 $100 · 10,750 · N3 $80 · 0 · N2 $60 · 5,810 · N1 $46 · 4,690 |
| d8-1024-flat16-MEM | books closed | 3/5 | 5/5 | 0 | N5 $16 · 15,340 · N4 $16 · 17,794 · N3 $16 · 14,526 · N2 $16 · 17,794 · N1 $16 · 14,740 |
| d8-1024-flat16-MEM | REVEAL | 3/5 | 5/5 | 0 | N5 $16 · 15,340 · N4 $16 · 17,794 · N3 $16 · 14,526 · N2 $16 · 17,794 · N1 $16 · 14,740 |
Across all 72 rendered chart frames in the matrix (pre-lock, books-closed and REVEAL, both
viewports): **0 intersecting label boxes**, and the callback pair (N5 and the night it
repeats) labelled on every books-closed and REVEAL frame. Five pre-lock frames still drop
one non-priority label where five nights share one price in a 1024-tall plot — see
known-gaps. Unit tests: `src/test/dotChart.test.ts` (three tests, the two configurations
above plus priority-over-recency). OBSERVED + unit.

## R5-5 — the carried-dial cue no longer names a night the pair did not price

`dialCarriedLine` matched on price value alone, so a desk whose night the bell
auto-committed at the plan price was told "the price you charged on Night 3" about a price
nobody at that desk chose. Nights with `auto` (bell) or `stock` (desk manager covered a
late seat) are now excluded from the match.

| desk | night | dial | carried cue BEFORE | carried cue AFTER |
| --- | --- | --- | --- | --- |
| d9-1366-auto-NY | pre-lock N2 | $24 | Your dial is at $24 — the price you charged on Night 1. | (none) |
| d9-1366-auto-NY | pre-lock N3 | $24 | Your dial is at $24 — the price you charged on Night 2. | (none) |
| d9-1366-auto-NY | pre-lock N4 | $24 | Your dial is at $24 — the price you charged on Night 3. | (none) |
| d9-1366-auto-NY | pre-lock N5 | $24 | Your dial is at $24 — the price you charged on Night 3. | (none) |
| d4-1366-flat16-MEM | pre-lock N2 | $16 | Your dial is at $16 — the price you charged on Night 1. | Your dial is at $16 — the price you charged on Night 1. |
| d4-1366-flat16-MEM | pre-lock N3 | $16 | Your dial is at $16 — the price you charged on Night 2. | Your dial is at $16 — the price you charged on Night 2. |
| d4-1366-flat16-MEM | pre-lock N4 | $16 | Your dial is at $16 — the price you charged on Night 3. | Your dial is at $16 — the price you charged on Night 3. |
| d4-1366-flat16-MEM | pre-lock N5 | $16 | Your dial is at $16 — the price you charged on Night 4. | Your dial is at $16 — the price you charged on Night 4. |
**Which dial behaviour shipped:** the dial **resets to the season-plan price every night**.
`applyNight` returns `price: market.planPrice` when a night settles; it has never kept the
last price charged. The helper's doc comment claimed the opposite and is now the reducer.
That reset is exactly why the false cue was so reachable: the dial reopens at the same plan
price the bell auto-commits at. OBSERVED (dial readout `$24` on all five pre-lock frames of
the auto desk) + INFERRED (reducer).

## R5-4 — advisory, one half done

Done: the repeat-card change line is a sentence. Was `-1,100 people, and that is renewals
-1,100`; now, from a real driven season, `Desk 1 · New York Knicks: 10,878 then 10,303 —
575 fewer people came, and the change came from renewals (-975) and Night 4's $40,000 of
event money (+400).` The floored and capacity-clamped branches are untouched.

Not done: a concrete definition of "season ticket". See known-gaps.

## New student-facing strings, all registered in `fullHouse.ts`

| string | source | mirrored in test |
| --- | --- | --- |
| turnout cause, 4 limbs | `turnoutCauseFor` | `fullHouse.test.ts` (R5-2) |
| repeat-card change sentence | `repeatRowFor`'s `channelLine` else-branch | existing repeat-row tests |

No client literal was added: the renderer prints `escapeHtml(n.turnoutCause)` and nothing
else new, and `clientClaims.test.ts` (the renderer sentence limb) is green.

## Known gaps

1. **"Season ticket" is still defined only circularly** (Kid C's single vocabulary gate).
   Not fixed. Both natural homes are constrained by items explicitly out of my scope: the
   RENEWALS card is the fold-critical column on the dense settled state, and the pre-lock
   two-book goal card is inside the pre-lock word count (FD-2, pending a founder decision).
   Recommend one registered line placed by whoever owns FD-2.
2. **Five pre-lock chart frames still drop one non-priority label** (a flat season at one
   price at 1024x600, and one at 1366). Space-bound, not suppression-by-design: the plot has
   about six label rows and five identical-x nights. The callback pair is never among the
   dropped. Options if this matters: a taller pre-lock chart, or a short ledger under it.
3. **The 811px frame itself was not reproduced.** I reproduced 790 in the same state class
   and the repair bounds the control by the short column, so the mechanism is closed, but
   the exact frame browser-qa measured is NOT VERIFIED by me.
4. **The arena drawing is 32px shorter at 1366x768** (150 -> 118). I judged the trade against
   the fold, not against the visual reference; a Visual Experience reviewer should say
   whether the smaller building is acceptable.
5. **No teacher/projector surface was re-checked.** All five items are `/play`; `/board` and
   `/teach` were driven only as far as the e2e drives them.
6. **Nothing here is classroom-proven or human-tested.** Agent-playtested only.
