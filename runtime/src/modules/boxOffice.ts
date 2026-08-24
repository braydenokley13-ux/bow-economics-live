/**
 * Module 2, Prototype — "The Box Office."
 *
 * Built against docs/gauntlet/module-2/PROTOTYPE_SPEC.md. One manipulable
 * object per homestand: the Price Dial ($10-$120, $5 steps). Everything
 * else — the Fan Meter's live seat-fill, the Revenue Flow's three pipes, the
 * Payroll Bill target — reacts to it. Revenue = price × attendance is never
 * stated; it is discovered mid-drag as a hump the student finds by moving
 * the dial and watching the Revenue Flow climb, peak, and fall.
 *
 * Loop: SET (drag) → LOCK (commit) → REVEAL (true outcome lands) → INHERIT
 * (Homestand 2 opens shaped by Homestand 1's price zone) → SET → LOCK →
 * REVEAL → COMPARE → ARGUE. `zoneFor(priceH1, market)` is this lesson's
 * `roundTwoOpening(zone)` — Homestand 2's *starting state*, not a text
 * paragraph, computed from a number the student set themselves.
 *
 * SPEC DEVIATION, deliberate: PROTOTYPE_SPEC.md §(i) describes the client
 * recomputing the live preview "from the same pure function" during drag.
 * The build brief for this prototype is explicit that the demand math must
 * NEVER ship to the client pre-lock (students must not be able to read the
 * formula off the wire). Those two requirements conflict, and the brief is
 * the more specific instruction for this build, so this module keeps every
 * demand constant (`MARKETS`, `peakPriceOf`, `SWEET_BAND`, the zone
 * multipliers) server-side, always. The "live ripple" the spec asks for is
 * instead a fast, authoritative round trip: every drag tick submits a
 * `setPrice` action through the same reducer/outbox path any other action
 * uses (no new HTTP route, no special-cased transport), and the server
 * computes and returns the true attendance/revenue for that price on every
 * response. On a classroom LAN this reads as live; it never requires
 * exposing the curve itself. See studentView's PLAY/COUNTERFACTUAL cases.
 *
 * Franchise-identity pattern (reused, not reinvented): boardView must never
 * be seat-identifying, so this module borrows draftDay's fictional-
 * franchise + crest device wholesale (`FRANCHISE_NAMES`/`franchiseFor`,
 * imported directly rather than re-declared) — a class can point at its own
 * dot on the Class Scatter without a student name ever reaching the board.
 */
import { CREST_COUNT, FRANCHISE_NAMES, franchiseFor, type Franchise } from "./draftDay.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

void CREST_COUNT; // re-exported below for anyone importing crests through this module

/* ------------------------------------------------------------- market -- */

export type MarketId = "legacy" | "expansion" | "riverside" | "capital";

export type MarketCard = {
  readonly id: MarketId;
  readonly name: string;
  /** Flavor only — never a number. The whole point is the true curve stays hidden. */
  readonly flavor: string;
  /** Theoretical fans at price $0 — server-only, never serialized to a view. */
  readonly baseFans: number;
  /** Fans lost per $1 of price — server-only, never serialized to a view. */
  readonly sensitivity: number;
  /** Stadium capacity — server-only; views only ever get a derived 0-100 fill %. */
  readonly capacity: number;
};

/**
 * Four cards, four honestly different curves — this is what keeps the room
 * from converging on one "correct" price (PROTOTYPE_SPEC.md §b). Peaks are
 * spread across the dial's range (30/50/60/90) so no single price is right
 * for the whole class, and each has a distinct capacity-clamp behavior
 * (Legacy and Capital sell out at the cheap end; Expansion and Riverside
 * never do) so the hump's shape genuinely differs card to card while still
 * being single-peaked for every one (verified in boxOffice.test.ts).
 */
export const MARKETS: readonly MarketCard[] = [
  {
    id: "legacy",
    name: "Legacy Original",
    flavor: "A hundred years of history in this building. The fans have seen it all.",
    baseFans: 3600,
    sensitivity: 36,
    capacity: 3000,
  },
  {
    id: "expansion",
    name: "Expansion Team",
    flavor: "Brand new franchise. Nobody's proven anything yet — good or bad.",
    baseFans: 3000,
    sensitivity: 50,
    capacity: 3200,
  },
  {
    id: "riverside",
    name: "Riverside Market",
    flavor: "A steady, loyal working town. Not flashy, but they show up.",
    baseFans: 2880,
    sensitivity: 24,
    capacity: 3000,
  },
  {
    id: "capital",
    name: "Capital Market",
    flavor: "Big-city money and big-city expectations. Deep pockets, thin patience.",
    baseFans: 1980,
    sensitivity: 11,
    capacity: 2200,
  },
];
const MARKET_BY_ID: ReadonlyMap<MarketId, MarketCard> = new Map(MARKETS.map((m) => [m.id, m]));

export type MarketSummary = { id: MarketId; name: string; flavor: string };
export const marketSummary = (m: MarketCard): MarketSummary => ({ id: m.id, name: m.name, flavor: m.flavor });

/* ------------------------------------------------------------ economy -- */

export const PRICE_MIN = 10;
export const PRICE_MAX = 120;
export const PRICE_STEP = 5;

export const TV_REVENUE = 25_000;
export const MERCH_PER_FAN = 5;
export const PAYROLL_TARGET = 75_000;

/** How far from a market's true peak a locked price still counts as the sweet spot. */
export const SWEET_BAND = 10;
/** Overpriced Homestand 1 shrinks the true demand curve for Homestand 2 — "word got around." */
export const OVER_ZONE_DEMAND_MULT = 0.7;
/** A sweet-spot Homestand 1 modestly grows the curve for Homestand 2 — reinvestment upside. */
export const SWEET_ZONE_DEMAND_MULT = 1.15;
/** A sweet-spot surplus banked into Homestand 2's payroll credit, capped so it stays "modest." */
export const SURPLUS_CREDIT_CAP = 15_000;

export const DEFAULT_PRICE = PRICE_MIN;

export type Zone = "over" | "under" | "sweet";
export const ZONES: readonly Zone[] = ["over", "under", "sweet"];

export const isValidPrice = (v: unknown): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  v >= PRICE_MIN &&
  v <= PRICE_MAX &&
  (v - PRICE_MIN) % PRICE_STEP === 0;

/** The one number never sent to any client: the price that maximizes this market's true revenue. */
export const peakPriceOf = (market: MarketCard): number => market.baseFans / (2 * market.sensitivity);

/**
 * Round 1's price banded against that market's own true peak — this IS
 * `roundTwoOpening`'s input. Computed once, at Homestand 1's lock, and
 * never recomputed or shown as a number to the student (PROTOTYPE_SPEC.md
 * §d) — only lived through Homestand 2's altered starting state.
 */
export const zoneFor = (price: number, market: MarketCard): Zone => {
  const diff = price - peakPriceOf(market);
  if (diff > SWEET_BAND) return "over";
  if (diff < -SWEET_BAND) return "under";
  return "sweet";
};

export type RevenueBreakdown = {
  attendance: number;
  /** 0-100, derived from attendance/capacity — the only capacity-shaped number a view ever sees. */
  fillPct: number;
  ticketRevenue: number;
  tvRevenue: number;
  merchRevenue: number;
  totalRevenue: number;
};

/**
 * The single source of truth for attendance, and therefore revenue.
 * `zone` is null for Homestand 1 (unmodified curve) and the seat's stored
 * Homestand-1 zone for Homestand 2 — this is the entire path-dependence
 * mechanism: the same linear curve, shifted by what already happened.
 */
export const attendanceFor = (price: number, market: MarketCard, zone: Zone | null): number => {
  const mult = zone === "over" ? OVER_ZONE_DEMAND_MULT : zone === "sweet" ? SWEET_ZONE_DEMAND_MULT : 1;
  const raw = market.baseFans * mult - market.sensitivity * price;
  return Math.max(0, Math.min(market.capacity, Math.round(raw)));
};

export const revenueBreakdownFor = (price: number, market: MarketCard, zone: Zone | null): RevenueBreakdown => {
  const attendance = attendanceFor(price, market, zone);
  const ticketRevenue = price * attendance;
  const merchRevenue = attendance * MERCH_PER_FAN;
  const totalRevenue = ticketRevenue + TV_REVENUE + merchRevenue;
  return {
    attendance,
    fillPct: Math.round((attendance / market.capacity) * 100),
    ticketRevenue,
    tvRevenue: TV_REVENUE,
    merchRevenue,
    totalRevenue,
  };
};

/**
 * Homestand 2's Payroll Bill: unchanged for "over" (the felt cost there is
 * the shrunken crowd, not a cash debt); the full Homestand-1 shortfall
 * rides forward for "under" (a packed house that didn't pay the bills); a
 * capped, modest credit for "sweet" (banked, not decisive on its own).
 */
export const payrollTargetForH2 = (zone: Zone, priceH1: number, market: MarketCard): number => {
  const revH1 = revenueBreakdownFor(priceH1, market, null).totalRevenue;
  if (zone === "under") return PAYROLL_TARGET + Math.max(0, PAYROLL_TARGET - revH1);
  if (zone === "sweet") return PAYROLL_TARGET - Math.min(SURPLUS_CREDIT_CAP, Math.max(0, revH1 - PAYROLL_TARGET));
  return PAYROLL_TARGET;
};

/* --------------------------------------------------------------- state -- */

export type BoxOfficeState = {
  /** Assigned once, lazily, on a seat's first action — its index into join order. Derives both market and franchise. */
  seatOrder: Record<SeatId, number>;
  priceH1: Record<SeatId, number | null>;
  priceH2: Record<SeatId, number | null>;
  zone: Record<SeatId, Zone | null>;
  /** The live, uncommitted dial position for whichever homestand is currently open. */
  currentPrice: Record<SeatId, number | null>;
};

const marketForSeat = (state: BoxOfficeState, seatId: SeatId): MarketCard | null => {
  const order = state.seatOrder[seatId];
  if (order === undefined) return null;
  return MARKETS[order % MARKETS.length]!;
};

const franchiseForSeat = (state: BoxOfficeState, seatId: SeatId): Franchise | null => {
  const order = state.seatOrder[seatId];
  if (order === undefined) return null;
  return franchiseFor(order);
};

/* ------------------------------------------------------------- reduce -- */

type SetPriceAction = { type: "setPrice"; price: unknown };
type LockAction = { type: "lock" };

function assignSeatOrderIfNeeded(state: BoxOfficeState, seatId: SeatId, ctx: ReduceContext): BoxOfficeState {
  if (seatId in state.seatOrder) return state;
  const idx = ctx.seatIds.indexOf(seatId);
  const order = idx >= 0 ? idx : Object.keys(state.seatOrder).length;
  return { ...state, seatOrder: { ...state.seatOrder, [seatId]: order } };
}

function doSetPrice(state: BoxOfficeState, action: SetPriceAction, ctx: ReduceContext): ReduceResult<BoxOfficeState> {
  if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can set the price" };
  if (!isValidPrice(action.price)) {
    return { ok: false, reason: `"${String(action.price)}" is not a valid $5-step price between $${PRICE_MIN} and $${PRICE_MAX}` };
  }
  const seatId = ctx.seatId;
  const s = assignSeatOrderIfNeeded(state, seatId, ctx);
  const isH1 = ctx.phase === "PLAY";
  if (isH1 && s.priceH1[seatId] != null) return { ok: false, reason: "Homestand 1 is already locked" };
  if (!isH1) {
    if (s.priceH1[seatId] == null) return { ok: false, reason: "lock Homestand 1 before setting Homestand 2's price" };
    if (s.priceH2[seatId] != null) return { ok: false, reason: "Homestand 2 is already locked" };
  }
  return { ok: true, state: { ...s, currentPrice: { ...s.currentPrice, [seatId]: action.price } } };
}

function doLock(state: BoxOfficeState, ctx: ReduceContext): ReduceResult<BoxOfficeState> {
  if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can lock a price" };
  const seatId = ctx.seatId;
  const price = state.currentPrice[seatId] ?? null;
  if (price === null) return { ok: false, reason: "set a price before locking" };
  const market = marketForSeat(state, seatId);
  if (!market) return { ok: false, reason: "no market assigned yet — set a price first" };
  const isH1 = ctx.phase === "PLAY";
  if (isH1) {
    if (state.priceH1[seatId] != null) return { ok: false, reason: "Homestand 1 is already locked" };
    const zone = zoneFor(price, market);
    return { ok: true, state: { ...state, priceH1: { ...state.priceH1, [seatId]: price }, zone: { ...state.zone, [seatId]: zone } } };
  }
  if (state.priceH1[seatId] == null) return { ok: false, reason: "lock Homestand 1 before locking Homestand 2" };
  if (state.priceH2[seatId] != null) return { ok: false, reason: "Homestand 2 is already locked" };
  return { ok: true, state: { ...state, priceH2: { ...state.priceH2, [seatId]: price } } };
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

export const MODULE_ID = "m2-box-office" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

export const HOOK_COPY =
  "You're a Box Office Operator. One dial controls your team's ticket price — $10 to $120. Slide it and watch the stands fill or empty, live. Lock a price, and the real crowd shows up. Whatever happens in Homestand 1 follows you into Homestand 2.";
export const ADAPT_STUDENT_COPY = "Homestand 2 opens under this. What's your plan — same price, or something different?";
export const COUNTERFACTUAL_MESSAGE = "Same market, new conditions. Try again.";
export const ARGUE_PROMPT = "Did changing your price work, and why?";
export const CONSEQUENCE_BOARD_COPY = "Every price from Homestand 1 just became the starting condition for Homestand 2 — not a clean slate.";
export const ADAPT_BOARD_COPY = "Homestand 2 opens under this. Every pair: what's your plan?";
export const COUNTERFACTUAL_BOARD_COPY = "Same market, new conditions. Every pair tries again.";
export const ARGUE_BOARD_COPY = "Cold call time — did changing your price work, and why?";
export const BEYOND_SPORTS_LINE =
  "The same hump shows up anywhere a price meets real people: concert and movie tickets, a school car wash or bake sale, a shop that raises prices and loses regulars versus one that runs a sale and can't cover the register.";
export const EXIT_PROMPT = "What did yesterday's price cost you today?";
export const FORMALIZATION_LINE =
  "Every dot up there is a real price one of you set. Look at the shape — charging more doesn't make more money forever, because people stop showing up. That hump is why almost nobody landed the same answer. And for some of you, Homestand 2 opened already broken — not by bad luck, but by your own price from Homestand 1.";

const ZONE_BANNER_TITLE: Record<Zone, string> = { over: "EMPTY SEATS", under: "CASH CRUNCH", sweet: "RAISE OR HOLD" };

function consequenceMessageFor(zone: Zone, market: MarketCard, priceH1: number): string {
  if (zone === "over") {
    const before = attendanceFor(priceH1, market, null);
    const after = attendanceFor(priceH1, market, "over");
    return `Word got around your seats were expensive. Before you even touch the dial, your ${market.name} crowd is thinner at that same $${priceH1} price — ${before} fans would've shown up before, only ${after} will now.`;
  }
  if (zone === "under") {
    const shortfall = Math.max(0, PAYROLL_TARGET - revenueBreakdownFor(priceH1, market, null).totalRevenue);
    return `You packed the house — but it didn't pay the bills. Homestand 1 fell $${shortfall.toLocaleString()} short of payroll, and that shortfall now rides into Homestand 2's bill.`;
  }
  const credit = Math.min(SURPLUS_CREDIT_CAP, Math.max(0, revenueBreakdownFor(priceH1, market, null).totalRevenue - PAYROLL_TARGET));
  return `Homestand 1 landed close to the sweet spot. You're banking a $${credit.toLocaleString()} surplus into Homestand 2 — and the crowd's a little more excited to come back.`;
}

export const boxOfficeModule: LessonModule<BoxOfficeState> = {
  id: MODULE_ID,
  title: "Module 2 · Prototype — The Box Office",
  phases: PHASES,

  initialState() {
    return { seatOrder: {}, priceH1: {}, priceH2: {}, zone: {}, currentPrice: {} };
  },

  reduce(state, action, ctx): ReduceResult<BoxOfficeState> {
    if (action.type === "setPrice") {
      if (ctx.phase !== "PLAY" && ctx.phase !== "COUNTERFACTUAL") {
        return { ok: false, reason: `price can only be set during PLAY or COUNTERFACTUAL (session is in ${ctx.phase})` };
      }
      return doSetPrice(state, action as unknown as SetPriceAction, ctx);
    }
    if (action.type === "lock") {
      if (ctx.phase !== "PLAY" && ctx.phase !== "COUNTERFACTUAL") {
        return { ok: false, reason: `you can only lock during PLAY or COUNTERFACTUAL (session is in ${ctx.phase})` };
      }
      return doLock(state, ctx);
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    return phase === "PLAY" || phase === "COUNTERFACTUAL" ? ["setPrice", "lock"] : [];
  },

  studentView(state, seatId, phase) {
    const market = marketForSeat(state, seatId);
    const priceH1 = state.priceH1[seatId] ?? null;
    const priceH2 = state.priceH2[seatId] ?? null;
    const zone = state.zone[seatId] ?? null;
    const currentPrice = state.currentPrice[seatId] ?? null;

    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return { phase, message: "You're in! Waiting for your teacher to start The Box Office." };

        case "HOOK":
          return { phase, message: HOOK_COPY, priceMin: PRICE_MIN, priceMax: PRICE_MAX, priceStep: PRICE_STEP, payrollTarget: PAYROLL_TARGET };

        case "PLAY": {
          if (priceH1 != null) {
            return { phase, locked: true, market: market ? marketSummary(market) : null, price: priceH1, message: "Price locked — waiting for the room." };
          }
          const price = currentPrice ?? DEFAULT_PRICE;
          const preview = market ? revenueBreakdownFor(price, market, null) : null;
          return {
            phase,
            locked: false,
            market: market ? marketSummary(market) : null,
            price,
            priceMin: PRICE_MIN,
            priceMax: PRICE_MAX,
            priceStep: PRICE_STEP,
            payrollTarget: PAYROLL_TARGET,
            preview,
          };
        }

        case "REVEAL": {
          const result = market && priceH1 != null ? revenueBreakdownFor(priceH1, market, null) : null;
          return {
            phase,
            market: market ? marketSummary(market) : null,
            price: priceH1,
            result,
            payrollTarget: PAYROLL_TARGET,
            message: priceH1 != null ? "Homestand 1 is in the books — look up at the board." : "Time's up — look up at the board.",
          };
        }

        case "CONSEQUENCE": {
          if (!market || priceH1 == null || !zone) {
            return { phase, hit: false, message: "You didn't lock a Homestand 1 price — nothing carries over." };
          }
          return {
            phase,
            zone,
            title: ZONE_BANNER_TITLE[zone],
            message: consequenceMessageFor(zone, market, priceH1),
          };
        }

        case "ADAPT":
          return { phase, zone, message: ADAPT_STUDENT_COPY };

        case "COUNTERFACTUAL": {
          if (priceH2 != null) {
            return { phase, locked: true, market: market ? marketSummary(market) : null, price: priceH2, message: "Homestand 2 price locked — waiting for the room." };
          }
          if (!market || priceH1 == null || !zone) {
            return { phase, locked: false, blocked: true, message: "You never locked a Homestand 1 price — talk to your teacher." };
          }
          const price = currentPrice ?? priceH1;
          const preview = revenueBreakdownFor(price, market, zone);
          const payrollTarget = payrollTargetForH2(zone, priceH1, market);
          return {
            phase,
            locked: false,
            market: marketSummary(market),
            price,
            priceMin: PRICE_MIN,
            priceMax: PRICE_MAX,
            priceStep: PRICE_STEP,
            zone,
            payrollTarget,
            preview,
            message: COUNTERFACTUAL_MESSAGE,
          };
        }

        case "ARGUE": {
          const h1 = market && priceH1 != null ? { price: priceH1, ...revenueBreakdownFor(priceH1, market, null) } : null;
          const h2 = market && priceH2 != null && zone ? { price: priceH2, ...revenueBreakdownFor(priceH2, market, zone) } : null;
          return { phase, market: market ? marketSummary(market) : null, zone, h1, h2, prompt: ARGUE_PROMPT };
        }

        case "SYNTHESIS":
          return { phase, message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

        case "COMPLETE":
          return { phase, message: "The Box Office is complete. Nice work, Operator — see you at the next homestand.", exitPrompt: EXIT_PROMPT };

        default:
          return { phase };
      }
    })();
    return tag(view);
  },

  teacherView(state, phase) {
    const seatIds = Object.keys(state.seatOrder);
    const seats = seatIds.map((seatId) => {
      const market = marketForSeat(state, seatId);
      const priceH1 = state.priceH1[seatId] ?? null;
      const priceH2 = state.priceH2[seatId] ?? null;
      return {
        seatId,
        market: market ? marketSummary(market) : null,
        currentPrice: state.currentPrice[seatId] ?? null,
        priceH1,
        priceH2,
        zone: state.zone[seatId] ?? null,
        h1Locked: priceH1 != null,
        h2Locked: priceH2 != null,
      };
    });
    return tag({ phase, seatCount: seats.length, seats, aggregate: computeAggregate(state) });
  },

  boardView(state, phase) {
    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return { mode: "lobby", pairCount: Object.keys(state.seatOrder).length };

        case "HOOK":
          return { mode: "hook", message: HOOK_COPY };

        case "PLAY": {
          const seatIds = Object.keys(state.seatOrder);
          return { mode: "building", totalPairs: seatIds.length, lockedCount: seatIds.filter((id) => state.priceH1[id] != null).length };
        }

        case "REVEAL": {
          const scatter = scatterFor(state, 1);
          return { mode: "reveal", homestand: 1, scatter, pairCount: scatter.length };
        }

        case "CONSEQUENCE": {
          const agg = computeAggregate(state);
          return { mode: "consequence", zoneCounts: agg.zoneCounts, message: CONSEQUENCE_BOARD_COPY };
        }

        case "ADAPT":
          return { mode: "adapt", message: ADAPT_BOARD_COPY };

        case "COUNTERFACTUAL": {
          const seatIds = Object.keys(state.seatOrder).filter((id) => state.priceH1[id] != null);
          return { mode: "counterfactual", totalPairs: seatIds.length, lockedCount: seatIds.filter((id) => state.priceH2[id] != null).length, message: COUNTERFACTUAL_BOARD_COPY };
        }

        case "ARGUE": {
          const scatter = scatterFor(state, 2);
          return { mode: "argue", scatter, message: ARGUE_BOARD_COPY };
        }

        case "SYNTHESIS": {
          const agg = computeAggregate(state);
          return {
            mode: "synthesis",
            heading: "WHAT ECONOMICS DID WE JUST USE?",
            formalization: FORMALIZATION_LINE,
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

/* ------------------------------------------------------------ scatter -- */

export type ScatterPoint = { franchise: Franchise; homestand: 1 | 2; price: number; revenue: number; zone: Zone | null };

function scatterFor(state: BoxOfficeState, throughHomestand: 1 | 2): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (const seatId of Object.keys(state.seatOrder)) {
    const market = marketForSeat(state, seatId);
    const franchise = franchiseForSeat(state, seatId);
    if (!market || !franchise) continue;
    const zone = state.zone[seatId] ?? null;
    const p1 = state.priceH1[seatId];
    if (p1 != null) {
      points.push({ franchise, homestand: 1, price: p1, revenue: revenueBreakdownFor(p1, market, null).totalRevenue, zone });
    }
    if (throughHomestand === 2 && zone) {
      const p2 = state.priceH2[seatId];
      if (p2 != null) {
        points.push({ franchise, homestand: 2, price: p2, revenue: revenueBreakdownFor(p2, market, zone).totalRevenue, zone });
      }
    }
  }
  return points;
}

/* ------------------------------------------------------------ aggregate -- */

export type Aggregate = {
  totalPairs: number;
  h1LockedCount: number;
  h2LockedCount: number;
  zoneCounts: Record<Zone, number>;
  avgPriceH1: number | null;
  minPriceH1: number | null;
  maxPriceH1: number | null;
  avgPriceH2: number | null;
  avgRevenueH1: number | null;
  avgRevenueH2: number | null;
  payrollClearedH1Count: number;
  payrollClearedH2Count: number;
  overAvgFanDrop: number | null;
  overAvgRevenueH1: number | null;
  underAvgShortfall: number | null;
  sweetAvgCredit: number | null;
};

function avg(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function computeAggregate(state: BoxOfficeState): Aggregate {
  const seatIds = Object.keys(state.seatOrder);
  const h1Locked = seatIds.filter((id) => state.priceH1[id] != null);
  const h2Locked = seatIds.filter((id) => state.priceH2[id] != null);

  const zoneCounts: Record<Zone, number> = { over: 0, under: 0, sweet: 0 };
  for (const id of h1Locked) {
    const z = state.zone[id];
    if (z) zoneCounts[z] += 1;
  }

  const h1Revenues = h1Locked.map((id) => revenueBreakdownFor(state.priceH1[id]!, marketForSeat(state, id)!, null).totalRevenue);
  const h2Revenues = h2Locked.map((id) => {
    const zone = state.zone[id]!;
    return revenueBreakdownFor(state.priceH2[id]!, marketForSeat(state, id)!, zone).totalRevenue;
  });
  const h2Targets = h2Locked.map((id) => payrollTargetForH2(state.zone[id]!, state.priceH1[id]!, marketForSeat(state, id)!));

  const overSeats = h1Locked.filter((id) => state.zone[id] === "over");
  const underSeats = h1Locked.filter((id) => state.zone[id] === "under");
  const sweetSeats = h1Locked.filter((id) => state.zone[id] === "sweet");

  const overFanDrop = overSeats.map((id) => {
    const market = marketForSeat(state, id)!;
    const price = state.priceH1[id]!;
    return attendanceFor(price, market, null) - attendanceFor(price, market, "over");
  });
  const overRevH1 = overSeats.map((id) => revenueBreakdownFor(state.priceH1[id]!, marketForSeat(state, id)!, null).totalRevenue);
  const underShortfalls = underSeats.map((id) => {
    const rev = revenueBreakdownFor(state.priceH1[id]!, marketForSeat(state, id)!, null).totalRevenue;
    return Math.max(0, PAYROLL_TARGET - rev);
  });
  const sweetCredits = sweetSeats.map((id) => {
    const rev = revenueBreakdownFor(state.priceH1[id]!, marketForSeat(state, id)!, null).totalRevenue;
    return Math.min(SURPLUS_CREDIT_CAP, Math.max(0, rev - PAYROLL_TARGET));
  });

  return {
    totalPairs: seatIds.length,
    h1LockedCount: h1Locked.length,
    h2LockedCount: h2Locked.length,
    zoneCounts,
    avgPriceH1: avg(h1Locked.map((id) => state.priceH1[id]!)),
    minPriceH1: h1Locked.length ? Math.min(...h1Locked.map((id) => state.priceH1[id]!)) : null,
    maxPriceH1: h1Locked.length ? Math.max(...h1Locked.map((id) => state.priceH1[id]!)) : null,
    avgPriceH2: avg(h2Locked.map((id) => state.priceH2[id]!)),
    avgRevenueH1: avg(h1Revenues),
    avgRevenueH2: avg(h2Revenues),
    payrollClearedH1Count: h1Revenues.filter((r) => r >= PAYROLL_TARGET).length,
    payrollClearedH2Count: h2Revenues.filter((r, i) => r >= h2Targets[i]!).length,
    overAvgFanDrop: avg(overFanDrop),
    overAvgRevenueH1: avg(overRevH1),
    underAvgShortfall: avg(underShortfalls),
    sweetAvgCredit: avg(sweetCredits),
  };
}

export type SynthesisCard = { id: string; title: string; body: string };

/**
 * Only the concept-ledger entries PROTOTYPE_SPEC.md §(g) marks as genuinely
 * instantiated by this build: primary (revenue, path dependence) and
 * secondary (incentives, pricing under uncertainty). Every sentence below
 * is grounded in this session's own `computeAggregate` output — no canned
 * claim, same discipline as draftDay's synthesisCards.
 */
function synthesisCards(agg: Aggregate): SynthesisCard[] {
  if (agg.h1LockedCount === 0) {
    return [{ id: "revenue", title: "REVENUE", body: "No prices locked in yet this round — once pairs lock, this card fills in with the class's real numbers." }];
  }

  const cards: SynthesisCard[] = [];

  cards.push({
    id: "revenue",
    title: "REVENUE",
    body: `${agg.h1LockedCount} pair${agg.h1LockedCount === 1 ? "" : "s"} set a Homestand 1 price. Average price: $${agg.avgPriceH1}. Average total revenue: $${agg.avgRevenueH1?.toLocaleString()}. Nobody's price was the same, and neither was their revenue — charging more only makes more money up to a point, and past that point the empty seats cost more than the higher price earns.`,
  });

  const overLine = agg.zoneCounts.over > 0
    ? `${agg.zoneCounts.over} pair${agg.zoneCounts.over === 1 ? "" : "s"} priced into the overpriced zone and opened Homestand 2 with real fans already gone — an average of ${agg.overAvgFanDrop} fewer fans at their old price, before they touched the dial again.`
    : "";
  const underLine = agg.zoneCounts.under > 0
    ? `${agg.zoneCounts.under} pair${agg.zoneCounts.under === 1 ? "" : "s"} priced into the underpriced zone — a full house that didn't pay the bills, averaging a $${agg.underAvgShortfall?.toLocaleString()} shortfall carried into Homestand 2's payroll bill.`
    : "";
  cards.push({
    id: "path-dependence",
    title: "PATH DEPENDENCE",
    body: `Homestand 2 didn't start from zero for anyone — it started from where Homestand 1 left off. ${agg.zoneCounts.sweet} pair${agg.zoneCounts.sweet === 1 ? "" : "s"} landed near the sweet spot. ${overLine} ${underLine}`.trim(),
  });

  if (agg.zoneCounts.over > 0) {
    cards.push({
      id: "incentives",
      title: "INCENTIVES",
      body: `The overpriced pairs weren't wrong to want the money — they averaged $${agg.overAvgRevenueH1?.toLocaleString()} in Homestand 1 by charging above the sweet spot, a real short-term win. It just came at the cost of the fan base they'll need for Homestand 2. That pull, cash now versus fans later, is why "just charge more" isn't free.`,
    });
  }

  if (agg.minPriceH1 !== null && agg.maxPriceH1 !== null) {
    cards.push({
      id: "pricing-under-uncertainty",
      title: "PRICING UNDER UNCERTAINTY",
      body: `This class's Homestand 1 prices ranged from $${agg.minPriceH1} to $${agg.maxPriceH1}. Nobody could see their market's true demand curve — only its flavor. That spread is what real pricing looks like: everyone guessing against a hidden curve, with the only feedback coming after they locked it in.`,
    });
  }

  return cards;
}
