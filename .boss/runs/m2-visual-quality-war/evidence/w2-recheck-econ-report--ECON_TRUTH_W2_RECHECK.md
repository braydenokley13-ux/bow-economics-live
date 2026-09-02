# ECON_TRUTH_W2 — re-check after repairs 1–3 (head `54402b0`)

Actor `econ-truth-w2`, assignment `w2-recheck-econ`, port 4447. Owning critic of the findings filed
at `6c4c7cc`. I built none of this and modified no product source; `runtime/dist` was not rebuilt.

**OBSERVED** = seen in the DOM, in a screenshot, or in a measurement I ran this session.
**INFERRED** = read off source, or read off another actor's recorded measurement. **NOT VERIFIED**.

What I ran at this head: a 4-desk `/play` playtest through all five nights (sellout, two zero-turnout
nights, bowl opened at one desk and closed at three) plus the seven REVEAL stages, 1366x768
(`drive.cjs`, `dump.json`, `shots/`); and an independent render-and-pixel measurement of `arenaSvg`
from `runtime/dist/client/shared/arena.js` at nine fill/bowl states, deviceScaleFactor 2
(`deckmeasure.cjs`, `analyze.cjs`, `pixels.json`). My deck isolation does **not** reuse the builder's
Path2D masks: I difference a bowl-OPEN render against a bowl-SHUTTERED render at the same fill, so
the top deck's lit area falls out of two independent screenshots.

## Highest severity first

### 1. IMPORTANT (new, this wave) — `renewalShortRuleFor` drops the only clause that can explain a renewals GAIN, and it is printed as the cause of every settled movement

`renewalShortRuleFor` (`runtime/src/modules/fullHouse.ts:340`) compresses `renewalRuleFor` to:

> "Renewals follow your $24 season plan: price well UNDER it and the plan looks like a waste, price
> ABOVE what tonight is worth to them and they quit."

The full rule has three clauses; the short form keeps the two falling arms and drops the apex —
*"In between, the plan looks like a bargain and more come back."* The model's `renewalDelta`
(`fullHouse.ts:596`) is a tent: `RENEWAL_TENT_PEAK` plus an accelerating `RENEWAL_BARGAIN_BONUS`
between `planPrice` and `renewalReferencePrice`. The compression is therefore **not faithful**: it
describes only the two arms and not the peak the model spends most of its nights on.

OBSERVED consequence: `play/main.ts:2729` feeds this string to `fhRenewalsHtml` as `cause`, and
`main.ts:2646` renders it under a rule directly beneath the movement, on **every settled night**.
In my run renewals went UP on **11 of 20** desk-nights, and on every one of them the printed cause
names only ways renewals fall. Including all four desks on **Night 4** — the night the R-10 ledger
entry says the whole renewals lesson turns on: D1 17%→26% (+9), D2 43%→49% (+6), D3 0%→7% (+7),
D4 72%→82% (+10), each above a sentence that says a price under the plan wastes it and a price above
it makes them quit (`shots/res-n4-d3.png`, `dump.json`). The full rule is **not on the results frame
at all** — `fhRuleSlot` is called once, from the pre-lock desk (`main.ts:3292`), OBSERVED absent from
every settled-night `innerText`.

Not a false sentence; a compression that cannot account for the outcome it is printed beside, on the
night the module's own ledger flags as the misprediction to let happen and then name. Repair: restore
the middle clause to the short form (one clause), or stop labelling the short rule as the cause of a
settled movement.

### 2. IMPORTANT — R-7's arena entries are now true of the drawing, but the second entry's own quantity is not

The picture claim is DISCHARGED (see §R-7 below). The residual is inside the same entry
(`fullHouse.ts:1991-1993`), twice: *"drawn as about a fifth of the seat area"* and *"it is about a
fifth of the drawn seats and about a tenth of the real ones."*

OBSERVED, my own measurement: the top deck is **25.9%** of the drawn lit seat area when it is open
(31,352 lit px of 121,218; deck isolated by differencing `fill1.000` bowl-open against `fill1.000`
bowl-shuttered, 900x196 outcome view at dsf 2). That is about a **quarter**, not about a fifth. The
flat-annulus geometry agrees: `DECKS` radii give the top band 26.5% of annulus area
(`arena.ts:174-178`), and the builder's own header comment (*"radii chosen so drawn AREA splits
~41 / 39 / 20"*) is the same overstatement of the correction.

The entry's economic point survives — the deck is drawn larger than its true 2,400/22,200 (10.8% NY)
or 1,800/19,594 (9.2% Memphis) share, and the reason given is sound. Its number understates the
distortion it is confessing. An honesty-ledger entry whose figure is wrong is the defect R-7 named,
at smaller magnitude.

### 3. IMPORTANT — the full `spendRuleFor` and `renewalRuleFor` are now behind a collapsed disclosure before the commitment

OBSERVED on the pre-lock desk at 1366x768: the first-viewport text is the two short rules; the full
rules render inside `<details class="fh-rules">` under `MORE ABOUT TONIGHT` (`main.ts:2589`), closed
by default, and their text is absent from `innerText` until pressed. `gate-l1-econ-r1` R3's first
discharge limb was that the event-money channel is *"printed on the student's own screen before the
commitment (`spendRuleFor`)"* — specifically the AT MOST +2 renewal-point ceiling and the zero case.
That sentence is now one press away, not printed. Same for the renewals tent's middle clause (§1).
This is a live weakening of a prior gate discharge and the lead should re-rule it, not inherit it.

### 4. IMPORTANT (minor) — `renewalFloorLineFor` explains the rule's clamp but fires on the book's clamp too

`renewalAtFloor` is `renewalDelta(...) === RENEWAL_DELTA_FLOOR` (`fullHouse.ts:2155`), but the number
the pair reads is `renewalMove = clamp(renewals + move, 0, 100) - renewals` (`fullHouse.ts:868,879`).
OBSERVED, 2 of the 8 floored desk-nights in my run: N3 D3 prints `10% → 0%  down 10 points` and
N5 D3 prints `7% → 0%  down 7 points`, each under *"The renewals rule takes at most 20 points off in
one night. Tonight's price asked for more than that."* The sentence is model-true about the rule and
does not name the second clamp — the book cannot go below 0 — so the printed move and the printed
explanation disagree by up to 13 points. Also exact-equality: when the unclamped value rounds to
exactly −20 the line still says *"asked for more than that"*, when it asked for exactly that.

Otherwise R-F is discharged: the line fires on every clamped night and never on an unclamped one
(8/8 correct in my run), and it does the job it was asked for — a desk sitting at 0% now reads why.

### 5. ADVISORY — small mapping and labelling imprecisions

- `openSeatsLabel` — *"empty — the dark seats above the line"*. The redrawn picture has one seam per
  **open deck** (two, or three with the bowl open), and none at all at 0% turnout. OBSERVED at the
  two zero-turnout desks: `19,800 empty — the dark seats above the line` printed over a fully dark
  building with no line in it.
- `spendShortRuleFor` — *"…and nobody extra tonight."* EXACT about people (`settleNight` takes no
  term from tonight's spend into tonight's turnout) but silent about the second book: the spend term
  `spend / eventRenewalDollars` is inside tonight's `renewalDelta`. A pair that spends and sees
  renewals move has been told "nobody extra tonight". The qualifying clause is in the full rule,
  which is collapsed (§3). Numbers OBSERVED correct at both markets: `$100` New York (1/0.01),
  `$63` Memphis (1/0.016 = 62.5 → 63). The builder's report says "$60" for Memphis; the **product**
  is right and the report line is wrong.
- `extraSeatsLabel` "MORE SEATS" is the label on a **cost** row of the CASH chain
  (`− MORE SEATS -$95,000`). A benefit noun on a deduction line; the operator carries the sign.
- `repeatCallbackLineFor` — factual, no verb of cause, figures OBSERVED correct against each desk's
  own Night-1 row. But two nights on the same card differ by more than price (renewals base, and
  Night 4's event money), and nothing sits beside it saying so; the channel split is at
  COUNTERFACTUAL, phases later. D1's instance is the good case (same $34, different crowd);
  D4's (`$16 → 14,740 then · $24 → 12,860 tonight`, renewals 56%→82% over the same span) invites
  "the price did it". SIMPLIFICATIONS entry 3 already carries this risk for the teacher.
- R-H / E4 **STANDING**: `play/main.ts:2971` still composes *"$X lower — N clicks of the dial. The
  cheaper ticket made more money."* as a client literal, and `main.ts:2334` still composes
  *"Nothing. Tonight is the last night of the five — money spent on the event tonight has no night
  left to land on."* Both are model-true; both are authored in the renderer, under no limb, and
  invisible to `clientClaims.test.ts` (which greps vocabulary, not unregistered sentences). Contract
  A9's unregistered-sentence test still does not exist.

## R-7 — DISCHARGED (measured)

**Entry 1, equal proportion per open deck: now TRUE of the drawing.** OBSERVED, my own render and
pixel measurement, method independent of the builder's masks:

| fill | drawn lit area / drawn lit area at full, ALL decks | lower+club | top deck (isolated) |
|---|---|---|---|
| 0.200 | 0.184 | 0.184 | 0.244 |
| 0.500 | 0.481 (closed) · 0.495 (open) | 0.483 | 0.530 |
| 0.900 | 0.871 (closed) · 0.884 (open) | 0.883 | 0.888 |

Max cross-deck spread **6.0 points** (at fill 0.2), 4.7 at 0.5, 0.5 at 0.9; the aggregate under-reads
true fill by ≤3 points at every step, monotonically. Before the repair the same picture at fill 0.2
lit lower **42.6%** / club **4.2%** / bowl **0.3%** (builder's `measurements-before.txt`, INFERRED) —
an inside-out seat allocation `settleNight` does not have. Source agrees: one `fill` for all decks
and a seam radius `sqrt(rIn² + fill·(rOut² − rIn²))` (`arena.ts:518`), which is the equal-area seam
by construction. **No deck fills before another.** Corroborated visually at `shots/res-n1-d3.png`
(35.7%: both open decks show a lit front band and dark seats above a hard seam).

**Dark at 0%:** OBSERVED at the two zero-turnout desks (N3 D3, N5 D3) — `0 came`, `0% of the seats
you opened tonight`, no lit seats. The 0.00%-warm-pixel figure is the builder's, NOT re-measured
by me.

**Entry 2, the third state: now REACHABLE in the product.** OBSERVED on Night 4 at all four desks.
Bowl CLOSED (D2 100%, D3 98.2%, D4 84%): the top deck draws shuttered and the picture is labelled
**"More seats closed"** (`shots/res-n4-d3.png`, `shots/res-n4-d2.png`, `shots/res-n4-d4.png`). Bowl
OPEN (D1): third deck lit at the same proportion, labelled **"More seats open"**, denominator 22,200,
69.3%. The dead guard I filed against (`bowlOffered = n.bowlCost > 0 || n.openBowl`) is replaced by
the slate's published `bowlOffer` (`main.ts:2744`, `fullHouse.ts:2199`), which is true on Night 4
regardless of what the desk did.

**Therefore `w2-econ-confirm-dissent` (economic-truth, blocking) is RESOLVED.** The two entries now
describe the artifact. The residual in §2 is a wrong quantity inside a now-true entry — IMPORTANT,
not blocking, and it does not reinstate the dissent.

## The other findings I filed

| mine | verdict at `54402b0` | evidence |
|---|---|---|
| **R-A / R-7** two false arena ledger entries | **DISCHARGED** (residual §2) | OBSERVED, table above + N4 at four desks |
| **R-B** resale note below the fold and below NEXT on the sellout | **DISCHARGED** | OBSERVED, N4 D2 at 1366x768, scrollY 0: `.fh-resale` 478–546, `#fhNextNight` 571–633, `.fh-what` 389–561. The correction is above the CTA and inside the first viewport |
| **R-C** sellout chrome grades the outcome | **DISCHARGED** | OBSERVED, N4 D2: **0** elements in `#fhResult` carrying a gold-range background, border or shadow; exactly 2 figures ≥34px (turnout 72, turned-away 40); FULL HOUSE headline on the panel ground |
| **R-D** two bare `CASH` numbers in one frame | **DISCHARGED** | OBSERVED on every settled frame: rail `CASH $515,600 / season so far`, `RENEWALS 7% / season so far`; chain `= CASH … tonight` |
| **R-F** floored renewals read as "no change" | **DISCHARGED with §4** | OBSERVED 8/8 clamped nights carry the line, 12/12 unclamped do not |
| **R-H / E4** unregistered client sentences, no A9 test | **STANDING** | OBSERVED in source at `main.ts:2971` and `main.ts:2334` |
| **R-E** strengthen the R-1 limb (evidence, not product) | **NOT RE-VERIFIED** | I did not re-run mutations at this head; the wave-2 records `w2-econ-confirm/e2e-mutation-C.log` and `-D.log` stand as filed, including the ceiling (rounding, abbreviation and geometry defeat the numeric limb; the limb never runs on the results state) |
| **R-G** Memphis frontier probe | **NOT VERIFIED** (W3) | — |
| **R-I** renewals rule + movement on every night | **HELD** | OBSERVED: rule and movement render on all 20 settled desk-nights, never collapsed, never suppressed — but see §1 on which rule |
| **R-4** no evaluative/target copy | **RE-CONFIRMED** | OBSERVED: vocabulary scan of all 33 captured states returns only `preview`, only in `HOUSE_RULES[0]`, negated |
| **R-9** student Two Peaks gate | **RE-CONFIRMED** | OBSERVED: absent at REVEAL stages 0–5, first at stage 6 |
| **R-2** every fill figure qualified | **RE-CONFIRMED** | OBSERVED at all 20 settled desk-nights, incl. the Night-4 22,200 denominator |
| **R-3** two books never summed | **RE-CONFIRMED** | OBSERVED: chain TICKETS / +IN-ARENA / −BUILDING BILL / (−EVENT MONEY) / (−MORE SEATS) / =CASH; RENEWALS separate, never money-coloured |

## Synthesis map — verdict

Nothing new on `/play` pre-empts the formal naming stage and nothing computes an economic quantity in
the renderer that the module does not compute. Every settled figure on the frame is a payload field;
the fifteen new strings are all module-owned and reach the client through `uiCopy` / `viewNight`
(OBSERVED end to end in the DOM). The one student-surface rename is `UPPER BOWL` → `MORE SEATS`
(`extraSeatsLabel`), consistent across the plate, the chain and the picture. The two carried client
literals in §5 are the only sentences on the surface that are not registered. The six synthesis cards
and their computed visuals are W3 and remain **NOT VERIFIED** by me; `/board` and `/teach` at this
head are **NOT VERIFIED**.
