/**
 * Module 2 · Lesson 1 — "FULL HOUSE."
 *
 * Built against docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md (L1), the
 * binding build charter in ARCHITECTURE_SELECTION.md (BC-2, BC-3, BC-4), and
 * the Stage-0 loop that earned the war's only STRONG rating
 * (docs/gauntlet/module-2/stage0/l1c-blind-price.html + PLAY_REVIEW.md).
 *
 * The pair runs a real NBA club's *building*, not its roster. Five game
 * nights. Each night: a printed card (day, visiting club's Draw, TV), then
 * two dials committed BLIND — there is no revenue preview of any kind, and
 * nothing derived from the pending action is ever in the pre-lock view. The
 * only information a pair has is tonight's card and its own realized
 * history. That is exactly what a real pricing desk has, and it is what
 * makes this reasoning rather than search.
 *
 * Two books that cannot be summed (R4): CASH (dollars) and RENEWALS (the
 * share of the season-ticket base that comes back). The cash-best price and
 * the renewals-best price are different prices on every card, and they pull
 * in OPPOSITE directions depending on the night: on a quiet card the renewals
 * book wants a price below the night's cash optimum (undercut your own plan
 * price and the plan looks like a waste, but the plan price itself is where
 * renewals peak), and on a big card it wants one above it (a strong walk-up
 * price is what makes a plan holder's seat look like a bargain). See
 * `renewalDelta` for the repair this replaced.
 *
 * WHAT IS HIDDEN AND WHY. `base` and `sensitivity` are module-scope
 * constants. They are never serialized into any view — not before the lock,
 * not after it, not on the board, not to the teacher. Views only ever carry
 * *derived outcomes* of an action already committed (turnout, gate,
 * in-arena, renewals movement) plus printed operating facts a real desk
 * would know anyway (capacity, tonight's building bill, the season-ticket
 * plan price). See `fullHouse.test.ts` for the assertions that hold this.
 *
 * BC-2 REPAIRS (the two constant defects the selection econ review named):
 *
 *  - R6 (error-cost asymmetry, 16.5x against the low side at New York).
 *    Repaired by construction: on N1/N2/N3/N5 at both markets the
 *    total-revenue optimum sits far above the capacity kink, so regret is
 *    the symmetric parabola (ratio ~1.0). On N4 — the one night whose card
 *    announces a capacity crunch — the optimum is placed deliberately ~$8
 *    above the kink so the shock still overflows the building at habitual
 *    prices while regret stays inside 3x. Verified for every reachable
 *    renewals/carry state by `l1-tuning-harness.mjs` and by the module test.
 *
 *  - R8 (Memphis capped at 75.3% fill at any legal price). Repaired:
 *    Memphis reaches a genuine full house (>=95% fill) on N2 and N4, and
 *    the board carries fill % — a non-money success metric — so the small
 *    market's winning path is visible inside L1 rather than deferred.
 *
 *  Also repaired from the same review: the resale line is NOT counted as a
 *  second dollar loss anywhere (it re-labels a loss the cash book already
 *  counts). Turned-away fans are reported as a count, and the resale note
 *  says out loud that the money was never on the books.
 *
 * BC-4 (preserve the verified STRONG loop): nothing is sweepable pre-commit
 * (no preview exists at all), N5 replays N1's exact card so the only thing
 * that changed is the pair's own accumulated renewals, and the Two Peaks
 * reveal (ticket-revenue max vs total-revenue max) is computed from the
 * class's own locked numbers.
 *
 * BC-3 (season stamps): every real figure in product copy carries its date.
 * See SOURCE_NOTES.
 */
import { CREST_COUNT } from "./draftDay.js";
import type { LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

/* ------------------------------------------------------------- markets -- */

export type MarketId = "new-york" | "memphis";
export type TvKind = "none" | "local" | "national";

/**
 * A market's hidden demand parameters plus its printed operating facts.
 * Everything under `HIDDEN` never leaves this module.
 */
export type Market = {
  readonly id: MarketId;
  /** Real club, named as a typographic wordmark in the product's own system (no logos/marks). */
  readonly club: string;
  readonly building: string;
  /** One sentence a student who has never watched a game can act on. */
  readonly plainLine: string;
  /* ---- printed operating facts (these DO appear in views) ---- */
  readonly capacity: number;
  /** Everything it costs to open the doors tonight, packed into one line. */
  readonly bill: number;
  /** The season-ticket plan's per-seat price. Printed: it is the RENEWALS rule, not a revenue preview. */
  readonly planPrice: number;
  readonly eventMax: number;
  readonly bowlSeats: number;
  readonly bowlCost: number;
  /* ---- HIDDEN demand constants (never serialized) ---- */
  readonly base0: number;
  readonly drawBase: number;
  readonly weekendBase: number;
  readonly tvBase: Readonly<Record<TvKind, number>>;
  readonly sens0: number;
  readonly drawSens: number;
  readonly weekendSens: number;
  readonly tvSens: Readonly<Record<TvKind, number>>;
  /**
   * Fans of demand base per renewal point above/below 50.
   *
   * `gate-l1-econ-r1` R1 (BLOCKING dissent `econ-l1-season-books`): this was 60
   * (New York) / 55 (Memphis), which made a renewal point worth ~$3,100 of
   * later-night cash and therefore made RENEWALS *lagged cash* rather than a
   * rival book. The season cash-maximising line then also maximised renewals
   * (New York $2,743,440 at 92% against a flat plan's $1,291,132 at 80%), so
   * the two books never traded off at the scale the COUNTERFACTUAL card
   * reports. Cut to 10: renewals still move who shows up on the repeat card
   * (harness P6), but they are next season's money, not this season's.
   */
  readonly renewalFans: number;
  /** In-arena spend per fan (hidden pre-lock; revealed only as a settled dollar total). */
  readonly ancillary: number;
  /** Fans added to NEXT night's base per dollar of tonight's event spend. */
  readonly eventFans: number;
  /**
   * Dollars of event spend that buy one renewal point tonight. The whole dial
   * is worth about +2 points in both markets — small, real, and now printed on
   * the student's own screen before the commitment (`spendRuleFor`), which is
   * `gate-l1-econ-r1` R3's first discharge limb: the channel exists, so it is
   * disclosed with its magnitude rather than left as an unattributable bonus.
   */
  readonly eventRenewalDollars: number;
  /**
   * Renewal points lost per $1 the price sits ABOVE what tonight is worth to a
   * plan holder. Raised from 0.6 to 1.8 by R1: at 0.6 the gouge arm could not
   * outweigh the tent peak plus the bargain bonus anywhere a cash-maximising
   * desk would price, so a maximising season lost nothing on the second book.
   */
  readonly planSlope: number;
  /**
   * Dollars between the season-plan price and what a plan holder thinks the
   * biggest possible night is worth. Scales the card-conditional reference
   * price (see `renewalReferencePrice`).
   */
  readonly premiumSpan: number;
  /** Point-of-use season stamp for `capacity` (BC-3). Printed wherever the seat count is printed. */
  readonly capacityNote: string;
};

/**
 * Modeled on real market differences — NOT the Knicks' or Grizzlies' actual
 * measured demand. Market sizes, buildings and capacities are real at
 * scale; the curves are ours (R11, and the board says so every time a curve
 * appears).
 *
 * Constant choice is not free-hand: for every ordinary card the optimum sits
 * clear of the capacity clamp (symmetric regret, BC-2/R6) and every market
 * can fill its building at some legal price (BC-2/R8).
 */
export const MARKETS: readonly Market[] = [
  {
    id: "new-york",
    club: "New York Knicks",
    building: "Madison Square Garden",
    plainLine: "The biggest market in American sports. A lot of people, and a lot of them can pay.",
    capacity: 19_800,
    bill: 520_000,
    planPrice: 24,
    eventMax: 120_000,
    bowlSeats: 2_400,
    bowlCost: 95_000,
    base0: 22_070,
    drawBase: 60,
    weekendBase: 1_810,
    tvBase: { none: 0, local: -1_400, national: -4_620 },
    sens0: 300,
    drawSens: 1.289,
    weekendSens: -25,
    tvSens: { none: 0, local: 15, national: 45 },
    renewalFans: 10,
    ancillary: 18,
    eventFans: 0.01,
    eventRenewalDollars: 60_000,
    planSlope: 1.8,
    premiumSpan: 92,
    capacityNote: "listed basketball capacity 19,812 · 2025-26",
  },
  {
    id: "memphis",
    club: "Memphis Grizzlies",
    building: "FedExForum",
    plainLine: "One of the league's smallest markets. Fewer people, and price matters more here.",
    capacity: 17_794,
    bill: 280_000,
    planPrice: 16,
    eventMax: 60_000,
    bowlSeats: 1_800,
    bowlCost: 42_000,
    base0: 18_780,
    drawBase: 60,
    weekendBase: 2_400,
    tvBase: { none: 0, local: -2_150, national: -5_770 },
    sens0: 380,
    drawSens: 2.06,
    weekendSens: -30,
    tvSens: { none: 0, local: 18, national: 55 },
    renewalFans: 10,
    ancillary: 12,
    eventFans: 0.016,
    eventRenewalDollars: 30_000,
    planSlope: 1.8,
    premiumSpan: 90,
    capacityNote: "modeled seat count · published figures range 16,667-18,119",
  },
];
const MARKET_BY_ID: ReadonlyMap<MarketId, Market> = new Map(MARKETS.map((m) => [m.id, m]));

/** What a view is allowed to know about a market: printed facts only, no curve. */
export type MarketFacts = {
  id: MarketId;
  club: string;
  building: string;
  plainLine: string;
  capacity: number;
  bill: number;
  planPrice: number;
  eventMax: number;
  bowlSeats: number;
  bowlCost: number;
  capacityNote: string;
  /** P2/B4: the night-spend dial's payback rule, in dollars a pair can act on. */
  spendRule: string;
};
export const marketFacts = (m: Market): MarketFacts => ({
  id: m.id,
  club: m.club,
  building: m.building,
  plainLine: m.plainLine,
  capacity: m.capacity,
  bill: m.bill,
  planPrice: m.planPrice,
  eventMax: m.eventMax,
  bowlSeats: m.bowlSeats,
  bowlCost: m.bowlCost,
  capacityNote: m.capacityNote,
  spendRule: spendRuleFor(m),
});

/**
 * The night-spend dial's payback rule, printed BEFORE the commitment (the
 * Economic Truth gate's B4 and the Player gate's P2: the mechanism is real
 * and was illegible). This is a rule of the game a real promotions desk
 * would know, not a preview: it says nothing about tonight's crowd, tonight's
 * money, or what any price will do.
 */
export function spendRuleFor(m: Market): string {
  const dollarsPerFan = Math.round(1 / m.eventFans);
  const renewalPoints = Math.round((m.eventMax / m.eventRenewalDollars) * 10) / 10;
  return `Every $${dollarsPerFan.toLocaleString()} here brings about 1 extra person NEXT night — nobody extra tonight. That person pays tomorrow's ticket price and spends inside the building, so the money comes back only on a night you can charge for. It comes back as nothing at all if tomorrow sells out without them. It does one more thing, tonight: people who had a good night out are readier to renew, so the full $${m.eventMax.toLocaleString()} dial is worth about +${renewalPoints} renewal ${renewalPoints === 1 ? "point" : "points"} — real, but small next to what your price does.`;
}

/**
 * `gate-l1-play` P10 (BLOCKING dissent `play-l1-renewals-unexplained`): the
 * renewals book drives half the outcome and half the argument, and no student
 * surface stated the rule that governs it. This is that rule, per market, in
 * the pair's own numbers — printed beside the price dial BEFORE the commit,
 * again at the renewals reveal stage, and again on the synthesis card.
 *
 * It is a rule of the game, not a preview: it names no crowd, no dollar and no
 * price that is "right". Verified against the model at the shipped constants
 * (renewals at the plan price +6; one dial step under it +1; two steps under
 * -4; at the $10 floor -20 New York / -9 Memphis).
 */
export function renewalRuleFor(m: Market): string {
  return `Season plan: $${m.planPrice} a seat. Price well UNDER that and the plan looks like a waste — renewals fall even with a full building. Price ABOVE what they think tonight is worth and they quit. In between, the plan looks like a bargain and more come back.`;
}

/* --------------------------------------------------------------- cards -- */

export type NightCard = {
  readonly id: string;
  readonly label: string;
  readonly day: string;
  readonly weekend: boolean;
  /** The visiting club's pull, printed 0-100. A non-fan reads the number and prices as well as a fan. */
  readonly draw: number;
  readonly visitor: string;
  readonly tv: TvKind;
  /** Everything that will move tonight's crowd is on this card. Nothing else moves it (R7). */
  readonly notes: readonly string[];
  /** N4 only: the one-night capacity option. */
  readonly bowlOffer: boolean;
  /** N5 only: the card this one repeats. */
  readonly repeatOf: string | null;
};

/**
 * Five cards. Each exists for a reason (DESIGN_C L1's table):
 * N1 baseline · N2 day-of-week shifter · N3 two shifters pulling opposite
 * ways · N4 the demand shock (capacity crunch + the one-night capacity
 * option) · N5 N1's card run again, so the only thing that changed is the
 * room's own five nights of choices.
 */
export const CARDS: readonly NightCard[] = [
  {
    id: "N1",
    label: "Night 1",
    day: "Tuesday",
    weekend: false,
    draw: 22,
    visitor: "a club that has lost four straight",
    tv: "none",
    notes: ["A quiet Tuesday. Nothing about tonight is special — and it is still a real night with a real bill."],
    bowlOffer: false,
    repeatOf: null,
  },
  {
    id: "N2",
    label: "Night 2",
    day: "Saturday",
    weekend: true,
    draw: 51,
    visitor: "a solid playoff club",
    tv: "local",
    notes: ["Saturday. People can come out and stay out.", "On local TV: some of your fans can watch at home instead."],
    bowlOffer: false,
    repeatOf: null,
  },
  {
    id: "N3",
    label: "Night 3",
    day: "Wednesday",
    weekend: false,
    draw: 88,
    // gate-l1-sr F1 (BLOCKING): "the defending champions" collided with the New
    // York desk — the Knicks won the 2026 title, so in 2026-27 half the room
    // would host itself on the lesson's most-watched card. Card visitors are
    // roles, never a club a desk can be holding. See SOURCE_NOTES.
    visitor: "last season's beaten finalists",
    tv: "national",
    notes: [
      "The club that lost last season's Finals is in the building. That pulls hard.",
      "It is also on national TV — the whole country can watch it free at home. Two things pulling opposite ways.",
    ],
    bowlOffer: false,
    repeatOf: null,
  },
  {
    id: "N4",
    label: "Night 4",
    day: "Saturday",
    weekend: true,
    draw: 97,
    visitor: "the rookie everybody is talking about",
    tv: "none",
    notes: [
      "The biggest night of the five. Demand is going to run past what this building holds.",
      "One night only: you can open more of the building. It costs money before you know who shows up.",
    ],
    bowlOffer: true,
    repeatOf: null,
  },
  {
    id: "N5",
    label: "Night 5",
    day: "Tuesday",
    weekend: false,
    draw: 22,
    visitor: "a club that has lost four straight",
    tv: "none",
    notes: [
      "Same card as Night 1. Same day, same visiting club, same TV.",
      "The only thing that has changed since Night 1 is you.",
    ],
    bowlOffer: false,
    repeatOf: "N1",
  },
];
const CARD_BY_ID: ReadonlyMap<string, NightCard> = new Map(CARDS.map((c) => [c.id, c]));
export const NIGHT_COUNT = CARDS.length;
/** The Two Peaks reveal is drawn on this card (a big crowd, no capacity clamp anywhere near the optimum). */
export const TWO_PEAKS_CARD_ID = "N3";

/* -------------------------------------------------------------- dials -- */

export const PRICE_MIN = 10;
export const PRICE_MAX = 120;
export const PRICE_STEP = 2;
export const SPEND_STEP = 5_000;
export const RENEWALS_START = 50;
export const RENEWAL_TENT_PEAK = 6;
export const RENEWAL_DELTA_FLOOR = -20;
export const RENEWAL_DELTA_CEIL = 12;
/** Renewal points lost per $1 the price sits BELOW the season-plan price (the low arm). */
export const RENEWAL_UNDERCUT_SLOPE = 2.5;
/** Extra renewal points at the top of the "your plan is a bargain tonight" ramp. */
export const RENEWAL_BARGAIN_BONUS = 6;

export const isValidPrice = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= PRICE_MIN && v <= PRICE_MAX && (v - PRICE_MIN) % PRICE_STEP === 0;

export const isValidSpend = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max && v % SPEND_STEP === 0;

/* ------------------------------------------------- the hidden economics -- */

/** The hidden curve for one desk on one card, frozen at lock time (D15). */
export type Curve = { base: number; sens: number };

export function curveFor(market: Market, card: NightCard, renewals: number, carryFans: number): Curve {
  const base =
    market.base0 +
    market.drawBase * card.draw +
    (card.weekend ? market.weekendBase : 0) +
    market.tvBase[card.tv] +
    market.renewalFans * (renewals - RENEWALS_START) +
    carryFans;
  const sens =
    market.sens0 + (card.weekend ? market.weekendSens : 0) + market.tvSens[card.tv] - market.drawSens * card.draw;
  return { base: Math.max(0, Math.round(base)), sens: Math.max(60, Math.round(sens)) };
}

export type NightSettlement = {
  turnout: number;
  seatsOpen: number;
  fillPct: number;
  turnedAway: number;
  gate: number;
  inArena: number;
  total: number;
  bill: number;
  spendPaid: number;
  bowlCost: number;
  net: number;
  soldOut: boolean;
};

export function settleNight(
  market: Market,
  curve: Curve,
  price: number,
  spend: number,
  openBowl: boolean,
  bowlOffered: boolean,
): NightSettlement {
  const seatsOpen = market.capacity + (openBowl && bowlOffered ? market.bowlSeats : 0);
  const wanted = Math.max(0, Math.round(curve.base - curve.sens * price));
  const turnout = Math.min(seatsOpen, wanted);
  const gate = price * turnout;
  const inArena = market.ancillary * turnout;
  const total = gate + inArena;
  const bowlCost = openBowl && bowlOffered ? market.bowlCost : 0;
  return {
    turnout,
    seatsOpen,
    fillPct: Math.round((turnout / seatsOpen) * 1000) / 10,
    turnedAway: Math.max(0, wanted - turnout),
    gate,
    inArena,
    total,
    bill: market.bill,
    spendPaid: spend,
    bowlCost,
    net: total - market.bill - spend - bowlCost,
    soldOut: turnout >= seatsOpen,
  };
}

/**
 * What a season-plan holder thinks tonight's seat is worth: the plan price on
 * a quiet night, rising with the visiting club's Draw and falling back when
 * the game is on TV — every input is printed on the card the pair reads
 * before it prices (R7).
 */
export function renewalReferencePrice(market: Market, card: NightCard): number {
  const fromDraw = Math.max(0, (card.draw - 40) / 60);
  const fromTv = card.tv === "national" ? 0.45 : card.tv === "local" ? 0.15 : 0;
  return market.planPrice + market.premiumSpan * Math.max(0, fromDraw - fromTv);
}

/**
 * RENEWALS, repaired after `gate-l1-econ` B1 (BLOCKING dissent
 * `econ-l1-renewals-tent`). The old shape was a tent peaked at the plan price,
 * and its low arm was unreachable: $10 is only $6 under Memphis's plan price,
 * so every legal price below the plan there still GAINED renewals while the
 * high arm ran to -20. The result was a one-directional frontier — every price
 * above a night's cash optimum was weakly dominated on both books at every
 * reachable state — i.e. FL3 ("charging high is greedy, charging low is kind")
 * built into the arithmetic.
 *
 * The repaired book has three segments, and all three are real club behaviour:
 *
 *  - BELOW the season-plan price: steep (`RENEWAL_UNDERCUT_SLOPE`). Walk-ups
 *    paying less than your own plan holders is what makes the plan look like a
 *    waste. This arm now bites inside the legal dial in both markets.
 *  - BETWEEN the plan price and what the night is worth
 *    (`renewalReferencePrice`): a rising bonus. The plan holder bought that
 *    seat at plan price and tonight it is worth more — the plan looks like a
 *    bargain. It accelerates, because the feeling only shows up when tonight's
 *    walk-up price is well clear of what they paid.
 *  - ABOVE what the night is worth: the old gentle arm (`planSlope`). Gouging.
 *
 * Consequence, asserted by `l1-tuning-harness` P12 and the suite: on the quiet
 * cards the renewals book wants a LOWER price than the cash book, and on the
 * big cards it wants a HIGHER one. The two-book frontier therefore contains
 * real choices on both sides of the night's cash optimum, and no fixed moral
 * about greed is available from the numbers.
 */
export function renewalDelta(market: Market, card: NightCard, price: number, spend: number): number {
  const reference = renewalReferencePrice(market, card);
  const span = reference - market.planPrice;
  const ramp = span > 0 ? clamp((price - market.planPrice) / span, 0, 1) : 0;
  const value =
    RENEWAL_TENT_PEAK +
    RENEWAL_BARGAIN_BONUS * ramp * ramp -
    RENEWAL_UNDERCUT_SLOPE * Math.max(0, market.planPrice - price) -
    market.planSlope * Math.max(0, price - reference) +
    spend / market.eventRenewalDollars;
  return clamp(Math.round(value), RENEWAL_DELTA_FLOOR, RENEWAL_DELTA_CEIL);
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Total revenue (gate + in-arena) at a price, ignoring costs — the quantity the Two Peaks reveal compares. */
function totalRevenueAt(market: Market, curve: Curve, price: number): number {
  const q = Math.min(market.capacity, Math.max(0, Math.round(curve.base - curve.sens * price)));
  return price * q + market.ancillary * q;
}
function ticketRevenueAt(market: Market, curve: Curve, price: number): number {
  const q = Math.min(market.capacity, Math.max(0, Math.round(curve.base - curve.sens * price)));
  return price * q;
}

export const PRICE_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) out.push(p);
  return out;
})();

/** Grid argmax of a scalar function over the legal dial. Ties resolve to the lower price. */
export function argmaxPrice(score: (price: number) => number): number {
  let best = PRICE_MIN;
  let bestScore = -Infinity;
  for (const p of PRICE_GRID) {
    const s = score(p);
    if (s > bestScore + 1e-9) {
      bestScore = s;
      best = p;
    }
  }
  return best;
}

export const ticketPeakPrice = (market: Market, curve: Curve): number =>
  argmaxPrice((p) => ticketRevenueAt(market, curve, p));
export const totalPeakPrice = (market: Market, curve: Curve): number =>
  argmaxPrice((p) => totalRevenueAt(market, curve, p));

/* --------------------------------------------------------------- state -- */

export type SettledNight = {
  cardId: string;
  price: number;
  spend: number;
  openBowl: boolean;
  /** True when the teacher closed the night before this desk locked (auto-committed at the plan price). */
  auto: boolean;
  /** True for nights covered by the desk manager before a late seat joined. */
  stock: boolean;
  renewalsBefore: number;
  renewalsAfter: number;
  renewalMove: number;
  cashAfter: number;
  settlement: NightSettlement;
  /** Frozen at lock (D15). NEVER serialized — see viewNight(). */
  hidden: Curve;
};

export type Desk = {
  deskNumber: number;
  marketId: MarketId;
  crestIndex: number;
  joinedAtNight: number;
  cash: number;
  renewals: number;
  price: number;
  spend: number;
  openBowl: boolean;
  locked: boolean;
  nights: SettledNight[];
};

export type FullHouseState = {
  desks: Record<SeatId, Desk>;
  deskOrder: SeatId[];
  /** 0-based index of the night currently open. NIGHT_COUNT once all five have settled. */
  nightIndex: number;
  twoPeaksReleased: boolean;
  revealStage: number;
};

export const REVEAL_STEPS = NIGHT_COUNT + 2; // one per night curve, then Two Peaks, then the season books

/**
 * The seven reveal beats, named.
 *
 * `gate-l1-teacher` TT-B2 / HK-3 and `gate-l1-projector` repair 5: the teacher
 * pressed a button labelled "Reveal next" seven times without knowing what any
 * press would put on the projector. Each stage now carries the name the button
 * shows, the headline the board opens the beat on, and ONE short line the
 * teacher can say as it lands. The SAY lines are intelligence, not a script:
 * they are what a teacher who does not know the economics needs in order to
 * name the thing the room is looking at, in their own words.
 */
export type RevealStage = {
  /** 1-based stage number. */
  stage: number;
  /** Short name for the button and the teacher's "now on the projector" mirror. */
  name: string;
  /** The headline the board puts up when this stage lands. */
  headline: string;
  /** One line for the teacher. Short on purpose. */
  say: string;
};

export const REVEAL_STAGES: readonly RevealStage[] = [
  {
    stage: 1,
    name: "Night 1 — the quiet Tuesday",
    headline: "NIGHT 1 · THE QUIET TUESDAY",
    say: "One night, one building, everybody's price. Ask what happens to the crowd as you read left to right.",
  },
  {
    stage: 2,
    name: "Night 2 — Saturday",
    headline: "NIGHT 2 · SATURDAY",
    say: "Same room, different day. The dots sit higher — that is the card, not the price.",
  },
  {
    stage: 3,
    name: "Night 3 — the big visitor, on national TV",
    headline: "NIGHT 3 · BIG VISITOR, NATIONAL TV",
    say: "Two things pulling opposite ways on one card. Nobody had to guess: both were printed.",
  },
  {
    stage: 4,
    name: "Night 4 — the shock",
    headline: "NIGHT 4 · THE SHOCK",
    say: "This is the night the building ran out. Ask the desks that turned people away what they would do again.",
  },
  {
    stage: 5,
    name: "Night 5 — Night 1's card again, and the renewals rule",
    headline: "NIGHT 5 · NIGHT 1'S CARD AGAIN",
    say: "Same card as Night 1. The only thing that changed is who kept their season-ticket holders — and that rule is on the screen now.",
  },
  {
    stage: 6,
    name: "The Two Peaks — the money view",
    headline: "THE TWO PEAKS",
    say: "Two money lines from one desk's own night. Let them find the second peak before you name it.",
  },
  {
    stage: 7,
    name: "The season, market by market",
    headline: "THE SEASON, MARKET BY MARKET",
    say: "Two books, side by side. Ask which one they were playing for — and whether they knew.",
  },
];

/** The renewals rule lands on the projector with Night 5, where the room can see it caused something. */
export const RENEWALS_REVEAL_STAGE = 5;

/** The same rule as `renewalRuleFor`, said once for a room holding two different plan prices. */
export const RENEWALS_RULE_BOARD = `THE RENEWALS RULE, out loud: season-ticket holders paid ${MARKETS.map(
  (m) => `$${m.planPrice} a seat at the ${m.club}`,
).join(" and ")}. Price a night well UNDER your own plan price and their plan looks like a waste — renewals fall even when the building is full. Price it above what they think that night is worth and they quit. The bigger the visiting club's Draw, the higher the price they forgive; a national-TV listing pulls that line back down.`;

const openCard = (state: FullHouseState): NightCard | null => CARDS[state.nightIndex] ?? null;

const marketOf = (desk: Desk): Market => MARKET_BY_ID.get(desk.marketId)!;

/** Deterministic, visible, unranked (R8): odd desks run New York, even desks run Memphis. */
function marketForDesk(deskNumber: number): MarketId {
  return deskNumber % 2 === 1 ? "new-york" : "memphis";
}

/** Fans carried into tonight's base by LAST night's event spend — the one-night lag (C10). */
function carryFansFor(desk: Desk, market: Market): number {
  const last = desk.nights[desk.nights.length - 1];
  if (!last) return 0;
  return Math.round(market.eventFans * last.spend);
}

function applyNight(
  desk: Desk,
  market: Market,
  card: NightCard,
  price: number,
  spend: number,
  openBowl: boolean,
  flags: { auto: boolean; stock: boolean },
): Desk {
  const curve = curveFor(market, card, desk.renewals, carryFansFor(desk, market));
  const settlement = settleNight(market, curve, price, spend, openBowl, card.bowlOffer);
  const move = renewalDelta(market, card, price, spend);
  const renewalsAfter = clamp(desk.renewals + move, 0, 100);
  const cashAfter = desk.cash + settlement.net;
  const night: SettledNight = {
    cardId: card.id,
    price,
    spend,
    openBowl: openBowl && card.bowlOffer,
    auto: flags.auto,
    stock: flags.stock,
    renewalsBefore: desk.renewals,
    renewalsAfter,
    renewalMove: renewalsAfter - desk.renewals,
    cashAfter,
    settlement,
    hidden: curve,
  };
  return {
    ...desk,
    cash: cashAfter,
    renewals: renewalsAfter,
    nights: [...desk.nights, night],
    price: market.planPrice,
    spend: 0,
    openBowl: false,
    locked: false,
  };
}

/** A desk in debt cannot spend on the night. Path dependence with teeth, and never terminal (R5). */
export const spendCapFor = (desk: Desk, market: Market): number => (desk.cash < 0 ? 0 : market.eventMax);

/**
 * A seat that joins after the first night is not broken and not blank: the
 * nights it missed were run by the desk manager at the season-ticket plan
 * price with no event spend. Stated on screen, deterministic, and
 * attributable — never a silent zero.
 */
function seatDesk(state: FullHouseState, seatId: SeatId): FullHouseState {
  if (state.desks[seatId]) return state;
  const deskNumber = state.deskOrder.length + 1;
  const marketId = marketForDesk(deskNumber);
  const market = MARKET_BY_ID.get(marketId)!;
  let desk: Desk = {
    deskNumber,
    marketId,
    crestIndex: (deskNumber - 1) % CREST_COUNT,
    joinedAtNight: state.nightIndex + 1,
    cash: 0,
    renewals: RENEWALS_START,
    price: market.planPrice,
    spend: 0,
    openBowl: false,
    locked: false,
    nights: [],
  };
  for (let i = 0; i < state.nightIndex; i += 1) {
    const card = CARDS[i]!;
    desk = applyNight(desk, market, card, market.planPrice, 0, false, { auto: false, stock: true });
  }
  return { ...state, desks: { ...state.desks, [seatId]: desk }, deskOrder: [...state.deskOrder, seatId] };
}

const withDesk = (state: FullHouseState, seatId: SeatId, desk: Desk): FullHouseState => ({
  ...state,
  desks: { ...state.desks, [seatId]: desk },
});

/* ------------------------------------------------------------ actions -- */

function requireOpenDesk(
  state: FullHouseState,
  seatId: SeatId,
): { ok: true; desk: Desk; market: Market; card: NightCard } | { ok: false; reason: string } {
  const desk = state.desks[seatId];
  if (!desk) return { ok: false, reason: "this seat has no desk yet — reload and rejoin" };
  const card = openCard(state);
  if (!card) return { ok: false, reason: "all five nights are done" };
  if (desk.locked) return { ok: false, reason: "tonight is locked — you cannot change it" };
  return { ok: true, desk, market: marketOf(desk), card };
}

function doSetPrice(state: FullHouseState, price: unknown, seatId: SeatId): ReduceResult<FullHouseState> {
  const open = requireOpenDesk(state, seatId);
  if (!open.ok) return { ok: false, reason: open.reason };
  if (!isValidPrice(price)) return { ok: false, reason: `price must be $${PRICE_MIN}-$${PRICE_MAX} in $${PRICE_STEP} steps` };
  return { ok: true, state: withDesk(state, seatId, { ...open.desk, price }) };
}

function doSetSpend(state: FullHouseState, spend: unknown, seatId: SeatId): ReduceResult<FullHouseState> {
  const open = requireOpenDesk(state, seatId);
  if (!open.ok) return { ok: false, reason: open.reason };
  const cap = spendCapFor(open.desk, open.market);
  if (!isValidSpend(spend, cap)) {
    return {
      ok: false,
      reason:
        cap === 0
          ? "you are carrying debt — you cannot spend on the night until the books are back above zero"
          : `night spend must be $0-$${cap.toLocaleString()} in $${SPEND_STEP.toLocaleString()} steps`,
    };
  }
  return { ok: true, state: withDesk(state, seatId, { ...open.desk, spend }) };
}

function doSetBowl(state: FullHouseState, openBowl: unknown, seatId: SeatId): ReduceResult<FullHouseState> {
  const open = requireOpenDesk(state, seatId);
  if (!open.ok) return { ok: false, reason: open.reason };
  if (typeof openBowl !== "boolean") return { ok: false, reason: "open must be true or false" };
  if (!open.card.bowlOffer) return { ok: false, reason: "there is no capacity option tonight" };
  return { ok: true, state: withDesk(state, seatId, { ...open.desk, openBowl }) };
}

function doLock(state: FullHouseState, seatId: SeatId): ReduceResult<FullHouseState> {
  const open = requireOpenDesk(state, seatId);
  if (!open.ok) return { ok: false, reason: open.reason };
  if (open.desk.spend > spendCapFor(open.desk, open.market)) {
    return { ok: false, reason: "your night spend is above what your books allow — lower it first" };
  }
  return { ok: true, state: withDesk(state, seatId, { ...open.desk, locked: true }) };
}

/**
 * The teacher's night bell. Every desk settles simultaneously against the
 * card that was printed before anyone touched a dial. A desk that never
 * locked is not skipped and not punished with a zero: it commits at the
 * season-ticket plan price with no event spend, marked `auto` so the reveal
 * can say so out loud.
 */
function closeNight(state: FullHouseState, honorPendingDials = false): FullHouseState {
  const card = openCard(state);
  if (!card) return state;
  const desks: Record<SeatId, Desk> = {};
  for (const [seatId, desk] of Object.entries(state.desks)) {
    const market = marketOf(desk);
    const auto = !desk.locked;
    // The bell's auto-commit is the "did nothing" line: a desk that never
    // touched a dial settles at the season-plan price. But when the TEACHER
    // ends PLAY early (onPhaseExit), a pair may be mid-decision with a real
    // price already set and simply not locked — `gate-l1-qa` D1 watched a desk
    // that had dialled $56 settle all five nights at a flat $24. D17's
    // auto-resolve-on-exit precedent is to honour what the student actually
    // submitted, so on that path the dials as they stand are committed.
    const usePending = honorPendingDials && !desk.locked;
    const price = auto && !usePending ? market.planPrice : desk.price;
    const spend = auto && !usePending ? 0 : Math.min(desk.spend, spendCapFor(desk, market));
    const openBowl = auto && !usePending ? false : desk.openBowl;
    desks[seatId] = applyNight(desk, market, card, price, spend, openBowl, { auto, stock: false });
  }
  return { ...state, desks, nightIndex: state.nightIndex + 1 };
}

/* ---------------------------------------------------------- aggregates -- */

export type CurvePoint = {
  marketId: MarketId;
  cardId: string;
  deskHandle: string;
  price: number;
  turnout: number;
  fillPct: number;
  soldOut: boolean;
};

export type TwoPeaks = {
  marketId: MarketId;
  cardId: string;
  ticketPeakPrice: number;
  totalPeakPrice: number;
  gapDollars: number;
  gapSteps: number;
  ticketRevenueAtTicketPeak: number;
  totalRevenueAtTicketPeak: number;
  totalRevenueAtTotalPeak: number;
  /**
   * gate-l1-play, Two Peaks "weakened as a proof": the panel asserted two
   * prices over a people-vs-price chart with no marker on either. This is the
   * money view — the two curves the two peaks are peaks OF, sampled across the
   * dial from the same frozen at-lock curve (D15). Released only with the rest
   * of the Two Peaks payload, i.e. after the night it is drawn on is played.
   */
  moneySeries: { price: number; ticket: number; total: number }[];
};

/** Sampling step for the Two Peaks money view — fine enough to show both peaks, coarse enough to project. */
const MONEY_SERIES_STEP = 4;

export type RepeatRow = {
  deskHandle: string;
  marketId: MarketId;
  n1Price: number;
  n1Turnout: number;
  n5Price: number;
  n5Turnout: number;
  renewalsStart: number;
  renewalsAtN5: number;
  samePrice: boolean;
};

export type MarketBooks = {
  marketId: MarketId;
  club: string;
  deskCount: number;
  medianCash: number;
  medianRenewals: number;
  bestFillPct: number;
  fullHouseNights: number;
};

export type FullHouseAggregate = {
  deskCount: number;
  nightIndex: number;
  nightsSettled: number;
  lockedCount: number;
  curves: CurvePoint[];
  twoPeaks: TwoPeaks[];
  repeatCard: RepeatRow[];
  books: MarketBooks[];
  totalTurnedAway: number;
  autoNightCount: number;
};

export const deskHandle = (desk: Desk): string => `Desk ${desk.deskNumber} · ${marketOf(desk).club}`;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function computeAggregate(state: FullHouseState): FullHouseAggregate {
  const desks = Object.values(state.desks);
  const curves: CurvePoint[] = [];
  for (const desk of desks) {
    for (const night of desk.nights) {
      curves.push({
        marketId: desk.marketId,
        cardId: night.cardId,
        deskHandle: deskHandle(desk),
        price: night.price,
        turnout: night.settlement.turnout,
        fillPct: night.settlement.fillPct,
        soldOut: night.settlement.soldOut,
      });
    }
  }

  // Two Peaks is drawn on the reveal card, against a REAL desk's locked-at-time
  // curve in that market (D15) — never a fresh recomputation from today's state.
  const twoPeaks: TwoPeaks[] = [];
  for (const market of MARKETS) {
    const desk = desks.find((d) => d.marketId === market.id && d.nights.some((n) => n.cardId === TWO_PEAKS_CARD_ID));
    const night = desk?.nights.find((n) => n.cardId === TWO_PEAKS_CARD_ID);
    if (!night) continue;
    const tp = ticketPeakPrice(market, night.hidden);
    const gp = totalPeakPrice(market, night.hidden);
    twoPeaks.push({
      marketId: market.id,
      cardId: TWO_PEAKS_CARD_ID,
      ticketPeakPrice: tp,
      totalPeakPrice: gp,
      gapDollars: tp - gp,
      gapSteps: Math.round((tp - gp) / PRICE_STEP),
      ticketRevenueAtTicketPeak: ticketRevenueAt(market, night.hidden, tp),
      totalRevenueAtTicketPeak: totalRevenueAt(market, night.hidden, tp),
      totalRevenueAtTotalPeak: totalRevenueAt(market, night.hidden, gp),
      moneySeries: PRICE_GRID.filter((p) => (p - PRICE_MIN) % MONEY_SERIES_STEP === 0 || p === tp || p === gp).map((p) => ({
        price: p,
        ticket: ticketRevenueAt(market, night.hidden, p),
        total: totalRevenueAt(market, night.hidden, p),
      })),
    });
  }

  const repeatCard: RepeatRow[] = [];
  for (const desk of desks) {
    const n1 = desk.nights.find((n) => n.cardId === "N1");
    const n5 = desk.nights.find((n) => n.cardId === "N5");
    if (!n1 || !n5) continue;
    repeatCard.push({
      deskHandle: deskHandle(desk),
      marketId: desk.marketId,
      n1Price: n1.price,
      n1Turnout: n1.settlement.turnout,
      n5Price: n5.price,
      n5Turnout: n5.settlement.turnout,
      renewalsStart: n1.renewalsBefore,
      renewalsAtN5: n5.renewalsBefore,
      samePrice: n1.price === n5.price,
    });
  }

  const books: MarketBooks[] = MARKETS.map((market) => {
    const own = desks.filter((d) => d.marketId === market.id);
    const fills = own.flatMap((d) => d.nights.map((n) => n.settlement.fillPct));
    return {
      marketId: market.id,
      club: market.club,
      deskCount: own.length,
      medianCash: median(own.map((d) => d.cash)),
      medianRenewals: median(own.map((d) => d.renewals)),
      bestFillPct: fills.length > 0 ? Math.max(...fills) : 0,
      fullHouseNights: own.reduce((sum, d) => sum + d.nights.filter((n) => n.settlement.soldOut).length, 0),
    };
  });

  return {
    deskCount: desks.length,
    nightIndex: state.nightIndex,
    nightsSettled: state.nightIndex,
    lockedCount: desks.filter((d) => d.locked).length,
    curves,
    twoPeaks,
    repeatCard,
    books,
    totalTurnedAway: desks.reduce((s, d) => s + d.nights.reduce((s2, n) => s2 + n.settlement.turnedAway, 0), 0),
    autoNightCount: desks.reduce((s, d) => s + d.nights.filter((n) => n.auto).length, 0),
  };
}

/* ----------------------------------------------------- counterfactuals -- */

export type SeasonReplay = { label: string; cash: number; renewals: number; note: string };

/**
 * Replays a desk's whole season under a fixed policy, from its real starting
 * books, with the same deterministic model. Honest because the model has no
 * RNG: we can show what the money would have done. We cannot show what the
 * pair would have done — and the board says so.
 */
export type SeasonPlan = { prices: readonly number[]; spends: readonly number[] };

/** Runs one explicit five-night plan through the real model, from a fresh set of books. */
export function replayPlan(market: Market, plan: SeasonPlan): { cash: number; renewals: number } {
  let cash = 0;
  let renewals = RENEWALS_START;
  let carry = 0;
  for (let i = 0; i < CARDS.length; i += 1) {
    const card = CARDS[i]!;
    const curve = curveFor(market, card, renewals, carry);
    const spend = Math.min(plan.spends[i] ?? 0, cash < 0 ? 0 : market.eventMax);
    const price = plan.prices[i] ?? market.planPrice;
    const settlement = settleNight(market, curve, price, spend, false, card.bowlOffer);
    cash += settlement.net;
    renewals = clamp(renewals + renewalDelta(market, card, price, spend), 0, 100);
    carry = Math.round(market.eventFans * spend);
  }
  return { cash, renewals };
}

const SPEND_LEVELS = (market: Market): number[] => {
  const out: number[] = [];
  for (let s = 0; s <= market.eventMax; s += SPEND_STEP) out.push(s);
  return out;
};

const bestFoundCache = new Map<MarketId, { cash: number; renewals: number; plan: SeasonPlan }>();

/**
 * The strongest five nights this model will give up, found by deterministic
 * coordinate descent from the night-by-night cash-best line over the whole
 * price dial AND the whole spend dial.
 *
 * `gate-l1-econ` B2 (BLOCKING): the line this replaces was labelled "the most
 * cash the five nights could give" and was beatable by $63,472 (New York) and
 * $78,280 (Memphis), because it hard-coded the spend to Nights 1 and 2 — which
 * LOSES money at New York. Two repairs: search for the spend schedule instead
 * of asserting one, and stop claiming a proven maximum in the copy. A greedy
 * price path is not provably optimal (tonight's price moves tomorrow's
 * renewals), so the card says "the best five nights we could find" and
 * `l1-tuning-harness` P14 tries to beat it from outside.
 */
export function bestFoundSeason(market: Market): { cash: number; renewals: number; plan: SeasonPlan } {
  const cached = bestFoundCache.get(market.id);
  if (cached) return cached;
  const spendLevels = SPEND_LEVELS(market);
  // Seed: each night at its own cash-best price against the curve that line reaches.
  const prices: number[] = [];
  const spends: number[] = CARDS.map(() => 0);
  {
    let renewals = RENEWALS_START;
    for (const card of CARDS) {
      const price = totalPeakPrice(market, curveFor(market, card, renewals, 0));
      prices.push(price);
      renewals = clamp(renewals + renewalDelta(market, card, price, 0), 0, 100);
    }
  }
  let best = replayPlan(market, { prices, spends }).cash;
  for (let pass = 0; pass < 4; pass += 1) {
    let improved = false;
    for (let i = 0; i < CARDS.length; i += 1) {
      for (const price of PRICE_GRID) {
        for (const spend of spendLevels) {
          const trialPrices = [...prices];
          const trialSpends = [...spends];
          trialPrices[i] = price;
          trialSpends[i] = spend;
          const cash = replayPlan(market, { prices: trialPrices, spends: trialSpends }).cash;
          if (cash > best + 1e-9) {
            best = cash;
            prices[i] = price;
            spends[i] = spend;
            improved = true;
          }
        }
      }
    }
    if (!improved) break;
  }
  const plan: SeasonPlan = { prices: [...prices], spends: [...spends] };
  const outcome = { ...replayPlan(market, plan), plan };
  bestFoundCache.set(market.id, outcome);
  return outcome;
}

/**
 * gate-l1-econ-r1 R2 (BLOCKING): the two notes printed beside these rows used to
 * ASSERT a tradeoff ("renewals stay high" on the flat line; "look at what it
 * costs on the renewals side" on the strong line) that the same card's own
 * numbers refuted — at the old constants the strongest line beat the flat plan
 * by $1.45M AND twelve renewal points. Both notes are now READ OFF the two
 * rows, so a copy sentence can never again contradict the number beside it: the
 * strong line's note only claims a renewals cost when it has one, and says so
 * with the size of the gap.
 */
function replaysFor(desk: Desk): SeasonReplay[] {
  const market = marketOf(desk);
  const flatPlan = replayPlan(market, { prices: CARDS.map(() => market.planPrice), spends: CARDS.map(() => 0) });
  const strongest = bestFoundSeason(market);
  const spentOn = CARDS.filter((_c, i) => (strongest.plan.spends[i] ?? 0) > 0).map((c) => c.label.replace("Night ", "N"));
  const renewalGap = flatPlan.renewals - strongest.renewals;
  const cashGap = strongest.cash - flatPlan.cash;
  const flatNote =
    renewalGap > 0
      ? `Never moved the dial. Nobody's plan ever looked like a waste or a rip-off, so this line ends ${renewalGap} renewal ${renewalGap === 1 ? "point" : "points"} ahead of the strongest one — and $${Math.abs(cashGap).toLocaleString()} behind it in cash.`
      : `Never moved the dial. It leaves money on the table on the big nights, and on this room's numbers it does not buy a better renewals book either.`;
  const strongNote =
    renewalGap > 0
      ? `Not a proven maximum — the best line we could search out: a different price on every night, and event money on ${
          spentOn.length === 0 ? "no night at all" : spentOn.join(" and ")
        }. It made $${Math.abs(cashGap).toLocaleString()} more than never moving the dial, and it paid ${renewalGap} renewal ${
          renewalGap === 1 ? "point" : "points"
        } for it. There is no exchange rate between those two numbers. You have to choose.`
      : `Not a proven maximum — the best line we could search out: a different price on every night, and event money on ${
          spentOn.length === 0 ? "no night at all" : spentOn.join(" and ")
        }. On this model it is ahead on both books, so on these five nights the money did not cost the plan holders anything.`;
  return [
    {
      label: "What you actually did",
      cash: desk.cash,
      renewals: desk.renewals,
      note: "Your five nights, your two dials.",
    },
    {
      label: `Same price every night ($${market.planPrice})`,
      cash: flatPlan.cash,
      renewals: flatPlan.renewals,
      note: flatNote,
    },
    {
      label: "The most cash we could find",
      cash: strongest.cash,
      renewals: strongest.renewals,
      note: strongNote,
    },
  ];
}

/* ------------------------------------------------------------ the copy -- */

export const MODULE_ID = "m2l1-full-house" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

const PHASES: readonly CanonicalPhase[] = [
  "LOBBY",
  "HOOK",
  "PLAY",
  "REVEAL",
  "ADAPT",
  "COUNTERFACTUAL",
  "SYNTHESIS",
  "COMPLETE",
];

export const HOOK_COPY =
  "You and your partner do not run the roster today. You run the building. There is a game tonight, the doors open in an hour, and nobody has told you what a seat is worth. Five nights. Two dials. No forecast — just tonight's card and whatever you learned the last time you guessed.";

export const OBJECTIVE_COPY =
  "You are keeping two books, and they do not add up to one number. CASH is the money the building made after the bill. RENEWALS is the share of season-ticket holders who come back next year. A price that is great for one is usually worse for the other — that is the job.";

export const HOUSE_RULES: readonly string[] = [
  "Every night you set a PRICE ($10-$120) and how much of tonight's money you put into MAKING IT AN EVENT. Then you lock. There is no preview — the dials show dollars and nothing else.",
  "Everything that will move tonight's crowd is printed on tonight's card before you touch a dial: the day, the visiting club's Draw out of 100, and whether it is on TV. Nothing else moves it.",
  "Money you spend on the night never changes tonight's crowd. It lands on the NEXT night — and tonight's books are visibly worse for it. It also nudges RENEWALS up a little on the night you spend it: the whole dial is worth about two points.",
  "Your building's bill is due every night whether 200 people come or 19,000 do.",
  // gate-l1-econ-r1 N-a and N-b, both measured: the bargain arm peaks at +12 on
  // Night 3 (draw 88, national TV) exactly as it does on Night 4 (draw 97, no
  // TV) — national TV moves WHERE the forgiveness line sits ($56 vs $112 in New
  // York), never whether the arm fires. And one dial step under the plan price
  // is still +1, so "below the plan price" had to become "well under".
  "RENEWALS follow your season-ticket plan price and what tonight is worth to the people who hold that plan. Charge well UNDER the plan price and the plan looks like a waste, so they stop buying it. Charge above what tonight is worth to them and they quit. The bigger the visiting club's Draw, the higher the price they will forgive — and a national-TV listing pulls that line back down, because they can watch it at home for nothing.",
];

export const BOARD_HONESTY_LINE =
  "These demand curves are modeled on real market differences. They are not the Knicks' or the Grizzlies' actual measured demand. The market sizes are real; the curves are ours.";

/**
 * gate-l1-sr F3 (magnitude honesty): the old line said one night here "stands
 * for about eight real home dates", which the modeled dollars contradict by
 * 30-60x — a real Knicks home date takes in several million. The horizon line
 * is now calendar compression only, and the money scale is stated separately,
 * before the first price, by MODELED_DOLLARS_LINE.
 */
export const HORIZON_LINE = "Five nights here stand in for a whole 41-date home season. A real NBA season is 41 home games.";

/** BC-3 / gate-l1-sr F3: the money scale, said out loud BEFORE the first price, not once at SYNTHESIS. */
export const MODELED_DOLLARS_LINE =
  "The dollars here are shrunk to classroom size. One real Knicks home night takes in several million; tonight's bill is what it costs to open the doors, not what the players are paid.";

/** BC-3: every real figure in product copy carries its date. */
export const SOURCE_NOTES: readonly string[] = [
  "New York Knicks · Madison Square Garden and Memphis Grizzlies · FedExForum are real clubs and real buildings; the Grizzlies' local media deal ran under $10M a year against the Lakers' about $149M in one leaked league year, 2016-17 (reported by ESPN, September 2017; verified as of 2026-08-31).",
  "Night 4 is modeled on a real demand shock: Indiana Fever home attendance went from 4,066 per game in 2023 to 17,036 per game in 2024, the best in the WNBA, and six opposing clubs moved Fever games into bigger buildings (2024 season; verified as of 2026-08-31).",
  "The San Francisco Giants pioneered dynamic ticket pricing in 2009 and ran it across a full season in 2010; variable and dynamic pricing are standard across the NBA today (verified as of 2026-08-31).",
  "The New York Knicks won the 2026 NBA championship on 13 June 2026, beating the San Antonio Spurs — their first title since 1973 (2025-26 season; NBA.com and ESPN, verified as of 2026-08-31). Every visiting club on these five cards is a ROLE, never a named club, so no desk in this room ever hosts itself.",
  "Building capacities are modeled at real arena scale: about 19,800 seats at Madison Square Garden (listed basketball capacity 19,812, 2025-26 season) and 17,794 at FedExForum as this lesson's modeled seat count — published FedExForum figures range from 16,667 to 18,119 and the building is in a phased renovation through 2028, so there is no single listed figure to quote (verified as of 2026-08-31). Every dollar figure in this lesson is a modeled magnitude, not an audited club financial.",
];

/**
 * The simplifications ledger — `gate-l1-econ` N1, carried unrepaired through the
 * recheck and now built. Every place this model knowingly departs from the real
 * economics, what changed, and what a student could wrongly conclude from it.
 * It lives on the TEACHER surface: it is what a teacher needs in order to answer
 * a sharp student honestly, and putting it on the projector would spend board
 * space the room needs for evidence.
 */
export const SIMPLIFICATIONS: readonly { what: string; why: string; risk: string }[] = [
  {
    what: "One straight demand line per night, with a fixed slope printed nowhere.",
    why: "A five-night lesson cannot fit a real demand system, and a curved one would make the arithmetic unreadable for grade 5.",
    risk: "A student may think real demand is a straight line, or that a club knows its own line. Neither is true — real clubs estimate it and are often wrong.",
  },
  {
    what: "Renewals move the crowd, but only a little (10 fans per renewal point).",
    why: "Renewals ARE partly next year's ticket demand, so the channel is real. It is deliberately small: when it was large, chasing renewals also maximised cash and the two books stopped trading off at all.",
    risk: "A student may conclude renewals barely matter. They matter enormously — they matter NEXT season, which is outside these five nights, and that is exactly why the two books do not add up.",
  },
  {
    what: "Season-ticket holders reward a strong walk-up price on a big night.",
    why: "Modelled from the real 'my plan was a bargain' effect that variable pricing leans on.",
    risk: "Real renewal behaviour is far noisier and depends on winning, service and the schedule, none of which are in this model.",
  },
  {
    what: "In-arena spend is a flat per-head number ($18 New York, $12 Memphis).",
    why: "It makes the Two Peaks reveal checkable by eye.",
    risk: "Real per-head spend varies with who comes, what night it is, and what is open.",
  },
  {
    what: "Dollars are shrunk to classroom size and one night stands for a whole home season.",
    why: "Real Knicks gate revenue per night runs into the millions; the numbers would stop being readable.",
    // TT-R5: this risk line used to name a code identifier ("MODELED_DOLLARS_LINE
    // says so") on a surface a stranger reads out loud. The student screen's own
    // sentence is quoted instead, marked as the mirror it is.
    risk: `The magnitudes are not real club financials and should never be quoted as such. Their screens already say so before the first price, in these words: "${MODELED_DOLLARS_LINE}"`,
  },
  {
    what: "No randomness at all: no weather, no injuries, no winning streak.",
    why: "Every outcome must be attributable to the pair's own decision, or the debrief is a shrug.",
    risk: "Real pricing desks are guessing under genuine uncertainty; this room is not.",
  },
];

/**
 * gate-l1-econ B3 / gate-l1-play P3. The old version of this told the room the
 * six real clubs moved buildings "for exactly the reason some of you just paid
 * to open more seats" — a real-world citation blessing a decision this model
 * charges $95,000 (New York) or $42,000 (Memphis) for at every price a
 * well-played desk would choose, printed on the projector before anybody had
 * bought anything. The capacity option is a deliberate opportunity-cost trap
 * (see the Night 4 ruling in this module's tests and P13): it is a partial
 * refund on underpricing, never part of a best night. The copy now says that.
 */
export const SHOCK_REVEAL_COPY =
  "That night was modeled on a real one. Indiana Fever home attendance went from 4,066 a game in 2023 to 17,036 a game in 2024 — best in the WNBA — and six opposing clubs moved Fever games out of their own buildings and into bigger ones. They could not raise the price: those tickets were already sold. You could. That is the difference: buying seats is what a club does when it cannot change the price. Opening more of this building never beat pricing it right — it only ever handed part of the money back to a desk that had already priced too low.";

/**
 * gate-l1-econ N3 / gate-l1-econ-r1 N-c. The old line claimed Night 4 was "the
 * one night where charging too little hurts more than charging too much" and
 * that on the other four the two mistakes "cost about the same". Measured at
 * the shipped constants (renewals 50, no spend, bowl closed): at $10 and $20
 * either side of a night's best price the two errors cost within 2% of each
 * other on EVERY card in BOTH markets — so Night 4 was not special there. It is
 * only at $30 out that the building bites: New York Night 4 low -$205,200 vs
 * high -$135,000 (1.52x), Memphis -$207,996 vs -$135,000 (1.54x). This copy
 * says exactly that and nothing more.
 */
export const CAPACITY_DEFENCE_COPY =
  "Miss the best price by a couple of dollars and it costs about the same whether you went over or under — on every card, in both buildings, the two mistakes are close to even. Miss it by a lot and the building starts to matter. Once every seat is sold, a cheaper ticket brings nobody new; it just charges less to the same full house. On Night 4, being $30 under the best price cost about half again as much as being $30 over it.";

export const DYNAMIC_PRICING_COPY =
  "The thing you just did five times with one dial, real clubs built software to do every hour. The San Francisco Giants started it in 2009 and ran a full season of it in 2010; variable and dynamic pricing are standard across the NBA now. Your job exists.";

export const BEYOND_SPORTS_LINE =
  "Flights and hotels that cost more on a Friday. Movie tickets cheap on Tuesday and popcorn that is not. A bake sale in the rain. The shop that sells milk at a loss at the back of the store so you walk past everything else to reach it.";

export const EXIT_PROMPT = "Which night did you get wrong, and what on the card should have told you?";

export const ADAPT_QUESTIONS: readonly string[] = [
  "Whose best price on Saturday was different from their best price on Tuesday? What on the card made it different?",
  "Did anybody charge LESS and make MORE? How is that possible?",
  "Night 5 was Night 1's card again. Why did a different number of people show up?",
];

/**
 * gate-l1-play P1 / gate-l1-econ B5: the board's evidence is grouped by demand
 * world (one market, one night), because five different nights joined into one
 * line contains stretches where a higher price drew a bigger crowd. The prompt
 * points the room at comparable dots only.
 */
export const ARGUE_PROMPT =
  "Find one night on the board — one colour, one shape — where two desks in the same building charged different prices. Somebody in this room made more money by charging less. Explain how, using those dots, not a guess.";

export const COMPLETE_COPY =
  "That is Full House. You priced five nights with no forecast, you found out that the crowd moves for reasons printed on a card, and you found out that the ticket is not the only thing you sell. Next lesson: most of the people in your building came to see somebody else's team.";

/* ------------------------------------------------------- view builders -- */

/** The ONLY function that turns a settled night into something a view may carry. `hidden` never crosses it. */
function viewNight(night: SettledNight, market: Market) {
  return {
    cardId: night.cardId,
    label: CARD_BY_ID.get(night.cardId)?.label ?? night.cardId,
    day: CARD_BY_ID.get(night.cardId)?.day ?? "",
    visitor: CARD_BY_ID.get(night.cardId)?.visitor ?? "",
    draw: CARD_BY_ID.get(night.cardId)?.draw ?? 0,
    tv: CARD_BY_ID.get(night.cardId)?.tv ?? "none",
    price: night.price,
    spend: night.spend,
    openBowl: night.openBowl,
    auto: night.auto,
    stock: night.stock,
    turnout: night.settlement.turnout,
    seatsOpen: night.settlement.seatsOpen,
    fillPct: night.settlement.fillPct,
    turnedAway: night.settlement.turnedAway,
    soldOut: night.settlement.soldOut,
    gate: night.settlement.gate,
    inArena: night.settlement.inArena,
    total: night.settlement.total,
    bill: night.settlement.bill,
    spendPaid: night.settlement.spendPaid,
    bowlCost: night.settlement.bowlCost,
    net: night.settlement.net,
    renewalsBefore: night.renewalsBefore,
    renewalsAfter: night.renewalsAfter,
    renewalMove: night.renewalMove,
    cashAfter: night.cashAfter,
    resaleNote:
      night.settlement.turnedAway > 0
        ? `${night.settlement.turnedAway.toLocaleString()} people wanted in and could not get a seat. Those seats changed hands again outside the building. That money is not missing from your books — you never asked for it.`
        : null,
    marketId: market.id,
  };
}

/**
 * The five-night slate: day, visiting club, Draw and TV for every night, known
 * before the first price.
 *
 * `gate-l1-econ` B4 / `gate-l1-play` P2: the night-spend dial only pays when
 * tomorrow is a night you can charge for, and the pair was never shown what
 * tomorrow was — a real marginal-return decision made blind. A real building
 * has the schedule on the wall in August. This carries no outcome and no
 * demand constant: the same four printed facts the night card carries, one
 * night earlier.
 */
function slateView() {
  return CARDS.map((card, i) => ({
    id: card.id,
    label: card.label,
    index: i + 1,
    day: card.day,
    visitor: card.visitor,
    draw: card.draw,
    tv: card.tv,
    repeatOf: card.repeatOf,
    bowlOffer: card.bowlOffer,
  }));
}

function cardView(card: NightCard, index: number) {
  return {
    id: card.id,
    label: card.label,
    index: index + 1,
    of: NIGHT_COUNT,
    day: card.day,
    visitor: card.visitor,
    draw: card.draw,
    tv: card.tv,
    notes: card.notes,
    bowlOffer: card.bowlOffer,
    repeatOf: card.repeatOf,
  };
}

function deskIdentity(desk: Desk) {
  const market = marketOf(desk);
  return {
    deskNumber: desk.deskNumber,
    handle: deskHandle(desk),
    crestIndex: desk.crestIndex,
    market: marketFacts(market),
    joinedAtNight: desk.joinedAtNight,
  };
}

function booksFor(desk: Desk) {
  return { cash: desk.cash, renewals: desk.renewals, inDebt: desk.cash < 0 };
}

/* --------------------------------------------------------------- module -- */

export const fullHouseModule: LessonModule<FullHouseState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 1 — Full House",
  phases: PHASES,

  initialState() {
    return { desks: {}, deskOrder: [], nightIndex: 0, twoPeaksReleased: false, revealStage: 0 };
  },

  /**
   * Manual-fallback discipline: no reveal in this lesson depends on a click
   * that may never come. Leaving PLAY closes whatever night is still open
   * (every desk settles with the same math the bell uses) and releases the
   * Two Peaks panel; leaving REVEAL plays out every remaining reveal stage.
   */
  onPhaseExit(state, fromPhase) {
    let next = state;
    if (fromPhase === "PLAY") {
      // The night that is actually open settles on the pair's own dials (see
      // closeNight); nights nobody ever saw settle at the plan price, which is
      // where every dial rests after a night is applied anyway.
      let first = true;
      while (next.nightIndex < NIGHT_COUNT) {
        next = closeNight(next, first);
        first = false;
      }
      if (!next.twoPeaksReleased) next = { ...next, twoPeaksReleased: true };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    return next;
  },

  reduce(state, action, ctx): ReduceResult<FullHouseState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a desk" };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: false, reason: `desks are handed out in LOBBY, HOOK or PLAY (session is in ${ctx.phase})` };
      }
      return { ok: true, state: seatDesk(state, ctx.seatId) };
    }
    if (action.type === "setPrice" || action.type === "setSpend" || action.type === "setBowl" || action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only price a night during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can work a desk" };
      if (action.type === "setPrice") return doSetPrice(state, action["price"], ctx.seatId);
      if (action.type === "setSpend") return doSetSpend(state, action["spend"], ctx.seatId);
      if (action.type === "setBowl") return doSetBowl(state, action["open"], ctx.seatId);
      return doLock(state, ctx.seatId);
    }
    if (action.type === "teacher:closeNight") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher rings the night bell" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `nights close during PLAY (session is in ${ctx.phase})` };
      if (state.nightIndex >= NIGHT_COUNT) return { ok: false, reason: "all five nights are already in the books" };
      return { ok: true, state: closeNight(state) };
    }
    if (action.type === "teacher:twoPeaks") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher releases the Two Peaks panel" };
      if (ctx.phase !== "PLAY" && ctx.phase !== "REVEAL") {
        return { ok: false, reason: `the Two Peaks panel is released in PLAY or REVEAL (session is in ${ctx.phase})` };
      }
      if (state.nightIndex < 3) return { ok: false, reason: "play Night 3 first — the panel is drawn on that night's curve" };
      if (state.twoPeaksReleased) return { ok: false, reason: "the Two Peaks panel is already up" };
      return { ok: true, state: { ...state, twoPeaksReleased: true } };
    }
    if (action.type === "teacher:revealNext") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher advances the reveal" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the reveal advances during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= REVEAL_STEPS) return { ok: false, reason: "every reveal stage has already played" };
      const nextStage = state.revealStage + 1;
      return {
        ok: true,
        state: { ...state, revealStage: nextStage, twoPeaksReleased: state.twoPeaksReleased || nextStage >= NIGHT_COUNT + 1 },
      };
    }
    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "LOBBY" || phase === "HOOK") return ["takeSeat"];
    if (phase === "PLAY") return ["takeSeat", "setPrice", "setSpend", "setBowl", "lock"];
    return [];
  },

  studentView(state, seatId, phase) {
    const desk = state.desks[seatId];
    const view = ((): Record<string, unknown> => {
      if (!desk) {
        return { phase, seated: false, message: "You're in! Taking a desk…" };
      }
      const market = marketOf(desk);
      const identity = deskIdentity(desk);
      const history = desk.nights.map((n) => viewNight(n, market));
      switch (phase) {
        case "LOBBY":
          return {
            phase,
            seated: true,
            ...identity,
            message: `You have Desk ${desk.deskNumber}. Tonight you run the ${market.club}' building — ${market.building}.`,
            plainLine: market.plainLine,
          };

        case "HOOK":
          return {
            phase,
            seated: true,
            ...identity,
            message: HOOK_COPY,
            objective: OBJECTIVE_COPY,
            rules: HOUSE_RULES,
            plainLine: market.plainLine,
            books: booksFor(desk),
            horizonLine: HORIZON_LINE,
            modeledDollarsLine: MODELED_DOLLARS_LINE,
            slate: slateView(),
          };

        case "PLAY": {
          const card = openCard(state);
          const lastNight = history[history.length - 1] ?? null;
          if (!card) {
            return {
              phase,
              seated: true,
              ...identity,
              allNightsDone: true,
              books: booksFor(desk),
              history,
              message: "All five nights are in the books. Look up at the board.",
            };
          }
          // BLIND COMMITMENT: this payload contains the card, the dials'
          // dollar positions, printed operating facts and the pair's own
          // realized history. It contains nothing derived from the pending
          // action, and no demand constant. See fullHouse.test.ts.
          return {
            phase,
            seated: true,
            ...identity,
            card: cardView(card, state.nightIndex),
            nextCard: CARDS[state.nightIndex + 1] ? cardView(CARDS[state.nightIndex + 1]!, state.nightIndex + 1) : null,
            slate: slateView(),
            modeledDollarsLine: MODELED_DOLLARS_LINE,
            locked: desk.locked,
            price: desk.price,
            spend: desk.spend,
            openBowl: desk.openBowl,
            spendCap: spendCapFor(desk, market),
            priceMin: PRICE_MIN,
            priceMax: PRICE_MAX,
            priceStep: PRICE_STEP,
            spendStep: SPEND_STEP,
            books: booksFor(desk),
            rules: HOUSE_RULES,
            // gate-l1-play P10: the rule that governs half the scoreboard, beside
            // the dial that drives it, before the commit. Arithmetic on printed
            // facts only — it names no crowd, no dollar and no "right" price.
            renewalRule: renewalRuleFor(market),
            // gate-l1-play "no receipt" (P2's second clause): last night's event
            // money, converted at the rate the pair was shown before they spent
            // it, so the dial can be confirmed or refuted instead of taken on
            // faith. Restates a published rule; discloses no hidden constant.
            spendReceipt:
              lastNight && lastNight.spend > 0
                ? {
                    spend: lastNight.spend,
                    fans: carryFansFor(desk, market),
                    label: `Last night you put $${lastNight.spend.toLocaleString()} into making it an event. That bought about ${carryFansFor(
                      desk,
                      market,
                    ).toLocaleString()} extra people into tonight's building — if there is room for them.`,
                  }
                : null,
            history,
            lastNight,
            message: desk.locked
              ? "Locked. Nothing to do but find out — the doors open when your teacher rings the bell."
              : "No preview. Read the card, read your own nights, and commit.",
          };
        }

        case "REVEAL":
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            history,
            revealStage: state.revealStage,
            totalRevealSteps: REVEAL_STEPS,
            twoPeaksReleased: state.twoPeaksReleased,
            twoPeaks: state.twoPeaksReleased
              ? computeAggregate(state).twoPeaks.filter((t) => t.marketId === desk.marketId)
              : [],
            message: "Your five nights, in the books. Look up at the board for the room's.",
          };

        case "ADAPT":
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            history,
            questions: ADAPT_QUESTIONS,
            message: "Talk to your partner before you answer out loud.",
          };

        case "COUNTERFACTUAL": {
          const n1 = desk.nights.find((n) => n.cardId === "N1");
          const n5 = desk.nights.find((n) => n.cardId === "N5");
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            repeat:
              n1 && n5
                ? {
                    n1Price: n1.price,
                    n1Turnout: n1.settlement.turnout,
                    n5Price: n5.price,
                    n5Turnout: n5.settlement.turnout,
                    renewalsAtN1: n1.renewalsBefore,
                    renewalsAtN5: n5.renewalsBefore,
                    samePrice: n1.price === n5.price,
                  }
                : null,
            replays: replaysFor(desk),
            honestLimit:
              "We can show you what the money would have done. We cannot show you what you would have done — that is why you played it.",
            prompt: ARGUE_PROMPT,
          };
        }

        case "SYNTHESIS":
          return { phase, seated: true, ...identity, books: booksFor(desk), message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

        case "COMPLETE":
          return { phase, seated: true, ...identity, books: booksFor(desk), message: COMPLETE_COPY, exitPrompt: EXIT_PROMPT };

        default:
          return { phase, seated: true, ...identity };
      }
    })();
    return tag(view);
  },

  teacherView(state, phase) {
    const card = openCard(state);
    const desks = state.deskOrder
      .map((seatId) => ({ seatId, desk: state.desks[seatId] }))
      .filter((entry): entry is { seatId: SeatId; desk: Desk } => entry.desk !== undefined)
      .map(({ seatId, desk }) => ({
        seatId,
        deskNumber: desk.deskNumber,
        handle: deskHandle(desk),
        marketId: desk.marketId,
        club: marketOf(desk).club,
        locked: desk.locked,
        price: desk.price,
        spend: desk.spend,
        openBowl: desk.openBowl,
        cash: desk.cash,
        renewals: desk.renewals,
        inDebt: desk.cash < 0,
        nightsPlayed: desk.nights.length,
        joinedAtNight: desk.joinedAtNight,
        lastFillPct: desk.nights[desk.nights.length - 1]?.settlement.fillPct ?? null,
        heldSamePriceRun: sameRun(desk),
      }));
    return tag({
      phase,
      nightIndex: state.nightIndex,
      nightNumber: Math.min(state.nightIndex + 1, NIGHT_COUNT),
      nightCount: NIGHT_COUNT,
      allNightsDone: state.nightIndex >= NIGHT_COUNT,
      card: card ? cardView(card, state.nightIndex) : null,
      lockedCount: desks.filter((d) => d.locked).length,
      deskCount: desks.length,
      twoPeaksReleased: state.twoPeaksReleased,
      twoPeaksAvailable: state.nightIndex >= 3 && !state.twoPeaksReleased,
      twoPeaksReason:
        state.twoPeaksReleased
          ? "Already on the projector."
          : state.nightIndex < 3
            ? "Available after the Night 3 bell — the panel is drawn on that night's own curve."
            : "Ready. Releasing it prints the profit-making price band on the projector, so holding it until after Night 4 keeps the biggest decision of the lesson blind.",
      revealStage: state.revealStage,
      totalRevealSteps: REVEAL_STEPS,
      // TT-B2 (HK-3): name the stage the next press lands, the stage now on the
      // projector, and the line to say as each one arrives.
      revealStages: REVEAL_STAGES,
      nextRevealStage: REVEAL_STAGES[state.revealStage] ?? null,
      currentRevealStage: REVEAL_STAGES[state.revealStage - 1] ?? null,
      desks,
      aggregate: computeAggregate(state),
      watchFor: teacherWatchFor(state, phase),
      // TT-B1 (HK-1): the per-phase director script.
      director: teacherDirector(state, phase),
      // TT-B3: what is on the projector RIGHT NOW, in every phase — not just PLAY.
      projectorNow: projectorMirror(state, phase),
      // TT-B9 (HK-5): the mechanics that exist only on the student screen.
      studentScreen: studentScreenMechanics(state),
      // gate-l1-econ N1: where this model knowingly departs from the real thing.
      simplifications: SIMPLIFICATIONS,
      // TT-B6 (HK-2): what ringing the bell will do to a desk that never locked.
      bellNote:
        state.nightIndex >= NIGHT_COUNT
          ? "All five nights are in the books."
          : `Ringing the bell settles Night ${Math.min(state.nightIndex + 1, NIGHT_COUNT)} for every desk at once. Any desk that has not locked settles at its own season-plan price and is marked AUTO on its own screen — nobody is skipped and nobody gets a zero.`,
    });
  },

  boardView(state, phase) {
    const agg = computeAggregate(state);
    const card = openCard(state);
    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return {
            mode: "lobby",
            deskCount: agg.deskCount,
            assignments: state.deskOrder
              .map((seatId) => state.desks[seatId])
              .filter((d): d is Desk => d !== undefined)
              .map((d) => ({ handle: deskHandle(d), crestIndex: d.crestIndex, marketId: d.marketId })),
            markets: MARKETS.map((m) => ({ id: m.id, club: m.club, building: m.building, plainLine: m.plainLine, capacity: m.capacity, capacityNote: m.capacityNote })),
            message: "You are not the GM today. You run the building.",
          };

        case "HOOK":
          return {
            mode: "hook",
            message: HOOK_COPY,
            objective: OBJECTIVE_COPY,
            deskCount: agg.deskCount,
            markets: MARKETS.map((m) => ({ id: m.id, club: m.club, building: m.building, plainLine: m.plainLine, capacity: m.capacity, capacityNote: m.capacityNote, bill: m.bill, planPrice: m.planPrice })),
            honestyLine: BOARD_HONESTY_LINE,
            horizonLine: HORIZON_LINE,
            modeledDollarsLine: MODELED_DOLLARS_LINE,
            slate: slateView(),
          };

        case "PLAY": {
          if (!card) {
            // gate-l1-projector repair 3: the last bell used to dump all 25
            // desk-night marks and the room's turned-away total onto the
            // projector automatically, then REVEAL wiped them and replayed the
            // same five nights one press at a time. The centrepiece reveal was
            // pre-spoiled and then repeated. The bell now closes on a held
            // state; the staged REVEAL is the first time the room sees the
            // whole picture.
            return {
              mode: "play",
              allNightsDone: true,
              curves: [],
              held: true,
              twoPeaksReleased: state.twoPeaksReleased,
              twoPeaks: state.twoPeaksReleased ? agg.twoPeaks : [],
              honestyLine: BOARD_HONESTY_LINE,
              message: "Five nights, in the books.",
              subMessage: "Nobody has seen the room's numbers yet. They go up one night at a time.",
            };
          }
          const settledCards = CARDS.slice(0, state.nightIndex).map((c) => c.id);
          return {
            mode: "play",
            card: cardView(card, state.nightIndex),
            nextCard: CARDS[state.nightIndex + 1] ? cardView(CARDS[state.nightIndex + 1]!, state.nightIndex + 1) : null,
            lockedCount: agg.lockedCount,
            deskCount: agg.deskCount,
            settledCards,
            // Curves for nights ALREADY settled only. Nothing about the open
            // night is on the projector while it is still open (R13).
            curves: agg.curves.filter((p) => settledCards.includes(p.cardId)),
            lastSettledCardId: settledCards[settledCards.length - 1] ?? null,
            twoPeaksReleased: state.twoPeaksReleased,
            twoPeaks: state.twoPeaksReleased ? agg.twoPeaks : [],
            // gate-l1-play P3 (pre-commit leak): this block used to render while
            // Night 4 was still OPEN and nobody had bought anything, telling the
            // room what "some of you just paid" for and nudging it toward the
            // one control that is a trap. It lands after the bell, never before.
            shockCopy: settledCards.includes("N4") ? SHOCK_REVEAL_COPY : null,
            honestyLine: BOARD_HONESTY_LINE,
          };
        }

        case "REVEAL": {
          const shown = Math.min(state.revealStage, NIGHT_COUNT);
          const shownCards = CARDS.slice(0, shown).map((c) => c.id);
          const stage = REVEAL_STAGES[state.revealStage - 1] ?? null;
          return {
            mode: "reveal",
            revealStage: state.revealStage,
            totalRevealSteps: REVEAL_STEPS,
            // gate-l1-play "REVEAL stages 1-5 spend four of their five beats
            // silently": every press now names its own beat on the projector.
            stageName: stage?.name ?? null,
            stageHeadline: stage?.headline ?? null,
            shownCards,
            curves: agg.curves.filter((p) => shownCards.includes(p.cardId)),
            twoPeaksReleased: state.twoPeaksReleased && state.revealStage >= NIGHT_COUNT + 1,
            twoPeaks: state.revealStage >= NIGHT_COUNT + 1 ? agg.twoPeaks : [],
            booksReleased: state.revealStage >= REVEAL_STEPS,
            books: state.revealStage >= REVEAL_STEPS ? agg.books : [],
            // Held until every night is up: at stage 0 this counted nights the
            // room had not been shown yet (gate-l1-projector).
            totalTurnedAway: state.revealStage >= NIGHT_COUNT ? agg.totalTurnedAway : null,
            // Beat copy belongs to its own beat: carried forward, three long
            // paragraphs stacked on the final stage and pushed the season books
            // off a 1366x768 projector (gate-l1-projector repair 2).
            shockCopy: state.revealStage === 4 ? SHOCK_REVEAL_COPY : null,
            capacityDefence: state.revealStage >= REVEAL_STEPS ? CAPACITY_DEFENCE_COPY : null,
            // gate-l1-play P10: the renewals rule reaches the room on the beat
            // where its consequence is on screen — Night 5 against Night 1.
            renewalsRule: state.revealStage === RENEWALS_REVEAL_STAGE ? RENEWALS_RULE_BOARD : null,
            honestyLine: BOARD_HONESTY_LINE,
          };
        }

        case "ADAPT":
          return {
            mode: "adapt",
            questions: ADAPT_QUESTIONS,
            curves: agg.curves,
            twoPeaks: agg.twoPeaks,
            capacityDefence: CAPACITY_DEFENCE_COPY,
            renewalsRule: RENEWALS_RULE_BOARD,
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "COUNTERFACTUAL":
          return {
            mode: "counterfactual",
            repeatCard: agg.repeatCard,
            repeatSummary: repeatSummary(agg.repeatCard),
            // gate-l1-play 1a (BLOCKING P1-b): ARGUE_PROMPT tells the room to
            // read dots "on the board". The scatter existed in REVEAL and ADAPT
            // only, so the designated argue-fuel pointed off-screen at the exact
            // moment the argument was asked for.
            curves: agg.curves,
            honestLimit:
              "We can show you what the money would have done. We cannot show you what you would have done. That is why we played it instead of arguing about it.",
            prompt: ARGUE_PROMPT,
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "SYNTHESIS":
          return {
            mode: "synthesis",
            heading: "WHAT ECONOMICS DID WE JUST USE?",
            cards: synthesisCards(state, agg),
            beyondSports: BEYOND_SPORTS_LINE,
            exitPrompt: EXIT_PROMPT,
            sourceNotes: SOURCE_NOTES,
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "COMPLETE":
          return { mode: "complete", message: COMPLETE_COPY, sourceNotes: SOURCE_NOTES };

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

/* --------------------------------------------------------- teacher aids -- */

/** Longest run of identical prices — the design's "WATCH FOR" voice at ADAPT. */
function sameRun(desk: Desk): number {
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const night of desk.nights) {
    run = prev !== null && night.price === prev ? run + 1 : 1;
    prev = night.price;
    best = Math.max(best, run);
  }
  return best;
}

/**
 * WATCH FOR, restructured.
 *
 * `gate-l1-teacher` TT-B7/TT-B8: flags were flat strings, a stalled desk was
 * invisible (small grey `dialling $24` in a chip identical in weight to
 * `LOCKED $34`), and the reviewer observed the Night-4 flag rendering with an
 * EMPTY desk list from REVEAL onward. That last defect does not reproduce from
 * the reducer at any phase (a four-desk session driven to COMPLETE names the
 * desk correctly in every phase), so rather than guess at a render path, each
 * flag now carries its desks as DATA, is never emitted with an empty list, and
 * the client renders the list from that array instead of parsing a sentence.
 */
export type WatchFlag = {
  id: string;
  /** The thing the teacher should notice. */
  label: string;
  /** Named desks, never empty when the flag is emitted. */
  desks: string[];
  /** What to do with it, in a stranger's words. */
  action: string;
  /** `now` = act on it this minute; `later` = park it for a named phase. */
  urgency: "now" | "later";
};

function teacherWatchFor(state: FullHouseState, phase: CanonicalPhase): WatchFlag[] {
  const out: WatchFlag[] = [];
  const desks = Object.values(state.desks);
  const windowOpen = phase === "PLAY" && state.nightIndex < NIGHT_COUNT;

  if (windowOpen && desks.length > 0) {
    const stalled = desks.filter((d) => !d.locked).map((d) => deskHandle(d));
    if (stalled.length > 0) {
      out.push({
        id: "stalled",
        label: `${stalled.length} of ${desks.length} desks have not locked tonight`,
        desks: stalled,
        action: "Ring the bell when you are ready — an unlocked desk settles at its own season-plan price and is marked AUTO on its own screen. Nobody is skipped and nobody gets a zero.",
        urgency: "now",
      });
    }
  }
  // TT-R1's neighbour, and the beat the whole lesson turns on: on Night 5 the
  // useful thing to watch is who is setting up a CLEAN repeat — same price as
  // their own Night 1 — because those are the desks the COUNTERFACTUAL board
  // and the NIGHT 5 WAS NIGHT 1 card can quote without a price confound.
  if (windowOpen && state.nightIndex === NIGHT_COUNT - 1) {
    const repeating = desks
      .filter((d) => !d.locked && d.nights.find((n) => n.cardId === "N1")?.price === d.price)
      .map((d) => deskHandle(d));
    const repeated = desks
      .filter((d) => d.locked && d.nights.find((n) => n.cardId === "N1")?.price === d.price)
      .map((d) => deskHandle(d));
    const clean = [...repeated, ...repeating];
    if (clean.length > 0) {
      out.push({
        id: "repeat-price",
        label: `${clean.length} desk${clean.length === 1 ? " is" : "s are"} sitting on their own Night 1 price`,
        desks: clean,
        action: "Say nothing to them. These are the desks the Night 1 vs Night 5 board can quote with no price confound — the crowd changed and the price did not.",
        urgency: "now",
      });
    }
  }
  const flat = desks.filter((d) => sameRun(d) >= 3).map((d) => deskHandle(d));
  if (flat.length > 0) {
    // TT-R5: this said "when you reach the ADAPT questions" in every phase,
    // including COMPLETE, long after that moment had passed.
    const adaptDone = phase === "COUNTERFACTUAL" || phase === "SYNTHESIS" || phase === "COMPLETE";
    out.push({
      id: "held-price",
      label: "Held the same price 3+ nights",
      desks: flat,
      action: adaptDone
        ? "Already used, if you called on them at ADAPT. Their season line is the one the COUNTERFACTUAL card's \"same price every night\" row is about."
        : phase === "ADAPT"
          ? "Call on this desk NOW — a desk that never moved the dial is the clearest contrast in the room."
          : "Call on this desk when you reach the ADAPT questions — a desk that never moved the dial is the clearest contrast in the room.",
      urgency: phase === "ADAPT" ? "now" : "later",
    });
  }
  const soldOut = desks.filter((d) => d.nights.some((n) => n.settlement.turnedAway > 500)).map((d) => deskHandle(d));
  if (soldOut.length > 0) {
    out.push({
      id: "turned-away",
      label: "Turned away 500+ fans on some night",
      desks: soldOut,
      action: "Ask what on the card should have told them, before you say anything about the answer.",
      urgency: "later",
    });
  }
  const debt = desks.filter((d) => d.cash < 0).map((d) => deskHandle(d));
  if (debt.length > 0) {
    out.push({
      id: "debt",
      label: "In the red — their night-spend dial is locked at $0 until the books clear",
      desks: debt,
      action: "This is recoverable and usually recovers on its own; one good night clears it. Say so if the pair looks sunk.",
      urgency: "now",
    });
  }
  const bowl = desks.filter((d) => d.nights.some((n) => n.openBowl)).map((d) => deskHandle(d));
  if (bowl.length > 0) {
    // TT-R5: "Keep this for the Night 4 reveal" was still on screen at COMPLETE,
    // two phases after that reveal had played.
    const revealDone = state.revealStage >= 4 || phase === "ADAPT" || phase === "COUNTERFACTUAL" || phase === "SYNTHESIS" || phase === "COMPLETE";
    out.push({
      id: "bowl",
      label: "Paid to open more of the building on Night 4",
      desks: bowl,
      action: revealDone
        ? "Already named on the projector at reveal stage 4. If it comes back up: opening seats never beat pricing the night right — it only ever refunds part of a price that was already too low."
        : "Keep this for the Night 4 reveal. Opening seats never beat pricing the night right — it only ever refunds part of a price that was already too low.",
      urgency: "later",
    });
  }
  return out.filter((f) => f.desks.length > 0);
}

/**
 * The live-direction script — `gate-l1-teacher` TT-B1 (BLOCKING, HK-1).
 *
 * The design carried a complete NOW / ASK / DON'T EXPLAIN YET / TRIGGER /
 * TIME CUT director's script with per-phase minute budgets
 * (`docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md`, "TEACHER FLOW (for a
 * teacher who has never seen this)"). Exactly one fragment of it had reached
 * the product. This is the port.
 *
 * It is intelligence, not a teleprompter. NOW says what should be happening;
 * ASK carries the question for this beat and, where the room can stall, the
 * answer the teacher needs to have; DON'T EXPLAIN YET names what to withhold;
 * TRIGGER is computed from live state; TIME CUT says what to drop.
 */
export type DirectorPanel = {
  phase: CanonicalPhase;
  minuteBudget: string;
  now: string[];
  ask: { q: string; answer: string | null }[];
  dontExplainYet: string[];
  /** Computed from live state — null when nothing is due. */
  trigger: string | null;
  timeCut: string;
};

/**
 * `ON THE PROJECTOR RIGHT NOW`, alive in every phase — TT-B3.
 *
 * It used to exist only while a night card was open, so it vanished for
 * REVEAL, ADAPT, COUNTERFACTUAL and SYNTHESIS: the four phases where the
 * projector IS the lesson and the teacher is narrating it with their back to
 * the room.
 */
function projectorMirror(state: FullHouseState, phase: CanonicalPhase): { title: string; lines: string[] } {
  const card = openCard(state);
  switch (phase) {
    case "LOBBY":
      return {
        title: "Desks joining",
        lines: ["\"You are not the GM today. You run the building.\"", "Both clubs, both buildings and both seat counts are up, with each desk's assignment as it lands."],
      };
    case "HOOK":
      return {
        title: "The brief",
        lines: [
          "Both markets, the two books in plain words, and all five night cards with day, visiting role, Draw and TV listing.",
          "Also up: the modelling caveats and the money-scale line.",
        ],
      };
    case "PLAY":
      if (!card) {
        return {
          title: "Five nights, in the books — the picture is being held",
          lines: ["The room has NOT seen the class chart yet. It goes up one night at a time in REVEAL."],
        };
      }
      return {
        title: `${card.label} — tonight's card`,
        lines: [
          `${card.day} vs ${card.visitor} · Draw ${card.draw}/100 · ${card.tv} TV${card.bowlOffer ? " · capacity option offered" : ""}`,
          ...card.notes,
          `Desks locked in: ${Object.values(state.desks).filter((d) => d.locked).length} of ${Object.keys(state.desks).length}. Nothing about tonight's crowd is on the projector until you ring the bell.`,
          ...(state.nightIndex > 0 ? [`Class marks up for: ${CARDS.slice(0, state.nightIndex).map((c) => c.id).join(", ")}.`] : []),
          ...(state.twoPeaksReleased ? ["The Two Peaks money view is up."] : []),
        ],
      };
    case "REVEAL": {
      const current = REVEAL_STAGES[state.revealStage - 1] ?? null;
      return {
        title: current ? `Stage ${current.stage} of ${REVEAL_STEPS} — ${current.name}` : "Waiting for the first press",
        lines: current
          ? [
              current.headline,
              ...(state.revealStage <= NIGHT_COUNT ? [`Marks up for: ${CARDS.slice(0, state.revealStage).map((c) => c.id).join(", ")}.`] : []),
              ...(state.revealStage >= NIGHT_COUNT ? ["The room's total turned-away count is up."] : []),
              // `gate-l1-play` recheck2 `play-l1-repairs-below-fold`: the board
              // only carries the rule ON its own stage (boardView sets
              // `renewalsRule` at `=== RENEWALS_REVEAL_STAGE`), so `>=` told the
              // teacher it was up through stages 6 and 7 when it was not.
              ...(state.revealStage === RENEWALS_REVEAL_STAGE
                ? ["The renewals rule is on the screen in full, directly under the headline and above the chart."]
                : []),
              ...(state.revealStage >= NIGHT_COUNT + 1 ? ["The Two Peaks money view is up."] : []),
              ...(state.revealStage >= REVEAL_STEPS ? ["The per-market season books are up."] : []),
            ]
          : ["An empty chart frame and \"Waiting for your teacher to put up the first night.\""],
      };
    }
    case "ADAPT":
      return {
        title: "The class chart and the three questions",
        lines: [
          "Every desk-night as one mark: colour = building, shape = night, no joining line, key on the chart.",
          ...ADAPT_QUESTIONS,
        ],
      };
    case "COUNTERFACTUAL":
      return {
        title: "Night 1 against Night 5, desk by desk",
        lines: [
          "Each desk's two crowds on the same card, its renewals either side, and the class chart underneath for the argument.",
          `Prompt on screen: "${ARGUE_PROMPT}"`,
          "This board names desks publicly, worst line included.",
        ],
      };
    case "SYNTHESIS":
      return {
        title: "WHAT ECONOMICS DID WE JUST USE?",
        lines: [
          "Six cards, every number computed from this class's own nights: REVENUE = PRICE x PEOPLE · THE CARD MOVED THE CROWD · THE TICKET IS NOT THE PRODUCT · NIGHT 5 WAS NIGHT 1 · TWO BOOKS, NO EXCHANGE RATE · YOUR JOB IS REAL.",
          "Then the outside-sports row, then the dated sources.",
        ],
      };
    case "COMPLETE":
      return { title: "Closing card", lines: [COMPLETE_COPY] };
    default:
      return { title: "", lines: [] };
  }
}

/** What the STUDENT screen is offering right now — a surface the teacher never sees (HK-5, TT-B9). */
function studentScreenMechanics(state: FullHouseState): string[] {
  const card = openCard(state);
  const lines = MARKETS.map(
    (m) =>
      `${m.club}: season plan $${m.planPrice} a seat · building bill $${m.bill.toLocaleString()} a night · ${m.capacity.toLocaleString()} seats · event dial $0-$${m.eventMax.toLocaleString()} (about $${Math.round(
        1 / m.eventFans,
      ).toLocaleString()} per extra person NEXT night, and about +${Math.round((m.eventMax / m.eventRenewalDollars) * 10) / 10} renewal points at the top of the dial).`,
  );
  lines.push(
    "Both desks price blind: no preview of any kind exists on the student screen. They see tonight's card, tomorrow's card, the five-night slate and their own history.",
  );
  if (card?.bowlOffer) {
    lines.push(
      `Tonight only, the student screen also offers the capacity option: ${MARKETS.map(
        (m) => `${m.club} +${m.bowlSeats.toLocaleString()} seats for $${m.bowlCost.toLocaleString()}`,
      ).join(" · ")}, paid whether they fill or not. It is a deliberate trap: it never beats pricing the night right.`,
    );
  }
  lines.push(
    "A desk in the red has its event dial locked at $0 with the reason printed. It is recoverable — one good night clears it.",
  );
  return lines;
}

export function teacherDirector(state: FullHouseState, phase: CanonicalPhase): DirectorPanel {
  const nightNumber = Math.min(state.nightIndex + 1, NIGHT_COUNT);
  const deskCount = Object.keys(state.desks).length;
  const lockedCount = Object.values(state.desks).filter((d) => d.locked).length;
  const twoPeaksDue = state.nightIndex >= 3 && !state.twoPeaksReleased;
  const timeCut =
    "Past minute 45? Drop the Night 4 capacity-option discussion and go straight to the Night 1 vs Night 5 chart. It carries the lesson on its own.";

  switch (phase) {
    case "LOBBY":
      return {
        phase,
        minuteBudget: "2 min",
        now: [
          "Pairs join at /play on one device. Markets are handed out by desk number — odd desks run New York, even desks run Memphis — and the board shows the assignment as it happens.",
          "Read the board line out loud: \"You are not the GM today. You run the building.\"",
          `${deskCount} desk${deskCount === 1 ? "" : "s"} in so far.`,
        ],
        ask: [{ q: "Who has ever bought a ticket to anything? Who decided what it cost?", answer: null }],
        dontExplainYet: ["Do not explain the two books yet — the board does it in HOOK.", "Say nothing about price yet."],
        trigger: deskCount === 0 ? "Nobody has joined yet. The join URL and code are at the top of this console." : null,
        timeCut,
      };

    case "HOOK":
      return {
        phase,
        minuteBudget: "3 min",
        now: [
          "Read Night 1's card off the board out loud: Tuesday, a club that has lost four straight, Draw 22, no TV.",
          "Take three numbers from the room and write them on the board. DO NOT evaluate them — no \"good\", no \"that's high\". You are collecting, not marking.",
          "Then say the two books once, in the board's own words, and move on.",
        ],
        ask: [
          { q: "Tuesday. The visiting team has lost four in a row. What is a seat worth?", answer: null },
          { q: "Why that number and not double it?", answer: null },
        ],
        dontExplainYet: [
          "The words DEMAND, REVENUE and ELASTICITY. None of them are said in the first 30 minutes — the room earns them at SYNTHESIS.",
          "Do not tell them the crowd shrinks when the price goes up. They find that in their own numbers at the first reveal.",
        ],
        trigger: null,
        timeCut,
      };

    case "PLAY": {
      const done = state.nightIndex >= NIGHT_COUNT;
      // `gate-l1-teacher` recheck2 TT-R1 (BLOCKING): this used to be one
      // `nightIndex >= 3` block covering Nights 4 AND 5, so on Night 5 the
      // console told a stranger to read NIGHT 4's card ("demand is going to run
      // past what this building holds") and to watch for capacity purchases —
      // on a Draw-22 Tuesday with no capacity option, directly contradicting
      // the `ON THE PROJECTOR RIGHT NOW` block beside it. Each of the three
      // blocks is now its own night range.
      const isNight4 = state.nightIndex === 3;
      const isNight5 = state.nightIndex === NIGHT_COUNT - 1;
      return {
        phase,
        minuteBudget: done ? "wrap up — move to REVEAL" : isNight5 ? "Night 5: 4 min" : isNight4 ? "Night 4: 4 min" : "Nights 1-3: 11 min",
        now: done
          ? [
              "All five nights are in the books. The projector is holding — the room has NOT seen the class picture yet.",
              "Advance to REVEAL and put it up one night at a time.",
            ]
          : isNight4
            ? [
                `Night ${nightNumber} of ${NIGHT_COUNT}. Read Night 4's card slowly — the room should feel it. "The biggest night of the five. Demand is going to run past what this building holds."`,
                "Watch who raises the price and who pays to open more of the building. Do not tell them which is right.",
                `${lockedCount}/${deskCount} desks locked in.`,
              ]
            : isNight5
              ? [
                  `Night ${nightNumber} of ${NIGHT_COUNT} — the payoff night. Read it as a repeat, not as a new card: "Same day, same visiting club, same TV as Night 1. Nothing on this card has changed."`,
                  "There is no capacity option tonight and nothing is going to run out. The only thing that has changed since Night 1 is them.",
                  "Say ONE sentence and stop: \"If you charge exactly what you charged on Night 1, will the same number of people walk in?\" Do not answer it — the reveal does.",
                  `${lockedCount}/${deskCount} desks locked in.`,
                ]
              : [
                  `Night ${nightNumber} of ${NIGHT_COUNT}. Read tonight's card off the board, then get out of the way. Pairs price blind — there is no preview on their screen and there is not supposed to be.`,
                  "Ring the bell yourself when the room is ready. Every desk settles at the same moment.",
                  `${lockedCount}/${deskCount} desks locked in.`,
                ],
        // TT-R5: the wrap-up ASK used to keep asking about "tonight's card"
        // after the fifth bell, when there is no tonight.
        ask: done
          ? [
              { q: "Before we look: whose Night 5 crowd was NOT the same as their Night 1 crowd?", answer: "Hold the answer. Reveal stage 5 puts both numbers on the projector and the room can read it off its own desks." },
              { q: "Which night do you already know you got wrong?", answer: null },
            ]
          : [
              {
                q: isNight5 ? "Night 1's card is back. What is different about your building tonight?" : "What on tonight's card is different from last night's?",
                answer: isNight5
                  ? "Nothing on the card. What changed is their own renewals — and, for anyone who spent on Night 4, last night's event money. Do not say either out loud yet; both are named at the reveal."
                  : null,
              },
              { q: "(after the bell) Who is surprised? Say the number you expected first.", answer: null },
            ],
        dontExplainYet: [
          "Still no DEMAND, REVENUE or ELASTICITY.",
          "Do not tell the room that the cheap ticket can make more money. That is the Two Peaks reveal and it is worth more if they get there first.",
        ],
        trigger: twoPeaksDue
          ? "TRIGGER: Night 3 is played — the Two Peaks release is live. Best moment is right after the Night 3 bell, or hold it until after Night 4 if you want the biggest decision of the lesson to stay blind. Your call; the button waits."
          : state.nightIndex < 3
            ? "The Two Peaks release unlocks after the Night 3 bell."
            : null,
        timeCut,
      };
    }

    case "REVEAL":
      return {
        phase,
        minuteBudget: "REVEAL + COUNTERFACTUAL: 6 min",
        now: [
          "Seven presses, one beat each. The next one is named on the button — read it before you press it.",
          "Between presses, say one sentence and stop. The line for each stage is under the button.",
          "Let the room look. Silence here is working time, not dead air.",
        ],
        ask: [{ q: "Same night, same visitor. Why did more people come the second time?", answer: "Their own renewals. Desks that kept their season-ticket holders walked into Night 5 with a bigger base than they had on Night 1 — same card, different building underneath it." }],
        dontExplainYet: ["Hold the words until SYNTHESIS. Name the thing, not the term."],
        trigger:
          state.revealStage < REVEAL_STEPS
            ? `Next press: ${REVEAL_STAGES[state.revealStage]?.name ?? "the next stage"} (${state.revealStage + 1} of ${REVEAL_STEPS}).`
            : "Every stage has played. Move on to ADAPT.",
        timeCut,
      };

    case "ADAPT":
      return {
        phase,
        minuteBudget: "4 min",
        now: [
          "Ask the three questions IN THIS ORDER. Take answers from desks, not from yourself.",
          "The chart is on the projector. Point at it; make them point at it.",
        ],
        ask: [
          {
            q: ADAPT_QUESTIONS[0]!,
            answer:
              "Saturday's card (Night 2) had a better visiting club and a day people can come out on, so the same price drew a bigger crowd and the best price sat higher. The day, the Draw and the TV listing were all printed before anyone locked.",
          },
          {
            q: ADAPT_QUESTIONS[1]!,
            answer:
              "Yes — that is the Two Peaks. Every person who comes also spends inside the building, so a cheaper ticket that brings more people can beat a dearer ticket that brings fewer. The ticket is not the only thing you sell.",
          },
          {
            q: ADAPT_QUESTIONS[2]!,
            answer:
              "Renewals. Four nights of their own pricing moved their season-ticket base, and that base is who shows up. Price well under your own plan price and the plan looks like a waste; price above what the night is worth to a plan holder and they quit.",
          },
        ],
        dontExplainYet: [
          "You can now say DEMAND if the room gets there. Still hold ELASTICITY.",
          "If the room stalls, re-ask smaller: \"Point at two dots the same colour and the same shape. Which one charged more? Which one drew more?\"",
        ],
        trigger: null,
        timeCut,
      };

    case "COUNTERFACTUAL":
      return {
        phase,
        minuteBudget: "inside the 6 min with REVEAL",
        now: [
          "Every desk is looking at its own season next to two other lines: never moving the dial, and the most cash the model could find.",
          "Expect a student to say \"so doing nothing was better\". That is the whole lesson arriving early — take it seriously and put it to the room.",
          "This board ranks desks in public, including the worst one. Frame it before you show it: this is a room full of people who priced blind, and the interesting desks are the surprising ones, not the winning ones.",
        ],
        ask: [
          {
            q: "Doing nothing kept the most season-ticket holders. Was doing nothing better?",
            answer:
              "It depends which book you are being paid on, and nothing in the game converts one into the other. The most-cash line makes far more money and ends with far fewer renewals. Both are real answers; that is what \"no exchange rate\" means.",
          },
          {
            q: ARGUE_PROMPT,
            answer:
              "Steer them to Night 1 or Night 3, where the crowd moves hard against the price. Night 4 is the trap: the building is full at several prices, so the higher price can also be the bigger money there.",
          },
        ],
        dontExplainYet: ["Do not resolve the argument for them yet — SYNTHESIS is one screen away."],
        trigger: null,
        timeCut,
      };

    case "SYNTHESIS":
      return {
        phase,
        minuteBudget: "7 min",
        now: [
          "This is the part the simulation does not do for you. Name each thing they already felt, in order, off the board's own cards.",
          "Every card on that board is computed from THIS class's numbers — you can point at any figure and it belongs to somebody in the room.",
        ],
        ask: [
          {
            q: "If revenue is price times people, why did the cheaper ticket make more money?",
            answer:
              "Because \"people\" moves when price moves, and because the ticket is not the only thing they buy. Revenue is still price x people; the point is that you cannot raise one without moving the other.",
          },
          {
            q: "Why is Memphis's median renewals different from New York's?",
            answer:
              "It is not the market — it is the plan price. Renewals answer to how far tonight's price sits from your own season-plan price, and the two buildings sell different plans ($24 vs $16). Two desks pricing \"the same\" are not doing the same thing.",
          },
          { q: EXIT_PROMPT, answer: "No single right answer. You want the card named, not the night." },
        ],
        dontExplainYet: ["Nothing. This is the beat where every term gets said out loud."],
        trigger: null,
        timeCut: "Past minute 55? Say REVENUE = PRICE x PEOPLE, say the Two Peaks card, and stop. Those two are the lesson.",
      };

    case "COMPLETE":
      return {
        phase,
        minuteBudget: "1 min",
        now: ["Read the closing line off the board and tell them what the next lesson does to their building."],
        ask: [{ q: EXIT_PROMPT, answer: null }],
        dontExplainYet: [],
        trigger: null,
        timeCut,
      };

    default:
      return { phase, minuteBudget: "", now: [], ask: [], dontExplainYet: [], trigger: null, timeCut };
  }
}

function repeatSummary(rows: readonly RepeatRow[]): string {
  const same = rows.filter((r) => r.samePrice);
  if (same.length === 0) {
    return rows.length === 0
      ? "No desk has played both Night 1 and Night 5 yet."
      : `${rows.length} desk${rows.length === 1 ? "" : "s"} played the same card twice. Nobody charged the same price both times — so compare the crowds against the renewals each desk carried in.`;
  }
  const up = same.filter((r) => r.n5Turnout > r.n1Turnout).length;
  const down = same.filter((r) => r.n5Turnout < r.n1Turnout).length;
  return `${same.length} desk${same.length === 1 ? "" : "s"} charged the SAME price on Night 1 and Night 5. ${up} drew a bigger crowd the second time, ${down} drew a smaller one. Same day, same visitor, same price — the only thing that changed was five nights of their own choices.`;
}

/* ------------------------------------------------------------ synthesis -- */

export type SynthesisCard = { id: string; title: string; body: string };

/**
 * Every card is computed from THIS class's locked-at-time numbers (D15) —
 * never scripted, never recomputed against a curve the room did not play.
 */
export function synthesisCards(state: FullHouseState, agg: FullHouseAggregate): SynthesisCard[] {
  const cards: SynthesisCard[] = [];
  if (agg.curves.length === 0) {
    return [
      {
        id: "revenue",
        title: "REVENUE = PRICE × PEOPLE",
        body: "No nights are in the books yet. Once the room plays, this card fills in with the class's own numbers.",
      },
    ];
  }

  cards.push({ id: "revenue", title: "REVENUE = PRICE × PEOPLE", body: revenueCardBody(agg) });

  // Demand shifters: the same market, two cards, two different best prices —
  // read off the room's own curve, not asserted.
  const shifterBody = shifterCardBody(agg);
  cards.push({ id: "shifters", title: "THE CARD MOVED THE CROWD", body: shifterBody });

  const peak = agg.twoPeaks[0] ?? null;
  cards.push({
    id: "loss-leader",
    title: "THE TICKET IS NOT THE PRODUCT",
    body: peak
      ? `On Night 3 in ${MARKET_BY_ID.get(peak.marketId)?.club ?? peak.marketId}, tickets alone made the most money at $${peak.ticketPeakPrice}. Add what those same people spent inside the building and the best price drops to $${peak.totalPeakPrice} — $${peak.gapDollars} lower, ${peak.gapSteps} clicks of the dial. The cheaper ticket made more money, because a cheaper ticket brings more people and every one of them buys something. Stores call that a loss leader.`
      : "Night 3 was not played, so the room cannot draw its own two peaks. The idea still holds: what people spend inside the building is money the ticket price does not collect.",
  });

  const repeat = agg.repeatCard;
  const same = repeat.filter((r) => r.samePrice);
  cards.push({
    id: "path-dependence",
    title: "NIGHT 5 WAS NIGHT 1",
    body:
      same.length > 0
        ? `${same.length} desk${same.length === 1 ? "" : "s"} charged the same price on both. ${same
            .slice(0, 3)
            .map((r) => `${r.deskHandle}: ${r.n1Turnout.toLocaleString()} then ${r.n5Turnout.toLocaleString()}`)
            .join(" · ")}. Same day, same visiting club, same price — and a different crowd walked in, because four nights of your own choices had already moved your renewals. ${RENEWALS_RULE_BOARD}`
        : `${repeat.length} desk${repeat.length === 1 ? "" : "s"} played that card twice and every one of them changed the price, so compare crowds against the renewals column: the desks that carried more season-ticket holders into Night 5 started from a bigger base than they had on Night 1. ${RENEWALS_RULE_BOARD}`,
  });

  // gate-l1-econ-r1 R1/R2: the season claim on this card is now READ OFF the two
  // season lines the COUNTERFACTUAL card printed, in the same market, rather than
  // asserted. At the shipped constants the most-cash line ends 26-27 renewal
  // points below the never-move-the-dial line in both markets, so the tradeoff
  // the card names is one the room's own evidence shows — and if a retune ever
  // collapses it again, this sentence changes with it instead of going false.
  const bestFill = agg.books.map((b) => `${b.club} ${b.bestFillPct}%`).join(" · ");
  const seasonTradeoff = ((): string => {
    const market = MARKETS[0]!;
    const flat = replayPlan(market, { prices: CARDS.map(() => market.planPrice), spends: CARDS.map(() => 0) });
    const strong = bestFoundSeason(market);
    const gap = flat.renewals - strong.renewals;
    if (gap <= 0) {
      return "On this model, over five nights, the two books did not pull against each other as hard as they do night by night — the choice is sharpest inside one night.";
    }
    return `Over the whole five nights at the ${market.club}: the most cash we could find was $${strong.cash.toLocaleString()} and ended at ${strong.renewals}% renewals; never touching the dial made $${flat.cash.toLocaleString()} and ended at ${flat.renewals}%. More money, fewer season-ticket holders. There is no rate that turns one into the other.`;
  })();
  cards.push({
    id: "two-books",
    title: "TWO BOOKS, NO EXCHANGE RATE",
    body: `Best full house each market managed: ${bestFill}. Median renewals: ${agg.books
      .map((b) => `${b.club} ${b.medianRenewals}%`)
      .join(" · ")}. You cannot add a dollar to a renewal, and no price is best on both. ${seasonTradeoff}`,
  });

  cards.push({
    id: "real-world",
    title: "YOUR JOB IS REAL",
    body: DYNAMIC_PRICING_COPY,
  });

  return cards;
}

/**
 * gate-l1-econ B5 (BLOCKING): the old card took the minimum and maximum price
 * across every desk-night in the room with no filter on market or card, and
 * printed "$12 (16,080 came) ... $90 (16,980 came)" — a Memphis Night 1 beside
 * a New York Night 4, with the HIGHER price drawing the BIGGER crowd, on the
 * one board surface whose job is formalising demand. Every quoted pair now
 * comes from one market on one night, and the group is chosen so the two
 * turnouts move against the two prices.
 */
function revenueCardBody(agg: FullHouseAggregate): string {
  type Group = { marketId: MarketId; cardId: string; points: CurvePoint[] };
  const groups: Group[] = [];
  for (const point of agg.curves) {
    const found = groups.find((g) => g.marketId === point.marketId && g.cardId === point.cardId);
    if (found) found.points.push(point);
    else groups.push({ marketId: point.marketId, cardId: point.cardId, points: [point] });
  }
  const usable = groups
    .map((g) => {
      const low = g.points.reduce((a, b) => (b.price < a.price ? b : a));
      const high = g.points.reduce((a, b) => (b.price > a.price ? b : a));
      return { ...g, low, high, spread: high.price - low.price };
    })
    .filter((g) => g.spread > 0 && g.high.turnout < g.low.turnout)
    .sort((a, b) => b.spread - a.spread);
  const club = (id: MarketId): string => MARKET_BY_ID.get(id)?.club ?? id;
  const best = usable[0];
  if (!best) {
    return `Every desk-night in this room is a price multiplied by a crowd — that product is the money, and neither number is the money on its own. Tonight the room did not give us two desks in the same building charging different prices on the same night, so there is no honest pair to quote: compare dots of the same colour and the same shape on the board, never two different nights.`;
  }
  const label = CARD_BY_ID.get(best.cardId)?.label ?? best.cardId;
  return `${label}, ${club(best.marketId)} — the same night in the same building. One desk charged $${best.low.price} and ${best.low.turnout.toLocaleString()} came. Another charged $${best.high.price} and ${best.high.turnout.toLocaleString()} came. Higher price, smaller crowd: that is a demand curve, and it is only readable one night at a time. Neither number alone is the money — the money is the two of them multiplied, which is why the biggest crowd and the biggest night are almost never the same night.`;
}

function shifterCardBody(agg: FullHouseAggregate): string {
  // Highest-turnout point on each of two cards in the same market — the room's own evidence
  // that the same price does not mean the same crowd.
  for (const market of MARKETS) {
    const n1 = agg.curves.filter((p) => p.marketId === market.id && p.cardId === "N1");
    const n2 = agg.curves.filter((p) => p.marketId === market.id && p.cardId === "N2");
    if (n1.length === 0 || n2.length === 0) continue;
    const pair = n1.flatMap((a) => n2.filter((b) => b.price === a.price).map((b) => ({ a, b })))[0];
    if (pair) {
      return `${market.club}: somebody charged $${pair.a.price} on the quiet Tuesday and drew ${pair.a.turnout.toLocaleString()}. Somebody charged the same $${pair.a.price} on Saturday against a better visiting club and drew ${pair.b.turnout.toLocaleString()}. Same price, different crowd. The day, the visiting club's Draw and the TV listing were all printed on the card before anyone locked.`;
    }
    // gate-l1-econ N5 (unrepaired at the recheck): this fallback used to quote two
    // DIFFERENT prices and then close with "nothing else moved the crowd", which
    // reads as evidence that the card alone moved it when the price moved too.
    // No desk in this room charged the same price on both cards, so the honest
    // move is to say the comparison is not clean and name the second cause.
    const bestN1 = n1.reduce((a, b) => (b.turnout > a.turnout ? b : a));
    const bestN2 = n2.reduce((a, b) => (b.turnout > a.turnout ? b : a));
    return `${market.club}: the best Tuesday crowd in this room was ${bestN1.turnout.toLocaleString()} at $${bestN1.price}; the best Saturday crowd was ${bestN2.turnout.toLocaleString()} at $${bestN2.price}. Those are two different prices, so this pair does not prove it on its own — part of that gap is the price. What the card can tell you is on the board: find two desks in the SAME building charging the SAME price on the two nights, and whatever is left over is the day, the Draw and the TV listing.`;
  }
  return "The day, the visiting club's Draw and the TV listing were printed on every card before anyone locked. Nothing else moved the crowd — there is no luck in this model.";
}
