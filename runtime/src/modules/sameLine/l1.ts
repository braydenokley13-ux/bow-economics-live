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
  type Production,
  type ToolId,
} from "./world.js";
import {
  applySigning,
  canDeclareOverCap,
  checkOffer,
  ceilingOf,
  declareOverCap,
  legalOffers,
  money,
  openingPosition,
  outlookAfter,
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
import { claim, onBoard, type Claimed } from "../../shared/claims.js";
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
  /** The term this desk chose, when its band chooses one. */
  readonly years?: number;
};

export type DayRecord = {
  readonly day: number;
  readonly awards: readonly Award[];
  /** How many desks were in on each player. Counts only; never who, never how much. */
  readonly interest: Readonly<Record<string, number>>;
  /**
   * Which player each desk went after that day. This is what makes the wire
   * possible: without it, a desk that lost a player learns only that the board
   * got shorter, which is the difference between a league and a spreadsheet.
   *
   * PRIVACY. Seat-keyed, so it is seat-private by construction. `studentView`
   * reads only the caller's own entry, the projector never reads it at all, and
   * `/teach` reads it in aggregate to find collisions. Prices are not in here —
   * the amount a desk offered stays with that desk forever.
   */
  readonly chased: Readonly<Record<SeatId, string>>;
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

      /*
       * THE TERM. 7-8 chooses it; 5-6 does not send one and gets the tool's
       * maximum, which is what the composer shows them. Validated in
       * `checkOffer` against the tool's real limit, so a hand-rolled action
       * cannot buy a six-year small exception.
       */
      const yearsRaw = action["years"];
      const years = typeof yearsRaw === "number" && Number.isFinite(yearsRaw) ? Math.round(yearsRaw) : undefined;

      const offer: Offer = { playerId, tool, annual: Math.round(annual), ...(years === undefined ? {} : { years }) };
      const legality = checkOffer(desk.position, offer, player);
      if (!legality.ok) return fail(legality.reason);

      return {
        ok: true,
        state: { ...state, pending: { ...state.pending, [ctx.seatId]: { seatId: ctx.seatId, ...offer } } },
      };
    }

    /*
     * ---- GIVING UP THE ROOM.
     *
     * The sharpest choice on the board, and it was modelled, swept, and wired
     * to nothing: `canDeclareOverCap` and `declareOverCap` existed in the
     * engine and no action reached them, so the two under-cap seats had a
     * one-path lesson where the design says they have a fork.
     *
     * Brooklyn is under the cap by $2,180,704 — less than the minimum charge,
     * so the room cannot sign one human being. Renouncing it buys the big
     * exception, worth $14,104,000. "Cap space" sounds like the good outcome
     * and here it is worth less than nothing, which is the false intuition this
     * seat exists to break.
     *
     * IRREVERSIBLE, on purpose. You cannot watch what the room does and then
     * decide which kind of club you were. ---- */
    case "declareOverCap": {
      if (ctx.phase !== "PLAY") return fail("the window is not open");
      if (ctx.seatId === "teacher") return fail("a teacher does not run a club");
      const desk = state.desks[ctx.seatId];
      if (!desk) return fail("you do not have a desk yet");
      if (state.windowClosed) return fail("the window has closed");
      if (!canDeclareOverCap(desk.position)) {
        return fail(
          desk.position.overCapDeclared
            ? "You have already given up your cap room. It does not come back."
            : desk.position.spent.includes("room")
              ? "You have already spent cap room on somebody. You cannot un-spend it and take the exception instead."
              : "You are not under the cap, so there is no room to give up.",
        );
      }
      /* Giving up the room while an offer is in that DEPENDS on the room would
         leave a committed offer the club can no longer pay. The offer goes. */
      const pending = { ...state.pending };
      if (pending[ctx.seatId]?.tool === "room") delete pending[ctx.seatId];
      return {
        ok: true,
        state: {
          ...state,
          pending,
          desks: { ...state.desks, [ctx.seatId]: { ...desk, position: declareOverCap(desk.position) } },
        },
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
    offer: { playerId: p.playerId, tool: p.tool, annual: p.annual, ...(p.years === undefined ? {} : { years: p.years }) },
  }));

  const interest: Record<string, number> = {};
  const chased: Record<SeatId, string> = {};
  for (const [seatId, p] of Object.entries(state.pending)) {
    if (playerById(p.playerId)?.generic) continue;
    chased[seatId] = p.playerId;
  }
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
        lost: forgoneBy(state, desk, {
          playerId: pending.playerId,
          tool: pending.tool,
          annual: pending.annual,
          ...(pending.years === undefined ? {} : { years: pending.years }),
        }),
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
    history: [...state.history, { day: state.day, awards: resolved.awards, interest, chased }],
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
    phase === "PLAY" ? ["takeSeat", "offer", "pass", "declareOverCap"] : phase === "LOBBY" || phase === "HOOK" ? ["takeSeat"] : [],

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
        /* 7-8 negotiates the term; 5-6 is given the tool's maximum. This is
           the founder's "more responsibility, not harder arithmetic": the
           number of years is a real GM lever with a real cost on both sides,
           not another sum to do. */
        choosesTerm: profile.maxVariables >= 3,
        // The room line: how many desks are in, never who and never how much.
        roomLine: `${Object.keys(state.pending).length} of ${Object.keys(state.desks).length} desks have an offer in.`,
        league: leagueFeed(state),
        /* The floor of the market: always there, never contested, same price
           for every club in the room. Kept out of `board` on purpose. */
        floor: floorCardsFor(state, desk, profile),
        /* THE FORK. Offered only to the seats that actually have it, and only
           while it is still theirs to take. */
        fork: canDeclareOverCap(desk.position)
          ? (() => {
              const room = LINE["cap"] - desk.position.committed;
              const exception = TOOL.ntmle.ceiling ?? 0;
              const reachable = BOARD.filter(
                (p) => !state.taken.includes(p.id) && p.ask.value <= room,
              ).length;
              return {
                roomText: money(room),
                exceptionText: money(exception),
                reachableWithRoom: reachable,
                /* Said as a count of people, not as a comparison of numbers:
                   "your room reaches nobody" is a fact a ten-year-old can act
                   on, and "$2,180,704 < $14,104,000" is arithmetic homework. */
                line:
                  reachable === 0
                    ? `Your cap room reaches nobody on this board. Give it up and you get the big exception instead — ${money(exception)}, drawn against a wall you are nowhere near.`
                    : `Your cap room reaches ${reachable} ${reachable === 1 ? "person" : "people"} on this board. Give it up and you get the big exception instead — ${money(exception)} — but the room is gone for good.`,
                warning: "You cannot take this back. Not today, not tomorrow, not after you see what everybody else did.",
              };
            })()
          : null,
        /* What the last bell meant to THIS desk. Null on day 1, and null for a
           pair that was not here for the day that just settled. */
        wire: wireFor(state, desk),
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

/**
 * The strongest way this desk can pay this player — where "strongest" is not
 * "reaches furthest".
 *
 * This used to be a straight max over the ceiling, and at Sacramento that
 * chose the big exception over the small one by $91,628 — and the big exception
 * draws its wall at the first apron, which Sacramento sits $6.1M under, so the
 * $91,628 bought a wall that ended the pair's lesson on day one. Grades 5-6
 * never see this choice; the product makes it for them. Making it that way was
 * indefensible.
 *
 * The order now: reach him at all, then leave the desk able to sign somebody
 * else afterwards, then reach furthest. A wall drawn $18M above where you stand
 * costs you nothing today and one drawn at your feet costs you everything, and
 * only the second of those is a reason to refuse a tool.
 */
function chooseTool(
  desk: Desk,
  player: FreeAgent,
  offers: readonly Offer[],
  board: readonly FreeAgent[],
  taken: ReadonlySet<string>,
): Offer | null {
  if (offers.length === 0) return null;
  const scored = dedupeByTool(offers).map((o) => {
    // Judge each tool at the price the pair will actually be shown, which is
    // the ask, not the ceiling — judging at the ceiling would reject tools that
    // are perfectly safe at the price anybody would really offer.
    const atAsk: Offer = { ...o, annual: o.tool === "minimum" ? o.annual : Math.min(o.annual, Math.max(player.ask.value, 0)) };
    const legal = checkOffer(desk.position, atAsk, player);
    const probe = legal.ok ? atAsk : o;
    return { offer: o, outlook: outlookAfter(desk.position, player, probe, board, taken) };
  });
  const alive = scored.filter((x) => !x.outlook.terminal);
  const pool = alive.length > 0 ? alive : scored;
  return pool.reduce((b, x) => (x.offer.annual > b.offer.annual ? x : b), pool[0]!).offer;
}

/* ------------------------------------------------------- what he did -- */

/** ".439" — a shooting percentage the way a scoreboard writes one, no leading zero. */
const pct = (v: number): string => v.toFixed(3).replace(/^0/, "");

/**
 * THE PRODUCTION LINE ON A CARD.
 *
 * The board used to print a price, a role and two sentences. That is a quality
 * ordering asserted by price alone, and on this board the real numbers
 * contradict it — the cheapest big out-scored every expensive one. So each card
 * now carries what the man actually did, and the two facts that make the price
 * honest: how old he was when he signed, and how long the real deal ran.
 *
 * FOUR NUMBERS BIG, NOT TEN. A ten-year-old reads a card in about three
 * seconds. Points, rebounds and assists are the three every child already
 * understands, and the fourth is the one that actually separates this player
 * from the next card in his role — blocks for a big, three-point shooting for a
 * guard or a wing. Without that fourth number Dosunmu and Grimes are the same
 * card at a $4.3M price gap.
 *
 * The fine line underneath is availability, which is where the older band's
 * extra reading budget goes: games, starts, minutes and shooting.
 */
function statLineFor(p: FreeAgent, profile: GradeProfile) {
  if (p.production === null) return null;
  const s: Production = p.production.value;
  const fourth =
    p.role === "BIG"
      ? { label: "BLK", value: s.blocks.toFixed(1) }
      : s.three === null
        ? { label: "FG%", value: pct(s.fg) }
        : { label: "3P%", value: pct(s.three) };
  const detail =
    profile.maxVariables >= 3
      ? `${s.games} GAMES · ${s.started} STARTS · ${s.minutes.toFixed(1)} MIN A NIGHT · ${pct(s.fg)} FROM THE FIELD`
      : `PLAYED ${s.games} GAMES`;
  return {
    season: s.season,
    /** "Last season" is never said in words — the season is printed, so it cannot rot. */
    label: `${s.season} · PER GAME`,
    big: [
      { label: "PTS", value: s.points.toFixed(1) },
      { label: "REB", value: s.rebounds.toFixed(1) },
      { label: "AST", value: s.assists.toFixed(1) },
      fourth,
    ],
    detail,
  };
}

/** The one number that fits in a list row beside a price. */
const rowStat = (p: FreeAgent): string | null =>
  p.production === null ? null : `${p.production.value.points.toFixed(1)} PTS`;

/**
 * What the price is, in the module's own words.
 *
 * Ten cards charge a real reported first-year salary. Two charge an average,
 * because no source stated their first year and working one out from a raise
 * ladder would be an invented dollar figure printed as an NBA fact (S8). A card
 * that is an average says so.
 */
const askNote = (p: FreeAgent): string | null =>
  p.askBasis === "average"
    ? `That is the average of his real ${p.years}-year deal. His exact first-year salary was never reported.`
    : null;

function boardCardsFor(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  const taken = new Set(state.taken);
  const interest = liveInterest(state);
  const pool = [...BOARD, ...MINIMUM_MARKET];
  return BOARD.filter((p) => !taken.has(p.id)).map((p) => {
    const offers = legalOffers(desk.position, [p], taken);
    const best = chooseTool(desk, p, offers, pool, taken);
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
      /* WHAT HE ACTUALLY DID, beside what he costs. Without this the board
         teaches that the expensive player is the better player, which on these
         twelve real contracts is close to backwards. */
      stat: statLineFor(p, profile),
      rowStat: rowStat(p),
      askNote: askNote(p),
      /* The two facts that make the price honest rather than a lesson in front
         office incompetence: the money is buying youth and years. */
      age: p.ageAtSigning,
      realYears: p.years,
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
          ? dedupeByTool(offers).map((o) => {
              const atAsk: Offer = { ...o, annual: o.tool === "minimum" ? o.annual : Math.min(o.annual, p.ask.value) };
              const look = outlookAfter(desk.position, p, checkOffer(desk.position, atAsk, p).ok ? atAsk : o, pool, taken);
              return {
                tool: o.tool,
                label: TOOL[o.tool].label,
                does: TOOL[o.tool].does,
                max: ceilingOf(o.tool, desk.position, p),
                maxText: money(ceilingOf(o.tool, desk.position, p) ?? 0),
                years: yearsFor(o.tool, p),
                maxYears: yearsFor(o.tool, p),
                drawsWall: TOOL[o.tool].drawsWallAt !== null,
                /* Where the wall would land, and whether it lands on top of
                   you. 7-8 chooses the tool, so 7-8 gets the consequence of
                   each one BEFORE choosing rather than after. */
                wallAtText: TOOL[o.tool].drawsWallAt ? money(LINE[TOOL[o.tool].drawsWallAt!]) : null,
                terminal: look.terminal,
                movesLeft: look.movesLeft,
              };
            })
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
              maxYears: yearsFor(best.tool, p),
              floor: Math.min(p.ask.value, ceilingOf(best.tool, desk.position, p) ?? best.annual),
              drawsWall: TOOL[best.tool].drawsWallAt !== null,
              wallAtText: TOOL[best.tool].drawsWallAt ? money(LINE[TOOL[best.tool].drawsWallAt!]) : null,
              /**
               * THE LAST-SIGNING WARNING, said before the click.
               *
               * When paying this player this way would leave the desk with no
               * legal move at all, the composer says so in the plainest
               * sentence the module owns. The constraint is real and stays
               * real — a club a few million under a hard cap genuinely does
               * get one signing and then stops — but a child is never allowed
               * to walk into it blind, and finding out two days later by
               * clicking every grey row is not finding out.
               */
              ...(() => {
                const atAsk: Offer = { ...best, annual: best.tool === "minimum" ? best.annual : Math.min(best.annual, p.ask.value) };
                const look = outlookAfter(desk.position, p, checkOffer(desk.position, atAsk, p).ok ? atAsk : best, pool, taken);
                return {
                  terminal: look.terminal,
                  movesLeft: look.movesLeft,
                  roomToWallText: look.roomToWall === null ? null : money(Math.max(0, look.roomToWall)),
                  lastSigningWarning: look.terminal
                    ? look.wallAt !== null
                      ? `This is your last signing of the window. Paying him this way draws a wall at ${money(look.wallAt)}, and it would leave you too close to it to add anybody else — not even a minimum.`
                      : `This is your last signing of the window. After it there is nobody left you could legally pay.`
                    : null,
                };
              })(),
            },
    };
  });
}

/**
 * Why this desk cannot reach this player — the BINDING constraint, in the words
 * of the choice that created it.
 *
 * This function used to take the first refusal in `Object.keys(TOOL)` order,
 * which begins with `room`, so every unreachable card on every screen said the
 * same thing: "You are over $164,961,000, so you have no cap room." Five
 * identical red paragraphs down one board, none of them the reason. The reason,
 * on day 2, was usually "you spent your small exception on Nikola Vucevic
 * yesterday" — yesterday's choice closing today's door, which is the entire
 * lesson, computable from state, and never printed.
 *
 * The order below is by what the sentence teaches, not by what the code
 * checked first:
 *
 *   1. A tool this desk SPENT, on a player it can name. Path dependence.
 *   2. A wall this desk DREW. Its own irreversible act.
 *   3. The tool that came CLOSEST and still fell short. A gap, with a number.
 *   4. The structural facts — over the cap, roster full — last, because they
 *      are true of the seat rather than of anything the pair did.
 */
function whyNot(position: Position, player: FreeAgent): string {
  const tools = Object.keys(TOOL) as ToolId[];
  const at = (t: ToolId, annual: number) => checkOffer(position, { playerId: player.id, tool: t, annual }, player);

  // 1. A spent tool that would otherwise have reached him.
  for (const t of tools) {
    if (!position.spent.includes(t)) continue;
    const hypothetical: Position = { ...position, spent: position.spent.filter((x) => x !== t) };
    const wouldHave = checkOffer(hypothetical, { playerId: player.id, tool: t, annual: player.ask.value }, player);
    if (!wouldHave.ok) continue;
    const on = position.signings.find((sg) => sg.tool === t);
    return on
      ? `${TOOL[t].label} would have reached him. You spent it on ${on.name}.`
      : `${TOOL[t].label} would have reached him. You have already used it this window.`;
  }

  // 2. A wall this desk drew itself.
  if (position.wall !== null) {
    const room = position.wall - position.committed;
    const anyFits = tools.some((t) => {
      const c = ceilingOf(t, position, player);
      return c !== null && Math.min(c, room) >= (t === "minimum" ? c : player.ask.value);
    });
    if (!anyFits) {
      return room > 0
        ? `You drew a wall at ${money(position.wall)} and you are ${money(room)} from it. He wants ${money(player.ask.value)}, so there is no way to fit him under it.`
        : `You drew a wall at ${money(position.wall)} and you are at it. You may not add a dollar for the rest of the year.`;
    }
  }

  // 3. The tool that came closest.
  let best: { tool: ToolId; ceiling: number } | null = null;
  for (const t of tools) {
    const c = ceilingOf(t, position, player);
    if (c === null) continue;
    if (best === null || c > best.ceiling) best = { tool: t, ceiling: c };
  }
  if (best !== null && best.ceiling < player.ask.value) {
    const short = player.ask.value - best.ceiling;
    return `The most you can pay him is ${money(best.ceiling)}, with ${TOOL[best.tool].label}. He is asking ${money(player.ask.value)} — you are ${money(short)} short.`;
  }

  // 4. Structural. Whichever refusal the tools actually produce.
  for (const t of tools) {
    const r = at(t, player.ask.value);
    if (!r.ok && ceilingOf(t, position, player) !== null) return r.reason;
  }
  const anyReason = tools.map((t) => at(t, player.ask.value)).find((r) => !r.ok);
  return anyReason && !anyReason.ok ? anyReason.reason : "There is no way for you to pay for him.";
}

/* ------------------------------------------------------------ the floor -- */

/**
 * THE FLOOR OF THE MARKET — the bodies nobody competes for.
 *
 * `world.ts` builds three generic minimum-scale veterans and says plainly why
 * they exist: "no club in this lesson is ever completely stuck." The engine has
 * always known about them — `resolveDay` takes `MARKET`, never `BOARD`, and
 * never puts a generic body in `taken`, so every club can sign one on the same
 * day. The sweep that proved the economics enumerated them.
 *
 * The product did not render them. `boardCardsFor` filtered `BOARD`, so the
 * anti-paralysis device existed in the model and was unreachable on the screen,
 * and a desk with no move had no move.
 *
 * They are deliberately NOT board rows. A board row is scarce, contested, and
 * disappears when somebody else takes it; these are none of those things, and
 * putting them in the same list would teach that they can be taken from you.
 * They are the floor: always there, same price for everyone, no bidding.
 */
function floorCardsFor(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  void state;
  void profile;
  return MINIMUM_MARKET.map((p) => {
    const ceiling = ceilingOf("minimum", desk.position, p);
    const fits = ceiling !== null;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      ask: TOOL.minimum.ceiling ?? 0,
      askText: money(TOOL.minimum.ceiling ?? 0),
      strength: p.strength,
      risk: p.risk,
      reachable: fits,
      unreachableReason: fits ? null : whyNot(desk.position, p),
      fillsAJob: desk.position.openJobs.includes(p.role as JobRole),
      // No box score and no age. He is a body at a price, and inventing either
      // would be inventing a person.
      stat: null,
      // No interest count. Nobody can take him from you, so a count would be a
      // lie dressed as pressure.
    };
  });
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
    /* What the console noticed so the teacher does not have to (D50 s8). */
    intel: intelligence(state, phase),
  };
}

/* -------------------------------------------------------------- the wire -- */

export type WireItem = {
  readonly kind: "won" | "lost" | "quiet" | "gone" | "shut";
  readonly headline: string;
  readonly detail: string;
};

/**
 * THE WIRE — what the bell means to THIS desk.
 *
 * The loudest recurring moment in the lesson was silent on the student device.
 * A desk that lost a contested player was told nothing: `pending` cleared, the
 * row vanished off the board, and the pair was left to infer from an absence.
 * The founder's whole social test — "does something another student does
 * meaningfully change what I can do next?" — was being answered by a row
 * quietly disappearing.
 *
 * So at the turn of every day, each desk is told, by name: what happened to the
 * offer it made, who got the player if it was not them, and which of the people
 * it could still have used came off the board while it was deciding. The
 * forgone list — frozen at the moment of commitment, by name, the best artifact
 * in the module — is delivered HERE, at the moment it means something, instead
 * of in a side column after the argument is over.
 *
 * WHAT THIS IS ALLOWED TO SAY. A signing is public the instant it settles: the
 * projector already prints player, club and price. So naming the club that beat
 * you is not a leak, it is the news. What stays private forever is what anyone
 * OFFERED — including the losing desk's own number, which is never shown to
 * anybody else, and the winner's number, which is public only because the
 * contract is.
 *
 * THE PHONE RULE. This is the model for every notification in the module: it
 * fires only when the world actually changed for the pair reading it, and it
 * says which of their plans is now dead.
 */
function wireFor(state: SameLineL1State, desk: Desk): { day: number; items: readonly WireItem[] } | null {
  const rec = state.history[state.history.length - 1];
  if (!rec) return null;
  // A pair is never handed news from a day they were not in the room for (D36).
  if (desk.joinedOnDay > rec.day) return null;

  const items: WireItem[] = [];
  const chasedId = rec.chased[desk.seatId];
  const club = CLUB[desk.clubId].name;

  if (chasedId) {
    const player = playerById(chasedId);
    const award = rec.awards.find((a) => a.playerId === chasedId);
    const mine = award !== undefined && (award.winner as unknown as string) === desk.seatId;
    if (player && award && mine) {
      const record = desk.forgoneAtCommit.find((f) => f.day === rec.day);
      const lost = record?.lost ?? [];
      items.push({
        kind: "won",
        headline: `${player.name.toUpperCase()} SIGNS WITH ${club.toUpperCase()}`,
        detail:
          lost.length === 0
            ? `${money(award.annual)} a year. He is yours.`
            : lost.length === 1
              ? `${money(award.annual)} a year. Making that signing put ${lost[0]} out of your reach — for good, not for today.`
              : `${money(award.annual)} a year. Making that signing put these out of your reach, for good: ${lost.join(", ")}.`,
      });
    } else if (player && award) {
      const rival = state.desks[award.winner as unknown as SeatId];
      const rivalName = rival ? CLUB[rival.clubId].name : "another club";
      items.push({
        kind: "lost",
        headline: `${player.name.toUpperCase()} SIGNS WITH ${rivalName.toUpperCase()}`,
        detail: `${money(award.annual)} a year. You were in on him. He is gone — not off your board for today, out of this window entirely. Your money is still yours.`,
      });
    }
  } else if (Object.keys(state.desks).length > 0) {
    items.push({
      kind: "quiet",
      headline: "YOU MADE NO OFFER",
      detail: "A club that does not bid signs nobody. Your money is untouched and the board is shorter.",
    });
  }

  /* Players who came off the board while this desk was deciding — but only the
     ones that were actually this desk's business: someone who could have filled
     a job it still has open. Everything else is another club's news. */
  const openJobs = new Set<string>(desk.position.openJobs);
  const collateral = rec.awards
    .filter((a) => a.playerId !== chasedId)
    .map((a) => ({ award: a, player: playerById(a.playerId) }))
    .filter((x) => x.player !== undefined && !x.player.generic && openJobs.has(x.player.role))
    .slice(0, 3);
  for (const { award, player } of collateral) {
    const rival = state.desks[award.winner as unknown as SeatId];
    items.push({
      kind: "gone",
      headline: `${player!.name.toUpperCase()} — GONE`,
      detail: `${rival ? CLUB[rival.clubId].name : "Another club"} signed him. You still need a ${player!.role.toLowerCase()}.`,
    });
  }

  /* And the fact that outranks all of them: this desk now has no legal move.
     Never a surprise the pair discovers by clicking every greyed row. */
  if (!state.windowClosed) {
    const taken = new Set(state.taken);
    const anyMove = [...BOARD, ...MINIMUM_MARKET].some(
      (p) => (p.generic || !taken.has(p.id)) && legalOffers(desk.position, [p], taken).length > 0,
    );
    if (!anyMove) {
      items.push({
        kind: "shut",
        headline: "YOU ARE DONE SIGNING",
        detail:
          desk.position.wall !== null
            ? `The wall you drew at ${money(desk.position.wall)} is now in front of everybody left. Your roster is what it is going to be.`
            : "There is nobody left you can legally pay. Your roster is what it is going to be.",
      });
    }
  }

  return items.length === 0 ? null : { day: rec.day + 1, items };
}

/* ------------------------------------------------------ class intelligence -- */

export type IntelItem = {
  readonly kind: "collision" | "contrast" | "divergence" | "watch";
  readonly label: string;
  readonly text: string;
  /** The question to put to the room. The teacher-transfer payload. */
  readonly ask: string;
};

/**
 * What the console notices so the teacher does not have to.
 *
 * D50 §8: the software runs normality, the teacher directs meaning. A teacher
 * standing in front of sixteen desks cannot read sixteen cap sheets and spot
 * that two clubs met the same problem and answered it in opposite directions.
 * The machine can, every second, for free.
 *
 * Every item here is computed from live state and carries the question to ask.
 * None of them ranks a desk against another — the ban on a class champion (D4)
 * binds the console exactly as it binds the projector. "Boston protected its
 * pick and New York spent one" is a contrast; "Boston is ahead" is not
 * available and never will be.
 *
 * `/teach` is the only surface that sees desk labels next to positions, which
 * is the point: it is the surface the teacher uses to decide whose table to
 * walk to next. Labels are club handles, never student names.
 */
function intelligence(state: SameLineL1State, phase: CanonicalPhase): readonly IntelItem[] {
  const desks = Object.values(state.desks);
  const out: IntelItem[] = [];
  if (desks.length < 2) return out;

  /* MARKET COLLISION — right now, live, before it settles. The single most
     useful thing a teacher can know while the room is still deciding. */
  if (phase === "PLAY") {
    const byPlayer = new Map<string, Desk[]>();
    for (const [seatId, p] of Object.entries(state.pending)) {
      const d = state.desks[seatId];
      if (!d || playerById(p.playerId)?.generic) continue;
      byPlayer.set(p.playerId, [...(byPlayer.get(p.playerId) ?? []), d]);
    }
    for (const [playerId, chasers] of byPlayer) {
      if (chasers.length < 2) continue;
      const player = playerById(playerId);
      out.push({
        kind: "collision",
        label: "MARKET COLLISION",
        text: `${chasers.length} desks are in on ${player?.name ?? "the same player"}: ${chasers.map((d) => d.label).join(", ")}. ${chasers.length - 1} of them will not get him.`,
        ask: `When the bell goes, ask the desks who missed: what did you plan to do with that money, and what will you do with it now?`,
      });
    }

    /* The same archetype, several ways. Position-level collision, which is the
       one that shows up as an argument rather than a coincidence. */
    const byRole = new Map<string, number>();
    for (const p of Object.values(state.pending)) {
      const role = playerById(p.playerId)?.role;
      if (!role) continue;
      byRole.set(role, (byRole.get(role) ?? 0) + 1);
    }
    for (const [role, n] of byRole) {
      if (n < 3) continue;
      out.push({
        kind: "collision",
        label: "MARKET COLLISION",
        text: `${n} franchises are chasing a ${role.toLowerCase()} at the same time.`,
        ask: `Ask the room: if everybody needs the same thing, what happens to its price? Who is buying somewhere else on purpose?`,
      });
    }
  }

  /* CONTRAST — two desks that met the same problem and answered it opposite
     ways. This is the discussion the teacher would otherwise have to find by
     reading every sheet. */
  const spenders = desks.filter((d) => d.position.signings.length > 0);
  const holders = desks.filter((d) => d.position.signings.length === 0 && d.joinedOnDay === 0);
  if (spenders.length > 0 && holders.length > 0 && state.day > 0) {
    const biggest = spenders.reduce((m, d) =>
      d.position.signings.reduce((t, sg) => t + sg.annual, 0) > m.position.signings.reduce((t, sg) => t + sg.annual, 0) ? d : m,
    );
    out.push({
      kind: "contrast",
      label: "CONTRAST",
      text: `${biggest.label} has committed ${money(biggest.position.signings.reduce((t, sg) => t + sg.annual, 0))} a year. ${holders.length === 1 ? `${holders[0]!.label} has` : `${holders.length} desks have`} spent nothing and can still move on anybody.`,
      ask: `Put them against each other: is holding your money patience, or is it being scared? Make both sides say what they are waiting for.`,
    });
  }

  /* The desks that have shut their own door. Not a failing — several of them
     did it on purpose — but a teacher must know before walking over that a
     silent table is silent because it is finished, not because it is stuck. */
  const walled = desks.filter((d) => d.position.wall !== null);
  if (walled.length > 0 && phase === "PLAY") {
    out.push({
      kind: "watch",
      label: "WALLS DRAWN",
      text: `${walled.map((d) => d.label).join(", ")} ${walled.length === 1 ? "has" : "have"} drawn a wall. Whatever happens for the rest of this window, ${walled.length === 1 ? "that desk" : "those desks"} cannot cross it.`,
      ask: `Ask one of them out loud: what would have to happen today for you to wish you had that back?`,
    });
  }

  /* The desks with nothing left to do. The console must surface these before
     the pair goes quiet, because a bored pair looks identical to a thinking
     one from the front of the room. */
  if (phase === "PLAY" && !state.windowClosed) {
    const taken = new Set(state.taken);
    const stuck = desks.filter(
      (d) =>
        !state.pending[d.seatId] &&
        ![...BOARD, ...MINIMUM_MARKET].some(
          (p) => (p.generic || !taken.has(p.id)) && legalOffers(d.position, [p], taken).length > 0,
        ),
    );
    if (stuck.length > 0) {
      out.push({
        kind: "watch",
        label: "NO LEGAL MOVE",
        text: `${stuck.map((d) => d.label).join(", ")} ${stuck.length === 1 ? "has" : "have"} no legal signing left. They are finished, not stalling.`,
        ask: `Give them the room's job: have them watch a desk that is still deciding and predict what it will do.`,
      });
    }
  }

  /* DIVERGENCE — the room split on the module's own subject. Only once the
     room has actually done something. */
  if (state.day > 0) {
    const overApron = desks.filter((d) => d.position.committed >= LINE["apron1"]).length;
    const underCap = desks.filter((d) => d.position.committed < LINE["cap"]).length;
    if (overApron > 0 && underCap > 0) {
      out.push({
        kind: "divergence",
        label: "DISCUSSION OPPORTUNITY",
        text: `${overApron} desks are past the first apron and ${underCap} are still under the cap. They are playing the same three days under different rules.`,
        ask: `Ask an apron desk and a cap-room desk the same question — "what can you do tomorrow that they cannot?" — and let them find out the answers are different.`,
      });
    }
  }

  return out;
}

/* ------------------------------------------------- the room disagrees -- */

/**
 * What the projector shows instead of a leaderboard.
 *
 * The founder's mockup put a live ranked "WHO'S WINNING RIGHT NOW" in this
 * slot, and the same brief forbids a universal class champion two sections
 * later. Both instincts are right: the room must feel alive, and no desk may be
 * told it is losing while it still has moves.
 *
 * The resolution is DISAGREEMENT. Every line below is a computed fact about the
 * class, no desk sits above another, and each one is an argument the teacher can
 * open in the next breath. It makes a room look up harder than a ranking does,
 * because the question is unresolved.
 *
 * Every line is a claim atom (BC-20), never a bare template literal, so the
 * audit recomputes what each sentence asserts rather than proof-reading it.
 */
function roomDisagrees(state: SameLineL1State, phase: CanonicalPhase): readonly Claimed[] {
  const desks = Object.values(state.desks);
  const out: Claimed[] = [];
  if (desks.length === 0) return out;

  /* 1. The same player, wanted by many. During an open day this is the live
     count; afterwards it is what the settled day recorded. Either way it is a
     count of desks and never a name or a price. */
  const interest =
    phase === "PLAY"
      ? liveInterest(state)
      : (state.history[state.history.length - 1]?.interest ?? {});
  let hottest: { id: string; n: number } | null = null;
  for (const [id, n] of Object.entries(interest)) {
    if (!hottest || n > hottest.n) hottest = { id, n };
  }
  if (hottest && hottest.n >= 2) {
    const player = playerById(hottest.id);
    const n = claim("rd-contested", hottest.n, "int", { assertsSign: "positive", bounds: { min: 2 } });
    const role = player?.role ?? "player";
    out.push({
      text: `${n.rendered} desks want the same ${role.toLowerCase()}. Only one of them can have him, and the others will spend the rest of this window on their second choice.`,
      board: `${n.rendered} DESKS WANT THE SAME ${role}`,
      claims: [n],
    });
  }

  /* 2. Spent against unspent. The single widest split in the room and the one
     a teacher can always turn into an argument: is holding your money patience
     or paralysis? The lesson must not answer it. */
  const spent = desks.filter((d) => d.position.signings.length > 0).length;
  const held = desks.length - spent;
  if (spent > 0 && held > 0) {
    const a = claim("rd-spent", spent, "int", { assertsSign: "positive" });
    const b = claim("rd-held", held, "int", { assertsSign: "positive" });
    out.push({
      text: `${a.rendered} desks have committed money. ${b.rendered} have not spent a dollar. Neither group is ahead — they have bought different things, and one of them bought the ability to change its mind.`,
      board: `${a.rendered} HAVE SPENT · ${b.rendered} HAVE NOT`,
      claims: [a, b],
    });
  }

  /* 3. Which side of which line the room sits on. The module's whole subject,
     rendered as a split rather than a ranking. */
  const overApron = desks.filter((d) => d.position.committed >= LINE["apron1"]).length;
  const underCap = desks.filter((d) => d.position.committed < LINE["cap"]).length;
  if (overApron > 0 && underCap > 0) {
    const a = claim("rd-over-apron", overApron, "int", { assertsSign: "positive" });
    const b = claim("rd-under-cap", underCap, "int", { assertsSign: "positive" });
    out.push({
      text: `${a.rendered} desks are past the first apron and ${b.rendered} are still under the cap. They are playing the same three days under different rules, and none of them chose which.`,
      board: `${a.rendered} PAST THE APRON · ${b.rendered} UNDER THE CAP`,
      claims: [a, b],
    });
  }

  /* 4. Same money, different result. The reading that breaks "spend more, get
     more" without ever printing a score. */
  const byJobs = desks
    .map((d) => ({
      closed: d.position.signings.filter((sg) => CLUB[d.clubId].jobs.includes(sg.role)).length,
      spend: d.position.signings.reduce((t, sg) => t + sg.annual, 0),
    }))
    .filter((x) => x.spend > 0);
  if (byJobs.length >= 2) {
    const most = byJobs.reduce((m, x) => (x.closed > m.closed ? x : m), byJobs[0]!);
    const dearest = byJobs.reduce((m, x) => (x.spend > m.spend ? x : m), byJobs[0]!);
    if (most.closed > dearest.closed) {
      const a = claim("rd-cheap-jobs", most.closed, "int", { assertsSign: "positive" });
      const b = claim("rd-dear-spend", dearest.spend, "money", { assertsSign: "positive" });
      const c = claim("rd-dear-jobs", dearest.closed, "int", { assertsSign: "nonNegative" });
      out.push({
        text: `The desk that closed the most holes closed ${a.rendered} of them. The desk that spent the most spent ${b.rendered} a year and closed ${c.rendered}. Spending more did not buy more here.`,
        board: `MOST HOLES CLOSED: ${a.rendered} · BIGGEST SPENDER CLOSED: ${c.rendered}`,
        claims: [a, b, c],
      });
    }
  }

  return out;
}

/**
 * BEAT 1 — "THE SAME PLAYER COST EVERY DESK A DIFFERENT THING."
 *
 * The module's thesis, and it shipped as a sentence over empty space. The data
 * for it has existed since the first day the reducer ran: `forgoneAtCommit`
 * freezes, per desk and per signing, the names that commitment put out of
 * reach. One player, the desks that chased him, and the three frozen lists side
 * by side is the whole argument, and it is a table.
 *
 * Chosen as the most contested named player of the window, because that is the
 * one the room will remember arguing about. Clubs, never students — a settled
 * signing is public, a child's name is not.
 */
function beatSamePlayer(state: SameLineL1State) {
  let pick: { id: string; n: number } | null = null;
  for (const rec of state.history) {
    for (const [id, n] of Object.entries(rec.interest)) {
      if (!pick || n > pick.n) pick = { id, n };
    }
  }
  if (!pick || pick.n < 2) return null;
  const player = playerById(pick.id);
  if (!player) return null;
  const day = state.history.find((r) => (r.interest[pick!.id] ?? 0) === pick!.n);
  if (!day) return null;
  const award = day.awards.find((a) => a.playerId === pick!.id);

  /* A projector cannot scroll. Four clubs is already a wall of evidence, and a
     fifth column shrinks the type below what the back row can read. */
  const MAX_CHASERS = 4;
  const MAX_LOST = 5;
  const chasers = Object.entries(day.chased)
    .filter(([, id]) => id === pick!.id)
    .map(([seatId]) => state.desks[seatId])
    .filter((d): d is Desk => d !== undefined)
    // The club that got him first: it is the column the room looks at.
    .sort((x, y) => {
      const w = (d: Desk) => (award !== undefined && (award.winner as unknown as string) === d.seatId ? 0 : 1);
      return w(x) - w(y);
    })
    .slice(0, MAX_CHASERS)
    .map((d) => {
      const won = award !== undefined && (award.winner as unknown as string) === d.seatId;
      const record = d.forgoneAtCommit.find((f) => f.day === day.day && f.signed === player.name);
      return {
        club: CLUB[d.clubId].name,
        desk: d.label,
        won,
        // What it cost the club that got him: the names its own commitment
        // closed off. What it cost the others: the day, and the plan.
        lost: won ? (record?.lost ?? []).slice(0, MAX_LOST) : [],
        lostMore: won ? Math.max(0, (record?.lost ?? []).length - MAX_LOST) : 0,
        outcome: won
          ? `SIGNED HIM AT ${money(award!.annual)}`
          : `MISSED, AND SPENT THE DAY DOING IT`,
      };
    });
  if (chasers.length < 2) return null;
  return {
    player: player.name,
    role: player.role,
    askText: money(player.ask.value),
    chasers,
    /* The line that makes it an argument rather than a result table. */
    foot:
      chasers.some((c) => c.won && c.lost.length > 0)
        ? `One club has him. It paid for him twice — once in money, and once in the people it can no longer have.`
        : `One club has him. Every other club here spent a day of a three-day window finding that out.`,
  };
}

/**
 * BEAT 2 — "THE SAME MOVE, TWO BOOKS."
 *
 * Two desks hold every club. That is not a seating convenience: it is the
 * module's only controlled experiment, the one thing that separates "what you
 * did" from "what you were dealt". This beat finds the twin pair that diverged
 * furthest and puts their two books next to each other, opened from the same
 * page on the same morning.
 */
function beatTwoBooks(state: SameLineL1State) {
  const byClub = new Map<ClubId, Desk[]>();
  for (const d of Object.values(state.desks)) {
    byClub.set(d.clubId, [...(byClub.get(d.clubId) ?? []), d]);
  }
  let best: { club: ClubId; a: Desk; b: Desk; gap: number } | null = null;
  for (const [club, desks] of byClub) {
    if (desks.length < 2) continue;
    const [a, b] = [desks[0]!, desks[1]!];
    // Divergence measured on what they DID, not on who is "ahead": the number
    // of different people signed, plus whether they ended on different sides of
    // a line. Never a score.
    const namesA = new Set(a.position.signings.map((sg) => sg.playerId));
    const namesB = new Set(b.position.signings.map((sg) => sg.playerId));
    const different = [...namesA].filter((x) => !namesB.has(x)).length + [...namesB].filter((x) => !namesA.has(x)).length;
    const walls = (a.position.wall === null) !== (b.position.wall === null) ? 1 : 0;
    const gap = different + walls;
    if (gap > 0 && (best === null || gap > best.gap)) best = { club, a, b, gap };
  }
  if (!best) return null;
  const side = (d: Desk) => ({
    desk: d.label,
    signings: d.position.signings.map((sg) => ({ name: sg.name, priceText: money(sg.annual), years: sg.years })),
    committedText: money(d.position.committed),
    wallText: d.position.wall === null ? "no wall drawn" : `walled at ${money(d.position.wall)}`,
    openText: d.position.openJobs.length === 0 ? "every hole filled" : `${d.position.openJobs.length} still open`,
  });
  return {
    club: CLUB[best.club].name,
    openingText: money(openingPosition(best.club).committed),
    a: side(best.a),
    b: side(best.b),
    foot: `Same club. Same money. Same board, the same morning. Everything below the first line is a choice somebody in this room made.`,
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
    beats: REVEAL_BEATS,
    remaining: BOARD.filter((p) => !state.taken.includes(p.id)).length,
    desks: Object.keys(state.desks).length,
    offersIn: Object.keys(state.pending).length,
    windowClosed: state.windowClosed,
    /* The market as the room can see it: who is still there, and how many desks
       want each of them. A count, never a club and never a price — the board is
       structurally never handed a seat identity and this keeps it that way even
       though the information is genuinely about the seats. */
    market: (() => {
      const interest = phase === "PLAY" ? liveInterest(state) : {};
      const taken = new Set(state.taken);
      return BOARD.filter((p) => !taken.has(p.id)).map((p) => ({
        name: p.name,
        role: p.role,
        askText: money(p.ask.value),
        /* PRICE AND PRODUCTION IN THE SAME ROW, ON THE WALL.
           The inversion this board rests on -- the cheapest big out-scoring
           every expensive one -- is only an argument if the room can see both
           columns at once. On a student's device it takes a click; here it is
           the whole point of putting the market on a wall. */
        statText: p.production === null ? "" : `${p.production.value.points.toFixed(1)}`,
        age: p.ageAtSigning,
        interest: interest[p.id] ?? 0,
      }));
    })(),
    disagreements: roomDisagrees(state, phase).map((c) => ({ text: c.text, board: onBoard(c) })),
    /* Beats 1 and 2 shipped as title cards over empty space. The data for both
       has been in state since the first day the reducer ran. */
    samePlayer: beatSamePlayer(state),
    twoBooks: beatTwoBooks(state),
  };
}

function deskClubOf(state: SameLineL1State, seatId: string): ClubId | null {
  return state.desks[seatId]?.clubId ?? null;
}

export { settle, yearsFor, MINIMUM_MARKET, ROSTER, LINE, bandOf };
