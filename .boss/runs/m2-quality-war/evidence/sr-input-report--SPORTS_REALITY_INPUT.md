# Module 2 "Money in Motion" — Sports Reality Input

Role: Sports Reality Director · Assignment: `sr-design-input` · Boss run: `m2-quality-war`
Written: 2026-08-31. This document is the evidence deliverable for this assignment (no
prior Boss evidence ids exist for M2 sports-reality; cite this file's anchor ids `SR-1`…`SR-15`).

**Highest-severity finding first:** Module 2's current candidate (`PROTOTYPE_SPEC.md`, "The
Box Office") contains **zero real-world sports content** — fictional Market Cards ("Legacy
Original / Expansion Team / Riverside Market / Capital Market"), a fictional "$75,000 payroll
due" scale, and a generic "your national deal" TV pipe. This violates the direction of the
founder invariant (CLAUDE.md §3) not in letter but in force: every fictional element below has
a real equivalent that is verified, dated, more dramatic, and no harder to build. The module's
revenue world is the *most* documented part of real sports business; fiction is strictly
weaker here. Status of every claim below: **observed** = web-verified this session with source
and date; **stable** = settled historical record from model knowledge, dated; **inferred** and
**NOT VERIFIED** marked explicitly.

---

## real-world-anchors

### SR-1. Four real markets replace the four fictional Market Cards

- **Real people/teams/numbers:** New York Knicks (biggest US media market, Madison Square
  Garden, highest gate revenue in the league); Oklahoma City Thunder (one of the smallest NBA
  markets, 2025 NBA champions); Golden State Warriors ($833M revenue 2024-25, highest in the
  NBA — they own Chase Center; observed, Sportico via Bleacher Report, 2025 valuations list,
  verifiedAsOf: 2026-08-31); Memphis Grizzlies (local media deal under $10M/yr vs the Lakers'
  ~$149M/yr in the same league year; observed, ESPN confidential-report story by Lowe/Windhorst,
  Sep 2017, verifiedAsOf: 2026-08-31).
- **Mechanism:** demand curves differ by market size and market power — the exact thing the
  hidden Market Card demand curves already model.
- **Operate:** the student is assigned the Knicks' box office, or the Grizzlies' — same Price
  Dial, real team name, real scale. The hidden curve constants are tuned to the real market
  (modeled, not actual resale data — say so on the synthesis slide).
- **Reveal:** the class scatter becomes "why could the Knicks pair charge triple what the
  Memphis pair could?" — a real question with a real answer (market size), not a flavor
  difference.
- **Non-fan accessibility:** "New York is huge, Memphis is small" requires zero basketball
  knowledge; fans get extra texture (MSG, Ja Morant) for free.
- **Fiction-comparison:** "Riverside Market" teaches the same curve with none of the
  attachment, argument, or memorability; a student will never say "wait, I'm running THE
  KNICKS' box office?" about Riverside Market.

### SR-2. The $76B national TV deal — the real "TV Revenue pipe"

- **Numbers:** 11-year, ~$76B national media deal with Disney/ESPN (~$2.6B/yr), NBC/Peacock,
  and Amazon (~$1.8B/yr), running 2025-26 through 2035-36 — roughly 2.6x the prior deal
  (observed, ESPN/Forbes coverage of the July 2024 agreements, verifiedAsOf: 2026-08-31).
  Divided across 30 teams, national media alone is on the order of $200M+/team/yr before
  players' ~50% share — dwarfing any single homestand's gate.
- **Mechanism:** fixed revenue independent of your price — exactly the spec's passive TV pipe;
  also the cap linkage (SR-3's tide).
- **Operate:** the TV pipe in the Box Office gets labeled with the real deal ("Disney, NBC and
  Amazon pay the league no matter what you charge tonight") at real-but-scaled magnitude; the
  student *feels* that the dial only moves the gate, not the TV money — that's the lesson.
- **Reveal:** cap-smoothing consequence: the CBA limits cap growth to 10%/yr, so the cap rose
  exactly 10% to $154.647M for 2025-26 (observed, NBA.com PR, June 2025) and 6.7% to $164.961M
  for 2026-27 (observed, NBA.com news + Hoops Rumors, June 2026, verifiedAsOf: 2026-08-31).
  "One TV contract raised every team's budget" links M2 revenue back to M1's cap — the
  cleanest cross-module bridge available.
- **Accessibility:** "TV companies pay to show the games" is universal; no fandom needed.
- **Fiction-comparison:** "your national deal, same no matter what you charge" (current spec
  copy) is the real thing with the serial numbers filed off — restoring them costs one label.

### SR-3. Luxury tax and the two aprons — incentive design you can feel

- **Numbers:** 2024-25: ten teams paid ~$456M total luxury tax; Phoenix Suns ~$152M (most);
  each of the 20 non-tax teams received a rebate of roughly $11.4M (observed, RealGM wiretap,
  2025, verifiedAsOf: 2026-08-31). 2026-27 lines: tax at $200.428M, first apron $209.015M,
  second apron $221.686M (observed, NBA.com, June 2026).
- **The story:** June 2025, the Boston Celtics — one year removed from the 2024 title — traded
  Jrue Holiday and Kristaps Porziņģis in under 24 hours explicitly to get below the second
  apron, saving a reported ~$200M+ in combined salary and tax (observed, Boston Globe /
  Yahoo/Ringer, June-July 2025, verifiedAsOf: 2026-08-31). Historical antecedent: OKC traded
  James Harden in 2012 rather than pay luxury tax (stable, 2012); Harden became an MVP
  elsewhere — and yet OKC's discipline model eventually produced the 2025 title (observed,
  championship and SGA coverage, June-July 2025).
- **Mechanism:** a tax is not a wall, it's a price — and prices change behavior. Incentive
  design as institution.
- **Operate:** commit-then-reveal — students run the 2025 Celtics' books ("champion roster,
  $500M projected salary+tax bill: pay it, or break it up?"), lock, then see what Boston
  actually did. Genuinely debatable: many analysts hated it; ownership context and Tatum's
  injury complicate it; outcome ≠ proof.
- **Accessibility:** "the league charges extra money for spending too much" needs no fandom;
  the drama (breaking up a champion over a bill) is legible to anyone.
- **Fiction-comparison:** an invented "spend-limit penalty" cannot deliver the gut-punch of
  "they won it all, then sold the team's players to duck a bill" — a real event students can
  look up.

### SR-4. Lakers vs Grizzlies — revenue sharing and market size (the legacy L2 material, real)

- **Numbers:** in the leaked 2016-17 league financials: 14 of 30 NBA teams lost money before
  revenue sharing, 9 after; the Lakers' local media deal ~$149M/yr vs the Grizzlies' under
  $10M/yr; Memphis received ~$32M in revenue sharing, the league's most, and the Lakers still
  cleared ~$115M profit after paying in (observed, ESPN, Sep 2017, verifiedAsOf: 2026-08-31).
  2021-22: ten high-revenue teams paid $163.6M into the pool, Warriors+Lakers over $88M of it;
  total transfers to low-revenue teams have run on the order of $400M/yr (observed, ESPN,
  Mar 2023; the ~$400M figure is order-of-magnitude, **inferred** from multiple reports, not a
  single audited number).
- **Mechanism:** same league, same rules, wildly different local revenue — and a deliberate
  institutional transfer to keep 30 viable competitors. Market size as destiny, sharing as
  the counterweight.
- **Operate:** students operate a sharing dial between a real big-market and a real
  small-market team's books (the spec already defers a "revenue-sharing dial" to L2 — this is
  its real content); or hold both roles across the room.
- **Reveal:** the real system's answer, plus the real ongoing owner fight about it (big-market
  owners publicly chafing at paying; stable, reported since 2011).
- **Accessibility:** "big city team earns more from TV than small city team" is instantly
  legible; no player knowledge involved.
- **Fiction-comparison:** the legacy `101-M2-L2` invented small-market prose; the Grizzlies'
  actual sub-$10M TV deal against the Lakers' $149M is a 15-to-1 gap no invented number would
  dare.

### SR-5. Green Bay Packers open books — the cross-league comparison that earns its exception

- **Numbers:** the Packers are the NFL's only publicly owned team and the only US major-league
  team that publishes audited financials annually. FY2025 (reported 2026-07-24): national
  revenue share **$453.2M per team** (up 4.8%); FY2024: $432.6M, implying ~$13.8B in shared
  national revenue league-wide; total Packers revenue $719M (observed, packers.com /
  Sportico / Front Office Sports, July 2025 and July 2026, verifiedAsOf: 2026-08-31). Green
  Bay's metro is ~320K — the smallest market in US major pro sports (stable).
- **Mechanism:** the NFL shares essentially all national revenue equally, so the smallest
  market in American sports is financially healthy; the NBA shares less; MLB less still.
  Cross-league comparison *is* the lesson (CLAUDE.md §3's "dramatically better" test — met:
  no NBA team publishes its books, and no NBA fact shows full-sharing this cleanly).
- **Operate:** students predict what fraction of a tiny-market team's revenue must be shared
  money for it to survive, then open the actual published Packers report — the only place in
  sports where the reveal is a real audited document.
- **Accessibility:** "tiny town, giant league, who pays?" — zero football knowledge needed.
- **Fiction-comparison:** an invented "Small Town Team" has no audited annual report to open.

### SR-6. The Caitlin Clark shock — one player moves a league's whole revenue curve

- **Numbers:** Indiana Fever home attendance ~4,066/game (2023) → **17,036/game (2024)**, the
  WNBA's best; six opposing teams moved Fever games to bigger arenas (United Center, State
  Farm Arena, TD Garden, American Airlines Center among them); 36-40 of 40 Fever games
  nationally televised, up from 22 (observed, Wikipedia/SI/ESPN/The Gist summaries of 2024
  season, verifiedAsOf: 2026-08-31). Downstream: WNBA ~$2.2B/11-yr media deal starting 2026
  (stable, agreed 2024); expansion fees $50M (Golden State, Oct 2023; Toronto, May 2024) →
  $75M (Portland, Sep 2024) → **$250M each** (Cleveland/Detroit/Philadelphia, June 30, 2025)
  (observed, Bloomberg/Sportico, verifiedAsOf: 2026-08-31); new CBA ratified late March 2026:
  salary cap quadrupled $1.5M → $7M, max salary ~$250K-era → $1.4M, first true revenue-sharing
  model in women's sports (observed, SportsPro/NBA.com/ESPN, Mar 2026, verifiedAsOf:
  2026-08-31).
- **Mechanism:** a demand shock — the demand curve itself jumps; then bargaining over who
  captures the new surplus (owners, league, players). Also elasticity of *venue choice*:
  teams literally re-sized their buildings for one visiting player.
- **Operate:** students hold a rival team's ticket prices/venue when the Fever come to town —
  keep your 4,000-seat gym price, raise it, or pay to move into the big arena downtown? Lock,
  then see what the Dream/Sky/Sun actually did and what the gates were.
- **Accessibility:** Clark is arguably the most famous basketball player to 10-12-year-olds in
  2026; even a non-fan knows "suddenly everyone wants tickets."
- **Fiction-comparison:** "a popular rookie joins the league" is a dead sentence next to a
  4,066→17,036 real attendance line students can chart themselves.

### SR-7. Sonics to Oklahoma City, 2008 — what a market decision costs

- **Facts:** Starbucks' Howard Schultz sold the SuperSonics to Clay Bennett's Oklahoma group
  for ~$350M (2006); Seattle voters passed I-91 (Nov 2006) restricting public arena subsidies;
  the city settled for $45M (plus $30M contingent) and the team left for OKC in 2008 after 41
  seasons (stable historical record, verifiedAsOf: 2026-08-31). OKC had proven itself hosting
  the displaced Hornets after Katrina (2005-07, stable).
- **Mechanism:** franchise location as an allocation decision; credible exit threats; the
  economics of civic subsidy. Path dependence: Seattle's 2006 vote still structures 2026's
  expansion race (SR-9).
- **Operate:** paired with SR-8/SR-9 below — this is the historical spine, not a standalone.
- **Accessibility:** "the team moved away because the city wouldn't build a new building" is a
  complete, legible story; no NBA history needed.
- **Fiction-comparison:** an invented relocation can't carry the emotional truth that a real
  city lost a real 41-year-old team — and that fifth-graders can see the sequel happening in
  the news right now.

### SR-8. The 2013 Kings vote — the module's cleanest commit-then-reveal

- **Facts:** Jan 2013, the Maloof family agreed to sell the Sacramento Kings to Chris Hansen
  and Steve Ballmer's Seattle group, which planned to move them and revive the SuperSonics;
  Sacramento mayor (and former NBA All-Star) Kevin Johnson assembled a rival bid led by Vivek
  Ranadivé plus a downtown arena plan; May 15, 2013, NBA owners voted **22-8** to deny
  relocation; Ranadivé's group bought the Kings at a then-record $534M valuation; Golden 1
  Center opened fall 2016 (observed, ESPN/SI/CBS accounts of May 2013, verifiedAsOf:
  2026-08-31; the city's arena contribution, ~$255M, is stable but approximate — flag on
  slide). Seattle's group had offered more money.
- **Mechanism:** a real board-of-governors decision under competing incentives: take the
  bigger check and a bigger TV market, or protect the principle that a city that steps up
  keeps its team (and preserve Seattle as future expansion leverage — which is exactly what
  happened, SR-9).
- **Operate:** the class **is** the Board of Governors. Each pair gets the two term sheets
  (real numbers), argues, locks a vote, then the real 22-8 verdict and 13 years of
  consequences land. The real decision is genuinely debatable — reasonable owners voted both
  ways, and the "right answer" depends on what you think a league is for.
- **Accessibility:** two cities want one team; you decide. Fans additionally recognize
  Ballmer (now Clippers owner) and the Kings.
- **Fiction-comparison:** an invented "City A vs City B" vote has no 22-8 to reveal, no real
  mayor's underdog coalition, and no 2026 epilogue.

### SR-9. Seattle vs Milwaukee — the controlled comparison on arena subsidies

- **Facts:** Seattle refused public arena money (I-91, 2006) and lost the Sonics (SR-7);
  Climate Pledge Arena was later renovated with ~$1.15B in *private* money (opened 2021,
  stable), and Seattle is now a frontrunner — with Las Vegas — in the NBA expansion process
  Adam Silver says is on track for a determination by end of 2026 (observed, ESPN Dec 2025 +
  king5 July 2026, verifiedAsOf: 2026-08-31). Milwaukee took the opposite bet: 2015, Wisconsin
  approved ~$250M public money for Fiserv Forum under an explicit league relocation threat
  (Seattle/Vegas named); the Bucks stayed, kept the Giannis Antetokounmpo era, and won the
  2021 title (stable, verifiedAsOf: 2026-08-31).
- **Mechanism:** the public-subsidy question — the single most generalizable sports-economics
  debate (stadium subsidies are a staple of real economics literature; the mainstream
  research finding that subsidies rarely pay off for cities is stable and should be named in
  synthesis). Outcome ≠ decision quality in both directions: Seattle "lost" and may still be
  vindicated; Milwaukee "won" and may still have overpaid.
- **Operate:** half the room is Seattle 2006, half Milwaukee 2015, same commit-then-reveal
  shape; the twin reveals disagree with each other — which is the point.
- **Accessibility:** "should your city spend school-and-roads money to keep a team?" is a
  civics question every 11-year-old can argue.
- **Fiction-comparison:** invention could produce one fake city's dilemma; reality provides a
  matched pair with opposite choices and unresolved verdicts.

### SR-10. The Suns' free-TV gamble — price vs reach, the Box Office hump in broadcast form

- **Facts:** 2023, amid the Diamond Sports (Bally Sports) RSN bankruptcy, new owner Mat Ishbia
  pulled the Suns off regional cable and put every game on **free** over-the-air TV (Gray
  Television) plus a cheap stream (Kiswe) — walking away from guaranteed RSN fees (reported in
  the tens of millions/yr) for reach; local ratings roughly doubled and streaming audience
  grew ~425%; by 2025 an extension worth $30M+/yr had reportedly restored much of the money
  (observed, ESPN/Front Office Sports/Awful Announcing, 2023-2025, verifiedAsOf: 2026-08-31;
  the exact forgone RSN fee is **NOT VERIFIED** to a single reliable number — present as
  "tens of millions").
- **Mechanism:** identical to the Price Dial: price high to few (cable fees) vs price at zero
  to many (reach, future fans, sponsorship) — revenue = price × audience, with a time
  dimension. Also creative destruction: the RSN model collapsing in real time.
- **Operate:** commit-then-reveal at the moment of the 2023 decision: take the guaranteed
  check or go free. Genuinely debatable — most teams did NOT follow the Suns.
- **Accessibility:** "charge for the channel or let everyone watch free" needs zero sports
  knowledge; it is the same question YouTube/Netflix ask.
- **Fiction-comparison:** an invented "TV choice" has no bankrupt real broadcaster, no real
  doubled ratings, and no honest ambiguity about whether it worked.

### SR-11. LeBron leaves, LeBron returns — the NBA-native player revenue shock

- **Facts:** LeBron James' 2010 departure from Cleveland cratered Cavs ticket demand and
  franchise value; his July 2014 return sold out season tickets within hours and drove
  franchise value and local TV/gate sharply upward (stable historical record; Forbes-reported
  value swing on the order of hundreds of millions; exact per-year deltas **NOT VERIFIED** to
  one figure — use direction and magnitude, not a fake-precise number). Modern echo:
  Wembanyama's 2023 arrival similarly moved Spurs home/road attendance (stable).
- **Mechanism:** star as demand shifter — the demand curve the student's dial rides on can
  jump overnight for reasons outside their control; asymmetric risk in revenue planning.
- **Operate:** mid-lesson shock beat for the Box Office: "your star just left/arrived — same
  dial, new hidden curve" with the real 2010/2014 Cleveland story as the reveal frame.
- **Accessibility:** LeBron is the one NBA name most non-fan kids know.
- **Fiction-comparison:** the spec's zone shifts are self-inflicted; LeBron 2010/2014 adds
  the exogenous version with a name attached — both belong in the module.

### SR-12. Warriors and Chase Center — own the building, own the revenue

- **Facts:** the Warriors privately financed the ~$1.4B Chase Center (opened 2019) and the
  Thrive City development around it; 2024-25 revenue **$833M**, the NBA's highest and 34%
  above the second-place Knicks; Rakuten jersey patch ~$45M/yr, the league's richest;
  Sportico 2025 valuation $11.3B, five straight years №1 (observed, Sportico via Bleacher
  Report/heavy.com, 2025, verifiedAsOf: 2026-08-31).
- **Mechanism:** revenue *sources* beyond the gate — who owns the building captures concerts,
  naming rights, sponsorship, real estate. The Revenue Flow pipes, real: gate + TV + merch is
  a simplification, and the Warriors show what the full pipe set looks like.
- **Operate:** a "what funds this team?" sorting/estimation beat with real pipe magnitudes;
  or the market card for the premium market in SR-1.
- **Accessibility:** "the team that owns its arena keeps the concert money too" is concrete.
- **Fiction-comparison:** fiction cannot produce an $833M-vs-$620M league-topping gap that is
  also checkable.

### SR-13. Dynamic pricing — the Price Dial exists in real life, hour by hour

- **Facts:** the San Francisco Giants pioneered dynamic ticket pricing in 2009 (partial) and
  2010 (full season) — software re-pricing every seat daily based on demand signals (stable,
  widely documented, verifiedAsOf: 2026-08-31); dynamic and variable pricing are now standard
  across NBA teams (stable; per-team specifics **NOT VERIFIED** and not needed).
- **Mechanism:** the lesson's core mechanic is a real job — real teams move the dial
  continuously; opponent, day-of-week, and star availability shift the curve.
- **Operate:** synthesis-stage validator, not a new mechanic: "the thing you did with one
  dial, the Giants built robots to do every hour — here's why." Cross-league use justified:
  the *origin story* is baseball's; the NBA examples (variable pricing by opponent) follow.
- **Accessibility:** kids have watched airline/Uber-style prices move; this names it.
- **Fiction-comparison:** proves to students the game wasn't a toy — their role exists.

### SR-14. What is a market worth? The expansion-fee ladder

- **Facts:** WNBA expansion fees: $50M (Golden State, Oct 2023) → $50M (Toronto, May 2024) →
  $75M (Portland, Sep 2024) → **$250M each** (Cleveland, Detroit, Philadelphia; June 30,
  2025 — 5x in ~20 months) (observed, Bloomberg/Sportico, verifiedAsOf: 2026-08-31). NBA:
  Silver says the Seattle/Las Vegas expansion determination is on track for end of 2026
  (observed, king5/ESPN, July 2026); NBA expansion fee expectations are reported in the
  $5B+ range but are **NOT VERIFIED** (no fee has been set).
- **Mechanism:** asset pricing by expected future revenue; scarcity of franchise slots; the
  fee ladder is a real-time price series a class can read like a chart.
- **Operate:** students price the next expansion slot (commit a bid) before seeing the real
  ladder; ties into SR-6 (why did the price 5x? Clark-era demand) and SR-9 (Seattle).
- **Accessibility:** "how much would YOU pay to own the 31st team?" needs no fandom.
- **Fiction-comparison:** the real ladder has the shock (5x jump) already in it, with dates.

### SR-15. The Luka trade — fan goodwill is a revenue asset

- **Facts:** Feb 1-2, 2025, Mavericks GM Nico Harrison traded 25-year-old Luka Dončić to the
  Lakers (for Anthony Davis, Max Christie, a 2029 first). Fan revolt: "Fire Nico" chants,
  ejected protesters, season-ticket cancellations "in droves"; Nov 11, 2025, Harrison was
  fired after a 3-8 start (observed, NBC/CNN/Al Jazeera, Nov 2025, verifiedAsOf: 2026-08-31).
  Complication for the reveal: Dallas then won the 2025 lottery and drafted Cooper Flagg
  (stable, May-June 2025) — outcome ≠ decision quality, in both directions.
- **Mechanism:** demand is attachment, not just wins — a roster decision destroyed paying
  demand overnight without changing ticket prices at all; reputational path dependence.
- **Operate:** best as a REVEAL/ARGUE exhibit, not an operated decision (trading a specific
  living player as a class exercise needs care — see rights/tone section): "the dial didn't
  move, but the curve did — who moved it?"
- **Accessibility:** betrayal is a universal story; Luka/LeBron names are bonus texture.
- **Fiction-comparison:** the spec's "word got around that your seats are expensive" is the
  fictional cousin of a real event where word actually got around.

---

## accuracy-findings

Verified this session (all verifiedAsOf: 2026-08-31, sources = major outlets/league PR named
per anchor above):

- 2025-26 cap $154.647M (+10%, the CBA smoothing maximum); 2026-27 cap $164.961M (+6.7%),
  tax $200.428M, aprons $209.015M / $221.686M, floor $148.465M (NBA.com, June 2025 / June
  2026). The 10%/yr smoothing cap is a 2023 CBA rule (stable).
- National media deal: ~$76B / 11 yrs / 2025-26–2035-36; ESPN-ABC ~$2.6B/yr, Amazon ~$1.8B/yr
  (ESPN/Forbes, July 2024).
- 2024-25 luxury tax: ~$456M from 10 teams; Suns ~$152M; ~$11.4M rebate per non-tax team
  (RealGM, 2025). Note: one RealGM headline says "$114M" per team — that is an error for
  $11.4M; arithmetic ($456M × 50% ÷ 20) confirms.
- Celtics June 2025: Holiday → POR (Simons + 2 seconds), Porziņģis → ATL (3-team); moves
  explicitly framed by Brad Stevens as second-apron driven; ~$200M+ combined salary+tax
  savings reported (Boston Globe/Yahoo, June-July 2025).
- Packers FY2025 (July 2026 report): national share $453.2M/team; FY2024: $432.6M/team,
  $719M total revenue (packers.com/Sportico).
- Fever attendance 4,066 (2023) → 17,036 (2024); six teams moved Fever games to larger
  arenas (SI/ESPN/Wikipedia season pages).
- WNBA CBA: ratified late March 2026, seven years (2026-2032), cap $1.5M → $7M, max salary
  → $1.4M, minimums $270-300K, ~20% player revenue share over the deal (SportsPro/NBA.com,
  March 2026). WNBA expansion fees $50M/$50M/$75M/$250M×3 as dated in SR-14.
- Kings relocation denied 22-8 on 2013-05-15; record $534M valuation sale to Ranadivé group;
  Golden 1 Center opened 2016 (ESPN/SI/CBS).
- SGA extension: 4 yrs / $285M, agreed 2025-07-01, highest per-year salary in NBA history,
  through 2030-31; OKC won the 2025 title (AP/Yahoo/CNN).
- Harrison fired 2025-11-11 after fan backlash and 3-8 start (NBC/CNN).
- Warriors $833M revenue / $11.3B Sportico valuation / $45M/yr Rakuten patch (Sportico 2025).
- Lakers ~$149M vs Grizzlies <$10M local media, Memphis +$32M sharing, 14-of-30 unprofitable
  before sharing (ESPN leaked-financials report, Sep 2017 — dated, use as "one leaked year,"
  not current figures); 2021-22 pool payments $163.6M from 10 teams (ESPN, Mar 2023).

Grade 5-6 simplification notes and misconception risks:

- **Scaled dollars.** The Box Office runs at $10-$120 tickets and a $75,000 payroll bill; real
  NBA scale is $50-$5,000 seats and ~$150M+ payrolls. Keep student-scale dollars but label the
  real scale on the board ("real version: multiply by ~2,000"). Misconception risk if
  unlabeled: students conclude an NBA team is a lemonade-stand-sized business.
- **Linear demand curves.** The spec's `fans = base − sensitivity × price` is a modeling
  choice, not measured demand. When market cards become real teams (SR-1), say "modeled on
  real market differences," never "the Knicks' actual demand." Misconception risk: students
  citing invented team-specific numbers as fact.
- **"TV money is fixed."** True for one homestand (correct at lesson scale); false over years
  (the deal itself was won by demand). SR-2's cap-growth reveal is the honest patch.
- **Tax ≠ ban.** Teach the aprons as prices with escalating side-constraints, not as "you
  can't spend more than X" — the Celtics *chose*; that's the lesson. Misconception risk:
  collapsing tax into cap and re-teaching M1's wall.
- **Revenue ≠ profit.** The Packers' 2025 report shows record revenue with an operating
  *loss* (player-cost timing). One board line inoculates against "more revenue = winning."
- **Outcome ≠ decision quality** must be stated explicitly on every commit-then-reveal (SR-3,
  SR-8, SR-9, SR-10, SR-15): several real reveals here (Flagg lottery, Milwaukee's title)
  reward or punish decisions for reasons the deciders could not know.

---

## staleness-findings

Fast-aging facts — every one baked into product copy needs a visible "as of" stamp:

- **Cap/tax/apron numbers age annually every late June.** Stamp "2026-27 season" on any
  figure. The +10% → +6.7% growth pair is itself a teachable time series; keep it as dated
  pairs, never "the cap is X."
- **NBA expansion is live news** — Silver: determination expected by end of 2026. Any copy
  saying "Seattle has no team" or "30 teams" could be wrong within months of first classroom
  use. Write "as of summer 2026, 30 teams; Seattle and Las Vegas are bidding" and treat a
  granted franchise as a content patch, not a surprise. (An expansion announcement would
  *upgrade* SR-9/SR-14 — design them to absorb it.)
- **Warriors/team revenue and valuations** re-issue annually (Sportico ~Feb, Forbes ~Oct,
  CNBC ~Feb). Use "most recent published" with year stamp.
- **The Lakers-Grizzlies local-TV gap** rests on 2016-17 leaked data and the RSN world has
  since partially collapsed (Diamond bankruptcy; the Lakers' own Spectrum channel reported
  shaky in Aug 2026 amid the team's sale). Teach it as "in 2017 the gap looked like this,"
  then use the RSN collapse (SR-10) as the "and then the world changed" beat — the staleness
  is itself path-dependence material.
- **WNBA numbers are on a steep curve** (cap, fees, attendance records) — anything quoted
  will read low within a year; always attach the date, and let the steepness be the story.
- **Player-team facts** (SGA's contract, Luka on the Lakers, Flagg in Dallas) are stable for
  the 2026-27 school year but stamp season anyway; rosters churn.
- Historical anchors (SR-5 structure, SR-7, SR-8, SR-9 pre-2022, SR-11, SR-13) are
  staleness-safe — prefer them for any copy that must survive years unedited.

---

## rights-source-considerations

Material flags only; no blanket legal claims; nothing here justifies fictionalizing.

- **Names, facts, scores, salaries, attendance, votes** — used as facts throughout; this is
  the same category the product already uses in M1 and is the founder-mandated direction.
- **Logos, wordmarks, team color-trade-dress, arena photography, broadcast clips, player
  photos/likenesses** — NOT needed by any anchor above and not recommended; render teams as
  typographic names in the product's own visual system. If a later visual pass wants marks or
  photos, that is a material escalation item, not a default.
- **Datasets:** every number above traces to league PR, team-published reports (Packers), or
  major-outlet journalism — no proprietary datasets (Sportradar, Ticketmaster resale data,
  Team Marketing Report tables) are required. Do not ingest resale-price feeds for the demand
  curves; model them (SR-1) and label them modeled.
- **Leaked financials (SR-4):** the 2017 ESPN report is journalism about confidential league
  documents — citing ESPN's published reporting is ordinary practice; do not present the
  underlying leaked document itself as a product asset.
- **Living private-ish individuals in a negative frame (SR-15):** Nico Harrison is a public
  figure in a publicly reported firing; stick to reported facts, neutral tone, no mockery in
  student-facing copy ("the GM who made the trade was fired that November" — no
  characterization). Same discipline for the Maloofs (SR-8).
- **Betting-adjacent sources:** avoid citing sportsbook content pages in product materials
  for a grades 5-6 audience; every number above has a non-betting source.
- **Kids' names on shared screens stay fictional** (privacy, per CLAUDE.md §3) — real-world
  mandate applies to sports content, not students.

---

## recommendation

Ranked top 5, mapped to the module's three lesson-shaped slots (L1 pricing/Box Office; L2
revenue sharing/market size — the deferred dial; L3 institutions/path dependence):

1. **SR-1 + SR-2 into L1 (The Box Office).** Replace the four fictional Market Cards with
   Knicks / Thunder / Warriors / Grizzlies and label the TV pipe with the real $76B deal.
   **Explicit finding: "Legacy Original / Expansion Team / Riverside Market / Capital
   Market" is precisely the place where a real situation is materially stronger** — the
   fictional cards carry zero attachment, teach the identical curves, and cost the same to
   build as real names. SR-11 (LeBron 2010/2014) is the ready-made star-shock beat and SR-13
   (dynamic pricing) the "your job is real" synthesis close for the same lesson.
2. **SR-6 (Caitlin Clark shock) — the module's single strongest new story.** Fits L1 as the
   demand-shock beat (operate a rival's venue/price decision when the Fever visit) or
   anchors its own experience; its 2026 CBA/expansion-fee tail also feeds L2. It is the
   rare anchor that is current, numerically spectacular, fully verifiable, and maximally
   accessible to non-fans (including, pointedly, girls in the room).
3. **SR-4 + SR-5 into L2 (revenue sharing / market size).** The legacy "Small Markets, Big
   Money" content finally gets real numbers: Lakers-vs-Grizzlies 15:1 local-TV gap operated
   through a sharing dial, with the Packers' open books as the cross-league reveal (full
   sharing = smallest market thrives — an earned exception to NBA-primary). SR-14's fee
   ladder is the optional "what is a market worth" opener.
4. **SR-8 (Kings 2013 vote), backed by SR-7/SR-9, into L3 as the commit-then-reveal
   centerpiece.** A real 22-8 owners' vote with real term sheets, a genuinely two-sided
   debate, and a 2026 epilogue (Seattle expansion) still unfolding — the best
   outcome-≠-decision-quality vehicle in the portfolio. The Seattle/Milwaukee subsidy pair
   (SR-9) is the strongest beyond-sports generalization in the module.
5. **SR-3 (tax/aprons incentive design: Celtics teardown + Harden antecedent + OKC's 2025
   vindication) into L3** — institutions change behavior; also the cleanest bridge back to
   M1's cap ("M1: the wall. M2: the prices around the wall."). SR-10 (Suns free-TV) and
   SR-15 (Luka goodwill) are first alternates: keep both as reveal-stage exhibits even if
   they don't get an operated seat.

Formal dissent: none recorded. Open item for Economic Truth: the SR-1 modeled demand curves
must be reviewed so real team names never carry invented team-specific numbers presented as
fact (misconception risk flagged in accuracy-findings).
