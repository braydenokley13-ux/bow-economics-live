# BOW Economics — Track 101 Live-Session Runtime

**Status: candidate.** Technically verified — the server logic is covered by
real tests (46 passing, see below), `npm run build` and `npm test` are
green, and the three surfaces have been smoke-tested end-to-end by hand
(create → join → advance → pick → reveal → teacher aggregate → board tally →
restart-survival). It has **not** been gameplay-tested and it has **not**
been run in a classroom, or anything resembling one. Per Decision D12, this
runtime must pass an independent fresh-context verification gauntlet
(refresh, reconnect, duplicate joins, late joins, bad state, Chromebook-class
load) before it is used in a real session.

This package builds the **runtime the gameplay team plugs a lesson into** —
it ships zero real Track 101 content. The one lesson included, `lobby-demo`
(students tap a color, teacher reveals the class distribution on the
board), exists only to prove the loop end-to-end.

## Running it

```
npm install
npm run dev
```

Then open `http://localhost:4300/teach` (or the machine's LAN IP for
students/projector on other devices), `/play`, and `/board`. `npm run build`
compiles; `npm start` runs the compiled build without rebuilding; `npm test`
builds and runs the test suite. No database, no external service, no
internet access required — everything lives in one Node process on one
machine, as D12 requires.

## Architecture

Three static-file surfaces (`/teach`, `/play`, `/board` — plain HTML +
vanilla TypeScript compiled to browser-native ES modules, no UI framework)
talk to one JSON HTTP API served by a single `node:http` server (`src/server/
http.ts`). There is no client bundler: the TS compiler is configured with
`module: NodeNext`, so its output is already standard ES modules with the
explicit `.js` import extensions both Node and browsers require — one
compiler, zero extra build tooling, for both server and client code.

```
src/
  shared/       phases.ts, lessonModule.ts   — the contract (below)
  server/       crypto.ts, repository.ts, snapshotRepository.ts,
                sessionService.ts, http.ts, index.ts
  modules/      lobbyDemo.ts                 — the proof-of-loop lesson
  client/       teach/, play/, board/, shared/ (api, poll, storage, outbox)
  test/         46 tests over crypto, the reducer, the service layer,
                and snapshot persistence
```

**Session store.** `SnapshotRepository` (`src/server/snapshotRepository.ts`)
is in-memory Maps as the source of truth, with every mutation queued onto a
single write-chain that serializes writes to a JSON file: write to a temp
file, then `fs.rename` over the real path — atomic on the same filesystem, so
a crash mid-write leaves the old snapshot or the new one, never a corrupt
half-write. On boot, the file is loaded back into memory if present. This
was tested directly: 10 sequential session creates followed by a read-back
parse, and a full "kill the process, start a new `SnapshotRepository`
pointed at the same file" simulation that confirms phase, version, and seat
data all survive.

**Transport: short-interval polling with ETag/If-None-Match, not SSE or
WebSockets.** All three surfaces poll a versioned state endpoint (1–1.5s for
`/teach` and `/play`, 1s for `/board`) with `If-None-Match`; an unchanged
session answers `304` with an empty body. This was chosen deliberately over
a push transport:

- A real classroom AP is exactly the environment most likely to silently
  kill a long-lived connection — idle timeouts, captive-portal-style
  proxying, a laptop that sleeps and wakes on a different channel. SSE and
  WebSockets need reconnect logic to recover from that; polling's failure
  mode is *already* "try again next tick," with no separate reconnect path
  to write, test, or get wrong live in a classroom.
- At ~35 clients polling every 1–2s, that is roughly 20–35 requests/second
  against one Node process serving small JSON payloads (a `304` has no
  body) — trivial load, so the "keep a persistent connection open"
  argument for SSE/WS buys nothing at this scale.
- `/board`'s "auto-reconnect" requirement and `/play`'s "instant resume"
  requirement both fall out of the same mechanism for free: there is
  nothing to "reconnect," a poll either succeeds or it doesn't, and the next
  one fires on schedule regardless (`src/client/shared/poll.ts`).

The one place this deliberately does *not* use polling is action
submission — `POST .../actions` and `POST .../control` are sent immediately
on interaction, not queued for the next poll tick.

## Adapted from bow-finlit — what and why (D10: nothing here is proven by
donor pedigree; each choice is justified on its own)

| Donor module | Verdict | What happened |
|---|---|---|
| `api/_lib/crypto.ts` | **Ported, trimmed.** | scrypt PIN hashing, SHA-256 token hashing, and the readable-join-code generator carried over close to verbatim (`src/server/crypto.ts`) — pure `node:crypto`, zero finlit coupling in the original. The founder-session HMAC cookie signer was **dropped**: this product is one teacher on one laptop running the server for their own class; there is no second party to authenticate, so a signed session cookie protects nothing. If a hosted multi-teacher deployment appears later, the donor's pattern is what to bring back. |
| `api/_lib/repository.ts` | **Adapted.** | The interface shape — typed rows, a patch type, a version-conflict-as-value update result — ports directly (`src/server/repository.ts`); that shape is what lets `sessionService` be unit-tested with no server running. The concrete backend does not port: the donor pairs this interface with Supabase, which D12 rules out entirely (no external DB, no cloud). The one implementation shipped, `SnapshotRepository`, is new. |
| `shared/classroom.ts` phase gate | **Adapted, not ported.** | The donor's gate is a fixed 35-item `StepId` union with a hand-authored per-phase ceiling map — exactly the shape the LessonModule contract cannot use, since lessons declare their phase list at *registration* time, not compile time. What carried over is the algorithm's spirit: one phase position, an action must match the session's current phase (no queued future actions, no stale replays), a hard stop while paused/frozen/ended. See `SessionService.assertActionable` and `.control()` in `src/server/sessionService.ts`. |
| `app/src/net/save-coordinator.ts` | **Adapted in concept, reimplemented much smaller.** | The donor reconciles repeated saves of *one continuous state blob* with a revision/rebase model, because a queued write can go stale mid-flight and must be re-derived rather than replayed. Track 101 student actions are discrete one-shot commands (tap a color), not continuous edits — there is no "newer local edit" to rebase a stale one onto, so that machinery has nothing to attach to. `src/client/shared/outbox.ts` keeps the parts that do generalize: durable-first (write before send), one in flight at a time, drop a definitive rejection instead of looping forever, retry a network failure on a timer and on `online`. Full reasoning is in that file's header comment. |
| `api/_lib/service.ts` teacher controls | **Adapted.** | Auth-gated phase PATCH / pause / reveal generalizes to `SessionService.control()`'s advance/reveal/pause/freeze/hook/end/restore. The donor's one finlit-specific side effect (auto-logging a named event on two hardcoded phases) is dropped — nothing here needs an event log yet. |
| `shared/classroom.ts` `StepId`/`GATE_COPY`, `config/`, `run-state.ts` scoring | **Dropped entirely.** | This is bow-finlit's actual lesson content and copy — not reusable for a different subject by design, and out of scope for a runtime that is supposed to be content-agnostic. |
| A dedicated projector/display surface | **New, not in either candidate.** | Neither `101-pre-course` nor `bow-finlit` has one (RUNTIME_CHECK.md). `/board` (shell in `src/client/board/`, data in `SessionService.boardView`) is built from scratch against the LessonModule contract, with distinct REVEAL and SYNTHESIS presentation modes. |

## The LessonModule contract (for the gameplay team)

A lesson is one object implementing `LessonModule<TState>`
(`src/shared/lessonModule.ts`), registered once via
`service.registerModule(myModule)` in `src/server/index.ts`. The runtime
never inspects `TState` — it stores whatever the module returns and calls
the module's own view functions to render each surface.

```ts
interface LessonModule<TState> {
  id: string;
  title: string;
  phases: readonly CanonicalPhase[];       // an ordered subset of the vocabulary below
  initialState(input): TState;
  reduce(state, action, ctx): { ok: true; state: TState } | { ok: false; reason: string };
  allowedActions(phase): readonly string[]; // docs/UI hint only — reduce() is the real gate
  studentView(state, seatId, phase): unknown;
  teacherView(state, phase): unknown;
  boardView(state, phase): unknown;
  aggregate(state, phase): unknown;
}
```

**Canonical phase vocabulary** (`src/shared/phases.ts`):
`LOBBY → HOOK → PLAY → REVEAL → CONSEQUENCE → ADAPT → COUNTERFACTUAL → ARGUE
→ SYNTHESIS → COMPLETE`. A lesson's `phases` must be a strictly increasing
subsequence of this order (`isOrderedSubsequence`, enforced at
`registerModule` time) — a lesson can skip phases (`lobby-demo` uses
`LOBBY, PLAY, REVEAL, SYNTHESIS, COMPLETE`) but cannot reorder them.

**What the runtime guarantees, so a module doesn't have to:**
- An action is only ever handed to `reduce()` while the session is not
  ended, not frozen, not paused (`assertActionable`); a module's own
  `reduce` is responsible for checking the action is valid for `ctx.phase`.
- Every state mutation is applied via optimistic concurrency
  (`Repository.updateSession`'s `expectedVersion`), so two near-simultaneous
  writes can't silently clobber each other.
- The teacher's **advance** control walks `phases` in order; **reveal**
  jumps straight to a `REVEAL` phase if the module declares one; **pause**
  is a resumable hold; **freeze** is a harder stop (implies pause) meant as
  the moment before **one-click recovery**; **hook** forwards to `reduce()`
  as a synthetic `{ type: "teacher:<hookName>" }` action — a module that
  wants a shock-event or rerun-counterfactual button handles that type
  itself and rejects anything it doesn't recognize (see `lobbyDemo.ts`'s
  comment for why it deliberately implements none).
- **Restore last good state**: before every `advance`/`reveal`/`freeze`/
  `hook`, the runtime snapshots `(phase, state, paused, frozen)` as a
  checkpoint; `control({type:"restore"})` reverts to it atomically. One level
  of undo, not a full history — deliberately simple.
- `boardView` must never return anything seat-identifying; this is
  structurally true today because `boardView(state, phase)` is never handed
  a `seatId` at all.

## Tests

```
npm test
```

**46 tests, 46 passing** (`node --test`, no test framework dependency).
Coverage: PIN/token crypto round-trips (`crypto.test.ts`); the `lobby-demo`
reducer/aggregate/views including rejected malformed and out-of-phase
actions (`lobbyDemo.test.ts`); atomic writes and restart-survival
(`snapshotRepository.test.ts`, including an optimistic-concurrency-conflict
case); and the full service layer — session create, join, **duplicate-join**
(same name twice is rejected, not silently duplicated), device-token
**resume**, rejoin-PIN token rotation, the **phase gate** (LOBBY blocks an
action PLAY allows; paused/frozen/ended each reject with the right status),
**action validation** (malformed payloads and retired tokens rejected
before or by the reducer), and every teacher control including checkpoint
**restore** (`sessionService.test.ts`).

`npm run build` and `npm test` are both green as of this writing.

## Dependencies

Zero runtime npm dependencies. Dev-only: `typescript`, `@types/node`. This
was a deliberate choice for cold-start speed on a teacher's laptop and to
avoid an entire class of "does this still work on this Chromebook/Node
version" risk — the HTTP layer is a small manual router
(`src/server/http.ts`) over `node:http`, justified there as reasonable
specifically because the route table is small and fixed (a dozen API routes,
three static pages), not a general-purpose framework being reinvented.

## Known gaps / not yet done

- No client-side module registry — `/play`'s and `/teach`'s renderers
  special-case `lobby-demo`'s view shape (with a generic JSON-dump
  fallback for anything else). Adding a second real lesson module means
  writing its render function too; the *server* contract is fully generic
  today, the client shell is not yet.
- No teacher authentication of any kind (by design — see the crypto-layer
  note above) and no rate limiting on rejoin-PIN attempts. Fine for a
  single trusted classroom LAN; would need attention before anything
  more exposed.
- `SnapshotRepository` keeps every session/seat ever created in memory for
  the process lifetime — there is no archive/prune path. Not a problem at
  classroom scale (one class, a handful of sessions per day), worth
  revisiting for a long-running deployment.
