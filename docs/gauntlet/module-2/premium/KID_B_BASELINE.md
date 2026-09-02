# Kid B baseline — Player/Gameplay critique, M2L1 "Full House"

SIMULATED KID / AGENT-PLAYTESTED. Not human-tested. Persona: grade 5–6 casual
sports student, pairs-on-one-device (1366x768 Chromebook), reads little,
acts on the biggest number and biggest button first. Full pass driven live
through Playwright against the real build on port 4404 (`/teach`, `/play`,
`/board`), five nights → reveal → adapt → counterfactual → synthesis →
complete. Screenshots: `docs/gauntlet/module-2/premium/screens-kid-b/`
(69 PNGs, viewport truth + fullPage companions). Raw text dumps of two
screens saved alongside for word-count evidence.

## pull-rating: WEAK

The mechanic underneath is real (blind price commitment, two
non-summable books, a genuinely surprising and attributable result). But the
build's own layout inverts the founder's stated design decision that "the
result is a separate, larger state than the decision" (VISUAL_REFERENCE_SPEC
§2). For a fast, low-reading player, the next night's entire pricing screen
— including its own giant price figure and its own "LOCK IT IN" button — sits
**above** the previous night's result card in scroll order. A kid who acts on
the first big number and big button she sees can play all five nights back
to back without ever reading a single "how it went" card. That is the
specific failure mode this role exists to catch: choice → choice → choice
with the consequence real but hidden. Recorded as a blocking dissent
(category `student-pull`).

## biggest-failure

**The night's result is buried below the fold behind the next night's full
pricing UI, so a fast/low-reading player can miss the consequence entirely.**

Evidence: `screens-kid-b/06-play-night1-RESULT.png` (viewport, 1366x768) —
after Night 1 closed (kid priced at $102, a naive "bigger number = more
money" guess with the dial maxed near $120), the visible screen is Night 2's
full pricing card: card facts, price dial reset to $24, event-spend stepper,
"LOCK IT IN" button, and the disclaimer "No preview. Nothing on this screen
tells you what tonight will make." **Nothing about Night 1 is on screen.**
The fullPage companion, `06-play-night1-RESULT-FULL.png`, shows the actual
consequence — a boxed "NIGHT 1 — HOW IT WENT" card with `CAME 0 of 19,800 ·
0%`, `TICKET MONEY $0`, `KEPT -$520,000` in red — sitting roughly 700px below
the fold, reachable only by scrolling past the entire next-night decision.
The same pattern repeats at Night 2→3 (`09-play-night2-RESULT.png` /
`-FULL.png`: a sellout with 1,208 fans turned away is likewise scrolled
below Night 3's pricing card) and at Night 3→4 (`14-play-night4-RESULT-FULL.png`
territory). This is not a one-off; it is the standing layout order for
every night transition. The only thing guaranteed above the fold after a
close is the compact CASH/RENEWALS strip in the desk header (e.g. `CASH
-$520,000` in red, `RENEWALS 30%`) — real signal, but a number with no
story, no "why," and easy to read as just "a number went red" rather than
"you priced a Tuesday like a Finals game and nobody came." The founder's own
reference decision (VISUAL_REFERENCE_SPEC §2: "the result is a separate,
larger state than the decision — the consequence gets its own screen") is
not honored by the shipped layout; the current build interleaves decision
and (buried) consequence in one continuous scroll, decision-first.

Consequence for THIS persona: the experience → consequence → adaptation
loop that is the entire pedagogical spine of the lesson (CLAUDE.md §1) is
intact only for a student who scrolls past a fresh call-to-action to go
looking for old news. A kid who reads little and clicks fast will not do
that. She will see a new price, a new dial, a new giant LOCK IT IN button,
and lock again — repeating the same misread that cost her Night 1, without
ever being shown why.

## what-the-student-plays

Five nights of "set one number, wait, find out." Each night: a facts card
(day, visiting club draw, capacity, tonight's bill, season-plan price), one
big price dial defaulting to the season-plan anchor ($24 of a $10–$120
range, OBSERVED `04-play-night1-price-set-high.png` DOM query:
`{"min":"10","max":"120","step":"2","value":"24"}`), a secondary "event
spend" stepper, on Night 4 a two-state "open more seats" toggle, and one
dominant CTA, "LOCK IT IN," guarded by a confirm dialog. No preview of any
kind before lock — confirmed OBSERVED on every pre-lock screen: "No preview.
Nothing on this screen tells you what tonight will make." After the
teacher's bell, the CASH/RENEWALS header updates and a results card appears
— but, per the biggest-failure above, that card is not where the kid's eyes
land next. The two books (CASH, RENEWALS) never combine into one number —
confirmed, e.g. `17-play-night5-RESULT-allnights.png` shows a positive CASH
figure and 0% RENEWALS side by side, no merged "score."

By REVEAL/ADAPT/COUNTERFACTUAL/SYNTHESIS the room moves to the board, and
those frames (`19-board-reveal-stage7.png` "THE TWO PEAKS," `20-board-adapt.png`
"WHAT MOVED THE CROWD?", `21-board-counterfactual.png` "NIGHT 1 VS NIGHT 5")
are visually strong — dark violet-cast canvas, an arena backdrop, one clean
scatter chart per frame, one bold economic punchline per screen ("The
cheaper ticket made more money.") — genuinely closer to the premium bar than
the private `/play` screens are. That part of the experience would likely
land for this persona if she is watching the board with the class; it does
not depend on her having read her own private screen carefully.

## moment-by-moment-notes

- **Join** (`00-play-join-screen.png`): one card, one button ("Join"),
  first-name + optional partner-name fields, class code. Clean, no friction.
- **Lobby/HOOK** (`01-play-lobby-after-join-FULL.png`, `02-play-hook-FULL.png`):
  the HOOK screen alone is ~259 words (measured on the raw text) before the
  first decision; the Night 1 pre-lock screen adds another ~170 words before
  "LOCK IT IN" (measured: `python3` word count on `night1-raw-text.txt` up to
  the string "LOCK IT IN" = 170). Combined, this persona is asked to read
  ~400+ words before her first real choice. She would not. She would find
  the big `$24` figure, the slider, and "LOCK IT IN" and act — which the
  layout does make findable (one hero figure, one CTA, consistent with
  VISUAL_REFERENCE_SPEC §1's "immediate lesson identity" + "one large
  primary action"). What she skips: the one paragraph on HOOK that actually
  defines CASH and RENEWALS in plain terms, and the recurring blue guidance
  box on every pricing screen ("Season plan: $24 a seat. Price well UNDER
  that and the plan looks like a waste... Price ABOVE what they think
  tonight is worth and they quit.") — the box repeats verbatim every night,
  so even a kid who read it once would likely stop reading it by Night 2,
  meaning the actual causal mechanism (season-plan anchor vs. price) is
  something she experiences as an unexplained pattern, not a rule she was
  told.
- **Night 1 decision** (`03-play-night1-FIRST-LOOK.png`,
  `04-play-night1-price-set-high.png`): kid drags price to $102 near the top
  of the $10–$120 dial — "bigger number = more money" naive logic, exactly
  the persona's predicted move — without reading the demand-facts card
  above it (a quiet Tuesday, low draw 22/100). Locks. Waiting screen
  (`05-play-night1-locked-recap.png`) is a clean, glanceable "nothing to do
  but wait" state — no complaint there.
- **Night 1 → Night 2 transition** (`06-play-night1-RESULT.png` /
  `-FULL.png`): the biggest-failure above. Zero attendance, -$520,000, is
  invisible on the viewport.
- **Night 2 decision**: kid overcorrects hard to $17 (near the dial floor)
  after inferring (from the still-visible red CASH figure in the header,
  not from the buried result card) that the last price was bad. Locks.
  Sells out (`09-play-night2-RESULT-FULL.png`: `CAME 19,800 of 19,800 ·
  100%`, `1,208 could not get in`) — but again, that card is off-screen on
  the viewport at the moment the kid is looking at Night 3's fresh dial.
  Renewals still fall (30%→21%) even on a sellout, because the price
  undercut the season plan — a real, teachable non-obvious result that this
  persona is structurally unlikely to read on her own screen.
- **Night 4 bowl toggle** (`12-play-night4-FIRST-LOOK.png`,
  `12b-play-night4-bowl-clicked.png`): a new plate-style toggle appears,
  labelled "CLOSED / Open 2,400 more seats tonight / $95,000 / paid whether
  they fill or not." Kid pokes it because it's new and different, without
  reading the cost caption — matches the persona. Feedback is immediate and
  legible (CLOSED → OPEN, no confirmation needed to see the state change),
  which is a genuine strength: the toggle itself does not require reading to
  operate correctly. Whether $95,000 was worth it is only inferable later
  from the Night 4 result card's `CAME 17,675 of 22,200` line — again
  reachable only by scrolling past Night 5's fresh pricing card.
  "RENEWALS" reads as "1%" in the header at this point (`12-play-night4-FIRST-LOOK.png`)
  — a severe, glanceable warning number even without vocabulary — that part
  of the header strip does work as a fast readable signal.
- **Night 5, "same card as Night 1"** (`15-play-night5-FIRST-LOOK.png`): the
  card plainly states "Same card as Night 1. Same day, same visiting club,
  same..." — if the kid reads even the first line of the night card (she
  reads the biggest text, and this is styled as a normal-weight line, not
  the hero figure, so it's a coin flip whether she notices). Kid repeats her
  Night 1 price ($102) out of curiosity; result: 0 attendance again,
  identical to Night 1 — a clean, replayable, attributable "you did the same
  thing and got the same nothing" moment, IF she sees it. The end-of-play
  summary table (`17-play-night5-RESULT-allnights.png`) is the one genuinely
  good "one glance" screen in the whole PLAY phase: a five-row table, Night /
  Price / Came / Full / Net, RENEWALS 0% in gold, CASH $170,762 — she could
  read this table in ten seconds and understand the whole arc, including her
  own repeated mistake. This screen should be studied as the template the
  per-night result screens are missing.
- **REVEAL/ADAPT/COUNTERFACTUAL/SYNTHESIS on board** (`19-board-reveal-stage7.png`,
  `20-board-adapt.png`, `21-board-counterfactual.png`,
  `22-board-synthesis-card1.png`): visually strong, one punchline per frame,
  legible chart, no reading burden beyond the headline sentence. This is a
  class-facing surface, not this kid's own screen, so it is a secondary
  finding here (Classroom/Projector critic's lane), but it materially raises
  this persona's engagement if the room is watching together.
- **Complete** (`23-board-complete.png`): one closing sentence, appropriately
  short, names a concrete next-lesson hook ("most of the people in your
  building came to see somebody else's team").

## required-repairs

Visual/pacing/copy repairs that would move this persona (not implementation
detail — named as the change needed, per role scope):

1. **Reorder the per-night transition so the just-closed night's result
   renders as its own screen state, above the next night's pricing UI, not
   below it** — matching the founder's own preserved reference decision
   (VISUAL_REFERENCE_SPEC §2). At minimum, the result card must be fully
   inside the 1366x768 viewport before the next night's dial and LOCK button
   are reachable, or the two should be sequenced (result screen → explicit
   "next night" advance) rather than concatenated in one scroll. Evidence:
   `06-play-night1-RESULT.png` vs `-FULL.png`.
2. **Stop repeating the identical guidance paragraph verbatim every night**
   (the "Season plan: $24 a seat. Price well UNDER..." box). A student who
   reads it once and then pattern-matches "boilerplate, skip" on nights 2–5
   never gets a second chance to internalize the mechanic from a screen she
   controls. Either compress it after Night 1, or replace repetition with
   something that changes (e.g., referencing her own actual last result).
3. **Use the end-of-play summary table's design
   (`17-play-night5-RESULT-allnights.png`) as the template for every
   individual night's result**, not just the final one — it is the one
   screen in PLAY that a fast reader could actually parse in one glance.

Things I would not change: the join flow, the single-hero-figure + single-CTA
structure of the pricing card itself, the blind-commitment discipline (no
preview, confirmed absent on every pre-lock screen), the toggle's legible
CLOSED/OPEN state change, the board's visual register in REVEAL/ADAPT/
COUNTERFACTUAL/SYNTHESIS.

## Founder prosecution questions, in Kid B's voice

- **What do I think I'm supposed to do?** "Move the price thing and hit the
  yellow button." Got that fast (`03-play-night1-FIRST-LOOK.png`).
- **Why should I care?** Only because the header number turns red/scary.
  Didn't read why.
- **What would I click first?** The price dial, then LOCK IT IN. Confirmed —
  that's exactly what I did every night.
- **What is confusing (every word/number I didn't understand)?** "Draw
  22/100" (never explained what draw means in the flow I'd actually read),
  "RENEWALS" (told once, in a paragraph I skipped), "Making it an event"
  (didn't know what it bought until way later, if ever), "season plan $24"
  (didn't register this was the anchor the guidance text keeps talking
  about).
- **What feels like school?** The HOOK screen and the repeated blue guidance
  paragraph — walls of text before I get to do anything.
- **When am I bored?** Nights 2–4 pricing screens, once the pattern of
  "big number, drag dial, hit yellow button" is established and nothing new
  is telling me why.
- **What am I waiting for?** The bell. That part's fine and clearly labelled
  ("Locked. Nothing to do but find out... the doors open when your teacher
  rings the bell.")
- **Did the result surprise me?** Yes — zero people showed up Night 1. Did
  I actually see that surprise on my own screen at the moment it mattered?
  No — I saw a red number, not the "0 of 19,800" story, because it was
  scrolled away under Night 2's dial.
- **Do I understand why it changed?** Only from the header number turning
  green later, not from reading an explanation.
- **Can I tell what I might do differently?** Only in hindsight, from the
  five-row table at the very end — which is good, but late.
- **Do I want another round?** The board moments (Two Peaks, the class
  scatter) are the part that would make me want to keep watching. My own
  screen, alone, is a chore between those moments.
- **Do I want another BOW class?** Conditional on the board parts, not on my
  own device experience.
- **Did I need sports knowledge I didn't have?** No — Knicks/Grizzlies,
  draw numbers, and TV status were all printed plainly; I didn't need to
  know either team to play.

## Scope note

This was a solo one-desk test session (necessary for a controlled Kid B
playthrough); the COUNTERFACTUAL "did anybody charge less and make more?"
prompt (`21-board-counterfactual.png`) has no positive cross-desk answer in
a one-desk run and reads as slightly deflating for that reason — this is an
artifact of the test session size, NOT VERIFIED as a flaw at real class
scale (12 desks), where other pairs' rows would supply the contrast. Noted,
not counted toward the pull rating.
