# DIRECTION_W2 — Experience Director wave-2 re-read (`experience-director-w2`)

> Filing note (boss-lead): the advisor ran without a write tool; this file is the advisor's
> report transcribed verbatim by the lead from the agent's final output. Nothing was edited
> beyond markdown entity clean-up. Advisor role: no blocking authority, no certification.

Sources read, in order: wave-1 direction (state.json §premium-direction), `REPAIR_W2_COMPOSITION.md`, `REPAIR_ARENA_W2.md`, `GAMEPLAY_W2.md` / `KID_A_W2.md` / `KID_B_W2.md` / `KID_C_W2.md` (ratings + failures), `fullHouse.ts` copy registries (`HOUSE_RULES` 1739–1765, `FULL_HOUSE_UI_COPY` 1776–1837, `resultHeadlineFor` 2101, `SIMPLIFICATIONS` 1932–1974, `OBJECTIVE_COPY` 1736, frontier 1474–1675), `screens-w2-repair-2/MANIFEST.md`, `lead-w2/memphis-frontier-probe.log`. I did not view any PNG. Nothing here is HUMAN-TESTED; every playtest cited is AGENT-PLAYTESTED.

## Q1 — per-state carry of the wave-1 target feelings

Tally: **CARRIED 1 · PARTLY 8 · NOT 1.**

| state | verdict | basis | the one thing that moves it |
|---|---|---|---|
| Lobby | PARTLY | OBSERVED (repair 2): dead region 401 → 182px. Kid C #5: first screen "almost-blank dark page… where I decide game or homework". What now fills the frame: NOT VERIFIED. | Make the closed building + this desk's club/seat count the hero; "Waiting for your teacher" is a footnote, not the content. |
| Hook | NOT | OBSERVED (manifest): "NOT recomposed this pass (C3 not done)". ~40 words (Kid B) — light, but the wave-1 feeling (five cards on the desk before doors) has no evidence. | C3: the five night cards laid out as the season slate, one hero. |
| Pre-lock N1 | PARTLY | OBSERVED: `#fhLock` 304–360 @1366 / 268–324 @1024; nights card top 475 (was 769); price readout the only ≥34px figure; dark closed building. But first-viewport words **281** vs the <120 target — worse than before (231). Kid B STANDING: "a page of paragraphs with a dial poking through". | Cut to <120 words at scrollY=0: the season-plan paragraph and the renewals rule go behind the existing `moreLabel` disclosure; only `spendShortRuleFor` and the card facts stay in view. |
| Locked-waiting (H1) | PARTLY | OBSERVED: whole dark building in panel (C8), `doorsLine` teacher-paced. Any settle motion (dial → plate, lights down): NOT VERIFIED. | H1 is a transition, not a frame; give it the ~40% settle (with reduced-motion collapse) or it is just a waiting screen. |
| Settled night | CARRIED | OBSERVED: turnout 72px sole hero, headline top 189, causal line 276–364 every night, RENEWALS bottom 414/400, NEXT ≤707/574; arena fill monotonic with hard seam (repair 3), one name "MORE SEATS", legend deleted. | Residual: `nightFactLineFor` is a restatement ("You charged $10 · Saturday · draw 97/100"), not the reason Kid C asked for. Look-alike nights (Kid A #4): NOT VERIFIED addressed. |
| Sellout N4 (B1) | PARTLY | OBSERVED: FULL HOUSE 60px on panel ground (gold banner gone), 2 figures ≥34px, resale inside fold (603), NEXT 707, third deck lit 90% + gold rim at 1.0. The **fill sequence** (B1 is "house fills", full cinema, Q5 first-sellout-full) is NOT VERIFIED anywhere in the reports. | Prove B1 is a moment, not a composed frame: the first sellout must visibly fill, once. |
| Zero-turnout | PARTLY | OBSERVED (repair 3): 0% = dark building, 0.00% warm pixels — right feeling. Kid C's "oh no" beat was pre-repair; no zero-turnout screen in the repair-2 set: NOT VERIFIED post-repair. `renewalFloorLineFor` names the clamp but no line names *why* ($120 above what a draw-51 Saturday was worth). | One registered "why" sentence in the first viewport; screenshot the state. |
| Reveal mirror | PARTLY | OBSERVED: 8 distinct md5s stages 0–7 (device no longer dead), dead region 22px. Whether it points *up* at the board or competes with it (wave-1 risk 9): NOT VERIFIED. | Each stage is a pointer ("the board has Night 3 — find your dot"), never a second chart. |
| Synthesis mirror | PARTLY | OBSERVED: 6 distinct md5s, page 3 carries the pair's nights, dead region 100. Computed visuals (R-5) are wave 3. | See Q2. |
| Complete | PARTLY | OBSERVED: five nights, exit prompt, beyond-sports line, 110px dead. Kid A #4 (red error-slot text on the finished season): NOT VERIFIED fixed. | Books closed, lights off, one line; no data recap, no error-slot text. |

**B/H ledger.** On /play now: B1 frame (PARTLY — no fill evidence), H1 (PARTLY — no settle evidence), H2's private half (`repeatCallbackLineFor` on Night 5, OBSERVED registered). Owed to wave 3: B2 Two Peaks, B3 class results frame, B4 synthesis close, H2's board half (counterfactual frame), all /teach.

## Q2 — frontier direction (feeds founder-decision candidate)

**Facts.** OBSERVED (probe): cash-best 65 renewals vs renewals-corner 100 — gap 7.5% NY ($182,336), 6.0% Memphis ($117,900) for +35 points. INFERRED (`SIMPLIFICATIONS` R12 entry, `renewalMarginalCost`): the frontier is not flat, it **bends** — under $3,000/point below 93 renewals, $9,000–$51,478/point above. Roughly: the first ~28 points cost ≤ ~$84k, the last ~7 cost ~$100k. INFERRED (module comment 573–594): the renewals book wants a *higher* price than cash on big cards, so "the real cost shows up when you chase the sellout" — the second clause of option (a) as worded — is **not supported** and would reintroduce FL3 ("charging low is kind"). OBSERVED: the module never promised "you cannot have both"; `OBJECTIVE_COPY` says "usually worse for the other — that is the job" and the synthesis card is "TWO BOOKS, NO EXCHANGE RATE".

**Ranking.**
1. **(a′) Draw it honestly, as the bend it is — recommended.** Target feeling for a grade 5–6 pair: *the line is the ceiling of the room, not a wall between two choices.* The memorable number is not the frontier's drop; it is the distance from each desk's own dot up to the line (Kid C's $120 night is –$500k; the whole frontier is $182k wide). First beat: "nobody in this room reached the line — here is what your desk left on both books." Second beat, off `renewalMarginalCost`: "keeping most of your fans was cheap; keeping the last ones was not." Formalization: **rising opportunity cost** — generalizes outside sports (the last 5% of anything costs the most). This is true, memorable, and it keeps the tension: the trade-off is real *and* it is not the same size everywhere.
2. **(c) Dots only** — the fallback if wave 3 cannot make the bend legible at 1920x1080. It keeps privacy and honesty but cannot answer "what if we'd done something different?", which is the module's success line.
3. **(b) Steepen the model** — not recommended for the picture's sake. The `SIMPLIFICATIONS` ledger records why 25 fans/point was chosen (louder settings make the cash season chase renewals and the books stop trading off); a retune (30–35 / 4.5–6.0 per the sweep) is a new Economic Truth pass, out of this run.

**Do not** caption any frame "you gave up almost nothing to keep the fans": to a ten-year-old that reads "keep prices low, it's free," the exact false lesson the renewals-tent repair removed. Print the gap in dollars and people, never as a percent to students (7.5% reads as nothing; $182,336 reads as money).

## direction
The /play loop is now composed to the wave-1 spec (turnout hero, box score, dark-before-doors building, one name per object); what it is missing is the two *moments* the 75/25 budget promised on /play — B1's fill and H1's settle — plus a decision screen that reads as a decision (281 words). Wave 3 draws the frontier as a bend, not a flat, with the room's dots inside it as the hero: "nobody reached the line; most fans were cheap to keep, the last ones were ruinous" → rising opportunity cost. Option (a′) over (c) over (b).

## experience-risks
1. Pre-lock first-viewport words rose to 281 (target <120) — the ticket-office feeling dies where the decision is made (Kid B STANDING). 2. A flat-captioned frontier teaches FL3; the lead's (a) second clause ("chasing the sellout") is unsupported by the model. 3. B1 on /play may be a frame, not a fill — NOT VERIFIED. 4. The settled "why" is still a restatement; feeling carried, understanding not (Kid C's top finding). 5. Reveal mirror now changes 8 times — risk 9 (kids look down, not up) is live and unmeasured. 6. Hook unrecomposed, lobby 182px dead — the game-or-homework verdict is made on the two weakest screens. 7. Zero-turnout, look-alike nights, third-deck wiring, Night-5 red error slot: all NOT VERIFIED post-repair.

## non-negotiables
All wave-1 items stand. Added for wave 3: the frontier is drawn from `seasonFrontier`/`renewalMarginalCost` only, both axes in the two books' own units, no percent as hero; caption text read off computed figures, never prose asserting a trade-off size; desk dots inside the line, never joined, never on a monotone price→renewals encoding (FL-V11); /play synthesis mirror shows the pair's own dot only; no "gave up almost nothing"; B1 fill runs once with manual fallback and reduced-motion collapse; every new sentence registered in `fullHouse.ts`.

## open-questions
**Founder-decision candidate FD-1:** accept that Module 2's trade-off lesson is "cheap fans first, ruinous fans last" (near-flat over most of the range, steep at the end) rather than "you cannot have both"? Yes → wave 3 draws it honestly, (b) closed. No → model retune with a fresh Economic Truth pass, outside this run. Also: Q-A is B1 a sequence or a frame on /play (Q5 ruling applied where)? Q-B who registers the "why" sentence (Economic Truth) — it gates settled/zero from PARTLY to CARRIED. Q-C Hook C3: wave 2 residue or wave 3? Q-D dollars vs people as the frontier-gap unit on the projector.
