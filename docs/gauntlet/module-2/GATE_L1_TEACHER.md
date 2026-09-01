# GATE L1 TEACHER — Module 2, Lesson 1 "Full House"

Run: `m2-quality-war` · Assignment: `gate-l1-teacher` · Level 4 (classroom release)
Reviewer: Teacher Transfer Critic, fresh context.

**Protocol followed.** Cold. Server booted on PORT 4333 from the built `dist/`.
The only repo file read before the verdict was drafted was
`runtime/scripts/e2e-m2l1.cjs` (start/create mechanics only; its assertions
ignored). All preparation was done through `/teach`, `/board` and a `/play`
seat, driven in real Chromium at 1440×1300 (teacher), 1600×900 (projector) and
1024×600 (Chromebook). Six full or partial sessions were played, including all
five nights, all seven reveal stages, ADAPT, COUNTERFACTUAL, SYNTHESIS and
COMPLETE. `runtime/README.md` and `docs/gauntlet/module-2/` were read only
afterwards, to locate where the missing knowledge currently lives.

Evidence label key: **[observed]** = seen on a surface this session.
**[inferred]** = deduced from surface behaviour, not stated by the product.
**[not verified]** = could not be established.

---

## before-verdict

**NOT READY.**

What the product does give a stranger the night before: the `/board` HOOK
screen is a genuine briefing. It names both markets with real buildings and
real capacities, defines the two books in plain words ("CASH is the money the
building made after the bill. RENEWALS is the share of season-ticket holders
who come back next year. A price that is great for one is usually worse for
the other — that is the job"), prints all five night cards with day, visiting
role, Draw and TV listing, and carries the modelling caveats. **[observed]**
The `/play` HOOK screen repeats the same brief per desk. If I read that screen,
I know the fiction and the two books.

What it does not give me, and I could not obtain from any surface:

1. **The lesson has no teacher brief anywhere.** `/teach` before session
   creation is a bare lesson picker with a title field. **[observed]** There is
   no overview, no arc, no phase timings, no materials note, no "what students
   will see," no answer key, no printable one-pager. `/teach` after creation is
   identical in LOBBY, HOOK and PLAY apart from one projector-mirror line.
   **[observed]**
2. **I cannot see the student screen from `/teach`.** There is no `/play`
   preview, no per-desk drill-down, no screenshot. To learn what students
   actually hold I had to join my own session on a second browser as a
   student — the product never suggests this. **[observed]** Consequence: the
   entire "MAKING IT AN EVENT" spend dial, its next-night-only payoff rule, its
   per-market conversion ($100 per extra person in New York, $63 in Memphis)
   and its cap ($120,000 / $60,000) exist **only** on the student screen.
   **[observed]** A teacher who has not joined a seat will be asked "what does
   the event money do?" and will not know.
3. **No phase timings anywhere.** Nothing on any surface says how long the
   lesson runs, how many minutes a phase should take, or where the pacing
   pressure is. **[observed]**
4. **The night cards are learnable, the night *mechanics* are not.** The
   Night 4 capacity option ("Open 2,400 more seats tonight — $95,000, paid
   whether they fill or not") appears only on the Night 4 student screen and
   only for desks that reach it. **[observed]** The teacher console never shows
   it, never previews it, and never warns that Night 4 is the shock night.
5. **The renewals mechanism is nowhere on a teacher surface.** I can watch
   renewals move (50% → 30% at $70, 50% → 74% at plan price) **[observed]** but
   nothing tells me *why* — that renewals peak at the season-plan price and
   fall in both directions. **[inferred from repeated play]** A teacher who
   guesses "higher price = worse renewals" will teach a false rule and be
   contradicted by their own board.
6. **The debt rule is a cryptic string.** After Desk 3 went negative the
   console printed `• Carrying debt (night-spend dial locked at $0): Desk 3 ·
   New York Knicks.` **[observed]** Nothing says what that means for the desk,
   whether it is recoverable, or what to say. (It is recoverable — Desk 3
   climbed from −$137,200 to +$1,120,444 by Night 5 **[observed]** — but I only
   know that because I played it twice.)

A competent stranger can walk in knowing the fiction. They cannot walk in
knowing the mechanics, the timing, or the student screen.

---

## during-verdict

**NOT READY.**

`/teach` is a **status board, not a director.** It reports state accurately and
tells me almost nothing about what to do with it.

What works:

- The **lock counter is on the button itself** — `🔔 Open the doors — Night 5
  (2/3 locked)` — so "is the room ready" is answerable at a glance.
  **[observed]**
- **`ON THE PROJECTOR RIGHT NOW`** mirrors the night card so I can narrate
  without turning around. **[observed]**
- **`WATCH FOR`** is real facilitation intelligence and fires correctly. Four
  distinct flags observed: held-same-price-3+-nights, carrying-debt,
  turned-away-500+-fans, opened-the-building-on-N4. **[observed]**
- Per-desk chips carry price state, cash, renewals, nights played, fill %, and
  `joined N3` for a late seat. **[observed]**
- Foreign controls from other lessons (`btnShock`, `btnCounterfactual`,
  `btnCloseDay`) are **hidden**, not merely disabled, during Full House.
  **[observed]** `btnTwoPeaks` is disabled until Night 3 has been played and
  `btnCloseNight` is disabled outside PLAY. **[observed]** Good guarding.

What blocks an outstanding class:

1. **There is no NOW / ASK / DON'T EXPLAIN YET anywhere on `/teach`.** The
   console renders the same four panels in LOBBY, HOOK and PLAY. **[observed]**
   The teacher is never told what should be happening, what to say, or what to
   withhold. Every economics line in this lesson must be invented live by a
   teacher who may not know the economics.
2. **`ON THE PROJECTOR RIGHT NOW` disappears the moment PLAY ends.**
   **[observed]** In REVEAL, ADAPT, COUNTERFACTUAL and SYNTHESIS — the four
   phases where the projector *is* the lesson and the teacher is narrating —
   the console shows no projector mirror at all. The teacher must physically
   turn and read the screen.
3. **The seven reveal stages are a blind counter.** `/teach` shows only
   `0/7 → 7/7 REVEAL STAGES`. **[observed]** It never names the stage about to
   land, never names the stage that just landed, and never supplies a line. I
   pressed `🎙️ Reveal next` seven times without knowing what any press would
   do until I looked at the projector. That is the opposite of reveal
   choreography.
4. **Nothing tells me when to release the Two Peaks.** The button silently
   becomes enabled after the Night 3 bell **[observed]**; no flag, no prompt,
   no highlight, no "release it now" appears in `WATCH FOR`. While disabled it
   gives no reason and no "available after Night 3." Its status tile reads
   `held` / `up` **[observed]** — undefined vocabulary.
5. **I cannot tell who is stuck.** An unlocked desk renders as small grey
   `dialling $24` text in a chip identical in weight to `LOCKED $34`.
   **[observed]** No highlight, no colour, no count-of-stalled, no elapsed
   time, no `WATCH FOR` entry. In a 15-desk room this is unscannable.
6. **False state after the window closes.** Once all five nights are in the
   books, every desk chip still reads `dialling $24`. **[observed]** Nobody is
   dialling; the game is over.
7. **Rendering defect on the teacher surface.** From REVEAL onward the flag
   renders as `• Opened more of the building on Night 4:` with an **empty desk
   list**, though the same flag correctly named `Desk 1 · New York Knicks`
   during PLAY. **[observed, out7 REVEAL/ADAPT/SYNTHESIS/COMPLETE dumps]** The
   teacher loses the one desk they most want to call on.
8. **`— your best ADAPT voice`** is the only facilitation verb in the console
   and it assumes founder vocabulary. **[observed]** A stranger does not know
   what an "ADAPT voice" is, or that ADAPT is a later phase where they should
   call on that desk.

---

## failure-recovery-verdict

**NOT READY** — but the smallest gap of the four, and mostly repairable with
copy.

Recovery paths that work, verified from the surfaces alone:

- **Student refresh mid-night.** Reloaded `/play` after dialling, before
  locking: seat, desk, market, books and card all intact. **[observed]**
- **Student device swap.** `/play` shows the rejoin PIN persistently at the top
  of the student screen with the instruction "WRITE IT DOWN IN CASE YOU SWITCH
  DEVICES," and the join screen carries a discoverable "Already joined on
  another device? Use your rejoin PIN" control. **[observed]** This is the
  best-transferred recovery path in the lesson.
- **Projector failure.** `/board` reloaded fresh returns to the exact live
  state **[observed]**, and — usefully — `/board` typed with **no `?code`**
  still attaches to the live session. **[observed]** A teacher who cannot find
  the projector URL still gets a projector.
- **Teacher refresh on the same laptop.** `/teach` reloads straight back into
  the room; the session code and bearer key persist in `localStorage`.
  **[observed]**
- **Pause and Freeze are legible on all three surfaces.** `/play`: "Paused —
  everything you've done is saved. We'll pick back up shortly." and "Your
  teacher has frozen the session. Hang tight." `/board`: `PAUSED`. Freeze
  removes the student lock button entirely. **[observed]**
- **Late join mid-window.** A desk joining at Night 3 arrives with real books,
  its missed nights labelled `COVERED` in its own history **[observed]**, and
  `/teach` marks it `3 nights · joined N3` **[observed]**.
- **A desk that never locks.** The bell auto-commits it at the plan price and
  labels the row `AUTO` on the student's own history. **[observed]**

Blocking or hazardous:

1. **Freeze silently also pauses, and Unfreeze does not unpause.**
   **[observed]** After Freeze → Unfreeze the room stayed paused; the only
   clue was the Pause button reading `Unpause` and the projector reading
   `PAUSED`. A teacher who freezes to get the room's attention and unfreezes
   to resume will be left with a dead room and no message explaining it.
2. **The night bell's auto-commit is invisible to the teacher.** With Desk 3
   unlocked, the console offered `🔔 Open the doors — Night 5 (2/3 locked)`
   and said nothing about what would happen to the third desk. **[observed]**
   The behaviour is benign and well handled on the student side, but a teacher
   who does not know it will either stall the whole class waiting for one desk
   or ring the bell fearing they just destroyed a pair's game.
3. **No teacher rejoin from a second device.** `/teach` has no code+key entry
   field; `/teach?code=XXXXXX` from a clean browser leaves the room, controls,
   roster and aggregate sections hidden. **[observed]** If the teacher's laptop
   dies or the browser profile is cleared, the console is unrecoverable and the
   class cannot be advanced. Nothing on any surface warns of this or tells the
   teacher to record the key.
4. **`Restore last good state` is unexplained.** No tooltip, no confirmation,
   no statement of what it restores or what it costs. **[observed]** A teacher
   in trouble will not dare press it; a teacher not in trouble may press it.
5. **`Jump to REVEAL` is a one-way door with no stated consequence.**
   **[observed: enabled throughout PLAY, adjacent to `Advance ▸`, no
   confirmation.]** Its actual fallback behaviour — that leaving PLAY closes
   all remaining nights and auto-releases the Two Peaks — is stated only in
   `runtime/README.md`. **[verified after the cold phase]** A misclick
   silently ends the game for the whole room and burns the Two Peaks reveal.

---

## synthesis-verdict

**CONDITIONAL — the content is ready, the delivery surface is not.**

This is the strongest part of the product for teacher transfer, and it nearly
clears the bar on its own.

The SYNTHESIS board carries six cards computed from **this class's own
numbers**, each one completing the required chain. **[observed, verbatim]**

- `REVENUE = PRICE × PEOPLE` — quotes the room's own Night 1 New York pair
  ($34 → 14,142 vs $70 → 4,350), names the demand curve, and states the
  one-night-at-a-time reading rule.
- `THE CARD MOVED THE CROWD` — same $70, different night, different crowd;
  names the demand shifter without the jargon.
- `THE TICKET IS NOT THE PRODUCT` — **and it does give the teacher the WHY the
  Two Peaks differ, in words a stranger can read aloud**: "the best price drops
  to $40 — $8 lower, 4 clicks of the dial. The cheaper ticket made more money,
  because a cheaper ticket brings more people and every one of them buys
  something. Stores call that a loss leader."
- `NIGHT 5 WAS NIGHT 1` — the room's own repeat-card rows, then "renewals move
  who shows up."
- `TWO BOOKS, NO EXCHANGE RATE` — "You cannot add a dollar to a renewal, and no
  price is best on both."
- `YOUR JOB IS REAL` — Giants 2009/2010, league-standard today, "Your job
  exists."
- Outside-sports row: flights, Friday hotels, Tuesday movie tickets and
  popcorn, a bake sale in the rain, milk at the back of the shop.
- Dated real anchors with verification dates, and the modelling caveats.

I can deliver "you just learned economics" from these cards as written, and be
correct. That is a real achievement and it is the reason this gate is not a
flat refusal.

What still blocks an outstanding synthesis:

1. **None of it is on `/teach`.** **[observed]** Every word is on the projector
   only. The teacher narrates seven dense cards with their back to a room of
   fifth-graders, off a screen whose scroll position they do not control.
2. **No answer key for the three ADAPT questions.** The board and `/play` both
   pose "Whose best price on Saturday was different from their best price on
   Tuesday? What on the card made it different?", "Did anybody charge LESS and
   make MORE? How is that possible?", "Night 5 was Night 1's card again. Why
   did a different number of people show up?" **[observed]** `/teach` shows
   none of the three, and no surface anywhere gives the teacher the answers.
   The second question is the Two Peaks question and its answer (in-building
   spend per head shifts the total-revenue peak below the ticket-revenue peak)
   is not stated until the SYNTHESIS card, two phases later. A teacher who
   stalls at ADAPT has nothing.
3. **Two contradictions the teacher must resolve live and is not armed for.**
   (a) `REVENUE = PRICE × PEOPLE` is stated as the headline law, and
   `THE TICKET IS NOT THE PRODUCT` immediately shows that the money is *not*
   price × people because in-building spend counts. A sharp student will catch
   this; nothing tells the teacher how to reconcile it. **[observed]**
   (b) `TWO BOOKS` reports "Median renewals: New York Knicks 37% · Memphis
   Grizzlies 80%" **[observed]**. The room will ask why Memphis is always
   better on renewals; the teacher is given no answer, and the honest answer is
   about the plan-price tent, which no teacher surface has ever mentioned.
4. **No "when the room stalls" question anywhere.** There is no fallback
   prompt, no re-ask, no simpler version of any question on any teacher
   surface. **[observed]**
5. **The COUNTERFACTUAL sets a trap the teacher is not warned about.** `/play`
   shows "Same price every night ($24) → $1,291,132 · 80%" against "What you
   actually did → $2,363,676 · 65%". **[observed]** A student will say "so
   doing nothing was better." That is the two-books point and it is a great
   moment — if the teacher sees it coming. Nothing on `/teach` flags it.

---

## hidden-knowledge-findings

Ordered by severity.

### HK-1 — The entire live-direction script exists, and almost none of it reached the teacher
- **The knowledge:** a complete NOW / ASK / DON'T EXPLAIN YET / WATCH FOR /
  TRIGGER / TIME CUT director's script with per-phase minute budgets: LOBBY
  2 min, HOOK 3 min ("read the card for N1 aloud… take three numbers from the
  room, write them on the board, **do not evaluate them**"), PLAY block 1 N1–N3
  11 min with the Two Peaks TRIGGER after N3, ADAPT 4 min with the three
  questions **in a stated order**, PLAY block 2 N4–N5 8 min ("read N4's card
  slowly; the room should feel it"), REVEAL + COUNTERFACTUAL 6 min, SYNTHESIS
  7 min, plus an explicit TIME CUT rule ("if you are past minute 45, drop the
  N4 capacity option discussion and go straight to the N1-vs-N5 chart; it
  carries the lesson alone"), and the withholding instruction that the words
  *demand*, *revenue* and *elasticity* are not said in the first 30 minutes.
- **Where it lives now:** `docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md`
  lines 253–270, under the heading "TEACHER FLOW (for a teacher who has never
  seen this)."
- **What reached the product:** one fragment — the phrase "your best ADAPT
  voice" appended to a `WATCH FOR` flag — stripped of the phase, the timing,
  the trigger and the question order. **[observed]**
- **What the product must add:** a per-phase teacher director panel on `/teach`
  carrying NOW, ASK, DON'T EXPLAIN YET, WATCH FOR and TRIGGER for the current
  phase, plus the phase minute budget and the TIME CUT rule. This is the
  architectural room CLAUDE.md §4 explicitly reserved; it is currently unused
  for this lesson.
- **Note:** the design's DON'T EXPLAIN YET instruction is in direct conflict
  with the shipped `/board`, which prints "…and only that is a demand curve"
  in the PLAY chart caption from the Night 1 bell onward. **[observed]** The
  teacher has no way to know which is intended. Flagged for Economic Truth /
  Classroom review; not adjudicated here.

### HK-2 — The night bell auto-commits an unlocked desk at the plan price
- **The knowledge:** "a desk that never locked auto-commits at the plan price,
  flagged `auto` on its own screen."
- **Where it lives now:** `runtime/README.md`, "Teacher controls," M2 L1
  section. Also asserted in `runtime/scripts/e2e-m2l1.cjs`.
- **What the product must add:** put it on the bell. When any desk is unlocked,
  the button should read to the effect of "2 of 3 locked — ringing now settles
  Desk 3 at its $24 plan price," and `WATCH FOR` should list the stalled desks
  by name. Right now the teacher must choose between stalling the room and an
  unknown consequence.

### HK-3 — The seven reveal stages have names and an order the teacher never sees
- **The knowledge:** the seven beats are five night curves (N1…N5), then the
  Two Peaks, then per-market books.
- **Where it lives now:** `runtime/README.md`, "Teacher controls."
- **What the product must add:** `/teach` must name the next stage on the
  button ("Reveal next — Night 3's curve (3 of 7)"), name the stage now on the
  projector, and carry one line of what to say at each. A reveal the teacher
  cannot anticipate cannot be choreographed.

### HK-4 — The renewals tent and the two-books non-dominance
- **The knowledge:** RENEWALS is a tent peaked at the season-plan price — far
  above it plan holders quit, far below it the plan looks worthless — so the
  cash-best price is never the renewals-best price in any reachable state, and
  neither error direction is dominated.
- **Where it lives now:** `runtime/README.md`, "Two books (R4)"; tuning
  properties in `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs`.
- **What the product must add:** a teacher-side statement of the renewals rule
  (a student surface would leak the answer; a teacher surface would not), and
  the answer to the "why is Memphis's renewal median 80% and New York's 37%"
  question the SYNTHESIS board provokes.

### HK-5 — What the "MAKING IT AN EVENT" dial and the Night 4 capacity option actually do
- **The knowledge:** event spend buys next-night attendance only, at ~$100 per
  person in New York and ~$63 in Memphis, capped at $120,000 / $60,000, and
  returns nothing if the next night sells out anyway; Night 4 offers 2,400 extra
  seats for $95,000, paid whether they fill or not; a desk in debt has its spend
  dial locked at $0.
- **Where it lives now:** the `/play` student screen only — a surface the
  teacher never sees. The debt lock surfaces on `/teach` as an unexplained
  parenthetical.
- **What the product must add:** a `/teach` mechanics card, or a per-desk
  drill-down showing what that desk's screen currently offers.

### HK-6 — The fallback behaviours of the phase controls
- **The knowledge:** "leaving PLAY closes all remaining nights and releases Two
  Peaks; leaving REVEAL plays out every remaining stage."
- **Where it lives now:** `runtime/README.md`, "Teacher controls."
- **What the product must add:** confirmation copy on `Advance ▸` and `Jump to
  REVEAL` when the current phase has unfinished business, stating what the
  press will consume.

### HK-7 — Teacher session recovery
- **The knowledge:** the teacher's authority is a per-session bearer key held
  only in that browser's `localStorage`; there is no second-device path.
- **Where it lives now:** `runtime/README.md` (teacher authentication, repair
  charter round 1) and D14. Nothing on any surface.
- **What the product must add:** either a visible teacher rejoin path (code +
  key entry) or, at minimum, a line on `/teach` next to the session code
  telling the teacher this console is bound to this browser.

### HK-8 — There is no teacher brief for this lesson, in any form
- **The knowledge:** everything a stranger needs before the bell rings.
- **Where it lives now:** distributed across `DESIGN_C_FIRSTPRINCIPLES.md`,
  `ECONOMIC_CONTRACT.md`, `runtime/README.md` and the gate reports — four
  developer documents. **[verified after the cold phase: no teacher-facing
  brief, one-pager or prep screen exists anywhere in the repo.]**
- **What the product must add:** a prep surface the teacher reaches from
  `/teach` without students — the arc, the timings, the two books, the five
  cards, the mechanics, the reveal order, the answers, and a way to look at
  the student screen.

---

## required-repairs

### BLOCKING

- **TT-B1.** Ship a per-phase teacher director panel on `/teach` for
  `m2l1-full-house`: NOW, ASK, DON'T EXPLAIN YET, TRIGGER, and the phase time
  budget, for LOBBY through SYNTHESIS. Source material already exists at
  `docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md` lines 253–270. (HK-1)
- **TT-B2.** Name the reveal stages on `/teach`: the stage the next press will
  land, the stage currently on the projector, and one line to say at each.
  (HK-3)
- **TT-B3.** Keep `ON THE PROJECTOR RIGHT NOW` alive through REVEAL, ADAPT,
  COUNTERFACTUAL and SYNTHESIS. In those phases the teacher currently has no
  mirror of the surface they are narrating.
- **TT-B4.** Put the three ADAPT questions **and their answers** on `/teach`,
  in the design's stated order, together with a stall-recovery re-ask. Include
  the two reconciliations the SYNTHESIS board provokes: revenue vs in-building
  spend, and the New York / Memphis renewals-median gap. (HK-4, synthesis 2–4)
- **TT-B5.** Tell the teacher when to release the Two Peaks. A `WATCH FOR`
  trigger line after the Night 3 bell, and a reason on the disabled button
  before it. Replace the `held` / `up` tile with plain words. (HK-1 TRIGGER)
- **TT-B6.** State the night bell's auto-commit on the bell itself and flag
  unlocked desks by name in `WATCH FOR`. (HK-2)
- **TT-B7.** Make a stalled desk visually unmissable on `/teach` — highlight,
  count, and elapsed time — and stop rendering `dialling $Nn` on every desk
  after the window has closed. (during 5, 6)
- **TT-B8.** Fix the `WATCH FOR` defect: from REVEAL onward the
  "Opened more of the building on Night 4" flag renders with an empty desk
  list although it named the desk correctly during PLAY. (during 7)
- **TT-B9.** Give the teacher a way to see what students see — a `/play`
  preview or a per-desk drill-down — and surface the event-spend and Night 4
  capacity mechanics on a teacher surface. (HK-5)

### NON-BLOCKING

- **TT-N1.** Freeze should not silently also pause, or Unfreeze should restore
  the prior pause state; at minimum `/teach` should say "still paused" after an
  unfreeze. (recovery 1)
- **TT-N2.** Confirmation copy on `Advance ▸` and `Jump to REVEAL` naming what
  the press will consume. (HK-6)
- **TT-N3.** A teacher rejoin path, or a line stating the console is bound to
  this browser. (HK-7)
- **TT-N4.** Explain `Restore last good state` on the surface. (recovery 4)
- **TT-N5.** A prep/dry-run surface reachable from `/teach` without students.
  (HK-8)
- **TT-N6.** Replace "your best ADAPT voice" with language a stranger can act
  on ("call on this desk when you reach the ADAPT questions"). (during 8)

### Dissent

Formal dissent is recorded against any decision to call `m2l1-full-house`
classroom-ready on the strength of its SYNTHESIS cards. The cards are good and
the reveals are correctly gated; the room, the pacing and the questions are
not transferable. This lesson currently requires a teacher who already knows
the lesson.

**TRANSFER: NOT READY**

---

## RE-RUN AFTER DIRECTOR LAYER

Run: `m2-quality-war` · Assignment: `recheck2-l1-teacher` · Level 4
Reviewer: Teacher Transfer Critic, fresh context, cold protocol repeated.

**Protocol.** Server booted on PORT 4343 from a freshly built `dist/`. The only
repo file read before the re-verdict was drafted was `runtime/scripts/e2e-m2l1.cjs`
(start/create/price/lock mechanics only). Five sessions driven in real Chromium at
1440×1300, 1440×900, 1366×768 and 1280×800 (teacher), 1600×900 (projector),
1024×600 (Chromebook desks): a full five-night class with a late joiner at Night 3,
a desk that never locks Night 5, a desk that runs $70 flat into debt, a desk that
buys the Night 4 capacity option; all seven reveal beats; ADAPT, COUNTERFACTUAL,
SYNTHESIS, COMPLETE; freeze/unfreeze; a `Jump to REVEAL` misclick at Night 2; a
second-device teacher rejoin; a zero-student dry run through all seven phases; and
a 12-sample latency probe of the lock counter. `src/modules/fullHouse.ts` was read
only afterwards, to pin one defect to its line.

### The nine blocking repairs

- **TT-B1 — per-phase director panel — FIXED, with one defect.** `/teach` now
  renders `DIRECTING <PHASE>` with `NOW` + minute budget (LOBBY 2 min · HOOK 3 min ·
  PLAY Nights 1-3 11 min / Nights 4-5 8 min · REVEAL+COUNTERFACTUAL 6 min · ADAPT
  4 min · SYNTHESIS 7 min · COMPLETE 1 min), `ASK`, `DON'T EXPLAIN YET`, `TRIGGER`,
  `THE BELL` and `TIME CUT`, all different in every phase. **[observed]**
  **Defect: the Night 5 `NOW` block is Night 4's script verbatim.** On Night 5 the
  console reads: *"Night 5 of 5. Read Night 4's card slowly — the room should feel
  it. 'The biggest night of the five. Demand is going to run past what this building
  holds.' Watch who raises the price and who pays to open more of the building."*
  **[observed, two independent sessions]** Night 5 is Draw 22 with no capacity
  option; nothing will run out and nobody can open the building. The adjacent
  `ON THE PROJECTOR RIGHT NOW` block on the same screen says the opposite —
  *"Same card as Night 1… The only thing that has changed since Night 1 is you."*
  A stranger following `NOW` misdescribes the payoff night. Source confirmed after
  the cold phase: `runtime/src/modules/fullHouse.ts:2191`, inside
  `const block2 = state.nightIndex >= 3`, which covers Nights 4 **and** 5.
- **TT-B2 — reveal beats named — FIXED.** The button names the next beat before the
  press: `Reveal 1 of 7 — Night 1 — the quiet Tuesday` … `Reveal 6 of 7 — The Two
  Peaks — the money view` … `Reveal 7 of 7 — The season, market by market`.
  `ON THE PROJECTOR RIGHT NOW` names the beat that just landed
  (`Stage 4 of 7 — Night 4 — the shock`), `TRIGGER` names the next press, and a
  `THE SEVEN REVEALS` list carries all seven with a SAY line each and `— next press`
  / `— on the projector` markers moving down it. **[observed, all seven presses]**
- **TT-B3 — projector mirror through the debrief — FIXED.** `ON THE PROJECTOR RIGHT
  NOW` is present in REVEAL, ADAPT, COUNTERFACTUAL, SYNTHESIS and COMPLETE, and
  states what is up (e.g. SYNTHESIS: all six card titles, the outside-sports row and
  the dated sources; COUNTERFACTUAL: the on-screen prompt verbatim plus "This board
  names desks publicly, worst line included"). **[observed]** It is a contents list,
  not the card text — the teacher still reads the SYNTHESIS prose off the wall, but
  the `ASK` answers now carry the substance. Accepted as scoped.
- **TT-B4 — ADAPT questions, answers, stall re-ask, both reconciliations — FIXED.**
  The three questions appear in the stated order with answers, and the fallback is
  there: *"If the room stalls, re-ask smaller: 'Point at two dots the same colour and
  the same shape. Which one charged more? Which one drew more?'"* Both reconciliations
  are answered at SYNTHESIS: the price×people vs in-building-spend contradiction, and
  *"Why is Memphis's median renewals different from New York's? It is not the market —
  it is the plan price… the two buildings sell different plans ($24 vs $16)."*
  COUNTERFACTUAL pre-arms the "so doing nothing was better" trap and answers it with
  no-exchange-rate. **[observed]**
- **TT-B5 — Two Peaks timing — FIXED.** Disabled tooltip: *"Available after the Night
  3 bell — the panel is drawn on that night's own curve."* After the Night 3 bell the
  `TRIGGER` block fires: *"Night 3 is played — the Two Peaks release is live. Best
  moment is right after the Night 3 bell, or hold it until after Night 4 if you want
  the biggest decision of the lesson to stay blind. Your call; the button waits."*
  Enabled tooltip states the consequence. The `held`/`up` tile now reads `not yet` →
  `ready to release` → `on the projector`. **[observed]**
- **TT-B6 — the bell's auto-commit — FIXED.** Button tooltip and a standing `THE BELL`
  block both state it; `WATCH FOR` leads with `1 of 3 desks have not locked tonight`
  and names the desk, with the same sentence attached. **[observed]** The button face
  still shows only `(2/3 locked)`; the sentence is one hover or one panel away.
- **TT-B7 — stalled desks scannable, no false "dialling" — FIXED.** The unlocked desk
  card is outlined and its `still dialling $24` set in amber; `WATCH FOR` carries the
  count and the names in a red-tinted lead flag. After the window closes every chip
  reads `finished · 5 nights in the books` and the bell reads `🔔 All five nights are
  in the books`. **[observed]** Latency probe: lock state reaches `/teach` in ~1.4 s
  and is correct thereafter (12 samples over 8 s). **[observed]** Elapsed-time-per-desk
  was asked for and is not there; not pursued.
- **TT-B8 — empty desk list on the Night 4 flag — FIXED.** `Paid to open more of the
  building on Night 4 · Desk 1 · New York Knicks` renders correctly in PLAY, REVEAL,
  ADAPT, COUNTERFACTUAL, SYNTHESIS and COMPLETE. **[observed]**
- **TT-B9 — student-screen mechanics on a teacher surface — FIXED for the harm.** A
  `What the students are looking at (you cannot see their screen)` block gives both
  plans, both bills, both seat counts, both event dials with per-market conversion
  ($100 NY / $63 Memphis, +2 renewal points at the top), the price-blind guarantee and
  the debt-lock rule with its recoverability. On Night 4 it adds the capacity option
  with both prices and both seat counts. **[observed]** There is still no `/play`
  preview or per-desk drill-down; the question "what does the event money do?" is now
  answerable, which was the blocking harm.

### HK-1

**DISCHARGED.** The director script reached the product and is now richer than the
design document: the TRIGGER is state-driven rather than a fixed instruction, the
WATCH FOR flags name desks and say what to do with them, and the withholding
instruction is staged (`Still no DEMAND, REVENUE or ELASTICITY` → `You can now say
DEMAND if the room gets there. Still hold ELASTICITY` → `Nothing. This is the beat
where every term gets said out loud`). The round-1 conflict is resolved in the
board's favour and the panel is consistent with it. **[observed]**

Round-1 concern styles re-tested: `/teach` no longer renders identically across
m2l1 phases — LOBBY, HOOK, PLAY(N1-3), PLAY(N4-5), PLAY(window closed), REVEAL,
ADAPT, COUNTERFACTUAL, SYNTHESIS and COMPLETE are all distinct. **[observed]** The
reveal button names its beat. **[observed]** (Unrelated: `m1l1-draft-day` still
renders LOBBY and HOOK identically on `/teach`. **[observed]** Out of scope here.)

### Remaining hidden-knowledge / transfer gaps

1. **Night 5 mis-direction (above).** Not hidden knowledge — worse: the panel states
   something false with confidence, on the beat the whole lesson is built toward.
2. **Nothing tells a teacher they can prepare.** The director panel exists only
   inside a created session; `/teach` before creation is still a bare lesson picker.
   A zero-student session advanced through all seven phases **does** expose almost the
   whole script — verified, including all seven reveal SAY lines and every ASK answer
   **[observed]** — but no surface says so. The one thing a dry run cannot show is
   the Night 4 `NOW` block and the capacity-option disclosure, which are
   night-conditional.
3. **`Jump to REVEAL` (`#btnReveal`) is still a silent one-click end to the game.**
   Pressed at Night 2 with three nights unplayed: no confirmation dialog, no tooltip,
   no warning; the session jumped to REVEAL and the Two Peaks auto-released.
   **[observed, dialog listener attached and empty]** It sits immediately beside
   `Advance ▸`. This is now the sharpest remaining edge on the console.
4. **`Restore last good state` still has no tooltip and no confirmation.** **[observed]**
5. **No teacher rejoin from a second device, and still no warning.** `/teach?code=…`
   from a clean browser returns the session-creation form. **[observed]** Nothing next
   to the session code says the console is bound to this browser.
6. **Stale copy in two places.** After the window closes, `ASK` still reads *"What on
   tonight's card is different from last night's?"* while `NOW` correctly says wrap up
   **[observed]**; and the reveal-era WATCH FOR advice (*"Keep this for the Night 4
   reveal"*, *"Call on this desk when you reach the ADAPT questions"*) still shows in
   COMPLETE. **[observed]**
7. **A code identifier leaked into teacher copy:** *"MODELED_DOLLARS_LINE says so
   before the first price."* **[observed, simplifications block]**
8. **Ergonomics at 1366×768.** With both details collapsed the console is 1766 px tall;
   `WATCH FOR` sits near the top and the bell at y≈1265, so the stalled-desk names and
   the bell cannot be on screen together on a classroom laptop. **[observed]** The
   bell's own `(2/3 locked)` face mitigates this.

Freeze/unfreeze was re-tested: Freeze pauses, Unfreeze returns the room to LIVE and
the Pause button to `Pause`. TT-N1 is fixed. **[observed]** Zero console errors on
`/teach`, `/board` and `/play` across the full run. **[observed]**

### Judgement against the bar

The SAY lines are correct, deliverable and grade-appropriate; `NOW` and `WATCH FOR`
do direct attention at named desks for named reasons; and the panel reads as
intelligence — what is happening, who to call on, what to withhold — rather than a
teleprompter, because it hands the teacher questions and evidence and leaves the
sentences to them. On everything the round-1 gate asked for, this is a different
product. One always-fires copy defect stands between it and an exceptional stranger
class.

### required-repairs (this re-run)

**BLOCKING**

- **TT-R1.** Split the Nights 4-5 `NOW` block. Night 5 must not be told to read
  Night 4's card or to watch for capacity purchases. `runtime/src/modules/fullHouse.ts:2191`.

**NON-BLOCKING**

- **TT-R2.** Confirmation on `Jump to REVEAL` naming what the press consumes
  (carried from TT-N2, still open).
- **TT-R3.** One line on `/teach` before session creation: this lesson can be
  rehearsed by creating a session with no students and advancing through the phases.
- **TT-R4.** Explain `Restore last good state`; state that the console is bound to
  this browser (carried from TT-N3, TT-N4, still open).
- **TT-R5.** Retire the wrap-up `ASK` and the reveal-era WATCH FOR advice once their
  moment has passed; remove `MODELED_DOLLARS_LINE` from teacher copy.

### Dissent

**DISSENT teacher-l1-not-ready: DISCHARGED** — the substance of the round-1 dissent
(the room, the pacing and the questions are not transferable; the lesson requires a
teacher who already knows it) no longer holds. It is replaced by a narrower,
one-line objection recorded as TT-R1.

**TRANSFER: NOT READY** — on TT-R1 alone.

## NARROW RE-CHECK (ROUND 3)

Scope: narrow confirm-or-refute of `DISSENT teacher-l1-night5-now` after repair round 3
only — not a full cold protocol. Server booted on PORT 4353
(`runtime/dist/server/index.js`, mechanics adapted from `runtime/scripts/e2e-m2l1.cjs`),
driven headlessly through a real 3-desk session on `/teach`, `/play` to Night 5 and
through all 7 reveal presses. Screens: `docs/gauntlet/module-2/screens-l1-teacher-r3/`.
Findings dump: `screens-l1-teacher-r3/findings.json`. Zero console errors across
`/teach` and three `/play` pages for the whole run **[observed]**.

- **Night 5 has its own NOW block and a repeat-price WATCH FOR flag — CONFIRMED.**
  `runtime/src/modules/fullHouse.ts:2411-2433` splits `isNight4` / `isNight5` /
  Nights-1-3 into three independent blocks (comment at 2404-2410 names the old bug
  directly). Live on Night 5 (`06-teach-night5-repeatflag.png`): NOW reads *"Night 5
  of 5 — the payoff night. Read it as a repeat, not as a new card: 'Same day, same
  visiting club, same TV as Night 1. Nothing on this card has changed.' There is no
  capacity option tonight and nothing is going to run out."* `ON THE PROJECTOR RIGHT
  NOW` on the same screen reads *"NIGHT 5 — TONIGHT'S CARD ... Same card as Night 1
  ... The only thing that has changed since Night 1 is you."* — the two blocks agree;
  neither mentions capacity or "demand will run past what this building holds"
  (that language is confirmed still correctly scoped to Night 4 only, contrast
  `04-teach-night4-now.png`). WATCH FOR carries its own `repeat-price` flag, distinct
  from the stalled-desk flag: *"2 desks are sitting on their own Night 1 price ...
  Say nothing to them. These are the desks the Night 1 vs Night 5 board can quote
  with no price confound."* Source: `fullHouse.ts:2139-2156`. **[observed]**
- **Held-price/bowl WATCH FOR actions retire when their moment passes — CONFIRMED.**
  `fullHouse.ts:2161-2171` (held-price: `"Call on this desk NOW"` at ADAPT only,
  `"Already used, if you called on them at ADAPT"` from COUNTERFACTUAL on) and
  `2198-2206` (bowl: `"Keep this for the Night 4 reveal"` pre-reveal,
  `"Already named on the projector at reveal stage 4"` after). Live: ADAPT screen
  reads `Call on this desk NOW` (`09-teach-adapt-heldprice.png`); SYNTHESIS reads
  both retired forms verbatim (`10-teach-synthesis-retired-flags.png`); COMPLETE
  carries neither stale instruction. **[observed]**
- **The same confirm guard now covers both "Advance" and "Jump to REVEAL" —
  CONFIRMED.** `runtime/src/client/teach/main.ts:920-966` — one
  `confirmSkippingContent(via)` function, both `btnAdvance` and `btnReveal` listeners
  call it (959-966). Live: pressed `Jump to REVEAL` at Night 2 with 0/3 locked; the
  dialog fired with `"Jump to REVEAL. Night 2 of 5 is still open (0/3 desks locked
  in). This is not the night bell — this button settles tonight for every desk AND
  ends the five-night window early, so 3 nights will never be played. 3 desks have
  not locked; they settle at whatever price is on their dial right now. Continue?"`
  — dismissed, and the console held at PLAY / Night 2 with state unchanged
  (`02-teach-night2-before-jump.png`, `03-teach-night2-after-dismiss.png`).
  **[observed]**
- **Wrap-up ASK is done-conditional — CONFIRMED.** `fullHouse.ts:2441-2454`
  branches on `done`. Live, all 5 nights closed but still in PLAY
  (`07-teach-wrapup-ask.png`): ASK reads *"Before we look: whose Night 5 crowd was
  NOT the same as their Night 1 crowd? ... Which night do you already know you got
  wrong?"* — the stale *"What on tonight's card is different from last night's?"* is
  gone from this screen. **[observed]**
- **The modeled-dollars line no longer reads as code-identifier teacher voice —
  CONFIRMED.** `fullHouse.ts:1400-1406` — the risk line now quotes
  `MODELED_DOLLARS_LINE`'s actual sentence, marked as the mirror it is (*"Their
  screens already say so before the first price, in these words: 'The magnitudes
  are not real club financials...'"*), not the old `"MODELED_DOLLARS_LINE says
  so"`. Confirmed by reading the live `<details>` panel's own text content on
  `/teach` (`01-teach-simplifications.png`); the string `MODELED_DOLLARS_LINE says`
  does not appear anywhere on the rendered page. **[observed]**
- **A prep pointer exists — CONFIRMED.** `runtime/src/client/teach/index.html:55-64`,
  `#rehearseNote`. Live, on `/teach` before any session is created
  (`00-teach-precreate-preppointer.png`): *"Never run this lesson before? Create a
  session now with nobody in it and press Advance ▸ through every phase. The
  console's directing panel ... is all there with zero students, so you can
  rehearse the whole period before the class walks in."* **[observed]**
- **The projector-mirror stage claim for the renewals rule is fixed (`=== stage
  5`) — CONFIRMED.** `RENEWALS_REVEAL_STAGE = 5` (`fullHouse.ts:697`); `boardView`
  gates the actual rule render at `=== RENEWALS_REVEAL_STAGE`
  (`fullHouse.ts:2021`); the teacher-facing mirror now gates its claim the same
  way, `state.revealStage === RENEWALS_REVEAL_STAGE` (`fullHouse.ts:2286-2288`,
  replacing the old `>=`). Live, the instant reveal press 5 landed
  (`08-teach-reveal-stage5.png`): `ON THE PROJECTOR RIGHT NOW` reads *"STAGE 5 OF
  7 — NIGHT 5 — NIGHT 1'S CARD AGAIN, AND THE RENEWALS RULE ... The renewals rule
  is on the screen in full, directly under the headline and above the chart."*
  — the claim appears exactly on the stage the board itself renders it, matching
  the fix. **[observed]**

### TRANSFER: READY

On the seven items named in this recheck, all seven are CONFIRMED against the
rendered `/teach` surface with a real 3-desk session driven to Night 5 and through
all 7 reveal presses. The Night 5 screen in particular states Night 5's actual card
and repeat framing and contradicts nothing else on the same screen — the specific
defect the dissent named. This verdict is scoped to the named items only; it is not
a full cold-protocol re-grade of `GATE_L1_TEACHER.md` and does not re-open
non-blocking items already on record there (e.g. TT-R4, `Restore last good state`
still untooltipped — not in scope this round, not re-tested).

### DISSENT teacher-l1-night5-now: DISCHARGED

TT-R1, the blocking finding that produced this dissent (Night 5's NOW block reading
Night 4's card and contradicting the adjacent projector-mirror block), no longer
reproduces. All items claimed fixed in the repair round were independently verified
against the live rendered product, not builder notes.

## W5 RE-AFFIRMATION AT FINAL HEAD

Fresh-context stranger-teacher re-run of `m2l1-full-house` at the current head,
port 4431, cold protocol: the only repo file read before the session was
`runtime/scripts/e2e-m2l1.cjs` (mechanics only, assertions ignored). Everything
below is observed on `/teach`, `/board` and real `/play` seats. Scope is
re-affirmation of the surfaces that changed after the earlier TRANSFER: READY
verdict, not re-litigation of the lesson.

### What was exercised

One full multi-desk session, LOBBY → COMPLETE. Six pairs joined at LOBBY, a
seventh joined late at Night 3, five nights played with a real price spread
($12-$90), event money on N3, the capacity option on N4, and one desk left
unlocked at Night 5. Plus a second, empty-room rehearsal session (the prep path
the console itself recommends).

Changed surfaces, specifically:

- **Counterfactual group pager.** 7 desks = 3 groups. Forward 1→2→3, back
  3→2→1, back at group 1 (wraps to group 3, labelled), forward at group 3
  (wraps to group 1, labelled). At every group the `#fhCfPager` label named
  exactly the desks rendered beneath it (`Group 2 of 3 — Desk 3, Desk 4,
  Desk 6` over rows `Desk 3 · New York Knicks $70 → $24`, `Desk 4 · Memphis
  Grizzlies $12 → $20`, `Desk 6 · Memphis Grizzlies $16 → $40`). `#stage` did
  not overflow at 1366x768 or 1920x1080 on any group. Teacher-side labels
  pre-announce the destination group by desk name in both directions.
- **Board fold / staging.** Every frame visited (LOBBY, HOOK, five PLAY nights,
  Two Peaks release, REVEAL 0-7, ADAPT, CF x3 groups, SYNTHESIS x6, COMPLETE)
  fitted both projector shapes. No overflow observed anywhere.
- **Synthesis pager.** Six distinct cards, each computed from this class's own
  numbers, forward through all six and wrapping to card 1; back labels name the
  previous card. Exit question and dated sources land on card 6 only.
- **Reveal-stage SAY lines.** All seven presses. The button names the next beat,
  the seven-item list marks `on the projector` / `next press` and carries a
  one-line direction per stage.
- **Misclicks.** (a) Night 1 bell rung with 4/6 locked; (b) `Advance ▸` pressed
  mid-PLAY — guarded by an explicit confirm: *"Night 1 of 5 is still open (0/0
  desks locked in). This is not the night bell — advancing now settles tonight
  for every desk AND ends the five-night window early, so 4 nights will never be
  played. Continue?"*; dismissing kept PLAY, accepting jumped to REVEAL and
  `Restore last good state` returned the room to PLAY Night 1 with the board
  correct; (c) `Freeze` → board `FROZEN`, desks "Your teacher has frozen the
  session. Hang tight.", `Unfreeze` restored the exact frame.
- **Refresh.** `/board` reloaded mid-Night-2 and again on CF group 3 (group
  preserved); a locked desk reloaded and came back locked with its recap; the
  teacher console was re-opened from four separate browser processes across the
  session and re-attached to the live room every time.

Zero console errors across the whole session. The only errors logged were from
deliberate probes: a 404 on a bogus board code and a 409 on a duplicate seat
name.

### New findings

None blocking. Nothing found on the changed surfaces contradicts the earlier
verdict; the paging work is legible, labelled and reversible from `/teach`
alone.

Non-blocking, highest severity first:

1. **The teacher key is never shown, and the copy says it is.** On a wrong-key
   reopen, `/teach` states: *"The key is per-session and is what stops anyone
   else driving your room. It is shown once, on the console that created the
   session."* The key appears nowhere in the console's text or HTML — it exists
   only in `localStorage` (`bow-teach-session-key`). Same-profile resume works
   (verified repeatedly). Reopen with the real key on a second device works
   (verified). But a teacher who loses the profile — new device, cleared
   storage, private window — cannot recover a live room, and the surface tells
   them a key was shown that never was. Pre-existing, outside the changed
   surfaces; recorded here because failure recovery is in this gate's scope.
2. **A mistyped projector code hangs silently.** `/board` with no code gives an
   excellent recovery card ("WHICH ROOM?" plus the code's location).
   `/board?code=BOGUS1` sits on "CONNECTING… / reconnecting…" indefinitely with
   no bad-code diagnosis — the likeliest projector failure in a real room.
3. **REVEAL's `ASK` block is phase-level and premature.** Through all seven
   stages it shows the Night-5 question ("Same night, same visitor. Why did more
   people come the second time?"), while the per-stage prompts live in the
   quieter seven-item list. A teacher reading the loud box at stage 1 asks a
   Night-5 question four presses early.
4. **The outside-sports line is one shared block, repeated under all six
   synthesis cards** (flights/hotels, Tuesday movie tickets and popcorn, bake
   sale in the rain, milk loss leader). Disclosed on `/teach` and in the button
   tooltip, so it is not hidden knowledge — but staging made it read six times,
   and it is not mapped per concept: under NIGHT 5 WAS NIGHT 1 (path
   dependence) and TWO BOOKS, NO EXCHANGE RATE (two objectives, no common unit)
   the four examples on screen are all pricing examples. The per-card outside-
   sports leg of the synthesis chain rests on one generic line.
5. **`/teach` never names the synthesis card currently on the projector.**
   REVEAL says "Stage 3 of 7 — …"; SYNTHESIS's projector mirror lists all six
   titles in order and the current card is only inferable from the Next/Back
   button labels.
6. **An auto-committed desk is invisible on `/teach` after the fact.** The
   pre-bell copy explains AUTO clearly and the desk's own history row is
   labelled, but after an early bell the teacher's desk mirror shows the
   auto-committed desk like any other, and the later "Held the same price 3+
   nights" watch-list counts an auto-committed night as a held price.
7. **The pre-create rehearsal note speaks another lesson's vocabulary.** It
   tells the teacher to rehearse PLAY with "the round step … the two-thirds
   test … the week bell" and warns that advancing "would throw away the vote and
   the whole season". Full House has a night bell and a Two Peaks release, no
   vote, no rounds, no weeks. The warning it carries is true and important; the
   named controls do not exist here.
8. **The rehearsal path cannot rehearse the changed surfaces.** With zero desks,
   COUNTERFACTUAL reads "NO DESK HAS PLAYED BOTH NIGHTS YET" and the synthesis
   pager collapses to a disabled "One card only". Both are correct degradations
   and the directing text describes what will appear, but a teacher preparing
   tonight cannot practise the paging itself.
9. Minor: the TIME CUT card still offers "Past minute 45? Drop the Night 4
   capacity-option discussion" while the console is at COMPLETE.

### Judgement

The directing panel carries the class without hidden founder knowledge: NOW with
a time budget, ON THE PROJECTOR RIGHT NOW mirroring the board the teacher is
standing beside, WATCH FOR naming specific desks with what to do about them (in
the red, held one price, turned away 500+, paid to open the building), ASK with
model answers, DON'T EXPLAIN YET, an explicit TRIGGER for the Two Peaks release
that hands the timing decision to the teacher with the tradeoff stated, and a
TIME CUT. Intervention is desk-specific and actionable; reveals are manual;
recovery paths land. The gaps above are copy and disclosure gaps, not gaps in
the teacher's ability to run the period.

TRANSFER: READY (at final head)
