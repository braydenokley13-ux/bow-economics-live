/**
 * MODULE 1 · LESSON 2 — "THE SEASON" (`m1l2-the-season`).
 *
 * Act 2 of THE SAME LINE. Built against
 * `docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md`, whose Integrator
 * rulings header is binding, and
 * `docs/gauntlet/module-1/rebuild/W2_SEASON_RESEARCH.md`, whose rulings
 * override the spec where they conflict (both read 2026-09-04). Not built
 * before this file; nothing here is verified against a browser (spec header).
 *
 * WHAT THIS FILE DOES NOT DO, ON PURPOSE.
 *
 * STRETCH IS DROPPED (ruling 2). There is no `electStretch` action and no
 * `stretchSchedule` field anywhere in this state. A waive leaves `committed`
 * and `taxSalary` exactly as they were — the sunk-cost lesson needs nothing
 * more — and the waived contract's salary is carried out as
 * `deadMoneyIncurred` for Week 3/4 to charge, never re-computed here.
 *
 * THE PODIUM IS THE RUNTIME'S, NOT THIS MODULE'S ACTION SET. The spec's §7
 * draft lists `teacher:callToPodium` / `teacher:closePodium` as reducer
 * actions, written before the Press Conference primitive existed. It exists
 * now (`lessonModule.ts` `spotlightView`/`pressCandidates`, wired by
 * `sessionService.ts`'s `pressConference`/`endPressConference` control
 * actions, which never pass through a module's `reduce` at all — the generic
 * `{type:"hook", hook: string}` control path this runtime actually ships
 * forwards no `seatId`, so a reducer action taking one is not callable from
 * `/teach` without touching `sessionService.ts`, which is out of this
 * builder's owned scope). The spec's own Contract Note is explicit that
 * `podiumFrame`/`podiumCandidates` MAP ONTO `spotlightView`/`pressCandidates`
 * — so this module implements those two module hooks directly and does not
 * duplicate a `podium` field in state or a `podiumFrame` field in any view;
 * the runtime already performs the takeover structurally, on every surface,
 * whenever a module implements `spotlightView`. `declinePodium` remains a
 * real reducer action, because a desk declining is this module's own fact.
 *
 * THE JANUARY / FEBRUARY MONEY IS PRORATED, NOT A FULL MINIMUM
 * (`W2_SEASON_RESEARCH.md` §4). A ten-day contract charges roughly a
 * twentieth of a full veteran minimum and a late-February rest-of-season deal
 * roughly a quarter of one — using the full $2,449,421 minimum charge for
 * either would overstate the tax clock several-fold and understate the
 * option-value lesson this week exists to teach. `seasonData.ts` carries the
 * sourced, dated figures; this file never invents one.
 *
 * A JOB-REPORT VERDICT NEVER READS A PRICE. `seasonData.jobReportFor` is
 * keyed on `playerId` alone. Nothing in this file passes an `annual`, a
 * `tool` or a `years` into it, by construction — see the sweep test.
 */
import type { GradeBand, GradeProfile } from "../../shared/gradeBand.js";
import { profileFor } from "../../shared/gradeBand.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../../shared/lessonModule.js";
import type { CanonicalPhase } from "../../shared/phases.js";
import { extractWindowCarry, type CarriedFranchise } from "./carry.js";
import type { ForgoneRecord } from "./l1.js";
import {
  FEBRUARY_MARKET,
  MARCH_FIRST_NOTE,
  PRICE_TWINS,
  REST_OF_SEASON_CHARGE,
  TEN_DAY_CHARGE,
  branchPick,
  jobReportFor,
  type FebruaryCandidate,
  type JobReportCard,
  type JobVerdict,
} from "./seasonData.js";
import { SAME_LINE_L2_ID } from "./seasonCarry.js";
import type { Signing } from "./engine.js";
import { money, roomLeftText } from "./engine.js";
import { BOARD, CLUB, CLUBS, LINE, ROSTER, TOOL, bandOf, type Band, type ClubId, type JobRole } from "./world.js";

export { SAME_LINE_L2_ID };

/* --------------------------------------------------------------- state -- */

/** The season's own roster limit — 15 active, not the offseason's 21 (`world.ts` ROSTER.windowMax). */
export const SEASON_ROSTER_MAX = 15;

export type SeasonPosition = {
  readonly clubId: ClubId;
  readonly committed: number;
  readonly taxSalary: number;
  readonly deadMoney: number;
  readonly holds: number;
  readonly slots: number;
  readonly spent: readonly string[];
  readonly wall: number | null;
  readonly openJobs: readonly JobRole[];
  readonly signings: readonly Signing[];
};

export type SeasonDesk = {
  readonly seatId: SeatId;
  readonly clubId: ClubId;
  readonly twin: 0 | 1;
  readonly label: string;
  /** True for a stock desk that never played July: "This July was dealt to you, not played by you." */
  readonly dealt: boolean;
  readonly position: SeasonPosition;
  /** One report entry per player this desk actually signed in July. Never a fixed count. */
  readonly report: readonly JobReportCard[];
  readonly carriedForgone: readonly ForgoneRecord[];
  /** playerIds/contractIds acquired THIS week (January or February), for the seed OUT. */
  readonly acquiredInWeek2: readonly string[];
  readonly waived: readonly Signing[];
};

/** An unclaimed desk waiting to be picked, whether carried or dealt (stock). */
export type UnclaimedSeasonFranchise = {
  readonly sourceSeatId: string | null;
  readonly clubId: ClubId;
  readonly twin: 0 | 1;
  readonly label: string;
  readonly dealt: boolean;
  readonly committed: number;
  readonly taxSalary: number;
  readonly deadMoney: number;
  readonly holds: number;
  readonly openJobs: readonly JobRole[];
  readonly wall: number | null;
  readonly toolsSpent: readonly string[];
  readonly signings: readonly Signing[];
  readonly forgone: readonly ForgoneRecord[];
};

export type PendingCommit = {
  readonly seatId: SeatId;
  readonly kind: "sign";
  readonly playerId: string;
  readonly chip: string;
  readonly line: string;
};

export type TapeEntry = {
  readonly id: string;
  readonly seatId: SeatId;
  readonly deskLabel: string;
  readonly round: "JANUARY" | "FEBRUARY";
  readonly at: number;
  readonly kind: "sign" | "waive" | "pass";
  readonly known: {
    readonly committed: number;
    readonly taxSalary: number;
    readonly band: Band;
    readonly wall: number | null;
    readonly openJobs: readonly JobRole[];
    readonly slots: number;
    readonly toolsLeft: readonly string[];
    readonly report: readonly { playerId: string; name: string; verdict: JobVerdict }[];
    readonly askByRole: Readonly<Record<JobRole, number>>;
  };
  readonly options: readonly { playerId: string; name: string; role: JobRole; tool: string; price: number }[];
  readonly chose:
    | { playerId?: string; name?: string; tool?: string; annual?: number; years?: number; waived?: string }
    | { passed: true };
  readonly forgone: { names: readonly string[]; chip: string; line: string };
  /** Filled once, later — never rewritten past that. Never a verdict this module has not authored (never invented). */
  result: { costThisSeason?: number; costLaterSeasons?: number; outcome?: "won" | "lost" } | null;
};

export type RoundRecord = { readonly round: "JANUARY" | "FEBRUARY"; readonly awards: readonly { seatId: SeatId; name: string; annual: number }[] };

export type SameLineL2State = {
  readonly sessionId: string;
  readonly gradeBand: GradeBand;
  readonly round: "JANUARY" | "FEBRUARY" | null;
  readonly windowClosed: boolean;
  readonly desks: Readonly<Record<SeatId, SeasonDesk>>;
  readonly unclaimed: readonly UnclaimedSeasonFranchise[];
  readonly pending: Readonly<Record<SeatId, PendingCommit>>;
  readonly taken: readonly string[];
  readonly history: readonly RoundRecord[];
  readonly tape: readonly TapeEntry[];
  readonly declined: readonly SeatId[];
  readonly beat: number;
  readonly observers: readonly SeatId[];
  readonly carryWarnings: readonly string[];
};

const PHASES: readonly CanonicalPhase[] = [
  "LOBBY",
  "HOOK",
  "PLAY",
  "REVEAL",
  "CONSEQUENCE",
  "ADAPT",
  "COUNTERFACTUAL",
  "ARGUE",
  "SYNTHESIS",
  "COMPLETE",
];

const HOOK_BEATS = 3;

/* -------------------------------------------------------------- setup -- */

/**
 * STOCK JULY (bug fix, no source-session room): a dealt desk's July was
 * never played, so before this it carried NO named signings — only the room's
 * own generic January ten-day (`min-*`) could ever appear on its books. That
 * made ADAPT's `waivable` list structurally empty and SUNK COST unreachable
 * for every desk in an unlinked room (a room with no Week 1 source session),
 * the opposite of CLAUDE.md §9's promise that an absent student — or here, an
 * absent SOURCE SESSION — gets a stock franchise, not a broken one.
 *
 * These two entries surface two real, dated, sourced one-year contracts
 * already read into this lesson's own `world.ts` BOARD — Nikola Vucevic
 * ($3,900,000, agreed 2026-07-02) and Larry Nance Jr. ($4,000,000, agreed
 * 2026-07-08) — the exact PRICE_TWINS pair `seasonData.ts` already uses for
 * DECISION QUALITY. No salary is invented.
 *
 * WHY THEY DO NOT MOVE THE CLUB'S DOLLAR FIGURES. `club.committed.value` /
 * `club.taxSalary.value` are this club's own real, current totals — already
 * inclusive of whatever it actually carries. Adding these two salaries to
 * that total AGAIN would double-count real money the aggregate already
 * contains. So a stock desk's `committed`/`taxSalary` are untouched; these
 * two named entries are surfaced OUT of the aggregate for the waive/report
 * path, not layered on top of it (`seatFromUnclaimed` correspondingly does
 * not add their count a second time onto `slots`).
 *
 * MISCONCEPTION RISK (CLAUDE.md §3): a student who knows the NBA may notice
 * neither man ever actually played for whichever club this desk is. The
 * `dealt` desk already discloses "This July was dealt to you, not played by
 * you" (`hqFor`'s `dealtNote`) before this screen is ever shown — the exact
 * disclosure this risk needs, since a dealt July was never claimed to be this
 * club's real one.
 */
const STOCK_JULY_A = BOARD.find((p) => p.id === "vucevic")!;
const STOCK_JULY_B = BOARD.find((p) => p.id === "nance")!;
const STOCK_JULY_SIGNINGS: readonly Signing[] = [
  { playerId: STOCK_JULY_A.id, name: STOCK_JULY_A.name, role: STOCK_JULY_A.role, annual: STOCK_JULY_A.ask.value, tool: "minimum", years: STOCK_JULY_A.years, coveredThrough: "2026-27" },
  { playerId: STOCK_JULY_B.id, name: STOCK_JULY_B.name, role: STOCK_JULY_B.role, annual: STOCK_JULY_B.ask.value, tool: "minimum", years: STOCK_JULY_B.years, coveredThrough: "2026-27" },
];

function stockFranchise(clubId: ClubId, twin: 0 | 1, gradeBand: GradeBand): UnclaimedSeasonFranchise {
  const club = CLUB[clubId];
  return {
    sourceSeatId: null,
    clubId,
    twin,
    label: `${club.name} ${twin === 0 ? "A" : "B"}`,
    dealt: true,
    committed: club.committed.value,
    taxSalary: club.taxSalary.value,
    deadMoney: club.deadMoney.value,
    holds: club.holds.value,
    openJobs: club.jobs,
    // A plausible self-set July line, present only where the 7-8 profile
    // reasons about it (`namings()` gates PATH DEPENDENCE/OPTION VALUE behind
    // `profile.maxVariables >= 3`, true only at 7-8) — never at 5-6, which
    // never reaches that reasoning regardless (see `namings()`'s own gate).
    wall: gradeBand === "7-8" ? LINE.tax : null,
    toolsSpent: [],
    signings: STOCK_JULY_SIGNINGS,
    forgone: [],
  };
}

function fromCarried(f: CarriedFranchise): UnclaimedSeasonFranchise {
  return {
    sourceSeatId: f.sourceSeatId,
    clubId: f.clubId,
    twin: f.twin,
    label: f.label,
    dealt: false,
    committed: f.committed,
    taxSalary: f.taxSalary,
    deadMoney: f.deadMoney,
    holds: f.holds,
    openJobs: f.openJobs,
    wall: f.wall,
    toolsSpent: f.toolsSpent,
    signings: f.signings,
    forgone: f.forgone,
  };
}

function buildUnclaimed(seed: unknown, gradeBand: GradeBand): { list: readonly UnclaimedSeasonFranchise[]; warnings: readonly string[] } {
  const carry = extractWindowCarry(seed, gradeBand);
  const warnings: string[] = [];
  const carried: UnclaimedSeasonFranchise[] = [];
  if (carry.ok) {
    carried.push(...carry.franchises.map(fromCarried));
    warnings.push(...carry.warnings);
  } else {
    // ok:false — the reason is printed on /teach only (spec §7 seed IN),
    // never on /board or a student's screen.
    warnings.push(`This July was dealt to you, not played by you: ${carry.reason}`);
  }
  // The classroom needs a desk for every seat regardless of how many July
  // franchises actually carried over — an empty or partial July (0 desks
  // played, or fewer players than this room's roster) is not a carry
  // failure, just a smaller carried set. Every club/twin slot that no real
  // carried franchise already fills gets a stock (dealt:true) franchise, so
  // a dealt-July desk can always podium for its own February (spec: never
  // for a July it did not play) even when July was played by nobody at all.
  const filled = new Set(carried.map((f) => `${f.clubId}:${f.twin}`));
  const list: UnclaimedSeasonFranchise[] = [...carried];
  for (const club of CLUBS) {
    for (const twin of [0, 1] as const) {
      if (!filled.has(`${club.id}:${twin}`)) list.push(stockFranchise(club.id, twin, gradeBand));
    }
  }
  return { list, warnings };
}

function seatFromUnclaimed(state: SameLineL2State, f: UnclaimedSeasonFranchise, seatId: SeatId): SameLineL2State {
  const club = CLUB[f.clubId];
  const position: SeasonPosition = {
    clubId: f.clubId,
    committed: f.committed,
    taxSalary: f.taxSalary,
    deadMoney: f.deadMoney,
    holds: f.holds,
    // A carried desk's `signings` are real July additions ON TOP of
    // `club.contracts.value` (the base roster count L1 started from), so they
    // add a slot each. A stock (`dealt`) desk's `signings` are STOCK_JULY —
    // two names SURFACED OUT of `club.contracts.value`, not added on top of
    // it (see `stockFranchise`'s own comment) — so they must not add a
    // second slot each, or a dealt desk's roster count would overstate the
    // club's real contract count and could push it past SEASON_ROSTER_MAX
    // before this desk ever acts.
    slots: club.contracts.value + (f.dealt ? 0 : f.signings.length),
    spent: f.toolsSpent,
    wall: f.wall,
    openJobs: f.openJobs,
    signings: f.signings,
  };
  const report = f.signings
    .map((sg) => jobReportFor(state.sessionId, sg.playerId, sg.role))
    .filter((r): r is JobReportCard => r !== null);
  const desk: SeasonDesk = {
    seatId,
    clubId: f.clubId,
    twin: f.twin,
    label: f.label,
    dealt: f.dealt,
    position,
    report,
    carriedForgone: f.forgone,
    acquiredInWeek2: [],
    waived: [],
  };
  return {
    ...state,
    desks: { ...state.desks, [seatId]: desk },
    unclaimed: state.unclaimed.filter((u) => u !== f),
  };
}

function initialState(input: { sessionId: string; seatIds: readonly SeatId[]; seed?: unknown; gradeBand: GradeBand }): SameLineL2State {
  const { list, warnings } = buildUnclaimed(input.seed, input.gradeBand);
  return {
    sessionId: input.sessionId,
    gradeBand: input.gradeBand,
    round: null,
    windowClosed: false,
    desks: {},
    unclaimed: list,
    pending: {},
    taken: [],
    history: [],
    tape: [],
    declined: [],
    beat: 0,
    observers: [],
    carryWarnings: warnings,
  };
}

/* ------------------------------------------------------------ helpers -- */

const fail = (reason: string): ReduceResult<SameLineL2State> => ({ ok: false, reason });

/** The functional open jobs (spec §1): originally-open roles PLUS any role whose active signer does not do the job. */
function functionalOpenJobs(desk: SeasonDesk): readonly JobRole[] {
  const out = [...desk.position.openJobs];
  for (const sg of desk.position.signings) {
    const rep = desk.report.find((r) => r.playerId === sg.playerId);
    if (rep && rep.verdict === "DOES_NOT_DO_THE_JOB") out.push(sg.role);
  }
  return out;
}

function askByRoleFor(round: "JANUARY" | "FEBRUARY", taken: ReadonlySet<string>): Record<JobRole, number> {
  if (round === "JANUARY") return { BIG: TEN_DAY_CHARGE, WING: TEN_DAY_CHARGE, GUARD: TEN_DAY_CHARGE };
  const out: Record<JobRole, number> = { BIG: REST_OF_SEASON_CHARGE, WING: REST_OF_SEASON_CHARGE, GUARD: REST_OF_SEASON_CHARGE };
  for (const role of ["BIG", "WING", "GUARD"] as const) {
    const cheapest = FEBRUARY_MARKET.filter((c) => c.role === role && !taken.has(c.id)).sort((a, b) => a.ask - b.ask)[0];
    if (cheapest) out[role] = cheapest.ask;
  }
  return out;
}

function toolsLeftFor(desk: SeasonDesk): readonly string[] {
  return (Object.keys(TOOL) as (keyof typeof TOOL)[]).filter((t) => !desk.position.spent.includes(t));
}

function knownFor(state: SameLineL2State, desk: SeasonDesk, round: "JANUARY" | "FEBRUARY"): TapeEntry["known"] {
  return {
    committed: desk.position.committed,
    taxSalary: desk.position.taxSalary,
    band: bandOf(desk.position.committed),
    wall: desk.position.wall,
    openJobs: functionalOpenJobs(desk),
    slots: desk.position.slots,
    toolsLeft: toolsLeftFor(desk),
    report: desk.report.map((r) => ({ playerId: r.playerId, name: nameForReport(desk, r.playerId), verdict: r.verdict })),
    askByRole: askByRoleFor(round, new Set(state.taken)),
  };
}

function nameForReport(desk: SeasonDesk, playerId: string): string {
  return desk.position.signings.find((sg) => sg.playerId === playerId)?.name ?? playerId;
}

function januaryOptions(): TapeEntry["options"] {
  return (["BIG", "WING", "GUARD"] as const).map((role) => ({
    playerId: `min-${role.toLowerCase()}`,
    name: `A ten-day ${role.toLowerCase()}`,
    role,
    tool: "ten-day",
    price: TEN_DAY_CHARGE,
  }));
}

function februaryOptions(state: SameLineL2State): TapeEntry["options"] {
  const taken = new Set(state.taken);
  return FEBRUARY_MARKET.filter((c) => !taken.has(c.id))
    .slice(0, 4)
    .map((c) => ({ playerId: c.id, name: c.name, role: c.role, tool: "buyout", price: c.ask }));
}

/** The exact July signing that drew this desk's wall, and the signing-day attribution the refusal message quotes. */
function wallOrigin(desk: SeasonDesk): { name: string; tool: string; day: number | null } | null {
  if (desk.position.wall === null) return null;
  const drew = desk.position.signings.find((sg) => {
    const line = TOOL[sg.tool as keyof typeof TOOL]?.drawsWallAt;
    return line !== undefined && line !== null && LINE[line] === desk.position.wall;
  });
  if (!drew) return { name: "an earlier signing", tool: "", day: null };
  const forgoneDay = desk.carriedForgone.find((f) => f.signed === drew.name)?.day ?? null;
  return { name: drew.name, tool: TOOL[drew.tool as keyof typeof TOOL]?.label ?? drew.tool, day: forgoneDay };
}

function wallCrossMessage(desk: SeasonDesk, addAmount: number): string | null {
  if (desk.position.wall === null) return null;
  if (desk.position.committed + addAmount <= desk.position.wall) return null;
  const origin = wallOrigin(desk);
  const dayText = origin && origin.day !== null ? `in July, on signing day ${origin.day + 1}` : "in July";
  const who = origin ? `you used ${origin.tool || "an exception"} on ${origin.name}` : "you drew a wall";
  return `Your wall was drawn ${dayText} when ${who}. It sits at ${money(desk.position.wall)}. This signing would put you past it.`;
}

/** SHOCK B (research §3): Apron Team Salary = committed minus holds, tested AFTER the transaction. */
function apronRefusal(desk: SeasonDesk, candidate: FebruaryCandidate): string | null {
  const apronSalaryAfter = desk.position.committed + candidate.ask - desk.position.holds;
  if (apronSalaryAfter < LINE.apron1) return null;
  if (candidate.preWaiverSalary <= TOOL.ntmle.ceiling!) return null;
  return `Past the first apron you may not sign a player who was cut during the season if he was earning more than ${money(TOOL.ntmle.ceiling!)}. ${candidate.name} was earning ${money(candidate.preWaiverSalary)} the day he was cut. He stays off this desk's board; everyone else on the February market does not.`;
}

function seasonRosterFull(desk: SeasonDesk): boolean {
  return desk.position.slots >= SEASON_ROSTER_MAX;
}

/* ---------------------------------------------------------------- reduce -- */

function reduce(state: SameLineL2State, action: { type: string; [k: string]: unknown }, ctx: ReduceContext): ReduceResult<SameLineL2State> {
  switch (action.type) {
    case "claimDesk": {
      if (ctx.seatId === "teacher") return fail("a teacher does not hold a desk");
      if (state.desks[ctx.seatId]) return { ok: true, state };
      if (state.observers.includes(ctx.seatId)) return { ok: true, state };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      }
      const wantedSource = typeof action["sourceSeatId"] === "string" ? action["sourceSeatId"] : null;
      const target =
        (wantedSource && state.unclaimed.find((u) => u.sourceSeatId === wantedSource)) ||
        (state.unclaimed.find((u) => u.sourceSeatId === ctx.seatId)) ||
        state.unclaimed[0];
      if (!target) return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      return { ok: true, state: seatFromUnclaimed(state, target, ctx.seatId) };
    }

    // `/teach`'s generic "Reveal next" press arrives as `teacher:revealNext`
    // (the runtime routes hook names verbatim); here it means the next beat.
    case "teacher:revealNext":
    case "teacher:beat": {
      if (ctx.phase === "HOOK") return { ok: true, state: { ...state, beat: Math.min(state.beat + 1, HOOK_BEATS - 1) } };
      if (ctx.phase === "SYNTHESIS") {
        const count = Math.max(1, namings(state, profileFor(state.gradeBand)).length);
        return { ok: true, state: { ...state, beat: Math.min(state.beat + 1, count - 1) } };
      }
      return fail("there is no beat to advance here");
    }

    case "sign": {
      if (ctx.phase !== "PLAY" && ctx.phase !== "ADAPT") return fail("this is not a signing window");
      if (ctx.seatId === "teacher") return fail("a teacher does not run a desk");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not have a desk yet");
      const chip = typeof action["chip"] === "string" ? action["chip"].trim() : "";
      const line = typeof action["line"] === "string" ? action["line"].trim() : "";
      if (!chip) return fail("choose a reason before you commit");
      if (!line) return fail("say what you give up before you commit");

      if (ctx.phase === "PLAY") {
        if (state.round !== "JANUARY") return fail("the ten-day window is not open");
        const role = String(action["role"] ?? "");
        if (role !== "BIG" && role !== "WING" && role !== "GUARD") return fail("that is not a job this desk has");
        if (seasonRosterFull(desk)) return fail(`You already have ${SEASON_ROSTER_MAX} players on the active roster. There is no ten-day slot left.`);
        const playerId = `min-${role.toLowerCase()}`;
        const name = `A ten-day ${role.toLowerCase()}`;
        const signing: Signing = { playerId, name, role, annual: TEN_DAY_CHARGE, tool: "minimum", years: 1, coveredThrough: desk.position.signings[0]?.coveredThrough ?? "2026-27" };
        const known = knownFor(state, desk, "JANUARY");
        const entry: TapeEntry = {
          id: `${ctx.seatId}-jan-${state.tape.length}`,
          seatId: ctx.seatId,
          deskLabel: desk.label,
          round: "JANUARY",
          at: ctx.now,
          kind: "sign",
          known,
          options: januaryOptions(),
          chose: { playerId, name, tool: "ten-day", annual: TEN_DAY_CHARGE, years: 1 },
          forgone: { names: [], chip, line },
          result: { costThisSeason: TEN_DAY_CHARGE, costLaterSeasons: 0, outcome: "won" },
        };
        const nextDesk: SeasonDesk = {
          ...desk,
          position: {
            ...desk.position,
            committed: desk.position.committed + TEN_DAY_CHARGE,
            taxSalary: desk.position.taxSalary + TEN_DAY_CHARGE,
            slots: desk.position.slots + 1,
            signings: [...desk.position.signings, signing],
          },
          acquiredInWeek2: [...desk.acquiredInWeek2, playerId],
        };
        return { ok: true, state: { ...state, desks: { ...state.desks, [ctx.seatId]: nextDesk }, tape: [...state.tape, entry] } };
      }

      // ADAPT — the sealed February market.
      if (state.round !== "FEBRUARY") return fail("the buyout window is not open");
      const candidateId = String(action["playerId"] ?? "");
      const candidate = FEBRUARY_MARKET.find((c) => c.id === candidateId);
      if (!candidate) return fail("no such player on the February market");
      if (state.taken.includes(candidateId)) return fail(`${candidate.name} has already signed somewhere else.`);
      if (seasonRosterFull(desk)) return fail(`You already have ${SEASON_ROSTER_MAX} players on the active roster. There is no slot left.`);
      const wallMsg = wallCrossMessage(desk, candidate.ask);
      if (wallMsg) return fail(wallMsg);
      const apronMsg = apronRefusal(desk, candidate);
      if (apronMsg) return fail(apronMsg);

      const known = knownFor(state, desk, "FEBRUARY");
      const entry: TapeEntry = {
        id: `${ctx.seatId}-feb-${state.tape.length}`,
        seatId: ctx.seatId,
        deskLabel: desk.label,
        round: "FEBRUARY",
        at: ctx.now,
        kind: "sign",
        known,
        options: februaryOptions(state),
        chose: { playerId: candidate.id, name: candidate.name, tool: "buyout", annual: candidate.ask, years: 1 },
        forgone: { names: [], chip, line },
        result: null, // filled once, at window close — never invented ahead of it
      };
      const pending: PendingCommit = { seatId: ctx.seatId, kind: "sign", playerId: candidate.id, chip, line };
      return { ok: true, state: { ...state, pending: { ...state.pending, [ctx.seatId]: pending }, tape: [...state.tape, entry] } };
    }

    case "pass": {
      if (ctx.phase !== "PLAY" && ctx.phase !== "ADAPT") return fail("this is not a signing window");
      if (ctx.seatId === "teacher") return fail("a teacher does not run a desk");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not have a desk yet");
      const chip = typeof action["chip"] === "string" ? action["chip"].trim() : "";
      const line = typeof action["line"] === "string" ? action["line"].trim() : "";
      if (!chip) return fail("choose a reason before you commit");
      if (!line) return fail("say what you give up before you commit");
      const round: "JANUARY" | "FEBRUARY" = ctx.phase === "PLAY" ? "JANUARY" : "FEBRUARY";
      if (state.round !== round) return fail("this window is not open");
      const entry: TapeEntry = {
        id: `${ctx.seatId}-${round.toLowerCase()}-${state.tape.length}`,
        seatId: ctx.seatId,
        deskLabel: desk.label,
        round,
        at: ctx.now,
        kind: "pass",
        known: knownFor(state, desk, round),
        options: round === "JANUARY" ? januaryOptions() : februaryOptions(state),
        chose: { passed: true },
        forgone: { names: [], chip, line },
        result: { costThisSeason: 0, costLaterSeasons: 0 },
      };
      // Passing withdraws any staged February commit — a real change of mind, not a second action.
      const pending = { ...state.pending };
      delete pending[ctx.seatId];
      return { ok: true, state: { ...state, pending, tape: [...state.tape, entry] } };
    }

    case "waive": {
      if (ctx.phase !== "ADAPT") return fail("you may only waive during the buyout window");
      if (ctx.seatId === "teacher") return fail("a teacher does not run a desk");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not have a desk yet");
      const chip = typeof action["chip"] === "string" ? action["chip"].trim() : "";
      const line = typeof action["line"] === "string" ? action["line"].trim() : "";
      if (!chip) return fail("choose a reason before you commit");
      if (!line) return fail("say what you give up before you commit");
      const contractId = String(action["contractId"] ?? "");
      const target = desk.position.signings.find((sg) => sg.playerId === contractId);
      if (!target) return fail("that contract is not on this desk's books");
      if (desk.waived.some((w) => w.playerId === contractId)) return fail("that contract is already waived");
      const entry: TapeEntry = {
        id: `${ctx.seatId}-feb-waive-${state.tape.length}`,
        seatId: ctx.seatId,
        deskLabel: desk.label,
        round: "FEBRUARY",
        at: ctx.now,
        kind: "waive",
        known: knownFor(state, desk, "FEBRUARY"),
        options: februaryOptions(state),
        chose: { waived: target.name },
        forgone: { names: [], chip, line },
        // Waiving does not move committed or taxSalary THIS season (D59 ruling 2) — the cost is the dead money Week 4 charges.
        result: { costThisSeason: 0, costLaterSeasons: target.annual },
      };
      const nextDesk: SeasonDesk = {
        ...desk,
        position: {
          ...desk.position,
          slots: Math.max(0, desk.position.slots - 1),
          signings: desk.position.signings.filter((sg) => sg.playerId !== contractId),
        },
        waived: [...desk.waived, target],
      };
      return { ok: true, state: { ...state, desks: { ...state.desks, [ctx.seatId]: nextDesk }, tape: [...state.tape, entry] } };
    }

    // `/teach`'s bell press arrives as `teacher:closeDay`; here the bell closes
    // whichever window is open.
    case "teacher:closeDay":
    case "teacher:closeWindow": {
      if (ctx.phase === "PLAY") {
        if (state.round !== "JANUARY") return fail("there is no open ten-day window to close");
        return { ok: true, state: { ...state, round: null } };
      }
      if (ctx.phase === "ADAPT") {
        if (state.round !== "FEBRUARY") return fail("there is no open buyout window to close");
        return { ok: true, state: resolveFebruary(state) };
      }
      return fail("there is no open window to close");
    }

    case "declinePodium": {
      if (ctx.seatId === "teacher") return fail("a teacher does not decline a podium");
      if (state.declined.includes(ctx.seatId)) return { ok: true, state };
      return { ok: true, state: { ...state, declined: [...state.declined, ctx.seatId] } };
    }

    default:
      return fail(`this lesson does not take "${action.type}"`);
  }
}

/**
 * FEBRUARY'S SEALED CLOSE — the Week 1 resolution idiom, in-model tie-break,
 * no arrival-time race (spec §3). A candidate with more than one claimant
 * goes to the lowest club id, alphabetically, exactly as `engine.ts`'s
 * `resolveDay` falls back to `tiebreak-id` when nothing else distinguishes two
 * bids — documented there as rare, and rare here for the same reason: every
 * February ask is fixed, so a genuine multi-claimant contest is the case
 * worth the room noticing, not hiding behind arrival order.
 */
function resolveFebruary(state: SameLineL2State): SameLineL2State {
  const byCandidate = new Map<string, PendingCommit[]>();
  for (const p of Object.values(state.pending)) {
    if (p.kind !== "sign") continue;
    byCandidate.set(p.playerId, [...(byCandidate.get(p.playerId) ?? []), p]);
  }
  let desks = { ...state.desks };
  let tape = [...state.tape];
  const taken = new Set(state.taken);
  const awards: { seatId: SeatId; name: string; annual: number }[] = [];

  for (const [candidateId, claimants] of byCandidate) {
    if (taken.has(candidateId)) continue;
    const candidate = FEBRUARY_MARKET.find((c) => c.id === candidateId);
    if (!candidate) continue;
    const sorted = [...claimants].sort((a, b) => {
      const ca = desks[a.seatId]?.clubId ?? "";
      const cb = desks[b.seatId]?.clubId ?? "";
      return ca < cb ? -1 : ca > cb ? 1 : 0;
    });
    const winner = sorted[0]!;
    taken.add(candidateId);
    const winnerDesk = desks[winner.seatId];
    if (winnerDesk) {
      desks = {
        ...desks,
        [winner.seatId]: {
          ...winnerDesk,
          position: {
            ...winnerDesk.position,
            committed: winnerDesk.position.committed + candidate.ask,
            taxSalary: winnerDesk.position.taxSalary + candidate.ask,
            slots: winnerDesk.position.slots + 1,
            signings: [
              ...winnerDesk.position.signings,
              { playerId: candidate.id, name: candidate.name, role: candidate.role, annual: candidate.ask, tool: "minimum", years: 1, coveredThrough: "2026-27" },
            ],
          },
          acquiredInWeek2: [...winnerDesk.acquiredInWeek2, candidate.id],
        },
      };
      awards.push({ seatId: winner.seatId, name: candidate.name, annual: candidate.ask });
    }
    tape = tape.map((t) =>
      t.seatId === winner.seatId && t.round === "FEBRUARY" && t.kind === "sign" && (t.chose as { playerId?: string }).playerId === candidateId && t.result === null
        ? { ...t, result: { costThisSeason: candidate.ask, costLaterSeasons: 0, outcome: "won" } }
        : t,
    );
    for (const loser of sorted.slice(1)) {
      tape = tape.map((t) =>
        t.seatId === loser.seatId && t.round === "FEBRUARY" && t.kind === "sign" && (t.chose as { playerId?: string }).playerId === candidateId && t.result === null
          ? { ...t, result: { costThisSeason: 0, costLaterSeasons: 0, outcome: "lost" } }
          : t,
      );
    }
  }

  return { ...state, desks, tape, taken: [...taken], pending: {}, round: null, windowClosed: true, history: [...state.history, { round: "FEBRUARY", awards }] };
}

/* ------------------------------------------------------------ naming -- */

type Naming = { readonly id: string; readonly term: string; readonly moment: string; readonly means: string; readonly real: string; readonly outside: string };

function namings(state: SameLineL2State, profile: GradeProfile): readonly Naming[] {
  const desks = Object.values(state.desks);
  const out: Naming[] = [];
  if (desks.length === 0) return out;

  const waivers = desks.flatMap((d) => d.waived.map((w) => ({ desk: d, w })));
  if (waivers.length > 0) {
    const total = waivers.reduce((sum, x) => sum + x.w.annual, 0);
    out.push({
      id: "sunk-cost",
      term: "SUNK COST",
      moment: `${waivers.length} ${waivers.length === 1 ? "desk" : "desks"} in this room cut a player this season. ${money(total)} a year stayed on the books anyway — cutting him did not make the money disappear.`,
      means: "Once money is spent, it is spent. Whether you keep the player or cut him, that dollar is already gone — so the decision to keep him or cut him should never be about getting that dollar back.",
      real: "Milwaukee waived Damian Lillard on July 1, 2025, but still pays him $21,311,053 a year through the 2030-31 season — he plays for another team now. Cutting him did not make that money disappear; it just spread it out over more years.",
      outside: "A movie ticket you already paid for does not get refunded whether you stay for the rest of the film or walk out at the first scene you hate. The only real question left is what you want to do with the next two hours — not how to get that money back.",
    });
  }

  const twinPair = tapeTwins(state);
  if (twinPair) {
    out.push({
      id: "decision-quality",
      term: "DECISION QUALITY IS NOT OUTCOME",
      moment: `${twinPair.a.name} and ${twinPair.b.name} signed for almost the exact same money — ${twinPair.a.priceText} and ${twinPair.b.priceText}, both this room's own July prices. One did more than the job. One did not.`,
      means: "A good decision can turn out badly, and a lucky decision can turn out well. The price you paid tells you what you risked. It does not tell you what happened next.",
      real: "Nikola Vučević signed for $3.9 million with Orlando on July 2, 2026; Larry Nance Jr. signed for $4 million with Indiana six days later. Almost the same price — but Vučević went on to average 15.1 points a game that season and Nance averaged 3.7. The price the two men were paid barely differed. What they did once they signed did.",
      outside: "A good driver can still get in an accident, and a driver who ran a red light can still get home safe. The choice and the result are not the same thing.",
    });
  }

  if (profile.maxVariables < 3) return out;

  const walled = desks.filter((d) => d.position.wall !== null);
  const refused = desks.filter((d) => d.position.wall !== null && d.position.committed >= LINE.apron1);
  // Computed unconditionally (cheap, band-agnostic) so it can serve both the
  // wall-gated slot below AND the unconditional fallback further down without
  // ever being authored twice.
  const optionValue: Naming = {
    id: "option-value",
    term: "OPTION VALUE",
    moment: `The ten-day contract cost almost nothing and bought a look before a real commitment. ${state.history.some((h) => h.round === "JANUARY") ? "Some desks used it that way." : "Every desk in this room had that option in January, whether or not it used it."}`,
    means: "Sometimes the smartest move is not to buy the thing — it is to buy the right to decide later, for less than the thing itself would have cost.",
    real: "On February 17, 2026, San Antonio signed Mason Plumlee to a cheap 10-day contract — a short, low-cost look, not a real commitment. Ten days later, on February 27, satisfied with what it saw, San Antonio signed him for the rest of the season instead. The team paid to look before it had to decide.",
    outside: "Paying a small deposit to hold a seat, instead of buying the ticket outright, is buying the same thing: a little money now, to keep a bigger choice open.",
  };
  if (walled.length > 0) {
    out.push({
      id: "path-dependence",
      term: "PATH DEPENDENCE",
      moment: `${walled.length} ${walled.length === 1 ? "desk" : "desks"} drew a wall in July. ${refused.length > 0 ? `${refused.length} of them could not reach the top of the February market because of it.` : "None of them happened to need the top of the February market this time — but the wall was there whether they needed it or not."}`,
      means: "A choice you made earlier can close a door later, even when the two moments feel completely unrelated. The rule did not change between July and February. Your position under it did.",
      real: "Phoenix went over the NBA's second apron for the 2024-25 season, and its own earlier roster decisions became a rulebook against future-Phoenix: no combining two contracts to match a bigger salary in a trade, no full mid-level exception, no signing bought-out players above a lower dollar line. The league even froze Phoenix's 2032 first-round pick until it got back under the line. The wall was not new — it was the direct result of decisions Phoenix had already made.",
      outside: "The elective you picked in September decides what you are allowed to take in March. Nobody changed the rules. You changed your own room to move in.",
    });
    out.push(optionValue);
  }

  // UNCONDITIONAL FALLBACK (bug fix): `namings()` must never return zero for
  // a room that played (CLAUDE.md §1 — a room meeting no economics at the
  // naming is a failed lesson). Before this, an unlinked room's stock desks
  // never drew a wall and could sign nothing but generic ten-days, so a room
  // that only signed ten-days and passed reached SYNTHESIS with SUNK COST,
  // DECISION QUALITY, PATH DEPENDENCE and OPTION VALUE all silent — zero
  // namings at both bands. OPTION VALUE is the one naming that never depends
  // on what a room did: every desk, carried or stock, always had the January
  // ten-day option whether or not it used it (the `moment` text above already
  // reads correctly either way, at both bands). Added ONLY when nothing else
  // fired, so it can only ever raise a count of 0 to 1 — the 5-6 two-term cap
  // and the 7-8 four-term cap (`gradeBand.ts` `maxNewTerms`) are already
  // satisfied by the at-most-2-per-gate structure above and cannot be crossed
  // by this line.
  if (out.length === 0) {
    out.push(optionValue);
  }

  return out;
}

/** The price-twins naming, resolved against what this room actually holds (research §1). */
function tapeTwins(state: SameLineL2State): { a: { name: string; priceText: string }; b: { name: string; priceText: string } } | null {
  const signedIds = new Set(Object.values(state.desks).flatMap((d) => d.position.signings.map((s) => s.playerId)));
  for (const twin of PRICE_TWINS) {
    if (signedIds.has(twin.a.playerId) && signedIds.has(twin.b.playerId)) {
      // `twin.b.priceText` already reads "about $15,000,000" for the approximate
      // pair (seasonData.ts) — never re-labelled here, so the sentence cannot
      // drift from the source that also flags it non-exact.
      return { a: { name: twin.a.name, priceText: twin.a.priceText }, b: { name: twin.b.name, priceText: twin.b.priceText } };
    }
  }
  return null;
}

/* ----------------------------------------------------------------- views -- */

function bandProfile(state: SameLineL2State): GradeProfile {
  return profileFor(state.gradeBand);
}

function positionSummary(desk: SeasonDesk) {
  return {
    committedText: money(desk.position.committed),
    taxSalaryText: money(desk.position.taxSalary),
    band: bandOf(desk.position.committed),
    wallText: desk.position.wall === null ? null : money(desk.position.wall),
    openJobs: functionalOpenJobs(desk),
    slots: desk.position.slots,
    slotsMax: SEASON_ROSTER_MAX,
  };
}

function reportView(desk: SeasonDesk) {
  return desk.report.map((r) => ({
    playerId: r.playerId,
    name: nameForReport(desk, r.playerId),
    role: r.role,
    verdict: r.verdict,
    sentence: r.sentence,
  }));
}

function hqFor(desk: SeasonDesk) {
  const club = CLUB[desk.clubId];
  return {
    club: club.name,
    city: club.city,
    label: desk.label,
    dealt: desk.dealt,
    dealtNote: desk.dealt ? "This July was dealt to you, not played by you." : null,
    act: { index: 1, of: 4, rail: ["THE OFFSEASON", "THE SEASON", "THE DEADLINE", "THE BOARDROOM"], label: "THE SEASON" },
    ...positionSummary(desk),
  };
}

const CHIPS_5_6 = ["He can't do the job", "I need the roster spot", "I need the money", "Someone better is coming"] as const;
const CHIPS_7_8 = [
  "This closes the job and I'm sure",
  "This closes the job and it's a gamble",
  "This is the least bad move",
  "I'm holding for February",
] as const;

function commitCaptureFor(profile: GradeProfile) {
  return {
    chips: profile.band === "5-6" ? CHIPS_5_6 : CHIPS_7_8,
    prompt: profile.band === "5-6" ? "What do you lose by doing this?" : "What are you giving up — and what would have to be true for this to be the wrong call?",
  };
}

function studentView(state: SameLineL2State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const profile = bandProfile(state);
  const desk = state.desks[seatId];
  if (!desk) {
    const turnedAway = state.observers.includes(seatId);
    if (turnedAway) {
      return {
        module: SAME_LINE_L2_ID,
        seated: false,
        observer: true,
        message: "Every desk in this room is taken.",
        band: state.gradeBand,
      };
    }
    return {
      module: SAME_LINE_L2_ID,
      seated: false,
      observer: false,
      band: state.gradeBand,
      message: "Pick up your desk from July.",
      choices: state.unclaimed.map((u) => ({ sourceSeatId: u.sourceSeatId, clubId: u.clubId, label: u.label, dealt: u.dealt })),
    };
  }

  const base = {
    module: SAME_LINE_L2_ID,
    seated: true,
    band: state.gradeBand,
    hq: hqFor(desk),
    report: reportView(desk),
    wall: desk.position.wall === null ? null : money(desk.position.wall),
    roleAsk: askByRoleFor(state.round ?? "JANUARY", new Set(state.taken)),
    commitCapture: commitCaptureFor(profile),
    pending: state.pending[seatId] ?? null,
    yourForgone: desk.carriedForgone,
    tape: state.tape.filter((t) => t.seatId === seatId),
  };

  switch (phase) {
    case "HOOK":
      return { ...base, beat: state.beat, beatCount: HOOK_BEATS, hookMessage: state.beat >= 1 ? "Every player you signed got a report." : "Previously on THE OFFSEASON…" };
    case "PLAY":
      return { ...base, round: "JANUARY", board: januaryOptions(), roster: functionalOpenJobs(desk) };
    case "ADAPT":
      return {
        ...base,
        round: "FEBRUARY",
        board: februaryOptions(state).map((o) => {
          const c = FEBRUARY_MARKET.find((x) => x.id === o.playerId)!;
          return { ...o, why: c.why, preWaiverSalaryText: money(c.preWaiverSalary), barred: apronRefusal(desk, c) !== null };
        }),
        marchFirst: MARCH_FIRST_NOTE,
        waivable: desk.position.signings.filter((sg) => !sg.playerId.startsWith("min-")).map((sg) => ({ contractId: sg.playerId, name: sg.name, role: sg.role })),
      };
    case "SYNTHESIS":
    case "COMPLETE":
      return { ...base, naming: namingFrame(state, desk) };
    default:
      return base;
  }
}

function namingFrame(state: SameLineL2State, desk: SeasonDesk | null) {
  const all = namings(state, profileFor(state.gradeBand));
  if (all.length === 0) return null;
  const i = Math.max(0, Math.min(state.beat, all.length - 1));
  const n = all[i]!;
  void desk;
  return { index: i, count: all.length, term: n.term, moment: n.moment, means: n.means, real: n.real, outside: n.outside };
}

function teacherView(state: SameLineL2State, phase: CanonicalPhase): unknown {
  const desks = Object.values(state.desks);
  return {
    module: SAME_LINE_L2_ID,
    band: state.gradeBand,
    round: state.round,
    windowClosed: state.windowClosed,
    carryWarnings: state.carryWarnings,
    perDesk: desks.map((d) => ({
      label: d.label,
      dealt: d.dealt,
      band: bandOf(d.position.committed),
      openJobs: functionalOpenJobs(d),
      wall: d.position.wall,
      committed: d.position.committed,
      pending: state.pending[d.seatId] ?? null,
      report: reportView(d),
    })),
    beat: state.beat,
    beatCount: HOOK_BEATS,
    naming: phase === "SYNTHESIS" ? namingFrame(state, null) : null,
  };
}

function boardView(state: SameLineL2State, phase: CanonicalPhase): unknown {
  const desks = Object.values(state.desks);
  const openByRole: Record<JobRole, number> = { BIG: 0, WING: 0, GUARD: 0 };
  for (const d of desks) for (const r of functionalOpenJobs(d)) openByRole[r] += 1;
  return {
    module: SAME_LINE_L2_ID,
    band: state.gradeBand,
    phase,
    round: state.round,
    openJobsByRole: openByRole,
    commitsIn: Object.keys(state.pending).length,
    deskCount: desks.length,
    wallsDrawn: desks.filter((d) => d.position.wall !== null).length,
    ticker: state.history.flatMap((h) => h.awards.map((a) => ({ round: h.round, name: a.name, priceText: money(a.annual) }))),
    naming: phase === "SYNTHESIS" ? namingFrame(state, null) : null,
  };
}

/* ------------------------------------------------------------ podium -- */

export function spotlightView(state: SameLineL2State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const desk = state.desks[seatId];
  if (!desk) return null;
  const entries = state.tape.filter((t) => t.seatId === seatId).slice(-4);
  return {
    module: SAME_LINE_L2_ID,
    label: desk.label,
    club: CLUB[desk.clubId].name,
    dealt: desk.dealt,
    committedText: money(desk.position.committed),
    openJobs: functionalOpenJobs(desk),
    wallText: desk.position.wall === null ? null : money(desk.position.wall),
    // Never the chip, never the typed line, never a result the teacher has not chosen to reveal (§6).
    decisions: entries.map((e) => ({
      round: e.round,
      kind: e.kind,
      options: e.options,
      chose: "playerId" in e.chose ? { name: e.chose.name, tool: e.chose.tool, annual: e.chose.annual } : { passed: true },
      forgoneNames: e.forgone.names,
    })),
    phase,
  };
}

export function pressCandidates(state: SameLineL2State, _phase: CanonicalPhase): readonly { seatId: SeatId; label: string; why: string }[] {
  const desks = Object.values(state.desks).filter((d) => !state.declined.includes(d.seatId));
  const scored = desks.map((d) => {
    let score = 0;
    const why: string[] = [];
    const own = state.tape.filter((t) => t.seatId === d.seatId);
    const waives = own.filter((t) => t.kind === "waive");
    if (waives.length > 0) {
      score += 3;
      why.push(`cut ${waives.length === 1 ? "a player" : `${waives.length} players`} this season`);
    }
    const overAsk = own.find((t) => t.kind === "sign" && "annual" in t.chose && (t.chose.annual ?? 0) > (t.known.askByRole[(t.options[0]?.role as JobRole) ?? "BIG"] ?? Infinity));
    if (overAsk) {
      score += 2;
      why.push("paid over the going rate");
    }
    const notDoingJob = d.report.some((r) => r.verdict === "DOES_NOT_DO_THE_JOB");
    if (notDoingJob && own.length === 0) {
      score += 1;
      why.push("has an open job and has not moved yet this week");
    }
    if (own.length === 0) {
      score += 1;
      why.push("has not committed to anything yet this week");
    }
    return { seatId: d.seatId, label: d.label, score, why: why.join(" · ") || "a plain week so far — a fair first podium" };
  });
  return scored.sort((a, b) => b.score - a.score).map(({ seatId, label, why }) => ({ seatId, label, why }));
}

/* ---------------------------------------------------------------- module -- */

export const sameLineL2Module: LessonModule<SameLineL2State> = {
  id: SAME_LINE_L2_ID,
  title: "The Season",
  phases: PHASES,
  initialState,
  reduce,
  onPhaseExit: (state, from, to) => {
    let next = state;
    if (to === "PLAY") next = { ...next, round: "JANUARY" };
    if (to === "ADAPT") next = { ...next, round: "FEBRUARY" };
    if (from === "ADAPT" && to !== "ADAPT" && !next.windowClosed) next = resolveFebruary(next);
    if (to === "SYNTHESIS") next = { ...next, beat: 0 };
    return next;
  },
  allowedActions: (phase) =>
    phase === "PLAY"
      ? ["claimDesk", "sign", "pass", "teacher:closeWindow", "teacher:closeDay"]
      : phase === "ADAPT"
        ? ["sign", "pass", "waive", "teacher:closeWindow", "teacher:closeDay"]
        : phase === "LOBBY" || phase === "HOOK"
          ? ["claimDesk", "teacher:beat", "teacher:revealNext"]
          : phase === "SYNTHESIS"
            ? ["teacher:beat", "teacher:revealNext"]
            : [],
  studentView,
  teacherView,
  boardView,
  aggregate: (state) => ({ desks: Object.keys(state.desks).length, round: state.round, windowClosed: state.windowClosed }),
  round: {
    closeHook: "teacher:closeWindow",
    noun: "window",
    currentKey: (state, phase) =>
      phase === "PLAY" && state.round === "JANUARY" ? "january" : phase === "ADAPT" && state.round === "FEBRUARY" ? "february" : null,
    fallbackPolicy: "A desk that has not committed keeps its roster spot open. Nothing is chosen for it, and the window closing does not spend its money.",
    unresolved: (state, phase, seatIds) => {
      if ((phase !== "PLAY" && phase !== "ADAPT") || state.round === null) return [];
      const out: UnresolvedSeat[] = [];
      for (const seatId of seatIds) {
        const desk = state.desks[seatId];
        if (!desk) continue;
        if (phase === "ADAPT" && state.pending[seatId]) continue;
        if (phase === "PLAY") {
          const madeAMove = state.tape.some((t) => t.seatId === seatId && t.round === "JANUARY");
          if (madeAMove) continue;
        }
        out.push({
          seatId,
          label: desk.label,
          fallback: "keeps its roster spot open and its money unspent",
          selfFallback: "You have not committed. If the window closes now, your roster spot stays open and your money stays unspent.",
        });
      }
      return out;
    },
  },
  spotlightView,
  pressCandidates,
};
