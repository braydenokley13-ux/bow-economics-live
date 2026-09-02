# BROWSER_TRUTH_W2 — Full House `/play` rebuild, independent browser capture

Role: browser-qa-w2. Boss run `m2-visual-quality-war` wave 2. Head under test: git `6c4c7cc`
(`runtime/dist` prebuilt, not rebuilt by this role). Server booted on port 4441, killed at the
end of every driving script (verified no process bound to 4441 at close). All findings are
AGENT-PLAYTESTED (a simulated critic drove the real build with Playwright/Chromium) — nothing
here is HUMAN-TESTED or CLASSROOM-PROVEN.

Five driving scripts were used (kept in scratch, not committed):
`drive.cjs` (full 4-desk, 5-night class with a late joiner and a stalled desk),
`drive2.cjs` (2-desk precise-selector re-pass for §H card rects/typography),
`drive3.cjs` (locked-waiting/H1 state + reduced-motion at the lock press),
`drive4.cjs` (`#fhLock` viewport-fit at 1366×768 and 1024×600), `drive5.cjs` (refresh-mid-result
and refresh-after-NEXT). Full console logs with every measurement are preserved in
`/tmp/.../scratchpad/boss/w2-browser-truth/measurements{,2,3}.json` (paths below).

## paths-exercised

Full 5-night Full House class, 4 desks, `/teach` + `/board` + `/play`, per the assignment's
required odd/even market split and price lines:
- **Desk 1 (New York Knicks, plan $24)** — varied nightly price ($40/$48/$40/$90/$34), spent
  $40,000 on Night 3 (pays off Night 4), opened the upper bowl on Night 4.
- **Desk 2 (Memphis Grizzlies, plan $16)** — held the plan price $16 all five nights, bowl never
  opened → sold out **twice** (Night 2: 238 turned away; Night 4 shock, bowl closed: 7,256 turned
  away) — the required Night-4-shock-with-bowl-closed sellout was captured, plus an earlier one.
- **Desk 3 (New York Knicks)** — Night 1 priced at **$120** on the lowest-draw card (draw 22/100)
  to find the floor: **turnout = 0, a true zero-turnout night was reached** (0 of 19,800, 0%,
  cash −$520,000). Then $70 flat Nights 2–4. Did **not** lock Night 5 — the bell auto-committed it
  at the season-plan price ($24) and the desk's own screen and history both label it "auto".
- **Desk 4 (Memphis Grizzlies)** — joined late at Night 3, arrived with covered/labelled books,
  played $30/$84/$24.
- Teacher advanced every phase, rang the bell each night, released Two Peaks after Night 3.
- Second pass: 2 desks (NY/Memphis) replayed all 5 nights for precise per-card DOM measurement
  (`.fh-hero`, `.fh-chain`, `.fh-renewals`, headline) at 1366×768, plus the sellout at 1024×600.
- Third/fourth/fifth passes: locked-waiting (H1) state; `#fhLock`/caption fit at both required
  viewports; refresh mid-result-state and after NEXT; fresh-page PIN rejoin.
- `/board` viewed at 1920×1080 and 1366×768; `/teach` viewed at 1366×768 — shape-only, not
  graded (wave 3 scope per assignment).

## artifacts

- `docs/gauntlet/module-2/premium/BROWSER_TRUTH_W2.md` — this report.
- Manifest (`browser-trace`): 27 screenshots under
  `docs/gauntlet/module-2/premium/screens-w2-browser-truth/` — `10-`…`20-` prefix, covering
  1024×600 pre-lock (PIN uncollapsed), 1366×768 pre-lock (dials at rest and set), all 16 captured
  result states (`13-result-desk{1,2,3,4}-Night{1..5}.png`), fresh-page PIN rejoin, `/board` at
  both projector shapes, `/teach` at 1366×768, sellout at 1024×600, locked-waiting (H1), and the
  full pre-lock card stack at 1366×768.
- Key screenshots (viewed directly):
  - `13-result-desk2-Night4.png` — the Night-4 shock sellout, Memphis held $16, bowl closed:
    FULL HOUSE headline, WHO CAME 17,794, CASH chain, ARENA OUTCOME (lit bowl), 7,256 TURNED
    AWAY, RENEWALS 68%→74%, all inside the 768px viewport. **Also the evidence for the gold-leak
    defect below** — the headline sits in a visibly amber/gold-bordered box.
  - `20-prelock-1366x768-fulldial.png` — full pre-lock card stack; LOCK IT IN and its caption are
    both inside the first viewport, well above the dots/slate/history cards that continue below
    the fold.
  - `10-1024x600-prelock-pin-uncollapsed.png` — first-contact viewport, PIN card still open.
  - `19-locked-waiting-h1.png` — the H1 dark-building "doors in a minute" state.
- Raw measurement JSON: `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-browser-truth/measurements.json`,
  `measurements2.json`, `measurements3.json` (console-logged and file-written by each driver).
- Driving scripts: `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-browser-truth/drive{,2,3,4,5}.cjs`.

## §H measurement table (actual numbers)

All results at 1366×768, `scrollY=0`, unless marked otherwise. "OBSERVED" = read from the live
DOM this session; "INFERRED" = read from `runtime/src/client/**` / `runtime/src/modules/**`
source, not independently re-verified by re-running; "NOT VERIFIED" = not checked this session.

| Measurement | Result | Status |
|---|---|---|
| Settled-night in-viewport (headline/WHO CAME/chain/renewals bottoms ≤768; `#fhLock` absent) | **PASS**, all 5 nights, both desks. Headline bottom 219; WHO CAME (`.fh-hero`) bottom 326; `.fh-chain` bottom 658 (691 on Desk-1 N4 with spend+bowl rows); `.fh-renewals` bottom 572; `#fhNextNight` bottom 716 (749 on N4). `#fhLock` is not in the DOM during the result state (`null`) at all — its absence is stronger than "not in viewport." | OBSERVED |
| Sellout: `FULL HOUSE` headline top <200; turned-away bottom ≤768; 2nd-largest figure | **PASS** on top/bottom: headline top 189, turned-away (7,256) bottom 517. **Partial** on "2nd-largest": turned-away is 40px, **tied** with the "FULL HOUSE" title span (also 40px) — turnout (72px) is unambiguously largest, but turned-away is not *uniquely* 2nd, it ties the headline label. | OBSERVED |
| `#fhPriceReadout` ≥64px and largest pre-lock figure; `#pinDisplay` smaller at all times | **PASS**. Price readout 68px at 1366×768 / 64px at 1024×600; next-largest pre-lock figure on the frame is 28px ("Full House" eyebrow). `#pinDisplay` is a static 16px in CSS (`m2.css:2038`), not time-dependent, so it is smaller than the price readout at join+0s and necessarily stays smaller through +5s/+20s (value doesn't change with time; only the card's *visibility* changes at the 20s auto-collapse). | OBSERVED (t0) / INFERRED (t+5s, t+20s — static CSS value, not re-captured at those exact timestamps) |
| 1024×600, PIN un-collapsed: `#fhLock` and caption bottom ≤600 | **PASS**. `#fhLock` bottom 367; caption (`.fh-blind-note`) bottom 472 (fresh-run) / 496 at 1366×768. | OBSERVED |
| Settled night ≤2 figures ≥34px; largest is turnout not money | **PASS** on ordinary nights (exactly 1 figure ≥34px: WHO CAME). **3 figures ≥34px on sellout nights** (FULL HOUSE title 40px, turnout 72px, turned-away 40px) — turnout is still unambiguously largest. The ≤2 cap in the contract's C2 dashboard-test wording is written for the ordinary settled state; C7 gives the sellout its own criteria (which pass), but if the ≤2 cap is meant to bind sellout too, this is a 1-figure overage. | OBSERVED |
| `.fh-blind-note` ≥14px, passes contrast | **PASS**. 14.5px, `rgb(201,201,214)` on `rgb(8,8,15)` — computed contrast ratio ≈ **12.2:1** (WCAG floor for this size is 3:1). | OBSERVED |
| Plan-tick label vs knob intersection, 1366×768 and 1024×600 | **PASS**, both viewports. 1366×768: tick box top 422–445, knob box top 385–419 (no overlap). 1024×600: tick top 389–412, knob top 352–386 (no overlap). The previously-reported P1 defect (knob striking the "PLAN $24" label) was not reproduced. | OBSERVED |
| Fill labelling "of the seats you opened tonight"; "of Capacity" count | **PASS**. Every captured result state's body text contains "of the seats you opened tonight" against every fill figure; "of capacity" (case-insensitive) appears **0** times in any captured state, including the Night-4 bowl-open night. | OBSERVED |
| Reduced-motion: max animation/transition duration ≤120ms | **PASS at the ceiling**. Pre-lock idle: max 120ms, 0 offenders. At the lock press (commitment-settle): max 120ms, 0 offenders. Both measured exactly at the 120ms ceiling, not under it — no headroom if any browser rounds up. Did not check easing/timing-function (spring vs linear) — see not-verified. | OBSERVED (duration) / NOT VERIFIED (easing curve) |
| Dead region >200px below last content block, 1366×768 | **No dead region found** in the states checked. Pre-lock: last content bottom 1084px in a 768px viewport, but that is *populated* content (dots chart / next-card / slate / history cards continuing below the fold), not empty space. Result state: last content bottom 877px (the WHAT HAPPENED card, which sits *after* `#fhNextNight`), again populated, not empty. | OBSERVED |
| CASH vs RENEWALS: no shared font-family+size+colour in one row | **Borderline pass, worth flagging.** Confirmed from source (`play/main.ts` `fhChainHtml`/`fhRenewalsHtml`): the CASH total figure and the RENEWALS before/after figures are **both** 31px, **both** `var(--m2-font-num)` (tabular numeric face) — they differ only in colour (CASH: green `#22c55e` or red `#ef4444`; RENEWALS: white `#f4f4f8` / grey `#8a8a9c`). The literal contract test (font-family **+** size **+** colour, all three) is not tripped since colour differs, but two of three visual dimensions are identical between the two books' headline figures. | INFERRED (from source; selector-based DOM re-check was inconclusive due to a CSS-selector bug on my end, not re-run) |
| Forbidden-vocabulary regex on every `/play` state | **0 genuine hits** across all 21 captured states (1 pre-lock + 16 nightly results + 4 extra). One scan flagged "preview" ×2 on the pre-lock body text, but both are the registered, permitted "No preview…" / "There is no preview…" sentences the rules deliberately state (the same exception the module's own `e2e-m2l1.cjs` R-1 limb carves out) — not a leak. | OBSERVED |
| History chart: no `<path>`/`<line>` joining dots; no pending-night mark | **PASS (source-confirmed).** `shared/m2ui.ts` `dotChart()` emits only `<circle class="pt">` marks, `<text>` labels, and one `<path class="axis">` for the two hairline axes — no line connects the data points. The caller (`fhDotsHtml`) is passed only `history` (settled nights), never the open night. | INFERRED (from source; not re-screenshotted this session) |
| Lit building pre-lock | **No arena picture at all pre-lock** (stronger than "not lit"). `fhArena({view:"hero", turnout:0, ...})` is only called from `fhLockedWaiting` (the H1 locked-waiting state, `lit:"idle"`, aria-label "Drawn arena bowl, dark and closed"); the active dial-editing pre-lock state renders no arena SVG at all. | OBSERVED (no arena element found in DOM) / INFERRED (call-site confirmation from source) |

## defects

Highest severity first. All OBSERVED (screenshot + computed-style, this session) unless noted.

1. **BLOCKING — legacy, unscoped `theme.css` rules leak the forbidden gold accent and Bebas Neue
   display face onto the rebuilt `/play` result states, because the wave-2 renderer reuses the
   old `.fh-*` class names without scoping or removing the old rules.** This directly contradicts
   the two most explicit, named acceptance criteria in the contract: A2 ("no `--accent-gold`
   usage in any M2 rendered element except the arena SVG") and A4 ("Bebas Neue removed from M2
   student/teacher chrome").
   - **Sellout headline box renders gold, not violet** (`13-result-desk2-Night4.png`,
     `18-sellout-1024x600.png`): `theme.css:2211` defines `.fh-sellout { border: 1px solid
     var(--accent-gold); background: linear-gradient(180deg, rgba(244,185,66,0.16),
     rgba(244,185,66,0.04)); }` and `theme.css:2219` sets `.fh-sellout-title { color:
     var(--accent-gold); }`. The new renderer's sellout headline (`play/main.ts:2459`) sets
     `class="fh-sellout m2-display"` and gives its own inline style to the child spans but never
     sets border/background on the `.fh-sellout` element itself — so the old gold border and
     amber gradient render uncontested (visible in the screenshot as a warm-tinted box around
     "FULL HOUSE … TURNED AWAY"). `theme.css:2549` additionally sets `.fh-result.soldout {
     border-color: rgba(244,185,66,0.4); }`, tinting the *entire* result card's outer border gold
     on every sellout night, not just the headline. `m2.css` (loaded after `theme.css`) defines
     neither `.fh-sellout` nor `.fh-result.soldout`, so nothing overrides it.
   - **Every non-sellout night's result headline renders in Bebas Neue, not Inter**
     (`13-result-desk1-Night1.png` and 14 other result screenshots): `theme.css:1762`
     `.fh-result-head { font-family: var(--font-display); }` where `--font-display: "Bebas Neue",
     …` (theme.css:71, global, unscoped). The new renderer's non-sellout headline
     (`play/main.ts:2453/2464`, `class="m2-h1 fh-result-head"`) sets font-size/weight/colour
     inline but never font-family, so the old rule wins. **Measured directly**: computed
     `font-family` on every captured non-sellout headline (Desk 1 & 2, Nights 1–5) =
     `"Bebas Neue", "Arial Narrow", Impact, Haettenschweiler, sans-serif`.
   - The desk identity line (`.fh-desk-name`, `theme.css:1463`) has the same
     `font-family: var(--font-display)` (Bebas Neue) rule with no inline override in the new
     renderer's `fhDeskHeader` — I did not re-measure this one's computed style directly this
     session (it reads as a small caps line in the screenshots, consistent with Bebas Neue, but
     I'm not certifying it without a computed-style check), and `.fh-card` (`theme.css:1515`) has
     `border: 1px solid rgba(244, 185, 66, 0.28)` — a low-opacity gold border — which the new
     `fhCardHtml`/night-card panel likely also inherits uncontested; **not independently
     confirmed by computed style this session, flagged for the visual critic and a full-repo
     class-collision audit.**
   - This is not a one-off miss: it is a systemic pattern (the wave-2 build kept ~10+ legacy
     `.fh-*` class names — `.fh-price-readout`, `.fh-blind-note`, `.fh-books`, `.fh-book`,
     `.fh-desk-building`, `.fh-next`, `.fh-card`, `.fh-result`, `.fh-result-head`,
     `.fh-sellout*` — active and unscoped in `theme.css` while writing a new, separately-scoped
     `m2.css`). The two cases above happen to break the two rows the contract names explicitly by
     acceptance test; there is no reason to assume they are the only two properties leaking.

2. **IMPORTANT — sellout "2nd-largest figure" is a tie, not a clear ranking.** On both captured
   sellouts (Desk 2, Nights 2 and 4), the turned-away count (40px) is exactly the same computed
   font-size as the "FULL HOUSE" headline title span (40px) — both come from
   `.fh-sellout-title`/`.m2-turnedaway` at 40px in the current CSS. Turnout (72px) is clearly the
   largest; turned-away does not clearly read as *the* second-largest figure the way C7 specifies,
   because it's tied with the headline word itself. Screenshot: `13-result-desk2-Night4.png`.

3. **ADVISORY — CASH and RENEWALS headline figures share font-family and font-size (31px,
   `var(--m2-font-num)`), differing only by colour.** Not a contract violation on the literal
   three-property test, but two of three type properties match between the two books that the
   product law says "never add up to one number" — worth a design pass so the two books read as
   visually distinct at a glance, not just by colour (a colour-only differentiator is exactly the
   kind of thing R-3/FL-V11 elsewhere in the contract works to avoid). Source-confirmed
   (`fhChainHtml`/`fhRenewalsHtml`), not independently re-measured live due to a selector bug in
   my own script (see not-verified).

4. **ADVISORY — reduced-motion durations measured exactly at the 120ms ceiling, not under it**,
   both at pre-lock idle and at the lock-press commitment-settle. Technically inside the ≤120ms
   requirement, but with zero margin; worth confirming the CSS literally reads `120ms` and not a
   slightly-larger value that happens to round down in this browser/OS combination.

## Non-defect findings worth recording (browser truth, not contract failures)

- **A true zero-turnout night is reachable**: Desk 3, Night 1, priced at $120 on a draw-22 card
  → 0 of 19,800 came (0%), cash −$520,000. Screenshot: `13-result-desk3-Night1.png`.
- **Refresh mid-result-state returns to the same result state**, byte-identical body text
  (`drive5.cjs`, OBSERVED): refreshing while `#fhResult` is showing re-renders `#fhResult` with
  the same night's figures. Refreshing *after* pressing NEXT correctly returns to the next
  night's dial-editing state, not back to the settled result. No stuck or lost state was
  observed in either case — **this is a classroom-reliability positive, not a dissent.**
  Note this covers only the mid-game case (Night 1→2 transition); the "refresh after all 5
  nights, on the allNightsDone summary" case was also checked and also returned correctly.
- **Rejoin with PIN from a fresh page lands correctly** on the pair's current state (the
  allNightsDone/books-closed summary, matching their actual progress) — `14-rejoin-fresh-page.png`.
- **Desk 3's un-locked Night 5 was auto-committed** at the season-plan price and the desk's own
  screen/history both say so ("auto" flag, "Nobody locked this night — the bell settled it at the
  season-plan price."). No stuck desk was observed; the bell correctly forced the close.
- `/board` at 1920×1080 and 1366×768: `#stage.scrollHeight <= clientHeight` held at the one phase
  I checked (COMPLETE, end of run) — **this is a single-state spot check, not a per-phase
  guarantee**, and `/board` is wave-3 scope; not graded.
- `/teach` at 1366×768: `document.documentElement.scrollHeight` = 2008 vs `clientHeight` = 768 —
  the teacher document is roughly 2.6× the viewport height. Consistent with the known,
  already-logged F5 below-the-fold defect. Wave-3 scope; not graded, recorded as observed state
  only.
- Two `401 Unauthorized` console errors were logged on Desk 1 over the full run; root cause not
  investigated (see not-verified).

## not-verified

- **Easing/timing-function on reduced-motion transitions** ("no spring easing on money") —
  I measured duration only, not `transition-timing-function`/`animation-timing-function` values.
- **`.fh-desk-name` and `.fh-card` computed styles** — I identified the unscoped legacy CSS rules
  that plausibly leak Bebas Neue and a low-opacity gold border onto these elements, but did not
  re-run a computed-style check against the live DOM to confirm (the two confirmed leaks above
  were independently measured live; these two are source-only).
- **CASH vs RENEWALS row typography** — my own selector for the live DOM re-check
  (`.fh-chain .m2-chain-row:last-child span:last-child`) picked the wrong span (a `FH_LABEL`
  caption, not the money figure) due to a CSS `:last-child` scoping mistake in my script; I did
  not re-run a corrected selector before time ran out. The finding above is source-derived only.
- **Full audit of every `.fh-*` class name for further legacy-CSS collisions** beyond the two I
  found and the two I flagged as plausible-but-unconfirmed — I stopped after finding the pattern
  repeated twice; a systematic diff of every class the new renderer emits against every selector
  still live in `theme.css` was not performed.
- **`#pinDisplay` vs `#fhPriceReadout` at exactly +5s and +20s post-join** — not captured as
  separate timestamped screenshots; inferred from the fact that `#pinDisplay`'s font-size is a
  static CSS value (16px) with no time-based style change, only a visibility change at +20s.
- **Dead-region check on the locked-waiting (H1), allNightsDone-summary, REVEAL/ADAPT/
  COUNTERFACTUAL/SYNTHESIS/COMPLETE `/play` states** — only pre-lock and result states were
  measured for dead region; the mirror states (D1–D4 in the contract) were not visited at all
  this session.
- **`/board` per-phase fit** — checked only at the COMPLETE phase, not at LOBBY/HOOK/PLAY/REVEAL/
  ADAPT/COUNTERFACTUAL/SYNTHESIS as the assignment's "unchanged-shape" note implies; not a wave-2
  grading item but flagged as incomplete coverage.
- **12-desk / class-scale `/play` capture** — this session drove a realistic 4-desk class only, as
  the assignment specified; class-scale (12 desks) `/play` states were not captured (that is the
  existing `e2e-m2l1.cjs` class-scale harness's job, not repeated here).
- **Root cause of the two `401 Unauthorized` console errors on Desk 1** — logged, not diagnosed.
- **Contrast ratio on the RENEWALS "before" figure** (dimmed grey `#8a8a9c` on void) and on the
  CASH red (debt) state — only the CASH-positive green and `.fh-blind-note` contrast were
  computed; other colour pairs were not checked.
