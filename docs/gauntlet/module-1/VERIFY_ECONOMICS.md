# Economics Verification — Module 1, Lesson 1 "Draft Day"

Prosecutor pass against `runtime/src/modules/draftDay.ts`, its test suite, the L1 section of
`PLAYABILITY_SPEC.md`, and the rendered screenshots. Code line numbers refer to `draftDay.ts`.

## Overall Ruling: **SOUND WITH REQUIRED REPAIRS**

Every synthesis card cites real, correctly-aggregated session data (verified against the test
suite and the teacher-console screenshot showing `$96.7M` avg spend for a 100/100/90 locked set —
matches `(100+100+90)/3 = 96.666… → 96.7`). No card asserts a false economic principle. The risk
is not in what the game *says*, it's in what the game's own mechanics quietly *demonstrate*
alongside the correct spoken lesson, with nothing in the synthesis stage to correct the
misimpression. Three of the four repairs below are cheap; none requires a redesign.

---

## Indictments

### FATAL — The market makes price a perfect, unbroken proxy for value, and the game's own "guided narrow" assist actively teaches "buy the priciest thing you can afford"

`MARKET` (lines 54-78) is built so rating is monotonic with price *within* a position (documented
intentionally, lines 40-53) — but it is also monotonic *across* the whole market, with **zero
overlap** between price-tier rating bands:

| Tier | Rating range |
|---|---|
| $10M | 56–59 |
| $20M | 68–71 |
| $30M | 77–80 |
| $40M | 84–87 |
| $60M | 90–93 |

Every $20M player outrates every $10M player; every $30M player outrates every $20M player, etc.,
with no exceptions anywhere in the 20-card market. There is no "hidden gem" — no case where a
cheaper card beats a pricier one. Combined with `weakestSlotOf` (lines 197-214) selecting by
rating, this means **the shock always hits whichever player was cheapest on the wall** — the code
comment even confirms shock-targeting "never needs to break a real tie in practice" because the
bands never overlap. A team never experiences a counter-example to "expensive = better, cheap =
weak." That is a real economics falsehood industry students are supposed to unlearn (price and
quality are *not* reliably correlated in real markets), and this simulation has no mechanism to
contradict it.

Worse, `candidatesFor` (lines 189-195), which powers both the PLAY-phase "guided narrow" (spec
9.d, the anti-decision-screen fix for a frozen student) and the ADAPT repair candidate list, sorts
`(a, b) => b.rating - a.rating`. Because rating ≡ price here, **this is functionally sorting by
price descending** — the assist feature's top-3 pulse *always* recommends the most expensive
affordable player, for every slot, every time. I computed the actual value math this implies:
greedily grabbing the priciest-affordable option at each slot (star-stack: `sc-60 + pm-10 + df-10
+ rb-10 + wc(sc-10)`, spend $100M) totals **323 rating points**, while a measured, spread
allocation at the same $100M spend (`sc-30 + pm-20 + df-20 + rb-20 + wc(sc-10)`) totals **348**.
The market's marginal rating-per-$10M *falls* as price rises in every position (e.g. Rebounder:
+14, +8, +9, then only +3 for the $40→$60 jump) — classic diminishing returns — so concentrating
budget in one $60M star is the mathematically weaker "whole-roster value" strategy. But total
roster rating is **never shown to students anywhere** (Class Gallery bars encode dollars spent,
not rating — see `boardView` REVEAL, lines 548-563, and the screenshot), so there is no feedback
loop by which a class could discover this on its own. The one algorithmic voice that does offer a
recommendation (`candidatesFor`) points the wrong way, silently, while presenting itself as
neutral help.

*Fix:* sort `candidatesFor` by rating-per-dollar (or otherwise stop defaulting to
priciest-affordable), or — cheaper — add one deliberate value-inversion to the market (a $20M
player that beats a $30M one somewhere) so price stops being a flawless value proxy, and have the
teacher's ARGUE/SYNTHESIS script explicitly name "the priciest pick isn't always the best full
roster" using the class's own Star-Stacked vs. Balanced comparison.

### SERIOUS — The shock can never leave a team worse off, which undercuts its own "consequence" framing

`doShock` (lines 322-336) removes the weakest slot and refunds its exact price. In `doAdaptFill`
(lines 299-320), the affordability check is `player.price > remaining`, where
`remaining_after = remaining_before + price_removed`. Since `remaining_before >= 0` always (a
locked team never overspends the cap), **`remaining_after` is always ≥ `price_removed`** — the
exact player who was just cut can *always* be re-signed for the same price. This isn't an edge
case; it's a structural guarantee for every shock event, confirmed by the "adaptFill rejects a
candidate the team can no longer afford" test (lines 295-311), which shows a spent-to-cap team
recovering to *exactly* its pre-shock state. A team that left budget unspent can even *upgrade*
during repair. So the worst possible outcome of "the shock" is **no change at all**, and the best
case is an improvement — yet `SHOCK_COPY` (line 84) dramatizes it as "took a hit," and the
CONSEQUENCE screen literally reads "THE SHOCK." Real setbacks (injuries, layoffs, market crops)
are not reliably, fully, costlessly reversible; this module's mechanic teaches that they are. This
also directly parallels why L2's spec (line 111) *deliberately* adds a ~10% "dead-cap bite" so its
own cut-and-repair loop isn't consequence-free — L1's shock has the identical structural gap,
un-patched, because L1's intent is narrower (personal opportunity cost only), but the dramatic
"hit"/"consequence" language oversells stakes the mechanic doesn't carry.

*Fix, cheapest option:* reframe, don't rebuild — have SYNTHESIS's "CONSTRAINED CHOICE" card
explicitly name the asymmetry as a lesson rather than leave it invisible: *"Teams that had money
left over could repair with something as good or better. Teams that spent every last dollar could
only get back exactly what they lost — no upgrade possible. That's the real cost of spending to
the limit: no room left for a setback."* This turns a currently-silent design property into an
honestly-taught, genuinely-experienced concept — see missing concept below.

### MINOR — "$10M-step" claim is contradicted by the market's own data

The code comment (lines 41, 48) and `STEP = 10` (line 24, passed to the client in the HOOK view)
both assert prices move in $10M steps. But every position's price ladder is `10, 20, 30, 40, 60` —
there is no $50M tier, so the top step is a $20M jump, not $10M. It doesn't break any cap math
(all values stay multiples of $10M), but it's a factual inconsistency between what the code claims
and what the market contains, and if `step` is ever rendered as "$10M steps" copy client-side, it
would misstate the market to students. *Fix:* either add a $50M tier per position or correct the
"$10M steps" language.

### HONEST UNCERTAINTY — Reveal visualizes spend, not quality

The Class Gallery (`boardView` REVEAL) bars encode total dollars spent as height, segmented by
position — not rating. Given the FATAL finding above, a taller (higher-spend) bar can visually
read as "the better team" even when, by the game's own numbers, it may hold a *lower* total
rating than a shorter bar. This isn't a false claim (the game never says "taller = better"), but
it is a visualization choice that reinforces the same price-as-value intuition the FATAL finding
already puts at risk. Likely intentional (per the Distinctness Matrix, L1 is deliberately
non-comparative/non-competitive, unlike L3), so I flag it as a design tension to be aware of, not
an error to fix.

---

## Synthesis Audit — per-concept verdicts

**SCARCITY — EARNED.** Directly grounded in real numbers (`agg.lockedTeams`,
`agg.spentToCapCount`), matches the "0 locked" no-fake-data fallback (test: "synthesis cards
degrade gracefully with zero locked rosters"), and the mechanism (a live cap meter, a persistent
Foregone Panel, per spec 9.b) is strongly and continuously instantiated during PLAY, not bolted on
at the end. Minor wording looseness: "the money still wasn't enough to get everyone" reads as a
trivial claim (of course $100M can't buy all 20 market cards) rather than the sharper point (you
can't buy the roster you'd ideally want) — cosmetic, not disqualifying.

**OPPORTUNITY COST — EARNED.** The `foregoneAtLock` mechanic (frozen at the instant of lock, named
players, surfaced in COUNTERFACTUAL) is a genuinely strong, personally-specific instantiation. The
star-signer/cheap-fill numeric framing is verified correct against the test at lines 325-353 (1 of
1 star signers had a $10M forced fill). The beyond-sports generalization (allowance, grocery bill,
trip fund) faithfully generalizes the *same* mechanism experienced (a fixed budget forecloses
specific named alternatives), not a generic restatement.

**TRADEOFFS AMONG SUBSTITUTES — WEAK.** Gameplay genuinely instantiates a substitutes decision:
each position slot has five real, price-differentiated cards that are true substitutes for that
slot (e.g., five different Scorers). But the card's body (lines 703-707) never references that
mechanism — it reports cross-team strategy-bucket counts (`balancedCount`,
`strategyCounts["star-stacked"]`, `avgSpent`) instead, which is a real but different concept
(dispersion of class strategies, not substitute-good choice). An 11-year-old reading "TRADEOFFS
AMONG SUBSTITUTES" next to "1 team spread the $100M... 1 bet big on one $60M name" has no clear
route from that label to the choice they actually made (picking one Scorer over four others). Fix
is one sentence: name the in-slot substitute choice explicitly.

**CONSTRAINED CHOICE (shock/adapt) — WEAK.** Grounded in real `hitCount`/`repairedCount` data and
an honestly deterministic, non-random targeting rule ("not a random one" is true and verifiable).
But as detailed in the SERIOUS indictment above, the claim that recovery is merely "bounded by the
same scarce budget" understates that recovery is *guaranteed* to be at least a full restoration —
never a net loss. The dramatic "took a hit" framing oversells a mechanic that cannot actually hurt
a team. Not FAKE (the underlying constraint-driven repair is real and correctly computed), but the
gap between the narrated stakes and the guaranteed-safe mechanics is a genuine misteaching risk.

**MISSING CONCEPT — risk buffer / margin of safety.** Genuinely experienced but never named: a
team that locked with money left over can repair the shock with something *as good or better*;
a team that spent to the exact cap can only exactly restore what it lost, with zero room to
upgrade. This is a real, discoverable, valuable economics idea (leaving slack under a budget is a
hedge against the unknown) sitting unused in the aggregate/session data. It should be added as a
named card or folded into "CONSTRAINED CHOICE" (see fix above) — it is the single highest-value
low-cost improvement available, since it simultaneously fixes the SERIOUS indictment and adds a
concept the spec's own concept ledger doesn't currently list but the mechanics already teach for
free.

---

## Grade Band

Card titles ("SCARCITY," "OPPORTUNITY COST," "TRADEOFFS AMONG SUBSTITUTES," "CONSTRAINED CHOICE")
are above a raw 10-12-year-old reading level, but that is the intended teacher-narrated
vocabulary-naming moment (spec stage 8), not silent student reading — acceptable. Body copy stays
concrete and numeric throughout. The one-decimal average (`$96.7M`) is at the edge of grade
5/6 math standards (mean-of-a-data-set is typically a 6th-grade skill) but is teacher-displayed,
not student-computed, so it's a receptive rather than a production task — acceptable.
