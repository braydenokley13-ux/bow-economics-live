/**
 * Module 1, Lesson 1 — "Draft Day: Nobody Gets Everything."
 *
 * Built against docs/gauntlet/module-1/PLAYABILITY_SPEC.md's L1 section,
 * D11's build charter riders, and two repair charters that followed two
 * fresh-context verification rounds (docs/gauntlet/module-1/
 * VERIFY_GAMEPLAY.md, VERIFY_ECONOMICS.md, VERIFY_RUNTIME.md, then
 * VERIFY_ROUND2.md) — see the per-section notes below (G1-G7, and
 * "ROUND-2 REPAIR") for what each repair fixed and why.
 *
 * The one object that carries the lesson: the Roster Wall. Five slots —
 * SCORER / PLAYMAKER / DEFENDER / REBOUNDER / WILDCARD — filled from a
 * 36-player fictional market, freely reversible (place/remove) right up
 * until each pair locks. A live cap meter and an ambient "priced yourself
 * out" panel react to every placement, not just at the end. A
 * teacher-triggered SHOCK in CONSEQUENCE permanently poaches each roster's
 * own actual weakest player (lowest rating, never random) to a rival
 * franchise, and ADAPT lets the team repair — within a repair budget that
 * is exactly their lost salary plus whatever cap room they already had,
 * never more than the $100M cap allows in total — with a genuine, neutral
 * choice among real substitutes, never the identical player back.
 * SYNTHESIS renders concept cards built from this session's own aggregate
 * numbers — no canned claims, only earned concepts.
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
/**
 * ROUND-2 REPAIR (VERIFY_ROUND2.md BLOCKER 1): each position now carries
 * FOUR cards at the $10M floor instead of one — "bench depth" at the
 * cheapest tier. This is the market-side half of closing the cap-overflow
 * bug: once `adaptBudgetFor` stopped granting a flat stipend and started
 * granting only the team's own real remaining cap room (see below), an
 * at-cap team whose weakest card was the *sole* (or one-of-two) $10M
 * option at its position could have had fewer than 2 legal substitutes to
 * repair with. The binding worst case is a wall that already spent its
 * one WILDCARD slot on a second card of the same position as the one that
 * gets poached (the only way a wall can ever hold two same-position
 * cards) — that uses up 2 of the position's $10M cards, so the floor tier
 * needs at least 4 total for 2 to always remain unused-and-unpoached
 * afterward. Four guarantees it unconditionally, for every position,
 * verified by a market-level property test (not just spot-checked
 * builds) — see "ROUND-2: >=2 same-position substitutes" in
 * draftDay.test.ts.
 */
export const MARKET: readonly Player[] = [
  { id: "sc-10", name: "Jamal Wu", position: "SCORER", price: 10, rating: 58 },
  { id: "sc-10b", name: "Eli Foster", position: "SCORER", price: 10, rating: 57 },
  { id: "sc-10c", name: "JJ Prescott", position: "SCORER", price: 10, rating: 59 },
  { id: "sc-10d", name: "Tobias Kwan", position: "SCORER", price: 10, rating: 61 },
  { id: "sc-20", name: "Cole Bennett", position: "SCORER", price: 20, rating: 66 },
  { id: "sc-30", name: "Nate Rivers", position: "SCORER", price: 30, rating: 74 },
  { id: "sc-40", name: "Deion Marks", position: "SCORER", price: 40, rating: 83 },
  { id: "sc-50", name: "Reggie Vance", position: "SCORER", price: 50, rating: 79 },
  { id: "sc-60", name: "Blaze Carter", position: "SCORER", price: 60, rating: 91 },

  { id: "pm-10", name: "Ravi Patel", position: "PLAYMAKER", price: 10, rating: 56 },
  { id: "pm-10b", name: "Kofi Mensah", position: "PLAYMAKER", price: 10, rating: 53 },
  { id: "pm-10c", name: "Diego Salas", position: "PLAYMAKER", price: 10, rating: 55 },
  { id: "pm-10d", name: "Nasir Whitfield", position: "PLAYMAKER", price: 10, rating: 63 },
  { id: "pm-20", name: "Andre Lopez", position: "PLAYMAKER", price: 20, rating: 72 },
  { id: "pm-30", name: "Mikey Cross", position: "PLAYMAKER", price: 30, rating: 70 },
  { id: "pm-40", name: "Theo James", position: "PLAYMAKER", price: 40, rating: 81 },
  { id: "pm-50", name: "Priya Nandan", position: "PLAYMAKER", price: 50, rating: 86 },
  { id: "pm-60", name: "Skylar Ford", position: "PLAYMAKER", price: 60, rating: 90 },

  { id: "df-10", name: "Sam Okafor", position: "DEFENDER", price: 10, rating: 60 },
  { id: "df-10b", name: "Wyatt Chen", position: "DEFENDER", price: 10, rating: 51 },
  { id: "df-10c", name: "Malik Osei", position: "DEFENDER", price: 10, rating: 54 },
  { id: "df-10d", name: "Julian Rocha", position: "DEFENDER", price: 10, rating: 64 },
  { id: "df-20", name: "Ty Brooks", position: "DEFENDER", price: 20, rating: 68 },
  { id: "df-30", name: "Owen Diaz", position: "DEFENDER", price: 30, rating: 78 },
  { id: "df-40", name: "Devon Shaw", position: "DEFENDER", price: 40, rating: 84 },
  { id: "df-50", name: "Corey Nash", position: "DEFENDER", price: 50, rating: 85 },
  { id: "df-60", name: "Marcus Kane", position: "DEFENDER", price: 60, rating: 92 },

  { id: "rb-10", name: "Dario Silva", position: "REBOUNDER", price: 10, rating: 62 },
  { id: "rb-10b", name: "Finn Delgado", position: "REBOUNDER", price: 10, rating: 50 },
  { id: "rb-10c", name: "Rocco Ibarra", position: "REBOUNDER", price: 10, rating: 52 },
  { id: "rb-10d", name: "Damon Petrov", position: "REBOUNDER", price: 10, rating: 67 },
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
  "Every locked roster just took a hit — a rival franchise poached each team's actual weakest player, not just the cheapest one. Look at your own wall: that slot is now empty, that player is never coming back, and their salary is back in your pocket — plus whatever room you already had left under the $100M cap.";
export const BEYOND_SPORTS_LINE =
  "Fixed budgets force tradeoffs everywhere, not just here: an allowance, a family's grocery bill, a school trip fund. Whenever the money is capped, choosing one thing always means giving up another.";
export const EXIT_PROMPT = "What did your team give up, and would you do it again?";

/**
 * G3 REPAIR (was HIGH/SERIOUS in both verify reports): the shock removed a
 * player and refunded their exact price with no other effect. Because a
 * locked team never overspends the cap, the refunded amount was always
 * >= the removed player's price, meaning the exact same player could
 * always be re-signed — "the shock" could never actually leave a team
 * worse off. Permanent poaching (see `doShock`/`unavailablePlayerIds`)
 * fixes that half: the removed player can never come back.
 *
 * ROUND-2 REPAIR (VERIFY_ROUND2.md BLOCKER 1 — supersedes the round-1
 * fix's other half): round 1 also granted a flat $20M "stipend" on top of
 * the freed salary so a spent-to-cap team would still have a genuine
 * choice to repair with. The verifier caught what that quietly broke:
 * `doAdaptFill` checked the stipend-inflated budget but never re-checked
 * the resulting total against `CAP`, so 65% of full-spend builds could
 * repair to *more* than $100M total roster spend — a silent crack in the
 * one invariant ("$100 million... you cannot afford everyone") the entire
 * lesson is built on, enforced everywhere else with a hard rejection.
 * There is no stipend anymore. See `adaptBudgetFor` below.
 */

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
  /**
   * ROUND-2 REPAIR (BLOCKER 2a): total spend at the instant of lock,
   * frozen — never recomputed afterward. SCARCITY's "spent every last
   * dollar to the cap" is a claim about build-phase discipline; reading it
   * off *live* spend meant a team that heroically hit exactly $100M during
   * PLAY silently stopped counting the moment ADAPT moved their spend off
   * that number, even though the achievement being described already
   * happened and was never undone by the *reducer* (spend only moves
   * because a slot got poached, not because the team un-earned anything).
   */
  lockedSpend: number | null;
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
  lockedSpend: null,
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

/**
 * G3 / ROUND-2 REPAIR: the repair budget for a shocked slot is the poached
 * player's own salary plus whatever room the team still had under the cap
 * — no stipend. `team.slots[slotId]` is already cleared by the time this
 * runs (the shock empties it), so `spentOf(team)` already excludes it;
 * `CAP - spentOf(team)` and "removedPrice + (CAP - lockedSpend)" are the
 * same number (locked spend = current spend + removed price, by
 * construction), so this is written the simpler way but is exactly the
 * formula the ruling specifies. Because it's computed the identical way a
 * normal placement's affordability check is (`CAP - spentOf(team)`),
 * total roster spend can never exceed `CAP` after a repair — not by
 * convention, but because the arithmetic is the same arithmetic.
 */
export const adaptBudgetFor = (team: TeamState, slotId: SlotId): number => {
  void slotId; // kept for API stability / narrative clarity at call sites — the formula no longer varies by slot identity
  return CAP - spentOf(team);
};

/** G3 + G2: real substitutes for the shocked slot, excluding the poached player, priced against the cap-safe repair budget, neutrally ordered. */
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
    state: withTeam(state, seatId, { ...team, locked: true, lockedAt: now, foregoneAtLock: foregone, lockedSpend: spentOf(team) }),
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
    return { ok: false, reason: `${player.name} costs $${player.price}M — your repair budget for this slot is $${budget}M (that's your lost salary plus whatever room you already had, under the $100M cap)` };
  }
  // ROUND-2 REPAIR (BLOCKER 1): an explicit, independent re-check of the
  // exact same rule doPlace enforces — belt-and-suspenders with the budget
  // check above (today they are mathematically the same constraint, by
  // construction), so a future change to adaptBudgetFor's formula can
  // never silently reopen the cap-overflow bug without ALSO tripping this.
  const projectedSpent = spentOf(team) + player.price;
  if (projectedSpent > CAP) {
    return {
      ok: false,
      reason: `signing ${player.name} for $${player.price}M would put this roster at $${projectedSpent}M — over the $${CAP}M cap`,
    };
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
  leftoverHitCount: number;
  capHitCount: number;
  avgLeftoverBudget: number | null;
  avgCapBudget: number | null;
  leftoverRepairedCount: number;
  leftoverUpgradeCount: number;
  capRepairedCount: number;
  capUpgradeCount: number;
};

function computeAggregate(state: DraftDayState): Aggregate {
  const locked = Object.values(state.teams).filter((t) => t.locked);
  // ROUND-2 REPAIR (BLOCKER 2a): spentToCapCount reads locked-at-time spend
  // (frozen at doLock) — a build-phase discipline claim, not a snapshot of
  // whatever the live wall happens to show right now, which can differ
  // post-shock/pre-repair or if a repair landed at a different price than
  // what was lost. avgSpent stays live/current-state on purpose: it is a
  // plain descriptive stat, not a claim about lock-time achievement, and by
  // SYNTHESIS every repaired team's spend has already settled.
  const spentToCapCount = locked.filter((t) => t.lockedSpend === CAP).length;
  const spentValues = locked.map((t) => spentOf(t));
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

  // G7(a) / ROUND-2 REPAIR (BLOCKER 2b): risk-buffer split, now grounded in
  // each team's own actual, mechanically-guaranteed repair budget —
  // `removedPrice + (CAP - lockedSpend)`, the exact formula `adaptBudgetFor`
  // computes (via the algebraically identical `CAP - spentOf(team)`).
  // lockedSpend is read directly from the frozen field set at doLock, so
  // this no longer needs to reconstruct pre-shock spend from live slots.
  let leftoverHitCount = 0;
  let capHitCount = 0;
  let leftoverBudgetSum = 0;
  let capBudgetSum = 0;
  let leftoverRepairedCount = 0;
  let leftoverUpgradeCount = 0;
  let capRepairedCount = 0;
  let capUpgradeCount = 0;
  for (const t of hit) {
    const slot = t.shockSlot as SlotId;
    const removedId = t.slots[slot].removedPlayerId;
    if (!removedId) continue;
    const removedPrice = MARKET_BY_ID.get(removedId)?.price ?? 0;
    const lockedSpend = t.lockedSpend ?? CAP;
    const budget = removedPrice + (CAP - lockedSpend); // == adaptBudgetFor(t, slot) at the moment of the shock
    const hasLeftover = lockedSpend < CAP;
    if (hasLeftover) {
      leftoverHitCount += 1;
      leftoverBudgetSum += budget;
    } else {
      capHitCount += 1;
      capBudgetSum += budget;
    }

    const newId = t.slots[slot].playerId;
    if (!newId) continue; // not yet repaired — counted toward budget stats above, not the upgrade stats below
    const removedRating = MARKET_BY_ID.get(removedId)?.rating ?? 0;
    const newRating = MARKET_BY_ID.get(newId)?.rating ?? 0;
    const isUpgrade = newRating >= removedRating;
    if (hasLeftover) {
      leftoverRepairedCount += 1;
      if (isUpgrade) leftoverUpgradeCount += 1;
    } else {
      capRepairedCount += 1;
      if (isUpgrade) capUpgradeCount += 1;
    }
  }
  const round1dp = (n: number): number => Math.round(n * 10) / 10;
  const avgLeftoverBudget = leftoverHitCount > 0 ? round1dp(leftoverBudgetSum / leftoverHitCount) : null;
  const avgCapBudget = capHitCount > 0 ? round1dp(capBudgetSum / capHitCount) : null;

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
    leftoverHitCount,
    capHitCount,
    avgLeftoverBudget,
    avgCapBudget,
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

  // G7(a) / ROUND-2 REPAIR (BLOCKER 2b): with the stipend gone, this claim
  // is now mechanically guaranteed, not just empirically observed — a
  // team's repair budget is exactly its lost salary back if it had spent
  // every dollar, and strictly more than that if it hadn't (see
  // `adaptBudgetFor`). The card now cites each group's real average
  // budget instead of an upgrade-rate coincidence, so it states the actual
  // structural fact rather than a claim the specific session's dice rolls
  // happened to support.
  if (agg.shockApplied && agg.hitCount > 0) {
    const capLine =
      agg.capHitCount > 0
        ? `${agg.capHitCount} team${agg.capHitCount === 1 ? "" : "s"} had spent every last dollar before the shock — ${agg.capHitCount === 1 ? "its" : "their"} repair budget was exactly the salary ${agg.capHitCount === 1 ? "it" : "they"} lost back ($${agg.avgCapBudget}M avg), not a cent more.`
        : `No team in this class had spent every dollar before the shock.`;
    const leftoverLine =
      agg.leftoverHitCount > 0
        ? `${agg.leftoverHitCount} team${agg.leftoverHitCount === 1 ? "" : "s"} still had room in the budget — ${agg.leftoverHitCount === 1 ? "its" : "their"} repair budget was that same lost salary plus the unspent room ($${agg.avgLeftoverBudget}M avg), genuinely more to work with.`
        : `No team in this class still had room in the budget when the shock hit.`;
    cards.push({
      id: "risk-buffer",
      title: "RISK BUFFER",
      body: `${capLine} ${leftoverLine} Leaving room in a budget isn't wasted money — when a setback hits, that room becomes real extra repair budget, mechanically, every time.`,
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
