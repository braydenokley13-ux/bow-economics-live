/**
 * MODULE 1 · LESSON 1 — "THE WINDOW."
 *
 * July. One league, one board, three signing days. Every desk in the room holds
 * a position relative to five real lines drawn in the same place for all of
 * them, and the only club anyone can build is the one their position lets them
 * build while everybody else is building theirs.
 *
 * Built against `docs/gauntlet/module-1/rebuild/ARCHITECTURE_SELECTION.md` —
 * candidate D, "THE SAME LINE", plus five grafts — and its 23-item build
 * charter. The economics is in `engine.ts` and was proven by
 * `scripts/same-line-sweep.mjs` BEFORE this file existed: an exhaustive sweep
 * of every legal (player, tool, price) triple on every day at every seat
 * against three rival environments at sixteen desks, with a poison limb that
 * must fail before any result is believed. Nothing here computes economics.
 * This file is state, gating, and words.
 *
 * WHAT THE PAIR ACTUALLY DOES. Each day: pick a player off the board, pick how
 * to pay for him (5-6: chosen for them; 7-8: theirs to choose), type a number,
 * and commit — or pass, which is a real choice with a real cost, because the
 * board keeps emptying whether or not you act. The number matters: a player's
 * printed figure is the least he will accept, not his price, and every dollar
 * above it buys certainty and costs the distance to your next line.
 *
 * THE ONE PHASE GATE. `reduce` is it. The runtime checks ended, frozen and
 * paused, and nothing else — it does not compare an action against the current
 * phase, and it does not consult `allowedActions`. Every action handler below
 * asks what phase it is in, every time.
 */
import {
  BOARD,
  CLUBS,
  CLUB,
  LINES,
  LINE,
  MARKET,
  MINIMUM_MARKET,
  PAYROLL_DEFINITION,
  PROJECTOR_CASES,
  ROSTER,
  SIMPLIFICATIONS,
  TOOL,
  bandOf,
  type ClubId,
  type FreeAgent,
  type JobRole,
  type ToolId,
} from "./world.js";
import {
  applySigning,
  checkOffer,
  ceilingOf,
  legalOffers,
  money,
  openingPosition,
  readingsFor,
  resolveDay,
  settle,
  yearsFor,
  type Award,
  type DayOffer,
  type Offer,
  type Position,
  type Readings,
} from "./engine.js";
import { profileFor, type GradeBand, type GradeProfile } from "../../shared/gradeBand.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../../shared/lessonModule.js";
import type { CanonicalPhase } from "../../shared/phases.js";

export const SAME_LINE_L1_ID = "m1l1-the-window";

/** Three signing days. Tuned against the recoverability property; see the design's §4.1.2. */
export const DAYS = 3;

/* ----------------------------------------------------------------- state -- */

export type Desk = {
  readonly seatId: SeatId;
  /** Which club this desk runs. Two desks hold each club — THE TWIN DESK. */
  readonly clubId: ClubId;
  /** 0 or 1. Two desks on one club is what makes "what you did" separable from "what you were dealt". */
  readonly twin: 0 | 1;
  /** The desk's handle on /teach and the projector. Never a student name. */
  readonly label: string;
  readonly position: Position;
  /** The day this desk first appeared. A pair is never judged on a day it was not here for (D36). */
  readonly joinedOnDay: number;
  /**
   * What this desk gave up to make each signing, frozen at the moment of
   * commitment. The opportunity-cost surface, and the graft the selection took
   * from candidate C: one player, three desks that chased him, the three frozen
   * lists side by side.
   */
  readonly forgoneAtCommit: readonly ForgoneRecord[];
};

export type ForgoneRecord = {
  readonly day: number;
  readonly signed: string;
  readonly atPrice: number;
  /** Names, never categories. What this exact commitment put out of reach. */
  readonly lost: readonly string[];
};

export type PendingOffer = {
  readonly seatId: SeatId;
  readonly playerId: string;
  readonly tool: ToolId;
  readonly annual: number;
};

export type DayRecord = {
  readonly day: number;
  readonly awards: readonly Award[];
  /** How many desks were in on each player. Counts only; never who, never how much. */
  readonly interest: Readonly<Record<string, number>>;
};

export type SameLineL1State = {
  readonly sessionId: string;
  readonly gradeBand: GradeBand;
  readonly day: number;
  /** True once the last day has settled. */
  readonly windowClosed: boolean;
  readonly desks: Readonly<Record<SeatId, Desk>>;
  /** Committed offers for the day now open, replaceable until it closes. */
  readonly pending: Readonly<Record<SeatId, PendingOffer>>;
  /** Every named player already signed, by anyone. Gone for good. */
  readonly taken: readonly string[];
  readonly history: readonly DayRecord[];
  /** Which reveal beat the teacher has pressed to. Nothing past it reaches a desk (D26). */
  readonly beat: number;
  /** Desks that arrived after the window closed, landed as observers rather than stranded. */
  readonly observers: readonly SeatId[];
};

/* ------------------------------------------------------------ seat taking -- */

/**
 * Which club the next desk gets.
 *
 * Deterministic and attributable, never random: desks fill the clubs in the
 * world's own order, first twin before second, so a sixteen-desk room ends with
 * two desks on every club and a smaller room still spreads across the bands
 * rather than piling onto one. The order matters — the world lists the clubs
 * from the least committed upward, so an eight-desk room still gets one seat in
 * each band rather than eight variations on the same position.
 */
function nextSeatFor(state: SameLineL1State): { clubId: ClubId; twin: 0 | 1 } | null {
  const held = Object.values(state.desks);
  for (const twin of [0, 1] as const) {
    for (const club of CLUBS) {
      const already = held.some((d) => d.clubId === club.id && d.twin === twin);
      if (!already) return { clubId: club.id, twin };
    }
  }
  return null;
}

const deskLabel = (clubId: ClubId, twin: 0 | 1): string => `${CLUB[clubId].name} ${twin === 0 ? "A" : "B"}`;

/* --------------------------------------------------------------- the view -- */

const playerById = (id: string): FreeAgent | undefined => MARKET.find((p) => p.id === id);

/** Everyone still on the board for this desk, in board order. */
function availableFor(state: SameLineL1State, desk: Desk): readonly FreeAgent[] {
  const taken = new Set(state.taken);
  return MARKET.filter((p) => p.generic || !taken.has(p.id));
}

/**
 * What one commitment would cost this desk in named alternatives.
 *
 * Recomputed live before the commit and FROZEN at it. Names, not categories:
 * "you can no longer reach Robinson, Nurkic or Grimes" is a sentence a
 * ten-year-old can act on; "you will have less flexibility" is not.
 */
export function forgoneBy(state: SameLineL1State, desk: Desk, offer: Offer): readonly string[] {
  const player = playerById(offer.playerId);
  if (!player) return [];
  const before = new Set(
    legalOffers(desk.position, availableFor(state, desk), new Set(state.taken))
      .filter((o) => !playerById(o.playerId)?.generic)
      .map((o) => o.playerId),
  );
  const after = applySigning(desk.position, player, offer);
  const stillTaken = new Set([...state.taken, player.id]);
  const afterIds = new Set(
    legalOffers(after, availableFor(state, desk), stillTaken)
      .filter((o) => !playerById(o.playerId)?.generic)
      .map((o) => o.playerId),
  );
  const lost: string[] = [];
  for (const id of before) {
    if (id === player.id) continue;
    if (!afterIds.has(id)) {
      const p = playerById(id);
      if (p) lost.push(p.name);
    }
  }
  return lost;
}

/* ---------------------------------------------------------------- reduce -- */

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "CONSEQUENCE", "SYNTHESIS", "COMPLETE"];

const fail = (reason: string): ReduceResult<SameLineL1State> => ({ ok: false, reason });

function reduce(state: SameLineL1State, action: { type: string; [k: string]: unknown }, ctx: ReduceContext): ReduceResult<SameLineL1State> {
  switch (action.type) {
    /* ---- taking a desk. The only way a seat gets a club, because the runtime
       calls initialState exactly once with an empty roster and never tells a
       module that anyone joined. ---- */
    case "takeSeat": {
      if (ctx.seatId === "teacher") return fail("a teacher does not hold a desk");
      if (state.desks[ctx.seatId]) return { ok: true, state }; // idempotent; a retry is not an error
      if (state.observers.includes(ctx.seatId)) return { ok: true, state };
      if (state.windowClosed || ctx.phase === "COMPLETE") {
        // A pair arriving after the window closed cannot be given a club
        // without rewriting numbers this room has already been shown. They are
        // recorded and told so, rather than left watching a spinner.
        return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      }
      const next = nextSeatFor(state);
      if (!next) return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      const desk: Desk = {
        seatId: ctx.seatId,
        clubId: next.clubId,
        twin: next.twin,
        label: deskLabel(next.clubId, next.twin),
        position: openingPosition(next.clubId),
        joinedOnDay: state.day,
        forgoneAtCommit: [],
      };
      return { ok: true, state: { ...state, desks: { ...state.desks, [ctx.seatId]: desk } } };
    }

    /* ---- the offer. Replaceable until the day closes; committing is not
       losing the ability to change your mind, it is losing the day. ---- */
    case "offer": {
      if (ctx.phase !== "PLAY") return fail("the window is not open");
      if (ctx.seatId === "teacher") return fail("a teacher does not make offers");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not have a desk yet");
      if (state.windowClosed) return fail("the window has closed");

      const playerId = String(action["playerId"] ?? "");
      const player = playerById(playerId);
      if (!player) return fail("no such player");
      if (!player.generic && state.taken.includes(playerId)) {
        return fail(`${player.name} has already signed somewhere else.`);
      }
      const toolRaw = String(action["tool"] ?? "");
      const tool = (Object.keys(TOOL) as ToolId[]).find((t) => t === toolRaw);
      if (!tool) return fail("no such way of paying");
      const annual = Number(action["annual"]);
      if (!Number.isFinite(annual)) return fail("an offer needs a number");

      const offer: Offer = { playerId, tool, annual: Math.round(annual) };
      const legality = checkOffer(desk.position, offer, player);
      if (!legality.ok) return fail(legality.reason);

      return {
        ok: true,
        state: { ...state, pending: { ...state.pending, [ctx.seatId]: { seatId: ctx.seatId, ...offer } } },
      };
    }

    /* ---- withdrawing. Free, and it means you are passing the day. ---- */
    case "pass": {
      if (ctx.phase !== "PLAY") return fail("the window is not open");
      if (ctx.seatId === "teacher") return fail("a teacher does not pass");
      if (!state.desks[ctx.seatId]) return fail("you do not have a desk yet");
      const pending = { ...state.pending };
      delete pending[ctx.seatId];
      return { ok: true, state: { ...state, pending } };
    }

    /* ---- the teacher closes the day. Routed through here by the runtime's
       round contract, so a day closed by the clock and one closed by hand
       travel the identical path and cannot diverge. ---- */
    case "teacher:closeDay": {
      if (ctx.phase !== "PLAY") return fail("there is no open day to close");
      if (state.windowClosed) return fail("the window has already closed");
      return { ok: true, state: closeDay(state) };
    }

    /* ---- the reveal, one beat at a time. The gate is here rather than in a
       renderer, so a beat the teacher has not pressed is not merely unrendered
       on a desk — it was never sent (D26). ---- */
    case "teacher:revealNext": {
      if (ctx.phase !== "REVEAL" && ctx.phase !== "CONSEQUENCE") return fail("there is no reveal running");
      return { ok: true, state: { ...state, beat: Math.min(state.beat + 1, REVEAL_BEATS.length - 1) } };
    }
    case "teacher:revealBack": {
      if (ctx.phase !== "REVEAL" && ctx.phase !== "CONSEQUENCE") return fail("there is no reveal running");
      return { ok: true, state: { ...state, beat: Math.max(0, state.beat - 1) } };
    }

    default:
      return fail(`this lesson does not take "${action.type}"`);
  }
}

/**
 * Settle one signing day across every desk at once.
 *
 * Every desk that never committed simply gets nothing — the honest fallback for
 * a market: a club that made no offer signed nobody. That is stated on the
 * console and on the pair's own screen before the teacher closes, so nobody is
 * surprised by it.
 */
function closeDay(state: SameLineL1State): SameLineL1State {
  const positions = new Map<ClubId, Position>();
  const bySeat = new Map<string, SeatId>();
  for (const desk of Object.values(state.desks)) {
    // The engine keys positions by club id; two desks hold each club, so the
    // key here is the DESK, and the engine's clubId field carries it.
    positions.set(desk.seatId as unknown as ClubId, desk.position);
    bySeat.set(desk.seatId, desk.seatId);
  }
  const offers: DayOffer[] = Object.values(state.pending).map((p) => ({
    clubId: p.seatId as unknown as ClubId,
    offer: { playerId: p.playerId, tool: p.tool, annual: p.annual },
  }));

  const interest: Record<string, number> = {};
  for (const o of offers) {
    if (playerById(o.offer.playerId)?.generic) continue;
    interest[o.offer.playerId] = (interest[o.offer.playerId] ?? 0) + 1;
  }

  const resolved = resolveDay(positions, offers, MARKET, new Set(state.taken));

  const desks: Record<SeatId, Desk> = {};
  for (const [seatId, desk] of Object.entries(state.desks)) {
    const after = resolved.positions.get(seatId as unknown as ClubId) ?? desk.position;
    const pending = state.pending[seatId];
    const won = resolved.awards.find((a) => (a.winner as unknown as string) === seatId);
    const forgone = [...desk.forgoneAtCommit];
    if (pending && won) {
      forgone.push({
        day: state.day,
        signed: won.name,
        atPrice: won.annual,
        lost: forgoneBy(state, desk, { playerId: pending.playerId, tool: pending.tool, annual: pending.annual }),
      });
    }
    desks[seatId] = { ...desk, position: after, forgoneAtCommit: forgone };
  }

  const day = state.day + 1;
  return {
    ...state,
    desks,
    pending: {},
    taken: [...resolved.taken],
    history: [...state.history, { day: state.day, awards: resolved.awards, interest }],
    day,
    windowClosed: day >= DAYS,
  };
}

/* ----------------------------------------------------------- reveal beats -- */

export const REVEAL_BEATS = [
  { id: "who-signed", title: "WHO SIGNED WHERE" },
  { id: "same-player", title: "THE SAME PLAYER COST EVERY DESK A DIFFERENT THING" },
  { id: "two-books", title: "THE SAME MOVE, TWO BOOKS" },
  { id: "the-five", title: "FIVE WAYS TO READ THIS ROOM" },
] as const;

/* ---------------------------------------------------------------- module -- */

function initialState(input: { sessionId: string; seatIds: readonly SeatId[]; seed?: unknown; gradeBand: GradeBand }): SameLineL1State {
  return {
    sessionId: input.sessionId,
    gradeBand: input.gradeBand,
    day: 0,
    windowClosed: false,
    desks: {},
    pending: {},
    taken: [],
    history: [],
    beat: 0,
    observers: [],
  };
}

export const sameLineL1Module: LessonModule<SameLineL1State> = {
  id: SAME_LINE_L1_ID,
  title: "The Window",
  phases: PHASES,
  initialState,
  reduce,
  allowedActions: (phase) =>
    phase === "PLAY" ? ["takeSeat", "offer", "pass"] : phase === "LOBBY" || phase === "HOOK" ? ["takeSeat"] : [],

  studentView: (state, seatId, phase) => studentView(state, seatId, phase),
  teacherView: (state, phase) => teacherView(state, phase),
  boardView: (state, phase) => boardView(state, phase),
  aggregate: (state) => ({ desks: Object.keys(state.desks).length, day: state.day, taken: state.taken.length }),

  round: {
    closeHook: "teacher:closeDay",
    noun: "signing day",
    currentKey: (state, phase) => (phase === "PLAY" && !state.windowClosed ? `day-${state.day + 1}` : null),
    fallbackPolicy:
      "A desk that has not made an offer signs nobody today. Nothing is charged and nothing is chosen for them — but the day is gone, and the board will be smaller tomorrow.",
    unresolved: (state, phase, seatIds) => {
      if (phase !== "PLAY" || state.windowClosed) return [];
      const out: UnresolvedSeat[] = [];
      for (const seatId of seatIds) {
        const desk = state.desks[seatId];
        if (!desk) continue;
        if (state.pending[seatId]) continue;
        const open = desk.position.openJobs.length;
        out.push({
          seatId,
          label: desk.label,
          fallback:
            open > 0
              ? `signs nobody today, and still has ${open} ${open === 1 ? "hole" : "holes"} to fill in ${DAYS - state.day - 1} ${DAYS - state.day - 1 === 1 ? "day" : "days"}`
              : "signs nobody today, and has already filled every hole",
          selfFallback:
            open > 0
              ? `You have not made an offer. If the day closes now you sign nobody, and you still have ${open} ${open === 1 ? "hole" : "holes"} to fill.`
              : "You have not made an offer. If the day closes now you sign nobody — though you have already filled every hole.",
        });
      }
      return out;
    },
  },

  classEvents: (prev, next, transition) => {
    const lines: string[] = [];
    if (next.history.length > prev.history.length) {
      const record = next.history[next.history.length - 1]!;
      const named = record.awards.filter((a) => !playerById(a.playerId)?.generic);
      lines.push(
        named.length === 0
          ? `Signing day ${record.day + 1} closed with nobody signed.`
          : `Signing day ${record.day + 1} closed. ${named.length} ${named.length === 1 ? "player" : "players"} came off the board.`,
      );
    }
    if (transition.fromPhase !== transition.toPhase && transition.toPhase === "REVEAL") {
      lines.push("The window closed and the room started going through what happened.");
    }
    return lines;
  },
};

/* ----------------------------------------------------------------- views -- */

function bandProfile(state: SameLineL1State): GradeProfile {
  return profileFor(state.gradeBand);
}

function studentView(state: SameLineL1State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const profile = bandProfile(state);
  const desk = state.desks[seatId];
  if (!desk) {
    /*
     * Two different people land here and they must not be told the same thing.
     *
     * A pair who has only just opened the page has not asked for a desk yet;
     * telling them the window has closed is simply false, and it is the kind of
     * false that makes a child stop trying. Only a seat the module actually
     * turned away — recorded in `observers` because every club was taken — gets
     * the closed-window copy.
     */
    const turnedAway = state.observers.includes(seatId);
    if (!turnedAway) {
      return {
        module: SAME_LINE_L1_ID,
        seated: false,
        observer: false,
        message: "You're in. Finding your club…",
        band: state.gradeBand,
      };
    }
    return {
      module: SAME_LINE_L1_ID,
      seated: false,
      observer: true,
      observerEyebrow: "EVERY CLUB IS TAKEN",
      message:
        "Every club in this room already has a front office, so there is none left to hand you without changing numbers this room has already seen.",
      observerAction: "Stay with us — the next part is the whole room's, and you are in it.",
      band: state.gradeBand,
    };
  }

  const base = {
    module: SAME_LINE_L1_ID,
    seated: true,
    band: state.gradeBand,
    desk: desk.label,
    club: CLUB[desk.clubId].name,
    situation: CLUB[desk.clubId].situation,
    payrollDefinition: PAYROLL_DEFINITION,
    committed: desk.position.committed,
    committedText: money(desk.position.committed),
    slots: desk.position.slots,
    openJobs: desk.position.openJobs,
    ladder: ladderFor(desk.position, profile),
    signings: desk.position.signings,
    hq: hqFor(state, desk, profile),
  };

  switch (phase) {
    case "LOBBY":
      return { ...base, message: "You're in. Your club is on the way." };
    case "HOOK":
      return { ...base, message: hookLine(desk, profile) };
    case "PLAY":
      return {
        ...base,
        day: state.day + 1,
        ofDays: DAYS,
        pending: state.pending[seatId] ?? null,
        board: boardCardsFor(state, desk, profile),
        pockets: pocketsFor(desk.position, profile),
        // The room line: how many desks are in, never who and never how much.
        roomLine: `${Object.keys(state.pending).length} of ${Object.keys(state.desks).length} desks have an offer in.`,
        league: leagueFeed(state),
      };
    case "REVEAL":
    case "CONSEQUENCE":
      return { ...base, ...revealForDesk(state, desk, profile) };
    case "SYNTHESIS":
    case "COMPLETE":
      return { ...base, readings: readingsOf(state, desk), forgone: desk.forgoneAtCommit };
    default:
      return base;
  }
}

/** The ladder, with only the lines this band treats as live (D49 Q1). */
function ladderFor(position: Position, profile: GradeProfile) {
  const live: readonly string[] = profile.band === "5-6" ? ["cap", "apron1"] : ["floor", "cap", "tax", "apron1", "apron2"];
  return LINES.map((l) => ({
    id: l.id,
    label: l.label,
    amount: l.amount,
    amountText: money(l.amount),
    kind: l.kind,
    does: l.does,
    live: live.includes(l.id),
    crossed: position.committed >= l.amount,
  }));
}

function hookLine(desk: Desk, profile: GradeProfile): string {
  const club = CLUB[desk.clubId];
  // Blocking instruction, held under the band's word budget.
  const short = `You run ${club.name}. ${club.situation}`;
  if (profile.band === "5-6") return short;
  return `${short} ${club.colour.value}`;
}

/**
 * How many desks currently hold an offer on each named player.
 *
 * The shared-league window, and the only thing a desk learns about the rest of
 * the room while a day is open: a count, never a name and never an amount. That
 * boundary is the whole design. A count is a true computed fact about the room
 * and it creates the tension the module is for — four other desks want him too.
 * A name or an amount would leak a seat's private position mid-play and would
 * turn a sealed simultaneous market into an open outcry auction won by whoever
 * types fastest, which is a race, not an economy.
 */
function liveInterest(state: SameLineL1State): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const pending of Object.values(state.pending)) {
    if (playerById(pending.playerId)?.generic) continue;
    out[pending.playerId] = (out[pending.playerId] ?? 0) + 1;
  }
  return out;
}

/** The four-act rail. One lesson does not own it; the module does. */
const ACT_RAIL = ["THE OFFSEASON", "THE SEASON", "THE DEADLINE", "THE BOARDROOM"] as const;

/**
 * The front office itself — the persistent frame the desk returns to.
 *
 * Every field is recomputed from this desk's own position. Nothing here is a
 * rating, a grade, or a composite: a single number standing for how good a team
 * is would reinstate the exact intuition this module exists to break.
 */
function hqFor(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  const p = desk.position;
  const club = CLUB[desk.clubId];
  return {
    club: club.name,
    city: club.city,
    situation: club.situation,
    colour: club.colour.value,
    act: { index: 0, of: ACT_RAIL.length, rail: ACT_RAIL, label: ACT_RAIL[0] },
    payroll: p.committed,
    payrollText: money(p.committed),
    slots: {
      filled: p.slots,
      max: ROSTER.windowMax,
      min: ROSTER.min,
      open: Math.max(0, ROSTER.windowMax - p.slots),
    },
    needs: p.openJobs.map((role, i) => ({ rank: i + 1, role })),
    /*
     * Distance to each line, as a MAGNITUDE plus a side.
     *
     * Never a signed number. The grades 5-6 profile does not have negatives
     * (`allowsNegatives: false`), and a payload carrying -4200000 hands a
     * renderer a minus sign to print — which is exactly how a band boundary
     * gets crossed by accident rather than by decision. The sign lives in
     * `side`, which is a word, and the word is what the copy is written from.
     */
    lines: ladderFor(p, profile).map((l) => ({
      ...l,
      space: Math.abs(l.amount - p.committed),
      spaceText: money(Math.abs(l.amount - p.committed)),
      side: p.committed >= l.amount ? ("over" as const) : ("under" as const),
    })),
    wall: p.wall,
    wallText: p.wall === null ? null : money(p.wall),
    overCapDeclared: p.overCapDeclared,
    signings: p.signings.map((sg) => ({ ...sg, annualText: money(sg.annual) })),
  };
}

/**
 * Every player the room has taken off the board, newest first.
 *
 * Settled days only. This is public knowledge the moment a day closes — it is
 * what the class watched happen — so it is not a leak, and it is the single
 * thing that makes sixteen desks feel like one league rather than sixteen
 * simulations that happen to share a room.
 */
function leagueFeed(state: SameLineL1State) {
  const out: {
    day: number;
    name: string;
    role: string;
    club: string;
    annual: number;
    annualText: string;
    contested: number;
    decidedBy: Award["decidedBy"];
  }[] = [];
  for (const rec of state.history) {
    for (const a of rec.awards) {
      const won = state.desks[a.winner as unknown as SeatId];
      const player = playerById(a.playerId);
      if (player?.generic) continue;
      out.push({
        day: rec.day + 1,
        name: a.name,
        role: player?.role ?? "",
        club: won ? won.label : "another club",
        annual: a.annual,
        annualText: money(a.annual),
        contested: a.contested,
        decidedBy: a.decidedBy,
      });
    }
  }
  return out.reverse();
}

/** One entry per tool, keeping the offer that reaches furthest with it. */
function dedupeByTool(offers: readonly Offer[]): readonly Offer[] {
  const best = new Map<ToolId, Offer>();
  for (const o of offers) {
    const held = best.get(o.tool);
    if (!held || o.annual > held.annual) best.set(o.tool, o);
  }
  return [...best.values()];
}

function boardCardsFor(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  const taken = new Set(state.taken);
  const interest = liveInterest(state);
  return BOARD.filter((p) => !taken.has(p.id)).map((p) => {
    const offers = legalOffers(desk.position, [p], taken);
    const best = offers.reduce<Offer | null>((b, o) => (b === null || o.annual > b.annual ? o : b), null);
    const reason = best ? null : whyNot(desk.position, p);
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      ask: p.ask.value,
      askText: money(p.ask.value),
      strength: p.strength,
      risk: p.risk,
      reachable: best !== null,
      unreachableReason: reason,
      /** Desks with an offer in on him right now. A count only (see liveInterest). */
      interest: interest[p.id] ?? 0,
      /** The staging, said out loud rather than implied away (D49 Q3). */
      reallySignedWith: p.reallySignedWith,
      signedOn: p.signedOn,
      yours: p.incumbent === desk.clubId,
      // 5-6 gets the tool chosen for them; 7-8 chooses (profile.maxVariables).
      /*
       * One button per TOOL, not per legal offer.
       *
       * `legalOffers` enumerates offers, and a single tool legally reaches a
       * player at more than one price, so mapping offers straight to buttons
       * rendered "CAP ROOM · up to $3,926,207" twice side by side. The student
       * chooses a WAY OF PAYING and then a price; those are two controls, and
       * conflating them put the same choice on screen twice.
       */
      tools:
        profile.maxVariables >= 3
          ? dedupeByTool(offers).map((o) => ({
              tool: o.tool,
              label: TOOL[o.tool].label,
              does: TOOL[o.tool].does,
              max: ceilingOf(o.tool, desk.position, p),
              maxText: money(ceilingOf(o.tool, desk.position, p) ?? 0),
              years: yearsFor(o.tool, p),
              drawsWall: TOOL[o.tool].drawsWallAt !== null,
            }))
          : [],
      /**
       * The strongest legal way this desk could pay this player.
       *
       * 5-6 never picks a tool, so the composer needs one chosen — and the
       * choice must be the desk's best, never a quiet downgrade. 7-8 gets this
       * as the default selection and may move off it.
       */
      best:
        best === null
          ? null
          : {
              tool: best.tool,
              label: TOOL[best.tool].label,
              max: ceilingOf(best.tool, desk.position, p) ?? best.annual,
              maxText: money(ceilingOf(best.tool, desk.position, p) ?? best.annual),
              years: yearsFor(best.tool, p),
              floor: Math.min(p.ask.value, ceilingOf(best.tool, desk.position, p) ?? best.annual),
              drawsWall: TOOL[best.tool].drawsWallAt !== null,
            },
    };
  });
}

function whyNot(position: Position, player: FreeAgent): string {
  const attempts = (Object.keys(TOOL) as ToolId[]).map((t) => checkOffer(position, { playerId: player.id, tool: t, annual: player.ask.value }, player));
  const refusal = attempts.find((a) => !a.ok);
  return refusal && !refusal.ok ? refusal.reason : "There is no way for you to pay for him.";
}

function pocketsFor(position: Position, profile: GradeProfile) {
  return (Object.keys(TOOL) as ToolId[])
    .filter((t) => t !== "bird")
    .map((t) => {
      const ceiling = ceilingOf(t, position, undefined);
      return {
        id: t,
        label: TOOL[t].label,
        does: TOOL[t].does,
        available: ceiling !== null,
        max: ceiling,
        maxText: ceiling === null ? null : money(ceiling),
        years: TOOL[t].maxYears,
        drawsWall: TOOL[t].drawsWallAt,
        // 5-6 is told what a tool would cost them; 7-8 is left to notice.
        warning: profile.namesTheTradeoff && TOOL[t].drawsWallAt ? `Using this draws a wall you may not cross for the rest of the year.` : null,
      };
    });
}

function readingsOf(state: SameLineL1State, desk: Desk): Readings {
  const opening = openingPosition(desk.clubId);
  const awards = state.history.flatMap((h) => h.awards);
  return readingsFor(opening, desk.position, awards);
}

function revealForDesk(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  const beat = state.beat;
  const out: Record<string, unknown> = { beat, beatTitle: REVEAL_BEATS[beat]?.title ?? "" };
  // Per-beat gating: a number belonging to a beat the teacher has not pressed
  // is not sent, not merely not drawn.
  if (beat >= 0) out["yourSignings"] = desk.position.signings;
  if (beat >= 1) out["yourForgone"] = desk.forgoneAtCommit;
  if (beat >= 2) out["yourRoomLeft"] = readingsOf(state, desk).roomLeft;
  if (beat >= 3) out["yourReadings"] = readingsOf(state, desk);
  void profile;
  return out;
}

function teacherView(state: SameLineL1State, phase: CanonicalPhase): unknown {
  const desks = Object.values(state.desks);
  return {
    module: SAME_LINE_L1_ID,
    band: state.gradeBand,
    day: state.day + 1,
    ofDays: DAYS,
    windowClosed: state.windowClosed,
    /*
     * The counts the bell is labelled with. A teacher deciding whether to close
     * a day needs to know how much of the room is still deciding — closing on
     * eleven of sixteen is a different act from closing on fifteen, and the
     * console must not make them look the same.
     */
    pendingCount: Object.keys(state.pending).length,
    actedCount: Object.keys(state.pending).length,
    claimedCount: desks.length,
    payrollDefinition: PAYROLL_DEFINITION,
    projectorCases: PROJECTOR_CASES,
    simplifications: SIMPLIFICATIONS,
    deskStrip: desks.map((d) => ({
      seatId: d.seatId,
      label: d.label,
      state: state.pending[d.seatId] ? "in" : phase === "PLAY" ? "deciding" : "closed",
      stateLabel: state.pending[d.seatId] ? "OFFER IN" : phase === "PLAY" ? "still deciding" : "closed",
      note: d.position.openJobs.length > 0 ? `${d.position.openJobs.length} still open` : "every hole filled",
      // D36: a desk is never a reason to walk over for a day it was not here for.
      flag: phase === "PLAY" && !state.pending[d.seatId] && d.joinedOnDay < state.day,
    })),
    beat: state.beat,
    beats: REVEAL_BEATS,
  };
}

function boardView(state: SameLineL1State, phase: CanonicalPhase): unknown {
  // Structurally never handed a seat identity. Everything here is class-level.
  const named = state.history.flatMap((h) => h.awards).filter((a) => !playerById(a.playerId)?.generic);
  return {
    module: SAME_LINE_L1_ID,
    band: state.gradeBand,
    phase,
    day: state.day + 1,
    ofDays: DAYS,
    lines: LINES.map((l) => ({ label: l.label, amountText: money(l.amount), kind: l.kind, does: l.does })),
    signed: named.map((a) => ({ player: a.name, club: CLUB[deskClubOf(state, a.winner as unknown as string) ?? "brooklyn"].name, priceText: money(a.annual) })),
    beat: state.beat,
    beatTitle: REVEAL_BEATS[state.beat]?.title ?? "",
    remaining: BOARD.filter((p) => !state.taken.includes(p.id)).length,
  };
}

function deskClubOf(state: SameLineL1State, seatId: string): ClubId | null {
  return state.desks[seatId]?.clubId ?? null;
}

export { settle, yearsFor, MINIMUM_MARKET, ROSTER, LINE, bandOf };
