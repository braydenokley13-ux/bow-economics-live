# REGRESSION_W2_RECHECK — Regression Hunter re-check after repairs

Assignment `w2-recheck-regression`, Boss run `m2-visual-quality-war` wave 2
repair loop. Head under test: `54402b0`. `runtime/dist` used as shipped
(built at this head by the lead); not rebuilt, no repository files modified.
Driver: `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-recheck-regression/recheck.cjs`
(Playwright, port 4448), plus a focused diagnostic
`debug-b.cjs` (port 4459). Two full runs (`run.log`, `run2.log`) plus the
debug run are in that scratch dir. Screenshots:
`docs/gauntlet/module-2/premium/screens-w2-regression-recheck/`.

Ordered by the coordinator's stated priority, highest severity first.

## 1. Rejoin/401 blocking finding (F1, `7a34460`) — **DISCHARGED (measured)**

OBSERVED, twice (`run.log`, `run2.log`, both full runs, block A). Desk A
locks Night 1, teacher closes it, Desk A sits in Night‑1 results. Desk B
(fresh browser context) rejoins the SAME seat via the printed PIN.

- Within one poll tick (1.6s, no reload) on Desk A: `joinCardHidden=false`,
  `gameCardHidden=true`, `errText="This desk was opened on another device.
  Rejoin with your PIN."`, `syncText="signed out"` — **never**
  `"offline — retrying"`. Screenshot `A1-desk-a-within-one-poll.png`.
- After `page.reload()` on Desk A: same join card, same signed-out line,
  survives the reload (`sessionStorage` flag). `#gameCard` stays hidden, so
  the forbidden state ("empty `#gameBody` with `#gameCard` visible") did
  **not** occur in either run — `bodyEmpty=true` only while `gameCardHidden`
  is also `true`. Screenshot `A2-desk-a-after-reload.png`.
- Desk B kept playing throughout: after Desk A was signed out, Desk B
  clicked `#fhNextNight` and advanced cleanly to `Night 2 of 5`
  (`hasLock=true`, `gameCardHidden=false`). Screenshot
  `A3-desk-b-still-playing.png`.
- Zero console errors other than the expected `401` on Desk A's own poll
  tick that triggered the sign-out (that 401 is the mechanism, not a bug).

Verdict: the blocking `classroom-reliability` finding from
`REGRESSION_W2_RESULTS_STATE.md` finding 1 is **discharged**. My prior
dissent on this finding is **resolved**.

## 2. Refresh mid-results / late-join on results state — **PARTLY VERIFIED / NOT VERIFIED**

- Plain refresh while sitting in results (no rejoin involved), captured
  incidentally inside block A before Desk B rejoined: Desk A rendered its
  Night‑1 results (`hasResult=true`, `gameCardHidden=false`,
  non-empty snippet) normally — OBSERVED, but this was not an isolated
  refresh-only repro this session (no `reload()` was called before the
  rejoin in block A); a dedicated plain-refresh-while-in-results retest was
  **NOT VERIFIED** this session. Treat the prior pass's `probe1.cjs` result
  (clean) as historical evidence only, not re-confirmed here.
- Late join mid-window at Night 3 (block B): **NOT VERIFIED**. Both attempts
  (`run.log`, `run2.log`) threw inside their own `setPrice` step (Night 1)
  before ever reaching the late-join assertion — see Environment note
  below. No browser evidence either way was collected at this head this
  session.

## 3. Teacher-bell auto-commit path, two unacknowledged nights — **NOT VERIFIED**

Blocks C (double-click `#btnCloseNight` within 300ms + `/api/me` for a
skipped night), D (10x `#fhNextNight` @ 50ms across a re-render), and E
(Night 5 results → NEXT → books closed; REVEAL while a second desk sits
un-acked) all failed to complete in both full runs — C and D threw inside
`setPrice`, and after that the shared server process itself stopped
answering (`net::ERR_CONNECTION_REFUSED` on `/teach` from block D onward in
`run2.log`; `server.log` shows a clean `SERVER EXITED code=0 signal=null`
with no stack trace or OOM signal — not a crash, but an unexplained early
exit under this sandbox's load). None of items C/D/E produced usable
evidence at this head this session. **This carries forward, unresolved, as
the same "incomplete coverage" gap named in the prior pass** — it is not
newly regressed, but it is still not cleared.

Diagnosed cause, not a product defect: a standalone single-purpose debug
script (`debug-b.cjs`, its own server on port 4459, no other concurrent
load from this script) reproduced the exact block-B steps end-to-end
successfully — `#fhPriceDial` present, price-set round-trips correctly
(`$24` → `$42` after setting `41`; the dial visibly snaps to even values,
which is why my `setPrice` helper's exact-string wait can legitimately
stall on an odd target — a test-script defect in my own harness, not
observed as a product defect). `ps aux` during the failing full runs showed
another Boss agent's script (`w2-recheck-econ/deckmeasure.cjs`) pinned at
~90% CPU and ~2.3–2.9GB RSS throughout — the same shared-sandbox pressure
pattern the prior regression pass already named as the likely cause of its
own incomplete items 3/5/6/7. I did not observe a server-side stack trace,
assertion failure, or OOM log line implicating the product itself.

## 4. Module 1 pixel baseline at the repaired head — **NOT VERIFIED**

Not run this session — time did not permit `shots-m1-extended.cjs` +
`compare-m1-ext.cjs` against `screens-m1-baseline-ext` at head `54402b0`.
No claim, positive or negative, is made about M1 pixel drift at this head.

## Additional items observed this session (not in the coordinator's 1–4, kept for completeness)

- **`onUnchanged` (D1, `poll.ts`) — DISCHARGED (measured).** Block F: routed
  two consecutive `/api/me` calls to a `500` (code `transient_test`, not a
  signed-out code), confirmed `syncStatus` moved to `"offline — retrying"`,
  then let the route through normally and confirmed `syncStatus` returned to
  `"synced"` without any user action. Screenshot `F1-sync-recovered.png`.
- **Module 1 `/play` still polls and renders (shared `poll.ts`) — DISCHARGED
  (measured).** Block G: started an `m1l1-draft-day` session, joined, saw
  the lobby line render (`"You're in! Waiting for your teacher to start
  Draft Day."`), then the teacher advanced to HOOK and the desk's own poll
  (no reload) delivered and rendered the Draft Day HOOK copy within 1.5s,
  `syncText="synced"` throughout. Screenshot `G1-m1-play-after-hook.png`.
- **Clean-rebuild-in-scratch-copy check (brief item 5) — NOT VERIFIED.** Not
  attempted this session.

## Environment note

Two full runs were made; the first (no timeout bump) and second (75s/45s
timeouts on the price-dial and lock waits, still generous relative to the
1.2s poll interval) both failed identically from block B onward, and the
second run's server additionally stopped responding partway through. A
concurrent Boss agent process (`deckmeasure.cjs`, a different assignment's
scratch script) was observed consuming ~90% of a CPU core throughout both
runs. This matches, and does not resolve, the same coverage gap flagged in
`REGRESSION_W2_RESULTS_STATE.md`'s verdict. No source-level product defect
was observed in connection with items 2 (late-join sub-case) or 3.

## verdict

The one confirmed blocking finding from wave 2 (rejoin-then-refresh
stranding the original device behind a false "offline" label) is
**discharged** — measured twice, at the repaired head, with the exact
method used before. The `onUnchanged` self-heal and M1 `/play` polling
continuity are both **discharged**. Items 2 (late-join sub-case), 3
(teacher-bell auto-commit / double-close / poll-race / REVEAL-while-unacked),
and 4 (M1 pixel baseline) are **NOT VERIFIED at this head this session** —
neither cleared nor newly regressed. No new regression was observed.

**Dissent status:** the prior `classroom-reliability` blocking dissent on
finding 1 (rejoin-then-refresh) is **resolved** — it is discharged by direct
measurement at the repaired head. No new dissent is filed. Coverage of items
2–4 remains open and should be re-attempted on a less-contended host before
this module is called complete on classroom-reliability grounds for the
teacher-bell/auto-commit and late-join paths specifically.
