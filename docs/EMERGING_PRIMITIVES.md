# Emerging Primitives

Patterns now observed across **both** built experiences (`m1l1-draft-day` and "The Box
Office"). Recorded for visibility only — per the founder's YAGNI discipline (kept from V5 as
guidance under D3: "extract a shared contract only after at least two products need the same
behavior," `docs/intel/V5_ARCHITECTURE.md` p.10), **nothing here is a call to extract a shared
library.** The runtime (`runtime/`) these two modules already share IS the extraction so far —
both are `LessonModule` implementations plugged into one server, one client shell, one contract.
Do not build a second abstraction layer on top of it until a genuinely different experience
(different subject, different session shape) proves the current contract doesn't already fit.

## Observed primitives

1. **`LessonModule<TState>` contract** — one object per lesson: `phases`, `initialState`,
   a pure `reduce(state, action, ctx)`, and three view functions (`studentView`, `teacherView`,
   `boardView`) plus `aggregate`. The runtime never inspects `TState`. (`runtime/src/shared/
   lessonModule.ts`)
2. **Canonical phase vocabulary** — `LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ADAPT →
   COUNTERFACTUAL → ARGUE → SYNTHESIS → COMPLETE`. Both modules declare an ordered subsequence
   of this fixed list; neither reorders it. (`runtime/src/shared/phases.ts`)
3. **Franchise/market-card identity + privacy-safe reveals** — each seat gets a deterministic,
   attributable (never `Math.random()`) fictional identity (franchise name in Draft Day, one of
   four Market Cards in Box Office) so a class-wide reveal is ownable without exposing real
   names. `boardView` is structurally never handed a `seatId` in either module.
4. **Class-aggregation → board reveal** — both modules compute a server-side `aggregate`/
   `boardView` (Class Gallery bars; Class Scatter) that populates live as seats lock, rendered
   on a dedicated `/board` projector surface neither legacy candidate runtime had.
5. **Concept-card synthesis citing session data** — both modules' SYNTHESIS stage renders
   named economics-concept cards whose body copy is generated from this session's own
   aggregate numbers, not canned text (verified in VERIFY_ECONOMICS.md; same shape in Box
   Office's synthesis-from-scatter design).
6. **Teacher-key auth on control/teacher views** — a per-session bearer token, issued once at
   `createSession`, gates `POST /control` and `GET .../teacher` (added post-VERIFY_RUNTIME.md,
   R1; carried by both modules since it lives in `sessionService.ts`, not per-module code).
7. **Snapshot persistence** — one `SnapshotRepository`: in-memory Maps as source of truth,
   atomic temp-file + rename writes, corrupt-file quarantine-and-boot-fresh. Module-agnostic;
   both modules' state round-trips through the same store.
8. **Polling transport** — all three surfaces (`/teach`, `/play`, `/board`) poll a versioned
   state endpoint with ETag/`If-None-Match`, chosen over SSE/WebSockets for classroom-Wi-Fi
   resilience (`runtime/README.md`). Shared by both modules unconditionally.
9. **Action outbox** — client-side durable-first action queue (`src/client/shared/outbox.ts`):
   write before send, one in flight, drop on definitive rejection, retry on network failure.
   Shared client-side plumbing, not per-module.

## Not yet extracted, and why that's fine

- No client-side module registry — `/play` and `/teach` still special-case each module's view
  shape by hand (`runtime/README.md`, "Known gaps"). A third module would need its own render
  function written, not a generic renderer plugged in.
- No shared "synthesis card" component — each module computes and formats its own cards from
  its own aggregate shape.

These are exactly the kind of premature-generalization traps D3/V5_PROSECUTION.md warn
against (building a platform before two real, differently-shaped products justify one). Two
modules sharing a runtime is not yet "two products needing the same behavior" in the sense that
threshold means — revisit only when a third module's needs actually strain the current
contract.
