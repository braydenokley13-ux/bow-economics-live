# Module 2 "Money in Motion" — Architecture Candidate A: The Box Office, Evolved

Experience Director · assignment `arch-candidate-a` · Boss run `m2-quality-war` · 2026-08-31

**Advocacy note.** I am this candidate's strongest advocate. I am not its defense attorney.
Section 3 concedes all three blocking findings in `econ-boxoffice-unrepaired` as *correct as
computed* and repairs them at the model level; where I dispute something it is a metric, not a
finding. Section 6 is written to help a rival candidate beat me.

**Evidence status.** No Boss evidence ids exist for M2 experience work; this document is the
deliverable. **Observed (source):** `runtime/src/modules/boxOffice.ts`,
`docs/gauntlet/module-2/PROTOTYPE_SPEC.md`, `ECONOMIC_CONTRACT.md`, `SPORTS_REALITY_INPUT.md`,
`docs/PRODUCT_DECISIONS.md` D2/D4/D13–D18, `CLAUDE.md`. **Inferred:** every arithmetic direction
claimed below (goodwill sign, sharing's effect on the chosen price, congestion payoffs) — each is
tagged with the property test that would falsify it. **NOT VERIFIED by me:** every real-world fact
(all carry Sports Reality's `SR-n` anchor and its dating); anything about how any of this feels in
a room; the current prototype's fun, which no one in this run has observed in a classroom.

---

## 1. Module thesis

A student spends Lesson 1 learning that one dial controls their team's money and that the dial's
best setting is never knowable in advance, only reasoned toward from last week's crowd; spends
Lesson 2 discovering that half of what fills their building was decided by somebody else in the
room, and that half of what they build is spent filling somebody else's; and spends Lesson 3
writing a league rule about that fact, then putting their hand back on the *same dial from Lesson
1* and watching it move to a different number — with no one having told them to move it.

The price-discovery mechanic deserves to anchor the module for one reason that no other candidate
mechanic can match: **it is a measuring instrument.** A continuous, self-set number against a
hidden curve is the only M2 mechanic that can register a behavior change to the dollar. C7
("incentives — a rule changes behavior") is D2's named M2 concept that no other module owns, and
the contract's instantiation bar for it is brutal — *the same student must act twice under two
different rules with the rule as the only change, and their own behavior must differ.* A dial
satisfies that bar and a card menu, a vote, or a discussion cannot. Lesson 3's closing board image
— every pair's own price, before the rule and after, as arrows all pointing the same way — exists
only because Lesson 1 taught the room to use a dial. That is the argument for this candidate: not
that price discovery is a delightful ten minutes (it is, and ten minutes is all it is worth on its
own, per C1), but that it is the **instrument the module's deepest lesson is measured with.**

The module's spine is two books that never add up: **THE DRAWER** (cash this period, against a bill
you owe) and **THE HOUSE** (the crowd you will have next period). Every lesson is a different way of
being unable to maximize both.

---

## 2. The three lessons

Continuity is deliberate and narrow, per CLAUDE.md §9 and the D18 precedent: state carries only
where yesterday's choice creates today's problem. **L1→L2 carries market assignment and HOUSE
state** (the crowd you built or spent is the crowd you host with). **L2→L3 carries each team's
books** (the room cannot legislate about an inequality it has not personally suffered). Nothing
else persists. A seat with no prior session gets an honestly-labeled stock franchise at the class
median — never a broken one.

---

### LESSON 1 — "FULL HOUSE"

**PLAY FANTASY.** *"I run the box office. Three nights, three different crowds, one dial — and the
only numbers I have are from last week."*

**PRIMARY VERB — PRICE.** Set a continuous number against a hidden curve, commit, live with it.

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MINUTES**

The screen is the Box Office Counter (this survives from the current build, unchanged as a spatial
metaphor). Three objects: **THE BOOK** (fixed, printed, non-interactive — last homestand's actual
results, three rows: price charged, fans who came, money taken), **TONIGHT'S SLATE** (three
announced nights with opponent, day, and any announced shifter), and **THE DIAL**.

- **Beat 1 — READ THE BOOK (2 min, HOOK).** Teacher drags the dial once on the projector. The
  **Replay** readout ripples: *"if last Saturday's crowd had faced this price, the building would
  have looked like this and the drawer would have held this."* A real hump, found mid-drag,
  climbing and falling exactly as the current prototype's does. The joy is intact.
- **Beat 2 — READ THE SLATE (2 min).** The three nights are announced. They are *not* last
  Saturday. Tuesday's visitor is a bottom-of-table team; Saturday's is the league's biggest draw.
  The student now knows the dial's readout is true history about the wrong night.
- **Beat 3 — ROUND 1: ONE PRICE, THREE NIGHTS (8–10 min, PLAY).** The homestand takes **one
  price** — the way tickets were actually sold before 2010 (SR-13). Pairs argue, sweep the Replay,
  reason about the slate, and LOCK. Nothing about tonight is shown before the lock.
- **Beat 4 — REVEAL (4 min).** Three nights resolve at once. Tuesday's bowl sits visibly empty.
  Saturday sold out in minutes — and the board posts what the resale market took, the money that
  went past the team. The DRAWER lands against the bill; the HOUSE lands as next week's crowd.
- **Beat 5 — CONSEQUENCE + ADAPT (4 min).** The room's own problem is named on the board: *one
  number could not serve three nights.* Then the action space **expands** — the student is handed
  three dials.
- **Beat 6 — ROUND 2: THREE PRICES (8–10 min, COUNTERFACTUAL).** Same market, a new three-night
  slate, per-night pricing, and one announced exogenous shifter that must be reasoned about (a
  star ruled out; a school night; a nationally televised window). LOCK. REVEAL. ARGUE.

**SYSTEM THAT REACTS.** A hidden linear demand curve per market, shifted by three named,
announced, attributable multipliers — opponent draw, day-of-week, and the HOUSE state carried from
the student's own previous round. Attendance clamps at capacity; above capacity the excess demand
becomes visible resale. All server-side. No RNG anywhere: the uncertainty is *unrevealed
structure*, never a die roll (R7).

**ECONOMIC MECHANISM.** C1 (revenue = price × quantity, felt as a hump), **C2 mandatory alongside
it** (demand shifters — the contract is right that C1 without C2 actively teaches a falsehood),
C12 as a real mechanism not a decoration (per-fan in-arena spend tuned until the total-revenue-max
price sits **at least two dial steps below** the ticket-revenue-max price — otherwise it is cut),
C9 threading, C3 seeded passively (the national pipe). Two non-collapsible books throughout (R4).

**REAL SPORTS CONTENT.** The four markets are real and replace the four fictional cards outright,
per Sports Reality's top finding (SR-1): **New York Knicks** (largest US media market, MSG),
**Golden State Warriors** ($833M revenue 2024-25, league's highest; they own Chase Center),
**Oklahoma City Thunder** (one of the smallest markets; 2025 champions — the small market that
wins), **Memphis Grizzlies** (local media under $10M/yr against the Lakers' ~$149M/yr in the same
league year). The TV pipe carries its real name and number (SR-2): *"Disney, NBC and Amazon pay
the league about $76 billion over eleven years, and none of it moves when you move that dial."*
The Round-2 star-out shifter is anchored to SR-11 (LeBron leaving Cleveland in 2010 and returning
in 2014 — the same building, the same prices, a different curve). The synthesis close is SR-13:
the Giants built software in 2010 to do by the hour what the student just did by hand.

**HOW A NON-FAN SUCCEEDS.** Every number the economics needs is printed on the market card and the
slate: market size in plain words, arena capacity, the bill, the opponent's draw as a one-to-five
dot rating. "New York is huge, Memphis is small" needs zero basketball. A fan gets MSG, Ja Morant,
and the argument about whether OKC's model is repeatable — texture, never accuracy (R12).

**CONSEQUENCE & CONTINUITY.** The HOUSE state produced in Round 2 is the seat's opening demand
level in Lesson 2. It is attributable to a specific price the student set and can be named by them
(R14). It is bounded below, so it can never strand a seat (R5).

**CLASSROOM INTERDEPENDENCE.** Deliberately none during play — L1 is solo-operator plus class
aggregate. Adding a live rival here would be multiplayer for spectacle, which CLAUDE.md §8
forbids. The room matters at REVEAL, where a scatter that is *four different curves* becomes the
evidence.

**SIGNATURE BOARD MOMENT — THE SLATE BOARD.** Four panels, one per real market (R9 — never one
pooled cloud). Inside each panel, three columns: Tue / Thu / Sat. Each pair's single Round-1 price
is drawn as one horizontal line cutting all three columns, with the resulting bowl-fill under it.
The image the room sees: **the same line producing a sold-out bar on Saturday and a half-dark bowl
on Tuesday, over and over, in every panel.** Above the Saturday column, a resale ticker counts up
the money that went past the teams. Nobody has said the word "demand" yet.

**TEACHER FLOW (a stranger runs it).**
- *NOW:* "You run a box office. Read last week's book. Then read this week's slate. They are not
  the same week."
- *WATCH FOR:* pairs who lock in under 30 seconds (they read the Replay as a forecast — ask them
  which night the Replay is from); pairs who never touch the dial (ask what last Saturday cost).
- *DON'T EXPLAIN YET:* the word demand; the word elasticity; that Tuesday and Saturday have
  different curves. They must see the Slate Board first.
- *ASK (at REVEAL):* "Whose Tuesday was empty? Keep your hand up if your Saturday sold out. Look
  around — those are the same hands."
- *TRIGGER:* Round 2 opens only after that show of hands. Manual; never a timer.
- *SYNTHESIS:* the Slate Board is the whole lecture. Point, don't narrate.

**SYNTHESIS CHAIN.**
Dragging the dial and watching the Replay hump climb and fall, then locking anyway because tonight
is not last Saturday → the Slate Board's one line producing a sellout and an empty bowl in the same
panel (aggregate field: per-night fill % and price, faceted by market) → the Giants' 2010 dynamic
pricing and the ~$76B national deal that does not move (SR-13, SR-2) → **revenue**, **demand**,
*and the thing that moves demand besides price* → a bake sale on a rainy day, a movie ticket on
opening night, a flight priced by the date.

---

### LESSON 2 — "YOU DON'T PLAY ALONE"

**PLAY FANTASY.** *"I did everything right and my building is half empty, because of a choice
somebody four desks away made — and my best night was a gift from somebody else."*

**PRIMARY VERB — BOOK.** A discrete, irreversible capacity commitment made before you know what
other people will do. Structurally the opposite of L1's continuous private dial, and unrelated to
M1's allocate-under-cap, revise-with-cost, and bid-in-market verbs.

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MINUTES**

The class is the league. A four-night season; a deterministic schedule pairs the room so every
pair hosts roughly twice and travels roughly twice.

- **Beat 1 — THE SCHEDULE DROPS (3 min).** The grid goes up on the board: four nights, who hosts,
  who visits. Everyone can see everything. No hidden schedule.
- **Beat 2 — BOOK YOUR HOME NIGHTS (6–8 min).** For each home date, choose the room: **Your
  Building** (low rent, normal capacity) or **The Big Room** (the downtown arena — high rent,
  roughly 2.5× capacity, and a genuinely painful bill if it sits empty). This is not an allocation
  across a budget; it is a yes-or-no bet on how big a night is going to be.
- **Beat 3 — CALL YOUR SHOWCASE (2 min, simultaneous with Beat 2).** Pick exactly **one** road
  date to bring the full show. A showcase multiplies the host's gate. Your own return is
  exposure — playing in front of a full building grows *your* HOUSE for next lesson — and that
  return scales with **how many people are actually in the host's building**, which the host is
  choosing at the same moment, in secret.
- **Beat 4 — LOCK, then RUN THE SEASON (6 min).** Both decisions resolve simultaneously, night by
  night, teacher-paced. Congestion is real: two showcases landing on the same building do not
  double it — the room fills and both visitors get less exposure than either expected.
- **Beat 5 — THE SPLIT (4 min).** Every team's gate is broken into two bars: **what I earned**
  (my market, my price, my building) and **what the room handed me** (whose show walked in).

**SYSTEM THAT REACTS.** Gate = f(host market baseline, host's carried HOUSE from L1, room
capacity, visiting showcase status, congestion). Rent is subtracted. Both books again: THE DRAWER
(cash against a bill that now includes rent) and THE HOUSE (exposure grown or not).

**ECONOMIC MECHANISM.** C5 — joint product, and the contract is right that this is the most
valuable and least-known thing in the M2 space. The instantiation is exact: *my payoff is a
function of another seat's decision through the product, not through competition for a scarce
prize.* Nobody bids against anybody; nobody wins the thing the other one wanted. Both of us are
trying to produce the same night and neither can do it alone. C4 (market size — exogenous,
visible, never ranked) and C3 (revenue composition — the fixed national pipe is what keeps a
dark night from being fatal) ride along. C10 in its honest form: exposure is a cost now and a
crowd next lesson.

**REAL SPORTS CONTENT.** The reveal exhibit is SR-6, and it is the module's most spectacular real
number: **Indiana Fever home attendance went from ~4,066 per game in 2023 to 17,036 in 2024 —
and six opposing teams moved their Fever games into bigger arenas.** Six real front offices made
the exact decision the students just made, at the exact moment the students made it, and the
league those students just played was the reason. This is a cross-league exception that earns
itself under CLAUDE.md §3: no NBA case shows a visitor moving a host's building this cleanly, and
the WNBA one is current, verified, and dated. It is used as **exhibit, not world** — the operated
league stays NBA so the L1→L2→L3 franchise carries. SR-11 (Cleveland 2010 and 2014) is the
matched NBA version.

**HOW A NON-FAN SUCCEEDS.** Every draw rating is printed. "When the most exciting team in the
league comes to town, more people want to come" needs no fandom at all — it is the same sentence
as a popular band coming to your town, which is the beyond-sports link anyway.

**CONSEQUENCE & CONTINUITY.** Each team's L2 books — who cleared their bill, who did not, and
whose gate was mostly gift — carry into L3 as the *evidence the room legislates about*. This is
the module's load-bearing seam: L3's rule debate must be about a grievance the room personally
holds, not a hypothetical.

**CLASSROOM INTERDEPENDENCE.** Total, two-sided, and materially economic — which is the standard
CLAUDE.md §8 sets. Removing the other students does not make this lesson easier; it makes it
undefined.

**SIGNATURE BOARD MOMENT — THE NIGHT GRID.** Four nights across, host buildings down. Each cell
draws the building that was booked at its true relative size, and lights with the crowd that
showed. The image: **a small bright cell that sold out beside a huge dark cell that got rented for
nothing** — and then, when the showcases are overlaid, three showcase markers stacked on one
building and a good team's date sitting bare. Then the split bars. A small market that booked
honestly and priced well posts the room's best fill percentage while a big market that booked the
Big Room and drew nobody eats the rent — the small-market success path R8 requires, produced by
play rather than by assertion.

**TEACHER FLOW.**
- *NOW:* "Two things to decide, both at the same time, both before you know what anyone else
  chose. Which building for each home night, and which road night you bring the show to."
- *WATCH FOR:* everybody booking the Big Room (the room has not yet believed rent is real — do not
  warn them; let night one land); everybody showcasing at the biggest market (congestion will
  teach it better than you can).
- *DON'T EXPLAIN YET:* the word externality; that showcases congest; that the schedule was the
  point.
- *ASK (after the split bars):* "Point at the pair whose choice filled your building. Now point at
  the pair whose choice emptied it." — this is the moment; let it run long.
- *TRIGGER:* the SR-6 Fever exhibit lands only after the room has done its own pointing.
- *SYNTHESIS:* "You cannot play a game alone" is the sentence. It is also the whole industry.

**SYNTHESIS CHAIN.**
Booking the Big Room and watching it sit dark because a classmate took their show somewhere else →
the Night Grid plus the earned/handed split bars (aggregate field: per-team gate decomposed into
own-market and visitor-driven components) → the Fever's 4,066 → 17,036 season and six teams moving
buildings for one visitor (SR-6), with the Cleveland 2010/2014 NBA mirror (SR-11) → **shared
product**, **market size**, **spillover** (name "externality" only if the room is running hot) →
one great store bringing foot traffic to a whole mall; a group project where one person's work
sets everybody's grade; a street that empties when one shop closes.

---

### LESSON 3 — "WRITING THE RULE"

**PLAY FANTASY.** *"We wrote a league rule this morning. This afternoon I put my hand back on the
same dial from Monday, and it went somewhere else. Nobody told me to move it."*

**PRIMARY VERB — LEGISLATE.** Set a rule parameter for everybody, including yourself, then operate
under it. The L1 dial returns — deliberately, as the **instrument that measures the rule**, not as
a repeated lesson. This is stated to the room in those words.

**WHAT THE STUDENT ACTUALLY PLAYS FOR 10–30 MINUTES**

- **Beat 1 — THE GRIEVANCE (4 min).** The board opens on the room's own L2 books. Some teams
  cleared their bill on gate money they earned; some cleared it on gate money a classmate handed
  them; some did not clear it at all. Nothing is editorialized. The status quo is visibly failing
  somebody, which is the precondition the contract names for a rule debate not to collapse into
  do-nothing.
- **Beat 2 — WRITE IT (6 min).** One parameter: **what share of local gate revenue goes into a
  league pot that is split equally.** Each pair privately submits a share, 0–100% in 10% steps.
  Two anti-exploit devices, both real-world honest: the rule **must clear a supermajority** (so the
  more numerous market type cannot simply outvote the other — the sides have to trade and talk),
  and it **must pass a viability check** (no team may be left unable to field a product; the board
  runs the check live and says which proposals fail and why). If nothing clears, last year's share
  stands — and last year's share is the one that just failed somebody.
- **Beat 3 — PLAY UNDER IT (12–15 min).** One homestand. Same market, same L1 Box Office Counter,
  same three-night slate structure, same books. The only thing different in the world is the rule
  the room wrote. Set the prices. Lock. Reveal.
- **Beat 4 — THE COMMIT-THEN-REVEAL (5 min).** Before the numbers are discussed: the room is
  handed a real front office's books at a real decision moment and asked to commit — **Boston,
  June 2025: a championship roster, a projected salary-plus-tax bill north of $500M, one year
  after winning the title. Pay it, or break it up?** Pairs lock a position. Then the reveal: Holiday
  and Porziņģis traded inside 24 hours, ~$200M+ saved (SR-3). The counter-case lands in the same
  breath — Oklahoma City ducked the same kind of bill by trading James Harden in 2012, Harden
  became an MVP elsewhere, and OKC won the title thirteen years later. No matching score exists,
  and the reveal never says "correct" (R15).

**SYSTEM THAT REACTS.** Take = (1 − s) × own gate + equal share of pot + national money. The bill
is unchanged. **The HOUSE cost of a high price is not shared** — the crowd you lose is entirely
yours. That asymmetry is the whole mechanism: sharing taxes the upside of a high price and leaves
its downside intact, so **the price that maximizes a student's own take moves down as s rises.**
Same student, same market, same slate, different rule, different hand. *(Inferred, not verified —
this is the design's central arithmetic claim and §5 names the property test that must confirm the
sign and magnitude before anyone builds it.)*

**ECONOMIC MECHANISM.** C6 (revenue sharing, only now that C5 has been *felt* — the contract is
right that sharing taught before interdependence lands as charity or as taxation and teaches
politics), C7 (incentives, instantiated to the contract's exact bar), C8 (institutional design —
the rule is **executed**, and lands on the chooser's own books), C9 closing the module. The FL4
antidote is structural, not rhetorical: sharing must *raise the payer's own payoff through the
product* (a league where nobody can afford to put on a show has no shows to sell) **and visibly
dull an incentive** — at high s, the room's total revenue falls even as every team's take
converges. Both readable off the room's own numbers. The target sentence is not "sharing is fair."
It is **"sharing helped, and here is what it cost."**

**REAL SPORTS CONTENT.** SR-4 supplies the grievance in real numbers: the Lakers' ~$149M/yr local
media deal against the Grizzlies' under $10M in the same league year; 14 of 30 teams losing money
before sharing and 9 after; Memphis receiving the league's largest sharing check at ~$32M while
the Lakers still cleared ~$115M — dated to the 2016-17 leaked financials reported by ESPN in 2017,
and labeled as one leaked year, not current. SR-5 is the reveal that no invented league could
produce: **the Green Bay Packers are the only US major-league team that publishes audited books,
and their FY2025 report shows $453.2M per team in shared national revenue — the smallest market in
American professional sports, financially healthy, on somebody else's money.** Students predict
the fraction, then the actual document opens. SR-3 supplies the commit-then-reveal and the bridge
back to M1: *Module 1 was the wall. Module 2 is the prices around the wall.*

**HOW A NON-FAN SUCCEEDS.** "Some teams are in big cities and make more money; should they share?"
is decidable by an 11-year-old with no sports knowledge at all. The Packers reveal is a town of
320,000 people and a published PDF.

**CONSEQUENCE & CONTINUITY.** L3 closes the module and persists nothing forward. The rule the room
wrote is the artifact; it goes on the wall.

**CLASSROOM INTERDEPENDENCE.** Constitutive — the rule is written by the room, binds the room, and
is measured on the room. There is no single-player version of this lesson.

**SIGNATURE BOARD MOMENT — THE SAME HAND, TWICE.** Every pair's L1 price and their L3 price under
the rule, in their own market's panel, joined by an arrow. The room watches its own arrows point
the same direction. Beside it, one line: the league's **total** revenue, before and after — lower.
Two true things on one screen that a fifth-grader can hold at once: *we all moved, and we did not
all gain.* No team is ranked and no team is named (R13, D4).

**TEACHER FLOW.**
- *NOW:* "This morning you are the league office. You are writing one rule, and then you are
  living under it."
- *WATCH FOR:* the room converging on "fair" as a reason (that is politics, not economics — push
  with "what does it cost you?"); a deadlocked supermajority (that is not a failure, it is the
  lesson — name it and run the status quo).
- *DON'T EXPLAIN YET:* which share is "right." There is no right share, and at least two must
  survive the session with visible, different winners and losers.
- *ASK (at the arrows):* "Put your hand up if you priced lower today than Monday. Now — did
  anybody tell you to?"
- *TRIGGER:* the arrows go up only after the hands do. The Boston reveal is last, and it is manual.
- *SYNTHESIS:* "You wrote a rule and the rule changed what you wanted to do." That is the module.

**SYNTHESIS CHAIN.**
Setting a lower price under the room's own rule without being told to → the arrow board plus the
falling league-total line (aggregate fields: per-seat price delta L1→L3, and league total revenue
by share level) → the Lakers/Grizzlies gap and Memphis's ~$32M check (SR-4), the Packers' audited
$453.2M-per-team share (SR-5), and Boston trading a title roster in 24 hours to duck a bill (SR-3)
→ **incentive**, **revenue sharing**, **rules change behavior**, **unintended consequence** →
group-grade policies, pooled restaurant tips, taxes, a chores jar everybody draws from.

---

## 3. Dissent resolution

### Finding (1) — the pre-lock preview serves true attendance and revenue

**Conceded in full.** `boxOffice.ts:374` returns `revenueBreakdownFor(price, market, null)` and
`:389` calls the identical function on the identical inputs at REVEAL. The optimum is read, not
reasoned; REVEAL cannot surprise anyone; the concept-map line "the true demand curve is hidden" is
false as built. This is the most serious of the three because it hollows out the mechanic I am
advocating for.

**Repair — THE REPLAY DIAL.** The cheap fix is to delete the preview. I reject the cheap fix: the
live ripple is the only part of this mechanic anyone has ever claimed is fun, and trading the
product's joy for the auditor's checkbox is how a rigorous, dead lesson gets built. Instead, the
dial keeps its live, animated, hump-shaped readout — and that readout is computed against **last
homestand's actual crowd**, which is real data the student is entitled to, from a night that is
not the night they are pricing. Tonight's slate is announced and different: different opponent,
different day, sometimes a named star ruled out.

- **R2 satisfied.** The pre-commit view's payoff field is the demand function evaluated at the
  *prior period's* shifters. It is provably not the post-reveal computation on the same inputs —
  the assertion writes itself as `previewAt(p) !== resolveAt(p)` for every legal `p` whenever any
  announced shifter differs, which the slate generator must guarantee is always.
- **R3 satisfied.** The magnitude of tonight's shift is not derivable from anything on the
  student's screen. REVEAL carries genuinely new information for every seat, every round.
- **The economics improves.** Extrapolating from the data you have to the night you are actually
  selling *is the job* — it is what the Giants built software to do (SR-13). The repaired mechanic
  teaches the real task; the current one teaches sweeping.
- **Dominant-strategy check.** "Lock the Replay peak" is now a heuristic, not a solution: it is
  right only when tonight's mix matches last week's, which the slate generator must ensure is
  never true. The contract's own listed breaker — *a preview that shows last period's demand
  rather than this period's* — is exactly this repair, and I am adopting it by name.

### Finding (2) — sweet-spot pricing is optimal in both homestands for all four markets

**Conceded in full**, and the computation is right: two-homestand optima are sweet-spot H1 prices
for Legacy, Expansion, Riverside and Capital alike. There is no short-run temptation to resist, so
nothing about incentives is experienced and the claimed cash-now-vs-fans-later tension is fiction.

**Repair, and a correction to how it should be framed.** The tempting fix is to retune the zone
multipliers until the long-run optimum diverges. **I argue that fix is wrong** and would be
correctly torn apart at the next gate: with a single scoreboard, *any* one-objective price model
has this property, and a multiplier chosen to manufacture divergence is a fudge factor wearing a
mechanism's coat. The real repair is the contract's own **R4**, and it is structural:

1. **Two books that cannot be summed.** THE DRAWER (cash against a bill) and THE HOUSE (next
   period's crowd). Cash peaks at an interior price; the house is monotonically better as price
   falls. Below the cash peak the two books *always disagree* — that is the tradeoff, and it is a
   frontier rather than a number. No action is weakly best on both dimensions for any seat, which
   is exactly what R4 demands and what kills FL1.
2. **Goodwill responds to price against a public reference, not against the hidden peak.** The
   reference is last season's face value — visible, real, and set *below* the revenue-maximizing
   price. Pricing at the cash peak therefore costs house; pricing at the reference holds it. The
   myopic and long-run optima separate **by construction**, not by tuning, and the separation is
   economically honest: real teams price below the short-run revenue-maximizing point to protect
   renewals and fill the building for the television product.
3. **L3 completes it.** The sharing rule taxes the cash book and leaves the house book alone,
   which moves the optimum a second time — the same student, two rules, two prices (C7).

### Finding (3) — one market is unwinnable by construction after overpricing

**Conceded in full.** An Expansion seat in the over zone faces a $75,000 bill against a best-case
$52,500 at any legal price. A card the student did not choose decides whether recovery exists.
This is the finding I take most personally as an experience matter: a student with no live decision
left is a student who has stopped playing, and CLAUDE.md §1 is explicit that bad decisions stay
generally recoverable.

**Repair, in four parts.**
1. **The bill is market-scaled, not flat.** `PAYROLL_TARGET = 75_000` for everyone dies. A bigger
   building costs more to run — one legible line on the market card, and every market can clear its
   own bill at some legal price.
2. **The national pipe is the floor, and reality supplies it.** The ~$76B deal (SR-2) is precisely
   why no real team is bankrupted by one bad homestand. The playability guarantee and the economics
   coincide, which is the sign of a repair rather than a patch. FL8's obligation is discharged
   explicitly in the debrief: that money is payment for a product the league must deliver, and it
   buys the networks the start times and the schedule.
3. **The house multiplier has a hard floor**, so no reachable curve can fall below the level at
   which the bill is unreachable.
4. **Stated as a testable invariant.** For every reachable (market, house state, slate), there
   exists a legal price vector clearing that period's bill — brute-forced over the whole reachable
   space, exactly as M1 brute-forced cap inviolability across 17,408 build paths (D15) and ≥2
   affordable rescues (D17). The precedent for this class of proof already exists in the repo.

### R1–R16 disposition

| R | Disposition |
|---|---|
| **R1** No dominant strategy | Best price differs by night, by market, and by which book binds; "lock the Replay peak" fails whenever the slate differs, which is always. *Property test required — sweep the full price grid × markets × slates × house states.* |
| **R2** Commitment precedes information | Replay Dial: pre-commit readout is the prior period's shifters. Assertion: `previewAt(p) !== resolveAt(p)` for all legal `p`. |
| **R3** REVEAL carries information | Tonight's shift magnitude is underivable pre-commit, for every seat, every round. |
| **R4** Two non-collapsible scoreboards | THE DRAWER and THE HOUSE, from L1 beat 1 onward. Cash-max and house-max prices are different numbers by construction. |
| **R5** Recoverability | Market-scaled bill + national floor + floored house multiplier; brute-force invariant over the reachable space. |
| **R6** Symmetric error consequences | Overpricing costs house and empty nights; underpricing costs the bill **and hands the surplus to resellers, visibly**. Both penalties are cash-and-crowd, neither is moral. **Metric disputed — see below.** |
| **R7** Attributable exogenous movement | Every shifter is announced pre-decision and named at debrief. Zero RNG in the module. |
| **R8** Inequality exogenous, visible, unscored | Real markets, deterministically assigned by seat order, shown to the student, never ranked. The small-market success path is produced by L2's booking discipline, not asserted. |
| **R9** No pooled comparison without its controlling variable | The single scatter dies. Boards are **faceted by market**, with night as the second variable. |
| **R10** Every ledgered concept has an instantiation pointer | The ledger is rewritten to C1, C2, C12, C5, C4, C3, C6, C7, C8, C9, C10 with a named state transition each; anything that cannot name one is deleted, not restated. |
| **R11** Simplifications ledger | Mandatory entries: scaled dollars (with the real-scale multiplier on the board); **modeled** demand curves on real team names (Sports Reality's open item — the curves are modeled on real market differences and must never be presented as any team's actual demand); national money as a fixed pipe with obligations named; linear demand; three nights standing in for a season; no cost side beyond the bill; congestion as a simplification in L2. |
| **R12** Real anchor per lesson, non-load-bearing | SR-1/SR-2/SR-13/SR-11 (L1), SR-6/SR-11 (L2), SR-4/SR-5/SR-3 (L3). Every economics decision is decidable from the printed card. |
| **R13** No money leaderboard | No ranking anywhere; no comparative money on the board while any decision is open. L1's PLAY board shows lock counts only. |
| **R14** Path dependence attributable and non-fatal | The student can name the price that produced their house state; every opening retains a materially different decision. |
| **R15** Historical reveals | Boston 2025 with the decision-maker's information set, OKC/Harden 2012 as the counter-case that went the other way, no matching score, reveal never says "correct." |
| **R16** Complete synthesis map | Five-link chain given per lesson above, each naming the aggregate field that produces its class-evidence link. |

### The one repair I dispute

**R6, as literally metered.** I accept the finding — the current model's ~100× asymmetry teaches
a moral about greed rather than an economics of price, and FL3 is the most likely accidental
lesson in this space. I dispute the **metric**. R6 compares *payroll headroom* ($400 against
$44,000 for Legacy), but headroom is a level, not a penalty; a model can post wildly different
headroom levels while imposing near-identical costs for equivalent mistakes. The right quantity is
**regret**: the loss relative to the best action available, measured **separately on each of the
two books**. My proposed restatement, which I believe is stricter and more meaningful than the
original: *for every market and every reachable state, the regret from pricing N dial steps above
the frontier and N steps below it must be within the same order of magnitude on the cash book and
on the house book, checked independently.* Under a single-book model the original metric is
approximately right; under R4's two books it measures the wrong thing, and a candidate could
satisfy it while still teaching FL3.

---

## 4. What dies, what survives

**Survives.** The Box Office Counter as the spatial metaphor — one dial, one stadium-fill graphic,
one flowing total; the live drag ripple, retargeted onto history; server-authoritative pure
reducers with attendance and revenue **derived, never stored**; zero RNG; deterministic seat→market
assignment by join order (attributable, not `Math.random()`); the `zoneFor` → `roundTwoOpening`
pattern of banding a continuous self-set number into a categorical inheritance — rebound from a
moral zone to a goodwill level; the fictional-franchise board device from `draftDay`, now doing
double duty (see below); the teacher-triggered reveal with manual fallback; the ten canonical
phases.

**Dies.**
- The pre-lock true-value `preview` — finding (1)'s defect, replaced by the Replay Dial.
- `OVER_ZONE_DEMAND_MULT = 0.7` against an untouched underpricing curve, and the moral banner names
  EMPTY SEATS / CASH CRUNCH / RAISE OR HOLD — replaced by a symmetric goodwill response around a
  public reference price.
- `PAYROLL_TARGET = 75_000` flat for all markets — replaced by market-scaled bills.
- The four fictional Market Cards. Sports Reality's top finding is correct and this is the place
  it bites hardest: *"Riverside Market"* teaches the identical curve with none of the attachment,
  and no student has ever said "wait, I'm running THE KNICKS' box office?" about Riverside Market.
- The single pooled Class Scatter (R9) — replaced by market-faceted panels.
- `MERCH_PER_FAN = 5` as written — either raised until it visibly moves the optimum two dial steps
  or cut entirely. A $2.50 shift on a $5 grid is a decoration.
- One scoreboard (FL1) — replaced by two books.
- The two-homestand shape — replaced by three nights × two rounds, with the second round
  *expanding the action space* rather than repeating it.

**One new constraint the real names create.** With real markets on the board and ~6–15 pairs, a
market must be shared by **at least two pairs**, or "the Knicks" identifies a seat and `/board`
leaks seat-private data. Board dots therefore carry the fictional franchise handle, grouped under
the real market name — the `draftDay` device and the real-world mandate coexisting rather than
competing. In a class small enough that a market would be unique, the module must collapse to
fewer markets rather than reveal a seat.

---

## 5. Uncertainty list — Stage-0 prototype questions

**U1 (highest). Does the dial stay fun once the live number stops being the truth?** This is the
candidate's load-bearing bet and prose cannot settle it. The entire claimed joy of the current
prototype is the live hump; I am proposing it ripple over history instead of over tonight, and it
is genuinely possible that the felt experience collapses from *discovery* to *homework*.
*Falsifiable Stage-0:* build the dial, the Replay readout, the printed slate, LOCK and REVEAL —
no class layer, no board, no second round. Six pairs, one sitting. **Pass:** median pair moves the
dial ≥8 times before locking, and ≥half the pairs say something out loud about the *difference*
between last week and tonight before they lock, unprompted. **Fail:** pairs lock within 30 seconds
and read REVEAL as arbitrary. A fail here does not kill the mechanic — it means the Replay must
carry a second historical night so the student can see the shifter's *direction* from data — but
it must be discovered on a bench, not in a classroom.

**U2. Does L2's simultaneous book-and-showcase resolve as attribution or as noise?** Two coupled
decisions under mutual uncertainty is the most intricate thing in this design, and grade 5–6 pairs
in 50 minutes are an unforgiving test. If students experience the outcome as random, C5 is not
taught and the module's forced ordering breaks at its most important seam.
*Falsifiable Stage-0:* run one four-night season, paper or thin prototype, 8 pairs. Immediately
after the split bars, each pair writes down **which other team's decision moved their gate, and in
which direction**, with no teacher help. **Pass:** ≥70% correct attributions. **Fail:** below that,
and the visitor's showcase must become public-before-booking (hosts then price capacity against
known information, which costs the mutual-uncertainty beat but saves the attribution).

**U3. Does the rule actually move the room's hand, and for the right reason?** The design's central
arithmetic claim — that sharing lowers each student's own optimal price because it taxes the cash
book and not the house book — is inferred, not verified, and the *reason* students give matters as
much as the movement. If they move but explain it morally ("we're sharing now so I should be nice"),
the lesson has taught politics and FL4 has won.
*Falsifiable Stage-0:* a numbers-only harness, no UI. First, brute-force the take function across
share levels to confirm the optimal price falls monotonically in `s` and by **more than one dial
step** at plausible shares. Then, with 6 pairs, run L1's slate, adopt a share, re-run the identical
slate. **Pass:** mean price falls by >1 dial step **and** a majority explain the move in terms of
what they keep, without the word "fair." **Fail:** if the arithmetic does not move by a full dial
step, the signature board moment of the entire module does not exist and L3 must be rechartered
before anything is built.

---

## 6. Honest weaknesses — where this candidate loses the war

Ordered by how likely each is to be the thing that beats me.

1. **"It is one lesson stretched over three."** The dial anchors L1 and returns in L3; a rival can
   argue the module's real content is pricing plus two framings. My defense — that L3 uses the dial
   as an *instrument* rather than as a lesson, which is what makes C7 measurable at all — is
   genuinely strong, and it is also exactly the kind of defense that sounds better in a design
   document than it plays in a room. If L3's price movement is small (U3), this criticism becomes
   correct and this candidate should lose.
2. **The Replay repair may trade fun for rigor.** I have removed the one thing anyone liked about
   the existing build and replaced it with a subtler version. That is the honest shape of this
   candidate: it is a *more demanding* lesson than the prototype it evolves from. A rival built
   around a mechanic that needs no such repair starts ahead.
3. **L2 is the most expensive lesson here and the most likely to overrun 50 minutes.** It is also
   load-bearing — without C5, L3's rule is charity and the arc's forced ordering collapses. If L2
   has to be simplified under build pressure, this candidate degrades badly rather than gracefully.
4. **L2's booking verb has a family resemblance to M1 L1's allocation.** I argue it is a
   capacity bet against other people's choices rather than a division of a scarce budget, and I
   believe that; a fresh-context reviewer who has just played M1 may not, and their reaction is the
   one that counts.
5. **L3 can deadlock.** A supermajority that never clears is defensible as a lesson and thin as an
   experience, and a room that spends fifteen minutes voting has no economics in it. The named
   fallback — operating under a *given* league rule and arguing about it afterward — is a real
   safety net and a visibly weaker lesson.
6. **Real names raise an honesty burden fiction did not carry.** Modeled curves under real team
   names must be labeled modeled every time they appear, and a single slide that reads as "the
   Knicks' actual demand" is a founder-invariant violation, not a copy nit.
7. **The two books add cognitive load at exactly the age where load is scarcest.** Two scoreboards
   is the correct economics and the correct antidote to FL1. It is also one more thing for a
   fifth-grader to hold at 9:15 on a Tuesday, and a candidate that teaches the same truth with one
   scoreboard and a sharper hook deserves to win.
