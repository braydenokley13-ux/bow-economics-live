# HANDOFF — OBSERVED IN REPO, the stable half

> Filing note (boss-lead): the scout ran under a read-only role and had no write tool; this file is
> its report transcribed verbatim by the lead from the agent's final output. Nothing was edited
> beyond HTML-entity clean-up and this note. The lead ran no command on the scout's behalf and
> verified none of its claims independently — every line below is the scout's, with its own
> OBSERVED / INFERRED / NOT IN REPO labels intact.

Assignment `w3-handoff-scout`, run `m2-visual-quality-war`, wave 3. Read-only pass. Every claim carries file:line. **OBSERVED** = read in the code. **INFERRED** = reasoned from code, not executed. **NOT IN REPO** = the repo does not answer. Out of scope by instruction: composition of `/teach`, `/board` frame chrome, synthesis visuals. Nothing here is TECHNICALLY VERIFIED — I ran no build, no server, no test.

## Highest-severity findings first

**1. A concurrent-submit version conflict loses a student action (OBSERVED).** `SessionService.submitAction` reads the session (`runtime/src/server/sessionService.ts:271`), then `await`s `repo.listSeatsForSession` inside the reduce call (`:278`), then writes with `expectedVersion = session.version` (`:283`). Because there is an `await` between read and write, two students POSTing in the same tick interleave and the loser gets 409 `version_conflict` (`:284`). On the client, `ActionOutbox.pump` treats any 4xx other than 401 as definitive: it `shift()`s the action off the queue and never retries (`runtime/src/client/shared/outbox.ts:107-111`). Today, a lock that collides with another desk's lock is dropped, not retried; `/play` surfaces "session changed underneath this action — refresh and retry" (`runtime/src/client/play/main.ts:199-206`). Visible, not silent — but lost. Nothing in the repo tests this (§8).

**2. `docs/EMERGING_PRIMITIVES.md` is stale by five modules.** It reasons from "both built experiences (`m1l1-draft-day` and 'The Box Office')" (`docs/EMERGING_PRIMITIVES.md:3-4`, `:53-57`). Seven modules are registered (`runtime/src/server/index.ts:23-29`) and one of the two it names is no longer among them. Any "not yet two data points" argument taken from that doc is stale.

**3. No event log, no decision journal, no teacher-action history exists in the product.** Only current state plus one checkpoint is persisted (§6). `.boss/runs/<id>/events.jsonl` is the development control plane, not the classroom runtime.

## 1. Student runtime

**Join.** `POST /api/sessions/:code/join` with `{displayName}` (`runtime/src/server/http.ts:198-203`) → `SessionService.join` (`sessionService.ts:172-206`). Name trimmed, 1–40 chars (`:176-178`), normalized lowercase/collapsed-whitespace (`:538`); duplicate normalized name in the same session is 409 `name_taken` (`:180-185`), enforced again at the repository (`snapshotRepository.ts:203-204`). `/play` composes a pair name client-side as `First & Second` (`play/main.ts:120-123`). Joining an ended session is 410 (`sessionService.ts:174`).

**Identity.** A join returns an opaque **device token** and a **4-digit rejoin PIN**, both stored hashed (`sessionService.ts:188-198`). Seat row: `{id, sessionId, displayName, displayNameNormalized, deviceTokenHash, rejoinPinHash, joinedAt, lastSeenAt, failedRejoinAttempts}` (`server/types.ts:50-61`). No accounts, no roster import, no login — identity *is* the device token. `/play` persists `{deviceToken, sessionCode, seatId, displayName, rejoinPin}` in `localStorage` (`client/shared/storage.ts:6-33`).

**A "run".** There is no run object. There is a **session** (`server/types.ts:23-48`) holding one opaque module-owned `state` blob plus `phase`, `paused`, `frozen`, `ended`, `version`, one `checkpoint`, `teacherKeyHash`. Per-student state lives inside module state keyed by seatId — `FullHouseState.desks: Record<SeatId, Desk>` (`runtime/src/modules/fullHouse.ts:709-711`).

**Progression.** Lesson progression = `session.phase`, an index into the module's `phases` list (`sessionService.ts:331-334`). Round progression is module-owned: Full House's `nightIndex` (`fullHouse.ts:712-713`) increments only inside `closeNight` (`:1045`), reachable only by a teacher hook (`:2625-2630`); students have no night-advance action (`allowedActions`, `:2686-2690`).

**Draft vs committed — yes, explicitly.** `setPrice`/`setSpend`/`setBowl` mutate live dials (`fullHouse.ts:978-1007`); `lock` sets `desk.locked` (`:1009-1015`); settlement happens only at the teacher's bell (`closeNight`, `:1025-1046`). After lock, dial changes are rejected: "tonight is locked — you cannot change it" (`:974`). Both draft and committed values are **server** state — there is no client-only draft; every dial move is an outbox action (`play/main.ts:190-217`).

**Refresh.** `/play` loads credentials from `localStorage` at module scope (`play/main.ts:28`) and resumes via `GET /api/me` with `Authorization: Bearer <deviceToken>` (`http.ts:179-191` → `sessionService.ts:209-216`); no code or name needed. Queued-but-unsent actions survive a crashed tab: the outbox writes to `localStorage` before sending (`outbox.ts:69-74`, `:51-67`) and pumps on construction (`:48`).

**Reconnect.** No connection to re-establish (§3). A poll failure sets "offline — retrying" and the loop keeps ticking (`poll.ts:51-55`, `play/main.ts:243`). A successful tick retries the outbox (`play/main.ts:226`), as does the browser `online` event (`:248`).

**Duplicate submission.** No idempotency key is honoured server-side: the outbox stamps a random `id` (`outbox.ts:70`, `client/shared/id.ts`), but `submitAction` forwards the body to the reducer and no module reads `id` (`sessionService.ts:275-280`, `http.ts:214-223`). Concretely: a second `setPrice` for the same night replaces the first and the later one wins (`fullHouse.ts:982`); a second `lock` is rejected 409 "tonight is locked" (`:974`) and the outbox drops it (`outbox.ts:107-111`). One request in flight per client (`outbox.ts:85-88`), so a client cannot race itself — only others (finding 1).

**Authority.** Fully server-side. The module's `reduce` is "the single source of truth" and must reject anything malformed (`shared/lessonModule.ts:54-60`); the runtime additionally hard-stops on ended/frozen/paused (`assertActionable`, `sessionService.ts:300-304`). The client renders only what the server returned (`play/main.ts:207-213`, `:222-227`).

**Fallbacks today.** (a) PIN rejoin from a new device rotates the token and retires the old one (`sessionService.ts:230-252`); (b) 5 wrong PINs lock the seat until the teacher clears it (`:235-237`, `:254-261`, route `http.ts:239-245`); (c) the original tab detects sign-out by error code and drops to the join card with a specific line, not a blank screen (`play/main.ts:47-93`, `:236-244`); (d) a late seat gets a playable stock desk with missed nights run at plan price, flagged `stock` (`fullHouse.ts:928-957`); (e) a desk that never locked auto-commits at plan price, flagged `auto` (`:1025-1045`).

## 2. Class / session runtime

**Class representation.** One `SessionRow` per class period (`server/types.ts:23-48`), created by `POST /api/sessions` with `{lessonModuleId, title, sourceSessionId?}` (`http.ts:160-170`). Join code allocated with up to 20 uniqueness retries (`sessionService.ts:136-143`). No class roster entity, no student list across sessions, no teacher account — a "class" exists only for the life of a session.

**Assignment.** NOT IN REPO as a first-class concept. Per-module only: Full House assigns desk number, market and crest deterministically by join order (`fullHouse.ts:934-942`), never randomly.

**Current lesson / phase.** `session.lessonModuleId` + `session.phase` (`server/types.ts:27-28`). The module's `phases` must be an ordered subsequence of the ten canonical phases (`shared/phases.ts:10-21`, `:40-49`), validated at registration (`sessionService.ts:89-91`).

**Teacher-controlled progression.** `POST /api/sessions/:code/control` with `advance | reveal | pause | unpause | freeze | unfreeze | hook | end | restore` (`http.ts:226-236`, `sessionService.ts:308-394`). `advance` steps one phase, 400 at the last (`:330-335`); `reveal` jumps to REVEAL (`:336-341`); `freeze` sets **both** `frozen` and `paused`, `unfreeze` clears both (`:346-358`); `end` snapshots first so it is undoable (`:368-373`); `restore` reverts phase/state/paused/frozen/ended (`:374-392`).

**Automatic progression: none.** No timer anywhere advances a phase. The only `setTimeout`s are the poll loop (`poll.ts:54`) and the 20-second auto-collapse of the PIN card (`play/main.ts:171`). OBSERVED.

**Class-wide events / shocks.** Two mechanisms. (a) `control {type:"hook", hook}` forwards to the reducer as `teacher:<hook>` with `seatId:"teacher"`, capturing a checkpoint (`sessionService.ts:359-367`); Full House's hooks are `closeNight`, `twoPeaks`, `cfPage`, `cfPageBack`, `synthPage`, `synthPageBack`, `revealNext` (`fullHouse.ts:2625-2682`). (b) `onPhaseExit`, an optional pure hook run on every teacher-triggered forward transition before the phase commits (`shared/lessonModule.ts:77-96`, invoked `sessionService.ts:404-418`), used by Full House to settle the open night and play out remaining reveal stages on an early exit (`fullHouse.ts:2592-2607`). The runtime guarantees `fromPhase !== toPhase` (`sessionService.ts:413`).

**Missing / absent students.** Module-level, not runtime-level: late seat back-filled at plan price marked `stock` (`fullHouse.ts:928-957`); idle desk auto-committed at plan price marked `auto` (`:1031-1043`); when the *teacher* ends PLAY early, un-locked desks commit at the dials as they stand rather than the plan price (`honorPendingDials`, `:1039-1042`). A student who never joins has no desk — nothing creates seats for absentees.

**TIME CUT: exists only as static teacher-facing advisory copy, not as any mechanism.** It is a string field on each module's director panel (`fullHouse.ts:3469`, computed `:3598`; `hostTheLeague.ts:4041`, `:4272`; `writeTheRule.ts:2600`, `:2603`) rendered on `/teach` (`teach/main.ts:608`, `:772`). **There is no elapsed clock, no minute counter, and nothing that triggers on time.** The repo says so itself: "N3 (no elapsed clock against absolute-minute TIME CUT triggers)" (`runtime/README.md:973-974`). OBSERVED.

**Simultaneity assumptions.** One Node process, no locking, optimistic concurrency by `session.version` on every mutation (`snapshotRepository.ts:184-198`); in-memory Maps are the authority and every mutation bumps `version` (`:194`). Cost at class scale: finding 1.

## 3. Realtime / synchronization

**Realtime exists, by short-interval HTTP polling with ETag/If-None-Match only.** No SSE, no WebSocket, no long-poll (`http.ts:11-17`, `poll.ts:1-11`).

**Intervals — all hard-coded literals at the call site, no config:** `/play` → `GET /api/me` **1200 ms** (`play/main.ts:219-221`); `/teach` → `GET /api/sessions/:code/teacher` **1500 ms** (`teach/main.ts:211-213`); `/board` → `GET /api/sessions/:code/board` **1000 ms** (`board/main.ts:1928`).

**Reconciliation after a gap: none beyond "the next tick returns the full current payload."** Every response is a complete view, not a delta (`sessionService.ts:468-488`, `:512-523`, `:455-466`). INFERRED: intermediate states are unobservable to a client that was offline — a reveal step that came and went during a gap is never replayed.

**Event subscriptions.** NOT IN REPO.

**Authoritative source of truth.** The server's in-memory `sessions`/`seats` Maps in the single `SnapshotRepository` (`snapshotRepository.ts:47-48`), reached only through `SessionService` (`sessionService.ts:1-17`).

**Client-side caches.** The poll's stored ETag (`poll.ts:31`); `localStorage` credentials and outbox queue (`storage.ts:14-16`, `outbox.ts:41`); `sessionStorage` `bow-signed-out` flag (`play/main.ts:72-79`). No cached view payloads. ETags: `"<version>"` for `/api/me` (`http.ts:187`) and `/board` (`:267`); `"<version>-<seatCount>-<lastJoinedAt>"` for `/teacher`, because a join does not bump session version (`:255-258`).

**Missed event.** Not applicable — there are no events, only versioned state. A missed *tick* self-heals next tick; the poll loop never dies (`poll.ts:51-55`).

**Duplicate event.** A 304 takes the `onUnchanged` branch and changes only the sync label (`poll.ts:41-43`, `play/main.ts:232-235`). A repeated 200 with identical state re-renders idempotently (`play/main.ts:253`).

## 4. Persistence

**"No database, one Node process" is TRUE as observed.** `runtime/package.json:13` — `"dependencies": {}`, zero runtime packages. `server/index.ts:18-33` constructs one repository, one service, one `http.Server`; the HTTP layer is hand-rolled over `node:http` (`http.ts:1-9`).

**Storage model.** In-memory Maps are the source of truth; every mutation writes them synchronously and *schedules* an async disk write (`snapshotRepository.ts:1-21`, `:110-132`). Writes serialize through one promise chain (`:118`), go to `<file>.<pid>.tmp`, then `rename` over the real path for atomicity (`:121-123`). A write failure is logged and swallowed so a bad disk cannot kill a live class (`:125-131`).

**Snapshot file.** One JSON file: `RUNTIME_SNAPSHOT_FILE`, else `runtime/data/snapshot.json` (`server/index.ts:15`). Shape `{version: 1, sessions: SessionRow[], seats: SeatRow[]}` (`snapshotRepository.ts:38-42`, `:111-116`).

**Versioning / conflict handling.** File-level: a literal `version: 1` that nothing reads — `load()` never checks it (`snapshotRepository.ts:88-91`). **No snapshot schema-migration path exists.** Row-level: `session.version` optimistic concurrency returning a distinguishable `{ok:false, conflict:true}` rather than throwing (`server/types.ts:86-90`, `snapshotRepository.ts:191-193`). Seat updates have **no** version check (`:248-255`) — last write wins.

**Corrupt-snapshot quarantine.** Read and parse errors are separated (`snapshotRepository.ts:79-108`): `ENOENT` → boot empty (`:85`); any other read error → still fatal, rethrown (`:86`); `JSON.parse` failure → file renamed to `<file>.corrupt-<timestamp>`, never deleted, both steps logged to stderr, server boots empty (`:92-107`). If the rename itself fails it logs and continues anyway (`:100-103`).

**Browser storage.** `localStorage`: `bow-play-credentials` (`storage.ts:14`), `bow-teach-session-code` (`:15`), `bow-teach-session-key` (`:16`), `bow-play-outbox:<seatId>` (`outbox.ts:41`, scope = `creds.seatId`, `play/main.ts:216`). `sessionStorage`: `bow-signed-out` (`play/main.ts:72`). All accesses try/catch'd so a private window degrades to "no saved seat" (`storage.ts:1-5`).

**Server-memory-only.** Nothing — every mutation calls `persist()` (`snapshotRepository.ts:162, 196, 218, 253`). Note module state never *serialized to a client*: `SettledNight.hidden: Curve` is stored server-side and stripped from views (`fullHouse.ts:691-692`).

**Local draft state.** None for lesson decisions (§1). The only local uncommitted data is the outbox queue.

**No prune/archive path** — every session and seat ever created stays in memory and in the snapshot for the process lifetime; self-reported at `runtime/README.md:860-863`.

## 5. Economic resolution

**Where.** Entirely inside the module's pure functions, server-side. Full House: `settleNight` (`fullHouse.ts:537`) and `applyNight` (`:880-922`), invoked from `closeNight` (`:1025-1046`) and the late-seat back-fill (`:952-955`).

**Deterministic: yes.** `Math.random` appears **nowhere in server or module code** — the only occurrence in `runtime/src` is client-side id generation (`client/shared/id.ts:14`). Module comments assert the discipline (`tradeDeadline.ts:564`, `freeAgency.ts:152`) and a test asserts it for M1 L2 (`test/tradeDeadline.test.ts:1036`). Price optima are exhaustive scans over a fixed grid (`fullHouse.ts:660-673`).

**Any randomness at all?** `randomUUID` for session/seat ids (`sessionService.ts:120`, `snapshotRepository.ts:148, 208`) and token/PIN/join-code generation (`server/crypto.ts`, used `sessionService.ts:144, 188-189`). None feeds economic outcomes. There is no seeded PRNG because there is no PRNG. OBSERVED.

**`ctx.now` is passed but unused by Full House.** `ReduceContext.now = Date.now()` (`shared/lessonModule.ts:25`, set `sessionService.ts:279`); `fullHouse.ts` contains no `Date.now`/`ctx.now` read. INFERRED: the reducer is time-independent.

**Teacher-triggered events.** The `hook` path (§2) and `onPhaseExit`, which the contract requires to be "pure and deterministic (same inputs, same result, every time)" (`shared/lessonModule.ts:81-83`).

**Can a reconnect reproduce the same result? Yes — because results are never recomputed on reconnect.** Settlement is computed once, at the bell, and stored as a `SettledNight` on the desk (`fullHouse.ts:877-922`, appended `:917`). A reconnect calls `resumeByToken` → `studentView` (`sessionService.ts:486`), which reads stored settled history (`fullHouse.ts:2702-2703`) rather than re-deriving it. Locked-at-time framing is explicit (`:691` "Frozen at lock (D15)"; test `test/fullHouse.test.ts:801`). The residual risk is not recomputation but **loss**: an action dropped by finding 1 changes the inputs that get settled.

**Blindness is structural**: nothing derived from a pending action reaches the pre-lock student view (`fullHouse.ts:12`, `:2774`), with a test (`test/fullHouse.test.ts:193`).

## 6. Evidence / events

- **Event log: NOT IN REPO.** No append-only log, no audit table. Only `SessionRow.state` (current) plus **one** `checkpoint` (`server/types.ts:36`).
- **Decision history: partial, module-owned.** Full House keeps a per-desk ordered array of settled nights with price, spend, bowl, `auto`/`stock` flags, renewals before/after, cash after and the full settlement (`fullHouse.ts:677-707`). Committed decisions only — intermediate dial movements before a lock are overwritten (`:982, 998, 1006`) and unrecoverable.
- **Teacher actions: not recorded.** `control` mutates flags/phase and sometimes overwrites the single checkpoint (`sessionService.ts:421-445`). A new checkpoint destroys the previous one, so `restore` is one level deep.
- **Timestamps kept:** `session.createdAt/updatedAt` (`snapshotRepository.ts:159-160, 194`), `seat.joinedAt/lastSeenAt` (`:213-214`, refreshed on every poll and action, `sessionService.ts:214, 286`), `checkpoint.capturedAt` (`sessionService.ts:434`).
- **Student reasoning: deliberately not captured.** No free-text input anywhere in `runtime/src` — a grep for `textarea`, `type="text"`, `freeText`, `rationale` across `runtime/src` returns no matches. Every student action is a constrained numeric/boolean dial (`fullHouse.ts:2617-2624`).
- **Not tracked at all:** connectivity, disconnect/reconnect counts, dropped actions, teacher press history, time-in-phase.

## 7. M1 vs M2

**Shared seams that already exist.**
- `LessonModule<TState>` — phases, `initialState`, pure `reduce`, three views, `aggregate`, optional `onPhaseExit` (`shared/lessonModule.ts:32-97`); all seven registered modules implement it (`server/index.ts:23-29`).
- The ten-phase canonical vocabulary and its ordered-subsequence rule (`shared/phases.ts:10-49`, enforced `sessionService.ts:89-91`).
- The whole session/seat/auth/persistence/transport stack is module-agnostic — the runtime "never inspects lesson state" (`shared/lessonModule.ts:6-11`) and `sessionService.ts` contains no module-specific branch.
- The cross-lesson **seed**: an opaque `{lessonModuleId, state}` blob resolved from a source session at create time and handed to the receiving module as untrusted input (`shared/lessonModule.ts:43-51`, `sessionService.ts:129-134`, route `http.ts:164-167`). Implemented **four** times across both modules: `tradeDeadline.ts:182`, `freeAgency.ts:473` (accepting either an L2 or an L1 seed, `:474-482`), `freeAgency.ts:410`/`:438`, and `writeTheRule.ts:686`.
- Client plumbing shared by all modules: `poll.ts`, `outbox.ts`, `api.ts`, `storage.ts`, `id.ts`, `crest.ts`.

**Duplicated / not shared.**
- Rendering: `/play` dispatches on `view["module"]` with one hand-written render function per module (`play/main.ts:291-318`) plus a JSON-dump fallback (`:320-336`); same pattern on `/teach` and `/board` (`runtime/README.md:847-854`). The server contract is generic; the client shell is not.
- The director panel (NOW/ASK/DON'T EXPLAIN YET/TRIGGER/TIME CUT) is independently re-declared in three M2 modules with the same field names and no shared type: `fullHouse.ts:3461-3470`, `hostTheLeague.ts:4041`, `writeTheRule.ts:2600`.
- Seed extraction/validation is re-implemented per receiving module (four sites above) with no shared helper.

**Incompatible assumptions.**
- **M2 CSS scoping is one-way and id-prefix-based.** `/play` sets `document.documentElement.dataset.module = "m2"` only when the view's module id starts with `m2l`, deleting it otherwise (`play/main.ts:288-290`). `m2-box-office` — an M2 lesson whose id does not start with `m2l` — would not receive the M2 token layer. Harmless only because it is superseded (D20).
- M1 chains L1→L2→L3 by seed; M2 chains L2→L3 (`writeTheRule.ts:66-72`). No cross-module seed exists and nothing forbids one.
- M1 keys per-student state by franchise/team concepts, M2 by "desk" (`fullHouse.ts:695-707`); the runtime never sees either.

**Where abstraction now has more than two data points (evidence only, per CLAUDE.md §12).** Seed extract-and-validate (4 implementations), the director-panel shape (3), the client render dispatch (8 hand-written branches). I make no recommendation.

**Where it is still clearly premature.** The settlement mathematics is genuinely different per lesson and shares nothing (`fullHouse.ts:537`, `tradeDeadline.ts:531`, `freeAgency.ts`).

## 8. Testing

**Unit tests.** `npm test` = `npm run build && node --test dist/test/*.test.js` (`runtime/package.json:11`), so a type error fails the suite. 16 test files, **494 `test(` call sites** by grep in `runtime/src/test/`: `tradeDeadline` 76, `freeAgency` 85, `hostTheLeague` 60, `draftDay` 52, `fullHouse` 50, `sessionService` 47, `writeTheRule` 44, `boxOffice` 33, `synthesisVisuals` 10, `lobbyDemo` 9, `fullHouseBoardW3` 9, `crypto` 6, `snapshotRepository` 6, `dotChart` 3, `clientClaims` 3, `m2Harnesses` 1.

**README status verification.** `runtime/README.md:4` and `:730` claim "458 tests, 458 passing" and `:826` claims build and test "both green as of this writing." That count does not match the 494 `test(` sites now in the tree. Grep counts top-level `test(` sites, which is not identical to node's assertion count, so treat this as "the README number is not currently verifiable," not a proven mismatch. **I did not run the suite; per CLAUDE.md §13 nothing here is green this session.**

**What unit tests cover.** Runtime/session: teacher-key auth (`sessionService.test.ts:179-219`), phase gating (`:221-264`), rejoin lockout (`:136-176`), duplicate-name join (`:82`), token retirement (`:115-134`), all nine control actions incl. restore-after-end (`:300-459`), board privacy (`:394`), and the full seed contract incl. missing/foreign/malformed seeds (`:462-560`). Persistence: atomic writes, restart restore, empty boot, `expectedVersion` optimistic concurrency, corrupt-file quarantine, non-ENOENT read errors still fatal (`snapshotRepository.test.ts:13-149`). Full House economics/invariants: blind commit, no demand constant on any surface, seat privacy, error-cost symmetry, two-book tension, debt non-terminality, auto/stock commit paths, teacher-misclick early exit, locked-at-time stability, claim stamping (`fullHouse.test.ts:142-1288`).

**What is NOT tested.**
- **Class scale / concurrency.** No test submits two actions concurrently; `expectedVersion` is exercised only at the repository level with sequential calls (`snapshotRepository.test.ts:88`), never through `SessionService` under interleaving. Finding 1 is uncovered. OBSERVED.
- **Reconnect.** Token resume and PIN rejoin are unit-tested at the service layer (`sessionService.test.ts:101-134`); nothing tests browser refresh, an offline gap, outbox replay after network failure, or the "opened on another device" path (`play/main.ts:75-93`).
- **`client/shared/` has no test file at all** — the outbox, the poller and `storage.ts` are untested, including the 4xx-drop behaviour behind finding 1.
- **Snapshot schema versioning / migration.**
- Teacher and projector surfaces are covered only through module view functions (`fullHouseBoardW3.test.ts`, `synthesisVisuals.test.ts`, `clientClaims.test.ts`, `dotChart.test.ts`) and the Playwright scripts — no DOM unit tests.

**e2e scripts.** Nine `.cjs` scripts in `runtime/scripts/` (`e2e-l2`, `e2e-l2-early-advance`, `e2e-l3`, `e2e-l3-early-advance`, `e2e-m2l1`, `e2e-m2l1-misclick`, `e2e-m2l2`, `e2e-m2l3`). **They are not part of `npm test`** (`package.json:11` runs only `dist/test/*.test.js`); they are run by hand (`README.md:246, 353, 482`). What `e2e-m2l1.cjs` actually asserts: server boot polling up to 100 attempts (`:57-66`); **rendered-box** visibility rather than DOM presence (`assertFullyVisible`, `:81-105`); that `/board`'s `#stage` fits both projector shapes (`assertBoardFrameFits`, `:130-160`); back-row type size (`assertBackRowType`, `:163-181`); and a **negative claim assertion** that reads the desk's own `/api/me` payload and asserts none of `turnout`, `gate`, `inArena`, `total`, `net`, `fillPct` and no forbidden claim vocabulary appears pre-lock (`:237-317`). It drives a real multi-desk class (`:449`). So the projector *is* e2e-covered and class-size rendering is (M2 L2/L3 described as 12-desk proofs, `README.md:601-602`). No e2e script simulates a network failure, a mid-class server restart, or two desks acting in the same instant.

**Self-reported gaps I did not verify:** the L3 e2e flake ~1 in 3 at some heads (`README.md:840-845`); no prune path (`:860-863`); M2 L1/L3 economic and sports-reality gaps (`:864-897`). One I did verify: `GET /api/sessions` is unauthenticated — OBSERVED, no bearer check at `http.ts:173-176`.

## Contradictions

1. **`m2-box-office` dead render branch.** `README.md:871-873` says boxOffice was deregistered per D20; that is **correct** — `server/index.ts:3-9` imports and `:23-29` registers seven modules, none of them boxOffice. But `/play` still carries a live `m2-box-office` render branch (`play/main.ts:295-298`) that no registered module can reach, and it is the one M2 id that would not receive the `data-module="m2"` CSS scope (`:288-290`). Dead code with a latent styling assumption.
2. **`docs/EMERGING_PRIMITIVES.md` vs the tree** — see finding 2.
3. **README test count vs the tree** — 458 claimed (`README.md:4`, `:730`) vs 494 `test(` sites.
4. **`SnapshotFile.version: 1` is written but never read** (`snapshotRepository.ts:38-42` vs `:88-91`). The file advertises a schema-version contract the code does not honour.
5. **Outbox comment vs behaviour.** The header says a definitive rejection ("wrong phase, bad payload, retired token") is dropped rather than retried (`outbox.ts:18-20`), but the implementation drops *every* non-401 4xx (`:107-111`) — including 409 `version_conflict`, a transient race, not a refusal. This is the mechanism of finding 1.
6. **`restore` marketed as one-click recovery** (`server/types.ts:6-13`, `sessionService.test.ts:364`) but only one checkpoint exists (`server/types.ts:36`) and every risky transition overwrites it (`sessionService.ts:426-438`). Two mistakes in a row are not recoverable. OBSERVED.

## Not in repo

- No run/attempt entity, no student account, no persistent roster across sessions.
- No first-class "assignment" concept — assignment is per-module desk allocation only.
- **No TIME CUT mechanism**: no elapsed clock, no minute counter, no time-based trigger anywhere. TIME CUT is static teacher copy (`fullHouse.ts:3469`/`:3598`, `teach/main.ts:772`) and `README.md:973-974` confirms the absence.
- No event log, no decision journal, no teacher-action history, no student free-text capture.
- No event subscriptions, no SSE/WebSocket, no push of any kind.
- No idempotency key honoured on `POST .../actions`.
- No snapshot schema migration path; no archive/prune.
- No multi-process/multi-instance coordination — explicitly none to coordinate (`snapshotRepository.ts:6-11`).
- No rate limiting on any route except the 5-attempt rejoin lockout; no auth on `GET /api/sessions` or `GET .../board`.
- No config file for poll intervals — all three are literals at their call sites.

## Coverage

Fully covered from source: §§1–7 and the unit-test half of §8. Partially covered: e2e assertion detail — I read `e2e-m2l1.cjs`'s helper/assertion layer by grep, not the other eight scripts line by line; treat their described coverage (`README.md:597-602`) as self-reported. NOT COVERED by instruction: composition of `/teach`, `/board` frame chrome, synthesis visuals. NOT COVERED by scope choice: `crypto.ts` internals, `arena.ts`/`crest.ts`/`m2ui.ts` drawing code, and the internals of `hostTheLeague.ts`/`writeTheRule.ts` beyond their seed and director seams.
