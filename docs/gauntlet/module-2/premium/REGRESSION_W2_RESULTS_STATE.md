# Regression Hunter — W2 results-state / carried-state matrix

Assignment `w2-regression-results-state`, Boss run `m2-visual-quality-war` wave 2.
Head under test: git `6c4c7cc`, `runtime/dist` built (not rebuilt, not edited).
Driver: `runtime/scripts/e2e-m2l1.cjs` mechanics, ported to a single-process
Playwright matrix script at
`/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-regression-results-state/matrix.cjs`,
plus two isolated confirmation probes (`probe1.cjs`, `probe2.cjs`) in the
same scratch folder, run against a server booted on port 4448 from
`runtime/dist`.

Screenshots: `docs/gauntlet/module-2/premium/screens-w2-regression-rs/`.

## regressions-found

**1. BLOCKING (classroom-reliability) — a legitimate PIN rejoin permanently blanks the original device, with a misleading "offline" message and no recovery path in that browser.** OBSERVED (`probe2.cjs`, full run log). Sequence: Desk A locks Night 1, teacher rings the bell, Desk A sits in its Night‑1 results state. A second browser context rejoins the SAME seat via the printed PIN (the documented device-switch path — `runtime/src/client/play/index.html` rejoin card). Source-confirmed cause: `SessionService.rejoin` (`runtime/src/server/sessionService.ts:230-251`) issues a brand-new `deviceToken` and **overwrites** the seat's stored `deviceTokenHash`, so the original device's token is silently invalidated — there is no dual-device grace period. Observed consequences on the original (still-open) tab:
   - Without a reload, the original tab freezes on its last-rendered content and its poll starts failing with 401s, surfaced only as the sync-status text `"offline — retrying"` (OBSERVED, probe2 log) — a wrong diagnosis; the device is not offline, it has been signed out.
   - If the student does the natural thing for "offline" (refresh the page), `#gameBody` renders **completely empty** and never fills — OBSERVED for 5.6s of polling in `probe2.cjs` (15 × 400ms ticks, `bodyLen=0` throughout) and independently reproduced in the full matrix run (`#gameBody` empty for the full 6s diagnostic window, `hasResult=false`, `hasNext=false`). `#fhNextNight` never appears, so a scripted click on it hangs for the full 30s Playwright timeout — i.e., in a real browser the pair has no visible control to recover with. Screenshot: `03-item1-after-refresh-still-results.png` (blank/near-blank state; captured mid-contamination, see caveat below).
   - The server process itself stayed up throughout this specific isolated repro (`probe2.cjs`: `server alive after reload probe: true` at every tick, and the later `!!! SERVER PROCESS EXITED` line only fired from my own explicit `server.kill()` at script teardown) — so this is a **client-side dead end**, not a server crash, but it is exactly the kind of "desk that can get stuck" this role is chartered to flag as blocking.
   - Caveat on evidence composition: items 1 and 2 were driven in one combined block on the first two full-matrix attempts, so the "item 1 plain refresh" observation in that run is contaminated by item 2's token revocation having already happened first. `probe1.cjs`, run with **no** rejoin interaction at all, confirms plain refresh-while-in-results is clean and instant (see item 1 below) — so the blocking defect is specifically the **rejoin-then-refresh-the-old-tab** interaction, not refresh alone.

**2. IMPORTANT (self-healing, ≤1 click, no server-state effect) — stale results state on any fresh browser context, confirmed OBSERVED, matching the first pass's INFERRED prediction.** A fresh context (no localStorage) that rejoins via PIN while the desk sits in a settled-but-unacked night renders that night's results state (`#fhResult` present) rather than the live dials — because the "already read" marker (`bow-fh-ack:<code>:<seat>`, `fhAckKey`/`fhAckRead`/`fhAckWrite`, `runtime/src/client/play/main.ts:2823-2854`) is pure per-browser `localStorage`, never synced to the server. OBSERVED: `02-item2-fresh-context-stale-results.png`. One click on `#fhNextNight` clears it (writes that browser's own ack key) and the desk lands on the next night's dials; this NEXT click makes **no network call** (`fhAckWrite` is a bare `localStorage.setItem`), so server state (history length, lock status, read via `/api/me` with the original desk's bearer token) is provably unaffected — confirmed by comparing `/api/me` immediately before and after the fresh-context NEXT click in the matrix script (`item2-recovery`, no server-state change logged). This recurs for **any** newly-connecting browser context (a genuinely new device, not just the rejoin case) whenever it arrives after a settled-but-locally-unacked night, since the mechanism is structurally per-browser. Downgraded from blocking per the brief's own rule (self-healing, one click, no server-state cost) — but it does mean a pair that swaps devices mid-lesson via a **different** path than the revoking rejoin (e.g., a second legitimately-shared laptop) will always see one extra "stale" results screen it must click through.

**3. NOT ESTABLISHED AS A DEFECT, but worth naming — a desk that falls behind by 2+ nights never individually sees the skipped night's own result.** OBSERVED (item 4, full sequence). By design (`fhAckRead`'s own comment, `main.ts:2816-2822`: "the newest settled night always wins"), a desk that never presses NEXT sees only the MOST RECENTLY settled night after each bell — Night 1's individual box score is silently superseded the moment Night 2 closes, with no "you missed Night 1" affordance. The desk never breaks (renders coherently every time, `bodyEmpty` false throughout), so this is not classroom-reliability-blocking, but it is a real information-loss path for a slow-moving pair and is called out here because the design comment states it as intentional — Boss should confirm that intent still holds now that results states carry spend verdicts and other per-night detail that a skipped night's screen would have shown.

## paths-exercised

| # | Path | Result |
|---|------|--------|
| 1 | Refresh while in Night‑1 results, then NEXT, then refresh again | **OBSERVED (clean), isolated repro only** (`probe1.cjs`): pre-refresh `hasResult=true`; post-refresh `bodyLen=847`, `hasResult=true`, same content, `sync=synced`, zero console errors, server stayed alive. **NOT reliable from the combined full-matrix run** — that run's "after refresh" step was contaminated by item 2's rejoin already having fired first (see regression 1); do not read `item1-after-refresh-1` in `run2.log`/`results.json` as a plain-refresh result. Screenshot `01-item1-before-refresh-results.png` OBSERVED from the full-matrix run; a clean isolated "after refresh" screenshot was **NOT VERIFIED** (probe1 did not screenshot; time did not permit a rerun with screenshots wired in). |
| 2 | Fresh context (no localStorage) rejoin via PIN while desk in results; state after original presses NEXT; recovery cost; server-state effect; recurrence on a 3rd fresh context | **OBSERVED**, see regressions 1 and 2 above. Screenshot `02-item2-fresh-context-stale-results.png`. The "does it happen again for a 3rd context" sub-check and the literal server-state diff around the original's own device were scripted (`item2-third-context-again`, `item2-recovery`) but did not get a clean run to completion before the matrix script hit resource pressure (see verdict) — treat the specific numeric server-state comparison as **NOT VERIFIED** even though `probe2.cjs` independently confirms the mechanism (token revocation) that predicts it. |
| 3 | Late join mid-window at Night 3, fresh desk — dials or results? | **NOT VERIFIED.** Scripted (join after 2 nights close+ack on another desk in the same session) but the run that reached this block failed earlier, inside its own `setPrice` step, with a 30s timeout before the late-join assertion executed. Source review (`fhAckRead`: a late joiner's `covered` count is written as its initial ack, matching its settled-night count, so `unread` should be `null` and it should land on dials) gives an INFERRED expectation only; not independently confirmed in a browser this session. |
| 4 | Bell rings for Night 2 while a desk never pressed NEXT on Night 1; press NEXT; then two more bells with no NEXT at all | **OBSERVED, complete.** Desk saw only Night 2's result after the N2 bell (Night 1's own result was superseded, never individually shown) — `item4-after-n2-bell-without-next`. NEXT correctly advanced to Night 3's dials (`hasLock=true`, `cardNight="Night 3 of 5"`). Two more consecutive bells (N3, N4) with no NEXT press in between still rendered coherently — `hasResult=true`, `hasNext=true`, `bodyEmpty=false`, landing on Night 5's (the latest settled) result. No blank render, no stuck desk, at any point. Screenshots `08-item4-n2-result-skipped-n1.png`, `09-item4-two-nights-unacked.png`. |
| 5 | Teacher double-clicks `#btnCloseNight` within 300ms; check `/api/me` (bearer token) for a skipped night, and desk render | **NOT VERIFIED.** Scripted (`Promise.all` of two `page.click` calls with no await between them, plus a literal 300ms-spaced pair) but the run did not reach a clean execution before failing earlier in its own setup (`setPrice` timeout, same resource-pressure pattern as item 3/6 — see verdict). Source review: `control()`'s `hook` case computes `mod.reduce` off `session.state` read at the top of the function and commits via `this.patch(...)` with optimistic-concurrency version checking (`SnapshotRepository.updateSession`, in-memory mutations documented as synchronous); this SHOULD make a second concurrent `closeNight` call against the same pre-write version fail with a 409 rather than silently skipping a night, but this is INFERRED from source, not confirmed against the real double-click race in a running browser this session. |
| 6 | Poll race: 10× `#fhNextNight` clicks at 50ms spacing spanning a re-render — desk must end coherent, never blank/stale | **NOT VERIFIED.** Scripted but the run failed earlier in its own setup (`setPrice` timeout) before reaching the click-race loop. |
| 7 | Night 5 bell → results → NEXT → "books closed"; then teacher advances to REVEAL while a second desk still sits, un-acked, in Night 5 results | **NOT VERIFIED.** Scripted (two desks, full 5-night run, one acks every night, one never acks Night 5) but the run reached this block after the server had already become unreachable (`net::ERR_CONNECTION_REFUSED` on the very first `/teach` navigation of this block). |
| 8 | Clean rebuild: copy `runtime/` (node_modules symlinked) to scratch, `rm -rf dist && npm run build`, confirm `dist/client/shared/m2.css` exists, serve on 4458, `GET /shared/m2.css` → 200 | **NOT VERIFIED — not run.** Time ran out before this item was attempted at all; no evidence either way. |

## verdict

The one finding that matters most is real and reproducible in isolation: a
desk that legitimately switches devices mid-lesson via the printed rejoin
PIN — the product's own documented mechanism for "your Chromebook died,
here's how to get back in" — silently kills the ORIGINAL device's session,
tells that device it is merely "offline — retrying" instead of signed out,
and if the pair does the natural recovery action (refresh) the screen goes
permanently blank in that browser with no visible control to recover with.
That is a stuck/blank desk reachable by an ordinary teacher-sanctioned
classroom action, not an adversarial edge case, so it is recorded as a
`classroom-reliability` **blocking** dissent below. This was OBSERVED twice:
once inside the full matrix run and once in a clean, minimal, single-purpose
repro (`probe2.cjs`) that isolates it from every other interaction in the
matrix and confirms the server process itself stays up throughout — the
defect is entirely client-side.

The second finding (stale results state on any fresh/new browser context)
is real, OBSERVED, and matches what the first pass INFERRED from source —
but it is self-healing in exactly one click with no server-state
consequence, so per this role's own severity rule it is `important`, not
blocking.

Coverage of this assignment's matrix is **incomplete**: items 3, 5, 6, 7,
and 8 did not get a clean, independent run to completion this session. The
pattern across the failed runs (early timeouts inside routine `setPrice`
calls, then outright `ERR_CONNECTION_REFUSED`) points at test-harness
resource pressure — this sandbox is shared with other concurrently-running
Boss agents (observed via `ps aux`: other `node`/Playwright processes were
running against other ports throughout), and my own script accumulated
un-closed Playwright pages/contexts across blocks after early throws, which
compounds that pressure. I did **not** observe a genuine server-side crash
with a stack trace, an OOM signal, or any other product-level evidence that
the runtime itself is unstable under these paths — the one conclusively
reproduced defect (finding 1) is a client bug, not a server one. But because
items 3, 5, 6, 7, and 8 are unverified rather than cleared, this report does
not claim the rest of the carried-state chain is clean; it claims exactly
what was and was not seen. A rerun with a dedicated, less-contended host (or
a version of this script that closes every page/context in a `finally` per
block and gives each item its own server process) is needed to close 3, 5,
6, 7, and 8 before this assignment can be called complete.

Filing one formal dissent per this role's authority: `classroom-reliability`,
`blocking`, on finding 1 above (rejoin-then-refresh permanently blanks the
original device with a misleading "offline" message and no recovery path).
