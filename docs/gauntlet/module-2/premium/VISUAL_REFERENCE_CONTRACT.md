# VISUAL_REFERENCE_CONTRACT — Module 2 premium wave

Run `m2-visual-quality-war`. Frozen at the start of wave 2 by the Boss lead from: the founder
references (`docs/gauntlet/module-2/VISUAL_REFERENCE_SPEC.md`), the second independent visual
review (`REVIEW_VISUAL_2.md`), the economic-truth adaptation rulings
(`ECON_ADAPTATION_RULINGS.md`), the experience direction (`DIRECTION.md`), and the three kid
baselines (`KID_A_BASELINE.md`, `KID_B_BASELINE.md`, `KID_C_BASELINE.md`).

Reading rule: every row is REFERENCE FEATURE → CURRENT PRODUCT STATE → REQUIRED IMPLEMENTATION
→ ALLOWED ADAPTATION (with the concrete reason class: FUNCTIONAL / CLASSROOM / ECON-TRUTH /
FEASIBILITY / VIEWPORT / STRONGER) → ACCEPTANCE EVIDENCE. "Preserve" means implement the
reference decision as drawn. A row with no adaptation is implemented literally.

STATUS: DRAFT SKELETON — rows are filled from wave-1 evidence before wave 2 opens.

## A. System (all surfaces)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| A1 | Canvas near-black with blue-violet cast; panels barely lighter, 1px hairline, 14–16px radius, no shadows | `--surface-void #0a0d12`, panel `#131822`, card `#1b212c`, hairline 8–9%, radius 14 | | | |
| A2 | One accent: violet; gradient CTA with glow; violet icon badges; violet breadcrumb | Gold `#f4b942` is the accent on all surfaces; violet only for turn indicator | | | |
| A3 | Green for positive money; amber/red only for teacher attention pills | Cap-state ramp green/amber/red used for cap semantics (M1) | | | |
| A4 | Inter-class grotesque everywhere; no condensed display face on student/teacher; projector headline heavy wide caps | Bebas Neue display eyebrows/headlines; Space Grotesk numerals; Inter (not vendored → DejaVu/Roboto fallback) | | | |
| A5 | One hero figure per state; stat cards with badge + caps label + 36–40px figure + qualifier | Ledger-style rows, monospace figures, PIN block outranks the decision | | | |
| A6 | Minimal charts: single line, hairline axis, one highlighted point, dark chip | Curve SVGs framed in rect, gold series | | | |
| A7 | Arena render as hero backdrop and outcome panel | Static `board-arena-backdrop.svg` on /board only; nothing on /play | | | |
| A8 | Sidebar: brand mark, short nav, progress pips card, identity card | No sidebar; single centred column on /play; top bar only | | | |
| A9 | Copy: short, second person, one sentence per card | Cap Room register, honest, but paragraph-dense in places | | | |
| A10 | No motion visible in stills; heightened moments carry glow/lit arena/oversized headline | Instant DOM swaps; no commitment settle; no sellout flash | | | |

## B. Student — pricing / night desk (`/play` PLAY pre-lock)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| B1 | Header: breadcrumb, H1 "Full House", one-line subtitle, goal card top-right | Desk header strip with club + CASH/RENEWALS | | | |
| B2 | SET YOUR TICKET PRICE hero card: giant figure, −/+, slider, end labels, helper | Range dial with gold readout, plan notch; spend stepper below | | | |
| B3 | DEMAND AT A GLANCE curve card | Nothing (blind commit) | | | |
| B4 | Arena hero image bleeding off the right | None | | | |
| B5 | Four stat cards: projected attendance / revenue / profit / capacity | Card facts as chips: seats, bill, plan price | | | |
| B6 | KEY INSIGHT advisory card | Renewals rule paragraph; blind-commit honesty line | | | |
| B7 | Large violet "Lock In Price →" CTA with caption | Full-width gold LOCK IT IN + honesty caption | | | |
| B8 | Sidebar with Round pips + identity | Rejoin PIN block top; collapsible schedule; history ledger below | | | |

## C. Student — night result / sellout (`/play` PLAY with settled night)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| C1 | Separate larger results state with its own H1 | Result box appended under the next night's controls | | | |
| C2 | Five result cards incl. radial fill gauge | Monospace box-score rows | | | |
| C3 | WHAT HAPPENED card + deltas vs projected | Spend verdict / kept lines | | | |
| C4 | ARENA OUTCOME lit-fill panel with legend | Fill track bar | | | |
| C5 | "Strong Round!" trophy footer | None (honest) | | | |
| C6 | "Adjust for Next Round →" CTA | Next night's dials are simply present | | | |

## D. Student — synthesis mirror (`/play` SYNTHESIS / COMPLETE)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| D1 | Own-numbers stat row | Books line | | | |
| D2 | What happened / Key insight two-column card | — | | | |
| D3 | Four concept cards with small computed visuals + takeaway | Six cards staged on /board; /play shows books + exit prompt | | | |
| D4 | Forward question + CTA | Exit prompt | | | |

## E. Projector — class results and reveal frames (`/board`)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| E1 | CLASS RESULTS heavy headline, subtitle, breadcrumb | Night card strip + THE TWO PEAKS panel | | | |
| E2 | One table: crest, team, price, fill bar, revenue bar, profit bar; 64px rows | Per-night curves; class marks; books tiles at reveal 7 | | | |
| E3 | Discussion prompts on the frame | ADAPT questions on the ADAPT frame | | | |
| E4 | Left rail: round pips, total capacity, identity | HUD text top-right | | | |
| E5 | Arena atmosphere top-right fading into the table | Full-bleed arena backdrop SVG | | | |

## F. Teacher — live class director (`/teach`)

| # | Reference feature | Current product state | Required implementation | Allowed adaptation | Acceptance evidence |
|---|---|---|---|---|---|
| F1 | Header with Class Status / connected count / Round pips / Time | Phase chips row; join list | | | |
| F2 | Filter bar: All / Locked In / Adjusting / Needs Attention | None | | | |
| F3 | Desk card grid: number, name, status pill, price, proj. attendance, readiness, last update | Team tiles: handle, cash, renewals, nights, fill | | | |
| F4 | Director Rail: WATCH FOR / DON'T EXPLAIN YET / ASK / TIMEOUT / RECOVERY | NOW / SAY / DON'T EXPLAIN YET / THE BELL / TIME CUT as a long column above the controls | | | |
| F5 | Footer bar: Pause Round · Add Time · Open Projector · Reveal Class Results | Advance / Jump / Pause / Freeze / Restore / End + Reveal N of 7 / bell / Two Peaks buttons | | | |
| F6 | Sidebar with View dropdown | None | | | |

## G. Non-negotiables carried from law (not adaptable)

- No pre-lock preview of anything derived from the pending action (BC-4).
- CASH and RENEWALS never summed or shown as one "profit".
- No reward chrome (D4). No student-facing timer. Teacher-paced with manual fallback.
- `/board` never shows seat-private data; `/play` never shows another seat.
- Module 1 rendered output unchanged (pixel baseline in wave-1 evidence).
- Every rendered economic claim audited (ClaimAtom / render-drift limbs keep biting).
- No new real-world sports fact without Sports Reality verification.
