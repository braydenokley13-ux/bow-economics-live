# GATE — M2 L3 "Writing the Rule" (`m2l3-write-rule`) · Classroom / Projector

Fresh-context review of the three coupled surfaces as one session. Not the builder of any reviewed
surface. Evidence id: `gate-l3-projector`. Boss run `m2-quality-war`. The verdict is about the room,
not the code.

## Session exercised (observed, this session)

Three real Chromium sessions against a real server (`runtime/dist/server/index.js`, **PORT 4405**,
isolated snapshot file, server killed at the end). Independent instrument — mechanics borrowed from
`runtime/scripts/e2e-m2l3.cjs`, every guard rewritten, and two of the four blocking findings below
are invisible to the builder's guards.

- **Session A — full 12-desk arc.** 1 `/teach` at 1440x900; **two live `/board` pages, 1366x768 and
  1920x1080, attached for the whole session** (every frame measured at both shapes, never
  resized-and-restored); 12 `/play` desks at 1024x600. LOBBY -> HOOK (9 of 12 commit, 3 deliberately
  never do) -> PLAY rounds 1-3 (freeze/unfreeze drill mid-round) -> two-thirds test -> adoption ->
  season wk1 (one desk never locks) -> rookie -> wk2 -> wk3 -> REVEAL 5 staged presses (board refresh
  at stage 4) -> CONSEQUENCE -> COUNTERFACTUAL -> ARGUE (board refresh mid-vote at 7/12) -> the Kings
  reveal -> SYNTHESIS 7 cards + back-page -> COMPLETE.
  **39 board frames x 2 shapes = 78 audits.** Each audit: `#stage` scrollHeight vs clientHeight;
  declared `text-overflow:ellipsis`; horizontal and vertical self-clipping; every element's box
  against the viewport; sibling-ink overlap in every row/chip/rail container; adjacent block overlap;
  rendered font size as % of screen height for every leaf text node; and a privacy scan of the full
  projector **`innerHTML`**, not just rendered text.
- **Session B — fallback arms, 6 desks.** Deliberate maximum disagreement -> the two-thirds test
  fails -> **status-quo arm**; then **`Operate the league office's rule`**; then the hard fallback —
  the teacher advances straight out of PLAY with the entire season unplayed — through every remaining
  phase to the finale. 12 further board audits.
- **Session C — pairs-on-one-device.** Rejoin PIN on a replacement device mid-lesson.
- **Session D — line-level ink collision probe** on the ROUNDS histogram frame, independently
  reproducing finding B1 at both shapes.
- **Privacy method:** all 12 desks joined under realistic student names ("Maya & Eli",
  "Noah & Aviva", "Sam & Rivka" …) so a leak would be visible rather than argued.
- Screenshots: `docs/gauntlet/module-2/screens-l3-projector/` (82 files, `--1366x768` /
  `--1920x1080` suffixes).

---

## session-choreography-verdict

**BLOCKED for classroom release. FUNCTIONAL as a beat structure — the arc is real and the pacing is
entirely in the teacher's hand — but the two frames the room stares at longest are broken, and one
of them is broken in a way none of the shipped guards can see.**

Highest-severity finding first (blocking, classroom-reliability):

- **B1 — the histogram bars are printed through the veil sentence, at both projector shapes, on the
  frame that holds the room for rounds 2 and 3.** Observed and then independently reproduced in a
  second session. At 1366x768 four bar columns overlap the last line of the veil paragraph by
  **10px vertically and 73px horizontally each**; at 1920x1080 by **14px / ~104px**. The sentence
  destroyed is *"moves buildings. Nobody knows which club yet — not you, not your teacher, not the
  league office"* — the veil, which `/teach` instructs the teacher to *"Read … TWICE, word for
  word"*.
  Measured (session D, 12 desks, round 1 closed):
  `copy box 237..295 · hist container 302..487 · tallest bar 282..458` — the bar column starts
  **20px above its own container**. Root cause is arithmetic, not chance: `.wr-board-hist` is
  `height: 24vh` (`runtime/src/client/board/index.html:311`), the bar height is
  `Math.round((count/max)*22)+1` vh (`runtime/src/client/board/main.ts:1573`), and the tick label
  (`1.5vw`) plus a `.3vh` gap live **inside the same column** — so the tallest column is ~26vh in a
  24vh box and overflows upward into the copy. It fires whenever any bin holds the max count, i.e.
  always.
  Why the shipped suite passes it: `assertBoardFrameFits` cannot see it (the overflow is inside a
  fixed-height container, `#stage` scrollHeight is unchanged), `assertNoEllipsization` cannot see it
  (nothing is truncated), and `assertNoOverlap` only inspects `.wr-board-row` cell pairs.
  Evidence: `07-round2-histogram-up--1366x768.png`, `40-rounds-histogram-collision--1366x768.png`,
  `40-rounds-histogram-collision--1920x1080.png`.

- **B2 — the rule-round progress counter never resets, so the board and the teacher both assert the
  room is finished before anybody has moved.** Observed at the instant round 2 opened, before a
  single desk had revised: projector reads **"12 of 12 desks have a number in"** (session A) /
  "6 of 6" (session B); `/teach` reads **"Round 2 of 3. 6/6 desks have a number in."**; the pacing
  control reads **"Close round 2 of 3 (6/6 in)"**; and the teacher's WATCH FOR list of desks with no
  number in is **empty for rounds 2 and 3**. Cause: `closeRound` appends to `proposals` and never
  clears `club.proposal` (`runtime/src/modules/writeTheRule.ts:2548-2568`), while every `submitted`
  count tests `proposal !== null`. Room consequence: for **two of the three negotiation rounds — the
  larger part of the 8-minute rounds block — the teacher has no instrument for whether the room has
  actually re-bargained**, and the projector's only live number is a lie. This is the exact opposite
  of the week counter, which resets correctly ("0 of 12 desks locked in" at every week open).

- **B3 — the teacher's mirror is untruthful on the league-office fallback arm.** With the fallback
  rule in force at **SHARE 30% · CONDITION ON**, the projector is correct (`"The league office's rule
  is in force — SHARE 30% · CONDITION ON. This room did not write it."` and nothing else), but
  `/teach` still prints the status-quo script underneath it: *"You could not agree… The old rule
  holds — **5%** — and we are about to find out what not agreeing costs."* Cause:
  `rule.how === "voted" ? … : STATUS_QUO_COPY` (`runtime/src/modules/writeTheRule.ts:2300-2305`)
  routes `leagueOffice` into the status-quo branch. This is the one control a teacher reaches for
  when the room stalls or the period runs short, and the moment they use it the console tells them to
  say something the board contradicts.

What holds (observed, both shapes, no exceptions):

- **Fit: 90 board audits, 0 overflows.** `#stage` scrollHeight never exceeded clientHeight at either
  shape at any phase, in any arm, including the 12-row pot / arrow / era / counterfactual tables and
  every finale card.
- **0 ellipsization, 0 self-clipping, 0 elements outside the viewport** across all 90 audits. The L2
  gate's blocking club-name truncation has no analogue here.
- **Evidence tier clears the back-row floor everywhere it is named**: reveal headlines 3.11%,
  adoption line 3.11%, finale titles 3.73-3.74%, all 12-row table cells and the OUR CLASS rail 2.67%,
  histogram ticks 2.67%, median line 2.85%, rookie card 2.67%, Kings reveal + split 2.67%. Identical
  percentages at both shapes because type is `vw`-based and both shapes are 16:9.
- **Row-level overlap: 0** in every table at both shapes (the builder's guard is sound *for the
  containers it inspects*; B1 is outside them).
- **Simultaneity holds at room scale.** 12 measured teacher-press -> projector beats: 43 ms (rounds
  control) to 1016 ms (reveal stage 1); reveals cluster at 0.6-1.0 s. The room turns its head
  together.
- **One chart at a time through the reveal.** Stage 3 pot / stage 4 arrows / stage 5 era each own the
  frame; nothing from the previous press is left underneath.
- **The board never previews an open week.** "Nothing about this week's crowds is on this screen until
  your teacher closes the week", and no dollar figure appeared with 11/12 locked.

Where the choreography sags (non-blocking):

- **The Kings 22-8 is a one-press reveal, not a commit-then-reveal.** Observed immediately before the
  press with 12/12 voted: `classSplitOnBoard=false` — the room's own tally is correctly withheld, and
  the vote is correctly refused afterwards, so the *commit* half is honest. But the room's split and
  the owners' 22-8 land in the **same** press, in the same frame. The class never gets the beat where
  its own verdict stands alone on the projector and it has to sit with it before the owners answer.
  Same structure at HOOK. This is the module capstone; it deserves two presses.
- **REVEAL opens on "HOLDING · Waiting for your teacher to put up the first beat. · Stage 0 of 5"** —
  the same waiting-frame defect the L2 projector gate already recorded. `15-reveal-holding--*.png`.
- **The last live frame of PLAY tells the room the season has not happened.** After the third bell and
  before the teacher advances, the projector holds `WEEK 3 OF 3 … 0 of 12 desks locked in. Nothing
  about this week's crowds is on this screen until your teacher closes the week`, with the week-2
  rookie card still up. `14-season-done--1366x768.png`. (`/teach` is correct here: "All three weeks
  are in the books. Advance to REVEAL.")
- **The histogram carries no round label and no axis caption.** During round 2 the frame reads
  "ROUND 2 OF 3" above **round 1's** distribution, with bare tick numbers (`0 5 10 … 60`), no `%`,
  no "SHARE" axis title. `h.round` is destructured and never rendered (`board/main.ts:1566-1578`).
- **The board's only live progress line renders at 1.96% of screen height on every frame of the
  lesson** — below the 2.6% back-row floor. It carries "N of 12 desks have a number in / locked in"
  and "Stage n of 5": the room's only "are we waiting for you?" signal is the smallest type on the
  projector, on a round-1 frame that is otherwise 29% full (220px of content in 768px).
- **The ROUNDS frame, ruled: productive quiet in round 1, dead board time in rounds 2-3.** Round 1's
  thinness is earned — the frame carries the veil, the reason for the blindness, and the two-thirds
  threshold, and the room is arguing at desks, not reading. Rounds 2 and 3 are *not* quiet by design:
  they are supposed to carry a live histogram and a live counter, and both are defective (B1, B2). Fix
  those and the "~8 minutes of thin board" objection dissolves; leave them and it is 5 minutes of a
  broken frame, not 8 minutes of restraint.
- **Finale rail eyebrow labels** (REMEMBER WHEN / OUR CLASS / …) render at 2.04-2.05%, under the
  floor. Body copy is fine.
- **The rookie announcement becomes wallpaper** — "THE ROOKIE LANDED AT …" stays on the board through
  week 3.
- **Reveal splits drop non-voters.** "3 desks said pay it. 6 said break it up." in a 12-desk room; the
  three who never committed vanish rather than being named as undecided. Same shape at ARGUE.
- **Type is `vw`-based**, so the 2.6% floor is met only because both tested shapes are 16:9. A
  1280x800 or 1024x768 projector would shrink every measurement by 11-22%. **NOT VERIFIED** — outside
  the assigned matrix.

---

## board-privacy-verdict

**PASS on data. BLOCKED on a promise the board makes and breaks on the same frame.**

Observed (blocking, student-privacy):

- **B4 — REVEAL stage 2 prints "The biggest single swing was $774,496 at Desk 9 · Denver." with
  "No desk's money is ever ranked on this screen." directly beneath it, in the same frame.**
  `17-reveal-stage-2--1366x768.png`. Finale card 4 repeats the pattern: "Desk 7 · Indiana put
  $1,211,808 into other clubs' buildings…" (`31-finale-card-4--*.png`). The underlying data is
  pseudonymous and franchise-fictional, and the design already sanctions per-desk money tables at
  stage 3 — so the marginal exposure is small. The defect is that **the projector asserts a privacy
  rule it is simultaneously violating**, and "Desk 9" is a seat every child in that room can point at.
  Either the superlative goes or the line does; a classroom release should not ship a false privacy
  claim printed at 1.96% under a true violation of it at 3.11%.

Observed (clean):

- **No student-identifying data reached the projector at any phase, in any arm.** All 12 desks joined
  under realistic student names; a scan of the full board `innerHTML` (not merely rendered text) on
  90 frame audits found **0** occurrences of any join name, **0** seat ids, and **0** rejoin PINs —
  including LOBBY, both commit-then-reveal holds, mid-vote after a board refresh, mid-reveal after a
  board refresh, both fallback arms and COMPLETE. The board's own chips read "Desk 1", never a name.
- **Anonymous where the design says anonymous.** The rule-round histogram is bins + a median only: no
  desk named, no money, no ordering — verified on the frame (`/Desk \d/` absent from the histogram
  frame's rendered text). The HOOK and Kings splits are counts only ("3 desks said pay it. 6 said
  break it up." / "This room voted 9 to deny and 3 to approve.") — no desk is attributable to a vote,
  before or after either reveal.
- **Attributed where the design says attributed**, and consistently so: the pot, arrow, era and
  counterfactual tables carry `Desk N · Club` in desk-number order, never sorted by money, matching
  the stated rule. The rendered rows confirm it (Desk 1 … Desk 12, ascending, at both shapes).
- **`boardView` is structurally never handed a seat identity** — confirmed by reading
  `runtime/src/modules/writeTheRule.ts:3010-3145`: it receives `state` and `phase` only, and every
  identity it emits is `deskHandleFor` (`Desk N · SHORT`, line 1136). Inferred from source, and
  matched by 90 rendered scans.
- **Refresh does not leak.** A projector reloaded at ARGUE with 7/12 votes in came back on the term
  sheets with "Nobody has seen the vote." and no 22-8; a projector reloaded at REVEAL stage 4 came
  back on stage 4 exactly.

---

## teacher-fallback-verdict

**PASS on mechanism. One blocking defect in what the console *says* on a fallback arm (B3, above).**

- **There is no timer anywhere in this lesson.** Verified by source (`setInterval`/`setTimeout` absent
  from `runtime/src/server/*.ts` and `runtime/src/modules/writeTheRule.ts`) and by play: every beat
  moved only when a teacher control was pressed. The "timed rounds" are not timed — the rounds close
  on `teacher:ruleStep` and the console names its own budget ("8 min for all three rounds") as advice,
  not as a clock. **No pure-timer reveal exists.**
- **Every synchronized reveal is teacher-triggered and named:** `Show what Boston did` /
  `Read the 22-8 vote` (commit reveals), `Close round N of 3 (n/m in)` -> `Run the two-thirds test` ->
  `Open the season under this rule`, `Close week N (n/m locked)`, `Reveal 1 of 5 — The rule, printed`
  … through 5 of 5, `Replay the season under the runner-up rule`, `Next card` / `Back a card`. Each
  destructive press carries a confirm that states the cost (e.g. "N desk(s) have not voted yet and
  will not be able to after this").
- **Manual fallback for every one of them, exercised, not argued.** Advancing straight out of PLAY
  with **the entire season unplayed** closed every open round, ran the two-thirds test, settled all
  three weeks, and left a coherent REVEAL; all five reveal stages then rendered real evidence and the
  finale still computed **7 cards** with populated OUR CLASS rails. Nothing in the lesson depends on a
  press that never comes.
- **The bell auto-commits without punishing.** The desk that never locked in week 1 settled and reads
  `Week 1 — how it went · AUTO` on its own screen; the console warns before the press:
  "an unlocked desk settles at its club's house price with nothing reinvested and is marked AUTO on
  its own screen. Nobody is skipped and nobody gets a zero."
- **The two disagreement arms both work and both are board-truthful.** Status quo:
  `NOT ADOPTED — the old rule holds at SHARE 5% · CONDITION OFF. Only 0 of 6 desks landed inside ten
  points…` plus the "this is a legitimate outcome, not a failure" copy. League office:
  `The league office's rule is in force — SHARE 30% · CONDITION ON. This room did not write it.`
  The board is right in both. **`/teach` is wrong in the second (B3).**
- **Freeze / unfreeze is one gesture and its exact inverse.** Board reads `FROZEN`; every desk reads
  "Your teacher has frozen the session. Hang tight."; the control relabels to `Unfreeze`; after
  unfreezing, both `Freeze` and `Pause` are back and the projector carries no residual "PAUSED". The
  L1 blocking defect stays fixed at 12 desks.
- **Board refresh mid-vote and mid-reveal:** both return to the exact frame with no leak (above).
- **Pairs-on-one-device: operable.** One device per pair, header reads `SEATED AS MAYA & ELI` +
  `DESK 1 · NEW YORK`, and a rejoin PIN is pushed at join with "WRITE IT DOWN IN CASE YOU SWITCH
  DEVICES". A pair whose Chromebook died mid-HOOK rejoined on a fresh device with code + name + PIN
  and landed back on **the same seat, the same club, the same phase**; a duplicate join without the
  PIN is refused with a plain-language message. Friction, non-blocking: the rejoin panel does not
  carry over the code and name already typed on the join panel (measured: `{"code":"","name":""}`), so
  a 10-year-old retypes three fields under time pressure.
- Non-blocking: after the hard fallback the projector claims behaviour the room never produced —
  "This room put back 0% of its money, on average, across three weeks under its own rule" and
  "$7,642,033 went through the pot over three weeks" for a season nobody played. The fallback should
  say the weeks were settled for them.
- Zero console errors on `/teach`, both `/board` pages and all 12 desks through the full arc (the only
  console entry anywhere in four sessions was an expected 409 on a deliberate duplicate-join probe).

---

## classroom-drama-notes

**Best moment — the signature beat lands.** REVEAL stage 4, "THE ARROW THAT MOVED, AND THE ONE THAT
DID NOT": twelve rows, each carrying a price arrow and a put-back arrow, gold `rgb(244,185,66)` for
moved and grey `rgb(115,123,140)` for flat, **11 moved and 13 flat cells in one frame**. The
comparison works twice over — across the column (Desk 2 Memphis `PRICE $60 → $56` beside Desk 1
New York `PRICE $68 — $68`) and *within a row* (New York's price flat, its put-back `25% → 15%`).
The headline names the desk and the count: "the best thing to put back into Desk 10 · Philadelphia
fell from 40% to 20% — 4 clicks of the dial. 5 of 12 desks saw that move." The room has a reason to
look up: every pair can find its own row, and the argument ("why didn't New York move?") is legible
from the back at 2.67% type. `19-reveal-stage-4--1366x768.png`. The only cost is density — it is a
12-row table asked to carry a dramatic beat; it earns it, but it is the frame most likely to fail at
a class of 20.

**Second best — "THE RULE".** The adoption frame uses only 21% of the projector (158px of 768) and
that emptiness reads as ceremony, not as dead space: title, the gold RULE IN FORCE strip, and one
sentence — `ADOPTED — SHARE 30% · CONDITION OFF. 12 of 12 desks landed inside ten points of the
room's middle number.` The room's own law, printed. `09-adoption--1366x768.png`. Also strong: the
Kings reveal frame, which refuses to score the room ("Nobody is scored against the owners — Seattle
offered more money and lost the vote, and thirteen years later Seattle may get a club anyway") and
carries the story past 2013 into the 2026 expansion process. `27-argue-revealed--1920x1080.png`.

**Worst moment — the round-2 histogram.** The reveal the whole anti-herding design exists to earn,
and the gold bars are printed through the sentence the teacher was told to read twice, at both
projector shapes, while the counter under it insists 12 of 12 desks have already put a number in a
round nobody has touched. Two defects on one frame, for the larger part of the rounds block.
`07-round2-histogram-up--1366x768.png`, `40-rounds-histogram-collision--1920x1080.png`.

**Second worst — the capstone fires both barrels at once.** One press puts "This room voted 9 to
deny and 3 to approve" and "the owners voted 22-8 to deny" on the projector in the same instant. The
room's own verdict never gets a frame of its own, so the beat the design is reaching for — *we said
this; now watch what thirty actual owners said* — is compressed into a single paragraph the class
reads top-to-bottom in silence.

**Also worth the teacher's attention:** the last frame of PLAY tells a room that just played three
weeks that zero desks have locked week 3 (`14-season-done--*.png`), and REVEAL opens on the word
"HOLDING" over "Stage 0 of 5" (`15-reveal-holding--*.png`) — both are hold frames the room stares at
while the teacher talks, and both currently say nothing true about what just happened.

Screenshots: `docs/gauntlet/module-2/screens-l3-projector/` (82 files).

---

## required-repairs

### Blocking (classroom-reliability, student-privacy)

1. **B1 — stop the histogram bars overprinting the veil copy.** The column budget must include the
   tick label and the gap: bar max 22vh + tick ~2.7vh + gap .3vh > the 24vh container
   (`board/index.html:311-314`, `board/main.ts:1573`). Reproduced twice, both shapes, 4 columns,
   10px @1366x768 / 14px @1920x1080. **And add a guard that can see it** — the shipped
   `assertNoOverlap` only inspects `.wr-board-row` cell pairs; a text-line-vs-any-element ink test is
   what caught it here.
2. **B2 — reset the proposal on `closeRound`** (or count per-round submissions), so the board and the
   console report round 2 and round 3 progress honestly and the teacher's WATCH FOR list of desks
   with no number in works in all three rounds
   (`modules/writeTheRule.ts:2548-2568`, `:2222`, boardView rounds branch).
3. **B3 — give the league-office arm its own teacher script.**
   `rule.how === "voted" ? … : STATUS_QUO_COPY` (`modules/writeTheRule.ts:2300-2305`) currently tells
   the teacher the old rule holds at 5% while a 30%/ON rule is in force and printed on the board.
4. **B4 — resolve the board's privacy self-contradiction.** REVEAL stage 2 and finale card 4 name a
   single desk's superlative money on a frame that simultaneously promises "No desk's money is ever
   ranked on this screen." Drop the superlative or drop the promise; do not ship both.

### Non-blocking (ordered by classroom cost)

5. Split the Kings capstone into two presses — the room's own tally, then the owners' 22-8. Same for
   HOOK.
6. Fix the post-season hold frame: after the third bell the board should say the season is in the
   books, not "0 of 12 desks locked in" under a stale rookie card.
7. Raise the live progress line above the 2.6% back-row floor (currently 1.96% on every frame); it is
   the room's only waiting-on-you signal.
8. Label the histogram: which round it is (`h.round` is computed and never rendered), a `%` on the
   ticks, and a SHARE axis caption.
9. Replace the REVEAL "HOLDING / Stage 0 of 5" frame with something the room can read while the
   teacher sets up.
10. Name the undecided in the split lines, so 3 + 6 in a 12-desk room is not an unexplained gap.
11. Raise the finale rail eyebrow labels above the floor (currently 2.04-2.05%).
12. Carry the class code and name from the join panel into the rejoin panel.
13. Make the hard-fallback copy honest about weeks the room did not play.
14. **NOT VERIFIED:** non-16:9 projectors (1280x800, 1024x768). All type is `vw`-based, so every
    percentage in this report is a property of the 16:9 shapes tested and of nothing else.

### Dissent

None recorded. If the run elects to ship on B4 by keeping both the superlative and the privacy line,
record this as formal dissent from the Classroom / Projector role: the projector must not print a
rule it breaks in the frame above it.

---

## RE-CHECK AFTER W4 FINAL REPAIR

Owning-critic confirm-or-refute of dissent `proj-l3-board-integrity` (B1-B4 + the Kings choreography
note). Boss run `m2-quality-war`, assignment `recheck-l3-projector`. Fresh instrument, independently
written (fit / ink-collision / privacy guards reimplemented, not the builder's), mechanics borrowed
from `runtime/scripts/e2e-m2l3.cjs`. Real Chromium against `runtime/dist/server/index.js` on
**PORT 4415**, isolated snapshot, **server killed at the end**. No repository implementation state
changed.

**Method.** Session A: 12 desks at 1024x600 joined under realistic student names ("Maya & Eli",
"Noah & Aviva" …), 1 `/teach` at 1440x900, and **two live `/board` pages — 1366x768 and 1920x1080 —
attached for the whole session, never resized**. Full arc LOBBY -> HOOK -> PLAY rounds 1-3 -> two-thirds
test -> adoption -> three season weeks (one desk never locks in wk1) -> REVEAL 5 staged presses ->
CONSEQUENCE -> COUNTERFACTUAL -> ARGUE (two presses) -> SYNTHESIS 7 cards -> COMPLETE. Session B:
6 desks, maximum disagreement -> two-thirds test fails -> status-quo arm -> `Operate the league
office's rule` -> that arm run through the season to **REVEAL stage 5**.
**42 frame labels x 2 shapes = 84 audits.** Each audit: `#stage` scrollHeight vs clientHeight;
line-level ink collision (every text line measured as ink with a Range against every painted
non-ancestor element); and a privacy scan of the full board **`innerHTML`** for join names, seat ids
and rejoin PINs. Screenshots: `docs/gauntlet/module-2/screens-l3-projector/r1-*.png` (76 files,
`--1366x768` / `--1920x1080` suffixes).

### B1 — histogram overprinting the veil · **REPAIRED (observed, both shapes, rounds 2 and 3)**

The repro is dead at both shapes and in both rounds. Measured at round-2 open and round-3 open:

| shape | veil box | hist container | tallest bar | tick |
|---|---|---|---|---|
| 1366x768 | 197..254 | 262..446 | 262..421 | 424..446 |
| 1920x1080 | 275..356 | 367..626 | 367..591 | 594..626 |

`barsAboveContainer = 0`, `barsOverVeil = 0`, `ticksBelowContainer = 0` — identical at both shapes,
both rounds. The bar column now tops out **exactly at** its container top instead of 20px above it,
and the tick label lives inside the well. 8px of clear air at 1366x768, 11px at 1920x1080.
`r1-05-round2-histogram--*.png`, `r1-05-round3-histogram--*.png`.
**Guard non-vacuity proven in-run, by my instrument, not the builder's:** poisoning the live round-2
frame (bar grown up through the veil) made my ink scan report **2 collisions at 1366x768 ("… binds
two seasons. And next season o…" under `div.wr-board-histbar`, 73x25px) and 2 at 1920x1080
(103x35px)**; restoring the frame returned it clean. The instrument can see the defect it cleared.
Also repaired in passing (was non-blocking item 8): the frame now carries a round label and an axis
caption — `ROUND 1 · SHARE OF LOCAL MONEY · MIDDLE NUMBER 30% …` at 2.85% of screen height, with `%`
on every tick and the ±10 band drawn in gold on the columns.

### B2 — stale round counter · **REPAIRED (observed, rounds 2 and 3)**

At the instant round 2 opened, before any desk had revised: projector reads **"0 of 12 desks have a
number in THIS round"**; `/teach` NOW block reads **"Round 2 of 3. 0/12 desks have a number in THIS
round"**; the pacing control reads **"Close round 2 of 3 (0/12 in)"**. Identical at round-3 open
("Close round 3 of 3 (0/12 in)"). The teacher's **WATCH FOR list is populated in both rounds** —
"12 of 12 desks have not put a number in this round", Desk 1 · New York through Desk 12 · Chicago —
which was empty for two of three rounds before. The two-thirds gauge stays consistent with the
histogram actually on the board (0 of 12 at round-2 open from round 1's spread; 6 of 12 at round-3
open from round 2's), and `/teach` names its basis: "On that histogram right now".

### B3 — untruthful teacher mirror on the league-office arm · **REPAIRED (observed, arm run to REVEAL stage 5)**

With the fallback rule in force at SHARE 30% · CONDITION ON, `/teach` now prints arm-specific copy
that matches the board word for word: *"The league office's rule is in force at SHARE 30% · CONDITION
ON. This room did NOT write it, the old 5% rule does NOT hold, and nobody here voted for what is about
to happen."* The status-quo script is gone. Regex scan of the `/teach` panel at every one of the five
reveal stages on that arm: **0 occurrences** of the status-quo script and **0 occurrences of "5%"**.
`r1-21-arm-leagueoffice--*.png`, `r1-23-arm-lo-reveal[1-5]--*.png`. The status-quo arm remains
board-truthful and teacher-truthful in its own right (`r1-20-arm-statusquo--*.png`).

### B4 — the board's privacy self-contradiction · **REPAIRED (observed)**

REVEAL stage 2 now reads *"The biggest single swing at any one desk was $1,048,525 — find your own
row in the table and see whose it was."* **No desk is named.** Finale card 4 likewise: *"The club in
this room whose name pulled hardest on the road put $1,340,780 into OTHER clubs' buildings"* — the
"Desk 7 · Indiana" attribution is gone. Regex scan across all five reveal stages and all seven finale
cards: **0 matches** for a desk-named superlative. `r1-10-reveal-stage2--*.png`,
`r1-16-finale-card4--*.png`.

### The Kings capstone · **REPAIRED — the tally is genuinely committed and shown BEFORE the reveal**

Observed at 12/12 voted, before any press: the board reads *"Nobody has seen the vote."* — no tally,
no 22-8. The commit is real. **Press 1** ("Show THIS ROOM's tally (the owners come next)") prints
*"This room voted 9 to deny and 3 to approve. Nobody has seen what the owners did."* at **3.11% of
screen height** — above the 2.6% back-row floor — and `/22-8/` is **absent from the entire board
`innerText`**. The desks' vote controls are **both disabled** at that moment (`{"a":true,"d":true}`),
so the room cannot chase its own tally. **Press 2** ("Read the owners' 22-8 vote") clears the term
sheets and gives 22-8 the frame, with 16-of-30, the March 2026 30-0 expansion vote, and "Nobody is
scored against the owners". `r1-13-argue-held--*.png`, `r1-14-argue-press1-roomtally--*.png`,
`r1-15-argue-press2-reveal--*.png`. The control's own labels teach the choreography to a teacher who
has never seen it — that is the repair doing more than it was asked.

### Fit / privacy / stability, unregressed (observed, 84 audits)

- **0 `#stage` overflows** at either shape on any of the 42 frames visited, in either arm.
- **0 ink collisions** anywhere — the new guard's own standard, applied to every frame, not just the
  histogram.
- **0 privacy leaks.** Full-`innerHTML` scan of every audited frame for all 12 join names, seat ids
  and rejoin PINs: **0 hits**, including LOBBY, both commit-then-reveal holds, both fallback arms and
  COMPLETE. Student names appear only in `/teach`'s LIVE JOIN LIST, where they belong.
- **0 console errors** on `/teach`, both `/board` pages and all 18 desks across both sessions.

### Residuals (non-blocking; none blocks release)

1. **The privacy promise is still slightly wider than the truth.** Stage 2 and finale card 1 publish
   the maximum swing *value* ($1,048,525) under "No desk's money is ever ranked on this screen", and
   instruct the room to attribute it. One press later, stage 3 prints that exact figure as Desk 8 ·
   L.A. Lakers' NET. Marginal exposure is **zero** — the stage-3 table already publishes all twelve
   desks' money by design — so this is a copy overstatement, not a leak. Narrow the line to what it
   actually guarantees (no desk is put at the top or bottom of a list).
2. **`writeTheRule.ts:1846` says "under its own rule" unconditionally.** On the league-office arm the
   board prints that phrase at REVEAL stage 5 while its own headline reads "This room did not write
   it." Same family as B3, now on the board, on a fallback arm.
3. Carried forward, unrepaired, and re-observed this session: the post-season hold frame still reads
   "0 of 12 desks locked in" under a stale rookie card (`r1-08-season-done--*.png`, prior item 6); the
   live progress line still renders at **1.96%**, under the back-row floor (prior item 7); REVEAL
   still opens on "HOLDING · Stage 0 of 5" (`r1-09-reveal-holding--*.png`, prior item 9). Prior items
   10-13 not re-exercised this session.
4. **Drama.** Press 1 of the capstone appends the room's verdict to the bottom of a frame still
   carrying 300 words of setup and both term sheets. The beat exists now; it does not yet own the
   projector the way press 2 does. Clearing to the question plus the tally would cost nothing.
5. **NOT VERIFIED:** non-16:9 projectors (1280x800, 1024x768); class sizes other than 12 and 6;
   pairs-on-one-device and freeze/rejoin were exercised in the original gate, not re-exercised here.
   Nothing here is classroom-proven (D10).

**DISSENT proj-l3-board-integrity: DISCHARGED**
