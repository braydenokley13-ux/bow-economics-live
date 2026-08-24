# Cross-Cutting Portfolio Scout — Track 101 Reuse Candidates

Scope: the 14 named repos under `github.com/braydenokley13-ux`, cloned shallow to
`/home/user/braydenokley13-ux/<name>` and read directly (economic kernels, state
machines, package manifests). One repo in the list — `sim-library` — turned out to
be a pre-existing, code-verified, account-wide audit (86 repos, dated 2026-08-14,
one week before this scout ran) covering every other repo on this list plus 62
more. Where its evidence citations are specific and checkable, this report
cross-references rather than duplicates them; every non-trivial claim below was
independently confirmed against the actual source in this session unless marked
"per sim-library audit, not independently reproduced."

---

## 1. bow-decision-challenges — the flagship, and the bar

**What it is.** "Plan Under Pressure": an eight-week basketball-season budgeting
challenge for grades 6–8, plus a second "world" (a food-truck pop-up business) and
an internal capstone-vs-challenge architecture (`ARCHITECTURE.md`) built to host
more challenges later. Not GM/franchise — personal financial literacy inside a
sports narrative (a player's own money, not a team's).

**Tech stack.** React 18 + TypeScript + Vite, React Router, a small Express-style
serverless API (`server/`) backed by AES-256-GCM encrypted-at-rest storage
(`server/vault.ts`, `server/store.ts`), Vitest (domain/unit), Playwright (e2e +
accessibility scans via axe), ESLint/Stylelint. `npm install && npm run typecheck`
was run in this session: 351 packages, **typecheck passed clean (exit 0)** —
confirmed runnable, not just documented as such.

**Economic kernel (read in full).** `src/domain/finance/formulas.ts` — pure
functions computing `availableFor`/`lockedFor`/`balanceOf` across five distinct
plan "modes" (opening plan, fallback, week-5 crisis response, final, remaining
risk), with explicit separation of **reliable income vs. conditional income**
(`exposureFor`, `conditionalIn`) and a documented anti-pattern fix: a "forced
reduction" (money the product itself zeroed out) is never counted as a student's
decision (`planMovements`, lines 87–138). `src/domain/scenario/worlds/basketball/scenario.ts`
encodes two genuinely conditional income streams (an attendance bonus that
depends on a *housing choice's commute time*, and an outcome bonus the student
cannot control at all) plus a Week-5 shock (arena closure + injury) whose cost is
housing-dependent. `src/domain/scenario/worlds/food-truck/economy.ts` is a second,
independently-designed kernel: **deterministic, no `Math.random()` anywhere** —
demand for a Saturday market stall is `crowdOn()`, a pure function of booth
location and a stated night-quality multiplier, with an explicit design comment
that a consequence a student can't trace to their own decision "is a consequence
they cannot learn anything from" (economy.ts:7–16). One night is deliberately
given as a *range* rather than an exact number (`crowdTold`) — real uncertainty
modeled as "what you knew" vs `crowdOn` as "what happened," kept structurally
separate so replays stay honest.

**State/session/classroom architecture.** Not multiplayer. A teacher creates a
class (`server/identity.ts`, `src/platform/classes/`), gets a join code, students
enter a code plus either a roster name or a typed first name (no student email/
password/birthday ever collected — enforced by `src/docsDataClaims.test.ts`).
Evidence (including free-text written defenses) is sealed per-record and retained
for a configurable number of days, then swept. This is the only repo in the set
with a real, tested, privacy-conscious classroom data model.

**Visual/interaction quality.** `WALKTHROUGH_OUT=<dir> npm run walkthrough`
screenshots the full flow at three breakpoints and fails on any horizontal
overflow or console error — a real regression harness, not a claim.

**Runnability.** Confirmed (typecheck + install, this session). No CI workflow
found, so tests only run when invoked manually — matches the sim-library record's
"No live URL found... instructor cannot launch it without deploying it first."

**Self-audit ("gauntlet/") worth knowing about.** The repo contains its own
internal adversarial-review archive — 43 critique reports, 2,437 screenshots/
receipts, a rule that "the status file is not evidence; the running artifact is
evidence" (`gauntlet/README.md`). This is a process worth stealing regardless of
what happens to the product: no fix is marked closed by the agent that wrote it.

**For Track 101 (grades 5–6):** the *mechanism*, not the content, is the reuse
target. This is built for personal budgeting at 6–8; a grade 5–6 Track 101 module
would need simpler numbers and reading level, but the pattern — reliable vs.
conditional income, a mid-run shock that is *cheaper or more expensive depending
on an earlier decision*, and a forced revision followed by a written defense — is
exactly the "scarcity → drama" shape the mission brief asks for, and it is the
only repo in the set with working accessibility and cross-viewport testing.

---

## 2. sim-library — not a simulation, but the fastest way to see the whole portfolio

**What it is.** BOW's own catalog-of-catalogs: 76 simulation records
(`data/simulations/*.json`) built from cloning and reading all 86 account repos.
Ships an internal browsable UI (`app/index.html`) and a public-safe payload
(`public/index.html`), both static, no server needed. **73 of 76 experiences are
unowned; none has ever run with a real student** (`discovery/REPORT.md:15–17`) —
a fact worth carrying into any reuse decision, since nothing in this account has
classroom validation, however polished the code looks.

**Direct relevance to this mission.** Its `discovery/evidence/agent-reports/`
directory independently investigated **Bow-Platform, Bow-Sports-Capital-Full-APP,
bow-universe, and CourtIQ** in depth (`bow-website-catalog.md`) and its
`repo-fingerprints.md` covers all 14 target repos structurally. Every finding
attributed to it below was spot-checked against the actual cloned source in this
session (file existence, quoted strings, function names) and matched.

**Headline portfolio facts worth the CEO knowing regardless of Track 101:** 48
working simulations are live on GitHub Pages and linked from nowhere in the
current website; 23 active experiences have no launch URL at all, including the
single largest product in the account (Highway World, ~2,700 tests, not in this
scope); financial literacy is 5 experiences against 59 economics; no simulation
anywhere teaches market equilibrium, monopoly, or auctions/bidding, despite
market equilibrium being on BOW's own published Track 101 Module 2 concept map
(`discovery/REPORT.md:104–106`).

---

## 3. league-in-a-box — the closest thing to an existing Track 101 capstone, and a cautionary tale

**What it is.** A single React app (`src/league-in-a-box-advanced.jsx`, 45.9 KB,
one file) where a student sets nine governance levers — salary cap model, revenue
sharing, luxury tax, contract limits, draft order, rookie pay, expansion pace,
player movement, enforcement — then the engine profiles "the league you built,"
names its character/typology, and renders a stakeholder win/lose matrix. Its own
intro screen literally labels itself **"Track 101 Capstone."**

**Tech stack.** React + Vite, no backend, no tests, no persistence beyond the
session.

**Mechanic quality (read directly, `LEVERS_CONFIG` lines 6–130+).** Genuinely the
most conceptually ambitious design-tool in the whole 14-repo set, and the
stakeholder matrix rewrites its *wording*, not just its numbers, per lever
combination (per sim-library playtest, 2026-08-16; consistent with the code
structure read here). But two disqualifying problems for grades 5–6, confirmed by
direct reading: (1) the reading level is aimed well above the stated audience —
lever copy reads "Wage Constraint Architecture," "Interclub Revenue
Redistribution," "Stochastic allocation favoring weaker teams," "Escalating
Prohibitive Tax" (lines 9, 31, 108, 68); (2) **there is no scarcity.** Each of the
nine levers is an independent 0/1/2 dial with no shared budget or mutual
constraint, so a student can max every dial in the "good" direction with zero
tradeoff — which directly violates the mission's core bar that economics itself
must create the drama.

**For Track 101:** the shape (set governance rules → see who wins and loses
under your own rules → argue about it) is worth keeping; the vocabulary and the
absence of a coupling constraint between levers need a full rewrite before this
is usable at grade 5–6. Do not ship the current build; do reuse the "set the
rules of the world, then live in the world you set" structure.

---

## 4. bow-universe — the most rigorous economic kernel behind the flagship

**What it is.** A from-scratch Next.js/Prisma/PostgreSQL "research-first"
platform, explicitly *not* arcade-styled, where students investigate a fictional
league's economics and can run a **policy sandbox**: submit a JSON "rule diff"
(e.g., change the luxury-tax brackets or revenue-sharing rate) against a league's
active ruleset and get back a computed Impact Report.

**Tech stack.** Next.js 16, TypeScript, Prisma/PostgreSQL, NextAuth, Vitest.
`prisma/schema.prisma` declares `enum GradeBand { GRADE_5_6, GRADE_7_8 }` —
directly grade-band-matched to this mission.

**Economic kernel (read directly, `src/lib/sim.ts`, 374 lines).**
`calculateLuxuryTax()` implements a real marginal-bracket tax — dollars above
each threshold are taxed at that bracket's rate only, brackets sorted and swept
(lines 84–108). `calculatePayrollForYear()` derives payroll from per-contract
annual salary arrays keyed by start year and length — a genuine multi-year
contract model, not a flat number. `computeParityIndex()` is literally a
population standard deviation over team performance proxies — real statistics,
correctly implemented. Market-size tiers (`SMALL/MID/LARGE/MEGA`) apply
documented revenue multipliers (0.92–1.22). All of it is deterministic and typed;
`sim.test.ts` exists.

**State/session architecture.** Full auth (NextAuth credentials), a
"Commissioner" teacher-analog role managing class codes/invites, proposal memos
that must cite the sandbox run as evidence before submission.

**Runnability.** Requires a provisioned Postgres instance; no live URL found in
the repo. This is real, tested logic with **zero classroom-ready deployment path**
today — the gap is entirely operational, not a code-quality gap.

**For Track 101:** `calculateLuxuryTax` and `computeParityIndex` are the single
most reusable, correctly-implemented pieces of "real economics" math anywhere in
this 14-repo set. They are currently wired into an authenticated Next.js/Postgres
app that is too heavy to stand up for a grades 5–6 pilot, but the pure functions
themselves (`src/lib/sim.ts`) could be lifted wholesale into a lighter shell.

---

## 5. GAUNTLET — four separable experiences, wildly uneven health

One repo, four independent HTML apps (confirmed structurally:
`Boss Sim/`, `gauntlet-l1/`, `GauntletL2/`, `gauntlet-l3/`).

- **GauntletL2 "Supply Chain Crisis"** (read directly, `GauntletL2/index.html`,
  1,343 lines) — the healthiest of the four. A real multi-product retail model:
  three products (basketballs, jerseys, water bottles) each with cost, storage
  footprint, price elasticity, and supply reliability; `calculateDemand()`
  (lines 950–984) combines a seasonal multiplier, a price-elasticity term against
  an "optimal price," a competitor-pricing response, a scripted market-event
  multiplier, **and `Math.random()` noise** — the one place in this repo's kernel
  that breaks the determinism discipline `bow-decision-challenges` treats as
  load-bearing for debrief-ability. Per sim-library, this is the only Gauntlet
  level with a live, working results-submission endpoint.
- **gauntlet-l1 "Market Master"** — pricing/production loop, playable, but its
  submission endpoint is a literal placeholder string (`YOUR_WEB_APP_URL_HERE`) —
  confirmed in the JSON evidence field; not independently reproduced here.
- **gauntlet-l3 "Economic Policy Simulator"** — genuinely the deepest
  macroeconomics in the entire portfolio (fiscal/monetary/trade policy, an
  explicit Phillips-curve unemployment/inflation trade-off, eight in-game
  quarters) but per sim-library's 2026-08-16 playtest, a *successful* run never
  resolves (Quarter 8 re-offers Submit forever; only failing runs get a report) —
  not independently reproduced, but the specificity (two full runs, 68%/76%
  approval, both hung) reads as a real reproduction rather than a guess.
- **Boss Sim "Economic Summit"** — the richest negotiation mechanic in the whole
  set: five cities, coalition formation, a secret side-deal with an ethics
  dimension, budget allocation needing 3-of-4 votes while keeping approval above
  50%. Confirmed by direct code read (`startRound1`–`startRound4`,
  `acceptAlliance`, `acceptSecretDeal`, lines 855–1360). Per sim-library, this is
  reproducibly softlocked after round 2 (no continue control ever renders) — not
  independently reproduced in-browser this session, but the claim is specific
  and falsifiable.

**For Track 101:** GauntletL2's inventory/pricing/seasonal-demand loop is the
best *pure* microeconomics reskin candidate in the set (concessions stand / team
merch booth), once the RNG term is removed or seeded. Boss Sim's coalition
mechanic is the strongest available match to the mission's NEGOTIATE verb, but
needs the round-3 unlock bug fixed before anyone plays it.

---

## 6. BSC-201-Capstone ("The Front Office") and Franchise-Sim (its superseded ancestor)

**Lineage, confirmed by direct read.** `Franchise-Sim/index.html` (single file)
and `BSC-201-Capstone/index.html` (single file, **22,092 lines**) share identical
`GameState` field order and `tfr_*` storage keys; the newer file adds a cap
timeline and a full ending. Franchise-Sim is a strict, incomplete subset —
**safely ignorable on its own**; everything worth reusing is in BSC-201-Capstone.

**Mechanic (read directly).** A franchise-archetype capstone (contender/young/
rebuilding) run across four decision cycles: trades, draft lottery, press
conferences, random events. `evaluateDecisionSuccess()` (lines 19810–19844) is a
genuine context-sensitive scoring function — a 0–100 score built from weighted
effect deltas (`rosterQuality`, `trustIndex`, `capFlexibility`, `optionality`,
`riskExposure`) whose weighting *changes* depending on whether the team state is
rebuilding or contending, and on stated owner expectations. That is a real,
reusable "the same choice scores differently depending on context" mechanic.

**Important caveat found by direct read, not in the sim-library record.** Many of
the trade options' "before/after" cap-space deltas are **hardcoded literal
strings** per branch (e.g. `capSpace: { before: '$44M', after: '$5M' }`,
line 5652) rather than computed live from the chosen numbers — this is authored
branching narrative with pre-scripted consequences in most rooms, not a general
parametric kernel, alongside at least one separately live-computed mini cap-math
tool (`this.capSpace - this.getTotalSalary()`, lines 9191–9285) that also uses
`Math.random()` for its starting cap. Reuse the *scoring function shape*
(`evaluateDecisionSuccess`); do not assume the displayed dollar deltas
generalize to arbitrary student choices — most of them don't.

**Runnability:** GitHub Pages returns 200 (per sim-library, 2026-08-14, not
reprobed here); no CI, no automated tests found.

---

## 7. 201-M1-L2-Luxury-Tax- — a clean, isolated marginal-tax-bracket calculator

**What it is.** An early (2026-01-01), superseded prototype of a Module 1 Lesson 2
slot — superseded by `T201-M1-L2` (not in this scope) five months later.
**Safely low-priority as a lesson**, but its isolated kernel is worth lifting.

**Kernel (read directly, `computeTax()`, lines 1119–1183).** A correct marginal
bracket walker: iterates ascending brackets, computes the taxable slice inside
each bracket (`Math.min(Math.max(payroll - lowerBound, 0), upperBound - lowerBound)`),
applies a different rate depending on repeater status, and extrapolates beyond
the configured brackets rather than erroring. A teacher-mode bracket editor
(`Ctrl/Cmd+Shift+T`) lets a facilitator change the numbers live. This is the
cleanest, smallest, most portable "real progressive taxation" implementation in
the set — a ~65-line lift, not a rebuild.

**For Track 101:** likely too advanced conceptually for a first grades 5–6 pass
(marginal brackets are not on BOW's current Track 101 concept map), but it is the
right building block if/when a later module wants to introduce progressive
taxation without inventing the math from scratch.

---

## 8. BSC-BUILDANALYTIC — "Stat Inventor" is the best grade-5–6-shaped mechanic found

**What it is.** Two lanes in one repo: `track101/index.html` ("Stat Inventor,"
stated grades 5–6) and `track201/index.html` ("Analytics Lab," stated grades
7–8), both Alpine.js single-file apps sharing a "build a weighted formula, watch
the leaderboard reorder" mechanic.

**Read directly (`track101/index.html`).** Star-based weighting (not raw
sliders — a better touch target and a friendlier metaphor for the grade band), a
computed "diversity score" that tells the student how concentrated their
weighting is (0 = equal weights, 100 = all-in on one stat), a "surprise me"
random-weights button, a plain-language auto-generated formula sentence, and a
required written defense field ("This supports my claim because…"). Per
sim-library's playtest (2026-08-16), the weighting and leaderboard genuinely
recompute correctly and reorder players; the charting half of both lanes is
broken (null-reference errors on load) — not independently reproduced here, but
consistent with a partially-wired charting library.

**For Track 101:** this is the single closest existing match in the whole
portfolio to the mission's target shape at the *correct* grade band — build,
observe consequence, defend in writing — once the chart is fixed or removed.

---

## 9. CourtIQ, Bow-Platform, Bow-Sports-Capital-Full-APP, scout-model, bow-prospect-builder — light-touch, mostly confirmed out of scope

- **CourtIQ** — off-domain (basketball IQ / off-ball decision-making training,
  not economics) and correctly excluded by the mission's economics mandate. But
  see §11 — its README ("Pre-MVP. No code yet.") is **false**; do not trust it.
- **Bow-Platform** — confirmed directly (`PortalActions.gs`,
  `portal/app/(student)/activities/page.tsx`) to be a Google-Sheets-backed admin/
  LMS shell that renders `activityUrl` as an outbound link. Zero embedded
  simulation logic. Superseded in spirit by Bow-Sports-Capital-Full-APP.
- **Bow-Sports-Capital-Full-APP** — confirmed directly (`lib/data/mock.ts`) to be
  the newest LMS shell (Next.js/Supabase/Drizzle), zero embedded simulation
  logic, but its `mock.ts` is genuinely useful as a map of BOW's *current*
  Track 101/201 module and lesson structure and which lessons already have
  activities wired (`T201-M1-L2`, the three Gauntlet levels) versus which are
  slide-deck-only.
- **scout-model** ("The GM's Model") — confirmed directly: the same application
  exists four times in the repo (`index.html`, `INDEX`, `TRUE SIM`, and a `.rtf`
  file) and the GitHub Actions workflow file contains HTML instead of YAML
  (cannot run). The app itself, read once, is a coherent "build a weighted
  evaluation model → watch it go stale three years later" mechanic with a
  genuinely good closing beat about model risk (credit scores, hiring
  algorithms, college admissions) — worth the *idea*, not this file.
- **bow-prospect-builder** — read in full (165 lines). It is a bare HTML form
  that POSTs to a Google Form (`docs.google.com/forms/.../formResponse`). There
  is no "Scouting Engine" in this repo at all — the report-generation the copy
  promises must live in a Google Apps Script this repo does not contain. Zero
  economic logic. Safely ignorable.

---

## Ranked top assets for Track 101 reuse

1. **`bow-decision-challenges/src/domain/finance/`** and
   `src/domain/scenario/worlds/*/` — the shock/consequence/revision/defense
   pattern and the deterministic, no-`Math.random()` discipline. Highest-value
   asset in the portfolio; needs grade-band simplification, not a rebuild.
2. **`bow-universe/src/lib/sim.ts`** (`calculateLuxuryTax`, `computeParityIndex`,
   `calculatePayrollForYear`) — correct, typed, portable economics math. Extract
   the pure functions; do not carry the Next.js/Postgres/auth shell.
3. **`BSC-BUILDANALYTIC/track101/index.html`** ("Stat Inventor") — closest
   existing grade-5–6 match to the mission's BUILD→observe→DEFEND bar; fix the
   chart, keep everything else.
4. **`GAUNTLET/GauntletL2/index.html`** (`calculateDemand`, inventory/storage
   constraints, seasonal multipliers) — best pure pricing/inventory reskin
   candidate; strip the `Math.random()` term first.
5. **`GAUNTLET/Boss Sim/index.html`** (coalition/vote/secret-deal structure) —
   strongest NEGOTIATE mechanic available; unusable until the round-3 unlock
   bug is fixed.
6. **`league-in-a-box/src/league-in-a-box-advanced.jsx`** — reuse the *shape*
   ("set the rules, then live in the world you set") only; the levers need a
   shared-scarcity constraint and a full vocabulary rewrite.
7. **`201-M1-L2-Luxury-Tax-` `computeTax()`** — a small, clean, portable
   marginal-bracket function, for whenever progressive taxation enters scope.
8. **`BSC-201-Capstone/index.html`** `evaluateDecisionSuccess()` — reuse the
   context-sensitive scoring shape; do not reuse the branch-specific hardcoded
   dollar deltas.

## Repos safely ignorable for Track 101

**Franchise-Sim** (strict subset of BSC-201-Capstone). **bow-prospect-builder**
(a Google Form, no logic). **scout-model** (disordered, four duplicate copies,
broken CI — the idea survives, the repo doesn't need visiting again).
**Bow-Platform** and **Bow-Sports-Capital-Full-APP** (delivery shells, no
embedded economics; consult `Bow-Sports-Capital-Full-APP/lib/data/mock.ts`
exactly once if a later agent needs to know current lesson/module naming, then
ignore). **CourtIQ** (wrong subject domain by the mission's own sports-economics
mandate — see below for the one thing worth knowing about it anyway).

## Surprising capabilities the written docs would not predict

- **CourtIQ's README says "Pre-MVP. Planning phase. No code yet."** This is
  false and was false as of the last commit (2026-05-21, PR #172, 675 files).
  The actual repo has a Zod-typed scenario template/variant compiler
  (`packages/db/seed/scenarios/templates/_schema.ts`, 767 lines) that generates
  many disguised variants of a decision scenario from one authored template plus
  a "prose bank," a Three.js-based 3D film-room renderer
  (`apps/web/components/scenario3d/`), and a full Next.js/Prisma auth+session
  stack. It is off-domain for Track 101 (basketball IQ, not economics), but the
  **template → variant → prose-bank content-scaling architecture** is the most
  sophisticated authoring pipeline in the entire 14-repo set and is worth a
  five-minute look if BOW ever needs to generate many scenario variants from one
  authored economic situation. Because sim-library's own audit trusted this
  README at face value, its record undersells the repo — a reminder to verify
  docs against commit history/file trees, not just the README, for any repo a
  future agent revisits.
- **`bow-decision-challenges` ships its own adversarial QA process** (43
  independent critique reports, 2,437 receipts, a rule that fixes can't be
  self-graded) inside `gauntlet/` — a process asset, not a code asset, and one
  worth studying regardless of what happens to the product itself.
- **Two "flagship" capstones quietly use `Math.random()`** (BSC-201-Capstone's
  cap-space starting value, line 10437; GauntletL2's demand noise, line 979) in
  a portfolio where the one repo with an explicit design philosophy
  (`bow-decision-challenges`) treats determinism as a hard requirement for
  pedagogical replay/debrief. This is a real, generalizable risk for any code
  lifted from those two files: check for `Math.random()` before reuse.

---

*Repos cloned this session:* `/home/user/braydenokley13-ux/{bow-decision-challenges,
sim-library, Franchise-Sim, league-in-a-box, Bow-Sports-Capital-Full-APP,
bow-universe, Bow-Platform, GAUNTLET, bow-prospect-builder, scout-model, CourtIQ,
BSC-BUILDANALYTIC, BSC-201-Capstone, 201-M1-L2-Luxury-Tax-}`.
