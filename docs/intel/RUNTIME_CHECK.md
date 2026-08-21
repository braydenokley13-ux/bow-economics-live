# Runtime Check — 101-pre-course vs. bow-finlit, Head-to-Head

**Method.** Both candidates were built and run this session, not read cold.
`101-pre-course` was cloned (already present at
`/home/user/braydenokley13-ux/101-pre-course` with a valid HEAD — reused, not
re-cloned), installed, built, launched, and driven through a real multi-client
session via its own smoke script plus hand-written curl concurrency tests.
`bow-finlit` (`/home/user/bow-finlit`) was re-verified in place: its test
suite was re-run fresh this session (not just cited from
`REALITY_CHECK.md`), and its runtime modules were read for extractability.

---

## STEP 1 — 101-pre-course, build-verified

**Install/build:** clean. `npm run build` compiled with zero errors, produced
24 routes (13 API routes, 6 pages), no type errors.

**Session drive-through (real, not simulated):**
- `npm run test:smoke` (the repo's own end-to-end script: boots a dev server,
  then runs a full API flow) — **passed**: create session → two students join
  the same team → split vote produces a `tie-break` status → re-vote resolves
  the mission → mission 2 (`contract-choice`) unlocks → resolving it flips
  `requiresCatalog: true` and unlocks the `cap` concept gate.
- Independently, I started my own dev server (port 4200) and drove it with
  raw curl as a second/third "client": created a fresh session, then fired
  **10 concurrent join requests** at one team code. All 10 succeeded with
  distinct student IDs and zero data loss — verified by reading
  `data/store.json` directly (10/10 students present) and cross-checked
  against `/api/teacher/feed` (teacher dashboard correctly reports
  `studentCount: 10`). `/api/teacher/export.csv` returned HTTP 200.

**What works:** the full student join → vote → tie-break → resolve → concept
gate → teacher feed → CSV export loop is real and functions correctly under
concurrent load, at least within one Node process. Vote resolution, mission
progression, and the concept-catalog gate are genuine server-enforced logic
(not just UI state).

**Where it breaks / architectural gaps found by inspection, not by claim:**
- **Storage is a single JSON file** (`data/store.json`, or `/tmp/bow-sports-capital-store.json`
  on Vercel), serialized in-process by a promise-chained `mutationQueue`. That
  queue is why my concurrency test passed — it works *within one Node
  process*. On Vercel's default serverless model, concurrent requests can be
  routed to separate function instances, each with its own `/tmp`; the queue
  provides no cross-instance protection. This is not tested here (no Vercel
  deploy in scope) and I am not claiming it fails in production — but there is
  no README, no `vercel.json`, and no deployment doc addressing it, unlike
  `bow-finlit`'s documented Supabase-backed persistence. This is the single
  biggest undocumented risk in the repo.
- **No phase-gating vocabulary.** Grepped `app/` and `lib/` for
  `phase|freeze|pause|display|projector` — zero matches outside irrelevant
  noise. Progression is tracked as `missionIndex` per team with no
  server-authoritative class-wide phase (`lobby → live → paused → closed`,
  V5 p.116); there is no facilitator PAUSE/FREEZE control, and no dedicated
  class-display/projector route (`/teacher` is a data dashboard, not a
  presentation surface).
- **No resume-PIN / cross-device resume.** `resume`/`pin` hits in grep were
  false positives (`pingStudent`, a bare heartbeat). A student who loses their
  browser tab has no credentialed way back into their exact seat — the smoke
  test and my session never needed to exercise reconnect because the flow has
  no reconnect path to test.
- **No offline write-queue.** The `mutationQueue` in `lib/store.ts` is a
  server-side JS promise chain that serializes disk writes; it is not a
  client-side durability layer for a flaky classroom Wi-Fi connection.

**Net for Step 1:** the golden path is real, tested, and works. The
live-classroom-specific hardening V5 requires (phase gate, PIN resume,
freeze/recover, offline queue, class display) is absent, not merely unpolished
— it was never built.

---

## STEP 2 — bow-finlit as an architecture donor

**Re-verified fresh this session:** `cd bow-financial-futures-sim-starter/app
&& npm test` → **471 tests, 471 passing, 0 failing**, in 18.2s, right now (not
cited from an earlier pass). This matches `REALITY_CHECK.md` Claim 3 exactly.

**Module-by-module extractability, read directly, not inferred:**

| Module | File(s) | Extractable? |
|---|---|---|
| PIN hashing / session crypto | `api/_lib/crypto.ts` (142 lines) | **Clean.** Pure `node:crypto` (scrypt PIN digest, HMAC session cookie, SHA-256 token hash, constant-time compare). Zero finlit imports. Portable as-is. |
| Repository / persistence abstraction | `api/_lib/repository.ts` (215 lines, interface), `memory-repository.ts` (284), `supabase-repository.ts` (428) | **Clean pattern, content-tinted schema.** The `Repository` interface + swappable memory/Supabase backends is the exact pattern 101-pre-course lacks. Row types (`ClassRow`, `RunRow`) carry finlit fields (`agencyName`, `growthResultId`) alongside generic ones (`phase`, `paused`, `currentStep`, `stateVersion`) — the interface shape ports cleanly, the row schema needs field renames. |
| Phase gating | `shared/classroom.ts` `CLASS_PHASES`/`PHASE_CEILING`/`allowedStepCeiling`/`gateReasonFor` (~150 of 523 lines) | **Mechanism is clean, data is not.** The gate *algorithm* (phase index, ceiling-per-phase map, pause/complete override, gate-reason lookup) is generic and well-isolated. The `StepId` union (35 literal step names: `s1-takehome`, `s2-camp`, `s3-boxes`...) and `GATE_COPY` text are 100% finlit narrative content — a Track 101 port replaces the step list and copy, keeps the functions. |
| Teacher/founder controls | `api/_lib/service.ts` `handleClassControls` (~100 lines) | **Mostly clean.** Auth-gated phase PATCH, pause toggle, `joiningOpen` toggle, archive — generic control-room verbs matching V5's control semantics. One finlit-specific side effect (auto-logging `surprise_revealed` events on two named phases) generalizes to a generic "reveal" event with minor rework. |
| Room/display aggregation | `service.ts` `dashboardFor` → `readClassRoom` (`class-read.ts`, 332 lines) | **Partly clean.** Produces both a per-student roster view and a single aggregated "room" view in one call — the aggregation pattern is reusable; the fields it aggregates (`agencyName`, step labels) are content-specific. No dedicated visual "display/projector" screen exists in this repo either (`app/src/screens/` has `founder.tsx` but no `display.tsx`) — this is a gap shared with 101-pre-course, not a finlit advantage. |
| Join / resume | `api/class/join.ts`, `resume.ts` → `handleJoin`/`handleResume` in `service.ts` | **Clean mechanism, content-named fields.** Class-code join + 4-digit resume-PIN + opaque access-token-on-resume (so the PIN never travels twice) is a fully generic, well-documented flow. Field names (`agencyName`) need renaming for a sports-economics team/room concept. |
| Offline write reliability | `app/src/net/save-coordinator.ts` (615 lines) | **Clean and high-value.** A desired-state/client-revision vs. acknowledged-server-version reconciliation model with 409-rebase, local-storage durability across reconnect, and retired-credential handling. Operates on generic "run state," not finlit fields. This is the single most expensive-to-redo asset in the repo and the cleanest port candidate. |
| Session/economy content | `config/`, `shared/session1`, `shared/venture`, `run-state.ts` evaluation/scoring (`evaluate`, `checkCompletable`, `CategoryId`) | **Not extractable — finlit-coupled by design.** This is the financial-literacy content and scoring rubric itself; irrelevant to a sports-economics runtime except as a worked example of "how a scoring module plugs into the gate."

**Effort estimate to stand up a Track 101 runtime on this pattern** (not a
port — a fresh build using the pattern): the crypto layer, repository
interface, and save-coordinator are near-zero-rework lifts (~1 day to adapt
and re-test three files totaling ~1,000 lines). The phase-gate mechanism and
join/resume handlers are a content-swap exercise (~2-3 days: replace `StepId`/
`GATE_COPY`/row-schema field names with Track 101's lesson/mission vocabulary,
re-run the equivalent of the 471-test suite against new content). The class
display/projector surface does not exist in either candidate and is new work
regardless of foundation (~2-3 days). Total: a working, tested Track 101
three-surface runtime (Player/Teacher/Display) on this pattern is a
**1.5-2 week build**, not a weeks-long rewrite from zero — because the hard
parts (crypto, persistence abstraction, phase gate, offline reconciliation)
are proven, tested code to adapt rather than design from scratch.

---

## Direct comparison

| | 101-pre-course | bow-finlit |
|---|---|---|
| Builds clean | Yes (verified) | Yes (471/471 tests, verified fresh) |
| Multi-client session drive-tested this session | Yes (smoke script + 10-way curl concurrency) | Tests re-run fresh; live session not re-driven (already proven at 471/471 by a server-authoritative test suite covering join/resume/phase-lock/reveal) |
| Persistence | Single JSON file, single-process-safe only (undocumented multi-instance risk) | Repository interface, Supabase-backed, memory-backed for tests |
| Phase gating | None | Server-authoritative, generic mechanism + finlit-specific data |
| Resume-PIN | None | scrypt-hashed 4-digit PIN + token-on-resume |
| Offline queue | None | 615-line reconciliation model, tested |
| Class display/projector surface | None | None (gap shared by both) |
| Content coupling of runtime code | N/A — already sports/Track-101-shaped | Real but concentrated in named files (`StepId`, `GATE_COPY`, `config/`, `run-state.ts` scoring) |
