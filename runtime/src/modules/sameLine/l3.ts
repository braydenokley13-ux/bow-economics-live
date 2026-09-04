/**
 * MODULE 1 · LESSON 3 — "THE DEADLINE."
 *
 * Built against `docs/gauntlet/module-1/rebuild/W3_THE_DEADLINE_SPEC.md`, under
 * the integrator's binding rulings at the top of that file: the sweep problem
 * is open and this ships on a declared, printed family of modelled market
 * environments; collusion between friends is live economics, contained rather
 * than blocked; two market hours; the season settles BEFORE the Boardroom; the
 * Clippers cap-circumvention material stays out.
 *
 * TWO TRADEABLE OBJECT TYPES, AND ONLY TWO (spec §2): a `contract` this room
 * signed, and a franchise's own two future picks at `$0`. All the legality and
 * the contested-hour resolution live in `market.ts`, pure and sweep-testable;
 * this file is state, gating, seeds and words — same split L1 draws between
 * `engine.ts` and `l1.ts`.
 *
 * THE ONE PHASE GATE. `reduce` is it. The runtime checks ended, frozen and
 * paused, and nothing else. Every case below asks what phase it is in.
 */
import { CLUB, CLUBS, LINE, ROSTER, bandOf, type Band, type ClubId, type JobRole } from "./world.js";
import { money } from "./engine.js";
import {
  applyTrade,
  checkTrade,
  isContract,
  isOneChange,
  isPick,
  resolveContested,
  resolveOwned,
  salaryOf,
  sumSalary,
  type ContestEntry,
  type ContractObject,
  type JobState,
  type ObjectId,
  type PickObject,
  type TradeDeskLike,
  type TradeObject,
} from "./market.js";
import { extractWindowCarry, type WindowCarry } from "./carry.js";
import { extractSeasonCarry, type SeasonCarry } from "./seasonCarry.js";
import { profileFor, type GradeBand, type GradeProfile } from "../../shared/gradeBand.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../../shared/lessonModule.js";
import type { CanonicalPhase } from "../../shared/phases.js";

export const SAME_LINE_L3_ID = "m1l3-the-deadline";

/* ------------------------------------------------------------ objects -- */

const OWN_PICK_YEARS: Readonly<Record<1 | 2, number>> = { 1: 2029, 2: 2030 };
const ROUND_WORD: Readonly<Record<1 | 2, string>> = { 1: "first", 2: "second" };

function ownPicks(clubId: ClubId, twin: 0 | 1): PickObject[] {
  return ([1, 2] as const).map((round) => ({
    kind: "pick" as const,
    pickId: `${clubId}-${twin}-${round === 1 ? "first" : "second"}`,
    year: OWN_PICK_YEARS[round],
    round,
    label: `${OWN_PICK_YEARS[round]} ${ROUND_WORD[round]}`,
  }));
}

/**
 * Deterministic, seeded on `(sessionId, contractId)` — never `Math.random`, so
 * a teacher can rerun the class and say "this was always going to happen"
 * (spec §4, ARC_DESIGN §3). Used twice, for two different questions: whether a
 * carried-but-unearned contract "does the job" when Week 2 was never played,
 * and what an acquired contract did against the job it was traded for at the
 * season settle. Both are honestly modelled coin flips, not predictions.
 */
export function hashJobState(sessionId: string, contractId: string): JobState {
  const s = `${sessionId}::${contractId}`;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  const bucket = h % 10;
  if (bucket < 5) return "DOES_JOB";
  if (bucket < 8) return "MORE_THAN_JOB";
  return "DOES_NOT_DO_JOB";
}

/* ------------------------------------------------------------- desk -- */

export type Capture = {
  readonly id: string;
  readonly seatId: SeatId;
  readonly kind: "send" | "decline";
  readonly chip: string;
  readonly line?: string;
  readonly hour: 1 | 2;
};

export type Desk = {
  readonly seatId: SeatId;
  readonly clubId: ClubId;
  readonly twin: 0 | 1;
  readonly label: string;
  readonly books: {
    readonly committed: number;
    readonly taxSalary: number;
    readonly deadMoney: number;
    /**
     * Free-agent cap holds baked into `committed`. Every apron/wall test runs
     * on `committed - holds` (APRON TEAM SALARY), never on raw `committed` —
     * see the note on `market.ts`'s `TradeDeskLike.books`.
     */
    readonly holds: number;
    readonly wall: number | null;
    readonly band: Band;
  };
  readonly roster: readonly ContractObject[];
  readonly picksOwned: readonly PickObject[];
  /** The two pick ids this desk started the week with — for the OWED bookkeeping only. */
  readonly ownPickIds: readonly string[];
  readonly picksOwed: readonly { readonly pickId: string; readonly year: number; readonly toLabel: string }[];
  readonly openJobs: readonly JobRole[];
  readonly bookVersion: number;
  readonly captures: readonly Capture[];
  /** Sentences, never numbers a reducer reads back — the tape the Boardroom reconstructs from. */
  readonly evidence: readonly string[];
  readonly seedWarning: string | null;
};

function toTradeDesk(d: Desk): TradeDeskLike {
  return { seatId: d.seatId, clubId: d.clubId, twin: d.twin, roster: d.roster, picksOwned: d.picksOwned, books: { committed: d.books.committed, holds: d.books.holds, wall: d.books.wall } };
}

/* ------------------------------------------------------------- offer -- */

export type OfferState = "LIVE" | "COUNTERED" | "ACCEPTED" | "EXECUTED" | "DECLINED" | "EXPIRED" | "VOID_STALE";

export type Offer = {
  readonly id: string;
  /** Fixed for the life of the negotiation — the identity of the two desks involved. */
  readonly fromSeat: SeatId;
  readonly toSeat: SeatId;
  /** Current terms: `fromSeat` sends `send` and receives `want`, however the terms most recently changed. */
  readonly send: readonly ObjectId[];
  readonly want: readonly ObjectId[];
  /** Who authored the CURRENT terms — `fromSeat` until a counter, `toSeat` after. */
  readonly proposedBy: SeatId;
  readonly state: OfferState;
  /** Whether this negotiation has already used its one allowed counter. */
  readonly countered: boolean;
  readonly fromBookVersion: number;
  readonly toBookVersion: number;
  readonly captureId: string | null;
  readonly hour: 1 | 2;
  readonly acceptedBy: SeatId | null;
  readonly declinedBy: SeatId | null;
  /** Private forever to `declinedBy` (froth §4.1) — never read by `fromSeat`'s view. */
  readonly declineReason: string | null;
  /** Public once set — the books-changed sentence, shown to both parties. */
  readonly voidNote: string | null;
};

const recipientOf = (o: Offer): SeatId => (o.proposedBy === o.fromSeat ? o.toSeat : o.fromSeat);
const isOpenOffer = (o: Offer): boolean => o.state === "LIVE" || o.state === "COUNTERED";
const isEscrowingState = (s: OfferState): boolean => s === "LIVE" || s === "COUNTERED" || s === "ACCEPTED";

export type Deal = {
  readonly id: string;
  readonly hour: 1 | 2;
  readonly fromSeat: SeatId;
  readonly toSeat: SeatId;
  readonly send: readonly ObjectId[];
  readonly want: readonly ObjectId[];
};

export type SeasonSettleDesk = {
  readonly seatId: SeatId;
  readonly coveredJobs: number;
  /** Roles still open after the settle — a list, never a bare scalar (ARC_DESIGN §8.1). */
  readonly openJobs: readonly JobRole[];
  readonly acquiredResults: readonly { readonly contractId: string; readonly name: string; readonly role: JobRole; readonly result: JobState }[];
  /**
   * Economic Truth ruling: a pick has an in-lesson cost. Any contract on the
   * final roster — carried or acquired — with `yearsRemaining <= 1` reopens
   * its job next season regardless of how it graded this year, so a rental
   * bought with a pick visibly costs something even when it "does the job."
   */
  readonly expiringNextSeason: readonly { readonly contractId: string; readonly name: string; readonly role: JobRole }[];
};

export type SeasonSettle = { readonly perSeat: Readonly<Record<SeatId, SeasonSettleDesk>> };

/* ------------------------------------------------------------- seeds -- */

export type PoolFranchise = {
  readonly clubId: ClubId;
  readonly twin: 0 | 1;
  readonly label: string;
  readonly committed: number;
  readonly taxSalary: number;
  readonly deadMoney: number;
  /** See the note on `Desk.books.holds` — apron/wall tests key off `committed - holds`. */
  readonly holds: number;
  readonly wall: number | null;
  readonly openJobs: readonly JobRole[];
  readonly roster: readonly ContractObject[];
  readonly picksOwned: readonly PickObject[];
  readonly ownPickIds: readonly string[];
  readonly band: Band;
  readonly seedWarning: string | null;
};

/**
 * The real Week 2 carry has landed (`seasonCarry.ts`) — read via its own
 * `extractSeasonCarry`, never re-parsed here. `SeasonCarriedFranchise` has no
 * `holds` field (Week 2 does not model a hold changing over the season), so
 * this falls back to the club's Week 1 opening `holds` figure, same as the
 * stock pool does. That is an approximation, named as one: a real season
 * would usually only convert holds into real contracts, never grow them, so
 * this is a conservative (if anything, too generous to the desk's apron room)
 * stand-in rather than a guess in the dangerous direction.
 */
function fromSeasonCarry(sessionId: string, sc: SeasonCarry & { ok: true }): { franchises: readonly PoolFranchise[]; warnings: readonly string[] } {
  void sessionId;
  const franchises: PoolFranchise[] = sc.franchises.map((f) => {
    const roster: ContractObject[] = f.roster.map((r) => ({
      kind: "contract",
      contractId: r.contractId,
      playerId: r.playerId,
      name: r.name,
      role: r.role,
      annual: r.annual,
      yearsRemaining: r.yearsRemaining,
      jobState: r.jobState === "DID_THE_JOB" ? "DOES_JOB" : r.jobState === "DID_NOT" ? "DOES_NOT_DO_JOB" : hashJobState(sessionId, r.contractId),
      acquiredWeek: r.acquiredWeek,
    }));
    const picksOwned: PickObject[] = f.picks.length > 0 ? f.picks.map((p) => ({ kind: "pick", pickId: p.pickId, year: p.year, round: p.round, label: p.label })) : ownPicks(f.clubId, f.twin);
    return {
      clubId: f.clubId,
      twin: f.twin,
      label: f.label,
      committed: f.committed,
      taxSalary: f.taxSalary,
      deadMoney: f.deadMoney,
      holds: CLUB[f.clubId].holds.value,
      wall: f.wall,
      openJobs: f.openJobs,
      roster,
      picksOwned,
      ownPickIds: picksOwned.map((p) => p.pickId),
      band: f.band,
      seedWarning: null,
    };
  });
  return { franchises, warnings: sc.warnings };
}

/** Degrade to Week 1's own carry when no Week 2 seed is usable (spec §7 "degradation"). */
function fromWindowCarry(sessionId: string, wc: WindowCarry & { ok: true }): { franchises: readonly PoolFranchise[]; warnings: readonly string[] } {
  const franchises: PoolFranchise[] = wc.franchises.map((f) => {
    const roster: ContractObject[] = f.signings.map((sg) => {
      const contractId = `${f.clubId}-${f.twin}-${sg.playerId}`;
      return {
        kind: "contract",
        contractId,
        playerId: sg.playerId,
        name: sg.name,
        role: sg.role,
        annual: sg.annual,
        yearsRemaining: Math.max(1, sg.years - 1),
        jobState: hashJobState(sessionId, contractId),
        acquiredWeek: 1,
      };
    });
    return {
      clubId: f.clubId,
      twin: f.twin,
      label: f.label,
      committed: f.committed,
      taxSalary: f.taxSalary,
      deadMoney: f.deadMoney,
      holds: f.holds,
      wall: f.wall,
      openJobs: f.openJobs,
      roster,
      picksOwned: ownPicks(f.clubId, f.twin),
      ownPickIds: ownPicks(f.clubId, f.twin).map((p) => p.pickId),
      band: f.band,
      seedWarning: "No Week 2 season was linked for this franchise. Job states were seeded, not earned.",
    };
  });
  return { franchises, warnings: [...wc.warnings, "No season was played — job states were seeded, not earned."] };
}

function stockPool(): readonly PoolFranchise[] {
  const out: PoolFranchise[] = [];
  for (const club of CLUBS) {
    for (const twin of [0, 1] as const) {
      out.push({
        clubId: club.id,
        twin,
        label: `${club.name} ${twin === 0 ? "A" : "B"}`,
        committed: club.committed.value,
        taxSalary: club.taxSalary.value,
        deadMoney: club.deadMoney.value,
        holds: club.holds.value,
        wall: null,
        openJobs: club.jobs,
        roster: [],
        picksOwned: ownPicks(club.id, twin),
        ownPickIds: ownPicks(club.id, twin).map((p) => p.pickId),
        band: bandOf(club.committed.value),
        seedWarning: "No linked room was found. This is a stock franchise, with nothing signed yet — the console says so.",
      });
    }
  }
  return out;
}

/** The one place a seed is turned into a pool of desks-to-be. See spec §7 "Seed IN". */
function resolveSeed(sessionId: string, seed: unknown, gradeBand: GradeBand): { pool: readonly PoolFranchise[]; warnings: readonly string[] } {
  const season = extractSeasonCarry(seed, gradeBand);
  if (season.ok) {
    const real = fromSeasonCarry(sessionId, season);
    return { pool: real.franchises, warnings: real.warnings };
  }

  const window = extractWindowCarry(seed, gradeBand);
  if (window.ok) {
    const degraded = fromWindowCarry(sessionId, window);
    return { pool: degraded.franchises, warnings: degraded.warnings };
  }
  // BC-18: a band mismatch or malformed seed refuses the carry outright, and a
  // dropped room still opens playable rather than stranding the class.
  return { pool: stockPool(), warnings: [`No usable Week 1 or Week 2 history was found (${window.reason}). Every desk starts from a stock franchise, and the console says so.`] };
}

/* ---------------------------------------------------------------- state -- */

export type SameLineL3State = {
  readonly sessionId: string;
  readonly gradeBand: GradeBand;
  readonly hour: 1 | 2;
  readonly marketClosed: boolean;
  readonly desks: Readonly<Record<SeatId, Desk>>;
  readonly listings: readonly ObjectId[];
  readonly offers: Readonly<Record<string, Offer>>;
  readonly executed: readonly Deal[];
  readonly settled: SeasonSettle | null;
  readonly beat: number;
  readonly warnings: readonly string[];
  readonly observers: readonly SeatId[];
  readonly pool: readonly PoolFranchise[];
  readonly nextPoolIndex: number;
  readonly nextSeq: number;
  readonly hotSeat: SeatId | null;
  readonly defenses: Readonly<Record<SeatId, string>>;
};

function initialState(input: { sessionId: string; seatIds: readonly SeatId[]; seed?: unknown; gradeBand: GradeBand }): SameLineL3State {
  const { pool, warnings } = resolveSeed(input.sessionId, input.seed, input.gradeBand);
  return {
    sessionId: input.sessionId,
    gradeBand: input.gradeBand,
    hour: 1,
    marketClosed: false,
    desks: {},
    listings: [],
    offers: {},
    executed: [],
    settled: null,
    beat: 0,
    warnings,
    observers: [],
    pool,
    nextPoolIndex: 0,
    nextSeq: 1,
    hotSeat: null,
    defenses: {},
  };
}

/* -------------------------------------------------------------- chips -- */

export const SEND_CHIPS_56 = ["A JOB SOMEBODY WAS DOING", "MONEY I MIGHT NEED LATER", "A PICK I CAN'T GET BACK", "NOTHING I'LL MISS"] as const;
export const SEND_CHIPS_78 = ["THE ONLY BIG CONTRACT I COULD MOVE", "A FUTURE ASSET", "ROOM UNDER MY WALL", "A ROLE I HAVE NOBODY ELSE FOR"] as const;
export const DECLINE_CHIPS = ["I NEED WHAT THEY WANTED", "NOT ENOUGH BACK", "WRONG JOB", "I'M WAITING FOR SOMETHING BETTER"] as const;

const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/* --------------------------------------------------------------- reduce -- */

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"];

const fail = (reason: string): ReduceResult<SameLineL3State> => ({ ok: false, reason });

function isEscrowed(offers: Readonly<Record<string, Offer>>, id: ObjectId): boolean {
  return Object.values(offers).some((o) => isEscrowingState(o.state) && (o.send.includes(id) || o.want.includes(id)));
}

/** The public, non-seat-identifying key for a desk — "clubId-twin" — the only way a market card or a myOffers entry may point at a counterparty. */
function holderIdOf(d: Desk): string {
  return `${d.clubId}-${d.twin}`;
}
function seatByHolderId(state: SameLineL3State, holderId: string): SeatId | null {
  for (const d of Object.values(state.desks)) if (holderIdOf(d) === holderId) return d.seatId;
  return null;
}

function labelFor(objects: readonly TradeObject[]): string {
  return objects.map((o) => (isContract(o) ? o.name : o.label)).join(" and ");
}

function labelOf(o: TradeObject): string {
  return isContract(o) ? o.name : o.label;
}

function reduce(state: SameLineL3State, action: { type: string; [k: string]: unknown }, ctx: ReduceContext): ReduceResult<SameLineL3State> {
  switch (action.type) {
    case "takeSeat": {
      if (ctx.seatId === "teacher") return fail("a teacher does not hold a desk");
      if (state.desks[ctx.seatId]) return { ok: true, state };
      if (state.observers.includes(ctx.seatId)) return { ok: true, state };
      if (state.marketClosed || ctx.phase === "COMPLETE" || state.nextPoolIndex >= state.pool.length) {
        return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      }
      const entry = state.pool[state.nextPoolIndex]!;
      const desk: Desk = {
        seatId: ctx.seatId,
        clubId: entry.clubId,
        twin: entry.twin,
        label: entry.label,
        books: { committed: entry.committed, taxSalary: entry.taxSalary, deadMoney: entry.deadMoney, holds: entry.holds, wall: entry.wall, band: entry.band },
        roster: entry.roster,
        picksOwned: entry.picksOwned,
        ownPickIds: entry.ownPickIds,
        picksOwed: [],
        openJobs: entry.openJobs,
        bookVersion: 1,
        captures: [],
        evidence: [],
        seedWarning: entry.seedWarning,
      };
      return { ok: true, state: { ...state, desks: { ...state.desks, [ctx.seatId]: desk }, nextPoolIndex: state.nextPoolIndex + 1 } };
    }

    case "list":
    case "unlist": {
      if (ctx.phase !== "PLAY") return fail(`the market is not open in this phase`);
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not hold a desk");
      const id = action["objectId"];
      if (typeof id !== "string") return fail("no object named");
      if (action.type === "unlist") {
        return { ok: true, state: { ...state, listings: state.listings.filter((x) => x !== id) } };
      }
      const owned = resolveOwned(toTradeDesk(desk), [id]);
      if (!owned) return fail("that is not on your own books");
      if (isEscrowed(state.offers, id)) return fail("that is tied up in a live offer");
      if (state.listings.includes(id)) return { ok: true, state };
      return { ok: true, state: { ...state, listings: [...state.listings, id] } };
    }

    case "propose": {
      if (ctx.phase !== "PLAY") return fail("the deadline room is not open in this phase");
      if (state.marketClosed) return fail("the market is closed. The deadline has passed.");
      const fromDesk = state.desks[ctx.seatId];
      if (!fromDesk) return fail("you do not hold a desk");
      const toSeatRaw = action["toSeat"];
      const toDeskId = action["toDesk"];
      const send = action["send"];
      const want = action["want"];
      const chip = action["chip"];
      const line = action["line"];
      // `toDesk` is the public club-facing key (`holderId`, "clubId-twin") the
      // composer reads off a market card — never a seat id. `toSeat` keeps
      // working directly for any caller that already resolved one.
      const toSeat = typeof toSeatRaw === "string" ? toSeatRaw : typeof toDeskId === "string" ? seatByHolderId(state, toDeskId) : null;
      if (typeof toSeat !== "string" || !Array.isArray(send) || !Array.isArray(want)) return fail("a trade needs a desk, what you send and what you want");
      const toDesk = state.desks[toSeat];
      if (!toDesk) return fail("no such desk");
      if (!send.every((s): s is string => typeof s === "string") || !want.every((s): s is string => typeof s === "string")) return fail("malformed package");

      const liveOut = Object.values(state.offers).filter((o) => o.fromSeat === ctx.seatId && isOpenOffer(o) && recipientOf(o) !== ctx.seatId ? false : o.fromSeat === ctx.seatId && o.state === "LIVE").length;
      const trueLiveOut = Object.values(state.offers).filter((o) => o.fromSeat === ctx.seatId && o.state === "LIVE").length;
      void liveOut;
      if (trueLiveOut >= 2) return fail("You already have two offers out. Wait to hear back, or withdraw one, before sending a third.");

      const inbox = Object.values(state.offers).filter((o) => o.toSeat === toSeat && o.state === "LIVE").length;
      if (inbox >= 3) return fail(`${toDesk.label}'s desk is full. Try somebody else.`);

      for (const id of [...send, ...want]) {
        if (isEscrowed(state.offers, id)) return fail("Something in this trade is already tied up in another live offer.");
      }

      const profile = profileFor(state.gradeBand);
      const legality = checkTrade(toTradeDesk(fromDesk), toTradeDesk(toDesk), send, want, profile);
      if (!legality.ok) return fail(legality.reason);

      const chipList = profile.band === "5-6" ? SEND_CHIPS_56 : SEND_CHIPS_78;
      if (typeof chip !== "string" || !(chipList as readonly string[]).includes(chip)) {
        return fail("Every offer needs to say what you're giving up before it can go out.");
      }
      const limit = profile.band === "5-6" ? 12 : 20;
      if (line !== undefined && (typeof line !== "string" || wordCount(line) > limit)) {
        return fail(`That line is longer than ${limit} words.`);
      }

      const offerId = `offer-${state.nextSeq}`;
      const captureId = `capture-${state.nextSeq}`;
      const capture: Capture = { id: captureId, seatId: ctx.seatId, kind: "send", chip, line: typeof line === "string" ? line : undefined, hour: state.hour };
      const offer: Offer = {
        id: offerId,
        fromSeat: ctx.seatId,
        toSeat,
        send,
        want,
        proposedBy: ctx.seatId,
        state: "LIVE",
        countered: false,
        fromBookVersion: fromDesk.bookVersion,
        toBookVersion: toDesk.bookVersion,
        captureId,
        hour: state.hour,
        acceptedBy: null,
        declinedBy: null,
        declineReason: null,
        voidNote: null,
      };
      return {
        ok: true,
        state: {
          ...state,
          nextSeq: state.nextSeq + 1,
          offers: { ...state.offers, [offerId]: offer },
          desks: { ...state.desks, [ctx.seatId]: { ...fromDesk, captures: [...fromDesk.captures, capture] } },
        },
      };
    }

    case "withdraw": {
      if (ctx.phase !== "PLAY") return fail("cannot withdraw outside the deadline room");
      const id = action["offerId"];
      if (typeof id !== "string") return fail("no offer named");
      const offer = state.offers[id];
      if (!offer) return fail("no such offer");
      if (offer.fromSeat !== ctx.seatId) return fail("that is not your offer to withdraw");
      if (!isOpenOffer(offer)) return fail("that offer is no longer live");
      return { ok: true, state: { ...state, offers: { ...state.offers, [id]: { ...offer, state: "EXPIRED" } } } };
    }

    case "counter": {
      if (ctx.phase !== "PLAY") return fail("cannot counter outside the deadline room");
      if (state.marketClosed) return fail("the market is closed");
      const id = action["offerId"];
      if (typeof id !== "string") return fail("no offer named");
      const original = state.offers[id];
      if (!original) return fail("no such offer");
      if (original.state !== "LIVE") return fail("that offer is not open to a counter");
      if (recipientOf(original) !== ctx.seatId) return fail("only the recipient may counter");
      if (original.countered) return fail("this negotiation already used its one counter");

      const send = action["send"];
      const want = action["want"];
      if (!Array.isArray(send) || !Array.isArray(want) || !send.every((s): s is string => typeof s === "string") || !want.every((s): s is string => typeof s === "string")) {
        return fail("malformed counter");
      }
      const fromDesk = state.desks[original.fromSeat];
      const toDesk = state.desks[original.toSeat];
      if (!fromDesk || !toDesk) return fail("a desk in this negotiation no longer exists");
      const isPickId = (oid: ObjectId): boolean => fromDesk.picksOwned.some((p) => p.pickId === oid) || toDesk.picksOwned.some((p) => p.pickId === oid);
      if (!isOneChange(original.send, original.want, send, want, isPickId)) {
        return fail("A counter may change exactly one thing — swap one object, or add or remove one pick.");
      }
      for (const oid of [...send, ...want]) {
        if (isEscrowed(state.offers, oid) && !original.send.includes(oid) && !original.want.includes(oid)) {
          return fail("Something in this counter is already tied up in another live offer.");
        }
      }
      const profile = profileFor(state.gradeBand);
      const legality = checkTrade(toTradeDesk(fromDesk), toTradeDesk(toDesk), send, want, profile);
      if (!legality.ok) return fail(legality.reason);

      const countered: Offer = {
        ...original,
        send,
        want,
        proposedBy: ctx.seatId,
        state: "COUNTERED",
        countered: true,
      };
      return { ok: true, state: { ...state, offers: { ...state.offers, [id]: countered } } };
    }

    case "accept": {
      if (ctx.phase !== "PLAY") return fail("cannot accept outside the deadline room");
      if (state.marketClosed) return fail("the market is closed");
      const id = action["offerId"];
      if (typeof id !== "string") return fail("no offer named");
      const offer = state.offers[id];
      if (!offer) return fail("no such offer");
      if (!isOpenOffer(offer)) return fail("that offer is no longer open");
      if (recipientOf(offer) !== ctx.seatId) return fail("that is not yours to accept");

      const fromDesk = state.desks[offer.fromSeat];
      const toDesk = state.desks[offer.toSeat];
      if (!fromDesk || !toDesk) return fail("a desk in this negotiation no longer exists");
      if (offer.fromBookVersion !== fromDesk.bookVersion || offer.toBookVersion !== toDesk.bookVersion) {
        const voided: Offer = { ...offer, state: "VOID_STALE", voidNote: "The books changed after this was sent. The deal is off." };
        return { ok: true, state: { ...state, offers: { ...state.offers, [id]: voided } } };
      }
      const profile = profileFor(state.gradeBand);
      if (profile.band === "5-6") {
        // At 5-6 a desk may only be inside ONE accepted deal at a time — as
        // the acceptor OR as the desk on the other end of it — so a fast
        // click cannot double-commit a desk across two negotiations while
        // the room is still deciding. Checked on BOTH desks in this offer,
        // not only the one calling accept.
        const involvedInAccepted = (seatId: SeatId): boolean => Object.values(state.offers).some((o) => o.state === "ACCEPTED" && (o.fromSeat === seatId || o.toSeat === seatId));
        if (involvedInAccepted(offer.fromSeat) || involvedInAccepted(offer.toSeat)) {
          return fail("One of these desks already has a deal on the table this hour.");
        }
      }
      const accepted: Offer = { ...offer, state: "ACCEPTED", acceptedBy: ctx.seatId };
      return { ok: true, state: { ...state, offers: { ...state.offers, [id]: accepted } } };
    }

    /*
     * Economic Truth ruling (2026-09-04): at 5-6 the single live accept must
     * be reversible before the hour closes, or the desk that answers fastest
     * is rewarded for speed rather than for the deal. Reverts to whichever
     * open state this negotiation was actually in (COUNTERED once it has used
     * its one counter, LIVE otherwise) — never re-litigates the package.
     */
    case "withdrawAccept": {
      if (ctx.phase !== "PLAY") return fail("cannot withdraw an accept outside the deadline room");
      // D61 ruling 3: reversible at 5-6 only, so a quick click there is not
      // rewarded for speed. At 7-8 an accept is final the moment it lands.
      if (profileFor(state.gradeBand).band !== "5-6") return fail("an accept is final in this room");
      const id = action["offerId"];
      if (typeof id !== "string") return fail("no offer named");
      const offer = state.offers[id];
      if (!offer) return fail("no such offer");
      if (offer.state !== "ACCEPTED") return fail("that offer is not sitting on an accept");
      if (offer.acceptedBy !== ctx.seatId) return fail("that is not your accept to withdraw");
      const reverted: Offer = { ...offer, state: offer.countered ? "COUNTERED" : "LIVE", acceptedBy: null };
      return { ok: true, state: { ...state, offers: { ...state.offers, [id]: reverted } } };
    }

    case "decline": {
      if (ctx.phase !== "PLAY") return fail("cannot decline outside the deadline room");
      const id = action["offerId"];
      if (typeof id !== "string") return fail("no offer named");
      const offer = state.offers[id];
      if (!offer) return fail("no such offer");
      if (!isOpenOffer(offer)) return fail("that offer is no longer open");
      if (recipientOf(offer) !== ctx.seatId) return fail("that is not yours to decline");
      const chip = action["chip"];
      if (typeof chip !== "string" || !(DECLINE_CHIPS as readonly string[]).includes(chip)) {
        return fail("A decline needs a reason chip.");
      }
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not hold a desk");
      const captureId = `capture-${state.nextSeq}`;
      const capture: Capture = { id: captureId, seatId: ctx.seatId, kind: "decline", chip, hour: state.hour };
      const declined: Offer = { ...offer, state: "DECLINED", declinedBy: ctx.seatId, declineReason: chip };
      return {
        ok: true,
        state: {
          ...state,
          nextSeq: state.nextSeq + 1,
          offers: { ...state.offers, [id]: declined },
          desks: { ...state.desks, [ctx.seatId]: { ...desk, captures: [...desk.captures, capture] } },
        },
      };
    }

    case "teacher:executeCall": {
      if (ctx.seatId !== "teacher") return fail("only the league office executes a call");
      if (ctx.phase !== "PLAY") return fail("nothing to execute outside the deadline room");
      const settlement = settleHour(state, false);
      return { ok: true, state: { ...state, desks: settlement.desks, offers: settlement.offers, executed: settlement.executed } };
    }

    case "teacher:closeHour": {
      if (ctx.seatId !== "teacher") return fail("only the league office closes the hour");
      if (ctx.phase !== "PLAY") return fail("no hour is open outside the deadline room");
      if (state.marketClosed) return fail("the market is already closed");
      const settlement = settleHour(state, true);
      const next: SameLineL3State = { ...state, desks: settlement.desks, offers: settlement.offers, executed: settlement.executed };
      if (state.hour === 1) return { ok: true, state: { ...next, hour: 2 } };
      return { ok: true, state: applySettle({ ...next, marketClosed: true }) };
    }

    case "defend": {
      if (ctx.phase !== "COUNTERFACTUAL" && ctx.phase !== "ARGUE") return fail("nothing to defend yet");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not hold a desk");
      const text = action["text"];
      if (typeof text !== "string" || !text.trim()) return fail("a defense needs words");
      return { ok: true, state: { ...state, defenses: { ...state.defenses, [ctx.seatId]: text } } };
    }

    case "teacher:hotSeat": {
      if (ctx.seatId !== "teacher") return fail("only the teacher calls the hot seat");
      if (ctx.phase !== "ARGUE") return fail("the hot seat is an ARGUE control");
      const seatId = action["seatId"];
      if (typeof seatId !== "string" || !state.desks[seatId]) return fail("no such desk");
      return { ok: true, state: { ...state, hotSeat: seatId } };
    }

    case "teacher:nextName": {
      if (ctx.seatId !== "teacher") return fail("only the teacher walks the naming");
      if (ctx.phase !== "SYNTHESIS") return fail("nothing to walk outside SYNTHESIS");
      return { ok: true, state: { ...state, beat: state.beat + 1 } };
    }

    default:
      return fail(`unknown action "${action.type}"`);
  }
}

/* ------------------------------------------------------ hour settlement -- */

function buildContestEntry(state: SameLineL3State, o: Offer): ContestEntry {
  const acceptedBy = o.acceptedBy!;
  const counterparty = acceptedBy === o.fromSeat ? state.desks[o.toSeat]! : state.desks[o.fromSeat]!;
  const acceptingDesk = state.desks[acceptedBy]!;
  // What the accepting desk sends away under these terms.
  const acceptingSends = acceptedBy === o.fromSeat ? o.send : o.want;
  const acceptingGets = acceptedBy === o.fromSeat ? o.want : o.send;
  const gotObjects = resolveOwned(toTradeDesk(counterparty), acceptingGets) ?? [];
  const fillsOpenJob = gotObjects.some((obj) => isContract(obj) && obj.jobState !== "DOES_NOT_DO_JOB" && acceptingDesk.openJobs.includes(obj.role));
  const sentObjects = resolveOwned(toTradeDesk(acceptingDesk), acceptingSends) ?? [];
  return {
    offerId: o.id,
    acceptedBy,
    counterpartyClubId: counterparty.clubId,
    counterpartyTwin: counterparty.twin,
    fillsOpenJob,
    outgoingSalaryFromAccepting: sumSalary(sentObjects),
  };
}

function dealSentence(hour: 1 | 2, fromLabel: string, toLabel: string, sent: readonly TradeObject[], got: readonly TradeObject[]): string {
  return `Hour ${hour}: ${fromLabel} sent ${labelFor(sent)} to ${toLabel} for ${labelFor(got)}.`;
}

/**
 * Execute every ACCEPTED offer this hour (through §2's sealed, deterministic
 * contest), then — when `expireRest` is true — expire everything still
 * LIVE/COUNTERED and release its escrow. The same routine backs
 * `teacher:closeHour`, `teacher:executeCall`, and `onPhaseExit` leaving PLAY,
 * so a round closed by the clock and one closed by hand cannot diverge.
 */
function settleHour(state: SameLineL3State, expireRest: boolean): { desks: Readonly<Record<SeatId, Desk>>; offers: Readonly<Record<string, Offer>>; executed: readonly Deal[] } {
  const accepted = Object.values(state.offers).filter((o) => o.state === "ACCEPTED");
  const entries = accepted.map((o) => buildContestEntry(state, o));
  const { clears, voided } = resolveContested(entries, CLUBS.map((c) => c.id));

  let desks = { ...state.desks };
  let offers = { ...state.offers };
  const executed: Deal[] = [];

  for (const id of voided) {
    offers[id] = { ...offers[id]!, state: "VOID_STALE", voidNote: "The books changed. That trade is off." };
  }

  for (const id of clears) {
    const o = offers[id]!;
    const fromDesk = desks[o.fromSeat]!;
    const toDesk = desks[o.toSeat]!;
    const sentObjects = resolveOwned(toTradeDesk(fromDesk), o.send) ?? [];
    const gotObjects = resolveOwned(toTradeDesk(toDesk), o.want) ?? [];
    const effect = applyTrade(
      { roster: fromDesk.roster, picksOwned: fromDesk.picksOwned, committed: fromDesk.books.committed, taxSalary: fromDesk.books.taxSalary },
      { roster: toDesk.roster, picksOwned: toDesk.picksOwned, committed: toDesk.books.committed, taxSalary: toDesk.books.taxSalary },
      o.send,
      o.want,
      3,
    );

    const fromOwedNew = o.send.filter((oid) => fromDesk.ownPickIds.includes(oid)).map((oid) => {
      const p = fromDesk.picksOwned.find((pp) => pp.pickId === oid)!;
      return { pickId: p.pickId, year: p.year, toLabel: toDesk.label };
    });
    const toOwedNew = o.want.filter((oid) => toDesk.ownPickIds.includes(oid)).map((oid) => {
      const p = toDesk.picksOwned.find((pp) => pp.pickId === oid)!;
      return { pickId: p.pickId, year: p.year, toLabel: fromDesk.label };
    });

    desks[o.fromSeat] = {
      ...fromDesk,
      roster: effect.from.roster,
      picksOwned: effect.from.picksOwned,
      picksOwed: [...fromDesk.picksOwed, ...fromOwedNew],
      books: { ...fromDesk.books, committed: effect.from.committed, taxSalary: effect.from.taxSalary },
      bookVersion: fromDesk.bookVersion + 1,
      evidence: [...fromDesk.evidence, dealSentence(o.hour, fromDesk.label, toDesk.label, sentObjects, gotObjects)],
    };
    desks[o.toSeat] = {
      ...toDesk,
      roster: effect.to.roster,
      picksOwned: effect.to.picksOwned,
      picksOwed: [...toDesk.picksOwed, ...toOwedNew],
      books: { ...toDesk.books, committed: effect.to.committed, taxSalary: effect.to.taxSalary },
      bookVersion: toDesk.bookVersion + 1,
      evidence: [...toDesk.evidence, dealSentence(o.hour, toDesk.label, fromDesk.label, gotObjects, sentObjects)],
    };
    offers[id] = { ...o, state: "EXECUTED" };
    executed.push({ id: o.id, hour: o.hour, fromSeat: o.fromSeat, toSeat: o.toSeat, send: o.send, want: o.want });
  }

  if (expireRest) {
    for (const [id, o] of Object.entries(offers)) {
      if (isOpenOffer(o)) offers[id] = { ...o, state: "EXPIRED" };
    }
  }

  return { desks, offers, executed: [...state.executed, ...executed] };
}

/**
 * THE SEASON SETTLE — job-based, never a scalar (ARC_DESIGN §8.1). Runs once,
 * BEFORE the Boardroom (D59 ruling 4), against the roster each desk actually
 * holds once the deadline has passed. Deterministic on `(sessionId,
 * contractId)`; a contract kept from before this week keeps the jobState it
 * already carried, and only a contract acquired THIS week gets a fresh result
 * against the job it was traded for.
 */
function computeSeasonSettle(state: SameLineL3State): SeasonSettle {
  const perSeat: Record<SeatId, SeasonSettleDesk> = {};
  for (const desk of Object.values(state.desks)) {
    const acquired = desk.roster.filter((c) => c.acquiredWeek === 3);
    const acquiredResults = acquired.map((c) => ({ contractId: c.contractId, name: c.name, role: c.role, result: hashJobState(state.sessionId, c.contractId) }));
    const remaining = [...desk.openJobs];
    let covered = 0;
    for (const r of acquiredResults) {
      if (r.result === "DOES_NOT_DO_JOB") continue;
      const idx = remaining.indexOf(r.role);
      if (idx >= 0) {
        remaining.splice(idx, 1);
        covered += 1;
      }
    }
    const expiringNextSeason = desk.roster.filter((c) => c.yearsRemaining <= 1).map((c) => ({ contractId: c.contractId, name: c.name, role: c.role }));
    perSeat[desk.seatId] = { seatId: desk.seatId, coveredJobs: covered, openJobs: remaining, acquiredResults, expiringNextSeason };
  }
  return { perSeat };
}

/** Compute the settle AND write each desk's `openJobs` forward to what the settle left open — what `deadlineCarry.ts` reads as "openJobs after the settle". */
function applySettle(state: SameLineL3State): SameLineL3State {
  if (state.settled) return state;
  const settled = computeSeasonSettle(state);
  const desks = { ...state.desks };
  for (const [seatId, result] of Object.entries(settled.perSeat)) {
    const desk = desks[seatId];
    if (desk) desks[seatId] = { ...desk, openJobs: result.openJobs };
  }
  return { ...state, desks, settled };
}

/* ----------------------------------------------------------------- module -- */

export const sameLineL3Module: LessonModule<SameLineL3State> = {
  id: SAME_LINE_L3_ID,
  title: "The Deadline",
  phases: PHASES,
  initialState,
  reduce,
  onPhaseExit: (state, from, to) => {
    let next = state;
    if (from === "PLAY") {
      const settlement = settleHour(next, true);
      next = applySettle({ ...next, desks: settlement.desks, offers: settlement.offers, executed: settlement.executed, marketClosed: true });
    }
    if (to === "SYNTHESIS") next = { ...next, beat: 0 };
    return next;
  },
  allowedActions: (phase) =>
    phase === "PLAY"
      ? ["takeSeat", "list", "unlist", "propose", "withdraw", "counter", "accept", "withdrawAccept", "decline"]
      : phase === "LOBBY" || phase === "HOOK"
        ? ["takeSeat"]
        : phase === "COUNTERFACTUAL" || phase === "ARGUE"
          ? ["defend"]
          : [],

  studentView: (state, seatId, phase) => studentView(state, seatId, phase),
  teacherView: (state, phase) => teacherView(state, phase),
  boardView: (state, phase) => boardView(state, phase),
  aggregate: (state) => ({ desks: Object.keys(state.desks).length, hour: state.hour, marketClosed: state.marketClosed, executed: state.executed.length }),

  spotlightView: (state, seatId, phase) => spotlightViewFor(state, seatId, phase),
  pressCandidates: (state, phase) => pressCandidatesFor(state, phase),

  round: {
    closeHook: "teacher:closeHour",
    noun: "hour",
    currentKey: (state, phase) => (phase === "PLAY" && !state.marketClosed ? `hour${state.hour}` : null),
    fallbackPolicy:
      "An offer nobody answered expires when the hour ends. Nothing is accepted for anybody and nothing is charged. The offer is gone, the players come out of escrow, and the desk that sent it gets its slot back.",
    unresolved: (state, phase, seatIds) => {
      if (phase !== "PLAY" || state.marketClosed) return [];
      const out: UnresolvedSeat[] = [];
      for (const seatId of seatIds) {
        const desk = state.desks[seatId];
        if (!desk) continue;
        const waiting = Object.values(state.offers).filter((o) => isOpenOffer(o) && recipientOf(o) === seatId);
        if (waiting.length === 0) continue;
        const n = waiting.length;
        out.push({
          seatId,
          label: desk.label,
          fallback: `${desk.label} — ${n} offer${n === 1 ? "" : "s"} sitting unanswered; ${n === 1 ? "it expires" : "both expire"}`,
          selfFallback: `You have ${n} offer${n === 1 ? "" : "s"} waiting. If the hour ends now, ${n === 1 ? "it expires" : "they expire"} and you keep everything.`,
        });
      }
      return out;
    },
  },

  classEvents: (prev, next, transition) => {
    const lines: string[] = [];
    if (next.executed.length > prev.executed.length) {
      const n = next.executed.length - prev.executed.length;
      lines.push(`${n} trade${n === 1 ? "" : "s"} cleared.`);
    }
    if (transition.fromPhase !== transition.toPhase && transition.toPhase === "REVEAL") {
      lines.push("The deadline passed. The room started going through what happened.");
    }
    return lines;
  },
};

/* ------------------------------------------------------- the podium -- */

export function spotlightViewFor(state: SameLineL3State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const desk = state.desks[seatId];
  if (!desk) return null;
  const publicDeals = state.executed.filter((d) => d.fromSeat === seatId || d.toSeat === seatId);
  return {
    module: SAME_LINE_L3_ID,
    label: desk.label,
    club: CLUB[desk.clubId].name,
    hour: state.hour,
    marketClosed: state.marketClosed,
    committedText: money(desk.books.committed),
    wallText: desk.books.wall !== null ? money(desk.books.wall) : null,
    openJobs: desk.openJobs,
    tradesExecuted: publicDeals.length,
    picksOwed: desk.picksOwed,
    openingQuestion:
      publicDeals.length > 0
        ? `You made ${publicDeals.length} trade${publicDeals.length === 1 ? "" : "s"} today. Walk us through the last one.`
        : desk.openJobs.length > 0 && phase !== "LOBBY" && phase !== "HOOK"
          ? `You still have ${desk.openJobs.length === 1 ? "a hole" : "holes"} open and you made no trade. What were you waiting for?`
          : "Walk us through your deadline.",
  };
}

export function pressCandidatesFor(state: SameLineL3State, _phase: CanonicalPhase): readonly { seatId: SeatId; label: string; why: string }[] {
  const desks = Object.values(state.desks);
  const byClub = new Map<ClubId, Desk[]>();
  for (const d of desks) byClub.set(d.clubId, [...(byClub.get(d.clubId) ?? []), d]);
  const scored = desks.map((d) => {
    let score = 0;
    const why: string[] = [];
    const twin = (byClub.get(d.clubId) ?? []).find((o) => o.seatId !== d.seatId);
    const mine = state.executed.filter((deal) => deal.fromSeat === d.seatId || deal.toSeat === d.seatId).length;
    if (twin) {
      const theirs = state.executed.filter((deal) => deal.fromSeat === twin.seatId || deal.toSeat === twin.seatId).length;
      if (mine !== theirs) {
        score += 3;
        // Economic Truth ruling: same books on day one — different rooms
        // answered them. The gap is never framed as one twin "beating" the
        // other; it is who called whom, and who said yes.
        why.push(`same books on day one as ${twin.label} — different rooms answered them (${mine} trades against ${theirs})`);
      }
    }
    const declined = Object.values(state.offers).filter((o) => o.declinedBy === d.seatId).length;
    if (declined >= 2) {
      score += 2;
      why.push(`said no ${declined} times`);
    }
    if (mine === 0 && state.marketClosed) {
      score += 2;
      why.push("stood pat all session");
    }
    const received = Object.values(state.offers).filter((o) => o.toSeat === d.seatId || o.fromSeat === d.seatId).length;
    if (mine === 1 && received === 1) {
      score += 1;
      why.push("accepted the first offer it saw");
    }
    return { seatId: d.seatId, label: d.label, score, why: why.join(" · ") || "a plain deadline — a fair first podium" };
  });
  const order = new Map(CLUBS.map((c, i) => [c.id, i]));
  return scored
    .sort((a, b) => b.score - a.score || order.get(state.desks[a.seatId]!.clubId)! - order.get(state.desks[b.seatId]!.clubId)! || state.desks[a.seatId]!.twin - state.desks[b.seatId]!.twin)
    .map(({ seatId, label, why }) => ({ seatId, label, why }));
}

/* ----------------------------------------------------------------- naming -- */

/**
 * The four D61 naming chains for THE DEADLINE. `means` is the economics —
 * written now. `outside`'s real sports line is a Sports Reality product,
 * researched and dated separately (D2 discipline) — marked REAL EXAMPLE
 * PENDING as a placeholder so it is unmistakable and easy to find and splice
 * in, never invented here.
 */
type Naming = { readonly id: string; readonly term: string; readonly moment: string; readonly means: string; readonly outside: string };

function namings(state: SameLineL3State, profile: GradeProfile): readonly Naming[] {
  const out: Naming[] = [];
  const executed = state.executed;

  if (executed.length > 0) {
    out.push({
      id: "gains-from-trade",
      term: "GAINS FROM TRADE",
      moment: `${executed.length} trade${executed.length === 1 ? "" : "s"} cleared in this room. Both desks had to say yes before either one happened.`,
      means: "A trade only happens when both sides believe they come out ahead of where they started — nobody is forced to click accept. Voluntary exchange can create value even though nothing new was built; it just moved to where it was worth more.",
      outside: "REAL EXAMPLE PENDING — a real trade-deadline deal both front offices defended publicly as a win for their own side.",
    });
  }

  const declines = Object.values(state.desks).flatMap((d) => d.captures.filter((c) => c.kind === "decline"));
  if (declines.length > 0) {
    out.push({
      id: "subjective-value",
      term: "SUBJECTIVE VALUE",
      moment: `At least one desk declined an offer here — "${declines[0]!.chip}." The same package that got turned down by one desk might have been accepted instantly by another.`,
      means: "The same contract is not worth the same amount to every desk — it depends on what job that desk still needs done and what it already has too much of. Price is not a fact stamped on the object; it is what a particular room needs right now.",
      outside: "REAL EXAMPLE PENDING — a real player one team gave up on for almost nothing who filled an exact need somewhere else.",
    });
  }

  out.push({
    id: "rationing",
    term: "RATIONING",
    moment: "Every desk's inbox could hold three live offers, never more. When a fourth arrived, it had nowhere to land until one of the first three was answered.",
    means: "When something people want is limited — an answer, a roster spot, a seat — something has to decide who gets it first. This room used a rule (a cap of three) instead of a price. Rationing is not the exception; every scarce thing gets rationed by something.",
    outside: "REAL EXAMPLE PENDING — a real front office that has publicly described how many live trade conversations it can actually run at once near a deadline.",
  });

  if (profile.maxVariables >= 3) {
    const walled = Object.values(state.desks).filter((d) => d.books.wall !== null);
    if (walled.length > 0) {
      out.push({
        id: "room-constraint",
        term: "ROOM (CONSTRAINT)",
        moment: `${walled.length} desk${walled.length === 1 ? "" : "s"} in this room carried a wall it drew for itself back in July. Today's trade had to fit inside a line decided months earlier.`,
        means: "A constraint set in the past can silently decide what you are allowed to do today, even in a moment that feels completely unrelated to when you set it. The rule did not change between then and now — your room under it did.",
        outside: "REAL EXAMPLE PENDING — a real team whose earlier cap decision is publicly reported to have blocked a specific trade-deadline move.",
      });
    }
  }

  return out;
}

function namingFrame(state: SameLineL3State, profile: GradeProfile): { index: number; count: number; term: string; moment: string; means: string; outside: string } | null {
  const all = namings(state, profile);
  if (all.length === 0) return null;
  const i = Math.max(0, Math.min(state.beat, all.length - 1));
  const n = all[i]!;
  return { index: i, count: all.length, term: n.term, moment: n.moment, means: n.means, outside: n.outside };
}

/* ------------------------------------------------------------------ views -- */

function standingOf(committed: number, band: Band): string {
  void band;
  return bandOf(committed) === "over-apron2" ? "over the second apron" : bandOf(committed) === "under-apron2" ? "over the first apron" : bandOf(committed) === "under-apron1" ? "over the tax line" : bandOf(committed) === "under-tax" ? "over the cap" : "under the cap";
}

function contractView(c: ContractObject) {
  return { id: c.contractId, kind: "contract" as const, name: c.name, role: c.role, annualText: money(c.annual), yearsRemaining: c.yearsRemaining, jobState: c.jobState };
}
function pickView(p: PickObject) {
  return { id: p.pickId, kind: "pick" as const, label: p.label };
}

function offerFacingSeat(o: Offer, seatId: SeatId): { direction: "sent" | "received"; awaitingMe: boolean; counterpartySeat: SeatId } {
  const iAmFrom = o.fromSeat === seatId;
  const counterpartySeat = iAmFrom ? o.toSeat : o.fromSeat;
  const awaitingMe = isOpenOffer(o) && recipientOf(o) === seatId;
  return { direction: iAmFrom ? "sent" : "received", awaitingMe, counterpartySeat };
}

function ownerOfListing(state: SameLineL3State, id: ObjectId): Desk | null {
  for (const d of Object.values(state.desks)) {
    if (d.roster.some((c) => c.contractId === id) || d.picksOwned.some((p) => p.pickId === id)) return d;
  }
  return null;
}

/**
 * Economic Truth ruling: a desk-private count of objects the composer would
 * grey out because of the bars — never surfaced per desk on the board, only
 * summed to one integer there. Bounded to what is actually `listings` (the
 * "ON THE MARKET" set), and probed with this desk's own cheapest single
 * sendable object, so this stays a fixed-size check per listing rather than an
 * all-pairs scan of every object in the room.
 */
function reachBlockedFor(state: SameLineL3State, desk: Desk, profile: GradeProfile): number {
  const mySend = desk.roster.length > 0 ? [...desk.roster].sort((a, b) => a.annual - b.annual)[0]!.contractId : desk.picksOwned[0]?.pickId ?? null;
  if (!mySend) return 0;
  let blocked = 0;
  for (const id of state.listings) {
    const owner = ownerOfListing(state, id);
    if (!owner || owner.seatId === desk.seatId || owner.clubId === desk.clubId) continue;
    if (isEscrowed(state.offers, id) || isEscrowed(state.offers, mySend)) continue;
    if (!checkTrade(toTradeDesk(desk), toTradeDesk(owner), [mySend], [id], profile).ok) blocked += 1;
  }
  return blocked;
}

/** Resolve an object id to its owning desk and the object itself, for building market/offer summaries. */
function findObject(state: SameLineL3State, id: ObjectId): { desk: Desk; object: TradeObject } | null {
  for (const d of Object.values(state.desks)) {
    const c = d.roster.find((x) => x.contractId === id);
    if (c) return { desk: d, object: c };
    const p = d.picksOwned.find((x) => x.pickId === id);
    if (p) return { desk: d, object: p };
  }
  return null;
}

function studentView(state: SameLineL3State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const desk = state.desks[seatId];
  const profile = profileFor(state.gradeBand);
  if (!desk) {
    return { module: SAME_LINE_L3_ID, seated: false, observer: state.observers.includes(seatId), hour: state.hour, marketClosed: state.marketClosed };
  }
  const labelById = (id: ObjectId): string => {
    const found = findObject(state, id);
    return found ? labelOf(found.object) : id;
  };
  const myOffers = Object.values(state.offers)
    .filter((o) => o.fromSeat === seatId || o.toSeat === seatId)
    .map((o) => {
      const facing = offerFacingSeat(o, seatId);
      const isDecliner = o.declinedBy === seatId;
      const counterpartyDesk = state.desks[facing.counterpartySeat];
      return {
        id: o.id,
        state: o.state,
        hour: o.hour,
        direction: facing.direction,
        awaitingMe: facing.awaitingMe,
        // Public, non-seat-identifying key for the counterparty desk — see `holderIdOf`.
        counterpartyId: counterpartyDesk ? holderIdOf(counterpartyDesk) : null,
        counterpartyLabel: counterpartyDesk?.label ?? "a desk",
        sendLabels: o.send.map(labelById),
        wantLabels: o.want.map(labelById),
        countered: o.countered,
        voidNote: o.voidNote,
        // Private forever to the desk that declined it (spec §2).
        declineReason: isDecliner ? o.declineReason : null,
      };
    });
  const settleForMe = state.settled?.perSeat[seatId] ?? null;
  return {
    module: SAME_LINE_L3_ID,
    seated: true,
    label: desk.label,
    club: CLUB[desk.clubId].name,
    hour: state.hour,
    marketClosed: state.marketClosed,
    seedWarning: desk.seedWarning,
    books: {
      committedText: money(desk.books.committed),
      taxSalaryText: money(desk.books.taxSalary),
      wallText: desk.books.wall !== null ? money(desk.books.wall) : null,
      standing: standingOf(desk.books.committed, desk.books.band),
    },
    roster: desk.roster.map(contractView),
    picksOwned: desk.picksOwned.map(pickView),
    picksOwed: desk.picksOwed.map((p) => ({ label: `OWED: your ${p.year} pick (to ${p.toLabel})` })),
    openJobs: desk.openJobs,
    myOffers,
    market: state.listings.map((id) => {
      const found = findObject(state, id);
      const obj = found?.object ?? null;
      return {
        id,
        kind: obj ? obj.kind : "contract",
        label: obj ? labelOf(obj) : id,
        // The two bars a student needs to see BEFORE sending, so the
        // composer can show them, not just the reducer after the fact
        // (spec: the composer dims a card, the reducer is still the only
        // legality authority — this is display data only).
        annualText: obj && isContract(obj) ? money(obj.annual) : null,
        // Public, non-seat-identifying key — never a seat id.
        holderId: found ? holderIdOf(found.desk) : null,
        holderLabel: found?.desk.label ?? "unknown",
        interestCount: Object.values(state.offers).filter((o) => isOpenOffer(o) && (o.send.includes(id) || o.want.includes(id))).length,
      };
    }),
    capturePrompts: { send: profile.band === "5-6" ? SEND_CHIPS_56 : SEND_CHIPS_78, decline: DECLINE_CHIPS, lineWordLimit: profile.band === "5-6" ? 12 : 20 },
    maxObjectsPerSide: profile.maxVariables >= 3 ? 2 : 1,
    /** Desk-private. Never aggregated per-desk on the board — see `boardView`. */
    reachBlocked: reachBlockedFor(state, desk, profile),
    // Own results only — REVEAL/CONSEQUENCE is when the room reads the tape.
    settled: (phase === "REVEAL" || phase === "CONSEQUENCE") && settleForMe ? { coveredJobs: settleForMe.coveredJobs, openJobs: settleForMe.openJobs } : null,
    naming: phase === "SYNTHESIS" || phase === "COMPLETE" ? namingFrame(state, profile) : null,
    phase,
  };
}

function walkToSignals(state: SameLineL3State, desk: Desk): readonly string[] {
  const signals: string[] = [];
  const sentCount = Object.values(state.offers).filter((o) => o.fromSeat === desk.seatId).length;
  if (!state.marketClosed && sentCount === 0) signals.push("NO OFFER SENT");
  const declinedCount = Object.values(state.offers).filter((o) => o.declinedBy === desk.seatId).length;
  if (declinedCount >= 2) signals.push("REFUSED TWICE");
  const receivedLive = Object.values(state.offers).filter((o) => o.toSeat === desk.seatId && o.state === "LIVE").length;
  if (receivedLive >= 3) signals.push("DUMPED ON");
  const twin = Object.values(state.desks).find((d) => d.clubId === desk.clubId && d.seatId !== desk.seatId);
  if (twin) {
    const mine = state.executed.filter((d) => d.fromSeat === desk.seatId || d.toSeat === desk.seatId).length;
    const theirs = state.executed.filter((d) => d.fromSeat === twin.seatId || d.toSeat === twin.seatId).length;
    if (mine !== theirs) signals.push("TWINS DIVERGED");
  }
  const collided = Object.values(state.offers).some((o) => o.state === "VOID_STALE" && o.acceptedBy === desk.seatId && o.voidNote?.startsWith("The books changed. That trade"));
  if (collided) signals.push("MARKET COLLISION");
  return signals;
}

const DIRECTOR_CARDS: Readonly<Partial<Record<CanonicalPhase, string>>> = {
  HOOK: "NOW: read the club situation of the desk with the largest hole, aloud. WATCH FOR: desks who have not opened their roster. DON'T EXPLAIN YET: salary matching. ASK: \"Who has something they don't need?\" TRIGGER: the dated deadline story.",
  PLAY: "NOW: walk, don't talk. WATCH FOR: NO OFFER SENT after 4 minutes; DUMPED ON. DON'T EXPLAIN YET: why an offer was refused. ASK the stuck desk: \"What's the job you still can't fill?\" TRIGGER: FINAL CALL when unresolved() is under three desks.",
  REVEAL: "NOW: read two executed deals off the board, in the room's own numbers. WATCH FOR: the room converging on \"even is fair.\" ASK: \"Both of you said yes. Who won?\" — and refuse to answer it.",
  CONSEQUENCE: "NOW: the twin pair, side by side. WATCH FOR: a desk blaming the dice. ASK: \"Same books in September. What made this different?\"",
  COUNTERFACTUAL: "NOW: private card, everyone writes. TRIGGER: the UNLUCKY GOOD DECISION tape.",
  ARGUE: "ASK the hot seat, deadpan, the decision not the person.",
  SYNTHESIS: "NOW: one name at a time, each opening with what this room did. TRIGGER: nextName.",
};

function teacherView(state: SameLineL3State, phase: CanonicalPhase): unknown {
  const desks = Object.values(state.desks).map((d) => ({
    seatId: d.seatId,
    label: d.label,
    committedText: money(d.books.committed),
    liveOut: Object.values(state.offers).filter((o) => o.fromSeat === d.seatId && o.state === "LIVE").length,
    liveIn: Object.values(state.offers).filter((o) => o.toSeat === d.seatId && o.state === "LIVE").length,
    executed: state.executed.filter((deal) => deal.fromSeat === d.seatId || deal.toSeat === d.seatId).length,
    walkTo: walkToSignals(state, d),
    seedWarning: d.seedWarning,
  }));
  return {
    module: SAME_LINE_L3_ID,
    hour: state.hour,
    marketClosed: state.marketClosed,
    desks,
    directorCard: DIRECTOR_CARDS[phase] ?? "",
    pressCandidates: pressCandidatesFor(state, phase),
    warnings: state.warnings,
    settled: state.settled
      ? Object.values(state.settled.perSeat).map((s) => ({ label: state.desks[s.seatId]?.label ?? s.seatId, coveredJobs: s.coveredJobs, openJobs: s.openJobs, expiringNextSeason: s.expiringNextSeason.map((c) => c.name) }))
      : null,
  };
}

function boardView(state: SameLineL3State, phase: CanonicalPhase): unknown {
  const contracts = new Set<string>();
  const picks = new Set<string>();
  for (const d of Object.values(state.desks)) {
    for (const c of d.roster) contracts.add(c.contractId);
    for (const p of d.picksOwned) picks.add(p.pickId);
  }
  const labelById = (id: ObjectId): { name: string; holderLabel: string } => {
    for (const d of Object.values(state.desks)) {
      const c = d.roster.find((x) => x.contractId === id);
      if (c) return { name: c.name, holderLabel: d.label };
      const p = d.picksOwned.find((x) => x.pickId === id);
      if (p) return { name: p.label, holderLabel: d.label };
    }
    return { name: id, holderLabel: "unknown" };
  };
  const market = state.listings.map((id) => {
    const { name, holderLabel } = labelById(id);
    const interestCount = Object.values(state.offers).filter((o) => isOpenOffer(o) && (o.send.includes(id) || o.want.includes(id))).length;
    return { name, holderLabel, interestCount };
  });
  const executedBroadcast = state.executed.map((d) => {
    const from = state.desks[d.fromSeat];
    const to = state.desks[d.toSeat];
    return {
      hour: d.hour,
      fromLabel: from?.label ?? "a desk",
      toLabel: to?.label ?? "a desk",
      sent: d.send.map((id) => labelById(id).name),
      got: d.want.map((id) => labelById(id).name),
    };
  });
  const profile = profileFor(state.gradeBand);
  // Summed to ONE integer — never per desk (Economic Truth ruling).
  const reachBlocked = Object.values(state.desks).reduce((n, d) => n + reachBlockedFor(state, d, profile), 0);
  return {
    module: SAME_LINE_L3_ID,
    hour: state.hour,
    marketClosed: state.marketClosed,
    market: { contractsOnMarket: contracts.size, picksOnMarket: picks.size, objects: market },
    executedBroadcast,
    reachBlocked,
    seasonSettle: state.settled
      ? Object.values(state.settled.perSeat).map((s) => ({ label: state.desks[s.seatId]?.label ?? s.seatId, coveredJobs: s.coveredJobs, openJobs: s.openJobs, expiringNextSeason: s.expiringNextSeason.map((c) => c.name) }))
      : null,
    naming: phase === "SYNTHESIS" || phase === "COMPLETE" ? namingFrame(state, profile) : null,
    phase,
  };
}

export { toTradeDesk, isEscrowed };
