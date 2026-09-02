# BOW Boss run: m2-visual-quality-war

Status: **active**  
Level: **3 — QUALITY_WAR**  
Intent: **build-to-ship**  
Wave: **3**  
Base: `claude/economics-boss-module-2-8s591f@128236a2856e847ac38129a8b318bd13e7b2ebce`  
Event head: `576:ee3fde3dbba3da16387b5c28253fa21d7a6215e386a8338d60ba2cf6d2f8f5c6`  
Updated: 2026-09-02T22:34:44.831Z

## Founder intent

Founder-activated Level 3 Quality War: cross the premium interactive sports-business media bar on Module 2 by implementing the five founder-approved reference mockups faithfully on the real product — Full House student surface first, then /teach live class director, projector class reveal, and the economics synthesis — deviating only with a recorded concrete reason, under the hidden-information loop, two-book economics, audited rendered claims, teacher transfer, and projector privacy. Boss lead routed to claude-fable-5-1.

## Hypothesis

The Module-2 design layer proven on /play in wave 2 can be propagated to the two shared classroom surfaces and the synthesis without weakening what wave 2 earned: /teach becomes a live class director to contract §F — fixed header with NIGHT N OF 5 and desk counts, filter chips, a desk-card grid that fits twelve desks at 1366x768 without wrapping collisions, a Director Rail (NOW / WATCH FOR / DON'T EXPLAIN YET / ASK / TIME CUT / RECOVERY) that scrolls inside itself with no facilitation line lost, and a persistent bottom control bar so nothing a teacher touches during a night sits below the fold (discharging baseline-browser-qa-dissent); /board gains a per-night class-results frame to §E2 with the legal columns only — DESK, TICKET PRICE, WHO CAME, FILL 'of the seats that desk opened' — no revenue or profit column, no per-desk money, drawn from the two Sports-Reality-verified markets only (disposing of bowl-rights-review-dissent), plus the §E1/§E4/§E5/§E6 frame grammar; and the synthesis carries R-5's computed visuals — realized class dots for one market and one card rather than a fitted curve, a two-axis frontier drawn from seasonFrontier and renewalMarginalCost rather than a balance scale, and DAY/DRAW/TV shifter chips with RENEWALS and LAST NIGHT'S EVENT MONEY in a separately labelled carried group and no 'Weather' — such that a fresh classroom-projector critic, a fresh teacher-transfer critic reading cold, and a fresh visual critic judge the three surfaces as one product, Economic Truth confirms every new rendered line is computed or registered and no projector claim outruns the model, /play and Module 1 are unchanged, and the full suite plus both M2 L1 e2e scripts stay green.

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

- builder — builder-w3-teach — active — claude-opus-5
- builder — builder-w3-board — active — claude-opus-5
- builder — builder-w3-synth — active — claude-opus-5
- repo-scout — repo-scout-w3 — completed-with-concerns — claude-opus-5

## Required evidence

- analyst-report
- browser-trace
- economic-truth-report
- gameplay-report
- git-diff
- test
- visual-report

## Evidence recorded

- w3-founder-rulings — note — Founder rulings D21 (FD-1 honest frontier, FD-2 short rules in view, FD-3 no art rewrite) and D22 (program sequence after wave 3, grade bands)
- w3-handoff-observed-stable — note — HANDOFF — OBSERVED IN REPO, the stable half: student runtime, class/session runtime, realtime, persistence, economic resolution, events, M1 vs M2, testing, with file:line citations (scout report transcribed verbatim by the lead; the scout role has no write tool)

## Claim ledger

- No claims recorded yet

## Dissent

- w3-concurrent-submit-dissent — classroom-reliability/important/open — A concurrent-submit version conflict loses a student action at class scale. SessionService.submitAction reads the session (sessionService.ts:271), awaits listSeatsForSession inside the reduce call (:278), then writes with expectedVersion = session.version (:283); because there is an await between read and write, two desks acting in the same tick interleave and the loser gets 409 version_conflict (:284). The client outbox then treats every non-401 4xx as definitive, shifts the action off the queue and never retries (outbox.ts:107-111) — including 409, which is a transient race rather than a refusal, and which the outbox's own header comment (:18-20) does not describe. A desk's lock that collides with another desk's lock is dropped, not retried; /play shows 'session changed underneath this action — refresh and retry' (play/main.ts:199-206), so it is visible rather than silent, but the action is lost and the night settles on inputs the pair did not choose. Nothing in the repo tests this: no test submits two actions concurrently, expectedVersion is exercised only sequentially at the repository level (snapshotRepository.test.ts:88), and client/shared has no test file at all. OBSERVED from source; not reproduced at runtime.

## Latest gate

- Gate not evaluated

## Decision pending

A gate and founder decision are still pending.
