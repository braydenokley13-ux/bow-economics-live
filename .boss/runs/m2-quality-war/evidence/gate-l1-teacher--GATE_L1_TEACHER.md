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
