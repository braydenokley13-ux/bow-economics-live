# NBA TRADE TRUTH DOSSIER
**Sports Reality review · Research date: 2026-09-03 · For BOW Economics Track 101, Module 1 (grades 5–8)**
**Scope: the rules needed to build a student-to-student trade mechanic and a Trade Deadline lesson, under the 2023 CBA as applied to the 2026-27 league year.**

**Companion document:** `NBA_FINANCIAL_TRUTH.md`. That dossier's §1 thresholds are treated as settled here and are not re-verified. Its §9.1 trade-matching resolution **is** re-examined; see §OVERTURNS at the end.

---

## HOW TO READ THIS DOCUMENT

Three evidence grades are used, and they mean different things:

- **OBSERVED** — I opened the source this session and read the sentence I am citing. For the CBA this means I downloaded the PDF, extracted all 676 pages to text, and read the cited Article/Section.
- **INFERRED** — I derived it by arithmetic or logic from something OBSERVED. The derivation is shown.
- **NOT VERIFIED** — I could not open a source that says it. Stated as such, never as fact.

**Primary source used throughout:** the 2023 NBA Collective Bargaining Agreement PDF, downloaded 2026-09-03 from
`https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf`
(676 pages, 2,850,534 bytes). Cited below as **CBA Art. VII §X**. This is `cba` tier — the highest tier available for rules, higher than any database or explainer.

**Independent corroboration** comes from `cbaguide.com` (a CBA-tier explainer that reproduces the CBA's own defined terms) and `hoopsrumors.com` (cap-database tier). Where the CBA and a secondary source disagree, **the CBA wins and the disagreement is recorded**.

Spotrac, Basketball-Reference and RealGM were not attempted this session; DuckDuckGo was blocked by the network path (`ws_closed_mid_exchange`), so no open web search was possible. Everything below was obtained by direct URL fetch or from the CBA PDF.

---

## 1. SALARY MATCHING — RESOLVED FROM PRIMARY TEXT

### 1.1 The structure: there is no single "salary matching rule"

**OBSERVED — CBA Art. VII §6(j).** There is no rule called "salary matching." There are **five** Traded Player Exceptions, and a team picks whichever one its situation permits. This is the reason three careful researchers produced three different answers in `NBA_FINANCIAL_TRUTH.md` §7.1.

| Exception | CBA cite | Players OUT | Players IN | Simultaneous? | Incoming salary allowed |
|---|---|---|---|---|---|
| **Room Under Salary Cap** | §6(j)(1)(v) | 1+ | 1+ | yes | team's room under the cap **+ $250,000** |
| **Standard TPE** | §6(j)(1)(i) | **exactly 1** | 1+ | **may be non-simultaneous, within 1 year** | **100% of outgoing + $250,000** |
| **Aggregated Standard TPE** | §6(j)(1)(ii) | **2+** | 1+ | simultaneous only | **100% of aggregated outgoing + $250,000** |
| **Expanded TPE** | §6(j)(1)(iv) | 1+ | 1+ | simultaneous only | a three-band ladder — see §1.3 |
| **Transition TPE** | §6(j)(1)(iii) | 1+ | 1+ | simultaneous only | 110% + $250,000 — **2023-24 SALARY CAP YEAR ONLY** |

**The 110% figure is dead.** CBA §6(j)(1)(iii) opens with the words "During the 2023-24 Salary Cap Year only." Every source that quotes 110% as a current apron rule is quoting a rule that expired in June 2024. Corroborated by [Hoops Rumors, 2023-09-05](https://www.hoopsrumors.com/2023/09/salary-matching-rules-for-trades-during-2023-24-season.html): "For the 2023/24 season only, teams above either apron are permitted to take back up to 110% of their outgoing salary." **OBSERVED, both sources.**

### 1.2 Team UNDER the cap — absorbing into cap space

**OBSERVED — CBA Art. VII §6(j)(1)(v).** A team with team salary below the cap may acquire players whose post-assignment salaries total no more than **its room under the cap plus $250,000**. It does **not** need to send anything out. The $250,000 is a rounding cushion, not a strategy.

**OBSERVED — same section, final sentence.** A team using cap room "may not simultaneously acquire any players in accordance with Sections 6(j)(1)(i)-(iv)." **You use room or you use an exception, never both in the same trade.**

**OBSERVED — CBA Art. VII §6(j)(2).** An under-cap team may instead *elect* to conduct the trade under §6(j)(1)(iii)-(iv) — i.e. use the Expanded TPE rather than its room. This is a real choice with a real cost (see §2.2: the Expanded TPE hard-caps you).

**OBSERVED — CBA Art. VII §6(n)(1).** A team may use the Disabled Player, Bi-annual, Non-Taxpayer MLE, Taxpayer MLE and Traded Player Exceptions **only if** its team salary is at or above the cap, or below the cap by less than the amount of the exception. This is the gate that makes "over the cap" the trigger for the whole matching apparatus.

### 1.3 Team OVER the cap and staying at or below the FIRST apron — the Expanded TPE ladder

**OBSERVED — CBA Art. VII §6(j)(1)(iv).** Incoming salary may be the **greater of**:

- (y) the **lesser of**: (A) 200% of aggregated outgoing + $250,000; or (B) 100% of aggregated outgoing + $7,500,000 × (current cap ÷ 2023-24 cap); **or**
- (z) 125% of aggregated outgoing + $250,000.

**INFERRED — arithmetic.** 2023-24 cap = $136,021,000 (OBSERVED, [cbaguide.com/thresholds](https://cbaguide.com/thresholds/); cross-checked against the 2023-24 first apron of $172,346,000 in the Hoops Rumors article above). 2026-27 cap = $164,961,000 (settled in `NBA_FINANCIAL_TRUTH.md` §1). Therefore the indexed dollar term for 2026-27 is
`$7,500,000 × 164,961,000 ÷ 136,021,000 = $9,095,709`.
Solving the "greater of / lesser of" for the crossover points gives band boundaries at **$8,845,709** and **$35,382,838**.

**OBSERVED — [cbaguide.com/transactions/trades/tpe/](https://cbaguide.com/transactions/trades/tpe/), fetched 2026-09-03**, publishes the same ladder with rounded figures:

| Outgoing salary (2026-27) | Incoming salary allowed |
|---|---|
| up to **$8,846,000** | **200% of outgoing + $250,000** |
| **$8,846,001 – $35,384,000** | **outgoing + $9,096,000** |
| **$35,384,001 and above** | **125% of outgoing + $250,000** |

My independent CBA arithmetic and cbaguide's published table agree to within $1,200 (rounding). cbaguide also publishes the 2025-26 dollar term as $8,527,000; my formula gives $8,527,011. **Three-way consistency. Confidence: high.**

This is the correct, current, dated answer to "what are the actual bands and percentages." It did not exist in verified form anywhere in `NBA_FINANCIAL_TRUTH.md`.

**Note the "$7.5M / $29M" breakpoints quoted in most write-ups are 2023-24 figures**, and even for 2023-24 the first breakpoint was **$7,250,000**, not $7,500,000 — the Hoops Rumors 2023 article says "up to $7,500,000," but at $7.5M out the formula's lesser branch is already $15.0M (outgoing + $7.5M), not $15.25M (200% + $250K). **INFERRED; a small error in an otherwise reliable source.**

### 1.4 Team whose post-trade salary is ABOVE the FIRST apron — dollar-for-dollar

**OBSERVED — CBA Art. VII §6(j)(3):** "if a Team's post-assignment Apron Team Salary would exceed the First Apron Level, then the $250,000 allowance referenced in each of Sections 6(j)(1)(i)-(v) above shall be reduced to $0."

Combined with §2(e)(4) row E (the Expanded TPE is unavailable above the first apron — see §2), the result is: **an over-first-apron team may take back at most 100% of what it sends out, exactly, with no cushion.** It cannot take back one dollar more than it sends.

Corroborated independently: [Hoops Rumors, 2023-09-05](https://www.hoopsrumors.com/2023/09/salary-matching-rules-for-trades-during-2023-24-season.html) — "A team whose salary is above the first apron and below the second apron won't be able to take back more salary than it sends out in a trade. For instance, a team trading a player with a $10MM salary wouldn't be able to take back a player earning $10.1MM." And [cbaguide.com/transactions/trades/tpe/](https://cbaguide.com/transactions/trades/tpe/) summary table: exceeding the **first apron** costs you the ability to "receive more Incoming Trade Salary than Outgoing Trade Salary." **OBSERVED, three sources, all agreeing. Confidence: high.**

### 1.5 The test is POST-TRADE, not pre-trade

**OBSERVED — CBA Art. VII §6(j)(3) ("post-assignment Apron Team Salary") and §2(e)(2)(i)(A) ("immediately following such transaction").**

This is the single most misunderstood point in the whole system and it matters enormously for a simulation. **Apron restrictions are not a property of who you are. They are a property of where the trade lands you.** A team $2M under the first apron is restricted if the trade would push it over. A team $2M over the second apron is *unrestricted* on aggregation if the trade drops it under.

cbaguide states it as a worked hypothetical (OBSERVED): a second-apron team wanting to aggregate a $9.3M and a $10.1M player for one $17M player "can't do so **if they still are over the Second Apron after the Trade** … if it cuts enough Salary to drop the Team below the Second Apron, then they could use the Aggregated TPE, as **it only matters where the Team lands after the trade**."

### 1.6 What "aggregation" actually means, and when it is allowed

**Aggregation = combining two or more outgoing player contracts to create one larger pool of outgoing salary in a single simultaneous trade.** It is the mechanism by which "two mediums for one star" works.

**OBSERVED — CBA Art. VII §2(e)(4) row H.** Using the Aggregated Standard TPE is permitted **unless** the team's apron team salary immediately after the trade would exceed the **second apron**. Using it also hard-caps the team at the second apron for the rest of the year (see §2).

So aggregation is **not** banned for first-apron teams. It is banned only for teams that would remain above the second apron after the trade.

**Two restrictions on aggregation that bite in practice (both OBSERVED, CBA Art. VII §6(j)(4)):**

1. **§6(j)(4)(i) — the two-month rule.** A player whose contract was **acquired pursuant to an Exception** within the preceding **two months** may not be one of the contracts being aggregated. The CBA's own example: "if a player were traded to a Team pursuant to an Exception on November 20, 2023, then the player's Contract could not be aggregated with any other Contract for purposes of a trade until January 20, 2024." **Carve-out:** if acquired **on or before December 16** of a salary cap year, the restriction does not apply to a trade made on or after the day before that year's deadline.
   **This is a restriction on AGGREGATION, not on trading.** A recently acquired player may be traded immediately; he simply cannot be *combined* with another salary. Every secondary framing I have seen calls this a "60-day re-trade restriction." That framing is wrong on both counts: it is two calendar months, and it does not prohibit re-trading.
2. **§6(j)(4)(ii) — the minimum-stacking rule.** Outside the December 15–deadline window, if a team aggregates **three or more** outgoing contracts and receives back **fewer players than it sent**, no more than **one** of the outgoing players may be a minimum-salary player. This exists because minimum contracts count as **$0 incoming** salary for the receiving team (OBSERVED, [cbaguide trade salary page](https://cbaguide.com/transactions/trades/tradesalary/)), so stacking minimums is otherwise free outgoing salary.

### 1.7 What changed vs. the old 125% + $100,000 rule

**INFERRED from the CBA text above plus the 2023 Hoops Rumors article (OBSERVED).** The 2017 CBA gave over-cap non-taxpayers a flat 125% + $100,000. The 2023 CBA replaced that single number with:

- a **more generous** ladder for teams below the first apron (200% on small salaries, a flat ~$9.1M cushion in the middle) — but using it now costs you a hard cap;
- a **harsher** rule above the first apron (100% + $0, previously 125% + $100K for taxpayers);
- a **new** aggregation prohibition above the second apron, which did not exist at all;
- the cutoff moved from **the tax line** to **the first apron**, so the generous ladder now reaches teams that are already taxpayers.

**The economic character of the change: the price of flexibility became a step function in payroll rather than a constant.**

---

## 2. APRON RESTRICTIONS ON TRADES

### 2.1 Hard-cap-by-action vs. apron-by-payroll — these are two different rules

**OBSERVED — CBA Art. VII §2(e)(2)(i).** The Transaction Restrictions Table does exactly two things per transaction:

- **(A) a gate:** you may not do this transaction if, *immediately following* it, your apron team salary would exceed the Applicable Apron Level. *(apron-by-payroll — a live test at the moment of the trade)*
- **(B) a hard cap:** if you do this transaction, you may not exceed that Applicable Apron Level **for the remainder of the salary cap year**, for any reason. *(hard-cap-by-action — a permanent consequence of your own choice)*

**No team is ever "assigned" a hard cap. Every hard cap in the NBA is self-inflicted by a transaction the team chose to make.** This is the highest-value classroom fact in the entire trade system and it is primary-text verified.

**OBSERVED — CBA Art. VII §2(e)(2)(ii).** Between the day after the last regular-season game and June 30, rows E–J *additionally* test **next year's** apron salary and hard-cap the team **for the entirety of the following salary cap year**. An offseason trade can therefore hard-cap a team through the following February deadline.

**OBSERVED — CBA Art. VII §2(e)(2)(iii)(B).** From 2024-25 onward, once a team has signed anyone with the **taxpayer MLE**, it may not engage in **any** of rows A–F for the rest of that year — including all the trade rows. A July signing decision closes trade doors in February.

### 2.2 The complete Transaction Restrictions Table (verbatim structure)

**OBSERVED — CBA Art. VII §2(e)(4), rows A–K.** Reproduced in full because every published summary I checked was a paraphrase.

| Row | Transaction | Applicable Apron Level |
|---|---|---|
| A | Signs or acquires a player using the **Bi-annual Exception** | First |
| B | Signs or acquires a player using the **Non-Taxpayer MLE** | First |
| C | **Acquires a player via sign-and-trade** (a contract under §8(e)(1)) | First |
| D | Signs a player during the regular season who was **waived during that regular season** and whose pre-waiver salary exceeded the NTMLE | First |
| E | Acquires a player using the **Expanded TPE** | First |
| F | Acquires a player using a **Standard TPE** after the end of the regular season in which it arose (or, for an offseason-arising TPE, after the following regular season) | First |
| G | Acquires a player using the **Transition TPE** | First |
| H | Acquires a player using the **Aggregated Standard TPE** | **Second** |
| I | **Pays cash** to another team in a trade | **Second** |
| J | Acquires a player using a TPE that arose from a **signed-and-traded contract** | **Second** |
| K | Signs a player using the **Taxpayer MLE** | **Second** |

**This resolves `NBA_FINANCIAL_TRUTH.md` §7.2's buyout-market dispute.** Row D — the in-season buyout-market restriction — is a **FIRST apron** row. Researchers 1 and 2 were right; Researcher 3's placement at the second apron was a transcription error.

### 2.3 Exactly what a FIRST apron team cannot do in a trade

**INFERRED from the table above (rows C, E, F) plus §6(j)(3), all OBSERVED.** A team whose post-trade apron team salary would exceed the first apron:

1. **Cannot use the Expanded TPE** (row E) — so it cannot take back more salary than it sends.
2. **Loses the $250,000 cushion** (§6(j)(3)) — matching becomes exactly dollar-for-dollar.
3. **Cannot acquire a player by sign-and-trade** (row C).
4. **Cannot use a Standard TPE carried over from an earlier period** (row F) — a stored TPE it already owns becomes unusable. cbaguide (OBSERVED) renders this as a shortened shelf life: over the first apron, an in-season TPE dies at the end of that regular season, and an offseason TPE dies with the following regular season, instead of lasting twelve months.
5. **Cannot sign a bought-out player** whose pre-waiver salary exceeded the NTMLE (row D) — not a trade, but it removes the deadline's main alternative to trading.

It **can** still aggregate (row H is a second-apron row) and it **can** still send cash (row I is a second-apron row).

### 2.4 Exactly what a SECOND apron team additionally cannot do

**INFERRED from rows H, I, J plus §6(f), all OBSERVED.** A team whose post-trade apron team salary would exceed the second apron additionally:

6. **Cannot aggregate two or more outgoing contracts in one trade** (row H). It may still send one player out and take back several players, as long as the total coming in does not exceed the one salary going out. cbaguide's worked example (OBSERVED): the 2025 Suns, a second-apron team, could trade Kevin Durant's $54.7M for two ~$27M salaries, but could not combine Royce O'Neale's $9.3M and Cody Martin's $8.1M into one $15M acquisition — *even though that would have cut payroll*.
7. **Cannot send cash in a trade** (row I). As of 2026-08-13 exactly one team was in this position: **Denver** ([Hoops Rumors cash tracker](https://www.hoopsrumors.com/2026/08/cash-sent-received-in-nba-trades-for-2026-27.html), OBSERVED).
8. **Cannot use a TPE that arose from a sign-and-trade** (row J).
9. **Cannot sign anyone with the taxpayer MLE** (row K) — the last remaining MLE.
10. **Draft Pick Penalty (§6(f)).** **OBSERVED, primary text, and it settles `NBA_FINANCIAL_TRUTH.md` §7.2.** A "Second Apron Team" is one whose apron team salary exceeds the second apron **as of the start of its last regular-season game** of that year. Such a team:
    - is **prohibited from trading, conditionally or unconditionally, its own first-round pick in the first draft occurring after the seventh season following** that year — the CBA's own example: second apron in 2024-25 ⇒ the **2032** first-rounder is frozen;
    - over the **next four** salary cap years: if it is a second-apron team in **two or more** of them, that pick is **moved to the last selection of the first round** (multiple penalized picks order by inverse winning percentage);
    - if it is a second-apron team in **fewer than two** of those four years, the pick becomes tradable again the day after the regular season of the **third non-second-apron year**, with no penalty.

    **The correct numbers are 7 drafts and 2-of-4. Not 8 drafts. Not 3-of-5.** The "3 of 5" version circulating in reporting is not in the CBA text.

### 2.5 The choice this creates — the most economically interesting thing in the trade rules

**INFERRED from §2(e)(4) rows E/H and §6(j)(1)(i)-(ii), OBSERVED.** A team comfortably below the aprons has a genuine, non-dominated choice on any trade:

- Use the **Standard / Aggregated Standard TPE** (100% + $250K). It is tighter, but rows E–G are not triggered, so **no hard cap**. (Row H still applies to aggregation, hard-capping at the *second* apron — usually not binding for such a team.)
- Use the **Expanded TPE** and take back much more salary — but row E **hard-caps you at the first apron for the rest of the year**, and if it is an offseason trade, for all of next year too.

**That is option value priced in dollars, and both branches are rational.** It is the cleanest "flexibility now vs. flexibility later" decision the NBA rulebook contains, and nothing in `NBA_FINANCIAL_TRUTH.md` identified it.

---

## 3. TRADE EXCEPTIONS (TPEs)

**Terminology warning (OBSERVED, [cbaguide TPE page](https://cbaguide.com/transactions/trades/tpe/)).** The CBA uses "Traded Player Exception" as the umbrella term for all five exceptions in §6(j). The media uses "TPE" to mean only the *leftover credit* from a non-simultaneous Standard TPE. **These are different things and the confusion is the source of most bad writing on this topic.** This document uses "stored TPE" for the media sense.

**How a stored TPE is created (OBSERVED, CBA Art. VII §6(j)(1)(i)).** Only the **Standard** TPE is non-simultaneous. A team sends out exactly one player and takes back less (or nothing). The unused difference becomes a credit it may spend later.

**Size.** 100% of the traded player's pre-trade salary + $250,000, minus whatever was taken back at the time. The $250,000 is $0 if the team lands above the first apron (§6(j)(3)).

**Duration.** **One year from the date the traded player was traded** (§6(j)(1)(i)). Shortened for over-first-apron teams (row F, §2.3 above).

**OBSERVED — CBA Art. VII §6(n)(4).** Beginning January 10 each season, unused exceptions shrink daily by 1/(days in regular season). **The Traded Player Exception, the Minimum Player Salary Exception and the Disabled Player Exception are explicitly excluded.** A stored TPE keeps its full value until it expires. It is a store of purchasing power with a cliff, not a melting one.

**Cannot be combined.** A stored TPE cannot be aggregated with other outgoing salary or with another stored TPE — this follows from §6(j)(1)(i)'s structure (one Traded Player, replaced by Replacement Players) and from §6(j)(1)(v)'s explicit bar on combining room with §6(j)(1)(i)-(iv). **Confidence: high on the structure; I did not find a single sentence in the CBA saying "TPEs may not be aggregated with each other," so treat the flat statement as INFERRED rather than quoted.**

**Who can use one.** Only a team at or above the cap, or below it by less than the exception's value (§6(n)(1), OBSERVED). A team with real cap room cannot hold a TPE — the room extinguishes it (§6(n)(2), OBSERVED).

**No TPE arises from trading a two-way player** (§6(j)(8), OBSERVED). Two-way contracts count as **$0** trade salary in both directions (OBSERVED, cbaguide trade salary page).

**Real, dated example (OBSERVED, `NBA_FINANCIAL_TRUTH.md` §4.2, SalarySwish):** Chicago entered 2026-27 holding a **$17,991,071** stored TPE from the Kevin Huerter trade. Utah holds ~$15.1M from Walker Kessler. Both expire. Both are real use-it-or-lose-it pressure with no invented urgency. *(Team-level figures are cap-database tier and inherit that dossier's §4 confidence caveat.)*

---

## 4. DRAFT PICK TRADING CONSTRAINTS

**This is the weakest-sourced section in this document. The governing text is the NBA Constitution & By-Laws, which is not published publicly. Nothing below is primary-text verified.**

**The seven-year rule.** **OBSERVED at cbaguide** ([trade rules page](https://cbaguide.com/transactions/trades/traderules/)): "Both First and Second Round Picks can only be traded no later than the 7th Draft following the date of the Trade… immediately upon the conclusion of the 2026 NBA Draft, Teams will then be permitted to Trade their 2033 picks." **Note this applies to second-rounders too** — `NBA_FINANCIAL_TRUTH.md` §2.8 stated the horizon without that detail. **Tier: cba-explainer, single source. NOT primary-verified.**

**The Stepien Rule.** **OBSERVED at cbaguide:** "A Team must never have the *possibility* to not have a First Round Pick in two consecutive Seasons. Therefore, if a protection creates the possibility, then it is prohibited. A Team may own another Team's Draft Pick to satisfy the Stepien Rule." Dated real example on the same page: as of the 2025 offseason the Suns held neither their own 2026 nor 2027 first, but satisfied Stepien by owning the least favorable of Utah's, Cleveland's and Minnesota's 2026 firsts.
**The claim that pick swaps are exempt is INFERRED, not sourced.** cbaguide does not state it; the reasoning (a swap leaves the team with *a* selection) is sound but unverified. **`NBA_FINANCIAL_TRUTH.md` §2.8 asserts the swap exemption; that assertion is still unsourced.**

**Protections.** **OBSERVED at cbaguide.** Conveyance may be made contingent on draft position. If a protected pick does not convey, further contingencies may be attached for named future years. A team may add protections to a pick it acquired only if it holds that pick unconditionally, or initially held it unconditionally and added protections in a separate trade. One-time **deferral options** exist (defer conveyance or receipt by one year); deferral and protection cannot both be used on the same pick. Real example on the page: the Pelicans' 2019 Anthony Davis-trade right to defer the Lakers' 2024 first to 2025, which they exercised.

**Picks are $0 in trade math.** **OBSERVED, cbaguide trade salary page.** Draft picks, swap rights, draft rights and cash all count as **zero** incoming and outgoing trade salary. Picks and salary are two separate currencies in the same transaction — this is a genuinely important structural fact for a trade mechanic.

**Minimum tradeable assets and the Touch Rule.** **OBSERVED, cbaguide trade rules page.** In a two-team trade each side must send *and* receive at least one of: a player contract, a draft pick (protected up to 55 picks), draft rights, swap rights, or **at least $110,000 cash**. In a three-or-more-team trade, each team must "touch" at least two others, and the cash minimum rises to **$1,100,000**.
**Corroborated by real 2026-27 transactions** (OBSERVED, [Hoops Rumors cash tracker](https://www.hoopsrumors.com/2026/08/cash-sent-received-in-nba-trades-for-2026-27.html), 2026-08-13): Charlotte sent exactly **$110,000** to Houston; the Clippers sent exactly **$1,100,000** to Milwaukee. Those are not round numbers by accident — they are the legal minimum to make a team a participant.

**Cash in trades.** **OBSERVED, CBA Art. VII §8(a):** a team may pay or receive up to **5.15% of the salary cap** per league year, aggregated across all trades, **sending and receiving counted separately and never netted**. The CBA gives the worked example itself. Cash has **no effect on team salary** (OBSERVED, cbaguide) — it moves only the owner's bank balance.
**A live numeric discrepancy:** 5.15% × $164,961,000 = **$8,495,491.50** (INFERRED). Hoops Rumors publishes **$8,495,000** (OBSERVED, 2026-08-13). cbaguide publishes 2025-26 as $7,964,320, which is 5.15% × $154,647,000 truncated. The two secondary sources round differently. **Do not print a cash figure to the dollar.**

---

## 5. ROSTER LIMITS AND THE TRADE WINDOW

### 5.1 Roster limits — now primary-text verified

**OBSERVED — CBA Art. XXIX §§1–4.** This closes `NBA_FINANCIAL_TRUTH.md` §7.5's open item.

- **§2(a)** In-season a team must carry **14 or 15** players in aggregate on Active + Inactive lists.
- **§2(b)(i)** It may carry **12 or 13** for no more than **two consecutive weeks** and **28 total days** per season. *(`NBA_FINANCIAL_TRUTH.md` §2.10 said "may drop to 13"; the CBA permits 12.)*
- **§2(c)** Each two-way player on the Active or Inactive list **raises both the minimum and maximum by one**.
- **§2(d)** Outside the regular season, maximum **21** across Active, Inactive and Two-Way lists.
- **§1** Active List: at least **12**, no more than **15**, minimum 8 on the bench; **11** permitted for the same two-week / 28-day allowance.
- **§4** **A player waived after 11:59 p.m. ET on March 1 is postseason-ineligible for any other team.** This is the real deadline on the buyout market, and it is three-and-a-half weeks after the trade deadline.

**The open-roster-spot rule.** **OBSERVED at cbaguide** (trade rules page), **not located in the CBA primary text this session:** if a team is acquiring more players than it is sending out, it must have an open roster spot **before executing the trade** — and this holds even if it intends to waive the player immediately. It may request a waiver and open the spot without waiting for the player to clear.
**Corroborating real case (OBSERVED, [Hoops Rumors, 2025-10-24](https://www.hoopsrumors.com/2025/10/key-in-season-nba-dates-deadlines-for-2025-26.html)):** six teams entered 2025-26 unable to sign a 15th man purely because of hard-cap proximity, with named dates on which each would gain the room — Golden State Nov 11, Clippers Jan 7, Rockets Jan 8, Magic Jan 9, Lakers Jan 18, Knicks Apr 2. **A roster spot you legally own but cannot afford to fill is a scarce resource with a price and a date.**

### 5.2 The trade deadline

**NOT VERIFIED: the 2026-27 trade deadline date.** As of 2026-09-03, Hoops Rumors' in-season calendar for 2026-27 had not been published (their 2025-26 edition appeared 2025-10-24). The CBA does not set the date — it refers to "the NBA trade deadline" as an externally fixed date (six references, Art. VII §§6(j)(4), 6(n)(4), 8(c); Art. XXII §11(g)). **Do not print a 2027 deadline date until the league schedule confirms it.**

**Dated precedent (OBSERVED, Hoops Rumors 2025-10-24):** the 2025-26 deadline was **February 5, 2026, 2:00 p.m. CT**. On the same calendar: February 6 is when unused MLE/BAE value begins prorating downward retroactive to January 10, and **April 12, 2026 was the last day of the regular season and the day on which luxury tax penalties are calculated**. The tax bill is computed on the payroll a team carries at the end of the regular season — which is the entire economic reason the deadline is a deadline.

**OBSERVED — CBA Art. VII §8(c).** A team cannot trade a player after the trade deadline occurring in the last season of his contract, **or** after the deadline in any season that could be his last based on an option or ETO.

### 5.3 When a player may be traded

**All OBSERVED, CBA Art. VII §8(d) and §8(f).**

| Situation | Earliest tradeable |
|---|---|
| Draft rookie signing a standard contract, or anyone signing a two-way | **30 days** after signing |
| Free agent signing a standard contract | later of **3 months** or **December 15** |
| Over-cap team re-signing its own Bird / Early Bird free agent at **>120%** of his prior salary (minimum deals exempt) | later of **3 months** or **January 15** |
| Player who signed an extension covering 5 seasons, or exceeding extend-and-trade limits, or a renegotiation | **6 months** after signing |
| Player just acquired in a trade — team wants to extend or renegotiate him | team must wait **6 months** |
| Designated Veteran ("supermax") extension or contract | **1 year** |
| Contract signed as part of a sign-and-trade | the initial trade is exempt; the restriction applies to a **second** trade |

**Real, dated instance (OBSERVED, [Hoops Rumors, 2026-08-04](https://www.hoopsrumors.com/2026/08/players-who-cant-be-traded-until-december-15-10.html)):** a published, per-team list of every 2026-27 signee frozen until December 15 — Mike Conley and Mitchell Robinson (Boston), Norman Powell (Chicago), Draymond Green and Al Horford (Golden State), Marcus Smart (Houston), Isaiah Hartenstein (Oklahoma City), Klay Thompson (Miami), and dozens more. **This is a real, checkable, current fact that a deadline lesson can use directly: some of your roster is simply not for sale yet.**

### 5.4 Players who can refuse

**OBSERVED, CBA Art. VII §8(b) and [Hoops Rumors, 2026-07-29](https://www.hoopsrumors.com/2026/07/nba-players-who-can-veto-trades-in-2026-27.html).**

- **Formal no-trade clause:** requires 8+ years of NBA service, 4+ years with the current team, and a *free agent contract* rather than an extension. **In 2026-27 exactly one player in the league has one: Damian Lillard (Trail Blazers).**
- **Implicit no-trade clause (CBA §8(b)):** a player on a one-year contract (excluding an option year) who would be a Bird or Early Bird free agent afterward **cannot be traded without his consent**, unless he waived that right at signing. The reason is economic: trading him would reset his Bird rights as if he had signed with the new team as a free agent, destroying his own future leverage. 2026-27 examples on the Hoops Rumors list include Bradley Beal (Clippers), Thomas Bryant (Cavaliers) and Simone Fontecchio (Heat).
- **Matched offer sheet:** a restricted free agent whose offer sheet was matched has a veto for a full calendar year. 2026-27: Moussa Cisse (Mavericks), Spencer Jones (Nuggets).

**A rule that protects a player's future bargaining power by restricting the team's present flexibility is a good, teachable object — and it is why one player, not the team, is the binding constraint on some trades.**

### 5.5 Poison pill and base-year compensation — the same player, two different numbers

Two distinct rules, both OBSERVED in primary text, both frequently conflated.

**(a) The rookie-scale-extension poison pill — CBA Art. VII §8(g).** If a rookie-scale contract is extended and the team tries to trade it **before the first day of the following salary cap year**, then *only for determining whether the acquiring team has Room*, the salary for the last year of the original term is deemed to equal **the average of that year plus every extended year**. The **sending** team still counts the actual current-year salary.
**Real, current, 2026-27 example (OBSERVED, cbaguide TPE page):** Nikola Jovic signed a 4-year, $62.4M rookie-scale extension with Miami in the 2025 offseason, beginning in 2026-27. Traded before 2026-27, his **incoming** trade salary was **$13,369,083** while his **apron salary** was **$4,445,417**. *(This is a Miami fact, and Miami is one of the twelve student franchises in `NBA_FINANCIAL_TRUTH.md` §4.1.)*
Where the extension is expressed as a percentage of the cap, assume next year's cap is **104.5%** of the current one and assume the player misses all Higher Max Criteria (§8(g)(i), OBSERVED).

**(b) Base-year compensation in a sign-and-trade — CBA Art. VII §6(j)(5).** If a Bird or Early Bird free agent re-signs with his prior team as part of a sign-and-trade, the team is over the cap, and the new first-year salary exceeds what Non-Bird rights would have allowed, then **for the sending team's TPE calculation** the player's salary is deemed the **greater of** (i) his last-season salary or (ii) **50% of his new first-year salary**.
**Real, dated example (OBSERVED, cbaguide trade salary page):** Max Strus, July 2023, 4 years / $62.3M, first-year salary $14,487,684, prior salary $1,815,677. His outgoing trade salary for Miami was **$7,243,842** — half. Miami sent out a $14.5M player and got credit for $7.2M.

**(c) Non-guaranteed salary is discounted, on a calendar (OBSERVED, CBA Art. VII §6(j)(6); tabulated identically at cbaguide).**

| When the trade happens | Outgoing salary counted as |
|---|---|
| July 1 to the start of the regular season | guaranteed portion only |
| Regular season through January 7 | prorated by the share of season remaining |
| **January 8** through the end of the regular season | **treated as fully guaranteed — no reduction** |
| After the regular season through June 30 | lesser of this year's salary and next year's guaranteed salary |

The CBA supplies its own four-part worked example, in which an $8M player counts as **$1M, $2M, or $8M** depending on the calendar date. **Real case (OBSERVED, cbaguide):** in June 2024 Chicago amended Alex Caruso's contract to full guarantee specifically so his outgoing salary would count as $9.4M rather than $3M, making the Josh Giddey trade legal.

**Design consequence: a player's trade value is literally a different number on different days, and the CBA says so in three separate places.** That is not a quirk to hide — it is a genuine, verified, teachable fact about how prices are constructed by rules rather than discovered.

---

## 6. SIGN-AND-TRADE

**OBSERVED — CBA Art. VII §8(e)(1).** A veteran free agent and his prior team may sign a contract pursuant to an agreement with another team to trade it, **only if**:

1. the player **finished the prior season on the prior team's roster**;
2. the contract is **at least 3 and no more than 4 seasons**, excluding option years;
3. it is **not** signed using the **Non-Taxpayer MLE or the Room MLE**;
4. **the first season is fully protected for lack of skill** *(note: cbaguide renders this as "fully guaranteed," which is not the same thing; the CBA phrase is narrower — **use the CBA phrasing**)*;
5. it is entered into **before the first day of the regular season**;
6. for a 5th-year-eligible player who met a Higher Max Criterion, the salary may not exceed **25% of the cap**;
7. **the acquiring team must have Room for the first-year salary plus unlikely bonuses.**

**Hard cap triggered.** Row C: **acquiring** a sign-and-trade player hard-caps the acquiring team at the **first apron** for the rest of the year, and a team already above the first apron post-trade simply cannot do it. Row J: using a **TPE generated by** a signed-and-traded contract hard-caps at the **second apron**. (Both OBSERVED, §2(e)(4).)

**Who is barred.** Any team whose post-trade apron salary would exceed the **first apron** cannot acquire a sign-and-trade player. Teams above the second apron additionally cannot use a S&T-derived TPE.

**Physical exam.** **OBSERVED, CBA Art. VII §8(e)(3).** A sign-and-trade or extend-and-trade contract may not contain an Exhibit 6, but the teams **may agree the trade is conditional on the player passing a physical performed by the acquiring team's designated physician under NBA procedures.**

**Signing bonus.** If the signing team pays any part of a signing bonus, that payment is treated as **cash in trade** and counts against the 5.15% limit (OBSERVED, CBA §8(a); corroborated at cbaguide).

**Historical scale example (OBSERVED, cbaguide TPE page):** Boston's 2020 Gordon Hayward sign-and-trade to Charlotte generated a **$28.5M** stored TPE — described as the largest in league history — which Boston spent four months later on Evan Fournier, whose subsequent sign-and-trade to New York generated another TPE that became Derrick White. **One transaction financed a three-step chain over two years.** That is path dependence with names attached. *(Single source, cba-explainer tier; the $28.5M figure is NOT independently verified.)*

---

## 7. TRADE CALLS AND LEAGUE APPROVAL — the product's most useful finding

**This is the section that most directly serves the mechanic, and it is primary-text verified.**

**OBSERVED — CBA Art. VII §8(k), verbatim:**

> "A 'trade' of a player under this Agreement shall mean an assignment of a Player Contract pursuant to a negotiated exchange between two or more Teams **following a trade conference call with the NBA league office**. For clarity, the word 'trade' shall not include an assignment of a player via the NBA's waiver procedures."

**A trade is not a trade until the league office has been on the phone.** This is not an administrative footnote — it is the CBA's *definition* of the word. Two general managers shaking hands produces an agreement; the trade exists only after the call.

**OBSERVED — CBA Art. VII §8(j).** Within one week of each trade the NBA emails the Players Association a summary of the principal terms, and may withhold terms deemed confidential **except those needed to verify compliance with the cash limit**.

**OBSERVED — CBA Art. VII §8(i).** Before a contract is assigned, the sending team and the player must **divest themselves of any preexisting financial arrangements between them** (excluding earned compensation and loans).

**How long it actually takes — three dated real cases, all OBSERVED:**

1. **Kawhi Leonard, Clippers → Raptors.** Agreed **late June 2026**. Still not official on **2026-09-02** — more than two months. Toronto refused to finalize until the NBA's cap-circumvention investigation concluded, because Leonard's own exposure would transfer to them. Per Jake Fischer of The Stein Line, via [Hoops Rumors, 2026-07-10](https://www.hoopsrumors.com/2026/07/trade-fa-notes-trade-timing-s-jones-kawhi-more.html): "It wasn't until the two teams **scheduled a trade call** this week that the NBA told the Raptors they'd assume the risk for any penalties Leonard faces." As of [2026-09-02](https://www.hoopsrumors.com/2026/09/raptors-clippers-trade-expected-to-finalize-in-the-next-couple-of-days.html), Shams Charania reported the deal "will be going through in the next couple of days."
2. **The July 2026 four-team knot.** Charlotte's LaMelo Ball / Naz Reid trade was expected to be **combined with Minnesota's separate three-team Julius Randle trade with Brooklyn and Chicago and executed as a single four-team transaction, for salary-matching purposes** (Rod Boone, Charlotte Observer, via Hoops Rumors 2026-07-10). Phoenix's entire offseason was frozen behind it, because a pick the Suns were acquiring from Charlotte was itself tied to a pick Charlotte was acquiring from Minnesota — **and Phoenix could not sign Luke Kennard at all until the Miles Bridges trade completed, because Phoenix was hard-capped at the second apron and needed O'Neale's and Allen's combined $29M to leave before Bridges' $22.8M arrived.**
3. **The July moratorium.** Agreements reached from July 1 could not be executed until **11:01 a.m. CT on July 6, 2026** ([Hoops Rumors, 2026-04-22](https://www.hoopsrumors.com/2026/04/key-2026-nba-offseason-dates-deadlines.html), OBSERVED). Five days of agreed-but-not-real, league-wide, every single year.

**Product consequence.** A BOW mechanic in which an accepted offer enters a *pending* state — visible to both students, not yet reflected in either roster, resolved by the teacher — is **not** a game-design contrivance bolted on for classroom pacing. It is the most accurate part of the whole simulation. The teacher is the league office. That is a real role, and the CBA says so.

---

## 8. REAL-WORLD ANCHOR: THE CLIPPERS PENALTY (live, contested, high value, high risk)

**OBSERVED — [Hoops Rumors, 2026-09-02](https://www.hoopsrumors.com/2026/09/clippers-lose-five-draft-picks-steve-ballmer-suspended-for-one-year-for-violating-salary-cap.html), reporting an NBA press release.** On 2026-09-02 the NBA announced penalties against the Clippers for **salary cap circumvention** involving Kawhi Leonard and an endorsement arrangement with Aspiration and three other companies that did business with the team. Penalties: forfeiture of **five first-round picks (2029, 2030, 2031, 2032, 2033 — the picks simply disappear from those drafts)**, a **$30M fine**, a **one-year suspension for owner Steve Ballmer**, one-year and six-month suspensions for two executives, and five years of league compliance monitoring. Leonard pays **$700K**. The NBA and NBPA agreed the penalties are final and binding.

**Why it is valuable:** it is the answer to the question every 11-year-old asks within ninety seconds of meeting a salary cap — *"what if you just cheat?"* The answer, dated and named, is: the league can delete your future. And it pairs directly with §7's Kawhi trade delay, which is the *same story* seen from the mechanic's angle.

**Why it must be handled carefully:** the Clippers issued a statement the same day rejecting the findings and saying they will "vigorously challenge these findings and penalties through every avenue available." Per Dan Woike of The Athletic, teams have no arbitration right under the CBA, so any challenge would be through the courts. **This is live litigation-adjacent material as of 2026-09-03.** See §RIGHTS below.

---

## THE SMALLEST HONEST SIMPLIFICATION

**The constraint on the constraint.** Grades 5–6: a legal trade in under 90 seconds with **at most 2 controls**. Grades 7–8: at most 4. And the mechanic must not become a CBA error-message generator.

That last clause is the real design law, and it is not about how many rules you model. **It is about whether a rule is expressed as terrain or as a verdict.** A rule the student can *see before choosing* costs zero seconds and teaches. A rule that fires *after* choosing costs a read, a re-plan, and a small humiliation — and teaches that the game is arbitrary. Every simplification below is chosen so the surviving rule can be drawn.

### The one constraint: dollar-for-dollar salary matching

**If we model exactly one rule, model this: once you are over the cap, the salary you send out sets a ceiling on the salary you can bring back.**

**Why this one and not the others — argued, not listed.**

The competitors are the roster spot, the hard-cap-by-action rule, the aggregation ban, and the deadline. Each is a better *story* than salary matching. None of them is the economics.

- **The roster spot** is a counting constraint. Fifteen slots teaches inventory, not price. A student can satisfy it without ever thinking about value.
- **Hard-cap-by-action** is the most dramatic rule in the CBA and the best *second* rule in BOW, but it cannot be the only one: its entire payload is a consequence that arrives later. In a single trade with no future, choosing a hard cap costs nothing, so the choice is not a choice. It requires a second phase to exist at all.
- **The aggregation ban** presupposes matching. It is a rule about *how you may satisfy* the ceiling. Model it alone and it is meaningless.
- **The deadline** is a clock. Clocks create urgency, not economics. A timer that isn't a budget is theater.

Salary matching is the only one of the five that makes a trade a **constrained bilateral exchange**. Remove it and a trade is a wish — "I'll take your best player, you take my worst." No student learns anything from a wish. Add it and four true things happen at once, with no vocabulary and no arithmetic beyond comparing two sums:

1. **Both sides' constraints must be satisfied simultaneously.** A trade exists only where two feasible sets overlap. That is the actual definition of a gain from trade under constraint, and it is why this mechanic is worth doing *student-to-student* rather than against a computer opponent. The other student is not flavor; the other student is the second half of the constraint.
2. **It makes a bad contract into a real liability, not just a bad number.** Your $30M underperformer is now the only key that unlocks a $30M acquisition. Students discover that a contract's *size* and a player's *value* are different things — which is the whole M1 thesis — without being told.
3. **It produces the only failure mode a fifth grader can diagnose and fix without help:** "we're three million apart." The fix is to find another piece. That search *is* the economics, and it takes seconds.
4. **It is bilateral in a way that creates real argument.** The trade that clears for you may not clear for them. Negotiation appears without being scripted.

**Model it in its tightest true form: incoming ≤ outgoing.** Not 125%, not the three-band ladder, not "+$250,000."

The reason this is the right simplification and not merely the easiest one: **it is a real NBA rule, currently in force, applied to every team over the first apron (§1.4), and it is the *strictest* band.** Therefore **every trade that is legal in BOW is legal in the real NBA for any over-cap team.** The simplification produces **no false positives** — BOW never tells a student a trade is legal when the NBA would refuse it. It produces false negatives (some real trades BOW disallows), which is the honest direction for an error to run. And it requires **no percentages**, which matters because `NBA_FINANCIAL_TRUTH.md` §6.2 establishes that grade 5 has no percent standard at all.

**Two controls:** pick the player you send; pick the player you want. **One readout:** two bars, one labeled OUT and one labeled IN, and the IN bar cannot be dragged past the OUT bar. No message. No modal. No "INVALID TRADE: outgoing salary $28,400,000, incoming $29,100,000, exceeds §6(j)(1)(i)." Unaffordable cards are visibly out of reach, the way a shelf is out of reach. **A constraint you can see is a budget; a constraint that only speaks after you act is a bureaucrat.**

### Rule-by-rule simplification ledger

**1. Salary matching**
- **REAL RULE:** five distinct Traded Player Exceptions; under-cap teams absorb into room + $250K; over-cap-but-under-first-apron teams get a three-band ladder (200%+$250K / +$9,096,000 / 125%+$250K in 2026-27); over-first-apron teams get 100% + $0; the test is post-trade, not pre-trade.
- **BOW REPRESENTATION:** incoming salary may not exceed outgoing salary. One comparison, drawn as two bars.
- **WHAT IS OMITTED:** all five exception names, the $250K cushion, all three bands, the under-cap absorption path, and the post-trade-vs-pre-trade distinction.
- **WHY:** the bands are the paperwork; the ceiling is the economics. The tightest band is a real rule, so the simplification is a restriction, not an invention.
- **ECONOMIC TRUTH PRESERVED:** a trade is a constrained exchange; both parties' budgets bind at once; a large contract is simultaneously a liability and a key.
- **MISCONCEPTION RISK:** *high and specific* — students will believe all NBA trades are exactly even, and that a team can never take back more than it sends. Both are false for most of the league. **Mitigation is a debrief sentence, not a mechanic:** "The teams that have spent the most play by exactly the rule you just played. Teams that have spent less are allowed to take back a little more — that extra room is what they get for spending less." That converts the omission into the apron lesson instead of hiding it.

**2. Apron restrictions on trades**
- **REAL RULE:** an eleven-row Transaction Restrictions Table; each row gates on post-trade apron salary and imposes a hard cap for the rest of the year (and, in the offseason, the following year too).
- **BOW REPRESENTATION (grades 7–8 only, as control #3):** **one** line on the payroll bar. Crossing it costs you the ability to take back more than you send. Nothing else.
- **WHAT IS OMITTED:** the second apron entirely, ten of the eleven rows, the offseason double-year rule, the taxpayer-MLE lockout, and the word "apron."
- **WHY:** the ladder's five thresholds cannot survive a 50-minute lesson (`NBA_FINANCIAL_TRUTH.md` §7.12 item 2 already flags three as the ceiling). One line preserves the step-function shape; two lines double the reading load to teach the same shape twice.
- **ECONOMIC TRUTH PRESERVED:** the price of flexibility rises in steps, not smoothly; past spending decisions constrain present options.
- **MISCONCEPTION RISK:** students will think there is one line rather than five, and that crossing it is a fee rather than a confiscation of options. Guard the second one hard — it is the whole point. **Never let the BOW apron be payable.**

**3. Hard-cap-by-action**
- **REAL RULE:** no team is assigned a hard cap; every hard cap is created by a transaction the team chose, and lasts the remainder of the salary cap year.
- **BOW REPRESENTATION:** if a student uses the "take back more than you send" option, the line becomes a wall on their own payroll bar for the rest of the session — drawn, immediately, on their own screen.
- **WHAT IS OMITTED:** which transactions trigger which apron, the offseason next-year projection, and the taxpayer-MLE interaction.
- **WHY:** this is the strongest single piece of path dependence in the CBA and it costs one visual, not one rule explanation.
- **ECONOMIC TRUTH PRESERVED:** *your own earlier choice, freely made, removed a later option.* Attribution is perfect — the student did it.
- **MISCONCEPTION RISK:** students may think the league punished them. The wall must appear **at the moment of their click**, on **their** bar, with their own decision still on screen. If it appears later it reads as a penalty; if it appears then, it reads as a consequence.

**4. Trade exceptions (TPEs)**
- **REAL RULE:** a Standard TPE is a one-year, non-aggregable credit created by sending out more than you take back; it does not shrink after January 10; it dies early if you go over the first apron.
- **BOW REPRESENTATION:** **omit entirely for grades 5–6.** For grades 7–8, at most a single "credit" token with an expiry, and only if the lesson has a second trade window.
- **WHAT IS OMITTED:** everything.
- **WHY:** a TPE is a financial instrument. It teaches option value, but only to a student who already holds the matching rule firmly, and it costs a control the budget does not have.
- **ECONOMIC TRUTH PRESERVED (if included):** unspent capacity can be stored, but storage has an expiry — flexibility is perishable.
- **MISCONCEPTION RISK:** presented too early, students treat it as free money and stop attending to the matching constraint, which is the constraint that teaches.

**5. Draft picks**
- **REAL RULE:** tradable through the seventh subsequent draft; Stepien forbids any *possibility* of consecutive missing firsts; protections and swaps and deferrals; picks count as **$0** salary.
- **BOW REPRESENTATION:** picks exist, are tradable, and **count as zero dollars**. Nothing else — no Stepien, no horizon, no protections.
- **WHAT IS OMITTED:** the entire pick-rules apparatus, all of which is secondary-sourced anyway (§4).
- **WHY:** "$0 salary" is the only pick fact that changes the trade math, and it is the one that makes picks *interesting* — a second currency that is not subject to the first currency's constraint. Stepien is a great story and a terrible mechanic: it is a rule about hypothetical futures, and it can only ever fire as an error message.
- **ECONOMIC TRUTH PRESERVED:** two currencies, one transaction; a pick is a claim on an unknown future good, priced today.
- **MISCONCEPTION RISK:** students will think picks are unlimited and freely tradable forever. **Accept this at grades 5–6.** At 7–8, one sentence in the debrief ("in the real NBA you can only trade picks about seven years out, so a team can't sell off its whole future") is cheaper and more honest than a mechanic.

**6. Roster limits and the trade window**
- **REAL RULE:** 14–15 in-season plus two-ways; 12–13 permitted for two weeks / 28 days; open roster spot required *before* execution if you receive more than you send; December 15 / January 15 freezes; March 1 postseason-eligibility waiver deadline.
- **BOW REPRESENTATION:** a fixed number of slots, visible as physical spaces. **If you take two, you must send two, or you must have an empty space.**
- **WHAT IS OMITTED:** the 12–13 grace period, two-way roster arithmetic, every date-based freeze, and March 1.
- **WHY:** slots-as-spaces is free — it needs no rule text, only layout — and it creates the second binding constraint that makes allocation interesting rather than arithmetic.
- **ECONOMIC TRUTH PRESERVED:** two scarce resources at once (money and places), which is the minimum condition for a genuine allocation problem.
- **MISCONCEPTION RISK:** low. The main loss is the December 15 freeze, which is genuinely great material for a *deadline* lesson ("some of your roster is not for sale yet") and should be considered for the L2 deadline design even though it is wrong for a first trade mechanic.

**7. Sign-and-trade**
- **REAL RULE:** seven conditions, a first-apron hard cap on the acquirer, base-year compensation halving the sender's outgoing salary, minimum 3-year term.
- **BOW REPRESENTATION:** **omit at every grade band in Module 1.**
- **WHAT IS OMITTED:** all of it.
- **WHY:** sign-and-trade is a free-agency instrument that happens to use the trade pipe. It belongs to L3 if anywhere. Its one teachable fact — that the same player is worth $14.5M to one side and $7.2M to the other (Strus, 2023) — is a better *story* in a debrief than a mechanic.
- **MISCONCEPTION RISK:** none, if omitted. If included: students will conclude any free agent can be routed through any team, which is false and is exactly what the seven conditions exist to prevent.

**8. Trade calls and league approval**
- **REAL RULE:** CBA Art. VII §8(k) — a trade is *by definition* an exchange "following a trade conference call with the NBA league office." Agreements routinely sit unexecuted for days, weeks, or in the Kawhi Leonard case more than two months.
- **BOW REPRESENTATION:** **keep this at full strength. Do not simplify it.** An accepted offer enters a visible PENDING state on both students' screens and on the board; the teacher executes it.
- **WHAT IS OMITTED:** physicals, the PA notification, the divestment requirement, the moratorium.
- **WHY:** this is the rare case where the *real* rule is simpler than any invention and simultaneously solves a product problem. It gives the teacher a truthful pacing lever, it gives the board something to show, it makes reveal choreography possible, and it costs zero student controls. It also lets a student change their mind, which is where regret — and therefore reflection — lives.
- **ECONOMIC TRUTH PRESERVED:** agreement and execution are different events; a deal is not done when the parties say it is done; an institution stands between intent and effect. That is one of the most generalizable economics ideas in the whole module.
- **MISCONCEPTION RISK:** students may think the league can reject trades on merit. It cannot — the call is a compliance check, not a judgment. Say "the league checks the math," never "the league approves the deal."

### One thing NOT to simplify, stated as a warning

Do not let the mechanic decide legality **after** the student commits. The CBA's own structure invites this — it is written as a series of prohibitions — and a faithful implementation of a prohibition is a validator, and a validator is an error-message generator. The rule must be rendered as **what the student can reach**, before the click. If the only way to express a rule is as a rejection, that rule does not belong in this mechanic.

---

## DO NOT RENDER AS NBA TRUTH

Claims that must never be printed, either because verification failed or because our own simplification makes them false.

**Because they are unverified:**

1. **Any 2026-27 trade deadline date.** Not published as of 2026-09-03. §5.2.
2. **Any Stepien Rule statement without the label "not published by the league."** The NBA Constitution & By-Laws is not public; every Stepien claim here rests on cbaguide alone. §4.
3. **"Pick swaps are exempt from the Stepien Rule."** INFERRED, no source. `NBA_FINANCIAL_TRUTH.md` §2.8 asserts it; that assertion remains unsourced.
4. **The cash-in-trade limit to the dollar.** 5.15% of the cap is $8,495,491.50; Hoops Rumors publishes $8,495,000; cbaguide truncates its 2025-26 figure. The percentage is CBA-verified; the rounded dollar figure is not. §4.
5. **"A TPE cannot be aggregated with another TPE"** as a quoted CBA rule. The structure implies it; no single sentence states it. §3.
6. **The $28.5M Hayward TPE as "the largest in history."** Single explainer source, unverified. §6.
7. **The open-roster-spot-before-execution rule as CBA text.** cbaguide only; not located in the primary PDF this session. §5.1.
8. **Any team-level 2026-27 payroll, apron position, or stored-TPE figure** without inheriting `NBA_FINANCIAL_TRUTH.md` §4's medium-at-best confidence and §7.10 volatility warning. It is three weeks before training camp.
9. **The Clippers penalty as a settled outcome.** The team publicly rejected the findings on 2026-09-02 and stated it will challenge them. Say "the NBA announced," dated, never "the Clippers lost." §8.
10. **The Kawhi Leonard trade as completed.** As of 2026-09-03 it was expected "in the next couple of days" and was still unofficial. §7.

**Because our simplification would make them false:**

11. **"In the NBA, trades have to be even."** False for the ~two-thirds of the league below the first apron, which may take back up to 200% on small salaries. This is what BOW's one-constraint model will *feel* like, so the debrief must contradict it explicitly. §THE SMALLEST HONEST SIMPLIFICATION, rule 1.
12. **"Teams over the second apron can only trade one-for-one."** False. They may send one player and receive several; what they cannot do is *aggregate* on the way out or take back more in total. The common phrasing inverts the rule.
13. **"Teams over the first apron cannot aggregate."** False. Aggregation is barred only above the **second** apron (row H).
14. **"A recently traded player cannot be re-traded for two months / 60 days."** False. §6(j)(4)(i) restricts **aggregation** for two calendar months, not trading, and only for players acquired via an Exception, with a December 16 carve-out.
15. **"110% is the apron matching rule."** Expired. 2023-24 salary cap year only, by the CBA's own opening words. §1.1.
16. **"125% + $100,000."** That is the previous CBA. §1.7.
17. **"$7.5 million and $29 million are the salary-matching breakpoints."** Those are 2023-24 figures, and the first one was really $7.25M even then. 2026-27 is **$8,846,000 and $35,384,000**. §1.3.
18. **"The second-apron pick penalty is 8 years out"** or **"3 of 5 years."** The CBA says 7 drafts and 2-of-4. §2.4.
19. **"The league approved the trade."** The trade call is a compliance verification, not a merits review. Say "the league checked the math."
20. **"A hard cap is a punishment."** It is the automatic price of a tool the team chose to use. If BOW's copy ever frames it as a penalty, the path-dependence lesson inverts into a fairness complaint.
21. **Any team logo, mark, jersey, arena image, or player photograph** — carried forward unchanged from `NBA_FINANCIAL_TRUTH.md` §8.2 item 22. Nothing in this dossier alters it.

---

## RIGHTS AND SOURCE CONSIDERATIONS

Not legal advice, and no certification of safety is offered or implied.

- **Public facts remain the safe core.** Player names, salaries, transaction terms, dates, CBA rules and league announcements are public and are what this dossier consists of.
- **The 2023 CBA PDF is published by the NBA at a public URL and is the correct thing to cite.** Quoting short rule text with an Article/Section cite is ordinary use; **reproducing large blocks of CBA text in student-facing material is a different question and has not been assessed.** The verbatim §8(k) quotation in §7 above is one sentence and is the only verbatim quote proposed for possible student-facing use; even that should get a founder call before it reaches a slide.
- **cbaguide.com is the single load-bearing non-league source in this document** for pick rules, the touch rule, the open-roster-spot rule, and the corroborating Expanded TPE table. It is high quality and it reproduces the CBA's own defined terms, but **it is one person's site, it is not the NBA, and §4 of this dossier rests on it almost entirely.** If a pick-rules lesson is ever built, that dependency needs a second source.
- **The Clippers/Leonard material is contested by a party that has announced it will litigate.** Using it in a classroom is a different risk posture from using a settled historical fact. **Escalate before it appears in any lesson.** The economics it teaches (cheating has a price) can be taught with older, settled cases if the founder prefers — though none were verified this session.
- **Real minor children are not involved anywhere in this material.** Fictional student names on shared screens remain the standing rule (CLAUDE.md §11) and nothing here changes it.
- **Screenshots or embeds of Hoops Rumors / cbaguide pages** are a separate question from citing their facts. This dossier proposes none.

---

## WHAT I COULD NOT VERIFY

Stated plainly, per CLAUDE.md §13.

1. **The 2026-27 NBA trade deadline date and time.** Not yet published.
2. **The NBA Constitution & By-Laws.** Not publicly available; the Stepien Rule and the pick-trading horizon are therefore secondary-sourced only.
3. **Whether the CBA itself requires an open roster spot before executing a trade.** I did not locate such a provision in the PDF; cbaguide states the rule.
4. **The exact published cash-in-trade dollar figure for 2026-27.** Two secondary sources round the CBA's 5.15% differently.
5. **Any current team's payroll, apron position, or hard-cap status.** Deliberately not attempted — `NBA_FINANCIAL_TRUTH.md` §7.3 and §7.10 already establish that four teams are reported in logically impossible positions and that everything within ~$3M of a line will move. Nothing in this dossier depends on a team-level figure except where explicitly inherited and flagged.
6. **Whether a first-apron team can ever use the Expanded TPE in practice.** `NBA_FINANCIAL_TRUTH.md` §7.5 raised this. **Partially resolved:** §2(e)(2)(i)(A) is a *post-trade* test, so a team currently above the first apron could in principle use the Expanded TPE in a trade that lands it at or below the first apron. Whether this ever occurs in practice is unverified, and the secondary sources' flat "unavailable above the first apron" is a serviceable approximation.
7. **How long a trade call actually takes, or what happens on it procedurally.** I verified that it exists, that it is definitional, and that agreements can sit for weeks or months. I found no source describing the call itself.
8. **No independent third source** exists for anything sourced only to cbaguide. Spotrac, Basketball-Reference and RealGM were not attempted; open web search was unavailable (DuckDuckGo blocked at the network layer).

---

## OVERTURNS AND AMENDMENTS TO `NBA_FINANCIAL_TRUTH.md`

### §9.1 — trade salary matching: **UPHELD IN SHAPE, CORRECTED IN DETAIL, AND NOW SUPERSEDED IN STATUS**

The lead integrator's §9.1 reading was **structurally right**, which is worth saying plainly: the three "incompatible accounts" were indeed different rows of one table plus one transitional year, the 110% was indeed a 2023-24-only figure, and R2's primary-CBA read on the $250,000 allowance was indeed the correct one. Primary text confirms all three judgments.

**Four corrections:**

1. **§9.1 attributes the three-band ladder to the general "below the first apron" case. It belongs specifically to the Expanded TPE (§6(j)(1)(iv)), which is one of five exceptions and is *optional*.** A below-apron team may instead use the Standard or Aggregated Standard TPE at 100% + $250K and thereby **avoid the first-apron hard cap** that using the Expanded TPE imposes (row E). §9.1 does not mention that the ladder has a price. **That price is the most economically interesting fact in the trade rules** (§2.5 above) and it was missing.
2. **The breakpoints printed in §9.1 ("~$7.5M" and "roughly $29M") are 2023-24 figures.** §9.1 correctly warns that they are cap-indexed but then prints them anyway. The 2026-27 figures are **$8,846,000** and **$35,384,000**, with a middle-band dollar term of **$9,096,000** — now verified two independent ways (§1.3). Also, even in 2023-24 the first breakpoint was **$7.25M**, not $7.5M.
3. **§9.1's second-apron line — "may not take back more salary than it sends out, and may not aggregate" — misattributes the first half.** The take-back restriction begins at the **FIRST** apron (§6(j)(3) + row E). Only the aggregation ban is second-apron-specific. As written, §9.1 implies first-apron teams may still take back more, which is false.
4. **§8.2 item 1 — "no matching percentage may be rendered as NBA law" — should now be lifted, narrowly.** The prohibition was correct when three researchers disagreed. They no longer disagree: the CBA text has been read directly, the arithmetic has been reproduced, and an independent CBA-tier source publishes the same table. **The 2026-27 bands in §1.3 above are safe to print as NBA truth.** Whether they should be printed *to a grade 5–8 student* is a separate question, and my answer in §THE SMALLEST HONEST SIMPLIFICATION is no. **Verified and pedagogically appropriate are different tests, and this document is careful to keep them apart.**

The §9.1 plain-language sentence ("Once you are over the cap, a trade has to be roughly even…") survives all of this and remains true under the corrected reading.

### §7.2 — **RESOLVED, both halves, from primary text**

- **Buyout-market restriction:** **FIRST apron.** Row D of the Transaction Restrictions Table. Researchers 1 and 2 correct; Researcher 3's placement at the second apron was an error.
- **Second-apron pick penalty:** **7 drafts out, 2-or-more of the next 4 triggers the penalty, unfreezing after the third non-second-apron year of those four.** CBA Art. VII §6(f)(2), with the league's own 2024-25 → 2032 worked example. The "3 of 5" and "8 years" versions are wrong.

### §7.5 — three open items closed

- **14-player roster minimum and the "2 consecutive weeks / 28 total days" allowance:** **CONFIRMED** against CBA Art. XXIX §§1–2, with one correction — the floor during the grace period is **12**, not 13.
- **Whether a first-apron team can use the Expanded TPE:** partially resolved; see §WHAT I COULD NOT VERIFY item 6.
- **Stepien Rule primary text:** still not obtained. Unchanged.

### §2.7 — two errors in the "uncontested" list

- **"Newly signed FAs generally cannot be traded until the later of 3 months after signing or December 15"** is correct, but the paragraph omits that **draft rookies and two-way signings are 30 days** (§8(d)(i)), and that **sign-and-trade contracts are exempt on the initial trade** (§8(d)(ii)).
- **"Second-apron teams may not send cash at all"** is right in effect but should read *"if the trade leaves them above the second apron"* — row I is a post-trade test like every other row.

### §2.10 — one correction

Roster grace-period floor is **12**, not 13 (CBA Art. XXIX §2(b)(i)).

### New material not present in `NBA_FINANCIAL_TRUTH.md` at all

- The complete eleven-row Transaction Restrictions Table (§2.2).
- The **post-trade, not pre-trade** principle governing every apron restriction (§1.5). This is the single most consequential omission in the prior dossier for anyone about to write trade code.
- The hard-cap-vs-payroll distinction stated as two separate CBA clauses (§2.1).
- The **flexibility-now-vs-flexibility-later choice** between the Expanded TPE and the Standard TPE (§2.5).
- **Trade calls (CBA Art. VII §8(k))** and the fact that a trade is definitionally an exchange following a league-office call (§7) — with three dated real cases of agreed-but-unexecuted trades.
- The **two-month rule is about aggregation, not re-trading** (§1.6).
- **Minimum contracts count $0 incoming**, and the anti-stacking rule that exists because of it (§1.6).
- The **non-guaranteed-salary date calendar** and the January 8 cliff (§5.5c).
- **Implicit no-trade clauses** and the fact that exactly one player league-wide has a formal one in 2026-27 (§5.4).
- The **Touch Rule** and the $110,000 / $1,100,000 minimum cash thresholds, corroborated by real 2026-27 transactions (§4).
- The **Clippers cap-circumvention penalty** of 2026-09-02 (§8).

---

*End of dossier. Nothing in this document is "classroom-proven" (D10). Every rule statement carries its evidence grade; every dollar figure carries its derivation or its source; every gap is named as a gap.*
