# Track 101 Legacy Scout — Portfolio Audit

**Scope:** 15 repos under `github.com/braydenokley13-ux`, cloned shallow (`--depth 1`) to `/home/user/braydenokley13-ux/<repo>`. All file/line citations below point into those local clones (paths given relative to each repo root unless noted). One repo (`101-M4-L2`) is a genuinely empty GitHub repo — zero commits, zero branches — confirmed via `git log --all` and `git branch -a`.

**Method:** For each repo, inspected the file tree, read the core game-logic file(s) directly (not just README/plan docs), ran any test suites that existed, and did a syntax/runnability spot-check. Depth was weighted toward repos with real logic; repos that turned out to be static MCQ quizzes got a lighter pass once the pattern was confirmed.

---

## Module 1

### T101-M1-L1 — "Front Office: Build the Roster"
**What it is:** Single-file (`index.html`, 75KB) framework-free roster-building sim. No build step. `plan.md` documents an 8-step flow: mission briefing → GM style pick → draft from a 16-player pool → live 4-meter dashboard → one mid-game "Owner's Curveball" pressure event → submit → performance report → boardroom memo.
**Stack:** Vanilla JS/HTML/CSS, single file, `localStorage` autosave wrapped in try/catch (`index.html:638-664`).
**Concept:** NBA-style salary cap roster construction; real tradeoff between star power, depth, and chemistry.
**Mechanic (read from source, not README):** `computeMetrics()` (`index.html:775-810`) derives Cash/Wins/Chemistry/Clout from an actual drafted roster — Wins = capped sum of player win-values, Chemistry rewards position coverage + healthy depth and *penalizes* stacking too many stars, Clout scales with star power. `gradeTeam()` (`815-836`) weights the score toward whichever metric the student's chosen "GM Style" (Win Now / Balanced Builder / Smart Spender, `667-677`) makes the owner prioritize (1.6x weight), plus a bonus for meeting the random mid-game curveball objective (`CURVEBALLS`, `729-746`, e.g. a surprise $15M budget cut or a "get Clout to 60" fan-pressure event).
**Genuine decision or decorative?** Genuine — real constrained allocation (16 players, fixed budget by style, position/depth tradeoffs) with an unpredictable mid-course shock. Grading never blocks completion (by design, per `plan.md:56`), so it teaches consequence without a hard fail gate.
**Quality/runnability:** Inline-script syntax verified compilable via Node `Function()` check. `plan.md` claims a 14-test self-test harness (`index.html?selftest=1`) — not independently re-run here, but the code structure (clamped state, escaped HTML, empty/over-budget edge cases handled) is credible.
**Reusable assets:** `computeMetrics`/`gradeTeam` scoring formulas, `CURVEBALLS` shock-event pattern, `SIMULATION`/`buildCompletionResult()` portable-result manifest (`plan.md:71-75`) — a lightweight schema other lessons should probably standardize on.
**Last commit:** 2026-06-15 (most recently touched cluster, "Front Office" family).

### T101-M1-L2 — "Trade Deadline War Room"
**What it is:** The most professionally engineered repo in the portfolio — a proper `src/` app: `simulation.js` (pure logic, 372 lines, isomorphic Node/browser via UMD wrapper), `data.js` (team content), `app.js` (a small hand-rolled `h()` hyperscript view layer, 97KB, 12 screens), `tests/simulation.test.js` (28 unit tests), `QA-CHECKLIST.md`, and a full `styles/tokens.css` design-token file ("ported from the bound bow-sports-capital-design-system handoff bundle").
**Stack:** Vanilla JS, UMD modules, Node-testable, zero dependencies, zero build step (`file://`-safe per `QA-CHECKLIST.md:6-11`).
**Concept:** NBA luxury tax / salary cap at the trade deadline.
**Mechanic:** Two-round decision chain — pick a Round-1 trade (Star Chaser / Balanced Builder / Future Planner / Safe Operator, `simulation.js:118-136`) → an ownership "pressure moment" fires → pick a Round-2 closing move. `projectChain()` (`92-98`) is a deterministic, side-effect-free metric pipeline (`start → afterTrade → afterPressure → afterRound2`), each step clamped 0-100. `isInLuxuryTax()` / `taxNote()` (`100-102`, `170-183`) implement a real luxury-tax threshold (Cap Space < 40) with four distinct narrative branches for crossing/avoiding it. `computeScore()` (`144-156`) double-weights whatever metric ownership pressured on, and gives a small bonus if a team paid the tax *and* has enough Wins to justify it (`154`) — i.e., the sim explicitly teaches "the tax isn't always wrong, it depends on payoff."
**Genuine decision or decorative?** Genuine — deltas are fixed per option (no random noise), but the two-round structure means Round-2 is a real response to the state Round-1 created, and the luxury-tax line creates a hard, visible threshold effect.
**Quality/runnability:** **Ran the test suite live — `node tests/simulation.test.js` → 28/28 tests passed**, including edge cases (empty input never throws, absurd memo-text input truncated, tax-line-crossing covered in all four directions). This is the only repo in the portfolio with an actual verified-passing automated test suite.
**Reusable assets:** `simulation.js` as a whole is a template for how every future lesson's logic layer should be structured (pure, tested, isomorphic). `styles/tokens.css` is a real design system (Franchise Blue `#3157ff`, Signal Orange `#ff5a36`, Barlow Condensed/Newsreader/Inter/IBM Plex Mono type voices) already reused by other repos (see T101-M2-L1 below). The `h()` view helper in `app.js:46-64` is a reusable ~20-line React-lite.
**Last commit:** 2026-06-16.

---

## Module 2

### T101-M2-L1 — "Front Office: The Homestand"
**What it is:** `index.html` shell + `mlb-redesign-game/{css,js}` — a 3-round branching case file (456-line `front-office.js`).
**Stack:** Vanilla JS, explicitly reuses T101-M1-L2's design tokens (`index.html:12-13`, "reuse Bow design tokens + base components").
**Concept:** Ticket pricing, sponsorship, and franchise strategy (fan experience vs. revenue vs. trust) — not salary-cap; more general team-business economics.
**Mechanic:** Three fixed rounds of 3 options each (`ROUNDS`, `front-office.js:38-201`) with hand-authored deltas across four metrics (fan, budget, revenue, trust) and rich "upside/risk/consequence" copy per option (e.g., lowering family ticket prices: `fan:+18, revenue:-12, trust:+10, budget:-4`, with an explicit pressure/takeaway note). Round 3 asks the student to pick and defend an overall strategy (Fan-First / Revenue-First / Balanced) that itself carries deltas.
**Genuine decision or decorative?** Real tradeoff content (price elasticity, sponsorship-vs-trust, short vs. long payoff), but it's a fixed decision tree — 3×3×3 = 27 authored paths, not open allocation. Good writing, no randomness, no test suite.
**Quality/runnability:** Small, self-contained, looks complete; no automated tests.
**Reusable assets:** The `ROUND1/2/3` option-authoring pattern (upside/risk/helps/weakens/consequence/pressure/takeaway fields) is a clean content template other lessons could adopt directly.
**Last commit:** 2026-06-22.

### 101-M2-L2 — "Small Markets, Big Money" (Revenue Sharing)
**What it is:** `index.html` + `css/style.css` + `js/lesson.js` (415 lines). Explicitly redesigned per its own README from "a slider dashboard into a focused front-office case" (`README.md:15-17`).
**Stack:** Vanilla JS, no framework, Oswald/Inter "Bow/Ringer-inspired" editorial design.
**Concept:** Revenue sharing and competitive balance between big- and small-market franchises.
**Mechanic:** Two connected decisions. Decision 1 (Light/Balanced/Heavy revenue sharing) applies deltas (`ROUND1`, `lesson.js:27-82`) and generates a **specific consequence that becomes the premise of Decision 2** (`CONSEQUENCE1`, `82-107`; e.g., Light Sharing → superteams form → Decision 2 asks how to save the product). `ROUND2` is keyed by which Round-1 choice was made (`107-219`, an object of option-sets per R1 id), producing 3×3 = 9 distinct narrative endings (`CONSEQUENCE2`, `219-239`), each tracked against four metrics (Competitive Balance, Owner Backing, Small-Market Trust, League Revenue).
**Genuine decision or decorative?** This is the strongest **path-dependence** implementation found in the portfolio — Decision 2's option set is *literally selected by* Decision 1's outcome (`ROUND2[state.r1]`, `lesson.js:332`), not just flavor text. Directly matches the founder brief's "module continuity when prior decisions create meaningful future consequences."
**Quality/runnability:** Clean, deterministic (README: "No spreadsheets, no random outcomes... the same path always tells the same story," `README.md:44`), well-documented; no automated tests.
**Reusable assets:** The `ROUND2[priorChoiceId]` branching-by-prior-decision pattern is the clearest reusable architecture for cross-lesson/cross-module continuity in the whole portfolio.
**Last commit:** 2026-06-22.

---

## Module 3

### 101-M3-L1 — "Moneyball Draft Challenge"
**What it is:** Single `index.html` (69KB), six progressive levels (`LEVELS`, `index.html:534`) teaching sabermetric efficiency.
**Stack:** Vanilla JS.
**Concept:** Undervalued-stats drafting (OBP → OPS → WAR → composite efficiency), real budget constraint per level.
**Mechanic:** Real budget arithmetic (`getSpent`, `renderBudget`, `index.html:848-875`) constrains which players a student can afford; `levelEffScore()` (`945-964`) computes real sabermetric formulas (e.g., "Total OBP ÷ $ Spent × 1000"). However, `checkLevel()` grades against a **single pre-defined optimal roster** per level (`LEVEL_SUCCESS`/`LEVEL_ERROR`, `966-979`) — i.e., there is one "correct" answer the game is checking for, not an open tradeoff space.
**Genuine decision or decorative?** Hybrid: real constrained-optimization math, but structured as a puzzle-with-a-right-answer rather than a judgment call with defensible alternatives.
**Quality/runnability:** Self-contained, includes a companion PDF export of the original spreadsheet version. No test suite.
**Reusable assets:** The OBP/OPS/WAR efficiency formulas and the progressive-difficulty level ladder.
**Last commit:** 2026-02-23.

### 101-M3-L2 — "Stats vs. Scouts"
**What it is:** Single `index.html` (36KB). Two "stages" of real-NBA-player comparisons.
**Mechanic:** Each stage card has one hardcoded `answer` field (`index.html:452, 472, 492, 538`) checked against student pick; score shown as "X / 4," confetti fires on completion (`launchConfetti()`, `index.html:790`), countdown timer present.
**Genuine decision or decorative?** **Decorative — this is the "quiz with sports nouns" pattern the brief explicitly forbids.** Well-written real-player stat cards and a nice glossary tooltip system (`glossWrap`, `426-430`), but mechanically it is a fixed-answer trivia quiz with a timer and confetti, not a consequential decision.
**Quality/runnability:** Complete and polished visually; no tests; no real state beyond quiz progress.
**Reusable assets:** The stat-glossary tooltip component and the real-player stat-card layout are reusable UI, not the game mechanic.
**Last commit:** 2026-02-01.

### 101-M3-L3 — "Process vs. Results Lab" (Football Edition)
**What it is:** Single `index.html` (49KB). 10 authored football scenarios (`ALL_PLAYS`, `index.html:1040-1111`), each with one correct 2×2 classification (Good/Bad Process × Good/Bad Result).
**Mechanic:** Pure classification quiz — `selectAnswer()` checks against a hardcoded `answer` string per scenario; timer, hints, session-resume via `localStorage`, results breakdown by category.
**Genuine decision or decorative?** Decorative as a decision, but the *underlying concept* (separate the quality of a decision from the luck of its outcome) is genuinely valuable decision-theory content and well-written (e.g., the OT coin-flip scenario cites real analytics consensus, `index.html:1105-1109`). It teaches the concept through classification rather than through consequence.
**Quality/runnability:** Complete, has session persistence and a stats summary; no automated tests.
**Reusable assets:** The process/outcome scenario-writing pattern is worth keeping as a discussion-prompt bank even if the classification-quiz shell is dropped.
**Last commit:** 2026-02-23.

---

## Module 4

### 101-M4-L1 — "Why the Draft Isn't a Ranking"
**What it is:** Single `index.html` (69KB), NFL-themed 3-round draft sim. Branch name on last merge — `claude/sim-library-audit-upgrade` — suggests this repo already went through a prior audit/upgrade pass (2026-08-16, the most recent commit in the whole portfolio).
**Stack:** Vanilla JS.
**Concept:** Draft risk/uncertainty — a prospect is a probability distribution over outcomes, not a guaranteed grade.
**Mechanic:** A genuine probability engine. `getProbs()` (`index.html:561-577`) builds a 5-outcome distribution (All-Pro/Pro Bowl/Solid Starter/Role Player/Bust) per player tier (A-D, `TIER_BASE:556`), modified by traits (Boom/Bust widens the tails, Injury Risk shifts mass toward Bust, High Floor/Pro-Ready/Raw shift the distribution predictably). `investCP()` lets a student spend scarce "coaching points" to shift a Raw player's odds (`568-570`) — a real scarce-resource allocation decision. `simulateOutcome()` (`589-593`) is an actual weighted-random draw (Monte Carlo, not scripted), and `calcEV()`/`calcVariance()` (`594-602`) compute real expected value and standard deviation from the distribution and display them to the student.
**Genuine decision or decorative?** Genuine, and the strongest **uncertainty/risk** mechanic in the portfolio — outcomes are randomized against real probabilities the student can reason about pre-pick, and the EV/variance math is actually shown, not just narrated.
**Quality/runnability:** Syntax-verified compilable. Self-contained single file; no automated tests found, but the logic is dense and coherent enough to read as production-grade.
**Reusable assets:** `getProbs`/`simulateOutcome`/`calcEV`/`calcVariance` is a directly reusable "risk asset" probability-and-payoff engine any future draft/scouting/investment lesson could import wholesale.
**Last commit:** 2026-08-16 (most recent in the portfolio).

### 101-M4-L2 — **EMPTY REPOSITORY**
**What it is:** Nothing. `git clone` succeeded with "warning: you appear to have cloned an empty repository"; `git log --all` and `git branch -a` both return nothing. No commits ever pushed.
**Implication:** Whatever Module 4 / Lesson 2 was supposed to be, it does not exist anywhere in this GitHub org. This is a hard gap in the Module 4 spine, not a low-quality asset — there is literally nothing to triage.

### 101-M4-L3 — "Draft Room Challenge — Fit vs BPA"
**What it is:** Single `index.html` (71KB) + a companion PowerPoint (`101M4L3 – Draft Strategy Activity (Fit vs BPA).pptx`, 314KB — likely the pre-digital-conversion source). Difficulty tiers (`PASS_THRESHOLD`, `index.html:643`), avatars, combo/streak scoring, particle/confetti effects (`createParticles`, `launchConfetti`, `1107-1128`).
**Concept:** Best-Player-Available vs. Fit-for-need drafting philosophy across NBA/NFL/etc. scenarios (`getScenarios()`, `654-1082`).
**Mechanic:** Each scenario is well-written (team timeline, strengths/weaknesses, 4 prospects with tags) but resolves to a hardcoded `correctIndex`/`secondaryIndex` (`index.html:703-706`) with points/streak scoring — arcade trivia, not an open decision.
**Genuine decision or decorative?** Decorative mechanically (single right answer, arcade scoring layer), but the scenario-writing quality (team context, timeline reasoning, explicit tradeoffs in the explanation text) is genuinely good and reusable as content.
**Quality/runnability:** Complete, polished, has a PPTX predecessor for reference. No tests.
**Last commit:** 2026-02-02.

---

## The four "-ECON" repos — a structural finding

All four `101-M*-ECON` repos turned out to be **not sports-themed at all**, which conflicts directly with the founder-fixed "sports-only" constraint:

- **101-M1-ECON** — "MEGA CITY TYCOON" (`index.html:1062`): a city-building game (roads/schools/water systems) teaching marginal cost, option value, and opportunity cost via `Chapter 1→2→3` cross-chapter memory (`mem.builtRoads`, `mem.ch1Leftover`, `index.html:1914-1916, 2003-2004`) — genuine path dependence, but themed as municipal government, not sports.
- **101-M2-ECON** — "DeliverEmpire" (`index.html:6`): a food-delivery-startup tycoon game with an embedded MCQ layer (`openQuiz`, `loadQuizQ`, `index.html:1940-1973`).
- **101-M3-ECON** — "DELIVERY EMPIRE | Economic Strategy Game" (`index.html:6, 469`): same food-delivery premise, paired with a genuinely strong `MCQ_BANK` (`index.html:733-760`) that correctly teaches Expected Value, Opportunity Cost, Signal-vs-Noise, and Comparative Advantage with real worked-example math in the explanations.
- **101-M4-ECON** — **no HTML app exists at all.** The repo contains only an Apps Script grading backend (`apps script`, 2606 lines) and a source spreadsheet (`Module 4 Econ Final - Track 101-2.xlsx`, sheets: START/SIM/SYSTEM_LOG/MODEL/SHOCK/RESULTS/MCQ_PRE/ANSWER_KEY/MCQ_MID/MCQ_POST). Students who complete this "module" never see a browser page — they interact with a Google Sheet.

**All four `apps script` files** (`101-M1-ECON` 391 lines, `M2` 1145, `M3` 1675, `M4` 2606) are Google Apps Script grading/credentialing backends, not simulations: they check MCQ answers against an answer key stored in a `SYSTEM_LOG` sheet, email a branded HTML result to the student, lock the spreadsheet on completion, and issue a tiered claim code (`Gold/Silver/Bronze`, `101-M1-ECON/apps script:266-293`). This is quiz-grading infrastructure layered under whatever simulation content sits in the accompanying `.xlsx`/`index.html` — worth keeping as a credential/claim-code pattern, not as economics content.

The `.xlsx` files across the whole portfolio (found in 9 of 15 repos) are consistently the **pre-HTML source version** of each lesson — e.g. `101-M2-L2`'s "Parity Builder" workbook has an `Intro & Instructions` + `Parity Engine` sheet pair that was clearly the spreadsheet prototype later rebuilt as `lesson.js`. They have no code-reuse value but are useful provenance/design-intent artifacts.

---

## 101-pre-course — "BOW Sports Capital Zoom Game"
**What it is:** The only full-stack repo in the portfolio — a real Next.js 14 / React 18 / TypeScript app (`package.json`) intended for live-Zoom team play: teacher creates a session, students join in teams via a code, play synchronized "missions," vote as a team, and unlock concept badges.
**Stack:** Next.js app router (`app/page.tsx`, `app/layout.tsx`), `lib/game.ts` (1000+ lines of server-side session/team/vote logic), `lib/store.ts`, file-based JSON persistence (`data/store.json`, swappable via `BOW_STORE_MODE`/`BOW_STORE_FILE` env vars per `README.md:61-64`), `scripts/smoke.mjs` + `scripts/run-smoke.sh` (an API-level smoke test: create session → join → vote → tie-break → concept gate → teacher feed).
**Concept:** Cap/contracts, "money in motion" (league as a business), analytics, draft strategy — i.e., it's a survey course, not one lesson.
**Mechanic:** `MISSIONS` (`lib/constants.ts:25-90+`) are real budget-allocation decisions with persistent effects on a shared `TeamGameState` (`budget/cash/fans/wins/rosterSlots/draftPicks`, `constants.ts:6-13`) that carries forward mission-to-mission — e.g. "Cap Crunch" (sign two balanced players vs. one star, `26-48`) feeds into "Contract Choice" (long vs. short deal, `50-71`) which feeds into "Revenue Mix" (`73+`). Team votes must reach quorum/tie-break (`buildVoteStatus`, `game.ts:112-136`); `applyEffects()` (`136-148`) mutates shared team state; concept "gates" require passing a check before the team can proceed (`conceptPassCount`, `169`); teacher dashboard exports CSV/reteach-report (`README.md:41-43`).
**Genuine decision or decorative?** Genuine and the most structurally ambitious: real forward-carrying state, real team consensus mechanics (multiplayer as mechanic, matching the founder brief), teacher-facing analytics.
**Quality/runnability:** **Not executed in this pass** — no `node_modules` present, and a full `npm install`/`next build` was out of scope for a triage pass; `require()`-testing `.ts` directly fails on path aliases as expected (needs the Next/TS toolchain, not a defect). Structurally it is the most complete app (has its own smoke-test script, typecheck script, teacher/student flow docs). Flagged as **needs a runnability pass before reliance**, not judged working or broken.
**Reusable assets:** The `TeamGameState`/`MISSIONS`/`applyEffects` forward-carrying-decision architecture is the closest existing analog to true module continuity across a multi-mission arc, and the teacher dashboard (CSV export, reteach report, live progress) is infrastructure no other repo has at all.
**Last commit:** 2026-02-25.

---

## Ranked: Top 5 strongest Track 101 legacy assets

1. **T101-M1-L2 (Trade Deadline War Room)** — only repo with a real, passing (28/28) automated test suite; clean pure-logic/view separation; the luxury-tax threshold mechanic is genuinely taught, not just narrated.
2. **101-M4-L1 (Why the Draft Isn't a Ranking)** — the only genuine uncertainty/risk engine: real probability distributions, Monte Carlo outcome draws, EV/variance shown to the student; most recently touched repo in the portfolio.
3. **101-M2-L2 (Small Markets, Big Money)** — the clearest true path-dependence implementation (Decision 2's options are selected by Decision 1's outcome), directly matching the founder brief's module-continuity goal.
4. **T101-M1-L1 (Front Office: Build the Roster)** — solid constrained-allocation mechanic with a mid-game shock event and portable-result manifest; good template for "grading never blocks completion."
5. **101-pre-course (Zoom Game)** — the only full-stack app with persistent cross-mission state and real team-consensus mechanics; unverified runnability keeps it from ranking higher, but architecturally it's the most ambitious asset in the portfolio.

## Ranked: Top 5 weakest / discardable

1. **101-M4-L2** — empty repository. Zero content exists; this is a build-from-scratch gap, not a triage candidate.
2. **101-M4-ECON** — no student-facing app at all, just a Google Sheets grading backend; off-theme even in spreadsheet form.
3. **101-M3-L2 (Stats vs. Scouts)** — textbook "quiz with sports nouns": fixed-answer trivia with a timer and confetti, the exact anti-pattern the founder brief prohibits.
4. **101-M4-L3 (Fit vs BPA)** — well-written scenarios wrapped in arcade trivia scoring (streaks/combos/confetti) with a single correct answer per round; decorative mechanic despite good content.
5. **101-M1/M2/M3-ECON (the tycoon trio)** — off-theme (city-building / food-delivery, not sports) in direct conflict with the sports-only constraint; strong economics content trapped in the wrong wrapper. Grouped as one discard decision below since they share the same defect.
