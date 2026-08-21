# Visual Identity — Module 1, "The Cap"

## The world: The Cap Room

The product lives in one fictional place: **the Cap Room** — a front-office war room after
the building has emptied out. The overhead lights are off. The only light comes from the
arena floodlights bleeding through a wall of windows and the cold glow of the roster wall
itself. This is where a GM builds a team alone, at night, with the season on the line. It is
not a dashboard, not a worksheet, not a locker room. It is a place with weight — you can
picture the desk, the window, the wall of slots waiting to be filled.

Every surface is a different vantage inside the same room: **/play** is the GM's own desk,
head-down, building. **/teach** is the room's light switch and PA system — the person who
can see every desk at once. **/board** is the window itself, thrown open to the whole room:
the shared wall everyone looks up at when something just happened.

This is a broadcast-production register, not a toy register: score-bug precision, franchise-
mode card design, control-room chrome. No mascots, no confetti, no stars/badges/XP (D4).
Money, names, and consequences read as real stakes rendered with real craft.

## Color system

One committed dark palette — this is a broadcast control room at night, not a light-mode
app. Every pairing below is validated (contrast + CVD where it encodes data; see
`design/assets/` for the rendered proof). On a washed-out projector, saturation is the first
casualty — **so semantic state is never color-only**: cap states carry an icon/label/position
(left→right zones), never a bare color chip.

**Surfaces**
| Token | Hex | Use |
|---|---|---|
| `surface-void` | `#0a0d12` | Page / window-glass black |
| `surface-panel` | `#131822` | Primary panel, control-room wall |
| `surface-card` | `#1b212c` | Card face, elevated panel |
| `surface-inset` | `#0d1119` | Recessed well — meter track, input |
| `surface-elevated` | `#232a37` | Hover / active glass |

**Ink**
| Token | Hex | Use |
|---|---|---|
| `ink-primary` | `#f6f4ec` | Headlines, primary copy (17.7:1 on void) |
| `ink-secondary` | `#b9bfcc` | Supporting copy (9.6:1 on panel) |
| `ink-muted` | `#737b8c` | Labels/eyebrows at ≥14px only (4.2:1) |

**Brand accents**
| Token | Hex | Use |
|---|---|---|
| `accent-gold` | `#f4b942` | Money, big numbers, primary CTA, floodlight motif |
| `accent-blue` | `#4da2e8` | Data/info glass, hidden-rival "?" bar, docking brackets |
| `accent-violet` | `#8b7cf0` | Turn indicator, war-room highlight (L3) |

**Semantic cap states** — a fixed three-zone traffic-light ramp, validated together
(worst adjacent CVD ΔE 8.5, normal-vision ΔE 17.4 on `surface-inset`):
| Token | Hex | Meaning |
|---|---|---|
| `cap-safe` | `#12946a` | Comfortably under the line |
| `cap-tight` | `#bd8a12` | Inside the last ~20% of room |
| `over-the-line` | `#d8394a` | Breach — always paired with an icon + label |

**Chart series** (class-reveal charts; validated all-pairs on `surface-inset`, ΔE 13.4–19.6):
`series-1 #3987e5` (e.g. Safe / Cap condition) · `series-2 #c98500` (Risky / No-Cap) ·
`series-3 #d9598f` (a third cohort, when one is needed). Color encodes **one** dimension
per chart — a second dimension (Big-Market/Small-Market) rides a crest badge or marker
shape, never a second hue, so no chart ever needs more than three series colors.

## Typography

Three Google Fonts, each doing one job. All ship a system fallback stack so a slow
Chromebook never blocks on a webfont.

- **Display — Bebas Neue**, `'Bebas Neue', 'Anton', Impact, sans-serif`. All-caps only.
  Section headers, position-slot labels, team names, the synthesis line on /board. This is
  the broadcast-lower-third voice — tall, condensed, confident.
- **UI workhorse — Inter**, `Inter, 'Segoe UI', system-ui, sans-serif`. Body copy, buttons,
  teacher control-room UI, card metadata. Chosen for x-height and legibility at small sizes
  on a 720p Chromebook panel.
- **Big-number — Space Grotesk**, `'Space Grotesk', 'IBM Plex Mono', monospace-adjacent,
  sans-serif`, weight 700, `font-variant-numeric: tabular-nums`. Every dollar figure — cap
  meter readout, salary tags, the class-scatter axis — uses this face so digits line up and
  *tick* convincingly when they change, like a scoreboard odometer, not a spreadsheet cell.
  Reserve tabular figures for anything that must align in a column; big standalone numbers
  (a $38M readout) still use Space Grotesk's proportional default at large sizes.

## Spatial metaphor per surface

**`/play` — the desk.** Portrait-biased, one GM's workspace. Top: a horizontal **Cap Meter**
strip (the gauge asset), always visible, never scrolled away. Center-left: the **Roster
Wall** — five `roster-slot-frame` plates in a single column or 2+3 grid, each holding a
`contract-card-frame` once filled. Center-right / below on narrower viewports: the **Player
Market**, a scrollable grid of contract cards, greyed and inert once unaffordable. A
persistent **Foregone Panel** rail — thin, always in peripheral vision, never a modal —
lists what just moved out of reach. Nothing here is a "screen"; it is a desk with a wall
you keep rearranging.

**`/teach` — the control room.** Landscape, dense, a director's monitor wall: one card per
pair, small multiples of their live `roster-slot-frame` state, a room-wide aggregate cap
histogram along the top, and a single always-visible **reveal trigger** control (the manual
fallback D11 rider d requires) — large, unmistakable, never buried in a menu. This surface
is allowed more information density than `/play` or `/board`; it is built for a standing
adult scanning fast, not a seated student.

**`/board` — the window thrown open.** 16:9, built for a dim classroom and a washed-out
projector: max type size, max contrast, minimum simultaneous elements. The
`board-arena-backdrop` sits full-bleed behind everything, subtle enough that data always
wins the eye. Layout is center-weighted with generous negative space — one chart, one
number, or one reveal state at a time, never a dashboard grid. The `reveal-synthesis-
backdrop` swaps in only for the two peak beats (synchronized reveal, economics synthesis)
so the room feels the shift from "building" to "this just happened."

## Motion vocabulary

Every motion answers "what did the world just do," never "what did the UI just do."
Default easing `cubic-bezier(0.22, 1, 0.36, 1)` (a confident decelerate) unless noted.
**Reduced-motion rule:** when `prefers-reduced-motion: reduce`, every entry below collapses
to a single opacity/position cross-fade ≤120ms — the state change still lands, nothing
slides, scales, or bounces.

- **Arrival** (card lands on the Roster Wall): 260ms, card scales 1.06→1.00 with a
  120ms-earlier meter-drop start so the two feel causally linked, not sequential. A single
  `accent-blue` docking-bracket flash (2px stroke, 180ms) on catch.
- **Commitment** (lock-in, bid submit): 200ms firm settle, no bounce — commitment reads as
  *final*, not playful. A soft `surface-elevated` flash across the locked element only.
- **Constraint-hit** (tried to place a card you can't afford; over-the-line): 180ms, a
  small 4px horizontal shake (2 cycles) plus an `over-the-line` edge flash — physical
  refusal, not an error toast.
- **Reveal** (L2 synchronized bid outcome, L3 class chart populating): held suspense, not
  speed. A 400–600ms anticipatory pause (teacher-gated), then a 500ms unveil — dot plots
  populate point-by-point at 40ms stagger per mark, never all at once.
- **Synthesis** (the "what economics did we just use" close): the slowest beat in the
  system — 700ms backdrop cross-fade to `reveal-synthesis-backdrop`, headline types in at
  a measured pace (not per-letter tickertape; a single 450ms fade-and-rise). This is the
  one moment allowed to feel ceremonial.

Never: easing that overshoots and settles (bouncy spring) on anything financial — money
moving should feel weighty, not springy. Never a spinner; every wait has a named state
("sealing your offer…", "waiting on the room…").

## Chart & reveal style (class galleries, scatter, dot plots)

Built to the dataviz method, not default chart-library output:
- **Surface**: charts render directly on `surface-panel` or the board backdrop, never a
  separate white card — no chart ever looks like it was pasted from a different app.
- **Axes**: hairline `rgba(255,255,255,0.10)`, no tick more than needed (5 max), labels in
  Inter 12–13px `ink-muted`, never a bounding box/frame around the plot.
- **Marks**: dots ≥10px on `/board` (crowd-legible), 2px `surface-panel` ring around every
  mark so overlapping points stay separable without a filter blur. Bars: 4px rounded
  data-end, 2px gap between adjacent bars.
- **Color**: one dimension per chart per the palette above; a second dimension (e.g.
  Big/Small-Market) rides a small crest-badge or triangle/circle marker shape, not a
  second hue.
- **Annotation callouts**: broadcast style — a short leader line (1.5px, `ink-secondary`)
  from mark to a small dark chip (`surface-elevated`, 1px hairline border) holding one line
  of Inter bold + one Space Grotesk number. Never more than 2–3 callouts live at once;
  everything else is discoverable on hover/tap, not pre-labeled.
- **The class-reveal moment** always opens on a single **headline number or line** (Space
  Grotesk / Bebas Neue) before the chart populates — the room reads the takeaway, then
  watches the evidence land point by point.

## DO / DON'T

**DO** — a contract card with a real photo-silhouette zone, stage-light glow, and a
salary tag that looks like it belongs on a scoreboard. **DON'T** — a bordered `<div>` with
a name, a price, and a "Buy" button.

**DO** — a cap meter with baked-in safe/tight/over-the-line zones and a docked big-number
readout. **DON'T** — a generic progress bar in one flat color with a percentage.

**DO** — cutting a player tears the contract and visibly returns less than it cost.
**DON'T** — a confirm dialog ("Remove this player? Yes/No").

**DO** — the Foregone Panel updates live, ambient, in peripheral vision.
**DON'T** — a "Results" screen shown once at the end.

**DO** — team crests as heraldic marks (shield, compass, hexagon) with fictional initials.
**DON'T** — a star badge, a trophy, an XP bar, or any completion/reward iconography (D4) —
even inside a crest, if a mark could be mistaken for a reward signifier, redraw it (this is
why the Northstar crest is a compass needle, not a five-point star).

**DO** — one dramatic reveal backdrop reserved for the two peak beats of each lesson.
**DON'T** — confetti, particle bursts, or a "Congratulations!" screen.

**DO** — dense, monitor-wall information on `/teach`; sparse, one-idea-at-a-time on
`/board`. **DON'T** — the same layout density on both surfaces.
