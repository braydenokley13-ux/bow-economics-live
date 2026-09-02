# AUDIT — legacy `theme.css` class collisions on the Module 2 `/play` renderer

Role `builder-r1`, assignment `w2-repair-1-theme-leak`, Boss run `m2-visual-quality-war` wave 2.
Method: (1) static — every class token the rebuilt Full House renderer emits
(`play/main.ts` lines 1855–3060 plus `shared/m2ui.ts`) cross-referenced against every rule
in `runtime/src/client/shared/theme.css` (parsed, comments stripped); (2) runtime — every
element in `#gameBody` on 33 `/play` states of a real 4-desk class, computed styles read
from the live DOM.

## 1. Coverage

- Class tokens emitted by the M2 renderer (static): **133**
- Distinct class tokens actually seen in `#gameBody` at runtime: **119** (50 still `fh-*`)
- `theme.css` rules whose selector can match one of them: **68** (all single-selector, no comma groups)
- `theme.css` **id** rules that can match an M2-emitted id: 2, both gated on `body.fh-compact-play`,
  which `renderFullHouse` removes (`play/main.ts:3043`) — cannot apply. No id leak.
- Non-`fh-*` class collisions (e.g. `.numeric`, `.pt`, `.axis`, `.on`, `.is-active`): **none**
  outside the `.fh-*` compound selectors listed below.

## 2. OBSERVED leaks (computed style, before the fix, 33 states / 11,137 elements)

| element class | leaked properties OBSERVED in the browser (before) |
|---|---|
| `fh-desk-name` | font-family = Bebas Neue |
| `fh-repeat-split` | borderTopColor = rgba(244, 185, 66, 0.32)<br>borderRightColor = rgba(244, 185, 66, 0.32)<br>borderBottomColor = rgba(244, 185, 66, 0.32) |
| `fh-sellout m2-display` | borderTopColor = rgb(244, 185, 66)<br>borderRightColor = rgb(244, 185, 66)<br>borderBottomColor = rgb(244, 185, 66)<br>borderLeftColor = rgb(244, 185, 66)<br>backgroundImage = linear-gradient(rgba(244, 185, 66, 0.16), rgba(244, 185, 66, 0.04)) |
| `fh-sellout-title` | font-family = Bebas Neue |
| `m2-h1 fh-result-head` | font-family = Bebas Neue |
| `m2-label fh-card-night` | font-family = Bebas Neue |
| `m2-result fh-result is-sellout soldout is-flash` | borderTopColor = rgba(244, 185, 66, 0.4)<br>borderRightColor = rgba(244, 185, 66, 0.4)<br>borderBottomColor = rgba(244, 185, 66, 0.4)<br>borderLeftColor = rgba(244, 185, 66, 0.4) |
| `m2-result fh-result is-sellout soldout` | borderTopColor = rgba(244, 185, 66, 0.4)<br>borderRightColor = rgba(244, 185, 66, 0.4)<br>borderBottomColor = rgba(244, 185, 66, 0.4)<br>borderLeftColor = rgba(244, 185, 66, 0.4) |

Every one of the 33 audited states carried at least one violation. The QA report named
`.fh-sellout`, `.fh-sellout-title`, `.fh-result.soldout`, `.fh-result-head`, `.fh-desk-name`
and `.fh-card`; this audit confirms all except `.fh-card` and adds two the QA did not find:
`.fh-card-night` (Bebas on the night eyebrow, every pre-lock state) and `.fh-repeat-split`
(gold border on the COUNTERFACTUAL "Where that change came from" panel).

Corrections to the QA report, from computed style:
- `.fh-sellout-title { color: var(--accent-gold) }` did **not** render gold — the renderer sets
  `color` inline. The leak on that element is `font-family` (Bebas) only.
- `.fh-card { border: 1px solid rgba(244,185,66,0.28) }` did **not** leak: `html[data-module="m2"] .m2-card`
  (specificity 0,2,0, later file) wins the `border` shorthand. Not a defect.

## 3. Leaks that are not gold and not Bebas (found by the static pass, fixed by the same scoping)

- `.price-dial-input` (theme.css:570) leaked `border`, `border-radius`, `box-shadow: inset …`
  and `outline` onto the M2 violet price dial — `html[data-module="m2"] .m2-range` declares
  none of those four, so the legacy inset-well chrome was drawn under the new track.
- `.fh-result` (theme.css:1755) leaked `background`, `border`, `border-radius`, `padding`
  and `margin-top` onto `#fhResult` — `html[data-module="m2"] .m2-result` declares only
  `display`/`flex-direction`/`gap`. Removing it recovers ~48px of vertical room on every
  settled-night state (see the before/after screenshots).
- `.fh-next`, `.fh-locked-recap`, `.fh-blind-note`, `.fh-receipt`, `.fh-bowl-*`,
  `.fh-renewal-rule`, `.fh-spend-verdict`, `.fh-resale`, `.fh-peaks*`, `.fh-replay`,
  `.fh-dial*` — same pattern, smaller amplitude.

## 4. Full rule table (class → theme.css line → selector → leak class → declarations)

| M2-emitted class | theme.css line | selector | leak class | declarations (truncated) |
|---|---|---|---|---|
| `price-dial-input` | 570 | `.price-dial-input` | legacy chrome | `width: 100%; -webkit-appearance: none; appearance: none; height: 12px; border-radius: 7px; background: linear-gradient(180deg, #080d14, #141c27); bord` |
| `fh-dial` | 585 | `.fh-dial` | legacy chrome | `position: relative; padding-bottom: 24px;` |
| `fh-dial price-dial-input` | 591 | `.fh-dial .price-dial-input` | legacy chrome | `margin: 0; display: block;` |
| `fh-dial-tick-label` | 612 | `.fh-dial-tick-label` | GOLD  | `margin-top: 3px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; white-space: nowrap; color: var(--accent-gold); opacity: 0.85;` |
| `price-dial-input` | 621 | `.price-dial-input::-webkit-slider-thumb` | GOLD  | `-webkit-appearance: none; appearance: none; width: 30px; height: 30px; border-radius: 50%; background: var(--surface-elevated); border: 3px solid var(` |
| `price-dial-input` | 633 | `.price-dial-input:active::-webkit-slider-thumb` | legacy chrome | `cursor: grabbing; transform: scale(1.1);` |
| `price-dial-input` | 637 | `.price-dial-input::-moz-range-thumb` | GOLD  | `width: 30px; height: 30px; border-radius: 50%; background: var(--surface-elevated); border: 3px solid var(--accent-gold); cursor: grab;` |
| `fh-desk-name` | 1463 | `.fh-desk-name` | BEBAS  | `font-family: var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; font-size: 14px; color: var(--ink-primary);` |
| `fh-desk-building` | 1470 | `.fh-desk-building` | legacy chrome | `margin-left: auto; font-size: 11px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em;` |
| `fh-card` | 1515 | `.fh-card` | GOLD  | `background: linear-gradient(180deg, var(--surface-card), var(--surface-panel)); border: 1px solid rgba(244, 185, 66, 0.28); border-radius: 14px; paddi` |
| `fh-card` | 1522 | `.fh-card.shock` | legacy chrome | `border-color: rgba(216, 57, 74, 0.55);` |
| `fh-card` | 1525 | `.fh-card.repeat` | legacy chrome | `border-color: rgba(139, 124, 240, 0.55);` |
| `fh-card-night` | 1533 | `.fh-card-night` | GOLD BEBAS  | `font-family: var(--font-display); font-size: 17px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-gold);` |
| `on` | 1581 | `.fh-dot.on` | GOLD  | `background: var(--accent-gold);` |
| `fh-next` | 1622 | `.fh-next` | legacy chrome | `display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; margin-top: 6px; padding: 8px 10px; border: 1px dashed rgba(255, 255, 255, 0.14); bor` |
| `fh-price-readout` | 1657 | `.fh-price-readout` | GOLD  | `font-size: 38px; text-align: center; color: var(--accent-gold); margin: 6px 0 2px;` |
| `fh-blind-note` | 1682 | `.fh-blind-note` | legacy chrome | `margin-top: 8px; font-size: 11px; color: var(--ink-muted); text-align: center;` |
| `fh-locked-recap` | 1688 | `.fh-locked-recap` | legacy chrome | `display: flex; gap: 8px; align-items: baseline; justify-content: center; margin-top: 10px; font-size: 13px; color: var(--ink-secondary);` |
| `fh-locked-recap` | 1697 | `.fh-locked-recap .numeric` | GOLD  | `font-size: 20px; color: var(--accent-gold);` |
| `fh-result` | 1755 | `.fh-result` | legacy chrome | `background: var(--surface-card); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; padding: 12px; margin-top: 12px;` |
| `fh-result-head` | 1762 | `.fh-result-head` | BEBAS  | `display: flex; justify-content: space-between; font-family: var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; font-size: 13px; c` |
| `fh-resale` | 1875 | `.fh-resale` | legacy chrome | `margin-top: 8px; padding-top: 8px; border-top: 1px dotted rgba(255, 255, 255, 0.12); font-size: 12px; line-height: 1.45; color: var(--ink-muted);` |
| `fh-spend-verdict` | 1886 | `.fh-spend-verdict` | legacy chrome | `margin-top: 8px; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 13px; line-height: 1.45; color: var(--` |
| `fh-spend-verdict` | 1896 | `.fh-spend-verdict.waste` | legacy chrome | `border-color: rgba(255, 154, 164, 0.45); color: #ffb3ba; background: rgba(255, 154, 164, 0.07);` |
| `fh-spend-verdict` | 1901 | `.fh-spend-verdict.part` | GOLD  | `border-color: rgba(244, 185, 66, 0.4); color: var(--ink-primary);` |
| `fh-spend-verdict` | 1905 | `.fh-spend-verdict.paid` | legacy chrome | `border-color: rgba(18, 148, 106, 0.45); color: var(--ink-primary);` |
| `fh-peaks` | 1922 | `.fh-peaks` | GOLD  | `background: var(--surface-card); border: 1px solid rgba(244, 185, 66, 0.35); border-radius: 12px; padding: 12px; margin-top: 12px;` |
| `fh-peaks-row` | 1929 | `.fh-peaks-row` | legacy chrome | `display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-secondary); padding: 3px 0;` |
| `fh-peaks-row` | 1936 | `.fh-peaks-row .numeric` | legacy chrome | `font-size: 18px; color: var(--ink-primary);` |
| `fh-peaks-row` | 1940 | `.fh-peaks-row .numeric.hot` | GOLD  | `color: var(--accent-gold);` |
| `fh-peaks-note` | 1943 | `.fh-peaks-note` | legacy chrome | `margin-top: 8px; font-size: 13px; line-height: 1.45; color: var(--ink-primary);` |
| `fh-repeat` | 1950 | `.fh-repeat` | legacy chrome | `background: var(--surface-card); border: 1px solid rgba(139, 124, 240, 0.4); border-radius: 12px; padding: 12px;` |
| `fh-repeat-split` | 1987 | `.fh-repeat-split` | GOLD  | `margin-top: 10px; padding: 9px 11px; border-radius: 10px; border: 1px solid rgba(244, 185, 66, 0.32); background: rgba(244, 185, 66, 0.06); display: f` |
| `fh-replay` | 2010 | `.fh-replay` | legacy chrome | `background: var(--surface-card); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px;` |
| `fh-renewal-rule` | 2109 | `.fh-renewal-rule` | legacy chrome | `margin-top: 8px; padding: 8px 10px; border-left: 3px solid var(--accent-blue); background: rgba(77, 162, 232, 0.07); border-radius: 0 8px 8px 0; font-` |
| `fh-receipt` | 2121 | `.fh-receipt` | GOLD  | `margin: 6px 0 0; font-size: 12.5px; line-height: 1.4; color: var(--accent-gold);` |
| `fh-bowl-plate` | 2154 | `.fh-bowl-plate` | legacy chrome | `display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: "state main cost" "state note note"; align-items: center; gap: 2px 12px; wid` |
| `fh-bowl-plate` | 2173 | `.fh-bowl-plate:hover` | legacy chrome | `border-color: rgba(255, 255, 255, 0.28);` |
| `fh-bowl-plate on` | 2176 | `.fh-bowl-plate.on` | GOLD  | `border-color: var(--accent-gold); background: rgba(244, 185, 66, 0.09); color: var(--ink-primary);` |
| `fh-bowl-state` | 2181 | `.fh-bowl-state` | BEBAS  | `grid-area: state; font-family: var(--font-display); letter-spacing: 0.1em; font-size: 15px; padding: 5px 9px; border-radius: 6px; border: 1px solid cu` |
| `fh-bowl-plate fh-bowl-state on` | 2191 | `.fh-bowl-plate.on .fh-bowl-state` | GOLD  | `color: var(--accent-gold);` |
| `fh-bowl-main` | 2194 | `.fh-bowl-main` | legacy chrome | `grid-area: main; font-size: 13.5px; color: var(--ink-primary);` |
| `fh-bowl-cost` | 2199 | `.fh-bowl-cost` | GOLD  | `grid-area: cost; font-size: 17px; color: var(--accent-gold);` |
| `fh-bowl-note` | 2204 | `.fh-bowl-note` | legacy chrome | `grid-area: note; font-size: 11.5px; color: var(--ink-muted);` |
| `fh-sellout` | 2211 | `.fh-sellout` | GOLD  | `margin: 10px 0; padding: 12px; border-radius: 10px; border: 1px solid var(--accent-gold); background: linear-gradient(180deg, rgba(244, 185, 66, 0.16)` |
| `fh-sellout-title` | 2219 | `.fh-sellout-title` | GOLD BEBAS  | `font-family: var(--font-display); font-size: 40px; line-height: 1; letter-spacing: 0.06em; color: var(--accent-gold);` |
| `fh-sellout-sub` | 2226 | `.fh-sellout-sub` | legacy chrome | `margin-top: 4px; font-size: 12.5px; color: var(--ink-secondary);` |
| `fh-result` | 2248 | `.fh-result.soldout` | GOLD  | `border-color: rgba(244, 185, 66, 0.4);` |
| `fh-card` | 2475 | `body.fh-compact-play .fh-card` | legacy chrome | `padding: 9px 12px;` |
| `fh-next` | 2500 | `body.fh-compact-play .fh-next` | legacy chrome | `padding: 5px 8px; font-size: 12px;` |
| `fh-price-readout` | 2507 | `body.fh-compact-play .fh-price-readout` | legacy chrome | `font-size: 28px; margin: 0; line-height: 1.1;` |
| `fh-renewal-rule` | 2512 | `body.fh-compact-play .fh-renewal-rule` | legacy chrome | `margin-top: 6px; padding: 6px 9px; font-size: 12px; line-height: 1.35;` |
| `fh-next` | 2518 | `body.fh-compact-play .fh-next` | legacy chrome | `margin-top: 4px;` |
| `fh-blind-note` | 2524 | `body.fh-compact-play .fh-blind-note` | legacy chrome | `margin-top: 6px;` |
| `fh-result` | 2538 | `body.fh-compact-play .fh-result` | legacy chrome | `padding: 8px 10px; margin-top: 0;` |
| `fh-result-head` | 2539 | `body.fh-compact-play .fh-result-head` | legacy chrome | `font-size: 12.5px;` |
| `fh-sellout` | 2549 | `body.hl-has-lockbar .fh-sellout` | legacy chrome | `display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 5px 9px; margin-top: 6px;` |
| `fh-sellout-title` | 2553 | `body.hl-has-lockbar .fh-sellout-title` | legacy chrome | `font-size: 13px; margin: 0;` |
| `fh-sellout-sub` | 2554 | `body.hl-has-lockbar .fh-sellout-sub` | legacy chrome | `font-size: 11.5px; margin: 0;` |
| `fh-bowl-plate` | 2561 | `body.fh-compact-play .fh-bowl-plate` | legacy chrome | `margin-top: 8px; padding: 7px 10px;` |
| `fh-bowl-note` | 2565 | `body.fh-compact-play .fh-bowl-note` | legacy chrome | `font-size: 11px;` |
| `fh-receipt` | 2568 | `body.fh-compact-play .fh-receipt` | legacy chrome | `font-size: 12px; line-height: 1.35;` |
| `fh-price-readout` | 2738 | `.hl-decide > .hl-col-decide .fh-price-readout` | legacy chrome | `font-size: 22px; margin: 1px 0;` |
| `fh-dial` | 2739 | `.hl-decide > .hl-col-decide .fh-dial` | legacy chrome | `margin-top: 2px;` |
| `fh-blind-note` | 2747 | `.hl-decide > .hl-col-decide .fh-blind-note` | legacy chrome | `margin-top: 6px; font-size: 11px;` |
| `fh-result` | 2758 | `.hl-decide > .hl-col-context .fh-result` | legacy chrome | `padding: 7px 9px;` |
| `fh-result-head` | 2759 | `.hl-decide > .hl-col-context .fh-result-head` | legacy chrome | `font-size: 12px;` |
| `fh-sellout` | 2771 | `.hl-decide > .hl-col-context .fh-sellout` | legacy chrome | `padding: 5px 9px; margin-top: 5px;` |

## 5. Fix

`theme.css`: all 68 rules prefixed `html:not([data-module="m2"])`, plus a file-header comment
recording the invariant. Nothing else in the file changed (proved: stripping the prefix from
the new file yields the old file byte-for-byte).

`m2.css`: one added declaration, `font-family: var(--m2-font)` on the existing
`html[data-module="m2"] #gameHeader` rule. `#gameHeader` carries the shared `.eyebrow` class
(theme.css:92, `font-family: var(--font-display)`) and sits OUTSIDE `#gameBody`, so the
theme.css scoping does not reach it; it was still rendering the seat line in Bebas.

`play/main.ts`: **not changed.** No renderer edit was needed.

## 6. Why `/board` and `/teach` cannot be affected

- `data-module` is set only in `play/main.ts:207`. `/board` and `/teach` never set it, so
  `html:not([data-module="m2"])` matches on both — the rules still apply exactly as before.
- Stronger: **none of the 68 scoped selectors targets a class those surfaces use.**
  `board/main.ts` uses a disjoint `fh-board-* / fh-slate-* / fh-market-* / fh-books-* /
  fh-cf-* / fh-peaks-board / fh-synth* / fh-play-strip*` family, styled in an inline
  `<style>` in `board/index.html`, not in the scoped rules. `teach/main.ts` uses one
  `fh-*` token, `fh-play`, which has no rule here.
- The build output confirms it: after rebuilding the scratch copy, `diff -rq` of the whole
  `dist/` against the pristine `dist/` reported **exactly one differing file**, `shared/theme.css`
  (and later `shared/m2.css`). No board/teach JS or HTML byte changed.
- The alternative — resetting each leaked property inside `m2.css` — was rejected: it is
  property-by-property, it leaves the legacy rules live so any new leaked property returns,
  and it needs a reset for each of the ~40 declarations above.
