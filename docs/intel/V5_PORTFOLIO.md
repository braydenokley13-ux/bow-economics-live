# V5 Simulation Portfolio Extraction

Source: `/home/user/bow-economics-live/BOW_Model_V5_Final.pdf` (120 pages, read in full). All citations are page numbers in this PDF. Cover page (p.1) labels the document a "**Source-aware reconstruction; not a transcript of the supplied materials**" — i.e. V5 is itself an LLM-authored synthesis of BOW Model V4, the Economics curriculum PDF, the Decision Challenges package, and the Simulation Library, not a literal transcript of any one source (p.2, p.110). This matters for everything below: V5's per-experience "recorded findings" are V5's *summary* of what the Simulation Library repo recorded, not independently re-run tests by whoever produced this PDF.

## 1. What kind of evidence this document contains

Two explicit caveats govern the whole audit:

- **p.39, "VALIDATION LIMITATION"**: "Direct new browser playtesting from this workspace was blocked by an administrator-enforced browser policy. V5 therefore uses the Simulation Library's recorded end-to-end playtests and source metadata and does not claim fresh direct verification. Browser revalidation remains a promotion gate."
- **p.111, "Evidence limits"**: "The Simulation Library's recorded adult browser tests are valuable technical and design evidence; they are not student learning or facilitator-transfer evidence." External products (MobLab, oTree, EconPort) are cited only as design benchmarks, not copied.

**Contradiction worth flagging for the verification agent**: despite p.39's claim that browser playtesting was blocked, individual audit entries describe specific dated browser interactions — e.g. p.106 (Entrepreneurship Lab): "all four strategy presets were clicked in a browser on 2026-08-16 and changed nothing on the page"; p.103 (Startup Tycoon): "GitHub Pages returned 404 ... on 2026-08-16 ... It answered 200 on 2026-08-14, so this is a regression." These dated, specific interactions read as genuine test logs (likely inherited from the sim-library repo's own audit history, imported into V5's narrative) rather than something V5's author performed live. The later verification agent should check whether `sim-library` (github.com/braydenokley13-ux/sim-library) actually contains this playtest/health-check history, since that is the only claimed evidentiary basis for the whole audit.

Also flagged as unverified by V5 itself: several KEEP/REFINE entries claim defects were **already repaired "in this pass"** (e.g. p.77 MLB Agent Simulator: "Three arithmetic defects and a state bug were repaired in this pass"; p.83 Risk/Volatility: "a dashboard that told four of five team contexts to play it safe ... was repaired in this pass"). Whether real commits landed in the named repos is exactly what a code-level verification pass should check first — see CLAIMS REGISTER items 3 and 8.

## 2. Portfolio-level judgment (p.38-39)

All 76 discoverable Simulation Library records were classified into one of seven decision classes. Counts (p.38):

| Decision | Count | Meaning (p.38) |
|---|---|---|
| KEEP | 9 | "Strong current core; validate live and repair only evidence-backed issues." |
| REFINE | 14 | "Good interaction or model; targeted product, data, balance, or facilitation work." |
| REFOUND | 10 | "Concept or premise is valuable; current system cannot carry V5." |
| MERGE | 16 | "Combine duplicated concepts, builds, or mechanic lines into a stronger canonical experience." |
| SUPPORTING ACTIVITY | 4 | "Useful teaching asset that should not be marketed as a flagship simulation." |
| ARCHIVE | 21 | "Preserve provenance; remove from the active teaching surface." |
| KILL | 2 | "No runnable experience or salvage value proportional to maintenance." |

V5's own summary of what this means (p.39, bulleted):
- "The strongest assets are decision systems, not the most polished course wrappers."
- "Several excellent concepts are broken, unreachable, duplicated, or trapped in spreadsheet/server dependencies."
- "Many experiences are individual and self-guided; the next-generation live class layer does not yet exist."
- "Quiz-first experiences can remain useful diagnostics or supporting activities but should stop carrying simulation branding."
- "Track 301 contains some of the strongest model-risk and portfolio work; treat it as an R&D shelf, not an immediate Ramaz scope expansion."
- "Financial Literacy is too thin in this repository to infer its next product directly; use the separate Decision Challenges architecture."

Every KEEP is explicitly labeled "provisional" — "preserve the core now, promote to Ramaz-ready only after live use" (p.2, p.75).

## 3. The KEEP set (9 records, Appendix A.1, pp.76-79)

All nine share the boilerplate verdict "KEEP. Preserve the decision core; run live before promotion and change only against evidence." Notable per-item claims:

| Experience | Canonical ID / repo | Slot | Recorded finding (V5's words) |
|---|---|---|---|
| Cap Crash | `cap-crash` / T201-M1-L1 | 201 M1 L1 | "genuinely open sandbox ... buying the best affordable players produced four players and 37 wins, buying value produced thirteen and 41 ... closes the star-stacking exploit by construction" (p.76) |
| Draft Room Fit vs BPA | `draft-room-fit-vs-bpa` / 101-M4-L3 | 101 M4 L3 | "cleanest tradeoff design measured ... no single heuristic survives the scenarios. No defects found." (p.76) |
| Mega City Tycoon | `mega-city-tycoon` / 101-M1-ECON | not mapped | "the budget constraint is genuinely enforced rather than decorative" (p.76-77) |
| MLB Money Maker | `mlb-money-maker` / T201-M2-L1 | 201 M2 ext. | "Every allocation tried left someone under 55 percent happy ... no defects were found." (p.77) |
| MLB Player Economics — Agent Simulator | `mlb-agent-simulator` / 201-M2-L2 | 201 M2 L2 | "clearest expected-value teaching ... Three arithmetic defects and a state bug were repaired in this pass" (p.77) |
| Small Markets, Big Money | `small-markets-big-money` / 101-M2-L2 | 101 M2 L2 | "best writing in the account, over real branching ... Nothing here can be bluffed." (p.77-78) |
| The Front Office Dashboard | `front-office-dashboard` / 201-M3-L1 | 201 M3 L1 | "best decision design in the account ... Played clean with no exploit found." (p.78) |
| Trade Deadline War Room (Track 201) | `trade-deadline-war-room-201` / T201-M1-L2 | 201 M4 L3 | "identical star swing produced a 209 million dollar tax bill and an alarmed owner on one roster and a zero bill ... no exploit, and the best mobile layout tested" (p.78) |
| Why the Draft Isn't a Ranking | `why-the-draft-isnt-a-ranking` / 101-M4-L1 | 101 M4 L1 | "only simulation that proves its own thesis ... replaying one strategy twenty times returns scores from 40 to 93" (p.79) |

## 4. REFINE (14), REFOUND (10), MERGE (16) — exploits and broken mechanics V5 admits

Selected consequential defect claims (full list in Appendix A, pp.80-95):

- **ESPN Crisis Manager** (301-M3-ECON, p.80-81): "clicking the first option every round scores 95 out of 100 without reading, which shuffling option order would fix" — a scored decision system where the answer position, not the decision, drives the score.
- **NBA Surplus Value Championship** (201-M4-L2, p.83): "held back by a win check that does not match the target printed on screen."
- **Risk, Volatility & Rational Aggression** (301-M2-L2, p.83): "a dashboard that told four of five team contexts to play it safe — costing a student up to 32 points of 100 for following it — was repaired in this pass."
- **BOW Boss Sim — Economic Summit** (GAUNTLET/Boss Sim, p.86, REFOUND): "unplayable: no honest run gets past round 2 of 6 because the continue control is never rendered."
- **BOW Sports Capital — GM Decision Game** (301-M1-L1, p.86, REFOUND): "choosing the middle option nine times without reading scores a perfect 45 of 45, so the build teaches the opposite of its own lesson."
- **BOW Sports Capital: Pregame** (BSC-pre-course, p.86-87, REFOUND): "pressing the Continue button ... blanks the application, reproducibly."
- **Gauntlet L1: Market Master** (p.87, REFOUND): "results-submission endpoint is still the placeholder string, so nothing is ever recorded."
- **Gauntlet L3: Economic Policy Simulator** (p.87-88, REFOUND): "a successful run never resolves: Quarter 8 resubmits forever."
- **Analytics Lab** (BSC-BUILDANALYTIC, p.90, MERGE): "the weighting tool works and the leaderboard genuinely reorders, but every chart renders empty, the report throws, and selecting a sport fires 24 errors."
- **The GM's Model** (scout-model, p.94, MERGE): "the same application is duplicated across four files and the CI workflow file contains HTML instead of YAML."
- **BOW Sports Capital — Final Mastery Simulation** (201-M4-ECON, p.106, KILL): "the file contains 154 lines of constants and zero functions ... no menu and no runnable activity."
- **Entrepreneurship Lab — Unit Economics** (p.106, KILL): "deployed and dead ... a syntax error (Unexpected token ':') stops every script."

Pattern across REFOUND/MERGE/ARCHIVE: the dominant failure modes are (1) unrendered/dead continue-controls that make honest completion impossible, (2) result screens that don't match underlying state, (3) 404/unreachable GitHub Pages deployments, (4) code requiring a bound Google Sheet or Postgres instance not present in the repo, and (5) duplicated app logic across files/repos.

## 5. Flagship Economics portfolio → module/lesson mapping (p.40)

Eight flagships plus one new prototype, each with a curriculum job and named "starting assets" (existing repos to harvest):

| Flagship | Curriculum job | Mechanic | Starting assets |
|---|---|---|---|
| Cap Builders | 101 M1 | Allocation + shock/adapt | Front Office Build the Roster; Cap Crash; Pregame concept |
| League Balance Lab | 101 M2 | Institution design + simulation | Small Markets, Big Money; League in a Box |
| Value & Signal Room | 101 M3 | Draft + information + metric builder | Moneyball Draft; Stats vs Scouts; Analytics Lab/Stat Inventor |
| Draft Uncertainty Lab | 101 M4 | Stochastic selection + portfolio | Why Draft Isn't Ranking; Fit vs BPA; Process vs Results |
| Cap Crash Control Room | 201 M1 | Open allocation + rules + shock | Cap Crash; Luxury Tax; Curve Room |
| League & Contract Deal Room | 201 M2 | Coalition + bilateral negotiation | MLB Money Maker; MLB Agent; Boss Summit premise |
| Model Room | 201 M3 | Competing models + new signal | Front Office Dashboard; Decision Room; analytics pair |
| Draft Asset Market | 201 M4 | Auction/trade + portfolio | Trade Deadline 201; GM Trade; Surplus Value |
| Your Market (new) | Future Economics/"Simulation Day" | Live double auction + policy rerun | New vertical slice; MobLab/EconPort pattern benchmark |

Build-priority tiers (p.40): **Use now with facilitation** = the 9 KEEPs + selected REFINE activities. **Prototype now** = Your Market, Cap Builders, League Balance Lab (chosen to stress-test real-time trading, allocation, and institution-change mechanics together). **Refound after first receipts** = Draft Uncertainty Lab, League & Contract Deal Room, Model Room, Draft Asset Market. **Do not build yet** = a universal motif marketplace, a Track 301 product, an Economics Decision Challenge line, or a migration layer for all 76 legacy repos.

Six-lesson "Ramaz Alpha" pilot set actually scheduled first (p.47): 101 Salary Cap Basics/Cap Builders, 101 Small Markets/League Balance, 101 Why Draft Isn't Ranking, 201 Cap Crash, 201 Player Economics/Contract Table, 201 Modeling the Market/Model Room.

## 6. Repository-level disposition (p.66-67)

"The account contains 83 repositories and the Simulation Library identifies 76 experiences" (p.66) — i.e. 7 repos hold no catalogued teaching experience.

| Repo/family | Decision | Note |
|---|---|---|
| BOW-WEBSITE | KEEP + ELEVATE | becomes canonical control plane |
| sim-library | KEEP INDEPENDENT | registry only, "does not become the runtime" |
| **bow-finlit** | KEEP AS RUNTIME | "Front Office Challenge and the **strongest live-class/session behavior**. Extract contracts and reusable session primitives only after they prove a second use." |
| bow-decision-challenges | KEEP AS RUNTIME | canonical Challenge engine |
| bow-universe | INCUBATE | future League research env |
| Bow-Sports-Capital-Full-APP | MINE + SUNSET | harvest ideas, stop parallel identity/billing |
| Bow-Platform / Apps Script | MIGRATE + ARCHIVE | move still-used ops records into BOW-WEBSITE |
| Individual lesson/sim repos | MANIFEST + CURATE | stay independent until promoted |
| league-in-a-box + small shells | MECHANIC SOURCE | content-only, don't promote as apps |
| Sports analytics models/CourtIQ | OPTION PORTFOLIO | R&D, not near-term scope |

## 7. Mechanics rated strongest / most reusable

- **bow-finlit** is explicitly named as holding "the strongest live-class/session behavior" of any repo (p.66) — a repo-level architecture claim, not a single-experience claim.
- Portfolio-quality doctrine (p.69): "Prefer twelve simulations students remember, teachers rerun, partners can license, and creators can extend over 100 simulations that exist only as repository links."
- Coverage gap (p.35, "PORTFOLIO GAP" box): "BOW can teach the current sports-business curriculum well, but it does not yet demonstrate the breadth of an Economics simulation system." The mechanics taxonomy (p.35) shows the library is "rich in roster allocation, drafting, and front-office scenarios and comparatively thin in market formation, production, public goods, labor, competition, and externalities" — the stated reason a live double-auction ("Your Market") is prototype priority #1.
- Individually, the KEEP-set entries in §3 above are the closest thing to "rated strongest" at the single-experience level (Front Office Dashboard: "best decision design in the account"; Small Markets, Big Money: "best writing in the account"; Trade Deadline War Room 201: "best mobile layout tested").

## 8. Other structural facts worth carrying forward

- Curriculum is 4 modules × 3 lessons for both Track 101 (grades ~5-6) and Track 201 (grades ~7-8) (pp.17-18); an earlier 4-lesson map is "provenance, not current canon" (p.2).
- One unresolved naming ambiguity flagged by V5 itself: Track 201 M2 L3 is called "Cap Space ≠ Cash Flow" in one table but "The Ownership Equation" in the fuller lesson scripts; V5 provisionally treats "Ownership Equation" as current (p.18).
- Track 301 (a third, more advanced track referenced throughout Appendix A) is **not part of the founder-fixed Track 101/201 curriculum** described in the mission brief — it appears only as an R&D/model-risk shelf V5 recommends *not* promoting into Ramaz scope (p.39).
- Evidence-truth vocabulary (Appendix B.3, p.108) that any later audit should reuse: Discovered → Reachable → Playable → Ramaz-tested → Ramaz-ready → Transfer-ready → Evidence-bearing, each with explicit "may claim" / "may not claim" boundaries (e.g. "Playable" only claims "An adult completed the critical path," never "Students understand or teachers can facilitate it").

## CLAIMS REGISTER

Fifteen of V5's most consequential empirical claims about existing software, for code-level verification. "Repo" is the GitHub path cited in Appendix A/§6 above (org: `braydenokley13-ux` unless noted).

| # | Claim | Repo / Experience | Class | Page |
|---|---|---|---|---|
| 1 | Roster-size rule "closes the star-stacking exploit by construction"; two strategies produced 4 wins-players/37 wins vs. 13 players/41 wins with no defects found | `braydenokley13-ux/T201-M1-L1` (Cap Crash) | KEEP | p.76 |
| 2 | "No single heuristic survives the scenarios. No defects found." | `braydenokley13-ux/101-M4-L3` (Draft Room Fit vs BPA) | KEEP | p.76 |
| 3 | "Three arithmetic defects and a state bug were repaired in this pass"; EV and counterfactual shown clearly | `braydenokley13-ux/201-M2-L2` (MLB Agent Simulator) | KEEP | p.77 |
| 4 | "TRAP and ALBATROSS player tiers... a randomised owner mandate... Played clean with no exploit found." | `braydenokley13-ux/201-M3-L1` (Front Office Dashboard) | KEEP | p.78 |
| 5 | "Replaying one strategy twenty times returns scores from 40 to 93, and process and outcome are reported separately. The phone layout and keyboard access were repaired in this pass." | `braydenokley13-ux/101-M4-L1` (Why the Draft Isn't a Ranking) | KEEP | p.79 |
| 6 | "Clicking the first option every round scores 95 out of 100 without reading" — position-based scoring exploit | `braydenokley13-ux/301-M2-L1` (ESPN Crisis Manager) | REFINE | p.80-81 |
| 7 | "Held back by a win check that does not match the target printed on screen" | `braydenokley13-ux/201-M4-L2` (NBA Surplus Value Championship) | REFINE | p.83 |
| 8 | "A dashboard that told four of five team contexts to play it safe — costing a student up to 32 points of 100 for following it — was repaired in this pass" | `braydenokley13-ux/301-M2-L2` (Risk, Volatility & Rational Aggression) | REFINE | p.83 |
| 9 | "Unplayable: no honest run gets past round 2 of 6 because the continue control is never rendered" | `braydenokley13-ux/GAUNTLET` — Boss Sim | REFOUND | p.86 |
| 10 | "Choosing the middle option nine times without reading scores a perfect 45 of 45" | `braydenokley13-ux/301-M1-L1` (GM Decision Game) | REFOUND | p.86 |
| 11 | "Pressing the Continue button it offers after the first decision of week 1 blanks the application, reproducibly" | `braydenokley13-ux/BSC-pre-course` (Pregame) | REFOUND | p.86-87 |
| 12 | "The weighting tool works and the leaderboard genuinely reorders, but every chart renders empty, the report throws, and selecting a sport fires 24 errors" | `braydenokley13-ux/BSC-BUILDANALYTIC` (Analytics Lab) | MERGE | p.90 |
| 13 | "The same application is duplicated across four files and the CI workflow file contains HTML instead of YAML" | `braydenokley13-ux/scout-model` (The GM's Model) | MERGE | p.94 |
| 14 | "The file contains 154 lines of constants and zero functions... no menu and no runnable activity" | `braydenokley13-ux/201-M4-ECON` (Final Mastery Simulation) | KILL | p.106 |
| 15 | `bow-finlit` holds "the strongest live-class/session behavior" of any repo in the portfolio (repo-level architecture claim underpinning the "KEEP AS RUNTIME" decision) | `braydenokley13-ux/bow-finlit` | KEEP AS RUNTIME (repo-level) | p.66 |
