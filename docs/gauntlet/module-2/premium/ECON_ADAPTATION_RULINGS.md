# ECON_ADAPTATION_RULINGS — M2 L1 "Full House" premium visual rebuild

Run `m2-visual-quality-war` · assignment `econ-adaptation-rulings` · actor `econ-truth-w1`.
Independent Economic Truth review, written BEFORE the build, against
`docs/gauntlet/module-2/VISUAL_REFERENCE_SPEC.md` (all five references, every PRELIMINARY
ADAPTATION note), the surface inventory, `runtime/src/modules/fullHouse.ts`, `runtime/src/test/`,
`docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`, `GATE_L1_ECON_R3.md` and `ECONOMIC_CONTRACT.md`.

Evidence labels: **OBSERVED** = read off code or off a number I computed by running the shipped
model this session. **INFERRED** = reasoned from source without exercising it. **NOT VERIFIED**.
Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN. I did not modify any repository source file.

Baseline established this session (OBSERVED):
- `cd runtime && npm test` → **exit 0, 461/461 pass**, 17.8 s. Includes tests 286/287/288, the
  three tuning-harness wrappers (`runtime/src/test/m2Harnesses.test.ts`).
- `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` → **"VERDICT: ALL 16 PROPERTIES HOLD"**.

Model probes I ran (scripts under the scratch folder, `probe1.mjs`–`probe5.mjs`, all against
`runtime/dist/modules/fullHouse.js`, i.e. the shipped build):

| night | New York cash-best price / fill / net | Memphis cash-best price / fill / net |
|---|---|---|
| N1 Tue draw 22 | **$34** · 71.4% · $215,384 | **$24** · 67.8% · $154,160 |
| N2 Sat draw 51 local TV | **$48** · 74.7% · $456,008 | **$36** · 70.9% · $325,856 |
| N3 Wed draw 88 national TV | **$40** · 67.9% · $260,100 | **$30** · 60.0% · $168,140 |
| N4 Sat draw 97 (bowl offer) | **$90** · 81.8% · $1,229,600 | **$84** · 80.9% · $1,102,400 |
| N5 = N1's card | **$34** · 71.4% · $215,384 | **$24** · 67.8% · $154,160 |

---

## 0. THE STRUCTURAL FINDING THAT GOVERNS EVERY RULING BELOW

**There is no ClaimAtom audit on Lesson 1, and no test in this repository reads a single line of
`runtime/src/client/**`.** (OBSERVED.)

- `ClaimAtom` / `Claimed` / `ClaimSurface` and the COVERAGE / VALUE / QUANTIFIER / LEVEL / **RENDER**
  limbs exist only in **L3** (`runtime/src/modules/writeTheRule.ts:766-818, 2300`,
  `docs/gauntlet/module-2/GATE_L3_ECON.md:733-739`). `grep -i claim runtime/src/modules/fullHouse.ts`
  returns only source comments. Full House registers **nothing**.
- L1's protection is entirely **server-side payload discipline**: `fullHouse.test.ts:181` (BLIND
  COMMIT — walks every number in the pre-lock `studentView` and asserts no settlement quantity
  appears; walks every key and forbids the substrings `preview`, `project`, `estimate`, `expected`,
  `forecast`) and `fullHouse.test.ts:223` (`FORBIDDEN_KEYS` + forbidden curve values across every
  surface × every phase).
- The L1 harness renders exactly **two** product strings (`pathDependenceCardBody`, `repeatSummary`,
  at `l1-tuning-harness.mjs:1133-1152`, property P16). `HOUSE_RULES`, `spendRuleFor`,
  `renewalRuleFor`, `OBJECTIVE_COPY`, `revenueCardBody`, `shifterCardBody`, the two-books body,
  `resaleNote`, `SIMPLIFICATIONS` and every teacher-director line are under **no** render limb.

**Consequence for this wave.** The rebuild's four surfaces are `play/main.ts`, `teach/main.ts`,
`board/main.ts` and the CSS. A builder can compute a projected attendance in the client from
`history` + `card` + `market.capacity`, print "Target $110–$120" as a literal, label CASH as
"Total Profit / After costs", or draw a fitted demand curve through the pair's dots — and
**`npm test` stays 461/461 green and the L1 harness still says ALL 16 PROPERTIES HOLD.** Every
protection this module has stops at the module boundary. That is why the rulings below are written
as a binding pre-build list rather than a post-build gate, and why R-1 (a rendered-claim limb on the
client) is the first required repair.

---

## 1. RULINGS — reference element → conflict → ruling → truthful replacement

Format: **REFERENCE ELEMENT** → WHY IT CONFLICTS (or does not) → **RULING** → THE TRUTHFUL
REPLACEMENT, computed from what the model actually reports.

### 1.1 STUDENT pricing screen (reference §1)

**E1 · "PROJECTED ATTENDANCE 15,250 / 72% of Capacity", "PROJECTED REVENUE $1,739,000",
"PROJECTED PROFIT $689,000" as pre-lock stat cards.**
Conflict: BC-4 and `fullHouse.ts:9-15` ("there is no revenue preview of any kind, and nothing
derived from the pending action is ever in the pre-lock view"). The model exposes no such field and
`fullHouse.test.ts:181` forbids the key names — but the client could compute them anyway (§0), and
economically they destroy the lesson: with a projection on screen the price dial becomes a search
over a printed answer instead of reasoning from a card.
**RULING: FORBIDDEN. Never ship, in any form, on any surface, at any confidence, including as a
range, a band, a "rough guide", a greyed-out placeholder, or a bar that moves as the dial moves.**
Replacement — the same four-card row, all four values already in the pre-lock payload
(`studentView` PLAY, OBSERVED):
1. **TONIGHT'S CARD** — `card.day` · `card.visitor` · `DRAW card.draw / 100` · `TV card.tv`.
2. **YOUR BUILDING** — `market.capacity` seats with `market.capacityNote` printed at point of use
   (`"listed basketball capacity 19,812 · 2025-26"` / `"modeled seat count … 16,667"`), and
   `market.bill` as TONIGHT'S BILL, `market.planPrice` as SEASON-PLAN PRICE.
3. **CASH** — `books.cash`, with `books.inDebt` state.
4. **RENEWALS** — `books.renewals` %, at the same figure size as CASH.
No fifth card. No card whose number changes when the dial moves.

**E2 · "DEMAND AT A GLANCE" — a downward-sloping curve with the current price plotted on it, footnote
"• Higher prices reduce demand."**
Conflict: two separate defects. (a) The curve is the hidden object — `base`/`sens` are module-scope
constants that "never leave this module" (`fullHouse.ts:27-33`) and `fullHouse.test.ts:223` asserts
their values never reach a view; drawing the shape is a preview even when the numbers are omitted.
(b) The footnote states the lesson's finding before Night 1. `teacherDirector` HOOK
`dontExplainYet` (OBSERVED, `fullHouse.ts:2945-2948`) says in the product's own words: *"Do not tell
them the crowd shrinks when the price goes up. They find that in their own numbers at the first
reveal."* A screen that prints it has overruled the teacher script.
**RULING: FORBIDDEN — both the curve and the footnote.**
Replacement: **YOUR NIGHTS SO FAR** (see E3), with no sentence about what price does to demand.

**E3 · "your own history" as a price → turnout chart pre-lock (the Boss lead's proposed replacement
for E2). ALLOWED, WITH FOUR BINDING CONSTRAINTS.**
It adds no information: `studentView` PLAY already carries `history[]` with `price`, `turnout`,
`fillPct`, `seatsOpen`, `net` per settled night, rendered today as `fhHistoryHtml`. Re-plotting it
is a re-render of settled facts the pair owns. But four things would turn it into a false claim:
1. **No joined line, no fitted line, no trend line, no shaded band, no extrapolation.** Each night
   is a different demand world (`curveFor` re-derives `base` and `sens` per card). Joining N1→N2→N3
   draws a relationship the model does not contain. This is `revenueCardBody`'s own B5 repair
   (`fullHouse.ts:3291-3299`: the card used to quote a Memphis N1 beside a New York N4 "with the
   HIGHER price drawing the BIGGER crowd") and R9 (`fullHouse.test.ts:805` — every curve point must
   carry its `marketId` AND its `cardId`). **Dots only, each dot labelled with its night's card.**
2. **The pending night gets no mark on those axes** — no dot, no vertical rule at the current dial
   price, no crosshair, no "you are here". A price tick on an axis of realized turnouts is an
   invitation to interpolate a turnout, from points on other cards. That is a projection built by
   the reader instead of by the code; BC-4 does not care which.
3. **Own desk only.** `/play` never shows another seat's data (`fullHouse.test.ts:279`).
4. **At most one dot per card exists pre-lock** (only N1 and N5 share a card, and N5 is the last
   night) — so the chart can never show two comparable points before the end. The caption must say
   so, in the board's own discipline: *"One dot per night. Two nights are only comparable when the
   card is the same."*
Honest title: **YOUR NIGHTS SO FAR**. Axes: price (x), people who came (y).

**E4 · "Your Goal / Maximize Revenue" card (top-right, on every student screen), and the reference
subtitle "Set your ticket price to maximize revenue and fill your arena."**
Conflict, three ways. (a) `OBJECTIVE_COPY` (`fullHouse.ts:1700`) is the registered objective and it
says the opposite: *"You are keeping two books, and they do not add up to one number… A price that
is great for one is usually worse for the other — that is the job."* (b) "Revenue" is the wrong
book: the model settles `net = gate + inArena − bill − spend − bowlCost`; ticket revenue alone
(`gate`) peaks at a **different price** from total revenue on every card — that is the whole Two
Peaks reveal (`ticketPeakPrice` $42 vs `totalPeakPrice` $34 at NY N1; $98 vs $90 at NY N4 —
OBSERVED). A goal card saying "maximize revenue" names the quantity the lesson exists to show is
the wrong one. (c) "…and fill your arena" states two objectives as if aligned. **OBSERVED: on 8 of
10 market-nights the cash-best price does NOT fill the building** (fill 60.0%–81.8%), and the best
reachable sellout is worth **28%–68% of best cash** on the quiet nights (NY N1 sellout $74,000 vs
$215,384 best; NY N3 $74,000 vs $260,100). At Memphis, N1/N3/N5 **cannot be sold out at any legal
price at all**.
**RULING: FORBIDDEN as written. ALLOWED as a two-book goal card only.**
Replacement — a goal card that carries **two figures side by side, equal weight**: `CASH` and
`RENEWALS`, under one registered line, `OBJECTIVE_COPY`, verbatim. Never a single objective, never
the word "maximize" applied to one book, never "fill your arena" as a goal.

**E5 · "KEY INSIGHT" card (bulb badge, two lines of advisory copy) on the PRE-LOCK screen.**
Conflict: any advisory copy that changes with the dial, or that hints where to price, is coaching
toward a hidden optimum and defeats blind commitment. The reference's own synthesis screen shows
what this slot fills with ("Higher prices reduced demand") — pre-lock that is E2's footnote again.
**RULING: FORBIDDEN as adaptive/advisory copy pre-lock. ALLOWED only as a fixed slot rendering
registered rule text verbatim.**
Replacement, all already in the pre-lock payload: `rules` (`HOUSE_RULES[0..4]`),
`market.spendRule` (`spendRuleFor`), `renewalRule` (`renewalRuleFor`),
`modeledDollarsLine`, and `spendReceipt.label` when last night's spend > 0. These are *rules of the
game a real desk knows*, not previews — the distinction the module itself draws
(`fullHouse.ts:1946-1953`). Nothing in this slot may be a function of the current dial position.

**E6 · Sidebar nav "Overview · Pricing · Forecast · Arena · Finances · History".**
Conflict: **"Forecast"** names a screen whose existence is the thing BC-4 forbids; a nav item is a
claim that the product makes one. "Finances" invites a single P&L.
**RULING: "Forecast" FORBIDDEN as a label anywhere on any surface. The rest is not my category.**
Replacement: lesson identity, NIGHT N OF 5 pips, desk identity (`handle`, `crestIndex`, `club`,
`building`) — no fictional destinations.

**E7 · "ARENA CAPACITY 21,000" stat card, and "of 21,000 Capacity" as an attendance qualifier.**
Not a conflict in principle — capacity is a printed operating fact and is already in
`marketFacts`. Two constraints. (a) The season stamp travels with the number at point of use
(`fullHouse.test.ts:852`, gate-l1-sr F4). (b) **On Night 4 the denominator is not capacity.**
`settleNight` computes `seatsOpen = capacity + (openBowl && bowlOffered ? bowlSeats : 0)` and
`fillPct = turnout / seatsOpen` (`fullHouse.ts:497-507`, OBSERVED). At NY N4 $84 the same 17,100
people render as **86.4% (bowl closed) or 77.0% (bowl open)**.
**RULING: ALLOWED with the exact qualifier "of the seats you opened tonight" wherever a fill
percentage or an attendance ratio is shown; "of Capacity" is FORBIDDEN on any night the upper-bowl
option can be open.**

### 1.2 STUDENT round results (reference §2)

**E8 · "Target: $110–$120" pill beside the price.**
Conflict: it is the hidden optimum, and it is also **wrong in this model**. OBSERVED: cash-best is
$24–$48 on four of five nights and $84–$90 on Night 4; at $120 turnout is **0** and net is
**−$520,000 (NY) / −$280,000 (MEM)** on N1, N2, N3 and N5.
**RULING: FORBIDDEN. Blocking. No target band, no "recommended range", no green zone on the dial,
no colouring of the slider track by outcome quality.**
Replacement: nothing. The price stands alone as the hero figure.

**E9 · "+1,250 vs. projected attendance" / "+$139,000 vs. projected revenue" delta pills.**
Conflict: there is no projection (E1). **And the Boss lead's PRELIMINARY ADAPTATION — "replace with
the pair's own night-over-night deltas" — is itself unsafe and I am overturning it in part.** A
Night 2 → Night 3 attendance delta is a comparison across two different demand worlds; attributing
it to the price is exactly the defect B5 removed from `revenueCardBody` and the reason
`shifterCardBody` refuses to quote two different prices without saying "part of that gap is the
price" (`fullHouse.ts:3390-3399`, OBSERVED). A bare "+1,250 ▲" pill makes that attribution
typographically.
**RULING: "vs. projected" FORBIDDEN. Bare night-over-night delta pills FORBIDDEN. Same-card
comparison ALLOWED with the module's own decomposition.**
Replacement, two allowed forms only:
- **The night's own settled facts, undelta'd** — all present in `viewNight` (OBSERVED): `price`,
  `turnout` of `seatsOpen`, `fillPct`, `turnedAway`, `gate`, `inArena`, `bill`, `spendPaid`,
  `bowlCost`, `net`, `renewalsBefore → renewalsAfter` (`renewalMove`), `spendVerdict`, `resaleNote`.
- **N1 → N5 only** — the one same-card comparison the lesson licenses — and it must render
  `repeatRowFor`'s computed channel split (`renewalsFans`, `carryFans`, `priceFans`, `clamped`,
  `floored`, `biggestChannel`, `channelLine`), not an arrow. This is `econ-l1-n5-attribution`'s
  discharge; a delta pill re-opens it.

**E10 · "TOTAL REVENUE $1,739,000 · What fans paid" and "TOTAL PROFIT $689,000 · After costs" as a
five-figure result row.**
Conflict, three ways. (a) `$114 × 15,250` is **ticket revenue = `gate`**, not total revenue; the
model's `total = gate + inArena`, and the entire Two Peaks card exists because those two maximise at
different prices. Labelling gate "Total Revenue" pre-empts and contradicts
`THE TICKET IS NOT THE PRODUCT`. (b) "Profit" is not the module's word and it is a single number
that reads as *the score*; the lesson's spine is "two books that cannot be summed"
(`fullHouse.ts:17-25`, `OBJECTIVE_COPY`, the `TWO BOOKS, NO EXCHANGE RATE` card). (c) "After costs"
is false unless the event spend and the bowl cost are inside it — `net` subtracts `bill`, `spend`
**and** `bowlCost`.
**RULING: "TOTAL REVENUE" as a label for `gate` FORBIDDEN. "PROFIT" and "After costs" FORBIDDEN as
labels. A single money hero on the results screen FORBIDDEN.**
Replacement — the module's own vocabulary and its own decomposition, rendered as a chain, with
RENEWALS at equal weight beside it:
```
TICKETS      gate      = price × people who came
IN-ARENA     inArena   = what those same people spent inside
              total    = gate + inArena
BUILDING BILL  − bill
EVENT MONEY    − spendPaid   (and − bowlCost on Night 4 if the bowl was opened)
CASH  net
RENEWALS  renewalsBefore → renewalsAfter  (renewalMove)
```
plus one registered line stating that CASH and RENEWALS do not add up. Two books, two figures,
never one.

**E11 · "ARENA FILL" radial gauge, 72% inside, "15,250 / 21,000" beneath.**
Not a conflict as a fact — `fillPct`, `turnout`, `seatsOpen` are all in `viewNight`.
**RULING: ALLOWED as one figure among the row, with the E7 denominator label ("of the seats you
opened tonight"). FORBIDDEN as the hero of the results state, and FORBIDDEN as anything that reads
as a score** (no target ring, no colour that goes green near 100%, no "you reached X%").
Reason (OBSERVED): fill and cash conflict on **8 of 10 market-nights**; a fill gauge given hero
treatment teaches "fill the building", which is false in this model on the quiet nights and
**structurally unreachable at Memphis on N1/N3/N5**. A fill-led results screen re-creates the R8
small-market defect visually after the constants repaired it numerically.

**E12 · "ARENA OUTCOME" panel — lit arena encoding realized fill, legend Filled / Available /
Unavailable.**
**RULING: ALLOWED, and it is the right home for the wave's cinematic budget — with four binding
encoding rules.**
1. It renders the **settled** night only. Never the open night, never a preview, never a fill
   picture that moves with the dial.
2. Lit seats are `turnout / seatsOpen`, **not** `turnout / capacity`. On Night 4 the upper bowl is a
   third state: "Unavailable" if `openBowl` is false, part of the lit/available pool if true. Label
   it, because opening it **lowers** the fill percentage at the same crowd (OBSERVED: NY N4 $60,
   closed → 100% fill / 900 turned away / net $1,024,400; open → 93.2% fill / 0 turned away /
   net $999,600).
3. It may carry `turnedAway` as a count outside the bowl. It may not convert turned-away fans into
   money — `resaleNote` exists precisely to say *"That money is not missing from your books — you
   never asked for it"* (`fullHouse.ts:1936-1939`), and the selection econ review's own repair was
   that the resale line is **not** counted as a second dollar loss anywhere.
4. It sits in the same frame as the CASH/RENEWALS chain (E10), never alone and never above it.

**E13 · Sellout headline — "FULL HOUSE", turned-away count, resale note.**
**RULING: ALLOWED as a factual headline; FORBIDDEN as a triumph.**
- Allowed: `FULL HOUSE · 17,794 of 17,794 · 7,796 turned away` — every number is `viewNight`'s
  (`soldOut`, `turnout`, `seatsOpen`, `turnedAway`). Allowed loud: an edge flash, a fully lit bowl.
- Forbidden: any word or glyph that grades it — "Great night", "Sold out! Nice work", a trophy, a
  star, confetti, a rising-streak meter. OBSERVED: the best reachable sellout is worth **34% / 68% /
  28% / 93% / 34%** of best cash at New York on N1–N5. A sellout is usually the *cheap* answer, and
  Night 4 is the only night where it is nearly the right one. The headline states the fact; the
  money chain in the same frame does the arguing.
- The `resaleNote` string must be rendered **verbatim from the module**, not paraphrased. It is the
  one sentence keeping turned-away fans from being read as lost revenue.

**E14 · Footer strip: trophy glyph + "Strong Round! You're building momentum. Keep optimizing to
maximize profits."**
Conflict, three ways, any one of which is disqualifying. (a) D4 / `no-gamification-layer` — trophy,
"Strong Round", momentum are reward chrome, and `fullHouse.test.ts:813` already forbids the whole
vocabulary (`rank`, `winner`, `score`, `badge`, `xp`, `level`) from board payloads. (b) **"Strong"
is an evaluative claim the model cannot make**: there is no single objective to be strong on, and
`teacherDirector` HOOK instructs the teacher, in the product's own words, *"DO NOT evaluate them —
no 'good', no 'that's high'. You are collecting, not marking."* A screen that grades the pair
overrules the teacher script. (c) "Momentum" names a mechanic that does not exist — the model has
path dependence through two named channels (`renewalsFans`, `carryFans`), which is not directional
and not a streak; and "maximize profits" is E4's single objective again.
**RULING: FORBIDDEN, all four elements (trophy, "Strong Round", "momentum", "maximize profits").
Blocking; recorded as dissent.**
Replacement: the night's **factual headline** — `NIGHT 2 · 14,875 CAME AT $84` or the E13 sellout
line — and the forward control. No adjective.

**E15 · CTA "Adjust for Next Round → Review insights and set your next price."**
"Insights" implies the product will tell them something. **RULING: ALLOWED with copy replaced** —
the next night's printed card is the only thing forward: `nextCard` carries day / visitor / draw /
TV only (`cardView`, no outcome). Suggested: `NEXT: NIGHT 3 → Wednesday · Draw 88 · national TV`.

### 1.3 PROJECTOR — CLASS RESULTS (reference §4)

**E16 · Table columns "TICKET PRICE · ARENA FILL · TOTAL REVENUE (All Tickets) · TOTAL PROFIT
(After costs)", one row per team.**
Conflict, and this is the largest gap between the reference and the product. **`CurvePoint` — the
only per-desk record any board frame receives — carries no money at all**
(`fullHouse.ts:985-993`, OBSERVED: `marketId`, `cardId`, `deskHandle`, `price`, `turnout`,
`fillPct`, `soldOut`). Per-desk cash and renewals are **never** on the projector; the board's money
is per-market **medians** at the season-books reveal stage (`medianCash`, `medianRenewals`,
`bestFillPct`). Building the reference's revenue and profit columns therefore is not a visual job —
it requires adding per-desk money to `boardView`, which is exactly the money leaderboard
`fullHouse.test.ts:813` (D4 / R13) exists to prevent.
**RULING: A per-desk REVENUE column is FORBIDDEN. A per-desk PROFIT column is FORBIDDEN. A single
"profit" column collapsing the two books is FORBIDDEN twice over.**
Replacement — the CLASS RESULTS frame keeps the reference's grammar (big rows, one bar beside every
number, few columns) with the columns the model actually reports:

| column | source | notes |
|---|---|---|
| DESK | `deskHandle` (`"Desk N · <handle>"`) + `marketId` crest | fictional handles only; **stable desk order, never sorted by outcome** |
| TICKET PRICE | `price` | |
| WHO CAME | `turnout` + bar | the bar is the comparison |
| FILL | `fillPct` + `soldOut` flag | label "of the seats that desk opened", see E7/E19 |

Rows are grouped by market and by card — one frame is **one night in one building**, never five
nights on one table, never two markets in one bar chart (B5). Money appears once, at the season
books stage, as `medianCash` / `medianRenewals` **per market**, two figures, unsummed.

**E17 · Discussion prompt "Why didn't the highest price always win?"**
Conflict: **the model does not support this for every class, and it is reliably false on the
lesson's biggest night.** OBSERVED, 4,000 simulated 6-desk classes per cell:

| pricing behaviour | N1 | N2 | N3 | **N4** | N5 |
|---|---|---|---|---|---|
| timid ($10–$40) | 37.8% | 65.0% | 58.1% | **98.7%** | 36.7% |
| mid ($20–$60) | 0.7% | 25.0% | 4.3% | **100.0%** | 0.7% |
| spread ($10–$120) | 0.4% | 0.5% | 0.3% | **31.6%** | 0.6% |

(figures = share of classes in which the highest-priced desk **also** had the highest cash). On
Night 4 with any realistic pricing the highest price wins in 99–100% of rooms. On Nights 1/3/5 with
a timid room it still wins 37–58% of the time. A prompt that presupposes the answer will be refuted
by the class's own table in front of the class.
**RULING: FORBIDDEN as printed. Blocking; recorded as dissent.**
Replacement: the module's registered, guarded prompts only — `ADAPT_QUESTIONS[0..2]`, `ARGUE_PROMPT`
and `EXIT_PROMPT`, rendered verbatim. Note that these were built with guards the reference prompt
lacks: `revenueCardBody` falls back to *"tonight the room did not give us two desks in the same
building charging different prices"* when the pair does not exist. If the wave wants a
highest-price prompt it must be **unpresupposing**: *"Find the highest price on this frame. Did it
bring in the most money? Why, or why not?"* — true whichever way the room went.
Non-blocking note on the existing copy: `ARGUE_PROMPT` does assert an outcome (*"Somebody in this
room made more money by charging less"*). OBSERVED it holds season-wide in **84.5%** of the worst
case (4 desks, all prices $10–$40) and **100%** of every other cell I swept — acceptable as a
season-wide claim, but the rebuild must **not** promote it to a per-night headline, where it
becomes as fragile as E17.

**E18 · "ALL TEAMS · 21,000 Total Capacity" rail card.**
Conflict: the two markets have different capacities (19,800 / 17,794) and Night 4 changes
`seatsOpen` per desk. One class-wide capacity number is arithmetic over two different buildings.
**RULING: FORBIDDEN as a single number.** Replacement: per-market capacity with `capacityNote`,
which the board already carries in LOBBY and HOOK.

**E19 · Arena-fill picture on `/board` pre-reveal, for closed nights.**
**RULING: ALLOWED for settled nights only, with one blocker on today's payload.**
`boardView` PLAY carries `curves` filtered to `settledCards` — "Curves for nights ALREADY settled
only. Nothing about the open night is on the projector while it is still open (R13)"
(`fullHouse.ts:2492-2494`, and `fullHouse.test.ts:631`). So per-desk fill for closed nights is
supported. **But `CurvePoint` has no `seatsOpen` and no `openBowl`** — the board cannot honestly
draw a bowl at a fixed 19,800 seats for a Night-4 desk that opened the upper bowl. Two legal
options: (i) draw only the `fillPct` proportion with the label "of the seats that desk opened", or
(ii) add `seatsOpen` and `openBowl` to `CurvePoint`, which is a module change and must come back
through Economic Truth before it ships.
Also binding: **the held state stays held.** When all five nights are closed, `boardView` returns
`{ allNightsDone: true, curves: [], held: true }` deliberately (gate-l1-projector repair 3,
`fullHouse.ts:2464-2480`). The rebuild must not fill that frame with an arena picture assembled
client-side from anything; the staged REVEAL is the first time the room sees the whole picture.

**E20 · Arena-fill picture on `/play` pre-reveal.**
**RULING: ALLOWED.** It is the pair's own settled data, already in `history` / `lastNight`, on a
private surface. Constraints: settled night only (never the open night), `seatsOpen` denominator
(E7), own desk only, and it must not be reframed as a target.

**E21 · "Reveal Class Results" as one solid loudest button.**
Conflict: REVEAL is seven staged presses (`REVEAL_STEPS = NIGHT_COUNT + 2`), and the one-shot dump
is the exact defect gate-l1-projector repair 3 removed.
**RULING: ALLOWED as the loudest control, FORBIDDEN as a one-shot label.** It is
`#btnRevealNext` / the phase advance; label it as staging (`REVEAL NIGHT 1 →`, then the stage's own
`REVEAL_STAGES[n].headline`), and keep the stage `say` line beside it for the teacher.
**"Open Projector View" must open `/board`, never mirror the `/teach` DOM** — `boardView` is
structurally never handed a seat identity (`fullHouse.test.ts:263`) and a screen-mirror would route
around that guarantee.

### 1.4 TEACHER — live class director (reference §5)

**E22 · Per-desk "Proj. Attendance".**
Conflict: the model makes no projection on any surface, and the teacher payload carries no demand
constant (`fullHouse.test.ts:223` sweeps `teacherView` too). Building it means putting the hidden
curve into the teacher's client — one screenshot, one over-the-shoulder glance, one projector
misclick from being in the room.
**RULING: FORBIDDEN.**
Replacement, all present in `teacherView().desks[]` (OBSERVED): `locked` / not, `price`, `spend`,
`openBowl` (or "not yet"), `lastFillPct`, `nightsPlayed`, `joinedAtNight`, `cash`, `renewals`,
`inDebt`, `heldSamePriceRun`.

**E23 · Per-desk "Readiness" score (four dots).**
Conflict: a scalar readiness is a rating the model does not compute, and on the teacher's monitor
wall it will be read as a ranking of pairs.
**RULING: FORBIDDEN as a score. ALLOWED as the module's own discrete states.**
Replacement: three-state pill from `locked` + `nightsPlayed` (LOCKED IN / ADJUSTING / NOT STARTED —
the reference's own green/amber/red pill grammar maps cleanly), plus the module's registered flags
from `teacherWatchFor`: `stalled`, `repeat-price`, `held-price` (with `heldSamePriceRun`),
`turned-away`. These are facts with a stated trigger, not a judgement.

**E24 · "Time Remaining · radial 08:42 of 15:00".**
Conflict: a countdown budget the lesson does not set; teacher pacing is manual with a manual
fallback; and a countdown on a surface that can be projected becomes a student-facing timer.
**RULING: FORBIDDEN as a countdown. ALLOWED as an elapsed clock, teacher-only.**
Replacement: elapsed class time + elapsed phase time, beside the phase's own registered
`minuteBudget` from `teacherDirector` (`"2 min"` LOBBY, `"3 min"` HOOK, …) and the registered
`timeCut` line (*"Past minute 45? Drop the Night 4 capacity-option discussion and go straight to the
Night 1 vs Night 5 chart."*). **Implementation note, and it is a real one:** `createdAt` exists on
`SessionRow` (`runtime/src/server/types.ts:46`) but is **not exposed to `/teach`** today (OBSERVED —
no `createdAt` reference in `runtime/src/server/*.ts` API paths or `teach/main.ts`). A client-only
clock resets on refresh, which breaks the module's own restart-survival posture. Expose the
timestamp server-side or do not ship the clock. Never on `/play`, never on `/board`, never
auto-advancing anything.

**E25 · "Class Status ● Live / Students connected 28 / 30".**
Conflict: "of 30" is a roster the product does not have.
**RULING: denominator FORBIDDEN; connected desk count ALLOWED** (`deskCount`, `lockedCount`).

**E26 · "Class Chat", "Add Time +2:00", "Pause Round".**
**RULING: Chat and Add Time FORBIDDEN (features that do not exist). "Pause Round" ALLOWED renamed**
to the existing Pause / Freeze controls. Not primarily my category; recorded because "Add Time"
implies E24's budget.

### 1.5 STUDENT — economics synthesis (reference §3)

**E27 · Four reference concept cards vs the module's six.**
The module ships **six** cards, computed from this class's locked-at-time numbers
(`synthesisCards`, D15, `fullHouse.test.ts:740`), staged by the teacher one page at a time
(`SYNTH_CARDS_PER_PAGE = 1`), with a student mirror. The reference's four are a subset plus one
invention. Mapping and rulings:

| reference card | module card | ruling |
|---|---|---|
| Demand curve with the pair's point | `THE CARD MOVED THE CROWD` / `REVENUE = PRICE × PEOPLE` | **ALLOWED only as the class's realized dots for ONE market × ONE card. A smooth fitted curve through the pair's point is FORBIDDEN** — it draws the hidden object (§E2) and asserts a shape (`SIMPLIFICATIONS[0]`: "one straight demand line per night, with a fixed slope printed nowhere"; its recorded risk is precisely "a student may think… a club knows its own line"). |
| Revenue equation `$114 × 15,250 = $1,739,000` with Price / Quantity / Revenue captions | `REVENUE = PRICE × PEOPLE` | **ALLOWED with the exact caption replacement.** `price × people = GATE (ticket money)`, then `+ in-arena = the night's total`, then `− bill − event money = CASH`. Captioning the product "Revenue" full stop contradicts `THE TICKET IS NOT THE PRODUCT` on the adjacent card. Numbers must come from `revenueCardBody`'s chosen group (same market, same card, `high.turnout < low.turnout` guard) or from the pair's own `history` — never from a worked example. |
| Demand Shifters, four icon chips **including "Weather"** | `THE CARD MOVED THE CROWD` | **"Weather" FORBIDDEN.** It is not in `curveFor`; it contradicts the registered pre-commit rule `HOUSE_RULES[1]` (*"there is no luck in this game"*); and `SIMPLIFICATIONS[8]` records the opposite as a deliberate design fact (*"No randomness at all: no weather, no injuries, no winning streak"* — because "every outcome must be attributable to the pair's own decision, or the debrief is a shrug"). **ALLOWED with this exact chip set:** *tonight's card* — DAY (Tuesday / Saturday), THE VISITING CLUB'S DRAW (out of 100), TV (none / local / national); and, in a **visually separate group labelled "carried from an earlier night"** — YOUR RENEWALS, LAST NIGHT'S EVENT MONEY. **The event-money chip may never sit in the "what moved tonight's crowd" group**: `HOUSE_RULES[2]` and `spendRuleFor` both state it lands on the NEXT night, and `SIMPLIFICATIONS[2]` records that confusing the two channels is the module's named misconception risk. |
| Tradeoffs, a **balance scale** | `TWO BOOKS, NO EXCHANGE RATE` | **The balance-scale illustration is FORBIDDEN.** A scale is a picture of commensurability — one beam, one common unit — and the card's title, its body ("You cannot add a dollar to a renewal"), and `OBJECTIVE_COPY` all say the opposite. This is the module's central formalization and the visual would refute it. **Replacement:** two axes, not one beam — the season frontier the model already computes (`seasonFrontier` / `bestFoundSeason` / `renewalsCornerSeason` / `renewalMarginalCost`): cash on one axis, renewals on the other, the two printed corners marked, and the card's own rising-marginal-cost sentence ("$715 cheapest, $51,478 for the last point") beside it. `SIMPLIFICATIONS[4]` records that the rise is a trend and not monotone — do not draw a smooth convex curve; draw the frontier's own points. |
| — | `THE TICKET IS NOT THE PRODUCT` (Two Peaks) | **Must survive the rebuild.** Two money lines from one desk's own night; `TwoPeaks` carries `ticketPeakPrice`, `totalPeakPrice`, `gapDollars`, `gapSteps`, and the three revenue figures. |
| — | `NIGHT 5 WAS NIGHT 1` (path dependence) | **Must survive verbatim.** This is the module's most-repaired card (`econ-l1-n5-attribution`), it is the only string under a harness render limb (P16), and its branch logic (`floored`, `bothFloored`, `renewalsLed`, `biggestChannel`) must not be re-authored in the client. |
| — | `YOUR JOB IS REAL` (`DYNAMIC_PRICING_COPY`, dated 2009) | Must survive; season stamp asserted by `fullHouse.test.ts:828`. |

**RULING on card count: the six cards, their order, their staging (one per page, teacher-paced) and
their bodies are NOT the visual wave's to change.** The wave gives them the reference's grammar
(icon badge, name, one computed visual, one takeaway line) and nothing else.

**E28 · Synthesis "Key Insight — Higher prices reduced demand."**
**RULING: ALLOWED at SYNTHESIS only (past tense, after the evidence), and only as a computed,
guarded line — never a static string.** `revenueCardBody` already carries the guard
(`high.turnout < low.turnout`) and the honest fallback for a room that produced no comparable pair.
A hardcoded literal would be false in exactly the rooms the guard exists for.

**E29 · "Plan Next Round →" CTA at the end of synthesis.**
There is no next round. **RULING: FORBIDDEN.** Replacement: `EXIT_PROMPT` verbatim — *"Which night
did you get wrong, and what on the card should have told you?"* — and `BEYOND_SPORTS_LINE`.

**E30 · Sidebar "Round 3 of 4" → "Night N of 5".**
**RULING: ALLOWED as relabelled** (`NIGHT_COUNT = 5`). No economic content.

---

## 2. RENDERED-CLAIM BASELINE

What the rebuild must preserve verbatim, or re-register. "Verbatim" means: the string reaches the
DOM as the module produced it. No client-side paraphrase, no truncation, no re-authoring of a
sentence's branch logic in the renderer, no interpolating a number into a template the client owns.

### 2.1 Registered copy constants (module-owned, exported — render verbatim)

`runtime/src/modules/fullHouse.ts`: `HOOK_COPY` (1697) · `OBJECTIVE_COPY` (1700) ·
`HOUSE_RULES[0..4]` (1703) · `BOARD_HONESTY_LINE` (1731) · `HORIZON_LINE` (1741) ·
`MODELED_DOLLARS_LINE` (1744) · `SOURCE_NOTES[]` (1748) · `SIMPLIFICATIONS[]` — 9 entries, each
`{what, why, risk}` (1764) · `SHOCK_REVEAL_COPY` (1827) · `CAPACITY_DEFENCE_COPY` (1841) ·
`DYNAMIC_PRICING_COPY` (1844) · `BEYOND_SPORTS_LINE` (1847) · `EXIT_PROMPT` (1850) ·
`ADAPT_QUESTIONS[0..2]` (1852) · `ARGUE_PROMPT` (1864) · `COMPLETE_COPY` (1867) ·
`RENEWALS_RULE_BOARD` (800) · `REVEAL_STAGES[1..7]` `{name, headline, say}` (751).

### 2.2 Computed claim strings (module-owned functions — call them, do not re-implement)

`spendRuleFor(market)` · `renewalRuleFor(market)` · `marketFacts(m).capacityNote`, `.plainLine` ·
`cardView(card).notes` · `viewNight().resaleNote` · `spendVerdictFor()` ·
`repeatRowFor().channelLine` (+ `floored`, `bothFloored`, `biggestChannel`, `renewalsFans`,
`carryFans`, `priceFans`, `clamped`) · `repeatSummary()` · `flooredLine` ·
`pathDependenceCardBody()` · `revenueCardBody()` · `shifterCardBody()` · the `two-books`
`seasonTradeoff` body · `teacherDirector()` (`minuteBudget`, `now[]`, `ask[]`, `dontExplainYet[]`,
`trigger`, `timeCut`) · `teacherWatchFor()` · `projectorMirror()` · `studentScreenMechanics()`.

**Two of these are under an active render limb** — `pathDependenceCardBody` and `repeatSummary`, via
`l1-tuning-harness.mjs` P16 (lines 1133, 1152). Every other string in 2.1 and 2.2 is under **no**
render limb; changing it or paraphrasing it in the client breaks nothing today. That is the gap
R-1 closes.

### 2.3 Payload fields the rebuild may render, and the ones it may not

May render (settled or printed): `card.*`, `nextCard.*` (printed facts only), `slate`, `market.*`
(`capacity`, `capacityNote`, `bill`, `planPrice`, `eventMax`, `bowlSeats`, `bowlCost`, `spendRule`),
`books.{cash,renewals,inDebt}`, `price`, `spend`, `openBowl`, `spendCap`, `priceMin/Max/Step`,
`spendStep`, `locked`, `history[]` (all `viewNight` fields), `lastNight`, `spendReceipt`,
`identity.*`. Board: `curves[]` (`marketId`, `cardId`, `deskHandle`, `price`, `turnout`, `fillPct`,
`soldOut`), `books[]` medians, `twoPeaks`, `repeatCard`, `totalTurnedAway` (final reveal stage only).

May **not** render, ever: anything named `base`, `sens`, `base0`, `sens0`, `drawBase`, `drawSens`,
`weekendBase`, `weekendSens`, `tvBase`, `tvSens`, `renewalFans`, `eventFans`, `planSlope`,
`premiumSpan`, `eventRenewalDollars`, `ancillary` as a rate, or any quantity computed from them for
a night not yet settled. And no client-computed value that is a function of the **pending** price,
spend or bowl toggle beyond echoing the dial's own dollar position.

### 2.4 Commands that prove drift is caught (and exactly what each one covers)

| command | what it proves | OBSERVED this session |
|---|---|---|
| `cd runtime && npm test` | Build + 461 tests. L1 payload discipline: BLIND COMMIT (`fullHouse.test.ts:181`), no demand constant on any surface/phase (223), `boardView` never handed a seat id (263), no cross-seat books (279), no money ranking on the board (813), season stamps at point of use (828, 852), locked-at-time synthesis (740, 789), curve points carry market+card (805). Also wraps the three tuning harnesses as tests 286/287/288. | **exit 0, 461/461**, 17.8 s |
| `node docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` | 16 constant/mechanism properties incl. P16's render limb over `pathDependenceCardBody` + `repeatSummary`. Exit code is the evidence. | **"VERDICT: ALL 16 PROPERTIES HOLD"** |
| `node runtime/scripts/e2e-m2l1.cjs` | Real browser through the full lesson at 3 and 12 desks; projector frame-fit and back-row type at 1366×768 and 1920×1080; every selector the rebuild will touch (`#fhPriceDial`, `#fhSpendUp/Down`, `#fhBowl`, `#fhLock`, `#btnCloseNight`, `#btnRevealNext`, `#btnCfPage`, `#btnSynthPage`, `.scatter-svg`, `.fh-repeat-row`, `#fhCfSummary`, `.cardgrid .synthcard`). Selector renames break it — that is the drift limb the rebuild will actually feel. | NOT RUN by me |
| `node runtime/scripts/e2e-m2l1-misclick.cjs` | The teacher-misclick / auto-resolve path. | NOT RUN by me |

**What none of these cover: the rendered DOM's economic claims.** No test in this repository opens
`runtime/src/client/**`. A pre-lock projection computed in `play/main.ts` is invisible to all four
commands.

---

## 3. THE TWO SIMPLIFICATIONS THE REBUILD ADDS, AND WHERE THEY MUST BE RECORDED

If the wave ships E12/E19/E20 (arena fill as a picture), it introduces two new simplifications that
belong in `SIMPLIFICATIONS`, because they are pictures of the model that the model does not make:

1. **Seats are drawn as an evenly-lit proportion of the bowl.** The model has one undifferentiated
   seat pool — no price tiers, no sections, no view quality. Misconception risk: a student reads the
   lit ring as "the cheap seats filled first", which is a mechanism this model does not have and
   which would change every answer if it did.
2. **The upper bowl is a Night-4-only third state.** `seatsOpen` changes the denominator, so the
   same crowd draws a shorter bar. Misconception risk (OBSERVED, NY N4 $60): opening the bowl
   *lowers* the fill picture while *raising* turnout and *eliminating* turnaways — a student reading
   the picture alone concludes opening the bowl was worse, when what changed was the denominator.
   `SHOCK_REVEAL_COPY` says the option is dominated on cash; it says nothing about the picture.

---

## 4. DISSENT

Recorded, category `economic-truth`, severity `blocking`, on four elements that must never ship in
any form: **E1** (pre-lock projected attendance / revenue / profit and the demand-at-a-glance
curve), **E8** ("Target: $110–$120"), **E14** (trophy + "Strong Round! You're building momentum.
Keep optimizing to maximize profits."), **E16/E17** (per-desk revenue/profit columns on the
projector, and the presupposing prompt "Why didn't the highest price always win?").

