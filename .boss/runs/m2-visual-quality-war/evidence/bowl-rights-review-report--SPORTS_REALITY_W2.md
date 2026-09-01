# SPORTS_REALITY_W2 — Bounded rights/source review, `m2-visual-quality-war` wave 2

Role: Sports Reality Director · Assignment: `bowl-rights-review` · Actor: `sports-reality-w2`.
Scope: rights/source review of the drawn arena, crest badges, and club wordmarks only (DIRECTION.md
Q7 + risk 11). Not a re-audit of module economics or copy — that is `GATE_L1_SR.md` (2026-08-31),
which this review treats as the standing baseline and does not repeat.

Context read: `VISUAL_REFERENCE_SPEC.md` §0/§6, `DIRECTION.md` Q7 + risk 11, `VISUAL_REFERENCE_CONTRACT.md`
§A (A2, A7), `W2_BUILD_BRIEF.md`, `fullHouse.ts:70-260` and `marketForDesk` (line 809), `GATE_L1_SR.md`.
Images viewed directly: `preview-outcome-100.png`, `preview-outcome-72.png`, `preview-hero-1366.png`,
`mock-student-1366.png`, `mock-board-1920.png`. Source read directly: `arena.mjs` (823 lines, full
scan for logo/color/team tokens).

## real-world-anchors

The visual wave itself introduces no new real-world facts on top of the two verified NBA markets
already anchored in `fullHouse.ts` and `GATE_L1_SR.md` (2026-08-31): New York Knicks / Madison
Square Garden and Memphis Grizzlies / FedExForum, the only two entries in `MARKETS`, assigned by
`marketForDesk` (odd desks = New York, even = Memphis; confirmed by direct source read, line 809).
One new anchor DOES appear, only in a style-tile mock, not in product code: `mock-board-1920.png`
draws six desk rows naming four additional real NBA clubs — Denver Nuggets, Sacramento Kings,
Orlando Magic, Milwaukee Bucks (crest marks "DEN", "SAC", "ORL", "MIL"). NOT VERIFIED — these clubs
do not exist anywhere in `fullHouse.ts`; the module computes exactly two markets. OBSERVED as
mockup art depicting a hypothetical larger class, not sourced module output.

## accuracy-findings

**Highest severity (advisory, not blocking): the board mock shows four real NBA clubs the product
does not model.** `mock-board-1920.png` is explicitly wave-3-only per `W2_BUILD_BRIEF.md`, and its
GATE/CASH per-desk columns are already forbidden by the contract (E16) for reasons unrelated to
rights. But the four extra club names are a distinct issue: if a later wave literalizes a 6+ desk
class by cycling through more real clubs than New York and Memphis, each additional market needs
its own Sports Reality verification (capacity, building, market-size framing) exactly as the two
current markets received in `GATE_L1_SR.md` — none of that exists for Denver, Sacramento, Orlando,
or Milwaukee today. Using a real name with no verified data behind it is the "sports trivia" failure
mode CLAUDE.md §3/§8 warns against: a name on screen with nothing economic backing it.

**Arena architecture — CLEAR.** OBSERVED across `preview-outcome-100.png`, `preview-outcome-72.png`,
`preview-hero-1366.png`: a generic isometric three-tier oval bowl, wood-tone court with only a
center circle and painted key (confirmed in `arena.mjs`: no logo, no team-color fill, no NBA marks,
no signage tokens anywhere in 823 lines). It does not resemble Madison Square Garden's distinctive
tension-cable domed roof or FedExForum's exterior massing — no roof/truss structure is drawn at all
(the view is a top-down bowl, not an exterior). **Boundary for the builder:** stays clear so long as
it (a) never draws a roof/truss/cable silhouette recognizable as a specific real building, (b) never
fills any element with a real team's colors as identity, (c) never adds signage, a sponsor-style
ring-board, or a court paint pattern specific to a real team (e.g., a parquet floor, a team's
center-court logo), (d) stays an interior top-down/oblique view rather than an exterior elevation
(exteriors are where a specific building's silhouette becomes recognizable). Crosses the line the
moment any of those four appear.

**Text marks — CLEAR, with one rule that should be locked, not just observed.** `mock-board-1920.png`
crest circles are plain two-letter abbreviations ("NY", "MEM", "DEN", "SAC", "ORL", "MIL") in a
single uniform flat violet fill — the product's one system accent, not team colors — paired with
full club wordmarks in the product's own Inter-class type beneath. This is the same "typographic
name, no logo/mark" pattern `fullHouse.ts:80` already documents and `GATE_L1_SR.md` already cleared
for the two shipped markets. Nothing new here imitates a mark. It WOULD start to imitate a mark if
a crest badge took on a real team's color as identity fill, approximated a real logo's silhouette
(e.g., a stylized animal/figure, a team's specific wordmark styling), or adopted a real team's
specific badge geometry. Currently true only by construction (`VISUAL_REFERENCE_CONTRACT.md` A2:
violet is the only accent) — recommend this be written into `VISUAL_IDENTITY.md`'s Module 2 section
explicitly as a rights rule ("crest badges never take team-color fills"), not left as a side effect
of the palette decision, so a later wave doesn't drop it while chasing "more team feel."

## staleness-findings

None specific to this visual wave. The one live staleness item touching this surface is inherited,
not new: `GATE_L1_SR.md` F1 (BLOCKING, still open as far as this review can verify) — Night 3's
"the defending champions" card collides with the Knicks' actual June 2026 title, and Night 3 is the
card the Two Peaks reveal is computed from, which this wave's arena/board work renders. This wave
does not touch that string; flagging only so the Boss lead confirms `GATE_L1_SR.md` R1 lands before
classroom readiness, since the visual work makes that exact card more visible (larger arena render,
heavier headline), not less.

## rights-source-considerations

- **The founder's photoreal reference render is fully replaced, not adapted.** OBSERVED: `arena.mjs`
  is procedural SVG — computed shapes, gradients and paths, zero raster/external assets, zero
  licensed or scraped imagery. This removes the source-ownership question for the arena entirely for
  this wave; nothing here is "closely modeled on" an image we don't own, it is generated from
  scratch. `mock-student-1366.png` even labels its own placeholder arena panel "DRAWN BOWL —
  PLACEHOLDER ASSET," consistent with that discipline.
- **Residual for a future wave:** if any later wave proposes a raster (photographic or AI-generated)
  arena image "for more premium," that reopens two questions at once — asset licensing/provenance,
  and a sharply higher trade-dress risk, because photoreal renders read as depicting a specific real
  building far more readily than procedural geometry does. Route any such proposal back through
  Sports Reality before build, not after.
- **Names and facts as facts, confirmed unchanged.** New York Knicks / Madison Square Garden and
  Memphis Grizzlies / FedExForum continue to render as plain typographic facts, consistent with
  `GATE_L1_SR.md`'s prior clearance. No new likeness, logo, photography, or proprietary data appears
  anywhere in the reviewed assets.
- **The four extra clubs in `mock-board-1920.png`** are a scope question, not a cleared/blocked
  rights question yet — see accuracy-findings above and the dissent below.

**Formal dissent (advisory, category `rights-source`):** the board mock's four unmodeled real clubs
should not ship into wave 3's per-night class-results frame without either (a) restricting all
desks to the two verified markets (repeating New York/Memphis per the existing odd/even
`marketForDesk` assignment, however many desks the class has), or (b) a fresh Sports Reality
verification pass for each additional real market before it reaches a screen.

## recommendation

**Builders may:** ship the procedural SVG bowl as drawn (generic bowl, violet + gold-as-floodlight
lighting, generic court markings, no team colors, no logos); ship typographic club wordmarks and
two-letter crest badges in the single system violet accent, following the pattern already cleared
for New York and Memphis.

**Builders must not:** draw a roof/truss/exterior silhouette recognizable as a specific real
building; fill any crest badge or UI element with a real team's colors as identity; approximate a
real team's logo silhouette or badge geometry; add a raster or AI-generated arena image without a
fresh rights/source pass; literalize `mock-board-1920.png`'s four extra real clubs (Denver,
Sacramento, Orlando, Milwaukee) as shipped desks without either restricting to the two verified
markets or commissioning verification for each new one.

**Escalate to the founder (rights/source items, not legal certifications):** (1) whether Module 2
is intended to ever model more than the two current real NBA markets — a scope call with real
downstream verification cost, each additional market needing its own capacity/building/demand
review; (2) whether "crest badges never take team-color fills" should be written into
`VISUAL_IDENTITY.md` as a standing rights rule rather than left as an incidental effect of the
violet-only palette decision.

No blanket legal claims made or implied above; this is a product-design rights/source read, not a
certification.
