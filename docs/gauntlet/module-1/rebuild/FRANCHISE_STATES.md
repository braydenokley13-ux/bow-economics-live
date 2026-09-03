# FRANCHISE STATES — SEAT SELECTION FOR THE THREE-ACT MODULE 1

**Function:** Sports Reality (CLAUDE.md §5) · **Research date: 2026-09-03** · reviewed content I did not author.
**Question answered:** which real NBA franchises make the best student seats for a three-act GM arc
(L1 THE OFFSEASON → L2 THE SEASON CHANGES → L3 THE DEADLINE), and what is each one's verified,
dated starting position?

**This document does not decide the lesson.** It supplies dated real-world positions, names the
seats that are unfair, and flags the facts that will rot before a 2026-27 classroom session.

---

## 0. METHOD, SOURCES, AND WHAT "VERIFIED" MEANS HERE

### 0.1 Sources actually opened this session (observed, not inferred)

| Source | Tier | What it supplied | Fetched |
|---|---|---|---|
| `salaryswish.com/teams/<club>` (all 30) | cap-database | cap hit, cap/tax/apron room, hard-cap status, signing exceptions, trade exceptions, dead cap, per-player salary + option flags + ages, draft-pick grid | 2026-09-03 |
| `salaryswish.com/hard-cap-tracker` | cap-database | league-wide hard-cap list **with the dated triggering transaction per club** | 2026-09-03 |
| `salaryswish.com/mid-level-exception` | cap-database | per-club remaining Room / Non-Taxpayer / Taxpayer MLE space, and which signing consumed it | 2026-09-03 |
| `salaryswish.com/disabled-player-exception` | cap-database | the five clubs granted a 2026-27 DPE, the injured player, and the amount | 2026-09-03 |
| `salaryswish.com/bi-annual-exception` | cap-database | BAE 2026-27 value | 2026-09-03 |
| `hoopsrumors.com` 2026 Offseason Check-Ins (NYK 08-30, CHI 09-02, SAS, WAS, BKN, OKC) | cap-database/reporting | independent second cap account per club, plus narrative | 2026-09-03 |
| `hoopsrumors.com` Clippers penalties story (2026-09-02, citing an NBA press release) | reporting → official-nba | the cap-circumvention ruling | 2026-09-03 |

**Thresholds are reused, not re-verified**, per brief and per `NBA_FINANCIAL_TRUTH.md` §1/§9.2:
cap **$164,961,000** · floor **$148,465,000** · tax **$200,428,000** · first apron **$209,015,000** ·
second apron **$221,686,000** · NTMLE **$15,044,000** · room MLE **$9,366,000** · taxpayer MLE
**$6,064,000** (pr.nba.com, effective 2026-06-30).

### 0.2 What is NOT verified, and must be read that way everywhere below

1. **No official NBA source exists for any club-level salary figure.** pr.nba.com publishes the
   thresholds only. Every club number here is third-party (SalarySwish), cross-checked where
   possible against a second third party (Hoops Rumors). Spotrac/Basketball-Reference were not
   used this session; dossier §7.9's "no independent third check" limitation still holds.
2. **The draft-pick ledger below is my own parse** of SalarySwish's pick grid (each cell renders a
   club logo, with a `traded` marker and an "in contention" marker for unresolved swap/protection
   outcomes). It is a genuine advance on dossier §7.12 #4 ("no verified per-year, per-team ledger")
   but it is **one source, machine-read, and protections are not resolvable from it.** Treat every
   pick line as *indicative*, never as a printable ledger.
3. **The 2026 offseason roster map itself** (Giannis in Miami, LeBron in Philadelphia, Trae Young
   in Washington, LaMelo Ball in Minnesota, Kawhi Leonard's status) originates in this repo's own
   research plus one reporter family; dossier §7.4 flagged it, and this session corroborates
   several pieces but does not independently establish the whole map.
4. **"Hard-capped" is unusable as published.** See §5.1. Do not print it.

### 0.3 One payroll definition, stated (BC-7)

Every club figure below is **SalarySwish "CAP HIT" — cap hit including cap holds and dead money**,
plus SalarySwish's own apron-room figures where the apron is at issue. Hoops Rumors publishes
*different* numbers because it separates "tax salary" from "apron salary." Where the two sources
put a club on **opposite sides of a line**, that is recorded as a blocking accuracy finding, not
as noise (§5.2).

---

## 1. THE EIGHT RECOMMENDED SEATS

Chosen to span four bands with at least one club genuinely under the cap (the `world.ts` REFRESH
invariant), and — more important for a three-act arc — chosen so that **no two seats have the same
kind of Act-2 dependency**. All figures as of **2026-09-03**, source SalarySwish team page unless
stated.

### SEAT 1 · DETROIT — the club with both the money and the picks

| | |
|---|---|
| **Cap position** | Cap hit **$188,615,753** (cap room **-$23,654,753**, i.e. over the cap). SalarySwish publishes **$40,646,795 of luxury-tax room** and **$20,399,247 of first-apron room**. Band: over-cap / under-tax on both readings. ⚠ Those two published figures do not share a base: the apron room implies a salary of $188,615,753 (holds included) while the tax room implies $159,781,205 (Detroit's roster cap hit, holds excluded — Detroit carries $28,834,548 of holds, the largest gap in the league). **Quote the published room; do not subtract cap hit from the tax line yourself.** |
| **Tool it actually has** | The **full non-taxpayer MLE, $15,044,000, entirely unspent** (SalarySwish MLE tracker: Detroit "Non-Taxpayer Space $15,044,000"). Plus the BAE, the minimum, and two live trade exceptions. Only Detroit and Charlotte hold a whole NTMLE. |
| **Real roster hole** | **Its starting centre is an unsigned restricted free agent.** Jalen Duren, 22, appears on Detroit's roster page with no 2026-27 salary and a **$19,449,432 RFA cap hold**. Ausar Thompson (23) is on a team-option rookie year with a $33,353,775 hold behind it. |
| **The one sentence for a 10-year-old** | "Detroit owns every one of its own first-round draft picks from 2027 all the way to 2033, and it has not spent one dollar of its $15,044,000 signing exception." |
| **ACT 2 dependency (real, dated)** | **Duncan Robinson is paid $15,992,957 this season and only $2,000,000 of it is guaranteed.** Detroit can remove roughly $14M from its books mid-season by waiving one player — a decision that exists in the data, not in fiction. Second dependency: Cade Cunningham's max escalates $50,105,628 → $53,817,156 → $57,528,684 → $61,240,212, so Detroit's room shrinks every year it does nothing. |
| **ACT 3 posture** | **AMBIGUOUS, leaning buyer.** It has the largest signing tool in the league, two TPEs, all seven of its own firsts, and $20.4M of apron headroom — and it also has the youngest max player in the league, which is the classic argument for patience. |
| **Trade assets** | Own firsts **2027, 2028, 2029, 2030, 2031, 2032, 2033** (all seven, no traded marker). TPEs: **Isaiah Stewart $15,000,000** and **Marcus Sasser $5,198,983**, both **expiring Jul 8, 2027** — i.e. they survive the deadline, which is a deliberate contrast with Seat 3. Movable salary: John Collins $17,000,000, Kevin Huerter $9,507,042, Isaiah Joe $11,323,006. |
| **FAIRNESS** | **STRONG in all three acts.** This is the control seat: the student who has everything still has to choose. |

### SEAT 2 · BROOKLYN — actual cap room, and nothing decided

| | |
|---|---|
| **Cap position** | Cap hit **$162,780,296**; **cap room $2,180,704**; **$37,647,704 of tax room**. Band: under-cap. Second account: Hoops Rumors (2026-08) says "$160MM, below cap by $4.9MM" — same band, different distance. |
| **Tool** | **Cap room, then the room exception $9,366,000** (SalarySwish MLE tracker lists Brooklyn's room space at $9,366,000; Hoops Rumors independently says "Room exception ($9.4MM) available"). No BAE ($0 of $0) because room was used. This is the seat that teaches the room-vs-MLE fork. |
| **Real roster hole** | Age and experience, not headcount: SalarySwish lists **five players aged 19–22 on first-round rookie contracts** (Mikel Brown Jr. 20, Egor Demin 20, Nolan Traore 20, Drake Powell 20, Noah Clowney 22). No player is older than 31. Wing behind Michael Porter Jr. is thin. |
| **The one sentence** | "Brooklyn has money left under the cap and it owns New York's first-round picks in 2027, 2029 and 2031 — so the worse New York gets, the better Brooklyn's picks are." |
| **ACT 2 dependency** | **The purest breakout/bust seat in the league.** Brooklyn went 20-62 in 2025-26 (third-worst record), lost the lottery tiebreak, and took Mikel Brown Jr. at No. 6 (Hoops Rumors check-in, 2026-08). Five rookies/second-years is five coin flips. Second dependency: **Julius Randle holds a 2027-28 player option worth $35,802,468.** |
| **ACT 3 posture** | **GENUINELY AMBIGUOUS — the best in the set.** Michael Porter Jr.'s **$40,806,150 expires** (a seller's asset), while the cap room makes Brooklyn one of the very few clubs that can **absorb someone else's unwanted salary in exchange for a pick** — buying and selling at the same time, in the same trade. |
| **Trade assets** | New York firsts **2027, 2029, 2031**; Suns 2029 (in contention); Sixers 2028 (in contention); Nuggets 2032; own firsts throughout. Expiring salary: Porter Jr. $40,806,150; Terance Mann $15,500,000. |
| **FAIRNESS** | **STRONG.** Every choice fully attributable — the reason `world.ts` already picked it. |

### SEAT 3 · MEMPHIS — a coupon that expires on a date

| | |
|---|---|
| **Cap position** | Cap hit **$161,034,793**; **cap room $3,926,207**; **$39,393,207 of tax room**. Band: under-cap. |
| **Tool** | **The $28,872,920 Jaren Jackson Jr. trade exception** is the real tool, plus the BAE $5,477,000 and the minimum. The NTMLE is spent ($9,000,000 on Quinten Post, per the MLE tracker). ⚠ SalarySwish shows Memphis with cap room *and* a used non-taxpayer MLE, which should be mutually exclusive; treat the pairing as a source oddity and do not model both. |
| **Real roster hole** | Its starting big. Memphis traded Jaren Jackson Jr. (the TPE is dated **Feb 3, 2026**) and now fields Zach Edey, Taylor Hendricks and 19-year-old Cameron Boozer up front. Separately, SalarySwish lists **19 players on the active table** against a 15-man regular-season limit — Memphis's September problem is subtraction. |
| **The one sentence** | "Memphis pays $21,909,021 this season to two players who already left, which is more than five times the $3,926,207 it has left to spend." (Kentavious Caldwell-Pope $17,744,971 + Cole Anthony $3,700,000 + Mamadi Diakite $464,050.) |
| **ACT 2 dependency** | **Cameron Boozer, 19, the No. 3 pick of the 2026 draft, $11,849,760.** (Slot inferred from the rookie scale: No. 1 $14,748,000 → Dybantsa/WAS, No. 2 $13,195,320 → Peterson/UTA, No. 3 $11,849,760 → Boozer/MEM, No. 4 $10,683,720 → Wilson/CHI — the four Hoops Rumors names as the "consensus top four.") Second dependency: **Jerami Grant, 32, $34,206,898, with a 2027-28 player option at $36,413,790.** |
| **ACT 3 posture** | **AMBIGUOUS, with a clock.** The JJJ trade exception **expires Feb 3, 2027**. The 2026 deadline fell on **Feb 5, 2026** (Hoops Rumors: Chicago "completed a league-high seven deals from February 1-5"); the 2027 deadline date is **NOT VERIFIED**. If it lands after Feb 3, Memphis's biggest tool dies days before the deadline — the single most dramatic real deadline device available. **Verify the 2027 deadline date before building a beat on it.** |
| **Trade assets** | 2027 firsts from **Utah, the Lakers and Cleveland** (all "in contention" markers, i.e. protections/swaps unresolved) plus its own; Magic and Warriors 2030 firsts; Suns 2031 second-round-adjacent capital. Movable salary: Jerami Grant $34,206,898, Isaiah Stewart $15,000,000. |
| **FAIRNESS** | **STRONG in Acts 2–3, FAIR in Act 1** (little to spend, and a cut-down problem instead). See §4. |

### SEAT 4 · MILWAUKEE — the club that just traded its superstar

| | |
|---|---|
| **Cap position** | Cap hit **$190,298,316**; **$10,129,684 under the tax**; **$13,641,684 under the first apron**. Band: over-cap / under-tax. |
| **Tool** | NTMLE, but **capped by apron room at $13,641,684** of the $15,044,000 (MLE tracker). BAE $5,477,000. And the **$25,456,566 Giannis Antetokounmpo trade exception, expiring Jul 6, 2027** — the largest TPE in the league. |
| **Real roster hole** | A lead creator. After the **2026-07-23** trade of Antetokounmpo and Bobby Portis to Miami (ESPN, per dossier §5.10), the largest salary on the roster is Tyler Herro at $33,000,000. |
| **The one sentence** | "Milwaukee pays Damian Lillard $21,311,053 every single year until 2031 and he plays for a different team — it is the third-largest number on their payroll." |
| **ACT 2 dependency** | **Tyler Herro, 26, is on an expiring $33,000,000 and becomes an unrestricted free agent in 2027.** The centrepiece of the Giannis return is playing a contract year, on a team that has to decide what it is. Second dependency: the $25.5M TPE decays in usefulness as the season runs. |
| **ACT 3 posture** | **AMBIGUOUS.** Retool around Herro/Turner, or convert Herro's expiring into future picks. Milwaukee has already sold one superstar this summer; whether it sells again is a genuine, arguable call. |
| **Trade assets** | Miami firsts **2031 and 2033** (from the Giannis trade); own 2028 (in contention), 2030 (in contention), 2032. **Own 2027 and 2029 firsts are marked traded away.** The $25,456,566 TPE. Expiring salary: Herro $33,000,000, Caris LeVert $14,809,200, Kyle Kuzma $20,490,152. |
| **FAIRNESS** | **STRONG.** Real money, a giant TPE, and the most emotionally legible situation in the set. |

### SEAT 5 · NEW YORK — the champion who was told no

| | |
|---|---|
| **Cap position** | Cap hit **$218,412,232**. **$17,984,232 over the tax**, **$9,397,232 over the first apron**, **$3,273,768 under the second apron.** Band: over-apron1. Independently confirmed by Hoops Rumors (2026-08-30): "above first apron by $9.4MM; below second apron by $3.3MM. No hard cap." **This is the best-corroborated club position in the whole document.** |
| **Tool** | **The taxpayer MLE, $6,064,000, and nothing bigger.** Bird rights on its own players survive both aprons. Both trade exceptions are frozen (largest $899,118). |
| **Real roster hole** | **Centre.** Mitchell Robinson, eight seasons a Knick, signed with Boston on **2026-07-06** using Boston's entire $15,044,000 non-taxpayer MLE — precisely the tool the first apron had taken away from New York. New York's only listed centre is Andre Drummond, 33, on a minimum. SalarySwish lists **13 players**; the league minimum is 14. |
| **The one sentence** | "New York won the championship in June 2026, its first in 53 years — and then let a centre who had been there eight seasons sign with Boston, because the owner said the club would not cross the second apron." (Hoops Rumors check-in, 2026-08-30.) |
| **ACT 2 dependency** | **The owner's ceiling is $3,273,768 away.** Hoops Rumors reports James Dolan said the club had no intention of surpassing the second apron in 2026-27 and that the edict remained in place two-plus months later. Every in-season addition — a 10-day contract, a buyout signing, absorbing a dollar in a trade — is measured against $3.27M. Second dependency: **Karl-Anthony Towns holds a 2027-28 player option worth $61,015,192.** ⚠ Present the Dolan position as *reported*, never as a quotation — this document did not obtain his words. |
| **ACT 3 posture** | **BUYER, and almost toolless — which is the interesting version.** The question is not whether to buy; it is what a defending champion can legally buy with $3.27M of headroom, no first-round picks in 2027, 2029 or 2031, and an owner mandate. |
| **Trade assets** | Own firsts **2030, 2032, 2033**; 2028 in contention. **2027, 2029 and 2031 own firsts are marked traded away on Jul 6, 2024** (the Mikal Bridges trade). Second-round capital acquired this summer: Suns 2029, Sixers 2030, Mavericks 2032, Suns 2033, Kings 2029. Movable salary: Josh Hart $20,923,760, Mikal Bridges $33,482,145. |
| **FAIRNESS** | ⚠ **WEAK IN ACT 1.** See §4 — this seat needs a specific fix. |

### SEAT 6 · WASHINGTON — the No. 1 pick and the 33-year-old max

| | |
|---|---|
| **Cap position** | Cap hit **$194,737,032**; **$5,690,968 of tax room**; **$14,277,968 under the first apron**. Band: over-cap / under-tax. Second account: Hoops Rumors says "$192MM, below tax by $8.4MM, below hard cap by $17MM" — same band. |
| **Tool** | NTMLE **$14,277,968** remaining, BAE $5,477,000, two TPEs (**$6,000,000 Jaden Hardy**, **$5,969,250 D'Angelo Russell**, both expiring Jul 8, 2027), minimum. |
| **Real roster hole** | Adult shooting around a teenage core. SalarySwish lists **six players aged 22 or younger** on the 14-man active table. The two large salaries (Anthony Davis $58,456,566, Trae Young $49,488,300) are bolted onto a roster that finished **17-65 in 2025-26, the worst record in the NBA** (Hoops Rumors check-in). |
| **The one sentence** | "Washington had the worst record in the league last season, won the draft lottery and took AJ Dybantsa first overall — and it is paying Anthony Davis $58,456,566 to play with him." |
| **ACT 2 dependency** | **Two, pointing opposite ways.** (a) **AJ Dybantsa, 19, No. 1 overall, $14,748,000** — the single most-watched rookie season in the league. (b) **Anthony Davis, 33, holds a 2027-28 player option worth $62,786,682.** A 33-year-old's health and a 19-year-old's development decide the same franchise's direction, and both resolve inside one season. Third: Deandre Ayton's $8,104,000 player-option year. |
| **ACT 3 posture** | **THE MOST AMBIGUOUS SEAT IN THE LEAGUE.** If Dybantsa is real and Davis is healthy, Washington buys with $14.3M of tools. If either fails, Davis's expiring-adjacent salary is the best selling asset on the market. There is no defensible default. |
| **Trade assets** | Own firsts **2027, 2031, 2032, 2033**; Blazers 2029; 2028 and 2030 in contention with Phoenix. Movable salary: Davis $58,456,566, Khris Middleton $5,591,112, Tre Mann $8,000,000. |
| **FAIRNESS** | **STRONG.** Money, tools, picks, and a genuine dilemma. |

### SEAT 7 · SAN ANTONIO — the cheapest superstar year that will ever exist

| | |
|---|---|
| **Cap position** | ⚠ **CONTESTED — see §5.2.** SalarySwish: cap hit **$200,465,083**, i.e. **$37,083 OVER the tax line**, $5,849,917 under the first apron. Hoops Rumors (2026-08): "Team salary: $198.3MM (tax); $201MM (apron). **Below luxury tax line by $2.1MM.**" **The two sources put San Antonio on opposite sides of the tax line.** |
| **Tool** | NTMLE **spent in full on Tobias Harris** ($15,044,000, 2026-07-06). Remaining: the bi-annual exception and the minimum. ⚠ Hoops Rumors calls the BAE **"$5.1MM"** in this check-in while its own July tracker and SalarySwish both say **$5,477,000** — do not print a BAE figure (§5.3). |
| **Real roster hole** | Frontcourt depth at power forward and centre — **stated directly by Hoops Rumors' own check-in** as San Antonio's declared offseason priority, addressed with two rookie bigs (Jayden Quaintance No. 20, Tarris Reed Jr. No. 26). |
| **The one sentence** | "San Antonio reached the Finals in June 2026 and lost to New York in five games — and Victor Wembanyama costs $16,868,246 this season and $43,500,000 next season." |
| **ACT 2 dependency** | **The rookie-scale window shuts.** Wembanyama, 22, is on the last team-option year of his rookie contract at **$16,868,246**; SalarySwish already carries his extension at **$43,500,000 for 2027-28**, rising to $57,420,000 with a player option in the final year. Everything San Antonio can afford this season becomes unaffordable next season, by rule, with no decision required. Second dependency: Tobias Harris, 34, and Harrison Barnes, 34, are the two veterans holding the rotation together. |
| **ACT 3 posture** | **BUYER — the least ambiguous seat here, deliberately included as the contrast.** A 60-22 Finals loser with a $16.9M superstar should buy. The interest is that buying is expensive: it sits within ~$37K–$2.1M of the tax line depending on which source you believe, and $5.85M under the first apron. |
| **Trade assets** | Hawks 2027 first; Celtics 2028 (in contention); Timberwolves/Mavericks 2030 (in contention); own 2029, 2032, 2033. **Own 2027 first marked traded away.** Movable salary: Devin Vassell $27,500,000, Keldon Johnson $18,000,000, Julian Champagnie $15,350,000. |
| **FAIRNESS** | **FAIR-TO-STRONG.** One real signing tool (BAE) plus minimums in Act 1, a strong Act 2, a strong Act 3. But see §5.2 — this seat cannot ship until the tax-line conflict is resolved. |

### SEAT 8 · SACRAMENTO — twelve players, two empty chairs, $2.3M

| | |
|---|---|
| **Cap position** | Cap hit **$202,859,372** — **$2,431,372 over the tax line**, **$2,305,628 under the first apron**. Band: over-tax / under-apron1. |
| **Tool** | **$2,305,628** — that is the whole of it. The NTMLE is reduced to $2,305,628 by apron room; the **bi-annual exception is already spent** (Precious Achiuwa, 2026-07-07, per the hard-cap tracker). Plus minimum contracts and two TPEs (**Dario Saric $5,426,000, expiring Feb 1, 2027**; Devin Carter $4,923,720, expiring Jun 30, 2027). |
| **Real roster hole** | **Two empty chairs.** SalarySwish lists **12 players on the active table**; a club must carry at least 14 standard contracts. Sacramento must add at least two players with about two and a quarter million dollars. |
| **The one sentence** | "Sacramento has twelve players, needs fourteen, has $2,305,628 to spend — and still owes DeMar DeRozan $10,000,000 this season not to play for them." |
| **ACT 2 dependency** | **Zach LaVine's $48,967,380 is an expiring player-option year** — the largest expiring contract among the eight seats, and it is either the club's best player or its best trade chip depending on how the season goes. Second: Domantas Sabonis, 30, $45,472,000 with $48,608,000 to follow; Malik Monk's 2027-28 player option $21,582,451. |
| **ACT 3 posture** | **AMBIGUOUS — the textbook fork.** Roughly $94M in two players who have not produced a contender, a tax bill already running, and the biggest expiring contract in the room. Pay to stay mediocre, or take it apart. Neither answer is obviously right, which is exactly what a defend-your-decision act needs. |
| **Trade assets** | Own firsts **2027–2030, 2032, 2033**; Spurs 2027 (in contention); Timberwolves 2031. Expiring salary: LaVine $48,967,380, De'Andre Hunter $24,910,714. |
| **FAIRNESS** | ⚠ **WEAK IN ACT 1** (effectively minimum-only), **STRONG IN ACT 3.** Fix in §4. |

---

## 2. ALTERNATES — fully real, each replacing a specific seat

| Club | 2026-09-03 position | Tool | Why it is here | Replaces |
|---|---|---|---|---|
| **Charlotte** | Cap hit $185,148,378; $15,279,622 tax room; $23,366,622 under apron 1 | **Full NTMLE $15,044,000 AND full BAE $5,477,000** — the only club with both entirely unspent | A rebuild with real buying power, four TPEs including **LaMelo Ball $40,770,520 (expires Jul 10, 2027)**, and the deepest pick stockpile parsed (Heat/Mavs 2027, Cavs 2029, Wolves + Suns 2033). Act 2: Brandon Miller, 23, on his last rookie-scale year before restricted free agency. ⚠ Roster page shows **24 filled spots** — no room to sign anyone in Act 1 without cutting. | Detroit (if Detroit's picks feel too dominant) |
| **Chicago** | ⚠ **CONTESTED BAND.** SalarySwish: cap hit $168,170,020, **$3.2M over the cap**. Hoops Rumors (2026-09-02): "$163MM (tax); $165.3MM (apron). **Below salary cap by $2MM.**" | Room exception $9,366,000; five TPEs, largest **Kevin Huerter $17,991,071 expiring Feb 3, 2027** | Big market, no star, flattest payroll (top salary Josh Giddey $25,000,000), **all seven own firsts intact**, and a deadline clock. Act 2: Caleb Wilson, 20, No. 4 overall. **Cannot be used until the band conflict is resolved** — the two sources disagree about which side of the salary cap Chicago is on, which is the one thing a band-based design cannot tolerate. | Brooklyn (as a second under-cap seat, if resolved) |
| **Oklahoma City** | Cap hit $218,365,399; **$2,820,601 under the second apron** (SalarySwish) / **$6.9M under** (Hoops Rumors) | Taxpayer MLE $6,064,000; **three usable TPEs, largest Luguentz Dort $17,722,222**; a **$2,443,860 Disabled Player Exception** | The 2025 champion paying for its own success from the smallest market. Act 2 is unusually concrete: **the league has certified Thomas Sorber out for the season** (DPE), and **Shai Gilgeous-Alexander's salary jumps $40,806,150 → $63,706,600 next season**. Rich in picks (Clippers + Nuggets 2027, Mavericks 2028, Nuggets 2029). | New York (same "capped-out contender" lesson, opposite market size) |
| **Utah** | Cap hit $185,689,039; $14,738,961 tax room | NTMLE **$3,044,000** left of $15,044,000; BAE $5,477,000; **Walker Kessler TPE $15,054,411** | The mirror image of a rebuild: a small market that converted stored picks into present salary (Jaren Jackson Jr. $49,000,000 + Lauri Markkanen $46,113,154 = $95.1M in two players). Act 2: **Darryn Peterson, 19, No. 2 overall, $13,195,320**. **Own 2027 first marked traded away.** | Memphis (as the "assets converted" counterpart) |

---

## 3. WHAT IS DELIBERATELY NOT A SEAT

| Club | Why not |
|---|---|
| **Denver** ($227,422,947; **$11,354,447 over the second apron**; MLE space $0, apron room $0, second-apron room $0) · **Orlando** (cap hit $221,676,711 but **$1,724,621 over the second apron** on SalarySwish's own apron measure; all exception space $0) | Above the second apron the reachable action space is minimum contracts and your own free agents. SalarySwish's mid-level tracker shows both clubs with **no space in any of the three mid-level columns** and $0 of cap, first-apron and second-apron room. `world.ts` already demoted Denver to a projector case, and that judgment holds for Orlando too. **An unfair seat in all three acts.** |
| **Phoenix** ($219,949,444; **$1,736,556 under the second apron**, hard-capped there; dead cap **$24,197,051** of which **Bradley Beal $19,383,010**) | The best dead-money image in the league and a superb projector case. As a seat: $1.7M of headroom, four own firsts (2027, 2029, 2031, 2033) marked traded away, and taxpayer-MLE space already spent on Luke Kennard. Nothing to play. |
| **LA Clippers / Toronto** | **Actively unresolved as of this session.** Hoops Rumors headline, 2026-09-03: "Raptors-Clippers Trade Expected To Be Finalized 'In The Next Couple Of Days'." Dossier §4.3's exclusion stands and is now dated. |
| **Golden State, Cleveland, Indiana, Miami** | Dossier §7.3's hard-cap contradiction persists unchanged in today's data (CLE $152,346 over the apron it is listed hard-capped at; MIA $1,255,957 over). See §5.1. |
| **Houston** | Hard-capped at the second apron with $1,882,798 of first-apron room; **DPE $12,500,000 for Fred VanVleet**. Real and interesting, but the tool set is nearly empty. |
| **Boston, Minnesota** (currently seats in `world.ts`) | Both are usable but weaker than the eight above. Boston: NTMLE spent on Mitchell Robinson, $5,391,952 of apron room. Minnesota: **taxpayer MLE already spent on Jonathan Kuminga**, $5,005,045 of second-apron room, and **own firsts in 2027, 2029, 2031 and 2033 all marked traded away** — minimum-only money *and* nothing to trade. Minnesota is the least fair seat in the current implementation. |

---

## 4. FAIRNESS — the seat-by-seat verdict, and the fixes

Rating scale per act: **STRONG** (multiple genuinely different legal moves) · **FAIR** (a real choice,
narrower) · **WEAK** (one dominant move or none).

| Seat | Act 1 (offseason) | Act 2 (in-season) | Act 3 (deadline) | Verdict |
|---|---|---|---|---|
| Detroit | STRONG — $15,044,000 + BAE + an unsigned RFA | STRONG — a $14M guarantee decision | STRONG — 7 firsts, 2 TPEs | **STRONG** |
| Brooklyn | STRONG — room + room exception | STRONG — 5 young players | STRONG — expirings + absorption | **STRONG** |
| Memphis | **FAIR** — $3.9M room + BAE, and a cut-down | STRONG — a No. 3 pick and a 32-year-old option | STRONG — expiring TPE | **STRONG overall** |
| Milwaukee | STRONG — $13.6M MLE | STRONG — a contract year | STRONG — $25.5M TPE + Heat picks | **STRONG** |
| New York | ⚠ **WEAK** — $6,064,000 and minimums, 13 players, $3.27M of headroom | FAIR — an owner ceiling, not a player | FAIR — buyer with no picks and no room | **NEEDS THE FIX BELOW** |
| Washington | STRONG — $14.3M MLE + BAE + 2 TPEs | STRONG — a 19-year-old and a 33-year-old | STRONG — either direction is defensible | **STRONG** |
| San Antonio | FAIR — BAE + minimums | STRONG — the rookie window closing | FAIR — buyer, expensively | **FAIR-TO-STRONG** |
| Sacramento | ⚠ **WEAK** — $2,305,628, effectively minimum-only | FAIR — an expiring max | STRONG — the classic fork | **NEEDS THE FIX BELOW** |

### 4.1 The two weak seats, and what to do about them

**NEW YORK — weak in Act 1.** A defending champion with the smallest signing tool in the room and
two empty roster spots has one obvious move (fill at the minimum) and no second one. That is a
punishment seat as written.
*Fix, using only real facts:* **make the owner mandate the Act-1 game, not the shopping.** New York
sits $3,273,768 under the second apron and its owner has said publicly it will not cross. Give the
desk the actual decision the real front office had — *obey the ceiling and lose your centre, or
break it and lose the tools* — and hand them the real counterfactual (Boston signed Mitchell
Robinson for $15,044,000 with the exact exception New York no longer had). That is a two-option
choice with a real answer and a real cost, and it is materially more interesting than the
$15M-MLE seats, not less. Then let Act 3 be about spending *someone else's* flexibility: New York
acquired five second-round picks and $5MM in cash this summer by trading down, which is a real,
dated, cheap-asset strategy a student can copy.

**SACRAMENTO — weak in Act 1.** $2,305,628 is not a choice, it is an instruction.
*Fix, using only real facts:* **invert the act.** Sacramento's real September problem is that it has
twelve players and needs fourteen, while sitting $2,431,372 over the tax line — every player it adds
costs more than it costs. Give the desk a *subtraction-and-substitution* Act 1 (which of your
$20M+ salaries do you move to get under the tax and create the room to reach fourteen?) rather than
a shopping Act 1. The two TPEs make that legal and real. If that is still thin, swap Sacramento for
**Charlotte**, which has both full exceptions unspent.

### 4.2 A structural fairness finding the design must absorb

**On 2026-09-03, most clubs are cutting, not signing.** SalarySwish's active tables show Memphis at
19, Milwaukee 17, Charlotte 17, Detroit 16 — all above the 15-man regular-season limit — while
Sacramento (12) and New York (13) are below the 14-man minimum. A September "signing window" Act 1
is therefore a *different economic problem* for different seats, and for four of them it is a
subtraction problem.

Two honest options, both real:
- **(a) Set Act 1 in the July window.** The free-agent board in `FREE_AGENT_BOARD_RESEARCH.md` is
  already built from July 2026 contracts, so the fiction and the data would finally agree. Cost: the
  club states in this document are September states and would have to be re-derived to July 1.
- **(b) Keep September and name it.** Camp is roughly three weeks away; clubs really are filling the
  last two spots at the minimum and waiving camp bodies. This is real, but it is a *smaller* Act 1
  and it makes the $15,044,000 exceptions inert for clubs already at 15.

I recommend **(a)**, and flag that it is a re-research job, not a copy edit.

---

## 5. ACCURACY FINDINGS — highest severity first

### 5.1 ⚠⚠ "Hard-capped" is still unusable, and it now affects a current seat

SalarySwish's hard-cap tracker (2026-09-03) lists **18 clubs hard-capped at the first apron**
(ATL, BOS, CHA, CLE, DAL, DET, IND, LAC, LAL, MEM, MIA, MIL, **MIN**, PHI, SAC, SAS, UTA, WAS) and
**2 at the second** (HOU, PHX), each with a dated triggering transaction. Useful. But:

- **Minnesota is listed hard-capped at the first apron while its own apron figure is $7,665,955 over
  it.** Miami ($1,255,957 over), Cleveland ($152,346 over) and Indiana ($3,204,396 over) show the
  same shape. A hard cap is by definition a line that may not be exceeded.
- Dossier §1.2 recorded (2026-07-10) that **MIN was hard-capped at the SECOND apron**; today's
  tracker says first. One of those is wrong, and `world.ts`'s Minnesota colour line — "Minnesota
  combined salaries in a trade, and doing that drew its own wall for the rest of the year" — rests
  on the second-apron version. Today's tracker attributes Minnesota's *second-apron* trigger to an
  **Aug 29 trade** and its first-apron trigger to a **Jul 10 trade**, so the claim's shape may
  survive, but the wall it names does not currently reconcile.

**Recommendation:** do not render hard-cap status for any club, and do not build an Act-3 mechanic
on it, until the reconciliation is established from primary text. This is the one place where the
three-act design most wants a rule ("your July choice removed your February options") and the
public data least supports printing it. The *shape* remains teachable; the club-level status does not.

### 5.2 ⚠⚠ Two clubs sit on opposite sides of a line depending on the source

| Club | SalarySwish (2026-09-03) | Hoops Rumors (2026-08/09) | Consequence |
|---|---|---|---|
| **San Antonio** | cap hit $200,465,083 → **$37,083 OVER the tax** | "$198.3MM (tax) … **below luxury tax line by $2.1MM**" | Different **band**. The dossier's flagship threshold-effect example ("$37,083 over a line that costs millions", §4.1 #10) is contradicted by a second cap source. |
| **Chicago** | cap hit $168,170,020 → **$3.2M OVER the cap** | "$163MM (tax) … **below salary cap by $2MM**" | Different **band**. Disqualifies Chicago as a seat until resolved. |

Both gaps are explained by the sources using different salary definitions (cap hit incl. holds vs
"tax salary" vs "apron salary"), which is *not* an error in either source — it is the definition
problem of dossier §7.12 #1, now demonstrated to move clubs across lines rather than merely change
distances. **A band-based design is only safe if the band is computed under one stated definition
and the seat is dropped when two reputable definitions disagree about the band.**

### 5.3 Corrections owed to the current implementation (`runtime/src/modules/sameLine/world.ts`)

| Line | Currently says | Today's data says | Severity |
|---|---|---|---|
| `sacramento.deadMoney` | `fact(0, …)` | **$10,000,000** — DeMar DeRozan, waived (SalarySwish Kings dead-cap table) | **Material.** The Sacramento seat's whole "you already spent it" tension is understated, and the number is checkable. |
| `minnesota` colour line | "drew its own wall for the rest of the year" | Hard-cap status contradicts its own apron salary; the apron named has changed since 2026-07-10 | **Material** — see §5.1 |
| `boston.deadMoney` `0`, `detroit.deadMoney` `0`, `brooklyn.deadMoney` `0`, `new-york.deadMoney` `0` | 0 | All four confirmed 0 today (SalarySwish) ✅ | none |
| `memphis.deadMoney` `$21,909,021` | — | Confirmed to the dollar ✅ ($17,744,971 + $3,700,000 + $464,050) | none |
| `milwaukee.deadMoney` `$21,977,720` | — | Confirmed ✅ ($21,311,053 Lillard + $666,667 Micić) | none |
| Wembanyama `$16,868,013` (dossier §4.1) | — | SalarySwish today: **$16,868,246** ($233 apart) | trivial, but neither is official |
| Bi-annual exception `$5,477,000` | — | SalarySwish tracker and Hoops Rumors' July article agree on $5,477,000; **Hoops Rumors' own Spurs check-in says "$5.1MM"** | **Do not print the BAE figure.** Dossier §7.4 already had it single-sourced; it is now internally contradicted. |

### 5.4 A new, well-sourced fact the dossier does not contain: Disabled Player Exceptions

Five clubs hold a 2026-27 DPE (SalarySwish DPE tracker, 2026-09-03). A DPE exists **only** when the
league office has determined a player is substantially more likely than not to be out through
June 15, so each one is the league's own certification that a specific named player is gone:

| Club | Player | His 2026-27 salary | DPE granted |
|---|---|---|---|
| Indiana | Tyrese Haliburton | $48,924,624 | $15,044,000 (the maximum) |
| Houston | Fred VanVleet | $25,000,000 | $12,500,000 |
| Dallas | Dereck Lively II | $7,239,130 | $3,619,565 |
| LA Clippers | Bradley Beal | $6,424,800 | $3,212,400 |
| Oklahoma City | Thomas Sorber | $4,887,720 | $2,443,860 |

This is the cleanest real Act-2 device in the dataset and nobody had to invent it: the exception is
worth **half the injured player's salary, capped at the NTMLE**, it can be used only once, and it
**dies the moment the injured player returns or on March 10, whichever comes first.** A student can
hold a coupon that disappears if their own player gets healthy. Only OKC among the candidate seats
holds one, which is an argument for promoting OKC.

### 5.5 A major real-world anchor that arrived yesterday

**2026-09-02 — the NBA penalised the LA Clippers for salary-cap circumvention** (Hoops Rumors,
citing an NBA press release): five forfeited first-round picks (2029–2033, each simply disappearing
from the draft), a **$30MM fine**, owner **Steve Ballmer suspended one year**, the president of
business operations suspended one year, the president of basketball operations suspended six
months, five years of league monitoring, **$700K** payable by Kawhi Leonard, and a five-year ban for
his business manager. The Clippers publicly rejected the findings the same day and said they would
challenge them.

This is the strongest available answer to "why does anyone obey the cap?" — the enforcement half of
the institution, which the dossier's teaching cases do not cover at all. **It is also the single
riskiest item in this document to put in front of children** (see §6).

---

## 6. RIGHTS AND SOURCE CONSIDERATIONS

*Evidence for a founder call. Not legal advice, and not a certification of anything.*

1. **Names, salaries, contract terms, transaction dates, draft-pick ownership, roster composition —
   public facts.** Consistent with dossier §8.1 #19. Nothing in §1–§4 of this document goes beyond
   that category.
2. **No logos, marks, arena imagery, player photography, jerseys, or likeness** are proposed here,
   and none should be added without a founder call (dossier §7.12 #8, §8.2 #22). ⚠ **Method note:**
   my draft-pick ledger was extracted from a third party's rendered **club logo images** (the alt
   text). The *fact* of pick ownership is fine; the images are not, and nothing derived from them
   should carry a logo into the product.
3. **Bulk reuse of a third-party compiled database is a different question from citing a fact from
   it.** This session machine-read SalarySwish across all 30 clubs to build a pick ledger, an
   exception table and a dead-money table. Individual sourced facts are ordinary journalism-style
   citation; a substantially reproduced compilation may engage that site's terms. **Escalate before
   any bulk-derived table ships**, and prefer holding a small hand-checked set of facts per seat
   over mirroring a dataset.
4. **⚠ The Clippers cap-circumvention case needs an explicit founder call before classroom use.** It
   is economically superb and officially sourced, but it consists of findings of misconduct against
   named living individuals, it is **under active challenge by the club as of 2026-09-03**, and one
   participant has publicly called the investigation a "witch hunt." That is a different rights and
   editorial category from "Milwaukee pays Damian Lillard $21,311,053." My recommendation: hold it
   as a **teacher-facing** example of why cap rules are enforced, not a student-facing case, and
   revisit once the challenge resolves.
5. **Owner and executive statements.** The James Dolan second-apron position (Seat 5) reached this
   document as a reporter's paraphrase, not a quotation. **Do not quote it.** The two safe on-the-record
   owner quotes remain the ones the dossier already verified (Lacob, Harrison).
6. **Sourcing honesty on screen.** Every club figure in the product should carry `asOf` and the
   source name, as `world.ts` already does. The stronger claim — that these are *NBA* figures — is
   false: they are third-party trackers' figures. The five thresholds are the only league-published
   numbers in the module.
7. Student names on shared screens stay fictional (CLAUDE.md §11) — unchanged, and unrelated to any
   of the above.

---

## 7. THE SILENTLY ROTTING TRUTH — what will be wrong by the time a class runs

### 7.1 Facts with a short half-life (rot within weeks)

| Fact | Why it rots | What breaks |
|---|---|---|
| Every club within ~$3M of a line: **SAS $37,083 over tax · ATL $373,050 under tax · CLE $152,346 over apron 1 · LAL $1,124,502 under · MIA $1,255,957 over · TOR $1,600,113 over · PHX $1,736,556 under apron 2 · ORL $1,724,621 over · HOU $1,882,798 under apron 1 · NOP $2,233,379 under apron 2 · SAC $2,305,628 under apron 1 · OKC $2,820,601 under apron 2 · NYK $3,273,768 under apron 2** | Camp opens ~3 weeks from 2026-09-03; every club must reach the 15-man limit; non-guaranteed deals and camp waivers move payroll by millions | Any beat that names a distance to a line, and — worse — any seat whose **band** flips |
| **Eight clubs carry more than 15 standard contracts today** (MEM 19, MIL 17, CHA 17, DET 16 among the candidates); **two carry fewer than 14** (SAC 12, NYK 13) | All resolve by opening night | The number of open jobs per seat, which is a core Act-1 parameter |
| The **Clippers–Raptors trade** "expected to be finalized in the next couple of days" (2026-09-03) | It will finalise | Any Toronto or Clippers fact; also possibly Kawhi Leonard's club |
| **Clippers penalties under challenge** (2026-09-02) | Legal process | The §5.5 anchor's tense |
| **Detroit guaranteed Paul Reed's 2026-27 salary** (Hoops Rumors headline, ~2026-09-03) | Already changed since the SalarySwish snapshot I parsed, which shows $0 guaranteed | Detroit's guarantee-decision Act-2 hook — pick Duncan Robinson, not Reed |

### 7.2 Facts with a season-long half-life (rot during the school year)

- **Every option in this document resolves in June–July 2027**: Towns $61,015,192, Davis $62,786,682,
  Randle $35,802,468, Grant $36,413,790, Gobert $38,000,000, Monk $21,582,451, Ayton $8,104,000.
- **Every expiring contract** used as an Act-3 asset (LaVine $48,967,380, Porter Jr. $40,806,150,
  Herro $33,000,000) is gone by July 2027.
- **Every TPE** dies on its stated date: SAC Saric **Feb 1, 2027** · MEM Jackson **Feb 3, 2027** ·
  CHI Huerter **Feb 3, 2027** · DET Stewart **Jul 8, 2027** · MIL Antetokounmpo **Jul 6, 2027** ·
  CHA Ball **Jul 10, 2027** · OKC Dort **Jul 19, 2027**.
- **Every DPE dies on March 10, 2027** or when the player returns.
- The **2027 trade deadline date is NOT VERIFIED.** The 2026 deadline was **February 5, 2026**
  (inferred from Hoops Rumors' "seven deals from February 1-5" and from the Feb 5, 2026 TPE start
  dates across many clubs). Whether Memphis's and Chicago's Feb 3 TPEs expire *before* the 2027
  deadline — which would be the best real drama in the whole design — **cannot be asserted yet.**
- Ongoing from the dossier: the **13-club regional-TV collapse** and the proposed centralised
  2027-28 streaming package; the **Lakers $12.5B sale** and Board of Governors approval.

### 7.3 What the product should actually do about it

1. **Keep the existing `world.ts` discipline and extend it to the three-act design.** No beat may
   depend on a club's exact distance to a line; only on its **band**. That rule is already written
   and it is correct.
2. **Add a second invariant for the three-act version:** *no Act-2 or Act-3 beat may depend on a
   date the league has not announced.* This kills the "TPE expires two days before the deadline"
   beat until the 2027 deadline date exists, however good it is.
3. **Make the refresh a two-source check, not a one-source check.** The failure mode this session
   found is not a stale number, it is **two live sources putting a club in different bands**
   (§5.2). The refresh procedure should be: read SalarySwish, read that club's Hoops Rumors
   offseason check-in, and **drop the seat if the two disagree about the band.**
4. **Freeze a dated snapshot and say so on the board.** The module already prints the payroll
   definition; it should also print one line the teacher can read aloud: *"These are the real
   numbers as they stood on [date]. Some of them have already changed — that is what a front office
   lives with."* That converts the staleness risk into the lesson rather than hiding it.
5. **Give the teacher a one-page pre-class check**, not a research task: five thresholds (annual),
   eight seat bands (per class), open-roster counts (per class). Nothing else should need checking,
   because nothing else should be load-bearing.
6. **Prefer durable dependencies over volatile ones when choosing Act-2 hooks.** Ranked by
   half-life: a rookie's development (whole season) > a player option (June) > a non-guaranteed
   salary (early January) > a distance to a line (days). Six of the eight Act-2 dependencies chosen
   above are in the top two tiers on purpose.

---

## 8. OPEN QUESTIONS THIS DOCUMENT COULD NOT CLOSE

1. **The 2027 NBA trade deadline date.** Not announced or not found. Blocks the best Act-3 device.
2. **The hard-cap reconciliation** (§5.1). Blocks hard-cap-as-mechanic.
3. **San Antonio's and Chicago's true band** (§5.2). Blocks two seats.
4. **The bi-annual exception's 2026-27 value** — $5,477,000 vs "$5.1MM", now contradicted inside one
   publisher. Blocks printing the BAE.
5. **Memphis showing cap room and a used non-taxpayer MLE simultaneously.** Should be mutually
   exclusive; unexplained.
6. **Pick protections.** The parse marks 60+ picks league-wide as "in contention," meaning an
   unresolved swap or protection. Dossier §7.12 #4 stands: there is still no verified protection
   ledger, and a top-4-protected pick is a materially different asset from an unprotected one in a
   student-to-student trade mechanic.
7. **Whether the Act-1 window should be July 2026 or September 2026** (§4.2). A design decision with
   a real research cost either way.
8. **Whether these club states will still be true in the 2026-27 school year at all.** Nothing in
   §1 has been checked against a source that will still be accurate in January. Assume all of it
   moves; build so that only the bands matter.
