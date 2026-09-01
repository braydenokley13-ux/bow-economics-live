# GATE — Teacher Transfer, Module 2 Lesson 3 "Writing the Rule" (`m2l3-write-rule`)

Fresh-context gate. Boss run `m2-quality-war`, assignment `gate-l3-teacher`.

**Cold protocol as executed.** The only repo file read before judgment was
`runtime/scripts/e2e-m2l3.cjs` (mechanics only, assertions ignored). Everything
in the before / during / recovery sections below was learned from `/teach`,
`/board` and `/play` against a live server on PORT 4404. Sessions run:

- `BOWN7L` — zero-student rehearsal, the landing page's own prescription,
  all nine phases.
- `BOWXPL` — 9 desks, three rule rounds, one desk that never proposes, one
  ideological holdout, two-thirds test PASSED at SHARE 25%.
- `BOWVNR` — 8 desks, unlinked stock league, full arc to COMPLETE: hook
  commit-reveal, three rounds, adoption at 45%, three season weeks incl. the
  rookie, week-bell misclick dismissed, a desk that never locks, a late
  joiner at week 2, a desk refresh mid-week, five reveal beats, consequence,
  counterfactual replay, Kings capstone, all seven finale cards + back-page.
- `BOWALG` — 6 desks, deliberately split room, two-thirds test FAILED, then
  `Operate the league office's rule`.
- `BOW7JL` — 4 desks, Advance-during-the-vote misclick + Restore.
- `BOWXX9` — Pause / Freeze probes; late joiner during HOOK.
- `BOWWQ9` (an M2 L2 session driven to COMPLETE) → `BOWERR` — 6 desks, the
  **L2-linked** L3 run, through CONSEQUENCE and the finale.
- `BOWGTD` / `BOWG64` — confirm-guard probes on Advance and Jump to REVEAL,
  during the vote and during the season.

Zero console errors on any surface in any session except one: the late
joiner's device (`BOWVNR`, desk 9) logged `409 (Conflict)`. A mid-session
server restart was survived from the snapshot with state intact (observed).

Only after all of the above were `runtime/README.md` §"Module 2, Lesson 3"
and its known-gaps list, and `docs/gauntlet/module-2/GATE_L2_TEACHER.md`,
read.

Evidence ids: `gate-l3-teacher` (this report and the sessions above,
**observed**). `l3-e2e`, `l3-tests`, `l3-tuning`, `l3-claims` — existing,
**not re-run by me this gate, NOT VERIFIED**. `readme-l3` and
`gate-l2-teacher` — read at step 2 only, used for cross-lesson comparison.

---

## before-verdict

**NOT READY.**

What the product alone gave me, observed under `gate-l3-teacher`:

- The `/teach` landing page tells a first-time teacher to create an empty
  session and rehearse. In `BOWN7L` that rehearsal is real: WATCH FOR renders
  sample desk groups explicitly stamped `REHEARSAL — this panel is a sample,
  because nobody has joined`, the five reveal beats each carry their line, and
  SYNTHESIS pages a full seven-card deck. This is a clear advance on the L2
  gate's B5.
- The rule dials are learnable without any documentation. `/play` states both
  in one sentence on the proposal screen ("SHARE is how much of every club's
  local money … goes into one pot that gets split equally. CONDITION is
  whether a club has to put at least 15% back into its own product to collect
  its full share"), and the vote rule is printed on the board, on the desk and
  in the console: two-thirds within 10 points of the middle number, with the
  reason ("the pot is the big markets' money: they have to be bought, not
  outvoted").
- Pacing is mine, entirely. The rounds are **not** on a clock — no countdown
  exists on any surface. `◗Close round 1 of 3 (0/9 in)` and
  `◗Close week 1 (0/9 locked)` carry live counts and name what the *next*
  press does, which is the right idiom and is learnable cold. (`readme-l3`
  calls these "three timed offer rounds"; the product has no timer. The
  product is right and the README wording is wrong.)

What it did not give me, and why this is NOT READY:

- **The prescribed rehearsal does not rehearse the lesson, and teaches the
  fatal gesture.** The landing page says: "press Advance ▸ through every
  phase … so you can rehearse the whole period." Followed literally in
  `BOWN7L`, `Advance ▸` at PLAY jumped straight to REVEAL. I never saw the
  histogram, the two-thirds test, the adoption print, a single season week,
  the week bell, or the rookie card — roughly half the period and every
  pacing-hard control in it (`btnRuleStep`, `btnCloseWeek`, `btnRealRule`).
  The console then reported `seasonDone`, `3/3`, `◗All three weeks are in the
  books`. The one instruction the product gives a first-time teacher is also
  the exact misclick that destroys a live class (see
  failure-recovery-verdict). To rehearse the interior at all you must ignore
  the printed instruction and discover `btnRuleStep` yourself.
- **No elapsed clock, against minute-keyed instructions.** Every frame carries
  `TIME CUT — Past minute 46? The Kings vote is the designated cut`. Nothing
  on `/teach` counts anything. Unchanged from `gate-l2-teacher` N3.
- **`Operate the league office's rule` is unexplained until pressed.** It is
  visible and enabled from the first second of PLAY, beside the round step.
  No NOW / TRIGGER / WATCH FOR line in any state I visited names it, including
  the failed-vote state it exists for. Its confirm ("Use it if the room cannot
  agree or the period has run short") is the only explanation, and you have to
  gamble on an irreversible button to read it.

## during-verdict

**Strong on the vote, defective at the discussion beat.**

Observed, and genuinely live rather than sample copy:

- WATCH FOR computes this lesson's beats by name. `BOWXPL`: "1 of 9 desks have
  not put a number in this round — Desk 9 · Denver"; "A BIG-MARKET desk is
  arguing FOR sharing — Desk 3 · Golden State … it lands ten times harder from
  a student than from you"; at round 3, "Has not moved its number since round 1
  — Desk 7 · Indiana. Ask what would have to be true for them to move. Holding
  out is a legitimate position with a real cost." Median-herding is handled
  structurally, not by advice: round 1 is blind on board and desk, and the
  console says why.
- DON'T EXPLAIN YET is specific and correctly ordered: "That a big market might
  WANT to pay. If you say it, you have taken the discovery." The flat-arrow
  moment is explicitly withheld to stage 5 / CONSEQUENCE.

Three during-class defects:

1. **The director asserts a student affordance that is not there.** With a desk
   holding out, the panel reads: "A desk with no number in counts as the old 5%
   rule for the median, **and its own screen says so** — nobody is skipped."
   In `BOWXPL` I read Desk 9 · Denver's own screen at that moment: it carries
   the ordinary proposal screen and nothing about the 5% default. A teacher who
   trusts that line will tell a pair their screen explains something it does
   not. **[observed]**
2. **Contradictory NOW lines after the league-office rule.** `BOWALG`, line 1:
   "The league office's rule is in force — SHARE 30% · CONDITION ON. This room
   did not write it." Line 2, immediately below: "You could not agree … The old
   rule holds — 5% — and we are about to find out what not agreeing costs."
   Two different rules in force in two consecutive lines a teacher reads aloud.
3. **Student copy is false on both non-adopted branches.** At a FAILED vote
   (`BOWALG`) and after the league-office rule, every desk still reads: "Three
   weeks under your own rule … The only thing that changed is the rule you
   wrote." They wrote nothing. The league-office path's whole point is that
   they did not.

**Reveals — armed, with one loose seam.** Stage 4 is computed and named:
"Ask it in these words: 'why didn't Desk 3 · Golden State move?' The answer is
on their own screen — their building was already full, and you cannot discount
a seat you do not have." That is exactly what I needed and it is not founder
knowledge. The seam: the frame prints **two** arrows per desk, and the desk the
ASK names has a flat PRICE but a moved PUT BACK (`PRICE $66 — $66`,
`PUT BACK 30% → 20%`, `BOWVNR`). A fifth-grader saying "but it did move" is
correct, and the answer key only covers price.

**The Kings capstone arms the debate and refuses to settle it.** "There is no
right answer and the real vote was 22-8, not unanimous. Eight owners voted the
other way and they were not stupid," plus a board line — "Nobody is scored
against the owners — Seattle offered more money and lost the vote, and thirteen
years later Seattle may get a club anyway." Correct posture. **[observed]**

**The argue phase has fuel and a question. The CONSEQUENCE phase does not.**
This is the highest-severity finding in this gate and it is stated first in
required-repairs.

## failure-recovery-verdict

**NOT READY.**

Recovers well, observed:

- Consequence-stating confirms on the hook reveal ("8 desk(s) have not locked a
  position and will not be able to after this"), the two-thirds test ("It
  cannot be re-run"), the week bell ("every desk that has not locked settles at
  its club's house price … marked AUTO"), and the league-office rule. I
  dismissed the week bell mid-class in `BOWVNR` and the console returned to
  `Week 1 of 3. 1/8 desks locked in` with nothing lost.
- **Restore last good state works.** In `BOW7JL`, after the destructive
  Advance, one press returned the session to PLAY round 1 with all four
  proposals intact and the board back on `ROUND 1 OF 3`.
- **Desk refresh** mid-week restored club, rule in force, settled week, transfer
  column, schedule strip and dials (`BOWVNR`).
- **Server restart** mid-session resumed from the snapshot with state intact.
- **A desk that never locks** settles AUTO, says `AUTO` on its own screen, and
  the console says so in advance and afterwards. Nobody gets a zero.
- **A failed two-thirds vote is dignified and still playable.** "You could not
  agree. Real leagues have that problem too, and this is a legitimate outcome,
  not a failure. The old rule holds — 5% — and we are about to find out what
  not agreeing costs." The season then runs at 5%. This is good product.
- **Pause and Freeze** each explain, once pressed, exactly what the room sees:
  "Every student device reads 'Paused — everything you've done is saved…'" /
  "Every student device has lost its controls…", each with "Do not say 'look at
  the board' until you press Resume."

Two failures that block:

- **`Advance ▸` and `Jump to REVEAL` are unguarded throughout PLAY.** Probed in
  `BOWGTD` / `BOWG64` / `BOW7JL`: during the vote **and** during the season,
  one click, no dialog, straight to REVEAL. The vote and all three weeks are
  gone; the console then displays `seasonDone`, `◗All three weeks are in the
  books`, and offers the five reveal beats for a season nobody played, with no
  warning anywhere that the class has been derailed and no hint that Restore is
  the way back. `gate-l2-teacher` records that L2 guards this identical gesture
  with a consequence-stating confirm — and my own L2 run this session raised it
  ("Week 1 of 3 is still open (0/6 desks locked in). This is not the week bell
  — advancing now settles this week…"). L3 regressed against its sibling, in
  the phase where the consequence is far larger, on the most prominent button
  on the console, sitting directly above the correct control.
- **A late joiner after the vote opens is dead, and the console hides it.**
  `BOWVNR`, a pair joining at week 2: the student device shows "the league is
  closed for this session" and then "You're in — finding your club…" forever,
  with a `409` in its console. Meanwhile `/teach` reads `9 JOINED` and lists
  `Pair 9` in the join list, while every other count on the same screen says
  `8 of 8`. No WATCH FOR entry, no NOW line, no instruction — nothing tells the
  teacher that a pair is stranded or what to do with them. Late join during
  HOOK works correctly (`BOWXX9`, seated as Desk 8 · L.A. Lakers), so the
  cut-off is the start of PLAY; the product never says so anywhere.

## synthesis-verdict

**READY, with one blemish.**

- Seven cards, each carrying all five rails, paged one at a time, with
  `Next card` / `Back a card` that both work (`BOWVNR`). OUTSIDE SPORTS is
  present on every card and is concrete and grade-appropriate: "Tips pooled
  across a restaurant's whole staff. A group grade. Taxes. A chore jar with one
  sibling who has worked out that the jar pays either way"; "A late-homework
  penalty. A deposit on a bottle. A speeding fine"; "The subject you picked in
  eighth grade. A town that built its highway one way in 1960."
- OUR CLASS is computed, not a glossary: "$16,545,825 went through the pot over
  three weeks. 4 desks paid more in than they took out … The biggest single
  swing was $1,149,304 at Desk 5 · Milwaukee." Card 6 changes honestly between
  the stock run and the linked run (`BOWVNR` vs `BOWERR`).
- The full deck is on every student device simultaneously, so the class can
  revisit rather than chase the projector, and the console says so. The TIME CUT
  guidance is correct and unambiguous: "Never cut SYNTHESIS. Cut ARGUE instead."
- COMPLETE leaves an artifact with a use: "Write it on the board next to the
  real league's, and argue about it again in a year."
- Blemish: cards 6 and 7 print the Seattle-2006 / Milwaukee-2015 arena material
  back to back in near-identical wording. Read aloud in sequence a teacher
  repeats himself in the final ninety seconds.

I could deliver these seven cards cold. I could not deliver CONSEQUENCE cold.

## hidden-knowledge-findings

1. **The whole CONSEQUENCE script assumes effort fell, and the product does not
   check.** The ASK — printed on the projector *and* in the console, in both
   rooms — is "Whose effort went down? Did anybody DECIDE to try less — or did
   it just stop being worth it?", with the answer key "The answer you are
   fishing for is the second half: it stopped being worth it." In `BOWERR`
   (L2-linked) the console's own computed line, one row above that question,
   read: "Last lesson this room put back 0% … Under the rule you wrote, it put
   back 20%. **Effort went up by 20%.** 0 desks put back less than they did last
   lesson." The teacher is directed, in writing, to ask the class a question its
   own evidence refutes, at the module's central discussion beat. Only someone
   who already knows the intended arc can rescue that moment. **[observed]**
2. **The unlinked run has no CONSEQUENCE evidence at all, and is never warned.**
   In `BOWVNR` the before/after table printed `no L2` in every row and the
   headline still read "YOU CHANGED THE RULE. LOOK WHAT YOU CHANGED ABOUT
   YOURSELVES". The console admits the bar has one bar and then asks the same
   directional question anyway, with no substitute question and no substitute
   evidence — although the lesson computes a perfectly good rule-driven
   before/after of its own at REVEAL stage 4 that would serve. The create form
   never warns that choosing "No link — stock/expansion franchises only" costs
   this phase its instrument. `readme-l3` states the dependency plainly
   ("Without the seed that panel has no left-hand bar"); the product does not.
   **[observed product; inferred that a first-time teacher, who by definition
   has no completed L2, is the most likely person to hit it]**
3. **The escape hatch for a stalled room is undiscoverable in the moment it is
   for.** At the FAILED vote in `BOWALG` the NOW panel offers only "we are about
   to find out what not agreeing costs". Nothing recommends
   `Operate the league office's rule`, which exists precisely for "if the room
   cannot agree or the period has run short". **[observed]**
4. **What the teacher must know about the reveal that the product never says.**
   Stage 4's answer key covers the *price* arrow only, while the frame shows two
   arrows per desk and the named desk's other arrow moved. **[observed]**
5. **The late-join cut-off is founder knowledge.** That PLAY closes the league is
   discoverable only by stranding a child. **[observed]**
6. Not judged by me, named as **NOT VERIFIED**: economics correctness of the
   `(1−s)²` reinvest response and the "no dominant proposal" property; sports-
   reality accuracy of every dated figure on the finale cards; projector
   legibility and fit (a separate gate's instruments, not re-run here); and
   whether 50–60 minutes is achievable — `readme-l3` known gap (c) states the
   lesson has never been played by a human, and this gate did not time a room.

## required-repairs

### Blocking (teacher-transfer)

- **B1 — CONSEQUENCE must branch on its own computed direction.** When mean
  reinvest rose, or the room split, the ASK and its answer key must change with
  it ("Whose effort went **up**, and what was it about the CONDITION that paid
  you for it?"). Shipping one directional question over a computed two-way
  result makes the module's central discussion beat unrunnable by anyone who
  has not been told the intended answer. (`gate-l3-teacher`, `BOWERR`.)
- **B2 — The unlinked run needs a real CONSEQUENCE instrument, or an honest
  warning at create time.** Either re-point the phase at the rule-driven
  before/after the lesson already computes (REVEAL stage 4's optimal-reinvest
  move), or state on the create form and in the LOBBY panel that without an L2
  link this phase loses its bar and here is the question to ask instead.
  (`gate-l3-teacher`, `BOWVNR`; `readme-l3`.)
- **B3 — Guard `Advance ▸` and `Jump to REVEAL` inside PLAY.** Use L2's own
  idiom, naming the real consequence separately for the vote ("Round 2 of 3 is
  still open and the two-thirds test has not run — advancing now abandons the
  vote AND the whole three-week season") and for the season ("Week 2 of 3 is
  still open — advancing now ends the season early, so 2 weeks will never be
  played"). (`gate-l3-teacher`, `BOWGTD`, `BOWG64`, `BOW7JL`;
  `gate-l2-teacher`.)
- **B4 — A late joiner must be seated or the teacher must be told.** Either seat
  a post-vote joiner on a stock franchise with a covered vote, as L2 does, or —
  at minimum — stop counting them in `JOINED`, tell them on their own device
  what to do, and raise a WATCH FOR entry naming the stranded pair and
  instructing the teacher to seat them with a neighbour. As shipped, a child
  stares at "finding your club…" while the console shows nothing wrong.
  (`gate-l3-teacher`, `BOWVNR` desk 9, 409.)
- **B5 — The rehearsal the landing page prescribes must reach the PLAY
  interior.** Following "press Advance ▸ through every phase" skips the
  histogram, the two-thirds test, the adoption print, all three weeks, the week
  bell and the rookie card, and trains the exact gesture that destroys a live
  class. Either make rehearsal step the interior (an explicit rehearsal mode
  that walks `btnRuleStep` and `btnCloseWeek` over stand-in desks) or rewrite
  the instruction to name the interior controls. (`gate-l3-teacher`, `BOWN7L`.)
- **B6 — Remove the false claim about the non-proposer's screen, or make it
  true.** Either put the "no number in = the old 5% rule" line on the desk's own
  proposal screen, or delete "and its own screen says so" from the director.
  (`gate-l3-teacher`, `BOWXPL` desk 9.)

### Non-blocking

- **N1 —** After `Operate the league office's rule`, the second NOW line still
  says the old 5% rule holds. Two rules in force, two consecutive lines.
  (`BOWALG`.)
- **N2 —** On both non-adopted branches every desk still reads "Three weeks
  under your own rule … the only thing that changed is the rule you wrote."
  (`BOWALG`.)
- **N3 —** Name `Operate the league office's rule` in the director copy at the
  failed vote and when a round stalls, so the escape hatch is findable without
  pressing an unexplained irreversible button. (`BOWALG`.)
- **N4 —** REVEAL stage 4's answer key should cover both arrows, or the ASK
  should name the price arrow explicitly. (`BOWVNR`.)
- **N5 —** No elapsed clock on `/teach` against `Past minute 46`. Carried
  unrepaired from `gate-l2-teacher` N3; a session timer started at the first
  Advance would make every TIME CUT usable.
- **N6 —** The week-bell confirm reported "Nobody has locked in yet — 0 of 8"
  while the panel behind it read 1/8. (`BOWVNR`.)
- **N7 —** Finale cards 6 and 7 repeat the Seattle/Milwaukee arena material
  almost verbatim, back to back. (`BOWVNR`.)
- **N8 —** `readme-l3` calls the rounds "three timed offer rounds"; there is no
  timer on any surface and pacing is entirely teacher-controlled. Fix the prose,
  not the product.

---

**TRANSFER: NOT READY.**

The vote is the best-directed twenty minutes in this repo — WATCH FOR names real
desks doing real things, the reveals are staged and scripted, the Kings capstone
arms an argument without settling it, and the seven finale cards are deliverable
cold. But a random competent teacher who received this tonight would walk in
having rehearsed only half the lesson, could lose the vote and the entire season
to one unguarded click on the console's most prominent button, would strand any
pair who arrives after the vote opens while the console reports them present,
and would be directed — in writing, on the projector — to ask the class a
question that this class's own evidence contradicts. B1 and B3 are the two that
would visibly break an otherwise outstanding period.

**Formal dissent is recorded in advance** against any resolution that treats B1
or B2 as cosmetic on the grounds that a well-run L3 follows a completed L2. The
product ships "No link — stock/expansion franchises only" as a first-class
option and tells the teacher it is fine; a first-time teacher has no completed
L2 by construction; and the effort-went-up branch is reachable in a linked room
too, because the CONDITION is designed to raise reinvestment.

---

## RE-CHECK AFTER W4 FINAL REPAIR

Owning-critic confirm-or-refute of dissent `teacher-l3-not-ready`. Boss run
`m2-quality-war`, assignment `recheck-l3-teacher`. All six original repros were
re-run on **PORT 4413** against a freshly built server, mechanics taken only
from `runtime/scripts/e2e-m2l3.cjs`. Every verdict below is read off the
rendered surface (`/teach`, `/play`, `/board`), not off a repair note.

Sessions run this recheck (all **observed**, evidence id `gate-l3-teacher`):
`BOWTEW` and `BOW6WM` — zero-student rehearsals, the landing page's own
prescription. `BOW49P` — 6 desks unlinked, one desk that never proposes, full
arc to CONSEQUENCE, with guard probes and a post-vote late joiner.
`BOW6VU` → `BOWXLX` — an M2 L2 run driven to COMPLETE at 0% put-back, then the
**L2-linked** L3 run, so the room's effort rises. A second linked pair with a
split L2 basis. A 3-desk league with unclaimed clubs, for the takeover branch.
Zero console errors on any surface in any session, including the late joiner's
device — the `409` is gone.

### The six repros

- **B1 — the `BOWERR` contradiction case. FIXED.** In `BOWXLX` the console and
  the projector both read "Last lesson this room put back $0 a week … Under the
  rule you wrote, it put back $618,224 a week. Effort went up by $618,224 a
  week", and the ASK printed under it reads "Whose effort went **UP** — and what
  was it about the rule that paid you for it?", with a matching answer key and a
  WATCH FOR entry that says in as many words "Do not let the discussion assume
  effort fell if this list is the longer one." Question and computed line agree.
  Verified on the rendered surface in two independent linked runs. The `down`
  and `flat` branches exist in `consequenceBeat` (`writeTheRule.ts`) off the same
  direction atom — **inferred from source, not observed this recheck**.
- **B2 — the unlinked run. FIXED.** In `BOW49P` CONSEQUENCE now reads "There are
  no Lesson 2 numbers linked to this session, so the before-and-after bar has one
  bar in it. Use the rule's own before-and-after instead: the arrows at stage 4",
  and the substitute ASK — "Under this rule, what became the best thing to do
  with a dollar — and did anybody DECIDE that, or did it just stop being worth
  it?" — is on the board *and* the console, with the answer key "There is no
  Lesson 2 bar in this room, so do not fish for one." The bar is computed in
  dollars per week on a stated common basis (`LESSON 2 / WK` vs `LESSON 3 / WK`,
  "Both figures are DOLLARS, because the two lessons' dials are percentages of
  different money"), with honest `no L2` cells. LOBBY warns before the period
  starts: "No Lesson 2 session is linked. Say so plainly."
- **B3 — the mid-PLAY advance click. FIXED.** Both controls now guard, in both
  sub-phases, and the phase did not move when I dismissed. Mid-vote `Advance ▸`:
  "Round 1 of 3 is still open (5/6 desks have a number in, 1 abstaining so far).
  This is NOT the round step and it is NOT the week bell — advancing now abandons
  the rest of the vote AND the whole three-week season … Restore last good state
  is the only way back." `Jump to REVEAL` carries its own labelled variant.
  Mid-season: "Week 1 of 3 is still open (3/6 desks locked in) … ends the season
  early, so 2 weeks will never be played. 3 desks have not locked; they settle at
  their club's house price … marked AUTO."
- **B4 — the post-vote late joiner. FIXED.** Observer branch (`BOW49P`, all six
  clubs taken): the device reads "YOU ARRIVED AFTER THE LEAGUE CLOSED … Sit with
  the desk next to you — you are on their club now", prints the rule in force,
  and carries the how-today-works panel. No "finding your club…", no `409`.
  `/teach` raises "1 pair arrived after the league closed and could not be given
  a club — Late pair 1 … Seat them with a neighbouring desk." Takeover branch
  (3 desks, 6 clubs, joined at week 2): the pair is seated on Desk 4 · Oklahoma
  City with the played week 1 recap and the rule in force, and `/teach` raises
  "Took over a league-office club after the vote had started."
- **B5 — the rehearsal path. FIXED.** The landing page now reads "Do **not** just
  press Advance ▸ through PLAY … Rehearse PLAY with its own controls — the round
  step … and the week bell", and PLAY's WATCH FOR carries a rehearsal card,
  "The interior of PLAY is where this rehearsal has to go", naming
  `Close round 1 of 3` / `Run the two-thirds test` / `Close week 1` and the exact
  press order. Walked literally with zero students in `BOW6WM`: five rule-step
  presses reached ROUND 2, ROUND 3, ROUND 3 · SEALED, THE RULE THAT HELD, WEEK 1
  OF 3, then three week bells reached WEEK 2, WEEK 3 and "All three weeks are in
  the books". The prescribed rehearsal now rehearses the interior.
- **B6 — the non-proposer screen. FIXED.** In `BOW49P` Desk 6 · Boston, holding
  out in round 1, reads on its own device: "YOU HAVE NOT PUT A NUMBER IN … A desk
  with no number in has ABSTAINED: it is not counted in the room's middle number,
  and it cannot be inside the ten-point band — so the two-thirds test counts it
  as a desk that did not back the rule." The director's claim ("Its own screen
  says exactly that") is now true.

### Residual, non-blocking, new this recheck

- **N9 —** On the B4 takeover branch the director says "They did not write this
  rule and their club's earlier weeks were played by the league office. **Their
  own screen says so.**" The takeover desk's full screen carries the rule in
  force and a `WEEK 1 — HOW IT WENT · AUTO` recap, but never says it took over a
  league-office club or that the rule was voted before it arrived. Same defect
  class as B6, on the new branch, with a much smaller payload.
- **N10 —** In the `up` branch the console asserts "nobody had to decide to try
  harder" as fact, while the answer key's honest answer is conditional — "the
  CONDITION, **if** the room voted it in". In `BOWXLX` the adopted rule was
  CONDITION **OFF** and effort still rose, and that case has a question but no
  applicable key.
- **N11 —** The observer late joiner is still counted in `JOINED` (7 for six
  desks) and listed in the join list. The WATCH FOR entry now explains it, so it
  no longer misleads.
- N1, N2, N4–N8 from the original gate were **not re-tested** this recheck —
  **NOT VERIFIED**. N3 is fixed in passing: the PLAY NOW panel now names
  `Operate the league office's rule` and says what it does before it is pressed.

**TRANSFER: READY**

**DISSENT teacher-l3-not-ready: DISCHARGED**

The dissent was recorded against treating B1 or B2 as cosmetic on the grounds
that a well-run L3 follows a completed L2. Neither was treated that way: the
CONSEQUENCE question is now computed from the same direction atom as the line
above it, and the unlinked room got a real substitute instrument and a warning
at create time and at LOBBY. Still **NOT VERIFIED** and unchanged from the
original gate: the `down` and `flat` CONSEQUENCE branches on the rendered
surface, economics correctness, sports-reality dating, projector legibility, and
whether the period fits 50–60 minutes with real children. Nothing here is
classroom-proven (D10).
