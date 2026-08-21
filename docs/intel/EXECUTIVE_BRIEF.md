# Track 101 Executive Decision Brief

Synthesized from all nine intelligence reports plus REALITY_CHECK.md in `docs/intel/`. Precedence used: founder mandate > curriculum PDF > V5 > legacy code, except where working code empirically overrides written claims about what works (per REALITY_CHECK).

## 1. Track 101 Current State

**Curriculum.** The only curriculum source (`BOW Sports Capital Podcast-4.pdf`) is not a clean deliverable — it is a 315-page raw ChatGPT brainstorming export (literally ends with the ChatGPT UI footer) containing **three mutually contradictory Track 101 module/lesson tables** (a 4×4 mastersheet pp.12-13; a differently-titled 4×3 table pp.245-253; a final planning list missing Module 4 entirely, p.311), plus a founder TODO list confirming the material is unfinished [CURRICULUM_CRITIQUE, CURRICULUM_RECONSTRUCTION]. The most complete produced version is a 4-module × 3-lesson scripted set (pp.121-260/183-241): M1 Salary Cap, M2 Money in Motion/Revenue, M3 Player Evaluation/Analytics, M4 Draft. Grade 5-6 is never named in the document; vocabulary and math (multi-bracket luxury tax, BATNA, "Efficiency Frontier" leaking from Track 301) frequently sit above the target age [CURRICULUM_CRITIQUE]. Several lessons have no real activity (M1L3 explicitly "no activity here on purpose," p.189; M2L3 grants XP for listening only) [CURRICULUM_CRITIQUE]. Module 4 was planned as "Negotiation Basics" but produced entirely as draft content with zero negotiation and no reconciliation note [CURRICULUM_RECONSTRUCTION #6]. No cross-module continuity and no Track 101 capstone exist anywhere in the source.

**Software.** Across ~29 audited repos, Track 101 has 15 dedicated lesson repos plus several portfolio-wide flagship/infrastructure repos. Quality is bimodal: genuine constrained-decision mechanics exist (roster building, trade-deadline luxury tax, revenue-sharing path dependence, draft-uncertainty Monte Carlo) sitting beside outright "quiz with sports nouns" anti-patterns (Stats vs. Scouts, Fit vs. BPA, Process vs. Results Lab) and one completely empty repo (`101-M4-L2`) [PORTFOLIO_T101]. Four `-ECON` repos hold strong economics content but are off-theme (city-building, food-delivery), violating sports-only [PORTFOLIO_T101]. Portfolio-wide, 73 of 76 catalogued simulations have never run with a real student [V5_PORTFOLIO/PORTFOLIO_CROSS]. Track 101's own live-session attempt (`101-pre-course`) has never been build-tested by anyone; the most rigorously proven live-classroom architecture in the entire account (`bow-finlit`, 471/471 tests passing) is not Track 101-themed at all [REALITY_CHECK].

## 2. Strongest Prior Insights (V5)

- **Core thesis holds up**: "turn the classroom into a legible economic system... students generate the data the teacher explains" directly matches the founder mandate [V5_PRODUCT p.16].
- **Precise mechanic vocabulary worth adopting verbatim**: control verbs (PAUSE≠FREEZE≠REVEAL≠SHOCK≠RERUN≠END) and room-state machine (LOBBY→...→COMPLETE) [V5_ARCHITECTURE p.31, p.116].
- **Control-plane/runtime split** (BOW-WEBSITE owns identity/entitlements; this repo owns interaction state/economic engine) costs nothing now and preserves future flexibility [V5_ARCHITECTURE p.65-66] — independently reinforced by REALITY_CHECK confirming a real runtime candidate (`bow-finlit`) actually works.
- **Evidence-truth vocabulary** (Discovered→...→Evidence-bearing, each with explicit "may/may not claim" boundaries) is exactly the discipline needed — validated as necessary because REALITY_CHECK found V5's own "repaired in this pass" claims are its least reliable category [V5_ARCHITECTURE p.108; REALITY_CHECK].
- **Doctrine matches founder mandate**: multiplayer-as-mechanism not goal, no simulation-count goal, no grading theater, data describes/teacher explains [V5_ARCHITECTURE pp.11,14-15,33,36].
- **Small Markets, Big Money called "best writing... nothing can be bluffed"** — REALITY_CHECK independently confirmed this KEEP holds up clean end-to-end (`ROUND2[state.r1]`), the one control case proving not every V5 verdict collapses under inspection.

## 3. Questions That Must Be Reopened

- **Which curriculum structure is canonical.** Two curriculum agents reached opposite recommendations from the same source: CURRICULUM_CRITIQUE says discard the drafts entirely and rebuild fresh; CURRICULUM_PRODUCT_TRANSLATION says salvage the 4×3 skeleton with mandatory re-aging. Neither is self-evidently right — this is a real, unreconciled disagreement, not noise.
- **Module 4's identity** (Negotiation Basics vs. The Draft) — planned as one, shipped as the other, never reconciled [CURRICULUM_RECONSTRUCTION].
- **V5's KEEP classifications are not ground truth.** REALITY_CHECK code-checked 8 of V5's 15 highest-stakes claims: 1 outright refuted (`101-M4-L3` "no defects found" is actually a hardcoded-answer trivia bank), 1 had a false repair sub-claim (`101-M4-L1`'s "keyboard access repaired" is false for the actual decision mechanic). Any V5 verdict must be re-verified against code before it drives a Module 1 build decision.
- **V5's predetermined counts** ("eight flagships," "six Ramaz Alpha lessons," "prefer twelve simulations," a fixed 70/20/10 motif split) directly contradict the founder's "no predetermined simulation count" mandate and must not be inherited [V5_PROSECUTION].
- **V5's commerce build order** schedules a full subscription/entitlement/sponsorship data model into Day 1-15 of build, directly contradicting "no commerce/enterprise" [V5_PROSECUTION pp.52-74].
- **The gamification/"BOW ID" XP-and-levels layer** is the most fully-designed system in the curriculum source — explicit tension with "no leaderboard theater" that was never resolved [CURRICULUM_RECONSTRUCTION #12].

## 4. Best Existing Assets (ranked, with repo paths)

1. `braydenokley13-ux/bow-decision-challenges` (`src/domain/finance/formulas.ts`, `src/domain/scenario/worlds/*`) — deterministic shock/consequence/revision/written-defense pattern; typecheck confirmed clean this session. Highest-value pattern; needs grade-5-6 simplification.
2. `braydenokley13-ux/T101-M1-L2` "Trade Deadline War Room" (`simulation.js`) — only Track 101 repo with a real, live-run passing test suite (28/28); clean logic/view separation; genuine luxury-tax threshold teaching.
3. `braydenokley13-ux/101-M2-L2` "Small Markets, Big Money" (`lesson.js:332`, `ROUND2[state.r1]`) — REALITY_CHECK-confirmed clean path-dependence; best module-continuity template in the portfolio.
4. `braydenokley13-ux/101-M4-L1` "Why the Draft Isn't a Ranking" (`getProbs`/`simulateOutcome`/`calcEV`/`calcVariance`) — confirmed real Monte Carlo probability/EV engine; already in the Ramaz Alpha pilot list; **keyboard accessibility is not actually fixed** despite the claim — 1-day repair needed before use.
5. `braydenokley13-ux/bow-universe` (`src/lib/sim.ts`: `calculateLuxuryTax`, `computeParityIndex`) — most rigorous portable economics math in the portfolio; extract the pure functions, skip the Next.js/Postgres shell.
6. `braydenokley13-ux/BSC-BUILDANALYTIC/track101/index.html` "Stat Inventor" — closest existing match to the grade-5-6 BUILD→observe→DEFEND bar; the broken `renderChart()` is confirmed a same-day delete-fix, not a rebuild — likely the fastest path to a working Module 1-adjacent flagship.
7. `braydenokley13-ux/GAUNTLET/Boss Sim` — strongest NEGOTIATE mechanic (coalition/vote/secret-deal); REALITY_CHECK identified the exact 2-line fix for its round-3 softlock (missing `startRound3()` call on the decline path).
8. `braydenokley13-ux/T101-M1-L1` "Front Office: Build the Roster" — solid constrained-allocation + mid-game shock; "grading never blocks completion" is a pattern worth keeping.
9. `bow-finlit` — not Track 101-themed, but the only proven live-class runtime (471/471 tests, phase-gating, resume-PIN, offline queue); reuse as reference architecture, not content.

**Discard/avoid:** `101-M4-L3` Fit vs BPA (V5's KEEP refuted — fixed-answer trivia); `101-M3-L2` Stats vs Scouts (textbook quiz-with-sports-nouns); `101-M4-L2` (empty repo, hard gap); the three `-ECON` tycoon repos (off-theme).

## 5. Major Conflicts

1. **Commerce**: founder mandate "no commerce" vs. V5's Day 1-15 subscription/entitlement build order [V5_PROSECUTION pp.52-74, 72].
2. **Simulation counts**: founder mandate "no predetermined count" vs. V5's "eight flagships"/"twelve simulations"/70-20-10 split [V5_PROSECUTION pp.40,47,69].
3. **Sports-only**: founder mandate vs. V5's roadmap allocation to a creator-economy second motif and co-equal Financial Literacy pillar [V5_PROSECUTION p.69], and concretely in code — four `-ECON` repos are non-sports tycoon games sitting in Track 101 module slots [PORTFOLIO_T101].
4. **V5 verdict vs. actual code**: V5 rates `101-M4-L3` "cleanest tradeoff design... no defects found" (KEEP, p.76); direct code read shows a hardcoded `correctIndex` answer key — a fixed-answer quiz [V5_PORTFOLIO vs. REALITY_CHECK].
5. **Two curriculum agents disagree** on salvage strategy: discard-and-rebuild [CURRICULUM_CRITIQUE] vs. salvage-skeleton-with-re-aging [CURRICULUM_PRODUCT_TRANSLATION].
6. **Module continuity**: V5's own lesson blueprint has no designed cross-lesson consequence mechanism [V5_PROSECUTION], yet the code portfolio already contains a better example than V5 itself designed (`101-M2-L2`'s `ROUND2[state.r1]`) — code is ahead of the written plan here.
7. **Grade band**: V5 states Track 101 = grades ~5-6 [V5_PRODUCT p.18] but also states company-wide "grades 5-8" [V5_PRODUCT pp.4,51] — unresolved even within V5.

## 6. Recommended Decisions

1. **Keep the four-module spine as founder-fixed; treat all existing lesson content as candidate material, not canon** — rewrite objectives from the product bar, reuse only the specific mechanics/scenarios in Section 4. This splits the two curriculum agents' conflicting recommendations by keeping shape, discarding writing/mechanics. *Confidence: High. Cost of being wrong: Low (reversible).*
2. **Strike V5 Parts IV-V (commerce/monetization/platform build order) and its predetermined counts from current scope**; keep only V5's architecture vocabulary and state machine as guidance. *Confidence: High — directly matches explicit founder mandate. Cost: Low if struck now; High if silently inherited.*
3. **Re-scope any near-term pilot/gauntlet to Track 101 (grades 5-6) only** — do not schedule Track 201 lessons. *Confidence: High. Cost of ignoring: Medium (burns scarce founder-teaching hours outside mandate).*
4. **Re-verify every code asset's V5 classification before scheduling it for the Module 1 gauntlet** — one of eight spot-checked V5 KEEPs was outright refuted by code. *Confidence: High (empirically demonstrated). Cost of skipping: Medium-high — risks shipping a disguised trivia quiz as an open decision.*
5. **Anchor the Module 1 gauntlet on `bow-decision-challenges`' shock/defense pattern plus `T101-M1-L1`/`T101-M1-L2`'s cap-allocation mechanics** — both code-verified working and grade-adjacent. *Confidence: Medium-High. Cost: Low (read-and-adapt, not sunk infrastructure).*
6. **Spend one day running `101-pre-course`'s build/smoke test before choosing live-session architecture; fall back to porting `bow-finlit`'s proven phase-gating pattern only if it fails** [escalated packet, REALITY_CHECK]. *Confidence: Medium. Cost: Low-medium.*
7. **Do not require cross-module continuity inside the Module 1 gauntlet** — founder marked it "desirable when meaningful," no current asset spans multiple modules, and forcing it now risks scope creep before Module 1 itself is proven. *Confidence: Medium. Cost of being wrong: Low (addable later).*

## 7. Founder-Level Questions

1. **Module 4's identity**: was it always meant to be a draft lesson, a negotiation lesson, or both (possibly via a split)? Evidence shows both existed in planning with no reconciliation — this is a naming/vision call the product bar alone cannot settle.
2. **The XP/levels/"BOW ID" gamification layer**: build it into the relaunch, or exclude it as leaderboard theater? It's the most fully-designed system in the source material, genuinely in tension with the anti-leaderboard mandate, but not explicitly forbidden — a founder taste call, not an evidence call.
