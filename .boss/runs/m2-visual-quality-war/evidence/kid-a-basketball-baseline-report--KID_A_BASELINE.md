# KID A BASELINE — Module 2 Lesson 1 "Full House"

**Label: SIMULATED KID / AGENT-PLAYTESTED.** A Player/Gameplay critic drove the real build in
Chromium as a persona. **Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.**

Run `m2-visual-quality-war` · assignment `kid-a-basketball-baseline` · actor `kid-a-basketball`.
Build: `runtime/dist` as committed, served on port 4403. One full pass: LOBBY → HOOK → 5 nights →
REVEAL (7 stages) → ADAPT → COUNTERFACTUAL → SYNTHESIS (6 cards) → COMPLETE. 4 desks, teacher +
projector live. Kid A = Desk 1, New York Knicks, "Rae & Ben", 1366x768, pairs on one device.
Screens: `docs/gauntlet/module-2/premium/screens-kid-a/`.

Persona: grade 5–6, knows the NBA cold, reads fast, skips paragraphs, calls out fake sports logic.

Kid A's actual line: N1 $34 · N2 $44 · N3 $60 + $60,000 event money · N4 $90 + upper bowl open ·
N5 $34 (ran Night 1's price back on Night 1's card). Ended $1,928,456 cash, **0% renewals**.

---

## Pull rating for this persona: **WEAK**

The economics underneath is alive — Night 3 emptied the Garden, Night 5 drew 800 fewer people at
the same price, the Two Peaks board is genuinely clean. But at the viewport this class runs on,
**the consequences of my own decisions render below the fold and nothing tells me to scroll**, my
device is a frozen picture through the entire seven-stage reveal, and every night is the same
screen. What I actually played was: read a card, drag a slider, press a gold button, wait, repeat.
That is closer to information → choice → Continue than the loop deserves.

---

## 1. Biggest failure — the consequence is below the fold

Measured on a single-desk 1366x768 session (the design target), immediately after the teacher rings
the bell, with `scrollY = 0` and no auto-scroll:

| element | top (px) | viewport |
|---|---|---|
| night-result panel | **758** | 768 |
| box score (CAME × PRICE = TICKET MONEY) | **813** | 768 |
| page height | 1227 | 768 |

Evidence: `31-fold-check-1366-after-bell.png`, `09-play-n1-result.png` (viewport) vs
`09-play-n1-result-full.png` (fullPage). What fills my screen when the bell rings is **tomorrow's
card and an empty price dial reset to $24**. My result is a 10px sliver at the bottom edge.

Same defect eats the loudest moment in the product. Desk 3 sold out Night 4 — 19,800 of 19,800,
6,525 turned away — and the gold FULL HOUSE panel is cut in half by the bottom of the screen
(`19-desk3-n4-result.png` viewport vs `19-desk3-n4-result-full.png`). **The lesson is called Full
House and a pair that does not scroll never sees a full house.** Asked directly: no, the sellout
did not feel like anything. It is a well-drawn panel in a place the kid does not look.

At 1024x600 it is worse: `#fhLock` (LOCK IT IN) top = **664px in a 600px viewport** — the primary
action of the lesson is off the bottom of the screen before you scroll (`30-play-1024x600-n1.png`).

## 2. My screen is frozen for the entire reveal

The eight student screenshots taken across REVEAL stages 0–7 are **byte-identical** (md5
`05aa7a5185a8c10e1dcbde46ce5b736f`, files `22-play-reveal-s0.png`, `23-play-reveal-s1..s7.png`).
Seven teacher clicks, seven board changes, zero change on my device.

Worse, at **stage 0** — while the board still reads "Waiting for your teacher to put up the first
night" (`22-board-reveal-s0.png`) — my device already shows **THE TWO PEAKS — NIGHT 3, YOUR MARKET,
$46 vs $38, "the cheaper ticket made more money."** The punchline of the lesson is sitting on every
student device six stages before the room sees it on `23-board-reveal-s6.png`. (OBSERVED in the
stage-0 student text dump. Cause INFERRED from `fullHouse.ts` `onPhaseExit`: leaving PLAY
force-releases Two Peaks, so a teacher who advances the phase without pressing the Two Peaks button
ships the spoiler to the desks.) In the room, this means the teacher's biggest reveal lands on
students who have already read it and looked away.

## 3. Every night is the same screen; nothing escalates

N1, N2, N3, N4, N5 render as one layout with different card text (compare `03-play-n1-blind.png`,
`11-play-n2-result.png`, `14-play-n3-result.png`, `17-play-n4-result.png`). Night 4's card says
"The biggest night of the five" and my screen does not get one degree louder. Bored: Night 3. The
board during play does the same thing — the same scatter with one more dot family per stage
(`23-board-reveal-s1..s5`), and **no dot is labelled with my desk**, so during the reveal I cannot
find myself in the picture I am supposed to argue about.

## 4. The book that decides the game has no alarm and no explanation

I went 50% → 30% → 10% → 9% → 18% → **0%** renewals. Every step is a number in the header strip,
rendered in the same gold as CASH, with no colour change, no warning, no consequence I can feel
during play (`11-play-n2-result.png` header: `CASH $636,792  RENEWALS 10%`;
`20-play-n5-result.png`: `RENEWALS 0%`). I destroyed my entire season-ticket base and the product
never once raised its voice.

Nothing on the result tells me **why** it moved. The only explanation is the same 3-line blue rule
box reprinted next to the dial every night, which I stopped reading on Night 1. And the rule
mispredicts: it says "price ABOVE what they think tonight is worth and they quit," and on Night 4
I charged **$90 — the highest price of my season — and renewals went UP nine points**
(`17-play-n4-result.png`). A rule that my own biggest result contradicts is a rule I no longer
believe. (Economic-truth judgement is not my lane; flagging that the student-visible rule does not
predict the student-visible outcome.)

## 5. Fake sports logic a basketball kid catches

- **No opponent is ever a team.** "a club that has lost four straight", "last season's beaten
  finalists", "the rookie everybody is talking about." I know why (a desk must never host itself —
  `SOURCE_NOTES` / gate-l1-sr F1), but from my chair the game is a real-teams game that refuses to
  name a single real opponent. Real Tuesday-vs-Saturday desks read "Hornets, 9-24, 4-game skid".
  Draw 22/100 is a number a spreadsheet has; the roster and the record are what a fan has.
- **The Night 4 card makes a promise it does not keep.** "The biggest night of the five. Demand is
  going to run past what this building holds." I opened 2,400 extra seats for $95,000 and finished
  at **71.1% — 6,425 empty seats** (`17-play-n4-result.png`). The card stated a fact about tonight
  that was false for my desk, and no line afterwards says "your $90 is why it did not overflow."
  The bowl decision also gets no verdict of its own — the event-money dial gets a plain-English
  payback line, the $95,000 capacity bet gets nothing.
- **My club has no identity.** MSG is a name in a header. Desk 1 and Desk 3 both run the Knicks and
  wear different randomly-coloured crests (`01-board-lobby.png` chips). No blue and orange, no
  building, no court, no crowd anywhere in the product. `01-play-lobby.png`: the single biggest,
  brightest object on my first screen is a four-digit rejoin PIN.
- Copy defect a sports kid trips on: synthesis reads "**On Night 3 in New York Knicks**" and "New
  York Knicks: somebody charged $18" (`27-board-synth-p3.png`, `27-board-synth-p4.png`) — the club
  name is being used where the city or the building belongs.

## 6. What feels like school

- HOOK is ~110 words of prose in one card before I can touch anything (`02-play-hook.png`).
- The blue renewals rule box, reprinted identically on all five nights, three lines every time.
- The second dial is unlabelled next to its number (a `−  $0  +` stepper) and its explanation is
  behind a **disclosure triangle**: "What does this money actually do?" — a spoiler I must open to
  understand a control I am being asked to set (`04-play-n1-spendrule-open.png`). The explanation
  is 90 words and ends "**Small either way, next to what your price does**" — the game telling me
  its own second mechanic barely matters. I never touched it again after Night 3.
- "No preview. Nothing on this screen tells you what tonight will make." — that is the designers
  talking to the teacher about the design, not the game talking to me.
- The projector's largest body text at every play and reveal stage is a 40-word caveat about what
  the picture is NOT (`15-board-n4-open.png`). At Night 4 · THE SHOCK the board is a dot cloud plus
  ~130 words of paragraph (`23-board-reveal-s4.png`) — the Indiana Fever fact is the best real
  sports content in the lesson and it is delivered as six lines of small type on a projector.
- SYNTHESIS: the board cards are **title + one paragraph, no visual at all** (`27-board-synth-p3`),
  card 4 is ~130 words and card 5 has six dollar figures in one block; the same four-sentence
  "flights and hotels… bake sale in the rain…" trailer is reprinted verbatim under all six cards.
  My own device for the whole closing ceremony is one line — "Look up at the board." — plus one
  question (`26-play-synth.png`).

## 7. What did work (stated once, not praise — these are the parts that must survive a redesign)

- The blind commitment itself. No preview means my partner and I actually argued about the card.
- The Night 3 result: the beaten finalists in the building and 7,810 people, 39.4%. That is a real
  "our decision caused that?" moment — it just happened offscreen.
- The counterfactual screen `25-play-cf.png`: NIGHT 1 $34 → 14,142 / NIGHT 5 $34 → 13,342, "-800
  people, and that is renewals -800." Two numbers, same price, one sentence. Best student screen in
  the build; the only place I could say what I would do differently.
- The Two Peaks board `23-board-reveal-s6.png` and the FULL HOUSE panel `19-desk3-n4-result-full`.

---

## Founder prosecution questions, in the kid's voice

- **What am I supposed to do?** Pick a ticket price for tonight. Clear within five seconds — the
  gold button says LOCK IT IN. I did not understand the second dial until I opened a spoiler.
- **Why should I care?** Because I run the Garden and I want a full house. Real. But by Night 3 the
  reason narrowed to "make the cash number go up," because that is the only number that moves
  visibly and the renewals number never shouts.
- **What would I click first?** The price slider. Then the +/− on the money dial, to find out what
  it is.
- **What is confusing?** Why renewals dropped 20 points twice, then rose 9 at my highest price ever.
  Why the price dial resets to $24 every night instead of holding where I left it. Why the Night 4
  card said the building would overflow and it did not.
- **What feels like school?** The hook paragraphs, the reprinted rule box, the disclosure triangle,
  the board caveat paragraph, the six text-only synthesis slides.
- **When am I bored?** Twice per night: after locking ("Locked. Nothing to do but find out" —
  `07-play-n1-locked-wait.png`, a screen that is 60% empty), and through the entire seven-stage
  reveal where my screen never changes.
- **What am I waiting for?** The crowd. I want to see the building fill. It never appears.
- **Did the result surprise me?** Yes, twice — 39.4% on the big-name night, and 800 fewer people on
  the repeat card. Both landed below the fold.
- **Do I understand why it changed?** Turnout, yes (price and the card). Renewals, no — and that is
  half the game.
- **Can I tell what I might do differently?** Only at COUNTERFACTUAL, and only from the N1/N5 pair.
  The WHAT IF list ("The most cash we could find $2,416,884 · 65%") reads like a score I lost, in a
  paragraph with "$715 each and the last one costs $51,478" in it that I did not finish reading.
- **Another round?** Yes — but to beat $2,416,884, not to re-run the economics.
- **Another BOW class?** Undecided. I would come back for the argument, not for the screen.
- **Does my NBA knowledge give depth without being required?** It is not required — draw 22/100 and
  "Tuesday" price fine with zero fandom, which is correct. But it also buys me almost nothing: no
  team, no opponent, no roster, no standings, no building. My knowledge is decoration.
- **Text volume per screen?** Too high everywhere except the box score and the N1/N5 pair. Hook 110
  words; spend rule 90; renewals rule 55 reprinted five times; board caveat 40 at the largest body
  size on the projector; synthesis cards 60–160 each.
- **Does the visual make the building feel real?** No. There is no arena, no crowd, no court, no
  club colour on any of the three surfaces. Capacity is a chip that says "19,800 seats" and fill is
  a 6px gradient bar.

---

## Required repairs (would move this persona)

**R1 — BLOCKING. Make the consequence the screen, not a footer.** After the bell, the night's
result must own the viewport at 1366x768 (and at 1024x600) before tomorrow's dial is reachable —
its own state, arriving on its own, not a panel under a fresh decision. Evidence: result top 758px
/ box score 813px in a 768px viewport, `scrollY=0`, no auto-scroll.

**R2 — BLOCKING. The sellout must be seen without scrolling.** FULL HOUSE + "N could not get in"
must land in the first screenful, and should be visible on the board at the moment it happens or at
the reveal stage that belongs to it. Right now the lesson's title event is a below-the-fold panel.

**R3 — BLOCKING. Fix the Two Peaks spoiler and give the student device a reveal state.** The
force-release on PLAY exit puts the punchline on every desk before the board shows it. During
REVEAL the student surface must change with the teacher's stages (my night lighting up when the
class's night goes up; my dot findable on the board), instead of eight byte-identical frames.

**R4 — HIGH. Give renewals a felt state.** An alarm treatment below a threshold, a per-night line
that says in my own numbers why it moved ("$34 on a 22-draw Tuesday is $10 over your plan — 20
points quit"), and a visible in-play consequence (my base shrinking my crowd) instead of a silent
percentage in a header. Reconcile the printed rule with the Night-4 case where the highest price of
the season raised renewals.

**R5 — HIGH. Make Night 4 escalate, and keep the card's promise.** The biggest night must look
different from the quiet Tuesday on all three surfaces, and if I price it high enough that demand
does not overflow, the result must say so in one line. The $95,000 bowl bet needs its own verdict
line the way the event money has one.

**R6 — HIGH. Put the building on the screen.** A drawn arena that encodes realized fill and lights
up on a sellout, in club colour, on the student result and on the board. Every other repair here is
about legibility; this one is why an 11-year-old stays in the chair.

**R7 — MEDIUM. Cut the reading.** Hook to ≤ 40 words plus the two books. Spend rule to one printed
line beside the dial (no disclosure triangle, and stop telling me the mechanic is small). Renewals
rule to one line. Board caveat off the largest body slot. Synthesis cards to one headline, one
computed visual from our own numbers, one takeaway line — and print the "beyond sports" trailer
once, not under all six.

**R8 — MEDIUM. Let me feel my club.** Club colour on my desk header and my dot; the same crest for
two desks running the same club; and give the opponent a record and a skid, not only a role and a
number, within the "no desk hosts itself" constraint (a fictional-but-specific visitor with a
record would still beat "a club that has lost four straight").

**R9 — LOW.** Price dial should open at my last night's price, not snap back to the plan price.
Fix "in New York Knicks". Move the rejoin PIN out of the biggest slot on first contact.

## Would NOT change

- Blind commitment. No preview. Do not add a projection card, ever.
- Two books that never sum, and no leaderboard/XP/trophy anywhere — correct, and the class reveal
  is the right reward.
- Night 5 replaying Night 1's card. Best mechanic in the lesson.
- Two Peaks as a computed class result rather than a stated fact.
- Draw as a printed 0–100 number so a non-fan prices as well as a fan.
- Teacher-paced stages with manual fallback; no student timer.
- The Indiana Fever and San Francisco Giants facts — keep the content, change the delivery.

---

## Not verified

- Any human student reaction. This is a simulated persona.
- Whether the Night-4 renewals rise is an economic-model defect or a legible-copy defect (Economic
  Truth's lane; I observed only that the printed rule mispredicted my own result).
- 1920x1080 vs 1366x768 projector fit beyond the frames captured here; contrast/CVD; touch targets.
- Rejoin, refresh, mid-class restart.
