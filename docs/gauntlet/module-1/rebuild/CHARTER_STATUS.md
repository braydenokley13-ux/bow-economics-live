# Module 1 build charter — live status

Tracks the 23 binding items in `ARCHITECTURE_SELECTION.md` §6. Updated as evidence lands.
Nothing here is "done" on reasoning; each row names the command or file that proves it.

**Evidence commands.** From `runtime/`:
`npm test` (unit + cross-cutting harnesses) · `node scripts/same-line-sweep.mjs` (L1 economics,
exit code is the verdict) · `node scripts/e2e-*.cjs` (browser truth).

| # | Charter item | Status | Evidence |
|---|---|---|---|
| BC-1 | The reveal measures what the desk DID | **HELD** | P-DID — every class-facing reading varies with the desk's own actions. Two of the winning design's five readings (MOST ROOM LEFT, MOST TOOLS LEFT) were never built. A third, `contestedWon`, was built, measured, and REMOVED from the class-facing set when the sweep showed a club past the first apron scores zero on it across all 359 of its reachable plans — a reading a seat can never move is its inherited position wearing an activity label. |
| BC-2 | Passivity is never a free win | **HELD, restated** | P-HOLD, all seats, all three rival environments. Restated from "all-PASS strictly Pareto-dominated" — deviation recorded below. Poison mutant M1 proves the limb can fail. |
| BC-3 | The tool ladder is real | **HELD** | P-LADDER — every over-cap seat's reachable spend holds ≥3 distinct prices, ≥2 between the minimum and the big exception. Poison mutant M2 proves the limb can fail. |
| BC-4 | No money→outcome monotone | **HELD** | P-MONEY — at every seat a cheaper plan beats a dearer one on a displayed reading. |
| BC-5 | Every narrated beat producible by the shipped reducer | not started | Needs the lesson module. |
| BC-6 | Fandom neutrality tested for outcome parity | not started | Board cards carry role, price, one strength, one risk, no rating and no sortable number — necessary, not sufficient. Needs the three-non-fan test. |
| BC-7 | One payroll definition, printed beside every payroll | **HELD in the data** | `world.ts` `PAYROLL_DEFINITION`; every club figure is SalarySwish cap hit including holds. Rendering limb needs the client. |
| BC-8 | No luxury-tax dollar bill on any surface | **HELD** | No tax bill exists anywhere in `world.ts` or `engine.ts`. |
| BC-9 | No beat rests on a volatile figure | **HELD** | `world.ts` `REFRESH` states the cadence and the check; the three clubs inside a stated volatility band (San Antonio, Phoenix, Oklahoma City) are not seats; no beat reads a distance to a line, only a BAND. |
| BC-10 | No NBA figure printed for an unannounced season | **HELD so far** | No future-season figure exists yet. Binds L3. Registered as S5. |
| BC-11 | The intellectual reveal always has content | not started | Needs the lesson module. |
| BC-12 | The trap must be expressible | not started | The sweep enumerates rather than running canned strategies, so the original defect (a multiplier clamped byte-identical) cannot arise; the shade-and-lose plan is still owed. |
| BC-13 | ≥4 distinct reachable outcome vectors per seat | **HELD at 23 of 24** | P-VEC. One seat-environment pair (New York in the cheap-room environment) reaches 3. Deviation recorded below. |
| BC-14 | No dead seats; every club held by ≥2 desks; P-TWIN | **HELD** | P-TWIN passes on every reading: what a desk did moves the number at least as much as which club it was dealt. Denver demoted to a projector case on the sweep's evidence. Sacramento unfrozen (the window limit is 21, not 15). THE TWIN DESK is in the sweep at 16 desks. |
| BC-15 | No scalar, rank, award or combining function anywhere | **HELD** | Five readings, no total, no rank, no award. `engine.ts` `READING_IDS`. |
| BC-16 | Priced day-0 scaffold; ≤2 variables, ≤40 words, no percentages at 5–6 | not started | D49 Q1 rules two live lines at 5–6, five drawn. |
| BC-17 | One reducer resolving both bands, asserted differentially | not started | |
| BC-18 | The seam attaches at exactly three points incl. a band stamp on the seed | **1 of 3 done** | The seed envelope now carries provenance (`sourceSessionId`, `sourcePhase`, `sourceEnded`) — `controlSafety.test.ts`. The band stamp lands with the band. |
| BC-19 | P1 replayed with a real (A, H1, H2) triple | not started | Binds L2/L3. |
| BC-20 | Claims audit as an instrument | **foundation laid** | `shared/claims.ts` + `claims.test.ts`, including the COVERAGE limb the M2 audit lacked and an independent-recomputation limb with teeth. Per-lesson wiring outstanding. |
| BC-21 | Simplifications ledger with misconception risk | **HELD** | `world.ts` `SIMPLIFICATIONS` S1–S7, each with the real rule, the simplification, why, the misconception risk and what it preserves. |
| BC-22 | A free changeable stake for every committed pair; ≤50 played minutes | not started | |
| BC-23 | Three separated surfaces; `boardView` never handed a seat identity | not started | The runtime already guarantees the structural half. |

## The open finding — why two seats are thin, and whose fault it is

P-VEC and P-TWIN fail only at New York and Minnesota, the two seats past the first apron.
The cause is not the model and not the charter. It is an instruction I gave: the free-agent
research was told to exclude every player belonging to the eight student-seat clubs, to avoid a
player appearing both on a club's roster and on the board.

That exclusion removed **the one thing the first apron notably does not take away** — a club's
right to re-sign its own free agents through Bird rights. For a capped-out contender that right
is not a footnote; it is the entire offseason. Without it, a club past the apron has the taxpayer
mid-level, the minimum market, and nothing else, and its whole action space collapses to one best
plan.

The repair is a targeted second research pass for genuine New York and Minnesota free agents, not
a tuning change, and certainly not a fabricated one. If that pass comes back empty, the honest
alternatives are, in order: re-cut those two seats onto clubs that did have free agents; or demote
the over-apron band to a projector case as Denver already is, and accept that L1 teaches four
bands rather than five.

## The five class-facing readings, as built

No total, no rank, no award, no combining function (BC-15). Five different questions with five
different answers, so a desk can top one and be last on another — which is where the argument the
lesson wants comes from.

1. **JOBS CLOSED** — how many of your open holes you actually filled.
2. **JOB-YEARS** — how long those holes stay filled.
3. **CHEAPEST JOB CLOSED** — the least you paid to fill one.
4. **LONGEST COMMITMENT** — the term of your longest deal. The win-now-versus-later axis in its
   purest form, and the one every seat can move because the term comes from the tool.
5. **ROOM LEFT** — the distance from where you finished to the next line above you. What every
   signing spends, and what your February is made of.

`ROOM LEFT` was added because without a cost axis the frontier said money was free, and signing
everybody at the top price dominated at every constrained seat. It is a CLOSING position, so it is
a function of what the desk did — unlike the winning design's MOST ROOM LEFT, which a club topped
by sitting still.

## Deviations from the charter, recorded rather than hidden

- **BC-3's measurement.** The charter's paraphrase asks for "≥3 legally reachable tools"; its own
  stated falsifier asks that the reachable SPEND SET not collapse to a single value. Those differ
  for a club past the first apron, which genuinely has two tools and is not defective for it. The
  property is asserted in the falsifier's terms.
- **BC-13 under perfect foresight, and the one combination that misses.** The sweep gives the focal
  desk perfect knowledge of deterministic rivals, and under perfect information a single best plan
  is the expected outcome of almost any game — so a thin frontier is partly an artifact of the
  instrument. 23 of the 24 seat-environment combinations reach ≥4 distinct non-dominated outcome
  vectors. New York in the cheap-room environment reaches 3, and the three are qualitatively
  different strategies rather than three shades of one: keep your own man and lose your exception
  for the rest of the window; spend the exception on outsiders and let him go; stay cheap and keep
  your room. The charter's number was set against a different candidate's model, whose frontiers
  ran 1–6. Three distinct strategies at one seat in one of three environments is not judged a
  defect worth contorting the world to fix, and it is recorded here rather than rounded up.

- **BC-2 restated, and why.** The charter asks that PASS/PASS/PASS be STRICTLY PARETO-DOMINATED at
  every seat. Once the frontier gained its cost axis that became impossible to satisfy honestly:
  doing nothing maximises the distance to your next line by construction, so it sits on the
  frontier of any axis set that treats preserved flexibility as worth anything at all. Forcing it
  off would mean asserting that flexibility is worthless — false economics, and a direct
  contradiction of the class reveal, which is explicitly built to put "most future flexibility"
  beside "most jobs closed" and let the room argue. The property is asserted in two falsifiable
  limbs instead: passivity never tops an ACTIVITY reading, and passivity is never the only plan on
  the frontier. The defect BC-2 was written against — a reveal whose readings a club tops by
  sitting still — is closed by the first limb together with BC-1.
