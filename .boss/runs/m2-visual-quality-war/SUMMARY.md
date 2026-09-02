# BOW Boss run: m2-visual-quality-war

Status: **active**  
Level: **3 — QUALITY_WAR**  
Intent: **build-to-ship**  
Wave: **2**  
Base: `claude/economics-boss-module-2-8s591f@128236a2856e847ac38129a8b318bd13e7b2ebce`  
Event head: `253:46a2320a7e2f4bf8007eef503ccb5b56f7cf7fb77a5e6d8e6a76188fae213b62`  
Updated: 2026-09-02T16:27:06.225Z

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
- builder — builder-b — completed-with-concerns — claude-opus-5
- builder — builder-c — completed-with-concerns — claude-opus-5
- lead-integrator — boss-lead — active — claude-fable-5-1
- sports-reality-director — sports-reality-w2 — completed-with-concerns — claude-sonnet-5
- browser-qa — browser-qa-w2base — completed — claude-sonnet-5
- browser-qa — browser-qa-w2 — completed-with-concerns — claude-sonnet-5
- visual-experience-director — visual-critic-3 — completed-with-concerns — claude-opus-5
- player-gameplay-critic — gameplay-critic-w2 — completed-with-concerns — claude-opus-5
- player-gameplay-critic — kid-a2-basketball — active — claude-opus-5
- player-gameplay-critic — kid-b2-casual — active — claude-sonnet-5
- player-gameplay-critic — kid-c2-nonsports — completed-with-concerns — claude-opus-5
- economic-truth-critic — econ-truth-w2 — active — claude-opus-5
- regression-hunter — regression-w2 — completed-with-concerns — claude-sonnet-5
- product-analyst — analyst-w2 — active — claude-opus-5
- regression-hunter — regression-w2b — active — claude-sonnet-5
- builder — builder-r1 — active — claude-opus-5
- builder — builder-r3 — active — claude-opus-5

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
- w2-npm-test-6c4c7cc — test — cd runtime && npm test at wave-2 head 6c4c7cc (build + full suite)
- w2-e2e-6c4c7cc — test — node runtime/scripts/e2e-m2l1.cjs at wave-2 head 6c4c7cc with the R-1 client claim limb active (4-desk arc + 12-desk class scale)
- w2-e2e-misclick-6c4c7cc — test — node runtime/scripts/e2e-m2l1-misclick.cjs at wave-2 head 6c4c7cc
- lane-b-diff — git-diff — Lane B diff: play/main.ts 31fb8c8..3adcbda plus m2.css after Lane A handoff 46a88e1..3adcbda (rebuilt Full House /play: desk rail, hero dial, results state, arena outcome, sellout beat, PIN demotion)
- lane-b-measurements — note — Lane B DOM measurements at 1366x768 (wide) and 1024x600 (tight): price readout 68px/64px, PIN 16px, LOCK bottom 392/367, blind note 14.5px, result headline+WHO CAME within 768, vocabulary hits 0 on N1 pre-lock — builder's own numbers, not accepted
- lane-b-shots-manifest — browser-trace — Lane B builder screenshot set (17 frames, lobby→complete, 1366 + 1024x600) — builder captures, superseded by Browser QA's wave-2 set
- lane-b-shot-prelock-1366 — screenshot — Lane B: Night 1 pre-lock at 1366x768 — hero price, desk rail, LOCK IT IN with blind note
- lane-b-shot-prelock-1024 — screenshot — Lane B: Night 1 pre-lock at 1024x600 with the PIN card un-collapsed
- lane-b-shot-result-1366 — screenshot — Lane B: Night 1 results state at 1366x768 (#fhResult owns the desk; NEXT below)
- lane-b-shot-sellout-1366 — screenshot — Lane B: Night 4 sellout results state at 1366x768 (FULL HOUSE beat, turned-away count)
- lead-e2e-repair-6c4c7cc — note — Boss lead e2e repair at 6c4c7cc: the e2e read the sellout beat and spend verdict AFTER pressing NEXT and took its NEXT handle before the desk's poll re-rendered; the R-1 limb matched hidden quantities as substrings (a settled '1,232' read as hidden sens 232). Fixed in runtime/scripts/e2e-m2l1.cjs; both mutations still bite at Night 1
- w2-mutation-a-6c4c7cc — note — R-1 mutation A at head 6c4c7cc (whole-figure limb): injected the true Night-1 turnout (14,142 fans) into the pre-lock render of a scratch dist — limb FAILED the run at Night 1 desk1 (exit 1)
- w2-mutation-b-6c4c7cc — note — R-1 mutation B at head 6c4c7cc: injected 'Target: $110–$120' into the pre-lock render of a scratch dist — limb FAILED the run on the forbidden word at Night 1 desk1 (exit 1)
- w2-git-diff-6c4c7cc — git-diff — Wave-2 diff from the wave-1 checkpoint 31fb8c8 to the prosecution head 6c4c7cc (runtime + design + contract); diffstat alongside
- w2-regression-report — note — Full regression report (regressions-found / paths-exercised / verdict)
- w2-regression-manifest — browser-trace — Manifest of M1-baseline compare JSON, diff crops, and misclick log
- w2-regression-m1-compare-baseline-vs-head — visual-report — sha256 byte-compare: wave-2 base-head M1 baseline (pre-play-rebuild) vs head 6c4c7cc, 38 frames, 34/38 identical
- w2-regression-m1-compare-head-vs-head — visual-report — sha256 byte-compare: head 6c4c7cc captured twice, isolates harness-timing races from real diffs, 36/38 identical
- w2-regression-l2-05-crop — screenshot — l2-05-teach-hook crop: baseline vs head, diff is join-order counter + build-version label text only, no layout shift
- w2-regression-l2-10-crop — screenshot — l2-10-play-reveal crop: baseline vs head, diff is reveal-stage animation timing (already a known-race frame)
- w2-regression-misclick-log — browser-trace — e2e-m2l1-misclick.cjs full stdout, exit 0, PASS
- w2-browser-truth-report — browser-trace — BROWSER_TRUTH_W2.md — full report: paths, §H measurement table, defects, not-verified
- w2-browser-truth-sellout-gold-leak — screenshot — Night-4 shock sellout (Desk 2, Memphis, held $16, bowl closed) — FULL HOUSE, 17,794 of 17,794, 7,256 turned away; headline box shows an unremoved legacy gold border/gradient (theme.css .fh-sellout) instead of violet
- w2-browser-truth-prelock-fulldial — screenshot — Full pre-lock card stack at 1366x768 — LOCK IT IN and its caption confirmed inside the first viewport; price readout 68px, largest figure on frame
- w2-browser-truth-1024-pin-uncollapsed — screenshot — First-contact viewport 1024x600, PIN card still open (un-collapsed)
- w2-browser-truth-locked-waiting — screenshot — H1 locked-waiting state — dark building, 'Doors in a minute', no timer/spinner
- w2-browser-truth-zero-turnout — screenshot — Desk 3, Night 1, priced at $120 on the lowest-draw card — a true zero-turnout night (0 of 19,800, 0%, cash -$520,000)
- w2-browser-truth-measurements-raw — note — Raw console-logged + file-written DOM measurements from all 5 driving passes (measurements.json, measurements2.json, measurements3.json)
- w2-gameplay-report — gameplay-report — Player/Gameplay Critic wave-2 report on M2L1 Full House /play — pull FUNCTIONAL, blocking student-pull dissent
- w2-gameplay-manifest — browser-trace — 62-frame screenshot manifest of the full arc (lobby to complete) across 4 desks, 1 board, 1 teacher
- w2-gameplay-measurements — browser-trace — getBoundingClientRect/getComputedStyle dumps at scrollY=0 for every pre-lock, result, reveal, adapt, CF, synthesis and complete state driven
- w2-gameplay-prelock-fold — screenshot — Pre-lock N1 1366x768 fullPage: YOUR NIGHTS SO FAR at top 769 and the 200-word event-money rule at y833-1064, both below the 768 fold
- w2-gameplay-prelock-viewport — screenshot — Pre-lock N1 1366x768 first viewport: 68px price hero, PLAN $24 tick clear of the knob, LOCK IT IN at top 336, event dial with no rule in frame
- w2-gameplay-result-n1 — screenshot — Result state N1 1366x768 scrollY=0: headline, 72px WHO CAME, full CASH chain, lit arena, RENEWALS 50%->30%, NEXT all above the fold (wave-1 dissent 1 discharged at the design target)
- w2-gameplay-sellout — screenshot — Memphis N4 sellout at 1366x768: FULL HOUSE top 189, 7,256 TURNED AWAY at 40px bottom 517, no grading word; resale note below the fold
- w2-gameplay-sellout-lowball — screenshot — New York $10 desk N4: FULL HOUSE gold band on a night that cleared $34,400 against a $520,000 bill with renewals at 0% — sellout is not made to look like success by words, but by weight
- w2-gameplay-reveal-inert — screenshot — Student device at reveal stage 0 — byte-identical innerText through stage 5; the seven-click reveal moves the device once
- w2-gameplay-synth-inert — screenshot — Student device at SYNTHESIS — identical across all six card pages, ~471px of contiguous dead black, empty rail placeholder box
- w2-gameplay-counterfactual — screenshot — COUNTERFACTUAL on the desk that held $16: 14,740 -> 15,500 same price with the WHERE THAT CHANGE CAME FROM decomposition; replay bodies in adult prose
- w2-gameplay-1024-result — screenshot — Result state at 1024x600 with PIN card un-collapsed: RENEWALS bottom 604 and NEXT top 705 both below the 600 fold
- w2-kid-c-report — gameplay-report — KID C (non-sports grade 5-6, pairs on one Chromebook) wave-2 playtest of Full House /play, full arc, Desk 3 New York; pull rating STRONG; below-the-fold finding PARTLY discharged with measurements
- w2-kid-c-manifest — browser-trace — Manifest of all 88 captures from the Kid C playthrough (lobby, hook, 5x prelock/dials/locked/result, board mirrors, 7 reveal stages on both surfaces, adapt, counterfactual, synthesis, complete, plus a separate mid-fill night)
- w2-kid-c-n2-zero-fold — screenshot — Night 2, 0 people came at $120, at scrollY=0 1366x768: outcome fully above the fold, no causal sentence anywhere on the frame, ~193px empty right column beside it
- w2-kid-c-n2-zero-full — screenshot — Same Night 2 fullPage: the WHAT HAPPENED card is below the fold (docHeight 915 vs 768) and says only 'You charged $120.' - a restatement, not a reason
- w2-kid-c-n1-sellout — screenshot — Night 1 sellout at $12: FULL HOUSE headline top 189, WHO CAME 19,800 at 72px, 326 TURNED AWAY at 40px bottom 517, CASH chain and renewals move all above the fold; arena picture still shows grey wedges at 100% and an amber 'Came' key against violet seats
- w2-kid-c-n4-prelock — screenshot — Night 4 pre-lock at 1366x768: no outcome preview of any kind, extra-seats control reads 'Open 2,400 more seats tonight / $95,000 / paid whether they fill or not' - the phrase 'upper bowl' appears nowhere pre-lock
- w2-kid-c-1024x600 — screenshot — Night 1 first contact at 1024x600 with the PIN card un-collapsed: LOCK IT IN bottom 367 and its caption bottom 471, both reachable without scrolling; price readout 64px, pinDisplay 16px
- w2-kid-c-lobby-dead — screenshot — LOBBY, the first screen a pair sees after joining: last main-column content bottom 367 at innerHeight 768 = 401px contiguous dead region, plus an empty rail box
- w2-kid-c-cf — screenshot — COUNTERFACTUAL on /play: the Night1-vs-Night5 same-card comparison (the only place the repeat is named on the student device) plus the unreadable 'wanted in -1,100 ... seats only allowed -774' line and the empty REJOIN PIN pill
- w2-kid-c-midfill — screenshot — Separate one-night session: a 38.5% turnout night proving the arena picture does respond to fill (9.7% lit pixels vs 0.6% at zero and 23.1% at sellout)
- w2-kid-c-transcript — note — Full innerText transcript of every /play and /board state visited during the Kid C run, with the getBoundingClientRect measurements logged inline after each bell
- w2-visual-review-report — visual-report — Visual Experience Director review of the rebuilt Module 2 /play surface at 6c4c7cc — per-row A-D grades, overall top-of-SERVICEABLE, hierarchy/production findings, direction, visual-quality dissent
- w2-visual-review-manifest — browser-trace — Screenshot manifest for the full /play state sweep (4 desks incl. late joiner, sellout desk and zero-turnout desk; lobby, hook, pre-lock N1/N4, dials moved, locked-waiting, results N1-N5, all-nights-done, reveal, adapt, counterfactual, synthesis, complete) at 1366x768 and 1024x600, plus arena crops
- w2-visual-review-measurements — note — Live getBoundingClientRect / getComputedStyle / document.fonts harvest across every /play state: figure sizes, hero identity, dead space, colour census, font census, animation census
- w2-visual-review-audit — note — DOM audit: per-state font-family census (Bebas Neue under M2), gold/blue UI colour usage, forbidden-vocabulary counts, first-viewport word counts, reduced-motion run
- w2-visual-review-chart-geometry — note — SVG geometry of #fhNights: axis-only path, 5 marks in 13% of plot height, N1/N5 superimposed at cx 119.9
- w2-visual-review-shot-prelock — screenshot — Pre-lock Night 1 at 1366x768, scrollY=0 — 68px hero price, three stat cards, blue rule box, no arena
- w2-visual-review-shot-result — screenshot — Night 1 settled result at 1366x768, scrollY=0 — 72px turnout hero, CASH chain, arena outcome, Bebas headline
- w2-visual-review-shot-sellout — screenshot — Night 4 sellout at 1366x768 — FULL HOUSE top 192 in Bebas Neue on a gold-gradient banner, 7,256 turned away second-largest
- w2-visual-review-shot-locked — screenshot — Locked-waiting state at 1366x768 — the dark-building panel renders as a mostly-empty black rectangle with one clipped quadrant of the bowl (C8 UNMET)
- w2-visual-review-shot-zero — screenshot — Zero-turnout night at 1366x768 under prefers-reduced-motion — 72px '0' hero, red -$520,000, and an arena that still reads as a lit building
- w2-visual-review-shot-arena-crops — screenshot — Arena outcome crops at 0%, 71.4% and 100% fill side by side — fill states are not separable and the amber Came swatch does not match the violet seats
- w2-visual-review-shot-1024 — screenshot — Pre-lock Night 1 at 1024x600 with the PIN card un-collapsed — rail re-composes to a top strip, #fhLock bottom 367 and caption bottom 471, but ~175px of chrome precedes any content
- w2-visual-review-shot-synthesis — screenshot — SYNTHESIS on /play at 1366x768 — H1 and subtitle are the same sentence, ~471px of empty main column, identical on every synthesis page (D2 UNMET)
- w2-visual-review-shot-chart — screenshot — All-nights-done at 1366x768 — YOUR NIGHTS SO FAR rendered twice, and the dot chart shows 5 labels against 4 visible marks clustered in 13% of the plot

## Claim ledger

- No claims recorded yet

## Dissent

- bowl-rights-review-dissent — rights-source/advisory/open — mock-board-1920.png (the wave-3 board mock) shows four real NBA clubs (Denver Nuggets, Sacramento Kings, Orlando Magic, Milwaukee Bucks) that do not exist in fullHouse.ts's MARKETS array and have never been Sports Reality verified (no capacity, building, or market-framing data exists for them, unlike New York/Memphis in GATE_L1_SR.md). These should not ship into a real class-results frame without either restricting desks to the two verified markets (repeating them per the existing odd/even marketForDesk assignment) or a fresh verification pass per additional club before wave 3 builds the frame.
- w2-gameplay-dissent — student-pull/blocking/open — Pull for the generic pair is FUNCTIONAL, below the bar for a Track 101 flagship, on three measured causes. (1) At every pre-lock decision at 1366x768, scrollY=0, the pair's own settled-night ledger and dot chart - the only information the blind-commit mechanic gives them - has top=769 (N1-N3) / 788 (N4) against a 768px viewport, i.e. zero pixels on screen, while the page's own subtitle reads 'read your own nights'. (2) The event-money dial's registered rule renders at approx y833-1064 pre-lock and its receipt renders below #fhNextNight (top 701 at 1366x768, 705 at 1024x600) post-lock, so at scrollY=0 one of the three instruments has no visible cause and no visible consequence at any point in the lesson - information -> choice -> Continue. (3) The student device is inert across the back half: #gameBody innerText is byte-identical across teacher reveal stages 0-5 and again at 6-7 (seven clicks, one device change) and byte-identical across all six SYNTHESIS card pages, with ~471px of contiguous dead black at SYNTHESIS and ~415px at COMPLETE against the 200px cap. Contract rows B8 and D2 are undischarged and row C1 fails at 1024x600 (RENEWALS bottom 604/639, NEXT top 705). The wave-1 dissents on the sellout beat and on #fhLock at 1024x600 are discharged; 'consequence below the fold' is discharged only at 1366x768.
- w2-visual-review-dissent — visual-quality/important/open — The Module-2 design system violates its own two published laws inside the module's designed peak moment, and the wave's flagship asset does not carry the read it exists to carry. MEASURED: (A4) Bebas Neue is the computed font-family of the sellout headline FULL HOUSE (40px/800), the per-night result headline (26px), the rail desk identity (12px, every state) and the rail night label, while design/VISUAL_IDENTITY.md states 'Bebas Neue does not appear under M2' - no deviation reason recorded. (A2) gold #f4b942 is rendered in HTML, not in the arena SVG, as the sellout panel border rgba(244,185,66,0.4) and the headline background linear-gradient(rgba(244,185,66,.16), rgba(244,185,66,.04)); amber rgb(240,169,74) is the legend swatch on every settled night; blue #4da2e8 is the rule-box background and left border on every pre-lock frame - four UI accent hues where the contract allows one, and VISUAL_IDENTITY.md asserts gold is retired. (A7/C4) the drawn arena does not encode fill legibly: 71.4% and 100% differ only by an outer-ring dim, 0% still renders a warmly lit court so the night nobody came reads as an open building, and the legend's 'Came' swatch is amber while every lit seat is violet - on a bowl-open night 'Came' and 'Upper bowl open' are the same amber. Additionally C8 renders broken (the locked-waiting building panel is a mostly-empty black rectangle with one clipped quadrant of the bowl, on a state each pair sees five times). Advisory under my authority; recorded so no later PREMIUM claim can be made on this surface without disposing of it. I directed the repairs in the 'direction' section and must not be the sole certifier of the result.

## Latest gate

- Gate not evaluated

## Decision pending

A gate and founder decision are still pending.
