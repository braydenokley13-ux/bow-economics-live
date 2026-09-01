/**
 * MODULE 2 · LESSON 3 — "WRITING THE RULE"
 * =========================================
 *
 * The module finale. The room writes a revenue-sharing rule on two dials, votes
 * it in at two-thirds, and then plays a season UNDER the rule it wrote.
 *
 * Spec: docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md (L3), binding build
 * charter BC-1/BC-3/BC-6/BC-7 in ARCHITECTURE_SELECTION.md.
 *
 * ---------------------------------------------------------------------------
 * BC-1 — THE SIGNATURE INSTRUMENT, AND WHY IT IS NOT A PRICE DROP
 * ---------------------------------------------------------------------------
 * `l3-arith-harness` (exit 1) refuted the naive shared claim that a sharing rule
 * makes every seat's ticket price fall. The arithmetic it published is the
 * arithmetic this module is built on rather than against:
 *
 *   With linear demand q = B - k·p, per-fan untaxed in-arena spend `a`, and a
 *   rule taxing GATE + LOCAL MEDIA at rate s (in-arena untaxed), the own-take
 *   maximiser is
 *        p*(s) = B/(2k) - a / (2(1-s))
 *   so the price move is  a·s / (2(1-s))  — driven ENTIRELY by the untaxed
 *   stream. Tax everything uniformly and the argmax does not move at all
 *   (scaling a function by a positive constant does not move its maximiser).
 *   And under a BINDING CAPACITY CLAMP the move is exactly ZERO: the optimum
 *   sits at the price that fills the building, which the tax does not touch.
 *
 * This module ships both halves on purpose:
 *   - the two SMALL-market profiles are unclamped at their optimum, so their
 *     best price MOVES with the adopted share (`bestPriceUnder`), and
 *   - the two BIG-market profiles are capacity-bound at their optimum, so their
 *     best price does NOT move — the flat arrow beside the moving one, and
 *     "why didn't New York move?" is a question the room can answer from the
 *     numbers ("you cannot discount a seat you do not have").
 *
 * The SIGNATURE instrument is neither of those. It is the DIFFERENTIAL REINVEST
 * RESPONSE. A club keeps a fraction
 *        kappa(s) = 1 - s·(N-1)/N
 * of every extra dollar of local revenue it creates (it pays s into the pot and
 * gets 1/N of the pot back). Draw is bought with square-root returns, so the
 * cash-optimal reinvest spend solves
 *        d/dx [ kappa · V · G · sqrt(x/E) - x ] = 0   =>   x* = (kappa·V·G)^2 / (4E)
 * i.e. **r* is proportional to kappa(s)^2** — the (1-s)^2 form the charter names.
 * The lesson never states that algebra; it prints the room's own two numbers and
 * the harness verifies the response moves at least two dial steps across the
 * adopted shares. Nothing in this module computes r* from the closed form: every
 * printed optimum is brute-forced over the shipped dial through the shipped
 * settlement, so the copy cannot drift from the model.
 *
 * ---------------------------------------------------------------------------
 * BC-6 — THE FOUR NAMED STAGE-0 FIXES
 * ---------------------------------------------------------------------------
 *  1. The CONDITION control is a REAL adopted decision with teeth: with it on, a
 *     club reinvesting under 15% collects half its share and the forfeited half
 *     is redistributed to the clubs that did comply. It changes the cash-optimal
 *     reinvest at high shares (verified by the harness), so it is the room's own
 *     tool against the moral hazard it is about to discover.
 *  2. The voter's club identity is on the proposal screen, before round 1.
 *  3. Every settled week carries a PAID IN / TOOK OUT / NET column, so a gain is
 *     attributable to the transfer or to the club's own dial, from the UI alone.
 *  4. The proposal histogram is withheld until round 1 has closed (anti-herding).
 *
 * ---------------------------------------------------------------------------
 * SEEDING (D9) — decided, with grounds
 * ---------------------------------------------------------------------------
 * This lesson DOES seed from M2 L2 (`m2l2-host-league`), opaquely, per M1's
 * pattern. D9's test is "yesterday's choice creates today's problem", and here it
 * literally does: the inequality the room argues about is the room's own L2
 * inequality (cash, Draw, market), and the module's signature CONSEQUENCE panel
 * is the room's mean reinvest in L2 beside its mean reinvest in L3 — the C7
 * evidence that a rule changed the same students' behaviour. Without the seed
 * that panel has no left-hand bar. An absent, malformed or foreign seed is not an
 * error: the league opens on a stock spread, every panel that needs L2 says so in
 * its own words, and the lesson plays identically.
 *
 * No random source exists anywhere in this file (R7).
 */
import type { LessonAction, LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

/* ------------------------------------------------------------- markets -- */

export type MarketId = "new-york" | "golden-state" | "oklahoma-city" | "memphis";

/**
 * A market profile: printed operating facts plus hidden demand constants.
 * Nothing under HIDDEN is ever serialized to a view.
 *
 * The four profiles are deliberately two-and-two on the property BC-1 turns on:
 * `new-york` and `golden-state` are CAPACITY-BOUND at their own optimum (the
 * building fills before the revenue parabola peaks), `oklahoma-city` and
 * `memphis` are not. That is the moving-arrow / flat-arrow pair, and it is a
 * property of the constants, asserted by the tuning harness rather than assumed.
 */
export type MarketProfile = {
  readonly id: MarketId;
  readonly anchorClub: string;
  /** True of EVERY club on the profile. Club-specific facts live on ClubDef. */
  readonly plainLine: string;
  readonly sizeLabel: string;
  /* ---- printed operating facts ---- */
  readonly bill: number;
  readonly localBase: number;
  readonly ancillary: number;
  /* ---- HIDDEN demand constants ---- */
  readonly base0: number;
  readonly sens: number;
  readonly ownDrawFans: number;
  readonly visitorDrawFans: number;
  /** Dollars of reinvest that buy one unit of effort toward Draw. */
  readonly effortScale: number;
  /** Local media + sponsorship dollars per Draw point per week. */
  readonly drawDollars: number;
  /**
   * What one point of Draw is worth in NEXT season's opening books, for this
   * market. The rule binds two seasons and the room is told so before it votes,
   * so the last week's dial has a real payoff instead of a dominant zero. It is
   * market-scaled because a point of attention is worth more in a bigger market
   * — a single league-wide number would make the small markets' terminal value
   * dwarf their own weekly revenue and flatten their response to the rule.
   */
  readonly terminalDrawDollars: number;
  /** What a league-office club charges. Deterministic, printed, not optimal. */
  readonly housePrice: number;
};

/**
 * Modeled on real market differences — NOT any club's measured demand (R11).
 * Buildings, capacities and market sizes are real; the curves are ours, and the
 * board says so wherever a dollar appears.
 */
export const MARKET_PROFILES: readonly MarketProfile[] = [
  {
    id: "new-york",
    anchorClub: "New York Knicks",
    plainLine:
      "A big-market club with a building that fills. There are more people who want in on a good night than there are seats, so the question here is what a seat is worth — never whether the room fills.",
    sizeLabel: "BIG MARKET",
    bill: 1_600_000,
    localBase: 470_000,
    ancillary: 18,
    base0: 43_000,
    sens: 420,
    ownDrawFans: 120,
    visitorDrawFans: 160,
    effortScale: 1_245_000,
    drawDollars: 22_000,
    terminalDrawDollars: 130_000,
    housePrice: 58,
  },
  {
    id: "golden-state",
    anchorClub: "Golden State Warriors",
    plainLine:
      "A big-market club that owns its building, so the people who come through the door spend more once they are inside than anywhere else in this league. This building fills too.",
    sizeLabel: "BIG MARKET",
    bill: 1_550_000,
    localBase: 430_000,
    ancillary: 22,
    base0: 42_400,
    sens: 415,
    ownDrawFans: 118,
    visitorDrawFans: 156,
    effortScale: 1_023_000,
    drawDollars: 20_000,
    terminalDrawDollars: 110_000,
    housePrice: 56,
  },
  {
    id: "oklahoma-city",
    anchorClub: "Oklahoma City Thunder",
    plainLine:
      "A small-market club: fewer people in the metro area, a smaller bill, and empty seats on a quiet night. A dollar put back into the club goes further here than it does in a big market.",
    sizeLabel: "SMALL MARKET",
    bill: 1_050_000,
    localBase: 60_000,
    ancillary: 12,
    base0: 15_600,
    sens: 150,
    ownDrawFans: 89,
    visitorDrawFans: 118,
    effortScale: 550_000,
    drawDollars: 3_000,
    terminalDrawDollars: 110_000,
    housePrice: 46,
  },
  {
    id: "memphis",
    anchorClub: "Memphis Grizzlies",
    plainLine:
      "A small, lean market. Fewer people, and price matters more here than anywhere else in the league — but a dollar put back into the club buys more Draw than it would in a big market.",
    sizeLabel: "SMALL MARKET",
    bill: 950_000,
    localBase: 40_000,
    ancillary: 12,
    base0: 14_400,
    sens: 145,
    ownDrawFans: 84,
    visitorDrawFans: 112,
    effortScale: 302_000,
    drawDollars: 2_500,
    terminalDrawDollars: 45_000,
    housePrice: 44,
  },
];

const PROFILE_BY_ID: ReadonlyMap<MarketId, MarketProfile> = new Map(MARKET_PROFILES.map((m) => [m.id, m]));

export type ClubDef = {
  readonly name: string;
  readonly short: string;
  readonly building: string;
  readonly capacity: number;
  /** BC-3: the season stamp travels with the seat count wherever it prints. */
  readonly capacityNote: string;
  readonly profileId: MarketId;
  readonly startDraw: number;
  readonly startCash: number;
  /** A dated, checkable fact about THIS club — present only where it is true. */
  readonly identityLine?: string;
};

/**
 * The league, in slot order. Desks claim slots in join order, so slot 0 is
 * Desk 1. Every name, building and capacity is real and dated; every economic
 * constant comes from the four profiles and nothing else.
 *
 * `startDraw` and `startCash` are a modeled opening spread, deliberately NOT
 * ranked by market size — two of the four highest opening Draws are small
 * markets. When an L2 session is linked, both are overwritten by that room's
 * own numbers, which is the whole point of the seed.
 */
export const CLUBS: readonly ClubDef[] = [
  { name: "New York Knicks", short: "New York", building: "Madison Square Garden", capacity: 19_812, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 44, startCash: 2_400_000, identityLine: "The biggest market in American sports, and the league's biggest gate — about $193M in gate receipts in 2024-25, a franchise record and the largest in the NBA." },
  { name: "Memphis Grizzlies", short: "Memphis", building: "FedExForum", capacity: 17_794, capacityNote: "modeled seat count · published figures range 16,667-18,119", profileId: "memphis", startDraw: 62, startCash: 700_000, identityLine: "One of the league's smallest markets. In the leaked 2016-17 league year its local media deal was worth under $10M a year, against about $149M for the Lakers — and it received about $32M in revenue sharing, the most in the league." },
  { name: "Golden State Warriors", short: "Golden State", building: "Chase Center", capacity: 18_064, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 30, startCash: 2_600_000, identityLine: "Paid for Chase Center itself — about $1.4B, privately financed, opened 2019 — and owns it, so it keeps the concert money and the real estate too. $833M of revenue in 2024-25, the highest in the NBA." },
  { name: "Oklahoma City Thunder", short: "Oklahoma City", building: "Paycom Center", capacity: 18_203, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 71, startCash: 900_000, identityLine: "One of the league's smallest markets — and the 2025 champions, 4-3 over Indiana." },
  { name: "Milwaukee Bucks", short: "Milwaukee", building: "Fiserv Forum", capacity: 17_341, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 38, startCash: 620_000, identityLine: "In 2015 Wisconsin approved about $250M of public money toward Fiserv Forum under an explicit relocation threat. The Bucks stayed, and won the 2021 title." },
  { name: "Boston Celtics", short: "Boston", building: "TD Garden", capacity: 19_156, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 55, startCash: 2_100_000, identityLine: "In June 2025, a year after the 2024 title, Boston faced a projected salary-and-tax bill reported north of $500M under the second-apron rules — and traded two starters inside 24 hours." },
  { name: "Indiana Pacers", short: "Indiana", building: "Gainbridge Fieldhouse", capacity: 17_274, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 26, startCash: 540_000 },
  { name: "Los Angeles Lakers", short: "L.A. Lakers", building: "Crypto.com Arena", capacity: 18_997, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 68, startCash: 2_500_000, identityLine: "One of the biggest markets in the league — and it does NOT own its building: AEG owns and operates Crypto.com Arena, and the Lakers are tenants on a lease running to 2041." },
  { name: "Denver Nuggets", short: "Denver", building: "Ball Arena", capacity: 19_520, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 34, startCash: 810_000 },
  { name: "Philadelphia 76ers", short: "Philadelphia", building: "Xfinity Mobile Arena", capacity: 20_478, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 49, startCash: 1_950_000 },
  { name: "New Orleans Pelicans", short: "New Orleans", building: "Smoothie King Center", capacity: 16_867, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 72, startCash: 660_000 },
  { name: "Chicago Bulls", short: "Chicago", building: "United Center", capacity: 20_917, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 28, startCash: 2_050_000 },
  { name: "Sacramento Kings", short: "Sacramento", building: "Golden 1 Center", capacity: 17_608, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 58, startCash: 870_000, identityLine: "On May 15, 2013 the league's owners voted 22-8 to deny a sale that would have moved this club to Seattle. Golden 1 Center opened downtown in 2016." },
  { name: "Toronto Raptors", short: "Toronto", building: "Scotiabank Arena", capacity: 19_800, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 40, startCash: 2_200_000 },
  { name: "Utah Jazz", short: "Utah", building: "Delta Center", capacity: 18_206, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 65, startCash: 840_000 },
  { name: "Miami Heat", short: "Miami", building: "Kaseya Center", capacity: 19_600, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 33, startCash: 2_150_000 },
  { name: "Cleveland Cavaliers", short: "Cleveland", building: "Rocket Arena", capacity: 19_432, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 51, startCash: 700_000, identityLine: "LeBron James left in 2010 and this club's ticket demand and franchise value cratered; his July 2014 return sold out the season-ticket base within hours." },
  { name: "Portland Trail Blazers", short: "Portland", building: "Moda Center", capacity: 19_393, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 36, startCash: 790_000 },
  { name: "Orlando Magic", short: "Orlando", building: "Kia Center", capacity: 18_846, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 60, startCash: 680_000 },
  { name: "Detroit Pistons", short: "Detroit", building: "Little Caesars Arena", capacity: 20_332, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 31, startCash: 1_900_000 },
];

/** The most desks this league can seat. Always leaves at least two league-office clubs. */
export const MAX_DESKS = CLUBS.length - 2;
export const MIN_LEAGUE = 6;

/* --------------------------------------------------------------- dials -- */

export const PRICE_MIN = 10;
export const PRICE_MAX = 120;
export const PRICE_STEP = 2;

/** The REINVEST dial, carried from L2 unchanged so the two lessons compare. */
export const REINVEST_MIN = 0;
export const REINVEST_MAX = 40;
export const REINVEST_STEP = 5;

/** The RULE dial: the share of each club's local revenue that goes to the pot. */
export const SHARE_MIN = 0;
export const SHARE_MAX = 60;
export const SHARE_STEP = 5;

export const ROUND_COUNT = 3;
export const WEEK_COUNT = 3;

/** Two-thirds of desks within +/-10 points of the median adopts the rule. */
export const ADOPT_BAND = 10;
export const ADOPT_NUMERATOR = 2;
export const ADOPT_DENOMINATOR = 3;

/** What holds if the room cannot agree. A legitimate outcome, not a failure state. */
export const STATUS_QUO_SHARE = 5;
export const STATUS_QUO_CONDITION = false;

/** The CONDITION: reinvest at least this much or collect only half your share. */
export const CONDITION_MIN_REINVEST = 15;
export const CONDITION_COLLECT_FRACTION = 0.5;

/**
 * The league office's own rule — the teacher's named fallback if the room cannot
 * write one, or if the period has run short. MODELED on the real NBA's design
 * (a fixed percentage of each club's local revenue into a pool split equally,
 * with a receipt condition attached), not a quotation of it: the real formula's
 * exact rate is not public. Ledgered in SIMPLIFICATIONS.
 */
export const REAL_RULE_SHARE = 30;
export const REAL_RULE_CONDITION = true;

export const DRAW_START = 40;
export const DRAW_MIN = 10;
export const DRAW_MAX = 100;
/** Draw slips this much a week for a club that puts nothing back. */
export const DRAW_DECAY = 5;
/** The most one week of reinvest can buy, before the ceiling term. Same for every market. */
export const DRAW_GAIN_MAX = 30;

/** The national media check. Identical for every club, every week, and NEVER taxed. */
export const NATIONAL = 950_000;

/** The rookie lifts one club's Draw to here for the rest of the season. */
export const ROOKIE_DRAW = 100;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const isValidPrice = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= PRICE_MIN && v <= PRICE_MAX && (v - PRICE_MIN) % PRICE_STEP === 0;

export const isValidReinvest = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= REINVEST_MIN && v <= REINVEST_MAX && v % REINVEST_STEP === 0;

export const isValidShare = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= SHARE_MIN && v <= SHARE_MAX && v % SHARE_STEP === 0;

export const PRICE_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) out.push(p);
  return out;
})();

export const REINVEST_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let r = REINVEST_MIN; r <= REINVEST_MAX; r += REINVEST_STEP) out.push(r);
  return out;
})();

export const SHARE_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let s = SHARE_MIN; s <= SHARE_MAX; s += SHARE_STEP) out.push(s);
  return out;
})();

/* -------------------------------------------------- the hidden economics -- */

export type HomeSettlement = {
  price: number;
  capacity: number;
  wanted: number;
  turnout: number;
  fillPct: number;
  turnedAway: number;
  soldOut: boolean;
  bareFans: number;
  ownFans: number;
  visitorFans: number;
  gate: number;
  inArena: number;
  doorMoney: number;
};

/**
 * One home week. Linear demand, hard capacity clamp, no randomness anywhere.
 *
 * The three fan channels are computed by running the clamped settlement three
 * times, so they sum to `turnout` exactly and stay non-negative under the clamp.
 * At a capacity-bound market they are all absorbed into `bareFans` and
 * `turnedAway` carries the visitor's effect instead — which is the truth about a
 * sold-out building and is printed as such, never papered over.
 */
export function settleHome(
  profile: MarketProfile,
  capacity: number,
  hostDraw: number,
  visitorDraw: number,
  price: number,
): HomeSettlement {
  const wantedAt = (hd: number, vd: number): number =>
    Math.max(
      0,
      Math.round(
        profile.base0 +
          profile.ownDrawFans * (hd - DRAW_START) +
          profile.visitorDrawFans * (vd - DRAW_START) -
          profile.sens * price,
      ),
    );
  const seatAt = (hd: number, vd: number): number => Math.min(capacity, wantedAt(hd, vd));

  const bare = seatAt(DRAW_MIN, DRAW_MIN);
  const withOwn = seatAt(hostDraw, DRAW_MIN);
  const turnout = seatAt(hostDraw, visitorDraw);
  const wanted = wantedAt(hostDraw, visitorDraw);

  return {
    price,
    capacity,
    wanted,
    turnout,
    fillPct: Math.round((turnout / capacity) * 1000) / 10,
    turnedAway: Math.max(0, wanted - turnout),
    soldOut: turnout >= capacity,
    bareFans: bare,
    ownFans: withOwn - bare,
    visitorFans: turnout - withOwn,
    gate: price * turnout,
    inArena: profile.ancillary * turnout,
    doorMoney: (price + profile.ancillary) * turnout,
  };
}

/** Local media + sponsorship, keyed to the Draw the club STARTED the week on (the slow pipe). */
export const localMediaFor = (profile: MarketProfile, drawAtWeekStart: number): number =>
  Math.max(0, Math.round(profile.localBase + profile.drawDollars * (drawAtWeekStart - DRAW_MIN)));

/**
 * What one week of reinvest does to Draw.
 *
 * Square-root returns in money (diminishing, and the exact form that makes the
 * optimal spend proportional to kappa^2 — see the BC-1 note at the top), times a
 * headroom ceiling that is IDENTICAL for every market, so a big market cannot
 * buy a Draw a small market cannot reach. Money is normalised by the club's own
 * `effortScale`, so a dollar goes further in a small market.
 */
export function drawGain(profile: MarketProfile, draw: number, spendDollars: number): number {
  if (spendDollars <= 0) return 0;
  const effort = Math.sqrt(spendDollars / profile.effortScale);
  return DRAW_GAIN_MAX * Math.min(1, effort) * ((DRAW_MAX - draw) / DRAW_MAX);
}

/** Next week's Draw. Decay applies whether or not anything was spent; the floor is hard (R5). */
export const nextDraw = (profile: MarketProfile, draw: number, spendDollars: number): number =>
  clamp(Math.round(draw - DRAW_DECAY + drawGain(profile, draw, spendDollars)), DRAW_MIN, DRAW_MAX);

/* ------------------------------------------------------------ schedule -- */

export const OFFSETS: readonly number[] = [1, 2, 3];

export type Pairing = { host: number; visitor: number };

export function scheduleFor(week: number, leagueSize: number): Pairing[] {
  const offset = OFFSETS[week % OFFSETS.length]! % leagueSize;
  const out: Pairing[] = [];
  for (let i = 0; i < leagueSize; i += 1) out.push({ host: i, visitor: (i + Math.max(1, offset)) % leagueSize });
  return out;
}

export const visitorSlotFor = (slot: number, week: number, leagueSize: number): number =>
  (slot + Math.max(1, OFFSETS[week % OFFSETS.length]! % leagueSize)) % leagueSize;

export const hostSlotFor = (slot: number, week: number, leagueSize: number): number =>
  (slot - Math.max(1, OFFSETS[week % OFFSETS.length]! % leagueSize) + leagueSize * 2) % leagueSize;

/* --------------------------------------------------------------- state -- */

export type RuleProposal = { share: number; condition: boolean };

export type AdoptedRule = {
  share: number;
  condition: boolean;
  /** How it came to be law. */
  how: "voted" | "statusQuo" | "leagueOffice";
  /** Desks inside the band, over live desks, at the moment of adoption. */
  supporting: number;
  liveDesks: number;
  median: number;
  /** The share that finished second — the counterfactual replay uses it. */
  runnerUp: number;
};

export type PotFlow = {
  paidIn: number;
  tookOut: number;
  net: number;
  /** True when the CONDITION docked this club's share this week. */
  docked: boolean;
};

export type SettledWeek = {
  week: number;
  price: number;
  reinvest: number;
  auto: boolean;
  visitorSlot: number;
  visitorDrawAtTip: number;
  hostDrawAtTip: number;
  home: HomeSettlement;
  localMedia: number;
  /** gate + localMedia — the base the rule taxes. In-arena is NOT in here. */
  taxedLocal: number;
  reinvestSpend: number;
  pot: PotFlow;
  bill: number;
  national: number;
  cashDelta: number;
  cashAfter: number;
  drawAfter: number;
  /** What this club's Draw put into the building it visited this week. */
  roadFansGiven: number;
  roadDollarsGiven: number;
};

export type Club = {
  slot: number;
  deskNumber: number;
  seatId: SeatId | null;
  profileId: MarketId;
  draw: number;
  cash: number;
  /** The room's own L2 reinvest mean for this club, when a session was linked. */
  l2Reinvest: number | null;
  l2Cash: number | null;
  hookPick: "pay" | "breakup" | null;
  proposal: RuleProposal | null;
  proposals: (RuleProposal | null)[];
  price: number;
  reinvest: number;
  locked: boolean;
  weeks: SettledWeek[];
  kingsVote: "deny" | "approve" | null;
};

export type WriteRuleStage = "rounds" | "adopted" | "season" | "seasonDone";

export type WriteRuleState = {
  clubs: Club[];
  seatToSlot: Record<string, number>;
  deskCount: number;
  leagueSize: number;
  leagueFrozen: boolean;
  /** Where the league's opening books came from. */
  seeded: boolean;
  seedNote: string;
  /** The room's own L2 mean reinvest, when linked — the left-hand bar. */
  l2MeanReinvest: number | null;
  hookRevealed: boolean;
  stage: WriteRuleStage;
  roundIndex: number;
  closedRounds: { round: number; shares: number[]; conditions: boolean[]; median: number }[];
  adopted: AdoptedRule | null;
  weekIndex: number;
  rookieSlot: number | null;
  revealStage: number;
  counterfactualRun: boolean;
  kingsRevealed: boolean;
  synthPage: number;
  finalePage: number;
};

/* --------------------------------------------------------------- paging -- */

export const SYNTH_CARDS_PER_PAGE = 1;
export const synthPageCount = (cards: number): number => Math.max(1, Math.ceil(cards / SYNTH_CARDS_PER_PAGE));

export const REVEAL_STEPS = 5;

export type RevealStage = { stage: number; name: string; headline: string; say: string };

/* --------------------------------------------------------------- seating -- */

const profileOf = (club: Club): MarketProfile => PROFILE_BY_ID.get(club.profileId)!;
const defOf = (club: Club): ClubDef => CLUBS[club.slot]!;

function makeClub(slot: number): Club {
  const def = CLUBS[slot]!;
  const profile = PROFILE_BY_ID.get(def.profileId)!;
  return {
    slot,
    deskNumber: slot + 1,
    seatId: null,
    profileId: def.profileId,
    draw: def.startDraw,
    cash: def.startCash,
    l2Reinvest: null,
    l2Cash: null,
    hookPick: null,
    proposal: null,
    proposals: [],
    price: profile.housePrice,
    reinvest: 0,
    locked: false,
    weeks: [],
    kingsVote: null,
  };
}

function withLeagueSize(state: WriteRuleState, size: number): WriteRuleState {
  if (size <= state.clubs.length) return { ...state, leagueSize: size };
  const clubs = state.clubs.slice();
  for (let i = clubs.length; i < size; i += 1) clubs.push(makeClub(i));
  return { ...state, clubs, leagueSize: size };
}

function seatDesk(state: WriteRuleState, seatId: SeatId): ReduceResult<WriteRuleState> {
  if (state.seatToSlot[seatId] !== undefined) return { ok: true, state };
  const slot = state.deskCount;
  if (slot >= MAX_DESKS) return { ok: false, reason: `this league seats ${MAX_DESKS} desks` };
  let next = state;
  if (!state.leagueFrozen) next = withLeagueSize(next, Math.max(MIN_LEAGUE, slot + 1));
  else if (slot >= next.leagueSize) return { ok: false, reason: "the league is closed for this session" };
  const clubs = next.clubs.slice();
  clubs[slot] = { ...clubs[slot]!, seatId };
  return {
    ok: true,
    state: { ...next, clubs, seatToSlot: { ...next.seatToSlot, [seatId]: slot }, deskCount: slot + 1 },
  };
}

/* ---------------------------------------------------------------- seed -- */

/**
 * The entire L2 -> L3 mapping. `seed` is untrusted input, including its own
 * presence: only a seed announcing itself as `m2l2-host-league` is read at all,
 * and every field inside is validated per club rather than trusted per seed.
 *
 * What crosses: each club's Draw, its cash, and the mean of the reinvest shares
 * it actually locked in L2. Nothing else — no L2 price, no L2 schedule, no L2
 * decomposition. A club the seed does not describe keeps its stock opening.
 */
export type CarriedClub = { slot: number; draw: number; cash: number; meanReinvest: number | null };

export function extractCarriedClubs(seed: unknown): CarriedClub[] {
  if (!seed || typeof seed !== "object") return [];
  const s = seed as Record<string, unknown>;
  if (s["lessonModuleId"] !== "m2l2-host-league") return [];
  const inner = s["state"];
  if (!inner || typeof inner !== "object") return [];
  const clubs = (inner as Record<string, unknown>)["clubs"];
  if (!Array.isArray(clubs)) return [];
  const out: CarriedClub[] = [];
  for (const raw of clubs) {
    if (!raw || typeof raw !== "object") continue;
    const c = raw as Record<string, unknown>;
    const slot = c["slot"];
    const draw = c["draw"];
    const cash = c["cash"];
    if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 0 || slot >= CLUBS.length) continue;
    if (typeof draw !== "number" || !Number.isFinite(draw)) continue;
    if (typeof cash !== "number" || !Number.isFinite(cash)) continue;
    let meanReinvest: number | null = null;
    const weeks = c["weeks"];
    if (Array.isArray(weeks) && weeks.length > 0) {
      const shares: number[] = [];
      for (const w of weeks) {
        if (!w || typeof w !== "object") continue;
        const share = (w as Record<string, unknown>)["share"];
        if (typeof share === "number" && Number.isFinite(share) && share >= 0 && share <= 100) shares.push(share);
      }
      if (shares.length > 0) meanReinvest = shares.reduce((a, b) => a + b, 0) / shares.length;
    }
    out.push({
      slot,
      draw: clamp(Math.round(draw), DRAW_MIN, DRAW_MAX),
      // A club that ended L2 in debt does not start L3 unable to operate (R5):
      // the carried floor is one week's national check, and the board says so.
      cash: Math.max(NATIONAL, Math.round(cash)),
      meanReinvest,
    });
  }
  return out;
}

/* --------------------------------------------------------------- bots -- */

/**
 * What a league-office club does. Deterministic, printed, and NOT optimal: it
 * plays its profile's house price and the best reinvest it can see for itself
 * under the rule in force, capped by what it can afford. That last clamp is the
 * mechanism the whole lesson turns on — a club with no money cannot buy Draw,
 * its Draw decays, and every building it visits is emptier for it.
 */
export const BOT_REINVEST_FLOOR_CASH = 250_000;

export function botReinvestFor(state: WriteRuleState, club: Club, rule: AdoptedRule | null): number {
  if (club.cash < BOT_REINVEST_FLOOR_CASH) return 0;
  return bestReinvestUnder(state, club, rule);
}

/* ------------------------------------------------------- claim binding -- */

/**
 * Carried from `m2l2-host-league` as a PATTERN, not as an import: every rendered
 * claim string on every surface is built by a builder that takes the computed
 * value and renders it, and emits the relations it asserts (sign, quantifier,
 * bound, absent phrase) as machine-checkable atoms. `moduleClaims()` sweeps them
 * and the tuning harness recomputes each one against the reducer.
 *
 * A sentence with no atom is a sentence the audit cannot see. A surface missing
 * from `moduleClaims()` is a hole; the harness asserts the sweep covers the
 * surfaces it names.
 */
export type ClaimSign = "positive" | "negative" | "nonNegative" | "zero" | "any";

export type ClaimAtom = {
  id: string;
  rendered: string;
  value: number;
  format: "money" | "percent" | "percent1" | "int" | "dollars0";
  assertsSign: ClaimSign;
  bounds?: { min?: number; max?: number };
  quantifier?: { word: string; claims: boolean };
  absent?: string;
};

export type Claimed = { text: string; claims: readonly ClaimAtom[] };

const money = (n: number): string => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

const renderClaim = (value: number, format: ClaimAtom["format"]): string =>
  format === "money" || format === "dollars0"
    ? money(value)
    : format === "percent"
      ? `${Math.round(value)}%`
      : format === "percent1"
        ? `${Math.round(value * 10) / 10}%`
        : `${Math.round(value)}`;

export function claim(
  id: string,
  value: number,
  format: ClaimAtom["format"],
  opts: { assertsSign?: ClaimSign; bounds?: { min?: number; max?: number } } = {},
): ClaimAtom {
  return {
    id,
    rendered: renderClaim(value, format),
    value,
    format,
    assertsSign: opts.assertsSign ?? "any",
    ...(opts.bounds ? { bounds: opts.bounds } : {}),
  };
}

export function claimWord(id: string, word: string, claims: boolean, absent?: string): ClaimAtom {
  return {
    id,
    rendered: word,
    value: claims ? 1 : 0,
    format: "int",
    assertsSign: "any",
    quantifier: { word, claims },
    ...(absent === undefined ? {} : { absent }),
  };
}

export type ClaimSurface = { surface: string; text: string; claims: readonly ClaimAtom[] };

/* ----------------------------------------------------- the rule engine -- */

export const effectiveRule = (state: WriteRuleState): AdoptedRule | null => state.adopted;

/** The share of every extra local dollar a club keeps under a rule (see BC-1 note). */
export function keepFraction(share: number, leagueSize: number): number {
  const s = share / 100;
  return 1 - s * ((leagueSize - 1) / leagueSize);
}

/**
 * One league week, settled for every club at once against the Draws that were
 * printed before anybody touched a dial.
 *
 * Order matters and is fixed: every building settles on the OPENING Draws, then
 * the pot is formed from the settled taxed-local revenue, then it is paid out,
 * then Draw moves. No club's settlement can depend on another club's payout in
 * the same week — that would make the week unattributable.
 */
function settleWeek(state: WriteRuleState, honorPendingDials: boolean): WriteRuleState {
  const week = state.weekIndex;
  const rule = state.adopted;
  const size = state.leagueSize;
  const openingDraw = state.clubs.map((c) => c.draw);

  type Row = {
    slot: number;
    price: number;
    reinvest: number;
    auto: boolean;
    home: HomeSettlement;
    localMedia: number;
    taxedLocal: number;
    reinvestSpend: number;
    paidIn: number;
    visitorSlot: number;
  };

  const rows: Row[] = [];
  for (let slot = 0; slot < size; slot += 1) {
    const club = state.clubs[slot]!;
    const profile = profileOf(club);
    const def = defOf(club);
    const live = club.seatId !== null;
    const committed = live && (club.locked || honorPendingDials);
    const auto = live ? !committed : true;
    // A LIVE desk that never locked settles at its club's house price with
    // nothing reinvested — the exact sentence the bell's confirm, the WATCH FOR
    // flag and the desk's own AUTO badge all promise. It is deliberately NOT the
    // bot policy: a desk that chose nothing must not be credited with a choice.
    // Only a league-office club (no seat) plays the bot line.
    const price = committed ? club.price : profile.housePrice;
    const reinvest = committed ? club.reinvest : live ? 0 : botReinvestFor(state, club, rule);
    const vSlot = visitorSlotFor(slot, week, size);
    const home = settleHome(profile, def.capacity, openingDraw[slot]!, openingDraw[vSlot]!, price);
    const localMedia = localMediaFor(profile, openingDraw[slot]!);
    const taxedLocal = home.gate + localMedia;
    const localRevenue = home.gate + home.inArena + localMedia;
    const reinvestSpend = Math.round((reinvest / 100) * localRevenue);
    const paidIn = rule ? Math.round((rule.share / 100) * taxedLocal) : 0;
    rows.push({ slot, price, reinvest, auto, home, localMedia, taxedLocal, reinvestSpend, paidIn, visitorSlot: vSlot });
  }

  // The pot: formed, then split. With the CONDITION on, a club under the
  // reinvest floor collects half, and the forfeited half is redistributed among
  // the clubs that did comply — a compliance pool, not a bonfire.
  const pot = rows.reduce((sum, r) => sum + r.paidIn, 0);
  const compliant = rows.map((r) => !rule || !rule.condition || r.reinvest >= CONDITION_MIN_REINVEST);
  const evenShare = size > 0 ? pot / size : 0;
  let forfeited = 0;
  const base = rows.map((_, i) => {
    if (compliant[i]) return evenShare;
    const collected = evenShare * CONDITION_COLLECT_FRACTION;
    forfeited += evenShare - collected;
    return collected;
  });
  const compliantCount = compliant.filter(Boolean).length;
  const bonus = compliantCount > 0 ? forfeited / compliantCount : 0;
  const tookOut = rows.map((_, i) => Math.round(base[i]! + (compliant[i] ? bonus : 0)));

  const clubs = state.clubs.slice();
  for (const r of rows) {
    const club = state.clubs[r.slot]!;
    const profile = profileOf(club);
    const cashDelta =
      r.home.gate + r.home.inArena + r.localMedia + NATIONAL - profile.bill - r.reinvestSpend - r.paidIn + tookOut[r.slot]!;
    const drawAfter = nextDraw(profile, openingDraw[r.slot]!, r.reinvestSpend);
    // What this club's own Draw put into the building it visited this week.
    const hostSlot = hostSlotFor(r.slot, week, size);
    const hostClub = state.clubs[hostSlot]!;
    const hostProfile = profileOf(hostClub);
    const hostDef = defOf(hostClub);
    const hostRow = rows[hostSlot]!;
    const withMe = settleHome(hostProfile, hostDef.capacity, openingDraw[hostSlot]!, openingDraw[r.slot]!, hostRow.price);
    const withoutMe = settleHome(hostProfile, hostDef.capacity, openingDraw[hostSlot]!, DRAW_MIN, hostRow.price);
    const roadFansGiven = Math.max(0, withMe.turnout - withoutMe.turnout);
    const roadDollarsGiven = Math.max(0, withMe.doorMoney - withoutMe.doorMoney);

    const settled: SettledWeek = {
      week,
      price: r.price,
      reinvest: r.reinvest,
      auto: r.auto,
      visitorSlot: r.visitorSlot,
      visitorDrawAtTip: openingDraw[r.visitorSlot]!,
      hostDrawAtTip: openingDraw[r.slot]!,
      home: r.home,
      localMedia: r.localMedia,
      taxedLocal: r.taxedLocal,
      reinvestSpend: r.reinvestSpend,
      pot: {
        paidIn: r.paidIn,
        tookOut: tookOut[r.slot]!,
        net: tookOut[r.slot]! - r.paidIn,
        docked: !compliant[r.slot]!,
      },
      bill: profile.bill,
      national: NATIONAL,
      cashDelta,
      cashAfter: club.cash + cashDelta,
      drawAfter,
      roadFansGiven,
      roadDollarsGiven,
    };
    clubs[r.slot] = {
      ...club,
      cash: club.cash + cashDelta,
      draw: drawAfter,
      locked: false,
      weeks: [...club.weeks, settled],
    };
  }

  let next: WriteRuleState = { ...state, clubs, weekIndex: week + 1, leagueFrozen: true };
  // The rookie lands after week 1, on the club with the least money in the bank
  // — determined by the model, never shown as a ranking, and nameable at debrief.
  if (next.weekIndex === 1 && next.rookieSlot === null) next = applyRookie(next);
  if (next.weekIndex >= WEEK_COUNT) next = { ...next, stage: "seasonDone" };
  return next;
}

export function rookieSlotFor(state: WriteRuleState): number {
  let best = 0;
  let bestCash = Number.POSITIVE_INFINITY;
  for (let slot = 0; slot < state.leagueSize; slot += 1) {
    const c = state.clubs[slot]!;
    if (c.cash < bestCash - 1e-9) {
      bestCash = c.cash;
      best = slot;
    }
  }
  return best;
}

function applyRookie(state: WriteRuleState): WriteRuleState {
  const slot = rookieSlotFor(state);
  const clubs = state.clubs.slice();
  clubs[slot] = { ...clubs[slot]!, draw: ROOKIE_DRAW };
  return { ...state, clubs, rookieSlot: slot };
}

/* ------------------------------------------- own-best-response instruments -- */

/**
 * The club's own money from a candidate week, holding everything else fixed.
 *
 * This is the objective every printed "best price" and "best reinvest" in the
 * lesson is brute-forced against, so no arrow can drift from the model. The pot
 * payout a club receives is (approximately, and stated as such nowhere on a
 * student surface) its own contribution back at 1/N; what matters for the argmax
 * is that a club keeps `keepFraction` of what it creates, which this computes
 * exactly rather than assuming.
 */
export function weekTakeFor(
  state: WriteRuleState,
  club: Club,
  rule: AdoptedRule | null,
  price: number,
  reinvest: number,
  hostDraw: number,
  visitorDraw: number,
): { cash: number; drawAfter: number; taxedLocal: number; localRevenue: number } {
  const profile = profileOf(club);
  const def = defOf(club);
  const home = settleHome(profile, def.capacity, hostDraw, visitorDraw, price);
  const localMedia = localMediaFor(profile, hostDraw);
  const taxedLocal = home.gate + localMedia;
  const localRevenue = home.gate + home.inArena + localMedia;
  const spend = Math.round((reinvest / 100) * localRevenue);
  const share = rule ? rule.share / 100 : 0;
  const paidIn = Math.round(share * taxedLocal);
  const backFromPot = paidIn / Math.max(1, state.leagueSize);
  const docked = rule && rule.condition && reinvest < CONDITION_MIN_REINVEST;
  const collected = docked ? backFromPot * CONDITION_COLLECT_FRACTION : backFromPot;
  return {
    cash: home.gate + home.inArena + localMedia + NATIONAL - profile.bill - spend - paidIn + collected,
    drawAfter: nextDraw(profile, hostDraw, spend),
    taxedLocal,
    localRevenue,
  };
}

/**
 * A club's own remaining-season value from playing `price`/`reinvest` this week
 * and then playing its own best line for the weeks that are left, with the rest
 * of the league held at the Draws it can actually see.
 *
 * Terminal Draw is valued at `TERMINAL_DRAW_DOLLARS` a point, because the rule
 * binds two seasons and the room is told so before it votes.
 */
export function projectFrom(
  state: WriteRuleState,
  club: Club,
  rule: AdoptedRule | null,
  week: number,
  price: number,
  reinvest: number,
): number {
  const size = state.leagueSize;
  let draw = club.draw;
  let total = 0;
  for (let w = week; w < WEEK_COUNT; w += 1) {
    const vSlot = visitorSlotFor(club.slot, w, size);
    const vDraw = state.clubs[vSlot]!.draw;
    const p = w === week ? price : bestPriceUnder(state, club, rule, draw, vDraw);
    const r = w === week ? reinvest : reinvest;
    const out = weekTakeFor(state, club, rule, p, r, draw, vDraw);
    total += out.cash;
    draw = out.drawAfter;
  }
  // Next season's opening books are LOCAL revenue, so the rule taxes them too —
  // the room is told before it votes that the rule binds two seasons, and this
  // is where that sentence is a mechanism rather than flavour. Leaving the
  // terminal credit untaxed would put a large share-independent term in the
  // objective and flatten the entire differential response BC-1 turns on.
  return total + profileOf(club).terminalDrawDollars * draw * keepFraction(rule ? rule.share : 0, state.leagueSize);
}

/** The cash-best price for one week, brute-forced over the shipped dial. */
export function bestPriceUnder(
  state: WriteRuleState,
  club: Club,
  rule: AdoptedRule | null,
  hostDraw: number,
  visitorDraw: number,
): number {
  let best = PRICE_GRID[0]!;
  let bestCash = Number.NEGATIVE_INFINITY;
  for (const p of PRICE_GRID) {
    const out = weekTakeFor(state, club, rule, p, 0, hostDraw, visitorDraw);
    if (out.cash > bestCash + 1e-9) {
      bestCash = out.cash;
      best = p;
    }
  }
  return best;
}

/**
 * The cash-best REINVEST for a club under a rule — the lesson's signature
 * number, brute-forced over the shipped nine dial positions against the shipped
 * settlement across the whole remaining season plus the terminal Draw credit.
 */
export function bestReinvestUnder(state: WriteRuleState, club: Club, rule: AdoptedRule | null): number {
  const week = Math.min(state.weekIndex, WEEK_COUNT - 1);
  let best = REINVEST_GRID[0]!;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const r of REINVEST_GRID) {
    const vSlot = visitorSlotFor(club.slot, week, state.leagueSize);
    const vDraw = state.clubs[vSlot]!.draw;
    const p = bestPriceUnder(state, club, rule, club.draw, vDraw);
    const value = projectFrom(state, club, rule, week, p, r);
    if (value > bestValue + 1e-6) {
      bestValue = value;
      best = r;
    }
  }
  return best;
}

/** A rule value object for hypothetical questions ("what if the room had adopted X?"). */
export const hypotheticalRule = (share: number, condition: boolean): AdoptedRule => ({
  share,
  condition,
  how: "voted",
  supporting: 0,
  liveDesks: 0,
  median: share,
  runnerUp: share,
});

/* --------------------------------------------------------- the adoption -- */

export function medianOf(values: readonly number[]): number {
  if (values.length === 0) return STATUS_QUO_SHARE;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Median snapped to the dial the room was actually given; halves round UP. */
export const snapShare = (value: number): number =>
  clamp(Math.round(value / SHARE_STEP) * SHARE_STEP, SHARE_MIN, SHARE_MAX);

export type AdoptionOutcome = {
  adopted: AdoptedRule;
  proposals: number[];
  inBand: number;
  needed: number;
};

/**
 * The two-thirds test, and why it is two-thirds.
 *
 * The contract's headcount-dominance exploit: a simple majority makes this a
 * poll, and whichever market type the class happens to hold more of simply wins
 * without anyone reasoning. The pot IS the big markets' money, so under a
 * supermajority they have to be bought rather than outvoted — which is how real
 * leagues work, and which forces the two sides to trade.
 */
export function runAdoption(state: WriteRuleState): AdoptionOutcome {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const proposals = live.map((c) => c.proposal?.share ?? STATUS_QUO_SHARE);
  const conditions = live.map((c) => c.proposal?.condition ?? STATUS_QUO_CONDITION);
  const median = medianOf(proposals);
  const snapped = snapShare(median);
  const bandIdx = proposals.map((p, i) => (Math.abs(p - median) <= ADOPT_BAND + 1e-9 ? i : -1)).filter((i) => i >= 0);
  const needed = Math.ceil((live.length * ADOPT_NUMERATOR) / ADOPT_DENOMINATOR);
  const runnerUp = runnerUpShare(proposals, snapped);
  if (live.length === 0 || bandIdx.length < needed) {
    return {
      adopted: {
        share: STATUS_QUO_SHARE,
        condition: STATUS_QUO_CONDITION,
        how: "statusQuo",
        supporting: bandIdx.length,
        liveDesks: live.length,
        median: snapped,
        runnerUp,
      },
      proposals,
      inBand: bandIdx.length,
      needed,
    };
  }
  // The CONDITION rides with the desks who actually carried the share: a
  // majority of the supporting bloc, ties resolving OFF (the less intrusive
  // rule, and the status quo's own setting).
  const yes = bandIdx.filter((i) => conditions[i]).length;
  const condition = yes * 2 > bandIdx.length;
  return {
    adopted: {
      share: snapped,
      condition,
      how: "voted",
      supporting: bandIdx.length,
      liveDesks: live.length,
      median: snapped,
      runnerUp,
    },
    proposals,
    inBand: bandIdx.length,
    needed,
  };
}

/** The share that finished second — the one the COUNTERFACTUAL replays. */
export function runnerUpShare(proposals: readonly number[], adoptedShare: number): number {
  const counts = new Map<number, number>();
  for (const p of proposals) {
    const s = snapShare(p);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  counts.delete(adoptedShare);
  let best = adoptedShare === STATUS_QUO_SHARE ? REAL_RULE_SHARE : STATUS_QUO_SHARE;
  let bestCount = -1;
  for (const [share, count] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (count > bestCount) {
      bestCount = count;
      best = share;
    }
  }
  return best;
}

/* ---------------------------------------------------------- aggregates -- */

export const deskHandleFor = (club: Club): string => `Desk ${club.deskNumber} · ${CLUBS[club.slot]!.short}`;

export type HistogramBin = { share: number; count: number };

export type RoundSummary = {
  round: number;
  bins: HistogramBin[];
  median: number;
  conditionYes: number;
  submitted: number;
};

export type PotFlowRow = {
  deskHandle: string;
  deskNumber: number;
  sizeLabel: string;
  paidIn: number;
  tookOut: number;
  net: number;
  ownDialDelta: number;
  docked: boolean;
  /** Rendered here so no surface ever formats a module number for itself. */
  paidInText: string;
  tookOutText: string;
  netText: string;
};

export type ReinvestEraRow = {
  deskHandle: string;
  deskNumber: number;
  sizeLabel: string;
  l2: number | null;
  l3: number;
};

export type ArrowRow = {
  deskHandle: string;
  sizeLabel: string;
  clubShort: string;
  priceAtZero: number;
  priceAtAdopted: number;
  priceSteps: number;
  reinvestAtZero: number;
  reinvestAtAdopted: number;
  reinvestSteps: number;
  soldOut: boolean;
};

export type CounterfactualRow = {
  deskHandle: string;
  deskNumber: number;
  netAdopted: number;
  netRunnerUp: number;
  delta: number;
  netAdoptedText: string;
  netRunnerUpText: string;
  deltaText: string;
};

export type WriteRuleAggregate = {
  leagueSize: number;
  deskCount: number;
  rounds: RoundSummary[];
  liveRound: RoundSummary | null;
  adopted: AdoptedRule | null;
  hookSplit: { pay: number; breakup: number; undecided: number };
  kingsSplit: { deny: number; approve: number; undecided: number };
  potFlows: PotFlowRow[];
  potTotal: number;
  reinvestEra: ReinvestEraRow[];
  l2Mean: number | null;
  l3Mean: number;
  arrows: ArrowRow[];
  counterfactual: CounterfactualRow[];
  counterfactualShare: number;
  rookieSlot: number | null;
  weeksPlayed: number;
};

const sizeLabelOf = (club: Club): string => profileOf(club).sizeLabel;

export function computeAggregate(state: WriteRuleState): WriteRuleAggregate {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const rounds: RoundSummary[] = state.closedRounds.map((r) => ({
    round: r.round,
    bins: binsFrom(r.shares),
    median: r.median,
    conditionYes: r.conditions.filter(Boolean).length,
    submitted: r.shares.length,
  }));
  const liveShares = live.map((c) => c.proposal?.share).filter((s): s is number => typeof s === "number");
  const liveRound: RoundSummary | null =
    state.stage === "rounds" && liveShares.length > 0
      ? {
          round: state.roundIndex + 1,
          bins: binsFrom(liveShares),
          median: snapShare(medianOf(liveShares)),
          conditionYes: live.filter((c) => c.proposal?.condition).length,
          submitted: liveShares.length,
        }
      : null;

  const potFlows: PotFlowRow[] = live.map((c): PotFlowRow => {
    const paidIn = c.weeks.reduce((a, w) => a + w.pot.paidIn, 0);
    const tookOut = c.weeks.reduce((a, w) => a + w.pot.tookOut, 0);
    const ownDialDelta = c.weeks.reduce((a, w) => a + w.cashDelta - w.pot.net, 0);
    return {
      deskHandle: deskHandleFor(c),
      deskNumber: c.deskNumber,
      sizeLabel: sizeLabelOf(c),
      paidIn,
      tookOut,
      net: tookOut - paidIn,
      ownDialDelta,
      docked: c.weeks.some((w) => w.pot.docked),
      paidInText: money(paidIn),
      tookOutText: money(tookOut),
      netText: money(tookOut - paidIn),
    };
  });

  const reinvestEra: ReinvestEraRow[] = live.map((c) => ({
    deskHandle: deskHandleFor(c),
    deskNumber: c.deskNumber,
    sizeLabel: sizeLabelOf(c),
    l2: c.l2Reinvest,
    l3: c.weeks.length > 0 ? c.weeks.reduce((a, w) => a + w.reinvest, 0) / c.weeks.length : c.reinvest,
  }));
  const l3Mean = reinvestEra.length > 0 ? reinvestEra.reduce((a, r) => a + r.l3, 0) / reinvestEra.length : 0;
  const l2Rows = reinvestEra.filter((r) => r.l2 !== null);
  const l2Mean = l2Rows.length > 0 ? l2Rows.reduce((a, r) => a + (r.l2 ?? 0), 0) / l2Rows.length : state.l2MeanReinvest;

  const arrows: ArrowRow[] = live.map((c) => arrowFor(state, c));

  const cfShare = state.adopted?.runnerUp ?? STATUS_QUO_SHARE;
  const counterfactual: CounterfactualRow[] = state.counterfactualRun ? counterfactualRows(state, cfShare) : [];

  return {
    leagueSize: state.leagueSize,
    deskCount: live.length,
    rounds,
    liveRound,
    adopted: state.adopted,
    hookSplit: {
      pay: live.filter((c) => c.hookPick === "pay").length,
      breakup: live.filter((c) => c.hookPick === "breakup").length,
      undecided: live.filter((c) => c.hookPick === null).length,
    },
    kingsSplit: {
      deny: live.filter((c) => c.kingsVote === "deny").length,
      approve: live.filter((c) => c.kingsVote === "approve").length,
      undecided: live.filter((c) => c.kingsVote === null).length,
    },
    potFlows,
    potTotal: state.clubs
      .slice(0, state.leagueSize)
      .reduce((a, c) => a + c.weeks.reduce((b, w) => b + w.pot.paidIn, 0), 0),
    reinvestEra,
    l2Mean,
    l3Mean,
    arrows,
    counterfactual,
    counterfactualShare: cfShare,
    rookieSlot: state.rookieSlot,
    weeksPlayed: state.weekIndex,
  };
}

function binsFrom(shares: readonly number[]): HistogramBin[] {
  return SHARE_GRID.map((share) => ({ share, count: shares.filter((s) => s === share).length }));
}

/**
 * The moving arrow and the flat arrow, for one club, computed rather than told.
 *
 * BC-1's teaching object: the same club's cash-best PRICE and cash-best REINVEST
 * with no rule at all, beside the same two numbers under the rule the room
 * adopted. A capacity-bound building's price does not move, and the board asks
 * the room why.
 */
export function arrowFor(state: WriteRuleState, club: Club): ArrowRow {
  const rule = state.adopted;
  const week = Math.min(Math.max(0, state.weekIndex - 1), WEEK_COUNT - 1);
  const vSlot = visitorSlotFor(club.slot, week, state.leagueSize);
  const settled = club.weeks[week];
  const hostDraw = settled ? settled.hostDrawAtTip : club.draw;
  const visitorDraw = settled ? settled.visitorDrawAtTip : state.clubs[vSlot]!.draw;
  const noRule = null;
  const priceAtZero = bestPriceUnder(state, club, noRule, hostDraw, visitorDraw);
  const priceAtAdopted = rule ? bestPriceUnder(state, club, rule, hostDraw, visitorDraw) : priceAtZero;
  const reinvestAtZero = bestReinvestUnder(state, club, noRule);
  const reinvestAtAdopted = rule ? bestReinvestUnder(state, club, rule) : reinvestAtZero;
  const def = defOf(club);
  const profile = profileOf(club);
  const at = settleHome(profile, def.capacity, hostDraw, visitorDraw, priceAtZero);
  return {
    deskHandle: deskHandleFor(club),
    sizeLabel: profile.sizeLabel,
    clubShort: def.short,
    priceAtZero,
    priceAtAdopted,
    priceSteps: Math.round((priceAtZero - priceAtAdopted) / PRICE_STEP),
    reinvestAtZero,
    reinvestAtAdopted,
    reinvestSteps: Math.round((reinvestAtZero - reinvestAtAdopted) / REINVEST_STEP),
    soldOut: at.soldOut,
  };
}

/**
 * The COUNTERFACTUAL, and its honest limit.
 *
 * Every pair's actions are held EXACTLY as played; only the rule changes. This
 * can say what the money would have done. It cannot say what the room would have
 * done, and the board says so in those words.
 */
export function counterfactualRows(state: WriteRuleState, share: number): CounterfactualRow[] {
  const size = state.leagueSize;
  const rule = state.adopted;
  const out: CounterfactualRow[] = [];
  const weeks = state.weekIndex;
  // Replay the pot week by week from the taxed-local revenue each club actually
  // realised, at the counterfactual share, with the same condition setting.
  const netAt = (shareValue: number, condition: boolean): Map<number, number> => {
    const nets = new Map<number, number>();
    for (let w = 0; w < weeks; w += 1) {
      const paid: number[] = [];
      const compliant: boolean[] = [];
      for (let slot = 0; slot < size; slot += 1) {
        const wk = state.clubs[slot]!.weeks[w];
        paid.push(wk ? Math.round((shareValue / 100) * wk.taxedLocal) : 0);
        compliant.push(!condition || (wk ? wk.reinvest >= CONDITION_MIN_REINVEST : false));
      }
      const pot = paid.reduce((a, b) => a + b, 0);
      const even = size > 0 ? pot / size : 0;
      let forfeited = 0;
      const base = compliant.map((ok) => {
        if (ok) return even;
        forfeited += even * (1 - CONDITION_COLLECT_FRACTION);
        return even * CONDITION_COLLECT_FRACTION;
      });
      const compliantCount = compliant.filter(Boolean).length;
      const bonus = compliantCount > 0 ? forfeited / compliantCount : 0;
      for (let slot = 0; slot < size; slot += 1) {
        const took = Math.round(base[slot]! + (compliant[slot] ? bonus : 0));
        nets.set(slot, (nets.get(slot) ?? 0) + took - paid[slot]!);
      }
    }
    return nets;
  };
  const adoptedNets = netAt(rule?.share ?? 0, rule?.condition ?? false);
  const cfNets = netAt(share, rule?.condition ?? false);
  for (const club of state.clubs.slice(0, size)) {
    if (club.seatId === null) continue;
    const a = adoptedNets.get(club.slot) ?? 0;
    const b = cfNets.get(club.slot) ?? 0;
    out.push({
      deskHandle: deskHandleFor(club),
      deskNumber: club.deskNumber,
      netAdopted: a,
      netRunnerUp: b,
      delta: b - a,
      netAdoptedText: money(a),
      netRunnerUpText: money(b),
      deltaText: money(b - a),
    });
  }
  return out;
}

/* ------------------------------------------------------------ the copy -- */

export const MODULE_ID = "m2l3-write-rule" as const;
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

const PHASES: readonly CanonicalPhase[] = [
  "LOBBY",
  "HOOK",
  "PLAY",
  "REVEAL",
  "CONSEQUENCE",
  "COUNTERFACTUAL",
  "ARGUE",
  "SYNTHESIS",
  "COMPLETE",
];

export const LOBBY_COPY =
  "You have run this building for two lessons. Today you are in the room where the rule gets written.";

export const HOOK_COPY =
  "June 2025. Boston is a year removed from winning the title. The bill for next season's roster, salary plus luxury tax, is reported north of $500 million. The roster is ageing, one star is hurt for the season, and the club is in the middle of being sold. The league has not banned Boston from spending a dollar. It has only put a price on it.";

export const HOOK_QUESTION = "Pay it, or break it up?";

export const HOOK_REVEAL_COPY =
  "Inside 24 hours Boston traded Jrue Holiday and Kristaps Porzingis, cutting a reported $200M+ of combined salary and tax. Then the other half, in the same breath: Oklahoma City traded James Harden in 2012 rather than pay the tax. Harden became an MVP somewhere else and it was called a disaster for a decade — and Oklahoma City won the championship in 2025. There is no score here and there never was.";

export const HOOK_BOARD_QUESTION = "The league never banned Boston from spending. It just charged them. Why did that work better than a ban?";

export const VEIL_COPY =
  "Whatever rule you write binds two seasons. And next season one club in this room gets a rookie who moves buildings. Nobody knows which club yet — not you, not your teacher, not the league office.";

export const RULE_COPY =
  "SHARE is how much of every club's local money — ticket money and local television money — goes into one pot that gets split equally. CONDITION is whether a club has to put at least 15% back into its own product to collect its full share.";

export const ADOPT_COPY =
  "A rule passes when two-thirds of the desks are within 10 points of the room's middle number. Two-thirds, not half, because the pot is the big markets' money: they have to be bought, not outvoted.";

export const STATUS_QUO_COPY =
  "You could not agree. Real leagues have that problem too, and this is a legitimate outcome, not a failure. The old rule holds — 5% — and we are about to find out what not agreeing costs.";

export const SEASON_COPY =
  "Three weeks under your own rule. Same building, same dials, same league. The only thing that changed is the rule you wrote.";

export const ROOKIE_COPY =
  "The rookie has landed. In this league the pick went to the club with the least money in the bank after week 1. That is NOT how the real league does it: the NBA uses a lottery precisely so that losing is never a guaranteed reward — since 2019 the three worst records each have a 14.0% chance at the first pick, and the worst record has no guarantee at all.";

export const CONSEQUENCE_QUESTION = "Whose effort went down? Did anybody DECIDE to try less — or did it just stop being worth it?";

export const COUNTERFACTUAL_HONESTY =
  "We can show you what the money would have done. We cannot show you what you would have done. That is why we played it instead of arguing about it.";

export const ARGUE_COPY =
  "January 2013. The Maloof family agrees to sell the Sacramento Kings to a Seattle group led by Chris Hansen and Steve Ballmer, who plan to move the club and bring back the SuperSonics — Seattle lost the Sonics to Oklahoma City in 2008 after a public-money fight. Sacramento's mayor puts together a rival bid under Vivek Ranadive with a downtown arena plan. Seattle's offer is worth more money. You are the Board of Governors. You vote on the two term sheets in front of you.";

export const ARGUE_PROMPT = "Approve the sale and the move to Seattle, or deny it and keep the club in Sacramento?";

export const ARGUE_REVEAL_COPY =
  "On May 15, 2013 the owners voted 22-8 to deny the relocation. The Kings sold in Sacramento at a then-record $534M valuation and Golden 1 Center opened downtown in 2016. And it is not finished: as of summer 2026 Seattle is a frontrunner, with Las Vegas, in an NBA expansion process the commissioner says is on track for a determination by the end of 2026.";

export const EXIT_PROMPT =
  "Name one thing you did differently in the last three weeks than you did in the last lesson — and name the rule that made you do it.";

export const COMPLETE_COPY =
  "Your rule is the artifact you keep. Write it on the board next to the real league's, and argue about it again in a year.";

export const HORIZON_LINE =
  "One 'week' here stands for about a month of a real season. That compression is the one thing this lesson scales; the dollars are at real league scale and are modeled on real market differences, not measured from any club's books.";

export const MODELED_DOLLARS_LINE =
  "These demand curves are MODELED on real market differences. They are not any club's actual measured demand. Buildings, capacities, market sizes and every dated figure on the board are real.";

export const BOARD_PRIVACY_LINE = "No desk's money is ever ranked on this screen. Rows are sorted by desk number and nothing else.";

export const HOUSE_RULES: readonly string[] = [
  "Three offer rounds, then the room votes. Between rounds you see everybody's numbers with no names on them — but not until round 1 has closed.",
  "A rule passes at two-thirds of desks within 10 points of the middle number. Otherwise the old 5% rule holds.",
  "Then three weeks under whatever rule the room ends up with: set your price, set how much of the week's money you put back into the club.",
  "Your share of the pot arrives every week. So does everybody else's, out of yours.",
  "The national television check is the same for every club, every week, and the pot never touches it.",
];

export const SOURCE_NOTES: readonly string[] = [
  "Boston's June 2025 tax position and the Holiday/Porzingis trades: reported June 2025; the ~$500M projected salary-and-tax bill and the ~$200M+ saving are reported figures, not audited books.",
  "2024-25 luxury tax: about $456M paid by ten clubs; the Suns paid the most at about $152M; each of the twenty non-tax clubs received about $11.4M. 2026-27 lines: tax $200.428M, first apron $209.015M, second apron $221.686M.",
  "Revenue sharing: in one leaked league year (2016-17 reporting) 14 of 30 clubs lost money before revenue sharing and 9 after; Memphis received about $32M, the league's most; the Lakers still cleared about $115M after paying in. In 2021-22 ten high-revenue clubs paid $163.6M into the pool, with the Warriors and Lakers alone over $88M of it.",
  "Green Bay Packers FY2025, reported July 2026: $453.2M per club in shared national revenue, up 4.8%; total Packers revenue $719M; metro population about 320,000 — and the same record-revenue report showed an operating loss.",
  "Sacramento: the owners voted 22-8 on May 15, 2013 to deny relocation; the club sold at a then-record $534M valuation; Golden 1 Center opened 2016. Seattle lost the Sonics to Oklahoma City in 2008; Climate Pledge Arena was later rebuilt with about $1.15B of private money. Milwaukee approved about $250M of public money in 2015 under a relocation threat and won the 2021 title.",
  "NBA draft lottery: since the 2019 reform the three worst records each hold a 14.0% chance at the first pick.",
  "As of summer 2026 the league has 30 clubs; Seattle and Las Vegas are in an expansion process the commissioner says is on track for a determination by the end of 2026.",
];

export const SIMPLIFICATIONS: readonly { what: string; why: string; risk: string }[] = [
  {
    what: "The pot is skimmed from ticket money and local television money only. What fans spend inside the building is never taxed.",
    why: "A rule that taxes every dollar of revenue at the same rate cannot change anybody's best price — scaling a number by a constant does not move where it peaks. Leaving one real stream untaxed is what makes the arithmetic move, and real sharing formulas do carve out arena-related revenue.",
    risk: "A student could conclude that real revenue sharing exempts concessions exactly. It does not; the real formula is more complicated and is not public.",
  },
  {
    what: "One 'week' stands for roughly a month of a real season, and a season is three weeks long.",
    why: "A fifty-minute class cannot play eighty-two home dates. Three settlements is the fewest that shows a rule changing behaviour over time.",
    risk: "The dollar figures per 'week' are much larger than any single game.",
  },
  {
    what: "The rookie goes to the club with the least money in the bank after week 1.",
    why: "The room must not be able to work out in advance who gets it, and the model must not use a random number. Cash is never ranked on any surface, so it is genuinely unknowable in advance and exactly nameable afterwards.",
    risk: "This is NOT the real rule. The NBA uses a lottery, and the module says so out loud the moment the rookie lands.",
  },
  {
    what: "The league office's fallback rule is a 30% share with the condition on.",
    why: "The teacher needs a real rule to operate if the room cannot write one or the period runs short.",
    risk: "It is MODELED on the NBA's design (a percentage of local revenue into an equally split pool, with conditions attached), not a quotation of the real rate, which is not public.",
  },
  {
    what: "Sharing is a TRANSFER with a real cost to the payer. This lesson never claims that a big market's own money is better off under a high share.",
    why: "The design document hoped the room's own arithmetic would show an interior best share above zero for EVERY market including the biggest — 'sharing pays the payer, through the product'. At the shipped constants it does not, and the reason is structural rather than a tuning miss: the big markets are capacity-bound (BC-1b's flat arrow), so a weaker visiting club costs them a sustainable price rather than a full building, and that is worth far less than what they pay in. Forcing the summit would have required a model in which a marquee visitor doubles Madison Square Garden's crowd, which is not true of a building that sells out.",
    risk: "The room can conclude that sharing is simply theft from the big markets. The counter is real and is on the board rather than in the arithmetic: the league's own payers accept it in a collectively bargained agreement, and in the leaked year the Lakers still cleared about $115M after paying in. Teach it as an argument the owners actually have, not as a sum the class can settle.",
  },
  {
    what: "Revenue is never profit anywhere in this lesson, and the module never claims it is.",
    why: "Every number here is money in, before what a club owes anybody.",
    risk: "'More revenue = better run' is the false lesson. The Packers' record-revenue-with-an-operating-loss line is on the board in synthesis for exactly this reason.",
  },
];

/* ------------------------------------------------------ claim builders -- */

export function adoptionLineClaimed(agg: WriteRuleAggregate): Claimed {
  const rule = agg.adopted;
  if (!rule) return { text: "No rule has been adopted yet.", claims: [] };
  const share = claim("adopted-share", rule.share, "percent", { assertsSign: "nonNegative", bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  const supporting = claim("adopted-supporting", rule.supporting, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rule.liveDesks } });
  const desks = claim("adopted-live-desks", rule.liveDesks, "int", { assertsSign: "nonNegative" });
  const passed = claimWord("adopted-passed", rule.how === "voted" ? "ADOPTED" : "NOT ADOPTED", rule.how === "voted");
  const condition = claimWord("adopted-condition", rule.condition ? "CONDITION ON" : "CONDITION OFF", rule.condition);
  // The atom list is per BRANCH, not per function: a sentence that does not
  // render a figure may not ship an atom claiming it did. The league office's
  // branch says nothing about desks or about a vote, so it carries neither.
  if (rule.how === "leagueOffice") {
    const office = claimWord("adopted-league-office", "This room did not write it", true, "ADOPTED");
    return {
      text: `The league office's rule is in force — SHARE ${share.rendered} · ${condition.rendered}. ${office.rendered}.`,
      claims: [share, condition, office],
    };
  }
  const text =
    rule.how === "voted"
      ? `${passed.rendered} — SHARE ${share.rendered} · ${condition.rendered}. ${supporting.rendered} of ${desks.rendered} desks landed inside ten points of the room's middle number.`
      : `${passed.rendered} — the old rule holds at SHARE ${share.rendered} · ${condition.rendered}. Only ${supporting.rendered} of ${desks.rendered} desks landed inside ten points of the middle number, and two-thirds were needed.`;
  return { text, claims: [share, supporting, desks, passed, condition] };
}

export function reinvestEraLineClaimed(agg: WriteRuleAggregate): Claimed {
  const l3 = claim("era-l3-mean", agg.l3Mean, "percent1", { assertsSign: "nonNegative", bounds: { min: 0, max: REINVEST_MAX } });
  if (agg.l2Mean === null) {
    const word = claimWord("era-no-l2", "no Lesson 2 numbers", true);
    return {
      text: `This room put back ${l3.rendered} of its money, on average, across three weeks under its own rule. There are ${word.rendered} linked to this session, so the before-and-after bar has one bar in it.`,
      claims: [l3, word],
    };
  }
  const l2 = claim("era-l2-mean", agg.l2Mean, "percent1", { assertsSign: "nonNegative", bounds: { min: 0, max: REINVEST_MAX } });
  const delta = agg.l3Mean - agg.l2Mean;
  const deltaAtom = claim("era-delta", Math.abs(delta), "percent1", { assertsSign: "nonNegative" });
  const direction = claimWord("era-direction", delta < -0.05 ? "went down" : delta > 0.05 ? "went up" : "did not move", delta < -0.05);
  return {
    text: `Last lesson this room put back ${l2.rendered} of its money, with no rule at all. Under the rule you wrote, it put back ${l3.rendered}. Effort ${direction.rendered} by ${deltaAtom.rendered}.`,
    claims: [l2, l3, deltaAtom, direction],
  };
}

/**
 * BC-1's own sentence: the arrow that moved, standing beside the arrow that did
 * not, with the reason attached. Every figure here is brute-forced through the
 * shipped settlement, so this sentence cannot say anything the model does not do.
 */
export function arrowLineClaimed(agg: WriteRuleAggregate): Claimed {
  const rows = agg.arrows;
  if (rows.length === 0 || !agg.adopted) return { text: "The arrows are drawn once a rule is in force and a week is on the books.", claims: [] };
  const moved = rows.filter((r) => r.reinvestSteps > 0);
  const flat = rows.filter((r) => r.priceSteps === 0);
  const movedPrice = rows.filter((r) => r.priceSteps > 0);
  const biggest = [...rows].sort((a, b) => b.reinvestSteps - a.reinvestSteps)[0]!;
  const stepsAtom = claim("arrow-biggest-steps", biggest.reinvestSteps, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: REINVEST_GRID.length - 1 } });
  const fromAtom = claim("arrow-biggest-from", biggest.reinvestAtZero, "percent", { assertsSign: "nonNegative", bounds: { min: REINVEST_MIN, max: REINVEST_MAX } });
  const toAtom = claim("arrow-biggest-to", biggest.reinvestAtAdopted, "percent", { assertsSign: "nonNegative", bounds: { min: REINVEST_MIN, max: REINVEST_MAX } });
  const movedCount = claim("arrow-moved-count", moved.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rows.length } });
  const flatCount = claim("arrow-flat-price-count", flat.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rows.length } });
  const priceMovedCount = claim("arrow-moved-price-count", movedPrice.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rows.length } });
  const anyFlat = claimWord("arrow-any-flat-price", "did not move at all", flat.length > 0);
  return {
    text:
      `Under this rule the best thing to put back into ${biggest.deskHandle} fell from ${fromAtom.rendered} to ${toAtom.rendered} — ${stepsAtom.rendered} clicks of the dial. ` +
      `${movedCount.rendered} of ${rows.length} desks saw that move. ` +
      `On price it splits: ${priceMovedCount.rendered} desks' best price came down, and ${flatCount.rendered} desks' best price ${anyFlat.rendered}.`,
    claims: [stepsAtom, fromAtom, toAtom, movedCount, flatCount, priceMovedCount, anyFlat],
  };
}

export function potLineClaimed(agg: WriteRuleAggregate): Claimed {
  const total = claim("pot-total", agg.potTotal, "money", { assertsSign: "nonNegative" });
  const payers = agg.potFlows.filter((f) => f.net < 0);
  const receivers = agg.potFlows.filter((f) => f.net > 0);
  const payerCount = claim("pot-payers", payers.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.potFlows.length } });
  const receiverCount = claim("pot-receivers", receivers.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.potFlows.length } });
  const biggestNet = [...agg.potFlows].sort((a, b) => b.net - a.net)[0];
  const bigAtom = claim("pot-biggest-net", biggestNet ? Math.abs(biggestNet.net) : 0, "money", { assertsSign: "nonNegative" });
  const word = claimWord("pot-two-sided", "paid more in than they took out", payers.length > 0);
  return {
    text: `${total.rendered} went through the pot over three weeks. ${payerCount.rendered} desks ${word.rendered}; ${receiverCount.rendered} took out more than they put in. The biggest single swing was ${bigAtom.rendered}${biggestNet ? ` at ${biggestNet.deskHandle}` : ""}.`,
    claims: [total, payerCount, receiverCount, bigAtom, word],
  };
}

export function counterfactualLineClaimed(agg: WriteRuleAggregate): Claimed {
  if (agg.counterfactual.length === 0) return { text: COUNTERFACTUAL_HONESTY, claims: [] };
  const share = claim("cf-share", agg.counterfactualShare, "percent", { assertsSign: "nonNegative", bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  const better = agg.counterfactual.filter((r) => r.delta > 0).length;
  const worse = agg.counterfactual.filter((r) => r.delta < 0).length;
  const betterAtom = claim("cf-better", better, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.counterfactual.length } });
  const worseAtom = claim("cf-worse", worse, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.counterfactual.length } });
  const word = claimWord("cf-not-behaviour", "what the money would have done", true, "what you would have done instead");
  return {
    text: `At ${share.rendered} — the number that finished second in this room — ${betterAtom.rendered} desks would have ended the three weeks with more transfer money and ${worseAtom.rendered} with less, holding every decision you made exactly as you made it. That is ${word.rendered}.`,
    claims: [share, betterAtom, worseAtom, word],
  };
}

export function hookSplitLineClaimed(agg: WriteRuleAggregate): Claimed {
  const pay = claim("hook-pay", agg.hookSplit.pay, "int", { assertsSign: "nonNegative" });
  const brk = claim("hook-breakup", agg.hookSplit.breakup, "int", { assertsSign: "nonNegative" });
  const word = claimWord("hook-no-score", "There is no score", true, "correct answer");
  return {
    text: `${pay.rendered} desks said pay it. ${brk.rendered} said break it up. ${word.rendered} on this one — Boston chose, and so did Oklahoma City in 2012, and the two choices are still being argued about.`,
    claims: [pay, brk, word],
  };
}

export function kingsSplitLineClaimed(agg: WriteRuleAggregate): Claimed {
  const deny = claim("kings-deny", agg.kingsSplit.deny, "int", { assertsSign: "nonNegative" });
  const approve = claim("kings-approve", agg.kingsSplit.approve, "int", { assertsSign: "nonNegative" });
  const word = claimWord("kings-no-score", "Nobody is scored against the owners", true, "you got it right");
  return {
    text: `This room voted ${deny.rendered} to deny and ${approve.rendered} to approve. The owners voted 22-8 to deny. ${word.rendered} — Seattle offered more money and lost the vote, and thirteen years later Seattle may get a club anyway.`,
    claims: [deny, approve, word],
  };
}

/* ---------------------------------------------------------- synthesis -- */

export type FinaleRails = {
  rememberWhen: string;
  ourClass: string;
  inSports: string;
  economistsCall: string;
  outsideSports: string;
};

export type SynthesisCard = {
  id: string;
  title: string;
  body: string;
  rails: FinaleRails;
  claims?: readonly ClaimAtom[];
};

/**
 * THE MODULE FINALE — "ECONOMICS YOU LEARNED".
 *
 * Not a glossary. Every card carries five rails, and the two that matter are
 * computed from THIS class's own session: REMEMBER WHEN (a moment out of the
 * lesson's own data) and OUR CLASS (a pattern computed off state). IN SPORTS,
 * ECONOMISTS CALL THIS and OUTSIDE SPORTS are static dated content and carry no
 * atoms, which is correct and is why they are registered with an empty claim
 * list rather than dropped from the sweep.
 *
 * Cross-lesson material appears only where an L2 session was actually linked;
 * every card that would otherwise assert something about Lesson 2 says plainly
 * that this room has no Lesson 2 numbers instead.
 */
export function synthesisCards(state: WriteRuleState, agg: WriteRuleAggregate): SynthesisCard[] {
  const cards: SynthesisCard[] = [];
  /* --- C6 revenue sharing: both halves --- */
  {
    const pot = potLineClaimed(agg);
    cards.push({
      id: "revenue-sharing",
      title: "SHARING HELPED — AND HERE IS WHAT IT COST",
      body: pot.text,
      rails: {
        rememberWhen:
          agg.potFlows.length > 0
            ? `Week 1, the moment the pot formed: money left ${agg.potFlows.filter((f) => f.net < 0).length} desks and came back out in equal portions to every club in the league, including the ones it had just left.`
            : "The week the pot formed and the money moved sideways across the room.",
        ourClass: pot.text,
        inSports:
          "In one leaked league year 14 of 30 clubs lost money BEFORE revenue sharing and 9 after. Memphis received about $32M, the most in the league — and the Lakers still cleared about $115M after paying in. In 2021-22 ten clubs paid $163.6M into the pool, the Warriors and Lakers alone over $88M of it.",
        economistsCall: "REVENUE SHARING. REDISTRIBUTION. And the cost half has a name too: MORAL HAZARD — when sharing takes away the reason to try.",
        outsideSports: "Tips pooled across a restaurant's whole staff. A group grade. Taxes. A chore jar with one sibling who has worked out that the jar pays either way.",
      },
      claims: pot.claims,
    });
  }

  /* --- C7 incentives: the room's own hands --- */
  {
    const era = reinvestEraLineClaimed(agg);
    const arrows = arrowLineClaimed(agg);
    cards.push({
      id: "incentives",
      title: "YOU DESIGNED AN INCENTIVE, THEN LIVED UNDER IT",
      body: `${era.text} ${arrows.text}`,
      rails: {
        rememberWhen:
          "The moment somebody in this room said out loud that there was no point trying to sell the building out any more. Nobody told them to feel that. The rule did.",
        ourClass: `${era.text} ${arrows.text}`,
        inSports:
          "The luxury tax is a price, not a wall: about $456M paid by ten clubs in 2024-25, the Suns the most at about $152M, and each of the twenty non-tax clubs receiving about $11.4M. Boston was never banned from spending. It was charged, and it chose.",
        economistsCall: "INCENTIVE. A rule does not have to forbid anything to change what people want to do.",
        outsideSports: "A late-homework penalty. A deposit on a bottle. A speeding fine. None of them ban anything; all of them change behaviour.",
      },
      claims: [...era.claims, ...arrows.claims],
    });
  }

  /* --- C8 institutional design --- */
  {
    const adoption = adoptionLineClaimed(agg);
    cards.push({
      id: "institution-design",
      title: "SOMEBODY DESIGNED THIS. IT COULD HAVE BEEN DESIGNED DIFFERENTLY",
      body: adoption.text,
      rails: {
        rememberWhen:
          agg.rounds.length > 0
            ? `Round ${agg.rounds.length}: the room's middle number was ${snapShare(agg.rounds[agg.rounds.length - 1]!.median)}%, and the desks nowhere near it had to decide whether to move.`
            : "The three rounds where the room's numbers came together, or did not.",
        ourClass: adoption.text,
        inSports:
          "Two-thirds is not a decoration. The pot is the big markets' money, so real leagues make the big markets be bought rather than outvoted — which is why owners' votes on money take supermajorities, and why the Sacramento vote on May 15, 2013 was 22-8 rather than 16-14.",
        economistsCall: "INSTITUTIONAL DESIGN. UNINTENDED CONSEQUENCE. The rule you write is a machine, and it keeps running after you leave the room.",
        outsideSports: "Every system you are inside — this class, this town, this country — was designed by somebody. It could have been designed differently, and that would have changed what people wanted to do.",
      },
      claims: adoption.claims,
    });
  }

  /* --- C5 shared product (needs L2 for the REMEMBER WHEN, has L3 road data anyway) --- */
  {
    const roadRows = state.clubs
      .slice(0, state.leagueSize)
      .filter((c) => c.seatId !== null && c.weeks.length > 0)
      .map((c) => ({ handle: deskHandleFor(c), given: c.weeks.reduce((a, w) => a + w.roadDollarsGiven, 0) }));
    const biggest = [...roadRows].sort((a, b) => b.given - a.given)[0];
    const givenAtom = claim("synth-road-given", biggest ? biggest.given : 0, "money", { assertsSign: "nonNegative" });
    const word = claimWord("synth-road-someone-else", "on somebody else's books", roadRows.length > 0);
    const body = biggest
      ? `${biggest.handle} put ${givenAtom.rendered} into other clubs' buildings over three weeks — money that landed ${word.rendered}, not theirs.`
      : "No week has been played yet, so the road ledger is empty.";
    cards.push({
      id: "shared-product",
      title: "MOST OF WHAT FILLED YOUR BUILDING WAS SOMEBODY ELSE'S TEAM",
      body,
      rails: {
        rememberWhen: "The week the rookie landed somewhere else and your building filled anyway — because of a club you do not run.",
        ourClass: body,
        inSports:
          "LeBron James left Cleveland in 2010 and that club's ticket demand and franchise value cratered — and thirty other buildings felt it too. The national television deal is about $76B over eleven years, 2025-26 through 2035-36, split equally, and it is several times any one club's gate.",
        economistsCall: "SHARED PRODUCT (joint product). SPILLOVER — an ECONOMIST would say EXTERNALITY.",
        outsideSports: "One great store that brings the whole mall its foot traffic. A street where one shop closing empties the block. A band that needs the other bands on the bill.",
      },
      claims: biggest ? [givenAtom, word] : [],
    });
  }

  /* --- C3 revenue composition --- */
  {
    const rows = state.clubs.slice(0, state.leagueSize).filter((c) => c.seatId !== null && c.weeks.length > 0);
    const gate = rows.reduce((a, c) => a + c.weeks.reduce((b, w) => b + w.home.gate, 0), 0);
    const national = rows.reduce((a, c) => a + c.weeks.length * NATIONAL, 0);
    const gateAtom = claim("synth-gate-total", gate, "money", { assertsSign: "nonNegative" });
    const natAtom = claim("synth-national-total", national, "money", { assertsSign: "nonNegative" });
    const word = claimWord("synth-national-bigger", "more than the whole room took at the gate", national > gate);
    const body =
      rows.length > 0
        ? `This room sold ${gateAtom.rendered} of tickets in three weeks. The national television check, which nobody in this room set and the pot never touched, was ${natAtom.rendered} — ${word.rendered}.`
        : "No week has been played yet, so there is nothing to decompose.";
    cards.push({
      id: "composition",
      title: "THE MONEY YOU CONTROL LEAST IS THE MONEY THAT PAYS YOU MOST",
      body,
      rails: {
        rememberWhen: "The week you looked at what your price actually earned next to the check that arrived whatever you did.",
        ourClass: body,
        inSports:
          "The Green Bay Packers are the only publicly owned club in the NFL and the only US major-league club that publishes audited books. FY2025, reported July 2026: $453.2M per club in shared national revenue, up 4.8%, on total Packers revenue of $719M — in a metro of about 320,000 people, the smallest market in American major professional sports. And the honest asterisk on the same page: that record-revenue year showed an OPERATING LOSS. Revenue is not profit.",
        economistsCall: "REVENUE COMPOSITION. FIXED versus VARIABLE revenue.",
        outsideSports: "A job with a base salary and tips. A farm with a subsidy and a harvest. What you control and what you receive are rarely the same money.",
      },
      claims: rows.length > 0 ? [gateAtom, natAtom, word] : [],
    });
  }

  /* --- C9 path dependence --- */
  {
    const seededWord = claimWord("synth-seeded", state.seeded ? "the books you built last lesson" : "a stock league nobody in this room built", state.seeded);
    const body = state.seeded
      ? `The league that wrote today's rule was made by this room: every club's Draw and every club's bank balance walked in from ${seededWord.rendered}.`
      : `This room opened on ${seededWord.rendered}, because no Lesson 2 session was linked to it. In a linked session the opening books are the room's own.`;
    cards.push({
      id: "path-dependence",
      title: "THE LEAGUE THAT VOTED WAS MADE BY THE ROOM THAT VOTED",
      body,
      rails: {
        rememberWhen: state.seeded
          ? "Your opening card today: the Draw and the bank balance you finished last lesson with, with your name on them."
          : "Your opening card today, and the spread across the league that you did not choose.",
        ourClass: body,
        inSports:
          "Seattle refused public arena money in 2006 and lost the Sonics to Oklahoma City in 2008. Climate Pledge Arena was later rebuilt with about $1.15B of PRIVATE money, and as of summer 2026 Seattle is a frontrunner for expansion. Milwaukee approved about $250M of public money in 2015 under an explicit relocation threat, kept the Bucks, and won the 2021 title. Both cities' verdicts are still open.",
        economistsCall: "PATH DEPENDENCE. Where you can go next depends on where you have already been.",
        outsideSports: "The subject you picked in eighth grade. A town that built its highway one way in 1960. Nothing about today started today.",
      },
      claims: [seededWord],
    });
  }

  /* --- C14 subsidy coda, synthesis only --- */
  cards.push({
    id: "subsidy-coda",
    title: "WHO PAYS FOR THE BUILDING?",
    body:
      "Nothing you played today was about public money — on purpose. But every arena in this league sits in a town that had to decide whether to help pay for it, and the mainstream economics finding is that stadium subsidies rarely pay off for the city that grants them.",
    rails: {
      rememberWhen: "Your building's weekly bill, on your own screen, every week — and the fact that somebody, somewhere, had to agree to build it.",
      ourClass: "Every club in this league operated a building it did not have to pay to construct. That was a simplification, and this card is where we admit it.",
      inSports:
        "Seattle, 2006: no public money, no team by 2008. Milwaukee, 2015: about $250M of public money under an explicit relocation threat, and a title in 2021. Seattle rebuilt privately for about $1.15B and may get a club back anyway.",
      economistsCall: "PUBLIC SUBSIDY. OPPORTUNITY COST — the money a town spends on an arena is money it does not spend on something else.",
      outsideSports: "Any time a town gives up money to keep something it wants. Outcome is not decision quality, in both directions.",
    },
    // No atoms, deliberately: every sentence on this card is dated real-world
    // content that Sports Reality owns and nothing here is computed from state.
    // `moduleClaims` still registers it, so a future computed line added here
    // without an atom is a detectable hole rather than an invisible one.
  });

  return cards;
}

/* ---------------------------------------------------------- moduleClaims -- */

export function moduleClaims(state: WriteRuleState): ClaimSurface[] {
  const agg = computeAggregate(state);
  const out: ClaimSurface[] = [];
  const push = (surface: string, c: Claimed): void => {
    if (c.claims.length > 0) out.push({ surface, text: c.text, claims: c.claims });
  };

  push("board:hook:split", hookSplitLineClaimed(agg));
  push("board:adoption", adoptionLineClaimed(agg));
  push("board:reveal-pot", potLineClaimed(agg));
  push("board:reveal-arrows", arrowLineClaimed(agg));
  push("board:consequence:era", reinvestEraLineClaimed(agg));
  push("board:counterfactual", counterfactualLineClaimed(agg));
  push("board:argue:kings", kingsSplitLineClaimed(agg));
  push("teach:consequence:answerKey", consequenceAnswerClaimed(state, agg));
  push("teach:reveal:mirror", revealMirrorClaimed(state, agg));
  for (const card of synthesisCards(state, agg)) {
    if (card.claims && card.claims.length > 0) push(`synthesis:${card.id}`, { text: card.body, claims: card.claims });
    else out.push({ surface: `synthesis:${card.id}`, text: card.body, claims: [] });
  }
  for (const row of agg.potFlows) {
    push(`play:desk-${row.deskNumber}:transferLine`, transferLineClaimed(row));
  }
  return out;
}

/** The paid-in / took-out attribution sentence, per desk (BC-6, fix 3). */
export function transferLineClaimed(row: PotFlowRow): Claimed {
  const paid = claim(`transfer-paid-${row.deskNumber}`, row.paidIn, "money", { assertsSign: "nonNegative" });
  const took = claim(`transfer-took-${row.deskNumber}`, row.tookOut, "money", { assertsSign: "nonNegative" });
  const net = claim(`transfer-net-${row.deskNumber}`, Math.abs(row.net), "money", { assertsSign: "nonNegative" });
  const word = claimWord(`transfer-direction-${row.deskNumber}`, row.net >= 0 ? "came to you" : "left you", row.net >= 0);
  return {
    text: `You paid ${paid.rendered} into the pot and took ${took.rendered} back out. On the pot alone, ${net.rendered} ${word.rendered}. Everything else your books did this season came off your own two dials.`,
    claims: [paid, took, net, word],
  };
}

export function consequenceAnswerClaimed(state: WriteRuleState, agg: WriteRuleAggregate): Claimed {
  const era = reinvestEraLineClaimed(agg);
  const dropped = agg.reinvestEra.filter((r) => r.l2 !== null && r.l3 < (r.l2 ?? 0) - 0.01).length;
  const droppedAtom = claim("consequence-dropped-desks", dropped, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.reinvestEra.length } });
  const word = claimWord("consequence-nobody-decided", "nobody had to decide to try less", dropped > 0);
  return {
    text: `${era.text} ${droppedAtom.rendered} desks put back less than they did last lesson — and ${word.rendered}. Ask the question, take the answers, and do not name moral hazard until somebody has described it.`,
    claims: [...era.claims, droppedAtom, word],
  };
}

export function revealMirrorClaimed(state: WriteRuleState, agg: WriteRuleAggregate): Claimed {
  const stage = claim("reveal-stage", state.revealStage, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: REVEAL_STEPS } });
  const total = claim("reveal-total", REVEAL_STEPS, "int", { assertsSign: "positive" });
  const word = claimWord("reveal-holding", state.revealStage >= REVEAL_STEPS ? "every beat is up" : "the projector is still holding", state.revealStage < REVEAL_STEPS);
  return {
    text: `Stage ${stage.rendered} of ${total.rendered} is on the projector — ${word.rendered}.`,
    claims: [stage, total, word],
  };
}

/* --------------------------------------------------------- reveal stages -- */

export function revealStagesFor(state: WriteRuleState): RevealStage[] {
  const agg = computeAggregate(state);
  const rule = agg.adopted;
  return [
    {
      stage: 1,
      name: "The rule, printed",
      headline: adoptionLineClaimed(agg).text,
      say: "Read it out loud exactly as it stands. Do not editorialise, and do not tell them yet whether it was a good rule.",
    },
    {
      stage: 2,
      name: "The pot forming",
      headline: potLineClaimed(agg).text,
      say: "Point at the money leaving desks and coming back out in equal portions. Ask nothing yet — let them watch it once.",
    },
    {
      stage: 3,
      name: "Paid in, took out",
      headline: `Every desk's own two numbers, side by side. ${BOARD_PRIVACY_LINE}`,
      say: "This is the column the room needs to attribute a gain. A desk that went up went up from the transfer, from its own dial, or from both — and now they can tell which.",
    },
    {
      stage: 4,
      name: "The arrow that moved, and the one that did not",
      headline: arrowLineClaimed(agg).text,
      say: `Ask it in these words: "why didn't ${flatDeskName(agg) ?? "the big market"} move?" The answer is on their own screen — their building was already full, and you cannot discount a seat you do not have.`,
    },
    {
      stage: 5,
      name: "What you changed about yourselves",
      headline: reinvestEraLineClaimed(agg).text,
      say:
        rule && rule.share >= 25
          ? "Nobody was told this would happen. Say that out loud before you say anything else."
          : "A low share, so the second bar may barely move. That is the honest result of the rule this room wrote, and it is worth the same six words: nobody was told this would happen.",
    },
  ];
}

export function flatDeskName(agg: WriteRuleAggregate): string | null {
  const flat = agg.arrows.filter((a) => a.priceSteps === 0 && a.soldOut);
  return flat.length > 0 ? flat[0]!.deskHandle : null;
}

/* --------------------------------------------------------- teacher aids -- */

export type WatchFlag = { id: string; label: string; desks: string[]; action: string; urgency: "now" | "later" };

export type DirectorPanel = {
  phase: CanonicalPhase;
  minuteBudget: string;
  now: string[];
  ask: { q: string; answer: string | null }[];
  dontExplainYet: string[];
  trigger: string | null;
  timeCut: string;
};

const TIME_CUT =
  "Past minute 46? The Kings vote is the designated cut — skip ARGUE and go straight to SYNTHESIS. The module survives without it, though it is the best six minutes in the track. Never cut the pot panel or the before/after bar.";

function rehearsalWatchFor(phase: CanonicalPhase): WatchFlag[] {
  const sample = (label: string, desks: string[], action: string, urgency: "now" | "later"): WatchFlag => ({
    id: `rehearsal-${label.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24)}`,
    label: `REHEARSAL — ${label}`,
    desks,
    action,
    urgency,
  });
  const flags = [
    sample(
      "this panel is a sample, because nobody has joined",
      ["Desk 1 · New York", "Desk 2 · Memphis"],
      "With a real class this panel is computed live and names your actual desks. You are seeing the shapes now so none of them is new to you on the day.",
      "now",
    ),
  ];
  if (phase === "PLAY") {
    flags.push(
      sample(
        "A BIG-MARKET desk arguing FOR sharing",
        ["Desk 1 · New York"],
        "Pull that voice immediately. It is the whole lesson: sharing is not charity here, it pays the payer through the product. Do not say that sentence — make them say it.",
        "now",
      ),
      sample(
        "Has proposed the same number three rounds running",
        ["Desk 4 · Oklahoma City"],
        "Ask them what would have to be true for them to move. Holding out is legitimate and it has a cost; both halves are teachable.",
        "later",
      ),
      sample(
        "Reinvest fell hard after the rule came in",
        ["Desk 2 · Memphis"],
        "Do not correct it. This is the moral-hazard beat arriving on its own, and you want it in their handwriting at CONSEQUENCE, not in yours now.",
        "later",
      ),
    );
  }
  return flags;
}

export function teacherWatchFor(state: WriteRuleState, phase: CanonicalPhase): WatchFlag[] {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  if (live.length === 0) return rehearsalWatchFor(phase);
  const out: WatchFlag[] = [];

  if (phase === "HOOK") {
    const undecided = live.filter((c) => c.hookPick === null).map(deskHandleFor);
    if (undecided.length > 0) {
      out.push({
        id: "hook-undecided",
        label: `${undecided.length} of ${live.length} desks have not locked a position on Boston`,
        desks: undecided,
        action: "Give them fifteen seconds, then reveal anyway. Nobody is scored on this and an undecided desk is not a problem — but a reveal with half the room still reading is.",
        urgency: "now",
      });
    }
  }

  if (phase === "PLAY" && state.stage === "rounds") {
    const notIn = live.filter((c) => c.proposal === null).map(deskHandleFor);
    if (notIn.length > 0) {
      out.push({
        id: "round-open",
        label: `${notIn.length} of ${live.length} desks have not put a number in this round`,
        desks: notIn,
        action: "Close the round when you are ready. A desk with no number in counts as the old 5% rule for the median, and its own screen says so — nobody is skipped.",
        urgency: "now",
      });
    }
    const bigFor = live
      .filter((c) => profileOf(c).sizeLabel === "BIG MARKET" && (c.proposal?.share ?? 0) >= 25)
      .map(deskHandleFor);
    if (bigFor.length > 0) {
      out.push({
        id: "big-for-sharing",
        label: "A BIG-MARKET desk is arguing FOR sharing",
        desks: bigFor,
        action: "Pull that voice right now. It is the whole lesson, and it lands ten times harder from a student than from you. Ask only: why would you pay for that?",
        urgency: "now",
      });
    }
    const holdouts = live
      .filter((c) => c.proposals.length >= 2 && c.proposals.every((p) => p && p.share === c.proposals[0]?.share))
      .map(deskHandleFor);
    if (holdouts.length > 0) {
      out.push({
        id: "holdouts",
        label: "Has not moved its number since round 1",
        desks: holdouts,
        action: "Ask what would have to be true for them to move. Holding out is a legitimate position with a real cost, and both halves are worth saying out loud.",
        urgency: "later",
      });
    }
  }

  if (phase === "PLAY" && state.stage === "season") {
    const stalled = live.filter((c) => !c.locked).map(deskHandleFor);
    if (stalled.length > 0) {
      out.push({
        id: "stalled",
        label: `${stalled.length} of ${live.length} desks have not locked this week`,
        desks: stalled,
        action: "Close the week when you are ready — an unlocked desk settles at its club's house price with nothing reinvested and is marked AUTO on its own screen. Nobody is skipped and nobody gets a zero.",
        urgency: "now",
      });
    }
    const rule = state.adopted;
    if (rule && rule.condition) {
      const under = live.filter((c) => c.reinvest < CONDITION_MIN_REINVEST).map(deskHandleFor);
      if (under.length > 0) {
        out.push({
          id: "condition-risk",
          label: `Below the ${CONDITION_MIN_REINVEST}% condition the room voted in`,
          desks: under,
          action: "Say nothing. They wrote this rule; letting it bite once is worth more than any warning, and their own screen will name the docked half at settlement.",
          urgency: "later",
        });
      }
    }
  }

  if (phase === "CONSEQUENCE" || phase === "SYNTHESIS") {
    const agg = computeAggregate(state);
    const dropped = agg.reinvestEra.filter((r) => r.l2 !== null && r.l3 < (r.l2 ?? 0) - 0.01);
    if (dropped.length > 0) {
      out.push({
        id: "effort-down",
        label: "Put back LESS this lesson than last lesson",
        desks: dropped.map((r) => r.deskHandle),
        action: "These are the desks to ask first. The question is never 'why did you stop trying' — it is 'did you decide to try less, or did it just stop being worth it?'",
        urgency: "now",
      });
    }
    const receivers = agg.potFlows.filter((f) => f.net > 0).map((f) => f.deskHandle);
    if (receivers.length > 0) {
      out.push({
        id: "receivers",
        label: "Took more out of the pot than they put in",
        desks: receivers,
        action: "Ask them what they would have done with the same money if it had been their own. Read the paid-in column, never the cash column — cash is never ranked here.",
        urgency: "later",
      });
    }
  }

  if (phase === "ARGUE") {
    const undecided = live.filter((c) => c.kingsVote === null).map(deskHandleFor);
    if (undecided.length > 0) {
      out.push({
        id: "kings-undecided",
        label: `${undecided.length} of ${live.length} desks have not voted on Sacramento`,
        desks: undecided,
        action: "Both term sheets are on their screens with the numbers. Give them thirty seconds and reveal — an undecided desk still argues.",
        urgency: "now",
      });
    }
  }

  return out;
}

function projectorMirror(state: WriteRuleState, phase: CanonicalPhase): { title: string; lines: string[] } {
  const agg = computeAggregate(state);
  const live = state.clubs.filter((c) => c.seatId !== null).length;
  switch (phase) {
    case "LOBBY":
      return {
        title: "The league, and how it got here",
        lines: [
          `Every club with its market, its building and the Draw it walks in on. ${state.leagueSize} clubs, ${live} of them run by a desk.`,
          state.seeded ? "The opening books are this room's own Lesson 2 numbers." : "No Lesson 2 session is linked, so the opening books are a stock spread and the board says so.",
        ],
      };
    case "HOOK":
      return {
        title: "Boston, June 2025 — pay it or break it up",
        lines: [
          "The real position as it stood, with the question under it. No result on screen until you press the reveal.",
          state.hookRevealed ? `The reveal is up: ${hookSplitLineClaimed(agg).text}` : "Nobody has seen what Boston did.",
        ],
      };
    case "PLAY": {
      if (state.stage === "rounds") {
        return {
          title: `Round ${Math.min(state.roundIndex + 1, ROUND_COUNT)} of ${ROUND_COUNT} — writing the rule`,
          lines: [
            state.closedRounds.length === 0
              ? "The veil announcement and the two dials. NO histogram — round 1 is deliberately blind so nobody copies the room."
              : `The anonymous histogram from round ${state.closedRounds.length}, unsorted, no names, no money, with the running middle number.`,
            "Lock progress only. Nothing about anybody's club is on this screen.",
          ],
        };
      }
      if (state.stage === "adopted") {
        return { title: "The rule, printed", lines: [adoptionLineClaimed(agg).text] };
      }
      return {
        title: `Week ${Math.min(state.weekIndex + 1, WEEK_COUNT)} of ${WEEK_COUNT} — living under it`,
        lines: [
          "The schedule and the rule in force, printed at the top of the frame where nobody can forget it.",
          state.rookieSlot !== null ? `The rookie card is up: ${CLUBS[state.rookieSlot]!.name}.` : "The rookie has not landed yet.",
        ],
      };
    }
    case "REVEAL": {
      const stage = revealStagesFor(state)[state.revealStage - 1] ?? null;
      return {
        title: stage ? `Stage ${stage.stage} of ${REVEAL_STEPS} — ${stage.name}` : "Waiting for the first press",
        lines: stage ? [stage.headline, stage.say] : ['An empty frame and "Waiting for your teacher to put up the first beat."'],
      };
    }
    case "CONSEQUENCE":
      return { title: "What you changed about yourselves", lines: [reinvestEraLineClaimed(agg).text, CONSEQUENCE_QUESTION] };
    case "COUNTERFACTUAL":
      return { title: "The rule you did not write", lines: [counterfactualLineClaimed(agg).text, COUNTERFACTUAL_HONESTY] };
    case "ARGUE":
      return {
        title: "SACRAMENTO, 2013 — the Board of Governors",
        lines: [state.kingsRevealed ? kingsSplitLineClaimed(agg).text : "Both term sheets, no result. Nobody has seen the vote.", ARGUE_PROMPT],
      };
    case "SYNTHESIS":
      return {
        title: "ECONOMICS YOU LEARNED",
        lines: [
          "ONE card at a time, in the order you press them. Five rails on every card, and the two that matter — REMEMBER WHEN and OUR CLASS — are computed from this class's own session.",
          "Every card is on the pairs' own screens too, so they can go back through them while you talk.",
        ],
      };
    case "COMPLETE":
      return { title: "Closing card", lines: [COMPLETE_COPY] };
    default:
      return { title: "", lines: [] };
  }
}

export function teacherDirector(state: WriteRuleState, phase: CanonicalPhase): DirectorPanel {
  const agg = computeAggregate(state);
  const live = state.clubs.filter((c) => c.seatId !== null).length;
  const locked = state.clubs.filter((c) => c.seatId !== null && c.locked).length;
  const submitted = state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length;

  switch (phase) {
    case "LOBBY":
      return {
        phase,
        minuteBudget: "2 min",
        now: [
          "Pairs join at /play on one device. Clubs are handed out by desk number, visibly.",
          state.seeded
            ? "Read one 'how you got here' card out loud — a desk's own Draw and bank balance from last lesson, with its name on it."
            : "No Lesson 2 session is linked. Say so plainly: today's league is a stock spread, and it is still this room's league by the end of the hour.",
          `${live} desk${live === 1 ? "" : "s"} in so far, in a ${state.leagueSize}-club league.`,
        ],
        ask: [{ q: "Whose building are you running, and is it a big market or a small one?", answer: "Both answers are on their own screen. You are only making sure every pair has found theirs before the vote." }],
        dontExplainYet: [
          "REVENUE SHARING. The words are the last thing said today, not the first.",
          "The word INCENTIVE. Same rule.",
          "Do not hint that big and small markets should want different rules. That discovery is the lesson.",
        ],
        trigger: live === 0 ? "Nobody has joined yet. The join URL and code are at the top of this console." : null,
        timeCut: TIME_CUT,
      };

    case "HOOK":
      return {
        phase,
        minuteBudget: "5 min",
        now: [
          "Read Boston's position off the board slowly. Ageing roster, injured star, ownership sale in progress, a bill north of $500M.",
          "Every pair locks PAY IT or BREAK IT UP on their own screen. Thirty seconds, no discussion.",
          state.hookRevealed
            ? "The reveal is up. Give the counter-case the same weight as the main case — Oklahoma City traded Harden in 2012 and won the title in 2025."
            : `${live - agg.hookSplit.undecided}/${live} desks have locked. Press the reveal when you are ready.`,
        ],
        ask: [
          { q: HOOK_BOARD_QUESTION, answer: "Take two answers and move on. The honest answer is that a price lets you choose and pay, and they will get there themselves in about twenty-five minutes." },
          { q: "If you were Boston, what would you need to know that the board does not tell you?", answer: "Anything is fine. This is a warm-up for holding a decision under incomplete information, not a quiz." },
        ],
        dontExplainYet: [
          "The words INCENTIVE and REVENUE SHARING. Not one of them today until SYNTHESIS.",
          "Do not say whether Boston was right. There is no score anywhere in this lesson and saying so is worth more than any verdict.",
        ],
        trigger: state.hookRevealed ? null : "Press the commit reveal to show what Boston did.",
        timeCut: TIME_CUT,
      };

    case "PLAY": {
      if (state.stage === "rounds") {
        return {
          phase,
          minuteBudget: "8 min for all three rounds",
          now: [
            "Read the veil announcement TWICE, word for word: the rule binds two seasons, and next season one club in this room gets a rookie who moves buildings. Nobody knows which.",
            `Round ${Math.min(state.roundIndex + 1, ROUND_COUNT)} of ${ROUND_COUNT}. ${submitted}/${live} desks have a number in.`,
            state.closedRounds.length === 0
              ? "Round 1 shows NO histogram. That is deliberate — a room that sees the median first writes the median, and then nobody has reasoned."
              : "The histogram is up: anonymous, unsorted, no money, no names.",
          ],
          ask: [
            { q: "Somebody at the low end — why?", answer: "Never editorialise. Collect it and move to the next voice." },
            { q: "Somebody at the high end — why?", answer: "Same. Two voices per round, and no evaluation of either." },
          ],
          dontExplainYet: [
            "That a big market might WANT to pay. If you say it, you have taken the discovery.",
            "Anything about what a high share will do to effort. That is the whole back half of the lesson.",
          ],
          trigger:
            state.roundIndex >= ROUND_COUNT - 1
              ? "After this round: press the rule step once more to run the two-thirds test and print the rule."
              : "Press the rule step to close this round and put the histogram up.",
          timeCut: TIME_CUT,
        };
      }
      if (state.stage === "adopted") {
        const rule = state.adopted!;
        return {
          phase,
          minuteBudget: "2 min",
          now: [
            adoptionLineClaimed(agg).text,
            rule.how === "voted"
              ? "Print it and read it. Do not congratulate the room and do not warn them about anything."
              : STATUS_QUO_COPY,
          ],
          ask: [{ q: "Whose money is this rule about to move?", answer: "Anything. You are only making sure they know the rule is live before they touch a dial." }],
          dontExplainYet: ["What the rule will do to the reinvest dial. Twelve minutes from now they will show you."],
          trigger: "Close the first week when the room is ready.",
          timeCut: TIME_CUT,
        };
      }
      return {
        phase,
        minuteBudget: state.weekIndex >= WEEK_COUNT ? "wrap up — move to REVEAL" : "12 min for three weeks",
        now:
          state.weekIndex >= WEEK_COUNT
            ? ["All three weeks are in the books. Advance to REVEAL and stage the rest one beat at a time."]
            : [
                `Week ${state.weekIndex + 1} of ${WEEK_COUNT}. ${locked}/${live} desks locked in.`,
                state.rookieSlot !== null
                  ? `The rookie has landed at ${CLUBS[state.rookieSlot]!.name}. Read the card, including the part where we say this is NOT how the real league does it.`
                  : "The rookie lands after week 1. Say nothing about who might get it — nobody knows, including you.",
                "The rule in force is printed at the top of every screen. Do not remind anybody what it does.",
              ],
        ask: [
          { q: "What did you change about your dials this week, and why?", answer: "Collect. The good version of this answer names the rule, and it is worth waiting for." },
        ],
        dontExplainYet: ["MORAL HAZARD, by any name. It arrives at CONSEQUENCE from a student's mouth or not at all."],
        trigger: state.weekIndex === 1 && state.rookieSlot !== null ? "The rookie card is live on the board. Read it before anybody prices week 2." : null,
        timeCut: TIME_CUT,
      };
    }

    case "REVEAL": {
      const next = revealStagesFor(state)[state.revealStage] ?? null;
      return {
        phase,
        minuteBudget: "5 min, five beats",
        now: [
          next ? `Next press: stage ${next.stage} of ${REVEAL_STEPS} — ${next.name}.` : "Every beat is up.",
          revealMirrorClaimed(state, agg).text,
        ],
        ask: [{ q: `Why didn't ${flatDeskName(agg) ?? "the biggest building in the room"} move?`, answer: "Their building was already full. You cannot discount a seat you do not have — the tax hits what you sell, and what they sell is capped." }],
        dontExplainYet: ["The before/after effort bar. It is stage 5 and it is the one that has to land last."],
        trigger: null,
        timeCut: TIME_CUT,
      };
    }

    case "CONSEQUENCE":
      return {
        phase,
        minuteBudget: "6 min",
        now: [consequenceAnswerClaimed(state, agg).text, "Take three answers before you name anything. The room will describe moral hazard before it has a word for it, and that is the order you want."],
        ask: [
          { q: CONSEQUENCE_QUESTION, answer: "The answer you are fishing for is the second half: it stopped being worth it. Nobody decided anything." },
          { q: "Who did the money you paid in actually help — and did any of it come back to you?", answer: "Both halves are true and both are on the pot column. The product they visit is the channel it comes back through." },
        ],
        dontExplainYet: ["The Kings vote. It is a different beat and it needs a clean start."],
        trigger: null,
        timeCut: TIME_CUT,
      };

    case "COUNTERFACTUAL":
      return {
        phase,
        minuteBudget: "3 min",
        now: [counterfactualLineClaimed(agg).text, `Read the honesty line out loud, exactly: "${COUNTERFACTUAL_HONESTY}"`],
        ask: [{ q: "Would you have played the same way under that rule?", answer: "There is no way to know, and saying so is the point. This is the limit of every counterfactual anybody will ever show them." }],
        dontExplainYet: ["Nothing left to hold back. Say what you like from here."],
        trigger: state.counterfactualRun ? null : "Press the counterfactual to replay the season under the runner-up share.",
        timeCut: TIME_CUT,
      };

    case "ARGUE":
      return {
        phase,
        minuteBudget: "6 min — THE DESIGNATED CUT",
        now: [
          "Read both term sheets. Seattle's offer is worth more money; Sacramento's keeps the club where it is. Every pair locks a vote.",
          state.kingsRevealed ? kingsSplitLineClaimed(agg).text : `${live - agg.kingsSplit.undecided}/${live} desks have voted. Press the commit reveal when you are ready.`,
        ],
        ask: [
          { q: ARGUE_PROMPT, answer: "There is no right answer and the real vote was 22-8, not unanimous. Eight owners voted the other way and they were not stupid." },
          { q: "Seattle offered MORE money and lost. What were the owners buying instead?", answer: "Anything about the league as a product, about other cities' leverage, or about what a move does to the value of everybody else's club." },
        ],
        dontExplainYet: ["Nothing. This is the last held card in the module."],
        trigger: state.kingsRevealed ? null : "Press the commit reveal to show the 22-8 vote.",
        timeCut: "If you are past minute 46 when CONSEQUENCE ends, skip this phase entirely and go to SYNTHESIS. It is the best six minutes in the track and it is still the right thing to cut.",
      };

    case "SYNTHESIS":
      return {
        phase,
        minuteBudget: "7 min",
        now: [
          "One card at a time. Read the title, then REMEMBER WHEN, then OUR CLASS — those two are this room's own session, and they are why this is not a glossary.",
          "The pairs have the whole set on their own screens and can go back through them while you talk.",
          `Three rules, three worlds: this room's ${agg.adopted?.share ?? STATUS_QUO_SHARE}%, the NBA's, and the NFL's near-total national split.`,
        ],
        ask: [{ q: EXIT_PROMPT, answer: "The best answers name a dial and a rule in the same sentence. That sentence is the whole module." }],
        dontExplainYet: ["Nothing is held back at SYNTHESIS. This is where the words are given."],
        trigger: null,
        timeCut: "Never cut SYNTHESIS. Cut ARGUE instead — it is the only phase in this lesson designed to be dropped.",
      };

    case "COMPLETE":
      return {
        phase,
        minuteBudget: "1 min",
        now: [COMPLETE_COPY, `This room's rule: SHARE ${agg.adopted?.share ?? STATUS_QUO_SHARE}% · ${agg.adopted?.condition ? "CONDITION ON" : "CONDITION OFF"}.`],
        ask: [],
        dontExplainYet: [],
        trigger: null,
        timeCut: TIME_CUT,
      };

    default:
      return { phase, minuteBudget: "", now: [], ask: [], dontExplainYet: [], trigger: null, timeCut: TIME_CUT };
  }
}

/* ----------------------------------------------------- view builders -- */

function clubCard(state: WriteRuleState, slot: number) {
  const club = state.clubs[slot]!;
  const def = defOf(club);
  const profile = profileOf(club);
  return {
    slot,
    deskNumber: club.deskNumber,
    club: def.name,
    short: def.short,
    building: def.building,
    capacity: def.capacity,
    capacityNote: def.capacityNote,
    sizeLabel: profile.sizeLabel,
    plainLine: profile.plainLine,
    ...(def.identityLine ? { identityLine: def.identityLine } : {}),
    draw: club.draw,
    bill: profile.bill,
    ancillary: profile.ancillary,
    live: club.seatId !== null,
    handle: deskHandleFor(club),
  };
}

const leagueTable = (state: WriteRuleState) =>
  state.clubs.slice(0, state.leagueSize).map((c) => ({
    deskNumber: c.deskNumber,
    short: defOf(c).short,
    sizeLabel: profileOf(c).sizeLabel,
    draw: c.draw,
    live: c.seatId !== null,
  }));

function slateFor(state: WriteRuleState, slot: number) {
  const out = [];
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const v = visitorSlotFor(slot, w, state.leagueSize);
    const h = hostSlotFor(slot, w, state.leagueSize);
    out.push({
      week: w + 1,
      open: w === state.weekIndex && state.stage === "season",
      settled: w < state.weekIndex,
      hosting: { short: defOf(state.clubs[v]!).short, draw: state.clubs[v]!.draw },
      visiting: { short: defOf(state.clubs[h]!).short, draw: state.clubs[h]!.draw },
    });
  }
  return out;
}

function viewWeek(state: WriteRuleState, club: Club, w: SettledWeek) {
  const def = defOf(club);
  const profile = profileOf(club);
  const flowRow: PotFlowRow = {
    deskHandle: deskHandleFor(club),
    deskNumber: club.deskNumber,
    sizeLabel: profile.sizeLabel,
    paidIn: w.pot.paidIn,
    tookOut: w.pot.tookOut,
    net: w.pot.net,
    ownDialDelta: w.cashDelta - w.pot.net,
    docked: w.pot.docked,
    paidInText: money(w.pot.paidIn),
    tookOutText: money(w.pot.tookOut),
    netText: money(w.pot.net),
  };
  const transfer = transferLineClaimed(flowRow);
  return {
    week: w.week + 1,
    price: w.price,
    reinvest: w.reinvest,
    auto: w.auto,
    visitor: defOf(state.clubs[w.visitorSlot]!).short,
    visitorDraw: w.visitorDrawAtTip,
    turnout: w.home.turnout,
    capacity: def.capacity,
    soldOut: w.home.soldOut,
    turnedAway: w.home.turnedAway,
    gate: w.home.gate,
    inArena: w.home.inArena,
    localMedia: w.localMedia,
    national: w.national,
    bill: w.bill,
    reinvestSpend: w.reinvestSpend,
    paidIn: w.pot.paidIn,
    tookOut: w.pot.tookOut,
    potNet: w.pot.net,
    docked: w.pot.docked,
    cashDelta: w.cashDelta,
    cashAfter: w.cashAfter,
    drawAfter: w.drawAfter,
    roadDollarsGiven: w.roadDollarsGiven,
    transferLine: transfer.text,
  };
}

const ruleView = (state: WriteRuleState) =>
  state.adopted
    ? {
        share: state.adopted.share,
        condition: state.adopted.condition,
        how: state.adopted.how,
        supporting: state.adopted.supporting,
        liveDesks: state.adopted.liveDesks,
        conditionMin: CONDITION_MIN_REINVEST,
      }
    : null;

/* --------------------------------------------------------------- module -- */

function requireLiveClub(state: WriteRuleState, seatId: SeatId): { ok: true; club: Club } | { ok: false; reason: string } {
  const slot = state.seatToSlot[seatId];
  if (slot === undefined) return { ok: false, reason: "this seat has no club yet" };
  const club = state.clubs[slot];
  if (!club) return { ok: false, reason: "this seat has no club yet" };
  return { ok: true, club };
}

const withClub = (state: WriteRuleState, club: Club): WriteRuleState => {
  const clubs = state.clubs.slice();
  clubs[club.slot] = club;
  return { ...state, clubs };
};

export function closeRound(state: WriteRuleState): WriteRuleState {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const shares = live.map((c) => c.proposal?.share ?? STATUS_QUO_SHARE);
  const conditions = live.map((c) => c.proposal?.condition ?? STATUS_QUO_CONDITION);
  const closed = {
    round: state.roundIndex + 1,
    shares,
    conditions,
    median: snapShare(medianOf(shares)),
  };
  const clubs = state.clubs.map((c) =>
    c.seatId !== null && c.slot < state.leagueSize ? { ...c, proposals: [...c.proposals, c.proposal] } : c,
  );
  return {
    ...state,
    clubs,
    closedRounds: [...state.closedRounds, closed],
    roundIndex: state.roundIndex + 1,
    leagueFrozen: true,
  };
}

export function adoptRule(state: WriteRuleState): WriteRuleState {
  const outcome = runAdoption(state);
  return { ...state, adopted: outcome.adopted, stage: "adopted" };
}

export function adoptLeagueOfficeRule(state: WriteRuleState): WriteRuleState {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize).length;
  return {
    ...state,
    adopted: {
      share: REAL_RULE_SHARE,
      condition: REAL_RULE_CONDITION,
      how: "leagueOffice",
      supporting: 0,
      liveDesks: live,
      median: REAL_RULE_SHARE,
      runnerUp: STATUS_QUO_SHARE,
    },
    stage: "adopted",
  };
}

export const writeTheRuleModule: LessonModule<WriteRuleState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 3 — Writing the Rule",
  phases: PHASES,

  initialState(input) {
    const clubs: Club[] = [];
    for (let i = 0; i < MIN_LEAGUE; i += 1) clubs.push(makeClub(i));
    const carried = extractCarriedClubs(input.seed);
    let seeded = false;
    let l2MeanReinvest: number | null = null;
    if (carried.length > 0) {
      seeded = true;
      const means: number[] = [];
      for (const row of carried) {
        while (clubs.length <= row.slot) clubs.push(makeClub(clubs.length));
        clubs[row.slot] = {
          ...clubs[row.slot]!,
          draw: row.draw,
          cash: row.cash,
          l2Reinvest: row.meanReinvest,
          l2Cash: row.cash,
        };
        if (row.meanReinvest !== null) means.push(row.meanReinvest);
      }
      if (means.length > 0) l2MeanReinvest = means.reduce((a, b) => a + b, 0) / means.length;
    }
    return {
      clubs,
      seatToSlot: {},
      deskCount: 0,
      leagueSize: Math.max(MIN_LEAGUE, Math.min(clubs.length, MIN_LEAGUE)),
      leagueFrozen: false,
      seeded,
      seedNote: seeded
        ? "Every club's Draw and bank balance walked in from this room's own Lesson 2 session."
        : "No Lesson 2 session is linked, so the league opens on a stock spread. Nothing else about the lesson changes.",
      l2MeanReinvest,
      hookRevealed: false,
      stage: "rounds",
      roundIndex: 0,
      closedRounds: [],
      adopted: null,
      weekIndex: 0,
      rookieSlot: null,
      revealStage: 0,
      counterfactualRun: false,
      kingsRevealed: false,
      synthPage: 0,
      finalePage: 0,
    };
  },

  /**
   * Manual-fallback discipline: nothing in this lesson depends on a click that
   * may never come. Leaving HOOK reveals Boston; leaving PLAY closes every round
   * still open, adopts whatever the room has, and settles every remaining week;
   * leaving REVEAL plays out every stage; leaving COUNTERFACTUAL runs the replay;
   * leaving ARGUE reveals the Kings vote.
   */
  onPhaseExit(state, fromPhase) {
    let next = state;
    if (fromPhase === "HOOK") next = { ...next, hookRevealed: true, leagueFrozen: true };
    if (fromPhase === "PLAY") {
      while (next.stage === "rounds" && next.roundIndex < ROUND_COUNT) next = closeRound(next);
      if (next.stage === "rounds") next = adoptRule(next);
      if (next.stage === "adopted") next = { ...next, stage: "season" };
      let first = true;
      while (next.weekIndex < WEEK_COUNT) {
        next = settleWeek(next, first);
        first = false;
      }
      next = { ...next, stage: "seasonDone" };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    if (fromPhase === "COUNTERFACTUAL" && !next.counterfactualRun) next = { ...next, counterfactualRun: true };
    if (fromPhase === "ARGUE") next = { ...next, kingsRevealed: true };
    return next;
  },

  reduce(state, action: LessonAction, ctx: ReduceContext): ReduceResult<WriteRuleState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a club" };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: false, reason: `clubs are handed out in LOBBY, HOOK or PLAY (session is in ${ctx.phase})` };
      }
      return seatDesk(state, ctx.seatId);
    }

    if (action.type === "hookPick") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a position" };
      if (ctx.phase !== "HOOK") return { ok: false, reason: `Boston is decided in HOOK (session is in ${ctx.phase})` };
      if (state.hookRevealed) return { ok: false, reason: "the reveal has already played" };
      const choice = action["choice"];
      if (choice !== "pay" && choice !== "breakup") return { ok: false, reason: "choose pay it or break it up" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      return { ok: true, state: withClub(state, { ...open.club, hookPick: choice }) };
    }

    if (action.type === "propose") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair proposes a rule" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the rule is written in PLAY (session is in ${ctx.phase})` };
      if (state.stage !== "rounds") return { ok: false, reason: "the offer rounds are closed" };
      const share = action["share"];
      const condition = action["condition"];
      if (!isValidShare(share)) return { ok: false, reason: `share must be ${SHARE_MIN}-${SHARE_MAX}% in ${SHARE_STEP}-point steps` };
      if (typeof condition !== "boolean") return { ok: false, reason: "condition must be on or off" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      return { ok: true, state: withClub(state, { ...open.club, proposal: { share, condition } }) };
    }

    if (action.type === "setPrice" || action.type === "setReinvest" || action.type === "lock") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can work a club" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only run a week during PLAY (session is in ${ctx.phase})` };
      if (state.stage !== "season") return { ok: false, reason: "the season has not opened yet" };
      if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "all three weeks are in the books" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      if (open.club.locked) return { ok: false, reason: "this week is already locked in" };
      if (action.type === "setPrice") {
        if (!isValidPrice(action["price"])) return { ok: false, reason: `price must be $${PRICE_MIN}-$${PRICE_MAX} in $${PRICE_STEP} steps` };
        return { ok: true, state: withClub(state, { ...open.club, price: action["price"] as number }) };
      }
      if (action.type === "setReinvest") {
        if (!isValidReinvest(action["reinvest"])) {
          return { ok: false, reason: `reinvest must be ${REINVEST_MIN}-${REINVEST_MAX}% in ${REINVEST_STEP}-point steps` };
        }
        return { ok: true, state: withClub(state, { ...open.club, reinvest: action["reinvest"] as number }) };
      }
      return { ok: true, state: { ...withClub(state, { ...open.club, locked: true }), leagueFrozen: true } };
    }

    if (action.type === "kingsVote") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair votes" };
      if (ctx.phase !== "ARGUE") return { ok: false, reason: `the Board of Governors votes in ARGUE (session is in ${ctx.phase})` };
      if (state.kingsRevealed) return { ok: false, reason: "the vote has already been read out" };
      const choice = action["choice"];
      if (choice !== "deny" && choice !== "approve") return { ok: false, reason: "vote deny or approve" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      return { ok: true, state: withClub(state, { ...open.club, kingsVote: choice }) };
    }

    /* ------------------------------------------------------ teacher hooks -- */

    if (action.type === "teacher:commitReveal") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher runs a reveal" };
      if (ctx.phase === "HOOK") {
        if (state.hookRevealed) return { ok: false, reason: "Boston's reveal has already played" };
        return { ok: true, state: { ...state, hookRevealed: true } };
      }
      if (ctx.phase === "ARGUE") {
        if (state.kingsRevealed) return { ok: false, reason: "the 22-8 vote is already up" };
        return { ok: true, state: { ...state, kingsRevealed: true } };
      }
      return { ok: false, reason: `there is no commit reveal in ${ctx.phase}` };
    }

    if (action.type === "teacher:ruleStep") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher paces the rule" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the rule is written in PLAY (session is in ${ctx.phase})` };
      if (state.stage === "rounds") {
        if (state.roundIndex < ROUND_COUNT) return { ok: true, state: closeRound(state) };
        return { ok: true, state: adoptRule(state) };
      }
      if (state.stage === "adopted") return { ok: true, state: { ...state, stage: "season" } };
      return { ok: false, reason: "the season is already running" };
    }

    if (action.type === "teacher:realRule") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher can operate the league office's rule" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the fallback rule is set in PLAY (session is in ${ctx.phase})` };
      if (state.stage === "season" || state.stage === "seasonDone") return { ok: false, reason: "the season is already running under a rule" };
      return { ok: true, state: adoptLeagueOfficeRule(state) };
    }

    if (action.type === "teacher:closeWeek") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher closes the week" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `weeks close during PLAY (session is in ${ctx.phase})` };
      if (state.stage === "rounds" || state.stage === "adopted") return { ok: false, reason: "the season has not opened yet — finish the rule first" };
      if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "all three weeks are already in the books" };
      return { ok: true, state: settleWeek({ ...state, leagueFrozen: true }, false) };
    }

    if (action.type === "teacher:revealNext") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher advances the reveal" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the reveal advances during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= REVEAL_STEPS) return { ok: false, reason: "every reveal stage has already played" };
      return { ok: true, state: { ...state, revealStage: state.revealStage + 1 } };
    }

    if (action.type === "teacher:counterfactual") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher runs the counterfactual" };
      if (ctx.phase !== "COUNTERFACTUAL") return { ok: false, reason: `the replay runs in COUNTERFACTUAL (session is in ${ctx.phase})` };
      if (state.counterfactualRun) return { ok: false, reason: "the replay is already on the projector" };
      return { ok: true, state: { ...state, counterfactualRun: true } };
    }

    if (action.type === "teacher:synthPage" || action.type === "teacher:synthPageBack") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the synthesis" };
      if (ctx.phase !== "SYNTHESIS") return { ok: false, reason: `the cards are paged in SYNTHESIS (session is in ${ctx.phase})` };
      const total = synthPageCount(synthesisCards(state, computeAggregate(state)).length);
      const delta = action.type === "teacher:synthPage" ? 1 : -1;
      return { ok: true, state: { ...state, synthPage: (state.synthPage + delta + total) % total } };
    }

    return { ok: false, reason: `unknown action ${action.type}` };
  },

  allowedActions(phase) {
    switch (phase) {
      case "LOBBY":
        return ["takeSeat"];
      case "HOOK":
        return ["takeSeat", "hookPick", "teacher:commitReveal"];
      case "PLAY":
        return ["takeSeat", "propose", "setPrice", "setReinvest", "lock", "teacher:ruleStep", "teacher:realRule", "teacher:closeWeek"];
      case "REVEAL":
        return ["teacher:revealNext"];
      case "COUNTERFACTUAL":
        return ["teacher:counterfactual"];
      case "ARGUE":
        return ["kingsVote", "teacher:commitReveal"];
      case "SYNTHESIS":
        return ["teacher:synthPage", "teacher:synthPageBack"];
      default:
        return [];
    }
  },

  studentView(state, seatId, phase) {
    const slot = state.seatToSlot[seatId];
    if (slot === undefined) return tag({ seated: false, message: "Finding your club…" });
    const club = state.clubs[slot]!;
    const agg = computeAggregate(state);
    const card = clubCard(state, slot);
    const base = {
      seated: true,
      ...card,
      cash: club.cash,
      crestIndex: slot % 12,
      rule: ruleView(state),
      horizonLine: HORIZON_LINE,
      modeledDollarsLine: MODELED_DOLLARS_LINE,
      seedNote: state.seedNote,
      seeded: state.seeded,
      ...(club.l2Reinvest !== null ? { l2Reinvest: Math.round(club.l2Reinvest * 10) / 10 } : {}),
    };
    switch (phase) {
      case "LOBBY":
        return tag({ ...base, message: LOBBY_COPY, houseRules: HOUSE_RULES, league: leagueTable(state) });
      case "HOOK":
        return tag({
          ...base,
          message: HOOK_COPY,
          question: HOOK_QUESTION,
          pick: club.hookPick,
          revealed: state.hookRevealed,
          ...(state.hookRevealed ? { revealCopy: HOOK_REVEAL_COPY, split: agg.hookSplit } : {}),
          league: leagueTable(state),
        });
      case "PLAY": {
        if (state.stage === "rounds") {
          return tag({
            ...base,
            mode: "rounds",
            round: Math.min(state.roundIndex + 1, ROUND_COUNT),
            roundCount: ROUND_COUNT,
            veil: VEIL_COPY,
            ruleCopy: RULE_COPY,
            adoptCopy: ADOPT_COPY,
            proposal: club.proposal,
            proposals: club.proposals,
            // BC-6 fix 2: the histogram is withheld until round 1 has closed.
            histogram: state.closedRounds.length > 0 ? agg.rounds[agg.rounds.length - 1] : null,
            histogramHeld: state.closedRounds.length === 0,
            shareGrid: SHARE_GRID,
            conditionMin: CONDITION_MIN_REINVEST,
            league: leagueTable(state),
          });
        }
        if (state.stage === "adopted") {
          return tag({ ...base, mode: "adopted", adoption: adoptionLineClaimed(agg).text, seasonCopy: SEASON_COPY, league: leagueTable(state) });
        }
        const week = Math.min(state.weekIndex, WEEK_COUNT - 1);
        const vSlot = visitorSlotFor(slot, week, state.leagueSize);
        return tag({
          ...base,
          mode: "season",
          weekNumber: week + 1,
          weekCount: WEEK_COUNT,
          done: state.weekIndex >= WEEK_COUNT,
          price: club.price,
          reinvest: club.reinvest,
          locked: club.locked,
          priceMin: PRICE_MIN,
          priceMax: PRICE_MAX,
          priceStep: PRICE_STEP,
          reinvestMin: REINVEST_MIN,
          reinvestMax: REINVEST_MAX,
          reinvestStep: REINVEST_STEP,
          visitor: { short: defOf(state.clubs[vSlot]!).short, draw: state.clubs[vSlot]!.draw, deskNumber: state.clubs[vSlot]!.deskNumber, live: state.clubs[vSlot]!.seatId !== null },
          slate: slateFor(state, slot),
          weeks: club.weeks.map((w) => viewWeek(state, club, w)),
          ...(state.rookieSlot !== null
            ? { rookie: { club: CLUBS[state.rookieSlot]!.short, mine: state.rookieSlot === slot, copy: ROOKIE_COPY } }
            : {}),
          noPreview: "No preview. Your dials show dollars and nothing else — what you have is your own history and the rule the room wrote.",
        });
      }
      case "REVEAL":
      case "CONSEQUENCE":
        return tag({
          ...base,
          message: "Look up at the board — and check your own transfer column while you do.",
          weeks: club.weeks.map((w) => viewWeek(state, club, w)),
          transfer: agg.potFlows.find((f) => f.deskNumber === club.deskNumber) ?? null,
          question: CONSEQUENCE_QUESTION,
        });
      case "COUNTERFACTUAL":
        return tag({ ...base, message: COUNTERFACTUAL_HONESTY, weeks: club.weeks.map((w) => viewWeek(state, club, w)) });
      case "ARGUE":
        return tag({
          ...base,
          message: ARGUE_COPY,
          prompt: ARGUE_PROMPT,
          vote: club.kingsVote,
          revealed: state.kingsRevealed,
          ...(state.kingsRevealed ? { revealCopy: ARGUE_REVEAL_COPY, split: agg.kingsSplit } : {}),
        });
      case "SYNTHESIS":
        return tag({
          ...base,
          message: "Look up at the board. Every card is here too — scroll back through them any time.",
          exitPrompt: EXIT_PROMPT,
          cards: synthesisCards(state, agg),
          simplifications: SIMPLIFICATIONS,
          sources: SOURCE_NOTES,
        });
      case "COMPLETE":
        return tag({ ...base, message: COMPLETE_COPY, rule: ruleView(state) });
      default:
        return tag({ ...base, message: "" });
    }
  },

  teacherView(state, phase) {
    const agg = computeAggregate(state);
    const live = state.clubs.filter((c) => c.seatId !== null).length;
    const nextStage = state.revealStage < REVEAL_STEPS ? revealStagesFor(state)[state.revealStage] ?? null : null;
    return tag({
      phase,
      leagueSize: state.leagueSize,
      deskCount: live,
      lockedCount: state.clubs.filter((c) => c.seatId !== null && c.locked).length,
      proposalCount: state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length,
      stage: state.stage,
      round: Math.min(state.roundIndex + 1, ROUND_COUNT),
      roundCount: ROUND_COUNT,
      weekNumber: Math.min(state.weekIndex + 1, WEEK_COUNT),
      weekCount: WEEK_COUNT,
      allWeeksDone: state.weekIndex >= WEEK_COUNT,
      seasonOpen: state.stage === "season",
      rule: ruleView(state),
      adoptionLine: adoptionLineClaimed(agg).text,
      hookRevealed: state.hookRevealed,
      kingsRevealed: state.kingsRevealed,
      counterfactualRun: state.counterfactualRun,
      ruleStepLabel:
        state.stage === "rounds"
          ? state.roundIndex < ROUND_COUNT
            ? `Close round ${state.roundIndex + 1} of ${ROUND_COUNT} (${state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length}/${live} in)`
            : "Run the two-thirds test and print the rule"
          : state.stage === "adopted"
            ? "Open the season under this rule"
            : "The season is running",
      ruleStepAvailable: state.stage === "rounds" || state.stage === "adopted",
      ruleStepWarn:
        state.stage === "rounds" && state.roundIndex < ROUND_COUNT && state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length === 0 && live > 0
          ? `Nobody has put a number in yet — 0 of ${live} desks. Closing the round now records every desk at the old 5% rule. Close it anyway?`
          : state.stage === "rounds" && state.roundIndex >= ROUND_COUNT
            ? "This runs the two-thirds test and prints the rule this room will play under. It cannot be re-run. Print it?"
            : null,
      realRuleAvailable: state.stage === "rounds" || state.stage === "adopted",
      realRuleWarn: `This replaces the room's own vote with the league office's rule (SHARE ${REAL_RULE_SHARE}% · CONDITION ${REAL_RULE_CONDITION ? "ON" : "OFF"}) and cannot be undone. Use it if the room cannot agree or the period has run short. Operate the league office's rule?`,
      commitRevealAvailable: (phase === "HOOK" && !state.hookRevealed) || (phase === "ARGUE" && !state.kingsRevealed),
      commitRevealLabel: phase === "ARGUE" ? "Read the 22-8 vote" : "Show what Boston did",
      commitRevealWarn:
        phase === "ARGUE"
          ? `This reads out the owners' vote. ${agg.kingsSplit.undecided} desk(s) have not voted yet and will not be able to after this. Reveal?`
          : `This shows what Boston did. ${agg.hookSplit.undecided} desk(s) have not locked a position and will not be able to after this. Reveal?`,
      closeWeekWarn:
        state.stage === "season" && state.clubs.filter((c) => c.seatId !== null && c.locked).length === 0 && live > 0
          ? `Nobody has locked in yet — 0 of ${live} desks. The week bell settles week ${state.weekIndex + 1} for every building at once, and every desk that has not locked settles at its club's house price with nothing reinvested, marked AUTO. Ring it anyway?`
          : null,
      bellNote: "Every building settles at once against the Draws printed before anybody touched a dial. An unlocked desk settles at its club's house price with nothing reinvested and is marked AUTO on its own screen.",
      nextRevealStage: nextStage ? { stage: nextStage.stage, name: nextStage.name } : null,
      totalRevealSteps: REVEAL_STEPS,
      synthPageAvailable: phase === "SYNTHESIS",
      synthNextLabel: "Next card",
      synthPrevLabel: "Back a card",
      synthCurrentLabel: `Card ${state.synthPage + 1} of ${synthesisCards(state, agg).length}`,
      synthPageNote: "One card at a time on the projector. The pairs have the whole set on their own screens.",
      director: teacherDirector(state, phase),
      watchFor: teacherWatchFor(state, phase),
      // The shell's director layer reads `projectorNow`; the same key name L1
      // and L2 use, so /teach renders this lesson with no shell change.
      projectorNow: projectorMirror(state, phase),
      revealStages: revealStagesFor(state),
      currentRevealStage: state.revealStage > 0 ? revealStagesFor(state)[state.revealStage - 1] ?? null : null,
      aggregate: agg,
      simplifications: SIMPLIFICATIONS,
      sources: SOURCE_NOTES,
    });
  },

  boardView(state, phase) {
    const agg = computeAggregate(state);
    const common = {
      honestyLine: MODELED_DOLLARS_LINE,
      horizonLine: HORIZON_LINE,
      privacyLine: BOARD_PRIVACY_LINE,
      rule: ruleView(state),
      sources: SOURCE_NOTES,
    };
    switch (phase) {
      case "LOBBY":
        return tag({
          ...common,
          mode: "lobby",
          title: "WRITING THE RULE",
          subtitle: LOBBY_COPY,
          league: state.clubs.slice(0, state.leagueSize).map((c, i) => clubCard(state, i)),
          seedNote: state.seedNote,
        });
      case "HOOK":
        return tag({
          ...common,
          mode: "hook",
          title: "BOSTON, JUNE 2025",
          copy: HOOK_COPY,
          question: HOOK_BOARD_QUESTION,
          revealed: state.hookRevealed,
          ...(state.hookRevealed ? { revealCopy: HOOK_REVEAL_COPY, splitLine: hookSplitLineClaimed(agg).text, split: agg.hookSplit } : {}),
        });
      case "PLAY": {
        if (state.stage === "rounds") {
          return tag({
            ...common,
            mode: "rounds",
            title: `ROUND ${Math.min(state.roundIndex + 1, ROUND_COUNT)} OF ${ROUND_COUNT}`,
            veil: VEIL_COPY,
            adoptCopy: ADOPT_COPY,
            // Anti-herding: nothing at all until round 1 has closed.
            histogram: state.closedRounds.length > 0 ? agg.rounds[agg.rounds.length - 1] : null,
            histogramHeld: state.closedRounds.length === 0,
            heldCopy: "Round 1 is blind on purpose. A room that sees the middle number first writes the middle number.",
            submitted: state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length,
            deskCount: agg.deskCount,
          });
        }
        if (state.stage === "adopted") {
          return tag({ ...common, mode: "adopted", title: "THE RULE", adoptionLine: adoptionLineClaimed(agg).text, statusQuoCopy: state.adopted?.how === "statusQuo" ? STATUS_QUO_COPY : null });
        }
        return tag({
          ...common,
          mode: "season",
          title: `WEEK ${Math.min(state.weekIndex + 1, WEEK_COUNT)} OF ${WEEK_COUNT}`,
          pairings: scheduleFor(Math.min(state.weekIndex, WEEK_COUNT - 1), state.leagueSize).map((p) => ({
            host: deskHandleFor(state.clubs[p.host]!),
            hostShort: defOf(state.clubs[p.host]!).short,
            visitorShort: defOf(state.clubs[p.visitor]!).short,
            visitorDraw: state.clubs[p.visitor]!.draw,
          })),
          lockedCount: state.clubs.filter((c) => c.seatId !== null && c.locked).length,
          deskCount: agg.deskCount,
          ...(state.rookieSlot !== null ? { rookie: { club: CLUBS[state.rookieSlot]!.name, copy: ROOKIE_COPY } } : {}),
        });
      }
      case "REVEAL": {
        const stage = revealStagesFor(state)[state.revealStage - 1] ?? null;
        return tag({
          ...common,
          mode: "reveal",
          title: stage ? stage.name.toUpperCase() : "HOLDING",
          stage: state.revealStage,
          totalStages: REVEAL_STEPS,
          headline: stage ? stage.headline : "Waiting for your teacher to put up the first beat.",
          potFlows: state.revealStage >= 3 ? agg.potFlows : [],
          arrows: state.revealStage >= 4 ? agg.arrows : [],
          arrowLine: state.revealStage >= 4 ? arrowLineClaimed(agg).text : null,
          eraLine: state.revealStage >= 5 ? reinvestEraLineClaimed(agg).text : null,
          era: state.revealStage >= 5 ? agg.reinvestEra : [],
          l2Mean: agg.l2Mean,
          l3Mean: agg.l3Mean,
        });
      }
      case "CONSEQUENCE":
        return tag({
          ...common,
          mode: "consequence",
          title: "YOU CHANGED THE RULE. LOOK WHAT YOU CHANGED ABOUT YOURSELVES",
          eraLine: reinvestEraLineClaimed(agg).text,
          era: agg.reinvestEra,
          l2Mean: agg.l2Mean,
          l3Mean: agg.l3Mean,
          question: CONSEQUENCE_QUESTION,
          potFlows: agg.potFlows,
        });
      case "COUNTERFACTUAL":
        return tag({
          ...common,
          mode: "counterfactual",
          title: "THE RULE YOU DID NOT WRITE",
          ran: state.counterfactualRun,
          line: counterfactualLineClaimed(agg).text,
          rows: agg.counterfactual,
          share: agg.counterfactualShare,
          honesty: COUNTERFACTUAL_HONESTY,
        });
      case "ARGUE":
        return tag({
          ...common,
          mode: "argue",
          title: "SACRAMENTO, 2013",
          copy: ARGUE_COPY,
          prompt: ARGUE_PROMPT,
          revealed: state.kingsRevealed,
          ...(state.kingsRevealed ? { revealCopy: ARGUE_REVEAL_COPY, splitLine: kingsSplitLineClaimed(agg).text, split: agg.kingsSplit } : {}),
        });
      case "SYNTHESIS": {
        const cards = synthesisCards(state, agg);
        const page = Math.min(state.synthPage, cards.length - 1);
        return tag({
          ...common,
          mode: "synthesis",
          title: "ECONOMICS YOU LEARNED",
          card: cards[page] ?? null,
          page: page + 1,
          pageCount: cards.length,
          exitPrompt: EXIT_PROMPT,
        });
      }
      case "COMPLETE":
        return tag({ ...common, mode: "complete", title: "YOUR RULE", copy: COMPLETE_COPY, adoptionLine: adoptionLineClaimed(agg).text });
      default:
        return tag({ ...common, mode: "idle", title: "" });
    }
  },

  aggregate(state) {
    return computeAggregate(state);
  },
};
