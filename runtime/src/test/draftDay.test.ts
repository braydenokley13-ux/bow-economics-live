import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAP,
  CREST_COUNT,
  FRANCHISE_NAMES,
  MARKET,
  POSITION_TAGS,
  SLOT_IDS,
  adaptBudgetFor,
  candidatesFor,
  candidatesForAdapt,
  capStateOf,
  draftDayModule,
  franchiseFor,
  spentOf,
  spreadSample,
  swapSuggestionsFor,
  weakestSlotOf,
  type DraftDayState,
  type Player,
} from "../modules/draftDay.js";
import { isOrderedSubsequence } from "../shared/phases.js";

const ctx = (phase: string, seatId = "seat-1", seatIds: string[] = ["seat-1", "seat-2", "seat-3"]) => ({
  phase: phase as never,
  seatId,
  seatIds,
  now: Date.now(),
});

const empty = (): DraftDayState => draftDayModule.initialState({ sessionId: "s1", seatIds: [] });

function place(state: DraftDayState, seatId: string, slotId: string, playerId: string) {
  return draftDayModule.reduce(state, { type: "place", slotId, playerId }, ctx("PLAY", seatId));
}

function expectOk(result: ReturnType<typeof draftDayModule.reduce>): DraftDayState {
  assert.equal(result.ok, true, !result.ok ? result.reason : undefined);
  if (!result.ok) throw new Error("unreachable");
  return result.state;
}

/** Builds a full, locked five-slot roster for one seat from explicit player ids. */
function buildAndLock(
  state: DraftDayState,
  seatId: string,
  picks: { slot: string; playerId: string }[],
): DraftDayState {
  let s = state;
  for (const { slot, playerId } of picks) {
    s = expectOk(place(s, seatId, slot, playerId));
  }
  s = expectOk(draftDayModule.reduce(s, { type: "lock" }, ctx("PLAY", seatId)));
  return s;
}

const CHEAP_FULL_ROSTER = [
  { slot: "SCORER", playerId: "sc-10" },
  { slot: "PLAYMAKER", playerId: "pm-10" },
  { slot: "DEFENDER", playerId: "df-10" },
  { slot: "REBOUNDER", playerId: "rb-10" },
  { slot: "WILDCARD", playerId: "sc-20" },
];

/* -------------------------------------------------------------- phases -- */

test("draftDayModule declares a well-ordered phase subsequence covering the full canonical vocabulary", () => {
  assert.equal(isOrderedSubsequence(draftDayModule.phases), true);
  assert.deepEqual(
    [...draftDayModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "ADAPT", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"],
  );
});

/* -------------------------------------------------------------------- G1 -- */

test("G1: market has 36 fictional players across 4 positions — four $10M-floor cards plus one each of $20-60M, distinct ratings", () => {
  assert.equal(MARKET.length, 36);
  const ratings = new Set(MARKET.map((p) => p.rating));
  assert.equal(ratings.size, 36, "ratings should be pairwise distinct so shock targeting never needs a tie-break in practice");
  for (const tag of POSITION_TAGS) {
    const byPrice = new Map<number, number>();
    for (const p of MARKET.filter((p) => p.position === tag)) {
      byPrice.set(p.price, (byPrice.get(p.price) ?? 0) + 1);
    }
    // ROUND-2 REPAIR: four cards at the $10M floor per position (not one) — see
    // the MARKET doc comment for why this specific count closes the
    // >=2-substitutes property once the ADAPT stipend was removed.
    assert.equal(byPrice.get(10), 4, `${tag} should have four $10M-floor cards`);
    for (const tier of [20, 30, 40, 50, 60]) {
      assert.equal(byPrice.get(tier), 1, `${tag} should have exactly one $${tier}M card`);
    }
  }
});

test("G1: price is NOT a perfect proxy for value — at least one tier inversion exists per direction", () => {
  // A "bust": a pricier tier rated LOWER than a cheaper tier in the same position.
  let hasBust = false;
  // A "gem": already implied by the same inversion viewed from the other side —
  // the cheaper tier outrating the pricier one IS the gem. Confirm both readings hold.
  for (const tag of POSITION_TAGS) {
    const tiers = MARKET.filter((p) => p.position === tag).sort((a, b) => a.price - b.price);
    for (let i = 1; i < tiers.length; i += 1) {
      if (tiers[i]!.rating < tiers[i - 1]!.rating) hasBust = true;
    }
  }
  assert.ok(hasBust, "the market must contain at least one within-position price/rating inversion");
});

test("G1: no dominant opening roster — star-stacked and balanced strategies both stay within a reasonable band of the global best full-cap build", () => {
  const byPosition: Record<string, Player[]> = {};
  for (const tag of POSITION_TAGS) byPosition[tag] = MARKET.filter((p) => p.position === tag);

  type Build = { cost: number; rating: number; maxPrice: number };
  const builds: Build[] = [];
  for (const sc of byPosition["SCORER"]!) {
    for (const pm of byPosition["PLAYMAKER"]!) {
      for (const df of byPosition["DEFENDER"]!) {
        for (const rb of byPosition["REBOUNDER"]!) {
          const baseCost = sc.price + pm.price + df.price + rb.price;
          if (baseCost > CAP) continue;
          const baseRating = sc.rating + pm.rating + df.rating + rb.rating;
          const usedIds = new Set([sc.id, pm.id, df.id, rb.id]);
          for (const wc of MARKET) {
            if (usedIds.has(wc.id)) continue;
            const cost = baseCost + wc.price;
            if (cost > CAP) continue;
            builds.push({
              cost,
              rating: baseRating + wc.rating,
              maxPrice: Math.max(sc.price, pm.price, df.price, rb.price, wc.price),
            });
          }
        }
      }
    }
  }
  assert.ok(builds.length > 100, "expected many valid full-cap builds to exist");

  const globalMax = Math.max(...builds.map((b) => b.rating));
  const starStackedMax = Math.max(...builds.filter((b) => b.maxPrice === 60).map((b) => b.rating));
  const balancedMax = Math.max(...builds.filter((b) => b.maxPrice <= 30).map((b) => b.rating));

  assert.ok(Number.isFinite(starStackedMax) && Number.isFinite(balancedMax), "both strategy shapes must have at least one valid build");
  assert.ok(
    starStackedMax >= globalMax * 0.85,
    `star-stacked's best build (${starStackedMax}) should stay within 15% of the global best (${globalMax}) — no single strategy should dominate`,
  );
  assert.ok(
    balancedMax >= globalMax * 0.85,
    `balanced's best build (${balancedMax}) should stay within 15% of the global best (${globalMax}) — no single strategy should dominate`,
  );
});

/* -------------------------------------------------------------------- G2 -- */

test("G2: candidatesFor is ordered neutrally by price ascending, never by rating (no silent 'buy the priciest' steer)", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const candidates = candidatesFor(state.teams["seat-1"]!, "PLAYMAKER");
  const prices = candidates.map((p) => p.price);
  const sortedAscending = [...prices].sort((a, b) => a - b);
  assert.deepEqual(prices, sortedAscending, "candidatesFor must be price-ascending, not rating-based");
});

test("G2: spreadSample picks a genuine cheap/mid/pricey spread, not the first N nor the top N", () => {
  const sorted = [...MARKET].filter((p) => p.position === "SCORER").sort((a, b) => a.price - b.price);
  const sample = spreadSample(sorted, 3);
  assert.equal(sample.length, 3);
  assert.equal(sample[0]!.price, sorted[0]!.price, "spread should include the cheapest");
  assert.equal(sample[sample.length - 1]!.price, sorted[sorted.length - 1]!.price, "spread should include the priciest");
  assert.notEqual(sample[1]!.price, sample[0]!.price, "the middle pick should be genuinely different from the ends");
});

/* --------------------------------------------------------- core reducer -- */

test("place rejects outside PLAY phase", () => {
  const result = draftDayModule.reduce(empty(), { type: "place", slotId: "SCORER", playerId: "sc-10" }, ctx("LOBBY"));
  assert.equal(result.ok, false);
});

test("place rejects a teacher trying to build a roster", () => {
  const result = draftDayModule.reduce(empty(), { type: "place", slotId: "SCORER", playerId: "sc-10" }, ctx("PLAY", "teacher"));
  assert.equal(result.ok, false);
});

test("place rejects an unknown player id", () => {
  const result = place(empty(), "seat-1", "SCORER", "not-a-player");
  assert.equal(result.ok, false);
});

test("place rejects a position mismatch (non-wildcard slot)", () => {
  const result = place(empty(), "seat-1", "SCORER", "pm-10");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /cannot fill the SCORER slot/);
});

test("place allows any position into the WILDCARD slot", () => {
  const result = place(empty(), "seat-1", "WILDCARD", "rb-40");
  assert.equal(result.ok, true);
});

test("place rejects filling an already-occupied slot", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = place(state, "seat-1", "SCORER", "sc-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /occupied/);
});

test("place rejects the same player twice on one wall (even via wildcard)", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = place(state, "seat-1", "WILDCARD", "sc-10");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /already on your wall/);
});

test("place rejects going over the $100M cap", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60")); // 60
  state = expectOk(place(state, "seat-1", "PLAYMAKER", "pm-30")); // 90
  const result = place(state, "seat-1", "DEFENDER", "df-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /over the \$100M cap/);
});

test("place accepts a full roster with money left over", () => {
  let state = empty();
  for (const { slot, playerId } of CHEAP_FULL_ROSTER) {
    state = expectOk(place(state, "seat-1", slot, playerId));
  }
  assert.equal(spentOf(state.teams["seat-1"]!), 60); // 10+10+10+10+20
});

test("place accepts a placement that lands exactly on the cap", () => {
  let state = empty();
  for (const { slot, playerId } of [
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-60" },
  ]) {
    state = expectOk(place(state, "seat-1", slot, playerId));
  }
  assert.equal(spentOf(state.teams["seat-1"]!), 100);
});

test("remove frees the slot and the budget, reversibly", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  assert.equal(spentOf(state.teams["seat-1"]!), 60);
  state = expectOk(draftDayModule.reduce(state, { type: "remove", slotId: "SCORER" }, ctx("PLAY", "seat-1")));
  assert.equal(spentOf(state.teams["seat-1"]!), 0);
  state = expectOk(place(state, "seat-1", "SCORER", "sc-30"));
  assert.equal(spentOf(state.teams["seat-1"]!), 30);
});

test("remove rejects an already-empty slot", () => {
  const result = draftDayModule.reduce(empty(), { type: "remove", slotId: "SCORER" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
});

test("lock rejects an incomplete roster", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-10"));
  const result = draftDayModule.reduce(state, { type: "lock" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /fill all five slots/);
});

test("lock succeeds once all five slots are filled and freezes further edits", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  assert.equal(state.teams["seat-1"]!.locked, true);
  const result = place(state, "seat-1", "SCORER", "sc-20");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /locked/);
});

/* -------------------------------------------------------------------- G5 -- */

test("G5: capStateOf uses comfortable/tight/at-cap zones at 90%/100% — never an 'over' state, since the reducer makes over-cap impossible", () => {
  assert.equal(capStateOf(0), "comfortable");
  assert.equal(capStateOf(89), "comfortable");
  assert.equal(capStateOf(90), "tight");
  assert.equal(capStateOf(99), "tight");
  assert.equal(capStateOf(100), "at-cap");
});

test("G5: a fully legal, exactly-at-cap build reports 'at-cap', not an alarm state", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-10" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-60" },
  ]);
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as { capState: string };
  // (PLAY view after lock still reports the final capState the wall settled at)
  assert.equal(view.capState, "at-cap");
});

/* ---------------------------------------------------------- foregone/view -- */

test("studentView PLAY foregone panel lists only players priced above what's left, live", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as { foregone: { id: string }[]; remaining: number };
  assert.equal(view.remaining, 40);
  assert.ok(view.foregone.some((p) => p.id === "pm-50")); // $50 tier now out of reach
  assert.ok(!view.foregone.some((p) => p.id === "pm-40")); // $40 is exactly affordable
});

test("studentView never includes another seat's roster", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  state = expectOk(place(state, "seat-2", "SCORER", "sc-10"));
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as { spent: number };
  assert.equal(view.spent, 60);
});

/* -------------------------------------------------------------------- G6 -- */

test("G6: swapSuggestionsFor offers a concrete rescue when a slot has zero affordable candidates", () => {
  // Spend everything on four slots, leaving $0 for the fifth — the classic impatient-tap dead end.
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60")); // 60
  state = expectOk(place(state, "seat-1", "PLAYMAKER", "pm-40")); // 100 — nothing left for DEFENDER
  const team = state.teams["seat-1"]!;
  assert.equal(candidatesFor(team, "DEFENDER").length, 0, "precondition: DEFENDER should have zero affordable candidates");
  const swaps = swapSuggestionsFor(team, "DEFENDER");
  assert.ok(swaps.length > 0, "a rescue swap must be offered instead of leaving the student stuck");
  // Every suggested swap must actually work: removing the named slot really does unlock the named candidate.
  for (const s of swaps) {
    const afterRemove = expectOk(draftDayModule.reduce(state, { type: "remove", slotId: s.freeSlot }, ctx("PLAY", "seat-1")));
    const afterPlace = place(afterRemove, "seat-1", "DEFENDER", s.unlocks.id);
    assert.equal(afterPlace.ok, true, `swap suggestion for ${s.freeSlot} -> ${s.unlocks.id} should actually be placeable`);
  }
});

test("G6: PLAY suggestions include swaps when a slot is stuck, empty array when candidates exist", () => {
  let state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  state = expectOk(place(state, "seat-1", "PLAYMAKER", "pm-40")); // spent 100, DEFENDER + REBOUNDER stuck
  const view = draftDayModule.studentView(state, "seat-1", "PLAY") as {
    suggestions: { slot: string; candidates: unknown[]; swaps: unknown[] }[];
  };
  const defenderSugg = view.suggestions.find((s) => s.slot === "DEFENDER")!;
  assert.equal(defenderSugg.candidates.length, 0);
  assert.ok(defenderSugg.swaps.length > 0);
});

/* -------------------------------------------------------------------- G3 -- */

test("weakestSlotOf picks the lowest-rated filled slot, deterministically", () => {
  const team = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-40" }, // 83
    { slot: "PLAYMAKER", playerId: "pm-10" }, // 56 — lowest
    { slot: "DEFENDER", playerId: "df-20" }, // 68
    { slot: "REBOUNDER", playerId: "rb-20" }, // 65
    { slot: "WILDCARD", playerId: "sc-10" }, // 58
  ]).teams["seat-1"]!;
  assert.equal(weakestSlotOf(team), "PLAYMAKER");
});

test("shock is deterministic and repeatable for the same roster shape", () => {
  const build = () =>
    buildAndLock(empty(), "seat-1", [
      { slot: "SCORER", playerId: "sc-40" },
      { slot: "PLAYMAKER", playerId: "pm-10" },
      { slot: "DEFENDER", playerId: "df-20" },
      { slot: "REBOUNDER", playerId: "rb-20" },
      { slot: "WILDCARD", playerId: "sc-10" },
    ]);
  const teamA = build().teams["seat-1"]!;
  const teamB = build().teams["seat-1"]!;
  assert.equal(weakestSlotOf(teamA), weakestSlotOf(teamB));
});

test("teacher:shock hits every locked team's own weakest slot and frees the salary", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-40" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]);
  const spentBefore = spentOf(state.teams["seat-1"]!);
  const result = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  const team = result.state.teams["seat-1"]!;
  assert.equal(team.shockSlot, "PLAYMAKER");
  assert.equal(team.slots.PLAYMAKER.playerId, null);
  assert.equal(team.slots.PLAYMAKER.out, true);
  assert.equal(team.slots.PLAYMAKER.removedPlayerId, "pm-10");
  assert.equal(spentOf(team), spentBefore - 10);
});

test("teacher:shock only applies to locked rosters, never unlocked ones", () => {
  const state = expectOk(place(empty(), "seat-1", "SCORER", "sc-60"));
  const result = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.state.teams["seat-1"]!.shockSlot, null);
});

test("teacher:shock rejects a non-teacher caller and rejects outside CONSEQUENCE", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const byStudent = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "seat-1"));
  assert.equal(byStudent.ok, false);
  const wrongPhase = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("PLAY", "teacher"));
  assert.equal(wrongPhase.ok, false);
});

test("teacher:shock cannot be applied twice", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const first = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(first.ok, true);
  if (!first.ok) throw new Error("unreachable");
  const second = draftDayModule.reduce(first.state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(second.ok, false);
});

test("G3: the shock permanently poaches the removed player — adaptFill rejects re-signing them even though it would otherwise be affordable", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER); // sc-10,pm-10,df-10,rb-10,wc(sc-20); weakest = rb-10 (62 is NOT lowest — check ratings)
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  const team = shocked.state.teams["seat-1"]!;
  const hitSlot = team.shockSlot!;
  const removedId = team.slots[hitSlot].removedPlayerId!;

  // The removed player's own price is always <= the repair budget (it's the floor of that
  // budget's formula), so the ONLY reason this must fail is the poaching rule, not price.
  const attempt = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: removedId }, ctx("ADAPT", "seat-1"));
  assert.equal(attempt.ok, false);
  if (!attempt.ok) assert.match(attempt.reason, /rival franchise/);
});

test("G3: no-identical-restore — a repaired roster can never return to byte-identical pre-shock state", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const preShockTeam = state.teams["seat-1"]!;
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  const hitSlot = shocked.state.teams["seat-1"]!.shockSlot!;
  const removedId = shocked.state.teams["seat-1"]!.slots[hitSlot].removedPlayerId!;

  // Every candidate ADAPT actually offers is provably a different player than the one removed.
  const candidates = candidatesForAdapt(shocked.state.teams["seat-1"]!, hitSlot);
  assert.ok(!candidates.some((p) => p.id === removedId), "the removed player must never appear in the repair candidate list");
  assert.ok(candidates.length > 0, "a real substitute must exist to repair with");

  const repaired = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: candidates[0]!.id }, ctx("ADAPT", "seat-1"));
  assert.equal(repaired.ok, true);
  if (!repaired.ok) throw new Error("unreachable");
  const repairedTeam = repaired.state.teams["seat-1"]!;
  assert.notEqual(repairedTeam.slots[hitSlot].playerId, preShockTeam.slots[hitSlot].playerId, "the slot's occupant must differ from before the shock");
});

test("ROUND-2: adaptBudgetFor is the freed price plus remaining cap room — no stipend, never over the cap", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent = 30+10+20+20+10 = 90, $10M of leftover room under the cap
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  const team = shocked.state.teams["seat-1"]!;
  assert.equal(team.shockSlot, "PLAYMAKER");
  // removed pm-10 cost $10M; the team had $10M of leftover room -> budget = 10+10 = 20,
  // never the old stipend-inflated 10+20=30.
  assert.equal(adaptBudgetFor(team, "PLAYMAKER"), 20);

  const wrongPos = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "df-10" }, ctx("ADAPT", "seat-1"));
  assert.equal(wrongPos.ok, false);

  // pm-30 (70) costs $30M > the $20M budget — must now be rejected (would have been
  // accepted, and would have overflowed the cap, under the old stipend formula).
  const tooExpensive = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-30" }, ctx("ADAPT", "seat-1"));
  assert.equal(tooExpensive.ok, false);

  // pm-20 (72) costs exactly $20M — affordable and genuinely different from the removed pm-10.
  const result = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.state.teams["seat-1"]!.slots.PLAYMAKER.playerId, "pm-20");
  assert.equal(spentOf(result.state.teams["seat-1"]!), 100, "repairing at exactly the budget must land exactly at the cap, never over");
});

test("ROUND-2: at exactly $100M locked (zero leftover), the repair budget is exactly the lost salary — the tightest legal case", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent = 30+10+30+20+10 = 100 — exactly at cap, zero leftover
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  const team = shocked.state.teams["seat-1"]!;
  assert.equal(team.shockSlot, "PLAYMAKER");
  // budget = removed price (10) + remaining room (0) = 10 — exactly what was lost, not a cent more.
  assert.equal(adaptBudgetFor(team, "PLAYMAKER"), 10);
  const tooExpensive = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-1")); // $20 > $10
  assert.equal(tooExpensive.ok, false);
  // A DIFFERENT $10M-tier PLAYMAKER (the market-depth repair — pm-10 itself is poached and excluded).
  const affordable = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-10b" }, ctx("ADAPT", "seat-1"));
  assert.equal(affordable.ok, true);
  if (!affordable.ok) throw new Error("unreachable");
  assert.equal(spentOf(affordable.state.teams["seat-1"]!), 100, "must land exactly at the cap, never over");
});

test("adaptFill rejects when the team wasn't hit by the shock", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const result = draftDayModule.reduce(state, { type: "adaptFill", playerId: "sc-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(result.ok, false);
});

test("adaptFill rejects outside ADAPT phase", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const result = draftDayModule.reduce(state, { type: "adaptFill", playerId: "sc-20" }, ctx("PLAY", "seat-1"));
  assert.equal(result.ok, false);
});

/* ------------------------------------------------------- ROUND-2 PROPERTY -- */

/**
 * Every valid locked build that spends EXACTLY $100M — the adversarial
 * worst case for cap safety (zero leftover room) and the exact scope the
 * round-2 verifier brute-forced (688 builds against the pre-depth-repair
 * market). Enumerated fresh here (not hardcoded) so it stays correct as
 * the market is tuned.
 */
function enumerateAtCapBuilds(): { scId: string; pmId: string; dfId: string; rbId: string; wcId: string }[] {
  const byPosition: Record<string, Player[]> = {};
  for (const tag of POSITION_TAGS) byPosition[tag] = MARKET.filter((p) => p.position === tag);

  const builds: { scId: string; pmId: string; dfId: string; rbId: string; wcId: string }[] = [];
  for (const sc of byPosition["SCORER"]!) {
    for (const pm of byPosition["PLAYMAKER"]!) {
      for (const df of byPosition["DEFENDER"]!) {
        for (const rb of byPosition["REBOUNDER"]!) {
          const baseCost = sc.price + pm.price + df.price + rb.price;
          if (baseCost > CAP) continue;
          const usedIds = new Set([sc.id, pm.id, df.id, rb.id]);
          for (const wc of MARKET) {
            if (usedIds.has(wc.id)) continue;
            if (baseCost + wc.price !== CAP) continue;
            builds.push({ scId: sc.id, pmId: pm.id, dfId: df.id, rbId: rb.id, wcId: wc.id });
          }
        }
      }
    }
  }
  return builds;
}

test("ROUND-2 PROPERTY (BLOCKER 1): no reachable post-repair state ever exceeds the $100M cap, across every exactly-$100M locked build and every legal repair choice", () => {
  const builds = enumerateAtCapBuilds();
  assert.ok(builds.length > 100, `expected many exactly-$100M builds to exist, got ${builds.length}`);

  let checkedRepairs = 0;
  for (const b of builds) {
    const state = buildAndLock(empty(), "seat-1", [
      { slot: "SCORER", playerId: b.scId },
      { slot: "PLAYMAKER", playerId: b.pmId },
      { slot: "DEFENDER", playerId: b.dfId },
      { slot: "REBOUNDER", playerId: b.rbId },
      { slot: "WILDCARD", playerId: b.wcId },
    ]);
    const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
    assert.equal(shocked.ok, true);
    if (!shocked.ok) throw new Error("unreachable");
    const team = shocked.state.teams["seat-1"]!;
    const slot = team.shockSlot!;

    // Every candidate the reducer itself is willing to offer — not a re-implementation of
    // the math, the actual `candidatesForAdapt` the client renders — must, if accepted by
    // the actual reducer, land at or under the cap.
    for (const candidate of candidatesForAdapt(team, slot)) {
      const result = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: candidate.id }, ctx("ADAPT", "seat-1"));
      assert.equal(result.ok, true, `candidate ${candidate.id} came from candidatesForAdapt but the reducer rejected it for build ${JSON.stringify(b)}`);
      if (!result.ok) continue;
      const finalSpent = spentOf(result.state.teams["seat-1"]!);
      assert.ok(
        finalSpent <= CAP,
        `build ${JSON.stringify(b)} (slot ${slot}) repaired with ${candidate.id} landed at $${finalSpent}M — over the $${CAP}M cap`,
      );
      checkedRepairs += 1;
    }
  }
  assert.ok(checkedRepairs > 100, `expected to have exercised many real repairs, got ${checkedRepairs}`);
});

test("ROUND-2 PROPERTY (BLOCKER 1): every poached card leaves >=2 same-position affordable substitutes, for every exactly-$100M locked build", () => {
  const builds = enumerateAtCapBuilds();
  assert.ok(builds.length > 100, `expected many exactly-$100M builds to exist, got ${builds.length}`);

  for (const b of builds) {
    const state = buildAndLock(empty(), "seat-1", [
      { slot: "SCORER", playerId: b.scId },
      { slot: "PLAYMAKER", playerId: b.pmId },
      { slot: "DEFENDER", playerId: b.dfId },
      { slot: "REBOUNDER", playerId: b.rbId },
      { slot: "WILDCARD", playerId: b.wcId },
    ]);
    const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
    assert.equal(shocked.ok, true);
    if (!shocked.ok) throw new Error("unreachable");
    const team = shocked.state.teams["seat-1"]!;
    const slot = team.shockSlot!;
    const candidates = candidatesForAdapt(team, slot);
    assert.ok(
      candidates.length >= 2,
      `build ${JSON.stringify(b)}, poached slot ${slot} (removed ${team.slots[slot].removedPlayerId}) left only ${candidates.length} substitute(s) — need >=2`,
    );
  }
});

/* -------------------------------------------------------------------- G4 -- */

test("G4: franchiseFor is a stable, deterministic pure function of index (name + crest)", () => {
  assert.equal(franchiseFor(0).name, "Ironworks");
  assert.equal(franchiseFor(0).crestIndex, 0);
  assert.equal(franchiseFor(1).name, "Northstar");
  assert.deepEqual(franchiseFor(0), franchiseFor(0));
  assert.equal(franchiseFor(20).name, franchiseFor(0).name, "names cycle after the list length");
  assert.ok(franchiseFor(7).crestIndex >= 0 && franchiseFor(7).crestIndex < CREST_COUNT);
});

test("G4: the first 20 franchise indices all have distinct names", () => {
  const names = new Set(Array.from({ length: 20 }, (_, i) => franchiseFor(i).name));
  assert.equal(names.size, 20);
  assert.equal(FRANCHISE_NAMES.length, 20);
});

test("G4: a team is assigned a stable franchise index on its first placement, derived from join order", () => {
  const seatIds = ["seat-A", "seat-B", "seat-C"];
  // seat-B acts first even though it's not first in join order — the index should still reflect join order (index 1), not action order.
  let state = expectOk(draftDayModule.reduce(empty(), { type: "place", slotId: "SCORER", playerId: "sc-10" }, { phase: "PLAY" as never, seatId: "seat-B", seatIds, now: Date.now() }));
  assert.equal(state.teams["seat-B"]!.franchiseIndex, 1);

  // Subsequent placements by the same seat never re-assign the index.
  state = expectOk(draftDayModule.reduce(state, { type: "place", slotId: "PLAYMAKER", playerId: "pm-10" }, { phase: "PLAY" as never, seatId: "seat-B", seatIds, now: Date.now() }));
  assert.equal(state.teams["seat-B"]!.franchiseIndex, 1);
});

test("G4: teacherView exposes seatId + franchise per team for a reliable franchise-to-seat mapping", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const view = draftDayModule.teacherView(state, "PLAY") as {
    teams: { seatId: string; franchise: { name: string; crestIndex: number } | null }[];
  };
  const entry = view.teams.find((t) => t.seatId === "seat-1");
  assert.ok(entry);
  assert.ok(entry!.franchise, "a team that has placed a card must have a franchise assigned");
});

test("G4: boardView REVEAL labels the gallery with franchise identity, never a seatId or student name", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const view = draftDayModule.boardView(state, "REVEAL") as {
    gallery: { franchise: { name: string; crestIndex: number } }[];
  };
  assert.equal(view.gallery.length, 1);
  assert.ok(view.gallery[0]!.franchise.name.length > 0);
  const serialized = JSON.stringify(view);
  assert.ok(!serialized.includes("seat-1"), "boardView must never leak the raw seatId");
});

test("boardView never includes a seatId or any per-team identifying key", () => {
  const state = buildAndLock(empty(), "seat-1", CHEAP_FULL_ROSTER);
  const view = draftDayModule.boardView(state, "REVEAL");
  const serialized = JSON.stringify(view);
  assert.ok(!serialized.includes("seat-1"), "boardView must not leak seat identity");
});

test("boardView renders distinct modes across the full phase list", () => {
  const state = empty();
  for (const phase of draftDayModule.phases) {
    const view = draftDayModule.boardView(state, phase) as { mode: string };
    assert.ok(view.mode && view.mode.length > 0, `boardView(${phase}) should declare a mode`);
  }
});

/* -------------------------------------------------------------------- G7 -- */

test("aggregate computes real class-wide numbers used by the synthesis cards", () => {
  let state = empty();
  state = buildAndLock(state, "seat-1", [
    { slot: "SCORER", playerId: "sc-60" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // star signer, spent = 100, has a cheap $10 fill too
  state = buildAndLock(state, "seat-2", [
    { slot: "SCORER", playerId: "sc-20" },
    { slot: "PLAYMAKER", playerId: "pm-20" },
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // balanced, spent = 90

  const agg = draftDayModule.aggregate(state, "REVEAL") as {
    lockedTeams: number;
    spentToCapCount: number;
    starSignerCount: number;
    starSignerCheapFillCount: number;
    balancedCount: number;
    substituteChoiceCount: number;
    positionPickCount: number;
  };
  assert.equal(agg.lockedTeams, 2);
  assert.equal(agg.starSignerCount, 1);
  assert.equal(agg.starSignerCheapFillCount, 1);
  assert.equal(agg.balancedCount, 1);
  // 8 total position picks (4 per team); only seat-1's SCORER (sc-60) is a top-tier ($60) pick — the other 7 are substitute choices.
  assert.equal(agg.positionPickCount, 8);
  assert.equal(agg.substituteChoiceCount, 7);
});

test("synthesis cards degrade gracefully with zero locked rosters (no fake data)", () => {
  const view = draftDayModule.boardView(empty(), "SYNTHESIS") as { cards: { id: string; body: string }[] };
  assert.equal(view.cards.length, 1);
  assert.match(view.cards[0]!.body, /No rosters locked/);
});

test("synthesis cards cite real session numbers once rosters are locked, and TRADEOFFS names the substitute-choice mechanism (G7b)", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-60" },
    { slot: "PLAYMAKER", playerId: "pm-10" },
    { slot: "DEFENDER", playerId: "df-10" },
    { slot: "REBOUNDER", playerId: "rb-10" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]);
  const view = draftDayModule.boardView(state, "SYNTHESIS") as { cards: { id: string; title: string; body: string }[] };
  const scarcity = view.cards.find((c) => c.id === "scarcity")!;
  assert.match(scarcity.body, /1 team/);
  const oppCost = view.cards.find((c) => c.id === "opportunity-cost")!;
  assert.match(oppCost.body, /1 of 1 teams signed a \$60M star/);
  const tradeoffs = view.cards.find((c) => c.id === "tradeoffs")!;
  assert.match(tradeoffs.body, /substitute/i);
  assert.match(tradeoffs.body, /six real players at six different prices/);
  // no shock yet — risk-buffer and the rewritten constrained-choice card shouldn't appear
  assert.ok(!view.cards.some((c) => c.id === "risk-buffer"));
  assert.ok(!view.cards.some((c) => c.id === "constrained-choice"));
});

test("G7a / ROUND-2 BLOCKER 2b: RISK BUFFER cites each group's real, mechanically-different repair budget", () => {
  let state = empty();
  // Team A: spends to the exact cap before the shock (zero leftover).
  state = buildAndLock(state, "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest, 56
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent 100
  // Team B: leaves $20M on the table before the shock.
  state = buildAndLock(state, "seat-2", [
    { slot: "SCORER", playerId: "sc-20" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest, 56
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent 80 — $20 leftover

  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");

  const teamA = shocked.state.teams["seat-1"]!;
  const teamB = shocked.state.teams["seat-2"]!;
  assert.equal(teamA.shockSlot, "PLAYMAKER");
  assert.equal(teamB.shockSlot, "PLAYMAKER");
  const budgetA = adaptBudgetFor(teamA, "PLAYMAKER");
  const budgetB = adaptBudgetFor(teamB, "PLAYMAKER");
  assert.equal(budgetA, 10, "at-cap team's budget is exactly the lost salary back");
  assert.equal(budgetB, 30, "leftover team's budget is the lost salary plus its unspent room");
  assert.ok(budgetB > budgetA, "the team with slack must get a STRICTLY larger repair budget for the identical loss — the core ROUND-2 property");

  // Team A can only afford another $10M-tier PLAYMAKER; team B can reach the $30M tier — a real, structural difference, not luck.
  let s = shocked.state;
  const repairA = draftDayModule.reduce(s, { type: "adaptFill", playerId: "pm-30" }, ctx("ADAPT", "seat-1"));
  assert.equal(repairA.ok, false, "team A must not be able to afford the $30M tier — that's the whole point");
  const repairA2 = draftDayModule.reduce(s, { type: "adaptFill", playerId: "pm-10b" }, ctx("ADAPT", "seat-1"));
  assert.equal(repairA2.ok, true);
  if (!repairA2.ok) throw new Error("unreachable");
  s = repairA2.state;
  const repairB = draftDayModule.reduce(s, { type: "adaptFill", playerId: "pm-30" }, ctx("ADAPT", "seat-2"));
  assert.equal(repairB.ok, true, "team B, with slack, CAN afford the $30M tier team A could not");
  if (!repairB.ok) throw new Error("unreachable");
  s = repairB.state;

  assert.equal(spentOf(s.teams["seat-1"]!), 100, "team A must land exactly at the cap, never over");
  assert.equal(spentOf(s.teams["seat-2"]!), 100, "team B must land exactly at the cap, never over");

  const view = draftDayModule.boardView(s, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const riskBuffer = view.cards.find((c) => c.id === "risk-buffer");
  assert.ok(riskBuffer, "risk-buffer card should appear once the shock has been applied");
  assert.match(riskBuffer!.body, /1 team.*spent every last dollar.*\$10M avg/is);
  assert.match(riskBuffer!.body, /1 team.*room in the budget.*\$30M avg/is);

  const constrained = view.cards.find((c) => c.id === "constrained-choice");
  assert.ok(constrained, "constrained-choice card should appear once the shock has been applied");
  assert.match(constrained!.body, /rival franchise/);
  assert.match(constrained!.body, /2 of 2/);
});

test("ROUND-2 BLOCKER 2a: SCARCITY's spentToCapCount uses locked-at-time spend, not live post-repair spend", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent exactly $100M at lock — a genuine "spent every last dollar" achievement
  const before = draftDayModule.aggregate(state, "REVEAL") as { spentToCapCount: number };
  assert.equal(before.spentToCapCount, 1);

  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  // Repair with the ONLY thing the $10M budget allows — spend stays at $100M (this alone
  // wouldn't have distinguished the old live-spend bug, since it never drifts off $100M).
  // The bug the verifier actually found was during the window where the slot sits empty:
  const midRepair = draftDayModule.aggregate(shocked.state, "CONSEQUENCE") as { spentToCapCount: number };
  assert.equal(
    midRepair.spentToCapCount,
    1,
    "live spend is $90M right after the shock (slot empty) — spentToCapCount must still read the frozen locked-at-time $100M, not this live dip",
  );

  const repaired = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-10b" }, ctx("ADAPT", "seat-1"));
  assert.equal(repaired.ok, true);
  if (!repaired.ok) throw new Error("unreachable");
  const after = draftDayModule.aggregate(repaired.state, "SYNTHESIS") as { spentToCapCount: number };
  assert.equal(after.spentToCapCount, 1, "still counted after repair — the lock-time achievement never gets un-earned");
});
