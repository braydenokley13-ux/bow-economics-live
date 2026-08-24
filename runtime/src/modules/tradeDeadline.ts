/**
 * Module 1, Lesson 2 — "The Trade Deadline: Undo Isn't Free."
 *
 * L1 was build under constraint. L2 is adapt under constraint: the decision
 * a team wants to make now depends on what it chose in L1, its remaining
 * cap room, a midseason report on its own roster, what rivals want, and
 * genuine uncertainty about outcomes. This module is deliberately new
 * content, not a graft onto draftDay.ts — but it imports draftDay's types
 * and market wholesale (`MARKET`, `SLOT_IDS`, `franchiseFor`, ...) because
 * L2 lives in the same fictional league L1 built. See boxOffice.ts for
 * precedent: reusing another module's exports directly, never re-declaring
 * them, is the established pattern once two modules share a universe.
 *
 * ---------------------------------------------------------------- SEED --
 * The runtime hands `initialState` an opaque `seed` (see
 * shared/lessonModule.ts) — this module is the ONLY place that knows what
 * `{ lessonModuleId: "m1l1-draft-day", state: DraftDayState }` means.
 * `extractCarriedFranchises` below is the entire L1→L2 mapping: it reads a
 * completed L1 session's locked rosters and turns each into a claimable
 * `FranchiseRoster` — name, crest, final roster, final spend. Any L1 team
 * that isn't validly complete (never locked, a slot still empty from an
 * unrepaired shock, a corrupted id) is silently skipped, never crashes
 * session creation — the seat behind it just claims a stock "expansion
 * franchise" instead (see STOCK_ROSTER). A whole class with no L1 link
 * (seed missing, or pointing at a non-draftDay/nonexistent session) runs
 * entirely on stock franchises, so this lesson is fully testable standalone
 * — but linked carry-forward is the product; see runtime/README.md.
 *
 * --------------------------------------------------------- THE DEADLINE --
 * Each franchise gets exactly one deadline decision, chosen once, mutually
 * exclusive, committed the instant it's submitted:
 *   - STAND PAT: an explicit, reasoned lock. No roster change.
 *   - CUT + VETERAN: cut one player (a dead-cap bite — ~10% of their salary
 *     never comes back, D11 rider a), sign a fixed-price, known-value
 *     veteran into the freed slot. Safe. Resolves instantly.
 *   - CUT + SEALED BID: cut one player (same bite), place a hidden bid on a
 *     scarce deadline target against whichever other teams also want it,
 *     PLUS a hidden seller reserve. The cut is real and permanent the
 *     moment it's submitted — win or lose the bid, that player is gone.
 *     Losing costs nothing beyond the dead cap already paid; it just means
 *     the slot stays open into ADAPT.
 * The reveal is teacher-paced auction theater: one target at a time
 * (`teacher:revealNext`), bids in, winner and price, the value band
 * resolving publicly (steal or winner's curse). ADAPT is a restricted
 * rescue window for open-slot teams only — full-wall teams (stand pat,
 * veteran, or a won bid) get nothing to do there, closing the "wait and
 * see" exploit a conditional cut would otherwise reward.
 *
 * --------------------------------------------------------- DEVIATIONS --
 * Two deliberate, smallest-sound-alternative deviations from
 * PLAYABILITY_SPEC.md's L2 section (superseded by the founder's charter
 * this build follows, but flagged per that charter's own instruction):
 *   1. The spec's continuous Offer Slider becomes a stepped $5M bid input.
 *      A slider implies a single number a student drags to a "right"
 *      answer; a sealed bid against a hidden rival AND a hidden reserve is
 *      a discrete commitment, not a dial to be optimized live — continuous
 *      motion would misrepresent the economics. $5M steps (finer than L1's
 *      $10M, per the charter's own allowance) keep it precise without
 *      pretending precision beyond a 5th grader's mental math.
 *   2. The spec's single risky "Prospect" becomes several scarce, named
 *      deadline TARGETS (one per position) so real scarcity binds — one
 *      hidden-value prospect can't be scarce against a whole class; four
 *      targets, each wanted by every team that plays that position's cut,
 *      can be.
 * Phase list is trimmed from the full 10-phase vocabulary to the seven the
 * charter's classroom shape actually names (LOBBY, HOOK, PLAY, REVEAL,
 * ADAPT, SYNTHESIS, COMPLETE) — CONSEQUENCE/COUNTERFACTUAL/ARGUE would each
 * own zero of the charter's stated 50-60 minutes as separate stages here;
 * their content (the "you're left with a hole" framing, the debrief
 * prompt) is folded into REVEAL/ADAPT/SYNTHESIS's own views instead of
 * being stretched into empty phases.
 */
import {
  CAP,
  CREST_COUNT,
  MARKET,
  MODULE_ID as DRAFT_DAY_MODULE_ID,
  POSITION_TAGS,
  SLOT_IDS,
  franchiseFor,
  type Player,
  type PositionTag,
  type SlotId,
} from "./draftDay.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

void CREST_COUNT; // re-exported below for anyone importing crests through this module

const MARKET_BY_ID: ReadonlyMap<string, Player> = new Map(MARKET.map((p) => [p.id, p]));

/* ============================================================= config == */

/** Dead cap: ~10% of the cut player's price stays on the books, never returned (D11 rider a). Always a whole
 *  number because every L1/stock roster price is a multiple of $10M. */
export const DEAD_CAP_RATE = 0.1;
/** Deadline-specific money granularity — finer than L1's $10M steps, per the charter's own allowance, because a
 *  sealed bid is pricing a genuinely uncertain outcome, not choosing among five discrete cards. */
export const BID_STEP = 5;
export const MIN_BID = 5;
/** Flat across positions — deliberately un-fancy. The point of the veteran path is "certainty, one tap." */
export const VETERAN_PRICE = 20;
/** The aftermath rescue price — see RESCUE_POOL below for why $5M specifically guarantees the recoverability property. */
export const RESCUE_PRICE = 5;

export const deadCapFor = (price: number): number => Math.round(price * DEAD_CAP_RATE);

/* ============================================================ rosters == */

export type FranchiseOrigin = "carried" | "stock";

/** A claimable franchise identity + starting roster/spend — either lifted whole from a completed L1 session, or a
 *  stock "expansion franchise" for a seat with no valid L1 state. Both shapes are identical from here on; only
 *  `origin` distinguishes them, purely for honest, clearly-labeled copy (charter point 1's "normalize only where
 *  necessary" — the normalization is transparent, never disguised as a real carried team). */
export type FranchiseRoster = {
  origin: FranchiseOrigin;
  name: string;
  crestIndex: number;
  /** slot -> playerId, always all 5 SLOT_IDS filled — a carried franchise that isn't fully, validly locked never
   *  makes it into this shape (see extractCarriedFranchises). */
  slots: Record<SlotId, string>;
  spend: number;
};

/**
 * Stock "expansion franchise" — deterministic, balanced, ~league-typical
 * spend ($90M of $100M, comfortable room), built from the same L1 market so
 * dead-cap math (a percentage of a $10M-multiple price) stays exact. Every
 * unlinked seat, or a seat whose L1 team was invalid, gets exactly this
 * roster — honest and identical on purpose, never a random or lucky draw.
 */
const STOCK_SLOTS: Record<SlotId, string> = {
  SCORER: "sc-20", // Cole Bennett, 66, $20M
  PLAYMAKER: "pm-20", // Andre Lopez, 72, $20M
  DEFENDER: "df-20", // Ty Brooks, 68, $20M
  REBOUNDER: "rb-20", // Miles Chu, 65, $20M
  WILDCARD: "sc-10", // Jamal Wu, 58, $10M
};
const STOCK_SPEND = SLOT_IDS.reduce((sum, s) => sum + (MARKET_BY_ID.get(STOCK_SLOTS[s])?.price ?? 0), 0);

/** Exported (L3 addition): m1l3-free-agency's stock-only fallback reuses this exact shape rather than
 *  re-declaring its own stock roster, per the "L3 imports from both, never re-declares" rule — pure visibility
 *  change, zero behavior change to L1/L2. */
export const stockFranchiseFor = (index: number): FranchiseRoster => {
  const f = franchiseFor(index);
  return { origin: "stock", name: f.name, crestIndex: f.crestIndex, slots: { ...STOCK_SLOTS }, spend: STOCK_SPEND };
};

/** Loose runtime guard for the shape this module expects a draftDay TeamState to have — the seed crosses a
 *  session boundary as `unknown`, so every field is checked before use, never assumed. */
function readDraftDayTeam(raw: unknown): { locked: boolean; franchiseIndex: number | null; slots: Record<string, unknown> } | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t["locked"] !== "boolean") return null;
  if (!t["slots"] || typeof t["slots"] !== "object") return null;
  const franchiseIndex = typeof t["franchiseIndex"] === "number" ? t["franchiseIndex"] : null;
  return { locked: t["locked"] as boolean, franchiseIndex, slots: t["slots"] as Record<string, unknown> };
}

/**
 * The entire L1→L2 mapping. `seed` is whatever the runtime resolved for
 * `sourceSessionId` (see shared/lessonModule.ts) — `undefined`/`null` when
 * no link was requested, or `{ lessonModuleId, state }` from ANY prior
 * session otherwise. Only a seed whose `lessonModuleId` is draftDay's own
 * is even inspected; anything else (a stray link to a different module, or
 * to nothing) yields an empty pool, which is exactly the "no L1 link"
 * case — the whole class then runs on stock franchises (charter point 1).
 *
 * Per-team validation (never a whole-seed reject): a team must be
 * `locked === true`, have all five SLOT_IDS present, every slot's
 * `playerId` a non-null string resolving to a real MARKET player, and
 * total spend inside the only two bounds the real economics allow (five
 * $10M-floor players minimum, the $100M cap maximum). Anything short of
 * that is silently skipped — one corrupted or unfinished L1 team never
 * blocks the rest of the class's carry-forward, and the seat behind it
 * gets an honest stock franchise instead of a broken one.
 *
 * Sort order is each team's own L1 `franchiseIndex` (join order), never
 * object-key iteration order — deterministic regardless of JS engine.
 */
export function extractCarriedFranchises(seed: unknown): FranchiseRoster[] {
  if (!seed || typeof seed !== "object") return [];
  const s = seed as Record<string, unknown>;
  if (s["lessonModuleId"] !== DRAFT_DAY_MODULE_ID) return [];
  const state = s["state"];
  if (!state || typeof state !== "object") return [];
  const teamsRaw = (state as Record<string, unknown>)["teams"];
  if (!teamsRaw || typeof teamsRaw !== "object") return [];

  type Candidate = { franchiseIndex: number; roster: FranchiseRoster };
  const candidates: Candidate[] = [];

  for (const raw of Object.values(teamsRaw as Record<string, unknown>)) {
    const team = readDraftDayTeam(raw);
    if (!team || !team.locked || team.franchiseIndex === null) continue;

    const slots: Partial<Record<SlotId, string>> = {};
    let spend = 0;
    let valid = true;
    for (const slotId of SLOT_IDS) {
      const slotRaw = team.slots[slotId];
      if (!slotRaw || typeof slotRaw !== "object") {
        valid = false;
        break;
      }
      const playerId = (slotRaw as Record<string, unknown>)["playerId"];
      if (typeof playerId !== "string") {
        valid = false; // an empty slot (e.g. a shock never repaired) is not a valid, complete final roster
        break;
      }
      const player = MARKET_BY_ID.get(playerId);
      if (!player) {
        valid = false; // corrupted/unknown player id
        break;
      }
      slots[slotId] = playerId;
      spend += player.price;
    }
    if (!valid) continue;
    if (spend < 50 || spend > CAP) continue; // outside the only spend bounds real L1 economics allow

    const f = franchiseFor(team.franchiseIndex);
    candidates.push({
      franchiseIndex: team.franchiseIndex,
      roster: { origin: "carried", name: f.name, crestIndex: f.crestIndex, slots: slots as Record<SlotId, string>, spend },
    });
  }

  candidates.sort((a, b) => a.franchiseIndex - b.franchiseIndex);
  return candidates.map((c) => c.roster);
}

/* ========================================================== veterans == */

/** Known-value, fixed-price signings — one per position. Deliberately plain: the entire point of this path is
 *  "certainty, one clean commitment," not a second market to shop. */
export const VETERANS: readonly Player[] = [
  { id: "vet-sc", name: "Grant Ashford", position: "SCORER", price: VETERAN_PRICE, rating: 65 },
  { id: "vet-pm", name: "Wes Delgado", position: "PLAYMAKER", price: VETERAN_PRICE, rating: 63 },
  { id: "vet-df", name: "Cole Marsh", position: "DEFENDER", price: VETERAN_PRICE, rating: 66 },
  { id: "vet-rb", name: "Tomas Reyes", position: "REBOUNDER", price: VETERAN_PRICE, rating: 64 },
];
const VETERAN_BY_ID: ReadonlyMap<string, Player> = new Map(VETERANS.map((p) => [p.id, p]));
const veteranFor = (position: PositionTag): Player => VETERANS.find((v) => v.position === position)!;

/**
 * The aftermath rescue pool. Three per position (12 total), priced well
 * under the worst-case rescue budget so the recoverability guarantee
 * (charter point 4) holds by construction, not by luck:
 *   worst case = an L1 team that locked at exactly the $100M cap, cutting
 *   its cheapest possible ($10M) player: dead cap = $1M, refund = $9M,
 *   existing room = $0 -> rescue budget = exactly $9M.
 * $5M clears that with room to spare, and 3 distinct options at every
 * position (≥12 for a WILDCARD cut, which accepts any position) is well
 * past the ">= 2 affordable options" bar — see the ROUND-2-style property
 * test in tradeDeadline.test.ts that brute-forces this across every
 * exactly-$100M L1 build, exactly like draftDay's own guarantee.
 */
export const RESCUE_POOL: readonly Player[] = [
  { id: "res-sc-1", name: "Dev Whitlock", position: "SCORER", price: RESCUE_PRICE, rating: 48 },
  { id: "res-sc-2", name: "Amir Castellano", position: "SCORER", price: RESCUE_PRICE, rating: 45 },
  { id: "res-sc-3", name: "Lonnie Park", position: "SCORER", price: RESCUE_PRICE, rating: 51 },
  { id: "res-pm-1", name: "Trey Boschetti", position: "PLAYMAKER", price: RESCUE_PRICE, rating: 47 },
  { id: "res-pm-2", name: "Corbin Yates", position: "PLAYMAKER", price: RESCUE_PRICE, rating: 44 },
  { id: "res-pm-3", name: "Ishaan Verma", position: "PLAYMAKER", price: RESCUE_PRICE, rating: 50 },
  { id: "res-df-1", name: "Marcus Odell", position: "DEFENDER", price: RESCUE_PRICE, rating: 49 },
  { id: "res-df-2", name: "Gideon Frey", position: "DEFENDER", price: RESCUE_PRICE, rating: 46 },
  { id: "res-df-3", name: "Petar Kolic", position: "DEFENDER", price: RESCUE_PRICE, rating: 52 },
  { id: "res-rb-1", name: "Duante Shaw", position: "REBOUNDER", price: RESCUE_PRICE, rating: 48 },
  { id: "res-rb-2", name: "Fynn Adair", position: "REBOUNDER", price: RESCUE_PRICE, rating: 45 },
  { id: "res-rb-3", name: "Rafi Nunez", position: "REBOUNDER", price: RESCUE_PRICE, rating: 50 },
];
const RESCUE_BY_ID: ReadonlyMap<string, Player> = new Map(RESCUE_POOL.map((p) => [p.id, p]));

/* ============================================================ targets == */

export type Target = {
  id: string;
  name: string;
  position: PositionTag;
  flavor: string;
  /** Publicly stated at every point — the honest range of what this player could be worth. */
  floor: number;
  ceiling: number;
  /** Hidden seller floor — never surfaced to any student or board view, even after reveal (real hidden-information
   *  pricing: you learn whether you cleared it, never the exact number). Highest bid >= reserve wins. */
  reserve: number;
  /** The actual worth, resolved publicly at reveal. winningBid vs trueValue is the steal/winner's-curse read. */
  trueValue: number;
};

/** Fixed content, like draftDay's MARKET — not session-seeded, because nothing about a target depends on student
 *  choices. One per position so every cut slot has exactly one target to chase, and scarcity binds the moment more
 *  than one team wants the same position's slot filled the risky way (charter point 3: "fewer targets than teams
 *  that will want them"). Deliberately mixed outcomes — one likely steal, one likely trap — so bidding genuinely
 *  can go either way, never a dominated choice either direction. */
export const TARGETS: readonly Target[] = [
  {
    id: "tgt-sc",
    name: "Marcus Cole",
    position: "SCORER",
    flavor: "Cold start to the year, but the tape says the shot is still there.",
    floor: 30,
    ceiling: 50,
    reserve: 40,
    trueValue: 45, // likely steal if won near the reserve
  },
  {
    id: "tgt-pm",
    name: "Deshawn Ruiz",
    position: "PLAYMAKER",
    flavor: "Every scout loves the highlight reel. Fewer love the turnover column.",
    floor: 25,
    ceiling: 45,
    reserve: 35,
    trueValue: 30, // a trap — a high bid here is winner's-curse territory
  },
  {
    id: "tgt-df",
    name: "Ellis Vaughn",
    position: "DEFENDER",
    flavor: "Quietly the best two-way piece still on the board.",
    floor: 20,
    ceiling: 40,
    reserve: 25,
    trueValue: 36, // a real steal if the reserve holds it down
  },
  {
    id: "tgt-rb",
    name: "Priya Okoye",
    position: "REBOUNDER",
    flavor: "Everyone wants her. Her camp knows it.",
    floor: 35,
    ceiling: 55,
    reserve: 45,
    trueValue: 48, // pay up or don't bother
  },
];
const TARGET_BY_ID: ReadonlyMap<string, Target> = new Map(TARGETS.map((t) => [t.id, t]));
/** Fixed reveal order — deterministic staging for the teacher's per-target theater (`teacher:revealNext`). */
const REVEAL_ORDER: readonly string[] = TARGETS.map((t) => t.id);

export const isValidBid = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= MIN_BID && v % BID_STEP === 0;

/* ============================================================== state == */

export type StandPatReason = "happy-with-roster" | "protect-cap-room" | "risk-too-high" | "no-good-fit";
export const STAND_PAT_REASONS: readonly StandPatReason[] = [
  "happy-with-roster",
  "protect-cap-room",
  "risk-too-high",
  "no-good-fit",
];

export type DeadlinePath = "standPat" | "veteran" | "bid";

export type TeamState = {
  claim: FranchiseRoster | null;
  /** Live roster — starts identical to claim.slots the moment claim happens; mutated by cut/sign/rescue only. */
  slots: Record<SlotId, string | null>;
  path: DeadlinePath | null;
  standPatReason: StandPatReason | null;
  cutSlot: SlotId | null;
  cutPlayerId: string | null;
  /** Frozen the instant the cut happens — never recomputed, never re-derived from a later mutable number (D15's
   *  lesson: an achievement/commitment fact must not silently drift with later, unrelated state changes). */
  deadCapCharge: number;
  veteranId: string | null;
  bidTargetId: string | null;
  /** Sealed: visible in this team's own studentView and in teacherView; never boardView or any other seat's view,
   *  before OR after reveal (a losing bidder's number stays private forever — only the winning price ever becomes
   *  public, which is the real information an auction actually publishes). */
  bidAmount: number | null;
  bidOutcome: "won" | "lost" | null;
  committedAt: number | null;
  rescuePlayerId: string | null;
};

export type TradeDeadlineState = {
  /** The claimable pool, fixed once at session creation from the L1 seed — never mutated after. */
  carriedFranchises: readonly FranchiseRoster[];
  /** carriedFranchises index -> the seat that claimed it, for uniqueness. */
  claimedBy: Record<number, SeatId>;
  /** How many stock franchises have been handed out, for deterministic, collision-avoiding naming. */
  stockClaimCount: number;
  teams: Record<SeatId, TeamState>;
  /** Which deadline targets the teacher has revealed so far, in reveal order — drives `teacher:revealNext`. */
  revealedTargetIds: readonly string[];
};

const emptyTeamSlots = (): Record<SlotId, string | null> => ({
  SCORER: null,
  PLAYMAKER: null,
  DEFENDER: null,
  REBOUNDER: null,
  WILDCARD: null,
});

const emptyTeam = (): TeamState => ({
  claim: null,
  slots: emptyTeamSlots(),
  path: null,
  standPatReason: null,
  cutSlot: null,
  cutPlayerId: null,
  deadCapCharge: 0,
  veteranId: null,
  bidTargetId: null,
  bidAmount: null,
  bidOutcome: null,
  committedAt: null,
  rescuePlayerId: null,
});

const getTeam = (state: TradeDeadlineState, seatId: SeatId): TeamState => state.teams[seatId] ?? emptyTeam();
const withTeam = (state: TradeDeadlineState, seatId: SeatId, team: TeamState): TradeDeadlineState => ({
  ...state,
  teams: { ...state.teams, [seatId]: team },
});

/* ------------------------------------------------------------- helpers -- */

/**
 * A signed player's actual transaction price, wherever it came from. Three
 * of the four pools (MARKET, VETERANS, RESCUE_POOL) have a fixed price.
 * TARGETS do not — a target's price IS whatever its winner bid, which is
 * not a property of the target at all, only of the specific team that won
 * it (`team.bidAmount`, frozen the instant the bid was placed and never
 * touched again). This is why the function needs `team` in scope rather
 * than being a pure function of `playerId` alone: there is no session-wide
 * "the price of tgt-sc" — only "the price seat X paid for tgt-sc."
 */
function priceOf(team: TeamState, playerId: string): number {
  const market = MARKET_BY_ID.get(playerId);
  if (market) return market.price;
  const vet = VETERAN_BY_ID.get(playerId);
  if (vet) return vet.price;
  const res = RESCUE_BY_ID.get(playerId);
  if (res) return res.price;
  if (TARGET_BY_ID.has(playerId)) return team.bidTargetId === playerId && team.bidOutcome === "won" ? (team.bidAmount ?? 0) : 0;
  return 0;
}

/**
 * N1 repair (VERIFY_L2.md MINOR): deliberately has NO Target fallback. A
 * signed target's worth is a dollar figure (`trueValue`), always surfaced
 * explicitly as "turned out to be worth about $XXM" wherever it's shown
 * (REVEAL/board) — never as a 0-100 "rating," which is a MARKET/VETERAN/
 * RESCUE-only concept. `trueValue` (e.g. $30M) could easily read as a
 * plausible rating if it leaked in here, silently miscomparing against real
 * ratings in the 44-92 range. 0 for an id this function doesn't recognize
 * is an honest "no rating concept applies," not a fabricated number.
 */
function ratingOf(playerId: string): number {
  return MARKET_BY_ID.get(playerId)?.rating ?? VETERAN_BY_ID.get(playerId)?.rating ?? RESCUE_BY_ID.get(playerId)?.rating ?? 0;
}
function nameOf(playerId: string): string {
  return MARKET_BY_ID.get(playerId)?.name ?? VETERAN_BY_ID.get(playerId)?.name ?? RESCUE_BY_ID.get(playerId)?.name ?? TARGET_BY_ID.get(playerId)?.name ?? playerId;
}
function positionOf(playerId: string): PositionTag {
  return (
    MARKET_BY_ID.get(playerId)?.position ??
    VETERAN_BY_ID.get(playerId)?.position ??
    RESCUE_BY_ID.get(playerId)?.position ??
    TARGET_BY_ID.get(playerId)?.position ??
    "SCORER"
  );
}

/** Total cap used by a team right now: sum of filled slots' prices (at whatever price they were actually signed
 *  for — a won bid's real price, a veteran's flat price, a rescue's flat price) plus any dead cap charge. This is
 *  the one function the cap-inviolability property test checks after every reachable action sequence. */
export const capUsedOf = (team: TeamState): number => {
  let sum = team.deadCapCharge;
  for (const slotId of SLOT_IDS) {
    const pid = team.slots[slotId];
    if (!pid) continue;
    sum += priceOf(team, pid);
  }
  return sum;
};

export const isSlotId = (v: unknown): v is SlotId => typeof v === "string" && (SLOT_IDS as readonly string[]).includes(v);

/**
 * Frozen the instant reveal resolves a lost bid — never flips again, regardless of whether the team has since
 * rescued. This is the "did this team ever face an open slot" fact every VIEW/aggregate keys off (D15 discipline:
 * a fact about what happened must not silently change because of later, unrelated state); it is deliberately NOT
 * "is `team.slots[cutSlot]` literally empty right now" (that live check is exactly what `doRescueFill`'s own
 * precondition uses, correctly, to gate the action itself — those are two different questions).
 */
export const hadOpenSlot = (team: TeamState): boolean => team.path === "bid" && team.bidOutcome === "lost";

/**
 * The budget available for the freed slot right after a cut: existing room
 * under the cap plus the ~90% refund — algebraically identical to
 * draftDay's adaptBudgetFor, same reasoning: computed the same way a
 * normal affordability check is, so it can never itself produce an
 * over-cap result.
 *
 * Grounded in `team.claim.spend` — the team's ORIGINAL, invariant locked
 * total — rather than reconstructed from the live `team.slots`/
 * `deadCapCharge` at whatever moment this is called. That matters because
 * this function is genuinely called at two different moments across a
 * team's lifetime (once, before the cut, to preview the budget; again,
 * after the cut, from ADAPT's rescue flow, once the slot is already empty
 * and `deadCapCharge` is already set) and both calls must land on the
 * exact same number — the budget was fixed the instant the cut happened,
 * it does not get recomputed from whatever the roster happens to look like
 * right now (same D15 discipline as the rest of this module).
 */
export const cutBudgetFor = (team: TeamState, slotId: SlotId): number => {
  if (!team.claim) return 0;
  const cutPlayerId = team.slots[slotId] ?? (slotId === team.cutSlot ? team.cutPlayerId : null);
  if (!cutPlayerId) return 0;
  const price = priceOf(team, cutPlayerId);
  const deadCap = deadCapFor(price);
  return CAP - team.claim.spend + (price - deadCap);
};

/** Rescue candidates for an open slot — position-matched (or any position for a WILDCARD cut), always >= 2 by
 *  construction (RESCUE_POOL doc comment). Filters only by affordability; the rescue pool shares no ids with any
 *  other pool, so no "already on your wall" exclusion is needed. */
export const rescueCandidatesFor = (team: TeamState, slotId: SlotId): Player[] => {
  const budget = cutBudgetFor(team, slotId);
  return RESCUE_POOL.filter((p) => p.price <= budget && (slotId === "WILDCARD" || p.position === slotId));
};

/** Deterministic, seed-free (fixed content — see MARKET_BY_ID etc. comments): compares a player's rating to every
 *  other player at the same position, cheaper and pricier, exactly the way draftDay's own G1 market inversions
 *  were built — a "bust" is out-rated by something cheaper at the same spot; a "gem" out-rates something pricier. */
export type ValueTag = "bust" | "gem" | "neutral";
export function valueTagFor(player: Player): ValueTag {
  const sameTier = MARKET.filter((p) => p.position === player.position).sort((a, b) => a.price - b.price);
  const idx = sameTier.findIndex((p) => p.id === player.id);
  if (idx < 0) return "neutral";
  const cheaperBetter = sameTier.slice(0, idx).some((p) => p.rating > player.rating);
  const pricierWorse = sameTier.slice(idx + 1).some((p) => p.rating < player.rating);
  if (cheaperBetter) return "bust";
  if (pricierWorse) return "gem";
  return "neutral";
}

export type FormTag = "slumping" | "steady" | "breaking-out";
const FORM_DELTA: Record<FormTag, number> = { slumping: -8, steady: 0, "breaking-out": 8 };
const FORM_FOR_TAG: Record<ValueTag, FormTag> = { bust: "slumping", gem: "breaking-out", neutral: "steady" };

export type PlayerForm = {
  slot: SlotId;
  playerId: string;
  name: string;
  position: PositionTag;
  price: number;
  draftRating: number;
  formTag: FormTag;
  currentForm: number;
  reason: string;
};

/**
 * The midseason report's per-player line. Fully deterministic (no
 * Math.random anywhere — see file header/module comment), a pure function
 * of the player's own fixed L1 market data, and consistent with L1's core
 * economics: a "bust" (priced above a cheaper, better-rated teammate at the
 * same spot) is exactly the kind of overpay the shock/market already
 * taught price != value, so it's the natural material for "this is
 * showing up now." Interpretable line for a 10-year-old: name the cheaper
 * or pricier comparison directly, never an abstract stat.
 */
/** Exported (L3 addition): m1l3-free-agency's L2-carried MARKET-player form snapshot reuses this exact
 *  formula rather than re-declaring it, per the "L3 imports from both, never re-declares" rule — pure
 *  visibility change, zero behavior change to L1/L2. */
export function formFor(slotId: SlotId, playerId: string): PlayerForm | null {
  const player = MARKET_BY_ID.get(playerId);
  if (!player) return null;
  const tag = valueTagFor(player);
  const formTag = FORM_FOR_TAG[tag];
  const currentForm = player.rating + FORM_DELTA[formTag];
  const reason =
    formTag === "slumping"
      ? `Cost $${player.price}M — more than a teammate at the same spot who's rated higher. It's showing: slumping this season.`
      : formTag === "breaking-out"
        ? `Signed for just $${player.price}M and is outplaying plenty of pricier picks at the same spot. Breaking out.`
        : `Playing right around the ${player.rating} rating they were drafted at. Steady.`;
  return { slot: slotId, playerId, name: player.name, position: player.position, price: player.price, draftRating: player.rating, formTag, currentForm, reason };
}

export function midseasonReportFor(team: TeamState): PlayerForm[] {
  if (!team.claim) return [];
  return SLOT_IDS.map((slot) => formFor(slot, team.slots[slot] ?? team.claim!.slots[slot])).filter(
    (f): f is PlayerForm => f !== null,
  );
}

/** The team's own weakest current-form slot — deterministic tie-break (lowest form, then lowest price, then slot
 *  order), same discipline as draftDay's weakestSlotOf. */
export function weakestFormSlot(team: TeamState): SlotId | null {
  const report = midseasonReportFor(team);
  let best: PlayerForm | null = null;
  for (const f of report) {
    if (!best || f.currentForm < best.currentForm || (f.currentForm === best.currentForm && f.price < best.price)) best = f;
  }
  return best?.slot ?? null;
}

/** Real (not random) league standings: every currently-claimed team ranked by its own average current-form
 *  rating. Flavor/urgency only — never gates an action, never used by SYNTHESIS (see the module header's D15
 *  note: only committed/frozen facts feed synthesis cards). */
export type Standing = { rank: number; totalTeams: number; avgForm: number; inHunt: boolean };
export function standingFor(state: TradeDeadlineState, seatId: SeatId): Standing | null {
  const team = state.teams[seatId];
  if (!team || !team.claim) return null;
  const rows: { seatId: SeatId; avgForm: number }[] = [];
  for (const [id, t] of Object.entries(state.teams)) {
    if (!t.claim) continue;
    const report = midseasonReportFor(t);
    const avg = report.length > 0 ? report.reduce((s, f) => s + f.currentForm, 0) / report.length : 0;
    rows.push({ seatId: id, avgForm: Math.round(avg * 10) / 10 });
  }
  rows.sort((a, b) => b.avgForm - a.avgForm || a.seatId.localeCompare(b.seatId));
  const idx = rows.findIndex((r) => r.seatId === seatId);
  if (idx < 0) return null;
  const totalTeams = rows.length;
  return { rank: idx + 1, totalTeams, avgForm: rows[idx]!.avgForm, inHunt: idx < Math.ceil(totalTeams / 2) };
}

/* --------------------------------------------------------------- reduce -- */

type ClaimAction = { type: "claim"; carriedIndex: unknown };
type StandPatAction = { type: "standPat"; reason: unknown };
type CutForVeteranAction = { type: "cutForVeteran"; slot: unknown; veteranId: unknown };
type CutForBidAction = { type: "cutForBid"; slot: unknown; targetId: unknown; bidAmount: unknown };
type RescueFillAction = { type: "rescueFill"; playerId: unknown };

function doClaim(state: TradeDeadlineState, action: ClaimAction, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const seatId = ctx.seatId;
  const existing = state.teams[seatId];
  if (existing && existing.claim) return { ok: false, reason: "you've already claimed a franchise" };

  if (action.carriedIndex === null) {
    const roster = stockFranchiseFor(state.carriedFranchises.length + state.stockClaimCount);
    const team = { ...emptyTeam(), claim: roster, slots: { ...roster.slots } };
    return { ok: true, state: { ...withTeam(state, seatId, team), stockClaimCount: state.stockClaimCount + 1 } };
  }
  if (typeof action.carriedIndex !== "number" || !Number.isInteger(action.carriedIndex)) {
    return { ok: false, reason: "carriedIndex must be a whole number or null" };
  }
  const idx = action.carriedIndex;
  const roster = state.carriedFranchises[idx];
  if (!roster) return { ok: false, reason: `no carried franchise at index ${idx}` };
  if (state.claimedBy[idx] !== undefined) return { ok: false, reason: `${roster.name} has already been claimed by another team` };

  const team = { ...emptyTeam(), claim: roster, slots: { ...roster.slots } };
  return { ok: true, state: { ...withTeam(state, seatId, team), claimedBy: { ...state.claimedBy, [idx]: seatId } } };
}

function requireClaimedUncommitted(state: TradeDeadlineState, seatId: SeatId): { ok: true; team: TeamState } | { ok: false; reason: string } {
  const team = getTeam(state, seatId);
  if (!team.claim) return { ok: false, reason: "claim a franchise before making a deadline decision" };
  if (team.path !== null) return { ok: false, reason: "your deadline decision is already locked in" };
  return { ok: true, team };
}

function doStandPat(state: TradeDeadlineState, action: StandPatAction, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const pre = requireClaimedUncommitted(state, ctx.seatId);
  if (!pre.ok) return pre;
  if (typeof action.reason !== "string" || !(STAND_PAT_REASONS as readonly string[]).includes(action.reason)) {
    return { ok: false, reason: `"${String(action.reason)}" is not a stand-pat reason` };
  }
  const team: TeamState = { ...pre.team, path: "standPat", standPatReason: action.reason as StandPatReason, committedAt: ctx.now };
  return { ok: true, state: withTeam(state, ctx.seatId, team) };
}

function doCutForVeteran(state: TradeDeadlineState, action: CutForVeteranAction, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const pre = requireClaimedUncommitted(state, ctx.seatId);
  if (!pre.ok) return pre;
  const team = pre.team;
  if (!isSlotId(action.slot)) return { ok: false, reason: `"${String(action.slot)}" is not a roster slot` };
  const slot = action.slot;
  const cutPlayerId = team.slots[slot];
  if (!cutPlayerId) return { ok: false, reason: "that slot is already empty" };
  if (typeof action.veteranId !== "string") return { ok: false, reason: "veteranId must be a string" };
  const veteran = VETERAN_BY_ID.get(action.veteranId);
  if (!veteran) return { ok: false, reason: `no veteran "${String(action.veteranId)}" available` };
  if (slot !== "WILDCARD" && veteran.position !== slot) {
    return { ok: false, reason: `${veteran.name} plays ${veteran.position} and cannot fill the ${slot} slot` };
  }
  const budget = cutBudgetFor(team, slot);
  if (veteran.price > budget) {
    return { ok: false, reason: `${veteran.name} costs $${veteran.price}M — your deadline budget after this cut is $${budget}M` };
  }
  const deadCap = deadCapFor(priceOf(team, cutPlayerId));
  const nextSlots = { ...team.slots, [slot]: veteran.id };
  const next: TeamState = {
    ...team,
    slots: nextSlots,
    path: "veteran",
    cutSlot: slot,
    cutPlayerId,
    deadCapCharge: deadCap,
    veteranId: veteran.id,
    committedAt: ctx.now,
  };
  return { ok: true, state: withTeam(state, ctx.seatId, next) };
}

function doCutForBid(state: TradeDeadlineState, action: CutForBidAction, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const pre = requireClaimedUncommitted(state, ctx.seatId);
  if (!pre.ok) return pre;
  const team = pre.team;
  if (!isSlotId(action.slot)) return { ok: false, reason: `"${String(action.slot)}" is not a roster slot` };
  const slot = action.slot;
  const cutPlayerId = team.slots[slot];
  if (!cutPlayerId) return { ok: false, reason: "that slot is already empty" };
  if (typeof action.targetId !== "string") return { ok: false, reason: "targetId must be a string" };
  const target = TARGET_BY_ID.get(action.targetId);
  if (!target) return { ok: false, reason: `no deadline target "${String(action.targetId)}"` };
  if (slot !== "WILDCARD" && target.position !== slot) {
    return { ok: false, reason: `${target.name} plays ${target.position} and cannot fill the ${slot} slot` };
  }
  if (!isValidBid(action.bidAmount)) {
    return { ok: false, reason: `bid must be a whole number, at least $${MIN_BID}M, in $${BID_STEP}M steps` };
  }
  const budget = cutBudgetFor(team, slot);
  if (action.bidAmount > budget) {
    return { ok: false, reason: `you can't afford a $${action.bidAmount}M bid — your deadline budget after this cut is $${budget}M` };
  }
  const deadCap = deadCapFor(priceOf(team, cutPlayerId));
  const nextSlots = { ...team.slots, [slot]: null };
  const next: TeamState = {
    ...team,
    slots: nextSlots,
    path: "bid",
    cutSlot: slot,
    cutPlayerId,
    deadCapCharge: deadCap,
    bidTargetId: target.id,
    bidAmount: action.bidAmount,
    committedAt: ctx.now,
  };
  return { ok: true, state: withTeam(state, ctx.seatId, next) };
}

function doRescueFill(state: TradeDeadlineState, action: RescueFillAction, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const team = getTeam(state, ctx.seatId);
  if (!team.claim) return { ok: false, reason: "claim a franchise first" };
  const slot = team.cutSlot;
  if (!slot || team.slots[slot] !== null) return { ok: false, reason: "your roster doesn't have an open slot to rescue" };
  if (typeof action.playerId !== "string") return { ok: false, reason: "playerId must be a string" };
  const player = RESCUE_BY_ID.get(action.playerId);
  if (!player) return { ok: false, reason: `no rescue signing "${String(action.playerId)}" available` };
  if (slot !== "WILDCARD" && player.position !== slot) {
    return { ok: false, reason: `${player.name} plays ${player.position} and cannot fill the ${slot} slot` };
  }
  // `cutBudgetFor` is grounded in `team.claim.spend` (invariant), so it returns the exact same number here,
  // post-cut with the slot empty, as it would have pre-cut — the rescue budget was fixed the instant the cut
  // happened, never recomputed from whatever the roster looks like right now (see cutBudgetFor's doc comment).
  const rescueBudget = cutBudgetFor(team, slot);
  if (player.price > rescueBudget) {
    return { ok: false, reason: `${player.name} costs $${player.price}M — your rescue budget is $${rescueBudget}M` };
  }
  const nextSlots = { ...team.slots, [slot]: player.id };
  const next: TeamState = { ...team, slots: nextSlots, rescuePlayerId: player.id };
  return { ok: true, state: withTeam(state, ctx.seatId, next) };
}

/**
 * The pure core of the reveal: resolves ONE named target (must already be
 * unrevealed — callers check that). Highest sealed bid on this target,
 * among teams that chose it, wins IF it clears the hidden reserve (never
 * shown to any student, before or after). A lowball — even the only bid —
 * never steals: if the top bid is under reserve, the target goes unsold and
 * every bidder on it just lost their cut player for nothing but the dead
 * cap already paid. Deterministic tiebreak on an exact bid tie: earliest
 * commit time, then seatId — never random, always reproducible. Used by
 * both the teacher-staged single-target reveal (`doRevealNext`) and the
 * bulk auto-resolve that fires on any REVEAL exit (`resolveAllTargets`) —
 * same function, same math, so an auto-resolved target is byte-identical to
 * one the teacher clicked through by hand.
 */
function resolveTarget(state: TradeDeadlineState, targetId: string): TradeDeadlineState {
  const target = TARGET_BY_ID.get(targetId)!;
  const bidders = Object.entries(state.teams).filter(
    ([, t]) => t.path === "bid" && t.bidTargetId === targetId && t.bidOutcome === null,
  ) as [SeatId, TeamState][];

  // Deterministic ranking: highest bid first; ties broken by earliest commit, then by seatId — never random,
  // always reproducible from the same inputs.
  const ranked = [...bidders].sort(([seatA, a], [seatB, b]) => {
    if (b.bidAmount! !== a.bidAmount!) return b.bidAmount! - a.bidAmount!;
    if ((a.committedAt ?? 0) !== (b.committedAt ?? 0)) return (a.committedAt ?? 0) - (b.committedAt ?? 0);
    return seatA.localeCompare(seatB);
  });
  const top = ranked[0] ?? null;
  // A lowball — even the only bid on the target — never steals: the top bid must clear the hidden reserve.
  const winnerSeatId = top && top[1].bidAmount! >= target.reserve ? top[0] : null;

  const nextTeams: Record<SeatId, TeamState> = { ...state.teams };
  for (const [seatId, t] of bidders) {
    if (seatId === winnerSeatId) {
      const slot = t.cutSlot!;
      nextTeams[seatId] = { ...t, bidOutcome: "won", slots: { ...t.slots, [slot]: target.id } };
    } else {
      nextTeams[seatId] = { ...t, bidOutcome: "lost" };
    }
  }
  return { ...state, teams: nextTeams, revealedTargetIds: [...state.revealedTargetIds, targetId] };
}

/**
 * The staged auction theater: reveals exactly the next not-yet-revealed
 * target, in the fixed `REVEAL_ORDER`. No target id parameter is needed
 * (and none is threaded through the runtime's generic `teacher:<hook>`
 * mechanism, which carries no payload) — this keeps the reveal entirely
 * module-owned with zero runtime surface added beyond the L1->L2 seed.
 */
function doRevealNext(state: TradeDeadlineState, ctx: ReduceContext): ReduceResult<TradeDeadlineState> {
  const targetId = REVEAL_ORDER.find((id) => !state.revealedTargetIds.includes(id));
  if (!targetId) return { ok: false, reason: "every deadline target has already been revealed" };
  void ctx;
  return { ok: true, state: resolveTarget(state, targetId) };
}

/**
 * VERIFY_L2.md BLOCKER B1 repair. `hadOpenSlot`/every view/aggregate below
 * relies on `bidOutcome` being non-null for any team on the `"bid"` path —
 * that was previously only true once the teacher had clicked through every
 * target, and nothing stopped (or even strongly warned) a teacher from
 * advancing out of REVEAL early, leaving `bidOutcome: null` stranded
 * forever (phase-gated `teacher:revealNext` can never fire again once the
 * session has left REVEAL). This resolves every still-unrevealed target,
 * in the same fixed order and with the exact same deterministic math
 * `resolveTarget` always uses, so an auto-resolved target is indistinguishable
 * from one the teacher staged by hand — same winner, same price, same
 * steal/curse verdict — the only thing lost is the live drama of the click.
 * Called by the runtime's `onPhaseExit` hook (see `shared/lessonModule.ts`)
 * on every transition OUT of REVEAL, so no reachable post-REVEAL state can
 * ever have a `"bid"`-path team with `bidOutcome === null` again.
 */
function resolveAllTargets(state: TradeDeadlineState): TradeDeadlineState {
  let next = state;
  for (const targetId of REVEAL_ORDER) {
    if (!next.revealedTargetIds.includes(targetId)) next = resolveTarget(next, targetId);
  }
  return next;
}

/* --------------------------------------------------------------- module -- */

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "SYNTHESIS", "COMPLETE"];

export const MODULE_ID = "m1l2-trade-deadline" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

export const HOOK_COPY =
  "The trade deadline is here. Your roster from Draft Day is exactly what it was when you locked it — but the season's happened since then. Read your report, then decide: stand pat, make a safe move, or take a real risk.";
export const STAND_PAT_COPY: Record<StandPatReason, string> = {
  "happy-with-roster": "We like what we built. Not fixing what isn't broken.",
  "protect-cap-room": "We're protecting our cap room for later, not spending it now.",
  "risk-too-high": "Every option on the table right now is too risky for what we'd gain.",
  "no-good-fit": "Nothing available actually fits what our roster needs.",
};
export const BEYOND_SPORTS_LINE =
  "This is every real deadline: a phone contract broken early, a house bid against a hidden reserve, a return you can't fully undo. Revising a commitment almost always costs something, and the other side's number is almost always hidden from you.";
export const EXIT_PROMPT = "What did undoing your Draft Day choice actually cost you — and would you do it again?";
/** L3 seam (L3_CHARTER.md §8, D11 rider f now pointing at the real L3): the deadline's COMPLETE copy is the
 *  tease for Free Agency — the books, every signing and every dead-cap dollar, follow the class into the
 *  next class's signing window, not a clean reset. */
export const COMPLETE_COPY =
  "The trade deadline has passed. Your books — every signing, every dollar of dead cap — follow you into the playoff push. Free agency opens next class.";

export const tradeDeadlineModule: LessonModule<TradeDeadlineState> = {
  id: MODULE_ID,
  title: "Module 1 · Lesson 2 — The Trade Deadline",
  phases: PHASES,

  initialState(input) {
    const carriedFranchises = extractCarriedFranchises(input.seed);
    return { carriedFranchises, claimedBy: {}, stockClaimCount: 0, teams: {}, revealedTargetIds: [] };
  },

  /**
   * VERIFY_L2.md B1 repair. Called by the runtime on every teacher-triggered
   * phase transition, before the phase itself is committed (see
   * `sessionService.applyPhaseChange`) — leaving REVEAL for any reason
   * (normal advance, or a teacher jumping elsewhere) auto-resolves whatever
   * targets the teacher never got to, deterministically, so no reachable
   * state past REVEAL can ever have a pending sealed bid again.
   */
  onPhaseExit(state, fromPhase) {
    if (fromPhase !== "REVEAL") return state;
    return resolveAllTargets(state);
  },

  reduce(state, action, ctx): ReduceResult<TradeDeadlineState> {
    if (action.type === "claim") {
      // M1 repair (VERIFY_L2.md MODERATE): a late joiner can still claim through PLAY, not just HOOK — they
      // just get less time to decide, same as arriving late to any real deadline. After PLAY closes, claiming
      // permanently stops (studentView's PLAY case gives an honest "talk to your teacher" message by then).
      if (ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: false, reason: `claim a franchise during HOOK or PLAY (session is in ${ctx.phase})` };
      }
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can claim a franchise" };
      return doClaim(state, action as unknown as ClaimAction, ctx);
    }
    if (action.type === "standPat") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `deadline decisions are only made during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can make a deadline decision" };
      return doStandPat(state, action as unknown as StandPatAction, ctx);
    }
    if (action.type === "cutForVeteran") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `deadline decisions are only made during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can make a deadline decision" };
      return doCutForVeteran(state, action as unknown as CutForVeteranAction, ctx);
    }
    if (action.type === "cutForBid") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `deadline decisions are only made during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can make a deadline decision" };
      return doCutForBid(state, action as unknown as CutForBidAction, ctx);
    }
    if (action.type === "rescueFill") {
      if (ctx.phase !== "ADAPT") return { ok: false, reason: `rescue signings are only allowed during ADAPT (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can sign its own rescue" };
      return doRescueFill(state, action as unknown as RescueFillAction, ctx);
    }
    if (action.type === "teacher:revealNext") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher can trigger the reveal" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `targets can only be revealed during REVEAL (session is in ${ctx.phase})` };
      return doRevealNext(state, ctx);
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "HOOK") return ["claim"];
    if (phase === "PLAY") return ["claim", "standPat", "cutForVeteran", "cutForBid"];
    if (phase === "ADAPT") return ["rescueFill"];
    return [];
  },

  studentView(state, seatId, phase) {
    const team = getTeam(state, seatId);
    const claimed = team.claim !== null;

    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return { phase, message: "You're in! Waiting for your teacher to start the Trade Deadline." };

        case "HOOK": {
          if (!claimed) {
            return {
              phase,
              claimed: false,
              message: "Which franchise is yours? Pick it up where Draft Day left it — or start a fresh expansion franchise.",
              available: availableClaimsFor(state),
            };
          }
          const report = midseasonReportFor(team);
          const weakest = weakestFormSlot(team);
          const standing = standingFor(state, seatId);
          return {
            phase,
            claimed: true,
            message: HOOK_COPY,
            franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex, origin: team.claim!.origin },
            capRoom: CAP - team.claim!.spend,
            spend: team.claim!.spend,
            report: report.map((f) => ({ slot: f.slot, name: f.name, position: f.position, price: f.price, draftRating: f.draftRating, formTag: f.formTag, currentForm: f.currentForm, reason: f.reason })),
            weakestSlot: weakest,
            standing,
          };
        }

        case "PLAY": {
          // M1 repair (VERIFY_L2.md MODERATE): a seat that joins after HOOK has closed can still claim here —
          // same picker as HOOK, just less time left to decide once claimed. Only after PLAY itself closes
          // does this become the honest, final "talk to your teacher" dead end (unchanged, below).
          if (!claimed) {
            return {
              phase,
              claimed: false,
              lateJoin: true,
              message: "The deadline window is already open — claim your franchise now. You'll have less time to decide, but you're not shut out.",
              available: availableClaimsFor(state),
            };
          }
          if (team.path !== null) {
            return { phase, committed: true, path: team.path, ...committedSummary(team) };
          }
          const cutBudgetBySlot = Object.fromEntries(SLOT_IDS.map((s) => [s, team.slots[s] ? cutBudgetFor(team, s) : 0]));
          return {
            phase,
            committed: false,
            franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex },
            capRoom: CAP - team.claim!.spend,
            slots: SLOT_IDS.map((slot) => ({ id: slot, player: summarizePlayer(team, team.slots[slot]), cutBudget: cutBudgetBySlot[slot] })),
            veterans: VETERANS.map((v) => ({ id: v.id, name: v.name, position: v.position, price: v.price, rating: v.rating })),
            targets: TARGETS.map((t) => ({ id: t.id, name: t.name, position: t.position, flavor: t.flavor, floor: t.floor, ceiling: t.ceiling })),
            standPatReasons: STAND_PAT_REASONS,
            bidStep: BID_STEP,
            minBid: MIN_BID,
          };
        }

        case "REVEAL": {
          if (!claimed) return { phase, message: "You never claimed a franchise — talk to your teacher." };
          const revealed = state.revealedTargetIds.map((id) => publicTargetResult(state, id));
          return {
            phase,
            franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex },
            yourDecision: { path: team.path, ...committedSummary(team) },
            revealed,
            waitingOn: team.path === "bid" && team.bidOutcome === null ? team.bidTargetId : null,
          };
        }

        case "ADAPT": {
          if (!claimed) return { phase, message: "You never claimed a franchise — talk to your teacher." };
          if (!hadOpenSlot(team)) {
            return { phase, openSlot: null, message: "Your roster is full going into the rest of the season — nothing to do here." };
          }
          // `openSlot` stays the slot id even after a rescue signs it — the client keys off `rescued` (not
          // openSlot's truthiness) to decide which message to show, so this never has to flip back to null.
          const slot = team.cutSlot!;
          const rescued = team.rescuePlayerId !== null;
          const candidates = rescued ? [] : rescueCandidatesFor(team, slot);
          return {
            phase,
            openSlot: slot,
            rescued,
            candidates: candidates.map((p) => ({ id: p.id, name: p.name, position: p.position, price: p.price, rating: p.rating })),
          };
        }

        case "SYNTHESIS":
          return { phase, message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

        case "COMPLETE":
          return { phase, message: COMPLETE_COPY };

        default:
          return { phase };
      }
    })();
    return tag(view);
  },

  teacherView(state, phase) {
    const teams = Object.entries(state.teams).map(([seatId, team]) => ({
      seatId,
      claimed: team.claim !== null,
      franchise: team.claim ? { name: team.claim.name, crestIndex: team.claim.crestIndex, origin: team.claim.origin } : null,
      spend: team.claim ? team.claim.spend : null,
      path: team.path,
      cutSlot: team.cutSlot,
      deadCapCharge: team.deadCapCharge,
      bidTargetId: team.bidTargetId,
      bidAmount: team.bidAmount, // teacher-only: the control room may see sealed bids, students/board never do
      bidOutcome: team.bidOutcome,
      openSlot: hadOpenSlot(team),
      rescued: team.rescuePlayerId !== null,
      capUsed: capUsedOf(team),
    }));
    return tag({
      phase,
      teamCount: teams.length,
      claimedCount: teams.filter((t) => t.claimed).length,
      carriedFranchiseCount: state.carriedFranchises.length,
      revealedCount: state.revealedTargetIds.length,
      totalTargets: TARGETS.length,
      targets: TARGETS.map((t) => ({ id: t.id, name: t.name, position: t.position, floor: t.floor, ceiling: t.ceiling, reserve: t.reserve, trueValue: t.trueValue })),
      teams,
      aggregate: computeAggregate(state),
    });
  },

  boardView(state, phase) {
    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return { mode: "lobby", teamCount: Object.keys(state.teams).length };

        case "HOOK": {
          const claimedCount = Object.values(state.teams).filter((t) => t.claim !== null).length;
          return { mode: "hook", message: HOOK_COPY, claimedCount };
        }

        case "PLAY": {
          const teams = Object.values(state.teams).filter((t) => t.claim !== null);
          const committed = teams.filter((t) => t.path !== null).length;
          return { mode: "building", totalTeams: teams.length, committedCount: committed };
        }

        case "REVEAL": {
          const revealed = state.revealedTargetIds.map((id) => publicTargetResult(state, id));
          const next = REVEAL_ORDER.find((id) => !state.revealedTargetIds.includes(id));
          return {
            mode: "reveal",
            revealed,
            nextTargetName: next ? TARGET_BY_ID.get(next)!.name : null,
            allRevealed: next === undefined,
          };
        }

        case "ADAPT": {
          const openSlotTeams = Object.values(state.teams).filter(hadOpenSlot);
          const rescued = openSlotTeams.filter((t) => t.rescuePlayerId !== null).length;
          return { mode: "adapt", openSlotCount: openSlotTeams.length, rescuedCount: rescued };
        }

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
          return { mode: "complete", message: COMPLETE_COPY };

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

/* -------------------------------------------------------------- view helpers -- */

/** The still-unclaimed carried franchises, in claimable form — shared between HOOK's claim picker and PLAY's
 *  late-joiner claim picker (M1 repair) so both surfaces stay byte-identical. */
function availableClaimsFor(state: TradeDeadlineState) {
  const claimedIndices = new Set(Object.keys(state.claimedBy).map(Number));
  return state.carriedFranchises
    .map((f, index) => ({ index, franchise: f }))
    .filter((entry) => !claimedIndices.has(entry.index))
    .map((entry) => ({
      index: entry.index,
      name: entry.franchise.name,
      crestIndex: entry.franchise.crestIndex,
      spend: entry.franchise.spend,
      capRoom: CAP - entry.franchise.spend,
      roster: SLOT_IDS.map((slot) => marketCardFor(entry.franchise.slots[slot])),
    }));
}

/** A plain MARKET card — for contexts guaranteed to hold only original L1 market ids (a carried/stock franchise's
 *  starting roster, never yet touched by any deadline action). No team context needed or used. */
function marketCardFor(playerId: string): { id: string; name: string; position: PositionTag; price: number; rating: number } | null {
  const p = MARKET_BY_ID.get(playerId);
  if (!p) return null;
  return { id: p.id, name: p.name, position: p.position, price: p.price, rating: p.rating };
}

/** A live team-slot occupant's card — needs `team` in scope because a signed deadline TARGET's price is that
 *  team's own winning bid, not a fixed number any pool can answer on its own (see priceOf's doc comment). */
function summarizePlayer(team: TeamState, playerId: string | null): { id: string; name: string; position: PositionTag; price: number; rating: number } | null {
  if (!playerId) return null;
  return { id: playerId, name: nameOf(playerId), position: positionOf(playerId), price: priceOf(team, playerId), rating: ratingOf(playerId) };
}

/** Own-team-only summary of the committed decision — never includes another team's data by construction (it's
 *  read from `team`, the caller's own). Sealed bid amount is included here on purpose: this is the team's own
 *  number, always visible to itself. */
function committedSummary(team: TeamState): Record<string, unknown> {
  if (team.path === "standPat") return { standPatReason: team.standPatReason };
  if (team.path === "veteran") {
    return { cutSlot: team.cutSlot, cutPlayer: marketCardFor(team.cutPlayerId ?? ""), deadCapCharge: team.deadCapCharge, veteran: summarizePlayer(team, team.veteranId) };
  }
  if (team.path === "bid") {
    return {
      cutSlot: team.cutSlot,
      cutPlayer: marketCardFor(team.cutPlayerId ?? ""),
      deadCapCharge: team.deadCapCharge,
      target: team.bidTargetId ? publicTargetInfo(team.bidTargetId) : null,
      bidAmount: team.bidAmount,
      bidOutcome: team.bidOutcome,
      signedPlayer: team.bidOutcome === "won" && team.cutSlot ? summarizePlayer(team, team.slots[team.cutSlot]) : null,
    };
  }
  return {};
}

function publicTargetInfo(targetId: string): Record<string, unknown> | null {
  const t = TARGET_BY_ID.get(targetId);
  if (!t) return null;
  return { id: t.id, name: t.name, position: t.position, flavor: t.flavor, floor: t.floor, ceiling: t.ceiling };
}

/**
 * The one and only place a bid outcome becomes public. Deliberately never
 * includes `reserve` (stays hidden forever, even post-reveal — real
 * hidden-information pricing) and never includes a losing bidder's amount
 * (only the class-wide bid count and the winning price, which is the
 * genuinely public part of a real auction's outcome).
 */
function publicTargetResult(state: TradeDeadlineState, targetId: string): Record<string, unknown> {
  const target = TARGET_BY_ID.get(targetId)!;
  const bidders = Object.values(state.teams).filter((t) => t.path === "bid" && t.bidTargetId === targetId);
  const winner = bidders.find((t) => t.bidOutcome === "won") ?? null;
  const winningBid = winner ? winner.bidAmount! : null;
  const verdict: "steal" | "curse" | "fair" | "unsold" =
    winner === null ? "unsold" : winningBid! < target.trueValue ? "steal" : winningBid! > target.trueValue ? "curse" : "fair";
  return {
    id: target.id,
    name: target.name,
    position: target.position,
    floor: target.floor,
    ceiling: target.ceiling,
    trueValue: target.trueValue,
    bidCount: bidders.length,
    winnerFranchise: winner?.claim ? { name: winner.claim.name, crestIndex: winner.claim.crestIndex } : null,
    winningBid,
    verdict,
  };
}

/* ------------------------------------------------------------ aggregate -- */

export type Aggregate = {
  totalTeams: number;
  claimedTeams: number;
  standPatCount: number;
  veteranCount: number;
  bidCount: number;
  bidWonCount: number;
  bidLostCount: number;
  totalDeadCapPaid: number;
  avgDeadCapPaid: number | null;
  stealCount: number;
  curseCount: number;
  unsoldTargetCount: number;
  revealedCount: number;
  openSlotCount: number;
  rescuedCount: number;
  /** Path dependence: teams grouped by whether their L1/claim spend was at the cap, and each group's average
   *  deadline budget the instant they committed a cut — mirrors draftDay's RISK BUFFER grouping so the class can
   *  see the exact same structural fact one lesson later, from a different angle. */
  atCapCutBudgetAvg: number | null;
  leftoverCutBudgetAvg: number | null;
};

function computeAggregate(state: TradeDeadlineState): Aggregate {
  const teams = Object.values(state.teams).filter((t) => t.claim !== null);
  const standPat = teams.filter((t) => t.path === "standPat");
  const veteran = teams.filter((t) => t.path === "veteran");
  const bid = teams.filter((t) => t.path === "bid");
  const bidWon = bid.filter((t) => t.bidOutcome === "won");
  const bidLost = bid.filter((t) => t.bidOutcome === "lost");

  const cutTeams = teams.filter((t) => t.path === "veteran" || t.path === "bid");
  const deadCapValues = cutTeams.map((t) => t.deadCapCharge);
  const totalDeadCapPaid = deadCapValues.reduce((a, b) => a + b, 0);
  const avgDeadCapPaid = deadCapValues.length > 0 ? Math.round((totalDeadCapPaid / deadCapValues.length) * 10) / 10 : null;

  let stealCount = 0;
  let curseCount = 0;
  let unsoldTargetCount = 0;
  for (const id of state.revealedTargetIds) {
    const result = publicTargetResult(state, id);
    if (result["verdict"] === "steal") stealCount += 1;
    else if (result["verdict"] === "curse") curseCount += 1;
    else if (result["verdict"] === "unsold") unsoldTargetCount += 1;
  }

  const openSlotTeams = teams.filter(hadOpenSlot);
  const rescuedCount = openSlotTeams.filter((t) => t.rescuePlayerId !== null).length;

  // Each cut team's budget the instant it committed its cut — `cutBudgetFor` reads only frozen facts
  // (`claim.spend`, the cut slot's original player, `deadCapCharge`), so this is the exact same number whether
  // read now or read at commit time (D15 discipline: never reconstructed from live/mutable state).
  const atCapCutBudgets = cutTeams.filter((t) => t.claim!.spend === CAP).map((t) => cutBudgetFor(t, t.cutSlot!));
  const leftoverCutBudgets = cutTeams.filter((t) => t.claim!.spend < CAP).map((t) => cutBudgetFor(t, t.cutSlot!));
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    totalTeams: Object.keys(state.teams).length,
    claimedTeams: teams.length,
    standPatCount: standPat.length,
    veteranCount: veteran.length,
    bidCount: bid.length,
    bidWonCount: bidWon.length,
    bidLostCount: bidLost.length,
    totalDeadCapPaid,
    avgDeadCapPaid,
    stealCount,
    curseCount,
    unsoldTargetCount,
    revealedCount: state.revealedTargetIds.length,
    openSlotCount: openSlotTeams.length,
    rescuedCount,
    atCapCutBudgetAvg: atCapCutBudgets.length > 0 ? round1(atCapCutBudgets.reduce((a, b) => a + b, 0) / atCapCutBudgets.length) : null,
    leftoverCutBudgetAvg: leftoverCutBudgets.length > 0 ? round1(leftoverCutBudgets.reduce((a, b) => a + b, 0) / leftoverCutBudgets.length) : null,
  };
}

export type SynthesisCard = { id: string; title: string; body: string };

function synthesisCards(agg: Aggregate): SynthesisCard[] {
  if (agg.claimedTeams === 0) {
    return [{ id: "dead-cap", title: "DEAD CAP", body: "No franchises claimed yet this round — once teams commit, this card fills in with the class's real numbers." }];
  }

  const cards: SynthesisCard[] = [];
  const cutCount = agg.veteranCount + agg.bidCount;

  cards.push({
    id: "dead-cap",
    title: "DEAD CAP",
    body:
      cutCount > 0
        ? `${cutCount} of ${agg.claimedTeams} teams cut a player at the deadline. Together they paid $${agg.totalDeadCapPaid}M in dead cap — money that never came back, just for changing their mind. That's the real cost of revising a commitment, not a number on a menu.`
        : `Nobody in this class cut a player this round — every team stood pat. Standing pat isn't free either: it's a real choice to keep exactly what you already had.`,
  });

  cards.push({
    id: "hidden-information",
    title: "PRICING UNDER HIDDEN INFORMATION",
    body:
      agg.bidCount > 0
        ? `${agg.bidCount} team${agg.bidCount === 1 ? "" : "s"} placed a sealed bid — nobody could see another bidder's number, and nobody could see the seller's hidden reserve either. Of the targets revealed so far, ${agg.stealCount} sold for less than they turned out to be worth (a steal) and ${agg.curseCount} sold for more (winner's curse), with ${agg.unsoldTargetCount} going unsold because every bid came in under the hidden reserve. Same hidden information, three different outcomes.`
        : `Nobody bid on a deadline target this round — every team chose stand pat or the known-value veteran instead. That's a real choice too: certainty over a number you can't see.`,
  });

  const pathDependenceLines = [
    agg.atCapCutBudgetAvg !== null ? `Teams that spent every dollar in Draft Day had an average deadline budget of $${agg.atCapCutBudgetAvg}M after their cut.` : null,
    agg.leftoverCutBudgetAvg !== null ? `Teams that left room on the table had $${agg.leftoverCutBudgetAvg}M to work with instead.` : null,
  ].filter((line): line is string => line !== null);
  cards.push({
    id: "path-dependence",
    title: "PATH DEPENDENCE",
    body:
      pathDependenceLines.length > 0
        ? `${pathDependenceLines.join(" ")} The cap room you have today at the deadline is exactly the cap room Draft Day left you — nothing at this deadline created new money.`
        : `Nobody in this class made a cut this round, so there's no deadline budget to compare yet — but the rule still holds: whatever room Draft Day left a team is exactly the room it would have to work with here. Nothing at this deadline creates new money.`,
  });

  cards.push({
    id: "no-dominant-strategy",
    title: "NO DOMINANT STRATEGY",
    body: `${agg.standPatCount} stood pat, ${agg.veteranCount} went safe with a known veteran, ${agg.bidCount} took the risk on a sealed bid. ${agg.bidWonCount} of ${agg.bidCount || 0} bids won, and ${agg.openSlotCount} team${agg.openSlotCount === 1 ? "" : "s"} finished the deadline with an open slot to rescue. No single path was right for the whole class — the same three choices led to real winners and real regrets, depending on the roster each team actually had.`,
  });

  return cards;
}
