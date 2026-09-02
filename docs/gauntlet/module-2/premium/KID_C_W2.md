# KID C — wave 2 playtest of Full House (`/play`)

**SIMULATED KID / AGENT-PLAYTESTED.** Not human-tested, not classroom-proven.
Persona: grade 5–6, follows no sports at all (cannot name an NBA team's city, has never been
to a game), likes drawing and animals. Playing in a pair on one 1366×768 Chromebook, Desk 3 ·
New York Knicks, in a 4-desk live class with a teacher and a projector. Head under test:
git `6c4c7cc`, port 4446, full arc lobby → 5 nights → reveal → adapt → counterfactual →
synthesis → complete. Screenshots: `docs/gauntlet/module-2/premium/screens-w2-kid-c/`
(manifest: `screens-w2-kid-c/MANIFEST.md`).

Prices I chose, reasoning from things I know and not from basketball:
N1 **$12** ("a movie ticket"), N2 **$120** (the very top, to see what happens), N3 **$10** (the
very bottom), N4 **$30** and I pressed the extra-seats button, N5 **$12** again (same as my
first night, on purpose).

---

## what-the-student-plays

I run one building for five nights. Each night a card tells me the day, who is visiting, a
number called "draw" out of 100, and whether it is on TV. I move a big slider to pick what a
ticket costs, I can spend money on "making it an event," and on one night I can pay $95,000 to
open 2,400 more seats. Then I press **LOCK IT IN** and I do not find out anything until the
teacher rings a bell. After the bell my whole screen turns into the result: how many people
came, the money math, and whether my season-ticket people went up or down. Then I press NEXT
and the next night's card is there.

It is a real game, not a quiz. **OBSERVED:** my $120 night sold **zero** tickets and lost
**-$520,000** (`13-n2-result.png`); my $12 night sold out with **326 people turned away**
(`13-n1-result.png`); I dug myself to **-$446,000** and then climbed back out on Night 4 with
$30 + the extra seats for **+$450,600** (`13-n4-result.png`). Nothing anywhere was a menu of
three choices with a Continue button.

---

## pull-rating

**STRONG** for this persona (not MAGNETIC).

Single biggest cause it is not MAGNETIC: **the game never tells me *why* the number happened,
so the excitement is real but the understanding is guesswork.** After my worst and most
dramatic moment — zero people, minus half a million dollars — the only sentence on the whole
page about causes is `You charged $120.` and it sits **below the fold** (`13-n2-result-full.png`).
Nothing says "$120 was more than people would pay for a draw-51 night." I adapted by feel
("that was too big, go small"), not because the screen taught me.

Would I ask to play again? **Yes** — I wanted to fix Night 2, and pressing LOCK IT IN with no
preview genuinely felt like a bet. I said "oh no" out loud at the zero and "yes!" at the
1,750 turned away.

---

## biggest-failure

**1. (highest severity) The consequence screen states the outcome and never states the cause,
and the one sentence that comes closest is below the fold. OBSERVED.**
At 1366×768, `scrollY=0`, Night 2 (0 people at $120): `#fhResult` occupies `top 124 → bottom
915` against `innerHeight 768` — the last 147px are off-screen, and what is off-screen is the
entire `WHAT HAPPENED` card (`13-n2-result.png` vs `13-n2-result-full.png`). What it contains
is: `Saturday · a solid playoff club · draw 51/100` and `You charged $120.` — a restatement,
not a reason. Meanwhile the right column has a **contiguous empty region from y≈575 to y≈768
(≈193px)** sitting directly beside it. So the screen has room for the explanation on the first
viewport and does not use it. For a kid who does not follow sports, this is the whole lesson:
I can see *that* my decision caused it, I cannot see *why*, and I cannot say the sentence out
loud in the debrief.

**2. During the entire projector reveal my device is dead. OBSERVED.**
The `/play` body text is **byte-identical (md5 `a68984a9`) across reveal stages 1, 2, 3, 4 and
5**, and identical again between 6 and 7 (`21-reveal-1-play.txt` … `21-reveal-7-play.txt`,
`21-reveal-*-play.png`). Seven teacher clicks; my screen changes once. Pairs on one device with
nothing to do for several minutes is where a class comes apart, and my partner and I had
nothing to point at on our own screen while the board moved.

**3. The word on the receipt is not the word on the button. OBSERVED.**
Before I lock, the control says `Open 2,400 more seats tonight · $95,000 · paid whether they
fill or not` — perfect, I understood it with zero sports knowledge (`10-n4-prelock.png`). After
the bell the same thing is called **`UPPER BOWL -$95,000`** in the money list and **`Upper bowl
open`** in the picture key (`13-n4-result.png`). "Upper bowl" appears **nowhere** before the
lock — grep across every pre-lock and dials-set capture returns zero hits; it first appears in
`12-n4-locked-waiting.txt`. I do not know what an upper bowl is. I guessed it meant my extra
seats only because the number $95,000 matched.

**4. The picture's key points at a colour that is not in the picture. OBSERVED.**
The `Came` swatch is amber, sampled RGB **(240,169,74)**; every filled seat in the bowl renders
violet, sampled RGB **(53,47,77)**–(bright violet). There is no amber anywhere in the seating
(`13-n3-result.png`, crop of the ARENA OUTCOME card). So the one key that would let me read the
picture does not match it.

**5. First screen after joining is 401px of nothing. OBSERVED.**
LOBBY: the last content in the main column (`Waiting for your teacher to start.`) has
`bottom = 367` at `innerHeight 768` — **401px of empty black** below it, plus an empty rounded
box in the left rail with no content in it (`01-lobby.png`). My first impression of the product
was an almost-blank dark page. That is the moment I decide whether this is a game or homework.

**6. An empty control labelled `REJOIN PIN` with no PIN in it. OBSERVED.**
From REVEAL onward a full-width pill reading `REJOIN PIN` renders with `#pinDisplay` at
`height 0` — the label with nothing inside it (`40-cf.png`, crop of the top bar; measure files
`13-n5-result-measure.json`, `#pinDisplay: {top:0,bottom:0,h:0}`). It reads as broken software.

---

## moment-by-moment-notes

**What did I see first and what did I think it was?**
OBSERVED (`01-lobby.png`). A dark page: "Full House", "YOUR DESK — You have Desk 3. Tonight you
run the New York Knicks' building — Madison Square Garden," and "Waiting for your teacher to
start." I thought it was a page that had not loaded the rest yet. I did not know what "run the
building" meant — was I a player? A guard? The screen never says "you sell the tickets and pay
the bills" until the HOOK. There is no picture of the building here, and there is a picture
available two screens later.

**Did I know what to do?**
OBSERVED (`03-small-night1-first-contact.png`, `10-n1-prelock.png`). Yes, quickly. One giant
`$24` with a slider under it, one card that says what tonight is, and a purple `LOCK IT IN`
button. `No preview. Read the card, read your own nights, and commit.` told me plainly that
nothing was going to show me the answer. I never looked for a Help button.

**After the bell, did I know what happened and why, without scrolling?**
OBSERVED. **What: yes. Why: no.** Without scrolling I got: the headline (`NIGHT 2 · 0 CAME AT
$120`, `top 189`), `WHO CAME 0` at 72px (`bottom 326`), the whole money chain down to
`-$520,000` (`bottom ≈ 640`), the renewals move `30% → 10% down 20 points` (`bottom ≈ 575`),
and the purple NEXT bar (`top 668, bottom 716`). That is a very clear *what*. The *why* is
never written anywhere on any screen, above or below the fold, on any of my five nights. On the
sellout night the closest thing — "326 people wanted in and could not get a seat" — is also
below the fold (`13-n1-result.png` `docHeight 983` vs `768`).

**Did the picture of the building help me understand who came, or was it decoration?**
OBSERVED, **partly help, partly misleading.** It does respond to turnout: measured bright-violet
seat pixels in the same box were **0.6%** at 0 people, **9.7%** at 38.5% full
(`70-midfill-result.png`, a separate one-night session), and **21.6 / 22.2 / 23.1%** at 96.1 /
98 / 100% full. So "half the building glowed" was readable. But two things broke it for me:
(a) on my **sold-out, 100%, FULL HOUSE** night the picture still shows big grey wedges on the
left and right sides (`13-n1-result.png`) — I counted them as empty seats and thought the
screen was contradicting itself, because at 38.5% those same grey areas *are* the empty part;
(b) the amber `Came` key matches nothing in the picture (finding 4). I could not use the
picture to say a number; I used the text.

**Did I understand the difference between the two money numbers (CASH, RENEWALS)?**
OBSERVED, roughly. **CASH** I understood completely — the receipt shows `TICKETS $12 × 19,800`
`+ IN-ARENA` `− BUILDING BILL` `= CASH`, which is arithmetic I can follow (`13-n1-result.png`).
I did not know "IN-ARENA" as a word but "what those same people spent inside" under it told me
(popcorn). **RENEWALS** I understood as "a percent that goes down when I am greedy or too
cheap" — and I was right by accident. I did **not** understand that these are people buying a
whole season in advance; "season-ticket holders coming back" assumes I know what a season
ticket is, and nothing draws or shows one. The screen repeats `You are keeping two books, and
they do not add up to one number` in **three places at once** on the same viewport
(`13-n1-result.png`), which told me they were different but never told me why I should care
about the second one. I would have added them if the game let me.

**Did anything tell me what tonight would make before I locked? (forbidden)**
OBSERVED: **no.** Checked all five pre-lock captures (`10-n1..n5-prelock.png/-full.png` and
`11-*-dials-set`). The dials show only dollars; the history chart has dots for settled nights
only and no mark for tonight; the building picture is not lit before the bell; the TOMORROW
panel shows only tomorrow's *printed card facts* (day, draw, TV), never an outcome. Moving the
slider from $10 to $120 changed nothing on the page except the number itself.

**Did anything look like a score/level/reward? (forbidden)**
OBSERVED: no XP, no badges, no stars, no trophies, no leaderboard, no other desk's numbers —
grep for `XP|level up|badge|trophy|leaderboard|score|streak|rank|winner` over every `/play`
capture returns **0**. One caution that is not reward chrome but *feels* like being graded:
the counterfactual lists `What you actually did $78,860 · 0%` above `The most cash we could
find $2,416,884 · 65%` (`40-cf.png`). As the kid, the last thing the game said about my play
was that a robot did it thirty times better. I felt bad, not curious.

**Words I did not understand (every one).**
OBSERVED, from the rendered text. Never explained anywhere on my screen: **upper bowl**
(finding 3); **draw** as a noun — "VISITING CLUB'S DRAW 97/100" is never defined; the closest
gloss is "The bigger the visiting club's Draw, the higher the price they will forgive," which
uses it without saying it means *how many people want to come*; **season-ticket holders / the
plan / plan price / renewals**; **in-arena**; **beaten finalists**; **playoff club**; **rookie**;
**local TV vs national TV** (I worked out from the flavour line "the whole country can watch it
free at home"); **market** ("the biggest market in American sports"); **demand** ("Demand is
going to run past what this building holds"); **the base** ("Protecting the base starts cheap
and ends expensive"); **exchange rate**; **capacity** ("listed basketball capacity 19,812");
**changed hands** ("Those seats changed hands again outside the building"); **in the red**
(guessable from the red colour); **the bill** (worked out from "what it costs to open the
doors"). I never saw the words "the bowl" or "the shock" on my screen — **the shock: NOT
VERIFIED on `/play`** (the word appears in teacher/board vocabulary per the brief; I did not
grade those surfaces).
None of these stopped me playing. The two that actually cost me understanding are **draw** and
**upper bowl**.

**Did the Night 5 card being Night 1 again mean anything to me?**
OBSERVED, **not at the moment — only later, and only because the teacher's screens said so.**
My Night 5 result screen says `NIGHT 5 · 19,026 CAME AT $12` and, below the fold,
`Tuesday · a club that has lost four straight · draw 22/100 · You charged $12.`
(`13-n5-result.png`, `-full.png`). It **never says this is the same card as Night 1** and never
shows Night 1's 19,800 next to it. I charged the identical $12 on the identical card and 774
fewer people came, and the screen let that pass without comment. It only landed two phases
later in ADAPT ("Night 5 was Night 1's card again. Why did a different number of people show
up?", `30-adapt.png`) and in COUNTERFACTUAL, where the two cards sit side by side —
`NIGHT 1 $12 19,800 renewals 50%` vs `NIGHT 5 $12 19,026 renewals 6%` (`40-cf.png`). That side
-by-side is the best thing in the whole lesson for me and it arrives ten minutes late. The line
under it, `wanted in -1,100 (renewals -1,100) · seats only allowed -774`, is not a sentence and
I could not read it.

**Did anything feel cheap, like school software?**
OBSERVED. Mostly no — the dark cards, the violet lock button, the big numbers and the lit arena
look like a real app, better than anything on my school Chromebook. Three things break it:
the near-blank LOBBY (finding 5), the empty `REJOIN PIN` pill (finding 6), and the empty
rounded box in the left rail that never gets content (`01-lobby.png`, `40-cf.png`). Also the
`KID C W2 · SEATED AS NIA & THEO` strip renders flush at x=0 and the first letter is clipped by
the window edge in every frame.

**1024×600 first contact, PIN card un-collapsed — is LOCK IT IN reachable without scrolling?**
OBSERVED: **yes.** At `scrollY=0`, `innerHeight 600`: `#fhLock` `top 311 → bottom 367`; its
caption `.fh-blind-note` `top 376 → bottom 471`; `#fhPriceReadout` `64px` at `top 259 →
bottom 325`; `#pinDisplay` `16px` at `top 58` (strictly smaller than the readout). Page scroll
height is 1039 but everything needed for the first decision is inside the first 471px
(`03-small-night1-first-contact.png`, `03-small-night1-measure.json`).

**Was the game recoverable after I played badly?**
OBSERVED: yes, and this is the best-designed thing in it. Two disastrous nights put me at
`-$446,000` cash and `0%` renewals; the game responded with `In the red — locked at $0` on the
event dial (a consequence with a plain-English reason, unlike everything else), and Night 4 at
$30 with the extra seats brought me to `+$450,600` and renewals back up `0% → 6%`
(`10-n4-prelock.png`, `13-n4-result.png`). I never felt the run was over.

---

## required-repairs

Ordered by severity. I do not implement; these are the repairs my play demands.

1. **Put the cause in the first viewport, in one plain sentence, on every settled night.**
   The results state must say *why* in the kid's language next to the number — e.g. "Nobody
   came: $120 was far more than a draw-51 Saturday is worth to them," or "It sold out: $12 on
   a draw-22 Tuesday was cheap enough that more people wanted in than you have seats."
   Acceptance: on all five nights at 1366×768, `scrollY=0`, a causal sentence naming the price
   and the card has `bottom ≤ 768`; the ≈193px empty right-column region below RENEWALS is the
   obvious place. (Fixes finding 1; below-fold call below.)
2. **Give the student device something of its own during REVEAL.** At minimum, my own night for
   the stage being revealed should surface as the board advances, so the `/play` text is not
   md5-identical across five consecutive teacher clicks. Acceptance: `/play` body text differs
   between every consecutive reveal stage.
3. **Use one name for the extra seats.** Whatever the button says before the lock ("Open 2,400
   more seats") must be what the receipt and the picture key say after it. Acceptance: the
   string "upper bowl" appears in a post-lock state only if it also appeared pre-lock with a
   plain-English gloss. Same repair class for **draw**: one clause, once, on the play card —
   "draw = out of 100, how many people want to see this club."
4. **Make the arena picture legible.** The `Came` key must be the colour the filled seats
   actually are, and a 100% night must not render large grey wedges that read as empty seats.
   Acceptance: sampled swatch RGB is within tolerance of sampled filled-seat RGB; at 100% fill
   no unlit region larger than a seat block remains inside the bowl.
5. **Say "Night 5 is Night 1's card again" on the Night 5 result, not two phases later** — with
   Night 1's turnout printed beside Night 5's. Acceptance: the Night 5 settled state names the
   repeat and shows both turnouts at `scrollY=0`.
6. **Fill or remove the empty furniture.** The LOBBY main column (401px of nothing after
   `bottom 367`) needs the building, the job description, and the two books it is about to hand
   me; the `REJOIN PIN` pill must not render with `#pinDisplay` at height 0; the empty rail box
   must have content or not exist. Acceptance: no `/play` state has a contiguous dead region
   > 200px below its last main-column content, and no labelled control renders empty.
7. **Rewrite `WHERE THAT CHANGE CAME FROM` as a sentence.** `wanted in -1,100 (renewals -1,100)
   · seats only allowed -774` is unreadable at this grade. Acceptance: a grade-5 sentence.

### Wave-1 finding "the consequence lands below the fold": **PARTLY DISCHARGED**

Measured, 1366×768, `scrollY=0`, `getBoundingClientRect`, my five nights (OBSERVED,
`13-nN-result-measure.json`):

| Night | headline `top` | WHO CAME `bottom` | CASH chain `bottom` | renewals move `bottom` | NEXT `bottom` | `#fhResult` `bottom` | `docHeight` |
|---|---|---|---|---|---|---|---|
| N1 sellout | 189 (`FULL HOUSE`, 40px) | 366 | ≈690 | ≈650 | 756 | 983 | 983 |
| N2 zero | 189 | 326 | ≈640 | 575 | 716 | 915 | 915 |
| N3 98% | 189 | 326 | ≈640 | 575 | 716 | 915 | 915 |
| N4 sellout + extra seats | 189 | ≈366 | ≈700 | ≈660 | ≈756 | ≈983 | ≈983 |
| N5 96.1% | 179 | 316 | ≈630 | ≈565 | 706 | 905 | 905 |

- **Discharged:** the settled headline, the WHO CAME figure, the full CASH chain, the renewals
  movement and the NEXT control are all `bottom ≤ 768` on every night including the sellout and
  the zero-turnout night. Sellout headline `top 189 < 200`; turned-away `326` at 40px with
  `bottom 517`, the second-largest figure on the frame; largest figure is always the turnout
  (72px), never money; **≤ 2 figures ≥ 34px** on every settled night (N2/N3/N5: one; N1: three
  — `FULL HOUSE` 40px, `19,800` 72px, `326` 40px, i.e. **N1 and N4 exceed the "≤ 2 figures
  ≥ 34px" acceptance by one**). No next-night `#fhLock` in the first viewport on any night.
- **Standing:** the *explanation* is still below the fold on every night — `#fhResult` runs
  137–215px past the viewport and what is out there is the `WHAT HAPPENED` card, which on a
  sellout night carries the turned-away/resale sentence and on every night carries the only
  price-and-card line. For a kid who cannot supply the missing sports reasoning himself, the
  part that is still below the fold is the part that matters most.

**NOT VERIFIED by me:** `/teach` and `/board` quality (out of my wave); the word "the shock" on
`/play`; reduced-motion timings; contrast/CVD; whether the arena picture discriminates fill
levels between 40% and 96%; whether a real child reads any of this the way I did — I am a
simulated kid, not a human tester.
