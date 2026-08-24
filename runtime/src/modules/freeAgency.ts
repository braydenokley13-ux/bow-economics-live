/**
 * Module 1, Lesson 3 — "Free Agency: The Signing Window" (module close).
 *
 * Built against docs/gauntlet/module-1/L3_CHARTER.md, a founder charter
 * issued this session that supersedes D13's original "Why the Line Exists"
 * L3 ruling and the L2->L3 clean-reset posture. L3 is refounded as
 * **compete in a market under constraint**, closing the three-lesson arc:
 *   L1 "I cannot have everything." L2 "My past decisions constrain me now."
 *   L3 "Everyone else faces constraints too, and their choices change my
 *   opportunities."
 *
 * A fresh-context verification pass (docs/gauntlet/module-1/VERIFY_L3.md)
 * returned ACCEPT WITH REQUIRED REPAIRS, rating STRONG. Six findings were
 * repaired this round, tagged inline where each lives: R1 (the market's own
 * governing rules were nowhere a student could read them — see
 * `MARKET_RULES`), R2 (a withdraw-then-resubmit loop let a team fake the
 * public interest-count signal for free — see `doWithdrawOffer`'s
 * `outForDay` lock), M1 (THE WALK-AWAY could never tell the shrinker's
 * story — see `computeAwards`'s engagement-based rewrite), M2 (IRON BOOKS
 * never fired for a genuine whole-class hold — see the loosened gate), N1
 * (the offer composer could open off-screen on a classroom Chromebook — see
 * `renderFAComposer`'s `scrollIntoView` in play/main.ts), N2 (the teacher
 * aggregate showed a raw agent id instead of its name — teach/main.ts).
 *
 * This module imports wholesale from both draftDay.ts (MARKET, SLOT_IDS,
 * POSITION_TAGS, franchiseFor, ...) and tradeDeadline.ts (VETERANS,
 * RESCUE_POOL, TARGETS, deadCapFor, isValidBid, extractCarriedFranchises,
 * stockFranchiseFor, formFor, valueTagFor, ...) — same established pattern
 * as tradeDeadline importing from draftDay: reuse another module's exports
 * directly, never re-declare them, once two modules share a universe.
 *
 * ---------------------------------------------------------------- SEED --
 * `sourceSessionId` is preferred `m1l2-trade-deadline`, falls back to
 * `m1l1-draft-day`, else runs entirely on stock "expansion" franchises
 * (`extractCarriedFranchisesL3` below) — so L3 plays in every configuration
 * the charter names: full three-lesson arc, an L1-only class, or a
 * standalone dry-run. Every carried fact is snapshotted at extraction into
 * a self-contained `CarriedFranchiseL3` shape (frozen per D15) — never
 * re-derived from live L1/L2 state afterward, exactly like tradeDeadline's
 * own `FranchiseRoster`.
 *
 * ----------------------------------------------------------- THE MARKET --
 * Eight fixed free agents (two per position, star/solid/value tiers). Four
 * days inside one PLAY phase (a day is a module-internal counter, not a
 * runtime phase — the phase list stays forward-only). Each day, each team
 * submits at most one binding, sealed offer (or holds); a payload-free
 * `teacher:closeDay` hook resolves every agent simultaneously and
 * deterministically. A losing offer costs nothing but the day — unlike
 * L2's sealed bid, a slot's incumbent is only ever released the instant a
 * signing actually wins, never at offer-submission time (charter §2:
 * "Losing offers cost nothing but the day"). REVEAL is teacher-staged
 * finale theater (`teacher:revealNext`): a window recap, one playoff-factor
 * reveal per agent (signed then unsigned), final standings, a staged
 * semis+final bracket, and GM Awards computed from real market history.
 *
 * ----------------------------------------------------------- DEVIATIONS --
 * Smallest-sound-alternative deviations from the charter, flagged per its
 * own instruction:
 *   1. The charter leaves the exact GM Award algorithms, the standings/
 *      playoff tie-break beyond "form desc, then cap room, then name," and
 *      the small-class (<4 teams) playoff bracket shape as implementation
 *      judgment, not a spelled-out spec. This build makes those calls
 *      explicitly in-line (see `computeAwards`/`computePlayoffs` below) —
 *      documented, deterministic, and gracefully degrading, never
 *      fabricated, matching the charter's own award-omission rule.
 *   2. `stockFranchiseFor` and `formFor` in tradeDeadline.ts were private;
 *      both are now exported (pure visibility change, zero behavior change
 *      to L1/L2) so this module can import them rather than re-declare the
 *      same stock roster / midseason-form formula a third time, per the
 *      charter's own "L3 imports from both, never re-declares" directive.
 *   3. The charter's two illustrative COUNTERFACTUAL examples ("if your
 *      $30M day-2 offer had won, you'd have finished 3rd"; "you passed at
 *      $25M ask — he signed for $15M two days later") are patterns, not a
 *      spec for exactly which two facts to surface. `personalCounterfactuals`
 *      below implements the same *shape* — a real simulated rank swing from
 *      a losing offer, and a real discount on an agent never chased — as
 *      the two candidate slots, each included only when a genuine,
 *      non-fabricated instance exists (charter: "at most two").
 * Phase list is `LOBBY, HOOK, PLAY, REVEAL, COUNTERFACTUAL, SYNTHESIS,
 * COMPLETE` — exactly the charter's §5 list, an ordered subsequence of the
 * canonical vocabulary.
 */
import {
  CAP as L1_CAP,
  MARKET,
  MODULE_ID as DRAFT_DAY_MODULE_ID,
  SLOT_IDS,
  franchiseFor,
  type Player,
  type PositionTag,
  type SlotId,
} from "./draftDay.js";
import {
  BID_STEP,
  MIN_BID,
  MODULE_ID as TRADE_DEADLINE_MODULE_ID,
  RESCUE_POOL,
  TARGETS,
  VETERANS,
  deadCapFor,
  extractCarriedFranchises,
  formFor,
  isValidBid,
  stockFranchiseFor,
  type DeadlinePath,
  type FormTag,
  type TeamState as TDTeamState,
} from "./tradeDeadline.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

const MARKET_BY_ID: ReadonlyMap<string, Player> = new Map(MARKET.map((p) => [p.id, p]));
const VETERAN_BY_ID: ReadonlyMap<string, Player> = new Map(VETERANS.map((p) => [p.id, p]));
const RESCUE_BY_ID: ReadonlyMap<string, Player> = new Map(RESCUE_POOL.map((p) => [p.id, p]));
const TARGET_BY_ID: ReadonlyMap<string, (typeof TARGETS)[number]> = new Map(TARGETS.map((t) => [t.id, t]));

/* ============================================================= config == */

/** The rising cap — $100M -> $130M, the module's own fiction and its own economics (charter §1). */
export const CAP = 130;
export const WINDOW_DAYS = 4;
/** Reused from tradeDeadline verbatim: $5M steps, $5M minimum — the same "precise, not falsely continuous"
 *  granularity as L2's sealed bid, per "L3 imports from both, never re-declares." */
export const OFFER_STEP = BID_STEP;
export const MIN_OFFER = MIN_BID;
export const ASK_FLOOR = 10;

/* ============================================================== agents == */

export type AgentTier = "star" | "solid" | "value";

export type Agent = {
  id: string;
  name: string;
  position: PositionTag;
  tier: AgentTier;
  flavor: string;
  openingAsk: number;
  /** Known, public strength going into the window — the currency every roster form average is built from. */
  form: number;
  /** Hidden until the REVEAL finale — the module's decision-vs-outcome luck layer. */
  playoffFactor: number;
  /** Honest public flavor for the one riser and one shrinker only; "" for every other agent (charter §3). */
  factorHint: string;
};

/**
 * Fixed content, like draftDay's MARKET and tradeDeadline's TARGETS — not
 * session-seeded. Eight agents, two per position, three tiers (2 star / 3
 * solid / 3 value) per charter §3. Exactly one riser (+6, solid tier) and
 * one shrinker (-7, star tier); every other factor sits in the charter's
 * -2..+2 band, fixed here (never Math.random — deterministic content, like
 * every other fixed pool in this codebase).
 */
export const AGENTS: readonly Agent[] = [
  {
    id: "fa-star-sc",
    name: "Trey Bishop",
    position: "SCORER",
    tier: "star",
    flavor: "The best pure scorer left on the board — everyone knows it, which is exactly the problem.",
    openingAsk: 50,
    form: 90,
    playoffFactor: 1,
    factorHint: "",
  },
  {
    id: "fa-star-pm",
    name: "Priya Anand",
    position: "PLAYMAKER",
    tier: "star",
    flavor: "Every front office wants her running the offense in the stretch run.",
    openingAsk: 45,
    form: 87,
    playoffFactor: -7,
    factorHint: "Has never played a game that mattered this much.",
  },
  {
    id: "fa-solid-df",
    name: "Marcus Dell",
    position: "DEFENDER",
    tier: "solid",
    flavor: "Steady, physical, no drama — exactly what a stretch-run defense needs.",
    openingAsk: 35,
    form: 80,
    playoffFactor: -1,
    factorHint: "",
  },
  {
    id: "fa-solid-rb",
    name: "Jonah Rourke",
    position: "REBOUNDER",
    tier: "solid",
    flavor: "Not a name that jumps off the page. His résumé does.",
    openingAsk: 30,
    form: 78,
    playoffFactor: 6,
    factorHint: "Two deep playoff runs on the résumé.",
  },
  {
    id: "fa-solid-sc",
    name: "Dez Whitfield",
    position: "SCORER",
    tier: "solid",
    flavor: "A reliable second scoring option, priced like exactly that.",
    openingAsk: 30,
    form: 76,
    playoffFactor: 2,
    factorHint: "",
  },
  {
    id: "fa-value-pm",
    name: "Kai Sorensen",
    position: "PLAYMAKER",
    tier: "value",
    flavor: "Cheap insurance at the point — a backup plan that could start elsewhere.",
    openingAsk: 20,
    form: 70,
    playoffFactor: -2,
    factorHint: "",
  },
  {
    id: "fa-value-df",
    name: "Omar Hendricks",
    position: "DEFENDER",
    tier: "value",
    flavor: "A rotation piece, priced like a rotation piece.",
    openingAsk: 15,
    form: 66,
    playoffFactor: 0,
    factorHint: "",
  },
  {
    id: "fa-value-rb",
    name: "Theo Blackwood",
    position: "REBOUNDER",
    tier: "value",
    flavor: "Undersized, overworked, and available for cheap.",
    openingAsk: 15,
    form: 62,
    playoffFactor: 1,
    factorHint: "",
  },
] as const;
const AGENT_BY_ID: ReadonlyMap<string, Agent> = new Map(AGENTS.map((a) => [a.id, a]));
/** Fixed content order — used for deterministic reveal staging and market-board rendering. */
const AGENT_ORDER: readonly string[] = AGENTS.map((a) => a.id);

export const isFreeAgencySignee = (playerId: string): boolean => AGENT_BY_ID.has(playerId);

/* ============================================================ rosters == */

export type FreeAgencyOrigin = "l2" | "l1" | "stock";

/** A snapshotted roster occupant — frozen at extraction (or at signing), never re-derived (D15). */
export type CarriedPlayer = {
  playerId: string;
  name: string;
  position: PositionTag;
  /** The price actually paid for this player, wherever they came from. */
  price: number;
  form: number;
  formTag?: FormTag;
  storyLine: string;
};

export type FranchiseJourney = {
  /** L1 locked spend, only when this franchise's origin traces to a real, validly-locked L1 roster. */
  l1Spend: number | null;
  l2Path: DeadlinePath | null;
  l2DeadCapCarried: number;
  /** One honest, frozen recap line for the finale's franchise-journey timeline. */
  summary: string;
};

export type CarriedFranchiseL3 = {
  origin: FreeAgencyOrigin;
  name: string;
  crestIndex: number;
  slots: Record<SlotId, CarriedPlayer | null>;
  deadCapCarried: number;
  journey: FranchiseJourney;
};

const emptyCarriedSlots = (): Record<SlotId, CarriedPlayer | null> => ({
  SCORER: null,
  PLAYMAKER: null,
  DEFENDER: null,
  REBOUNDER: null,
  WILDCARD: null,
});

/**
 * A won L2 TARGET has no fixed rating (its worth is a dollar figure,
 * `trueValue`) — this maps it into rating space explicitly and
 * documentedly, per the charter's own default rule, so it can join the
 * same 0-100 form scale every other occupant uses without ever silently
 * conflating dollars and ratings (L2's own N1 lesson, cited by the
 * charter): `form = 50 + round(30 x (trueValue - floor) / (ceiling - floor))`.
 */
function targetForm(target: { floor: number; ceiling: number; trueValue: number }): number {
  const span = target.ceiling - target.floor;
  if (span <= 0) return 50;
  return 50 + Math.round((30 * (target.trueValue - target.floor)) / span);
}

/** Defensive shape guard for one L2 TeamState crossing the session boundary as `unknown` (via `seed`). Never
 *  throws; an unrecognizable team is simply skipped by the caller — one corrupted L2 team never blocks the
 *  rest of the class's carry-forward, same discipline as tradeDeadline's own `readDraftDayTeam`. */
function readL2Team(raw: unknown): TDTeamState | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const claimRaw = t["claim"];
  let claim: TDTeamState["claim"] = null;
  if (claimRaw && typeof claimRaw === "object") {
    const c = claimRaw as Record<string, unknown>;
    if (typeof c["name"] !== "string" || typeof c["crestIndex"] !== "number" || typeof c["spend"] !== "number") return null;
    if (c["origin"] !== "carried" && c["origin"] !== "stock") return null;
    if (!c["slots"] || typeof c["slots"] !== "object") return null;
    claim = c as unknown as TDTeamState["claim"];
  }
  if (!claim) return null; // an unclaimed L2 team carries nothing to L3
  const slotsRaw = t["slots"];
  if (!slotsRaw || typeof slotsRaw !== "object") return null;
  for (const slotId of SLOT_IDS) {
    const v = (slotsRaw as Record<string, unknown>)[slotId];
    if (v !== null && typeof v !== "string") return null;
  }
  if (typeof t["deadCapCharge"] !== "number") return null;
  const path = t["path"];
  if (path !== null && path !== "standPat" && path !== "veteran" && path !== "bid") return null;
  const bidOutcome = t["bidOutcome"];
  if (bidOutcome !== null && bidOutcome !== "won" && bidOutcome !== "lost") return null;
  return t as unknown as TDTeamState;
}

/** One filled L2 slot -> a self-contained CarriedPlayer, resolved across every one of L2's four occupant
 *  pools (MARKET/VETERAN/RESCUE/TARGET) using each pool's OWN exported data — never tradeDeadline's private
 *  per-team helpers, per "L3 imports from both, never re-declares." Returns null for an id this reader
 *  cannot resolve (corrupted state) — the slot is then treated as open, not a whole-team reject (charter
 *  §7's "normalize only where playability requires it"). */
function carriedPlayerFromL2(slotId: SlotId, playerId: string, team: TDTeamState): CarriedPlayer | null {
  const marketPlayer = MARKET_BY_ID.get(playerId);
  if (marketPlayer) {
    const pf = formFor(slotId, playerId); // exported from tradeDeadline — the exact midseason formula (charter §4)
    if (!pf) return null;
    return { playerId, name: pf.name, position: pf.position, price: pf.price, form: pf.currentForm, formTag: pf.formTag, storyLine: pf.reason };
  }
  const vet = VETERAN_BY_ID.get(playerId);
  if (vet) {
    return { playerId, name: vet.name, position: vet.position, price: vet.price, form: vet.rating, formTag: "steady", storyLine: "Signed at the trade deadline for cost certainty — steady ever since." };
  }
  const res = RESCUE_BY_ID.get(playerId);
  if (res) {
    return { playerId, name: res.name, position: res.position, price: res.price, form: res.rating, formTag: "steady", storyLine: "An aftermath rescue signing after a lost sealed bid — a fallback that stuck." };
  }
  const tgt = TARGET_BY_ID.get(playerId);
  if (tgt && team.bidTargetId === playerId && team.bidOutcome === "won" && team.bidAmount !== null) {
    const amount = team.bidAmount;
    const form = targetForm(tgt);
    const verdict = amount < tgt.trueValue ? "a steal" : amount > tgt.trueValue ? "winner's curse" : "a fair price";
    return {
      playerId,
      name: tgt.name,
      position: tgt.position,
      price: amount,
      form,
      storyLine: `Won a sealed bid at the deadline for $${amount}M — turned out to be worth about $${tgt.trueValue}M (${verdict}).`,
    };
  }
  return null;
}

function pathLabel(team: TDTeamState): string {
  if (team.path === "standPat") return "stood pat at the deadline";
  if (team.path === "veteran") return "cut for a known veteran at the deadline";
  if (team.path === "bid") {
    if (team.bidOutcome === "won") return "won a sealed bid at the deadline";
    if (team.bidOutcome === "lost") return "lost a sealed bid at the deadline";
    return "had a sealed bid still pending when the window opened";
  }
  return "never made a deadline decision";
}

function franchiseFromL2Team(team: TDTeamState): CarriedFranchiseL3 | null {
  if (!team.claim) return null;
  const slots = emptyCarriedSlots();
  for (const slotId of SLOT_IDS) {
    const pid = team.slots[slotId];
    slots[slotId] = pid ? carriedPlayerFromL2(slotId, pid, team) : null;
  }
  const l1Spend = team.claim.origin === "carried" ? team.claim.spend : null;
  const summary =
    `${l1Spend !== null ? `Entered Draft Day at $${l1Spend}M` : "Started as a fresh expansion franchise"}; ${pathLabel(team)}` +
    `${team.deadCapCharge > 0 ? `, carrying $${team.deadCapCharge}M in dead cap into the signing window` : ""}.`;
  return {
    origin: "l2",
    name: team.claim.name,
    crestIndex: team.claim.crestIndex,
    slots,
    deadCapCarried: team.deadCapCharge,
    journey: { l1Spend, l2Path: team.path, l2DeadCapCarried: team.deadCapCharge, summary },
  };
}

/** Every claimed L2 franchise, extracted, sorted deterministically: carried-from-L1 franchises first (by
 *  their original L1 join order, recovered via `claimedBy`'s inverse index — never object-key iteration
 *  order), then L2-stock franchises (by seatId, a stable string sort — reproducible from the same state,
 *  never random). */
function extractFromL2(seedState: Record<string, unknown>): CarriedFranchiseL3[] {
  const teamsRaw = seedState["teams"];
  if (!teamsRaw || typeof teamsRaw !== "object") return [];
  const claimedByRaw = seedState["claimedBy"];
  const claimedBy = claimedByRaw && typeof claimedByRaw === "object" ? (claimedByRaw as Record<string, unknown>) : {};
  const inverseIndex = new Map<string, number>();
  for (const [idxStr, seatVal] of Object.entries(claimedBy)) {
    if (typeof seatVal === "string") inverseIndex.set(seatVal, Number(idxStr));
  }

  type Candidate = { sortKey: readonly [number, number, string]; franchise: CarriedFranchiseL3 };
  const candidates: Candidate[] = [];
  for (const [seatId, raw] of Object.entries(teamsRaw as Record<string, unknown>)) {
    const team = readL2Team(raw);
    if (!team) continue;
    const franchise = franchiseFromL2Team(team);
    if (!franchise) continue;
    const carriedIdx = inverseIndex.get(seatId);
    const sortKey: readonly [number, number, string] = carriedIdx !== undefined ? [0, carriedIdx, seatId] : [1, 0, seatId];
    candidates.push({ sortKey, franchise });
  }
  candidates.sort((a, b) => a.sortKey[0] - b.sortKey[0] || a.sortKey[1] - b.sortKey[1] || a.sortKey[2].localeCompare(b.sortKey[2]));
  return candidates.map((c) => c.franchise);
}

/** L1-only fallback: reuses tradeDeadline's own `extractCarriedFranchises` wholesale (charter §4 — "reuse
 *  extractCarriedFranchises, exported by tradeDeadline"), then maps each resulting roster into L3's own
 *  self-contained CarriedFranchiseL3 shape. Zero dead cap; the journey notes "no deadline played." */
function extractFromL1(seed: unknown): CarriedFranchiseL3[] {
  const rosters = extractCarriedFranchises(seed); // already fully validated by tradeDeadline itself
  return rosters.map((r) => {
    const slots = emptyCarriedSlots();
    for (const slotId of SLOT_IDS) {
      const p = MARKET_BY_ID.get(r.slots[slotId]);
      slots[slotId] = p ? { playerId: p.id, name: p.name, position: p.position, price: p.price, form: p.rating, formTag: "steady", storyLine: `Locked on Draft Day for $${p.price}M.` } : null;
    }
    const l1Spend = r.origin === "carried" ? r.spend : null;
    return {
      origin: "l1" as const,
      name: r.name,
      crestIndex: r.crestIndex,
      slots,
      deadCapCarried: 0,
      journey: {
        l1Spend,
        l2Path: null,
        l2DeadCapCarried: 0,
        summary: l1Spend !== null ? `Entered Draft Day at $${l1Spend}M; no deadline played.` : "Started as a fresh expansion franchise; no deadline played.",
      },
    };
  });
}

/**
 * The entire seed-resolution policy (charter §4): prefer a linked
 * `m1l2-trade-deadline` session, fall back to `m1l1-draft-day`, else an
 * empty pool (every seat then gets a stock expansion franchise at claim
 * time — see `stockFranchiseL3`). Falls back purely on the seed's
 * `lessonModuleId`, never on whether the resolved pool happens to be
 * empty — an L2 class where nobody claimed anything is a legitimate empty
 * L2 pool, not a signal to go looking at L1 underneath it (mirrors
 * tradeDeadline's own L1 policy: an empty pool IS the "no link" case).
 */
export function extractCarriedFranchisesL3(seed: unknown): CarriedFranchiseL3[] {
  if (seed && typeof seed === "object") {
    const s = seed as Record<string, unknown>;
    if (s["lessonModuleId"] === TRADE_DEADLINE_MODULE_ID) {
      const state = s["state"];
      if (state && typeof state === "object") return extractFromL2(state as Record<string, unknown>);
      return [];
    }
    if (s["lessonModuleId"] === DRAFT_DAY_MODULE_ID) return extractFromL1(seed);
  }
  return [];
}

/** Stock "expansion franchise" for a seat with no valid carried data at all — reuses tradeDeadline's own
 *  `stockFranchiseFor` (exported for exactly this) rather than re-declaring the same $90M/$0-dead-cap
 *  roster shape a third time. */
function stockFranchiseL3(index: number): CarriedFranchiseL3 {
  const r = stockFranchiseFor(index);
  const slots = emptyCarriedSlots();
  for (const slotId of SLOT_IDS) {
    const p = MARKET_BY_ID.get(r.slots[slotId]);
    slots[slotId] = p ? { playerId: p.id, name: p.name, position: p.position, price: p.price, form: p.rating, formTag: "steady", storyLine: "A league-typical signing on this expansion roster." } : null;
  }
  return {
    origin: "stock",
    name: r.name,
    crestIndex: r.crestIndex,
    slots,
    deadCapCarried: 0,
    journey: { l1Spend: null, l2Path: null, l2DeadCapCarried: 0, summary: "A fresh expansion franchise — no Draft Day or Trade Deadline history behind it." },
  };
}

/* ============================================================== state == */

export type Offer = { agentId: string; amount: number; slot: SlotId; submittedAt: number };

export type SigningEvent = {
  day: number;
  agentId: string;
  agentName: string;
  position: PositionTag;
  slot: SlotId;
  amount: number;
  openingAsk: number;
  askAtSigning: number;
  releasedIncumbent: { name: string; price: number; deadCap: number } | null;
};

export type TeamState = {
  claim: CarriedFranchiseL3 | null;
  slots: Record<SlotId, CarriedPlayer | null>;
  /** Running total, starts at claim.deadCapCarried, grows with every incumbent released this window. */
  deadCap: number;
  /** Today's sealed, revisable offer — null when undecided, explicitly holding, or withdrawn. */
  pendingOffer: Offer | null;
  /** The pacing panel's explicit "acted (holding)" signal — see charter §2. Also true after a withdrawal
   *  (R2 repair) — "out for today" reads as acted for pacing, same as a plain hold. */
  held: boolean;
  /** R2 repair (VERIFY_L3.md R2): true once this team has withdrawn an offer THIS day — locks out any new
   *  offer for the rest of the day (editing an offer that's still standing never sets this; only an actual
   *  withdrawal does). Reset to false at every day close. */
  outForDay: boolean;
  /** Frozen chronological record of every agent this team has actually signed. */
  signings: readonly SigningEvent[];
};

export type AgentMarketState = {
  ask: number;
  signed: boolean;
  signedBy: SeatId | null;
  signedAmount: number | null;
  signedDay: number | null;
};

export type DayOfferRecord = { seatId: SeatId; agentId: string; amount: number; slot: SlotId; submittedAt: number };
export type DayResolutionRecord = {
  agentId: string;
  askBefore: number;
  offerCount: number;
  signedBy: SeatId | null;
  signedAmount: number | null;
  askAfter: number;
};
export type DayRecord = {
  day: number;
  offers: readonly DayOfferRecord[];
  resolutions: readonly DayResolutionRecord[];
};

/** R2/M1 repair: a withdrawn offer used to leave zero trace anywhere (VERIFY_L3.md R2's exploit evidence).
 *  Frozen the instant a withdrawal happens — never mutated afterward — so THE WALK-AWAY (M1) can credit a
 *  team for having genuinely engaged an agent even when they pulled out before the day closed. */
export type WithdrawnOfferRecord = { day: number; seatId: SeatId; agentId: string; slot: SlotId; amount: number; askAtWithdraw: number };

export type FreeAgencyState = {
  carriedFranchises: readonly CarriedFranchiseL3[];
  claimedBy: Record<number, SeatId>;
  stockClaimCount: number;
  teams: Record<SeatId, TeamState>;
  /** The currently-open day (1..WINDOW_DAYS) while the window is live; frozen at WINDOW_DAYS once closed. */
  day: number;
  windowClosed: boolean;
  agentMarket: Record<string, AgentMarketState>;
  /** Full per-day frozen history — offers (sealed amounts included) and resolutions, oldest first. The
   *  finale and SYNTHESIS are computed from this and nothing else (charter §6). */
  history: readonly DayRecord[];
  /** Every withdrawal, ever, across the whole window — cumulative, never reset at day close (unlike
   *  `history`, which is per-day; a withdrawal happens mid-day, before that day's record exists). */
  withdrawnOffers: readonly WithdrawnOfferRecord[];
  /** How many REVEAL stages have played, teacher-paced via `teacher:revealNext`. See `totalRevealSteps`. */
  revealStage: number;
};

const emptyTeamSlots = (): Record<SlotId, CarriedPlayer | null> => emptyCarriedSlots();

const emptyTeam = (): TeamState => ({ claim: null, slots: emptyTeamSlots(), deadCap: 0, pendingOffer: null, held: false, outForDay: false, signings: [] });

const getTeam = (state: FreeAgencyState, seatId: SeatId): TeamState => state.teams[seatId] ?? emptyTeam();
const withTeam = (state: FreeAgencyState, seatId: SeatId, team: TeamState): FreeAgencyState => ({ ...state, teams: { ...state.teams, [seatId]: team } });

/* Reveal step ordering: 1 window recap, then one factor reveal per agent (signed first, in AGENT_ORDER,
 * then unsigned, in AGENT_ORDER), then standings, then playoffs, then GM Awards. Fixed length regardless of
 * how many agents actually signed — order among agents is what varies, not the count. */
export const TOTAL_REVEAL_STEPS = 1 + AGENTS.length + 1 + 1 + 1;

function revealAgentOrder(state: FreeAgencyState): readonly Agent[] {
  const signed: Agent[] = [];
  const unsigned: Agent[] = [];
  for (const id of AGENT_ORDER) {
    const agent = AGENT_BY_ID.get(id)!;
    if (state.agentMarket[id]?.signed) signed.push(agent);
    else unsigned.push(agent);
  }
  return [...signed, ...unsigned];
}

/* -------------------------------------------------------------- helpers -- */

export const capUsedOf = (team: TeamState): number => {
  let sum = team.deadCap;
  for (const slot of SLOT_IDS) {
    const occ = team.slots[slot];
    if (occ) sum += occ.price;
  }
  return sum;
};

export const capRoomOf = (team: TeamState): number => CAP - capUsedOf(team);

/** What the cap-used total WOULD be if `amount` won the given slot right now — releasing whatever incumbent
 *  is there (dead-cap bite included) if the slot is occupied, or free if it's open. The one function both
 *  offer-submission validation and day-close resolution use, so a submitted offer's affordability check and
 *  its eventual resolution check are always computed the exact same way (charter §2's "checked at submit,
 *  re-checked at resolution"). */
export function projectedCapUsedForOffer(team: TeamState, slot: SlotId, amount: number): number {
  const incumbent = team.slots[slot];
  const releaseDeadCap = incumbent ? deadCapFor(incumbent.price) : 0;
  const baseWithoutSlot = capUsedOf(team) - (incumbent ? incumbent.price : 0);
  return baseWithoutSlot + releaseDeadCap + amount;
}

/** A team's average roster form. `revealFactors=false` (the live playoff picture during HOOK/PLAY/early
 *  REVEAL) uses only each occupant's known, public form. `revealFactors=true` (post-finale) adds each
 *  FREE-AGENCY signing's now-revealed hidden playoff factor — carried players never carry one (charter §3:
 *  "by the stretch run they're known quantities"). An empty slot contributes 0 either way — holes genuinely
 *  hurt (charter §4). */
export function teamForm(team: TeamState, revealFactors: boolean): number {
  let sum = 0;
  for (const slot of SLOT_IDS) {
    const occ = team.slots[slot];
    if (!occ) continue;
    let v = occ.form;
    if (revealFactors && isFreeAgencySignee(occ.playerId)) v += AGENT_BY_ID.get(occ.playerId)!.playoffFactor;
    sum += v;
  }
  return Math.round((sum / SLOT_IDS.length) * 10) / 10;
}

export type StandingRow = { seatId: SeatId; franchise: { name: string; crestIndex: number }; form: number; capRoom: number; rank: number };

/** Real (never random) standings: every claimed team ranked by team form (revealed factors once the finale
 *  has played, plain public form before that), tie-broken by cap room remaining then franchise name —
 *  exactly the tie-break the charter specifies for the playoff bracket, reused here for consistency. */
export function computeStandings(state: FreeAgencyState, revealFactors: boolean): StandingRow[] {
  const rows = Object.values(state.teams).filter((t): t is TeamState & { claim: CarriedFranchiseL3 } => t.claim !== null);
  const scored = rows.map((team) => ({
    seatId: findSeatId(state, team),
    franchise: { name: team.claim.name, crestIndex: team.claim.crestIndex },
    form: teamForm(team, revealFactors),
    capRoom: capRoomOf(team),
  }));
  scored.sort((a, b) => b.form - a.form || b.capRoom - a.capRoom || a.franchise.name.localeCompare(b.franchise.name));
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

function findSeatId(state: FreeAgencyState, team: TeamState): SeatId {
  for (const [seatId, t] of Object.entries(state.teams)) if (t === team) return seatId;
  return "";
}

export type PlayoffMatch = { a: StandingRow; b: StandingRow; winner: StandingRow };
export type PlayoffResult = { field: readonly StandingRow[]; semis: readonly PlayoffMatch[]; final: PlayoffMatch | null; champion: StandingRow | null };

/** Deterministic (charter §2/§5): higher final form advances; ties broken by cap room remaining, then name —
 *  a match between two already-distinct-by-construction standings rows, so a name-collision tie is
 *  structurally impossible, but the fallback stays here for defense-in-depth. */
function decideMatch(a: StandingRow, b: StandingRow): PlayoffMatch {
  const winner = a.form > b.form ? a : b.form > a.form ? b : a.capRoom >= b.capRoom ? a : b;
  return { a, b, winner };
}

/** The staged semis+final (charter REVEAL k+2), "presented as the standings playing out, never as fake
 *  randomness." Degrades gracefully for a class smaller than the classic 4-team bracket: 1 team is a
 *  walkover champion, 2 go straight to a final, 3 gives the top seed a bye into the final against the
 *  winner of a single play-in match between seeds 2 and 3. */
export function computePlayoffs(state: FreeAgencyState, revealFactors: boolean): PlayoffResult {
  const standings = computeStandings(state, revealFactors);
  const field = standings.slice(0, Math.min(4, standings.length));
  if (field.length === 0) return { field, semis: [], final: null, champion: null };
  if (field.length === 1) return { field, semis: [], final: null, champion: field[0]! };
  if (field.length === 2) {
    const final = decideMatch(field[0]!, field[1]!);
    return { field, semis: [], final, champion: final.winner };
  }
  if (field.length === 3) {
    const playIn = decideMatch(field[1]!, field[2]!);
    const final = decideMatch(field[0]!, playIn.winner);
    return { field, semis: [playIn], final, champion: final.winner };
  }
  const semi1 = decideMatch(field[0]!, field[3]!);
  const semi2 = decideMatch(field[1]!, field[2]!);
  const final = decideMatch(semi1.winner, semi2.winner);
  return { field, semis: [semi1, semi2], final, champion: final.winner };
}

/* --------------------------------------------------------------- reduce -- */

type ClaimAction = { type: "claim"; carriedIndex: unknown };
type OfferAction = { type: "offer"; agentId: unknown; amount: unknown; slot: unknown };
type WithdrawOfferAction = { type: "withdrawOffer" };
type HoldDayAction = { type: "holdDay" };

const isSlotId = (v: unknown): v is SlotId => typeof v === "string" && (SLOT_IDS as readonly string[]).includes(v);

function doClaim(state: FreeAgencyState, action: ClaimAction, ctx: ReduceContext): ReduceResult<FreeAgencyState> {
  const seatId = ctx.seatId;
  const existing = state.teams[seatId];
  if (existing && existing.claim) return { ok: false, reason: "you've already claimed a franchise" };

  if (action.carriedIndex === null) {
    const franchise = stockFranchiseL3(state.carriedFranchises.length + state.stockClaimCount);
    const team: TeamState = { claim: franchise, slots: { ...franchise.slots }, deadCap: franchise.deadCapCarried, pendingOffer: null, held: false, outForDay: false, signings: [] };
    return { ok: true, state: { ...withTeam(state, seatId, team), stockClaimCount: state.stockClaimCount + 1 } };
  }
  if (typeof action.carriedIndex !== "number" || !Number.isInteger(action.carriedIndex)) {
    return { ok: false, reason: "carriedIndex must be a whole number or null" };
  }
  const idx = action.carriedIndex;
  const franchise = state.carriedFranchises[idx];
  if (!franchise) return { ok: false, reason: `no carried franchise at index ${idx}` };
  if (state.claimedBy[idx] !== undefined) return { ok: false, reason: `${franchise.name} has already been claimed by another team` };

  const team: TeamState = { claim: franchise, slots: { ...franchise.slots }, deadCap: franchise.deadCapCarried, pendingOffer: null, held: false, outForDay: false, signings: [] };
  return { ok: true, state: { ...withTeam(state, seatId, team), claimedBy: { ...state.claimedBy, [idx]: seatId } } };
}

function requireClaimedOpenWindow(state: FreeAgencyState, seatId: SeatId): { ok: true; team: TeamState } | { ok: false; reason: string } {
  const team = getTeam(state, seatId);
  if (!team.claim) return { ok: false, reason: "claim a franchise before acting in the signing window" };
  if (state.windowClosed) return { ok: false, reason: "the signing window is closed" };
  return { ok: true, team };
}

function doOffer(state: FreeAgencyState, action: OfferAction, ctx: ReduceContext): ReduceResult<FreeAgencyState> {
  const pre = requireClaimedOpenWindow(state, ctx.seatId);
  if (!pre.ok) return pre;
  const team = pre.team;
  // R2 repair (VERIFY_L3.md R2): withdrawing ends the day — no new offer, whether this is a fresh offer or
  // an attempt to "re-enter" after pulling out. Editing an offer that's still standing (doOffer called again
  // before any withdrawal) never sets `outForDay`, so that path is untouched.
  if (team.outForDay) return { ok: false, reason: "you withdrew from today's market — the market saw you go. No new offer until tomorrow." };
  if (typeof action.agentId !== "string") return { ok: false, reason: "agentId must be a string" };
  const agent = AGENT_BY_ID.get(action.agentId);
  if (!agent) return { ok: false, reason: `no free agent "${String(action.agentId)}"` };
  const market = state.agentMarket[agent.id];
  if (!market || market.signed) return { ok: false, reason: `${agent.name} has already signed elsewhere` };
  if (!isSlotId(action.slot)) return { ok: false, reason: `"${String(action.slot)}" is not a roster slot` };
  const slot = action.slot;
  if (slot !== "WILDCARD" && agent.position !== slot) {
    return { ok: false, reason: `${agent.name} plays ${agent.position} and cannot fill the ${slot} slot` };
  }
  if (!isValidBid(action.amount)) {
    return { ok: false, reason: `an offer must be a whole number, at least $${MIN_OFFER}M, in $${OFFER_STEP}M steps` };
  }
  const projected = projectedCapUsedForOffer(team, slot, action.amount);
  if (projected > CAP) {
    return { ok: false, reason: `a $${action.amount}M offer on ${agent.name} would put you at $${projected}M — over the $${CAP}M cap even after releasing this slot's incumbent` };
  }
  const nextTeam: TeamState = { ...team, pendingOffer: { agentId: agent.id, amount: action.amount, slot, submittedAt: ctx.now }, held: false };
  return { ok: true, state: withTeam(state, ctx.seatId, nextTeam) };
}

/**
 * R2 repair (VERIFY_L3.md R2): "pulling out of talks" costs the day, not
 * just the offer. An offer stays freely editable (a fresh `offer` call
 * replaces it entirely, no cost) right up until it's actually withdrawn —
 * withdrawal is the one action that locks the team out of any further
 * offer this day (`outForDay`), closing the free submit-then-retract
 * interest-count toggle without touching genuine exit or misclick-safe
 * editing at all. Recorded in `withdrawnOffers` (frozen, cumulative) so the
 * finale can still credit real engagement — see THE WALK-AWAY (M1).
 */
function doWithdrawOffer(state: FreeAgencyState, _action: WithdrawOfferAction, ctx: ReduceContext): ReduceResult<FreeAgencyState> {
  const pre = requireClaimedOpenWindow(state, ctx.seatId);
  if (!pre.ok) return pre;
  const offer = pre.team.pendingOffer;
  if (!offer) return { ok: false, reason: "you don't have an offer in today to withdraw" };
  const market = state.agentMarket[offer.agentId];
  const record: WithdrawnOfferRecord = { day: state.day, seatId: ctx.seatId, agentId: offer.agentId, slot: offer.slot, amount: offer.amount, askAtWithdraw: market?.ask ?? offer.amount };
  const nextTeam: TeamState = { ...pre.team, pendingOffer: null, held: true, outForDay: true };
  return { ok: true, state: { ...withTeam(state, ctx.seatId, nextTeam), withdrawnOffers: [...state.withdrawnOffers, record] } };
}

function doHoldDay(state: FreeAgencyState, _action: HoldDayAction, ctx: ReduceContext): ReduceResult<FreeAgencyState> {
  const pre = requireClaimedOpenWindow(state, ctx.seatId);
  if (!pre.ok) return pre;
  return { ok: true, state: withTeam(state, ctx.seatId, { ...pre.team, pendingOffer: null, held: true }) };
}

/**
 * The market day loop's entire resolution engine (charter §2), pure and
 * deterministic. Used both by `teacher:closeDay` and by `onPhaseExit`
 * leaving PLAY early (charter §6a) — same function, so an auto-closed day
 * is byte-identical to one the teacher closed by hand.
 *
 * For every still-unsigned agent: rank today's offers on them (highest
 * amount first; ties by earliest `submittedAt`, then seatId — never
 * random). The top offer signs if it clears the agent's current ask, OR
 * unconditionally on day 4 (desperation) provided at least one offer
 * exists. A signing releases the winning team's slot incumbent (if any)
 * with the standing dead-cap bite — the ONLY moment a losing rival's own
 * roster is ever touched; every other offer that day, win or lose, leaves
 * the loser's roster exactly as it was ("Losing offers cost nothing but
 * the day," charter §2). An unsigned agent's ask moves by demand (0
 * offers -10, 1 offer -5, 2+ offers +5), floored at $10M.
 */
function closeCurrentDay(state: FreeAgencyState): FreeAgencyState {
  const day = state.day;
  const isFinalDay = day >= WINDOW_DAYS;

  const offerEntries: { seatId: SeatId; offer: Offer }[] = [];
  for (const [seatId, t] of Object.entries(state.teams)) {
    if (t.claim && t.pendingOffer) offerEntries.push({ seatId, offer: t.pendingOffer });
  }
  const offersRecord: DayOfferRecord[] = offerEntries.map(({ seatId, offer }) => ({ seatId, agentId: offer.agentId, amount: offer.amount, slot: offer.slot, submittedAt: offer.submittedAt }));

  const teams: Record<SeatId, TeamState> = { ...state.teams };
  const agentMarket: Record<string, AgentMarketState> = { ...state.agentMarket };
  const resolutions: DayResolutionRecord[] = [];

  for (const agentId of AGENT_ORDER) {
    const market = agentMarket[agentId]!;
    if (market.signed) continue;
    const agent = AGENT_BY_ID.get(agentId)!;
    const bidsOnAgent = offerEntries.filter((e) => e.offer.agentId === agentId);
    const ranked = [...bidsOnAgent].sort((a, b) => {
      if (b.offer.amount !== a.offer.amount) return b.offer.amount - a.offer.amount;
      if (a.offer.submittedAt !== b.offer.submittedAt) return a.offer.submittedAt - b.offer.submittedAt;
      return a.seatId.localeCompare(b.seatId);
    });
    const top = ranked[0] ?? null;
    const askBefore = market.ask;
    const topClearsAsk = top !== null && top.offer.amount >= askBefore;
    const signs = top !== null && (topClearsAsk || isFinalDay);

    if (signs && top) {
      const winnerSeatId = top.seatId;
      const winningTeam = teams[winnerSeatId]!;
      const incumbent = winningTeam.slots[top.offer.slot];
      const releaseDeadCap = incumbent ? deadCapFor(incumbent.price) : 0;
      const signingEvent: SigningEvent = {
        day,
        agentId: agent.id,
        agentName: agent.name,
        position: agent.position,
        slot: top.offer.slot,
        amount: top.offer.amount,
        openingAsk: agent.openingAsk,
        askAtSigning: askBefore,
        releasedIncumbent: incumbent ? { name: incumbent.name, price: incumbent.price, deadCap: releaseDeadCap } : null,
      };
      const newPlayer: CarriedPlayer = {
        playerId: agent.id,
        name: agent.name,
        position: agent.position,
        price: top.offer.amount,
        form: agent.form,
        storyLine: `Signed on day ${day} for $${top.offer.amount}M (opening ask was $${agent.openingAsk}M).`,
      };
      teams[winnerSeatId] = {
        ...winningTeam,
        deadCap: winningTeam.deadCap + releaseDeadCap,
        slots: { ...winningTeam.slots, [top.offer.slot]: newPlayer },
        signings: [...winningTeam.signings, signingEvent],
      };
      agentMarket[agentId] = { ask: askBefore, signed: true, signedBy: winnerSeatId, signedAmount: top.offer.amount, signedDay: day };
      resolutions.push({ agentId, askBefore, offerCount: bidsOnAgent.length, signedBy: winnerSeatId, signedAmount: top.offer.amount, askAfter: askBefore });
    } else {
      const count = bidsOnAgent.length;
      const delta = count === 0 ? -10 : count === 1 ? -5 : 5;
      const askAfter = Math.max(ASK_FLOOR, askBefore + delta);
      agentMarket[agentId] = { ...market, ask: askAfter };
      resolutions.push({ agentId, askBefore, offerCount: count, signedBy: null, signedAmount: null, askAfter });
    }
  }

  for (const seatId of Object.keys(teams)) {
    teams[seatId] = { ...teams[seatId]!, pendingOffer: null, held: false, outForDay: false };
  }

  const record: DayRecord = { day, offers: offersRecord, resolutions };
  const nextDay = isFinalDay ? day : day + 1;
  return { ...state, teams, agentMarket, day: nextDay, windowClosed: isFinalDay, history: [...state.history, record] };
}

/* --------------------------------------------------------------- module -- */

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "COUNTERFACTUAL", "SYNTHESIS", "COMPLETE"];

export const MODULE_ID = "m1l3-free-agency" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

export const HOOK_COPY =
  "The season's stretch run. The league's new TV deal just kicked in — the salary cap jumps from $100M to $130M, so every front office suddenly has room. But your books arrive exactly as you left them: every signing, every dollar of dead cap. Eight free agents just hit the open market. You have four days.";
/**
 * R1 repair (VERIFY_L3.md R1): the market's own governing rules, in plain
 * grade 5-6 language, surfaced on HOOK's market preview AND from the PLAY
 * composer (see `hookSummaryFor`/`playViewFor` below) — the two places a
 * student actually decides something. Order matches the order a team hits
 * these rules in a real day: submit/edit, (new) withdraw, price movement,
 * then the day-4 carve-out.
 */
export const MARKET_RULES: readonly string[] = [
  "Each day, your team can make ONE offer — or hold. You can change your offer as many times as you want (a new agent, a new amount, a new slot) right up until the day closes.",
  "Taking your offer back (withdraw) ends your day. The market saw you go — no new offer until tomorrow.",
  "If nobody's top offer meets an agent's asking price, the agent stays unsigned and the price moves. No offers that day: price drops $10M. One offer: price drops $5M. Two or more offers: price goes UP $5M — even if every single offer was low.",
  "Day 4 is the deadline. The top offer signs that agent no matter what — even if it's below the asking price.",
];
export const BEYOND_SPORTS_LINE =
  "Every market you'll ever enter — housing, concert tickets, a job offer — is other people, also constrained, changing your prices in real time. Waiting isn't free, and neither is rushing.";
export const EXIT_PROMPT = "When did someone else's choice change what you could do — and when did yours change theirs?";
export const MODULE_COMPLETE_COPY =
  "Module 1 is complete. Draft Day built your roster under a fixed budget. The Trade Deadline made you live with what that build cost you. Free Agency put you in a market full of other GMs doing the exact same math — and their choices changed your prices as much as yours changed theirs. That's the whole arc: scarcity, path dependence, and constraint that's never just about you.";

export const freeAgencyModule: LessonModule<FreeAgencyState> = {
  id: MODULE_ID,
  title: "Module 1 · Lesson 3 — Free Agency: The Signing Window",
  phases: PHASES,

  initialState(input) {
    const carriedFranchises = extractCarriedFranchisesL3(input.seed);
    const agentMarket: Record<string, AgentMarketState> = {};
    for (const a of AGENTS) agentMarket[a.id] = { ask: a.openingAsk, signed: false, signedBy: null, signedAmount: null, signedDay: null };
    return { carriedFranchises, claimedBy: {}, stockClaimCount: 0, teams: {}, day: 1, windowClosed: false, agentMarket, history: [], withdrawnOffers: [], revealStage: 0 };
  },

  /**
   * Reliability rider a (charter §6a): leaving PLAY auto-closes whatever day
   * is currently open, with the exact same resolution math as
   * `teacher:closeDay` — remaining days simply never happen (no loop over
   * days 4..N the way tradeDeadline loops over remaining targets; there is
   * nothing to resolve for a day that was never opened). Leaving REVEAL
   * auto-completes every remaining reveal stage, so no reachable
   * post-REVEAL state can depend on a `teacher:revealNext` click that never
   * came.
   */
  onPhaseExit(state, fromPhase) {
    let next = state;
    if (fromPhase === "PLAY" && !next.windowClosed) {
      // Leaving PLAY at all — on any day — permanently ends the window: no reachable state past PLAY may
      // still show "day 2 of 4, window open" just because the teacher happened to leave on day 1. Only the
      // currently-open day gets resolved; days that were never opened simply never happen (charter §6a).
      next = { ...closeCurrentDay(next), windowClosed: true };
    }
    if (fromPhase === "REVEAL" && next.revealStage < TOTAL_REVEAL_STEPS) next = { ...next, revealStage: TOTAL_REVEAL_STEPS };
    return next;
  },

  reduce(state, action, ctx): ReduceResult<FreeAgencyState> {
    if (action.type === "claim") {
      if (ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: false, reason: `claim a franchise during HOOK or PLAY (session is in ${ctx.phase})` };
      }
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can claim a franchise" };
      return doClaim(state, action as unknown as ClaimAction, ctx);
    }
    if (action.type === "offer") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `offers can only be made during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can make an offer" };
      return doOffer(state, action as unknown as OfferAction, ctx);
    }
    if (action.type === "withdrawOffer") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `offers can only be withdrawn during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can withdraw its own offer" };
      return doWithdrawOffer(state, action as unknown as WithdrawOfferAction, ctx);
    }
    if (action.type === "holdDay") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only hold during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated team can hold" };
      return doHoldDay(state, action as unknown as HoldDayAction, ctx);
    }
    if (action.type === "teacher:closeDay") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher can close the signing day" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the signing window can only be closed during PLAY (session is in ${ctx.phase})` };
      if (state.windowClosed) return { ok: false, reason: "the signing window is already fully closed" };
      return { ok: true, state: closeCurrentDay(state) };
    }
    if (action.type === "teacher:revealNext") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher can advance the reveal" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the reveal can only advance during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= TOTAL_REVEAL_STEPS) return { ok: false, reason: "every reveal stage has already played" };
      return { ok: true, state: { ...state, revealStage: state.revealStage + 1 } };
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "HOOK") return ["claim"];
    if (phase === "PLAY") return ["claim", "offer", "withdrawOffer", "holdDay"];
    return [];
  },

  studentView(state, seatId, phase) {
    const team = getTeam(state, seatId);
    const claimed = team.claim !== null;
    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return { phase, message: "You're in! Waiting for your teacher to start Free Agency." };

        case "HOOK": {
          if (!claimed) {
            return { phase, claimed: false, message: "Which franchise is yours? Pick it up exactly where the deadline left it — or start a fresh expansion franchise.", available: availableClaimsFor(state) };
          }
          return { phase, claimed: true, message: HOOK_COPY, ...hookSummaryFor(state, team) };
        }

        case "PLAY": {
          if (!claimed) {
            return { phase, claimed: false, lateJoin: true, message: "The signing window is already open — claim your franchise now. You'll have fewer days to shop, but you're not shut out.", available: availableClaimsFor(state) };
          }
          return { phase, claimed: true, ...playViewFor(state, seatId, team) };
        }

        case "REVEAL": {
          if (!claimed) return { phase, message: "You never claimed a franchise — talk to your teacher." };
          return { phase, franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex }, ...revealViewFor(state) };
        }

        case "COUNTERFACTUAL": {
          if (!claimed) return { phase, message: "You never claimed a franchise — talk to your teacher." };
          return { phase, franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex }, timeline: journeyTimelineFor(team), whatIfs: personalCounterfactuals(state, seatId), debatePrompts: DEBATE_PROMPTS };
        }

        case "SYNTHESIS":
          return { phase, message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

        case "COMPLETE":
          return { phase, message: MODULE_COMPLETE_COPY };

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
      capUsed: capUsedOf(team),
      capRoom: capRoomOf(team),
      deadCap: team.deadCap,
      signingsCount: team.signings.length,
      pendingOffer: team.pendingOffer, // teacher-only: sealed offers are visible here, never to students/board
      held: team.held,
      outForDay: team.outForDay,
      acted: team.pendingOffer !== null || team.held,
    }));
    return tag({
      phase,
      day: state.day,
      windowDays: WINDOW_DAYS,
      windowClosed: state.windowClosed,
      teamCount: teams.length,
      claimedCount: teams.filter((t) => t.claimed).length,
      actedCount: teams.filter((t) => t.claimed && t.acted).length,
      pendingCount: teams.filter((t) => t.claimed && t.pendingOffer !== null).length,
      carriedFranchiseCount: state.carriedFranchises.length,
      agents: AGENTS.map((a) => ({ id: a.id, name: a.name, position: a.position, tier: a.tier, ...state.agentMarket[a.id]! })),
      revealStage: state.revealStage,
      totalRevealSteps: TOTAL_REVEAL_STEPS,
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
          return { mode: "hook", message: HOOK_COPY, claimedCount, cap: CAP };
        }

        case "PLAY":
          return { mode: "play", ...boardPlayViewFor(state) };

        case "REVEAL":
          return { mode: "reveal", ...revealViewFor(state) };

        case "COUNTERFACTUAL":
          return { mode: "counterfactual", classCards: classCounterfactuals(state), debatePrompts: DEBATE_PROMPTS };

        case "SYNTHESIS": {
          const agg = computeAggregate(state);
          return { mode: "synthesis", heading: "WHAT ECONOMICS DID WE JUST USE?", cards: synthesisCards(state, agg), beyondSports: BEYOND_SPORTS_LINE, exitPrompt: EXIT_PROMPT };
        }

        case "COMPLETE":
          return { mode: "complete", message: MODULE_COMPLETE_COPY };

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

function availableClaimsFor(state: FreeAgencyState) {
  const claimedIndices = new Set(Object.keys(state.claimedBy).map(Number));
  return state.carriedFranchises
    .map((f, index) => ({ index, franchise: f }))
    .filter((entry) => !claimedIndices.has(entry.index))
    .map((entry) => ({
      index: entry.index,
      name: entry.franchise.name,
      crestIndex: entry.franchise.crestIndex,
      origin: entry.franchise.origin,
      deadCapCarried: entry.franchise.deadCapCarried,
      capRoom: CAP - entry.franchise.deadCapCarried - SLOT_IDS.reduce((s, slot) => s + (entry.franchise.slots[slot]?.price ?? 0), 0),
      roster: SLOT_IDS.map((slot) => cardFor(entry.franchise.slots[slot])),
    }));
}

function cardFor(p: CarriedPlayer | null): { name: string; position: PositionTag; price: number; form: number } | null {
  if (!p) return null;
  return { name: p.name, position: p.position, price: p.price, form: p.form };
}

/** Every unsigned agent's live market card — ask, trend vs. its previous ask, price history, and (only while
 *  a day is actually open, i.e. never once the window has closed) the live interest count: how many teams
 *  currently have a pending offer in on this agent RIGHT NOW. Count only — never names, never amounts
 *  (charter §2's "no names, no amounts"). A signed agent's card carries its full public sheet instead — the
 *  one and only place a sealed amount ever becomes public before the finale. */
function agentBoardCards(state: FreeAgencyState) {
  return AGENTS.map((a) => {
    const market = state.agentMarket[a.id]!;
    const history = priceHistoryFor(state, a.id);
    const interestCount = state.windowClosed ? 0 : Object.values(state.teams).filter((t) => t.pendingOffer?.agentId === a.id).length;
    let signedFranchise: { name: string; crestIndex: number } | null = null;
    if (market.signed && market.signedBy) {
      const winner = state.teams[market.signedBy];
      if (winner && winner.claim) signedFranchise = { name: winner.claim.name, crestIndex: winner.claim.crestIndex };
    }
    return {
      id: a.id,
      name: a.name,
      position: a.position,
      tier: a.tier,
      flavor: a.flavor,
      factorHint: a.factorHint,
      openingAsk: a.openingAsk,
      ask: market.ask,
      trend: history.length >= 2 ? Math.sign(history[history.length - 1]! - history[history.length - 2]!) : 0,
      priceHistory: history,
      interestCount,
      signed: market.signed,
      signedAmount: market.signed ? market.signedAmount : null,
      signedDay: market.signedDay,
      signedFranchise,
    };
  });
}

function priceHistoryFor(state: FreeAgencyState, agentId: string): number[] {
  const agent = AGENT_BY_ID.get(agentId)!;
  const points = [agent.openingAsk];
  for (const day of state.history) {
    const r = day.resolutions.find((res) => res.agentId === agentId);
    if (!r) break; // already signed by an earlier day — history stops there
    points.push(r.askAfter);
  }
  return points;
}

function hookSummaryFor(state: FreeAgencyState, team: TeamState) {
  return {
    franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex, origin: team.claim!.origin },
    capRoom: capRoomOf(team),
    deadCapCarried: team.claim!.deadCapCarried,
    roster: SLOT_IDS.map((slot) => ({ id: slot, player: cardFor(team.slots[slot]) })),
    teamForm: teamForm(team, false),
    standing: standingFor(state, team, false),
    marketPreview: AGENTS.map((a) => ({ id: a.id, name: a.name, position: a.position, tier: a.tier, flavor: a.flavor, openingAsk: a.openingAsk, factorHint: a.factorHint })),
    marketRules: MARKET_RULES,
  };
}

function standingFor(state: FreeAgencyState, team: TeamState, revealFactors: boolean): { rank: number; totalTeams: number; inHunt: boolean } | null {
  if (!team.claim) return null;
  const standings = computeStandings(state, revealFactors);
  const seatId = findSeatId(state, team);
  const row = standings.find((r) => r.seatId === seatId);
  if (!row) return null;
  return { rank: row.rank, totalTeams: standings.length, inHunt: row.rank <= Math.min(4, standings.length) };
}

function playViewFor(state: FreeAgencyState, seatId: SeatId, team: TeamState) {
  const acted = team.pendingOffer !== null || team.held;
  return {
    day: state.day,
    windowDays: WINDOW_DAYS,
    windowClosed: state.windowClosed,
    franchise: { name: team.claim!.name, crestIndex: team.claim!.crestIndex },
    capRoom: capRoomOf(team),
    deadCap: team.deadCap,
    roster: SLOT_IDS.map((slot) => ({ id: slot, player: cardFor(team.slots[slot]), releaseDeadCap: team.slots[slot] ? deadCapFor(team.slots[slot]!.price) : 0 })),
    market: agentBoardCards(state),
    offerStep: OFFER_STEP,
    minOffer: MIN_OFFER,
    acted,
    held: team.held,
    outForDay: team.outForDay,
    pendingOffer: team.pendingOffer, // own offer only — this is studentView reading its own team, never another seat's
    history: dayHistoryPublicFor(state, seatId),
    marketRules: MARKET_RULES,
  };
}

/** The public, phase-appropriate view of every closed day: a signed agent's full offer sheet (franchise-named,
 *  amounts included); an unsigned agent's count + price move only (sealed amounts withheld) — UNLESS this is the
 *  viewer's own offer (always visible to themselves) or the finale has fully disclosed history (COUNTERFACTUAL/
 *  SYNTHESIS/COMPLETE), per charter §2's disclosure rule and §6e's sealed-offer privacy rule. `viewerSeatId`
 *  omitted (undefined) means "no owner to exempt" — used by boardView, which must never show a sealed amount. */
function dayHistoryPublicFor(state: FreeAgencyState, viewerSeatId?: SeatId, revealAll = false) {
  return state.history.map((day) => ({
    day: day.day,
    resolutions: day.resolutions.map((r) => {
      const agent = AGENT_BY_ID.get(r.agentId)!;
      if (r.signedBy) {
        const winner = state.teams[r.signedBy];
        return {
          agentId: r.agentId,
          agentName: agent.name,
          signed: true,
          franchise: winner?.claim ? { name: winner.claim.name, crestIndex: winner.claim.crestIndex } : null,
          amount: r.signedAmount,
          offerCount: r.offerCount,
        };
      }
      const ownOffer = viewerSeatId ? day.offers.find((o) => o.seatId === viewerSeatId && o.agentId === r.agentId) : undefined;
      return {
        agentId: r.agentId,
        agentName: agent.name,
        signed: false,
        offerCount: r.offerCount,
        askBefore: r.askBefore,
        askAfter: r.askAfter,
        ownAmount: ownOffer ? ownOffer.amount : null,
        allOffers: revealAll ? day.offers.filter((o) => o.agentId === r.agentId).map((o) => ({ seatId: o.seatId, amount: o.amount })) : null,
      };
    }),
  }));
}

function boardPlayViewFor(state: FreeAgencyState) {
  const teams = Object.entries(state.teams).filter(([, t]) => t.claim !== null);
  const acted = teams.filter(([, t]) => t.pendingOffer !== null || t.held).length;
  return {
    day: state.day,
    windowDays: WINDOW_DAYS,
    windowClosed: state.windowClosed,
    totalTeams: teams.length,
    actedCount: acted,
    market: agentBoardCards(state),
    capRooms: teams.map(([, t]) => ({ franchise: { name: t.claim!.name, crestIndex: t.claim!.crestIndex }, capRoom: capRoomOf(t) })),
    standings: computeStandings(state, false).slice(0, Math.min(4, teams.length)),
    lastDayResults: state.history.length > 0 ? dayHistoryPublicFor(state).at(-1) : null,
  };
}

/* ------------------------------------------------------------- reveal -- */

function revealViewFor(state: FreeAgencyState) {
  const stage = state.revealStage;
  const order = revealAgentOrder(state);
  const revealedAgentIds = new Set(order.slice(0, Math.max(0, Math.min(stage - 1, order.length))).map((a) => a.id));
  const standingsShown = stage > 1 + AGENTS.length;
  const playoffsShown = stage > 1 + AGENTS.length + 1;
  const awardsShown = stage > 1 + AGENTS.length + 2;

  return {
    stage,
    totalStages: TOTAL_REVEAL_STEPS,
    windowRecap: stage >= 1 ? windowRecap(state) : null,
    agents: order.map((a) => ({
      id: a.id,
      name: a.name,
      position: a.position,
      tier: a.tier,
      openingAsk: a.openingAsk,
      form: a.form,
      revealed: revealedAgentIds.has(a.id),
      playoffFactor: revealedAgentIds.has(a.id) ? a.playoffFactor : null,
      factorHint: a.factorHint,
      signed: state.agentMarket[a.id]!.signed,
      signedFranchise: signedFranchiseFor(state, a.id),
      signedAmount: state.agentMarket[a.id]!.signedAmount,
    })),
    standings: standingsShown ? computeStandings(state, true) : null,
    playoffs: playoffsShown ? computePlayoffs(state, true) : null,
    awards: awardsShown ? computeAwards(state) : null,
  };
}

function signedFranchiseFor(state: FreeAgencyState, agentId: string): { name: string; crestIndex: number } | null {
  const market = state.agentMarket[agentId];
  if (!market || !market.signed || !market.signedBy) return null;
  const t = state.teams[market.signedBy];
  return t && t.claim ? { name: t.claim.name, crestIndex: t.claim.crestIndex } : null;
}

function windowRecap(state: FreeAgencyState) {
  const allSignings: { ev: SigningEvent; franchise: { name: string; crestIndex: number } }[] = [];
  for (const t of Object.values(state.teams)) {
    if (!t.claim) continue;
    for (const ev of t.signings) allSignings.push({ ev, franchise: { name: t.claim.name, crestIndex: t.claim.crestIndex } });
  }
  const totalSpent = allSignings.reduce((s, e) => s + e.ev.amount, 0);
  const biggest = allSignings.length > 0 ? [...allSignings].sort((a, b) => b.ev.amount - a.ev.amount || a.ev.day - b.ev.day)[0]! : null;
  let steepestFall: { agentName: string; from: number; to: number } | null = null;
  for (const a of AGENTS) {
    const market = state.agentMarket[a.id]!;
    if (market.signed) continue;
    const drop = a.openingAsk - market.ask;
    if (drop > 0 && (!steepestFall || drop > steepestFall.from - steepestFall.to)) steepestFall = { agentName: a.name, from: a.openingAsk, to: market.ask };
  }
  return {
    signedCount: allSignings.length,
    totalAgents: AGENTS.length,
    totalSpent,
    biggestContract: biggest ? { agentName: biggest.ev.agentName, amount: biggest.ev.amount, day: biggest.ev.day, franchise: biggest.franchise } : null,
    steepestFall,
  };
}

/* ------------------------------------------------------------ GM Awards -- */

export type AwardCard = { id: string; title: string; franchise: { name: string; crestIndex: number } | null; agentName: string | null; body: string };

/**
 * Computed from real market history only — never fabricated, and every
 * award omits gracefully when nobody genuinely qualifies (charter REVEAL
 * k+3). Algorithms are this build's own reasonable, deterministic,
 * documented judgment calls (flagged in the module header as a deviation
 * from the charter leaving them unspecified):
 *   THE BARGAIN — highest (form + revealed factor) per dollar among every
 *     actual signing this window.
 *   PERFECT TIMING — signed furthest below its own opening ask.
 *   IRON BOOKS — best final standing among teams with zero signings; fires
 *     even when the WHOLE class held (M2 repair, VERIFY_L3.md M2), gated
 *     only on there being >= 2 claimed teams (a one-team dry run still has
 *     nothing to honor against).
 *   THE WALK-AWAY — M1 repair (VERIFY_L3.md M1): candidates are (agent,
 *     team) pairs where the team genuinely engaged (stood at close on some
 *     day, or withdrew under the R2 rule) and never ended up signing that
 *     agent, restricted to agents whose revealed factor is negative — the
 *     ones a team was actually right to be wary of. Picks the most negative
 *     factor (the story the shrinker was built for), tie-broken by the
 *     highest asking price the team was engaged at, then agent name. This
 *     replaces the old "single worst agent by raw form" metric, which
 *     deterministically spotlighted a cheap value player every session and
 *     could never tell the shrinker's story at all.
 */
function computeAwards(state: FreeAgencyState): AwardCard[] {
  const teams = Object.entries(state.teams).filter(([, t]) => t.claim !== null) as [SeatId, TeamState][];
  if (teams.length === 0) return [];
  const awards: AwardCard[] = [];

  const allSignings: { seatId: SeatId; team: TeamState; ev: SigningEvent }[] = [];
  for (const [seatId, team] of teams) for (const ev of team.signings) allSignings.push({ seatId, team, ev });

  if (allSignings.length > 0) {
    let best = allSignings[0]!;
    let bestScore = -Infinity;
    for (const s of allSignings) {
      const agent = AGENT_BY_ID.get(s.ev.agentId)!;
      const score = (agent.form + agent.playoffFactor) / s.ev.amount;
      if (score > bestScore || (score === bestScore && s.ev.amount < best.ev.amount)) {
        bestScore = score;
        best = s;
      }
    }
    const agent = AGENT_BY_ID.get(best.ev.agentId)!;
    awards.push({
      id: "bargain",
      title: "THE BARGAIN",
      franchise: { name: best.team.claim!.name, crestIndex: best.team.claim!.crestIndex },
      agentName: agent.name,
      body: `${best.team.claim!.name} signed ${agent.name} for $${best.ev.amount}M. With the finale factor revealed, he turned out to be worth every dollar and then some — the best value signing of the window.`,
    });
  }

  if (allSignings.length > 0) {
    let best = allSignings[0]!;
    let bestDiscount = -Infinity;
    for (const s of allSignings) {
      const discount = s.ev.openingAsk - s.ev.amount;
      if (discount > bestDiscount || (discount === bestDiscount && s.ev.day < best.ev.day)) {
        bestDiscount = discount;
        best = s;
      }
    }
    if (bestDiscount > 0) {
      awards.push({
        id: "perfect-timing",
        title: "PERFECT TIMING",
        franchise: { name: best.team.claim!.name, crestIndex: best.team.claim!.crestIndex },
        agentName: best.ev.agentName,
        body: `${best.team.claim!.name} landed ${best.ev.agentName} on day ${best.ev.day} for $${best.ev.amount}M — $${bestDiscount}M under his $${best.ev.openingAsk}M opening ask. Patience paid off.`,
      });
    }
  }

  // M2 repair (VERIFY_L3.md M2): only guard on there being a real class to compare within (>= 2 claimed
  // teams) — dropped the old "at least one OTHER team must have signed" guard, which excluded exactly the
  // all-wait class the award exists to honor (charter §2: "all-wait collapses into a fierce day-4 auction").
  const zeroSigners = teams.filter(([, t]) => t.signings.length === 0);
  if (zeroSigners.length > 0 && teams.length >= 2) {
    const standings = computeStandings(state, true);
    const ranked = zeroSigners
      .map(([seatId, t]) => ({ seatId, t, rank: standings.find((r) => r.seatId === seatId)?.rank ?? 999 }))
      .sort((a, b) => a.rank - b.rank || a.t.claim!.name.localeCompare(b.t.claim!.name));
    const winner = ranked[0]!;
    const wholeRoomHeld = zeroSigners.length === teams.length;
    awards.push({
      id: "iron-books",
      title: "IRON BOOKS",
      franchise: { name: winner.t.claim!.name, crestIndex: winner.t.claim!.crestIndex },
      agentName: null,
      body: wholeRoomHeld
        ? `${winner.t.claim!.name} finished #${winner.rank} without a single signing — and neither did anyone else this window. The whole room held its money; these books held the line best.`
        : `${winner.t.claim!.name} never made a single signing this window and still finished #${winner.rank}. Sometimes the best move in a market is not making one.`,
    });
  }

  // M1 repair (VERIFY_L3.md M1): every (agent, team) pair where the team genuinely engaged (stood at close on
  // some day's offers, or withdrew under R2) and never ended up signing that agent — restricted to agents
  // whose revealed factor is negative, so this can actually spotlight the −7 shrinker rather than always
  // landing on the cheapest mediocre value player by raw form.
  const engagedAndDidNotSign = new Map<string, { agentId: string; seatId: SeatId; askAtWalk: number }>();
  const considerEngagement = (seatId: SeatId, agentId: string, askAtWalk: number) => {
    const market = state.agentMarket[agentId];
    if (!market || market.signedBy === seatId) return; // this team DID end up signing this one -- not a walk-away
    const agent = AGENT_BY_ID.get(agentId);
    if (!agent || agent.playoffFactor >= 0) return; // only a genuine trap counts as something worth walking from
    const key = `${seatId}::${agentId}`;
    const existing = engagedAndDidNotSign.get(key);
    if (!existing || askAtWalk > existing.askAtWalk) engagedAndDidNotSign.set(key, { agentId, seatId, askAtWalk });
  };
  for (const day of state.history) {
    for (const o of day.offers) {
      const resolution = day.resolutions.find((r) => r.agentId === o.agentId);
      considerEngagement(o.seatId, o.agentId, resolution ? resolution.askBefore : o.amount);
    }
  }
  for (const w of state.withdrawnOffers) considerEngagement(w.seatId, w.agentId, w.askAtWithdraw);

  const walkAwayCandidates = [...engagedAndDidNotSign.values()];
  if (walkAwayCandidates.length > 0) {
    walkAwayCandidates.sort((a, b) => {
      const factorA = AGENT_BY_ID.get(a.agentId)!.playoffFactor;
      const factorB = AGENT_BY_ID.get(b.agentId)!.playoffFactor;
      if (factorA !== factorB) return factorA - factorB; // most negative factor first
      if (b.askAtWalk !== a.askAtWalk) return b.askAtWalk - a.askAtWalk; // then the highest ask they were engaged at
      return AGENT_BY_ID.get(a.agentId)!.name.localeCompare(AGENT_BY_ID.get(b.agentId)!.name);
    });
    const top = walkAwayCandidates[0]!;
    const agent = AGENT_BY_ID.get(top.agentId)!;
    const team = state.teams[top.seatId];
    if (team && team.claim) {
      awards.push({
        id: "walk-away",
        title: "THE WALK-AWAY",
        franchise: { name: team.claim.name, crestIndex: team.claim.crestIndex },
        agentName: agent.name,
        body: `${team.claim.name} was in talks for ${agent.name} — up to $${top.askAtWalk}M — and never signed him. With the finale factor revealed, ${agent.name} turned out to be a real trap. The best money never spent.`,
      });
    }
  }

  return awards;
}

/* --------------------------------------------------------- counterfactuals -- */

export type JourneyStop = { label: string; body: string };
function journeyTimelineFor(team: TeamState): JourneyStop[] {
  const j = team.claim!.journey;
  const stops: JourneyStop[] = [];
  stops.push({ label: "Draft Day", body: j.l1Spend !== null ? `Locked a roster at $${j.l1Spend}M.` : "No Draft Day history — an expansion franchise." });
  stops.push({ label: "Trade Deadline", body: j.l2Path !== null ? j.summary : "No deadline played." });
  stops.push({ label: "Free Agency", body: team.signings.length > 0 ? `Signed ${team.signings.length} free agent${team.signings.length === 1 ? "" : "s"} across the window.` : "Made no signings this window." });
  return stops;
}

/** At most two personal what-ifs, computed deterministically from this team's own frozen offer history —
 *  never fabricated, gracefully fewer than two when nothing genuine qualifies (charter COUNTERFACTUAL). */
function personalCounterfactuals(state: FreeAgencyState, seatId: SeatId): string[] {
  const results: string[] = [];
  const team = state.teams[seatId];
  if (!team || !team.claim) return results;
  const actualRank = standingFor(state, team, true)?.rank ?? null;

  // (1) A losing offer that, had it won instead, would have genuinely improved this team's final rank.
  let bestSwing: { agentName: string; amount: number; day: number; rank: number } | null = null;
  for (const day of state.history) {
    for (const o of day.offers) {
      if (o.seatId !== seatId) continue;
      const resolution = day.resolutions.find((r) => r.agentId === o.agentId);
      if (!resolution || resolution.signedBy === seatId) continue; // already won, or not this agent's resolution
      const agent = AGENT_BY_ID.get(o.agentId);
      if (!agent) continue;
      const incumbent = team.slots[o.slot];
      const hypotheticalTeam: TeamState = { ...team, slots: { ...team.slots, [o.slot]: { playerId: agent.id, name: agent.name, position: agent.position, price: o.amount, form: agent.form, storyLine: "" } } };
      void incumbent;
      const hypotheticalRank = computeStandings({ ...state, teams: { ...state.teams, [seatId]: hypotheticalTeam } }, true).find((r) => r.seatId === seatId)?.rank ?? null;
      if (hypotheticalRank !== null && actualRank !== null && hypotheticalRank < actualRank) {
        if (!bestSwing || hypotheticalRank < bestSwing.rank) bestSwing = { agentName: agent.name, amount: o.amount, day: day.day, rank: hypotheticalRank };
      }
    }
  }
  if (bestSwing) results.push(`If your $${bestSwing.amount}M day-${bestSwing.day} offer on ${bestSwing.agentName} had won, you'd have finished #${bestSwing.rank} instead.`);

  // (2) An agent this team never chased at all, who ultimately signed elsewhere for less than their opening ask.
  const neverOffered = new Set(AGENT_ORDER);
  for (const day of state.history) for (const o of day.offers) if (o.seatId === seatId) neverOffered.delete(o.agentId);
  let bestDiscount: { agentName: string; from: number; to: number; franchiseName: string } | null = null;
  for (const agentId of neverOffered) {
    const market = state.agentMarket[agentId];
    const agent = AGENT_BY_ID.get(agentId)!;
    if (!market || !market.signed || market.signedAmount === null || !market.signedBy) continue;
    const discount = agent.openingAsk - market.signedAmount;
    if (discount <= 0) continue;
    if (!bestDiscount || discount > bestDiscount.from - bestDiscount.to) {
      const winner = state.teams[market.signedBy];
      bestDiscount = { agentName: agent.name, from: agent.openingAsk, to: market.signedAmount, franchiseName: winner?.claim?.name ?? "another team" };
    }
  }
  if (bestDiscount) results.push(`You never went after ${bestDiscount.agentName} — ${bestDiscount.franchiseName} signed him for $${bestDiscount.to}M, down from a $${bestDiscount.from}M opening ask.`);

  return results.slice(0, 2);
}

export const DEBATE_PROMPTS: readonly string[] = ["Was waiting smart, or lucky?", "Which team made the best decision that got the worst result?"];

function classCounterfactuals(state: FreeAgencyState): { id: string; title: string; body: string }[] {
  const cards: { id: string; title: string; body: string }[] = [];
  const teams = Object.values(state.teams).filter((t): t is TeamState & { claim: CarriedFranchiseL3 } => t.claim !== null);
  if (teams.length === 0) return cards;

  const day1Cost = AGENTS.reduce((s, a) => s + a.openingAsk, 0);
  const allSignings = teams.flatMap((t) => t.signings);
  const actualCost = allSignings.reduce((s, ev) => s + ev.amount, 0);
  cards.push({
    id: "patience-dividend",
    title: "THE PATIENCE DIVIDEND",
    body:
      allSignings.length > 0
        ? `Signing every one of this window's ${allSignings.length} deal${allSignings.length === 1 ? "" : "s"} at day-1 opening asking prices would have cost $${AGENTS.filter((a) => allSignings.some((ev) => ev.agentId === a.id)).reduce((s, a) => s + a.openingAsk, 0)}M. The room actually paid $${actualCost}M. Waiting — or losing the room's own nerve to a rival's bid — moved real money.`
        : `Nobody signed anyone this window — so nobody paid the $${day1Cost}M it would have cost to sign every agent at their day-1 opening ask, either. A quiet market is still a market.`,
  });

  const riser = AGENTS.find((a) => a.playoffFactor === Math.max(...AGENTS.map((x) => x.playoffFactor)));
  if (riser) {
    const market = state.agentMarket[riser.id]!;
    cards.push({
      id: "near-miss-riser",
      title: "THE NEAR-MISS",
      body: market.signed
        ? `${riser.name} — "${riser.factorHint}" — turned out to have the biggest hidden upside in the class (+${riser.playoffFactor}). ${signedFranchiseFor(state, riser.id)?.name ?? "A team"} grabbed him for $${market.signedAmount}M.`
        : `${riser.name} — "${riser.factorHint}" — had the biggest hidden upside in the class (+${riser.playoffFactor}), and nobody signed him. He's still on the open market.`,
    });
  }

  const totalDeadCapCarried = teams.reduce((s, t) => s + t.claim.deadCapCarried, 0);
  cards.push({
    id: "dead-cap-drag",
    title: "THE DEAD CAP DRAG",
    body:
      totalDeadCapCarried > 0
        ? `The room carried $${totalDeadCapCarried}M in dead cap into this window — money already spent, on nobody currently on any roster, before a single free agent hit the market. That's the standing cost of every undo from the deadline, still on the books.`
        : `Nobody in this class carried any dead cap into the window — every team's books were clean going into free agency.`,
  });

  return cards;
}

/* ------------------------------------------------------------ aggregate -- */

export type Aggregate = {
  totalTeams: number;
  claimedTeams: number;
  totalSignings: number;
  totalSpent: number;
  zeroSigningTeams: number;
  atCapL1Count: number;
  leftoverL1Count: number;
  deadCapCarriers: number;
  cleanBooks: number;
};

function computeAggregate(state: FreeAgencyState): Aggregate {
  const teams = Object.values(state.teams).filter((t): t is TeamState & { claim: CarriedFranchiseL3 } => t.claim !== null);
  const totalSignings = teams.reduce((s, t) => s + t.signings.length, 0);
  const totalSpent = teams.reduce((s, t) => s + t.signings.reduce((s2, ev) => s2 + ev.amount, 0), 0);
  const zeroSigningTeams = teams.filter((t) => t.signings.length === 0).length;
  const atCapL1Count = teams.filter((t) => t.claim.journey.l1Spend === L1_CAP).length;
  const leftoverL1Count = teams.filter((t) => t.claim.journey.l1Spend !== null && t.claim.journey.l1Spend < L1_CAP).length;
  const deadCapCarriers = teams.filter((t) => t.claim.deadCapCarried > 0).length;
  const cleanBooks = teams.filter((t) => t.claim.deadCapCarried === 0).length;
  return {
    totalTeams: Object.keys(state.teams).length,
    claimedTeams: teams.length,
    totalSignings,
    totalSpent,
    zeroSigningTeams,
    atCapL1Count,
    leftoverL1Count,
    deadCapCarriers,
    cleanBooks,
  };
}

export type SynthesisCard = { id: string; title: string; body: string };

/**
 * Five named cards, computed from frozen aggregates and history only
 * (charter SYNTHESIS). Degrades gracefully with zero claimed teams, same
 * discipline as L1/L2.
 */
function synthesisCards(state: FreeAgencyState, agg: Aggregate): SynthesisCard[] {
  if (agg.claimedTeams === 0) {
    return [{ id: "market-price", title: "THE MARKET SET THE PRICE", body: "No franchises claimed yet this round — once teams claim in, this card fills in with the class's real numbers." }];
  }
  const cards: SynthesisCard[] = [];

  let mostMoved: { name: string; totalMove: number } | null = null;
  for (const a of AGENTS) {
    let move = 0;
    let last = a.openingAsk;
    for (const day of state.history) {
      const r = day.resolutions.find((res) => res.agentId === a.id);
      if (!r) break;
      move += Math.abs(r.askAfter - last);
      last = r.askAfter;
    }
    if (move > 0 && (!mostMoved || move > mostMoved.totalMove)) mostMoved = { name: a.name, totalMove: move };
  }
  cards.push({
    id: "market-price",
    title: "THE MARKET SET THE PRICE",
    body: mostMoved
      ? `${mostMoved.name}'s asking price moved $${mostMoved.totalMove}M across the window — every dollar of that moved because of offers this room actually placed, not because of anything a teacher or the game set in advance.`
      : `No agent's price moved across the window — every deal that happened, happened at the opening ask.`,
  });

  const starIds = new Set(AGENTS.filter((a) => a.tier === "star").map((a) => a.id));
  const chasers = new Set<SeatId>();
  for (const day of state.history) for (const o of day.offers) if (starIds.has(o.agentId)) chasers.add(o.seatId);
  cards.push({
    id: "constraint",
    title: "OTHER PEOPLE ARE YOUR CONSTRAINT",
    body: `Only 2 star-tier agents hit the market. ${chasers.size} different team${chasers.size === 1 ? "" : "s"} made at least one offer on one of them across the window — the same scarcity Draft Day taught with a $100M cap, this time caused by rivals, not a budget line.`,
  });

  const daySignings = AGENTS.map((a) => state.agentMarket[a.id]!).filter((m) => m.signed && m.signedDay !== null);
  const day1 = daySignings.filter((m) => m.signedDay === 1);
  const lateDay = daySignings.filter((m) => (m.signedDay ?? 0) >= 3);
  const avg = (arr: AgentMarketState[]) => (arr.length > 0 ? Math.round((arr.reduce((s, m) => s + (m.signedAmount ?? 0), 0) / arr.length) * 10) / 10 : null);
  const lostByWaiting = new Set<SeatId>();
  for (const day of state.history) {
    for (const t of Object.entries(state.teams)) {
      const [seatId, team] = t;
      if (!team.claim) continue;
      const offeredToday = day.offers.some((o) => o.seatId === seatId);
      if (offeredToday) continue;
      // held or undecided that day — did any agent they held out on sign to someone else this same day?
      if (day.resolutions.some((r) => r.signedBy !== null && r.signedBy !== seatId)) lostByWaiting.add(seatId);
    }
  }
  cards.push({
    id: "timing",
    title: "TIMING IS A PRICE",
    body: `Day-1 signings averaged $${avg(day1) ?? "—"}M; day-3-or-later signings averaged $${avg(lateDay) ?? "—"}M. ${lostByWaiting.size} team${lostByWaiting.size === 1 ? "" : "s"} held or hesitated on at least one day while a rival signed someone else that same day. Waiting is a bet, not a free lunch.`,
  });

  cards.push({
    id: "path-dependence",
    title: "PATH DEPENDENCE, MODULE EDITION",
    body: `Entering this window: ${agg.atCapL1Count} team${agg.atCapL1Count === 1 ? "" : "s"} had spent every dollar on Draft Day, ${agg.leftoverL1Count} left room on the table. ${agg.deadCapCarriers} team${agg.deadCapCarriers === 1 ? "" : "s"} carried real dead cap from the deadline into this market; ${agg.cleanBooks} arrived with clean books. No decision across three lessons ever stopped mattering.`,
  });

  const standings = computeStandings(state, true);
  const playoffTeams = new Set(standings.slice(0, Math.min(4, standings.length)).map((r) => r.seatId));
  let positiveLuck = 0;
  let negativeLuckMadeIt = 0;
  for (const [seatId, t] of Object.entries(state.teams)) {
    if (!t.claim || !playoffTeams.has(seatId)) continue;
    const luck = t.signings.reduce((s, ev) => s + (AGENT_BY_ID.get(ev.agentId)?.playoffFactor ?? 0), 0);
    if (luck > 0) positiveLuck += 1;
    else if (luck < 0) negativeLuckMadeIt += 1;
  }
  cards.push({
    id: "decisions-outcomes",
    title: "DECISIONS ≠ OUTCOMES",
    body: `Of the ${playoffTeams.size} playoff team${playoffTeams.size === 1 ? "" : "s"}, ${positiveLuck} got a real boost from their signings' hidden factors and ${negativeLuckMadeIt} made it despite negative luck. A good process and a good outcome are not the same thing — this window just showed the class the difference, with real numbers.`,
  });

  return cards;
}
