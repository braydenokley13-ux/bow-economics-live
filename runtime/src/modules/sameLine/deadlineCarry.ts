/**
 * WHAT LEAVES THE DEADLINE.
 *
 * The Week 3→4 half of the same seam `carry.ts` draws for Week 1: the reading
 * of THE DEADLINE's own raw state, written once, on the source side, so Week
 * 4 (and anything else that ever links this room) never has to re-derive it.
 * Nothing here trusts the envelope — a seed is untrusted input exactly as in
 * `carry.ts`: a room linked before it finished, a room from the other band
 * (BC-18), a hand-edited snapshot, an older build. Every field is checked,
 * every bad desk is dropped WITH A REASON the teacher can read, and one bad
 * record never costs the room the rest of its classmates.
 *
 * spec §7 "Seed OUT" is the source of truth for what this carries, PLUS one
 * addition: `holds`. The binding ruling that every apron/wall test in
 * `market.ts` runs on `committed - holds` (never raw `committed`) means Week
 * 4's own apron determination needs the same figure to stay honest — carrying
 * `committed` alone without `holds` would silently hand Week 4 a number it
 * cannot correctly test a wall against. Everything else matches the spec list
 * exactly: `taxSalary` is the Week-2 figure plus every annual received minus
 * every annual sent, executed deals only; `deadMoney` is unchanged by trades
 * (a stated simplification — true unless a waiver follows, spec §7); `roster`
 * is post-deadline with years remaining; `picksOwed` names the label the pick
 * belongs to now, in words, never a number going down.
 */
import type { GradeBand } from "../../shared/gradeBand.js";
import { isGradeBand } from "../../shared/gradeBand.js";
import { SAME_LINE_L3_ID } from "./l3.js";
import { bandOf, CLUB, CLUBS, PAYROLL_DEFINITION, LINE, type Band, type ClubId, type JobRole } from "./world.js";

/** Bumped when the record below changes shape. A receiver refuses a version it does not know. */
export const DEADLINE_CARRY_VERSION = 1;

export type JobStateLabel = "DOES_JOB" | "MORE_THAN_JOB" | "DOES_NOT_DO_JOB";

export type CarriedDeadlineRosterEntry = {
  readonly contractId: string;
  readonly playerId: string;
  readonly name: string;
  readonly role: JobRole;
  readonly annual: number;
  readonly yearsRemaining: number;
  readonly jobState: JobStateLabel;
  readonly acquiredWeek: 1 | 2 | 3;
};

export type CarriedDeadlinePick = { readonly pickId: string; readonly year: number; readonly round: 1 | 2; readonly label: string };
export type CarriedDeadlineOwed = { readonly pickId: string; readonly year: number; readonly toLabel: string };

export type CarriedDeadlineFranchise = {
  readonly sourceSeatId: string;
  readonly clubId: ClubId;
  readonly club: string;
  readonly city: string;
  readonly label: string;
  readonly twin: 0 | 1;
  /* ---- STATE: changes a later computation ---- */
  readonly committed: number;
  readonly taxSalary: number;
  readonly deadMoney: number;
  /** Not in the spec's literal §7 list — added because the apron ruling needs it. See file docstring. */
  readonly holds: number;
  readonly wall: number | null;
  readonly openJobs: readonly JobRole[];
  readonly roster: readonly CarriedDeadlineRosterEntry[];
  readonly picksOwned: readonly CarriedDeadlinePick[];
  readonly picksOwed: readonly CarriedDeadlineOwed[];
  readonly band: Band;
  /* ---- EVIDENCE: shown to a human, never read by a reducer ---- */
  readonly evidence: readonly string[];
};

export type DeadlineCarry =
  | {
      readonly ok: true;
      readonly version: typeof DEADLINE_CARRY_VERSION;
      readonly gradeBand: GradeBand;
      readonly sourceSessionId: string | null;
      readonly sourceEnded: boolean;
      readonly franchises: readonly CarriedDeadlineFranchise[];
      readonly warnings: readonly string[];
      readonly payrollDefinition: string;
      readonly lines: Readonly<Record<"floor" | "cap" | "tax" | "apron1" | "apron2", number>>;
    }
  | { readonly ok: false; readonly reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isMoney = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1_000_000_000;
const isClubId = (v: unknown): v is ClubId => typeof v === "string" && CLUBS.some((c) => c.id === v);
const JOB_ROLES: readonly string[] = ["BIG", "WING", "GUARD"];
const JOB_STATES: readonly string[] = ["DOES_JOB", "MORE_THAN_JOB", "DOES_NOT_DO_JOB"];

function readRoster(v: unknown): readonly CarriedDeadlineRosterEntry[] | null {
  if (!Array.isArray(v)) return null;
  const out: CarriedDeadlineRosterEntry[] = [];
  for (const r of v) {
    if (!isRecord(r)) return null;
    const { contractId, playerId, name, role, annual, yearsRemaining, jobState, acquiredWeek } = r;
    if (typeof contractId !== "string" || typeof playerId !== "string" || typeof name !== "string" || !name) return null;
    if (typeof role !== "string" || !JOB_ROLES.includes(role)) return null;
    if (!isMoney(annual)) return null;
    if (typeof yearsRemaining !== "number" || !Number.isInteger(yearsRemaining) || yearsRemaining < 0 || yearsRemaining > 6) return null;
    if (typeof jobState !== "string" || !JOB_STATES.includes(jobState)) return null;
    if (acquiredWeek !== 1 && acquiredWeek !== 2 && acquiredWeek !== 3) return null;
    out.push({ contractId, playerId, name, role: role as JobRole, annual, yearsRemaining, jobState: jobState as JobStateLabel, acquiredWeek });
  }
  return out;
}

function readPicks(v: unknown): readonly CarriedDeadlinePick[] | null {
  if (!Array.isArray(v)) return null;
  const out: CarriedDeadlinePick[] = [];
  for (const p of v) {
    if (!isRecord(p)) return null;
    const { pickId, year, round, label } = p;
    if (typeof pickId !== "string" || typeof year !== "number" || (round !== 1 && round !== 2) || typeof label !== "string") return null;
    out.push({ pickId, year, round, label });
  }
  return out;
}

function readOwed(v: unknown): readonly CarriedDeadlineOwed[] {
  if (!Array.isArray(v)) return [];
  const out: CarriedDeadlineOwed[] = [];
  for (const p of v) {
    if (!isRecord(p)) continue;
    const { pickId, year, toLabel } = p;
    if (typeof pickId !== "string" || typeof year !== "number" || typeof toLabel !== "string") continue;
    out.push({ pickId, year, toLabel });
  }
  return out;
}

function readEvidence(v: unknown): readonly string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/** Read one desk. Returns the record, or the one-line reason it was dropped. */
function readDesk(seatId: string, v: unknown): { franchise: CarriedDeadlineFranchise } | { dropped: string } {
  if (!isRecord(v)) return { dropped: `${seatId}: not a desk record` };
  if (!isClubId(v["clubId"])) return { dropped: `${seatId}: club "${String(v["clubId"])}" is not one of this world's clubs` };
  const clubId = v["clubId"];
  const club = CLUB[clubId];
  const twin = v["twin"] === 1 ? 1 : v["twin"] === 0 ? 0 : null;
  if (twin === null) return { dropped: `${club.name}: desk has no twin index` };
  const label = typeof v["label"] === "string" && v["label"] ? v["label"] : `${club.name} ${twin === 0 ? "A" : "B"}`;
  const books = v["books"];
  if (!isRecord(books)) return { dropped: `${label}: desk has no books` };
  if (!isMoney(books["committed"])) return { dropped: `${label}: committed payroll is not a money amount` };
  if (!isMoney(books["taxSalary"])) return { dropped: `${label}: taxSalary is not a money amount` };
  const committed = books["committed"];
  const taxSalary = books["taxSalary"];
  const deadMoney = isMoney(books["deadMoney"]) ? books["deadMoney"] : 0;
  const holds = isMoney(books["holds"]) ? books["holds"] : 0;
  const wall = typeof books["wall"] === "number" ? books["wall"] : null;
  const openJobs = Array.isArray(v["openJobs"]) ? v["openJobs"].filter((j): j is JobRole => typeof j === "string" && JOB_ROLES.includes(j)) : null;
  if (!openJobs) return { dropped: `${label}: open jobs are missing` };
  const roster = readRoster(v["roster"]);
  if (!roster) return { dropped: `${label}: a roster record is malformed` };
  const picksOwned = readPicks(v["picksOwned"]);
  if (!picksOwned) return { dropped: `${label}: a pick record is malformed` };
  return {
    franchise: {
      sourceSeatId: seatId,
      clubId,
      club: club.name,
      city: club.city,
      label,
      twin,
      committed,
      taxSalary,
      deadMoney,
      holds,
      wall,
      openJobs,
      roster,
      picksOwned,
      picksOwed: readOwed(v["picksOwed"]),
      band: bandOf(committed),
      evidence: readEvidence(v["evidence"]),
    },
  };
}

/**
 * Read a seed envelope as THE DEADLINE's carry. `receivingBand` is the band of
 * the room being created — a carry from the other band is refused outright
 * (BC-18), the same guarantee `extractWindowCarry` makes for Week 1.
 */
export function extractDeadlineCarry(seed: unknown, receivingBand: GradeBand): DeadlineCarry {
  if (seed === undefined || seed === null) return { ok: false, reason: "no source session was linked" };
  if (!isRecord(seed)) return { ok: false, reason: "the seed is not an envelope" };
  if (seed["lessonModuleId"] !== SAME_LINE_L3_ID) {
    return { ok: false, reason: `the linked session is "${String(seed["lessonModuleId"])}", not ${SAME_LINE_L3_ID}` };
  }
  const state = seed["state"];
  if (!isRecord(state)) return { ok: false, reason: "the linked session carries no state" };
  const sourceBand = isGradeBand(seed["sourceGradeBand"]) ? seed["sourceGradeBand"] : isGradeBand(state["gradeBand"]) ? state["gradeBand"] : null;
  if (sourceBand === null) return { ok: false, reason: "the linked session has no grade band stamped on it" };
  if (sourceBand !== receivingBand) {
    return { ok: false, reason: `the linked session is a grades ${sourceBand} room and this is a grades ${receivingBand} room` };
  }
  const desks = state["desks"];
  if (!isRecord(desks)) return { ok: false, reason: "the linked session has no desks" };

  const warnings: string[] = [];
  const sourceEnded = seed["sourceEnded"] === true;
  const marketClosed = state["marketClosed"] === true;
  if (!marketClosed) {
    warnings.push(
      "The linked deadline room had not closed when this room was created. Every desk arrives with whatever it held at that instant; nothing that happens in that room later reaches here.",
    );
  } else if (!sourceEnded) {
    warnings.push("The linked deadline room closed but the lesson had not ended. The books are final; the season settle and naming may not have been shown.");
  }
  if (state["settled"] === null || state["settled"] === undefined) {
    warnings.push("The linked room's season had not settled. Job states carried forward are whatever this room's roster held at the deadline, not a settled result.");
  }

  const franchises: CarriedDeadlineFranchise[] = [];
  for (const [seatId, v] of Object.entries(desks)) {
    const read = readDesk(seatId, v);
    if ("dropped" in read) {
      warnings.push(`Dropped: ${read.dropped}. That desk gets a stock franchise here, and the console says so.`);
      continue;
    }
    franchises.push(read.franchise);
  }
  const order = new Map(CLUBS.map((c, i) => [c.id, i]));
  franchises.sort((a, b) => (order.get(a.clubId)! - order.get(b.clubId)!) || a.twin - b.twin);

  return {
    ok: true,
    version: DEADLINE_CARRY_VERSION,
    gradeBand: receivingBand,
    sourceSessionId: typeof seed["sourceSessionId"] === "string" ? seed["sourceSessionId"] : null,
    sourceEnded,
    franchises,
    warnings,
    payrollDefinition: PAYROLL_DEFINITION,
    lines: { floor: LINE.floor, cap: LINE.cap, tax: LINE.tax, apron1: LINE.apron1, apron2: LINE.apron2 },
  };
}
