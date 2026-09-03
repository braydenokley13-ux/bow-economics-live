# FREE AGENT BOARD — TRANSACTION RESEARCH

**Research date:** 2026-09-03
**Researcher role:** NBA transaction researcher (Sports Reality function, CLAUDE.md §5)
**Purpose:** populate the free-agent board of a Track 101 / M1-L3 lesson with players who
**genuinely reached free agency and signed a new contract** — after an independent Sports
Reality critic blocked four design candidates for placing real players in a free agency they
were never in.

## Method

1. Read `NBA_FINANCIAL_TRUTH.md` §4, §7, §8 first. Nothing on the §8.2 "DO NOT render"
   list is proposed here. No logo, mark, arena image or player photograph is proposed
   (§8.2 #22). No percentage, ratio, probability or negative number is used as a
   load-bearing quantity (§8.2 #21) — every strength/risk line below is written in plain
   language with whole-dollar or whole-count facts only.
2. Searched the 2026 offseason (the one that just happened) via WebSearch/WebFetch, then
   fetched the underlying articles. **Every player below is from the 2026 offseason.** No
   2025-offseason fallback was needed.
3. For each player, established: did he actually reach free agency (option declined, option
   expired, contract expired, waived-and-cleared), or was this an extension / opt-in
   dressed up as a signing? **Four candidates were rejected on exactly that test — see
   §"REJECTED".**
4. Two or more independent sources required per player. Where the second source is not
   genuinely independent (see the ESPN/NBA.com caveat below), it is flagged.

## Access failures this session (same pattern as dossier §7.9)

`spotrac.com` **HTTP 403**, `forbes.com` **HTTP 403**, `washingtonpost.com` **HTTP 403**,
`basketball-reference.com` not fetched. **There is therefore no cap-database-tier
verification of any dollar figure in this document.** Everything rests on reporting tier
plus NBA.com's editorial news posts.

## ⚠ THE INDEPENDENCE CAVEAT — READ BEFORE TRUSTING ANY NUMBER

Nearly every 2026 contract figure in circulation traces to **one reporter: Shams Charania
(ESPN)**. NBA.com's news posts, Hoops Rumors, NBC Sports, Yahoo, theScore and the local
outlets are frequently *reporting the same ESPN report*, not independently confirming it.
So "two sources" here usually means **two publishers, one origin**. This is a real weakness
and the designer should treat all dollar figures as *well-attributed reporting*, not as
league-published fact. The NBA has published no official transaction-terms release for any
of these deals.

## ⚠ AAV IS AN ARITHMETIC AVERAGE, NOT A CAP HIT

Reported totals are rounded ("2 years, $13 million"). NBA contracts have raises, so the
**first-year salary — the number a cap sheet actually charges — is usually lower than the
AAV.** Year-1 salary is confirmed for only six players below (Wade $9,000,000; LeBron and
Payton II $3,876,529; Watford $2,845,883; Sexton likely $9,366,000; Wiggins n/a). For
everyone else the AAV column is `total ÷ years` computed by me. **If the board charges AAV
against a cap, that is a simplification and must be logged per CLAUDE.md §3.**

## Exception-value mapping used (needs confirmation)

Dossier §8.1 #7 lists the three mid-level values **without labels**: $15,044,000 /
$9,366,000 / $6,064,000. Working from the 2025-26 analogues and corroborated by dossier
§7.6 (which establishes $6,064,000 as the 2026-27 **taxpayer** MLE via the tax-bracket
width), the mapping used here is:

| Exception | 2026-27 value |
|---|---|
| Non-taxpayer mid-level | $15,044,000 |
| Room exception | $9,366,000 |
| Taxpayer mid-level | $6,064,000 |

Two independent confirmations of this mapping appeared in the research: Dean Wade's
non-taxpayer MLE deal starts at $9,000,000 (comfortably under $15,044,000), and Collin
Sexton's "room exception" deal is reported as *"up to $19.2 million"* over two years —
which is exactly $9,366,000 + a 5% raise ($9,834,300) = **$19,200,300**. That arithmetic
match is strong evidence the room exception is $9,366,000. **Still: confirm before printing.**

## 2026 offseason calendar (needed to read the date columns)

Agreements were reported from **~June 21, 2026**; contracts could not actually be **signed
until July 6, 2026 at 12:01 p.m. ET**. Both dates are given below where known. Late-summer
deals (Green, Payton II, Harden, LeBron, Watford, Thompson) have a single real date.

---

# THE BOARD — 27 verified free agents

Sorted by price band, cheapest first. **Band letters match the brief.**
Position reduced to BIG / WING / GUARD.

| # | Player | Pos | Signed with | Left / re-signed | Date agreed | Date signed | Years | Total | **Annual (AAV)** | Mechanism | Conf. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **(a) VETERAN MINIMUM — about $2.0M-$3.9M** |
| 1 | Trendon Watford | WING | New Orleans | left Philadelphia (option declined) | — | Aug 17, 2026 | 1 | $2,900,000 | **$2,900,000** (min = $2,845,883) | veteran minimum (stated) | high |
| 2 | Nikola Vučević | BIG | Orlando | left Boston | Jul 1, 2026 | Jul 2, 2026 | 1 | $3,900,000 | **$3,900,000** | veteran minimum (stated) | high |
| 3 | Gary Payton II | GUARD | Golden State | re-signed Golden State | — | Aug 1, 2026 | 1 | $3,900,000 | **$3,876,529** (stated minimum) | veteran minimum (stated) | high |
| 4 | LeBron James | WING | Philadelphia | left LA Lakers | Jul 24, 2026 | Jul 26-27, 2026 | 2 | $7,946,884 | **$3,973,442** (yr 1 = $3,876,529) | veteran minimum + 5% raise | high |
| **(b) ABOVE MINIMUM, BELOW $6,064,000** |
| 5 | Larry Nance Jr. | BIG | Indiana | left Cleveland | — | Jul 8, 2026 | 1 | $4,000,000 | **$4,000,000** | not reported | high |
| 6 | Kenrich Williams | WING | Oklahoma City | re-signed OKC ($7.2M option declined) | — | Jul 6, 2026 | 1 | $5,000,000 | **$5,000,000** | not reported | medium |
| 7 | Klay Thompson | GUARD | Miami | waived by Dallas after buyout | Aug 22, 2026 (buyout) | Aug 24, 2026 | 2 | ~$11,480,000 | **~$5,740,000** | buyout → waivers → free agent | medium ⚠ |
| **(c) $6,064,000 – $9,366,000 (taxpayer-MLE to room-MLE)** |
| 8 | Anfernee Simons | GUARD | Philadelphia | left Boston | Jul 2, 2026 | Jul 6, 2026 | 2 | $12,300,000 | **$6,150,000** | not reported | medium |
| 9 | Jordan Goodwin | GUARD | Phoenix | re-signed Phoenix | ~Jun 21-26, 2026 | Jul 2026 | 3 | $19,000,000 | **$6,333,333** | not reported | medium |
| 10 | Marcus Smart | GUARD | Houston | left LA Lakers (opted out) | ~Jul 1, 2026 | Jul 10, 2026 | 2 | $13,000,000 | **$6,500,000** | taxpayer mid-level (1 source) | medium |
| 11 | Al Horford | BIG | Golden State | re-signed GSW ($6M option declined) | Jun 25, 2026 | Jul 6, 2026 | 2 | $14,000,000 | **$7,000,000** | not reported | high |
| 12 | Kelly Oubre Jr. | WING | Indiana | left Philadelphia | Jul 1, 2026 | Jul 7, 2026 | 2 | $17,000,000 | **$8,500,000** | not reported | high |
| **(d) $9,366,000 – $15,044,000 (non-taxpayer-MLE band)** |
| 13 | Collin Sexton | GUARD | LA Lakers | left Chicago | Jul 1, 2026 | Jul 12, 2026 | 2 | $19,000,000 (up to $19,200,300) | **$9,500,000–$9,600,150** | **room exception** (stated) | high |
| 14 | Dean Wade | WING | Philadelphia | left Cleveland | Jun 30, 2026 | Jul 6, 2026 | 4 | $39,000,000 | **$9,750,000** (yr 1 = $9,000,000) | **non-taxpayer MLE** (stated) | high |
| 15 | Jusuf Nurkić | BIG | Utah | re-signed Utah | Jun 29, 2026 | Jul 9, 2026 | 2 | $22,000,000 | **$11,000,000** | not reported | high |
| 16 | Mark Williams | BIG | Phoenix | re-signed Phoenix (restricted FA) | Jun 26, 2026 | Jul 7, 2026 | 3 | $38,000,000 | **$12,666,667** | restricted free agency | high |
| 17 | Quentin Grimes | GUARD | LA Lakers | left Philadelphia | Jul 1, 2026 | Jul 2026 | 4 | $60,000,000 | **$15,000,000** | not reported | high |
| **(e) $15,044,000 – ~$26,000,000 (requires real cap room)** |
| 18 | Tobias Harris | WING | San Antonio | left Detroit | ~Jul 1, 2026 | Jul 6-7, 2026 | 2 | $31,000,000 | **$15,500,000** | **non-taxpayer MLE** (1 source) | high (terms) / medium (mechanism) |
| 19 | Tari Eason | WING | Houston | re-signed Houston (restricted FA) | Jul 2, 2026 | Jul 9, 2026 | 5 | $81,500,000 | **$16,300,000** | restricted free agency | high |
| 20 | Ayo Dosunmu | GUARD | Minnesota | re-signed Minnesota | ~Jun 22, 2026 | Jul 10, 2026 | 5 | $112,000,000 | **$22,400,000** | not reported | high |
| 21 | Norman Powell | WING | Chicago | left Miami | Jul 1, 2026 | Jul 10, 2026 | 2 | $45,000,000 | **$22,500,000** | not reported (Bulls had room) | high |
| 22 | Coby White | GUARD | Charlotte | re-signed Charlotte | Jun 25, 2026 | Jul 6, 2026 | 3 | $74,000,000 | **$24,666,667** | **cap room** (1 source) | high |
| 23 | Isaiah Hartenstein | BIG | Oklahoma City | re-signed OKC ($28.5M option declined) | Jun 26, 2026 | Jul 6, 2026 | 3 | $75,000,000 | **$25,000,000** | not reported | **medium ⚠** |
| **(f) ABOVE $26,000,000 (requires a lot of cap room)** |
| 24 | Draymond Green | BIG | Golden State | re-signed GSW ($27.6M option declined) | Jul 29, 2026 | Jul 30, 2026 | 1 | $27,700,000 | **$27,700,000** | not reported (Bird rights presumed) | high |
| 25 | James Harden | GUARD | Cleveland | re-signed Cleveland (opted out) | Aug 20, 2026 | Aug 2026 | 3 | $97,000,000 | **$32,333,333** | not reported (Bird rights presumed) | high |
| 26 | Walker Kessler | BIG | LA Lakers | left Utah (restricted FA) | Jul 1, 2026 | Jul 9, 2026 | 4 | $129,470,000 (rep. "$130M") | **$32,367,500** | **sign-and-trade** | high (terms) / medium (mechanism wording) |
| 27 | Trae Young | GUARD | Washington | re-signed Washington ($49M option declined) | Jun 22, 2026 | Jul 6, 2026 | 4 | ~$212,000,000 | **~$53,000,000** | not reported (cap room / Bird) | medium ⚠ (total is "approximately") |

**27 players. Band counts: (a) 4 · (b) 3 · (c) 5 · (d) 5 · (e) 6 · (f) 4.**
Every band has at least two, and BIG / WING / GUARD are all represented in every band except
(f), which has BIG and GUARD but no wing.

---

# PER-PLAYER NOTES

Each entry: how he reached free agency · one plain-language strength · one plain-language
risk · sources with tier · confidence.

> **On the strength/risk lines.** These are *my plain-language renderings* of facts found in
> the cited reporting. Every number inside them (games played, season averages) came from
> the sources listed. They are editorial summaries, not quotations, and a Sports Reality
> reviewer should re-read them against the sources before they reach a student screen.

---

## BAND (a) — VETERAN MINIMUM

### 1. Trendon Watford — WING — New Orleans Pelicans
- **Reached free agency:** Philadelphia declined his $2,800,000 team option in late June 2026.
- **Terms:** 1 year, $2,900,000. Signed **Aug 17, 2026**. His league minimum for 2026-27 is
  **$2,845,883**, so this is a minimum contract.
- **Strength (plain):** "He is only 25 — the youngest cheap player on this board — and he can
  pass, rebound and score a little, so he fills whatever hole is left."
- **Risk (plain):** "His old team decided he was not worth $2,800,000 and let him go, and he
  waited until late August before anyone signed him. He was also talking to a team in Europe."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49638189/trendon-watford-pelicans-agree-1-year-29m-deal) (reputable reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/08/trendon-watford-to-sign-one-year-deal-with-pelicans.html) (cap-database/reporting; supplied the $2,845,883 minimum) ·
  [TSN](https://www.tsn.ca/nba/article/report-watford-pelicans-agree-to-one-year-29m-deal-n1-49638189/) (reporting)
- **Confidence: HIGH.** Terms and the minimum-salary figure are both explicit.

### 2. Nikola Vučević — BIG — Orlando Magic
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 1 year, $3,900,000 — described in the NBA.com post as "a one-year, $3.9 million
  **minimum** contract." Agreed **Jul 1, 2026**, confirmed **Jul 2, 2026**.
- **Left:** Boston (he was traded Chicago → Boston in February 2026).
- **Strength (plain):** "A 35-year-old centre who has scored and rebounded in this league for
  fifteen years — the most experienced big man you can get at the lowest price."
- **Risk (plain):** "He is 35 and last season he played only sixteen games for his team and
  scored under ten points a game — a long way from his best years."
- **Sources:** [NBA.com](https://www.nba.com/news/nikola-vucevic-returning-to-magic-on-1-year-deal) (official-nba, editorial) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49236864/sources-nikola-vucevic-reuniting-magic-1-year-deal) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/nikola-vucevic-signing-one-year-deal-with-magic.html) (reporting)
- **Confidence: HIGH.**
- **Teaching value:** a former All-Star at the same price as a bench player. Best cheap-BIG
  card on the board.

### 3. Gary Payton II — GUARD — Golden State Warriors
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 1 year, $3,900,000, signed **Aug 1, 2026**. Hoops Rumors states his minimum for
  2026-27 is **$3,876,529** and Golden State's cap charge is only **$2,449,421**.
- **Strength (plain):** "One of the best defenders you can buy this cheaply — his whole job is
  making the other team's best guard uncomfortable."
- **Risk (plain):** "He barely shoots — last season he made fewer than three of every ten
  three-point shots — so the other team can ignore him and crowd your scorers."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49507200/sources-warriors-bring-back-gary-payton-ii-vet-minimum) (reporting) ·
  [NBC Sports](https://www.nbcsports.com/nba/news/gary-payton-ii-returns-to-warriors-on-one-year-3-9-million-contract) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/08/warriors-to-re-sign-gary-payton-ii-2.html) (cap-database/reporting) ·
  [theScore](https://www.thescore.com/nba/news/3573590/warriors-re-sign-payton-to-reported-1-year-3-9-m-deal) (reporting)
- **Confidence: HIGH.** Four publishers and an explicit minimum-scale figure.
- **Note:** the $2,449,421 cap charge vs $3,876,529 paid salary is the **minimum-salary
  reimbursement rule** — a genuinely interesting economics beat, but it is NOT on the §8.1
  safe list and would need its own verification before use.

### 4. LeBron James — WING — Philadelphia 76ers
- **Reached free agency:** contract with the Lakers expired; he signed elsewhere. Unrestricted.
- **Terms:** 2 years, **$7,946,884**, announced **Jul 24, 2026**, official **Jul 26-27, 2026**.
  AAV **$3,973,442**. He earned nearly **$53,000,000** the season before.
- **This is a veteran minimum contract — arithmetic proof:** $3,876,529 (the 2026-27 ten-plus-year
  minimum, from the Payton II reporting) + a 5% raise ($4,070,355) = **$7,946,884 exactly**.
- **Strength (plain):** "He has scored more points than anyone in the history of the league,
  and he costs the least the rules allow anyone to be paid."
- **Risk (plain):** "He is 41 years old. Every team knows the price is low because nobody knows
  how many good games are left."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49440164/lebron-chooses-76ers-sign-2-year-8-million-contract) (reporting) ·
  [NBA.com](https://www.nba.com/news/lebron-james-free-agency-sixers-2026) (official-nba, editorial) ·
  [CBS Sports](https://www.cbssports.com/nba/news/lebron-james-76ers-contract-explained/) (reporting) ·
  [ABC7](https://abc7ny.com/story/lebron-chooses-76ers-will-sign-2-year-8-million-contract/19569047/) (reporting; supplied the exact $7,946,884)
- **Confidence: HIGH** on terms. **Note:** NBA.com's post says the deal is "not technically a
  veteran minimum contract" — the arithmetic above says otherwise. The exact-dollar total
  ($7,946,884) came from one outlet; the "$8 million / 2 years" shape is everywhere.
- **Teaching value: the single most valuable card on this board.** The most famous player alive
  is the *cheapest* thing you can buy. It detonates the assumption that price equals quality
  and forces the argument the lesson wants.

---

## BAND (b) — ABOVE THE MINIMUM, BELOW $6,064,000

### 5. Larry Nance Jr. — BIG — Indiana Pacers
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 1 year, **$4,000,000**, signed **Jul 8, 2026**. Left Cleveland.
- **Strength (plain):** "A big man who has played ten seasons and knows exactly where to stand —
  teams keep hiring him to make the rest of the group work."
- **Risk (plain):** "Last season he got into only 35 of 82 games and played under thirteen
  minutes a night, scoring under four points a game."
- **Sources:** [NBC Sports](https://www.nbcsports.com/fantasy/basketball/player-news/2026-07-08/larry-nance-jr-signs-one-year-deal-with-pacers) (reporting, quoting ESPN's Charania) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/pacers-add-ex-lebron-james-193537529.html) (reporting) ·
  [WISH-TV](https://www.wishtv.com/news/pacers-add-frontcourt-depth-sign-forward-larry-nance-jr-in-free-agency/) (reporting) ·
  stats: [RotoWire / ESPN game log](https://www.espn.ph/nba/player/gamelog/_/id/2580365/larry-nance-jr) (reporting)
- **Confidence: HIGH** on terms; the **strength line is qualitative** and should be sharpened
  by a reviewer with a real stat.

### 6. Kenrich Williams — WING — Oklahoma City Thunder
- **Reached free agency:** OKC declined his ~**$7,200,000** option for 2026-27; he then re-signed
  for less.
- **Terms:** 1 year, **$5,000,000**, signed **Jul 6, 2026**.
- **Strength (plain):** "A seven-year man on a championship team whose job is doing the small
  useful things — he makes almost four of every ten three-point shots."
- **Risk (plain):** "He missed the first 18 games of last season recovering from knee surgery,
  and in the playoffs he played only about six minutes a game."
- **Sources:** [Hoops Rumors](https://www.hoopsrumors.com/2026/07/thunder-to-re-sign-kenrich-williams.html) (cap-database/reporting) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/thunder-sign-kenrich-williams-one-215614046.html) (reporting, sourced to Chris Haynes) ·
  stats: [CBS Sports](https://www.cbssports.com/nba/players/2152923/kenrich-williams/) (reporting)
- **Confidence: MEDIUM.** ⚠ **The $5,000,000 figure traces to a single reporter (Chris Haynes).**
  Hoops Rumors repeats it. Flagged per brief rule 4.

### 7. Klay Thompson — GUARD — Miami Heat ⚠ FLAGGED
- **Reached free agency:** **NOT through the July signing window.** Dallas executed a **contract
  buyout Aug 22, 2026**; he **cleared waivers** and signed with Miami **Aug 24, 2026**. He was
  due $17,500,000 in the final year of his Dallas deal.
- **Terms:** 2 years, reported as "approximately $11.5 million" (NBA.com) / "nearly $13 million"
  (ESPN) / **$11,480,000** (one aggregator). Second year at his option. AAV **~$5,740,000**.
- **Strength (plain):** "One of the best shooters who has ever played — you sign him to make the
  floor bigger for everyone else."
- **Risk (plain):** "He is 36, and his last team paid him money to leave rather than keep him."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49706703/klay-thompson-lands-heat-clearing-waivers) (reporting) ·
  [NBA.com](https://www.nba.com/news/klay-thompson-heat-2026-free-agency) (official-nba, editorial) ·
  [Hot Hot Hoops](https://hothothoops.com/2026/08/21/grading-miami-heat-signing-klay-thompson/) (reporting)
- **Confidence: MEDIUM.** ⚠ **Two separate problems.** (1) The exact total is **inconsistent
  across sources** ($11.48M vs "nearly $13M"). (2) He is a **buyout-market** free agent, not a
  free-agency-window free agent. If the lesson's fiction is "the signing window," this is a
  different economic event and may mislead. **Designer decision required.** Do not use the
  first-apron buyout restriction (dossier §7.2, unresolved) to explain anything here.

---

## BAND (c) — $6,064,000 to $9,366,000

### 8. Anfernee Simons — GUARD — Philadelphia 76ers
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 2 years, **$12,300,000**, player option in year 2. Agreed **Jul 2, 2026**, signed
  **Jul 6, 2026**. AAV **$6,150,000**.
- **Strength (plain):** "A guard who can come off the bench and score in a hurry — his job is
  points, and he gets them fast."
- **Risk (plain):** "He signed for about half of what a starting guard costs, which tells you
  what the rest of the league thought he was worth."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49250070/sources-anfernee-simons-agrees-deal-revamped-76ers) (reporting) ·
  [Philadelphia Inquirer](https://www.inquirer.com/sixers/2026-nba-free-agency-sixers-anfernee-simons-jaylen-brown-mike-gansey-20260702.html) (reporting) ·
  [NBA.com](https://www.nba.com/sixers/news/philadelphia-76ers-sign-anfernee-simons) (team-official)
- **Confidence: MEDIUM.** Terms are solid; the **risk line is my inference from the price**, not
  a sourced fact. Rewrite it before use.

### 9. Jordan Goodwin — GUARD — Phoenix Suns
- **Reached free agency:** was on a non-guaranteed deal that expired. Unrestricted.
- **Terms:** 3 years, **$19,000,000**, player option year 3. AAV **$6,333,333**. Reported
  ~**Jun 21-26, 2026**; signed July 2026.
- **Strength (plain):** "He took the ball away from the other team more times than anyone else
  on his club last season — 106 steals."
- **Risk (plain):** "He made the roster last season only because he earned a spot in training
  camp; he had no guaranteed contract at all."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49135466/sources-suns-jordan-goodwin-set-3-year-19m-deal) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/06/suns-jordan-goodwin-agree-to-three-year-deal.html) (reporting) ·
  [Arizona Sports](https://arizonasports.com/nba/phoenix-suns/jordan-goodwin-re-signs-2026) (reporting)
- **Confidence: MEDIUM.** Terms are well-attested; **the exact agreement date is not** (one
  low-tier source gives Jun 21, which is unusually early).

### 10. Marcus Smart — GUARD — Houston Rockets
- **Reached free agency:** **opted out** of his Lakers contract.
- **Terms:** 2 years, **$13,000,000**, player option year 2. Agreed ~**Jul 1, 2026**, official
  **Jul 10, 2026**. AAV **$6,500,000**.
- **Mechanism:** reported as the **taxpayer mid-level exception** — one source only.
- **Strength (plain):** "He was voted the best defensive player in the entire league in 2022;
  his job is to make the other team's best guard miserable."
- **Risk (plain):** "He does not score much, and he chose to give up guaranteed money to leave
  his last team — a bet on himself that has to pay off."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49235334/sources-marcus-smart-agrees-2-year-13m-deal-rockets) (reporting) ·
  [NBA.com](https://www.nba.com/news/marcus-smart-free-agency-2026) (official-nba, editorial) ·
  [Houston Chronicle](https://www.houstonchronicle.com/sports/rockets/article/houston-marcus-smart-free-agency-22326721.php) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/rockets-marcus-smart-agree-to-two-year-deal.html) (reporting)
- **Confidence: MEDIUM.** Terms HIGH; **mechanism claim is single-sourced and does not
  reconcile**: a full two-year taxpayer MLE at $6,064,000 with a 5% raise totals $12,431,200,
  not $13,000,000. Either the reported total is rounded up or the exception label is wrong.
  **Do not print "taxpayer mid-level" for this player without resolving that.**

### 11. Al Horford — BIG — Golden State Warriors
- **Reached free agency:** **declined his $6,000,000 player option**.
- **Terms:** 2 years, **$14,000,000**, fully guaranteed, trade kicker, player option year 2.
  Agreed **Jun 25, 2026**, official **Jul 6, 2026**. AAV **$7,000,000**.
- **Strength (plain):** "About to play his twentieth season — nobody available has seen more,
  and he can guard big men and still shoot from outside."
- **Risk (plain):** "He is 40 years old. Nobody has any idea how many nights he can still play."
- **Sources:** [NBC Sports Bay Area](https://www.nbcsportsbayarea.com/nba/golden-state-warriors/al-horford-contract-return-analysis/1945814/) (reporting) ·
  [SF Chronicle](https://www.sfchronicle.com/sports/warriors/article/warriors-al-horford-signs-new-two-year-deal-22320521.php) (reporting) ·
  [Yahoo Sports / AP](https://sports.yahoo.com/articles/warriors-sign-al-horford-two-154248654.html) (reporting)
- **Confidence: HIGH.** Also a fine economics beat on its own: he **turned down $6,000,000
  guaranteed to get $14,000,000 over two years.**

### 12. Kelly Oubre Jr. — WING — Indiana Pacers
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 2 years, **$17,000,000**. Agreed **Jul 1, 2026**, official **Jul 7, 2026**.
  AAV **$8,500,000**. Left Philadelphia after three seasons.
- **Strength (plain):** "He scored about fourteen points a game last season — the cheapest real
  scorer on this board."
- **Risk (plain):** "He played only 41 of 82 games last season, so you are paying for a player
  who was available about half the time."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49239804/pacers-kelly-oubre-jr-agree-two-year-deal-sources-say) (reporting) ·
  [NBA.com](https://www.nba.com/news/kelly-oubre-jr-pacers-free-agency-2026) (official-nba, editorial) ·
  [Forbes](https://www.forbes.com/sites/tonyeast/2026/07/01/indiana-pacers-to-sign-free-agent-wing-kelly-oubre-to-two-year-deal/) (reporting; headline only, page 403) ·
  [Philadelphia Inquirer](https://www.inquirer.com/sixers/2026-nba-free-agency-kelly-oubre-sixers-pacers-quentin-grimes-20260701.html) (reporting)
- **Confidence: HIGH.** The "41 of 82 games" and "14.1 points" both come from the NBA.com post.

---

## BAND (d) — $9,366,000 to $15,044,000

### 13. Collin Sexton — GUARD — Los Angeles Lakers
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 2 years, **$19,000,000** ("up to $19.2 million"), player option year 2. Agreed
  **Jul 1, 2026**, signed **Jul 12, 2026**. AAV **$9,500,000-$9,600,150**. Left Chicago
  (Charlotte → Chicago mid-season, Feb 6, 2026).
- **Mechanism: the ROOM EXCEPTION**, explicitly stated by Hoops Rumors — and the "$19.2 million"
  ceiling is *exactly* $9,366,000 + 5%. **This is the cleanest mechanism example on the board.**
- **Strength (plain):** "He scored about fifteen points a game last season — you are buying
  scoring off the bench, and you know roughly what you get every night."
- **Risk (plain):** "He has now been traded twice in about a year and a half. Three different
  teams looked at him and decided to move on."
- **Sources:** [Hoops Rumors](https://www.hoopsrumors.com/2026/07/lakers-collin-sexton-agree-to-two-year-deal.html) (cap-database/reporting; mechanism + $19.2M) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/lakers-sign-collin-sexton-two-173539177.html) (reporting) ·
  [Lakers Nation](https://lakersnation.com/lakers-sign-collin-sexton-to-two-year-contract/) (reporting) ·
  stats: [CBS Sports](https://www.cbssports.com/nba/players/2891955/collin-sexton/splits/) (reporting)
- **Confidence: HIGH.**

### 14. Dean Wade — WING — Philadelphia 76ers
- **Reached free agency:** contract expired after seven seasons in Cleveland. Unrestricted.
- **Terms:** 4 years, **$39,000,000**, **first-year salary exactly $9,000,000** with 5% annual
  raises, partial guarantee in year 4. Agreed **Jun 30, 2026**, official **Jul 6, 2026**.
  AAV **$9,750,000**.
- **Mechanism: NON-TAXPAYER MID-LEVEL EXCEPTION** (stated by PhillyVoice, which also notes it
  hard-caps Philadelphia at the first apron). **Second-cleanest mechanism example.**
- **Strength (plain):** "He is six-foot-nine with arms seven feet across and he can guard almost
  anybody on the other team, big or small."
- **Risk (plain):** "He has never been a scorer. If you sign him you are paying real money for a
  player who will not put many points on the board."
- **Sources:** [NBA.com](https://www.nba.com/news/dean-wade-76ers-deal) (official-nba, editorial) ·
  [PhillyVoice](https://www.phillyvoice.com/sixers-signing-dean-wade-four-year-39-million-contract-stats-highlights-bio-mike-gansey-nba-free-agency/) (reporting; supplied the $9,000,000 start + NTMLE) ·
  [Philadelphia Inquirer](https://www.inquirer.com/sixers/nba-free-agency-sixers-dean-wade-mike-gansey-cavaliers-20260630.html) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/06/sixers-dean-wade-agree-to-four-year-deal.html) (reporting)
- **Confidence: HIGH.** The only player on this board with a **confirmed first-year salary and a
  confirmed exception**. If the lesson needs one worked mechanism example, use this one.

### 15. Jusuf Nurkić — BIG — Utah Jazz
- **Reached free agency:** contract expired. **Unrestricted** (stated by Hoops Rumors).
- **Terms:** 2 years, **$22,000,000**. Agreed **Jun 29, 2026**, official **Jul 9, 2026**.
  AAV **$11,000,000**.
- **Strength (plain):** "Last season he averaged about eleven points, ten rebounds and five
  passes that led directly to a basket — only two other players in the league did all three."
- **Risk (plain):** "He was only the starter because the team's real starting centre got hurt
  and missed almost the whole season."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49219281/nurkic-intends-sign-two-year-contract-jazz) (reporting) ·
  [NBA.com](https://www.nba.com/news/jusuf-nurkic-set-for-return-to-jazz-on-new-2-year-contract) (official-nba, editorial; years + dates, **no dollars**) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/06/jazz-jusuf-nurkic-agree-to-two-year-deal.html) (cap-database/reporting; $22M + UFA status) ·
  [Deseret News](https://www.deseret.com/sports/2026/06/29/jusuf-nurkic-returns-to-utah-jazz-new-two-year-deal/) (reporting)
- **Confidence: HIGH.** Note NBA.com carried the deal **without a dollar figure**; the $22M comes
  from Hoops Rumors and Yahoo.

### 16. Mark Williams — BIG — Phoenix Suns
- **Reached free agency:** **restricted free agent** after his rookie contract, explicitly
  stated by NBA.com.
- **Terms:** 3 years, **$38,000,000**, fully guaranteed. Agreed **Jun 26, 2026**, official
  **Jul 7, 2026**. AAV **$12,666,667**.
- **Strength (plain):** "He is seven-foot-one and almost everything he shoots goes in — nearly
  two of every three attempts, because he takes them right at the rim."
- **Risk (plain):** "Before last season he had never played more than 44 games in a year, and
  last season a foot injury still cost him fifteen games in March."
- **Sources:** [NBA.com](https://www.nba.com/news/mark-williams-return-to-suns) (official-nba, editorial; confirms RFA status) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49180880/sources-mark-williams-return-suns-3-year-38m-deal) (reporting) ·
  [Arizona Sports](https://arizonasports.com/nba/phoenix-suns/re-sign-mark-williams-to-3-year-deal) (reporting) ·
  games-played history: [CBS Sports game log](https://www.cbssports.com/nba/players/3178196/mark-williams/game-log/) (reporting)
- **Confidence: HIGH** on terms; **MEDIUM** on the exact games-played history (two sources gave
  60 games and "56 as of April 1"; both agree the prior three seasons were 43 / 19 / 44).

### 17. Quentin Grimes — GUARD — Los Angeles Lakers
- **Reached free agency:** played the 2025-26 season on his **$8,700,000 qualifying offer** after
  a stalled restricted free agency, which made him **unrestricted** in 2026.
- **Terms:** 4 years, **$60,000,000**, player option year 4. Agreed **Jul 1, 2026**.
  AAV **$15,000,000**.
- **Strength (plain):** "He scored about thirteen points a game last season and he is only in his
  mid-twenties — you are paying for the years ahead, not the years behind."
- **Risk (plain):** "His old team would not give him a long contract two years running, and last
  season he played about 54 of 82 games."
- **Sources:** [Philadelphia Inquirer](https://www.inquirer.com/sixers/2026-free-agency-quentin-grimes-sixers-lakers-daryl-morey-20260701.html) (reporting) ·
  [NBC Sports Philadelphia](https://www.nbcsportsphiladelphia.com/nba/philadelphia-76ers/quentin-grimes-lakers-sixers-nba-free-agency-2026/739816/) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/lakers-to-sign-quentin-grimes-to-four-year-contract.html) (reporting) ·
  stats: [76ers official](https://www.nba.com/sixers/76ers-players/quentin-grimes) (team-official)
- **Confidence: HIGH** on terms. **MEDIUM** on the stat line — three sources gave three different
  season averages (13.4 / 13.9 / 12.6 points). The team-official page (12.6 points, 54 games)
  should win. **Fix the strength line to "about thirteen points" or use the team figure.**
- **Note:** at **$15,000,000** he sits $44,000 under the non-taxpayer MLE. Useful boundary card.

---

## BAND (e) — $15,044,000 to about $26,000,000

### 18. Tobias Harris — WING — San Antonio Spurs
- **Reached free agency:** contract expired after two seasons in Detroit. Unrestricted.
- **Terms:** 2 years, **$31,000,000**, fully guaranteed. Agreed ~**Jul 1, 2026**; official
  **Jul 6-7, 2026** (NBA.com says Jul 6; San Antonio Current says Jul 7). AAV **$15,500,000**.
- **Mechanism:** reported as **San Antonio's full non-taxpayer mid-level exception** — **one
  source**. The arithmetic supports it: $15,044,000 + a 5% raise ($15,796,200) = **$30,840,200**,
  which rounds to the reported "$31 million."
- **Strength (plain):** "He has scored in double figures for fifteen straight seasons — the most
  reliable scorer on the board, and he scored even more in the playoffs (about eighteen a game)."
- **Risk (plain):** "He is 33 and his old team, which had just made the playoffs, let him leave
  without a fight."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49240686/sources-spurs-land-2-year-31m-deal-tobias-harris) (reporting) ·
  [NBA.com](https://www.nba.com/news/tobias-harris-spurs-free-agency-2026) (official-nba, editorial) ·
  [San Antonio Current](https://www.sacurrent.com/arts/sports-and-recreation/san-antonio-spurs-sign-tobias-harris-in-31-million-two-year-deal/) (reporting) ·
  [NBC Sports](https://www.nbcsports.com/fantasy/basketball/player-news/2026-07-01/shams-spurs-sign-tobias-harris-for-two-years) (reporting)
- **Confidence: HIGH** on terms; **MEDIUM** on mechanism (single source, though the arithmetic
  corroborates). **He left Detroit — a student seat — which makes him a strong narrative card.**
- **Boundary note:** his AAV is band (e) but his **first-year salary is band (d)'s ceiling**.
  If the board charges year-1 salary rather than AAV he moves bands. Decide which, and be
  consistent, before this ships.

### 19. Tari Eason — WING — Houston Rockets
- **Reached free agency:** **restricted free agent**; he turned down a rookie-scale extension in
  autumn 2025 and played the season out, which paid off.
- **Terms:** 5 years, **$81,500,000** (ESPN, Yahoo, Hoops Rumors) — **NBA.com's team-release post
  says $81 million**. Fully guaranteed, player option year 5. Agreed **Jul 2, 2026**, official
  **Jul 9, 2026**. AAV **$16,300,000**.
- **Strength (plain):** "He takes the ball away from the other team more than almost anyone —
  and he is still in his early twenties, so he should keep getting better."
- **Risk (plain):** "He has never scored more than about eleven points a game. You are paying
  for what he might become."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49253596/sources-eason-return-rockets-5-year-815m-deal) (reporting) ·
  [NBA.com](https://www.nba.com/news/tari-eason-free-agency-2026) (official-nba; **$81M, not $81.5M**) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/rockets-tari-eason-agree-to-five-year-deal.html) (reporting) ·
  [Yahoo Sports](https://sports.yahoo.com/nba/article/restricted-free-agent-tari-eason-agrees-to-5-year-815-million-deal-to-remain-with-rockets-001537252.html) (reporting)
- **Confidence: HIGH** on the deal; ⚠ **$500,000 discrepancy between NBA.com and everyone else.**
  Use "about $81 million" or resolve it.
- **Teaching value:** he **bet on himself and won** — a live decision-under-uncertainty case.

### 20. Ayo Dosunmu — GUARD — Minnesota Timberwolves
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** **5 years, $112,000,000**, player option year 5, ~$19,000,000 in year 1 rising from
  there. Official **Jul 10, 2026**. AAV **$22,400,000**.
- **Strength (plain):** "He played the best basketball of his life in the playoffs, which is when
  it counts most — his team made re-signing him their first job of the summer."
- **Risk (plain):** "He is being paid like a star because of one good postseason, not because of
  years of it."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49150075/dosunmu-gets-5-year-112m-deal-timberwolves) (reporting) ·
  [NBA.com](https://www.nba.com/news/reports-ayo-dosunmu-to-re-sign-with-timberwolves) (official-nba, editorial) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/timberwolves-sign-ayo-dosunmu-five-050100065.html) (reporting) ·
  [SI](https://www.si.com/nba/timberwolves/onsi/ayo-dosunmu-staying-with-timberwolves-on-reported-112-million-contract) (reporting)
- **Confidence: HIGH** on terms. **MEDIUM** on the year-1 figure (~$19M, one source). The
  **strength and risk lines are both editorial characterisations** of the reporting rather than
  quoted stats — sharpen before use.
- **Note:** brief-conflict check — the NBA.com offseason page listed him as a "4-year deal"; four
  other sources say five years. **Use five.**

### 21. Norman Powell — WING — Chicago Bulls
- **Reached free agency:** contract expired. Unrestricted.
- **Terms:** 2 years, **$45,000,000**, team option 2027-28. Agreed **Jul 1, 2026**, official
  **Jul 10, 2026**. AAV **$22,500,000**. Left Miami.
- **Strength (plain):** "He scored about twenty-two points a game last season and was picked as
  an All-Star for the first time — the best pure scorer on this board."
- **Risk (plain):** "That was the best season of his career and it happened at 33. You are
  betting it happens again."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49236176/sources-norman-powell-agrees-2-year-45m-deal-bulls) (reporting) ·
  [NBA.com](https://www.nba.com/news/norman-powell-free-agency-2026) (official-nba, editorial) ·
  [Chicago Sun-Times](https://chicago.suntimes.com/bulls/2026/07/01/bulls-start-of-free-agency-but-land-norman-powell) (reporting) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/bulls-norman-powell-agree-to-two-year-contract.html) (reporting)
- **Confidence: HIGH** on terms and the 21.7-points / first-All-Star facts (both from NBA.com).
  **Mechanism not reported.** His exact age is my inference — verify before printing it.

### 22. Coby White — GUARD — Charlotte Hornets
- **Reached free agency:** **unrestricted**; he had **turned down a four-year, $87,000,000
  extension offer from Chicago** to test the market.
- **Terms:** 3 years, **$74,000,000**, fully guaranteed, **no player or team options**. Agreed
  **Jun 25, 2026**, official **Jul 6, 2026**. AAV **$24,666,667**.
- **Mechanism: cap room**, created partly by trading LaMelo Ball away — **one source**.
- **Strength (plain):** "After he arrived in Charlotte he scored about sixteen points a game, and
  he signed a fully guaranteed deal with no escape clauses either way."
- **Risk (plain):** "The team he actually did that for only saw him play 21 games. Almost
  $25,000,000 a year rests on a small sample."
- **Sources:** [ESPN / Hoops Rumors](https://www.hoopsrumors.com/2026/06/hornets-to-re-sign-coby-white-on-three-year-contract.html) (cap-database/reporting; UFA + cap room + the declined $87M) ·
  [NBA.com](https://www.nba.com/news/hornets-coby-white-free-agency-2026) (official-nba, editorial) ·
  [NBC Sports](https://www.nbcsports.com/fantasy/basketball/player-news/2026-06-25/shams-hornets-sign-coby-white-to-three-year-deal) (reporting) ·
  [Bleacher Report](https://bleacherreport.com/articles/25425926-coby-white-lands-new-hornets-contract-after-lamelo-ball-trade-full-details-revealed-nba-rumors) (reporting)
- **Confidence: HIGH** on terms; **MEDIUM** on the cap-room mechanism and on the declined-$87M
  detail (both single-source).
- **Teaching value:** he **turned down $87,000,000 over four years and took $74,000,000 over
  three** — same annual money, two fewer years of risk. A genuine opportunity-cost case.

### 23. Isaiah Hartenstein — BIG — Oklahoma City Thunder ⚠ FLAGGED
- **Reached free agency:** reported as OKC **declining his $28,500,000 team option** and
  re-signing him for less per year (NBC Sports, Yahoo, Hoops Rumors). **NBA.com's post calls it
  an "extension"** and frames it as "$75 million in new money," which is a different transaction
  type. **The two accounts are not compatible.**
- **Terms:** 3 years, **$75,000,000**, 15% trade kicker, mutual option year 3. Agreed
  **Jun 26, 2026**, official **Jul 6, 2026**. AAV **$25,000,000**.
- **Strength (plain):** "A seven-foot centre who was a starter on a team that won the
  championship — this is the only proven big man in this price range."
- **Risk (plain):** "His team decided he was worth $3,500,000 a year less than his old deal, and
  they only agreed to a third year that either side can walk away from."
- **Sources:** [NBC Sports](https://www.nbcsports.com/nba/news/thunder-reportedly-to-turn-down-isaiah-hartensteins-option-re-sign-him-for-three-years-75-million) (reporting; option-decline account) ·
  [NBA.com](https://www.nba.com/news/thunder-sign-isaiah-hartenstein-through-2028-29-season) (official-nba; **"extension" account**) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/06/thunder-isaiah-hartenstein-agree-to-three-year-deal-2.html) (reporting) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/thunder-reportedly-turn-down-isaiah-093051376.html) (reporting)
- **Confidence: MEDIUM.** ⚠ **This is the one entry on the board where "did he actually reach
  free agency?" is genuinely contested — the exact failure mode the Sports Reality critic
  blocked the last four designs for.** Terms are solid; *status* is not. **Either resolve it
  against a fifth source or drop him.** He is currently the **only BIG in band (e)** — see the
  gap analysis below.

---

## BAND (f) — ABOVE $26,000,000

### 24. Draymond Green — BIG — Golden State Warriors
- **Reached free agency:** **declined a $27,600,000 player option** before the 2026 window,
  which gave Golden State flexibility to chase LeBron James. When James chose Philadelphia,
  Green re-signed — for **$100,000 more than the option he turned down**.
- **Terms:** 1 year, **$27,700,000**. No no-trade clause. Agreed **Jul 29, 2026**, reported
  **Jul 30, 2026**. AAV **$27,700,000**.
- **Strength (plain):** "For years the best defender on a championship team — he is the player
  who organises everyone else on defence."
- **Risk (plain):** "He is 36, he scored only about eight points a game last season, and by
  several measures his defence was the weakest of his career."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49472083/draymond-green-returns-warriors-1-year-277m-deal) (reporting) ·
  [NBA.com](https://www.nba.com/news/draymond-green-warriors-free-agency-2026) (official-nba, editorial) ·
  [NBC Sports](https://www.nbcsports.com/nba/news/draymond-green-returning-to-warriors-on-one-year-27-7-million-contract) (reporting) ·
  [AP via Bozeman Daily Chronicle](https://www.bozemandailychronicle.com/wire/sports/draymond-green-agrees-to-a-1-year-27-7m-contract-to-remain-with-the-warriors/article_550ccb74-b6c0-5e33-b2a2-d468da91114d.html) (reporting) ·
  stats: [Yahoo Sports player grades](https://sports.yahoo.com/articles/golden-state-warriors-2025-26-220644128.html), [Press Democrat](https://www.pressdemocrat.com/2026/05/22/draymond-green-all-defense-warriors-case-for-selection-impact-stats/) (reporting)
- **Confidence: HIGH.**
- **Teaching value:** **gambling and getting the same thing back.** He gave up $27,600,000
  guaranteed, the team's plan A failed, and he landed at $27,700,000. Decision quality vs
  outcome (dossier §5.6), live.

### 25. James Harden — GUARD — Cleveland Cavaliers
- **Reached free agency:** **opted out** of his 2026-27 player option in June "seeking more
  long-term security," then signed a new deal in **August**.
- **Terms:** 3 years, **$97,000,000**, player option year 3, trade kicker. Agreed
  **Aug 20, 2026**. AAV **$32,333,333**.
- **Strength (plain):** "A former Most Valuable Player who still creates more baskets for other
  people than almost anyone — about eight assists a game."
- **Risk (plain):** "He is 37, and last season he played only 26 games for this team after
  arriving in a mid-season trade."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49671792/james-harden-agrees-3-year-97m-deal-remain-cavaliers) (reporting) ·
  [NBA.com](https://www.nba.com/news/james-harden-cavaliers-free-agency) (official-nba, editorial; confirms the opt-out) ·
  [Yahoo Sports](https://sports.yahoo.com/nba/article/james-harden-agrees-to-3-year-97m-deal-with-cavaliers-170350315.html) (reporting) ·
  [TSN](https://www.tsn.ca/nba/article/report-harden-reaches-three-year-97m-extension-with-cavs/) (reporting; **calls it an "extension" in the headline** — the NBA.com body text confirms the opt-out)
- **Confidence: HIGH** on terms; the headline word "extension" at TSN is a **loose usage**, not a
  contradiction — NBA.com states the opt-out explicitly.
- **Note:** the "26 games / 23.6 points / 8.0 assists" split is **inconsistent across stat
  sources** (some show 20.5 points / 7.7 assists specifically with Cleveland). Use the
  Cleveland-only split or drop the number.

### 26. Walker Kessler — BIG — Los Angeles Lakers
- **Reached free agency:** **restricted free agent**; Utah tendered a **$7,060,000 qualifying
  offer**, then chose to **sign-and-trade** him rather than match a Lakers offer sheet.
- **Terms:** 4 years, **$129,470,000** (reported as "$130 million"), player option year 4, full
  trade kicker. Agreed **Jul 1, 2026**, official **Jul 9, 2026**. AAV **$32,367,500**.
- **What Utah got:** unprotected first-round picks in **2031 and 2033**, plus first-round pick
  **swaps in 2028 and 2030**.
- **Strength (plain):** "In the five games he did play last season he averaged about fourteen
  points, eleven rebounds and two blocked shots — nobody available protects the rim like that."
- **Risk (plain):** "He played **five games** all last season. A torn shoulder ended his year in
  November and he needed surgery."
- **Sources:** [Yahoo Sports](https://sports.yahoo.com/nba/article/lakers-reportedly-acquire-walker-kessler-from-jazz-in-130-million-sign-and-trade-reach-deals-with-sandro-mamukelashvili-quentin-grimes-and-collin-sexton-153736509.html) (reporting; "sign-and-trade") ·
  [ESPN](https://www.espn.com/nba/story/_/id/49237403/lakers-trading-jazz-center-walker-kessler-sources-say) (reporting) ·
  [NBA.com](https://www.nba.com/news/walker-kessler-trade-los-angeles-lakers) (official-nba, editorial; frames it as trade-then-sign) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/07/jazz-to-sign-and-trade-walker-kessler-to-lakers.html) (cap-database/reporting; QO figure) ·
  injury: [ESPN](https://www.espn.com/nba/story/_/id/46860336/sources-jazz-c-walker-kessler-season-ending-surgery) (reporting)
- **Confidence: HIGH** on terms, status and the injury. **MEDIUM** on the mechanism *wording* —
  Yahoo and Hoops Rumors say sign-and-trade; NBA.com's post describes a trade followed by a
  signing. (A sign-and-trade is the only legal path for a restricted free agent moving teams
  at that salary, so the substance is almost certainly sign-and-trade.)
- **Teaching value: the best single card on this board for uncertainty and expected value.**
  A player who appeared in **five games** commanded **$32,000,000 a year plus two unprotected
  future first-round picks**. The economics does all the work.

### 27. Trae Young — GUARD — Washington Wizards ⚠ FLAGGED
- **Reached free agency:** **declined a $49,000,000 player option** for 2026-27.
- **Terms:** 4 years, **approximately $212,000,000**, player option year 4. Agreed
  **Jun 22, 2026**, confirmed **Jul 6, 2026**. AAV **~$53,000,000**.
- **Prior:** traded Atlanta → Washington in January 2026; he re-signed with Washington.
- **Strength (plain):** "A four-time All-Star who sets up more baskets for teammates than almost
  anyone in the league."
- **Risk (plain):** "About $53,000,000 a year is roughly a third of a team's entire budget for
  one player. If it does not work, you cannot undo it for four years."
- **Sources:** [ESPN](https://www.espn.com/nba/story/_/id/49145221/sources-trae-young-sign-4-year-212m-deal-wizards) (reporting) ·
  [NBA.com](https://www.nba.com/news/wizards-trae-young-free-agency-2026) (official-nba, editorial; confirms the option decline and both dates) ·
  [Bleacher Report](https://bleacherreport.com/articles/25442215-trae-young-wizards-reportedly-agree-new-contract-after-opt-out-updated-nba-salary-cap) (reporting)
- **Confidence: MEDIUM.** ⚠ **The total is reported as "approximately $212 million"** — a
  contract that large is almost certainly cap-indexed, so a single printed number may be wrong
  in the same way the Jokić extension is (dossier §7.6). One outlet (Bullets Forever) called it
  an "extension." **Use "about $53,000,000 a year" or drop him.**
- **Note:** dossier §7.4 flagged "Trae Young on Washington" as appearing in **only one
  researcher's dossier**. This research **independently confirms it** from ESPN + NBA.com. That
  §7.4 flag can be cleared.

---

# REJECTED — looked like free agents, were not

**These are the trap. Every one appears on a 2026 "free agency" tracker.**

| Player | What it actually was | Source |
|---|---|---|
| **Andrew Wiggins** (Miami, 3 yr / $64M) | **Opt-in-and-extend.** He picked up his $30.2M player option and extended. He never reached free agency. | [ClutchPoints](https://clutchpoints.com/nba/miami-heat/heat-news-andrew-wiggins-getting-64-million-as-part-of-opt-in-and-extend), [ESPN](https://www.espn.com/nba/story/_/id/49216841/heat-andrew-wiggins-reach-3-year-64m-deal-sources-say) |
| **Kristaps Porziņģis** (Golden State, 2 yr / $40M) | Reported as a **contract extension**, "immediately trade-eligible" — inconsistent with a new free-agent contract. Not resolvable this session. | [NBC Bay Area](https://www.nbcbayarea.com/nba/golden-state-warriors/kristaps-porzingis-contract-free-agency/4105407/), [NBA.com](https://www.nba.com/news/reports-kristaps-porzingis-opts-to-remain-with-warriors-on-2-year-contract) |
| **Robert Williams III** (Portland, 3 yr / $44M) | **Extension.** Every source calls it an extension; the team release says "multi-year contract extension." | [ESPN](https://www.espn.com/nba/story/_/id/49226377/sources-williams-staying-trail-blazers-44m-extension) |
| **Dillon Brooks** (Phoenix, 3 yr / $73M) | **Extension** through 2029-30. Under contract. | NBA.com offseason deals page |
| **Amen Thompson, Victor Wembanyama, Donovan Mitchell, Naji Marshall, Jordan Walsh** | All listed on the NBA.com offseason page as **extensions**. Under contract. | [NBA.com](https://www.nba.com/news/nba-offseason-deals-2026) |

**Also excluded by brief rule 3** (student-seat clubs): every 2026 signing with Brooklyn,
Memphis, Detroit, Milwaukee, Boston, Sacramento, New York and Denver — which removed
Moe Wagner, Day'Ron Sharpe, Keon Ellis, Josh Minott, Mitchell Robinson, Neemias Queta,
Mike Conley, Jordan Clarkson, Andre Drummond, Jose Alvarado, Landry Shamet, John Collins,
Kevin Huerter, Javonte Green, Gary Trent Jr., Precious Achiuwa, DeMar DeRozan, Tyus Jones and
Marvin Bagley III from consideration.

**Also excluded on dossier authority:** all LA Clippers and Toronto Raptors roster facts
(Bradley Beal, Rui Hachimura, Kyle Anderson) — §8.2 #4 forbids them until the Kawhi Leonard
conflict is resolved.

---

# WHAT I COULD NOT CONFIRM

1. **Any dollar figure at cap-database tier.** Spotrac (403), Forbes (403), Washington Post
   (403), Basketball-Reference (not fetched). Dossier §7.9 predicted exactly this. **Before any
   figure appears in front of students, spot-check the headline numbers against Spotrac
   manually in a browser** — the same instruction the dossier gives for team salaries.

2. **True source independence.** Almost every figure originates with **Shams Charania (ESPN)**.
   NBA.com's news posts are league-published *editorial summaries of that reporting*, not
   independent league confirmation, and no official NBA transaction-terms release exists for
   any of these deals. **"Two sources" here mostly means two publishers, one origin.**

3. **First-year salaries.** Confirmed for only Dean Wade ($9,000,000), LeBron James and Gary
   Payton II ($3,876,529), Trendon Watford ($2,845,883), and by strong inference Collin Sexton
   ($9,366,000). **For the other twenty-two players the AAV in the table is `total ÷ years`, not
   a cap hit.** A board that charges AAV is simplifying the economics; log it per CLAUDE.md §3.

4. **Contract mechanisms.** Reported for only ten of twenty-seven: Wade (non-taxpayer MLE),
   Harris (non-taxpayer MLE, single source), Sexton (room exception), Smart (taxpayer MLE,
   single source **and the arithmetic does not reconcile**), Kessler (sign-and-trade, wording
   disputed by NBA.com), White (cap room, single source), plus the four stated veteran minimums.
   **Seventeen entries have no reported mechanism.** Bird-rights labels on the re-signings
   (Green, Harden, Nurkić, Dosunmu) are my **inference from the teams being over the cap** —
   **not sourced, do not print.**

5. **The mid-level exception labels.** Dossier §8.1 #7 gives the three values unlabelled. The
   mapping in this document (non-taxpayer $15,044,000 / room $9,366,000 / taxpayer $6,064,000)
   is **inferred**, corroborated by two independent arithmetic matches, and **still unverified
   against primary text.**

6. **Isaiah Hartenstein's free-agency status** — extension vs option-decline-and-re-sign. ⚠
   Unresolved. He is the **only BIG in band (e)**; if he is dropped that band loses its big man.

7. **Trae Young's exact total** — "approximately $212 million," almost certainly cap-indexed.

8. **Tari Eason's exact total** — NBA.com says $81M, three other outlets say $81.5M.

9. **Klay Thompson's exact total** — $11,480,000 (aggregator) vs "approximately $11.5 million"
   (NBA.com) vs "nearly $13 million" (ESPN). **And he is a buyout free agent, not a
   free-agency-window free agent.**

10. **Marcus Smart's mechanism** — "taxpayer mid-level" does not reconcile with $13,000,000 over
    two years ($12,431,200 is the full two-year taxpayer MLE).

11. **Several season stat lines disagree between sources** — Quentin Grimes (12.6 / 13.4 / 13.9
    points), James Harden (Cleveland-only vs season-wide), Mark Williams (56 vs 60 games).
    Every strength/risk line built on a stat should be re-checked against a single chosen
    stat source before it reaches a screen.

12. **Ages.** I have direct source confirmation for LeBron (41), Horford (40), Vučević (35),
    Klay Thompson (36), Watford (25), Harris (33), Oubre (30), Mark Williams (24) and Kessler
    (24). Draymond Green (36), Harden (37) and Powell (33) are **my arithmetic from birthdates I
    did not fetch** — verify before printing an age.

13. **Whether any of these players' 2026-27 situations have changed since the signing.** It is
    **2026-09-03, roughly three weeks before training camp** (dossier §7.10). Camp waivers and
    late trades are live. **A player on this board could be somewhere else by the time a class
    runs it.**

14. **Rights.** Names, salaries, dates and transaction terms are public facts and safe to render
    (dossier §8.1 #19, §8.2 #22). **No photograph, logo, mark, jersey image or likeness is
    proposed anywhere in this document, and none should be added without a founder call.**

---

# INCUMBENT FREE AGENTS AT THE APRON CLUBS (follow-up, 2026-09-03)

**Research date:** 2026-09-03 · same session, same researcher role, same standard as the Method
section above. **Nothing above this line was modified.**

**Why this follow-up exists.** The board above has no free agents belonging to the **New York
Knicks** or the **Minnesota Timberwolves**. Both clubs are over the **first apron**, which strips
the non-taxpayer mid-level exception, the bi-annual exception and sign-and-trade acquisitions —
but **does not touch a club's right to re-sign its own free agents using Bird rights.** The
lesson turns on that asymmetry, and it could not be taught from the existing board.

**Result: both clubs yielded real incumbent free agents. No secondary club was needed.**
Boston, Sacramento, Milwaukee, Detroit, Memphis and Brooklyn were not worked as free-agent
sources; Boston appears below only as the *destination* of two New York and Minnesota players.

## ✅ AN OPEN QUESTION FROM ABOVE IS NOW RESOLVED

Item **5** of "WHAT I COULD NOT CONFIRM" — the mid-level exception labels — is **confirmed**.
Hoops Rumors' league-wide 2026/27 mid-level tracker states the three values *with their labels*:

| Exception | 2026-27 value | Status |
|---|---|---|
| Non-taxpayer mid-level | **$15,044,000** | **confirmed** (was inferred) |
| Room exception | **$9,366,000** | **confirmed** (was inferred) |
| Taxpayer mid-level | **$6,064,000** | **confirmed** (was inferred) |

Source: [Hoops Rumors — How Teams Are Using 2026/27 Mid-Level Exceptions](https://www.hoopsrumors.com/2026/07/how-teams-are-using-2026-27-mid-level-exceptions.html)
(cap-database/reporting). The same page gives the **first apron as $209,015,000**. The inferred
mapping used throughout the document above was correct.

## ✅ A NEW SOURCE TIER BECAME AVAILABLE

The document above records that **no cap-database-tier verification of any dollar figure** was
possible (Spotrac/Forbes/WaPo all 403). This session found **`salaryswish.com` fetches
successfully** and publishes, per player: **year-by-year salary**, total, guarantee structure,
signing date, and — critically — **the exception used**. Every dollar figure in this section has
been checked against it. That is a genuinely stronger evidence tier than anything above this line,
and **`salaryswish.com` should be added to the research toolkit.** It is still a third-party
database, not a league publication; it is not a substitute for the manual Spotrac spot-check the
document above requires.

## The two clubs' verified apron position

| Club | 2026-27 cap figure | vs first apron ($209,015,000) | vs second apron | Largest exception available |
|---|---|---|---|---|
| **New York Knicks** | $218,412,232 | **over by $9,397,232** | **$3,273,768 below** | taxpayer MLE $6,064,000 |
| **Minnesota Timberwolves** | $214,930,955 (payroll $252,638,473) | **over** | below | taxpayer MLE $6,064,000 |

Sources: [SalarySwish — Knicks](https://www.salaryswish.com/teams/knicks) ·
[SalarySwish — Timberwolves](https://www.salaryswish.com/teams/timberwolves) (cap-database) ·
[Hoops Rumors MLE tracker](https://www.hoopsrumors.com/2026/07/how-teams-are-using-2026-27-mid-level-exceptions.html),
which names both clubs in its over-the-first-apron list and states for each: *"operating above the
first apron and can't currently use more than the taxpayer portion of the MLE."*
The full over-first-apron list on that page: **Golden State, Houston, Minnesota, New York,
Oklahoma City, Orlando, Phoenix.** **Confidence: HIGH.** This is the firmest structural fact in
the whole research file — two independent origins, one of them a cap database.

---

## THE TABLE — 7 verified incumbent free agents at the two apron clubs

| # | Player | Pos | Whose FA he was | Outcome | Date agreed | Date signed | Yrs | Total | **Year-1 salary** | Annual (AAV) | Mechanism | Conf. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **NEW YORK KNICKS** |
| N1 | **Mitchell Robinson** | BIG | New York | **LEFT** → Boston | Jul 1, 2026 | Jul 6, 2026 | 3 | $47,388,600 | **$15,044,000** | $15,796,200 | **Boston's full non-taxpayer MLE** (stated) | **high** |
| N2 | **Jose Alvarado** | GUARD | New York | **RE-SIGNED** New York | Jun 26, 2026 | Jul 6, 2026 | 3 | $14,384,484 | **$4,439,656** | $4,794,828 | **Bird rights** (stated) | **high** |
| N3 | **Landry Shamet** | GUARD | New York | **RE-SIGNED** New York | Jun 29, 2026 | Jul 6, 2026 | 4 | $23,978,467 | **$5,490,967** | $5,994,617 | **Early Bird rights** (stated; label disputed) | high (terms) / medium (label) |
| **MINNESOTA TIMBERWOLVES** |
| M1 | **Ayo Dosunmu** | GUARD | Minnesota | **RE-SIGNED** Minnesota | ~Jun 22, 2026 | Jul 10, 2026 | 5 | $112,000,000 | **$19,310,345** | $22,400,000 | **Bird rights** (stated) | **high** |
| M2 | **Bones Hyland** | GUARD | Minnesota | **RE-SIGNED** Minnesota | Jun 30, 2026 | Jul 3, 2026 | 1 | $2,845,883 | **$2,845,883** (cap hit $2,449,421) | $2,845,883 | veteran minimum (stated) | **high** |
| M3 | **Mike Conley** | GUARD | Minnesota | **LEFT** → Boston | ~Jul 1, 2026 | Jul 6, 2026 | 1 | $3,876,529 | **$3,876,529** (cap hit $2,449,421) | $3,876,529 | veteran minimum (stated) | high (terms) / ⚠ see note |
| **CONTROL CARD — not an incumbent, included because it is the other half of the proof** |
| M4 | **Jonathan Kuminga** | WING | *not Minnesota's* (Atlanta) | **JOINED** Minnesota from outside | Aug 26, 2026 | Aug 26, 2026 | 2 | $12,431,200 | **$6,064,000** | $6,215,600 | **taxpayer MLE** (stated) | **high** |

**Note on Dosunmu already appearing above.** He is **entry 20** of the main board. This section
adds what the main board lacked: **his year-1 salary ($19,310,345 — the main board's "~$19M, one
source" is now confirmed to the dollar) and his mechanism (Bird rights, previously listed as "not
reported" and explicitly warned against printing).** The main board's row for him can now be
upgraded.

---

## ⭐ THE SINGLE BEST FINDING: MINNESOTA PAID TWO PRICES IN ONE SUMMER

This is the cleanest demonstration of the apron asymmetry available anywhere in this research,
and it is **one club, one offseason, both numbers confirmed at cap-database tier:**

| | Ayo Dosunmu | Jonathan Kuminga |
|---|---|---|
| Whose free agent | **Minnesota's own** | **another club's** |
| Year-1 salary from Minnesota | **$19,310,345** | **$6,064,000** |
| Tool used | **Bird rights** | **taxpayer mid-level exception** |
| Date | Jul 10, 2026 | Aug 26, 2026 |

**Same buyer. Same summer. Same apron. Three times the price — because one player was already
theirs.** Minnesota could not legally have offered Kuminga a dollar over $6,064,000 in year one;
it could, and did, offer its own player $19,310,345. Kuminga's year-1 salary is **exactly** the
taxpayer MLE to the dollar, which is what makes the pair airtight rather than suggestive.

**This is the lesson.** If only one thing from this follow-up reaches a student screen, it is
these two numbers side by side.

---

## ⚠ AN ACCURACY POINT THE LESSON MUST NOT GET WRONG

**Over the FIRST apron, Bird rights are completely untouched.** New York did **not** lose
Mitchell Robinson because a rule forbade re-signing him. New York had full Bird rights on him and
could legally have paid him **any** amount. It chose not to, because it sat **$3,273,768 below the
second apron** and $15,044,000 would have pushed it well past — and reporting attributes ownership
unwillingness to cross that line.

So the honest formulation is:

- **First apron takes away the tools for buying OTHER clubs' players** (non-taxpayer MLE,
  bi-annual exception, sign-and-trade). ← *this is the rule*
- **Bird rights for your OWN players survive.** ← *this is the exemption*
- **The second apron is where the real squeeze comes from** — it does not remove Bird rights
  either, but it makes using them punishingly expensive and triggers further restrictions.

A lesson that says "the apron stopped New York from re-signing Robinson" **teaches false
economics** and would fail CLAUDE.md §8. The true and better story is: *the rules let them keep
him, and they still couldn't afford to.* That is a sharper economics lesson anyway — constraint
versus cost.

---

## PER-PLAYER NOTES

> Same caveat as the main board: strength/risk lines are **my plain-language renderings** of facts
> in the cited reporting, not quotations. Re-read them against the sources before they reach a
> student screen.

### N1. Mitchell Robinson — BIG — **left New York for Boston** ⭐
- **Reached free agency:** contract expired after **eight seasons** with the Knicks, the only club
  he had played for (drafted 36th overall, 2018). Unrestricted. He had just won the 2026
  championship with New York.
- **Terms:** 3 years, **$47,388,600**. **Year 1 = $15,044,000**, year 2 $15,796,200, year 3
  $16,548,400 (**player option**). Fully guaranteed. Agreed **Jul 1, 2026**, official
  **Jul 6, 2026**.
- **Mechanism — the whole point:** Boston used **its entire non-taxpayer mid-level exception**.
  Hoops Rumors' MLE tracker lists Boston's line verbatim as *"Used: $15,044,000 (Mitchell
  Robinson)"*. The three years total **$47,388,600 exactly** — $15,044,000 with 5% raises — so the
  arithmetic and the label agree perfectly. Using it **hard-capped Boston at the first apron.**
- **Why this card is worth more than any other New York card:** the tool Boston used to take him
  is **precisely the tool the first apron had taken away from New York.** New York's largest
  exception was $6,064,000 — it could not have signed its own departing centre back off the open
  market at this price by any route except Bird rights.
- **Strength (plain):** "He is seven feet tall and nearly three of every four shots he takes go
  in, because he only shoots from right beside the basket. He grabbed almost nine rebounds a game
  and dunked 97 times last season."
- **Risk (plain):** "He gets hurt. In the two seasons before last he played only 17 games, then
  31 games, out of 82. He has never once attempted a long shot, and he misses about half his free
  throws."
- **Age:** 28 (born Apr 1, 1998).
- **Sources:** [Hoops Rumors MLE tracker](https://www.hoopsrumors.com/2026/07/how-teams-are-using-2026-27-mid-level-exceptions.html) (cap-database/reporting; **the mechanism**) ·
  [SalarySwish](https://www.salaryswish.com/players/mitchell-robinson) (cap-database; **year-by-year salary, exact total, MLE label**) ·
  [NBA.com](https://www.nba.com/news/mitchell-robinson-celtics-free-agency-2026) (official-nba, editorial; terms, dates, stats) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49237335/sources-mitchell-robinson-celtics-agree-3-year-474m-deal) (reporting; **page fetched empty this session — headline only**) ·
  [NBC Sports Boston](https://www.nbcsportsboston.com/nba/boston-celtics/nba-free-agents-mitchell-robinson-contract-stats-salary/793722/) (reporting; the 72.3% / 97-dunks / 17-and-31-games facts) ·
  [Hoops Rumors — Knicks offseason check-in](https://www.hoopsrumors.com/2026/08/nba-2026-offseason-check-in-new-york-knicks.html) (cap-database/reporting; lists him as a departure)
- **Confidence: HIGH** — on terms, year-1 salary, mechanism and status. **This is the best-sourced
  single transaction in the entire research file**: a cap database, a mechanism tracker, a
  league-published post and an exact arithmetic reconciliation all agree.

### N2. Jose Alvarado — GUARD — **re-signed with New York (Bird rights)**
- **Reached free agency:** **declined a $4,500,000 player option**. Genuine free agency, not an
  option pick-up. He had been acquired from New Orleans during the 2025-26 season, so his Bird
  rights travelled with him in the trade.
- **Terms:** 3 years, **$14,384,484**. Year 1 **$4,439,656**, year 2 $4,794,828, year 3 $5,150,000
  (partially guaranteed at $2,765,516, becoming full if he is not waived before **Jun 30, 2028**).
  Agreed **Jun 26, 2026**, official **Jul 6, 2026**.
- **Mechanism: Bird rights.** SalarySwish labels the exception **"Bird QVFA"** — *Qualifying
  Veteran Free Agent*, the CBA's own term for a full-Bird free agent. Hoops Rumors independently
  says "Bird rights."
- **Strength (plain):** "He was on the floor at the end of the biggest game of the season — the
  fourth quarter of a Finals game his team won after being 29 points behind."
- **Risk (plain):** "He is a backup who plays behind the team's star guard. His own club's price
  for him — under $4,500,000 in the first year — is what they think that is worth."
- **Sources:** [Hoops Rumors — Knicks check-in](https://www.hoopsrumors.com/2026/08/nba-2026-offseason-check-in-new-york-knicks.html) (cap-database/reporting; **"Bird rights"**, exact total, guarantee structure) ·
  [SalarySwish](https://www.salaryswish.com/players/jose-alvarado) (cap-database; **year-by-year salary, "Bird QVFA"**) ·
  [NBA.com](https://www.nba.com/news/reports-champion-knicks-retain-key-reserve-jose-alvarado) (official-nba, editorial) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49190706/jose-alvarado-returning-new-york-knicks-new-3-year-deal) (reporting; **fetched empty — headline only**) ·
  [Yahoo Sports](https://sports.yahoo.com/nba/article/knicks-fan-favorite-jose-alvarado-reportedly-declining-option-agrees-to-3-year-14-million-deal-with-hometown-team-210731156.html) (reporting; the declined $4.5M option)
- **Confidence: HIGH** on terms, year-1 salary, mechanism and free-agency status.
- ⚠ **One labelling wrinkle, flagged:** SalarySwish's *contract-type* field reads **"Veteran
  Extension"** while its *exception* field reads **"Bird QVFA."** Those are contradictory on their
  face. Four independent accounts (Hoops Rumors, ESPN, Yahoo, Bleacher Report) all describe a
  **declined player option followed by a new contract**, and "QVFA" is by definition a free agent,
  so the type field is almost certainly a database quirk. **Do not let it slide by unexamined —
  this is the exact failure mode that got four players rejected in the main board.** I judge him a
  genuine free agent; a reviewer should agree before he ships.

### N3. Landry Shamet — GUARD — **re-signed with New York**
- **Reached free agency:** contract expired. Unrestricted. Reported to have **turned down larger
  offers from other contenders** to stay and defend the title.
- **Terms:** 4 years, **$23,978,467**. Year 1 **$5,490,967**, then $5,737,500 / $6,162,500 /
  $6,587,500, with a **player option in year 4** and only **$14,500,000 (about 61%) guaranteed**.
  Agreed **Jun 29, 2026**, official **Jul 6, 2026**.
- **Mechanism: ⚠ disputed label.** Hoops Rumors says **Early Bird rights**; SalarySwish says
  **Bird**. Both are re-signing rights the apron leaves intact, so the *economics* of the card is
  unaffected — but **do not print a specific rights label for Shamet.** Say "his own club's
  re-signing rights."
- **Strength (plain):** "He scored about nine points a game in 51 games, and then shot better in
  the playoffs than in the regular season — he made almost half of his long shots when it
  mattered most."
- **Risk (plain):** "Only about six of every ten dollars in his contract is actually guaranteed.
  In the later years his team can decide to stop paying him."
- **Sources:** [Hoops Rumors — Knicks check-in](https://www.hoopsrumors.com/2026/08/nba-2026-offseason-check-in-new-york-knicks.html) (cap-database/reporting; **"Early Bird rights"**, exact total) ·
  [SalarySwish](https://www.salaryswish.com/players/landry-shamet) (cap-database; year-by-year, **"Bird"**) ·
  [NBA.com](https://www.nba.com/news/landry-shamet-knicks-free-agency-2026) (official-nba, editorial) ·
  [Yahoo Sports / AP](https://sports.yahoo.com/articles/landry-shamet-stay-knicks-4-230358940.html) (reporting; the turned-down offers, the Jun 29 date, the 9.3 / 47.5% stats)
- **Confidence: HIGH** on terms and year-1 salary (two cap databases agree to the dollar);
  **MEDIUM** on the rights label.

### M1. Ayo Dosunmu — GUARD — **re-signed with Minnesota (Bird rights)** ⭐⭐
- **Reached free agency:** contract expired; **unrestricted for the first time in his career.**
  Minnesota had acquired him from Chicago on **Feb 5, 2026** (with Julian Phillips, for Rob
  Dillingham, Leonard Miller and four second-round picks), **and his Bird rights transferred with
  him in the trade** — which is exactly why an over-the-apron club could pay him this much.
  He carried a **$14,300,000 cap hold** into the offseason.
- **Terms:** 5 years, **$112,000,000**, fully guaranteed. **Year 1 = $19,310,345**, then
  $20,855,173 / $22,400,001 / $23,944,829 / $25,489,652 (**player option** in year 5).
  Agreed **~Jun 22, 2026** (see the date caveat below), official **Jul 10, 2026**.
- **Mechanism: Bird rights** — stated outright by SalarySwish ("Bird Exception") and corroborated
  by the trade-rights reporting and by the cap-hold framing.
- **Why he is the headline card:** at **$19,310,345 in year one** he sits squarely in the
  $6,000,000-$25,000,000 band that an over-the-apron club **can only reach for its own players.**
  Minnesota's largest exception for anyone else's free agent was **$6,064,000**. This one contract
  is more than three times the maximum the same club could offer any outsider on the same day.
- **Strength (plain):** "In the playoffs he averaged about sixteen points a game, and in one game
  against Denver he scored 43 — the most he has ever scored — making thirteen of seventeen shots
  and all five of his long ones."
- **Risk (plain):** "He played only 24 regular-season games for this team before they agreed to
  pay him $112,000,000. They are buying about half a season plus one hot playoff run."
- **Age:** 26.
- **Sources:** [SalarySwish](https://www.salaryswish.com/players/ayo-dosunmu) (cap-database; **year-by-year salary and "Bird Exception"** — the two facts the main board could not get) ·
  [NBA.com](https://www.nba.com/news/reports-ayo-dosunmu-to-re-sign-with-timberwolves) (official-nba, editorial; Jul 10 official date, trade-deadline acquisition, stats) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49150075/dosunmu-gets-5-year-112m-deal-timberwolves) (reporting; **fetched empty — headline only**) ·
  [Bleacher Report](https://bleacherreport.com/articles/25428800-ayo-dosunmu-wolves-reportedly-agree-new-contract-after-julius-randle-trade-updated-salary-cap) (reporting; **the $14.3M cap hold**, the Charania attribution) ·
  [Yahoo Sports](https://sports.yahoo.com/articles/timberwolves-sign-ayo-dosunmu-five-050100065.html) (reporting) ·
  [SI](https://www.si.com/nba/timberwolves/onsi/ayo-dosunmu-staying-with-timberwolves-on-reported-112-million-contract) (reporting)
- **Confidence: HIGH** on terms, year-1 salary, mechanism and free-agency status.
- ⚠ **Date caveat:** the **official** date (Jul 10, 2026) is firm from NBA.com and the team. The
  **agreement** date is not: "~Jun 22" comes from an aggregator timestamp and Bleacher Report says
  only "late June." **Print the July 10 date, or print no agreement date.**

### M2. Bones Hyland — GUARD — **re-signed with Minnesota (minimum)**
- **Reached free agency:** his one-year minimum deal with Minnesota expired. **Unrestricted.**
  He re-signed **23 minutes into free agency.**
- **Terms:** 1 year, **$2,845,883** player salary against a **$2,449,421 cap hit** — the
  minimum-salary reimbursement gap the main board flags in the Gary Payton II note. Agreed
  **Jun 30, 2026**, signed **Jul 3, 2026**.
- **Mechanism: veteran minimum exception** (stated). **Note this is *not* a Bird-rights card** —
  the minimum exception is available to every club regardless of apron, so he demonstrates
  nothing about the apron. He is here for completeness, not for teaching.
- **Strength (plain):** "He played 71 games last season — more than almost anyone else on this
  list — and scored about eight and a half points a game coming off the bench."
- **Risk (plain):** "He signed for the least the rules allow, 23 minutes into free agency. Nobody
  bid against his own team."
- **Sources:** [Hoops Rumors](https://www.hoopsrumors.com/2026/06/bones-hyland-re-signing-with-timberwolves-on-one-year-deal.html) (cap-database/reporting; **both dates, both dollar figures, the mechanism, UFA status, full stat line**) ·
  [Star Tribune](https://www.startribune.com/minnesota-timberwolves-nba-free-agency-news-bones-hyland/601861806) (reporting) ·
  [SI](https://www.si.com/nba/timberwolves/onsi/timberwolves-re-sign-fan-favorite-guard-bones-hyland) (reporting)
- **Confidence: HIGH.**

### M3. Mike Conley — GUARD — **left Minnesota for Boston (minimum)** ⚠
- **Reached free agency:** contract expired. **Unrestricted.** He announced in May 2026 he would
  not retire and intended to play a 20th season.
- **Terms:** 1 year, **$3,876,529** (cap hit $2,449,421), **$0 guaranteed**. Signed
  **Jul 6, 2026**. Veteran minimum exception.
- **Age:** 38, turning 39 in October 2026. He becomes only the **14th player in NBA history to
  reach 20 seasons.**
- ⚠ **Why he is a weak apron card — read before using him.** SalarySwish shows he was **waived by
  Charlotte on Feb 5, 2026** and signed with Minnesota **Feb 17, 2026** on a rest-of-season deal
  worth $1,148,727. A player signed after clearing waivers mid-season does **not** bring full Bird
  rights, so Minnesota's retention right on him was weak regardless of the apron. **He shows a
  club losing its own free agent; he does not show anything about Bird rights.** Do not use him to
  teach the mechanism.
- **Strength (plain):** "He is about to play his twentieth season. Only thirteen players in the
  entire history of the league have ever done that."
- **Risk (plain):** "He is 38 and scored under five points a game last season. His own team
  replaced him with younger guards and did not fight to keep him."
- **Sources:** [SalarySwish](https://www.salaryswish.com/players/mike-conley) (cap-database; exact salary, cap hit, mechanism, **the Charlotte waiver and Feb 17 signing**) ·
  [NBA.com](https://www.nba.com/news/mike-conley-free-agency-2026) (official-nba, editorial; UFA status, age 38, the 4.5/1.7/2.9 line, the reason Minnesota moved on) ·
  [Star Tribune](https://www.startribune.com/mike-conley-leaves-minnesota-timberwolves-signs-boston-celtics/601863271) (reporting) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49236921/conley-celtics-becomes-12th-reach-20-nba-seasons) (reporting; **headline only, page not fetched**)
- **Confidence: HIGH** on terms and status; the **teaching value is LOW** for this lesson.
- ⚠ **Note a live source contradiction I could not settle:** one Yahoo headline in search results
  reads *"Mike Conley Jr. reportedly rejoining Timberwolves after being waived by Hornets."* That
  is almost certainly the **February 2026** signing surfacing out of order, not a second 2026-27
  move — SalarySwish has him on Boston's books for 2026-27. **But I did not open that article.**
  If Conley is used at all, resolve this first.

### M4. Jonathan Kuminga — WING — **joined Minnesota from outside (taxpayer MLE)** — CONTROL CARD
- **NOT an incumbent free agent.** He is included **only** because he is the other half of the
  Dosunmu proof. He was unrestricted, coming from **Atlanta** (traded there from Golden State in
  February 2026, 16 games played).
- **Terms:** 2 years, **$12,431,200**, fully guaranteed. **Year 1 = $6,064,000**, year 2
  $6,367,200 (**player option**). Agreed and reported **Aug 26, 2026**.
- **Mechanism: the taxpayer mid-level exception**, stated explicitly by ESPN and Hoops Rumors, and
  confirmed to the dollar by SalarySwish ("Taxpayer-MLE", year 1 = $6,064,000 exactly). Using it
  **hard-capped Minnesota at the second apron** — Hoops Rumors reported the club was then "$4
  million away" from that line and had to clear salary before finalising it.
- **He chose Minnesota over the Lakers, Bulls and Trail Blazers.** The Lakers attempted a
  sign-and-trade at more than $12,000,000 a year over three years; he took the shorter deal.
- **Strength (plain):** "Four teams wanted him, and the team president flew to Miami to sit with
  him for four hours to talk him into coming."
- **Risk (plain):** "He played only 16 games for his last team, and he took a two-year deal
  instead of a long one — which means either he thinks he can do better next year, or nobody
  offered him more."
- **Sources:** [SalarySwish](https://www.salaryswish.com/players/jonathan-kuminga) (cap-database; **year 1 = $6,064,000, "Taxpayer-MLE"**) ·
  [Hoops Rumors](https://www.hoopsrumors.com/2026/08/jonathan-kuminga-agrees-to-two-year-deal-with-timberwolves.html) (cap-database/reporting; **the exception, the $6.1M first year, the second-apron hard cap, the Lakers sign-and-trade**) ·
  [ESPN](https://www.espn.com/nba/story/_/id/49736014/jonathan-kuminga-reaches-2-year-deal-minnesota-timberwolves) (reporting; **headline only, page not fetched** — headline states "2-year, $12.4M") ·
  [TSN](https://www.tsn.ca/nba/article/jonathan-kuminga-reaches-2-year-124m-deal-with-timberwolves-n1-49736014/) (reporting; carries the same ESPN report)
- **Confidence: HIGH** on the year-1 salary and the mechanism — these are the two figures the
  proof rests on, and both are confirmed by a cap database *and* stated in reporting.
- ⚠ **Total-value discrepancy, flagged:** ESPN and TSN say **$12.4 million**; Hoops Rumors' article
  body says **$13 million**. SalarySwish computes **$12,431,200**, which is $6,064,000 plus a 5%
  raise — i.e. ESPN is right to the dollar and Hoops Rumors rounded loosely. **Print $12,431,200
  or "about $12.4 million"; do not print $13 million.**

---

## WHAT THE LESSON CAN NOW TEACH THAT IT COULD NOT BEFORE

| Beat | Card | The number |
|---|---|---|
| An apron club **can** pay its own player a big salary | **Dosunmu** re-signs Minnesota | **$19,310,345** year 1, Bird rights |
| The same club **cannot** pay an outsider more than the taxpayer MLE | **Kuminga** joins Minnesota | **$6,064,000** year 1, taxpayer MLE |
| A club **under** the apron has a tool the apron club does not | **Robinson** leaves New York for Boston | **$15,044,000** year 1, full non-taxpayer MLE |
| Bird rights survive the apron but cost is still binding | **New York** keeps the right, declines to use it | **$3,273,768** below the second apron |
| Small re-signings look the same at any apron level | **Alvarado** ($4,439,656), **Shamet** ($5,490,967), **Hyland** ($2,845,883) | below the taxpayer MLE — teach nothing about the apron |

**A caution the designer should act on.** Neither club re-signed anyone in the
**$6,064,000-$15,044,000** window. New York's two Bird re-signings both landed **below** the
taxpayer MLE, meaning New York could have paid those two exact salaries without Bird rights at
all. **New York alone cannot prove the asymmetry.** Only Minnesota can, via Dosunmu. If the lesson
needs both apron seats to carry the mechanism, New York's seat must carry it through
**Robinson's departure** — the tool Boston used and New York did not have — rather than through a
re-signing.

---

## WHAT I COULD NOT CONFIRM (this follow-up)

1. **Source independence is still the same single origin.** Terms for Robinson, Dosunmu, Alvarado,
   Shamet and Kuminga all trace to **Shams Charania (ESPN)**. What is *new and genuinely
   independent* is the **cap-database layer** — SalarySwish's year-by-year salary tables and
   exception labels, and Hoops Rumors' MLE tracker — which do not merely repeat a report, they
   publish structured contract data that **reconciles arithmetically** (Robinson $47,388,600 =
   3-year full NTMLE; Kuminga $12,431,200 = 2-year full taxpayer MLE). **This section is better
   evidenced than the main board above.** It is still not league-published fact.

2. **ESPN pages would not fetch this session.** Every `espn.com` URL returned **empty content**.
   All ESPN citations above are **headline-level only**. This is a new access failure not recorded
   in the main document's §"Access failures".

3. **Spotrac was not retried** (403 above). SalarySwish was used as the fetchable cap-database
   substitute. **The manual Spotrac spot-check the main document demands still has not happened
   for any figure, including these.**

4. **Jose Alvarado's SalarySwish contract-type field says "Veteran Extension"** while its exception
   field says "Bird QVFA" and four reporting sources describe a declined option plus a new deal.
   I judge him a genuine free agent. **Unresolved on the face of one database field.**

5. **Landry Shamet's rights label** — Early Bird (Hoops Rumors) vs Bird (SalarySwish). Economics
   unaffected; **do not print a specific label.**

6. **Dosunmu's agreement date** (~Jun 22 vs "late June"). The **Jul 10, 2026 official date is
   firm.**

7. **Jonathan Kuminga's total** — $12.4M (ESPN/TSN/SalarySwish, arithmetically exact) vs $13M
   (Hoops Rumors body text).

8. **Minnesota's hard-cap line.** Hoops Rumors says using the taxpayer MLE put Minnesota against
   the **second-apron** hard cap; SalarySwish's team page summary rendered as "hard capped at the
   first apron." Under the 2023 CBA the taxpayer MLE hard-caps at the **second** apron, so I
   believe Hoops Rumors and treat the SalarySwish line as a parsing artefact — **but I did not
   resolve it against primary CBA text.**

9. **Mike Conley's 2026-27 club.** SalarySwish has him on Boston. A stray Yahoo headline suggests
   a Minnesota return. **Almost certainly a stale February item; not opened; unresolved.**

10. **First-apron restriction list.** That the first apron removes the non-taxpayer MLE, the
    bi-annual exception and sign-and-trade acquisitions is stated by the Knicks reporting and by
    thirdapron.com, and is consistent with the MLE tracker. **It is not verified against primary
    CBA text**, and the second-apron restriction list is verified only from
    [thirdapron.com](https://www.thirdapron.com/p/timberwolves-offseason-preview-edwards-dosunmu-aprons)
    (single source, subscriber newsletter tier): *"limited to increasing their payroll by
    re-signing or extending their own players, signing draft picks, and signing minimum-salary
    players."* **The lesson's core rule claim should get one more source before it ships.**

11. **Whether any of this has changed since.** Same warning as the main document: it is
    **2026-09-03**, roughly three weeks before training camp. Kuminga signed only **eight days
    ago**. Camp waivers and late trades are live.

12. **Rights.** As above — names, salaries, dates and terms only. **No photograph, logo, mark,
    jersey image or likeness is proposed here.**
