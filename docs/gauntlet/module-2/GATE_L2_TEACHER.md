# GATE — Teacher Transfer, Module 2 Lesson 2 "You Don't Play Alone" (`m2l2-host-league`)

Fresh-context gate. Boss run `m2-quality-war`, assignment `gate-l2-teacher`.

**Cold protocol as executed.** The only repo file read before judgment was
`runtime/scripts/e2e-m2l2.cjs` (mechanics only, assertions ignored). Everything
else in the "before/during/after" sections below was learned from `/teach`,
`/board` and `/play` on a live server at PORT 4374. Sessions run:
`BOWPPH` (zero-student rehearsal, all 8 phases), `BOWGRT` (5 desks,
close-week misclick), `BOW3HE` (6 desks, Advance-during-PLAY misclick +
Restore), `BOW36Y` (6 desks + 1 late joiner + 1 desk that never commits, full
arc through COMPLETE, 5 reveals, 5 synthesis cards, desk refresh, board
refresh), `BOWX6P`/`BOWD9U` (pause / freeze / jump / console-recovery probes).
Zero console errors on any surface in any session. Only after all of that were
`runtime/README.md` §"Module 2, Lesson 2" and
`docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md` read.

Evidence ids: `gate-l2-teacher` (this report and the live sessions above,
observed), `l2-e2e` / `l2-tests` / `l2-tuning` (existing, not re-run this
gate — NOT VERIFIED by me), `readme-l2l3` and `design-c` (read at step 2 only).

---

## before-verdict

**NOT READY.**

What the product alone did give me, observed under `gate-l2-teacher` in the
zero-student rehearsal `BOWPPH`: the /teach landing page tells a first-time
teacher to create an empty session and press Advance through every phase, and
that rehearsal does carry NOW (with a per-phase minute budget), ON THE
PROJECTOR RIGHT NOW, TRIGGER, ASK (question + answer key), DON'T EXPLAIN YET,
THE BELL, TIME CUT, and two expandable panels — "What the students are looking
at" (the four market profiles with weekly bills and house prices, and the exact
reinvest-dial semantics: a 0-40% share in 5s of this week's door money, blind)
and "Where this model simplifies the real thing" (nine ledgered
simplifications, each with a named misconception risk). The league, the
three-week schedule, the two books (CASH vs DRAW), the week bell and the
control rhythm are all learnable from those surfaces without a document.

Three preparation defects block the exceptional-class standard:

1. **The console never tells the teacher what URL to put the projector on.**
   Observed: every /teach frame prints `JOIN AT http://localhost:4374/PLAY WITH
   CODE / BOWxxxx`. Zero occurrences of a `/board` URL across all 60+ captured
   /teach frames. A stranger teacher must guess `/board?code=BOWxxxx`. See also
   failure-recovery-verdict — guessing wrong is silent and damaging.
2. **The rehearsal the product recommends does not rehearse the two beats that
   matter most.** Observed: with zero desks, WATCH FOR — the only panel that
   diagnoses the room — never renders at all (it first appeared in `BOWGRT`
   once desks existed). And SYNTHESIS, which the console itself calls "the part
   the simulation does not do for you," collapses to a single placeholder card
   titled YOU DON'T PLAY ALONE reading "No weeks are in the books yet"; the
   live deck is five cards (SHARED PRODUCT / SPILLOVER / THE BIGGEST CHECK IS
   THE ONE NOBODY CONTROLS / MARKET SIZE IS NOT DESTINY / AND ONE MORE THING,
   `BOW36Y`). A teacher who rehearses exactly as instructed meets five unseen
   cards live, in the last seven minutes of the period.
3. **The prep copy miscounts its own reveals.** Observed on every REVEAL /teach
   frame: the heading reads **"THE SEVEN REVEALS"** above a list numbered 1/5
   to 5/5. A teacher preparing from this surface budgets seven beats.

Non-blocking but material: TIME CUT cues are keyed to absolute wall-clock
marks ("Past minute 44", "minute 46", "minute 55") and **there is no elapsed
clock anywhere on /teach** (searched every text node for a `mm:ss` or
minute/timer string in `BOW7AP`; the only hit was prose). Inferred consequence:
the cut logic is unusable without the teacher running their own stopwatch from
a start time the product never marks. `readme-l2l3` known gap (c) independently
records that the lesson "has never been timed against a real 50-60 minute
period."

The per-phase budgets themselves are coherent and were verified live:
LOBBY 2 + HOOK 4 + PLAY wk1-2 12 + PLAY wk3 5 + REVEAL 8 + ADAPT 5 + ARGUE 6 +
SYNTHESIS 7 + COMPLETE 1 = 50 min. The PLAY panel re-writes its NOW per week
(week 1 "read the schedule and get out of the way", week 2 "read the
star-departure card slowly… do not soften it", week 3 "watch the reinvest dial,
not the price"), so the control rhythm is legible from the surface.

## during-verdict

**NOT READY** — on one cause, at the emotional peak of the lesson.

Who is stuck is answered well and was observed live in `BOW36Y`: WATCH FOR
names every unlocked desk by number and club ("7 of 7 desks have not locked
this week"), the aggregate panel carries `n/N LOCKED IN` and the week counter,
the close-week button itself is labelled `◗Close week 2 (0/7 locked)`, and each
desk card shows club, market profile, cash, Draw, live dial position ("still
dialling $56 · 0%"), last week's fill % and this week's opponent. Room-ready is
a teacher call, and the panel says so and tells the teacher the consequence of
calling it early.

Two WATCH FOR groups carry the lesson's actual beats and were observed firing
on real state, not as static copy: "Hosting a big Draw this week — their
building is going to fill" (with "watch whether they RAISE it") and "Hosting a
collapsed Draw this week — through no fault of their own" (with "This is the
emotional risk of the lesson. Frame it as economics, never as blame").

Free-riding **is** a WATCH FOR — and it is wrong. Observed in `BOW3HE` and
`BOW36Y`: at REVEAL the group "Put nothing back, two weeks running" listed
Desk 6, the desk that **never locked a single week in the entire lesson** and
was auto-settled at house price with 0% reinvest by construction, alongside
desks that deliberately chose 0%. The panel's instruction is "Save these desks
for the WHAT YOU GAVE, WHAT YOU GOT board; their row is the one that starts the
argument." The product therefore directs the teacher to hold up a
never-participating pair, in front of the room, as the author of a strategic
choice they did not make. Nothing on any desk card marks a desk as having
auto-settled — the AUTO flag exists only on the student's own private screen
(observed in `BOW36Y`: "WEEK 1 — HOW IT WENT VS INDIANA · DRAW 26 AUTO").

Also blocking, and it lands in the argue phase the assignment asks about: the
ADAPT answer key cites a board the teacher cannot display. Observed in
`BOW36Y`, the ADAPT ASK for question 3 ("Who got most of that money back — you,
or the buildings you visited?") answers "the WHAT YOU GAVE, WHAT YOU GOT board
has each desk's two numbers." That board is REVEAL stage 2. At ADAPT the
projector shows the Handed-To-You bar plus the three questions, and the control
column has no reveal-back control at all — the full button inventory is
`btnRevealNext`, `btnBarPage`/`btnBarPageBack`, `btnSynthPage`/`btnSynthPageBack`
(and the reveal button reads "Every reveal has played" once spent). The one
ADAPT question that carries the spillover payoff and sets up Lesson 3 is the one
question whose evidence cannot be put back on the screen.

Reveal timing and the "what to SAY" problem are otherwise handled: the reveal
control names the next beat on the button face before it is pressed ("Reveal 2
of 5 — Who paid for whose night — the visitor ledger"), the five-item list marks
one item "on the projector" and the next "next press", and each carries its own
one-line instruction. The interdependence line is scripted and does land — the
board's own bar caption computed from `BOW36Y`'s class read "On 5 of 7 bars,
the biggest block at the door is the visiting club. Across the room, 47% of
every dollar that came through a door was brought by a club somebody else was
running." Bar paging is explicit and names the desks in each group ("Next group
— group 2 of 2: Desk 6, Desk 7").

## failure-recovery-verdict

**NOT READY.**

Highest severity first.

**`/board` with no `?code=` silently attaches to a different session, with no
error and no code entry.** Observed twice under `gate-l2-teacher`: loading bare
`http://localhost:4374/board` rendered `YOU DON'T PLAY ALONE — COMPLETE` — the
closing synthesis frame of the previous session (`v147`) — and on a second
probe rendered a *different* session's live week-1 schedule (`BOWX6P`, 3 desks).
There is no field on /board to enter a code, no "wrong room" state, and (see
before-verdict) no place on /teach that prints the correct projector URL. The
projector-failure path a real teacher hits — laptop rebooted, bookmark opened,
URL retyped without the code — therefore ends with the room staring at another
class's board, and in the case I observed, at this lesson's final synthesis
card before the class has played a single week. That is a reveal-spoiling
failure with no in-product recovery.

**The teacher console cannot be recovered outside its original tab.** Observed:
`localStorage` holds `bow-teach-session-code` and `bow-teach-session-key`, and a
same-tab reload restores the live room fully (verified mid-PLAY in `BOWX6P`:
room visible, phase PLAY, 3 desks, WATCH FOR intact). But a new tab in the same
browser, and a fresh browser context, both render only "START A SESSION" with
no resume control and no code field (`BOWD9U`). A teacher who closes the tab,
clicks the wordmark, or opens /teach on a second machine sees only one available
move — create a new session — which strands the whole room on the old code.
`readme-l2l3`'s own last known-gap bullet records that "a lost-teacher-key
recovery scenario" has never been exercised; this gate exercised it and it
fails.

What does recover, observed:

- **Misclick — Advance pressed during PLAY.** Guarded by a confirm that states
  the real consequence: "Week 2 of 3 is still open (0/6 desks locked in). This
  is not the week bell — advancing now settles this week for every club AND ends
  the season early, so 1 week will never be played. 6 desks have not locked;
  they settle on whatever is on their dials right now. Continue?" Same idiom on
  Jump to REVEAL. If accepted anyway, **Restore last good state** returned the
  session from REVEAL to PLAY week 2 with all state intact (`BOW3HE`).
- **Misclick — Close week pressed with nobody locked.** No confirm. Observed in
  `BOWGRT`: pressing `◗Close week 1 (0/5 locked)` settled the entire league at
  house price instantly and moved to week 2. The button label carries the count,
  which is the only guard. Lower consequence than Advance, and Restore is
  available, but this is the misclick most likely early in a period.
- **Desk refresh** mid-week: restores club, cash, Draw, dials and history.
- **Board refresh**: restores the current frame.
- **A desk that never commits**: auto-settled every week at house price, marked
  AUTO on its own screen, never skipped, never zeroed. Correct — but invisible
  to the teacher (see during-verdict).
- **Late joiner** (joined during week 2, `BOW36Y`): claimed Desk 7 · L.A.
  Lakers, inherited the club's real books with a synthetic week 1 marked
  `COVERED`, got a rejoin PIN, and appeared in WATCH FOR immediately. Nothing on
  any teacher surface explains "covered" (zero occurrences of the word in any
  /teach frame) or flags that a desk inherited a club — see
  hidden-knowledge-findings.
- **Bot handover** is legible on the student and board surfaces ("league
  office" beside every bot club, on desk cards and the schedule).
- **Pause** and **Freeze** both work and produce distinct student copy
  ("Paused — everything you've done is saved. We'll pick back up shortly." vs
  "Your teacher has frozen the session. Hang tight.") and distinct board frames
  (PAUSED / FROZEN). Which to use when is nowhere on the surface.

Not verified by me: server restart / snapshot quarantine, PIN LOCKED / Unlock
flow, `l2-e2e` / `l2-tests` / `l2-tuning` (not re-run this gate).

## synthesis-verdict

**READY.**

The five-card deck was delivered live off the board in `BOW36Y` and the
economics is correct and correctly ordered, with every number computed from the
class's own weeks:

1. **SHARED PRODUCT** — "47% of every dollar that came through a door in this
   room was brought by a club somebody else was running," with the room's own
   largest instance named (Desk 1 · New York, week 3, Oklahoma City at Draw 73,
   $858,186). Definition given as "one thing, made by two clubs, sold once."
2. **SPILLOVER** — the give/got pair for two named desks (Desk 4 gave
   $2,226,218, got $536,192; Desk 1 got $1,622,130, gave $887,948), then "A cost
   or a benefit that lands on somebody who did not choose it is a SPILLOVER —
   the grown-up word is EXTERNALITY. Nobody here did anything wrong; the money
   simply does not land where the effort goes." That is the externality, stated
   correctly (uncompensated third-party effect), non-moralised, and earned from
   lived numbers rather than asserted.
3. **THE BIGGEST CHECK IS THE ONE NOBODY CONTROLS** — the four pipes with two
   desks' real percentages (Milwaukee national 55.6% vs gate 16.6%; Lakers 29.1%
   vs 26.3%), and the honesty clause the teacher panel also scripts: the check
   is not free money, the networks get to say when your team plays.
4. **MARKET SIZE IS NOT DESTINY** — the room's own arithmetic (small-market
   Memphis $785,680 vs big-market Golden State $523,212 on a specific week),
   plus OKC's 2025 title as the real-world counter.
5. **AND ONE MORE THING** — the Module 1 cap bridge (2025-26 cap +10% to
   $154.647M; 2026-27 $164.961M), the exit question, and eight dated sources
   with verification dates and an explicit rights line.

The beyond-sports step is present on every card as a fixed footer: "One great
store that brings the whole mall its foot traffic. A group project where one
person's work sets everybody's grade. A street where one shop closing empties
the block. A band that needs the other bands on the bill to fill the room."
Four generalizations, all genuinely externality/interdependence, none
sports-dependent. It is one static line rather than a per-card generalization —
adequate, not tailored.

The sequencing discipline transfers: DON'T EXPLAIN YET withholds REVENUE
SHARING at every phase and releases SPILLOVER only at ADAPT and EXTERNALITY only
at SYNTHESIS, and the last card names revenue sharing as *next* lesson's rule.
The full chain the mission requires is walkable from the surface: experienced
moment (your building half empty because the club you hosted lost its star) →
class result (the Handed-To-You bar and the give/got ledger, computed) → real
sports (LeBron 2010/2014 on the ledger card, Luka/Dallas at ARGUE with the
Flagg lottery attached in the same breath, Chase Center at the pipes card,
Lakers/Grizzlies local media at HOOK) → formal term (SHARED PRODUCT,
SPILLOVER/EXTERNALITY) → outside sports (the footer). ARGUE is armed: the board
carries the Dallas exhibit with its counter-case and a non-resolving prompt, and
the panel says "Do not let this become a conversation about whether the trade
was good. It is a conversation about who else it cost."

Two non-blocking defects. The SYNTHESIS TIME CUT reads "Say YOU DON'T PLAY ALONE
and THE BIGGEST CHECK IS THE ONE NOBODY CONTROLS" — but no live card is titled
YOU DON'T PLAY ALONE (that title exists only on the zero-student placeholder),
so under time pressure the instruction points at a card that is not in the deck.
And reveal stage 5's board reads "down 1 points".

## hidden-knowledge-findings

Behaviour a competent stranger cannot get from the surfaces, all observed under
`gate-l2-teacher`:

- **The projector URL.** Never printed. Only the /play join URL and code are on
  /teach. Founder knowledge: `/board?code=XXXXXX`.
- **How to get the teacher console back.** The code and key are in
  localStorage, but no surface offers resume, and no surface tells the teacher
  that same-tab reload works and a new tab does not.
- **Pause vs Freeze.** Two adjacent buttons, no on-surface distinction. Which
  one is for a fire drill and which is for "screens down, eyes here" is not
  derivable.
- **"COVERED".** A late joiner's inherited week appears on the student screen as
  `COVERED` and the word never appears on any teacher surface. When the student
  asks where their week 1 came from, the answer is founder knowledge.
- **Which desks auto-settled.** Only the student's own private screen carries
  AUTO. The teacher cannot see, at any point, that a desk has never once
  committed — and the free-rider WATCH FOR actively mislabels them.
- **Where the period actually is.** Absolute-minute TIME CUT triggers with no
  clock; the teacher must know to start their own timer at the LOBBY press.
- **Board update latency.** The projector trailed a teacher press by roughly one
  poll (observed at 700 ms wait: board one version behind; matched at 1300 ms).
  Inferred, not stated anywhere: do not talk into the press.

## required-repairs

### Blocking (teacher-transfer)

- **B1 — `/board` with no code must not render another session.** Bare `/board`
  currently attaches silently to some other live session and, in one observed
  case, put a previous class's COMPLETE synthesis card on the projector. Ship a
  code-entry state on /board, and print the projector URL (`/board?code=…`)
  beside the join URL on every /teach frame. (`gate-l2-teacher`, sessions
  `BOWX6P`, `BOW36Y`.)
- **B2 — Teacher console must offer a visible resume.** A fresh /teach load in a
  new tab or a second machine shows only "START A SESSION" while the live code
  and key sit in localStorage. Add a resume affordance (auto-resume plus a code
  + key entry). Failing this, one stray navigation ends the class.
  (`gate-l2-teacher`, `BOWD9U`; `readme-l2l3` known gap, last bullet.)
- **B3 — WATCH FOR must not present an auto-settled desk as a free-rider.**
  Split "Put nothing back, two weeks running" into desks that *chose* 0% and
  desks that were auto-settled, and add a cumulative "has never locked a week"
  flag to the desk card, with different director copy for each. As shipped, the
  panel directs the teacher to make a never-participating pair the protagonist
  of the argument. (`gate-l2-teacher`, `BOW3HE`, `BOW36Y`.)
- **B4 — ADAPT's third question must be answerable from the projector.** Its
  answer key cites the WHAT YOU GAVE, WHAT YOU GOT board, which is REVEAL stage
  2 and cannot be recalled — there is no reveal-back control. Either add a
  reveal-back / recall control, or put the give-and-take figures on the ADAPT
  frame. (`gate-l2-teacher`, `BOW36Y`.)
- **B5 — The rehearsal the product prescribes must rehearse SYNTHESIS and WATCH
  FOR.** With zero desks, WATCH FOR never renders and the five-card deck
  collapses to one placeholder. Ship an explicit rehearsal mode that renders the
  five card *templates* and sample WATCH FOR groups over stand-in figures,
  clearly marked as rehearsal, or amend the landing-page promise so it does not
  claim the whole period is rehearsable. (`gate-l2-teacher`, `BOWPPH`.)

### Non-blocking

- **N1 —** "THE SEVEN REVEALS" heading over a five-stage list, on every REVEAL
  /teach frame.
- **N2 —** SYNTHESIS TIME CUT names a card title ("YOU DON'T PLAY ALONE") that
  does not exist in the live deck; say "card 1, SHARED PRODUCT" or retitle.
- **N3 —** No elapsed clock on /teach against absolute-minute TIME CUT triggers.
  A session timer started at the first Advance would make every cut usable.
- **N4 —** Pause and Freeze need one line each on the teacher surface saying
  what they are for.
- **N5 —** `◗Close week N` has no confirmation when 0 desks are locked, unlike
  Advance and Jump to REVEAL which both carry consequence-stating confirms.
- **N6 —** Reveal stage 5 board copy: "down 1 points".
- **N7 —** "COVERED" needs one line of teacher-facing explanation when a late
  desk claims a club mid-lesson.

---

**TRANSFER: NOT READY**

Formal dissent is recorded in advance of any contrary decision on B1 and B4: a
projector that can silently show another class's closing card, and a scripted
discussion question whose evidence cannot be put on screen, are both
teacher-transfer failures regardless of how well the rest of the console
directs.

---

## RE-CHECK AFTER L2 REPAIR

Owning-critic confirm-or-refute of dissent `teacher-l2-not-ready`, Boss run
`m2-quality-war`, assignment `recheck-l2-teacher`. Cold-style: the only repo
file read before driving the product was `runtime/scripts/e2e-m2l2.cjs`
(mechanics only). Live server PORT 4383 (`npm run build` run this session).
Sessions driven: `BOWDV7` (zero-student rehearsal, all 8 phases, synthesis
paged), `BOWHYM` (7 desks, 3 weeks, desk 6 chose 0% twice, desk 7 never locked
once, through SYNTHESIS), `BOW3FR` (mid-session new-tab probe), `BOWT7F`
(0-locked close-week probe + second-machine reopen), `BOWRXH` (board code-entry
probe). Zero console errors and zero pageerrors on every surface in every
session. Evidence id: `recheck-l2-teacher` (observed).

### The five repros

**B1 — bare `/board`. FIXED.** Observed: bare `http://localhost:4383/board`
loaded in a fresh browser context while `BOWHYM` was live renders a
`WHICH ROOM?` state with a `#boardCodeInput` field — "This projector is not
pointed at a room yet. Type your class code" — and no session content. Entering
the live code puts the correct room up and rewrites the URL to `?code=`, so a
projector refresh keeps the room (`BOWRXH`). Every `/teach` frame in every
phase, including LOBBY, now prints `PUT THE PROJECTOR ON
HTTP://LOCALHOST:4383/BOARD?CODE=<code>` beside the join line (11 of 11
captured frames).

**B2 — teacher console outside its tab. FIXED.** Observed in `BOW3FR`: a new
tab in the same browser, opened mid-PLAY with `bow-teach-session-code` and
`bow-teach-session-key` in localStorage, renders the live room directly —
`LIVE · V5`, `2 JOINED`, `DIRECTING PLAY`, full control column, `#room` not
hidden. A genuinely fresh context correctly falls back to START A SESSION plus
a `Reopen a session from another device` form; driven with code + key it
reopened `BOWT7F` at PLAY on the right code.

**B3 — never-locked vs chose-zero. FIXED, both limbs.** Observed in `BOWHYM`
at REVEAL: desk 7, which never locked once, is its own WATCH FOR group — "Has
never locked a week — every week settled automatically … they did not choose
0%, they chose nothing. Go to the desk. Do NOT use them on the gave/got board
and do not name them in the argument: they are not the free-rider case, they
are the pair you have not reached yet." The free-rider group is now titled
"CHOSE to put nothing back, two weeks running" and contained only desks 4 and 6,
both of which locked at 0%. The group also fires during PLAY, not only at
REVEAL. The desk card itself carries the cumulative flag: `Desk 7 · Indiana …
never locked a week — 2 settled AUTO`.

**B4 — ADAPT question 3. FIXED.** Observed in `BOWHYM`: the answer key now ends
"You do not need the reveal board back for this — every pair has its own two
numbers on its own screen right now, under WHAT YOU GAVE, WHAT YOU GOT. Tell
them to read their own." Verified against the students' actual ADAPT screens:
desk 1 carries WHAT YOU GAVE, WHAT YOU GOT with both figures ($893,640 out /
$934,142 in, net $40,502) plus the by-choice split ($188,992 / $127,602 /
$78,052); desk 7 carries the same panel with $0 in the by-choice rows. The
question is answerable from the surface the pair is already holding.

**B5 — the prescribed rehearsal. FIXED.** Observed in `BOWDV7` with zero desks:
WATCH FOR renders at every phase, prefixed `REHEARSAL — this panel is a sample,
because nobody has joined`, with sample groups including the big-Draw host, the
collapsed-Draw host, the never-locked desk and the CHOSE-zero desk, each with
its live director copy. SYNTHESIS pages five cards, not one placeholder —
`card 1 of 5 — REHEARSAL — SHARED PRODUCT` through `card 5 of 5 — REHEARSAL —
AND ONE MORE THING` — and the board renders each card in full with the
`REHEARSAL` marker on the frame. The rehearsal labelling disappears once real
desks exist (`BOWHYM` groups carry no prefix).

### Non-blocking notes

- **N1 FIXED.** The REVEAL heading now reads `THE 5 REVEALS`; zero occurrences
  of "SEVEN REVEALS" across all captured frames.
- **N2 FIXED.** The SYNTHESIS TIME CUT now reads "Past minute 55? Say card 1,
  SHARED PRODUCT, and card 2, SPILLOVER, and stop."
- **N5 FIXED.** `◗Close week 1 (0/3 locked)` now raises a consequence-stating
  confirm — "Nobody has locked in yet — 0 of 3 desks. This is the week bell …
  every desk that has not locked settles at its club's house price with nothing
  reinvested, marked AUTO. Ring it anyway?" — and dismissing it leaves the week
  open (`BOWT7F`).
- N3, N4, N7 NOT re-verified as fixed: no elapsed clock appeared on any
  `/teach` frame, and no Pause/Freeze or "COVERED" explanatory copy appeared.
  Unchanged, still non-blocking.
- N6 NOT VERIFIED this re-check — reveal stage 5 board copy was not sampled.

### New, non-blocking, introduced by the repairs

- **N8 — a mistyped code on `/board` strands the projector with no way back.**
  Observed in `BOWRXH`: entering `BOWZZZ` navigates to `/board?code=BOWZZZ`,
  which renders `CONNECTING… / reconnecting…` indefinitely (probed to t+29s),
  with the code field gone and no "no such room" state. Strictly safer than the
  old silent cross-session attach, and `/teach` now prints the correct URL, so
  the teacher has a visible recovery — but the field should come back on an
  unknown code.
- **N9 — the teacher key is never displayed, and the reopen panel says it was.**
  Observed: `runtime/src/client/teach/index.html:90` reads "It is shown once, on
  the console that created the session," and `#reopenKey` asks the teacher to
  "paste the key issued when the session was created." No `/teach` frame in any
  session printed the key; it is only written to localStorage
  (`runtime/src/client/teach/main.ts:132-134`). The same-machine path is covered
  by auto-resume, so this is not blocking, but the second-machine form is
  unusable and its instruction is false.

**TRANSFER: READY**

**DISSENT teacher-l2-not-ready: DISCHARGED**

## W5 RE-AFFIRMATION AT FINAL HEAD

Fresh-context stranger-teacher re-run at the final head, cold protocol: port 4432,
`runtime/scripts/e2e-m2l2.cjs` read for mechanics only (assertions ignored), no other
repo file read before judging. One full live session (code BOW7LC, 7 desks + projector
+ teacher console), all three weeks, all five reveal stages, ADAPT / ARGUE / all five
SYNTHESIS cards / COMPLETE.

### Exercised

- **Preparation cold:** `/teach` before any session; rehearsal panel with zero desks;
  both `<details>` drawers ("What the students are looking at", "Where this model
  simplifies the real thing").
- **Bar release at the prescribed moment:** held through week 2, released on the
  `TRIGGER: this is the moment` prompt after the week-2 bell with 0/7 desks locked into
  week 3; paged both groups forward and back.
- **Stage-5 mirror on two different arms:** (a) the degenerate arm produced by the
  misclick below — bar never released, weeks auto-settled — where `/teach` read "The bar
  never went up in time, so this board has ALREADY chosen... Do NOT offer the bar as a
  second candidate"; (b) the prescribed arm — "you released it after the week-2 bell and
  NOT ONE desk had locked week 3 yet... Ask the whole room, not a subset." Board text in
  both arms matched the mirror. The per-arm computation is real and truthful.
- **ADAPT give/take question + answer key vs the room's own numbers:** key printed
  -$375,467 desk-by-desk, $2,226,567 spent, $919,480 landed on other clubs' books,
  +$359,225 counted as one room, best band 10-15%, room average 14%. Cross-checked
  against REVEAL stage 2 and SYNTHESIS card 2 (identical figures on all three surfaces)
  and against the dials I actually set (mean of 300/21 desk-weeks = 14.3%; REVEAL 5
  weekly means 10.7 / 11.4 / 20.7 reproduce exactly). The key's closing instruction
  ("every pair has its own two numbers on its own screen right now, under WHAT YOU GAVE,
  WHAT YOU GOT") verified true on desks 1, 4 and 7; the computed dealt/bought line
  rendered per desk (100%/0%, 87%/13%).
- **WATCH FOR free-rider / never-locked distinction:** desk 7 never locked in any week;
  desks 1 and 2 chose 0% twice. `/teach` separated them correctly and dynamically —
  "Has never locked a week... they did not choose 0%, they chose nothing... Do NOT use
  them on the gave/got board" vs "CHOSE to put nothing back, two weeks running... read
  the by-choice column". The by-choice group correctly disappeared when those desks
  moved off zero in week 3.
- **Misclick:** `Advance ▸` pressed during PLAY with week 1 open. Confirm dialog named
  the exact consequence and the unlocked-desk count; accepting it ended the season and
  jumped to REVEAL. `Restore last good state` returned the room to PLAY week 1, 6/7
  locked, with every desk's locked recap intact on its own device.
- **Refresh / failure recovery:** student refresh mid-week (locked state preserved),
  projector refresh, `/teach` refresh (kept control). Unplanned bonus: the server process
  was killed by the environment mid-ADAPT; after restart from the snapshot the session,
  phase, all seven desks' three weeks and the teacher's control all came back and the
  lesson continued to COMPLETE. Only environment-caused `ERR_CONNECTION_REFUSED` console
  errors in that window.
- **Late join:** a new pair joined during ADAPT.

### New findings

**BLOCKING — B-1. The student device tells the never-locked desk it CHOSE, contradicting
the WATCH FOR instruction the teacher is given about that same desk.** Desk 7 never
pressed LOCK in any week; all three weeks auto-settled. `/teach` WATCH FOR (correctly)
says: "they did not choose 0%, they chose nothing... they are not the free-rider case,
they are the pair you have not reached yet." Desk 7's own screen at ADAPT says:
"WHAT YOUR OWN DECISIONS DID — YOU SPENT NOTHING, AND THAT IS A DECISION... Those three
zeroes are not missing numbers — they are your decision. You chose to give nothing back
to your club: $0, every week... Every zero in this block is somebody's decision,
including yours." The branch is computed on spend == 0, not on ever-locked, so the one
desk the module singles out as *not* a decision is the desk most emphatically told it
decided. A teacher who walks over as instructed is contradicted by the device in the
pair's hands, in the lesson's most delicate emotional moment. `/teach` gives the teacher
no line for that collision. Repair is a copy branch on the never-locked state, not
mechanics.

**BLOCKING — B-2. `ON THE PROJECTOR RIGHT NOW` is false at the prescribed bar release.**
Immediately after pressing "Release the Handed-To-You bar" at the moment `/teach` itself
prescribes, the panel reads: "Week 3 of 3 — the schedule / Every pairing in the league:
who hosts whom, with both clubs' Draw printed. / The star-departure card is up: Los
Angeles Lakers, Draw 10. / The Handed-To-You bar is up underneath the schedule." The
projector at that moment holds only the week strip, the bar pager, five bars, the legend,
the instruction and the summary: no pairings (`HOSTS` absent from the board entirely), no
departure card, and the bar is not underneath the schedule — it replaced it. Three of the
four sentences the teacher would read or rely on are wrong, at the highest-stakes control
press in the lesson, while the room is still pricing week 3. There is also no control to
put the schedule back. (The group-level footer "On the projector now: group 1 of 2 —
Desk 1..." *is* truthful; the defect is the phase-level mirror block only.) This is the
same defect class W4 repaired for the stage-5 mirror, unrepaired at a different moment.

**Non-blocking — N-1.** The pre-session rehearsal note on `/teach` is lesson-agnostic and
describes controls L2 does not have: it tells a teacher preparing L2 to rehearse "the
round step (once per round, then once more for the two-thirds test, then once more to
open the season)" and warns that Advance would "throw away the vote and the whole
season". Selecting M2 L2 does not change the text. A stranger teacher prepping tonight
will hunt for a vote and a round step that do not exist in this lesson.

**Non-blocking — N-2.** REVEAL stage 2 overflowed the projector by 2px at 1366x768 in
this 7-desk room (`#stage` 770 vs 768); stages 1, 3, 4, 5, ADAPT, ARGUE and all five
synthesis cards fit exactly at 1366x768 and 1920x1080. Trivial in the room, but it shows
the fit guard is only proven at the desk counts the e2e runs.

**Non-blocking — N-3.** Late join at ADAPT: the device correctly says "clubs are handed
out in LOBBY, HOOK or PLAY (session is in ADAPT)" but then sits on "You're in — finding
your club…" indefinitely while its join request 409s in a loop (the only non-network
console error of the run). `/teach` shows the pair in the join list and says nothing
about what to do with them. A teacher gets no direction for a common classroom event.

**Non-blocking — N-4.** `/teach`'s stage-5 line stops at "refuses to choose", but the
board also prints a partial conclusion for this arm — "The room went UP — against the
last-week rule... Whatever moved these desks, it was not the arithmetic of this lesson."
The teacher is not told the direction the room moved before facing it on the projector.

**Non-blocking — N-5.** The stage-2 / ADAPT room-level numbers (the -$375,467 desk-by-desk
loss, "no share to print here") include the never-locked desk's forced 0% in the room
average, while WATCH FOR tells the teacher to exclude that desk from the gave/got board.
Same tension as B-1, one level up.

**Not verified.** The answer-key constants that are not room numbers ("0% to 40% moves
the visitor block about 30%, at realistic dials nearer 19%"); the second-device `Reopen`
path; the bar pager at 3+ groups; any classroom with real children.

### Standing verdict

Preparation, pacing, the reveal ladder, the bell, the misclick guard, Restore, refresh
and mid-class restart recovery, and the experienced-moment → class-evidence → real-sports
→ term → outside-sports chain across all five synthesis cards are all strong enough for a
stranger teacher. B-1 and B-2 are both teacher-surface copy defects, both cheap, and both
put the teacher in front of the room saying something the product then contradicts.

**TRANSFER: NOT READY (at final head)**

**DISSENT teacher-l2-w5: recorded.** Re-affirmation withheld until B-1 and B-2 are
repaired and re-run on the never-locked arm and the prescribed-release arm.

## W5 NARROW CONFIRM

Owning-critic confirm of dissent `teacher-l2-final-head`, narrow to B-1, B-2, N-1, N-3.
Fresh live session on **port 4433** (`Confirm run 4433`, code BOWE4X, 7 desks + projector +
teacher console, 1366x768 board). Mechanics only were taken from
`runtime/scripts/e2e-m2l2.cjs`; every assertion in that script was ignored and every verdict
below is read off the rendered surface of my own driver, not off the builder's asserts.
Arms rebuilt to match the original repro: desk 7 never presses LOCK in any of the three weeks;
desk 1 locks every week and chooses 0% every week (both finish on $0); the Handed-To-You bar is
released at the prescribed moment — after the week-2 bell, week 3 open, 0/7 locked.
Zero console errors on all nine surfaces for the whole run, including the late joiner.

### B-1 — the never-locked desk is told it chose — **FIXED**

Read on three surfaces at ADAPT, in the same session, at the same instant:

- Desk 7's own device: header `WHAT YOUR OWN DECISIONS DID — NOBODY AT THIS DESK PRESSED LOCK,
  SO THESE WEEKS RAN AT THE HOUSE DEFAULT`; body "These zeroes are not a decision — they are the
  weeks that ran without you... That is not you choosing to give nothing; it is you not having
  chosen yet." The "YOU SPENT NOTHING, AND THAT IS A DECISION" / "Those three zeroes... are your
  decision" copy I read in W5 is gone from this desk.
- Desk 1 (locked, 0% x3, identical $0): `YOU LOCKED IN AND SPENT NOTHING, AND THAT IS A
  DECISION` — "you locked in and you chose to give nothing back". Desk 3 (spender) gets the third
  branch. Three distinct branches at the same $0 arithmetic.
- `/teach` WATCH FOR carries the collision line I asked for and quotes the device verbatim:
  "Their own screen agrees with you: it reads \"These zeroes are not a decision — they are the
  weeks that ran without you\"... Go to the desk and say the same." I checked the quoted string
  character-for-character against desk 7's rendered text; it matches. The ADAPT answer key
  repeats it. Desk 1 stays in a separate `CHOSE to put nothing back` entry; desk 7 is not in it.
- Aggregate panel flags Desk 7 `never locked a week — 3 settled AUTO`.

Inferred (source read after judging): one exported `neverLockedFor` atom
(`runtime/src/modules/hostTheLeague.ts:898`) with 23 call sites; `spend === 0` no longer decides
any copy branch. Observed behaviour matches.

### B-2 — `ON THE PROJECTOR RIGHT NOW` at the prescribed bar release — **FIXED**

Held the bar through week 2, released it on the panel's own TRIGGER with week 3 open and 0/7
locked; read the mirror and the board at the same beat.

- Pre-release mirror: "Every pairing in the league... The star-departure card is up beside it:
  Los Angeles Lakers, Draw 10. Desks locked in: 0 of 7... the Handed-To-You bar is not up."
  Board at that instant: 9 pairings with HOSTS + Draw, the Lakers card, `0/7 locked in`, no bars.
  True on every clause.
- Post-release mirror: "the bar has REPLACED the schedule. The projector is holding the week strip
  (0 of 7 locked in), the group pager, the Handed-To-You bars, \"Point at the club that paid for
  your night\", and the summary line. That is all of it. The pairing grid and the star-departure
  card are NOT on the frame any more — there is no control to put them back, and there does not
  need to be: every pair has this week's pairing and every Draw on its own device."
  Board at that instant (DOM): `pairs 0, bars 5, departure cards 0, the word HOSTS absent`;
  text holds `WEEK 3 OF 3`, `0/7 locked in`, `GROUP 1 OF 2 — DESK 1..DESK 5`, five bars, the
  legend, "Point at the club that paid for your night." and the 46% summary. Every clause of the
  mirror is on the board and nothing on the board is missing from the mirror. The lock count is
  the board's own. The missing-control complaint is answered in copy rather than left silent.
- Stage-5 mirror on this arm: "you released it after the week-2 bell and NOT ONE desk had locked
  week 3 yet... Ask the whole room, not a subset" — matches the board's stage-5 text.

### N-1 — lesson-keyed prep note — **FIXED (for L2)**

`m2l2-host-league`: "This lesson has exactly two interior controls: the week bell... and the
Handed-To-You bar, which you release ONCE, by hand... straight after the week-2 bell, before the
room prices week 3." No vote, no round step, no two-thirds test. `m2l3-write-rule` keeps its own
round step and two-thirds test; `m1l3` and `m2l1` have their own. Observed: `m1l1-draft-day`
(the default selection), `m1l2-trade-deadline` and `lobby-demo` still get the generic note with no
interior control named — out of scope for L2, noted for their own gates.

### N-3 — ADAPT late join, announced observer — **FIXED; observer-only accepted**

Device: `YOU ARRIVED AFTER THE LAST WEEK CLOSED` — "there is no club left to hand you — the three
weeks are already in the books. Pull your chair up to the nearest desk and read their screen with
them... You are not missing a turn, because nobody is taking one." No "finding your club…" hang;
no 409 loop (zero console errors on that page). `/teach` gains a `now`-urgency WATCH FOR entry
naming the pair, the reason, and the action ("pair them with a desk near the door"). The ADAPT
board still held its 5 bars after the join — the room's evidence did not move under the class.

**Ruling on the deliberate divergence:** observer-only satisfies the finding. My finding was that
the device stalls silently and the teacher is given no direction, not that a bot must take the
seat. Seating a club at ADAPT would retro-change room totals the class has already had read to it
from the projector; the builder's divergence is the better economics and the better classroom
move, and the copy makes the observer's status a stated fact rather than a failure.

### New findings this confirm (both non-blocking, neither in the dissent)

- **N-6.** The free-rider WATCH FOR label is a fixed string,
  `"CHOSE to put nothing back, two weeks running"` (`hostTheLeague.ts:3871,3985`), while the
  predicate is `>= 2` chosen weeks at 0%. Desk 1 chose 0% in all THREE weeks and the teacher is
  told "two weeks running". The intervention is unaffected; the number the teacher may say out
  loud is wrong. Make the label count the desk's own weeks.
- **N-7.** The abstention paragraph on the student device renders a lowercase sentence start:
  "...they are the weeks that ran without you. nobody at this desk pressed LOCK in any week..."
  (interpolation at `hostTheLeague.ts:2563`). It is on the one screen the teacher is instructed to
  stand over and read with a pair.

### Still open from W5, unchanged and still non-blocking

N-2 (REVEAL stage 2 fit proven only at the e2e desk counts), N-4 (`/teach` stage 5 does not tell
the teacher the direction the room moved before the board prints "The room went DOWN"), N-5 (the
room-average reinvest percentage in the ADAPT key still includes the abstaining desk's forced 0%;
this run printed "this room's dials averaged 17%").

### Not verified in this confirm

Late join during PLAY or REVEAL; second-device Reopen; misclick/Restore and refresh/restart paths
(confirmed in W5, not re-exercised here); the non-room constants in the answer key; any classroom
with real children.

**TRANSFER: READY (at final head)**

**DISSENT teacher-l2-final-head: DISCHARGED.** B-1 and B-2 are repaired on the arms that produced
them, verified from the rendered surfaces on port 4433. N-1 and N-3 are repaired for this lesson.
N-6 and N-7 are recorded as non-blocking copy defects and do not hold the gate.
