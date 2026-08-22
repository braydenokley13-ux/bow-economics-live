# VERIFY_ROUND2 — Fresh-context re-verification of the repair charter

Isolated copy of `runtime/` (`npm install && npm run build && npm test`), served on
`PORT=4104` from a scratch snapshot directory. **107/107 tests passing** (round 1: 80/80 —
27 new tests came with the repair). Verified against the running server via direct API/curl
(join, actions, control, security probes) and a real Playwright Chromium pass (phone-width
viewport, actual clicks — join form, market-card taps, lock button) across `/play`, `/board`,
and `/teach`, with **zero console/page errors** through a full LOBBY→COMPLETE walkthrough.

## Per-item verdicts

| # | Claim | Verdict |
|---|---|---|
| G1/G2 | Market has value inversions (busts/gems); `candidatesFor` sorts price-ascending | **FIXED** |
| G3 | Shock permanently poaches; $20M repair stipend | **PARTIALLY FIXED** — poach is real and irreversible, but see NEW ISSUE below |
| G4 | Franchise-named reveals | **FIXED** |
| G5 | comfortable/tight/at-cap zones, no false "over" state | **FIXED** |
| G6 | Slot remove buttons + swap suggestions at $0 | **FIXED** |
| G7 | Five synthesis cards incl. RISK BUFFER | **PARTIALLY FIXED** — cards render with real numbers, but RISK BUFFER's taught principle isn't structurally true (see below) |
| R1 | Teacher bearer key gates `/control` + `GET /teacher` | **FIXED** |
| R2 | `restore` clears `ended` | **FIXED** |
| R3 | Rejoin PIN lockout after 5 + teacher unlock | **FIXED** |
| R4 | Corrupt snapshot quarantined, server boots fresh | **FIXED** |

## A — Playing it honestly

Ran a full session (`BOWFLF`) as teacher + 3 pairs with genuinely different builds:
**MaxSpend** (star-stack, `sc-60/pm-10/df-10/rb-10/wc:sc-10`, $100M), **Leftover**
(`sc-20/pm-10/df-10/rb-10/wc:sc-10`, $60M, $40M idle), **ValueSpread** (deliberately hunting
the two documented gems, `sc-10/pm-20/df-20/rb-10/wc:rb-40`, $100M).

- **ADAPT is now a real decision for spent-to-cap teams.** MaxSpend's shock hit PLAYMAKER
  (Ravi Patel, rated 56); ADAPT offered two genuine, differently-priced substitutes (Andre
  Lopez $20M/RTG72, Mikey Cross $30M/RTG70) — confirmed both server-side and in the rendered
  UI (real player cards, not the old plain-text banner — a nice bonus fix beyond what was
  required).
- **Bargains/busts are discoverable.** Brute-forced the full 24-card market: best possible
  single-roster rating is 347 (using the two gems), the best build that includes a $60 "star"
  tops out at 328 and ranks **#395 of 688** possible $100M builds — star-stacking is still
  clearly not dominant, and now there are real price/value traps to find, not just a flat
  price-tracks-rating market.
- **The reveal is ownable.** Both API and a real board-page screenshot show `Ironworks ·
  Star-Stacked` under the bar, and the student's own REVEAL screen shows the same franchise
  name — a class can now point at a bar and argue.
- **At-cap reads as tense-but-legal.** Screenshot at spend=$100M shows a gold "AT THE CAP"
  pill on a gold-filled meter, not red/"OVER THE LINE."
- **Replay value:** genuinely improved over round 1 — three different strategies produced
  three different shock targets, repair choices, and rating outcomes; the back-half no longer
  converges on an identical forced click.

## B — Exploit re-check

**Leave-headroom shock-reroll is dead, but not for the claimed reason.** Built two teams
whose weakest slot was the *identical* card (`pm-10`, Ravi Patel): MaxSpend (spent to the
$100M cap) and Leftover (spent only $60M, $40M idle). Both received **exactly the same ADAPT
budget ($30M) and the same two candidates** — leftover cash contributed nothing, because
`adaptBudgetFor` is `removedPrice + ADAPT_STIPEND`, a purely local formula with no reference
to the team's overall remaining cap room. This does kill the round-1 "bank cash elsewhere,
treat the shock as a free reroll" exploit — but it does so by making leftover cash *useless*
in ADAPT, not by giving leftover teams a real insurance advantage (see RISK BUFFER below).

No new dominant full-roster strategy found. The two intra-tier gems (PLAYMAKER $20 vs $30,
REBOUNDER $40 vs $50) are strictly dominant *locally* — that's the intended "cheaper isn't
always worse" discovery, not a full-build exploit.

**Impatient-student rescue confirmed live and better than described.** Built a team to
$100M/5 slots with REBOUNDER empty: `candidates: []`, `swaps:` populated with two concrete,
one-click "Free up $60M by moving out Blaze Carter → afford Dario Silva ($10M)" suggestions
that atomically queue a `remove` + `place`. This is a real fix, not a text link.

## New issue found (severity: moderate) — the repair stipend breaks the $100M cap invariant

`doAdaptFill` checks `player.price > adaptBudgetFor(...)` but **never checks the resulting
total against `CAP`** the way `doPlace` does. Reproduced directly: MaxSpend (locked at exactly
$100M) repaired PLAYMAKER for $20M and finished at **$110M total roster spend**; ValueSpread
(also locked at $100M) repaired SCORER for $30M and finished at **$120M** — both visible on
the teacher console as `spent: 110` / `spent: 120`, `remaining: -10` / `remaining: -20`,
styled with the *same* gold "at-cap" pill as a legitimately-$100M team, no over-cap indicator
anywhere. Brute-forcing all 688 valid $100M locked builds against an optimal-value repair
choice: **448 (65%) would exceed $100M after repair**, every overflow landing at exactly
+$20M (the stipend amount) when the team chooses the priciest affordable substitute — which
is exactly what the neutral, price-ascending-sorted candidate list nudges them toward. This
directly contradicts the game's own premise ("$100 million... you cannot afford everyone,"
enforced everywhere else with a hard rejection) and is a real, common-case, undocumented
crack in the cap invariant the entire lesson is built on — not a crash, not a competitive
exploit (L1 has no head-to-head), but a genuine content-accuracy problem a sharp student or
teacher doing the arithmetic on their own five visible salary tags would notice. It also
silently corrupts the SCARCITY card: `spentToCapCount` is computed from *live* post-repair
spend, not the locked-at-time spend, so a team that heroically hit exactly $100M during PLAY
is no longer counted once ADAPT moves them off that number (confirmed: session's SCARCITY
card read "0 of 3 spent every last dollar to the cap" even though 2 of 3 had done exactly
that at lock time).

## D — Synthesis spot-check

All five cards cite this session's real, correctly-computed numbers (cross-checked against
the teacher aggregate JSON). **RISK BUFFER's specific claim does not hold up under the actual
stipend math.** The card reads "1 team still had money left... 1 of 1 repaired with someone
as good or better... 2 teams had spent every last dollar... only 2 of 2 could say the same" —
a 100%/100% split that undercuts, rather than demonstrates, its own closing line ("leaving
room in a budget... is insurance against a setback"). This isn't session bad luck: because
`adaptBudgetFor` never references the team's overall remaining cap, leftover and capped teams
facing an equally-priced sacrifice get **identical** repair options every time — there is no
structural mechanism by which slack helps. The claim is asserted, not earned by the mechanics,
which is exactly the failure mode VERIFY_ECONOMICS.md's original FATAL finding was about.

## C — Security re-check (all confirmed)

`POST /control` and `GET /teacher` reject with 401 `bad_teacher_key` given only the join code,
a garbage token, or even a real *student's* device token. 6 wrong rejoin PINs: attempts 1-5
return 401, the 6th (and the correct PIN after it) return 423 `rejoin_locked`; teacher
`unlock` (200) restores rejoin. `end` → `restore` fully revives (`ended: true → false`,
subsequent actions succeed again), confirmed `end` itself now checkpoints without a prior
freeze. Corrupting `snapshot.json` and restarting: server boots cleanly (port responds 200),
bad file renamed to `snapshot.json.corrupt-<ts>` (not deleted), fresh empty store. `GET
/api/sessions` remains unauthenticated (round-1 ADVISORY, not in the required-repair list —
unchanged, low priority).

## Ranked remaining gaps

1. **[MODERATE]** `doAdaptFill` needs a cap cross-check (e.g. `min(removedPrice + STIPEND,
   CAP - preShockSpentExcludingSlot + removedPrice)`) so post-repair spend can't exceed
   $100M — and `spentToCapCount`/SCARCITY should use locked-at-time spend, not live spend.
2. **[MODERATE]** RISK BUFFER's copy/framing needs to match what the mechanic actually does —
   either genuinely couple the repair budget to remaining cap room (giving leftover teams a
   real edge), or rewrite the card to stop implying an insurance benefit that isn't there.
3. **[LOW]** `GET /api/sessions` still unauthenticated (pre-existing, advisory).

## Gameplay rating: **STRONG**

Every round-1 gameplay complaint (forced-click repair, anonymous reveal, price=value market,
headroom-reroll exploit, impatient dead-end, alarm-red at-cap) is genuinely fixed and verified
live, not just claimed — real UI clicks, zero console errors, real screenshots. This clears
the classroom bar on gameplay feel. It falls short of MAGNETIC only because the new
cap-overflow/RISK-BUFFER issue is a genuine, common-case (65% of full-spend builds) crack in
the lesson's own central economic claim, discovered while doing exactly the verification the
round asked for.

## Overall ruling: NEEDS ANOTHER REPAIR ROUND

Blockers for full sign-off: the ADAPT-stipend cap-overflow (breaks the $100M invariant and
corrupts SCARCITY's own numbers) and the RISK BUFFER card's unearned claim. Both are narrow,
cheap, well-localized fixes in `draftDay.ts` (`doAdaptFill`, `computeAggregate`,
`synthesisCards`) — no redesign, no architecture change. Everything else — market redesign,
franchise reveal, cap-state relabeling, rescue affordance, and all four runtime security
repairs (B1-B3, R1-R4) — is genuinely fixed and classroom-gameplay-tested. This is a
**gameplay-tested candidate**, not yet a fully certified one; classroom-proven still requires
an actual classroom.
