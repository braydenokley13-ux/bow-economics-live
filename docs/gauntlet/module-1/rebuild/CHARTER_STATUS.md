# Module 1 build charter — live status

Tracks the 23 binding items in `ARCHITECTURE_SELECTION.md` §6. Updated as evidence lands.
Nothing here is "done" on reasoning; each row names the command or file that proves it.

**Evidence commands.** From `runtime/`:
`npm test` (unit + cross-cutting harnesses) · `node scripts/same-line-sweep.mjs` (L1 economics,
exit code is the verdict) · `node scripts/e2e-*.cjs` (browser truth).

| # | Charter item | Status | Evidence |
|---|---|---|---|
| BC-1 | The reveal measures what the desk DID | **HELD** | `same-line-sweep.mjs` P-DID — every class-facing reading varies with the desk's own actions. Two of the winning design's five readings (MOST ROOM LEFT, MOST TOOLS LEFT) were never built. |
| BC-2 | All-PASS strictly Pareto-dominated at every seat | **HELD** | P-HOLD, all seats, all three rival environments. Strict-Pareto test; the beats-on-any-one-dimension form was never written. Poison mutant M1 proves the limb can fail. |
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
| BC-13 | ≥4 distinct reachable outcome vectors per seat | **FAILING at 2 of 8 seats** | P-VEC. Six seats reach 2–3, the two past the first apron reach 1. See "The open finding" below. |
| BC-14 | No dead seats; every club held by ≥2 desks; P-TWIN | **PARTIAL** | Denver demoted to a projector case on the sweep's evidence (one reachable price). Sacramento unfrozen (the window limit is 21, not 15). THE TWIN DESK is in the sweep. P-TWIN still fails on `jobYears` and `contestedWon`. |
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

## Deviations from the charter, recorded rather than hidden

- **BC-3's measurement.** The charter's paraphrase asks for "≥3 legally reachable tools"; its own
  stated falsifier asks that the reachable SPEND SET not collapse to a single value. Those differ
  for a club past the first apron, which genuinely has two tools and is not defective for it. The
  property is asserted in the falsifier's terms.
- **BC-13 under perfect foresight.** The sweep gives the focal desk perfect knowledge of
  deterministic rivals. Under perfect information a single best plan is the expected outcome of
  almost any game, so a thin frontier is partly an artifact of the instrument. This is noted, not
  used as an excuse: the two failing seats are thin under every environment tried, which is a real
  finding regardless.
