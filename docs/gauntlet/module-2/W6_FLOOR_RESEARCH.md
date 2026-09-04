# W6 "THE BOARD OF GOVERNORS" — THE FLOOR: Sports Reality verification

**Sports Reality Director · research date 2026-09-04 · read-only pass.** Verifies the
Institution 2 anchor that `W5_W6_SPEC.md` §"Institution 2 — THE FLOOR" marked
**MEDIUM, not verified**, and escalated for verification.

**Evidence grades used here.** HIGH = I opened a primary or official source this session
and read the sentence I cite. MEDIUM = one reputable secondary/explainer, opened this
session. LOW = derived, or single unopened/second-hand source. NOT VERIFIED = no source
opened. Every row carries a URL and a read date. Nothing here is a legal opinion.

**Primary source used throughout:** the 2023 NBA Collective Bargaining Agreement PDF,
downloaded by me 2026-09-04 from
`https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf`
(676 pages, 2,850,534 bytes; identical file to the one `NBA_TRADE_TRUTH.md` used on
2026-09-03). Cited as **CBA Art. VII §X**, `cba` tier.

---

## 1. BLOCKING FINDING — the spec's floor anchor is wrong under the 2023 CBA

`W5_W6_SPEC.md` states the anchor as:

> "the NBA's **minimum team salary floor at 90% of the cap, with the shortfall
> distributed to that team's own players**"

**The first half is right. The second half is the 2017 CBA rule, not the 2023 CBA rule.**

**OBSERVED — CBA Art. VII §2(c)(2)(i), read 2026-09-04.** If a team's MTS Payment Team
Salary is below the Minimum Team Salary, "The NBA shall cause such Team to make a payment
**to the NBA** equal to the difference between the Team's MTS Payment Team Salary and the
Minimum Team Salary."

**OBSERVED — CBA Art. VII §2(c)(6), read 2026-09-04.** "Any payment due by a Team … shall
be made by the Team to the NBA no later than ten (10) business days following the
completion of the Governing Audit Report for such Salary Cap Year. **The NBA shall then
distribute any such payments equally to each Team** within ten (10) business days
following its receipt of such payments."

**Under the 2023 CBA the shortfall goes to the league and is split equally among the
teams — not to the offending team's players.** I found no carve-out excluding the paying
team from that equal distribution; the text says "each Team". (Grade on the redistribution
target: **HIGH**. Grade on whether the paying team is included in the 30-way split:
**LOW — the text is silent, I am reading it literally.**)

**Consequence for the product.** Both the W6 spec sentence and a shipped runtime string are
wrong. `runtime/src/modules/sameLine/world.ts` `LINES[floor].does` currently reads:

> "You have to spend at least this much. Fall short and you pay the difference anyway —
> **to the players, not to your team**."

That was true under the 2017 CBA and is false for the season `world.ts` models (2026-27).
**I did not edit any runtime file. This is escalated, not fixed.** Economic-truth
blocking: it teaches students that the floor is a wage transfer to labour, when the 2023
rule is a transfer to the other 29 owners — which is a *different economic mechanism* and
the one the W6 institution is actually modelling.

---

## 2. The 2023 CBA floor rule, in full

| Element | Rule | Cite | Grade |
|---|---|---|---|
| Level | Minimum Team Salary = **90% of the Salary Cap** | CBA Art. VII §2(a); cbaguide.com/thresholds/ | HIGH |
| **When assessed** | On the team's **MTS Payment Team Salary**, measured **as of the start of the first day of the Regular Season** | §2(c)(1)(ii) | HIGH |
| Who is paid | The team pays **the NBA**; the NBA distributes the payments **equally to each Team** | §2(c)(2)(i), §2(c)(6) | HIGH |
| Extra penalty | The team is **prohibited from receiving a share of any luxury-tax amount the NBA elects to distribute to non-taxpayers** for that year | §2(c)(2)(ii) | HIGH |
| In-season cap hold | From day 1 of the Regular Season through the end of the cap year, Team Salary **includes** the shortfall amount as a charge | §2(c)(3) | HIGH |
| In-season maintenance | If MTS Cap Hold Team Salary drops below the team's **MTS Threshold** during the season, it must be restored **by the end of the next day** | §2(c)(4) | HIGH |
| End-of-year true-up | A second payment is owed if, at the end of the cap year, the minimum still exceeds salaries actually borne plus the first payment (e.g. unearned Likely Bonuses) | §2(c)(5) | HIGH |
| Payment timing | Within **10 business days** of the Governing Audit Report; NBA redistributes within 10 business days of receipt | §2(c)(6) | HIGH |
| 2023-24 only | A below-minimum non-taxpayer still got a **half share** of the tax distribution (worked 0.5/23.5 example in the text) — expired | §2(c)(7) | HIGH |

**Explainer corroboration, with one conflict.** cbaguide.com/thresholds/minimumsalary/
(read 2026-09-04) agrees on the level, the start-of-regular-season snapshot, the cap hold,
the next-day restoration rule, the end-of-year true-up, and the loss of the tax
distribution. **It conflicts with the CBA on the destination of the money**: its penalty
bullet says the payment is "then paid to the Players on their Roster", while its own later
section says "the League redistributes the payment to the Teams." The CBA wins; the
"Players on their Roster" phrasing is a 2017-CBA leftover. **Recorded conflict — do not
cite cbaguide for the destination.**

---

## 3. Is this different from the 2017 CBA? Yes, in both halves.

Source for the 2017 rule: **Larry Coon's NBA Salary Cap FAQ, 2017-CBA edition**,
`http://www.cbafaq.com/salarycap17.htm`, Q14 and Q120, read 2026-09-04. (Note: cbafaq.com
serves over plain HTTP with a self-signed TLS cert; fetched over HTTP. It is the
best-known public CBA explainer and Coon's site states the 2023 edition was never written.)
Grade **MEDIUM** (reputable explainer, not primary text; the 2017 CBA PDF itself was not
reachable — nba.com's 2017 URL returns 403 and web.archive.org is blocked on this network
path).

| | 2017 CBA (cbafaq Q14) | 2023 CBA (primary text) |
|---|---|---|
| Level | 90% of the cap | 90% of the cap — **unchanged** |
| Snapshot | "at or above 90% … **on the date of the team's last regular season game**" | **start of the first day of the Regular Season** (§2(c)(1)(ii)) |
| Destination | "surcharged for their shortfall, with the money **distributed among the players on that team**. The determination of how the money is distributed is up to the players union." | **paid to the NBA, distributed equally to each Team** (§2(c)(2)(i), §2(c)(6)) |
| Extra penalty | none named | **loses its non-taxpayer tax distribution** (§2(c)(2)(ii)) |
| In-season floor | none named | cap hold + next-day restoration + end-of-year true-up (§2(c)(3)–(5)) |

**The timing change is the interesting one for the classroom and it is the opposite of the
intuitive one:** under the old rule you could sit under the floor all season and settle up
in April; under the 2023 rule the test lands **before a single game is played**, and then
a floor you are already under becomes your own new floor for the rest of the year. A team
cannot "spend late" to cure it. That is a genuinely better story for a rule-writing lesson
than the version in the spec.

The spec's mention of "the 'apron'/timing changes" is **not** the mechanism here — the
aprons do not touch the minimum-salary rule. The timing change is real; it is a snapshot
change, not an apron change. (Grade: HIGH that no apron provision appears in §2(c).)

---

## 4. The numbers, dated

**HIGH — official league release.** NBA Communications, "NBA sets Salary Cap for 2026-27
season at $164.961 million", Official Release **June 30, 2026**,
`https://pr.nba.com/2026-27-salary-cap/`, read 2026-09-04:

> "the Salary Cap for the 2026-27 season has been set at $164.961 million. The Tax Level
> for the 2026-27 season is $200.428 million. … • The Minimum Team Salary is $148.465
> million; • The First Apron Level is $209.015 million; and • The Second Apron Level is
> $221.686 million."

**HIGH — official league release.** NBA Communications, "NBA Salary Cap for 2025-26 season
set at $154.647 million", Official Release **June 30, 2025**,
`https://pr.nba.com/nba-salary-cap-2025-26-season/`, read 2026-09-04: cap $154.647M, tax
$187.895M, **Minimum Team Salary $139.182M**, first apron $195.945M, second apron $207.824M.

| Season | Cap | Minimum Team Salary (floor) | Tax | 1st apron | 2nd apron |
|---|---|---|---|---|---|
| 2025-26 | $154,647,000 | **$139,182,000** | $187,895,000 | $195,945,000 | $207,824,000 |
| **2026-27** | **$164,961,000** | **$148,465,000** | **$200,428,000** | **$209,015,000** | **$221,686,000** |

Corroborated to the dollar by cbaguide.com/thresholds/ (read 2026-09-04), which also
publishes the derivations: floor = 90% of cap, tax = 121.5% of cap, aprons indexed to
2023-24 (cap $136,021,000 / A1 $172,346,000 / A2 $182,794,000).

**`world.ts` verdict — CORRECT.** The `LINE` constants model **2026-27** and every one of
the five matches the official 2026-27 release exactly, including
`LINE.floor = 148_465_000`. `asOf: "2026-06-30"` matches the release date. **Grade: HIGH.**
One pedantic note, not an error: the source comment says "exactly 90% of the cap"; 90% of
$164,961,000 is $148,464,900, so the league's published figure is 90% rounded to the
nearest $1,000. The **amount** is right; only the word "exactly" is loose.

No 2027-28 figures exist yet — the cap is set each June 30 (2026-27 was set 2026-06-30).
**NOT VERIFIED / does not exist publicly** as of 2026-09-04.

---

## 5. What this means for Institution 2 (design consequence, not a design instruction)

The floor is still an excellent Institution 2, and the real rule is *stronger* for the
lesson than the version in the spec, because the real 2023 penalty structure has three
distinct teeth and each is a different economic idea:

1. **pay the shortfall anyway** — you cannot save the money by not spending it (the
   spend-or-forfeit mechanic the spec already models with `CONDITION_COLLECT_FRACTION`);
2. **the money goes to the other clubs**, not to your players — so a franchise that ducks
   the floor is directly funding its rivals;
3. **you lose your cut of the tax pot** — the free rider is cut out of the pool it was
   free-riding on. This is the tightest real-world rhyme with the W5 bowl that exists in
   the CBA, and it is the one the spec did not have.

The spec's design (forfeit half your draw from the pot; redistribute to compliers) is
**closer to the real 2023 rule than the sentence the spec wrote to justify it.** The
anchor sentence needs replacing, not the mechanic.

**A stated simplification the spec must record (CLAUDE.md §3):** the classroom floor is
tested on reinvestment at a week bell; the NBA floor is tested once, on opening night, on
salary. Misconception risk: students may infer a season-long spending test.

---

## 6. Rights / source note

Every fact in this file is an attributed public rule or a published dollar figure: CBA
text (published by the NBA), NBA Communications releases, and two explainers. No
photography, likeness, logo, mark, video, or proprietary dataset is required to use any of
it. cbaguide.com is a paywalled membership site whose threshold and minimum-salary pages
were publicly readable on 2026-09-04; **nothing in this file depends on cbaguide alone** —
each cbaguide fact is corroborated by the CBA or by pr.nba.com. cbafaq.com is a free
public site. Spotrac and Salary Swish were not used here. This is a sourcing note, not a
legal clearance.

---

## 7. Still to verify (open at time of writing)

- Whether the paying team is itself included in the §2(c)(6) equal 30-way redistribution.
- The 2017 CBA rule from the 2017 CBA **primary text** (blocked: nba.com 403,
  web.archive.org unreachable on this network path). Currently MEDIUM via cbafaq.
- Sections 8 and 9 below, appended after this file's first write.


---

## 8. Luxury-tax distribution — "half to the teams that stayed under"

Answers `W5_W6_SPEC.md` §"Institution 2" second anchor and `W4_BILL_RESEARCH.md` §6's
grade 7-8 sentence "half of it goes to the teams that stayed under."

**OBSERVED — CBA Art. VII §2(d)(4), read 2026-09-04.** Verbatim:

> "All amounts remitted to the NBA by NBA Teams pursuant to this Section 2(d) shall be the
> exclusive property of the NBA, and such amounts shall be used and/or distributed as
> follows: (i) Subject to Sections 2(c)(2)(ii) and 2(c)(7) above, the NBA **may elect to
> distribute up to fifty percent (50%)** of such amounts to one (1) or more Teams based in
> whole or in part on the fact that such Team(s) did not owe a tax for such Salary Cap Year
> (e.g., … the NBA could elect to distribute fifty percent (50%) of such amounts in equal
> shares to all non-taxpayers in such Salary Cap Year); and (ii) amounts not distributed
> in accordance with Section 2(d)(4)(i) above shall be used for one (1) or more 'League
> purposes' … selected by the NBA."

**Three corrections to "half goes to non-taxpayers", all HIGH:**

1. It is **"up to fifty percent," at the NBA's election** — a ceiling and a discretion, not
   an entitlement. No surface may state it as a guarantee. In practice the league has used
   the full 50%, and that practice is what the classroom sentence is describing.
2. **A team below the Minimum Team Salary is excluded** (§2(c)(2)(ii), cross-referenced in
   §2(d)(4)(i) itself). The floor and the tax pot are wired together in the real rule.
3. The other half is **"League purposes,"** and the CBA expressly forbids distributing that
   half in a way based "directly or indirectly, in whole or in part, on the amount of the
   Team's Team Salary or on whether the Team is a taxpayer." The widely repeated
   "the other half funds revenue sharing" is a *reported practice*, not a CBA guarantee,
   and the CBA constrains how it may be done.

**Change from the 2017 CBA: none, on the 50%.** Larry Coon's 2017-CBA FAQ Q20
(`http://www.cbafaq.com/salarycap17.htm`, read 2026-09-04) states the identical rule:
"Up to 50% of the tax money may be given to non-taxpaying teams. Note that there is no
requirement that any of the tax money be distributed to teams in this manner. … Currently
50% of the tax revenue is used as a funding source for the revenue sharing program, and
the remaining 50% is distributed to non-taxpaying teams in equal shares." **The 50% ceiling
is unchanged 2017 → 2023.** What the 2023 CBA added is the below-minimum forfeiture
(§2(c)(2)(ii)) and the expired 2023-24 half-share transition (§2(c)(7)). Grade: **MEDIUM**
on "unchanged" (2017 primary text not opened; one strong explainer).

**A dated real dollar example of what one under-tax team received.**

| Season | Total tax paid | Taxpayers | Distributed to non-taxpayers | Per non-taxpayer | Source, read 2026-09-04 | Grade |
|---|---|---|---|---|---|---|
| 2024-25 | $461.2M | 10 | 50% | **$11.5M each to 20 teams** | cbaguide.com/thresholds/luxurytax/, attributing Sports Business Classroom | **MEDIUM** — explainer quoting a third outlet; I did not open the underlying report |
| 2025-26 | $223.1M | — | 50% | ~$4.9M each to 23 teams | `W4_BILL_RESEARCH.md` §3, citing Hoops Rumors 2026-04 | **LOW here** — I did not re-open it this session |

**Recommended classroom example: 2024-25, $11.5M each to 20 non-taxpaying teams.** It is
the most recent audited year with a published per-team number, it is a round memorable
figure, and it lets the teacher say the true sentence: *"Twenty teams that stayed under
each got $11.5 million of the ten taxpayers' money — unless they had failed to hit the
floor, in which case they got none of it."* Both halves of that sentence are in the CBA.
Print it as an estimate with its date; the league does not publish official tax totals.

---

## 9. Revenue sharing — the $400M and the Memphis $28M

**The ~$400M: CONFIRMED, and it needs a date attached.** Two Sportico pieces, both opened
by me 2026-09-04, carry the identical sentence:

- Sportico, "How NBA Teams and Owners Make Money: Tickets, TV, Sponsors and More",
  `datePublished 2025-10-21`,
  `https://www.sportico.com/leagues/basketball/2025/how-nba-teams-owners-make-money-1234874170/`
- Sportico, "NBA Revenue Projected to Hit $14.3 Billion During 2025-26 Season",
  `datePublished 2025-11-12`,
  `https://www.sportico.com/leagues/basketball/2025/nba-revenue-projected-2025-26-season-1234876505/`

> "The 30 NBA teams generated $12.25 billion, or $408 million per club, in revenue during
> the 2024-25 season … The tally is **net of revenue-sharing that transferred roughly $400
> million to low-revenue teams last year, funded by high-revenue teams and 50% of luxury
> tax proceeds**."

**Grade MEDIUM.** One outlet, sourced to unnamed people familiar with league finances; the
NBA declined to comment. **It is a 2024-25 figure, not a standing annual constant.** The
spec's phrasing "moves roughly **$400M a year**" should become "moved roughly $400M in
2024-25 (Sportico, 2025-10-21)". This is the newest public figure I located; no 2025-26
revenue-sharing total is published as of 2026-09-04. **Note the causal link the sentence
gives us for free and the classroom should use: the tax pot funds the sharing pot.**

**The Memphis $28M in 2021-22: NOT VERIFIED by me this session.** `W4_BILL_RESEARCH.md` §5
attributes it to Sportico 2025-10-21; I read that article in full this session and **the
Memphis $28M figure is not in it.** The article's Memphis numbers are $301M in 2024-25
revenue (lowest in the league) and a $4B franchise valuation. Either the citation points at
the wrong article or the figure came from elsewhere. **Grade: LOW. Do not use the Memphis
$28M on any surface until it is re-sourced.** Recommended replacement anchor with a source
I did open: *"Memphis made the least money of any NBA team in 2024-25 — $301 million.
Golden State made $833 million"* (Sportico 2025-10-21, MEDIUM) — which is a cleaner
inequality hook for the bowl than a sharing receipt, and does not require a confidential
number.

**"The formula is confidential" — mostly right, and overstated as written.** The league's
revenue-sharing plan is a separate document from the CBA and the NBA does not publish it or
per-club receipts (**HIGH**: the plan does not appear anywhere in the 676-page 2023 CBA;
I searched it). But a substantial amount of the plan's *structure* has been publicly
reported for years. Larry Coon's FAQ Q21 (2017-CBA edition, read 2026-09-04) publishes:
teams contribute an equal percentage of revenue (net of arena expenses) into a pool and
draw a 1/30 share; market-size revenue benchmarks ranging 65% (New Orleans) to 160%
(New York/Brooklyn) of league average; a 15%-of-revenue contribution cap for markets under
1M TV households; no receipts at all for markets above 2.5M TV households, scaled receipts
2.0–2.5M; receipts eliminated where they would push profit past $10M; payers capped at 30%
of profits above $5M; a $15M discretionary fund; reconciliation each February. Whether the
2023-CBA-era plan preserved those thresholds is **NOT VERIFIED**.

**Product ruling this supports, unchanged:** `W5_W6_SPEC.md` non-negotiable 2 ("no surface
prints a percentage of the real NBA revenue-sharing formula") should **stand**. It is a
conservative choice, and the accuracy reason is now sharper: the numbers that *are* public
are (a) explainer-reported, (b) at least 2017-CBA-vintage, and (c) not current-league
official. Printing any of them as "the NBA's rule" would be the false-precision failure.
What may be printed, dated and attributed: "roughly $400 million moved from high-revenue to
low-revenue clubs in 2024-25, funded by big markets and half the luxury tax."

---

## 10. Recommendation

- **Replace the spec's floor sentence.** The 2023 anchor is: *a team that opens the season
  below 90% of the cap pays the shortfall to the league, the league splits it among all
  the teams, and the team also forfeits its share of the luxury-tax pot.* Three teeth, one
  of which (the forfeited pot share) is the exact economics of W6's Institution 2.
- **Do not ship `world.ts`'s `floor.does` string as written.** It states the 2017 rule.
  Escalated to the Lead Integrator; not edited by me.
- **Say "up to half," never "half"**, of the tax pot, and pair it with the floor forfeiture.
- **Date the $400M to 2024-25**; drop or re-source Memphis's $28M.
- Keep non-negotiable 2. It survives verification and is now better justified.

---

## 11. Closing status (§7 resolved)

Sections 8 and 9 were appended after this file's first write and are complete. The two
items still open from §7 are unchanged and both are LOW-impact:

- whether the paying team is itself inside the §2(c)(6) equal 30-way redistribution — the
  CBA says "each Team" and states no carve-out; **LOW**, read literally;
- the 2017 CBA rule from 2017 **primary text** — nba.com's 2017 PDF URL returns 403 and
  `web.archive.org` is unreachable on this network path (TLS connection reset at the
  proxy). Currently **MEDIUM** via Larry Coon's 2017-CBA FAQ, which is explicit and
  unambiguous on both the snapshot date and the destination of the money.

Newly opened and unresolved: the **Memphis $28M in 2021-22** figure cited by
`W4_BILL_RESEARCH.md` §5 is **not present in the Sportico article that §5 cites**. Treat as
**LOW / mis-cited** until re-sourced.

*Verified 2026-09-04 by the Sports Reality Director. Nothing here is classroom-proven (D10).*
