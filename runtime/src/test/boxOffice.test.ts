import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PRICE,
  MARKETS,
  MERCH_PER_FAN,
  OVER_ZONE_DEMAND_MULT,
  PAYROLL_TARGET,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  SURPLUS_CREDIT_CAP,
  SWEET_BAND,
  SWEET_ZONE_DEMAND_MULT,
  TV_REVENUE,
  ZONES,
  attendanceFor,
  boxOfficeModule,
  isValidPrice,
  marketSummary,
  payrollTargetForH2,
  peakPriceOf,
  revenueBreakdownFor,
  zoneFor,
  type BoxOfficeState,
  type MarketCard,
  type Zone,
} from "../modules/boxOffice.js";
import { isOrderedSubsequence } from "../shared/phases.js";

const ctx = (phase: string, seatId = "seat-1", seatIds: string[] = ["seat-1", "seat-2", "seat-3", "seat-4"]) => ({
  phase: phase as never,
  seatId,
  seatIds,
  now: Date.now(),
});

const empty = (): BoxOfficeState => boxOfficeModule.initialState({ sessionId: "s1", seatIds: [] });

function expectOk(result: ReturnType<typeof boxOfficeModule.reduce>): BoxOfficeState {
  assert.equal(result.ok, true, !result.ok ? result.reason : undefined);
  if (!result.ok) throw new Error("unreachable");
  return result.state;
}

function setPrice(state: BoxOfficeState, seatId: string, price: number, phase = "PLAY") {
  return boxOfficeModule.reduce(state, { type: "setPrice", price }, ctx(phase, seatId));
}
function lock(state: BoxOfficeState, seatId: string, phase = "PLAY") {
  return boxOfficeModule.reduce(state, { type: "lock" }, ctx(phase, seatId));
}

/** Drives one seat through a full Homestand 1 lock at the given price. */
function lockH1(state: BoxOfficeState, seatId: string, price: number): BoxOfficeState {
  let s = expectOk(setPrice(state, seatId, price, "PLAY"));
  s = expectOk(lock(s, seatId, "PLAY"));
  return s;
}
/** Drives one seat through a full Homestand 2 lock at the given price (H1 must already be locked). */
function lockH2(state: BoxOfficeState, seatId: string, price: number): BoxOfficeState {
  let s = expectOk(setPrice(state, seatId, price, "COUNTERFACTUAL"));
  s = expectOk(lock(s, seatId, "COUNTERFACTUAL"));
  return s;
}

/* -------------------------------------------------------------- phases -- */

test("boxOfficeModule declares the full canonical phase vocabulary in order", () => {
  assert.equal(isOrderedSubsequence(boxOfficeModule.phases), true);
  assert.deepEqual(
    [...boxOfficeModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "ADAPT", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"],
  );
});

/* -------------------------------------------------------------- markets -- */

test("four market cards, distinct ids, distinct peak prices, all peaks inside the dial range", () => {
  assert.equal(MARKETS.length, 4);
  const ids = new Set(MARKETS.map((m) => m.id));
  assert.equal(ids.size, 4);
  const peaks = MARKETS.map((m) => peakPriceOf(m));
  assert.equal(new Set(peaks).size, 4, "peaks should be pairwise distinct so the room doesn't converge on one price");
  for (const p of peaks) {
    assert.ok(p >= PRICE_MIN && p <= PRICE_MAX, `peak ${p} must fall inside [$${PRICE_MIN}, $${PRICE_MAX}]`);
  }
});

test("marketSummary never exposes the demand formula", () => {
  for (const m of MARKETS) {
    const summary = marketSummary(m) as unknown as Record<string, unknown>;
    for (const forbidden of ["baseFans", "sensitivity", "capacity"]) {
      assert.equal(forbidden in summary, false, `marketSummary must not expose "${forbidden}"`);
    }
    assert.deepEqual(Object.keys(summary).sort(), ["flavor", "id", "name"]);
  }
});

test("every market reaches all three zones somewhere on the price grid (a genuinely different Homestand 2 opening is possible for every card)", () => {
  const grid: number[] = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) grid.push(p);
  for (const market of MARKETS) {
    const zonesSeen = new Set(grid.map((p) => zoneFor(p, market)));
    for (const z of ZONES) {
      assert.ok(zonesSeen.has(z), `${market.name} never reaches zone "${z}" across the price grid`);
    }
  }
});

test("zone boundaries: exactly SWEET_BAND from peak is still sweet, one step further is not", () => {
  for (const market of MARKETS) {
    const peak = peakPriceOf(market);
    assert.equal(zoneFor(peak, market), "sweet");
    assert.equal(zoneFor(peak + SWEET_BAND, market), "sweet");
    assert.equal(zoneFor(peak - SWEET_BAND, market), "sweet");
    if (peak + SWEET_BAND + PRICE_STEP <= PRICE_MAX) {
      assert.equal(zoneFor(peak + SWEET_BAND + PRICE_STEP, market), "over");
    }
    if (peak - SWEET_BAND - PRICE_STEP >= PRICE_MIN) {
      assert.equal(zoneFor(peak - SWEET_BAND - PRICE_STEP, market), "under");
    }
  }
});

/* ---------------------------------------------------------- demand model -- */

function revenueSeries(market: MarketCard, zone: Zone | null): number[] {
  const out: number[] = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) out.push(revenueBreakdownFor(p, market, zone).totalRevenue);
  return out;
}

/** True when the series rises (or holds, under a capacity clamp) to a single peak and then only falls. */
function isSinglePeaked(series: readonly number[]): boolean {
  let sawDecrease = false;
  for (let i = 1; i < series.length; i += 1) {
    const delta = series[i]! - series[i - 1]!;
    if (delta > 0) {
      if (sawDecrease) return false; // an increase after a decrease means a second hump
    } else if (delta < 0) {
      sawDecrease = true;
    }
  }
  return true;
}

test("revenue is single-peaked (an honest, discoverable hump, never a needle or a second bump) for every market and every zone", () => {
  for (const market of MARKETS) {
    for (const zone of [null, ...ZONES] as (Zone | null)[]) {
      const series = revenueSeries(market, zone);
      assert.ok(isSinglePeaked(series), `${market.name} / zone=${zone} is not single-peaked: ${series.join(",")}`);
    }
  }
});

test("the hump peak is not at either extreme of the price range for any market at baseline (findable, not obvious)", () => {
  for (const market of MARKETS) {
    const series = revenueSeries(market, null);
    const maxIdx = series.indexOf(Math.max(...series));
    assert.notEqual(maxIdx, 0, `${market.name}'s revenue peaks at the minimum price — too obvious`);
    assert.notEqual(maxIdx, series.length - 1, `${market.name}'s revenue peaks at the maximum price — too obvious`);
  }
});

test("attendance is non-increasing in price for every market/zone (higher price never draws more fans)", () => {
  for (const market of MARKETS) {
    for (const zone of [null, ...ZONES] as (Zone | null)[]) {
      let prev = Infinity;
      for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) {
        const a = attendanceFor(p, market, zone);
        assert.ok(a <= prev, `${market.name}/${zone}: attendance rose from ${prev} to ${a} at price ${p}`);
        prev = a;
      }
    }
  }
});

test("revenue breakdown sums correctly and never goes negative", () => {
  for (const market of MARKETS) {
    for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) {
      const r = revenueBreakdownFor(p, market, null);
      assert.equal(r.ticketRevenue, p * r.attendance);
      assert.equal(r.merchRevenue, r.attendance * MERCH_PER_FAN);
      assert.equal(r.tvRevenue, TV_REVENUE);
      assert.equal(r.totalRevenue, r.ticketRevenue + r.tvRevenue + r.merchRevenue);
      assert.ok(r.attendance >= 0 && r.fillPct >= 0 && r.fillPct <= 100);
    }
  }
});

test("isValidPrice enforces the $5-stepped $10-$120 domain", () => {
  assert.equal(isValidPrice(10), true);
  assert.equal(isValidPrice(120), true);
  assert.equal(isValidPrice(65), true);
  assert.equal(isValidPrice(9), false);
  assert.equal(isValidPrice(121), false);
  assert.equal(isValidPrice(12), false, "not a $5 step");
  assert.equal(isValidPrice("50" as unknown as number), false);
  assert.equal(isValidPrice(NaN), false);
});

/* --------------------------------------------------- homestand-2 inheritance -- */

test("roundTwoOpening: an overpriced Homestand 1 shrinks the true Homestand-2 curve at the same price (fans already gone before touching the dial)", () => {
  for (const market of MARKETS) {
    const price = PRICE_MAX; // deep in "over" territory for every market
    const before = attendanceFor(price, market, null);
    const after = attendanceFor(price, market, "over");
    assert.ok(after <= before, `${market.name}: overpriced Homestand 2 should never draw MORE fans at the same price`);
  }
  assert.ok(OVER_ZONE_DEMAND_MULT < 1, "the over-zone multiplier must shrink the curve");
});

test("roundTwoOpening: a sweet-spot Homestand 1 grows the true Homestand-2 curve at the same price", () => {
  for (const market of MARKETS) {
    const price = peakPriceOf(market);
    const before = attendanceFor(price, market, null);
    const after = attendanceFor(price, market, "sweet");
    assert.ok(after >= before, `${market.name}: sweet-spot Homestand 2 should never draw FEWER fans at the same price`);
  }
  assert.ok(SWEET_ZONE_DEMAND_MULT > 1, "the sweet-zone multiplier must grow the curve");
});

test("roundTwoOpening: payroll target only rises for the underpriced zone, only falls (capped) for sweet, and holds flat for overpriced", () => {
  for (const market of MARKETS) {
    const cheapPrice = PRICE_MIN; // deep "under" for every market
    const richPrice = peakPriceOf(market) + SWEET_BAND + PRICE_STEP; // deep "over" for every market
    const peak = peakPriceOf(market);

    const underTarget = payrollTargetForH2("under", cheapPrice, market);
    assert.ok(underTarget >= PAYROLL_TARGET, "underpriced Homestand 1 must never lower the Homestand 2 bill");

    const overTarget = payrollTargetForH2("over", richPrice, market);
    assert.equal(overTarget, PAYROLL_TARGET, "overpriced zone leaves the payroll target unchanged — its cost is the shrunken crowd, not a cash debt");

    const sweetTarget = payrollTargetForH2("sweet", Math.round(peak / PRICE_STEP) * PRICE_STEP, market);
    assert.ok(sweetTarget <= PAYROLL_TARGET, "sweet-spot Homestand 1 must never raise the Homestand 2 bill");
    assert.ok(PAYROLL_TARGET - sweetTarget <= SURPLUS_CREDIT_CAP, "the sweet-spot credit must stay capped (modest, per spec)");
  }
});

test("roundTwoOpening end-to-end through the reducer: Homestand 2's dial inherits Homestand 1's final price as its starting position", () => {
  const market = MARKETS[0]!;
  const overPrice = Math.min(PRICE_MAX, Math.round((peakPriceOf(market) + SWEET_BAND + 3 * PRICE_STEP) / PRICE_STEP) * PRICE_STEP);
  let s = lockH1(empty(), "seat-1", overPrice);
  assert.equal(s.zone["seat-1"], "over");
  // No action happens between H1's lock and H2's open — state.currentPrice already
  // sits at priceH1, which IS the inherited starting position (no copy step needed).
  assert.equal(s.currentPrice["seat-1"], overPrice);
  const counterfactualView = boxOfficeModule.studentView(s, "seat-1", "COUNTERFACTUAL") as { price: number; zone: string };
  assert.equal(counterfactualView.price, overPrice);
  assert.equal(counterfactualView.zone, "over");
});

/* --------------------------------------------------------- core reducer -- */

test("setPrice rejects outside PLAY/COUNTERFACTUAL", () => {
  const result = setPrice(empty(), "seat-1", 50, "LOBBY");
  assert.equal(result.ok, false);
});

test("setPrice rejects a teacher", () => {
  const result = boxOfficeModule.reduce(empty(), { type: "setPrice", price: 50 }, ctx("PLAY", "teacher"));
  assert.equal(result.ok, false);
});

test("setPrice rejects an invalid price", () => {
  assert.equal(setPrice(empty(), "seat-1", 7).ok, false);
  assert.equal(setPrice(empty(), "seat-1", 500).ok, false);
  assert.equal(setPrice(empty(), "seat-1", 52).ok, false);
});

test("setPrice assigns a market deterministically from seat order, not randomly", () => {
  const s = expectOk(setPrice(empty(), "seat-3", 50, "PLAY"));
  assert.equal(s.seatOrder["seat-3"], 2); // index of "seat-3" in the default ctx() seatIds list
  const view = boxOfficeModule.studentView(s, "seat-3", "PLAY") as { market: { id: string } };
  assert.equal(view.market.id, MARKETS[2 % MARKETS.length]!.id);
});

test("setPrice rejects once Homestand 1 is locked", () => {
  const s = lockH1(empty(), "seat-1", 50);
  const result = setPrice(s, "seat-1", 60, "PLAY");
  assert.equal(result.ok, false);
});

test("lock rejects before any price is set", () => {
  const result = lock(empty(), "seat-1", "PLAY");
  assert.equal(result.ok, false);
});

test("lock rejects a teacher", () => {
  const result = boxOfficeModule.reduce(empty(), { type: "lock" }, ctx("PLAY", "teacher"));
  assert.equal(result.ok, false);
});

test("lock rejects a double-lock of Homestand 1", () => {
  const s = lockH1(empty(), "seat-1", 50);
  const result = lock(s, "seat-1", "PLAY");
  assert.equal(result.ok, false);
});

test("Homestand 2 setPrice/lock rejects before Homestand 1 is locked", () => {
  assert.equal(setPrice(empty(), "seat-1", 50, "COUNTERFACTUAL").ok, false);
  assert.equal(lock(empty(), "seat-1", "COUNTERFACTUAL").ok, false);
});

test("Homestand 2 lock rejects a double-lock", () => {
  let s = lockH1(empty(), "seat-1", 50);
  s = lockH2(s, "seat-1", 60);
  const result = lock(s, "seat-1", "COUNTERFACTUAL");
  assert.equal(result.ok, false);
});

test("full two-homestand flow across all four market cards produces a stored, computed zone every time", () => {
  let s = empty();
  const prices = [15, 50, 90, 120];
  const seatIds = ["seat-1", "seat-2", "seat-3", "seat-4"];
  for (let i = 0; i < seatIds.length; i += 1) {
    s = lockH1(s, seatIds[i]!, prices[i]!);
  }
  for (const seatId of seatIds) {
    assert.ok(s.zone[seatId] === "over" || s.zone[seatId] === "under" || s.zone[seatId] === "sweet");
  }
  for (const seatId of seatIds) {
    s = lockH2(s, seatId, 65);
  }
  for (const seatId of seatIds) {
    assert.equal(s.priceH2[seatId], 65);
  }
});

/* ------------------------------------------------------------ aggregate -- */

test("aggregate tallies zone counts, locked counts, and price stats from real locked state", () => {
  let s = empty();
  s = lockH1(s, "seat-1", 10); // deep under for every market
  s = lockH1(s, "seat-2", 120); // deep over for every market
  s = lockH1(s, "seat-3", Math.round(peakPriceOf(MARKETS[2]!) / PRICE_STEP) * PRICE_STEP); // sweet for seat-3's own market
  const agg = boxOfficeModule.aggregate(s, "SYNTHESIS") as ReturnType<typeof import("../modules/boxOffice.js").boxOfficeModule.aggregate>;
  const a = agg as { totalPairs: number; h1LockedCount: number; zoneCounts: Record<string, number>; minPriceH1: number; maxPriceH1: number };
  assert.equal(a.h1LockedCount, 3);
  assert.equal(a.zoneCounts["under"]! >= 1, true);
  assert.equal(a.zoneCounts["over"]! >= 1, true);
  assert.equal(a.minPriceH1, 10);
  assert.equal(a.maxPriceH1, 120);
});

test("aggregate is null-safe with nobody locked", () => {
  const agg = boxOfficeModule.aggregate(empty(), "SYNTHESIS") as { h1LockedCount: number; avgPriceH1: number | null };
  assert.equal(agg.h1LockedCount, 0);
  assert.equal(agg.avgPriceH1, null);
});

/* --------------------------------------------------------- view privacy -- */

test("studentView (pre-lock PLAY) never leaks the demand formula", () => {
  const s = expectOk(setPrice(empty(), "seat-1", 50, "PLAY"));
  const raw = JSON.stringify(boxOfficeModule.studentView(s, "seat-1", "PLAY"));
  for (const forbidden of ["baseFans", "sensitivity", "capacity", "peak"]) {
    assert.equal(raw.includes(forbidden), false, `studentView leaked "${forbidden}"`);
  }
});

test("studentView never reveals another seat's data — own view only ever reflects the requested seatId", () => {
  let s = lockH1(empty(), "seat-1", 40);
  s = lockH1(s, "seat-2", 100);
  const view1 = boxOfficeModule.studentView(s, "seat-1", "REVEAL") as { price: number | null };
  const view2 = boxOfficeModule.studentView(s, "seat-2", "REVEAL") as { price: number | null };
  assert.equal(view1.price, 40);
  assert.equal(view2.price, 100);
});

test("boardView is never seat-identifying (uses franchise identities, not seat ids)", () => {
  let s = lockH1(empty(), "seat-1", 40);
  s = lockH1(s, "seat-2", 100);
  const raw = JSON.stringify(boxOfficeModule.boardView(s, "REVEAL"));
  assert.equal(raw.includes("seat-1"), false);
  assert.equal(raw.includes("seat-2"), false);
  for (const forbidden of ["baseFans", "sensitivity", "capacity"]) {
    assert.equal(raw.includes(forbidden), false, `boardView leaked "${forbidden}"`);
  }
});

test("teacherView is explicitly seat-identifying (unlike boardView) so the console can show who's locked", () => {
  const s = lockH1(empty(), "seat-1", 40);
  const raw = JSON.stringify(boxOfficeModule.teacherView(s, "PLAY"));
  assert.equal(raw.includes("seat-1"), true);
});

test("CONSEQUENCE banner names the real zone title and cites real numbers, not canned text", () => {
  const market = MARKETS[0]!;
  const overPrice = Math.min(PRICE_MAX, Math.round((peakPriceOf(market) + SWEET_BAND + 2 * PRICE_STEP) / PRICE_STEP) * PRICE_STEP);
  const s = lockH1(empty(), "seat-1", overPrice);
  const view = boxOfficeModule.studentView(s, "seat-1", "CONSEQUENCE") as { title: string; zone: string; message: string };
  assert.equal(view.zone, "over");
  assert.equal(view.title, "EMPTY SEATS");
  assert.match(view.message, /\$/); // cites a real dollar/attendance figure, not a placeholder
});

test("SYNTHESIS board cards are grounded in this session's own aggregate numbers", () => {
  let s = empty();
  s = lockH1(s, "seat-1", 10);
  s = lockH1(s, "seat-2", 120);
  const view = boxOfficeModule.boardView(s, "SYNTHESIS") as { cards: { id: string; body: string }[] };
  const revenueCard = view.cards.find((c) => c.id === "revenue")!;
  assert.ok(revenueCard.body.includes("2 pairs"), "revenue card should cite the real locked count");
});
