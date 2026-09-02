# REGRESSION_W2 — Regression Hunter, wave 2 (`m2-visual-quality-war`)

Head under test: `6c4c7cc` (HEAD `9d8c432` is a Boss ledger-only commit on top,
no source diff). Wave-1 checkpoint: `31fb8c8`. Port 4448 (misclick e2e used its
own required port 4458). `runtime/dist` used as shipped; not rebuilt, no
repository files modified.

**Bounded-plan notice**: this run was cut short by the coordinator before the
full results-state stress matrix (item 2 of the brief) could be exercised in
the browser. Everything below is labeled OBSERVED, INFERRED, or NOT VERIFIED
per item; nothing is claimed as tested that was not actually run.

## regressions-found

1. **[INFERRED, not OBSERVED in browser — important, not confirmed blocking]
   The results-state "already read" marker is client-localStorage-only and is
   not restored on rejoin-from-a-fresh-browser-context, so a desk that
   switches device (or has storage cleared) after acknowledging a settled
   night can be shown a stale results screen instead of its live state.**
   Source: `runtime/src/client/play/main.ts` `fhAckKey`/`fhAckRead`/`fhAckWrite`
   (~lines 2818-2851) and `renderFHPlay` (~2895-2924). The ack value lives only
   at `localStorage["bow-fh-ack:<sessionCode>:<seatId>"]`; server truth is
   `settled = desk.nights.length` (fullHouse.ts, per-desk `history`). On a
   fresh browser context (new device, cleared storage, incognito — a realistic
   classroom event: a Chromebook dies, a student borrows a neighbor's, or a
   mid-class restart lands on a different machine), `fhAckRead` finds no
   stored key and falls back to `covered` (stock/auto-covered nights, 0 for a
   normal desk), not the true prior ack. Since `unread = settled > ack ?
   history[settled-1] : null` is checked before the `locked`/dial branches,
   the desk is shown the most recently settled night's results screen again —
   even if it had already clicked NEXT and moved to (or locked) the next
   night's dial on the original device. It self-heals with one more click on
   `#fhNextNight` (`fhAckWrite(settled)` catches back up) — no data loss, no
   permanent stuck state, and the underlying server-side desk state (locks,
   price, spend) is untouched by this — but the student is shown incorrect
   state on device switch and must notice they need to click through it
   again. Rejoin-via-PIN with the SAME browser/storage intact was not
   distinguished from this path; only the same-device refresh path (which
   works correctly, since localStorage survives a refresh) was reasoned
   through with confidence. **Not empirically driven in a browser this run —
   raise as INFERRED, not OBSERVED.** The two-device/rejoin scenario and all
   other results-state stress items in the brief item 2 (bell-while-in-
   results, double-bell, never-press-NEXT-for-two-nights, the 50ms poll race,
   all-nights-done, REVEAL-while-in-results) are **NOT VERIFIED** — no browser
   run was completed for any of them before the bounded-plan cutoff.

2. **[OBSERVED — no regression] Module 1 pixel baseline: no CSS/layout
   change detected from the wave-2 diff.** Re-captured the 38-frame extended
   M1 baseline (`docs/gauntlet/module-2/premium/tools/shots-m1-extended.cjs`)
   at head `6c4c7cc` on port 4448 and compared byte-for-byte against the
   wave-2 base-head baseline captured before the `/play` rebuild
   (`docs/gauntlet/module-2/premium/screens-m1-baseline-ext`, commit
   `d1a0c24`). 34/38 frames byte-identical. Of the 4 that differ
   (`l2-05-teach-hook`, `l2-10-play-reveal`, `l3-05-teach-day1`,
   `l3-09-teach-reveal`), a second head-only capture (same code, run twice)
   confirmed `l1-12-teach-locked-roster` and `l3-09-teach-reveal` are
   non-deterministic even at fixed code (harness/timing race, matching the
   already-documented pattern in `screens-m1-baseline-ext/compare-result-
   extended.json`, which flagged `l1-11-play-locked-roster`, `l2-10-play-
   reveal`, `l3-05-teach-day1`, `l3-09-teach-reveal` as non-stable before
   this wave's changes even existed). The remaining diffs
   (`l2-05-teach-hook`, `l2-10-play-reveal`, `l3-05-teach-day1`) were
   pixel-cropped and inspected: `l2-05-teach-hook` differs only in a
   join-order-dependent "1/3 vs 2/3 CLAIMED CARRIED FRANCHISES" counter and a
   "LIVE · V3" vs "LIVE · V4" build-version label, same fonts/positions/
   colors — content-state timing, not layout. `l2-10-play-reveal` differs
   only in REVEAL-stage animation timing (a card settled or not yet settled
   at capture time) — the same frame already flagged as a known race.
   `l3-05-teach-day1` differs by a handful of sub-pixel rows on an "End
   session" button (antialiasing). No frame showed a moved element, a
   changed font, a changed color, or any `m2.css`/`Inter M2`/arena leakage
   into an M1 view. `html[data-module="m2"]` gating (`runtime/src/client/
   shared/m2.css` header comment + `runtime/src/client/play/main.ts:206-208`)
   and the `Inter M2` (not `Inter`) font-family namespacing were also read
   and confirm the inertness argument at the source level. **This is a clean
   result** — evidence: `docs/gauntlet/module-2/premium/screens-w2-
   regression/compare-baseline-vs-head.json`, `compare-head-vs-head-
   repeat.json`, and the 4 crop PNGs in the same folder.

3. **[OBSERVED — gap, not a regression] `/board` and `/teach` never set
   `document.documentElement.dataset.module`.** `grep` of
   `runtime/src/client/board/main.ts` and `runtime/src/client/teach/main.ts`
   found no `dataset.module` assignment (only `runtime/src/client/play/
   main.ts` sets it, at line 206-208). All three `index.html` files now link
   `/shared/m2.css` unconditionally (`copy-static.mjs` diff,
   `board/index.html`, `teach/index.html`). Because the CSS is entirely
   scoped under `html[data-module="m2"]` selectors and nothing sets that
   attribute on `/board` or `/teach`, this is inert everywhere on those two
   surfaces today — safe for M1, but also means `/board` and `/teach` get
   zero M2 styling for an M2 lesson right now. The brief states `/teach` and
   `/board` are wave 3, not in scope for grading this wave; recording this
   as a fact for the record, not as a wave-2 regression.

4. **[OBSERVED — clean] Shared render helpers untouched.** `git diff
   31fb8c8..6c4c7cc -- runtime/src/client/play/main.ts` hunks are confined to
   (a) the `renderGame` module-gate insertion (`dataset.module` set/clear)
   and (b) the entire Full House section (`money()` through
   `renderFHCounterfactual`). `$()`, `escapeHtml()`, `setText()`, and the body
   of `money()` itself appear only as unchanged context in the diff, never in
   a `-`/`+` hunk line. No M1 `renderX` function (`renderDraftDay`, trade-
   deadline/free-agency renderers) was touched.

5. **[OBSERVED — PASS] Misclick e2e.** `E2E_PORT=4458 node runtime/scripts/
   e2e-m2l1-misclick.cjs` — exit code 0. Output: `#fhLock` "LOCK IT IN"
   measured 331×56px at 1366×768; `confirm()` text correctly describes the
   early-advance consequence ("Night 1 of 5 is still open... 1 desk has not
   locked; it settles at whatever price is on its dial right now"); dialog
   **cancel** left the session in PLAY with nothing settled; dialog **accept**
   settled all five nights and **kept the pair's own $56** on Night 1 (the
   regression this test was written to catch — an early misclick silently
   discarding a set, unlocked price — did not reproduce). Zero console
   errors. Full log: `docs/gauntlet/module-2/premium/screens-w2-regression/
   misclick-run.log`.

6. **[NOT VERIFIED] Static-asset clean-build check (brief item 4, "rm -rf
   dist && npm run build in a scratch copy").** Only did the lighter check:
   confirmed the *shipped* `runtime/dist/client/shared/` contains both
   `theme.css` (75819 bytes) and `m2.css` (56165 bytes) plus all three
   vendored `.woff2` font files, and that a running server on port 4448
   returns `200` for both `GET /shared/m2.css` and `GET /shared/theme.css`.
   Read `runtime/scripts/copy-static.mjs`'s diff and confirmed it now globs
   every `*.css` under `src/client/shared/` by directory listing rather than
   copying `theme.css` by name, which is the correct fix for the exact
   404-on-clean-checkout failure mode the brief describes. Did **not** run a
   `rm -rf dist && npm run build` in an isolated scratch copy of `runtime/`
   — cut for time under the bounded plan. Mark this sub-item NOT VERIFIED.

## paths-exercised

- M1 pixel-baseline re-capture at head (`shots-m1-extended.cjs`, port 4448,
  38 frames across `/play` `/teach` `/board`, L1/L2/L3) — OBSERVED, run twice
  for determinism separation, byte-compared both against the wave-2 base-head
  baseline and against itself.
- Source read of `html[data-module="m2"]` scoping in `m2.css`, the
  `dataset.module` set/clear site in `play/main.ts`, and `board/main.ts` +
  `teach/main.ts` for the same — OBSERVED via grep/read, not exercised live
  on `/board`/`/teach` (out of scope this wave per the brief).
- `git diff 31fb8c8..6c4c7cc` hunk boundaries for `runtime/src/client/play/
  main.ts` — OBSERVED, confirms shared-helper and M1-renderer inertness.
- `runtime/scripts/copy-static.mjs` diff read; shipped `dist/client/shared/`
  contents and live `/shared/*.css` HTTP responses checked on port 4448 —
  OBSERVED. Clean-rebuild-in-scratch-copy variant NOT VERIFIED.
- `E2E_PORT=4458 node runtime/scripts/e2e-m2l1-misclick.cjs` — OBSERVED, ran
  to completion, exit 0, PASS, log captured.
- Source read of the `#fhResult`/`#fhNextNight` ack mechanism
  (`fhAckKey`/`fhAckRead`/`fhAckWrite`, `renderFHPlay`) and the server-side
  `closeNight`/`seatDesk` mechanics that back it — INFERRED analysis only;
  **no live browser drive of any results-state stress scenario** (refresh
  during results, rejoin-from-fresh-context during results, late join at
  Night 3, bell-while-desk-in-prior-results, double-bell, desk that never
  presses NEXT for two nights, the 50ms poll-tick race, all-nights-done,
  phase-advance-to-REVEAL-while-in-results) was completed before the
  bounded-plan cutoff. All of these remain **NOT VERIFIED** except the one
  reasoned through from source with high confidence (late join at Night 3
  lands on the dials, not on a stale/duplicate results screen — `seatDesk`
  fills `covered = nightIndex` stock nights and `fhAckRead` initializes
  `ack = covered`, so `unread` is false on first render; matches the code
  comment's own claim).
- `runtime/src/test/*.test.ts` were not re-run this session (brief's bounded
  plan named only the misclick e2e).

## verdict

No blocking regression was OBSERVED this run. The one finding worth carrying
forward is INFERRED, not OBSERVED: the client-only `bow-fh-ack:*` localStorage
key that drives the `#fhResult`/`#fhNextNight` results-state gate is not
synced to the server, so a desk that switches browser/device context after
acknowledging a settled night can be shown a stale results screen again on
rejoin. It is self-healing (one more click) and does not touch server-side
game state, so it does not meet this role's bar for a `classroom-reliability`
dissent on its own — but it was reasoned from source, not driven in a
browser, and the bounded plan cut off before the rest of the results-state
stress matrix (which is exactly where the brief expects a desk to actually
get stuck, if one exists) could be exercised. **Do not read this report as
having cleared item 2 of the brief.** Everything under item 2 except one
source-reasoned sub-case is NOT VERIFIED and should be picked up by the next
regression pass before this module is called premium-ready on
classroom-reliability grounds. The M1 pixel baseline is clean (34-36/38
byte-identical depending on which known-race frames land which way on a
given run; all remaining diffs traced to content/timing, not layout, via
pixel-crop inspection) and the misclick guard holds. No dissent filed —
the outstanding item is a scope gap (not-yet-verified), not a confirmed
defect, and CLAUDE.md's release-truth rule ("do not say verified when you
only reasoned") governs how it's reported here rather than escalated as a
blocking finding.
