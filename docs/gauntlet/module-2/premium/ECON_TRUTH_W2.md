# ECON_TRUTH_W2 — Economic Truth confirmation, `m2-visual-quality-war` wave 2

Actor `econ-truth-w2`, assignment `w2-econ-confirm`, port 4447. Head under test: git `6c4c7cc`.
I did not build any of this and I inherited no wave-1 verdict except the R-1..R-10 rulings I was
asked to confirm. Evidence labels: **OBSERVED** = seen in the DOM, in a screenshot, or in a command
I ran this session; **INFERRED** = read off source without exercising it; **NOT VERIFIED**.
Agent play is AGENT-PLAYTESTED, never human-tested. I modified no product source. `runtime/dist`
was not rebuilt; the two mutations ran against copies in my scratch folder.

What I ran: a 4-desk playtest of `/play` through all five nights, the sellout, two zero-turnout
nights and all seven REVEAL stages (`drive.cjs`, 1366x768); two independent R-1 mutation runs of
`runtime/scripts/e2e-m2l1.cjs` against scratch copies of `dist`; a standalone render of `arenaSvg`
at four fill levels. Full text of every state and every measurement is in `dump.json`.

## Highest severity first

### 1. BLOCKING — both new arena entries in `SIMPLIFICATIONS` describe an artifact that was not built (R-7 not discharged)

**1a. The drawn bowl is not "one evenly-lit proportion of a single pool". It fills inside-out through
three named tiers.** OBSERVED, `screens-w2-econ/arena-fill-ladder.png`: at 25% of 19,800 only the
rings nearest the floor are lit and the outer ring is black; at 50% the lower and club rings are
full and the upper ring is still black; the upper ring only begins to light past ~50%. Source
confirms it is deterministic, not decorative — `runtime/src/client/shared/arena.ts:163`:

```
const TIERS: Tier[] = [
  { key: "lower", out: "lowerOut", in: "lowerIn", sections: 28, share: 0.34, lift: 8 },
  { key: "club",  out: "clubOut",  in: "clubIn",  sections: 34, share: 0.16, lift: 1 },
  { key: "upper", out: "upperOut", in: "upperIn", sections: 42, share: 0.50, lift: -5 },
];
```
and `arena.ts:564-586`: `let remaining = soldOut ? capacity : turnout;` then each tier takes
`clamp(remaining, 0, tierSeats)` in order. The picture therefore asserts a seat-allocation
mechanism — the seats closest to the floor are taken first — that `settleNight` does not have.

The ledger entry added at 6c4c7cc says the opposite (`runtime/src/modules/fullHouse.ts`
SIMPLIFICATIONS): *"The drawn arena lights seats as one evenly-lit proportion of a single pool: no
price tiers, no sections, no view quality."* That sentence is false about the shipped renderer, and
its `risk` field then warns the teacher against precisely the misconception the renderer produces.

**1b. The Night-4 upper bowl is not "a third state of the same picture". The picture has no third
state, and the legend chip that would name it is unreachable.** OBSERVED at three bowl-closed desks
on Night 4 (`res-n4-d3.png`, `res-n4-d4.png`, and desk 4's measurement row in `dump.json`): the
legend reads `Came / Open seats` and nothing else; with the bowl open it reads
`Came / Open seats / Upper bowl open` (`res-n4-d1.png`). The renderer's own guard makes the closed
label dead code — `runtime/src/client/play/main.ts:2218`:

```
const bowlOffered = n.bowlCost > 0 || n.openBowl;
...
if (bowlOffered) legend.push([n.openBowl ? "#d98f3c" : "#0c0c14", n.openBowl ? "Upper bowl open" : "Upper bowl closed"]);
```
`bowlCost` is non-zero only when `openBowl` is true (`fullHouse.ts:497-507`), so `bowlOffered` is
true only when the bowl was opened and the `"Upper bowl closed"` branch can never render. The
consequence is on the one night the whole module turns on a capacity decision: a desk that kept the
bowl shut draws a fully lit three-tier building at 98.2% and is told nothing about the 2,400 seats
it chose not to open (`res-n4-d3.png`). E12 rule 2 ruled that state must be drawn and labelled.

**Why blocking, not advisory.** The honesty ledger is the instrument that makes a simplification
acceptable under CLAUDE.md §3. Two of its three new entries assert the opposite of what shipped, so
the teacher note that is supposed to defuse the misconception instead tells the teacher the
misconception cannot arise. Either repair discharges it: (a) distribute the lit proportion across
all three tiers so the picture matches the entry, or (b) rewrite both entries to record the
inside-out tier fill and the absent third state, with the misconception risk stated. (a) is smaller
and is what E12 rule 2 asked for.

### 2. IMPORTANT — R-1 is discharged for exact figures and for the vocabulary, and for nothing else. A rounded projection and a dial-driven picture both walk through it.

The whole-figure change at 6c4c7cc did **not** weaken the limb against a readable leak — I confirmed
that with my own mutation, not by reading the lead's. **Mutation C** (`e2e-mutation-C.log`) injects a
client-side settlement into a scratch `dist` and prints it in exactly the two forms the change was
accused of letting through, with no forbidden word anywhere so only the numeric limb can fire:
`16,862/19,800` and `$… total`. The limb went red at the first pre-lock state it audited:

```
Night 1 · desk1 · dials at rest: the pre-lock desk RENDERED turnout (16,862) for a night nobody
has locked — that is a preview of the pending action (BC-4 / R-1). Dials: $24, spend $0, bowl false.
```
Offline check of the matcher confirms the boundary: `"$14,142 total"`, `"14,142/19,800"` and even
`"Attendance14,142"` all tokenise to the whole figure and are caught; only `114,142`, `1,014,142`
and `14.1k` escape, and none of those is readable as a claim. **R-1's substring-to-whole-figure
change is confirmed harmless.**

The ceiling is elsewhere, and it is real. **Mutation D** (`e2e-mutation-D.log`) prints the same
projection **rounded to the nearest 100** (`"Tonight we look like about 16,900 people, a bit over
85% of the house"`) plus a violet bar whose width is `turnout/seatsOpen`. It passed **every**
Night-1 pre-lock state the limb audits — three desks, two states each — and tripped at Night 2 only
by coincidence, when the true `fillPct` happened to be exactly `100` and my integer `%` matched the
`${needle}%` string check. So:

- rounding, abbreviating (`14.1k`), or restating a settlement quantity approximately defeats the
  numeric limb entirely;
- a preview drawn as **geometry** (a bar width, a lit section, a gauge angle) is invisible to it by
  construction — the limb reads `innerText`;
- the limb never runs on the **results state**: `assertNoRenderedClaim` returns early when
  `view.locked` is true and is only called after `waitForNight`, i.e. after NEXT has been pressed.
  The sellout beat, `resultHeadline`, `spendVerdict` and `resaleNote` are under no rendered-claim
  vocabulary check at all. They pass on their merits today (finding 4 below), not because a limb
  says so.

None of this is a defect in the head — the head ships no projection. It is a statement of what the
green limb is evidence **for**, so that `VISUAL_REFERENCE_CONTRACT` G6 is not read wider than it is.

### 3. IMPORTANT — on the sellout frame the one sentence that stops 6,631 TURNED AWAY reading as lost money is below the fold

OBSERVED, `res-n4-d2.png` at 1366x768, `scrollY=0`: `6,631` is set at 40px, the second-largest
figure on the frame, immediately under the arena. `resaleNote` — *"Those seats changed hands again
outside the building. That money is not missing from your books — you never asked for it"* — is the
last paragraph of the WHAT HAPPENED card, whose header is not even in the first viewport
(`.fh-chain` bottom 688, and WHAT HAPPENED follows the NEXT control at ~730+). E13 required the
resale note in the same frame precisely because a turned-away count is otherwise read as revenue
left on the table. A pair that presses NEXT without scrolling — which the frame invites, the CTA is
above the note — reads the loud number and never reads the correction.

### 4. IMPORTANT — the sellout frame is the most decorated frame in the lesson, and a sellout is usually the cheap answer

OBSERVED, `res-n4-d2.png`: a gold-edged, warm-gradient banner around the FULL HOUSE headline, plus
the first-sellout edge flash. The words are clean (finding 6), but the chrome grades the outcome:
the loudest, warmest frame a pair can reach is the one it gets for underpricing. In my own run the
Memphis desk that held the plan price took **$218,232** CASH for its FULL HOUSE while the New York
desk at $60 with no banner took **$997,100** on the same night (`dump.json`,
`result-n4-desk2` / `result-n4-desk3`). E13 allows an edge flash and a fully lit bowl and forbids
the headline as a triumph; a persistent gold frame sits on the wrong side of that line. The CASH
chain in the same frame is the mitigation E13 asked for and it is present — this is a matter of
weight, not of a false sentence, which is why it is important and not blocking.

### 5. IMPORTANT — two different numbers labelled `CASH`, same frame, no qualifier

OBSERVED, `res-n4-d1.png`: the rail dock reads `CASH $1,885,992` and the chain twelve inches away
reads `= CASH $1,045,500`. One is the season book, one is tonight's. Nothing on the frame says
which is which. Same shape for RENEWALS (rail 26%, card 17% -> 26%), where the ending value at
least matches. This is not a false claim but it is an ambiguous one on the surface whose whole
argument is that there are exactly two books and you must know which one you are looking at.
Fix is one registered word in `chainLabels` or a `SEASON TO DATE` qualifier on the dock.

### 6. ADVISORY — small unregistered client sentences, and one carried one

The renderer's own header says *"every sentence carrying an economic claim comes from the payload …
and never from a literal in this file."* That is not true today.

- **Carried, pre-existing at 31fb8c8, not this wave's doing:** `renderFHReveal` composes
  *"$X lower — N clicks of the dial. **The cheaper ticket made more money.**"* as a client literal
  (`play/main.ts:2686`). The claim is model-true on the Two Peaks card (adding a per-head in-arena
  term always shifts the total-revenue peak below the ticket peak), but it is authored in the
  renderer, it is under no limb, and `clientClaims.test.ts` cannot see it — none of the thirteen
  forbidden words appear in it. Contract A9's *"grep test that client templates contain no
  unregistered economic sentences"* does not exist; only the vocabulary grep does.
- **New at 6c4c7cc, minor:** *"The season plan works out to $16 a seat, and that is the only number
  you have"* (the empty state of YOUR NIGHTS SO FAR) — mildly false, the pair also has the bill, the
  capacity, the Draw and the TV listing, all printed on the same screen. And *"Nothing. Tonight is
  the last night of the five — money spent on the event tonight has no night left to land on"* —
  true against `spendRuleFor` and the settlement, but unregistered.
- **`after the bill`** under the rail's CASH is an incomplete decomposition: CASH also nets event
  money and the bowl cost. Harmless beside the chain, wrong if read alone.

## What I confirm

| ruling | verdict | evidence |
|---|---|---|
| **R-1** client rendered-claim limb bites; whole-figure change did not weaken it | **CONFIRMED**, with the ceiling in finding 2 | OBSERVED, mutation C red at the first state; matcher boundary checked offline |
| **R-2** fill always "of the seats you opened tonight" | **CONFIRMED** | OBSERVED at all 20 settled desk-nights: hero line, arena legend line, and the N4 bowl-open denominator 22,200 (= 19,800 + 2,400). `"of capacity"` count **0** across every captured state |
| **R-3** two books never summed, never one "profit", never one row | **CONFIRMED** | OBSERVED: chain is TICKETS / + IN-ARENA / − BUILDING BILL / (− EVENT MONEY) / (− UPPER BOWL) / = CASH; RENEWALS is a separate card, `renewalsBefore → renewalsAfter`, never green, never money-coloured; no rendered figure is a function of both books; no label says profit, revenue or after costs |
| **R-4** no evaluative or target-bearing copy | **CONFIRMED** | OBSERVED: a scan of every captured `/play` state for `project forecast estimate expected preview target profit readiness momentum "time remaining" "strong round" "of capacity" weather` returns only `preview`, and only inside `HOUSE_RULES[0]` and the module's own `message` ("No preview…"). A second scan for `great strong nice congrat trophy badge rank score optimi maximi "should have" "too high" "too low" best worst winner streak` returns **nothing** in the Full House region (the three hits in the file are in M2 L2 and L3 code) |
| **R-7 / R-10** three new SIMPLIFICATIONS entries | **R-10 CONFIRMED. R-7 REFUTED** — see finding 1 | R-10's entry states the forgiveness line is `renewalReferencePrice`, moves per card, is never printed, and that a pair generalising from Nights 1–3 is wrong on Night 4 with renewals GAINING at the season-high price. My own run reproduces it: NY desk 1 at **$90 on Night 4 went 17% → 26%, up 9 points**, after going 50% → 30% at $34 on Night 1 (`dump.json`). Honest, complete, risk stated. All three entries reach `/teach` (`fullHouse.ts:2552` → `teach/main.ts:753`, behind a `<details>`) |
| **R-9** student Two Peaks gate | **CONFIRMED** | OBSERVED in the browser: no Two Peaks panel on a student desk at REVEAL stages 0–5, first appears at stage 6 (= `NIGHT_COUNT + 1`), matching `boardView`. Gate is on the payload, not the renderer, and is asserted by a module test over every stage and both seats |
| `resultHeadline` makes no causal claim | **CONFIRMED** | Two forms only: `NIGHT n · <turnout> CAME AT $<price>` and `FULL HOUSE · t of s · a turned away`. It never names renewals, Draw, TV or the event money, so it cannot mis-attribute. Zero-turnout renders `NIGHT 5 · 0 CAME AT $120` — a fact, not a verdict |
| sellout beat factual, does not imply the price was wrong | **CONFIRMED on the words** (see finding 4 on the chrome) | `17,794 OF 17,794 · 6,631 TURNED AWAY`; `resaleNote` verbatim; no adjective |
| no trend line, no pending-night mark, no lit building pre-lock | **CONFIRMED** | `dotChart` emits one axis `<path>` and no polyline/area/fit (`m2ui.ts:295-320`); it is fed `history` only, so the open night has no dot (OBSERVED: the Night-4 pre-lock desk plots N1, N2, N3 and nothing else); the pre-lock desk renders no building at all, and the locked-waiting state renders `lit:"idle", turnout:0` — dark and closed, under `"Doors open when your teacher rings the bell."` |
| the desk rail implies a trend | **NO** | The rail carries night pips, the two books and desk identity. There is no per-night history in the rail and no line anywhere on the surface |

**Frame-fit measurements taken as part of the economic reading** (they matter because a claim below
the fold is a claim a pair does not read): at all 20 settled desk-nights, headline `top` 179–189,
hero `bottom` ≤ 356, chain `bottom` ≤ 688, renewals `bottom` ≤ 660, and `#fhLock` absent from the
results state. Exactly one figure ≥34px on every ordinary night (the turnout, 72px), two on the
sellout (turnout 72px, turned-away 40px). The largest figure is never money.

## Ruling asked of me: the repeated renewals box

`VISUAL_REFERENCE_CONTRACT` §H item 7 left this open. **Ruling: the registered renewals RULE
(`renewalRuleFor`) must render on every night, and the settled renewals MOVEMENT
(`renewalsBefore → renewalsAfter`) must render on every settled night. Neither may be suppressed,
collapsed behind a disclosure, or shown only when it changed.** Reasons, all measured:

1. R-10 is the reason. The rule is the pair's only access to a construct the model never prints,
   and the night it matters most (Night 4, where renewals *gain* at the season-high price) is the
   fourth time they would have seen it. A box that collapses "after N1" is gone exactly when the
   misprediction lands, and the debrief loses the "let it happen, then name why" beat.
2. A movement shown only when non-zero teaches that nothing happened on the silent nights, when in
   fact the model computed a delta and clamped it (`RENEWAL_DELTA_FLOOR`/`CEIL`, and the floor bites
   often — my desk 3 sat at 0% for two nights). `no change` is a result, not an absence.
3. Compactness is fine and is already achieved: the rule is 3–4 lines under the dial, the movement
   is one row. Neither costs the first viewport (measured above).

What *is* permitted: shortening by rendering a registered short form the module owns, never a
client paraphrase; and dropping the *duplicate* second copy of CASH/RENEWALS on the pre-lock desk
(goal card and stat card show the same two numbers twice) — that is duplication, not the rule.

## Synthesis map

`/play` at this head carries the play → named-concept map in four places, all module-owned and all
intact: the CASH chain names TICKETS / IN-ARENA / BUILDING BILL / EVENT MONEY / UPPER BOWL / CASH
(the decomposition E10 prescribed); RENEWALS is named and moved separately with `twoBooksLine`
verbatim from `OBJECTIVE_COPY` under both books wherever they appear together; the N1→N5 channel
split renders `repeatRowFor().channelLine` verbatim in COUNTERFACTUAL rather than an arrow; and Two
Peaks is now released at the same stage as the board. Nothing in the rebuild renamed, paraphrased or
re-branched a module sentence. The formal naming stage itself — the six synthesis cards and their
computed visuals — is W3 and is **NOT VERIFIED** by me; nothing on `/play` pre-empts it now that
R-9 holds. The outside-sports generalisation (`BEYOND_SPORTS_LINE`) renders at COMPLETE and was not
touched.


## Re-check after repairs (head 54402b0)

Filed as its own document: `ECON_TRUTH_W2_RECHECK.md` (same directory). Summary: finding 1 (R-7,
BLOCKING) is **DISCHARGED** by measurement and `w2-econ-confirm-dissent` is **RESOLVED**; findings
3, 4 and 5 (resale note below the fold, sellout chrome, two bare `CASH` numbers) are **DISCHARGED**;
finding 6's carried Two Peaks client literal is **STANDING**; finding 2's statement of what the R-1
limb is evidence for is unchanged and was **NOT RE-VERIFIED** at this head. Three new IMPORTANT
findings are in the re-check document.
