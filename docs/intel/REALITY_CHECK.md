# Repository Reality Check — V5 Claims vs. Actual Code

**Method.** Eight of V5's fifteen CLAIMS REGISTER items were selected for direct
code verification, prioritized by relevance to near-term Track 101 decisions
(the Ramaz Alpha pilot draws directly from `101-M4-L1`, `101-M2-L2`, and the
"Cap Builders" flagship; `bow-finlit` underpins the entire live-class runtime
decision). Verification used the already-cloned repos under
`/home/user/braydenokley13-ux/<repo>` plus two repos neither scout had reached
(`bow-finlit`, cloned this session to `/home/user/bow-finlit`; `BSC-pre-course`,
cloned to `/home/user/braydenokley13-ux/BSC-pre-course`). Where the T101 or
Cross-Cutting scout had already read the exact file/line, that finding is
cited and, where feasible, independently re-checked rather than re-typed. All
line numbers below were re-confirmed by grep/read in this session, not copied
from the prior reports.

---

## Claim 1 — "Draft Room Fit vs BPA" is a clean tradeoff system with no defects

**V5 SAYS** (p.76, KEEP): *"cleanest tradeoff design measured... no single
heuristic survives the scenarios. No defects found."*

**CODE SHOWS.** `101-M4-L3/index.html` defines eight scenarios, each with a
hardcoded `correctIndex`/`secondaryIndex` field (lines 703, 755, 807, 859,
911, 963, 1015, 1067) and a scoring function `isBest = index === s.correctIndex`
(line 1458), gated by a numeric `PASS_THRESHOLD` (line 643) and a streak/combo
scorer with confetti (`launchConfetti`, per the T101 scout's read, not
re-quoted here). The `correctIndex` values across the eight scenarios are
`1,0,1,0,1,0,3,0` — seven of eight "best" answers sit at index 0 or 1 of a
4-option list, a soft but real answer-clustering weakness structurally similar
to (if less severe than) the "click-first-option" exploit V5 itself documents
in ESPN Crisis Manager (p.80-81, not in this repo set, untested this session).
This independently reproduces the T101 scout's finding
(`PORTFOLIO_T101.md:103-109`) that the mechanic is a single-right-answer
scenario quiz with arcade scoring, not an open tradeoff space.

**VERDICT: REFUTED.** V5's own decision-class definition for KEEP is "strong
current core... validate live and repair only evidence-backed issues" (p.38)
— but there is no open decision core here to validate; the file is a fixed-
answer trivia bank wearing a tradeoff-design skin. This is also a case where
two independent readers (T101 scout, this pass) converged on the same
`correctIndex` pattern from the same file without coordinating, which raises
confidence in the refutation.

**IMPLICATION for Track 101.** `101-M4-L3` cannot anchor the "Draft Uncertainty
Lab" flagship's fit-vs-BPA content as a decision mechanic; the scenario
*writing* (team context, tradeoff explanations) is reusable per both scouts,
but the grading shell needs a full rebuild, not a repair. This also means the
"Draft Uncertainty Lab" flagship should lean on `101-M4-L1`'s real probability
engine (Claim 2) as its mechanical spine, using `101-M4-L3`'s scenarios only
as narrative content bolted onto that engine.

---

## Claim 2 — "Why the Draft Isn't a Ranking": mechanic strength and a specific repair claim

**V5 SAYS** (p.79, KEEP): *"the only simulation that proves its own thesis...
replaying one strategy twenty times returns scores from 40 to 93, and process
and outcome are reported separately. The phone layout and keyboard access were
repaired in this pass."*

**CODE SHOWS — mechanic (confirmed strong).** `101-M4-L1/index.html` builds a
real 5-outcome probability distribution per player tier (`getProbs`,
`TIER_BASE`), a genuine weighted-random Monte Carlo draw (`simulateOutcome`),
and displays computed EV/variance (`calcEV`/`calcVariance`) — independently
confirmed by the T101 scout (`PORTFOLIO_T101.md:93-96`) and consistent with
direct reading of the file this session. This is the strongest uncertainty
mechanic in the portfolio and the claim holds.

**CODE SHOWS — the "repaired" sub-claim (mixed).** The file's last merge
commit is literally titled `claude/sim-library-audit-upgrade-5sdd36`
(`git log`), which is consistent with a genuine repair pass having occurred.
Mobile layout: real, working media queries exist at 900px and 560px
breakpoints (lines 56, 183) — the "phone layout" half of the claim holds.
Keyboard access: only three `aria`/`tabindex`-related attributes exist in the
entire 69KB file, and all three belong to a single "Teacher mode" toggle
`<button>` (lines 222-223, 684). The actual decision mechanic — the setup
cards (`selectClass`, `selectRounds`, lines 256-272) and the player-pick cards
that are the core of the simulation (`selectPlayer`, line 783) — are all
plain `<div onclick="...">` elements with no `tabindex`, no `role="button"`,
and no `keydown` handler. A keyboard-only user cannot reach or activate a
single scouting decision in this simulation; they can only toggle Teacher
Mode.

**VERDICT: CONFIRMED (mechanic) / EXAGGERATED (repair claim).** The core
probability/EV engine is exactly as strong as V5 says. But "keyboard access
were repaired in this pass" is not true of the graded decision points — only
of one settings control. This is a concrete instance of the report's own
flagged risk (§1, "claimed repairs... is exactly what a code-level
verification pass should check first") landing on a real defect.

**IMPLICATION for Track 101.** `101-M4-L1` is genuinely Ramaz-Alpha-ready as
an *economics* mechanic (it is directly in the six-lesson pilot list), but
it is not accessibility-ready as claimed. This is a same-day fix (add
`tabindex="0" role="button"` + a `keydown` handler to the two interactive card
classes) — cheap to close, but it must be tracked as an open defect, not
treated as already resolved when scheduling the pilot.

---

## Claim 3 — `bow-finlit` holds "the strongest live-class/session behavior" in the portfolio

**V5 SAYS** (p.66, repo-level, underpinning "KEEP AS RUNTIME"): `bow-finlit`
holds *"the strongest live-class/session behavior"* of any repo in the
account.

**CODE SHOWS.** Neither scout report reached this repo (absent from both
repo lists). It was cloned and tested fresh this session. It is a real,
documented, server-authoritative classroom system: a seven-phase class model
(`lobby → session1_open → session1_surprise_revealed → session2_open →
session3_open → session3_surprise_revealed → completed`) where "the phase is
stored on the server and is the only authority on how far a student may go"
(`docs/OPERATING_MODEL.md`), a join-code + resume-PIN flow with salted-scrypt
storage and cross-device resume, offline write-queueing with debounced
autosave, and an honest "Known limitations" section (single founder login,
best-effort PIN throttling, polling not realtime) that reads like genuine
engineering documentation rather than marketing copy. Concretely tested this
session: `npm install` succeeded in the app and simulator packages;
`npx tsc --noEmit` passed clean in the app; the simulator's `typecheck`
(covering two `tsconfig` targets) passed clean; **`npm test` in the app
package ran 471 tests, 471 passing, 0 failing**, covering server-enforced
decision locks, cross-mission promise persistence ("a Mission 2 promise is
still binding in Mission 3"), and hidden-until-revealed sponsor bonuses. The
README's own claim of "71 app tests + 90 simulator tests" undercounts what
actually runs — the real number is larger, not smaller, than documented.

**VERDICT: CONFIRMED, and understated by V5 relative to what a direct check
shows.** This is the single most rigorously verified repo encountered in this
entire reality-check pass — more thoroughly proven than any Track 101 KEEP
examined above.

**IMPLICATION for Track 101.** Track 101's own attempt at live-session
infrastructure, `101-pre-course` ("Zoom Game"), was explicitly flagged by the
T101 scout as **not executed** — no `npm install`/build attempted, runnability
"needs a pass before reliance" (`PORTFOLIO_T101.md:134`). `bow-finlit` is the
opposite: proven, tested, and running today, with a phase-gating architecture
(server-authoritative "how far a student may go") that is a closer match to
the founder brief's "module continuity" requirement than anything found in
the Track 101 repo set itself. See DECISION PACKET below — this changes the
build-vs-reuse calculus for any Track 101 live-class feature.

---

## Claim 4 — GAUNTLET Boss Sim: "no honest run gets past round 2"

**V5 SAYS** (p.86, REFOUND): *"unplayable: no honest run gets past round 2 of
6 because the continue control is never rendered."*

**CODE SHOWS.** Read directly (`GAUNTLET/Boss Sim/index.html`). Round 2
(`startRound2`, line 1072) presents three alliance offers and a secret deal,
each with an Accept/Decline button pair — but only `acceptAlliance()`
(line 1127) contains a path forward: `setTimeout(() => { startRound3(); },
3000)` at line 1144-1146. `declineAlliance()` (line 1149) and
`declineSecretDeal()` (line 1163) only mutate relationship scores and `alert()`
— neither calls `startRound3()` or renders any continue control. There is no
button anywhere in Round 2's markup labeled "Continue"; advancement is an
undocumented side effect of one specific accept action. A student who declines
all three alliances — a legitimate, even strategically sound, negotiating
choice — is left with no way to proceed. Round 2 through 6 exist in code
(`startRound3` through `startRound6` are all real, implemented functions), so
this is not a "missing content" problem; it is a single missing edge-case
transition.

**VERDICT: CONFIRMED**, with the precise mechanism identified: not a rendering
bug but a missing state transition on the "decline everything" path.

**IMPLICATION for Track 101.** The Cross-Cutting scout rates Boss Sim's
coalition/vote/secret-deal structure as "the strongest available match to the
mission's NEGOTIATE verb" (`PORTFOLIO_CROSS.md:220`) — that assessment holds
on inspection; the fix is small (add a `startRound3()` call, or an explicit
"Proceed without an alliance" button, on the decline paths) relative to the
mechanic's value. Worth a two-line patch before any reuse, not a rebuild.

---

## Claim 5 — Analytics Lab / Stat Inventor: chart failures, and value V5's framing buries

**V5 SAYS** (p.90, MERGE): *"the weighting tool works and the leaderboard
genuinely reorders, but every chart renders empty, the report throws, and
selecting a sport fires 24 errors."*

**CODE SHOWS.** `BSC-BUILDANALYTIC/track101/index.html` ("Stat Inventor," the
grades 5-6 lane) calls `renderChart()` from an Alpine `$watch` on line 93 —
but `renderChart` is **never defined anywhere in the file** (confirmed by
exhaustive grep). Every weight change on step 3 throws a `ReferenceError`,
which is a stronger and more precise finding than "renders empty": the chart
code was never written, not merely broken. Independently, the weighting
mechanic V5 calls functional is real: a star-based weight input, a computed
`diversityScore` (line 306, "0=equal weights, 100=all weight on one stat"),
and a required written-defense textarea with sentence-starter scaffolding
("This supports my claim because…", lines 433-436) — confirmed directly,
matching the Cross-Cutting scout's read.

**VERDICT: CONFIRMED (defect) / EXAGGERATED (severity framing, negatively).**
The chart bug is real and even more clear-cut than V5 describes. But V5's
MERGE classification and its list of failures (chart, report, 24 errors) does
not surface — anywhere in the p.90 entry — that the underlying build-a-
weighted-formula-and-defend-it mechanic is, per independent reading, "the
single closest existing match in the whole portfolio to the mission's target
shape at the correct grade band" (`PORTFOLIO_CROSS.md:298-300`). V5 treats
Track 101's "Stat Inventor" and Track 201's "Analytics Lab" as one entry and
grades them by their shared broken chart component, which undersells the
Track-101-specific asset.

**IMPLICATION for Track 101.** This is a genuine "V5 overlooked" finding, not
just a defect confirmation: `renderChart()` is a same-day delete-or-implement
fix (the mechanic does not need the chart to function — star weighting,
diversity score, and defense field all work without it), and once removed,
this may be the fastest path to a working Value & Signal Room prototype in
the entire legacy set.

---

## Claim 6 — scout-model: duplicated app, broken CI

**V5 SAYS** (p.94, MERGE): *"the same application is duplicated across four
files and the CI workflow file contains HTML instead of YAML."*

**CODE SHOWS.** `scout-model/` contains four copies of the same app
(`index.html`, `INDEX`, `TRUE SIM`, `Bow Simulation.rtf`) and
`.github/workflows/static.yml` opens with `<!DOCTYPE html>` — an actual HTML
document saved with a `.yml` extension, which will fail to parse as a GitHub
Actions workflow. This is now confirmed independently three times: by V5, by
the Cross-Cutting scout's direct read, and again here.

**VERDICT: CONFIRMED**, with high confidence given triple independent
convergence.

**IMPLICATION for Track 101.** Not a Track 101 repo directly, but it is the
cleanest available demonstration that V5's "duplicated/broken" claims, where
made, are reliable — useful calibration when weighing V5's other claims that
could not be independently checked this session.

---

## Claim 7 — repository-identity risk: "BSC-pre-course" is not "101-pre-course"

**Not a V5 numbered claim, but a structural finding this pass surfaced.** V5's
Appendix A (p.86-87) describes a REFOUND finding for "BSC Sports Capital:
Pregame" — pressing Continue after Week 1 "blanks the application,
reproducibly." The T101 scout separately ranks **101-pre-course** ("BOW
Sports Capital Zoom Game") as the 5th-strongest Track 101 asset
(`PORTFOLIO_T101.md:146`), architecturally the most ambitious repo in that
15-repo set.

**CODE SHOWS these are two distinct repositories with materially different
code**, not one repo under two names. `BSC-pre-course` (`package.json` name:
`bsc-pregame`) ships *both* a legacy single-file prototype (`game.js`, 167KB,
with a `continueWeekBtn` handler at line 1003 — the likely site of V5's
"blanks the application" bug) *and* a separate, newer Next.js `app/` directory
with adaptive-catalog and mission-vote API routes. `101-pre-course` is a
different Next.js app entirely — a `diff` of the two repos' file trees shows
non-overlapping API surfaces (`teacher/archive`, `teacher/export.csv` in
`101-pre-course` vs. `catalog/adaptive`, `session/leaderboard`,
`session/rivals` in `BSC-pre-course`) and no shared `game.js`/`game.ts` file.

**VERDICT: CONFIRMED as a real distinction — a name-collision risk, not a
contradiction in either report.** Neither V5 nor either scout explicitly
states "these are different repos," which means a fast reader of V5 could
reasonably (and wrongly) discount `101-pre-course`'s Zoom-game architecture
because of the unrelated `BSC-pre-course` "Pregame" bug report sitting one
table row away in spirit.

**IMPLICATION for Track 101.** Keep the two repos explicitly separated in any
future planning document. `101-pre-course`'s forward-carrying
`TeamGameState`/`MISSIONS` architecture remains an untested-but-uncontaminated
asset; it should be evaluated on its own runnability (never executed by
either scout — still an open task), not folded into `BSC-pre-course`'s known
defect.

---

## Claim 8 — "Small Markets, Big Money" as a control: does any KEEP hold up clean?

**V5 SAYS** (p.77-78, KEEP): *"best writing in the account, over real
branching... Nothing here can be bluffed."*

**CODE SHOWS.** The T101 scout independently verified, at file/line level,
that `101-M2-L2/lesson.js` selects Decision 2's entire option set by Decision
1's outcome — `ROUND2[state.r1]` (line 332) — producing nine distinct,
non-random narrative endings, with README language confirming no
`Math.random()` is used (`README.md:44`). This was re-spot-checked this
session: the `ROUND2` object literal genuinely keys on Round-1 choice IDs, not
a flat option list.

**VERDICT: CONFIRMED**, without qualification. This is an important control
result for the overall reality check: not every V5 KEEP claim collapses under
inspection. The founder brief's "module continuity when prior decisions
create meaningful future consequences" bar is met here as literally as
anywhere in the portfolio.

**IMPLICATION for Track 101.** This can anchor the "League Balance Lab"
flagship as claimed, with genuine confidence rather than provisional trust.
It is also the strongest template available for how `ROUND2[priorChoice]`-
style branching should be authored elsewhere in the Track 101 spine.

---

## Cross-cutting pattern across all eight claims

Of eight claims checked, **one was refuted outright** (Claim 1), **one was
mixed — mechanic real, a specific repair sub-claim false** (Claim 2), **one
was confirmed and actually understated by V5** (Claim 3, bow-finlit), **four
were confirmed as stated** (Claims 4, 5's defect half, 6, 8), and **one
surfaced a name-collision risk neither source flagged** (Claim 7). No claim
checked this session was pure fabrication with zero basis — every V5 finding
pointed at a real, locatable phenomenon in the named file, even when the
severity or framing was off. This matches V5's own self-assessment (the dated
log entries "read as genuine test logs... inherited from the sim-library
repo's own audit history," V5_PORTFOLIO.md §1) better than its disclaimer
("does not claim fresh direct verification," p.39) — the underlying findings
are traceable to real code, but specific claims about *what was already
fixed* ("repaired in this pass") are the least reliable category, exactly
matching the risk V5 itself flagged as most important to check.

---

## DECISION PACKET — What to do with `bow-finlit` given the runnability gap in `101-pre-course`

**DECISION REQUIRED:** Whether Track 101's next live-class-shaped build (the
"module continuity across missions" pattern the founder brief calls for)
should be built on `101-pre-course`'s existing Next.js/team-state
architecture, or should treat `bow-finlit`'s proven phase-gating/resume/
offline system as the reference implementation to port from.

**WHY IT MATTERS:** These are the only two repos in the entire audited
portfolio (29 repos across all three reports) that attempt real live-class
session infrastructure — join codes, persistent per-student/team state,
server-side phase gating. One is untested; one is now proven. Picking wrong
either wastes engineering time rebuilding what already works, or ships an
unverified foundation under a founding-partner pilot.

**EVIDENCE:** `101-pre-course`'s `TeamGameState`/`MISSIONS`/`applyEffects`
architecture was read but never executed by the T101 scout (no `node_modules`,
no build attempted). `bow-finlit`'s `app/` and `tools/balance-simulator/`
packages were installed, typechecked clean, and passed 471/471 tests this
session; its `docs/OPERATING_MODEL.md` documents an explicit,
server-authoritative phase model with named, honest limitations.

**OPTION A:** Continue building on `101-pre-course` — it is Track 101-native,
themed correctly (GM/franchise, not financial-literacy/sports-agency), and
its team-vote/quorum mechanics match "multiplayer as a mechanic" more
directly than `bow-finlit`'s single-student-per-run model. Spend a day running
`npm install`/`next build` to close the runnability gap before deciding
further.

**OPTION B:** Port `bow-finlit`'s phase-gating/resume-PIN/offline-queue
pattern (not its financial-literacy content) into whatever Track 101 build
comes next, treating it as the reference architecture for "how a live BOW
class session should work," since it is the only such system in the
portfolio with passing tests today.

**RECOMMENDATION:** Run Option A's one-day runnability check first — it is
cheap and resolves the actual unknown. If `101-pre-course` builds and its
smoke test (`scripts/run-smoke.sh`, per the T101 scout) passes, prefer it for
Track 101 specifically, since multiplayer team-voting is closer to the
founder's stated bar than `bow-finlit`'s solo-run model. If it does not build
cleanly within a day, treat `bow-finlit`'s architecture (not its content) as
the fallback reference rather than starting Track 101's live-session design
from zero.

**CONFIDENCE:** Medium — the recommendation follows directly from the
evidence gap (one repo tested, one not) rather than from a judgment call
between two known quantities.

**COST OF BEING WRONG:** Low-medium. Both architectures are read-and-portable
patterns, not sunk infrastructure; a wrong initial pick costs a rebuild pass,
not a live-classroom failure, since this decision is about which reference
architecture to study, not what ships to Ramaz first.

---

*Sources: `/home/user/bow-economics-live/docs/intel/V5_PORTFOLIO.md`,
`PORTFOLIO_T101.md`, `PORTFOLIO_CROSS.md`. Fresh evidence gathered this
session from `/home/user/braydenokley13-ux/{101-M4-L3,101-M4-L1,GAUNTLET,
BSC-BUILDANALYTIC,scout-model,BSC-pre-course,101-pre-course,101-M2-L2}` and
`/home/user/bow-finlit` (cloned this session via `add_repo`).*
