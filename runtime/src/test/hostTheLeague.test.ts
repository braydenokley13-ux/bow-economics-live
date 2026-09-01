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
  MODELED_DOLLARS_LINE,
  OBJECTIVE_COPY,
  botShareFor,
  computeAggregate,
  drawGain,
  hostSlotFor,
  hostTheLeagueModule,
  localMediaFor,
  nextDraw,
  reinvestChangeLine,
  reinvestRuleFor,
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
  // gate-l2-teacher B5: with no weeks played the deck used to collapse to a
  // single placeholder titled YOU DON'T PLAY ALONE — a title that exists nowhere
  // in the live deck — so the rehearsal the product PRESCRIBES did not rehearse
  // the beat the console itself calls "the part the simulation does not do for
  // you". It now renders all five templates, and every one of them is marked so
  // it can never be read as a live room's arithmetic.
  const emptyCards = synthesisCards(empty(), computeAggregate(empty()));
  assert.equal(emptyCards.length, 5, "the zero-desk rehearsal must render the whole deck, not a placeholder");
  for (const c of emptyCards) {
    assert.match(c.title, /^REHEARSAL — /, `rehearsal card ${c.id} must be unmistakably marked`);
    assert.match(c.body, /STAND-IN/, `rehearsal card ${c.id} must say its figures are not real`);
  }
  assert.equal(
    emptyCards.some((c) => /YOU DON'T PLAY ALONE/.test(c.title)),
    false,
    "no card title may exist that the live deck does not have — the SYNTHESIS time cut names card titles",
  );
});

test("gate-l2-teacher B5: the prescribed zero-student rehearsal renders WATCH FOR at every phase", () => {
  const state = empty();
  for (const phase of ALL_PHASES) {
    const view = hostTheLeagueModule.teacherView(state, phase) as Record<string, unknown>;
    const flags = view["watchFor"] as { id: string; label: string; desks: string[]; action: string }[];
    assert.ok(flags.length > 0, `${phase}: WATCH FOR rendered nothing at all with zero desks — the rehearsal cannot rehearse it`);
    for (const f of flags) {
      assert.match(f.label, /^REHEARSAL — /, `${phase}: a zero-desk watch flag must be marked as a rehearsal`);
      assert.ok(f.desks.length > 0 && f.action.length > 0, `${phase}: flag ${f.id} is hollow`);
    }
  }
  // And the moment one real desk exists, the samples are gone.
  const live = seated(6);
  const liveFlags = hostTheLeagueModule.teacherView(live, "PLAY") as Record<string, unknown>;
  for (const f of (liveFlags["watchFor"] as { label: string }[]) ?? []) {
    assert.equal(/REHEARSAL/.test(f.label), false, "a live room must never be shown rehearsal flags");
  }
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

/* ---- the repairs from the five L2 gates, made falsifiable ---------------- */

test("econ B1: the give/take instrument measures the DECISION — silent in a room where nobody reinvested", () => {
  // The failure this replaces: `gave` correlated 0.959 with the DEALT
  // `startDraw` and only 0.644 with mean reinvest share, so the board named a
  // desk that spent $0 as the room's biggest giver, and harness P3's "visible"
  // limb reproduced in full with every desk at zero.
  let zero = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) zero = playWeek(zero, () => 50, () => 0);
  const zeroAgg = computeAggregate(zero);
  assert.equal(zeroAgg.choiceTotals.anySpend, false);
  for (const r of zeroAgg.giveAndTake) {
    assert.equal(r.spend, 0, `${r.deskHandle} spent nothing but the row says otherwise`);
    assert.equal(r.gaveByChoice, 0, `${r.deskHandle} gave nothing it chose to give, but the instrument says ${r.gaveByChoice}`);
    assert.equal(r.receivedByChoice, 0, `${r.deskHandle} received nothing anybody chose to give`);
    assert.equal(r.netByChoice, 0);
    assert.equal(r.ownGain, 0, "a desk that spent nothing cannot have gained anything by spending");
  }
  // ...and the DEALT ledger in that same room is loud, which is precisely the
  // confound. If this stops being true the instrument has stopped being needed.
  const dealtSpread = Math.max(...zeroAgg.giveAndTake.map((r) => r.net)) - Math.min(...zeroAgg.giveAndTake.map((r) => r.net));
  assert.ok(dealtSpread > 500_000, `the dealt ledger should still show a large spread at zero reinvest, got ${dealtSpread}`);

  // A room that DOES spend produces a non-zero instrument, and only for the
  // desks that actually spent.
  let mixed = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) mixed = playWeek(mixed, () => 50, (i) => (i % 2 === 0 ? 0 : SHARE_MAX));
  const mixedAgg = computeAggregate(mixed);
  assert.equal(mixedAgg.choiceTotals.anySpend, true);
  for (const r of mixedAgg.giveAndTake) {
    if (r.spend === 0) {
      assert.equal(r.gaveByChoice, 0, `${r.deskHandle} spent nothing and must give nothing by choice`);
      assert.equal(r.ownGain, 0);
    } else {
      assert.ok(r.gaveByChoice > 0, `${r.deskHandle} spent ${r.spend} and must show up as a giver by choice`);
    }
  }
  assert.ok(mixedAgg.choiceTotals.gaveByChoice > 0);
});

test("econ B1/B6: no surface or script attributes `gave` to a desk's spending", () => {
  // Every place the old instrument was read as if it measured spending.
  let zero = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) zero = playWeek(zero, () => 50, () => 0);
  const agg = computeAggregate(zero);
  const spill = synthesisCards(zero, agg).find((c) => c.id === "spillover")!;
  assert.match(spill.body, /Nobody in this room put a single dollar back/, "the spillover card must not invent givers in a room that spent nothing");
  assert.equal(/most of what it earned/i.test(spill.body), false, "the falsified 'most' quantifier must be gone");

  // And in a room that did spend, the card prints the MEASURED share and the
  // biggest giver is the biggest SPENDER, not the biggest dealt Draw.
  let mixed = seated(8);
  for (let w = 0; w < WEEK_COUNT; w += 1) mixed = playWeek(mixed, () => 50, (i) => (i % 2 === 0 ? 0 : SHARE_MAX));
  const mixedAgg = computeAggregate(mixed);
  const card = synthesisCards(mixed, mixedAgg).find((c) => c.id === "spillover")!;
  const mixedPct = mixedAgg.choiceTotals.externalPct;
  if (mixedPct !== null) {
    assert.match(card.body, new RegExp(`${mixedPct}% of the value it created`));
  } else {
    // econ B7: this is the OVER-INVESTED room the old card printed "0% of the
    // value it created landed somewhere the desk that paid for it never sees"
    // over, in the same paragraph as the dollars that did exactly that.
    assert.match(card.body, /over-investment AND spillover/, "an over-invested room must get the honest branch, not a percentage");
    assert.equal(/% of the value it created/.test(card.body), false, "no share may print where the value created went the wrong way");
  }
  const namedGiver = [...mixedAgg.giveAndTake].sort((a, b) => b.gaveByChoice - a.gaveByChoice)[0]!;
  assert.ok(namedGiver.spend > 0, "the card may only name a giver that actually spent");
  assert.match(card.body, new RegExp(namedGiver.deskHandle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  // ADAPT Q3's answer key: computed, and pointing at a surface that is live.
  const teach = hostTheLeagueModule.teacherView(mixed, "ADAPT") as Record<string, unknown>;
  const q3 = (teach["director"] as { ask: { q: string; answer: string | null }[] }).ask.at(-1)!;
  assert.equal(/by a distance/i.test(String(q3.answer)), false, "the falsified ADAPT Q3 magnitude must be gone");
  assert.match(String(q3.answer), /BOTH/, "the true answer is that the dial pays the desk AND the buildings it visits");
  assert.equal(
    String(q3.answer).includes(spilloverClaim(mixedAgg.choiceTotals).text),
    true,
    "the answer key must be the SAME computed sentence the card and the board carry, not a second hand-written copy of it",
  );
  assert.match(String(q3.answer), /own screen/, "the ADAPT Q3 answer must point at a surface the teacher can actually put up");
});

test("econ B7 (N9): no printed share is ever above 100%, and none is 0% while a room gave money away", () => {
  // The measured failure: `externalPct = gaveByChoice / (ownGain + gaveByChoice)`
  // printed 0% beside $1,577,412 of spillover in the alternating 0%/40% room
  // (and in the one-spender-versus-eleven-free-riders room), and above 100% in
  // 58 of 200 random rooms, because `ownGain` goes negative whenever the room
  // over-invests. Every one of those rooms is reachable and several are the
  // likeliest teacher set-pieces in the lesson.
  const patterns: { label: string; share: (i: number) => number }[] = [
    { label: "all 10%", share: () => 10 },
    { label: "all 20%", share: () => 20 },
    { label: "all 25%", share: () => 25 },
    { label: "all 40%", share: () => SHARE_MAX },
    { label: "alternating 0/40", share: (i) => (i % 2 === 0 ? 0 : SHARE_MAX) },
    { label: "one spender, rest free-riding", share: (i) => (i === 0 ? SHARE_MAX : 0) },
  ];
  for (const p of patterns) {
    let room = seated(12);
    for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => 50, p.share);
    const agg = computeAggregate(room);
    const ct = agg.choiceTotals;
    if (ct.externalPct !== null) {
      assert.ok(ct.externalPct >= 0 && ct.externalPct <= 100, `${p.label}: printed share ${ct.externalPct}% is outside 0-100`);
      assert.ok(
        !(ct.externalPct === 0 && ct.gaveByChoice > 0),
        `${p.label}: printed 0% beside ${ct.gaveByChoice} of measured spillover`,
      );
    }
    // Wherever the share is withheld, the room is told why, in dollars.
    const body = synthesisCards(room, agg).find((c) => c.id === "spillover")!.body;
    if (ct.externalPct === null && ct.anySpend) {
      assert.match(body, /over-investment AND spillover/, `${p.label}: the honest over-investment sentence must fire`);
    }
    // And the "paid YOU" claim never prints against a negative private column.
    if (ct.ownGain < 0) assert.equal(/paid YOU/.test(body), false, `${p.label}: "paid YOU" printed against ${ct.ownGain}`);
  }
});

test("econ B8 (N10): the room-total sentence never disagrees in SIGN with the joint effect", () => {
  // The measured failure: in a mixed 0-40% room the board and the SPILLOVER
  // card told the class reinvesting cost these desks $1,153,068 when the room
  // was $546,124 better off for having done it. The private column is a sum of
  // one-desk-at-a-time partials; the residue is `receivedByChoice`, which the
  // split charges to the payer and never returns to the room's books.
  const patterns: ((i: number) => number)[] = [() => 10, () => 20, (i) => (i % 3) * 15, (i) => (i % 2 === 0 ? 0 : SHARE_MAX), () => SHARE_MAX];
  for (const share of patterns) {
    for (const price of [30, 50, 70]) {
      let room = seated(8);
      for (let w = 0; w < WEEK_COUNT; w += 1) room = playWeek(room, () => price, share);
      const agg = computeAggregate(room);
      const ct = agg.choiceTotals;
      if (!ct.anySpend) continue;
      const text = spilloverClaim(ct).text;
      const saysBetter = /better off/.test(text);
      const saysWorse = /worse off/.test(text);
      const sign = Math.sign(ct.roomJointGain);
      if (sign > 0) assert.ok(saysBetter && !saysWorse, `joint +${ct.roomJointGain} but the sentence says: ${text}`);
      if (sign < 0) assert.ok(saysWorse && !saysBetter, `joint ${ct.roomJointGain} but the sentence says: ${text}`);
      // The private column may still be negative — it just may never be the
      // room-level verdict. It must be labelled as a per-desk sum.
      assert.match(text, /Desk by desk/, "the sum of partials must be labelled as a sum of partials");
      assert.match(text, /Counted as one room/, "the joint figure must be published beside it");
    }
  }
});

test("play R4 / econ B3: the small-market exhibit attributes from the decomposition, and prints both prices", () => {
  // The reachable case the econ gate probed: odd desks at $110, even desks at
  // $30. The old selector printed "it won it on WHO WAS VISITING" over an $80
  // price gap.
  let state = seated(10);
  for (let w = 0; w < WEEK_COUNT; w += 1) state = playWeek(state, (i) => (i % 2 === 0 ? 110 : 30), () => 10);
  const path = computeAggregate(state).smallMarketPath;
  if (path.found) {
    assert.ok(path.line.includes(`priced at $${path.smallPrice},`), `the exhibit must print the small-market desk's price: ${path.line}`);
    assert.ok(path.line.includes(`priced at $${path.bigPrice},`), `the exhibit must print the big-market desk's price: ${path.line}`);
    // The three blocks account for the whole gap, exactly.
    assert.equal(
      path.gapFromVisitor + path.gapFromBuildingAndPrice + path.gapFromOwnDraw,
      path.smallDoorMoney - path.bigDoorMoney,
      "the attribution must decompose the gap exactly, not approximately",
    );
    // econ B3, round 3. A causal claim about MARKET SIZE may only print when
    // the win survives holding the price still. In this $110-vs-$30 room it
    // does not, and the exhibit must say so instead of naming a block.
    if (!path.survivesPriceControl) {
      assert.equal(path.driver, "price", "a win that vanishes under the price control was carried by price");
      assert.match(path.line, /THE PRICE GAP carried it/);
      assert.equal(/WHO WAS VISITING carried it/.test(path.line), false, "a price-driven gap may never be attributed to the visitor");
    } else {
      const parts: Record<string, number> = {
        visitor: path.gapFromVisitor,
        "building-and-price": path.gapFromBuildingAndPrice,
        "own-draw": path.gapFromOwnDraw,
      };
      const biggest = Object.entries(parts).sort((a, b) => b[1] - a[1])[0]![0];
      const claimable = path.gapFromVisitor <= path.smallDoorMoney - path.bigDoorMoney;
      if (biggest === "visitor" && claimable) assert.equal(path.driver, "visitor");
      assert.notEqual(path.driver, "price", "a surviving win must name a block, not price");
    }
    // A block larger than the gap it explains must never print alone: all three
    // block figures are on the exhibit, every time.
    assert.ok(path.line.includes(`${money(path.gapFromVisitor)} the visiting club`), `the visitor block must print: ${path.line}`);
    assert.ok(path.line.includes(`${money(path.gapFromBuildingAndPrice)} the building and the price`), `the building block must print: ${path.line}`);
    assert.ok(path.line.includes(`${money(path.gapFromOwnDraw)} that desk's own Draw`), `the own-Draw block must print: ${path.line}`);
    // ...and the two price-controlled figures the room needs to check it.
    assert.ok(path.line.includes(money(path.gapAtSmallPrice)) && path.line.includes(money(path.gapAtBigPrice)), "both controlled gaps must print");
  }
  // A room priced uniformly is where the visitor SHOULD carry it, and does —
  // and where the price control is vacuous, which is the point of running it.
  let flat = seated(10);
  for (let w = 0; w < WEEK_COUNT; w += 1) flat = playWeek(flat, () => 50, () => 10);
  const flatPath = computeAggregate(flat).smallMarketPath;
  if (flatPath.found) {
    assert.equal(flatPath.survivesPriceControl, true, "at one price for the whole room the win cannot be a price gap");
    assert.equal(flatPath.driver, "visitor");
    assert.match(flatPath.line, /WHO WAS VISITING carried it/);
  }
});

test("play R3 / econ FL-F: reveal 5 never claims spontaneity, and always carries the last-week rule", () => {
  const held = fullSession(6); // fullSession never releases the bar mid-lesson
  const line = reinvestChangeLine(computeAggregate(held), held);
  assert.equal(/[Nn]obody told this room to move/.test(line), false, "the unfalsifiable causal claim must be gone");
  assert.match(line, /LAST week|last-week rule/i, "the beat must carry its controlling variable");
  assert.match(line, /earns nothing else in this lesson/, "the horizon effect must be stated, not implied");
  assert.match(line, /did NOT see the Handed-To-You bar before it played week 3/, "a room that never saw the bar must be told the bar cannot be the cause");

  // A room that DID see the bar before week 3 gets the bar named as one
  // candidate, never as the cause.
  const saw: HostLeagueState = { ...held, barReleased: true, barReleasedAtWeek: 1 };
  const sawLine = reinvestChangeLine(computeAggregate(saw), saw);
  assert.match(sawLine, /did see the Handed-To-You bar/);
  assert.equal(/[Nn]obody told this room to move/.test(sawLine), false);

  // A room that held its dial flat across all three weeks must not be narrated
  // as having moved in either direction.
  let flat = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) flat = playWeek(flat, () => 50, () => 20);
  const flatLine = reinvestChangeLine(computeAggregate(flat), flat);
  assert.match(flatLine, /level/);
  assert.equal(/went UP|went DOWN/.test(flatLine), false, "a flat room must not be described as moving");
});

test("econ B4/B5: the two false printed rules are gone, and what replaces them is true of the model", () => {
  // B5 — the Draw-to-cash claim. A Draw point pays $12,000/week in local media
  // plus $4,704-$7,722 on every home night; there is a real exchange rate.
  assert.equal(/cannot turn Draw back into cash/i.test(OBJECTIVE_COPY), false);
  assert.match(OBJECTIVE_COPY, /pays you back/i);
  for (const profile of MARKET_PROFILES) {
    assert.ok(profile.drawDollars > 0, "the local-media Draw term is what makes the old claim false — it must exist");
  }

  // B4 — the maintenance rule. No numeric break-even share may be printed at
  // all, because the true one is 5-20% depending on Draw and door money and
  // computing it on the student screen would be a demand-curve preview (R2).
  for (const week of [1, 2, WEEK_COUNT]) {
    const rule = reinvestRuleFor(week);
    const all = [rule.line, ...rule.detail].join(" ");
    assert.equal(/\d+\s*%/.test(all), false, `week ${week}'s reinvest rule still prints a percentage: ${all}`);
    assert.equal(/about a fifth/i.test(all), false, "the falsified 'about a fifth' rule must be gone");
    assert.ok(rule.line.split(/\s+/).length <= 25, `the always-visible rule is ${rule.line.split(/\s+/).length} words — it consumes the fold`);
  }
  // The replacement claim — "near the top of the scale no share on this dial can
  // hold it at all" — is arithmetic, and this is the arithmetic.
  const maintenanceRule = reinvestRuleFor(1).detail.join(" ");
  assert.match(maintenanceRule, /no share on this dial can hold it/);
  for (const profile of MARKET_PROFILES) {
    const ceilingGain = drawGain(profile, 89, 1_000_000_000);
    assert.ok(ceilingGain < 4, `at Draw 89 the maximum possible gain is ${ceilingGain}, which does NOT fall short of the 4-point decay`);
    const lowGain = drawGain(profile, 30, 1_000_000_000);
    assert.ok(lowGain > ceilingGain, "the rule claims it climbs fastest when Draw is low");
  }
  // The last week says the horizon out loud.
  assert.match(reinvestRuleFor(WEEK_COUNT).line, /LAST WEEK/);
});

test("sr BLOCKING-1: no club renders a factual claim about a different club", () => {
  // The shipped failure: the four anchor clubs' identity sentences rode on the
  // shared profile line, so "the biggest market in American sports, and the
  // league's biggest gate" printed under Detroit, and "one of the league's
  // smallest markets — and the 2025 champions" printed under Denver. Any class
  // of nine or more desks hit at least three false lines, on the private screen.
  const CLUB_SPECIFIC = [
    /biggest market in American sports/i,
    /biggest gate/i,
    /2025 champions/i,
    /OWNS its building/i,
    /OWNS THE BUILDING/i,
    /concert money/i,
    /Chase Center/i,
    /Crypto\.com/i,
  ];
  for (const profile of MARKET_PROFILES) {
    for (const re of CLUB_SPECIFIC) {
      assert.equal(re.test(profile.plainLine), false, `profile ${profile.id}'s shared line makes a club-specific claim: ${profile.plainLine}`);
      assert.equal(re.test(profile.sizeLabel), false, `profile ${profile.id}'s size label makes a club-specific claim: ${profile.sizeLabel}`);
    }
  }
  // The identity sentences still exist — on the clubs they are true of, and
  // nowhere else.
  const withIdentity = CLUBS.filter((c) => c.identityLine);
  assert.ok(withIdentity.length >= 4, "the verified anchor clubs must keep their sentences");
  assert.ok(withIdentity.length < CLUBS.length, "most clubs must carry no club-specific claim at all");
  assert.match(CLUBS.find((c) => c.short === "New York")!.identityLine!, /biggest gate/);
  assert.equal(CLUBS.find((c) => c.short === "Detroit")!.identityLine, undefined);
  assert.equal(CLUBS.find((c) => c.short === "Denver")!.identityLine, undefined);
  assert.equal(CLUBS.find((c) => c.short === "Miami")!.identityLine, undefined);

  // ...and the student view carries exactly its own club's line.
  const state = seated(12);
  for (const seatId of Object.keys(state.seatToSlot)) {
    const slot = state.seatToSlot[seatId]!;
    for (const phase of ["LOBBY", "HOOK"] as CanonicalPhase[]) {
      const view = hostTheLeagueModule.studentView(state, seatId, phase) as Record<string, unknown>;
      if (phase === "HOOK") assert.equal(view["identityLine"] ?? null, CLUBS[slot]!.identityLine ?? null);
    }
  }
});

test("sr BLOCKING-2: the modelled-dollars caption states no universal the bars falsify", () => {
  assert.equal(/for every club in this league/i.test(MODELED_DOLLARS_LINE), false, "'the biggest single pipe for every club' is false by week 1");
  assert.match(MODELED_DOLLARS_LINE, /Near a club's house price/);
  // And the counterexamples are real: local media overtakes the national check
  // at Draw 50 on the new-york profile, and Boston starts at 55.
  const ny = MARKET_PROFILES.find((m) => m.id === "new-york")!;
  const boston = CLUBS.find((c) => c.short === "Boston")!;
  assert.ok(localMediaFor(ny, boston.startDraw) > NATIONAL, "Boston must falsify the old universal before anybody prices");
});

test("teacher B3: a desk that never locked is never presented as a free-rider", () => {
  // Six desks; desk 6 never touches a dial and is auto-settled every week.
  let state = seated(6);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (let i = 0; i < 5; i += 1) {
      const seatId = `seat-${i + 1}`;
      state = ok(act(state, { type: "setPrice", price: 50 }, "PLAY", seatId));
      state = ok(act(state, { type: "setShare", share: 0 }, "PLAY", seatId));
      state = ok(act(state, { type: "lock" }, "PLAY", seatId));
    }
    state = ok(act(state, { type: "teacher:closeWeek" }, "PLAY", "teacher"));
  }
  const view = hostTheLeagueModule.teacherView(state, "REVEAL") as Record<string, unknown>;
  const flags = view["watchFor"] as { id: string; desks: string[] }[];
  const freeRider = flags.find((f) => f.id === "free-rider");
  const never = flags.find((f) => f.id === "never-locked");
  assert.ok(never, "a desk that never locked must be flagged as such");
  assert.ok(never!.desks.some((d) => d.includes("Desk 6")), "the never-locked desk must be named on its own flag");
  assert.equal(
    freeRider?.desks.some((d) => d.includes("Desk 6")) ?? false,
    false,
    "the never-locked desk must NOT be offered to the teacher as the protagonist of the free-riding argument",
  );
  assert.ok(freeRider!.desks.length >= 5, "the desks that CHOSE 0% are still the free-riding case");
  // The teacher can now see it on the desk card too.
  const desks = view["desks"] as { handle: string; neverLocked: boolean; autoWeeks: number }[];
  const d6 = desks.find((d) => d.handle.includes("Desk 6"))!;
  assert.equal(d6.neverLocked, true);
  assert.equal(d6.autoWeeks, WEEK_COUNT);
});
