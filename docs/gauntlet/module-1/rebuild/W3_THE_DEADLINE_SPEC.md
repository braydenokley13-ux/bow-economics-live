# W3 — THE DEADLINE spec

<!-- Written from the experience-director's inline delivery, 2026-09-04. Design authority: D59, D50. -->

> **Integrator rulings on §14 and the recorded dissent (provisional, for the founder to confirm or overturn):**
> 1. **Build proceeds.** The sweep problem (TRADE_MECHANIC_FROTH §6.1) is not closed. Week 3 ships on an honest conditional property over a DECLARED family of modelled market environments — the family is printed with every sweep result, and the gauntlet records "proven for these environments, argued beyond them". The director's dissent is recorded here, not absorbed.
> 2. **Collusion between friends is live economics**, contained by visibility, the job-based settle and the Boardroom; no pair-transacts-twice rule for the first build. Revisit after the first classroom.
> 3. **Two market hours.** The ending is protected over a twice-refused desk's second life.
> 4. **The season settles BEFORE the Boardroom** (as the spec chose).
> 5. **The Clippers cap-circumvention material stays out** of Track 101 for now.
>
> **Contract note:** the runtime's Press Conference primitive owns the pause and the spotlight seat; this module contributes `spotlightView(state, seatId, phase)` and `pressCandidates(state, phase)`. `teacher:pressConference`/`resume` in §7 map onto the runtime's `pressConference`/`endPressConference` controls, not module hooks.

## W3 — THE DEADLINE · implementation-ready spec (`m1l3-the-deadline`)

*Grades 5–6 and 7–8, both bands designed here (D59 ruling 2). 60 minutes, protected ending (D59 ruling 7). Module 1 finale; the Front Office Review and the second Press Conference land here (Bible §15, §12.1C).*

### 1. Fantasy and the student's sentence

The student's sentence for the course is **"I ran an NBA franchise"** (D59). Week 3's sentence is narrower and harder: **"On deadline day I had to decide what my team actually was — and somebody across the room had to say yes."**

Weeks 1 and 2 were you against the world. Week 3 is the first week where the thing standing between you and what you want is *another eleven-year-old with their own books and their own hole* (CLAUDE.md §8: student-to-student only when another participant materially changes the economics; D59 names W3 as exactly that case). You are not shopping. You are asking a person for something they do not have to give you, using only things you yourself decided to own.

The room's target feelings, in order: **"He has exactly what I need."** → **"Wait — they said no."** → **"We're three million apart."** → **"They took Detroit's deal instead of mine."** → and after the season settles: **"That worked."** or **"I paid a pick for that."**

The hook is the deadline clock, not the money. HQ goes to deadline dressing: two hours on the wall, THE MARKET strip, a phone that only lights when a real offer arrives (D50 standing constraints).

### 2. The market

**Exact tradeable object types — two, and only two (D59 ruling 1).**

1. **`contract`** — a contract *this room signed* in Week 1 or Week 2. Unique room-wide by construction (`taken` is room-wide in `sameLine/engine.ts`). Fields: `contractId`, `name`, `role` (BIG/WING/GUARD), `annual` (the salary that counts in matching), `yearsRemaining`, `jobState` (DOES THE JOB / MORE THAN THE JOB / DOES NOT DO THE JOB, from Week 2), `holderSeatId`.
2. **`pick`** — the franchise's **own** future draft pick. Two per desk: OWN FIRST (2029) and OWN SECOND (2030). **`$0` salary** (NBA_TRADE_TRUTH §4: picks count zero incoming and outgoing). Labelled by franchise permanently — "Detroit A's 2029 first" stays that name in every later week.

**Never a trade object:** any incumbent NBA player on a club's opening books (D59 ruling 1). Those are *books*, not inventory — public, readable, part of your problem, not part of your stock. Also never: cash, dead money, another franchise's pick, a pick you already sent.

**Composition.** The composer is **generated from the intersection of the two books**, never validated against them after the fact (NBA_TRADE_TRUTH §"One thing NOT to simplify": a rule that only speaks after the click is a bureaucrat). Objects you cannot legally receive are visibly out of reach, greyed, no modal.

- **5–6 — two controls exactly** (`maxVariables: 2`): **WHAT I SEND** (one object) and **WHAT I WANT** (one object). One readout: two bars, OUT and IN; the IN bar cannot pass the OUT bar. Choosing the counterparty is navigation (a club tile), not a third variable.
- **7–8 — three controls** (`maxVariables: 3`): send up to **two** objects (aggregation), want up to two, plus the pick toggle. The second outgoing contract is where the aggregation wall bites.

**Accept / counter / decline** (D50 ruling 5, which overturns the froth's no-counter selection): `OFFER → ACCEPT | DECLINE | COUNTER → FINAL ACCEPT | FINAL DECLINE`. Exactly **one counter per negotiation**, and the counter may change **exactly one piece** of the package (swap one requested object, or add/remove one `$0` pick) — one control, one turn. Decline requires a reason chip and is **private forever** (froth §4.1: intentions are the seat's; books are the league's).

**Budget:** ~**two live outgoing proposals** per desk (D50 ruling 4) and a **three-offer live inbox cap**. A fourth proposal bounces to the sender: *"Detroit's desk is full. Try somebody else."* That is scarce attention priced, which is this week's third anchor economics (D59 mapping).

**Escrow:** every object named in a live offer shows on its owner's roster as **IN A DEAL** and cannot appear in a second live offer. Without it one contract is sold twice (froth §5).

**`bookVersion`** per desk, bumped on every executed trade, carried on every offer. A stale accept is refused in the lesson's voice: *"Boston's books changed after they sent this. The deal is off."*

**The clock as a TIME CUT round** (`RoundContract`, `lessonModule.ts:214`):
```
closeHook: "teacher:closeHour"
noun: "hour"
currentKey: PLAY && !marketClosed ? `hour-${hour+1}` : null
fallbackPolicy: "An offer nobody answered expires when the hour ends. Nothing is
  accepted for anybody and nothing is charged. The offer is gone, the players come
  out of escrow, and the desk that sent it gets its slot back."
```
`unresolved()` names, per desk, in the teacher's words and the desk's own second person: *"Boston A — 2 offers sitting unanswered; both expire"* / *"You have 2 offers waiting. If the hour ends now, both expire and you keep everything."* **Silence is never an auto-decline and never an auto-accept.** A desk that never answers loses the hour, not its roster — and its refusal count stays zero, because it refused nothing.

**Contested objects — sealed and deterministic.** Offers and accepts are **sealed within the hour**; nothing settles on arrival time (froth §5; D59 records arrival-time tie-break as a retired defect at `freeAgency.ts:850`). At the close the server settles. At **5–6** the reducer refuses a second live accept ("You already have a deal on the table this hour"), so no contest arises. At **7–8** a desk may accept more than one, and **one trade per desk per hour** clears. The rule is printed on the accept control *before* the click and resolves in this fixed order:

1. the deal that fills an **open job** the accepting desk actually holds;
2. then the deal with the **larger outgoing salary** from the accepting desk;
3. then **world club order** (`CLUBS` array order), then twin index 0 before 1.

The deal that does not clear is voided as **"the books changed"** to both parties — which is the real thing (NBA_TRADE_TRUTH §7: the July 2026 four-team knot, Phoenix frozen behind Charlotte behind Minnesota).

**The projector mid-market.** `boardView` is structurally never handed a seat identity. It shows: the hour clock; **ON THE MARKET — 11 contracts, 6 picks**; the *names* of listed objects with their holding club label; and per object an interest count (**THREE DESKS ARE TALKING TO DETROIT**). It shows **no price, no package terms, no salary comparison while a decision is open, no refusal, no in-flight offer** (froth §5). Executed deals appear as broadcast cards, never as a transaction table (D50 ruling 7).

### 3. Legality the server enforces

Every rule below is drawn as terrain before the click, never fired as a verdict after it.

**R1 — Salary matching: room-absorption.** *Citation:* NBA_TRADE_TRUTH §1.4 (CBA Art. VII §6(j)(3), OBSERVED, three sources) and §THE SMALLEST HONEST SIMPLIFICATION rule 1; superseded per D61. A receiving desk may take back salary up to what its own room absorbs: **OUT bar = salary sent + max(0, cap − (committed − sent))** (`market.ts` `outBar`). A desk that ends the trade over the cap can only match — 100% of what it sends, no cushion; a desk with cap room can absorb more than it sends, up to that room. *5–6 simplification:* the tightest true band, no percentage, no `$250,000`, no ladder — two bars, one for a desk over the cap (match), one for a desk with room (absorb). *Why it's honest:* it is the real rule for every over-first-apron team, so BOW produces **no false positives**; real below-apron clubs get 125%/200% bands, simplified here to the room-absorption arithmetic itself. *Misconception risk:* the risk this rule avoids is "cap room is worthless in a trade" — room now visibly buys extra incoming salary; the risk still carried into the debrief is students believing all NBA trades are exactly even. *Mitigation is a debrief sentence, not a mechanic:* "The teams that have spent the most can only match, dollar for dollar. Teams with room can take back more than they send — that room is what they get for spending less."

**R2 — The test is post-trade, not pre-trade.** *Citation:* §1.5 (§6(j)(3); §2(e)(2)(i)(A), OBSERVED). *Kept at full strength, both bands* — it costs zero controls because the composer computes reach post-trade anyway. *Misconception risk:* none added; removing it would create one ("the apron is who you are"). It is who you *land as*.

**R3 — The wall.** A desk carrying a `wall` from Week 1/2 may not cross it, ever, for any reason. *Citation:* §2.1 (§2(e)(2)(i)(B), OBSERVED) — no team is assigned a hard cap; every one is self-inflicted. *5–6 simplification:* one line on your own payroll bar, drawn at the moment you drew it; the objects above it are out of reach. Never a negative number (`allowsNegatives: false`). *Misconception risk:* students think the league punished them. **Never let the wall be payable, and never call it a penalty** (do-not-render #20).

**R4 — Aggregation (7–8 only).** Two outgoing contracts may be combined **unless the trade leaves you above the second apron**. *Citation:* §1.6 / §2.2 row H / §2.4 item 6 (OBSERVED). *Misconception risk:* the common inversions — "first-apron teams can't aggregate" (false, #13) and "second-apron teams can only trade one-for-one" (false, #12). One director sentence corrects both.

**R5 — Picks are `$0`.** *Citation:* INFERRED from CBA Art. VII §6(j)(1) (every exception is defined over Player Contract Salaries), corroborated by cbaguide — see §15.1. *Omitted:* Stepien, the seven-draft horizon, protections, swaps. *Misconception risk:* picks look unlimited. **Accepted at 5–6.** At 7–8, one debrief sentence: "in the real NBA you can only trade picks about seven years out — a team can't sell its whole future." Never printed as league law without the "not published by the league" label (do-not-render #2).

**R6 — Roster slots.** Take more than you send and you need an empty space. *Citation:* §5.1 (CBA Art. XXIX §§1–2 OBSERVED for the 14–15 limits; the open-spot-before-execution rule is **cbaguide only, NOT located in primary text**). *Representation:* slots as physical spaces, no rule text. *Misconception risk:* low.

**R7 — The trade call.** An accepted deal is **PENDING** on both screens and on the board until the league office executes it; the teacher is the league office. *Citation:* §7 (CBA Art. VII §8(k), OBSERVED, verbatim definition). *Real illustration:* a trade is not a trade until the league office has been on the phone — the Kawhi Leonard deal was agreed in late June 2026 and still was not official on 2026-09-02 (CBA Art. VII §8(k), OBSERVED; Hoops Rumors 2026-09-02, reporting tier). Both sides had to still want it, for weeks. **Do not simplify.** Say *"the league checks the math,"* never *"the league approved the deal"* (do-not-render #19).

**R8 — Twins never transact, by any route.** *This is a BOW rule, not an NBA rule, and must be labelled as one on screen:* "These two front offices started from the same books. In this room they don't deal with each other." *Reason:* `P-TWIN` — within-club spread is the module's only defence against "inheritance decided the outcome" (froth §3.1).

**The server must NOT block — explicit list.** A lopsided trade. A trade a fan would hate. Two picks for one contract. Sending the only player who does his job. Panic-dumping in the last hour. Standing pat all session. Refusing every offer. Accepting the first offer without shopping. Trading with a friend. Giving something away. Overpaying knowingly. Leaving a job open on purpose. The only response to any of these is a **bounded advisory** — *UNUSUAL VALUE — far from what this room has been paying* — with **SEND ANYWAY** (D50 ruling 6). The machine is never the authoritative GM, and a mistake freely made is the evidence the Boardroom runs on.

### 4. Consequence

**The season settles on the roster you now hold.** After the deadline the remaining season resolves each desk's **jobs**, not a rating (ARC_DESIGN §8.1 forbids a team scalar). Deterministic, seeded on `(sessionId, contractId, postDeadlineRoster)` so a teacher can rerun the class and say "this was always going to happen" (ARC_DESIGN §3). Output per desk: which jobs ended covered, which ended open, and what each acquired contract did against **the job you traded for it** — three states, no scalar.

**A picks-for-now trade's cost is a named future cost, never a number going down.** The board and the desk read: *"Your 2029 first-round pick belongs to Boston A. It is off your board for good."* Then in Week 4 it arrives as a **line above the bill**, in words: *"OWED: your 2029 first (to Boston A). You have one fewer thing to sell."* No score moves. Nothing is subtracted. The cost is a sentence about a thing you no longer have — which is what an opportunity cost actually is, and why it can still be argued about in Week 6.

**The twin instrument.** Two desks that began Week 1 from the same club's books, on the same date, with the same holes, run independently since (D59 ruling 1) and **forbidden from dealing with each other** (R8). So the Boardroom can honestly print, side by side: *SAME BOOKS ON DAY ONE.* Everything different between them is something one of them chose. That is the separation of **what you did** from **what you were dealt**, and it is structural rather than asserted — the same instrument Host the League uses for DEALT vs BY-CHOICE.

### 5. THE BOARDROOM — the Front Office Review, Week 3

The extended version, because Week 3 closes Module 1 (Bible §15). Not the six-week climax; Week 6 is.

**Structure (12 minutes, four parts, Bible §4.3):** private one-card defense, every desk (3) → pair interrogation, desk to desk (3) → **two** console-selected hot seats, not four, because the session is 60 not 90 (4) → aggregate reveal (2). Every student writes; two perform.

**Evidence on the wall** — reconstructed from canonical state, never memory: opening books on Week 1 day one · what you signed and what it cost · what Week 2 did to it · every deal you executed, with the object that left · what is owed and to whom · which jobs ended covered · your commitment-capture chips beside the deals they belong to. **Your own refusals appear on your own card and nowhere else.**

**The five questions** (Bible §15): STRATEGY · ALTERNATIVE · RISK · ADAPTATION · DECISION QUALITY. The simulation never answers the fifth (ARC_DESIGN §7).

**Tape replay types this week produces** (Bible §12.3; never undo, never re-rendered with knowledge the desk lacked):
- **NEAR MISS** — two desks made the same call, one got the yes. Reconstructed at the moment of the offer, with what each knew.
- **STRATEGY DIVERGENCE** — the twin pair: same books on day one, one dealt, one held.
- **UNLUCKY GOOD DECISION** — a desk that traded precisely into its real hole and the season still did not settle its way. This is the highest-value card in the week and the console should rank it first.

**Press Conference candidate signals** (Bible §12.2 — never by best desk, never by highest number, never by correctness): declined a deal the room later saw as the biggest of the day · stood pat with two open jobs · a twin pair that diverged · a capture chip that names a different reason than the deal implies · accepted the first offer received · was called by five desks and said no to all of them. First Press Conference of the course is invited, never cold-called; a desk may decline once, silently, at no cost.

### 6. Commitment Capture for a trade

Two inputs, maximum, on any one commit (Bible §12.1A; §13.2 W3: "the hold-or-offer call and what the desk expects the ask to do"). Fires on **send** and, as one chip only, on **decline**.

**5–6, on send:**
> **You're sending [Name]. What are you giving up?**
> `A JOB SOMEBODY WAS DOING` · `MONEY I MIGHT NEED LATER` · `A PICK I CAN'T GET BACK` · `NOTHING I'LL MISS`
> **In one line: what do you expect this to fix?** *(12 words)*

**7–8, on send:**
> **Name the cost you are accepting.**
> `THE ONLY BIG CONTRACT I COULD MOVE` · `A FUTURE ASSET` · `ROOM UNDER MY WALL` · `A ROLE I HAVE NOBODY ELSE FOR`
> **One line: what would have to be true for this to turn out to be a mistake?** *(20 words)*

**Both bands, on decline — one chip, no line:**
> **Why no?** `I NEED WHAT THEY WANTED` · `NOT ENOUGH BACK` · `WRONG JOB` · `I'M WAITING FOR SOMETHING BETTER`

### 7. Phases, state, actions, views, seeds

**Phases** (ordered subsequence of `CANONICAL_PHASES`):
`LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → COUNTERFACTUAL → ARGUE → SYNTHESIS → COMPLETE`.
`ADAPT` is deliberately omitted: adaptation happens *inside* PLAY, when hour 1's refusals become hour 2's changed conditions.

**State shape:**
`{ gradeBand, hour: 0|1|2, marketClosed, desks: Record<seatId, Desk>, listings: ObjectId[], offers: Record<offerId, Offer>, executed: Deal[], settled: SeasonSettle|null, beat, warnings[] }`
`Desk = { seatId, clubId, twin, label, books{committed, taxSalary, deadMoney, holds, unattributed, wall, band}, roster: Contract[], picksOwned: Pick[], picksOwed: {pickId,toLabel}[], openJobs, bookVersion, captures[], evidence[] }`
`Offer = { id, fromSeat, toSeat, send: ObjectId[], want: ObjectId[], state: LIVE|COUNTERED|ACCEPTED|EXECUTED|DECLINED|EXPIRED|VOID_STALE, counterOf, fromBookVersion, toBookVersion, captureId, hour }`

**Actions and phase gates** (`reduce` is the only gate — `lessonModule.ts:12`):

| action | phases accepted | other gates |
|---|---|---|
| `takeSeat` | LOBBY, HOOK, PLAY | seat unclaimed |
| `list` / `unlist` | PLAY | own object, not escrowed |
| `propose` | PLAY | market open, <2 live out, target inbox <3, not twin, legal, capture attached |
| `withdraw` | PLAY | own live offer |
| `counter` | PLAY | recipient, offer LIVE, no prior counter, one piece changed |
| `accept` | PLAY | recipient; at 5–6 refused if another accept is live |
| `decline` | PLAY | recipient, chip required |
| `teacher:closeHour` | PLAY | `closeHook`; expires, settles, executes |
| `teacher:executeCall` | PLAY | executes pending accepted deals |
| `teacher:pressConference` / `resume` | HOOK…ARGUE | server-honest pause |
| `defend` | COUNTERFACTUAL, ARGUE | own card |
| `teacher:hotSeat` | ARGUE | |
| `teacher:nextName` | SYNTHESIS | walks `beat` |

`onPhaseExit`: leaving PLAY → execute every accepted-but-unexecuted deal, expire every live offer, release escrow (nothing may depend on a click that never comes); entering SYNTHESIS → `beat = 0`.

**Views.** `studentView`: own books, roster, picks, wall, own in/out offers, market names + interest counts, capture prompts, FINAL CALL `selfFallback`. Never another seat's price, package, or refusal. `teacherView`: per-desk offers sent/received/expired; walk-to signals `NO OFFER SENT`, `REFUSED TWICE`, `DUMPED ON`, `MARKET COLLISION`, `TWINS DIVERGED`; `unresolved()`; the director card for the current phase; ranked press candidates. `boardView`: hour clock, ON THE MARKET counts and object names with holder labels, executed-deal broadcast cards, THE ROOM DISAGREES lines, the season settle, the Boardroom aggregate, the naming — structurally never handed a seat identity.

**Seed IN — assumptions about Week 2 (stated explicitly; `W2_THE_SEASON_SPEC.md` does not exist as of 2026-09-04).** Assume `m1l2-the-season` exports a version-stamped `SeasonCarry` that extends `CarriedFranchise` (`sameLine/carry.ts:33`) with, per franchise: `roster: {contractId, playerId, name, role, annual, yearsRemaining, jobState, acquiredWeek}[]` (room-signed contracts only); `picks: {pickId, year, round, label}[]`; `deadMoneyIncurred`; `tape: TapeEpisode[]` (evidence, never read by a reducer). **Degradation, if Week 2 is absent or any field is missing:** derive `roster` from the `signings` Week 1 already carries; synthesize `jobState` deterministically from `(sessionId, contractId)` **and print on the teacher console "no season was played — job states were seeded, not earned"**; generate the two own picks; empty tape. Band mismatch is refused outright (BC-18, `carry.ts:193`). A dropped desk gets a stock franchise and the console says so (CLAUDE.md §9).

**Seed OUT to Week 4 (`DeadlineCarry` v1), per franchise:** `label, clubId, twin`; `committed` (cap position); **`taxSalary`** = the Week-2 figure, plus every annual salary received, minus every annual salary sent, executed deals only; `deadMoney` (trades create none in this model — a stated simplification, and true unless a waiver follows); `roster` post-deadline with years remaining; `picksOwned`; **`picksOwed: {pickId, year, toLabel}[]`**; `wall`; `openJobs` after the settle; evidence (executed deals, own captures, own refusals). **What Week 4's bill reads:** cash charges compute from `taxSalary` and cap position displays from `committed` — mixing them charges a club cash for an empty chair (`world.ts` Club docstring). Above the bill, in words: *"OWED: your 2029 first (to Boston A)."* The Week 3→4 seam is a **units seam** and must carry a visible translation, never a silent rescale (D59 ruling 8).

### 8. Band switches on `profileFor(band)`

`maxVariables` 2 → two composer controls; 3 → aggregation toggle. `maxBlockingWords` 40 / 70 → the deadline brief and the Boardroom card are the only blocking screens. `scaffoldFirstRound` true at 5–6 → **hour 1 opens with a worked deal run with the class on the board against a modelled desk**, then hour 2 is theirs; 7–8 meets hour 1 cold. `namesTheTradeoff` true at 5–6 → the composer says *"You're sending the only big who did his job"* while composing; silent at 7–8. `showsCounterfactual` true at 5–6 → the Boardroom shows a legal deal that was genuinely on the table and declined; 7–8 must name it themselves. `allowsPercentages` false at 5–6 → **no matching percentage anywhere, either band** (froth §5, S1), and no "you took back 112%". `allowsNegatives` false at 5–6 → crossing the wall is a blocked reach with a plain reason, never a minus sign. `maxNewTerms` 2 / 4 → the naming list in §9. `argumentMoves` 2 / 3 → 5–6 claim + reason; 7–8 claim + evidence + the strongest case against their own deal. `debriefMustConverge` true at 5–6 → the room lands on gains from trade; 7–8 may end on a defensible disagreement adjudicated by the room's own executed deals. **7–8 only:** aggregation (R4), multiple sealed accepts, the pick-horizon debrief sentence.

### 9. Naming stage — terms and their five-link chains

Format per term: experienced moment → class result → real sports example (dated, tiered) → formal term → outside sports. A term whose moment the room did not produce is **not shown** (`l1.ts:512`).

**Naming shape (D62).** The naming card gains a `real: string` field alongside `{id, term, moment, means, outside}`, so the dated real example is never improvised aloud (L3 first; L1/L2 back-fill owed).

**5–6, two terms.**

**GAINS FROM TRADE.** **Moment:** you were holding a contract doing a job you did not need, and the desk across the room was holding the job you could not fill; you asked, and a person who did not have to say yes said yes. **Class result:** the executed-deal cards on the board (`boardView.executedBroadcast`) beside the settle (`boardView.seasonSettle`) — *"N deals cleared today. In M of them, BOTH desks ended the season with a job covered that was open this morning."* Then the twin line: *"Same books on day one — different rooms answered them."* **Real:** on February 5, 2026 Boston and Chicago swapped two players whose contracts both ended that summer. Boston sent Anfernee Simons (about $27.7 million) and got Nikola Vučević (about $21.5 million); Chicago sent Vučević and got Simons plus the better of the two draft picks in the deal. Boston had lost every centre it had the summer before and was chasing a top seed — it needed a big man now, and the swap also cut its projected luxury-tax bill from about $39.5 million to about $17 million. Chicago was 35 games under water and not chasing anything — it turned a 35-year-old on an expiring deal into a 26-year-old on an expiring deal plus an extra 2026 second-round pick. Neither team got the same thing; both got the thing it was actually short of. (Hoops Rumors, published 2026-02-05, agreement reported 2026-02-03 by ESPN's Shams Charania; tax figures ESPN's Bobby Marks; pick detail Keith Smith of Spotrac. Read in full and verified 2026-09-04.) **Term:** **gains from trade** — a swap can leave both sides better off, because the two sides wanted different things; nothing new was built and nobody had to lose. **Outside:** two families swap houses for a week in the summer. Nobody built a house. Both got a holiday.

**7–8 DEPTH LAYER (do not read at 5–6).** Boston's salary went *down* by about $6.2 million and its tax bill by about $22.5 million, because above the tax line a dollar of salary costs a club more than a dollar. The same trade dropped Boston below the **first apron**, a rights line, not a money line: the test is payroll *after* the trade (spec R2). Optional: Boston also held a $22.5 million trade exception from the earlier Porziņģis deal and could absorb Vučević into it — the exception mechanism BOW deliberately does not model.

**WATCH FOR (teacher).** The room will score it: *"Boston won — they got the player AND saved money."* Do not settle it. Ask: *"What was Chicago trying to do in February?"* — the answer is on the board's own settle. Second misreading (D61): *"the money wasn't even, so somebody got cheated."* Even is not the test. Both desks' books got better by each desk's own goal; that is the whole term.

**Fit / suppression.** 5–6 composer shape exactly: one object out, one in, both contracts. Suppress the term if zero deals executed (l1.ts:512 rule) — on a no-trade room run THE STANDING OFFER and name **opportunity cost** instead.

**Late beat, optional (ranks as the UNLUCKY GOOD DECISION card, §5).** Vučević broke a finger in March and played 16 regular-season games for Boston; both players were free agents four months later — Vučević signed a one-year, $3.9 million deal with Orlando on July 1, 2026 (Hoops Rumors 2026-07-01, verified 2026-09-04); Simons signed with Philadelphia in July 2026 (`world.ts` `simons`, repo-sourced, not opened this session). The gain was real on February 5 by both sets of books; the outcome then went one way. Decision quality vs outcome in one real trade — the same thing the settle does to a desk that bought a rental: `expiringNextSeason` prints the job open again.

**SUBJECTIVE VALUE.** **Moment:** the contract you were desperate to move was greyed out on three desks and reachable on one — the desk that still had room under the cap; and the desk that could take it made you pay something extra to do it. **Class result:** the one blocked-reach integer on the board (`boardView.reachBlocked`) beside the interest counts and the executed card that shows *who* took it: *"The room could not reach K times today. This contract was out of reach for four desks and absorbed by one."* Then the twin line: two desks that started from the same books priced the same listed contract differently, because of what each had done since. **Real:** in the summer of 2025 Denver was paying Michael Porter Jr. a little over $79 million across the next two seasons and wanted out from under it; Brooklyn was paying Cameron Johnson $44 million across the same two years. Denver did not just swap them — Denver added an **unprotected 2032 first-round draft pick** to get Brooklyn to take Porter. Same player, same contract: to Denver something worth paying a draft pick to be rid of; to Brooklyn something worth being paid a draft pick to accept, and Brooklyn said publicly it wanted to keep him. The reason is not who is the better player. It is that Brooklyn had cap room and Denver did not. (Hoops Rumors, agreement 2025-06-30 reported by ESPN's Shams Charania, official 2025-07-08 per the Nets' release; cap-room and apron figures ESPN's Bobby Marks and Keith Smith of Spotrac; "not a salary dump" ESPN's Ramona Shelburne. Read in full and verified 2026-09-04.) **Term:** **subjective value** — the same contract is worth different amounts to different clubs, because what it costs you depends on what else you were trying to do. **Outside:** the old sofa in your grandmother's flat. She pays someone to take it away. The family moving into an empty apartment would pay *her* for it. Same sofa, opposite price.

**7–8 DEPTH LAYER (do not read at 5–6).** This is the exact rule your OUT bar draws. Had Brooklyn been over the cap it *could not* have swapped Johnson straight up for Porter's $38.3 million cap hit — over the cap you can only match salary; with room you can absorb it. Brooklyn's room *was* the asset it sold, and it charged an unprotected first for it, keeping about $17 million of room. Denver's payoff was not cash: the trade put Denver more than $13 million below the **first apron**, which put the non-taxpayer mid-level exception back in its hands. And the pick was addable at all because **picks count $0 in the salary math** (spec R5) — which is why a pick is how clubs pay each other to solve a books problem.

**WATCH FOR (teacher).** Near-guaranteed: *"Denver gave away a first-round pick for nothing — they got robbed,"* or *"Porter must be bad."* Neither. Porter averaged 18.2 points a game the season before and Brooklyn kept him. What Denver bought was $35 million of payroll it no longer owed and a spending tool it had lost. Say it plainly: **a contract can be a burden to one club and a bargain to another on the same afternoon, and neither club is wrong.** Also watch for *"so the team with room always wins"* — room is not free; Brooklyn spent room it could have spent on a free agent: Week 1's opportunity cost arriving inside Week 3.

**Fit / suppression.** "Contract + pick out" is **7–8 only** (two send objects). The 5–6 composer produces the same economics in the mirror: a room-rich desk sends a **pick** ($0) and receives a contract — legal only where the receiver's room can absorb it (`market.ts` `outBar`). Suppress the term if `reachBlocked` is 0 for the whole session and no listed object drew interest from more than one desk.

**Optional teacher line, INFERRED.** The pick is for 2032; whoever Brooklyn drafts with it is in middle school right now. Label it as an inference; no source says it.

**7–8, add two.**

**CONSTRAINED EXCHANGE.** *Moment:* "we're three million apart." → *Class result:* "Nine offers died on the bars today, not on the answer." → *Real:* Chicago amended Alex Caruso's contract to a full guarantee in June 2024 specifically so his outgoing salary would count as $9.4M instead of $3M, which is what made the Josh Giddey trade legal (CBA Art. VII §6(j)(6); cbaguide, OBSERVED, cba-explainer tier). → *Term:* **constrained exchange** — a deal exists only where both sides' feasible sets overlap. → *Outside:* two people can want to swap and still be unable to, because a rule stands between them.

**TRANSACTION COST.** *Moment:* two offers out, one counter, sixty minutes, and the deal you actually wanted never got composed. → *Class result:* "Four desks were talking to Detroit. Detroit answered two." → *Real:* the July 2026 four-team knot — Charlotte's, Minnesota's, Brooklyn's and Chicago's deals had to execute as one transaction, and Phoenix's entire offseason was frozen behind it (Hoops Rumors, 2026-07-10, reporting tier). → *Term:* **transaction cost** — the price of *doing* a deal, separate from the price *of* the deal. → *Outside:* the group project that fails because five people could not find one hour.

*Retrieval (D59 ruling 6):* scarcity and opportunity cost return by name from Week 1 in the Boardroom and in Previously On. No permanent vocabulary ban.

### 10. Sixty-minute budget, protected ending

| min | phase | beat |
|---:|---|---|
| 3 | LOBBY | books walk in, Previously On, twin labels |
| 4 | HOOK | the deadline brief + one dated real deadline story |
| 12 | PLAY hour 1 | 5–6: first 3 are the worked deal |
| 3 | PLAY | close hour 1, league office executes, board broadcast |
| 10 | PLAY hour 2 | the last hour |
| 2 | PLAY | close, execute, DEADLINE PASSED |
| 5 | REVEAL | the season settles on the new rosters |
| 4 | CONSEQUENCE | what is owed; twin divergence side by side |
| 12 | COUNTERFACTUAL + ARGUE | **THE BOARDROOM** — protected |
| 5 | SYNTHESIS | the naming + transfer — protected |

**Total 60.** The **protected ending is the last 17 minutes** and is never compressed. The compression valves, in order, and the console names them: hour 2 (10→5), REVEAL (5→3), hot seats (2→1). A compressed path still keeps a choice, a consequence, an argument, the economics and a transfer (D59 ruling 7).

### 11. Teacher director card, per phase

**HOOK.** NOW: read the club situation of the desk with the largest hole, aloud. WATCH FOR: desks who have not opened their roster. DON'T EXPLAIN YET: salary matching — let the bars teach it. ASK: "Who has something they don't need?" TRIGGER: the dated deadline story.

**PLAY hour 1.** NOW: walk, don't talk; the composer is doing the teaching. WATCH FOR: `NO OFFER SENT` after 4 minutes; `DUMPED ON`. DON'T EXPLAIN YET: why an offer was refused — that is the desk's private business and the reveal's material. ASK the stuck desk: "What's the job you still can't fill?" TRIGGER: FINAL CALL when `unresolved()` is under three desks.

**PLAY hour 2.** NOW: name the clock, once. WATCH FOR: panic packages in the last 90 seconds — do not stop them, they are the lesson. DON'T EXPLAIN YET: whether a deal was good. ASK: "Whose books changed since the first hour?" TRIGGER: close.

**REVEAL.** NOW: read two executed deals off the board, in the room's own numbers. WATCH FOR: the room converging on "even is fair." DON'T EXPLAIN YET: the term. ASK: "Both of you said yes. Who won?" — and refuse to answer it. TRIGGER: the Press Conference on the top-ranked candidate.

**CONSEQUENCE.** NOW: the twin pair, side by side. WATCH FOR: a desk blaming the dice. ASK: "Same books in September. What made this different?" DON'T EXPLAIN YET: decision quality vs outcome — that is the Boardroom.

**BOARDROOM (COUNTERFACTUAL/ARGUE).** NOW: private card, everyone writes. ASK the hot seat, deadpan, the decision not the person. TRIGGER: the UNLUCKY GOOD DECISION tape. DON'T EXPLAIN YET: nothing — this is where it comes out.

**SYNTHESIS.** NOW: one name at a time, each opening with what *this* room did. TRIGGER: `nextName`. ASK the outside-sports question last.

**When nobody trades.** TRIGGER **THE STANDING OFFER**: the modelled league office posts one dated, legal, visibly mediocre offer to every desk with an open job. Refusable. Never auto-executed. Then ASK: "Who got a call and said no? Why?" Standing pat is a legitimate strategy and must be defended, never punished.

**When everybody dumps on one desk.** The inbox cap does the mechanical work — the fourth offer bounces with *"Detroit's desk is full."* The console shows `DUMPED ON` and the teacher walks there once. At REVEAL, ASK: "Five of you called the same desk. What did all five of you want?" That is the week's own economics arriving from the room's behaviour.

### 12. Dominant-strategy hunt

**A. "Never trade — hoard the picks."** Honest, and it must stay playable. Not dominant: your open job is still open when the season settles, and Week 4's bill charges the same `taxSalary` either way, so hoarding buys no relief on the bill. It buys optionality, which is real, and the desk must name what it was protecting.

**B. "Match the bar" — make every deal exactly even.** *The likeliest false lesson in the week* (froth §3.3): the salary bar is the most legible object on screen, the room converges on even swaps, and students learn "a trade is a neutral exchange; nobody gains," which deletes the reason the act exists. **Breaker, structural: no class-facing reading may be a function of the balanced bar. The reveal measures what each side's JOB did.** An even swap that fills neither hole is worse than a lopsided one that fills both, and the settle says so.

**C. "Buy now, pay later" — spend both picks on contracts that do the job.** Often right for a walled desk with open jobs, and it should sometimes win. Not dominant: Week 4 reads `taxSalary` and the picks-owed line, and a desk that spent both picks has nothing left to sell when the bill arrives.

**Collusion between friends.** Not blocked — the server blocks illegality, never strategy (D50 ruling 6). It is contained rather than prevented: both books are public, so a gift is visible to the room and reconstructed on the Boardroom wall; the season settles on **jobs**, so a gifted contract that does not do your job does not help you; the giver defends the giveaway under the same five questions; and twins cannot do it at all (R8). **Residual risk is real and not fully closed** — see risks below. The console surfaces it as `DISCUSSION OPPORTUNITY`, never as a violation.

**"Accept the first offer."** Fails because the hour is sealed and other offers may still be arriving — and the desk that accepted first has to explain, on the wall, why it stopped looking.

### 13. Test list

1. A proposal naming an incumbent NBA player from the club's opening books is refused.
2. A proposal between twin desks is refused by every route, including via a counter.
3. Incoming salary beyond what the receiver's room absorbs is unreachable in the composer, and refused if forged.
4. A trade whose post-trade payroll crosses the desk's own wall is refused; a trade that lands under it is allowed even if the desk is currently over.
5. Picks contribute `$0` to both sides of the matching comparison.
6. A 5–6 composer never exposes more than two decision controls.
7. A 7–8 aggregation of two contracts is refused when the trade leaves the desk above the second apron, and allowed when it lands below.
8. A third live outgoing proposal is refused; withdrawing one frees the slot.
9. A fourth live incoming offer bounces to the sender with the full-desk message.
10. A second counter on the same negotiation is refused.
11. A counter that changes two pieces of the package is refused.
12. An object named in a live offer cannot appear in a second live offer.
13. Closing the hour expires unanswered offers, releases escrow, and charges nobody.
14. `unresolved()` names every desk with an unanswered offer, with distinct teacher and self copy.
15. No contested outcome depends on arrival order — reordering the same actions produces the same settle.
16. At 5–6 a second live accept is refused; at 7–8 two accepts settle by the printed rule, in the printed order.
17. An accept carrying a stale `bookVersion` is voided with the books-changed message, not silently applied.
18. Leaving PLAY executes accepted-but-unexecuted deals and strands nothing.
19. `boardView` output contains no seat id, no price, no package terms and no refusal, in every phase.
20. `studentView` for seat A contains nothing about seat B's offers, refusals or captures.
21. A `propose` without a commitment capture is refused.
22. `taxSalary` out equals `taxSalary` in plus salary received minus salary sent, across every executed deal.
23. A pick that changed hands appears in exactly one `picksOwned` and one `picksOwed` line, with the correct franchise label.
24. A seed from the other band is refused; a malformed desk is dropped with a teacher-readable reason and gets a stock franchise.
25. With no Week 2 seed, the module still opens playable and the console says job states were seeded, not earned.
26. No percentage, ratio or negative running total is rendered at 5–6, in any view, in any phase.

### 14. Open questions for the founder

1. **The sweep problem is still open** (froth §6.1), and it is the same gate that stopped this mechanic before: a desk's reachable outcome set is a function of what fifteen humans did, and no argument yet exists that a small family of modelled market environments covers a real class. Ship on an honest conditional property over a declared, printed family — or hold the build until a stronger proof exists?
2. **Collusion between friends** is permitted by D50 ruling 6 and contained only by visibility and by the job-based settle. Accept the residual (a genuinely unfair-looking outcome the teacher must handle live), or add a bounded rule (e.g. no desk pair transacts twice in the session)?
3. **Two hours or three?** Two protects the ending; three gives a desk refused twice a real second life. Which loss is preferred?
4. **Does the season settle before the Boardroom, or after?** Settling first makes the consequence felt and makes decision-quality-vs-outcome the live argument; settling after keeps the defense clean of hindsight. This spec chose *before*.
5. **The Clippers cap-circumvention material** (NBA_TRADE_TRUTH §8, announced 2026-09-02, publicly contested, litigation-adjacent) is the best answer in the dossier to "what if you just cheat?" It is deliberately absent from this spec. Approve, or keep it out permanently?

*Nothing in this spec is classroom-proven (D10). No test named in §13 has been run — none of this exists yet.*

---

## 15. W3 anchors verified — Sports Reality, 2026-09-04

**Appended, not rewritten.** An independent verification pass over §2–§4 and §9 by the
Sports Reality Director, 2026-09-04. Primary source: the 2023 NBA CBA PDF, downloaded by
me this session from
`https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf`
(676 pages, 2,850,534 bytes — the same file `NBA_TRADE_TRUTH.md` used 2026-09-03) and read
as text. **OBSERVED** = I read the cited sentence this session. Grades: HIGH / MEDIUM / LOW.
Nothing here is a legal claim.

### 15.1 §3 rule-by-rule, against the CBA text

| Rule | Verdict | Primary text I read, 2026-09-04 | Grade |
|---|---|---|---|
| **R1** incoming ≤ outgoing above the first apron | **CORRECT** | Art. VII §6(j)(3): "if a Team's post-assignment Apron Team Salary would exceed the First Apron Level, then the $250,000 allowance referenced in each of Sections 6(j)(1)(i)-(v) above shall be reduced to $0." Combined with §2(e)(4) row E (Expanded TPE is a First-Apron-gated transaction), an over-first-apron team may take back **exactly 100%, no cushion**. | **HIGH** |
| **R2** the test is post-trade | **CORRECT** | §6(j)(3) "post-assignment Apron Team Salary"; §2(e)(2)(i)(A) "if, **immediately following such transaction**, the Team's Apron Team Salary … would exceed the 'Applicable Apron Level'". | **HIGH** |
| **R3** every wall is self-inflicted | **CORRECT** | §2(e)(2)(i)(B): "A Team that engages in a transaction set forth in the Transaction Restrictions Table may not, **for the remainder of such Salary Cap Year**, have an Apron Team Salary that exceeds the Applicable Apron Level that corresponds with such transaction." No provision assigns a hard cap to a team by payroll alone. | **HIGH** |
| **R4** aggregation banned only if the trade **leaves** you above the **second** apron | **CORRECT** | §2(e)(4) **row H**: "Team acquires a player using an Aggregated Standard Traded Player Exception (as described in Section 6(j)(1)(ii)) — **Second Apron Level**." Rows E, F, G are First Apron; rows H, I, J, K are Second Apron. The spec's two named inversions (#12, #13) are indeed false. | **HIGH** |
| **R5** picks count $0 | **UPGRADE THE LABEL** | The five Traded Player Exceptions in §6(j)(1)(i)–(v) are defined **entirely over the Salaries of Player Contracts**. Draft picks are never Salary and never enter the matching arithmetic. This is **INFERRED from primary text** (affirmative silence), not merely "cbaguide, NOT primary-verified" as §3 R5 currently says. Recommend upgrading the citation to "INFERRED from CBA Art. VII §6(j)(1), corroborated by cbaguide". | **HIGH (inferred)** |
| **R6** roster slots | **NOT RE-VERIFIED** by me this session. §3's own honest split (Art. XXIX §§1–2 for the 14–15 limits, cbaguide-only for the open-spot-before-execution rule) stands unchallenged. | **LOW (not re-read)** |
| **R7** the trade call | **CORRECT AND VERBATIM** | Art. VII §8(k): "A 'trade' of a player under this Agreement shall mean an assignment of a Player Contract pursuant to a negotiated exchange between two or more Teams **following a trade conference call with the NBA league office**. For clarity, the word 'trade' shall not include an assignment of a player via the NBA's waiver procedures." The spec's "the league checks the math," never "approved," is well founded. | **HIGH** |
| **R8** twins never transact | Correctly labelled a BOW rule, not an NBA rule. No verification owed. | n/a |

**Nothing in §2, §3 or §4 was found factually wrong or stale for 2026-27.**

### 15.2 One stale figure to keep out of the build

The Expanded TPE's middle band is **indexed to the cap and is not "+$7.5 million"** for
2026-27. **OBSERVED — §6(j)(1)(iv)(y)(B):** incoming may be "one hundred percent (100%) of
the aggregated pre-trade Salaries of the Traded Player(s), plus an amount equal to
**$7.5 million multiplied by a fraction, the numerator of which is the Salary Cap for the
then-current Salary Cap Year and the denominator of which is the Salary Cap for the
2023-24 Salary Cap Year**."

For 2026-27: $7,500,000 × $164,961,000 ÷ $136,021,000 = **$9,095,709**
(cbaguide publishes $9,096,000; agreement to ~$300). $7.5M is the **2023-24** value.
`NBA_TRADE_TRUTH.md` §1.3 already has this right; any brief or copy that says "+$7.5M" as
a current band is quoting a three-year-old number. The other two branches are exact as
written: **200% + $250,000** and **125% + $250,000** (§6(j)(1)(iv)(y)(A), (z)). **HIGH.**

**Two aggregation restrictions §3 omits** (§6(j)(4), OBSERVED): a contract acquired via an
Exception in the preceding **two months** may not be aggregated (with a December-16
carve-out for deadline trades), and outside Dec 15–deadline a team aggregating **three or
more** contracts while receiving back fewer players may include **no more than one**
minimum-salary player. Both are correctly out of scope for a 60-minute lesson; recording
them here as **stated simplifications** so the omission is deliberate, per CLAUDE.md §3.

### 15.3 Two real, dated deadline trades for §9's "real sports example" slots

Both from the **February 5, 2026** deadline — one week of real news, two opposite
economics, and both legible to a student who knows no basketball. Source: Hoops Rumors
(reporting tier), all three pages read **2026-09-04**.

**(A) A contender buying a job — and getting paid to do it.**
*Hoops Rumors, "Celtics, Bulls Swap Anfernee Simons, Nikola Vucevic", published 2026-02-05,*
`https://www.hoopsrumors.com/2026/02/celtics-bulls-to-swap-anfernee-simons-nikola-vucevic.html`

- Boston sends **Anfernee Simons** (expiring, **$27.7M**) and a 2026 second-round pick.
- Boston receives **Nikola Vučević** (expiring, **$21.5M**) and Denver's 2027 second.
- Hoops Rumors' own summary line in the deadline recap: *"The Celtics save some money and
  fortify their frontcourt."*
- Reported effect (ESPN's Bobby Marks, quoted in the article): Boston's projected luxury
  tax bill falls **from $39.5M to $17M — more than $22M** — and Boston drops **below the
  first apron**.
- Vučević's line at the time of the trade, per the same article: 16.9 ppg, 9.0 rpg,
  3.8 apg, 37.6% on threes.

**Why this is the best available anchor for W3.** It is simultaneously (i) a job trade —
Boston had a hole at centre and filled it; (ii) opportunity cost — Boston gave up its best
tradeable contract; and (iii) the tax line doing exactly what `world.ts` says it does:
**$6.2M of salary going out bought $22.5M of tax relief**, because past the tax line every
dollar costs more than a dollar. One trade, three of the week's ideas. Vučević is
**already in `world.ts`** with a verified 2025-26 stat line, so the class can meet him
before the deadline and again inside the anchor. Grade **MEDIUM** (one reporting-tier
outlet, quoting ESPN; salary figures are reported, not from a league document; the article
itself says $27.7M in one sentence and $27.8M in another — print "about $27.7 million").

**(B) A salary dump, priced in cash.**
*Hoops Rumors, "Knicks Sending Guerschon Yabusele To Bulls For Dalen Terry", published
2026-02-05,*
`https://www.hoopsrumors.com/2026/02/knicks-sending-guerschon-yabusele-to-bulls-for-dalen-terry.html`

- New York sends **Guerschon Yabusele** ($5.5M, with a **$5.7M player option for next
  season**) **plus $500,000 in cash**; New York receives **Dalen Terry** ($5.4M, expiring).
- Quoted: *"New York had reportedly been looking to unload Yabusele for several weeks, but
  **couldn't find a taker** because of his $5.7MM player option for next season."*
- Reported effect (Yossi Gozlan, The Third Apron, quoted in the article): the Knicks' room
  below the **second apron** grew from **$148,359 to $249,241**, "allowing them to sign a
  15th player on March 26 instead of waiting until April 2."

**Why this one.** It is the whole of W3's §12-A/§4 economics in four numbers a fifth-grader
can hold: a **$100,000** payroll saving, bought with a real player and **half a million
dollars of cash**, purchased **one week** of a roster slot. It also shows the thing the
composer is supposed to teach — *nobody wanted the contract* — and it connects R6 (roster
slots) to the wall without a percentage anywhere. Grade **MEDIUM** (reporting tier; the
$5.5M/$5.4M/$500K/$148,359/$249,241 figures are all reported in the linked article).

**INFERRED, offered to the teacher card and not to a student surface:** paying cash in a
trade is Transaction Restrictions Table **row I, Second Apron Level** (§2(e)(4), OBSERVED).
The Knicks could send that $500K *only because* they were still under the second apron —
the same line the trade was made to protect. Neither cited article says this; it is my
inference from the rule text, and it should be labelled as such if used.

**Fallback anchor, one year older, for a pure "paying a pick to shed salary" story:**
Phoenix sent **Jusuf Nurkić** and a 2026 first-round pick to Charlotte for Cody Martin,
Vasilije Micić and a 2026 second — Hoops Rumors' recap line: *"The Suns find a taker for a
big man no longer in their plans."* (Hoops Rumors, "2025 NBA Trade Deadline Recap",
published 2025-02-07, read 2026-09-04,
`https://www.hoopsrumors.com/2025/02/2025-nba-trade-deadline-recap.html`.) Grade **MEDIUM**;
contract figures for this one were **NOT VERIFIED** this session.

### 15.4 §9's existing real examples

The four §9 chains cite Hoops Rumors 2026-07-10, Hoops Rumors 2026-09-02, and a
cbaguide-tier reading of §6(j)(6) for the Caruso/Giddey amendment. **I did not re-open any
of those three sources this session — NOT RE-VERIFIED, not disputed.** The §6(j)(6) rule
itself (a traded player's Salary is deemed reduced by unearned, unprotected Base
Compensation) **is** in the primary text and I read it; the Caruso application is the
reporting layer on top of it and remains cbaguide-tier as §9 already says.

### 15.5 Rights / source note

Every fact in this section is CBA text published by the NBA, or a dollar figure reported by
Hoops Rumors and attributed to a named reporter. No photography, likeness, logo, mark,
video, or proprietary dataset is required. Spotrac and Salary Swish were **not** used for
anything in §15 — a deliberate choice, because their contract tables are the paywalled
proprietary layer and §15's figures had to be quotable without them. This is a sourcing
note; it is not a rights clearance and no such clearance is offered.

*Verified 2026-09-04. Nothing in §15 is classroom-proven (D10).*
