# DESIGN C — CLEAN ROOM

**Module 1 "The Cap" — a three-class architecture candidate.**
Author: clean-room director (no sight of the existing M1 implementation, no sight of Designs A or B).
Date: 2026-09-03.
Built against: `CLAUDE.md`; `FROTH_BRIEF.md`; `NBA_FINANCIAL_TRUTH.md` (all nine sections);
`PLATFORM_REALITY.md`; `VISUAL_TARGET.md`; the Economic Learning Contract; `PRODUCT_DECISIONS.md`
D4, D6, D10, D22, D24, D25, D26, D28, D30, D34, D38; `shared/lessonModule.ts`; `shared/phases.ts`.
Quality bar read: the header and market region of `runtime/src/modules/fullHouse.ts`.

**Nothing in this document is verified.** I ran no build, no test, no browser, no class. Every NBA
figure is quoted from the dossier at the dossier's confidence with its as-of date. Every model
number is either a dossier figure or is named here as *the module's own arithmetic, to be tuned
against a stated property*. The Stage-0 prototype at `stage0/c-l1.html` is the only thing here that
has been executed, and it has been executed only by me.

---

## 1. THE ONE SENTENCE

> **You run a real NBA front office on the first three days of free agency, and every player you
> want has to come through one of five doors — and the door you walk through is what you are
> really choosing.**

Teacher's repeatable version: *"You don't pick a player. You pick how you pay for him — and each
way of paying takes something different away from you."*

---

## 2. THE CORE FANTASY

**A 10-year-old leans in** because there is a name on a screen that another table also wants, and in
ninety seconds one of you will have him forever and the other will watch his name go dark. The
scarcity is a *person*, not a bar. And because the thing they operate is the real thing adults
operate: a cap sheet with Victor Wembanyama at $16,868,013 sitting three rows below De'Aaron Fox at
$49,488,300, which is visibly, outrageously backwards and which they can ask about out loud.

**A 13-year-old leans in** because the puzzle is not "can I afford him" — it is "which of the four
legal ways to afford him leaves me able to do the *next* thing," and there is no way to find that
by trying. The doors are asymmetric in three dimensions at once (how much, how many years, what it
destroys), and one of them silently builds a wall you will hit in February. Discovering that a rule
you invoked *yourself* is the rule that later stops you is the single most adult feeling in the
dossier, and it is available to a thirteen-year-old in fifty-five minutes.

**Both bands lean in for the same reason:** this is not a simulation of basketball. It is the job
next to basketball, which almost nobody has ever let a kid do, and which turns out to be about
things they already have opinions about — who deserves what, what a promise costs, whether the
richest one always wins.

---

## 3. THE FALSE INTUITION AND HOW IT BREAKS

The module opens on **"my job is to build the best basketball team possible."** It breaks in three
named moments, each in a different lesson, each replaced by something specific.

### Break 1 — L1, the FOREGONE panel freezing at the first lock (≈ minute 18 of Lesson 1)

The pair has decided to sign the best available big. They press LOCK. In the same animation frame,
the panel to the right of the cap sheet stops being live and turns into a receipt titled **WHAT
THIS COST YOU**, listing by name the things that are now unavailable — *your own wing, gone; the
$15,044,000 mid-level, gone; four summers spoken for.* It is not a warning. It already happened.

**Replaced by:** *"My job is to choose what NOT to have."* (C2, and the reason the module's spine is
opportunity cost rather than budgeting.)

### Break 2 — L2, the tool rack strike-through (≈ minute 12 of Lesson 2)

The lesson opens on the same franchise, in February. Beside the books is a rack of six things the
pair may *do*. One of them — *combine two players in one trade* — is already struck through, and the
strike carries a sentence computed from the carried field: **"You used the mid-level on July 1.
$209,015,000 is a wall you may not cross this season, for any reason."** No money was taken. A verb
was taken. And the pair took it from themselves, in the previous class.

**Replaced by:** *"My job is to protect what I can still do."* (C4 + C8 + C5. This is the moment the
cap stops being a wall and becomes an institution with teeth of different shapes.)

### Break 3 — L3, THE SAME DECISION, TWO OUTCOMES (≈ minute 40 of Lesson 3)

The projector puts two desks side by side that made the *identical* committed move in round 1 and
arrived at different places — with the cause named, and the cause is another desk. Immediately
after, the real pair: the Lakers gave up three firsts for Anthony Davis in June 2019 and won the
2020 title; the Clippers gave up five firsts and two swaps for Paul George in July 2019, the same
summer, at a similar price, and never reached a Finals (§5.7, both dated, official-NBA and ESPN
sourced). The room has just produced its own version of that, from its own play.

**Replaced by the destination:** *"Running an NBA franchise means allocating scarce resources across
competing goals under uncertainty"* — where the uncertainty, in this module, is **other people**,
and is therefore always interpretable afterward and never a shrug.

---

## 4. THE LESSONS

### Conventions used in all three

- **Definition of payroll, stated once and applied uniformly** (§8.2 #12, §7.12 #1): *committed
  roster salary* (HoopsHype figures, §4.4, as of 2026-09-03, medium confidence), **plus** the
  module's own modelled free-agent amounts, which are labelled MODELLED wherever they appear. The
  module never mixes definitions and never prints a payroll figure without this label.
- **No percentage, ratio, negative number or probability is ever load-bearing in the 5–6 build**
  (§8.2 #21). Every threshold and every price is a real whole dollar figure; the only arithmetic a
  student performs is addition and subtraction.
- **No scalar "team quality" exists anywhere** — not in state, not in a payload, not in a renderer.
  Roster strength is a **set of covered roles**, which cannot be summed, ranked, or sorted.
- **No `Math.random` anywhere in any reducer.** The module models **no chance events at all.** Every
  outcome has a named cause and the cause is always either a rule or a decision somebody made.
- **Excluded clubs** (§8.2 #3, #4): Golden State, Cleveland, Indiana, Miami, the Clippers and
  Toronto are never student seats and their cap positions are never rendered. Indiana and Chicago
  may appear only as the historical incumbent named on a free agent's card, with no cap claim.

---

## L1 — **JULY 1**

*Scarcity · opportunity cost · constrained allocation · market position as inherited and unequal.*
Concepts: C1, C2, C3, C13, threaded C9 and C10. Sets the carry for C5.

### 4.1.1 The signature mechanic — **THE DOOR**

**What is on screen (`/play`).** One column, no tabs, nothing scrolls away.

1. **THE FRANCHISE BAND** (top, ~120px). Real club wordmark, typographic only, no logo art. Three
   real facts: the club, its committed roster salary with its definition, and one dated economic
   fact about it from §4.1. *"OKLAHOMA CITY · $216,410,000 committed · smallest market in the
   league; won the 2025 title; holds 13 future first-round picks."* This band never changes and it
   is the persistence anchor across all three lessons.
2. **THE SHEET** (hero). A vertical stack of horizontal bars, one per contract, real name and real
   2026-27 dollar on each, ordered by size. Dead money bars are drawn in the same units as live
   players and carry the person's name (Milwaukee's Damian Lillard bar at $21,311,053 is the third
   bar down, §8.1 #21). Below the contracted players, a visually distinct group: **FREE AGENT
   AMOUNTS** — your own free agents, each occupying a spot on the sheet at a modelled hold, with
   the real rule in one line: *"until you re-sign him or let him go, the league keeps his spot on
   your books."* Across the sheet, two horizontal rules: **THE FLOOR $148,465,000** and **THE CAP
   $164,961,000**, each labelled with what it does, not what it is.
3. **THE MARKET** (right, or below at 1024×600). Today's free agents. Each card carries exactly
   four things (Design Rule 15): **role**, **price per year**, **one plain-language strength**,
   **one plain-language risk**. No rating, no stars, no scalar of any kind. A fifth line, small,
   carries the provenance: *"signed 4 years / $107,000,000 with Milwaukee, July 2025."*
4. **THE DOORS** (the decision surface). Five buttons, each live or dead with a computed reason:

| Door | First-year ceiling | Term ceiling | Who may use it | What it does to you |
|---|---|---|---|---|
| **CAP ROOM** | your room | 4 yrs | teams whose books are below $164,961,000 | consumes room; your remaining tool becomes the **room mid-level $9,366,000** |
| **YOUR OWN GUY** (Bird) | up to his max | **5 yrs** | only for a free agent on *your* sheet you have **not** let go | legal above every line in the system |
| **MID-LEVEL** | **$15,044,000** | 4 yrs | over-cap teams whose books after signing stay under $209,015,000 | **sets a hard ceiling at $209,015,000 for the rest of the year** |
| **SMALL MID-LEVEL** | **$6,064,000** | **2 yrs** | over-cap teams | nothing |
| **MINIMUM** | $1,357,763 – $3,876,529 | 1 yr | anyone, always | nothing |

   Every dollar figure above is official-NBA, 2026-27, `pr.nba.com`, as of 2026-06-30, and
   independently re-verified by the lead integrator (§9.2).

5. **THE FOREGONE PANEL** (beside the doors, always open at 5–6, collapsible at 7–8). Live, recomputed
   on every selection change, never a template: *"If you sign Myles Turner through cap room: you let
   go of your own wing and your own big, permanently. Your next tool shrinks from $15,044,000 to
   $9,366,000. Four summers are spoken for."* Every line is generated from the diff between the
   current state and the post-action state — **it is the reducer talking, not a copywriter.**

**What the student manipulates.** Three toggles and two selects, and nothing else:
`RENOUNCE <name>` (a hold; free until commit), `TARGET <player>`, `DOOR <door>`, and at 7–8 only,
`TERM <1..door ceiling>`. Selection is free and reversible; **LOCK THIS DAY** is the commit.

**What commits.** One action, `lockDay`, carrying `{day, renounced[], target|null, door|null, term}`.
Refused by the reducer if the phase is not PLAY, if the day is already locked, if the door is
illegal for this desk's books, if the term exceeds the door's ceiling, if the roster would exceed
15, or if the resulting salary would exceed an active hard cap — each with its own sentence.

**What the server computes, at the close of each day** (deterministic, simultaneous, no clock, no
random):

```
1. Apply every desk's renunciations.        (irreversible, immediately)
2. Group every desk's offer by target player.
3. For each contested player, in a fixed player order:
     a. any offer from the player's incumbent through YOUR OWN GUY wins outright
        — the real rule: the incumbent may offer 5 years / 8% raises, everyone
          else 4 years / 5% (§8.1 #10);
     b. else the offer with the most guaranteed years wins;
     c. else the higher first-year salary wins;
     d. else the desk with more room remaining after the signing wins;
     e. else NOBODY signs him today. He returns tomorrow at the same price.
        (Two identical offers is a real reason a player waits. It is never
         resolved by arrival time — see PLATFORM_REALITY M13.)
4. Apply winners. Struck players leave the pool FOREVER.
5. Apply hard-cap flags, tool consumption, slot counts, empty-slot charges.
6. Recompute every desk's books. Freeze foregoneAtLock.
```

### 4.1.2 The exact economic model

**Constants — all real, all official-NBA 2026-27 unless marked.**

```
CAP                 164,961,000   pr.nba.com, 2026-06-30, high
FLOOR               148,465,000   = 90% of cap exactly, official
FIRST_APRON         209,015,000   official (drawn in L1 only as the mid-level's ceiling)
NTMLE                15,044,000   official, ≤4 yrs
ROOM_MLE              9,366,000   official, ≤3 yrs
TAXPAYER_MLE          6,064,000   official, ≤2 yrs
VET_MINIMUM           3,876,529   cap-database, high (10+ yrs of service)
ROOKIE_MINIMUM        1,357,763   cap-database, high
ROSTER_MAX                   15   official rule (§2.10)
ROSTER_COUNTED_MIN           12   official rule (§2.5 anti-gaming backstop)
```

**Formulas — addition and subtraction only.**

```
books          = Σ contracts + Σ deadMoney + Σ unresolvedHolds + emptySlotCharge
emptySlotCharge= max(0, 12 − (contracts + holds)) × ROOKIE_MINIMUM
room           = max(0, CAP − books)                     [never displayed negative]
overCap        = books > CAP
floorShortfall = max(0, FLOOR − books)                   [paid to players league-wide,
                                                          not to your roster — real rule]
hardCapBreach(a) = hardCapAt !== null && books_after(a) > hardCapAt
```

**Door legality — one predicate each, and the refusal sentence is generated from the predicate.**

```
ROOM         legal ⇔ !overCap && room ≥ price
YOUR OWN GUY legal ⇔ target is an unrenounced hold on THIS sheet
MID-LEVEL    legal ⇔ overCap && ntmleUnused && (books + price) ≤ FIRST_APRON
                     ⇒ sets hardCapAt = FIRST_APRON, hardCapBecause = "the mid-level, July 1"
SMALL MID    legal ⇔ overCap && taxMleUnused
MINIMUM      legal ⇔ contracts < ROSTER_MAX          [always, by construction]
```

**What must be TUNED, and against what property.** Three numbers only.

| Quantity | Status | The property it is tuned against |
|---|---|---|
| Each club's **modelled free-agent amounts and re-sign prices** | module's own scenario, labelled MODELLED | **(i)** every seat has ≥2 genuinely different affordable options on every day in the worst reachable case; **(ii)** at least three of the twelve seats face a live renounce-vs-keep fork where neither branch dominates; **(iii)** no seat is under the floor after any reachable full-commit path *and* over the floor after every pass path (the floor must actually bind somewhere) |
| The **number of free agents per role** in the shared pool | module's own scenario | for a majority of seats, in the worst reachable case, there exists a legal action the pair demonstrably wants and cannot take — brute-forced over the reachable action space, not spot-checked |
| The **role composition of each club's holes** | module's own scenario, derived from real roster composition where §4.1 states it | non-separability: for at least half of all (seat, player) pairs, the same player's contribution to role coverage differs between two seats |

Everything else is a published NBA figure. **No constant in this module is invented in order to make
the game work.** That is the difference between this and the discarded L1's $100M cap.

### 4.1.3 Which of the REASONING TEST limbs L1 satisfies

Named explicitly, as the contract requires. **(a), (c), (d) and (e).**

- **(a) Non-summable objectives.** Roles covered on the floor is a *set*. What you can still do is a
  *list of legal actions*. Neither converts to the other and no action is weakly best on both for
  all seats.
- **(c) Non-separability.** A second big is worth nothing to San Antonio (Wembanyama, $16,868,013)
  and everything to a desk with no big. Greedy on price provably fails because the same card has a
  different value on every sheet.
- **(d) A second binding constraint.** Roster slots (15 max) and the 12-counted minimum charge bind
  simultaneously with money, and which one binds depends on the plan: a minimum-contract strategy
  runs out of *slots*, a max-contract strategy runs out of *dollars*.
- **(e) Another desk.** The pool is shared and shrinking, loss is permanent, and the tie-break is
  the door — a desk using the small mid-level cannot outbid a desk using the mid-level, because the
  small mid-level's term ceiling is two years.

**(b) is also satisfied** — the card carries no scalar — but I do not rely on it, because a
determined pair can construct a ranking from price alone, and (a)/(c)/(d)/(e) are what stop that
ranking from working.

### 4.1.4 The real NBA facts L1 uses

| Fact | Where | As-of | Tier / conf. |
|---|---|---|---|
| Cap $164,961,000 · floor $148,465,000 · first apron $209,015,000 | §1.2, §9.2 | 2026-06-30 | official-nba / high |
| NTMLE $15,044,000 · room MLE $9,366,000 · taxpayer MLE $6,064,000 | §1.2, §8.1 #7 | 2026-06-30 | official-nba / high |
| Floor = exactly 90% of cap; shortfall paid to players league-wide, not to your roster | §2.1, §8.1 #2 | 2026-06-30 | official / medium on the destination |
| Using the NTMLE hard-caps you at the first apron for the rest of the league year | §2.3 | 2026-07 | cba / high, corroborated |
| Re-signing your own player: 5 yrs / 8% raises; elsewhere 4 / 5% | §8.1 #10 | 2023 CBA | cba / high |
| Renouncing permanently destroys Bird/Early-Bird/Non-Bird rights | §2.5 | 2023 CBA | cba / high |
| Cap holds: the empty chair still costs money | §2.5 | 2023 CBA | cba / high |
| Fewer than 12 counted players ⇒ a rookie-minimum charge per empty slot | §2.5 | 2023 CBA | cba / high |
| 15 standard contracts max | §2.10, §8.1 #8 | 2023 CBA | cba / high |
| Rookie scale is a price ladder by slot: No. 1 $14,748,000 vs No. 30 $2,926,800 | §8.1 #9 | 2026-07-02 | cap-database / high |
| Wembanyama $16,868,013 beside De'Aaron Fox $49,488,300 | §4.1 #10 | 2026-09-03 | cap-database / medium |
| Detroit lowest committed payroll $136,252,755, full $15,044,000 NTMLE, 7 firsts through 2033 | §4.1 #6 | 2026-09-03 | cap-database / medium |
| Memphis $3,926,207 of room against $21,909,021 of dead money | §4.1 #9 | 2026-09-03 | cap-database / medium |
| Milwaukee pays Damian Lillard $21,311,053/yr through 2030-31 | §8.1 #21 | 2026-09-03 | official + cap-database / high |
| New Orleans, ninth-highest payroll $212,290,592, not a contender | §4.1 #12 | 2026-09-03 | cap-database / medium |
| Every team gets the identical national check: $143M in 2025-26, up from $103M | §8.1 #13 | 2025-26 | official / high |
| Team revenues $833M (Golden State) to $301M (Memphis), 2024-25 | §8.1 #15 | 2024-25 | high |
| Free-agent market prices: Turner 4/$107M (Jul 2025), KCP 3/$66M (2024), Brown 2/~$45M (Jul 2023), Noah 4/$72.6M (2016), Ayton 2/$16.6M (2025) | §5.1, §5.4, §5.5, §5.8, §5.9 | dated per card | reporting / high–medium |

**Market position is instantiated only by those dated financial facts** — the $143M identical check
beside the $833M/$301M revenue spread, and the twelve real cap sheets. There is no Large/Mid/Small
chip anywhere (§8.2 #11, FL4a), no market ranking on the board, and the club assignment is
exogenous, visible, deterministic from join order, and never scored.

### 4.1.5 Phases

`LOBBY · HOOK · PLAY · REVEAL · CONSEQUENCE · SYNTHESIS · COMPLETE`
(canonical indices 0,1,2,3,4,8,9 — strictly increasing ✔)

### 4.1.6 The four spectacle beats

| Beat | What happens |
|---|---|
| **SIGNATURE DECISION** | Day 1's door, with the FOREGONE panel live at the pair's elbow and freezing into a receipt at LOCK. |
| **CONSEQUENCE** | The day resolves simultaneously across the room. Two things land in the same second: your sheet grows a bar, and **a name in the shared market goes dark** — permanently, with a strike-through the whole room sees on the projector. A desk that lost is told which rule lost it: *"Detroit offered four years. You offered two, because the small mid-level only allows two."* |
| **CLASS REVEAL** | **THE DOORS OF THE ROOM.** Five columns, one per door, showing how many desks walked through it, and beside each, the two things it cost them expressed in units that cannot be added: *roles covered* and *tools still on the rack*. Under it, **THE CONTESTED BOARD**: every player two or more desks wanted, who got him, and the rule that decided it. |
| **INTELLECTUAL REVEAL** | **THE SAME PLAYER COST EVERY DESK A DIFFERENT THING.** One player three or more desks pursued; beside his name, the three frozen `foregoneAtLock` lists, verbatim, from the three desks. Identical price, identical player, three genuinely different opportunity costs — and at 7–8 the teacher's line is *"and all three of them are right."* This is CEE's grade-8 "the evaluation of opportunity cost is subjective," produced by the room, not asserted by a slide. |

### 4.1.7 TIME CUT

**Round unit: `day`.** Three days (July 1, July 2, July 3 — the real opening of the league year,
§1.2). `currentKey` = `"day-<n>"` while PLAY and the day is open; `null` otherwise.

**`fallbackPolicy`:** *"A desk that has not locked signs nobody today. Nothing is spent, nothing is
let go, and the market moves without them."*

**Per-desk `selfFallback`, computed, never authored:**
> *"If July 1 closes now, Detroit signs nobody. Your own wing stays on your books at $18,000,000 and
> your own big at $14,000,000, so you have $8,708,245 of room and no new player. Myles Turner has
> two other desks on him."*

**Why the fallback does not dominate** (rejection #6, Family 4's platform-created exploit). Doing
nothing costs four real things, all modelled: (i) unresolved holds keep occupying the sheet, so
"waiting" is *paying*; (ii) the 12-counted backstop charges a rookie minimum per empty slot below
twelve; (iii) the pool shrinks permanently and the players you wanted are gone; (iv) if you finish
under $148,465,000 you pay the shortfall **to players league-wide**, receiving nothing. Asserted by
a sweep, not by this paragraph: *no seat's pass-every-day outcome is weakly better than that seat's
best available action on any of the four reveal axes.*

### 4.1.8 What the projector shows, beat by beat

| Beat | `/board` |
|---|---|
| LOBBY | THE LEAGUE. Twelve real club wordmarks, each with its committed payroll and one dated fact. The $92M spread from Detroit to Golden State is visible as a single row of bars, unranked and unlabelled by merit. One line: *"Every one of these teams gets the same $143,000,000 national television check."* |
| HOOK | THE TWO NUMBERS. $164,961,000 and $148,465,000, enormous, with four words each: *"the most you may spend without a door"* / *"the least you may spend at all."* Nothing else on the wall. |
| PLAY, day open | THE MARKET. The free agents, huge, with role and price. A count: *"14 of 16 desks have locked July 1."* **No comparative money of any kind while a day is open** (M2's R13, rejection #26). |
| PLAY, day closing | THE MARKET, with FINAL CALL's server-clocked countdown band. |
| CONSEQUENCE | THE STRIKE. Signed names go dark one at a time on a teacher-advanced beat, each with the club that got him and the door they used. This is the only motion on the projector all lesson. |
| REVEAL stage 1 | THE DOORS OF THE ROOM (five columns). |
| REVEAL stage 2 | THE CONTESTED BOARD. |
| REVEAL stage 3 | THE SAME PLAYER, THREE COSTS. |
| SYNTHESIS | Four cards, one per concept, each with the room's own number in it and a dated real case beneath it. |

Every number on every board is gated **into the payload** keyed off a module-owned `beat`
(D26/D47), never filtered on the client, with a per-beat test looping every beat and requiring each
key `undefined` before its beat.

### 4.1.9 What `/teach`'s director says

| Beat | NOW | ASK | DON'T EXPLAIN YET | WATCH FOR |
|---|---|---|---|---|
| HOOK | "Put the two numbers up. Read them out. Then say: *these are real, they are this season's, and every team in the league is stuck with them.*" | "If your team could spend anything it wanted, would it win?" | Do not say "opportunity cost." Do not say "scarcity." Do not explain what a door is — the buttons explain themselves. | Hands going up to say a team's name. Take two, no more. |
| 5–6 only: WORKED DAY ZERO | "Run one signing with the whole room on Utah, which nobody is playing. Pick the big. Pick a door. Read the foregone panel out loud before you press LOCK." | "What did we just give up?" | Do not name the concept. Name only the *things*. | Whether the room can say the giving-up out loud. If they cannot, run a second one. |
| PLAY day 1 | "Walk. Do not answer 'which is better.' Answer 'what does that one take from you.'" | "Which door are you using, and what does it cost you?" | Do not explain the hard cap. Do not explain the apron. Not this lesson. | THE ROOM: desks that have selected a target but no door for over ninety seconds. That is a pair who has not understood that the door is the decision. |
| Day close | "Read the AT TIME CUT list. Say out loud what closing does to the three unresolved desks." | — | — | A desk whose fallback is a floor shortfall. Walk there first. |
| CONSEQUENCE | "Advance the strikes one at a time. Let the room react to each." | "Whose name just went dark, and who has him?" | Do not yet say why the tie broke the way it did — the CONTESTED BOARD says it in two beats. | The table that lost a contested player. They are the best question in the room and they are about to go quiet. |
| REVEAL 1–3 | "One board at a time. Wait for the noise before you advance." | "Two tables gave up completely different things for the same man. Who gave up more?" | Do not adjudicate. There is no answer to that question and the disagreement is the product. | Whether anyone says "it depends what you already had." That sentence is the lesson. |
| SYNTHESIS | "Now name it. *That thing you felt when the panel froze — economists call it opportunity cost.*" | "What did your choice cost your team?" (5–6) / "Would that same choice have been right for Detroit?" (7–8) | — | — |

---

## L2 — **THE DEADLINE**

*The cap as an institution, not a wall · the apron as tool confiscation · path dependence as the
seam · dead money as the topic · the constraint itself is a variable.*
Concepts: C4, C8, C5, C6, C16. Anti-paired away from C10 by construction (see 4.2.6).

### 4.2.1 The signature mechanic — **THE TOOL RACK**

It is February. Same franchise, same names, the books carried from July.

**On screen (`/play`):**

1. The same **FRANCHISE BAND** and the same **SHEET** — but the sheet now carries **five** horizontal
   rules instead of two, and each is labelled by what it *does*, not what it is:
   - **$148,465,000 — you must spend at least this**
   - **$164,961,000 — above here you need a door**
   - **$200,428,000 — above here your mid-level shrinks to $6,064,000**
   - **$209,015,000 — above here four things are taken away from you**
   - **$221,686,000 — above here you may not even combine two players in one trade**
   Five real lines, five genuinely different kinds of object: a compulsion, a permission system, a
   price, a confiscation, and a prohibition. **Not one of them is the same shape as another.** That
   is C4's ladder limb, and it is why FL2 cannot be taught here by construction.
2. **THE RACK** — the hero object of this lesson. Six named verbs, each an item:
   - *combine two players in one trade*
   - *take back more salary than you send out*
   - *send cash*
   - *use the mid-level*
   - *sign a player somebody else bought out*
   - *trade your 2033 first-round pick*
   Items are **struck through in place**, with the line that took them named, and — where the
   trigger was the pair's own July action — **the date they did it**. Phoenix's four confiscated
   tools in 2024-25 (§5.4) are the visual reference and the honest one.
3. **THE PHONE** — three counterparty clubs, real, with their real books and **their own stated
   objective**, published before you compose anything:
   - *"Sacramento is $4,148,000 below $200,428,000 and wants to stay there. It will take the offer
     that sheds the most salary."*
   - *"Detroit has $15,044,000 of mid-level and seven first-round picks. It wants young players and
     will absorb salary to get one."*
   - *"Denver is $11,354,447 above $221,686,000. It may not take back a dollar more than it sends,
     and it may not combine two players."*
   Each will do **exactly one deal** this deadline, league-wide.

**What the student manipulates.** Drag contracts from your sheet into OUT; drag contracts from a
counterparty's sheet into IN; optionally add a pick. Beside the composition, a **live legality
read** that updates on every change and never mentions a percentage:

> **Legal for you.** You send $28,000,000 and take back $26,000,000.
> **Not legal for Denver.** They would take back $2,000,000 more than they send, and they are above
> $221,686,000.

Plus two other verbs on the same screen: **WAIVE** (his money stays on your books, with his name) and
**STRETCH** (spread the remainder over `2 × years remaining after this one + 1`).

**What commits.** `makeCall {counterparty, out[], in[], pick?}` or `waive {player, stretch:boolean}`.
Three calls, then the deadline.

**What the server computes.** For each counterparty, among the offers that were legal for both
sides, the one that best serves that counterparty's published objective wins; ties break on the
objective's own second term; if still tied, the counterparty does nothing and says so. Losers are
told which — *rule* or *rival* — and it is never ambiguous, because the rule check already ran
before they committed.

### 4.2.2 The exact economic model

**Constants (all real, official-NBA 2026-27):** the five thresholds above, plus
`NTMLE 15,044,000`, `TAXPAYER_MLE 6,064,000`, `ROSTER_MAX 15`.

**The trade rule — the SHAPE, never a number** (§8.2 #1, §9.1 ruling, dissent #2). The module's
registered rule, stated in the module's own voice on both HOOK and PLAY:

> *"Once you are over the cap, a trade has to be roughly even — you send out about as much salary
> as you take back. The more you have spent, the tighter 'roughly' gets. At the very top you may
> not take back a single dollar more than you send, and you may not combine two players into one
> trade to make the numbers work."*

Implemented as three bands, all of which are true under all three of §7.1's incompatible accounts:

```
below FIRST_APRON      : salaryIn ≤ salaryOut + MODULE_SLACK
at/above FIRST_APRON    : salaryIn ≤ salaryOut
at/above SECOND_APRON   : salaryIn ≤ salaryOut  AND  out.length ≤ 1
```

`MODULE_SLACK` is **the module's own arithmetic**, labelled as such in the simplifications ledger,
and never rendered as an NBA figure. It is tuned against one property: *for a majority of seats,
below the first apron there exists at least one legal deal that is illegal above it.* No percentage
is printed anywhere in the module, in any surface, ever — assertable by a grep in the claims
harness.

**Tool confiscation — the real list, hard-coded to the real lines** (§2.3, uncontested across all
three researchers, which is exactly why the lesson is built here and not on salary matching):

```
books > FIRST_APRON  ⇒ lose: sign-and-trade · the bi-annual exception ·
                             the $15,044,000 mid-level · prior-year trade exceptions
books > SECOND_APRON ⇒ additionally lose: any mid-level at all ·
                             combining two salaries in one trade · sending cash
hardCapAt !== null   ⇒ NO action may take books above hardCapAt, for any reason
```

**Dead money and the stretch.**

```
waive(p)         : deadMoney += { name: p.name, perYear: p.salary, lastYear: p.lastYear }
stretch(p)       : years = 2 × (p.lastYear − currentYear) + 1
                   perYear = p.remainingTotal ÷ years        [total does not shrink]
                   legal only if total waived charges in any future year stay under the
                   module's stated ceiling  — the real rule is 15% of the cap, but the
                   dollar figure is researcher arithmetic (§8.2 #13) so the module states
                   the RULE and computes its own ceiling, labelled.
```

The worked example on the board is the real one and the arithmetic is grade-appropriate:
**Joakim Noah, 2018-10-13, $19,300,000 becomes $6,400,000 × 3** (§8.1 #20). Division and addition
only, and the total visibly does not shrink.

**C6's falsifier, honoured.** A desk carrying dead money must not have *fewer legal actions* than one
without. Memphis — the real position, $3,926,207 of room against $21,909,021 of dead money (§4.1 #9)
— is a named test case: it must reach every L2 beat with ≥2 genuinely different legal actions, and
the property is brute-forced over the whole reachable carry space, not spot-checked.

### 4.2.3 C16 — the constraint is a variable

The second half of the lesson, entered on a **teacher hook** (never a timer): `teacher:capAnnounced`.

The projector shows the real triple, all §8.1-safe:

| Season | Cap | Change | Why |
|---|---|---|---|
| 2016-17 | $94,143,000 | **+~34%** | there was no limit on how fast it could rise |
| 2025-26 | $154,647,000 | **+10.0%** | the limit is 10% a year, and it hit the limit exactly |
| 2026-27 | $164,961,000 | **+6.7%** | under the limit, because revenue growth slowed |

And then the thing that makes it an institution rather than a law of physics: the 2026-27 cap came
in about **$1,000,000 below the league's own projection because local media revenue fell in
thirteen cities**, and that reduction flowed through to the floor, the tax line and **both aprons**
(§3.3, medium, live and unresolved — labelled as reporting, not as an official figure).

**Mechanically:** every desk's five lines move to the announced next-year values, the desks'
*books* do not move, and the ADAPT phase asks each desk one question: *which of your six tools do you
still have next year?* At 5–6 this is a projector-only three-minute reveal with the class reading one
desk's rack. At 7–8 every desk re-reads its own rack against the moved lines and commits an answer.

### 4.2.4 Real NBA facts L2 uses

| Fact | Where | As-of | Tier / conf. |
|---|---|---|---|
| All five 2026-27 thresholds | §1.2, §9.2 | 2026-06-30 | official-nba / high |
| Tax = 121.5% of cap; floor = 90% exactly | §8.1 #2, #3 | 2026-06-30 | high |
| Above the first apron: no sign-and-trade, no BAE, no non-taxpayer MLE, no prior-year TPEs | §2.3 | 2023 CBA | cba / high |
| Above the second apron: no MLE at all, **no aggregating two salaries**, no cash | §2.3 | 2023 CBA | cba / high, uncontested |
| Using an apron-restricted transaction converts that apron into an absolute wall for the year | §2.3 | 2026-07 | cba / high |
| 22 of 30 teams operating under a hard cap as of 2026-07-10 | §2.3 | 2026-07-10 | cap-database / high |
| The tax bill is computed on **end-of-regular-season** salary — the deadline is the last moment it can move | §2.2 | 2023 CBA | high |
| Seven teams paid tax in 2025-26 totalling $223.1M; seven of fourteen projected taxpayers ducked at the deadline | §8.1 #17 | 2026-04 | high on the list |
| Boston: ~$4,700,000 of salary savings produced ~$35,000,000 of tax savings; combined salary-plus-tax fell ~$540M → ~$280M | §5.4 | 2025-06/07 | high |
| Joe Lacob on the record: "Plan 1, or 1A, is that we'd like to be out of the tax… two years out of the next four to get this repeater thing off our books" | §8.1 #18 | 2024-02-15 | high |
| Indiana was prepared to enter the tax for Myles Turner and pulled back after the Achilles tear | §5.8 | 2025-07 | high |
| Phoenix's four confiscated tools, 2024-25; its 2032 first frozen | §5.4 | 2024-25 | reporting / medium |
| Minnesota aggregated salaries in a trade and thereby hard-capped itself at the second apron | §4.2 | 2026-09-03 | cap-database / medium |
| Milwaukee's $21,311,053/yr Lillard charge through 2030-31; Phoenix's $19,383,010 stretched Beal through 2029-30 | §4.1, §8.1 #21 | 2026-09-03 | high / medium |
| Noah stretch: $19,300,000 → $6,400,000 × 3 | §8.1 #20 | 2018-10-13 | high |
| Denver's Valanciunas stretch: ~$2,000,000 over three years, ~$667,000/yr | §5.5 | 2026-08-27 | high (conflicts with the team page — §7.6; the module uses the dated report and says so) |
| Cap = (44.74% × projected BRI − benefits) ÷ 30; may never fall, never rise >10% | §1.3 | 2023 CBA | high |
| 2016 / 2025 / 2026 cap-change triple | §8.1 #5 | dated | official / high |
| The 2026-27 cap landed ~$1M under projection because local media revenue fell, flowing through to floor, tax and both aprons | §3.3 | 2026-04 | reporting / medium — **labelled as reporting on screen** |

**Never rendered in L2:** any trade-matching percentage; any luxury-tax dollar bill; the
second-apron pick-penalty count or horizon (§8.2 #2 — the 2032 freeze appears only inside the
Phoenix *narrative* card, labelled as reporting, and drives nothing); GSW/CLE/IND/MIA hard-cap
status; any Stepien statement without its secondary-reporting label.

### 4.2.5 Phases

`LOBBY · HOOK · PLAY · REVEAL · CONSEQUENCE · ADAPT · SYNTHESIS · COMPLETE`
(0,1,2,3,4,5,8,9 ✔). ADAPT is where the cap moves.

### 4.2.6 The four spectacle beats

| Beat | What happens |
|---|---|
| **SIGNATURE DECISION** | The deadline package, composed against a live legality read that names the rule and the line **before** you commit — which is also the anti-pairing defence: a pair always knows whether the *rule* stopped them, because the rule speaks first. |
| **CONSEQUENCE** | The deadline passes. Two things land: the rack is re-struck with the new line names, and — for any desk that waived — **a bar appears on the sheet with a person's name on it and nobody in it.** The bar is drawn in the same units as live players, because it is the same money. |
| **CLASS REVEAL** | **THE LADDER.** Five horizontal bands across the projector, labelled by what each line *does*. Desks appear as unlabelled dots **inside** a band — no ordering within a band, no rank number, no merit axis. Beside each band, the verbs the desks in it may no longer use. The room sees at a glance that this is not one wall and that "higher" is not "better": the band at the very bottom is the one that *must spend more*. |
| **INTELLECTUAL REVEAL** | **THE WALL MOVED.** The 2016/2025/2026 triple, then next year's five lines drawn over the room's own unchanged books, then the sentence: *"nothing any of you did moved that. Television money fell in thirteen cities you do not play in."* C16, FL9, and the antidote to "the cap is a number handed down from nowhere," in ninety seconds. |

### 4.2.7 TIME CUT

**Round unit: `call`.** Three calls. `fallbackPolicy`: *"A desk that has not committed does not make
the call. The counterparty hangs up, nothing moves, and the books stand."*

**Per-desk `selfFallback`:**
> *"If this call closes now, San Antonio makes no call. You stay $2,912,000 above $200,428,000, so
> your mid-level is $6,064,000 instead of $15,044,000 for the rest of the year, and Kelly Olynyk's
> $12,900,000 stays on your books."*

**Non-domination**, swept: a desk that makes no call keeps its tax exposure, keeps its dead money,
keeps its uncovered role into L3, and — for the two seats below the floor — pays the shortfall to
players league-wide. And *symmetrically* (FL6a): a desk that over-commits loses tools. The two error
costs are held within one order of magnitude by sweep, or the asymmetry is defended in writing.

### 4.2.8 Projector, beat by beat

LOBBY: THE FIVE LINES, with what each does, and nothing else · HOOK: **22 OF 30** — the count of
teams operating under a hard cap as of 2026-07-10, enormous · PLAY: the three counterparties and
their published objectives; *no comparative money while a call is open* · CONSEQUENCE: THE DEALS,
advanced one at a time, each with the rule that made it possible · REVEAL 1: THE LADDER · REVEAL 2:
THE RACK OF THE ROOM (six verbs, how many desks still hold each) · ADAPT: THE WALL MOVED · SYNTHESIS:
Boston, dated — $4,700,000 of salary saved bought $35,000,000 of tax saved, and the 2024 champion
took itself apart because of a rule.

### 4.2.9 `/teach` director

| Beat | NOW | ASK | DON'T EXPLAIN YET | WATCH FOR |
|---|---|---|---|---|
| HOOK | "Put 22 OF 30 up. Say: *twenty-two teams are playing this season under a ceiling they cannot cross for any reason, and most of them built it themselves.*" | "Who here has something already crossed off their rack? Read out what it says." | Do not say "apron." Say "the line at $209,015,000." The word comes at SYNTHESIS. | 5–6 only: whether every desk with a July-1 hard cap can *find* the sentence on their own rack. If not, read one out. |
| PLAY | "Walk to the desks whose legality read is red. Ask them to read the reason out loud, not to fix it." | "Is it the rule stopping you, or is it Sacramento?" | Do not explain the trade-matching bands. The sentence on the screen is the whole rule this room needs. | A desk composing the same illegal deal three times. They are reading the red as a bug. |
| CONSEQUENCE | "Advance the deals one at a time. Stop on the first waive." | "Whose money is that, and who is playing for it?" | Do not say "sunk cost." Not at 5–6, not at all. Say: *the money is gone either way — the only live question is the roster spot.* | The room's reaction to a named person on a bar with nobody in it. That reaction is the lesson landing. |
| REVEAL 1 | "One band at a time, bottom first." | "Which band would you rather be in?" | Do not answer it. | Anyone who says "the bottom one, because they have to spend." That is the floor landing and it is rare. |
| ADAPT | "Trigger the announcement. Wait. Then move the lines." | "What changed about your team?" (answer: nothing) "Then why did your rack change?" | — | Whether anyone reaches for "so somebody chose the rule." That is C16 arriving unprompted; if it comes, give it the room. |
| SYNTHESIS | "Now name them. The line that prices you. The line that takes your tools. The rule you triggered yourself." | 5–6: "What did July 1 cost you in February?" · 7–8: "Who else in the league was made better or worse off by the wall you built?" | — | — |

---

## L3 — **THE WINDOW**

*Option value and flexibility · win-now vs later · risk as the spread of the room · decision quality
versus outcome.* Concepts: C7, C14, C11, C12. C12 comes last, as the ordering constraint forces.

### 4.3.1 The signature mechanic — **THE THREE-YEAR BOARD**

It is the summer after. The screen is no longer a single sheet: it is **three year-columns —
2026-27, 2027-28, 2028-29** — carrying committed money by year, exactly as the carry stores it.
Dead money spans years. Rookie-scale deals end and the ending is drawn. The bottom of each column
is the money **not yet spoken for**.

**Four verbs, two rounds.**

1. **EXTEND** one of your own — locks a future year at today's price. Irreversible, stated before
   commit. At 7–8 the real commitment device is available: the Designated Veteran contract is the
   largest offer in the system **and the player may not be traded for one year after signing**
   (§2.8) — the biggest offer is also the one that removes the escape hatch.
2. **SIGN** from the shared pool.
3. **HOLD** — keep the room. Explicitly modelled, not a non-choice: room held in a year is
   convertible in round 2 **by the same arithmetic that validates an ordinary purchase**, so a desk
   that left room genuinely has more to act with. (The `adaptBudgetFor` shape, which PLATFORM_REALITY
   §5.1 #3 names as a true, non-obvious idea earned by the mechanic.)
4. **CASH THE PICK** — convert a future first into a player now. Houston did exactly this on
   2025-06-22, spending the whole stockpile on Kevin Durant after finishing as the West's No. 2 seed
   (§5.3), and the dossier's line is the lesson's: *an option is only worth something if you
   eventually exercise it.*

**Round 2 is where the module pays.** The opportunity set that lands is **composed of the players
the room itself was forced to give up** — every desk that crossed a line in L2 and had to shed
salary put a real, named contract on this market, and the card says so: *"available because
Sacramento had to get under $200,428,000."* Beneath that, a base pool of real dated signings so the
market is never empty (recoverability).

Only desks with room, a tool, or a pick can act. **A desk that held everything and finds nothing it
needs watches the option expire worthless** — which is required (C7, FL8), and is Chicago's real
$17,991,071 trade exception with an expiry date (§4.2).

### 4.3.2 The exact economic model

**Where the uncertainty comes from — stated as a design commitment.** This module contains **no
chance events**. No dice, no seeded roll, no hidden die. C11's variance is produced entirely by the
**intersection of a desk's own plan with what the rest of the room did**: the same free agent, the
same price, the same door, and two desks get different results because a third desk moved. This is
deterministic, replayable from a snapshot, and — critically — **always interpretable at debrief**,
because the cause is a decision somebody in the room made and can be named on the projector.

Consequences of that commitment, all of which I claim as strengths:
- Grades 5–6 need no probability, and the module needs no percentage (§8.2 #21 satisfied by
  construction, not by rounding).
- Rejection #9 (`Math.random` in a reducer) is unreachable.
- C12's requirement — *the model must permit good reasoning + bad outcome and weak reasoning + good
  outcome* — is satisfied and attributable: a desk that reasoned correctly about its own hole loses
  the player because two other desks needed the same role; a desk that reasoned badly gets him
  because nobody else did.
- CLAUDE.md §1's "uncertainty must become interpretable afterward, never a shrug" is not a promise
  the debrief has to keep — it is a property of the model.

**Formulas.**

```
open(year)       = LINE(year) − committed(year)            LINE = the announced cap for that year
roomToMove       = | { a ∈ round2Actions : legal(a, myState) } |    ← an ENUMERABLE count
rolesCovered     = set of roles with ≥1 contracted player next season
yearsOpen        = open(2028-29) as a dollar figure, drawn as the empty bottom of a column
rackHeld         = the six verbs still unstruck
```

`roomToMove` is the module's honest definition of flexibility, and it is why the UI may say *"you
kept your options open"* — because the options are literally enumerated and each one's price is
computable (FL8c).

**What must be tuned.** The size of the base round-2 pool, against one property: *there exists at
least one reachable state in which a desk that kept everything flexible is strictly worse off than
one that committed* (FL8b), and its mirror, *a pure hoarding strategy is strictly beaten by some
active strategy for a majority of seats* (FL6b). Both by sweep.

### 4.3.3 Real NBA facts L3 uses

| Fact | Where | As-of | Tier |
|---|---|---|---|
| OKC held five firsts and two swaps from July 2019 and cashed them in 2025; SGA won MVP and Finals MVP | §5.3 | 2019-07 → 2025-06-22 | official-nba / high |
| Houston spent the whole stockpile on Kevin Durant, 2025-06-22, after finishing as the West's No. 2 seed | §5.3 | 2025-06-22 | reporting / high |
| Brooklyn turned Mikal Bridges into five firsts, 2024-06-25 — for a player who was not an All-Star | §5.3 | 2024-06-25 | reporting / high |
| Chicago's $17,991,071 trade exception, which expires | §4.2 | 2026-09-03 | cap-database / medium |
| Boston's two supermaxes — Tatum 5 yrs/$314M (2024-07), Brown up to $304M — mathematically guarantee the apron problem twelve months later | §5.10 | 2024-07-01 | official-nba / high |
| SGA 4 yrs/$285M from 2027-28, plus Holmgren and Williams extended | §5.10 | 2025-07 | medium |
| The Designated Veteran cannot be traded for one year after signing | §2.8 | 2023 CBA | cba / high |
| Lakers/Davis 2019 → 2020 title **vs** Clippers/George 2019 → no Finals. Same summer, similar price | §5.7 | 2019-06/07 | high |
| Milwaukee/Holiday 2020 → 2021 title **vs** Milwaukee/Lillard 2023 → $21,311,053/yr through 2030-31. Same franchise, same category of bet, twice | §5.6, §5.7 | 2020-11-17 / 2023 | high / medium |
| Portland took Greg Oden No. 1 in 2007; he was the widely accepted pre-draft consensus | §5.6 | 2007-06-28 | high |
| Nico Harrison's quoted rationale for the Dončić trade, given verbatim and un-editorialised | §5.6, §8.1 #18 | 2025-02-01 | high |
| OKC won 2025 from the smallest market, then reportedly saved $224M while holding 13 future firsts | §5.8 | 2026 offseason | reporting / medium |

### 4.3.4 Phases

`LOBBY · HOOK · PLAY · REVEAL · CONSEQUENCE · COUNTERFACTUAL · ARGUE · SYNTHESIS · COMPLETE`
(0,1,2,3,4,6,7,8,9 ✔)

### 4.3.5 The four spectacle beats

| Beat | What happens |
|---|---|
| **SIGNATURE DECISION** | Commit the three-year board: what you lock, what you leave open. The panel beside it names, for each year, what locking it costs — and at 7–8 the extension carries *"and you may not trade him for a year."* |
| **CONSEQUENCE** | Round 2's market arrives, and every card on it says which desk's line-crossing produced it. Held room either buys something or **expires**, and expiry is drawn: the open bottom of the column closes with nothing in it. |
| **CLASS REVEAL** | **FOUR DEFINITIONS OF SUCCESS, SIMULTANEOUSLY.** See §7. |
| **INTELLECTUAL REVEAL** | **THE SAME DECISION, TWO OUTCOMES** — two desks, identical committed move, different states, cause named and it is another desk — followed immediately by Lakers/Davis against Clippers/George, and then Milwaukee twice. The room's own case first; the real cases as corroboration, never as the source. |

### 4.3.6 TIME CUT

**Round unit: `window`.** Two windows. `fallbackPolicy`: *"A desk that has not committed keeps its
board exactly as it stands. Nothing is locked and nothing is spent."*

`selfFallback`: *"If the window closes now, Brooklyn locks nothing. $19,400,000 of 2028-29 stays
open — and after the second window, open money buys nothing."*

Non-domination is the sharp case here, because holding is a *strategy* and the fallback is holding.
It is answered by the model, not by a warning: unspent room in the final window converts to nothing;
the floor binds; and FL8b's sweep must find a reachable state where the fully-flexible desk is
strictly worse off.

### 4.3.7 COUNTERFACTUAL and ARGUE, by band

- **5–6, COUNTERFACTUAL:** the product **runs and displays** it. *"Here is your 2028-29 if you had
  not extended."* Both boards, side by side, computed. The student notices and reacts. (Rule 8;
  Rafetseder & Perner — mature counterfactual reasoning is not reliable in all children before ~12.)
- **7–8, COUNTERFACTUAL:** the product **withholds** it. The prompt is *"what would have had to be
  true for the other choice to be right?"* The pair commits an answer; only then is the alternate
  board revealed.
- **5–6, ARGUE:** two moves. *"I chose X because Y, and here is the class evidence"* — where "the
  class evidence" is a specific board the pair points at, and "Y" may be read off their own frozen
  foregone list from L1.
- **7–8, ARGUE:** three moves. The same, **plus** the strongest case against their own decision and
  why their evidence still beats it. Structured as an assigned-side exchange on the dossier's best
  paired case: Indiana and Milwaukee on Myles Turner, one player, one week, July 2025, opposite
  decisions — where Indiana's change of mind was *rational once its star was injured*, not cheap
  (§5.8).

### 4.3.8 Projector, beat by beat

LOBBY: THREE YEARS, empty · HOOK: Boston's two numbers — $314,000,000 and up to $304,000,000 — and
the second-apron line, with no commentary, and the question *"what happens to this team in twelve
months?"* (§5.10's own prescription: let them find the squeeze before being told) · PLAY: the pool,
no comparative money · CONSEQUENCE: THE MARKET THE ROOM MADE, each card with the desk-caused reason ·
REVEAL: the four boards, one at a time · COUNTERFACTUAL: one desk's two boards side by side ·
ARGUE: the two assigned sides and the July 2025 dates · SYNTHESIS: the chain in §9.

### 4.3.9 `/teach` director

| Beat | NOW | ASK | DON'T EXPLAIN YET | WATCH FOR |
|---|---|---|---|---|
| HOOK | "Put Boston's two numbers up. Say nothing else for ten seconds." | "What happens to this team in a year?" | Do not say "apron." Do not say the answer. They can get there from two numbers and a line. | The first table that adds the two numbers. Let them say it. |
| PLAY w1 | "Walk. Ask what each open year is *for*." | "What are you saving it for?" | Do not say "option value." | A desk holding everything with no answer to that question. That is FL8 in the room and it is the best teachable moment in the lesson. |
| CONSEQUENCE | "Read out three cards and say who caused each one." | "Why is he available?" | — | Whether the room notices the causes are all *them*. |
| REVEAL | "Four boards. Do not put them up together — one, then the next, and let them argue between." | "Which of these four is the real one?" | Do not answer. 7–8 may leave disagreeing, but only with evidence on the table. 5–6 must land on one mechanism before you move. | Any student defending a board they are *not* top of. That is the strongest thing that can happen in this module. |
| COUNTERFACTUAL | 5–6: "Show them their other team." · 7–8: "Make them write the answer before you show anything." | "What would have had to be true?" | — | — |
| ARGUE | "Assign sides. Indiana and Milwaukee, July 2025." | "Was Indiana cheap, or was Indiana right?" | Do not say which. The answer is that one injury changed the value of an entire payroll decision. | 7–8's multiplist failure: *"everyone has their own opinion."* Refuse it. Ask for the evidence. |
| SYNTHESIS | "Now separate them. *A good decision can end badly. A bad decision can end well.* Point at your own board while you say it." | — | — | — |

---

## 5. THE CARRY

### 5.1 What moves, in what shape

One flat, bounded record per desk. No log, no history, no derived total, no claim.

```ts
type FranchiseCarry = {
  v: 1;
  band: "5-6" | "7-8";                 // present so a cross-band seed can be REFUSED
  club: ClubId;                        // real club — the identity that makes the carry mine
  books: { [leagueYear: string]: number };      // committed salary by year, ≥3 future years
  dead: { name: string; perYear: number; lastYear: string }[];   // by year AND by name
  lost: { what: string; because: string }[];    // renounced rights, spent picks, players
                                                // permanently taken by another desk
  tools: {
    ntmle: boolean; taxMle: boolean; roomMle: boolean; bae: boolean;
    hardCapAt: number | null;
    hardCapBecause: string | null;              // "the mid-level, July 1"
  };
  slots: number;                       // roster spots used — the second binding constraint
};
```

Six fields, exactly the six the contract's §7 names, each because it changes a **reachable option
set** and not a display. Estimated size: ~450 bytes per desk, ~7KB for a sixteen-desk room — which
matters, because every session read deep-clones the whole state through JSON and every write
re-serialises the store (PLATFORM_REALITY M6, M7).

### 5.2 The falsifiable property — a named L1 decision, a named reachable L3 state

> **P1.** In **L1**, the **Detroit** desk fills its centre hole with the **non-taxpayer mid-level
> exception, $15,044,000**. Under the real rule (§2.3, §2.4) that sets
> `hardCapAt = 209,015,000, hardCapBecause = "the mid-level, July 1"` for the remainder of the
> league year — a line Detroit may not cross under any circumstance.
>
> In **L3**, round 2's market carries a **$24,000,000** contract shed by a desk that had to get
> under a line. Detroit's committed 2027-28 books plus $24,000,000 exceed $209,015,000, so the
> `sign` action is **refused**, and the refusal names the July decision:
> *"You used the mid-level on July 1. Your ceiling is $209,015,000; this would put you at
> $214,600,000."*
>
> A Detroit desk that filled the identical hole with **two minimum contracts** reaches the identical
> L3 moment, with the identical money, and the move is **applied**.
>
> **Test:** replay the reducer over both branches and assert `ok:false` under H1 with a reason
> string containing the L1 decision, and `ok:true` under H2. **If no such (A, H1, H2) triple exists,
> the persistence is narration.**

### 5.3 The three companion properties

- **P2 — no sludge.** Every field has a named reachable L3 difference on the basis of that field
  alone. `books` → affordability; `dead` → a blocked year and an occupied slot; `lost` → a player
  literally absent from the rights list; `tools` → P1; `slots` → the 15-man limit refusing a
  signing; `club` → the counterparty set and the incumbency in the pool. A field that fails this is
  **deleted from the seed**, not documented.
- **P3 — recoverability across the carry.** For every reachable seeded L2 and L3 opening —
  *including every reachable dead-money position and the honestly-labelled stock franchise* — at
  least one legal action satisfies that lesson's stated obligation. Brute-forced over the whole
  reachable carry space. Memphis's $3,926,207-of-room-against-$21,909,021-of-dead-money is a real
  position and is a named test case.
- **P4 — attribution, per band.** At 5–6 the causal sentence at the next lesson's opening is
  **computed from the carried field** (`hardCapBecause`, `lost[].because`), never authored per
  scenario. At 7–8 it is silent — and therefore the *information* needed to diagnose it must be
  present on the 7–8 surface (the struck rack item carries its line and its date), or "silent" has
  become "hidden."

### 5.4 What deliberately does NOT carry, and why

| Not carried | Why |
|---|---|
| Every action taken | The runtime already owns the class log and the WHILE-YOU-WERE-AWAY fold-in. A seed that is a transcript is a transcript. |
| Per-round intermediates, previews, reveal beats, UI state | Not economics. Pure sludge, and it grows the clone-and-serialise cost every read. |
| Any total, room figure, or distance-to-a-line | D15's frozen-fact discipline, stated precisely: **carry the facts, freeze the claims within a lesson, never carry a claim across lessons.** A carried claim has no reducer behind it in the receiving lesson and will eventually contradict that lesson's own arithmetic. |
| Any other desk's data, in any form | `studentView` must never leak another seat, before or after any reveal, and a carried blob is the easiest place for that to happen unnoticed. |
| Outcome labels, strategy classifications, awards, "how last lesson went" | A carried judgment is a progression system (D4). There is no `classifyStrategy` in this design at any point. |
| Anything the module cannot honestly stand in for | The practical test: if the module cannot ship an honestly-labelled **stock** value for a field, that field is not carryable — because an absent student gets a stock franchise, not a broken one, and a stock franchise is never disguised as a carried one (D18). |

**One failure this chain must not repeat:** the discarded module silently deleted the franchise of
any team that was shocked and did not repair (PLATFORM_REALITY M11). **No reachable carry may blank,
delete, or replace a pair's franchise identity.** `club` is validated first and, if anything else in
the envelope is malformed, the desk gets *its own club* with an honestly-labelled stock book —
never somebody else's club and never nothing.

### 5.5 The runtime change this requires

The seed envelope is exactly `{lessonModuleId, state}` (`sessionService.ts:320`). A 7–8 room seeded
from a 5–6 room's L1 therefore sees a well-formed seed from the right module id, accepts it, and
carries 5–6 franchise depth into a 7–8 lesson **with nothing in the runtime able to notice**. That
is an attribution failure — a 7–8 L2 would attribute to the pair a hard cap they were never given
the chance to create.

**Required:** amend D38 to name a **third** attachment point, and widen the envelope to
`{lessonModuleId, gradeBand, sourceSessionId, sourcePhase, sourceEnded, state}`. The `band` field
inside the carry is belt-and-braces; the envelope field is what lets the module refuse honestly and
what lets D39's live-source warning become a module-side guard rather than a `/teach` UI courtesy.

---

## 6. THE TWO BANDS

### 6.1 What is identical, because the economics is the economics

1. **The world.** Same twelve clubs, same five 2026-27 thresholds, same cases, same dates, same real
   dollars. A 5–6 room that sees a rounded fake cap has been given a different world, not a simpler
   one.
2. **The mechanism.** **One reducer per lesson.** Given the same actions from the same state, the two
   bands resolve identically. The grade profile is read only by `initialState` (content selection),
   by the view functions (what is *shown* and what is *asked*), and by the director script. It is
   never read inside a settlement branch. This is assertable: a test that replays an identical
   action sequence under both profiles and requires byte-identical settled books.
3. **Which concepts are true.** Opportunity cost is opportunity cost. The cap is soft in both rooms.
   Dead money persists in both rooms. **Every false-lesson guard in the contract's §4 binds in both
   rooms, and no band is exempted from any of them.**
4. **Decision quality ≠ outcome.** Both bands, always. Only *who does the separating* differs.
5. **Irreversibility and recoverability.** Both bands, both properties.
6. **Attribution.** Both bands can name the choice that produced today's state.
7. **The real numbers.** What changes is the **arithmetic the student must perform**, never the
   world.

### 6.2 What the grade profile selects

| Dimension | 5–6 | 7–8 |
|---|---|---|
| **L1 doors** | 4 (room · your own guy · mid-level · minimum). Term is fixed by the door. | 6 (adds the small mid-level and sign-and-trade). **The pair chooses the term** within the door's ceiling — which makes the door a *bid*, not just a price. |
| **L1 market** | 4 free agents | 8 free agents plus a second tier of real contract structure on each card that rewards domain knowledge with **richness only, never accuracy** |
| **L1 decision variables** | ≤2 per choice: role and price. Strength/risk is one plain line, not a variable. | 3–4 as a scannable table, plus one deliberately non-causal column the debrief exposes |
| **L2 lines carried** | **2**, of two different kinds: $164,961,000 (you need a door) and $209,015,000 (four things are taken). Neither behaves like the other. | **4**: adds the tax as a *price paid in tools* ($15,044,000 → $6,064,000) and the second apron as a prohibition. The floor is printed for both and binds where it is real. |
| **L2 rack** | 4 items | 6 items, plus **≥1 compound move** where step 2's legality depends on step 1 (waive-then-sign; renounce-then-trade) |
| **L2 counterparties** | 1 visible at a time | 3 simultaneously, with conflicting objectives |
| **L2 carry surfacing** | **Plain language, computed from the carried field** at the lesson's opening (Rule 14, P4) | **Silent.** The pair diagnoses it. The struck rack item carries the line and the date; nothing says "because you." |
| **L3 columns** | 2 years | 3 years |
| **L3 commitment device** | absent | the Designated Veteran: the biggest offer in the system is also the one that removes the escape hatch (§2.8) |
| **Counterfactual** | the product **runs and displays** it | the product **withholds** it until an answer is committed |
| **Argument** | two moves (W.5.1, *opinion*) | three moves (W.6.1 *argument*, W.7.1a acknowledge, W.8.1a distinguish) |
| **Debrief scope** | "What did **your** choice cost **your** team?" — personal | "Who else in the league was made better or worse off, and would the same choice be right for a different team?" — societal |
| **Debrief resolution** | **must converge** on one nameable mechanism. No "both teams were right." | may end in **defensible disagreement adjudicated by evidence** — never at "everyone has their opinion" |
| **Vocabulary** | ≤2 new terms per lesson, named **only after** the phenomenon: L1 *scarcity*, *opportunity cost* · L2 *incentive*, *commitment* · L3 *flexibility*, *decision quality* | 3–4 terms, may include grade-8 CEE terms: *marginal cost*, *substitute*, *relative price*, *predictable incentive response* |
| **Marginal reasoning (C15)** | **absent.** No ratios, no per-unit figures, no "dollars per win." | present, on the §8.1-safe object: the mid-level ladder **$15,044,000 → $9,366,000 → $6,064,000 → nothing.** Your tool shrinks as you spend more, with no tax bill required. |
| **Text budget** | blocking instruction ≤40 words; cards ≤15 words + numbers | blocking instruction ≤70 words; cards may carry a ~20-word note |

### 6.3 The one asymmetry that is not a depth setting — the front half of the loop

Sinha & Kapur: problem-solving-before-instruction is **g = +0.50 at grades 6–10** and **g = −0.09 at
grades 2–5**, and the moderator splits at exactly this product's band boundary. The 5–6 band
*contains grade 5*. Therefore:

**7–8 faces the constraint cold** for the first round of every lesson, generates its own approaches,
and gets the teacher-led contrast only at consolidation.

**5–6 gets a scaffolded exploration phase. Concretely, this is what the scaffold is:**

1. **WORKED DAY ZERO** — before PLAY opens, on the projector, with a thirteenth club nobody is
   playing (Utah). The teacher runs **one complete signing**: pick the hole, pick the player, pick
   the door, **read the foregone panel aloud**, press LOCK, watch the receipt freeze. The `/teach`
   director scripts it line by line and it is part of the REHEARSAL walk, so a teacher can practise
   it cold with zero desks (D40).
2. **A different card in kind, not the same card with new numbers.** Day 1 for the class is not Day
   Zero restated. Utah's Day Zero is an *under-cap room* decision; Day 1 for most desks is an
   *over-cap door* decision. If round 2 is round 1 with new numbers, the room copied a demonstration
   and only the consolidation happened (Family 4's "wait for the teacher" exploit).
3. **The constraint state never scrolls away** — the sheet, the two lines and the room figure are in
   a fixed header region.
4. **An in-product trade-off prompt per day**, computed from the desk's own needs and books, ≤14
   words: *"You can cover the centre or keep next summer open. Not both."*
5. **Each door carries a computed "if you use this" line** naming the single thing it costs, ≤12
   words.
6. **A mandatory teacher-led contrast at CONSEQUENCE**, scripted, comparing the room's approaches to
   the canonical one.
7. **One honest note to the teacher, in the director panel:** exploration-first costs immediate
   performance and buys transfer. A flat quiz right afterwards is not failure.

---

## 7. THE CLASS REVEAL

**No single winner. No universal franchise score. No trophy. No rank number anywhere.**

Four boards, computed, put up **one at a time** so the room argues between them, then held together
on one frame.

| Board | What it measures | How it is drawn | Why it cannot be summed with the others |
|---|---|---|---|
| **ON THE FLOOR** | roles covered for next season | filled and empty slot glyphs, per desk | it is a **set**, not a number |
| **YEARS OPEN** | money not yet spoken for in the last carried year | the empty bottom of a year column | dollars in a *future* year |
| **THE RACK** | which of the six verbs a desk still holds | six ticks and strikes | a list of *permissions* |
| **ROOM TO MOVE** | how many of the next opportunity set's actions this desk could legally take | a count, with the actions enumerable on demand | a count of **legal actions** — the only honest definition of flexibility, and the reason the product is allowed to say "you kept your options open" |

Then one panel, and it is the point of the whole reveal:

> **THE DESK THAT TOPS TWO.** One desk that is at the top of two of the four boards — and, beside it,
> where that same desk sits on the other two. In every sweep I have reasoned about, a desk at the top
> of ON THE FLOOR is near the bottom of ROOM TO MOVE, and vice versa. The panel does not say which is
> better. It says: **these two desks disagree about what winning is, and both of them are playing
> correctly.**

And one more, taken from the founder's mockup B, which is the best idea in the three mockups:

> **HOW DESKS PLAYED IT** — desks clustered by the *strategy they actually pursued* (which door
> family, how many years, whether they kept a tool), each cluster named from the pair's own actions,
> with a count of desks and the four boards' outcomes per cluster. **Compare strategies, not
> people.** No desk is ranked against another desk anywhere in this module.

**Structural guarantees.** No board ranks desks by payroll. No single scalar "team quality" exists in
the model, the payload, or any renderer. No comparative money is on the projector while any decision
is open. No award, no "champion", no confetti, no trophy, no XP, no level (D4, and VISUAL_TARGET's
three hard prohibitions). At 5–6 the teacher must land the room on **one nameable mechanism** before
moving on; at 7–8 the room may leave disagreeing, but only with evidence on the table.

---

## 8. THE FINAL DEFENSE

L3's ARGUE phase is where the module cashes everything. Both structures use the room's own boards as
evidence, and neither is graded against a historical move.

### Grades 5–6 — TWO MOVES, and the product does the separating

1. **"I was playing for ___."** The pair picks **one of the four boards** as the thing they were
   trying to be good at, and says why, out loud, to the room. This is not a quiz — the boards are
   already on the wall and the pair's own position on each is already visible.
2. **"and here is the class evidence."** They point at a specific figure on a specific board. The
   product supplies the evidence; the pair supplies the claim. (W.5.1 — *opinion pieces supporting a
   point of view with reasons*.)

**The product does the decision-quality separating for them** (Rule 11): before ARGUE, the projector
puts up the class distribution of outcomes for the **same** committed move — the desks that all
extended, or all held — showing plainly that identical choices produced different results. **The
teacher then says the sentence for them:** *"Same call. Different endings. That means you cannot
judge the call by the ending."* At 5–6 the debrief converges here, on one mechanism, and does not
end at "both were right."

### Grades 7–8 — THREE MOVES, assigned sides, adjudicated by evidence

1. **The claim,** with evidence from the boards.
2. **The strongest case against their own decision** — stated by them, not by an opponent.
3. **Why their evidence still beats it.** (W.6.1 / W.7.1a / W.8.1a; C3 D3.4.6-8 counterclaims.)

Then the assigned-side exchange, on the dossier's best paired case, with the sides drawn and the
dates on the wall: **Indiana and Milwaukee on Myles Turner, one player, one week, July 2025.**
Indiana's ownership was reported fully prepared to enter the tax for the first time since 2005-06;
after Tyrese Haliburton's Game 7 Achilles tear, Indiana never offered more than about $23,000,000 a
year, and Turner signed 4 years / $107,000,000 with Milwaukee, which created the room by waiving and
stretching Damian Lillard's $113,000,000. The proposition is *"Indiana was cheap"* against *"Indiana
was right"* — and the answer the evidence supports is that **one injury changed the value of an
entire payroll decision**, which is neither.

The teacher's closing move at 7–8 is to **refuse the multiplist ending.** "Everyone has their own
opinion" is the named failure mode of exactly this age (Kuhn, Cheney & Weinstock). The room may end
disagreeing; it may not end without evidence.

**No score, award, bonus or reveal language anywhere in this module rewards matching the historical
move** — grep-assertable, and the assertion ships.

---

## 9. THE SYNTHESIS CHAIN

Every row: experienced moment → the room's own evidence → a dated real NBA case → the formal term →
the generalization outside sports. Every figure in every synthesis line is computed from session
state or is a dated dossier fact; nothing is a bare template literal (PLATFORM_REALITY §9.4).

| Concept | Experienced moment | Class evidence (from this room) | Real NBA, dated | Formal term | Beyond sports |
|---|---|---|---|---|---|
| **Scarcity** | You could not take a legal action you wanted, on July 1, and the reason was money already spoken for by somebody who had the job before you | The count of desks whose first-choice action was refused, and the four distinct reasons | Denver, weeks after winning the 2023 title, could offer Bruce Brown only about $7,700,000 and lost him to Indiana at a reported 2 yrs / ~$45M (§5.1, July 2023) | **scarcity** | Winning does not make the constraint go away. Your school's budget does not grow because you won the game. |
| **Opportunity cost** | The FOREGONE panel froze into a receipt naming what you no longer have | THE SAME PLAYER, THREE COSTS — three desks' frozen lists, same player, same price | Renouncing a free agent **permanently destroys** Bird rights to your own player, so using cap room means giving up the one player only you could have kept (§2.5, 2023 CBA) | **opportunity cost** | The cost of a choice is the best thing you gave up, not the money you handed over. |
| **Constrained allocation** | Two constraints bound at once — the money ran out for one plan, the roster spots ran out for the other | THE DOORS OF THE ROOM: five doors, five different shapes of cost | Philadelphia carries about $156,000,000 of a $164,961,000 cap in three players (§4.5); Chicago has the flattest payroll in the league, no tax, and no direction (§4.2) | **allocation under constraint** | Two different plans run out of two different things. Which one binds depends on the plan. |
| **The cap as an institution** | Five lines, and not one of them behaved like another | THE LADDER: five bands, each with the verbs it takes away | The cap is soft — 22 of 30 teams were operating **above** it under hard caps as of 2026-07-10 (§2.3). And below it, the **floor** at $148,465,000 makes underspending illegal (§2.1) | **institution** (a rule people chose, that could have been otherwise) | Rules are not walls. Some charge you, some forbid you, some make you do something. |
| **The apron / tool confiscation** | An item on your rack was struck through, and the strike named your own July decision | THE RACK OF THE ROOM: how many desks still hold each of the six verbs | Phoenix above the second apron in 2024-25 could not combine two players to match an incoming salary, could not use any mid-level, could not shop the buyout market — and its 2032 first-round pick was frozen (§5.4, reporting) | **constraint you create yourself** | Some choices do not cost money. They cost you the right to make other choices later. |
| **Commitment / path dependence** | February opened with something already crossed off | The count of desks that arrived at L2 hard-capped, and the one thing each may no longer do | Boston's two supermaxes — Tatum 5 yrs/$314,000,000 (2024-07-01) and Brown up to $304,000,000 — **mathematically guaranteed** the apron problem twelve months later; the 2024 champion took itself apart, saving ~$4,700,000 of salary to save ~$35,000,000 of tax (§5.4, §5.10) | **commitment** | A promise you make today is a door you close tomorrow, and sometimes that is exactly why you make it. |
| **Dead money** | A bar appeared on your sheet with a person's name on it and nobody in it | The number of desks carrying a named charge, and how many years each runs | Milwaukee pays **$21,311,053 a year to Damian Lillard, who plays for another team, through 2030-31** — its third-largest cap charge (§8.1 #21). New York's Joakim Noah: $19,300,000 became $6,400,000 × 3 (2018-10-13) — the total does not shrink, it spreads | 5–6: **"the money is gone either way"** · 7–8: **sunk cost** (flagged above grade — CEE places it at grade 12) | Money already spent should not decide what you do next. What you do next is about what you have left. |
| **Option value / flexibility** | The room you kept bought something in the second window — or expired with nothing in it | ROOM TO MOVE: the enumerable count of legal actions per desk, and the desks whose count was zero | Oklahoma City held five firsts and two swaps from July 2019 and cashed them into the 2025 championship. Houston spent its entire stockpile on Kevin Durant on 2025-06-22 — *an option is only worth something if you eventually exercise it* (§5.3) | **flexibility / option value** | Keeping your choices open has a price, and saving forever is not a plan. |
| **Win-now vs later** | You locked a future year at today's price, or you did not | The two clusters in HOW DESKS PLAYED IT and the four boards' outcomes per cluster | Oklahoma City extended Shai Gilgeous-Alexander at 4 yrs / $285,000,000 from 2027-28, plus Holmgren and Williams — the reward for building well is a bill you have not paid yet (§5.10) | **intertemporal choice** | Now and later are both real. Choosing now is not greed and choosing later is not virtue. |
| **Market size** | Your club had a different starting sheet from the desk beside you, and you did not pick it | THE LEAGUE: twelve real payrolls, unranked, and the identical national check above them | Every team receives the same **$143,000,000** national television check (up from $103M), while 2024-25 team revenues ran **$833M (Golden State) to $301M (Memphis)**. New York, the largest market, is $9,397,232 over the first apron; Oklahoma City, the smallest, is hard-capped at the second with $2,820,601 of room — same trap, opposite market (§8.1 #13, #15; §4.1, §4.2) | **inherited unequal starting position** | Where you start is not the same as how well you play, and it is not nothing either. |
| **Substitutes** | The player you could not have had a replacement, and it was not the cheap version of him | THE CONTESTED BOARD: what the losing desks did instead | Rookie scale is a fixed price ladder by draft slot — No. 1 $14,748,000 against No. 30 $2,926,800, about 5×, set by slot and not by negotiation. San Antonio pays Victor Wembanyama $16,868,013 while De'Aaron Fox earns $49,488,300 (§8.1 #9; §4.1 #10) | 5–6: experienced only · 7–8: **substitute**, **relative price** | Price is not value. What something costs and what it is worth to *you* are two different questions. |
| **Decision quality vs outcome** | Two desks made the same call and ended in different places | THE SAME DECISION, TWO OUTCOMES — the room's own pair, with the cause named | Lakers/Davis, June 2019 → the 2020 title. Clippers/George, July 2019 → no Finals. Same summer, similar price. And Milwaukee twice: Holiday 2020 → the 2021 title; Lillard 2023 → $21,311,053 a year through 2030-31 (§5.6, §5.7) | **decision quality is not outcome quality** | Judge the thinking, not the ending. You will be judged on endings anyway, and you should push back. |
| **The constraint is a variable** | The lines moved and your books did not | THE WALL MOVED: the room's own dots re-placed against next year's lines | The cap rose ~34% in 2016-17 with no growth limit, exactly 10.0% in 2025-26 at the CBA ceiling, and 6.7% in 2026-27 under it. The 2026-27 figure came in about $1,000,000 below the league's own projection because local media revenue fell in thirteen cities (§8.1 #5; §3.3, reporting) | **the rule is chosen** | Somebody wrote the rule, somebody can rewrite it, and it changes because of things happening somewhere you are not looking. |

---

## 10. THE VISUAL WORLD

**The place.** Not an arena. **The cap room, at eleven at night on July 1** — a small, dark, expensive
room with one wall of numbers in it. The register is the Cap Room register the design system already
names: near-black ground, a single brand accent, evidence-tier type. Everything in the world is
**typographic and drawn**; there are no photographs, no logos, no marks, no arena imagery and no
player likenesses anywhere in the module (§8.2 #22, and the server serves no image MIME type at all —
PLATFORM_REALITY B4). Real clubs appear as **typographic wordmarks**, which is a constraint that makes
the product look more like a Bloomberg terminal and less like a video game, and that is correct.

**The one hero object per surface.**

- **`/play` — THE SHEET.** A single column of horizontal bars, one per contract, with the ladder
  lines ruled across it. It is the only thing on the screen that is allowed to be big. Dead money is
  drawn in **the same units and the same width scale** as live players, because it is the same money
  — that identity is the entire sunk-cost image and D25 makes it measurable: bar width is a linear
  function of dollars with a stated tolerance, measured in a browser, with the instrument poisoned
  before any pass is believed.
- **`/teach` — THE ROOM plus THE DESKS.** The founder's mockup A is right about density on this
  surface: the console is a monitor wall. THE ROOM bins this lesson's own dial — L1 the door chosen,
  L2 the band the desk sits in, L3 the number of years locked — with the module's own heading,
  spread sentence and movement sentence, and movement claimed **only against a number the desk chose
  itself** (D30). INTERESTING CONTRASTS from the mockup becomes a real panel: two desks, one axis,
  side by side. AT TIME CUT is the enumerated pre-close checklist the runtime already computes.
- **`/board` — THE LADDER.** Full-bleed, five horizontal rules, desks as unlabelled dots in bands,
  type at evidence tier and no smaller. The headline number is enormous and lands before anything
  populates. The frame must fit 1366×768 **and** 1920×1080 with no scroll, because a projector
  cannot scroll.

**What earns motion.** Three things, and nothing else:
1. **A bar growing** when money is committed — the only place a number becomes a size in real time.
2. **A rack item being struck through** — a single stroke, 240ms, once.
3. **A name going dark in the shared market** — the strike, on a teacher-advanced beat, one at a
   time, so the room can react to each.

Everything else is still. All motion is CSS keyframes and collapses under `prefers-reduced-motion`.
Colour is never the only carrier of meaning; every status carries a word.

**What the mockups offered that this design takes:** the franchise identity band (the strongest
single element, and here it carries a *real* club, a real payroll and a real dated fact); constraint
state living in a persistent header as several distinct resources rather than one bar; "potential
impact" chips reframed as the computed **"if you use this"** line on each door; HOW DESKS PLAYED IT
as the class-evidence shape; the grade band as a visible first-class property of the room on both
student and teacher surfaces.

**What it refuses:** Team OVR, Fan Trust, Franchise Value, the ten-year outlook, XP, levels,
"Rookie Manager", CLASS CHAMPION, the trophy, the ranked leaderboard, the four abstract decision
cards, the fake "6 Days Left", and the invented franchise. All of them.

---

## 11. TECHNICAL COST

Honest, and deliberately not optimistic. M2's three lessons are 5,257 / 5,393 / 4,589 LOC and almost
all of the delta over M1's 1,141 / 1,357 / 1,738 is instrumentation, which this design pays on day
one rather than day sixty.

**New module files — three.**

| File | Est. LOC | Why it is that size |
|---|---|---|
| `modules/julyOne.ts` (L1) | ~3,400 | 12 club sheets, 8 market cards, 5 door predicates, day resolution, foregone generation, `round`, `onPhaseExit`, `classEvents`, `roomRead`, `deskStripOf`, `watchFor`, rehearsal deck, claim atoms, per-beat gating |
| `modules/theDeadline.ts` (L2) | ~3,600 | seed reader with per-team validation and stock fallback, five-line ladder, six-item rack, three counterparty objectives, waive/stretch, the cap-move beat, plus all of the above |
| `modules/theWindow.ts` (L3) | ~3,200 | three-year board, two-window loop, the room-composed round-2 market, four reveal boards, counterfactual by band, ARGUE staging, plus all of the above |

**New shared machinery — two files, both justified as *audit contracts*, not as the economics engine
CLAUDE.md §12 protects.**

- `modules/nba2627.ts` — frozen, dated constants with provenance comments: the five thresholds, the
  three mid-levels, the max tiers, the minimums, the roster limits. No behaviour, no reducer, no
  shared state shape. This is a source-of-truth for printed facts, and having three modules
  independently retype `164961000` is how a projector gets a wrong number.
- `shared/claims.ts` — `ClaimAtom`, `claim`, `claimWord`, `ClaimSurface`. This is the second-use
  extraction M2 skipped and drifted on (`writeTheRule.ts:816` lost its `board` field, making D24's
  surface split structurally unavailable in that lesson). Extract it **now**, before the first M1
  claim is written.

**New client renderers — nine surfaces.** Three lessons × three surfaces, hand-written, no framework,
plain browser ES modules with explicit `.js` extensions. Plus, per lesson: a branch in
`play/main.ts`'s id chain; a branch in `board/main.ts`; **three** places in `teach/main.ts`
(`renderAggregate`, the lesson-control id constants and their ~280 lines of hidden/disabled/label
logic, and `rehearseNoteFor`); new markup in `teach/index.html`; a new `advanceWarnState` arm; a new
`confirmSkippingContent` branch. Every module-level `let` render cache registered in
`resetSeatRenderState()`.

**CSS.** A third scope, `html[data-module="m1"]`, consuming the m2 token layer as classes rather than
inline styles (M17 is explicit that M2's ~1000 interpolated `style=""` strings must not be copied).
Joining the existing m2 scope would require re-providing every legacy rule for three lessons; a third
scope is cheaper and the allowlist assertion at `clientSurfaceInvariants.test.ts:53` widens by one.

**Runtime changes actually required — four, and only the first is a design dependency.**

1. **Seed envelope provenance** (§5.5): `{lessonModuleId, gradeBand, sourceSessionId, sourcePhase,
   sourceEnded, state}`, plus `gradeBand` on `createSession` input, the session row, and the
   `initialState` context, plus the band on `TeacherPayload.session` so the link picker can warn on a
   cross-band link. **Amend D38 to name three attachment points, not two.** Without this a cross-band
   seed is silently accepted, which the economic contract rejects outright (#20).
2. **Fix the three false comments in `lessonModule.ts`** (B1, B1b) in the first commit — they are the
   doc the next module author reads first, and they promise a phase gate and client-independence that
   do not exist.
3. **Fix `advance`'s silent rewind** (M2): `indexOf` returning −1 sends the room to LOBBY presented as
   forward progress, with a checkpoint captured over the good state. A three-lesson chain with three
   new phase lists makes this reachable on any restart against an old snapshot.
4. **Parameterize the eight `m2l1-full-house`-hardcoded browser harnesses by `--lesson`** (M25). This
   is not optional for a three-lesson module and it is the single highest-leverage infrastructure
   investment available.

**Evidence set owed per lesson** (PLATFORM_REALITY §7.3): unit + property tests in `npm test`; a
per-beat payload-gating test looping every beat; the module added by hand to
`roundLifecycle.test.ts:368`; a rehearsal test asserting deck-length and title equality; a
synthesis-traceability test; a tuning harness under `docs/gauntlet/module-1/stage0/` printing
`VERDICT: ALL n PROPERTIES HOLD` **with mutants**, wrapped via the `m2Harnesses.test.ts:28-49`
pattern; a browser e2e with the board fitting both projector shapes and at least one poison frame;
`concurrency-harness.cjs --lesson <id>` at 16 desks; a measured-drawing instrument for the sheet.
Plus: prune the 20 dead M1 entries from `clientClaims.allow.json` **in the same commit** that deletes
the old renderers, or the first red suite of the rebuild is for an unrelated reason and the team
learns to read red as noise.

### The riskiest technical unknown

**The desk registry against `seatIds: []`, multiplied by twelve heterogeneous real franchises.**

`initialState` runs exactly once with an empty seat list; `join()` never enters the module and never
bumps the session version; `closeRound` and every teacher hook reduce with `seatIds: []` while
`round.unresolved` *is* handed the real roster. So the runtime will tell the teacher who is about to
receive a fallback and then close the round without telling the module those seats exist (M4). This
design's whole premise — *every pair runs a different real club, with a different sheet and a
different hole* — sits directly on top of that hole.

The plan: a module-owned `deskOrder` + `desks` registry, populated on a `takeSeat` action against a
`seated:false` view, with clubs **pre-assigned deterministically by join order** so a pair claims into
a slot that already exists rather than allocating one. Every close path intersects with
`new Set(seatIds)` where the roster is available and falls back to `deskOrder` where it is not.
**"The pair that joined and never touched anything" is a named test case on `/board`, in `aggregate`,
in `round.unresolved`, at `closeRound`, and in `classEvents`.** If this is got wrong, the teacher
panel and the settlement will disagree in front of the class, which is the worst class of defect this
product can ship.

**Second unknown, quantified:** state size. Twelve desks × ~14 real contracts × three years, plus dead
money and rack state, deep-cloned through JSON on every read and re-serialised on every write, with a
second full copy in the checkpoint and nothing ever pruned. Mitigation is decided at design time, not
after: **club rosters live in a module-scope constant table and state carries only deltas** (signings,
waives, renunciations, tool flags). Run `latency-harness.cjs` and `e2e-full-room.cjs` at 32 seats
against L1 in the first week, not the last.

---

## 12. HOW THIS DIES

### Argument 1 — "It is paperwork. A ten-year-old does not feel a mid-level exception."

This is the strongest argument against the design and I will not pretend otherwise. The verb of the
loop is *choosing a legal instrument*, and the failure mode is a room of children doing compliance.
If the Player critic plays the Stage-0 and feels like an accountant, the design is wrong.

**My answer.** The instrument is the verb; it is not the stake. The stake is a named person who will
be gone forever in ninety seconds, and the thing the pair spends is something they can point at on
their own sheet. The three beats that carry the lesson are all *concrete*: a panel freezing into a
receipt, a name going dark, a verb being crossed out. None of them requires the phrase "mid-level
exception" to land — a fifth grader experiences "the big door" and "the small door" and "the door
that costs you your own guy."

**And the falsifiable version of my answer:** if the Stage-0's five doors read as bureaucracy, the
5–6 profile drops to **three** doors (room / your own guy / minimum), the mid-level becomes a
teacher-side object in L1 and only becomes a student verb in L2, and the contested name moves to the
visual centre of `/play` instead of the sheet. That is a real retreat and it costs C15's 7–8
extension nothing.

### Argument 2 — "Five real cap lines, six tools, three years of books and a shared market is too much for fifty-five minutes at grade five."

Also strong. Kuhn, Pease & Wirkala found only about a third of sixth graders can consistently
implicate three simultaneous causal variables even with the causal structure displayed. This design
puts money, roster slots, years and rivals on one screen.

**My answer.** The grade profile is a genuine structural reduction, not a reading-level dial: 5–6 sees
four doors, **two** lines, two years, four free agents, and never more than two decision-relevant
variables per card. And the two lines it sees are of two different kinds, which is what stops the
5–6 build from teaching FL2 by construction.

**Where I concede.** L2 at 5–6 is the overloaded lesson — it carries the ladder, the confiscation, the
carry *and* the cap-move. The honest mitigation, stated in advance rather than discovered in a
classroom: **at 5–6, C16's cap-move is a three-minute projector-only reveal read off one desk's rack,
not a re-read of every desk's books.** If a fresh-context Teacher Transfer review still finds L2
overstuffed at 5–6, the next cut is dead money — it moves entirely to L3 as a carried line item that
is *shown* and not *operated*, and L2 becomes purely the ladder and the rack.

### Argument 3 — "The market prices are historical, so nothing is discovered. You are telling students what things cost."

A Player critic who wants a bidding war will say this, and the design does give the price away.

**My answer.** Price discovery is deliberately **not** Module 1's subject. M1's territory is scarcity,
opportunity cost and constrained allocation; price-setting is Module 2's, and the NBA's own price
system is genuinely administered at the top (max tiers are a percentage of the cap, rookie scale is a
ladder by slot, the mid-levels are published dollars) — so a free-floating auction would be *less*
real, not more. What the real system actually leaves open is **term and instrument**, which is exactly
the margin this design contests, and the tie-break hierarchy (incumbent → years → dollars → room) is
the real rule, not an invention.

**Where I concede, and the fallback.** At 7–8 the design already lets the pair set the term. If the
critic is right that the contest is too thin, the 7–8 fallback is to let a desk **offer above the
historical price out of cap room** — which is real (you may always overpay) and which turns the
historical figure into a floor rather than a fixed point, delivering a genuine sealed contest with a
real winner's curse to set up the 2016 cap-spike reveal (§5.9). I did not build it in because two
different bidding structures across two bands is exactly the kind of divergence D22 program #2
forbids, and because Design Rule 12 — the rule that would justify the band split on bidding — has
**no source at all** and the dossier itself says to resolve it by playtest.

---

## 13. REGISTERED SIMPLIFICATIONS

Recorded here so they can be logged in `PRODUCT_DECISIONS.md`, each with what changed, why, and the
misconception risk (CLAUDE.md §3, and the economic contract's rejection #17).

| # | What is simplified | Why | Misconception risk | Mitigation |
|---|---|---|---|---|
| S1 | **Which of the five thresholds each band carries.** 5–6 carries the cap and the first apron. 7–8 adds the tax and the second apron. The floor is printed for both and binds where real. | §7.12 #2: a grades 5–8 lesson can carry three lines at most, and 5–6 should carry two. Both of 5–6's must not be blocking lines. | A 5–6 student may leave thinking there are two lines in the NBA. | L2's HOOK shows all five as a ladder before naming the two the lesson operates; the SYNTHESIS card names all five. |
| S2 | **Trade salary matching is a shape, not a percentage.** Three bands: roughly even below the first apron, no more than you send at and above it, and no combining two players at and above the second. | §8.2 #1 and §7.1 — three researchers, three incompatible accounts, one primary-text reading that contradicts both cap databases. §9.1 confirms the *shape* is true under all three. | A student may infer matching is a single fixed percentage. | Never print one, anywhere, on any surface — grep-assertable. Make the **tightening with spend** visible, because that tightening is the economics and the brackets are the paperwork. |
| S3 | **`MODULE_SLACK`, the allowance below the first apron**, is the module's own arithmetic. | The real allowance is a cap-indexed three-bracket ladder whose 2026-27 breakpoints were never sourced. | A student may treat the slack as a real NBA figure. | It is never rendered as a number; only as "roughly even." Logged as module arithmetic. |
| S4 | **Each club's free-agent amounts and re-sign prices** are the module's own scenario, labelled MODELLED wherever they appear. | The dossier has no per-team free-agent list or hold ledger; §7.12 #5 records that dead money is only partially mapped and free agents not at all. | A student may believe a specific real player was a free agent. | The holds are **unnamed** and carry a role only, exactly as a real cap sheet renders a Free Agent Amount. No real person is ever placed in a situation that is not dated and sourced. |
| S5 | **Each club's "holes"** are the module's own scenario, derived from real roster composition where §4.1 states it. | Position data is not in the dossier. | A student may believe the module is asserting a real roster need. | The card says *"the module's scenario"* on the needs panel; every player named on the sheet is real with a real salary. |
| S6 | **Contract prices are the total divided evenly by years** (Turner $107,000,000 ÷ 4 = $26,750,000). | Real contracts carry 5% or 8% raises; multi-step percent is grade 7 (§6.2) and forbidden as load-bearing at 5–6. | A student may think NBA salaries are flat across a contract. | 7–8's second-tier card carries the real raise structure as *richness*, and the SYNTHESIS names the 5-yr/8% vs 4-yr/5% asymmetry, which is where the raise rule actually teaches something. |
| S7 | **No luxury-tax dollar bill is ever computed or rendered.** The tax is taught structurally as a *price paid in tools*: above $200,428,000 your mid-level is $6,064,000 instead of $15,044,000. | §8.2 #5 and dissent #1 — the bracket rates come from one source family, were never cross-checked against the CBA, and the one worked example is single-source. | A student may not learn that the tax is paid in money. | The SYNTHESIS states plainly that teams pay real dollars — *seven teams paid $223,100,000 in 2025-26* (§8.1 #17, safe) — without any per-team bill. |
| S8 | **The stretch ceiling** is stated as the rule (15% of the cap) and computed by the module, never printed as a published figure. | $24,744,150 is researcher arithmetic, not a league figure (§8.2 #13). | Negligible. | Labelled as the module's arithmetic in the ledger. |
| S9 | **The second-apron pick penalty appears only inside the Phoenix narrative card**, labelled as reporting, and drives no mechanic. | §8.2 #2 — the trigger count (2-of-4 vs 3-of-5) and horizon (7 vs 8 drafts) are unresolved. | A student may quote a number that turns out wrong. | The card says "reported"; no count and no horizon is rendered. |
| S10 | **The payroll definition** is committed roster salary (HoopsHype, §4.4), stated on every surface that prints one. | §8.2 #12 and §7.6 — the two definitions differ by up to $52,000,000 on Detroit. | A student comparing to a third-party site sees a different number. | The definition is printed beside the figure, every time. |

**Declined, deliberately: C17, collective action across the tax threshold.** The economic contract
recommends Module 1 decline it unless a candidate can carry it without a redistribution mechanic;
redistribution is M2's named territory and §8.2 #8 forbids rendering any revenue-sharing percentage.
This design does not use it. The *count* of desks that ducked a line appears on THE LADDER as a fact
about the room, with no payout attached.

---

## 14. OPEN EVIDENCE ITEMS THIS DESIGN CREATES

Stated because a design that hides its own gaps is worse than one that names them.

1. **A dated real free-agent contract pass.** The market pool needs eight real, dated, sourced
   signings with terms; the dossier supplies five. This is the largest sports-reality gap in the
   design and it must be closed before build, not during.
2. **The fandom-accessibility check** (§7.12 #7). Every card in this design claims to be fully
   decidable without basketball knowledge, and that claim **has never been tested against a non-fan
   reader**. The test I propose: give a non-fan adult the market cards and the five doors with no
   context and ask them to fill a named hole under a named book. If they cannot, the cards fail.
3. **Rule 12's band split on bidding is unsourced and rated LOW by its own author.** This design does
   not depend on it (both bands use the same simultaneous door resolution), which I consider a
   feature, but if a prototype shows 5–6 needs open sequential bidding, the change is confined to
   `/play` and does not touch the reducer.
4. **A hand recomputation of the trade-matching bands against CBA Article VII**, before any bracket
   dollar figure is ever considered for a screen.
5. **The 2026 offseason roster map** was confirmed by only one researcher (§7.4). Every club sheet
   must be spot-checked in a browser against Spotrac before it reaches a class.
6. **Threshold proximity is volatile** (§7.10). San Antonio at $37,083 over the tax line is the best
   threshold-effect example in the league and is also the most likely figure in the design to be
   false by November. It needs a refresh mechanism or it must not be a lesson beat.
7. **FL6b/FL8b do not hold inside L1 alone, and the Stage-0 probe says so on screen.** Running the
   six canned strategies at all five prototype desks finds **no dominant strategy at any desk** —
   no row tops every column — and the floor binds on Detroit's "let everyone go and keep the money"
   path at a shortfall of $10,854,482. But "hold everything" is **not Pareto-beaten** by any active
   strategy within one lesson, because holding necessarily tops the *tools left* board and *tools
   left* is one of the four axes. I have not tuned this away, because tuning a constant until a
   property passes is precisely the failure PLATFORM_REALITY §4 records against M2 L1. The honest
   position is that the anti-hoarding guard is a **module-level** property, not a lesson-level one:
   it is discharged in L2 (a tool you never use still shrinks when you cross the tax line, and the
   apron confiscates it outright) and in L3 (room you never spend expires worth nothing, and
   `roomToMove` is measured against an opportunity set the room itself created). **If the Economic
   Truth critic rules that FL6b must hold inside L1, the repair is not a constant — it is to move
   the tax line into L1 as a third kind of object, which reopens §7.12 #2's threshold budget and
   should be decided as a founder call, not by me.**
8. **The prototype's `roomToMove` reads 0 for the three over-cap desks on most paths.** That is
   economically correct — San Antonio, Memphis and Denver genuinely cannot reach a $9,366,000
   signing next summer — but a board column that reads 0 for three of five desks is a weak reveal.
   The shipped version needs either a wider opportunity set with more rungs at the bottom, or the
   column reframed as *which* actions remain rather than *how many*. Flagged as a reveal-design
   defect found by playing, not by reasoning.
