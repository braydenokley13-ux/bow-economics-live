/**
 * Module 1, Lesson 1 — "Draft Day: Nobody Gets Everything."
 *
 * Built against docs/gauntlet/module-1/PLAYABILITY_SPEC.md's L1 section and
 * D11's build charter riders ($100M cap / $10M-step salaries / five slots;
 * fictional players only; manual teacher fallback on every synchronized
 * reveal via the runtime's existing teacher controls).
 *
 * The one object that carries the lesson: the Roster Wall. Five slots —
 * SCORER / PLAYMAKER / DEFENDER / REBOUNDER / WILDCARD — filled from a
 * ~20-player fictional market, freely reversible (place/remove) right up
 * until each pair locks. A live cap meter and an ambient "priced yourself
 * out" panel react to every placement, not just at the end. A
 * teacher-triggered SHOCK in CONSEQUENCE hits each roster's own weakest
 * slot (deterministic — lowest rating on the wall, never random), and
 * ADAPT lets the team repair with a constrained, affordable, position-
 * matched replacement. SYNTHESIS renders concept cards built from this
 * session's own aggregate numbers — no canned claims.
 */
import type { LessonModule, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

export const CAP = 100;
export const STEP = 10;

export const SLOT_IDS = ["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER", "WILDCARD"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export const POSITION_TAGS = ["SCORER", "PLAYMAKER", "DEFENDER", "REBOUNDER"] as const;
export type PositionTag = (typeof POSITION_TAGS)[number];

export type Player = {
  readonly id: string;
  readonly name: string;
  readonly position: PositionTag;
  readonly price: number;
  readonly rating: number;
};

/**
 * ~20 fictional players, four per position, five price tiers each ($10-60M
 * in $10M steps). Rating is always monotonic with price *within* a
 * position (a pricier card at the same position is always the better
 * card — no traps), but which position is the single best value swings
 * from tier to tier (see table below), so there is no dominant "always
 * pick X for the wildcard slot" answer and no dominant full-roster build.
 *
 *        $60           $40            $30           $20            $10
 * best:  SCORER(93)    REBOUNDER(87)  DEFENDER(80)  PLAYMAKER(71)  SCORER(59)
 * All 20 ratings are pairwise distinct, so shock-target selection never
 * needs to break a real tie in practice (a deterministic tie-break is
 * still implemented defensively).
 */
export const MARKET: readonly Player[] = [
  { id: "sc-60", name: "Blaze Carter", position: "SCORER", price: 60, rating: 93 },
  { id: "sc-40", name: "Deion Marks", position: "SCORER", price: 40, rating: 85 },
  { id: "sc-30", name: "Nate Rivers", position: "SCORER", price: 30, rating: 79 },
  { id: "sc-20", name: "Cole Bennett", position: "SCORER", price: 20, rating: 68 },
  { id: "sc-10", name: "Jamal Wu", position: "SCORER", price: 10, rating: 59 },

  { id: "pm-60", name: "Skylar Ford", position: "PLAYMAKER", price: 60, rating: 91 },
  { id: "pm-40", name: "Theo James", position: "PLAYMAKER", price: 40, rating: 86 },
  { id: "pm-30", name: "Mikey Cross", position: "PLAYMAKER", price: 30, rating: 77 },
  { id: "pm-20", name: "Andre Lopez", position: "PLAYMAKER", price: 20, rating: 71 },
  { id: "pm-10", name: "Ravi Patel", position: "PLAYMAKER", price: 10, rating: 57 },

  { id: "df-60", name: "Marcus Kane", position: "DEFENDER", price: 60, rating: 92 },
  { id: "df-40", name: "Devon Shaw", position: "DEFENDER", price: 40, rating: 84 },
  { id: "df-30", name: "Owen Diaz", position: "DEFENDER", price: 30, rating: 80 },
  { id: "df-20", name: "Ty Brooks", position: "DEFENDER", price: 20, rating: 69 },
  { id: "df-10", name: "Sam Okafor", position: "DEFENDER", price: 10, rating: 58 },

  { id: "rb-60", name: "Tony Reyes", position: "REBOUNDER", price: 60, rating: 90 },
  { id: "rb-40", name: "Hank Volkov", position: "REBOUNDER", price: 40, rating: 87 },
  { id: "rb-30", name: "Leo Grant", position: "REBOUNDER", price: 30, rating: 78 },
  { id: "rb-20", name: "Miles Chu", position: "REBOUNDER", price: 20, rating: 70 },
  { id: "rb-10", name: "Dario Silva", position: "REBOUNDER", price: 10, rating: 56 },
];

const MARKET_BY_ID: ReadonlyMap<string, Player> = new Map(MARKET.map((p) => [p.id, p]));

export const HOOK_COPY =
  "You're the GM of a brand-new team. $100 million. Five roster slots. The market has stars, starters, and bench players at every position — but you cannot afford everyone. Build once. Make it count.";
export const SHOCK_COPY =
  "Every locked roster just took a hit — each team's weakest-rated player on the wall is out. Look at your own wall: that slot is now empty, and the salary is back in your pocket.";
export const BEYOND_SPORTS_LINE =
  "Fixed budgets force tradeoffs everywhere, not just here: an allowance, a family's grocery bill, a school trip fund. Whenever the money is capped, choosing one thing always means giving up another.";
export const EXIT_PROMPT = "What did your team give up, and would you do it again?";

/* --------------------------------------------------------------- state -- */

export type SlotState = {
  playerId: string | null;
  /** true for the tick right after a SHOCK hits this slot, until ADAPT repairs it. */
  out: boolean;
  /** who used to be here, for the shock/adapt narrative — kept even after repair. */
  removedPlayerId: string | null;
};

export type TeamState = {
  slots: Record<SlotId, SlotState>;
  locked: boolean;
  lockedAt: number | null;
  /** Frozen at the moment of lock: ids priced out of reach at that instant, for the COUNTERFACTUAL debrief. */
  foregoneAtLock: readonly string[] | null;
  shockSlot: SlotId | null;
};

export type DraftDayState = {
  teams: Record<SeatId, TeamState>;
  shockAppliedAt: number | null;
};

const emptySlot = (): SlotState => ({ playerId: null, out: false, removedPlayerId: null });

const emptyTeam = (): TeamState => ({
  slots: {
    SCORER: emptySlot(),
    PLAYMAKER: emptySlot(),
    DEFENDER: emptySlot(),
    REBOUNDER: emptySlot(),
    WILDCARD: emptySlot(),
  },
  locked: false,
  lockedAt: null,
  foregoneAtLock: null,
  shockSlot: null,
});

const getTeam = (state: DraftDayState, seatId: SeatId): TeamState => state.teams[seatId] ?? emptyTeam();

const cloneSlots = (slots: Record<SlotId, SlotState>): Record<SlotId, SlotState> => ({
  SCORER: { ...slots.SCORER },
  PLAYMAKER: { ...slots.PLAYMAKER },
  DEFENDER: { ...slots.DEFENDER },
  REBOUNDER: { ...slots.REBOUNDER },
  WILDCARD: { ...slots.WILDCARD },
});

const withTeam = (state: DraftDayState, seatId: SeatId, team: TeamState): DraftDayState => ({
  ...state,
  teams: { ...state.teams, [seatId]: team },
});

/* ------------------------------------------------------------- helpers -- */

export const spentOf = (team: TeamState): number =>
  SLOT_IDS.reduce((sum, slot) => {
    const pid = team.slots[slot].playerId;
    return sum + (pid ? (MARKET_BY_ID.get(pid)?.price ?? 0) : 0);
  }, 0);

export const filledCountOf = (team: TeamState): number =>
  SLOT_IDS.reduce((n, slot) => n + (team.slots[slot].playerId ? 1 : 0), 0);

/**
 * Matches the visual system's fixed three-zone cap-meter ramp exactly
 * (design/assets/cap-meter-gauge.svg's baked-in zone tints and threshold
 * markers sit at 70%/90% of the cap) — safe under 70%, tight from 70% to
 * just under 90%, over the line at 90% and up (including exactly at cap).
 */
export type CapState = "safe" | "tight" | "over";
export const capStateOf = (spent: number): CapState => {
  const pct = (spent / CAP) * 100;
  if (pct >= 90) return "over";
  if (pct >= 70) return "tight";
  return "safe";
};

const usedPlayerIds = (team: TeamState): Set<string> => {
  const ids = new Set<string>();
  for (const slot of SLOT_IDS) {
    const pid = team.slots[slot].playerId;
    if (pid) ids.add(pid);
  }
  return ids;
};

/** Every market player currently priced above what's left in the budget — the ambient "priced yourself out" panel. */
export const foregoneFor = (team: TeamState): Player[] => {
  const remaining = CAP - spentOf(team);
  const used = usedPlayerIds(team);
  return MARKET.filter((p) => !used.has(p.id) && p.price > remaining).sort(
    (a, b) => b.price - a.price || b.rating - a.rating,
  );
};

/** Candidates eligible for a given slot right now: right position (or any, for WILDCARD), not already on the wall, affordable within remaining budget. Sorted best-first — the "guided narrow." */
export const candidatesFor = (team: TeamState, slotId: SlotId): Player[] => {
  const remaining = CAP - spentOf(team);
  const used = usedPlayerIds(team);
  return MARKET.filter(
    (p) => !used.has(p.id) && p.price <= remaining && (slotId === "WILDCARD" || p.position === slotId),
  ).sort((a, b) => b.rating - a.rating);
};

/** Deterministic: the filled slot with the lowest rating. Tie-break: lowest price, then slot order. Never random. */
export const weakestSlotOf = (team: TeamState): SlotId | null => {
  let best: { slot: SlotId; rating: number; price: number } | null = null;
  for (const slot of SLOT_IDS) {
    const pid = team.slots[slot].playerId;
    if (!pid) continue;
    const player = MARKET_BY_ID.get(pid);
    if (!player) continue;
    if (
      !best ||
      player.rating < best.rating ||
      (player.rating === best.rating && player.price < best.price)
    ) {
      best = { slot, rating: player.rating, price: player.price };
    }
  }
  return best?.slot ?? null;
};

export type Strategy = "star-stacked" | "balanced" | "mixed";
export const classifyStrategy = (team: TeamState): Strategy => {
  const prices = SLOT_IDS.map((s) => team.slots[s].playerId)
    .filter((id): id is string => id !== null)
    .map((id) => MARKET_BY_ID.get(id)?.price ?? 0);
  if (prices.some((p) => p === 60)) return "star-stacked";
  if (prices.every((p) => p <= 30)) return "balanced";
  return "mixed";
};

const playerSummary = (id: string | null): { id: string; name: string; position: PositionTag; price: number; rating: number } | null => {
  if (!id) return null;
  const p = MARKET_BY_ID.get(id);
  if (!p) return null;
  return { id: p.id, name: p.name, position: p.position, price: p.price, rating: p.rating };
};

const rosterSummary = (team: TeamState) =>
  SLOT_IDS.map((slot) => ({ slot, player: playerSummary(team.slots[slot].playerId) }));

/* --------------------------------------------------------------- reduce -- */

type PlaceAction = { type: "place"; slotId: unknown; playerId: unknown };
type RemoveAction = { type: "remove"; slotId: unknown };
type LockAction = { type: "lock" };
type AdaptFillAction = { type: "adaptFill"; playerId: unknown };

const isSlotId = (v: unknown): v is SlotId => typeof v === "string" && (SLOT_IDS as readonly string[]).includes(v);

function doPlace(state: DraftDayState, action: PlaceAction, seatId: SeatId): ReduceResult<DraftDayState> {
  if (!isSlotId(action.slotId)) return { ok: false, reason: `"${String(action.slotId)}" is not a roster slot` };
  if (typeof action.playerId !== "string") return { ok: false, reason: "playerId must be a string" };
  const player = MARKET_BY_ID.get(action.playerId);
  if (!player) return { ok: false, reason: `no player "${String(action.playerId)}" in the market` };

  const team = getTeam(state, seatId);
  if (team.locked) return { ok: false, reason: "your roster is locked" };
  if (action.slotId !== "WILDCARD" && player.position !== action.slotId) {
    return { ok: false, reason: `${player.name} is a ${player.position} and cannot fill the ${action.slotId} slot` };
  }
  if (team.slots[action.slotId].playerId !== null) {
    return { ok: false, reason: "that slot is occupied — remove the current player first" };
  }
  if (usedPlayerIds(team).has(player.id)) {
    return { ok: false, reason: `${player.name} is already on your wall` };
  }
  const spent = spentOf(team);
  if (spent + player.price > CAP) {
    return {
      ok: false,
      reason: `signing ${player.name} for $${player.price}M would put you at $${spent + player.price}M — over the $${CAP}M cap`,
    };
  }

  const nextSlots = cloneSlots(team.slots);
  nextSlots[action.slotId] = { playerId: player.id, out: false, removedPlayerId: null };
  return { ok: true, state: withTeam(state, seatId, { ...team, slots: nextSlots }) };
}

function doRemove(state: DraftDayState, action: RemoveAction, seatId: SeatId): ReduceResult<DraftDayState> {
  if (!isSlotId(action.slotId)) return { ok: false, reason: `"${String(action.slotId)}" is not a roster slot` };
  const team = getTeam(state, seatId);
  if (team.locked) return { ok: false, reason: "your roster is locked" };
  if (team.slots[action.slotId].playerId === null) return { ok: false, reason: "that slot is already empty" };

  const nextSlots = cloneSlots(team.slots);
  nextSlots[action.slotId] = emptySlot();
  return { ok: true, state: withTeam(state, seatId, { ...team, slots: nextSlots }) };
}

function doLock(state: DraftDayState, seatId: SeatId, now: number): ReduceResult<DraftDayState> {
  const team = getTeam(state, seatId);
  if (team.locked) return { ok: false, reason: "your roster is already locked" };
  if (filledCountOf(team) < SLOT_IDS.length) {
    return { ok: false, reason: "fill all five slots before you lock your roster" };
  }
  const foregone = foregoneFor(team).map((p) => p.id);
  return {
    ok: true,
    state: withTeam(state, seatId, { ...team, locked: true, lockedAt: now, foregoneAtLock: foregone }),
  };
}

function doAdaptFill(state: DraftDayState, action: AdaptFillAction, seatId: SeatId): ReduceResult<DraftDayState> {
  if (typeof action.playerId !== "string") return { ok: false, reason: "playerId must be a string" };
  const team = getTeam(state, seatId);
  const slot = team.shockSlot;
  if (!slot) return { ok: false, reason: "your roster wasn't hit by the shock — nothing to repair" };
  if (team.slots[slot].playerId !== null) return { ok: false, reason: "that slot is already repaired" };

  const player = MARKET_BY_ID.get(action.playerId);
  if (!player) return { ok: false, reason: `no player "${action.playerId}" in the market` };
  if (slot !== "WILDCARD" && player.position !== slot) {
    return { ok: false, reason: `${player.name} is a ${player.position} and cannot fill the ${slot} slot` };
  }
  if (usedPlayerIds(team).has(player.id)) return { ok: false, reason: `${player.name} is already on your wall` };
  const remaining = CAP - spentOf(team);
  if (player.price > remaining) {
    return { ok: false, reason: `${player.name} costs $${player.price}M — you only have $${remaining}M left` };
  }

  const nextSlots = cloneSlots(team.slots);
  nextSlots[slot] = { playerId: player.id, out: false, removedPlayerId: nextSlots[slot].removedPlayerId };
  return { ok: true, state: withTeam(state, seatId, { ...team, slots: nextSlots }) };
}

function doShock(state: DraftDayState, now: number): ReduceResult<DraftDayState> {
  if (state.shockAppliedAt !== null) return { ok: false, reason: "the shock has already been applied this session" };

  const nextTeams: Record<SeatId, TeamState> = { ...state.teams };
  for (const [seatId, team] of Object.entries(state.teams)) {
    if (!team.locked) continue;
    const slot = weakestSlotOf(team);
    if (!slot) continue;
    const hitPlayerId = team.slots[slot].playerId;
    const nextSlots = cloneSlots(team.slots);
    nextSlots[slot] = { playerId: null, out: true, removedPlayerId: hitPlayerId };
    nextTeams[seatId] = { ...team, slots: nextSlots, shockSlot: slot };
  }
  return { ok: true, state: { teams: nextTeams, shockAppliedAt: now } };
}

/* --------------------------------------------------------------- module -- */

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

/** Tags every view payload so the client shell can dispatch rendering by module identity instead of duck-typing view shape. */
export const MODULE_ID = "m1l1-draft-day" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

export const draftDayModule: LessonModule<DraftDayState> = {
  id: MODULE_ID,
  title: "Module 1 · Lesson 1 — Draft Day",
  phases: PHASES,

  initialState() {
    return { teams: {}, shockAppliedAt: null };
  },

  reduce(state, action, ctx): ReduceResult<DraftDayState> {
    if (action.type === "place") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `roster placements are only allowed during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can place a player" };
      return doPlace(state, action as unknown as PlaceAction, ctx.seatId);
    }
    if (action.type === "remove") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `roster removals are only allowed during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can remove a player" };
      return doRemove(state, action as unknown as RemoveAction, ctx.seatId);
    }
    if (action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only lock during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can lock a roster" };
      return doLock(state, ctx.seatId, ctx.now);
    }
    if (action.type === "adaptFill") {
      if (ctx.phase !== "ADAPT") return { ok: false, reason: `repairs are only allowed during ADAPT (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can repair its own roster" };
      return doAdaptFill(state, action as unknown as AdaptFillAction, ctx.seatId);
    }
    if (action.type === "teacher:shock") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher can trigger the shock" };
      if (ctx.phase !== "CONSEQUENCE") return { ok: false, reason: `the shock only fires during CONSEQUENCE (session is in ${ctx.phase})` };
      return doShock(state, ctx.now);
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "PLAY") return ["place", "remove", "lock"];
    if (phase === "ADAPT") return ["adaptFill"];
    return [];
  },

  studentView(state, seatId, phase) {
    const team = getTeam(state, seatId);
    const spent = spentOf(team);
    const remaining = CAP - spent;

    const view = (() => {
    switch (phase) {
      case "LOBBY":
        return { phase, message: "You're in! Waiting for your teacher to start Draft Day." };

      case "HOOK":
        return { phase, message: HOOK_COPY, cap: CAP, step: STEP, slotCount: SLOT_IDS.length };

      case "PLAY": {
        const used = usedPlayerIds(team);
        const emptySlotIds = SLOT_IDS.filter((s) => team.slots[s].playerId === null);
        return {
          phase,
          cap: CAP,
          spent,
          remaining,
          capState: capStateOf(spent),
          locked: team.locked,
          slots: SLOT_IDS.map((id) => ({ id, player: playerSummary(team.slots[id].playerId) })),
          market: MARKET.map((p) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            price: p.price,
            rating: p.rating,
            used: used.has(p.id),
            affordable: used.has(p.id) || p.price <= remaining,
          })),
          foregone: foregoneFor(team).map((p) => ({ id: p.id, name: p.name, position: p.position, price: p.price })),
          suggestions: emptySlotIds.map((slot) => ({
            slot,
            candidates: candidatesFor(team, slot)
              .slice(0, 3)
              .map((p) => ({ id: p.id, name: p.name, price: p.price, rating: p.rating })),
          })),
        };
      }

      case "REVEAL":
        return {
          phase,
          message: team.locked
            ? "Your roster is locked — look up at the board for the Class Gallery."
            : "Time's up — look up at the board for the Class Gallery.",
          myRoster: rosterSummary(team),
          spent,
        };

      case "CONSEQUENCE": {
        const hitSlot = team.shockSlot;
        const removed = hitSlot ? playerSummary(team.slots[hitSlot].removedPlayerId) : null;
        return {
          phase,
          hit: hitSlot !== null,
          slot: hitSlot,
          removedPlayer: removed,
          remaining: CAP - spent,
          message: hitSlot
            ? `Your ${hitSlot} slot took the hit — ${removed?.name ?? "your player"} (rated ${removed?.rating ?? "?"}) was your weakest link on the wall.`
            : "Your roster wasn't in the shock — you never locked a full wall.",
        };
      }

      case "ADAPT": {
        const slot = team.shockSlot;
        const repaired = slot ? team.slots[slot].playerId !== null : null;
        return {
          phase,
          openSlot: slot,
          repaired,
          remaining,
          candidates: slot && !repaired
            ? candidatesFor(team, slot)
                .slice(0, 6)
                .map((p) => ({ id: p.id, name: p.name, position: p.position, price: p.price, rating: p.rating }))
            : [],
        };
      }

      case "COUNTERFACTUAL":
        return {
          phase,
          gaveUp: (team.foregoneAtLock ?? [])
            .map((id) => playerSummary(id))
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .slice(0, 8),
          message: "Here's what your $100M couldn't reach the moment you locked. Would you build it the same way again?",
        };

      case "ARGUE":
        return { phase, myRoster: rosterSummary(team), prompt: "Be ready to defend where you spent — and where you didn't." };

      case "SYNTHESIS":
        return { phase, message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

      case "COMPLETE":
        return { phase, message: "Draft Day is complete. Nice work, GM — this roster comes back next class." };

      default:
        return { phase };
    }
    })();
    return tag(view);
  },

  teacherView(state, phase) {
    const teams = Object.values(state.teams).map((team) => {
      const spent = spentOf(team);
      return {
        locked: team.locked,
        filled: filledCountOf(team),
        spent,
        remaining: CAP - spent,
        capState: capStateOf(spent),
        strategy: team.locked ? classifyStrategy(team) : null,
        shocked: team.shockSlot !== null,
        repaired: team.shockSlot !== null ? team.slots[team.shockSlot].playerId !== null : null,
      };
    });
    return tag({
      phase,
      teamCount: teams.length,
      lockedCount: teams.filter((t) => t.locked).length,
      teams,
      aggregate: computeAggregate(state),
    });
  },

  boardView(state, phase) {
    const view = (() => {
    switch (phase) {
      case "LOBBY":
        return { mode: "lobby", teamCount: Object.keys(state.teams).length };

      case "HOOK":
        return { mode: "hook", message: HOOK_COPY };

      case "PLAY": {
        const teams = Object.values(state.teams);
        return { mode: "building", totalTeams: teams.length, lockedCount: teams.filter((t) => t.locked).length };
      }

      case "REVEAL": {
        const locked = Object.values(state.teams).filter((t) => t.locked);
        return {
          mode: "reveal",
          gallery: locked
            .map((team) => ({
              spent: spentOf(team),
              strategy: classifyStrategy(team),
              positions: SLOT_IDS.map((slot) => {
                const p = playerSummary(team.slots[slot].playerId);
                return { slot, price: p?.price ?? 0, rating: p?.rating ?? 0 };
              }),
            }))
            .sort((a, b) => b.spent - a.spent),
          teamCount: locked.length,
        };
      }

      case "CONSEQUENCE": {
        const locked = Object.values(state.teams).filter((t) => t.locked);
        return {
          mode: "consequence",
          message: SHOCK_COPY,
          hitCount: locked.filter((t) => t.shockSlot !== null).length,
          teamCount: locked.length,
          applied: state.shockAppliedAt !== null,
        };
      }

      case "ADAPT": {
        const hit = Object.values(state.teams).filter((t) => t.shockSlot !== null);
        const repaired = hit.filter((t) => t.slots[t.shockSlot as SlotId].playerId !== null).length;
        return { mode: "adapt", hitCount: hit.length, repairedCount: repaired };
      }

      case "COUNTERFACTUAL":
        return { mode: "counterfactual", message: "Every pair: what did your $100M put out of reach?" };

      case "ARGUE":
        return { mode: "argue", message: "Cold call time — defend where you spent." };

      case "SYNTHESIS": {
        const agg = computeAggregate(state);
        return {
          mode: "synthesis",
          heading: "WHAT ECONOMICS DID WE JUST USE?",
          cards: synthesisCards(agg),
          beyondSports: BEYOND_SPORTS_LINE,
          exitPrompt: EXIT_PROMPT,
        };
      }

      case "COMPLETE":
        return { mode: "complete" };

      default:
        return { mode: "idle", phase };
    }
    })();
    return tag(view);
  },

  aggregate(state) {
    return computeAggregate(state);
  },
};

/* ------------------------------------------------------------ aggregate -- */

export type Aggregate = {
  totalTeams: number;
  lockedTeams: number;
  spentToCapCount: number;
  avgSpent: number;
  starSignerCount: number;
  starSignerCheapFillCount: number;
  balancedCount: number;
  strategyCounts: Record<Strategy, number>;
  hitCount: number;
  repairedCount: number;
  shockApplied: boolean;
};

function computeAggregate(state: DraftDayState): Aggregate {
  const locked = Object.values(state.teams).filter((t) => t.locked);
  const spentValues = locked.map((t) => spentOf(t));
  const spentToCapCount = spentValues.filter((s) => s === CAP).length;
  const avgSpent = spentValues.length > 0 ? Math.round((spentValues.reduce((a, b) => a + b, 0) / spentValues.length) * 10) / 10 : 0;

  const starSigners = locked.filter((t) =>
    SLOT_IDS.some((s) => {
      const pid = t.slots[s].playerId;
      return pid ? MARKET_BY_ID.get(pid)?.price === 60 : false;
    }),
  );
  const starSignerCheapFillCount = starSigners.filter((t) =>
    SLOT_IDS.some((s) => {
      const pid = t.slots[s].playerId;
      return pid ? MARKET_BY_ID.get(pid)?.price === 10 : false;
    }),
  ).length;

  const balancedCount = locked.filter((t) => classifyStrategy(t) === "balanced").length;

  const strategyCounts: Record<Strategy, number> = { "star-stacked": 0, balanced: 0, mixed: 0 };
  for (const t of locked) strategyCounts[classifyStrategy(t)] += 1;

  const hit = Object.values(state.teams).filter((t) => t.shockSlot !== null);
  const repaired = hit.filter((t) => t.slots[t.shockSlot as SlotId].playerId !== null).length;

  return {
    totalTeams: Object.keys(state.teams).length,
    lockedTeams: locked.length,
    spentToCapCount,
    avgSpent,
    starSignerCount: starSigners.length,
    starSignerCheapFillCount,
    balancedCount,
    strategyCounts,
    hitCount: hit.length,
    repairedCount: repaired,
    shockApplied: state.shockAppliedAt !== null,
  };
}

export type SynthesisCard = { id: string; title: string; body: string };

function synthesisCards(agg: Aggregate): SynthesisCard[] {
  const cards: SynthesisCard[] = [];

  if (agg.lockedTeams === 0) {
    return [
      {
        id: "scarcity",
        title: "SCARCITY",
        body: "No rosters locked in yet this round — once teams lock, this card fills in with the class's real numbers.",
      },
    ];
  }

  cards.push({
    id: "scarcity",
    title: "SCARCITY",
    body: `${agg.lockedTeams} team${agg.lockedTeams === 1 ? "" : "s"} built a roster from the exact same $${CAP}M. ${agg.spentToCapCount} of ${agg.lockedTeams} spent every last dollar to the cap; the rest left some on the table. Same budget, same market — the money still wasn't enough to get everyone.`,
  });

  cards.push({
    id: "opportunity-cost",
    title: "OPPORTUNITY COST",
    body:
      agg.starSignerCount > 0
        ? `${agg.starSignerCount} of ${agg.lockedTeams} teams signed a $60M star. ${agg.starSignerCheapFillCount} of those teams had to fill at least one other slot with the cheapest $10M player on the board just to stay under the cap. That empty room in the budget is the star's real price — not the $60M number, but everything else it pushed out.`
        : `Nobody in this class signed a $60M star this round — every team spread its $${CAP}M across mid-tier and value picks instead. That's still opportunity cost: every player chosen is a different player each team gave up.`,
  });

  cards.push({
    id: "tradeoffs",
    title: "TRADEOFFS AMONG SUBSTITUTES",
    body: `${agg.balancedCount} team${agg.balancedCount === 1 ? "" : "s"} spread the $${CAP}M with no single player above $30M, while ${agg.strategyCounts["star-stacked"]} bet big on one $60M name. Average spend across the class: $${agg.avgSpent}M. Different bets, same starting budget — that's the tradeoff, not luck.`,
  });

  if (agg.shockApplied) {
    cards.push({
      id: "adapt",
      title: "CONSTRAINED CHOICE",
      body: `The shock hit ${agg.hitCount} rosters at their own weakest slot — not a random one. ${agg.repairedCount} of ${agg.hitCount} repaired it with what was still affordable. Even recovering from a setback is bounded by the same scarce budget you started with.`,
    });
  }

  return cards;
}
