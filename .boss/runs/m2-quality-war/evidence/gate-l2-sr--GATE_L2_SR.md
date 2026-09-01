# Gate L2 — Sports Reality · Module 2 Lesson 2 "You Don't Play Alone"

Role: Sports Reality Director · Assignment `gate-l2-sr` · Boss run `m2-quality-war`
Target: `runtime/src/modules/hostTheLeague.ts` + L2 client copy
(`runtime/src/client/{play,board,teach}/main.ts`) + `runtime/README.md` derivation.
Reviewed 2026-09-01. All web checks carry `verifiedAsOf: 2026-09-01`.
Evidence ids: `SR-1`…`SR-15` = `SPORTS_REALITY_INPUT.md`; `C-2`/`C-4` =
`SELECTION_SR_REVIEW.md`; `BC-3`/`BC-5` = `ARCHITECTURE_SELECTION.md`;
`R1`…`R11` = `DESIGN_C_FIRSTPRINCIPLES.md`.

**Two BLOCKING findings.** Both are false statements printed on student and
projector surfaces, both are falsifiable by the room's own data during the
lesson, and neither is covered by any disclosure the build ships. Everything
the builder ledgered as *dated real content* checks out — the fact set is in
good order. The failures are in how real content was **generalized across real
clubs**, and in two **universal quantifier claims** the shipped constants do
not support.

---

## real-world-anchors

Fifteen SR anchors were available; the build operates or narrates six. Ruling on
each, then on the cuts.

| Anchor | Status in build | Ruling |
| --- | --- | --- |
| SR-1 four real markets | Operated. `MARKET_PROFILES` = Knicks / Warriors / Thunder / Grizzlies, 20 real clubs on real buildings and capacities | Used, but see BLOCKING-1 and MODERATE-3 |
| SR-2 $76B national deal | Operated as `NATIONAL = 950_000`, plus `PIPES_REVEAL_COPY` | Accurate, dated, correctly operated |
| SR-4 Lakers/Grizzlies 15:1 | Narrated: `HOOK_REAL_LINE`, `SOURCE_NOTES[0]` | Accurate, dated, correctly framed as one leaked year |
| SR-6 Fever / arena moves | Narrated: `FEVER_REVEAL_COPY`, `SOURCE_NOTES[2]` | See "Fever ruling" below |
| SR-11 LeBron 2010/2014 | Operated as the week-2 star departure; `SHOCK_REVEAL_COPY` | Accurate, dated, genuinely operated |
| SR-12 Warriors / Chase Center | Reduced to `WARRIORS_LINE` | Reduction acceptable in itself, but it is the proximate cause of BLOCKING-1's worst instance |
| SR-15 Luka / Harrison | Narrated: `ARGUE_COPY` | Accurate, dated, neutral tone as SR-15 required |
| SR-3 cap bridge | Narrated: `M1_BRIDGE_LINE` | Cap figures exact (see accuracy-findings) |

**Fever ruling (SR-6), the assignment's named question.** The anchor is
**used, accurate, dated, and half-operated** — not dropped.

- *Accurate:* Fever home average 4,066 (2023) → 17,036 (2024), best in the WNBA;
  six opposing clubs moved Fever games to larger buildings (United Center, State
  Farm Arena, TD Garden, American Airlines Center among them). Confirmed
  (observed, 2024 Fever/WNBA season records, verifiedAsOf 2026-09-01). The
  module writes 4,066; the season record is 4,067 — see MINOR-8.
- *Operated:* the mechanism SR-6 exists to teach — *your* gate is a function of
  the visiting club's Draw, which is another desk's doing — is the spine of the
  whole lesson, computed in `settleHome` and attributed exactly by the
  three-run decomposition (BC-5). This is a **stronger** delivery than SR-6's
  own suggested scripted scenario, because the demand shock is a live classmate
  rather than a canned card.
- *Not operated:* the distinctive half — clubs re-sizing their **venue** for a
  visitor — has no dial. Capacity is fixed per club; there is no move-buildings
  decision. That half is narration only.
- *Cheap repair, not a blocker:* `HomeSettlement.turnedAway` already exists and
  is already computed. A desk that sells out and turns people away has lived the
  exact pressure those six clubs answered. One teacher-script prompt at the
  Fever reveal ("you turned N people away last week — six real clubs had that
  problem and moved buildings; what would you have done?") converts narration
  into the room's own experienced moment at zero model cost.

**Ruling on the ledgered cuts.**

- **SR-10 (Suns free-TV) cut — sound.** SR-10 is a price-vs-reach decision about
  a club's *own local media*. L2's economics is transmission between clubs plus
  the equal national pipe. SR-10 belongs to L1's pricing lesson or L3's
  institutions slot; its absence loses nothing L2 teaches. No dissent.
- **SR-12 (Warriors) reduced — acceptable content, harmful mechanism.**
  `WARRIORS_LINE` keeps the accurate checkable core. But the reduction turned
  the Warriors' *distinguishing* fact into a **shared profile label**
  (`sizeLabel: "BIG MARKET · OWNS THE BUILDING"`, `plainLine: "…OWNS its
  building…"`) that is then printed under the Lakers and the Heat. See
  BLOCKING-1. The fix is not to restore SR-12 at length; it is to stop
  broadcasting one club's identity sentence to a profile cohort.
- **SR-5 (Packers open books) absent — correct deferral.** `COMPLETE_COPY` hands
  the sharing rule to L3 ("this room writes the rule that decides how much of it
  gets shared"). SR-5 is L3's reveal. Preserve, do not build here.

---

## accuracy-findings

### BLOCKING-1 — One anchor club's identity sentence is printed under fifteen other real clubs

**What ships.** Each of the four `MARKET_PROFILES` carries an `anchorClub` plus a
`plainLine` and `sizeLabel` written *about that anchor club*. Twenty real clubs
are then mapped onto those four profiles, and the anchor's sentence is rendered
verbatim under every club on the profile.

Code path (observed, read this session):
`profileFacts()` / `studentView` LOBBY + HOOK emit `plainLine` →
`play/main.ts:2462` and `play/main.ts:2611` render it directly beneath the
desk's real club name and real building. `clubCard()` emits `sizeLabel` →
`board/main.ts:1303` (per-club projector chip), `play/main.ts:2584` (slate row),
`teach/main.ts:1085`.

What a desk therefore reads about its own real club:

| Real club shown | Sentence printed under it | True? |
| --- | --- | --- |
| Boston Celtics, Philadelphia 76ers, Chicago Bulls, Detroit Pistons | "The biggest market in American sports, and the league's biggest gate." | **False.** New York is (Knicks gate receipts $193M in 2024-25, a franchise record and the league's largest; observed, Statista/Sportico, verifiedAsOf 2026-09-01) |
| Denver Nuggets, Sacramento Kings, Utah Jazz, Portland Trail Blazers | "One of the league's smallest markets — and the 2025 champions." | **False.** Oklahoma City beat Indiana 4-3 in the 2025 Finals, SGA Finals MVP (observed, 2025 NBA Finals record, verifiedAsOf 2026-09-01) |
| Los Angeles Lakers, Miami Heat | "A big market that OWNS its building, so it keeps the concert money too." + chip "BIG MARKET · OWNS THE BUILDING" | **False for the Lakers** (observed): AEG owns and operates Crypto.com Arena; the Lakers are tenants on a lease running through 2041. Miami: Kaseya Center is county-owned with the Heat as operator — *inferred, not independently verified this session*; treat as suspect, not proven |
| Toronto Raptors | same "OWNS THE BUILDING" | Defensible — MLSE owns both club and Scotiabank Arena (inferred) |
| Milwaukee, Indiana, New Orleans, Cleveland, Orlando | "A small, lean market. Fewer people, and price matters more here." | Generic enough to stand. No finding |

**Reach.** `CLUBS` slots map to desks in join order (slot 0 = Desk 1),
`MIN_LEAGUE = 6`, `MAX_DESKS = 18`. Desk 6 = Boston, Desk 8 = Lakers, Desk 9 =
Denver. **Any class of nine or more desks hits at least three false lines**, and
they land on the private `/play` screen where the desk spends the whole lesson.

**Why no existing disclosure covers this.** `BOARD_HONESTY_LINE` discloses that
clubs sharing a market size share the same *demand curve* — a modeling choice
that is defensible and well argued in `SIMPLIFICATIONS[0]`. It does not disclose,
and cannot license, printing a *factual assertion about a named real club* under
a different named real club. Sharing a curve is a model. "Detroit is the biggest
market in American sports" is a claim about the world, and it is wrong. Further,
`BOARD_HONESTY_LINE` renders only on `/board`; the `/play` LOBBY screen shows
`plainLine` with no disclaimer of any kind adjacent to it.

**Interaction with the fandom test — the harm is inverted.** CLAUDE.md §3
requires that a student who knows little basketball still succeeds. That student
is precisely the one with no defense against "Detroit is the biggest market in
American sports": they will absorb it as fact. The build's accessibility
achievement (see fandom test below) makes this defect *worse*, not milder.

**Repair (shape only, not implementation).** Separate the profile's *economics
label* from the club's *identity sentence*. The profile may keep a neutral size
band ("BIG MARKET", "SMALL MARKET"); anything club-specific — biggest gate,
2025 champions, owns its building — must be a per-club field, present only where
true, absent elsewhere. Four verified anchor clubs keep their sentence; the other
sixteen get the neutral band or nothing.

### BLOCKING-2 — `MODELED_DOLLARS_LINE` makes two universal claims the shipped constants falsify in week 1

The line is student- and projector-facing (emitted at `hostTheLeague.ts:1609`,
`:1666`, `:1860`; rendered `board/main.ts:907`):

> "…gate money is about a fifth to a quarter of a club's revenue, and the
> national check is the biggest single pipe for every club in this league."

Both clauses are stated as universals. Both are false at reachable states, and
the board renders the per-desk pipe bar (`HLPipe` carries `gate`, `inArena`,
`localMedia`, `national`; `board/main.ts:1393`) directly beside the caption, so
**a desk can see its own bar contradict the sentence above it.**

*Clause 2, "national is the biggest single pipe for every club."*
`localMediaFor = localBase + 12_000 × (draw − 10)`. Setting that equal to
`NATIONAL = 950_000` gives the Draw at which local media overtakes national:

| Profile | `localBase` | Draw at which local > national | Clubs starting above it |
| --- | --- | --- | --- |
| new-york | 470,000 | **50** | Boston (`startDraw` 55) |
| golden-state | 420,000 | **54** | L.A. Lakers (68) |
| oklahoma-city | 150,000 | 77 | reachable by week 3 from OKC (71), Utah (65) |
| memphis | 110,000 | 80 | not reachable in three weeks |

Desk 6 (Boston, local $1.01M vs national $950K) and Desk 8 (Lakers, local
$1.12M vs national $950K) falsify the caption **before the first price is set**,
with no student action required. The claim also fails at season aggregate
(Lakers ≈ $3.48M local across three weeks vs $2.85M national).

*Clause 1, "gate is about a fifth to a quarter of revenue."* True only near the
house price. Recomputed from the shipped constants at neutral Draw 40/40, New
York: at $56 gate share is 25.0%; **at $120 it is 8.1%; at $10 it is 8.4%.** The
price dial spans $10–$120 by design (R6 wants a symmetric regret parabola), so
most of the reachable dial puts gate share far outside the stated band.

This is the more damaging of the two blockers pedagogically: the caption is the
module's honesty apparatus, and it is the sentence a sharp student can disprove
with the projector in front of them. Repair is copy-only — quantify honestly
("for most clubs here, most weeks" / "at a typical price"), or drop the
universals and let the bars speak.

### MODERATE-3 — The SR-1 fidelity claim C-2 was raised to enforce is not delivered by the build

Both the module header (`hostTheLeague.ts:64`) and `runtime/README.md:305-307`
assert that the re-derivation restores SR-1: *"New York has the league's highest
gate at every comparable matchup, which C's printed table violated."*

The shipped constants do not deliver it. In `settleHome`, `wantedAt()` depends
only on the **profile** constants, price and the two Draws — it is
capacity-independent — and `turnout = min(capacity, wanted)`, `gate = price ×
turnout`. Four clubs share New York's exact profile with **larger buildings**:

| Club (new-york profile) | Capacity |
| --- | --- |
| Chicago Bulls · United Center | 20,917 |
| Philadelphia 76ers · Xfinity Mobile Arena | 20,478 |
| Detroit Pistons · Little Caesars Arena | 20,332 |
| **New York Knicks · Madison Square Garden** | **19,812** |

On any sold-out week at equal price, Chicago's gate strictly exceeds New York's.
Sell-outs are not an edge case — R8 requires every building to reach a full house
at some legal price, and at $10 with neutral Draws the new-york profile already
wants 19,470, crossing every one of these capacities as Draws rise. In reality
the Knicks out-gate the Bulls by a wide margin (on price, not seats). The build
reproduces C-2's original defect in a new form. Note this is a *claim* defect,
not necessarily a constants defect: either tighten the claim, or give New York a
demand edge that survives the clamp.

### MODERATE-4 — The module header's gate shares contradict the README and are not reproducible

The two published locations of the C-2 re-derivation disagree:

| Source | New York | Memphis | NY weekly revenue |
| --- | --- | --- | --- |
| `hostTheLeague.ts:57-60` | 23.7% | **22.7%** | ~$2.79M |
| `runtime/README.md:305-307` | 24.8% | **18.9%** | ~$2.66M |

Recomputed independently from the shipped constants at neutral Draw 40/40, each
profile at its own `housePrice`:

- **New York @ $56:** wanted 11,880 · gate $665,280 · in-arena $213,840 ·
  local media $830,000 · national $950,000 → total **$2,659,120**, gate
  **25.0%**, national **35.7%**.
- **Memphis @ $44:** wanted 8,020 · gate $352,880 · in-arena $96,240 · local
  media $470,000 · national $950,000 → total **$1,869,120**, gate **18.9%**,
  national **50.8%**.

**The README reproduces; the module header does not.** Memphis is 18.9%, not
22.7%, and NY's weekly revenue is $2.66M, not $2.79M. The header is the file a
future builder reads first, and it carries the wrong numbers for the derivation
that exists specifically to answer C-2.

### MODERATE-5 — The 2026 Knicks title leaves the module's anti-"money buys wins" antidote running against the freshest real result

New York won the 2026 NBA Finals 4-1 over San Antonio, its first title since
1973; Jalen Brunson unanimous Finals MVP (observed, NBA.com/ESPN/Olympics.com,
June 2026, verifiedAsOf 2026-09-01).

Nothing in the build is *false* because of this — "the 2025 champions" is still
true of Oklahoma City. But:

- `SIMPLIFICATIONS[2]` rests the whole money-does-not-buy-wins counter on "OKC is
  one of the league's smallest markets and won the 2025 title." In a 2026-27
  classroom the *most recent* champion is the biggest market in the league. A
  teacher leaning on that counter will be contradicted by the first kid who
  follows basketball, and the teacher script gives no answer.
- `startDraw` puts New York at 44 (mid-pack, below Memphis 62, OKC 71, New
  Orleans 72) and Indiana at 26, the league's lowest — Indiana having reached the
  2025 Finals. The decorrelation is deliberate and disclosed, but it now reads as
  a *wrong ranking* to any fan in the room.

The honest and stronger line is already available and is more current: the 2025
champions were one of the league's smallest markets, the 2026 champions were the
biggest — market size does not determine winning **in either direction**. That is
a better statement of the module's actual claim than the one-sided version, and
it retires the collision.

### MINOR-6 — The "~5×" shrink factor does not survive its own stated justification

Header and README both justify the factor as "the same ~5× this product shrinks
ticket prices." Modeled house prices are $44–$56; ×5 gives $220–$280, well above
real NBA average ticket prices (order $90–$130). The factor is fine; the
*justification* is not. It is well supported by the revenue route instead: real
national is ~$5.6M per club per week ($6.909B ÷ 30 ÷ 41) against the modeled
$950,000 — a 5.9× shrink. Re-label the derivation; do not change the number.

### MINOR-7 — The header's national-media chain silently drops from "$200M+" to $200M

$76B ÷ 11 ÷ 30 = **$230.3M** per club per year (the header's own "$200M+"
correctly describes this). The chain then divides $200M — not $230.3M — by 41,
yielding $4.9M/date and $950K after shrink. The faithful chain gives $5.62M/date
→ $1.12M. The shipped $950,000 is ~15% conservative, which is defensible (the
players' ~50% share is not netted either), but the header presents an exact
arithmetic chain that does not compute. State the conservatism instead of hiding
it in a rounding step.

### MINOR-8 — Fever 2023 figure off by one

Module and `SOURCE_NOTES[2]` say 4,066; the 2023 Indiana Fever season average is
4,067 (observed, verifiedAsOf 2026-09-01). Inherited from SR-6.

### Verified clean — no finding

Checked against the web this session, all confirmed exactly as written
(verifiedAsOf 2026-09-01):

- **Cap chain:** 2025-26 cap $154.647M (+10%, the CBA smoothing maximum);
  2026-27 $164.961M (+6.7%); tax $200.428M; aprons $209.015M / $221.686M; floor
  $148.465M (NBA.com / Spotrac / Hoops Rumors, June 2026). `M1_BRIDGE_LINE` and
  `SOURCE_NOTES[6]` are exact.
- **National deal:** ~$76B / 11 yrs / 2025-26–2035-36; Disney-ESPN ~$2.6B/yr,
  Amazon ~$1.8B/yr, NBC/Peacock (agreed July 2024). Exact.
- **Warriors:** $833M revenue 2024-25, NBA's highest; Knicks second at $620M.
  The module's "about 34% above the second-place Knicks" is the *arithmetically
  correct* reading ($833/$620 = 1.344); note that Bleacher Report's summary
  phrases this as "34 percent lower," which is wrong in the other direction. The
  build chose correctly. Chase Center ~$1.4B, privately financed, opened 2019 —
  confirmed.
- **Luka / Harrison:** trade 1-2 Feb 2025; Harrison fired 11 Nov 2025 after a
  3-8 start, the day after a "fire Nico" chant game; Dallas won the 2025 lottery
  and drafted Cooper Flagg. Exact, and the neutral tone SR-15 demanded is held.
- **Lakers/Grizzlies 15:1**, 14-of-30 unprofitable before sharing, ESPN Sep 2017
  — correctly labeled as one leaked year in both `HOOK_REAL_LINE` and
  `SOURCE_NOTES[0]`.
- **All 20 buildings and capacities** current for 2026-27, including the recent
  renames the build got right: Xfinity Mobile Arena (renamed from Wells Fargo
  Center, 2025), Rocket Arena (renamed from Rocket Mortgage FieldHouse,
  18 Feb 2025), Kia Center, Delta Center, Kaseya Center. Paycom Center remains
  the Thunder's building — the replacement arena (Continental Coliseum) is a 2029
  event, correctly not anticipated. No 2026 renames found that the build missed.
- **FedExForum 17,794** is stamped "modeled seat count · published figures range
  16,667-18,119" — an unusually honest stamp for a figure that is in fact a
  commonly listed capacity. Over-cautious, not wrong.

### Season stamps at point of use (BC-3)

Substantially met — better than any prior M2 artifact. Every real figure carries
its date **inside the sentence**, at the surface, not only in a ledger:
`PIPES_REVEAL_COPY` ("2025-26 through 2035-36"), `WARRIORS_LINE` ("in 2024-25"),
`ARGUE_COPY` ("1 and 2 February 2025", "that November", "the 2025 draft
lottery"), `M1_BRIDGE_LINE` (both cap seasons), `FEVER_REVEAL_COPY` ("in 2023…
in 2024"), `SHOCK_REVEAL_COPY` ("2010", "July 2014"), `HOOK_REAL_LINE`
("2016-17, reported by ESPN in September 2017"). Two gaps:

- **`capacityNote` reads "listed basketball capacity · 2025-26" on all 20
  clubs** — a season behind for a lesson that will first run in 2026-27, and
  internally inconsistent with `M1_BRIDGE_LINE`, which already speaks in
  2026-27. Restamp.
- **The `startDraw` disclaimer is teacher-spoken only.** `SIMPLIFICATIONS[1]`
  says "say so once, at the schedule," and the teacher script carries it
  (`hostTheLeague.ts:2252`), but nothing on `/play` or `/board` states that the
  printed Draws are modeled rather than a real ranking. Acceptable under the
  random-teacher standard only because the script does carry it; given
  MODERATE-5 it is now load-bearing and belongs on the slate itself.

### Fandom test — passes structurally, then is undermined by BLOCKING-1

A student who has never watched a game has, on screen, every input the decision
needs: their club's capacity, weekly bill, market band, the full three-week
slate, and **every club's Draw printed as a number before they touch a dial**
(`HOUSE_RULES[1]`: "Every one of those numbers is printed before you touch a
dial. There is no luck in this game."). No basketball knowledge is required to
play well, and `plainLine` is written at the right register. This is the build's
strongest sports-reality achievement and it should be preserved exactly.

The qualification is BLOCKING-1: the non-fan cannot detect that the sentence
under their club is about a different club. Accessibility without accuracy
converts the design's best property into an efficient delivery mechanism for
false facts. Fix BLOCKING-1 and the fandom test is clean.

---

## staleness-findings

- **NBA expansion is the module's largest structural exposure.** The Board of
  Governors voted in March 2026 to **explore** bids in Las Vegas and Seattle
  only; entry point discussed as 2028-29; bids reported at $7-10B; a further
  vote is possible later in 2026 (observed, ESPN/NBA.com/Al Jazeera, March 2026,
  verifiedAsOf 2026-09-01). **No franchise has been granted — 30 clubs is
  correct today.** But `NATIONAL = 950_000` is derived from a 30-club divisor and
  `SOURCE_NOTES[1]` says "split across 30 clubs." A 32-club league changes the
  per-club national share by ~6%. This is the one number in the lesson that a
  news cycle can invalidate; treat a grant as a scheduled content patch.
- **The Fever anchor stops at 2024, and the more current data is stronger.**
  2023: 4,067 · 2024: 17,036 · 2025: 16,560 · 2026: 15,956 through 13 home dates
  (observed, verifiedAsOf 2026-09-01). The jump **held** across three seasons.
  As shipped, a student can say "that was two years ago" and the copy has no
  answer; naming the persistence both refutes that and upgrades the anchor from
  "a spike happened" to "a demand shock became the new level" — which is the
  better economics and is what the lesson actually models (Draw persists and
  decays, it does not spike and vanish).
- **The 2026 Knicks championship** (June 2026) is the most significant unabsorbed
  event. Handled under MODERATE-5 because it is a live-classroom credibility
  issue, not only a dating issue.
- **Warriors $833M / Knicks $620M is 2024-25 and correctly stamped.** Sportico
  projected league revenue of $14.3B for 2025-26; a refreshed team-revenue list
  publishes around Feb 2027. The stamp makes this safe to leave.
- **Cap figures age every late June.** The build already ships them as a dated
  *pair* (+10% then +6.7%), which is the staleness-resistant form. Keep the pair
  shape; refresh in June 2027.
- **Staleness-safe anchors** — LeBron 2010/2014, Chase Center 2019, the 2016-17
  leaked financials (explicitly framed as one historical year), the 2024 Fever
  season — are correctly the load-bearing ones. Good structural choice.

---

## rights-source-considerations

Material flags only. No legal conclusions, and nothing here argues for
fictionalizing.

- **Marks and likenesses: clean.** `SOURCE_NOTES[7]` commits to typographic
  wordmarks only — no logos, marks, photographs or likenesses — and the client
  code I read renders clubs as text throughout, with no club image assets. This
  matches the SR-input posture and needs no escalation.
- **Names and reported facts** (salaries, attendance, votes, revenue, a firing)
  are used as facts, the same category already shipped in M1 and the
  founder-mandated direction. No new exposure.
- **Leaked 2016-17 financials** are cited as *ESPN's September 2017 reporting*,
  not presented as a document asset — the discipline SR-4 asked for, correctly
  applied in both `HOOK_REAL_LINE` and `SOURCE_NOTES[0]`.
- **Nico Harrison** appears in `ARGUE_COPY` as "the general manager who made the
  trade," with reported facts and no characterization or mockery — exactly the
  SR-15 tone requirement, met.
- **Inconsistency worth a decision, not a legal flag:** Caitlin Clark is **not
  named anywhere in the lesson**. `FEVER_REVEAL_COPY` says "because of who was
  visiting" without saying who. LeBron James, Luka Dončić and Cooper Flagg are
  all named in the same file on the same category of published fact. If the
  omission is deliberate rights caution it is applied inconsistently and buys
  nothing the other three do not already cost; if it is accidental it removes
  SR-6's single strongest accessibility asset — the player this age group is
  most likely to know, and pointedly the one that reaches the girls in the room.
  Naming her alongside published attendance figures is the same act as naming
  LeBron alongside 2010/2014. Founder call, not mine; flagging because the copy's
  own posture is currently self-contradictory.
- **No proprietary datasets** are relied on; demand curves are modeled and
  labeled modeled (`BOARD_HONESTY_LINE`), per SR-1's requirement. No resale-price
  feeds ingested. Clean.
- **No betting-adjacent sourcing** in any product copy. Clean.

---

## recommendation

**CLEAR WITH REPAIRS.**

Not BLOCKED: the fact set is genuinely sound. Every dated real claim the builder
shipped survived independent verification — the cap chain to three decimals, the
$76B deal, the Warriors/Knicks revenue pair (with the arithmetic direction
chosen more carefully than the secondary source), the Luka/Harrison sequence,
all twenty buildings and capacities including two recent renames. The pipe
re-derivation's *economic substance* is sound and conservative: national media
really is the largest single pipe for a typical club under the new deal (Knicks
~$230M national vs $193M gate vs ~$620M total), the modeled small-market national
share of 51% understates a real figure nearer 65-70%, and the honest-labeling
apparatus (`BOARD_HONESTY_LINE`, `MODELED_DOLLARS_LINE`, `HORIZON_LINE`, the
nine-entry `SIMPLIFICATIONS` ledger) is the most disciplined this run has
produced. The Fever anchor was not lost; its core mechanism is operated more
strongly than SR-6 proposed.

Not CLEAR: two false statements reach students and the projector, and both are
falsifiable inside the lesson.

Required before classroom readiness, in order:

1. **BLOCKING-1** — stop printing an anchor club's identity sentence under
   other real clubs. Split the profile's economics label from per-club identity;
   club-specific claims appear only where true. Highest priority: it is the most
   frequent, it lands on the private screen, and the non-fan cannot defend
   against it.
2. **BLOCKING-2** — remove the universal quantifiers from
   `MODELED_DOLLARS_LINE`. Both clauses are contradicted by desks' own printed
   bars, one of them in week 1 with no student action required. Copy-only fix.
3. **MODERATE-3** — either retract the "New York has the league's highest gate at
   every comparable matchup" claim in the header and README, or give New York a
   demand edge that survives the capacity clamp against Chicago, Philadelphia and
   Detroit. As shipped, the C-2 repair does not do what it says.
4. **MODERATE-4** — reconcile the header's gate shares to the README's (Memphis
   18.9%, not 22.7%; NY revenue $2.66M, not $2.79M). The README is the
   reproducible one.
5. **MODERATE-5** — absorb the 2026 Knicks title into the money-does-not-buy-wins
   counter, in both directions, and move the `startDraw` "not a ranking"
   disclaimer onto the slate.
6. **MINOR-6/7/8** and the `capacityNote` restamp to 2026-27 — cheap, do them in
   the same pass.

Recommended, not required: convert the Fever anchor's narrated half into an
operated moment via the existing `turnedAway` field; extend the Fever line
through 2025-26 so the shock is shown to have *held*; resolve the Caitlin Clark
naming inconsistency.

**Formal dissent:** none recorded. The blocking findings are defects with
identified repairs, not disagreements about direction.

**Open item for Economic Truth:** BLOCKING-2's clause 2 is as much an economics
claim as a copy claim — whether "national is the biggest pipe" *should* be the
lesson's headline given that the reinvest dial is designed to grow the local pipe
past it. If a desk's whole successful strategy is to make national *not* be its
biggest pipe, the caption may be fighting the mechanic rather than describing it.
That is a mechanism question, not a fact question, and belongs to that review.
