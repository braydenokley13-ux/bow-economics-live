# GATE — M2 L2 "You Don't Play Alone" · Classroom / Projector

Fresh-context classroom review of the three coupled surfaces at class scale. Not the builder of
any reviewed surface. Evidence id: `gate-l2-projector`. Verdict is about the room, not the code.

## Session exercised (observed, this session)

One full 12-desk session plus three targeted drills, all through real Chromium pages against a
real server (`runtime/dist/server/index.js`, PORT 4375, isolated snapshot file). Independent
instrument, not the builder's `scripts/e2e-m2l2.cjs` (mechanics borrowed, guards rewritten).

- 1 `/teach` (1440x900); **two live `/board` pages, 1366x768 and 1920x1080, attached for the whole
  session** (every frame measured at both shapes, not resized-and-restored); 12 `/play` desks at
  Chromebook shapes (6x 1024x600, 5x 1366x768, 1x late 1024x600).
- LOBBY (11 desks) -> duplicate-join attempt -> HOOK -> PLAY wk1 (freeze/unfreeze drill, both
  advance confirm-guards dismissed) -> bell -> wk2 star departure -> **late join at week 2** ->
  bell -> mid-lesson Handed-To-You release, all 3 groups paged -> wk3 with one desk that never
  locks -> bell (auto-commit) -> REVEAL 5 presses (board refresh at stage 3) -> ADAPT -> ARGUE ->
  SYNTHESIS 5 cards -> COMPLETE.
- **30 board frames x 2 shapes = 60 measurements**: `#stage` scrollHeight vs clientHeight, every
  evidence element's box against the viewport, rendered font size as % of screen height, and a
  rendered-output privacy scan of `innerText` **and** full DOM `innerHTML`.
- Drills: PLAY->REVEAL boundary with the bar never released (`probe`), freeze mirror truthfulness
  (`probe2`), **mid-class server kill + restart from snapshot** (`probe3`).
- Screenshots: `screens-l2-projector/` (76 files, `--1366x768` / `--1920x1080` suffixes).

---

## session-choreography-verdict

**FUNCTIONAL — the beat structure is genuinely good; the frame the room stares at for most of the
lesson is unreadable at class size.**

Highest-severity finding first (blocking, classroom-reliability):

- **Every club name on the weekly schedule is ellipsized away at 11 and 12 desks, at BOTH projector
  shapes.** The board renders `Desk 1 · ...  HOSTS  Golden S...  DRAW 36`. The host identity — which
  club each desk actually runs — is truncated on *every* schedule frame of *every* week, which is
  the frame that is up for the majority of PLAY. Observed:
  `06-week1-schedule--1366x768.png` (11 desks), `12-week2-shock--1366x768.png` and
  `14-week2-latejoin--1920x1080.png` (12 desks). Visiting clubs truncate too
  (`Oklahom...`, `Philadelp...`, `New Orle...`, `Sacrame...`). Cause: `.hl-pair-host` /
  `.hl-pair-visitor` are `white-space:nowrap; text-overflow:ellipsis` inside a 3-column
  `.hl-pairs` grid (`runtime/src/client/board/index.html:325-335`). My fit instrument passed these
  frames — overflow and clipping are zero — because CSS ellipsis is *silent* truncation. The
  bottom 30-40% of the same frame is empty.
  Room consequence: the class cannot read its own map. "Their star filled our building" needs
  *whose* building; /teach's week-2 coaching literally instructs "name the desks who are hosting
  them", and desk numbers survive while club identity does not.

What works (observed):

- **Every beat is a teacher decision. No timer anywhere.** Bell (`Close week 1 (0/11 locked)` —
  state-labelled, the best affordance on the console), Handed-To-You release
  (`Release the Handed-To-You bar` -> `The bar is on the projector`), five named reveal presses
  (`Reveal 3 of 5 — The four pipes — where the money actually comes from`), bar pager, synthesis
  pager. The star departure rides the teacher's week-1 bell rather than a clock.
- **Simultaneity holds at room scale.** Teacher press -> projector: 0.6-1.01 s (12 measured beats,
  worst 1013 ms). A desk locking -> the projector's live counter: 662 ms. The room turns its head
  together.
- **Nothing about an open week leaks to the projector**: 0 decomposition bars, no dollar figure on
  the board while week 1 was open with all 11 desks locked (`09-week1-locked--1366x768.png`).
- **The five reveal stages are five distinct beats**, one panel each, nothing from the previous
  press left underneath: WHO FILLED YOUR BUILDING? / WHAT YOU GAVE, WHAT YOU GOT / FOUR PIPES, ONE
  CLUB / SMALL BUILDING, BIG NIGHT / WHAT YOU DID AFTER YOU SAW IT.
- **Anticipation between weeks is real** where it is legible: the week strip (`WEEK 2 OF 3 · Every
  club hosts one and visits one · 0/12 locked in`), the star-departure card above the schedule, and
  both clubs' Draw printed before anyone prices.
- **Surface coupling was consistent at every phase checked**: the star departure is on the board,
  on all 12 desks and in the teacher's mirror in the same beat, with the same club and the same
  Draw; the teacher's stage title matched the board headline 5/5 through REVEAL; the mirror is
  honest even about the weak frames ("An empty frame and 'Waiting for your teacher...'").
  One exception, below.
- **The mid-lesson release earns its repeat.** Bar released after week 2 -> the room plays week 3
  knowing -> stage 5 measures whether the room changed its mind. That is a designed arc, not a
  spoiled reveal.

Where the choreography sags (non-blocking):

- **The reveal opens on the word "WAITING".** Entering REVEAL replaces the strong hold frame
  (`THREE WEEKS, IN THE BOOKS / Nobody has seen the room's whole picture yet. It goes up one beat
  at a time.` — `28-play-weeksdone-nobar--1366x768.png`) with `WAITING / Waiting for your teacher
  to put up the first beat.` (`29-reveal-stage0--1366x768.png`, 649 ms after the press). The room
  turns to the projector at the biggest moment of the lesson and reads "Waiting".
- **Stage 5 has no room moment.** 18.2% / 20% / 17.9% render as three visually identical gold bars
  in a short well with 60% of the frame empty (`20-reveal-stage5--1366x768.png`), while the copy
  says "down 1.2 points". The chart contradicts the sentence at back-row resolution.
- **Freeze blanks the projector** to the single word `FROZEN`
  (`07-week1-frozen--1366x768.png`; `runtime/src/client/board/main.ts:45-46`). The schedule the
  room is pricing against disappears; unfreeze restores it correctly (verified).
- ADAPT opens on bar group 1 of 3 — 7 of 12 desks cannot see their own bar until the teacher pages
  (`22-adapt--1366x768.png`). Paging works; the coaching should say so out loud.

Pairs-on-one-device (`/play`, 1024x600, observed): share −/+ 44x44 px, LOCK IT IN 590x44 px, price
knob ~30 px on a 22 px track — the one control below comfortable two-student size. No hover-only
disclosure: all 13 `:hover` rules are decorative border/brightness/transform; zero affect
`display`, `visibility` or `content`. The page scrolls at 1024x600 (1100 px of content), so LOCK IT
IN sits below the fold until the pair scrolls (`13-play-late-join.png`).

## board-privacy-verdict

**PASS — clean, and structurally clean.**

- **60 rendered-output scans** (30 frames x 2 shapes, every phase from LOBBY to COMPLETE) of board
  `innerText` **and** whole-document `innerHTML` for the deliberately distinctive joined names
  (`Pair N Zylq<N>xn Krevanti<N>`): **zero hits**. Zero `seatId`, `rejoinPin`, `data-seat` or
  `pin=` tokens anywhere in the board DOM at any phase.
- The board's only identifiers are `Desk N · <real club>` plus real buildings and clubs
  (`deskHandleFor`, `hostTheLeague.ts:756`) — real club names are the product, student names are
  not there. `boardView` is handed no seat identity.
- No desk's cash, price, reinvest %, or bank position reaches the projector. What is public is
  per-desk *decomposition of a public gate* plus room aggregates.
- Student names are on `/teach` (verified present, correct boundary) and on the pair's own
  `/play` header. The rejoin PIN renders only on the pair's own device (`13-play-late-join.png`).
- **Duplicate join handled sanely and privately**: a second device joining with an existing pair's
  name is refused with "that name is already in this session — use the rejoin PIN if this is you"
  (`02-play-duplicate-join.png`); the board did not change, still 11 clubs live, and nothing about
  the attempt reached the projector (`03-lobby-after-dup--*.png`).
- **Late join at week 2 lands sanely on the board**: the new desk appears as `Desk 12 ·
  Sacramento`, the lock counter becomes `0/12`, the schedule grows a row, no name
  (`14-week2-latejoin--1920x1080.png`), and the desk itself gets a live, playable, carried
  franchise (`13-play-late-join.png`).
- Console: 1 entry all session, a `409 Conflict` network log on the duplicate-join device. No
  JavaScript error on any of 16 pages.

## teacher-fallback-verdict

**PASS with one truthfulness defect.**

Verified this session:

- **Every synchronized reveal is teacher-triggered and has a manual fallback.** No timer exists in
  `hostTheLeague.ts`. `onPhaseExit` (`:1472-1484`) settles every unplayed week on the pairs' own
  dials, releases the bar if the teacher never did, and plays out every remaining reveal stage — so
  a teacher who never presses anything still lands a coherent lesson.
- **Confirm-guards on both advance paths, and dismiss really cancels.** `Advance` during an open
  week: "Week 1 of 3 is still open (0/11 desks locked in). This is not the week bell — advancing
  now settles this week for every club AND ends the season early, so 2 weeks will never be played.
  11 desks have not locked; they settle on whatever is on their dials right now. Continue?"
  Dismissed -> phase stayed PLAY. `Jump to REVEAL` carries the same guard with a `Jump to REVEAL.`
  prefix; dismissed -> phase stayed PLAY.
- **The bell auto-commits.** Week 3 closed with 11/12 locked; the desk that never touched a dial
  settled and is flagged AUTO on its own screen — never skipped.
- **Board refresh mid-reveal recovers exactly**: reloaded both boards at stage 3, both returned to
  `FOUR PIPES, ONE CLUB`, zero overflow (`21-reveal3-refresh--*.png`).
- **Mid-class server kill + restart from snapshot recovers exactly**: server SIGTERMed at reveal
  stage 2, rebooted on the same snapshot file; the board reloaded to `WHAT YOU GAVE, WHAT YOU GOT`
  with zero overflow (`32-board-after-server-restart--1366x768.png`), the desk resumed seated as
  `DESK 1 · NEW YORK` with its books, /teach resumed `DIRECTING REVEAL`.
- **Freeze/unfreeze round-trips**: desks show "Your teacher has frozen the session. Hang tight."
  and lose the lock control; unfreeze restores the control and the board's schedule.
- Reveal presses past the last stage are refused with the button reading `Every reveal has played`.
- The teacher's ON-THE-PROJECTOR mirror was truthful at every phase measured, including naming the
  stage on the projector and the stage the next press will bring, 5/5 through REVEAL.

The defect: **while the session is frozen, the mirror lies.** Board shows only `FROZEN`; /teach's
"ON THE PROJECTOR RIGHT NOW" still reads "Week 1 of 3 — the schedule / Every pairing in the league:
who hosts whom, with both clubs' Draw printed" (observed, `31-teach-while-board-frozen.png`).
`projectorMirror` (`hostTheLeague.ts:2118`) never sees `frozen`. The teacher can say "look at the
board" while the board is blank.

## classroom-drama-notes

**Best room moments (observed):**

1. **`WHO FILLED YOUR BUILDING?` — stage 1** (`19-reveal1-g1--1366x768.png`). Five stacked bars,
   the gold "the club visiting you" block plainly the widest on most of them, one instruction in
   gold — "Point at the club that paid for your night." — and the room-level line underneath: "On
   10 of 12 bars, the biggest block at the door is the visiting club... 46% of every dollar that
   came through a door was brought by a club somebody else was running." That is the lesson, on one
   frame, pointable. This is a genuine room moment.
2. **The star-departure card** (`12-week2-shock--1366x768.png`): "Chicago Bulls have lost their best
   player. Their Draw is **12** for the rest of the season." — above the schedule, before anyone
   prices, on the board and on all 12 desks at once. The club is always a league-office club, so no
   pair is punished for something it did; the pairs hosting Chicago that week eat it. Correct and
   dramatic.
3. **`WHAT YOU GAVE, WHAT YOU GOT`** (`20-reveal-stage2--1366x768.png`): violet gave / gold got, two
   bars per desk, with the LeBron 2010/2014 paragraph delivered in the same breath. The "their star
   filled our building" beat is strongest here — but see repairs: the dollar values are set in dark
   ink *inside* the bars at 2.05% of screen height, and `Draw 44→56` sits at 1.87% in muted grey.
4. The held frame before the reveal: `THREE WEEKS, IN THE BOOKS / Nobody has seen the room's whole
   picture yet. It goes up one beat at a time.` (`28-play-weeksdone-nobar--1366x768.png`).

**Worst room moments (observed):**

1. **The schedule, all lesson.** `Desk 1 · ...  HOSTS  Golden S...` at both shapes
   (`06-week1-schedule--1366x768.png`, `14-week2-latejoin--1920x1080.png`). The one frame the room
   lives in cannot name its own clubs, with a third of the projector empty below it.
2. **`WAITING`** at the top of REVEAL (`29-reveal-stage0--1366x768.png`).
3. **`FROZEN`** — one grey word on an empty projector (`07-week1-frozen--1366x768.png`).
4. **Stage 5's three identical bars** (`20-reveal-stage5--1366x768.png`) — the "did the room change
   its mind?" payoff for the mid-lesson release, rendered as a flat trio.
5. Back-row evidence generally: the visiting-club attribution line under every bar — the exact text
   ADAPT question 2 ("Somebody in this room made your best week. Who?") sends students to — renders
   at 1.78% of screen height in muted grey (`22-adapt--1366x768.png`).

Screenshots: `docs/gauntlet/module-2/screens-l2-projector/`.

## required-repairs

### Blocking (classroom-reliability)

**P-1. Stop truncating club names on the schedule.** `.hl-pair-host` / `.hl-pair-visitor`
(`runtime/src/client/board/index.html:331-333`) ellipsize at 11 and 12 desks at both projector
shapes. Every schedule frame of every week is affected. Use the empty bottom third: two columns
instead of three, or a two-line pair card, or drop the `Desk N · ` prefix into its own cell. Then
assert it: a machine check that no board text node is visually truncated
(`scrollWidth > clientWidth`) at 12 desks at both shapes — CSS ellipsis is silent, and the existing
fit instrument cannot see it.

**P-2. Raise the evidence tier to the 2.6%-of-screen-height back-row floor** (the L1 standard;
at 16:9 that is 2.0vw). Measured this session, identical at both shapes because the whole board
type scale is `vw`-based:

| element | content | measured | frames |
|---|---|---|---|
| `.hl-bar-foot` | visiting-club attribution + dollars (the BC-5 evidence) | **1.78%** | 20 of 60 |
| `.hl-ledger-draw` | `Draw 44→56` per desk | **1.87%** | 2 |
| `.hl-ledger-bar b` | the gave/got dollar values (also dark ink on violet) | **2.04%** | 2 |
| `.hl-pipe-nums` | `gate 24.5% · national 33.9%` — the lesson's most surprising true numbers | **2.13%** | 4 |
| `.hl-mean-lbl` | WEEK 1/2/3 under the reinvest means | **2.13%** | 2 |

Headlines, desk handles, chip and pair numerals already clear the floor; this is the data tier
only. Space exists — most frames use 60-75% of projector height.

### Non-blocking

**P-3.** Freeze should not blank the projector. Keep the current frame and overlay a band
(`runtime/src/client/board/main.ts:45-46`), and make `projectorMirror`
(`hostTheLeague.ts:2118`) report the frozen frame so /teach's ON-THE-PROJECTOR panel stops
claiming the schedule is up.

**P-4.** Give REVEAL stage 0 the hold copy instead of `WAITING` — carry "Nobody has seen the room's
whole picture yet. It goes up one beat at a time." into the reveal's opening frame.

**P-5.** Rebuild stage 5 so a 1.2-point move is visible from the back (zero-suppressed scale,
before/after delta, or drop the bars for two big numbers).

**P-6.** Raise `.hl-week-strip-lock` / `.hl-week-strip-mid` (2.31%) and `.hl-chip-who` /
`.hl-chip-size` (1.69%, includes the market-size grouping the economics depends on).

**P-7.** `/play` at 1024x600: LOCK IT IN is below the fold until the pair scrolls, and the price
track is 22 px tall. Consider a sticky lock bar and a thicker track for two students on one device.

**P-8.** Have /teach say out loud in ADAPT that the bar is showing one group of five and must be
paged for the rest of the room.

**P-9.** The duplicate-join 409 logs a console error on the student device; suppress it so
"zero console errors" stays a usable signal.

### Not verified

- A real projector in a real room: throw distance, ambient light, measured contrast. Every figure
  here is a screen-height proportion measured in headless Chromium.
- Colour-vision separation of the five-segment bar palette as projected, and the dark-on-violet
  ledger numerals as projected (visual critic's ground).
- Student-device refresh / rejoin-by-PIN mid-session (board refresh and full server restart were
  verified; the desk-side rejoin path was not exercised here).
- `Restore last good state`, pause/unpause.
- Any real student. Nothing here is classroom-proven (D10).

PROJECTOR FIT CONDITION (overflow/clipping): **DISCHARGED** — 60 measurements, zero overflow, zero
clipped elements, both shapes.
PROJECTOR LEGIBILITY + SCHEDULE READABILITY: **NOT DISCHARGED** — P-1, P-2.

---

## RE-CHECK AFTER L2 REPAIR

Owning-critic confirm-or-refute of blocking dissent `proj-l2-truncation` after the consolidated L2
repair. Evidence id: `gate-l2-projector-r1`. Fresh session, PORT 4385, isolated snapshot, built from
`runtime/dist` at commit `49f90b2`. Independent instrument again (mechanics borrowed from
`runtime/scripts/e2e-m2l2.cjs`, all guards rewritten); the shipped guard was exercised only as a
subject, never as my evidence. Screenshots: `screens-l2-projector/r1-*.png` (59 files).

### Session exercised (observed, this session)

One 12-desk session, 1 `/teach` (1440x900) + **two live `/board` pages held at 1366x768 and
1920x1080 for the whole session** (no resize-and-restore) + 12 `/play` desks at 1024x600:
LOBBY -> HOOK -> PLAY wk1 (12/12 locked) -> bell -> wk2 star departure -> bell -> mid-lesson
Handed-To-You release, all 3 groups paged -> wk3 with one desk that never locks -> bell
(auto-commit observed true) -> REVEAL 5 presses (**freeze + unfreeze at stage 3**) -> ADAPT ->
ARGUE -> SYNTHESIS 5 cards -> COMPLETE.
**29 board frames x 2 shapes = 58 measurements.** Each measurement runs five independent truncation
detectors (declared `text-overflow:ellipsis`; Range-measured rendered text box vs the element's own
content box, *including* when overflow is `visible`; clipped-vertically; `-webkit-line-clamp`;
`scrollWidth > clientWidth`), a full font-size census (1496 text elements), a `#stage` fit check in
both axes, and a rendered-output privacy scan of `innerText` + whole-document `innerHTML`.

### 1. Truncation — the dissent's subject (observed)

**Zero offenders in 58 measurements, at both shapes, on every frame from LOBBY to COMPLETE.**
The week-1 and week-2 schedules at 12 desks now render every club whole at 1366x768 and 1920x1080 —
`Desk 3 · Golden State / HOSTS Oklahoma City DRAW 71`, `Desk 10 · Philadelphia / HOSTS New Orleans
DRAW 72`, plus the league-office row `Toronto / HOSTS New York DRAW 44` (13 rows)
(`r1-03-week1-schedule--1366x768.png`, `--1920x1080.png`, `r1-05-week2-shock--*.png`,
`r1-06-week3-schedule--*.png`). The two-line pair card uses the space the old frame wasted; no
`white-space:nowrap` and no `text-overflow` survive in that block.

**Non-vacuity, proven twice on a live frame (observed).** I re-injected
`.hl-pair-host,.hl-pair-visitor{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}` into the
running 12-desk board at 1366x768: my detector named **26 offenders** (13 hosts + 13 visitors), and
the **shipped `e2e-m2l2.cjs` predicate, run verbatim on the same poisoned frame, named the same 26**.
The shipped guard can see the defect it claims to guard. (The repair note's "13 named offenders" is a
different frame/desk count; not contradicted, not re-derived — inferred.)

### 2. Evidence tier vs the 2.6% floor (observed, measured)

Every element P-2 named now renders at **2.67% of screen height at both shapes** (1.5vw; minimum
across all instances, not the first match):

| element | instances | min measured | example |
|---|---|---|---|
| `.hl-bar-foot` | 62 | 2.67% | `Memphis $243,040 · Golden State $211,002` |
| `.hl-ledger-draw` | 10 | 2.67% | `spent $339,434 · dealt $905,108/$1.18M` |
| `.hl-pipe-nums` | 12 | 2.67% | `gate 24.3% · national 34.2%` |
| `.hl-mean-lbl` | 6 | 2.67% | `WEEK 1` |
| `.hl-ledger-bar b` / handles / `.hl-pair-*` / `.hl-summary` | 500+ | 2.67% | — |

P-6's `.hl-week-strip-*` and `.hl-chip-who/.hl-chip-size` also clear it (2.67%). The gave/got dollar
values are out of the dark-ink-inside-the-bar position and onto the row foot.

Residual sub-floor type, **new observation, non-blocking**: the colour-key legends that make the
bars interpretable render at **2.13%** — `the club visiting you`, `what YOUR spending put on other
clubs' books`, `national — identical for every club` (`r1-10-reveal1-g1--1366x768.png`,
`r1-12-reveal-stage2--*.png`, `r1-13-reveal-stage3--*.png`). Also `hosts` on the schedule 2.13%, the
word `DRAW` on lobby chips 1.78% (its numeral 2.67%), the model-honesty foot 1.87%, and the
SYNTHESIS card-5 source lines 1.69%. Nothing here is a number the room must read; the legend is the
one worth raising next.

### 3. Fit, privacy, coupling, fallback (observed)

- **Fit: zero overflow, zero clipping, both axes, 58/58 measurements.** No regression from the
  layout change.
- **Privacy: zero hits.** 58 scans of board `innerText` + full `innerHTML` for 36 deliberately
  distinctive joined-name tokens (`Pair N Zylq<N>xn Krevanti<N>`) and for `seatId` / `rejoinPin` /
  `data-seat` / `pin=`: nothing. The board's only identifiers remain `Desk N · <real club>`.
- **Zero console errors** across 15 pages for the whole session.
- **Freeze mid-reveal, board vs /teach (P-3, half repaired):** the board still blanks to the single
  word `FROZEN` (`r1-13-frozen-midreveal--1366x768.png`), but **/teach no longer lies about it**.
  ON-THE-PROJECTOR now reads `FROZEN — one word on an otherwise empty projector · The board is NOT
  showing the lesson. Every student device has lost its controls... · Do not say "look at the board"
  until you press...` (`r1-14-teach-while-frozen.png`). The truthfulness defect in
  teacher-fallback-verdict is **discharged**; the blank projector itself is unchanged.
- Unfreeze restored the exact beat (`FOUR PIPES, ONE CLUB`), measured clean at both shapes.
- Bell auto-commit on the desk that never locked: still correct.

### 4. NEW BLOCKING FINDING (classroom-reliability) — not part of this dissent

**R-1. On the canonical teacher path, REVEAL stage 5 tells the room something untrue about itself.**
Observed: I released the Handed-To-You bar after the week-2 bell and paged all three groups **before
any desk priced week 3** — the arc this gate praised, and the arc `/teach` itself prescribes ("The
Handed-To-You bar is available. It lands hardest after WEEK 2 — hold it one more week if you can",
`hostTheLeague.ts:2894`). Stage 5 then printed, on the projector:
`This room did NOT see the Handed-To-You bar before it played week 3, so nothing on this frame can
be about the bar.` (`r1-15-reveal-stage5--1366x768.png`, `--1920x1080.png`).
Cause (observed in source, confirmed by controlled probe): `sawBarBeforeWeek3 = ... barReleasedAtWeek
< WEEK_COUNT - 1` (`hostTheLeague.ts:2433`). `barReleasedAtWeek` is `state.weekIndex` at press time,
which is already `2` the moment the week-2 bell lands, so the recommended release scores as "after".
Two-arm probe on an isolated server (PORT 4386, 4 desks): release **during** week 2 -> `This room
did see the Handed-To-You bar...`; release **after the week-2 bell** (12-desk session above) -> the
false clause. Room consequence: the projector disclaims the exact "did the room change its mind?"
payoff the mid-lesson release exists to create, while /teach's stage-5 coaching asks the room that
question. This is a surface-coupling truth defect, not a truncation one, and it is blocking under
classroom-reliability.

### 5. Status of the eight non-blocking items (noted, not demanded)

- **P-3 freeze** — half done: mirror truthful (observed); board still blanks (observed).
- **P-4 `WAITING`** — open. REVEAL stage 0 still opens on `WAITING / Waiting for your teacher to put
  up the first beat.` (`r1-09-reveal-stage0--1366x768.png`).
- **P-5 stage 5** — open as a *chart*: still three near-identical gold bars (17.5% / 17.5% / 16.3%)
  with the copy carrying the whole argument (`r1-15-reveal-stage5--1366x768.png`). The copy is much
  stronger and now names the last-week horizon; the back-row read of a 1.2-point move is unchanged.
- **P-6 type** — done (2.67%).
- **P-7 `/play` 1024x600 fold** — the repair added fold assertions to the shipped e2e; **not
  re-measured by me this session** (inferred, NOT VERIFIED here).
- **P-8 ADAPT paging line** — open: the ADAPT mirror still says only "The Handed-To-You bar stays up
  beside the questions", never that the room is seeing 5 of 12 desks (`hostTheLeague.ts:2718-2721`,
  observed in the live director panel).
- **P-9 duplicate-join console error** — NOT VERIFIED (duplicate join not exercised this session).

### Not verified (unchanged)

A real projector in a real room; colour-vision separation of the five-segment palette; student-device
rejoin-by-PIN; `Restore last good state`; any real student. Nothing here is classroom-proven (D10).

PROJECTOR FIT CONDITION (overflow/clipping): **DISCHARGED** — 58 measurements, zero findings.
PROJECTOR LEGIBILITY + SCHEDULE READABILITY (P-1, P-2): **DISCHARGED** — measured, both shapes, with
a non-vacuous instrument.
BOARD TRUTH ABOUT THE ROOM (R-1, new): **NOT DISCHARGED** — blocking, classroom-reliability.

DISSENT proj-l2-truncation: DISCHARGED

---

## W4 ADJUDICATION

Owning-critic ruling on dissent `proj-l2-bar-timing` (my wave-3 R-1). Fresh session, live, PORT 4392,
mechanics lifted from `runtime/scripts/e2e-m2l2.cjs` at head `df14bfb`. Four arms, one server, one
session each; 12 desks for the prescribed arm with two live `/board` pages held at 1366x768 and
1920x1080 for the whole session; 4 desks for the three control arms. Zero console errors across all
arms and all surfaces. All shares set high in weeks 1-2 and cut in week 3, so every arm lands on the
DOWN branch — the branch the repair also claims.

### 1. The dissent's subject — four-arm probe (observed)

| arm | release point | `barReleasedAtWeek` | stage-5 clause printed | DOWN branch names the bar |
|---|---|---|---|---|
| A — the /teach-prescribed release | after the week-2 bell, before any desk priced week 3 | 2 | `saw ... DURING week 3` | yes |
| B | during the week-2 open window | 1 | `did see ... before it played week 3` | yes |
| C | never pressed (auto-release on PLAY exit) | 3 | `did NOT see ...` | **no** |
| D | during the week-3 open window | 2 | `saw ... DURING week 3` | yes |

**The false negation is gone.** Arm A no longer prints `This room did NOT see the Handed-To-You bar
before it played week 3, so nothing on this frame can be about the bar.` to a room that had been
reading the bar the whole of week 3. That was the whole of R-1 and the whole of the dissent, and it
is repaired: `sawBarBeforeWeek3` at `hostTheLeague.ts:2988` now tests `<= WEEK_COUNT - 1`, and the
week-3 **bell**, not the week-2 bell, is the boundary. Arm C confirms the predicate is not merely
true-for-everything: the room that never saw the bar is still told so, and the DOWN sentence in that
arm refuses to name the bar (`the bar is not on the table`), which is the second half of the repair
claim and holds. Screenshots `screens-l2-projector/w4-reveal5-A-prescribed--1366x768.png`,
`--1920x1080.png`, `w4-reveal5-B-duringWk2--1366x768.png`, `w4-reveal5-C-never--1366x768.png`,
`w4-reveal5-D-duringWk3--1366x768.png`.

The unit pin at `src/test/hostTheLeague.test.ts:1010` covers the same four release points, but it
assigns `barReleasedAtWeek` directly rather than driving `/teach`. It is a real regression guard for
the predicate; it is **not** a guard that the prescribed teacher press produces the stamp it asserts.
The live arms above are what closes that gap this session.

### 2. NEW BLOCKING FINDING (classroom-reliability) — same line, same path, smaller

**W4-1. On the prescribed release, the board tells the room some desks had already locked when none
had.** Observed, arm A, both shapes. The frame reads:

> This room saw the Handed-To-You bar DURING week 3, before the last bell — **some desks had already
> locked** — so the bar is one of the things that could have moved it, **for the desks that had not**.

In arm A the bar went up after the week-2 bell and before any desk touched a week-3 dial: zero desks
had locked. `barReleasedDuringLastWeek` (`hostTheLeague.ts:2993`) is true for `barReleasedAtWeek ===
WEEK_COUNT - 1`, and that single value covers two different rooms — the clean "everybody saw it
before they priced" room that `/teach` prescribes, and the messy "released mid-week-3" room of arm D.
The copy asserts the messy one unconditionally.

Why it blocks rather than annotates: it is the same category I blocked in wave 3 — the projector
asserting a fact about the room that the room knows is false — on the same beat and the same path.
The cost is not only truth. On the prescribed timing every desk in the room saw the bar before it
priced, which is the cleanest possible setup for "did you change your mind?"; the board hedges that
into a partial case and invites the class to think the bar reached only part of the room. The
existing state cannot distinguish the two rooms, so the fix is a stamp at release (how many desks
were locked into week 3 when the button was pressed) plus a third clause — not a copy edit alone.

**W4-2 (blocking, classroom-reliability). `/teach`'s stage-5 coaching is invariant to the clause the
board actually printed.** Observed: the ON-THE-PROJECTOR mirror is byte-identical across all four
arms, including arm C, and in every arm it instructs the teacher `Do not resolve it: this board
deliberately refuses to choose between the rule and the bar.` In arm C the board has already chosen
— `the bar is not on the table: the last-week rule ... is the cause this board can see`. A teacher
who never pressed the optional bar button (a plausible random-teacher path, which is exactly why the
module ships an auto-release fallback) is coached to run a two-candidate argument the projector has
closed, and is contradicted by the screen behind them at the lesson's argument beat. This is the same
defect shape as P-3's freeze mirror, which this gate required repaired.

### 3. Coupled-session re-check around the layout change (observed)

- **Fit: zero findings.** Every board frame from PLAY week 1 through SYNTHESIS, at 1366x768 and
  1920x1080, under an independent instrument (viewport-escape, `scrollWidth` overflow, declared
  `text-overflow:ellipsis` actually ellipsizing, document scroll, `#stage` overflow). No composition
  regression from the layout change; the fit instrument's green is corroborated, not taken.
- **Privacy: zero hits.** Board `innerText` and whole-document `innerHTML` scanned on every captured
  frame for 24 deliberately distinctive joined-name tokens (`Zylq<N>xn Krevanti<N>`) and for
  `seatId` / `rejoinPin` / `data-seat` / `pin=`. Nothing. The board's only identifiers stay
  `Desk N · <real club>` and the pager's `Desk N`.
- **`/play` two-column decision surface at 1024x600 (spot-check, observed).** Grid resolves to
  `624px 340px`; zero horizontal overflow inside `#hlPlayRoot`; document height exactly 600 — no
  scroll at first contact. Hit-tested, not measured: the top element at the centre of `#hlPriceDial`
  is the dial, at `#hlShareUp` is the button, at `#hlLock` is the lock. LOCK IT IN sits in a fixed
  bottom bar at 548-592. `screens-l2-projector/w4-play-twocol-week1--1024x600.png`. No regression
  found. The rejoin-PIN banner eats the top ~100px of a 600px screen at first contact, which is a
  `/play` composition cost, not a projector one, and it is dismissible.
- **Stage-5 chart, correction to my own P-5 (observed).** Wave 3 recorded three near-identical gold
  bars as a standing defect. With a room whose week-3 play actually differs the chart reads
  32.9 / 32.9 / 2.5 from the back with no effort. P-5 was a property of that session's play, not a
  fixed property of the frame; I withdraw it as a chart defect. What remains true is that stage 5
  carries a seven-line prose paragraph occupying more vertical space than its chart, with ~120px of
  dead frame beneath it.
- **Reveal choreography and manual fallback (observed).** Every beat in every arm advanced only on a
  teacher press — `#btnRevealNext` five times, `#btnCloseWeek` per bell, `#btnHandedTo` for the bar.
  No timer moved any surface. The paged Handed-To-You bar labels its slice `GROUP 1 OF 3 — DESK 1,
  DESK 2, DESK 3, DESK 4, DESK 5` over rows headed `Desk N · <club>`, the same convention ruled on in
  `GATE_L1_PROJECTOR.md`.
- **New non-blocking observation.** A decorative light panel sits at roughly x 970-1310, y 40-500 at
  1366x768 on the PLAY frames, and its edge crosses the Handed-To-You bars; the light `national
  check` segment reads at two different tints on either side of that edge
  (`w4-bar-release--1366x768.png`). Segment-boundary legibility is the visual critic's ground; I
  name it, I do not rule on it.

### Not verified (this session)

A real projector in a real room; colour-vision separation of the five-segment palette; freeze /
unfreeze; refresh, rejoin-by-PIN, mid-class restart, `Restore last good state` (all previously
observed, none re-exercised here); duplicate-join console error (P-9, still open); P-4 `WAITING`,
P-7 `/play` fold assertions, P-8 ADAPT paging line — all carried unchanged and untouched by this
adjudication. Any real student. Nothing here is classroom-proven (D10).

### required-repairs (this adjudication)

**Blocking (classroom-reliability)**
- **W4-1** — stop the stage-5 frame asserting `some desks had already locked` / `for the desks that
  had not` on a release where no desk had locked. Needs a locked-count stamp at release plus a third
  clause. `hostTheLeague.ts:2993`, `:3016`. Evidence `w4-reveal5-A-prescribed--1366x768.png`,
  `--1920x1080.png`.
- **W4-2** — make `/teach`'s stage-5 ON-THE-PROJECTOR mirror follow the clause the board printed;
  it must not promise "this board refuses to choose" in the arm where the board chose.

**Non-blocking (before classroom release)**
- W4-3 — stage 5 gives more vertical space to a seven-line paragraph than to its chart, with dead
  frame below. Carried P-5, re-aimed at composition, not at the bars.
- W4-4 — the colour-key legends that make the bars interpretable still render at 2.13%, below the
  2.6% back-row floor. Carried, unchanged.
- W4-5 — the decorative panel edge crossing the Handed-To-You bars (referred to the visual critic).

PROJECTOR FIT CONDITION (post-layout-change): **DISCHARGED** — re-measured, both shapes, whole
session, independent instrument.
BOARD PRIVACY: **DISCHARGED** — zero hits, every captured frame, both shapes.
BOARD TRUTH ABOUT THE ROOM: **NOT DISCHARGED** — W4-1 and W4-2, both new, both narrower than R-1.

DISSENT proj-l2-bar-timing: DISCHARGED — the off-by-one at the week-2 bell is repaired and the
prescribed-timing arm no longer prints the false negation; W4-1 and W4-2 are new findings on the same
line and do not resurrect it.

---

## W4 FINAL CONFIRM

Narrow owning-critic confirm of dissent `proj-l2-mirror-claims` (W4-1/W4-2 above). Fresh live
session, PORT 4394, mechanics lifted from `runtime/scripts/e2e-m2l2.cjs` (independent driver script,
guards rewritten, 4 desks per arm for speed — not the shipped harness). Two full sessions run
end-to-end to REVEAL stage 5: **Arm A** (the `/teach`-prescribed release — pressed immediately after
the week-2 bell, before any desk locked week 3) and **Arm C** (bar never pressed; relies on the
`onPhaseExit` auto-release fallback on leaving PLAY). Zero console errors, both arms, all surfaces
(teach/board/4 desks each).

**1. Release copy states only what happened — lock counts truthful (observed).**

- Arm A board (`#hlChange`): *"This room saw the Handed-To-You bar DURING week 3, before the last
  bell and before a single desk had locked week 3 in — so every desk in this room priced its last
  week having seen it..."* No claim of any locked desk, and none had locked at release time.
  Asserted live: `/desks had already locked/` does NOT match; `/before a single desk had locked week
  3 in/` does match. `screens-l2-projector/w4f-bar-release-A-prescribed--1366x768.png`,
  `w4f-reveal5-A-prescribed--1366x768.png`, `--1920x1080.png`.
- Arm C board: *"This room did NOT see the Handed-To-You bar before it played week 3, so nothing on
  this frame can be about the bar."* Correct for a bar never pressed.
  `w4f-reveal5-C-never--1366x768.png`, `--1920x1080.png`.
- The false clause this dissent exists to kill (`some desks had already locked` on a release where
  none had) did not print in either arm.

**2. `/teach` stage-5 mirror describes the arm the board is actually in, and differs across arms
(observed).**

- Arm A mirror: *"Do not resolve it: this board deliberately refuses to choose between the rule and
  the bar. This is the cleanest version of the beat: you released it after the week-2 bell and NOT
  ONE desk had locked week 3 yet, so every pair in this room priced its last week having seen the
  bar."* — matches the board's own "refuses to choose" posture. `w4f-teach-reveal5-A-prescribed.png`.
- Arm C mirror: *"The bar never went up in time, so this board has ALREADY chosen: the frame says the
  bar is not on the table and names the last-week rule as the only cause it can see. Do NOT offer the
  bar as a second candidate — the screen behind you has closed it."* — matches the board's own
  "already chosen" posture, and does not promise the open two-candidate argument Arm A's mirror
  promises. `w4f-teach-reveal5-C-never.png`.
- The two mirror texts are not byte-identical (asserted live); each is internally consistent with its
  own arm's board copy, which is the whole of W4-2.

**Not verified this session:** Arms B (during week 2) and D (mid-week-3, some locked) — not
re-driven live here; W4-1/W4-2's own unit-test coverage of those two (`hostTheLeague.test.ts:1122`,
`:1155`) and the builder's claimed six-arm mutation sweep (M-E/M-F caught) were read as source/evidence
but not independently re-derived by this narrow confirm. Freeze, refresh, mid-class restart, real
projector, any real student — unchanged from prior sections, not re-exercised.

DISSENT proj-l2-mirror-claims: DISCHARGED
