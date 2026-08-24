# VERIFY_L3 — independent verification of M1L3 "Free Agency: The Signing Window"

Fresh-context verifier (CLAUDE.md §11). I did not build this lesson and made
no repairs — findings only. Scope: the six dimensions in the verification
brief (economic truth, student clarity, classroom operability, reveal/finale
quality, reliability, accessibility/density), in that priority order, plus
the three areas the builder itself flagged as judgment calls: GM Award/tie-
break algorithms, affordability margins, and the single 1000×640 e2e
viewport.

**Build:** `npm run build` (from `runtime/`) — clean.
**Tests:** `npm test` — **303/303 passing**, matches `runtime/README.md`
(225 pre-existing + 78 new: freeAgency's own suite + one tradeDeadline seam
test).
**E2E:** `node scripts/e2e-l3.cjs` — **PASS**, real L1→L2 played through the
API, L3 driven through real Chromium pages (`/teach`, 4×`/play`, `/board`),
full arc LOBBY→…→COMPLETE, a bidding war, a price collapse, coordinated
lowballing that raises price, an outbid team, a day-4 desperation signing,
and a late joiner mid-window all exercised for real, zero console errors.
`node scripts/e2e-l3-early-advance.cjs` — **PASS**, the teacher-leaves-PLAY-
mid-day path resolves a real pending offer correctly and warns before
firing, zero console errors.
**Hands-on:** real compiled server driven by hand-written Node/Playwright
scripts (Chromium at `/opt/pw-browsers/chromium`), plus direct calls into
the compiled reducer (`dist/modules/freeAgency.js`) for adversarial probes
that don't need a browser. Screenshots saved outside the repo at
`/tmp/claude-0/-home-user-bow-economics-live/83ed0941-bd5b-5823-b4b5-789d77faca7a/scratchpad/shots/`
(not committed; referenced by name below); the repo's own
`docs/gauntlet/module-1/screens-l3/` already carries the builder's e2e
screenshots from this session's `e2e-l3.cjs` run.

## VERDICT

**ACCEPT WITH REQUIRED REPAIRS** — gameplay rating **STRONG**.

No BLOCKER exists — cap inviolability, dead-cap arithmetic (including the
specific case the charter calls out: releasing a won L2 TARGET whose price
is a bid amount, not its `trueValue`), day-1 viability, sealed-offer
privacy, JSON round-trip/snapshot survival, and reducer robustness against
hostile/malformed input all held up under direct adversarial testing, not
just the shipped test suite. Both e2e scripts pass end to end. This is a
noticeably cleaner starting point than L2's own first pass (which shipped
with a genuine BLOCKER).

Four real MODERATE findings remain, though, and two of them sit on exactly
the two dimensions CLAUDE.md and the verification brief rank first —
economic truth (a free, zero-risk way to fake the room's central public
signal) and student clarity (the market's own governing rules are never
explained anywhere a student can read them). Given how central both are to
this lesson's actual teaching goal, I'm treating those two as required
before classroom use; the other two (an award that never tells the story
its own hidden-factor design was built for, and a composer that vanishes
off-screen with no cue on the exact classroom device size named in the
brief) are real but more clearly optional polish. Repair the two required
items, re-verify only those paths, ship.

---

## MODERATE (required before classroom use)

### R1 — The market's three governing rules — one offer per day
(revisable/withdrawable until close), how the asking price moves (0/1/2+
offers), and the day-4 "top offer signs regardless of ask" rule — are never
explained anywhere a student can read them, on any surface, at any phase.

**Evidence.** `HOOK_COPY` (`runtime/src/modules/freeAgency.ts:862-863`) says
only *"Eight free agents just hit the open market. You have four days."* —
no mention of one-offer-per-day, price movement, or day 4. Grepping every
student-facing string in `freeAgency.ts` and `runtime/src/client/play/main.ts`
for any explanation of the mechanic (`clears`, `beats the`, `asking price
moves`, `day 4`, `desperation`, etc.) turns up nothing except internal code
comments and the fixed SYNTHESIS/COUNTERFACTUAL copy that only appears
*after* the window has already closed (`freeAgency.ts:1476`, `:1570`). The
PLAY screen (`renderFAPlay`, `play/main.ts:1447-1549`) shows a live ask,
trend arrow, sparkline, and interest badge, and the composer
(`renderFAComposer`, `:1559-1605`) lets a student pick a slot and step a
dollar amount — but nothing on either screen ever states the rule that
governs what happens when the day closes. A student watching an ask rise
after two honest lowballs, or an agent sign for less than the number shown
on day 4, has no in-app way to find out *why* — they can only ask the
teacher, and the design's own reveal/finale banks on students having formed
a real mental model of the market during PLAY to make REVEAL and
COUNTERFACTUAL land.

**Why it matters in class.** CLAUDE.md's own loop is "experience → class
evidence/reveal → student reasoning → teacher formalization" — that's about
formalizing the *economics lesson* after play, not about withholding the
literal button-mechanics of what a click does. The day-4 rule specifically
is strategy-relevant information a rational team needs *before* acting on
day 4 (any offer at all wins, regardless of ask) — without it, day-4
decisions are made blind to the one rule that most changes optimal play
that day. This is worth a short, plain-language rules line on HOOK (where a
market preview already exists) and/or a persistent one-line reminder on the
PLAY screen itself, at a 10-12-year-old reading level, matching how L2's own
HOOK/PLAY screens name their mechanics directly (`STAND_PAT_COPY`,
`VERDICT_LABEL`, etc.).

### R2 — The "live interest count" — the charter's own centerpiece
information-design mechanic — can be faked completely risk-free by
submitting an offer purely to bump the public count, then withdrawing
before the day closes, with zero cost and zero trace.

**Evidence (reproduced directly against the compiled reducer):**
```
after t1 offers, interestCount visible on board: 1
after t1 withdraws, interestCount: 0
t1 team state after close (should be untouched): {"deadCap":0,"signings":[],
  "slots_SCORER":{"playerId":"sc-20", ...unchanged...}}
day1 history offers (t1 offer should NOT appear -- fully retracted): []
```
`doOffer`/`doWithdrawOffer` (`freeAgency.ts:721-751`) impose no cooldown,
cost, or trace on submit-then-withdraw within the same day; `interestCount`
(`freeAgency.ts:1096`, `agentBoardCards`) is recomputed live from
`state.teams`'s *current* `pendingOffer`s on every poll tick (~1s), and a
withdrawn offer leaves no record anywhere, not even in `history`. A team can
toggle its own offer on and off all day to make an agent look more (or,
by never testing at all while others do, relatively less) contested than
it really is, purely to influence rivals who are reading the same public
signal — then retract before any of it becomes binding.

**Why it matters in class.** Charter §2 explicitly frames "price-pump
bluffs" as legitimate strategic texture *because* "offers are binding" —
but an offer is only binding if it's still there at close; toggling it is
free. The interest count is the one number the charter designed
specifically so "the room watches each other" (§2) — a signal that can be
faked at zero risk is a genuine crack in "no exploit... at zero risk," the
first thing item A of the verification brief asks to hunt for. This doesn't
touch the cap or privacy, and a class of 10-12-year-olds may not discover it
organically in one round — but it is real, reproducible every time, and
undermines the specific economic-honesty claim the charter makes about this
mechanic. A cheap repair: keep the withdrawn offer's brief presence
retroactively visible in that day's history (or hold interest count to a
"has ever bid today" high-water mark rather than "currently has a live
offer"), so watching-and-retracting stops being free.

---

## MODERATE (recommended, not required)

### M1 — THE WALK-AWAY award's "worst agent" selection deterministically
and permanently spotlights a cheap value player instead of the charter's
own marquee −7 star shrinker, because raw form dominates the metric.

**Evidence.** `computeAwards`'s worst-agent pick
(`freeAgency.ts:1378`, `const worst = [...AGENTS].sort((a, b) => a.form +
a.playoffFactor - (b.form + b.playoffFactor))[0]!`) ranks every one of the
eight *fixed* agents by `form + playoffFactor`. Computed directly:
```
fa-value-rb  Theo Blackwood  form 62  factor +1  sum 63   <- always "worst"
fa-value-df  Omar Hendricks  form 66  factor  0  sum 66
fa-value-pm  Kai Sorensen    form 70  factor -2  sum 68
fa-solid-sc  Dez Whitfield   form 76  factor +2  sum 78
fa-solid-df  Marcus Dell     form 80  factor -1  sum 79
fa-star-pm   Priya Anand     form 87  factor -7  sum 80   <- the charter's shrinker
fa-solid-rb  Jonah Rourke    form 78  factor +6  sum 84
fa-star-sc   Trey Bishop     form 90  factor +1  sum 91
```
Because content is fixed (not per-session), this ordering is identical in
*every* class, forever: the "worst agent" is always Theo Blackwood, a $15M
value rebounder with a mundane +1 factor, never Priya Anand — the star the
charter specifically built with a −7 hidden factor and its own public hint
("has never played a game that mattered this much") as the module's
headline decision-vs-outcome device (charter §3). THE WALK-AWAY's copy
("turned out to be the coldest name in the market — the best money never
spent") isn't literally false when it lands on Theo — he genuinely is the
worst combined agent — but the award can structurally never tell the
dramatic story its own design built the shrinker for. There is zero test
coverage of this award at all (`grep -i walk.away
src/test/freeAgency.test.ts` → no matches), so this went unverified.

**Why it matters in class.** Not a false-economics failure (item A's
narrow bar), but a real judgment-call miss on exactly the area the builder
flagged for me to probe ("GM Award... algorithm judgment calls") and a
squandered opportunity on the one card most likely to make REVEAL land the
"good process, bad outcome" lesson viscerally. Worth reworking the metric
to weight the *magnitude of the hidden factor* (how much a team's read on
this player was wrong) rather than raw absolute quality, so a team that
nearly signed the shrinker at a premium price is the one being honored for
walking away, not a team that shrugged off a bargain-bin rebounder.

### M2 — IRON BOOKS ("honors stand-pat") never fires when the *entire*
claimed class makes zero signings — a fully charter-anticipated "all-wait"
equilibrium (§2: "all-wait collapses into a fierce day-4 first-price
auction") — even though that is precisely the scenario the award exists to
honor.

**Evidence (reproduced directly against the compiled reducer):** three
teams claim stock franchises, nobody ever offers on anything across all
four days, window closes, reveal runs to completion:
```
windowClosed true
awards: []
```
The gate at `freeAgency.ts:1363`, `if (zeroSigners.length > 0 &&
zeroSigners.length < teams.length)`, excludes this case along with the
one-team dry run the code's own comment justifies ("the sole team in a
one-team dry run trivially has zero signings and the best finish... not a
real achievement"). That rationale doesn't extend to a real multi-team
class where everyone genuinely held the line — the award's entire purpose
— yet the code's actual condition excludes both alike. The client degrades
honestly (`awardsHtml`/board's reveal case: *"Nothing to award this
round"*), so nothing breaks or looks fabricated — and the SYNTHESIS "THE
PATIENCE DIVIDEND" card does separately narrate a fully-quiet window — but
the GM Awards beat itself, a named REVEAL milestone (charter REVEAL k+3),
goes completely empty in the one class-realistic scenario it was built to
recognize.

**Why it matters in class.** Lower stakes than M1 — no false statement, a
graceful fallback exists, and the story isn't actually lost (SYNTHESIS
covers it) — but worth loosening the gate to something like "at least 2
zero-signing teams, or literally everyone" so a real disciplined class
still gets its own IRON BOOKS card.

---

## MINOR

### N1 — At 1024×600 (the classroom Chromebook viewport named in the
verification brief), tapping any market card — including the very first,
most prominent one — opens the offer composer entirely off-screen below the
fold with no visual cue that anything happened.

**Evidence.** Screenshot `chromebook-1024x600-play-viewport-only.png`
(post-click, no scroll) shows no composer anywhere in the visible frame;
the full-page screenshot `chromebook-1024x600-play-composer.png` confirms
the composer rendered correctly, but roughly 1000px below the fold, after
the entire 4-row/8-card market grid. `renderFAPlay`/`renderFAComposer`
(`play/main.ts:1447-1605`) never call `scrollIntoView` or any equivalent —
confirmed via `grep -rn scrollIntoView src/client/play/main.ts` → no
matches. Both L3 e2e scripts use a single 1000×640 viewport
(`scripts/e2e-l3.cjs:218`, `scripts/e2e-l3-early-advance.cjs:135`), so this
had never actually been screenshotted at the shorter, wider Chromebook
shape before this pass, or at L2's own 390×844 phone check.

**Why it matters in class.** Nothing is unreachable — this is ordinary
document scroll, not a hidden or clipped control — so it stays MINOR rather
than a blocker on operability. But on the exact device size the brief
flags, and on the very first card a student is likely to tap (the $50M
star), the composer opening with zero affordance (no scroll, no highlight,
no "see below ↓") reads as "my tap did nothing" to a 10-12-year-old, on a
screen the builder itself already called information-dense. A one-line
`scrollIntoView({behavior:"smooth", block:"nearest"})` on the composer root
would close this cheaply.

### N2 — The teacher aggregate's per-team "acted" label shows the raw
internal agent id (e.g. `fa-value-df`) instead of the agent's name when a
sealed offer is pending.

**Evidence.** `renderFreeAgencyAggregate`, `runtime/src/client/teach/main.ts:577`:
`` `offer: $${t.pendingOffer.amount}M on ${escapeHtml(t.pendingOffer.agentId)}` ``
— `agentId`, not a name lookup. Cosmetic only: the teacher already sees the
friendly name in the separate "Market snapshot" row a few lines above, and
this never reaches a student or the board. Worth a one-line fix
(`AGENTS.find(a => a.id === t.pendingOffer.agentId)?.name`) whenever this
file is next touched.

---

## What I tried that held up (repairs must not re-break these)

- **Cap inviolability & dead-cap arithmetic, including the charter's own
  named edge case.** Beyond the shipped property tests, I built a real
  L1→L2 chain where a team won an L2 sealed bid at $40M on a target whose
  `trueValue` was $30M (a "winner's curse"), carried it into L3, then
  released that exact slot for a new free-agent signing. `deadCap` moved by
  exactly `deadCapFor(40) = 4`, never the wrong `deadCapFor(30) = 3` a
  trueValue-based bug would have produced — confirmed the carried
  occupant's `price` field is genuinely the dollar amount paid, used
  uniformly everywhere (`capUsedOf`, `projectedCapUsedForOffer`,
  `deadCapFor`), never `trueValue`.
- **Day-1 viability**, across every construction the charter names ($100M
  at-cap L1 lock, worst-case dead cap, lost-bid-unrescued open slot, pure
  stock, and a 60-build sweep of real exactly-$100M L1 rosters) — all
  `>= 2` affordable day-1 agents, matching the property tests and confirmed
  by re-reading the test bodies, not just their pass/fail.
- **No dominant strategy found on adversarial review of the actual
  numbers** — all-wait genuinely risks losing agents at the day-4 auction
  (only the single top bid wins each agent that day, regardless of how many
  teams waited), all-rush pays real premium asks, and a lowball can only
  raise price with a second team's cooperation/luck, never alone — matches
  the charter's own "no dominant strategy" claim under real numeric
  pressure-testing, independent of the interest-count exploit above (which
  is about faking a *signal*, not about a guaranteed-profitable play
  sequence).
- **Sealed-offer privacy** — `boardView` never contains `pendingOffer` in
  any phase (confirmed by direct `JSON.stringify` scan, not just the
  shipped assertion); an unsigned agent's per-team amounts never leak to
  another seat's `studentView` or the board, at day-close or afterward; a
  signed agent's full sheet (amount + franchise) *does* correctly go public
  at close; `teacherView` is the one surface with full detail. All matches
  the charter's disclosure rules exactly.
- **JSON round-trip / snapshot survival** — built a real state with a
  claim, an offer, and a closed day; `JSON.parse(JSON.stringify(state))`
  round-trips byte-identical (no `Map`/`Set`/`Date` smuggled into state).
- **Hostile/malformed reducer input** — fuzzed `offer`/`claim`/unknown
  action types with `null`, objects, `NaN`, `Infinity`, string-typed
  amounts, `"<script>"` slot ids, and a `__proto__` agent id directly
  against the compiled reducer: every case rejected cleanly with a sensible
  reason string, nothing thrown, nothing accepted that shouldn't be.
- **Teacher misclick paths.** `btnReveal` is correctly disabled the instant
  `s.phase === "REVEAL"` (`teach/main.ts:184`) — L2's own re-verification
  finding (the same button silently bulk-resolving a same-phase REVEAL
  jump) cannot recur here, since the fix lives in the shared button-state
  logic both lessons use. `btnCloseDay` is gated by `windowClosed` and the
  runtime's existing optimistic-concurrency check
  (`sessionService.ts:432-437`) rejects a genuinely racing double-click
  with a 409 rather than silently double-resolving a day. The `advance`
  warning (`teach/main.ts:621-627`) correctly names the real day/team
  counts and fires specifically whenever PLAY is left with a day still
  open, verified live via `e2e-l3-early-advance.cjs`'s exact warning text.
  `revealNext` spam past the last stage is cleanly rejected
  (`"every reveal stage has already played"`), not silently absorbed.
- **Late joiners mid-window** — exercised for real in `e2e-l3.cjs` (Delta
  claims a stock franchise mid-window, after day 1 has already closed);
  claim correctly stays open through PLAY and correctly closes once REVEAL
  starts (shared phase-gate pattern, same as L2's own M1 repair).
- **D15 frozen-state discipline** — every synthesis/award/counterfactual
  function reads only `state.history` (immutable once written) and the
  fixed `AGENTS` content; `computeAwards`/standings/playoffs are gated to
  render only once every prerequisite reveal stage has actually played
  (`revealViewFor`'s `standingsShown`/`playoffsShown`/`awardsShown` stage
  arithmetic), so nothing can display a factor or an award ahead of its own
  disclosure moment.
- **Reveal/finale arc at class scale** — read `e2e-l3.cjs`'s own real
  session transcript (a bidding war, a genuine price collapse, coordinated
  lowballing that still raises price, a real outbid team, a day-4
  desperation signing) resolve correctly end to end through the staged
  finale to COMPLETE; the bracket is presented as "the standings playing
  out" (statically computed from already-revealed form, never framed as
  suspenseful randomness) exactly as the charter requires; awards omit
  gracefully rather than fabricate in a zero-signing single-team case
  (tested); the module's COMPLETE copy closes the whole three-lesson arc,
  not just L3, on both student and board surfaces (tested,
  `SEAM (L3_CHARTER.md §8)`).
- **The L1/L2 seam** (`tradeDeadline.ts` diff) is exactly what the charter
  authorized: two `private → export` visibility changes
  (`stockFranchiseFor`, `formFor`) with zero behavior change, plus L2's
  COMPLETE copy becoming the L3 tease — nothing else in L1/L2 reopened.

## Commands run this session

```
cd runtime && npm install && npm run build && npm test          # 303/303 passing
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/e2e-l3.cjs               # PASS, 0 console errors
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/e2e-l3-early-advance.cjs # PASS, 0 console errors
```
Plus direct probes against `dist/modules/freeAgency.js` (cap/dead-cap
arithmetic on a released won-target, the interest-count toggle exploit, the
WALK-AWAY worst-agent computation, the all-quiet IRON BOOKS case, JSON
round-trip, hostile reducer input) and a standalone Playwright script
(`probe_viewport.cjs`) driving the real compiled server to screenshot
`/play` at 1024×600 and 390×844 — not committed, available at
`/tmp/claude-0/-home-user-bow-economics-live/83ed0941-bd5b-5823-b4b5-789d77faca7a/scratchpad/`
if a repairer wants to rerun any of them.

---

## RE-VERIFICATION (against commit `24f87d6`)

Targeted re-check only, per founder instruction — the six findings above,
not a full re-run of the original gauntlet. Read `24f87d6`'s diff critically
(all changed files, not just the ones touching my six findings), rebuilt,
ran the full suite and all four e2e scripts, then re-ran my original
scratchpad repros against the repaired build plus new adversarial probes
aimed specifically at each repair's own new surface (`outForDay`,
`withdrawnOffers`, the rewritten `computeAwards`, `scrollIntoView`).
Everything below is evidence from this pass, not carried over from the
first round.

**Build:** `npm run build` — clean.
**Tests:** `npm test` — **312/312 passing** (303 + 9 new: 4 R2 reducer
tests, 5 M1/M2 award tests), matches the commit message and
`runtime/README.md`.
**E2E:** all four scripts green this session — `scripts/e2e-l2.cjs`,
`scripts/e2e-l2-early-advance.cjs` (both unaffected by this commit, zero
console errors, confirming no L1/L2 regression), `scripts/e2e-l3.cjs` (now
at the 1024×600 Chromebook viewport named in my original N1 finding, with a
per-offer bounding-box assertion — see N1 below), `scripts/e2e-l3-early-advance.cjs`
— **PASS**, zero console errors on each.

### R1 (required) — **FIXED**

`MARKET_RULES` (`freeAgency.ts:916-921`) states all four rules in
grade 5-6 language — one offer/day (freely editable), withdrawal ends the
day, the 0/1/2+ ask-movement rule (explicitly naming "even if every single
offer was low," closing the exact gap my original finding named), and the
day-4 carve-out. Wired into both `hookSummaryFor` (HOOK's market preview)
and `playViewFor` (PLAY, beside the composer) as `marketRules`, rendered by
a new `marketRulesHtml` (`play/main.ts:1422-1431`) as a `<details>` panel
in both places — confirmed via source read and via `e2e-l3.cjs`'s own
screenshot `docs/gauntlet/module-1/screens-l3/02-play-hook-market-preview.png`
(regenerated this session). This closes the original gap cleanly: a
student now has an in-app, teacher-independent place to read exactly what
governs the day they're about to act in.

### R2 (required) — **NOT FIXED** — the intended fix only closes one of
two reducer paths that clear a pending offer; the other, `holdDay`, is
untouched and reproduces the identical free interest-count exploit.

The `withdrawOffer` path itself is genuinely and correctly repaired —
re-ran my original repro against it directly:
```
after offer, interest: 1
withdraw ok? true
after withdraw, interest: 0 outForDay: true held: true
re-offer after withdraw ok? false you withdrew from today's market — the
  market saw you go. No new offer until tomorrow.
withdrawnOffers: [{"day":1,"seatId":"t1","agentId":"fa-star-sc", ...}]
teacherView t1 acted: true outForDay: true
```
`outForDay` locks `doOffer` (`freeAgency.ts:754`, checked before any
other validation), resets correctly at day close, and the pacing panel
correctly reads the withdrawn team as acted. Good.

But `doHoldDay` (`freeAgency.ts`, unchanged by this commit — confirmed via
`git diff 90c54dc..24f87d6` touching zero lines of this function) is the
**other** way a team can clear a `pendingOffer` — `{ ...pre.team,
pendingOffer: null, held: true }`, unconditionally, with no `outForDay`
lock and no `withdrawnOffers` record. Re-ran my original pump-and-pivot
repro, substituting `holdDay` for `withdrawOffer` as the retraction step,
directly against the compiled reducer:
```
after t1 offers, interest: 1
holdDay ok? true
after t1 holdDay, interest: 0 outForDay: false pendingOffer: null
re-offer after holdDay ok? true
after re-offer, interest: 1
[... repeated 3 more times, every cycle: interest 1 -> holdDay -> interest
     0, outForDay stays false, a fresh offer is immediately accepted again ...]
withdrawnOffers recorded (should be empty -- holdDay bypasses the record): []
day1 history offers (t1 offer should be absent -- retracted via holdDay): []
```
The team can toggle `offer` → `holdDay` → `offer` → `holdDay` all day,
manipulating the public interest count as many times as it likes, at
literally zero cost — the exact property the repair was written to close.
No test in the 4 new R2 tests exercises `holdDay` after an existing offer
(`grep -n "outForDay\|holdDay" src/test/freeAgency.test.ts` shows the R2
tests only call `withdrawOffer`), so this went unverified by the shipped
suite.

**Mitigating factor, and why this is still real.** The *current* polished
`/play` UI never renders a "Hold" button while a team already has a
pending offer — `renderFAPlay`'s `actedBanner` only wires `#faHoldBtn` in
the branch where `!acted` (`play/main.ts`'s `else` case), so a student
clicking through the real app cannot stumble into this by normal use. But
the ruling for R2 was explicit — *"reducer-enforced, not just UI"* — and
the reducer itself has no such protection: any seat's own device can
`POST /api/sessions/:code/actions` with `{"type":"holdDay"}` directly, at
any time, regardless of what the current client happens to render. This is
not a stranded-state bug (nothing crashes, no permanent lock, days still
progress cleanly) — it's the identical economic-integrity gap from the
original finding, reachable through a second, currently-unguarded action.
**Fix:** apply the same `outForDay`/`withdrawnOffers` treatment in
`doHoldDay` whenever it clears a *non-null* `pendingOffer` (a hold called
with nothing pending should stay free, exactly as today).

### M1 (recommended) — **FIXED**

Re-ran the shrinker-vs-mild-value scenario independently against the
compiled reducer (two teams, one engages the −7 shrinker Priya Anand at
$20M against a $45M ask, the other engages a mild −2 value agent, both
lose, nobody signs anyone):
```
{
  "id": "walk-away",
  "title": "THE WALK-AWAY",
  "franchise": { "name": "Ironworks", ... },
  "agentName": "Priya Anand",
  "body": "Ironworks was in talks for Priya Anand — up to $45M — and never
    signed him. With the finale factor revealed, Priya Anand turned out to
    be a real trap. The best money never spent."
}
```
The shrinker's story now genuinely wins over the milder value agent, and a
withdrawn (not just stood-at-close) engagement correctly still counts
(confirmed via the shipped test and independently by re-deriving
`considerEngagement`'s logic against `freeAgency.ts:1450-1476` by hand).
The fallthrough case (nobody ever engages the shrinker) correctly credits
whichever negative-factor agent someone *did* engage, never the untouched
shrinker — matches the shipped test and my own read of the sort order
(most-negative-factor-first, so an engaged milder agent only wins when the
shrinker was never touched at all). Omits gracefully when nobody engages
any negative-factor agent (unchanged path, still tested). This genuinely
repairs the original finding — THE WALK-AWAY can now tell the story its
own hidden-factor design was built for.

**New, narrower observation (not one of the six, informational only, not
rated).** The `askAtWalk` value used in the copy ("up to $X") is the
agent's *asking price at the time*, not the team's own bid amount — in the
repro above, Ironworks actually bid only $20M (a deep lowball against the
$45M ask), yet the reveal card reads "in talks... up to $45M," which
overstates how close the team really came to signing. The "engaged" bar
itself is also just "made any offer at all," so a token, guaranteed-to-lose
lowball currently qualifies as a full walk-away story on equal footing with
a genuine near-miss. This doesn't misstate anything about the *cap* or
*privacy*, and I'm not rating it as a numbered finding since it wasn't part
of what I was asked to re-check this round — flagging it only so it isn't
lost, worth a look next time this card is touched (e.g. use the team's own
highest bid on that agent, not the ask, and/or require the offer to have
been within some real distance of ask to count as "engagement").

### M2 (recommended) — **FIXED**

Re-ran the all-quiet three-team repro independently (three teams claim,
nobody offers anything across all four days):
```
awards: [{ "id": "iron-books", ...,
  "body": "Ironworks finished #1 without a single signing — and neither did
    anyone else this window. The whole room held its money; these books
    held the line best." }]
```
IRON BOOKS now fires and its copy correctly and honestly acknowledges the
room-wide hold rather than implying a contrast that didn't happen. The
gate is now `zeroSigners.length > 0 && teams.length >= 2`
(`freeAgency.ts:1435`) — confirmed the one-team dry-run case the original
gate's comment actually justified is still excluded (`teams.length >= 2`),
while the class-realistic all-wait case the award exists to honor now
fires. Matches the shipped test.

### N1 (minor) — **FIXED**

`renderFAComposer` now calls `root.scrollIntoView({ behavior: "auto",
block: "nearest" })` on open (`play/main.ts`, confirmed in diff). Rather
than trust the code alone, `scripts/e2e-l3.cjs` was re-run at the
Chromebook-shaped 1024×600 viewport it now uses throughout (was 1000×640),
with `submitOffer`'s new bounding-box assertion firing after every single
one of the script's ~9 real composer opens across all four days — every
one passed (`box.y` on-screen, no `"N1 regression"` throw), which is
stronger evidence than a static code read: the fix was exercised live, in
a real browser, at the exact viewport my original finding used, not just
declared present.

### N2 (minor) — **FIXED**

`renderFreeAgencyAggregate`'s `actedLabel` now looks up the agent's name
from the `agents` array already in the view (`agentNameById`,
`teach/main.ts`), falling back to the raw id only if the lookup somehow
misses. Confirmed via source diff; the teacher's per-team tile now also
distinguishes "withdrew — out for today" from a plain "holding," a small
but genuine pacing-clarity improvement beyond what N2 asked for.

---

## NEW FINDING this round

### MODERATE — R2's fix is bypassable via `doHoldDay`, fully reopening the
original exploit

Already detailed under R2 above; recorded here as the round's one new,
independently-discovered finding, not a restatement of the original.
**Severity MODERATE** — same class as the original R2 (a real,
zero-cost, zero-trace way to fake the market's central public information
signal; not a crash, not a stuck state, not reachable through the current
polished UI's own buttons, but fully reachable at the reducer/API level,
which the ruling itself named as the actual bar to clear). No cap,
dead-cap, or privacy impact; both e2e scripts still pass because neither
drives this specific sequence. Repair by extending `doHoldDay` with the
same `outForDay` treatment `doWithdrawOffer` already has, whenever it
clears a real (non-null) pending offer.

---

## Overall verdict

**ACCEPT WITH REQUIRED REPAIRS** (unchanged framing) — gameplay rating
**STRONG**, one notch more confident than the first pass now that R1, M1,
M2, N1, and N2 are all independently confirmed fixed against my own
original repros, not just the builder's account of them, and 312/312 tests
plus all four e2e scripts are green with zero console errors. R2 is the one
required item still open: the specific submit-then-withdraw sequence I
originally reproduced is genuinely closed, but the equivalent
submit-then-hold sequence reopens the identical exploit, because the fix
patched `doWithdrawOffer` without noticing `doHoldDay` clears a pending
offer through the exact same code path. This is a narrow, single-function
fix (extend `doHoldDay` the same way `doWithdrawOffer` was already
extended) — repair it, re-verify only that path plus a quick regression
pass on M1/M2 (which both now read `withdrawnOffers`/`outForDay`,
so a `doHoldDay` change touches shared state those depend on), and ship.

---

## Post-re-verification repair (build side, not the verifier)

The re-verification's one open required item — R2's `doHoldDay` bypass
(`offer → holdDay → offer` re-opening the zero-cost interest-count fake at
the reducer/API level) — was root-cause fixed exactly along the identified
path: `doHoldDay` with a pending offer now routes through `doWithdrawOffer`
itself, so clearing an offer via hold carries a withdrawal's identical cost
(`outForDay` day lock) and leaves the identical `withdrawnOffers` engagement
record (which is also the correct M1/WALK-AWAY semantics — the team engaged,
then walked). A plain hold with nothing pending stays free. The /play UI
never renders the Hold button while an offer is pending, so no student-facing
behavior changes; the closed path was API-level only.

Regression-tested: a new reducer test reproduces the verifier's exact
sequence and asserts the day lock, the engagement record, the honest
rejection string, and a clean next day. Full suite 313/313; all four e2e
scripts re-run green with zero console errors after the fix.
