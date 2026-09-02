# KID B — Wave 2 Gameplay Report — Full House `/play`

SIMULATED KID / AGENT-PLAYTESTED. Persona: grade 5–6, casual sports fan, pairs on one
1366×768 Chromebook (also tested 1024×600 first contact). Desk seat: New York Knicks
in the full-arc runs, Memphis Grizzlies desk in the two isolated measurement runs — join
order determined market assignment; this is a driving artifact, not a product bug.
Build: git `6c4c7cc`, `runtime/dist`, port 4445. Session codes: BOWCE7 / BOWAD9 (full
arcs), plus isolated Measure2/Measure3/Measure4 sessions for controlled scrollY=0
measurements. Screenshots: `docs/gauntlet/module-2/premium/screens-w2-kid-b/`.

## what-the-student-plays

Every night I turn one dial ($10–$120, "a seat, tonight") and a second small dial
("making it an event," event spend), decide whether to open the upper bowl, and press
LOCK IT IN. No preview of what any of that produces — the module states this outright
("No preview. Read the card, read your own nights, and commit.") — OBSERVED,
`02-night1-prelock-1366x768.png`. After the teacher rings the bell, I land on a single
result screen: a headline ("NIGHT 1 · 14,740 CAME AT $16"), a huge WHO CAME number, a
CASH chain (tickets → in-arena → minus the building bill → CASH, with my own price
literally multiplied against the turnout: "$16 × 14,740"), and a RENEWALS percentage
that moves. Five nights, then REVEAL/ADAPT/COUNTERFACTUAL/SYNTHESIS run on the
board/teacher side while my own screen mostly repeats a nights-so-far ledger and a
dot chart. OBSERVED, `03-night1-result-1366x768.png`, `13-adapt-1366x768.png`.

## pull-rating

**STRONG** for this persona, with one standing complaint. The results screen is a real
payoff — my price times my turnout is right there in green, the two-books-don't-add-up
idea is repeated every screen so it sticks, and Night 2/4 (where I held whatever price
was already on the dial) produced a genuine FULL HOUSE / TURNED AWAY moment in gold
that looked different from every other night. That is a moment a kid would point at.
It does not reach MAGNETIC because the pre-lock screen makes me read too much before I
can act, and my own play (never touching the dial except once) never generated a
zero-turnout or genuinely bad night to make the downside feel real — a kid who never
adapts might coast through five green CASH numbers and never learn the game punishes
bad prices.

## biggest-failure

**Pre-lock screen asks a "reads short text only" kid to process 256 words in the first
1366×768 viewport before the dial and LOCK IT IN button are usable** — OBSERVED,
measured via a DOM word-count over all text nodes intersecting `y ∈ [0, 768]` on
`02-night1-prelock-1366x768.png`'s live state: **256 words** (season-plan strategy
paragraph, the night's card facts, the MAKING IT AN EVENT copy, and the blind-commitment
caption all stacked in view at once). The $24 price readout and LOCK IT IN button are
large and impossible to miss, so a kid CAN act inside 10 seconds without reading
everything — but the screen doesn't feel like "one clear thing to decide," it feels like
a page of paragraphs with a dial poking through it. This is the wave-1 blocking
student-pull finding's second half ("too many words before the first action") — my
measurement says it is **STANDING**, not discharged, even though the first half of the
same finding (results below the fold) is now discharged (see below).

## moment-by-moment-notes

Ordered by what I actually saw, kid's voice, each item tagged.

1. **First thing I saw (HOOK / lobby):** black screen, "FULL HOUSE," one paragraph about
   my desk and team, "Waiting for your teacher to start." Clean, not scary, but also not
   exciting — just words. OBSERVED, `01-hook-1366x768.png`. Word count in this screen is
   small (~40 words) — this screen is fine.

2. **Night 1 pre-lock — did I know what to do in 10 seconds?** Yes for the ACTION
   (huge $24, a dial, a purple LOCK IT IN button — unmissable), but NO for feeling like I
   understood the situation — there's a strategy paragraph in a blue box telling me how
   pricing works ("Price well UNDER that and the plan looks like a waste... Price ABOVE
   what they think tonight is worth and they quit"), a card panel about tonight's
   opponent, and a spend dial with its own rules paragraph, all stacked in the same
   viewport (256 words, OBSERVED). A kid who "reads short text only" skips all of this
   and just presses lock at the default price — which is exactly what I did as Kid B.
   `02-night1-prelock-1366x768.png`.

3. **After the bell (Night 1 result) — did I know what happened and that MY price did
   it, without scrolling?** Yes. OBSERVED: `#fhResult` sub-elements at scrollY=0,
   1366×768 — headline `top:189 bottom:219`; WHO CAME `top:250 bottom:326`; CASH chain
   `top:398 bottom:658`; RENEWALS `top:443 bottom:572`; NEXT button `top:668 bottom:716`
   — every one of these is `bottom ≤ 768`, so nothing forces a scroll to see the
   consequence or press "next." The CASH chain literally prints "$16 × 14,740" — the kid
   sees her own number multiplied. Word count in this result viewport: 138 (much lighter
   than pre-lock). `03-night1-result-1366x768.png`.

4. **Did the sellout feel like anything?** Somewhat. OBSERVED,
   `measure2-night2-result.png` (a controlled repeat, held-price sellout): headline
   flips to a gold-bordered "FULL HOUSE / 17,794 OF 17,794 · 238 TURNED AWAY" box, and
   "238 TURNED AWAY" sits as its own big number next to the arena picture. That is
   visually distinct from a normal green-CASH night and a kid would notice it. It is a
   color/copy change, not a sound or motion beat — NOT VERIFIED whether there's any
   audio or animation on this transition (agent cannot hear audio; no reduced-motion
   check was run). My actual Night-4 sellout (where I'd poked the dial down to $10 the
   night before and never moved it back) produced an even bigger one — "19,800 OF
   19,800 · 8,200 TURNED AWAY" — but RENEWALS fell 20 points on the same screen (42%→
   22%), which is the intended lesson (full house at too-low a price still costs you)
   but a casual kid may read "full house" as a win and miss that the renewals number
   right next to it just tanked. OBSERVED, `09-night4-SELLOUT-result-1366x768.png`.

5. **Did I want to change my price? Why?** Only once, out of curiosity ("what happens if
   I go way down"), which is exactly the described Kid-B behavior — I poked the dial
   down 15 clicks on Night 3 to see the number change, then never moved it back, so it
   silently stayed at $10 through Night 4 and drove that sellout. This is a real,
   plausible failure mode: nothing on the pre-lock screen reminded me my price was still
   sitting at the poked value from two nights ago (it shows the CURRENT dial value big
   and "PLAN $24" as a small tick, but nothing calls out "you are still at Night 3's
   price"). INFERRED as a mild friction point, not confirmed against spec intent.

6. **Anything I had to know about basketball to play?** No. Card facts (opponent, draw
   number, TV status) are printed in plain sentences and never gate the price/spend/bowl
   controls. OBSERVED across all five pre-lock screens.

7. **Reward chrome?** None seen — no XP, levels, badges, stars, or leaderboard anywhere
   in five nights, REVEAL, ADAPT, or COUNTERFACTUAL. OBSERVED.

8. **Anything told me tonight's result before I locked?** No — pre-lock screens show
   price, spend, bowl toggle, the printed card, and the season-plan STRATEGY blurb, but
   no number derived from the pending action (no projected turnout, no dollar preview).
   OBSERVED across `02/04/06/08/10-*-prelock-*.png`.

9. **Where did I get bored?** The COUNTERFACTUAL "What if?" screen. OBSERVED,
   `14-counterfactual-1366x768.png` — after the (genuinely good) two-number Night-1-vs-
   Night-5 comparison at the top, the "WHAT IF?" list below is four dense paragraphs
   ("The other corner: no line in this model ends with more season-ticket holders than
   100%, and this is the most cash we could find that still gets there. The 35 points
   between this line and the one below it are NOT all the same price — the cheapest cost
   about $80 each and the last one costs $30,000. Protecting the base starts cheap and
   ends expensive.") This is adult-register economics prose, not "short text" a grade
   5–6 kid reads for fun — a kid playing alone (not paired with a stronger reader, and
   without the teacher walking the room narrating it) would tune out here. Nothing on
   REVEAL or the five PLAY nights felt boring by comparison — those screens are mostly
   numbers.

10. **Cheap / school-software feel?** No — dark violet theme, custom typography, an
    actual rendered arena bowl image reacting to turnout/sellout state, and a gold
    sellout treatment read as premium, not like a worksheet. OBSERVED across all
    screenshots.

11. **First contact, 1024×600, PIN card open, PLAY phase:** LOCK IT IN reachable without
    scrolling. OBSERVED — `#fhLock` rect `top:311 bottom:367`, its caption
    (`.fh-blind-note`) `top:376 bottom:471`, both `≤ 600`, viewport height 600.
    `17-firstcontact-1024x600-PLAY-pincard-open.png`. (The earlier LOBBY-phase capture
    at 1024×600, before PLAY started, only shows the PIN banner and "waiting for
    teacher" — not the control screen — so that first screenshot alone was not the right
    test; the PLAY-phase one above is.)

12. **Would I ask to play again?** Probably yes for one more class — the result screen
    and the sellout moment are the reason. I would not want to sit through the
    COUNTERFACTUAL paragraph wall a second time without a teacher reading it aloud.

## Wave-1 blocking finding — DISCHARGED / PARTLY / STANDING

The prompt named two components of the wave-1 blocking student-pull finding:

- **"Consequence below the fold" — DISCHARGED.** Measured via `getBoundingClientRect`
  at `scrollY=0`, 1366×768, on both a normal night (Night 1, `03-night1-result-*.png`)
  and a sellout night (`measure2-night2-result.png`): headline, WHO CAME, CASH chain,
  RENEWALS movement, and the NEXT button all have `bottom ≤ 768`. No scroll was needed
  to see the consequence or advance at either night type I checked (normal, sellout).
  Zero-turnout night was NOT VERIFIED — my two playthroughs never produced one (Kid B's
  scripted behavior of holding/mild-poking never drove price high enough to empty the
  house).

- **"Too many words before the first action" — STANDING.** Measured: 256 words in the
  first 1366×768 viewport of the Night 1 pre-lock screen before any action is possible.
  The CTA itself (huge price readout, LOCK IT IN button) is reachable and pressable
  inside 10 seconds without reading any of it, so a fast-clicking kid is not blocked —
  but the screen does not read as "one clear decision," it reads as a paragraph-heavy
  page a short-text-only reader will skip past rather than absorb. Partial credit: word
  count on the RESULT screen (138) and the HOOK screen (~40) is much lighter, so the
  problem is localized to the pre-lock PLAY screen specifically, not the whole surface.

## required-repairs

(Observations for the Lead Integrator's prioritization — not fixes, per role
constraints.)

1. Pre-lock PLAY screen carries 256 words in the first viewport (season-plan strategy
   paragraph + card facts + spend-rule copy + blind-commitment caption, all visible at
   once) — reduce simultaneous reading load or make the strategy paragraph an
   optional/collapsed disclosure so the first thing a short-text-only kid sees is the
   dial and the card, not four blocks of prose. STANDING per above.
2. Nothing on the pre-lock screen flags that the price dial is still sitting at a value
   the kid set several nights ago (no "still at Night 3's price" cue) — a kid who pokes
   the dial once and forgets about it can walk into an unintended sellout/undercharge
   without any signal. INFERRED friction, not confirmed against design intent.
3. COUNTERFACTUAL "WHAT IF?" row bodies are dense, adult-register paragraphs (~50+
   words per row) that read as the biggest boredom risk in the whole arc for an
   unsupported grade 5–6 reader — needs teacher narration to land, cannot yet carry
   itself for a kid working ahead of or without the teacher's voice.
4. Full-house sellout (RENEWALS falling 20 points on the same screen as "FULL HOUSE") is
   the correct economics but risks being misread by a casual kid as an unqualified win
   ("we sold out!") since the gold treatment celebrates the turnout number harder than
   it flags the renewals drop right beside it — NOT VERIFIED whether the module or
   teacher script calls this out explicitly in the room; on my own screen alone the two
   numbers have equal visual weight but opposite meaning and nothing distinguishes them
   as "good" vs "bad" without already knowing the mechanic.

## dissent

None filed — pull rating is STRONG, at or above the STRONG threshold that avoids a
mandatory `student-pull` dissent per the assignment instructions ("only if pull is below
STRONG"). The STANDING word-count finding above is recorded as a required repair, not a
blocking dissent, because it did not prevent action within 10 seconds during play.
