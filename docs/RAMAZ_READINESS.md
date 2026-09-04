# Ramaz Classroom Readiness

Per D10: **nothing below is "classroom-proven."** That word is reserved exclusively for
experiences that have survived a real classroom session. Every row is an honest current rung
on the ladder below, not a promise of the next one.

**Ladder:** candidate → technically verified → gameplay-tested → classroom-ready candidate →
live-tested → classroom-proven.

| Surface / experience | Current rung | Remaining steps to a real classroom |
|---|---|---|
| Runtime (server/session infra) | technically verified + independently attacked (VERIFY_RUNTIME.md, VERIFY_ROUND2.md) — all 5 security/reliability findings fixed and re-confirmed | Deliberately exercise the PIN-lockout/unlock UI and a lost-teacher-key recovery flow live (flagged as untested in `runtime/README.md`); then a teacher dry-run alongside M1 L1. |
| M1 L1 "The Window" (THE SAME LINE) | **built, gate open** — 706/706 unit tests and the two-band browser e2e green 2026-09-04; economics sweep 8/9 properties, 4/4 mutants caught, P-VEC FAILS at `sacramento/cheap-room` (D58); no `/teach` director; nothing carries out of it yet | Close or restate the P-VEC gate honestly (D58 names the three admissible repairs); build the seed export and the M1 director (D59 C1/C6); teacher dry-run; live class. |
| M1 L2 "The Season" | NOT BUILT (D59) | Build Act 2 with the first Press Conference + Tape (D59 C2). |
| M1 L3 "The Deadline" | NOT BUILT (D59) | Froth, select, build the War Room and the Boardroom (D59 C3). |
| M1 first chain (Draft Day / Trade Deadline / Free Agency) | **superseded** per D48/D59 — deregistered 2026-09-04 | None. Files, tests and e2e scripts remain as history. |
| M2 L1 "Full House" | **classroom-ready candidate** — built per D20, gameplay STRONG across three independent rounds, TRANSFER READY, board privacy PASS, every rendered claim audited against the model (mutation-proven), 591-test suite + occlusion-aware e2e green at final head | Teacher dry-run, then a live class. Founder items: visual premium clause VERIFIED-UNMET (non-blocking; D20). Since: THE GATE CALL closes the dead air on the locked screen (D28); the renewals book is no longer one number across most of its dial (D29); THE DESKS names the room on the console (D34-D36); a pair arriving after the fifth bell is landed as an observer rather than left finding a desk. |
| M2 L2 "You Don't Play Alone" | **classroom-ready candidate** — built per D20, STRONG, TRANSFER READY, econ dissents discharged at the root (0/461 prescriptions contradicted across 1,395 independently-replayed rooms), privacy PASS | Teacher dry-run incl. the 12-desk board flow, then a live class. Watch item from play evidence: schedule variance can reward passivity in a single session. Since: THE GATE CALL (D28), THE ROOM (D30) and THE DESKS (D34-D36) on the console, and the rejoin PIN now survives a refresh (D33). |
| M2 L3 "Writing the Rule" | **classroom-ready candidate** — built per D20, STRONG, TRANSFER READY, BC-1 proven by independent computation, sealed vote reducer-enforced, Kings capstone two-press commit-then-reveal, all five gates' dissents discharged | Teacher dry-run incl. the L2→L3 linked-session flow and the not-adopted arm, then a live class. Since: THE ROOM reads the rule rounds and the season differently (D30); THE DESKS says NUMBER IN during the rounds and LOCKED during the season (D34); the rejoin PIN now survives a refresh (D33); a pair arriving after the last week closed is landed as an observer instead of stranded on "Finding your club...". |
| M2 module (former "Box Office" prototype) | superseded per D20 — the prototype lost the architecture war and its lesson was killed; `m2-box-office` deregistered from the lesson picker; module file kept as history | None — deregistration complete; `boxOffice.ts` and its tests remain in the tree as history. |
| M3 "Measuring Players" | NOT BEGUN | Design from objectives, first-principles (no legacy anchor — both legacy candidates discarded as quiz-theater); then the full M1 L1 sequence. |
| M4 "Draft Day" | queued, identity only (D2) | Not yet designed. Legacy anchors (`101-M4-L1` EV engine, Boss Sim NEGOTIATE mechanic) need code re-verification per D5 before any reuse. |

**Bottom line (2026-09-04, D59):** Module 1 was rebuilt (D48) and its first chain retired; only Week 1 of the new arc exists, and its economics gate is open. The old bottom line follows as history: Module 1 was a complete three-lesson arc of classroom-ready candidates —
L1 rosters become L2's content, and L1/L2's full books (dead cap included) become L3's free-agency
starting position, closing in a real module finale. Each lesson still needs a teacher dry-run
before a live class, and the L2→L3 linked-session flow should be part of that dry-run. Everything
else in the track needs more work than that. No experience anywhere in Track 101 has been run
with real students yet.
