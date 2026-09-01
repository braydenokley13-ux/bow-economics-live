# VISUAL_REFERENCE_CONTRACT — Module 2 premium wave

Run `m2-visual-quality-war`. Frozen by the Boss lead at the close of wave 1 from: the founder
references (`docs/gauntlet/module-2/VISUAL_REFERENCE_SPEC.md`), the second independent visual
review (`REVIEW_VISUAL_2.md`, VERIFIED-UNMET), the economic-truth adaptation rulings
(`ECON_ADAPTATION_RULINGS.md`, E1–E30, R-1–R-10), the experience direction (`DIRECTION.md`, with
the Boss lead's Q1–Q7 rulings), the three kid baselines (`KID_A/B/C_BASELINE.md`), and the
baseline browser QA (`BASELINE_QA.md`). Analyst additions (`ANALYST_W1.md`) are appended in §H.

Reading rule: every row is REFERENCE FEATURE → CURRENT PRODUCT STATE → REQUIRED IMPLEMENTATION →
ALLOWED ADAPTATION (reason class: FUNCTIONAL / CLASSROOM / ECON-TRUTH / FEASIBILITY / VIEWPORT /
STRONGER, with the ruling id) → ACCEPTANCE EVIDENCE. "Preserve" = implement the reference decision
as drawn. Rows with no adaptation are implemented literally. Rulings marked FORBIDDEN are blocking
economic-truth dissents (`econ-adaptation-rulings-dissent`) and cannot be overridden by a builder.

Wave allocation: **W2 = §A + §B + §C + §D + §G (Full House `/play`, the design system, the
arena, the claim limb).** **W3 = §E + §F (projector frames, `/teach`) + synthesis card visuals.**

## A. System (all surfaces)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| A1 | Canvas near-black with blue-violet cast; panels barely lighter; 1px hairline ~6–8% white; radius 14–16 (cards) / 10–12 (chips); no shadows; 16–20px gutters; 20–24px card padding | `--surface-void #0a0d12`, panel `#131822`, card `#1b212c`, hairline 8–9%, radius 14; single centred 616px column on /play | Module-2 token layer `[data-module="m2"]` on `<html>` (set by each client when `view.module` starts with `m2l`): `--m2-canvas`, `--m2-panel`, `--m2-panel-2`, `--m2-hairline`, radii, spacing; card grid composition | Preserve. Scoping by module id is FUNCTIONAL (Module 1 must not change) | M1 pixel baseline byte-identical on /board frames; /play & /teach M1 shots identical after scrubbing code/PIN (`tools/shots-m1.cjs` + compare) |
| A2 | One accent, violet; gradient CTA with glow; violet icon badges; violet breadcrumb; gold nowhere as UI accent | Gold `#f4b942` is the accent on every M2 surface | Violet family (`#5b3df0`→`#7a5cff`) is the only UI accent under `[data-module="m2"]`; gold survives only as floodlight warmth inside the drawn building | Preserve (Boss ruling Q1(a) in DIRECTION.md; VISUAL_IDENTITY.md gets an appended "Module 2 layer" section in the same commit) | Computed-style audit: no `--accent-gold` usage in any M2 rendered element except the arena SVG; screenshot review |
| A3 | Green for positive money; amber/red only on teacher attention pills | Cap-state ramp used for cap semantics (M1) | Green `#22c55e` for positive CASH only; RENEWALS never green/red-coded as money (E10/R-3); teacher pills LOCKED IN (green) / ADJUSTING (amber) / NOT STARTED or STALLED (red) each with a glyph + label | ECON-TRUTH R-3: the two books never share a colour/unit treatment | Screenshot review; colour-only encoding check (glyph+label on every pill) |
| A4 | Inter-class grotesque everywhere; no condensed display face on student/teacher; projector headline heavy wide caps; money not in a mono face | Bebas Neue eyebrows and headlines; Space Grotesk numerals (tabular); Inter not vendored → DejaVu/Roboto fallback | Vendor Inter variable latin (OFL, 48KB, wght 400–800) beside the existing OFL fonts; Inter for all UI, labels, body and figures on M2 surfaces; Bebas Neue removed from M2 student/teacher chrome; projector headline = Inter 800–900 at display size (or Space Grotesk 700 if the style tile proves stronger) | STRONGER (visual review conflict 8): tabular figures stay for any column of digits (ledger, class table); big standalone figures proportional | Computed font-family audit on M2 surfaces; screenshot review |
| A5 | One hero figure per state; stat cards = icon badge + 12px caps label + 36–40px figure + 13px qualifier | Ledger rows, 28px price readout, 32px PIN outranks it | Hero figure ≥64px on /play states (price pre-lock; WHO CAME on results); stat-card grammar for every secondary figure; PIN leaves the hero slot (chip in the rail) | Preserve | Measured: `#fhPriceReadout` ≥64px and larger than any other figure pre-lock; results hero = turnout; count of figures ≥34px on results ≤2 (DIRECTION R2) |
| A6 | Minimal charts: single line, hairline axis, one highlighted point, dark chip; no frame box; 6–8px bar pills; 270° radial gauge | Curve SVGs in hard rects, gold series, colliding chips | Chart grammar per spec §0; **no fitted/joined line anywhere** (E3, E27a); marks with 2px ring; radial gauge allowed only as a secondary fill figure (E11) | ECON-TRUTH E2/E3/E27 | Screenshot review; DOM: no `<path>` joining settled marks on /play |
| A7 | Photoreal violet-lit arena as hero backdrop and fill-encoding outcome panel | Static diagonal-band backdrop on /board; nothing on /play | Our own drawn bowl (`shared/arena.ts`, procedural SVG): hero/outcome/backdrop views; renders **settled turnout only** (E12, E20, DIRECTION non-negotiable 2); fill = `turnout/seatsOpen`; upper bowl as a third labelled state; `turnedAway` as a count outside the bowl; never a preview, never moves with the dial; generic NBA-scale bowl, no identifiable architecture (Q7) | FEASIBILITY (no raster we own) + ECON-TRUTH E12/R-2/R-7 | Pre-lock screenshots N1 and N4: no lit building; results screenshots: bowl lit in proportion; sellout: fully lit + edge flash; `SIMPLIFICATIONS` gains the two arena entries (R-7) |
| A8 | 220–240px sidebar: brand mark, short nav, progress pips card, identity card | None | Desk rail on /play: compass-star brand mark, lesson identity, NIGHT N OF 5 pips, desk identity (club wordmark + building), the two books docked, PIN chip; ~200px at 1366×768, collapses to a top strip at 1024×600 | FUNCTIONAL (E6: no fictional destinations; "Forecast" forbidden anywhere) + VIEWPORT (1024×600) | Screenshots at 1366×768 and 1024×600; LOCK IT IN inside the first viewport at both |
| A9 | Copy: short, second person, one sentence per card | Honest but paragraph-dense (HOOK ~110–260 words; rule box repeats verbatim nightly) | Registered copy constants render verbatim (E5, §2.1 of the rulings) but are **placed**, not dumped: rule text in a fixed slot; the HOOK reduced to slate + objective + one rule per card face; no paragraph repeats verbatim on every night (collapse after N1 behind a one-line summary that is itself registered text) | Preserve; any new sentence is registered in the module (`HOUSE_RULES` family) so R-1 covers it; no new sports fact without Sports Reality | Word count per first viewport ≤60 on the pre-lock desk; grep test that client templates contain no unregistered economic sentences |
| A10 | Stills show no motion; heightened moments carry glow / lit arena / oversized headline | No `fh-` animation; reduced-motion wired | Identity motion vocabulary on M2: 200ms commitment settle on lock; building comes up dark on locked-waiting (H1); sellout 260ms edge flash on first sellout only (Q5); staggered mark population on board (W3); synthesis rise (W3); all under the existing reduced-motion collapse | Preserve | Playwright: animation names present on `.fh-*` elements; reduced-motion run shows ≤120ms cross-fades |

## B. Student — night desk, pre-lock (`/play` PLAY)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| B1 | Header: breadcrumb, H1 "Full House", one-line subtitle, goal card top-right | Desk header strip with club + CASH/RENEWALS in the same gold | Breadcrumb "Module 2 · Money in Motion · Lesson 1", H1 "Full House", subtitle = registered line; goal card = **two-book accountability card**: CASH and RENEWALS at equal weight under `OBJECTIVE_COPY` verbatim | ECON-TRUTH E4 (never "Maximize Revenue", never "fill your arena" as a goal) | Screenshot; DOM contains `OBJECTIVE_COPY` text |
| B2 | SET YOUR TICKET PRICE hero card: giant figure, −/+, slider with violet fill and large knob, end labels, helper | Range dial, gold 28px readout, PLAN tick overprinted by the knob (P1) | Hero card with ≥64px price, −/+ buttons stepping `PRICE_STEP`, styled range with detents at `PRICE_STEP`, PLAN $24 tick that never collides with the knob; helper = registered rule line (E5), never adaptive | Preserve | Measured readout size; P1 fixed at plan price; keyboard operable |
| B3 | DEMAND AT A GLANCE curve card with current price plotted | Nothing (blind commit) | **YOUR NIGHTS SO FAR**: settled nights only as labelled dots (price × people who came), own desk only, no joined/fitted line, no mark for the pending night, caption "One dot per night. Two nights are only comparable when the card is the same." Empty state on N1 = the card's plain line | ECON-TRUTH E2 FORBIDDEN → E3 replacement | DOM: no path/line elements; no dot for the open night; R-1 limb green |
| B4 | Arena hero image bleeding off the right | None | Pre-lock: the building **dark/closed** as a low-contrast hero backdrop with left fade (no lit sections, no fill) — or absent at 1024×600 | ECON-TRUTH E12 rule 1 / DIRECTION non-negotiable 2 | Pre-lock screenshots N1/N4 show no lit state |
| B5 | Four stat cards: projected attendance / revenue / profit / capacity | Card facts as small chips | Four cards, all printed facts: TONIGHT'S CARD (day · visitor · DRAW n/100 · TV), YOUR BUILDING (capacity with `capacityNote`, TONIGHT'S BILL, SEASON-PLAN PRICE), CASH (`books.cash`, debt state), RENEWALS (`books.renewals`) — no card whose number changes with the dial | ECON-TRUTH E1 FORBIDDEN → replacement | R-1 limb: no settlement quantity in pre-lock DOM |
| B6 | KEY INSIGHT advisory card | Renewals rule paragraph in a blue box | Fixed slot rendering registered rules verbatim (`HOUSE_RULES`, `spendRuleFor`, `renewalRuleFor`, `spendReceipt.label`); no adaptive text | ECON-TRUTH E5 | DOM text equals registered constants |
| B7 | Large violet "Lock In Price →" CTA with caption | Full-width gold LOCK IT IN + 11px honesty caption | Violet gradient CTA "LOCK IT IN →" with lock glyph; honesty line `HOUSE_RULES[0]` directly beneath at ≥14px `ink-secondary` (H6); commitment settle on press; the `confirm()` guard replaced by an in-page two-step (press → "Locked at $34") | Preserve; STRONGER on the guard (native dialog is school chrome) | Screenshot; e2e still locks; caption ≥14px measured |
| B8 | Second dial (event spend) and Night-4 upper bowl | Equal-weight blocks; spend explanation behind a disclosure | Spend = smaller instrument under the price card with its one-line rule printed (`spendRuleFor`) without a disclosure; upper bowl = a plate/switch on the nights that offer it, its cost printed | FUNCTIONAL (product objects the reference lacks) | Screenshot; Kid B/C repair items 6 discharged |
| B9 | Sidebar with Round pips + identity | Rejoin PIN block on top; collapsible schedule; ledger below | Desk rail per A8; schedule strip (five night pips with day labels) in the rail; ledger becomes B3 | Preserve | Screenshot |

## C. Student — night result / sellout (`/play` PLAY, settled night)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| C1 | Separate, larger results state with its own H1 | Result appended under the next night's dials, below the fold at 1366×768 (Kid A/B/C, QA) | **Own state**: when the bell closes a night, /play shows the night's result owning the viewport; the next night's dials appear only after "NEXT: NIGHT n → day · Draw · TV" (E15 copy); a refresh returns to whichever state the pair was in (client-side acknowledged-night key) | Preserve (reference §2) | Screenshot at 1366×768 and 1024×600 with `scrollY=0`: result headline, WHO CAME, and both books visible; no dial in the first viewport |
| C2 | Five result cards incl. radial fill gauge | Monospace box-score rows | Hero = **WHO CAME** (`turnout` of `seatsOpen`, ≥64px) with fill % "of the seats you opened tonight"; then the CASH chain rendered as a chain (TICKETS = price × people → + IN-ARENA → − BUILDING BILL → − EVENT MONEY (− BOWL) → CASH) and RENEWALS before → after at equal figure weight; one registered "they do not add up" line | ECON-TRUTH E10/E11/R-2/R-3 (no single money hero, no "profit", no "total revenue" for gate) | Figures ≥34px ≤2; labels audited by the grep test |
| C3 | WHAT HAPPENED card + deltas vs projected | Spend verdict / kept lines | WHAT HAPPENED = the night's settled facts undelta'd + `spendVerdict` + `resaleNote` verbatim; no delta pills; N1→N5 comparison only in COUNTERFACTUAL via `repeatRowFor` | ECON-TRUTH E9 (night-over-night pills FORBIDDEN) | DOM: no "+n vs" strings |
| C4 | ARENA OUTCOME lit-fill panel with legend | 6px fill bar | The drawn bowl lit to `turnout/seatsOpen`; upper bowl as a labelled third state on N4; `turnedAway` drawn outside the gates as a count; legend "Came / Open seats / Upper bowl closed"; in the same frame as the CASH/RENEWALS chain, never above it | ECON-TRUTH E12 | Screenshots N1 (partial), N4 sellout (full), N4 bowl-open |
| C5 | "Strong Round!" trophy footer | None | **None.** Headline = the factual line (`NIGHT 2 · 14,875 CAME AT $84` or `FULL HOUSE · 17,794 of 17,794 · 7,796 turned away`) | ECON-TRUTH E14 FORBIDDEN; D4 | grep test: no "strong", "momentum", "maximize", trophy glyph |
| C6 | "Adjust for Next Round →" CTA | Next dials simply present | "NEXT: NIGHT n →" with the next card's printed facts only | ECON-TRUTH E15 | Screenshot |
| C7 | (sellout) | Gold panel, half cut by the fold | B1 beat: whole bowl lit, one edge flash (first sellout only), FULL HOUSE at display size, turned-away count second-largest, `resaleNote` verbatim; no grading word | ECON-TRUTH E13; Q5 | Screenshot N4 sellout at 1366×768 in the first viewport |
| C8 | (locked-waiting) | Sentence + ~400px black | H1 half-beat: the building comes up dark with "Doors open when your teacher rings the bell", the locked price and spend restated; no timer/spinner | STRONGER (DIRECTION H1) | Screenshot |

## D. Student — mirrors (`/play` REVEAL / ADAPT / COUNTERFACTUAL / SYNTHESIS / COMPLETE)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| D1 | Own-numbers stat row | Books line | Two-book row (CASH / RENEWALS) + the pair's five nights as the B3 dot card | Preserve | Screenshot |
| D2 | What happened / Key insight two-column card | — | Only at SYNTHESIS, only the computed guarded line (E28) mirrored from the board card; never a static string | ECON-TRUTH E28 | DOM text equals module output |
| D3 | Concept cards with visuals | "Look up at the board." over black | Reveal mirror stays subordinate (Q3): small, still, the pair's own dots and books so they can find themselves; per-stage state that changes with the teacher's clicks (Kid A R3) — **Two Peaks on /play gated on `revealStage >= NIGHT_COUNT+1`, matching the board** (module change, returns through Economic Truth) | ECON-TRUTH (spoiler defect) + DIRECTION Q3 | e2e: /play at reveal stage 0 contains no Two Peaks numbers; appears at stage 6 |
| D4 | Forward question + CTA | Exit prompt | `EXIT_PROMPT` + `BEYOND_SPORTS_LINE` verbatim; no "Plan Next Round" | ECON-TRUTH E29 | DOM |

## E. Projector — class results and reveal frames (`/board`) — W3

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| E1 | CLASS RESULTS heavy headline, subtitle, breadcrumb | Night card strip; largest figure is the lock counter (57px) | Every frame: headline slot (one line or one 72–96px figure) → evidence → footnote rail; `#hud` build chrome off the projector | Preserve (DIRECTION board grammar) | Measured largest element per frame |
| E2 | One table: crest, team, price, fill bar, revenue bar, profit bar; 64px rows | Per-night curves with class marks; medians at reveal 7 | **Per-night class results frame** after each bell: DESK (handle + market crest) · TICKET PRICE · WHO CAME (bar) · FILL "of the seats that desk opened"; one night, one building per frame; stable desk order; money only at the season-books stage as per-market medians, two figures | ECON-TRUTH E16 (revenue/profit columns FORBIDDEN), E18, E19 (held state stays held; `seatsOpen`/`openBowl` on `CurvePoint` only via Economic Truth) | Screenshots 1920×1080 and 1366×768 at 4 and 12 desks; page past 8 desks (Q4) |
| E3 | Discussion prompts on the frame | ADAPT questions on the ADAPT frame | Registered prompts only (`ADAPT_QUESTIONS`, `ARGUE_PROMPT`, `EXIT_PROMPT`), verbatim, in the reference's numbered-card grammar; `ARGUE_PROMPT` never promoted to a per-night headline (R-8) | ECON-TRUTH E17 FORBIDDEN | DOM equals constants |
| E4 | Left rail: round pips, total capacity, identity | HUD text | Rail: NIGHT N OF 5 pips; per-market capacity with `capacityNote` (never one class-wide number) | ECON-TRUTH E18 | Screenshot |
| E5 | Arena atmosphere top-right fading into the table | Full-bleed band backdrop | Drawn bowl `backdrop` view at low contrast; never behind body text without the fade; caveats in the footnote rail at footnote weight (H5) | Preserve | Screenshot; text never crosses a border |
| E6 | (existing peak frames) | Two Peaks headline under the charts; reveal stages text-heavy; CF chips collide | Two Peaks headline on top; chart rules per A6 with mark rings (P6); CF bars with glyph+label and non-colliding chips; staggered mark population; synthesis rise | Preserve (do-not-regress list honoured) | Screenshots at both projector shapes |

## F. Teacher — live class director (`/teach`) — W3

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| F1 | Header: Class Status / connected / Round pips / Time Remaining | Join code at 60px + two URLs permanently; phase chips | Fixed header: lesson identity, NIGHT N OF 5 pips, desks connected (`deskCount`, no "of 30"), locked count; **elapsed** class + phase clock beside the phase's registered `minuteBudget` and `timeCut`, only if `createdAt` is exposed server-side (persisting across refresh); join code shrinks to a chip after the first join | ECON-TRUTH E24/E25; CLASSROOM | Screenshot; refresh keeps the clock |
| F2 | Filter bar | None | Filter chips ALL / LOCKED IN / ADJUSTING / STALLED driven by desk state | Preserve | Screenshot |
| F3 | Desk card grid with status pill, price, proj. attendance, readiness | Team tiles with wrapping text (P3) | Desk tiles: status pill (LOCKED IN / ADJUSTING / NOT STARTED, glyph+label), locked price + spend + bowl (or "not yet"), last fill "of the seats they opened", the two books, `teacherWatchFor` flags as labelled chips; all desks visible at once at 1366×768 (no pagination); no wrapping collisions | ECON-TRUTH E22/E23 FORBIDDEN → replacements | Screenshot at 12 desks, 1366×768 |
| F4 | Director Rail: WATCH FOR / DON'T EXPLAIN YET / ASK / TIMEOUT / RECOVERY | Long prose column above the controls | Right rail with NOW / WATCH FOR / DON'T EXPLAIN YET / ASK (SAY line) / TIME CUT / RECOVERY sections fed by `teacherDirector`, `teacherWatchFor`, `bellNote`, the projector mirror and the student-screen mechanics; rail scrolls inside itself; no facilitation content removed (teacher-transfer gate) | Preserve | Teacher-transfer critic cold read finds every existing line reachable |
| F5 | Footer: Pause Round · Add Time · Open Projector · Reveal Class Results | Buttons mid-page, below the fold at both viewports (QA dissent) | Persistent bottom bar: Advance · the bell (`closeNight`) · Two Peaks release · REVEAL stage control labelled as staging (`REVEAL NIGHT 1 →`, then `REVEAL_STAGES[n].headline`) · Pause/Freeze · Restore · Open Projector (opens `/board`, never mirrors the teacher DOM) · End; nothing a teacher touches during a night below the fold at 1366×768 | ECON-TRUTH E21/E26; CLASSROOM | Measured control positions < 768 at page top; e2e drives every control without scrolling |
| F6 | Sidebar with View dropdown | None | Not built (no view modes exist) | FUNCTIONAL | — |

## G. Non-negotiables and the claim limb (law, not adaptable)

- **R-1 (blocking, lands with the first rebuilt surface):** a rendered-claim limb on the client — `runtime/scripts/e2e-m2l1.cjs` harvests every pre-lock `/play` DOM at each state it drives, recomputes the settlement for the dials as set, and asserts none of `turnout`, `gate`, `inArena`, `total`, `net`, `fillPct`, `turnedAway`, `curve.base`, `curve.sens` appears, and that the text contains none of `project`, `forecast`, `estimate`, `expected`, `preview` (outside `HOUSE_RULES[0]`), `target`, `profit`, `readiness`, `momentum`, `time remaining`; plus a source-level `node:test` that greps `runtime/src/client/{play,board,teach}/main.ts` template literals for the same vocabulary. **Mutation proof required:** inject a client-side projection and a "Target $110–$120" literal into a scratch copy of `dist`, show the limb goes red, record both runs as evidence.
- No pre-lock preview of anything derived from the pending action (BC-4), by number or by picture.
- CASH and RENEWALS never summed, never one "profit"; fill always "of the seats you opened tonight" (R-2).
- No reward chrome (D4). No student-facing timer. Teacher-paced with manual fallback; `onPhaseExit` force-close semantics kept.
- `/board` never shows seat-private data; `/play` never shows another seat. Per-desk money never on the projector.
- Module 1 rendered output unchanged (M1 pixel baseline); Module-2 tokens scoped by module id.
- Every new sentence on an M2 surface is a registered module constant; no new real-world sports fact without Sports Reality verification.
- The six synthesis cards, their order, staging and bodies are not this wave's to change (E27); the wave adds computed visuals only (R-5, W3).
- `SIMPLIFICATIONS` records the two arena simplifications with misconception risk (R-7) and the renewals-reference-price entry (R-10: the forgiveness line moves per card and is never printed; a pair generalising "high price loses renewals" from Nights 1–3 is wrong on Night 4 — let it happen, then name why).
- **R-9 (blocking, module change through Economic Truth):** `studentView` REVEAL carries `twoPeaks` only when `twoPeaksReleased && revealStage >= NIGHT_COUNT + 1`, matching `boardView`; discharged by a module test asserting the field is absent at every lower stage. A client-only gate is not the permanent fix.
- **FL-V11:** no renewals visual may encode a monotone price-up → renewals-down relationship (false on Night 4 in both markets); no down-arrow tied to the dial, no red/green split on the slider track.

## H. Analyst additions (appended at wave-1 close)

The analyst read this contract while it was still a skeleton (a mid-wave race) and recorded a blocking
process dissent against opening the build on that state. The rows above were filled before wave 2
opened; the analyst's required acceptance measurements are reproduced here verbatim and are binding
on wave 2 (they supersede any looser wording in the rows above where the two differ).

Boss lead disposition of the analyst's eight repair actions: (1) econ report recorded, role completed,
dissent in ledger; (2) `w1-suite` and `w1-l1-harness` recorded as authentic command evidence; (3) the
Module 1 pixel baseline is recorded (`w1-m1-baseline-manifest`, `w1-m1-baseline-compare`, three
byte-stable board frames) — Draft Day join/lobby/hook/first-PLAY on three surfaces; the wave-2
regression hunter extends it to L2/L3 key states at the wave-2 base head before comparing; (4) row G
rewritten as the R-1 requirement (no audit exists on the client today); (5) Q1: the founder's written
instruction for this run (section 8) names accent usage among the reference decisions to preserve and
the references carry no gold — recorded as a Boss lead application of that instruction on a
founder-escalated question, with contrast/CVD proof of the Module-2 ramp added as a wave-2 Lane A
deliverable and the two-books colour rule (RENEWALS never green) binding; (6) R-9 (Two Peaks student
gate) carved into wave 2 Lane C as a module change with a test; (7) the renewals-rule misprediction is
ruled model-consistent (econ K2 → R-10); suppressing the repeated `renewalRuleFor` box is NOT ruled —
wave 2 renders it every night, compactly, until Economic Truth rules; (8) Q7 routed to a bounded Sports
Reality review in wave 2 (drawn bowl, crest text marks, club wordmarks).

### Required contract items — the acceptance measurements wave 2 must be judged against

Every row of `VISUAL_REFERENCE_CONTRACT.md` needs a cell in `Acceptance evidence` that a critic can falsify with a screenshot or a DOM measurement. `ECON_ADAPTATION_RULINGS.md` §6 already supplies the row-by-row econ bindings (A6, A7, B1/D1, B3, B5, B6, C2–C6, D3, E1–E4, F1, F3, F5). The rows with **no** binding from any wave-1 role and which therefore must be authored: **A1, A2, A3, A4, A5, A8, A9, A10, B2, B4, B7, B8, C1, D2, D4, E5, F2, F4, F6**. A2 and A4 are the disputed rows (gold vs violet; condensed display face) and must carry the Q1 ruling text verbatim plus the `VISUAL_IDENTITY.md` update commitment.

Measurements the wave-1 reports already imply, stated so they can go straight into cells:

**`/play` (wave-2 scope)**
- **C1.** After the bell, at 1366x768 with `scrollY=0`: the settled night's headline, turnout/fill figure, the `CAME × PRICE = TICKET MONEY` chain, `KEPT` and the renewals movement all have `getBoundingClientRect().bottom ≤ 768`, **and** the next night's `#fhLock` is *not* in the same first viewport. Asserted at all five nights, including a sellout night and a zero-attendance night. *(Today: result top 655–758px, KEPT at ~886. Fails.)*
- **C4/B4.** Sellout: `FULL HOUSE` headline `top < 200px` and the turned-away count `bottom ≤ 768` at `scrollY=0`; the turned-away count is the second-largest figure on the frame. *(Today: headline at y≈745. Fails.)*
- **A5/B2.** `#fhPriceReadout` computed `font-size ≥ 64px` at 1366x768; **no** other element in the pre-lock state exceeds it; `#pinDisplay` is strictly smaller at every moment, including the first 20 seconds after join. *(Today: 28px price vs 32px PIN. Fails.)*
- **Viewport.** At 1024x600 with the PIN card **un-collapsed**: `#fhLock` and its caption both have `bottom ≤ 600` at `scrollY=0`. *(Today: `#fhLock.top = 664`; with the PIN collapsed, `553` with the caption at 603–616. Fails both.)*
- **C2 (dashboard test, from `premium-direction-memo` risk 2).** At most **two** figures ≥34px on the settled-night state.
- **C2 (hero-identity test, risk 3).** On the settled night the largest figure is the **turnout**, not the money.
- **B3/G (blind commit).** On every pre-lock state, no element's text is a function of the pending price/spend/bowl other than the dial's own dollar echo. Discharged by `ECON` R-1's e2e limb **plus** its mutation proof: inject a client-side projection into a scratch `dist`, record the limb going red; inject a `Target $110–$120` literal, record the same.
- **C4/A7.** Every fill number, bar, gauge and arena picture is labelled "of the seats you opened tonight"; the string "of Capacity" appears **zero** times on any night the bowl can open (`ECON` R-2).
- **B6/H6.** `.fh-blind-note` computed `font-size ≥ 14px` and its colour passes the identity's contrast floor at that size. *(Today: 11px in `rgb(115,123,140)`. Fails.)*
- **B2/P1.** At the default dial position the tick label's bounding box does not intersect the knob's, at 1366x768 **and** 1024x600. *(Today: the knob strikes through "PLAN $24". Fails — OBSERVED by me in three frames.)*
- **A10/P9.** Every new animation ships a `prefers-reduced-motion` rule; measured duration ≤120ms under `reduce`; no money figure uses overshoot/spring easing.
- **G/two books.** No rendered figure is a function of both books; CASH and RENEWALS never share font-family + size + colour in the same row (`premium-direction-memo` NN3, and the standing offender is OBSERVED today in the desk header).
- **H7.** No `/play` state has more than 200px of contiguous empty region below its last content block at 1366x768.

**`/board`**
- **E1/E5.** At 1920x1080 **and** 1366x768 with **15 desks**, every frame fits without clipping (`#stage` is `overflow:hidden` — clipping is silent), exactly **one** element ≥72px, and **no** caveat/footnote element has font-weight or font-size ≥ the claim it qualifies.
- **A6.** Zero border/rect around any plot; every mark carries a separating ring; every legend swatch passes contrast against `--surface-void`. *(Today: framed plots and a near-black "N1 Tue" swatch. Fails.)*
- **E2 (class results, Q2/wave 3).** Columns limited to DESK / TICKET PRICE / WHO CAME + bar / FILL. **No** per-desk revenue column, **no** per-desk profit column, **no** collapsed "profit" (`ECON` E16, blocking dissent). Stable desk order asserted by test, never sorted by outcome. Pages past 8 desks (Q4). Prompts come from `ADAPT_QUESTIONS` / `ARGUE_PROMPT` / `EXIT_PROMPT` verbatim; the reference prompt "Why didn't the highest price always win?" does not ship (`ECON` E17, blocking dissent — it is false in 99–100% of rooms on Night 4).
- **Privacy.** `fullHouse.test.ts:263` (boardView never handed a seat id) stays green; zero student names on any `/board` frame.
- **P2.** Value-chip bounding boxes do not intersect bar-end bounding boxes at 1366x768 with 12 desks. *(Today: four collisions OBSERVED in one frame. Fails.)*
- **P4.** `#hud` absent from `/board` unless a query flag is set. *(Today: `v79 · REVEAL`, `v83 · COUNTERFACTUAL`, `v84 · SYNTHESIS` render on every public frame including COMPLETE. Fails.)*
- **D3/P7.** Each of the six synthesis cards carries a visual computed from the class's own locked numbers; the demand card is realized dots for **one market × one card** (never a fitted curve); the tradeoffs card is a **two-axis frontier**, never a balance scale; the shifter chips are DAY / DRAW / TV with RENEWALS and LAST NIGHT'S EVENT MONEY in a separately-labelled "carried" group; **"Weather" appears zero times** (`ECON` E27).

**`/teach`**
- **F4/F5.** At 1366x768, in **every** phase and at every director-note length, `#btnAdvance`, `#btnCloseNight`, `#btnRevealNext` and the first `.teamtile` all have `bottom ≤ 768` at `scrollY=0` — asserted by e2e at every phase, at 4 and 12 desks. *(Today: `#btnCloseNight.top = 1288`, `#btnAdvance.top = 1242`, first tile at 1670, in an 1826px document. Fails.)*
- **F1.** Elapsed clock only, teacher-only; no countdown; if the clock ships, the session start timestamp is exposed server-side (`createdAt` exists on `SessionRow` but does not reach `/teach` today — `ECON` E24/R-6).
- **F3.** No `Proj. Attendance`, no `Readiness` score; three-state pill plus `teacherWatchFor` flags only.
- **P3.** Desk-tile text does not wrap mid-token at 12–15 desks, measured by rendered line boxes, not `textContent`.

**Cross-cutting**
- **Forbidden-vocabulary grep** over rendered template literals in `runtime/src/client/{play,board,teach}/main.ts`: `project`, `forecast`, `estimate`, `expected`, `preview` (outside `HOUSE_RULES[0]`), `target`, `profit`, `readiness`, `momentum`, `time remaining`, `Strong Round`, `trophy`, `Forecast` — count **0**.
- **M1 regression:** the wave-2 base-head M1 baseline diffed frame-for-frame after the build.
- **Selector stability:** `node runtime/scripts/e2e-m2l1.cjs` and `e2e-m2l1-misclick.cjs` green — these are the drift limb the rebuild will actually feel, since every selector the wave touches is asserted there.
- **Record `SIMPLIFICATIONS`** for the two new arena-picture simplifications (evenly-lit seat pool; the Night-4 denominator change) before the wave closes (`ECON` R-7).
