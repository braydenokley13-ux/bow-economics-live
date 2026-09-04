# MODULE 1 — THE THREE-ACT ARC

Written before L1's state shape is hardened, per founder §28: "The module arc
must be designed now. Otherwise L1 architecture may trap later lessons."

Status: my architectural proposal. Not yet prosecuted. The trade-mechanic and
franchise-state research are in flight and may overturn §4.

---

## 0. The spine, in one paragraph

You buy **contracts**, not players. In Act 1 you commit money under uncertainty
about what you are buying, and the money you commit is not the real price — the
real price is the **tool** you spend, because the tools are what let you solve
problems later. In Act 2 the uncertainty resolves: what the player *does* moves,
and what he *costs* does not. A new problem arrives, and you must solve it with
whatever Act 1 left you. In Act 3 every contract in the league is now either
worth more than it costs or less, which is precisely what makes trade possible —
and you must decide what kind of franchise you are, make the move, and defend it.

Each act's economics is **manufactured by the previous act's decisions**. Nothing
is bolted on.

---

## 1. Why this arc and not the founder's literal list

Founder §6 offers a menu for Act 2: overperform, underperform, breakout,
decline, injury, roster weakness, owner pressure, trade demand, deadline
opportunity. Every one of those is a *symptom*. Picking symptoms produces a
grab-bag lesson.

The single mechanism underneath all of them is:

> **The contract is fixed. The value is not.**

That is the truest thing about NBA player contracts, it is why the apron is
brutal, it is why picks get attached to salary, and it is why a deadline market
exists at all. Every symptom on the founder's list is an instance of it. Model
the mechanism; render the symptoms.

## 2. What carries, and what does not

Founder §6/§19 wants strong persistence without "state sludge". The carry is
deliberately narrow — three things, and nothing else:

| Carries | Why | Shape |
|---|---|---|
| **The commitments** | This is the whole arc. Who you signed, for how much, for how many years, and which tool you spent. | A short list of contract records |
| **The line you sit behind** | Which of the five thresholds your payroll is under, and by how much. | Two numbers |
| **The jobs still open** | Act 1's unfinished business is Act 2's opening position. | A small set of job ids |

Explicitly **not** carried: offer history, rejected alternatives, per-day
transcripts, the forgone panel. Those are *evidence*, and they carry into the
**Final Defense** by a different route (§7) — they are read-only narrative, never
inputs to a reducer. This is the sludge firewall: **anything that changes a
later computation carries as state; anything that is only ever shown to a human
carries as evidence.**

Mechanically this is the existing opaque cross-lesson seed envelope. No new
transport, no shared reducer, no cross-module state engine (CLAUDE.md §12
holds).

## 3. Act 2 — THE SEASON CHANGES

**What happens.** Each Act-1 signing resolves into one of three honest states
against **the job you signed him to do** — not against a rating:

- **HE DOES THE JOB.** The plan holds.
- **HE DOES MORE THAN THE JOB.** You are paying below what this role now costs.
- **HE DOES NOT DO THE JOB.** You are paying for a job that is still open.

Three states, no scalar, no invented OVR. This is the mockups' `Team OVR 89`
replaced with something we can actually compute and defend.

**Where the resolution comes from.** Two sources, both deterministic:

1. **Seeded** off `(sessionId, contract)` — reproducible, so a teacher can rerun
   a class and a debrief can say "this was always going to happen".
2. **Authored and real** — a dated, verifiable dependency belonging to that
   specific franchise (the research agent is producing these). A real player
   with a real option decision, a real contract year, a real ageing curve.
   Authored beats random for the two or three that matter most.

Teacher may optionally trigger one bounded authored situation (§15's "C +
optional D"). Never arbitrary chaos.

**The bite.** A player who does not do the job leaves that job open — and you
already spent the tool that could have filled it. Most desks are now looking at
the minimum. Some desks are now on the wrong side of a line they were under in
Act 1, and the thing they lost by crossing it is *the ability to fix this*.

**What the student plays.** Not "read the news". They must **re-solve the same
allocation problem with a worse toolkit**, which is the definition of
adaptation. The Act-1 mechanic is reused with different constraints — cheap to
build, and the repetition is the point: they feel the tool they no longer have.

**Grade split.** 5–6 respond to one resolved job with a bounded set of moves.
7–8 face two interacting resolutions and must choose which problem to leave
unsolved — the first genuine triage decision in the course.

## 4. Act 3 — THE DEADLINE, then THE BOARDROOM

**Why trade is now possible and was not before.** After Act 2, every contract in
the class sits at either *does a job you need*, *does a job you don't*, or
*doesn't do its job*. A player who does a job **you** don't need and a job
**they** do is a gain from trade sitting in plain sight. That is the double
coincidence of wants, it emerges with zero invention, and it needs no rating
system — only jobs, which we already model.

The negative case is just as teachable: a contract that no longer does its job
is salary you must **attach something to** in order to move. This is the real
NBA mechanic and it is where picks become currency.

**Constraint.** Salary matching plus the apron restrictions — pending the trade
research (`NBA_TRADE_TRUTH.md`, in flight). The instruction to that research was
to name the *single* constraint that teaches the most true economics if we model
only one. I expect the answer to be salary matching, because it is what makes a
trade a *swap of committed money* rather than a purchase — but I am not
pre-committing before the evidence lands.

**Then the boardroom.** Detailed at §7.

## 5. The shared league — what the class actually shares

Already true in the L1 engine today: one board, one `taken` set, all desks
settle against the same market simultaneously. "If another franchise signs a
player: HE IS GONE" is not a feature to build; it is how the engine already
works. The work is to make it *visible*.

**Design decision — live interest, sealed prices.** During a day, every desk
sees, on each player, **how many desks currently hold a pending offer on him** —
never who, never how much. At the close, offers settle simultaneously and the
full picture reveals.

Why this shape:

- It is **true**: it is a computed fact about the room, not a "market
  temperature" needle.
- It preserves the sealed simultaneous auction, so the market is not won by the
  fastest clicker and no desk's private position leaks mid-play.
- It creates the exact tension the founder is asking for — "Wait, four other
  desks want him too" — and it is the honest version of Mockup B's three visible
  competing offers, which would leak seat-private data.
- It makes the room's own behaviour the information, which is what makes sixteen
  simulations into one league.

**Risk to prosecute:** visible interest could stampede the room off contested
players onto uncontested ones, collapsing the scarcity it was meant to create.
This is a real economic phenomenon and possibly a good lesson, but it must be
tested in the sweep before it ships — as a property: *revealed interest must not
create a dominant "always avoid the crowd" strategy*.

**The projector's job** is the room, not a ranking. Mockup B's
`WHO'S WINNING RIGHT NOW` is refused (see `VISUAL_TARGET_2.md`); the replacement
is **THE ROOM DISAGREES** — computed statements of genuine class disagreement,
no desk above another, every line an argument the teacher can open.

## 6. The persistent front office — how, without a new engine

Founder §11 wants spatial, persistent product memory across three lessons.
CLAUDE.md §12 forbids extracting a shared engine from a few data points. Both
hold, because they are about different layers:

- **Chrome (shared, client-side).** The left rail, the franchise identity band,
  the four-node act rail, the attention triad (phone / inbox / scouting), the
  cap overview. One shared renderer, driven entirely by a small descriptor each
  module's view supplies. It knows nothing about any module's state.
- **Content (per-module).** Each lesson owns its state, its reducer, and its
  panels, exactly as `LessonModule` requires today.

The runtime still never inspects a module's state. The student still returns to
the same organisation each lesson. Nothing generic is extracted from the
economics.

## 7. The Final Defense — the evidence route

The defense reconstructs the student's actual story, which means it needs the
things §2 deliberately refused to carry as state. They travel as **evidence**: an
append-only, human-readable record of what this desk did and what it passed up,
written at each act's close and never read by any reducer.

The board's questions are the mockup's, which are already close to right:

1. **Strategic rationale** — what was your plan?
2. **Alternative paths** — what realistic path did you reject? *(we hold this
   exactly: the frozen forgone record from Act 1)*
3. **Risk & reward** — what did you knowingly risk?
4. **Adaptation** — what changed, and what did you do?
5. **Decision quality** — was it a good decision given what you knew?

Question 5 is the whole course. The simulation must never answer it. Outcome and
decision quality are separated by construction: a desk that made a defensible
bet and got a bad resolution has the strongest possible material for a defense,
and the debrief question is the BOW question — *was the decision bad, or did the
outcome go against a reasonable bet?*

**No universal champion.** The five Act-1 readings are already
non-commensurable with a Pareto frontier. Act 3 extends the set, and the class
board shows the frontier and the tradeoffs, never a rank.

## 8. What this arc forbids L1 from doing

The point of writing this now. L1 must not:

1. **Compute a team quality scalar.** Act 2 and Act 3 both depend on value being
   per-job, not aggregate. A rating in L1 poisons both.
2. **Let a signing be costless in tools.** If Act 1 lets you keep your exception
   after using it, Act 2 has no bite.
3. **Resolve outcomes inside L1.** L1 ends with the commitment, not the verdict.
   The gap between them is Act 2's entire reason to exist.
4. **Close every job.** A desk that finishes Act 1 complete has no Act 2. The
   roster must be structurally unfinishable in three days — which the current
   `openJobs` / `windowMax` shape already enforces.
5. **Carry a fat state blob.** Three things carry (§2). Everything else is
   evidence.
6. **Make contracts single-year.** Term is the bridge: a two-year commitment is
   what makes Act 2 and Act 3 inherit anything at all. `yearsFor` already takes
   term from the tool, which is correct and must not regress.

All six are satisfied by the L1 engine as it stands today. The arc does not
require reopening it — which is the outcome I wanted from writing this before
building the UI.

## 9. Open, pending research

- The one trade constraint to model (`NBA_TRADE_TRUTH.md`, in flight).
- Which eight franchises, and their real Act-2 dependencies
  (`FRANCHISE_STATES.md`, in flight).
- The trade interaction shape (`TRADE_MECHANIC_FROTH.md`, in flight).
- Whether live interest stampedes the market (sweep property, to be written).
