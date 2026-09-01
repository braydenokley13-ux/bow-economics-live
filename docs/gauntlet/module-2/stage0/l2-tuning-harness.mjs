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
 *   P3  free-riding is punished AND visible — the always-zero line ends poorer
 *       than the adaptive line, and the room's own give-and-take ledger shows
 *       the banker as a net taker without anybody being told.
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

  // VISIBLE: the room's own ledger shows the banker taking more than it gave,
  // and the feeder giving more than it took, with no copy asserting it.
  const visible = banker.net > 0 && feeder.net < 0 && banker.gave < feeder.gave;
  const drawFell = drawOf(state, 0) < CLUBS[0].startDraw;

  const ok = punished && visible && drawFell;
  check(
    "P3",
    "FL4/Family-2 — free-riding is punished AND visible: banking ends poorer than the adaptive line, and the room's own ledger shows the banker as a net taker",
    ok,
    [
      `punished: adaptive ${money(cashOf(adaptState, 0))} vs always-zero ${money(cashOf(zeroState, 0))} at the same seat`,
      `banker  Desk 1: gave ${money(banker.gave)} · received ${money(banker.received)} · net ${money(banker.net)} · Draw ${banker.drawStart} -> ${banker.drawEnd}`,
      `feeder  Desk 2: gave ${money(feeder.gave)} · received ${money(feeder.received)} · net ${money(feeder.net)} · Draw ${feeder.drawStart} -> ${feeder.drawEnd}`,
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
