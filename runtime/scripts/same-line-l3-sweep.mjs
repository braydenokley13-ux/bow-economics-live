#!/usr/bin/env node
/**
 * MODULE 1 · LESSON 3 — "THE DEADLINE" — THE L3 SWEEP.
 *
 * D61 ruling 6 (binding, Economic Truth review, 2026-09-04): the sweep
 * problem for THE DEADLINE is open — a full three-hour game-tree enumeration
 * across every desk, every offer, every counter is not tractable the way L1's
 * three-day signing tree is. This ships on a DECLARED, PRINTED family of
 * modelled market environments instead of a silent claim of completeness.
 * EXIT CODE IS THE EVIDENCE: a property either holds over the declared family
 * or this exits non-zero.
 *
 * THE DECLARED FAMILY (printed at the top of every run, never only in this
 * comment):
 *   - desk count       ∈ {12, 16}   (6 or 8 real clubs, both twins seated)
 *   - surplus-role dist  each environment biases half the desks toward a
 *                        SURPLUS room (every open job already filled, nothing
 *                        it needs) and half toward a SHORTAGE room (1-2 open
 *                        jobs it cannot fill from its own bench) — the two
 *                        conditions that make a trade worth wanting at all
 *   - contract prices   every roster in every environment is built by cycling
 *                        real annuals off `world.ts`'s BOARD (Watford,
 *                        Vucevic, Kuminga, etc — the same board L1 shops),
 *                        never invented numbers
 *   - inbox concentration ∈ {spread, one-hub}: "spread" round-robins outgoing
 *                        offers across every desk in the room; "one-hub"
 *                        directs every desk's first offer at a single popular
 *                        desk, to see whether the inbox cap (3) does its job
 *                        under real pressure rather than in the easy case
 *
 * Run from runtime/, after `npm run build` (or `npx tsc -p .`):
 *   node scripts/same-line-l3-sweep.mjs [--verbose]
 *
 * NOT COVERED — four environments this family does not model, named rather
 * than hidden (D61 ruling 6):
 *   1. ONE-HUB (real/emergent) — this sweep's "one-hub" is a SCRIPTED
 *      concentration (every desk is told to target the same desk first). A
 *      real classroom's one-hub forms from social pull (the loudest kid, the
 *      best-known name), which this harness cannot simulate and does not
 *      claim to.
 *   2. NO-INVENTORY — a desk with nothing sendable at all: no moveable
 *      contract, no pick, nothing on the market it can afford to lose. This
 *      family always gives every desk two own picks at minimum; a real
 *      carried franchise that traded both away in Week 2 could arrive here
 *      with strictly less.
 *   3. PRICE-DEGENERATE — every contract on the board priced identically,
 *      which would remove the room-absorption rule's only lever (dollar
 *      difference) and could hide a class of bugs this family's real, varied
 *      BOARD prices never exercises.
 *   4. SOCIAL/FRIENDS BLOC — a subgroup of desks that only ever trade with
 *      each other regardless of economic incentive (D61 names this "live
 *      economics, contained rather than blocked" — collusion is allowed by
 *      design, but this harness does not attempt to model WHO would collude).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, "..", "dist");
const pathToUrl = (p) => new URL(`file://${p}`).href;

const world = await import(pathToUrl(path.join(DIST, "modules", "sameLine", "world.js")));
const market = await import(pathToUrl(path.join(DIST, "modules", "sameLine", "market.js")));
const l3 = await import(pathToUrl(path.join(DIST, "modules", "sameLine", "l3.js")));
const gradeBandMod = await import(pathToUrl(path.join(DIST, "shared", "gradeBand.js")));

const { CLUBS, LINE, ROSTER, BOARD } = world;
const { checkTrade, applyTrade, isContract } = market;
const { sameLineL3Module } = l3;
const { profileFor } = gradeBandMod;

const VERBOSE = process.argv.includes("--verbose");
const log = (...args) => VERBOSE && console.log(...args);

let failures = 0;
function assertTrue(cond, msg) {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${msg}`);
  }
}

/* ---------------------------------------------------------- board prices -- */

// Real annuals, cycled — never invented. `BOARD` is world.ts's real free-agent
// board (the same one L1 shops), each entry a real player's real signed deal.
const REAL_PRICES = BOARD.map((f) => ({ name: f.name, role: f.role, annual: f.ask.value }));
assertTrue(REAL_PRICES.length >= 10, "the real BOARD has at least ten priced entries to cycle from");

/* --------------------------------------------------------- desk building -- */

function ownPicksFor(clubId, twin) {
  return [1, 2].map((round) => ({
    kind: "pick",
    pickId: `${clubId}-${twin}-${round === 1 ? "first" : "second"}`,
    year: round === 1 ? 2029 : 2030,
    round,
    label: `${round === 1 ? 2029 : 2030} ${round === 1 ? "first" : "second"}`,
  }));
}

/**
 * One desk, built from real board prices, real club identity and real cap
 * figures. `surplus` desks start with every job already filled (openJobs:
 * []); `shortage` desks start with 1-2 open jobs an in-room trade could fill.
 */
function buildDesk(seatId, clubId, twin, mode) {
  const club = world.CLUB[clubId];
  const roster = Array.from({ length: 14 }, (_, i) => {
    const p = REAL_PRICES[(i + twin * 7) % REAL_PRICES.length];
    return {
      kind: "contract",
      contractId: `${seatId}-${p.name.replace(/\s+/g, "-").toLowerCase()}-${i}`,
      playerId: `${seatId}-${i}`,
      name: p.name,
      role: p.role,
      annual: p.annual,
      yearsRemaining: 1 + (i % 3),
      jobState: "DOES_JOB",
      acquiredWeek: 1,
    };
  });
  const openJobs = mode === "shortage" ? (twin === 0 ? ["BIG"] : ["GUARD", "WING"]) : [];
  return {
    seatId,
    clubId,
    twin,
    label: `${club.name} ${twin === 0 ? "A" : "B"}`,
    books: {
      committed: club.committed.value,
      taxSalary: club.taxSalary.value,
      deadMoney: club.deadMoney.value,
      holds: club.holds.value,
      wall: null,
      band: world.bandOf(club.committed.value),
    },
    roster,
    picksOwned: ownPicksFor(clubId, twin),
    ownPickIds: ownPicksFor(clubId, twin).map((p) => p.pickId),
    picksOwed: [],
    openJobs,
    bookVersion: 1,
    captures: [],
    evidence: [],
    seedWarning: null,
  };
}

function buildPool(deskCount) {
  const clubIds = CLUBS.slice(0, deskCount / 2).map((c) => c.id);
  const desks = {};
  let i = 0;
  for (const clubId of clubIds) {
    for (const twin of [0, 1]) {
      const seatId = `seat-${i}`;
      // Alternate surplus/shortage across the room so both conditions exist.
      const mode = i % 2 === 0 ? "surplus" : "shortage";
      desks[seatId] = buildDesk(seatId, clubId, twin, mode);
      i += 1;
    }
  }
  return desks;
}

function baseState(desks, gradeBand) {
  return {
    sessionId: "sweep",
    gradeBand,
    hour: 1,
    marketClosed: false,
    desks,
    listings: [],
    offers: {},
    executed: [],
    settled: null,
    beat: 0,
    warnings: [],
    observers: [],
    pool: [],
    nextPoolIndex: 0,
    nextSeq: 1,
    hotSeat: null,
    defenses: {},
  };
}

const ctx = (seatId, phase = "PLAY", seatIds = []) => ({ phase, seatId, seatIds, now: 0 });

/* -------------------------------------------------- job-fill reachability -- */

/**
 * For each desk with an open job, ask whether ANY legal 1-for-1 trade with
 * ANY other (non-twin) desk would fill it — probing with this desk's own
 * cheapest sendable object, same probe shape as `reachBlockedFor` in l3.ts,
 * so the sweep and the product ask the same question of the world.
 */
function jobFillReachability(desks, profile) {
  const all = Object.values(desks);
  let withOpenJob = 0;
  let reachable = 0;
  for (const d of all) {
    if (d.openJobs.length === 0) continue;
    withOpenJob += 1;
    const mySend = [...d.roster].sort((a, b) => a.annual - b.annual)[0]?.contractId ?? d.picksOwned[0]?.pickId ?? null;
    if (!mySend) continue;
    let found = false;
    for (const other of all) {
      if (other.seatId === d.seatId || other.clubId === d.clubId) continue;
      for (const role of d.openJobs) {
        const candidates = other.roster.filter((c) => c.role === role).map((c) => c.contractId);
        for (const want of candidates) {
          const r = checkTrade(l3.toTradeDesk(d), l3.toTradeDesk(other), [mySend], [want], profile);
          if (r.ok) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) reachable += 1;
  }
  return { withOpenJob, reachable };
}

/* ----------------------------------------------------- scripted hour play -- */

/**
 * Drive the REAL reducer through one full room: every shortage desk proposes
 * to a target (either round-robin across surplus desks — "spread" — or all
 * at the single richest surplus desk — "one-hub"), the target accepts if the
 * offer is legal and unescrowed, then both hours close through
 * `teacher:closeHour`. Returns the final state plus a log of every attempted
 * action's outcome, for the invariants below.
 */
function playRoom(desks, gradeBand, concentration) {
  const profile = profileFor(gradeBand);
  let state = baseState(desks, gradeBand);
  const shortageDesks = Object.values(state.desks).filter((d) => d.openJobs.length > 0);
  const surplusDesks = Object.values(state.desks).filter((d) => d.openJobs.length === 0);
  const chip = profile.band === "5-6" ? l3.SEND_CHIPS_56[0] : l3.SEND_CHIPS_78[0];
  const attempts = [];

  for (let idx = 0; idx < shortageDesks.length; idx += 1) {
    const from = shortageDesks[idx];
    const targetPool = surplusDesks.filter((s) => s.clubId !== from.clubId);
    if (targetPool.length === 0) continue;
    const target = concentration === "one-hub" ? targetPool[0] : targetPool[idx % targetPool.length];
    const fromDesk = state.desks[from.seatId];
    const toDesk = state.desks[target.seatId];
    const role = fromDesk.openJobs[0];
    const want = toDesk.roster.find((c) => c.role === role);
    const send = [...fromDesk.roster].sort((a, b) => a.annual - b.annual)[0];
    if (!want || !send) continue;
    const proposeResult = sameLineL3Module.reduce(state, { type: "propose", toSeat: target.seatId, send: [send.contractId], want: [want.contractId], chip }, ctx(from.seatId));
    attempts.push({ kind: "propose", ok: proposeResult.ok, reason: proposeResult.ok ? null : proposeResult.reason });
    if (!proposeResult.ok) continue;
    state = proposeResult.state;
    const offerId = Object.keys(state.offers).find((id) => state.offers[id].fromSeat === from.seatId && state.offers[id].state === "LIVE" && state.offers[id].send.includes(send.contractId));
    if (!offerId) continue;
    const acceptResult = sameLineL3Module.reduce(state, { type: "accept", offerId }, ctx(target.seatId));
    attempts.push({ kind: "accept", ok: acceptResult.ok, reason: acceptResult.ok ? null : acceptResult.reason });
    if (acceptResult.ok) state = acceptResult.state;
  }

  // Hour 1 -> hour 2, then close the market. Season settle runs here too.
  const closed1 = sameLineL3Module.reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  assertTrue(closed1.ok, "teacher:closeHour on hour 1 always succeeds from PLAY with a live market");
  state = closed1.ok ? closed1.state : state;
  const closed2 = sameLineL3Module.reduce(state, { type: "teacher:closeHour" }, ctx("teacher"));
  assertTrue(closed2.ok, "teacher:closeHour on hour 2 always succeeds and closes the market");
  state = closed2.ok ? closed2.state : state;

  return { state, attempts };
}

/* -------------------------------------------------------------- the sweep -- */

console.log("=== THE DEADLINE SWEEP — declared family ===");
console.log("desk count:        {12, 16}");
console.log("surplus-role dist: alternating SURPLUS (no open jobs) / SHORTAGE (1-2 open jobs) across seats");
console.log(`contract prices:   ${REAL_PRICES.length} real annuals cycled from world.ts BOARD (${REAL_PRICES.slice(0, 3).map((p) => p.name).join(", ")}, ...)`);
console.log("inbox concentration: {spread, one-hub}");
console.log("");

for (const deskCount of [12, 16]) {
  for (const concentration of ["spread", "one-hub"]) {
    for (const gradeBand of ["5-6", "7-8"]) {
      const profile = profileFor(gradeBand);
      const desks = buildPool(deskCount);
      const { withOpenJob, reachable } = jobFillReachability(desks, profile);
      const fraction = withOpenJob === 0 ? 1 : reachable / withOpenJob;
      console.log(
        `[desks=${deskCount} concentration=${concentration} band=${gradeBand}] job-filling reachability: ${reachable}/${withOpenJob} shortage desks (${(fraction * 100).toFixed(0)}%)`,
      );
      assertTrue(withOpenJob > 0, `[desks=${deskCount}] at least one desk starts with an open job (the family always alternates surplus/shortage)`);
      assertTrue(fraction > 0, `[desks=${deskCount} concentration=${concentration} band=${gradeBand}] at least one shortage desk can reach a legal job-filling trade`);

      // Fresh pool per play-through so the reachability probe above (which
      // does not mutate desks) and the scripted play below start identical.
      const roomDesks = buildPool(deskCount);
      const { state: finalState } = playRoom(roomDesks, gradeBand, concentration);

      // INVARIANT — no deal ever crosses a wall. Every desk here starts with
      // wall: null, so this also re-checks that `applyTrade`/`checkTrade`
      // never themselves write a wall into existence.
      for (const d of Object.values(finalState.desks)) {
        assertTrue(d.books.wall === null, `[desks=${deskCount}] a desk's wall was never null after play (nothing sets a wall mid-room)`);
      }

      // INVARIANT — no franchise ends below roster minimum (or above max).
      for (const d of Object.values(finalState.desks)) {
        assertTrue(
          d.roster.length >= ROSTER.min && d.roster.length <= ROSTER.max,
          `[desks=${deskCount} concentration=${concentration} band=${gradeBand}] ${d.label} ends with ${d.roster.length} players, outside [${ROSTER.min},${ROSTER.max}]`,
        );
      }

      // INVARIANT — taxSalary moves by executed annuals only: for every
      // EXECUTED deal, the sender's committed/taxSalary dropped by exactly
      // the sent annual and rose by exactly the received annual (relative to
      // the room's starting books), independent of `applyTrade`'s own
      // bookkeeping — recomputed here from the deal log as a cross-check.
      const startCommitted = {};
      const startTax = {};
      for (const d of Object.values(roomDesks)) {
        startCommitted[d.seatId] = d.books.committed;
        startTax[d.seatId] = d.books.taxSalary;
      }
      const delta = {};
      for (const seatId of Object.keys(finalState.desks)) delta[seatId] = 0;
      for (const deal of finalState.executed) {
        const sentAnnual = deal.send.reduce((n, id) => {
          const c = roomDesks[deal.fromSeat].roster.find((r) => r.contractId === id);
          return n + (c ? c.annual : 0);
        }, 0);
        const gotAnnual = deal.want.reduce((n, id) => {
          const c = roomDesks[deal.toSeat].roster.find((r) => r.contractId === id);
          return n + (c ? c.annual : 0);
        }, 0);
        delta[deal.fromSeat] += gotAnnual - sentAnnual;
        delta[deal.toSeat] += sentAnnual - gotAnnual;
      }
      for (const seatId of Object.keys(finalState.desks)) {
        const expectedCommitted = startCommitted[seatId] + (delta[seatId] ?? 0);
        const actualCommitted = finalState.desks[seatId].books.committed;
        assertTrue(expectedCommitted === actualCommitted, `[desks=${deskCount} concentration=${concentration} band=${gradeBand}] ${seatId} committed ${actualCommitted} !== expected ${expectedCommitted} from the executed-deal log`);
        // taxSalary starts from a DIFFERENT real figure than committed (real
        // teams carry trade kickers etc), but must move by the SAME executed
        // delta — never independently, never by more or less.
        const expectedTax = startTax[seatId] + (delta[seatId] ?? 0);
        const actualTax = finalState.desks[seatId].books.taxSalary;
        assertTrue(expectedTax === actualTax, `[desks=${deskCount} concentration=${concentration} band=${gradeBand}] ${seatId} taxSalary ${actualTax} !== expected ${expectedTax} (must move by the same executed delta as committed)`);
      }

      // INVARIANT — every accepted deal executes or voids by PLAY exit:
      // nothing may still be LIVE, COUNTERED or ACCEPTED once the market has
      // closed.
      for (const o of Object.values(finalState.offers)) {
        assertTrue(!["LIVE", "COUNTERED", "ACCEPTED"].includes(o.state), `[desks=${deskCount}] offer ${o.id} is still ${o.state} after the market closed`);
      }
      assertTrue(finalState.marketClosed === true, `[desks=${deskCount}] market is closed after two teacher:closeHour calls`);
      assertTrue(finalState.settled !== null, `[desks=${deskCount}] the season settle ran before this room ever reaches the Boardroom`);
    }
  }
}

/* --------------------------------------- both bands, identical actions -- */

// A script that only ever moves ONE object per side is legal at both bands,
// so the SAME script run against the SAME starting pool must land both bands
// on byte-identical committed/taxSalary/roster-length books — band only
// gates chip vocabulary, object-count and (5-6) accept-reversibility, never
// the trade math itself.
{
  const poolA = buildPool(12);
  const poolB = JSON.parse(JSON.stringify(poolA));
  const resultA = playRoom(poolA, "5-6", "spread");
  const resultB = playRoom(poolB, "7-8", "spread");
  for (const seatId of Object.keys(resultA.state.desks)) {
    const a = resultA.state.desks[seatId];
    const b = resultB.state.desks[seatId];
    assertTrue(a.books.committed === b.books.committed, `both-bands: ${seatId} committed diverged between 5-6 (${a.books.committed}) and 7-8 (${b.books.committed})`);
    assertTrue(a.roster.length === b.roster.length, `both-bands: ${seatId} roster length diverged between bands`);
  }
  log("both-bands identical-action check: committed and roster length matched at every seat");
}

console.log("");
if (failures > 0) {
  console.error(`SWEEP FAILED: ${failures} propert${failures === 1 ? "y" : "ies"} violated over the declared family.`);
  process.exit(1);
} else {
  console.log("SWEEP PASSED over the declared family above. See the file header for the four named environments this family does NOT cover.");
  process.exit(0);
}
