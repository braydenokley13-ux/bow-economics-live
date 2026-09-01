# KID C BASELINE — the non-sports student plays M2 L1 "Full House"

**Label: SIMULATED KID / AGENT-PLAYTESTED.** Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.
An agent drove the real build (port 4405, `runtime/dist`) through Playwright as one persona:
a grade 5–6 student who does not follow basketball or any sport, on one Chromebook (1366x768)
with a partner. Full pass played: LOBBY → HOOK → 5 nights of PLAY → REVEAL (7 stages) → ADAPT →
COUNTERFACTUAL → SYNTHESIS. Board watched at 1920x1080. Screenshots in `./screens-kid-c/`.

The five nights this kid actually chose, reading only what the screen said:
N1 $20 (17,950 came, kept $162,100, renewals 50→46) · N2 $30 + $10,000 event (18,720, $368,560,
46→48) · N3 $40 + $20,000 event (13,500 — 68.2% — $243,000, 48→56) · N4 $38 + $20,000 + upper
bowl (22,200 of 22,200, SOLD OUT, 2,150 turned away, $618,200, 56→62) · N5 $28 (16,174, $224,004,
62→54). Ended $1,615,864 cash / 54% renewals.

---

## 1. Biggest failure — the consequence is below the fold

OBSERVED. On the Chromebook viewport the product is arranged as: tonight's card, the dials,
LOCK IT IN — and then, *underneath the next decision*, last night's result. At 1366x768 the entire
"how it went" panel starts at or past the fold and its payoff numbers (KEPT, the renewals change,
the spend verdict) are 120–400px below it.

- `05-play-n1.png` — Night 1: LOCK IT IN sits at y≈575, nothing under it.
- `10-play-n2-with-n1-result.png` (viewport) vs `10b-play-n2-full.png` (fullPage) — Night 2 loads
  with "NIGHT 1 — HOW IT WENT" at y≈661; the box score is cut mid-figure; **KEPT $162,100 and
  "Renewals 50% → 46% (-4)" are off screen** at y≈886/910.
- `14-play-n4.png` vs `14b-play-n4-full.png` — by Night 4 the page is 1380px tall; the Night-3
  collapse (13,500 of 19,800 on the *biggest* card so far) is entirely below the fold.
- `17b-play-n5-full.png` — the one theatrical moment on the student surface, the gold **FULL HOUSE
  / 22,200 of 22,200 / 2,150 could not get in** panel, renders at y≈760–890. On the design-target
  viewport this kid never sees it unless someone tells them to scroll.

For this persona this is fatal, not cosmetic. A kid with no sports intuition has exactly one way to
learn what a price does: watch what happened last time. The build puts the next dial in front of the
last consequence, and re-arms the dial at $24 every night (`13-play-n3.png`, `17b-play-n5-full.png`
— the readout is $24 again even after two nights of deliberate pricing), so the screen is ready to
accept a click before the kid has been shown anything. The loop as rendered reads
*decide → decide → decide*, with the consequence filed underneath as an appendix.

## 2. Founder prosecution questions, in this kid's voice

**What do I think I'm supposed to do?** Pick how much a seat costs, then press the gold button.
That is clear inside about five seconds — "PRICE OF A SEAT / $24" with a round knob and a giant
LOCK IT IN (`05-play-n1.png`). I do not know what the second dial is for. "MAKING IT AN EVENT ·
pays off next night · − $0 + · up to $120,000" (`05-play-n1.png`) — an event is what? $120,000 of
what? The explanation is hidden behind "What does this money actually do?" and when I opened it it
was 100 words with clauses like "nothing at all on a night when your price has already moved
renewals as far as they can go." I would not have read that in class.

**Why should I care?** Because it is money and it is mine, and the two numbers at the top change
after every night (`10b-play-n2-full.png`, CASH $162,100 / RENEWALS 46%). That works. It is not
because it is the Knicks — I do not know who the Knicks are, and the game never needed me to.

**What would I click first?** The knob on the price slider. It is the only round grabbable thing
and the biggest number on the screen is right above it.

**What is confusing?**
- "Season plan, per seat $24" and "RENEWALS — season-ticket holders coming back" (`02-play-hook.png`).
  Nobody ever tells me what a season ticket *is*. I inferred "people who buy the whole year" from
  context; a kid who does not infer that is guessing on half the game.
- The blue rule box (`05-play-n1.png`): "Price well UNDER that and the plan looks like a waste —
  renewals fall even with a full building." I read it three times. It is the single most important
  sentence for the renewals book and it is written for an adult.
- The knob physically sits on top of the words "PLAN $24" at the default position — the label reads
  as "PLAN $24" with a circle through it (`05-play-n1.png`, `13-play-n3.png`).
- "VISITING CLUB'S DRAW ⬤⚪⚪⚪⚪ 22/100" — nothing on the student screen says what Draw *is*. I worked
  it out only because the plain line under it said "A quiet Tuesday. Nothing about tonight is
  special."
- On the board: "this picture is NOT a demand curve" (`24-board-reveal-2.png`) — I have never heard
  the words demand curve at this point in the lesson. The room's biggest picture opens by telling me
  what it is not.

**What feels like school?** ADAPT (`32-play-adapt.png`): a numbered list of three questions on a
dark card, and my ledger table under it. That is a worksheet with the lights off. Also every muted
grey paragraph on the projector — the 45-word scatter caveat, the 60-word "market by market" block
(`29-board-reveal-7-books.png`).

**When am I bored?** Two places. (a) The locked-waiting state (`09-play-n1-locked.png`): "Locked.
Nothing to do but find out" + "Locked at $20" and then 450px of black. My partner and I have nothing
to look at while other desks finish. (b) Reveal stages 1–5 (`24-board-reveal-2.png`,
`26-board-reveal-4.png`): the same scatter with one more shape added each time, and each stage is
mostly reading. By N4 it is two colours × four shapes and I cannot find myself in it.

**What am I waiting for?** To find out how many people came. That is the right thing to be waiting
for and the product does deliver it — one screen too late and one scroll too low.

**Did the result surprise me?** Yes, twice, and both were the good kind. Night 3: the biggest card
so far and *fewer* people came (13,500, 68.2%) and my cash fell — I raised the price and it
backfired (`14b-play-n4-full.png`). Night 4: **FULL HOUSE, every seat sold, 2,150 could not get
in** (`17b-play-n5-full.png`).

**Do I understand why it changed?** Partly, and the gap is by channel:
- Turnout: NOT explained in the result. The Night-3 panel gives me 13,500 / 68.2% and no sentence
  saying *your price was above what tonight was worth*. I have to go back up to the blue rule box
  and connect it myself.
- Event money: explained, well. "Last night's $20,000 bought nothing. It brought about 200 more
  people to the door — and the building sold out anyway" (`17b-play-n5-full.png`). That is the
  clearest sentence in the whole lesson and it is a sentence about my own mistake.
- Renewals: NOT explained per night. "62% → 54% (-8)" on Night 5 with no reason line. I do not know
  what I did wrong and I would not be able to tell my partner.

**Can I tell what I might do differently?** Yes — but only at COUNTERFACTUAL, and mostly on the
student screen, not the board. "WHERE THAT CHANGE CAME FROM: -1,776 people, and that is renewals
+300 and Night 4's $10,000 of event money +100 and their own price change -2,176"
(`34-play-cf.png`). That is a real answer. The WHAT IF list ($1,238,212 flat-price line vs my
$1,615,864 vs $2,416,884 best-cash) tells me there was a lot of money I did not find.

**Do I want another round?** Yes — one more, to hold a price near $30 on the small nights and see
the renewals number climb. That is the honest pull: not "I loved that", but "I know one specific
thing I would try."

**Do I want another BOW class?** Yes, weakly. Not because it looked good — half of my 1366px screen
is empty black on every single frame and the game lives in a ~610px column — but because I got to
break something expensive and be told exactly how.

## 3. Where the product assumed I knew basketball

Every fan-only cue I met, and whether the screen also gave me a non-fan cue. OBSERVED:

| Fan-only cue | Where | Non-fan cue also given? |
|---|---|---|
| "New York Knicks" / "Madison Square Garden" | `01-play-lobby.png` | YES — "The biggest market in American sports. A lot of people, and a lot of them can pay." |
| "Memphis Grizzlies" / "FedExForum" | `03-board-hook.png` | YES — seats/bill/season-plan printed for both |
| "a club that has lost four straight" | N1/N5 card | YES — Draw 22/100 + "A quiet Tuesday. Nothing about tonight is special." |
| "a solid playoff club" | N2 card | YES — Draw 51/100 + "Saturday. People can come out and stay out." |
| "last season's beaten finalists" | N3 card | YES — Draw 88/100 + "The club that lost last season's Finals is in the building. That pulls hard." |
| "the rookie everybody is talking about" | N4 card, `14b-play-n4-full.png` | YES — Draw 97/100 + "The biggest night of the five. Demand is going to run past what this building holds." |
| "on national TV — the whole country can watch it free at home" | N3 card | YES — it explains itself: "Two things pulling opposite ways." |
| "41-date home season / a real NBA season is 41 home games" | hook | Self-explaining |
| "Indiana Fever … best in the WNBA … six opposing clubs moved Fever games" | `26-board-reveal-4.png` | PARTLY — the numbers (4,066 → 17,036) carry it; "six opposing clubs moved Fever games out of their own buildings" assumes I know home/away and whose building a game is played in |
| "the Knicks' or the Grizzlies' actual measured demand" (honesty line) | every board frame | N/A — adult disclaimer, I skip it |

**Was there any moment I could not make a reasonable decision without sports knowledge?** No.
OBSERVED across all five nights: every card carried a Draw number out of 100, a five-dot meter, and
at least one plain English line naming the economic force. I priced every night off the Draw number
and the plain line and never needed to know a team. The **Draw + plain line pair is doing its job**
and is the strongest accessibility decision in the build. A fan gets flavour; I got the mechanism.
No dissent on prerequisite sports knowledge.

Two softer risks remain, both about *vocabulary*, not sports fandom: "roster" in the first sentence
of the hook (`02-play-hook.png`), and "season ticket / season plan / renewals", which the product
uses ~40 times and never defines.

## 4. Does the building feel real? Is the reason visible?

**The building:** barely. OBSERVED — the arena exists as text (name, 19,800 seats, $520,000 bill)
and as one 6px progress bar at the top of the result panel. There is no drawing of a bowl, no lit
tiers, nothing that fills up. On the night I sold every seat and turned 2,150 people away, the
screen showed me a gold headline and a green bar (`17b-play-n5-full.png`). The crowd is a number
that moves; the building is a caption. For a kid who is here for "run a real place", this is the
biggest missed feeling after the fold problem. The board's arena backdrop
(`03-board-hook.png`) is ambient rays behind text, not my building.

**Was the reason visible?** Mixed, per §2. Event money: yes, plainly, every night. Turnout and
renewals: no per-night reason line — the reasoning is available (blue rule box, card plain line)
but never joined to the number it explains. Path dependence: yes, and well — "Same card as Night 1.
Same day, same visiting club, same TV. The only thing that has changed since Night 1 is you."
(`17b-play-n5-full.png`) and the channel split at COUNTERFACTUAL (`34-play-cf.png`).

**One structural exclusion.** OBSERVED at `33-board-cf.png`: the board's named comparison — the only
place in the whole lesson where a desk is named in front of the room — lists **only desks that
charged the SAME price on Night 1 and Night 5** ("Desk 3 · same price $12", "Desk 2 · same price
$46", "Desk 4 · same price $16"). I adapted my price across five nights, which is what the lesson
asked me to do, and that is exactly why my desk is not on the board. The desks that never moved the
dial are the ones the room reads out loud. The REVEAL stages name nobody at all
(`24/26/28/29-board-*.png`), so across the entire debrief there is no moment where this kid's own
five nights appear in front of the class.

## 5. Rating

**PULL RATING for this persona: FUNCTIONAL.**

Not WEAK: the mechanic is real, the constraint is real, the consequence is attributable, Night 4
genuinely surprised me, and the game is playable end-to-end with zero sports knowledge. Not STRONG:
the payoff of every loop is rendered below the fold on the design-target viewport, the surface is a
narrow text column on a half-empty screen, the building I am supposedly running is never depicted,
turnout and renewal changes arrive without a reason line, and my own desk never appears in the
class story. FUNCTIONAL is explicitly below the bar for a Track 101 module finale.

## 6. Required repairs (would move this persona)

Ordered by severity. Layout/copy/pacing only — no economics change is required.

1. **Put the consequence above the next decision, or above the fold.** At 1366x768 the result of the
   night just played must be fully visible without scrolling when the next night opens — either by
   ordering result-then-card-then-dials, or by gating the dials behind a "seen it" beat the teacher
   paces. (`10-play-n2-with-n1-result.png` vs `10b-play-n2-full.png`; `17b-play-n5-full.png`.)
2. **Give the sellout its own full-screen student moment.** FULL HOUSE / 2,150 could not get in is
   the best beat in the lesson and it is currently 120px of gold text below the fold under a lock
   button. (`17b-play-n5-full.png`.)
3. **One reason line per book, every night.** Under CAME: why the crowd moved (price vs what tonight
   was worth, plus the card). Under Renewals: why the number moved. The product already writes
   exactly this quality of sentence for event money — extend it to the other two channels.
   (`14b-play-n4-full.png`, `17b-play-n5-full.png`.)
4. **Draw the building.** A bowl that lights up as it fills, sized to the seats you actually opened,
   is the difference between "a number went to 100%" and "I filled my building." Currently a 6px bar.
5. **Define the words the game runs on, in place, once:** season ticket / season plan / renewals;
   Draw (one clause next to the meter: "how many people want to come tonight, out of 100"); and drop
   "roster" from the first sentence of the hook. (`02-play-hook.png`, `05-play-n1.png`.)
6. **Surface the second dial.** "MAKING IT AN EVENT" needs its one usable rule visible without a
   disclosure — "$100 ≈ 1 extra person tomorrow, nothing tonight" — and the rest can stay hidden.
   (`05-play-n1.png`.)
7. **Use the screen.** The game runs in a ~610px column inside 1366px with black on both sides, for
   two kids sharing one Chromebook. Widen to a real two-column desk (card + books left, dials right)
   so the result and the decision can co-exist above the fold. (Every `/play` screenshot.)
8. **Give the locked-waiting state something to be.** Right now: one sentence and 450px of black
   while the room waits. (`09-play-n1-locked.png`.)
9. **Let an adapting desk appear on the board.** The named counterfactual currently rewards desks
   that never moved the dial. Add a second named group — desks whose price changed between the two
   identical cards — or the debrief never names the students who did the thing the lesson taught.
   (`33-board-cf.png`.)
10. **Fix the knob/label collision** on the price dial at the default position. (`05-play-n1.png`.)
11. **Demote the projector's disclaimers.** "This picture is NOT a demand curve" is the first thing
    a grade-5 reader meets on the class picture and it names a term not yet taught.
    (`24-board-reveal-2.png`.)

## 7. Would NOT change

- The blind commitment. "No preview. Nothing on this screen tells you what tonight will make."
  is the reason locking feels like a decision. Keep it.
- Draw number + five-dot meter + one plain line per card. This is what makes the lesson survive a
  non-fan, and it works. Do not replace real clubs with fictional ones to solve accessibility —
  accessibility is already solved by the Draw/plain-line pair.
- Two books that never add up. The tension between $618,200 and "renewals 56% → 62%" is the game.
- The honest spend verdicts, including "bought nothing."
- Night 5 replaying Night 1's card, and the "the only thing that has changed since Night 1 is you"
  line.
- The counterfactual channel split and the WHAT IF lines on `/play` (`34-play-cf.png`).
- The outside-sports generalisation strip on the synthesis cards — "flights and hotels that cost
  more on a Friday, movie tickets cheap on Tuesday" landed for this persona (`35-board-synth-1.png`).

## 8. Not verified

- SYNTHESIS cards 4–6 and COMPLETE were not read frame by frame (cards 1 and 3 captured).
- 1024x600 first-contact and the pairs-talking-to-each-other dynamic (single agent, no second human).
- Anything about how long the teacher actually holds each state — boredom findings are structural
  (what is on the screen while waiting), not timed.
