# GAMEPLAY_W2 — Player / Gameplay Critic, Boss run `m2-visual-quality-war` wave 2

Actor `gameplay-critic-w2` · assignment `w2-gameplay-review` · head `6c4c7cc` · port 4443.
**AGENT-PLAYTESTED** (a simulated critic drove the real `runtime/dist` build in Chromium). Nothing
here is HUMAN-TESTED or CLASSROOM-PROVEN. Labels: OBSERVED (screenshot/DOM), INFERRED, NOT VERIFIED.

Play: one live `/teach`, one live `/board` (1920x1080), four desks as pairs on one device —
three at 1366x768, one at 1024x600 (first contact, PIN card left un-collapsed). Full arc
LOBBY → HOOK → five nights → REVEAL x7 → ADAPT → COUNTERFACTUAL → SYNTHESIS → COMPLETE.
Lines chosen as curious 11-year-old pairs, not the e2e's line:
D1 New York $40/$60/$80/$100/$40 (ladder up, repeat price on N5) · D2 Memphis $16 held all five
nights (plan price, held through the Night-4 shock, bowl closed) · D3 New York $10 floor all five
nights · D4 Memphis $120 greedy on N1 then $30/$40/$60/$30, bowl opened on N4.
Screenshots: `docs/gauntlet/module-2/premium/screens-w2-gameplay/` (62 frames).
Measurements: all `getBoundingClientRect()` / `getComputedStyle` at `scrollY=0`.

---

## what-the-student-plays

Five game nights running a real NBA club's building. Each night the pair reads a printed card
(day, visiting club, DRAW n/100, TV), then sets three things blind — a ticket-price dial
($10–$120, $2 detents, hero readout at 68px), an event-money stepper, and on Night 4 a
one-night upper-bowl plate ("Open 1,800 more seats tonight · $42,000 · paid whether they fill
or not") — and presses LOCK IT IN. There is no preview of any kind. The teacher rings a bell;
the desk flips to a full-screen result state (`#fhResult`) that owns the viewport until the pair
presses `#fhNextNight`. After five nights the device becomes a mirror while the teacher runs
seven reveal stages on the projector, then ADAPT, COUNTERFACTUAL and SYNTHESIS.

The decision is real, not a menu. OBSERVED: the same $10 produced a 19,800-seat sellout at New
York on N1, N2 and N4 and a season cash book of $126,680 (D3), while a ladder to $100 produced
-$204,540 on the national-TV Wednesday and $1,058,000 on N4 (D1); $120 on a Draw-22 Tuesday
produced `NIGHT 1 · 0 CAME AT $120` and a -$280,000 night (D4, screenshot 14) that the pair
recovered from at $30 the next night. There is no dominant line on both books: D1 finished
CASH $1,590,470 / RENEWALS 0%, D2 finished CASH $837,152 / RENEWALS 80% (OBSERVED).

## pull-rating

**FUNCTIONAL** for the generic pair across the whole arc — below the bar for a Track 101 flagship.

The five-night loop taken alone plays at STRONG: the result state is a real beat, the consequence
is attributable to the pair's own dial, and the NEXT card makes them want another night. The rating
is dragged to FUNCTIONAL by three measured causes, all of which sit outside that loop or under it:

1. At the moment of every decision the pair's own five-night evidence and the entire rule for
   one of its three instruments are **below the fold** (measured, all nights).
2. The event-money dial has **no visible cause and no visible consequence** at `scrollY=0` at
   any point in the lesson — a choice with no perceived consequence.
3. The device is **inert for the back half**: reveal stages 0–5 are byte-identical, all six
   synthesis pages are byte-identical, with 415–471px of dead black.

Dissent raised: category `student-pull`, severity `blocking`, causes 1–3 above.

**Wave-1 blocking student-pull dissents, disposed:**

| Wave-1 dissent | Status | Measurement at `scrollY=0` |
|---|---|---|
| Consequence below the fold | **PARTLY DISCHARGED** | 1366x768 PASSES: headline `top 189 / bottom 219`, WHO CAME `250–326` (72px), arena `229–433`, RENEWALS `443–572`, `#fhNextNight` `701–749`, next night's `#fhLock` absent from the DOM. **1024x600 FAILS** (contract row C1 demands both): RENEWALS `bottom 604` on N1 and `639` on N4; `#fhNextNight` `top 705`. `WHAT HAPPENED` + the spend receipt are below the fold at **both** viewports. |
| Sellout cut in half | **DISCHARGED** (with one residue) | Memphis N4 sellout: `FULL HOUSE` block `top 189` (< 200), `7,256 TURNED AWAY` at 40px, `top 475 / bottom 517`, second-largest figure on the frame after the 72px turnout. Residue: `.fh-resale` at `939–965`, below the fold; `#fhNextNight` `741–789` clipped 21px. |
| LOCK off-screen at 1024x600 | **DISCHARGED** | 1024x600, PIN card un-collapsed (`#pinCard 48–88`): `#fhLock 311–367`, `.fh-blind-note 376–471` at 14.5px `rgb(201,201,214)`. Both `bottom ≤ 600`. |

Also cleared while playing (OBSERVED): `#fhPriceReadout` 68px at 1366x768 / 64px at 1024x600 and
the only figure ≥34px in the pre-lock state; `#pinDisplay` 16px at every moment including first
join; the `PLAN $24` tick (`y≈433`) no longer intersects the knob (`390–414`); exactly one figure
≥34px on every settled night and it is the turnout, not money; `prefers-reduced-motion: reduce`
leaves zero elements with animation or transition > 120ms.

## biggest-failure

**The pre-lock desk hides the two things that make the choice a decision, and one of the three
instruments is inert in both directions.**

The page's own subtitle, at `y=208`, reads *"No preview. Read the card, read your own nights, and
commit."* OBSERVED, measured at four consecutive nights on a fresh session: the card
`YOUR NIGHTS SO FAR` — the pair's realized price × people ledger and dot chart, the only
information the blind mechanic gives them — has `top = 769` at Nights 1, 2 and 3 and `top = 788`
at Night 4, against a 768px viewport. **Zero pixels of the pair's own history are on screen at any
decision.** Document height is 1109–1135px; 31–43% of the decision surface is below the fold. The
`Tomorrow` next-card strip is at `top = 768`.

In the same fold sits the entire explanation of the second dial. `MAKING IT AN EVENT · up to
$120,000 · − $0 +` renders directly beside `LOCK IT IN` (screenshot 04), and its 200-word rule
block `WHAT THE EVENT MONEY DOES` renders at roughly `y 833–1064` (screenshot 05, fullPage). The
only feedback on that dial — `"Last night's $10,000 bought about 160 extra people, and every one
of them got in and paid tonight's price"` — renders inside `WHAT HAPPENED`, *below* `#fhNextNight`
in the result state (`#fhNextNight` at `701–749` on 1366x768, `705–753` on 1024x600; screenshots
12, 34). A pair that never scrolls — the default for a pair sharing one Chromebook with a violet
CTA in front of them — can play all five nights, spend up to $120,000 a night, and never see a
statement of what the dial does or a report of what it did. That instrument is exactly the
information → choice → Continue pattern this role exists to flag, sitting inside an otherwise
consequential game.

Contract row B8 required the spend rule "printed without a disclosure" as a one-line rule under
the price card. OBSERVED: not under the price card, not one line, and not in the first viewport.
B8 is NOT discharged.

## moment-by-moment-notes

**Pre-lock, Night 1 (screenshots 04, 05, 08).** OBSERVED. The frame reads as a real desk: 68px
`$24`, −/+ buttons, styled track with a `PLAN $24` detent that no longer collides with the knob,
the renewals rule printed verbatim beside the dial, the card with `VISITING CLUB'S DRAW 22/100`
and `Not on TV`, three printed-fact cards (19,800 seats · bill $520,000 · plan $24 / CASH / RENEWALS),
and `LOCK IT IN` with the honesty line under it at 14.5px. Nothing in the frame moves with the
dial. A non-fan can price this: the draw is a number, the plain line is a sentence. Two costs:
the pair's own evidence is off-screen (above), and the empty-state ledger — which is off-screen
anyway — is the only thing that would tell a Night-1 pair what "read your own nights" means.

**Locked-waiting (screenshot 09).** OBSERVED. `.fh-locked-recap` at `614–667`: "Locked at $40 ·
$5,000 on the night". No timer, no spinner. It is a sentence, not the dark-building half-beat
contract row C8 called for; it does not create anticipation but it does not break anything.

**The bell → result state (screenshots 10, 11, 13, 14).** OBSERVED, and this is the build's
strongest object. `NIGHT 1 · 12,510 CAME AT $40` in display type; `12,510` at 72px as the single
hero with `of 19,800 · 63.2% of the seats you opened tonight`; the CASH chain rendered as an
actual chain (`TICKETS $40 × 12,510 = $500,400` → `+ IN-ARENA $225,180` → `− BUILDING BILL
-$520,000` → `− EVENT MONEY -$5,000` → `= CASH $200,580`); a lit arena picture beside it;
`RENEWALS 50% → 30% down 20 points`. The consequence is attributable: the pair can trace their
$40 through four rows to the number at the bottom. The dials are gone from the DOM entirely, so
the result genuinely owns the screen.

Two gaps in that frame. (a) The result never restates *why* renewals moved. D1 charged $40 against
a $24 plan and lost 20 points; the rule that explains it was on the previous screen and is not on
this one. A pair that did not read a paragraph two minutes ago sees a 20-point drop with no
stated cause — the number is attributable to their price only if they remember the rule.
(b) `WHAT HAPPENED` sits below `#fhNextNight`, so the frame's causal footnote is placed after the
button that leaves the frame.

**Night 3, the trap (screenshot 20).** OBSERVED. D1 at $80 on the national-TV Wednesday:
`3,270 CAME AT $80`, `-$204,540` in red in the ledger. The card had said out loud "two things
pulling opposite ways". This is the best adaptation beat in the lesson — a large, self-inflicted,
recoverable loss with the reason printed on the card the pair already read.

**Night 4, the shock and the bowl (screenshots 25, 26, 29, 31, 33).** OBSERVED. Pre-lock, the
bowl is a proper bet: a `CLOSED` plate reading "Open 1,800 more seats tonight / paid whether they
fill or not / $42,000", cost printed, outcome unknown. D4 opened it and finished at 88.9% of the
seats they opened, with `− UPPER BOWL -$42,000` as its own line in the cash chain — the bet is
legible after the fact.

The sellout beat lands. D2 held $16 through the shock: `FULL HOUSE  17,794 OF 17,794 · 7,256
TURNED AWAY` in a gold-bordered band at `top 189`, the bowl fully lit, `7,256 TURNED AWAY` at 40px
directly under the arena, `RENEWALS 68% → 74%`, `CASH $208,232` for the night. The product does
not say "you should have charged more" and contains no grading word. The pull works: a pair
looking at 7,256 people who could not get in has an obvious next thought.

Two problems here. (a) The `resaleNote` — the sentence that says the money was never on the books
— is at `939–965`, below the fold; the beat's economics is the part that got cut. (b) D3, running
the worst franchise in the room ($10 forever, renewals stuck at 0%, cash $34,400 on the night
against a $520,000 bill), received `FULL HOUSE 19,800 OF 19,800 · 7,150 TURNED AWAY` in the same
gold band on three of five nights (screenshot 31). The band is the brightest, largest element on
the frame. It is not reward chrome by D4's letter, but it functions as celebration for the worst
line in the room, and the correction — the $34,400 in the chain below it — is quieter than the
celebration above it. INFERRED risk: a pair reads "we sold out three times" as success.

**Zero-turnout night (screenshot 14).** OBSERVED. D4 at $120: hero `0` at 64px, `0% of the seats
you opened tonight`, cash -$280,000. Honest, survivable, and the pair adapted to $30 immediately.
The frame does not shame them and does not tell them what to do. Good.

**Renewals floor — adaptation dies for most desks.** OBSERVED across all four desks:
D1 50→30→10→**0**→11→0 · D3 50→30→10→**0**→0→0 · D4 50→30→10→20→28→8 · D2 50→56→62→68→74→80.
Three of four desks reached 0% by the end of Night 3; two of them then played Nights 4 and 5 with a
book that reads `0% → 0% no change` and cannot fall further. For those pairs the second half of the
lesson has one book, not two, and the "two books that cannot be summed" claim they are about to be
taught was not true of their own experience for the last two nights. This is a live pull problem
(a dead indicator kills half the tension) and it also touches Economic Truth; routing it there.

**REVEAL (screenshots 41–52).** OBSERVED, measured. The student `#gameBody` innerText is
**byte-identical (882 chars) across teacher reveal stages 0, 1, 2, 3, 4 and 5**, then identical
again (1073 chars) at stages 6 and 7. Seven teacher clicks produce exactly one change on the
student device: the Two Peaks card at stage 6 (correctly gated — no Two Peaks numbers at stage 0,
so R-9 holds as far as `/play` is concerned). The frame itself is well made — "Your five nights"
with the ledger and the dot chart so a pair can find themselves — and it does say "Look up at the
board for the room's". But this is the payoff sequence, plausibly the longest teacher-paced stretch
in the lesson, and the pair is holding a device that does not move. With pairs on one Chromebook
and grade 5–6 hands, a static screen is not neutral; it competes with the projector.

**ADAPT (screenshot 53).** OBSERVED. Three discussion questions and the pair's five nights.
Question 3 — "Night 5 was Night 1's card again. Why did a different number of people show up?" —
is a good argue prompt and it is answerable from the ledger on the same screen.

**COUNTERFACTUAL (screenshots 54, 55).** OBSERVED. The N5-repeats-N1 card lands for the desks
that held a price: D2 `NIGHT 1 $16 14,740` / `NIGHT 5 $16 15,500`, with a violet-bordered
`WHERE THAT CHANGE CAME FROM: +760 people, and that is renewals +600 and Night 4's $10,000 of
event money +160`. D1 gets `12,510 → 11,685`, `-825 people ... renewals -975`. The decomposition
sentence is what makes it land; the two figures alone (a 5–7% move on a five-figure number,
rendered at the same size side by side) would read as "about the same" to an 11-year-old. Two
weaknesses: D3, which held $10 both nights, hit the capacity clamp on N1 (19,800 of 19,800) so its
repeat comparison is confounded before it starts (repeat-card wording for a clamped desk NOT
VERIFIED); and the `WHAT IF?` replay bodies are dense adult prose on a student device —
*"Never moved the dial. Safe, and beatable on BOTH books at once: the renewals line below ends
$999,636 ahead of it in cash and 20 renewal points ahead of it."* That is not grade 5–6 register
and it arrives at the exact moment the pair is supposed to be arguing, not decoding.

Also OBSERVED, routing to Economic Truth: on D2's card the `best renewals book we could find` line
reads `$1,845,068 · 100%` against `the most cash we could find` at `$1,962,968 · 65%` — the
renewals-maximising line takes 94% of the cash-maximising cash *and* +35 renewal points. A pair
reading those two rows can reasonably conclude the choice is not much of a choice, which is the
opposite of the card's own "You have to choose."

**SYNTHESIS and COMPLETE (screenshots 58, 59, 61).** OBSERVED. The student device shows
"Look up at the board / Look up at the board." plus one partner prompt, and is **byte-identical
across all six synthesis card pages**. Last content block ends at `y≈297`; ~471px of contiguous
dead black below it at 1366x768 (contract H7 caps this at 200px). COMPLETE ends at `y≈353`,
~415px dead. The post-PLAY rail also renders an empty rounded placeholder box at `15–193 x 173–213`
on every one of these states (visible in screenshots 40, 41, 53, 54, 58, 61). Contract row D2
required the computed guarded synthesis line mirrored on `/play`; NOT PRESENT.

The explicit-economics stage is, per CLAUDE.md, the essential stage. On the student surface it is
currently a blank page with a caption.

## required-repairs

Ordered by severity. I do not implement; these are the falsifiable conditions.

1. **BLOCKING (student-pull) — put the evidence in the decision frame.** At 1366x768 and
   1024x600, `scrollY=0`: the pair's own settled nights (ledger or dot card) must have
   `getBoundingClientRect().top < viewport height` and show at least the last two nights' rows.
   Measured today: `top = 769` (N1–N3) and `788` (N4) against `vh = 768`. Falsifiable by the same
   probe at all five nights.
2. **BLOCKING (student-pull) — make the event-money dial a decision.** Its one-line registered
   rule (`spendRuleFor`) must be inside the first viewport adjacent to the stepper, and its
   receipt (`spendReceipt`) must be inside the first viewport of the result state, at both
   viewports, `scrollY=0`. Today both are below the fold at both viewports at every night. This is
   contract row B8, undischarged.
3. **BLOCKING (student-pull) — the device must not be a still page through the back half.**
   `/play` `#gameBody` innerText must differ between consecutive teacher reveal stages and between
   consecutive synthesis card pages. Today: identical across reveal stages 0–5, identical across
   6–7, identical across all six synthesis pages. Any per-stage own-desk content satisfies this —
   the pair's own dot for the night being revealed, their own row on the card being taught. Also
   fix the ≥200px dead-region violations this creates (471px at SYNTHESIS, 415px at COMPLETE,
   268px at "The books are closed") and delete the empty rail placeholder box.
4. **IMPORTANT — the 1024x600 result state.** `RENEWALS` (`bottom 604` on N1, `639` on N4) and
   `#fhNextNight` (`top 705`) must be `bottom ≤ 600` at `scrollY=0` with the PIN card un-collapsed.
   Contract row C1 names 1024x600 explicitly; it passes only at 1366x768 today.
5. **IMPORTANT — finish the sellout beat above the fold.** `.fh-resale` (`939–965` today) is the
   sentence that carries the economics of a sellout; it must be `bottom ≤ 768` in the sellout
   frame. `#fhNextNight` at the sellout is clipped (`741–789`).
6. **IMPORTANT — restate the cause of the renewals movement in the result frame.** The result
   shows `50% → 30% down 20 points` with no stated reason. The registered `renewalRuleFor` line
   (or the shorter registered clause) belongs in the RENEWALS card so the movement is attributable
   without recall. No new sentence — a registered constant, already rendered pre-lock.
7. **IMPORTANT — route to Economic Truth, not mine to rule:** (a) the renewals book floors at 0%
   by Night 3 for three of four desks and two of them then play two nights with a dead second book;
   (b) on Memphis the `best renewals` replay line beats the desk's actual on both books and takes
   94% of the max-cash cash, which undercuts the card's own "You have to choose".
8. **ADVISORY — the sellout band and the worst franchise.** `FULL HOUSE` in a gold band is the
   loudest element on the frame and fired on three of five nights for the $10 desk running a 0%
   renewals book and $34,400 nights. No grading word is used and no repair should add one; the
   repair is weight, not words — the cost side of that frame should not be quieter than the
   celebration above it.
9. **ADVISORY — counterfactual replay copy.** The `WHAT IF?` bodies are adult prose at the moment
   the pair is meant to argue. Grade 5–6 register, same claims.
