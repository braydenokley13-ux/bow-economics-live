# Player production research — the Module 1 L1 board

Sports Reality research pass on the twelve named free agents in
`runtime/src/modules/sameLine/world.ts` (`BOARD`). Commissioned because the
board printed a PRICE and no PRODUCTION, and a price with nothing beside it
asserts a quality ordering.

**All sources read 2026-09-03.** Written up 2026-09-04 by the lead from the
researcher's report; the researcher's role contract forbids repo writes, and
that conflict is recorded here rather than worked around.

## 0. The finding that drove the change

> The board's price ordering currently asserts a quality ordering that the real
> production contradicts, and the module gives students no data with which to
> notice.

A student reading price alone learns `Robinson > Nurkić > Horford > Nance >
Vučević` as a quality ranking. In 2025-26 that ranking is close to reversed.
The researcher raised this as a **blocking economic-truth concern** and stated
that a board shipping with price and no production would draw a formal dissent.
It has been acted on: see §5.

## 1. Sources and their tiers

| Source | Used for | Confidence |
|---|---|---|
| basketball-reference.com player pages, game logs, `/leagues/NBA_2026.html` | every production line, ages, career context | **high** |
| hoopsrumors.com (dated per claim) | contract dates, terms, first-year salaries | medium-high |
| spotrac.com | — | not attempted (403 in the prior session) |
| stats.nba.com | — | **blocked by egress policy** (connect_rejected) |
| nba.com | — | 403 |

Two things follow and both are recorded in `world.ts`:

- **There is no official-NBA-tier verification of any production figure here.**
  Getting one is a network-policy escalation, not a research one.
- basketball-reference is the module's **first source that is not a cap tracker
  and not a reporter.** Nearly every 2026 dollar figure in `world.ts` traces
  through one publisher to one reporter, so "two outlets" has never meant two
  sources. A completed season's box score is an independent public record and
  is the only class of fact in the file that a later report cannot revise.

## 2. The table, as shipped

2025-26 regular season, per game. Combined (`2TM`) line where a player was
traded. Age is **age on the `signedOn` date**, computed from the bbref
birthdate — not bbref's own Age column, which is age on 1 February.

| Player | Role | Ask | Basis | Age | G | GS | MIN | PTS | REB | AST | BLK | FG% | 3P% |
|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Trendon Watford | WING | 2,900,000 | first-year | 25 | 53 | 7 | 16.3 | 6.5 | 3.3 | 2.5 | 0.4 | .515 | (.200) |
| Nikola Vučević | BIG | 3,900,000 | first-year | 35 | 64 | 49 | 28.4 | **15.1** | 8.4 | 3.3 | 0.6 | .493 | .369 |
| Gary Payton II | GUARD | 3,900,000 | first-year | 33 | **73** | 1 | 15.6 | 7.5 | 3.6 | 1.7 | 0.3 | .583 | .291 |
| Larry Nance Jr. | BIG | 4,000,000 | first-year | 33 | 35 | 3 | 12.8 | **3.7** | 2.7 | 1.0 | 0.2 | .419 | .333 |
| Anfernee Simons | GUARD | 6,000,000 | first-year | 27 | 55 | 5 | 24.9 | 14.3 | 2.5 | 2.4 | 0.1 | .440 | .385 |
| Jonathan Kuminga | WING | 6,064,000 | first-year | 23 | 36 | 14 | 23.1 | 12.2 | 5.6 | 2.3 | 0.3 | .463 | .333 |
| Al Horford | BIG | 7,000,000 | **average** | 40 | 45 | 13 | 21.5 | 8.3 | 4.9 | 2.6 | 1.1 | .426 | .361 |
| Kelly Oubre Jr. | WING | 8,050,000 | first-year | 30 | 50 | 41 | **31.5** | 14.1 | 5.0 | 1.6 | 0.5 | .467 | .360 |
| Jusuf Nurkić | BIG | 11,000,000 | **average** | 31 | 41 | 36 | 26.4 | 10.9 | **10.4** | **4.8** | 0.5 | .503 | .352 |
| Quentin Grimes | GUARD | 15,000,000 | **average** | 26 | **75** | 19 | 29.4 | 13.4 | 3.6 | 3.3 | 0.4 | .450 | .334 |
| Mitchell Robinson | BIG | 15,044,000 | first-year | 28 | 60 | 16 | 19.6 | 5.7 | 8.8 | 0.9 | 1.2 | **.723** | — |
| Ayo Dosunmu | GUARD | 19,310,345 | first-year | 26 | 69 | 19 | 27.3 | 14.8 | 3.4 | 3.6 | 0.3 | .517 | **.439** |

bbref ids: `watfotr01 vucevni01 paytoga02 nancela02 simonan01 kuminjo01
horfoal01 oubreke01 nurkiju01 grimequ01 robinmi01 dosunay01`.

**Two 3P% values are not printed on cards.** Robinson took none. Watford took
0.9 attempts a game (`.200` on roughly 48 attempts across the season) — under
one attempt a game the percentage is noise dressed as a fact, so the applied
rule is: **below 1.0 attempts per game the card shows FG% instead.** That rule
is stated so it cannot later look like cherry-picking.

**League context, 2025-26** (`/leagues/NBA_2026.html`): champion New York;
MVP Shai Gilgeous-Alexander; ROY Cooper Flagg; scoring Luka Dončić 33.5;
rebounds and assists Nikola Jokić 12.9 / 10.7.

## 3. The inversion, and the honest reading of it

**BIG by ask:** Vučević 3.9 → Nance 4.0 → Horford 7.0 → Nurkić 11.0 → Robinson 15.0
**BIG by points:** Vučević 15.1 → Nurkić 10.9 → Horford 8.3 → Robinson 5.7 → Nance 3.7

- The **cheapest big out-scored every expensive one** and out-rebounded two of them.
- **Nance costs $100,000 MORE than Vučević for roughly a quarter of the production.**
  That adjacency is the best argument-generator in the whole research pass, it
  is one glance wide, and it is true.
- The most expensive card on the board scored 5.7 points a game.
- **Simons ($6.0M) out-scored Grimes ($15.0M)** in 4.5 fewer minutes a night.
- **WING is the only role where price tracks production** (6.5 < 12.2 < 14.1).

**Why this is not "NBA clubs are bad at their jobs."** Price on a free-agent
board is buying **years and age**, not last season's box score. Vučević and
Horford took short deals at 35 and 40; Robinson's $15.044M buys three years of a
28-year-old rim protector who had just won a title; Grimes' $15M buys four years
and Dosunmu's $19.3M five years of 26-year-olds. Simons was cheap because he had
just lost his starting job. Robinson is expensive for rebounds, blocks and .723
shooting that a points column hides.

**This is the design consequence and it is load-bearing:** age at signing and
the real term are printed on the same card as the price and the production.
Price without production teaches something false; production without age and
term teaches something else false. All four go together or none of them ship.

## 4. Errors found in `world.ts`, and what was done

| # | Error | Fix applied |
|---|---|---|
| 1 | Simons `incumbent: "boston"` — his game log shows Boston through 2026-02-01 and **Chicago from 2026-02-05**; Chicago held his rights on 2026-07-06 | `incumbent: null`. Chicago is not a desk in this room, so no seat has a claim on him. Boston had been given a tie-break it never had. |
| 2 | Kuminga `signedOn: "2026-07-06"` — wrong by seven weeks; agreement reported **2026-08-26** | date corrected; source string now cites the Hoops Rumors piece and its reported ~$13,000,000 total with a second-year player option, replacing the file's computed $12,431,200 |
| 3 | Grimes `signedOn: "2026-07-15"` — no source supports it; agreed 2026-07-01, club announced **2026-07-07** | `2026-07-07`, both dates in the source string |
| 4 | Simons ask $6,150,000 and Oubre ask $8,500,000 were **AAVs**, while the module charges `ask` against a cap | restated at the reported first-year salaries **$6,000,000** and **$8,050,000** (Hoops Rumors 2026-27 MLE tracker, published 2026-07-16) |
| 5 | Horford and Nurkić asks are averages and no source read stated their first year | left as averages and **labelled** — new `askBasis` field, printed on the card, registered as simplification **S8**. Dividing a total by a raise ladder would be an invented dollar figure printed as an NBA fact. |
| 6 | "a young starting guard" (Grimes, 19 of 75 starts) and "a starting guard entering his prime" (Dosunmu, 19 of 69) | rewritten. Paid like a starter, played as a third guard — truer, and the better lesson. |
| 7 | Robinson "one of the best rebounders and rim protectors who changed teams this summer" — an unverified ranking | replaced with three verified facts. **Do not upgrade `.723` to "led the league"** — he did not qualify for the leaderboard (Gobert led at .682). |
| 8 | Three unsourced scouting lines: Simons' defense, Nurkić's speed, Watford's positional range | struck. Simons now carries his verified role collapse (70 starts → 0); Nurkić his verified availability (>60 games once in five seasons); Watford is listed at PF and SF only, so the card says two positions, and gains the verified "undrafted". |
| 9 | Vučević risk said "he is 36 in this season" — he was **35** at signing, turning 36 on 2026-10-24 | card prints age 35 at signing; copy says he turns 36 in October |
| 10 | `REFRESH` had no board cadence | `REFRESH.board` added |

**Strengthened, not changed:** Nance's injury line (35/24/61/65/46 games in five
seasons), Robinson's availability (60/17/31/59/72), Horford's age (45 games at
39), Kuminga's "not yet a full-season starter" (career-high 46 starts), Payton's
"does not score much" (career 5.9 ppg).

## 5. What shipped

- `Production` type and a `production: Sourced<Production> | null` field on
  `FreeAgent`; `ageAtSigning`; `askBasis`.
- New `SourceTier` value `stats-database`, named separately for the
  independence reason in §1.
- Four numbers big on each card — PTS, REB, AST, and the one that separates the
  player from the next card in his role: **BLK for a big, 3P% for a guard or
  wing**. Without that fourth number Dosunmu and Grimes are the same card at a
  $4.3M price gap (14.8/3.4/3.6 vs 13.4/3.6/3.3, both 26, both 19 starts); the
  numbers that separate them are .439 vs .334 and the postseason.
- Age at signing and real contract term on the same card, in the same block.
- Points and age on the **projector market table**, right-aligned beside the
  price, so the two ladders can be compared down the wall in one look.
- Points a game on each **list row**, left of the price, so the inversion is
  visible without opening a card.
- Simplifications **S8** (ask basis) and **S9** (production is last season's).
- `REFRESH.board`.

## 6. Staleness

- **The twelve box-score lines are from a completed season and will not change.**
  They are the most durable facts in the module. What expires is the *framing*:
  the season label is printed on every card for exactly this reason, and the
  phrase "last season" is never used in product copy.
- **Ages age** — Vučević 2026-10-24, Payton 2026-12-01, Oubre 2026-12-09,
  Nance 2027-01-01, Kuminga 2026-10-06. Handled structurally: the card prints
  **age on the day he signed**, a fixed historical fact that pairs with the
  fixed historical price. Nothing in the module prints a player's current age.
- **basketball-reference's forward-season TEAM pages are stale and must never be
  used as a signing source.** `/teams/ATL/2027.html` listed Kuminga on Atlanta
  and `/teams/MIN/2027.html` omitted him, both read 2026-09-03, contradicted by
  the 2026-08-26 report of his Minnesota agreement. Every *other* board player's
  bbref team field matches `reallySignedWith`, which is what makes the one stale
  row dangerous.
- Three of six contract rows re-checked on 2026-09-03 disagreed with the file.
  Contract facts are the volatile half of the board; production is the stable half.

## 7. Rights and source

- What was gathered is **names and public statistics only**. No photograph,
  headshot, logo, mark, jersey, arena image or video is used or needed. Career
  arcs, draft position, birthplace, awards and championships are published
  factual records.
- basketball-reference is a Sports Reference LLC product. Individual box-score
  facts are public record; **bulk copying or scraping their tables into a
  shipped dataset is a different question and neither the researcher nor this
  document answers it.** Twelve hand-entered lines with per-row attribution and
  an `asOf`, sitting in `world.ts` exactly as the club figures do, is a dozen
  public statistics with attribution — not a dataset. **This is not a legal
  opinion and no rights-safety claim is made.** If anyone proposes automated
  ingestion, escalate before building it.

## 8. Classroom suitability — one flag, one decision

**Mitchell Robinson.** A published post reported 2026-07-05 explains that the
hand injury requiring surgery, which affected his catching during the 2026
Finals, was self-inflicted, immediately after he learned by phone that his
youngest brother had been in a car accident and appeared unresponsive on a
video call. The same post refers to personal and relationship difficulties.

**Decision: the injury is printable, the cause is not.** "He had hand surgery
and played the Finals hurt" is load-bearing and fine. The cause involves a
child's car accident and a self-inflicted injury; a grade 5-6 class will fixate
on it and it is not economics. Nothing in `world.ts` references it and nothing
should.

**No other conduct issue surfaced** for any of the twelve — but the screen was
shallow (targeted searches on four names) and **a systematic conduct check has
never been performed on this board.** Do not read "no findings" as a clearance.
That check is still outstanding and is a classroom-release blocker, not a
build-time one.

## 9. Still open

- **Role supply does not match role demand.** The board is 5 BIG / 4 GUARD /
  3 WING; the eight clubs' `jobs` arrays request 6 BIG / 6 WING / 4 GUARD. WING
  demand exceeds WING supply 2:1. That is a design fact, not a research finding,
  but it interacts directly with contestedness and with the outstanding P-VEC
  failures at boston/cheap-room and new-york/cheap-room.
- First-year salaries for Horford, Nurkić and Grimes were never located. If a
  source turns up, three `askBasis: "average"` rows become `"first-year"`.
- A systematic conduct/suitability screen of all twelve (see §8).
