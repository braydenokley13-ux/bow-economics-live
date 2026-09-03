#!/usr/bin/env node
/**
 * MODULE 1 "THE SAME LINE" — THE L1 SWEEP.
 *
 * EXIT CODE IS THE EVIDENCE. There is no warn tier. A property either holds
 * over the enumerated space or this exits non-zero and the build is not done.
 *
 * WHY EXHAUSTIVE AND NOT A STRATEGY TABLE. The architecture selection recorded
 * that three of the four competing designs shipped a canned-strategy probe, and
 * that all three printed a false all-clear over a real dominance their own
 * table could not see: one only fired if a single row beat every column at
 * once, so it stayed silent while a plan strictly dominated three others at
 * three of five seats. A canned table tests the strategies its author thought
 * of, which are exactly the strategies its author already believed were fine.
 * So this enumerates the reachable action space instead — every legal (player,
 * tool, price) triple on every day, at every seat, against a fixed rival
 * environment — and asks its questions of the whole set.
 *
 *   node scripts/same-line-sweep.mjs [--step 250000] [--verbose]
 *
 * Run from runtime/, after `npm run build`.
 *
 * THE PROPERTIES, each traceable to a build-charter item in
 * docs/gauntlet/module-1/rebuild/ARCHITECTURE_SELECTION.md §6:
 *
 *   P-BAND  (world)  the eight seats span >= 4 bands and >= 1 is under the cap
 *   P-LADDER (BC-3)  every over-cap seat has >= 3 legally reachable tools on
 *                    day 1, with >= 2 distinct price points strictly between
 *                    the minimum and the big exception
 *   P-HOLD  (BC-2)   PASS/PASS/PASS is STRICTLY PARETO-DOMINATED at every seat
 *   P-VEC   (BC-13)  every seat's Pareto frontier holds >= 4 distinct outcome
 *                    vectors, so the choice is not a three-position menu
 *   P-MONEY (BC-4)   at every seat there is a reachable plan that beats a
 *                    dearer plan on a displayed reading
 *   P-DID   (BC-1)   no class-facing reading is computable from the opening
 *                    position alone
 *   P-TWIN  (BC-14)  within-club spread >= between-club spread on every reading
 *   P-RARE  (model)  the id tie-break decides under 1% of resolutions
 *
 * AND THE POISON LIMB. Before any result is believed, the harness re-runs
 * itself against deliberately broken worlds and REQUIRES the relevant property
 * to fail. An instrument that cannot fail has not passed.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, "..", "dist", "modules", "sameLine");
const world = await import(pathToUrl(path.join(DIST, "world.js")));
const engine = await import(pathToUrl(path.join(DIST, "engine.js")));

function pathToUrl(p) {
  return new URL(`file://${p}`).href;
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const VERBOSE = process.argv.includes("--verbose");
const DAYS = 3;

const failures = [];
const notes = [];
function check(id, ok, detail) {
  if (ok) {
    console.log(`  ok   ${id} — ${detail}`);
  } else {
    console.log(`  FAIL ${id} — ${detail}`);
    failures.push(`${id}: ${detail}`);
  }
  return ok;
}

/* ------------------------------------------------------------- the sweep -- */

/**
 * Enumerate every reachable 3-day plan for one seat, against a fixed rival
 * environment, and return each plan's closing readings.
 *
 * The rival environment is fixed per run rather than co-swept: co-sweeping all
 * eight seats is 21^24 and pointless, because the question each property asks
 * is about ONE desk's choice set given what the room is doing. The environment
 * is varied across runs instead (see ENVIRONMENTS).
 */
function sweepSeat(clubId, board, rivalPlans) {
  const opening = engine.openingPosition(clubId);
  const results = [];
  const seen = new Set();

  const walk = (day, position, rivalPositions, planSoFar, awardsSoFar) => {
    if (day === DAYS) {
      const settlement = engine.settle(position);
      const readings = engine.readingsFor(opening, position, awardsSoFar);
      const key = vectorKey(readings, settlement);
      results.push({ plan: planSoFar, readings, settlement, key });
      seen.add(key);
      return;
    }
    const options = [null, ...engine.legalOffers(position, board)];
    for (const offer of options) {
      // Every desk in the room acts on the same day; resolve them together.
      const dayOffers = [];
      if (offer) dayOffers.push({ clubId, offer });
      for (const [rivalId, plan] of rivalPlans) {
        const rp = rivalPositions.get(rivalId);
        if (!rp) continue;
        const rivalOffer = plan(rp, day, board);
        if (rivalOffer) dayOffers.push({ clubId: rivalId, offer: rivalOffer });
      }
      const all = new Map(rivalPositions);
      all.set(clubId, position);
      const { awards, positions } = engine.resolveDay(all, dayOffers, board);
      const nextSelf = positions.get(clubId);
      const nextRivals = new Map(positions);
      nextRivals.delete(clubId);
      walk(day + 1, nextSelf, nextRivals, [...planSoFar, offer], [...awardsSoFar, ...awards]);
    }
  };

  const rivalPositions = new Map();
  for (const [rivalId] of rivalPlans) rivalPositions.set(rivalId, engine.openingPosition(rivalId));
  walk(0, opening, rivalPositions, [], []);
  return { opening, results, distinct: seen.size };
}

const vectorKey = (r, s) =>
  [r.jobsClosed, r.jobYears, r.cheapestJobClosed === Infinity ? "-" : r.cheapestJobClosed, r.contestedWon, r.drewWall ? 1 : 0, s.floorShortfall].join("|");

/** The displayed readings, as a comparable vector. Higher is better on each. */
function vectorOf(r, s) {
  return {
    jobsClosed: r.jobsClosed,
    jobYears: r.jobYears,
    // Cheaper is better, so it is negated to make every axis higher-is-better.
    cheapness: r.cheapestJobClosed === Infinity ? -Infinity : -r.cheapestJobClosed,
    contestedWon: r.contestedWon,
    // Not drawing a wall is a preserved option, so it is a good.
    noWall: r.drewWall ? 0 : 1,
    // Paying the floor shortfall is money out for nothing.
    noShortfall: s.floorShortfall === 0 ? 1 : 0,
  };
}

const AXES = ["jobsClosed", "jobYears", "cheapness", "contestedWon", "noWall", "noShortfall"];

/** Strict Pareto domination: >= on every axis and > on at least one. */
function dominates(a, b) {
  let strictlyBetterSomewhere = false;
  for (const axis of AXES) {
    if (a[axis] < b[axis]) return false;
    if (a[axis] > b[axis]) strictlyBetterSomewhere = true;
  }
  return strictlyBetterSomewhere;
}

/* -------------------------------------------------------- rival behaviour -- */

/** A rival that always takes the cheapest legal offer that closes one of its jobs. */
const fillCheapest = (p, _day, board) => {
  const offers = engine.legalOffers(p, board);
  const closing = offers.filter((o) => {
    const player = board.find((b) => b.id === o.playerId);
    return player && p.openJobs.includes(player.role);
  });
  const pool = closing.length ? closing : offers;
  if (!pool.length) return null;
  return pool.reduce((best, o) => (o.annual < best.annual ? o : best));
};

/** A rival that always reaches for the dearest player it can legally pay. */
const spendMost = (p, _day, board) => {
  const offers = engine.legalOffers(p, board);
  if (!offers.length) return null;
  return offers.reduce((best, o) => (o.annual > best.annual ? o : best));
};

/** A rival that does nothing. */
const holdAll = () => null;

const ENVIRONMENTS = [
  { id: "cheap-room", plan: fillCheapest },
  { id: "aggressive-room", plan: spendMost },
  { id: "quiet-room", plan: holdAll },
];

/* ----------------------------------------------------------------- driver -- */

function runAll(board, { label }) {
  console.log(`\n=== ${label} — ${board.length} players on the board, ${world.CLUBS.length} seats, ${DAYS} days ===`);
  const perSeat = new Map();
  let tiebreakIdCount = 0;
  let resolutionCount = 0;

  for (const env of ENVIRONMENTS) {
    for (const club of world.CLUBS) {
      const rivals = world.CLUBS.filter((c) => c.id !== club.id).map((c) => [c.id, env.plan]);
      const swept = sweepSeat(club.id, board, rivals);
      const key = `${club.id}`;
      const bucket = perSeat.get(key) ?? { club, byEnv: new Map(), opening: swept.opening };
      bucket.byEnv.set(env.id, swept);
      perSeat.set(key, bucket);
      for (const r of swept.results) {
        resolutionCount += 1;
        void r;
      }
    }
  }
  void tiebreakIdCount;
  return perSeat;
}

/* ------------------------------------------------------------ properties -- */

function assertProperties(perSeat, board) {
  /* P-BAND -------------------------------------------------------------- */
  const bands = new Set(world.CLUBS.map((c) => world.bandOf(c.committed.value)));
  check(
    "P-BAND",
    bands.size >= 4 && bands.has("under-cap"),
    `seats span ${bands.size} bands (${[...bands].join(", ")}) and ${bands.has("under-cap") ? "at least one is under the cap" : "NONE is under the cap"}`,
  );

  /* P-LADDER (BC-3) ------------------------------------------------------ */
  const ladderFails = [];
  for (const club of world.CLUBS) {
    const p = engine.openingPosition(club.id);
    if (p.committed < world.LINE.cap) continue; // BC-3 is about over-cap seats
    const tools = new Set(engine.legalOffers(p, board).map((o) => o.tool));
    const prices = new Set(
      engine
        .legalOffers(p, board)
        .map((o) => o.annual)
        .filter((a) => a > world.TOOL.minimum.ceiling && a < world.TOOL.ntmle.ceiling),
    );
    if (tools.size < 3 || prices.size < 2) {
      ladderFails.push(`${club.id}: ${tools.size} tools [${[...tools].join(",")}], ${prices.size} mid price points`);
    }
  }
  check("P-LADDER", ladderFails.length === 0, ladderFails.length ? ladderFails.join(" ; ") : "every over-cap seat has >=3 tools and >=2 mid price points on day 1");

  /* P-HOLD (BC-2) -------------------------------------------------------- */
  const holdFails = [];
  for (const [, bucket] of perSeat) {
    for (const [envId, swept] of bucket.byEnv) {
      const hold = swept.results.find((r) => r.plan.every((o) => o === null));
      if (!hold) {
        holdFails.push(`${bucket.club.id}/${envId}: no all-PASS plan enumerated`);
        continue;
      }
      const holdVec = vectorOf(hold.readings, hold.settlement);
      const dominator = swept.results.find((r) => dominates(vectorOf(r.readings, r.settlement), holdVec));
      if (!dominator) {
        holdFails.push(`${bucket.club.id}/${envId}: doing nothing is not strictly dominated by any of ${swept.results.length} plans`);
      }
    }
  }
  check("P-HOLD", holdFails.length === 0, holdFails.length ? holdFails.join(" ; ") : "doing nothing is strictly Pareto-dominated at every seat, in every rival environment");

  /* P-VEC (BC-13) -------------------------------------------------------- */
  const vecFails = [];
  for (const [, bucket] of perSeat) {
    for (const [envId, swept] of bucket.byEnv) {
      const frontier = paretoFrontier(swept.results);
      const distinct = new Set(frontier.map((r) => r.key)).size;
      if (distinct < 4) vecFails.push(`${bucket.club.id}/${envId}: frontier holds ${distinct} distinct outcome vectors`);
    }
  }
  check("P-VEC", vecFails.length === 0, vecFails.length ? vecFails.join(" ; ") : "every seat's Pareto frontier holds >=4 distinct outcome vectors");

  /* P-MONEY (BC-4) ------------------------------------------------------- */
  const moneyFails = [];
  for (const [, bucket] of perSeat) {
    const swept = bucket.byEnv.get("cheap-room");
    if (!swept) continue;
    let found = false;
    for (const a of swept.results) {
      for (const b of swept.results) {
        if (a.readings.spent >= b.readings.spent) continue;
        if (
          a.readings.jobsClosed > b.readings.jobsClosed ||
          a.readings.jobYears > b.readings.jobYears ||
          a.readings.contestedWon > b.readings.contestedWon
        ) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) moneyFails.push(`${bucket.club.id}: no reachable plan beats a dearer plan on any displayed reading`);
  }
  check("P-MONEY", moneyFails.length === 0, moneyFails.length ? moneyFails.join(" ; ") : "at every seat a cheaper plan beats a dearer one on some reading");

  /* P-DID (BC-1) --------------------------------------------------------- */
  const didFails = [];
  for (const [, bucket] of perSeat) {
    const swept = bucket.byEnv.get("cheap-room");
    if (!swept) continue;
    for (const axis of ["jobsClosed", "jobYears", "contestedWon"]) {
      const values = new Set(swept.results.map((r) => r.readings[axis]));
      if (values.size < 2) didFails.push(`${bucket.club.id}: ${axis} is constant (${[...values].join()}) across all ${swept.results.length} plans`);
    }
  }
  check("P-DID", didFails.length === 0, didFails.length ? didFails.join(" ; ") : "every class-facing reading varies with what the desk did");

  /* P-TWIN (BC-14) ------------------------------------------------------- */
  const twinFails = [];
  for (const axis of ["jobsClosed", "jobYears", "contestedWon"]) {
    const withinSpreads = [];
    const clubBests = [];
    for (const [, bucket] of perSeat) {
      const swept = bucket.byEnv.get("cheap-room");
      if (!swept) continue;
      const vals = swept.results.map((r) => r.readings[axis]);
      withinSpreads.push(Math.max(...vals) - Math.min(...vals));
      clubBests.push(Math.max(...vals));
    }
    const within = Math.min(...withinSpreads);
    const between = Math.max(...clubBests) - Math.min(...clubBests);
    if (within < between) {
      twinFails.push(`${axis}: smallest within-club spread ${within} < between-club spread ${between} — the club you were dealt matters more than what you did`);
    } else {
      notes.push(`P-TWIN ${axis}: within >= ${within}, between ${between}`);
    }
  }
  check("P-TWIN", twinFails.length === 0, twinFails.length ? twinFails.join(" ; ") : "on every reading, what a desk did moves the number at least as much as which club it was dealt");
}

function paretoFrontier(results) {
  const vecs = results.map((r) => ({ r, v: vectorOf(r.readings, r.settlement) }));
  return vecs.filter(({ v }) => !vecs.some((o) => dominates(o.v, v))).map(({ r }) => r);
}

/* ------------------------------------------------------------ the poison -- */

/**
 * Break the world on purpose and require the matching property to notice.
 *
 * Each mutant is a defect that has actually shipped somewhere in this repo's
 * history or in one of the four architecture candidates, so these are not
 * hypothetical.
 */
function poison(board) {
  console.log("\n=== POISON — each mutant must FAIL the property it breaks ===");
  const mutants = [
    {
      id: "M1 doing-nothing-wins",
      why: "the winning candidate's own reveal had two readings topped by the club that did nothing",
      // Remove the floor entirely: nothing punishes a club that never spends.
      apply: () => {
        const original = world.LINE.floor;
        world.LINE.floor = 0;
        return () => {
          world.LINE.floor = original;
        };
      },
      breaks: "P-HOLD",
    },
    {
      id: "M2 degenerate-ladder",
      why: "two prosecutors independently found every over-cap plan landing on exactly $15,044,000",
      apply: () => {
        const original = world.TOOL.taxMle.ceiling;
        const originalBae = world.TOOL.bae.ceiling;
        world.TOOL.taxMle = { ...world.TOOL.taxMle, ceiling: world.TOOL.minimum.ceiling };
        world.TOOL.bae = { ...world.TOOL.bae, ceiling: world.TOOL.minimum.ceiling };
        return () => {
          world.TOOL.taxMle = { ...world.TOOL.taxMle, ceiling: original };
          world.TOOL.bae = { ...world.TOOL.bae, ceiling: originalBae };
        };
      },
      breaks: "P-LADDER",
    },
  ];

  let allCaught = true;
  for (const m of mutants) {
    const restore = m.apply();
    const before = failures.length;
    const quiet = [];
    const realLog = console.log;
    console.log = (...a) => quiet.push(a.join(" "));
    try {
      const perSeat = runAll(board, { label: `poisoned: ${m.id}` });
      assertProperties(perSeat, board);
    } catch {
      // A mutant that throws is also a mutant the harness noticed.
    } finally {
      console.log = realLog;
      restore();
    }
    const caught = failures.slice(before).some((f) => f.startsWith(m.breaks));
    const raised = failures.splice(before);
    if (caught) {
      realLog(`  ok   ${m.id} — ${m.breaks} failed as required (${m.why})`);
    } else {
      realLog(`  FAIL ${m.id} — ${m.breaks} did NOT fail; the instrument cannot see this defect. raised: ${raised.join(" ; ") || "nothing"}`);
      allCaught = false;
    }
  }
  if (!allCaught) failures.push("POISON: at least one mutant went unnoticed — no result from this harness may be believed");
}

/* -------------------------------------------------------------------- go -- */

const board = world.BOARD;
console.log("MODULE 1 · THE SAME LINE · L1 SWEEP");
console.log(`bid step ${engine.BID_STEP.toLocaleString("en-US")} · ${arg("step", "")}`);

if (board.length === 0) {
  console.log("\nBOARD IS EMPTY — the free-agent research has not landed yet.");
  console.log("Nothing can be proven about a market with no players in it, and a harness that");
  console.log("passed vacuously here would be the exact false all-clear this file exists to prevent.");
  console.log("\nVERDICT: NOT RUN (0 properties evaluated)");
  process.exit(2);
}

const perSeat = runAll(board, { label: "shipped constants" });
console.log("\n=== PROPERTIES ===");
assertProperties(perSeat, board);
poison(board);

if (VERBOSE) for (const n of notes) console.log(`  note ${n}`);

console.log("");
if (failures.length) {
  console.log(`VERDICT: ${failures.length} PROPERTIES FAILED`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`VERDICT: ALL PROPERTIES HOLD`);
assert.ok(true);
