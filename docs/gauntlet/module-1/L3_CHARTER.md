# L3 Charter — "Free Agency: The Signing Window" (`m1l3-free-agency`)

CEO charter, issued under a direct founder instruction this session that
supersedes D13's L3 ruling (head-to-head draft, "Why the Line Exists") and the
L2→L3 clean-reset posture. L3 is refounded as **compete in a market under
constraint**, closing the module arc:

- L1: *I cannot have everything.*
- L2: *My previous decisions constrain what I can do now.*
- L3: *Everyone else faces constraints too, and their choices change my
  opportunities.*

The old L3's institutional content ("why does the league even have these
rules?") is absorbed, not discarded: the cap-rise institution, the deadline
rules, and a SYNTHESIS beat carry it. The head-to-head draft design remains in
PLAYABILITY_SPEC.md as unbuilt history.

This is also the **module finale**: it must end Module 1, not merely end free
agency.

---

## 1. Fiction and frame

The season's stretch run. The league's new TV deal kicks in and **the salary
cap rises from $100M to $130M** — every front office suddenly has room, but
your books arrive exactly as L1/L2 left them: every signing, every dollar of
dead cap. Eight free agents hit the open market. The signing window is four
days. When it closes, the playoff push begins, and the final standings are set
by the roster you finish with.

Why the cap rise (product reasons, in priority order):
1. **Viability for every team.** L2-carried cap-used is provably ≤ $100M, so
   every franchise enters with $30M–$80M of room. Path dependence is fully
   preserved (cleaner books = more room) while nobody is locked out of the
   market.
2. **It is itself economics** — institutions adjust; a rising cap is real
   NBA/NFL life, and "whose books were cleanest when the new money arrived?"
   is a finale-grade path-dependence question.
3. It puts free-agent prices ($15M–$50M) in meaningful tension with room.

## 2. Signature mechanic — the market day loop

All inside the single PLAY phase (the runtime's phase list is forward-only; a
day is a module-internal counter, not a phase). Four days, each closed by a
payload-free teacher hook (`teacher:closeDay`), per the established
`teacher:<hook>` mechanism.

**Each day, each team submits at most ONE binding offer, or holds.**
- An offer = `{agentId, amount, slot}`: which free agent, how much ($5M steps,
  ≥ $5M), and which roster slot they'd take. Revisable/withdrawable until the
  day closes; sealed from other teams while the day is open.
- Slot rules: position must match the slot (WILDCARD accepts any position). An
  L2-inherited open slot fills free; a filled slot means the incumbent is
  **released on signing** with the standing ~10% dead-cap bite (D11 rider a —
  undo still isn't free, in every lesson).
- Affordability is checked at submit (and re-checked at resolution) the same
  way every other module checks it: post-signing cap-used ≤ $130M. Losing
  offers cost nothing but the day.
- **Hold is an explicit one-tap action** (`holdDay`) so the teacher's pacing
  panel can see "everyone has acted" without waiting on a team that's
  deliberately waiting on the market.

**Day close resolves every agent simultaneously, deterministically:**
- Top offer on an agent (ties: earliest submitted, then seat id) **signs if it
  meets or beats the agent's current public asking price** — at the offer
  amount (you pay what you bid; bidding above ask is insurance against
  rivals).
- Otherwise the agent goes unsigned and their **asking price moves by
  demand**: 0 offers → −$10M ("his phone isn't ringing"); 1 offer → −$5M;
  2+ offers → **+$5M** ("bidding war brewing — his camp smells money"). Floor
  $10M. Coordinated lowballing *raises* the price: waiting is a bet, not a
  free lunch.
- **Day 4 is deadline day:** the top offer signs even below asking
  (desperation) — an agent with zero day-4 offers goes unsigned for good.

**Information design (what makes the room watch each other):**
- While a day is open, the board shows each agent's **live interest count**
  (how many teams currently have an offer in — count only, no names, no
  amounts) plus asking price, trend arrow, and price history.
- At day close, a **signed** agent's full offer sheet goes public,
  franchise-named — the room learns real rival valuations only through
  consummated deals. An **unsigned** agent reveals only the offer count and
  the price move; sealed amounts stay sealed (full history is disclosed in the
  finale, where it becomes counterfactual material).
- Every franchise's **cap room is public** on the board (real leagues publish
  cap space; rivals' buying power is strategy fuel).
- A live **playoff picture** (rank by current team form, top-4 playoff line)
  runs all lesson — the win-now frame that gives spending urgency.

Strategic texture this produces (verify all of it survives build): preempt at
a premium vs. wait for the price to fall vs. get sniped; overbid-as-insurance
(winner's curse round 2); lowballs that keep a price up; price-pump bluffs
that are genuinely risky because offers are binding; walking away as a real,
honored strategy. No dominant strategy: all-wait collapses into a fierce
day-4 first-price auction; all-rush pays the premium asks.

## 3. Content — the free-agent class (fixed, deterministic, like L2's TARGETS)

Eight agents, two per position; fewer stars than teams that want them.
- **2 stars** — form ~90/~87, opening asks $50M/$45M (agents open ambitious;
  day-1 buying is a premium).
- **3 solid** — form ~80/78/76, asks $35/$30/$30.
- **3 value** — form ~70/66/62, asks $20/$15/$15.

Each agent carries a **hidden playoff factor** revealed only in the finale —
the module's decision-vs-outcome luck layer, attached (as in L1's shock and
L2's value bands) to the thing you just committed to. Most factors are −2..+2;
exactly one **riser** (+6, a solid-tier agent, public hint: "two deep playoff
runs on the résumé") and exactly one **shrinker** (−7, a star, public hint:
"has never played a game that mattered this much"). Hints are honest public
flavor: information, not a lottery. Factors of unsigned agents are revealed
too (walk-away verdicts need them). Carried players have no hidden factor —
by the stretch run they're known quantities; the uncertainty premium lives on
new commitments.

## 4. Continuity — the seed

`sourceSessionId` seed, preferred `m1l2-trade-deadline`, fallback
`m1l1-draft-day`, else stock — so L3 runs in every configuration (full arc,
L1-only class, standalone dry-run).

- **From L2:** carry each claimed team's final roster (including veterans,
  rescues, and won targets at their actual bid price), carried **dead cap**,
  and a journey snapshot (L1 spend, L2 path + outcome, L2 dead cap) for the
  finale's franchise recaps. A lost-bid-never-rescued team carries its real
  open slot — free agency is its redemption arc (an open slot fills with no
  release cost).
- **From L1:** reuse `extractCarriedFranchises` (exported by tradeDeadline);
  zero dead cap; journey snapshot notes "no deadline played."
- **Stock:** the L2 stock roster shape, $90M spend, $0 dead cap, honestly
  labeled expansion franchise.

All carried facts are **snapshotted at extraction** into a self-contained
shape ({playerId, name, position, price-as-paid, form, formTag, story line} +
dead cap + journey) — frozen per D15, never re-derived from live state.

**Form ratings** (the strength currency): MARKET players use L2's own
midseason formula (rating + bust/gem delta — a slumping L2 player is still
slumping in L3); veterans/rescues use their fixed rating, steady; a won L2
TARGET maps its dollar `trueValue` into rating space explicitly and
documentedly — default rule `form = 50 + round(30 × (trueValue − floor) /
(ceiling − floor))` — preserving the L2 story (steal → strong, curse →
mediocre) without ever silently conflating dollars and ratings (L2's N1
lesson). Team form = mean of five slots; an empty slot contributes 0 (holes
genuinely hurt).

## 5. Phases

`LOBBY, HOOK, PLAY, REVEAL, COUNTERFACTUAL, SYNTHESIS, COMPLETE` (ordered
subsequence ✓).

- **HOOK** — claim your franchise (carried by name/crest, or expansion);
  see your cap sheet under the new $130M line (dead cap as an explicit,
  labeled line item), your form report, the playoff picture, and a **market
  preview** of all eight agents. Teams plan before the window opens. Late
  joiners can claim through PLAY (L2's M1 repair, kept).
- **PLAY** — the four-day signing window (§2).
- **REVEAL — "The Playoff Push"** — teacher-staged finale theater
  (`teacher:revealNext`, payload-free, manual-first per the standing reveal
  rule): (1) window recap (biggest contract, total spent, steepest price
  fall); (2..k) playoff-factor reveals, one per signed agent, franchise-named
  cheer/groan beats, then unsigned agents' factors; (k+1) final standings +
  the four playoff teams; (k+2) staged semifinals and final — deterministic
  (higher final form advances; ties: more cap room remaining, then name) —
  presented as the standings playing out, never as fake randomness; (k+3)
  **GM Awards**, computed from actual market history, every one
  franchise-named with its story line: THE BARGAIN (best value vs. final
  worth), THE WALK-AWAY (best money *not* spent — lowballed/held/lost on the
  agent who under-delivered), PERFECT TIMING (signed furthest below opening
  ask), IRON BOOKS (best finish with zero signings — honors stand-pat), plus
  builder-judgment extras if computable and story-rich. Awards omit
  gracefully when nobody qualifies — never fabricated. These are one-off
  in-fiction reveal cards (the class reveal *is* the reward system), not a
  progression layer; D4 stands.
- **COUNTERFACTUAL** — franchise journeys + what-ifs. Student device: your
  three-lesson timeline (L1 spend → L2 decision → L3 window → final result)
  plus at most two personal counterfactuals, computed deterministically
  (e.g., "if your $30M day-2 offer had won, you'd have finished 3rd";
  "you passed at $25M ask — he signed for $15M two days later"). Board:
  class-level counterfactuals (the patience dividend — what day-1 asks would
  have cost the room vs. what it actually paid; the near-miss on the riser;
  the dead-cap drag — "the room carried $XM into this window that bought
  nobody anything") plus rotating debate prompts (the ARGUE content, folded
  in): "Was waiting smart, or lucky?" "Which team made the best decision that
  got the worst result?"
- **SYNTHESIS** — economics cards computed from frozen aggregates: THE MARKET
  SET THE PRICE (one agent's price walked $X across four days, moved only by
  the room's own offers); OTHER PEOPLE ARE YOUR CONSTRAINT (plans that died
  because a rival signed first; 2 stars, N teams chasing); TIMING IS A PRICE
  (early premium vs. late discount vs. the K teams that waited and lost the
  player); PATH DEPENDENCE, MODULE EDITION (room entering L3 grouped by L1
  at-cap vs. leftover and by dead-cap carriers vs. clean books — "no decision
  in this module ever stopped mattering"); DECISIONS ≠ OUTCOMES (honest,
  computed: where the factor luck landed vs. where the best process was).
  Beyond-sports line: every market you'll ever enter — housing, tickets, job
  offers — is other people, also constrained, changing your prices. Exit
  prompt: "When did someone else's choice change what you could do — and when
  did yours change theirs?"
- **COMPLETE** — module close. Copy closes the whole arc, not just L3.

Suggested pacing (teacher-controlled throughout): HOOK ~8, window ~20–24
(4 days × ~4–5 + close beats), REVEAL ~10, COUNTERFACTUAL ~5, SYNTHESIS ~7.

## 6. Reliability riders (bind the build)

a. **`onPhaseExit`**: leaving PLAY auto-closes the current day with the exact
   same resolution math as `closeDay` (remaining days simply never happen);
   leaving REVEAL auto-completes all remaining reveal stages. No reachable
   post-phase state may depend on a click that never came (L2's B1 lesson).
b. All resolution deterministic; tiebreaks by `ctx.now` commit order then
   seat id; no `Math.random`, no wall-clock reads outside `ctx.now`.
c. **Cap inviolability property test**: brute-force reachable
   offer/release/sign sequences proving cap-used ≤ $130M everywhere, dead-cap
   arithmetic exact.
d. **Viability property test**: for every valid carried franchise reachable
   from L2 (drive the extremes: $100M L1 lock, worst-case L2 dead cap, lost
   bid unrescued), on day 1 the team can afford ≥ 2 free agents via some
   legal move. Prove by construction + test, the way L2's rescue guarantee
   was proven.
e. Sealed offers: own studentView and teacherView only; never board, never
   another seat, until the close-time disclosure rules in §2.
f. Teacher view: full market state including sealed offers, per-team
   acted/held/pending status for pacing, pending-count context on the
   close-day control. A close with zero offers is legal (the market just
   moves). Misclicks must be non-catastrophic.
g. e2e Playwright proofs: (1) full-chain L1→L2→L3 (play L1 and L2 for real
   through the API, link L3, claim, four days incl. a bidding war, a price
   collapse, a day-4 desperation signing, staged finale through COMPLETE,
   zero console errors); (2) early-advance (teacher leaves PLAY on day 2).
h. Copy at grade 5–6 reading level; fictional franchise/agent names only;
   visual register per design/VISUAL_IDENTITY.md — the board is a live
   market ticker and must feel like one, on information design, not
   cosmetic animation.
i. Fixed 8-agent class regardless of class size; README teacher note that
   the market is tuned for 6+ teams (smaller works, prices just fall
   faster).

## 7. Explicit non-goals

No student↔student direct negotiation/trades (M4 owns negotiation, D2). No
multi-year contracts. No XP/badges/leaderboard layers (D4). No new runtime
surface: the module must fit the existing `LessonModule` contract, seed
mechanism, and payload-free teacher hooks exactly as L2 did.

## 8. L1/L2 seam work authorized in this build

- L2 COMPLETE copy (student + board banner) becomes the L3 tease: the books —
  every signing, every dead-cap dollar — follow you into the playoff push;
  free agency opens next class. (D11 rider f, now pointing at the real L3.)
- /teach create-session flow gains m1l3 with a "link to a completed Trade
  Deadline (or Draft Day) session" source picker, same pattern as L2's.
- Nothing else in L1/L2 reopens unless verification finds something material.
