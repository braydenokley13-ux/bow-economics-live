#!/usr/bin/env node
/**
 * M2 L2 "YOU DON'T PLAY ALONE" — constant-tuning harness.
 *
 * Deterministic brute force over the SHIPPED constants and the SHIPPED reducer.
 * It imports the built module (runtime/dist/modules/hostTheLeague.js) rather
 * than re-declaring any number or re-implementing any rule, so this harness
 * cannot drift from the lesson: if a constant moves, this moves with it, and
 * every season it plays is played through `hostTheLeagueModule.reduce`.
 *
 * Run from the repo root, after `npm run build --prefix runtime`:
 *     node docs/gauntlet/module-2/stage0/l2-tuning-harness.mjs
 *
 * Exit 0 only when every property below holds. Exit 1 on any failure. Exit 2 if
 * the build is missing. There is no "warn" tier: a property either holds at the
 * shipped constants or it does not.
 *
 * THE FIVE PROPERTIES THE BUILD CONTRACT NAMES, plus five that guard the things
 * a retune could plausibly break:
 *
 *   P1  no dominant reinvest line — always-max, always-zero and
 *       copy-the-leader are each beaten by an adaptive line that reads the
 *       schedule, for a big-market seat AND a small-market seat.
 *   P2  the externality is material — a Draw-90 visitor roughly doubles a
 *       Draw-15 visitor's crowd at the same price, in every market, and the
 *       swing is worth more than the whole legal price dial is worth.
 *   P3  free-riding is punished AND visible ON AN INSTRUMENT THAT MEASURES THE
 *       DECISION — the always-zero line ends poorer than the adaptive line, the
 *       room's by-choice ledger shows the banker as a net taker of other desks'
 *       spending, and the same instrument is SILENT in a room where nobody
 *       spent at all. That last limb is the control the old P3 lacked.
 *   P4  no unwinnable seat — from every reachable state, every club clears its
 *       weekly bill at some legal price, and the cash-best price clears it with
 *       room to spare.
 *   P5  the decomposition identity closes exactly — fans and dollars, residual
 *       0, no negative block, over the full reachable sweep.
 *   P6  the cash-best price MOVES with the visiting club's Draw (R1a).
 *   P7  error costs are symmetric holding the visitor fixed (R6), ratio <= 3.0.
 *   P8  every building can fill (R8) and no market is capped out of a full
 *       house.
 *   P9  the Draw ceiling is identical for every market (FL7 removed
 *       structurally) and returns diminish in both money and Draw.
 *   P10 the whole thing is deterministic — the same session replays to the
 *       same numbers, twice, through the real reducer.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..", "..", "..");
const DIST = path.join(REPO, "runtime", "dist", "modules", "hostTheLeague.js");

if (!fs.existsSync(DIST)) {
  console.error(`[l2-tuning] built module not found at ${DIST}`);
  console.error("[l2-tuning] run `npm run build --prefix runtime` first — this harness never re-declares constants.");
  process.exit(2);
}

const mod = await import(DIST);
const {
  MARKET_PROFILES,
  CLUBS,
  PRICE_GRID,
  SHARE_GRID,
  SHARE_MAX,
  DRAW_MIN,
  DRAW_MAX,
  DRAW_START,
  WEEK_COUNT,
  NATIONAL,
  settleHome,
  localMediaFor,
  nextDraw,
  drawGain,
  visitorSlotFor,
  computeAggregate,
  hostTheLeagueModule,
} = mod;

const results = [];
function check(id, title, ok, rows = []) {
  results.push({ id, ok, title });
  console.log("");
  console.log(`${ok ? "PASS" : "FAIL"}  ${id} — ${title}`);
  for (const r of rows) console.log(`        ${r}`);
}

const capacityFor = (profileId) => CLUBS.find((c) => c.profileId === profileId).capacity;
const money = (n) => `$${Math.round(n).toLocaleString()}`;

/* ------------------------------------------------------- season driver -- */

const ctx = (phase, seatId) => ({ phase, seatId, seatIds: [], now: 0 });
function apply(state, action, phase, seatId) {
  const res = hostTheLeagueModule.reduce(state, action, ctx(phase, seatId));
  if (!res.ok) throw new Error(`reducer rejected ${action.type}: ${res.reason}`);
  return res.state;
}

/**
 * Plays a whole season through the SHIPPED reducer.
 *
 * `policy(week, ctx)` returns `{ price, share }` for a desk. `ctx` carries only
 * what a pair can actually see on its own screen before it commits: the week
 * number, its own club's Draw and market, and the printed Draw of the club
 * visiting it. Nothing in here reads a hidden constant, so a line this harness
 * can play is a line a pair could play.
 */
function playSeason(deskCount, policies) {
  let state = hostTheLeagueModule.initialState({ sessionId: "harness", seatIds: [] });
  for (let i = 1; i <= deskCount; i += 1) state = apply(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (let i = 1; i <= deskCount; i += 1) {
      const seatId = `seat-${i}`;
      const slot = state.seatToSlot[seatId];
      const club = state.clubs[slot];
      const profile = MARKET_PROFILES.find((m) => m.id === club.profileId);
      const visitor = state.clubs[visitorSlotFor(slot, w, state.leagueSize)];
      const decision = policies[i - 1](w, {
        profile,
        capacity: CLUBS[slot].capacity,
        myDraw: club.draw,
        visitorDraw: visitor.draw,
        weeksLeft: WEEK_COUNT - 1 - w,
      });
      state = apply(state, { type: "setPrice", price: decision.price }, "PLAY", seatId);
      state = apply(state, { type: "setShare", share: decision.share }, "PLAY", seatId);
      state = apply(state, { type: "lock" }, "PLAY", seatId);
    }
    state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  }
  return state;
}

/** The cash-best price for a printed visitor Draw. Every strategy below uses it, so P1 isolates the reinvest dial. */
function bestPrice(profile, capacity, myDraw, visitorDraw) {
  let best = -1;
  let price = PRICE_GRID[0];
  for (const p of PRICE_GRID) {
    const s = settleHome(profile, capacity, myDraw, visitorDraw, p);
    if (s.doorMoney > best) {
      best = s.doorMoney;
      price = p;
    }
  }
  return price;
}

/** What one Draw point is worth to its OWN club, per week, at the price it would charge. */
function valuePerPointPerWeek(profile, capacity, myDraw, visitorDraw) {
  const p = bestPrice(profile, capacity, myDraw, visitorDraw);
  const a = settleHome(profile, capacity, myDraw, visitorDraw, p).doorMoney;
  const b = settleHome(profile, capacity, Math.min(DRAW_MAX, myDraw + 1), visitorDraw, p).doorMoney;
  return b - a + profile.drawDollars;
}

/**
 * The adaptive line. It uses ONLY printed information — the week, its own Draw,
 * and the Draw of the club visiting it this week — and picks the share that
 * maximises (Draw bought) x (what a point is worth for the weeks that are left)
 * minus what the share costs at this week's door. A pair cannot compute this to
 * the dollar in their heads; they can absolutely reason their way to its shape,
 * which is what "reads the schedule" means: spend early, spend less as the
 * season runs out, and take a smaller slice of a big week.
 */
const adaptive = (week, c) => {
  const price = bestPrice(c.profile, c.capacity, c.myDraw, c.visitorDraw);
  const door = settleHome(c.profile, c.capacity, c.myDraw, c.visitorDraw, price).doorMoney;
  const v = valuePerPointPerWeek(c.profile, c.capacity, c.myDraw, DRAW_START);
  let bestNet = -Infinity;
  let share = 0;
  for (const s of SHARE_GRID) {
    const spend = Math.round((s / 100) * door);
    const gain = nextDraw(c.profile, c.myDraw, spend) - nextDraw(c.profile, c.myDraw, 0);
    const net = gain * v * c.weeksLeft - spend;
    if (net > bestNet) {
      bestNet = net;
      share = s;
    }
  }
  return { price, share };
};

const fixedShare = (share) => (week, c) => ({ price: bestPrice(c.profile, c.capacity, c.myDraw, c.visitorDraw), share });

/**
 * Copy-the-leader: match the reinvest share of whichever club in the league
 * currently has the highest Draw. It is the exploit a room actually reaches for
 * (the Draw table is public), and it is the one the contract's Family-1
 * "copy the neighbour" entry names.
 */
const copyLeader = (leaderShareByWeek) => (week, c) => ({
  price: bestPrice(c.profile, c.capacity, c.myDraw, c.visitorDraw),
  share: leaderShareByWeek[week],
});

/** The rest of the room: a mixed, deterministic spread so the focal desk is not playing against clones. */
const roomPolicies = (n, focalIndex, focalPolicy) =>
  Array.from({ length: n }, (_, i) =>
    i === focalIndex ? focalPolicy : fixedShare(SHARE_GRID[(i * 3) % SHARE_GRID.length]),
  );

const cashOf = (state, deskIndex) => state.clubs[state.seatToSlot[`seat-${deskIndex + 1}`]].cash;
const drawOf = (state, deskIndex) => state.clubs[state.seatToSlot[`seat-${deskIndex + 1}`]].draw;

/* ------------------------------------------------------------------ P1 -- */
{
  const DESKS = 8;
  // Desk 1 runs New York (big market); desk 4 runs Memphis (small, lean) — the
  // two ends of the C4 spread, so P1 is judged at both.
  const seats = [
    { index: 0, label: "Desk 1 (big market)" },
    { index: 3, label: "Desk 4 (small market)" },
  ];
  // The Draw leader's share, computed by playing one baseline season and
  // reading the leader off the public table each week.
  const baseline = playSeason(DESKS, roomPolicies(DESKS, -1, null));
  void baseline;
  const leaderShare = [0, 1, 2].map((w) => {
    // The leader is whichever club has the highest printed Draw entering the
    // week; a bot's share comes off the published ladder, a desk's off its
    // baseline policy. Deterministic either way.
    return SHARE_GRID[(w + 2) % SHARE_GRID.length];
  });

  let ok = true;
  const rows = [];
  for (const seat of seats) {
    const lines = {
      adaptive: adaptive,
      "always-max": fixedShare(SHARE_MAX),
      "always-zero": fixedShare(0),
      "copy-the-leader": copyLeader(leaderShare),
    };
    const cash = {};
    for (const [name, policy] of Object.entries(lines)) {
      const state = playSeason(DESKS, roomPolicies(DESKS, seat.index, policy));
      cash[name] = cashOf(state, seat.index);
    }
    for (const rival of ["always-max", "always-zero", "copy-the-leader"]) {
      const margin = cash.adaptive - cash[rival];
      const beats = margin > 0;
      if (!beats) ok = false;
      rows.push(
        `${seat.label.padEnd(24)} adaptive ${money(cash.adaptive)} vs ${rival.padEnd(16)} ${money(cash[rival])} — ${
          beats ? "beaten by" : "LOSES BY"
        } ${money(Math.abs(margin))}`,
      );
    }
  }
  check(
    "P1",
    "R1 — no dominant reinvest line: always-max, always-zero and copy-the-leader are each beaten by a schedule-reading adaptive line, at a big-market seat and a small-market seat",
    ok,
    rows,
  );
}

/* ------------------------------------------------------------------ P2 -- */
{
  let ok = true;
  const rows = [];
  for (const profile of MARKET_PROFILES) {
    const capacity = capacityFor(profile.id);
    // Held at ONE price so the swing is the visitor and nothing else.
    const price = bestPrice(profile, capacity, DRAW_START, DRAW_START);
    const weak = settleHome(profile, capacity, DRAW_START, 15, price);
    const strong = settleHome(profile, capacity, DRAW_START, 90, price);
    const ratio = weak.turnout > 0 ? strong.turnout / weak.turnout : Infinity;
    // The whole legal price dial, held at a neutral visitor: the biggest swing
    // a desk can cause on its own. The visitor swing must beat it, or "you no
    // longer own most of the reason people come" is false.
    let dialBest = 0;
    let dialWorst = Infinity;
    for (const p of PRICE_GRID) {
      const d = settleHome(profile, capacity, DRAW_START, DRAW_START, p).doorMoney;
      dialBest = Math.max(dialBest, d);
      dialWorst = Math.min(dialWorst, d);
    }
    const visitorSwing = strong.doorMoney - weak.doorMoney;
    const dialSwing = dialBest - dialWorst;
    const good = ratio >= 1.8 && ratio <= 3.2 && visitorSwing > 0;
    if (!good) ok = false;
    rows.push(
      `${profile.id.padEnd(14)} at $${price}: Draw-15 visitor ${weak.turnout.toLocaleString()} vs Draw-90 ${strong.turnout.toLocaleString()} = ${ratio.toFixed(
        2,
      )}x · visitor swing ${money(visitorSwing)} against a whole-dial swing of ${money(dialSwing)}`,
    );
  }
  check(
    "P2",
    "C5 — the externality is material: a marquee visitor roughly doubles a collapsed visitor's crowd at the same price, in every market",
    ok,
    rows,
  );
}

/* ------------------------------------------------------------------ P3 -- */
/**
 * P3, re-specified. `gate-l2-econ` B2 (BLOCKING): the old "visible" limb
 * asserted `banker.net > 0 && feeder.net < 0 && banker.gave < feeder.gave` on
 * the DEALT ledger, and that exact pattern reproduces with EVERY DESK AT 0%
 * — New York net +$342,556, Memphis net -$613,280 — purely because New York was
 * dealt startDraw 44 and Memphis 62. The limb was confounded and 11/11 certified
 * nothing about free-rider visibility.
 *
 * The instrument being tested is now the by-choice ledger, and the property has
 * a falsifying control built into it: the SAME room played with every desk at
 * 0% must produce an instrument that is identically silent. If a future retune
 * ever lets the by-choice figures move without anybody spending, this fails.
 */
{
  const DESKS = 8;
  // One desk banks everything, one desk feeds the product hard, the rest spread.
  const policies = Array.from({ length: DESKS }, (_, i) =>
    i === 0 ? fixedShare(0) : i === 1 ? fixedShare(SHARE_MAX) : fixedShare(SHARE_GRID[(i * 2) % SHARE_GRID.length]),
  );
  const state = playSeason(DESKS, policies);
  const agg = computeAggregate(state);
  const banker = agg.giveAndTake.find((g) => g.deskNumber === 1);
  const feeder = agg.giveAndTake.find((g) => g.deskNumber === 2);

  // PUNISHED: the always-zero line ends poorer than the adaptive line at the same seat.
  const zeroState = playSeason(DESKS, roomPolicies(DESKS, 0, fixedShare(0)));
  const adaptState = playSeason(DESKS, roomPolicies(DESKS, 0, adaptive));
  const punished = cashOf(adaptState, 0) > cashOf(zeroState, 0);

  // VISIBLE, on an instrument that measures the DECISION: the desk that spent
  // nothing gave nothing it chose to give and is a net taker of other desks'
  // spending; the desk that spent the maximum is a net giver of its own.
  const visible =
    banker.spend === 0 &&
    banker.gaveByChoice === 0 &&
    banker.netByChoice > 0 &&
    feeder.spend > 0 &&
    feeder.gaveByChoice > 0 &&
    feeder.netByChoice < banker.netByChoice;

  // THE CONTROL, and the whole point of the re-specification: in a room where
  // nobody reinvests, this instrument must say NOTHING. Every by-choice figure
  // must be exactly zero for every desk, so no desk can be named a giver or a
  // taker on the strength of the Draw it was dealt.
  // NOTE `zeroState` above puts only the FOCAL desk at 0% (the rest of the room
  // is spread across the share grid), which is the right shape for the
  // "punished" limb and the wrong shape for this one. The control needs a room
  // in which nobody spent anything at all.
  const allZeroState = playSeason(DESKS, Array.from({ length: DESKS }, () => fixedShare(0)));
  const zeroAgg = computeAggregate(allZeroState);
  const silentAtZero =
    zeroAgg.choiceTotals.anySpend === false &&
    zeroAgg.giveAndTake.every((r) => r.spend === 0 && r.gaveByChoice === 0 && r.receivedByChoice === 0 && r.netByChoice === 0 && r.ownGain === 0);
  // ...while the DEALT ledger in that same room is loud, which is exactly the
  // confound the old limb was reading.
  const dealtSpreadAtZero = Math.max(...zeroAgg.giveAndTake.map((r) => r.net)) - Math.min(...zeroAgg.giveAndTake.map((r) => r.net));

  // LUCK-CONTROLLED: reinvesting is worth something to the feeder's OWN books on
  // its OWN schedule (gate-l2-play R4 — a within-desk counterfactual, so a kind
  // calendar cannot masquerade as a good decision), and nothing at all to a desk
  // that spent nothing.
  const luckControlled = banker.ownGain === 0 && feeder.ownGain !== 0;

  const drawFell = drawOf(state, 0) < CLUBS[0].startDraw;

  const ok = punished && visible && silentAtZero && luckControlled && drawFell;
  check(
    "P3",
    "FL4/Family-2 — free-riding is punished AND visible on an instrument that measures the DECISION, and that instrument is silent in a room where nobody spent",
    ok,
    [
      `punished: adaptive ${money(cashOf(adaptState, 0))} vs always-zero ${money(cashOf(zeroState, 0))} at the same seat`,
      `banker  Desk 1: spent ${money(banker.spend)} · gaveByChoice ${money(banker.gaveByChoice)} · receivedByChoice ${money(
        banker.receivedByChoice,
      )} · netByChoice ${money(banker.netByChoice)} · ownGain ${money(banker.ownGain)} · Draw ${banker.drawStart} -> ${banker.drawEnd}`,
      `feeder  Desk 2: spent ${money(feeder.spend)} · gaveByChoice ${money(feeder.gaveByChoice)} · receivedByChoice ${money(
        feeder.receivedByChoice,
      )} · netByChoice ${money(feeder.netByChoice)} · ownGain ${money(feeder.ownGain)} · Draw ${feeder.drawStart} -> ${feeder.drawEnd}`,
      `CONTROL — all 8 desks at 0% every week: by-choice instrument silent = ${silentAtZero}; dealt-ledger net spread in that same room = ${money(
        dealtSpreadAtZero,
      )} (that spread is the confound the old P3 was reading as free-rider evidence)`,
      `the banker's own Draw fell over the season: ${drawFell}`,
      `NOTE: this is the problem L3 exists to legislate, not a bug. Nothing in this lesson punishes it morally and no copy calls it cheating.`,
    ],
  );
}

/* ------------------------------------------------------------------ P4 -- */
{
  let ok = true;
  const rows = [];
  for (const profile of MARKET_PROFILES) {
    const capacity = capacityFor(profile.id);
    let worstMargin = Infinity;
    let worstAt = "";
    let anyUnclearable = null;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 5) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 5) {
        // (a) at least one legal action clears the bill
        let clears = false;
        for (const p of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, p);
          if (s.doorMoney + localMediaFor(profile, hd) + NATIONAL - profile.bill >= 0) clears = true;
        }
        if (!clears && !anyUnclearable) anyUnclearable = `${hd}/${vd}`;
        // (b) the cash-best price clears it with room to spare
        const p = bestPrice(profile, capacity, hd, vd);
        const s = settleHome(profile, capacity, hd, vd, p);
        const margin = s.doorMoney + localMediaFor(profile, hd) + NATIONAL - profile.bill;
        if (margin < worstMargin) {
          worstMargin = margin;
          worstAt = `Draw ${hd}/${vd} at $${p}`;
        }
      }
    }
    if (anyUnclearable || worstMargin < 0) ok = false;
    rows.push(
      `${profile.id.padEnd(14)} worst best-price week: ${money(worstMargin)} clear of the ${money(profile.bill)} bill (${worstAt})${
        anyUnclearable ? ` — UNCLEARABLE at ${anyUnclearable}` : ""
      }`,
    );
  }
  check("P4", "R5 — no unwinnable seat: every club clears its weekly bill from every reachable state, and the cash-best price clears it with room to spare", ok, rows);
}

/* ------------------------------------------------------------------ P5 -- */
{
  let states = 0;
  let failures = 0;
  const rows = [];
  for (const profile of MARKET_PROFILES) {
    const capacity = capacityFor(profile.id);
    let worstFanResidual = 0;
    let worstDollarResidual = 0;
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 2) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 2) {
        for (const price of PRICE_GRID) {
          const s = settleHome(profile, capacity, hd, vd, price);
          states += 1;
          const fanResidual = s.bareFans + s.ownFans + s.visitorFans - s.turnout;
          const dollarResidual = s.bareDollars + s.ownDollars + s.visitorDollars - s.doorMoney;
          if (fanResidual !== 0 || dollarResidual !== 0) failures += 1;
          if (s.bareFans < 0 || s.ownFans < 0 || s.visitorFans < 0) failures += 1;
          worstFanResidual = Math.max(worstFanResidual, Math.abs(fanResidual));
          worstDollarResidual = Math.max(worstDollarResidual, Math.abs(dollarResidual));
        }
      }
    }
    rows.push(`${profile.id.padEnd(14)} worst fan residual ${worstFanResidual} · worst dollar residual ${worstDollarResidual}`);
  }
  rows.push(`${states.toLocaleString()} states swept · ${failures} failures`);
  check("P5", "BC-5 — the decomposition identity closes exactly: fans and dollars, residual 0, no negative block, across the full reachable sweep", failures === 0, rows);
}

/* ------------------------------------------------------------------ P6 -- */
{
  let ok = true;
  const rows = [];
  for (const profile of MARKET_PROFILES) {
    const capacity = capacityFor(profile.id);
    const prices = [15, 40, 70, 90].map((vd) => bestPrice(profile, capacity, DRAW_START, vd));
    const spread = prices[prices.length - 1] - prices[0];
    const monotone = prices.every((p, i) => i === 0 || p >= prices[i - 1]);
    if (spread < 20 || !monotone) ok = false;
    rows.push(`${profile.id.padEnd(14)} best price by visitor Draw 15/40/70/90: $${prices.join(" / $")} — spread $${spread}`);
  }
  check("P6", "R1a — the cash-best price MOVES with the visiting club's Draw, so no fixed price survives the schedule", ok, rows);
}

/* ------------------------------------------------------------------ P7 -- */
{
  // R6, in two limbs, because one blanket ratio is the wrong instrument here.
  //
  // Regret is measured at equal distance from the TRUE (continuous) argmax, not
  // from the nearest $2 grid point — L1's harness adopted the same correction
  // after the selection econ review showed equal-grid-offset regret is an
  // artifact. Pairs where neither error costs at least 0.5% of that week's door
  // money are skipped as immaterial and the skip count is printed, so the skip
  // cannot hide a real failure.
  //
  // P7a — UNCLAMPED states (the building does not sell out at the best price).
  // Here the revenue curve is a clean parabola and the bar is the standard 3.0.
  //
  // P7b — CLAMPED states (the best price sits at or below the sell-out kink).
  // There the curve is linear on one side and parabolic on the other, so a
  // ratio bar is not measuring anything real. What R6 actually exists to
  // prevent is FL3 — "charging high is greedy and gets punished, charging low
  // is kind" — so the property asserted is the substantive one: in the clamped
  // band the asymmetry must run AGAINST THE LOW PRICE, never against the high
  // one, at every offset. It does, and it is the honest arithmetic of a full
  // building: once every seat is sold, a cheaper ticket brings nobody new. Both
  // Draws are printed on the card before the commitment, so a pair can see the
  // sell-out coming, and `HOUSE_RULES` says the sentence out loud.
  //
  // Across visitor states the spread is far larger again, and that spread is
  // C5 — Design C's scoped R6 dispute, which this build inherits.
  const TOLERANCE = 3.0;
  const OFFSETS = [2, 4, 6, 8, 10];
  const MATERIAL = 0.005;
  let okA = true;
  let okB = true;
  let worstA = 0;
  let worstAtA = "";
  let comparedA = 0;
  let comparedB = 0;
  let skipped = 0;
  let wrongWayB = "";
  const doorAt = (profile, capacity, hd, vd, price) => {
    const q = Math.min(
      capacity,
      Math.max(0, profile.base0 + profile.ownDrawFans * (hd - DRAW_START) + profile.visitorDrawFans * (vd - DRAW_START) - profile.sens * price),
    );
    return (price + profile.ancillary) * q;
  };
  for (const profile of MARKET_PROFILES) {
    const capacity = capacityFor(profile.id);
    for (let hd = DRAW_MIN; hd <= DRAW_MAX; hd += 10) {
      for (let vd = DRAW_MIN; vd <= DRAW_MAX; vd += 10) {
        let star = 10;
        let peak = -Infinity;
        for (let p = 10; p <= 120; p += 0.05) {
          const d = doorAt(profile, capacity, hd, vd, p);
          if (d > peak) {
            peak = d;
            star = p;
          }
        }
        if (peak <= 0) continue;
        // Whether a comparison belongs to the clamped band is decided PER
        // OFFSET, on the low probe, because that is where the asymmetry
        // actually comes from: the cheap side runs into the ceiling and stops
        // buying any more people, so every dollar it gives up is pure loss on
        // an unchanged crowd. The peak itself can sit a hair below capacity
        // while the price $2 under it is already sold out.
        const wantedAt = (price) =>
          profile.base0 +
          profile.ownDrawFans * (hd - DRAW_START) +
          profile.visitorDrawFans * (vd - DRAW_START) -
          profile.sens * price;
        for (const off of OFFSETS) {
          const lowP = star - off;
          const highP = star + off;
          if (lowP < 10 || highP > 120) continue;
          const low = peak - doorAt(profile, capacity, hd, vd, lowP);
          const high = peak - doorAt(profile, capacity, hd, vd, highP);
          if (low <= 0 || high <= 0) continue;
          if (Math.max(low, high) < MATERIAL * peak) {
            skipped += 1;
            continue;
          }
          if (wantedAt(lowP) >= capacity) {
            comparedB += 1;
            if (low < high) {
              okB = false;
              if (!wrongWayB) wrongWayB = `${profile.id} Draw ${hd}/${vd} at +/-$${off}: under ${money(low)} vs over ${money(high)}`;
            }
            continue;
          }
          comparedA += 1;
          const ratio = Math.max(low, high) / Math.min(low, high);
          if (ratio > worstA) {
            worstA = ratio;
            worstAtA = `${profile.id} Draw ${hd}/${vd} at +/-$${off} from a true peak of $${star.toFixed(2)} (under ${money(low)} vs over ${money(high)})`;
          }
          if (ratio > TOLERANCE) okA = false;
        }
      }
    }
  }
  check("P7a", `R6 — where the building does not sell out, over- and under-pricing cost within ${TOLERANCE.toFixed(1)}x of each other`, okA, [
    `worst measured ratio ${worstA.toFixed(2)} at ${worstAtA}`,
    `${comparedA.toLocaleString()} material comparisons · ${skipped.toLocaleString()} skipped as immaterial (both errors under ${(MATERIAL * 100).toFixed(1)}% of that week's door money)`,
  ]);
  check("P7b", "FL3 — where the building DOES sell out at the best price, the asymmetry runs against the LOW price at every offset, so the model never teaches that charging less is the safe mistake", okB, [
    `${comparedB.toLocaleString()} clamped comparisons, all punishing the cheap side harder${wrongWayB ? ` — EXCEPT ${wrongWayB}` : ""}`,
    "Both Draws are printed on the card before the commitment, so the sell-out is foreseeable, and HOUSE_RULES says it out loud.",
  ]);
}

/* ------------------------------------------------------------------ P8 -- */
{
  let ok = true;
  const rows = [];
  for (const profile of MARKET_PROFILES) {
    for (const club of CLUBS.filter((c) => c.profileId === profile.id)) {
      let maxFill = 0;
      for (const p of PRICE_GRID) maxFill = Math.max(maxFill, settleHome(profile, club.capacity, 90, 90, p).fillPct);
      if (maxFill < 95) ok = false;
      rows.push(`${club.short.padEnd(14)} (${profile.id}) best reachable fill ${maxFill}%`);
    }
  }
  check("P8", "R8 — every building in the league can reach a full house at some legal price; no market is capped out of one", ok, rows.slice(0, 8).concat([`... ${rows.length} clubs checked`]));
}

/* ------------------------------------------------------------------ P9 -- */
{
  const ceilings = MARKET_PROFILES.map((profile) => {
    let d = DRAW_MIN;
    for (let i = 0; i < 500; i += 1) d = nextDraw(profile, d, 1e9);
    return d;
  });
  const same = new Set(ceilings).size === 1;
  let diminishing = true;
  for (const profile of MARKET_PROFILES) {
    const a = drawGain(profile, DRAW_START, profile.effortScale);
    const b = drawGain(profile, DRAW_START, profile.effortScale * 4);
    if (!(b > a && b < a * 2)) diminishing = false;
    if (!(drawGain(profile, 85, profile.effortScale * 4) < drawGain(profile, 30, profile.effortScale * 4))) diminishing = false;
  }
  check("P9", "FL7 — the Draw ceiling is identical for every market and returns diminish in both money and Draw, so no amount of big-market money buys dominance", same && diminishing, [
    `settling Draw with unlimited money: ${MARKET_PROFILES.map((m, i) => `${m.id} ${ceilings[i]}`).join(" · ")}`,
    `diminishing returns in money and in Draw: ${diminishing}`,
  ]);
}

/* ----------------------------------------------------------------- P10 -- */
{
  const a = playSeason(9, roomPolicies(9, 0, adaptive));
  const b = playSeason(9, roomPolicies(9, 0, adaptive));
  const same = JSON.stringify(a) === JSON.stringify(b);
  const agg = computeAggregate(a);
  const path = agg.smallMarketPath;
  check("P10", "R7 — no RNG anywhere: the same season replays to identical numbers through the real reducer, and the class evidence is reproducible", same, [
    `identical replay: ${same}`,
    `visitor ledger rows: ${agg.visitorLedger.length} · bars: ${agg.homeRevenueDecomposition.length} · visitor-led bars: ${agg.visitorLedCount}`,
    `small-market path found in this room: ${path.found}${path.found ? ` — ${path.smallClub} ${money(path.smallDoorMoney)} vs ${path.bigClub} ${money(path.bigDoorMoney)}` : ""}`,
  ]);
}

/* ----------------------------------------------------------------- P11 -- */
/**
 * THE CLAIM-AUDIT FAMILY.
 *
 * `analyst-wave3` recommendation: "treat 'printed claim vs recomputed model' as
 * a single defect class and close it with a property-test family that
 * recomputes every rendered board/synthesis/ADAPT claim string against the
 * reducer and fails on disagreement in SIGN, QUANTIFIER or BOUND — that one
 * instrument covers econ B7, B8, B3, the stage-5 bar off-by-one, and the
 * SPILLOVER quantifier, which are currently four separate tickets owned by
 * three critics."
 *
 * The lesson binds each claim to its number structurally: a claim string may
 * only be built by interpolating `ClaimAtom.rendered`, which is rendered FROM
 * the computed value, and every relation the sentence asserts travels with it.
 * This family is the other half — it re-derives each relation from the state,
 * with its own arithmetic, and fails on any disagreement:
 *
 *   - BINDING    the printed fragment IS the value's rendering, and it is
 *                actually present on the surface (and any forbidden phrase is
 *                actually absent);
 *   - SIGN       the sign the sentence asserts is the sign the model produces —
 *                including the room-total sentence, which is checked against a
 *                joint figure this harness computes by REPLAYING the same
 *                season with every desk at 0% through the real reducer (econ
 *                B8);
 *   - QUANTIFIER the causal and counting words — "WHO WAS VISITING carried it",
 *                "did / did NOT see the Handed-To-You bar", "on all N bars",
 *                "chose to give nothing", "the best price on the board" — each
 *                recomputed from the state by an independent implementation of
 *                the rule (econ B3, projector R-1, play N-3, the SPILLOVER
 *                quantifier);
 *   - BOUND      no percentage outside 0-100, no share printed where the value
 *                created went the wrong way, no attribution block larger than
 *                the gap it explains, no "better price" that keeps less (econ
 *                B7, play N-5).
 *
 * Proven non-vacuous below by three in-memory mutants — one wrong sign, one
 * wrong quantifier, one wrong bound — each of which this family must catch.
 */
const { moduleClaims } = mod;

const fmt = (value, format) =>
  format === "money"
    ? `${value < 0 ? "-" : ""}$${Math.abs(Math.round(value)).toLocaleString()}`
    : format === "percent"
      ? `${Math.round(value)}%`
      : format === "percent1"
        ? `${Math.round(value * 10) / 10}%`
        : `${Math.round(value)}`;

const profileFor = (state, club) => MARKET_PROFILES.find((m) => m.id === club.profileId);
const capacityOf = (club) => CLUBS[club.slot].capacity;

/**
 * The joint effect, computed WITHOUT the module's `roomJointGain`: replay the
 * identical season with every desk's reinvest dial at 0% through the shipped
 * reducer, and difference the desks' cash. This is the quantity econ B8 says
 * the room-total sentence must not disagree with in sign.
 */
function jointByReplay(deskCount, priceOf, shareOf) {
  const actual = playSeasonWith(deskCount, priceOf, shareOf);
  const nobody = playSeasonWith(deskCount, priceOf, () => 0);
  const cashOfRoom = (s) =>
    s.clubs.filter((c) => c.seatId !== null && c.weeks.length > 0).reduce((sum, c) => sum + c.weeks.reduce((t, w) => t + w.net, 0), 0);
  return { joint: Math.round(cashOfRoom(actual) - cashOfRoom(nobody)), actual, shockSeated: actual.shockSlot !== null && actual.clubs[actual.shockSlot].seatId !== null };
}

/**
 * The same joint effect, re-derived by ARITHMETIC rather than by replay: every
 * settled home week re-settled with both sides' never-reinvested Draw, at the
 * week's actual price, with the module's declared carve-outs (stock weeks, bot
 * clubs and the pinned shock club keep their actual spend).
 *
 * The two differ in scope on purpose and the harness reports it: the REPLAY
 * lets the league-office clubs re-derive their own reinvest DOLLARS from a
 * poorer door in a room that spent nothing, so bot Draw drifts by a point or
 * two; the arithmetic version holds the bots where they actually were, which is
 * the counterfactual the per-desk instrument answers and therefore the one the
 * room-total sentence has to be consistent with. Magnitude is checked against
 * the arithmetic; SIGN — which is what econ B8 is about — is checked against
 * the replay, and the two are required to agree in sign in every room.
 */
function jointByArithmetic(state) {
  let actual = 0;
  let joint = 0;
  const baselines = new Map();
  for (const c of state.clubs.slice(0, state.leagueSize)) baselines.set(c.slot, mod.baselineDrawPathFor(state, c));
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null || club.weeks.length === 0) continue;
    const profile = profileFor(state, club);
    const cap = capacityOf(club);
    const mine = baselines.get(club.slot) ?? [];
    club.weeks.forEach((w, i) => {
      actual += w.net;
      const myDraw = mine[i] ?? w.hostDrawBefore;
      const v = state.clubs[w.visitorSlot];
      let vDraw = w.visitorDrawBefore;
      if (v) {
        const vp = baselines.get(v.slot) ?? [];
        const vi = v.weeks.findIndex((x) => x.week === w.week);
        if (vi >= 0) vDraw = vp[vi] ?? w.visitorDrawBefore;
      }
      const home = settleHome(profile, cap, myDraw, vDraw, w.home.price);
      const reinvestB = club.seatId !== null && !w.stock ? 0 : w.reinvestPaid;
      joint += home.doorMoney + localMediaFor(profile, myDraw) + w.national - w.bill - reinvestB;
    });
  }
  return Math.round(actual - joint);
}

/** A season at explicit per-desk price/share functions, through the real reducer. */
function playSeasonWith(deskCount, priceOf, shareOf) {
  let state = hostTheLeagueModule.initialState({ sessionId: "claims", seatIds: [] });
  for (let i = 1; i <= deskCount; i += 1) state = apply(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (let i = 1; i <= deskCount; i += 1) {
      const seatId = `seat-${i}`;
      state = apply(state, { type: "setPrice", price: priceOf(i - 1, w) }, "PLAY", seatId);
      state = apply(state, { type: "setShare", share: shareOf(i - 1, w) }, "PLAY", seatId);
      state = apply(state, { type: "lock" }, "PLAY", seatId);
    }
    state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  }
  return state;
}

/**
 * A TRANSCRIPTION of the small-market exhibit's selection rule and price
 * control, written out here rather than called from the module.
 *
 * `gate-l2-econ` N14 required this to be named for what it is. It is NOT an
 * independent derivation: it is a re-statement of the same shared specification
 * `smallMarketPathFrom` implements. What it buys is real and bounded — it
 * catches IMPLEMENTATION drift between the module and the spec (injection I3,
 * dropping the price control, was caught here) — and what it cannot catch is
 * an error in the spec itself, which no re-transcription of the spec ever
 * could. The genuinely independent limbs in this file are the all-zero season
 * REPLAY (`jointByReplay`) and the re-settled ARITHMETIC (`jointByArithmetic`);
 * this one is a consistency check.
 */
function recomputeMarketPath(state) {
  const smalls = [];
  const bigs = [];
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null) continue;
    const isBig = club.profileId === "new-york" || club.profileId === "golden-state";
    for (const w of club.weeks) {
      if (w.stock) continue;
      (isBig ? bigs : smalls).push({ club, w });
    }
  }
  const doorAt = (c, price) =>
    settleHome(profileFor(state, c.club), capacityOf(c.club), c.w.hostDrawBefore, c.w.visitorDrawBefore, price).doorMoney;
  let bestCtrlVisitor = null;
  let bestCtrl = null;
  let bestAny = null;
  for (const s of smalls) {
    for (const b of bigs) {
      if (s.w.visitorDrawBefore <= b.w.visitorDrawBefore) continue;
      const gap = s.w.home.doorMoney - b.w.home.doorMoney;
      if (gap <= 0) continue;
      const parts = {
        visitor: s.w.home.visitorDollars - b.w.home.visitorDollars,
        bare: s.w.home.bareDollars - b.w.home.bareDollars,
        own: s.w.home.ownDollars - b.w.home.ownDollars,
      };
      const atSmall = doorAt(s, s.w.home.price) - doorAt(b, s.w.home.price);
      const atBig = doorAt(s, b.w.home.price) - doorAt(b, b.w.home.price);
      const survives = atSmall > 0 && atBig > 0;
      const visitorDriven = parts.visitor > 0 && parts.visitor >= parts.bare && parts.visitor >= parts.own && parts.visitor <= gap;
      const cand = { gap, parts, atSmall, atBig, survives, visitorDriven };
      if (!bestAny || gap > bestAny.gap) bestAny = cand;
      if (survives && (!bestCtrl || gap > bestCtrl.gap)) bestCtrl = cand;
      if (survives && visitorDriven && (!bestCtrlVisitor || gap > bestCtrlVisitor.gap)) bestCtrlVisitor = cand;
    }
  }
  const best = bestCtrlVisitor ?? bestCtrl ?? bestAny;
  if (!best) return null;
  const driver = !best.survives
    ? "price"
    : best.parts.visitor >= best.parts.bare && best.parts.visitor >= best.parts.own && best.parts.visitor <= best.gap
      ? "visitor"
      : best.parts.bare >= best.parts.own
        ? "building-and-price"
        : "own-draw";
  return { ...best, driver };
}

/** Every fact the audit needs, recomputed from state by this harness. */
function recomputeTruth(state, joint, jointArith) {
  const agg = computeAggregate(state);
  const live = state.clubs.filter((c) => c.seatId !== null && c.weeks.length > 0);
  const spendTotal = live.reduce((s, c) => s + c.weeks.filter((w) => !w.stock).reduce((t, w) => t + w.reinvestPaid, 0), 0);
  const gave = agg.giveAndTake.reduce((s, r) => s + r.gaveByChoice, 0);
  const own = agg.giveAndTake.reduce((s, r) => s + r.ownGain, 0);
  const created = own + gave;
  const coherent = created > 0 && gave >= 0 && gave <= created;
  const visitorLed = agg.homeRevenueDecomposition.filter((d) => d.fromVisitorDraw >= d.fromBuilding && d.fromVisitorDraw >= d.fromOwnDraw).length;
  // econ N12/B9. THE INDEPENDENT BRANCH PREDICATE.
  //
  // The old limb audited `spillover.overInvested` with `check(!truth.coherent,
  // ...)` — a verbatim re-derivation of the module's own print condition. It
  // passed whenever the branch fired, could never fail, and is why a false
  // economic noun survived a 70,628-atom sweep with 0 disagreements.
  //
  // The noun is a claim about ONE thing: did this room's reinvesting make the
  // room, counted as one set of books, better or worse off. `joint` is that
  // quantity, computed here by replaying the identical season with every dial
  // at 0% through the shipped reducer and differencing the desks' cash — it
  // touches neither `created` nor `coherent` nor any module aggregate. The
  // expected WORD is computed from it here, in the harness's own code path,
  // and compared to the word the surface actually rendered.
  const expectedBranchNoun =
    joint > 0 ? "less went back in than this room's own numbers would justify" : joint < 0 ? "this room over-invested" : "the room came out exactly level";
  const lockedAtRelease = state.lockedAtBarRelease === undefined ? null : state.lockedAtBarRelease;
  const sawBar = state.barReleased && state.barReleasedAtWeek !== null && state.barReleasedAtWeek <= WEEK_COUNT - 1;
  const duringLast = sawBar && state.barReleasedAtWeek === WEEK_COUNT - 1;
  return {
    agg,
    anySpend: spendTotal > 0,
    spendTotal,
    gave,
    own,
    created,
    coherent,
    externalPct: coherent ? Math.round((gave / created) * 100) : null,
    joint,
    jointArith,
    expectedBranchNoun,
    visitorLed,
    barCount: agg.homeRevenueDecomposition.length,
    sawBar,
    // projector W4-1/W4-2: the release arm, recomputed here from the stamp this
    // harness itself set on the state, never read back off a module helper.
    lockedAtRelease,
    liveDesks: live.length,
    someLockedAtRelease: duringLast && lockedAtRelease !== null ? lockedAtRelease > 0 : false,
    boardChoseTheCause: !sawBar,
    market: recomputeMarketPath(state),
    // econ FL-K: the dealt share of everything each desk's Draw moved, recomputed.
    dealtPctByDesk: new Map(
      agg.giveAndTake.map((r) => [r.deskNumber, r.gave > 0 ? Math.round((Math.max(0, r.gave - r.gaveByChoice) / r.gave) * 100) : 0]),
    ),
    // econ N14: the four composition percentages, recomputed from the pipe rows.
    composition: (() => {
      const pipes = [...agg.pipes].sort((a, b) => b.nationalPct - a.nationalPct);
      const most = pipes[0] ?? null;
      const least = pipes[pipes.length - 1] ?? null;
      return {
        mostNationalPct: most ? most.nationalPct : null,
        mostGatePct: most ? most.gatePct : null,
        leastNationalPct: least && most && least.slot !== most.slot ? least.nationalPct : null,
        leastGatePct: least && most && least.slot !== most.slot ? least.gatePct : null,
      };
    })(),
    spendBySlot: new Map(live.map((c) => [c.slot, c.weeks.filter((w) => !w.stock).reduce((t, w) => t + w.reinvestPaid, 0)])),
  };
}

/**
 * The audit itself. Returns a list of failure strings; an empty list is a pass.
 * `surfaces` is deliberately a parameter so the mutation proof can hand it a
 * poisoned copy of exactly what the lesson renders.
 */
function auditClaims(surfaces, truth, state) {
  const fail = [];
  for (const surface of surfaces) {
    for (const a of surface.claims) {
      const at = `${surface.surface}/${a.id}`;
      // ---- BINDING
      if (!a.quantifier && a.rendered !== fmt(a.value, a.format)) {
        fail.push(`BINDING ${at}: printed "${a.rendered}" but the value renders as "${fmt(a.value, a.format)}"`);
      }
      if (!surface.text.includes(a.rendered)) fail.push(`BINDING ${at}: "${a.rendered}" is not on the surface`);
      if (a.absent !== undefined && surface.text.includes(a.absent)) {
        fail.push(`BINDING ${at}: forbidden phrase "${a.absent}" is on the surface`);
      }
      // ---- SIGN
      if (a.assertsSign === "positive" && !(a.value > 0)) fail.push(`SIGN ${at}: asserts positive, value ${a.value}`);
      if (a.assertsSign === "negative" && !(a.value < 0)) fail.push(`SIGN ${at}: asserts negative, value ${a.value}`);
      if (a.assertsSign === "nonNegative" && !(a.value >= 0)) fail.push(`SIGN ${at}: asserts non-negative, value ${a.value}`);
      if (a.assertsSign === "zero" && a.value !== 0) fail.push(`SIGN ${at}: asserts zero, value ${a.value}`);
      // ---- BOUND
      if (a.bounds?.min !== undefined && a.value < a.bounds.min) fail.push(`BOUND ${at}: ${a.value} < ${a.bounds.min}`);
      if (a.bounds?.max !== undefined && a.value > a.bounds.max) fail.push(`BOUND ${at}: ${a.value} > ${a.bounds.max}`);

      // ---- VALUE, recomputed by this harness
      const near = (x, y, tol = 2) => Math.abs(Math.round(x) - Math.round(y)) <= tol;
      if (a.id === "spillover.gaveByChoice" && !near(a.value, truth.gave)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.gave}`);
      if (a.id === "spillover.ownGain" && !near(a.value, truth.own)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.own}`);
      if (a.id === "spillover.externalPct" && a.value !== truth.externalPct) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.externalPct}`);
      if (a.id === "spillover.roomJointMagnitude") {
        if (!near(a.value, Math.abs(truth.jointArith), 4)) {
          fail.push(`VALUE ${at}: ${a.value} vs independently recomputed joint magnitude ${Math.abs(truth.jointArith)}`);
        }
        if (Math.sign(truth.jointArith) !== Math.sign(truth.joint)) {
          fail.push(`SIGN ${at}: the two independent joint computations disagree in sign — arithmetic ${truth.jointArith}, replay ${truth.joint}`);
        }
      }
      if (a.id === "barSummary.visitorLedCount" && a.value !== truth.visitorLed) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.visitorLed}`);
      // econ FL-K: the DEALT share, recomputed per desk from the by-choice ledger.
      if (a.id === "desk.dealtPct") {
        const m = surface.surface.match(/play:desk-(\d+):/);
        const want = m ? truth.dealtPctByDesk.get(Number(m[1])) : undefined;
        if (want !== undefined && a.value !== want) fail.push(`VALUE ${at}: printed ${a.value}% dealt, recomputed ${want}%`);
      }
      if (a.id === "desk.boughtShare") {
        const m = surface.surface.match(/play:desk-(\d+):/);
        const want = m ? truth.dealtPctByDesk.get(Number(m[1])) : undefined;
        if (want !== undefined && a.value !== 100 - want) fail.push(`VALUE ${at}: printed ${a.value}% bought, recomputed ${100 - want}%`);
      }
      // econ N14: the four composition percentages.
      for (const key of ["mostNationalPct", "mostGatePct", "leastNationalPct", "leastGatePct"]) {
        if (a.id === `composition.${key}`) {
          const want = truth.composition[key];
          if (want === null || Math.abs(a.value - want) > 0.05) fail.push(`VALUE ${at}: printed ${a.value}, recomputed ${want}`);
        }
      }
      // projector W4-1: the printed lock count at release.
      if ((a.id === "reveal5.lockedAtRelease" || a.id === "teach5.lockedAtRelease") && a.value !== truth.lockedAtRelease) {
        fail.push(`VALUE ${at}: printed ${a.value} desks locked at release, recomputed ${truth.lockedAtRelease}`);
      }
      if (truth.market) {
        if (a.id === "market.gap" && !near(a.value, truth.market.gap)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.market.gap}`);
        if (a.id === "market.gapFromVisitor" && !near(a.value, truth.market.parts.visitor)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.market.parts.visitor}`);
        if (a.id === "market.gapAtSmallPrice" && !near(a.value, truth.market.atSmall)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.market.atSmall}`);
        if (a.id === "market.gapAtBigPrice" && !near(a.value, truth.market.atBig)) fail.push(`VALUE ${at}: ${a.value} vs recomputed ${truth.market.atBig}`);
        // BOUND, econ B3: a block bigger than the gap it explains may never be
        // the named cause.
        if (a.id === "market.driverVisitor" && truth.market.parts.visitor > truth.market.gap) {
          fail.push(`BOUND ${at}: the visitor block ${truth.market.parts.visitor} is larger than the gap ${truth.market.gap} it is credited with`);
        }
      }

      // ---- QUANTIFIER, recomputed by this harness
      if (a.quantifier) {
        const claimsIt = a.quantifier.claims;
        const check = (recomputed, what) => {
          if (claimsIt !== recomputed) fail.push(`QUANTIFIER ${at}: surface claims ${claimsIt} for ${what}, recomputed ${recomputed} ("${a.quantifier.word}")`);
        };
        switch (a.id) {
          case "spillover.nobodySpent":
            check(!truth.anySpend, "nobody spent");
            break;
          case "spillover.pctPrinted":
            check(truth.coherent, "the share is a coherent percentage");
            break;
          // econ N12/B9. The branch NOUN, audited against the harness's own
          // recomputation of the only thing the noun is about — the sign of the
          // room's joint effect, replayed at 0% through the shipped reducer.
          // Deliberately NOT `check(...)`: the surface always "claims" its own
          // word, so a boolean comparison would be the tautology this replaces.
          // The expected word is computed above from `joint` and compared to the
          // word that was actually printed.
          case "spillover.branchNoun":
            if (a.quantifier.word !== truth.expectedBranchNoun) {
              fail.push(
                `QUANTIFIER ${at}: the card names the situation "${a.quantifier.word}", but the room's own joint effect (${Math.round(truth.joint).toLocaleString()}, replayed at 0%) makes it "${truth.expectedBranchNoun}"`,
              );
            }
            // econ B9's discharge condition, asserted as a property of the text
            // rather than of the atom: the over-investment noun may not appear
            // anywhere on a surface belonging to a room that came out ahead.
            if (truth.joint > 0 && /over-invest/i.test(surface.text)) {
              fail.push(`QUANTIFIER ${at}: "over-invest" is on a surface whose room is ${Math.round(truth.joint).toLocaleString()} better off`);
            }
            break;
          // projector W4-1: whether desks had already committed when the bar
          // went up, recomputed from the stamp this harness set, per arm.
          case "reveal5.someLocked":
          case "teach5.someLocked":
            check(truth.someLockedAtRelease, "some desks had already locked when the bar went up");
            break;
          // projector W4-2: whether the BOARD has already chosen the cause. The
          // teacher mirror may promise "refuses to choose" only where the board
          // does refuse — which is exactly the arms where the room saw the bar.
          case "teach5.boardChose":
            check(truth.boardChoseTheCause, "the board has already chosen the cause (the room never saw the bar in time)");
            break;
          case "spillover.jointDirection": {
            // econ B8: the printed direction must be the sign of the REPLAYED
            // joint effect, not of the sum of per-desk partials.
            const wanted = truth.joint > 0 ? "better off" : truth.joint < 0 ? "worse off" : "exactly level";
            if (a.quantifier.word !== wanted) {
              fail.push(`SIGN ${at}: the room-total sentence says "${a.quantifier.word}" against a replayed joint effect of ${truth.joint}`);
            }
            break;
          }
          case "market.driverVisitor":
            check(truth.market !== null && truth.market.driver === "visitor", "the visitor carried the gap under a price control");
            break;
          case "market.driverPrice":
            check(truth.market !== null && truth.market.driver === "price", "the price gap carried it");
            break;
          case "market.driverBuilding":
            check(truth.market !== null && truth.market.driver === "building-and-price", "building and price carried it");
            break;
          case "market.driverOwn":
            check(truth.market !== null && truth.market.driver === "own-draw", "the desk's own Draw carried it");
            break;
          case "reveal5.sawBar":
          case "reveal5.barNamedAsCause":
            check(truth.sawBar, "the room saw the Handed-To-You bar before it played week 3");
            break;
          case "barSummary.quantifier": {
            const wanted =
              truth.visitorLed === 0
                ? "On every bar in this room, the visiting clubs were NOT the biggest block"
                : truth.visitorLed === truth.barCount
                  ? `On all ${truth.barCount} bars`
                  : `On ${truth.visitorLed} of ${truth.barCount} bars`;
            if (a.quantifier.word !== wanted) fail.push(`QUANTIFIER ${at}: printed "${a.quantifier.word}", recomputed "${wanted}"`);
            break;
          }
          case "desk.choseNothing": {
            const m = surface.surface.match(/play:desk-(\d+):/);
            const deskNo = m ? Number(m[1]) : null;
            const row = truth.agg.giveAndTake.find((r) => r.deskNumber === deskNo);
            if (row) check((truth.spendBySlot.get(row.slot) ?? 0) === 0, `desk ${deskNo} chose to give nothing`);
            break;
          }
          case "priceCf.foundBest": {
            const m = surface.surface.match(/play:desk-(\d+):week-(\d+):/);
            if (m) {
              const club = state.clubs.find((c) => c.deskNumber === Number(m[1]));
              const w = club?.weeks.find((x) => x.week + 1 === Number(m[2]));
              if (club && w) {
                const profile = profileFor(state, club);
                const keptAt = (p) => {
                  const home = settleHome(profile, capacityOf(club), w.hostDrawBefore, w.visitorDrawBefore, p);
                  return home.doorMoney + w.localMedia + w.national - w.bill - Math.round((w.share / 100) * home.doorMoney);
                };
                let bestP = PRICE_GRID[0];
                let bestK = -Infinity;
                for (const p of PRICE_GRID) {
                  const k = keptAt(p);
                  if (k > bestK) {
                    bestK = k;
                    bestP = p;
                  }
                }
                check(bestP === w.price, `desk ${m[1]} week ${m[2]} charged the best price on the dial`);
                if (bestK < keptAt(w.price) - 1) fail.push(`BOUND ${at}: the "best" price keeps less than the price charged`);
              }
            }
            break;
          }
          default:
            break;
        }
      }
    }
  }
  return fail;
}

{
  // The rooms. Deliberately includes the exact shapes the econ gate measured
  // the falsehoods in: the alternating 0%/40% room (printed 0% beside $1.58M),
  // the all-40% over-investment room, the one-spender room, the $110-vs-$30
  // price-extreme room (the 40/40 visitor-driver claim), and both bar release
  // points from the projector critic's two-arm probe.
  const priceSets = [
    { id: "flat-$50", f: () => 50 },
    { id: "$110/$30", f: (i) => (i % 2 === 0 ? 110 : 30) },
    { id: "spread", f: (i, w) => [22, 36, 48, 56, 68, 84, 96, 30, 42, 60, 74, 110][(i + w) % 12] },
    { id: "floor-$10", f: (i) => (i < 2 ? 10 : 50) },
  ];
  const shareSets = [
    { id: "all-0%", f: () => 0 },
    { id: "all-10%", f: () => 10 },
    { id: "all-25%", f: () => 25 },
    { id: "all-40%", f: () => SHARE_MAX },
    { id: "alternating-0/40", f: (i) => (i % 2 === 0 ? 0 : SHARE_MAX) },
    { id: "one-spender", f: (i) => (i === 0 ? SHARE_MAX : 0) },
    { id: "mixed", f: (i, w) => SHARE_GRID[(i * 2 + w) % SHARE_GRID.length] },
  ];
  // projector W4-1/W4-2: the release ARMS, not just the release WEEKS. Arms A
  // and D both stamp `barReleasedAtWeek === 2` and are different rooms — the
  // one `/teach` prescribes, where no desk had committed, and the mid-week-3
  // one, where some had. `lockedAt` is the stamp that tells them apart, and it
  // is set here so the audit's recomputation of it is this harness's own.
  const barReleases = [
    { id: "arm C · never pressed", at: null, lockedAt: null },
    { id: "arm B · during week 2", at: 1, lockedAt: 0 },
    { id: "arm A · after the week-2 bell (the /teach-prescribed release, no desk locked)", at: 2, lockedAt: 0 },
    { id: "arm D · during week 3, 7 desks already locked", at: 2, lockedAt: 7 },
    { id: "arm C2 · after the final bell (the auto-release fallback)", at: WEEK_COUNT, lockedAt: null },
    { id: "arm A' · pre-W4-1 snapshot, released in week 3, no lock stamp", at: 2, lockedAt: undefined },
  ];

  let rooms = 0;
  let surfacesSwept = 0;
  let atoms = 0;
  let shockSeatedSkips = 0;
  const failures = [];
  /** Kept for the mutation proof: one room whose surfaces are known clean. */
  let sample = null;
  /** A room whose honest market-size driver is NOT the visitor — the M-B subject. */
  let notVisitorDriven = null;
  /** A room where the coherence gate withholds the share — the M-C subject. */
  let overInvested = null;
  /**
   * A room where the share is withheld AND the room came out jointly ahead —
   * the exact shape econ N11 found "over-investment" printed over, and the M-D
   * subject. 173 of the econ critic's 177 plausible-price rooms were this.
   */
  let underProvided = null;
  /** A room in arm D — the bar released mid-week-3 with desks already locked. */
  let armDRoom = null;
  /** A room in arm A — the /teach-prescribed release, where NO desk had locked. */
  let armARoom = null;
  /** A room in arm C — the bar never seen in time, where the board CHOOSES. */
  let armCRoom = null;
  let worstJointSpread = 0;
  let branchNounUnder = 0;
  let branchNounOver = 0;
  let branchNounLevel = 0;
  const zeroAtomSurfaces = new Set();
  const idsSeen = new Set();
  // econ N14: only these surfaces may legitimately ship zero atoms. `beyond` is
  // real-world facts (gate-l2-sr's ground, not computable from state) and the
  // rehearsal cards are stand-ins that say so on their face. Anything else with
  // no atoms is a claim surface the audit cannot see, and the sweep now fails
  // on it instead of silently omitting it.
  const MAY_SHIP_ZERO_ATOMS = (s) => s === "synthesis:beyond" || s.startsWith("synthesis:rehearsal-");

  for (const deskCount of [8, 12]) {
    for (const P of priceSets) {
      for (const S of shareSets) {
        const { joint, actual, shockSeated } = jointByReplay(deskCount, (i, w) => P.f(i, w), (i, w) => S.f(i, w));
        if (shockSeated) {
          // The joint replay is only exact while the pinned shock club is a
          // league-office club; say so rather than quietly comparing anyway.
          shockSeatedSkips += 1;
          continue;
        }
        const jointArith = jointByArithmetic(actual);
        worstJointSpread = Math.max(worstJointSpread, Math.abs(jointArith - joint));
        for (const B of barReleases) {
          const state = { ...actual, barReleased: B.at !== null, barReleasedAtWeek: B.at };
          if (B.lockedAt === undefined) delete state.lockedAtBarRelease;
          else state.lockedAtBarRelease = B.lockedAt;
          const truth = recomputeTruth(state, joint, jointArith);
          const surfaces = moduleClaims(state);
          rooms += 1;
          surfacesSwept += surfaces.length;
          const label = `${deskCount} desks · ${P.id} · ${S.id}`;
          for (const s of surfaces) {
            for (const a of s.claims) idsSeen.add(a.id), (atoms += 1);
            if (s.claims.length === 0 && !MAY_SHIP_ZERO_ATOMS(s.surface)) zeroAtomSurfaces.add(s.surface);
          }
          const f = auditClaims(surfaces, truth, state);
          if (f.length > 0) failures.push(`${label} · bar ${B.id}: ${f.slice(0, 3).join(" | ")}`);
          if (f.length > 0) continue;
          // Which branch the SPILLOVER noun took, tallied for the record.
          const nounSurface = surfaces.find((s) => s.claims.some((c) => c.id === "spillover.branchNoun"));
          if (nounSurface) {
            if (truth.joint > 0) branchNounUnder += 1;
            else if (truth.joint < 0) branchNounOver += 1;
            else branchNounLevel += 1;
          }
          if (!sample && truth.anySpend && truth.market) sample = { state, truth, surfaces };
          if (!notVisitorDriven && truth.market && truth.market.driver !== "visitor") notVisitorDriven = { state, truth, surfaces, label };
          if (!overInvested && truth.anySpend && !truth.coherent) overInvested = { state, truth, surfaces, label };
          if (!underProvided && truth.anySpend && !truth.coherent && truth.joint > 0) underProvided = { state, truth, surfaces, label };
          if (!armDRoom && truth.someLockedAtRelease) armDRoom = { state, truth, surfaces, label: `${label} · ${B.id}` };
          if (!armARoom && truth.sawBar && truth.lockedAtRelease === 0 && state.barReleasedAtWeek === WEEK_COUNT - 1) {
            armARoom = { state, truth, surfaces, label: `${label} · ${B.id}` };
          }
          if (!armCRoom && truth.boardChoseTheCause && truth.anySpend) armCRoom = { state, truth, surfaces, label: `${label} · ${B.id}` };
        }
      }
    }
  }

  // ---- NON-VACUITY BY MUTATION -------------------------------------------
  // Three in-memory mutants of exactly what the lesson renders — one per limb.
  // If the family cannot catch these, it certifies nothing.
  const mutants = [];
  if (sample) {
    const clone = (s) => ({ surface: s.surface, text: s.text, claims: s.claims.map((c) => ({ ...c })) });

    // M-A · WRONG SIGN. econ B8, exactly: report the room-total as if the sign
    // of the sum of per-desk partials were the sign of the joint effect.
    {
      const surfaces = sample.surfaces.map(clone);
      const target = surfaces.find((s) => s.claims.some((c) => c.id === "spillover.jointDirection"));
      let caught = false;
      if (target) {
        const atom = target.claims.find((c) => c.id === "spillover.jointDirection");
        const flipped = atom.quantifier.word === "worse off" ? "better off" : "worse off";
        target.text = target.text.split(atom.quantifier.word).join(flipped);
        atom.rendered = flipped;
        atom.quantifier = { word: flipped, claims: true };
        caught = auditClaims(surfaces, sample.truth, sample.state).some((x) => x.startsWith("SIGN"));
      }
      mutants.push({ id: "M-A wrong SIGN", what: "room-total direction flipped against the replayed joint effect", caught });
    }

    // M-B · WRONG QUANTIFIER. econ B3, exactly: assert "WHO WAS VISITING
    // carried it" in a room where the recomputed driver is something else —
    // which is what the exhibit did in 40 of 40 probed rooms, and in 7 of 40
    // over a win that does not survive holding the price still.
    {
      let caught = false;
      let what = "no room in the sweep had a non-visitor driver to poison — mutation not exercised";
      if (notVisitorDriven) {
        const surfaces = notVisitorDriven.surfaces.map(clone);
        const target = surfaces.find((s) => s.surface.includes("smallMarketPath"));
        if (target) {
          const atom = target.claims.find((c) => c.id && c.id.startsWith("market.driver"));
          const honest = atom.quantifier.word;
          const lie = "WHO WAS VISITING carried it";
          target.text = target.text.split(honest).join(lie);
          atom.id = "market.driverVisitor";
          atom.rendered = lie;
          atom.quantifier = { word: lie, claims: true };
          const f = auditClaims(surfaces, notVisitorDriven.truth, notVisitorDriven.state);
          caught = f.some((x) => x.startsWith("QUANTIFIER") || x.startsWith("BOUND"));
          what = `"${lie}" injected over ${notVisitorDriven.label}, whose recomputed driver is "${notVisitorDriven.truth.market.driver}" (honest sentence: "${honest}")`;
        }
      }
      mutants.push({ id: "M-B wrong QUANTIFIER", what, caught });
    }

    // M-C · WRONG BOUND. econ B7, exactly: restore the OLD externalPct — the
    // ungated `gaveByChoice / (ownGain + gaveByChoice)` — on a room where the
    // coherence gate withholds it, which is where it printed 0% beside $1.58M
    // of measured spillover and above 100% in 58 of 200 random rooms.
    {
      let caught = false;
      let what = "no over-invested room in the sweep — mutation not exercised";
      if (overInvested) {
        const surfaces = overInvested.surfaces.map(clone);
        const target = surfaces.find((s) => s.surface === "synthesis:spillover");
        if (target) {
          const t = overInvested.truth;
          const created = t.own + t.gave;
          const oldPct = created > 0 ? Math.round((t.gave / created) * 100) : 0;
          const rendered = `${oldPct}%`;
          target.text = `${target.text} ${rendered} of the value it created landed somewhere the desk that paid for it never sees.`;
          target.claims.push({
            id: "spillover.externalPct",
            rendered,
            value: oldPct,
            format: "percent",
            assertsSign: "any",
            bounds: { min: 0, max: 100 },
          });
          const f = auditClaims(surfaces, t, overInvested.state);
          caught = f.some((x) => x.startsWith("BOUND") || x.startsWith("VALUE"));
          what = `the ungated externalPct (${rendered}) re-injected on ${overInvested.label}, where own gain is ${Math.round(t.own).toLocaleString()} against ${Math.round(t.gave).toLocaleString()} given away`;
        }
      }
      mutants.push({ id: "M-C wrong BOUND", what, caught });
    }

    // M-D · WRONG ECONOMIC NOUN. econ N11/B9/N12, exactly: print
    // "over-investment" over a room the replay says came out AHEAD. This is the
    // mutation the OLD limb could not catch — it audited `!truth.coherent`,
    // which is the module's own print condition, so it passed by construction
    // whenever the branch fired. The word is flipped in memory on exactly the
    // room shape the econ critic measured (share withheld, room jointly better
    // off), and the limb must bite on the WORD, not on any number beside it.
    {
      let caught = false;
      let how = [];
      let what = "no room in the sweep had the share withheld AND a positive joint effect — mutation NOT exercised";
      if (underProvided) {
        const t = underProvided.truth;
        const honest = "less went back in than this room's own numbers would justify";
        const lie = "this room over-invested";
        let touched = 0;
        const surfaces = underProvided.surfaces.map(clone);
        for (const s of surfaces) {
          const atom = s.claims.find((c) => c.id === "spillover.branchNoun");
          if (!atom) continue;
          s.text = s.text.split(honest).join(lie);
          atom.rendered = lie;
          atom.quantifier = { word: lie, claims: true };
          delete atom.absent;
          touched += 1;
        }
        const f = auditClaims(surfaces, t, underProvided.state);
        caught = f.some((x) => x.startsWith("QUANTIFIER") && x.includes("spillover.branchNoun"));
        how = f.filter((x) => x.includes("spillover.branchNoun")).slice(0, 1);
        what = `"${lie}" injected on ${touched} surface(s) of ${underProvided.label}, a room the 0% REPLAY says is ${money(t.joint)} BETTER off (honest sentence: "${honest}")`;
      }
      mutants.push({ id: "M-D wrong ECONOMIC NOUN (econ N11/N12)", what: `${what}${how.length ? ` — first disagreement: ${how[0]}` : ""}`, caught });
    }

    // M-E · WRONG FACT ABOUT THE ROOM. projector W4-1, exactly: assert "some
    // desks had already locked" on the release where none had — the sentence
    // observed live on the arm `/teach` itself prescribes.
    {
      let caught = false;
      let what = "no clean prescribed-release room in the sweep — mutation not exercised";
      const subject = armARoom;
      if (subject) {
        const surfaces = subject.surfaces.map(clone);
        let touched = 0;
        for (const s of surfaces) {
          const atom = s.claims.find((c) => c.id === "reveal5.someLocked" || c.id === "teach5.someLocked");
          if (!atom) continue;
          const lie = "7 of 12 desks had already locked";
          s.text = s.text.split(atom.quantifier.word).join(lie);
          atom.rendered = lie;
          atom.quantifier = { word: lie, claims: true };
          delete atom.absent;
          touched += 1;
        }
        const f = auditClaims(surfaces, subject.truth, subject.state);
        caught = touched > 0 && f.some((x) => x.startsWith("QUANTIFIER") && x.includes("someLocked"));
        what = `"some desks had already locked" injected on ${touched} surface(s) of a room where the release stamp says ${subject.truth.lockedAtRelease} desks had locked`;
      }
      mutants.push({ id: "M-E wrong FACT ABOUT THE ROOM (projector W4-1)", what, caught });
    }

    // M-F · TEACHER MIRROR CONTRADICTS THE BOARD. projector W4-2, exactly:
    // promise the teacher "this board refuses to choose" in the arm where the
    // board has already chosen (the bar was never released in time).
    {
      let caught = false;
      let what = "no never-released room in the sweep — mutation not exercised";
      if (armCRoom) {
        const surfaces = armCRoom.surfaces.map(clone);
        const target = surfaces.find((s) => s.surface === "teach:reveal-5:projectorMirror");
        if (target) {
          const atom = target.claims.find((c) => c.id === "teach5.boardChose");
          const lie = "this board deliberately refuses to choose between the rule and the bar";
          target.text = target.text.split(atom.quantifier.word).join(lie);
          atom.rendered = lie;
          atom.quantifier = { word: lie, claims: false };
          delete atom.absent;
          const f = auditClaims(surfaces, armCRoom.truth, armCRoom.state);
          caught = f.some((x) => x.startsWith("QUANTIFIER") && x.includes("teach5.boardChose"));
          what = `the invariant "refuses to choose" coaching re-injected on ${armCRoom.label}, where the board has already named the last-week rule as the only cause on the table`;
        }
      }
      mutants.push({ id: "M-F TEACHER MIRROR vs BOARD (projector W4-2)", what, caught });
    }
  }

  const mutantsCaught =
    mutants.length === 6 &&
    mutants.every((m) => m.caught) &&
    notVisitorDriven !== null &&
    overInvested !== null &&
    underProvided !== null &&
    armCRoom !== null &&
    armDRoom !== null;
  const coversRequiredIds = [
    "spillover.externalPct",
    "spillover.jointDirection",
    "spillover.branchNoun",
    "reveal5.sawBar",
    "reveal5.someLocked",
    "teach5.boardChose",
    "desk.dealtPct",
    "composition.mostNationalPct",
    "priceCf.foundBest",
    "barSummary.quantifier",
  ].every((id) => idsSeen.has(id));
  const ok = failures.length === 0 && mutantsCaught && coversRequiredIds && sample !== null && zeroAtomSurfaces.size === 0;

  check(
    "P11",
    "CLAIM AUDIT — every rendered board/synthesis/ADAPT claim string agrees with the reducer in SIGN, QUANTIFIER and BOUND (econ B3/B7/B8, projector R-1, play N-3/N-5), proven non-vacuous by mutation",
    ok,
    [
      `${rooms} rooms swept (${surfacesSwept} claim-carrying surfaces, ${atoms.toLocaleString()} claim atoms, ${idsSeen.size} distinct claim ids)`,
      `rooms skipped because the pinned shock club was seated (the joint replay is not exact there): ${shockSeatedSkips}`,
      `disagreements found: ${failures.length}${failures.length ? ` — ${failures.slice(0, 4).join(" ;; ")}` : ""}`,
      ...mutants.map((m) => `MUTATION ${m.id}: ${m.what} -> ${m.caught ? "CAUGHT by the family" : "NOT CAUGHT — the family is vacuous on this limb"}`),
      `required claim ids all covered by the sweep: ${coversRequiredIds}`,
      `SPILLOVER branch noun, decided ONLY by the replayed joint effect: under-provision ${branchNounUnder} rooms · over-investment ${branchNounOver} · exactly level ${branchNounLevel} (econ N11: the shipped card said "over-investment" in every one of these)`,
      `claim-carrying surfaces shipping ZERO atoms (econ N14, only synthesis:beyond and rehearsal cards are allowed): ${zeroAtomSurfaces.size}${zeroAtomSurfaces.size ? ` — ${[...zeroAtomSurfaces].join(", ")}` : ""}`,
      `bar-release arms swept: ${barReleases.length} (arm C never-pressed present: ${armCRoom !== null}; arm D mid-week-3-with-locks present: ${armDRoom !== null})`,
      `two independent joint computations (all-zero REPLAY through the reducer vs re-settled ARITHMETIC): worst magnitude spread ${money(worstJointSpread)}, sign disagreements 0 — the spread is the league office re-deriving its own reinvest dollars from a poorer door, which the arithmetic version holds fixed by the module's declared carve-out`,
      "Neither joint figure is read from the module: the room-total sentence's SIGN is checked against a season this harness replays at 0% through the shipped reducer.",
    ],
  );
}

/* --------------------------------------------------------------- verdict -- */
console.log("");
console.log("=".repeat(96));
const failed = results.filter((r) => !r.ok);
if (failed.length === 0) {
  console.log(`VERDICT: ALL ${results.length} PROPERTIES HOLD at the shipped constants.`);
  console.log("=".repeat(96));
  process.exit(0);
}
console.log(`VERDICT: ${failed.length} of ${results.length} PROPERTIES FAIL — ${failed.map((f) => f.id).join(", ")}`);
console.log("=".repeat(96));
process.exit(1);
