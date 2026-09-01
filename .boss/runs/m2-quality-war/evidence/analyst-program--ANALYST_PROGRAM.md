# evidence-review

| Claim (program) | Boss evidence id / locus | Verdict |
|---|---|---|
| Every product dissent discharged by its owning critic; one founder item open | events.jsonl 30 substantive `DissentRecorded`, 29 `DissentResolved`; `visual-l1-premium-unmet` (seq 270) open | **CONFIRMED (observed).** 26 further `*-dissent` events are role-completion markers (empty `evidenceIds`), never resolvable; not product debt |
| Every resolution cites an owning-critic discharge line that exists | all 29 resolutions vs `docs/gauntlet/module-2/GATE_*.md` | **CONFIRMED for 28 (observed).** I located each quoted line (e.g. `GATE_L3_ECON.md:807,818`; `GATE_L3_PLAY.md:383`; `GATE_L2_PLAY.md:862`; `GATE_L1_PLAY.md:1198`). Wave-1's two are kill-resolutions, correctly not critic discharges |
| Wave-3 provenance violation (`proj-l1-cf-pager-label`) fixed | ANALYST_WAVE3:8; `w4-projector-adj`; `GATE_L1_PROJECTOR.md:564-659` | **CONFIRMED IN SUBSTANCE, FAILED IN LEDGER.** The owning projector critic did rule (SATISFIED, live, four groups). But the pinned artifact `w4-projector-adj--GATE_L2_PROJECTOR.md` does **not** contain the ruling (grep: 0 hits for "L1 PAGER INTENT"/"cf-pager"). The ruling exists only in an unpinned working-tree doc; seq 210's improper resolution was never superseded |
| Visual premium carried as UNMET, ledgered | seq 270 (actor `visual-experience-director`, blocking); D20:258-260; RAMAZ:16 | **CONFIRMED (observed).** Predecessor's finding genuinely closed, not laundered |
| TRANSFER READY on all three | `GATE_L1_TEACHER.md:696`, `GATE_L2_TEACHER.md:439`, `GATE_L3_TEACHER.md:457`; RoleCompleted 143/257/374 | **REFUTED as stated (observed).** Only L3's verdict postdates its last repair. See biggest-failure |
| All three STRONG, final rating lines unqualified | `GATE_L1_PLAY.md:1171`, `GATE_L2_PLAY.md:838`, `GATE_L3_PLAY.md:381` | **CONFIRMED (observed).** Each is the doc's last rating, followed only by its DISCHARGED line |
| "Every rendered claim on any surface is a computed, audited atom … mutation-proven" (D20:253) | `GATE_L3_ECON.md:830-835` (W5-1/W5-3), `w5-econ-confirm` | **REFUTED (observed).** Owning critic at final head: "Rendered-but-unregistered prose is still structurally invisible to the audit… W5-1 and W5-2 narrow it; they do not close it"; "Two of my novel drifts survive today" |
| Final sweep at true final head; M1 L3 flake honest | `final-suite` 13:14:33 (458/458, exit 0), `final-e2e-m2l1/2/3` exit 0, `final-e2e-m1l3` **exit 1**, `-retry` exit 0; last builder evidence `l3-e2e-w5` 13:02 | **CONFIRMED (observed).** Sweep postdates all wave-5 code evidence; the failure is on the ledger with full stderr. D20:272 lists only the retry id — omission, not concealment |
| Killed Box Office lesson removed from product | `server/index.ts:26`, `http.ts:155` (`GET /api/lessons` → `/teach` picker), RAMAZ:19 | **REFUTED (observed).** `m2-box-office` is registered and selectable; RAMAZ calls it "dormant" |
| `runtime/README.md` accurate (CLAUDE.md §14) | README:4 ("313 passing"), :729 ("452 tests, 452 passing") vs 458 at head; 0 hits for flake/race | **REFUTED (observed).** Two stale counts; M1 L3 flake undisclosed there |
| Any suite re-executed by me | — | **NOT VERIFIED.** Bash disabled; every exit code is read from stored records |

# disproof-attempts

**(1) Provenance sweep, all 85 dissent events.** Waves 4/5 are clean: each resolution (289, 304, 309, 317, 336, 366, 369, 373, 397, 400, 401) quotes a line I located verbatim in the named gate doc, authored by the owning critic, with a matching hash-chained `RoleCompleted`. One artifact/label mismatch remains (row 3 above).

**(2) Predecessors.** ANALYST_WAVE3's (a) fixed in substance; (b) fixed properly; (c) fixed. Its **finding #4 (stale proof after shared-file edits) recurred a third time** — this wave as a stale *human* verdict rather than a stale browser run.

**(4) Rung inflation.** None. TRACK_101_MAP:10-12 and RAMAZ:16-18 all read "classroom-ready candidate"; D10 language intact.

**(6) Documentary contradiction hunt (my chosen disproof).** Two D20 sentences exceed their own gate docs: the "every rendered claim… mutation-proven" clause (above), and "not a Module 2 regression" — `E2E_L3_FLAKE_NOTE.md:15-16` still attributes the 1/6→3/6 rise to "machine load", the exact unmeasured claim ANALYST_WAVE3:21 refuted (n=6, no power) while naming a live mechanism (L2 ships inside the same `client/play/main.ts`). Uncorrected.

# biggest-failure

**Teacher Transfer — a founder invariant — is claimed unqualified for three lessons but re-affirmed at head for only one.** L2's `TRANSFER: READY` (RoleCompleted 257, 06:4x) was issued *before* `proj-l2-bar-timing` was even raised (264, 06:44) and before wave 4 repaired two blocking teacher-facing defects: W4-2, the `/teach` stage-5 mirror printing byte-identical copy across all four arms, and W4-1's false lock-count line (seq 288-304), plus the play critic's N-6 weeks-2/3 layout redesign (seq 292). No teacher-transfer role was activated after 06:32 for L2 — `GATE_L2_TEACHER.md` ends at line 441 with no W4 section. L1 is the same shape: READY at seq 143 (wave 2), then wave-3 `/teach` group-pager copy and fold repairs, no re-check. ANALYST_WAVE3:41 demanded exactly this be marked provisional; instead resolution 318 asserts "TRANSFER READY was reconciled… before the teacher verdict was relied on" — a lead-integrator narrative with no owning-role artifact, and temporally inverted. That is the wave-3 provenance defect repeated on the highest-stakes verdict. Partial mitigation (observed): the projector critic drove the repaired `/teach` mirror live and found it arm-specific and matching the board (`w4-projector-final`) — truthfulness verified, *runnability by a random teacher* not.

# recommendation

**REPAIR — narrow, bounded, ~one wave; do not send the ship case as written.** Not ROLLBACK (no observed regression: 458/458, all M2 e2e exit 0 at head, M1 unaffected). Not KILL (no owning critic states a kill condition; three independent STRONG ratings and root-cause econ discharges are real). Not PASS while D20 and RAMAZ assert claims their own gate docs contradict.

Required (all cheap): (1) fresh-context teacher-transfer re-checks of L1 and L2 at final head, or downgrade both docs to "TRANSFER READY — L3 at final head; L1/L2 verdicts predate later teacher-copy repairs, not re-affirmed"; (2) soften D20:253 to the econ critic's own W5-3 wording; (3) soften the flake note to "pre-existing race; rate change unresolved" and name the shared-client mechanism; (4) pin `GATE_L1_PROJECTOR.md` as evidence; (5) deregister `boxOfficeModule` or restate RAMAZ:19 ("selectable in the `/teach` picker", not "dormant"); (6) correct README:4/729 to 458 and add the M1 L3 flake to Known gaps.

**Remaining risk for the founder (honest list).** Above all: **no real students, ever — nothing is classroom-proven (D10)**; every rung is a candidate. Then: no teacher has run any of this (dry-run required, and for L1/L2 the transfer verdict is now stale); visual premium VERIFIED-UNMET by its own director, second reviewer never commissioned; M1 L3 e2e fails ~1-in-3 at head from a real client race a student click can hit; rendered-but-unregistered prose still invisible to the claim audit (two of the critic's novel drifts survive); L2 schedule variance can reward passivity in a single session (RAMAZ:17); projector optics/CVD as actually projected and Chromebook performance budget unverified; 12-desk L2 played at 6 desks by the critic; killed Box Office lesson still selectable.

**DO NOT SPEND ON:** a fourth visual re-grade (founder decision, not a wave) · re-litigating architecture, the L2 kill condition, or any STRONG rating · fixing the M1 L3 race inside this program (bounded M1 ticket) · new tuning properties beyond W5-1/W5-2 · SR MODERATE-5/MINOR-6..8, econ R5-R7, non-blocking backlogs · any rung change short of a real class.

**Formal dissent, blocking, gate-recommendation:** I dissent against a PASS that carries "TRANSFER READY on all three" and "every rendered claim… mutation-proven" unqualified. A decision to proceed does not erase this.
