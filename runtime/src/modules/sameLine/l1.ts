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
  jobClosingSignings,
  roomLeftText,
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

/**
 * The first open front office on one club, or null when both are held.
 *
 * ONE STUDENT = ONE FRANCHISE (D59 ruling 1). A student chooses the club they
 * will run; two independent franchises may start from the same club's books,
 * and the second is told so before it commits to anything. The choice is the
 * student's first act of ownership and it is theirs, not the room's — `takeSeat`
 * stays as the fallback for a desk that would rather be dealt one.
 */
function freeTwinFor(state: SameLineL1State, clubId: ClubId): 0 | 1 | null {
  const held = Object.values(state.desks).filter((d) => d.clubId === clubId);
  if (!held.some((d) => d.twin === 0)) return 0;
  if (!held.some((d) => d.twin === 1)) return 1;
  return null;
}

function seatDesk(state: SameLineL1State, seatId: SeatId, clubId: ClubId, twin: 0 | 1): SameLineL1State {
  const desk: Desk = {
    seatId,
    clubId,
    twin,
    label: deskLabel(clubId, twin),
    position: openingPosition(clubId),
    joinedOnDay: state.day,
    forgoneAtCommit: [],
  };
  return { ...state, desks: { ...state.desks, [seatId]: desk } };
}

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
      return { ok: true, state: seatDesk(state, ctx.seatId, next.clubId, next.twin) };
    }

    /* ---- choosing a club. The student's first act of ownership: which
       franchise is theirs. Refused, with the reason, when both front offices
       on that club are already held — the student picks again, and nothing
       about the room changed. ---- */
    case "chooseClub": {
      if (ctx.seatId === "teacher") return fail("a teacher does not hold a desk");
      if (state.desks[ctx.seatId]) return { ok: true, state }; // already seated; a retry is not an error
      if (state.observers.includes(ctx.seatId)) return { ok: true, state };
      if (state.windowClosed || ctx.phase === "COMPLETE") {
        return { ok: true, state: { ...state, observers: [...state.observers, ctx.seatId] } };
      }
      const clubId = String(action["clubId"] ?? "");
      const club = CLUBS.find((c) => c.id === clubId);
      if (!club) return fail("that is not one of this room's clubs");
      const twin = freeTwinFor(state, club.id);
      if (twin === null) return fail(`Both front offices at ${club.name} are taken. Pick another club.`);
      return { ok: true, state: seatDesk(state, ctx.seatId, club.id, twin) };
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
     * exception, worth $15,044,000. "Cap space" sounds like the good outcome
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
      const last = beatCountFor(state, ctx.phase);
      if (last === null) return fail("there is no reveal running");
      return { ok: true, state: { ...state, beat: Math.min(state.beat + 1, last - 1) } };
    }
    case "teacher:revealBack": {
      if (beatCountFor(state, ctx.phase) === null) return fail("there is no reveal running");
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

/* --------------------------------------------------------- the naming -- */

/**
 * THE STAGE THE SIMULATION DOES NOT REPLACE.
 *
 * CLAUDE.md §1: experience -> consequence -> adaptation -> class evidence ->
 * argument -> **explicit economics formalization**. Students meet the mechanism
 * first; then the teacher names it — "that thing you just experienced has a
 * name: opportunity cost." That last stage is not polish. Without it the room
 * has had an afternoon and not a lesson, and an economic-truth prosecution
 * looking for the map from the five readings to named concepts found that no
 * such map existed anywhere in the runtime: SYNTHESIS shipped the readings and
 * a placeholder reading "Look up — this part is the whole room's."
 *
 * FOUR RULES, and the first is the one that makes this worth building.
 *
 * 1. THE NAME IS EARNED, NEVER ASSERTED. Every naming opens with what THIS
 *    room did, in this room's own numbers, computed from live state. A slide
 *    that says "scarcity means limited resources" teaches a definition. A wall
 *    that says "six of your eight desks needed a big. There were four bigs any
 *    of you could reach. Two of you went home without one" teaches the thing,
 *    and the word arrives as a label for something already felt. When the room
 *    did not produce the evidence for a concept, that concept is NOT SHOWN —
 *    a naming with an invented moment is worse than no naming.
 * 2. THE BAND DECIDES THE LIST. 5-6 gets exactly two, scarcity and opportunity
 *    cost, and only here. 7-8 gets those two plus the pair that need the
 *    younger band's two to stand on: that the lines are a rule people wrote,
 *    and that competition, not the seller, set the price.
 * 3. IT LEAVES BASKETBALL. Every naming ends outside sport, because a concept
 *    that only exists inside the simulation was never a concept.
 * 4. NO SCORE. The naming names what happened. It does not rank who did it
 *    best (D50 s10).
 */
type Naming = {
  readonly id: string;
  readonly term: string;
  /** What the ROOM did, in the room's numbers. Null when the room did not do it. */
  readonly moment: string;
  readonly means: string;
  /** The dated, sourced real sports-business fact (D62) — never improvised aloud. */
  readonly real: string;
  readonly outside: string;
};

function namings(state: SameLineL1State, profile: GradeProfile): readonly Naming[] {
  const desks = Object.values(state.desks);
  const out: Naming[] = [];
  if (desks.length === 0) return out;

  const awards = state.history.flatMap((h) => h.awards);
  const namedAwards = awards.filter((a) => !playerById(a.playerId)?.generic);

  /* ---- SCARCITY. The room wanted more of something than the board held. ---- */
  const roleCounts = new Map<string, number>();
  for (const d of desks) for (const r of CLUB[d.clubId].jobs) roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
  let worst: { role: string; wanted: number; had: number } | null = null;
  for (const [role, wanted] of roleCounts) {
    const had = BOARD.filter((p) => p.role === role).length;
    if (!worst || wanted - had > worst.wanted - worst.had) worst = { role, wanted, had };
  }
  const stillOpen = desks.filter((d) => d.position.openJobs.length > 0).length;
  if (worst !== null && worst.wanted > worst.had) {
    out.push({
      id: "scarcity",
      term: "SCARCITY",
      moment:
        `${worst.wanted} desks in this room needed a ${worst.role.toLowerCase()}. This board had ${worst.had} of them, and everybody could see everybody else's board. ` +
        (stillOpen > 0
          ? `${stillOpen} ${stillOpen === 1 ? "desk" : "desks"} finished the window with a hole still open.`
          : `Every hole got filled — and every desk fished from the same shrinking board to do it.`),
      means:
        profile.maxVariables >= 3
          ? "There was not enough of the thing everybody wanted to go round. That is not a mistake anybody made — it is the starting condition, and it is what makes every other decision today a real one."
          : "There was not enough of what everybody wanted. Nobody did that on purpose. It is just how the summer started.",
      real: "In the summer of 2026 only three NBA teams — Brooklyn, Chicago and the Lakers — had spending room under the cap. Every other club in the league was shopping the same list of free agents, and the rules capped what most of them could offer a player who was not already theirs at about $15 million a year. Same board for thirty teams, and not enough of it to go round.",
      outside:
        profile.maxVariables >= 3
          ? "It is why concert tickets sell out, why there is a queue for the good bagel place at 9am and none at 3pm, and why your school has to choose between a new gym floor and new laptops."
          : "It is the same reason there is a line for the good swings at recess. There are three swings and eleven people who want one.",
    });
  }

  /* ---- OPPORTUNITY COST. Somebody's own signing closed their own doors. ---- */
  const withCost = desks
    .map((d) => {
      const rec = d.forgoneAtCommit.filter((f) => f.lost.length > 0).sort((a, b) => b.lost.length - a.lost.length)[0];
      return rec ? { desk: d, rec } : null;
    })
    .filter((x): x is { desk: Desk; rec: Desk["forgoneAtCommit"][number] } => x !== null)
    .sort((a, b) => b.rec.lost.length - a.rec.lost.length)[0];
  if (withCost !== undefined) {
    const n = withCost.rec.lost.length;
    /* A projector cannot scroll and a wall of ten names stops being read. Six
       is still a weight; the rest are counted so nothing is hidden. */
    const SHOWN = 6;
    const names =
      n <= SHOWN
        ? withCost.rec.lost.join(", ")
        : `${withCost.rec.lost.slice(0, SHOWN).join(", ")}, and ${n - SHOWN} more`;
    out.push({
      id: "opportunity-cost",
      term: "OPPORTUNITY COST",
      moment:
        `${CLUB[withCost.desk.clubId].name} signed ${withCost.rec.signed}. The same moment it did, ${n} other ${n === 1 ? "player" : "players"} went out of its reach: ${names}. ` +
        `Nobody took them away. No rival outbid it for them. Its own signing did that.`,
      means:
        profile.maxVariables >= 3
          ? "The real price of anything is not the money. It is the best thing you could no longer do once you had done it — and you pay that price whether or not you ever notice it."
          : "What something really costs you is the next-best thing you gave up to get it. Not the money. The other thing.",
      real: "On July 4, 2016, Kevin Durant chose Golden State. To fit his contract under the cap, the Warriors traded Andrew Bogut to Dallas and let five of their own free agents go, Harrison Barnes among them. Nobody made them do it and nobody outbid them — signing one player is what made keeping the others impossible.",
      outside:
        profile.maxVariables >= 3
          ? "The hour you spent on this lesson is an hour you did not spend on anything else, and that hour is the real price of it — not the room, not the electricity."
          : "If you spend your Saturday at a friend's house, the cost is not zero. It is the thing you would have done instead.",
    });
  }

  if (profile.maxVariables < 3) return out;

  /* ---- THE LINES ARE A RULE PEOPLE WROTE. 7-8 only. ---- */
  const blocked = desks.filter((d) => d.position.wall !== null).length;
  const overApron = desks.filter((d) => d.position.committed > LINE.apron1).length;
  if (blocked > 0 || overApron > 0) {
    out.push({
      id: "institution",
      term: "AN INSTITUTION",
      moment:
        `${overApron > 0 ? `${overApron} of these desks finished past the first apron. ` : ""}` +
        `${blocked > 0 ? `${blocked} drew a wall they cannot cross for the rest of the year — not for anybody, whatever happens in January. ` : ""}` +
        `Not one of those lines is a law of nature. Thirty clubs and the players' union sat in a room and agreed on where to draw them, and they will argue about where to draw them again.`,
      means:
        "An institution is a rule people made and then have to live inside. It shapes every choice made under it — and it can be changed, which is why the argument about it never stops.",
      real:
        "As of July 10, 2026, 22 of the NBA's 30 teams were hard-capped and could not cross an apron line for any reason the rest of the season. Nobody on one team decided where that line sits — the league and the players' union negotiated it into the rulebook years before. Almost three-quarters of the league was living inside a wall it did not get to redraw that day.",
      outside:
        "Speed limits, the school day starting at 8:15, the offside rule, who is allowed to vote. Every one of them was decided by people, and every one of them changes what everybody else can do.",
    });
  }

  /* ---- COMPETITION SET THE PRICE, NOT THE SELLER. 7-8 only. ---- */
  const overAsk = namedAwards
    .map((a) => ({ a, p: playerById(a.playerId) }))
    .filter((x) => x.p !== undefined && x.a.contested > 1 && x.a.annual > x.p.ask.value)
    .sort((x, y) => y.a.annual - y.p!.ask.value - (x.a.annual - x.p!.ask.value))[0];
  if (overAsk !== undefined) {
    const over = overAsk.a.annual - overAsk.p!.ask.value;
    out.push({
      id: "price-from-competition",
      term: "COMPETITION SETS PRICE",
      moment:
        `${overAsk.p!.name} asked ${money(overAsk.p!.ask.value)}. ${overAsk.a.contested} desks went in on him and he signed for ${money(overAsk.a.annual)} — ${money(over)} more than he asked for. ` +
        `He never raised his price. The other desks in this room raised it.`,
      means:
        "A price is not a number the seller decides. It is what the competition to buy the thing settles on — which is why the same player is cheap in a quiet market and dear in a crowded one.",
      real: "On July 7, 2025, Myles Turner signed with Milwaukee for four years and $108.9 million. He had spent his whole career in Indiana and Indiana did not keep him. The day before, Milwaukee had waived Damian Lillard and taken on the $103 million still owed to him — that is what a second interested club was willing to do, and a second interested club is what set Turner's price.",
      outside:
        "It is why the same flight costs three times as much the week of a holiday, and why a house on a street everyone wants sells above what the owner asked.",
    });
  }

  return out;
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
  /* The naming starts at its first name, not wherever the reveal left the
     counter. Both stages walk `beat`, and a teacher arriving at SYNTHESIS on
     beat 3 would open on the last concept and be unable to go forward. */
  onPhaseExit: (state, _from, to) => (to === "SYNTHESIS" ? { ...state, beat: 0 } : state),
  allowedActions: (phase) =>
    phase === "PLAY" ? ["chooseClub", "takeSeat", "offer", "pass", "declareOverCap"] : phase === "LOBBY" || phase === "HOOK" ? ["chooseClub", "takeSeat"] : [],

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

  // The Press Conference primitive (runtime-owned pause + spotlight) asks the
  // module two pure questions; both are defined below the object so the
  // privacy argument sits next to the code that keeps it.
  spotlightView: (state, seatId, phase) => spotlightViewFor(state, seatId, phase),
  pressCandidates: (state, phase) => pressCandidatesFor(state, phase),
};

/* ------------------------------------------------------- the podium -- */

/**
 * THE PODIUM — what the projector may show about ONE desk during a Press
 * Conference (Bible §12.1B). The runtime owns the pause; this decides what is
 * public. The rule is the same one the reveal already obeys: a signing that
 * has settled is a fact of the league, an offer still pending on an open day
 * is that desk's alone. So nothing here reads `pending`, ever, and a desk
 * called to the podium mid-day is shown its settled history and its frozen
 * forgone lists — what it knew, what it chose, what it gave up — never the
 * price it has in the air right now.
 */
export function spotlightViewFor(state: SameLineL1State, seatId: SeatId, phase: CanonicalPhase): unknown {
  const desk = state.desks[seatId];
  if (!desk) return null;
  const club = CLUB[desk.clubId];
  const profile = bandProfile(state);
  const signings = desk.position.signings.map((sg) => ({
    name: sg.name,
    role: sg.role,
    annualText: money(sg.annual),
    tool: TOOL[sg.tool].label,
    years: sg.years,
  }));
  const forgone = desk.forgoneAtCommit.map((f) => ({ day: f.day + 1, signed: f.signed, atPriceText: money(f.atPrice), lost: f.lost }));
  // The days this desk went after somebody and did not get him — settled
  // history, so public; it is what the wire showed the whole room already.
  const chased = state.history
    .filter((h) => h.chased[seatId] && !h.awards.some((a) => (a.winner as unknown as string) === seatId))
    .map((h) => ({ day: h.day + 1, name: playerById(h.chased[seatId]!)?.name ?? "somebody" }))
    .filter((c) => c.name !== "somebody");
  return {
    module: SAME_LINE_L1_ID,
    label: desk.label,
    club: club.name,
    situation: club.situation,
    day: Math.min(state.day + 1, DAYS),
    ofDays: DAYS,
    windowClosed: state.windowClosed,
    committedText: money(desk.position.committed),
    standing: standingOf(desk.position.committed, profile),
    openJobs: desk.position.openJobs,
    signings,
    forgone,
    chased,
    /* The instructor's opening line, deadpan, attacking the decision and never
       the person (§12.2). The console offers it; the teacher says it. */
    openingQuestion: openingQuestionFor(desk, chased.length > 0, phase),
  };
}

function openingQuestionFor(desk: Desk, lostSomeone: boolean, phase: CanonicalPhase): string {
  const last = desk.forgoneAtCommit[desk.forgoneAtCommit.length - 1];
  if (last && last.lost.length > 0) {
    return `You signed ${last.signed} at ${money(last.atPrice)} and that put ${last.lost.slice(0, 2).join(" and ")} out of reach. Why him?`;
  }
  if (last) return `You signed ${last.signed} at ${money(last.atPrice)}. What did that cost you?`;
  if (lostSomeone) return "You went after him and somebody else got him. What do you do now?";
  if (desk.position.openJobs.length > 0 && phase === "PLAY") {
    return `You still have ${desk.position.openJobs.length === 1 ? "a hole" : "holes"} to fill and you have signed nobody. What are you waiting for?`;
  }
  return "Walk us through your first move.";
}

/**
 * WHO TO CALL — ranked by interesting reasoning, contrast, risk, reversal and
 * ambiguity; never by the best desk, the highest number or correctness
 * (Bible §12.2, FOUNDER LOCKED). Every signal below is a fact the reducer
 * already holds; nothing is a grade. Teacher-only: the runtime relays this
 * to `/teach` and nowhere else.
 */
export function pressCandidatesFor(state: SameLineL1State, _phase: CanonicalPhase): readonly { seatId: SeatId; label: string; why: string }[] {
  const desks = Object.values(state.desks);
  const byClub = new Map<ClubId, Desk[]>();
  for (const d of desks) byClub.set(d.clubId, [...(byClub.get(d.clubId) ?? []), d]);
  const scored = desks.map((d) => {
    let score = 0;
    const why: string[] = [];
    // CONTRAST — the twin desk went a different way from the same books.
    const twin = (byClub.get(d.clubId) ?? []).find((o) => o.seatId !== d.seatId);
    if (twin && twin.position.committed !== d.position.committed) {
      const gap = Math.abs(twin.position.committed - d.position.committed);
      score += 3;
      why.push(`${money(gap)} apart from ${twin.label}, from the same books`);
    }
    // REVERSAL — chased somebody, lost him, then signed somebody else.
    const lostDays = state.history.filter((h) => h.chased[d.seatId] && !h.awards.some((a) => (a.winner as unknown as string) === d.seatId));
    const signedAfterLoss = lostDays.length > 0 && d.forgoneAtCommit.some((f) => f.day > lostDays[0]!.day);
    if (signedAfterLoss) {
      score += 3;
      why.push("lost the player they went after, then signed somebody else");
    } else if (lostDays.length > 0) {
      score += 1;
      why.push("went after somebody and did not get him");
    }
    // RISK — the biggest tool spent, or the cap declared crossed.
    if (d.position.overCapDeclared) {
      score += 2;
      why.push("declared over the cap on purpose");
    }
    const bigForgone = d.forgoneAtCommit.find((f) => f.lost.length >= 3);
    if (bigForgone) {
      score += 2;
      why.push(`one signing put ${bigForgone.lost.length} names out of reach`);
    }
    // AMBIGUITY — holes still open with the window closing, or signed nobody.
    if (d.position.signings.length === 0 && state.day >= 1) {
      score += 2;
      why.push(`signed nobody through day ${Math.min(state.day, DAYS)}`);
    } else if (d.position.openJobs.length > 0 && state.day >= DAYS - 1) {
      score += 1;
      why.push(`still has ${d.position.openJobs.length === 1 ? "a hole" : "holes"} open late in the window`);
    }
    return { seatId: d.seatId, label: d.label, score, why: why.join(" · ") || "a plain run so far — a fair first podium" };
  });
  // Stable: score, then the world's club order, then twin, so the list does
  // not shuffle under the teacher's cursor between polls.
  const order = new Map(CLUBS.map((c, i) => [c.id, i]));
  return scored
    .sort((a, b) => b.score - a.score || order.get(state.desks[a.seatId]!.clubId)! - order.get(state.desks[b.seatId]!.clubId)! || state.desks[a.seatId]!.twin - state.desks[b.seatId]!.twin)
    .map(({ seatId, label, why }) => ({ seatId, label, why }));
}

/* ----------------------------------------------------------------- views -- */

function bandProfile(state: SameLineL1State): GradeProfile {
  return profileFor(state.gradeBand);
}

/**
 * Where a club stands, in the words the band's ladder uses. Never a signed
 * number: the side is a word, and at 5-6 only the two live lines are named.
 */
function standingOf(committed: number, profile: GradeProfile): string {
  const band = bandOf(committed);
  if (profile.band === "5-6") {
    if (band === "under-floor" || band === "under-cap") return "under the cap";
    if (band === "under-tax" || band === "under-apron1") return "over the cap";
    return "over the first apron";
  }
  switch (band) {
    case "under-floor":
      return "under the floor";
    case "under-cap":
      return "under the cap";
    case "under-tax":
      return "over the cap, under the tax line";
    case "under-apron1":
      return "over the tax line";
    case "under-apron2":
      return "over the first apron";
    case "over-apron2":
      return "over the second apron";
  }
}

/**
 * The clubs a student can choose from, and how many front offices each has
 * left. Room-level counts only — never which seat holds which club.
 */
function choicesFor(state: SameLineL1State, profile: GradeProfile) {
  const held = Object.values(state.desks);
  return CLUBS.map((club) => {
    const taken = held.filter((d) => d.clubId === club.id).length;
    const open = Math.max(0, 2 - taken);
    return {
      clubId: club.id,
      club: club.name,
      city: club.city,
      situation: club.situation,
      jobs: club.jobs,
      standing: standingOf(club.committed.value, profile),
      open,
      openText: open === 2 ? "2 desks open" : open === 1 ? "1 desk open — you'd start from the same books" : "FULL",
      ...(profile.band === "7-8" ? { committed: club.committed.value, committedText: money(club.committed.value), colour: club.colour.value } : {}),
    };
  });
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
      const canChoose = !state.windowClosed && (phase === "LOBBY" || phase === "HOOK" || phase === "PLAY");
      return {
        module: SAME_LINE_L1_ID,
        seated: false,
        observer: false,
        message: canChoose ? "Pick the club you will run." : "You're in. Finding your club…",
        band: state.gradeBand,
        canChoose,
        /* Held under the 5-6 blocking-word budget (40): the one screen a
           student must read before they own anything. */
        choosePrompt:
          "Two front offices can run the same club, so a club with one desk on it is still open. Pick yours, or let the room deal you one.",
        choices: canChoose ? choicesFor(state, profile) : [],
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
                   on, and "$2,180,704 < $15,044,000" is arithmetic homework. */
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
      return {
        ...base,
        readings: shownReadings(state, desk),
        forgone: desk.forgoneAtCommit,
        /* The naming, gated one name at a time by the teacher, exactly as the
           reveal is: a concept the teacher has not reached is not sent. */
        naming: namingFrame(state, desk),
      };
    default:
      return base;
  }
}

/**
 * The naming as one surface sees it: the current name, plus THIS desk's own
 * instance of it where the desk has one.
 *
 * The generalisation belongs on the wall, in front of everybody. What belongs
 * on a pair's own screen is their own case of it — "your opportunity cost was
 * these six people, by name" — because a concept a student can point at in
 * their own summer is one they keep.
 */
function namingFrame(state: SameLineL1State, desk: Desk | null) {
  const all = namings(state, profileFor(state.gradeBand));
  if (all.length === 0) return null;
  const i = Math.max(0, Math.min(state.beat, all.length - 1));
  const now = all[i]!;
  let yours: string | null = null;
  if (desk !== null) {
    if (now.id === "opportunity-cost") {
      const rec = desk.forgoneAtCommit.filter((f) => f.lost.length > 0).sort((a, b) => b.lost.length - a.lost.length)[0];
      yours = rec
        ? `Yours: signing ${rec.signed} put ${rec.lost.join(", ")} out of your reach.`
        : "You signed nobody, so you gave nothing up — and you also still have every hole you started with. That was a price too.";
    } else if (now.id === "scarcity") {
      const open = desk.position.openJobs;
      yours =
        open.length > 0
          ? `Yours: you finished the window still needing a ${open.map((r) => r.toLowerCase()).join(" and a ")}.`
          : "Yours: you filled every hole you started with. Look at what you paid for the last one.";
    } else if (now.id === "institution") {
      yours =
        desk.position.wall !== null
          ? `Yours: you drew a wall at ${money(desk.position.wall)}. You chose the signing. You did not choose that the rule existed.`
          : "Yours: you never drew a wall. That was not luck — it is what your July left you room to avoid.";
    }
  }
  return { index: i, count: all.length, term: now.term, moment: now.moment, means: now.means, real: now.real, outside: now.outside, yours };
}

/**
 * WHAT THE TEACHER SAYS, AND WHAT THEY MUST NOT SAY YET.
 *
 * A random competent teacher has to be able to run this stage without founder
 * knowledge (CLAUDE.md §4). The hard part of a naming is not the definition —
 * it is the order: the room has to say the thing in its own words BEFORE the
 * word arrives, or the word lands as vocabulary homework. So the console leads
 * with the question, holds the term back, and says what a right answer sounds
 * like so the teacher recognises it when a twelve-year-old says it badly.
 */
const NAMING_DIRECTION: Record<string, { ask: string; listenFor: string; hold: string }> = {
  scarcity: {
    ask: "Point at the board and ask: why did the last big cost more than the first one? Take three answers before you say anything.",
    listenFor: "Somebody says a version of \u201Cbecause there weren\u2019t enough of them.\u201D That sentence IS the concept. Repeat it back in their words, then give it its name.",
    hold: "Do not say the word scarcity until a student has said the idea. It is the whole design of this stage.",
  },
  "opportunity-cost": {
    ask: "Ask the desk on the wall: nobody outbid you for those players. So who took them off your board?",
    listenFor: "\u201CWe did.\u201D Let the room sit with that for a second before you name it \u2014 it is the moment the lesson turns.",
    hold: "Do not let anyone say it was bad luck or a bad decision. It was neither. Every signing in this room did this.",
  },
  institution: {
    ask: "Ask: who decided where that line goes? Keep asking until somebody says people did.",
    listenFor: "A student arguing the line is in the wrong place. That argument is real and adults are having it right now \u2014 tell them so.",
    hold: "Do not adjudicate whether the aprons are good policy. The point is that they are a choice, not that they are correct.",
  },
  "price-from-competition": {
    ask: "Ask the desks that bid on him: did he ask you for more money? Then who raised the price?",
    listenFor: "\u201CWe raised it on ourselves.\u201D It is uncomfortable and it is exactly right.",
    hold: "Do not call it a bidding war until they have described one.",
  },
};

function namingDirector(state: SameLineL1State) {
  const frame = namingFrame(state, null);
  if (frame === null) return null;
  const all = namings(state, profileFor(state.gradeBand));
  const d = NAMING_DIRECTION[all[frame.index]!.id];
  return {
    ...frame,
    ask: d?.ask ?? "",
    listenFor: d?.listenFor ?? "",
    hold: d?.hold ?? "",
    /* Nothing here is a timer. The teacher decides when the room is ready. */
    remaining: frame.count - frame.index - 1,
  };
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
  /*
   * THE FOURTH NUMBER IS NOT THE SAME NUMBER IN BOTH BANDS.
   *
   * Grade 5 has no percent standard, and a shooting percentage written as
   * `.439` is a percentage wearing a disguise -- it clears the band gate on a
   * technicality and is still unreadable to the child it is aimed at. So the
   * younger band gets the same fact as a count out of ten, which is exactly how
   * a ten-year-old already thinks about making shots, and which still separates
   * every pair the decimal separates: Dosunmu's .439 is 4 of 10 where Grimes'
   * .334 is 3 of 10.
   */
  const shooting = s.three === null ? { v: s.fg, of: "FROM THE FLOOR", tag: "FG%" } : { v: s.three, of: "FROM THREE", tag: "3P%" };
  const fourth =
    p.role === "BIG"
      ? { label: "BLK", value: s.blocks.toFixed(1) }
      : profile.allowsPercentages
        ? { label: shooting.tag, value: pct(shooting.v) }
        : { label: shooting.of, value: `${Math.round(shooting.v * 10)} OF 10` };
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
/**
 * THE NUMBER THAT LOOKED LIKE A LIE.
 *
 * Found on a projector screenshot: the board told the room "Nikola Vucevic —
 * HE IS ASKING $3,900,000", and four minutes later the reveal printed
 * "Nikola Vucevic · Sacramento · $2,449,421". Nothing on any of the three
 * surfaces connected those numbers. The only inference available to a
 * ten-year-old is that a desk talked him down, or that the board lied — and the
 * second one costs you every other number in the lesson.
 *
 * Both numbers are right, and the gap between them is real NBA law, not a
 * simplification: a veteran-minimum contract pays the player the full minimum
 * for his years of service while charging the club only the two-year-veteran
 * amount, and the league reimburses the difference. It is the single reason no
 * club in this room is ever completely stuck, so it is worth a sentence rather
 * than a footnote.
 *
 * Said on the card, before the choice, because a pair that reads it at the
 * reveal has already made the decision it was supposed to inform.
 */
function minimumNote(p: FreeAgent, profile: GradeProfile): string | null {
  if (!p.minimumScale || p.generic) return null;
  const paid = money(p.ask.value);
  const charged = money(TOOL.minimum.ceiling ?? 0);
  // Kept to one line. Measured: as a third card fact it pushed PUT THE OFFER IN
  // to 622px in a 600px viewport, and a decision below the fold is not shipped.
  return profile.maxVariables >= 3
    ? `— a veteran minimum. He is paid ${paid}; only ${charged} is charged to you, and the league pays the rest.`
    : `— but only ${charged} of that counts against your money. The league pays the rest.`;
}

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
      /* Why the reveal will print a smaller number than this card's ask. */
      minimumNote: minimumNote(p, profile),
      minimumScale: p.minimumScale && !p.generic,
      /* The two facts that make the price honest rather than a lesson in front
         office incompetence: the money is buying youth and years. */
      age: p.ageAtSigning,
      realYears: p.years,
      yours: p.incumbent === desk.clubId,
      /*
       * HOW MANY WAYS THIS DESK COULD PAY HIM — sent to BOTH bands.
       *
       * `tools` is empty at 5-6 by design, and the composer read that emptiness
       * as "there is only one way", printing "It is the only way you have that
       * reaches him" under every card in the younger band. Measured at Memphis
       * on day one: four legal tools, and the screen said one. A pair told a
       * false thing about its own options cannot be reasoning about options.
       */
      toolCount: dedupeByTool(offers).length,
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

/**
 * The readings as a SCREEN may hold them: no signed integer anywhere.
 *
 * `roomLeft` is negative for a club that went past the line it started under,
 * and that is the right model — but a raw `-268717` in a student payload is one
 * careless render away from a minus sign on a fifth-grader's screen, which is a
 * hard band gate. So every path that hands readings to a surface goes through
 * here: magnitude, pre-rendered words, and the fact as a boolean for anything
 * that needs to branch.
 */
function shownReadings(state: SameLineL1State, desk: Desk) {
  const r = readingsOf(state, desk);
  return { ...r, roomLeft: Math.abs(r.roomLeft), roomLeftText: roomLeftText(r.roomLeft), pastLine: r.roomLeft < 0 };
}

function revealForDesk(state: SameLineL1State, desk: Desk, profile: GradeProfile) {
  const beat = state.beat;
  const out: Record<string, unknown> = { beat, beatTitle: REVEAL_BEATS[beat]?.title ?? "" };
  // Per-beat gating: a number belonging to a beat the teacher has not pressed
  // is not sent, not merely not drawn.
  if (beat >= 0) out["yourSignings"] = desk.position.signings;
  if (beat >= 1) out["yourForgone"] = desk.forgoneAtCommit;
  /*
   * ROOM LEFT GOES OUT AS WORDS, NOT AS A SIGNED INTEGER.
   *
   * The reading is negative for a club that went past the line it started
   * under, and a raw `-4510000` in the payload is one careless render away from
   * a minus sign on a fifth-grader's screen — which is a hard band gate, not a
   * preference. So the module does the rendering, once, and the client is never
   * handed a number it has to remember to be careful with. `pastLine` carries
   * the fact separately for anything that needs to branch on it.
   */
  if (beat >= 2) {
    const rl = readingsOf(state, desk).roomLeft;
    out["yourRoomLeft"] = Math.abs(rl);
    out["yourRoomLeftText"] = roomLeftText(rl);
    out["yourPastLine"] = rl < 0;
  }
  if (beat >= 3) out["yourReadings"] = shownReadings(state, desk);
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
    /* THE DESKS, in the shape the console's walk-to strip reads
       (`{ countLine, entries }`, the same contract Full House, Host the League
       and Write the Rule hand it). */
    deskStrip: {
      countLine:
        phase === "PLAY" && !state.windowClosed
          ? `${Object.keys(state.pending).length} of ${desks.length} desks have an offer in on day ${state.day + 1}`
          : `${desks.length} ${desks.length === 1 ? "franchise" : "franchises"} in the room`,
      entries: desks.map((d) => ({
        seatId: d.seatId,
        label: d.label,
        state: state.pending[d.seatId] ? "in" : phase === "PLAY" ? "deciding" : "closed",
        stateLabel: state.pending[d.seatId] ? "OFFER IN" : phase === "PLAY" ? "still deciding" : "closed",
        note: d.position.openJobs.length > 0 ? `${d.position.openJobs.length} still open` : "every hole filled",
        // D36: a desk is never a reason to walk over for a day it was not here for.
        flag: phase === "PLAY" && !state.pending[d.seatId] && d.joinedOnDay < state.day,
      })),
    },
    /* Who has a club and who is still choosing. ONE STUDENT = ONE FRANCHISE
       (D59): the console names the seat's franchise, never the student on the
       projector, and says plainly when a seat has not picked yet. */
    seatClubs: Object.fromEntries(desks.map((d) => [d.seatId, d.label])),
    openFranchises: CLUBS.length * 2 - desks.length,
    beat: state.beat,
    beats: REVEAL_BEATS,
    /* THE DIRECTOR CARD for the naming: what is on the wall right now, what to
       say, what to ask, and what not to explain yet. The random-teacher standard
       (CLAUDE.md §4) is the whole reason this is a payload and not a PDF. */
    naming: phase === "SYNTHESIS" ? namingDirector(state) : null,
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
  /* The wire prints the settled figure, and on a veteran-minimum deal that
     figure is the CHARGE, not the salary — smaller than the ask the pair read
     on the card. Say which it is here too, because this is the sentence the
     desk remembers. */
  const priceOf = (pid: string, annual: number): string => {
    const pl = playerById(pid);
    const charged = TOOL.minimum.ceiling ?? 0;
    return pl !== undefined && pl.minimumScale && annual === charged && pl.ask.value > charged
      ? `${money(annual)} against your books — he is paid ${money(pl.ask.value)} and the league covers the rest`
      : `${money(annual)} a year`;
  };

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
            ? `${priceOf(chasedId, award.annual)}. He is yours.`
            : lost.length === 1
              ? `${priceOf(chasedId, award.annual)}. Making that signing put ${lost[0]} out of your reach — for good, not for today.`
              : `${priceOf(chasedId, award.annual)}. Making that signing put these out of your reach, for good: ${lost.join(", ")}.`,
      });
    } else if (player && award) {
      const rival = state.desks[award.winner as unknown as SeatId];
      const rivalName = rival ? CLUB[rival.clubId].name : "another club";
      items.push({
        kind: "lost",
        headline: `${player.name.toUpperCase()} SIGNS WITH ${rivalName.toUpperCase()}`,
        detail: `${priceOf(chasedId, award.annual)}. You were in on him. He is gone — not off your board for today, out of this window entirely. Your money is still yours.`,
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

  /* A STUDENT WITH NO CLUB. The module refuses to invent a seventeenth
     franchise — duplicating a position would quietly change numbers the room
     has already seen — so a student who joins once all sixteen desks are taken
     lands as an observer. That is the right refusal and the wrong silence: the
     teacher payload never mentioned it, so a teacher with seventeen students
     had one behind a dead screen for the whole of PLAY with nothing on the
     console to say so. The random-teacher standard (CLAUDE.md §4) makes this
     the console's job, not the teacher's eyesight. */
  if (state.observers.length > 0) {
    const n = state.observers.length;
    out.push({
      kind: "watch",
      label: n === 1 ? "A STUDENT HAS NO CLUB" : "STUDENTS WITH NO CLUB",
      text: `${n} ${n === 1 ? "student" : "students"} joined after every club was taken. This room holds ${CLUBS.length * 2} franchises, and ${n === 1 ? "that student has" : "those students have"} no franchise and no board.`,
      ask: `Give them the room's job: pick a club to shadow, say out loud what you think it will do, and check yourself when the day closes. If a desk is willing, they can sit as its co-owner — one franchise, two voices, one offer.`,
    });
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
      /* The shared predicate, not a third private copy of the rule. This one
         was both generic-blind AND uncapped: two BIGs against one BIG job read
         as two holes closed, and three minimum bodies read as two. */
      closed: jobClosingSignings(CLUB[d.clubId].jobs, d.position.signings).length,
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
/**
 * How many beats the phase the teacher is standing in actually has.
 *
 * The reveal has four, fixed. The naming has as many as the room EARNED — a
 * concept whose evidence this room did not produce is not shown at all, so a
 * quiet window with no contested signing has no COMPETITION SETS PRICE beat and
 * the teacher's Next button must stop one earlier. Returning null means this
 * phase does not run beats, which is how the reducer refuses the action.
 */
function beatCountFor(state: SameLineL1State, phase: CanonicalPhase): number | null {
  if (phase === "REVEAL" || phase === "CONSEQUENCE") return REVEAL_BEATS.length;
  if (phase === "SYNTHESIS") return Math.max(1, namings(state, profileFor(state.gradeBand)).length);
  return null;
}

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
    /* A minimum-scale signing settles at the CHARGE, which is smaller than the
       ask this same room read off the board an hour ago. Unlabelled, that gap
       reads as a broken number; labelled, it is the best fact on the frame. */
    signed: named.map((a) => {
      const pl = playerById(a.playerId);
      const charged = TOOL.minimum.ceiling ?? 0;
      const subsidised = pl !== undefined && pl.minimumScale && a.annual === charged && pl.ask.value > charged;
      return {
        player: a.name,
        club: CLUB[deskClubOf(state, a.winner as unknown as string) ?? "brooklyn"].name,
        priceText: money(a.annual),
        chargeNote: subsidised ? `charged — he is paid ${money(pl.ask.value)}, the league covers the rest` : null,
      };
    }),
    beat: state.beat,
    beatTitle: REVEAL_BEATS[state.beat]?.title ?? "",
    beats: REVEAL_BEATS,
    /* THE NAMING, on the wall, one at a time. Structurally never handed a seat
       identity, like everything else here: the moment is the ROOM's, computed
       from club names and counts, and no desk's own case reaches this surface. */
    naming: phase === "SYNTHESIS" ? namingFrame(state, null) : null,
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
