#!/usr/bin/env node
/**
 * THE FLOOR — feasibility sweep (D62).
 *
 * D62: a collective rule must be obeyable — no adopted institution may impose
 * an obligation a franchise cannot discharge at any legal setting from any
 * reachable state. This script is the printed feasibility sweep THE FLOOR
 * ships with: for each candidate flat-dollar line and each adopted share on
 * the shipped grid, it prints, per real NBA-market club:
 *
 *   BOUND        — the club's own UNCONSTRAINED cash-best reinvest (no floor
 *                   in force) puts fewer dollars back than the line, i.e. the
 *                   line would actually change this club's own choice. This is
 *                   the design's whole point: several small/mid markets must
 *                   be BOUND, or the second institution is cosmetic (spec
 *                   experience-risk 3).
 *   cost          — brute-forced cash given up by moving from that free choice
 *                   to the best (price, reinvest) pair that still clears the
 *                   line — never algebra, the same (price, reinvest) grid the
 *                   lesson itself plays.
 *   UNREACHABLE   — even at the max reinvest dial (REINVEST_MAX) and this
 *                   club's own revenue-MAXIMISING price (not its cash-best
 *                   price — a club that could clear the line by moving price
 *                   in a way that costs it net cash is still OBEYING, just at
 *                   a cost; a club that cannot clear it at ANY price is what
 *                   D62 forbids), the club cannot put back the line's dollars
 *                   from its week-1 Draw. UNREACHABLE is share-independent:
 *                   local revenue and the reinvest dial never read the share.
 *
 * Never re-implements a formula: every dollar comes from the shipped
 * `weekTakeFor`/`bestReinvestUnder`/`bestPriceUnder`, brute-forced over the
 * shipped `PRICE_GRID`/`REINVEST_GRID`, on the shipped `CLUBS`/`MARKET_PROFILES`.
 *
 * Run from the repo root, after `npm run build --prefix runtime`:
 *     node runtime/scripts/write-the-rule-floor-sweep.mjs
 *
 * EXIT CODE IS THE EVIDENCE, same discipline as the stage-0 harnesses: exit 0
 * only if neither the chosen 5-6 working value nor any 7-8 line leaves a club
 * UNREACHABLE; exit 1 otherwise; exit 2 if the build is missing.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..");
const DIST = path.join(REPO, "runtime", "dist", "modules", "writeTheRule.js");

if (!fs.existsSync(DIST)) {
  console.error(`[floor-sweep] built module not found at ${DIST}`);
  console.error("[floor-sweep] run \`npm run build --prefix runtime\` first — this sweep never re-declares constants.");
  process.exit(2);
}

const mod = await import(DIST);
const {
  CLUBS,
  FLOOR_LINE_5_6,
  FLOOR_LINES_7_8,
  PRICE_GRID,
  REINVEST_GRID,
  REINVEST_MAX,
  SHARE_GRID,
  bestPriceUnder,
  bestReinvestUnder,
  hypotheticalRule,
  weekTakeFor,
  writeTheRuleModule,
} = mod;

const ctx = (phase, seatId) => ({ phase, seatId, seatIds: [], now: 0 });
function apply(state, action, phase, seatId) {
  const res = writeTheRuleModule.reduce(state, action, ctx(phase, seatId));
  if (!res.ok) throw new Error(`reducer rejected ${action.type}: ${res.reason}`);
  return res.state;
}
function seated(deskCount) {
  let state = writeTheRuleModule.initialState({ sessionId: "floor-sweep", seatIds: [], seed: undefined, gradeBand: "7-8" });
  for (let i = 0; i < deskCount; i += 1) state = apply(state, { type: "takeSeat" }, "LOBBY", `seat-${i}`);
  return state;
}

const money = (n) => `$${Math.round(n).toLocaleString()}`;

// Every real NBA market gets its own live club — this is a market-economics
// sweep, not a classroom-size one.
const state = seated(mod.MAX_DESKS);
const clubs = state.clubs.slice(0, state.leagueSize);

const CANDIDATE_LINES = [];
for (let l = 100_000; l <= 400_000; l += 50_000) CANDIDATE_LINES.push(l);

/**
 * The club's own cash-best (price, reinvest) with NO floor pressure at all —
 * the free choice a line would have to move it away from to bind at all.
 */
function freeChoice(club, share) {
  const rule = hypotheticalRule(share, false);
  const pct = bestReinvestUnder(state, club, rule);
  const price = bestPriceUnder(state, club, rule, club.draw, club.draw); // week 1: every visitor is also at DRAW_START
  const out = weekTakeFor(state, club, rule, price, pct, club.draw, club.draw);
  const dollars = Math.round((pct / 100) * out.localRevenue);
  return { pct, price, dollars, cash: out.cash };
}

/** The best cash this club can post while still clearing `line`, brute-forced over both dials. */
function bestCompliantCash(club, share, line) {
  const rule = hypotheticalRule(share, false);
  let best = -Infinity;
  for (const r of REINVEST_GRID) {
    for (const p of PRICE_GRID) {
      const out = weekTakeFor(state, club, rule, p, r, club.draw, club.draw);
      const spend = Math.round((r / 100) * out.localRevenue);
      if (spend >= line && out.cash > best) best = out.cash;
    }
  }
  return best;
}

/** Share-independent: local revenue and the reinvest dial never read the share. */
function unreachable(club, line) {
  let bestRevenue = -Infinity;
  for (const p of PRICE_GRID) {
    const out = weekTakeFor(state, club, null, p, REINVEST_MAX, club.draw, club.draw);
    if (out.localRevenue > bestRevenue) bestRevenue = out.localRevenue;
  }
  const maxDollars = Math.round((REINVEST_MAX / 100) * bestRevenue);
  return { maxDollars, isUnreachable: maxDollars < line };
}

function sweepLine(line, share) {
  const rows = [];
  let boundCount = 0;
  const unreachableClubs = [];
  for (const club of clubs) {
    const free = freeChoice(club, share);
    const bound = free.dollars < line;
    if (bound) boundCount += 1;
    const { maxDollars, isUnreachable } = unreachable(club, line);
    if (isUnreachable) unreachableClubs.push(club);
    const cost = bound ? Math.max(0, free.cash - bestCompliantCash(club, share, line)) : 0;
    rows.push({
      market: CLUBS[club.slot]?.name ?? club.profileId ?? `slot-${club.slot}`,
      freeDollars: free.dollars,
      bound,
      cost,
      maxDollars,
      isUnreachable,
    });
  }
  return { rows, boundCount, unreachableClubs };
}

console.log(`THE FLOOR — feasibility sweep over ${clubs.length} real markets, ${CANDIDATE_LINES.length} candidate lines × ${SHARE_GRID.length} shares.`);
console.log("");

// The full sweep, share by share, line by line — the printed evidence D62 requires.
for (const line of CANDIDATE_LINES) {
  console.log(`== LINE ${money(line)}/week ==`);
  for (const share of SHARE_GRID) {
    const { rows, boundCount, unreachableClubs } = sweepLine(line, share);
    const boundNames = rows.filter((r) => r.bound).map((r) => r.market);
    const unreachNames = unreachableClubs.map((c) => CLUBS[c.slot]?.name ?? c.profileId ?? `slot-${c.slot}`);
    console.log(
      `  share ${String(share).padStart(2)}%: BOUND ${boundCount}/${rows.length} (${boundNames.join(", ") || "none"})` +
        (unreachNames.length > 0 ? ` — UNREACHABLE: ${unreachNames.join(", ")}` : ""),
    );
  }
}

console.log("");
console.log("== per-club detail at share 30% (the median grid point) ==");
{
  const { rows } = sweepLine(FLOOR_LINE_5_6, 30);
  for (const r of rows) {
    console.log(
      `  ${r.market.padEnd(18)} free ${money(r.freeDollars)} vs 5-6 line ${money(FLOOR_LINE_5_6)}` +
        ` — ${r.bound ? `BOUND, cost ${money(r.cost)}` : "clears it unforced"}` +
        (r.isUnreachable ? " — UNREACHABLE AT MAX DIAL" : ""),
    );
  }
}

// D62's exit condition: the CHOSEN working value (5-6) and every shipped 7-8
// line must leave zero clubs UNREACHABLE at the max dial.
console.log("");
console.log("== D62 exit check: the shipped working value and the shipped 7-8 lines ==");
let ok = true;
const checkLines = [
  { label: "5-6 working value", line: FLOOR_LINE_5_6 },
  ...FLOOR_LINES_7_8.map((line, i) => ({ label: `7-8 line ${i + 1}`, line })),
];
for (const { label, line } of checkLines) {
  const unreachAtMedian = sweepLine(line, 30).unreachableClubs;
  // UNREACHABLE is share-independent, but confirm across the whole grid too —
  // the exit condition is "any 7-8 line has an UNREACHABLE club", full stop.
  const unreachAnyShare = new Set();
  for (const share of SHARE_GRID) {
    for (const c of sweepLine(line, share).unreachableClubs) unreachAnyShare.add(CLUBS[c.slot]?.name ?? c.profileId ?? `slot-${c.slot}`);
  }
  const names = [...unreachAnyShare];
  console.log(`  ${label} (${money(line)}): ${names.length === 0 ? "no club unreachable" : `UNREACHABLE: ${names.join(", ")}`}`);
  if (names.length > 0) ok = false;
}

console.log("");
console.log(ok ? "VERDICT: EVERY CANDIDATE LINE OBEYABLE (D62)" : "VERDICT: AT LEAST ONE CLUB CANNOT DISCHARGE THE CHOSEN LINE — D62 VIOLATION");
process.exit(ok ? 0 : 1);
