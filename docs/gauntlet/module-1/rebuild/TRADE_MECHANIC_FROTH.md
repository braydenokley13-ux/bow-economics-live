# STUDENT-TO-STUDENT TRADE — froth, prosecution, selection

Founder §8/§9: capture the social energy of desk-to-desk NBA dealing without
letting transaction complexity destroy the economics lesson.

Frothed and prosecuted by the experience director; recorded here by me (its role
contract forbids repository writes). Selection and the two rulings at §4 are
mine.

---

## 1. The four shapes

Materially different in interaction, not in labels.

**1. THE HANDSHAKE — bounded bilateral composer.** One live outbox slot, one
live inbox slot per desk. Per-pair-per-day cooldown. Escrow on any player named
in a live offer. Expiry at day close. Addressed, human yes/no. 5–6 picks one of
three server-composed legal packages; 7–8 picks up to two of its own players, so
the aggregation prohibition bites on a wall drawn in July. Build: LARGE.

**2. THE ASK BOARD — public posted-price market, no addressed channel at all.**
Each desk posts WANTED (a role) and OFFERED (a named player, salary printed).
Claims execute on posted terms. A ten-second settling window resolves contested
claims *in-model* — posted WANTED first, then room-left, mirroring `compareBids`
in `engine.ts` — so arrival order never decides anything. One revision, then a
league-office sweep. Build: MEDIUM server, LARGE projector.

**3. THE LEAGUE OFFICE FLOOR — commissioner-mediated.** Proposals queue to
`/teach`; the teacher spotlights one deal at a time on `/board`; every
non-participant desk privately calls YES/NO in eight seconds before the
receiving desk answers, and the split is shown after. Realistic ceiling: six
deals in twelve minutes, plus a private back-room lane. Build: LARGE, heaviest
on `/teach`.

**4. THE CIRCLE — not a composer at all.** Each desk declares I WANT (≤3 ranked,
from public rosters) and I WILL RELEASE. The teacher presses CLEAR; the server
runs cycle clearing; the projector draws three-team trades as arrows. No inbox,
no messaging, no in-flight inter-seat object. Build: MEDIUM server, LARGE
projector.

## 2. SELECTED — THE BOARD AND THE HANDSHAKE

Shape 2's public posting is the market's spine and the information layer. Onto
it: **a desk may send one addressed offer per day against a posting. The posting
IS the inbox and holds exactly one live offer; other desks see `WAITING: 3` — a
count, which is itself the demand signal.** A human presses ACCEPT or REFUSE.
That is the founder's memorable moment, preserved intact.

- Refusal frees the slot and cools that pair for the day.
- No pair transacts twice in the lesson.
- **Twins never transact by any route** (see §3.1).
- At each day close the **cycle finder runs over unmatched postings and executes
  nothing** — it reports the three-way the room left on the table. That is the
  reveal, computed from the room's own play, with a scripted empty case.
- A modelled league office sweeps every remaining posting at a visibly worse
  price, so no desk ends the lesson with nothing.

**Killed, and why.** Free-form composition over the whole league (unsweepable,
and the chat-app vector). **The counter-offer, at both bands** — a two-turn
conversation is unaffordable at 32 desks in 12 minutes; 7–8's harder object
moves to *constructing the posting* and *substituting a different asset than
was asked for*. Commissioner-mediation as the primary mechanic (fails the
random-teacher invariant; the spotlight returns during REVEAL, where curating is
a virtue). Cycle clearing as the mechanic (black-box at grade 5 — promoted to
the reveal instead). Simultaneous sealed offers (L1 is already sealed-
simultaneous per D49 Q2; repeating the auction shape wastes the module's one
chance at barter). "One trade per desk, whole class" (one refusal kills a desk's
lesson — the scarcity belongs on the *pair*).

**The target feeling.** Minute 3: sixteen rows land on the projector and the
room reads a market that assembled itself. Minute 4: a burst of claims and
somebody says out loud "somebody took it." Minute 6: a refusal that stings, and
is private. Minute 11: the arrows — *Detroit wanted what Boston had, Boston
wanted what Memphis had, Memphis wanted what Detroit had, and none of you could
have made it alone.*

## 3. Risks, highest severity first

1. **`P-TWIN` breaks in every shape unless twins are forbidden from
   transacting.** Within-club spread ≥ between-club spread is the module's whole
   defence against "inheritance decides the outcome". If Boston A and Boston B
   can deal, within-club spread measures who you sat next to. One predicate
   fixes the bilateral case. **Shape 4 has a laundering case the predicate
   misses**: a cycle routing Boston A → Detroit A → Boston B. Any clearer must
   reject a cycle containing both twins.
2. **A free-form composer cannot be swept, so it cannot discharge BC-2, BC-4 or
   BC-13.** L1's sweep is tractable only because `offersAtPrices` reduces a
   continuous bid to two outcome-distinct prices. There is no equivalent
   reduction for (partners × packages × responses)³. Shipping an unsweepable
   composer means shipping the charter *argued* rather than *proven* — the exact
   condition that produced `freeAgency.ts:1417`.
3. **The fair-swap equilibrium — the likeliest false lesson.** The salary bar is
   the most legible object on screen, so the room converges on $11M-for-$11M and
   every deal feels "even". Students would learn *a trade is a neutral exchange;
   nobody gains* — which deletes gains from trade, the only reason the act
   exists. **Breaker: no class-facing reading may be a function of the balanced
   bar. The reveal measures what each side's HOLE did.**
4. Shape 3 fails the random-teacher invariant, and a market cleared at an
   authority's discretion teaches central planning, not exchange.
5. Shape 2 alone teaches "value is a printed number set by whoever posts it" —
   posted price suppresses disagreement. The addressed-offer layer exists
   precisely to restore the subjective half of value.
6. Shape 4's black box: a student who cannot reconstruct why they got what they
   got gets a shrug, not a reveal.
7. **Refusals are invisible everywhere except `/teach`.** A desk refused twice is
   losing silently. `/teach` needs `REFUSED TWICE` as a walk-to signal — and at
   32 desks it will fire on eight desks at once, which one adult cannot serve.
   This is why the league-office backstop is not optional.

## 4. Rulings

**4.1 Club books are PUBLIC. Intentions are PRIVATE, permanently.**

Escalated to me as a founder call. It is not one — it is a fact about the NBA.
Payrolls, contracts, tools spent and cap position are public league data; that
is why Spotrac and SalarySwish exist and why our own world file cites them. A
club's cap sheet is the league's data, not the seat's, so publishing it does not
touch CLAUDE.md §11, which protects the *student*, not the franchise.

What stays private forever, before and after any reveal: what a desk wants, what
it would accept, and every offer it refused. Those are intentions, and they are
the seat's.

**4.2 Trades belong in L3, and BC-19's (A, H1, H2) triple belongs in L2.**

The director argued L2 as the trade home. I'm placing the mechanic in L3, per
`ARC_DESIGN.md`: the gains from trade only exist *after* Act 2 has resolved
which contracts do their job and which do not. Trading before that resolution
is swapping two unknowns, which teaches nothing. What does move to L2 is BC-19 —
the two-for-one aggregation action, refused under a desk that drew a wall in
July and applied under one that did not. That is the same rule taught as a
*consequence* one act before it becomes a *tool*, which is the better order.

## 5. Non-negotiables carried into build

- **No matching percentage, anywhere.** S1 in `world.ts` already binds this.
  Refusals teach the shape: "over the cap a trade has to be roughly even; the
  further past the lines you are, the tighter 'roughly' gets."
- **No contested outcome resolves on arrival time.** In-model tie-breaks only.
- **Per-desk `bookVersion`, bumped on every executed trade, carried on every
  offer.** A stale accept is refused in the lesson's own voice: *"Boston's books
  changed after they sent this — the deal is off."* The runtime already supplies
  the other three integrity legs: `appliedActionIds` idempotency, retryable
  `version_conflict`, and `stale_round`.
- **Escrow every player named in a live offer**, shown on the owner's roster as
  IN A DEAL. Without it, one player is sold twice.
- `boardView` is structurally never handed a seat identity. Publish consummated
  deals by desk label only — never postings in flight, never refusals, never
  comparative money while a decision is open.
- No scalar, rank, award, or combining function.

## 6. Open, before build

1. **The sweep problem.** A desk's reachable outcome set is a function of what
   thirty-one humans posted, and there is no argument yet that a small family of
   modelled posting environments covers what a real class produces. Two
   unvalidated approaches: adversarial posting environments chosen to maximise
   each property's chance of failing, or an honest conditional property asserted
   over a declared, enumerated family that is printed with the result. Both are
   weaker than L1's proof. **Close this before build, not during.**
2. Can a grade-5 pair read another club's cap sheet well enough to tell a legal
   offer from an illegal one *before* pressing send? If not, the fix is
   structural: the composer must be **generated from the intersection of two
   books** rather than validated against it.
3. Does each desk's hole/surplus derive deterministically from the L1 carry?
   It must, for attribution to hold. Not yet verified that L1 carries enough to
   produce a distinct, non-degenerate hole at all 16 desks.
4. Minutes. Three posting/claim rounds plus a reveal is 18–20, against a ≤50
   played-minute budget for the period. Unallocated.

## 7. Recorded dissent (the director's, against its own recommendation)

> It is less fun than the pure handshake and I know it. Routing a student
> through a market to reach Jake is colder than picking Jake. I have
> subordinated that to falsifiability. If a rehearsal shows the posting layer
> kills the social energy, the correct response is to ship the addressed offer
> unbounded and **solve the sweep problem differently** — not to keep the
> bounded version and call the loss acceptable.

Recorded and accepted as a live condition on the selection, not a footnote.
