# BOW Economics — Track 101 Live-Session Runtime

**Status: candidate.** Technically verified — the server logic is covered by
real tests (216 passing, see below), `npm run build` and `npm test` are
green, and both `m1l1-draft-day` and `m1l2-trade-deadline` have been driven
end-to-end with Playwright against the real compiled server (L1: create →
join → advance → build → lock → reveal → shock → adapt → repair → synthesis
→ complete; L2: `runtime/scripts/e2e-l2.cjs` — L1 played for real through the
API to produce a genuine seed, then linked L2 creation, claiming, all three
deadline paths incl. competing bids and a loss, teacher-staged reveal,
aftermath rescue, synthesis, zero console errors) as well as smoke-tested by
hand for restart-survival. It has **not** been gameplay-tested by a fresh
student audience and it has **not** been run in a classroom, or anything
resembling one. A first fresh-context verification round already ran against
this runtime's L1 (see `docs/gauntlet/module-1/VERIFY_GAMEPLAY.md`,
`VERIFY_ECONOMICS.md`, `VERIFY_RUNTIME.md`) and every required repair from
that round has been applied — see "Repair charter round 1" below. Per
Decision D12, a live classroom session still requires an independent
fresh-context verification pass on this state before use.

This package builds the **runtime the gameplay team plugs a lesson into**,
plus real Track 101 lessons: `m1l1-draft-day` (Module 1, Lesson 1 — "Draft
Day"), the Roster Wall / salary-cap build described in
`docs/gauntlet/module-1/PLAYABILITY_SPEC.md`; `m1l2-trade-deadline` (Module
1, Lesson 2 — "The Trade Deadline"), which carries a completed L1 session's
locked rosters forward (see below) and adds a midseason report, stand
pat/veteran/sealed-bid deadline decisions, and a teacher-staged reveal; and
`m2-box-office` (Module 2 prototype, price-setting under hidden demand).
`lobby-demo` (students tap a color, teacher reveals the class distribution on
the board) also still ships, unchanged, as the minimal proof the runtime
itself is genuinely lesson-agnostic.

## Module 1, Lesson 2 — The Trade Deadline (L1→L2 carry-forward)

`src/modules/tradeDeadline.ts`. Each L2 franchise picks up exactly where its
L1 roster left off: a midseason report (deterministic — a market bust reads
as slumping, a gem as breaking out, computed off L1's own price/rating data,
never `Math.random`), then one irreversible deadline decision — **stand
pat** (an explicit, reasoned lock), **cut + sign a known veteran** (safe,
dead-cap bite), or **cut + sealed bid** on a scarce, teacher-revealed target
against a hidden rival bid *and* a hidden seller reserve (a lowball never
wins). A team that cuts and loses its bid keeps the dead-cap hit and a real
open slot, rescued only in a restricted ADAPT window — full-wall teams get
nothing to do there, closing the "wait and see" exploit.

**The seed.** The runtime itself stays lesson-agnostic: `POST /api/sessions`
takes an optional `sourceSessionId`; the server resolves it to that other
session's own `{lessonModuleId, state}` and hands it to the new module's
`initialState` as an opaque `seed` (`shared/lessonModule.ts`). Only
`tradeDeadline.ts` (`extractCarriedFranchises`) knows what a
`m1l1-draft-day` seed means — it reads every *locked* L1 team, silently
skips anything invalid (never locked, a slot still empty from an unrepaired
shock, a corrupted id), and turns the rest into claimable franchises
students pick up by name/crest on `/play`. A missing/unlinked/malformed seed
just yields an empty pool — every seat then gets an honest, deterministic
stock "expansion franchise," so the lesson runs standalone too. `/teach`
exposes this as a "link to a completed Draft Day session" dropdown at
create-session time.

## Repair charter round 1 (post-verification)

A fresh-context verification round produced three rulings — gameplay
FUNCTIONAL (below the STRONG bar), economics SOUND WITH REQUIRED REPAIRS,
runtime ACCEPT WITH REQUIRED REPAIRS — and every required repair from all
three has been applied to this codebase:

- **Runtime:** a per-session teacher key now gates `/control` and the
  teacher view (closing a gap where any student holding only the join code
  could pause/skip/end the session or read every team's private build
  pre-reveal — see "Teacher authentication" below); `restore` can revive a
  session the teacher ended by mistake; rejoin-PIN attempts lock a seat out
  after 5 failures until the teacher clears it; a corrupted snapshot file is
  quarantined and the server boots fresh instead of crashing the whole
  classroom.
- **Gameplay/economics (`m1l1-draft-day`):** the player market was redesigned
  so price correlates with value but never determines it (closing a real
  "buy the priciest thing" false lesson and a shock-reroll exploit); the
  shock now permanently removes a player (poached by a rival franchise) with
  a repair stipend, so recovery is a genuine choice, never a guaranteed free
  reroll or a free upgrade; the Class Gallery reveal is now labeled with
  fictional franchise identities so a class can point at its own bar; cap-
  meter language no longer flags a fully legal max-spend build as "over the
  line"; a student stuck with zero affordable options now gets a concrete
  rescue suggestion instead of silence; the SYNTHESIS stage gained a new
  RISK BUFFER card and two rewritten cards, all grounded in this session's
  real numbers.

Full detail is in `src/modules/draftDay.ts`'s inline comments (tagged
G1-G7) and `src/server/sessionService.ts`'s (tagged R1-R4).

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
  modules/      draftDay.ts                  — Module 1 Lesson 1, "Draft Day"
                tradeDeadline.ts             — Module 1 Lesson 2, "The Trade Deadline" (L1 seed + deadline)
                boxOffice.ts                 — Module 2 prototype, "The Box Office"
                lobbyDemo.ts                 — the proof-of-loop lesson
  client/       teach/, play/, board/,
                shared/ (api, poll, storage, outbox, crest)
  test/         216 tests over crypto, every reducer, the service layer
                (incl. the L1->L2 seed), and snapshot persistence
scripts/        e2e-l2.cjs                   — rerunnable Playwright L2 proof
```

**Teacher authentication (R1).** `POST /api/sessions` issues a per-session
teacher key alongside the join code — a high-entropy opaque token, hashed
at rest exactly like a student device token, returned exactly once (in the
create-session response) and never again. Every subsequent `POST /control`
and `GET .../teacher` call must present it as `Authorization: Bearer
<teacherKey>`; a student's join code alone opens `/play` but nothing on
`/teach`. `/teach` stores the key in its own `localStorage` slot (separate
from the remembered join code) and refuses to silently reopen a remembered
session without it. There is still no login, no password, no multi-teacher
account system — this is one secret per session, sized for "the teacher's
own laptop, projected to the room," not a hosted multi-tenant deployment.

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
  initialState(input): TState;             // input.seed is an opaque {lessonModuleId, state} from another
                                            // session (see "L1->L2 carry-forward" above), or undefined
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

**216 tests, 216 passing** (`node --test`, no test framework dependency).
Coverage: PIN/token crypto round-trips (`crypto.test.ts`); the `lobby-demo`
reducer/aggregate/views including rejected malformed and out-of-phase
actions (`lobbyDemo.test.ts`); the `m1l1-draft-day` reducer, market design
properties (no dominant opening roster, verified by brute force; neutral
candidate ordering; no-identical-restore after a shock), franchise
assignment, and synthesis-card content (`draftDay.test.ts`); the
`m1l2-trade-deadline` reducer — seed extraction/normalization, claiming, all
three deadline paths, staged reveal (deterministic tiebreak, reserve
prevents a lowball from winning), the aftermath rescue guarantee (brute-forced
≥2 affordable options across every exactly-$100M L1 build), cap-inviolability
property tests across every path, and view-leak tests confirming no seat's
bid/reserve ever reaches another seat or the board (`tradeDeadline.test.ts`);
the `m2-box-office` demand-curve and path-dependence reducer
(`boxOffice.test.ts`); atomic writes, restart-survival, and
corrupted-snapshot quarantine (`snapshotRepository.test.ts`, including an
optimistic-concurrency-conflict case); and the full service layer — session
create (now asserting a teacher key is issued), the **L1→L2 seed** (linked
creation through a session actually played via the API, an ended source
session, a missing/wrong-module source, malformed/never-locked L1 state),
join, **duplicate-join** (same name twice is rejected, not silently
duplicated), device-token **resume**, rejoin-PIN token rotation and
**lockout after 5 failures** with teacher-only unlock, the **phase gate**
(LOBBY blocks an action PLAY allows; paused/frozen/ended each reject with
the right status), **action validation** (malformed payloads and retired
tokens rejected before or by the reducer), **teacher-key enforcement** on
every control/teacher-view call, and every teacher control including
checkpoint **restore — including reviving a session the teacher ended by
mistake** (`sessionService.test.ts`).

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

- No client-side module registry — `/play`, `/teach`, and `/board`'s
  renderers special-case each module's view shape by its `module` tag
  (`lobby-demo`, `m1l1-draft-day`, `m2-box-office`, `m1l2-trade-deadline`,
  with a generic JSON-dump fallback for anything else). Adding another real
  lesson module means writing its render functions too; the *server*
  contract is fully generic today, the client shell is not yet.
- `GET /api/sessions` (the session list) is still unauthenticated — it
  returns code/title/phase for every session ever created on the box, not
  seat- or team-identifying data. Lower severity than the R1 gap it was
  found alongside (that one is closed); worth gating in a future round if
  this ever runs somewhere less trusted than one teacher's own laptop.
- `SnapshotRepository` keeps every session/seat ever created in memory for
  the process lifetime — there is no archive/prune path. Not a problem at
  classroom scale (one class, a handful of sessions per day), worth
  revisiting for a long-running deployment.
- The teacher-key/rejoin-lockout mechanisms are new as of this round and
  have only been exercised by unit tests and one manual Playwright pass
  (which exercises the *happy* teacher-key path via normal UI clicks, not
  the lockout/unlock UI) — worth deliberately exercising the "PIN LOCKED /
  Unlock" flow and a lost-teacher-key recovery scenario in the next
  fresh-context verification round.
