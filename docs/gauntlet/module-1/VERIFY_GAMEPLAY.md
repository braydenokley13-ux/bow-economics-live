# Module 1 Lesson 1 "Draft Day" — Gameplay Verification

Fresh-context hands-on playtest of the actual running `m1l1-draft-day` module (not the design
docs). Setup: isolated copy of `runtime/`, built and run on port 4101, driven with Playwright
Chromium (headless) for real UI passes and direct API calls for exploit/edge-case probing. Two
full teacher→COMPLETE playthroughs, one impatient no-instructions pass, and a dedicated exploit
suite. All findings below are reproduced, not inferred from source-reading alone.

## Persona 1 — Genuine Student

**Session 1** (`BOWJ7D`): 3 pairs — star-stack ($60 SCORER + three $10s + $10 WILDCARD, exactly
$100M), balanced ($30/$30/$20/$10/$10, exactly $100M), cheap-flex ($10×4 + $20, $60M, $40M left
on the table). All three locked, went through HOOK→...→COMPLETE cleanly. **Session 2**
(`BOWL36`): 4 pairs given the identical star-stack build, to stress-test the ceiling case.

**What works and feels good:**
- The Roster Wall + Cap Meter + Foregone Panel loop is genuinely satisfying to operate. Tapping a
  card, watching the meter shift and the "Priced out right now" list ripple in real time, is the
  tactile "live ripple" the design doc promised — this is the strongest part of the build.
- The CONSEQUENCE board screen ("THE SHOCK... look at your own wall: that slot is now empty, and
  the salary is back in your pocket") and the SYNTHESIS board screen are well-written, dramatic,
  and — critically — populated with *this session's own numbers*, not canned text. Genuinely good
  spectacle and a real "we all did this together" moment.
- No crashes, no dead ends that couldn't be recovered from, across two full playthroughs and every
  phase transition, including a case where zero rosters were locked at all (graceful "no rosters
  locked yet" synthesis fallback, not a crash).

**Fun failures found (ranked by severity):**

1. **[HIGH] The shock's "consequence" and the ADAPT "repair" are hollow for the most cap-disciplined
   players, and a free upgrade for the least.** Reproduced exactly: any team that spends to (or
   very near) the $100M cap has $0–$10M remaining when the shock removes their weakest slot. Since
   price and rating are strictly monotonic within a position and there is exactly one card per
   price tier, the ADAPT "repair" screen then offers **exactly one candidate — the identical card
   that was just removed.** Both max-spend teams in session 1 (star-stack, balanced) hit this: the
   "candidates" list contained one entry, and clicking it just restores the status quo. Meanwhile
   the cheap-flex team, which had left $40M unspent, saw the shock *free up* their weakest slot's
   $10M on top of that idle $40M and could suddenly afford Hank Volkov ($40M, RTG 87) for a slot
   that used to hold a RTG-56 scrub — a real, uncontested upgrade using money that was "wasted" the
   whole game. **The repair phase's agency is inversely correlated with fiscal discipline** — the
   team that played the game "well" (spent to the line) gets a forced no-op; the team that
   under-optimized gets the most interesting, rewarding choice in the whole session. This directly
   undercuts "did MY earlier choice shape my repair?" for exactly the students who engaged hardest
   with the cap mechanic.
2. **[MED] "OVER THE LINE" fires on fully legal spending, not just violations.** `capStateOf`
   labels 90–100% of cap spent as `"over"` with a red pill reading "OVER THE LINE" — but the
   reducer makes it *impossible* to actually exceed $100M (over-cap placements are hard-rejected).
   So a student who spends every legal dollar to hit exactly $100M sees the same alarming red
   "OVER THE LINE" state as someone who's genuinely mismanaged their budget. Confirmed via
   screenshot at spent=$100M/$100M: red bar, "OVER THE LINE" pill, `$0M left`. For 5th/6th graders,
   this reads as "you broke a rule" when they actually executed the hardest, most optimal build in
   the game.
3. **[MED] The Class Gallery reveal never shows whose bar is whose.** `boardView` structurally
   never receives `seatId` (an intentional, documented runtime-wide privacy guarantee), so the
   REVEAL board is an unlabeled stack of bars — students can't point at the projector and say
   "that's ours." Confirmed the ceiling case directly: session 2's four identical star-stack
   builds rendered as four bit-for-bit identical, indistinguishable bars. In session 1 the two
   $100M "balanced"/"star-stacked" teams were distinguishable only by strategy label — two teams
   with the same label and spend would be as anonymous as session 2's four. This meaningfully
   weakens "would the reveal cause arguing?" — arguing needs ownership, and there is none on
   screen. Kids can eyeball their own spend total and guess, but ties make that unreliable.
4. **[LOW] No true head-to-head scarcity.** Each pair draws from its own uncontested copy of the
   20-card market — verified directly: four teams in session 2 all bought `sc-60` with no
   conflict. There is no "someone else took my guy" tension at all in L1 (by design, per the
   module's own doc comments — L1 is explicitly single-player budget optimization, contention is
   reserved for L3). Worth flagging only because it caps how much "social energy" the PLAY phase
   itself can generate; all of the social energy has to come from the REVEAL comparison, which
   finding 3 already weakens.
5. **[LOW] Post-repair, the roster wall doesn't reappear.** After a successful `adaptFill`, ADAPT
   shows only a plain text banner ("Repaired. Your REBOUNDER slot is filled again.") — no card
   art, no wall. The one moment that should feel like the visual payoff of a hard choice (or the
   upgrade in finding 1) is rendered as inert text, in a game whose entire identity is the visual
   Roster Wall.

**Replay-value verdict:** Genuine, but narrower than the design implies. The three broad
archetypes (star-stack / balanced / cheap-flex) do feel different to *play* — the tension of
almost-but-not-quite affording the next tier is real and reproducible with any strategy. But the
back half (shock → repair → reveal) converges hard: the shock deterministically targets the
market's single worst card (`rb-10`, "Dario Silva," RTG 56 — the global floor) and any team that
used a $10-tier filler anywhere is a lock to be hit there, which is *most* teams in a real class,
since cheap fillers are the natural move once the budget gets tight. A second run with a
meaningfully different strategy is worth doing once; the class-facing payoff (gallery, synthesis
cards) will look similar run to run because it's templated on aggregate stats, not on anything
strategy-specific enough to feel new.

## Persona 2 — Impatient Student

Joined via `/play` with zero reading, then rapid-clicked 10 market cards blind, double-tapped the
same card back-to-back, spammed the disabled lock button 5×, and triple-clicked the same "remove"
link.

- **The interface is discoverable without instructions.** Card name/position/price/rating are all
  visible on every card; empty slots show a `+` and, crucially, pre-populate 2–3 affordable
  suggestion chips *before the student has placed anything* — an impatient kid can tap their way to
  a filled roster with no explanation at all. This is a real strength.
- **Rapid random tapping produced a dead end with no rescue.** Confirmed by screenshot: 5 fast,
  unplanned clicks (`sc-60`, `sc-40`→rejected unaffordable, `pm-10`→WILDCARD auto-route no wait,
  effectively landed on SCORER/PLAYMAKER/WILDCARD filled) left the roster at 3/5 filled, $100M/
  $100M spent, DEFENDER and REBOUNDER empty, and **every single remaining market card grayed out
  as unaffordable.** The one feature designed to rescue a stuck student — the guided-narrow
  suggestion chips on empty slots — goes silent exactly when it's needed most: `candidatesFor`
  returns nothing at $0 remaining, so no chips render on the two empty slots. The only way out
  (remove a placed card) is a small text link under the placed cards, not surfaced or suggested
  anywhere. The lock button correctly stays disabled, so nothing breaks — but a genuinely
  impatient player could sit confused here for real classroom minutes.
- **Double-tap and remove-spam were both handled safely.** Rapid duplicate submissions produced
  one clean effect plus a friendly rejection ("that slot is already empty") for the redundant taps
  — no double-refund, no state corruption, no crash.
- **Duplicate join from a second tab with the same name is blocked with a clear, friendly error**
  ("that name is already in this session — use the rejoin PIN if this is you") shown right on the
  join form — good, would not confuse a kid who opened two tabs by accident.

**Impatient-student verdict:** Can figure out what to do from the interface alone — yes. Can get
stuck in a way the game doesn't proactively rescue them from — also yes, and it's an easy accident
to have with normal kid behavior (grab cheap fillers fast, run the meter to zero), not an edge case
requiring malice.

## Persona 3 — Exploit Hunter

Ran a dedicated suite directly against the API (join, actions, control) alongside the UI passes.

| Test | Result |
|---|---|
| Same name joins twice | Blocked, `409 name_taken`, clean message |
| Action submitted while phase = LOBBY | Blocked, `409`, correct reason string |
| Wrong-position placement (`pm-60` → `SCORER` slot) | Blocked, `409` |
| Over-cap placement (would exceed $100M) | Blocked, `409`, exact overage shown |
| `lock` with < 5 slots filled | Blocked, `409` |
| `adaptFill` outside ADAPT | Blocked, `409` |
| `teacher:shock` outside CONSEQUENCE | Blocked, `400 hook_rejected` |
| Two identical `place` requests fired simultaneously (race) | Second request cleanly rejected ("slot is occupied") — no double-charge, optimistic concurrency held |
| Actions while `paused` | Blocked, `423 paused` |
| Actions while `frozen` | Blocked, `423 frozen` |
| `restore` after freeze mid-build | Reverted cleanly to last checkpoint, no data loss, no duplication |
| Late join mid-PLAY | Works, gets a fresh $100M/5-slot view; if the teacher advances immediately after, that team simply never builds anything and rides through CONSEQUENCE/ADAPT/SYNTHESIS as an inert bystander — no crash, but no content for them either |
| Never locking, then riding through every remaining phase | No crash; consistent "wasn't hit — you never locked a full wall" / "nothing to repair" messaging throughout |
| Six sessions running concurrently on one server | No cross-session bleed observed in any view |

**No exploit broke the runtime or let a student cheat the cap, double-spend, or act out of
phase — the server-side gate (not just the UI) enforces everything, confirmed by hitting it
directly with curl while bypassing the UI entirely.** This is a genuinely solid, well-engineered
backend.

**The real "exploit," found and reproduced (severity: HIGH — same finding as Persona 1 #1,
restated from the adversarial angle):** the shock is not random and not hard to reverse-engineer.
`weakestSlotOf` always targets the roster's lowest-rated card, and because price and rating are
monotonic per position, **that's always your cheapest card.** A player who reads the market once
can deliberately "sacrifice" a slot they don't care about (buy its absolute cheapest option on
purpose) knowing exactly what the shock will take — and can further engineer a build that leaves
slack specifically so that slot's repair becomes a guaranteed upgrade (see Persona 1 #1: a
`$60/$10/$10/$10/$10` build, or looser, virtually guarantees `rb-10` — the single worst card in
the entire 20-card market — gets sacrificed and can come back as a much better card). There's no
dominant *initial* roster (the market is well-tuned — best value genuinely shifts by tier, no
free-lunch full build exists at lock time), but there is a dominant **shock-response** pattern:
deliberately underspend by leaving one cheap slot's worth of headroom, and treat the shock as a
free reroll instead of a setback.

**Session-2 stress test (4 identical star-stack teams):** confirms this at scale — all four hit
`REBOUNDER` (`rb-10`, RTG 56, the market's global floor), all four ended with `remaining: $10`, and
all four ADAPT views would show exactly one candidate. A homogeneous class converging on the
"obvious good" build turns the class-wide shock/repair beat into the same forced click, four (or
thirty) times over, with zero variation to argue about.

## Fix Priority (for the top-3 list below)

1. Give the ADAPT repair phase a real choice even at $0 headroom — e.g., a fixed small stipend on
   top of the freed salary, or a 2-way pick (safe reprise vs. a worse-but-different option) so
   max-spenders aren't reduced to a single forced click.
2. Re-thread team/pair display names through to `boardView` (or add an opt-in identifier) so the
   Class Gallery reveal is ownable, not anonymous — this is the single biggest lever on "would kids
   argue about it."
3. Retune `capStateOf` so 90–100% (a fully legal, optimal spend) doesn't render as "OVER THE LINE"
   — reserve that label and color for an actual violation, or relabel the top zone something like
   "AT THE LINE."
4. Surface a rescue affordance (a highlighted "free up room" prompt, or the "remove" action itself
   surfaced more prominently) the moment a student is 100%-spent with unfilled slots — the exact
   moment the guided-narrow suggestions currently go silent.
