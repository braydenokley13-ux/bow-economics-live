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
  readonly books: { readonly committed: number; readonly wall: number | null };
};

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
 * R1/R4 — SALARY MATCHING.
 *
 * The honest simplification (spec §3, "the smallest honest simplification"):
 * at 5-6, the tightest true band applies to every desk regardless of position —
 * incoming may never exceed outgoing, full stop, which is the real rule for
 * every over-first-apron team and therefore produces no false positive. At 7-8
 * the ladder loosens the further a desk sits from the aprons: real front
 * offices below the tax line can genuinely take back meaningfully more than
 * they send; a first-apron team cannot. The exact multipliers below are a
 * simplification of the CBA's tiered dollar brackets (§1.4) rather than the
 * brackets themselves — flattened the same way `engine.ts` flattens the tool
 * ladder — and are never rendered as league law.
 */
export function matchingCeiling(outgoingAnnual: number, committedBeforeTrade: number, profile: GradeProfile): number {
  if (profile.band === "5-6") return outgoingAnnual;
  if (outgoingAnnual <= 0) return 0;
  if (committedBeforeTrade < LINE.tax) return Math.round(outgoingAnnual * 1.25 + 250_000);
  if (committedBeforeTrade < LINE.apron1) return Math.round(outgoingAnnual * 1.1);
  return outgoingAnnual;
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

  // R1 — incoming <= what this room's ladder allows, from EACH side's own seat.
  const fromCeiling = matchingCeiling(sendSalary, fromDesk.books.committed, profile);
  if (wantSalary > fromCeiling) {
    return {
      ok: false,
      reason: `You are sending ${money(sendSalary)} and asking for ${money(wantSalary)}. From where you sit you cannot take back more than ${money(fromCeiling)}.`,
    };
  }
  const toCeiling = matchingCeiling(wantSalary, toDesk.books.committed, profile);
  if (sendSalary > toCeiling) {
    return {
      ok: false,
      reason: `They would be sending ${money(wantSalary)} and taking back ${money(sendSalary)}. From where they sit that is more than their books allow.`,
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

  // R2/R3 — the test is post-trade: the wall a desk drew for itself in July.
  const fromAfter = fromDesk.books.committed - sendSalary + wantSalary;
  if (fromDesk.books.wall !== null && fromAfter > fromDesk.books.wall) {
    return {
      ok: false,
      reason: `You drew a wall at ${money(fromDesk.books.wall)} back in July. This trade would take you past it, and you may not cross it for any reason.`,
    };
  }
  const toAfter = toDesk.books.committed - wantSalary + sendSalary;
  if (toDesk.books.wall !== null && toAfter > toDesk.books.wall) {
    return {
      ok: false,
      reason: `They drew a wall at ${money(toDesk.books.wall)} back in July. This trade would take them past it.`,
    };
  }

  // R4 — aggregation (7-8 only, but harmless to check at 5-6 since send/want
  // are already capped at one object there). Two outgoing contracts may be
  // combined unless the trade leaves that desk above the second apron.
  if (send.length === 2 && fromAfter > LINE.apron2) {
    return { ok: false, reason: `Sending two contracts at once would leave you at ${money(fromAfter)} — past the second apron. You may not aggregate into that.` };
  }
  if (want.length === 2 && toAfter > LINE.apron2) {
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
