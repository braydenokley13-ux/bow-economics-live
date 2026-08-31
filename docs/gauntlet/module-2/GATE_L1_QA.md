# GATE_L1_QA — Browser QA, Module 2 Lesson 1 "Full House" (m2l1-full-house)

Independent Browser QA gate, Boss run `m2-quality-war`, assignment
`gate-l1-qa`. Driven with real Chromium (Playwright) against the built
server (`runtime/dist/server/index.js`, `npm run build` run this session),
booted on `PORT=4313` with a scratch `RUNTIME_SNAPSHOT_FILE`. Every path
below was actually exercised in a browser this session — nothing here is
reasoned-about-but-unrun. Driver script:
`runtime/scripts/e2e-m2l1.cjs` was read for the boot/session/pacing pattern;
this gate's own driver lived at
`/tmp/claude-0/.../scratchpad/qa-m2l1.cjs` (session-scoped, not part of the
repo) and is not preserved in the repo — its actions are fully described
below and reproducible from this report plus the referenced product files.

## paths-exercised

1. **Full arc at 1366×768 across all three surfaces** — LOBBY → HOOK → PLAY
   (5 nights, night bell each night) → REVEAL (7 staged beats) → ADAPT →
   COUNTERFACTUAL → SYNTHESIS → COMPLETE. Screenshotted on `/play` (Desk 1),
   `/board`, and `/teach` at each phase transition. All phases rendered on
   all three surfaces with no missing panel, no console error, no failed
   (non-deliberate) request. Desk assignment (odd = New York Knicks, even =
   Memphis Grizzlies) confirmed correct on join.
2. **Touch-target / legibility check at 1366×768** — measured the price
   dial (`#fhPriceDial`, 578×22px) and the primary "LOCK IT IN" button
   (`#fhLock`, 578×38px) on the student PLAY screen. See defect D2.
3. **Privacy — board rendering at every phase.** Programmatically scanned
   `/board`'s full rendered text at LOBBY, the still-open Night 1 (before
   the bell), REVEAL, ADAPT, COUNTERFACTUAL, and SYNTHESIS for every
   student pair name used in the session (`Rae`, `Ben`, `Nour`, `Ivy`,
   `Ari`, `Tal`, `Sam`, `Jo`) and for any locked-but-still-open price
   ($34, the Night 1 dial value) reaching the board before the teacher's
   bell. **No leak found at any phase.** Desks render only as
   `Desk N · <Team>` with a crest, matching the design doc.
4. **Privacy — `/teach` access without the bearer key.**
   `GET /api/sessions/:code/teacher` called with no `Authorization` header
   → HTTP 401. Same call with a garbage bearer token → HTTP 401. Confirmed
   the teacher surface's own API is properly gated (R1); the shell page
   itself has no server-rendered secrets to leak either way.
5. **Resilience — mid-PLAY page refresh.** After Desk 1 locked Night 1,
   hard-reloaded that tab. Desk 1's locked state, cash, and history
   survived the reload intact (no re-prompt, no reset).
6. **Resilience — duplicate join of the same seat name from a second
   browser context** while Night 1 was still open. Server correctly
   rejected with `409` and the UI showed a clear inline message: *"that
   name is already in this session — use the rejoin PIN if this is you"*
   — no duplicate desk created, no crash.
7. **Resilience — late join during Night 3.** A fourth pair joined mid-PLAY
   at Night 3. They received Desk 4 · Memphis Grizzlies with Nights 1–2
   pre-filled and explicitly labelled `COVERED` in their own history table
   (visible in the screenshot), not a blank sheet.
8. **Resilience — Desk 3 deliberately never locks Night 5.** Confirmed the
   teacher's bell auto-committed that desk at the season-ticket plan price
   and the desk's own screen labelled the night `auto`.
9. **Resilience — teacher misclick: advancing out of PLAY with an
   uncommitted dial.** Isolated single-seat session. Seat set Night 1's
   price to $56 and left it **unlocked**. Clicked the teacher's primary
   `Advance` button (not the night bell). No `confirm()` dialog appeared.
   The session immediately left PLAY for REVEAL. **All five nights**
   auto-settled — including the currently-open Night 1, whose actually-set
   $56 was discarded in favor of the season-plan price ($24) because the
   settlement path only honors a *locked* price. The desk's own reveal
   screen shows all five nights at a flat $24, i.e. the pair played **zero**
   real nights of the lesson. See defects D1/D3.
10. **Resilience — board refresh mid-REVEAL.** Reloaded `/board` mid-way
    through the 7-stage reveal sequence; the board recovered its current
    reveal stage and rendered without error.
11. **Resilience — server restart mid-session (snapshot resume).** Locked
    Desk 1's Night 1 at $60 in a fresh session, killed the server process
    (`SIGTERM`), restarted it pointed at the same `RUNTIME_SNAPSHOT_FILE`,
    and confirmed `GET /board` returned the same session (HTTP 200) with
    state intact, and a fresh `/board` page load reconnected and rendered
    correctly with zero manual intervention.
12. **Malformed input — direct action POST, bypassing the UI's own
    clamping,** using a real seat's device token:
    - `setPrice(999999)` → HTTP 409, clean reject: *"price must be
      $10-$120 in $2 steps"*.
    - `setPrice(-50)` → HTTP 409, same clean reject.
    - `setPrice("not-a-number")` → HTTP 409, clean reject.
    - `setSpend(99999999)` (far over the legal event-spend cap) → HTTP 409,
      clean reject: *"night spend must be $0-$120,000 in $5,000 steps"*.
    - No 500s, no unhandled exceptions, no state corruption in any case.
13. **Privilege escalation checks.**
    - A student seat's own device token, replayed as a `Bearer` teacher key
      against `POST /control {type:"advance"}` → HTTP 401 (correctly
      rejected — a seat token is not a teacher key).
    - A student seat submitting the teacher-only `teacher:closeNight`
      action via `/actions` → HTTP 409, clean reject: *"only the teacher
      rings the night bell"*.
14. **1920×1080 spot-check.** Captured `/board` at COMPLETE, `/teach`'s
    panel, and `/play`'s join screen at 1920×1080. Layout is centered and
    proportionally identical to 1366×768 (the product does not appear to
    use a fluid/responsive breakout at the larger size — same fixed-width
    centered card layout, just more surrounding black space), no new
    defects observed at this size.
15. **Console/network monitoring across every path above.** Zero
    unexpected console errors and zero unexpected failed requests. The
    only console errors/failed requests logged were the *deliberately
    induced* ones: the 409 from the duplicate-join test, and
    `ERR_CONNECTION_REFUSED`/`ERR_ABORTED` polling noise from the *other*
    open tabs during the ~1s window the server process was down for the
    restart test (expected — polling's whole design is "fail this tick,
    try again next tick," confirmed working as documented).

## artifacts

All under `docs/gauntlet/module-2/screens-l1-qa/` (28 PNGs + 1 findings
JSON captured this session):

- `teach-1366x768-lobby.png`, `board-1366x768-lobby.png`,
  `play-1366x768-lobby-d1.png` — LOBBY
- `play-1366x768-hook.png`, `board-1366x768-hook.png`,
  `teach-1366x768-hook.png` — HOOK
- `play-1366x768-night1-predock.png` — PLAY opens, pre-dial
- `board-1366x768-night1-open.png`, `play-1366x768-night1-dials.png` —
  Night 1 dials set, board still shows nothing about the open night
- `play-1366x768-after-reload-d1.png` — mid-PLAY refresh resilience
- `play-1366x768-duplicate-join.png` — duplicate-seat-join rejection
- `play-1366x768-late-join-d4.png` — Desk 4's late join at Night 3, with
  `COVERED` nights visible
- `board-1366x768-two-peaks.png` — teacher-released Two Peaks panel
- `play-1366x768-shock-soldout.png` — Night 4 shock, sold-out desk
- `teach-1366x768-after-play.png` — teacher panel once all 5 nights closed
- `board-1366x768-after-refresh-midreveal.png` — board refresh mid-REVEAL
- `board-1366x768-reveal-books.png`, `board-1366x768-adapt-curve.png`,
  `board-1366x768-counterfactual.png`, `play-1366x768-counterfactual.png`,
  `board-1366x768-synthesis.png`, `board-1366x768-complete.png`,
  `teach-1366x768-complete.png` — remaining phases
- `board-1920x1080-complete.png`, `teach-1920x1080-loaded.png`,
  `play-1920x1080-join-screen.png` — 1920×1080 spot-check
- `board-1366x768-after-server-restart.png` — snapshot-resume proof
- `play-1366x768-misclick-before-d1-uncommitted.png`,
  `play-1366x768-misclick-after-d1.png`,
  `teach-1366x768-misclick-after.png` — teacher-misclick isolation test
- `_qa-findings.json` — the raw machine-readable log this report was
  written from (paths, defects, console/network capture)

## defects

1. **BLOCKING — classroom-reliability.** Clicking the teacher's primary
   `Advance` button during PLAY, while any night is open (not just the
   last), silently and permanently ends the play window for the whole
   class with **zero confirmation dialog**, unlike the equivalent
   early-advance guards already shipped for `m1l2-trade-deadline` and
   `m1l3-free-agency` (`advanceWarnState` in
   `runtime/src/client/teach/main.ts` has no `kind` wired for
   `m2l1-full-house`). Worse than a skip: the currently-open night's own
   **uncommitted-but-set** dial value is discarded too, because
   `onPhaseExit`'s settlement (`runtime/src/modules/fullHouse.ts`,
   `closeNight` inside the `while` loop) only honors a *locked* desk;
   every night — including one the pair was actively mid-decision on —
   auto-settles at the flat season-ticket plan price. In the isolated
   repro, a desk that had set Night 1 to $56 (never locked) ended the
   whole 5-night arc at a flat $24 every night, i.e. the pair experienced
   **none** of the five real pricing decisions the lesson is built on. One
   real, plausible teacher tap (the always-visible primary phase-advance
   control, right next to the correct "🔔 Open the doors" bell) destroys
   the core experience-consequence loop for the entire class with no
   warning and no recovery path other than ending/restoring the session
   and accepting the loss. Screenshots:
   `play-1366x768-misclick-before-d1-uncommitted.png`,
   `play-1366x768-misclick-after-d1.png`,
   `teach-1366x768-misclick-after.png`. Repro: create an m2l1-full-house
   session, join one seat, advance to PLAY, set (but do not lock) a price,
   click the teacher's `Advance` button instead of `🔔 Open the doors`.
2. **MODERATE — touch target.** The `LOCK IT IN` button (`#fhLock`) on the
   student PLAY screen measures 578×38px at 1366×768 — 2px under the
   ~40px minimum comfortable touch-target height named in the brief. Not a
   hard miss (38px is very close, and the button is full-width so
   mis-tapping past it is unlikely), but worth a one-line CSS bump before
   calling this Chromebook-ready. Screenshot:
   `play-1366x768-night1-predock.png`.
3. **MODERATE (same root cause as D1, listed separately for traceability)
   — no confirm() dialog before an early-PLAY advance.** Isolated from D1's
   consequence: even independent of the auto-settlement behavior, the
   *absence of any warning* is itself the gap that makes D1 a one-tap
   accident instead of a deliberate, confirmed choice. Fixing this alone
   (wiring an `advanceWarnState` for full-house, mirroring L2/L3) would
   convert D1 from "silent live-class accident" to "the same intentional,
   confirmed early-close the design already uses elsewhere," which may be
   an acceptable resolution short of changing the settlement math itself.

No other defects found: no 500s or state corruption from any malformed
input or privilege-escalation probe, no privacy leak on any board render
at any phase, no console errors or failed requests outside deliberately
induced ones, snapshot resume worked cleanly, late join and duplicate join
both behaved correctly.

## not-verified

- **All other student seats' (Desk 2, 3, 4) full-page screenshots at every
  single phase** — only Desk 1 (and Desk 4 for the late-join and Desk 2 for
  the shock-night moment) were screenshotted at every step; the other
  desks were driven and asserted via the DOM but not exhaustively
  screenshotted at 1920×1080 or at phases beyond their targeted checks, per
  the coordinator's instruction to prioritize and skip exhaustive
  1920×1080 coverage.
- **1920×1080 full-arc parity** — only three key screens (board COMPLETE,
  teach panel, play join screen) were captured at 1920×1080, not the full
  phase-by-phase arc, per the coordinator's explicit scope cut. No
  1920×1080-specific defect is known to exist beyond what full-arc
  1366×768 coverage plus this spot-check surfaced.
- **Real classroom network conditions** (a real school Wi-Fi AP, real
  Chromebook hardware, 25–35 concurrent real devices) — this gate ran
  against `localhost` with simulated browser contexts only; the
  polling-under-packet-loss story is architecturally described in
  `runtime/README.md` but was not independently re-verified under induced
  latency/packet-loss this session.
- **Rejoin-PIN flow itself** (using a PIN to reclaim a seat from a second
  device) was not exercised — only the *duplicate-join-with-same-name*
  rejection path was tested, not a legitimate rejoin.
- **The 5-lockout-then-teacher-unlock rejoin flow** (`POST
  .../seats/:seatId/unlock`) mentioned in `runtime/README.md` was not
  exercised.
- **Screen-reader / keyboard-only accessibility** was not in scope for this
  pass and was not checked.
- **Exact device-token localStorage key name** required one round of
  runtime introspection (`bow-play-credentials`, JSON-encoded) to drive the
  malformed-input probes directly — noted for reproducibility, not a
  defect.
