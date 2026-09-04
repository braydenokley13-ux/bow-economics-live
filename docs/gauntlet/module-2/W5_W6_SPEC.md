# W5 — YOU DON'T PLAY ALONE · W6 — THE BOARD OF GOVERNORS: spec

<!-- Written from the experience-director's inline delivery, 2026-09-04. Design authority: D59 rulings 1, 2, 4, 5, 7. -->

> **Integrator rulings on the open questions (provisional, for the founder):**
> 1. **One active franchise, one vote.** No weighted voting. The director's dissent against weighted votes is adopted, not merely recorded.
> 2. **Institution 2 is THE FLOOR** (minimum spend), because it hurts the opposite coalition from THE SHARE.
> 3. **Two institutions, both bands**, for the first build. A 7-8-only third institution (lottery odds) is a recorded future option, not built.
> 4. **The Week 5 levy is set BELOW the plausible Week 6 outcome** ("$2 out of every $10" as the working value) so the room's own rule reads as an escalation; a tuning sweep sets the final number before ship.
> 5. **A collective rule is not softened.** A franchise the room's rule breaks keeps its desk and its named position (playability normalisation only, CLAUDE.md §9); the consequence is taught. Founder to confirm.
>
> **Contract note:** the runtime's Press Conference primitive owns the pause and the spotlight seat; each module contributes `spotlightView(state, seatId, phase)` and `pressCandidates(state, phase)`. `teacher:pressConference` in this text maps onto the runtime control, not a module hook.

## direction

**The spine, in one line:** Week 5 you live under a rule the league office wrote and can see it fill and drain; Week 6 you write two rules and live under them. That ordering is what makes Week 6's authority feel earned (D59 authority progression RUN THE TEAM → RUN THE BUSINESS → RUN THE LEAGUE).

**The single largest direction call: the Week 5 pool must not be voted on.** Bible §15 (bible.txt:5929-5966) frames the bowl as "how do we split this?" — an eleven-minute argument. Putting that argument in Week 5 spends Week 6's entire product. Week 5's levy is **assessed, printed, and imposed**: a fixed fraction of each franchise's local revenue, taken at the week bell, split equally, no dial, no ballot. The Week 5 feeling is *"who decided this?"* — unanswered. Week 6 answers it by handing them the pen. Everything else in Week 5 serves that setup.

### Week 5 — YOU DON'T PLAY ALONE

**Fantasy.** You are one of sixteen buildings. Your gate is made by two clubs — yours and whoever the schedule sent you (observed: the visitor term is the module's whole mechanism, `hostTheLeague.ts:9-20`). Now a bowl appears on the table and takes money off your books every week whether you like it or not.

**The pool ritual, beat by beat on `/board`** (counts and totals only; no private dial, no student name, club wordmarks only):

1. **THE BILL LINE** (pre-fill, 15s). One row per club, CLUB name and this week's assessed local revenue. Nothing else.
2. **FILL** (~45s). Chips drop club-by-club in schedule order — one chip per $50,000 assessed. Big markets drop six to eight; small markets drop one to two. Running total only. This is the visual Bible §15 asks for, and it is the whole reason the room stops talking.
3. **THE BOWL STANDS** (10s, teacher-paced). One number, large: what sixteen buildings put in. Teacher holds silence 7 seconds (Bible §17.4 item 7).
4. **DRAW** (~30s). The equal split flows back out. Every outflow bar is identical while every inflow bar was not. That contrast *is* the lesson; no copy needed.
5. **NET** (~60s, paged). PAID IN / TOOK OUT / NET per club. **At 5-6 this must never render a minus sign** (`gradeBand.ts:120` `allowsNegatives: false`): use direction words — "PAID IN $X · TOOK OUT $Y · **SENT AWAY** $Z" / "**BROUGHT IN** $Z". At 7-8 signed.
6. **THE FREE RIDE** (~40s). The two or three clubs that reinvested least, beside what they took out. Named only as an observation. **Do not name free-riding here** — it is Week 6's term.

Fallback: every stage is a teacher press (`teacher:poolStage`), never a timer (CLAUDE.md §11).

**Play loop, one student per franchise.** Unchanged mechanically — the runtime is already one seat = one desk (D59 ruling 1; `hostTheLeague.ts:557` `seatToSlot`). What changes: the deliberation that used to happen *between* two students on one device now has no partner, so the product must supply the beat. Add a **pool position capture** at lock (Bible §13.2 W5: "the split position and the reinvestment reason") — one chip + one short line, two inputs maximum: *"This week I'm putting back [chip: nothing / a little / a lot] because ______."* This is the Week 6 stakes card's raw material and the Press Conference selector's input.

**What each side rationally does, and why the reveal is honest for both.**
- *Big market* (new-york / golden-state profiles, capacity-bound at optimum — `writeTheRule.ts:89-93`): hold near house price, reinvest **low**. Under an equal-split levy it keeps only a fraction of each marginal local dollar it creates, so its optimal reinvest falls. It is a net payer, every week.
- *Small market* (oklahoma-city / memphis, unclamped): reinvest **high** — a dollar buys more Draw here (`hostTheLeague.ts:202`) — and take out more than it put in.
- **The honest reveal is not "sharing pays the payer."** D59 ruling 5 forbids retuning toward that. The honest two-sentence reveal, and both halves must be on the board: *"New York paid in more than it took out — every week. And New York's own gate was higher than it would have been in a league where its visitors could not afford to be worth watching."* Both true; neither cancels the other. The big-market student is permitted to remain aggrieved. That grievance is the Week 6 fuel.

**Band switches (`profileFor(band)`).** Neither W5 nor W6 currently reads `gradeBand` at all (observed: grep for `gradeBand|profileFor` returns hits only in `sameLine/carry.ts`, `sameLine/l1.ts`, `fullHouse.ts` — zero in `hostTheLeague.ts` / `writeTheRule.ts`). `hostTheLeague.initialState()` takes **no arguments** (`:3230`) so it can receive neither band nor seed today.
- `allowsPercentages: false` at 5-6 — the levy is stated as **"$2 out of every $10 this building takes in"**, never "20%". Internal state stays a percent.
- `scaffoldFirstRound: true` / `namesTheTradeoff: true` at 5-6 — week 1 is run *with* the room, and the product prints the trade-off ("spend on the team, or keep the cash"). At 7-8 neither.
- `maxBlockingWords` 40/70 on every ritual card.
- `showsCounterfactual: true` at 5-6 — the product runs "what if nobody had paid in"; at 7-8 the student constructs it.

**Seed OUT to Week 6.** Per franchise: `slot`, final `draw`, final `cash`, mean reinvest share **and** mean reinvest dollars, plus new: `paidInTotal`, `tookOutTotal`, `poolNet`, `marketBand`, `positionChips[]`. `writeTheRule.extractCarriedClubs` already validates draw/cash/`weeks[].share`/`weeks[].reinvestPaid` per club (`:725-772`) — extend that validator, keep its shape. **Vote weight derives from nothing: one active franchise, one vote.** What W5 seeds is the *stake*, not the *weight* — see open questions.

**Seed IN from Week 4 (stated assumption, INFERRED — Full House is not yet extended).** `{ lessonModuleId: "m2l1-full-house", sourceSessionId, sourcePhase, sourceEnded, state: { clubs: [{ slot, taxSalary, deadMoney, billCleared: boolean, cashAfter }] } }`. Validate per club, never per seed; a club the seed omits keeps its stock opening; a franchise that did not clear its bill opens W5 with a **named** cash penalty on a how-you-got-here card, never a silent one.

### Week 6 — THE BOARD OF GOVERNORS

**Institution 1 — THE SHARE.** Exists (`propose`, `writeTheRule.ts:3916-3931`). Real anchor: NBA revenue sharing moved roughly **$400M in 2024-25** to low-revenue clubs (Sportico 2025-10-21, MEDIUM; a dated figure, not a standing constant). Memphis made the least of any club in 2024-25 — $301M against Golden State's $833M (same source). The earlier "Memphis $28M in 2021-22" figure is not in its cited source and must not reach a surface (`W6_FLOOR_RESEARCH.md` §4). **The formula is confidential — no surface may print a percentage of the real rule** (§5, explicit). The classroom's dial is *ours* and must be labelled so.
- 7-8 decision space: share 0-60 in 5s, full grid (`SHARE_GRID`, `:343`). One variable → within `maxVariables: 3`.
- 5-6 decision space: a **four-card slate** — $0 / $2 / $4 / $6 out of every $10 of local money. One variable, no percentages, `maxVariables: 2` respected with room to spare.
- Fails → **5% / condition OFF** (`STATUS_QUO_SHARE`, `:289-290`). Honest because the status quo is not "nothing moves" — central money already moves; the room simply failed to change how much.

**Institution 2 — THE FLOOR.** Promote from nothing (today the condition rides the same ballot as a boolean rider — `:3928` — which is why D59 ruling 4 is unsatisfied). A **minimum spend**: a franchise that puts back less than the adopted floor forfeits half its draw from the pot, and the forfeited half is redistributed to those that complied. The engine already exists — `CONDITION_MIN_REINVEST = 15`, `CONDITION_COLLECT_FRACTION = 0.5` (`:293-294`) — it needs its own ballot, stakes, threshold and lived consequence, not new machinery. Real anchor: the NBA's **minimum team salary floor at 90% of the cap, tested on opening night; the shortfall is paid to the league and split equally among the other teams, and the club also forfeits its share of the luxury-tax pot** (2023 CBA Art. VII §2(c)(1)(ii), (2)(i), (2)(ii), (6) — verified HIGH in `W6_FLOOR_RESEARCH.md` §1; the earlier "to that team's own players" sentence was the 2017 rule). Second anchor available: **the NBA may distribute up to half of luxury-tax money to teams that stayed under, and a team that missed the floor gets none of it** (`W4_BILL_RESEARCH.md` §6, 7-8 row).
- 7-8: floor level (three options) + who receives the shortfall (two options) = 2 variables.
- 5-6: floor ON / OFF at one authored level = 1 variable.
- Fails → **NO FLOOR**, and this fallback must be *lived*, not skipped: the season then runs with at least one franchise spending zero and drawing full, and the board says nothing about it until ARGUE.

**Why these two and not two of the same.** Institution 1 rationally hurts **big** markets (D59 ruling 5, Bible §36.5). Institution 2 rationally hurts **small** markets — it forces the franchises that took from the pool to spend. That inversion is the design's load-bearing element: it is what breaks bloc voting without any anti-collusion rule, and it is what makes the hour a negotiation rather than a headcount.

**Vote mechanic, generalised.** Keep `runAdoption` (`:1207-1267`) and parameterise it by institution. Observed and important: the threshold is **already** `Math.ceil(liveDesks * 2 / 3)` (`:1220`) — a fraction of active franchises, never a fixed count. **Bible §16's "11 of 16" is therefore superseded by the shipped code, and no surface may print a fixed count.** Preserve exactly: abstention contributes no number to the median and gets **no denominator relief** (`:1189-1205`), the ±10 band for continuous dials, the sealed round (histogram withheld until round 1 closes, BC-6 fix 4), and the seal-on-close discipline (`:1209-1213`). Two adaptations: (a) on the 5-6 slate ballot the ±10 band degenerates — the test becomes *plurality card ≥ needed*; (b) `liveDesks` is recomputed **at each institution's own seal**, and `/teach` must state the denominator out loud before each vote, because a franchise that dies between votes silently moves the bar.
Rounds: **3** for the share (existing `ROUND_COUNT`), **2** for the floor — time, not principle.

**Order and path dependence inside the hour.** SHARE first, then FLOOR. Before the floor's rounds open, the board prints, at the share the room *actually adopted*: "a floor here costs Memphis $X and costs New York $0." A room that adopted 50% faces a floor fight with real money on it; a room that failed to 5% discovers the floor barely bites — and must be allowed to discover exactly that, without the product rescuing the drama. That is path dependence the students created in the same hour, which is stronger than any cross-week carry.

**Projector's public evidence.** Per institution: the sealed proposal histogram (post-round-1 only), the median, `inBand / needed / liveDesks` as three integers, the adopted card. Then PAID IN / TOOK OUT / NET per club per week under the two rules together. Then the counterfactual: the runner-up rule replayed (`runnerUp`, `:1224-1226`) — thirty seconds, the gotcha register Bible §16 names.

**Third Press Conference — candidates.** Ranked by interesting reasoning · contrast · risk · reversal · ambiguity; **never by who is winning** (bible_press.txt:32-38). Candidates: (1) a franchise that voted against its own stakes card; (2) a big market that voted for a high share; (3) a small market that voted for the floor that binds it; (4) a franchise that reversed between round 1 and round 3; (5) the abstainer. Board goes dark, one line LEAGUE PAUSED — PRESS CONFERENCE, all play surfaces lock, the franchise's decision and *what it knew at the time* come up. Teacher asks the first question to model tone. First-ever appearance is invited, never cold-called; one silent decline per course. 4 minutes.

**Front Office Review, extended (Bible §15, bible.txt:2454-2486).** On the wall, reconstructed from canonical state and not from memory: opening strategy · the W4 bill cleared or not · W5 pool net · the reinvest line across six weeks · the two votes and whether they matched the private stakes card · what was risked. Five questions: STRATEGY · ALTERNATIVE · RISK · ADAPTATION · DECISION QUALITY. Structure: private one-card defence → neighbour interrogation → console-selected hot seats → aggregate reveal. Argument moves per `argumentMoves`: **2 at 5-6** (opinion + a reason), **3 at 7-8** (claim + evidence + the strongest case against your own decision). 8 minutes inside ARGUE.

**Final naming stage.** `maxNewTerms`: **2 at 5-6** — EXTERNALITY (say "spillover" first; the module already lands this line at `hostTheLeague.ts:5333`) and INCENTIVE. **Up to 4 at 7-8** — add FREE RIDING and INSTITUTION. Each carries the five-link chain: experienced moment → this class's own number → real sports example (dated, sourced by pointer) → formal term → outside-sports generalisation. The naming screen must not advance until the teacher has typed the room's own words into it (Bible §17.4 item 6). `debriefMustConverge: true` at 5-6 — "both sides were right" is the failure mode; at 7-8 a defensible disagreement may stand if adjudicated by the room's numbers.

### Both weeks — implementation shape

**Phases.** W5 keeps `LOBBY HOOK PLAY REVEAL ADAPT ARGUE SYNTHESIS COMPLETE` (`:2558`) — the pool ritual is REVEAL's stage machine, no new phase. W6 keeps `LOBBY HOOK PLAY REVEAL CONSEQUENCE COUNTERFACTUAL ARGUE SYNTHESIS COMPLETE` (`:1710-1720`) — both institutions live inside PLAY's stage machine, the Press Conference is a lock overlay in CONSEQUENCE, the Front Office Review is ARGUE.

**State deltas (additive only).**
W5 `HostLeagueState`: `band`, `carried[]`, `seedNote`, `levy` (printed constant), `pool: PoolWeek[]`, `ritualStage`, `poolPosition` per Club. `initialState()` must begin accepting `{ seed, gradeBand }` — currently zero-arity.
W6 `WriteRuleState`: `band`, `institutions: Record<InstitutionId, AdoptedRule|null>` **added alongside** the existing `adopted` (keep `adopted` as the share so every shipped view and every snapshot still reads), `closedRounds[].institution` (defaulted for old snapshots, the `lockedAtBarRelease` pattern at `hostTheLeague.ts:3188` is the precedent), `stakesCard` per Club, `floorProposal` per Club, `pressConf`, `reviewStage`. `WriteRuleStage` (`:539`) gains `"floorRounds" | "floorAdopted"`.

**New actions, all phase-gated in `reduce` — the reducer is the only gate (`lessonModule.ts:12-23`).** W5: `poolPosition` (PLAY, requires `locked`), `teacher:poolStage` (REVEAL), `teacher:poolPage`. W6: `proposeFloor` (PLAY ∧ stage `floorRounds`), `teacher:institutionStep`, `teacher:pressConference` (CONSEQUENCE), `teacher:reviewStage` (ARGUE).

**View deltas.** `/play`: own stakes card, own ballot, own net, own review card — never another franchise's dial. `/board`: the ritual, tallies as `inBand / needed / liveDesks`, both adopted cards, the counterfactual — never a seat identity. `/teach`: director card per phase, `unresolved()` with per-desk fallback sentences, WATCH FOR bloc detection (clusters of identical proposals across rounds), ECONOMICS AT RISK against the protected ending.

**60-minute budgets, protected ending.**
W5: HOOK 6 · wk1 8 · wk2 8 · wk3 7 · POOL RITUAL 9 · ADAPT 5 · ARGUE 7 · SYNTHESIS 10 = 60. **Protected: last 17.**
W6: HOOK 5 · SHARE rounds+vote 12 · FLOOR rounds+vote 8 · season 10 · CONSEQUENCE 5 · Press Conference 4 · COUNTERFACTUAL 3 · ARGUE (Review + Sacramento) 8 · SYNTHESIS naming 5 = 60. **Protected: last 16.** Note: Bible §16 NN3 ("vote at minute 40, fifty minutes after") assumes 90 minutes and is superseded by D59 ruling 7 — **rebased, both votes closed by minute 25.**

**Teacher director card — the shape, one worked example (W5 REVEAL / pool ritual).**
NOW: "Bowl on the projector. Press FILL. Say nothing while it fills." · WATCH FOR: "The moment the big-market kids see chip six. That face is the lesson." · DON'T EXPLAIN YET: "Do not say externality, free-riding or fair. Not one of them, not yet." · ASK: "Ashland put in six. Rivera put in one. Both took out the same. Rivera — is that fair? *Wait 7 seconds.*" · TRIGGER: "When two students are arguing across the room, press THE FREE RIDE."

**Dominant-strategy hunt.**
W5: (1) *reinvest zero, collect anyway* — must remain playable and visible, never blocked; it is Week 6's evidence. Non-dominance rests on `DRAW_DECAY = 4`/week plus the own-Draw home term (`:318`, `:136`) still costing your own gate — **NOT VERIFIED numerically; needs a tuning-harness sweep before ship.** (2) *price at the ceiling* — self-defeating against the capacity clamp; already handled. (3) *bilateral deals with the franchise you host* — real internalisation of the externality; surface it as a CONTRAST card, do not police it.
W6: (1) *vote for whatever helps me* — the intended play, not a defect; the supermajority is the counter, because it forces the two sides to buy each other rather than outvote each other (`:1180-1188`). (2) *bloc voting between friends* — a durable 2/3 bloc that ignores stakes is the real threat; countered by the sealed round, the ±10 band (a bloc must converge on a *number*), and above all by institution 2 inverting who gets hurt. **Add no anti-collusion rule.** (3) *abstain to lower the bar* — already closed (`:1197-1205`); print it on the desk, the board and the WATCH FOR panel.

**"Pair" → one student.** Observed counts: `hostTheLeague.ts` 72, `writeTheRule.ts` 39, `src/client/**` 144. **Never a blind rename** (D59): `Pairing`, `pairing`, `visitorSlotFor`'s schedule vocabulary (`hostTheLeague.ts:474-487`) are the *schedule* and must not be touched. Must change: every `reduce` refusal string — "only a seated pair can take a club" (`hostTheLeague.ts:3356`, `writeTheRule.ts:3894`), "…can work a club" (`:3366`/`:3935`), "…proposes a rule" (`:3917`), "…calls the gate" (`:3414`), "…predicts" (`:3959`), "…votes" (`:3970`) — plus the rejoin-PIN copy (`writeTheRule.ts:3062`), `UnresolvedSeat.selfFallback` examples, and the `lessonModule.ts:161` doc comment. Desk caps: `MAX_DESKS = 18` (`hostTheLeague.ts:299`) seats 16 franchises with two bot clubs left over — **fits**. W6's own league sizing was **not verified this session**.

**Test list (one-liners, 22).**
1. W5 `initialState` with no seed opens a stock league and says so. 2. A W4 seed with the wrong `lessonModuleId` is ignored entirely. 3. A W4 seed missing a club leaves that club stock. 4. A negative carried cash never opens a franchise unable to operate. 5. `poolPosition` is refused before `lock`. 6. `poolPosition` is refused outside PLAY. 7. Pool contributions sum exactly to the bowl total, every week, zero residual. 8. Equal split × live franchises = bowl total ± rounding, and the rounding is stated. 9. `boardView` at every ritual stage contains no seat id and no private dial. 10. At band 5-6 no rendered pool string contains `%`. 11. At band 5-6 no rendered net is negative. 12. `teacher:poolStage` is refused from a non-teacher seat. 13. W5 seed OUT contains paidIn/tookOut/net for every seated franchise. 14. W6 `needed` equals `ceil(live·2/3)` for live = 6,11,12,16,18. 15. An abstention lowers neither `needed` nor `liveDesks`. 16. A franchise that dies between institution 1 and 2 changes institution 2's denominator, and `teacherView` says so. 17. `proposeFloor` is refused during `rounds` and after `floorAdopted`. 18. Institution 1 failing sets 5% / OFF and institution 2 still runs. 19. Institution 2 failing sets NO FLOOR and the season still settles three weeks. 20. The floor's printed cost line is computed against the *adopted* share, not the median. 21. At 5-6 the ballot exposes at most 2 variables; at 7-8 at most 3. 22. `synthesisCards` names ≤2 new terms at 5-6 and ≤4 at 7-8.

---

## experience-risks

Ranked, highest severity first.

1. **BLOCKING-severity, band: 5-6 cannot be shown a percentage, and both lessons are built on percentage dials.** Observed: `gradeBand.ts:112` `allowsPercentages: false` at 5-6 and `:120` `allowsNegatives: false`; observed: neither module imports `gradeBand` at all. The share (0-60%), the reinvest dial (0-40%), the ±10 band, and every NET figure are percentage-or-signed constructs. Without the "$X out of every $10" translation and the direction-word NET, the 5-6 build of Weeks 5 and 6 violates the band's own hard gate on day one. This is the largest gap between D59 ruling 2 (all six weeks, both bands) and the repo.
2. **Week 5 eating Week 6.** If the pool is negotiated in Week 5, Week 6's headline decision is a re-run and the finale collapses. Mitigation is the assessed-levy direction above; the risk returns the moment anyone adds a Week 5 "vote on the split" to make the ritual livelier.
3. **The second institution being cosmetic.** D59 ruling 4 names the failure precisely ("one slider, one poll, or two cosmetic controls"). The floor is only a real second institution if it (a) has its own stakes card, (b) has its own threshold and rounds, (c) has a lived consequence in the season, and (d) hurts the *opposite* coalition. Drop any one and the hour is one decision with a rider — which is exactly what ships today (`writeTheRule.ts:3928`).
4. **Bloc voting turning social rather than economic.** Bible §15 names it: "a majority ganging up on the two big-market kids" (bible.txt:5960-5961). Two consequences — the argument becomes about people, and the economics evaporates. The structural answer is the inverted second institution, not a rule and not a facilitation note. Residual risk is real and lands on the teacher; the director card must carry it explicitly.
5. **Time. Both weeks are over-budgeted against 60 minutes.** W6 as specified stacks two negotiated votes, a three-week season, a counterfactual, a Press Conference, an extended Front Office Review and a four-term naming stage. `/teach` already warns that Advance ▸ skips about half the period (`writeTheRule.ts:2784`). Without a pre-declared compressed path — and D59 ruling 7 says a compressed path must still keep a choice, a consequence, an argument, the economics and a transfer — the naming stage is what gets eaten, which is the one thing the product exists to protect.

Secondary, named not ranked: the W4→W5 seed shape is **inferred, not verified** (Full House emits no carry today — `fullHouse.ts:2909` per D59); `writeTheRule.extractCarriedClubs` reads `lessonModuleId` but **not** `sourceSessionId`/`sourcePhase`/`sourceEnded` (`:728`), so a mid-session or foreign-band source is accepted silently — and D59 ruling 2 makes a 5-6 room seeding a 7-8 room a live classroom possibility; the NBA salary-floor anchor for institution 2 was verified by Sports Reality and the original sentence FAILED (it stated the 2017 rule) — corrected above per `W6_FLOOR_RESEARCH.md` §1; the "$400M / formula confidential" constraint (`W4_BILL_RESEARCH.md` §5) is a standing trap for any copywriter who wants to print a real sharing rate.

## non-negotiables

1. **The Week 5 pool is imposed, not voted.** No ballot, no dial, no "how should we split it?" before Week 6.
2. **No surface prints a percentage of the real NBA revenue-sharing formula** (`W4_BILL_RESEARCH.md` §5). The classroom dial is labelled as modeled, every time.
3. **The threshold is a fraction of active franchises, computed at each institution's own seal** — `ceil(live·2/3)`, already shipped at `writeTheRule.ts:1220`. **No surface prints a fixed count.** Bible §16's "11 of 16" is superseded.
4. **A rule that rationally hurts some franchises is taught, never tuned away** (D59 ruling 5, Bible §36.5). No constant is retuned to manufacture unanimity, and no copy claims sharing pays the payer.
5. **Free-riding is playable in Week 5 and unnamed until Week 6.** Do not block it, do not scold it, do not label it early (experience first, name second — D59 ruling 6).
6. **Private, dollar-denominated stakes cards before debate opens** in Week 6 (Bible §16 NN1), and the stakes derive from the student's own franchise history — never assigned as debate roles.
7. **One active franchise, one vote.** No weighted voting, no XP, no leaderboard, no standings (D4, D59 ruling 1).
8. **Both votes closed by minute 25 of 60; the last ~16 minutes are protected** and the console says ECONOMICS AT RISK against them (Bible §17.1.2, D59 ruling 7).
9. **Every synchronised reveal ships a manual teacher press.** The pool ritual has six stages and six presses, no timer (CLAUDE.md §11).
10. **Additive state only.** `adopted` survives beside `institutions`; new fields tolerate absence on old snapshots, the `lockedAtBarRelease()` pattern.
11. **Press Conference protections are structural:** attack the decision never the person, teacher asks first, first-ever appearance invited, one silent decline per course, fictional names on shared screens (bible_press.txt:40-43).
12. **`/board` is never handed a seat identity**; `/play` never shows another franchise's dial (CLAUDE.md §11).

## open-questions

1. **Vote weight.** Your brief asks what "vote weight" derives from. My direction says it derives from nothing — one active franchise, one vote — and that Week 5 seeds the *stake*, not the weight, because weighted voting is a standings mechanic in disguise (D4) and would let two big markets buy the room. **I record formal dissent against any weighted-vote design.** Confirm or overrule.
2. **Institution 2: floor, or luxury-tax split?** I direct the floor because it inverts the coalition. The tax split is better-sourced in-repo ("half of it goes to the teams that stayed under", `W4_BILL_RESEARCH.md` §6) but taxes spending, not revenue, and may not read as a second *institution* to a fifth-grader. Founder call.
3. **A third institution at 7-8 only?** The draft lottery / anti-tanking odds flattening is the strongest candidate and is dated and real, but it leaves M2's revenue world entirely and costs ~6 minutes the hour does not have. Ship two institutions both bands, or two at 5-6 and three at 7-8?
4. **Week 5's levy rate.** It must be large enough that the bowl visibly matters and small enough that it does not pre-empt Week 6's dial range (0-60). I have not modelled it. Should the levy be set *below* the plausible Week 6 outcome so the room's own rule feels like an escalation, or *at* the middle so the room can go either way?
5. **What happens when Week 6 adopts a rule that bankrupts a franchise in the season that follows?** "Bad decisions matter but stay generally recoverable" (CLAUDE.md §1) meets "a rule may rationally hurt some franchises" (D59 ruling 5). I believe the collective rule is the one case where the floor should *not* be softened — but that is a founder product decision, not mine.

**Independence note:** this is advisory direction issued before build. I must not be the critic of what gets built from it.

## synthesis chains (R-10, drafted 2026-09-04 by the Economic Truth critic; REVIEWED 2026-09-04 — see W5_W6_ECON_TRUTH_REVIEW.md; D62)

Class numbers below come from the flat-dollar floor (D61); the $300,000/week working value used to
draft them is **withdrawn pending the feasibility sweep** (D62), and every class number computed
from it is provisional until the sweep sets a real level. All 5–6 links are dollars-only. No chain
prints a rate of the real revenue-sharing formula. Week 5 names no free-riding. Figures corrected
against `W6_FLOOR_RESEARCH.md`: the Memphis "$28M in 2021-22" figure is withdrawn everywhere; the
$400M is a 2024-25 figure.

### Week 5

**SHARED RESOURCE — "the bowl" (both bands).** Moment: you set your price, your building filled,
and before you could spend a dollar a bowl took a slice off the top; then money came back that
other buildings had made. Class number: THE BOWL STANDS, then your own NET row (PAID IN · TOOK OUT
· SENT AWAY / BROUGHT IN) — every bar out the same height, not one bar in. Real: the NBA moved
roughly $400,000,000 to its lower-revenue clubs in 2024-25; every club pays in off its own local
money, but the real league does not split it evenly — how much each club gets back is worked out by
a formula the league keeps confidential, and ours splits evenly so the shape is visible (Sportico
2025-10-21, `W4_BILL_RESEARCH.md` §5). Term: shared resource — money a group puts into one pot and
splits by a rule. Outside: the class trip fund; the argument is never really about the bus.
**Simplification (recorded):** the real formula is confidential and not split evenly; ours splits
evenly so the mechanism's shape is visible to the room. Misconception risk: "the real shared pot is
split equally."

**SPILLOVER — pre-name for externality (5–6 only; at 7–8 it folds into EXTERNALITY as the
plain-word gloss, R-13).** Moment: on your home night the crowd was
bigger than your own club could have filled because of who was visiting; on your road night you did
that for somebody else's building, and none of that money reached you. Class number: THE VISITOR
LINE beside THE ROAD LINE (what your own Draw put on somebody else's books on your away night), both
teacher-pressed, no seat identity. Real: New York's gate was about $193,000,000 in 2024-25,
the league's largest, roughly $4,000,000 a night; who stands on the other bench moves that number,
and New York keeps it (Sportico 2025-10-21, `W4_BILL_RESEARCH.md` §4; includes playoff dates).
Term: spillover — something you did that landed on somebody else's books without anybody paying.
Outside: you practise the trumpet; the neighbours hear it, nobody pays anybody. (Model check, not a
class number: room-total visitor dollars in week 1 ≈ $5,766,776 against a $4,965,572 bowl at a 20%
levy — the spillover is bigger than the whole bowl; if the ritual cannot show that it is under-built.)

**EXTERNALITY (7–8 only; moves a term across a week boundary — founder call, R-13).** Moment: a
dollar you put back arrived partly in a building you do not own, on a night you were the away team,
and neither side could charge the other. Class number: THE VISITOR LINE beside your own REINVEST
line, and the room's total visitor dollars against THE BOWL STANDS. Real: when LeBron James left
Cleveland in 2010 and returned in 2014, the buildings whose numbers moved were not only Cleveland's
— attendance moved in every arena on his schedule, and not one of those buildings paid him or the
Cavaliers for it. Owed: a dated, sourced road-attendance-lift figure. Term: externality — the
plain-word gloss is spillover — a cost or benefit that lands on someone who was not part of the
decision and is not paid for it. Outside: a neighbour repaints and lifts every
house price on the street; nobody sends a cheque.

**INCENTIVE (7–8 only).** Moment: the bowl took a slice of every local dollar, so the next dollar
you chased was worth less than last week; several desks moved their reinvest dial down without being
told. Class number: your REINVEST line week by week beside THE COUNTERFACTUAL — the same three
weeks computed with no levy — exposed as a teacher press at 7–8 (R-14, an exception to
`showsCounterfactual=false` at 7–8); THE FREE RIDE stage. Real: Golden State privately financed Chase Center (about $1,400,000,000, opened 2019), owns
it, keeps what happens inside, and reported $833,000,000 of revenue in 2024-25 (Sportico 2025-10-21;
`hostTheLeague.ts` CLUBS). Term: incentive — what the rules make worth doing. Outside: the same
worker paid by the hour and then per delivery.

**Week 5 convergence line (5–6):** "Your gate was never yours alone — and that is exactly why
somebody wrote a rule about it."

### Week 6

**EXTERNALITY (retrieval, both bands).** Moment: last week your gate moved because of who
visited you, and what you did to their building was never charged to anybody; this week you wrote a
rule that sits on top of exactly that. Class number: the STAKES CARD beside the room's PAID IN /
TOOK OUT / NET per club under both adopted rules. Real: the $400,000,000 moved in 2024-25 (dated);
Memphis made the least of any club that season, $301M, against Golden State's $833M (Sportico
2025-10-21). Term: externality, met last week as spillover; a rule now sits on top of it and you
wrote it. Outside: a neighbour repaints and lifts every house price on the street; nobody sends a
cheque.

**INCENTIVE (both bands; the one new 5–6 term).** KILLED AS WRITTEN (D62) — re-derived after the
floor feasibility sweep; the $300,000 working value is withdrawn.

**FREE RIDING (7–8 only; defined on REINVEST, never on paid-in).** Moment: one desk put nothing
back, its Draw slipped, it still filled on strong-visitor nights carried by Draw others paid for,
and it collected from the bowl like everybody else. Class number: that desk's VISITOR LINE beside
its REINVEST at zero and its TOOK OUT bar, and the FORFEITED / REDISTRIBUTED line once the floor is
on (`writeTheRule.ts` `forfeited`/`bonus`). Real: every club's home gate rises when a big draw is
the visitor, and the visiting club is paid nothing for it — a club that lets its own roster slide
still sells tickets on the nights the league's stars come to town. Term: free riding — taking the
benefit of what others paid to create while paying nothing toward it. GUARD, spoken every time:
"Putting in fewer dollars because you made fewer dollars is not free riding. Free riding is putting
nothing back while the thing you are living off is still there." Outside: the group project with one
name on the cover and one person who made the slides.

**INSTITUTION (7–8 only).** Moment: you wrote a rule; two-thirds of the live desks had to land on
the same number, so the sides had to buy each other rather than out-shout each other; then you lived
three weeks inside it, including the desks that voted no. Class number: the sealed histogram, the
median, INBAND / NEEDED / LIVEDESKS as three live integers, and the runner-up rule replayed. Real:
on 15 May 2013 the NBA's owners voted 22–8 — under the league's own threshold, not ours — to deny
the sale that would have moved Sacramento to Seattle; Golden 1 Center opened in 2016 (`writeTheRule.ts`
CLUBS, Sacramento `identityLine`).
Term: institution — a rule people wrote that binds them afterwards, including those who argued
against it. Outside: a class that votes on its own phone rule and lives with it on the inconvenient day.

**Week 6 convergence line (5–6):** "We wrote a rule that helped somebody and cost somebody, we knew
which was which before we voted, and we had to live inside it anyway."
