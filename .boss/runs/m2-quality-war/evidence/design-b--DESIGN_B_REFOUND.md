# Module 2 "Money in Motion" — DESIGN B: SUBSTANTIAL REFOUND

Experience Director · assignment `arch-candidate-b` · Boss run `m2-quality-war` · 2026-08-31.

**Status of everything below: design proposal. Nothing here is verified, tested, played, or
certified — I do not certify, and no line of this is a quality claim.** Sources actually read
this session: `CLAUDE.md`, `docs/gauntlet/module-2/ECONOMIC_CONTRACT.md`, `PROTOTYPE_SPEC.md`,
`SPORTS_REALITY_INPUT.md`, `runtime/src/modules/boxOffice.ts` (header + market/economy block),
`runtime/src/shared/lessonModule.ts`, `runtime/src/shared/phases.ts`, `docs/ECONOMICS_CONCEPT_MAP.md`,
`docs/TRACK_101_MAP.md`, `docs/PRODUCT_DECISIONS.md` D2/D4/D13–D18. Numeric claims about the
existing Box Office model are **cited from ECONOMIC_CONTRACT.md's computation, not recomputed by
me** — inherited, not independently observed. Every dollar figure I propose is an illustrative
shape for a builder to tune against the property tests named in §3, **not a specified constant**.

---

## 1. Module thesis

**The three-class journey in three sentences.**

1. **"Season on Sale"** — you are the person who sells the seats, you have one building's worth of
   inventory and a calendar of nights that are not worth the same, and you must decide how much to
   sell before you know what you are selling.
2. **"Somebody Else's Building"** — your building fills up because of *other people's teams*, and
   other people's buildings fill up because of yours, so the money you make is only partly yours to
   make.
3. **"Who Keeps the Money"** — the room writes the rule that decides who keeps what, then plays two
   more weeks under its own rule and watches its own behavior change.

**The refound in one line.** The Box Office asked *"what is the right price?"* — a search problem
with one answer, on a bounded dial, against a curve the server handed over point by point. This
design asks *"how do you fill a building you do not control?"* — a commitment problem with no
single answer, where **the student never sets a price at all**: price is what the system does back
to them when they decide how much to put on the market.

### What I preserved, and why

| Preserved | Why it earned survival |
|---|---|
| **Operate a system, not a menu** | The single non-negotiable of the whole product (CLAUDE.md §8). Every decision in all three lessons is a continuous physical commitment on a persistent object, never a card. |
| **Zone-based inheritance — round 1's outcome *is* round 2's starting state** | The verified-good bone of `ROUND2[state.r1]` → `roundTwoOpening(zone)`. I promote it from a within-lesson device to the **module spine**: L1's base is L2's opening building; L2's ledger is L3's problem statement. Also kept *inside* L1 (each night's remaining inventory is the next night's opening state) so path dependence is felt eight times, not once. |
| **Solo operator + class aggregate** | Correct for L1 and deliberately kept there: you cannot feel that other people are in your loop before you have a loop. Deliberately broken in L2/L3, where another seat's behavior *is* the mechanism (CLAUDE.md §8's bar for real interdependence). |
| **Discovery before vocabulary** | Every lesson's reveal precedes its naming. No student hears "demand," "externality," "incentive" or "revenue sharing" before they have done the thing. |
| **Live physical feedback during manipulation** | The prototype's best *feel* is separable from its worst *economics*. The ripple survives as **feedback on your own commitment** (blocks moving, cash you have locked in, inventory draining) and dies as **preview of your payoff**. Keep the ripple; kill the oracle. |
| **Determinism and attributable assignment; no RNG anywhere** | The prototype's honest core. Extended: this module has zero random draws. All uncertainty is *information you do not have yet* or *what another seat did*, never dice. |
| **Board shows franchises, never students** | The `franchiseFor` privacy pattern, with real teams substituted for the fictional crests. Board says "Memphis," never a seat id or a student name. |

### What I refounded, and why

- **The Price Dial as the primary verb — killed.** A single-peaked hidden curve on a bounded dial
  is bisectable in three moves even without the preview leak (ECONOMIC_CONTRACT dominant-strategies,
  Family 1). It also cannot carry three lessons without becoming one lesson stretched to three (the
  contract's own objection to Arc B). Price still exists in this design — as **the market's answer
  to how much you released**, not as the student's input.
- **The pre-lock true preview — killed** (the recorded `boxOffice.ts:374` vs `:389` finding).
- **The single money scoreboard — killed** (FL1). Two non-collapsible scoreboards from the first
  ten minutes of L1.
- **Over/under/sweet zones with asymmetric penalties — killed** (FL3; the cited ~100× asymmetry).
  Replaced with two failure modes that are symmetric in cost and *morally neutral*: over-commit and
  under-commit are both ordinary operating errors, neither is greed.
- **Fictional market cards — killed** (SR-1). Real teams, real markets, real national money.
- **The Class Scatter as built — killed** (R9: it pools four curves peaking at $30/$50/$60/$90 into
  one cloud). Replaced by boards that carry their controlling variable by construction.
- **The unwinnable Expansion seat — killed** (R5). Recoverability becomes a stated design invariant
  with a named brute-force check, not a hope.

### Arc verdict

**I adopt Arc A's spine and reject Arc A's L1 mechanic.** The spine — *my loop → other people are
in my loop → we write the rule* — is the only ordering that is forced at every seam, and the
forcing is what makes three lessons a module. But Arc A's L1 ("Full House," two levers, prices
committed per night) is still a pricing lesson with more nights bolted on; it inherits the dial's
search problem and asks C1 to carry 40 minutes. My L1 keeps Arc A's *job* (give the student their
own money loop, with demand shifters mandatory) and changes the *verb* from setting a price to
releasing inventory — which produces the same class-generated demand curve from the quantity side,
without a number the student can sweep. I also take Arc C's transplant (two scoreboards from L1
onward) exactly as the contract requires.

### Differentiation from Module 1 (D13/D17/D18)

M1's three verbs are **place under a hard cap** (L1 Roster Wall), **revise a commitment and bid**
(L2 dead cap + sealed bids), **compete for scarce agents across market days** (L3 sealed offers).
M2's three verbs are **sell**, **host**, **rule**. The structural contrasts I want a teacher to be
able to say out loud in the M2 finale:

- M1 you **buy**; M2 you **sell**.
- M1's constraint is a **wall** ($100M); M2's constraint is a **calendar** (six nights, each worth
  something different, inventory that does not carry over).
- M1's other teams are **rivals for scarce inputs**; M2's other teams are **co-producers of the
  product** — they fill your building, you fill theirs.
- M1 prices are **posted** (a card costs what it costs); M2 prices are **made by the market** in
  response to what you did.
- M2 never converts money into wins anywhere (deliberate; see FL7 in §3).

---

## 2. The three lessons

Runtime shape common to all three: one `LessonModule` per lesson, server-authoritative pure
reducer, no demand constant ever serialized to a client, phases a strictly increasing subsequence
of `CANONICAL_PHASES`, repeated beats living *inside* `PLAY` and advanced by teacher action (the
precedent is M1 L3's four market days inside PLAY, D18). Every synchronized reveal has a manual
teacher trigger and a "close everything now" fallback. `boardView` is never handed a seat identity.
Teams render as typographic names in the Cap Room register — no logos, marks, or photography
(SR rights section).

---

### LESSON 1 — **"SEASON ON SALE"**

**PLAY FANTASY**
> *"You sell the seats. Next season goes on sale today — and nobody has told you yet who's
> coming to town."*

Graspable in seconds because the object is a picture of your own building.

**PRIMARY VERB: SELL** — decide how much of a fixed inventory to put on the market, over and over,
under changing conditions. (Not *price*. Not *buy*. Not *bid*.)

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MIN**

One object: **THE HOUSE** — your building drawn as 100 blocks (label: "1 block = 200 seats").
Every block is in exactly one of three states: **SOLD AS PASSES** (gone for the whole season),
**HELD** (yours, unsold), **ON SALE TONIGHT**. That is the entire interface. Everything else on
screen is a readout.

Beat by beat (~22 minutes of student decision-making):

1. **WAVE 1 — the early sale (3 min).** You know your team, your market, your building, and the
   season-pass rate (set by the league, a discount — buying blind is cheaper, which is real).
   You do **not** know the schedule; it has not been released. Drag blocks into SOLD AS PASSES.
   Cash lands immediately and irreversibly. The live feedback is your own commitment taking shape:
   blocks draining, guaranteed cash rising, HELD shrinking. No forecast of anything.
2. **SCHEDULE RELEASE (1 min, teacher-triggered, board event).** The six home nights appear with
   real visiting teams, days of week, and honest public facts. This is R3's information arriving:
   nothing you could have derived in Wave 1.
3. **WAVE 2 — the late sale (3 min).** Passes now cost more (the buyer knows the schedule too).
   Sell more, or stop. Same drag, new information, opposite pressure.
4. **THE SEASON — six nights (12–14 min, ~2 min each, teacher paces the close).** For each night:
   - **The night's facts are posted first** (R7): who is visiting, what day, whether the visitor's
     star is playing, and **what a comparable night did last season** (history, never a forecast).
   - You drag HELD blocks into ON SALE TONIGHT, and lock.
   - The night resolves: the **going rate falls as more blocks hit the market**, so tonight's
     take is release × rate(release, night). Your pass blocks are occupied automatically. Every
     occupied block spends on food and merch.
   - Blocks you did not release earn nothing tonight and are still yours tomorrow. Blocks you
     released are gone.
   The felt problem is not "what is the right number" but **"how much of my season do I spend
   tonight?"** — and the answer changes every night.
5. **THE BOOKS (REVEAL → CONSEQUENCE).** Season totals: gate, per-fan spend, the national check,
   against the payroll bill. Then the second scoreboard.

**SYSTEM THAT REACTS**

A demand system with three inputs the student can see (visitor draw, day, own form) and one they
cannot (their market's underlying strength constant), producing a *going rate that falls as they
release more*. It reacts to: how much you release tonight (rate), how much you already sold
forward (fewer blocks to work with), how full your building looks (the base never leaves an empty
seat), and how many nights are left (inventory is finite and does not roll into next season).

**ECONOMIC MECHANISM** (ECONOMIC_CONTRACT concepts)

- **C1 revenue = price × quantity**, entered from the quantity side. Releasing more sells more
  units at a lower rate; tonight's take rises, peaks, and falls in *release*, exactly the hump —
  but there is no dial to sweep because no view ever returns the rate for an unlocked release.
- **C2 demand shifters, mandatory.** The same release produces visibly different money on a
  Saturday-vs-the-champions than on a Tuesday-vs-a-rebuild. Every shifter is named and posted
  before you decide, so at debrief a student can separate "what I did" from "who was in town."
- **C12 complements, as a real mechanism, not a $5 decoration.** Per-fan spend applies to every
  occupied block, every night. A pass block is occupied six times; a held block that never sells is
  occupied zero. This makes the total-revenue-maximizing plan **sell more, cheaper** than the
  gate-revenue-maximizing plan — two visibly different numbers on the same books.
- **C9/C10 path dependence and invest-to-earn-later.** Passes are cash now *and* the base that
  L2 opens with; the nightly inventory chain is path dependence felt eight times inside one class.
- **Intertemporal tension, which is the repair of the recorded "myopia is optimal" finding.**
  Maximizing tonight is *not* the season answer: the per-night myopic release over-sells cheap
  nights and starves the marquee night. The short-run best action is provably not the long-run best
  action for a large share of slates — the tension the old model was missing lives here, in
  arithmetic, not in flavor text.

**REAL SPORTS CONTENT** (SR anchors; Sports Reality owns verification and dating)

- **SR-1** — real markets replace the fictional cards: Knicks, Warriors, Thunder, Grizzlies and
  enough further real teams that each pair operates its own (curves **modeled on** real market
  differences and labeled as modeled, never presented as a team's actual demand).
- **SR-2** — the national check is the real ~$76B / 11-year deal, scaled and stamped: *"Disney, NBC
  and Amazon pay the league whether you sell one seat or twenty thousand."* Its size relative to
  the gate is itself the lesson (C3).
- **SR-13** — synthesis validator: the Giants (2009–10) and now everyone re-price and re-release
  inventory continuously. *"The thing you just did by hand, real teams built software to do hourly."*
- **SR-11** — the schedule-release beat carries a real precedent for "the season you sell is not the
  season you get": Cleveland 2010 and 2014, one player leaving and returning, ticket demand
  collapsing and selling out in hours.
- **Non-fan success path:** every input a decision needs is a printed fact on the night card
  (visitor's record, star in or out, day of week, last comparable night's number). A student who
  has never watched a game reads the same card as a fan. Fandom adds attachment and nothing else.
- **Scale honesty (SR accuracy findings):** student-scale dollars with the real multiplier printed
  on the board — *"real version: about ×2,000"* — so nobody leaves thinking an NBA team is a
  lemonade stand.

**CONSEQUENCE & CONTINUITY**

Two scoreboards, never summed:

- **CASH** — measured against **the bill** (your payroll for the season). A threshold obligation,
  like M1's cap. Met or not met. Never ranked.
- **THE BASE** — how many blocks belong to people who are in the building every night. The base
  pays less per seat, cannot be re-sold at a marquee premium, and is the reason your building is
  full on a Tuesday.

No action is best on both: passes build the base and cap your upside on the nights that are worth
the most; holding wins cash on a strong slate and leaves you with an empty Tuesday and no regulars.

Carried to L2: `base`, `cash`, market, and **DRAW** (how much of an attraction your team has
become, seeded by how full your building actually was — a full loud building is a television
product). Carried with attribution: L2's opening screen says, in plain words, *which* choice
produced the building you walked into.

**CLASSROOM INTERDEPENDENCE: none, deliberately.** L1 is a solo operator plus a class aggregate.
This is a design commitment, not an omission — it is the control condition that makes L2's
discovery land. A student must own a loop before they can be shown who else is in it.

**SIGNATURE BOARD MOMENT — "SIX NIGHTS, ALL AT ONCE."**
The board shows every franchise's house as a small bowl, grouped into market tiers with the tier
label attached (R9). The teacher plays the season one night at a time and fifteen buildings fill
and empty together. The marquee night is the moment: the rooms that held inventory back light up,
the rooms that sold everything forward sit flat — *and then the totals board adds per-fan money and
the national check and some of the flat rooms are on top.* The room argues before anyone has said
the word "revenue."

**TEACHER FLOW (a stranger runs this)**

- **NOW:** "You sell the seats. Sell next season before you know what next season is." Show one
  building. Drag five blocks yourself. Stop.
- **DON'T EXPLAIN YET:** that flooding the market lowers the rate. Let night two teach it.
- **WATCH FOR:** the pair that sells 100 blocks in Wave 1 (they will be bored on night four — go
  give them the "what would you have held?" prompt early); the pair that sells zero (they will
  panic on night five — this is the good kind of panic, do not rescue it).
- **TRIGGER:** schedule release only after every pair has locked Wave 1. Close each night manually;
  the "close the night" button is the fallback if any pair stalls.
- **ASK, after night 3:** "Who has less than 20 blocks left? What's on Saturday?"
- **SYNTHESIS:** run it off the board's own two charts, script in the chain below.

**SYNTHESIS CHAIN**

| Link | Content |
|---|---|
| Experienced moment | Dumping 40 blocks on a Tuesday and watching the rate fall through the floor — or having nothing left to sell when the champions came to town. |
| Class evidence | `agg.releaseCurveByTier` — release count against realized rate, one series per market tier (never pooled), showing a downward-sloping demand curve made of the room's own decisions; plus `agg.passShareDistribution` and `agg.perFanShareOfRevenue`. |
| Real sports | SR-13 dynamic/variable pricing; SR-2's national deal dwarfing the gate. |
| Formal term | **Revenue.** **Demand** (and that it moves for reasons other than what you did). **The more you put out at once, the less each one is worth.** |
| Beyond sports | Concert tickets and the seats that "aren't released yet"; a school fundraiser that dumps all its cookies at lunch on Monday; a game console that costs more the week it comes out. |

**Phases:** `LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → COUNTERFACTUAL → ARGUE → SYNTHESIS →
COMPLETE` (waves and nights inside PLAY).

---

### LESSON 2 — **"SOMEBODY ELSE'S BUILDING"**

**PLAY FANTASY**
> *"Half the money in your building tonight walked in because of somebody else's team. And
> somewhere across the room, somebody is getting rich off yours."*

**PRIMARY VERB: HOST** — commit money to a night whose value another team controls, and decide how
much to spend on being worth hosting. (Not *sell*. Not *bid*.)

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MIN**

The class is the league. A deterministic schedule pairs the room: each week every team hosts one
opponent and travels to one. Odd counts and small classes are filled with real, published NBA
opponents whose draw is printed — honest, labeled, and no student is ever left without a night.

Four weeks, ~4 minutes each (~16–18 min of decisions), same two commitments every week:

1. **OPEN THE HOUSE.** Your building's sections are a ring you open and close by dragging. Opening
   more sections costs money **tonight, before anyone arrives** (staff, the upper deck, the rented
   downtown arena if your market has one). Close the upper deck and you cannot sell it, but a
   packed small room is loud, cheap and full. Committed before the crowd is known.
2. **BUILD THE DRAW.** Spend from your cash on being an attraction — the road show, a signature
   promotion, putting your games on free television. This costs you now and pays you *nowhere
   tonight*. It raises your **DRAW**, which fills the buildings you visit, feeds the league's
   national money, and — partly — fills your own house next week.

Then the week resolves and the money lands. The crowd in your building is a function of **your
base** (from L1), **your open sections**, and **the visitor's DRAW** — which is another pair's
accumulated decisions, which you could only estimate from public facts (their attendance last
week, whether their star is playing).

The loop's engine of tension: **you are always paying for one of two things — a night that is
yours, or a reputation that is everybody's.**

**SYSTEM THAT REACTS**

A league. Your take responds to a number another seat owns. Their take responds to yours. DRAW
decays weekly (no snowball), has diminishing returns (a catch-up channel for whoever is behind),
and feeds an **equal-share national pot** that grows with the whole room's DRAW and is split
identically to every team regardless of market (SR-2, SR-5 — and the strongest anti-snowball,
anti-death-spiral device available, because it is also *true*).

**ECONOMIC MECHANISM**

- **C5 joint product / externality** — the module's deepest payload and the least-known thing in
  this space. My payoff is a function of another seat's decision **through the product**, not
  through competition for a prize. If the room resolves this as "we competed and I won," the lesson
  has failed and become M1 L3 with new nouns; the flow map exists to make that impossible.
- **C4 market size** — exogenous, printed, unscored. Big markets have more sections to open and
  more expensive ones; small markets have a smaller house and the same national check.
- **C3 revenue composition, with a decision turning on the difference** — three structurally
  different sources: the gate (yours, tonight, sized by your commitment), per-fan spend (scales
  with bodies, not with price), the national pot (equal, fixed against your own effort, and grown
  only by everybody). The DRAW decision is a live wager on the third being real.
- **C10 invest-to-earn-later** — DRAW spending pays a week later and elsewhere. The week you pay
  for it is visibly worse.
- **C9 path dependence** — your base and your DRAW came from L1, named on screen.

**REAL SPORTS CONTENT**

- **SR-6 — the anchor of the whole lesson.** Indiana Fever home attendance ~4,066/game (2023) →
  17,036/game (2024), and **six opposing teams moved Fever games into bigger arenas** — literally
  this lesson's verb, performed by real front offices, and the visiting team kept none of that gate.
  A fifth grader hears "she sold out other people's buildings and those teams kept the money" and is
  immediately, usefully outraged. That outrage is L3's fuel.
- **SR-10 — the DRAW lever is real:** the Suns walked away from guaranteed regional-TV money in
  2023 to put every game on free television, trading a check for reach; ratings roughly doubled;
  most teams did **not** follow them. Genuinely debatable, which is why it is a lever and not a
  lecture.
- **SR-12 — the Warriors** as the "own the building, own the money" case: $833M revenue, privately
  financed Chase Center, the league's richest jersey patch.
- **SR-2 / SR-5** — the equal national pot, and (as the L3 tee-up) Green Bay's audited books.
- **Non-fan success path:** the only information a decision needs is on the matchup card in plain
  numbers — last week's attendance in that team's building, star in or out, market size. "This team
  is a big draw right now" is a printed fact, not a fandom check.

**CONSEQUENCE & CONTINUITY**

Scoreboards: **CASH** (against the bill again) and **DRAW** (never ranked on the board; shown as a
building's condition and as printed factual inputs on the matchup card, never as a league table —
R13 extends to DRAW). Carried into L3: every week's flows, per team, which *are* L3's opening
problem statement. Carried also: at least one team that cannot meet its bill without help, produced
by the room's own play rather than by a card the system dealt.

**CLASSROOM INTERDEPENDENCE: total, and it is the mechanism.** Another pair's DRAW decision changes
the money in my building. This is the CLAUDE.md §8 bar met literally: remove the other students and
the economics stops working.

**SIGNATURE BOARD MOMENT — "THE FLOW MAP."**
Buildings around the edge of the projector. After the last week, the teacher reveals arrows: money
that landed in *this* building because of *that* team. Then the single most valuable frame in the
module — two columns, **VALUE YOU MADE** and **VALUE YOU KEPT** — and for several teams they are
not the same number and not even close. The intended room sound is somebody shouting *"that's mine!"*

**TEACHER FLOW**

- **NOW:** "Everybody in this room plays in your building. And you play in theirs."
- **DON'T EXPLAIN YET:** the words "spillover" or "externality," and *especially* not the idea that
  the room is under-spending on DRAW. The flow map has to say it first.
- **WATCH FOR:** the room converging on "never spend on DRAW" (the predicted equilibrium and the
  desired one — do not rescue it; it *is* the finding); a pair that upsized for a visitor whose star
  was out (best debrief material in the lesson — ask them what they knew when they decided).
- **TRIGGER:** close each week manually; reveal the flow map only after week four, in two steps
  (arrows first, then the two-column tally) with the manual fallback for both.
- **ASK:** "Why was your building full on Thursday?" — and hold out for an answer that names another
  team. If the room answers with their own decisions, the lesson has not landed and the debrief must
  do the work.

**SYNTHESIS CHAIN**

| Link | Content |
|---|---|
| Experienced moment | Opening every section for a visitor whose star had been ruled out — or the mirror: making yourself an attraction and watching the money land across the room. |
| Class evidence | `agg.visitorLift` (share of each night's take attributable to the visitor's DRAW), `agg.valueCreatedVsCaptured` (the two-column tally), `agg.nationalPot` (what the room's total DRAW paid every team equally). |
| Real sports | SR-6 (Fever 4,066 → 17,036; six arenas moved); SR-2/SR-5 (national money split equally); SR-10 (Suns free TV). |
| Formal term | **Shared product.** **Spillover** — say "externality" only if the room is hungry for it. **You cannot play a game alone.** |
| Beyond sports | One great store bringing foot traffic to a whole mall; the group project where one person's work sets everyone's grade; a street where one closed shop empties the block. |

**Phases:** `LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ARGUE → SYNTHESIS → COMPLETE` (four weeks
inside PLAY).

---

### LESSON 3 — **"WHO KEEPS THE MONEY"**

**PLAY FANTASY**
> *"You're in the room where they decide who keeps the money. Whatever you write, you have to live
> in it — and next season you're on the road."*

**PRIMARY VERB: RULE** — build an institution out of continuous dials, get two thirds of a room to
adopt it, then operate under it.

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MIN**

1. **THE BOOKS ARE OPEN (7 min).** L2's flow map returns with the bills attached. The room sees
   its own problem: value made in one place and kept in another, and at least one team that cannot
   pay its bill while doing nothing wrong. The status quo is *visibly failing somebody* — the
   breaker for "do nothing dominates."
2. **DRAFT THE RULE (8 min) — the lesson's core play.** Not a menu. One rule sheet, three
   continuous dials, drafted by each pair:
   - **Visitor's share** (0–50%): what fraction of a night's gate goes to the team that travelled.
   - **Pool** (0–40%): what fraction of local revenue goes into a pot split equally.
   - **Condition** (0–max): what a team must do to collect its full share (open at least *n*
     sections, or spend at least *x* on DRAW) — the teeth, and the reason sharing is not charity.
   Each pair must also commit one written forecast: *under your rule, who gains and who loses?*
   That sentence is the assessment artifact and it is never scored for matching.
3. **THE VOTE (5 min).** The board clusters the room's rules by shape — **never ranked, never by
   money** (D4, R13). Adoption needs **two thirds**, so big and small markets must actually trade
   rather than out-vote each other. And the veil that kills "vote-my-assignment": **the rule binds
   next season, and next season's schedule flips** — the team that hosted four times travels four
   times. You are writing a rule for a season whose shape you do not yet know, which is exactly what
   real leagues do.
4. **LIVE UNDER IT (12 min).** Two more weeks of L2's loop, unchanged except for the rule. Same
   verb, same building, same opponents — **the rule is the only variable**, which is the entire
   point (C7 is not satisfied by commentary; it requires the same student acting twice under two
   rules).
5. **BEFORE / AFTER (6 min), then the real league (10 min).**

**SYSTEM THAT REACTS**

The reducer interprets the adopted dials as actual money movement, and the room's own behavior
responds: under a real visitor share, DRAW spending rises and hosts stop over-opening for marquee
visitors; under a heavy pool with a weak condition, somebody visibly stops trying — and the board
finds them. The unintended consequence is not narrated; it is computed from the room's own weeks.

**ECONOMIC MECHANISM**

- **C6 revenue sharing** — and it must land as neither charity nor taxation: the payer's own payoff
  rises (through a healthier product and a bigger national pot), *and* the cost is visible in
  someone's slackened effort in the same session. Target sentence at the door: **"sharing helped,
  and here's what it cost."** Not "sharing is fair."
- **C7 incentives** — the same seat, two weeks, two rules, its own behavior different. Measured,
  not asserted.
- **C8 institutional design and unintended consequences** — the room's rule is *executed* and lands
  on the chooser's own books. At least two materially different rules must survive to the vote with
  different, visible winners and losers; if the room produces only one shape, the teacher's card
  deck includes a second real one to run as a comparison week.
- **C9** closes the module: the rule you wrote is the world you now live in.

**REAL SPORTS CONTENT**

- **SR-4** — the Lakers' ~$149M local media year against the Grizzlies' under $10M in the same
  league year; Memphis receiving ~$32M in sharing, the league's most, while the Lakers still cleared
  a large profit after paying in; 14 of 30 teams losing money before sharing and 9 after (one leaked
  year, 2016-17, presented as a dated snapshot — not "the numbers today").
- **SR-5 — the reveal that is a real audited document.** The room predicts what fraction of the
  smallest market in American pro sports must be shared money for it to survive; then opens the
  Packers' published report: **$453.2M per team of national money (FY2025)**, in a metro of ~320K.
  No NBA team publishes its books; this is the earned cross-league exception.
- **SR-3 — a tax is a price, not a wall.** June 2025, a team one year removed from a title traded
  Jrue Holiday and Kristaps Porziņģis inside 24 hours to get under the second apron. Counter-case
  in the same breath (R15): OKC traded James Harden in 2012 rather than pay the tax, Harden became
  an MVP elsewhere — *and* OKC's approach eventually produced the 2025 title. Two teams, same
  incentive, opposite verdicts, no score for matching either.
- **SR-8 — optional closing exhibit if time allows:** the 2013 Kings relocation vote, 22-8, with
  both real term sheets and the decision-makers' information at the time.
- **Non-fan success path:** every rule decision is decidable from the room's own books on screen.
  The real cases arrive **after** the vote, as comparison, never as the answer key.

**CONSEQUENCE & CONTINUITY**

Scoreboards: **CASH** against the bill, and **LEAGUE HEALTH** (how many teams met their bill; the
size of the national pot). Non-collapsible because your own check depends on a pot you only partly
control. Continuity closes here — this is the module finale; the exit question is *"what did the
rule you wrote make you want to do?"*

**CLASSROOM INTERDEPENDENCE: constitutive.** One rule binds every seat, chosen by two thirds of the
room, applied to the room's own money.

**SIGNATURE BOARD MOMENT — "BEFORE / AFTER, IN YOUR OWN NUMBERS."**
The same room's two seasons side by side: average DRAW spending before and after, sections opened
before and after, bills met before and after — *and one column that got worse.* The teacher points
at the worse column and says nothing for five seconds. Then: "Who did that? …You did. On purpose.
Was it worth it?"

**TEACHER FLOW**

- **NOW:** "Last week you all found out somebody else was making money off you. Today you get to
  write the rule. Then you have to live in it."
- **DON'T EXPLAIN YET:** which rule is "right." There isn't one, and the teacher must not have a
  face that says otherwise (the "guess the teacher's answer" exploit is the single biggest threat to
  this lesson).
- **WATCH FOR:** all dials at zero (status quo — legitimate, but then the failing team is the
  debrief); a rule that starves somebody (run it anyway; the viability check flags it and *that is
  the lesson*); the room's two loudest markets cutting a deal (this is excellent and should be
  narrated as real).
- **TRIGGER:** the vote is teacher-run with a manual tally fallback; the before/after board reveals
  in three steps.
- **ASK:** "Whose behavior changed? Put your hand up if the rule changed what you *wanted* to do."

**SYNTHESIS CHAIN**

| Link | Content |
|---|---|
| Experienced moment | Watching your own rule change what you wanted to do — the student who says *"wait, now there's no point in me even trying."* |
| Class evidence | `agg.ruleDials` (what the room adopted), `agg.behaviorDelta` (mean DRAW spend and sections opened, before vs after), `agg.billMetCountBeforeAfter`, `agg.effortDrop` (the seat whose effort fell most under the room's own rule). |
| Real sports | SR-4 (Lakers/Grizzlies/Memphis's ~$32M); SR-5 (Packers' $453.2M national share, ~320K metro); SR-3 (the apron teardown, with the Harden counter-case). |
| Formal term | **Incentive.** **Revenue sharing.** **Rules change behavior — including behavior nobody wanted.** |
| Beyond sports | Group-grade policies; tips pooled across a restaurant's staff; taxes and what they pay for; a chore jar everyone draws from. |

**Phases:** `LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ADAPT → COUNTERFACTUAL → ARGUE →
SYNTHESIS → COMPLETE`.

---

## 3. R1–R16 compliance

Each row states the design property that discharges the repair and the **check a builder must run**
(I do not certify any of them; none has been run).

| # | How this design satisfies it | Check |
|---|---|---|
| **R1 No dominant strategy** | L1: the best release depends on the night's posted conditions and on how much inventory remains, and the season-optimal plan is **not** the sequence of per-night optima (holding for high-demand nights beats myopic release on a large share of slates) — the direct repair of the recorded "myopia is optimal" finding. L2: the best sections/DRAW split is a best response to other seats' DRAW and to your home/road mix. L3: payoffs depend on a flipped schedule. | Brute force over (market × slate × release policy) in L1 and (market × slate × section/DRAW grid × opponent DRAW range) in L2; assert the argmax moves across conditions and that no fixed rule ("always release a third," "never spend on DRAW," "always open everything") is optimal for a majority of seats in every round. |
| **R2 Commitment precedes information** | No view returns a payoff for an uncommitted action anywhere. Pre-commit surfaces carry only (a) the student's own commitment state, (b) posted structural facts, (c) **history** — what a comparable night did before. Demand constants never leave the server. Wave 1 happens before the schedule exists. | Assert that no field of any pre-commit view equals the post-resolve computation on the same inputs; assert the client bundle contains no demand constant. |
| **R3 REVEAL carries information** | L1: the schedule itself (Wave 1), the realized rate (nightly), and the per-fan/national totals. L2: other seats' DRAW and the flow map. L3: the room's own behavior delta. All underivable pre-commit. | For every seat, name the revealed quantity and show it is not a function of that seat's pre-commit view. |
| **R4 Two non-collapsible scoreboards** | CASH ↔ BASE (L1), CASH ↔ DRAW (L2), CASH ↔ LEAGUE HEALTH (L3). No action weakly best on both: passes buy base and forfeit marquee upside; DRAW spending forfeits tonight; the pool costs the payer cash and buys product. | Brute force: assert no action is weakly best on both dimensions for all seats. |
| **R5 Recoverability** | Design invariant: **from every reachable opening state, some legal action meets that round's obligation.** The equal-share national pot is the structural guarantee (it is untouched by any prior mistake), sized so a badly-run season is survivable and a well-run one is not trivial. The recorded Expansion-seat trap cannot recur because no state modifier shrinks a demand curve permanently. | Exhaustive search of reachable openings × legal actions; assert the obligation is satisfiable in every one. |
| **R6 Symmetric errors** | Over-release (rate collapses, base annoyed) and under-release (dead inventory, empty house, DRAW loss) are tuned to the same order of magnitude; likewise over-opening (cost eaten) and under-opening (turned-away demand). Neither error is coded as a vice — both are operating mistakes, and the debrief script says so, which is the FL3 antidote. | Compute worst-case loss for the extreme high and extreme low action in each round; assert the ratio ≤ 10× or record a written economic defense. |
| **R7 Attributable exogenous movement** | Every demand shifter is posted **before** the decision and named at debrief: visitor, day, star availability, market. Zero RNG in the module. **Dispute recorded below.** | Assert every demand input has a student-visible label and appears in the debrief payload. |
| **R8 Inequality exogenous, visible, unscored** | Real market assignment is deterministic by seat order, printed plainly ("this was dealt, not earned"), never ranked. The guaranteed small-market path: the bill is league-wide and the national check is equal, so a small market **cannot** win on gate but can lead the room on a full house every night — which in L2 converts into DRAW, which is money. Real precedent named in synthesis (OKC 2025; Green Bay). | Assert at least one small-market path reaching bill-met plus top-quartile DRAW exists in the reachable space, and that no board surface orders teams by market. |
| **R9 No pooled comparison without its controlling variable** | Every board comparison carries market tier and slate. The release-curve board is drawn **one series per tier**, never one cloud. The flow map is per-edge, so no pooling is possible. | Assert every board comparison payload carries the controlling variable alongside each point. |
| **R10 Ledger entries have instantiation pointers** | The M2 rows in `ECONOMICS_CONCEPT_MAP.md` must be rewritten, not restated: "PRICING UNDER UNCERTAINTY" and "INCENTIVES" as currently ledgered fail the INSTANTIATION test and should be **deleted** rather than re-worded. This design's claimed concepts are revenue (L1 release/rate transition), demand shifters (L1 night facts), complements (L1 per-fan term), spillover (L2 crossing term), market size (L2 building/pot), incentives (L3 before/after delta), institutional design (L3 rule interpreter), path dependence (the seed chain). | Each ledger row names the state transition that would break if the concept were false. |
| **R11 Simplifications ledger** | Required entries: gate's true share of team revenue; national money as a pipe **with obligations named** (start times, schedule, playoff format — FL8's antidote); six nights standing for 41; linear-ish demand; DRAW as one number standing for a bundle of real things; scaled dollars with the printed multiplier; **and the absence of any money→wins conversion, which is deliberate** (this module never lets money buy wins, so FL7 has no surface to attach to). Each entry names its misconception and the debrief line that defuses it. | Ledger exists and each row has a debrief line. |
| **R12 Real anchor per lesson, dated, non-load-bearing** | L1: SR-1/SR-2/SR-13/SR-11. L2: SR-6/SR-10/SR-12/SR-2. L3: SR-4/SR-5/SR-3 (+SR-8). Every economic input a decision needs is a printed fact on screen. | Play the lesson with the real names replaced by placeholders; every decision must remain fully decidable. |
| **R13 No money leaderboard** | Obligations are thresholds, never ranks. No comparative money display while any decision is open. Extended: **DRAW is never ranked either** — it appears as printed facts on a matchup card and as a building's condition. | Assert no board payload contains an ordering key over money or DRAW at any phase. |
| **R14 Path dependence attributable and non-fatal** | L2 and L3 open with a plain-language line naming the choice that produced the opening state. Every reachable opening keeps a decision whose outcome differs materially (with R5). | Assert for every reachable opening that at least two legal actions produce materially different outcomes. |
| **R15 Historical reveals** | L3's apron teardown ships with its counter-case (Harden 2012 / OKC 2025) and the decision-maker's information at the time. No matching score exists anywhere in the module. The Kings vote, if used, ships both term sheets. | Assert no scoring field compares a student decision to a historical outcome. |
| **R16 Synthesis map complete** | Three chains above, each naming the aggregate field that produces its class evidence (`agg.releaseCurveByTier`, `agg.visitorLift`, `agg.valueCreatedVsCaptured`, `agg.behaviorDelta`, `agg.effortDrop`, …). | Every synthesis line must be computable from session state before the build is called done. |

### Disputed

**R7, partially — as literally worded, it forbids any event after commitment.** Read strictly
("every change in demand not caused by the student must be announced *before* the decision"), R7
outlaws the visiting star spraining an ankle on Thursday, which also removes most of the teeth from
R2 and from CLAUDE.md §1's "uncertainty during play must become interpretable afterward" — a world
with no post-commitment surprise has no risk in it, only arithmetic. My design complies with what I
read as R7's actual target (unnamed variance) and asks for one amendment: **post-commitment events
are permitted when drawn from a small, pre-announced, named risk set the student was shown before
deciding, and named with its cause at reveal.** Every such event stays deterministic (no RNG) and
attributable. If Economic Truth rejects the amendment, this design still runs — L1's uncertainty is
already carried entirely by the unreleased schedule and the unknown rate, and L2's by other seats'
DRAW — but it loses its best "you could not have known, and here is how you'd plan for that" beat.
I record the disagreement rather than quietly reinterpreting the requirement.

No other repair is disputed. R1, R2, R5, R6, R9 and R10 are the four recorded failures plus two
structural ones, and this design treats all six as load-bearing.

---

## 4. Survival ledger

**Preserved, and why it earned survival**

1. **Operate-a-system-not-menus.** Verified as the product's spine (CLAUDE.md §8, and the reason
   the legacy `101-M2-L2` card-picker died). Every decision here is a continuous commitment on a
   persistent physical object.
2. **Zone-based inheritance (`ROUND2[state.r1]` → starting state, not text).** Independently
   praised as the cleanest path-dependence mechanic in the portfolio. Promoted from one within-lesson
   bridge to the module's spine *and* repeated eight times inside L1 via the inventory chain — the
   pattern gets more use here than in the prototype, not less.
3. **Solo operator + class aggregate.** Genuinely correct — for L1. Kept there exactly, and
   deliberately abandoned in L2/L3 where another seat's behavior is the mechanism. Keeping it
   everywhere would have made C5 undeliverable.
4. **Discovery before vocabulary.** Non-negotiable per CLAUDE.md §1's loop; retained verbatim.
5. **Live manipulation feedback.** The prototype's genuine fun. Survives as feedback on your own
   commitment; the payoff oracle that rode along with it does not.
6. **Determinism, no RNG, attributable assignment.** Retained and hardened to zero random draws.
7. **Board-safe franchise identity.** The `franchiseFor` privacy device survives with real teams
   substituted for fictional crests.
8. **Two-round commit-then-inherit rhythm.** Survives as L1's wave/night structure and as L3's
   before/after weeks.

**Killed, and why**

1. **The Price Dial as primary verb** — bisectable in three moves; cannot carry three lessons;
   makes FL10 ("there is a right price") the accidental lesson. Price survives as the market's
   response to quantity.
2. **The pre-lock true preview** (`boxOffice.ts:374`) — the recorded blocking finding. The optimum
   was read, not reasoned.
3. **Single revenue scoreboard** — FL1, the worst false lesson in this space.
4. **Over/under/sweet zones and their asymmetric penalties** — FL3; a moral about greed dressed as
   arithmetic (the cited ~100× headroom asymmetry).
5. **The four fictional Market Cards and the fictional "$75,000 payroll"** — SR-1's explicit
   finding; identical curves, zero attachment, same build cost.
6. **The Class Scatter as built** — R9 (four curves pooled into one cloud, no market id on the
   point) and its proximity to a money leaderboard.
7. **Passive revenue pipes** — C3 demands sources with structurally different properties and at
   least one decision turning on the difference; display pipes instantiate nothing.
8. **"The counterfactual is the second homestand"** — an elegant line, but it made the second round
   a re-run of the first with a debuff. Here the second and third lessons change the *verb*, and
   the counterfactual is the room's own before/after.
9. **Any money→wins conversion** — never built, deliberately, so FL7 has no surface.

---

## 5. Uncertainty list — what prose cannot decide

Three loops whose fun and economics I cannot judge from a document. Each is a Stage-0 (paper or
throwaway CLI, not a runtime build) falsifiable question.

1. **L1's release loop — is "how much do I put on sale tonight" a felt decision or a shrug?**
   This is the whole candidate. If students treat release as a slider they wiggle, the lesson is a
   spreadsheet with a bowl drawn on it.
   *Stage-0:* paper version, one market, posted night facts, six nights, 8 pairs, no software.
   *Falsifiable:* **do at least 6 of 8 pairs change their release size between nights for a reason
   they can state out loud, and does the room's night-1 release span at least 40 percentage points?**
   Convergence on one number, or unstated reasons, falsifies the loop.

2. **L2's externality — do 10-year-olds attribute the money to the visitor, or to themselves?**
   C5 is the module's highest ceiling and its most fragile delivery. Self-attribution turns the flow
   map from evidence into a lecture.
   *Stage-0:* two weeks, 6 pairs, hand-run schedule and hand-computed crowds.
   *Falsifiable:* **without prompting and before the flow map is shown, can at least 5 of 6 pairs
   answer "why was your building full on Thursday?" by naming the visiting team?** If they credit
   their own section-opening, the mechanism is not felt and L2 needs a stronger crossing term.

3. **L3's vote-to-play timing — can a room design and adopt a rule and still play under it?**
   The contract names this as Arc A's principal risk, and it is mine too.
   *Stage-0:* timed dry run with a real teacher and 6–10 pairs, paper rule sheets.
   *Falsifiable:* **does the room reach a two-thirds-adopted rule within 12 minutes of the rule
   sheet opening, with at least 2 materially different rule shapes on the board?** If it does not,
   L3 falls back to the contract's own prescription — operate a **given** real rule (the league's
   actual sharing/tax system), then argue and amend — rather than shipping a debate club.

---

## 6. Honest weaknesses — where this candidate is most likely to lose the war

1. **It is the most expensive candidate in the room.** Three genuinely different mechanics, a
   league-scheduling/pairing engine, a per-edge flow ledger, and — worst — **a rule interpreter in
   L3 that must execute arbitrary dial combinations inside a pure reducer and stay recoverable
   (R5) for every one of them.** If this candidate loses, I expect it to lose here. A defensible
   mitigation exists (constrain the dials to a coarse grid and pre-verify the whole grid offline),
   but it is a real reduction in the "you designed this" feeling.
2. **L1 is one step more abstract than "set a price."** Season tickets are a concept an 11-year-old
   may not have. The mitigation is entirely visual — one building, three block states — and if that
   visual does not land in ten seconds, Candidate A's directness beats me on the classroom floor.
3. **L2's legibility scales badly at both ends.** With 6 pairs the schedule is thin and the flow map
   is trivial; with 15 pairs the flow map is a hairball on a projector at the back of a room. This
   needs a real projector legibility answer (probably: show only the top-flow edges plus every edge
   touching the team being discussed), and I do not have one I can defend yet.
4. **"Do nothing" is a live risk in L3** even with a failing status quo — a room that sets all
   three dials to zero has produced a legitimate result and a much weaker lesson. My breaker (a
   visibly failing team from the room's own play) depends on L2 actually producing one, which is
   itself a tuning assumption.
5. **The module is deeply serial.** A student who misses L1 arrives in L2 with an honestly-labeled
   stock franchise and much less attachment; the normalization is fair but flattens the drama for
   exactly the student who most needs a hook.
6. **There is no basketball in it.** No players, no games, no winning — deliberately, to stay clear
   of M3 (evaluation) and M4 (expected value) and to dodge FL7 entirely. That discipline is
   economically correct and it is an engagement risk: some students arrive wanting hoops and get a
   building, a calendar, and a rule sheet. The counter is that the real anchors (SR-6, SR-3, SR-4)
   are among the most dramatic stories in the sport — but that is an assertion about a room I have
   not been in, and CLAUDE.md §13 says I do not get to call it verified.
