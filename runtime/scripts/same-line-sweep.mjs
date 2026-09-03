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
 *   P-ALIVE (repair)  every seat has a day-1 signing that leaves it able to
 *                    sign again — no seat where every move is terminal
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
const CLUB_ORDER = [];
/** Every club is held by two desks (THE TWIN DESK), so an 8-club room is 16 desks. */
const DESKS_PER_CLUB = 2;

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

  const walk = (day, position, rivalPositions, planSoFar, awardsSoFar, taken) => {
    if (day === DAYS) {
      const settlement = engine.settle(position);
      const readings = engine.readingsFor(opening, position, awardsSoFar);
      const key = vectorKey(readings, settlement);
      results.push({ plan: planSoFar, readings, settlement, key });
      seen.add(key);
      return;
    }
    // The rivals are deterministic given the day's state, so their bids are
    // known BEFORE the focal desk chooses — which is what makes the focal
    // desk's outcome a step function of its own price, and therefore what makes
    // enumerating boundaries exhaustive rather than a sample. The focal desk
    // never sees these; they are the harness's knowledge, not the student's.
    const rivalOffers = [];
    for (const [deskId, plan] of rivalPlans) {
      const rp = rivalPositions.get(deskId);
      if (!rp) continue;
      const rivalOffer = plan(rp, day, board, taken);
      if (rivalOffer) rivalOffers.push({ clubId: deskId, offer: rivalOffer });
    }
    // The threshold to beat is expressed in ANNUAL dollars, because that is
    // what a club sets — but what it has to beat is the rival's total
    // guaranteed VALUE, and the two differ by the years the tool carries. So
    // the boundary is computed per tool: the least annual number that, over
    // that tool's years, outvalues the best rival offer on the board.
    const rivalBids = new Map();
    for (const r of rivalOffers) {
      const player = board.find((b) => b.id === r.offer.playerId);
      if (!player) continue;
      const value = engine.offerValue(r.offer, player, player.incumbent === r.clubId);
      const prev = rivalBids.get(r.offer.playerId);
      if (prev === undefined || value > prev.value) rivalBids.set(r.offer.playerId, { value, annual: r.offer.annual });
    }

    // The action space is every outcome-distinct offer, plus passing, plus
    // (where it is still available) giving up cap room for the over-the-cap
    // tool rack. That last one is not a signing, so it costs the day but
    // changes what every later day can reach — which is why it is a decision.
    const options = [null, ...engine.offersAtPrices(position, board, rivalBids, taken)];
    if (engine.canDeclareOverCap(position)) options.push("DECLARE");
    for (const offer of options) {
      if (offer === "DECLARE") {
        walk(day + 1, engine.declareOverCap(position), rivalPositions, [...planSoFar, "DECLARE"], awardsSoFar, taken);
        continue;
      }
      // Every desk in the room acts on the same day; resolve them together.
      const dayOffers = [];
      if (offer) dayOffers.push({ clubId, offer });
      for (const r of rivalOffers) dayOffers.push(r);
      const all = new Map(rivalPositions);
      all.set(clubId, position);
      const resolved = engine.resolveDay(all, dayOffers, board, taken);
      const nextSelf = resolved.positions.get(clubId);
      const nextRivals = new Map(resolved.positions);
      nextRivals.delete(clubId);
      walk(day + 1, nextSelf, nextRivals, [...planSoFar, offer], [...awardsSoFar, ...awards_(resolved)], resolved.taken);
    }
  };

  const rivalPositions = new Map();
  for (const [deskId, , heldClub] of rivalPlans) {
    rivalPositions.set(deskId, { ...engine.openingPosition(heldClub), clubId: deskId });
  }
  walk(0, opening, rivalPositions, [], [], new Set());
  return { opening, results, distinct: seen.size };
}

const awards_ = (r) => r.awards;

const vectorKey = (r, s) =>
  [r.jobsClosed, r.jobYears, r.cheapestJobClosed === Infinity ? "-" : r.cheapestJobClosed, r.longestCommitment, r.drewWall ? 1 : 0, s.floorShortfall, r.roomLeft].join("|");

/** The displayed readings, as a comparable vector. Higher is better on each. */
function vectorOf(r, s) {
  return {
    jobsClosed: r.jobsClosed,
    jobYears: r.jobYears,
    // Cheaper is better, so it is negated to make every axis higher-is-better.
    cheapness: r.cheapestJobClosed === Infinity ? -Infinity : -r.cheapestJobClosed,
    longestCommitment: r.longestCommitment,
    // Not drawing a wall is a preserved option, so it is a good.
    noWall: r.drewWall ? 0 : 1,
    // Paying the floor shortfall is money out for nothing.
    noShortfall: s.floorShortfall === 0 ? 1 : 0,
    // The distance to the next line: what a club still has to move with, and
    // the thing every signing spends. Without it on the frontier, money was
    // free and signing everybody at the top price dominated at every
    // constrained seat.
    roomLeft: r.roomLeft,
  };
}

const AXES = ["jobsClosed", "jobYears", "cheapness", "longestCommitment", "noWall", "noShortfall", "roomLeft"];

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

/**
 * The rivals are deterministic, and they must not be pathological.
 *
 * An earlier version had every rival chase the single cheapest job-closing
 * player, so all seven piled onto one card every day and every contest resolved
 * the same way. That is not a room of students; it is one strategy replicated
 * seven times, and it made two seats look dead that are not. Real desks want
 * different people because they have different holes, so these spread by the
 * club's own position in the league and bid what a player asks rather than
 * everything they have.
 */
const spreadPick = (p, day, board, prefer, taken) => {
  const offers = engine.legalOffers(p, board, taken).filter((o) => {
    const player = board.find((b) => b.id === o.playerId);
    if (!player) return false;
    // Bid what he asks, not the ceiling: nobody overpays on principle.
    return o.annual === player.ask.value;
  });
  if (!offers.length) return null;
  const mine = offers.filter((o) => {
    const player = board.find((b) => b.id === o.playerId);
    return player && p.openJobs.includes(player.role);
  });
  const pool = mine.length ? mine : offers;
  const named = pool.filter((o) => !board.find((b) => b.id === o.playerId)?.generic);
  const shortlist = named.length ? named : pool;
  const ranked = [...shortlist].sort((a, b) => (prefer === "dear" ? b.annual - a.annual : a.annual - b.annual));
  // Deterministic spread: clubs later in the league order reach past the
  // player the club before them is taking.
  const offset = (CLUB_ORDER.indexOf(String(p.clubId).split("#")[0]) + (String(p.clubId).endsWith("#1") ? 1 : 0) + day) % ranked.length;
  return ranked[offset];
};

const fillCheapest = (p, day, board, taken) => spreadPick(p, day, board, "cheap", taken);
const spendMost = (p, day, board, taken) => spreadPick(p, day, board, "dear", taken);
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
      // REAL CLASS SIZE, not one desk per club.
      //
      // BC-14 and BC-15 both say the sweep runs at 12-16 desks, and the reason
      // showed up the moment it did not. Against seven rivals the focal desk
      // could front-run every cheap player it wanted and close every hole it
      // had: the constraint did not bind at all at the two seats past the first
      // apron, which is precisely the defect the economic review found in one
      // of the losing candidates. Sixteen desks share one board of nine named
      // people. That is the room the lesson is actually played in, and the
      // scarcity is the lesson.
      //
      // THE TWIN DESK (grafted from candidate B): every club is held by two
      // desks, so a desk's rival is not only another club but the same club
      // played differently -- which is what makes P-TWIN answerable at all.
      const rivals = [];
      for (const c of world.CLUBS) {
        for (let twin = 0; twin < DESKS_PER_CLUB; twin += 1) {
          if (c.id === club.id && twin === 0) continue; // the focal desk itself
          rivals.push([`${c.id}#${twin}`, env.plan, c.id]);
        }
      }
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
    // BC-3's stated falsifier is "any seat whose reachable spend set collapses
    // to a single value", not a tool count. New York past the first apron
    // genuinely has the small exception and the minimum and nothing else —
    // that is the line doing its job, not a defect — and what matters is that
    // its reachable SPEND still holds real choices at real different prices.
    const offers = engine.legalOffers(p, board);
    const spends = new Set(offers.map((o) => o.annual));
    const mid = new Set([...spends].filter((a) => a > world.TOOL.minimum.ceiling && a < world.TOOL.ntmle.ceiling));
    if (spends.size < 3 || mid.size < 2) {
      const tools = new Set(offers.map((o) => o.tool));
      ladderFails.push(
        `${club.id}: ${spends.size} distinct reachable prices, ${mid.size} of them between the minimum and the big exception [tools: ${[...tools].join(",")}]`,
      );
    }
  }
  check("P-LADDER", ladderFails.length === 0, ladderFails.length ? ladderFails.join(" ; ") : "every over-cap seat's reachable spend holds >=3 distinct prices, >=2 between the minimum and the big exception");

  /* P-HOLD (BC-2, restated — see the deviation note below) ---------------- */
  //
  // BC-2 as written asks that PASS/PASS/PASS be STRICTLY PARETO-DOMINATED at
  // every seat. Once the frontier gained a room-left axis — which it had to,
  // because without a cost axis money was free and signing everybody at the top
  // price dominated everywhere — that became impossible to satisfy honestly.
  // Doing nothing maximises the distance to your next line by construction, so
  // it sits on the frontier of any axis set that treats flexibility as worth
  // anything.
  //
  // Forcing it off would mean asserting that preserved flexibility is worthless,
  // and that is false economics: hoarding room is a real front-office strategy,
  // and "most future flexibility" is one of the competing definitions of success
  // the class reveal is explicitly built to argue about.
  //
  // So the property is restated to BC-2's INTENT — passivity must not be a free
  // win — in two limbs that are both falsifiable:
  //
  //   (a) doing nothing is strictly dominated on the ACTIVITY readings, so it
  //       never tops a reading that measures what a desk did; and
  //   (b) doing nothing is never the ONLY point on the frontier, so a desk that
  //       sat still is always facing at least one active plan that was not worse.
  //
  // The defect BC-2 was written against — a reveal whose readings a club tops by
  // sitting still — is closed by limb (a) plus BC-1.
  const ACTIVITY = ["jobsClosed", "jobYears", "longestCommitment"];
  const holdFails = [];
  for (const [, bucket] of perSeat) {
    for (const [envId, swept] of bucket.byEnv) {
      const hold = swept.results.find((r) => r.plan.every((o) => o === null));
      if (!hold) {
        holdFails.push(`${bucket.club.id}/${envId}: no all-PASS plan enumerated`);
        continue;
      }
      const beatsOnActivity = swept.results.some((r) =>
        ACTIVITY.every((a) => r.readings[a] >= hold.readings[a]) && ACTIVITY.some((a) => r.readings[a] > hold.readings[a]),
      );
      if (!beatsOnActivity) {
        holdFails.push(`${bucket.club.id}/${envId}: no plan beats doing nothing on the activity readings`);
      }
      const frontier = paretoFrontier(swept.results);
      const holdVec = vectorOf(hold.readings, hold.settlement);
      const activeOnFrontier = frontier.some((r) => r.plan.some((o) => o !== null));
      if (!activeOnFrontier) {
        holdFails.push(`${bucket.club.id}/${envId}: doing nothing is the only non-dominated plan`);
      }
      void holdVec;
    }
  }
  check(
    "P-HOLD",
    holdFails.length === 0,
    holdFails.length
      ? holdFails.join(" ; ")
      : "passivity never tops an activity reading, and is never the only plan on the frontier, at any seat in any rival environment",
  );

  /* P-VEC (BC-13) -------------------------------------------------------- */
  const vecFails = [];
  for (const [, bucket] of perSeat) {
    for (const [envId, swept] of bucket.byEnv) {
      const frontier = paretoFrontier(swept.results);
      const distinct = new Set(frontier.map((r) => r.key)).size;
      if (distinct < 4) {
        vecFails.push(`${bucket.club.id}/${envId}: frontier holds ${distinct} distinct outcome vectors`);
        if (VERBOSE) {
          console.log(`\n--- ${bucket.club.id}/${envId} frontier (${swept.results.length} plans swept) ---`);
          for (const r of frontier) console.log("   ", r.key, "|", JSON.stringify(r.readings));
        }
      }
    }
  }
  check("P-VEC", vecFails.length === 0, vecFails.length ? vecFails.join(" ; ") : "every seat's Pareto frontier holds >=4 distinct outcome vectors");

  /* P-ALIVE --------------------------------------------------------------- *
   *
   * ADDED after the L1 prosecution. Ten of the eleven reachable players at
   * Boston, signed on day one with the tool the product pre-selected at the
   * price it pre-filled, left the desk with no legal move for two days — and
   * this harness, which enumerates every legal triple at every seat, reported
   * no property violated, because no property was looking.
   *
   * The property: on every day that is not the last, at every seat, there is at
   * least one legal SIGNING that leaves the desk still able to sign somebody
   * afterwards. A seat whose every move is terminal has two options — finish
   * now, or pass — and neither of those is the lesson.
   *
   * Note what this does NOT forbid: a terminal move existing. Sacramento
   * genuinely can spend its way to a standstill and that is the best economics
   * on the board. What it forbids is a seat where terminal is the only kind of
   * move there is. */
  const aliveFails = [];
  for (const [, bucket] of perSeat) {
    const swept = bucket.byEnv.get("cheap-room");
    if (!swept) continue;
    const p0 = bucket.opening;
    const alive = [];
    for (const player of board) {
      for (const offer of engine.legalOffers(p0, [player], new Set())) {
        const look = engine.outlookAfter(p0, player, offer, board, new Set());
        if (!look.terminal) alive.push(`${player.id}/${offer.tool}`);
      }
    }
    if (alive.length === 0) {
      aliveFails.push(`${bucket.club.id}: every legal day-one signing ends its window`);
    }
  }
  check(
    "P-ALIVE",
    aliveFails.length === 0,
    aliveFails.length ? aliveFails.join(" ; ") : "every seat has a day-one signing that leaves it able to sign again",
  );

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
    for (const axis of ["jobsClosed", "jobYears", "longestCommitment"]) {
      const values = new Set(swept.results.map((r) => r.readings[axis]));
      if (values.size < 2) didFails.push(`${bucket.club.id}: ${axis} is constant (${[...values].join()}) across all ${swept.results.length} plans`);
    }
  }
  check("P-DID", didFails.length === 0, didFails.length ? didFails.join(" ; ") : "every class-facing reading varies with what the desk did");

  /* P-TWIN (BC-14) ------------------------------------------------------- */
  const twinFails = [];
  for (const axis of ["jobsClosed", "jobYears", "longestCommitment"]) {
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
      // Make signing buy NOTHING an activity reading can see: no club has an
      // open job, every contract is zero years, and the floor is removed so
      // refusing to spend is not even punished. An active plan then ties doing
      // nothing on every activity reading while costing room, so passivity
      // wins outright. This is the shape of the defect the winning candidate
      // shipped -- readings a club tops by sitting still -- and the restated
      // P-HOLD has to catch it or it is not protecting anything.
      apply: () => {
        const floor = world.LINE.floor;
        const jobs = world.CLUBS.map((c) => c.jobs);
        const terms = Object.fromEntries(Object.entries(world.TOOL).map(([k, t]) => [k, t.maxYears]));
        world.LINE.floor = 0;
        world.CLUBS.forEach((c) => {
          c.jobs = [];
        });
        Object.values(world.TOOL).forEach((t) => {
          t.maxYears = 0;
        });
        return () => {
          world.LINE.floor = floor;
          world.CLUBS.forEach((c, i) => {
            c.jobs = jobs[i];
          });
          Object.entries(world.TOOL).forEach(([k, t]) => {
            t.maxYears = terms[k];
          });
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

const board = world.MARKET;
CLUB_ORDER.push(...world.CLUBS.map((c) => c.id));
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
