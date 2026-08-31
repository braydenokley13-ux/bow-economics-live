# Gate L1 · Sports Reality — Module 2 Lesson 1 "Full House" (BUILT)

Role: Sports Reality Director · Assignment: `gate-l1-sr` · Boss run: `m2-quality-war` ·
Gate: **BC-3** (season stamps on every real figure; magnitudes re-derived consistently).
Written 2026-08-31. Everything web-checked this session carries `verifiedAsOf: 2026-08-31`.

Artifacts audited: `runtime/src/modules/fullHouse.ts` (all product copy, market constants,
night cards, `SOURCE_NOTES`), `runtime/src/client/play/main.ts`,
`runtime/src/client/board/main.ts`, `runtime/src/client/teach/main.ts` (render only — the
client surfaces add no real-world claim of their own; every real fact reaching a screen
originates in the module), `runtime/src/test/fullHouse.test.ts` (the BC-3 assertion).
Baseline: `SPORTS_REALITY_INPUT.md` (SR-1…SR-15); prior conditions `C-3`, `C-5` from
`SELECTION_SR_REVIEW.md`.

**Headline:** one BLOCKING finding. The New York Knicks won the 2026 NBA championship on
2026-06-13 — after the anchor sheet was written. The lesson makes half the room the Knicks
*and* prints a Night 3 card whose visiting club is "the defending champions." In the
2026-27 school year those are the same club, so the New York desk hosts itself on the one
card the Two Peaks reveal is drawn on. The repair is one string.

---

## real-world-anchors

What the built lesson actually puts in front of students and on the projector.

| # | Real element | Value in build | Where it reaches a person |
|---|---|---|---|
| A1 | New York Knicks (club) | `MARKETS[0].club` | `/play` desk header + LOBBY/HOOK/PLAY/REVEAL, `/board` LOBBY + HOOK tiles, `/teach` desk grid, synthesis card bodies, `deskHandle()` |
| A2 | Madison Square Garden (building) | `MARKETS[0].building` | `/play` desk header, HOOK "Your building" panel, `/board` market tiles |
| A3 | MSG capacity | `19_800` seats | `/board` LOBBY + HOOK tiles, `/play` HOOK panel and **every night card** (`fhCardHtml`) |
| A4 | New York market claim | "The biggest market in American sports. A lot of people, and a lot of them can pay." | `/play` LOBBY/HOOK, `/board` LOBBY |
| A5 | Memphis Grizzlies (club) | `MARKETS[1].club` | as A1 |
| A6 | FedExForum (building) | `MARKETS[1].building` | as A2 |
| A7 | FedExForum capacity | `17_794` seats | as A3 |
| A8 | Memphis market claim | "One of the league's smallest markets. Fewer people, and price matters more here." | as A4 |
| A9 | NBA season shape | `HORIZON_LINE`: "One night here stands for about eight real home dates. A real NBA season is 41 home games." | `/play` HOOK banner, `/board` HOOK |
| A10 | Defending champions as a visiting club | N3 `visitor: "the defending champions"`, draw 88, national TV | `/play` + `/board` night card, `/teach` "on the projector right now" |
| A11 | Broadcast substitution | N3 note: "on national TV — the whole country can watch it free at home" + hidden `tvBase.national` of −4,620 (NY) / −5,770 (MEM) | night card copy; effect lands in every settled turnout |
| A12 | Caitlin Clark demand shock (unnamed) | `SHOCK_REVEAL_COPY`: Fever 4,066/game 2023 → 17,036/game 2024, best in WNBA, six opposing clubs moved games to bigger buildings | `/board` PLAY on N4 and all of REVEAL |
| A13 | Dynamic pricing origin | `DYNAMIC_PRICING_COPY`: Giants 2009, full season 2010, standard across the NBA now | synthesis card "YOUR JOB IS REAL", `/board` SYNTHESIS |
| A14 | Lakers/Grizzlies local-media gap | `SOURCE_NOTES[0]`: Grizzlies under $10M/yr vs Lakers ~$149M, leaked year 2016-17, ESPN Sept 2017 | `/board` SYNTHESIS only |
| A15 | 2025 NBA champion | `SOURCE_NOTES[3]`: "The 2025 NBA champions were the Oklahoma City Thunder (2024-25 season)" | `/board` SYNTHESIS only |
| A16 | Arena-scale + modeled-dollar disclaimer | `SOURCE_NOTES[4]`: "…about 19,800 … about 17,794 … listed basketball capacities for the 2025-26 season. Every dollar figure in this lesson is a modeled magnitude, not an audited club financial." | `/board` SYNTHESIS only |
| A17 | Modeled-curve honesty line | `BOARD_HONESTY_LINE` | `/board` HOOK, PLAY, REVEAL, ADAPT, COUNTERFACTUAL, SYNTHESIS |
| A18 | Modeled dollars under real club names | bill $520,000 / $280,000 a night; season plan $24 / $16 a seat; price dial $10–$120; in-arena $18 / $12 a fan; extra bowl 2,400 seats / $95,000 and 1,800 / $42,000 | `/play` books, card facts, dials, night result; `/board` HOOK tiles |
| A19 | Club identity art | fictional crest sprite (Ironworks/Northstar/Harbor/Summit/Vale, `crest.ts`), no club marks anywhere | `/play` desk header, `/board` desk chips |

Not used anywhere in L1: player names, likenesses, logos, wordmark styling, photography,
video, resale or proprietary ticketing data. Confirmed by reading the module and the three
clients — the demand curves are module-scope constants, never an ingested dataset.

---

## accuracy-findings

### F1 — BLOCKING. The defending champions cannot visit Madison Square Garden in 2026-27.

Night 3's visiting club is `"the defending champions"` (`CARDS[2].visitor`), and the card is
shared by both markets. Odd desks run the New York Knicks (`marketForDesk`). **The Knicks
won the 2026 NBA Finals, beating the San Antonio Spurs 4-1 on 2026-06-13, their third title
and first since 1973; Jalen Brunson was unanimous Finals MVP.** For the entire 2026-27
season the defending champions *are* the club half the room is running. A New York desk sees
"Wednesday · the defending champions" above a header reading "Desk 3 · New York Knicks —
Madison Square Garden."

This is the inverted fandom test: the card is fine for a student who knows no basketball and
incoherent for one who does — and it fails hardest in exactly the room this product is aimed
at first (a New York City classroom, six months after the parade). It also lands on the card
the Two Peaks reveal is computed from (`TWO_PEAKS_CARD_ID = "N3"`), so it is the most-looked-at
card of the lesson.

- Source: [NBA.com — how the Knicks won the 2026 championship](https://www.nba.com/news/how-the-knicks-won-the-2026-nba-championship); [ESPN](https://www.espn.com/nba/story/_/id/49053284/new-york-knicks-win-2026-nba-finals-path-championship-outlast-east-brunson-towns-hart); [Wikipedia — 2026 NBA Finals](https://en.wikipedia.org/wiki/2026_NBA_Finals). verifiedAsOf: 2026-08-31.
- Repair (one string, no model change): change N3's visitor to a role no desk can hold —
  **"last season's beaten finalists"** (San Antonio, 2026) or "the club with the best record
  in the league." Draw 88 and the two-shifters-pulling-opposite-ways design are untouched.
  Richer alternative, if the builder wants it: add an optional per-market visitor override so
  Memphis hosts the champions and New York hosts the finalists — more real, more code.

### F2 — MODERATE. The champion source note is true, correctly stamped, and framed wrong.

`SOURCE_NOTES[3]` says the 2025 champions were Oklahoma City (2024-25 season). That statement
is accurate and BC-3-compliant on its face. Two problems: (a) it is the lesson's **only**
champion reference, sitting on the same board sequence as a "defending champions" card, so a
teacher or student reads it as identifying the N3 visitor — which is wrong for the season the
lesson will be taught in; (b) Oklahoma City is named nowhere else in the build, so the note
is a dangling fact that sources a claim the lesson does not make.

- Source: as F1; OKC's 2025 title is confirmed in `SPORTS_REALITY_INPUT.md` SR-3/SR-14. verifiedAsOf: 2026-08-31.
- Repair: delete the note when F1's repair removes the champion frame. If any champion
  reference is kept, it must be the current one and stamped: "The New York Knicks won the 2026
  NBA championship, their first since 1973 (2025-26 season; NBA.com/ESPN, 13 June 2026)."

### F3 — MODERATE. The stated horizon compression and the modeled dollars contradict each other by ~30–60×.

`HORIZON_LINE` tells the room "one night here stands for about eight real home dates." The
modeled money runs the other way. Worked from the module's own constants, a New York Night 3
at its cash-best price ($40) draws 13,450 and takes **$538,000 at the gate** ($780,100 with
in-arena), against a nightly bill of $520,000.

Real comparison, same building: MSG Sports reported **about $5.8M in direct operating
expenses per game** for Knicks 2024-25 postseason home games, and ~$12.8M revenue per playoff
home date; regular-season Knicks ticket revenue is reported at roughly **$4M a game**. So the
modeled night is about one-seventh of a *single* real Knicks date on the gate and about
one-eleventh on the cost line — while the copy says it stands for eight of them. A student
who takes the horizon line at face value concludes the Knicks clear roughly $260K on eight
home dates.

This is the L1 recurrence of the defect the selection review named as **C-2** (pipe magnitudes
inconsistent with the design's own horizon compression), which BC-3 exists to close. It is not
a lie about the real world — every dollar here is honestly modeled — but the *relation* the
copy asserts between modeled and real is wrong, and the "modeled magnitude, not an audited club
financial" disclaimer only appears at SYNTHESIS, after all five nights are priced.

- Source: [Forbes, 13 Aug 2025, citing MSG Sports](https://www.forbes.com/sites/timcasey/2025/08/13/new-york-knicks-deep-playoff-run-leads-to-record-per-game-revenue/); [Sportico, 2026](https://www.sportico.com/leagues/basketball/2026/new-york-knicks-playoffs-revenue-1234899086/). verifiedAsOf: 2026-08-31.
- Repair: (a) move the modeled-dollar disclaimer out of `SOURCE_NOTES` and onto the HOOK
  board and the play card, in the Cap Room register — e.g. "The dollars here are shrunk to
  classroom size. One real Knicks home night takes in several million." (b) Either drop the
  "eight real home dates" claim or restate it as calendar compression only ("five nights stand
  in for a 41-date season"), so nothing invites students to multiply. (c) One teacher-facing
  line that the bill is game-night operating cost, not payroll — a real club's payroll is the
  bigger number and it is M1's subject, not this lesson's.

### F4 — MODERATE. Capacities reach students with no stamp; the BC-3 test cannot see it.

19,800 and 17,794 appear on the board's LOBBY and HOOK tiles, in the `/play` HOOK panel, and
on **every night card** (`fhCardHtml`: `${market.capacity} seats`). The season stamp for those
figures lives only in `SOURCE_NOTES[4]`, rendered once, at SYNTHESIS. BC-3 reads "season stamps
on every real figure," and the module test
(`"real figures in product copy carry a season stamp (BC-3)"`) only asserts that each
`SOURCE_NOTES` entry contains a four-digit year — a presence check on the notes array, not
coverage of the figures that actually reach a screen. The gate therefore passes green today
with unstamped real figures on the projector for the whole lesson.

- Repair: stamp at point of use (board tile subtitle "listed capacity, 2025-26"), and extend
  the test so any exported numeric real-world figure must have a stamped companion string.

### F5 — MODERATE. FedExForum's 17,794 is defensible but over-claimed, and the building is mid-renovation.

`SOURCE_NOTES[4]` calls 19,800 and 17,794 "the listed basketball capacities for the 2025-26
season." MSG checks out: the listed basketball capacity is **19,812**, so "about 19,800" is
accurate and appropriately hedged. FedExForum does not resolve to one number: 17,794 is widely
published by ticketing and venue references, Wikipedia currently lists **16,667** for
basketball (18,119 for concerts), and the arena is in a multi-phase renovation — Phase 1 in
2025-26, Phase 2 in 2026-27 adding suites, club seating and expanded concourses, with $230M in
approved state funding and completion targeted for 2028. A renovation of that shape routinely
moves the seat count.

Prior review condition C-5 recorded "capacities are right (FedExForum 17,794; MSG ~19,800)";
that holds at "about" precision, but the built copy's stronger claim — a single listed figure,
season-stamped — is not supportable for Memphis.

- Sources: [Wikipedia — Madison Square Garden](https://en.wikipedia.org/wiki/Madison_Square_Garden); [Wikipedia — FedExForum](https://en.wikipedia.org/wiki/FedExForum); [Ticketmaster venue guide](https://blog.ticketmaster.com/step-inside-fedexforum-memphis-tn/); Daily Memphian / state funding coverage. verifiedAsOf: 2026-08-31.
- Repair: keep 17,794 as the modeled seat count, and soften the note to "about 19,800 seats at
  Madison Square Garden (listed basketball capacity 19,812) and about 17,800 at FedExForum
  (published figures range 16,667–18,119; the building is in a phased renovation through 2028)."
  Do not assert one season-stamped listed figure for Memphis.

### F6 — MINOR. Broadcast substitution is asserted as fact with no source note (closes open condition C-3).

N3's card note states as fact that a national broadcast keeps fans home, and the model applies
a large negative (−4,620 NY / −5,770 MEM base fans, plus a sensitivity increase). The selection
review left this NOT VERIFIED (C-3), and BC-3's binding list did not carry it forward, so it
shipped unresolved. It is now supportable in direction: the peer-reviewed NBA spectator study
(Zhang & Smith, *Sport Marketing Quarterly* 1997, 861 spectators, 1993-94 season) found
broadcasting a home game decreases attendance while broadcasting away games increases it. The
magnitude in the build is modeled, not measured — and the design honestly pairs the national
window with a draw-88 visitor, which is how NBA national windows actually work.

- Source: [Zhang & Smith 1997](https://journals.sagepub.com/doi/full/10.1177/106169349700600105). verifiedAsOf: 2026-08-31.
- Repair: add one `SOURCE_NOTES` entry ("Televising a home game has been found to lower live
  attendance in NBA studies since the 1990s; the size of the effect in this lesson is modeled");
  keep `BOARD_HONESTY_LINE` as-is. C-3 can then be closed.

### F7…F11 — verified, no repair required

- **F7 (MINOR, verified).** MSG basketball capacity 19,812 vs the build's "about 19,800" — accurate. Source: Wikipedia/MSG. verifiedAsOf: 2026-08-31.
- **F8 (MINOR, verified).** Fever attendance: 2024 average **17,036** over 20 home dates (340,715 total), a WNBA regular-season record and the league's best; 2023 average reported as 4,066–4,067 (second-lowest in the league). "Six opposing clubs moved Fever games to bigger buildings" is confirmed for 2024 (Atlanta→State Farm Arena, Chicago→United Center, Connecticut→TD Garden, Dallas→American Airlines Center among them). Build says 4,066 — inside reporting variance. Sources: [Sportico](https://www.sportico.com/personalities/athletes/2024/caitlin-clark-indiana-fever-wnba-attendance-record-1234795205/), [Front Office Sports](https://frontofficesports.com/6-wnba-teams-moved-games-caitlin-clark-fever/), [Wikipedia 2024 Indiana Fever season](https://en.wikipedia.org/wiki/2024_Indiana_Fever_season). verifiedAsOf: 2026-08-31.
- **F9 (MINOR, verified).** Giants dynamic pricing: 2009 pilot on ~2,000 outfield/upper-deck seats; all single-game tickets dynamically priced in 2010. Build's wording is exactly right. Sources: CIO / ORMS Today / *Journal of Sport Management* 26(6) 2012. verifiedAsOf: 2026-08-31.
- **F10 (MINOR, verified).** "A real NBA season is 41 home games": the 2026-27 82-game schedule was released 2026-08-13 (80 games fixed, 2 set by NBA Cup group play). 41 is the standard home count; a club that hosts an NBA Cup knockout game can play 42 home dates. Accurate as written. Source: [NBA.com PR](https://pr.nba.com/2026-27-nba-regular-season-schedule/). verifiedAsOf: 2026-08-31.
- **F11 (MINOR, verified).** Market claims: Memphis is the NBA's smallest or near-smallest market on both TV-market (#27 of the US markets hosting NBA clubs) and metro population (~1.3M) measures; New York is the largest US media market. Both `plainLine`s are hedged correctly ("one of the league's smallest"). verifiedAsOf: 2026-08-31.

### Missed reality — materially stronger real situations that were passed over

- **MR-1 (MODERATE).** National TV appears in L1 **only** as a demand penalty. In reality a
  national window is attached to the league's national media money: the 11-year, ~$76B
  Disney/ESPN + NBC/Peacock + Amazon agreements began in **2025-26** and run through 2035-36,
  averaging ~$6.9B a season across 30 clubs, with ~75 regular-season games on broadcast TV a
  year (up from a 15-game minimum). SR-2 was the anchor sheet's **#1 recommendation for this
  lesson** and it is absent. As built, the honest lesson a student draws is "national TV is bad
  for my club," which is false and is the exact false-lesson risk CLAUDE.md §8 names. One board
  line at REVEAL or SYNTHESIS closes it without touching the model: "The national broadcast
  costs you some of tonight's crowd — and pays the league billions you never see on this desk.
  That money is the next lesson." Source: [NBA.com, July 2024](https://www.nba.com/news/nba-media-agreements-2024), [ESPN](https://www.espn.com/nba/story/_/id/40535771/reports-nba-agrees-terms-76-billion-media-rights-deal). verifiedAsOf: 2026-08-31.
- **MR-2 (MODERATE).** The strongest demand-shock story in American sports right now is inside
  this lesson's own primary market and unused: the Knicks' first title in 53 years, June 2026.
  It is the natural frame for N4 ("demand is going to run past what this building holds") and
  for the N5-repeats-N1 path-dependence beat. Using it also disposes of F1 by making the
  champion the *home* club rather than the visitor.
- **MR-3 (MINOR).** `SHOCK_REVEAL_COPY` tells the Fever story without naming **Caitlin Clark** —
  the one basketball name a 2026 fifth-grader is most likely to know, and SR-6's whole
  accessibility argument. Naming her is a public-figure factual reference at no rights cost and
  converts a number into a person. (Keeping her *off* the pre-lock card is right; this is about
  the reveal.)
- **MR-4 (MINOR, note only).** SR-4's 15:1 Lakers/Grizzlies local-media gap explains the market
  asymmetry the entire lesson turns on, but appears only as a source note at SYNTHESIS. The
  anchor sheet assigns it to L2, so this is recorded rather than repaired — with a warning that
  L1 currently asserts "Memphis is small" without ever showing a student *why* that changes the
  money.

---

## staleness-findings

Ranked by how soon they bite.

1. **Champion framing — already stale (F1/F2).** The NBA champion changes every June; the
   anchor sheet predates the 2026 Finals. Any "defending champions" reference in a lesson
   played across a school year is a maintenance item forever. Recommendation: after F1's
   repair, keep **no** champion reference on a night card. Card visitors should stay role-based
   and staleness-proof, which is otherwise this build's real strength.
2. **FedExForum capacity and name (F5).** Phase 2 of the renovation lands in 2026-27; seat
   counts, and eventually the naming-rights name, can move. Stamp it and hedge it.
3. **"That was a real thing, and it happened two seasons ago"** (`SHOCK_REVEAL_COPY`). Correct
   as of the 2026 WNBA season and wrong from May 2027. The sentence already carries "2023" and
   "2024" explicitly, so the relative phrase adds nothing and only decays — delete it.
4. **"variable and dynamic pricing are standard across the NBA now"** (`DYNAMIC_PRICING_COPY`).
   Slow-moving and currently true; the "now" is unstamped in the copy, stamped in the note.
   Acceptable; add "as of 2026" if the note is being edited anyway.
5. **Rookie card language.** "The rookie everybody is talking about" is deliberately
   name-free and therefore safe. Do **not** name the current rookie: the 2026 No. 1 pick was
   AJ Dybantsa (Washington, 2026-06-23), and naming him buys one season of texture for a
   permanent maintenance obligation and a fandom-test risk. Recorded as a decision to preserve.
6. **Staleness-safe by construction, keep as is:** Giants 2009/2010; Fever 2023→2024 (a fixed,
   stamped historical pair); the 2016-17 leaked-financials gap (correctly stamped as one leaked
   year); "a real NBA season is 41 home games."

---

## rights-source-considerations

Material flags only; no blanket legal claims. Nothing here justifies fictionalizing.

- **Names and facts as facts.** Club names, arena names, attendance figures, published
  pricing history and league schedule facts are used as facts — the same category M1 already
  ships and the direction CLAUDE.md §3 mandates. No issue.
- **No marks, no likenesses, no media.** Confirmed by reading the code: teams render as
  typographic names in the product's own system; the crest sprite is the product's own
  fictional set (Ironworks/Northstar/Harbor/Summit/Vale); no logo, wordmark styling,
  photography, video or player likeness appears anywhere in L1. This matches the anchor sheet's
  rights section exactly and should be held through any later visual pass — introducing club
  marks or arena photography would be a material escalation, not a polish decision.
- **One flag worth a design word:** a fictional crest renders immediately beside a real club
  name in the `/play` desk header and the `/board` desk chips. It is rights-*good* (no club
  mark), but it can read as an unofficial club crest. Recommend the crest be presented and
  labelled as a **desk badge**, not a club identity.
- **"FedExForum" carries a live corporate sponsor's name.** Using a venue's legal name is
  ordinary factual reference. Noted only because (a) it puts a brand on a grade-5 screen and
  (b) naming rights are a staleness vector (see above). No change recommended.
- **Madison Square Garden / New York Knicks are MSG Sports trademarks**; the build's use is
  nominative and factual. Same caution as above about later visual passes.
- **No proprietary or betting-adjacent sources.** The demand curves are module constants, not
  ingested resale data — exactly the discipline SR-1 asked for, and verifiable in code. Every
  source used in this gate is league PR, a major outlet, a venue reference, or a peer-reviewed
  journal.
- **Resale copy is clean.** `resaleNote` names no reseller and says out loud that the money was
  never on the club's books. Keep it.
- **Teacher gap, not a rights defect but caused by one:** `SOURCE_NOTES` is passed to
  `boardView` only (SYNTHESIS, and to COMPLETE where the board never renders it). `teacherView`
  never receives it. A teacher asked "is that real?" mid-class has no dated answer on the
  control surface. Recommend passing `SOURCE_NOTES` into `teacherView` — source discipline is
  only useful if the person speaking in the room can reach it.

---

## recommendation

**Overall: CLEAR WITH REPAIRS.**

The lesson's use of reality is structurally sound: two real markets at the extremes of the
league, real buildings at real scale, an explicit modeled-curve honesty line on nearly every
board state, role-based card visitors that impose no fandom test, and a reveal built on a
verifiable real demand shock. Nine of the eleven checkable factual claims verify clean. The
verdict is not CLEAR because one shipped card is incoherent for the season it will be taught
in; it is not BLOCKED because nothing here requires redesign — **R1 is a one-string repair**,
and the rest are copy edits.

**R1 is release-blocking: this lesson must not run in a classroom until it lands.**

| # | Severity | Repair | Touches |
|---|---|---|---|
| **R1** | **BLOCKING** | Remove the champion/desk collision on N3 — change `visitor` to a role no desk holds ("last season's beaten finalists" or "the club with the best record in the league"). Optional richer fix: per-market visitor override. | `CARDS[2].visitor` |
| **R2** | Required | Delete or replace `SOURCE_NOTES[3]` (the OKC note). If any champion reference survives, it must be the Knicks' 2026 title, stamped and dated. | `SOURCE_NOTES` |
| **R3** | Required (BC-3 core) | Magnitude honesty: surface "the dollars are shrunk to classroom size — one real Knicks home night takes in several million" at HOOK and on the play card; drop or restate `HORIZON_LINE`'s "eight real home dates" so it is calendar compression only; add a teacher line that the nightly bill is game-night operating cost, not payroll. | `HORIZON_LINE`, `SOURCE_NOTES`, `/play` + `/board` HOOK |
| **R4** | Required (BC-3 core) | Stamp capacity at point of use (board tiles + play card), and extend the BC-3 test from "each source note contains a year" to "each real figure that reaches a view has a stamped companion." | module copy, `fullHouse.test.ts` |
| **R5** | Required | Soften the FedExForum capacity claim (published figures 16,667–18,119; phased renovation through 2028). Keep 17,794 as the modeled seat count. | `SOURCE_NOTES` |
| **R6** | Recommended | One line restoring national TV as a revenue pipe (SR-2, ~$76B / 11 years, from 2025-26) so the lesson does not teach "national TV is bad for your club." | REVEAL or SYNTHESIS copy |
| **R7** | Recommended | Name Caitlin Clark in `SHOCK_REVEAL_COPY`; delete "two seasons ago" (the 2023/2024 stamps already carry it). | `SHOCK_REVEAL_COPY` |
| **R8** | Recommended | Add a source note for the broadcast-substitution direction (Zhang & Smith 1997) — closes open condition **C-3**. | `SOURCE_NOTES` |
| **R9** | Recommended | Pass `SOURCE_NOTES` into `teacherView` so the teacher can answer "is that real?" | `teacherView` |
| **R10** | Optional upgrade | Use the Knicks' June 2026 title (first since 1973) as the lesson's real demand-shock frame — the strongest current story available, and it sits inside the lesson's own primary market. | design call, not a copy edit |

**Rulings the builder asked for.**

- **Arena capacities — CLEARED with a copy repair.** MSG's listed basketball capacity is
  19,812; "about 19,800" is accurate. FedExForum does not have one settled public figure
  (16,667 / 17,794 / 18,119 across references) and is mid-renovation; 17,794 is fine as the
  modeled seat count, but the note's claim of a single season-stamped listed capacity is not
  supportable (R5).
- **"Defending champions = OKC" — NOT CURRENT, and the framing is BLOCKING for a different
  reason than staleness.** OKC won 2025; the **New York Knicks won the 2026 title on
  2026-06-13**, so the defending champions in 2026-27 are the club half the room is running.
  The season stamp on the OKC note is correct; the note is nonetheless wrong to keep, and the
  card it appears to explain must change (R1, R2).

Formal dissent: none recorded. Open item handed to Economic Truth: MR-1 — whether a national
broadcast should carry any revenue counterpart inside L1's model, or stay a pure demand
shifter with the revenue truth told in copy and paid off in L2.
