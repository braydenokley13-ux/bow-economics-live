<!-- Written from the experience-director's inline delivery, 2026-09-04. Design authority: D59. -->

> **Integrator rulings on §14 (provisional, for the founder to confirm or overturn):**
> 1. The typed reasoning line is **teacher-only**; it never reaches `/board`.
> 2. **Stretch is dropped from Week 2.** A waive leaves this season's cap hit and tax salary unchanged (the sunk-cost lesson needs nothing more); the waived contract carries to Weeks 3–4 as dead money in `taxSalary`. Recorded as a simplification with the misconception risk "students may think a waived player is free next year" — Week 4's bill names the dead money.
> 3. Job reports are **authored per player**, deterministic across rooms.
> 4. A dealt-July desk **may** take the podium for its own February, never for July.
> 5. The 90-second Front Office Review **lives in Week 3's boardroom** for the first build; Week 2's ARGUE keeps the optional second podium.
>
> **Post-research rulings (2026-09-04, from `W2_SEASON_RESEARCH.md`; binding over §1/§2/§5/§9 where they conflict):**
> 6. A job-report verdict is a pure function of the authored player card — never of what the desk paid or for how many years. "At what price" is struck from §2's Shock A sentence; the research's dissent is adopted.
> 7. DECISION QUALITY vs OUTCOME (§9) and the NEAR MISS tape pair (§5) run on **price twins** — same job, same price within $100k, different card, opposite verdict (Vucevic $3,900,000 MORE beside Nance $4,000,000 NOT; secondary Robinson beside Grimes, printed "about" because Grimes' figure is an average) — not on a repeated player, which authored resolution makes impossible.
> 8. §1's three-verdict promise is withdrawn: a desk gets one verdict per signing it made ("every player you signed got a report").
> 9. The apron/wall test runs on **Apron Team Salary = committed − holds**, evaluated after the transaction. (The same correction is owed to Week 1's `bandOf(committed)` — recorded as an L1 bounded repair, not made in this wave.)
> 10. January ten-days and February rest-of-season signings are **prorated** on the research's dated constants, never charged as full-season minimums; March 1 is the February window's real deadline (post-March-1 waivers are playoff-ineligible elsewhere).
> 11. February cards read "was cut in February 2026", never "is available"; Chris Paul is excluded (retired); Ben Simmons is dated February 2025 and is the Shock B card.
>
> **Contract note:** the runtime's Press Conference primitive (in build) owns the pause and the spotlight seat; a module contributes `spotlightView(state, seatId, phase)` (public podium payload) and `pressCandidates(state, phase)` (ranked, teacher-only). This spec's `podiumFrame`/`podiumCandidates` map onto those two names; the privacy rules in §6 bind the implementation and its tests.

# W2 — THE SEASON (`m1l2-the-season`)

Act 2 of THE SAME LINE. Authority: D59 (rulings 1, 3, 6, 7, 8), CLAUDE.md §1/§3/§8/§11/§12, `ARC_DESIGN.md` §2–§3, Bible §12–§13 (FOUNDER LOCKED). Not built. Nothing here is verified against a browser.

## 1. The fantasy, and the sentence

You signed those contracts in July. It is now the season, and the season has an opinion. The names on your books are the same names; the money is the same money; what they are worth is not what you paid. One of your signings is doing more than the job you signed him to do, one is doing it, and one is not — and the job he is not doing is still open, with the tool that could have filled it already spent. You are not reading news. You are re-solving July's allocation problem with July's leftovers, in a market that is now January and then February, under a wall you drew yourself and had forgotten about. **The student's sentence at the end of the hour: "The contract was locked and the value moved, and what I could do about it was decided in July."**

## 2. The changed conditions

**SHOCK A — THE JOB REPORT.** Every Act-1 signing resolves against *the job it was signed to do*: DOES THE JOB · DOES MORE THAN THE JOB · DOES NOT DO THE JOB. Three states, no scalar, no OVR (`ARC_DESIGN` §3). **DEALT in arrival, BY-CHOICE in content** — every desk gets a report; what it says depends entirely on whom they signed, at what price, for how many years. Resolution is **authored per named player**, not diced: each `BOARD` entry already carries a real, dated `risk`, `strength`, `ageAtSigning` and `production`, and the verdict is written from that documented fact (a 35-year-old on a one-year minimum, an undrafted forward on a one-year deal). Only two or three genuinely ambiguous cards branch, and those branch off `hash(sessionId, playerId)` so a re-run of the class reproduces it exactly. Teaches: **price is not value**, and **outcome is not decision quality**.

**SHOCK B — THE FEBRUARY MARKET.** A real in-season market opens: players waived during the season. It is better than the January minimum market and it is contested. But **a club above the first apron may not sign a waived player whose pre-waiver salary exceeded the NTMLE** (`NBA_FINANCIAL_TRUTH` §2.3; §7.2 records that one researcher places this at the second apron — we take the first-apron reading and print the conflict in `SOURCE_LEDGER`). **DEALT** — the same market, the same rule, for all sixteen desks. Its *bite* is entirely path-dependent: the desks that spent hardest in July are the desks the February market refuses. Teaches: **institutions confiscate options, not dollars**; **path dependence**.

**SHOCK C — THE TAX CLOCK.** The luxury-tax bill is computed on **end-of-regular-season** salary, not July salary (§2.2). Every dollar added in February is a dollar the bill sees. **DEALT** as a rule, BY-CHOICE in weight: a desk under the tax pays a dollar for a dollar; a desk over it does not. Teaches: **the marginal dollar has a different price for different buyers**; seeds Week 4's bill.

**Why no shock makes a bad July unrecoverable.** The minimum market is open to every club at every position past every line, forever (`MINIMUM_MARKET`, team-cost cap $2,449,421 with the league reimbursing the difference). Bird rights survive both aprons. Every reachable carried position therefore has at least one legal move that closes at least one open job — asserted as a sweep test (§13), not as a hope. Bad July costs you *which* fix you get, never *whether*.

## 3. The play loop (~23 min of play)

**ROUND 1 — JANUARY 5: THE TEN-DAY WINDOW** (PLAY, 11 min). Real rule (§2.10): 10-day contracts open January 5, minimum salary, roster-size limited, twice per player per team. **Uncontested** — the depth is generic, like `MINIMUM_MARKET`. The desk decides, per open job: cover it cheaply now, or hold the roster slot for February. This is a cheap purchase of information before commitment.

**ROUND 2 — FEBRUARY: THE BUYOUT WINDOW** (ADAPT, 12 min). **Contested and sealed**, resolved at window close by the Week-1 resolution idiom (`resolveDay`, in-model tie-break, no arrival-time race). The desk decides: which named waived player, with which surviving tool (`toolsSpent` from the carry says what is gone), at what price; *or* waive a July contract to open the slot; *or* pass. A wall drawn in July clips the reach; the first apron closes the top of the market outright.

**Attribution.** Every refusal names the desk's own act and its date: "Your wall was drawn on signing day 2 when you used THE BIG EXCEPTION on [name]. It sits at $209,015,000. This signing would put you $1.2M past it." Every job report names the contract *you* signed and the job *you* signed it to fill.

**What the board shows mid-play** — counts and settled facts only, never a seat's position: open jobs by role across the room (the room's own demand evidence); how many desks have a commit in; walls drawn in July, as a count; the settled ticker of who signed whom, by desk label, once a window closes. No payroll, no rank, no leader.

## 4. Commitment Capture, manifested

Two inputs, on every consequential commit — a `sign`, a `waive`, or a `pass` on an open job. Never on a browse.

**Input 1 — the chip (one tap).** 5-6 set: `He can't do the job` · `I need the roster spot` · `I need the money` · `Someone better is coming`. 7-8 set adds intent *and* confidence in one tap: `This closes the job and I'm sure` · `This closes the job and it's a gamble` · `This is the least bad move` · `I'm holding for February`.

**Input 2 — the line.** 5-6 prompt, 8 words: **"What do you lose by doing this?"** (≤ 12-word answer; under the 40-word blocking budget). 7-8 prompt: **"What are you giving up — and what would have to be true for this to be the wrong call?"** (≤ 25-word answer; 20 words of prompt, under 70).

## 5. THE TAPE — the frozen record

One `TapeEntry` per consequential commit, written by the reducer at the commit and never rewritten:

```
id, seatId, deskLabel, round: "JANUARY"|"FEBRUARY", at
kind: "sign"|"waive"|"pass"
known:   { committed, taxSalary, band, wall, openJobs, slots,
           toolsLeft, report: [{playerId,name,verdict}], askByRole }
options: [{ playerId, name, role, tool, price }]   // legal, affordable, on the board, that instant
chose:   { playerId?, name?, tool?, annual?, years?, waived?, stretchElected? } | { passed: true }
forgone: { names: string[], chip, line }
result:  { verdict?, costThisSeason, costLaterSeasons } | null   // filled once, later
```

**STATE vs EVIDENCE (`ARC_DESIGN` §2):** only `chose` is STATE, and it is already applied to `Position` — the tape is a *copy*. `known`, `options`, `forgone` are frozen EVIDENCE. `result` is derived from state, never from the tape. **Hard rule: the reducer writes the tape and never reads it to decide anything** (§13 test).

**Replay types this week produces** (Bible §12.3): NEAR MISS (same `chose.playerId`, different `result.verdict`); STRATEGY DIVERGENCE (twin desks, same opening books, different `chose` — the twin's whole payoff); COUNTERFACTUAL (`options`, already the foothold); THE ONE THAT WORKED ANYWAY (`options` contained a strictly cheaper cover for the same job, verdict came out fine — never framed as weak reasoning); THE RIGHT CALL THAT DIDN'T WORK (paid at or below `askByRole`, long `forgone`, verdict NOT THE JOB). PREDICTION REPLAY exists only in folded form at 7-8, through the confidence-bearing chip. **The Tape is not undo.** It never re-renders the past with knowledge the desk did not have.

## 6. Press Conference

**Ranking inputs, all from held state.** *Interesting reasoning*: the typed line is ≥ 3 words and references a name or role not in `chose`. *Contrast*: count of other desks in the same `known.band` with the same open role that chose a different `kind`. *Risk*: `annual` above `askByRole`; a waive; a commit that crossed a line; a commit landing within one minimum charge of a wall. *Reversal*: waived a contract this room signed in Week 1, or passed in January then paid above ask in February. *Ambiguity*: `result` disagrees with the price signal in either direction. Score = weighted sum. **Never inputs:** payroll, jobs closed, verdict counts, any notion of best or correct. Structural exclusions: a desk in `podium.declined`; a stock (dealt-July) desk, for its July only; a desk already at the podium, deprioritised. First appearance carries `invite: true`.

**Public podium view contains:** the fictional desk label, the club and its situation line, one decision (round, choice, price, tool), the frozen `options` at that instant (≤ 4, names and prices), the desk's own `forgone.names`, and the position as words (band, open jobs, wall). **Must never contain:** any student identity; the chip or the typed line; any other desk's private position; any score, rank or comparison; the `result` before the teacher has revealed it.

**Teacher opening templates (deadpan; the instructor asks first, always):** "You had [tool] and you spent [amount] on [name]. Why him?" · "You had an open [role] and you passed. Talk me through it." · "You signed him in July. In February you cut him. What changed?" · "[Other desk] had your exact books and did the opposite. Make your case." · "You paid over the asking price. What were you afraid of?"

**Contract extension — two optional methods, nothing more.** The runtime already owns a server-honest pause (`sessionService.assertActionable` refuses every student write with 423 while paused; teacher hooks bypass it). So:

```ts
podiumCandidates?(state: TState, phase: CanonicalPhase): readonly PodiumCandidate[];
podiumFrame?(state: TState, phase: CanonicalPhase): PodiumFrame | null;
```

`/teach` reads candidates; the teacher presses the existing PAUSE and the module hook `teacher:callToPodium {seatId}`. `/board` renders `podiumFrame` in place of `boardView` when it is non-null. **`podiumFrame` takes no seat id** — the module picks from its own state, so the board's structural guarantee is untouched.

## 7. Phases, state, actions, views, seed

**Phases:** `LOBBY, HOOK, PLAY, REVEAL, CONSEQUENCE, ADAPT, COUNTERFACTUAL, ARGUE, SYNTHESIS, COMPLETE` (ordered subsequence ✓). Press Conference #1 lands in CONSEQUENCE, mid-play; #2 optional in ARGUE.

**State (TypeScript-ish):**
```ts
{ sessionId, gradeBand, round: "JANUARY"|"FEBRUARY"|null, windowClosed,
  desks: Record<SeatId, { seatId, clubId, twin, label, dealt: boolean,
    position: Position & { deadMoney, taxSalary, stretchSchedule: {season,amount}[] },
    report: {playerId,name,role,verdict,why}[], carriedForgone: ForgoneRecord[] }>,
  unclaimed: CarriedFranchise[], pending: Record<SeatId, Commit>,
  taken: string[], history: WindowRecord[], tape: TapeEntry[],
  podium: { seatId, entryId } | null, declined: SeatId[],
  beat: number, observers: SeatId[], carryWarnings: string[] }
```

**Actions (phase gate in the reducer, always):** `claimDesk` (LOBBY/HOOK/PLAY) · `teacher:beat` (HOOK, SYNTHESIS) · `sign` (PLAY, ADAPT) · `pass` (PLAY, ADAPT) · `waive` (ADAPT only) · `electStretch` (ADAPT only, attached to a waive) · `teacher:closeWindow` (PLAY, ADAPT — the `RoundContract.closeHook`; `noun: "window"`; `currentKey` returns `"january"`/`"february"`/null) · `teacher:callToPodium` / `teacher:closePodium` (CONSEQUENCE, ARGUE) · `declinePodium` (any phase, silent, idempotent) · `teacher:tapeNext` (COUNTERFACTUAL) · `teacher:namingNext` (SYNTHESIS).

**View payloads.** `studentView`: `{ hq (act index 1, ACT_RAIL label "THE SEASON"), report, board, pockets, wall, roleAsk, commitCapture:{chips,prompt}, pending, yourForgone, tape: own entries only, naming }`. `teacherView`: `{ perDesk:[{label,band,openJobs,wall,committed,pending,chip,line}], podiumCandidates, unresolved, director }`. `boardView`: `{ openJobsByRole, commitsIn, deskCount, wallsDrawn, ticker, podiumFrame|null, naming }` — never a seat id, never a payroll.

**Seed IN.** `extractWindowCarry(seed, band)`. `ok:false` → every seat gets a **stock franchise**: a real club's opening books plus an authored, dated July made by the real club, labelled **"This July was dealt to you, not played by you"** on the desk's own screen and on `/teach`. A dealt desk is never asked to defend a decision it did not make (podium exclusion). Per-desk drop → that desk gets a stock franchise and its own screen says so. Refusal reason is printed verbatim on `/teach`, never on `/board`. `ok:true` → a returning `sourceSeatId` re-attaches automatically; otherwise the student picks their desk from the carried list. Unclaimed franchises stay unclaimed and never auto-play. Twins are labelled on every surface; **there is no inter-desk transaction in Week 2 at all**, so twin isolation is structural. Competing for the same February player is a shared market, not a transaction.

**Seed OUT** (`extractSeasonCarry`, `SEASON_CARRY_VERSION = 1`). STATE: clubId, twin, label, committed, taxSalary, deadMoney, `stretchSchedule`, band, wall, `toolsSpent`, openJobs after February, contracts with `verdict` and `coveredThrough`, own picks. EVIDENCE: the full tape, W1 + W2 forgone, the job report, which desks took the podium (never their lines). **Week 3's trade objects, under D59 ruling 1: only contracts this room signed — including Week 2's — and each franchise's own draft picks at $0, labelled by franchise. No incumbent NBA player is ever a trade object. A waived contract is dead money, not an asset, and is not tradable.**

## 8. Band switches on `profileFor(band)`

`maxVariables` — 5-6 chooses WHO and WHETHER; 7-8 also chooses HOW MUCH and WHICH TOOL. `scaffoldFirstRound` — 5-6 runs one ten-day signing with the class before the window opens; 7-8 meets January cold. `namesTheTradeoff` — 5-6 sees "this closes your BIG and uses your last slot"; 7-8 does not. `showsCounterfactual` — 5-6's Tape renders `options`; 7-8 must name what else was on the table before it is shown. `allowsPercentages`/`allowsNegatives` — 5-6 sees the tax as a total in dollars, computed by the product, and stretch as named per-year dollars; 7-8 sees the bracket table and the spread arithmetic. `maxNewTerms` 2 / 4. `argumentMoves` — 7-8 owes the strongest case against its own February commit. `debriefMustConverge` — 5-6 must land on one sentence. **One reducer, one market, one rule set, both bands.**

## 9. The naming stage

**5-6 (two).** **SUNK COST** — moment: you cut a player and the money stayed on your books anyway. Class result: the room's waives, dead money unchanged. Real NBA: Milwaukee pays Damian Lillard $21,311,053 a year through 2030-31 after waiving him; he plays elsewhere (sourced, `world.ts`). Term: sunk cost. Outside: the ticket you already bought — you go or you don't, the money's gone either way. — **DECISION QUALITY vs OUTCOME** — moment: two desks made the same call and got opposite reports. Class result: the NEAR MISS tape pair. Real NBA: a market-price contract that aged badly next to an identical one that did not. Term: a good decision can have a bad result. Outside: the umbrella you carried on a dry day.

**7-8 adds two.** **PATH DEPENDENCE** — moment: February refused you because of a wall you drew in July. Class result: the wall count on the board against who could reach the buyout market. Real NBA: 22 of 30 clubs operating under a hard cap in 2026-27 (§2.3). Outside: the elective you picked in September deciding what you can take in March. — **OPTION VALUE** — moment: the ten-day contract. Class result: which desks bought information cheaply and which committed early. Real NBA: the 10-day contract as a priced look before a guarantee (§2.10). Outside: paying a little to keep a choice open.

W1's terms (opportunity cost, scarcity, institution, price from competition) return as retrieval, not as new names.

## 10. Sixty minutes

LOBBY 2 · HOOK 6 (Previously On + the job report, three teacher-gated beats) · PLAY 11 · REVEAL 4 · CONSEQUENCE 7 (tax clock, walls, **Press Conference #1 ≈ 4**) · ADAPT 12 · COUNTERFACTUAL 5 · ARGUE 5 · SYNTHESIS 6 · COMPLETE 2. **Protected ending = the last 18 minutes; the floor is 15 and the console warns at CONSEQUENCE if the clock says it is at risk.** Compressed path cuts ADAPT to 8 and COUNTERFACTUAL to 3 and keeps a choice, a consequence, an argument, the economics and a transfer.

## 11. Teacher director cards

**HOOK** — NOW: press the beats one at a time; let the room read one report. WATCH FOR: the desk that says "that's not fair." DON'T EXPLAIN YET: why he didn't do the job. ASK: "What job did you sign him to do?" TRIGGER: beat 3 when the room is talking over you.
**PLAY** — NOW: January is open; ten-days only. WATCH FOR: desks filling every slot on minute one. DON'T EXPLAIN YET: that February is better. ASK: "What are you saving that slot for?" TRIGGER: FINAL CALL at 9 minutes.
**CONSEQUENCE** — NOW: read the tax clock, then pause and call the podium. WATCH FOR: laughter at a bad report — cut it immediately. DON'T EXPLAIN YET: sunk cost. ASK the invited desk first, yourself, deadpan. TRIGGER: close the podium after two student questions.
**ADAPT** — NOW: February; the walls are live. WATCH FOR: a desk refused by its own July — get them to say why out loud. DON'T EXPLAIN YET: path dependence. ASK: "Who drew that wall?" TRIGGER: FINAL CALL at 10 minutes.
**COUNTERFACTUAL** — NOW: two tapes, no more. WATCH FOR: "they got lucky." DON'T EXPLAIN YET: the term. ASK: "Was that a bad decision, or a bad result?" TRIGGER: next tape when the room splits.
**ARGUE** — NOW: take the split to a vote of hands, then take reasons. WATCH FOR: 7-8 desks that never name a cost. ASK: "What would have to be true for you to be wrong?" TRIGGER: optional second podium.
**SYNTHESIS** — NOW: hold the word back until a student says the idea. WATCH FOR: the sentence "the money's gone anyway." DON'T EXPLAIN YET: nothing — this is the naming. ASK: "Why keep him if the money's already spent?" TRIGGER: next name.

## 12. Dominant-strategy hunt

**"Sign nobody, keep the money."** Fails honestly: the 14-contract minimum and the empty-slot backstop below 12 ($1,357,763 charged per empty slot) mean nothing is saved, and an open job walks into Week 3's trade market with nothing to trade for it.
**"Waive everyone who didn't do the job."** Fails: the cap hit does not drop — only the slot opens — and the stretch election spreads the same total across later seasons that Week 3's deadline and Week 4's bill actually charge. **This only holds if `stretchSchedule` genuinely carries; if it does not, this strategy dominates and the lesson teaches the sunk-cost error it exists to break.**
**"Fill everything with minimums."** Honest, not dominant. It is always legal, always available, and for the most constrained desks it is the right answer — which is the truth about the NBA. It does not dominate because a minimum body closes a BIG or GUARD job worse in the authored report, and because the 15-man season roster means a January minimum consumes the slot February needs.

## 13. Tests a builder must pass

1. Phase list is an ordered subsequence. 2. `sign` in HOOK is refused. 3. `waive` in PLAY is refused. 4. `stretch` without a waive is refused. 5. Every commit without a chip is refused. 6. Every commit without a line is refused. 7. Carry from the other band is refused and the whole room falls to stock desks with the reason on `/teach` only. 8. A dropped desk gets a stock franchise and every other carried desk survives. 9. `boardView` output contains no seat id at any phase. 10. `podiumFrame` contains no chip and no typed line. 11. `podiumFrame` omits `result` until the teacher has revealed it. 12. A declined desk never appears in `podiumCandidates` again. 13. A dealt (stock) desk never appears as a candidate for its July. 14. Ranking is unchanged when a desk closes an extra job. 15. Ranking is unchanged when a desk's payroll rises. 16. The reducer never reads `state.tape` (mutation test: emptying the tape changes no reachable position). 17. A tape entry is byte-identical before and after a later commit. 18. Sweep: every reachable carried position has at least one legal move closing at least one open job. 19. A wall drawn in Week 1 refuses the exact February signing that crosses it, with the July date in the message. 20. First-apron desks cannot sign an above-NTMLE buyout player; below-apron desks can. 21. Waiving does not reduce `committed` this season. 22. A stretch election changes `stretchSchedule` and not this season's cap hit. 23. `taxSalary` and `committed` never mix in any dollar computation. 24. At 5-6 no view payload contains a negative number or a percent. 25. A February window closed by the clock and one closed by hand produce identical state.

## 14. Open questions for the founder (five)

1. **Is the typed reasoning line public on the podium?** I propose teacher-only — publishing it removes the reason to speak and is the likeliest humiliation vector.
2. **Stretch.** The CBA requires the election before September 1 preceding the final season (§2.9), so a February stretch cannot relieve this season. Accept my February-election / next-September-effect simplification, or drop stretch from Week 2?
3. **Job-report resolution.** Authored-per-player means two desks who signed the same player in different rooms always get the same verdict. Accept, or force a seeded branch?
4. **Does a dealt-July desk ever take the podium** — never for July, but yes for its own February, as I propose?
5. **The 90-second rotating Front Office Review** (Bible §12.1 C, "every week from Week 2 onward") — does it live inside ARGUE this week, or is it deferred to Week 3's boardroom?

---
