# REVIEW_VISUAL_2 — second independent visual review, Module 2 Lesson 1 "Full House"

Run `m2-visual-quality-war` · assignment `second-visual-review` · actor `visual-critic-2` · port 4401.
Formed from rendered browser state only. I did not read the prior gate's findings before driving the
build, and I did not inherit its verdict; I read only its `## visual-verdict` header afterwards to
confirm I was not duplicating its citations.

**Method (AGENT-PLAYTESTED).** One full session of `m2l1-full-house` against `runtime/dist` on
port 4401: teacher + projector + 4 desks, one desk joining late at Night 3, one desk never locking
Night 5, all five nights closed by the bell, Two Peaks released by the teacher, all 7 reveal stages,
ADAPT, COUNTERFACTUAL, all 6 synthesis cards, COMPLETE. 100 screenshots in
`/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-baseline-visual/`
(`MANIFEST.md` in that folder lists every file). Viewports: /play 1366x768 and 1024x600, /teach
1366x768 and 1920x1080, /board 1920x1080 and 1366x768. Zero console errors and zero page errors
across the whole session. Measurements below were taken with `getComputedStyle` /
`getBoundingClientRect` in the live page, not estimated from pixels.

**Performance budget: NOT VERIFIED.** No Chromebook-class budget document exists in this repo
(searched `docs/`, `design/`; the only hits are prior gates recording the same gap). I measured
proxies on desktop-class Chromium, which is not a Chromebook and not a budget: /play load 63ms,
/board first `#stage` paint 103ms, lock→settled-recap 63–83ms across five nights, /play 50 DOM
nodes / 10MB heap at COMPLETE, /teach 283 nodes. Reveal-control roundtrips measured ~1.03s but that
figure is dominated by the client poll cadence and my own wait, so it says nothing about render
cost. Nothing here certifies Chromebook performance.

---

## visual-verdict

**Overall: VERIFIED-UNMET.**

This is a carefully-reasoned instrument rendered as a document. Almost every premium decision in the
founder references is a decision about *space* — a grid, a sidebar, a card row, one hero figure, an
arena — and this build has no spatial system at all on two of three surfaces. /play is a single
616px column centred in a 1366px viewport with 750px of empty black beside it; /teach is an 1826px
scroll where the bell, the reveal control and the first desk tile are all below the fold at
1920x1080. The lesson's loudest moments are rendered smaller than its administrative furniture: on
the Night-1 decision screen the rejoin PIN renders at 32px and the ticket price — the only decision
in the lesson — renders at 28px; on a live /board PLAY frame the largest number on the projector is
the lock counter "0/2" at 57.6px.

| Surface | Verdict | Load-bearing evidence |
|---|---|---|
| `/play` | VERIFIED-UNMET | `11-play-night1-prelock-1366x768.png`, `24-play-night4-sellout.png`, `15-play-night1-locked-waiting.png`, `01-play-join-1366x768.png` |
| `/teach` | VERIFIED-UNMET | `45-teach-play-TOP-1366x768.png`, `46-teach-play-TOP-1920x1080.png`, `29-teach-books-closed@1366x768.png` |
| `/board` | VERIFIED-UNMET (closest of the three) | `31-board-reveal-stage5@1920x1080.png`, `36-board-counterfactual@1920x1080.png`, `05-board-lobby@1920x1080.png` |
| synthesis frames (`/board` + `/play` mirror) | VERIFIED-UNMET (weakest in the module) | `39-board-synthesis-card1@1920x1080.png`, `39-board-synthesis-card6@1920x1080.png`, `40-play-synthesis-card1.png` |

Advisory under my authority. Two findings below (H1 teacher-control reachability, H6 identity-rule
breaches) plausibly trip classroom-reliability and the identity's own colour/type law and are
flagged for the roles that own them.

---

## hierarchy-findings

Ordered by severity. OBSERVED = read off a rendered screenshot or measured in the live page.
INFERRED = read from source. Everything else is NOT VERIFIED.

**H1 — /teach buries every live control and the entire monitor wall below the fold, at both
viewports (OBSERVED, measured).** At page top the document is 1826px tall. `#btnCloseNight` (the
bell) top = 1288px, `#btnRevealNext` top = 1289px, `#btnAdvance` top = 1242px, first `.teamtile`
top = 1670px — in viewports of 1080px and 768px. A teacher who wants to ring the bell, stage a
reveal, or see whether a desk has locked must scroll a document, mid-class, every night.
`45-teach-play-TOP-1366x768.png` shows what the teacher actually sees at page top: the join code
"BOWGHH" at 60px plus two localhost URLs, permanently, for the whole lesson.
`16-teach-night1-all-locked@1920x1080.png` shows the controls and the desk grid where they actually
live. `VISUAL_IDENTITY.md` requires "a single always-visible reveal trigger — large, unmistakable,
never buried"; the reference requires a monitor wall with the reveal as the loudest button. Neither
is true. This is the highest-leverage single fix in the wave: one layout change on one surface.

**H2 — the consequence — the loudest beat in the lesson — is a footer beneath the next decision, and
falls below the fold on the design target (OBSERVED).** There is no result state. A settled night is
appended under the *following* night's dials. `24-play-night4-sellout.png` (1366x768) shows the
Memphis desk at the moment of a sellout: the whole viewport is the Night-5 dials, and "FULL HOUSE"
begins at y≈745 in a 768px viewport — the room's biggest moment is a 20px sliver at the bottom edge.
`24b-play-night4-sellout-full.png` shows the block that was cut: the FULL HOUSE headline, "7,256
could not get in", the fill bar, the CAME × PRICE = TICKET MONEY equation, the ledger, KEPT, the
renewals delta — 470px of the best-composed content on the student surface, positioned where a
student will not see it without scrolling past a decision they have already made.
Same defect one night earlier in `18-play-night2-with-night1-result.png`.

**H3 — the hero figure is not the hero (OBSERVED, measured).** On the Night-1 decision screen:
`#pinDisplay` = 32px/800, `#fhPriceReadout` = 28px/700. The rejoin PIN is 4px larger than the only
number the student controls. (Fair qualifier: the PIN card auto-collapses 20s after join — INFERRED
from `play/main.ts:99` and OBSERVED in `18-…`— so this is the first 20 seconds of a desk's first
decision, not a permanent state. That is the wrong 20 seconds to lose.) With the PIN collapsed the
price readout is still 28px in a 616px column; the reference asks 72–96px, and §7 asks ≥64px after
re-composition to 1366. Nothing in the /play surface exceeds 32px at any point in the lesson.

**H4 — on /board the largest number is administrative (OBSERVED, measured).** On a live PLAY frame
at 1920x1080 the eight largest rendered elements are: "0/2" 57.6px (`.num`, the lock counter),
"Tonight's Card" 46.1px (a label), "Night 1 of 5" 38.4px, "22" 34.6px (the Draw), the matchup line
32.6px, then two 21.1px prose blocks. The room's eye is drawn to a locked-desk tally. Across every
frame I captured, no board state carries a 72–96px hero figure, and no board state carries a
72–96px figure of any kind.

**H5 — standing caveats outweigh the evidence they qualify, on the projector (OBSERVED).**
`31-board-reveal-stage5@1920x1080.png`: the renewals-rule paragraph is five lines at ~30px filling
the top third; beneath it the class chart is compressed; beneath that a three-line "this is NOT a
demand curve" caveat at ~30px; beneath that the turned-away line; beneath that a two-line honesty
note. Five text blocks and one chart on one projector frame. At 1366x768
(`31-board-reveal-stage5@1366x768.png`) the frame fits by shrinking the *chart* to ~490x210 while
the paragraph keeps its five lines — the data yields, the disclaimer does not.
`36-board-counterfactual@1920x1080.png` repeats it: the largest text block on the argue frame is a
four-line bold white summary paragraph, larger than the desk rows and the scatter it points at. The
economics of these caveats is right and hard-won; their *weight* is inverted.

**H6 — the /play body copy that carries the lesson's central promise renders below the identity's own
legibility floor (OBSERVED, measured).** `.fh-blind-note` — "No preview. Nothing on this screen
tells you what tonight will make." — renders at 11px in `rgb(115,123,140)` = `ink-muted`.
`VISUAL_IDENTITY.md` restricts `ink-muted` to "labels/eyebrows at ≥14px only (4.2:1)". Same file's
colour law. This is the one line that tells a student the blindness is deliberate rather than a bug.

**H7 — /play's waiting state and synthesis mirror are undesigned (OBSERVED).**
`15-play-night1-locked-waiting.png`: after locking, the desk shows a grey sentence and "Locked at
$34" over ~400px of empty black, five times a lesson, in the minutes when the class is most likely
to disengage. `40-play-synthesis-card1.png`: during the ceremonial close the student device shows
"Look up at the board." and the exit prompt over ~430px of empty black. "Eyes up" is a defensible
classroom call; rendering it as a blank page is not a design of it.

**H8 — first contact is a login form (OBSERVED).** `01-play-join-1366x768.png` /
`02-play-join-1024x600.png`: three inputs, a gold Join button, a small wordmark, black. No lesson
identity, no arena, nothing that says a building is about to be handed to you. The reference's
student screens open with breadcrumb, title, goal and arena.

**H9 — /play does not use the viewport it was designed for (OBSERVED, measured).** At 1366x768 the
play column is 616px wide (45% of the screen) and the document is 815px tall, so even the design
target scrolls by 47px. At 1024x600 `#fhLock` top = 664px with the PIN card up (below the fold) and
553px once it collapses — on screen, but occupying the final 47px of the viewport with its caption
at 603–616px, off screen. The lock control is *reachable* at first contact; it is not *composed*.

---

## production-quality-gaps

**P1 — the price dial's tick label is struck through by its own knob (OBSERVED).**
`11c-clip-price-dial.png`, and again in `18-…`, `24-…`: the "PLAN $24" tick label renders directly
under the slider knob whenever the price is at or near the plan price — which is the default
position every night. The plan price is the anchor the whole renewals rule turns on, and it is
rendered as an overprint. This appears at 1366x768 and 1024x600.

**P2 — the counterfactual bars' value chips collide with the bars (OBSERVED).**
`36-board-counterfactual@1366x768.png`: "15,812" overhangs its bar tip into the card edge, "4,350"
sits on top of a short bar, "14,142" and "13,567" overlap their bar ends. This is the frame the room
argues from, on a projector.

**P3 — teacher desk tiles wrap into unreadable text (OBSERVED).**
`29-teach-books-closed@1366x768.png`, Desk 3 tile: the handle and the status run together across a
line break and render as "**Ari** finished · 5 nights / **& Tal**in the books". Four tiles are
squeezed to ~140px wide with two-word-per-line wrapping; the reference's monitor wall is 4x3 cards a
standing adult scans in a glance. At 12–15 desks this gets worse, not better.

**P4 — build/version chrome is permanently on the projector (OBSERVED, measured).** `#hud` renders
"v5 · PLAY" / "v49 · PLAY" / "v79 · REVEAL" / "v90 · COMPLETE" at 12px, opacity 1, top-right of every
public frame including the ceremonial close (`42-board-complete@1920x1080.png`). A version counter
ticking in the corner of a classroom projector is a debug affordance.

**P5 — the arena does not exist; the backdrop is a wireframe, and text overprints it (OBSERVED).**
`05-board-lobby@1920x1080.png` and `42-board-complete@1920x1080.png`: the backdrop is diagonal light
bands plus two hard-edged rectangles with visible 1px borders and an internal 3x3 grid. It reads as
an unfinished court diagram, not a bowl. On COMPLETE the closing sentence runs straight through that
rectangle's left border ("…is not the / …s team." crossing the rule at x≈1360), which
`VISUAL_IDENTITY.md` forbids ("never sits behind body text without the fade"). There is no arena with
tiers, no fill encoding, no sellout state — the reference's flagship consequence visual (§2, §6.2)
is absent, and the placeholder is actively costing atmosphere.

**P6 — charts are drawn inside boxes (OBSERVED).** `23-board-two-peaks@1920x1080.png` and every
scatter: the plot sits in a visibly bordered dark rectangle. `VISUAL_IDENTITY.md` chart law: "never a
bounding box/frame around the plot"; reference §0: "no frame box". Marks also carry no separating
ring, so overlapping desk-nights fuse (`31-board-reveal-stage5@1920x1080.png`, the orange cluster at
left). The "N1 Tue" legend swatch is a near-black dot on a near-black ground and is effectively
invisible at both projector shapes.

**P7 — the synthesis cards have no visuals (OBSERVED).** `39-board-synthesis-card1@1920x1080.png`:
the card titled "REVENUE = PRICE × PEOPLE" contains six lines of prose and no equation, no chart, no
computed figure set as anything other than running text — on the projector, at the ceremonial close,
with 260px of dead space beneath it. The reference's concept cards are badge + name + a small visual
computed from the class's own numbers + one takeaway. The product already knows how to do this: the
settlement box score renders CAME × PRICE = TICKET MONEY as an actual equation with operators between
cards (`18c-clip-night1-result.png`). That treatment exists and is not used where it matters most.

**P8 — the last frame of the lesson is a wall of citations (OBSERVED).**
`39-board-synthesis-card6@1920x1080.png`: five source-note paragraphs at ~17px grey (≈1.6% of screen
height, under the projector review's 2.6% back-row floor) occupy the bottom 300px, beneath an exit
prompt rendered smaller than the beyond-sports line above it. Source discipline is right; this is
the wrong surface and the wrong moment for it.

**P9 — the identity's motion vocabulary is unimplemented on Module 2 (OBSERVED + INFERRED).** All
four keyframes in `theme.css` (`arrive`, `fadeSlideIn`, `tearShake`, `settle`) belong to Module 1
selectors (`.mini-card`, `.foregone-row`, `.roster-slot.out`, `.lock-settle` — the last applied only
at `play/main.ts:442`, the M1 roster wall). No `fh-` element carries an animation; Full House has
hover/width transitions only (140–500ms). There is no commitment settle, no sellout edge flash, no
staggered mark population, no synthesis rise. The one thing that *is* right: `prefers-reduced-motion:
reduce` is genuinely wired and measured live (transitions drop to 80ms).

**P10 — /play's two dials share one visual grammar with nothing above them (OBSERVED).** The event
spend (`21-clip-spend-dial.png`) and the upper-bowl plate (`22b-clip-bowl-plate.png`) are competent
individually, but price, spend, and bowl are three equal-weight blocks in one column, so the screen
does not say which decision is the decision. The reference subordinates the second dial by size.

---

## reference-conflicts

Reference decisions that would create a **concrete product problem** if implemented literally. I
advise; the founder direction stands unless the founder changes it. Items 1–6 restate and confirm
adaptations the spec already flagged PRELIMINARY — I found no reason to overturn any of them, and
one I would strengthen. Items 7–14 are additional.

1. **Pre-lock projected attendance / revenue / profit + "demand at a glance" curve (§1).** CONFIRMED
   fatal if literal — destroys BC-4 blind commitment, which the product currently states on the
   screen itself. The spec's replacement (printed operating facts + own books + own history) is
   correct. **Strengthen it:** render own-history as discrete settled marks or a ledger only —
   *no* fitted curve and *no* marker for the currently-dialled price. A curve with a live
   current-price point is a demand preview drawn from the pair's own data, and by Night 5 it is a
   good one.
2. **"Your Goal — Maximize Revenue" card (§1).** CONFIRMED. Two books that cannot be summed; a single
   objective teaches an exchange rate the model refuses. Add: avoid "maximize" as a verb — the module
   deliberately never claims a beatable optimum ("The most cash we could find",
   `37-play-counterfactual.png`).
3. **"Target: $110–$120" pill (§2).** CONFIRMED — publishes the hidden optimum. Drop.
4. **Trophy + "Strong Round! You're building momentum" (§2).** CONFIRMED — D4 reward chrome. Drop.
5. **"+1,250 vs. projected" delta pills (§2).** CONFIRMED — no projection exists to differ from.
6. **"Total Profit / After Costs" column on the projector (§4) and green = profit (§0).** CONFIRMED
   for the column. **Extend to the colour rule:** green-for-positive applied to *both* books puts a
   green "$218,232 KEPT" beside a green "+6 renewals" (already visible in
   `24b-play-night4-sellout-full.png`) and invites exactly the summing the lesson forbids. Give one
   book the money treatment and the other a categorically different one (arc/segment/percentage
   ring); never two green figures in one row.
7. **"One accent hue: violet; gold does not appear as a UI accent anywhere" (§0).** Direct conflict
   with `design/VISUAL_IDENTITY.md`, where `accent-gold #f4b942` is *money, big numbers, primary CTA*
   and violet is reserved for the L3 turn indicator. The wave also forbids changing Module 1's
   rendered output. Literal implementation makes M1 and M2 look like two products inside one 50-minute
   course, and removes gold from money while green arrives for profit — a three-hue money system that
   the identity's CVD-validated ramp was never tested against. This needs an explicit founder ruling
   plus a same-commit update to `VISUAL_IDENTITY.md`; it is not a builder's call, and it is not a
   reason to keep gold by default.
8. **"No condensed display face on the student or teacher surfaces" (§0).** Conflicts with the
   identity's Bebas Neue for section headers and eyebrows, which is what /play and /teach currently
   use (measured: `.fh-card-night` = Bebas 17px). Literal implementation splits the type system
   across surfaces of one product. Advice that satisfies the intent: keep one display face, restrict
   it to /board headlines and /play *state* headlines ("FULL HOUSE"), and set every eyebrow and label
   in Inter caps.
9. **"Money is set in the same grotesque, not a mono face" (§0).** Space Grotesk is not a mono face,
   so the objection may not bite at all (NOT VERIFIED which face the founder was reacting to). If it
   is read literally as "drop tabular figures", the /play history ledger and the projector's per-desk
   table lose column alignment and the digits will visibly jitter as they update. Advice: tabular
   figures wherever numbers stack in a column; proportional for standalone hero figures — which is
   what `VISUAL_IDENTITY.md` already says.
10. **220–240px left sidebar on the student surface (§0, §1).** At 1024x600 first contact a 220px rail
    takes 21% of width from a decision column that already ends 47px above the fold; at 1366x768 the
    play column is 616px today and a sidebar plus a hero arena column leaves under 500px for the
    dial. The nav items also name destinations that do not exist, and a nav where one item is live is
    chrome. Advice: keep the sidebar's *restraint* and its two real payloads — night pips and desk
    identity — as a slim persistent top rail on /play; reserve the true sidebar for /teach and the
    /board rail, where width is not scarce.
11. **"Time Remaining · radial 08:42 of 15:00" (§5).** CONFIRMED as flagged. Add: a visible countdown
    on the teacher surface will be read aloud and become a class-wide clock; the module's own TIME
    CUT line is the right hook. Elapsed only, never remaining.
12. **Per-desk "Readiness" four-dot score (§5).** The spec flags it as a projection the model does not
    make. It is also a *rank* — a four-dot score per desk is a leaderboard the teacher will read out.
    D4-adjacent. Status pill plus facts only.
13. **"Showing 1–12 of 28 teams" — a paginated monitor wall (§5).** At real class scale, paginating
    the desk grid removes the one thing the surface is for: seeing the whole room at once. Never
    paginate /teach desk cards; compress the tile (and fix P3 first).
14. **64px projector table rows + 110px headline + arena behind the top-right quadrant (§4).** The
    binding constraint is the 1366x768 projector at 12–15 desks, where every board frame must fit
    without scrolling (an existing hard instrument). Design this frame at 1366x768 with 15 desks
    *first*; a layout tuned at 1920 with 6 desks and compressed afterwards is how the current caveat
    blocks came to outweigh the charts (H5).
15. **The photoreal arena as hero backdrop behind header and cards (§0).** We do not own the render,
    and the drawn replacement is the largest new asset in the wave. The current placeholder (P5) is
    proof that a weak arena is worse than none. Advice: build it once as the *consequence* panel with
    real fill encoding, prove it there, and only then reuse it as a backdrop — and only if it survives
    at low opacity behind text without the overprint now visible on COMPLETE.

---

## do-not-regress

Things this build already gets right that a premium rebuild could easily destroy. All OBSERVED
unless noted.

1. **Blind commitment is not just enforced, it is declared at the point of decision** — "No preview.
   Nothing on this screen tells you what tonight will make." sits directly under the lock button
   (`11-play-night1-prelock-1366x768.png`). Keep the sentence. Fix only its size and colour (H6).
2. **The two books are never summed, anywhere, on any surface** — CASH and RENEWALS stay separate on
   /play, /teach and /board, and the counterfactual says "no exchange rate" out loud
   (`26b-play-books-closed-full.png`, `37-play-counterfactual.png`).
3. **Projector privacy holds** — no student name appears on any /board frame; desks are "Desk 1 · New
   York Knicks" (`05-board-lobby@1920x1080.png`, and every later frame).
4. **The mark system: market = colour, night = shape, no joining stroke, plus the standing statement
   that the picture is not a demand curve** (`31-board-reveal-stage5@1920x1080.png`). This is an
   unusual and correct piece of data design. Restyle the marks (rings, spacing, legend); do not
   collapse the shape encoding into a second hue, and do not connect the points.
5. **Two Peaks as a teacher-released beat, two market panels, one punchline sentence**
   (`23-board-two-peaks@1920x1080.png`). Keep the choreography and the tickets-alone vs
   tickets-plus-spend pairing. Give the punchline the type weight it is owed.
6. **The settlement box score's CAME × PRICE = TICKET MONEY, rendered as an equation with operators
   between three cards** (`18c-clip-night1-result.png`). This is the single most reference-like thing
   in the module. Promote it; do not flatten it into a stat row.
7. **The Night-4 sellout's factual headline** — "FULL HOUSE / 17,794 of 17,794 · every one sold /
   7,256 could not get in" (`24b-play-night4-sellout-full.png`). Loud without a badge. Move it; do
   not soften it.
8. **Board LOBBY / HOOK / COMPLETE atmospheric composition** — the floodlight wash and centred
   negative space are the best art in the module (`05`, `09`, `42`). Keep the light; replace the
   wireframe rectangles and stop text crossing them.
9. **`prefers-reduced-motion: reduce` is genuinely wired** (measured live: 80ms transitions,
   `47-play-reduced-motion.png`). Every new animation must land inside that collapse.
10. **Session hygiene** — zero console errors and zero page errors across a full 5-night session with
    a late joiner and a stalled desk; every board frame I captured fit both projector shapes without
    visible clipping (observed by inspection; I did not re-run the e2e overflow assertions).

---

## direction

Ranked by grade movement per unit of work. 1–3 are most of the distance.

1. **Rebuild /teach as a fixed monitor wall, not a scroll.** Persistent header (phase, night,
   locked count), persistent bottom control bar (Advance · bell · reveal · Two Peaks), desk grid
   filling the middle, director rail (NOW / WATCH FOR / DON'T EXPLAIN YET / ASK / TIME CUT /
   RECOVERY) in a right column that scrolls *inside itself*. The join code shrinks to a chip after
   the first desk joins. Nothing a teacher touches during a night may sit below the fold at
   1366x768. Fix P3 in the same pass.
2. **Give the settled night its own state on /play, above the fold.** After the bell, the desk shows
   the consequence — headline, fill, the equation, the two books — and the next decision arrives
   *after* the pair dismisses it or the teacher opens the doors. This is the reference's "the
   consequence gets its own screen" and it is where the arena asset earns its place (fill-encoded
   bowl, whole-bowl sellout state, one edge flash on the sellout). It also fixes H2, most of P10's
   ambiguity, and gives H7's dead waiting screen something to be.
3. **Fix numerical hierarchy on all three surfaces to one hero per state.** /play: the price at
   ≥64px; PIN never larger than it. /board: one 72–96px figure per frame — the turnout, the gate,
   the turned-away count — with the standing caveats demoted to a fixed footnote rail at a fixed
   small size, so no disclaimer ever outweighs the evidence. Delete `#hud` from the projector or
   move it behind a query flag.
4. **Give the six synthesis cards computed visuals.** Card 1 gets the box-score equation treatment
   using the class's own numbers; the demand card gets one night's marks; the two-books card gets two
   visibly incommensurable objects. Move the source notes off the final frame to a teacher-openable
   panel. This is where the lesson's meaning is supposed to land and it is currently prose.
5. **Introduce the grid.** The reference's row of four stat cards is the mechanism that turns a
   column into a composition; /play at 1366x768 has 750px of unused width waiting for it. Do this
   after 2, so the grid is designed around the decision/consequence split rather than retro-fitted.
6. **Then the craft pass:** P1 tick/knob overprint, P2 bar-chip collisions, P6 chart frames and mark
   rings and the invisible legend swatch, P5's backdrop and text overprint, H6's 11px muted copy, and
   P9's motion — commitment settle, sellout edge flash, staggered mark population, synthesis rise —
   all inside the existing reduced-motion collapse.

**One caution to the founder on sequencing.** Items 7 and 8 in `reference-conflicts` (violet-only
accent; no condensed face on student/teacher) change the shared theme, which Module 1 also renders.
Until those are ruled on, a builder either scopes them to Module 2 by module id — which is what
§6.1 asks — and accepts that the two modules will look like different products, or waits. Getting
that ruling before item 5 is cheaper than after.

**Independence.** I directed nothing in this wave; this review is of a build I did not shape. If any
of the direction above is implemented, I should not be the sole certifier of the result.
