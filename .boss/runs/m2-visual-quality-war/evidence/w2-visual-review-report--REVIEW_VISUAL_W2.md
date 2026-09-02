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
