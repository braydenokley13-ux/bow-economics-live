# m2-contrast-proof — Module 2 token ramp, computed

Run `m2-visual-quality-war` wave 2, Lane A. Produced as the evidence the Boss lead's Q1(a) ruling
requires: Module 2 retires gold as a UI accent and takes a violet ramp, so the new ramp has to be
proved legible rather than assumed legible.

**Method (OBSERVED, computed this session).** WCAG 2.1 relative-luminance contrast, sRGB, on every
pairing that `runtime/src/client/shared/m2.css` actually renders. Alpha tints are composited over the
surface they sit on before the ratio is taken (a pill's text is measured against its own tint over the
card, not against the card). Script: `scratch/boss/lane-a/{contrast.mjs,proof.mjs,cvd.mjs}`.
Floors applied: **4.5:1** for text below 18px (or below 14px bold), **3:1** for large text and for
non-text UI that carries meaning, **no floor** for pure hairlines.

NOT VERIFIED: no human has read this palette on a classroom Chromebook or a projector.

## 1. Repairs made to the tokens before shipping

Three pairings failed and were fixed in the tokens, not waived:

| token | style tile value | ratio at its worst background | shipped value | ratio now |
|---|---|---|---|---|
| `--m2-ink-caption` (13px and 12px captions, qualifiers, legend text, rail sublines) | `#62627a` | **3.04:1** on `--m2-panel-2` | `#82829a` | **4.80:1** |
| `--m2-red` (teacher NOT STARTED / STALLED pill text on its own tint) | `#ef4444` | **4.45:1** | `#f25c5c` | **5.04:1** |
| CTA gradient light end (white "LOCK IT IN" on it) | `#7a5cff` | 4.37:1 (passes AA-large at 19px/700, fails AA-normal) | `#7358ff` via `--m2-violet-cta` | **4.60:1** |

Two further placements were corrected rather than recoloured:

- `.m2-cta-caption` carries `HOUSE_RULES[0]` — the "there is no preview" honesty line. The tile set it
  at 13px caption ink. It ships at **14px `--m2-ink-body`** (11.54:1), discharging the H6 measurement
  ("`.fh-blind-note` >= 14px and passing contrast at that size"; today's product renders it at 11px in
  `rgb(115,123,140)`).
- `.m2-arena .stamp` was `rgba(255,255,255,0.2)` at 9px — roughly 1.6:1. It ships at 11px
  `--m2-ink-caption`.

## 2. The table (every pairing m2.css renders)

`ratio` is computed, not estimated. `floor` is the WCAG threshold that applies at that size/weight.

| use | foreground | background | size / weight | ratio | floor | verdict |
|---|---|---|---|---|---|---|
| `.m2-h1` headline | `#f4f4f8` | canvas `#08080f` | 44px / 600 | 18.20 | 3 | PASS |
| `.m2-hero-figure` (WHO CAME, price) | `#f4f4f8` | canvas | 84px / 700 | 18.20 | 3 | PASS |
| `.m2-figure` | `#f4f4f8` | panel `#101019` | 38px / 600 | 17.24 | 3 | PASS |
| `.m2-body` | `#c9c9d6` | canvas | 15px / 400 | 12.18 | 4.5 | PASS |
| `.m2-body` on a card | `#c9c9d6` | panel | 15px / 400 | 11.54 | 4.5 | PASS |
| `.m2-cta-caption` = `HOUSE_RULES[0]` | `#c9c9d6` | canvas | 14px / 400 | 12.18 | 4.5 | PASS |
| `.m2-helper` = `renewalRuleFor` | `#c9c9d6` | panel | 14px / 400 | 11.54 | 4.5 | PASS |
| `.m2-books-line` (two books do not add up) | `#c9c9d6` | panel-2 `#16161f` | 14px / 400 | 10.96 | 4.5 | PASS |
| `.m2-label` eyebrow | `#8a8a9c` | panel | 12px / 600 | 5.58 | 4.5 | PASS |
| `.m2-label` eyebrow | `#8a8a9c` | canvas | 12px / 600 | 5.89 | 4.5 | PASS |
| `.m2-label` eyebrow | `#8a8a9c` | panel-2 | 12px / 600 | 5.30 | 4.5 | PASS |
| `.m2-caption` / `.m2-qualifier` | `#82829a` | panel | 13px / 400 | 5.05 | 4.5 | PASS |
| `.m2-caption` | `#82829a` | canvas | 13px / 400 | 5.33 | 4.5 | PASS |
| `.m2-caption` (smallest use) | `#82829a` | panel-2 | 12px / 400 | 4.80 | 4.5 | PASS |
| `.m2-nav-item` label, hovered | `#82829a` | hover `#1a1a26` | 13.5px / 500 | 4.60 | 4.5 | PASS |
| `.m2-brand-word span` (rail subline) | `#82829a` | rail `#0b0b14` | 10px / 600 | 5.23 | 4.5 | PASS |
| `.m2-footbar` text (teacher, W3) | `#82829a` | `#0b0b13` | 12px / 400 | 5.23 | 4.5 | PASS |
| `.m2-breadcrumb` | `#9d86ff` | canvas | 13px / 600 | 6.93 | 4.5 | PASS |
| `.m2-figure.is-violet` | `#9d86ff` | panel | 38px / 600 | 6.56 | 3 | PASS |
| `.m2-chain-row.is-total` CASH | `#22c55e` | panel | 30px / 600 | 8.30 | 3 | PASS |
| `.m2-book.is-cash b` CASH | `#22c55e` | panel | 17px / 600 | 8.30 | 4.5 | PASS |
| `.m2-desk-flag` (teacher watch-for) | `#f2b134` | panel | 11.5px / 400 | 10.01 | 4.5 | PASS |
| `.m2-pill.is-locked` text | `#22c55e` | money tint over panel `#122822` | 12px / 600 | 6.81 | 4.5 | PASS |
| `.m2-pill.is-adjusting` text | `#f2b134` | amber tint over panel `#2d251d` | 12px / 600 | 7.97 | 4.5 | PASS |
| `.m2-pill.is-attention` text | `#f25c5c` | red tint over panel `#2d1a22` | 12px / 600 | 5.04 | 4.5 | PASS |
| `.m2-pill.is-violet` text | `#9d86ff` | violet tint over panel `#1f1b39` | 12px / 600 | 5.72 | 4.5 | PASS |
| `.m2-pill` neutral text | `#c9c9d6` | panel-2 | 12px / 600 | 10.96 | 4.5 | PASS |
| `.m2-cta` label, dark end of gradient | `#ffffff` | `#5b3df0` | 19px / 700 | 6.23 | 4.5 | PASS |
| `.m2-cta` label, light end of gradient | `#ffffff` | `#7358ff` | 19px / 700 | 4.60 | 4.5 | PASS |
| `.m2-badge` glyph | `#9d86ff` | badge `#231a4a` | 16px stroke | 5.53 | 3 | PASS |
| `.m2-crest` initials (club wordmark) | `#9d86ff` | badge `#231a4a` | 14px / 700 | 5.53 | 4.5 | PASS |
| `.m2-bar > i` violet fill | `#7a5cff` | track over panel `#282830` | non-text | 3.34 | 3 | PASS |
| `.m2-bar.is-money > i` | `#22c55e` | track over panel | non-text | 6.42 | 3 | PASS |
| `.m2-gauge .value` arc | `#7a5cff` | track over panel | non-text | 3.34 | 3 | PASS |
| `.m2-chart .pt` mark | `#9d86ff` | panel | non-text | 6.56 | 3 | PASS |
| `.m2-legend-item i` swatch | `#7a5cff` | arena panel `#07070d` | non-text | 4.59 | 3 | PASS |
| `.m2-range` thumb border | `#d8cfff` | canvas | non-text | 13.58 | 3 | PASS |
| `.m2-pip.is-now` | `#7a5cff` | rail `#0b0b14` | non-text | 4.48 | 3 | PASS |
| `.m2-chart .axis` hairline | `rgba(255,255,255,.12)` | panel | hairline | 1.39 | — | n/a |

**0 failures at the applied floors.**

A consequence recorded as a rule, not a coincidence: **`--m2-violet` (`#7a5cff`) is a fill and stroke
token only.** It is 4.33:1 on the panel — fine for a bar, a slider track or a pip, short of the text
floor. Violet TEXT always uses `--m2-violet-bright` (`#9d86ff`). Do not set type in `--m2-violet`.

## 3. RENEWALS is never green- or red-coded — and this is a colour rule, not only a copy rule

Binding (ECON R-3 / E10, contract A3, DIRECTION non-negotiable 3):

- `--m2-money` green marks **positive CASH only**. It appears on `.m2-chain-row.is-total`,
  `.m2-book.is-cash`, `.m2-bar.is-money`, `.m2-badge.is-money` and the teacher LOCKED IN pill.
- **RENEWALS never takes `--m2-money`, `--m2-red` or any semantic hue.** In `m2.css` it renders in
  `--m2-ink` in `--m2-font-alt-num` at weight 500 (`.m2-book.is-renewals`, `.m2-renewals`), i.e. a
  different unit shape and a different type slot from CASH, at equal figure size. The two books are
  visibly two instruments so that nobody averages or sums them.
- No renewals visual encodes a monotone "price up -> renewals down" (FL-V11): no arrow tied to the
  dial, no red/green split on the slider track. `m2.css` defines no such affordance and none may be
  added; the renewals rule moves per card and is false to generalise (R-10).
- Amber and red exist **only** on teacher attention pills. They never mark a student's outcome. There
  is no "bad night" colour in this system, because the model has no bad night — it has trade-offs.

## 4. Colour-vision deficiency — the finding that makes the glyph rule load-bearing

Machado (2009) severity-1.0 simulation of the three teacher-pill hues plus the violet accent, with
CIE76 dE between the simulated colours (OBSERVED, computed):

| pair | protan dE | deutan dE | tritan dE |
|---|---|---|---|
| LOCKED IN green vs STALLED red | 38.0 | **4.7** | 129.8 |
| LOCKED IN green vs ADJUSTING amber | 21.0 | 34.0 | 90.6 |
| ADJUSTING amber vs STALLED red | 56.5 | 34.6 | 42.4 |
| violet accent vs LOCKED IN green | 109.6 | 94.0 | 47.8 |

**Under deuteranopia the LOCKED IN green and the STALLED red are 4.7 dE apart — effectively the same
colour** (`#b5a766` vs `#a89b58`). A teacher with the most common deficiency, glancing at a monitor
wall of 12 desks, cannot tell "locked in" from "stalled" by colour. Under protanopia green and amber
are 21.0 dE apart, which is weak.

The mitigation is structural and already enforced in the code:

- `pill()` in `runtime/src/client/shared/m2ui.ts` **requires** a `glyph` and a `label`; there is no
  code path that produces a colour-only pill.
- `.m2-pill` carries a border and a tint as well as its text colour, so the state has shape, glyph and
  word before it has hue.
- The night-progress pips are labelled "NIGHT n OF 5" in text; the pip row is decoration on top of a
  written state, never the state itself.
- Chart marks are position-encoded and individually labelled with their night's card; no series is
  distinguished by colour alone.

Anyone adding a semantic colour to this layer inherits the same obligation: glyph, label or position
first, colour second.

## 5. What this proof does not cover

- Rendered contrast on a real Chromebook panel or a real classroom projector (NOT VERIFIED — the
  ratios are computed from sRGB values, not measured off glass).
- The drawn arena's interior (`shared/arena.ts`). It is a picture with a text legend beside it, not a
  text surface; the legend is measured above. Its own light levels are judged by eye in the wave-2
  render evidence, not by a contrast floor.
- `/board` at projector distance and `/teach` at 12-15 desks — those frames land in wave 3 and need
  their own measurement pass.
