# VERIFY_L2 — independent verification of M1L2 "The Trade Deadline"

Fresh-context verifier (CLAUDE.md §11). I did not build this lesson and made
no repairs — findings only. Scope: the six dimensions in the verification
brief, in priority order. The spec's stepped-$5M-bid, four-named-target, and
trimmed-phase-list deviations from `PLAYABILITY_SPEC.md` are founder-approved
and are not relitigated below.

**Build:** `npm run build` (from `runtime/`) — clean.
**Tests:** `npm test` — **216/216 passing**, matches `runtime/README.md`.
**E2E:** `node scripts/e2e-l2.cjs` — **PASS**, zero console errors across
teach/board/4×play, full arc LOBBY→…→COMPLETE, both a won and a lost bid
exercised for real.
**Hands-on:** real compiled server driven by hand-written Playwright scripts
(Chromium at `/opt/pw-browsers/chromium`) plus raw HTTP attack scripts
against the running server — ~90 scripted probes across four rounds, detailed
below. Screenshots saved outside the repo at
`/tmp/claude-0/-home-user-bow-economics-live/abe262a3-9823-5046-9293-b0fc8535899f/scratchpad/l2verify/shots/`
(not committed; referenced by name below).

## VERDICT

**ACCEPT WITH REQUIRED REPAIRS** — gameplay rating **STRONG**.

The economics, the auction mechanics, and the reveal/debrief drama held up
under sustained, hostile, hands-on attack (25/25 clean on the dedicated
exploit round; every claimed exploit in the verification brief's own list
was attempted and failed to land). One real, reproducible **BLOCKER**
exists, narrowly scoped to a single root cause (`hadOpenSlot`'s semantics
under a specific reveal-pacing sequence) — it is a reliability/view-
consistency defect, not a design or economics failure, and the fix surface
is small. Repair it, re-verify only that path, ship.

---

## BLOCKER

### B1 — A teacher who advances out of REVEAL before every target is
revealed leaves the affected team(s) with a permanently, publicly **false**
"roster is full" state — on the student's own screen *and* on the
class-wide projected SYNTHESIS numbers.

**Root cause.** `hadOpenSlot(team) = team.path === "bid" && team.bidOutcome
=== "lost"` (`tradeDeadline.ts`) is the single predicate every surface uses
for "does this team have a real open slot": `studentView`'s ADAPT case,
`boardView`'s ADAPT/aggregate case, and `computeAggregate`'s
`openSlotCount`/`rescuedCount` (which feed the board's own "NO DOMINANT
STRATEGY" SYNTHESIS card). It correctly excludes a team that later got
rescued (the fix this helper was built for — confirmed still correct, see
"held up" below) but it does **not** distinguish "genuinely never had an
open slot" from "bid outcome is still `null` because REVEAL never got to
this team's target." Both read as `false`. Nothing in the runtime or the
module blocks a teacher from clicking **Advance** while in REVEAL with
targets still unrevealed — `assertActionable`/`control()`'s `advance` case
only checks `mod.phases.indexOf`, no completeness gate; the teach UI's
`btnAdvance` has no `confirm()` and is never disabled on `revealedCount <
totalTargets` (only a same-weight KPI number — "1/4 · Targets revealed" —
exists as a *soft* cue, easy to miss mid-class).

**Repro (API, deterministic — `aggregate_undercount.mjs`).** Two carried
franchises, India and Juliet, each cut a slot and place a real, in-budget
bid on a *different* target (India → tgt-df $25M; Juliet → tgt-sc $20M,
a genuine, honest lowball that legitimately loses). Teacher reveals only
tgt-sc (Juliet's — resolves normally to `lost`), then clicks **Advance**
twice in a row (REVEAL→ADAPT→SYNTHESIS) without revealing tgt-pm/tgt-df/
tgt-rb — exactly what a teacher keeping pace with a 50-minute period is
likely to do. Ground truth (`teacherView`), both teams identically holding
an empty, unfilled slot:
```
India:  path=bid target=tgt-df bidOutcome=null  openSlot(hadOpenSlot)=false capUsed=72
Juliet: path=bid target=tgt-sc bidOutcome=lost   openSlot(hadOpenSlot)=true  capUsed=72
```
Both `capUsed=72` (vs. a full wall's ~90-97) — India's slot is exactly as
empty as Juliet's. But the class-wide board SYNTHESIS card actually
projected to the room reads:
> "0 stood pat, 0 went safe with a known veteran, 2 took the risk on a
> sealed bid. 0 of 2 bids won, **and 1 team finished the deadline with an
> open slot to rescue.**" — true count is **2**.

`aggregate.openSlotCount` is `1`, should be `2`. This is a factually wrong
number stated on the projector at the exact moment CLAUDE.md says "the
reveal is where the lesson lands" — direct economic-truth and debrief-
quality failure, not just a stray display glitch.

**Repro (real client UI, screenshotted — `visual-bug.cjs`).** Same setup,
one team (Gamma, phone-width viewport 390×844). Gamma legitimately cuts
DEFENDER and bids $25M on tgt-df (a bid that would win if revealed — reserve
is $25M). Teacher reveals only tgt-sc, then clicks **Advance** once.
Gamma's own `/play` screen (`mobile-04-BUG-adapt-nothing-to-do.png`):
> "Your roster is full going into the rest of the season — nothing to do
> here."
Ground truth at that instant (`teacherView`): `bidTargetId=tgt-df
bidOutcome=null openSlot=false capUsed=72` — the DEFENDER slot is
genuinely empty. The teacher's own console
(`teach-02-premature-adapt.png`) shows the honest picture side-by-side —
"1/4 TARGETS REVEALED", Gamma's card reads "sealed — pending" — but nothing
stops or warns before the click, and once in ADAPT, `teacher:revealNext`
is phase-gated to REVEAL and can never resolve that bid again.

**Consequence for the affected team.** The rescue grid never renders for
them (`renderTDAdapt` gates on `view.openSlot`, which is `null`), so there
is no UI path to fix their own roster — even though a raw API call proves
the reducer *would* still accept it: `POST .../actions {type:"rescueFill",
playerId:"res-df-1"}` for the exact same team returned `200`, actually
filled the slot (`capUsed` 72→77, `rescued:true` in `teacherView`), and yet
Gamma's own `/play` screen still read "nothing to do here" afterward —
the reducer's real permissiveness and the view's own gate have drifted
apart. A student would need to know to open dev tools and forge the call;
none would, so in practice the slot just stays empty and hidden for the
rest of class.

**Recoverability.** If the teacher notices immediately, **Restore** *does*
correctly revert to the pre-advance REVEAL checkpoint (`revealedCount` back
to 1/4), and finishing the reveal properly then resolves the bid correctly
(verified — `restore_test.mjs`). This is a real mitigation, but it is a
single-level checkpoint that only survives until the next risky control
action, there is no warning to prompt the teacher to use it, and most
realistic classroom pacing (advance, advance, advance to stay on schedule)
will overwrite it before anyone notices the number is wrong.

**Why BLOCKER, not MODERATE:** this is trivially reachable by one ordinary,
unwarned misclick (not a contrived edge case), it produces a statement that
is definitively false rather than merely confusing, on both a student's own
screen and the class-wide projected numbers, and the design's own required
recovery path (the ADAPT rescue UI) is unreachable for the affected student.

---

## MODERATE

### M1 — A student who joins after HOOK has closed can never claim a
franchise or take any action for the rest of the module; the module offers
no digital recovery.

Repro: join a session already in PLAY, attempt `claim` → rejected (`"claim
a franchise during HOOK (session is in PLAY)"`), attempt `standPat` →
rejected (`"claim a franchise before making a deadline decision"`). The
`/play` client's own message is honest about this ("You never claimed a
franchise — talk to your teacher") rather than silently stuck, and it
matches CLAUDE.md's stated "pairs on one device" default (a late student
can be paired onto a teammate's device as a physical workaround) — so this
is survivable, not a blocker. It is not unique to L2 (the same phase-gate
pattern is shared by the whole runtime), but it was in scope to check here
and there is no admin action (teacher-side "let this seat claim now") to
close it digitally. Worth a repair if a cheap one exists (e.g. leave HOOK's
`claim` action live through PLAY too, since claiming doesn't touch the
board and costs nothing to leave open a little longer), otherwise worth
naming explicitly in teacher-facing run notes.

---

## MINOR

### N1 — `ratingOf()` uses a deadline TARGET's `trueValue` (a dollar
figure) as its fallback "rating," which can numerically exceed the RESCUE
pool's real 0–100 ratings despite RESCUE being the intentionally-inferior
fallback path.

E.g. `tgt-pm` (Deshawn Ruiz) `trueValue=30` vs. its own position's rescue
players rated 44/47/50. This is dormant, not a live bug: I traced every
caller and confirmed a won target's "rating" is never actually rendered
anywhere a student or the board can see it — `committedSummary`'s `"bid"`
branch never surfaces `signedPlayer.rating`, and REVEAL/board always state
`trueValue` explicitly as a dollar amount ("turned out to be worth about
$XXM"), never as "RTG". No repro of a visible false comparison exists
today, but the next person to add a "your final roster" summary screen
touching `summarizePlayer` on a won-target slot could accidentally surface
it. Worth a one-line comment or a real rating field on `Target`, at
leisure.

### N2 (not a new finding — inherited, out of scope) — `GET /api/sessions`
remains unauthenticated (README's own documented gap). Confirmed for L2
specifically: the listing exposes only `code`/`title`/`phase`/`ended`, no
team, bid, or seat data — no L2-specific worsening of this pre-existing,
already-triaged gap.

---

## What I tried that held up (repairs must not re-break these)

**Exploit list from the brief, all attempted, none landed:**
- Deliberate lowball-to-lose-on-purpose then grab an ADAPT rescue: a
  *genuinely* lost bid and a *deliberately* sandbagged one land in the
  identical rescue-eligible state — there is no separate exploit path. The
  rescue pool is a strictly worse "fallback" (rating 44–52 vs. veterans'
  63–66, and copy explicitly frames it as a fallback), and with no
  scoring/leaderboard (D4) there is nothing to reward hoarding unused cap
  room. Does not beat honest paths.
- Multiple bids/cuts per team, re-cutting or revising after commit,
  double-committing (standPat after a bid, a second cutForVeteran after
  committing) — all rejected (`"your deadline decision is already locked
  in"`), confirmed via real HTTP round trips, not just the reducer's unit
  tests.
- Claiming two franchises, claiming an already-claimed franchise, claiming
  an out-of-range index, claiming with a spoofed body `seatId` — all
  rejected. `seatId` is derived server-side from the device-token-bound
  seat, never trusted from the request body (confirmed: a `rescueFill`
  sent with a forged `seatId` for a different seat still only ever acted
  on the caller's own seat).
- Bids over cap, under `MIN_BID`, off the `$5M` step, negative, NaN/string-
  typed, on a bogus slot id, on a position-mismatched target — all
  rejected with the exact, correct reason string.
- Reserve enforcement: with three real bids on one target ($20/$25/$25
  against a $25 reserve), the $20 bid **lost** despite being one of only
  three bids — a lowball never wins, confirmed, not just asserted.
- Deterministic tiebreak: two identical $25 bids on the same target — the
  earlier-committed one won, reproducibly.
- Winner's-curse framing: verified against fixed `trueValue` vs.
  `winningBid`, not narrated. Screenshot (`04-board-reveal-theater.png`)
  shows "WINNER'S CURSE" in alarm-red, distinct from a plain "won" —
  winning a bid and making a good deal are visually and textually
  distinguished, not conflated.
- Cap-inviolability: never exceeded $100M under any attack; exact
  arithmetic spot-checked (`capUsed` 72→77 after a $5M rescue, matching to
  the dollar).
- Cross-pool rescue forgery: attempting to sign a MARKET id, a VETERAN id,
  or a position-mismatched RESCUE id as a "rescue" — all rejected. The
  rescue bin cannot be used to sneak in a real player.
- Full-wall teams (won a bid, signed a veteran, stood pat) cannot access
  `rescueFill`; double-rescue on an already-filled slot rejected.
- Malformed payloads (missing fields, null/string bid amounts, garbage
  JSON, an XSS-attempt stand-pat reason) all cleanly rejected with 4xx;
  server never crashed, stayed responsive to `/api/lessons` throughout.
- Teacher-key gating: `control`/`teacherView` correctly reject a missing or
  wrong bearer token (401) for L2 specifically, not just L1.
- Rejoin-PIN lockout after 5 wrong attempts + teacher-side Unlock —
  exercised end to end for an L2 session (closes the README's own
  "worth deliberately exercising" gap): 5 wrong PINs → 6th attempt (even
  with the *correct* PIN) locked out (423) → teacher `Unlock` → correct PIN
  now succeeds, new device token issued.
- Restart survival: hard-killed the live server process mid-session
  (ADAPT phase, one team already rescued), restarted pointed at the same
  default snapshot path — phase, version, and checkpoint all came back
  identical.
- Path dependence: at-cap L1 spend produces a strictly lower post-cut
  deadline budget than leftover-room L1 spend, by construction
  (`cutBudgetFor` is grounded in the invariant `claim.spend`) — confirmed
  arithmetically, not just narratively.
- Student clarity, hands-on at a 390×844 phone viewport: the midseason
  report (`mobile-01-hook-report.png`), the cut/bid decision panel
  (`mobile-02-cut-decision-panel.png`), and the committed-decision recap
  (`mobile-03-committed-recap.png`) are all legible — clear $ figures, one
  plain-language reason per player, dead cap called out as its own line
  ("$2M dead cap stayed on the books"), the sealed bid explicitly flagged
  ("nobody can see this yet").
- SYNTHESIS cards elsewhere (outside the B1 scenario) do cite this
  session's own real, locked-at-commit numbers — verified against state,
  matches `tradeDeadline.test.ts`'s own "frozen not live" property tests,
  which also pass (216/216).

## Commands run this session

```
cd runtime && npm install && npm run build && npm test          # 216/216 passing
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/e2e-l2.cjs # PASS, 0 console errors
```
Plus ~90 hand-written probes across `attack.mjs`/`attack2.mjs`/
`attack3.mjs` (raw HTTP against a locally-run compiled server) and two
Playwright scripts (`visual-bug.cjs`, plus ad hoc restore/rejoin/aggregate
scripts) driving the real `/teach`, `/play`, `/board` pages — not committed
to the repo, available at
`/tmp/claude-0/-home-user-bow-economics-live/abe262a3-9823-5046-9293-b0fc8535899f/scratchpad/l2verify/`
if a repairer wants to rerun any of them.

---

## RE-VERIFICATION (against commit `662f04b`)

Targeted re-check only, per founder instruction — not a full re-run of the
original gauntlet. Read `662f04b`'s diff critically (all 9 changed files),
rebuilt, ran the full suite and both e2e scripts, then re-ran my own
scratchpad repros against the repaired build plus new probes aimed
specifically at the repair's own new surface (`onPhaseExit`, the PLAY-phase
claim path, the `confirm()` warning). Everything below is evidence from
this pass, not carried over from the first round.

**Build/tests:** `npm run build` clean. `npm test` — **225/225 passing**
(216 + 9 new), matches the commit message and `runtime/README.md`.
**E2E:** both `scripts/e2e-l2.cjs` (unchanged happy-path arc) and the new
`scripts/e2e-l2-early-advance.cjs` — **PASS**, zero console errors on each.

### B1 (BLOCKER) — **FIXED**

Re-ran my exact original repro (`aggregate_undercount.mjs`, with the bid
amount that had originally shown the false undercount) plus a corrected
both-teams-genuinely-lose variant against the repaired server:
`openSlotCount` now reads **2** (was 1), `revealedCount` auto-jumps to
**4/4** the instant the teacher advances out of REVEAL, and the board's
projected SYNTHESIS card now reads *"2 teams finished the deadline with an
open slot to rescue"* — matches ground truth exactly. Re-ran the original
UI repro (`visual-bug.cjs`, screenshot `mobile-04-BUG-adapt-nothing-to-do.png`
now overwritten with the fixed render) with a bid tuned to a genuine loss:
Gamma's real `/play` ADAPT screen now shows **"OPEN SLOT: DEFENDER"** with
three real, correctly-priced/rated rescue candidates — not the old false
"nothing to do here." `hadOpenSlot` itself is untouched (confirmed via
diff); its precondition (`bidOutcome` resolved) is now runtime-guaranteed.

Additional targeted probes, all against the live repaired server:
- Advance out of REVEAL with **0** revealed — succeeds, auto-resolves all 4,
  correct winner/price/verdict, real ADAPT access. PASS.
- Advance out of REVEAL with **all 4 already** revealed — succeeds as a true
  no-op (team rows byte-identical before/after; `onPhaseExit` returns the
  same state reference when nothing is left to resolve, confirmed via the
  commit's own `state !== session.state` guard). PASS.
- **Restore-after-early-advance** — advance early (1/4 manually revealed,
  3 auto-resolved), then `restore`: reverts to the exact pre-advance REVEAL
  checkpoint (`revealedCount` back to 1, the auto-resolved team's
  `bidOutcome` back to `null`) — the checkpoint is captured from
  `session.state` *before* `onPhaseExit` runs (confirmed in
  `sessionService.patch`), so Restore genuinely undoes the auto-resolve, not
  just the phase number. PASS.
- **Divergence check** — built an identical two-bidder exact-tie fork,
  resolved one copy via early-advance auto-resolve and the other via a full
  manual click-through, normalized both `teacherView` team rows: **byte-for-
  byte identical** (same winner, same price, same tiebreak). PASS — the
  commit's "byte-identical" claim holds under an adversarial tie case, not
  just the single-bidder case its own test covers.
- **draftDay/boxOffice/lobbyDemo regression** — confirmed via `git diff`
  those three module files have **zero changes** in this commit; live-probed
  each module's `advance`/`reveal` controls post-repair anyway (all three
  still transition phases normally, draftDay's `reveal` jump still works
  with no crash from the new optional hook being absent). No behavior
  change, as claimed.

**NEW ISSUE found (not present before this repair) — MODERATE:**
`btnReveal` ("Jump to REVEAL") stays enabled for the entire REVEAL phase —
its disabled check is `!s.phases.includes("REVEAL")`, never `s.phase !==
"REVEAL"` — and the new `confirm()` warning was wired only to `btnAdvance`,
not to `btnReveal`. Clicking "Jump to REVEAL" **while already in REVEAL**
sends `control({type:"reveal"})`, which calls the same `applyPhaseChange`
with `fromPhase = toPhase = "REVEAL"` — `onPhaseExit` fires on that
same-phase transition and silently bulk-resolves every remaining
unrevealed target in one shot, with **zero warning**, even mid-staged-
reveal. Reproduced directly (`edge_probes.mjs` PROBE 3): 0/4 revealed →
one `{type:"reveal"}` call → 4/4 resolved, no dialog, no error. Before this
repair, that same click was a harmless no-op (jumping to a phase you're
already in did nothing); the repair turned it into a silent, irreversible-
in-effect skip of the entire reveal drama. Not a repeat of B1 — the
resolved numbers are still 100% correct (verified byte-identical to a
manual reveal, same test method as above) and it's recoverable via Restore
if caught immediately (same mechanism verified above), so no false data and
no stuck state — hence MODERATE, not a blocker. Worth closing alongside any
future B1-adjacent work, e.g. by extending the same `confirm()` guard to
`btnReveal`, or disabling it once `phase === "REVEAL"`.

### M1 (MODERATE) — **FIXED**

Live-probed against the repaired server: a seat joining mid-PLAY (after a
different seat already claimed and PLAY had opened) gets `lateJoin: true`
and the same claim picker HOOK uses; successfully claims a stock franchise;
then, once PLAY itself closes (phase advances to REVEAL), a *third* late
joiner's claim attempt is correctly rejected (`"claim a franchise during
HOOK or PLAY (session is in REVEAL)"`) — claiming is open longer, not
open forever. Privacy check: the late-joiner's claim-picker view was
scanned for leakage and contains no other seat's `deadCap`/`bidAmount`/
`bidOutcome` data — `availableClaimsFor` only ever surfaces unclaimed
carried franchises' own starting rosters, identical shape to HOOK's picker.
No claim was ever observed landing after PLAY's close in any probe.

### N1 (MINOR) — **FIXED**

Confirmed via source diff (`ratingOf`'s `TARGET_BY_ID` fallback removed)
and live: fetched a won target's `signedPlayer` mid-REVEAL — `rating` is
now `0` (the honest "no rating concept applies"), not the old dormant `36`
(the target's `trueValue`) that could have leaked into a future summary
screen.

### Prior "held up" ground — reconfirmed, not just assumed

Reran the full round-3 exploit battery (`attack3.mjs` — reserve
enforcement, deterministic tiebreak, cross-pool rescue forgery, full-wall
rescue rejection, double-rescue rejection, seatId-spoofing, malformed
payloads) against the repaired build: **25/25 still clean** — the
`doRevealNext`/`resolveTarget` refactor did not disturb any previously-
verified economics or exploit-resistance ground.

### Overall verdict

**ACCEPT.**

All three prior findings (B1 BLOCKER, M1 MODERATE, N1 MINOR) are genuinely
repaired and independently reconfirmed through unit tests, both e2e
scripts, live API repros of the exact original scenarios, and a live-UI
screenshot of the corrected ADAPT screen. The repair's own new surface
(`onPhaseExit`, the confirm-gated Advance, the PLAY-phase claim path) was
probed specifically, not just trusted, and one real gap surfaced — the
un-warned "Jump to REVEAL while already in REVEAL" silent bulk-resolve.
It is a genuine new issue, correctly scoped as MODERATE: no false data
reaches any screen (confirmed byte-identical to a staged reveal), no team
is left stuck, and it is recoverable via the same Restore mechanism that
covers B1's own edge case. It does not warrant blocking acceptance; it is
a debrief-drama loss on a narrow, findable misclick path, worth a small
follow-up (extend the existing `confirm()` idiom to `btnReveal`, or disable
it once already in REVEAL) whenever this module is next touched.
