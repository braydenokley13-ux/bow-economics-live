# Gate — Module 2 Lesson 3 "Writing the Rule" — Sports Reality

Role: Sports Reality Director · Assignment: `gate-l3-sr` · Boss run: `m2-quality-war`
Reviewed: 2026-09-01. Target: `runtime/src/modules/writeTheRule.ts` (built) + L3 client copy in
`runtime/src/client/{play,board,teach}/main.ts`. Reviewed as built, not as specced.

Evidence cited: `SPORTS_REALITY_INPUT.md` anchors `SR-1`…`SR-15`; `SELECTION_SR_REVIEW.md`
findings `C-1`/`C-2`; `ARCHITECTURE_SELECTION.md` charter `BC-3`. New anchors introduced by this
gate carry ids `SR-L3-1`…`SR-L3-4`. Claim status: **observed** = web-verified this session with
source and date; **stable** = settled historical record; **inferred** and **NOT VERIFIED** marked.

**Highest-severity finding first:** the finale's institutional-design card teaches a false NBA
rule (`A1`), and the capstone's term sheets do not exist on any student surface although `/teach`
instructs the teacher that they do (`A2`). Both are copy-level repairs with verified replacements
in hand. Neither threatens the design.

---

## real-world-anchors

### SR-L3-1. The Kings capstone, as built — every fact checks out

The rendered capstone (`ARGUE_COPY`, `ARGUE_PROMPT`, `ARGUE_REVEAL_COPY`, the Sacramento
`identityLine`, the `SOURCE_NOTES` Sacramento entry) was verified fact by fact:

| As rendered | Verdict | Source / verifiedAsOf |
| --- | --- | --- |
| "January 2013. The Maloof family agrees to sell the Sacramento Kings to a Seattle group led by Chris Hansen and Steve Ballmer" | accurate | stable; agreement announced Jan 2013 · 2026-09-01 |
| "who plan to move the club and bring back the SuperSonics" | accurate | stable · 2026-09-01 |
| "Seattle lost the Sonics to Oklahoma City in 2008 after a public-money fight" | accurate (SR-7: I-91 passed Nov 2006; team left 2008) | stable · 2026-09-01 |
| "Sacramento's mayor puts together a rival bid under Vivek Ranadive with a downtown arena plan" | accurate | stable · 2026-09-01 |
| "Seattle's offer is worth more money" | accurate — Hansen raised to a **$625M** valuation ($409M for the Maloofs' 65%) against Ranadivé's **$534M** | observed, CBS Sports / SI / Bleacher Report accounts of Apr–May 2013 · 2026-09-01 |
| "On May 15, 2013 the owners voted 22-8 to deny the relocation" | accurate, exact date and count | observed, SI / CBS Sports / king5, 2013-05-15 · 2026-09-01 |
| "sold in Sacramento at a then-record $534M valuation" | accurate — a then-record NBA franchise valuation; the sale to the Ranadivé group was itself approved unanimously by the Board later in May 2013 | observed, SI 2013-05-28 · 2026-09-01 |
| "Golden 1 Center opened downtown in 2016" | accurate (September 2016) | observed, Wikipedia/Comstock's · 2026-09-01 |
| 2026 epilogue: "Seattle is a frontrunner, with Las Vegas, in an NBA expansion process the commissioner says is on track for a determination by the end of 2026" | true but a season behind — see `S1` | observed, king5/FOX13 July 2026 · 2026-09-01 |

**Expansion status as of 2026-09-01 — the determination has NOT resolved.** In **March 2026** the
Board of Governors voted **unanimously (all 30)** to formally explore expansion to Seattle and Las
Vegas *exclusively*, targeting the **2028-29** season, with PJT Partners engaged as adviser; bids
are reported in the **$7-10B** range per club; a **final vote requires 23 of 30 governors** and was
expected later in 2026. In July 2026 Silver said the process was "very much on track" for
year-end; Samantha Holloway (Kraken / Climate Pledge Arena majority owner) is the only publicly
declared Seattle bidder. Observed: NBA.com PR, ESPN, CBS Sports, NBC Sports (Mar 2026); king5 /
FOX 13 Seattle / Front Office Sports (July 2026). verifiedAsOf: 2026-09-01.

**Commit-then-reveal integrity: upheld on the debatability test.** The lesson does not ship an
answer key. `kingsSplitLineClaimed` renders "Nobody is scored against the owners"; the `/play`
lock note reads "There is no score"; the `/teach` ASK block answers `ARGUE_PROMPT` with "There is
no right answer and the real vote was 22-8, not unanimous. Eight owners voted the other way and
they were not stupid," and asks the genuinely open follow-up "Seattle offered MORE money and lost.
What were the owners buying instead?" The reveal is withheld behind `teacher:commitReveal` and the
board pre-reveal state reads "Nobody has seen the vote." The epilogue keeps the verdict open
("thirteen years later Seattle may get a club anyway"). This is the correct shape. Two integrity
gaps are recorded at `A2` and `A6`.

### SR-L3-2. The revenue-sharing and tax institution content

Checked against the real NBA system at the modeled scale, and against `SR-3`/`SR-4`.

- **Structure is faithful.** A percentage of *local* revenue into a pot split equally, with the
  national check outside the pot, is the real NBA architecture. `HOUSE_RULES` ("The national
  television check is the same for every club, every week, and the pot never touches it") is
  correct: national media money is already distributed equally and is not the local-sharing pool.
- **Honest labeling is largely exemplary.** `SIMPLIFICATIONS` entry 1 discloses that in-arena
  spend is untaxed *and* names the misconception risk ("A student could conclude that real revenue
  sharing exempts concessions exactly. It does not"). Entry 4 labels the 30% league-office fallback
  as MODELED, not quoted. Entry 5 refuses the false "sharing pays the payer" summit the design
  document hoped for and says so in the ledger. Entry 6 forecloses "revenue = profit." `R11`-style
  discipline holds: `MODELED_DOLLARS_LINE` states the curves are modeled on real market
  differences and not any club's measured demand, and the four `MARKET_PROFILES` carry a source
  comment saying the same. One precision defect is recorded at `A8`.
- **`C-1` is NOT recurring.** The lottery-reality repair `BC-3` required is present and
  load-bearing in three places: `ROOKIE_COPY` states in-product, at the moment the rookie lands,
  "That is NOT how the real league does it: the NBA uses a lottery precisely so that losing is
  never a guaranteed reward — since 2019 the three worst records each have a 14.0% chance at the
  first pick, and the worst record has no guarantee at all"; `SIMPLIFICATIONS` entry 3 repeats it
  as a ledgered risk; `SOURCE_NOTES` carries the 14.0% figure. No worst-picks-first claim survives
  anywhere in the module. Accurate (2019 lottery reform, three worst records at 14.0%; stable ·
  2026-09-01). This finding is closed.
- **The tax content is taught as a price, not a wall** — `HOOK_COPY` ("The league has not banned
  Boston from spending a dollar. It has only put a price on it"), `HOOK_BOARD_QUESTION`, and the
  C7 rail all hold the `SR-3` line. `HOOK_REVEAL_COPY` carries the Harden/OKC counterweight and
  closes "There is no score here and there never was." Correct, and the `SOURCE_NOTES` figures
  ($456M from ten clubs in 2024-25; Suns ~$152M; ~$11.4M per non-tax club — not the $114M RealGM
  headline error; 2026-27 tax $200.428M, aprons $209.015M / $221.686M) match `SR-3` exactly.

### SR-L3-3. The finale's seven IN SPORTS rows, row by row (BC-3 season-stamp audit)

| Card | Stamped? | Accuracy |
| --- | --- | --- |
| `revenue-sharing` | **NO** — "In one leaked league year…" for the 14-of-30 / $32M Memphis / $115M Lakers figures; the second sentence ("In 2021-22 ten clubs paid $163.6M…") is stamped | figures accurate to `SR-4`; stamp defect at `A5` |
| `incentives` | yes — "in 2024-25" | accurate to `SR-3`; verified · 2026-09-01 |
| `institution-design` | yes — "May 15, 2013" | **false institutional claim** — `A1` |
| `shared-product` | yes — "2010", "2025-26 through 2035-36" | $76B/11yr accurate; **magnitude claim false for the Knicks** — `A3` |
| `composition` | yes — "FY2025, reported July 2026" | accurate to `SR-5`, including the operating-loss asterisk; verified · 2026-09-01 |
| `path-dependence` | yes — 2006 / 2008 / 2015 / 2021 / "summer 2026" | accurate; 2026 clause understated — `S1` |
| `subsidy-coda` | yes — 2006 / 2008 / 2015 / 2021 | accurate; the mainstream "subsidies rarely pay off" finding is correctly attributed as a research finding, not a fact |

### SR-L3-4. Fandom test — passes, with the capstone as the weak point

Non-fan success from on-screen information holds across the lesson. The four market profiles carry
`plainLine` text that explains the economics in plain language with no basketball knowledge
required ("A big-market club with a building that fills… the question here is what a seat is worth
— never whether the room fills"); `sizeLabel` states BIG / SMALL MARKET outright; the dials, the
pot column, and the before/after bar are all self-describing. The `identityLine` facts are optional
depth layered on top, which is the correct architecture.

The capstone is the exception, in the direction the founder invariant warns against. Because no
numbers reach the student screen (`A2`), the vote cannot be reasoned quantitatively by anybody —
which *increases* rather than decreases the fan's edge, since a student who happens to know the
2013 story knows the outcome and the non-fan has neither the story nor the figures. See `A2` and
`A6`. Separately, the capstone block puts four unglossed proper nouns (Maloof, Hansen, Ballmer,
Ranadivé) in five sentences; none blocks comprehension, and the decision stays legible, but Ballmer
is the one that would repay a four-word gloss (`A9`).

---

## accuracy-findings

Severity order. Every item names the source and `verifiedAsOf`.

### A1 — HIGH (blocking category: economic-truth). The institution-design card teaches a false NBA rule.

`writeTheRule.ts` C8 `inSports` rail, rendered on the projector in the finale:

> "Two-thirds is not a decoration. The pot is the big markets' money, so real leagues make the big
> markets be bought rather than outvoted — which is why owners' votes on money take supermajorities,
> and why the Sacramento vote on May 15, 2013 was 22-8 rather than 16-14."

**NBA relocation approval requires a simple majority of the Board of Governors — 16 of 30 — not a
supermajority.** The 22-8 tally is the count, not a threshold. Worse, the sentence deploys "16-14"
as the rejected supermajority-free hypothetical when 16-14 is precisely the result that *would have
approved* relocation under the real rule. The card therefore (a) asserts an institutional rule the
NBA does not have, (b) cites as its evidence a vote governed by the opposite rule, and (c) uses
that false rule to justify the lesson's own `ADOPT_COPY` two-thirds adoption threshold — so the
room's constitutional design lesson rests on it. Source: NBA Constitution and By-Laws (relocation
decided by majority vote of all Members); SI / CBS Sports / king5 accounts of the 2013-05-15 vote.
verifiedAsOf: 2026-09-01. Status: observed.

**Repair, verified and stronger than the claim it replaces.** The real supermajority is current,
checkable, and sits on the same institution: the **final NBA expansion vote requires 23 of 30
governors**, and the Board's March 2026 exploration vote was unanimous. Suggested substance —
"Relocation only needed a simple majority, 16 of 30, and it still lost 22-8. The votes that add
*owners* are the ones that need a supermajority: expanding to 32 clubs takes 23 of the 30. When
money is being divided, leagues make the payers be bought rather than outvoted." This keeps the
card's economics, removes the false rule, upgrades the Kings tie-in (the 22-8 becomes more
striking, not less: the Seattle side lost by more than the rule required), and folds in the `S1`
staleness repair. `ADOPT_COPY` itself needs no change; it argues from the pot's ownership, not from
a claimed league rule.

### A2 — HIGH. The Kings term sheets do not exist on any student or projector surface, and `/teach` says they do.

`/teach` instructs the teacher twice that they are there:

- NOW/action line: "Both term sheets are on their screens with the numbers. Give them thirty
  seconds and reveal — an undecided desk still argues."
- Student-instruction line: "Read both term sheets. Seattle's offer is worth more money;
  Sacramento's keeps the club where it is. Every pair locks a vote."

The shipped surfaces render no term sheets and no numbers. `studentView` case `ARGUE` passes only
`{message: ARGUE_COPY, prompt, vote, revealed}`; the `/play` ARGUE branch renders that prose plus
two buttons plus the post-reveal panel. `boardView` case `ARGUE` passes `{copy: ARGUE_COPY, prompt}`
and the board renders the same prose. `ARGUE_COPY` contains **zero dollar figures** — its entire
quantitative content is the phrase "Seattle's offer is worth more money."

Three consequences, all material:

1. **A `/teach` instruction is false about the shipped product** — the random-teacher standard
   (CLAUDE.md §4) fails at the module's most reality-loaded beat: the teacher tells the room to read
   something that is not on their screens.
2. **`SR-8` specified the numbers and they are verified.** The anchor sheet's operate line is "Each
   pair gets the two term sheets (**real numbers**), argues, locks a vote." The figures are
   confirmed: Hansen/Ballmer raised to a **$625M** valuation (**$409M** for the Maloofs' 65%);
   Ranadivé's group bought at a then-record **$534M**. Observed, CBS Sports / SI / Bleacher Report,
   Apr–May 2013 · verifiedAsOf 2026-09-01.
3. **The economics of the vote are unplayable without them.** A Board of Governors weighing "more
   money now" against "a city that stepped up" needs the two amounts; with only "worth more money,"
   the beat is a sentiment poll, not the constrained institutional choice the module is built to
   deliver, and the room cannot argue about *how much* more.

**Repair:** render a two-column term sheet on `/play` and `/board` in the ARGUE phase carrying the
verified figures — SEATTLE: $625M valuation, $409M for the Maloofs' 65%, club relocates, Sonics
name returns; SACRAMENTO: $534M valuation, club stays, new downtown arena. Add the `A4` public-money
line to the Sacramento column. Alternatively fix `/teach` to match a numberless screen — but that
discards verified content the anchor sheet called for and leaves the beat quantitatively empty, so
it is the weaker option.

### A3 — MODERATE-HIGH. "Several times any one club's gate" is false for a club in this league, and contradicts the module's own printed fact.

C5 `shared-product` rail: "The national television deal is about $76B over eleven years, 2025-26
through 2035-36, split equally, and it is **several times any one club's gate**."

Arithmetic on the module's own dated figures: $76B ÷ 11 years ÷ 30 clubs ≈ **$230M per club per
year**. The Knicks' `identityLine` in this same file states "about $193M in gate receipts in
2024-25, a franchise record and the largest in the NBA" — verified (Statista/Forbes, Knicks
2024-25 gate $193M, up from $175M; observed · 2026-09-01). $230M against $193M is **1.2×**, not
"several times." The universal quantifier "any one club" is what fails; the claim holds only for
small markets.

This is a recurrence of the `C-2` pattern — national-versus-gate proportions overstated for New
York — that `BC-3` required re-derived before build. It is also self-contradicting: the module's own
computed atom `synth-national-bigger` on the C3 card states the honest version ("more than the whole
room took at the gate"), aggregated across the room rather than asserted of every club.

**Repair:** "…split equally, and for a small-market club it is several times what it takes at the
gate — for the biggest, it is about the same." That is true, keeps the payload, and turns the
comparison into the market-size point the card already wants.

### A4 — MODERATE. The capstone omits the ~$255M of public money that decided it, while another card claims the lesson contained no public money.

Sacramento's winning bid was not simply a rival check. The Sacramento City Council approved
**$255M in land and cash** toward the arena (capped at 47.7% of the final $534.6M cost) without a
public vote; the city issued **$273M in bonds** in August 2015 against roughly **$18M in annual
payments running to 2050**, a total obligation reported around $626M. Observed: Sacramento City
Express (Aug 2015), Comstock's, Golden 1 Center public record · verifiedAsOf 2026-09-01. `SR-8`
flagged this figure ("the city's arena contribution, ~$255M, is stable but approximate — flag on
slide"); it is absent from `ARGUE_COPY`, `ARGUE_REVEAL_COPY`, the Sacramento `identityLine`, and
the Sacramento `SOURCE_NOTES` entry.

Two problems. First, it materially changes the decision the class is voting on: without it, the
room reads Sacramento's win as "the city that cared more," when the operative fact is "the city
that put up public money." Second, the `subsidy-coda` card asserts "Nothing you played today was
about public money — on purpose," which is not true of the beat the room played twenty minutes
earlier. Misconception risk: students carry away that civic will beat capital, when what beat
capital was a 35-year public bond.

**Repair:** one clause in `ARGUE_COPY` or the Sacramento term-sheet column ("Sacramento's plan puts
about $255M of city money into a new downtown arena, borrowed against payments running to 2050"),
plus a matching `SOURCE_NOTES` line. This also converts the `subsidy-coda` card from an admission
into a callback, which is the stronger version.

### A5 — MODERATE (BC-3). The revenue-sharing rail's headline figures carry no season stamp.

C6 `revenue-sharing` rail opens "In one leaked league year 14 of 30 clubs lost money BEFORE
revenue sharing and 9 after. Memphis received about $32M, the most in the league — and the Lakers
still cleared about $115M after paying in." The figures are accurate to `SR-4` and correctly framed
as leaked/one-year, but the year is never given on the surface where the class reads it. The data is
**2016-17** — nine years old as of first classroom use — and `BC-3` requires "season stamps on
every real figure." `SOURCE_NOTES` does carry "(2016-17 reporting)"; the projector rail does not,
and the rail is the surface. The rail's second sentence is correctly stamped "In 2021-22."

**Repair:** "In the leaked 2016-17 league year…". One phrase; also makes the follow-on RSN-collapse
staleness (`S3`) legible rather than confusing.

### A6 — MODERATE. Commit-then-reveal has no handling for students who already know the 2013 outcome.

The module applies anti-herding discipline rigorously to the proposal rounds (`BC-6` fix 4: the
histogram is withheld until round 1 closes) but applies none to prior knowledge at the capstone. A
student who knows the Kings stayed votes DENY knowing the answer, and — because there are no
numbers on screen (`A2`) — has nothing to reason against instead. The `/teach` DON'T EXPLAIN YET
list guards the beat from the *teacher* ("The Kings vote. It is a different beat and it needs a
clean start") but not from the room.

**Repair:** one line in `ARGUE_COPY` or the `/teach` NOW block along the lines of "Some of you may
know how this ended. Vote what you would have voted in that room in 2013 — you will be asked to
defend it either way." Cheap, and it converts prior knowledge from an advantage into an obligation
to argue. `A2`'s term sheets are the substantive half of the same repair.

### A7 — LOW-MODERATE. `HORIZON_LINE` claims real league scale; the shipped constants are roughly 20-25× below it.

`HORIZON_LINE`: "One 'week' here stands for about a month of a real season. That compression is the
one thing this lesson scales; **the dollars are at real league scale** and are modeled on real
market differences, not measured from any club's books."

The shipped constants: `NATIONAL` = $950,000 per club per week; New York `bill` $1.6M, `localBase`
$470K, `ancillary` $18. Against the module's own stated horizon of one week ≈ one month, real
per-club national media is ≈$230M/yr ≈ **$19M/month** (`SR-2`, verified above) against the shipped
$950K, and the Knicks' real gate is $193M/yr ≈ $16M/month against a shipped week of roughly $1.15M
at a $58 price and a full building.

The world is internally consistent at approximately 1/20-1/25 of real scale — which is a defensible
design choice and matches the `SR` sheet's own "scaled dollars" simplification note — so this is a
**copy defect, not a tuning defect**. The sentence as written is a checkable magnitude claim that
does not survive checking, in a module that stakes its identity on real scale.

**Repair:** replace "the dollars are at real league scale" with the honest version already ledgered
in `SR`'s accuracy notes — "the dollars are scaled down from real league scale so a class can hold
them; the *proportions* between gate, local media and the national check are the real ones." Add
the scale factor to `SIMPLIFICATIONS` so it is ledgered rather than asserted. Precise re-derivation
of the factor belongs to Economic Truth; my finding is that the claim as printed is unsupported.

### A8 — LOW-MODERATE. Two precision defects in the revenue-sharing labeling.

`SIMPLIFICATIONS` entry 4: "It is MODELED on the NBA's design (a percentage of local revenue into
an equally split pool, **with conditions attached**), not a quotation of the real rate, **which is
not public**."

- "with conditions attached" invites the inference that the NBA conditions a club's *receipts* on
  reinvestment, as the module's CONDITION dial does. The real system's conditions are principally
  market-size eligibility and performance-based disqualification rules for receiving clubs, not a
  reinvestment floor. The module's CONDITION is an invented instrument — legitimately so, and
  `RULE_COPY` presents it as the room's own dial — but this ledger line blurs that.
- "the real rate… is not public" is slightly overstated. The full revenue-sharing plan is not
  published, but the design is widely reported as each club contributing roughly 50% of its net
  defined revenue with an equal share pegged to league-average team revenue. Status: **inferred**
  from consistent reporting; no single audited figure. verifiedAsOf: 2026-09-01.

**Repair:** "…with eligibility conditions attached — the real ones turn on market size, not on
reinvestment, and our CONDITION dial is ours. The plan's exact terms are not published; the design
is widely reported as roughly half of each club's net local revenue."

### A9 — LOW. Four unglossed proper nouns in the capstone.

Maloof, Hansen, Ballmer, Ranadivé arrive in five sentences with no identification beyond "a Seattle
group" and "Sacramento's mayor." None blocks the decision, so the fandom test still passes, but
Ballmer repays a four-word gloss for a grades 5-6 room ("Steve Ballmer, who now owns the Clippers"
— accurate; he bought the Clippers in 2014 after losing this bid, which is itself the kind of
consequence the lesson trades in). Optional.

---

## staleness-findings

### S1 — MODERATE, and time-critical for the 2026-27 school year. The expansion epilogue is a season behind.

Two surfaces carry it: `ARGUE_REVEAL_COPY` ("as of summer 2026 Seattle is a frontrunner, with Las
Vegas, in an NBA expansion process the commissioner says is on track for a determination by the end
of 2026") and the `path-dependence` rail ("as of summer 2026 Seattle is a frontrunner for
expansion"), plus the last `SOURCE_NOTES` entry.

Both are **true and correctly stamped**, and the `SR` sheet's instruction to write it as an as-of
claim was followed. But "frontrunner" now understates the record: in **March 2026 the Board of
Governors voted unanimously to formally explore Seattle and Las Vegas exclusively**, targeting
2028-29, with a final vote requiring 23 of 30 governors. That is not a frontrunner position; it is
a formal board process naming two cities. Observed: NBA.com PR / ESPN / CBS Sports / NBC Sports,
March 2026 · verifiedAsOf 2026-09-01.

Upgrading it is not merely a freshness fix — it is the strongest available version of the capstone.
The same institution that voted 22-8 to keep the Kings in Sacramento has now voted 30-0 to explore
giving Seattle a club, thirteen years later. That is the module's path-dependence thesis stated by
the real world, on the record, with dates.

**Live risk:** the final vote was expected before the end of 2026, i.e. **during the school year
this lesson will first be taught**. Any copy asserting 30 clubs or an unresolved process can go
stale mid-term. Recommend the epilogue be written to absorb the outcome rather than be broken by it
("the owners are voting on it now; 23 of the 30 have to say yes"), and that the last `SOURCE_NOTES`
line be treated as a scheduled content patch with a named re-check at each term start.

### S2 — LOW-MODERATE. Tax and cap figures are one to two seasons behind, though honestly stamped.

`SOURCE_NOTES` and the C7 rail cite **2024-25** luxury tax settlements ($456M / ten clubs / Suns
$152M / $11.4M rebates) and **2026-27** cap lines (tax $200.428M, aprons $209.015M / $221.686M).
Both are stamped, so nothing is false. But the 2025-26 season has since completed: its tax level
was $187.895M, and the taxpayer count fell from fourteen at the start of the season to roughly
seven after deadline moves (Celtics, Nuggets, Suns, Mavericks, Sixers, Magic, Raptors all ducked
under). Observed: Hoops Rumors (Feb 2026), Sports Business Classroom tracker · verifiedAsOf
2026-09-01. Final settled 2025-26 payment totals were **NOT VERIFIED** to a single reliable
published figure this session.

No repair required — the stamps make the content honest. Recorded so the annual late-June refresh
is a scheduled task, not a discovery. The 2025-26 collapse from fourteen taxpayers to seven is
itself on-message for the C7 card ("a price, not a wall") if a future pass wants it.

### S3 — LOW-MODERATE. The revenue-sharing rail rests on nine-year-old leaked data.

The 2016-17 figures (`A5`) are the oldest live numbers in the module and sit on a projector rail
undated. Beyond the stamp repair, the underlying world has changed: the RSN model that produced the
Lakers' ~$149M local deal has since partially collapsed (Diamond Sports bankruptcy, `SR-10`). The
`SR` sheet's guidance stands — teach it as "in 2017 the gap looked like this," and the staleness
becomes path-dependence material rather than a defect. Currently the module does neither: it
neither dates the figures nor uses their age.

### S4 — LOW. Club-identity facts are stamped to a season that is now past.

Every `capacityNote` reads "listed basketball capacity · 2025-26" — a prior-season stamp for a
lesson taught in 2026-27. The Knicks gate figure is 2024-25; Warriors revenue/valuation figures
re-issue annually (Sportico ~Feb, Forbes ~Oct); the Packers FY2026 report lands ~July 2027. All are
stamped and therefore honest, none is wrong, and the historical anchors carrying the module's
weight (2008 Sonics, 2013 Kings, 2015 Milwaukee, 2010/2014 LeBron, 2019 lottery reform) are
staleness-safe. Arena names were spot-checked and hold: Kaseya Center is current under a 17-year
agreement from April 2023 (observed, Kaseya Center / Wikipedia · 2026-09-01).

Recommend re-stamping capacities to 2026-27 when the league publishes, as a batch task rather than
a repair.

---

## rights-source-considerations

Material flags only. No blanket legal claims; nothing here justifies fictionalizing any of it.

- **Names, dates, vote counts, valuations, salaries, attendance, arena costs** are used as facts
  throughout, which is the founder-mandated direction (CLAUDE.md §3) and the same category already
  shipped in M1. Every figure in this module traces to league PR, published team reports, public
  municipal record, or major-outlet journalism. No proprietary dataset is required or used, and no
  betting-adjacent source appears. No change recommended.
- **No marks, logos, photography, likeness, or broadcast material appears anywhere in the L3
  surfaces.** Clubs, buildings and people are rendered as typographic names in the product's own
  visual system. This is the correct posture; any later visual pass that wants marks or photos is a
  material escalation, not a default. Confirmed by reading the shipped client copy.
- **Living individuals are handled correctly.** The Maloofs "agree to sell"; Hansen and Ballmer
  "plan to move the club"; Ranadivé leads a rival bid; Brad Stevens' Boston trades are described by
  their reported terms. No characterization, no mockery, no attribution of motive. This matches the
  `SR` sheet's discipline and should be preserved verbatim through any repair of `A2`/`A4`.
- **The build's decision not to name the Sacramento mayor is correct and should be deliberately
  ledgered, not "restored."** `SR-8` names Kevin Johnson and cites the "real mayor's underdog
  coalition" as part of the anchor's strength. The shipped copy says only "Sacramento's mayor."
  For a grades 5-6 product, naming him imports a well-documented misconduct record that is
  irrelevant to the economics and unmanageable in a classroom. The economics survive intact
  without the name. Recommend this departure from the anchor sheet be recorded so a future
  reality-enrichment pass does not read the omission as a gap and add him back.
- **The `A4` public-subsidy repair introduces no new rights exposure.** The $255M contribution,
  the 2015 bond issue and the payment schedule are public municipal record and were reported
  contemporaneously.
- **The 2016-17 leaked financials (`A5`) are cited as ESPN's reporting, never as a document.**
  Correct; preserve that framing through the stamp repair.
- **`SIMPLIFICATIONS` and `SOURCE_NOTES` are the module's rights and accuracy ledger and are
  reachable from `/play` synthesis.** That is the right place for them. Every repair above should
  land a matching ledger line rather than only a copy change.

---

## recommendation

**CLEAR WITH REPAIRS.**

The lesson's real-world spine is sound. The Kings capstone is factually correct in every rendered
claim, is genuinely presented as debatable rather than as an answer key, and is the right anchor for
this beat; the revenue-sharing and tax institution content is structurally faithful to the real NBA
system and, in its `SIMPLIFICATIONS` ledger, more honest about its own departures than most shipped
educational material; `C-1` is closed and not recurring; the fandom test passes; no rights issue
requires escalation.

Two repairs are **gate-blocking before classroom use**:

- **`A1`** — the false supermajority rule. It is in my blocking category (economic-truth): the
  finale teaches an NBA institutional rule that does not exist, on the card whose subject is
  institutional design, and uses it to justify the room's own adoption threshold. The verified
  replacement (relocation = majority, 16 of 30; expansion = 23 of 30) is stronger than the claim it
  removes and folds in `S1`.
- **`A2`** — the missing term sheets. `/teach` instructs a random competent teacher to have the room
  read numbers that no surface renders. This fails the random-teacher standard at the module's most
  reality-loaded beat and leaves the capstone quantitatively empty. The figures ($625M / $409M for
  65% versus $534M) are verified and ready.

Recommended in the same pass, in order of value: **`A3`** (universal-quantifier magnitude claim,
contradicted by the module's own printed Knicks figure — a `C-2` recurrence `BC-3` required
re-derived), **`A4`** (the ~$255M that actually decided the vote the class casts, which also repairs
the `subsidy-coda` card's contradiction), **`A5`** (one-phrase `BC-3` stamp), **`A6`** (prior-knowledge
handling), **`A7`** (the unsupported "real league scale" claim), **`A8`** (revenue-sharing labeling
precision). **`A9`** is optional.

`S1` additionally carries a scheduling recommendation independent of any repair: the NBA expansion
determination was expected before the end of 2026 and can land mid-school-year. Write the epilogue
to absorb the result rather than be broken by it, and put the last `SOURCE_NOTES` line on a named
term-start re-check.

**Formal dissent:** none recorded at this gate. To be recorded if the module advances to classroom
readiness with `A1` unrepaired — a false institutional rule taught as the justification for the
room's own constitution is not a copy blemish, and CLAUDE.md §8 is explicit that a fun simulation
teaching false economics fails.
