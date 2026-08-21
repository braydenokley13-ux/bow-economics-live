# VERIFY_RUNTIME — independent attack on the live-session runtime

Fresh-context verifier, D10/D12. Isolated copy built and run from scratch
(`npm install && npm run build && npm test`, then `node dist/server/index.js`
with `PORT=4103` / `RUNTIME_SNAPSHOT_FILE` pointed at a scratch directory —
the repo at `/home/user/bow-economics-live/runtime` was never written to).
I did not build this runtime and made no repairs; findings only.

**Build/test:** `npm run build` clean. `npm test` — **80/80 passing**
(README claims 46; stale doc, not a functional issue).

## Findings

### BLOCKING

**B1 — Teacher `/control` has zero authentication; any device holding the
join code can hijack the whole class.** `POST /api/sessions/:code/control`
checks nothing but the action `type` — no bearer token, no PIN, no origin
check. Every joined student's device necessarily already has the join
code (they typed it to join), and the endpoint path is visible in plain
text in the publicly-served `/teach/main.js`. Repro: with only the join
code (no device token, no teacher session, nothing from `/teach`):
```
curl -X POST http://host/api/sessions/CODE/control -d '{"type":"freeze"}'
curl -X POST http://host/api/sessions/CODE/control -d '{"type":"end"}'
```
Both returned `200`; the live PLAY-phase session was frozen (`frozen:
true`, every seated student rejected with 423) and then permanently ended
(`ended: true`) from a client that never touched `/teach`. Same path
reaches `advance`, `reveal`, and `hook` (the draft-day shock). One student
with a browser console can pause, skip, spoil, or kill the exercise for
everyone, at will, at any moment. The README frames missing teacher auth
as acceptable because it's "a single trusted classroom LAN" — but the LAN
in question is a room of 30+ students who all hold the one secret the
system relies on, which is not a trust boundary at all.

**B2 — The same gap leaks every team's private in-progress build to any
student, pre-reveal.** `GET /api/sessions/:code/teacher` requires no
credential either. It returns `view.teams`: an array with every seat's
`spent`, `filled`, `capState`, `locked`, `strategy`, `shocked`/`repaired`
— i.e. the whole class's build progress, not just the caller's own team.
Repro: from a plain `curl` with only the join code, mid-PLAY on a 35-seat
session: `teams: 35` came back with full per-team financials. This
directly contradicts the isolation `studentView`/`reduce` otherwise
enforce (`getTeam(state, seatId)`, seatId derived server-side from the
device token — verified no client field can write another seat's state,
see "held" section below). The privacy hole isn't in the reducer, it's
that the teacher-view route has no gate at all. It undermines the module's
own pedagogy: SYNTHESIS's SCARCITY/OPPORTUNITY-COST cards depend on
genuine surprise at REVEAL, which a student who peeked doesn't get.

**B3 — `restore` cannot undo an accidental `end`; the one-click recovery
promised for "risky transitions" does not cover the riskiest one.**
`Checkpoint` (`src/server/types.ts`) stores only `{phase, state, paused,
frozen}` — no `ended` field — and `control()`'s `"end"` case patches
`{ended: true}` without capturing a fresh checkpoint. Repro: freeze
(captures a checkpoint) → unfreeze → end → restore. `restore` reverted
`phase`/`state`/`paused`/`frozen` to the pre-freeze checkpoint but
`session.ended` stayed `true`; every subsequent poll and action still got
410 Gone. `sessionService.test.ts`'s own "end … except restore" test only
asserts `advance` is rejected after `end` — it never asserts restore
actually revives the session, so this was never caught. A teacher who
fat-fingers "End Session" (one button among ten phase-advance clicks, live,
in front of a class) has no way back through the runtime's own safety
mechanism; the session is dead for the rest of the period.

### REQUIRED-REPAIR

1. **No rate limiting or lockout on the rejoin-PIN endpoint** — this
   allows fast, practical seat takeover, not just a theoretical gap. The
   PIN space is 4 digits (10,000 values). Scripted at 20-way concurrency
   from one laptop, wrong-PIN attempts sustained **~24 req/s** even
   though each attempt runs a full scrypt verify server-side — the full
   space is exhaustible in **~7 minutes**, with zero lockout, counter, or
   backoff at any point (20 consecutive wrong guesses all returned a
   plain 401, no throttling observed). Once the right PIN lands, the
   attacker's `rejoin` rotates the device token and silently retires the
   real student's old one — the real student is locked out of their own
   seat with no error until they notice. The README already lists this as
   a known gap; this run demonstrates it is exploitable inside a single
   class period, not just "in principle."

2. **A corrupted snapshot file takes the whole runtime down with no
   recovery path.** `SnapshotRepository.load()` re-throws any JSON
   parse failure that isn't `ENOENT`; `main()`'s only handling is
   `console.error(...) ; process.exit(1)`. Repro: corrupt
   `data/snapshot.json` (one bad byte) and start the server — it crashes
   immediately with a stack trace and never binds the port; nothing
   restarts it (no supervisor is shipped or documented). This only
   triggers from an external cause (the atomic temp-file+rename write
   path is itself crash-safe — kill -9 mid-write was verified clean, see
   below) — but a bad manual restore, a bad copy, or a flaky removable
   drive are all realistic teacher-side events, and today every one of
   them means the whole class is down until someone with shell access
   intervenes. There is no quarantine-and-start-fresh fallback and no
   "teacher one-click restore" that reaches this failure mode (that
   feature requires the server to already be up).

### ADVISORY

- **Optimistic-concurrency conflicts are effectively unreachable in
  practice today.** Fired 15 simultaneous distinct-seat actions against
  one session over real HTTP — all 15 succeeded, zero `version_conflict`
  responses, final aggregate correct (`pickedCount: 15`). This isn't a
  bug: `SnapshotRepository`'s read-modify-write does no genuine async I/O,
  so Node's microtask-draining serializes each request's full mutation
  before the next request's handler code runs. It does mean the
  version-conflict path is validated today only by the direct repository
  unit test, not by anything resembling real concurrent traffic — worth
  re-verifying if a future backend swap introduces real async I/O
  mid-mutation (a real DB call, worker threads).
- `GET /api/sessions` is also unauthenticated and lists every session ever
  created on the box (code, title, phase) — same authority gap as B1/B2,
  lower severity since it's read-only and non-seat-identifying, but it
  means any LAN device can enumerate a teacher's whole session history
  (nothing is ever pruned, per the README's own noted gap).
- No gzip/compression on static assets or JSON responses. Immaterial at
  current sizes (below) but flagged since it was explicitly in scope.
- README's "46 tests" line is stale against the actual 80-test suite.

## What held up (no repro needed, tested and clean)

- Duplicate join (same name, verbatim and with case/whitespace variants)
  → clean 409, no double-seat created.
- Late join mid-PLAY, mid-REVEAL, and mid-ADAPT (a brand-new seat that
  never played) → each renders a sane, non-crashing view with no other
  seat's data attached; ADAPT correctly shows `openSlot: null` for a seat
  with no shock to repair.
- Direct HTTP attacks bypassing the UI: out-of-phase actions (409),
  action while paused (423), while frozen (423), while ended (410),
  unknown action type, wrong field types (`slotId: 123`), an injected
  `seatId` field in the action body attempting to write another seat's
  team (ignored — `ctx.seatId` is derived server-side from the device
  token, ignored client value ineffective; confirmed the target seat's
  state was untouched), oversized body (200KB → clean 413 under the 64KB
  cap), malformed JSON (400), missing/garbage bearer token (401) — all
  handled without a stack trace reaching the client.
- Device-token resume (`GET /api/me`) and rejoin-PIN token rotation both
  work as documented; the old token is retired the instant a rejoin
  succeeds.
- `kill -9` mid-session, then restart pointed at the same snapshot file:
  full state — phase, version, 15 seats, all 15 picks, an `ended: true`
  flag on a separate session — came back byte-exact.
- Board "reopens" mid-reveal for free: it's a stateless poll with no
  session/socket of its own, so any fresh `GET .../board` immediately
  returns the live phase and view with no reconnect handshake needed.
- Display names are escaped everywhere they're injected into `innerHTML`
  in `/teach` and `/board`; the one place `/play` renders the caller's
  own name uses `textContent`. No stored-XSS path found via a student's
  chosen name.
- Server stdout logs contain no student names, only boot banner text; the
  snapshot file stores hashed device tokens (SHA-256) and scrypt-hashed
  PINs, never plaintext — display names are plaintext at rest, expected
  for roster rendering, on a file that never leaves the teacher's machine.

## Load test — 35 concurrent scripted clients, ~45s, one Node process

35 student pollers (`/api/me` + intermittent `place` actions) + 1 teacher
poller + 1 board poller, ETag-aware, realistic 1–1.5s intervals, against a
live draft-day session on the built (not dev) server.

| metric | p50 | p95 | max | n |
|---|---|---|---|---|
| student `/api/me` poll | 1ms | 2ms | 18–28ms | ~1,275 |
| teacher poll | 1ms | 2–6ms | 8–9ms | ~38 |
| board poll | 1ms | 2ms | 14ms | ~45 |
| action submit | 1ms | 2ms | 10–11ms | ~370–400 |

Aggregate throughput ~38–39 req/s, **zero poll errors** across two runs.
CPU stayed at 3.4–4.8% of one core for the whole run; RSS grew ~94MB →
98MB (~4MB for the run, on top of prior sessions already held in memory).
No degradation cliff at this scale — matches the README's "trivial load"
claim. (Action-attempt "errors," ~230–260 per run, were a load-script
artifact — it reused the same cheap player ID for both SCORER and
WILDCARD, correctly rejected by the real "already on your wall" rule each
time; not a server defect.)

**Payload/Chromebook proxy:** full `/play` page weight (HTML+JS+CSS, no
framework, no images/fonts) is **~35KB** uncompressed. Poll bodies run
**116 bytes** (board, idle) to **~3.8KB** (draft-day `/api/me` mid-PLAY
with the full 20-player market embedded) to **~2.5KB** (teacher). All
small enough that the missing compression (ADVISORY above) doesn't matter
at this scale.

## RULING

**ACCEPT WITH REQUIRED REPAIRS**

1. Gate `POST /api/sessions/:code/control` (and the `GET .../teacher`
   view it shares an authority boundary with) behind a credential only
   the teacher's own `/teach` session holds — a per-session teacher
   token issued at `createSession` and required on every control/teacher
   call is the minimal fix; this closes B1 and B2 together.
2. Fix `restore` to also clear `ended` (and capture a checkpoint on `end`
   itself, not just before advance/reveal/freeze/hook), so the one
   built-in recovery path actually covers the single most likely teacher
   mis-click. Closes B3.
3. Add a minimum viable throttle to `POST /api/sessions/:code/rejoin` —
   even a flat per-session-code delay or attempt counter with lockout
   after N failures changes the exploit from "7 minutes, unattended" to
   "impractical mid-class."
4. On a snapshot `JSON.parse` failure, quarantine the bad file (rename
   aside) and boot with a fresh empty store instead of `process.exit(1)`,
   logging loudly — trades "silently start over" for "silently stay
   down," which is the safer default for a live classroom.

None of these require an architecture change — all four are localized to
`sessionService.ts`/`http.ts` (1–3) and `snapshotRepository.ts` (4). Everything
else attacked here — persistence, phase gating, action validation, concurrency
serialization, restart survival, and classroom-scale load — held.
