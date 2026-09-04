/**
 * WHAT LEAVES THE SEASON.
 *
 * The Week 3 receiver of this file (`m1l3-the-deadline`) needs exactly what
 * `carry.ts` gives Week 2: a validated, band-checked, per-desk record of what
 * this room actually did, with STATE (anything that changes a later
 * computation) kept apart from EVIDENCE (anything only ever shown to a human)
 * — `ARC_DESIGN.md` §2. Same untrusted-input discipline as
 * `extractWindowCarry`: a seed is an opaque blob from another session, never
 * assumed to be well-formed, and a bad desk is dropped WITH A REASON rather
 * than taking a good classmate down with it.
 *
 * D59 ruling 1 (binding, `W2_THE_SEASON_SPEC.md` header): Week 3's trade
 * objects are ONLY contracts this room signed — including this week's January
 * and February pickups — and each franchise's own draft picks at $0. No
 * incumbent NBA player is ever a trade object, because this world never hands
 * a desk one; every name in `roster` below is a room-signed contract. A
 * waived contract is dead money, not an asset, and is never in `roster`.
 */
import type { GradeBand } from "../../shared/gradeBand.js";
import { isGradeBand } from "../../shared/gradeBand.js";
import type { Signing } from "./engine.js";
import { SEASON } from "./engine.js";
import { CLUB, CLUBS, LINE, type Band, type ClubId, type JobRole } from "./world.js";
import type { ForgoneRecord } from "./l1.js";
import { jobReportFor } from "./seasonData.js";

export const SAME_LINE_L2_ID = "m1l2-the-season";

/** Bumped when the record below changes shape. A receiver refuses a version it does not know. */
export const SEASON_CARRY_VERSION = 1;

/** The three states a room-signed contract can be in when the season hands it forward. */
export type SeasonJobState = "DID_THE_JOB" | "DID_NOT" | "UNPLAYED";

export type SeasonRosterEntry = {
  readonly contractId: string;
  readonly playerId: string;
  readonly name: string;
  readonly role: JobRole;
  readonly annual: number;
  readonly yearsRemaining: number;
  readonly coveredThrough: string;
  readonly jobState: SeasonJobState;
  readonly acquiredWeek: 1 | 2;
};

export type SeasonPick = {
  readonly pickId: string;
  readonly year: number;
  readonly round: 1 | 2;
  readonly label: string;
};

/** One `TapeEntry` shape, kept intentionally loose here — EVIDENCE only, never read by a receiving reducer. */
export type SeasonTapeEntry = { readonly id: string; readonly [key: string]: unknown };

export type SeasonCarriedFranchise = {
  /* ---- carried forward from THE WINDOW, unchanged in kind (carry.ts CarriedFranchise) ---- */
  readonly sourceSeatId: string;
  readonly clubId: ClubId;
  readonly club: string;
  readonly city: string;
  readonly label: string;
  readonly twin: 0 | 1;
  /* ---- STATE: changes a later computation ---- */
  /** End-of-season cap hit. Unchanged by a waive (D59 ruling 2) — the dead money still counts here. */
  readonly committed: number;
  /** End-of-season tax salary. Same ruling: a waive does not move this number this season. */
  readonly taxSalary: number;
  readonly deadMoney: number;
  /** New dead money THIS room's own waives created — evidence for the STATE the bill needs, kept separate so nothing double-counts it into `committed`. */
  readonly deadMoneyIncurred: number;
  readonly band: Band;
  readonly openJobs: readonly JobRole[];
  readonly wall: number | null;
  readonly toolsSpent: readonly string[];
  /** Room-signed contracts only, live on the roster at season's end. Never an incumbent NBA player. */
  readonly roster: readonly SeasonRosterEntry[];
  /** Two own picks, at $0 — the only other trade object Week 3 may use (D59 ruling 1). */
  readonly picks: readonly SeasonPick[];
  /* ---- EVIDENCE: shown to a human, never read by a reducer ---- */
  readonly waived: readonly Signing[];
  readonly forgone: readonly ForgoneRecord[];
  readonly tape: readonly SeasonTapeEntry[];
};

export type SeasonCarry =
  | {
      readonly ok: true;
      readonly version: typeof SEASON_CARRY_VERSION;
      readonly gradeBand: GradeBand;
      readonly sourceSessionId: string | null;
      readonly sourceEnded: boolean;
      readonly franchises: readonly SeasonCarriedFranchise[];
      readonly warnings: readonly string[];
      readonly lines: Readonly<Record<"floor" | "cap" | "tax" | "apron1" | "apron2", number>>;
    }
  | { readonly ok: false; readonly reason: string };

/** Two own picks at $0, deterministic and stable across a re-run of the same room. */
export function defaultPicksFor(clubId: ClubId, twin: 0 | 1): readonly SeasonPick[] {
  const club = CLUB[clubId];
  const suffix = twin === 1 ? "-b" : "";
  return [
    { pickId: `${clubId}${suffix}-r1-${SEASON + 1}`, year: SEASON + 1, round: 1, label: `${club.name}'s own ${SEASON + 1} 1st` },
    { pickId: `${clubId}${suffix}-r2-${SEASON + 2}`, year: SEASON + 2, round: 2, label: `${club.name}'s own ${SEASON + 2} 2nd` },
  ] as const;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isMoney = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1_000_000_000;
const isClubId = (v: unknown): v is ClubId => typeof v === "string" && CLUBS.some((c) => c.id === v);
const JOB_ROLES: readonly string[] = ["BIG", "WING", "GUARD"];
const JOB_STATES: readonly string[] = ["DID_THE_JOB", "DID_NOT", "UNPLAYED"];

function readRosterEntry(v: unknown): SeasonRosterEntry | null {
  if (!isRecord(v)) return null;
  const { contractId, playerId, name, role, annual, yearsRemaining, coveredThrough, jobState, acquiredWeek } = v;
  if (typeof contractId !== "string" || !contractId) return null;
  if (typeof playerId !== "string" || typeof name !== "string" || !name) return null;
  if (typeof role !== "string" || !JOB_ROLES.includes(role)) return null;
  if (!isMoney(annual)) return null;
  if (typeof yearsRemaining !== "number" || !Number.isInteger(yearsRemaining) || yearsRemaining < 0) return null;
  if (typeof coveredThrough !== "string") return null;
  if (typeof jobState !== "string" || !JOB_STATES.includes(jobState)) return null;
  if (acquiredWeek !== 1 && acquiredWeek !== 2) return null;
  return {
    contractId,
    playerId,
    name,
    role: role as JobRole,
    annual,
    yearsRemaining,
    coveredThrough,
    jobState: jobState as SeasonJobState,
    acquiredWeek,
  };
}

function readPick(v: unknown): SeasonPick | null {
  if (!isRecord(v)) return null;
  const { pickId, year, round, label } = v;
  if (typeof pickId !== "string" || !pickId) return null;
  if (typeof year !== "number" || !Number.isInteger(year)) return null;
  if (round !== 1 && round !== 2) return null;
  if (typeof label !== "string" || !label) return null;
  return { pickId, year, round, label };
}

function readWaived(v: unknown): Signing[] {
  if (!Array.isArray(v)) return [];
  const out: Signing[] = [];
  for (const s of v) {
    if (!isRecord(s)) continue;
    const { playerId, name, role, annual, tool, years, coveredThrough } = s;
    if (typeof playerId !== "string" || typeof name !== "string") continue;
    if (typeof role !== "string" || !JOB_ROLES.includes(role)) continue;
    if (!isMoney(annual)) continue;
    if (typeof tool !== "string") continue;
    if (typeof years !== "number") continue;
    if (typeof coveredThrough !== "string") continue;
    out.push({ playerId, name, role: role as JobRole, annual, tool: tool as Signing["tool"], years, coveredThrough });
  }
  return out;
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

/** Tape is EVIDENCE only. Shape-checked just enough that a receiver can display it; never used to decide anything. */
function readTape(v: unknown): SeasonTapeEntry[] {
  if (!Array.isArray(v)) return [];
  const out: SeasonTapeEntry[] = [];
  for (const e of v) {
    if (!isRecord(e)) continue;
    if (typeof e["id"] !== "string") continue;
    out.push(e as SeasonTapeEntry);
  }
  return out;
}

/**
 * `l2.ts`'s own `SeasonDesk` carries no pre-built `roster` — it carries
 * `position.signings` (the active contracts) plus `acquiredInWeek2` (which of
 * them were signed THIS week, January or February). This rebuilds the
 * roster the same way `carry.ts` rebuilds a franchise from THE WINDOW's own
 * `Position`: from the module's real fields, never from a shape the module
 * does not actually produce. `jobState` is re-derived from the same
 * deterministic report (`seasonData.jobReportFor`) the module itself used —
 * a pure function of `sessionId` and `playerId`, never of price.
 */
function buildRoster(sessionId: string, signings: readonly Signing[], acquiredWeek2: ReadonlySet<string>): SeasonRosterEntry[] {
  return signings.map((sg) => {
    const acquiredWeek: 1 | 2 = acquiredWeek2.has(sg.playerId) ? 2 : 1;
    let jobState: SeasonJobState = "UNPLAYED";
    if (acquiredWeek === 1) {
      const report = jobReportFor(sessionId, sg.playerId, sg.role);
      jobState = report === null ? "UNPLAYED" : report.verdict === "DOES_NOT_DO_THE_JOB" ? "DID_NOT" : "DID_THE_JOB";
    }
    return {
      contractId: sg.playerId,
      playerId: sg.playerId,
      name: sg.name,
      role: sg.role,
      annual: sg.annual,
      yearsRemaining: sg.years,
      coveredThrough: sg.coveredThrough,
      jobState,
      acquiredWeek,
    };
  });
}

function readDesk(sessionId: string, seatId: string, v: unknown): { franchise: SeasonCarriedFranchise } | { dropped: string } {
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
  if (committed > LINE.apron2 * 1.5) return { dropped: `${club.name}: payroll ${committed} is not a figure this world can produce` };
  if (!isMoney(pos["taxSalary"])) return { dropped: `${club.name}: tax salary is not a money amount` };
  const taxSalary = pos["taxSalary"];
  const deadMoney = isMoney(pos["deadMoney"]) ? pos["deadMoney"] : club.deadMoney.value;
  const openJobs = Array.isArray(pos["openJobs"]) ? pos["openJobs"].filter((j): j is JobRole => typeof j === "string" && JOB_ROLES.includes(j)) : null;
  if (!openJobs) return { dropped: `${club.name}: open jobs are missing` };
  const wall = pos["wall"] === null ? null : isMoney(pos["wall"]) ? pos["wall"] : null;
  const toolsSpent = Array.isArray(pos["spent"]) ? pos["spent"].filter((t): t is string => typeof t === "string") : [];

  const rawSignings = Array.isArray(pos["signings"]) ? pos["signings"] : null;
  if (!rawSignings) return { dropped: `${club.name}: signings are missing` };
  const signings = readWaived(rawSignings); // same shape reader; a Signing is a Signing
  const acquiredWeek2 = new Set(Array.isArray(v["acquiredInWeek2"]) ? v["acquiredInWeek2"].filter((x): x is string => typeof x === "string") : []);
  const roster = buildRoster(sessionId, signings, acquiredWeek2);
  const waivedList = readWaived(v["waived"]);
  const deadMoneyIncurred = waivedList.reduce((sum, w) => sum + w.annual, 0);
  const picks: SeasonPick[] = [];

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
      taxSalary,
      deadMoney,
      deadMoneyIncurred,
      band: bandOfSalary(committed),
      openJobs,
      wall,
      toolsSpent,
      roster,
      picks: picks.length > 0 ? picks : defaultPicksFor(clubId, twin),
      waived: readWaived(v["waived"]),
      forgone: readForgone(v["forgone"]),
      tape: readTape(v["tape"]),
    },
  };
}

function bandOfSalary(committed: number): Band {
  if (committed < LINE.floor) return "under-floor";
  if (committed < LINE.cap) return "under-cap";
  if (committed < LINE.tax) return "under-tax";
  if (committed < LINE.apron1) return "under-apron1";
  if (committed < LINE.apron2) return "under-apron2";
  return "over-apron2";
}

/**
 * Read a seed envelope as THE SEASON's carry. Same contract as
 * `extractWindowCarry`: refuse the wrong module, refuse the wrong band, drop
 * a bad desk with a readable reason, keep every good classmate, and return
 * franchises in the world's own stable club-then-twin order.
 */
export function extractSeasonCarry(seed: unknown, receivingBand: GradeBand): SeasonCarry {
  if (seed === undefined || seed === null) return { ok: false, reason: "no source session was linked" };
  if (!isRecord(seed)) return { ok: false, reason: "the seed is not an envelope" };
  if (seed["lessonModuleId"] !== SAME_LINE_L2_ID) {
    return { ok: false, reason: `the linked session is "${String(seed["lessonModuleId"])}", not ${SAME_LINE_L2_ID}` };
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
      "The linked season had not closed when this room was created. Every desk arrives with whatever it had done by then.",
    );
  } else if (!sourceEnded) {
    warnings.push("The linked season closed but the lesson had not ended. The books are final; the reveal and naming may not have been shown.");
  }

  const sessionId = typeof seed["sourceSessionId"] === "string" ? seed["sourceSessionId"] : typeof state["sessionId"] === "string" ? state["sessionId"] : "";
  const franchises: SeasonCarriedFranchise[] = [];
  for (const [seatId, v] of Object.entries(desks)) {
    const read = readDesk(sessionId, seatId, v);
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
    version: SEASON_CARRY_VERSION,
    gradeBand: receivingBand,
    sourceSessionId: typeof seed["sourceSessionId"] === "string" ? seed["sourceSessionId"] : null,
    sourceEnded,
    franchises,
    warnings,
    lines: { floor: LINE.floor, cap: LINE.cap, tax: LINE.tax, apron1: LINE.apron1, apron2: LINE.apron2 },
  };
}
