# Module 1 Architecture Selection — decision record

Module 1 "The Cap" rebuild, Phase B. Decision by lead integrator on the evidence below.

Four architectures were designed independently from shared inputs (`FROTH_BRIEF.md`,
`NBA_FINANCIAL_TRUTH.md`, `PLATFORM_REALITY.md`, `VISUAL_TARGET.md`, `ECONOMIC_CONTRACT.md`)
and each shipped a Stage-0 L1 prototype. Three prosecuting lenses then attacked all four
without sight of each other: **Sports Reality**, **Economic Truth**, and **Player/Gameplay +
Classroom/Projector** (combined). Two of the three executed the prototypes' reducers headlessly
rather than reading them.

**The three lenses did not converge.** Each returned a different winner. A selection meeting was
not held, because a meeting cannot resolve a disagreement whose entire content is measurement —
what settles it is reading the three evidence sets against each other, which is what §3 does.

---

## 1. The war

- **A — `DESIGN_A_FRONT_OFFICE_UNDER_PRESSURE.md` (THE SUMMER / THE DEADLINE / THE BOARD MEETING).**
  You inherit a real front office's mess; the eight things that can go wrong this season are face-up
  from minute one, and the strategy is choosing which three you can survive. Market is contract
  slots at the league's real administered prices (NTMLE, room MLE, taxpayer MLE, BAE, minimums), not
  named players.
- **B — `DESIGN_B_THE_FRANCHISE.md` (TAKE THE JOB / THE DEADLINE / THE BOARD).**
  You inherit one real club's actual books three weeks before camp and stake claims — card × job ×
  tool, one claim per camp day, three days, against five modelled rival desks with real contention.
  Every club is held by at least two desks (THE TWIN DESK).
- **C — `DESIGN_C_CLEAN_ROOM.md` (JULY 1 / THE DEADLINE / THE WINDOW).**
  Clean-room design. You do not pick a player, you pick **which of five doors you pay through** —
  cap room, Bird rights, mid-level, small mid-level, minimum — each asymmetric in amount, term and
  what it destroys. Five real cap lines rendered as five different *kinds* of object.
- **D — `DESIGN_D_CHALLENGER.md` (THE WINDOW / THE FEBRUARY PROBLEM / THE LINE MOVES).**
  You do not hold a budget; you hold **a position relative to a line drawn in the same place for
  every desk in the room**, and over three lessons that line moves. Seven real free agents, one
  conserved shared pool, a typed dollar offer per signing day, permanent loss, in-model tie-break.

---

## 2. Evidence and verdicts

| Lens | Ranking | Ratings | Decisive finding |
|---|---|---|---|
| **Sports Reality** | **C > A > D > B** | C, A, D pass-with-repairs; **B BLOCKED** | B's central mechanic is impossible: eight real players **all under 2026-27 contract** are rendered as signable free agents, and the design's break turns on acquiring a **rookie-scale** contract with the non-taxpayer MLE, which no exception in the CBA can do (`b-l1.html:352-368`; §2.8). C is the only candidate whose payroll definition, citations and prototype agree with each other and with the dossier, and the only one that names the §7.10 volatility and Spotrac re-verification obligation. D "solves the hardest real-world problem in the set better than anyone" (deriving an unannounced future cap line from the real 10% rule as labelled module arithmetic) and is "the most definition-clean of the four" prototypes. |
| **Economic Truth** | **B > A > C > D** | B, A, C pass-with-repairs; **D BLOCKED** | Measured by exhaustive sweep of each prototype's own reducer. B is the only candidate where all-PASS is **strictly Pareto-dominated at 6 of 6 seats**, no outcome is weakly best at 5 of 6, the constraint legally binds at 6 of 6 (3–11 of 14 board cards unreachable at day 1), and money→outcome is inverted at every seat (4,866 of 5,656 reachable Detroit plans). D is blocked because **doing nothing is Pareto-undominated at all six seats** — holding tops MOST TOOLS LEFT and MOST ROOM LEFT, two of the five projector readings — and D's own guard is coded as beats-hold-on-*any*-dimension, the inverse of the contract's strict-domination test, so it cannot fail. C ships a seat where doing nothing is Pareto-optimal (Denver) and a seat that is outright solvable (San Antonio). |
| **Player / Gameplay + Classroom** | **D > B > C > A** | **D STRONG**, B STRONG, C FUNCTIONAL, **A WEAK** | Also measured by executing the reducers, plus a sweep of D's continuous human bid space. D is the only candidate where the student types a number and the number is the game: 9 distinct end states across 9 bids at Detroit, with a real winning threshold ($16.10M) well above the reserve ($14.30M) because a rival is on the same player. A, B and C are all select-from-list. D is also the only one shipping two decision variables at grades 5–6, the only one at or under the 40-word blocking-instruction budget, the only one with a real answer to D28 **in the model**, and the only one that fits 55 minutes with a genuine 10–15 minute debrief (45 played). A has no contested moment at all — a rival can only take a card the pair chose not to buy. |

### Three findings every candidate failed, which therefore cannot discriminate

1. **The persistence property P1 is unsatisfied in all four.** A's H1 state is refused by A's own
   `legalSign()`; B has no club whose out-year books land in the flip band, so no (A, H1, H2) triple
   exists; C prints $214,600,000 from a model that carries **no multi-year books at all**; D sites
   P1 on a Sacramento desk with **$0 of room** and an L1 model containing no holds, no cap-hold
   arithmetic and no renounce action. Persistence is a charter obligation, not a selection input.
2. **Every candidate ships at least one seat with no game** (A: Phoenix 2 / Memphis 2 outcome
   vectors; B: Denver constant; C: San Antonio 3/6, Denver 3/6; D: Sacramento 2/5).
3. **No candidate allocates the 55 minutes**, and **no candidate has produced executable evidence
   that the 7–8 band faces a different economic object** — only A has a band parameter in code and
   it is inert (the reachable frontier is byte-identical in both bands at all four seats).

### The finding that decided the war

Three of the four candidates put an **inheritance/inventory axis on the class reveal** — A's STILL
ABLE, C's THE RACK and ROOM TO MOVE, D's MOST TOOLS LEFT and MOST ROOM LEFT — and in all three that
axis is the mechanism by which passivity survives the domination test. Only B avoids it, and B
avoids it by **summing** into a composite scalar (`anchored(d)*10 + covered(d)`), which is §0's
defect at the prize.

---

## 3. The decision

**Module 1 will be built on Candidate D — `DESIGN_D_CHALLENGER.md`, "THE SAME LINE"** — with five
named grafts, each supported by a specific prosecutor's finding.

The lenses genuinely conflict, so the reasoning is stated in full.

### Where they conflict, and what the conflict actually is

Economic Truth ranks D last and blocks it; Gameplay ranks D first and rates it the war's only
STRONG. This looks like a contradiction and is not: **they measured different things.** Economic
Truth enumerated legal 3-day *plans* scored on D's five displayed readings. Gameplay swept the
*continuous bid space* scored on outcome identity — who you actually got. Both results hold
simultaneously, and together they say something neither says alone:

> **D's bid is the richest input in the war and D's five readings are the poorest register of it.**
> Changing your number changes who you get (9 end states from 9 bids) without changing `jobsClosed`,
> which is coarse. The defect is not the mechanic. It is that the reveal does not measure what the
> mechanic produces.

That reframing collapses D's three gate-level failures into two causes:

- **(i) Two of five reveal readings measure what a club *had*, not what it *did*.** This is the
  entire content of Economic Truth's block (holding tops MOST TOOLS LEFT and MOST ROOM LEFT, so
  all-PASS survives on the frontier at 6/6 seats) **and** the entire content of Gameplay's
  non-negotiable build condition (20 of 30 runs fail D's own three-distinct-clubs property; Detroit
  takes four of five readings in the modal case). **D itself already names this repair in §7**:
  "at least two of the five must be replaced by readings that describe what a club **did** rather
  than what it **had**," and "the property must be evaluated at real class size (12–16 desks), not
  at six." Three independent parties — two prosecutors and the design's own author — converge on
  one repair. No other candidate's fatal has that property.
- **(ii) The tool ladder is degenerate for over-cap clubs.** `availableTools()` offers the taxpayer
  MLE only at or above the first apron, which no seat reaches in L1, so an over-cap club's only tool
  above the minimum is the NTMLE. Economic Truth: this makes price and job-closing the same variable,
  which is why money→outcome is monotone at Memphis and Sacramento (rejection #7). Gameplay, without
  sight of that: all five strategies at the four over-cap seats spend exactly $15,044,000 because
  `reach()` clamps to the NTMLE, and the player is then decided by an invisible tie-break. Same
  defect, found twice, and the repair is to install an object **Candidate A already designed
  correctly** (see graft 5).

### Why not the other three

- **B is disqualified by the interaction between two lenses that neither could see alone.** Sports
  Reality's block goes to the object the student shops for the whole lesson, and the repair B names
  for itself (restrict the L1 board to exception- and minimum-priced contracts, move the named stars
  into L2's counterparty market) **deletes the very cards that produced B's first-place economic
  evidence**: the binding-limb result (3–11 of 14 cards legally unreachable at day 1) is driven by
  the presence of $43.9M, $49.5M, $39.5M and $27.5M cards that over-cap desks cannot reach. B's
  economics was measured on an artifact that cannot ship. Separately, Gameplay found B's shipped
  reveal ranks desks by two composite scalars — the precise thing B's own §12 Death 3 says does not
  exist anywhere in its model, payload or renderer, and the precise thing B's own §14 records as
  what made a dominant strategy appear at Detroit. That is §0's defect reproduced **at the prize**,
  which CLAUDE.md §8 and D4 make the reward system. What would settle B's case: re-running the
  full sweep on a lawful board. Until that exists, B's ranking rests on evidence about a model we
  are not allowed to build.
- **C is the best document in the war and its loop is below the founder's bar.** Sports Reality is
  right that C is the only internally consistent candidate and owns the best synthesis in the set,
  and Economic Truth is right that C's five-line ladder is the best cap-as-institution object
  anywhere — which matters, because C4 is the module's *title concept*. But Gameplay rates C
  **FUNCTIONAL**, and CLAUDE.md §5 states that FUNCTIONAL is below the bar for important Track 101
  experiences; M1 L1 is the most important experience in Track 101, because it is the first thing a
  student ever plays. Worse, C's central repair is rated **"Uncertain"** by Gameplay and, per
  Economic Truth, requires a founder call (move the tax line into L1, which reopens the §7.12 #2
  threshold budget). And C cannot detect its own dominance: its shipped probe fires only if one row
  equals the best value on all six columns at once, so it prints NO DOMINANT STRATEGY over the top
  of BALANCED strictly Pareto-dominating three plans at three of five desks. A base whose repair is
  uncertain, founder-blocked, and invisible to its own instrument is not the base. **C's best ideas
  survive as grafts, and two of them work better inside D than inside C** (below).
- **A is dead.** Its fatal is not repairable: `rivalsTake()` runs at window close and sweeps the two
  highest-priced *remaining* cards, so no pair can ever lose anything to a rival, and Gameplay's
  ruling is that fixing this means rebuilding A's centre panel as B's, C's or D's — a redesign.
  Independently, Economic Truth falsified A's central strategic premise (an allocation immune to all
  six pressure cards is reachable at Detroit for $21,494,000 of cap-room signings, two clicks from
  the default) and found the constraint does not bind at all at the seat A opens the module on
  (0 of 7 market slots unreachable at Detroit, day 1). Gameplay independently found A's intellectual
  reveal is never produced by A's own model (BALANCED and THE TRAP are byte-identical at 3 of 4
  seats). Two lenses, two methods, the same conclusion: A's arguments are in its prose and not in
  its model.

### What D is, after the grafts

D keeps its own spine: the conserved shared pool of seven real dated free agents with permanent
loss and an in-model tie-break (the incumbent's real 5yr/8% advantage, then remaining room); the
typed continuous offer, revisable until the day closes; the five real lines drawn in the same place
for every desk; the floor bill computed from the real 90% rule; the derivation of an unannounced
future cap line from the real 10% ceiling, labelled as the room's own arithmetic; the priced day-0
scaffold; camp contracts that do not spend your day. Grafted in, each on named evidence:

1. **From C — the five lines rendered as five different KINDS of object.** A compulsion (floor), a
   permission system (cap), a price (tax), a confiscation (first apron), a prohibition (second
   apron), each labelled on screen by what it *does*. Evidence: Sports Reality calls this "the
   dossier's own §2.1 'five genuinely different economic objects' rendered exactly"; Economic Truth
   calls it the best cap-as-institution object in the set, satisfying C4's ladder limb and FL2 "by
   construction rather than by tuning." D already draws all five lines; it inherits C's semantics
   for them, not C's screen.
2. **From C — the frozen `foregoneAtLock` receipt and THE SAME PLAYER COST EVERY DESK A DIFFERENT
   THING**, as L1's opportunity-cost surface: one player, three-plus desks that chased him, the three
   frozen forgone lists side by side. Evidence: Gameplay calls it "the best single idea in the entire
   set," and it is CEE grade-8 subjective-opportunity-cost with no percentage in it. **It belongs in
   D, not C** — C's own tie rule (e) sends contested players back to the pool unsigned, starving the
   beat, while D's tie-break always awards a contested player, so the beat always has content.
3. **From B — THE SAME MOVE, TWO BOOKS** as L1's intellectual reveal: the identical signing at the
   identical price, one club now walled at $209,015,000 and one $40M below it, then "Both of those
   are legal. In February, only one of them can make a trade." Evidence: Gameplay calls it "the only
   intellectual reveal that both lands and always fires," against D's floor bill, which "only fires
   if a desk is passive" and whose empty case D's own director already scripts. D's floor table is
   retained as the CONSEQUENCE beat with a near-miss default.
4. **From B — the director voice wholesale, and THE TWIN DESK.** The NOW / WATCH FOR / DON'T EXPLAIN
   YET register ("do not answer that question — it is L2's whole lesson and you will spend it here if
   you answer it"). Evidence: Gameplay rates B's teacher-facing writing best in the set and calls it
   "a director, not a lesson plan," which is CLAUDE.md §4's standard. THE TWIN DESK (every club held
   by ≥2 desks) plus its falsifiable P-TWIN property is, per Sports Reality, "a genuine answer to the
   'inheritance decides the outcome' risk that no other candidate has" — and it is the instrument
   against the dead seats every candidate shipped.
5. **From A — THE POCKETS, plus A's two honesty disciplines.** The named, countable exception rack
   with real amounts, real eligibility rules and real side effects, as the repair for D's degenerate
   tool ladder. Evidence: Gameplay calls THE POCKETS "the correct object," and both Economic Truth
   and Gameplay independently found D's ladder collapses to one answer for over-cap clubs. Also
   grafted: A's invented-constants header (Sports Reality: "the most honest artifact in the set"),
   and A's rule that **no real person is ever a decision object unless the situation is dated and
   sourced** (Sports Reality: "the strongest fandom-neutrality guarantee in the set"), which is the
   direct answer to D's worst real-world blocker.

This is a base plus five sourced grafts. It is not a design average: no element is included because
two designs shared it, and no element is blended with a competing element.

---

## 4. Killed

Sunk cost gets no vote. All four documents cost the same to produce and three of them do not ship.

- **Candidate A's module.** Killed on two independent falsifications of its own central claims —
  its strategic layer ("no reachable allocation absorbs more than four of the eight cards") is false
  at the seat it opens on, and its intellectual reveal (THE TRAP separating from BALANCED) is never
  produced by its own model — plus a fatal that Gameplay ruled a redesign rather than a repair: no
  pair can lose anything to a rival. Also: the constraint does not bind at its flagship seat, two of
  five reveal columns carry no information, percentages render to a grade-5 screen against A's own
  claim that nothing computes one, and it overruns the period with a 3-minute debrief.
- **Candidate B's module.** Killed on the Sports Reality block — the object the student shops does
  not exist, and the repair removes the evidence that made B first on economics — compounded by the
  composite-scalar reveal, which reproduces §0's defect at the prize, and by three simultaneous
  decision variables at grades 5–6 in a prototype with no band switch in it at all. B is the best
  *model* in the war and it is a model of a league that cannot exist.
- **Candidate C's module.** Killed as a base, not as a source. FUNCTIONAL is below the founder's
  bar for a Track 101 flagship (CLAUDE.md §5); doing nothing is Pareto-optimal at one seat and
  another seat is outright solvable; the obvious strategy Pareto-dominates three alternatives at
  three of five desks; its own dominance instrument is constructed so it can essentially never fire
  and prints a false all-clear; and it carries no multi-year books, so it cannot hold a persistence
  property at all. Four of its ideas survive in §5 and §3, which is more than any other loser.
- **The discarded Module 1 implementation** (`freeAgency.ts`, `tradeDeadline.ts`, `draftDay.ts` as
  M1 lessons). Already superseded by this rebuild's premise; this selection confirms it. Code
  removal belongs to the build wave. The three patterns worth keeping from it are named in §5.

---

## 5. Survives as patterns, not code

From the losing candidates and the discarded module. Patterns, not implementations — nothing here
is a copy instruction.

- **A's contract-slot market at administered prices** (NTMLE / room MLE / taxpayer MLE / BAE /
  minimums, each with a role, one strength, one risk). Not the L1 board — but it is the fandom-proof
  fallback if the non-fan test in BC-6 fails, and it is the correct shape for any tier of the board
  that must not depend on a real person's situation.
- **A's face-up pressure deck** as raw material for L2's shock surface: eight named, dated,
  real-anchored things that can go wrong, visible from minute one so that choosing which you can
  survive is a decision rather than a surprise.
- **A's withheld outcome dimension** — a book computed by the same reducer and never shown during
  PLAY. Economic Truth calls it "the only real answer any of the four gives" to the pre-commitment-
  view rejection. Carry the discipline: at least one displayed dimension must be underivable before
  commit.
- **B's refusals-as-the-teaching-surface framing** for L2: a counterparty with its own binding
  constraint and its own objective, refusing with an economically legible reason.
- **B's TIME CUT fallback writing**: per-desk `fallback` / `selfFallback` sentences that name, in
  the second person and before the close, exactly what waiting costs.
- **C's DOOR framing** — "you do not pick a player, you pick which door you pay through." The
  sharpest single sentence in the war and the correct economics. It is the right way to *name* the
  tool choice inside THE POCKETS at 7–8, even though C's screen is not being built.
- **C's registered-simplifications format**: ten rows, each carrying what changed, why, the
  misconception risk, and a mitigation.
- **C's §7.10 volatility discipline**: naming fragile figures as fragile and owing a dated
  re-verification pass, instead of spending them as beats.
- **From the discarded module**: `foregoneAtLock` (already grafted), permanent-loss poaching
  (`draftDay.ts:286-300`, already D's spine), the honest publication rule (only a consummated deal
  publishes its price; losing bids stay private forever), and `adaptBudgetFor`'s discipline that
  repair budget is computed by the *same* arithmetic as an ordinary purchase.

---

## 6. The binding build charter

Falsifiable conditions the build wave inherits. The build is not done while any is unmet. Each is
traceable to a named prosecutor finding or contract clause. "Swept" means exhaustive enumeration
over the reachable action space, per seat, at real class size — never a canned strategy table,
which is the instrument that produced false all-clears in A's, C's and D's own probes.

**Discharging the winner's blockers**

- **BC-1 — The reveal measures what the desk DID.** MOST ROOM LEFT and MOST TOOLS LEFT are removed
  as class-facing readings. At least three of the five readings must be functions of actions taken
  in the window, not of inherited position. *Falsifier:* any reading whose value is computable from
  the seat's opening state alone. (Economic Truth's block; Gameplay's non-negotiable condition;
  D's own §7.)
- **BC-2 — All-PASS is strictly Pareto-dominated at every seat.** Over the swept reachable action
  space, PASS/PASS/PASS must be strictly dominated by at least one active plan at **every** seat, on
  the displayed dimensions. The guard is a strict-Pareto test; the beats-on-any-one-dimension form
  (`r.jobsClosed > hold.jobsClosed || r.jobYears > … || r.floorBill < …`) is deleted, and so is any
  all-columns-simultaneously test of C's shape. Additionally: no TIME CUT fallback may dominate that
  seat's best available action. (Rejections #6; Economic Truth on D and C; Gameplay on C's probe.)
- **BC-3 — The tool ladder is real.** Every over-cap seat must have ≥3 legally reachable tools at
  L1 day 1, including ≥2 price points strictly between the minimum and $15,044,000. *Falsifier:* any
  seat whose reachable spend set collapses to a single value, or any seat where drawing the hard cap
  is unavoidable rather than chosen. (Economic Truth: degenerate ladder → monotone money→outcome;
  Gameplay: all four over-cap seats land on exactly $15,044,000. Graft: A's POCKETS.)
- **BC-4 — No money→outcome monotone, and the class evidence proves it.** At every seat there must
  exist reachable plans where a cheaper allocation beats a dearer one on a displayed dimension
  (FL1a), and CHEAPEST JOB CLOSED must have a real instance from the room's own play at every seat
  (FL1b). *Falsifier:* Memphis 0/211 and Sacramento 0/76, as measured. No prize formula anywhere
  puts spend in a denominator (§0).
- **BC-5 — Every narrated moment is producible by the shipped reducer.** A replay test walks each
  named beat in the design document and asserts the model reaches that state. *Falsifier:* Break 1
  as written — a club signing at $26.75M "using its non-taxpayer mid-level exception plus room,"
  which is illegal under the CBA (§2.4), illegal under `pickTool()`, and unreachable for any
  over-cap club (Turner's reserve $17,387,500 exceeds the NTMLE ceiling). Found independently by
  Sports Reality and Economic Truth. (Rejection #14.)
- **BC-6 — Fandom neutrality is tested for outcome parity, not legality parity.** No single
  historical class may exceed one card in seven on any board; every decision-relevant risk is printed
  on the card so hindsight adds nothing a non-fan can't read; and **no real person is a decision
  object unless the situation is dated and sourced** (A's rule). The pre-Stage-1 test is run against
  three non-fan adults and must show they reach the same *outcomes*, not merely the same legality
  set. *Falsifier:* D's L3 finale as designed, which states the reveal depends on the student not
  recognising the 2016 class. (Rejection #27; CLAUDE.md §3; §7.12 #7.)
- **BC-7 — One payroll definition, printed beside every payroll, never mixed.** Declared once,
  asserted by the claims audit against every rendered figure. *Falsifier:* Denver at $227,422,947
  and "$11,354,447 over the second apron" (SalarySwish cap hits) under a declared HoopsHype
  roster-salary definition; under D's own definition those are $226.68M and $4,994,000. (§8.2 #12.)
- **BC-8 — No luxury-tax dollar bill on any surface.** Boston's leverage shape is kept ("a small cut
  in salary produced a much larger cut in the bill"); the ~$35,000,000 figure is dropped or held
  teacher-side pending the CBA Article VII read. (§8.2 #5; contradicts D's own S1 and C's own S7.)
- **BC-9 — No lesson beat rests on a volatile figure.** Seat figures live behind a dated,
  re-verifiable data file with a stated refresh cadence and a browser spot-check against a second
  tracker before any class; no beat may rest on a figure inside a stated volatility band (SAS
  $37,083, PHX $1,736,556, OKC $2,820,601). *Falsifier:* D's L1 facts table printing San Antonio at
  $37,083 over the tax line with no refresh mechanism. (§7.10; graft: C's discipline.)
- **BC-10 — No NBA figure is printed for a season the league has not announced.** Future-year lines
  are derived by the class from the real rule (may never fall; may never rise more than one tenth),
  labelled "this room's number, worked out from the real rule — it is not a league figure" at every
  appearance, and registered in the ledger. (D's §4.3.1 / S6, prescribed by Sports Reality as the
  correct treatment and as C's required repair.)
- **BC-11 — The intellectual reveal always has content.** L1's intellectual reveal is THE SAME MOVE,
  TWO BOOKS, and a sweep of reachable class states must find no state in which it is empty. The floor
  table is retained as the CONSEQUENCE beat, defaulting to the near-miss table rather than announcing
  that nothing happened. (Gameplay: D's floor bill fires only if a desk is passive; graft from B.)
- **BC-12 — The trap must be expressible.** The canned strategy set includes a shade-and-lose plan,
  not a multiply-the-bid plan, since `Math.min(want, reach(c))` clamps before any multiplier and makes
  overbidding byte-identical to spending normally at all six seats. (Gameplay.)

**Dominant-strategy breaker, seats, and the reveal**

- **BC-13 — Which REASONING TEST limb, declared and swept.** The build declares which of (a)–(e) it
  satisfies and proves it: (e) by showing another desk's decision changes what this desk can get, and
  (c)/(d) by a second binding constraint. The Pareto frontier per seat must hold **≥4 distinct
  reachable outcome vectors**, so the mechanic delivers a genuine choice rather than a three-position
  menu a pair enumerates in minutes. (Contract §1; Economic Truth's war-wide frontier finding of
  1–6 vectors across all four candidates.)
- **BC-14 — No dead seats, and inheritance does not decide the outcome.** Every seat is swept for
  distinct reachable outcome vectors and any seat below the BC-13 floor is reshaped or demoted to a
  projector case. Every club is held by ≥2 desks (THE TWIN DESK), and **P-TWIN** must clear: for
  every club and every displayed dimension, within-club spread across the reachable strategy set ≥
  between-club spread of any single fixed strategy. (Gameplay: all four shipped a dead seat; graft
  from B; FL4.)
- **BC-15 — No single winner on the reveal.** No scalar team quality, franchise value, OVR, rank or
  award exists in the model, the payload or any renderer — grep-assertable, and specifically no
  combining function of the `anchored*10 + covered` shape. **≥3 distinct desks must top the five
  readings**, swept at 12–16 desks and not at six. No comparative money on the projector while any
  decision is open. (D4; §0; Gameplay: 20/30 runs fail at six clubs and B ships the combining
  function its own design says cannot exist.)

**Bands, scaffolding and the seam**

- **BC-16 — The 5–6 front half is scaffolded, and round 2 differs in kind.** Day 0 is run with the
  class on a stand-in club, budgeted at ~4 minutes, resolved against two scripted rivals so the room
  sees one win and one loss before anything is at stake. Day 1 must be structurally different from
  day 0, not the same card with new numbers. At 5–6: **≤2 decision-relevant variables on screen at
  once**, ≤40 words of blocking instruction before the first action, no load-bearing percentage,
  ratio, negative number or probability, ≤2 new terms and none named before the phenomenon is
  produced. (Rules 1/3/6/10; rejections #21, #22, #23; Sinha & Kapur; contract §5 Family 4's
  "wait for the teacher" breaker.)
- **BC-17 — One reducer, two bands, and the band must face a different object.** Given the same
  actions from the same state, both bands resolve identically — asserted by a differential test. And
  the reachable outcome frontier must **differ** between bands at every seat, or the band dial is
  inert. *Falsifier:* A's dial, which narrows the pool 7→5 and leaves the frontier byte-identical at
  all four seats; and B, C and D, which contain no band parameter at all. (D22 program #2; contract
  §6; rejection #19.)
- **BC-18 — The seam attaches at exactly three points, and a cross-band carry is never silent.**
  (a) `createSession` input carried onto the session row; (b) the `initialState` context each module
  receives (D38's two); **(c) a band stamp on the seed envelope itself**, because the envelope is
  exactly `{lessonModuleId, state}` and a 7–8 room seeded from a 5–6 L1 today looks well-formed and
  is accepted with nothing in the runtime able to notice. A cross-band carry is refused or honestly
  relabelled as stock, asserted by test. (PLATFORM_REALITY §3.3; rejection #20.)

**The carry**

- **BC-19 — P1 exists, replayed, or persistence is narration.** There must exist a specific L3
  action **A** and two L1 histories **H1** / **H2** such that A is refused under H1 and applied under
  H2, with the refusal naming the L1 decision — asserted by replaying the reducer over both branches.
  This obliges the build to add what D's L1 lacks: **multi-year books, cap holds, and a renounce
  action**. Companions all required: **P2** every seed field has a reachable consequence on its own;
  **P3** recoverability brute-forced over the whole reachable carry space including every seeded
  opening and the honestly-labelled stock franchise; **P4** attribution — at 5–6 the causal sentence
  is computed from the carried field, at 7–8 the information needed to diagnose it is present on the
  surface. No carry may blank a pair's franchise identity. (Contract §7; all four candidates failed
  P1; Economic Truth on D's Sacramento seat.)

**Truth of what is rendered, and the room**

- **BC-20 — The claims audit is an instrument, not a review.** Every rendered quantitative claim on
  `/play`, `/teach` and `/board` is produced from computed state through a path a test can walk — no
  bare template literals in synthesis or reveal bodies, which is why three false projector claims
  survived four verification rounds. `clientClaims.test.ts` is extended with FL7's forbidden
  vocabulary (greedy, reckless, brave, smart, disciplined, correct, best value) and with §8.2's
  do-not-render list. Per-beat payload gating is asserted by looping every beat and requiring each
  key `undefined` before its beat. (§0; PLATFORM_REALITY §9.4; D26/D47.)
- **BC-21 — The ledger, and the two decisions it must contain.** Registered simplifications carry
  what changed, why, the misconception risk and a mitigation (C's format), and an invented-constants
  header names every module-owned number as "this module's own rule, not an NBA fact" (A's format).
  Mandatory rows: **which of the five thresholds the lesson dropped** (§7.12 #2), the
  roster-salary-vs-cap-hit definition choice (§7.12 #1), and any trade rule run as a module rule
  rather than the CBA's (§9.1 — no matching percentage is rendered anywhere). Both mandatory rows
  are logged as numbered decisions in `PRODUCT_DECISIONS.md`. (Rejection #17.)
- **BC-22 — Dead air has a stake, and the period has a budget.** A committed pair always holds a
  free, changeable, consequence-bearing action until the day closes (camp contracts that do not spend
  the day; a revisable offer), plus an aggregate N-of-M room line that never names a seat. The lesson
  ships an allocated minute budget totalling ≤50 minutes played inside a 55-minute period, leaving
  7–15 for debrief, and the `/teach` director carries it in the NOW / WATCH FOR / DON'T EXPLAIN YET /
  ASK / TRIGGER / SYNTHESIS register. (D28; CLAUDE.md §1, §4; Gameplay: no candidate allocated the
  55 minutes.)
- **BC-23 — Three surfaces, and the board carries nothing private.** `/play`, `/teach` and `/board`
  are separate; `boardView` is structurally never handed a seat identity; no student-private datum is
  reachable on `/board` or from another seat's `studentView` before or after any reveal. The
  audit-only league table that renders every club's payroll on the student device in the Stage-0 file
  does not ship. (CLAUDE.md §11; rejection #28; Gameplay: no prototype separates the surfaces, so the
  privacy claim is currently untested rather than passed.)

---

## 7. Open questions for the founder

Only questions the evidence cannot settle.

1. **How many of the five lines does L1 carry, and at which band?** The Economic Contract says a
   grades 5–8 lesson can carry three lines at most and 5–6 should carry two, of two different kinds
   — and the contract itself records this as "an explicitly unmade decision that must be logged in
   `PRODUCT_DECISIONS.md`" (§7.12 #2). C and D both render five. Sports Reality and Economic Truth
   both rate the five-line ladder as the war's best cap-as-institution object; Gameplay independently
   measures the resulting screens as roughly twice the 5–6 text budget. The evidence supports both
   readings because they are answering different questions. This is a pedagogy budget, not a
   measurement, and it needs a founder call before BC-1 and BC-16 can both be satisfied.
2. **Open sequential bidding at 5–6, or hidden simultaneous in both bands?** Design Rule 12
   prescribes the split and rates *itself* LOW confidence; §7.11 records that Rules 12 and 15 have
   no source at all and recommends playtesting both variants at 5–6. D ships a sealed typed number
   in both bands. No sweep can settle this — it needs a room. The founder should decide whether the
   first classroom rung runs both variants at 5–6 as a deliberate comparison, or whether 5–6 ships
   open-sequential by default and the comparison is deferred.
3. **Does the module admit its staging out loud?** Every candidate with a player market places real
   people in a July 2026 free agency none of them was in. Sports Reality's proposed repair is to say
   so on the student surface in the module's own voice ("these are real contracts real clubs really
   signed, on the dates shown; we have put them in one window so you can shop them") and register it.
   The alternative is a board restricted to genuinely-available dated free agents, which shrinks the
   board, weakens BC-13's frontier requirement, and costs the 2016/2025/2026 growth triple that FL9
   and C16 both depend on. This is a product-voice decision about honesty with students, which is the
   founder's, not a prosecutor's.

Nothing else in the record is unsettled by evidence. Every other disagreement between the three
lenses resolved on inspection, and the resolutions are recorded in §3.
