# BROWSER_TRUTH_W2_RECHECK — re-check after repairs 1–3

Role: browser-qa-w2, assignment `w2-recheck-browser-truth`, Boss run `m2-visual-quality-war`
wave 2. Head under test: `54402b0` (`runtime/dist` prebuilt at this head by the lead, not
rebuilt by this role). Server booted on port 4441, killed at the end of every driving run
(verified no process bound to 4441 at close). AGENT-PLAYTESTED only — nothing here is
HUMAN-TESTED or CLASSROOM-PROVEN. One parameterized Playwright script, `recheck.cjs`, run
twice (once per required viewport); it drives the same 4-desk, 5-night class both times:
Desk 1 (NY, varied price, spend Night 3, bowl open Night 4), Desk 2 (Memphis, holds the $16
season plan all 5 nights, bowl left CLOSED → sells out Nights 2 and 4, the required
Night-4-shock-with-bowl-closed sellout), Desk 3 (NY, $120 on the lowest-draw Night 1 card →
true zero-turnout night, then does not lock Night 5 → auto-committed), Desk 4 (Memphis, late
joiner at Night 3). Every result state was captured at `scrollY=0` before pressing NEXT.

## paths-exercised

Full 5-night class at both required viewports (1366×768, 1024×600): LOBBY → HOOK → PLAY (5
nights, 4 desks, 18 result states per pass) → REVEAL (stages 0–7, teacher-paced via
`#btnRevealNext`) → ADAPT → COUNTERFACTUAL → SYNTHESIS (pages 1–6, via `#btnSynthPage`) →
COMPLETE. `/board` at 1920×1080 and `/teach` at 1366×768 shape-checked once per pass
(wave-3 scope, not graded). `/play` join, price dial, spend dial, bowl toggle, lock, bell,
NEXT — all exercised via the real HTTP/WS session, not mocked.

## artifacts

- This report: `docs/gauntlet/module-2/premium/BROWSER_TRUTH_W2_RECHECK.md`.
- Screens: `docs/gauntlet/module-2/premium/screens-w2-browser-truth-recheck/` — LOBBY, HOOK,
  pre-lock, every result state (both viewports), the Night-4 sellout, REVEAL stage 0 and 7,
  SYNTHESIS page 1 and 6, COMPLETE.
- Driving script (kept in scratch, not committed):
  `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-recheck-browser-truth/recheck.cjs`,
  run as `node recheck.cjs 1366x768` and `node recheck.cjs 1024x600`.
- Raw measurement JSON (per pass, console-logged and file-written):
  `.../w2-recheck-browser-truth/measurements-1366x768.json`,
  `.../w2-recheck-browser-truth/measurements-1024x600.json`. Run logs:
  `run-1366.log`, `run-1024.log` in the same directory.
- Note on method: the first 1366×768 attempt used a fixed 700ms wait between REVEAL/SYNTHESIS
  teacher presses and produced only 5/8 and 4/6 distinct md5s — a client/socket round-trip
  race, not a rendering defect. The script was corrected to poll for the DOM text to actually
  change (up to 6s) before hashing, re-run, and both passes below are from the corrected
  script. This is disclosed because it is exactly the kind of self-inflicted false-negative
  a re-check should not launder into a "STANDING" defect claim.

## Highest severity first — my original findings, re-measured

1. **Original defect 1 (BLOCKING — legacy `theme.css` gold/Bebas leak) — DISCHARGED (measured).**
   Method unchanged from the builder's own proof: walked every element under `#gameBody`,
   flagged any computed `font-family` containing "Bebas" or any computed
   `color`/`border-*-color`/`background-color`/`background-image`/`outline-color`/`box-shadow`
   containing the gold triplet `244, 185, 66`, carving out the drawn arena `<svg>`. Ran this on
   8 states per viewport (pre-lock, 5 non-sellout results across the run, the Night-4 sellout,
   one more result) — **16 states total, ~5,600 elements checked, 0 violations** at both
   1366×768 and 1024×600. `#gameHeader` computed font-family at every check:
   `"Inter M2", "Space Grotesk", "Segoe UI", system-ui, -apple-system, sans-serif` — no Bebas.
   OBSERVED, this session, both viewports.

2. **Original defect 2 (IMPORTANT — sellout "2nd-largest figure" tie) — DISCHARGED (measured).**
   At 1366×768 the sellout headline title is now **60px** (Inter 800; was 40px), turned-away is
   **40px**, turnout is **72px** — three distinct sizes, no tie: `72 > 40[title] ` is gone, order
   is unambiguous (72 turnout, 40 turned-away is now the clear 2nd, title dropped to a smaller
   role at 60 which is still > 40 — full order: turnout 72 > title 60 > turned-away 40 > money
   figures 31). At 1024×600: turnout 64 > turned-away 40 > title 38 — turned-away reads
   unambiguously as the 2nd-largest figure. Screenshot:
   `screens-w2-browser-truth-recheck/11-sellout-desk2-N4-1366x768.png` and the 1024×600 twin.
   Residual note: this still leaves **3 figures ≥34px on the sellout row** (not ≤2) — the
   original report flagged this as a possible C7-vs-C2 wording tension, not a fresh finding.

3. **Original defect 3 (ADVISORY — CASH/RENEWALS share font-size) — STANDING.** Directly
   measured live this time (the original report's DOM selector had a bug and fell back to
   source-only). CASH figure and RENEWALS before/after figures: **31px at 1366×768, 28px at
   1024×600, both**, on the Night-4 sellout result. No repair targeted this row; unchanged.
   Font-family string match not re-diffed this session (both use the same numeric-face token
   per source, `var(--m2-font-num)`) — NOT VERIFIED live, carried from source as before.

4. **Original defect 4 (ADVISORY — reduced-motion at the 120ms ceiling, zero headroom) —
   STANDING.** Re-measured at both viewports, pre-lock, reduced-motion emulated: **max duration
   120ms exactly, 0 offenders**, both passes. Identical to the original finding; no repair
   targeted this and none was expected to.

## New finding this session (not in the original 4, found while completing the assignment's
## required 1024×600 pass of the §H table)

5. **IMPORTANT — at 1024×600, the settled-night result state overflows the viewport (NEXT
   button and, on a sellout, the turned-away figure land below the fold) on two categories of
   night that were not part of the original report's 1024×600 scope.** Measured
   `#fhNextNight.bottom` across all 18 captured 1024×600 result states: **ordinary nights fit
   (539–585px, ≤600)**, but:
   - **Both sellout nights** (Desk 2, Nights 2 and 4): `#fhNextNight.bottom` = **623px**, 23px
     below the 600px fold. The turned-away figure itself (`7,256`, 40px) sits at **top 666 /
     bottom 710** — entirely below the fold (`marginBelow = 600 − 710 = −110px`), not just the
     NEXT button.
   - **Desk 1, Night 4** (bowl opened + Night-3 spend both showing in the chain, non-sellout):
     `#fhNextNight.bottom` = **631px**, 31px below the fold.
   At 1366×768 the same states all fit comfortably (max observed bottom well under 768). This
   is a genuine, previously-untested gap in the wave-2 repair's 1024×600 coverage: the
   composition repair's own B3 table (`REPAIR_W2_COMPOSITION.md`) reports a 1024×600
   `#fhNextNight` max of 574–581px, which holds for ordinary nights but **does not hold for a
   sellout or a spend+bowl-open night** — those two categories were evidently not in that
   table's sample. Recoverable by a small scroll, not a data loss, so IMPORTANT rather than
   BLOCKING — but a Chromebook-width teacher/student on exactly these two night types will not
   see the NEXT button without scrolling. Screenshots:
   `screens-w2-browser-truth-recheck/10-result-desk2-Night4-1024x600.png`,
   `10-result-desk1-Night4-1024x600.png`.

## New checks required by this recheck (OBSERVED, both viewports unless noted)

- **REVEAL stages 0–7, `#gameBody` innerText md5, all distinct**: **PASS, 8/8 distinct** at
  both 1366×768 and 1024×600 (corrected-script run; the first, race-affected 1366×768 attempt
  showed only 5/8 distinct and is disclosed above as a false negative, discarded).
- **SYNTHESIS pages 1–6, `#gameBody` innerText md5, all distinct**: **PASS, 6/6 distinct** at
  both viewports.
- **LOBBY/HOOK/COMPLETE dead region** (space below the last child of `.fh-main`, same method as
  the composition repair's own C4 instrument): 1366×768 — LOBBY 182px, HOOK 22px, REVEAL 22px,
  SYNTHESIS 100px, COMPLETE 100px. 1024×600 — LOBBY 16px, HOOK 16px, REVEAL 16px, SYNTHESIS
  16px, COMPLETE 16px. No dead region anywhere near a concerning size (nothing close to the
  original report's illustrative 200px bar) at either viewport.
- **Forbidden vocabulary, 0 genuine hits on every state**: **PASS.** Two raw regex hits per
  pass, both the same registered negation carve-out as the original report's "No preview…"
  finding: HOOK's "No forecast — just tonight's card…" (`fullHouse.ts:1734`) and pre-lock's "No
  preview. …" Every other captured state (results ×18, REVEAL stage 7, SYNTHESIS pages
  1 and 6, COMPLETE) — **0 hits**, both viewports.
- **Sellout TURNED AWAY figure bottom ≤768 with its margin**: at 1366×768, bottom **755px**,
  margin **13px** below 768 — PASS. At 1024×600 the same figure's bottom is 710px against a
  600px viewport — see new finding 5 above; the ≤768 wording in the brief is the 1366×768
  threshold, and that one holds.
- **Arena direct labels present, no swatch legend**: **PASS**, both viewports. Live DOM text
  under `.fh-arena-labels`: `"17,794 / came — the lit seats / 0 / empty — the dark seats above
  the line / More seats closed / 100% of the seats you opened tonight"`. No element matching
  `.fh-legend`/`.fh-arena-legend`/`[class*='legend']` found in either sellout capture.
- **`/board` and `/teach` shape, one line each**: `/board` at 1920×1080, COMPLETE phase:
  `#stage.scrollHeight` (1080) `<= clientHeight` (1080) — fits, unchanged from the original
  single-state spot check. `/teach` at 1366×768: `document.documentElement.scrollHeight` 1764
  vs `clientHeight` 768 — still roughly 2.3× the viewport (original report measured 2008/768,
  ≈2.6×); same known, already-logged below-the-fold shape, not re-graded this wave.

## Non-defect findings (browser truth, not contract failures)

- **Console errors: 0 on both passes** (teach/board/all 4 desks). The original report's "two
  401 Unauthorized console errors on Desk 1" did not reproduce this session — not diagnosed
  either time; NOT VERIFIED as fixed vs. simply not triggered by this run's exact sequence.
- Desk 3's un-locked Night 5 auto-committed at the season-plan price both passes, matching the
  original finding.
- Plan-tick vs. price-dial knob: **no overlap**, both viewports, both passes — the previously
  reported (and previously-not-reproduced) P1 defect stays not reproduced.
- Pre-lock composition is structurally different from the original report's PIN-collapse
  timing test: the PIN is now a static `.fh-pin-chip` in the rail (10.5px, always visible, not
  time-gated), not the old `#pinCard`/`#pinDisplay` auto-collapse widget — `#pinCard`/
  `#btnShowPin` exist in the DOM but are confirmed hidden under `data-module="m2"]`, per the
  brief's warning; not clicked. `#fhPriceReadout` remains the largest pre-lock figure at both
  viewports (68px/64px) and always larger than the PIN chip.

## not-verified

- **CASH vs RENEWALS font-family string** — size match (31px/28px) was measured live; the exact
  `font-family` string was not re-diffed this session (carried from source, unchanged claim).
- **Root cause of the original report's 401 console errors** — not investigated either time;
  this session simply did not reproduce them.
- **`/board`/`/teach` per-phase fit across LOBBY/HOOK/PLAY/REVEAL/ADAPT/COUNTERFACTUAL/
  SYNTHESIS** — only the COMPLETE-phase spot check was repeated (wave-3 scope, not graded).
- **Refresh-mid-result and PIN-rejoin-from-fresh-page** — not re-driven this session (time
  budget prioritized the required §H/defect re-take and the new checks); no regression
  reasoning either way, purely not re-verified.
- **Contrast ratios** beyond what was already computed originally — not recomputed this
  session.
- **12-desk / class-scale capture** — out of scope for this recheck, as for the original.

## Dissent

None outstanding on the original four findings — all four are resolved (2 DISCHARGED, 2
STANDING-but-unchanged-and-unowned-by-any-repair, not regressions). New finding 5 (1024×600
overflow on sellout/spend+bowl nights) is a fresh dissent: the composition repair's own
acceptance table did not cover these two night categories at 1024×600, and they do not meet
the "in-viewport at 1024×600" bar the rest of the settled-night states now meet.
