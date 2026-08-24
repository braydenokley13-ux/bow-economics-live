# Module 1 Design — "The Cap" (Legacy-Maximal Build)

**Author:** Sonnet A — Legacy Champion
**Brief:** Build the strongest Module 1 by maximally reusing verified BOW code. Where legacy is weak, this document says so.

---

## 1. The Arc

**Role, held across all three lessons: General Manager, Front Office.** Not because every BOW role should default to GM — because the GM is the one seat that legitimately touches all three of Module 1's economics beats (a fixed budget, a spending threshold that punishes overreach, and the institutional reason the threshold exists at all). No other role change buys anything here, and switching roles mid-module would break the one continuity hook the legacy code already gives us almost for free (see §5, item 2).

| # | Lesson | Reused core | New economic beat |
|---|---|---|---|
| 1 | **Front Office: Build the Roster** | `T101-M1-L1` | Scarcity + opportunity cost under a fixed cap |
| 2 | **Trade Deadline War Room** | `T101-M1-L2` | A spending threshold that changes what's rational |
| 3 | **Why the Cap Exists** | `101-M2-L2` pattern + `bow-universe` math | The cap as an institution, judged on the class's own data |

**Continuity (cheap, not required, included because it's genuinely free):** L1's `buildCompletionResult()` and L2's `projectChain(baseMetrics, ...)` already share the same four-metric shape (`cash/wins/chemistry/clout` vs `cash/wins/chem/clout` — one key rename). Seeding L2's Round 1 with each student's own L1 final metrics instead of a fresh flat start costs almost nothing and turns "yesterday's team" into "today's team facing the deadline" — real stakes, no new code. L3 needs no student decisions carried forward at all; it consumes the *class's* L1/L2 numbers in aggregate, which is a different, cheaper kind of continuity (data, not state).

---

## 2. Lesson 1 — Front Office: Build the Roster

**System.** A fixed salary cap (three tiers by chosen GM style: Win Now $140M / Balanced $130M / Smart Spender $115M) allocated across a 16-player pool with real cost/win/clout tradeoffs. Scarcity is the budget; opportunity cost is every player you didn't sign because you signed someone else.

**Decisions (BUILD, ALLOCATE, REVISE).** Draft a roster under budget; absorb one mid-build "Owner's Curveball" (a budget cut, a fan-buzz demand, a depth demand, or a win-total demand) and adjust; submit.

**What becomes visible.** Four live meters (`computeMetrics()`) update on every roster edit — stacking stars visibly drains Cash and dents Chemistry; a deep bench visibly costs Wins-per-dollar efficiency. The causal chain a student can point to: "I signed three superstars → Cash dropped to $4M → Chemistry fell because I have no depth → the owner's curveball asked for depth I can no longer afford." That chain is the lesson, not a sentence about it.

**Honest weakness, and the fix.** `CURVEBALLS` currently fires uniformly at random (`Math.floor(Math.random() * pool.length)`), so the shock is *unpredictable* but not *attributable* — two students with identical rosters can get different, unrelated curveballs. `bow-decision-challenges`' strongest structural idea (its Week-5 shock, whose cost is set by an earlier housing choice, not by chance) is exactly the fix: reweight curveball selection so a roster that already neglected Chemistry is more likely to draw the depth-demand curveball, and a roster low on Clout draws the fan-pressure one. Uncertainty stays honest (still not guaranteed, still not narrated in advance) but the shock becomes traceable to the student's own prior build, not a coin flip layered on top of it.

**Class evidence artifact.** Every finished roster is one data point: final (Cash, Wins) or (Chemistry, Clout). The teacher's projector shows the room's own scatter — same budget, wildly different teams. Debrief: who ended up strongest in what, and why nobody agrees on the "right" build.

**Device/interaction shape.** One Chromebook per student, fully individual — no student's roster affects anyone else's, so there is no case for realtime multiplayer here. The only cross-student moment is the aggregation reveal at the end, which needs nothing more than each student's two final numbers reaching the teacher's screen (a short submitted code, a shared sheet, or a simple facilitator-side collection point — not a synchronized session).

**Minute-by-minute (45 min).**
- 0–5 Whole-class briefing: the budget, the four meters, one line on scarcity.
- 5–8 Pick GM style (sets budget + owner priority).
- 8–25 Build roster; teacher circulates, meters update live.
- 25–33 Curveball fires as each student locks in (staggered, not synced) → adjust → submit.
- 33–38 Performance report; one required sentence naming one of the student's own numbers.
- 38–43 **Reveal moment:** class scatter goes up on the projector — same starting budget, this is what the room actually built.
- 43–45 Bridge: "this roster is your team going into tomorrow's trade deadline."

**30-second rescue.** A student frozen by 16 players: point at their GM style's priority stat and the visible Cash meter — "you have $Xm left; what's one player who moves your priority stat without draining that meter to zero?" The meters already do the diagnostic work; the teacher just has to point at them.

---

## 3. Lesson 2 — Trade Deadline War Room

**System.** A single luxury-tax line at Cap Space = 40 (`TAX_LINE`, `isInLuxuryTax()`). Below it, a penalty applies; above it, a signing is free. This is a **threshold effect**, not graduated marginal-bracket taxation — which is the *correct* complexity for grade 5-6 given the hard constraint against multi-bracket tax math, and matches the curriculum's separate "Cap Jail" objective (a line that changes what's legal/costly, not a smooth curve) more than its "Luxury Tax Basics" objective (a dollar getting progressively more expensive). This asset effectively folds those two curriculum lessons into one — a deliberate compression, not an oversight, and worth naming to the CEO as a choice rather than a gap.

**Honest weakness.** `taxNote()`'s copy says "every extra dollar costs you roughly triple" once a student crosses the line — but the underlying math (`applyDeltas`, `computeScore`) applies **fixed deltas per trade option**, not an escalating per-dollar cost. The narration overclaims what the code does. This needs a copy fix (say what actually happens: "you're now paying a penalty for the rest of the deadline," not "triple") regardless of what else changes — a copy/code mismatch worth fixing on its own merits.

**Decisions (TRADE, PRICE, REVISE).** Round 1: pick a trade strategy (Star Chaser / Balanced Builder / Future Planner / Safe Operator) — deltas apply immediately. A fixed, ownership "pressure moment" fires next (a simulated counterparty, not a live one — correct call per the multiplayer constraint, since nothing here needs another live participant to be materially true). Round 2: a closing move that is a real response to the state Round 1 and the pressure created, not a fresh menu.

**What becomes visible.** The Cash meter visibly approaching 40 as trades apply; crossing it flips a clearly narrated state (`taxNote`'s four branches: crossed / pulled back / still over / stayed under). A student who stops just under the line did so as their own visible choice, not a rule read to them.

**Class evidence artifact.** Distribution of who crossed the tax line vs. who didn't, cut by final Wins — direct fodder for "was the extra star worth it," which is the curriculum's own suggested debrief and requires no new math, just tallying `isInLuxuryTax()` + `wins` across submissions.

**Device/interaction shape.** Same as L1 — individual, no sync needed for the decisions themselves. The pressure moment is worth reading aloud as a class beat ("ownership just texted the room") since its content is identical for everyone; that's free theater, not a technical synchronization requirement.

**Minute-by-minute (45 min).**
- 0–5 Recap: "this is your team from yesterday" (seeded from L1's final metrics).
- 5–15 Round 1 trade pick.
- 15–18 **Reveal moment:** pressure memo lands, read aloud by the teacher in sync with the room.
- 18–28 Round 2 closing move.
- 28–33 Performance report; did you cross the line, was it worth it.
- 33–38 One-sentence defense citing the student's own Cash and Wins numbers.
- 38–43 Class tally on the projector: crossed vs. stayed under, by final Wins.
- 43–45 Bridge to L3.

**30-second rescue.** A student confused that their Round 2 options don't match a neighbor's: "your Round 2 is built to respond to *your* Round 1 — everyone's is different because everyone's Round 1 was different." For tax-line confusion, point at the Cash meter directly: "when this dips under here, you start paying extra — where's yours right now?"

---

## 4. Lesson 3 — Why the Cap Exists

**System.** Not a new simulation — the class's own L1/L2 numbers, replayed under two rule conditions: the cap as it actually constrained them, and a computed "no cap" counterfactual where the same player pool is available without a budget ceiling. This is the curriculum's Module 2 "synthesis" lesson (`101-M2-L2`'s neighbor concept — "run the same starting league two ways… watch parity hold or collapse"), repurposed as Module 1's own closing argument, since it is the natural payoff of everything L1 and L2 already generated.

**Reused math.** `bow-universe/src/lib/sim.ts`'s `computeParityIndex()` — a ~10-line population-standard-deviation function, extracted cleanly from its Prisma/Next.js shell — run twice over the class's own final Wins values: once as submitted (cap world), once recomputed with the budget constraint removed from each student's own roster (no-cap world, using the same pool). Never surfaced to students as "standard deviation" — shown as a plain-language spread: two dot-plots, one tight, one scattered.

**Decisions (RANK, DEFEND, and one shared REVISE).** Individually: rank which world looks more fun to play in and defend it citing a real number from either distribution. As a class: a few volunteers propose a cap level; the teacher recomputes the spread live using the same `computeParityIndex()` call against a hypothetical mid-point cap, showing the dial move the room's own numbers. This is facilitator-run off one shared input, not synchronized multiplayer — no student needs to see another's dial move in real time for the mechanism to be honest.

**What becomes visible.** The room's own competitive spread, side by side, with and without the rule they lived under yesterday. The causal chain: "my class, real numbers, tighter together with a cap, farther apart without one."

**Reused pattern, not reused content.** `101-M2-L2`'s `ROUND2[state.r1]` branching-by-prior-choice architecture is the template for the "propose a cap, see it move" step — the option set (or in this case, the outcome shown) is *selected by* what came before, not decorative. Its Module 2 revenue-sharing copy is not reused; the pattern is.

**Class evidence artifact.** The two dot-plots themselves, built entirely from real class data — the strongest possible version of "not a leaderboard": no student is ranked against another, the *distributions* are the artifact.

**Device/interaction shape.** Mostly whole-class/projector; Chromebooks only for the individual rank/defend step. This lesson is genuinely cheap to build because its reveal is pure aggregation plus two calls to one existing pure function — no new per-student simulation is required.

**Minute-by-minute (40–45 min).**
- 0–5 Framing: "yesterday your team hit a tax line — why does a league even have one?"
- 5–15 **Reveal moment:** the two dot-plots go up side by side, built from the room's own numbers.
- 15–25 Individual rank + one-sentence defense citing a real number.
- 25–35 Class dial: volunteers propose a cap level, teacher recomputes live.
- 35–40 Synthesis, tied explicitly back to the room's own data.
- 40–45 Wrap.

**30-second rescue.** A student personally invested in the no-cap world because their own team "won" there: reframe from personal score to shared product — "you built the best team in a world with no rules — nice job — now look at what that did to everyone else's games." (This reframe — "the competition IS the product" — is `101-M2-L2`'s own line, already proven to land in that lesson's copy; reuse it verbatim here.)

---

## 5. Exact Reuse Map

| Legacy asset | What's reused | Grade 5-6 change required |
|---|---|---|
| `T101-M1-L1/index.html` — `computeMetrics()` (~775-810), `gradeTeam()` (~815-845), `CURVEBALLS` (729-746), `STYLES` (667-677), `POOL`/`ALL_PLAYERS` (693-726), `buildCompletionResult()` (1269+) | Whole roster-build engine, near-verbatim; reading level already correct (confirmed by direct read — one of only two Track 101 assets that is) | Reweight curveball selection to depend on the student's own weakest metric, not `Math.random()`, per §2. Add a required-but-unscored one-sentence defense (`writingGate.ts` discipline, not its copy). Add the end-of-lesson submission step feeding class aggregation — this is net-new, no legacy asset does it. |
| `T101-M1-L2/src/simulation.js` — `projectChain()` (92-98), `isInLuxuryTax()`/`TAX_LINE` (43, 100-102), `taxNote()` (170-183), `computeScore()` (144-156), `strategyTypeFor/strategyNameFor` (118-136), `buildReport()`/`buildCompletionResult()` | Whole two-round trade engine, near-verbatim; only asset in the portfolio with a passing (28/28) test suite | Seed `baseMetrics` with L1's final metrics instead of a flat start (one key rename, `chem`→`chemistry`). Fix `taxNote()` copy to stop implying graduated marginal cost the code doesn't compute. Do **not** import `bow-universe`'s marginal-bracket walker here — the existing single-threshold model is the right complexity, not a shortfall. |
| `bow-universe/src/lib/sim.ts` — `computeParityIndex()` (112-122) | The pure spread-statistic function only | Extract from its Prisma/`MarketSizeTier`/Next.js coupling (confirmed trivial — no hidden dependencies in the function body itself). Never expose the term "parity index"/"standard deviation" to students. Do **not** reuse `calculateLuxuryTax()` (real marginal brackets) anywhere in Module 1 — it directly conflicts with the no-multi-bracket-tax-math constraint despite being the most rigorous math in the portfolio. |
| `101-M2-L2/js/lesson.js` — `ROUND2[state.r1]` branching-by-prior-choice architecture (107-219, 332); the `CONSEQUENCE1`/`CONSEQUENCE2` authored-object shape (what changed / why / pressure / lesson) | The *pattern*: an outcome selected by an earlier decision, and a structured way to author consequence copy | Reuse the pattern for L3's cap-dial reveal and as the content-authoring template for L1/L2 curveball and trade copy. Its actual Module 2 revenue-sharing content is not reused — wrong topic for this module. |
| `bow-decision-challenges/src/domain` — `scenario/worlds/basketball/scenario.ts` disruption block (112-125), `finance/consequences.ts` forced-vs-chosen-reduction discipline, `evidence/writingGate.ts` | Three structural ideas only: (1) a shock priced by an earlier decision, (2) never counting a product-forced cut as a student's own decision, (3) a written-defense gate that checks the student's own numbers appear, never scores prose quality | Full content rewrite required — its persona (an 18-year-old, personal-finance, "Avery") and reading level are wrong for grades 5-6 and wrong domain (individual budgeting, not team-building). This is the highest-value *pattern* asset in the portfolio and the weakest-fit *content* asset for this module. |

---

## 6. Risks and Open Questions

1. **No legacy asset does cross-student aggregation for these three lessons.** L1's scatter, L2's tally, and L3's dot-plots are all net-new display work, even though the underlying numbers already exist in each lesson's `buildCompletionResult()`. The only asset with real classroom aggregation infrastructure (`101-pre-course`) is unverified and architecturally heavier than this module needs — recommend building the lightweight aggregation views fresh rather than depending on it.
2. **The `taxNote()` copy/code mismatch (§3) should be fixed regardless of which design wins the gauntlet** — it currently teaches something the math doesn't do.
3. **Open call for the CEO:** is a single luxury-tax threshold (current L2 asset) an acceptable substitute for the curriculum's original "dollar gets progressively more expensive" framing, or does that specific feel need to survive even in simplified form? This design recommends accepting the threshold model as the age-appropriate version and folding "Cap Jail" in with it, but that is a content call, not a purely technical one.
4. **The L3 "no cap" counterfactual is genuinely new math**, not a legacy asset as-is: it requires recomputing each student's roster value with the budget constraint removed, which `computeMetrics()` doesn't currently do (it assumes a budget-constrained roster was already chosen). Small, but not zero, build work.
5. **Open question:** should the written-defense step ever block progress, or stay fully ungated as both L1 and L2 currently do ("grading never blocks completion")? This design recommends keeping it ungated but adding the `writingGate.ts`-style requirement that the sentence contain one of the student's own numbers — a nudge, not a hard stop — but that's a facilitator-experience call worth confirming.
6. **Open question:** the L3 class dial (§4) needs a concrete facilitation choice — a single teacher-held dial taking verbal proposals, versus a projected number line the class votes on by show of hands. Either is consistent with the constraints; neither is chosen here.
