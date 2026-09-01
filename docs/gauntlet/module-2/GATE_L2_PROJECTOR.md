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
