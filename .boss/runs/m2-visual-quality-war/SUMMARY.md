# BOW Boss run: m2-visual-quality-war

Status: **active**  
Level: **3 — QUALITY_WAR**  
Intent: **build-to-ship**  
Wave: **2**  
Base: `claude/economics-boss-module-2-8s591f@128236a2856e847ac38129a8b318bd13e7b2ebce`  
Event head: `168:562d7855a5f01c1a63899878c2b8e5f1ce8be8b025c32fc58e7d53b4c0a6edba`  
Updated: 2026-09-01T21:28:42.696Z

## Founder intent

Founder-activated Level 3 Quality War: cross the premium interactive sports-business media bar on Module 2 by implementing the five founder-approved reference mockups faithfully on the real product — Full House student surface first, then /teach live class director, projector class reveal, and the economics synthesis — deviating only with a recorded concrete reason, under the hidden-information loop, two-book economics, audited rendered claims, teacher transfer, and projector privacy. Boss lead routed to claude-fable-5-1.

## Hypothesis

Full House's student surface (/play, every state from lobby to complete) can be rebuilt to the frozen reference-to-product contract (VISUAL_REFERENCE_CONTRACT.md §A–§D, §G) — a Module-2-scoped design system (violet accent, vendored Inter, card grid, desk rail), a drawn arena that renders settled turnout only, a results state that owns the viewport before the next decision, a factual sellout beat, and a rendered-claim limb on the client — such that a fresh independent visual critic grades /play PREMIUM (or at minimum moves it out of SERVICEABLE-NOT-PREMIUM with the remaining gaps named and non-structural), fresh gameplay and three fresh simulated kid critics rate pull STRONG or better for every persona with the two blocking student-pull dissents discharged, Economic Truth confirms no rendered claim is stronger than the model (R-1 limb bites under mutation, R-2/R-3/R-4/R-9 discharged), Module 1's rendered output is unchanged, and the full suite plus the M2 L1 e2e stay green.

## Required roles

- browser-qa
- builder
- economic-truth-critic
- experience-director
- lead-integrator
- player-gameplay-critic
- product-analyst
- regression-hunter
- visual-experience-director

## Role status

- builder — builder-a — completed-with-concerns — claude-opus-5
- builder — builder-b — active — claude-opus-5
- builder — builder-c — completed-with-concerns — claude-opus-5
- lead-integrator — boss-lead — active — claude-fable-5-1
- sports-reality-director — sports-reality-w2 — completed-with-concerns — claude-sonnet-5
- browser-qa — browser-qa-w2base — completed — claude-sonnet-5

## Required evidence

- analyst-report
- browser-trace
- economic-truth-report
- gameplay-report
- git-diff
- test
- visual-report

## Evidence recorded

- bowl-rights-review-report — visual-report — Sports Reality W2 bounded rights/source review report
- bowl-rights-review-manifest — browser-trace — Manifest of images viewed for this review
- bowl-rights-review-arena-outcome-100 — screenshot — Arena outcome view at 100% fill (sellout) - generic bowl, violet lighting, generic key markings, no team colors or marks
- bowl-rights-review-arena-outcome-72 — screenshot — Arena outcome view at 72% fill - partial lighting, no identifiable architecture
- bowl-rights-review-arena-hero — screenshot — Arena hero backdrop at 1366px - dark/closed bowl, left fade
- bowl-rights-review-mock-student — screenshot — Design-system style-tile mock student 1366 - 'DRAWN BOWL - PLACEHOLDER ASSET' label on lit arena panel; club name as plain text
- bowl-rights-review-mock-board — screenshot — Design-system style-tile mock board 1920 - crest circles with two-letter marks (NY/MEM/DEN/SAC/ORL/MIL) in uniform violet fill, plain club wordmarks below; 6 real clubs shown though the module only models New York and Memphis
- bowl-rights-review-arena-source — note — arena.mjs read: procedural SVG bowl, generic key/paint markings only, no logos, no NBA marks, no team colors, no identifiable roof/architecture
- bowl-rights-review-fullhouse-markets — note — fullHouse.ts MARKETS array + marketForDesk: only two markets exist (new-york, memphis), odd/even desk assignment, no other clubs modeled
- m1-baseline-extended-manifest — browser-trace — 38-frame M1 extended pixel-baseline manifest (L1 Draft Day + L2 Trade Deadline + L3 Free Agency across /play, /teach, /board, with scrubbed clock/code/PIN strings noted per frame) -- run 1
- m1-baseline-extended-compare — note — sha256 byte-equality compare of run1 vs run2 (post-fix): 34/38 identical; 4 non-stable frames diagnosed with pixel-diff crops in docs/gauntlet/module-2/premium/diff-crops/
- m1-baseline-extended-l1-locked-race — screenshot — L1 locked-roster /play, run 1 -- harness race: screenshot fired before the API-placed/locked roster had polled through, so the wall still reads 0/5 despite the lock call already completing server-side
- m1-baseline-extended-l1-locked-settled — screenshot — L1 locked-roster /play, run 2 -- the correct settled render (roster wall LOCKED, 5/5 filled, cap AT THE CAP)
- m1-baseline-extended-l2-decision — screenshot — L2 Trade Deadline decision screen (#tdWall) on /play, byte-stable across both runs
- m1-baseline-extended-l2-reveal-board — screenshot — L2 Trade Deadline reveal theater on /board after 4 real revealNext advances, byte-stable across both runs
- m1-baseline-extended-l3-day1-market — screenshot — L3 Free Agency day-1 market on /play, byte-stable across both runs
- lane-a-tile-1366 — screenshot — Lane A render: m2ui components + three arena views (hero dark/closed, outcome lit, sellout with turned-away crowd) at 1366 width, Inter M2 loaded
- lane-a-tile-1024 — screenshot — Lane A render at 1024 width (rail-collapse breakpoint)
- lane-a-contrast-proof — note — Module-2 contrast/CVD proof: 39 pairings, 0 failures after three token repairs; deuteranopia finding (LOCKED/STALLED 4.7 dE) enforced by glyph+label in pill()
- lane-a-identity-layer — note — VISUAL_IDENTITY.md Module 2 layer section (the ticket office; violet accent; Inter; arena as instrument; no team-colour badge fills)
- lane-c-mutation-a — note — R-1 mutation A: injected a client-rendered turnout number (no flagged word) into a scratch dist; the browser limb failed the run on the number half (exit 1)
- lane-c-mutation-b — note — R-1 mutation B: injected a literal Target: $110–$120 into a scratch dist; the browser limb failed the run on the word half (exit 1)
- lane-c-e2e-clean — note — R-1 clean run against HEAD's renderer (pre-Lane-B splice): 56 pre-lock desk states audited, 27 numeric-coincidence abstentions logged, zero console errors, PASS (exit 0)
- lane-c-source-limb-mutation — note — clientClaims source test: mutation (projection + target literal appended to board/main.ts, then restored) fails with three hits
- lane-c-source-limb-clean — note — clientClaims source test clean at head (27 allowlisted non-claims with reasons)
- lane-c-npm-test — note — cd runtime && npm test after Lane C: 468/468 (lane-run log; authentic command record re-taken by the lead at the wave head)

## Claim ledger

- No claims recorded yet

## Dissent

- bowl-rights-review-dissent — rights-source/advisory/open — mock-board-1920.png (the wave-3 board mock) shows four real NBA clubs (Denver Nuggets, Sacramento Kings, Orlando Magic, Milwaukee Bucks) that do not exist in fullHouse.ts's MARKETS array and have never been Sports Reality verified (no capacity, building, or market-framing data exists for them, unlike New York/Memphis in GATE_L1_SR.md). These should not ship into a real class-results frame without either restricting desks to the two verified markets (repeating them per the existing odd/even marketForDesk assignment) or a fresh verification pass per additional club before wave 3 builds the frame.

## Latest gate

- Gate not evaluated

## Decision pending

A gate and founder decision are still pending.
