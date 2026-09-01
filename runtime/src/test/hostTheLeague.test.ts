/**
 * Module 2 · Lesson 2 "You Don't Play Alone" — reducer and property tests.
 *
 * Four jobs:
 *  1. the runtime contract (phases, action gating, teacher hooks, seating);
 *  2. PRIVACY — no view on any surface at any phase carries a hidden demand
 *     constant, another desk's cash, or a seat identity on the projector;
 *  3. the INTERDEPENDENCE IDENTITY (BC-5): a home week's crowd and its dollars
 *     decompose exactly into this-building-and-this-price + my-own-Draw +
 *     the-visitor's-Draw, with residual 0 and no negative block, everywhere in
 *     the reachable state space;
 *  4. determinism — bots, schedule and the star departure are pure functions of
 *     state, so the same session replays to the same numbers every time.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  BARS_PER_PAGE,
  BOT_SHARES,
  CLUBS,
  DRAW_MAX,
  DRAW_MIN,
  DRAW_START,
  MARKET_PROFILES,
  MAX_DESKS,
  NATIONAL,
  OFFSETS,
  PRICE_GRID,
  PRICE_MAX,
  PRICE_MIN,
  REVEAL_STEPS,
  SHARE_GRID,
  SHARE_MAX,
  WEEK_COUNT,
  botShareFor,
  computeAggregate,
  drawGain,
  hostSlotFor,
  hostTheLeagueModule,
  localMediaFor,
  nextDraw,
  scheduleFor,
  settleHome,
  synthesisCards,
  visitorSlotFor,
  type HostLeagueState,
} from "../modules/hostTheLeague.js";
import { isOrderedSubsequence, type CanonicalPhase } from "../shared/phases.js";
import type { LessonAction, SeatId } from "../shared/lessonModule.js";

/* ------------------------------------------------------------- helpers -- */

const ctx = (phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") => ({
  phase,
  seatId,
  seatIds: ["seat-1", "seat-2", "seat-3", "seat-4"],
  now: 0,
});

const empty = (): HostLeagueState => hostTheLeagueModule.initialState({ sessionId: "s1", seatIds: [] });

function ok(result: ReturnType<typeof hostTheLeagueModule.reduce>): HostLeagueState {
  assert.equal(result.ok, true, result.ok ? "" : `expected ok, got: ${result.reason}`);
  return (result as { ok: true; state: HostLeagueState }).state;
}
function bad(result: ReturnType<typeof hostTheLeagueModule.reduce>): string {
  assert.equal(result.ok, false, "expected rejection");
  return (result as { ok: false; reason: string }).reason;
}
function act(state: HostLeagueState, action: LessonAction, phase: CanonicalPhase, seatId: SeatId | "teacher" = "seat-1") {
  return hostTheLeagueModule.reduce(state, action, ctx(phase, seatId));
}

function seated(count: number): HostLeagueState {
  let state = empty();
  for (let i = 1; i <= count; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  return state;
}

/** Plays one week for every seated desk at the given dials, then closes the week. */
function playWeek(state: HostLeagueState, price: (i: number) => number, share: (i: number) => number): HostLeagueState {
  let next = state;
  const seats = Object.keys(next.seatToSlot);
  seats.forEach((seatId, i) => {
    next = ok(act(next, { type: "setPrice", price: price(i) }, "PLAY", seatId));
    next = ok(act(next, { type: "setShare", share: share(i) }, "PLAY", seatId));
    next = ok(act(next, { type: "lock" }, "PLAY", seatId));
  });
  return ok(act(next, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
}

function fullSession(desks = 6): HostLeagueState {
  let state = seated(desks);
  const prices = [24, 44, 60, 36, 78, 52, 30, 66, 40, 56, 20, 90];
  const shares = [0, 20, 40, 10, 30, 5, 15, 25, 35, 0, 40, 10];
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    state = playWeek(
      state,
      (i) => prices[(i + w) % prices.length]!,
      (i) => shares[(i + w * 3) % shares.length]!,
    );
  }
  return state;
}

function walk(value: unknown, path: string, onNumber: (n: number, p: string) => void, onKey: (k: string) => void): void {
  if (typeof value === "number") return onNumber(value, path);
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, onNumber, onKey));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      onKey(k);
      walk(v, `${path}.${k}`, onNumber, onKey);
    }
  }
}

/** Hidden demand parameters. None of these may ever be a key in any view. */
const FORBIDDEN_KEYS = [
  "base0",
  "sens",
  "ownDrawFans",
  "visitorDrawFans",
  "effortScale",
  "drawDollars",
  "localBase",
  "ancillary",
  "profileId",
  "seatToSlot",
  "curve",
  "hidden",
];

const ALL_PHASES = hostTheLeagueModule.phases;

/* ----------------------------------------------------- runtime contract -- */

test("hostTheLeague declares an ordered subsequence of the canonical phases", () => {
  assert.equal(isOrderedSubsequence(hostTheLeagueModule.phases), true);
  assert.deepEqual(
    [...hostTheLeagueModule.phases],
    ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "ARGUE", "SYNTHESIS", "COMPLETE"],
  );
  assert.equal(hostTheLeagueModule.id, "m2l2-host-league");
});

test("desks claim clubs in join order and the league grows to keep spare clubs", () => {
  const state = seated(5);
  assert.deepEqual(
    Object.keys(state.seatToSlot).map((s) => state.seatToSlot[s]),
    [0, 1, 2, 3, 4],
  );
  assert.equal(state.deskCount, 5);
  assert.ok(state.leagueSize >= 7, `league should keep spare clubs, got ${state.leagueSize}`);
  assert.ok(state.clubs.slice(0, state.leagueSize).some((c) => c.seatId === null), "at least one bot club must exist");
  // Idempotent.
  const again = ok(act(state, { type: "takeSeat" }, "LOBBY", "seat-1"));
  assert.deepEqual(again.seatToSlot, state.seatToSlot);
});

test("the league seats at most MAX_DESKS and refuses the next one with a reason", () => {
  let state = empty();
  for (let i = 1; i <= MAX_DESKS; i += 1) state = ok(act(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`));
  assert.equal(state.deskCount, MAX_DESKS);
  const reason = bad(act(state, { type: "takeSeat" }, "LOBBY", `seat-${MAX_DESKS + 1}`));
  assert.match(reason, /full/);
});

test("phase guards: dials only in PLAY, teacher hooks only from the teacher", () => {
  const state = seated(4);
  assert.match(bad(act(state, { type: "setPrice", price: 40 }, "HOOK")), /only run a week during PLAY/);
  assert.match(bad(act(state, { type: "lock" }, "REVEAL")), /only run a week during PLAY/);
  assert.match(bad(act(state, { type: "teacher:closeWeek" }, "PLAY", "seat-1")), /only the teacher/);
  assert.match(bad(act(state, { type: "teacher:closeWeek" }, "HOOK", "teacher")), /weeks close during PLAY/);
  assert.match(bad(act(state, { type: "setPrice", price: 40 }, "PLAY", "teacher")), /only a seated pair/);
  assert.match(bad(act(state, { type: "takeSeat" }, "REVEAL", "seat-9")), /clubs are handed out/);
  assert.match(bad(act(state, { type: "nope" }, "PLAY")), /unknown action/);
});

test("dial validation rejects off-grid prices and shares", () => {
  const state = seated(2);
  assert.match(bad(act(state, { type: "setPrice", price: 41 }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setPrice", price: PRICE_MAX + 2 }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setPrice", price: "40" }, "PLAY")), /in \$2 steps/);
  assert.match(bad(act(state, { type: "setShare", share: 7 }, "PLAY")), /5-point steps/);
  assert.match(bad(act(state, { type: "setShare", share: SHARE_MAX + 5 }, "PLAY")), /5-point steps/);
  for (const p of [PRICE_MIN, 44, PRICE_MAX]) ok(act(state, { type: "setPrice", price: p }, "PLAY"));
  for (const s of SHARE_GRID) ok(act(state, { type: "setShare", share: s }, "PLAY"));
});

test("a locked desk cannot change its dials until the week closes", () => {
  let state = seated(2);
  state = ok(act(state, { type: "setPrice", price: 44 }, "PLAY"));
  state = ok(act(state, { type: "lock" }, "PLAY"));
  assert.match(bad(act(state, { type: "setPrice", price: 60 }, "PLAY")), /locked/);
  state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  ok(act(state, { type: "setPrice", price: 60 }, "PLAY"));
});

test("the week bell auto-commits an unlocked desk at its house price, marked AUTO, never a zero", () => {
  let state = seated(3);
  state = ok(act(state, { type: "setPrice", price: 90 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "lock" }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  const slot2 = state.seatToSlot["seat-2"]!;
  const w = state.clubs[slot2]!.weeks[0]!;
  assert.equal(w.auto, true);
  assert.equal(w.share, 0);
  assert.ok(w.home.turnout > 0, "an auto-committed desk still plays a real week");
  assert.equal(state.clubs[state.seatToSlot["seat-1"]!]!.weeks[0]!.auto, false);
});

test("leaving PLAY settles every remaining week and releases the bar; leaving REVEAL plays out the stages", () => {
  let state = seated(4);
  state = ok(act(state, { type: "setPrice", price: 50 }, "PLAY", "seat-1"));
  state = hostTheLeagueModule.onPhaseExit!(state, "PLAY", "REVEAL");
  assert.equal(state.weekIndex, WEEK_COUNT);
  assert.equal(state.barReleased, true);
  // D17's honour-what-was-submitted precedent: the week that was open commits
  // on the dial the pair actually moved, not on the house price.
  assert.equal(state.clubs[state.seatToSlot["seat-1"]!]!.weeks[0]!.price, 50);
  state = hostTheLeagueModule.onPhaseExit!(state, "REVEAL", "ADAPT");
  assert.equal(state.revealStage, REVEAL_STEPS);
});

test("teacher pacing hooks are gated and cannot be double-fired", () => {
  let state = seated(6);
  assert.match(bad(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher")), /close week 1 first/);
  state = playWeek(state, () => 44, () => 20);
  state = ok(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher"));
  assert.equal(state.barReleased, true);
  assert.match(bad(act(state, { type: "teacher:handedTo" }, "PLAY", "teacher")), /already up/);
  assert.match(bad(act(state, { type: "teacher:revealNext" }, "PLAY", "teacher")), /during REVEAL/);
  for (let i = 0; i < REVEAL_STEPS; i += 1) state = ok(act(state, { type: "teacher:revealNext" }, "REVEAL", "teacher"));
  assert.match(bad(act(state, { type: "teacher:revealNext" }, "REVEAL", "teacher")), /already played/);
});

test("the bar pager wraps in both directions and never leaves a dead control", () => {
  let state = fullSession(12);
  const rows = computeAggregate(state).homeRevenueDecomposition.length;
  const pages = Math.ceil(rows / BARS_PER_PAGE);
  assert.ok(pages > 1, "12 desks must need more than one projector group");
  for (let i = 0; i < pages; i += 1) state = ok(act(state, { type: "teacher:barPage" }, "REVEAL", "teacher"));
  assert.equal(state.barPage, 0, "paging all the way round returns to the first group");
  state = ok(act(state, { type: "teacher:barPageBack" }, "REVEAL", "teacher"));
  assert.equal(state.barPage, pages - 1);
});

/* -------------------------------------------------- the schedule and bots -- */

test("every club hosts exactly one and visits exactly one, every week, with no self-hosting", () => {
  for (let size = 6; size <= CLUBS.length; size += 1) {
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      const pairs = scheduleFor(w, size);
      assert.equal(pairs.length, size);
      const hosts = new Set(pairs.map((p) => p.host));
      const visitors = new Set(pairs.map((p) => p.visitor));
      assert.equal(hosts.size, size, `week ${w} size ${size}: a club hosts twice`);
      assert.equal(visitors.size, size, `week ${w} size ${size}: a club travels twice`);
      for (const p of pairs) assert.notEqual(p.host, p.visitor, "a club may never host itself");
      for (const p of pairs) {
        assert.equal(visitorSlotFor(p.host, w, size), p.visitor);
        assert.equal(hostSlotFor(p.visitor, w, size), p.host);
      }
    }
    // No pairing repeats across the three weeks.
    const seen = new Set<string>();
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      for (const p of scheduleFor(w, size)) {
        const key = `${p.host}>${p.visitor}`;
        assert.equal(seen.has(key), false, `pairing ${key} repeats at size ${size}`);
        seen.add(key);
      }
    }
  }
  assert.deepEqual([...OFFSETS], [1, 2, 3]);
});

test("most live desks host another live desk — an interdependence lesson cannot be mostly bots", () => {
  for (const deskCount of [4, 6, 8, 12, 15]) {
    const state = seated(deskCount);
    let liveHostedLive = 0;
    let total = 0;
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      for (let slot = 0; slot < deskCount; slot += 1) {
        total += 1;
        if (visitorSlotFor(slot, w, state.leagueSize) < deskCount) liveHostedLive += 1;
      }
    }
    // At the smallest supported class the ring is tightest and the floor is
    // lowest; from eight desks up it should be the overwhelming majority.
    const bar = deskCount >= 8 ? 0.7 : 0.55;
    assert.ok(
      liveHostedLive / total >= bar,
      `${deskCount} desks: only ${liveHostedLive}/${total} home weeks host a live desk`,
    );
    // and every desk hosts a live desk at least once across the three weeks
    for (let slot = 0; slot < deskCount; slot += 1) {
      const any = [0, 1, 2].some((w) => visitorSlotFor(slot, w, state.leagueSize) < deskCount);
      assert.ok(any, `${deskCount} desks: desk ${slot + 1} never hosts a live desk`);
    }
  }
});

test("bot policy is deterministic, ladder-based, and never reads a desk's decisions", () => {
  for (let slot = 0; slot < CLUBS.length; slot += 1) {
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      const a = botShareFor(slot, w, false);
      const b = botShareFor(slot, w, false);
      assert.equal(a, b);
      assert.equal(a, BOT_SHARES[(slot + w) % BOT_SHARES.length]);
      assert.equal(botShareFor(slot, w, true), 0, "a club that just lost its star is not spending");
    }
  }
});

test("the same session replays to identical numbers — no RNG anywhere", () => {
  const a = fullSession(8);
  const b = fullSession(8);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.deepEqual(computeAggregate(a), computeAggregate(b));
});

test("the star departure is exogenous, lands on a league-office club, and is announced before week 2 is priced", () => {
  let state = seated(6);
  assert.equal(state.shockSlot, null, "nothing is announced before week 1 is played");
  state = playWeek(state, () => 44, () => 40);
  assert.notEqual(state.shockSlot, null, "the departure is set the moment week 2 opens");
  const shock = state.clubs[state.shockSlot!]!;
  assert.equal(shock.seatId, null, "the shock never lands on a desk that reinvested — it is exogenous");
  assert.equal(shock.starGone, true);
  assert.ok(shock.draw <= 15, `the shock must bite, got Draw ${shock.draw}`);
  // It is on the pre-commit student payload for every desk, before any dial moves.
  for (const seatId of Object.keys(state.seatToSlot)) {
    const v = hostTheLeagueModule.studentView(state, seatId, "PLAY") as Record<string, unknown>;
    const s = v["shock"] as { line: string } | null;
    assert.ok(s && s.line.includes("lost their best player"), "week 2's card must print the departure before commitment");
  }
});

/* ----------------------------------- the interdependence identity (BC-5) -- */

test("a home week decomposes EXACTLY into building+price, own Draw and visitor Draw — residual 0, no negative block", () => {
  let states = 0;
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 5) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 5) {
        for (const price of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, price);
          states += 1;
          assert.equal(s.bareFans + s.ownFans + s.visitorFans, s.turnout, `fans residual at ${profile.id} ${hd}/${vd}/$${price}`);
          assert.equal(
            s.bareDollars + s.ownDollars + s.visitorDollars,
            s.doorMoney,
            `dollars residual at ${profile.id} ${hd}/${vd}/$${price}`,
          );
          assert.equal(s.gate + s.inArena, s.doorMoney);
          assert.ok(s.bareFans >= 0 && s.ownFans >= 0 && s.visitorFans >= 0, "no block may be negative");
          assert.ok(s.turnout <= capacity, "turnout may never exceed the building");
        }
      }
    }
  }
  assert.ok(states > 15_000, `sweep must be wide, only covered ${states} states`);
});

test("delete the visitor term and every home week returns the identical number — C5's instantiation test", () => {
  // The contract's INSTANTIATION test, run as arithmetic: if the visiting
  // club's Draw did not enter the host's demand, holding everything else fixed
  // would leave the gate unchanged. It does not.
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    const low = settleHome(profile, capacity, 40, 15, 44);
    const high = settleHome(profile, capacity, 40, 90, 44);
    assert.notEqual(low.turnout, high.turnout);
    assert.ok(
      high.turnout >= low.turnout * 1.8,
      `${profile.id}: a Draw-90 visitor must roughly double a Draw-15 visitor's crowd (got ${low.turnout} -> ${high.turnout})`,
    );
    assert.ok(high.visitorDollars > high.bareDollars * 0.5, `${profile.id}: the marquee visitor block must be material`);
  }
});

test("the money one desk's Draw earns on the road is exactly the visitor block on the host's books", () => {
  const state = fullSession(8);
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    for (const w of club.weeks) {
      const host = state.clubs[w.roadHostSlot]!;
      const hostWeek = host.weeks.find((x) => x.week === w.week)!;
      assert.equal(w.roadDollars, hostWeek.home.visitorDollars, "the road number must be the host's own visitor block");
      assert.equal(w.roadTurnoutLift, hostWeek.home.visitorFans);
    }
  }
});

test("the aggregate's per-desk decomposition closes to the desk's own total, every desk", () => {
  const agg = computeAggregate(fullSession(10));
  assert.ok(agg.homeRevenueDecomposition.length >= 10);
  for (const row of agg.homeRevenueDecomposition) {
    assert.equal(row.residual, 0);
    assert.equal(row.fromBuilding + row.fromOwnDraw + row.fromVisitorDraw + row.localMedia + row.national, row.total);
    assert.ok(row.fromVisitorDraw >= 0 && row.fromOwnDraw >= 0 && row.fromBuilding >= 0);
    assert.equal(row.visitors.length, row.weeksPlayed);
  }
  // Rows are ordered by desk number, never by money (R13).
  const numbers = agg.homeRevenueDecomposition.map((r) => r.deskNumber);
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
});

/* --------------------------------------------------- the economic shape -- */

test("the national cheque is identical for every club and is the tallest single pipe", () => {
  const agg = computeAggregate(fullSession(8));
  const nationals = new Set(agg.pipes.map((p) => p.national));
  assert.equal(nationals.size, 1, "the national cheque must be identical for every club");
  let nationalTallest = 0;
  for (const p of agg.pipes) {
    assert.equal(p.national, NATIONAL * p.gate / Math.max(1, p.gate) > 0 ? p.national : p.national);
    assert.ok(p.national >= p.inArena, `${p.deskHandle}: national is beaten by in-arena spend`);
    // The C3 payload is "the money you control least pays you most", and it is
    // true for almost every club — but it is NOT rigged. A desk that prices
    // high into marquee visitors can out-gate the cheque, and a big market that
    // reinvests hard can out-earn it on local media (which is realistic: the
    // Lakers' local deal ran about three quarters of a per-club national share
    // in the leaked year). Its own bar says so, and the director tells the
    // teacher to ask that desk what it did.
    if (p.national >= p.gate && p.national >= p.localMedia) nationalTallest += 1;
    assert.ok(p.gatePct <= 45, `${p.deskHandle}: gate share ${p.gatePct}% is implausible for an NBA club`);
  }
  assert.ok(
    nationalTallest >= Math.ceil(agg.pipes.length * 0.6),
    `the national cheque is the tallest pipe for only ${nationalTallest} of ${agg.pipes.length} desks`,
  );
});

test("no fixed reinvest share is cash-best for every market, and the best share falls as the season runs out", () => {
  const best = (profileId: string, weeksLeft: number): number => {
    const profile = MARKET_PROFILES.find((m) => m.id === profileId)!;
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    let door = 0;
    let bestPrice = PRICE_MIN;
    for (const price of PRICE_GRID) {
      const s = settleHome(profile, capacity, DRAW_START, DRAW_START, price);
      if (s.doorMoney > door) {
        door = s.doorMoney;
        bestPrice = price;
      }
    }
    const perPoint =
      settleHome(profile, capacity, DRAW_START + 1, DRAW_START, bestPrice).doorMoney -
      settleHome(profile, capacity, DRAW_START, DRAW_START, bestPrice).doorMoney +
      profile.drawDollars;
    let bestNet = -Infinity;
    let bestShare = 0;
    for (const share of SHARE_GRID) {
      const spend = Math.round((share / 100) * door);
      const gain = nextDraw(profile, DRAW_START, spend) - nextDraw(profile, DRAW_START, 0);
      const net = gain * perPoint * weeksLeft - spend;
      if (net > bestNet) {
        bestNet = net;
        bestShare = share;
      }
    }
    return bestShare;
  };
  const bigWeek1 = best("new-york", 2);
  const smallWeek1 = best("memphis", 2);
  assert.notEqual(bigWeek1, smallWeek1, "big and small markets must not share one optimal reinvest share");
  assert.ok(bigWeek1 > 0 && bigWeek1 < SHARE_MAX, `the big market's best share must be interior, got ${bigWeek1}`);
  assert.ok(smallWeek1 > 0 && smallWeek1 < SHARE_MAX, `the small market's best share must be interior, got ${smallWeek1}`);
  assert.ok(best("new-york", 1) < bigWeek1, "the best share must fall as the payoff horizon shortens");
  assert.equal(best("new-york", 0), 0, "on the last week the cash-best share is zero, and the screen says so");
});

test("Draw's ceiling is market-independent and its returns diminish", () => {
  // The ceiling is an ASYMPTOTE, not the top of the scale: gain shrinks toward
  // the cap while decay does not, so Draw settles where the two meet. The
  // design's requirement is that the settling point is IDENTICAL for every
  // market, which is what makes "a big market cannot buy dominance" structural.
  const ceilingOf = (profile: (typeof MARKET_PROFILES)[number]): number => {
    let d = DRAW_MIN;
    for (let i = 0; i < 200; i += 1) d = nextDraw(profile, d, 1_000_000_000);
    return d;
  };
  const ceilings = new Set(MARKET_PROFILES.map(ceilingOf));
  assert.equal(ceilings.size, 1, `markets settle at different Draw ceilings: ${[...ceilings].join(", ")}`);
  assert.ok([...ceilings][0]! >= 80 && [...ceilings][0]! < DRAW_MAX, "the ceiling must be high and below the top of the scale");
  for (const profile of MARKET_PROFILES) {
    assert.equal(nextDraw(profile, DRAW_MIN, 0), DRAW_MIN, "the floor is hard");
    const small = drawGain(profile, DRAW_START, profile.effortScale);
    const big = drawGain(profile, DRAW_START, profile.effortScale * 4);
    assert.ok(big > small, "more money buys more Draw");
    assert.ok(big < small * 2, "but with sharply diminishing returns");
    assert.ok(
      drawGain(profile, 85, profile.effortScale * 4) < drawGain(profile, 30, profile.effortScale * 4),
      "a club near the ceiling gains less than one far from it",
    );
  }
});

test("every club clears its weekly bill from every reachable state at some legal price (R5)", () => {
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 10) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 10) {
        let clears = false;
        for (const price of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, price);
          if (s.doorMoney + localMediaFor(profile, hd) + NATIONAL - profile.bill >= 0) clears = true;
        }
        assert.ok(clears, `${profile.id} cannot clear its bill at Draw ${hd}/${vd}`);
      }
    }
  }
});

test("every building can reach a full house, and the cash-best price moves with the visitor", () => {
  for (const profile of MARKET_PROFILES) {
    const capacity = CLUBS.find((c) => c.profileId === profile.id)!.capacity;
    let maxFill = 0;
    for (const price of PRICE_GRID) maxFill = Math.max(maxFill, settleHome(profile, capacity, 90, 90, price).fillPct);
    assert.ok(maxFill >= 95, `${profile.id} can only reach ${maxFill}% fill`);

    const argmax = (vd: number): number => {
      let best = -1;
      let bestPrice = PRICE_MIN;
      for (const price of PRICE_GRID) {
        const s = settleHome(profile, capacity, DRAW_START, vd, price);
        if (s.doorMoney > best) {
          best = s.doorMoney;
          bestPrice = price;
        }
      }
      return bestPrice;
    };
    assert.ok(argmax(90) - argmax(15) >= 20, `${profile.id}: the best price must move with the visitor's Draw`);
  }
});

/* ---------------------------------------------------------- the privacy -- */

test("the pre-lock student view carries nothing derived from the pending dials", () => {
  let state = seated(4);
  state = ok(act(state, { type: "setPrice", price: 66 }, "PLAY", "seat-1"));
  state = ok(act(state, { type: "setShare", share: 35 }, "PLAY", "seat-1"));
  const view = hostTheLeagueModule.studentView(state, "seat-1", "PLAY");

  const slot = state.seatToSlot["seat-1"]!;
  const club = state.clubs[slot]!;
  const profile = MARKET_PROFILES.find((m) => m.id === club.profileId)!;
  const capacity = CLUBS[slot]!.capacity;
  const visitor = state.clubs[visitorSlotFor(slot, 0, state.leagueSize)]!;
  const outcome = settleHome(profile, capacity, club.draw, visitor.draw, 66);

  const numbers: number[] = [];
  const keys: string[] = [];
  walk(view, "$", (n) => numbers.push(n), (k) => keys.push(k));
  for (const [label, quantity] of Object.entries({
    turnout: outcome.turnout,
    gate: outcome.gate,
    inArena: outcome.inArena,
    doorMoney: outcome.doorMoney,
    visitorDollars: outcome.visitorDollars,
    bareDollars: outcome.bareDollars,
  })) {
    if (quantity === 0) continue;
    assert.equal(numbers.includes(quantity), false, `pre-lock view leaked ${label} (${quantity})`);
  }
  for (const key of keys) {
    for (const word of ["preview", "project", "estimate", "expected", "forecast"]) {
      assert.equal(key.toLowerCase().includes(word), false, `pre-lock view carries a "${key}" field`);
    }
  }
});

test("no view on any surface, at any phase, carries a hidden demand constant", () => {
  let state = fullSession(6);
  state = { ...state, barReleased: true, revealStage: REVEAL_STEPS };
  const views: unknown[] = [];
  for (const phase of ALL_PHASES) {
    for (const seatId of Object.keys(state.seatToSlot)) views.push(hostTheLeagueModule.studentView(state, seatId, phase));
    views.push(hostTheLeagueModule.teacherView(state, phase));
    views.push(hostTheLeagueModule.boardView(state, phase));
  }
  views.push(hostTheLeagueModule.aggregate(state, "SYNTHESIS"));

  for (const view of views) {
    walk(view, "$", () => {}, (key) => {
      assert.equal(FORBIDDEN_KEYS.includes(key), false, `view leaked a hidden parameter under key "${key}"`);
    });
  }

  // Structural absence is not enough: assert the actual constants never appear.
  // Every profile's base0 strictly exceeds the biggest building in the league,
  // so a crowd can never collide with one by accident.
  // `base0`, `effortScale` and `localBase` are the three constants a leak would
  // actually be worth something: base0 is the demand intercept, effortScale is
  // the Draw exchange rate, localBase is the market's structural media money.
  // None of them is a quantity any view legitimately publishes.
  const forbidden = new Set<number>();
  for (const m of MARKET_PROFILES) {
    forbidden.add(m.base0);
    forbidden.add(m.effortScale);
    forbidden.add(m.localBase);
  }
  for (const view of views) {
    walk(view, "$", (n, path) => {
      assert.equal(forbidden.has(n), false, `view leaked a hidden constant (${n}) at ${path}`);
    }, () => {});
  }
});

test("a student view never carries another desk's cash, and the board never carries a seat identity", () => {
  const state = fullSession(6);
  const cashByDesk = new Map<number, number>();
  for (const c of state.clubs) if (c.seatId) cashByDesk.set(c.slot, c.cash);

  for (const seatId of Object.keys(state.seatToSlot)) {
    const mine = state.seatToSlot[seatId]!;
    for (const phase of ALL_PHASES) {
      const view = hostTheLeagueModule.studentView(state, seatId, phase);
      const numbers: number[] = [];
      walk(view, "$", (n) => numbers.push(n), () => {});
      for (const [slot, cash] of cashByDesk) {
        if (slot === mine || cash === 0) continue;
        assert.equal(numbers.includes(cash), false, `desk ${mine + 1}'s ${phase} view carries desk ${slot + 1}'s cash`);
      }
      assert.equal(JSON.stringify(view).includes("seat-"), false, `student view leaked a seat id in ${phase}`);
    }
  }

  assert.equal(hostTheLeagueModule.boardView.length, 2, "boardView must take (state, phase) only");
  for (const phase of ALL_PHASES) {
    const raw = JSON.stringify(hostTheLeagueModule.boardView(state, phase));
    for (const seatId of Object.keys(state.seatToSlot)) {
      assert.equal(raw.includes(seatId), false, `board view leaked seat id ${seatId} in ${phase}`);
    }
    // No board surface may carry cash at all — that is the money leaderboard D4
    // and R13 forbid, and it is the one number this lesson keeps private.
    const numbers: number[] = [];
    walk(JSON.parse(raw), "$", (n) => numbers.push(n), () => {});
    for (const cash of cashByDesk.values()) {
      if (cash === 0) continue;
      assert.equal(numbers.includes(cash), false, `board view carries a desk's cash in ${phase}`);
    }
  }
});

test("the board never ranks a desk by money — bar and ledger rows come out in desk order", () => {
  const state = { ...fullSession(9), barReleased: true, revealStage: 1 };
  const board = hostTheLeagueModule.boardView(state, "REVEAL") as Record<string, unknown>;
  const bars = board["bars"] as { deskHandle: string }[];
  const numbers = bars.map((b) => Number(b.deskHandle.replace(/^Desk (\d+).*$/, "$1")));
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
  const agg = computeAggregate(state);
  assert.deepEqual(
    agg.giveAndTake.map((g) => g.deskNumber),
    [...agg.giveAndTake.map((g) => g.deskNumber)].sort((a, b) => a - b),
  );
});

/* --------------------------------------------------- reveal and synthesis -- */

test("the board shows nothing about a week that is still open", () => {
  let state = seated(5);
  state = ok(act(state, { type: "setPrice", price: 40 }, "PLAY", "seat-1"));
  const board = hostTheLeagueModule.boardView(state, "PLAY") as Record<string, unknown>;
  assert.deepEqual(board["bars"], []);
  assert.equal(board["barReleased"], false);
  assert.ok(Array.isArray(board["pairings"]), "the schedule IS public before the commitment");
});

test("every reveal stage renders its own beat and nothing else", () => {
  let state = fullSession(6);
  const seen: string[] = [];
  for (let i = 1; i <= REVEAL_STEPS; i += 1) {
    state = ok(act({ ...state, revealStage: i - 1 }, { type: "teacher:revealNext" }, "REVEAL", "teacher"));
    const board = hostTheLeagueModule.boardView(state, "REVEAL") as Record<string, unknown>;
    assert.equal(board["revealStage"], i);
    assert.ok(String(board["stageHeadline"] ?? "").length > 0, `stage ${i} has no headline`);
    seen.push(String(board["stageHeadline"]));
    const populated = [
      (board["bars"] as unknown[]).length > 0,
      (board["ledger"] as unknown[]).length > 0,
      (board["pipes"] as unknown[]).length > 0,
      board["smallMarketPath"] !== null,
      board["meanShareByWeek"] !== null,
    ].filter(Boolean).length;
    assert.equal(populated, 1, `stage ${i} put ${populated} panels on the projector at once`);
  }
  assert.equal(new Set(seen).size, REVEAL_STEPS, "every stage must be its own beat");
});

test("synthesis cards are computed from the room's own weeks and name the class's own numbers", () => {
  const state = fullSession(8);
  const agg = computeAggregate(state);
  const cards = synthesisCards(state, agg);
  assert.ok(cards.length >= 4);
  const ids = cards.map((c) => c.id);
  assert.deepEqual(ids, ["shared-product", "spillover", "composition", "market-size", "beyond"]);
  for (const c of cards) assert.ok(c.body.length > 60, `card ${c.id} is empty`);
  // The shared-product card quotes a real matchup from this room.
  const biggest = [...agg.visitorLedger].sort((a, b) => b.gateLift - a.gateLift)[0]!;
  assert.ok(cards[0]!.body.includes(biggest.visitorClub), "the shared-product card must quote the room's own biggest matchup");
  // With no weeks played, the deck degrades to one honest placeholder.
  const emptyCards = synthesisCards(empty(), computeAggregate(empty()));
  assert.equal(emptyCards.length, 1);
});

test("the director layer covers every phase with a minute budget and something to do", () => {
  const state = fullSession(6);
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const d = view["director"] as { minuteBudget: string; now: string[]; ask: unknown[]; timeCut: string };
    assert.ok(d.minuteBudget.length > 0, `${phase} has no minute budget`);
    assert.ok(d.now.length > 0, `${phase} has no NOW`);
    assert.ok(d.ask.length > 0, `${phase} has no ASK`);
    assert.ok(d.timeCut.length > 0, `${phase} has no TIME CUT`);
    const projector = view["projectorNow"] as { title: string; lines: string[] };
    assert.ok(projector.title.length > 0, `${phase} has no projector mirror`);
    assert.ok(projector.lines.length > 0, `${phase} projector mirror is empty`);
  }
  const play = hostTheLeagueModule.teacherView(state, "PLAY") as Record<string, unknown>;
  assert.ok((play["simplifications"] as unknown[]).length >= 6, "the simplifications ledger must ship on the teacher surface");
  assert.ok((play["studentScreen"] as string[]).length > 0);
});

test("watch flags never name a desk that is not there, and never fire empty", () => {
  const state = fullSession(6);
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const flags = view["watchFor"] as { id: string; desks: string[] }[];
    for (const f of flags) assert.ok(f.desks.length > 0, `flag ${f.id} fired with no desks`);
  }
});

test("a late desk inherits a club the league office has been running, marked as covered", () => {
  let state = seated(5);
  state = playWeek(state, () => 44, () => 20);
  state = ok(act(state, { type: "takeSeat" }, "PLAY", "seat-late"));
  const slot = state.seatToSlot["seat-late"]!;
  const club = state.clubs[slot]!;
  assert.equal(club.joinedAtWeek, 2);
  assert.equal(club.weeks.length, 1, "the club kept playing while nobody was at the desk");
  assert.equal(club.weeks[0]!.stock, true, "and its own screen says so");
  assert.notEqual(club.cash, 0);
  assert.notEqual(slot, state.shockSlot, "a late desk is never handed the club whose star just left");
});
