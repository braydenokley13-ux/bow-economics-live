# Module 1 Gauntlet — Economics Prosecution

Role: Economics Prosecutor. Scope: economic truth only — false lessons, exploits, dishonest
uncertainty, incentive misalignment, hollow decisions, grade-band violations, real-world
misrepresentation. Polish and fun are out of scope.

---

## DESIGN A — Legacy

**A-1. FATAL — the "shared cap" is not shared.**
> "three tiers by chosen GM style: Win Now $140M / Balanced $130M / Smart Spender $115M"

Every student's own GM-style pick sets a different total budget before a single opportunity-cost
decision is made. A real cap is one number the whole league plays under at once; here a rational
student simply *picks* a bigger cap by choosing "Win Now." Nothing in the text prices that choice
— no stated downside attaches to the larger envelope — so it is a costless exploit, not a tradeoff.
It also poisons L3, whose entire synthesis claim depends on the class having actually shared one
cap in L1/L2, which it did not. **Structural** — fixable only by decoupling "style" (a priority
tag) from "budget" (which must be uniform), not by a copy edit.

**A-2. FATAL — the L3 "no-cap" counterfactual likely computes nothing.**
> "recomputed with the budget constraint removed from each student's own roster (no-cap world,
> using the same pool)"

A student's final Wins is a fixed property of the specific players they already own; removing the
budget label after the fact does not re-simulate what an unconstrained buyer would have bought. As
specified, the "no-cap" distribution is mathematically identical to the "cap" distribution the
class just produced — the module's single most important reveal (why the cap exists) risks
showing two identical dot-plots, which would either silently teach "the cap doesn't matter" or
require an unspecified re-simulation step the document never names. **Structural** — the document
itself admits this is math `computeMetrics()` "doesn't currently do."

**A-3. SERIOUS — narrated economics the code doesn't run.**
> "`taxNote()`'s copy says 'every extra dollar costs you roughly triple'... the underlying math...
> applies fixed deltas per trade option, not an escalating per-dollar cost"

Kids are told a marginal-cost story a flat-threshold engine doesn't compute — a direct
mechanism/narration mismatch. **Repairable** — copy-only fix, already proposed in-document.

**A-4. SERIOUS — the trade "decision" is a label, not a price.**
> "pick a trade strategy (Star Chaser / Balanced Builder / Future Planner / Safe Operator) —
> deltas apply immediately"

Four pre-authored delta bundles is choosing a name, not pricing or negotiating under uncertainty —
risking a dominant strategy and a decision that looks consequential but isn't. Design B's
independent read of the same underlying asset corroborates this exactly: "decorative choice, not
pricing under uncertainty." **Partially repairable** — Round 2's state-dependent branching adds
real stakes, but Round 1 stays canned unless the menu becomes a real slider/negotiation.

**A-5. SERIOUS — an imported grading bias.**
`gradeTeam()` is reused "near-verbatim" with no mention of the exact weighting flaw a sibling
design identifies in the same legacy function family: it "pre-scripts which outcome is 'good'
before the student sees the market." Left unmodified, this risks quietly teaching value = price
through a scored "good" outcome tied to spend. **Repairable** — strip the weighting, keep the
four-metric readout.

**A-6. MINOR — a "random" shock that is secretly deterministic.**
The proposed curveball-reweighting fix (load selection by the student's weakest metric) is never
disclosed to the student experiencing it — so the claimed causal chain is only real if the teacher
narrates it aloud during debrief; as designed, it still *feels* like blind chance.

**Verdict:** Two FATAL, structural flaws (A-1, A-2) sit directly on top of the module's two
CEO-fixed concepts — the cap as a shared institution, and demonstrating why it exists. Not
rescuable by copy edits alone.

---

## DESIGN B — Refounded

**B-1. SERIOUS (near-FATAL) — the cap is assigned to a person, not a league.**
> "each silently assigned a different cap regime for that same budget: Hard Cap... Soft Cap... No
> Cap + Tax"

A real cap is one rule the whole league plays under simultaneously. Handing three different rules
to three groups of students inside "the same league" teaches that the cap is a personal handicap
dealt to you, not a shared institution — backwards from the charter's own definition. The design's
own risk section concedes the danger ("feels arbitrary... needs to be said out loud") but treats
it as narration, not mechanism. **Repairable** if the hook explicitly frames this as "three
possible rule systems compared side by side" and never implies students share one league under
different personal rules — but unaddressed, it directly contradicts the charter concept.

**B-2. SERIOUS — the module never stages rich vs. poor.**
Every regime in L1 shares "one budget number, identical for the whole class." The charter's
named justification for a cap is competitive balance between *unequally resourced* teams — this
module never once puts a richer team against a poorer team under any rule, so it never actually
demonstrates the argument its own closing debrief claims to land ("lands directly on 'why the cap
exists as an institution'"). What it teaches well instead — that today's spending locks tomorrow's
tools — is real, but it's intertemporal opportunity cost, not competitive balance. **Structural** —
requires adding resource inequality to L1, which the current regime mechanic has no room for.

**B-3. SERIOUS — a rule revealed only after it has already been broken.**
Apron vocabulary and mechanics appear only in L3's own framing step, yet L3 opens by showing
students they arrive "already partly locked" from L1/L2 choices made before the rule was ever
named. Real cap rules are public and known in advance — that's *why* institutions work, you can
plan around a known constraint. Punishing students with a threshold they could not have seen
inverts the lesson into "the institution ambushes you." **Repairable** — disclose the apron's
existence (not necessarily its number) during L1/L2.

**B-4. MINOR — decorative L1 uncertainty.** Floor–ceiling player ranges are shown but no
resolution mechanic is specified for L1 (unlike L2's rival-bid reveal) — stated risk that may
never cash out into an actual outcome.

**B-5. MINOR — fallback breaks attribution.** When a save is missing, a "class-median starter
roster" substitutes silently, yet L3 tells that student their lock is caused by "the exact prior
action responsible" — false for anyone on the fallback path, which the design's own risk section
says will be common, not rare, given real Chromebook carts.

**B-6. MINOR — vocabulary load.** Three regimes + "apron" + three token names across three lessons
is a heavy proper-noun load for grade 5-6, even with simple math underneath.

**Verdict:** B-1 and B-2 both cut against the charter's specific "competitive balance"
justification, but both are addressable by adding a framing pass and a wealth condition — not by
rebuilding the simulation engine, unlike Design A's broken counterfactual math.

---

## DESIGN C — First Principles

**C-1. SERIOUS — "Undo Isn't Free" is undercut by an exact refund.**
> "cutting a player frees its salary exactly, dollar for dollar" — under a lesson titled "Undo
> Isn't Free"

A literal-minded 11-year-old watching the meter can reasonably conclude cutting gave every dollar
back, i.e., undoing *was* free in the currency the meter shows, unless the teacher successfully
redirects attention to the real but less visible cost (losing the player's contribution). The
design flags this itself as an open question with a proposed fix (a small dead-cap penalty).
**Repairable**, not structural.

**C-2. MINOR — an escape hatch that skips the decision it protects.** The L1 "rookie minimum"
auto-fill lets a student finish the lesson's final, most-constrained decision without making it —
self-identified in-document, mitigated only by teacher visibility, a facilitation patch.

**C-3. MINOR — the Small-Market/No-Cap condition may flatten to one roster.** $60M against five
$10M–$60M slots (minimum viable ≈ $50M) leaves as little as $10M of real discretion — an accurate
dramatization of structural disadvantage, but it risks the "different rosters from an identical
position" evidence artifact going flat for that whole sub-group.

**C-4. MINOR — injuries that target your weakest pick aren't how injuries work.** A deliberate,
honestly-undisclosed-as-random convenience for personalization, not a false claim about real
sports economics, but worth naming.

**Verdict:** No FATAL or structural flaw found. The one SERIOUS issue is a naming/framing mismatch
that already carries a proposed fix; everything else is self-acknowledged, minor, and
facilitation-level.

---

## Ranking by economic truth only

**1. Design C.** Deterministic, attributable scarcity in L1; honestly resolved hidden-information
pricing in L2; a genuinely controlled rich-vs-poor × cap-vs-no-cap experiment in L3 that directly
demonstrates the charter's own stated justification using the class's real, self-generated data.
Its flaws are self-identified, minor, and already carry proposed fixes.

**2. Design B.** Real strength in L2's honest hidden-bid pricing, undercut by two gaps specific to
this charter: a cap "regime" assigned per student rather than per league misstates what an
institutional rule is, and the module never varies wealth, so it never stages the rich-vs-poor
comparison its own debrief claims to deliver. Both are addable, not a rebuild.

**3. Design A.** The most legacy-safe build is the least economically honest as specified: L1
lets a student simply buy a bigger cap by picking a GM style, breaking the "shared institution"
premise before L2 starts, and L3's centerpiece reveal rests on a counterfactual computation that,
as written, likely cannot produce a result different from the capped world it's meant to contrast
— a probably-broken engine under the module's single most important claim.
