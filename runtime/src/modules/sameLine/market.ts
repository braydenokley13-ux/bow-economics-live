/**
 * MODULE 1 · LESSON 3 — "THE DEADLINE" — THE MARKET.
 *
 * Pure functions. No state, no clock, no randomness, no I/O — same discipline as
 * `engine.ts` (L1), for the same reason: a sweep has to be able to enumerate the
 * whole reachable trade space without booting a server, and the reducer, the
 * student composer, the teacher panel and the sweep must never be able to
 * disagree about what is legal or how a contested hour resolves.
 *
 * EXACTLY TWO TRADEABLE OBJECT TYPES (spec §2, D59 ruling 1): a `contract` this
 * room signed in Week 1 or Week 2, and a franchise's own two future draft picks
 * at `$0`. An incumbent NBA player on a club's opening books is never an object
 * here — it never enters a `roster`/`picksOwned` array in the first place, so
 * there is nothing to accidentally make tradeable. A waived contract is dead
 * money, not an asset, for the same reason: it is removed from `roster` before
 * this file ever sees it.
 *
 * THE ONE LEGALITY PREDICATE. `checkTrade` is the only place that decides
 * whether a package is legal. The composer dims a card with it, the reducer
 * refuses a `propose`/`counter` with it, and the sweep enumerates with it. A
 * second copy anywhere is how a product tells a student a trade is legal and
 * then refuses it after the click — the exact defect NBA_TRADE_TRUTH's "one
 * thing NOT to simplify" names.
 */
import { CLUBS, LINE, ROSTER, type ClubId, type JobRole } from "./world.js";
import { money } from "./engine.js";
import type { GradeProfile } from "../../shared/gradeBand.js";

/* ------------------------------------------------------------- objects -- */

export type JobState = "DOES_JOB" | "MORE_THAN_JOB" | "DOES_NOT_DO_JOB";

export type ContractObject = {
  readonly kind: "contract";
  readonly contractId: string;
  readonly playerId: string;
  readonly name: string;
  readonly role: JobRole;
  readonly annual: number;
  readonly yearsRemaining: number;
  readonly jobState: JobState;
  /** 1 = signed in Week 1/2 and carried in; 3 = acquired in this room's own market. */
  readonly acquiredWeek: 1 | 2 | 3;
};

export type PickObject = {
  readonly kind: "pick";
  readonly pickId: string;
  readonly year: number;
  readonly round: 1 | 2;
  /** "2029 first" — the permanent label, never renamed once a desk owns it (spec §2). */
  readonly label: string;
};

export type TradeObject = ContractObject | PickObject;
export type ObjectId = string;

export const isContract = (o: TradeObject): o is ContractObject => o.kind === "contract";
export const isPick = (o: TradeObject): o is PickObject => o.kind === "pick";
export const objectId = (o: TradeObject): ObjectId => (isContract(o) ? o.contractId : o.pickId);
export const salaryOf = (o: TradeObject): number => (isContract(o) ? o.annual : 0);
export const sumSalary = (os: readonly TradeObject[]): number => os.reduce((n, o) => n + salaryOf(o), 0);

/* ---------------------------------------------------------------- desk -- */

/**
 * The minimal shape this file needs from a desk. `l3.ts`'s real `Desk` is
 * richer (captures, evidence, label) and satisfies this structurally rather
 * than importing it — keeping this file dependency-free of the reducer.
 */
export type TradeDeskLike = {
  readonly seatId: string;
  readonly clubId: ClubId;
  readonly twin: 0 | 1;
  readonly roster: readonly ContractObject[];
  readonly picksOwned: readonly PickObject[];
  /**
   * `committed` is the cap POSITION (cap hit, holds included) — what a desk's
   * own screen shows and what `DeadlineCarry` reports onward. `holds` is the
   * free-agent cap holds baked into that figure. Every apron/wall test below
   * runs on APRON TEAM SALARY = `committed - holds` (cbaguide.com/thresholds/
   * apron, read 2026-09-03), never on raw `committed` — a desk carrying real
   * holds (Detroit carries $28,834,548 of them, `world.ts`/`carry.ts`) would
   * otherwise be tested against a line it is not actually near. A hold is not
   * a dollar paid to anyone; it is cap reserved for a free agent this desk has
   * not yet re-signed, and the real CBA does not count it against the aprons.
   */
  readonly books: { readonly committed: number; readonly holds: number; readonly wall: number | null };
};

/** APRON TEAM SALARY — the figure every apron/wall line in this file tests against. */
export const apronSalaryOf = (committed: number, holds: number): number => committed - holds;

function ownedObject(desk: TradeDeskLike, id: ObjectId): TradeObject | null {
  const contract = desk.roster.find((c) => c.contractId === id);
  if (contract) return contract;
  const pick = desk.picksOwned.find((p) => p.pickId === id);
  return pick ?? null;
}

/** Resolve every id against one desk's own books, or null if any is not theirs. */
export function resolveOwned(desk: TradeDeskLike, ids: readonly ObjectId[]): readonly TradeObject[] | null {
  const out: TradeObject[] = [];
  for (const id of ids) {
    const found = ownedObject(desk, id);
    if (!found) return null;
    out.push(found);
  }
  return out;
}

/* ------------------------------------------------------------ legality -- */

export type Legality = { readonly ok: true } | { readonly ok: false; readonly reason: string };

/**
 * R1 — SALARY MATCHING, THE ROOM-ABSORPTION RULE.
 *
 * REPLACES an earlier draft that applied "incoming <= outgoing" to BOTH sides
 * of every trade. That draft was economically dead: for two desks A and B,
 * incoming_A <= outgoing_A and incoming_B <= outgoing_B, with incoming_A ==
 * outgoing_B and incoming_B == outgoing_A, together force outgoing_A ==
 * outgoing_B — every legal trade had to be dollar-for-dollar exact. Swept over
 * this room's 14 distinct contract salaries, that cleared nothing: no desk had
 * a partner whose salary matched to the dollar (Economic Truth review finding,
 * recorded here rather than only in a run log).
 *
 * THE FIX. A desk's OUT BAR is what it may receive: the salary it sends, PLUS
 * whatever cap room it still has once that salary has left —
 *
 *   outBar = sent + max(0, CAP - (committedBeforeTrade - sent))
 *
 * — and a trade is legal on this desk's side iff incoming <= outBar. A desk
 * already at or past the cap even after sending has zero room, so its bar
 * collapses to `sent` — the real 100%-matching rule for a taxpayer, recovered
 * as a special case rather than assumed everywhere. A desk with real room
 * absorbs real money: Memphis (committed $161,034,793) sending a $2,900,000
 * contract has $6,826,207 of room once that salary is gone, an OUT bar of
 * $9,726,207, and can legally take back Kuminga's $6,064,000 — a trade the
 * dollar-exact draft could never have allowed, and a real one (room absorbing
 * an incoming salary is the ordinary case in actual NBA trades). This is what
 * a pick-for-contract trade needs too: a $0 pick sent by a room-rich desk has
 * an OUT bar equal to that desk's room alone, so "contract for pick" is legal
 * exactly in the direction the receiving desk can actually absorb it.
 *
 * KEYED ON RAW `committed`, never apron-team-salary — cap room is a CAP
 * concept (a hold occupies room, same as real cap accounting) even though the
 * APRON tests two functions down key on `committed - holds` instead.
 *
 * THE SIMPLIFICATION, NAMED. The real CBA's matching bands for teams already
 * over the cap are not flat 100% — they step up to 125%/200% the further below
 * the tax line a team sits (§1.4's tiered brackets). Flattening every
 * over-the-cap desk to exact 100% (this function's `sent` floor) is the
 * smallest honest simplification available: it can only make a real trade
 * ILLEGAL here that the league would allow, never the reverse, so it produces
 * no false positive. The misconception it is written to avoid is the sharper
 * one: a version that ignored room entirely taught "cap room is worthless in
 * a trade," which is backwards — room is exactly what lets a team spend BOTH
 * on the summer market and at the deadline.
 */
export function outBar(committedBeforeTrade: number, sentSalary: number): number {
  const afterSendingOnly = committedBeforeTrade - sentSalary;
  const roomAfter = Math.max(0, LINE.cap - afterSendingOnly);
  return sentSalary + roomAfter;
}

const maxObjectsPerSide = (profile: GradeProfile): 1 | 2 => (profile.maxVariables >= 3 ? 2 : 1);

/**
 * THE ONE LEGALITY PREDICATE. Every rule in spec §3 that is testable from the
 * package alone, in the order a desk would hit them. R7 (the league office
 * still has to execute) and R8's "no route around it" guarantee (a counter
 * cannot manufacture a twin deal — checked again by the reducer) live outside
 * this function because they are about the OFFER lifecycle, not the package.
 */
export function checkTrade(
  fromDesk: TradeDeskLike,
  toDesk: TradeDeskLike,
  send: readonly ObjectId[],
  want: readonly ObjectId[],
  profile: GradeProfile,
): Legality {
  // R8 — twins never transact, by any route. A BOW rule, not an NBA rule.
  if (fromDesk.clubId === toDesk.clubId) {
    return {
      ok: false,
      reason: "These two front offices started from the same books. In this room they don't deal with each other.",
    };
  }
  if (send.length === 0 || want.length === 0) {
    return { ok: false, reason: "A trade needs something leaving and something coming back." };
  }
  const maxSide = maxObjectsPerSide(profile);
  if (send.length > maxSide) return { ok: false, reason: `You may only send up to ${maxSide} thing${maxSide === 1 ? "" : "s"} in one trade.` };
  if (want.length > maxSide) return { ok: false, reason: `You may only ask for up to ${maxSide} thing${maxSide === 1 ? "" : "s"} in one trade.` };

  const sendObjects = resolveOwned(fromDesk, send);
  if (!sendObjects) return { ok: false, reason: "Something in WHAT I SEND is not on your own books." };
  const wantObjects = resolveOwned(toDesk, want);
  if (!wantObjects) return { ok: false, reason: "Something in WHAT I WANT is not on their books." };

  const sendSalary = sumSalary(sendObjects);
  const wantSalary = sumSalary(wantObjects);
  const sendContracts = sendObjects.filter(isContract).length;
  const wantContracts = wantObjects.filter(isContract).length;

  // APRON TEAM SALARY — never raw `committed`. Used only by the wall/apron2
  // tests below; the room-absorption matching rule keys on raw `committed`.
  const fromApronBefore = apronSalaryOf(fromDesk.books.committed, fromDesk.books.holds);
  const toApronBefore = apronSalaryOf(toDesk.books.committed, toDesk.books.holds);

  // R1 — the room-absorption rule, from EACH side's own seat.
  const fromBar = outBar(fromDesk.books.committed, sendSalary);
  if (wantSalary > fromBar) {
    return {
      ok: false,
      reason: `You are sending ${money(sendSalary)} and asking for ${money(wantSalary)}. Between that and your own room, you cannot take back more than ${money(fromBar)}.`,
    };
  }
  const toBar = outBar(toDesk.books.committed, wantSalary);
  if (sendSalary > toBar) {
    return {
      ok: false,
      reason: `They would be sending ${money(wantSalary)} and taking back ${money(sendSalary)}. Between that and their own room, that is more than their books allow.`,
    };
  }

  // R6 — roster slots, in season (ROSTER.min..ROSTER.max).
  const fromCount = fromDesk.roster.length - sendContracts + wantContracts;
  const toCount = toDesk.roster.length - wantContracts + sendContracts;
  if (fromCount < ROSTER.min || fromCount > ROSTER.max) {
    return { ok: false, reason: `This would leave you with ${fromCount} players under contract. A roster has to stay between ${ROSTER.min} and ${ROSTER.max}.` };
  }
  if (toCount < ROSTER.min || toCount > ROSTER.max) {
    return { ok: false, reason: `This would leave them with ${toCount} players under contract. A roster has to stay between ${ROSTER.min} and ${ROSTER.max}.` };
  }

  // R2/R3 — the test is post-trade, on APRON TEAM SALARY: the wall a desk drew
  // for itself in July, tested against committed-minus-holds, never raw
  // committed (a hold is cap reserved for nobody on this roster yet, and the
  // real aprons do not count it).
  const fromApronAfter = fromApronBefore - sendSalary + wantSalary;
  if (fromDesk.books.wall !== null && fromApronAfter > fromDesk.books.wall) {
    return {
      ok: false,
      reason: `You drew a wall at ${money(fromDesk.books.wall)} back in July. This trade would take you past it, and you may not cross it for any reason.`,
    };
  }
  const toApronAfter = toApronBefore - wantSalary + sendSalary;
  if (toDesk.books.wall !== null && toApronAfter > toDesk.books.wall) {
    return {
      ok: false,
      reason: `They drew a wall at ${money(toDesk.books.wall)} back in July. This trade would take them past it.`,
    };
  }

  // R4 — aggregation (7-8 only, but harmless to check at 5-6 since send/want
  // are already capped at one object there). Two outgoing contracts may be
  // combined unless the trade leaves that desk above the second apron, tested
  // on apron team salary.
  if (send.length === 2 && fromApronAfter > LINE.apron2) {
    return { ok: false, reason: `Sending two contracts at once would leave you at ${money(fromApronAfter)} against the aprons — past the second apron. You may not aggregate into that.` };
  }
  if (want.length === 2 && toApronAfter > LINE.apron2) {
    return { ok: false, reason: "They would land past the second apron if they sent both of those back at once." };
  }

  return { ok: true };
}

/* ---------------------------------------------------- counter validity -- */

/**
 * R (counter rule, spec §2) — a counter may change exactly one piece: swap one
 * requested object, or add/remove one `$0` pick. Compared against the ORIGINAL
 * package as a multiset over both `send` and `want` combined, because a
 * legally distinct counter is one where exactly one object came out and at most
 * one came back.
 */
export function isOneChange(
  originalSend: readonly ObjectId[],
  originalWant: readonly ObjectId[],
  nextSend: readonly ObjectId[],
  nextWant: readonly ObjectId[],
  isPickId: (id: ObjectId) => boolean,
): boolean {
  const before = [...originalSend, ...originalWant];
  const after = [...nextSend, ...nextWant];
  const removed = before.filter((id) => !after.includes(id));
  const added = after.filter((id) => !before.includes(id));
  if (removed.length === 1 && added.length === 1) return true; // swap one requested object
  if (removed.length === 1 && added.length === 0) return isPickId(removed[0]!); // remove one pick
  if (removed.length === 0 && added.length === 1) return isPickId(added[0]!); // add one pick
  return false;
}

/* --------------------------------------------------------- contest -- */

/**
 * §2's sealed, deterministic settle for an hour where more than one accepted
 * offer lands on the same accepting desk. Order is fixed and printed before the
 * click, never a function of arrival time (froth §5; D59 retires the
 * arrival-time tie-break as a defect):
 *
 *   1. the deal that fills an open job the accepting desk actually holds;
 *   2. then the deal with the larger outgoing salary from the accepting desk;
 *   3. then world club order (`clubOrder`), then twin index 0 before 1.
 *
 * Pure and order-independent: the caller may pass the group in any order and
 * the result is identical, which is what makes "reordering the same actions
 * produces the same settle" (spec §13 test 15) provable.
 */
export type ContestEntry = {
  readonly offerId: string;
  readonly acceptedBy: string;
  readonly counterpartyClubId: ClubId;
  readonly counterpartyTwin: 0 | 1;
  readonly fillsOpenJob: boolean;
  readonly outgoingSalaryFromAccepting: number;
};

export function resolveContested(entries: readonly ContestEntry[], clubOrder: readonly ClubId[] = CLUBS.map((c) => c.id)): {
  readonly clears: readonly string[];
  readonly voided: readonly string[];
} {
  const order = new Map(clubOrder.map((c, i) => [c, i]));
  const byAccepting = new Map<string, ContestEntry[]>();
  for (const e of entries) byAccepting.set(e.acceptedBy, [...(byAccepting.get(e.acceptedBy) ?? []), e]);

  const clears: string[] = [];
  const voided: string[] = [];
  // Sorted seat keys so the walk itself never depends on insertion order.
  for (const seatId of [...byAccepting.keys()].sort()) {
    const group = byAccepting.get(seatId)!;
    const ranked = [...group].sort(
      (a, b) =>
        Number(b.fillsOpenJob) - Number(a.fillsOpenJob) ||
        b.outgoingSalaryFromAccepting - a.outgoingSalaryFromAccepting ||
        (order.get(a.counterpartyClubId) ?? 999) - (order.get(b.counterpartyClubId) ?? 999) ||
        a.counterpartyTwin - b.counterpartyTwin ||
        (a.offerId < b.offerId ? -1 : 1),
    );
    clears.push(ranked[0]!.offerId);
    for (const r of ranked.slice(1)) voided.push(r.offerId);
  }
  return { clears, voided };
}

/* ------------------------------------------------------------- execute -- */

export type TradeEffect = {
  readonly from: { readonly roster: readonly ContractObject[]; readonly picksOwned: readonly PickObject[]; readonly committed: number; readonly taxSalary: number };
  readonly to: { readonly roster: readonly ContractObject[]; readonly picksOwned: readonly PickObject[]; readonly committed: number; readonly taxSalary: number };
};

/**
 * Transfer the named objects between two desks' books. Pure: takes the two
 * desks' current roster/pick arrays and cap/tax figures and returns the four
 * new arrays plus the two new figures — never mutates its inputs, and never
 * looks at anything the caller did not pass in (no offers, no clock).
 */
export function applyTrade(
  fromDesk: { roster: readonly ContractObject[]; picksOwned: readonly PickObject[]; committed: number; taxSalary: number },
  toDesk: { roster: readonly ContractObject[]; picksOwned: readonly PickObject[]; committed: number; taxSalary: number },
  send: readonly ObjectId[],
  want: readonly ObjectId[],
  acquiredWeek: 3,
): TradeEffect {
  const sendSet = new Set(send);
  const wantSet = new Set(want);
  const sentContracts = fromDesk.roster.filter((c) => sendSet.has(c.contractId));
  const sentPicks = fromDesk.picksOwned.filter((p) => sendSet.has(p.pickId));
  const gotContracts = toDesk.roster.filter((c) => wantSet.has(c.contractId));
  const gotPicks = toDesk.picksOwned.filter((p) => wantSet.has(p.pickId));

  const sentSalary = sumSalary(sentContracts);
  const gotSalary = sumSalary(gotContracts);

  const stampReceived = (c: ContractObject): ContractObject => ({ ...c, acquiredWeek });

  return {
    from: {
      roster: [...fromDesk.roster.filter((c) => !sendSet.has(c.contractId)), ...gotContracts.map(stampReceived)],
      picksOwned: [...fromDesk.picksOwned.filter((p) => !sendSet.has(p.pickId)), ...gotPicks],
      committed: fromDesk.committed - sentSalary + gotSalary,
      taxSalary: fromDesk.taxSalary - sentSalary + gotSalary,
    },
    to: {
      roster: [...toDesk.roster.filter((c) => !wantSet.has(c.contractId)), ...sentContracts.map(stampReceived)],
      picksOwned: [...toDesk.picksOwned.filter((p) => !wantSet.has(p.pickId)), ...sentPicks],
      committed: toDesk.committed - gotSalary + sentSalary,
      taxSalary: toDesk.taxSalary - gotSalary + sentSalary,
    },
  };
}

export { money };
