# GATE_L3_PLAY — Module 2 Lesson 3 "Writing the Rule" (m2l3-write-rule)

Independent Player / Gameplay critic. Boss run `m2-quality-war`, assignment `gate-l3-play`.
Fresh context; I did not build any part of this lesson.

**Method (browser truth).** `npm run build` at head, server on PORT 4401, Playwright + Chromium,
real pointer drags on every dial, real clicks on every button, no programmatic `el.value`, no
`?debug`, no console calls. Three sessions played to COMPLETE at eight desks each on 1024x600
Chromebook viewports plus a 1600x900 projector and a 1280x900 `/teach`, and two targeted probes.
Screenshots: `docs/gauntlet/module-2/screens-l3-gate/` (130 frames, prefixed by session).

| session | strategy profile | outcome |
|---|---|---|
| **A** | 4 desks read their own club (big→5%, small→55%, softening), 2 copy-the-median, 1 ideologue at 60% every round, 1 holdout at 0% every round | ADOPTED 30% · CONDITION ON, 6 of 8 in band |
| **B** | perfectly polarized: 4 desks 0–5%, 4 desks 55–60%, nobody moves | NOT ADOPTED, 0 of 8 in band → status quo 5% · CONDITION OFF |
| **Z** | first run, all eight desks converge low (harness artifact — my club detector misfired; kept as a third data point for a low-share adoption) | ADOPTED 5% · CONDITION ON |
| **C** (probe) | 6 desks, 2 of them passive (never touch a control) | NOT ADOPTED, 3 of 6 |
| **D** (probe) | 3 desks, decisive test of the post-close submission window | ADOPTED 30% (see `biggest-failure`) |

Zero console errors on every surface in every session (observed).

**Evidence classes.** *observed* = I saw it in the browser this session. *inferred* = reasoning from
observed values. *NOT VERIFIED* = needs real students or an artifact I was not given.

**Boss evidence ids.** Context I read: `l3-replay-review--PLAY_REVIEW.md` (Stage-0 FUNCTIONAL rating
and its three named causes), the wave contract in `.boss/runs/m2-quality-war/contract.md` (BC-1,
kill condition), `l3-e2e`, `l3-tests`, `l3-tuning`, `l3-arith-harness` (record files read for scope,
not re-run by me — their green status is **NOT VERIFIED by this gate**). Target feeling taken from
`docs/gauntlet/module-2/ECONOMIC_CONTRACT.md` L3: *"watching your own rule change what you want to
do — the moment a student says 'wait, now there's no point in me even trying to sell out.'"*
Pairs-on-one-device default: honoured (one seat per device, 1024x600, fictional pair names).
This gate's own artifacts carry no Boss evidence id yet; the Lead Integrator attaches them.

---

## what-the-student-plays

A pair sits at one Chromebook holding one real NBA club (observed: New York, Memphis, Golden State,
Oklahoma City, Milwaukee, Boston, Indiana, L.A. Lakers), labelled BIG or SMALL MARKET with seats,
weekly bill, Draw and cash. The arc, as played:

1. **HOOK (~5 min, 1 decision).** Boston, June 2025, real position, commit-then-reveal: pay the tax
   or break it up. Reveal names Holiday/Porzingis and the Harden counter-case. Clean beat.
2. **THREE OFFER ROUNDS (~8 min, 3 decisions).** SHARE dial 0–60% (what fraction of every club's
   local money goes into one equally-split pot) plus a CONDITION toggle (must put ≥15% back into
   your own product to collect a full share). Round 1 is blind — the desk says so in words. After
   each close, the projector and every desk show an anonymous unsorted histogram of all eight
   numbers and a MIDDLE NUMBER. The desk prints "No preview. Nothing on this screen tells you what a
   share will be worth to you," and that is true (observed sweep: moving the dial 0→45 changed
   exactly one string, the readout — `A-04-sweep-probe`).
3. **THE TWO-THIRDS TEST (~2 min, 0 decisions).** Adopted share = the snapped median of round 3;
   passes only if two-thirds of desks are within ±10 of it. Fail → status quo 5% · CONDITION OFF.
4. **THREE SEASON WEEKS UNDER THE RULE (~12 min, 6 decisions).** Two dials per week — seat price
   $10–$120 and put-back 0–40% — locked blind, settled by a teacher bell that auto-commits anyone
   who did not lock (observed, marked AUTO). Each settlement gives the pair a paid-in / took-out /
   net-from-the-pot column plus, when they were under the condition, the line *"Docked: you were
   under the condition the room voted in, so you collected half a share."* A rookie lands at a random
   club in week 2 (observed: Milwaukee), announced on both surfaces with the honest "this is not how
   the real lottery works" note.
5. **REVEAL (5 staged beats), CONSEQUENCE, COUNTERFACTUAL, ARGUE, SYNTHESIS, COMPLETE (~28 min, 1
   decision).** Board-driven: the rule printed, the pot forming, an eight-row paid-in/took-out table,
   the BC-1 moved-arrow/flat-arrow frame, the effort table, a runner-up replay, the Kings 22-8
   commit-then-reveal, then seven five-rail "Economics You Learned" cards.

**Genuine decisions: 11** (1 hook + 3 proposals + 6 dial settings + 1 Kings vote) across a
director-budgeted ~57 minutes. Ten of the eleven happen in the first ~29 minutes.

---

## pull-rating

**RATING: FUNCTIONAL**

Below the Track 101 bar for the module finale, and therefore below this wave's STRONG-or-better
requirement. This is *not* the Stage-0 loop: every one of the three defects that capped the prototype
at FUNCTIONAL (`l3-replay-review`) is genuinely fixed, observed —

- **"You submit the same number three times."** Fixed in the mechanic. Round 1 is blind; after it
  closes, every desk and the projector carry the room's full distribution and its middle number, and
  the ±10 band gives a concrete, correct reason to move. In session A six of eight desks changed
  their number between rounds using only on-screen information. In session B the polarized histogram
  — two towers at 0 and 60 with a canyon in the middle and MIDDLE NUMBER 30% floating over an empty
  column (`B-08-board-after-round1.png`) — is the best argument-provoking frame in the lesson.
- **"The CONDITION control is inert."** Fixed and potent. The adopted condition rides with the
  supporting bloc, and under CONDITION ON a desk below 15% collects half a share every week — the
  most consequential line on the student device, fired repeatedly in session A (observed).
- **"A veil over your own club during the vote."** Fixed: club, market size, seats, bill, Draw and
  cash sit above the dial while you vote, with a Rawlsian twist ("one club in this room gets a rookie
  next season; nobody knows which") that gives the argument a genuine hook.

The season half is STRONG on its own. What holds the lesson at FUNCTIONAL is three things, in order.

**Biggest boredom source: the back half is a lecture.** From REVEAL to COMPLETE the class has exactly
one thing to do — tap Approve or Deny on the Kings — across the module's own budgeted 28 minutes
(5+6+3+6+7+1, read off the built director). That is roughly half the period and double the 7–15 min
debrief the project standard sets. Worse, the student device is **byte-identical across all five
reveal stages** (observed: `diff` of desk 1's full innerText at stage 1 vs stage 4 is empty), so
during the choreographed reveal a pair has no row to find, nothing to mark, nothing to predict, and
the same stale prompt on their screen. CONSEQUENCE then re-prints REVEAL stage 5's table verbatim
with a discussion question appended, and SYNTHESIS asks the room to read seven ~150-word cards, each
closing with the identical prompt.

**The lesson's own climax has no choreography.** "Did our rule pass?" resolves as one sentence on an
otherwise empty screen (`A-10-board-adoption.png`) — no band drawn on the histogram the room just
built, no count, no build. And during the rounds nobody in the room — desk, projector, or teacher —
is ever shown how many desks are currently inside the band. The teacher's control reads only
"Close round 2 of 3 (4/6 in)", a submission counter (observed, session C). So the two-thirds
tension, the whole engine of the vote, is invisible until it is over.

**The felt payoff scales with the adopted share, and a modest rule pays nothing.** At 30% the arrow
frame moved 3 of 8 put-back optima and 4 of 8 prices. At 5% — reached in two of my three completed
sessions, one of them by the realistic polarized route — it reads "0 desks' best price came down, and
8 desks' best price did not move at all" (observed, `Z-11`/`B-11` reveal stage 4).

Session A's season, taken alone, is the target feeling landing: New York paid $626,918 into a pot it
had just voted for, took $206,499 back, was docked for sitting at 10% under a 15% condition, and read
that sentence on its own screen before setting week 2's dial (`A-15-desk1-week1-settled.png`). That
is "our decision caused that?" — which is why the repairs below are bounded rather than a refound.

---

## biggest-failure

**The vote is not sealed. A desk can change its proposal after the round has closed, while the full
histogram and the median are on the projector, and that late number replaces its round-3 vote and
changes the rule the class adopts. Observed, decisively, in probe D.**

Setup: three desks propose 20 / 25 / 30 in all three rounds. The teacher closes round 3 (the button
now reads "Run the two-thirds test"). At that moment desk 1's `#wrShareDial` and `PUT IT IN` are
still enabled (`{"proposeExists":true,"disabled":false,"label":"PUT IT IN"}`). Desk 1 drags to 60%
and presses. Result:

```
ADOPTION: ADOPTED — SHARE 30% · CONDITION OFF. 2 of 3 desks landed inside ten points of the median.
(sealed vote would have been: SHARE 25% · 3 of 3)
```

Both the adopted rule and the supporting count moved from a submission made *after* the room saw the
answer. Three things fail at once:

1. **The blind commit is voided at the only moment it matters.** Every desk prints "No preview" and
   round 1 is deliberately blind — and then the last vote can be re-aimed at the visible median,
   which guarantees the re-aiming desk lands inside the band.
2. **It is not an exploit a class has to be clever to hit.** A real teacher holds the round-3
   histogram up to argue about it for thirty to sixty seconds. Any pair fidgeting with the dial in
   that window silently rewrites the class's adopted rule. Nothing on the board, the desk, or
   `/teach` announces that a number changed after the close.
3. **It corrupts the artifact the lesson exists to produce.** COMPLETE tells the room "your rule is
   the artifact you keep" — and the room cannot know whether the printed rule is the one it voted.

Adjacent, same root (observed, probe C): a desk that never presses PUT IT IN is counted in the median
as **5%**, while its own dial still displays the 20% default and neither its screen nor the teacher's
counter says it never voted. A pair distracted for ninety seconds silently casts a no-sharing vote.

---

## moment-by-moment-notes

Screenshots referenced live in `docs/gauntlet/module-2/screens-l3-gate/`.

**LOBBY / HOOK — works.** (`A-01`, `A-03`, `A-05`.) Real dated position, held before the reveal, the
counter-case in the same breath. No notes.

**Round 1, blind — works.** (`A-06-board-round1.png`, `A-07-desk1-round1.png`.) Board says the round
is blind; the desk says "Round 1 is blind on purpose." The club card above the dial is the single
biggest improvement over Stage-0. *Observed*: a small-market desk is told "a dollar put back into the
club buys more Draw than it would in a big market," which is about the reinvest dial, not the pot;
the inference "the pot is split equally, so as a small market I collect more than I pay" is available
from the SHARE explainer but is never said. Accessible, but the fifth-grader has to build it.

**Round 2 histogram — the best frame in the lesson, and the one the room can least act on.**
(`A-08-board-after-round1.png`, `B-08-board-after-round1.png`.) The distribution is legible and, when
polarized, dramatic. Three gaps, all *observed*: (a) no ±10 band drawn around the median, so nobody
can see who would pass; (b) no in-band count anywhere — board, desk, or `/teach`; (c) the bars are not
split by market size, so the two humps that *are* big-vs-small read as random disagreement. The
economics that would drive the argument is on eight private screens and never on the shared one.
*Non-blocking cross-referral to Projector:* in `B-08-board-after-round1.png` the tallest bar is
overprinted by the headline paragraph — the e2e's overlap guard only inspects `.wr-board-row` cells,
so a histogram/headline collision is outside its reach.

**Round 3 — thin by construction.** *Inferred from observed proposals + observed adopted shares:*
adopted share is the snapped median, which is outlier-robust, so an individual desk's number moves
the rule only when that desk sits near the middle. Recomputing session A's round 3 with the
ideologue at 60 instead of 40 leaves the adopted 30% unchanged. The honest shape of the decision is
"am I inside the band or not," which is real collective stakes with near-zero individual stakes. Not
a defect — it is a supermajority faithfully modelled — but it caps felt agency in the headline
decision, and the current screens do nothing to make the collective stake visible (see the missing
in-band count).

**Adoption — the drama is missing.** (`A-10-board-adoption.png`, `B-10`.) One sentence, appearing
instantly on an empty screen. The failure copy is genuinely good — *"You could not agree. Real leagues
have that problem too, and this is a legitimate outcome, not a failure. The old rule holds — 5% — and
we are about to find out what not agreeing costs."* — but see the fallback note below for whether the
lesson keeps that promise. *(A stale desk at the moment of adoption was a capture artifact of my
harness, not a defect: at +5s every desk carries the verdict. Withdrawn.)*

**Season weeks — the strongest surface in the build.** (`A-13-desk1-week1.png`,
`A-15-desk1-week1-settled.png`.) Two columns at 1024x600: last week settled on the left, next week's
two dials on the right, rule strip pinned, three-week slate open, nothing below the fold, no preview
of any kind (observed sweep: price 58→70 and put-back 0→40 changed two readouts and nothing else).
Two *observed* misses on the exact sentence the lesson is built around:
- The "Docked: … you collected half a share" line is set in the smallest type in the panel, under a
  bolder "Net from the pot". The sentence that should move the dial is the least prominent one.
- The put-back dial sits at 10% under a 15% condition with **no inline warning at the control**. The
  threshold appears only in the rule strip in the far top-right corner. A pair that has just been
  docked can walk straight into being docked again with nothing next to their finger saying so.
- It never prints what the dock cost in dollars (took-out $206,499 where a full share was ~$412,998).

**Auto-commit — works.** Desk 8 never locked week 1; the bell settled it and its own screen says
"WEEK 1 — HOW IT WENT · AUTO" (observed).

**REVEAL stages 1–3 — clean.** (`A-16-board-reveal-2/3.png`.) The pot-forming stat line and the
eight-row paid-in/took-out/net table are the mechanism Stage-0 was missing, now on the projector and
on each desk. Stage 3 is the frame that makes attribution possible.

**REVEAL stage 4 — BC-1 lands halfway.** (`A-16-board-reveal-4.png`.) Verdict on the signature beat:
**the arrows are there and legible; the economics is not.** *Observed:* New York and Boston hold
PRICE flat while Memphis, Oklahoma City, Milwaukee and Indiana come down — the flat-arrow-beside-
moving-arrow contrast genuinely renders. Four reasons it does not land as playable drama from the
surfaces alone:
1. **It never says why.** Nothing on the frame states that a building that sells out cannot move its
   price to sell more seats. "Why didn't New York move?" is asked implicitly by the title and
   answered nowhere; the teacher must supply the whole payload unaided.
2. **It is about an optimum the student was never allowed to see.** The lesson correctly refuses a
   preview all game, then asks the room to react to "the best thing to put back into Desk 7."
3. **Sixteen arrows, two columns, both moving.** New York's price is flat while its put-back moves,
   so "the arrow that did not move" is ambiguous on the very first row.
4. **"Did not move" is rendered as an em dash** (`PRICE $72 — $72`), which a grade-5 reader parses as
   a range before a negation; the meaning is carried mostly by grey-vs-gold.

**REVEAL stage 5 + CONSEQUENCE — the same table twice, and empty without a chained L2.** (`A-16-
board-reveal-5.png`, `A-18-board-consequence.png`.) In an unchained session the LESSON 2 column reads
"no L2" eight times, and CONSEQUENCE then asks "Whose effort went down?" over a table with no before.
The two frames are the same table; the second adds a question.

**COUNTERFACTUAL — honest, and on the adopted path monotone.** (`A-20`.) The "we cannot show you what
you would have done" limit is on the projector, which is right. At 30%→40% every row is exactly ×4/3;
nobody crosses anybody, so there is no surprise to argue about. **On the fallback path it is worse
than monotone:** session B's room, which split 0-vs-60 and failed, was replayed at **0%** — the
runner-up — producing an "AT 0%" column of eight literal `$0` cells. The room that most needs to see
what the rule it could not agree on would have paid is shown the difference between doing nothing and
doing slightly less than nothing. The board promised "we are about to find out what not agreeing
costs" and then does not compute it.

**ARGUE / Kings — a two-button opinion poll.** (`A-21-board-argue.png`, `A-22-desk1-argue.png`.) The
setup paragraph is strong, dated and real. But it says *"You vote on the two term sheets in front of
you"* and **there are no term sheets** — no bid figures, no market sizes, no arena numbers, and no
link to the pot the room spent forty minutes building. The only quantitative cue is "Seattle's offer
is worth more money," which points one way. So the real decision is not debatable *from what is
shown*: it is a values poll with a historical answer key attached. The reveal itself is excellent —
22-8, May 15 2013, the $534M sale, Golden 1 Center, the open 2026 expansion thread, and "Nobody is
scored" — but a class cannot argue economics from a frame that gave it no economics to weigh.

**SYNTHESIS — four of seven cards are this class's story; three are not.** (`A-24-board-synth-1..7`.)
*Computed, observed:* card 1 ($10,718,759 through the pot; 3 desks paid more than they took), card 3
(the adopted 30% and 6-of-8), card 4 (Boston's $1,108,656 into other clubs' buildings), card 5 (this
room's $17,823,196 of tickets against a $22,800,000 national TV check — the best surprise in the
finale). *Not this class's story:* card 2's OUR CLASS rail is a verbatim third printing of the
CONSEQUENCE stat line plus the stage-4 headline; card 6's rail is an admission that no L2 was linked,
under a title that claims the opposite ("THE LEAGUE THAT VOTED WAS MADE BY THE ROOM THAT VOTED");
card 7's rail is a simplification disclosure. Two REMEMBER WHEN rails assert moments that may not
have happened ("the moment somebody in this room said out loud that there was no point trying to sell
the building out"). Every card ends with the same prompt, seven times, and in an unchained session
that prompt ("one thing you did differently than in the last lesson") has no referent.

**COMPLETE — the fallback path is told it wrote a rule it did not write.** (`A-26`, `B-26`.) Both
paths print "YOUR RULE" and "Your rule is the artifact you keep." On the status-quo path the desk
also reads *"Three weeks under your own rule… The only thing that changed is the rule you wrote"*
(observed, probe C, on a NOT ADOPTED session). The board's own honest framing of the failure is
contradicted by the desk and by the closing frame.

**Honesty checks (asked, answered).**
- *Dominant proposal line?* No individually dominant proposal (inferred from the observed median
  rule): your number decides only whether you are counted in the two-thirds. Median-copying is not a
  free win — session A's two median-copiers were Boston (big), which finished with the worst net in
  the room at −$1,492,898, and Milwaukee (small) at +$703,015. Market size and condition-compliance
  decide the money, not the proposal. Correct shape.
- *Dominant play line?* Yes, and it is the intended lesson: under CONDITION ON, put back ≥15%.
  Session A's Memphis reinvested 0% for three weeks, was docked every week and collected $669,922
  where compliant small markets collected $1,962,064 — the small, poor club that did not try got the
  least. Legible and correct.
- *Sweepable pre-commit?* No inside a round or a week (observed, both sweep probes). Yes across the
  round-3 close (see `biggest-failure`).
- *Adoption gameable?* Not toward an absurd rule — median plus supermajority resists a single
  extremist (inferred). Gameable in the sealing (observed).
- *Two-round vote integrity / holdout → status quo.* The *verdict* reads as a legitimate outcome —
  the board's copy is the best sentence in the lesson. The *consequences* do not carry it: the room
  is never shown the cost of not agreeing (the 0% counterfactual), no arrows move, the effort table
  is empty, and the closing frames call the failure "your rule." As played, holding out is currently
  the cheaper path to a quiet finale rather than the expensive one.

---

## required-repairs

### Blocking (student-pull)

1. **Seal the vote at round close.** Disable the SHARE dial, the CONDITION toggle and PUT IT IN the
   moment a round closes, and re-enable only when the next round opens. Ship a test that submits
   after the close and asserts the adopted rule is unchanged. Until this exists, no adoption result
   the lesson prints can be trusted. *(Biggest failure.)*
2. **Give the two-thirds test a visible gauge and a climax.** During rounds 2 and 3: draw the ±10
   band on the histogram, and print the live in-band count on the board and on `/teach` ("right now
   5 of 8 would pass; 6 are needed"). At adoption: build the verdict on top of that same histogram —
   band, then count, then ADOPTED/NOT ADOPTED — instead of replacing it with one sentence on an empty
   screen.
3. **Cut the back half from ~28 minutes to ~15, and give the desk something to do inside the
   reveal.** Merge CONSEQUENCE into REVEAL stage 5 (they are the same table). Reduce SYNTHESIS to the
   four cards with genuinely computed OUR CLASS rails and vary the closing prompt. Give the student
   device at least one live element during the reveal — highlight *this desk's* row as each stage
   lands, or take a one-tap prediction before stage 3 ("did your club pay in or take out?"). The
   device being byte-identical across all five stages is the single clearest sign the reveal is
   happening to the room rather than with it.
4. **Repair the fallback payoff so holdout→status-quo is an outcome with teeth, not a quiet exit.**
   Replay the counterfactual at the number the room *failed to agree on* (the round-3 median), never
   at a share below the status quo; never print an all-$0 column. Fix the two copy contradictions on
   this path: COMPLETE must not call a failed vote "your rule," and the desk must not say "the only
   thing that changed is the rule you wrote."
5. **Put the economics on the BC-1 frame.** One line naming why a sold-out big market's price cannot
   move, tied to the specific flat rows on screen; split the frame so one quantity is compared at a
   time; replace the em dash with an explicit "no change" marker. Without this the module's signature
   moment is a teacher-transfer dependency, not a playable beat.

### Non-blocking (fix before classroom release)

6. Warn at the control, not in the corner: when CONDITION is ON and the put-back dial is under 15%,
   say so next to the dial before LOCK IT IN, and print what the dock cost in dollars after it.
7. Tell a desk that did not vote that it did not vote — and stop silently counting a non-submission
   as a 5% proposal. Make the teacher's round counter say how many desks have moved *this round*
   ("4/6 in" currently reads the same at the start of round 2 as at the end of round 1).
8. Split the round histogram by market size (anonymously). The conflict driving the whole lesson is
   currently visible only on eight private screens.
9. Give the Kings capstone the term sheets it claims to show: the two bids, the two markets, and one
   line connecting the vote to the pot the room just built. Otherwise it is a values poll wearing the
   module's clothes.
10. Card 6 and card 7's OUR CLASS rails should either compute something or the cards should be cut;
    a rail that says "no Lesson 2 session was linked" under a title claiming the room built this
    league undoes the finale's own premise.
11. Cross-referral, Projector: the round histogram's tallest bar is overprinted by the headline
    paragraph at 1600x900 (`B-08-board-after-round1.png`); the e2e overlap guard only inspects
    `.wr-board-row` cells.

### Formal dissent

`play-l3-below-bar` — I record dissent against any finding that L3 is STRONG at this head. The
mechanic is sound and the season half is strong, but the central vote is not sealed (observed, probe
D), the climax is undramatized, and half the period is action-free. Repairs 1–5 are bounded and none
of them is a redesign; I expect STRONG is reachable within this wave's repair budget. The wave's kill
condition is **not** met: the loop can plainly exceed FUNCTIONAL at classroom fidelity.

### Not verified

- Whether real grades 5–6 pairs move their number in response to the histogram, argue at round 3, or
  read the dock line before setting the next dial. Requires students.
- Whether `l3-e2e` / `l3-tests` / `l3-tuning` / `l3-arith-harness` are green at this head — I did not
  run them; this gate ran its own sessions only.
- Whether the `/teach` director copy (NOW / WATCH FOR / DON'T EXPLAIN YET) renders on the teacher
  surface; I read its minute budgets out of the built module, not off the screen. Teacher Transfer's
  call, not mine.
- The L2→L3 chained configuration. All three of my sessions were unchained, which is why the "no L2"
  frames appear; a chained class would see real before/after numbers there.

---

## RE-CHECK AFTER W4 FINAL REPAIR

Owning critic, same fresh-context Player / Gameplay role, Boss run `m2-quality-war`, assignment
`recheck-l3-play`. Method: `npm run build` at head `b23719e`, my own server on PORT 4411 (not the
e2e's), Playwright + Chromium, real pointer drags and real clicks, no `?debug`, mechanics taken from
`runtime/scripts/e2e-m2l3.cjs` but the assertions are mine. Screenshots `r1-*` in
`docs/gauntlet/module-2/screens-l3-gate/`.

| session | strategy mix | outcome |
|---|---|---|
| **R1** (full arc, 8 desks + late joiner) | 4 read-own-club, 2 copy-the-median, 1 ideologue at 60 every round, 1 holdout at 0 every round, 1 desk abstains in round 2, 1 desk never locks week 1, 1 desk non-compliant all season | **NOT ADOPTED** → status quo 5% · CONDITION OFF (4 of 8 in band) |
| **R2** (full arc, 8 desks + late joiner) | same mix, market detector corrected (4 BIG / 4 SMALL) | **ADOPTED 25% · CONDITION OFF**, 6 of 8 in band |
| **R1-probe** (4 desks, polarized 0/0/60/60) | decisive test of the nothing-moved fallback arm | NOT ADOPTED, 0 of 4 |

Zero console errors on every surface in all three (observed).

**RATING: STRONG**

**DISSENT play-l3-below-bar: DISCHARGED**

Cause-by-cause, all *observed* unless marked:

1. **Sealed vote — fixed.** After round 3 closes the dial, the CONDITION control and the commit
   button are all `disabled`, the button reads **VOTE SEALED**, and the desk prints why. A UI re-aim
   is ignored; a proposal posted straight at the API returns **HTTP 409 "the vote is sealed — round 3
   closed and the two-thirds test runs on the numbers that were in"**, and the board's middle number
   is byte-identical before and after. **Abstention is now true abstention**: the round-2 abstainer is
   told on its own screen that it is not counted in the middle number and cannot be in the band, and
   the arithmetic proves it is excluded (7 numbers → median 15 → gauge "5 OF 8 WOULD PASS", which is
   only correct if the abstainer is out). The live in-band gauge is on the projector in both rounds.
2. **Reveal half — half-repaired, as declared.** The desk is no longer byte-identical: five distinct
   `#wrLens` cards in both full sessions (rule / your net / paid-in-took-out / your price + verdict /
   your put-back). The stage-3 prediction is a real two-button commit resolved at stage 4 on both
   arms — "You said it moved. It did not move. Not what you expected — that is the thing to ask
   about." Not repaired (declared out of scope): the back half is still 5+6+3+6+7+1 = **28 minutes**
   with **two student actions** (predict, Kings), CONSEQUENCE still reprints REVEAL stage 5 verbatim
   (same stat line, same eight-row table, new title + question), and all seven finale cards still end
   on the same prompt.
3. **Kings term sheets — fixed.** Two rendered sheets on the projector *and* on the student device:
   $625M / $409M cash / private Seattle arena against $534M / ~$255M of city money capped at 47.7% /
   $273M borrowed to 2050 / 27th vs 12th TV market. Commit → the room's own tally alone → 22-8, two
   presses, with 16-of-30 stated correctly.
4. **Arrow frame — fixed, and genuinely outcome-adaptive.** Adopted 25% (R2): four sold-out big
   markets flat, four empty-seat small markets down $2, "NO CHANGE" spelled out, and a why-line that
   is *true of that frame*. Nothing-moved fallback (probe): the frame retitles to "THE RULE YOU KEPT,
   AND WHAT WOULD HAVE MOVED", labels the rows **"THESE ARE NOT YOUR NUMBERS… what every desk WOULD
   have been at 60%"**, and the why-line becomes "a rule this small takes too little of each extra
   dollar". That is a real status-quo lesson, not a shrug.
5. **Failed arm no longer claims authorship — fixed.** COMPLETE reads "THE RULE THAT HELD… You could
   not agree, so the old rule held. That is the artifact you keep… write the number you WERE arguing
   for next to it", on board and desk. The counterfactual replays the number the room failed to agree
   on (60% in the probe, 25% in R1), never below the status quo, no all-$0 column, headline "THE RULE
   YOU DID NOT WRITE".

**Single remaining cause (bounded, non-blocking): the back half is still a 28-minute lecture with two
taps.** It is bounded because nothing in it is a mechanic or an integrity problem — it is length and
duplication: merge CONSEQUENCE into REVEAL stage 5 (observed verbatim duplicate), cut the finale to
the cards with computed OUR CLASS rails, and vary the closing prompt. `/teach` already carries two
designated cuts (ARGUE 6 min, COUNTERFACTUAL 3 min), so a teacher can compress to ~19 min today, at
the cost of the best six minutes in the track.

Two smaller truth blemishes carried forward, non-blocking: (a) in the *middle* case — a kept 5% rule
where one arrow still moves (R1) — the why-line falls back to the capacity sentence and says "the
clubs with empty seats CAN sell more by charging less, and that is why their arrows moved" over a set
of exactly one moved price, instead of the "a rule this small" sentence the nothing-moved branch
already owns; (b) on the NOT-ADOPTED path, finale card 2's OUR CLASS rail still says the room played
"under its own rule" (R1, observed).

**Not verified.** Real grades 5–6 pairs at any of it; whether `l3-e2e`/`l3-tests` are green at this
head (I ran my own sessions only); the L2→L3 chained configuration (all three sessions unchained, so
the "no L2" rails appear); `/teach` director copy beyond the phase controls I pressed.
