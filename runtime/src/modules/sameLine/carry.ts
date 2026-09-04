/**
 * WHAT LEAVES THE WINDOW.
 *
 * The runtime's one hook for continuity is the opaque seed: at createSession it
 * copies the source session's `state` into an envelope with provenance and hands
 * it to the receiving module's `initialState`. Only the receiving module knows
 * what a `m1l1-the-window` state means — and every receiving module (THE
 * SEASON, THE DEADLINE, THE BILL COMES DUE) would otherwise re-derive the same
 * shape from the same raw state. So the reading is written ONCE, here, on the
 * source side, and every receiver calls it. This is a thin extension earned by
 * real cross-lesson use (CLAUDE.md §12), not a franchise database.
 *
 * ARC_DESIGN.md §2 draws the line: anything that changes a later computation
 * carries as STATE (the commitments, the line position, the jobs still open);
 * anything only ever shown to a human carries as EVIDENCE (the frozen forgone
 * lists). Both are in the record below, and the record says which is which.
 *
 * Nothing here trusts the envelope. A seed is untrusted input: a room linked
 * before it finished (D39), a room from the other band (BC-18), a snapshot
 * written by an older build, a hand-edited file. Every field is checked, every
 * bad desk is dropped WITH A REASON the teacher can read, and a good classmate
 * is never lost because one record was bad.
 */
import type { GradeBand } from "../../shared/gradeBand.js";
import { isGradeBand } from "../../shared/gradeBand.js";
import type { Signing } from "./engine.js";
import { SAME_LINE_L1_ID, type ForgoneRecord } from "./l1.js";
import { bandOf, CLUB, CLUBS, LINE, PAYROLL_DEFINITION, type Band, type ClubId, type JobRole, type ToolId } from "./world.js";

/** Bumped when the record below changes shape. A receiver refuses a version it does not know. */
export const WINDOW_CARRY_VERSION = 1;

export type CarriedFranchise = {
  /** The seat that held this desk in the source room. Never a student identity. */
  readonly sourceSeatId: string;
  readonly clubId: ClubId;
  readonly club: string;
  readonly city: string;
  /** "Memphis A" / "Memphis B". Two desks may hold one club (D59 ruling 1). */
  readonly label: string;
  readonly twin: 0 | 1;
  /* ---- STATE: changes a later computation ---- */
  /** Cap hit including holds and dead money, after the window (BC-7). */
  readonly committed: number;
  /** The club's own dead money, unchanged by the window. */
  readonly deadMoney: number;
  /** Free-agent cap holds inside `committed` — paid to nobody. */
  readonly holds: number;
  /**
   * The part of the club's opening cap hit that neither the roster, dead money
   * nor the holds account for (camp and roster charges the source does not
   * label). Named so a later week can print it as a line, never fold it in.
   */
  readonly unattributed: number;
  /**
   * TAX SALARY: what the tax and every cash bill are charged on — the club's
   * sourced active-roster-plus-dead-money figure, plus every dollar this desk
   * signed in the window (W4_BILL_RESEARCH §8). A receiving module computes
   * DOLLARS from this and shows cap POSITION from `committed`; mixing them
   * charges a club cash for an empty chair.
   */
  readonly taxSalary: number;
  readonly band: Band;
  readonly openJobs: readonly JobRole[];
  readonly signings: readonly Signing[];
  readonly overCapDeclared: boolean;
  readonly wall: number | null;
  readonly toolsSpent: readonly ToolId[];
  /* ---- EVIDENCE: shown to a human, never read by a reducer ---- */
  readonly forgone: readonly ForgoneRecord[];
};

export type WindowCarry =
  | {
      readonly ok: true;
      readonly version: typeof WINDOW_CARRY_VERSION;
      readonly gradeBand: GradeBand;
      readonly sourceSessionId: string | null;
      readonly sourceEnded: boolean;
      readonly franchises: readonly CarriedFranchise[];
      /** Per-desk drops and envelope caveats, in teacher-readable words. */
      readonly warnings: readonly string[];
      readonly payrollDefinition: string;
      readonly lines: Readonly<Record<"floor" | "cap" | "tax" | "apron1" | "apron2", number>>;
    }
  | { readonly ok: false; readonly reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isMoney = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1_000_000_000;
const isClubId = (v: unknown): v is ClubId => typeof v === "string" && CLUBS.some((c) => c.id === v);
const JOB_ROLES: readonly string[] = ["BIG", "WING", "GUARD"];
const TOOL_IDS: readonly string[] = ["room", "ntmle", "roomMle", "taxMle", "bae", "minimum", "bird"];

function readSigning(v: unknown): Signing | null {
  if (!isRecord(v)) return null;
  const { playerId, name, role, annual, tool, years, coveredThrough } = v;
  if (typeof playerId !== "string" || typeof name !== "string" || !name) return null;
  if (typeof role !== "string" || !JOB_ROLES.includes(role)) return null;
  if (!isMoney(annual)) return null;
  if (typeof tool !== "string" || !TOOL_IDS.includes(tool)) return null;
  if (typeof years !== "number" || !Number.isInteger(years) || years < 1 || years > 5) return null;
  if (typeof coveredThrough !== "string") return null;
  return { playerId, name, role: role as JobRole, annual, tool: tool as ToolId, years, coveredThrough };
}

function readForgone(v: unknown): ForgoneRecord[] {
  if (!Array.isArray(v)) return [];
  const out: ForgoneRecord[] = [];
  for (const r of v) {
    if (!isRecord(r)) continue;
    if (typeof r["day"] !== "number" || typeof r["signed"] !== "string" || !isMoney(r["atPrice"])) continue;
    const lost = Array.isArray(r["lost"]) ? r["lost"].filter((x): x is string => typeof x === "string") : [];
    out.push({ day: r["day"], signed: r["signed"], atPrice: r["atPrice"], lost });
  }
  return out;
}

/**
 * Read one desk. Returns the record, or the one-line reason it was dropped.
 */
function readDesk(seatId: string, v: unknown): { franchise: CarriedFranchise } | { dropped: string } {
  if (!isRecord(v)) return { dropped: `${seatId}: not a desk record` };
  if (!isClubId(v["clubId"])) return { dropped: `${seatId}: club "${String(v["clubId"])}" is not one of this world's clubs` };
  const clubId = v["clubId"];
  const club = CLUB[clubId];
  const twin = v["twin"] === 1 ? 1 : v["twin"] === 0 ? 0 : null;
  if (twin === null) return { dropped: `${club.name}: desk has no twin index` };
  const pos = v["position"];
  if (!isRecord(pos)) return { dropped: `${club.name}: desk has no position` };
  if (!isMoney(pos["committed"])) return { dropped: `${club.name}: committed payroll is not a money amount` };
  const committed = pos["committed"];
  // A payroll below the club's real opening figure cannot come from this
  // world: the window only ever ADDS. Above the second apron by a mile is the
  // same tell in the other direction.
  if (committed < club.committed.value) return { dropped: `${club.name}: payroll ${committed} is below the club's opening figure` };
  if (committed > LINE.apron2 * 1.5) return { dropped: `${club.name}: payroll ${committed} is not a figure this world can produce` };
  const openJobs = Array.isArray(pos["openJobs"]) ? pos["openJobs"].filter((j): j is JobRole => typeof j === "string" && JOB_ROLES.includes(j)) : null;
  if (!openJobs) return { dropped: `${club.name}: open jobs are missing` };
  const rawSignings = Array.isArray(pos["signings"]) ? pos["signings"] : null;
  if (!rawSignings) return { dropped: `${club.name}: signings are missing` };
  const signings: Signing[] = [];
  for (const s of rawSignings) {
    const sg = readSigning(s);
    if (!sg) return { dropped: `${club.name}: a signing record is malformed` };
    signings.push(sg);
  }
  const wall = pos["wall"] === null ? null : isMoney(pos["wall"]) ? pos["wall"] : null;
  const toolsSpent = Array.isArray(pos["spent"]) ? pos["spent"].filter((t): t is ToolId => typeof t === "string" && TOOL_IDS.includes(t)) : [];
  const label = typeof v["label"] === "string" && v["label"] ? v["label"] : `${club.name} ${twin === 0 ? "A" : "B"}`;
  return {
    franchise: {
      sourceSeatId: seatId,
      clubId,
      club: club.name,
      city: club.city,
      label,
      twin,
      committed,
      deadMoney: club.deadMoney.value,
      holds: club.holds.value,
      unattributed: club.committed.value - club.taxSalary.value - club.holds.value,
      taxSalary: club.taxSalary.value + (committed - club.committed.value),
      band: bandOf(committed),
      openJobs,
      signings,
      overCapDeclared: v["position"] !== undefined && pos["overCapDeclared"] === true,
      wall,
      toolsSpent,
      forgone: readForgone(v["forgoneAtCommit"]),
    },
  };
}

/**
 * Read a seed envelope as THE WINDOW's carry.
 *
 * `receivingBand` is the band of the room being created. A carry from the
 * other band is refused outright (BC-18): the economics is the same in both
 * bands, but what the desk was shown and asked to defend is not, and a 7-8
 * room opening on 5-6 commitments would be reading a history its students did
 * not make.
 */
export function extractWindowCarry(seed: unknown, receivingBand: GradeBand): WindowCarry {
  if (seed === undefined || seed === null) return { ok: false, reason: "no source session was linked" };
  if (!isRecord(seed)) return { ok: false, reason: "the seed is not an envelope" };
  if (seed["lessonModuleId"] !== SAME_LINE_L1_ID) {
    return { ok: false, reason: `the linked session is "${String(seed["lessonModuleId"])}", not ${SAME_LINE_L1_ID}` };
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
  const windowClosed = state["windowClosed"] === true;
  if (!windowClosed) {
    warnings.push(
      "The linked window had not closed when this room was created. Every desk arrives with whatever it had signed by then; nothing that happens in that room later reaches here.",
    );
  } else if (!sourceEnded) {
    warnings.push("The linked window closed but the lesson had not ended. The books are final; the reveal and naming may not have been shown.");
  }

  const franchises: CarriedFranchise[] = [];
  for (const [seatId, v] of Object.entries(desks)) {
    const read = readDesk(seatId, v);
    if ("dropped" in read) {
      warnings.push(`Dropped: ${read.dropped}. That desk gets a stock franchise here, and the console says so.`);
      continue;
    }
    franchises.push(read.franchise);
  }
  // Stable order: the world's own club order, twin A before twin B, so a
  // receiving room deals the same list every time it is created from this seed.
  const order = new Map(CLUBS.map((c, i) => [c.id, i]));
  franchises.sort((a, b) => (order.get(a.clubId)! - order.get(b.clubId)!) || a.twin - b.twin);

  return {
    ok: true,
    version: WINDOW_CARRY_VERSION,
    gradeBand: receivingBand,
    sourceSessionId: typeof seed["sourceSessionId"] === "string" ? seed["sourceSessionId"] : null,
    sourceEnded,
    franchises,
    warnings,
    payrollDefinition: PAYROLL_DEFINITION,
    lines: { floor: LINE.floor, cap: LINE.cap, tax: LINE.tax, apron1: LINE.apron1, apron2: LINE.apron2 },
  };
}
