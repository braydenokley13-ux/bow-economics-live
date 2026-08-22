/**
 * Module 1, Lesson 1 — "Draft Day: Nobody Gets Everything."
 *
 * Built against docs/gauntlet/module-1/PLAYABILITY_SPEC.md's L1 section,
 * D11's build charter riders, and the repair charter that followed the
 * first fresh-context verification round (docs/gauntlet/module-1/
 * VERIFY_GAMEPLAY.md, VERIFY_ECONOMICS.md, VERIFY_RUNTIME.md) — see the
 * per-section notes below (G1-G7) for what each repair fixed and why.
 *
 * The one object that carries the lesson: the Roster Wall. Five slots —
 * SCORER / PLAYMAKER / DEFENDER / REBOUNDER / WILDCARD — filled from a
 * 24-player fictional market, freely reversible (place/remove) right up
 * until each pair locks. A live cap meter and an ambient "priced yourself
 * out" panel react to every placement, not just at the end. A
 * teacher-triggered SHOCK in CONSEQUENCE permanently poaches each roster's
 * own actual weakest player (lowest rating, never random) to a rival
 * franchise, and ADAPT lets the team repair with a genuine, neutral choice
 * among real substitutes — never the identical player back. SYNTHESIS
 * renders concept cards built from this session's own aggregate numbers —
 * no canned claims, only earned concepts.
 */
import type { LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
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
 * G1 REPAIR (was FATAL in VERIFY_ECONOMICS.md): the original 20-card market
 * had rating strictly monotonic with price, with ZERO overlap between
 * price-tier rating bands — every $20M player outrated every $10M player,
 * every $30M outrated every $20M, etc. That made price a perfect, unbroken
 * proxy for value: the shock always hit the cheapest card on the wall (not
 * necessarily the worst *value*), the "guided narrow" assist silently
 * became "always recommend the priciest affordable card," and there was no
 * way for a class to discover that real markets don't work that way.
 *
 * This market now has six full $10M-step tiers per position (10-60,
 * closing the "$10M steps" inconsistency VERIFY_ECONOMICS also flagged —
 * the old ladder skipped $50M) and THREE deliberate value inversions
 * (a cheap "gem" that outrates the tier above it, or an expensive "bust"
 * that underrates the tier below it) so price correlates with value but
 * never determines it:
 *   - SCORER $50 ("Reggie Vance," 79) underrates SCORER $40 ("Deion Marks," 83) — a bust.
 *   - PLAYMAKER $30 ("Mikey Cross," 70) underrates PLAYMAKER $20 ("Andre Lopez," 72) — a gem at $20.
 *   - REBOUNDER $50 ("Bo Ellery," 80) underrates REBOUNDER $40 ("Hank Volkov," 87) — a bust.
 * DEFENDER stays cleanly monotonic (diminishing but never inverted) so not
 * every position hides a trap — a class can't just learn "ignore tier 5
 * everywhere." All 24 ratings are pairwise distinct market-wide (verified
 * by test), so shock targeting is always a clean, non-tied comparison.
 *
 * See draftDay.test.ts's "no dominant roster" brute-force test for the
 * verification that this still preserves genuinely different, comparably
 * viable full-roster strategies (star-stacked / balanced / value-hunting)
 * rather than collapsing to one obviously-correct build.
 */
export const MARKET: readonly Player[] = [
  { id: "sc-10", name: "Jamal Wu", position: "SCORER", price: 10, rating: 58 },
  { id: "sc-20", name: "Cole Bennett", position: "SCORER", price: 20, rating: 66 },
  { id: "sc-30", name: "Nate Rivers", position: "SCORER", price: 30, rating: 74 },
  { id: "sc-40", name: "Deion Marks", position: "SCORER", price: 40, rating: 83 },
  { id: "sc-50", name: "Reggie Vance", position: "SCORER", price: 50, rating: 79 },
  { id: "sc-60", name: "Blaze Carter", position: "SCORER", price: 60, rating: 91 },

  { id: "pm-10", name: "Ravi Patel", position: "PLAYMAKER", price: 10, rating: 56 },
  { id: "pm-20", name: "Andre Lopez", position: "PLAYMAKER", price: 20, rating: 72 },
  { id: "pm-30", name: "Mikey Cross", position: "PLAYMAKER", price: 30, rating: 70 },
  { id: "pm-40", name: "Theo James", position: "PLAYMAKER", price: 40, rating: 81 },
  { id: "pm-50", name: "Priya Nandan", position: "PLAYMAKER", price: 50, rating: 86 },
  { id: "pm-60", name: "Skylar Ford", position: "PLAYMAKER", price: 60, rating: 90 },

  { id: "df-10", name: "Sam Okafor", position: "DEFENDER", price: 10, rating: 60 },
  { id: "df-20", name: "Ty Brooks", position: "DEFENDER", price: 20, rating: 68 },
  { id: "df-30", name: "Owen Diaz", position: "DEFENDER", price: 30, rating: 78 },
  { id: "df-40", name: "Devon Shaw", position: "DEFENDER", price: 40, rating: 84 },
  { id: "df-50", name: "Corey Nash", position: "DEFENDER", price: 50, rating: 85 },
  { id: "df-60", name: "Marcus Kane", position: "DEFENDER", price: 60, rating: 92 },

  { id: "rb-10", name: "Dario Silva", position: "REBOUNDER", price: 10, rating: 62 },
  { id: "rb-20", name: "Miles Chu", position: "REBOUNDER", price: 20, rating: 65 },
  { id: "rb-30", name: "Leo Grant", position: "REBOUNDER", price: 30, rating: 76 },
  { id: "rb-40", name: "Hank Volkov", position: "REBOUNDER", price: 40, rating: 87 },
  { id: "rb-50", name: "Bo Ellery", position: "REBOUNDER", price: 50, rating: 80 },
  { id: "rb-60", name: "Tony Reyes", position: "REBOUNDER", price: 60, rating: 89 },
];

const MARKET_BY_ID: ReadonlyMap<string, Player> = new Map(MARKET.map((p) => [p.id, p]));

export const HOOK_COPY =
  "You're the GM of a brand-new team. $100 million. Five roster slots. The market has stars, starters, and bench players at every position — but you cannot afford everyone. Build once. Make it count.";
export const SHOCK_COPY =
  "Every locked roster just took a hit — a rival franchise poached each team's actual weakest player, not just the cheapest one. Look at your own wall: that slot is now empty, that player is never coming back, and the salary is back in your pocket (plus a short-notice roster exception to help you replace them).";
export const BEYOND_SPORTS_LINE =
  "Fixed budgets force tradeoffs everywhere, not just here: an allowance, a family's grocery bill, a school trip fund. Whenever the money is capped, choosing one thing always means giving up another.";
export const EXIT_PROMPT = "What did your team give up, and would you do it again?";

/**
 * G3 REPAIR (was HIGH/SERIOUS in both verify reports): the shock removed a
 * player and refunded their exact price with no other effect. Because a
 * locked team never overspends the cap, the refunded amount was always
 * >= the removed player's price, meaning the exact same player could
 * always be re-signed — "the shock" could never actually leave a team
 * worse off, and for teams that had left money unspent, ADAPT was a free,
 * uncontested upgrade. This stipend plus permanent poaching (see
 * `doShock`/`unavailablePlayerIds`) fixes both: the removed player can
 * never come back (poached, not benched), and every team gets a small
 * fixed "short-notice roster exception" on top of the freed salary so a
 * genuine, differently-priced substitute is available even to a team that
 * had spent to the exact cap.
 */
export const ADAPT_STIPEND = 20;

/* --------------------------------------------------------------- state -- */

export type SlotState = {
  playerId: string | null;
  /** true for the tick right after a SHOCK hits this slot, until ADAPT repairs it. */
  out: boolean;
  /** who used to be here — permanently poached once set; never eligible to be re-signed (G3). */
  removedPlayerId: string | null;
};

export type TeamState = {
  slots: Record<SlotId, SlotState>;
  locked: boolean;
  lockedAt: number | null;
  /** Frozen at the moment of lock: ids priced out of reach at that instant, for the COUNTERFACTUAL debrief. */
  foregoneAtLock: readonly string[] | null;
  shockSlot: SlotId | null;
  /**
   * G4: a stable index into FRANCHISE_NAMES/crest set, assigned once — the
   * moment this seat's very first placement creates their team — from
   * their position in `ctx.seatIds` (join order). Never re-assigned, never
   * derived from a display name, so the board can label the reveal without
   * ever touching student-identifying data.
   */
  franchiseIndex: number | null;
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
  franchiseIndex: null,
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
 * G5 REPAIR (was MED in VERIFY_GAMEPLAY.md): the reducer makes exceeding
 * the cap structurally impossible (over-cap placements are hard-rejected),
 * so a student who spends every legal dollar was seeing the exact same
 * alarming red "OVER THE LINE" pill as an actual rule violation — which
 * doesn't exist in this game. Renamed and rethresholded to match the
 * ruling exactly: comfortable under 90%, tight from 90% up to (not
 * including) the cap, and a distinct "at-cap" state for exactly $100M —
 * styled client-side as tense-but-legal broadcast drama (gold), never
 * error red. There is no "over" state because there is no way to get one.
 */
export type CapState = "comfortable" | "tight" | "at-cap";
export const capStateOf = (spent: number): CapState => {
  if (spent >= CAP) return "at-cap";
  if (spent >= CAP * 0.9) return "tight";
  return "comfortable";
};

/** Every id currently occupying a slot on this wall. */
const usedPlayerIds = (team: TeamState): Set<string> => {
  const ids = new Set<string>();
  for (const slot of SLOT_IDS) {
    const pid = team.slots[slot].playerId;
    if (pid) ids.add(pid);
  }
  return ids;
};

/** G3: every id ever poached off this wall by the shock — permanently ineligible, on this team, forever. */
const poachedPlayerIds = (team: TeamState): Set<string> => {
  const ids = new Set<string>();
  for (const slot of SLOT_IDS) {
    const pid = team.slots[slot].removedPlayerId;
    if (pid) ids.add(pid);
  }
  return ids;
};

/** Union of "already on the wall" and "poached away" — nothing in here can ever be (re-)signed by this team. */
const unavailablePlayerIds = (team: TeamState): Set<string> => {
  const ids = usedPlayerIds(team);
  for (const id of poachedPlayerIds(team)) ids.add(id);
  return ids;
};

/** Every market player currently priced above what's left in the budget — the ambient "priced yourself out" panel. */
export const foregoneFor = (team: TeamState): Player[] => {
  const remaining = CAP - spentOf(team);
  const unavailable = unavailablePlayerIds(team);
  return MARKET.filter((p) => !unavailable.has(p.id) && p.price > remaining).sort(
    (a, b) => b.price - a.price || b.rating - a.rating,
  );
};

/**
 * G2 REPAIR (was FATAL, paired with G1, in VERIFY_ECONOMICS.md): this used
 * to sort `(a, b) => b.rating - a.rating` — and because rating was a
 * flawless proxy for price in the old market, that meant the "guided
 * narrow" assist silently recommended the single most expensive affordable
 * card, every time, for every slot, while presenting itself as neutral
 * help. Sorted by price ascending now (a plain, non-judgmental ordering —
 * "here's what's in reach," not "here's the best one") and callers that
 * show a short list (`spreadSample`) pick a genuine cheap/mid/pricey
 * spread instead of either end of the list.
 */
export const candidatesFor = (team: TeamState, slotId: SlotId): Player[] => {
  const remaining = CAP - spentOf(team);
  const unavailable = unavailablePlayerIds(team);
  return MARKET.filter(
    (p) => !unavailable.has(p.id) && p.price <= remaining && (slotId === "WILDCARD" || p.position === slotId),
  ).sort((a, b) => a.price - b.price);
};

/** G3: the local repair budget for a shocked slot — the freed salary plus a fixed short-notice roster exception. */
export const adaptBudgetFor = (team: TeamState, slotId: SlotId): number => {
  const removedId = team.slots[slotId]?.removedPlayerId ?? null;
  const removedPrice = removedId ? (MARKET_BY_ID.get(removedId)?.price ?? 0) : 0;
  return removedPrice + ADAPT_STIPEND;
};

/** G3 + G2: real substitutes for the shocked slot, excluding the poached player, priced against the local repair budget, neutrally ordered. */
export const candidatesForAdapt = (team: TeamState, slotId: SlotId): Player[] => {
  const budget = adaptBudgetFor(team, slotId);
  const unavailable = unavailablePlayerIds(team);
  return MARKET.filter(
    (p) => !unavailable.has(p.id) && p.price <= budget && (slotId === "WILDCARD" || p.position === slotId),
  ).sort((a, b) => a.price - b.price);
};

/** A genuine cheap/mid/pricey spread across a neutrally-sorted list — never just "the first N" or "the top N by any metric." */
export const spreadSample = <T,>(items: readonly T[], n: number): T[] => {
  if (items.length <= n) return [...items];
  if (n <= 1) return items.length > 0 ? [items[0]!] : [];
  const picked: T[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < n; i += 1) {
    const idx = Math.round((i * (items.length - 1)) / (n - 1));
    if (!seen.has(idx)) {
      seen.add(idx);
      picked.push(items[idx]!);
    }
  }
  return picked;
};

/**
 * G6 REPAIR (VERIFY_GAMEPLAY.md fix priority #4): the guided-narrow
 * suggestions go silent — correctly — the moment nothing is affordable for
 * an empty slot. That's exactly the moment an impatient student got stuck
 * with no rescue: the only way out (removing a placed card) was a small
 * text link, never surfaced. This computes, for an empty slot with zero
 * affordable candidates, up to two concrete "free up $ by moving X" swaps:
 * a currently-filled slot whose removal would make at least one option
 * for the stuck slot affordable again.
 */
export type SwapSuggestion = {
  freeSlot: SlotId;
  freePlayerId: string;
  freePlayerName: string;
  freePlayerPrice: number;
  unlocks: { id: string; name: string; price: number };
};

export const swapSuggestionsFor = (team: TeamState, targetSlot: SlotId): SwapSuggestion[] => {
  const suggestions: SwapSuggestion[] = [];
  const remaining = CAP - spentOf(team);
  for (const slot of SLOT_IDS) {
    if (slot === targetSlot) continue;
    const pid = team.slots[slot].playerId;
    if (!pid) continue;
    const freed = MARKET_BY_ID.get(pid);
    if (!freed) continue;
    const simulatedRemaining = remaining + freed.price;
    const unavailable = unavailablePlayerIds(team);
    const options = MARKET.filter(
      (p) =>
        !unavailable.has(p.id) &&
        p.id !== pid &&
        p.price <= simulatedRemaining &&
        (targetSlot === "WILDCARD" || p.position === targetSlot),
    ).sort((a, b) => a.price - b.price);
    if (options.length > 0) {
      const best = options[0]!;
      suggestions.push({
        freeSlot: slot,
        freePlayerId: freed.id,
        freePlayerName: freed.name,
        freePlayerPrice: freed.price,
        unlocks: { id: best.id, name: best.name, price: best.price },
      });
      if (suggestions.length >= 2) break;
    }
  }
  return suggestions;
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

/**
 * G4: fictional franchise identities so the Class Gallery reveal is
 * ownable ("that's ours!") without ever putting a student's name on the
 * board (VERIFY_GAMEPLAY.md finding #3 / privacy rider). Crests reuse
 * design/assets/team-crests-set.svg's five marks (Ironworks/Northstar/
 * Harbor/Summit/Vale, in that left-to-right order); names beyond the
 * first five cycle through a longer fictional list so a full class of
 * pairs never runs out.
 */
export const FRANCHISE_NAMES = [
  "Ironworks",
  "Northstar",
  "Harbor",
  "Summit",
  "Vale",
  "Cinderline",
  "Wavecrest",
  "Stonegate",
  "Emberfield",
  "Lockhaven",
  "Driftwood",
  "Palisade",
  "Fernbrook",
  "Redwatch",
  "Glassine",
  "Thornbury",
  "Copperline",
  "Windemere",
  "Duskhollow",
  "Brightspire",
] as const;
export const CREST_COUNT = 5;

export type Franchise = { name: string; crestIndex: number };
export const franchiseFor = (index: number): Franchise => ({
  name: FRANCHISE_NAMES[index % FRANCHISE_NAMES.length]!,
  crestIndex: index % CREST_COUNT,
});

/* --------------------------------------------------------------- reduce -- */

type PlaceAction = { type: "place"; slotId: unknown; playerId: unknown };
type RemoveAction = { type: "remove"; slotId: unknown };
type LockAction = { type: "lock" };
type AdaptFillAction = { type: "adaptFill"; playerId: unknown };

const isSlotId = (v: unknown): v is SlotId => typeof v === "string" && (SLOT_IDS as readonly string[]).includes(v);

function doPlace(state: DraftDayState, action: PlaceAction, ctx: ReduceContext): ReduceResult<DraftDayState> {
  if (!isSlotId(action.slotId)) return { ok: false, reason: `"${String(action.slotId)}" is not a roster slot` };
  if (typeof action.playerId !== "string") return { ok: false, reason: "playerId must be a string" };
  const player = MARKET_BY_ID.get(action.playerId);
  if (!player) return { ok: false, reason: `no player "${String(action.playerId)}" in the market` };

  const seatId = ctx.seatId;
  const existing = state.teams[seatId];
  const team = existing ?? emptyTeam();
  if (team.locked) return { ok: false, reason: "your roster is locked" };
  if (action.slotId !== "WILDCARD" && player.position !== action.slotId) {
    return { ok: false, reason: `${player.name} is a ${player.position} and cannot fill the ${action.slotId} slot` };
  }
  if (team.slots[action.slotId].playerId !== null) {
    return { ok: false, reason: "that slot is occupied — remove the current player first" };
  }
  if (unavailablePlayerIds(team).has(player.id)) {
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
  const franchiseIndex = existing ? team.franchiseIndex : (() => {
    const idx = ctx.seatIds.indexOf(seatId);
    return idx >= 0 ? idx : Object.keys(state.teams).length;
  })();
  return { ok: true, state: withTeam(state, seatId, { ...team, slots: nextSlots, franchiseIndex }) };
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
  const removedId = team.slots[slot].removedPlayerId;
  if (removedId === player.id) {
    return { ok: false, reason: `${player.name} just signed with a rival franchise — they're not walking back through your door` };
  }
  if (slot !== "WILDCARD" && player.position !== slot) {
    return { ok: false, reason: `${player.name} is a ${player.position} and cannot fill the ${slot} slot` };
  }
  if (unavailablePlayerIds(team).has(player.id)) return { ok: false, reason: `${player.name} is already on your wall` };
  const budget = adaptBudgetFor(team, slot);
  if (player.price > budget) {
    return { ok: false, reason: `${player.name} costs $${player.price}M — your repair budget for this slot is $${budget}M` };
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
    // G3: the removed player is poached, not benched — `removedPlayerId` now
    // permanently blocks re-signing (see unavailablePlayerIds), and stays on
    // this slot's record even after a later repair, so the shock is a real,
    // irreversible setback rather than a free reroll.
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
      return doPlace(state, action as unknown as PlaceAction, ctx);
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
    const franchise = team.franchiseIndex !== null ? franchiseFor(team.franchiseIndex) : null;

    const view = (() => {
    switch (phase) {
      case "LOBBY":
        return { phase, message: "You're in! Waiting for your teacher to start Draft Day." };

      case "HOOK":
        return { phase, message: HOOK_COPY, cap: CAP, step: STEP, slotCount: SLOT_IDS.length };

      case "PLAY": {
        const unavailable = unavailablePlayerIds(team);
        const emptySlotIds = SLOT_IDS.filter((s) => team.slots[s].playerId === null);
        return {
          phase,
          franchise,
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
            used: unavailable.has(p.id),
            affordable: unavailable.has(p.id) || p.price <= remaining,
          })),
          foregone: foregoneFor(team).map((p) => ({ id: p.id, name: p.name, position: p.position, price: p.price })),
          suggestions: emptySlotIds.map((slot) => {
            const candidates = candidatesFor(team, slot);
            return {
              slot,
              // G2: a neutral cheap/mid/pricey spread, never "the best 3."
              candidates: spreadSample(candidates, 3).map((p) => ({ id: p.id, name: p.name, price: p.price, rating: p.rating })),
              // G6: when nothing is affordable, offer a concrete way out instead of going silent.
              swaps: candidates.length === 0 ? swapSuggestionsFor(team, slot) : [],
            };
          }),
        };
      }

      case "REVEAL":
        return {
          phase,
          franchise,
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
          franchise,
          hit: hitSlot !== null,
          slot: hitSlot,
          removedPlayer: removed,
          remaining: CAP - spent,
          message: hitSlot
            ? `A rival franchise poached your ${hitSlot}, ${removed?.name ?? "your player"} (rated ${removed?.rating ?? "?"}) — your actual weakest link on the wall, not just your cheapest. That slot is empty, and they're not walking back through your door.`
            : "Your roster wasn't in the shock — you never locked a full wall.",
        };
      }

      case "ADAPT": {
        const slot = team.shockSlot;
        const repaired = slot ? team.slots[slot].playerId !== null : null;
        const candidates = slot && !repaired ? candidatesForAdapt(team, slot) : [];
        return {
          phase,
          franchise,
          openSlot: slot,
          repaired,
          budget: slot ? adaptBudgetFor(team, slot) : 0,
          candidates: candidates.map((p) => ({ id: p.id, name: p.name, position: p.position, price: p.price, rating: p.rating })),
        };
      }

      case "COUNTERFACTUAL":
        return {
          phase,
          franchise,
          gaveUp: (team.foregoneAtLock ?? [])
            .map((id) => playerSummary(id))
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .slice(0, 8),
          message: "Here's what your $100M couldn't reach the moment you locked. Would you build it the same way again?",
        };

      case "ARGUE":
        return { phase, franchise, myRoster: rosterSummary(team), prompt: "Be ready to defend where you spent — and where you didn't." };

      case "SYNTHESIS":
        return { phase, franchise, message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

      case "COMPLETE":
        return { phase, franchise, message: "Draft Day is complete. Nice work, GM — this roster comes back next class." };

      default:
        return { phase };
    }
    })();
    return tag(view);
  },

  teacherView(state, phase) {
    const teams = Object.entries(state.teams).map(([seatId, team]) => {
      const spent = spentOf(team);
      return {
        // G4: explicit seatId (teacherView has no "never seat-identifying"
        // constraint — only boardView does) so the client can reliably zip
        // this array against the runtime's own ordered seat list instead of
        // assuming matching array order, which was never actually guaranteed.
        seatId,
        franchise: team.franchiseIndex !== null ? franchiseFor(team.franchiseIndex) : null,
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
          // G4: franchise name/crest only — never seatId or a student name.
          gallery: locked
            .map((team) => ({
              franchise: team.franchiseIndex !== null ? franchiseFor(team.franchiseIndex) : { name: "Unnamed Franchise", crestIndex: 0 },
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
  // G7(b): substitute-choice mechanism, cited by the TRADEOFFS card.
  substituteChoiceCount: number;
  positionPickCount: number;
  // G7(a): risk-buffer / margin-of-safety split, cited by the RISK BUFFER card.
  leftoverRepairedCount: number;
  leftoverUpgradeCount: number;
  capRepairedCount: number;
  capUpgradeCount: number;
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

  // G7(b): count position-slot picks (WILDCARD excluded — it has no single
  // "top option for the slot" the way a fixed position does) that were NOT
  // the $60 tier for that position — each one is a real substitute chosen
  // over the priciest available alternative for that exact spot.
  let substituteChoiceCount = 0;
  let positionPickCount = 0;
  for (const t of locked) {
    for (const s of POSITION_TAGS) {
      const pid = t.slots[s].playerId;
      if (!pid) continue;
      positionPickCount += 1;
      const price = MARKET_BY_ID.get(pid)?.price ?? 0;
      if (price < 60) substituteChoiceCount += 1;
    }
  }

  // G7(a): risk-buffer split — did this team still have money left the
  // instant before the shock hit, and did their repair come back as good
  // or better than what they lost?
  let leftoverRepairedCount = 0;
  let leftoverUpgradeCount = 0;
  let capRepairedCount = 0;
  let capUpgradeCount = 0;
  for (const t of hit) {
    const slot = t.shockSlot as SlotId;
    const removedId = t.slots[slot].removedPlayerId;
    const newId = t.slots[slot].playerId;
    if (!removedId || !newId) continue; // not yet repaired
    const removedPrice = MARKET_BY_ID.get(removedId)?.price ?? 0;
    const removedRating = MARKET_BY_ID.get(removedId)?.rating ?? 0;
    const newRating = MARKET_BY_ID.get(newId)?.rating ?? 0;
    // Pre-shock spend: every OTHER slot's price (untouched by the shock or
    // its repair) plus the removed player's own price. Deliberately NOT
    // `spentOf(t) + removedPrice` — by the time this runs, the shocked
    // slot may already be repaired, and spentOf(t) would then reflect the
    // NEW occupant's price, double-counting against removedPrice.
    const otherSlotsSpend = SLOT_IDS.filter((s) => s !== slot).reduce((sum, s) => {
      const pid = t.slots[s].playerId;
      return sum + (pid ? (MARKET_BY_ID.get(pid)?.price ?? 0) : 0);
    }, 0);
    const preShockSpent = otherSlotsSpend + removedPrice;
    const isUpgrade = newRating >= removedRating;
    if (preShockSpent >= CAP) {
      capRepairedCount += 1;
      if (isUpgrade) capUpgradeCount += 1;
    } else {
      leftoverRepairedCount += 1;
      if (isUpgrade) leftoverUpgradeCount += 1;
    }
  }

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
    substituteChoiceCount,
    positionPickCount,
    leftoverRepairedCount,
    leftoverUpgradeCount,
    capRepairedCount,
    capUpgradeCount,
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

  // G7(b): rewritten to name the in-slot substitute-choice mechanism
  // students actually used, instead of cross-team strategy-bucket stats
  // (VERIFY_ECONOMICS.md rated the old version WEAK for exactly this gap).
  cards.push({
    id: "tradeoffs",
    title: "TRADEOFFS AMONG SUBSTITUTES",
    body: `Every roster slot had six real players at six different prices to choose from — picking one Scorer meant giving up the other five for that same spot. Across this class, ${agg.substituteChoiceCount} of ${agg.positionPickCount} position picks went to something other than the single priciest option for that slot. Every one of those was a real substitute chosen over another, not a coin flip.`,
  });

  // G7(a): new card, grounded in this session's own leftover-vs-spent-to-cap
  // repair outcomes — the single highest-value fix VERIFY_ECONOMICS.md named
  // (previously a real, discoverable idea sitting unused in the data).
  if (agg.shockApplied && agg.hitCount > 0) {
    const leftoverLine =
      agg.leftoverRepairedCount > 0
        ? `${agg.leftoverRepairedCount} team${agg.leftoverRepairedCount === 1 ? "" : "s"} still had money left when the shock hit — ${agg.leftoverUpgradeCount} of ${agg.leftoverRepairedCount} repaired with someone rated as good or better than who they lost.`
        : `No team in this class still had money left when the shock hit.`;
    const capLine =
      agg.capRepairedCount > 0
        ? `${agg.capRepairedCount} team${agg.capRepairedCount === 1 ? "" : "s"} had spent every last dollar before the shock — only ${agg.capUpgradeCount} of ${agg.capRepairedCount} could say the same.`
        : `Every team in this class still had some room left before the shock hit.`;
    cards.push({
      id: "risk-buffer",
      title: "RISK BUFFER",
      body: `${leftoverLine} ${capLine} Leaving room in a budget isn't wasted money — it's insurance against a setback you can't predict.`,
    });

    // G7(c): rewritten to describe what the shock/repair mechanic actually
    // does now — permanent loss, genuine substitute choice — instead of the
    // old "bounded by the same scarce budget" line, which understated that
    // recovery used to be a guaranteed, costless full restoration.
    cards.push({
      id: "constrained-choice",
      title: "CONSTRAINED CHOICE",
      body: `The shock didn't just bench a player — that exact person signed with a rival franchise for good, and no team could get them back. ${agg.repairedCount} of ${agg.hitCount} teams found a real, differently-priced substitute to fill the gap. Constrained doesn't mean stuck — every option left was a genuine choice, never the old one back.`,
    });
  }

  return cards;
}
