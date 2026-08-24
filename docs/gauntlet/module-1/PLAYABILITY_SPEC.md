# Module 1 "The Cap" — Playability Spec

Audits Design C (docs/gauntlet/module-1/DESIGN_C_FIRSTPRINCIPLES.md) — the D11 gauntlet winner —
against the founder's food-truck/no-decision-screens philosophy. Binding D11 riders (dead-cap
~10%, pairs-on-one-device default, fictional names + fairness framing for L3, manual teacher
fallback on every synchronized reveal, $100M/$10M-steps/five-slots scale, explicit L2→L3
transition copy) are honored throughout; none is overridden.

**The one object that carries the module.** All three lessons operate the same physical
metaphor — a **Roster Wall**: five labeled slots (Scorer/Playmaker/Defender/Rebounder/Wildcard)
that a student fills, empties, and refills by hand against a live **Cap Meter**, right up until
lock. L1 builds it from nothing. L2 tears a hole in it and makes the student repair it under a
worse deal than the one they started with. L3 puts two walls side by side and makes a student
watch a rival fill theirs faster, with more, in real time. Same object, three different verbs.

---

## Distinctness Matrix

| Axis | L1 — Draft Day | L2 — Trade Deadline | L3 — Why the Line Exists |
|---|---|---|---|
| Primary verb | Construct | Repair / pursue | Race / claim |
| Pacing | Steady, self-paced (18m) | Interrupted, then held for a synchronized drop | Bursty, turn-clocked |
| Info structure | Full price list, always visible | Own price known; rival's bid hidden until reveal | Shared pool visibly shrinking; rival's next pick unknown |
| Physical interaction | Drag/tap onto wall, freely swap pre-lock | Drag off (cut) → slider (bid) | Alternating tap-to-claim, shared device |
| Uncertainty | None (deliberate) | Real: hidden rival number + floor/ceiling resolve | Real: will your target survive to your turn |
| Consequence type | Personal opportunity cost (what you can't afford) | Committed-cost + win/lose bid | Zero-sum: a claimed player is gone for both sides |
| Social structure | Pair-internal negotiation, no cross-team contact | Pair-internal, room-synchronized reveal only | Head-to-head vs. a live rival pair |

---

## L1 — "Draft Day: Nobody Gets Everything"

**(a) Play fantasy.** "I'm the GM of a brand-new team, and I only get to build it once."

**(b) Core activity.** Students physically populate the **Roster Wall** (5 slots) from the
**Player Market** (~16 cards, $10–60M, position-tagged) by placing and — critically — *removing
and re-placing* cards until lock. Nothing is a one-shot pick: every placement is provisional. A
live **Cap Meter** bar shrinks with each placement and grows when a card comes back off the wall.
Beside the market, a persistent **Foregone Panel** lists, updating in real time, which currently-
unaffordable cards just moved out of reach — not a summary shown once at the end, but something
glanced at *while* still building, so it presses on the next decision instead of narrating the
last one.

**(c) Core loop.** SCAN the market → PLACE a card → WATCH the meter drop and the Foregone Panel
ripple → REBALANCE (pull a card back off, watch both reverse) → repeat until the wall feels right
→ LOCK → COMPARE against the Class Gallery. The fun beat: the *live ripple* — placing one
expensive card and visibly watching a swath of the market go dark is instant, tactile feedback,
not a report card.

**(d) Decision-screen audit.**
- *Risk:* "click a player, see the meter drop" as a linear one-at-a-time purchase reads as
  choose→consequence→continue if placements are final on click. **Fix:** every placement stays
  reversible pre-lock — the wall is edited, not filled in one pass — turning the whole 18 minutes
  into continuous construction/optimization rather than five sequential picks.
- *Risk:* the "priced yourself out" list, if shown only once at lock-in, is a bolted-on
  consequence screen. **Fix:** the Foregone Panel is live and ambient throughout play (above),
  so the opportunity-cost information is something a student reacts to mid-build, not reads
  afterward.
- *Prosecution C-2 (rookie-minimum escape hatch skips the decision it protects):* replace the
  one-click auto-fill with a **guided narrow** — the system pulses the 2–3 candidates that slot
  can still afford and waits for the student's own tap. Unsticks a frozen student without making
  the choice for them; still visible to the teacher when triggered, per Design C's own mitigation.

**(f) Classroom loop map (45m).**
| Stage | Min | Content |
|---|---|---|
| 1 Enter/hook | 4 | "$100M, five slots, you can't afford everyone" + one live demo placement. |
| 2 Play | 18 | Build the wall; pairs negotiate; live meter + Foregone Panel. |
| 3 Class reveal | 4 | Lock triggers the Class Gallery (spend-by-position bars). "What do you notice?" |
| 4 Consequence/new info | 2 | "This exact roster is now yours — it comes back next class." (persistence framing) |
| 5 Adapt | 2 | Paired verbal note: "if you could change one thing, what?" (no rebuild — previews L2) |
| 6 Counterfactual | 4 | Individual Foregone Panel debrief: "what did you actually give up?" |
| 7 Reveal + argument | 5 | Cold-call 2–3 pairs to defend why they spent where they spent. |
| 8 **Economics Synthesis** | 6 | Projector: "Same $100M, same market — every different wall is a different set of things you gave up. That's scarcity and opportunity cost, not luck." Beyond sports: a grocery budget, a school field-trip fund, an allowance. Exit prompt: "what did your team give up, and would you do it again?" |

**(g) Concept ledger seed.**
- *Primary:* scarcity, opportunity cost. *Secondary:* constrained allocation, tradeoffs among
  substitutes.
- *Experienced moment:* placing a card and watching the Foregone Panel light up with what just
  became unreachable.
- *Class evidence:* Gallery of divergent spend-by-position bars from an identical $100M/5-slot
  start.
- *Formalization line:* "You all had the exact same $100M and the exact same market. Every
  different wall on this screen is a different set of things you gave up to get what you got."
- *Beyond sports:* fixed budgets force tradeoffs everywhere — allowance, a family grocery bill, a
  school's trip fund.

**(h) Minimum assets.** *Must-have:* Roster Wall graphic (5 labeled slots), ~16 player cards
(name/position/price), live Cap Meter, greyed/locked card state, Foregone Panel, Class Gallery
view. *Polish:* card art beyond silhouette, placement snap animation/sound, fictional team-name
picker.

**(i) Cheapest faithful design.** Fully client-side, deterministic, no simulation engine — already
the cheapest lesson in the portfolio (Classroom Judgment). Tap-to-place/tap-to-remove is
sufficient; drag-and-drop is a nicety, not load-bearing. The wall + meter + Foregone Panel is one
reusable component this whole module depends on.

---

## L2 — "The Trade Deadline: Undo Isn't Free"

**(a) Play fantasy.** "My season just got wrecked and I have to fix my own team, fast, without
knowing what the other GM I'm bidding against is willing to pay."

**(b) Core activity.** The same Roster Wall returns, now with one slot forcibly marked **OUT**
(injury/poach, computed off the student's own weakest-suited L1 pick — Graft #4, attributable not
random — and fired **staggered** per pair as each opens the lesson, Graft #5, so no room-wide
freeze). Dragging that player off the wall triggers the **dead-cap bite**: a visible tear that
returns only ~90% of their salary to the meter (D11 rider a), so "undo" is shown, mechanically,
costing something. The freed slot then offers two real paths: grab the **fixed-price Veteran**
(safe, one tap, guaranteed) or pursue the **risky Prospect** by setting an **Offer Slider** — a
continuous bid, in the same $10M steps as the market — against a **Hidden Rival Indicator** they
cannot see (Graft #3). The prospect's true value sits somewhere in a stated floor–ceiling range
that resolves only after the bid is won.

**(c) Core loop.** DISCOVER the disruption → CUT (watch the bite) → CHOOSE: safe tap or risky
pursuit → if pursuing: SET the offer, SUBMIT (sealed) → WAIT with the room → SYNCHRONIZED REVEAL
(win/lose the bid, floor or ceiling lands) → COMPARE via the Class Scatter. The fun beat: the
shared reveal — a room finding out together whether its gambles paid off (tension, spectacle,
consequence).

**(d) Decision-screen audit.**
- *Risk (the design's own flagged flaw, C-1 in PROSECUTION.md):* "cut, then pick floor/ceiling
  card A or B" is two menu-picks in sequence — the clearest decision-screen residue in Design C.
  **Fix:** the dead-cap bite (already required by rider a) makes the cut itself cost something
  visible, and the card-pick becomes a continuous, uncertain **bid** against a hidden rival
  rather than a label choice — the student is pricing a resource under real uncertainty, not
  selecting a name.
- *Judgment call, not a flaw:* the Veteran stays a single clean tap on purpose. Manufacturing
  fake interactivity around the "boring but guaranteed" option would blur the real tradeoff this
  lesson teaches — certainty-with-one-tap versus upside-with-risk-and-effort is itself the
  economics, not a gap to be papered over.
- *Classroom Judgment's "thin 2-minute lock window" critique:* widened below to a 5-minute
  adapt-then-lock sequence.

**(f) Classroom loop map (45m).**
| Stage | Min | Content |
|---|---|---|
| 1 Enter/hook | 3 | Reconnect with L1's gallery; drop the shared twist in one line. |
| 2 Play | 16 | Staggered disruption fires; cut (bite); choose Veteran or set up the Prospect bid. |
| 3 Class reveal | 2 | Quick show-of-hands poll: who's going safe, who's going risky? |
| 4 Consequence/new info | 2 | "Offers are sealed — nobody can see the other side's number." |
| 5 Adapt | 3 | Last chance to revise the cut or the offer before hard lock. |
| 6 Counterfactual | 2 | Anticipatory gut-check just before lock: "what's your worst case here?" (floor re-read) |
| 7 Reveal + argument | 12 | **The synchronized reveal** (manual teacher-trigger fallback, D11 rider d) + Class Scatter populates live + debrief: who played safe, who risked it, was risky *right*? |
| 8 **Economics Synthesis** | 7 | "Cutting didn't give you all your money back — some of it disappeared just from changing your mind. That's a real cost of revising a commitment. And nobody could see the other bidder's number — that's every real negotiation." Beyond sports: breaking a phone contract early, bidding on a used car or a house. Exit prompt: "what did undoing your L1 choice actually cost you?" |

**(g) Concept ledger seed.**
- *Primary:* cost of revising a commitment (dead cap), pricing under hidden information (bid vs.
  rival). *Secondary:* risk tolerance (floor/ceiling), expected-value intuition.
- *Experienced moment:* the torn-contract bite shrinking the freed money below the cut player's
  full salary; setting a bid not knowing the rival's number.
- *Class evidence:* Scatter of safe-vs-risky picks against real outcomes — real disagreement, no
  dominant strategy.
- *Formalization line:* see synthesis above.
- *Beyond sports:* non-refundable purchases, early contract exits, any negotiation where you
  never see the other side's number before you commit.

**(h) Minimum assets.** *Must-have:* Roster Wall reused with an "OUT" slot marker, dead-cap bite
animation, Offer Slider with live readout, Hidden Rival Indicator ("?" bar), floor–ceiling range
bar, synchronized Reveal screen, Class Scatter board. *Polish:* reveal tension sting, odds-bar
fill animation.

**(i) Cheapest faithful design.** The hidden rival number is precomputed per-student
(attributable, not `Math.random()`) at the same moment the disruption fires — no live opponent,
no new simulation engine. The reveal is a facilitator-triggered animation gate over numbers
already resolved at submit time, exactly the bow-decision-challenges pattern (resolve
deterministically on decision, gate the *reveal* of it) — cheap and matches D11 rider (d)
directly.

---

## L3 — "Why the Line Exists"

**(a) Play fantasy.** "I'm drafting against a rival GM, live, from the same shrinking pool of
players — and whether that's a fair fight depends on a rule neither of us wrote."

**(b) Core activity — refounded.** Design C's L3 reuses the L1 build screen with a different
number, which Classroom Judgment praised for feasibility but which is exactly the pattern the
founder philosophy rules out ("roster builder with another rule"). Redesign: two **Draft Boards**
sit side by side, one per rival GM (No-Cap: Big-Market vs. Small-Market fictional teams; Cap:
identical $100M vs. $100M), sharing one physical device per matchup (extends, rather than
breaks, the pairs-on-one-device default). Both draft in **alternating turns** (fair, randomized
first pick) from one shared, shrinking **Draft Pool** (~12 cards, two of each position tag) until
both boards fill. Watching a rival's board fill with $50–60M stars while yours can only reach
$10–30M is the module's most direct, most visceral evidence for the cap's existence — felt during
play, not read off a chart afterward.

**(c) Core loop.** LEARN your condition (rule + market tag) → alternate TURNS claiming from the
live shared pool, watching the rival board fill next to yours → LOCK when full → SUBMIT to the
class aggregate → REVEAL the combined chart → RANK/DEFEND. Fun beat: the live "sniped!" tension of
watching a rival take a card you wanted right in front of you — and, for the Cap group, the
anticlimax of it not mattering. Sources: strategy, tension, discovery, spectacle.

**(d) Decision-screen audit.**
- *Fixed, not a new flaw:* the build-under-a-rule mechanic itself already isolates one variable
  cleanly (Prosecution's highest praise for C). What needed fixing was the *interaction*, not the
  economics — turning silent parallel building into live, turn-based contest does that without
  touching the controlled comparison.
- *Reveal + Rank/Defend* (stage 7) stays a debrief/argument beat, not gameplay — appropriately so;
  forcing "gameplay" onto an argument stage would itself become a decision screen (rank 1–5,
  submit).
- *No separate counterfactual/second-run stage is needed*: the two rule-conditions already ARE
  the counterfactual pair — building a second, redundant run would dilute rather than sharpen the
  comparison.

**(f) Classroom loop map (45m).**
| Stage | Min | Content |
|---|---|---|
| 1 Enter/hook | 5 | Reframe: "for two lessons the limit was the same for everyone. Today — what if it wasn't?" Explain the split + matchup pairing; fictional team names + fairness framing script line here, per rider c. |
| 2 Play | 16 | Head-to-head turn-based draft, shared device per matchup, shrinking pool. |
| 3 Class reveal | 4 | Combined team-strength chart populates live, colored by group/tag. |
| 4 Consequence/new info | 2 | Teacher names the pattern plainly: clustered apart vs. overlapping. |
| 5 Adapt | 2 | Written 1-sentence prompt: "what would you change about the rule?" (folded — no rebuild needed; the two live conditions already carried the comparison) |
| 6 Counterfactual | — | Intentionally absent — see audit above. |
| 7 Reveal + argument | 8 | Cold-call a Big-Market and Small-Market No-Cap student ("did that feel fair?"); RANK/DEFEND should the league have a cap. |
| 8 **Economics Synthesis** | 8 | "Same market, same draft rules — the only thing that changed was how much money you started with. That gap is what a cap is designed to close." Beyond sports: progressive taxes, revenue sharing, financial aid — same structural question. Module close: name what each lesson felt like. Exit prompt: stricter/looser/same, why. |

**(g) Concept ledger seed.**
- *Primary:* institutions as designed rules, competitive balance, structural vs. earned
  advantage. *Secondary:* how a shared rule equalizes unequal starting positions.
- *Experienced moment:* watching your rival's board out-fill yours live, turn by turn, under
  No-Cap; then the same mechanic under Cap where it stops happening.
- *Class evidence:* combined team-strength dot plot — clustered apart (No-Cap) vs. overlapping
  (Cap).
- *Formalization line:* see synthesis above.
- *Beyond sports:* every institution that decides whether unequal starting resources compound
  freely or get partly leveled by a rule.

**(h) Minimum assets.** *Must-have:* two Draft Boards side by side, shared shrinking Draft Pool
(~12 cards), turn indicator, fictional team-name badges, market-tag badges (Big/Small, flavor
only), combined team-strength chart, explicit L2→L3 transition screen. *Polish:* "sniped!"
micro-animation, draft-clock urgency sound, a 60-second real-sport anchor clip (a small-market
team that competes anyway — Design C's own recommended mitigation for the fairness risk).

**(i) Cheapest faithful design.** No new realtime infrastructure: because both rival GMs in a
matchup share one physical device (an extension of the existing pairs-on-one-device default,
applied to two paired teams for this one window), the entire head-to-head draft is a local
turn-based UI state machine — the same client-only cost class as L1/L2. Only class-wide
aggregation (the combined chart) needs the already-established async-submit, teacher-triggered
reveal pattern used throughout the module.

---

## Persistence Map

- **L1 → L2: literal carry-forward.** Same wall, same players, same spent budget — one saved
  state, no extra cost — and it is the entire point of L2 (you cannot revise a roster you never
  built). Matches the founder's stated preference: yesterday's choice creates today's problem.
- **L2 → L3: deliberate reset, thematic only.** New Draft Boards, new pool, new fictional team,
  new condition assignment. Carrying the literal L1/L2 roster forward would make the controlled
  Big/Small × Cap/No-Cap comparison impossible — this is the module's single most important
  artifact, so the seam is explicit and argued, not accidental. Required transition copy (rider
  f), delivered on-screen before L3's first draft turn: *"New question, new teams, same league:
  today we ask whether the $100M rule should even exist."* What DOES carry: the vocabulary
  (position tags, $10–60M price scale, fictional league identity) — institutional continuity, not
  mechanical.

## Build-Priority Note

**Build L1 first.** It is the cheapest lesson in the module (deterministic, no bidding engine, no
synchronized reveal, no turn-based multiplayer state) and it is the *foundational* component both
other lessons extend: L2 reuses the Roster Wall verbatim for repair, L3 reuses the wall pattern
for its paired Draft Boards. Building L1 first validates the core construction feel with real
students, pilots the still-untested numeric scale ($100M/$10M steps/five slots — D11 rider e)
while it's cheapest to change, and de-risks the one shared component every later lesson depends
on — before any money is spent on L2's bid math or L3's turn-based UI.
