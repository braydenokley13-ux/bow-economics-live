# DIRECTION — Experience Director, `m2-visual-quality-war` / `premium-direction`

Persisted verbatim by the Boss lead from the Experience Director's report (the role is read-only
and could not write the file; a recording-mechanics conflict, not a substantive one).

**Context verified:** `docs/gauntlet/module-2/VISUAL_REFERENCE_SPEC.md`; `design/VISUAL_IDENTITY.md`; the surface inventory; `runtime/src/modules/fullHouse.ts:1-190` (header + market type); `docs/PRODUCT_DECISIONS.md` D20 (visual premium clause **VERIFIED-UNMET**, non-blocking) and D4; `GATE_L1_VISUAL.md` §visual-verdict and §"What stands between here and PREMIUM" (read, not inherited). Screenshots viewed with the Read tool: `w3f-04-play-n1-fresh-viewport.png`, `w3f-06b-play-locked-waiting.png`, `w3f-06-board-play-n1-open.png`, `w3f-09-play-shock-soldout.png`, `w3f-08b-board-play-twopeaks-1920.png`, `w3f-10b-teach-after-play-1920.png`, `w3f-11b-board-reveal-stage7-1920.png`, `w3f-13b-board-cf-1920.png`, `w3f-15b-board-synth-card1-1920.png`. **NOT VERIFIED:** the build was not booted or played (read-only role); every state claim below is OBSERVED from those PNGs or INFERRED from source.

---

## direction

**The highest-severity direction call, first: the arena is an instrument, not a backdrop.** The reference puts a photoreal bowl behind the pre-lock pricing screen. Adopting that literally is the single fastest way this wave breaks the lesson. A building rendered on the pre-lock screen either becomes wallpaper the student stops seeing — spending the sellout's escalation before the sellout exists — or gets read as tonight's forecast, which violates the blind commit (BC-4; `fullHouse.ts:11-15`) by picture rather than by number. **Ruling: the drawn bowl only ever renders a settled turnout. Pre-lock the building is dark, closed, or absent from the frame.**

**The world.** Module 1 is the Cap Room — the war room after the building empties, a GM alone with the roster wall. Module 2 is a different room in the same building at a different hour: **the ticket office on a game day, in the hours before doors.** M1 is aftermath; M2 is anticipation. That distinction is what earns Module 2 its own violet/Inter card layer without fracturing the product family: same building, different room, different time of night. The student's felt sentence is "I am the person who decides what tonight costs, and then the doors open" — not "I am filling out an economics dashboard."

The reference's restraint is what makes it premium, not its palette. Violet + Inter + rounded dark cards is the most common look in the current product-design world; taken alone it lands on "nice SaaS", which is the same SERVICEABLE verdict in a new hue. What makes the references premium is **place, one hero per state, and almost nothing else on screen.** Build the place.

**The 75/25 budget, named exactly.** Four heightened beats plus two half-beats per lesson. Nothing else is allowed an entrance, a flash, or a display-scale figure.

| Beat | Surface | Ceiling |
|---|---|---|
| **B1 The house fills / the sellout** | `/play` settled night; `/board` night close | **Full cinema.** The loudest student-device moment in Track 101 so far. |
| **B2 Two Peaks release** | `/board` | **Full cinema.** Teacher-gated; the headline lands before the curves. |
| **B3 The class results frame** (per-night class evidence + the season books) | `/board` | **Full cinema on entry, then still.** It is a table; the theatre is its arrival. |
| **B4 The synthesis close** (6 cards + beyond-sports rail) | `/board` | **Full cinema, slowest tempo in the system** (700ms backdrop, 450ms fade-and-rise). |
| **H1 Lock settle → doors about to open** | `/play` | **~40%.** 200ms firm settle, no bounce; then the desk recedes and the building comes up dark. |
| **H2 N5-repeats-N1 counterfactual** | `/board` + `/play` mirror | **~40%.** The personal version of a class beat. |

**`/play` — target feeling, state by state.** (75% unless marked.)

1. **join** — *arriving for a shift*, not signing into school software. One field, the building's name, the desk waiting. Restrained.
2. **lobby** — *the desk is yours*. The one identity moment: the club wordmark and building name land. Restrained.
3. **hook** — *here is the season, and here is what you are accountable for*. Two books introduced as two visibly different instruments; the five nights as a physical schedule strip. Restrained.
4. **pre-lock night desk** — the core state, visited five times. *Quiet, operational, slightly tense, deliberately information-poor.* **This state must never be cinematic** — cinema here is a lie, because nothing has happened. Its premium comes entirely from craft: the night card as a printed card with real weight; the price dial as a physical instrument with detents; the spend as a second, smaller instrument; the honesty line as a permanent quiet statement directly under the commit control (OBSERVED in the right place today, `w3f-04`).
5. **locked-waiting** — *the beat between commitment and consequence.* This is `/play`'s single biggest wasted dramatic surface today: OBSERVED in `w3f-06b`, three lines of text and roughly 300px of dead black on a 768px panel. Half-beat H1: the desk recedes, the building comes up dark, "the doors open when your teacher rings the bell." No timer, no spinner, no preview, no progress bar.
6. **the settled night** — *reading a box score the morning after.* Its own larger state, per reference §2. **The hero figure is WHO CAME (turnout against capacity), not the money.** Money is second. See risk R3.
7. **the sellout** — **B1, full cinema.** The building lights all the way up, one edge flash, FULL HOUSE at display scale — and immediately beneath it, at the second-largest size on screen, the turned-away count. The economics of a sellout is the people you refused, not the celebration. This is a *fact delivered at scale*, never a reward (D4). OBSERVED today (`w3f-09`) as a decently loud gold panel with a thin fill bar — the building itself never appears at the moment the building is the whole point.
8. **books closed** — *the season is on the books; nothing left to do.* Low, still, waiting posture. Restrained.
9. **reveal-mirror** — **deliberately subordinate.** The device shows only the pair's own numbers so they can find themselves on the board. Dim, small, no motion. This state is designed to *lose* the attention contest with the projector.
10. **adapt** — question posture. One prompt at a time. Restrained.
11. **counterfactual** — the pair's own N1-vs-N5 row and its channel decomposition. Half-beat H2.
12. **synthesis** — mirror of the board card, one card at a time, quiet. The ceremony is on the board.
13. **complete** — the exit prompt, one line, still.

**Experience grammar — what each reference object BECOMES here.**

- **Sidebar → the desk rail.** Club wordmark + building name; the five-night schedule strip with pips (Night N of 5, not "Round 3 of 4"); the two books docked at the bottom as two non-summable instruments; the rejoin PIN demoted into it as a small persistent chip. **No fictional destinations** (no Forecast/Finances/History nav). Narrows to ~200px at 1366×768; collapses to a top strip at 1024×600.
- **Goal card → the accountability card.** Never "Maximize Revenue" — that is a false single objective on a two-book lesson. Two lines: *cash you keep* and *season-ticket holders who come back*, with one plain line saying they cannot be added.
- **Stat row → tonight's printed facts + your books.** Capacity (with its season stamp), tonight's bill, season-plan price, the visiting club's Draw, day, TV. These are **operating facts a real desk has**, not projections. The reference's Projected Attendance / Revenue / Profit and the demand-at-a-glance curve are forbidden pre-lock.
- **Result screen → the night's box score.** Order of loudness: turnout & fill → price → gate → in-arena → the bill → KEPT → renewals movement (as a different instrument) → turned-away when it exists. Not five equal cards.
- **Arena panel → the building.** Our own drawn bowl, lit in proportion to a settled turnout only. It is a readout with a legend, not atmosphere. It is the flagship consequence visual on `/play`.
- **The two dials → two physical instruments of unequal size.** Price large with detents; spend small; the upper-bowl option as a physical plate/switch on the nights that offer it, not a checkbox.
- **The bell → a world event.** The teacher's `closeNight` must land on `/play` as *doors opening* and on `/board` as *the night settling* — never as a page swap.

**`/board` grammar.** Every frame, without exception: **headline slot (display scale, one line or one number) → evidence slot → footnote rail.** The modelling caveat lives in the footnote rail at footnote weight. Today it is inverted: OBSERVED in `w3f-11b-board-reveal-stage7-1920.png`, "These demand curves are modeled…" is set **bolder and brighter** than "7,732 people in this room's five nights wanted a seat and could not get one." The sourcing discipline is correct and stays; its type weight is upside down. Two Peaks (`w3f-08b`) puts its own headline — "The cheaper ticket made more money." — at the bottom, under the charts. That headline goes to the top and the curves land under it.

**The missing frame.** OBSERVED in `w3f-06-board-play-n1-open.png`: during PLAY the board shows tonight's card and a `2/3 DESKS LOCKED IN` counter, and nothing else. **There is no per-night class evidence frame** — the reference's CLASS RESULTS table, which is the loop's own "class evidence" step, does not exist in the product. Direction: after each night closes, the board shows one table — desk · club · price · fill (bar) · gate · CASH · RENEWALS — with a bar beside every number so the comparison reads from the back row. This is B3 and it is likely new frame work, not restyling (see Q2).

**`/teach` grammar.** *Calm command, never a dashboard.* Monitor wall of desk tiles + a persistent **Director Rail** at the right edge in the NOW / WATCH FOR / DON'T EXPLAIN YET / ASK / TIME CUT / RECOVERY structure — the content already exists (`teacherDirector`, `teacherWatchFor`, `bellNote`) and today renders as a 1040px column of stacked prose with ~880px of dead screen at 1920 (OBSERVED, `w3f-10b`). Desk tiles carry a status pill (LOCKED / ADJUSTING / STALLED), locked price and spend, last night's fill, and the two books. The bell and the reveal control are the single loudest objects, bottom-right. **Elapsed clock only — never a countdown**, and never a student-facing timer.

---

## experience-risks

Ranked by severity. Each is falsifiable at review time.

1. **The arena becomes decoration — or worse, a forecast.** Highest severity: a bowl rendered behind the pre-lock screen can break BC-4 with no new data field, and spends the sellout's escalation on wallpaper. *Test: screenshot the pre-lock desk on N1 and N4 — is any building rendered in any lit state?*
2. **The results screen becomes a dashboard.** Five equal stat cards + a radial gauge + delta pills is a grid of figures, which is precisely the "economics dashboard" CLAUDE.md §8 forbids. The consequence must read as an event with one hero. *Test: count figures ≥34px on the settled-night state; more than two and it is a dashboard.*
3. **The hero figure is the wrong number.** The reference makes price the hero on results — but price is the one thing the student already knows, because they set it. Money is the biggest number, but the lesson's under-weighted term is *people*. If money is the hero, the room learns "big number = good night", which is exactly the false lesson Two Peaks exists to break. *Test: on the settled night, is the largest figure the turnout?*
4. **Losing the "no preview" honesty line, or demoting it into invisibility.** It is the only thing telling a student that the emptiness is deliberate rather than a missing feature. Currently OBSERVED directly under LOCK IT IN (`w3f-04`) — keep that position, keep it legible, never move it into a rail.
5. **Premium-as-palette.** Violet cards and Inter without the place produce a well-made dashboard and the same SERVICEABLE verdict in a new hue. *Test: cover the copy — does the frame still say "arena ticket office" or does it say "any product"?*
6. **Kids read less of what matters.** Bigger cards mean less room. OBSERVED at 1366×768 (`w3f-04`): the PIN block eats the top ~140px and LOCK IT IN sits at y≈686 of 768. Any premium layer that pushes the commitment control further down is a net loss regardless of how it looks.
7. **Motion that reads as UI.** Hover lifts, slide-in panels, springy easing on money. Every motion answers "what did the world just do", never "what did the app just do" (`VISUAL_IDENTITY.md` motion vocabulary).
8. **The two books collapse visually.** Rendered as two identical stat cards with the same type and accent, students will average or sum them no matter what the copy says. OBSERVED today in the desk header (`w3f-04`): `CASH $0` and `RENEWALS 50%` in the same gold, same weight, same slot, 60px apart.
9. **The reveal-mirror competes with the board.** A premium `/play` during REVEAL puts thirty heads down at the exact moment the lesson becomes public.
10. **Cinema inflation.** If every night close gets an edge flash, the sellout has nothing left. A desk can sell out on N2, N4 and N5 — repeat exposure is a real risk (see Q5).
11. **Reality sterilized by the grid.** The founder invariant (CLAUDE.md §3) is real clubs, real buildings. The premium wave must not invent crest art that reads as a real team logo (`fullHouse.ts:80` — wordmarks only, no logos/marks), and must not replace real club names with generic tiles to make a table look tidy. Fictional names apply to *students*, not clubs.
12. **Restyling drops numbers out of the claim audit.** Every rendered figure is a registered ClaimAtom (D20). A visual rewrite that hand-composes a string is invisible to that audit.

---

## non-negotiables

For builders. Each is checkable without me.

1. Nothing derived from the pending price / spend / bowl appears pre-lock — including any picture, bar, gauge, curve, target band, or lit arena state.
2. The drawn building renders only settled turnout. Pre-lock it is dark, closed, or absent.
3. CASH and RENEWALS never share a type slot, unit shape, or accent; renewals is never rendered as dollars; no view ever shows a combined figure or a single "profit".
4. Heightened treatment is confined to B1–B4 and half-beats H1–H2. No other state gets an entrance, a flash, or a display-scale figure.
5. Every `/board` frame: one headline at display scale → evidence → footnote rail. A caveat is never set heavier or brighter than the claim it qualifies.
6. Semantic state is never colour-only — every pill, bar and series carries a glyph, label or position (`VISUAL_IDENTITY.md` colour law; the CF frame's N1/N5 bars are the standing offender, OBSERVED `w3f-13b`).
7. LOCK IT IN is reachable without scrolling in the first viewport at 1366×768 and at 1024×600. The rejoin PIN leaves the hero slot.
8. No badges, trophies, stars, streaks, "Strong Round!", momentum copy, or completion iconography (D4). The sellout is a fact delivered at scale.
9. Every motion ships its `prefers-reduced-motion` collapse (≤120ms cross-fade), and no money figure uses overshoot/spring easing.
10. Module 1's rendered output does not change. Module-2 tokens are scoped by module id on the document root.
11. Real club names stay as typographic wordmarks; no invented logo-alikes; no "Team N" substitution on any surface.
12. No fictional nav destinations anywhere in the desk rail.
13. Every figure on every restyled surface remains a registered, audited ClaimAtom.
14. The teacher's bell keeps its manual fallback and its `onPhaseExit` force-close semantics; no reveal depends on a click that may never come.

**What must not change (restated as a build contract):** the blind commit; the two books; the teacher-paced bell; the teacher-gated Two Peaks release computed from the class's own locked numbers; N5 replaying N1's exact card with the printed per-desk decomposition (`repeatRowFor`) carrying the beat — bar length cannot carry it, because real arena capacity is a founder invariant; and the class-computed six-card synthesis. If a visual decision and one of these collide, the visual decision loses.

---

## open-questions

For the Boss lead to route to the founder or the owning critic. No material disagreement; no dissent recorded.

- **Q1 (founder, blocking the token layer).** **Does gold survive in Module 2?** The references contain no gold; M1's identity makes gold = money (`accent-gold #f4b942`). Option (a): M2 retires gold as a UI accent, keeps it only as the building's floodlight warmth, and money goes off-white with green for positive. Option (b): M2 keeps gold for money and takes violet only for structure. This decides whether the two modules read as one product or two. Recommendation: (a) with gold surviving as environmental light — a founder call.
- **Q2 (founder / Boss lead, scope).** Is the **per-night CLASS RESULTS table** in scope? It does not exist today (OBSERVED `w3f-06`), it is the reference's centrepiece projector frame, and it is the loop's "class evidence" step. This is new frame work, not restyling.
- **Q3 (Economic Truth / Classroom).** Is the reveal-mirror's **deliberate subordination** acceptable, or does a student with a poor sightline to the projector need a fuller mirror? Attention discipline vs. access.
- **Q4 (Classroom / Projector).** Row budget for the class table at 12–15 desks against 64px rows and back-row legibility: does it **page** (as COUNTERFACTUAL already does) or **compress**? Paging costs teacher clicks; compressing costs legibility.
- **Q5 (founder).** **Ceiling on the sellout beat.** A desk can sell out on N2, N4 and N5. Recommend: full building-lights-up sequence on a desk's *first* sellout, abbreviated thereafter. Needs a ruling because it is a repeat-exposure judgement, not a taste one.
- **Q6 (Boss lead, budget).** Does this wave touch `/play`'s REVEAL / ADAPT / SYNTHESIS mirrors at all, or is scope: pre-lock desk + locked-waiting + settled night + the `/board` frames + the `/teach` rail?
- **Q7 (Sports Reality / rights).** The drawn bowl must not resemble a specific identifiable building — MSG and FedExForum have distinctive architecture. Direction: one generic NBA-scale bowl; market difference expressed through capacity, size and light, not architecture. Confirm.

---

## Boss lead rulings on the open questions (recorded at wave-1 close)

- **Q1 — (a).** The founder references are the primary design spec and carry no gold as a UI accent; Module 2 retires gold as an accent and keeps it only as floodlight warmth in the drawn building. Money is off-white; positive money green. This is fidelity to the founder direction, not a new founder decision. Module 1 is untouched.
- **Q2 — in scope.** The per-night class results frame is the reference's centrepiece projector frame and the loop's class-evidence step; it is built in wave 3 (propagation) on class evidence for closed nights only, subject to the Economic Truth ruling on which columns are truthful and the Classroom/Projector ruling on privacy.
- **Q3 — accepted, with access preserved.** The reveal mirror stays subordinate (small, still) but keeps the pair's own numbers legible; a poor-sightline student still has their own row.
- **Q4 — page, not compress, past 8 desks**, matching the existing COUNTERFACTUAL pager; legibility outranks clicks.
- **Q5 — first sellout full sequence; later sellouts abbreviated** (lit building + headline, no edge flash).
- **Q6 — wave 2 scope:** join, lobby, hook, pre-lock desk, locked-waiting, settled night, sellout, books-closed, and the /play mirrors restyled to the same grammar (restyle only, no new mechanics). Wave 3: /board frames, /teach rail, synthesis.
- **Q7 — confirmed:** one generic NBA-scale bowl; market difference by capacity, size, and light; no identifiable architecture.
