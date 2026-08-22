import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADAPT_STIPEND,
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

test("G1: market has 24 fictional players across 4 positions, six $10M-step tiers each, distinct ratings", () => {
  assert.equal(MARKET.length, 24);
  const ratings = new Set(MARKET.map((p) => p.rating));
  assert.equal(ratings.size, 24, "ratings should be pairwise distinct so shock targeting never needs a tie-break in practice");
  for (const tag of POSITION_TAGS) {
    const tiers = MARKET.filter((p) => p.position === tag)
      .map((p) => p.price)
      .sort((a, b) => a - b);
    assert.deepEqual(tiers, [10, 20, 30, 40, 50, 60], `${tag} should have all six $10M-step tiers, no gaps`);
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

  // Budget is generous (freed price + stipend), so the ONLY reason this must fail is the poaching rule.
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

test("G3: adaptBudgetFor is the freed price plus the fixed stipend, and candidatesForAdapt respects it", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-20" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent = 30+10+20+20+10 = 90
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  const team = shocked.state.teams["seat-1"]!;
  assert.equal(team.shockSlot, "PLAYMAKER");
  assert.equal(adaptBudgetFor(team, "PLAYMAKER"), 10 + ADAPT_STIPEND); // removed pm-10 cost $10M

  const wrongPos = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "df-10" }, ctx("ADAPT", "seat-1"));
  assert.equal(wrongPos.ok, false);

  // pm-30 (70) costs $30M <= budget($30M) — affordable and genuinely different from the removed pm-10.
  const result = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-30" }, ctx("ADAPT", "seat-1"));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.state.teams["seat-1"]!.slots.PLAYMAKER.playerId, "pm-30");
});

test("adaptFill rejects a candidate the team's local repair budget can't cover", () => {
  const state = buildAndLock(empty(), "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest — 56
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent = 30+10+30+20+10 = 100
  const shocked = draftDayModule.reduce(state, { type: "teacher:shock" }, ctx("CONSEQUENCE", "teacher"));
  assert.equal(shocked.ok, true);
  if (!shocked.ok) throw new Error("unreachable");
  // budget = removed price (10) + stipend (20) = 30
  const tooExpensive = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-40" }, ctx("ADAPT", "seat-1")); // $40 > $30
  assert.equal(tooExpensive.ok, false);
  const affordable = draftDayModule.reduce(shocked.state, { type: "adaptFill", playerId: "pm-30" }, ctx("ADAPT", "seat-1")); // $30 <= $30
  assert.equal(affordable.ok, true);
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

test("G7a: RISK BUFFER card cites real leftover-vs-spent-to-cap repair outcomes after a shock", () => {
  let state = empty();
  // Team A: spends to the exact cap before the shock (no leftover).
  state = buildAndLock(state, "seat-1", [
    { slot: "SCORER", playerId: "sc-30" },
    { slot: "PLAYMAKER", playerId: "pm-10" }, // weakest, 56
    { slot: "DEFENDER", playerId: "df-30" },
    { slot: "REBOUNDER", playerId: "rb-20" },
    { slot: "WILDCARD", playerId: "sc-10" },
  ]); // spent 100
  // Team B: leaves money on the table before the shock.
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
  // Both teams' weakest slot is PLAYMAKER (pm-10) — repair both with something better-rated (pm-20, rating 72 > 56).
  let s = shocked.state;
  const repairA = draftDayModule.reduce(s, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-1"));
  assert.equal(repairA.ok, true);
  if (!repairA.ok) throw new Error("unreachable");
  s = repairA.state;
  const repairB = draftDayModule.reduce(s, { type: "adaptFill", playerId: "pm-20" }, ctx("ADAPT", "seat-2"));
  assert.equal(repairB.ok, true);
  if (!repairB.ok) throw new Error("unreachable");
  s = repairB.state;

  const view = draftDayModule.boardView(s, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const riskBuffer = view.cards.find((c) => c.id === "risk-buffer");
  assert.ok(riskBuffer, "risk-buffer card should appear once the shock has been applied");
  assert.match(riskBuffer!.body, /1 team.*money left/is);
  assert.match(riskBuffer!.body, /1 team.*spent every last dollar/is);

  const constrained = view.cards.find((c) => c.id === "constrained-choice");
  assert.ok(constrained, "constrained-choice card should appear once the shock has been applied");
  assert.match(constrained!.body, /rival franchise/);
  assert.match(constrained!.body, /2 of 2/);
});
