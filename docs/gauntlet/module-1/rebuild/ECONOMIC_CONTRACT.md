# Module 1 "The Cap" — Economic Learning Contract

Economic Truth Critic. Written **before** any architecture candidate exists, in the form used for
`docs/gauntlet/module-2/ECONOMIC_CONTRACT.md`. This is a contract, not a design: it says what
Module 1 must teach and what any mechanic claiming to teach it must instantiate.

**Scope.** Three ~55-minute live classes. Territory: scarcity, opportunity cost, constrained
allocation, the cap as an institution. Two grade bands from birth (5–6 and 7–8), one shared NBA
world and one consequence engine (D22 program #2). Strong persistence L1→L2→L3 (CLAUDE.md §9, D18).

**Evidence status — read this before quoting anything below.**

- **Read this session (source):** `CLAUDE.md`; `docs/gauntlet/module-1/rebuild/FROTH_BRIEF.md`,
  `NBA_FINANCIAL_TRUTH.md` (all eight sections), `PLATFORM_REALITY.md` (all nine sections),
  `VISUAL_TARGET.md`; `docs/gauntlet/module-2/ECONOMIC_CONTRACT.md`;
  `runtime/src/shared/lessonModule.ts`, `runtime/src/shared/phases.ts`;
  `docs/PRODUCT_DECISIONS.md` D4, D6, D10, D22, D24, D25, D26, D28, D29, D30, D34, D36, D37, D38,
  D39, D40; the header and gate-call region of `runtime/src/modules/fullHouse.ts` as a quality bar.
- **Not verified by me.** I ran no build, no test, no browser, no session this session. I executed
  no sweep of any model, because no Module 1 model exists to sweep — every quantitative claim in
  this document is either quoted from the dossier with its confidence tier, or is a *property a
  future model must be tested against*, never a measured result.
- **Every NBA fact below is the dossier's, at the dossier's confidence.** Where I rely on a fact
  §8.2 forbids rendering, I say so and convert it into a design constraint rather than a lesson
  beat. Where a fact carries a live conflict (§7), I name the conflict.
- **The pedagogy findings are Researcher 6's**, with §7.11's caveats attached: the CEE standards are
  16 years old, Design Rules 12 and 15 have no source at all, and the Sinha & Kapur grade-band
  confidence interval is internally inconsistent as printed (direction well-supported, magnitude
  uncertain).

---

## 0. The prior finding that constrains the whole module

Stated first because it is the highest-severity thing in the record and because the contract below
is written to make it unrepeatable.

The Module 1 being discarded did not merely have fictional content. **Its own reward structure
computed the false lesson.** `freeAgency.ts:1417` — `THE BARGAIN` is `argmax (form + playoffFactor)
/ amount`, dominated by the denominator, so it structurally crowns the cheapest signing. Reproduced
live by the platform audit: the module printed *"worth every dollar and then some — the best value
signing of the window"* about the lesson's designated trap, while a second card in the same reveal
called walking away from that same agent *"a real trap."* Alongside it: a projector card asserting
that every dollar of price movement came from offers the room placed, when the largest mover is
usually an agent nobody bid on (`freeAgency.ts:1681`); a synthesis card stating a market fact the
market no longer had (`draftDay.ts:1103`); an L1 with no rival contention at all, where thirty teams
may each sign the same player (`draftDay.ts:28`); an L2 opening beat that performs the arrival of
new information and delivers none (`tradeDeadline.ts:575`); an L3 bracket mathematically incapable
of any outcome but the No. 1 seed (`freeAgency.ts:689`); and a $100M cap that rises $130M — a 30%
year-over-year jump the real CBA caps at 10% (§1.3).

Three of those false projector claims survived four verification rounds. The platform audit names
why: every synthesis body was a bare template literal the audit could not see (PLATFORM_REALITY
§9.4). **The lesson is not "verify harder." It is that a claim which is not built from the computed
value will eventually contradict it**, and that a mechanic's *prize* is a stronger teacher than its
debrief.

Everything below is written to prevent three failure modes: **an asserted concept with no
mechanism**; **a mechanic whose optimum is reachable without economics**; and **a rendered sentence
the model does not support**.

---

## 1. THE TWO TESTS

### The INSTANTIATION TEST, in Module 1's terms

> Name the two reachable states that differ **only** because this concept is true, and name the
> student action that moves between them. Delete the concept from the model. If the reachable state
> space is unchanged, the concept is decoration.

Module 1's subject is a *constraint*, so the test carries a second limb that M2's did not need:

> **The binding limb.** The constraint must actually bind. For a majority of seats, in the **worst
> reachable case**, there must exist a legal action the pair demonstrably wants and cannot take.
> Brute-force verified over the reachable action space, not spot-checked.

A cap nobody reaches is scenery. A foregone-alternatives list where an equivalent substitute is
always available at the same price is a list, not an opportunity cost. A threshold that only ever
appears in copy is a sentence. **Every concept in §2 is judged against both limbs.**

### The REASONING TEST, in Module 1's terms

> Name what the student must reason about that a mechanical search cannot supply.

Module 1's specific danger, and the reason this test is sharper here than in M2: **constrained
allocation is a knapsack problem, and knapsack problems fall to greedy search the instant there is
one summable objective and a printed per-item value.** A row of players with a price and a rating,
against a budget, is arithmetic sorting wearing sports nouns. It will feel like a game and teach
nothing, and a fifth grader will find the sort in under three minutes without meaning to.

A Module 1 mechanic passes the reasoning test only if at least one of these holds, and the candidate
must say which:

- **(a) Non-summable objectives.** At least two outcome dimensions that cannot be added, with no
  action weakly best on both for all seats (M2's R4, inherited verbatim).
- **(b) Unprinted value.** The card carries role, price, one plain-language strength and one
  plain-language risk (Design Rule 15) — and no scalar the student can sort on.
- **(c) Non-separability.** What a piece is worth depends on what else you already own, so greedy
  provably fails and the pair must reason about a *portfolio*, not a list.
- **(d) A second binding constraint.** Money and roster slots bind simultaneously and which one
  binds depends on the plan (§2.10: "roster slots are a second scarce resource alongside money. Two
  simultaneous binding constraints is what makes allocation interesting rather than arithmetic").
- **(e) Another desk.** What this desk can get depends on what another desk decided (CLAUDE.md §8:
  interaction only where it materially changes the economics).

**"The teacher will explain it in the debrief" is not an answer to either test.** The debrief names
what happened; it cannot install a mechanism that was not there.

---

## 2. PER-CONCEPT VERDICTS

Verdicts are about *this module, in ~55 minutes, in a real room*. "TEACHABLE" means the concept can
be genuinely experienced by that band; it is not permission to include it.

Two standing constraints apply to every row and are not repeated in each:

- **§8.2 #21 (the math ceiling as a product constraint).** No load-bearing percentage, ratio,
  negative number or probability in any grade-5-inclusive lesson. Grade 5 has no percent, no ratio
  and no negative-number standard; grades 5 and 6 have no probability standard at all (§6.2). Real
  cap numbers stay real — what gets simplified is *the arithmetic the student must perform*
  (CLAUDE.md §3: simplify the interface before the economics).
- **§6.3 (the front-half asymmetry).** Problem-solving-before-instruction is g = +0.50 at grades
  6–10 and g = −0.09 at grades 2–5, and the moderator splits at exactly this product's band
  boundary. The 5–6 band *contains grade 5*, so its discovery phase is scaffolded (Rule 3, rated
  the highest-stakes rule in the set); the 7–8 band faces the constraint cold. Both bands keep the
  consolidation.

| # | Concept | Grades 5–6 verdict | Grades 7–8 verdict | Minimum instantiation to be genuinely experienced |
|---|---|---|---|---|
| **C1** | **Scarcity** | TEACHABLE and **mandatory** — the module's floor. CEE puts choice-and-cost at grade 4 and C3 D2.Eco.1.3-5 at 3–5, so this is reactivation, not introduction (§6.3: grade 5 is often not a standalone economics year). | TEACHABLE but **cannot carry a lesson alone**. By grade 7 "you can't have everything" is not news. At 7–8 scarcity must appear as *two simultaneously binding constraints* whose binding order changes with the plan. | A legal action the pair demonstrably wants must be unavailable at the moment they want it, for a majority of seats, in the worst reachable case, brute-forced. Plus (7–8): at least two distinct scarce resources — dollars, the 15 roster spots (§2.10), an exception that can be used once — such that a plan can be blocked by either. |
| **C2** | **Opportunity cost** | TEACHABLE, **mandatory**, and this is the module's spine. Named grade-4 CEE benchmark; the grade-4 use-benchmark is exactly "describe a situation that requires a choice, make a decision, and identify the opportunity cost." Name it **after** the experience (Rule 10). | TEACHABLE at a **genuinely harder object**: CEE grade 8 adds *"the evaluation of choices and opportunity costs is subjective"* and present-**and-future** consequences. At 7–8, two desks facing the identical menu must be able to have different opportunity costs, and both be defensible. | The forgone alternative is **named, specific, and permanently lost at the moment of commitment** — the actual things this dollar could have bought, enumerated live and **frozen at lock** (the `foregoneAtLock` pattern, `draftDay.ts:318`/`:556`, which the platform audit calls the best single idea in the old M1). Real-NBA anchor: **renouncing** — to use cap room you must destroy Bird/Early-Bird/Non-Bird rights to your own free agents, irrevocably (§2.5, CBA-tier, high). **Falsifier:** if the forgone item is still obtainable later, or a same-price substitute is always available, nothing was given up. |
| **C3** | **Constrained allocation** | TEACHABLE — it is the module's verb. Bounded: 3–5 discrete options, all legal, none dominated, no compound moves (Rule 4); ≤2 decision-relevant variables per choice (Rule 1). | TEACHABLE, and the harder object is **sequence**, not size: ≥1 compound move where the legality of step 2 depends on step 1. 6–10 options; widen options before widening attributes (Rule 4). | Must satisfy at least one of REASONING TEST (a)–(e) and the candidate must name which. Plus the inherited hard constraint: **≥2 genuinely different affordable options at every forced decision point in the worst reachable case, proven by property test** (PLATFORM_REALITY §6 #16), and cap inviolability enforced by the **same arithmetic** that validates an ordinary purchase (#17). |
| **C4** | **The cap as an institution, not a wall** | TEACHABLE and it is the module's **title concept**, but only in reduced form. §7.12 #2 is right: a grades 5–8 lesson can carry **three lines at most**, and 5–6 should carry **two** — and they must be **two different kinds of object**. | TEACHABLE with three lines: cap (soft, exceptions), tax (a *price*), apron (a *tool confiscation*). §2.1's own design note is the pedagogy: "a fee, a prohibition, and a delayed penalty are three genuinely different economic objects sitting on one axis." | **Two limbs, both required.** (i) *Ladder limb:* the lines a lesson carries must not all behave identically — at least one crossable at a price or by an exception, at least one not crossable at all. (ii) *Institution limb:* the rule must be visibly **chosen, purposeful, and capable of being otherwise**, evidenced by the same trigger producing different outcomes under different rules — the §8.1-safe triple **2016-17 +~34% (no growth limit) / 2025-26 +10.0% (at the CBA ceiling) / 2026-27 +6.7% (under it)**. And the rule must land on the student's own books at least once. **§8.2 #5 gate:** a tax *bill* in dollars may not be rendered as an NBA number until the bracket math is reproduced against the CBA; a lesson may render its own registered arithmetic, labelled as the module's, or nothing. |
| **C5** | **Commitment and path dependence** | TEACHABLE and **mandatory** (CLAUDE.md §9, D18). Rule 14: the product **surfaces the causal link in plain language** at the opening of the next lesson. | TEACHABLE, carried **silently** (Rule 14) — the pair must diagnose why the room is tight. Harder object: a **commitment device**, an action that deliberately destroys a future option in exchange for something now (the supermax that cannot be traded for a year, §2.8; a no-trade clause, §5.1). | A decision must change the later lesson's **option set**, not merely a number. The canonical real mechanism, and the cheapest to model: **the hard-cap trigger** (§2.3, cbaguide high, corroborated) — using an apron-restricted transaction converts that apron into an absolute wall for the rest of the league year. *Your July choice silently removes your February options, with no vocabulary required.* Scale evidence: 22 of 30 teams under a hard cap as of 2026-07-10. |
| **C6** | **Dead money / sunk cost** | **SPLIT VERDICT.** The dead-money *object* is TEACHABLE and shocking (Milwaukee pays **$21,311,053 per year to Damian Lillard, who plays elsewhere, through 2030-31** — §8.1 #21, corroborated by the official waiver announcement plus the cap sheet; it is the team's **third-largest cap charge**). The sunk-cost *fallacy as a named principle* is **NOT teachable at 5–6** — CEE places sunk cost at **grade 12**. What 5–6 can experience: the money is gone either way, so the only live question is the roster spot. | TEACHABLE, still above the CEE placement, and the harder object is the **stretch as an intertemporal transfer**: same total, different years, with a ceiling on how much you may push forward. Arithmetic is grade-appropriate at both bands: **Noah, $19.3M → $6.4M × 3** (§8.1 #20) — division and addition only, and the total visibly does not shrink. | The charge must (i) persist across lessons, (ii) appear as a line item in the same units as live players, (iii) be removable by no action, and (iv) **not reduce the number of decisions available**. **Falsifier:** if a pair carrying dead money has strictly fewer legal actions than one without, the module built punishment, not sunk cost — and it built a death spiral (see §5, Family 6). |
| **C7** | **Option value and flexibility** | TEACHABLE **only in its concrete form**: money you did not spend let you fix a problem you did not know you had — and the fix must actually happen **inside the same session**. The abstract form ("an option has value because you might not use it") requires reasoning about a state you are not in; CEE puts risk/uncertainty pricing at grade 12. | TEACHABLE in the abstract, with a horizon: OKC held five firsts and two swaps from July 2019 and cashed them in 2025 (§5.3, official-nba, high). | Unspent capacity must be **convertible into something at a later, unannounced moment**, at least once per module — the `adaptBudgetFor` shape (`draftDay.ts:338`), where repair budget is `CAP − spent` by the *same* arithmetic as an ordinary purchase, so a team that left room genuinely has more to repair with. **And the option must sometimes expire worthless**: Houston spent the whole stockpile on Durant because "an option is only worth something if you eventually exercise it" (§5.3); Chicago's **$17,991,071** TPE is a coupon with an expiry date (§4.2). If flexibility always pays, the module taught "always save" (see FL6). |
| **C8** | **The apron as a threshold that removes TOOLS, not just money** | TEACHABLE **in the concrete only**: items are confiscated from your desk, visibly, and you know which of your own choices did it. No apron arithmetic, no percentages, no distance-to-line figures. | TEACHABLE with the trigger logic, and this is **the module's intellectual ceiling** — the most distinctive economics in the entire dossier. A constraint the student *creates* by their own transaction is a harder and rarer object than a constraint imposed on them. | Crossing must **remove named actions from the action space**, not add a fee; the removal must be legible **before** the crossing is committed; and at least one removed tool must be one the pair would have wanted **later in the same or a later lesson**. Real list, §2.3: above the first apron, no sign-and-trade, no BAE, no non-taxpayer MLE, no prior-year trade exceptions; above the second, no MLE at all, **no aggregating two salaries in a trade**, no cash. Confiscation is also the honest visual: Phoenix 2024-25's four lost tools as literally struck-through items (§5.4). **Falsifier:** if crossing only costs money, the candidate built a tax and called it an apron. **§8.2 gates:** the pick-penalty count/horizon (2-of-4 vs 3-of-5, 7 vs 8 drafts) is unresolved (#2); GSW/CLE/IND/MIA hard-cap status is internally contradictory (#3) and those clubs must not be student seats. |
| **C9** | **Substitution among players** | TEACHABLE as *experience*, not as vocabulary. CEE grade 4 carries "higher price → buy less"; **substitutes are added at grade 8**. | TEACHABLE and nameable, with relative price (CEE grade 8). | ≥2 genuinely different affordable options at every forced decision, in the worst reachable case, proven by property test — and the substitutes must differ on a dimension **other than price**, or the choice is arithmetic. Real anchors, both §8.1-safe as facts: **rookie scale is a fixed price ladder by slot** (No. 1 $14,748,000 vs No. 30 $2,926,800, ~5×, set by slot and not negotiation); and San Antonio, where **Wembanyama at $16,868,013** sits beside **De'Aaron Fox at $49,488,300** — price ≠ value, in one screen. |
| **C10** | **Bidding under hidden information** | **CONDITIONAL — do not treat as settled.** Rule 12 prescribes open, sequential bids with visible shrinking supply at 5–6 and hidden simultaneous bids at 7–8, and rates itself **LOW confidence, "worth playtesting both variants at 5-6"** (§6.4, and §7.11 records that Rules 12 and 15 have **no source at all**). Treat the band split here as a hypothesis the prototype must test, not a rule it may assume. | TEACHABLE. Hidden simultaneous bids require a belief about what rivals will do — a genuinely different cognitive object from open bidding, not a harder version of it. | Another desk's decision must change **what this desk can get** — a shared shrinking pool, with permanent loss (`draftDay.ts:286-300`: the poached player is ineligible *forever*, not benched). The old M1's L1 fails this outright: thirty teams may each sign the same player (`draftDay.ts:28`). **Ties must break in-model** — remaining cap room, or the player choosing (the real incumbent advantage: 5 years / 8% raises to re-sign vs 4 / 5% elsewhere, §8.1 #10) — **never by HTTP arrival time** (`tradeDeadline.ts:783`, `freeAgency.ts:838`): "their laptop was quicker" is an economics failure, not a tie-break. **Publication rule:** only a consummated deal publishes its price; losing bids and reserves stay private forever, before *and* after the reveal. |
| **C11** | **Risk and variance** | **NOT TEACHABLE AS PROBABILITY.** Grades 5 and 6 have no probability standard at all (7.SP.C.5 is the first); CEE places risk at grade 12. Teachable **ordinally only** — "safe / solid / boom-or-bust," a bar of ten chips, a coloured band (Rule 7) — with the class's own outcome spread as the evidence. | TEACHABLE numerically at 7 (7.SP.C.5) and as long-run frequency built from the class's own pooled results (7.SP.C.6). **Expected value stays flagged as above-grade** (CEE grade 8) and **belongs to M4** (D2, CLAUDE.md §7). M1 must not annex it. | Same declared risk label must produce **visibly different outcomes across the room in the same session**, so variance is seen as a spread of desks rather than asserted by a card. Every outcome must be attributable to an **announced** cause at debrief — no unexplained variance anywhere (CLAUDE.md §1: uncertainty during play must become interpretable afterward, never a shrug). |
| **C12** | **Decision quality vs outcome** | TEACHABLE, **mandatory** (founder non-negotiable #6), and at 5–6 **the product does the separating**: show the class distribution of outcomes for the **same** decision so students see identical choices produce different results, and the teacher says the sentence for them (Rule 11). | TEACHABLE with the student doing the sorting: classify cases into good-decision/bad-outcome and bad-decision/good-outcome, then defend the sort (Rule 11). Supported by C3 D3.4.6-8 (counterclaims) and D4.4.6-8 (critique for credibility). | **The model must permit good reasoning + bad outcome and weak reasoning + good outcome**, and the class evidence must contain **at least one actual instance of each from the room's own play** — not from a slide. **No score anywhere rewards matching the historical move.** Anchors: Portland/Oden 2007 run as a two-stage reveal on 2007 information, where **most classes will also pick Oden** (§5.6) — versus Dallas/Dončić 2025, where the criticism was of the *reasoning at the time*; give students Harrison's quoted rationale and **do not editorialize the verdict**. **Neither band may be relied on to make this distinction unprompted — adults fail at it** (Baron & Hershey; Rule 11's own caveat, and §7.11 notes the developmental literature for 10–14-year-olds is thin). |
| **C13** | **Market size as inherited and unequal** | TEACHABLE, and the accessible payload is a subtraction: **every team receives the identical national check — $143M in 2025-26, up from $103M** — while 2024-25 team revenues ran **$833M (Golden State) to $301M (Memphis)** (§8.1 #13, #15). The equal part and the unequal part on one screen. | TEACHABLE at a harder object: **market size does not relieve the cap constraint.** New York — $218,412,232, over the first apron, ~$171M in four players — against Oklahoma City, smallest market, $218,365,399, hard-capped at the second apron with $2.82M of room. Same trap, opposite market. C3 D2.Eco.1.6-8 (systemic consequences) lives here. | **The league publishes no official market-size tier** (§4.6), and §8.2 #11 forbids presenting one. So market position must be instantiated **only by dated, sourced financial facts**, never by a Large/Mid/Small chip. Assignment exogenous, visible, and **unscored**; and the class evidence must contain **at least one small-market path that wins on a displayed dimension** — the real one exists (OKC won 2025 from the smallest market, then reportedly saved $224M in payroll and tax while holding 13 future firsts). |
| **C14** | **Time-inconsistency / win-now vs later** | TEACHABLE only in a concrete two-period form, and the periods should be the module's **own lessons** — this year vs next year, felt across a class boundary. CEE grade 8 owns present-**and-future** consequences, so at 5–6 this is experienced and named simply, not analysed. | TEACHABLE across three periods, with a commitment device (C5). The best assessment prompt in the dossier lives here and **its answer is not yet known**: OKC extended SGA (4 yrs, $285M from 2027-28), Holmgren and Williams; ask students to predict what OKC gives up in 2028–2030, reasoning from the Boston case. | An action whose payoff arrives **at least one lesson later**, with the intervening lesson **visibly worse for having taken it** — and the reverse path must also exist, or the module taught patience as a virtue rather than intertemporal choice. Anchors: Boston's two supermaxes (Tatum 5 yrs/$314M; Brown up to $304M) **mathematically guarantee** the apron problem twelve months later — hand students the two numbers and the second-apron line and let them find the squeeze before being told (§5.10). |
| **C15** | **Marginal vs average reasoning** | **NOT TEACHABLE.** CEE places *marginal* benefit/cost at **grade 8**; rate of change ("dollars per win") is 8.F. §8.2 #21 bars the ratio outright in a grade-5-inclusive lesson. Any per-win, per-dollar or efficiency figure disqualifies the 5–6 build. | TEACHABLE at grade 8 as the CEE benchmark, and there is a clean §8.1-safe instantiation that avoids the forbidden tax bill entirely. | The next unit must cost more than the average unit, on a quantity the dossier permits printing. **Use the MLE ladder — $15,044,000 → $9,366,000 → $6,064,000 → nothing** (§8.1 #7): "your tool shrinks as you spend more" is a marginal-cost-of-spending object with no tax dollar in it. The luxury tax's escalating brackets are the truer object but are **blocked by §8.2 #5** (rates come from one source family, never cross-checked against the CBA; the $24M→$62.5M worked example is single-source) — a candidate may model them and label the arithmetic as its own, or wait for the CBA read. |
| **C16** | **The constraint itself is a variable** *(added — dossier-driven)* | TEACHABLE, and it is the single most under-used fact in the corpus. The cap is **not** a number handed down from nowhere: it is a formula, it may never fall, and it may never rise more than 10% in a year. | TEACHABLE with the mechanism: cap = (44.74% × projected BRI − projected benefits) ÷ 30. **The 2026-27 cap came in ~$1M below the league's own projection because local media revenue fell, and that reduction flowed through to the floor, the tax line and both aprons** — trouble in 13 cities moved the spending limit for all 30 teams (§3.3). | The constraint number must **move at least once inside the module for a stated, attributable reason**, and the room must see the same trigger produce different outcomes under different rules (the 2016/2025/2026 triple, §8.1 #5). This is C4's institution limb with a number attached. It is also the antidote to FL8. |
| **C17** | **Collective action across a threshold** *(added — flagged as declinable)* | TEACHABLE but **at the module's edge**. When more teams duck the tax, the payout to those who stayed under shrinks — **$11.5M each in 2024-25, ~$4.9M projected in 2025-26 across 23 non-taxpayers**. Seven of fourteen projected taxpayers ducked at the 2025-26 deadline. | TEACHABLE, and it is a genuine class-prediction exercise with a real answer. | Each desk's payoff must depend on **how many other desks crossed**, and the room must be able to see the count before the reveal explains it. **I recommend Module 1 decline this** unless a candidate can carry it without a redistribution mechanic: redistribution is M2's named territory (D2, and M2's C6), and §8.2 #8 forbids rendering any revenue-sharing percentage. Recorded so a candidate that *does* use it is judged against a stated bar rather than improvised approval. |

**Two anti-trespass notes.** (1) **Expected value and negotiation belong to M4** (D2; CLAUDE.md §7:
"uncertainty, expected value, negotiation taught inside draft mechanics"). M1 may use uncertainty
(C11) and bargaining power (C10) but must not build an EV calculation. The naming collision between
M1's L1 "Draft Day" and M4 "Draft Day" makes this an easy and invisible trespass. (2) **Revenue,
incentives and path-dependence-as-topic belong to M2** (D2). M1's path dependence is
*commitment-driven* — the books, the tools, the picks — not revenue-driven.

---

## 3. WHICH CONCEPTS PAIR IN ONE LESSON, AND THE ANTI-PAIRINGS

### Pairings

- **C1 + C2 + C3 — one lesson.** They are one discovery seen three ways: the constraint binds
  (C1), the thing you didn't take is gone (C2), and the shape of what you built is a choice (C3).
  C3 alone is a puzzle; C2 alone is a vocabulary word; C1 alone is a sentence.
- **C4 + C8 — one lesson.** The apron *is* the institution's teeth. A cap ladder taught without a
  tool confiscation is a taller wall, which is FL2 with extra steps. Order inside the lesson is
  forced: cross the line, lose the tool, *then* be told the line has a name.
- **C5 + C6 — one lesson, with C5 as the seam and C6 as the topic.** Path dependence must be the
  *joint* between lessons, not a lesson's subject (D18 precedent; M2's contract reached the same
  conclusion about its C9). Dead money is the most legible thing path dependence can hand you.
- **C7 + C14 — one lesson.** Option value *is* intertemporal choice with the word "later" in it.
  Splitting them produces two thin lessons that both mean "wait."
- **C11 + C12 — one lesson, and strictly in that order.** You cannot separate a decision from its
  outcome until you have seen the room's own spread of outcomes for the same decision. Reversed, it
  is an assertion.
- **C13 + C1 — one lesson.** Market size pairs with *scarcity* here, not with revenue (revenue is
  M2). The teachable claim is "the constraint is the same for everyone and the starting position is
  not," which is exactly the OKC/NYK foil.
- **C9 threads everywhere and is never a lesson.** It is the property that keeps every other
  decision from being forced.
- **C16 belongs wherever C4 lands**, as its second half.
- **C15 is a 7–8 extension inside whichever lesson carries the MLE ladder.** Never its own lesson,
  never present at 5–6.

### Anti-pairings

- **C10 (bidding) with C8 (apron), in one lesson.** Two different sources of "the thing I wanted is
  gone" in the same forty minutes destroys attribution: the pair cannot tell whether they lost the
  player to a rival or to the rule, and **attribution is the whole product** (CLAUDE.md §8: the
  student must be able to attribute the consequence to their own choice).
- **C2 (opportunity cost) with C6 (sunk cost) in the same beat.** These are the two costs students
  most reliably merge — one is about the future, one is about the past, and both are called "cost."
  Naming both in one debrief guarantees the merge. Separate lessons, and the later debrief must
  explicitly contrast them ("the money you gave up by choosing" vs "the money that is gone whatever
  you choose").
- **C3 + C11 + C12 together at 5–6.** That is three simultaneous causal variables, and Kuhn, Pease
  & Wirkala found only ~1/3 of sixth graders consistently implicate three even with the causal
  structure displayed pictorially and in text — and a 4th/5th-grade inquiry intervention "did not
  affect their multivariable prediction skill appreciably" (§6.3, high).
- **Any cap *debate* before the cap has bitten.** "Is the cap fair?" held before a pair has been
  blocked by it is a civics lesson, and a 55-minute lesson that spends 20 minutes debating has no
  economics in it. This is M2's own recorded L3 risk; M1 should not rediscover it.
- **More than two new terms plus a new mechanic in any 5–6 lesson.** Rule 10 caps 5–6 at two terms
  per lesson, each named only after the phenomenon was produced.
- **C17 anywhere near C13 in the same lesson.** Redistribution beside inherited inequality reads as
  a fairness lesson, not an economics one, and it walks straight into M2's territory.

### Ordering constraints (not a lesson design — the seams the pairings force)

Three orderings are **forced** and any candidate that violates them is arguing against the pairing
logic above, not merely choosing differently:

1. **C1+C2+C3 must precede C4+C8.** You cannot experience a *ladder of different kinds of
   constraint* before you have experienced one constraint binding. A tool confiscation delivered to
   a pair who has never been blocked is a rule they were told.
2. **C5's carry must be created before it is felt.** Path dependence requires a decision the
   student made in an earlier session; it cannot be seeded fictionally without becoming narration.
3. **C12 must come last.** Decision quality vs outcome is the module's hardest ask and it needs the
   room's own accumulated evidence — several lessons of identical choices producing different
   results — to be anything other than a slogan. It is also what M2's contract's FL5 depends on M1
   having established.

---

## 4. FALSE-LESSON RISKS

Ordered by how badly the false version damages a grade 5–8 mental model. Each carries a real NBA
fact from the dossier and a **falsifiable** design property. "Falsifiable" means: a property test,
a brute-force sweep, or a named artifact can show it does not hold. An assurance is not a property.

| id | False lesson | Why it is false (dossier fact) | Falsifiable design property that prevents it |
|---|---|---|---|
| **FL1** | **"The best team is the most expensive team."** *(The founder's named target intuition. It inverts the entire module, and it is the default belief a 10-year-old walks in with.)* | **New Orleans carries the ninth-highest payroll in the league — $212,290,592 — without being a contender** (§4.1 #12, explicitly "the counterexample the class set needs"). Oklahoma City won the 2025 title from the smallest market and reportedly saved **$224M** in payroll and tax the following offseason while holding 13 future firsts. Detroit has the **lowest** committed payroll and the fullest toolkit ($15,044,000 NTMLE available, 7 firsts through 2033). Philadelphia has the league's most extreme concentration — ~$156M of a $165M cap in three players. | **(a) No monotone map from money spent to any displayed outcome.** Brute-forced over the reachable action space: for a majority of seats there must exist a cheaper allocation that beats a more expensive one on the primary displayed dimension. **(b)** The class evidence must contain **at least one actual instance from the room's own play**, not a slide. **(c)** No board surface ranks desks by payroll, and no single scalar "team quality" exists anywhere in the model, payload, or renderer (this is also VISUAL_TARGET's "Team OVR" prohibition, and D4's). |
| **FL2** | **"The cap is just a wall that stops you buying."** *(The module's own title concept, wrong. Also the most likely accidental lesson, because a blocked button is the easiest thing to build.)* | The cap is **soft** — you may exceed it via Bird rights, MLE, BAE, TPE, or minimum contracts (§2.1). **22 of 30 teams were operating above it under hard caps as of 2026-07-10.** And the **floor** runs the other way: you must spend at least **$148,465,000**, exactly 90% of the cap, or pay the shortfall to players league-wide — not to your own roster (§2.1, §8.1 #2). | **(a) Ladder property:** at least one legal, ordinary action must take a pair **above** the cap line; and the lines a lesson carries must not all behave identically — at least one crossable at a price or with a tool, at least one not crossable at all. **(b) Band-specific clause, and it is load-bearing:** Rule 6 says over-cap at 5–6 should be a *blocked action with a plain-language reason*. That is acceptable **only if the second line the 5–6 lesson carries is a price or a confiscation** — if both of 5–6's lines block, the 5–6 build teaches FL2 by construction and is rejected. **(c)** The floor must bind on at least one reachable path somewhere in the module, because "you must spend at least this" is the fact that makes it unmistakably not a wall. |
| **FL3** | **"The real GM was right, because that's what happened."** *(Outcome bias. The deepest and most transferable false lesson in the track; M2's contract depends on M1 having killed it, and adults fail at it.)* | **Greg Oden was the widely accepted pre-draft consensus No. 1 in 2007**, projected as a top pick since high school; the class will mostly pick him too (§5.6). Toronto traded its most popular player for someone with one year left who was reported to prefer Los Angeles — **and won the 2019 championship, and he left** (§5.6). Milwaukee made the *same category* of aggressive bet twice: Holiday 2020 → a 2021 title; Lillard 2023 → **$22.5M/yr of dead money** (§5.6, and confirmed in the 2026-27 books at $21,311,053 through 2030-31). | **(a) No score, award, bonus or reveal language anywhere rewards matching the historical move** — grep-assertable. **(b)** Every commit-then-reveal beat presents the decision-maker's **information set as it stood at the date**, and **(c)** ships **at least one paired counter-case** where a near-identical decision ended differently (the dossier supplies the pair ready-made: LAL/Davis 2019 and LAC/George 2019 — same summer, similar price, opposite result, §5.7). **(d)** Reveal language is "here is what they did and what happened," never "correct." **(e)** The model must permit good-reasoning/bad-outcome and its mirror (C12's instantiation), so the concept is not merely asserted. |
| **FL4** | **"Small markets lose because they are run badly."** *(A false belief with reach far outside sports, and the one most likely to be reinforced by an unguarded class reveal.)* | **Every team receives the identical national television check: $143M in 2025-26, up from $103M** — Memphis and the Lakers get the same wire (§8.1 #13). Oklahoma City, the smallest market, won the 2025 title and is simultaneously the richest team in draft assets. Milwaukee — small market — won 2021. New York, the largest market, is $9.4M over the first apron with ~$171M in four players. **And the league publishes no official market-size tier at all** (§4.6). | **(a)** Market position instantiated **only** by dated, sourced financial facts — never a Large/Mid/Small label (§8.2 #11). **(b)** Assignment exogenous, visible, deterministic, attributable, and **never ranked** on the board. **(c)** The class evidence must contain a **small-market path that wins on at least one displayed dimension**. **(d)** A big-market and a small-market club in the *same* cap trap must both be reachable seats, so the room can test whether market size relieves the constraint — and see that it does not. |
| **FL5** | **"You can always undo a mistake."** *(Damaging because it hollows out every other lesson: if commitments are reversible, opportunity cost is a rental fee.)* | **Renouncing a free agent permanently destroys Bird/Early-Bird/Non-Bird rights to him for that free agency**, irrevocably except in a narrow offer-sheet-rescission window (§2.5). A stretched player **cannot be re-signed or reacquired** until the July 1 after his original contract would have ended (§2.9). Phoenix's stretched Beal charge runs **through 2029-30** at $19,383,010 a year (§4.1 #5). The Brooklyn 2013 picks were **unprotected** — the worse you got, the more you paid — and Boston used the 2017 swap to hold the No. 1 overall pick while being the East's top seed (§5.2). | **(a)** At least one action per lesson is **irreversible by construction**, its irreversibility stated **before** commitment, and the loss visible in a **later lesson's opening state**. **(b) The paired counter-clause, and it is not optional:** irreversible ≠ unrecoverable. For every reachable opening — including every seeded L2/L3 opening and the honestly-labelled stock franchise — **at least one legal action must satisfy that lesson's stated obligation**, brute-force verified over the whole reachable carry space (CLAUDE.md §1: bad decisions matter but stay generally recoverable). **(c)** Reversible until commit; only an actual retraction costs. |
| **FL6** | **"Spending is bad and saving is good."** *(The moral reading a 10-year-old defaults to, and the one the discarded M1's own award actively computed.)* | The **floor makes underspending illegal**: $148,465,000, with the shortfall paid to players league-wide rather than to your roster (§2.1). Houston spent its entire stockpile on Durant after finishing as the West's No. 2 seed (§5.3). Chicago has the **flattest payroll in the league**, all its own firsts intact, no tax — and no star and no direction (§4.2). Sacramento's fork is "pay the tax to stay mediocre, or tear it down" — **neither answer is comfortable** (§4.1 #11). | **(a) Symmetric error consequences** (M2's R6, inherited): the modelled penalty for over-committing and for under-committing must be within the same order of magnitude, brute-forced, or the asymmetry is defended in writing on economic grounds. **(b)** A pure hoarding strategy — commit nothing, keep everything flexible — must be **strictly beaten by some active strategy for a majority of seats**, verified by sweep. **(c)** No mechanic's *prize* may be a ratio with spend in the denominator (this is precisely `freeAgency.ts:1417`, §0). |
| **FL7** | **"Paying the tax is greedy / ducking it is smart."** *(Moral framing dressed as economics. The most likely register error at this age, and the hardest to see in copy review.)* | **Only seven teams paid tax in 2025-26, totalling $223.1M** — and **seven of fourteen projected taxpayers ducked it at the deadline** (§3.8, high on the list). Joe Lacob said on the record that the Warriors' "Plan 1, or 1A" was to get out of the tax to shed repeater status (§3.7). Indiana's ownership was **prepared to enter the tax for the first time since 2005-06** for Myles Turner and pulled back after Haliburton's Achilles tear — **rational once the star was injured, not cheap** (§5.8). | **(a)** The module never renders a spend as "greedy," "reckless," or "brave," nor a save as "smart" or "disciplined" — assertable by the existing forbidden-vocabulary harness (`clientClaims.test.ts`, the one automatically cross-cutting instrument), extended with this list. **(b)** Both the pay-it and duck-it paths must be present in the class evidence **with defensible cases on each side**. **(c)** At 5–6 the debrief must still converge on one nameable mechanism (Rule 5 — no "both teams were right" endings); at 7–8 it may end in a defensible disagreement **adjudicated by evidence**, never at "everyone has their opinion," which is the multiplist failure mode this exact age is most prone to (Kuhn, Cheney & Weinstock). |
| **FL8** | **"Flexibility is free."** *(Quiet, and it teaches a strategy — hoard — that is wrong in this domain and in most others.)* | **Cap holds: the empty chair still costs money.** Until a free agent re-signs, signs elsewhere, or is renounced, he occupies the sheet at 150%/190%/250%/300%/130%/120% of prior salary (§2.5). A team with fewer than 12 players counted between July 1 and opening night is **charged a rookie minimum ($1,357,763) per empty slot** — you cannot manufacture room by emptying the roster. Going under the cap to use room **costs you the bigger MLE**: $15,044,000 becomes $9,366,000 (§2.4, "a genuine two-path choice with no dominant option"). Chicago's **$17,991,071** trade exception expires. | **(a)** Holding capacity must carry a **running cost or an expiry inside the model** — not a warning label. **(b)** There must exist **at least one reachable state where a pair that kept everything flexible is strictly worse off than one that committed**, verified by sweep. **(c)** If the UI says "you kept your options open," an option must be enumerable and its cost computable; narrative may never outrun the model. |
| **FL9** | **"The cap is a fixed number handed down from nowhere."** *(Least dramatic, but it is the difference between an institution and a law of physics — and C4 is the module's title.)* | Cap = (44.74% × projected BRI − projected benefits) ÷ 30; it **may never fall and may never rise more than 10% year over year** (§1.3). It rose **~34% in 2016-17** with no ceiling, exactly **10.0% in 2025-26** at the ceiling, and **6.7% in 2026-27** — under the ceiling, because revenue growth slowed. And the 2026-27 figure came in **~$1M below the league's own projection because local media revenue fell**, with the reduction flowing through to the floor, the tax line, and both aprons (§3.3). | **(a)** The constraint number must **move at least once inside the module for a stated, attributable reason.** **(b)** The room must see **the same trigger produce different outcomes under different rules** — the §8.1-safe 2016/2025/2026 triple. **(c)** Ideally, students propose their own smoothing rule before being told the real one (§5.9's prescription). **(d)** The 2016 cap spike is also the winner's-curse setup: run the sealed auction first, reveal 2016 second — but at 5–6 the curse must be experienced as the **room's own price distribution**, never as an expected-value calculation. |

---

## 5. DOMINANT STRATEGIES

For each mechanic family Module 1 might use: where the exploit lives, how a 10-year-old finds it
without meaning to, and what breaks it. Named failure modes from the brief are marked ▸.

### Family 1 — Constrained roster allocation (the knapsack)

- **▸ "Sweep the dial," M1 dialect: enumerate-and-fill.** With ≤10 pieces, a printed price, a
  printed value and an always-visible running total, the optimum is *reached by trial*, not
  reasoned. A 10-year-old finds it by doing what the interface rewards: adding, watching the meter,
  backing out, adding something else. This is the single most likely M1 failure and it will feel
  like engagement.
  **Breakers:** REASONING TEST (a)–(d). Concretely — two non-summable objectives; no scalar on the
  card (role + price + one strength + one risk, per Rule 15); a second binding constraint (roster
  slots); and non-separability, so that what a piece is worth depends on what you already own and
  greedy provably fails.
- **▸ "Always spend to the cap."** If unspent money has no use, spending it is weakly dominant and
  the pair learns "fill the bar."
  **Breakers:** the FL8 properties — cap holds, the empty-slot backstop, the MLE tier you lose by
  using room, and an expiring tool. Plus: after a maximal commitment, the ≥2-affordable-substitutes
  property must still hold, so full commitment stays legal but not free.
- **▸ "Always hold everything."** The mirror, and the one a cautious pair finds.
  **Breakers:** the FL6 properties — the floor binds somewhere; a hoarding strategy is strictly
  beaten by some active strategy for a majority of seats; symmetric error costs.
- **▸ "Copy the neighbour."** In a pairs-on-one-device room with a projector, a visible allocation
  propagates in seconds.
  **Breakers:** no comparative money or comparative-roster display while any decision is open;
  different seats hold **materially different starting books** (which the real league supplies for
  free — Detroit's $136M against Denver's $227M), so a copied allocation is illegal or wasteful in
  the copier's own cap sheet. Heterogeneous starting positions are the cheapest copy-breaker
  available and the dossier hands them over already sourced.
- **"Buy the biggest name, fill with minimums."** A real strategy, so it must not be dominant.
  **Breaker:** Philadelphia's ~$156M-in-three-players concentration must be a *legible* path with a
  legible cost (§4.5), and the class evidence must contain a balanced roster beating it on at least
  one displayed dimension, and vice versa.

### Family 2 — Sealed bidding

- **▸ "Bid one dollar more than I think they'll bid."** First-price sealed bidding with no reserve
  invites exactly this, and it is found instantly.
  **Breaker:** it is not actually a defect — it is the mechanism working — *provided* the bid has a
  real budget cost elsewhere. The defect appears when losing is free: then "bid everything on the
  one I want" is dominant. **The bid must cost something even when it loses** — a held reserve, a
  slot held open, a day of the window spent — or the pool must shrink for everyone as bids are made.
- **▸ "Copy the board."** If any comparative money is live on the projector while decisions are
  open, the room converges on the leader and the module has built a leaderboard (D4).
  **Breakers:** M2's R13, inherited — no comparative money display while any decision is open; and
  D26/D47 gating, where numbers are gated **into the payload** keyed off a module-owned beat, never
  filtered on the client, so the choreography lives where a unit test can reach it.
- **Fandom exploit.** A student who knows the real player's market bids better. Direct CLAUDE.md §3
  violation.
  **Breaker:** the economics must be fully decidable **from the briefing card alone**; domain
  knowledge may add colour, never accuracy. §7.12 #7 records that this claim has **never been tested
  against a non-fan reader** — the check is owed, and the two named at-risk cases are the Gobert
  trade and the SGA supermax.
- **Tie-breaking by arrival time.** Deterministic but economically dishonest ("why did they get
  him?" "their laptop was quicker") — `tradeDeadline.ts:783`, `freeAgency.ts:838`.
  **Breaker:** an in-model tie-break. Remaining cap room, or the player choosing — and the player
  choosing is *real economics*, because incumbents may offer 5 years/8% while everyone else may
  offer 4/5% (§8.1 #10).
- **Winner's curse.** The designed payoff (§5.9) and the reason to run the auction before the 2016
  reveal.
  **Constraint:** at 5–6 it must land as the room's own price distribution, with no probability and
  no EV.

### Family 3 — Trade / swap

- **⚠ Hard block before any exploit analysis: §8.2 #1.** **No trade salary-matching percentage may
  be rendered as NBA truth** — not 100%, not 110%, not 125%. Three researchers produced three
  incompatible accounts; the only primary-text reading (100% + $250,000, with 125% living in the
  *Expanded* TPE) contradicts both cap databases (§7.1, flagged as the most dangerous disagreement
  in the corpus). **A trade lesson that prints a matching percentage fails this contract.** The two
  legal routes are: (i) run on a registered, labelled module rule stated in the module's own voice
  ("in this room, a trade must send out at least as much salary as it takes back"), recorded in the
  simplifications ledger with its misconception risk; or (ii) resolve against CBA Article VII first.
- **▸ The compliant-counterparty money pump.** If a modelled counterparty accepts any salary-legal
  trade, the pair finds the one that dumps its worst contract and takes back its best, and repeats.
  A 10-year-old finds this in one lesson by trying the greediest offer and discovering it works.
  **Breaker:** the counterparty must have **its own binding constraint and its own objective**, and
  must refuse — with an economically legible reason ("they are hard-capped at the first apron and
  cannot take back more than they send"). Refusals are the teaching surface, not the friction.
- **▸ Aggregate-and-dump.** Combine two bad contracts to absorb one good one.
  **Breaker:** the real second-apron rule — **you may not aggregate two or more salaries in a
  trade** (§2.3, uncontested across all three researchers) — which is also the most teachable
  apron rule in the system. Note it belongs to Family 5's territory: it is a *tool confiscation*,
  not a matching rule, and is therefore **not** blocked by §8.2 #1.
- **Structure propagation.** If completed deals publish in full on the projector, one clever pair's
  structure spreads.
  **Breaker:** the honest publication rule the old M1 got right (`tradeDeadline.ts:783`,
  `:1207`) — only a consummated deal publishes its price; losing bids and reserves stay private
  forever, before *and* after the reveal. That is exactly what a real market discloses.

### Family 4 — Hold-vs-spend across rounds

- **▸ "Always hold, spend last."** If unsold assets get cheaper and no one else can take them,
  waiting strictly dominates. **This is observed, not hypothetical:** the old L3's zero-offer decay
  is −$10M/day, so the largest price mover is usually an agent **nobody bid on**, and the projector
  card claiming the room's offers moved the price is false (B3).
  **Breakers, all three needed:** (i) supply genuinely leaves the pool when someone else takes it —
  permanent loss, not benching (`draftDay.ts:286-300`); (ii) waiting must **sometimes raise** the
  price, which the real rules supply for free (the incumbent's 5yr/8% advantage means waiting for
  someone else's free agent means paying more, always); (iii) real expiries — a TPE that dies in a
  year, the September 1 stretch election deadline, the 5:00 p.m. ET June 29 qualifying-offer
  deadline.
- **▸ "Always spend immediately."** The mirror, if holding carries cost and no benefit.
  **Breaker:** FL6's symmetry property.
- **▸ "Wait for the teacher."** In a scaffolded 5–6 room the genuinely dominant student strategy is
  to do nothing until the worked example appears.
  **Breaker:** the scaffold must be a worked **first round run with the class**, after which the
  class faces a card that is *different in kind*, not the same card with new numbers. If round 2 is
  round 1 restated, the room copied a demonstration and the meta-analysis's consolidation benefit is
  the only thing that happened.
- **▸ "Let the bell decide" — the platform-created exploit.** The runtime's TIME CUT gives every
  unresolved desk a module-authored fallback (`RoundContract.unresolved`, `fallbackPolicy`). **If
  the fallback is economically better than a rushed decision, the dominant strategy is to never
  commit.** This exploit exists because of the platform, not the subject, and no other family will
  surface it.
  **Breaker:** a property test asserting that **no seat's fallback outcome dominates that seat's
  best available action**, over the reachable state space — plus the per-desk `fallback` /
  `selfFallback` sentences naming, before the close, exactly what waiting costs.

### Family 5 — Commit-then-reveal historical operation

- **▸ "Guess what happened."** The famous case is famous *because of its outcome*, so the answer
  leaks through whichever student follows basketball.
  **Breakers:** withhold the case's identity until after commitment; prefer **paired cases with
  near-identical decisions and opposite endings** (LAL/Davis 2019 vs LAC/George 2019, §5.7; the
  dossier's explicit instruction is to "force students to explain the difference without saying one
  team was smarter"); grade the reasoning, never the match; and no matching score exists anywhere in
  the module.
- **▸ The contrarian heuristic — the exploit nobody expects.** Two beats in, students learn that in
  *this product* the famous move is always the wrong one, and start voting against whatever looks
  obvious. This converts an outcome-bias lesson into a new bias.
  **Breaker:** at least one beat where the consensus move was genuinely right and **indistinguishable
  ex ante** from the ones that failed — the dossier supplies it (Milwaukee/Holiday 2020 → 2021
  title; OKC/George → 2025 title, §5.7). Without a right-consensus case, the module teaches
  contrarianism.
- **▸ Read-ahead.** If every beat's numbers ship into the payload and are hidden on the client, one
  devtools panel wins the lesson.
  **Breaker:** D26/D47 — payload-level gating keyed off a module-owned beat, with a per-beat test
  looping every beat and requiring each key `undefined` before its beat
  (`hostTheLeague.test.ts:1960-1989` shape).
- **Reveal that reveals nothing.** M2's R3, inherited: for every seat, at least one revealed
  quantity must be underivable from anything that seat could see before committing.

### Family 6 — Any multi-round money loop (cross-cutting)

- **▸ Snowball.** If capacity funds quality and quality funds capacity with no brake, round 1's
  leader wins by construction. **This is acutely wrong for Module 1**, because the cap *is* the
  league's real anti-snowball device — a snowballing M1 model refutes its own subject.
  **Breakers:** diminishing returns; and, honestly, **let the institution do the work it actually
  does** — the tax as a rising price and the apron as a tool confiscation are the real brake, and
  using them is both truer and cheaper than inventing one.
- **▸ Death spiral — the acute M1 risk.** Dead money is a *permanent* charge, so a carried-forward
  pair can arrive at a lesson unable to change anything. This is a **real, reachable, sourced
  position**: Memphis holds **$3,926,207 of room against $21,909,021 of dead money** (§4.1 #9). It
  is also already a defect in the discarded module: L1→L2 **silently deletes the franchise of any
  team that was shocked and did not repair** (M11), which destroys the identity of the pair most
  affected by the lesson's dramatic beat.
  **Breaker:** the recoverability invariant (FL5(b)) brute-forced **over the whole reachable carry
  space including every seeded opening and the stock franchise**, not spot-checked.
- **▸ The state-sludge exploit.** A pair discovers that **not acting** produces a cleaner carried
  state than acting, so inaction becomes the meta.
  **Breaker:** no reachable "did nothing" state may be weakly better than every "did something"
  state, verified by sweep; and the carry must include something a non-actor also receives (an
  honestly-labelled stock franchise, D18 / CLAUDE.md §9).

---

## 6. THE TWO-BAND SPLIT AS AN ECONOMIC QUESTION

D22 program #2 requires "one M1 architecture with a shared economic world, shared persistent
franchise logic and shared consequences, plus grade-specific depth and scaffolding. **Not M1 for 5–6
followed by a fork.**" That is a runtime statement. Here is the economic one.

### What must be IDENTICAL, because the economics is the economics

1. **The world.** Same league, same 2026-27 thresholds ($164,961,000 / $148,465,000 / $200,428,000 /
   $209,015,000 / $221,686,000), same clubs, same cases, same dates. Two rooms looking at two
   different leagues is two products.
2. **The mechanism.** One reducer. Given the same actions from the same state, the two bands must
   resolve **identically**. If a 5–6 model and a 7–8 model produce different consequences for the
   same choice, the bands have learned two different economics and D22's shared-consequence
   requirement is false in the only place it matters.
3. **Which concepts are true.** Opportunity cost is opportunity cost. The cap is soft in both rooms.
   Dead money persists in both rooms. **Every false lesson in §4 is false in both rooms, and every
   falsifiable property in §4 binds in both rooms.** *A band may not be exempted from a
   false-lesson guard.* This is the load-bearing sentence of this section: depth is a dial on what a
   student is asked to do, never a dial on what is true.
4. **Decision quality ≠ outcome.** Both bands, always. What differs is **who does the separating**
   (Rule 11), never whether it is separated.
5. **Irreversibility and recoverability.** Both bands. Both properties.
6. **Attribution.** Both bands must be able to name the choice that produced today's state. 5–6 is
   told; 7–8 diagnoses. The *fact* is identical, and if a 7–8 room cannot diagnose it because the
   information is absent, "silent" has become "hidden" and the band split has broken attribution.
7. **The real numbers.** Real cap figures stay real in both rooms. What changes is the **arithmetic
   the student must perform** (§6.2's direct product consequence; CLAUDE.md §3's "simplify the
   interface before simplifying the economics"). A 5–6 room that sees a rounded fake cap has been
   given a different world, not a simpler one.

### What is legitimately different — and the harder ECONOMIC OBJECT 7–8 gets

Not "more numbers." In each row, 7–8 faces a structurally different object.

| Concept | 5–6 object | 7–8's genuinely harder object |
|---|---|---|
| **C2 Opportunity cost** | *The named forgone thing.* One item, specific, permanently gone. Identify it. | **The subjectivity of opportunity cost** (CEE grade 8, Std 1 b3–4). Two desks facing the identical menu have different opportunity costs because they hold different books, and both are right. This requires a **defence**, not an identification — and it is the concept whose grade placement most clearly separates the bands. |
| **C4 Cap-as-institution** | **Two lines, of two different kinds.** One blocks, one prices or confiscates. | **Three lines plus the trigger.** The hard-cap conversion (§2.3): *you turn a soft line into an absolute wall by your own transaction.* A conditional constraint the student **creates** is categorically harder than one imposed on them, and nothing at 5–6 substitutes for it. |
| **C3 Constrained allocation** | A bounded menu: 3–5 options, all legal, none dominated, no compound moves (Rule 4). | **A sequential constraint.** ≥1 compound move — renounce-then-sign, sign-and-trade, take-back-salary-for-a-pick — where **the legality of step 2 depends on step 1**. Also ≥1 dominated-looking option that is correct under a constraint. |
| **C5 Path dependence** | Carried, and **surfaced in plain language** at the next lesson's opening, computed from the carried field (Rule 14). | Carried **silently**, diagnosed by the pair. Plus a **commitment device**: an action that deliberately destroys a future option in exchange for something now. The real one is exact — the Designated Veteran contract is the biggest offer available *and* the player **cannot be traded for one year** after signing (§2.8). The biggest offer is also the one that removes the escape hatch. |
| **C6 Dead money** | The line item exists; it names a person; the money is gone either way; the live question is the roster spot. | **The stretch as intertemporal transfer.** Same total, different years, with a ceiling on how much may be pushed forward — requiring reasoning about a *future* books state, which is exactly the grade-8 "present and future consequences" benchmark. |
| **C11 Risk** | **Ordinal only.** Safe / solid / boom-or-bust; a bar of ten chips. The evidence is the **room's own spread**. | **Numeric probability** (7.SP.C.5) and **long-run frequency built from the class's own pooled results** (7.SP.C.6). EV stays flagged above-grade and belongs to M4. |
| **C15 Marginal reasoning** | **Absent.** No ratios, no per-unit figures, no "dollars per win" — 8.F, and §8.2 #21. | The **rising cost of the next dollar**, on the MLE ladder ($15.044M → $9.366M → $6.064M → nothing). Grade-8 CEE benchmark, §8.1-safe, and no tax bill required. |
| **C10 Bidding** | Open, sequential, **visible shrinking supply** (Rule 12 — **LOW confidence, unsourced; playtest it**). | **Hidden simultaneous** bids, requiring a belief about what rivals will do. A different object, not a harder one. |
| **Counterfactual** | The product **runs and displays** it ("here is your team if you'd kept the pick"). Rafetseder & Perner: mature counterfactual reasoning is not reliable in all children before ~age 12. | The product **withholds** it. The student constructs *"what would have had to be true for the other choice to be right?"*, and it is revealed only after they commit an answer. |
| **Argument** | Two moves: "I chose X because Y, and here is the class evidence." (W.5.1 — *opinion*.) | Three moves: the same, **plus the strongest case against their own decision and why their evidence still beats it**. (W.6.1 — *argument*; W.7.1a acknowledge, W.8.1a distinguish; C3 D3.4.6-8 counterclaims.) **The word itself changes at exactly this boundary.** |
| **Debrief scope** | "What did **your** choice cost **your** team?" — generalization is **personal**. | "Who else in the league was made better or worse off, and would the same choice be right for a different team?" — generalization is **societal** (C3 D2.Eco.1.6-8, D2.Eco.2.6-8). |
| **Debrief resolution** | Must **converge** on one nameable mechanism and one right-ish reading. **No "both teams were right" endings.** | May end in a **defensible disagreement** — but **adjudicated by evidence**, never left at "everyone has their opinion." |
| **Vocabulary** | ≤2 new terms per lesson, from the grade-4 CEE pool, each named **only after** the phenomenon was produced. | 3–4 terms, may include grade-8 CEE terms (marginal cost/benefit, substitutes, relative price, predictable incentive response); one may be pre-taught if needed to read the interface. |

### The one asymmetry that is not a depth setting

**The front half of the loop.** Sinha & Kapur: problem-solving-before-instruction is **g = +0.50 at
grades 6–10** and **g = −0.09 at grades 2–5**, and higher fidelity to Productive Failure principles
predicted higher effects for 6–10 but **not** for the youngest band. Mazziotti et al. found no
significant PF advantage in 228 German fifth graders on conceptual knowledge, naming lower working
memory, weaker frustration self-regulation, and less developed collaborative dialogue as
prerequisites.

The 5–6 band **contains grade 5**, so it straddles the moderator. Therefore:

- **7–8 faces the constraint cold for 1–2 rounds**, generates its own approaches, and gets the
  teacher-led contrast only at consolidation.
- **5–6 gets a worked first round run with the class**, a visible constraint state, an in-product
  prompt naming the trade-off being faced, and a mandatory teacher-led contrast.
- **Both bands keep the consolidation stage.** Only the front half is released.

This is not a UI setting. It changes what the student is asked to **discover** versus **apply** —
which is a different economic demand, and running the 7–8 front half on a grade-5 room runs the
exact condition the meta-analysis found *negative*. Rule 3 rates itself the highest-stakes rule in
the set, and I agree with that rating. (One honest caveat for the teacher: exploration-first costs
immediate performance and buys transfer, so a flat immediate quiz must not be read as failure.)

### The runtime consequence, stated as an economic requirement

D38 records two attachment points. PLATFORM_REALITY §3.3 shows a third is required: **the seed
envelope is exactly `{lessonModuleId, state}`**, so a 7–8 room seeded from a 5–6 room's L1 sees a
well-formed seed from the right module id, accepts it, and carries 5–6 franchise depth into a 7–8
lesson **with nothing in the runtime able to notice**.

The economic requirement, not merely the engineering one: **a cross-band carry must be refused or
honestly relabelled as stock.** The two bands do not present the same decision set — 5–6 never had a
compound move, never triggered a hard cap by its own transaction. A 7–8 L2 opening seeded from a
5–6 L1 therefore attributes to the student a constraint **they were never given the chance to
create**. That is an attribution failure, and attribution is the one thing this module cannot lose.

---

## 7. THE PERSISTENCE CONTRACT

CLAUDE.md §9 and D18: persist franchise state when yesterday's choice creates today's problem, and
the L1 roster → L2 deadline → L3 books chain is the canonical case. FROTH_BRIEF §8: strong
persistence, **selective** mechanical carry, no state sludge.

### What must carry, mechanically

Six fields. Every one is here because it changes a **reachable option set**, not a display.

1. **The books, by year.** Committed salary per future league year — not a single total. Path
   dependence is about *which years are spoken for*. Minimum horizon: three future league years,
   because every real device in the module (stretch, dead money, rookie-scale team options in years
   3 and 4, contract raises) operates over exactly that horizon.
2. **Dead money, by year and by name.** The person, the amount, the last year. A number without a
   name is a fee; **the name is what makes it sunk cost** (Milwaukee's third-largest cap charge is a
   person who plays elsewhere).
3. **Irreversible losses, as absences with reasons.** Renounced rights, traded or frozen picks,
   expired exceptions, players permanently taken by another desk. The carried state must be able to
   say *"you do not have X, and here is the decision that is why."*
4. **The tool state.** Which exceptions remain (NTMLE / taxpayer MLE / room MLE / BAE), and **whether
   a hard cap was triggered and at which line.** This is the cheapest and richest carry in the whole
   dossier — one flag and one number — and it is the entire difference between later options
   existing and not existing.
5. **Roster slots used.** The second binding constraint; without it, C1's 7–8 object is unreachable
   in later lessons.
6. **Franchise identity** — the real club and its market facts. Not economics, but it is what makes
   the carry *mine*, and VISUAL_TARGET is right that the franchise identity band is the single
   strongest element for the rebuild.

### What must NOT carry — state sludge

1. **Every historical action.** The runtime already owns the class log (`classEvents`, and the
   WHILE-YOU-WERE-AWAY fold-in). A seed that is a transcript is a transcript.
2. **Per-round intermediates**: previews, unlocked drafts, gate calls, reveal beats, UI state.
3. **Any value derivable from the books** — totals, room, distance-to-a-line. D15's frozen-fact
   discipline exists because live re-derivation once printed a false projector number, so the rule
   is precise: **carry the facts, freeze the claims within a lesson, never carry a claim across
   lessons.** A carried claim has no reducer behind it in the receiving lesson and will eventually
   contradict the receiving lesson's own arithmetic.
4. **Any other desk's data**, in any form. `studentView` must never leak another seat, before or
   after any reveal, and a carried blob is the easiest place for that to happen unnoticed.
5. **Outcome labels, strategy classifications, awards, or any evaluation of how the last lesson
   went.** `classifyStrategy` is on the discard list for a reason, and a carried judgment is a
   progression system (D4).
6. **Anything the module cannot honestly stand in for.** This is the practical test and it settles
   most arguments: *if the module cannot ship an honestly-labelled stock value for a field, that
   field is not carryable* — because an absent student must get a stock franchise, not a broken one
   (CLAUDE.md §9), and a stock franchise must never be disguised as a carried one (D18).

**Size budget, because it is an economic constraint here.** Every session read deep-clones the whole
state through JSON; every write re-serialises the entire store; the checkpoint holds a second full
copy; nothing is ever pruned. The carry must be a **bounded flat record**, not a log. A three-lesson
chain that accretes is a chain that visibly lags the projector during the reveal.

### The falsifiable property

**Named decision in L1, named reachable state in L3:**

> In L1, a pair signs a free agent using the **non-taxpayer mid-level exception ($15,044,000)**.
> Under the real rule (§2.4, §2.3), using the NTMLE **hard-caps that team at the first apron
> ($209,015,000)** for the remainder of the league year — a line it may not cross under any
> circumstance. Therefore in L3, that pair's action space is **strictly smaller**: any signing or
> trade whose resulting salary would exceed $209,015,000 is refused, and the refusal names the
> earlier decision. A pair that filled the same hole with minimum contracts reaches L3 with that
> same move **legal**.

Stated as a test:

> **P1.** There exist a specific L3 action **A** and two L1 histories **H1** (used the NTMLE) and
> **H2** (did not) such that A is **refused** under H1 and **applied** under H2, and the refusal
> reason names the L1 decision. Asserted by replaying the reducer over both branches. **If no such
> (A, H1, H2) triple exists, L1→L3 persistence is narration.**

Three companion properties, all required:

> **P2 — no sludge.** For every field in the seed envelope there exists at least one reachable L3
> state that differs on the basis of **that field alone**. A field with no reachable consequence is
> deleted from the seed, not documented.
>
> **P3 — recoverability across the carry.** For every reachable seeded L2 and L3 opening —
> **including every reachable dead-money position and the honestly-labelled stock franchise** — at
> least one legal action satisfies that lesson's stated obligation. Brute-forced over the whole
> reachable carry space, not spot-checked. (Memphis' $3.9M-of-room-against-$21.9M-of-dead-money is a
> real position and must be playable.)
>
> **P4 — attribution, per band.** At 5–6, the causal sentence at the next lesson's opening is
> **computed from the carried field**, not authored per scenario (Rule 14; and an authored sentence
> is exactly the class of defect §0 catalogues). At 7–8 it is silent — which means the information
> needed to diagnose it must be **present on the 7–8 surface**, or "silent" has become "hidden."

**One thing the L1→L2 chain must not repeat:** the discarded module silently deleted the franchise
of any team that was shocked and did not repair (M11). A carry that can destroy a pair's identity is
worse than no carry.

---

## 8. WHAT WOULD MAKE ME REJECT A CANDIDATE

Disqualifying properties. Any one of these present in an architecture candidate is a rejection at my
gate, independent of how good the rest is.

**Model truth**

1. A single scalar "team quality" / OVR / franchise value / fan trust that the model does not
   compute from stated inputs and that a student cannot attribute to their own decision. (Default
   posture: it does not exist.)
2. A constrained-allocation loop solvable by greedy sort on a printed value-to-price ratio — i.e. a
   single summable objective with a per-item scalar on the card. The candidate must name which of
   REASONING TEST (a)–(e) it satisfies.
3. A cap model with exactly **one kind of line**. If every threshold blocks, the candidate teaches
   FL2 by construction — and at 5–6 this specifically means: if both of the two carried lines block,
   reject.
4. Outcome as a deterministic function of decision quality — which makes FL3 unpreventable — or any
   score, award or reveal phrasing that rewards matching the historical move.
5. Any reachable state, **including every seeded L2/L3 opening and the stock franchise**, in which
   no legal action satisfies the lesson's stated obligation.
6. Any reachable state in which doing nothing is weakly better than every active strategy, or in
   which a TIME CUT fallback dominates that seat's best available action.
7. A monotone map from money spent to any displayed outcome (FL1), or a prize whose formula puts
   spend in the denominator (§0).
8. Asymmetric error costs — over-committing and under-committing punished at different orders of
   magnitude — without a written economic defence.
9. Ties, scarcity, or ordering resolved by HTTP arrival time, wall-clock, or `Math.random` inside a
   reducer.
10. A pre-commitment view that returns the value the committed action will produce (M2's R2), or a
    REVEAL in which no revealed quantity is underivable from what the seat could already see (R3).
11. Parallel solitaire: no reachable state in which another desk's decision changes what this desk
    can get.

**Rendered truth**

12. Any rendered NBA claim on the §8.2 list. Specifically: a **trade salary-matching percentage**;
    the second-apron pick-penalty count or horizon; **GSW / CLE / IND / MIA hard-cap status**, or
    those clubs used as student seats; **any specific luxury-tax dollar bill**, including Denver's
    ~$132M and the $24M-over → $62.5M example; any revenue-sharing percentage; a market-size tier
    label as official; a payroll figure without stating which definition it uses (the two differ by
    up to $52M on one team); "$1.50" as the tax entry rate; "tax + $7M / + $17.5M" as apron offsets;
    the $24,744,150 stretch ceiling as a published figure; a Stepien statement not labelled as
    secondary reporting; any Coon/cbafaq-derived cap fact; the Lakers sale as *completed*; any team
    logo, mark, arena image, or player photograph.
13. Any **load-bearing** percentage, ratio, negative number, or probability in the
    grade-5-inclusive band.
14. Narrative outrunning the model: "you gave up future options" with no future option constrained;
    "this uses most of your flexibility" with no computed flexibility; "safer" undefined and
    uncomputed. Every important rendered quantitative claim must trace to a researched source, an
    explicit model rule, computed state, or a **registered simplification**.
15. A concept in the ledger with no code-level instantiation pointer (M2's R10) — the ledger entry
    is deleted, not restated.
16. A synthesis line that cannot be computed from session state, or a class-evidence claim the
    aggregate does not produce (M2's R16).
17. A simplification of the economics not recorded with **what changed, why, and the misconception
    risk** (CLAUDE.md §3) — including, mandatorily, **which of the five thresholds the lesson
    dropped** (§7.12 #2, an explicitly unmade decision that must be logged in
    `PRODUCT_DECISIONS.md`), plus the roster-salary-vs-cap-hit definition choice (§7.12 #1) and any
    trade rule run as a module rule rather than the CBA's.
18. A drawing whose size carries a quantity the model does not hold, or one not measured against
    the model with a poisoned instrument (D25).

**Classroom and band truth**

19. A band exempted from any false-lesson guard in §4, or two bands whose reducers resolve the same
    actions differently.
20. A cross-band seed accepted silently.
21. An unscaffolded discovery front half in the 5–6 band.
22. Three or more decision-relevant variables presented simultaneously at 5–6.
23. More than two new economic terms in a 5–6 lesson, or any term named before the phenomenon was
    produced.
24. A decision-card menu of abstractions ("Invest in Roster / Shape Our Identity / Grow the Brand"),
    or a stand-pat radio group of pre-written justifications with no mechanical consequence.
25. Any progression register: XP, levels, badges, ranks, trophies, "champion", a single ranked
    class leaderboard on one universal franchise score, or a carried evaluation of how a previous
    lesson went (D4, and VISUAL_TARGET's three hard prohibitions).
26. Comparative money live on the projector while any decision is open.
27. Domain knowledge that raises **accuracy** rather than colour — any decision improved by
    following the NBA (CLAUDE.md §3; and §7.12 #7 records that the fandom-accessibility claim has
    never been tested against a non-fan reader, so a candidate asserting it must propose the test).
28. Any student-private datum reachable on `/board` or from another seat's `studentView`, before or
    after a reveal.

**Persistence truth**

29. Persistence without a (A, H1, H2) triple as in §7 P1, or a seed field with no reachable
    consequence (P2).
30. A carried field the module cannot honestly stand in for with a stock value.
31. A carry that can destroy or blank a pair's franchise identity (M11's failure).
32. A death spiral reachable through dead money carried from an earlier lesson.

**Not my gate, but I will cite them if unaddressed:** a design premise the runtime cannot deliver
(`initialState` runs once with `seatIds: []`; `join()` never calls the module; `closeRound` and
teacher hooks reduce with an empty roster — so "every pair runs a different real franchise" needs a
module-owned desk registry decided *before* content); a state size that blows the undeclared
clone-and-serialise budget with 15-player real rosters; and any ambition requiring an image MIME
type the server does not serve. These belong to the platform and gameplay reviewers, and they will
kill an otherwise-correct economic model just as dead.

---

## Dissent recorded in advance

I record dissent, now, against three moves I expect a candidate to be tempted into, so that choosing
them is deliberate rather than incidental:

1. **Carrying a luxury-tax dollar bill into a lesson before the bracket math is reproduced against
   the CBA.** The rates come from one source family, were never cross-checked, and the one published
   worked example is single-source (§7.4, §7.7). The tax is the most teachable object in the ladder
   and it is currently the least verifiable number in the dossier. Teach it as a *price* structurally
   — or as the module's own registered arithmetic, labelled — and not as an NBA figure.
2. **Building a trade-deadline lesson on salary matching.** §7.1 is the most dangerous disagreement
   in the corpus and §8.2 #1 forbids rendering any of the three answers. The apron's *tool
   confiscation* rules are uncontested across all three researchers and are better economics anyway
   — a trade lesson should be built on what you may no longer **do**, not on a percentage nobody can
   currently source.
3. **Any grade 5–6 design that carries two blocking lines.** It is the path of least resistance
   under Rule 6's "over-cap is a blocked action with a plain-language reason," it will pass every
   test anyone writes, and it teaches the module's own title concept backwards.

A decision to proceed against any of these does not erase the dissent.