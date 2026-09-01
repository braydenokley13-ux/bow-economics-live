#!/usr/bin/env node
/**
 * M2 L3 "WRITING THE RULE" — constant-tuning and property harness.
 *
 * Deterministic brute force over the SHIPPED constants and the SHIPPED reducer.
 * It imports the built module (runtime/dist/modules/writeTheRule.js) rather than
 * re-declaring any number or re-implementing any rule, so it cannot drift from
 * the lesson: if a constant moves, this moves with it, and every season it plays
 * is played through `writeTheRuleModule.reduce`.
 *
 * Run from the repo root, after `npm run build --prefix runtime`:
 *     node docs/gauntlet/module-2/stage0/l3-tuning-harness.mjs
 *
 * EXIT CODE IS THE EVIDENCE. Exit 0 only when every property below holds; exit 1
 * on any failure; exit 2 if the build is missing. There is no warn tier, and the
 * thresholds are the charter's, not this file's to soften.
 *
 * THE PROPERTIES
 * --------------
 *  P1  BC-1a — the DIFFERENTIAL REINVEST RESPONSE. The cash-best reinvest falls
 *      by at least TWO dial steps across the adopted shares, for every market
 *      profile, brute-forced over the shipped dial through the shipped
 *      settlement. This is the charter's discharge of dissent `l3-sharing-argmax`
 *      and it is the one property the module exists to carry.
 *  P2  BC-1b — the MOVING ARROW BESIDE THE FLAT ONE. At least one market's
 *      cash-best PRICE moves with the share, and at least one capacity-bound
 *      market's does not move at all — and the flat one is flat BECAUSE its
 *      building fills, which is checked, not asserted.
 *  P3  BC-1c — the taxed base coexists with an untaxed stream, and the untaxed
 *      stream is what makes the price move at all. Proven by re-deriving the
 *      argmax with the in-arena term deleted: the movement must vanish.
 *  P4  NO DOMINANT PROPOSAL. Reading your own club's position beats copying the
 *      median and beats voting your market's headcount, for at least one seat in
 *      each direction; and no single share is every club's own best share.
 *  P5  ADOPTION MECHANICS. Two-thirds passes, a split room falls to the status
 *      quo, the band is the published one, the condition follows the supporting
 *      bloc, and no proposal can drag the adopted share outside a bounded band.
 *  P6  THE DIFFERENTIAL-RESPONSE SCALE. The response is monotone-ish and
 *      material: the drop from share 0 to SHARE_MAX is at least a third of the
 *      dial for the median profile, and the CONDITION changes the best reinvest
 *      at some share (BC-6: the condition is a real, consequence-bearing
 *      decision, not the inert checkbox Stage-0 shipped).
 *  P7  NO UNWINNABLE SEAT (R5). From every reachable state, at every legal rule,
 *      every club clears its weekly bill at some legal price BEFORE any pot
 *      payout is counted.
 *  P8  THE POT IDENTITY. What leaves the clubs equals what reaches them, every
 *      week, on both branches of the condition.
 *  P9  CLAIM AUDIT. Every rendered claim string on every surface agrees with the
 *      reducer in BINDING, SIGN, QUANTIFIER, BOUND and LEVEL — proven
 *      non-vacuous by five mutations, one per limb.
 *  P10 DETERMINISM. The same session replays to the same numbers, and the
 *      module contains no random source.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..", "..", "..");
const DIST = path.join(REPO, "runtime", "dist", "modules", "writeTheRule.js");
const SRC = path.join(REPO, "runtime", "src", "modules", "writeTheRule.ts");

if (!fs.existsSync(DIST)) {
  console.error(`[l3-tuning] built module not found at ${DIST}`);
  console.error("[l3-tuning] run `npm run build --prefix runtime` first — this harness never re-declares constants.");
  process.exit(2);
}

const mod = await import(DIST);
const {
  ADOPT_BAND,
  CLUBS,
  CONDITION_MIN_REINVEST,
  DRAW_MAX,
  DRAW_MIN,
  MARKET_PROFILES,
  NATIONAL,
  PRICE_GRID,
  PRICE_STEP,
  REINVEST_GRID,
  REINVEST_MAX,
  REINVEST_STEP,
  ROUND_COUNT,
  SHARE_GRID,
  SHARE_MAX,
  STATUS_QUO_SHARE,
  WEEK_COUNT,
  bestPriceUnder,
  bestReinvestUnder,
  computeAggregate,
  hypotheticalRule,
  localMediaFor,
  moduleClaims,
  runAdoption,
  settleHome,
  snapShare,
  writeTheRuleModule,
} = mod;

const results = [];
function check(id, title, ok, rows = []) {
  results.push({ id, ok, title });
  console.log("");
  console.log(`${ok ? "PASS" : "FAIL"}  ${id} — ${title}`);
  for (const r of rows) console.log(`        ${r}`);
}

const money = (n) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
const capacityFor = (profileId) => CLUBS.find((c) => c.profileId === profileId).capacity;

/* -------------------------------------------------------- session driver -- */

const ctx = (phase, seatId) => ({ phase, seatId, seatIds: [], now: 0 });
function apply(state, action, phase, seatId) {
  const res = writeTheRuleModule.reduce(state, action, ctx(phase, seatId));
  if (!res.ok) throw new Error(`reducer rejected ${action.type}: ${res.reason}`);
  return res.state;
}

function seated(deskCount, seed) {
  let state = writeTheRuleModule.initialState({ sessionId: "harness", seatIds: [], seed });
  for (let i = 0; i < deskCount; i += 1) state = apply(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`);
  return state;
}

/**
 * Writes a rule through the real offer rounds, then plays the season through the
 * real week bell. `proposalFor(slot, round)` and `policyFor(slot, week, view)`
 * only ever read what a pair can see on its own screen.
 */
function playSession(deskCount, proposalFor, policyFor, opts = {}) {
  let state = seated(deskCount, opts.seed);
  for (let r = 0; r < ROUND_COUNT; r += 1) {
    for (let i = 0; i < deskCount; i += 1) {
      const slot = state.seatToSlot[`seat-${i}`];
      const p = proposalFor(slot, r, state);
      if (p) state = apply(state, { type: "propose", share: p.share, condition: p.condition }, "PLAY", `seat-${i}`);
    }
    state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  }
  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher"); // adoption
  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher"); // open the season
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (let i = 0; i < deskCount; i += 1) {
      const slot = state.seatToSlot[`seat-${i}`];
      const club = state.clubs[slot];
      const act = policyFor(slot, w, {
        draw: club.draw,
        profileId: club.profileId,
        rule: state.adopted,
        visitorDraw: state.clubs[(slot + 1 + (w % 3)) % state.leagueSize].draw,
      });
      state = apply(state, { type: "setPrice", price: act.price }, "PLAY", `seat-${i}`);
      state = apply(state, { type: "setReinvest", reinvest: act.reinvest }, "PLAY", `seat-${i}`);
      state = apply(state, { type: "lock" }, "PLAY", `seat-${i}`);
    }
    state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  }
  return state;
}

console.log("=".repeat(96));
console.log("M2 L3 'WRITING THE RULE' — tuning harness, shipped constants, shipped reducer");
console.log("=".repeat(96));
console.log(`SHARE dial ${SHARE_GRID[0]}-${SHARE_MAX}% in ${SHARE_GRID[1] - SHARE_GRID[0]}s · REINVEST dial ${REINVEST_GRID[0]}-${REINVEST_MAX}% in ${REINVEST_STEP}s · PRICE $${PRICE_GRID[0]}-$${PRICE_GRID[PRICE_GRID.length - 1]} in $${PRICE_STEP}s`);
console.log(`${MARKET_PROFILES.length} market profiles · ${WEEK_COUNT}-week season · ${ROUND_COUNT} offer rounds · two-thirds within ±${ADOPT_BAND}`);

/* ============================== P1 — BC-1a ================================ */

{
  const state = seated(12);
  const rows = [];
  let worst = Infinity;
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id);
    const curve = SHARE_GRID.map((share) => bestReinvestUnder(state, club, share === 0 ? null : hypotheticalRule(share, false)));
    const steps = (curve[0] - curve[curve.length - 1]) / REINVEST_STEP;
    worst = Math.min(worst, steps);
    rows.push(
      `${profile.id.padEnd(15)} r* across shares ${SHARE_GRID.map((s) => `${s}%`).join("/")}: ${curve.map((r) => `${r}%`).join(" ")}  → ${steps.toFixed(0)} dial steps`,
    );
  }
  rows.push(
    "The mechanism, stated so it is falsifiable: a club keeps kappa(s) = 1 - s(N-1)/N of every extra local dollar, Draw is bought with square-root returns, so the optimal spend goes as kappa^2 — the (1-s)^2 form the charter names. Nothing above is computed from that algebra: every number is a brute force over the shipped dial through the shipped settlement.",
  );
  check("P1", `BC-1a the DIFFERENTIAL REINVEST RESPONSE moves >= 2 dial steps in every market (worst: ${worst.toFixed(0)})`, worst >= 2, rows);
}

/* ============================== P2 — BC-1b ================================ */

{
  const state = seated(12);
  const moved = [];
  const flat = [];
  const rows = [];
  let raised = 0;
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id);
    const vDraw = state.clubs[(club.slot + 1) % state.leagueSize].draw;
    const curve = SHARE_GRID.map((share) => bestPriceUnder(state, club, share === 0 ? null : hypotheticalRule(share, false), club.draw, vDraw));
    const at = settleHome(profile, capacityFor(profile.id), club.draw, vDraw, curve[0]);
    const delta = curve[0] - curve[curve.length - 1];
    for (let i = 1; i < curve.length; i += 1) if (curve[i] > curve[i - 1]) raised += 1;
    (delta === 0 ? flat : moved).push(profile.id);
    rows.push(
      `${profile.id.padEnd(15)} p* ${curve.map((p) => `$${p}`).join(" ")}  Δ$${delta}  fill at p*(0): ${at.fillPct}% (${at.turnout}/${capacityFor(profile.id)}, turned away ${at.turnedAway})`,
    );
  }
  // The flat market must be flat BECAUSE it fills — otherwise the beat is a
  // coincidence of the grid rather than the teaching object the charter asks for.
  const flatAndFull = flat.filter((id) => {
    const profile = MARKET_PROFILES.find((p) => p.id === id);
    const club = state.clubs.find((c) => c.profileId === id);
    const vDraw = state.clubs[(club.slot + 1) % state.leagueSize].draw;
    const p = bestPriceUnder(state, club, null, club.draw, vDraw);
    return settleHome(profile, capacityFor(id), club.draw, vDraw, p).fillPct >= 97;
  });
  rows.push(`moved: ${moved.join(", ") || "NONE"} · flat: ${flat.join(", ") || "NONE"} · flat AND >=97% full: ${flatAndFull.join(", ") || "NONE"}`);
  rows.push("The flat arrow is the teaching object, not a defect: under a binding capacity clamp the optimum sits where the building fills, and a tax on what you sell cannot move a quantity you cannot increase.");
  check(
    "P2",
    "BC-1b at least one market's best PRICE moves with the share, at least one capacity-bound market's does not, and sharing never RAISES a price",
    moved.length > 0 && flatAndFull.length > 0 && raised === 0,
    rows,
  );
}

/* ============================== P3 — BC-1c ================================ */

{
  // The claim under audit: the price moves ONLY because an untaxed stream
  // coexists with the taxed one. Re-derive the argmax with the untaxed in-arena
  // term deleted; if the movement survives that deletion, the module is teaching
  // something other than what it says it teaches.
  const state = seated(12);
  const rows = [];
  let survives = 0;
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id);
    const cap = capacityFor(profile.id);
    const vDraw = state.clubs[(club.slot + 1) % state.leagueSize].draw;
    const argmaxNoAncillary = (share) => {
      let best = PRICE_GRID[0];
      let bestVal = -Infinity;
      for (const p of PRICE_GRID) {
        const home = settleHome(profile, cap, club.draw, vDraw, p);
        const lm = localMediaFor(profile, club.draw);
        const val = (1 - share / 100) * (home.gate + lm); // in-arena DELETED
        if (val > bestVal + 1e-9) {
          bestVal = val;
          best = p;
        }
      }
      return best;
    };
    const withA0 = bestPriceUnder(state, club, null, club.draw, vDraw);
    const withA60 = bestPriceUnder(state, club, hypotheticalRule(SHARE_MAX, false), club.draw, vDraw);
    const noA0 = argmaxNoAncillary(0);
    const noA60 = argmaxNoAncillary(SHARE_MAX);
    if (noA0 !== noA60) survives += 1;
    rows.push(
      `${profile.id.padEnd(15)} shipped model Δ$${withA0 - withA60} · with the untaxed in-arena stream DELETED Δ$${noA0 - noA60} (must be $0)`,
    );
  }
  rows.push("A uniformly taxed base cannot move an argmax — scaling a function by a positive constant does not move its maximiser. This is the arithmetic `l3-arith-harness` published, and it is the reason the module leaves one real revenue stream out of the pot.");
  check("P3", "BC-1c the price movement is caused by the untaxed stream, and vanishes when that stream is deleted", survives === 0, rows);
}

/* ============================ P4 — no dominant proposal =================== */

{
  // "Reading your own club" has to be measured at LEAGUE EQUILIBRIUM, not
  // against a frozen league: sharing's whole defence is that it feeds back
  // through the product, so an instrument that holds every other club fixed
  // answers 0% for everybody by construction and proves nothing.
  //
  // So: replay the ENTIRE season through the shipped reducer at every share on
  // the dial, with every club playing its own cash-best price and cash-best
  // reinvest under the rule in force, and read each club's own season money
  // (plus its terminal Draw credit, which is the second season the rule binds).
  const DESKS = 12;
  const seasonAt = (share, condition) => {
    let s = seated(DESKS);
    s = { ...s, adopted: share === null ? null : hypotheticalRule(share, condition), stage: "season" };
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      for (let i = 0; i < DESKS; i += 1) {
        const slot = s.seatToSlot[`seat-${i}`];
        const club = s.clubs[slot];
        const v = mod.visitorSlotFor(slot, w, s.leagueSize);
        s = apply(s, { type: "setPrice", price: bestPriceUnder(s, club, s.adopted, club.draw, s.clubs[v].draw) }, "PLAY", `seat-${i}`);
        s = apply(s, { type: "setReinvest", reinvest: bestReinvestUnder(s, club, s.adopted) }, "PLAY", `seat-${i}`);
        s = apply(s, { type: "lock" }, "PLAY", `seat-${i}`);
      }
      s = apply(s, { type: "teacher:closeWeek" }, "PLAY", "teacher");
    }
    return s;
  };
  const ownMoney = (state, slot) => {
    const club = state.clubs[slot];
    const profile = MARKET_PROFILES.find((p) => p.id === club.profileId);
    return club.weeks.reduce((a, w) => a + w.cashDelta, 0) + profile.terminalDrawDollars * club.draw;
  };

  const curves = new Map(); // slot -> [money at each share]
  for (const share of SHARE_GRID) {
    const s = seasonAt(share, false);
    for (const club of s.clubs.slice(0, s.leagueSize)) {
      if (!curves.has(club.slot)) curves.set(club.slot, []);
      curves.get(club.slot).push(ownMoney(s, club.slot));
    }
  }
  const ideal = new Map();
  const rows = [];
  for (const [slot, vals] of curves) {
    const best = SHARE_GRID[vals.indexOf(Math.max(...vals))];
    ideal.set(slot, best);
    const sizeLabel = MARKET_PROFILES.find((p) => p.id === CLUBS[slot].profileId).sizeLabel;
    rows.push(`${CLUBS[slot].short.padEnd(15)} ${sizeLabel.padEnd(13)} own best share ${String(best).padStart(3)}%  (season money at 0% / 30% / 60%: ${money(vals[0])} / ${money(vals[6])} / ${money(vals[12])})`);
  }
  const distinct = new Set(ideal.values());

  // (b) HEADCOUNT CANNOT WIN. A room where every desk votes its own market's
  // extreme fails two-thirds and falls to the status quo — which is exactly the
  // contract's named breaker for headcount dominance, executed rather than
  // asserted. If this room ADOPTED, the lesson would be a poll.
  const headcountRoom = (() => {
    let s = seated(DESKS);
    for (let i = 0; i < DESKS; i += 1) {
      const slot = s.seatToSlot[`seat-${i}`];
      const big = MARKET_PROFILES.find((p) => p.id === s.clubs[slot].profileId).sizeLabel === "BIG MARKET";
      s = apply(s, { type: "propose", share: big ? 0 : SHARE_MAX, condition: false }, "PLAY", `seat-${i}`);
    }
    return runAdoption(s);
  })();

  // (c) COPYING THE MEDIAN IS NOT FREE. Compare every seat's own money at the
  // middle of the dial against its own best share.
  const middle = SHARE_GRID[Math.floor(SHARE_GRID.length / 2)];
  let worseUnderCopy = 0;
  let worstGap = { gap: 0, label: "" };
  for (const [slot, vals] of curves) {
    const atCopy = vals[SHARE_GRID.indexOf(middle)];
    const atBest = Math.max(...vals);
    if (atBest > atCopy + 1) {
      worseUnderCopy += 1;
      if (atBest - atCopy > worstGap.gap) worstGap = { gap: atBest - atCopy, label: CLUBS[slot].short };
    }
  }

  // (d) A ROOM THAT TRADES CAN STILL ADOPT — the supermajority forces a deal,
  // it does not forbid one.
  const tradedRoom = (() => {
    let s = seated(DESKS);
    for (let i = 0; i < DESKS; i += 1) {
      const slot = s.seatToSlot[`seat-${i}`];
      const big = MARKET_PROFILES.find((p) => p.id === s.clubs[slot].profileId).sizeLabel === "BIG MARKET";
      s = apply(s, { type: "propose", share: big ? 20 : 30, condition: false }, "PLAY", `seat-${i}`);
    }
    return runAdoption(s);
  })();

  rows.push(`distinct own-best shares across the room: ${[...distinct].sort((a, b) => a - b).map((x) => `${x}%`).join(", ")} — a room where one number were best for everybody would be a vote with a correct answer, which is the contract's guess-the-teacher trap`);
  rows.push(`HEADCOUNT room (every big market at 0%, every small market at ${SHARE_MAX}%): ${headcountRoom.adopted.how} at ${headcountRoom.adopted.share}%, ${headcountRoom.inBand}/${headcountRoom.needed} needed — voting your type cannot carry a rule, so the two sides have to trade`);
  rows.push(`TRADED room (big markets 20%, small markets 30%): ${tradedRoom.adopted.how} at ${tradedRoom.adopted.share}% — the supermajority forces a deal, it does not forbid one`);
  rows.push(`seats strictly worse off copying the middle of the dial (${middle}%) than reading their own club: ${worseUnderCopy} of ${curves.size}${worstGap.label ? `, worst ${money(worstGap.gap)} at ${worstGap.label}` : ""}`);
  rows.push("HONEST LIMIT, ledgered in SIMPLIFICATIONS: the big markets' own best share is 0%. The design hoped for an interior optimum above zero for every market; at the shipped constants that does not hold, because a capacity-bound building (BC-1b's flat arrow) is barely exposed to a weak visitor. The module never claims otherwise on any surface.");

  check(
    "P4",
    "NO DOMINANT PROPOSAL — own-best shares differ by market, a pure headcount room cannot carry a rule, a traded room can, and copying the median costs real seats real money",
    distinct.size >= 2 && headcountRoom.adopted.how === "statusQuo" && tradedRoom.adopted.how === "voted" && worseUnderCopy > 0,
    rows,
  );
}

/* ============================ P5 — adoption mechanics ===================== */

{
  const fail = [];
  const rows = [];

  // Clustered room adopts at the median.
  const clustered = runAdoption(
    (() => {
      let s = seated(9);
      const shares = [25, 30, 35];
      s.clubs.filter((c) => c.seatId !== null).forEach((c, i) => {
        s = apply(s, { type: "propose", share: shares[i % 3], condition: false }, "PLAY", c.seatId);
      });
      return s;
    })(),
  );
  if (clustered.adopted.how !== "voted" || clustered.adopted.share !== 30) fail.push(`clustered room did not adopt at its median: ${JSON.stringify(clustered.adopted)}`);
  rows.push(`clustered 25/30/35 → ${clustered.adopted.how} at ${clustered.adopted.share}%, ${clustered.adopted.supporting}/${clustered.adopted.liveDesks} inside ±${ADOPT_BAND}`);

  // Split room falls to the status quo, and that is a legitimate outcome.
  const split = runAdoption(
    (() => {
      let s = seated(9);
      const shares = [0, 30, 60];
      s.clubs.filter((c) => c.seatId !== null).forEach((c, i) => {
        s = apply(s, { type: "propose", share: shares[i % 3], condition: false }, "PLAY", c.seatId);
      });
      return s;
    })(),
  );
  if (split.adopted.how !== "statusQuo" || split.adopted.share !== STATUS_QUO_SHARE) fail.push(`split room did not fall to the status quo: ${JSON.stringify(split.adopted)}`);
  rows.push(`split 0/30/60 → ${split.adopted.how} at ${split.adopted.share}%, ${split.inBand}/${split.needed} needed`);

  // A holdout has real influence, bounded — sweep one desk's proposal across the
  // whole dial with the rest of the room fixed at 20% and read the adopted share.
  const band = [];
  for (const mine of SHARE_GRID) {
    let s = seated(9);
    s.clubs.filter((c) => c.seatId !== null).forEach((c, i) => {
      s = apply(s, { type: "propose", share: i === 0 ? mine : 20, condition: false }, "PLAY", c.seatId);
    });
    const out = runAdoption(s);
    band.push({ mine, adopted: out.adopted.share, how: out.adopted.how });
  }
  const influence = new Set(band.filter((b) => b.how === "voted").map((b) => b.adopted));
  rows.push(`one desk sweeping the dial against a room at 20%: ${band.map((b) => `${b.mine}→${b.adopted}${b.how === "voted" ? "" : "*"}`).join(" ")} (* = status quo)`);
  rows.push(`adopted shares reachable by one desk alone: ${[...influence].sort((a, b) => a - b).join(", ")} — bounded influence, not a hijack`);
  if (influence.size > 3) fail.push(`one desk can move the adopted share to ${influence.size} different values — the adoption test is gameable`);

  // Every adopted share is on the dial the room was given.
  for (const b of band) if (!SHARE_GRID.includes(b.adopted)) fail.push(`adopted ${b.adopted}% is not on the dial`);
  if (snapShare(63) !== SHARE_MAX || snapShare(-4) !== SHARE_GRID[0]) fail.push("snapShare does not clamp to the dial");

  // ---- THE ADOPTION RATE, MEASURED ----------------------------------------
  // econ dissent 2 / F1: the mechanism's attractor is STATUS QUO, and at 5%
  // BC-1's payload is null. The wave's charter asks for this number on the
  // record after the repair. It is printed, not asserted: the supermajority is
  // correct economics and the econ gate ruled explicitly against tuning it away,
  // so the repair is an OUTCOME-ADAPTIVE REVEAL rather than a retune, and this
  // sweep is the honest statement of how often that branch fires.
  {
    const PROFILE = [0, 15, 30, 45, 60];
    const DESKS = 6;
    const base = seated(DESKS);
    const seats = base.clubs.filter((c) => c.seatId !== null).map((c) => c.seatId);
    const hist = new Map();
    let adopted = 0;
    let total = 0;
    const idx = new Array(DESKS).fill(0);
    for (;;) {
      let s = base;
      for (let i = 0; i < DESKS; i += 1) s = apply(s, { type: "propose", share: PROFILE[idx[i]], condition: false }, "PLAY", seats[i]);
      s = mod.closeRound(s);
      const out = runAdoption(s);
      total += 1;
      if (out.adopted.how === "voted") adopted += 1;
      hist.set(out.adopted.share, (hist.get(out.adopted.share) ?? 0) + 1);
      let k = DESKS - 1;
      while (k >= 0 && ++idx[k] === PROFILE.length) idx[k--] = 0;
      if (k < 0) break;
    }
    const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
    rows.push(
      `ADOPTION RATE over ${total.toLocaleString()} uniform proposal profiles (${PROFILE.length}^${DESKS}), driven through closeRound + runAdoption: ADOPTED ${pct(adopted)} · STATUS QUO ${pct(total - adopted)}`,
    );
    rows.push(
      `adopted-share histogram: ${[...hist.entries()].sort((a, b) => b[1] - a[1]).map(([share, n]) => `${share}%: ${pct(n)}`).join(" · ")}`,
    );
    rows.push(
      "NOT TUNED. The supermajority is the mechanism working — a room that cannot buy its big markets keeps the old rule, which is the real politics of the real league. The repair is that the reveal now TEACHES that branch (stage 4 branches, prints why nothing moved, and shows what the number the room argued about would have moved) instead of asking a false-premise question over a null instrument.",
    );
  }

  check("P5", "ADOPTION MECHANICS — two-thirds passes, a split room falls to a legitimate status quo, and one desk's influence is bounded", fail.length === 0, [...rows, ...fail]);
}

/* ==================== P6 — the differential-response scale ================ */

{
  const state = seated(12);
  const rows = [];
  const drops = [];
  let conditionBites = 0;
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id);
    const off = SHARE_GRID.map((s) => bestReinvestUnder(state, club, s === 0 ? null : hypotheticalRule(s, false)));
    const on = SHARE_GRID.map((s) => bestReinvestUnder(state, club, hypotheticalRule(s, true)));
    const differs = SHARE_GRID.filter((_, i) => off[i] !== on[i]).length;
    conditionBites += differs;
    drops.push((off[0] - off[off.length - 1]) / REINVEST_MAX);
    rows.push(`${profile.id.padEnd(15)} condition OFF ${off.map((r) => String(r).padStart(2)).join(" ")} | ON ${on.map((r) => String(r).padStart(2)).join(" ")} | differs at ${differs} of ${SHARE_GRID.length} shares`);
  }
  const medianDrop = [...drops].sort((a, b) => a - b)[Math.floor(drops.length / 2)];
  rows.push(`drop as a fraction of the whole dial, per profile: ${drops.map((d) => `${Math.round(d * 100)}%`).join(" ")} (median ${Math.round(medianDrop * 100)}%)`);
  rows.push(`BC-6 fix 1: the CONDITION changed the cash-best reinvest at ${conditionBites} (profile × share) points. Stage-0 shipped a control that changed nothing in 0 of 14 configurations, and that was the one honesty defect the play review said it would block a selection on.`);
  check(
    "P6",
    "THE DIFFERENTIAL-RESPONSE SCALE is material (>=1/3 of the dial at the median profile) and the CONDITION is consequence-bearing",
    medianDrop >= 1 / 3 && conditionBites > 0,
    rows,
  );
}

/* ============================== P7 — R5 ================================== */

{
  const fail = [];
  let cases = 0;
  let worst = { margin: Infinity, label: "" };
  for (const share of SHARE_GRID) {
    for (const profile of MARKET_PROFILES) {
      const cap = capacityFor(profile.id);
      for (const hostDraw of [DRAW_MIN, 30, 50, 70, DRAW_MAX]) {
        for (const visitorDraw of [DRAW_MIN, 40, DRAW_MAX]) {
          cases += 1;
          let best = -Infinity;
          for (const p of PRICE_GRID) {
            const home = settleHome(profile, cap, hostDraw, visitorDraw, p);
            const lm = localMediaFor(profile, hostDraw);
            const contribution = (share / 100) * (home.gate + lm);
            // No pot payout counted: the seat must clear its bill on its own.
            best = Math.max(best, home.gate + home.inArena + lm + NATIONAL - profile.bill - contribution);
          }
          if (best < worst.margin) worst = { margin: best, label: `${profile.id} share ${share}% draws ${hostDraw}/${visitorDraw}` };
          if (best < 0) fail.push(`${profile.id} at share ${share}%, draws ${hostDraw}/${visitorDraw}: best achievable margin ${money(best)}`);
        }
      }
    }
  }
  check("P7", `NO UNWINNABLE SEAT (R5) across ${cases} reachable (profile × share × draw-pair) cases, before any pot payout`, fail.length === 0, [
    `thinnest margin anywhere: ${money(worst.margin)} at ${worst.label}`,
    "The national check is unconditional and the pot never touches it — which is also the lesson.",
    ...fail.slice(0, 8),
  ]);
}

/* ============================== P8 — pot identity ======================== */

{
  const fail = [];
  const rows = [];
  for (const condition of [false, true]) {
    for (const share of [10, 30, SHARE_MAX]) {
      const state = playSession(
        12,
        () => ({ share, condition }),
        (slot, week) => ({ price: 44 + (slot % 7) * 2, reinvest: REINVEST_GRID[(slot + week) % REINVEST_GRID.length] }),
      );
      for (let w = 0; w < WEEK_COUNT; w += 1) {
        let paid = 0;
        let took = 0;
        for (const club of state.clubs.slice(0, state.leagueSize)) {
          paid += club.weeks[w].pot.paidIn;
          took += club.weeks[w].pot.tookOut;
        }
        const drift = Math.abs(paid - took);
        if (drift > state.leagueSize) fail.push(`share ${share}% condition ${condition} week ${w + 1}: ${money(paid)} left the clubs, ${money(took)} reached them`);
        if (w === WEEK_COUNT - 1) {
          const docked = state.clubs.slice(0, state.leagueSize).filter((c) => c.weeks.some((x) => x.pot.docked)).length;
          rows.push(`share ${String(share).padStart(2)}% condition ${condition ? "ON " : "OFF"} → adopted ${state.adopted.share}% · pot ${money(paid)}/week · rounding drift <= ${drift} · clubs docked at some point: ${docked}`);
        }
      }
    }
  }
  check("P8", "THE POT IDENTITY closes every week on both branches of the condition (drift bounded by one rounding unit per club)", fail.length === 0, [...rows, ...fail]);
}

/* ============================== P9 — claim audit ========================= */

const fmt = (value, format) => {
  const m = (n) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
  if (format === "money" || format === "dollars0") return m(value);
  if (format === "percent") return `${Math.round(value)}%`;
  if (format === "percent1") return `${Math.round(value * 10) / 10}%`;
  return `${Math.round(value)}`;
};

/**
 * The audit. Returns failure strings; empty is a pass. `surfaces` is a parameter
 * so the mutation proof can hand it a poisoned copy of exactly what the lesson
 * renders — an audit that cannot be shown to bite is not evidence.
 */
function auditClaims(surfaces, truth) {
  const fail = [];
  for (const surface of surfaces) {
    for (const a of surface.claims) {
      const at = `${surface.surface}/${a.id}`;
      // ---- COVERAGE. econ dissent `econ-l3-claim-audit-vacuous`: the old audit
      // asserted `s.text.includes(atom.rendered)` where `rendered` was derived
      // from `atom.value` by the SAME expression that built the sentence, so the
      // check was tautological for values; and `quantifier.claims` was stored
      // and never asserted at all. Both sub-classes are now closed by making the
      // audit REFUSE TO PASS an atom it cannot check independently. A new atom
      // with no recomputation registered in `truthFor` fails the suite — it is
      // not silently waved through, which is how the value class stayed open.
      const isQuantifier = Boolean(a.quantifier);
      const generic = a.id.replace(/-\d+$/, "-N");
      if (isQuantifier) {
        if (!truth.predicates.has(a.id) && !truth.predicates.has(generic)) {
          fail.push(`COVERAGE ${at}: quantifier atom has no independently recomputed predicate — the audit cannot see whether this word is true`);
        }
      } else if (!truth.values.has(a.id) && !truth.values.has(generic)) {
        fail.push(`COVERAGE ${at}: value atom has no independently recomputed magnitude — a value drift here would be invisible`);
      }
      // BINDING — the printed substring IS the computed value, and it is present.
      if (!a.quantifier && a.rendered !== fmt(a.value, a.format)) {
        fail.push(`BINDING ${at}: printed "${a.rendered}" but the value renders as "${fmt(a.value, a.format)}"`);
      }
      if (!surface.text.includes(a.rendered)) fail.push(`BINDING ${at}: "${a.rendered}" is not on the surface`);
      if (a.absent !== undefined && surface.text.includes(a.absent)) {
        fail.push(`BINDING ${at}: forbidden phrase "${a.absent}" is on the surface`);
      }
      // SIGN
      if (a.assertsSign === "positive" && !(a.value > 0)) fail.push(`SIGN ${at}: asserts positive, value ${a.value}`);
      if (a.assertsSign === "negative" && !(a.value < 0)) fail.push(`SIGN ${at}: asserts negative, value ${a.value}`);
      if (a.assertsSign === "nonNegative" && !(a.value >= 0)) fail.push(`SIGN ${at}: asserts non-negative, value ${a.value}`);
      if (a.assertsSign === "zero" && a.value !== 0) fail.push(`SIGN ${at}: asserts zero, value ${a.value}`);
      // QUANTIFIER — the word's predicate, recomputed independently. An atom
      // whose predicate is not registered has already failed COVERAGE above, so
      // an unchecked `claims` can no longer reach a student surface.
      if (a.quantifier) {
        if (!surface.text.includes(a.quantifier.word)) fail.push(`QUANTIFIER ${at}: the word "${a.quantifier.word}" is not on the surface`);
        const recomputed = truth.predicates.has(a.id) ? truth.predicates.get(a.id) : truth.predicates.get(generic);
        if (recomputed !== undefined && recomputed !== a.quantifier.claims) {
          fail.push(`QUANTIFIER ${at}: the sentence claims ${a.quantifier.claims} but the reducer says ${recomputed} (word: "${a.quantifier.word}")`);
        }
      }
      // BOUND
      if (a.bounds?.min !== undefined && a.value < a.bounds.min - 1e-9) fail.push(`BOUND ${at}: ${a.value} < ${a.bounds.min}`);
      if (a.bounds?.max !== undefined && a.value > a.bounds.max + 1e-9) fail.push(`BOUND ${at}: ${a.value} > ${a.bounds.max}`);
      // ---- VALUE. EVERY rendered dollar/percent/count magnitude, recomputed by
      // this harness from RAW STATE and compared to the atom. This is the limb
      // the dissent was recorded against: doubling `pot-total` used to print a
      // 2x falsehood on the projector while the whole suite passed.
      if (!isQuantifier) {
        const want = truth.values.has(a.id) ? truth.values.get(a.id) : truth.values.get(generic);
        if (want !== undefined) {
          const tol =
            a.format === "money" || a.format === "dollars0"
              ? Math.max(4, truth.leagueSize * 2)
              : a.format === "percent1"
                ? 0.2
                : a.format === "percent"
                  ? 0.5
                  : 0;
          if (Math.abs(a.value - want) > tol + 1e-9) {
            fail.push(`VALUE ${at}: the surface prints ${a.value} (${a.rendered}) but this harness recomputes ${want} from raw state`);
          }
        }
      }
    }
    // LEVEL — a surface may not prescribe a direction the room's own gradient
    // contradicts. The only directional phrase this lesson prints about the
    // room's own behaviour is the effort direction, and it is recomputed here.
    // The comparison is in DOLLARS A WEEK now, not dial percentages: the two
    // lessons' dials are shares of different bases (econ B3), so a percentage
    // "effort fell by Z" sentence measured the bases, not the room.
    if ((surface.surface === "board:consequence:era" || surface.surface === "teach:consequence:ask") && truth.l2MeanDollars !== null) {
      const wentDown = truth.l3MeanDollars < truth.l2MeanDollars - 1;
      const wentUp = truth.l3MeanDollars > truth.l2MeanDollars + 1;
      if (surface.text.includes("went down") && !wentDown) {
        fail.push(`LEVEL ${surface.surface}: prints "went down" but the room spent ${Math.round(truth.l2MeanDollars)} -> ${Math.round(truth.l3MeanDollars)} a week`);
      }
      if ((surface.text.includes("went up") || surface.text.includes("went UP")) && !wentUp) {
        fail.push(`LEVEL ${surface.surface}: prints "went up" but the room spent ${Math.round(truth.l2MeanDollars)} -> ${Math.round(truth.l3MeanDollars)} a week`);
      }
    }
    // teacher B1: the scripted ASK and the computed line beside it must agree.
    if (surface.surface === "teach:consequence:ask" && truth.l2MeanDollars !== null) {
      const wentDown = truth.l3MeanDollars < truth.l2MeanDollars - 1;
      if (/Whose effort went down/.test(surface.text) && !wentDown) {
        fail.push(`LEVEL ${surface.surface}: the teacher is directed to ask "whose effort went down?" in a room whose own bar says it did not`);
      }
      if (/Whose effort went UP/.test(surface.text) && !(truth.l3MeanDollars > truth.l2MeanDollars + 1)) {
        fail.push(`LEVEL ${surface.surface}: the teacher is directed to ask "whose effort went UP?" in a room whose own bar says it did not`);
      }
    }
  }
  return fail;
}

/**
 * THE RENDER LIMB — what the three surfaces actually emit, harvested from the
 * shipped view functions.
 *
 * econ re-check R1 (blocking): `moduleClaims` and the student device were two
 * different code paths saying two different things about the same pot, and the
 * audit only ever read the first. Drifting the rendered week line by 40% left
 * this harness passing 10/10. So the audit no longer trusts the registry to
 * describe the product: it drives `studentView` / `boardView` / `teacherView`
 * over every phase, collects every string they emit, and requires each REGISTERED
 * sentence to appear in the surface family it claims to be on. A sentence that
 * is audited but never rendered, or rendered but drifted away from its audited
 * form, fails here.
 */
function renderedBlobs(state) {
  const bags = { play: [], board: [], teach: [] };
  const walk = (v, bag) => {
    if (typeof v === "string") { bag.push(v); return; }
    if (Array.isArray(v)) { for (const x of v) walk(x, bag); return; }
    if (v && typeof v === "object") { for (const x of Object.values(v)) walk(x, bag); }
  };
  const seats = state.clubs.filter((c) => c.seatId !== null).map((c) => c.seatId);
  // The claim registry is phase-free and stage-free, but the surfaces are not: a
  // session passes through the ADOPTED stage on its way to the season, and the
  // end-of-session state no longer renders it. The harvest therefore covers the
  // stages a session passes through, not only the one it stopped on.
  const variants = state.adopted && state.stage !== "adopted" ? [state, { ...state, stage: "adopted" }] : [state];
  for (const variant of variants) {
    for (const phase of writeTheRuleModule.phases) {
      walk(writeTheRuleModule.boardView(variant, phase), bags.board);
      walk(writeTheRuleModule.teacherView(variant, phase), bags.teach);
      for (const seatId of seats) walk(writeTheRuleModule.studentView(variant, seatId, phase), bags.play);
    }
  }
  const join = (xs) => ` ${xs.join(" ")} `;
  return { play: join(bags.play), board: join(bags.board), teach: join(bags.teach) };
}

/**
 * `blobs` is a parameter for the same reason `surfaces` is: the mutation proof
 * hands this a poisoned copy of what the views emit, and it must bite.
 */
function auditRendered(surfaces, blobs) {
  const fail = [];
  const all = `${blobs.play}${blobs.board}${blobs.teach}`;
  for (const s of surfaces) {
    if (s.claims.length === 0) continue;
    const family = s.surface.split(":")[0];
    const hay = family === "play" ? blobs.play : family === "board" ? blobs.board : family === "teach" ? blobs.teach : all;
    if (!hay.includes(s.text)) {
      const near = s.text.slice(0, 60);
      fail.push(
        `RENDER ${s.surface}: the audited sentence is not among the strings ${family === "synthesis" ? "any surface" : `/${family}`} actually renders — audited text begins "${near}…"`,
      );
    }
  }
  return fail;
}

/**
 * Everything the audit checks against, recomputed from RAW STATE by this file.
 *
 * Nothing below reads a rendered string, a claim builder or an aggregate field
 * that the copy also reads: the pot totals, the era dollars, the counterfactual
 * nets, the road ledger and the adoption arithmetic are all re-derived here from
 * `state.clubs[*].weeks[*]` and from the shipped brute-force primitives. That is
 * the whole point — an audit built out of the same expression as the sentence
 * proves only that the sentence quotes itself.
 */
function truthFor(state) {
  const size = state.leagueSize;
  const live = state.clubs.slice(0, size).filter((c) => c.seatId !== null);
  let potTotal = 0;
  for (const club of state.clubs.slice(0, size)) for (const w of club.weeks) potTotal += w.pot.paidIn;

  const meanOf = (xs) => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const l3Mean = meanOf(live.map((c) => (c.weeks.length ? meanOf(c.weeks.map((w) => w.reinvest)) : c.reinvest)));
  const l3MeanDollars = meanOf(live.map((c) => (c.weeks.length ? meanOf(c.weeks.map((w) => w.reinvestSpend)) : 0)));
  const l2Rows = live.filter((c) => c.l2Reinvest !== null);
  const l2Mean = l2Rows.length > 0 ? meanOf(l2Rows.map((c) => c.l2Reinvest)) : null;
  const l2DollarRows = live.filter((c) => c.l2ReinvestDollars !== null);
  const l2MeanDollars = l2DollarRows.length > 0 ? meanOf(l2DollarRows.map((c) => c.l2ReinvestDollars)) : null;

  // Per-desk pot flows, straight off the settled weeks.
  const flows = live.map((c) => {
    const paidIn = c.weeks.reduce((a, w) => a + w.pot.paidIn, 0);
    const tookOut = c.weeks.reduce((a, w) => a + w.pot.tookOut, 0);
    return { deskNumber: c.deskNumber, paidIn, tookOut, net: tookOut - paidIn };
  });
  const payers = flows.filter((f) => f.net < 0).length;
  const receivers = flows.filter((f) => f.net > 0).length;
  const biggestSwing = flows.length > 0 ? Math.max(...flows.map((f) => Math.abs(f.net))) : 0;

  // The arrows, re-derived from the shipped brute force rather than read off
  // `agg.arrows` — the aggregation is what is under audit.
  const rule = state.adopted;
  const arrowOf = (club, r) => {
    const week = Math.min(Math.max(0, state.weekIndex - 1), WEEK_COUNT - 1);
    const settled = club.weeks[week];
    const hostDraw = settled ? settled.hostDrawAtTip : club.draw;
    const vSlot = mod.visitorSlotFor(club.slot, week, size);
    const visitorDraw = settled ? settled.visitorDrawAtTip : state.clubs[vSlot].draw;
    const p0 = bestPriceUnder(state, club, null, hostDraw, visitorDraw);
    const p1 = r ? bestPriceUnder(state, club, r, hostDraw, visitorDraw) : p0;
    const r0 = bestReinvestUnder(state, club, null);
    const r1 = r ? bestReinvestUnder(state, club, r) : r0;
    return { priceSteps: Math.round((p0 - p1) / PRICE_STEP), reinvestSteps: Math.round((r0 - r1) / REINVEST_STEP), r0, r1 };
  };
  const arrows = live.map((c) => arrowOf(c, rule));
  const flatCount = arrows.filter((a) => a.priceSteps === 0).length;
  const movedPriceCount = arrows.filter((a) => a.priceSteps > 0).length;
  const movedCount = arrows.filter((a) => a.reinvestSteps > 0).length;
  const movedAny = arrows.some((a) => a.reinvestSteps > 0 || a.priceSteps > 0);
  const biggestArrow = [...arrows].sort((a, b) => b.reinvestSteps - a.reinvestSteps)[0] ?? null;

  // The no-movement branch's counterfactual arrows.
  const wouldShare = rule && rule.runnerUp > rule.share ? rule.runnerUp : 30;
  const wouldArrows = !movedAny && rule ? live.map((c) => arrowOf(c, hypotheticalRule(wouldShare, rule.condition))) : [];
  const wouldMovedCount = wouldArrows.filter((a) => a.reinvestSteps > 0).length;
  const wouldBiggest = [...wouldArrows].sort((a, b) => b.reinvestSteps - a.reinvestSteps)[0] ?? null;

  // The counterfactual replay, re-implemented here from the settled weeks.
  const netAt = (shareValue, condition) => {
    const nets = new Map();
    for (let w = 0; w < state.weekIndex; w += 1) {
      const paid = [];
      const ok = [];
      for (let slot = 0; slot < size; slot += 1) {
        const wk = state.clubs[slot].weeks[w];
        paid.push(wk ? Math.round((shareValue / 100) * wk.taxedLocal) : 0);
        ok.push(!condition || (wk ? wk.reinvest >= CONDITION_MIN_REINVEST : false));
      }
      const pot = paid.reduce((a, b) => a + b, 0);
      const even = size > 0 ? pot / size : 0;
      const okCount = ok.filter(Boolean).length;
      let forfeited = 0;
      const base = ok.map((good) => {
        if (good || okCount === 0) return even;
        forfeited += even * 0.5;
        return even * 0.5;
      });
      const bonus = okCount > 0 ? forfeited / okCount : 0;
      for (let slot = 0; slot < size; slot += 1) {
        const took = Math.round(base[slot] + (ok[slot] ? bonus : 0));
        nets.set(slot, (nets.get(slot) ?? 0) + took - paid[slot]);
      }
    }
    return nets;
  };
  const cfShare = rule ? rule.runnerUp : 30;
  const nowNets = netAt(rule ? rule.share : 0, rule ? rule.condition : false);
  const cfNets = netAt(cfShare, rule ? rule.condition : false);
  let cfBetter = 0;
  let cfWorse = 0;
  for (const c of live) {
    const d = (cfNets.get(c.slot) ?? 0) - (nowNets.get(c.slot) ?? 0);
    if (d > 0) cfBetter += 1;
    if (d < 0) cfWorse += 1;
  }

  const gateTotal = live.reduce((a, c) => a + c.weeks.reduce((b, w) => b + w.home.gate, 0), 0);
  const nationalTotal = live.reduce((a, c) => a + c.weeks.length * NATIONAL, 0);
  const roadGiven = live.length > 0 ? Math.max(0, ...live.map((c) => c.weeks.reduce((a, w) => a + w.roadDollarsGiven, 0))) : 0;

  // The adoption arithmetic, re-run here from the recorded round.
  const sealed = state.closedRounds.length > 0 ? state.closedRounds[state.closedRounds.length - 1] : null;
  const votedShares = sealed ? sealed.shares.filter((s) => s !== null) : [];
  const rawMedian = votedShares.length > 0 ? [...votedShares].sort((a, b) => a - b)[Math.floor(votedShares.length / 2)] : STATUS_QUO_SHARE;
  const evenMedian =
    votedShares.length > 0 && votedShares.length % 2 === 0
      ? ([...votedShares].sort((a, b) => a - b)[votedShares.length / 2 - 1] + [...votedShares].sort((a, b) => a - b)[votedShares.length / 2]) / 2
      : rawMedian;
  const supporting = votedShares.filter((s) => Math.abs(s - evenMedian) <= ADOPT_BAND + 1e-9).length;
  const liveDesks = sealed ? sealed.shares.length : live.length;
  const abstained = sealed ? sealed.shares.filter((s) => s === null).length : 0;

  const droppedDesks = live.filter((c) => c.l2ReinvestDollars !== null && meanOf(c.weeks.map((w) => w.reinvestSpend)) < c.l2ReinvestDollars - 1).length;
  const roseDesks = live.filter((c) => c.l2ReinvestDollars !== null && meanOf(c.weeks.map((w) => w.reinvestSpend)) > c.l2ReinvestDollars + 1).length;
  const deltaDollars = l2MeanDollars === null ? 0 : l3MeanDollars - l2MeanDollars;

  const predicates = new Map([
    ["adopted-passed", state.adopted ? state.adopted.how === "voted" : false],
    ["adopted-condition", state.adopted ? state.adopted.condition : false],
    ["adopted-league-office", state.adopted ? state.adopted.how === "leagueOffice" : false],
    ["script-arm", state.adopted ? state.adopted.how === "voted" : false],
    ["pot-two-sided", payers > 0],
    ["arrow-any-flat-price", flatCount > 0],
    ["arrow-nothing-moved", !movedAny],
    ["era-direction", l2MeanDollars !== null ? deltaDollars < -1 : false],
    ["era-no-l2", l2MeanDollars === null],
    ["cf-not-behaviour", true],
    ["hook-no-score", true],
    ["kings-no-score", true],
    ["synth-seeded", state.seeded],
    ["synth-road-someone-else", live.some((c) => c.weeks.length > 0)],
    // econ F2: the live falsehood the old audit could not see.
    ["synth-national-bigger", nationalTotal > gateTotal],
    ["consequence-nobody-decided", true],
    ["consequence-no-l2-instrument", l2MeanDollars === null],
    ["consequence-ask-direction", l2MeanDollars !== null && deltaDollars < -1],
    ["transfer-direction-N", null], // per-desk; resolved below
    ["reveal-holding", state.revealStage < 5],
  ]);
  predicates.delete("transfer-direction-N");
  for (const f of flows) predicates.set(`transfer-direction-${f.deskNumber}`, f.net >= 0);

  const values = new Map([
    ["pot-total", potTotal],
    ["pot-payers", payers],
    ["pot-receivers", receivers],
    ["pot-biggest-net", biggestSwing],
    ["adopted-share", state.adopted ? state.adopted.share : STATUS_QUO_SHARE],
    ["adopted-supporting", state.adopted ? (state.adopted.how === "leagueOffice" ? state.adopted.supporting : supporting) : 0],
    ["adopted-live-desks", state.adopted ? state.adopted.liveDesks : liveDesks],
    ["adopted-abstained", abstained],
    ["script-share", state.adopted ? state.adopted.share : STATUS_QUO_SHARE],
    ["era-l3-mean", l3Mean],
    ["era-l3-dollars", l3MeanDollars],
    ["era-l2-dollars", l2MeanDollars ?? 0],
    ["era-delta-dollars", Math.abs(deltaDollars)],
    ["arrow-flat-price-count", flatCount],
    ["arrow-moved-price-count", movedPriceCount],
    ["arrow-moved-count", movedCount],
    ["arrow-biggest-steps", biggestArrow ? biggestArrow.reinvestSteps : 0],
    ["arrow-biggest-from", biggestArrow ? biggestArrow.r0 : 0],
    ["arrow-biggest-to", biggestArrow ? biggestArrow.r1 : 0],
    ["arrow-would-share", wouldShare],
    ["arrow-would-move-count", wouldMovedCount],
    ["arrow-would-biggest-steps", wouldBiggest ? wouldBiggest.reinvestSteps : 0],
    ["cf-share", cfShare],
    ["cf-better", cfBetter],
    ["cf-worse", cfWorse],
    ["hook-pay", live.filter((c) => c.hookPick === "pay").length],
    ["hook-breakup", live.filter((c) => c.hookPick === "breakup").length],
    ["kings-deny", live.filter((c) => c.kingsVote === "deny").length],
    ["kings-approve", live.filter((c) => c.kingsVote === "approve").length],
    ["synth-gate-total", gateTotal],
    ["synth-national-total", nationalTotal],
    ["synth-road-given", roadGiven],
    ["consequence-dropped-desks", droppedDesks],
    ["consequence-rose-desks", roseDesks],
    ["reveal-stage", state.revealStage],
    ["reveal-total", 5],
  ]);
  for (const f of flows) {
    values.set(`transfer-paid-${f.deskNumber}`, f.paidIn);
    values.set(`transfer-took-${f.deskNumber}`, f.tookOut);
    values.set(`transfer-net-${f.deskNumber}`, Math.abs(f.net));
  }
  // R1: the PER-WEEK pot row the student device actually renders, recomputed
  // week by week from raw state. The season row alone left every rendered week
  // line outside the audit.
  for (const c of live) {
    for (const w of c.weeks) {
      const n = w.week + 1;
      values.set(`transfer-paid-${c.deskNumber}-w${n}`, w.pot.paidIn);
      values.set(`transfer-took-${c.deskNumber}-w${n}`, w.pot.tookOut);
      values.set(`transfer-net-${c.deskNumber}-w${n}`, Math.abs(w.pot.net));
      predicates.set(`transfer-direction-${c.deskNumber}-w${n}`, w.pot.net >= 0);
    }
  }
  predicates.set("era-arm", state.adopted ? state.adopted.how === "voted" : false);
  predicates.set("consequence-rule-moved", movedAny);

  return {
    potTotal,
    l3Mean,
    l2Mean,
    l2MeanDollars,
    l3MeanDollars,
    share: state.adopted ? state.adopted.share : STATUS_QUO_SHARE,
    flatCount,
    leagueSize: size,
    predicates,
    values,
  };
}

{
  // `reinvestPaid` is L2's own spend in DOLLARS. It is what the before/after bar
  // is drawn on now, because the two lessons' dial percentages are shares of
  // different money (econ B3) — a seed carrying only `share` leaves L3 with no
  // comparable left-hand bar, and the module says so rather than inventing one.
  const L2_SEED = {
    lessonModuleId: "m2l2-host-league",
    state: {
      clubs: Array.from({ length: 12 }, (_, slot) => ({
        slot,
        draw: 30 + ((slot * 7) % 55),
        cash: 900_000 + slot * 130_000,
        weeks: [
          { share: 20 + (slot % 3) * 5, reinvestPaid: 300_000 + slot * 11_000 },
          { share: 25 + (slot % 2) * 5, reinvestPaid: 320_000 + slot * 9_000 },
          { share: 30, reinvestPaid: 340_000 + slot * 8_000 },
        ],
      })),
    },
  };
  // A room whose LAST lesson barely reinvested, so this lesson's effort went UP.
  // The frozen-quantifier mutant needs a room where "went down" is false.
  const L2_SEED_LOW = {
    lessonModuleId: "m2l2-host-league",
    state: {
      clubs: Array.from({ length: 12 }, (_, slot) => ({
        slot,
        draw: 30 + ((slot * 7) % 55),
        cash: 900_000 + slot * 130_000,
        weeks: [
          { share: 0, reinvestPaid: 1_000 },
          { share: 0, reinvestPaid: 1_000 },
          { share: 0, reinvestPaid: 1_000 },
        ],
      })),
    },
  };
  // A room that walked out of L2 with full buildings — which is what makes the
  // gate large enough to beat the national check at six desks (econ F2).
  const L2_SEED_HIGH_DRAW = {
    lessonModuleId: "m2l2-host-league",
    state: {
      clubs: Array.from({ length: 12 }, (_, slot) => ({
        slot,
        draw: 95,
        cash: 2_000_000,
        weeks: [{ share: 20, reinvestPaid: 300_000 }],
      })),
    },
  };
  const BIG_PROFILE = new Set(MARKET_PROFILES.filter((p) => p.sizeLabel === "BIG MARKET").map((p) => p.id));
  const rooms = [
    { label: "voted 40% condition ON, seeded from L2", state: playSession(12, () => ({ share: 40, condition: true }), (slot, w) => ({ price: 44 + (slot % 6) * 2, reinvest: REINVEST_GRID[(slot + w) % REINVEST_GRID.length] }), { seed: L2_SEED }) },
    { label: "voted 10% condition OFF, unseeded", state: playSession(12, () => ({ share: 10, condition: false }), (slot, w) => ({ price: 50, reinvest: 20 })) },
    {
      label: "status-quo room (0/30/60, nobody moves), seeded",
      state: playSession(9, (slot) => ({ share: [0, 30, 60][slot % 3], condition: false }), (slot, w) => ({ price: 46, reinvest: 0 }), { seed: L2_SEED }),
    },
    {
      label: "effort went UP (seeded from a near-zero L2)",
      state: playSession(12, () => ({ share: 40, condition: true }), (slot) => ({ price: 46 + (slot % 5) * 2, reinvest: 25 }), { seed: L2_SEED_LOW }),
    },
    {
      // econ F2's live falsehood, exercised: six desks — the minimum league and
      // a completely ordinary classroom — where the room's own GATE exceeds the
      // national check. The composition card used to assert the opposite here in
      // words while the audit could not see the comparison at all.
      label: "six desks, gate BEATS the national check (econ F2's branch)",
      state: playSession(
        6,
        () => ({ share: 0, condition: false }),
        (slot) => ({ price: BIG_PROFILE.has(CLUBS[slot].profileId) ? 70 : 52, reinvest: 40 }),
        { seed: L2_SEED_HIGH_DRAW },
      ),
    },
    { label: "league office's rule, never voted", state: (() => {
        let s = seated(12, L2_SEED);
        s = apply(s, { type: "teacher:realRule" }, "PLAY", "teacher");
        s = apply(s, { type: "teacher:ruleStep" }, "PLAY", "teacher");
        for (let w = 0; w < WEEK_COUNT; w += 1) s = apply(s, { type: "teacher:closeWeek" }, "PLAY", "teacher");
        return s;
      })() },
  ];

  const fail = [];
  const rows = [];
  let surfacesSwept = 0;
  let atomsSwept = 0;
  let cleanRoom = null;
  let effortUpRoom = null;
  let gateBeatsNationalRoom = null;
  for (const room of rooms) {
    // Every reveal stage is played, so the staged surfaces are all reachable.
    const state = { ...room.state, revealStage: 5, counterfactualRun: true, hookRevealed: true, kingsRevealed: true };
    const surfaces = moduleClaims(state);
    const truth = truthFor(state);
    const blobs = renderedBlobs(state);
    surfacesSwept += surfaces.length;
    atomsSwept += surfaces.reduce((a, s) => a + s.claims.length, 0);
    const problems = [...auditClaims(surfaces, truth), ...auditRendered(surfaces, blobs)];
    if (problems.length === 0 && cleanRoom === null) cleanRoom = { state, surfaces, truth, blobs };
    if (problems.length === 0 && effortUpRoom === null && truth.l2MeanDollars !== null && truth.l3MeanDollars > truth.l2MeanDollars + 1) {
      effortUpRoom = { state, surfaces, truth, label: room.label };
    }
    if (problems.length === 0 && gateBeatsNationalRoom === null && truth.values.get("synth-gate-total") > truth.values.get("synth-national-total")) {
      gateBeatsNationalRoom = { state, surfaces, truth, label: room.label };
    }
    for (const p of problems) fail.push(`${room.label}: ${p}`);
    rows.push(`${room.label.padEnd(46)} ${surfaces.length} surfaces · ${surfaces.reduce((a, s) => a + s.claims.length, 0)} atoms · ${problems.length} problems`);
  }
  // A surface that ships zero atoms is allowed only where nothing on it is
  // computed from state; the sweep still registers it so a future computed line
  // added there without an atom is a detectable hole.
  const zeroAtom = new Set();
  for (const room of rooms) for (const s of moduleClaims({ ...room.state, revealStage: 5 })) if (s.claims.length === 0) zeroAtom.add(s.surface);

  // ---- NON-VACUITY BY MUTATION, one per limb --------------------------------
  const mutants = [];
  if (cleanRoom) {
    const clone = () => JSON.parse(JSON.stringify(cleanRoom.surfaces));
    const run = (id, what, poison) => {
      const poisoned = clone();
      const applied = poison(poisoned);
      const caught = applied ? auditClaims(poisoned, cleanRoom.truth).length > 0 : false;
      mutants.push({ id, what, caught: applied ? caught : null });
      if (applied && !caught) fail.push(`MUTATION ${id} NOT CAUGHT: ${what}`);
    };

    run("SIGN", "flip a non-negative atom's value negative", (s) => {
      for (const surface of s) for (const a of surface.claims) if (a.assertsSign === "nonNegative") { a.value = -Math.abs(a.value) - 1; return true; }
      return false;
    });
    run("QUANTIFIER", "flip a quantifier's predicate against the reducer", (s) => {
      for (const surface of s) {
        for (const a of surface.claims) {
          if (a.quantifier && cleanRoom.truth.predicates.has(a.id)) {
            a.quantifier.claims = !a.quantifier.claims;
            return true;
          }
        }
      }
      return false;
    });
    run("BOUND", "push a bounded atom past its own printed ceiling", (s) => {
      for (const surface of s) for (const a of surface.claims) if (a.bounds?.max !== undefined) { a.value = a.bounds.max + 1; return true; }
      return false;
    });
    run("NOUN", "rename the thing a claim is about, so the rendered substring no longer appears in its sentence", (s) => {
      for (const surface of s) for (const a of surface.claims) if (!a.quantifier) { a.rendered = `${a.rendered} of gate money`; return true; }
      return false;
    });
    run("LEVEL", "print the wrong direction for the room's own effort", (s) => {
      for (const surface of s) {
        if (surface.surface === "board:consequence:era" && cleanRoom.truth.l2MeanDollars !== null) {
          surface.text = surface.text.replace("went down", "went up").replace("did not move", "went up");
          if (!surface.text.includes("went up")) surface.text += " Effort went up.";
          return true;
        }
      }
      return false;
    });

    // ---- THE THREE MUTANTS THE DISSENT WAS RECORDED ON ---------------------
    // `econ-l3-claim-audit-vacuous`: doubling `pot-total` made the projector
    // print a 2x falsehood and the whole suite passed 41/41; an inverted
    // quantifier and a frozen quantifier word likewise survived. Each is now a
    // named limb of this harness, and each must FAIL.

    run("VALUE-DRIFT", "double the pot total, exactly as the econ gate's surviving mutant did", (s) => {
      for (const surface of s) {
        for (const a of surface.claims) {
          if (a.id === "pot-total") {
            const doubled = a.value * 2;
            const rendered = fmt(doubled, a.format);
            surface.text = surface.text.split(a.rendered).join(rendered);
            a.value = doubled;
            a.rendered = rendered;
            return true;
          }
        }
      }
      return false;
    });

    // ---- THE RENDER MUTANT. econ re-check R1's own injection A9, in this
    // harness's own hands: drift the number the STUDENT DEVICE prints on a week's
    // pot row, leaving the registry untouched. Before the repair the registry did
    // not contain the rendered sentence at all and nothing could see this. Now the
    // audited sentence is missing from what /play emits, and the limb fails.
    {
      const registered = cleanRoom.surfaces.filter((s) => /^play:desk-\d+:week-\d+:transferLine$/.test(s.surface));
      const target = registered[0] ?? null;
      let caught = null;
      let what = "no per-week /play transfer line is registered — the render limb has nothing to prove";
      if (target) {
        const paid = target.claims.find((a) => a.id.startsWith("transfer-paid-"));
        const drifted = target.text.split(paid.rendered).join(fmt(paid.value * 1.4, paid.format));
        const poisoned = { ...cleanRoom.blobs, play: cleanRoom.blobs.play.split(target.text).join(drifted) };
        caught = auditRendered(cleanRoom.surfaces, poisoned).length > 0;
        what = `A9 — the student device prints ${fmt(paid.value * 1.4, paid.format)} paid into the pot where the audited sentence says ${paid.rendered} (${target.surface})`;
        if (!caught) fail.push(`MUTATION RENDER-DRIFT NOT CAUGHT: ${what}`);
      } else {
        fail.push("MUTATION RENDER-DRIFT NOT EXERCISED: no per-week /play transfer line is registered");
      }
      mutants.push({ id: "RENDER-DRIFT", what, caught });
    }

    run("QUANTIFIER-INVERT", "invert `synth-national-bigger` — the live printed falsehood econ F2 found", (s) => {
      for (const surface of s) {
        for (const a of surface.claims) {
          if (a.id === "synth-national-bigger") {
            a.quantifier.claims = !a.quantifier.claims;
            return true;
          }
        }
      }
      return false;
    });
  }

  // The frozen-quantifier limb needs a room where the honest word is NOT
  // "went down", because that is the whole shape of the defect: a constant word
  // beside a boolean that varies. Run it against the effort-went-up room.
  if (effortUpRoom) {
    const poisoned = JSON.parse(JSON.stringify(effortUpRoom.surfaces));
    let applied = false;
    for (const surface of poisoned) {
      for (const a of surface.claims) {
        if (a.id === "era-direction" || a.id === "consequence-ask-direction") {
          // Pin the word AND the boolean, exactly as a hard-coded sentence would.
          surface.text = surface.text.split(a.quantifier.word).join("went down");
          a.rendered = "went down";
          a.quantifier = { word: "went down", claims: true };
          applied = true;
        }
      }
    }
    const caught = applied ? auditClaims(poisoned, effortUpRoom.truth).length > 0 : false;
    mutants.push({
      id: "QUANTIFIER-FROZEN",
      what: `pin the effort direction to "went down" in "${effortUpRoom.label}", whose own bar went UP (${Math.round(effortUpRoom.truth.l2MeanDollars)} -> ${Math.round(effortUpRoom.truth.l3MeanDollars)} a week)`,
      caught: applied ? caught : null,
    });
    if (applied && !caught) fail.push("MUTATION QUANTIFIER-FROZEN NOT CAUGHT: a frozen direction word survives in a room that moved the other way");
  } else {
    mutants.push({ id: "QUANTIFIER-FROZEN", what: "no clean room in the sweep had effort going UP — mutation not exercised", caught: null });
    fail.push("MUTATION QUANTIFIER-FROZEN NOT EXERCISED: the sweep has no room where the effort direction is anything but 'down', so the frozen-word limb is unproven");
  }

  // And the live instance of the open class: the composition card's comparative
  // in the branch where the room's gate BEATS the national check (econ F2).
  if (gateBeatsNationalRoom) {
    const t = gateBeatsNationalRoom.truth;
    rows.push(
      `econ F2 branch exercised in "${gateBeatsNationalRoom.label}": gate ${money(t.values.get("synth-gate-total"))} vs national ${money(t.values.get("synth-national-total"))} — the card must NOT claim the national check is the larger, and the audit recomputes that comparison`,
    );
  } else {
    fail.push("econ F2 branch NOT EXERCISED: no room in the sweep has the room's gate exceeding the national check, so the composition card's false branch is unproven");
  }

  rows.push(`claim-carrying surfaces shipping ZERO atoms (allowed only where nothing is computed from state): ${zeroAtom.size}${zeroAtom.size ? ` — ${[...zeroAtom].join(", ")}` : ""}`);
  for (const m of mutants) rows.push(`MUTATION ${m.id}: ${m.what} → ${m.caught === null ? "NOT EXERCISED (no eligible atom in the clean room)" : m.caught ? "CAUGHT" : "NOT CAUGHT — the family is vacuous on this limb"}`);
  const exercised = mutants.filter((m) => m.caught !== null).length;
  if (exercised < 9) fail.push(`only ${exercised} of 9 mutation limbs were exercised — the audit's non-vacuity is not fully proven`);

  check(
    "P9",
    `CLAIM AUDIT — ${atomsSwept} atoms across ${surfacesSwept} surfaces in ${rooms.length} rooms agree with the reducer in COVERAGE, BINDING, SIGN, QUANTIFIER, BOUND, VALUE, LEVEL and RENDER (every audited sentence is a string the shipped views really emit), proven non-vacuous by ${exercised} mutations including value drift, a drifted /play render, an inverted quantifier and a frozen quantifier word`,
    fail.length === 0,
    [...rows, ...fail.slice(0, 12)],
  );
}

/* ============================== P10 — determinism ======================== */

{
  const fail = [];
  const a = playSession(12, (slot) => ({ share: SHARE_GRID[slot % SHARE_GRID.length], condition: slot % 2 === 0 }), (slot, w) => ({ price: 44 + (slot % 8) * 2, reinvest: REINVEST_GRID[(slot + w) % REINVEST_GRID.length] }));
  const b = playSession(12, (slot) => ({ share: SHARE_GRID[slot % SHARE_GRID.length], condition: slot % 2 === 0 }), (slot, w) => ({ price: 44 + (slot % 8) * 2, reinvest: REINVEST_GRID[(slot + w) % REINVEST_GRID.length] }));
  if (JSON.stringify(a) !== JSON.stringify(b)) fail.push("the same session replayed to different numbers");
  const src = fs.readFileSync(SRC, "utf8");
  const rng = src.match(/Math\.random|crypto\.getRandomValues|randomUUID/g);
  if (rng) fail.push(`the module source contains a random source: ${rng.join(", ")}`);
  check("P10", "DETERMINISM — the same session replays to the same numbers and the module source contains no random source (R7)", fail.length === 0, [
    `adopted rule on both runs: ${a.adopted.share}% · condition ${a.adopted.condition ? "ON" : "OFF"} · rookie at ${CLUBS[a.rookieSlot].short}`,
    ...fail,
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
