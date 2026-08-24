# Ramaz Classroom Readiness

Per D10: **nothing below is "classroom-proven."** That word is reserved exclusively for
experiences that have survived a real classroom session. Every row is an honest current rung
on the ladder below, not a promise of the next one.

**Ladder:** candidate → technically verified → gameplay-tested → classroom-ready candidate →
live-tested → classroom-proven.

| Surface / experience | Current rung | Remaining steps to a real classroom |
|---|---|---|
| Runtime (server/session infra) | technically verified + independently attacked (VERIFY_RUNTIME.md, VERIFY_ROUND2.md) — all 5 security/reliability findings fixed and re-confirmed | Deliberately exercise the PIN-lockout/unlock UI and a lost-teacher-key recovery flow live (flagged as untested in `runtime/README.md`); then a teacher dry-run alongside M1 L1. |
| M1 L1 "Draft Day" | **classroom-ready candidate** — round-3 certification (VERIFY_ROUND2.md) confirms both round-2 blockers fixed live (cap-inviolable ADAPT budget; RISK BUFFER's claim now mechanically true, not asserted); 143/143 tests; rating STRONG | A teacher dry-run (a non-founder facilitator runs it start to finish, per V5's own "transfer" check), then a live classroom session. Nothing is classroom-proven until it survives that session (D10). |
| M1 L2 "The Trade Deadline" | play-designed only (PLAYABILITY_SPEC.md) | Build to the LessonModule spec; then technical verification, then an independent gameplay/economics/runtime gauntlet like L1 got; then dry-run, then live test. |
| M1 L3 "Why the Line Exists" | play-designed only (PLAYABILITY_SPEC.md) | Same sequence as L2 — build, verify, dry-run, live test. Depends on L2 shipping first (shared Roster Wall component, L2→L3 transition seam). |
| M2 "The Box Office" | technically verified (143/143 tests, real Playwright E2E LOBBY→SYNTHESIS) | Has not been through an independent gameplay/economics/runtime gauntlet the way M1 L1 has — commission one; then dry-run, then live test. |
| M3 "Measuring Players" | NOT BEGUN | Design from objectives, first-principles (no legacy anchor — both legacy candidates discarded as quiz-theater); then the full M1 L1 sequence. |
| M4 "Draft Day" | queued, identity only (D2) | Not yet designed. Legacy anchors (`101-M4-L1` EV engine, Boss Sim NEGOTIATE mechanic) need code re-verification per D5 before any reuse. |

**Bottom line:** L1 is furthest along — round-3 certified it a classroom-ready candidate — and
still needs a teacher dry-run before a live class. Everything else in the track needs more work
than that. No experience anywhere in Track 101 has been run with real students yet.
