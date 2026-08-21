# Module 1 Refounded — "The Cap: Building a Team Under Scarcity"

**Role:** Sonnet B, Refounder. Same soul as the strongest legacy Module 1 code (`T101-M1-L1`, `T101-M1-L2`), radically rebuilt against the product bar and the critique's specific failures: decisions not consequential enough, no counterfactual comparison, weak debrief evidence, no continuity.

## The pitch

One student, one General Manager, one roster — carried across all three lessons. GM is the right role here on purpose: the salary cap is a *rule imposed on the GM specifically*, so the GM is the seat where the economics of scarcity is unavoidable. Lesson 1 puts identical players and an identical budget in front of every student, but silently assigns different cap **regimes** — and the reveal shows that the same choices are legal, expensive, or impossible depending only on the rule, not the player. Lesson 2 turns "luxury tax" from a bracket table into a slider a student drags while a live meter splits Base vs Tax cost in real time, against a rival bid they can't see the exact number of. Lesson 3 shows students arriving already partly cap-jailed by their own Lesson 1–2 choices, blocks one move outright, and closes with the module's single strongest artifact: a whole-class scatter of Wins vs. Flexibility Remaining that makes "spending away your own future options" visible as one picture, not a moral.

## Legacy: what survives, what dies

| Piece | Verdict | One-line reason |
|---|---|---|
| `T101-M1-L2` real-time tax-line meter (Cap Space bar, dashed threshold, Base/Tax split) | **Survives**, extended | Best existing "feel a dollar get expensive" implementation in the portfolio; matches the critique's own desired experience almost exactly. |
| `T101-M1-L2` `simulation.js` pure logic / deterministic `projectChain` pattern | **Survives** | Deterministic, replayable state is exactly what makes instant counterfactual replay (this design's core fix) cheap to compute. |
| `T101-M1-L1` open, budget-constrained draft from a real player market | **Survives**, re-centered | Closest existing thing to genuine constrained allocation; kept as the entire mechanic of Lesson 1, not a warm-up to it. |
| `T101-M1-L1` "Owner's Curveball" mid-game shock pattern | **Survives**, repurposed | The *shape* of a shock event is kept, but it's now the mechanism that manufactures path dependence into L2/L3, not a bolted-on one-off. |
| "Grading never blocks completion" (both repos) | **Survives verbatim** | Directly matches the no-gamification-currency mandate; nothing to improve. |
| `101-M2-L2`'s `ROUND2[state.r1]` branch-by-prior-choice pattern (portfolio reference, not M1 code) | **Survives**, scaled up | Model for how L1's regime choice and L2's spend determine what's even possible in L3. |
| `T101-M1-L1` "GM Style" presets (Win Now/Balanced/Smart Spender) that pre-set budget *and* 1.6× grade weighting | **Dies** | Pre-scripts which outcome is "good" before the student sees the market — mutes the open-endedness the critique demands; replaced by one shared budget per regime, priorities left fully emergent from the student's own picks. |
| `T101-M1-L1` GM Score / rank tiers (Hall of Fame → Rookie) | **Dies** | Leaderboard-flavored tiering with no counterfactual meaning; replaced by comparison charts, not ranks. |
| `T101-M1-L2` fixed-menu trade cards (Star Chaser/Balanced/Future/Safe, pre-authored deltas) | **Dies as the decision mechanic** | Four canned outcomes is decorative choice, not pricing under uncertainty; the archetype *labels* survive only as post-hoc flavor tags on an open offer-sizing decision. |
| `T101-M1-L2` newspaper "Front Page" as the sole debrief artifact | **Dies as debrief, survives as flavor** | One personal headline isn't class evidence; kept only as color inside the real debrief artifact (the class board). |
| `T101-M1-L1` claim code / "file memo to unlock code" gate | **Dies** | Completion credentialing is gamification-currency-adjacent (CEO D4); completion is just completion. |

## Module arc

1. **L1 — Draft Day: Building Under the Line.** Build a roster under an assigned cap regime.
2. **L2 — The Deadline: What One More Star Costs.** Same roster faces a live tax-bracket pricing decision at the trade deadline.
3. **L3 — Cap Jail: When Money Isn't the Problem, Flexibility Is.** Same roster, now facing a second, harder threshold that locks tools instead of costing dollars; class-wide synthesis reveal.

**Continuity mechanism (cheap, kept):** each student's roster + cumulative spend is one small state object that resumes automatically if the same device is used, or re-enters via a short printable "GM Card" code if not. L3 opens by re-showing a student their own L1+L2 history before they make a single new choice — so a student can literally point at *why* a tool is already locked. If a save is missing (shared cart, cleared cache), the lesson falls back to a class-median "starter roster" in one click — no teacher debugging required.

---

## Lesson 1 — Draft Day: Building Under the Line

**Economic system.** One player market (~18 real-flavored players, cost + win-value + fit tag), one budget number, identical for the whole class. The class is pre-split by seat into three groups, each silently assigned a different **cap regime** for that same budget: Hard Cap (an absolute wall), Soft Cap (one "exception" token lets you exceed it once, at a cost), No Cap + Tax (unlimited spending, but every dollar over budget drains a separate Patience meter).

**Consequential decisions.** BUILD (draft against a fixed budget), ALLOCATE (spend across positions/fit), COMPARE (see own roster instantly re-priced under a regime you didn't get).

**What becomes visible.** The same click on the same player produces three different outcomes depending only on the assigned rule: under Hard Cap it visibly greys out the instant it would break the wall; under Soft Cap it's purchasable but visibly burns the one exception icon; under No Cap+Tax it's always purchasable but the Patience meter visibly drops, faster the further over budget you go. Rule → legal moves → who you can afford is seen happening, not explained afterward.

**Honest uncertainty.** Each player's win-value is shown as a small floor–ceiling range, not one number (light injury/development uncertainty). The bigger, more honest uncertainty this lesson teaches is institutional: a student does not know until the reveal whether the regime they were handed helped or hurt them relative to a classmate with the identical budget and market.

**Class-evidence artifact.** A read-only "Draft Day Board" the teacher projects, one row per student as they lock in: Regime | Wins | Cap Used | Legal moves used. Grouped by regime it reads as three strip-plots side by side — visible spread within each rule, visible overlap or gap between rules.

**Teacher operation (45 min).**
- 0–5: Hook, projected: "Same budget, same players — does the RULE change who wins?" Regimes are pre-assigned by seat; teacher just states which rows are which.
- 5–8: Short framing narration on what a cap regime is.
- 8–28: Independent build time; teacher circulates while the Board fills in live.
- 28–33: FREEZE. Teacher points at the projected Board's visible pattern (e.g. narrowest spread under Hard Cap, widest under No Cap+Tax).
- 33–40 (**reveal moment, strongest of the lesson**): teacher picks 2–3 volunteered rosters and clicks "Show Counterfactual" — each roster is instantly re-priced under the *other* two regimes with no rebuild, showing exactly what would have been illegal or what it would have cost. A student's own picks get stress-tested live against rules they didn't choose.
- 40–45: Debrief prompts: "Would you rather have kept your rule or picked it yourself? Why does a whole league play under one shared rule instead of everyone picking their own?"

**Device/interaction shape.** One Chromebook per student, fully independent — "another participant" is simulated by regime assignment, not real peers. The only shared surface is the projector's read-only Board (students write once on lock-in; nobody reads or is changed by another student's device). This is aggregation, not multiplayer: no student's choice alters another student's economic system in real time, so synchronous play isn't needed.

**Failure modes / 30-second rescues.**
- Confused why a player greyed out → an always-on tooltip already reads "Over the cap by $X — remove someone first"; teacher just points at it.
- Empty/lazy roster to finish fast → lock-in requires a minimum roster size, so the Board can't fill with junk data; point at the counter.
- Meltdown comparing Wins across regimes mid-build → scripted line ready: "different rule, not a fair fight yet — that's exactly what we check in five minutes," redirects to the lesson's point.

---

## Lesson 2 — The Deadline: What One More Star Costs

**Economic system.** Same roster and regime carried from L1. A deadline market opens with one specific upgrade target. Spending now has two zones: under a tax line, sticker price; over it, every additional dollar of *this* offer costs double. A simulated rival team is bidding on the same player with a hidden number inside a shown range (e.g. "rivals are offering $8–14M").

**Consequential decisions.** PRICE (drag a continuous offer size, not pick from a menu), BID (commit against the unseen rival), FORECAST ("will this tip me into the tax — will it beat the rival?"), REVISE (adjust before locking).

**What becomes visible.** One slider is causally wired to three live readouts at once: a Base+Tax cost ticker, a plain-language "beat the rival?" range gauge, and — for students carrying an L1 shock or a strained regime — their remaining Patience/exception resource draining further. A Hard Cap student physically cannot drag the slider past their wall; a No Cap+Tax student can drag arbitrarily far and watch Patience fall.

**Honest uncertainty.** The rival's real number is genuinely hidden until lock — students commit without knowing it, then see it. No probability language required; the lesson is simply "you don't know exactly what the other team will pay."

**Class-evidence artifact.** A "Deadline Board": one bar per student showing their final offer relative to the actual rival bid, color-coded won/lost/won-but-overpaid, with the tax line marked. It directly surfaces the critique's own target debrief question — how many students stopped just under the threshold vs. pushed through, and what happened to each group.

**Teacher operation (45 min).**
- 0–4: 30-second recap of the projected L1 Board — "this is the roster you're walking in with."
- 4–9: Frame the target player and the rival-bid mechanic in one line.
- 9–28: Students set, revise, and lock one offer.
- 28–30: Announced buzzer — all offers freeze simultaneously; rival bids reveal.
- 30–38 (**reveal moment, strongest of the lesson**): teacher opens the Deadline Board; the whole class sees at once who won cheap, who overpaid into the tax for nothing, and who lowballed and lost the player — all on one screen.
- 38–45: Debrief: "why did some of you stop right under the line — smart or scared?" cross-referenced against L1 regime.

**Device/interaction shape.** Individual devices; rival bid is a simulated counterparty, not a live peer — a real multi-student bidding war can't be brokered by one teacher solo in 45 minutes and isn't needed to teach the pricing mechanic. Shared board stays read-only aggregation.

**Failure modes / 30-second rescues.**
- Accidental max-drag lock → a confirm step ("Lock this offer? You'll pay $X in tax") prevents most accidents; if it still happens, reframe as real data for the Board, not a failure — no redo needed.
- Confusion at a Hard Cap wall stopping the slider → fixed tooltip: "Hard Cap: this is the absolute limit."
- Fast finisher idle → optional self-serve stretch: run the offer again below the line and compare their own two numbers, bringing a personal counterfactual to the debrief.

---

## Lesson 3 — Cap Jail: When Money Isn't the Problem, Flexibility Is

**Economic system.** Same roster/spend history from L1+L2. A second, higher threshold (the "apron," simplified to one clear line, not the NBA's multi-tier real version) locks one of three visible flexibility tokens (Trade Exception, Sign-and-Trade, Protected Pick) permanently the moment it's crossed — a hard "you no longer can," not more bracket math.

**Consequential decisions.** NEGOTIATE (attempt one specific roster move that may require a token), REVISE (re-plan with only remaining tools if blocked), DEFEND (one or two sentences justifying the final state), COMPARE/RANK at the closing reveal.

**What becomes visible.** The lesson opens by re-showing a student their own L1+L2 spend line against the apron — some arrive already partly locked before doing anything new today, a stark and traceable consequence of earlier choices. Attempting the one move either succeeds cleanly or is blocked with a message naming the exact prior action responsible ("blocked — you crossed the apron in Lesson 2").

**Honest uncertainty.** A short simulated "Next Season" look — not full Monte Carlo, just 2–3 simulated outcomes shown as ranges — compares a flexible-toolbox path against a locked-toolbox path holding the *same* current win total, showing two equally good-looking teams can face different odds next year for reasons invisible in today's win column.

**Class-evidence artifact.** The module's capstone: one projected scatter, x-axis Wins, y-axis Flexibility Remaining, one dot per student, shaded by which tokens got locked. The natural finding students can point to themselves: some high-win students are also fully cap-jailed; some modest-win students kept every option. This single picture is the continuity payoff of the whole three-lesson arc.

**Teacher operation (45 min).**
- 0–5: Cold open on the scatter-so-far, pre-populated from L1+L2 data. "Some of you already have locked tools before today starts."
- 5–10: Short apron/toolbox framing.
- 10–15: Each student attempts their one move; immediate succeed/blocked feedback.
- 15–25: Blocked students revise with remaining tools; students who succeeded get the optional stretch of trying the move that *would* have needed a locked token, to see the block explicitly.
- 25–30: DEFEND — one or two sentences submitted to the board.
- 30–38 (**reveal moment, strongest of the whole module**): teacher projects the full Wins-vs-Flexibility scatter plus the Next-Season range comparison for 2–3 volunteered dots.
- 38–45: Closing debate straight off the scatter: "Should the league even have an apron? Is it fair that spending removes options, not just raises cost?" — lands directly on "why the cap exists as an institution."

**Device/interaction shape.** Individual devices; shared read-only board for both the opening recap and the closing scatter. No realtime peer economic interaction anywhere in Module 1 — deliberate, since no other student's choice needs to change a given student's cap situation for scarcity, thresholds, and path dependence to be fully real.

**Failure modes / 30-second rescues.**
- Doesn't remember why they're already locked → an always-visible "Why am I here?" link plays back the exact L1/L2 decision that caused it, self-serve, no teacher needed.
- Continuity save missing (shared cart, cleared storage) → one-click "use a starter roster" fallback at class-median state; no live debugging required.
- Repeatedly re-attempting a blocked move → capped at two tries with "permanently locked this season"; teacher script ready: "that's the lesson — it's not coming back."

---

## Risks and open questions

- **Regime assignment feels arbitrary to a 10-year-old** ("why do they get the easy rule") unless explicitly framed as mirroring real leagues, where nobody picks their own cap rule either — needs to be said out loud in the L1 hook, not left implicit.
- **Continuity is the single biggest fragility.** A real Chromebook cart means shared devices, cleared caches, absent students. The L3 fallback (class-median starter roster) must be treated as core infrastructure, not an edge case, given three separate class periods likely on different days.
- **Rival-bid range calibration (L2)** is unproven on paper: too wide feels like bad luck rather than economics; too narrow becomes a solved puzzle. Needs real classroom piloting to tune, not just design intent.
- **L3's apron/toolbox is a deliberate simplification** of the real (much more restrictive) NBA second-apron rules, traded for age-appropriate legibility — a sports-savvy sixth grader who knows the real rule may notice, and a one-line teacher note flagging the simplification is worth adding.
- **Lock-time discipline.** Both the L2 and L3 reveals only work if the whole class has locked in before the projector opens — a single straggler holds up the room. This needs an announced, hard lock-time, not "whenever everyone's done" — a facilitation risk, not a mechanic one.
- **Whether the L3 written DEFEND step earns its class-minutes** is not fully resolved here — it produces good debrief color but is the one place a student could stall writing instead of deciding; it should stay strictly optional/one-sentence, and a spoken-aloud alternative may be better than typing.
