# GATE — M2 L1 "Full House" · Classroom / Projector

Fresh-context classroom review of the three coupled surfaces. Not the builder of any
reviewed surface. Verdict below is about the room, not the code.

## Session exercised

One full session driven through real Chromium pages against a real server
(`dist/server/index.js`, port 4334, isolated snapshot file), the way a class runs it:

- 1 `/teach` (1440x900), 2 `/board` (1366x768 classroom projector + 1920x1080 HD),
  5 `/play` desks at Chromebook shapes (4x 1366x768, 1x 1024x600).
- 4 pairs join in LOBBY; a 5th joins **late at Night 3**. LOBBY → HOOK → PLAY (5 nights,
  teacher bell each night) → Two Peaks release → REVEAL (7 staged presses) → ADAPT →
  COUNTERFACTUAL → SYNTHESIS → COMPLETE.
- Desk lines chosen to spread the class evidence: card-reader, flat season-plan holder,
  flat $70 holder, a desk that never locks Night 5, a late joiner.
- Interruption drills run mid-REVEAL: board refresh, Two Peaks re-press, Pause/Unpause,
  Freeze/Unfreeze.
- 43 rendered-output privacy scans (board `innerText` **and** `innerHTML`) at every phase,
  both resolutions. Per-element legibility measured (rendered font size as % of screen
  height; SVG text measured from its rendered box, not its viewBox font size).
- Zero console errors across all 8 pages for the whole session.

Screenshots: `screens-l1-projector/` (55 files, `--board1366` / `--board1920` suffixes).

---

## session-choreography-verdict

**FUNCTIONAL — the beats fire, the biggest one is spoiled before it is played.**

What works (observed):
- Every beat is a teacher decision. No timers anywhere in `fullHouse.ts`. The bell is
  labelled with the state it will act on — `🔔 Open the doors — Night 3 (2/5 locked)` —
  which is the single best teacher affordance in the session (`09-teach-after-play.png`).
- Simultaneity holds at room scale. Teacher click → board 588–1009 ms; worst observed
  cross-surface skew in any beat 1110 ms, typical 300–900 ms. The room turns its head
  together.
- No dead board while the room decides: `X/N DESKS LOCKED IN` moves on the projector
  ~400 ms after a desk locks (measured directly).
- Nothing about an open night reaches the projector; the shock copy lands only after the
  bell (`03-play-night1-open-nobody-locked--board1366.png`).
- The staged REVEAL is genuinely staged: one night per press, shaped marks, no joining
  stroke, and the Two Peaks does not appear before its own stage.

What breaks the choreography (observed):
- **The last bell dumps the entire class picture automatically.** Closing Night 5 puts
  `FIVE NIGHTS, IN THE BOOKS` with all 25 desk-night marks on the projector with no
  teacher trigger (`04-after-bell-Night5--board1366.png`). Entering REVEAL then wipes it
  to `THE ROOM'S OWN CURVE · WAITING / "Waiting for your teacher to put up the first
  night."` (`10a-reveal-stage0--board1366.png`) and re-adds the same five nights the room
  has already seen. The module's centrepiece reveal is pre-spoiled and then replayed as a
  repeat, with a blank waiting screen as the beat in between.
- The aggregate `8,938 people ... could not get a seat` is already on the board at REVEAL
  stage 0, before any night is up.
- `Reveal next` is generically labelled. The teacher cannot see what the next press puts
  on the board (contrast the bell). 7 presses, no names, only a `0/7 REVEAL STAGES`
  counter in the aggregate panel.
- Teacher's bell label lags the projector's live counter by up to ~1.5 s (teach polls
  1500 ms, board 1000 ms): board read `1/3` at +470 ms, the teacher's button still said
  `0/3` at +873 ms.

## board-privacy-verdict

**PASS.**

- 43 scans of rendered board output across every phase at both resolutions: **zero**
  student names in `innerText` or `innerHTML`; no `seatId`, `rejoinPin`, `data-seat` or
  join-PIN tokens anywhere in the board DOM.
- The board carries only `Desk N · <real club>` plus a crest. Student names appear on
  `/teach` (join list, desk cards) and on the pair's own `/play` header — correct
  boundary.
- Money stays private: no desk's cash or bank position ever reaches the projector. The
  public books tiles are per-market aggregates (desks, fullest house, sold-out nights,
  median renewals). `boardView` is handed no seat identity.
- No hover-only disclosure on `/play` (all 11 `:hover` rules are decorative border /
  brightness).
- `/board` has no auth and auto-attaches to the first active session, which is acceptable
  precisely because it holds nothing private.

One flagged, non-blocking risk: `Desk N` is pseudonymous but **self-identifying** — the
pair sees the same handle on their own screen. COUNTERFACTUAL publishes a per-desk
league table including a visibly worst line (`Desk 4 · Memphis Grizzlies · 1,340 then
570 · renewals 50% → 36%`, `12-counterfactual--board1366.png`). That is real classroom
drama and also a real 5th-grade exposure. It needs teacher framing in `/teach`, not a
code change.

## teacher-fallback-verdict

**PASS with one blocking defect.**

Verified fallbacks (observed):
- Two Peaks is a teacher press, never a timer; absent from the board until released;
  survives a re-press (the control disables itself to `📈 Two Peaks is up`) and survives a
  **full board refresh** (`07b-two-peaks-after-board-refresh--board1366.png`).
- Board refresh mid-REVEAL at stage 3 restores the exact stage
  (`10b-reveal-stage3-after-refresh--board1366.png`).
- A desk that never locks is auto-committed by the bell and labelled as auto on its own
  screen.
- `onPhaseExit` is a real safety net: leaving PLAY settles every unplayed night and
  force-releases Two Peaks; leaving REVEAL completes all 7 stages. Nothing can be
  stranded by a teacher who advances early.
- Pause → Unpause restores the exact board.

Blocking defect: **Unfreeze does not un-pause.** `sessionService.ts:346–351` — `freeze`
sets `{ frozen: true, paused: true }`, `unfreeze` clears only `frozen`. Observed
sequence: board `FROZEN` (`10d-board-frozen--board1366.png`) → teacher presses the button
now labelled `Unfreeze` → board shows `PAUSED` and nothing else
(`10e-board-after-unfreeze--board1366.png`), while the teacher's Freeze button reads
`Freeze` (i.e. "nothing is frozen"). The projector stays dark until the teacher notices
that a *different* button now reads `Unpause`. The HUD keeps claiming `REVEAL` throughout,
so the board contradicts itself.

## classroom-drama-notes

- **Strongest boards.** REVEAL stage 5 (`10-reveal-stage5--board1366.png`): a 4.3%-height
  headline, 25 shaped marks, and `8,938 people ... wanted a seat and could not get one`.
  Two Peaks (`07-two-peaks--board1366.png`): two revenue curves, two marked peaks, and
  `The cheaper ticket made more money.` as a 1.8vw punch line. These are the two moments
  a room would actually react to.
- **Weakest board.** SYNTHESIS (`14-synthesis--board1366.png`, `--board1920.png`): six
  dense paragraph cards at 15–20 px, and the heading `WHAT ECONOMICS DID WE JUST USE?`
  plus the first row of card titles are **cut off the top of the screen at both
  resolutions**; the source notes are cut off the bottom. The explicit-formalization
  moment is the least readable board in the lesson.
- **Silent clipping is systemic.** `#stage` is centre-flexed and overflows without
  scrolling, so a text assertion passes while the room cannot see the text. Also observed
  clipped: PLAY-after-bell (`TONIGHT'S CARD` label off the top, honesty line cut at the
  bottom — `04-after-bell-Night1--board1366.png`, `--board1920.png`), REVEAL stage 7 (the
  `The Season, Market By Market` label, both resolutions), COUNTERFACTUAL @1366 (headline
  cut through the middle, `honestLimit` line cut off).
- **Back-row legibility, measured.** Using ~2.6% of screen height (≈28 px at 1080p) as a
  back-row body-text floor: headlines sit at 2.8–4.3% (fine), but the entire *evidence*
  tier sits at 1.3–1.8% — chart axis labels 1.39%, chart legend and the
  "compare the SAME colour and SAME shape" instruction 1.51–1.78%, the per-market season
  books tiles 1.78%, COUNTERFACTUAL turnout numbers and renewal deltas 1.60%, source notes
  1.42%. The back of the room can see *where* the dots are; it cannot read *what they
  say*. The shape/colour key the ADAPT prompt explicitly instructs the class to use is in
  the smallest tier.
- **Counter outranks content.** `0/5 DESKS LOCKED IN` renders as the largest gold element
  on the board and stays that size while the Two Peaks money view is up underneath it
  (`07-two-peaks--board1366.png`).
- **Pairs on one device.** `/play` is clean, single-column, in the Cap Room register
  (`05-play-dials--d1-1366x768.png`), but the page is 1195 px tall against a 768 px (and
  600 px) viewport: **the price dial and `LOCK IT IN` are below the fold**. The permanent
  rejoin-PIN panel (`play/main.ts:95–98`, never re-hidden) consumes ~200 px of the top of
  the screen for the whole lesson. `#fhLock` is 44 px (good); the spend steppers are
  36x36 and the range thumb is 22 px.
- The late joiner at Night 3 arrives with labelled, covered books and is indistinguishable
  on the board (`06-play-late-joiner--d4.png`) — good.

## required-repairs

### Blocking (classroom-reliability)

1. **`unfreeze` must clear `paused`** (or restore the pre-freeze paused state).
   `runtime/src/server/sessionService.ts:346–351`. Today Freeze → Unfreeze leaves the
   projector reading `PAUSED` with no teacher control that says "Unfreeze" any more.
   Evidence: `10d-board-frozen--board1366.png`, `10e-board-after-unfreeze--board1366.png`.
2. **Stop the projector silently clipping its own headline and closing line.**
   `#stage` must fit its content at 1366x768 and 1920x1080 (scale down, tighten, or split
   the panel), and a regression check must assert *visibility within the viewport*, not
   just presence in `innerText`. Worst case is SYNTHESIS, where the heading and three card
   titles are off-screen at both resolutions. Evidence: `14-synthesis--board1366.png`,
   `14-synthesis--board1920.png`, `10-reveal-stage7--board1920.png`,
   `12-counterfactual--board1366.png`, `04-after-bell-Night1--board1920.png`.

### Non-blocking (required before classroom release)

3. **Do not auto-publish the full class picture on the last bell.** Hold `allNightsDone`
   on a "five nights are in the books — the numbers are coming" state and let the staged
   REVEAL be the first time the room sees the whole picture. Move the turned-away total
   into a reveal stage too. Evidence: `04-after-bell-Night5--board1366.png` vs
   `10a-reveal-stage0--board1366.png`.
4. **Raise the evidence tier to back-row size.** Axis labels, chart legend/shape key,
   the books tiles and the COUNTERFACTUAL numbers need ≥2.6% of screen height; the
   honesty/source lines can stay small if they are not needed from the back.
5. **Name the next reveal stage on `/teach`** (`Reveal next → Night 3`, `→ The Two
   Peaks`, `→ The season books`), matching the quality of the bell label.
6. **`/play` must fit a shared Chromebook.** Dismiss or collapse the rejoin-PIN panel
   after the first night and put the dial + `LOCK IT IN` above the fold at 1024x600.
   Raise the spend steppers to 44 px.
7. **Persistent rejoin PIN is a seat-takeover vector** (runtime-wide, not L1-specific):
   name + PIN are both permanently on screen, and a successful rejoin retires the original
   device token, so a neighbour who reads a screen can evict a desk mid-night.
8. **Teacher note for the COUNTERFACTUAL board** — it publicly ranks self-identifying
   desks including the worst one. `/teach` should coach the framing.

## Not verified

- Real projector in a real room: throw distance, ambient light, actual contrast. All
  legibility here is measured in screen-height proportions in a headless browser.
- Physical touch/trackpad drag of the range input by two students sharing a device.
- Colour-vision-deficiency separation of the blue/orange market series *as projected*
  (`design/` holds CVD proof assets; not re-derived here).
- Mid-class **server** restart from snapshot (board refresh was verified; process restart
  was not).
- `Restore last good state`.
- Any real student. Nothing here is classroom-proven (D10).

---

## W3 ADJUDICATION

Owning-critic re-adjudication of this gate's BLOCKING repair 2 — *"no board phase may
require scrolling a projector; the stage must fit its content"* — after the round-4
SPLIT (Two Peaks off the season-books stage) + TIGHTEN (`#stage.fh-tight`) repair.
Fresh session, not the builder of the repair.

### Session exercised

One 12-desk session on port 4362 against `dist/server/index.js` with an isolated
snapshot, mechanics from `runtime/scripts/e2e-m2l1.cjs`: 1 `/teach` (1440x900),
1 `/board`, 12 `/play` desks at 1024x600 with twelve different prices
($10–$84). Every phase, all seven REVEAL stages plus stage 0, the mid-PLAY Two Peaks
release, and all four COUNTERFACTUAL groups were walked as teacher presses. Each board
frame measured at 1366x768 **and** 1920x1080 (not a spot pass — every frame at both).

**24 board frames × 2 resolutions = 48 measurements.** Zero console errors across all
14 pages. Screenshots: `screens-l1-projector/w3-*.png` (49 files). Server killed.

Measured per frame: `#stage.scrollHeight` vs `clientHeight`; every text-bearing element's
and every SVG text node's rendered box against the viewport; rendered type as % of screen
height; and a privacy scan of board `innerText` + `document.body.innerHTML` for all twelve
student names and for `seatId` / `rejoinPin` / `data-seat` / `joinPin` tokens.

### Per-phase fit

| Board frame | `#stage` class | 1366x768 | 1920x1080 | clipped els @1366 | privacy hits |
|---|---|---|---|---|---|
| LOBBY | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| HOOK | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| PLAY · Night 1 open | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| PLAY · after bell N1 | `(none)` | 920/768 — **OVER +152px** | 1293/1080 — **OVER +213px** | 2 | 0 |
| PLAY · after bell N2 | `(none)` | 920/768 — **OVER +152px** | 1293/1080 — **OVER +213px** | 2 | 0 |
| PLAY · after bell N3 | `(none)` | 920/768 — **OVER +152px** | 1293/1080 — **OVER +213px** | 2 | 0 |
| PLAY · Two Peaks released | `(none)` | 932/768 — **OVER +164px** | 1309/1080 — **OVER +229px** | 4 | 0 |
| PLAY · after bell N4 (+Two Peaks) | `(none)` | 1048/768 — **OVER +280px** | 1472/1080 — **OVER +392px** | 8 | 0 |
| PLAY · five nights in the books | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| REVEAL stage 0 | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| REVEAL stage 1 | `(none)` | 776/768 — **OVER +8px** | 1089/1080 — **OVER +9px** | 0 | 0 |
| REVEAL stage 2 | `(none)` | 776/768 — **OVER +8px** | 1089/1080 — **OVER +9px** | 0 | 0 |
| REVEAL stage 3 | `(none)` | 776/768 — **OVER +8px** | 1089/1080 — **OVER +9px** | 0 | 0 |
| REVEAL stage 4 | `(none)` | 901/768 — **OVER +133px** | 1265/1080 — **OVER +185px** | 2 | 0 |
| REVEAL stage 5 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| REVEAL stage 6 | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| REVEAL stage 7 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| ADAPT | `(none)` | 797/768 — **OVER +29px** | 1119/1080 — **OVER +39px** | 1 | 0 |
| COUNTERFACTUAL group 1 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| COUNTERFACTUAL group 2 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| COUNTERFACTUAL group 3 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| COUNTERFACTUAL group 4 | `fh-tight` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| SYNTHESIS | `fh-tight fh-synth` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |
| COMPLETE | `(none)` | 768/768 — FIT | 1080/1080 — FIT | 0 | 0 |

**14 of 24 frames fit. 10 of 24 overflow at both projector shapes.** Every overflowing
frame carries `#stage` class `(none)` — the repair reaches only the four frames it opted
in (`fh-tight` on REVEAL 5, REVEAL 7, COUNTERFACTUAL, SYNTHESIS) plus the SPLIT frames.
`overflow-y: auto` is still on `#stage`, so all ten overflowing frames are scroll frames:
the substitution this gate rejected is still what carries them.

### What the repair did discharge (observed)

- **SYNTHESIS** — the worst case in the original finding — now fits at both shapes
  (`w3-14-synthesis--1366.png`, `--1920.png`). Heading, all six card titles, the
  beyond-sports closing line and the source rail are all inside the viewport.
- **REVEAL stage 7** fits (`w3-10-reveal-stage7--1366.png`); the Two Peaks panel is gone
  from it, so the 962px stacked frame is gone.
- **COUNTERFACTUAL** fits on all four teacher-advanced groups; 12/12 desks were shown
  across the four groups, every row box and the class summary inside the viewport at both
  shapes (`w3-12-counterfactual-group1..4--1366.png`).
- **REVEAL stage 5** (renewals rule) fits at both shapes.
- **The SPLIT did not orphan the Two Peaks punchline in REVEAL.** Stage 6 carries the two
  money curves, both marked peaks, the key, and `The cheaper ticket made more money.` at
  3.20% of screen height, whole and fitting (`w3-10-reveal-stage6--1366.png`). Stage 7
  keeps the room's carry-over — the turned-away total and the `capacityDefence` line — so
  the beat is not stranded.

### What it did not discharge (observed)

1. **PLAY · after bell N4, +280px / +392px** — the worst frame in the lesson, and worse
   than anything in the original finding. With Two Peaks released, the money panel's axis
   titles, its `Tickets alone / Tickets + what they spend inside` key, and the punchline
   `The cheaper ticket made more money.` (box 820..849 in a 768px viewport) are entirely
   below the fold at both shapes (`w3-04-after-bell-night4--1366.png`, `--1920.png`).
   **The SPLIT fixed the REVEAL stacking of the Two Peaks and left the PLAY stacking
   intact — so the punchline IS orphaned, on the surface where the teacher first releases
   it.** Same defect at the release moment itself: `w3-04b-two-peaks-in-play--1366.png`,
   +164px, punchline off-screen.
2. **PLAY · after bell N1/N2/N3, +152px / +213px** — this is the frame named in the
   original evidence list (`04-after-bell-Night1--board1366.png`) and it is still not
   fitting. The `safe center` change means the top is no longer lost, but the honesty line
   `Every dot is one desk on one night — this picture is NOT a demand curve...` (764..850)
   and the whole sourcing line are off the bottom.
3. **REVEAL stage 4 (the shock), +133px / +185px** — the Sports Reality anchor
   (`That night was modeled on a real one. Indiana Fever home attendance went from 4,066
   ... to 17,036 ...`) is sliced at 724..839, and the sourcing line is fully off screen
   (`w3-10-reveal-stage4--1366.png`). The shock beat's real-world grounding is unreadable
   at the moment it lands.
4. **REVEAL stages 1–3, +8px / +9px** — no text box crosses the edge, but the stage is a
   scroll frame on the projector for the three core night reveals.
5. **ADAPT, +29px / +39px** — the sourcing line is cut mid-sentence at 738..780
   (`w3-11-adapt--1366.png`).

### Instrument gap that let this through

`runtime/scripts/e2e-m2l1.cjs` asserts the strict `scrollH <= clientH` condition **only**
inside `classScaleCounterfactual` (COUNTERFACTUAL groups and SYNTHESIS). Every other board
check routes through `assertStageScrollable` (line 100), which *passes an overflowing
stage as long as `overflow-y` is `auto` or `scroll`* — it encodes the substitution this
gate rejected. Called at lines 607, 697, 750. A guard that treats "scrollable" as success
cannot fail on the ten frames above.

### Evidence-tier legibility floor (~2.6% of screen height)

Held, and improved, for the text tier the repair touched — TIGHTEN gave up leading, not
type size, in HTML:

| Element | Original gate | W3 |
|---|---|---|
| COUNTERFACTUAL desk rows / renewal deltas (`.fh-repeat-*`) | 1.60% | **2.67%** |
| Chart shape/colour key (`.legend-shape`) | 1.51–1.78% | **2.67%** |
| Season-books tiles (`.fh-books-*`) | 1.78% | **2.67–3.38%** |
| Two Peaks key / gap lines | — | **2.67%** |
| Honesty + source lines (`.exit-prompt`) | 1.42% | **1.96–2.22%** |

Two exceptions, both **below** the floor and both a direct cost of the recomposition
(observed, not inferred):

- **The chart's own SVG type shrank where `fh-tight` compacts it.** The same class
  scatter renders its axis titles and ticks at **2.86%** on REVEAL stages 1–4 (full
  width), **1.56%** on REVEAL stage 5 (`.scatter-wrap.compact` → 44vw), and **1.30%** in
  COUNTERFACTUAL (two-column). The repair's own comment in `board/main.ts` claims both
  TIGHTEN frames "give up leading, never type size" — that is true of the HTML and false
  of the SVG, which scales with its box. COUNTERFACTUAL's axis is now smaller than the
  1.39% recorded in the original gate.
- **SYNTHESIS**: card titles — which the repair designates as the evidence tier — sit at
  **2.40%**, card bodies at **1.46%**, the source rail at **1.21%**.

Non-blocking (this is repair 4 of this gate, already non-blocking), but it must not be
recorded as discharged.

### Board privacy

**PASS, re-verified at class scale.** 48 rendered-output scans across every phase and both
shapes: zero of the twelve student names (`Pair 1`…`Pair 12`) in board `innerText` or in
`document.body.innerHTML`; zero `seatId` / `rejoinPin` / `data-seat` / `joinPin` tokens.
The board carries only `Desk N · <real club>`. The paged COUNTERFACTUAL publishes
pseudonymous desk lines exactly as before — the self-identifying-desk exposure flagged in
the original gate is unchanged and still needs teacher framing, not a code change.

### PROJECTOR FIT CONDITION: NOT DISCHARGED

10 of 24 board frames overflow the projector at 1366x768 and at 1920x1080 in a 12-desk
session, including the frame named in the original evidence (`PLAY · after bell N1`) and a
new worst case (`PLAY · after bell N4`, +280px / +392px) where the Two Peaks punchline is
entirely off screen. The condition is stated per-phase — "no board phase may require
scrolling a projector" — and the repair discharged four frames of it.

### Repairs required to discharge

1. **BLOCKING (classroom-reliability).** Apply the fit remedy to the PLAY frames. The
   Two Peaks panel must not stack under `Tonight's Card` + the lock counter: give it its
   own PLAY board state the way it has its own REVEAL stage, or drop the card banner and
   counter while it is up. `runtime/src/client/board/main.ts` `case "play"`.
2. **BLOCKING (classroom-reliability).** REVEAL stage 4's real-world anchor and the
   PLAY/ADAPT honesty and sourcing lines must be inside the viewport, or be moved to
   `/teach` if they are not for the room. Trim REVEAL stages 1–3 by ≥9px.
3. **BLOCKING (instrument).** Delete `assertStageScrollable` or make it assert
   `scrollH <= clientH`, and run it on **every** board frame at both shapes — not only
   COUNTERFACTUAL and SYNTHESIS. Until then this gate's regression check cannot fail on
   its own condition.
4. Non-blocking: keep the compacted chart's rendered SVG type at the ≥2.6% floor
   (raise the SVG's internal font sizes as the box narrows), and raise SYNTHESIS card
   titles from 2.40%.

### Not verified in this pass

- Freeze → Unfreeze, Pause, board refresh, `Restore last good state`, server restart from
  snapshot. `sessionService.ts:357–358` now clears both `frozen` and `paused`, so this
  gate's blocking repair 1 reads as repaired **in code** — inferred, not exercised here.
- `/play` fit on a shared Chromebook (repairs 6–7), untouched by this pass.
- Real projector in a real room; whether the ten overflowing frames render a visible
  scrollbar on classroom hardware (headless Chromium uses overlay scrollbars).
- Any real student. Nothing here is classroom-proven (D10).

---

## W3 FINAL ADJUDICATION

Owning-critic re-adjudication of the projector fit condition after the staged repair
(`1418882` / `f9dcda1`). Fresh session, independent instrument — not the builder's
`runtime/scripts/e2e-m2l1.cjs`, which is itself part of what is under review.

### Session exercised (observed)

One **twelve-desk** session on **port 4364**, isolated snapshot, against `dist/server/index.js`
built at head this session. One `/teach` (1440x900), one `/board` walked at **1366x768 and
1920x1080**, twelve `/play` desks at 1024x600, twelve different prices ($10-$84) so the class
evidence is a real spread. LOBBY → HOOK → PLAY (5 bells, Two Peaks released by the teacher at
Night 3) → REVEAL (stages 0-7) → ADAPT → COUNTERFACTUAL (all 4 groups) → SYNTHESIS (all 6 pager
cards) → COMPLETE.

**31 board frames × 2 projector shapes = 62 fit measurements.** Every frame measured for
`scrollHeight - clientHeight`, `scrollWidth - clientWidth`, per-element rendered box against the
viewport, and per-element rendered type as a share of screen height (SVG type scaled from its
rendered box, not its viewBox). A second drill ran the teacher fallbacks on a 4-desk session.

Screenshots: `screens-l1-projector/w3f-*.png` (66 files, `--1366` / `--1920`).

### Measured result

| | result |
|---|---|
| max `#stage` vertical overflow, 62 measurements | **0 px** |
| max horizontal overflow | **0 px** |
| frames with any element clipped by the viewport | **0 of 31** |
| board privacy scans (`innerText` + `innerHTML`), 62 | **0** name / seat-token hits |
| console errors, 15 pages | **0** |

Prior verdict was 10 of 24 board frames overflowing. **The overflow is gone at both projector
shapes, at twelve desks, including the frames that were never instrumented before** (LOBBY at 12
desk chips, HOOK, PLAY open-night, the two Two-Peaks-in-PLAY frames, REVEAL stage 0, all four CF
groups, all six SYNTHESIS pages, COMPLETE).

### Evidence tier, measured against the 2.6%-of-screen-height back-row floor

Everything the room is told to read off the board now clears it (1366x768 figures; 1920x1080 is
identical as a percentage because the type is set in `vw`):

- class scatter axis + titles **2.61-2.69%** (was 1.30-1.56%), shape/colour key **2.67%**
- COUNTERFACTUAL repeat rows, handles, both turnout numbers, renewal deltas **2.67%**
- COUNTERFACTUAL class summary **2.85%** (was 2.05% under a larger caveat), and it is now
  full-width under both columns rather than buried in the right column
- season books tiles **2.67%**, club names 3.38%; turned-away total **2.67%**
- Two Peaks money view peak labels **2.71%**, peak prices 3.38%
- SYNTHESIS card title **4.27%**, body **2.85%** (was 11.20px / 1.46%)
- PLAY strip: night 3.56%, tonight's card 2.67%, lock count 2.67%

Marginal: `#fhRenewalsRule` renders at **2.58%** — 0.02 under the floor, i.e. at it. Not a finding
on its own, but the e2e asserts only `assertFullyVisible` on that element, never
`assertBackRowType`, so nothing catches it if it drifts further.

### Rulings on the four questions asked

**1. Does the PLAY strip keep the punchline on-screen?** Yes, observed. At the moment the teacher
releases the Two Peaks (`w3f-04b-two-peaks-in-play--1366.png`, `--1920.png`) the strip costs 44px
and `The cheaper ticket made more money.` lands at **3.2% of screen height, fully inside the
viewport at both shapes** — the beat that previously measured box 820..849 in a 768px viewport.
The strip also fixes the "counter outranks content" finding: `0/12 locked in` drops from 5.34% (the
largest gold element on the board) to 2.67% the moment evidence is up, and returns to 5.34% on the
open-night frame where the count *is* the content (`w3f-03b-play-n1-all-locked--1366.png`). This is
the right dependency: the strip is on exactly when it should be.

**2. Does the staged SYNTHESIS pager preserve the formalization as a room moment?** **Yes — it
builds; it does not fragment.** Observed order: REVENUE = PRICE × PEOPLE → THE CARD MOVED THE CROWD
→ THE TICKET IS NOT THE PRODUCT → NIGHT 5 WAS NIGHT 1 → TWO BOOKS, NO EXCHANGE RATE → YOUR JOB IS
REAL. That is the identity, then the demand shifter, then the second revenue channel, then path
dependence, then the constraint, then the real-world close — a sequence with a direction, and each
card is computed from this class's own numbers (card 1 quoted this room's $14/15,410 against
$84/0). `/teach` names the next card before the press ("Next card — 3 of 6: THE TICKET IS NOT THE
PRODUCT") and states what is up now, which is the bell-label standard applied correctly. One card
per frame is a genuine trade *up*: the six-card grid was ~850 words at 11.2px and the room could
read none of it.

Two costs, both real, neither blocking: (a) nothing accumulates — at card 5 the room cannot see the
four terms already named, and no frame in the lesson ever shows the six together, so the "here is
everything you just did" close exists only in the teacher's voice; COMPLETE is a single banner
(`w3f-15-complete--1366.png`). (b) The beyond-sports line is byte-identical on all six frames and
becomes wallpaper by card 3.

**3. Do the builder's honest leftovers block?** **No.** All below-floor visible type is caveat,
sourcing, prompt or set-up copy, not evidence: board honesty line 1.96% (on nearly every frame),
COUNTERFACTUAL `honestLimit` 1.78%, REVEAL-7 "miss the best price" note 1.96%, sources rail 1.69%
(last SYNTHESIS page only, correctly quiet), argue prompt and CF pager 2.22%, Two Peaks label spans
2.31%, LOBBY/HOOK market cards and season slate 1.25-1.96%, PLAY open-night `NOT ON TV` 1.60% and
`VISITING CLUB'S DRAW / 100` 1.78%. None of these is a number the class is asked to read off the
projector and argue from. They are named in required-repairs, not held against the condition.

One item in that band is **not** a caveat and I decline to file it as one: the Night-4 Fever anchor
renders at **2.13%** as a six-line paragraph on `w3f-04-after-bell-night4--1366.png` and
`w3f-10-reveal-stage4--*.png`. It is the module's Sports Reality anchor, it is the densest block on
a PLAY frame, and it is below the floor. Non-blocking because it is teacher-read, but it is a
repair, not a leftover.

**4. Prior blocking defects.** Both discharged, observed live in the drill:
- `unfreeze` now clears `paused` (`sessionService.ts` `case "unfreeze"`). Freeze → board `FROZEN` →
  press Unfreeze → board returns to the **exact** REVEAL stage-7 frame, no `PAUSED` limbo.
  `w3f-91-board-frozen--1366.png`, `w3f-92-board-after-unfreeze--1366.png`.
- Silent clipping: gone, measured above.

Also discharged from the prior non-blocking list: the last bell no longer dumps the class picture
(`w3f-04-after-bell-night5--1366.png` reads *"Five Nights, In The Books / Nobody has seen the
room's numbers yet. They go up one night at a time."* — the staged REVEAL is now genuinely first
sight); `Reveal next` names each of its seven beats; the evidence tier is at the floor.

### NEW BLOCKING FINDING — the COUNTERFACTUAL pager mislabels the room's own desks

`orderRepeatRows` (introduced in this repair wave, `c09423b`) re-orders the repeat rows by teaching
value. The pager label was left as positional arithmetic over that re-ordered list:

`fullHouse.ts:2551` — `` `Desks ${from + 1}-${from + shown.length} of ${allRows.length} · group ${page + 1} of ${pages}` ``

Observed on the projector at twelve desks (`w3f-12-cf-group1--1366.png`): the gold pager reads
**"DESKS 1-3 OF 12 · GROUP 1 OF 4"** over rows headed **Desk 2 · Memphis**, **Desk 3 · New York**,
**Desk 4 · Memphis**. Group 4 (`w3f-12-cf-group4--1366.png`) reads **"DESKS 10-12 OF 12"** over
**Desk 11**, **Desk 12**, **Desk 1**. The same arithmetic drives the teacher's own controls
(`fullHouse.ts:2355`, `:2361`), so `/teach` promises "Next group — desks 4-6" and puts up a
different set of desks.

Why this is classroom-reliability and not cosmetics: this is the phase whose prompt tells the room
to argue about *specific desks*, the handles are self-identifying, and a pair at Desk 1 watches
their own row appear under a heading that says desks 10-12. The teacher reads the projector aloud
and is wrong. Fix is one line either way — label by position ("Rows 1-3 of 12") or stop claiming
identity.

### Verdict

The fit condition asked for one thing: no board phase may require scrolling a projector, and the
evidence tier must be readable from the back. At 31 frames × 2 shapes × 12 desks, both hold, and
the previously un-instrumented frames hold too. The new pager defect is a board-copy regression
filed separately; it does not resurrect the fit condition and is not a reason to withhold its
discharge.

### required-repairs (this adjudication)

**Blocking (classroom-reliability)**

W3F-1. **Stop the COUNTERFACTUAL pager claiming desk identity it does not have.**
`fullHouse.ts:2551` (board), `:2355` and `:2361` (teach). Evidence: `w3f-12-cf-group1--1366.png`,
`w3f-12-cf-group4--1366.png`.

**Non-blocking (before classroom release)**

W3F-2. Raise the Night-4 Fever anchor above the back-row floor or split it; at 2.13% and six lines
it is the one piece of real sports-business content sitting in the caveat tier.
W3F-3. Give SYNTHESIS an accumulator — a spine of the card titles already named, or a final
"all six" frame — so the formalization closes as one picture and not six separate ones. Vary or
retire the repeated beyond-sports line after its first appearance.
W3F-4. Assert `assertBackRowType` on `#fhRenewalsRule` (measured 2.58%) and on the argue prompt;
the fit instrument currently only asserts visibility there.
W3F-5. Carried, unchanged: `/teach` still needs framing copy for the COUNTERFACTUAL board, which
publicly lists self-identifying desks including the one that drew nobody at $84.

### Not verified

- A real projector in a real room: throw distance, ambient light, measured contrast. All figures
  here are screen-height proportions in headless Chromium.
- CVD separation of the blue/orange series as projected; contrast of the white turnout numerals on
  the light-blue N1 bars in the CF rows (visual critic's ground).
- `Restore last good state`.
- Any real student. Nothing here is classroom-proven (D10).

Verified this session and previously open: mid-class **server** restart from snapshot — board
reloaded to the exact REVEAL stage 7 and fit both shapes (`w3f-93-board-after-server-restart--1366.png`);
board refresh mid-REVEAL at stage 3 restored the stage exactly; pause/unpause round-tripped; the
bell auto-committed all four desks in a run with zero manual locks.

PROJECTOR FIT CONDITION: DISCHARGED
