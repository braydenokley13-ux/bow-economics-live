# BUILD_W3_SYNTH — Lane S (synthesis becomes computed pictures)

Run `m2-visual-quality-war`, wave 3, actor `builder-w3-synth`. Port 4453.
Scratch copy: `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w3-synth/runtime`.
Nothing here is HUMAN-TESTED. Command evidence is TECHNICALLY VERIFIED; anything driven in a
browser is AGENT-PLAYTESTED. I do not certify this lane.

## STAGE S1 — the additive `visual` payload on `SynthesisCard` — BUILT AND SELF-VERIFIED

Apply: `handover/S1-fullHouse.patch` (unified diff against the wave-2 head of
`runtime/src/modules/fullHouse.ts`) and the new file `handover/S1-synthesisVisuals.test.ts` →
`runtime/src/test/synthesisVisuals.test.ts`, both in the Lane S scratch folder.

### What changed in `runtime/src/modules/fullHouse.ts` (five regions, all additive)

1. **`SynthesisCard` gained one optional field.**
   `export type SynthesisCard = { id: string; title: string; body: string; visual?: SynthesisVisual };`
   Card set, order, staging and bodies are untouched (E27). A pinned test asserts the six ids in
   order and asserts the other three cards did **not** grow a visual.

2. **New exported types** `SynthesisDot`, `FrontierPanel`, `SynthesisVisual` (a three-arm union:
   `dots` | `frontier` | `shifters`). The payload carries **data and the captions that data
   supports** — never a rendered picture, never a string a client invented.

3. **`revenueGroups(agg)` extracted** from `revenueCardBody`. The market×card group the REVENUE card
   quotes is now picked once and shared with the dot visual, so the sentence and the picture can
   never be about two different nights. The two body strings are byte-identical to head.

4. **`shifterPick(agg)` extracted** from `shifterCardBody`, same reason. Selection logic unchanged;
   the three body strings are byte-identical to head.

5. **Three visual builders + one student-mirror mapper**: `dotsVisualFor`, `shiftersVisualFor`,
   `frontierPanelFor` / `frontierVisualFor`, and the exported `frontierVisualForDesk(visual, desk)`
   which reduces the board payload to the pair's own market and own dot for `/play`.

### The frontier bend is computed, not asserted

`frontierPanelFor` walks `seasonFrontier(market)` upward from its cash corner and sets
`kneeRenewals` at the renewals level where **half the money the whole line costs** has been given
up. Measured on the shipped constants (OBSERVED, `probe-frontier.cjs` + the module's own payload):

| | New York | Memphis |
|---|---|---|
| cash-best corner | 65 renewals · $2,416,884 | 65 renewals · $1,962,968 |
| renewals corner | 100 renewals · $2,234,548 | 100 renewals · $1,845,068 |
| whole line | 35 points · $182,336 | 35 points · $117,900 |
| knee (half the money) | 98 renewals | 97 renewals |
| cheap stretch | first 33 pts · $100,858 · ~$3,056/pt | first 32 pts · $60,078 · ~$1,877/pt |
| ruinous stretch | last 2 pts · $81,478 · ~$40,739/pt | last 3 pts · $57,822 · ~$19,274/pt |

A "first step above the average price per point" knee rule was written and thrown away: per-point
cost is **not monotone** (Memphis has a $4,380 step at 79 renewals), and that rule put the knee 14
points apart in two markets whose shape is the same. The half-the-money rule is monotone by
construction. The test asserts `dearPerPoint > cheapPerPoint * 3` in **both** markets — a flat
frontier fails the suite, because a flat picture teaches "keeping the fans was free", the exact
false lesson a previous repair removed.

### The caption law, enforced by a test rather than by review

`synthesisVisuals.test.ts` extracts every digit-run from every caption field
(`caption`, `gapCaption`, `bendCaption`, `roomCaption`, `axisCaption`, `ownCaption`, `note`) and
asserts each one is a numeric field on the same payload (or a digit inside a non-caption string
field such as `cardLabel`). **This limb bit during development**: the carried RENEWALS chip printed
"25 people" from `market.renewalFans` without exposing it, and the suite went red until
`fansPerPoint` was added to the shifters payload. That is the audit doing its job before a critic
had to find it.

Also asserted: no caption anywhere matches `/\d\s*%/` (no percent as a figure a student reads), and
no visual payload anywhere contains `weather` (case-insensitive).

Captions never assert a trade-off size and never say "you cannot have both". The frontier's two
captions read, in full:
- `gapCaption` — `"<club>: the whole line is 35 renewal points wide and $182,336 deep — from $2,416,884 at 65 renewals to $2,234,548 at 100. 35 renewal points is 875 people on the base of every night's crowd, at 25 people a point."`
- `bendCaption` — `"The points are not all the same price. The first 33 cost $100,858 — about $3,056 each. The last 2 cost $81,478 — about $40,739 each."`
- `roomCaption` — a **count**, never money: `"N desks played all five nights in <club>. None of them finished on the line. The line is the ceiling of this room, not a wall down the middle of it."`

### Projector privacy (E16) inside the payload

`FrontierPanel.deskDots` are `{renewals, cash}` and nothing else — no handle, no crest, no title,
no seat. Only desks with a full `NIGHT_COUNT` nights are plotted (a late joiner's short season is
not a bad decision); `partialDeskCount` carries the rest. `ownDot` is **absent** on the board
payload and present only through `frontierVisualForDesk`. Tests assert: the board payload matches
neither `deskHandle` nor `seat-`, each dot's key set is exactly `["cash","renewals"]`, and a
student mirror contains no other desk's season cash.

**Judgement I made that a critic should re-open:** R-5 and DIRECTION_W2 Q2 both require the room's
desk dots inside the line, and that puts anonymous per-desk *money* on the projector for the first
time. E16 forbids revenue/profit **columns** on the class-results frame. I read the frontier dot as
outside E16 because it is unattributed and unlabelled, and I dropped the "closest desk finished $X
under the line" figure I had drafted, because that one *is* per-desk money. This is a reading, not a
ruling. Listed under risks.

### Commands run in the scratch copy (TECHNICALLY VERIFIED, this session)

- `npm run build` — clean.
- `npm test` — **487 tests, 487 pass, 0 fail** (head was 478; the 9 new tests are this file).
- `E2E_PORT=4453 node scripts/e2e-m2l1.cjs` — PASS. Rendered-claim limb green; "projector fit
  asserted on 28 board frames x 2 shapes (1366x768 and 1920x1080): scrollHeight <= clientHeight on
  every one"; zero console errors across the 4-desk arc and the 12-desk class-scale run.
- `E2E_PORT=4453 node scripts/e2e-m2l1-misclick.cjs` — PASS.

### What S1 does NOT do

S1 changes **no renderer**. `/board`, `/play` and `/teach` render exactly as they did at the wave-2
head — the payload is carried and ignored. Nothing visual has been measured for this stage, because
there is nothing visual in it. The drawing is S2–S5.
