# REVIEW_VISUAL_W2 — Module 2 `/play` rebuilt surface, fresh Visual Experience Director

Run `m2-visual-quality-war`, wave 2, assignment `w2-visual-review`, actor `visual-critic-3`.
Head under test: git `6c4c7cc` (`runtime/dist` as built; no source touched). Port 4442.
AGENT-PLAYTESTED — a simulated critic drove the real build end to end (4 desks, one late joiner,
one desk that sells out on Night 4, one desk held at $120 that draws zero, five nights, all
mirrors). Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.

Screenshots: `docs/gauntlet/module-2/premium/screens-w2-visual-review/` (`MANIFEST.md`).
Measurements: `getBoundingClientRect` / `getComputedStyle` / `document.fonts` harvested live.
I did not inherit wave 1's verdict and did not read `GATE_L1_VISUAL.md`.

---

## visual-verdict

**Overall: top-of-SERVICEABLE. Not PREMIUM.**

The two states a pair lives in — pre-lock and the settled night — are a genuine composition for
the first time: one hero figure at the right size, a real card grid, a drawn building, a CASH
chain that reads as a chain. Every measurement in contract §H that the wave was built to hit,
hits. What keeps it off PREMIUM is not the composition of those two states; it is that the design
system breaks its own two loudest laws inside the module's designed peak, that the flagship
consequence asset does not carry the read it exists to carry, and that five of the twelve states
have no composition at all.

### What stands between here and PREMIUM

| # | Gap | Class |
|---|---|---|
| 1 | The arena does not encode fill legibly: 71.4% and 100% are near-indistinguishable, and 0% still shows a warmly lit court, so the night nobody came reads as a normal lit building. Needs a hard fill boundary / countable lit sections and a genuinely dark empty state — a different drawing, not a tint pass. | **STRUCTURAL** |
| 2 | HOOK, SYNTHESIS (all pages), COMPLETE and the reveal mirror have no composition — a header plus one card in an unused grid, or a 348-word wall. SYNTHESIS leaves ~471px of empty main column for the lesson's entire ceremonial close. | **STRUCTURAL** |
| 3 | `YOUR NIGHTS SO FAR` dot chart: y is not fitted to the data (5 marks in 13% of the plot), two marks superimpose, two labels detach from their marks. Needs a different scaling + label strategy. | **STRUCTURAL** |
| 4 | Bebas Neue is the face of the sellout headline, the result headline, the rail identity and the rail night label — the M2 layer's own stated rule says it does not appear under M2. | NON-STRUCTURAL |
| 5 | Gold `#f4b942` is the UI treatment of the sellout frame, and blue `#4da2e8` is the UI treatment of the rule box on every pre-lock frame. Four UI hues, not one. | NON-STRUCTURAL |
| 6 | The `ARENA OUTCOME` legend is wrong on every settled night: the "Came" swatch is amber while the seats it labels are violet; on a bowl-open night "Came" and "Upper bowl open" are the same amber. | NON-STRUCTURAL |
| 7 | The locked-waiting building panel renders as a mostly-empty black rectangle with one clipped quadrant of a bowl in it. | NON-STRUCTURAL |
| 8 | The rejoin PIN still tops every frame as a full-width banner, and after collapse leaves an empty labelled strip; it is also a chip in the rail, so it renders twice. | NON-STRUCTURAL |
| 9 | 231 words in the pre-lock first viewport against a 60-word ceiling; the same rule paragraph repeats verbatim on every night. | NON-STRUCTURAL |
| 10 | Row-1 card heights are ragged on every pre-lock frame; the rail runs 490–590px empty; an empty rail card renders on every post-PLAY phase; the desk identity truncates ("MADISON SQUARE …"). | NON-STRUCTURAL |

### Row-by-row grades

**§A — system**

| Row | Grade | Proof |
|---|---|---|
| A1 | **PARTIAL** — tokens MET, "equal heights within a row, aligned edges" UNMET, NO REASON RECORDED | Canvas `rgb(8,8,15)`, panels `rgb(16,16,25)`/`rgb(22,22,31)`, hairline `rgba(255,255,255,0.07)`, 16px radius, no shadows — measured. Row-1 card bottoms on pre-lock N1: price card 597, night card 452, right stack 500 (`03-play-prelock-n1-1366.png`); N3 late-join 597/502/500 (`07-`); N4 585/495/665 (`09-`). |
| A2 | **UNMET**, NO REASON RECORDED | Computed on `10-result-n4-d2-1366.png`: `.m2-result.is-sellout` `border-top/left: rgba(244,185,66,0.4)`; `h1.fh-sellout` `background-image: linear-gradient(rgba(244,185,66,.16), rgba(244,185,66,.04))` + gold border. Legend swatch `SPAN background rgb(240,169,74)` on every settled night. `.m2-helper.fh-renewal-rule` `background rgba(77,162,232,0.07)` + `border-left rgb(77,162,232)` on every pre-lock state (`03-`, `07-`, `09-`). `design/VISUAL_IDENTITY.md` asserts the opposite ("Gold is retired as an M2 UI accent … survives only … inside the drawn building"). |
| A3 | **MET** (one note) | CASH green `rgb(34,197,94)` when positive, red when negative (`19-…lowturnout…` `−$520,000`); RENEWALS never green/red, never dollars, `50% → 30%` in `rgb(138,138,156)` → `rgb(244,244,248)`. Note: `$0` also renders green on N1 pre-lock, which is not positive cash. |
| A4 | **UNMET**, NO REASON RECORDED | `document.fonts`: `Inter M2\|400 800\|loaded`, used by 47–65 elements per state. But `Bebas Neue` is loaded and used under `[data-module=m2]`: `h1.fh-sellout` "FULL HOUSE" `font-family:"Bebas Neue"` 40px/800 (`10-result-n4-d2-1366.png`); result headline `NIGHT 1 · 14,142 CAME AT $34` Bebas 26px (`10-result-n1-d1-1366.png`); rail identity `Desk 1 · New York Knicks` Bebas 12px on **every** state; rail `Night 1 of 5` Bebas 12px pre-lock. `VISUAL_IDENTITY.md`: "Bebas Neue does not appear under M2." |
| A5 | **MET** | `#fhPriceReadout` 68px @1366 / 64px @1024, largest figure on the frame; `#pinDisplay` 16px at every moment incl. the first seconds after join; results hero 72px turnout; figures ≥34px = 1 (N1, N3, N5, zero-turnout) and 2 (N4 sellout: 17,794 @72 + 7,256 @40); the largest figure is never money. |
| A6 | **PARTIAL** — no fitted line MET; chart quality UNMET, NO REASON RECORDED | DOM at all-nights-done: the only `<path>` in `#fhNights` is the axis `M40 12V116H406`; zero `line`/`polyline` joining marks. But the 5 marks sit at `cy` 44.0 / 49.1 / 49.7 / 52.6 / 57.7 in a plot spanning `y` 12→116 — a 13.7-unit spread in a 104-unit plot; N1 and N5 (both $34) sit at the same `cx 119.9`, 2.9 units apart with `r=5`, i.e. superimposed; labels N3 and N5 render with no mark beside them (`11-play-allnightsdone-1366.png`, `12b-play-reveal-final-1366.png`). |
| A7 | **PARTIAL** — law MET, art direction UNMET | Law: no arena at all pre-lock, so never lit pre-lock; fill = `turnout/seatsOpen`, labelled "of the seats you opened tonight" everywhere; "of Capacity" count **0** on every state; denominator moves to 22,200 on a bowl-open night (`20-`). Art: `crop-arena-partial.png` (71.4%) vs `crop-arena-sellout.png` (100%) differ mainly by an outer-ring dim and a gold rim; `crop-arena-empty.png` (0%) still shows a lit warm court and lit floodlights; the bowl silhouette is clipped at the panel top; the panel is letterboxed ~500×130. |
| A8 | **DEVIATED** — structure MET, four rendering defects, NO REASON RECORDED | Rail present with compass mark, lesson identity, NIGHT n OF 5 pips with day labels, two books docked, PIN chip, desk identity; collapses to a top strip at 1024×600 (`03c-`). Defects: an empty rail card renders at y 175–210 on every post-PLAY phase (`11-`, `12b-`, `14-`, `15-`, `16-`); desk identity truncates to "MADISON SQUARE …"; rail qualifiers ("after the bill", "in the red", "coming back") wrap and jam the panel edge; 490–590px of empty rail below the books. |
| A9 | **UNMET**, NO REASON RECORDED | Measured first-viewport word count: **pre-lock N1 = 231** against the contract's ≤60; HOOK = 348; late-join = 231. The `Season plan: $24 a seat …` paragraph renders verbatim and in full on N1, N3 and N4 — A9 required it to collapse after N1. |
| A10 | **MET** | `m2-commit-settle` 0.2s on `.m2-commit.fh-commit` at lock; arena `ar<n>-breathe` 5.4s ambient + `ar<n>-flash` 260ms on the first sellout, each shipping an inline `@media (prefers-reduced-motion: reduce){animation:none!important}` inside the injected SVG (`shared/arena.ts:878`); `m2.css:1551` caps `.m2-commit`, `.m2-result.is-sellout.is-flash`, `.m2-doors > .m2-doors-art` at 120ms. Reduced-motion browser run: zero running animations on the settled frame. No money figure carries an animation, so no spring easing on money. |

**§B — pre-lock desk**

| Row | Grade | Proof |
|---|---|---|
| B1 | **MET** | Breadcrumb "Module 2 · Money in Motion · Lesson 1", H1 "Full House", registered subtitle, two-book accountability card (CASH + RENEWALS + "You are keeping two books, and they do not add up to one number.") top-right (`03-`). |
| B2 | **MET** | 68px readout, `#fhPriceDown`/`#fhPriceUp` round buttons, styled range with violet fill, `$10`/`$120` end labels; PLAN $24 tick (top 427) does not intersect the knob (bottom 414) at 1366 or at 1024 (`03-`, `03c-`); helper is the registered renewals rule. |
| B3 | **MET on law**, quality failure carried at A6 | 4 marks at pre-lock Night 5 = 4 settled nights, no mark for the open night; no joining path; caption "One dot per night. Two nights are only comparable when the card is the same." |
| B4 | **UNMET**, NO REASON RECORDED | No arena element of any kind on the pre-lock state at 1366×768 (`03b-play-prelock-n1-full.png`, full page). The contract and `VISUAL_IDENTITY.md` both require the building present and dark (`lit:"idle"`) as a low-contrast hero backdrop with left fade. |
| B5 | **DEVIATED** (three cards, not four), NO REASON RECORDED | Rendered stat row: YOUR BUILDING / CASH / RENEWALS. TONIGHT'S CARD is a separate top-row panel; TONIGHT'S BILL and SEASON-PLAN PRICE are 11px sub-lines inside YOUR BUILDING, not cards. No card's number moves with the dial (verified across dial-moved states `04-`, `04b-`). |
| B6 | **MET** | Registered rule text renders verbatim in a fixed slot every night; the spend receipt prints as a backward-looking line on N4 (`09-`). |
| B7 | **MET** (one note) | `#fhLock` violet gradient with glow, lock glyph, 18px label; `.fh-blind-note` 14.5px `rgb(201,201,214)` directly beneath; 200ms commitment settle observed; the native `confirm()` is gone — the driver never accepted a dialog and the lock resolved straight to `.fh-locked-recap`. Note: the caption is centre-set over four ragged lines in a left-aligned grid. |
| B8 | **MET structurally; pressed-state read is weak** | MAKING IT AN EVENT is a smaller instrument under/beside the price card with its rule printed inline; the bowl is a plate with "Open 2,400 more seats tonight / paid whether they fill or not / $95,000". With `aria-pressed="true"` the plate is still visually near-indistinguishable from an info card (`09-`). Unpressed comparison NOT VERIFIED. |
| B9 | **DEVIATED**, NO REASON RECORDED | Pips + identity + ledger-as-B3 all MET. But the rejoin PIN renders as a 48px full-width banner above the lesson identity on every state until dismissed ("YOUR REJOIN PIN — WRITE IT DOWN IN CASE YOU SWITCH DEVICES: 9648" + "Got it"), and after collapse leaves an empty full-width "REJOIN PIN" strip (`10-result-n4-d2-1366.png`); it is *also* a chip in the rail, so the PIN renders twice. |

**§C — settled night / sellout**

| Row | Grade | Proof |
|---|---|---|
| C1 | **MET, measured at all five nights incl. sellout and zero-turnout** | N1 @1366 `scrollY=0`: headline ~215, WHO CAME bottom 326, `= CASH` bottom 632, renewals movement bottom 525, `#fhNextNight` 668–716, **`#fhLock` absent from the DOM**. N4 sellout: 356 / 507 / 662 / 613. Zero-turnout (Desk 3, $120, 0 came): 326 / 632 / 525. |
| C2 | **MET** | 72px WHO CAME with "of 19,800 · 71.4% of the seats you opened tonight"; CASH rendered as a chain (TICKETS `$34 × 14,142` → `+ IN-ARENA` → `− BUILDING BILL` → `− UPPER BOWL` → `= CASH`); RENEWALS before → after at equal weight (both 31px, different colours); ≤2 figures ≥34px on every settled state; the registered "they do not add up" line under the CTA. |
| C3 | **MET** | No "+n vs" strings anywhere. `#fhSpendVerdict` rules on last night's event money after the fact. The renewals "down 20 points" / "up 9 points" is the movement of one book, which C2 requires, not a projection delta. |
| C4 | **PARTIAL** | Fill drawn and labelled ✓; `turnedAway` rendered as a count under the bowl ✓ (inside the panel, not drawn "outside the gates"); upper-bowl third legend state present on a bowl-open night ✓. **But the legend is broken:** "Came" swatch `rgb(240,169,74)` amber while every lit seat is violet; on `20-result-n4-d1-bowlopen-1366.png` "Came" and "Upper bowl open" are the *same* amber, so two of three legend states are indistinguishable. The arena panel's top (233) sits above the CASH card's top (400) — C4 said "never above it". |
| C5 | **MET on copy; treatment is an advisory concern** | Headlines are factual (`NIGHT 1 · 14,142 CAME AT $34`; `FULL HOUSE · 17,794 of 17,794 · 7,256 TURNED AWAY`); vocabulary grep on rendered `/play` text: `strong round` 0, `momentum` 0, `maximize` 0, `trophy` 0, `profit` 0, `target` 0, `readiness` 0, `of capacity` 0, `weather` 0. Concern: the sellout headline is a gold-gradient, gold-bordered banner — the visual grammar of an achievement ribbon around factual words (D4-adjacent, advisory). |
| C6 | **MET** | "NEXT: NIGHT 2 → Saturday · Draw 51 · local TV →", printed facts only. |
| C7 | **MET on every measurement; A2 breach carried** | `FULL HOUSE` top **192** (<200); turned-away 7,256 bottom **507** (≤768) and the second-largest figure at 40px vs 72px hero and 31px money; one `ar8-flash` 260ms on the first sellout; `resaleNote` verbatim ("7,256 people wanted in and could not get a seat"). |
| C8 | **UNMET as rendered**, NO REASON RECORDED | `05-play-locked-waiting-1366.png`: the dark-building panel is a 1105×335 black rectangle in which only the bottom-right quadrant of the bowl is drawn, clipped at the right edge, with a visible seam at x≈336 / y≈300. It reads as a failed image, not as "the building comes up dark". Copy, locked price and the caption are correct. This is the state a pair sits in five times a lesson. |

**§D — mirrors**

| Row | Grade | Proof |
|---|---|---|
| D1 | **PARTIAL** | Two-book row + the five-night dot card both present at all-nights-done and REVEAL (`11-`, `12b-`); **absent at SYNTHESIS and COMPLETE** (`15-`, `15b-`, `16-`). |
| D2 | **UNMET** | `/play` SYNTHESIS carries no computed guarded line on any page. H1 "Look up at the board", subtitle "Look up at the board." (the same sentence twice), one exit-prompt card, then empty column. `15-` and `15b-` (page 1 and last page) are **pixel-identical** — the student device does not change as the teacher stages the six cards. |
| D3 | **Gate MET; "subordinate" UNMET** | Two Peaks numbers absent from the stage-0 mirror (`12-`) and present at the final stage (`12b-`) — R-9 gate holds as rendered. But the reveal-final mirror is the busiest `/play` frame in the lesson (Two Peaks panel + a 5-row ledger + a dot chart + the two-book header) at the moment the room is supposed to be looking at the board (DIRECTION Q3: "small, still"). Its subtitle also renders as a broken sentence: "Your five nights, in the books. Look up at the board for the room's." |
| D4 | **MET** | `EXIT_PROMPT` + `BEYOND_SPORTS_LINE` verbatim on COMPLETE; no "Plan Next Round". |

**Not my lane, one line each (wave 3):** `/teach` is unchanged wave-1 state — gold accent, Bebas eyebrows, desk tiles wrapping mid-token ("Rae & Ben" over three lines), controls below the fold (`17-teach-1366.png`). `/board` is unchanged wave-1 state — warm starburst backdrop, no M2 violet layer, no drawn arena, and `v94 · COMPLETE` still burned into the public frame (`18-board-1920.png`).

**Contract-letter note, not a visual finding:** rendered `/play` text contains `forecast` ×1 (HOOK: "Five nights. Two dials. No forecast — …") and `preview` ×2 (the registered subtitle "No preview." plus `HOUSE_RULES[0]`). All three are registered copy *denying* a projection. The §G grep is written as count-0 with a carve-out only for `HOUSE_RULES[0]`; route to Economic Truth, not to me.

---

## hierarchy-findings

Highest severity first. All OBSERVED unless marked.

1. **The `ARENA OUTCOME` legend contradicts the picture on every settled night.** "Came" swatch `rgb(240,169,74)`; the seats it labels are violet `#7a5cff`-family. On a bowl-open night "Came" and "Upper bowl open" are the same amber, so three legend states carry two colours, neither of which appears in the drawing. The one element whose job is to tell a 10-year-old how to read the flagship visual is wrong. (`crop-arena-partial.png`, `crop-arena-sellout.png`, `20-result-n4-d1-bowlopen-1366.png`)
2. **The arena's largest/brightest object at 0% turnout is the court, warmly lit.** On the night nobody came, the building reads as open for business (`crop-arena-empty.png` / `19-result-n1-lowturnout-reducedmotion-1366.png`). The frame's *figures* are honest — 72px `0`, red `−$520,000` — and the *picture* contradicts them.
3. **71.4% and 100% fill are not separable by eye.** Side by side the difference is an outer-ring dim plus a gold rim. The picture does not tell you the number; the number tells you the picture. The consequence panel is therefore decorative, not instrumental.
4. **Pre-lock, the brightest object is the CTA, not the price — and that is right; but the price is duplicated against by a second CASH/RENEWALS pair.** `$24` at 68px is correctly the largest figure and `#pinDisplay` at 16px correctly loses the hero slot. However CASH and RENEWALS render twice on one frame — 21px in the header goal card and 31px in the stat row (`03-`). Two of the four secondary slots restate the header.
5. **Settled night: the largest object is the turnout, and it is the right one.** N1 `14,142` @72px; sellout `17,794` @72px then `7,256` @40px (correct C7 order); money never exceeds 31px on any settled frame. Figures ≥34px: 1 on N1/N3/N5/zero-turnout, 2 on the sellout. This is the strongest hierarchy in the module.
6. **Sellout: `FULL HOUSE` reads before the turnout, at top 192.** Correct order. But its gold banner is the brightest object on the frame and out-ranks the 72px figure by area and saturation, which is a reward-ribbon read on factual words.
7. **The zero-turnout hero card does not re-compose for a one-glyph figure.** `0` at 72px sits in a 540px card that is ~90% empty (`19-`). The composition was sized for `14,142`.
8. **The rail says the wrong night on every results frame.** The pips read "NIGHT 2 OF 5" while the headline reads "NIGHT 1 · …" (`10-result-n1-d1-1366.png`); "NIGHT 5 OF 5" while the headline reads Night 4 (`10-result-n4-d2-1366.png`). The frame and its own chrome disagree.
9. **Five states have no hierarchy because they have almost no content in the grid.** SYNTHESIS: last card bottom ≈297 in a 768 viewport → ~471px empty main column, identical on every synthesis page. COMPLETE: ≈352 → ~416px. All-nights-done / REVEAL stage 0: ≈490 → ~278px. HOOK inverts the problem: 348 words, no hero figure, no building, on the frame that is supposed to open the lesson.
10. **Figure sizes across the module** (measured, `Inter M2` throughout unless noted): hero 68/72px (proportional, 700); second tier 40px (600); money and renewals 31px (600); stat-card figures 21–31px; labels 12px caps; body 13–15px; captions 11–12px. The scale is coherent. Its only breaks are the two Bebas slots (26px result headline, 40px `FULL HOUSE`) and the 12px Bebas rail identity.

---

## production-quality-gaps

1. **Type — the M2 layer breaks its own type law in its loudest slot.** `document.fonts` reports `Inter M2\|400 800\|loaded` and it does set 47–65 elements per state, so the vendoring worked. But `Bebas Neue` is also loaded under `[data-module=m2]` and is the computed family of: the sellout `FULL HOUSE` (40px/800), the result headline on every night (26px), the rail desk identity on every state (12px), and the rail night label pre-lock (12px). `design/VISUAL_IDENTITY.md` says "Bebas Neue does not appear under M2." NO REASON RECORDED anywhere I could find.
2. **Accent discipline — four UI hues, not one.** Distinct rendered UI accents on `/play`: violet `#9d86ff`/`#7a5cff` (sanctioned), green `#22c55e` (sanctioned, CASH only, correctly withheld from RENEWALS), **blue `#4da2e8`** (the rule box background + 3px left border on every pre-lock frame), **gold `#f4b942`** (sellout panel border + headline gradient), **amber `#f0a94a`** (legend swatches on every settled night). Gold and amber are outside the arena SVG, in HTML, which is exactly what A2's acceptance evidence forbids.
3. **The locked-waiting building is broken.** A 1105×335 panel in which the bowl occupies only the bottom-right quadrant, clipped at the right edge, with a visible tonal seam at x≈336 / y≈300, and the caption "NIGHT 1 · LOCKED" centred over the void rather than over the building (`05-play-locked-waiting-1366.png`). This is one of the two states with the highest dwell time in the lesson.
4. **The arena reads as an aerial seating diagram, not a building lit for a game.** It has the right ingredients — tiered rings, a wood court with markings, gold rim floods, city bokeh — and none of the depth cues that would make it a place: no lighting falloff from the court outward, no crowd granularity, no rake, no complete silhouette (the top of the bowl is cropped by the panel), and a letterboxed ~500×130 frame that squashes it. The court's corners carry black wedge artifacts. Verdict: an instrument that does not instrument, and a picture that does not place.
5. **Chart quality.** `#fhNights` obeys every law it was given (axis is the only `<path>`; no join; no pending mark; caption present) and still fails as a chart: y is scaled to an absolute denominator rather than fitted, so five nights spanning 12,450–15,800 people compress into 13% of the plot height; N1 and N5 (both $34) superimpose at `cx 119.9`, 2.9 units apart with `r=5`; and the N3/N5 labels render with no mark beside them (`11-`, `12b-`). The left 22% and right 25% of the plot are permanently empty because x is scaled to the full $10–$120 dial range.
6. **Spacing rhythm and grid.** Gutters (18px), padding (22px), radius (16px) and hairlines (7%) are consistent and correct. The grid is not: row-1 card bottoms are ragged on every pre-lock frame (597/452/500; 597/502/500; 585/495/665) against the reference's explicit "equal heights within a row, aligned edges". A 90px hole opens between the price card and the stat row on N4.
7. **Chrome above the product.** Four stacked bands precede any lesson content: the `BOW ECONOMICS / synced` bar (~35px), the rejoin-PIN banner (~48px), a `W2 VISUAL REVIEW · SEATED AS RAE & BEN` line (~14px, set in Bebas), and — at 1024×600 — the collapsed rail strip (~78px). At 1024×600 that is ~175px of 600, i.e. **29% of the student's first-contact screen is chrome**. After the PIN is collapsed it leaves an empty full-width band containing only the words "REJOIN PIN".
8. **Copy density.** 231 words in the pre-lock first viewport (ceiling 60); 348 on the HOOK. The `Season plan: $24 a seat …` rule paragraph renders in full and verbatim on N1, N3 and N4 — A9 required a collapse after N1. Below the fold pre-lock, "WHAT THE EVENT MONEY DOES" is a ~130-word grey block. The market blurb ("The biggest market in American sports…") renders twice on the same pre-lock frame — once in the night card, once as the empty-state of YOUR NIGHTS SO FAR.
9. **Copy defects visible on screen** (registered strings, flagged not graded): SYNTHESIS renders "Look up at the board" as H1 and "Look up at the board." as the subtitle; REVEAL renders the broken sentence "Your five nights, in the books. Look up at the board for the room's."
10. **Rail defects.** An empty rounded card renders at y 175–210 on every post-PLAY phase; the desk identity truncates to "MADISON SQUARE …" at 1366; the qualifiers "after the bill" / "in the red" / "coming back" wrap into two lines jammed against the panel's right edge; 490–590px of rail sits empty below the books.
11. **Motion — the one thing that is clean.** `m2-commit-settle` 200ms on lock, `ar<n>-breathe` 5.4s ambient flood, `ar<n>-flash` 260ms on the first sellout only. Every one ships a reduced-motion collapse — the arena's inline inside the injected SVG (`shared/arena.ts:878`), the rest in `m2.css:1551` at 120ms. A `reducedMotion:"reduce"` browser context showed **zero** running animations on the settled frame. No money figure animates, so there is no spring easing on money. Nothing animates that has not earned it.
12. **Two-books typography.** CASH and RENEWALS never share family + size + colour in the same row on any state I measured; the header pairs them at the same 21px but in green vs off-white, and the results frame separates them into different cards at 31px in different colours. No rendered figure is a function of both. MET.

---

## direction

Ordered by how much each buys against the PREMIUM gap. I direct; I do not certify what I directed, and I am not the sole certifier of this surface.

1. **Redraw the fill encoding, not the arena's paint.** The bowl must answer "how full?" from across a classroom desk in under a second. Give it a *hard* boundary — lit seat blocks up to the fill line, unmistakably dark blocks above it, and a visible seam between them — rather than a brightness ramp across rings. Then make 0% actually dark: kill the court lighting and the floods when nobody came, so the empty night looks like an empty night. Keep the sellout's full-bowl + rim flash as the only warm state in the module. STRUCTURAL; this is the wave's flagship asset and it is currently the weakest thing on a strong frame.
2. **Fix the legend in the same pass by deleting it.** Three swatches, two of them the same amber, none matching the drawing, is worse than no legend. Label the picture directly: the fill boundary carries "14,142 came" on the lit side and "5,658 open" on the dark side, and on a bowl-open night the upper tier carries its own inline label. One less UI element, one less colour, one less thing to get wrong.
3. **Take Bebas out of M2 and give the two headline slots a real display treatment in Inter.** The sellout deserves display scale — put `FULL HOUSE` at 56–64px Inter 800 with tight tracking, on the panel ground, and drop the gold banner entirely; let the fully-lit bowl beside it be the warmth. The night headline becomes Inter 600 at 26–28px. The rail identity becomes Inter 600 caps at 12px. This removes both the A4 breach and the A2 breach and the reward-ribbon read at once.
4. **Retire the blue rule box.** Same panel treatment as every other card, a violet 3px rule if it needs an edge. One accent.
5. **Compose the five empty states.** HOOK, SYNTHESIS (every page), COMPLETE and the two waiting states currently spend 280–470px of the main column on nothing while the frames that matter are over-dense. The material to fill them already exists and is already registered: the pair's own five nights, their two books, the building. Specifically — HOOK opens on the dark building with the slate as five cards beside it and *one* rule, not two paragraphs; SYNTHESIS mirrors the board card the teacher is on, one card at a time, with the pair's own numbers in it (that also discharges D2 and the D3 per-stage requirement); COMPLETE closes on the pair's five nights and the exit prompt, not a paragraph in a void. STRUCTURAL.
6. **Re-scale the nights chart to the data and label the marks, not the space.** Fit y to the observed people range with a little headroom, keep x on the dial range so nights stay comparable, and when two nights share a price nudge the marks apart on a fixed offset with a leader to a single chip. Two of five marks currently unreadable is worse than no chart on the frame the pair uses to decide tonight's price.
7. **Move the PIN out of the top band permanently.** It is already a chip in the rail. The banner is the last piece of school chrome sitting above the lesson's own identity, it costs 48px on every frame and 29% of a 1024×600 first contact together with the other bands, and its collapsed state is an empty labelled strip. Delete the banner; keep the chip.
8. **Fix the locked-waiting panel's geometry before anything else on this list** — it is a one-line viewBox/positioning defect masquerading as a broken image on a state every pair sees five times.
9. **Even the row.** Equal card heights within row 1, and cut the duplicated CASH/RENEWALS pair from the stat row now that the header carries both. That frees a slot for the pre-lock dark building the contract asked for (B4) and the frame gains a place instead of losing a number.
10. **Halve the pre-lock word count.** 231 → the reference's one-sentence-per-card. Collapse the repeated season-plan paragraph after Night 1 behind its registered one-line summary, and move "WHAT THE EVENT MONEY DOES" onto the spend instrument as a single line. The economics does not get simpler; the reading does.

**Dissent recorded** — category `visual-quality`, severity `important`: the Module-2 design system violates its own two published laws (A2 accent, A4 type) inside the module's designed peak moment, and the wave's flagship asset — the drawn arena — does not carry the fill read it exists to carry at 0%, 71% or 100%. Advisory under my authority; recorded so a later "PREMIUM" claim cannot be made without disposing of it.

---

## Re-check after repairs (head 54402b0)

Run `m2-visual-quality-war`, wave 2, assignment `w2-recheck-visual`, actor `visual-critic-3`.
Head re-checked: git `54402b0` (`runtime/dist` as built at that head; no source touched). Port 4442.
AGENT-PLAYTESTED — one 4-desk, 5-night class driven end to end in a single script (Desk 1 New York:
$34/$48/$40/$24+upper bowl/$34; Desk 2 Memphis held at $16, sells out N2 and N4; Desk 3 held at
$120, draws **0** on N1/N2/N3/N5; Desk 4 late-joins at N3), plus a second single-desk probe to
force the two states the class run did not produce (upper bowl OPEN and NOT sold out; a clean
locked-waiting capture). 47 measured states, both viewports, results measured at `scrollY=0`
before NEXT. Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.

Screens: `screens-w2-visual-review-recheck/` (`MANIFEST.md`). Measurements:
`getBoundingClientRect` / `getComputedStyle` / `document.fonts` harvested live.

### visual-verdict (re-check)

**Overall: STRONG. Past SERVICEABLE, still not PREMIUM.**

Three of my four loudest findings are gone as measured: the accent law and the type law are now
kept (0 gold/amber declarations inside `#gameBody`/rail/header across all 47 captured states;
Bebas is off the lesson surface entirely), the gold sellout ribbon is replaced by `FULL HOUSE` at
60px Inter 800 on the panel ground, the PIN banner is deleted, the locked-waiting building is a
whole dark arena instead of a clipped quadrant, the pre-lock grid is even (309/309 and 286/286),
and the night nobody came now draws a genuinely dark building. What holds it off PREMIUM is
narrower than before and it is still concentrated in the two drawn instruments: the arena answers
*empty / partly / full* but not *how full*, and the same ring changes meaning night to night; and
the nights chart is unreadable on the frame where the pair decides tonight's price — and now
renders on six frames instead of two.

#### What stands between here and PREMIUM (re-issued)

| # | Gap | Class |
|---|---|---|
| 1 | The arena separates 0% and 100% but not the middle. 52.8 / 62.9 / 68.1 / 71.4% render as the same three-band bullseye (`cmp-arena-fill-ladder.png`, `cmp-arena-2x.png`). Worse, the outer ring is not a stable object: on a night the upper bowl is **not offered** it is drawn as an ordinary lit deck; on a night it is **offered and declined** it is drawn shuttered (`cmp-bowl-open-vs-shuttered.png`). Same building, same ring, different meaning, no visible cue. | **STRUCTURAL** |
| 2 | `YOUR NIGHTS SO FAR` is still not fitted and now collides. y maps ≈0–26,000 people over the plot, so four ordinary nights occupy 6.8 of 104 plot units (6.5%); N1 and N5 at the same $34 sit at identical `cx` 2.6 units apart with `r=5`; labels overlap horizontally on every frame ("14,1**$48** · 14,288"), and N5's label renders at `y=119` below the `y=116` axis. It now appears on pre-lock N3+, all-nights-done, REVEAL, SYNTHESIS and COMPLETE. | **STRUCTURAL** |
| 3 | HOOK is untouched (known gap): 354 first-viewport words, 1,197px document, no hero figure, no drawn building, two long HOUSE RULE blocks below the fold. | **STRUCTURAL** |
| 4 | 269 first-viewport words pre-lock at 1366 / 219 at 1024 (clip- and visibility-aware count) against a 60-word contract ceiling; `HOUSE_RULES[0]` renders verbatim, centre-set over 4–5 ragged lines, directly under the CTA on **every** pre-lock night. | NON-STRUCTURAL |
| 5 | Dead ground on the back half: 300–340px of black under the left column on every results frame, ~265px of empty rail on results, ~460px of empty rail on every post-PLAY frame. | NON-STRUCTURAL |
| 6 | 1024×600 sellout: `#fhNextNight` bottom 623 (bowl closed) / 737 (bowl open) in a 600px viewport — the primary CTA and the 40px turned-away figure are below the fold. | NON-STRUCTURAL |
| 7 | The rejoin PIN chip renders at 746..781 in a 768 viewport — clipped by the fold on **every** 1366×768 state. Desk identity still truncates ("Desk 1 · New York …"). | NON-STRUCTURAL |
| 8 | `/play` at SYNTHESIS **page 1** is byte-identical to the COUNTERFACTUAL frame (innerText md5 `04632cfc37` on both). The device does not change when the teacher opens the synthesis; it changes from page 2. | NON-STRUCTURAL |
| 9 | The arena's direct labels are a caption block **under** the drawing, not attached to the lit and dark regions. The legend defect is gone; the "label the picture" direction is half-taken. | NON-STRUCTURAL |
| 10 | REVEAL final is still the densest `/play` frame in the lesson (season card + Two Peaks + 5-row ledger + chart) at the moment the room is supposed to be looking at the board. | NON-STRUCTURAL |

### Row-by-row re-grade

**§A — system**

| Row | Was | Now | Proof |
|---|---|---|---|
| A1 | PARTIAL | **DISCHARGED** | Pre-lock N1 row 1: price card 155..464 (309) at x=233, night card 155..464 (309) at x=635 — equal; row 2: 475..761 (286) and 475..761 (286). Same at N4 (`03-`, `09-`). The event instrument at x=1008 (155..295) is a stack member, not a row-1 card. Results columns 275 / 229+258 / 226+102+62. |
| A2 | UNMET | **DISCHARGED** | Gold/amber census (`color`/`background`/`border`/`background-image`, r>180 g130–210 b<130) inside `#gameBody`, `.m2-rail`, `#gameHeader`: **0 hits on all 47 states**, including the two sellouts and the bowl-open sellout. The blue rule box is gone (renewals rule is body text in the price card; `.fh-renewal-cause` left border is `rgb(201,201,214)`). Rendered UI hues now: violet, CASH green, negative-cash red, greys. |
| A3 | MET (note) | **MET**, note stands | CASH green when positive, `rgb(239,…)` red at `−$520,000` (`10-result-n1-d3-1366.png`); RENEWALS never money, never green/red. `$0` still renders green in the pre-lock header. |
| A4 | UNMET | **DISCHARGED** | `Bebas Neue` computes on exactly **2** elements in the whole document on every state, both `.eyebrow` inside the hidden join card ("Join your class", "Rejoin your seat"). Zero Bebas on the lesson surface. Result headline is Inter 26px; `FULL HOUSE` Inter 800 60px; rail identity Inter. Residual: the pre-join `/play` screen still sets Bebas (`00-play-prejoin-1024.png`) — outside the M2 lesson surface. |
| A5 | MET | **MET** | Pre-lock `$24` 68px @1366 / 64px @1024 = largest figure; results turnout 72/64px; PIN is a 12px rail chip; largest figure never money on any of the 24 settled states. |
| A6 | PARTIAL | **STANDING** (blast radius NEW REGRESSION) | Marks at all-nights-done: `cy` 27.2 / 59.4 / 58.8 / 62.0 / 66.2 in a `y` 12→116 plot. Linear fit through (22,200→27.2) and (12,450→66.2) extrapolates to 0 people at `cy` 116 and 26,000 at the top: **not fitted to the data** — the four non-bowl nights span 6.8 of 104 units. N1/N5 both `cx 119.9`, 2.6 apart, `r=5`. Labels: N1 at (119.9, 77.4) and N2 at (166.4, 76.8) overlap; N5 at `y=119` sits below the axis. Rendered on 6 frames (`09-`, `11-`, `12b-`, `15b-`, `16-`, plus pre-lock N3). |
| A7 | PARTIAL | **PARTLY** | Law still MET (no arena pre-lock… now superseded — see B4; fill = turnout/seatsOpen; denominator 22,200 on a bowl-open night; "of Capacity" count 0). Art: 0% is a dark building — no floods, no lit court (`crop-arena-n1-d3.png`); whole silhouette in frame at every container aspect; panel 337×258 with a ~300×130 drawing. 100% now separable from 71% (continuous violet to the gold rim vs banded), but 52.8/62.9/68.1/71.4 are mutually indistinguishable at native size and all four are indistinguishable at 33% scale. |
| A8 | DEVIATED (4 defects) | **PARTLY** | Empty rail card at y175–210: gone (rail now carries progress card + books + identity + PIN chip only). Truncation "Desk 1 · New York …": STANDING. Empty rail 265px (results) / ~460px (post-PLAY): STANDING. NEW: `fh-pin-chip` 746..781 in a 768 viewport — clipped on every state. |
| A9 | UNMET | **STANDING** | Clip- and visibility-aware first-viewport word count, pre-lock N1: **269** @1366, **219** @1024 (builder measured 281/223 with their method; both fail the ≤60 contract ceiling and the ≤120 repair target). The season-plan/house-rule paragraph renders verbatim on N1, N3 and N4. |
| A10 | MET | **MET as observed**; reduced-motion NOT RE-VERIFIED | `m2-commit-settle` 0.2s at lock; `are-breathe` 5.4s + `are-flash` 0.26s on the sellout frame only; no animation on any money figure. I did not re-run a `reducedMotion:"reduce"` context this pass; the inline `prefers-reduced-motion` block is still present in `dist/client/shared/arena.js` and `m2.css` (INFERRED). |

**§B — pre-lock desk**

| Row | Was | Now | Proof |
|---|---|---|---|
| B1 | MET | **MET** | Breadcrumb, H1 "Full House", two-book header card top-right (`03-`). |
| B2 | MET | **MET** | 68/64px readout, ± buttons, PLAN $24 tick clear of the knob at both viewports. |
| B3 | MET on law | **MET on law**; quality carried at A6 | 2 marks at N3, 4 at N5, no joining path, caption present. |
| B4 | UNMET | **DISCHARGED on presence** | The dark building renders in the pre-lock frame inside `YOUR BUILDING` (`03-`, `03c-`, `09-`). It is a card-sized picture, not the low-contrast hero backdrop with left fade the reference described — art direction not taken, presence law met. |
| B5 | DEVIATED | **STANDING** (unchanged, minor) | Three cards; TONIGHT'S CARD is still a separate row-1 panel and BILL/SEASON PLAN are sub-lines inside YOUR BUILDING. No card's number moves with the dial. |
| B6 | MET | **MET** | Rule text in a fixed slot; spend receipt is backward-looking ("Last night you put $40,000 into making it an event…", `09-`). |
| B7 | MET (note) | **MET**, note louder | Violet CTA with lock glyph; the blind-note is now the 4–5 line centre-set `HOUSE_RULES[0]` block under the CTA, ~110px tall at 1366 and ~100px at 1024, centre-set inside a left-aligned grid. |
| B8 | structurally MET, weak pressed read | **DISCHARGED (pressed)**; unpressed NOT VERIFIED | Pressed bowl plate is violet-filled with a violet border, an `OPEN` tag and `$95,000` — distinct from the grey info cards (`09-`). I captured only the pressed state this run. |
| B9 | DEVIATED | **DISCHARGED** | `#pinCard` measures 0×0 on every state; no banner, no empty labelled strip. PIN renders once, as a rail chip. Residual: that chip is clipped by the fold (A8). |

**§C — settled night / sellout**

| Row | Was | Now | Proof |
|---|---|---|---|
| C1 | MET | **MET at 1366; PARTLY at 1024** | 1366, all 24 settled states: headline → WHO CAME → CASH chain → renewals movement → WHAT HAPPENED (392..494) → NEXT (504..566), `#fhLock` absent. 1024×600 sellout: NEXT 561..623 (bowl closed) and 675..737 (bowl open) — below a 600px fold (`10c-result-n4-d2-1024.png`). |
| C2 | MET | **MET** | 72px turnout, CASH as a chain, renewals before→after at equal weight, ≤2 figures ≥34px. |
| C3 | MET | **MET** | No "+n vs" strings; the verdict rules on last night's money after the fact. |
| C4 | PARTIAL (legend broken) | **DISCHARGED on the legend; PARTLY on labelling** | `ARENA OUTCOME` is absent from the rendered text on all 47 states. Direct labels: "14,142 came — the lit seats" / "5,658 empty — the dark seats above the line" / "More seats open|closed" / "71.4% of the seats you opened tonight". They are a caption block below the drawing, not attached to the regions. Arena top 395 vs CASH card top 156 — no longer above it. |
| C5 | MET on copy; ribbon concern | **DISCHARGED** | `FULL HOUSE` is Inter 800 60px white on the panel ground, no gold border, no gradient (`10-result-n4-d2-1366.png`). The achievement-ribbon read is gone. Forbidden vocabulary: 0 across all states. |
| C6 | MET | **MET** | "NEXT: NIGHT 5 → Tuesday · Draw 22 · not on TV". |
| C7 | MET | **MET at 1366** | `FULL HOUSE` top **117** (<200); turned-away 7,256 at 40px, top 711, bottom ≈751 ≤768; one `are-flash` 260ms; `resaleNote` verbatim. At 1024 the turned-away figure sits at top 666 — below the fold (carried at C1). |
| C8 | UNMET | **DISCHARGED** | `05-play-locked-waiting-1366.png`: a complete dark bowl, whole silhouette, city behind, caption "NIGHT 1 · LOCKED" centred **on the building**, `LOCKED AT $40` beneath. No clipping, no seam. |

**§D — mirrors**

| Row | Was | Now | Proof |
|---|---|---|---|
| D1 | PARTIAL | **DISCHARGED** | Two-book header + the five-night ledger + the dot chart render at all-nights-done (`11-`), REVEAL (`12b-`), SYNTHESIS (`15b-`) and COMPLETE (`16-`). |
| D2 | UNMET | **PARTLY** | SYNTHESIS pages are now distinct (innerText md5 page 2 `88d5a6bf5f`, page 6 `fec4e089d2`) and carry the staged card ("YOUR JOB IS REAL", `6/6`) plus the pair's own five nights. But page **1** is byte-identical to the COUNTERFACTUAL frame (`04632cfc37` on both) — the device does not change when the teacher opens the synthesis, and the staged card is below the fold on that page (`15-`). |
| D3 | Gate MET; "subordinate" UNMET | **Gate MET; "subordinate" STANDING** | Two Peaks absent at stage 0 (`12-`), present at the final stage (`12b-`). The final mirror is four stacked panels + a 5-row ledger + a chart, `lastContentBottom` 789 — the densest frame in the lesson. The broken subtitle "Your five nights, in the books. Look up at the board for the room's." is unchanged. |
| D4 | MET | **MET** | `EXIT_PROMPT` + `BEYOND_SPORTS_LINE` verbatim on COMPLETE; no "Plan Next Round". |

### The four questions I was asked to answer in rendered context

1. **Does 71% vs 100% read at a glance across a room?** Not at a glance; yes on inspection. At
   100% the seating mass is continuous violet out to the gold rim; at 71.4% a dark annulus rings
   it. That distinction survives at native 337px if you look for it, and dies at 33% scale
   (`cmp-arena-fill-ladder.png`). Between 52.8% and 71.4% there is no usable read at any size:
   the equal-area-per-deck seam produces the same violet/dark/violet/dark bullseye at every
   mid-fill (`cmp-arena-2x.png`). The picture now answers *empty / partly / full*; it does not
   answer *how full*.
2. **Does 0% read as nobody came?** Yes. Unambiguously the best thing the repair did. No floods,
   no lit court, grey rings, a dead ember of a floor — and it sits beside a 72px `0` and a red
   `−$520,000` that the picture no longer contradicts (`crop-arena-n1-d3.png`,
   `10-result-n1-d3-1366.png`). DISCHARGED.
3. **Does the shuttered upper bowl read as closed vs open-and-empty?** Weakly, and the encoding is
   unstable. Bowl offered-and-declined draws the outer deck as a dark ribbed cover; bowl open
   draws it as a dark-violet unsold deck; **bowl not offered that night draws it as an ordinary
   lit deck** (`cmp-bowl-open-vs-shuttered.png` — three New York frames at 52.8 / 65.2 / 62.9%).
   So the same ring of the same building means "seats you didn't buy", "seats you bought and
   didn't fill", and "ordinary seats" on different nights, distinguished by a hue/texture nuance
   about 3px tall at native size. The text carries the state ("More seats open" / "More seats
   closed"); the picture does not.
4. **Do the direct labels replace the legend cleanly?** The legend defect is fully gone and nothing
   about the labels is wrong. They are not yet *on* the picture: three left-aligned caption lines
   under the drawing, so the eye still maps text → ring rather than reading the ring.

### Judgements on the specific repairs

- **New sellout headline vs the reward-ribbon concern:** discharged. 60px Inter 800 white on the
  panel ground, factual subtitle inline, no gold, `top 117`. It reads as a headline, not a prize.
  Note that at 60px it is now the largest *object* on the frame while the 72px turnout is the
  largest *figure* — the correct order survives, but there is no headroom left above it.
- **Composed LOBBY / REVEAL / SYNTHESIS / COMPLETE:** LOBBY and COMPLETE are genuinely composed
  (COMPLETE closes on the pair's five nights, the chart and the exit prompt). SYNTHESIS is composed
  from page 2 onward and stalls on page 1. REVEAL is composed and now over-dense (D3).
- **The left rail's dead black on results:** improved, not solved. On results the rail carries
  identity, pips, both books and the two-books line, then ~265px of black before the bottom-docked
  desk identity; on every post-PLAY frame it carries the lesson identity and nothing else for
  ~460px (`11-`, `12b-`, `15b-`, `16-`).
- **The centred rule block under the CTA:** unchanged as a composition problem. 40 words of
  `HOUSE_RULES[0]`, centre-set over 4–5 ragged lines, in an otherwise left-aligned grid, directly
  under the loudest element on the frame, on every night. It is the single largest contributor to
  the 269-word pre-lock count and it repeats verbatim what HOOK already said.

### Direction (re-issued, ordered by what buys most against the remaining gap)

1. **Make the fill line one line, not one per deck.** The equal-area-per-deck seam is economically
   honest and visually mute. Draw a single unmistakable boundary across the whole bowl — every
   block below it lit, every block above it dark, one seam — and let the decks be architecture,
   not the encoding. Then 52% and 71% differ by the position of one line instead of the width of
   three annuli.
2. **Give the upper deck one stable meaning.** A deck that is not offered should not be drawn as a
   lit deck. Draw the extra deck only when it exists on the night's card, always shuttered when
   closed, always in the pool when open. Same ring, same meaning, every night.
3. **Re-scale and de-collide the chart, or cut it from the pre-lock frame.** Fit y to the observed
   people range; offset same-price nights on a fixed jitter with a leader; clamp labels inside the
   plot; drop the label to a hover/last-night-only chip if six labels cannot fit. Two of five
   marks unreadable on the frame the pair uses to price tonight is worse than no chart there.
4. **Cut the centred rule block to one line and left-set it.** Move the rest to `MORE ABOUT
   TONIGHT`. That alone takes ~40 words off the pre-lock count and removes the only centred text
   block in a left-aligned system.
5. **Compose HOOK.** Still the untouched frame: the dark building as the hero, the five-card slate
   beside it, one rule, the rest behind the disclosure.
6. **Fix the two fold defects:** the PIN chip clipped at 746..781 in a 768 viewport, and the
   1024×600 sellout CTA at 623/737. Both are single-value layout fixes on states every pair hits.
7. **Make SYNTHESIS page 1 change the device.** It is currently the counterfactual frame; the
   staged card is below the fold.
8. **Attach the arena labels to the picture** — "14,142 came" on the lit side of the seam,
   "5,658 empty" on the dark side — and thin the caption block to the percentage.

**Dissent — restated and narrowed.** Category `visual-quality`, severity **advisory** (was
`important`). The published-law limb is discharged: A2 and A4 are now kept inside the peak moment
(0 gold/amber declarations in HTML across 47 states; Bebas off the lesson surface; the gold ribbon
replaced). The flagship-asset limb stands in narrowed form: the drawn arena reads *empty*, *partly*
and *full*, but does not carry a legible *how full* between roughly 50% and 75%, and its outer deck
carries three different meanings across nights with no cue a 10-year-old can see. Recorded so a
later "PREMIUM" claim cannot be made without disposing of it.

## Final re-check after repair 4 (head 84d8983)

Run `m2-visual-quality-war`, wave 2, assignment `w2-final-visual`, actor `visual-critic-3`.
Product judged: `runtime/dist` as built at `84d8983` (repo head `573d334` at the time of the run;
`git diff b079af8..HEAD -- runtime/src runtime/dist` is empty, so the product is the repair-4
build). Port 4442, no source touched, no Boss CLI run. AGENT-PLAYTESTED: two full 3-desk,
5-night classes plus a HOOK/pre-lock probe — 34 + 25 + 4 measured states, `scrollY=0`,
`getBoundingClientRect` / `getComputedStyle` / `getBBox` harvested live. Nothing here is
HUMAN-TESTED or CLASSROOM-PROVEN.

Desks: **dA** $40/$60/$80/$100/$40 (bowl offered on N4 and DECLINED), **dB** $16 × 5 (sells out
N2 and N4), **dC** $44/$44/$44/$96+**bowl OPEN**/$44. Screens:
`screens-w2-visual-final/` (`MANIFEST.md`). Payload:
`scratchpad/boss/w2-final-visual/{measurements.json,probe2.json,probe3.json}`.

### Ruling on the open rows

| Row | Ruling | Measurement |
|---|---|---|
| **A6 nights chart** | **MET (measured)** | y is fitted to the data: dA five nights (3,170–13,450) print ticks `1,000` / `15,500` and marks span `cy` 29.0–104.1 of a 14–120 plot (71% of the plot; was 6.5%). Pre-lock N3 fits 11,600/12,510 into ticks `11,000`/`13,000`. `<path>` count in `.m2-chart` = **0** on every state — no line joins the dots. **Zero intersecting label boxes** on all four configurations (dA 1366 + 1024, dB, pre-lock N3): checked pairwise on `getBBox`, e.g. dA N5 `104.3–181.2 × 49.5–62.4` vs N2 `169.7–247.4 × 23.0–35.9` — x overlaps, y disjoint. No label leaves the plot: worst case dA N3 `$80 · 3,170`, baseline `y=119` inside the `y=120` axis, ink box bottom `121.4` (1.4 user units ≈ 1.7 px past the axis rule). **No mark for the pending night**: at pre-lock N3 exactly 2 circles for 2 settled nights (`p2-crop-chart-prelock-n3.png`). |
| A6 residual (non-structural) | DEVIATED-WITH-REASON | The de-collider drops labels rather than moving them: dA prints 4 of 5 (N1 unlabelled), dB prints 3 of 5. At a repeated price the two dots overlap — dA N1/N5 both `cx 142.7`, `cy` 35.9 vs 43.0 with `r=5`, drawn as a figure-8 with only the later one named; dB stacks all five marks in one 6-unit column against the y axis. Nothing overprints and the ledger carries every night, but "which dot is Night 1" is unanswerable from the picture on exactly the comparison (same price, two nights) the lesson asks the pair to make. |
| **Arena outer deck** | **MET (measured)** | Same desk, same building: N1 (**bowl not offered**, 63.2%) and N4 (**offered and DECLINED**, 67.9%) render the identical outer construction — 40 `<path>`, a shutter cover at `hsl(228,10%,7.5%)`, ribs among the 16 stroke-only paths. N4 **OPEN** (65.3%) renders 38 paths with **no** `hsl(228,10%,7.5%)` cover and the outer ring lit (`cmp-bowl-three-states.png`). The three-meanings-one-ring defect from the previous pass is gone: the ring is shuttered on every night it is not open. |
| **R-7 equal proportion** | **MET as rendered; formula INFERRED** | On the open-bowl night the outer deck is lit to the same proportion as the other two (one seam rule, `r_seam = sqrt(rIn² + fill·(rOut² − rIn²))`, `runtime/src/client/shared/arena.ts`); rendered, no deck runs ahead of another at 65.3% (`p2-crop-arena-res-n4-dC.png`). I did not break it and my direction below does not require breaking it. |
| **Arena mid-fill "how full"** | **UNMET — STRUCTURAL** | Ladder at native size, real settled nights: 54.4 / 58.3 / 63.2 / 67.9 / 76.7% (`cmp-fill-ladder.png`, `cmp-fill-ladder-33.png`). The five pictures are not orderable without their captions; 54.4 and 67.9 are the same three-band bullseye. Repair 4 did not target this and did not change it. **Evidence for FD-3, not a ruling on it:** the per-deck equal-area seam is what makes these five states look alike — three annuli each moving a few pixels — so the founder's choice between a single whole-bowl seam and per-deck seams is the choice between a moving line and three moving widths. I do not decide it. |
| **A9 pre-lock reading burden** | **UNMET** | Pre-lock Night 1, `scrollY=0`, leaf text, visibility-aware: **293 words fully inside the viewport at 1366×768** (404 counting every block that touches the fold), **221 at 1024×600** (238 touching). Contract ceiling 60; repair target 120. Repair 4's own record says R4-6 was partial on word count — confirmed. |
| A9 → **FD-2** | The surface argues for the **copy ruling**, with a composition remainder | The 293 words are spread over six cards and a rule block, and none of them is decoration: the two-book header, the renewals rule inside the price card, the night card's four printed facts plus flavour line, the event-money rule, the chart's empty-state line plus caption, the building card's capacity provenance and "Tomorrow" line, and the `More about tonight` disclosure content that renders open. There is no arrangement of these blocks that reaches 60 words while the frame still carries the rules the pair needs to price tonight — so 60 is a copy ruling the composition cannot satisfy, and FD-2's 120-with-disclosure is the shape this surface argues for. It is not *only* a copy ruling: reaching even 120 requires moving the renewals rule, the event-money rule and the disclosure body behind an open-on-night-1 control — that part is composition work. Founder's call, not mine. |
| **C3 / HOOK** | **MET (measured)** | Composed: dark building hero (SVG, card 131..537), hero line "You are keeping two books, and they do not add up to one number." at 22px, five-card slate `557..747` — **slate bottom 747 < 768** at 1366 (`20-hook-composed-1366.png`). At 1024×600 **all five** slate cards are inside the fold (`331..487`), not the three required (`20c-hook-composed-1024.png`). First-viewport words **108** at 1366 and **137** at 1024 (was 354). The two long HOUSE RULE blocks are below the fold as five labelled rule cards. |
| C3 residual (non-structural) | DEVIATED-WITH-REASON | At 1024×600 the building is letterboxed to a 152px band and reads as a dark smear behind the hero line; the art that carries the frame at 1366 does almost no work at the Chromebook-small size. The hero line also drops below 20px there, so the frame's largest type at 1024 is the page title, not the idea. |
| **Rail PIN chip** | **MET (measured)** | `.fh-pin-chip` `710..745` in a 768 viewport at 1366 (bottom-docked, fully inside) and `73..108` in the header at 1024×600, on every state of both runs. Residual, unchanged: desk identity still truncates — "Desk 1 · New York …", "Desk 2 · Memphis Griz…". |
| **SYNTHESIS page 1 vs COUNTERFACTUAL** | **MET (measured)** | `/play` innerText md5 differs: COUNTERFACTUAL `7e79a21bcd` ("… What if …") vs SYNTHESIS page 1 `0d434474e1` ("… Look up …"). The device now changes when the teacher opens the synthesis. NOT VERIFIED this pass: whether page 2 differs from page 1 — my `#btnSynthPage` driver did not move the page, and the previous pass observed distinct pages 2 and 6, so I attribute this to my driver, not the build. |
| **1024×600 settled/sellout CTA** (was gap 6) | **MET (measured)** | The 1024 settled composition is rebuilt: on the N4 sellout the NEXT CTA and the `7,256 turned away` figure are both inside the 600px fold (`10c-res-n4-d2-1024.png`), and the ordinary settled night's `THE BOOKS ARE CLOSED` CTA likewise (`10d-res-n5-d1-1024.png`). |

### Regression re-take on rows already discharged

| Row | Ruling | Measurement |
|---|---|---|
| A2 gold/amber | **HOLDS** | Gold/amber census (`color`/`background`/`border`/`background-image`, r>180 · g 130–210 · b<130 · r−b>60) inside `#gameBody`, `.m2-rail`, `#gameHeader`: **0 hits on all 34 states** of run 1, including both sellouts, the open-bowl night and the zero-turnout night. |
| A4 Bebas | **HOLDS** | `Bebas Neue` computes on exactly **2** elements per document on every state, both `.eyebrow` inside the hidden join card. Zero on the lesson surface. |
| C5 sellout | **HOLDS** | `FULL HOUSE` Inter 800 60px `rgb(244,244,248)` on the panel ground, top 117, no gold, no ribbon; turnout 72px is still the largest figure; `7,256 turned away` 40px at `711..755` inside 768; one `arg-flash` 260ms + `arg-breathe` 5.4s (`10b-res-n4-d2-1366-sellout.png`). |
| C8 locked-waiting | **HOLDS** | Whole dark bowl, city behind, `NIGHT 1 · LOCKED` on the building, `LOCKED AT $40` beneath, no clipping (`05-locked-waiting-1366.png`). |
| New observation (non-structural) | — | The four-clause renewals rule (R4-4) now prints in full inside the RENEWALS card on **every** settled night (~45 words), so the settled frame repeats verbatim what HOOK and the pre-lock price card already said. Correct economics, third telling; it is the densest text block on the results frame. |

### Structural / non-structural ruling

**One structural gap remains: the arena does not encode *how full* across the 50–80% band that
most nights land in.** Everything else still open is non-structural — the pre-lock word count
(A9, copy ruling FD-2 plus a disclosure move), the dropped chart labels and coincident same-price
dots, the 1024 HOOK art, the truncated desk identity, the third telling of the renewals rule.
None of those needs an instrument rebuilt. The mid-fill read does: it is a change to the seam
rule in one file (`runtime/src/client/shared/arena.ts`), and it is exactly the choice the founder
has reserved as FD-3. Structural, bounded, and parked — but structural, so I do not name PREMIUM.

### Direction (ordered)

1. Resolve FD-3, then draw it. If the founder takes the single whole-bowl seam, 54% and 68% differ
   by the position of one line and the flagship instrument starts answering its own question;
   R-7's equal-proportion honesty is preserved by construction because one seam over the whole
   open pool *is* `turnout/seatsOpen`.
2. Resolve FD-2, then compose to it. Whatever number the founder sets, the pre-lock frame reaches
   it the same way: one line of rule on the frame, the renewals rule, the event-money rule and the
   `More about tonight` body behind a control that is open on Night 1 and closed after.
3. Move a dropped chart label instead of deleting it — offset the mark and lean the label, or name
   both dots at a repeated price. The same-price comparison is the one the lesson wants made.
4. Give the 1024 HOOK its own art crop instead of letterboxing the 1366 one.
5. Attach the arena's labels to the picture (still a caption block under the drawing) and stop
   printing the renewals rule a third time on the settled frame.

**Dissent — restated, narrowed again, not dischargeable.** Category `visual-quality`, severity
**advisory**. The outer-deck limb is **discharged** (one ring, one meaning, measured across the
three bowl states). The remaining limb: the drawn arena, the module's flagship asset, separates
*empty* / *partly* / *full* but does not carry a legible *how full* between roughly 50% and 80%,
which is where most settled nights land. Recorded so a later PREMIUM claim cannot be made without
disposing of it or of FD-3.
