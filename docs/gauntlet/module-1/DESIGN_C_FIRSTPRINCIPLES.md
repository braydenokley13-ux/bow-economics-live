# Module 1 — "The Cap": First-Principles Design

Designed from the learning objectives and product bar alone (scarcity, tradeoffs, opportunity cost,
constrained allocation, cap-as-institution), not from existing BOW material.

## The Pitch

Every student runs the same brand-new franchise, under the same league, through three linked
45-minute sessions. Lesson 1 they feel scarcity for the first time (a fixed budget, a roster to
fill, real things they must give up). Lesson 2 that same roster gets disrupted and they must undo
a locked-in choice — discovering that undoing costs something too. Lesson 3 the rule itself gets
put on trial: half the room plays without a cap, half plays with one, and the class's own numbers
show why the rule exists. Nothing is graded, nothing earns points; every lesson ends with the room
looking at its own data and arguing about it.

## Role and Arc

**Role: General Manager of an expansion franchise**, one student (or a negotiating pair) per team,
same role across all three lessons. GM is the right role *for this module specifically* — the cap
is a constraint that lives on a GM's ledger, not a scout's or an agent's — later modules should
pick different roles as the economics shifts (an agent for value-argument lessons, a commissioner
for rule-design lessons).

**Continuity is narrative and mechanical where cheap, not forced where it would break the lesson.**
L1→L2: the *literal roster* carries forward — same team, same spent budget, now disrupted. This
costs nothing extra (one saved state) and is the whole point of L2 (you can't revise what you never
built). L2→L3: continuity becomes *thematic* only — L3 needs students split into an unequal-budget
condition to make its point, which would be impossible if everyone kept their identical L1/L2
roster. The throughline is "same league, same market, same vocabulary," not "same exact team." This
is a deliberate seam, flagged below as a design tradeoff, not an oversight.

---

## Lesson 1 — "Draft Day: Nobody Gets Everything"

**System.** A fictional five-team league, one shared player market (~16 players tagged by position
— Scorer, Playmaker, Defender, Rebounder, Wildcard — and priced in clean $10M steps from $10M to
$60M). Every GM gets an identical $100M cap and must fill all five slots exactly — no slot may sit
empty and no player may be re-bought.

**Decisions.** BUILD the five-slot roster; ALLOCATE the $100M across it. Every purchase is a
tradeoff made against the same fixed pool other students also hold, so the class ends up with
wildly different rosters from an identical starting position — that divergence *is* the lesson.

**Visible causal chain.** A live cap meter drops with each purchase. Once remaining budget can't
cover a player, that player visibly greys out in the market — the student sees affordability
change in real time, not after the fact. On lock-in, the system shows each student a personal
"priced yourself out" list: the players they could have afforded if they'd spent differently
earlier. That list is the opportunity-cost reveal, generated from their own choices, not narrated.

**Uncertainty.** Intentionally none. First exposure to scarcity should be clean and deterministic
so the mechanic lands without noise; uncertainty is introduced honestly in L2.

**Class-evidence artifact.** A class gallery, auto-aggregated on lock-in: every roster's
spend-by-position as a small stacked bar, side by side. The debrief question writes itself: *same
$100M, same market — why did we build such different teams?*

**Teacher minute-by-minute (45 min).**
- 0–5: Frame the scarcity ("$100M, five slots, you can't afford everyone you want").
- 5–8: One live demo build on the projector — cap meter moving, a player greying out.
- 8–30: Students build independently; teacher circulates.
- 30–33: Lock-in.
- 33–40: Reveal the class gallery; "turn to your partner — why did you spend where you spent, what
  did you give up?"; cold-call 2–3 pairs.
- 40–45: Name the vocabulary now that it's been felt (scarcity, opportunity cost); preview L2
  ("something happens to your team next class, same budget").

**Device/interaction shape.** Individual or paired Chromebooks, simultaneous but independent — no
student's build affects another's, so this is individual decisions + facilitator-triggered
aggregation, not realtime multiplayer. Pairs are the recommended default: negotiating over five
purchases is where the opportunity-cost reasoning gets said out loud.

**Failure modes / 30-second rescues.**
- *Frozen on a choice* → teacher points at their weakest-filled slot: "what does this position need
  at minimum?"
- *Overspent early, can't fill the last slot* → the system blocks lock-in and offers a one-click
  "rookie minimum" auto-fill for that slot only, framed diegetically, not as a cheat.
- *Clicking a greyed-out player repeatedly* → point at the meter: "you're out of room, look here."

---

## Lesson 2 — "The Trade Deadline: Undo Isn't Free"

**System.** The same $100M cap and the student's own L1 roster, now disrupted: one roster slot is
flagged for an unavoidable change (framed as an injury or a rival's offer, computed per-student off
their own weakest-suited pick so it feels personal without needing to sync with classmates). To
sign anyone new, the student must first cut a player — freeing exactly that player's salary and no
more. Replacement candidates are shown as a **floor–ceiling range**, not a single number: a cheap,
known-value veteran versus a cheaper rookie who could bust or break out.

**Decisions.** NEGOTIATE which player to cut (a real loss — cutting your best player frees the most
room but weakens the team); ALLOCATE the freed space; FORECAST between the safe and the risky
replacement; REVISE the L1 roster outright.

**Visible causal chain.** Cut a $15M player, get exactly $15M of new room — no more, no less. The
lesson that spent cap space is *committed*, and undoing a decision only returns what you already
paid, is shown mechanically, never lectured. Students can re-cut and re-choose freely until
lock-in, so the "cost" being taught is the cap-space constraint, not an accidental UI trap.

**Uncertainty, represented honestly.** Every risky replacement shows its real floor and ceiling
before the choice is locked — no hidden numbers, no fake precision. The true outcome resolves only
after lock-in, via a visible odds bar (not a black box), and every student's resolution fires at
the same teacher-triggered moment.

**Class-evidence artifact.** A scatter of safe-vs-risky choices against what actually happened:
who played it safe and how it went, who gambled and how it went — real disagreement data, not a
leaderboard, since "safe" and "risky" both win and lose across the room.

**Teacher minute-by-minute (45 min).**
- 0–4: Reconnect with the L1 gallery, then drop the shared twist in one line.
- 4–8: One live demo: cut → freed room → floor/ceiling replacement cards.
- 8–25: Students cut, choose, and can still change their mind.
- 25–27: Lock-in.
- 27–35: **The reveal moment** — teacher triggers every student's outcome to resolve at once,
  projected and on-device simultaneously. This is the strongest beat in the module: a room finding
  out together whether its gambles paid off.
- 35–42: Debrief from the scatter — "who played safe, how'd it go; who risked it, how'd it go; was
  risky the *right* choice?" Land on: no single right answer, it depends what you could afford to
  lose.
- 42–45: Preview L3: "next time we ask whether there should even be a line."

**Device/interaction shape.** Same as L1 — individual/paired, asynchronous build, synchronous
*reveal* only. The reveal is a broadcast animation, not true multiplayer; no student's data changes
another's, which is why this stays out of realtime-sync territory.

**Failure modes / 30-second rescues.**
- *Regrets a cut mid-task, thinks it's final* → "nothing's locked yet, you can still change it,"
  pointing at the editable state.
- *Picks by the biggest headline number, ignoring the floor* → point at the range bar: "what's the
  worst case here versus there?"
- *Misses the shared reveal* (bathroom, distracted) → personal reveal state persists so they can
  trigger it themselves on return, not lose the beat.

---

## Lesson 3 — "Why the Line Exists"

**System.** Split the room in half. **No-Cap group**: each GM is randomly tagged Big Market
($180M, no limit) or Small Market ($60M, no limit) and builds a fresh five-slot roster from the
same player market as L1/L2. **Cap group**: every GM gets exactly $100M regardless of market tag —
the rule the class has used all along. This isolates the one variable that matters: does the rule,
not talent or effort, close the gap between unequal starting positions?

**Decisions.** BUILD/ALLOCATE again (mechanically familiar, so the lesson's attention goes to the
*rule*, not re-learning the interface); then RANK and DEFEND — should the league have a cap?

**Visible causal chain.** A single combined chart, revealed live: team-strength score (sum of the
five players' quality) plotted per student, colored by group and market tag. On the No-Cap side,
Big Market clusters visibly above Small Market. On the Cap side, the two tags overlap. The gap — or
its absence — is the whole argument, generated from the room's own numbers, pointed at live.

**Uncertainty.** Deliberately absent here; this lesson isolates one structural variable (the rule)
cleanly rather than reintroducing risk, which would muddy the comparison.

**Class-evidence artifact.** The two-condition team-strength distribution — the single most
important artifact in the module, because it turns "the cap exists for competitive balance" from a
sentence students hear into a pattern they watched their own class produce.

**Teacher minute-by-minute (45–50 min).**
- 0–5: Reframe — "for two classes you built under a $100M limit; today, what if that limit didn't
  exist?" Explain the split.
- 5–8: 90-second rules note for the No-Cap group only ("no limit, but your market size sets your
  budget"); Cap group needs almost nothing new.
- 8–22: Build (14 min), both conditions simultaneously.
- 22–24: Lock-in.
- 24–30: **The reveal moment** — the combined chart populates live on the projector: two clusters
  far apart versus two clusters overlapping, side by side, from data the room just made.
- 30–40: Debrief and DEFEND — cold-call a Big-Market and a Small-Market student from the No-Cap
  side ("did that feel fair?"); land the vocabulary: competitive balance, the cap as a rule that
  exists on purpose.
- 40–50: Close the module: name what each lesson felt like (scarcity → the cost of revising a
  decision → why the rule exists); optional one-sentence exit response, "should the cap be
  stricter, looser, or the same? why?" — ungraded, just captured for the room's own record.

**Device/interaction shape.** Individual/paired build under one of two rule sets, aggregated at
reveal — again facilitator-reveal, not realtime multiplayer, since no student's action changes
another's system.

**Failure modes / 30-second rescues.**
- *Small-Market/No-Cap student frustrated, disengaging* → this frustration is the lesson; redirect,
  don't fix: "hold that feeling, we're about to talk about exactly that — build the best you can
  with what you've got."
- *Takes the small budget personally* → preempt in the rules note ("you didn't do anything wrong,
  you were just assigned a smaller budget — that's the whole point"); repeat 1:1 if needed.
- *Confused why the Cap group's budget doesn't change with market tag* → one line: "everyone in
  this group gets exactly $100M, no matter what."

---

## Risks and Open Questions

- **Fairness framing.** Big Market/Small Market as fictional flavor (not real cities) is the safer
  default for 10–12-year-olds — it keeps the inequality abstract and playful rather than echoing
  real-world socioeconomic dynamics a student might map onto their own life. Recommend fictional
  team names throughout; add one 60-second real-sport anchor (e.g., a small-market team that
  competes anyway) so the abstraction doesn't float free of the sport.
- **Revision cost in L2.** Currently cutting a player frees its salary exactly, dollar for dollar.
  A small "dead cap" penalty (losing ~10% of the cut player's value) would teach that revision
  itself has a cost, which is a real and simple idea — but adds a number for students to track.
  Flagged for piloting both ways rather than decided here.
- **Reveal-moment dependency.** All three lessons' strongest beats (the priced-out list, the
  simultaneous outcome reveal, the combined histogram) depend on fast aggregation across ~25–30
  devices at once. If that lags or fails, the emotional payoff of the whole lesson deflates. This
  is the top delivery risk in the design — every reveal needs a teacher-side manual re-trigger as a
  fallback, independent of how it's built.
- **Escape-hatch overuse.** The L1 "rookie minimum" auto-fill exists to prevent a dead end, but a
  disengaged student could use it to skip the decision entirely, undermining the opportunity-cost
  lesson it's meant to protect. Recommend it stays visible to the teacher when used, so it prompts
  a follow-up rather than a silent shortcut.
- **Numeric scale.** $100M cap, $10M steps, ~16-player market — chosen for single/double-digit
  mental math, but untested with actual grade 5–6 students. Needs a real classroom pilot before the
  numbers are treated as final.
- **Pairs vs. individuals.** Pairs build in negotiation for free but risk one partner dominating
  five quick decisions. Recommend defaulting to pairs with an explicit "each partner owns part of
  the roster" norm, adjustable by teacher judgment per class culture.
- **L1→L3 continuity seam.** L3 deliberately does not reuse the literal L1/L2 roster, because doing
  so would make the unequal-budget comparison impossible. This is a considered tradeoff, not an
  oversight — flagged here so it isn't "fixed" into a design that breaks the module's strongest
  lesson.
