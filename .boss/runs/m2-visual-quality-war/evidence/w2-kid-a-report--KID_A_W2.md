# KID A — WAVE 2 · Full House (`m2l1-full-house`) at git `6c4c7cc`

**SIMULATED KID / AGENT-PLAYTESTED.** Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.
Persona: grade 5–6 basketball obsessive (Knicks/Grizzlies, follows trades, argues about MSG
ticket prices), pair on one 1366×768 Chromebook, Desk 1 · New York · Madison Square Garden.
4 desks, live teacher, projector. Port 4444. Screens: `docs/gauntlet/module-2/premium/screens-w2-kid-a/`.

Prices I actually chose, in this order: N1 $46 · N2 $60 · N3 $26 + $40,000 event money ·
N4 $34 + upper bowl open · N5 $24. All five nights played, bell rung by the teacher each night,
`#fhResult` read at `scrollY=0` before pressing `#fhNextNight` every time.

---

## what-the-student-plays

I run a real building. Every night I get a card I did not choose (Tuesday, a club that has lost
four straight, draw 22/100, not on TV) and two dials I do choose: a ticket PRICE from $10 to $120
and a pile of money I can burn on MAKING IT AN EVENT. On one night I also get a third choice —
open 2,400 more seats for $95,000, paid whether they fill or not. Then I press LOCK IT IN, the
teacher rings the bell, and the whole screen turns into what happened: how many people came, the
cash chain (tickets + in-arena − bill = cash), and my renewals moving. Then I press NEXT and get
the next card with my price still where I left it.

That is a real mechanic, not a menu. I never once pressed Continue on a screen that had not first
made me commit to a number I could be wrong about. OBSERVED, all five nights.

The thing I am actually playing is the fight between two scoreboards that will not add up. Night 1
I charged $46 because it is the Knicks and MSG and the season plan of $24 is a joke compared to
what real Garden tickets cost — I made $176,192 and my renewals fell 50% → 30%
(`06-night1-result-1366.png`). Night 2 I doubled down at $60 on a Saturday against a playoff club
and made $384,800 in one night — and renewals fell 30% → 10% (`08-night2-result-1366.png`). Ten
percent. Nobody was coming back. Night 3 I dropped to $26 and 15,698 people came instead of 11,600,
renewals climbed back to 17%, and I made a third of the money (`10-night3-result-1366.png`). That
is a trade I made, that I felt, and that I could say out loud.

## pull-rating

**STRONG** for this persona. AGENT-PLAYTESTED.

Not MAGNETIC, for four stated causes, all OBSERVED: (1) the second dial's meaning lives below the
fold and I priced three nights without understanding it; (2) the arena picture does not visibly
change between 54.9% and 81.8% full, so the one picture on the screen taught me nothing; (3) the
"Night 5 was Night 1" beat is told to me in an 11px bullet and then gets no callback at all on my
own result screen; (4) five results states are four identical boxes in identical positions — after
Night 2 I already knew the shape of the answer before I read it.

Not below STRONG, because the loop is genuinely consequential: I changed my price three separate
times *because of what the last bell told me*, and each change produced a different, attributable,
readable answer. It is not information → choice → Continue.

**Wave-1 blocking student-pull finding — "the consequence lands below the fold and the sellout is
cut in half": DISCHARGED**, with one residual defect (see below). All measurements OBSERVED via
`getBoundingClientRect()` at `scrollY=0`, 1366×768, my own Desk 1 results states:

| night (my price) | headline | WHO CAME figure | CASH chain end | renewals move | `#fhNextNight` | `#fhLock` present? |
|---|---|---|---|---|---|---|
| N1 $46 | top 114 | 10,878 @72px, bottom **316** | ~613 | ~500 | 658–706 | **no** |
| N2 $60 | top 114 | 11,600 @72px, bottom **316** | ~613 | ~500 | 658–706 | **no** |
| N3 $26 | top 114 | 15,698 @72px, bottom **316** | ~646 | ~500 | 691–739 | **no** |
| **N4 $34 + bowl — SELLOUT** | `FULL HOUSE` 40px, **top 192**, bottom 236 | 22,200 @72px, bottom **356** | ~710 | ~640 | 731–**779** | **no** |
| N5 $24 | top 114 | 16,187 @72px, bottom ~356 | ~678 | ~565 | 691–739 | **no** |

Every consequence element is inside the first 768px at `scrollY=0` on all five nights. The next
night's `#fhLock` is absent from every results state — the result owns the viewport and the dials
do not come back until I press NEXT. The sellout is not cut: `FULL HOUSE` at top 192 (<200),
`1,975 TURNED AWAY` at 40px bottom 507, and it is the second-largest figure on the frame. Exactly
one figure ≥34px on the ordinary nights, two on the sellout, and the largest figure is always the
turnout, never money.

**Residual (OBSERVED, `13-night4-result-1366.png`):** on the sellout night — the only night with
a fifth panel — `#fhNextNight` measures 731–**779** in a 768px viewport. The one control that moves
the game forward is clipped by 11px on the single most exciting screen in the lesson. It is still
clickable; it does not look like a button any more.

## biggest-failure

**1. I played three nights of MAKING IT AN EVENT without ever being told what it does, because the
explanation is below the fold.** OBSERVED, `09-night3-open-full.png` (fullPage) vs
`11-night4-open-1366.png` (viewport). The panel headed `WHAT THE EVENT MONEY DOES` — "Every $100
here brings about 1 extra person NEXT night… nothing at all if tomorrow sells out without them…
worth AT MOST +2 renewal points" — begins at y≈849 in a 768px viewport. It is a 12-line paragraph
in ~11px grey type in the bottom-right corner, under two other panels. At 1366×768 it is off the
screen. At the moment of choosing I have a $0 readout, a `+`, a `−`, and the words "up to $120,000",
and the only visible instruction (`.fh-blind-note`) tells me *that* I set event money, never *what
it buys*. I pushed `+` eight times on Night 3 to see what would happen — I was guessing, not
deciding. That $40,000 came straight out of my cash chain as `− EVENT MONEY −$40,000`
(`10-night3-result-1366.png`) and I could not tell you whether it was worth it. That is one of the
two dials the whole lesson is built on, and for me it was a slot machine.

The receipt on the *next* night is good — "Last night you put $40,000 into making it an event. That
bought about 400 extra people into tonight's building — if there is room for them"
(`11-night4-open-1366.png`, OBSERVED) — but it arrives one night after the decision, and Night 1
has no receipt at all, so first contact with the dial is always blind in the wrong way. The price
dial is blind about *outcomes*, which is the point. The event dial is blind about *what the control
is*, which is not.

**2. The arena picture is decoration, not evidence.** OBSERVED across
`06-night1-result-1366.png` (54.9%), `10-night3-result-1366.png` (79.3%), `15-night5-result-1366.png`
(81.8%). Same purple bowl, same apparent fill, three very different nights. I could not read the
turnout off the picture at any point; I read it off the 72px number and the picture told me nothing
the number had not already said. The one case where it changes is the sellout, where a gold ring
appears for the upper bowl (`13-night4-result-1366.png`) — which is exactly the night I least
needed help. `ARENA OUTCOME` is nine inline `<svg>` elements (OBSERVED via DOM), so this is a
rendering decision, not a platform limit.

**3. The "Night 5 was Night 1" beat is told, then dropped.** OBSERVED,
`14-night5-open-1366.png` and `15-night5-result-1366.png`. On the pre-lock screen the card carries
two bullets in ~11px: "Same card as Night 1. Same day, same visiting club, same TV." and "The only
thing that has changed since Night 1 is you." Good sentences — sitting next to a 68px `$34` that
owns my whole attention. And then the result screen says `NIGHT 5 · 16,187 CAME AT $24` and says
nothing about Night 1 at all. I had charged $46 on the identical card and got 10,878; I charged
$24 and got 16,187. That is the whole point of the lesson and my own screen never puts the two
numbers next to each other. To compare I would have had to remember Night 1 unaided or go dig in
`Your nights`. INFERRED: the comparison is deferred to the class COUNTERFACTUAL frame — but the
private "oh — *I* did that" moment is available on the student device for free and is not taken.

**4. "all five nights are done" is rendered as a red error.** OBSERVED,
`15-night5-result-1366.png`, top-left, red text in the error slot above the game card, on the frame
that also says `THE BOOKS ARE CLOSED`. The nicest moment of the night — I finished the season —
and my screen has what looks like a crash message on it.

## moment-by-moment-notes

Prosecution questions, in my own voice. Each answer names its screenshot.

**What did you see first?** (`01-lobby-1366.png`) "You have Desk 1. Tonight you run the New York
Knicks' building — Madison Square Garden." I sat up. That is my team and my building. Then I saw
a completely black rectangle from y≈360 to y≈768 — over 400px of nothing under one paragraph —
and an empty rounded box in the left rail with no content in it. It looked like something had
failed to load. The desk card in the bottom-left corner is truncated to "MADISON SQUARE …".
OBSERVED.

**What did you think you were supposed to do?** (`03-night1-1366.png`) Immediately: set a price.
`SET YOUR TICKET PRICE`, a 68px `$24`, a slider, `−` and `+`, `PLAN $24` marked on the track, `$10`
and `$120` on the ends. That is unmistakable, and `LOCK IT IN` is a full-width violet button I
could not miss. OBSERVED: `#fhPriceReadout` = 68px and the only element ≥34px on the frame;
`#pinDisplay` = 16px. What I did *not* know I was supposed to do was the middle dial (see
biggest-failure 1).

**Did you know what happened after the bell without scrolling?** Yes. Every time. OBSERVED, table
above. The bell replaced my dials with `NIGHT 1 · 10,878 CAME AT $46`, a 72px `10,878`, the cash
chain broken into four lines I could actually follow ($46 × 10,878 → + in-arena → − building bill
→ = cash), and `50% → 30%  down 20 points` in its own box. Nothing important needed a scroll on
any of the five nights. This is the strongest thing on the surface.

**Did our choice cause that — can you say what?** Yes, and I said it out loud twice.
(`08-night2-result-1366.png`) "We charged sixty dollars on a Saturday and made the most money of
any night — three hundred and eighty-four thousand — and our renewals went to *ten percent*.
Because we charged sixty." (`10-night3-result-1366.png`) "We came down to twenty-six and five
thousand more people came and the renewals came back up seven points, and we made way less money.
We picked that." The `$46 × 10,878` line under TICKETS is doing a lot of work — it is my number
times their number, in front of me. OBSERVED.

**Did the sellout feel like anything?** Yes — the best moment in the lesson.
(`13-night4-result-1366.png`) A gold-bordered banner across the top: `FULL HOUSE` with
`22,200 OF 22,200 · 1,975 TURNED AWAY`; `22,200` at 72px; and then `1,975 TURNED AWAY` at 40px in
its own box. I opened 2,400 extra seats and *still* turned away nearly two thousand people. My
partner and I both went "we should have charged more" and then immediately "no — we'd have had
empty seats." That is the argument the lesson wants and it happened by itself. The gold ring on
the arena picture is the one time the picture earned its place. OBSERVED. The one thing that cheapened
it: `#fhNextNight` clipped at bottom 779 (see pull-rating residual).

**Did you want to change your price — why?** Constantly, and I did, four times. After Night 1's
`50% → 30%` I wanted to go *up* anyway because Saturday. After Night 2's `30% → 10%` I panicked
and dropped to plan price. After Night 3 recovered I trusted the plan price. On the shock night I
went back up to $34 because "the biggest night of the five, demand is going to run past what this
building holds" was printed right there on the card. On Night 5 I went to $24 specifically to test
what would have happened on Night 1. The dial carries my last price forward, which is exactly right
— it makes the change feel like a decision instead of a fresh start. OBSERVED, all five pre-lock
frames.

**Anything that made you feel like you needed to know basketball?** No. OBSERVED. Every number I
needed was printed: `VISITING CLUB'S DRAW 22/100` with a bar, `Not on TV` / `Local TV` /
`NATIONAL TV` as a chip, the day of the week, `SEATS 19,800`, `BILL, EVERY NIGHT $520,000`,
`SEASON PLAN, PER SEAT $24`. A kid who has never watched a game reads "22/100" and "not on TV" and
knows this is a quiet night.

**Anything where knowing basketball gave you an edge?** Yes, and it is the allowed kind.
(`02-hook-1366.png`, `11-night4-open-1366.png`) "last season's beaten finalists" and "the rookie
everybody is talking about" mean something specific to me — I know what a Finals rematch does to a
building and I know rookie hype is a one-night spike, so I opened the bowl on Night 4 without
hesitating while the printed `97/100` was saying the same thing more quietly. "The biggest market
in American sports" and "listed basketball capacity 19,812 · 2025-26" are the details that made me
believe this was the real Garden and not a worksheet. Edge, not requirement. OBSERVED.

**Did anything look like a game reward, score, or level?** No. OBSERVED across all five results
states and both pre-lock viewports: no XP, no badge, no star, no streak, no leaderboard, no rank,
no "level". The night pips in the left rail (`NIGHT 3 OF 5`, TUE/SAT/WED/SAT/TUE) are a calendar,
not a progress bar with a prize at the end. CASH and RENEWALS are never summed and never share a
row.

**Did anything tell you what tonight would make before you locked?** No. OBSERVED on all five
pre-lock frames. `TOMORROW · Night 4 · Saturday · the rookie everybody is talking about ·
draw 97/100 · not on TV` is printed facts about a card, not an outcome. `YOUR NIGHTS SO FAR` plots
one dot per settled night with no line joining them and no mark for the pending night. Nothing
moved when I dragged the dial except the price readout and the slider. The only forbidden-vocabulary
hits in rendered `/play` text are two instances of "preview", both inside sentences that deny a
preview exists ("No preview. Read the card…" and "There is no preview — the dials show dollars and
nothing else."). Flagging for the vocabulary auditor, not as a gameplay defect.

**Was Night 5 being Night 1's card again a moment?** Half a moment. OBSERVED,
`14-night5-open-1366.png`. I did notice — because the card told me in a bullet, not because I
recognised it. And then it went nowhere (see biggest-failure 3).

**What did you do during the reveal on your own screen?** **NOT VERIFIED.** My session's server
process was killed mid-run by the environment (`ERR_CONNECTION_REFUSED` on all four desks; the
snapshot at `snap.json` restored the session cleanly at version 71 and my locked prices survived —
that part is OBSERVED and it is good). I recovered far enough to settle Night 5 and read its result,
but the browser was lost before I could sit through REVEAL, ADAPT, COUNTERFACTUAL and SYNTHESIS on
my own device. I did not see them and I will not guess. The counterfactual and synthesis frames are
where three of my four complaints above are supposed to be answered, so **the case that this
experience is MAGNETIC rather than STRONG is genuinely undecided and needs a kid who reaches the
end of the arc.**

**Did anything feel cheap, like school software?** Three things. The dead black region under the
lobby paragraph (>400px, `01-lobby-1366.png`). The red "all five nights are done" error banner on
my finishing screen (`15-night5-result-1366.png`). And the locked-waiting state
(`15-night5-result-1366.png` captured pre-bell, and every night): after I lock, the button becomes
a flat grey `Locked at $24` but the giant `$24`, the slider and the `+`/`−` buttons stay sitting
there looking exactly as live as they did a second earlier. My partner tried to drag it. Nothing
tells you the room has closed. The rest does not feel like school software — the dark card grid,
the violet accent, the condensed result headline and the cash chain read like a product.

**Would you ask to play again?** Yes — and specifically to run the same five cards differently,
which is the right reason. What I said at the bell on Night 5 was "can we do Night 2 again, I want
to see what forty does." NOT VERIFIED whether that survives the reveal, because I did not see it.

## required-repairs

Ordered by severity. I do not implement; these are the repairs the finding demands.

1. **Put what the event dial buys in front of the student at the moment of choosing.** The
   `WHAT THE EVENT MONEY DOES` panel must be readable at 1366×768 without scrolling on the pre-lock
   frame — one grade-appropriate sentence next to the `+`/`−`, not a 12-line paragraph at y≈849.
   Night 1 has no receipt to lean on, so first contact is the case that must work.
   (`09-night3-open-full.png`, `11-night4-open-1366.png`)
2. **Make the arena picture read the turnout, or stop calling it `ARENA OUTCOME`.** 54.9%, 79.3% and
   81.8% must be distinguishable at a glance from across a desk. Right now the picture is the same
   at all three. (`06-`, `10-`, `15-night*-result-1366.png`)
3. **Give the Night 5 result state its Night 1 callback on the student's own screen.** Two figures,
   same card, side by side: `$46 → 10,878` / `$24 → 16,187`. The class frame can still do the class
   version. (`15-night5-result-1366.png`)
4. **Fix `#fhNextNight` clipping on the sellout night** — bottom 779 in a 768px viewport at
   `scrollY=0`. The sellout frame is the one frame that grows a fifth panel and it is the one frame
   whose forward control falls off the bottom. (`13-night4-result-1366.png`)
5. **Stop rendering "all five nights are done" through the error channel.**
   (`15-night5-result-1366.png`)
6. **Make the locked state look locked.** Dim or collapse the dial, slider and steppers when
   `Locked at $X` appears, so a pair cannot keep grabbing a control that no longer does anything.
7. **Kill the dead region in LOBBY** (>400px of empty black under one paragraph) and the empty
   placeholder box in the left rail; fix the truncated `MADISON SQUARE …` desk card.
   (`01-lobby-1366.png`)
8. **Referred, outside my lane, both OBSERVED:** (a) the `/play` poll writes `offline — retrying`
   on any non-OK response and, because a 304 takes the "nothing to do" branch without touching the
   label, the warning never clears itself once shown — I sat on a false `offline — retrying` for
   ~95 seconds while `/api/me` was returning 200 (`runtime/src/client/shared/poll.ts:30-38`,
   `runtime/src/client/play/main.ts:155-162`); INFERRED from source, symptom OBSERVED. (b) two
   rendered instances of the word "preview", both in negating sentences — for the vocabulary
   auditor to rule on.

## acceptance measurements taken (§H subset in my lane)

All OBSERVED, Desk 1, `getBoundingClientRect` / `getComputedStyle`, `scrollY=0`.

- Settled night, 1366×768: consequence fully above the fold on all five nights; next night's
  `#fhLock` absent from every results state. **PASS.**
- Sellout: `FULL HOUSE` top 192 (<200); `1,975 TURNED AWAY` bottom 507 and second-largest figure
  (40px vs 72px turnout). **PASS.**
- Settled night: ≤2 figures ≥34px (1 on ordinary nights, 2 on the sellout); largest figure is the
  turnout, never money. **PASS.**
- Pre-lock 1366×768: `#fhPriceReadout` 68px, the only element ≥34px on the frame; `#pinDisplay`
  16px. **PASS.**
- Pre-lock 1024×600, PIN card un-collapsed via `#btnShowPin`: `#fhPriceReadout` 64px (≥64),
  `#fhLock` 311–**367**, caption `.m2-cta-caption.fh-blind-note` bottom **471**, both ≤600, at
  `scrollY=0`. **I could find and press LOCK IT IN without scrolling.** **PASS.**
  (`04-night1-1024x600-pin-open.png`)
- `.fh-blind-note` computed font-size 14.5px (≥14). **PASS.**
- Plan tick label `PLAN $24` does not intersect the knob at 1366×768 or 1024×600. **PASS**
  (visual, `03-`/`04-`).
- No line/`<path>` joining history dots; no mark for the pending night. **PASS** (visual,
  `09-night3-open-full.png`).
- No pre-lock figure derived from the pending action; forbidden-vocabulary scan of `#gameBody`
  returned only 2× "preview", both negating. **PASS with the referral above.**
- `> 200px` contiguous dead region below last content at 1366×768: **FAIL in LOBBY only**
  (`01-lobby-1366.png`); PASS on all PLAY and results states.
- Reduced-motion timing, CASH/RENEWALS font-family+size+colour collision, `/board`, `/teach`,
  REVEAL / ADAPT / COUNTERFACTUAL / SYNTHESIS on `/play`: **NOT VERIFIED** — not measured.
