# KID C — W2 FINAL RE-CHECK of Full House (`/play`), build head 84d8983

**AGENT-PLAYTESTED / SIMULATED KID.** Never human-tested, never classroom-proven. I am a
simulated grade-5/6 student who does not follow basketball, does not know what a season ticket
is, reads at grade level and does not like reading. Pairs on one Chromebook: I played as
"Rae & Ben", desk 1, New York Knicks, with three other desks in the room. Student viewport
1366x768; first contact and one settled night also measured at 1024x600. Port 4444, fresh
session, whole arc played by me: join -> LOBBY -> HOOK -> 5 nights -> 7 reveal stages -> ADAPT ->
COUNTERFACTUAL -> 6 synthesis pages -> COMPLETE. Every claim below is OBSERVED in a screenshot or
a `getBoundingClientRect`/`innerText` dump unless it says INFERRED or NOT VERIFIED.
Payload: `/tmp/.../scratchpad/boss/w2-final-kid-c/kidc-log.json`; screens in
`screens-w2-kid-c-final/`.

My five nights (my real choices, including one deliberately dumb one):
N1 $46 -> 10,878 came, cash $176,192, renewals 50->30.
N2 $120 (the dumb one: "we sold half the seats, charge loads") -> **0 came**, -$520,000, renewals 30->10.
N3 $12 (panic) -> 18,946 came, +$48,380, renewals 10->0.
N4 $40 + opened the 2,400 extra seats -> 22,200 of 22,200, 250 turned away, +$672,600, renewals 0->6.
N5 $46 (same as N1) -> 9,778 came, +$105,792, renewals 6->0. Season: $482,964 cash, 0% renewals.

---

## what-the-student-plays

One dial, one lock, five bells. I read tonight's card (day, visiting club, draw x/100, TV), I
slide a price between $10 and $120, I can push money into "making it an event", and I press
LOCK IT IN with no preview of anything. Then my teacher rings a bell and the building fills or it
does not, and I get a settled screen with the crowd, the cash chain and the renewals move. That
is a real mechanic, not information -> choice -> Continue: my choice is the only thing that
produces the number, and the number is genuinely a surprise. After N2 printed a 72px `0` and
-$520,000 (`06-n2-settled.png`) I actually wanted the next night immediately, which is the test.

## pull-rating

**STRONG** for this persona. Not MAGNETIC.

Causes for STRONG (OBSERVED): (1) the blind lock produces real dread and a real payoff — the
`FULL HOUSE / 22,200 OF 22,200 / 250 TURNED AWAY` screen on N4 (`06-n4-settled.png`) is a win I
caused; (2) the disaster is recoverable and visibly so — I went -$343,808 in the red after N2 and
finished +$482,964, and renewals moved back UP on N4 (0% -> 6%), so the game is not a death
spiral; (3) the card gives me something to reason with that has nothing to do with basketball —
`draw 22/100 · Tuesday · not on TV` vs `draw 97/100 · Saturday`; (4) the mechanic is one control
wide, so my partner and I argued about the number, not about the interface.

Causes it is not MAGNETIC (each OBSERVED, detailed below): my own screen never tells me why that
many people came, so my adaptation was feel, not reasoning; my chart silently drops the label of
one of my five nights, including Night 1 in the Night-1-vs-Night-5 comparison the lesson is built
on; the counterfactual's key line is not a sentence; and the one piece of vocabulary the whole
second book depends on ("season-ticket holder") is never explained.

I do not file a dissent: STRONG is at or above the bar. The findings below are important, not
blocking.

## biggest-failure

**The settled night explains the wrong number. The biggest figure on the screen — the crowd — has
no cause line; the only causal prose on the screen is about renewals, and it is the same four
lines every night.** (OBSERVED, `06-n1/n2/n3/n4-settled.png`, rects in `kidc-log.json`.)

On N2, `NIGHT 2 · 0 CAME AT $120` sits over a 72px `0`. The right column then prints
`.fh-renewal-cause` at top 276-396 (four clauses: "Season plan: $24 a seat. / Price well UNDER
that... / Price ABOVE what they think tonight is worth and they quit. / In between, the plan looks
like a bargain and more come back.") and `.fh-renewal-floor` at 401-431 ("The renewals rule takes
at most 20 points off in one night. Tonight's price asked for more than that."). Underneath,
`WHAT HAPPENED` says: `You charged $120 · Saturday · draw 51/100 · a solid playoff club` — that is
a re-print of what I typed in, not a cause. Nothing anywhere on my screen says the crowd was zero
*because* $120 was far more than a Saturday against a mid club is worth to the people who might
have come.

Answering the brief's question directly: **repair 4's four-clause rule does not bury me — I can
read it — but it is aimed at the wrong quantity and it does not change.** Byte-identical text at
byte-identical coordinates (top 276, bottom 396) on N1, N2, N3 and (top 308) N4. By N3 I stopped
reading it, because a block that says the same thing after a sell-out and after a zero cannot be
telling me about tonight. Worse, it is the only "why"-shaped text next to a giant `0`, so the
obvious kid misreading is "nobody came because of the renewals rule" — which is false; renewals
and turnout are different mechanisms. My honest state after each bell was: **I know what happened,
I do not know why, and the one paragraph that looks like the why is about something else.**

## moment-by-moment-notes

1. **First contact, 1024x600** (`00-join-1024x600.png`, `04b-n1-pre-1024x600.png`). Join works.
   At the pricing screen `docH` is 735 in a 600px viewport, but `#fhLock` measures top 268 /
   bottom 324 and `#fhPriceDial` 262-296 — both dials and the lock are in the first screen with
   nothing to scroll for. Repair met (OBSERVED). The 1024 layout is tighter and, honestly, easier
   to read than 1366.
2. **HOOK** (`03-hook.png`, `-full`). **Q3: the first screen makes me want to play.** The first
   768px is an arena picture, one hero line ("You are keeping two books, and they do not add up to
   one number"), and the five night cards — `.fh-slate-row` measures top 557 / bottom 747, all
   five NIGHT cards visible with day, club, a draw bar and the TV line. I could tell from that
   screen alone that Night 4 (draw 97, Saturday) is the big one and Night 1 and Night 5 are the
   same. That is a good hook. **Then it turns into homework**: `docH` 1714 (2.2 screens), and
   everything below the fold is HOUSE RULE 1-5, roughly 350 words of conditional prose, including
   HOUSE RULE 3 which is a 60-word sentence about event money that I did not read and never used
   (I spent $0 on four of five nights). I would arrive at Night 1 having read the cards and not
   the rules. NOT VERIFIED: whether the teacher reads the rules aloud (that is the /teach wave).
3. **Night 1 pricing** (`04-n1-pre.png`). Clean, one clear job: `SET YOUR TICKET PRICE`, `$24`,
   plus/minus, slider with a `PLAN $24` tick, `LOCK IT IN` at 304-360. No preview of anything.
   Dead furniture is still here but smaller than before: the empty chart panel occupies 475-761
   with two lines of text in it, and the tonight-card panel bottoms out ~150px above its own panel
   edge.
4. **Night 2, my bad night.** I set $120 because Night 1 half-filled and my partner said "make
   more money per ticket". Bell. `0 CAME AT $120`, `-$520,000`, `CASH -$343,808 in the red`, the
   arena panel goes almost black with `19,800 empty — the dark seats above the line`. **Q5,
   recovery: yes, generously.** Nothing grades me, nothing says "wrong", the NEXT button is right
   there (`NEXT: NIGHT 3 -> Wednesday · Draw 88 · national TV`) and by N4 I was $377,172 up.
   **What it does not do is tell me what to do differently** — no line says "that price was far
   above what that card was worth"; I worked out "go cheap" by feel and overshot to $12.
5. **No scrolling to see a settled night** — `docH` equals the 768 viewport on N1, N2, N3 and N5;
   only N4 overflows, by 30px (`docH` 798), which pushes the resale/turned-away sentence and part
   of `NEXT` under the fold on the most dramatic night of the five (OBSERVED rects). Compared with
   the previous wave (983px docs) this is a large improvement.
6. **Q2, my nights chart** (`#fhNights`). Readable in the moments that matter, with one real
   defect. At N4 pricing the chart is at top 586 (bottom 872, so the caption is cut) but the plot
   and labels `N3 $12 · 18,946`, `N1 $46 · 10,878`, `N2 $120 · 0` are legible in the first screen
   (`04-n4-pre.png`); at N5 it sits fully in view at 475-761 (`04-n5-pre.png`); at N3 it is cut by
   11px. Y axis is fitted (`0` to `26,500` against a max of 22,200) and labels no longer collide.
   **The defect: labels are dropped when dots are close.** On the N5 pricing screen only N4, N1
   and N2 are labelled — the N3 dot (my 18,946 night) is an unlabelled dot at top-left. In REVEAL
   and ADAPT (`07-reveal-3.png`) the labelled set is N4, N3, N5, N2 — **Night 1 is an unlabelled
   dot sitting under `N5 $46 · 9,778`**, i.e. the one comparison the whole lesson turns on is the
   one pair the chart refuses to name. The x axis says `PRICE` with no numbers at all, so I read
   the dots only from their inline labels; when the label is gone the dot means nothing to me.
7. **The extra seats** (N4). `CLOSED / Open 2,400 more seats tonight / $95,000 / paid whether they
   fill or not` before the lock; after the lock the cash chain reads `MORE SEATS -$95,000`, the
   arena key reads `More seats open`. The strings "upper bowl" and "deck" appear **nowhere** in
   any of my 30 captured states (searched the whole `innerText` log) — the previous wave's naming
   split is fixed (OBSERVED). One copy defect remains: `You also put $0 into the night with the
   more seats open.` is not a sentence I can parse.
8. **Night 5** (`06-n5-settled-1024.png`). `WHAT HAPPENED` now carries
   `Night 1's card again · $46 -> 10,878 then · $46 -> 9,778 tonight`, on the night itself, in the
   first screen. Previous wave's finding 5 is discharged (OBSERVED). This is the single best line
   on the whole student surface: it is the only place my own screen tells me something happened
   that I did not type in.
9. **REVEAL** (`07-reveal-*.png`). My device is no longer inert wallpaper: at reveal stage 3 it
   shows `YOUR NIGHT / NIGHT 3 · 18,946 CAME AT $12 / WHO CAME 18,946 / CASH $48,380 / RENEWALS
   10% -> 0%` alongside my five-night ledger and my chart, and the `/play` text md5 changes across
   stages (1819ed98, 25b82f1a, e3bfe22e, e81d3617, 0c335df4, e947b29f, e947b29f, 9dcaaccf — stages
   5 and 6 are the only identical pair). Previous finding 2 is discharged for stages 0-5
   (OBSERVED). I still have zero to do for 7 teacher clicks plus 6 synthesis clicks, and my page
   says "Look up at the board" — that is the design, but it is 13 clicks of sitting still for a
   kid who does not like reading, and the board text at those stages is long (board synthesis
   card 5 is a 120-word paragraph with six dollar figures). NOT VERIFIED: whether the teacher's
   talk carries that stretch.
10. **COUNTERFACTUAL** (`10-synth-0.png`, one poll behind my labels). The N1/N5 pair is excellent:
    `NIGHT 1 $46 10,878 renewals 50%` beside `NIGHT 5 $46 9,778 renewals 6%`. Then
    `WHERE THAT CHANGE CAME FROM: -1,100 people, and that is renewals -1,100`. That is still not a
    sentence — it prints the same number twice, never says who those 1,100 people were, and uses
    "renewals" as if it were a thing that walks. Previous finding 7 is **not discharged**, only
    reworded. Below it, `WHAT IF?` is four rows of adult finance copy ("Not a proven maximum — the
    best line we could search out", "$715 each and the last one costs $51,478"). I read the two
    big numbers ($482,964 · 0% versus $1,238,212 · 80%) and understood that I lost, which is
    actually the point and it stung correctly.
11. **Q4, does anything need basketball?** No basketball skill is required: draw is a bar out of
    100, the club descriptions ("a club that has lost four straight", "the rookie everybody is
    talking about") do the work, and national TV is explained. **But one sports-business word is a
    prerequisite and is never defined: season ticket.** HOOK says "RENEWALS is the share of
    season-ticket holders who come back next year", which is circular for me; the dial says
    `PLAN $24`; the settled screen says `season-ticket holders coming back`. I finished the lesson
    at 0% renewals without ever knowing who those people are, why they pay $24 a seat in advance,
    or why my Tuesday price offends them. Every renewals rule in the game keys off a noun I do not
    have. Second-order: `draw` is defined once, in HOUSE RULE 2, below the HOOK fold, and never on
    the card where I use it.
12. **COMPLETE** fits the viewport (`docH` 768) and closes on `YOUR JOB IS REAL 6/6`.

## required-repairs

Ordered by severity. I do not implement.

1. **Give the crowd number its own cause line, in my words, on every settled night, in the first
   screen.** One sentence naming my price against tonight's card — e.g. "Nobody came: $120 was far
   more than a Saturday against a mid club was worth to them," / "It nearly sold out: $12 on a
   draw-88 Wednesday was cheap enough that almost everyone who wanted in got in." Acceptance: on
   all five nights at 1366x768, `scrollY=0`, a sentence that contains tonight's price AND a card
   fact AND a causal verb has `bottom <= 768`, and its text differs between a zero night and a
   sell-out. Keep the renewals rule, but visibly attach it to the RENEWALS panel so the two books
   are not explained by one paragraph.
2. **Never drop a label from my own chart.** Five nights, five labels, always — offset or leader-
   line the collisions instead of deleting one. Acceptance: `#fhNights` renders exactly one label
   per settled night in every state, verified specifically for the N1/N5 same-price pair, which
   currently loses N1. Also put numbers on the `PRICE` axis.
3. **Rewrite `WHERE THAT CHANGE CAME FROM` as one grade-5 sentence** that says who stopped coming
   and why: "1,100 fewer people came, and all 1,100 are season-ticket holders who did not renew
   after the way you priced Nights 1-4." Acceptance: no repeated bare number, one finite verb, no
   noun used as an agent.
4. **Define "season ticket" once, in plain words, where I can see it while it matters** (HOOK
   first screen and behind `MORE ABOUT TONIGHT`): who these people are, that they pay $24 a seat
   up front for the whole season, and why a night that is a bad deal makes them quit. Same
   treatment for `draw` on the tonight card itself: "draw = out of 100, how many people want to
   see this club."
5. **Cut HOUSE RULE 1-5 down to what a kid uses before Night 1** and let the rest live behind
   `MORE ABOUT TONIGHT`. Acceptance: HOOK `docH <= ~1.3 screens` at 1366x768, and the event-money
   rule appears at the moment the event-money dial first matters, not 350 words earlier.
6. **Fix Night 4's 30px overflow** (`docH` 798) so the turned-away/resale sentence is in the first
   screen on the loudest night, and fix `You also put $0 into the night with the more seats open.`

**NOT VERIFIED by me:** `/teach` and `/board` quality as products (other waves); whether the
teacher's talk carries the 13 no-action clicks; contrast/CVD; reduced motion; whether the arena
picture discriminates fill levels between 50% and 96% (I saw 0%, 55%, 96%, 100% and could rank
them, but did not measure pixel values); and whether a real child reads any of this the way I did.
I am a simulated kid, not a human tester.
