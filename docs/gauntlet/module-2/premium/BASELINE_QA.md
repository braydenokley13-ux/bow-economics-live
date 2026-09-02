# Baseline Browser QA — M2 L1 "Full House" (`m2l1-full-house`)

Run: `m2-visual-quality-war` · assignment `baseline-browser-qa` · actor `browser-qa-w1`.
Agent-playtested (real Chromium via Playwright driving the real build). Nothing here is
HUMAN-TESTED or CLASSROOM-PROVEN.

## paths-exercised

Full arc, both runs, real build at head, zero console errors/warnings in either run:
LOBBY → HOOK → PLAY (5 nights, each night's dial UI open state + settled state) → Two Peaks
release (teacher-gated, after the Night 3 bell) → books-closed → REVEAL (all 7 stages) →
ADAPT → COUNTERFACTUAL (all paged groups) → SYNTHESIS (all 6 cards) → COMPLETE, across
`/play`, `/teach`, `/board`.

- **Baseline run** (port 4402, prefix `baseline`): 4 desks — Desk 1 "Rae & Ben" (reads the
  card every night, opens the upper bowl on the shock night), Desk 2 "Nour & Ivy" (holds the
  season-plan price all 5 nights), Desk 3 "Ari & Tal" (flat $70, **never locks Night 5** —
  proves the teacher's bell auto-commit), Desk 4 "Sam & Jo" (**joins late at Night 3** with
  real, labelled books). 33 states captured, 167 screenshots.
- **Class-scale run** (port 4412, prefix `baseline12`): 12 desks, `/teach` + `/board` only, at
  5 states: PLAY Night 3 open, books-closed, REVEAL stage 7, COUNTERFACTUAL page 1 (of 4),
  SYNTHESIS card 1 (of 6). 20 screenshots.

## artifacts

- Reusable driver (repo-source-free, product law: this file lives in scratch, never in the
  repo): `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/tools/drive-m2l1.cjs`
  Usage: `node drive-m2l1.cjs --port 4402 --out <dir> --desks 4 --late 1 --stall 1 --prefix baseline`
  (flags: `--surfaces play,teach,board` and `--states <comma-list>` trim what gets *saved* to
  disk without changing what the arc *drives*, so later waves can hit any single checkpoint —
  e.g. class-scale used `--surfaces teach,board --states night-3-open,books-closed,reveal-7,cf-1,synth-1`).
- Baseline screenshots + manifest + console log (committed-location output, as instructed):
  `/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-baseline/` — 167
  PNGs, `manifest.json`, `console.json` (`[]`, i.e. zero console errors/warnings across the
  entire 4-desk arc).
- Class-scale screenshots + manifest + console log (scratch, per instruction):
  `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/baseline-browser-qa/screens-class12/`
  — 20 PNGs, `manifest.json`, `console.json` (`[]`).
- Verification scripts used to confirm defects with DOM measurement (not just pixel-reading):
  `.../scratchpad/boss/baseline-browser-qa/check-lock-1024.cjs` (lock-control geometry at
  1024x600), `.../check-teach-scroll.cjs` (teach auto-scroll position), `.../check-tile-text.cjs`
  (ruled out a false-positive text-collision read on the teacher desk-tile grid).
- This report: `/home/user/bow-economics-live/docs/gauntlet/module-2/premium/BASELINE_QA.md`.

## defects

Ordered highest severity first. All OBSERVED (screenshot- or DOM-measurement-cited), agent-playtested
against the real build at head. None of these are aesthetic judgments — see the register note.

1. **`/teach` at 1366x768 (the design-target teacher viewport): the session-pacing controls
   are not reliably in view, with no fixed/sticky anchor and no scroll-to-top on phase
   change.** DOM measurement (`check-teach-scroll.cjs`): immediately after a phase advance,
   with no scrolling performed by the driver, `window.scrollY = 269` (`bodyScrollHeight`
   1526 vs `innerHeight` 768) — i.e. the browser is already mid-page. Screenshot
   `docs/gauntlet/module-2/premium/screens-baseline/baseline-03-teach-night-1-open@1366x768.png`
   shows only the "director notes" panel (TRIGGER/ASK/DON'T EXPLAIN YET/THE BELL); the PHASE
   chip row and the **Advance / Open the doors — Night N (x/y locked) / Release the Two Peaks
   / End session** buttons — the controls that actually pace the class — are entirely below
   the fold. The same is true at `baseline-13-teach-night-5-open@1366x768.png`. At other
   states (e.g. `baseline-17-teach-reveal-1@1366x768.png`, `baseline-25-teach-cf-1@1366x768.png`)
   the controls happen to be visible, because the director-notes text above them is shorter
   that beat — so visibility of the pacing controls is inconsistent and content-length-dependent,
   not a fixed contract. At 1920x1080 the same scroll offset still crops the top header/room-code
   panel but the controls fit (`baseline-03-teach-night-1-open@1920x1080.png`). No `position:
   sticky`/`fixed` rule exists for this panel anywhere in `theme.css` (grepped; the only fixed-
   position rules found belong to `/play`'s `.pin-reopen` and a different lesson's
   `.hl-lockbar`), and `teach/main.ts` contains no `scrollIntoView`/`scrollTo` call — confirmed
   by direct grep, not inferred. This is not a hard trap (scrolling does reach the controls;
   `overflow` is not `hidden`) but it is a real live-pacing friction risk: a teacher who has to
   hunt for "Advance"/"Open the doors"/"Release the Two Peaks" after every beat, at the
   Chromebook-shape viewport CLAUDE.md names as the design target, is a classroom-reliability
   concern (teacher paces phases — CLAUDE.md §11).

2. **Class scatter chart (ADAPT and COUNTERFACTUAL): same-color marks with different shapes
   can render fully stacked, collapsing two distinct desk-nights into one unreadable
   compound glyph.** Cropped/zoomed from
   `docs/gauntlet/module-2/premium/screens-baseline/baseline-24-board-adapt@1366x768.png`
   (region ~370,250–620,380): an orange square (N2 Sat) and an orange diamond (N4 Sat) sit
   exactly on top of each other — only a thin triangular sliver of the diamond pokes out from
   behind the square, unreadable as "two nights, two shapes." A blue filled circle (N1) and a
   blue ring (N5) partially overlap in the same cluster. This is worse at class scale: cropped
   from `.../screens-class12/baseline12-04-board-cf-1@1366x768.png` (region ~770,140–1000,260),
   a cluster of orange diamonds/squares/triangles and blue diamonds/triangles overlaps into an
   indistinct blob — several marks cannot be individually resolved. The board's own legend text
   depends on students distinguishing "the SAME colour and the SAME shape"; when marks coincide
   in pixel space this legibility contract breaks for that cluster, at both 4 and 12 desks.

3. **`/play` at 1024x600 (the first-contact / small-Chromebook shape): the lock control is
   below the fold on Night 1, reachable only by scrolling — not clipped/trapped, but not
   visible on arrival.** DOM measurement (`check-lock-1024.cjs`) on a fresh Night 1 PLAY
   screen: `#fhLock` bounding box `top: 664.2, bottom: 708.2` in a `600`px-tall viewport (64px
   past the fold). `document.scrollingElement`: `scrollHeight 926` vs `clientHeight 600`,
   `overflow-y: visible` on both `body` and `html` — the page **is** normally scrollable (not
   the old `overflow:hidden` trap class of bug), and after `scrollTo(0, bottom)` the lock
   button's box moves to `top: 338.2`, fully in view. Screenshots:
   `baseline-01-play-lobby@1024x600.png` (join screen fits cleanly, no issue) and
   `baseline-03-play-night-1-open@1024x600.png` (dial UI cuts off mid-way through the "Making
   it an event" card, with the price dial, the spend stepper and the LOCK IT IN button all
   below the visible frame). Reachable, but not "on arrival" at this viewport shape.

4. **(Minor, informational)** On `/play` at 1366x768, once a night settles the screen
   immediately shows the *next* night's open dial UI with the just-settled night's box score
   appended below — by design (immediate progression), but that box score is itself partially
   below the fold at 1366x768 on the transition frame. See
   `baseline-12-play-night-4-settled@1366x768.png`: the visible top is "NIGHT 5 OF 5" with the
   LOCK IT IN button in view (not a defect on its own), but the "Night 4 — how it went" box
   score beneath it is cut mid-row. Noting this only so a later wave doesn't mis-read a
   "-settled" filename as "shows that night's result front-and-center" — it shows the next
   night's action screen, per the module's own no-idle-screen design.

**Ruled out (verified, not a defect):** a teacher desk-tile reading "Pairfinished · 5" in a
downscaled screenshot crop looked like a text collision. `check-tile-text.cjs` read the live
DOM instead of the pixels: the tile is `<span>Pair 5</span><span>still dialling $24</span>`,
two separate flex children — `textContent` concatenates them with no whitespace (a known
false-positive when reading `textContent` instead of rendered layout), but nothing in the CSS
suggests they render glued together. Recorded so this specific read isn't repeated by a later
wave from the same screenshot.

**Zero console errors or warnings** were recorded in either run
(`screens-baseline/console.json` = `[]`, `screens-class12/console.json` = `[]`) — 6 pages in
the 4-desk run (teach, board, 4 desks) and 14 pages in the 12-desk run (teach, board, 12 desks),
across the entire arc including late-join and stalled-desk auto-commit.

## not-verified

- Whether a real teacher's mouse/scroll behavior would land at the same ~269px offset finding
  #1 measured — that number is this session's own reproduction (no manual scroll performed by
  the driver before the measurement), not a claim about every possible interaction path. The
  underlying facts that ARE verified: no sticky/fixed CSS for the panel, no scroll-management
  JS, and the panel is provably below the fold at 1366x768 on at least two captured states.
- `/play` desks other than Desk 1 were not captured screen-by-screen (per the assignment's
  canonical-capture contract, only desk 1 is captured at every state); Desk 3's own
  "auto-committed"-labelled Night 5 screen and Desk 4's own late-join "covered" copy were
  exercised by the driver (the arc requires them to render correctly for the arc to proceed)
  but not saved as named screenshots in this run.
- Whether the marker-overlap defect (#2) is common across other seeded night combinations, or
  specific to the deterministic price lines this driver uses — not swept across alternate
  price seeds this run.
- Visual/aesthetic quality (premium-vs-serviceable judgment) — out of scope for this role by
  design; recorded only what rendered.
- Anything about `runtime/src/client/teach/index.html`'s literal markup structure, or Full
  House's reduced-motion CSS coverage — inherited as NOT VERIFIED from the surface inventory
  and not independently re-checked this run.
