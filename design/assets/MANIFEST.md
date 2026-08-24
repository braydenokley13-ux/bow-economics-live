# Asset Manifest — Module 1 Visual System

All assets are hand-authored SVG, self-contained (no external refs, no rasters), dark
palette per `../VISUAL_IDENTITY.md`. Sizes below are file-on-disk; all render crisply at
any scale via `viewBox` (no fixed-pixel dependency).

| File | Purpose | Surface | Size | Sizing guidance |
|---|---|---|---|---|
| `board-arena-backdrop.svg` | Ambient environmental backdrop — the Cap Room at night, arena floodlight through the window, faint stadium-bowl tiers and strategy-floor grid. Sits full-bleed behind data; never competes with foreground content. | `/board` (also usable behind `/teach`'s monitor wall at reduced opacity) | 4.1 KB | `viewBox 0 0 1920 1080`. Stretch/cover full-bleed; safe to scale down to any 16:9 container. |
| `roster-slot-frame.svg` | Empty roster-wall slot: mounting plate, docking well with corner brackets, slot-index badge, nameplate strip. The object a `contract-card-frame` docks into. | `/play` (Roster Wall), `/teach` (per-pair monitor tiles, scaled down) | 3.1 KB (post-edit) | `viewBox 0 0 420 560` (3:4 portrait). Recolor the `#4da2e8` bracket/dash stroke to `cap-safe`/`cap-tight`/`over-the-line` to show slot state; swap "POSITION SLOT" + "01" text per instance. |
| `contract-card-frame.svg` | Player contract card: photo-silhouette zone with stage-light glow, crest mount, position chip, name plate, salary big-number zone, swappable cap-fit strip along the bottom edge. Fictional teams only, no likenesses. | `/play` (Player Market + docked wall cards), `/board` (class gallery, enlarged) | 4.6 KB | `viewBox 0 0 380 520`. The bottom 14px strip (currently `cap-safe` green) is the only element meant to be recolored per state; all text is placeholder for the builder to bind to data. |
| `cap-meter-gauge.svg` | Horizontal salary-cap meter: recessed track, baked-in safe/tight/over-the-line zone tinting, threshold boundary markers at 70%/90%, tick marks every $10M, big-number "CAP REMAINING" readout, state legend. | `/play` (persistent top strip), `/teach` (per-pair mini view) | 4.4 KB | `viewBox 0 0 960 220`. The green fill bar (`x="38" width="507"`) is the only element the app redraws per live value — resize its width proportionally to spend/$100M; zone bands and ticks stay fixed. |
| `team-crests-set.svg` | Five fictional franchise crests — Ironworks (shield), Northstar (compass needle, not a star), Harbor (arch/wave), Summit (hex/peak), Vale (diamond/chevron) — simple, distinct silhouettes, no mascots. | `/play` (crest mount on cards/wall), `/teach`, `/board` (matchup badges in L3) | 4.2 KB | `viewBox 0 0 1020 200`, five 196px-wide cells. Crop a single crest via its `<g transform="translate(x,10)">` wrapper (x = 20, 216, 412, 608, 804) for standalone use. |
| `reveal-synthesis-backdrop.svg` | Peak-moment backdrop: converging spotlight rays to a central point, stage-floor glow, fine light-particle atmosphere, focus vignette. Swaps in only for the synchronized reveal and economics-synthesis beats. | `/board` | 4.4 KB | `viewBox 0 0 1920 1080`. Center of the ray convergence is at `(960, 494)` — keep the reveal number/headline vertically centered near that point. |
| `dead-cap-tear-overlay.svg` | The L2 "cut" moment: jagged torn-contract rip with a red wound glow, a "−10% DEAD CAP" readout tag, and a rotated "OUT" ink-stamp. Composites directly over `contract-card-frame` (verified: see render QA). | `/play` (on the cut card, transient), `/board` (reveal recap) | 2.5 KB | `viewBox 0 0 380 520` — same viewBox as `contract-card-frame.svg`, designed to overlay it at `(0,0)` with no repositioning. Fully transparent except the tear/stamp marks. |
| `turn-indicator-beacon.svg` | L3 head-to-head turn indicator: two team plates (active/idle states shown), a pulsing center "on the clock" beacon with directional pointer, shared draft-pool countdown readout. | `/play` (L3 shared-device draft), `/board` (matchup status) | 2.8 KB | `viewBox 0 0 700 160`. To flip whose turn it is, swap the `activeSide`/`idleSide` gradient assignment and mirror the pointer polygon; pool count text is the only live-bound field. |

## Cut / not attempted

No asset in the 6–10 range was cut. One deliberate mid-build correction: the Northstar
crest's icon was redrawn from a five-point star to a compass needle before finalizing —
a literal star silhouette risked being misread as the excluded XP/badge/star iconography
(D4), even inside a heraldic crest, so it was replaced rather than shipped and flagged.

## Validation performed

- Structural: all 8 files pass `xmllint --noout`; all declare `viewBox`; grepped for
  `http(s)://`/`<image>` — none found beyond the required `xmlns` URI (inert, no fetch).
- Visual: all 8 rendered via headless Chromium (Playwright) to PNG and eyeballed; the
  `contract-card-frame` + `dead-cap-tear-overlay` pair was composite-rendered stacked to
  confirm alignment reads correctly as one "cut" moment.
- Color: cap-state and chart-series palettes run through the dataviz skill's
  `validate_palette.js` against this system's actual dark surfaces — all PASS (lightness
  band, chroma floor, CVD separation, normal-vision floor, contrast). See
  `../VISUAL_IDENTITY.md` for the resulting tokens and their measured contrast ratios.
- Size: largest file is 4.6 KB — all 8 sit far under the 30 KB target and the 60 KB cap.
