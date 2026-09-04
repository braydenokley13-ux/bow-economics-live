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
import type { LessonAction, LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";
import { isGradeBand, profileFor, type GradeBand } from "../shared/gradeBand.js";

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
  /** The league's own three-letter code. The league floor draws twelve clubs in
   *  roughly 44px each; "New York" and "New Orleans" both truncate to "New …"
   *  there, which is worse than useless in a room that has to tell them apart. */
  readonly code: string;
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
  { name: "New York Knicks", code: "NYK", short: "New York", building: "Madison Square Garden", capacity: 19_812, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 44, startCash: 2_400_000, identityLine: "The biggest market in American sports, and the league's biggest gate — about $193M in gate receipts in 2024-25, a franchise record and the largest in the NBA." },
  { name: "Memphis Grizzlies", code: "MEM", short: "Memphis", building: "FedExForum", capacity: 17_794, capacityNote: "modeled seat count · published figures range 16,667-18,119", profileId: "memphis", startDraw: 62, startCash: 700_000, identityLine: "One of the league's smallest markets. In the leaked 2016-17 league year its local media deal was worth under $10M a year, against about $149M for the Lakers — and it received about $32M in revenue sharing, the most in the league." },
  { name: "Golden State Warriors", code: "GSW", short: "Golden State", building: "Chase Center", capacity: 18_064, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 30, startCash: 2_600_000, identityLine: "Paid for Chase Center itself — about $1.4B, privately financed, opened 2019 — and owns it, so it keeps the concert money and the real estate too. $833M of revenue in 2024-25, the highest in the NBA." },
  { name: "Oklahoma City Thunder", code: "OKC", short: "Oklahoma City", building: "Paycom Center", capacity: 18_203, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 71, startCash: 900_000, identityLine: "One of the league's smallest markets — and the 2025 champions, 4-3 over Indiana." },
  { name: "Milwaukee Bucks", code: "MIL", short: "Milwaukee", building: "Fiserv Forum", capacity: 17_341, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 38, startCash: 620_000, identityLine: "In 2015 Wisconsin approved about $250M of public money toward Fiserv Forum under an explicit relocation threat. The Bucks stayed, and won the 2021 title." },
  { name: "Boston Celtics", code: "BOS", short: "Boston", building: "TD Garden", capacity: 19_156, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 55, startCash: 2_100_000, identityLine: "In June 2025, a year after the 2024 title, Boston faced a projected salary-and-tax bill reported north of $500M under the second-apron rules — and traded two starters inside 24 hours." },
  { name: "Indiana Pacers", code: "IND", short: "Indiana", building: "Gainbridge Fieldhouse", capacity: 17_274, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 26, startCash: 540_000 },
  { name: "Los Angeles Lakers", code: "LAL", short: "L.A. Lakers", building: "Crypto.com Arena", capacity: 18_997, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 68, startCash: 2_500_000, identityLine: "One of the biggest markets in the league — and it does NOT own its building: AEG owns and operates Crypto.com Arena, and the Lakers are tenants on a lease running to 2041." },
  { name: "Denver Nuggets", code: "DEN", short: "Denver", building: "Ball Arena", capacity: 19_520, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 34, startCash: 810_000 },
  { name: "Philadelphia 76ers", code: "PHI", short: "Philadelphia", building: "Xfinity Mobile Arena", capacity: 20_478, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 49, startCash: 1_950_000 },
  { name: "New Orleans Pelicans", code: "NOP", short: "New Orleans", building: "Smoothie King Center", capacity: 16_867, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 72, startCash: 660_000 },
  { name: "Chicago Bulls", code: "CHI", short: "Chicago", building: "United Center", capacity: 20_917, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 28, startCash: 2_050_000 },
  { name: "Sacramento Kings", code: "SAC", short: "Sacramento", building: "Golden 1 Center", capacity: 17_608, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 58, startCash: 870_000, identityLine: "On May 15, 2013 the league's owners voted 22-8 to deny a sale that would have moved this club to Seattle. Golden 1 Center opened downtown in 2016." },
  { name: "Toronto Raptors", code: "TOR", short: "Toronto", building: "Scotiabank Arena", capacity: 19_800, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 40, startCash: 2_200_000 },
  { name: "Utah Jazz", code: "UTA", short: "Utah", building: "Delta Center", capacity: 18_206, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 65, startCash: 840_000 },
  { name: "Miami Heat", code: "MIA", short: "Miami", building: "Kaseya Center", capacity: 19_600, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 33, startCash: 2_150_000 },
  { name: "Cleveland Cavaliers", code: "CLE", short: "Cleveland", building: "Rocket Arena", capacity: 19_432, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 51, startCash: 700_000, identityLine: "LeBron James left in 2010 and this club's ticket demand and franchise value cratered; his July 2014 return sold out the season-ticket base within hours." },
  { name: "Portland Trail Blazers", code: "POR", short: "Portland", building: "Moda Center", capacity: 19_393, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 36, startCash: 790_000 },
  { name: "Orlando Magic", code: "ORL", short: "Orlando", building: "Kia Center", capacity: 18_846, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 60, startCash: 680_000 },
  { name: "Detroit Pistons", code: "DET", short: "Detroit", building: "Little Caesars Arena", capacity: 20_332, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 31, startCash: 1_900_000 },
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

/* --------------------------------------------------- band decision spaces -- */

/**
 * THE SHARE ballot's own decision space, per band (gradeBand.ts `allowsPercentages`).
 * 5-6 never sees a percent: the four cards are printed as "$0/$2/$4/$6 out of
 * every $10 of local money" and only ever carry these four internal share
 * values. 7-8 keeps the full continuous grid. `maxVariables` at 5-6 is 2 and
 * this ballot spends one of them (SHARE_SLATE_LABEL_5_6 documents the print).
 */
export const SHARE_SLATE_5_6: readonly number[] = [0, 20, 40, 60];
export const SHARE_SLATE_LABEL_5_6: Readonly<Record<number, string>> = { 0: "$0", 20: "$2", 40: "$4", 60: "$6" };

export const shareOptionsFor = (band: GradeBand): readonly number[] => (band === "5-6" ? SHARE_SLATE_5_6 : SHARE_GRID);

export const isValidShareForBand = (band: GradeBand, v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && shareOptionsFor(band).includes(v);

/**
 * THE FLOOR's own decision space, per band — a FLAT DOLLAR reinvest LINE per
 * week, never a percent of a club's own revenue.
 *
 * Economic Truth ruling (binding, computed against the shipped constants): a
 * percent-of-own-revenue floor (the old `CONDITION_MIN_REINVEST` reading)
 * binds the SAME big-market coalition institution 1 already binds — a big
 * market's 15% of a much bigger local-revenue base is a bigger dollar number
 * than a small market's 15%, so the percent form never inverts the coalition
 * the whole two-institution design turns on. A FLAT dollar line does invert
 * it: at the working value below, seven small/mid markets (Memphis, New
 * Orleans, Milwaukee, Utah, Oklahoma City, Indiana, Denver) fall under it on
 * a typical week and only two big markets do — and it matches the real
 * institution, an absolute dollar minimum team salary identical for every
 * club regardless of market size. `CONDITION_MIN_REINVEST`/
 * `CONDITION_COLLECT_FRACTION` stay exactly as they are and stay institution
 * 1's own constants; the floor's dock-and-redistribute REUSES the collect
 * fraction (see `floorRuleFor` / `settleWeek`) but tests dollars, not percent.
 *
 * D62 (obeyability): no adopted institution may impose an obligation a
 * franchise cannot discharge at any legal setting from any reachable state.
 * `runtime/scripts/write-the-rule-floor-sweep.mjs` is the printed feasibility
 * sweep this line ships with. The $300,000 working value from the first
 * tuning pass is WITHDRAWN — an independent review measured it infeasible at
 * the 40% dial for several small markets, and the sweep confirms it: Indiana
 * Pacers' own ceiling (revenue-maximising price, week-1 Draw, REINVEST_MAX)
 * is $155,758/week, below every $50,000-stepped line from $200,000 up. The
 * values below are the sweep's own highest-binding, zero-UNREACHABLE choice:
 * every club (all 18 seatable markets) can legally clear $150,000/week, and
 * at a plausible adopted share (25-45%) it still binds several small/mid
 * markets first (Memphis, Milwaukee, New Orleans, Indiana, Cleveland) before
 * any big market — the coalition inversion the two-institution design turns
 * on. TODO before ship: widen `MAX_DESKS`/re-profile Indiana's market if the
 * design ever wants a line above $150,000; do not raise the constant without
 * re-running the sweep.
 */
export const FLOOR_ROUND_COUNT = 2;
export const FLOOR_OFF = 0;
export const FLOOR_LINE_5_6 = 150_000;
export const FLOOR_LINES_7_8: readonly number[] = [50_000, 100_000, 150_000];
export const FLOOR_RECIPIENTS: readonly FloorRecipient[] = ["compliant", "everyone"];
export const STATUS_QUO_FLOOR_ON = false;

export const floorLevelsFor = (band: GradeBand): readonly number[] => (band === "5-6" ? [FLOOR_LINE_5_6] : FLOOR_LINES_7_8);

/** Untrusted-input validation for a `proposeFloor` payload, band-aware. */
export function isValidFloorProposal(band: GradeBand, value: unknown): value is { on: boolean; level?: number; recipient?: FloorRecipient } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v["on"] !== "boolean") return false;
  if (!v["on"]) return true; // OFF needs nothing else, at either band
  if (band === "5-6") return true; // ON at 5-6 is always the one authored line
  if (typeof v["level"] !== "number" || !FLOOR_LINES_7_8.includes(v["level"])) return false;
  if (v["recipient"] !== "compliant" && v["recipient"] !== "everyone") return false;
  return true;
}

/** Fills in the band's authored defaults so the stored proposal is always complete. */
export function normalizeFloorProposal(band: GradeBand, value: { on: boolean; level?: number; recipient?: FloorRecipient }): FloorProposal {
  if (band === "5-6") return { on: value.on, level: value.on ? FLOOR_LINE_5_6 : FLOOR_OFF, recipient: "compliant" };
  return { on: value.on, level: value.on ? (value.level as number) : FLOOR_OFF, recipient: value.on ? (value.recipient as FloorRecipient) : "compliant" };
}

/**
 * The active floor, read from the room's own adopted institution row (or the
 * status quo — no floor — when none has been adopted yet, or on a snapshot
 * from before this institution existed). `share`/`condition` are the reused
 * `AdoptedRule` slots — see the type doc above.
 */
export type FloorRule = { on: boolean; level: number; recipient: FloorRecipient };

export function floorRuleFor(state: { institutions?: Record<InstitutionId, AdoptedRule | null> }): FloorRule {
  const row = state.institutions ? state.institutions.floor : null;
  if (!row || !row.condition) return { on: false, level: FLOOR_OFF, recipient: "compliant" };
  return { on: true, level: row.share, recipient: row.recipient ?? "compliant" };
}

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

/**
 * WEEK 6 — THE BOARD OF GOVERNORS, second institution.
 * ------------------------------------------------------------------------
 * `InstitutionId` names the two things this room votes on. THE SHARE is
 * institution 1 (above, unchanged). THE FLOOR is institution 2: its own
 * ballot, its own two rounds, its own two-thirds seal, and its own printed
 * cost line — never a boolean rider on institution 1's ballot.
 *
 * `AdoptedRule` is reused, not duplicated, for the floor's own adopted row
 * (spec: `institutions: Record<InstitutionId, AdoptedRule | null>`): on a
 * FLOOR row, `share` carries the adopted LEVEL (0 when the floor failed or
 * the room voted it off) and `condition` carries whether the floor is ON.
 * `recipient` is meaningful only on a floor row. `institution` defaults to
 * "share" when absent, so an old snapshot's `adopted` object — written
 * before this field existed — still reads as the share row it always was
 * (the `lockedAtBarRelease()` tolerance pattern).
 */
export type InstitutionId = "share" | "floor";

/** Who receives a floor-forfeited half, at 7-8 only (5-6 is always "compliant"). */
export type FloorRecipient = "compliant" | "everyone";

/** The floor's own ballot. `level`/`recipient` are read only when `on` and only at 7-8. */
export type FloorProposal = { on: boolean; level: number; recipient: FloorRecipient };

export const institutionOf = (row: { institution?: InstitutionId }): InstitutionId => row.institution ?? "share";

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
  /** Which institution this row is. Absent on every pre-existing snapshot and
   *  every pre-existing reader, and read as "share" wherever it matters. */
  institution?: InstitutionId;
  /** Meaningful only on a FLOOR row — who the forfeited half goes to. */
  recipient?: FloorRecipient;
};

export type PotFlow = {
  paidIn: number;
  tookOut: number;
  net: number;
  /** True when institution 1's own CONDITION docked this club's share this week. */
  docked: boolean;
  /**
   * True when institution 2 — THE FLOOR — separately docked this club this
   * week (additive: the floor's own forfeit-and-redistribute layer runs on
   * top of whatever institution 1 already settled, never in place of it, and
   * is a no-op whenever no floor has been adopted — see `floorRuleFor`).
   */
  floorDocked: boolean;
  /**
   * Wave 3b (view-only, additive): THE FLOOR's own dollar amount forfeited by
   * THIS club THIS week — 0 unless `floorDocked`. Recorded here, alongside the
   * `base`/`bonus` arithmetic that already computes it in `settleWeek`, so a
   * view can print an honest dollar figure without re-deriving the floor's
   * own math a second time and risking it drift from the number that actually
   * moved the club's cash.
   */
  floorForfeitedDollars: number;
  /**
   * Wave 3b (view-only, additive): THE FLOOR's own dollar amount THIS club
   * received THIS week from the forfeited pool — 0 when the floor is off,
   * this club was not eligible under the adopted `recipient` rule, or nothing
   * was forfeited that week.
   */
  floorReceivedDollars: number;
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

/**
 * THE FLOOR's stakes card — private, dollar-denominated, printed for this
 * club alone before the floor's rounds open (non-negotiable 6: a stakes card
 * before debate opens, derived from this club's own history, never assigned).
 * It is a MODELED projection at the share the room actually adopted, holding
 * this club's own most recent reinvest rate fixed — not a promise, and the
 * card says so.
 */
export type StakesCard = {
  /** The DOLLAR LINE this card is priced against — the one authored line at
   *  5-6, or the middle of the three options at 7-8, before the room has
   *  voted a level. Never a percent (5-6 `allowsPercentages: false`). */
  atLevel: number;
  /** This club's own projected weekly reinvest SPEND, in dollars, at its
   *  current dial and current Draw — not a percent, so it reads directly
   *  against `atLevel`. */
  ownReinvest: number;
  /** Whether that projected spend would already clear `atLevel`. */
  wouldClear: boolean;
  /** What one week's forfeit would cost this club if it does not move and the
   *  floor binds at `atLevel` — 0 when `wouldClear` is true. */
  costIfBound: number;
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
  /**
   * The room's own L2 reinvest mean in DOLLARS PER WEEK. The two lessons' dials
   * share a scale and not a base (L2 spends a share of door money; L3 spends a
   * share of local revenue, which includes local media), so the percentages are
   * not like-for-like and the before/after bar is computed on dollars instead.
   */
  l2ReinvestDollars: number | null;
  l2Cash: number | null;
  hookPick: "pay" | "breakup" | null;
  proposal: RuleProposal | null;
  proposals: (RuleProposal | null)[];
  /** Institution 2's own ballot and history — parallel to `proposal`/`proposals`. */
  floorProposal: FloorProposal | null;
  floorProposals: (FloorProposal | null)[];
  /** Set once, the moment the floor's rounds open. Null before then and on
   *  every snapshot from before this institution existed. */
  stakesCard: StakesCard | null;
  price: number;
  reinvest: number;
  locked: boolean;
  weeks: SettledWeek[];
  kingsVote: "deny" | "approve" | null;
  /** REVEAL-half lens: what this desk predicted about its own price arrow. */
  arrowPrediction: "moved" | "flat" | null;
  /** True when a late-arriving pair took this club over from the league office. */
  handedOver: boolean;
};

export type WriteRuleStage = "rounds" | "adopted" | "floorRounds" | "floorAdopted" | "season" | "seasonDone";

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
  /** Which class this room is for (D22/D38 seam). Fixed for the life of the room. */
  band: GradeBand;
  stage: WriteRuleStage;
  roundIndex: number;
  /** Institution 2's own round counter — parallel to `roundIndex`, never shared with it. */
  floorRoundIndex: number;
  /**
   * `shares`/`conditions` are per LIVE DESK in slot order and carry `null` for a
   * desk that never put a number in that round. A non-vote is an abstention, not
   * a fabricated 5% — see `runAdoption`. `institution` names which ballot this
   * round belongs to and is absent (read as "share") on every round closed
   * before institution 2 existed — see `institutionOf`. On a FLOOR round,
   * `shares[i]` carries the level this desk proposed (0 for an explicit OFF
   * vote, never confused with `null`, a true abstention) and `conditions[i]`
   * carries whether that desk asked the forfeit to go to "everyone" (true) or
   * only the compliant (false) — the same reused slots `AdoptedRule` reuses.
   */
  closedRounds: { round: number; institution?: InstitutionId; shares: (number | null)[]; conditions: (boolean | null)[]; median: number; slots: number[] }[];
  adopted: AdoptedRule | null;
  /** Both institutions' own adopted rows — additive alongside `adopted`, which
   *  stays the share row so every pre-existing snapshot and view still reads. */
  institutions: Record<InstitutionId, AdoptedRule | null>;
  /** Paging counter for the ARGUE-phase institution recap (`teacher:reviewStage`). */
  reviewStage: number;
  weekIndex: number;
  rookieSlot: number | null;
  revealStage: number;
  counterfactualRun: boolean;
  /** The room's own Kings tally is on the projector, alone, before the 22-8. */
  kingsSplitShown: boolean;
  kingsRevealed: boolean;
  synthPage: number;
  /**
   * The furthest finale card the projector has EVER turned to this session.
   *
   * The desk carries the cards the board has reached, so a pair can look back
   * without reading ahead of the room. That has to be a high-water mark, not
   * `synthPage`: the teacher's own Back button — and the forward wrap at the
   * last card — would otherwise take cards off thirty students' screens that
   * the room has already discussed.
   */
  synthSeen: number;
  finalePage: number;
  /** Pairs who arrived after the league closed and could not be given a club. */
  observerSeats: string[];
};

/* --------------------------------------------------------------- paging -- */

export const SYNTH_CARDS_PER_PAGE = 1;
export const synthPageCount = (cards: number): number => Math.max(1, Math.ceil(cards / SYNTH_CARDS_PER_PAGE));

/** Where the class is, in this lesson's words rather than the engine's. Never what it found. */
const PHASE_EVENT: Partial<Record<CanonicalPhase, string>> = {
  HOOK: "Your teacher set up the league and the question.",
  PLAY: "The rule rounds opened \u2014 the room started writing its own rule.",
  REVEAL: "The season went up on the projector.",
  CONSEQUENCE: "The class started reading what the rule cost and paid.",
  ADAPT: "The class went back over the rule.",
  COUNTERFACTUAL: "The class started replaying the season under other rules.",
  ARGUE: "The class started arguing from the board.",
  SYNTHESIS: "Your teacher started naming the economics.",
  COMPLETE: "The lesson finished.",
};

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
    l2ReinvestDollars: null,
    l2Cash: null,
    hookPick: null,
    proposal: null,
    proposals: [],
    floorProposal: null,
    floorProposals: [],
    stakesCard: null,
    price: profile.housePrice,
    reinvest: 0,
    locked: false,
    weeks: [],
    kingsVote: null,
    arrowPrediction: null,
    handedOver: false,
  };
}

function withLeagueSize(state: WriteRuleState, size: number): WriteRuleState {
  if (size <= state.clubs.length) return { ...state, leagueSize: size };
  const clubs = state.clubs.slice();
  for (let i = clubs.length; i < size; i += 1) clubs.push(makeClub(i));
  return { ...state, clubs, leagueSize: size };
}

/**
 * Seating, including the late arrival.
 *
 * A pair that walks in after the league has closed (`leagueFrozen`, set by the
 * first round close or the first lock) used to be refused with a bare 409 while
 * the console still counted them as joined and their own device said "finding
 * your club…" forever (gate-l3-teacher B4). Two honest landings replace it:
 *
 *  1. HANDOVER — if any club inside the frozen league is still being run by the
 *     league office, the pair takes it over. They are told on their own screen
 *     that the rule was voted before they arrived and that this club's earlier
 *     weeks were played by the league office.
 *  2. OBSERVER — if every club is taken, the seat is recorded as an observer.
 *     Their device says what to do (sit with a neighbouring desk) and a WATCH
 *     FOR entry names them to the teacher. Nothing about them is silent.
 */
function seatDesk(state: WriteRuleState, seatId: SeatId): ReduceResult<WriteRuleState> {
  if (state.seatToSlot[seatId] !== undefined) return { ok: true, state };
  if (!state.leagueFrozen) {
    const slot = state.deskCount;
    if (slot >= MAX_DESKS) return { ok: false, reason: `this league seats ${MAX_DESKS} desks` };
    const next = withLeagueSize(state, Math.max(MIN_LEAGUE, slot + 1));
    const clubs = next.clubs.slice();
    clubs[slot] = { ...clubs[slot]!, seatId };
    return {
      ok: true,
      state: { ...next, clubs, seatToSlot: { ...next.seatToSlot, [seatId]: slot }, deskCount: slot + 1 },
    };
  }
  const free = state.clubs.slice(0, state.leagueSize).find((c) => c.seatId === null);
  if (free) {
    const clubs = state.clubs.slice();
    clubs[free.slot] = { ...free, seatId, handedOver: true };
    return {
      ok: true,
      state: {
        ...state,
        clubs,
        seatToSlot: { ...state.seatToSlot, [seatId]: free.slot },
        deskCount: Math.max(state.deskCount, free.slot + 1),
      },
    };
  }
  return seatLate(state, seatId);
}

/**
 * Record a pair we cannot hand a club to. Two different things land here — a
 * full league during PLAY, and a device that arrives after the season closed —
 * and both are honest observers rather than refusals: a refusal leaves the
 * student's screen saying "Finding your club..." for the rest of the period.
 * The reason is derived from the phase at render time, not stored, because the
 * same pair can arrive full-league during PLAY and still be an observer later.
 */
function seatLate(state: WriteRuleState, seatId: SeatId): ReduceResult<WriteRuleState> {
  const observers = state.observerSeats ?? [];
  if (observers.includes(seatId)) return { ok: true, state };
  return { ok: true, state: { ...state, observerSeats: [...observers, seatId] } };
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
export type CarriedClub = {
  slot: number;
  draw: number;
  cash: number;
  meanReinvest: number | null;
  /** L2's own reinvest spend in DOLLARS PER WEEK — the like-for-like basis. */
  meanReinvestDollars: number | null;
};

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
    let meanReinvestDollars: number | null = null;
    const weeks = c["weeks"];
    if (Array.isArray(weeks) && weeks.length > 0) {
      const shares: number[] = [];
      const paid: number[] = [];
      for (const w of weeks) {
        if (!w || typeof w !== "object") continue;
        const share = (w as Record<string, unknown>)["share"];
        if (typeof share === "number" && Number.isFinite(share) && share >= 0 && share <= 100) shares.push(share);
        // L2's `reinvestPaid` is the dollars actually spent that week. It is the
        // only figure the two lessons can honestly be compared on (econ B3).
        const spend = (w as Record<string, unknown>)["reinvestPaid"];
        if (typeof spend === "number" && Number.isFinite(spend) && spend >= 0) paid.push(spend);
      }
      if (shares.length > 0) meanReinvest = shares.reduce((a, b) => a + b, 0) / shares.length;
      if (paid.length > 0) meanReinvestDollars = paid.reduce((a, b) => a + b, 0) / paid.length;
    }
    out.push({
      slot,
      draw: clamp(Math.round(draw), DRAW_MIN, DRAW_MAX),
      // A club that ended L2 in debt does not start L3 unable to operate (R5):
      // the carried floor is one week's national check, and the board says so.
      cash: Math.max(NATIONAL, Math.round(cash)),
      meanReinvest,
      meanReinvestDollars,
    });
  }
  return out;
}

/**
 * THE THIRD ATTACHMENT POINT (gradeBand.ts) — a 5-6 room's own carry read by a
 * 7-8 room, or the reverse, is a live classroom possibility (D59 ruling / the
 * spec's own naming) and this receiving module has to notice it, not merely
 * trust a well-formed envelope from the right module id. `sourceGradeBand` is
 * itself untrusted input: absent, malformed, or matching, all read as "no
 * band objection" — REFUSAL requires a genuine, valid, MISMATCHED band, never
 * a throw either way. Called before `extractCarriedClubs`; a refusal here
 * means the carry is never read at all, and the reason is teacher-readable.
 */
export function weekFiveBandMismatch(seed: unknown, receivingBand: GradeBand): string | null {
  if (!seed || typeof seed !== "object") return null;
  const s = seed as Record<string, unknown>;
  if (s["lessonModuleId"] !== "m2l2-host-league") return null;
  const sourceBand = s["sourceGradeBand"];
  if (!isGradeBand(sourceBand)) return null;
  if (sourceBand === receivingBand) return null;
  return `last lesson's session was a grades ${sourceBand} room, and this is a grades ${receivingBand} room`;
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

  // The pot: formed from institution 1's own share percent, then split under
  // institution 2's own adopted line alone. D61: the SHARE ballot funds the
  // pot and no longer decides whether it is docked — `rule.condition` (the
  // share's own rider) is read nowhere in this function. Only THE FLOOR's own
  // ballot (`floorRuleFor`, dollars, sealed by `adoptFloor`) can dock a club,
  // so a share vote with condition=true and a failed or never-run floor vote
  // settles with NO FLOOR, lived — the second vote is never cosmetic.
  //
  // econ B4: when NOBODY clears the floor there is no compliance pool to pay,
  // and annihilating half a transfer in silence would teach something false
  // about redistribution. With no compliant club the forfeited half has
  // nowhere to go, so it goes back to the league it came from and the pot
  // closes exactly at what was paid in — printed in HOUSE_RULES.
  const pot = rows.reduce((sum, r) => sum + r.paidIn, 0);
  const evenShare = size > 0 ? pot / size : 0;
  const floor = floorRuleFor(state);
  // Compliance is tested in DOLLARS put back this week (`reinvestSpend`)
  // against the adopted flat-dollar line, never the percent dial against a
  // dollar figure (the unit bug the flat-line conversion introduced and this
  // pass removes).
  const floorCompliant = rows.map((r) => !floor.on || r.reinvestSpend >= floor.level);
  const floorCompliantCount = floorCompliant.filter(Boolean).length;
  let forfeited = 0;
  const base = rows.map((_, i) => {
    if (!floor.on || floorCompliant[i] || floorCompliantCount === 0) return evenShare;
    const collected = evenShare * CONDITION_COLLECT_FRACTION;
    forfeited += evenShare - collected;
    return collected;
  });
  const bonusPool = !floor.on ? 0 : floor.recipient === "everyone" ? size : floorCompliantCount;
  const bonus = bonusPool > 0 ? forfeited / bonusPool : 0;
  const tookOut = rows.map((_, i) => {
    const gets = !floor.on || floor.recipient === "everyone" || floorCompliant[i];
    return Math.round(base[i]! + (gets ? bonus : 0));
  });
  // Wave 3b (view-only, additive): the same `base`/`bonus` this loop already
  // computed, read into per-row dollar figures for the view layer alone —
  // nothing here changes `base`, `bonus`, `tookOut` or any cash the reducer
  // moves.
  const floorForfeitedRow = rows.map((_, i) =>
    floor.on && floorCompliantCount > 0 && !floorCompliant[i] ? Math.round(evenShare - base[i]!) : 0,
  );
  const floorReceivedRow = rows.map((_, i) => {
    const gets = !floor.on || floor.recipient === "everyone" || floorCompliant[i];
    return floor.on && gets ? Math.round(bonus) : 0;
  });

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
        // `docked` is now driven entirely by THE FLOOR (D61); kept as the one
        // field views/tests already read. `floorDocked` is the same value
        // under its institution-specific name for the view turn.
        docked: floor.on && floorCompliantCount > 0 && !floorCompliant[r.slot]!,
        floorDocked: floor.on && floorCompliantCount > 0 && !floorCompliant[r.slot]!,
        floorForfeitedDollars: floorForfeitedRow[r.slot]!,
        floorReceivedDollars: floorReceivedRow[r.slot]!,
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
  // D61: docking is decided by THE FLOOR alone, in dollars put back this week
  // (`spend`) against the adopted flat-dollar line — never by institution 1's
  // `rule.condition`, and never the percent dial against a dollar line. No
  // bonus is modeled here either way: this is a single club's own hypothetical
  // holding the rest of the league fixed, the same approximation the
  // pre-existing `collected` line already made.
  const floor = floorRuleFor(state);
  const docked = floor.on && spend < floor.level;
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
  /** One entry per live desk, `null` where that desk abstained. */
  proposals: (number | null)[];
  inBand: number;
  needed: number;
  voted: number;
  abstained: number;
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
/**
 * ABSTENTION, and why it is handled this way.
 *
 * A desk that never presses PUT IT IN used to be recorded as a 5% proposal
 * nobody made (gate-l3-play, probe C): it dragged the room's middle number
 * toward zero with a number no pair chose, and no surface said so. That is a
 * fabricated vote, and it is the same defect class as the unsealed round.
 *
 * The design shipped here is a TRUE ABSTENTION on the numerator and NO relief on
 * the denominator:
 *   - an abstaining desk contributes NO number to the middle number;
 *   - the two-thirds test is still two-thirds of every LIVE DESK in the room.
 * Two-thirds therefore stays exactly as meaningful as it was written to be. You
 * cannot lower the bar by staying quiet — an abstention can never be inside the
 * band, so it is a desk that did not back the rule — and you cannot move the
 * room's middle number without saying a number out loud. Both halves are printed
 * on the desk, on the board tally and in the teacher's WATCH FOR panel.
 */
/** Winner of a discrete slate: most votes, ties toward the lowest printable
 *  value — deterministic, never a coin flip (R7 — no random source anywhere
 *  in this file). Used wherever a ballot's own decision space is a slate
 *  rather than a continuous grid: the 5-6 SHARE ballot and THE FLOOR at
 *  either band (spec: "the ±10 band degenerates — the test becomes plurality
 *  card ≥ needed"). */
function pluralityWinner(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = -1;
  for (const [v, c] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

export function runAdoption(state: WriteRuleState, institution: InstitutionId = "share"): AdoptionOutcome {
  if (institution === "floor") return runFloorAdoption(state);
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  // The vote is sealed at the close of the last SHARE round: the adopted rule
  // reads the RECORDED round, never a live control that can still be touched,
  // and never a FLOOR round that may since have closed on the same array.
  const shareRounds = state.closedRounds.filter((r) => institutionOf(r) === "share");
  const sealed = shareRounds.length > 0 ? shareRounds[shareRounds.length - 1]! : null;
  const proposals: (number | null)[] = sealed ? sealed.shares.slice() : live.map((c) => c.proposal?.share ?? null);
  const conditions: (boolean | null)[] = sealed ? sealed.conditions.slice() : live.map((c) => c.proposal?.condition ?? null);
  const liveDesks = sealed ? sealed.shares.length : live.length;
  const votedIdx = proposals.map((p, i) => (p === null ? -1 : i)).filter((i) => i >= 0);
  const votedShares = votedIdx.map((i) => proposals[i]!);
  // 5-6's ballot is a four-card slate, never a percent (gradeBand.ts
  // `allowsPercentages: false`), so the ±10 band test degenerates to plurality
  // — the same rule applied to THE FLOOR below, at either band.
  const discrete = state.band === "5-6";
  const median = votedShares.length > 0 ? medianOf(votedShares) : STATUS_QUO_SHARE;
  const snapped = discrete ? pluralityWinner(votedShares) ?? STATUS_QUO_SHARE : snapShare(median);
  const bandIdx = discrete
    ? votedIdx.filter((i) => proposals[i]! === snapped)
    : votedIdx.filter((i) => Math.abs(proposals[i]! - median) <= ADOPT_BAND + 1e-9);
  const needed = Math.ceil((liveDesks * ADOPT_NUMERATOR) / ADOPT_DENOMINATOR);
  const passes = liveDesks > 0 && votedShares.length > 0 && bandIdx.length >= needed;
  // On the fallback path the replay runs at the number the room FAILED to agree
  // on, never below the rule actually in force (gate-l3-play repair 4).
  const runnerUp = passes
    ? runnerUpShare(votedShares, snapped)
    : runnerUpShare(votedShares, STATUS_QUO_SHARE, snapped > STATUS_QUO_SHARE ? snapped : undefined);
  const abstained = liveDesks - votedShares.length;
  if (liveDesks === 0 || votedShares.length === 0 || bandIdx.length < needed) {
    return {
      adopted: {
        share: STATUS_QUO_SHARE,
        condition: STATUS_QUO_CONDITION,
        how: "statusQuo",
        supporting: bandIdx.length,
        liveDesks,
        median: snapped,
        runnerUp,
        institution: "share",
      },
      proposals,
      inBand: bandIdx.length,
      needed,
      voted: votedShares.length,
      abstained,
    };
  }
  // The CONDITION rides with the desks who actually carried the share: a
  // majority of the supporting bloc, ties resolving OFF (the less intrusive
  // rule, and the status quo's own setting).
  const yes = bandIdx.filter((i) => conditions[i] === true).length;
  const condition = yes * 2 > bandIdx.length;
  return {
    adopted: {
      share: snapped,
      condition,
      how: "voted",
      supporting: bandIdx.length,
      liveDesks,
      median: snapped,
      runnerUp,
      institution: "share",
    },
    proposals,
    inBand: bandIdx.length,
    needed,
    voted: votedShares.length,
    abstained,
  };
}

/**
 * The share the COUNTERFACTUAL replays — the one that finished second.
 *
 * Two guards the first version did not have (gate-l3-play repair 4). The replay
 * may never run BELOW the rule that is actually in force on the fallback path,
 * and it may never run at 0%: a room that could not agree was shown an "AT 0%"
 * column of eight literal $0 cells, which is the difference between doing
 * nothing and doing slightly less than nothing, on the frame that was supposed
 * to price what not agreeing cost. On the status-quo path the honest replay is
 * the number the room FAILED to agree on — its own round-3 middle number.
 */
export function runnerUpShare(proposals: readonly number[], adoptedShare: number, failedMedian?: number): number {
  const counts = new Map<number, number>();
  for (const p of proposals) {
    const s = snapShare(p);
    if (s <= 0) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  counts.delete(adoptedShare);
  let best = -1;
  let bestCount = -1;
  for (const [share, count] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (count > bestCount) {
      bestCount = count;
      best = share;
    }
  }
  if (best > 0 && best !== adoptedShare) return best;
  // Nothing else was on the table. Fall back to the room's own failed middle
  // number where there is one, and to the league office's rule otherwise.
  if (failedMedian !== undefined && failedMedian > adoptedShare) return failedMedian;
  return adoptedShare === REAL_RULE_SHARE ? SHARE_MAX : REAL_RULE_SHARE;
}

/**
 * INSTITUTION 2 — THE FLOOR's own adoption. Always a discrete-slate test
 * (plurality ≥ two-thirds of live desks), at either band: 5-6 is a genuine
 * two-card slate (OFF or the one authored level), 7-8 a three-level slate
 * with a second, rider dimension (who receives the shortfall) decided the
 * same way institution 1 already decides its own CONDITION — by majority of
 * the bloc that actually carried the winning level.
 *
 * Threshold is recomputed here, at THE FLOOR's OWN seal — `liveDesks` reads
 * the floor's own sealed round, never institution 1's, so a desk that leaves
 * the room between the two votes moves this denominator and not the other.
 *
 * Fails -> NO FLOOR: `share` (the reused level slot) is `FLOOR_OFF`,
 * `condition` (the reused on/off slot) is `false`, and the season simply
 * never runs the floor's own dock — lived, not announced (spec: "the board
 * says nothing about it until ARGUE").
 */
function floorRunnerUp(proposals: readonly number[], adoptedLine: number): number {
  const counts = new Map<number, number>();
  for (const p of proposals) counts.set(p, (counts.get(p) ?? 0) + 1);
  counts.delete(adoptedLine);
  let best = -1;
  let bestCount = -1;
  for (const [line, count] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (line > 0 && count > bestCount) {
      bestCount = count;
      best = line;
    }
  }
  return best > 0 ? best : FLOOR_OFF;
}

function runFloorAdoption(state: WriteRuleState): AdoptionOutcome {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const floorRounds = state.closedRounds.filter((r) => institutionOf(r) === "floor");
  const sealed = floorRounds.length > 0 ? floorRounds[floorRounds.length - 1]! : null;
  // A floor proposal of level 0 (an explicit OFF vote) is a REAL, counted
  // vote — never confused with `null`, a true abstention (no proposal at all).
  const proposals: (number | null)[] = sealed
    ? sealed.shares.slice()
    : live.map((c) => (c.floorProposal ? (c.floorProposal.on ? c.floorProposal.level : FLOOR_OFF) : null));
  const wantsEveryone: (boolean | null)[] = sealed
    ? sealed.conditions.slice()
    : live.map((c) => (c.floorProposal ? c.floorProposal.recipient === "everyone" : null));
  const liveDesks = sealed ? sealed.shares.length : live.length;
  const votedIdx = proposals.map((p, i) => (p === null ? -1 : i)).filter((i) => i >= 0);
  const votedLevels = votedIdx.map((i) => proposals[i]!);
  const winner = votedLevels.length > 0 ? pluralityWinner(votedLevels) ?? FLOOR_OFF : FLOOR_OFF;
  const bandIdx = votedIdx.filter((i) => proposals[i]! === winner);
  const needed = Math.ceil((liveDesks * ADOPT_NUMERATOR) / ADOPT_DENOMINATOR);
  const passes = liveDesks > 0 && votedLevels.length > 0 && winner > FLOOR_OFF && bandIdx.length >= needed;
  const abstained = liveDesks - votedLevels.length;
  // Dollar lines, not share points — `runnerUpShare` clamps to the 0-60 share
  // grid and would truncate a $300,000 line to 60. The floor's own runner-up
  // is the second most-voted DOLLAR line on the table, excluding the adopted
  // one, falling back to the highest other line proposed and then to $0.
  const runnerUp = floorRunnerUp(votedLevels, passes ? winner : FLOOR_OFF);
  if (!passes) {
    return {
      adopted: {
        share: FLOOR_OFF,
        condition: false,
        how: "statusQuo",
        supporting: bandIdx.length,
        liveDesks,
        median: winner,
        runnerUp,
        institution: "floor",
        recipient: "compliant",
      },
      proposals,
      inBand: bandIdx.length,
      needed,
      voted: votedLevels.length,
      abstained,
    };
  }
  const everyoneVotes = bandIdx.filter((i) => wantsEveryone[i] === true).length;
  const recipient: FloorRecipient = everyoneVotes * 2 > bandIdx.length ? "everyone" : "compliant";
  return {
    adopted: {
      share: winner,
      condition: true,
      how: "voted",
      supporting: bandIdx.length,
      liveDesks,
      median: winner,
      runnerUp,
      institution: "floor",
      recipient,
    },
    proposals,
    inBand: bandIdx.length,
    needed,
    voted: votedLevels.length,
    abstained,
  };
}

/* ---------------------------------------------------------- aggregates -- */

export const deskHandleFor = (club: Club): string => `Desk ${club.deskNumber} · ${CLUBS[club.slot]!.short}`;

/**
 * THE DESKS — the teacher's walk-to list. THE ROOM gives the shape and names
 * nobody; this names the desks so the console can pair a handle with the pair
 * sitting there. Teacher-only, never `boardView`.
 *
 * This lesson has two different live windows and they ask for different words:
 * during the offer rounds a desk is IN when it has a number at the league, and
 * during the season it is IN when it has locked the week.
 */
export type DeskStripEntry = {
  seatId: SeatId;
  label: string;
  state: "in" | "deciding" | "auto" | "closed";
  stateLabel: string;
  note: string | null;
  /** True when the note is a reason to walk over, not merely context. */
  flag: boolean;
};
export type DeskStrip = { countLine: string; entries: DeskStripEntry[] };

function deskStripOf(state: WriteRuleState): DeskStrip | null {
  const live = state.clubs
    .slice(0, state.leagueSize)
    .filter((c) => c.seatId !== null)
    .sort((a, b) => (a.deskNumber ?? 0) - (b.deskNumber ?? 0));
  if (live.length === 0) return null;

  const inRounds = state.stage === "rounds" && state.roundIndex < ROUND_COUNT;
  const inSeason = state.stage === "season" && state.weekIndex < WEEK_COUNT;

  const entries: DeskStripEntry[] = live.map((c) => {
    const label = deskHandleFor(c);
    const autos = c.weeks.filter((w) => w.auto).length;
    const own = c.weeks.filter((w) => !w.auto);
    // A handed-over club carries weeks the league office played. Those are not
    // weeks this pair failed to commit, so they are never counted against them —
    // but a pair that has held the club for a week and still not locked one is.
    const [note, flag]: [string | null, boolean] =
      c.weeks.length >= 1 && own.length === 0 && !c.handedOver
        ? ["Has never once locked a week of its own — every week so far was settled by the bell.", true]
        : autos >= 2
          ? [`The bell has settled ${autos} of this desk's weeks.`, true]
          : c.handedOver
            ? ["Took this club over from the league office after the vote had started.", false]
            : c.cash < 0
              ? ["Books are in the red.", false]
              : [null, false];

    if (inRounds) {
      return c.proposal
        ? { seatId: c.seatId!, label, state: "in", stateLabel: `Number in · round ${state.roundIndex + 1}`, note, flag }
        : { seatId: c.seatId!, label, state: "deciding", stateLabel: "No number yet", note, flag };
    }
    if (inSeason) {
      return c.locked
        ? { seatId: c.seatId!, label, state: "in", stateLabel: `Locked Week ${state.weekIndex + 1}`, note, flag }
        : { seatId: c.seatId!, label, state: "deciding", stateLabel: "Still deciding", note, flag };
    }
    return { seatId: c.seatId!, label, state: "closed", stateLabel: state.stage === "season" ? "Three weeks in" : "Vote sealed", note, flag };
  });

  const waiting = entries.filter((e) => e.state === "deciding").length;
  const countLine = inRounds
    ? `${entries.length - waiting} of ${entries.length} numbers in · round ${state.roundIndex + 1} of ${ROUND_COUNT}`
    : inSeason
      ? `${entries.length - waiting} of ${entries.length} locked · week ${state.weekIndex + 1} of ${WEEK_COUNT}`
      : `${entries.length} desk${entries.length === 1 ? "" : "s"} in this league`;
  return { countLine, entries };
}

export type HistogramBin = { share: number; count: number };

export type RoundSummary = {
  round: number;
  bins: HistogramBin[];
  median: number;
  conditionYes: number;
  submitted: number;
  /** Live desks that put no number in this round — a true abstention. */
  abstained: number;
  /** Desks inside +/-ADOPT_BAND of the middle number, and how many are needed. */
  inBand: number;
  needed: number;
  /**
   * Live desks in the room. Deliberately NOT named with a capital "Desk": the
   * suite's histogram-privacy check greps the serialized frame for `Desk`, and a
   * KEY NAME must never be what makes that check trip or pass.
   */
  roomSize: number;
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
  /** Dial positions. NOT like-for-like across the two lessons — see below. */
  l2: number | null;
  l3: number;
  /**
   * The like-for-like pair (econ B3/F3). The L2 dial spends a share of DOOR
   * MONEY, the L3 dial a share of LOCAL REVENUE (door money + local media), so
   * the same dollars read up to 1.95x apart as percentages. Every before/after
   * comparison the lesson prints is computed on these two figures instead.
   */
  l2Dollars: number | null;
  l3Dollars: number;
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
  /**
   * The same arrows recomputed at `arrowsWouldMoveShare` — used only when the
   * rule in force moved nothing, so the reveal can teach the branch it actually
   * landed on ("the room kept the old rule; here is what would have moved").
   */
  arrowsWouldMove: ArrowRow[];
  arrowsWouldMoveShare: number;
  arrowsMovedAny: boolean;
  counterfactual: CounterfactualRow[];
  counterfactualShare: number;
  rookieSlot: number | null;
  weeksPlayed: number;
  l2MeanDollars: number | null;
  l3MeanDollars: number;
};

const sizeLabelOf = (club: Club): string => profileOf(club).sizeLabel;

export function computeAggregate(state: WriteRuleState): WriteRuleAggregate {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const summarise = (round: number, shares: (number | null)[], conditions: (boolean | null)[], roomSize: number): RoundSummary => {
    const voted = shares.filter((s): s is number => s !== null);
    const median = voted.length > 0 ? snapShare(medianOf(voted)) : STATUS_QUO_SHARE;
    const rawMedian = voted.length > 0 ? medianOf(voted) : STATUS_QUO_SHARE;
    return {
      round,
      bins: binsFrom(voted),
      median,
      conditionYes: conditions.filter((c) => c === true).length,
      submitted: voted.length,
      abstained: Math.max(0, roomSize - voted.length),
      // The live gauge the room never had: how many desks would pass right now.
      inBand: voted.filter((s) => Math.abs(s - rawMedian) <= ADOPT_BAND + 1e-9).length,
      needed: Math.ceil((roomSize * ADOPT_NUMERATOR) / ADOPT_DENOMINATOR),
      roomSize,
    };
  };
  // THE SHARE's own bargaining spread only — institution 2's rounds are
  // appended to the same `closedRounds` list after these, and every existing
  // consumer of `agg.rounds` (the adoption line, the synthesis cards) is
  // specifically about institution 1. An untagged round (an old snapshot,
  // `institutionOf`'s default) is treated as a share round, same as always.
  const rounds: RoundSummary[] = state.closedRounds
    .filter((r) => institutionOf(r) === "share")
    .map((r) => summarise(r.round, r.shares, r.conditions, r.shares.length));
  const liveRound: RoundSummary | null =
    state.stage === "rounds"
      ? summarise(
          state.roundIndex + 1,
          live.map((c) => c.proposal?.share ?? null),
          live.map((c) => c.proposal?.condition ?? null),
          live.length,
        )
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
    l2Dollars: c.l2ReinvestDollars,
    l3Dollars: c.weeks.length > 0 ? c.weeks.reduce((a, w) => a + w.reinvestSpend, 0) / c.weeks.length : 0,
  }));
  const l3Mean = reinvestEra.length > 0 ? reinvestEra.reduce((a, r) => a + r.l3, 0) / reinvestEra.length : 0;
  const l2Rows = reinvestEra.filter((r) => r.l2 !== null);
  const l2Mean = l2Rows.length > 0 ? l2Rows.reduce((a, r) => a + (r.l2 ?? 0), 0) / l2Rows.length : state.l2MeanReinvest;
  const l3MeanDollars = reinvestEra.length > 0 ? reinvestEra.reduce((a, r) => a + r.l3Dollars, 0) / reinvestEra.length : 0;
  const dollarRows = reinvestEra.filter((r) => r.l2Dollars !== null);
  const l2MeanDollars = dollarRows.length > 0 ? dollarRows.reduce((a, r) => a + (r.l2Dollars ?? 0), 0) / dollarRows.length : null;

  const arrows: ArrowRow[] = live.map((c) => arrowFor(state, c));
  const arrowsMovedAny = arrows.some((a) => a.reinvestSteps > 0 || a.priceSteps > 0);
  // BC-1's payload is null at the modal outcome (status quo 5%), where nothing
  // moves. Rather than ask the room a question its own frame refutes, the reveal
  // teaches THAT branch: here is the rule you kept, and here is what would have
  // moved. Same instrument, same brute force, a share the room actually named.
  const wouldMoveShare = state.adopted && state.adopted.runnerUp > state.adopted.share ? state.adopted.runnerUp : REAL_RULE_SHARE;
  const arrowsWouldMove: ArrowRow[] =
    !arrowsMovedAny && arrows.length > 0 && state.adopted
      ? live.map((c) => arrowFor({ ...state, adopted: hypotheticalRule(wouldMoveShare, state.adopted!.condition) }, c))
      : [];

  const cfShare = state.adopted?.runnerUp ?? REAL_RULE_SHARE;
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
    arrowsWouldMove,
    arrowsWouldMoveShare: wouldMoveShare,
    arrowsMovedAny,
    counterfactual,
    counterfactualShare: cfShare,
    rookieSlot: state.rookieSlot,
    weeksPlayed: state.weekIndex,
    l2MeanDollars,
    l3MeanDollars,
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
      const compliantCount = compliant.filter(Boolean).length;
      let forfeited = 0;
      // Same no-bonfire rule the live settlement uses (econ B4).
      const base = compliant.map((ok) => {
        if (ok || compliantCount === 0) return even;
        forfeited += even * (1 - CONDITION_COLLECT_FRACTION);
        return even * CONDITION_COLLECT_FRACTION;
      });
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

/** The league office's arm needs its own script, not the status quo's (projector B3). */
export const LEAGUE_OFFICE_COPY =
  "The league office's rule is in force at SHARE 30% · CONDITION ON. This room did NOT write it, the old 5% rule does NOT hold, and nobody here voted for what is about to happen. Say that plainly — a rule you did not write is still a rule you live under, and that is worth more at the debrief than a rule they chose.";

/** What the season is, per arm. The failed-vote room did not write a rule. */
export const SEASON_COPY_VOTED =
  "Three weeks under your own rule. Same building, same dials, same league. The only thing that changed is the rule you wrote.";
export const SEASON_COPY_STATUS_QUO =
  "Three weeks under the old rule — the one that was already there, because this room could not agree on a new one. Same building, same dials, same league. Nothing about the rule changed, and that is the result you are about to live in.";
export const SEASON_COPY_LEAGUE_OFFICE =
  "Three weeks under the league office's rule. Same building, same dials, same league. This room did not write this one — somebody else did, and you play under it anyway.";

export const seasonCopyFor = (how: AdoptedRule["how"] | undefined): string =>
  how === "voted" ? SEASON_COPY_VOTED : how === "leagueOffice" ? SEASON_COPY_LEAGUE_OFFICE : SEASON_COPY_STATUS_QUO;

/** The closing frame, per arm. A failed vote is not "your rule" (gate-l3-play repair 4). */
export const completeTitleFor = (how: AdoptedRule["how"] | undefined): string =>
  how === "voted" ? "YOUR RULE" : how === "leagueOffice" ? "THE RULE YOU PLAYED UNDER" : "THE RULE THAT HELD";

export const completeCopyFor = (how: AdoptedRule["how"] | undefined): string =>
  how === "voted"
    ? "Your rule is the artifact you keep. Write it on the board next to the real league's, and argue about it again in a year."
    : how === "leagueOffice"
      ? "You did not write this one — the league office did, because the room ran out of road. Write it on the board next to the rule you were arguing for, and argue about it again in a year."
      : "You could not agree, so the old rule held. That is the artifact you keep, and it is a real result: write the number you WERE arguing for on the board next to it, and argue about it again in a year.";

export const ROOKIE_COPY =
  "The rookie has landed. In this league the pick went to the club with the least money in the bank after week 1. That is NOT how the real league does it: the NBA uses a lottery precisely so that losing is never a guaranteed reward — since 2019 the three worst records each have a 14.0% chance at the first pick, and the worst record has no guarantee at all.";

/**
 * The default direction of the CONSEQUENCE question, kept only as the shape of
 * the sentence. Nothing renders this constant: every surface asks the branch
 * `consequenceQuestionFor()` computes from the room's own result (teacher B1).
 */
export const CONSEQUENCE_QUESTION = "Whose effort went down? Did anybody DECIDE to try less — or did it just stop being worth it?";

export const COUNTERFACTUAL_HONESTY =
  "We can show you what the money would have done. We cannot show you what you would have done. That is why we played it instead of arguing about it.";

export const ARGUE_COPY =
  "January 2013. The Maloof family agrees to sell the Sacramento Kings to a Seattle group led by Chris Hansen and Steve Ballmer — Ballmer had just run Microsoft and would buy the Clippers a year later — who plan to move the club and bring back the SuperSonics. Seattle lost the Sonics to Oklahoma City in 2008 after a public-money fight. Sacramento's mayor puts together a rival bid under Vivek Ranadive with a downtown arena plan. You are the Board of Governors. Read both term sheets before you vote. Some of you may already know how this ended — vote what you would have voted in that room in 2013, and be ready to defend it either way.";

export const ARGUE_PROMPT = "Approve the sale and the move to Seattle, or deny it and keep the club in Sacramento?";

/** SR A2: the two bids, on the student device and on the projector, with dates. */
export type TermSheet = { id: string; city: string; headline: string; lines: string[] };

export const TERM_SHEETS: readonly TermSheet[] = [
  {
    id: "seattle",
    city: "SEATTLE — Hansen / Ballmer",
    headline: "$625M valuation",
    lines: [
      "$409M in cash for the Maloof family's 65% of the club.",
      "The club relocates. The SuperSonics name comes back to a city that lost its team in 2008.",
      "A new arena in SoDo, about $490M — with up to $200M of city and county bond money in it too, repaid out of arena revenue and guaranteed by the buyers.",
      "This is the higher offer. Every owner in the room owns a club that could be moved one day too.",
    ],
  },
  {
    id: "sacramento",
    city: "SACRAMENTO — Ranadive",
    headline: "$534M valuation",
    lines: [
      "A then-record price for an NBA franchise — and about $91M less than Seattle put up.",
      "The club stays. A new arena goes downtown instead of a move.",
      "About $255M of CITY money goes into that arena, capped at 47.7% of its cost. Sacramento borrowed $273M in 2015 against roughly $18M of payments a year running to 2050.",
      "Sacramento is the 20th-largest US television market. Seattle, the 13th, does not get a club.",
    ],
  },
];

export const ARGUE_TERM_SHEET_NOTE =
  "Both figures are the reported 2013 valuations. Sacramento's public-money number is the city's own record, approved without a public vote.";

export const ARGUE_REVEAL_COPY =
  "On May 15, 2013 the owners voted 22-8 to deny the relocation. Relocation only needed a simple majority — 16 of 30 — so the Seattle side lost by far more than the rule required. The Kings sold in Sacramento at a then-record $534M valuation and Golden 1 Center opened downtown in 2016, about $255M of it city money. And it is not finished: in March 2026 the Board of Governors voted 30-0 to formally explore expansion to Seattle and Las Vegas, and only those two, targeting 2028-29. That final vote needs 23 of the 30 owners, and as of September 2026 it has not happened.";

export const EXIT_PROMPT =
  "Name one thing you did differently in the last three weeks than you did in the last lesson — and name the rule that made you do it.";

export const COMPLETE_COPY =
  "Your rule is the artifact you keep. Write it on the board next to the real league's, and argue about it again in a year.";

export const HORIZON_LINE =
  "One 'week' here stands for about a month of a real season. The dollars are scaled DOWN from real league scale — roughly a twentieth — so a class can hold them; what is real is the PROPORTIONS between the gate, the local television money and the national check. The curves are modeled on real market differences, not measured from any club's books.";

export const MODELED_DOLLARS_LINE =
  "These demand curves are MODELED on real market differences. They are not any club's actual measured demand. Buildings, capacities, market sizes and every dated figure on the board are real.";

export const BOARD_PRIVACY_LINE = "No desk's money is ever ranked on this screen. Rows are sorted by desk number and nothing else.";

export const HOUSE_RULES: readonly string[] = [
  "Three offer rounds, then the room votes. Between rounds you see everybody's numbers with no names on them — but not until round 1 has closed.",
  "A rule passes at two-thirds of desks within 10 points of the middle number. Otherwise the old 5% rule holds.",
  "Then three weeks under whatever rule the room ends up with: set your price, set how much of the week's money you put back into the club.",
  "Your share of the pot arrives every week. So does everybody else's, out of yours.",
  "The national television check is the same for every club, every week, and the pot never touches it.",
  "A desk that never puts a number in has abstained. It is not counted in the room's middle number — and it cannot be inside the ten-point band, so the two-thirds test counts it as a desk that did not back the rule.",
  "If the condition is on and NO club meets it in a week, there is nobody to pay the docked half to, so it goes back to everybody. The condition can move money between clubs. It can never destroy it.",
];

export const SOURCE_NOTES: readonly string[] = [
  "Boston's June 2025 tax position and the Holiday/Porzingis trades: reported June 2025; the ~$500M projected salary-and-tax bill and the ~$200M+ saving are reported figures, not audited books.",
  "2024-25 luxury tax: about $456M paid by ten clubs; the Suns paid the most at about $152M; each of the twenty non-tax clubs received about $11.4M. 2026-27 lines: tax $200.428M, first apron $209.015M, second apron $221.686M.",
  "Revenue sharing: in one leaked league year (2016-17 reporting) 14 of 30 clubs lost money before revenue sharing and 9 after; Memphis received about $32M, the league's most; the Lakers still cleared about $115M after paying in. In 2021-22 ten high-revenue clubs paid $163.6M into the pool, with the Warriors and Lakers alone over $88M of it.",
  "Green Bay Packers FY2025, reported July 2026: $453.2M per club in shared national revenue, up 4.8%; total Packers revenue $719M; metro population about 320,000 — and the same record-revenue report showed an operating loss.",
  "Sacramento: the owners voted 22-8 on May 15, 2013 to deny relocation; relocation is decided by a simple majority of the Board of Governors (16 of 30), not by a supermajority. The Hansen/Ballmer group raised to a $625M valuation ($409M for the Maloofs' 65%); the Ranadive group bought at a then-record $534M. Golden 1 Center opened 2016; the Sacramento City Council approved about $255M in land and cash toward it (capped at 47.7% of the $534.6M cost) without a public vote, and the city issued $273M of bonds in August 2015 against roughly $18M a year running to 2050. Seattle lost the Sonics to Oklahoma City in 2008; the 2012 Hansen/Ballmer SoDo memorandum of understanding, approved 7-2 by the Seattle City Council and unanimously by the King County Council, carried up to $200M of city and county bonds toward a roughly $490M arena, repaid from arena revenue and guaranteed by the buying group, so neither 2013 bid was privately financed; Climate Pledge Arena was later rebuilt, on a different deal, with about $1.15B of private money. Sacramento-Stockton-Modesto is the 20th-largest US television market and Seattle-Tacoma the 13th (2025-26 Nielsen DMA ranks; materially the same in 2013). Milwaukee approved about $250M of public money in 2015 under a relocation threat and won the 2021 title.",
  "NBA draft lottery: since the 2019 reform the three worst records each hold a 14.0% chance at the first pick.",
  "Expansion, as of 2026-09-01 and due a re-check every term: in March 2026 the Board of Governors voted 30-0 to formally explore expansion to Seattle and Las Vegas exclusively, targeting 2028-29, with PJT Partners advising; a final vote requires 23 of 30 governors and had not been taken as of 2026-09-01. In July 2026 the commissioner said the process was on track for a determination by year end. The league still has 30 clubs.",
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
    risk: "It is MODELED on the NBA's design — a percentage of local revenue into an equally split pool, with ELIGIBILITY conditions attached. The real conditions turn on market size and on performance rules for receiving clubs, not on a reinvestment floor; our CONDITION dial is ours. The plan's exact terms are not published; the design is widely reported as roughly half of each club's net local revenue.",
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
  {
    what: "Three weeks is too short a horizon to price what a rule costs, and this lesson says so rather than hiding it.",
    why: "Inside three weeks the money a club SAVES by putting less back is bigger than the gate it loses, so the league's total bank balance actually RISES with the share. The cost lands in Draw, next season, and this lesson never prices a point of Draw in dollars on any student surface.",
    risk: "A room reading only its own bank balances can conclude that high sharing made this league richer. It did not — it moved the bill to a season we do not play. Say the horizon out loud at CONSEQUENCE; it is on the board there.",
  },
  {
    what: "The Lesson 2 and Lesson 3 reinvest dials share a scale and not a base, so the before/after bar is drawn in DOLLARS, not in dial percentages.",
    why: "Lesson 2 spends a share of door money; Lesson 3 spends a share of local revenue, which also includes local television. The same dollars read up to 1.95x apart as percentages, so a percentage-point 'effort fell by Z' sentence would be a units artifact dressed up as behaviour.",
    risk: "If a future pass reintroduces a percentage-point comparison across the two lessons, it will be measuring the bases, not the room.",
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
  // Abstention honesty on the board tally: a desk with no number in is named as
  // an abstention, never folded into the median as a 5% nobody proposed.
  const lastRound = agg.rounds.length > 0 ? agg.rounds[agg.rounds.length - 1]! : null;
  const abstained = lastRound ? lastRound.abstained : 0;
  const abstainAtom = claim("adopted-abstained", abstained, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rule.liveDesks } });
  const abstainText =
    abstained > 0
      ? ` ${abstainAtom.rendered} desk${abstained === 1 ? "" : "s"} put no number in at all — an abstention counts in the two-thirds, and it can never be inside the band.`
      : "";
  const text =
    rule.how === "voted"
      ? `${passed.rendered} — SHARE ${share.rendered} · ${condition.rendered}. ${supporting.rendered} of ${desks.rendered} desks landed inside ten points of the room's middle number.${abstainText}`
      : `${passed.rendered} — the old rule holds at SHARE ${share.rendered} · ${condition.rendered}. Only ${supporting.rendered} of ${desks.rendered} desks landed inside ten points of the middle number, and two-thirds were needed.${abstainText}`;
  return { text, claims: abstained > 0 ? [share, supporting, desks, passed, condition, abstainAtom] : [share, supporting, desks, passed, condition] };
}

/**
 * The before/after bar, drawn in DOLLARS A WEEK.
 *
 * econ B3/F3: the two lessons' reinvest dials share a scale (0-40 in 5s) and NOT
 * a base — L2 spends a share of door money, L3 a share of local revenue, which
 * differ by up to 1.95x per club and by 62.5% league-wide. A room that put back
 * the identical dollars in both lessons read 38.5% lower on the L3 dial, and the
 * module then called that difference "effort went down" and named it moral
 * hazard. The comparison is now made on the only figure the two lessons share:
 * what each club actually SPENT, per week.
 */
/**
 * WHOSE RULE THIS WAS — one atom, every arm, one forbidden phrase.
 *
 * The status-quo and league-office arms did not write a rule. Any sentence that
 * names the rule in force takes this atom instead of a hard-coded noun phrase,
 * so the arm is recomputable and the false phrase is machine-forbidden rather
 * than proof-read.
 */
export function eraArmAtom(agg: WriteRuleAggregate): ClaimAtom {
  const how = agg.adopted?.how;
  const phrase =
    how === "voted"
      ? "the rule you wrote"
      : how === "leagueOffice"
        ? "the league office's rule"
        : how === "statusQuo"
          ? "the old rule this room did not replace"
          : "the old rule that was already in force";
  return claimWord("era-arm", phrase, how === "voted", how === "voted" ? undefined : "the rule you wrote");
}

export function reinvestEraLineClaimed(agg: WriteRuleAggregate): Claimed {
  const l3 = claim("era-l3-mean", agg.l3Mean, "percent1", { assertsSign: "nonNegative", bounds: { min: 0, max: REINVEST_MAX } });
  const l3d = claim("era-l3-dollars", agg.l3MeanDollars, "money", { assertsSign: "nonNegative" });
  // econ re-check R3 (blocking): this sentence had no arm branch, so a room that
  // wrote NO rule — `board:adoption` printing "NOT ADOPTED — the old rule holds
  // at SHARE 5%" — was told "Under the rule you wrote" on thirteen surface/phase
  // combinations, including the projector and the teacher's answer key. The arm
  // is now an atom: the word is recomputed against `adopted.how` like any other
  // quantifier, and the two arms that did not write a rule carry the forbidden
  // phrase as `absent`, so the audit fails if it ever comes back.
  const arm = eraArmAtom(agg);
  if (agg.l2MeanDollars === null) {
    const word = claimWord("era-no-l2", "no Lesson 2 numbers", true);
    return {
      text: `This room put back ${l3d.rendered} a week on average — ${l3.rendered} of what came through its doors — across three weeks under ${arm.rendered}. There are ${word.rendered} linked to this session, so the before-and-after bar has one bar in it. Use the rule's own before-and-after instead: the arrows at stage 4.`,
      claims: [l3, l3d, word, arm],
    };
  }
  const l2d = claim("era-l2-dollars", agg.l2MeanDollars, "money", { assertsSign: "nonNegative" });
  const delta = agg.l3MeanDollars - agg.l2MeanDollars;
  const deltaAtom = claim("era-delta-dollars", Math.abs(delta), "money", { assertsSign: "nonNegative" });
  const direction = claimWord(
    "era-direction",
    delta < -1 ? "went down" : delta > 1 ? "went up" : "did not move",
    delta < -1,
  );
  return {
    text: `Last lesson this room put back ${l2d.rendered} a week into its own clubs, with no rule at all. Under ${arm.rendered}, it put back ${l3d.rendered} a week. Effort ${direction.rendered} by ${deltaAtom.rendered} a week. Both figures are DOLLARS, because the two lessons' dials are percentages of different money.`,
    claims: [l2d, l3d, deltaAtom, direction, arm],
  };
}

/**
 * BC-1's own sentence: the arrow that moved, standing beside the arrow that did
 * not, with the reason attached. Every figure here is brute-forced through the
 * shipped settlement, so this sentence cannot say anything the model does not do.
 */
/**
 * WHY THE FLAT ARROW IS FLAT — the sentence the frame never said.
 *
 * gate-l3-play repair 5: the arrows rendered and the economics did not. "Why
 * didn't New York move?" was asked implicitly by the title and answered nowhere,
 * so the module's signature beat was a teacher-transfer dependency rather than a
 * playable one. This is computed from the same rows the frame draws, names the
 * desks it is about, and is printed BESIDE the arrows on the projector and on
 * every desk's own lens.
 */
export function arrowWhyLine(agg: WriteRuleAggregate): string {
  const rows = agg.arrows;
  if (rows.length === 0) return "";
  const full = rows.filter((r) => r.priceSteps === 0 && r.soldOut);
  const flat = rows.filter((r) => r.priceSteps === 0);
  const movedPrice = rows.filter((r) => r.priceSteps > 0);
  if (movedPrice.length === 0 && flat.length === rows.length) {
    return "Nobody's best price moved. A rule this small takes too little of each extra dollar to change what a seat is worth — and the buildings that fill could not have moved anyway, because you cannot discount a seat you do not have.";
  }
  if (full.length === 0) {
    return `${movedPrice.length} club${movedPrice.length === 1 ? "" : "s"} could sell more seats by charging less, so the rule moved what a seat is worth to them. The flat rows are already selling everything the tax touches, so there is nothing for a cheaper seat to buy.`;
  }
  const names = full.slice(0, 2).map((r) => r.deskHandle).join(" and ");
  return `${names} ${full.length === 1 ? "sold" : "sold"} every seat in the building at that price. You cannot discount a seat you do not have, so a tax on what you sell cannot move a number that is already capped. The clubs with empty seats CAN sell more by charging less, and that is why their arrows moved and these did not.`;
}

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
  // The status-quo branch is the modal outcome (econ F1: 71% of proposal
  // profiles), and at 5% NOTHING moves. Saying "fell from 15% to 15% — 0 clicks"
  // over a null instrument is not a beat; the honest beat is the rule the room
  // kept, plus what the number it argued about would have done.
  if (!agg.arrowsMovedAny) {
    const wouldRows = agg.arrowsWouldMove;
    const wouldMoved = wouldRows.filter((r) => r.reinvestSteps > 0);
    const wouldBiggest = [...wouldRows].sort((a, b) => b.reinvestSteps - a.reinvestSteps)[0] ?? null;
    const heldWord = claimWord("arrow-nothing-moved", "did not move a single dial", true, "desks saw that move");
    const cfShareAtom = claim("arrow-would-share", agg.arrowsWouldMoveShare, "percent", { assertsSign: "nonNegative", bounds: { min: SHARE_MIN, max: SHARE_MAX } });
    const wouldCount = claim("arrow-would-move-count", wouldMoved.length, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: rows.length } });
    const wouldSteps = claim("arrow-would-biggest-steps", wouldBiggest ? wouldBiggest.reinvestSteps : 0, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: REINVEST_GRID.length - 1 } });
    return {
      text:
        `The rule this room ended up with ${heldWord.rendered}. The best price and the best thing to put back are exactly where they were with no rule at all, at all ${rows.length} desks. ` +
        `At ${cfShareAtom.rendered} — the number this room argued about and did not pass — ${wouldCount.rendered} of ${rows.length} desks would have moved, the biggest by ${wouldSteps.rendered} clicks of the dial. That is what the room decided not to do.`,
      claims: [heldWord, cfShareAtom, wouldCount, wouldSteps],
    };
  }
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
  // projector B4: this line used to name the desk with the biggest swing on the
  // same frame that promises "No desk's money is ever ranked on this screen."
  // The magnitude is the teaching object; the name was the ranking. The name
  // goes, the promise stays, and the per-desk table at stage 3 is still in desk
  // order and still attributed, exactly as the privacy line describes.
  const biggestNet = [...agg.potFlows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))[0];
  const bigAtom = claim("pot-biggest-net", biggestNet ? Math.abs(biggestNet.net) : 0, "money", { assertsSign: "nonNegative" });
  const word = claimWord("pot-two-sided", "paid more in than they took out", payers.length > 0);
  return {
    text: `${total.rendered} went through the pot over three weeks. ${payerCount.rendered} desks ${word.rendered}; ${receiverCount.rendered} took out more than they put in. The biggest single swing at any one desk was ${bigAtom.rendered} — find your own row in the table and see whose it was.`,
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
  // `gate-l2-teacher` B5, third limb. Unlike its siblings this deck never
  // collapsed on a cold walk — every card still rendered. What it rendered was
  // worse: the real cards computed against an empty room, so the prescribed
  // rehearsal put sentences like "Nobody in this room ended down on the pot
  // this time" on the projector as statements of fact about a class that does
  // not exist, and a teacher had no way to tell which of them would still be
  // true tomorrow. `rehearsing` marks them, at the bottom of this function.
  const rehearsing = state.clubs.every((c) => c.seatId === null);
  /* --- C6 revenue sharing: both halves --- */
  {
    const pot = potLineClaimed(agg);
    // econ B7, the summit ruling: the payers really did end worse off, no
    // arithmetic in this lesson makes them whole, and the counter is an argument
    // owners actually have rather than a sum the class can settle. The card says
    // all of that in the room's own numbers instead of leaving it in the ledger.
    const payers = agg.potFlows.filter((f) => f.net < 0);
    const worstPayer = [...payers].sort((a, b) => a.net - b.net)[0] ?? null;
    const transferTruth = worstPayer
      ? `REDISTRIBUTION IS A TRANSFER, NOT A FREE LUNCH. ${payers.length} desk${payers.length === 1 ? "" : "s"} in this room ended the three weeks down on the pot, the worst by ${money(Math.abs(worstPayer.net))}, and nothing in this lesson's arithmetic gives it back. That is what a transfer is.`
      : "REDISTRIBUTION IS A TRANSFER, NOT A FREE LUNCH. Nobody in this room ended down on the pot this time, which is a fact about the rule you wrote, not a fact about sharing.";
    cards.push({
      id: "revenue-sharing",
      title: "SHARING HELPED — AND HERE IS WHAT IT COST",
      body: `${pot.text} ${transferTruth}`,
      rails: {
        rememberWhen:
          agg.potFlows.length > 0
            ? `Week 1, the moment the pot formed: money left ${agg.potFlows.filter((f) => f.net < 0).length} desks and came back out in equal portions to every club in the league, including the ones it had just left.`
            : "The week the pot formed and the money moved sideways across the room.",
        ourClass: `${pot.text} ${transferTruth} And the honest horizon: three weeks shows the transfer, but the cost of the effort that stopped lands in Draw, next season, which this lesson never prices in dollars.`,
        inSports:
          "In the leaked 2016-17 league year 14 of 30 clubs lost money BEFORE revenue sharing and 9 after. Memphis received about $32M, the most in the league — and the Lakers still cleared about $115M after paying in. In 2021-22 ten clubs paid $163.6M into the pool, the Warriors and Lakers alone over $88M of it. The payers agree to it in a collectively bargained deal because there is no league to sell without 29 solvent opponents. They argue about it every time the deal comes up, and they are not being stupid either way.",
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
        // econ B1: this rail scripted a memory the status-quo branch does not
        // produce. It now names the moment the room's OWN result had.
        rememberWhen: agg.arrowsMovedAny
          ? "The moment somebody in this room worked out that trying harder had got cheaper to skip. Nobody told them to feel that. The rule did."
          : "The moment the room could not agree, and the old rule held. Nothing about anybody's best move changed — which is also what a rule does when it is small enough.",
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
        // SR A1 (BLOCKING): the old rail asserted an NBA rule that does not
        // exist — relocation is decided by a SIMPLE MAJORITY of the Board of
        // Governors, 16 of 30 — and cited a vote governed by the opposite rule
        // as its evidence. The real supermajority is current and checkable, and
        // it sits on the same institution.
        inSports:
          "Moving the Kings only needed a simple majority — 16 of the 30 owners — and it still lost 22-8 on May 15, 2013, so the Seattle side lost by far more than the rule required. The votes that add OWNERS are the ones that need a supermajority: expanding to 32 clubs takes 23 of the 30. In March 2026 those same owners voted 30-0 just to EXPLORE Seattle and Las Vegas. When money is being divided, leagues make the payers be bought rather than outvoted — which is the argument behind your own two-thirds.",
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
    // projector B4: the same privacy self-contradiction the pot line carried.
    // The magnitude teaches; the desk name ranked one desk's money on a frame
    // that promises no desk's money is ever ranked.
    const body = biggest
      ? `The club in this room whose name pulled hardest on the road put ${givenAtom.rendered} into OTHER clubs' buildings over three weeks — money that landed ${word.rendered}, not theirs.`
      : "No week has been played yet, so the road ledger is empty.";
    cards.push({
      id: "shared-product",
      title: "MOST OF WHAT FILLED YOUR BUILDING WAS SOMEBODY ELSE'S TEAM",
      body,
      rails: {
        rememberWhen: "The week the rookie landed somewhere else and your building filled anyway — because of a club you do not run.",
        ourClass: body,
        inSports:
        // SR A3: "several times ANY one club's gate" is false for the biggest
        // markets and is contradicted by this module's own printed Knicks
        // figure. $76B / 11 years / 30 clubs is about $230M a club a year,
        // against a record $193M Knicks gate in 2024-25 — 1.2x, not "several".
          "LeBron James left Cleveland in 2010 and that club's ticket demand and franchise value cratered — and thirty other buildings felt it too. The national television deal is about $76B over eleven years, 2025-26 through 2035-36, split equally: about $230M a club a year. For a small-market club that is several times what it takes at the gate. For the biggest — the Knicks took a record $193M at the gate in 2024-25 — it is about the same money. That gap IS the market-size argument you just voted on.",
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
    // econ F2 (BLOCKING): this card asserted a comparative the model
    // contradicts — reachable at six desks, the minimum league — while the
    // audit could not see it. The comparative is now BRANCHED, and the concept
    // is stated so it survives both branches: what you control least is what you
    // control least, whether or not it happens to be the larger pile this week.
    const nationalBigger = national > gate;
    const word = claimWord(
      "synth-national-bigger",
      nationalBigger ? "more than the whole room took at the gate" : "and every dollar of it arrived whether this room sold a seat or not",
      nationalBigger,
    );
    const body =
      rows.length > 0
        ? `This room sold ${gateAtom.rendered} of tickets in three weeks — every dollar of it decided by your dials, and taxed by your rule. The national television check, which nobody in this room set and the pot never touched, was ${natAtom.rendered} — ${word.rendered}.`
        : "No week has been played yet, so there is nothing to decompose.";
    cards.push({
      id: "composition",
      title: "THE MONEY YOU ARGUED OVER IS NOT THE MONEY THAT PAYS YOU",
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
          "Seattle refused public arena money in 2006 and lost the Sonics to Oklahoma City in 2008. Climate Pledge Arena was later rebuilt with about $1.15B of PRIVATE money — and in March 2026 the same Board of Governors that kept the Kings in Sacramento voted 30-0 to explore giving Seattle a club, targeting 2028-29. The owners have to vote again to finish it: 23 of the 30 have to say yes, and as of September 2026 they have not voted. Milwaukee approved about $250M of public money in 2015 under an explicit relocation threat, kept the Bucks, and won the 2021 title. Both cities' verdicts are still open.",
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
    // SR A4: the room voted on Sacramento twenty minutes ago, and the operative
    // fact in that vote was $255M of city money. The old copy claimed nothing in
    // the lesson was about public money, which the capstone contradicts.
    body:
      "You voted on public money today and may not have noticed — on BOTH term sheets. Sacramento's winning bid put about $255M of CITY money into a downtown arena, borrowed in 2015 against payments running to 2050; Seattle's arena plan carried up to $200M of city and county bond money of its own. Neither side was private. What differed was how much, how fast, and who got asked — and that is a large part of what beat a bid worth $91M more. Every arena in this league sits in a town that had to make that call, and the mainstream economics finding is that stadium subsidies rarely pay off for the city that grants them.",
    rails: {
      rememberWhen: "The Sacramento term sheet, and the line on it that said about $255M of it was the city's money.",
      ourClass: "Every club in this league operated a building it did not have to pay to construct. That was a simplification, and this card is where we admit it — and where the vote you just cast turns out to have been about it anyway.",
      inSports:
        "Seattle, 2006: no public money, no team by 2008. Milwaukee, 2015: about $250M of public money under an explicit relocation threat, and a title in 2021. Sacramento, 2013-16: about $255M of city money and the club stayed. Seattle rebuilt privately for about $1.15B and may get a club back anyway.",
      economistsCall: "PUBLIC SUBSIDY. OPPORTUNITY COST — the money a town spends on an arena is money it does not spend on something else.",
      outsideSports: "Any time a town gives up money to keep something it wants. Outcome is not decision quality, in both directions.",
    },
    // No atoms, deliberately: every sentence on this card is dated real-world
    // content that Sports Reality owns and nothing here is computed from state.
    // `moduleClaims` still registers it, so a future computed line added here
    // without an atom is a detectable hole rather than an invisible one.
  });

  // The cold walk. Every card is kept — a rehearsal that shows five of eight is
  // the defect, not the fix — but the title says what it is and the one rail
  // that is computed from the room says the room is imaginary. IN SPORTS,
  // ECONOMISTS CALL THIS and OUTSIDE SPORTS are dated real-world content and
  // are identical tomorrow, so they are left exactly as they are.
  if (rehearsing) {
    return cards.map((c) => ({
      ...c,
      title: `REHEARSAL — ${c.title}`,
      rails: {
        ...c.rails,
        rememberWhen: `${c.rails.rememberWhen} (A STAND-IN: with a class this names a moment your room actually had.)`,
        ourClass: `${c.rails.ourClass}\n\nEvery figure above is a STAND-IN — no desks have played. With a real class this rail is computed from your room's own three weeks and its own vote.`,
      },
    }));
  }
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
  // ARM-DEPENDENT TEACHER SURFACES. projector B3 shipped a /teach script that
  // contradicted the projector on the league-office arm and no instrument could
  // see it, because the sweep only ever registered surfaces that carry figures.
  // The script a teacher reads ALOUD is now audited like any other claim: the
  // arm's own script is registered with the arm's own rule figures in it, so a
  // script that names the wrong rule fails BINDING, and the CONSEQUENCE ask is
  // registered beside the answer key it must agree with.
  push("teach:adopted:script", adoptedScriptClaimed(state, agg));
  push("teach:consequence:ask", consequenceAskClaimed(state, agg));
  for (const card of synthesisCards(state, agg)) {
    if (card.claims && card.claims.length > 0) push(`synthesis:${card.id}`, { text: card.body, claims: card.claims });
    else out.push({ surface: `synthesis:${card.id}`, text: card.body, claims: [] });
  }
  for (const row of agg.potFlows) {
    push(`play:desk-${row.deskNumber}:transferLine`, transferLineClaimed(row));
  }
  // econ re-check R1 (blocking): the string the student device actually renders
  // is the PER-WEEK one built in `viewWeek`, and only the three-week season row
  // was ever registered — so the audited sentence was never rendered and the
  // rendered sentence was never audited. The critic drifted the rendered week
  // line by 40% and the harness passed 10/10. Every week line every desk can see
  // is now registered from the same builder the view calls, and the harness
  // diffs the REGISTERED text against the strings the view functions really
  // emit (RENDER limb), so registration and rendering can no longer drift apart.
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null) continue;
    for (const w of club.weeks) {
      push(`play:desk-${club.deskNumber}:week-${w.week + 1}:transferLine`, weekTransferClaimed(club, w));
    }
  }
  return out;
}

/**
 * The per-week pot row, as the student device reads it.
 *
 * ONE source for the numbers and ONE source for the sentence: `viewWeek` calls
 * this and renders `.text` unchanged, and `moduleClaims` registers exactly the
 * same call. A number that drifts on the way to the screen therefore drifts away
 * from a registered atom the harness recomputes from raw state.
 */
export function weekFlowRow(club: Club, w: SettledWeek): PotFlowRow {
  return {
    deskHandle: deskHandleFor(club),
    deskNumber: club.deskNumber,
    sizeLabel: profileOf(club).sizeLabel,
    paidIn: w.pot.paidIn,
    tookOut: w.pot.tookOut,
    net: w.pot.net,
    ownDialDelta: w.cashDelta - w.pot.net,
    docked: w.pot.docked,
    paidInText: money(w.pot.paidIn),
    tookOutText: money(w.pot.tookOut),
    netText: money(w.pot.net),
  };
}

export function weekTransferClaimed(club: Club, w: SettledWeek): Claimed {
  return transferLineClaimed(weekFlowRow(club, w), w.week + 1);
}

/**
 * The paid-in / took-out attribution sentence, per desk (BC-6, fix 3).
 *
 * `week` is the week number when the row is one week's pot, and undefined when
 * it is the three-week season row: the atom ids and the closing clause both
 * carry the period, because the week row used to end "everything else your books
 * did THIS SEASON" over one week's numbers.
 */
export function transferLineClaimed(row: PotFlowRow, week?: number): Claimed {
  const tag = week === undefined ? "" : `-w${week}`;
  const paid = claim(`transfer-paid-${row.deskNumber}${tag}`, row.paidIn, "money", { assertsSign: "nonNegative" });
  const took = claim(`transfer-took-${row.deskNumber}${tag}`, row.tookOut, "money", { assertsSign: "nonNegative" });
  const net = claim(`transfer-net-${row.deskNumber}${tag}`, Math.abs(row.net), "money", { assertsSign: "nonNegative" });
  const word = claimWord(`transfer-direction-${row.deskNumber}${tag}`, row.net >= 0 ? "came to you" : "left you", row.net >= 0);
  const period = week === undefined ? "this season" : `in week ${week}`;
  return {
    text: `You paid ${paid.rendered} into the pot and took ${took.rendered} back out. On the pot alone, ${net.rendered} ${word.rendered}. Everything else your books did ${period} came off your own two dials.`,
    claims: [paid, took, net, word],
  };
}

/**
 * THE CONSEQUENCE BEAT — one atom set, one direction, one question.
 *
 * gate-l3-teacher B1 (blocking): the module printed a computed line saying
 * "Effort went UP by 20%" and, one row below it in the same panel, directed the
 * teacher to ask "Whose effort went DOWN?" with an answer key insisting the
 * answer was "it stopped being worth it". A random competent teacher was being
 * told, in writing and on the projector, to ask the class a question this
 * class's own evidence refutes. The question and the line are now computed from
 * the same place and cannot disagree: whichever way the room moved, the ASK
 * moves with it, and the unlinked branch asks about the rule's own before/after
 * instead of a lesson that was never linked (B2).
 */
export type ConsequenceBeat = {
  direction: "down" | "up" | "flat" | "noL2";
  question: string;
  answer: string;
  claimed: Claimed;
};

export function consequenceBeat(state: WriteRuleState, agg: WriteRuleAggregate): ConsequenceBeat {
  const era = reinvestEraLineClaimed(agg);
  const dollarRows = agg.reinvestEra.filter((r) => r.l2Dollars !== null);
  const dropped = dollarRows.filter((r) => r.l3Dollars < (r.l2Dollars ?? 0) - 1).length;
  const rose = dollarRows.filter((r) => r.l3Dollars > (r.l2Dollars ?? 0) + 1).length;
  const delta = agg.l2MeanDollars === null ? 0 : agg.l3MeanDollars - agg.l2MeanDollars;
  const direction: ConsequenceBeat["direction"] =
    agg.l2MeanDollars === null ? "noL2" : delta < -1 ? "down" : delta > 1 ? "up" : "flat";

  const droppedAtom = claim("consequence-dropped-desks", dropped, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.reinvestEra.length } });
  const roseAtom = claim("consequence-rose-desks", rose, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: agg.reinvestEra.length } });
  // econ re-check R4 (blocking): the guard existed in the `noL2` branch only, so
  // a room whose own stage-4 instrument had just printed "the best price and the
  // best thing to put back are exactly where they were with no rule at all, at
  // all N desks" was handed a moral-hazard answer key two beats later. Whether
  // the rule moved ANY desk's best move is now an atom on every branch, and each
  // branch's question and answer key branch on it: no incentive movement, no
  // incentive story.
  const moved = agg.arrowsMovedAny;
  const movedAtom = claimWord(
    "consequence-rule-moved",
    moved ? "this rule moved somebody's best move" : "this rule moved nobody's best move",
    moved,
  );

  if (direction === "noL2") {
    // The unlinked room has no before-bar at all, and the module used to count
    // desks against a lesson that did not exist. It has a perfectly good
    // rule-driven before/after of its own: the arrows.
    const word = claimWord("consequence-no-l2-instrument", "no Lesson 2 to measure against", true, "put back less than they did last lesson");
    const question = moved
      ? "Under this rule, what became the best thing to do with a dollar — and did anybody DECIDE that, or did it just stop being worth it?"
      : "Under this rule, nothing about anybody's best move changed. Why not — and what would it have taken?";
    return {
      direction,
      question,
      answer:
        "There is no Lesson 2 bar in this room, so do not fish for one. The evidence is the arrow frame you just put up: the best thing to put back, with the rule and without it, computed from this room's own three weeks.",
      claimed: {
        text: `${era.text} This session has ${word.rendered}, so the question below is asked about the rule's own before-and-after — the stage 4 arrows — and not about last lesson. Those arrows say ${movedAtom.rendered}. Take three answers before you name anything.`,
        claims: [...era.claims, word, movedAtom],
      },
    };
  }
  if (direction === "up") {
    const word = claimWord("consequence-nobody-decided", moved ? "nobody had to decide to try harder" : "somebody in this room decided that on their own", true);
    return {
      direction,
      question: moved
        ? "Whose effort went UP — and what was it about the rule that paid you for it?"
        : "Whose effort went UP? Under this rule nobody's best move changed at any desk — so what was it that paid you for it?",
      answer: moved
        ? "The honest answer is the CONDITION, if the room voted it in: it pays a club for putting money back, so putting money back got more valuable, not less. Nobody decided to care more. The rule made trying worth more. That is the same mechanism as moral hazard, running the other way — say so."
        : "Do NOT credit the rule here. This room's own arrows say it changed nobody's best price and nobody's best reinvest, so nothing about it made trying worth more — desks put back more anyway. Take the answers, then ask what the rule would have had to be to pay for it. Stage 4's counterfactual column has that number.",
      claimed: {
        text: `${era.text} ${roseAtom.rendered} desks put back MORE dollars a week than they did last lesson and ${droppedAtom.rendered} put back less — and ${word.rendered}. The arrows at stage 4 say ${movedAtom.rendered}. Ask the question, take the answers, and do not name the mechanism until somebody has described it.`,
        claims: [...era.claims, droppedAtom, roseAtom, word, movedAtom],
      },
    };
  }
  if (direction === "flat") {
    const word = claimWord("consequence-nobody-decided", "nobody had to decide anything", true);
    return {
      direction,
      question: moved
        ? "The room put back about the same as last lesson. Did the rule change what you WANTED to do — or only what it cost you?"
        : "The room put back about the same as last lesson, and under this rule nobody's best move changed at any desk either. So what did this rule actually do?",
      answer: moved
        ? "Both answers are defensible and the room should argue about it. The transfer moved money; the effort did not move much. That is a rule that redistributed without changing behaviour, which is a real and unusual outcome — name it as one."
        : "It moved money and nothing else. The effort did not move and neither did the incentive: this room's own arrows are flat at every desk. That is a PURE TRANSFER — name it as one, and use stage 4's counterfactual column for the share that would have moved something.",
      claimed: {
        text: `${era.text} ${droppedAtom.rendered} desks put back fewer dollars a week than last lesson and ${roseAtom.rendered} put back more — and ${word.rendered}. The arrows at stage 4 say ${movedAtom.rendered}. Take three answers before you name anything.`,
        claims: [...era.claims, droppedAtom, roseAtom, word, movedAtom],
      },
    };
  }
  const word = claimWord("consequence-nobody-decided", moved ? "nobody had to decide to try less" : "nothing about the rule made trying less worth it", true);
  return {
    direction,
    question: moved
      ? "Whose effort went down? Did anybody DECIDE to try less — or did it just stop being worth it?"
      : "Whose effort went down? Under this rule nobody's best move changed at any desk — so what made it fall?",
    answer: moved
      ? "The answer you are fishing for is the second half: it stopped being worth it. Nobody decided anything."
      : "Do NOT fish for moral hazard here. This room's own arrows say the rule changed nobody's best price and nobody's best reinvest, so putting money back never stopped being worth it — these desks put back less anyway. Say that out loud: the fall is theirs, not the rule's. Then ask what the rule would have had to be to change anybody's best move — stage 4's counterfactual column has that number.",
    claimed: {
      text: `${era.text} ${droppedAtom.rendered} desks put back fewer dollars a week than they did last lesson and ${roseAtom.rendered} put back more — and ${word.rendered}. The arrows at stage 4 say ${movedAtom.rendered}. Ask the question, take the answers, and ${moved ? "do not name moral hazard until somebody has described it" : "do not name moral hazard at all in this room — the instrument does not support it"}.`,
      claims: [...era.claims, droppedAtom, roseAtom, word, movedAtom],
    },
  };
}

export function consequenceAnswerClaimed(state: WriteRuleState, agg: WriteRuleAggregate): Claimed {
  return consequenceBeat(state, agg).claimed;
}

/**
 * The scripted CONSEQUENCE question, as an auditable claim in its own right.
 *
 * It carries the SAME direction atom the computed line carries, so an audit that
 * recomputes the direction catches a question that disagrees with the bar beside
 * it — which is exactly the defect gate-l3-teacher B1 found by reading them.
 */
export function consequenceAskClaimed(state: WriteRuleState, agg: WriteRuleAggregate): Claimed {
  const beat = consequenceBeat(state, agg);
  const word = claimWord(
    "consequence-ask-direction",
    beat.direction === "down" ? "went down" : beat.direction === "up" ? "went UP" : beat.direction === "flat" ? "about the same" : "Under this rule",
    beat.direction === "down",
  );
  // R1: this used to be a composite string that no surface rendered — question,
  // a bracketed atom and the answer key glued together for the registry alone.
  // The audited sentence is now exactly the question /teach, /board and /play
  // print, and the direction word lives inside that question.
  return { text: beat.question, claims: [word] };
}

/**
 * The script /teach prints under the printed rule — one per ARM, carrying that
 * arm's own share so a script naming the wrong rule cannot pass the audit.
 */
export function adoptedScriptClaimed(state: WriteRuleState, agg: WriteRuleAggregate): Claimed {
  const rule = agg.adopted;
  if (!rule) return { text: "No rule is in force yet.", claims: [] };
  const share = claim("script-share", rule.share, "percent", { assertsSign: "nonNegative", bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  const arm = claimWord(
    "script-arm",
    rule.how === "voted" ? "this room wrote it" : rule.how === "leagueOffice" ? "this room did not write it" : "the old rule holds",
    rule.how === "voted",
  );
  const script = rule.how === "voted" ? "Print it and read it. Do not congratulate the room and do not warn them about anything." : rule.how === "leagueOffice" ? LEAGUE_OFFICE_COPY : STATUS_QUO_COPY;
  return {
    text: `The rule in force is SHARE ${share.rendered} and ${arm.rendered}. ${script}`,
    claims: [share, arm],
  };
}

/** The projector/desk question — the SAME atom set the answer key came from. */
export function consequenceQuestionFor(state: WriteRuleState, agg: WriteRuleAggregate): string {
  return consequenceBeat(state, agg).question;
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
    // econ B1 / gate-l3-play repair 5: the stage-4 script used to direct the
    // teacher to ask "why didn't the big market move?" even when NO desk was
    // sold out and NOTHING had moved — a false-premise question at the module's
    // designated peak, in its single most likely outcome. The beat now branches
    // on what actually happened, and the WHY is on the frame either way.
    {
      stage: 4,
      name: agg.arrowsMovedAny ? "The arrow that moved, and the one that did not" : "The rule you kept, and what would have moved",
      headline: arrowLineClaimed(agg).text,
      say: !agg.arrowsMovedAny
        ? `Do NOT ask why a big market did not move — nothing moved, and the arithmetic is the payload here. Ask it in these words: "what would it have taken to change anybody's mind?" Then read the ${agg.arrowsWouldMoveShare}% column beside it: that is the rule this room argued about and did not pass, and those are the dials it would have moved. The room chose the quiet outcome, and this is what the quiet outcome costs.`
        : flatDeskName(agg)
          ? `Ask it in these words: "why didn't ${flatDeskName(agg)}'s PRICE move?" — name the price arrow, because that row's put-back arrow DID move and a student who says "but it did" is right. The answer is on the frame: their building was already full, and you cannot discount a seat you do not have.`
          : `Ask it in these words: "why did some clubs' best price come down and others' not move at all?" The answer is on the frame: a club with empty seats can sell more by charging less; a club that sells out has nothing for a cheaper seat to buy.`,
    },
    {
      stage: 5,
      name: "What you changed about yourselves",
      headline: reinvestEraLineClaimed(agg).text,
      say:
        agg.l2MeanDollars === null
          ? "No Lesson 2 is linked, so this bar has one bar in it and you should say so plainly. The rule's own before-and-after is the frame you just left — use that instead, and do not fish for a fall that has nothing to be measured against."
          : rule && rule.share >= 25
            ? "Nobody was told this would happen. Say that out loud before you say anything else. Both figures are DOLLARS a week — the two lessons' dials are percentages of different money, so percentages would not be comparing the same thing."
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
        // econ F8 (BLOCKING): this sample used to train a first-time teacher to
        // elicit "sharing pays the payer through the product" as "the whole
        // lesson". SIMPLIFICATIONS entry 5 withdrew exactly that proposition —
        // at the shipped constants every big market's own best share is 0%. The
        // live `big-for-sharing` flag was already repaired; this was the stale
        // copy, and the rehearsal panel is what a teacher reads BEFORE class.
        "Pull that voice right now — it lands ten times harder from a student than from you. Ask only: why would you pay for that? Do not answer it for them, and do not tell them sharing pays the payer back. In this model it does not: the payers really do end worse off, and the counter is an argument the real owners have, not a sum this class can settle.",
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
      sample(
        "The interior of PLAY is where this rehearsal has to go",
        ["Close round 1 of 3", "Run the two-thirds test", "Close week 1"],
        "Advance ▸ jumps STRAIGHT OUT of PLAY to REVEAL and skips the histogram, the two-thirds test, the adoption print, all three weeks, the week bell and the rookie card — about half the period. To rehearse those, press the three PLAY controls in order: the rule step three times, then once more for the two-thirds test, then once more to open the season, then the week bell three times. Only then advance.",
        "now",
      ),
    );
  }
  return flags;
}

export function teacherWatchFor(state: WriteRuleState, phase: CanonicalPhase): WatchFlag[] {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  if (live.length === 0) return rehearsalWatchFor(phase);
  const out: WatchFlag[] = [];

  // gate-l3-teacher B4: a pair that arrives after the league closes must never
  // be silent on this console again.
  const observers = state.observerSeats ?? [];
  if (observers.length > 0) {
    const seasonClosed = phase !== "LOBBY" && phase !== "HOOK" && phase !== "PLAY";
    out.push({
      id: "late-observers",
      label: seasonClosed
        ? `${observers.length} pair${observers.length === 1 ? "" : "s"} arrived after the last week closed and could not be given a club`
        : `${observers.length} pair${observers.length === 1 ? "" : "s"} arrived after the league closed and could not be given a club`,
      desks: observers.map((_, i) => `Late pair ${i + 1}`),
      action: seasonClosed
        ? "There is no club left to hand them — the three weeks are settled and starting one now would change numbers this room has already been shown. Their screen says so and shows them the rule in force; seat them beside a desk near the door. Everything from here — the board, the argument, the synthesis — is the whole room's, so they lose nothing but the three weeks."
        : "Every club in this league is already being run. Seat them with a neighbouring desk and tell that desk they now have four people. Their own device says the same thing and shows them the rule in force, so they are not staring at a blank screen.",
      urgency: "now",
    });
  }
  const handed = live.filter((c) => c.handedOver).map(deskHandleFor);
  if (handed.length > 0 && (phase === "PLAY" || phase === "HOOK")) {
    out.push({
      id: "handed-over",
      label: "Took over a league-office club after the vote had started",
      desks: handed,
      action:
        "They did not write this rule and their club's earlier weeks were played by the league office. Their own screen says so. Give them ten seconds on what the rule in force is before the next bell.",
      urgency: "now",
    });
  }

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
        // gate-l3-teacher B6: this line used to claim an affordance the desk did
        // not have AND describe a rule the module no longer runs. Both halves
        // are now true — the copy below is on the desk's own proposal screen,
        // word for word, whenever it has no number in.
        action:
          "Close the round when you are ready. A desk with no number in has ABSTAINED: it is not counted in the room's middle number, and it cannot be inside the ten-point band, so the two-thirds test counts it as a desk that did not back the rule. Its own screen says exactly that. Nobody is skipped and nothing is invented for them.",
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
    // Dollars, not dial positions — the two lessons' dials are percentages of
    // different money (econ B3).
    const dropped = agg.reinvestEra.filter((r) => r.l2Dollars !== null && r.l3Dollars < (r.l2Dollars ?? 0) - 1);
    const rose = agg.reinvestEra.filter((r) => r.l2Dollars !== null && r.l3Dollars > (r.l2Dollars ?? 0) + 1);
    if (dropped.length > 0) {
      out.push({
        id: "effort-down",
        label: "Put back FEWER DOLLARS a week this lesson than last lesson",
        desks: dropped.map((r) => r.deskHandle),
        action: "These are the desks to ask first. The question is never 'why did you stop trying' — it is 'did you decide to try less, or did it just stop being worth it?'",
        urgency: "now",
      });
    }
    if (rose.length > 0) {
      out.push({
        id: "effort-up",
        label: "Put back MORE DOLLARS a week this lesson than last lesson",
        desks: rose.map((r) => r.deskHandle),
        action:
          "Ask these desks what paid them for it. If the room voted the CONDITION in, that is the answer, and it is the same mechanism as moral hazard running the other way. Do not let the discussion assume effort fell if this list is the longer one.",
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
        action:
          "Both term sheets are on their screens with the numbers on them — $625M from Seattle against $534M from Sacramento, and the ~$255M of city money in the Sacramento column. Give them thirty seconds and show the room's own tally; an undecided desk still argues.",
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
        const last = agg.rounds.length > 0 ? agg.rounds[agg.rounds.length - 1]! : null;
        return {
          title: `Round ${Math.min(state.roundIndex + 1, ROUND_COUNT)} of ${ROUND_COUNT} — writing the rule`,
          lines: [
            state.closedRounds.length === 0
              ? "The veil announcement and the two dials. NO histogram — round 1 is deliberately blind so nobody copies the room."
              : `The anonymous histogram from round ${state.closedRounds.length}, unsorted, no names, no money, with the running middle number, the ten-point band drawn on it, and the live in-band count.`,
            last
              ? `On that histogram right now: ${last.inBand} of ${last.roomSize} desks are inside the band and ${last.needed} are needed.${last.abstained > 0 ? ` ${last.abstained} abstained and cannot be inside it.` : ""}`
              : "Lock progress only. Nothing about anybody's club is on this screen.",
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
      return { title: "What you changed about yourselves", lines: [reinvestEraLineClaimed(agg).text, consequenceQuestionFor(state, agg)] };
    case "COUNTERFACTUAL":
      return { title: "The rule you did not write", lines: [counterfactualLineClaimed(agg).text, COUNTERFACTUAL_HONESTY] };
    case "ARGUE":
      return {
        title: "SACRAMENTO, 2013 — the Board of Governors",
        lines: [
          state.kingsRevealed
            ? kingsSplitLineClaimed(agg).text
            : state.kingsSplitShown
              ? `This room's own tally is up, alone: ${agg.kingsSplit.deny} to deny, ${agg.kingsSplit.approve} to approve. The owners' 22-8 is NOT on the screen yet — let the room sit with its own verdict first.`
              : "Both term sheets with their real figures, no result. Nobody has seen the vote — not even this room's own.",
          ARGUE_PROMPT,
        ],
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
      return { title: "Closing card", lines: [completeCopyFor(state.adopted?.how)] };
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
          "Tell the room to write their 4-digit rejoin PIN somewhere that is not the screen showing it — the back of a hand, a corner of a notebook. If a Chromebook dies, that PIN puts the pair straight back in their own desk. If they lost it, press Reseat beside their name and read them a new one.",
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
            `Round ${Math.min(state.roundIndex + 1, ROUND_COUNT)} of ${ROUND_COUNT}. ${submitted}/${live} desks have a number in THIS round — every desk starts each round with nothing in, so this counter is honest in rounds 2 and 3 as well.`,
            state.closedRounds.length === 0
              ? "Round 1 shows NO histogram. That is deliberate — a room that sees the median first writes the median, and then nobody has reasoned."
              : (() => {
                  const last = agg.rounds[agg.rounds.length - 1]!;
                  return `The histogram is up: anonymous, unsorted, no money, no names, with the ten-point band drawn on it. Right now ${last.inBand} of ${last.roomSize} desks would pass; ${last.needed} are needed. Say that number out loud — the two-thirds tension is the engine of this vote and it used to be invisible until it was over.`;
                })(),
            state.roundIndex >= ROUND_COUNT
              ? "The vote is SEALED. Nothing a desk touches now can change the rule — the two-thirds test runs on the numbers that were in when the round closed."
              : "If the room stalls or you are short of time, the \u201cOperate the league office's rule\u201d button beside this control ends the vote and puts a real 30% rule in force. It cannot be undone.",
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
          // projector B3 (BLOCKING): `how === "voted" ? ... : STATUS_QUO_COPY`
          // routed the LEAGUE-OFFICE arm into the status-quo script, so the one
          // control a teacher reaches for when the room stalls told them to say
          // "the old rule holds — 5%" while a 30% rule was in force and printed
          // on the projector behind them. Three arms, three scripts.
          // R1: the arm script /teach reads and the arm script the audit checks
          // are now the same string. It was registered as `teach:adopted:script`
          // and assembled separately here, so the audited sentence was never the
          // one on the teacher's screen.
          now: [adoptionLineClaimed(agg).text, adoptedScriptClaimed(state, agg).text],
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

    case "CONSEQUENCE": {
      // teacher B1: the ASK and the computed line beside it come from ONE atom
      // set, so the scripted question can never contradict the room's own bar.
      const beat = consequenceBeat(state, agg);
      return {
        phase,
        minuteBudget: "6 min",
        now: [
          beat.claimed.text,
          "Take three answers before you name anything. The room will describe the mechanism before it has a word for it, and that is the order you want.",
          "Say the horizon out loud: three weeks shows the transfer. What the lost effort costs lands in DRAW, next season, and this lesson never prices a point of Draw in dollars.",
        ],
        ask: [
          { q: beat.question, answer: beat.answer },
          { q: "Who did the money you paid in actually help — and did any of it come back to you?", answer: "Both halves are true and both are on the pot column. The product they visit is the channel it comes back through." },
        ],
        dontExplainYet: ["The Kings vote. It is a different beat and it needs a clean start."],
        trigger: null,
        timeCut: TIME_CUT,
      };
    }

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
        // gate-l3-projector 5: the room's own verdict and the owners' 22-8 used
        // to land in the SAME press, so the beat the design reaches for — we
        // said this; now watch what thirty actual owners said — was compressed
        // into one paragraph. Two presses, teacher-paced.
        now: [
          "Read both term sheets off their screens: Seattle $625M ($409M for the Maloofs' 65%), Sacramento $534M and about $255M of CITY money in the arena. Seattle is the bigger cheque by about $91M. Every pair locks a vote.",
          state.kingsRevealed
            ? kingsSplitLineClaimed(agg).text
            : state.kingsSplitShown
              ? `This room's own tally is on the projector, alone: ${agg.kingsSplit.deny} deny, ${agg.kingsSplit.approve} approve. Sit with it. Take two arguments from each side BEFORE you press again — the owners' answer is the second press.`
              : `${live - agg.kingsSplit.undecided}/${live} desks have voted. The first press puts THIS ROOM's tally up alone; the owners' 22-8 is a second press after that.`,
        ],
        ask: [
          { q: ARGUE_PROMPT, answer: "There is no right answer and the real vote was 22-8, not unanimous. Eight owners voted the other way and they were not stupid." },
          { q: "Seattle offered MORE money and lost. What were the owners buying instead?", answer: "Anything about the league as a product, about other cities' leverage, or about what a move does to the value of everybody else's club." },
          {
            q: "Sacramento put about $255M of the city's own money into that arena. Should a city have to do that to keep a club?",
            answer:
              "No settled answer, and the class should split. The mainstream economics finding is that stadium subsidies rarely pay off for the city that grants them; the counter is that Seattle said no in 2006 and had no team by 2008. Both facts are on the finale cards.",
          },
        ],
        dontExplainYet: ["Nothing. This is the last held card in the module."],
        trigger: state.kingsRevealed
          ? null
          : state.kingsSplitShown
            ? "Press the commit reveal again to show the owners' 22-8 vote."
            : "Press the commit reveal to put THIS ROOM's tally up — on its own, before the owners answer.",
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
        now: [
          completeCopyFor(state.adopted?.how),
          `${state.adopted?.how === "voted" ? "This room's rule" : state.adopted?.how === "leagueOffice" ? "The rule this room played under" : "The rule that held"}: SHARE ${agg.adopted?.share ?? STATUS_QUO_SHARE}% · ${agg.adopted?.condition ? "CONDITION ON" : "CONDITION OFF"}.`,
        ],
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

/**
 * THE LEAGUE, as a thing the room can see.
 *
 * Every call site of this is PRE-SEASON — lobby, hook, the three voting rounds,
 * and the adoption screen. Nothing has settled yet at any of them, so every
 * figure here is opening state: it cannot carry another desk's decision, and
 * there is no leak to weigh. The moment a week settles, `cash` and `draw` become
 * decision-derived and this table stops being sent (the season view never asks
 * for it). If a future arm wants the league DURING the season it needs its own
 * function and its own privacy argument, not this one.
 *
 * Why cash and not seats: the buildings are 16,867 to 20,917 seats — a 24%
 * spread that would draw as twelve near-identical shapes and say nothing true.
 * The inequality this room is legislating about is MONEY (ADOPT_COPY: "the pot
 * is the big markets' money"), and the opening banks run 540k to 2.6M. Drawing
 * the real 5x gap is the honest picture; drawing the seat counts would be
 * decoration pretending to be evidence.
 */
const leagueTable = (state: WriteRuleState, viewerSlot: number) =>
  state.clubs.slice(0, state.leagueSize).map((c) => ({
    deskNumber: c.deskNumber,
    short: defOf(c).short,
    code: defOf(c).code,
    building: defOf(c).building,
    capacity: defOf(c).capacity,
    sizeLabel: profileOf(c).sizeLabel,
    draw: c.draw,
    cash: c.cash,
    live: c.seatId !== null,
    you: c.slot === viewerSlot,
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
  // R1: the week row's sentence and the week row's registered claim are the same
  // call. Nothing here rebuilds a number the audit does not see.
  const transfer = weekTransferClaimed(club, w);
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
    floorLine: floorLineFor(floorRuleFor(state), w),
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

/**
 * Wave 3b: THE FLOOR's own adopted-institution summary, parallel to
 * `ruleView` above — `null` before the floor's own two-thirds test has run
 * (before `floorAdopted`) and `null` again after a failed test (NO FLOOR:
 * `row.condition === false`), because a failed floor is nothing to summarise
 * on a shared surface — the season simply runs without it.
 */
function floorInstitutionView(state: WriteRuleState): { on: boolean; levelText: string; recipientLabel: string } | null {
  const row = state.institutions.floor;
  if (!row || !row.condition) return null;
  return {
    on: true,
    levelText: money(row.share),
    recipientLabel:
      row.recipient === "everyone"
        ? "Every club in the league split what was forfeited"
        : "Only the clubs that cleared the floor split what was forfeited",
  };
}

/**
 * Wave 3b: THE FLOOR's own per-week line, for the OWN club's settled-week
 * row alone — dollars only, at either band (the flat-line ruling above), so
 * this never needs a percent and its two dollar figures are never negative
 * (a forfeit or a bonus is 0 or positive, never a debt printed as a minus
 * sign). `null` whenever no floor is in force this season.
 */
function floorLineFor(floor: FloorRule, w: SettledWeek): { bound: boolean; dockedText: string; receivedText: string; line: number } | null {
  if (!floor.on) return null;
  const dockedAmt = w.pot.floorForfeitedDollars;
  const receivedAmt = w.pot.floorReceivedDollars;
  return {
    bound: w.pot.floorDocked,
    dockedText: dockedAmt > 0 ? `docked ${money(dockedAmt)}` : "not docked this week",
    receivedText: receivedAmt > 0 ? `received ${money(receivedAmt)} from the floor pool` : "received nothing from the floor pool",
    line: floor.level,
  };
}

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

/**
 * SEALING A ROUND.
 *
 * Two defects met here. (1) The round never sealed: with the full histogram and
 * the middle number on the projector, a desk could still drag its dial and press
 * PUT IT IN, and that late number replaced its round-3 vote and changed the rule
 * the class adopted (gate-l3-play, probe D). (2) `closeRound` never cleared
 * `club.proposal`, so rounds 2 and 3 opened with the board and the console both
 * asserting the room was finished before anybody had moved, and the teacher's
 * "no number in" list was empty for two of three rounds (gate-l3-projector B2).
 *
 * One repair answers both: a closed round is RECORDED (per live desk, with
 * `null` for an abstention) and the live control is CLEARED. Adoption reads the
 * recording, so nothing a desk does after the close can touch the adopted rule;
 * every "submitted" count is now genuinely per-round; and a desk that wants a
 * different number in round 2 has to say it again, out loud, on the record.
 */
export function closeRound(state: WriteRuleState): WriteRuleState {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const shares = live.map((c) => c.proposal?.share ?? null);
  const conditions = live.map((c) => c.proposal?.condition ?? null);
  const votedShares = shares.filter((s): s is number => s !== null);
  const closed = {
    round: state.roundIndex + 1,
    institution: "share" as InstitutionId,
    shares,
    conditions,
    median: votedShares.length > 0 ? snapShare(medianOf(votedShares)) : STATUS_QUO_SHARE,
    slots: live.map((c) => c.slot),
  };
  const clubs = state.clubs.map((c) =>
    c.seatId !== null && c.slot < state.leagueSize ? { ...c, proposals: [...c.proposals, c.proposal], proposal: null } : c,
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
  const outcome = runAdoption(state, "share");
  return { ...state, adopted: outcome.adopted, institutions: { ...state.institutions, share: outcome.adopted }, stage: "adopted" };
}

export function adoptLeagueOfficeRule(state: WriteRuleState): WriteRuleState {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize).length;
  const rule: AdoptedRule = {
    share: REAL_RULE_SHARE,
    condition: REAL_RULE_CONDITION,
    how: "leagueOffice",
    supporting: 0,
    liveDesks: live,
    median: REAL_RULE_SHARE,
    // Never below the rule in force, and never 0% (gate-l3-play repair 4).
    runnerUp: SHARE_MAX,
    institution: "share",
  };
  // The panic button skips institution 2 entirely (the room ran out of road
  // for one vote; it has none left for two) — THE FLOOR stays unadopted, and
  // the season plays under institution 1 alone. Jumps straight to "season",
  // never "adopted" (which `teacher:ruleStep` would otherwise read as an
  // invitation to open the floor rounds): documented, not hidden — the
  // league-office script says this room did not write ANY rule it is living
  // under, and that already covers the floor's absence honestly.
  return { ...state, adopted: rule, institutions: { ...state.institutions, share: rule }, stage: "season" };
}

/**
 * OPENS THE FLOOR. The board's own printed cost line and each club's own
 * stakes card are computed here, against the share the room ACTUALLY
 * adopted — never the median it argued about and never the floor's own
 * (not-yet-voted) level — because this is the one moment the spec's path
 * dependence has to be visible: what the floor would cost is now a fact
 * about a rule this room already wrote.
 */
export function openFloorRounds(state: WriteRuleState): WriteRuleState {
  const clubs = state.clubs.map((c) =>
    c.seatId !== null && c.slot < state.leagueSize ? { ...c, stakesCard: floorStakesFor(state, c) } : c,
  );
  return { ...state, clubs, stage: "floorRounds", floorRoundIndex: 0 };
}

/** Institution 2's own stakes card — see the type doc on `StakesCard`. Priced
 *  in DOLLARS, never a percent, per the flat-line ruling above. */
export function floorStakesFor(state: WriteRuleState, club: Club): StakesCard {
  const levels = floorLevelsFor(state.band);
  const atLevel = levels[Math.floor((levels.length - 1) / 2)] ?? FLOOR_LINE_5_6;
  const rule = state.adopted;
  const profile = profileOf(club);
  const def = defOf(club);
  // A projection, not a promise: this club's own opening Draw and house price,
  // under the SHARE the room actually adopted, split evenly across the
  // league — the same approximation `weekTakeFor` already makes for a single
  // club's own hypothetical.
  const home = settleHome(profile, def.capacity, club.draw, DRAW_START, profile.housePrice);
  const localRevenue = home.gate + home.inArena + localMediaFor(profile, club.draw);
  const taxedLocal = home.gate + localMediaFor(profile, club.draw);
  const share = rule ? rule.share / 100 : 0;
  const paidIn = Math.round(share * taxedLocal);
  const evenShare = paidIn / Math.max(1, state.leagueSize);
  // This club's own projected weekly reinvest SPEND in dollars — its current
  // dial applied to its own opening local revenue, the same basis
  // `reinvestSpend` uses everywhere else in this module.
  const ownReinvest = Math.round((club.reinvest / 100) * localRevenue);
  const wouldClear = ownReinvest >= atLevel;
  return {
    atLevel,
    ownReinvest,
    wouldClear,
    costIfBound: wouldClear ? 0 : Math.round(evenShare * CONDITION_COLLECT_FRACTION),
  };
}

/** Institution 2's own round close — parallel to `closeRound`, on the floor's own ballot. */
export function closeFloorRound(state: WriteRuleState): WriteRuleState {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const shares = live.map((c) => (c.floorProposal ? (c.floorProposal.on ? c.floorProposal.level : FLOOR_OFF) : null));
  const conditions = live.map((c) => (c.floorProposal ? c.floorProposal.recipient === "everyone" : null));
  const votedShares = shares.filter((s): s is number => s !== null);
  const closed = {
    round: state.floorRoundIndex + 1,
    institution: "floor" as InstitutionId,
    shares,
    conditions,
    // Dollar lines, not share points — never run through `snapShare` (a
    // 0-60 share-grid clamp). The room's own printed number is the plain
    // median of the dollar lines actually voted, one of $200,000/$300,000/
    // $400,000 at 7-8 or $0/$300,000 at 5-6.
    median: votedShares.length > 0 ? medianOf(votedShares) : FLOOR_OFF,
    slots: live.map((c) => c.slot),
  };
  const clubs = state.clubs.map((c) =>
    c.seatId !== null && c.slot < state.leagueSize ? { ...c, floorProposals: [...c.floorProposals, c.floorProposal], floorProposal: null } : c,
  );
  return {
    ...state,
    clubs,
    closedRounds: [...state.closedRounds, closed],
    floorRoundIndex: state.floorRoundIndex + 1,
    leagueFrozen: true,
  };
}

/** Institution 2's own adoption print — parallel to `adoptRule`. */
export function adoptFloor(state: WriteRuleState): WriteRuleState {
  const outcome = runAdoption(state, "floor");
  return { ...state, institutions: { ...state.institutions, floor: outcome.adopted }, stage: "floorAdopted" };
}

/* ----------------------------------------------------------------- room -- */

/**
 * THE ROOM — the teacher-private live read of what the desks are doing while
 * they are still doing it. This lesson runs two different rooms inside one PLAY
 * phase and they get two different reads, because they are two different
 * economics: the rule rounds are a BARGAINING spread, where every desk is
 * proposing a number at the whole league and the thing a teacher needs to see
 * is whether the room is converging or dug in; the season is a COMPLIANCE
 * spread, where each club sets its own price and dial alone under a rule the
 * room itself wrote, and the thing a teacher needs to see is who is about to be
 * bitten by it.
 *
 * Aggregate only, and teacher-only. Nothing here reaches /board or /play while
 * the round or the week is open — reading the shape out early tells the room
 * what to copy, and both reveals in this lesson are built on them not knowing.
 */
type L3RoomDesk = {
  handle: string;
  proposal: RuleProposal | null;
  ownLastProposal: RuleProposal | null;
  roundsPlayed: number;
  price: number;
  reinvest: number;
  locked: boolean;
  weeksPlayed: number;
  ownLastReinvest: number | null;
};

type L3RoomBin = { from: number; to: number; label: string; count: number; lockedCount: number; handles: string[] };

function roomSpreadOf(values: readonly number[]): { min: number; max: number; median: number; range: number } | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  return { min, max, median: Math.round(medianOf(sorted)), range: max - min };
}

function roomBinsOn(
  grid: readonly number[],
  label: (v: number) => string,
  rows: readonly { handle: string; value: number; committed: boolean }[],
): L3RoomBin[] {
  return grid.map((from) => {
    const inBin = rows.filter((r) => r.value === from);
    return {
      from,
      to: from,
      label: label(from),
      count: inBin.length,
      lockedCount: inBin.filter((r) => r.committed).length,
      handles: inBin.map((r) => r.handle),
    };
  });
}

/** raised / held / lowered against a desk's OWN previous committed number. */
function roomMovement(
  rows: readonly { value: number | null; own: number | null; hasPrior: boolean }[],
): { raised: number; held: number; lowered: number; basis: number; noOwnPrior: number; noPrior: number; deciding: number } {
  let raised = 0;
  let held = 0;
  let lowered = 0;
  let noOwnPrior = 0;
  let noPrior = 0;
  let deciding = 0;
  for (const r of rows) {
    if (r.value === null) deciding += 1;
    else if (!r.hasPrior) noPrior += 1;
    else if (r.own === null) noOwnPrior += 1;
    else if (r.value > r.own) raised += 1;
    else if (r.value < r.own) lowered += 1;
    else held += 1;
  }
  return { raised, held, lowered, basis: raised + held + lowered, noOwnPrior, noPrior, deciding };
}

function movementSentence(
  m: { raised: number; held: number; lowered: number; basis: number; noOwnPrior: number; noPrior: number },
  dial: string,
  unit: string,
  words: { up: string; same: string; down: string },
  firstLabel: string,
  bellLabel: string,
): string {
  const inSoFar = m.basis + m.noOwnPrior + m.noPrior;
  if (inSoFar === 0) return `Nobody is in yet — movement shows up as ${unit}.`;
  if (m.noPrior === inSoFar) return `${firstLabel} — there is nothing behind these desks to have moved off yet.`;
  if (m.basis === 0) return `Nobody in so far has a ${dial} of their own to have moved off.`;
  return `Of the ${inSoFar} in so far: ${m.raised} ${words.up}, ${m.held} ${words.same}, ${m.lowered} ${words.down}${
    m.noOwnPrior > 0 ? ` · ${m.noOwnPrior} moving off ${bellLabel}` : ""
  }${m.noPrior > 0 ? ` · ${m.noPrior} on their first one` : ""}.`;
}

function roomRead(state: WriteRuleState, desks: readonly L3RoomDesk[]): Record<string, unknown> | null {
  if (desks.length === 0) return null;

  /* ---- the rule rounds: a bargaining spread ---- */
  if (state.stage === "rounds" && state.roundIndex < ROUND_COUNT) {
    const inRound = desks.filter((d) => d.proposal !== null);
    const shares = inRound.map((d) => d.proposal!.share);
    const spread = roomSpreadOf(shares);
    // Only desks that have actually put a number in appear on the grid. This
    // lesson holds no uncommitted proposal — a desk that has not proposed has
    // no number anywhere in state — so there is no ghosted half to draw here,
    // and inventing one out of a client dial would be a fabricated fact.
    const bins = roomBinsOn(
      SHARE_GRID,
      (v) => `${v}%`,
      inRound.map((d) => ({ handle: d.handle, value: d.proposal!.share, committed: true })),
    );
    const movement = roomMovement(
      desks.map((d) => ({
        value: d.proposal === null ? null : d.proposal.share,
        own: d.ownLastProposal === null ? null : d.ownLastProposal.share,
        hasPrior: d.roundsPlayed > 0,
      })),
    );
    const conditionOn = inRound.filter((d) => d.proposal!.condition).length;
    return {
      deskCount: desks.length,
      lockedCount: inRound.length,
      decidingCount: desks.length - inRound.length,
      spread,
      bins,
      movement,
      firstRound: movement.noPrior > 0 && movement.basis === 0 && movement.noOwnPrior === 0,
      firstNight: movement.noPrior > 0 && movement.basis === 0 && movement.noOwnPrior === 0,
      countLine: `${inRound.length} of ${desks.length} numbers in · round ${state.roundIndex + 1} of ${ROUND_COUNT}`,
      movementSubject: "the share they are asking the league to take",
      movementLine: movementSentence(
        movement,
        "round",
        "desks put numbers in",
        { up: "asked for more", same: "held their number", down: "asked for less" },
        "First round",
        "a round they sat out",
      ),
      spreadLine:
        spread === null
          ? "Nothing is in yet — no desk has proposed a number this round."
          : `${inRound.length === desks.length ? "The room" : `The ${inRound.length} in so far`} ${
              spread.min === spread.max
                ? `all proposed ${spread.min}%`
                : `proposed between ${spread.min}% and ${spread.max}%, middle ${spread.median}%`
            } — and ${
              conditionOn === 0
                ? "not one of them wants the CONDITION on"
                : conditionOn === inRound.length
                  ? "every one of them wants the CONDITION on"
                  : `${conditionOn} of them want the CONDITION on`
            }.`,
      privacyNote:
        "Yours only — the projector never shows this while the round is open. A room that can see the middle number stops proposing and starts copying, and the two-thirds test is only worth running on numbers the desks actually chose.",
    };
  }

  /* ---- the season: a compliance spread under the room's own rule ---- */
  if (state.stage === "season" && state.weekIndex < WEEK_COUNT) {
    const committed = desks.filter((d) => d.locked);
    const spread = roomSpreadOf(committed.map((d) => d.price));
    // Every desk is binned on the reinvest dial, undecided ones included: where
    // an uncommitted dial is sitting is exactly what a teacher is walking the
    // room to see. Price is the sentence, reinvest is the shape, because the
    // rule the room wrote taxes and conditions on the second one.
    const bins = roomBinsOn(
      REINVEST_GRID,
      (v) => `${v}%`,
      desks.map((d) => ({ handle: d.handle, value: d.reinvest, committed: d.locked })),
    );
    const movement = roomMovement(
      desks.map((d) => ({
        value: d.locked ? d.reinvest : null,
        own: d.ownLastReinvest,
        hasPrior: d.weeksPlayed > 0,
      })),
    );
    const rule = state.adopted;
    const under = committed.filter((d) => d.reinvest < CONDITION_MIN_REINVEST).length;
    const nothing = committed.filter((d) => d.reinvest === 0).length;
    const tail =
      rule && rule.condition
        ? under === 0
          ? `not one of them is under the ${CONDITION_MIN_REINVEST}% condition this room voted in`
          : under === committed.length
            ? `every one of them is under the ${CONDITION_MIN_REINVEST}% condition this room voted in`
            : `${under} of them are under the ${CONDITION_MIN_REINVEST}% condition this room voted in`
        : nothing === 0
          ? "not one of them is putting nothing back"
          : nothing === committed.length
            ? "every one of them is putting NOTHING back"
            : `${nothing} of them are putting NOTHING back`;
    return {
      deskCount: desks.length,
      lockedCount: committed.length,
      decidingCount: desks.length - committed.length,
      spread,
      bins,
      movement,
      firstRound: movement.noPrior > 0 && movement.basis === 0 && movement.noOwnPrior === 0,
      firstNight: movement.noPrior > 0 && movement.basis === 0 && movement.noOwnPrior === 0,
      countLine: `${committed.length} of ${desks.length} locked in · week ${state.weekIndex + 1} of ${WEEK_COUNT}`,
      movementSubject: "the reinvest dial",
      movementLine: movementSentence(
        movement,
        "week",
        "desks lock",
        { up: "put back more", same: "held", down: "put back less" },
        "First week",
        "a week the bell committed for them",
      ),
      spreadLine:
        spread === null
          ? "Nothing is committed yet — every dial is still sitting where the week opened."
          : `${committed.length === desks.length ? "The room" : `The ${committed.length} in so far`} ${
              spread.min === spread.max
                ? `all priced $${spread.min}`
                : `priced between $${spread.min} and $${spread.max}, middle $${spread.median}`
            } — and ${tail}.`,
      privacyNote:
        "Yours only — the projector never shows this while the week is open. Naming who is under the condition before the bell is the one thing that would stop the rule from biting, and the bite is the lesson.",
    };
  }

  return null;
}

export const writeTheRuleModule: LessonModule<WriteRuleState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 3 — Writing the Rule",
  phases: PHASES,

  initialState(input) {
    const band: GradeBand = input.gradeBand;
    const clubs: Club[] = [];
    for (let i = 0; i < MIN_LEAGUE; i += 1) clubs.push(makeClub(i));
    // Untrusted-input discipline, in order: a foreign `lessonModuleId` is
    // ignored entirely (extractCarriedClubs returns []); a genuine band
    // mismatch is refused with a teacher-readable reason and the carry is
    // never read; anything else degrades to the existing per-club validation.
    // Never a throw on any branch.
    const bandMismatch = weekFiveBandMismatch(input.seed, band);
    const carried = bandMismatch ? [] : extractCarriedClubs(input.seed);
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
          l2ReinvestDollars: row.meanReinvestDollars,
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
      seedNote: bandMismatch
        ? `This room did not use last lesson's numbers: ${bandMismatch}. The league opens on a stock spread.`
        : seeded
          ? "Every club's Draw and bank balance walked in from this room's own Lesson 2 session."
          : "No Lesson 2 session is linked, so the league opens on a stock spread. Nothing else about the lesson changes.",
      l2MeanReinvest,
      hookRevealed: false,
      band,
      stage: "rounds",
      roundIndex: 0,
      floorRoundIndex: 0,
      closedRounds: [],
      adopted: null,
      institutions: { share: null, floor: null },
      reviewStage: 0,
      weekIndex: 0,
      rookieSlot: null,
      revealStage: 0,
      counterfactualRun: false,
      kingsSplitShown: false,
      kingsRevealed: false,
      synthPage: 0,
      synthSeen: 0,
      finalePage: 0,
      observerSeats: [],
    };
  },

  /**
   * Manual-fallback discipline: nothing in this lesson depends on a click that
   * may never come. Leaving HOOK reveals Boston; leaving PLAY closes every round
   * still open, adopts whatever the room has, and settles every remaining week;
   * leaving REVEAL plays out every stage; leaving COUNTERFACTUAL runs the replay;
   * leaving ARGUE reveals the Kings vote.
   */
  /**
   * TIME CUT for Writing the Rule. The round is a SEASON WEEK.
   *
   * Only the season stage has a closable round — the rule-writing rounds
   * beforehand are a different beat with their own teacher controls, and the
   * runtime must not offer to "close" one of those. Same fallback as the other
   * two lessons, in this lesson's own words.
   */
  round: {
    closeHook: "teacher:closeWeek",
    noun: "week",
    fallbackPolicy:
      "A club that never locks plays this week at its own house price with nothing reinvested — the dial it is sitting on does not count as a decision.",
    currentKey(state, phase) {
      if (phase !== "PLAY" || state.stage !== "season") return null;
      return state.weekIndex < WEEK_COUNT ? `W${state.weekIndex + 1}` : null;
    },
    unresolved(state, phase, seatIds) {
      if (phase !== "PLAY" || state.stage !== "season" || state.weekIndex >= WEEK_COUNT) return [];
      const seated = new Set(seatIds);
      const out: UnresolvedSeat[] = [];
      for (const club of state.clubs) {
        if (club.seatId === null || !seated.has(club.seatId) || club.locked) continue;
        const house = profileOf(club).housePrice;
        out.push({
          seatId: club.seatId,
          label: deskHandleFor(club),
          fallback:
            club.price === house && club.reinvest === 0
              ? `plays at its $${house} house price (their dial is already there)`
              : `plays at its $${house} house price, NOT the $${club.price} on their dial`,
          selfFallback:
            club.price === house && club.reinvest === 0
              ? `Lock in, or this week plays at your $${house} house price — which is where your dial already is.`
              : `Lock in, or this week plays at your $${house} house price, NOT the $${club.price} you have dialled.`,
        });
      }
      return out;
    },
  },

  /**
   * WHILE YOU WERE AWAY, in this lesson's nouns. Class-level only, and in this
   * lesson that discipline bites hardest: the rule rounds are a live vote, and
   * a recap that named a club's share would hand one desk another's position
   * before the room has finished arguing. See `LessonModule.classEvents`.
   */
  classEvents(prev, next, { fromPhase, toPhase }) {
    const out: string[] = [];
    // Forward only. A restore rewinds the log with the state.
    if (!prev.hookRevealed && next.hookRevealed) {
      out.push("On the projector: what Boston actually did.");
    }
    for (let r = prev.closedRounds.length; r < next.closedRounds.length; r += 1) {
      out.push(`Round ${r + 1} of the rule vote closed \u2014 every desk's number went in at once.`);
    }
    if (!prev.adopted && next.adopted) {
      // The rule itself is the room's collective decision, not one desk's, and
      // the projector is already carrying it.
      out.push("The room's rule was adopted. It is on the projector.");
    }
    for (let w = prev.weekIndex; w < next.weekIndex; w += 1) {
      out.push(`Week ${w + 1} of the season closed. Every building settled at once, under the room's own rule.`);
    }
    if (!prev.kingsRevealed && next.kingsRevealed) out.push("On the projector: what Sacramento did.");
    for (let i = prev.revealStage; i < next.revealStage; i += 1) {
      const stage = revealStagesFor(next)[i];
      if (stage) out.push(`On the projector: ${stage.name}.`);
    }
    if (fromPhase !== toPhase) {
      const moved = PHASE_EVENT[toPhase];
      if (moved) out.push(moved);
    }
    return out;
  },

  onPhaseExit(state, fromPhase) {
    let next = state;
    if (fromPhase === "HOOK") next = { ...next, hookRevealed: true, leagueFrozen: true };
    if (fromPhase === "PLAY") {
      while (next.stage === "rounds" && next.roundIndex < ROUND_COUNT) next = closeRound(next);
      if (next.stage === "rounds") next = adoptRule(next);
      if (next.stage === "adopted") next = openFloorRounds(next);
      while (next.stage === "floorRounds" && next.floorRoundIndex < FLOOR_ROUND_COUNT) next = closeFloorRound(next);
      if (next.stage === "floorRounds") next = adoptFloor(next);
      if (next.stage === "floorAdopted") next = { ...next, stage: "season" };
      // ONE FALLBACK PER LESSON, ON EVERY PATH.
      //
      // This loop used to pass `first = true` on the open round, settling it on
      // the pairs' pending dials while the teacher's own bell settled the same
      // round at the house/plan price. Same room, same student action, two
      // different economies depending on which control the teacher happened to
      // press — reproduced directly against the module: a desk showing $56 on
      // its dial settled at $56 through this path and at $16 through the bell.
      //
      // The bell's policy is the one the product PROMISES, in three places at
      // once (the bell's own confirm line, the WATCH FOR flag, and the desk's
      // AUTO badge): a desk that never committed did not choose, and is not
      // credited with a choice. Honouring a dial nobody locked would also
      // dissolve LOCK IT IN, which is the signature commitment beat of all
      // three Module 2 lessons. So the exit path now settles exactly as the
      // bell does, and the trap that made the divergence tempting is closed
      // somewhere better: the FINAL CALL window tells a pair, in their own
      // numbers, what an uncommitted dial is about to cost them, and tells the
      // teacher the same thing per desk before they close.
      while (next.weekIndex < WEEK_COUNT) next = settleWeek(next, false);
      next = { ...next, stage: "seasonDone" };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    if (fromPhase === "COUNTERFACTUAL" && !next.counterfactualRun) next = { ...next, counterfactualRun: true };
    if (fromPhase === "ARGUE") next = { ...next, kingsSplitShown: true, kingsRevealed: true };
    return next;
  },

  reduce(state, action: LessonAction, ctx: ReduceContext): ReduceResult<WriteRuleState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a club" };
      // The season is closed. Handing out a club now would re-derive three weeks
      // of numbers the room has already been read out loud, so this pair gets an
      // honest observer landing instead of a refusal the device would retry
      // against forever.
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return seatLate(state, ctx.seatId);
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
      // THE VOTE IS SEALED. Round 3 has closed and the two-thirds test is next:
      // no number arriving now can change the rule this room adopts.
      if (state.roundIndex >= ROUND_COUNT) {
        return { ok: false, reason: "the vote is sealed — round 3 closed and the two-thirds test runs on the numbers that were in" };
      }
      const share = action["share"];
      const condition = action["condition"];
      if (!isValidShare(share)) return { ok: false, reason: `share must be ${SHARE_MIN}-${SHARE_MAX}% in ${SHARE_STEP}-point steps` };
      // Band-gated on top of the continuous grid: a 5-6 room's own ballot is
      // the four-card slate ($0/$2/$4/$6 of every $10), never a raw percent.
      if (!isValidShareForBand(state.band, share)) {
        return { ok: false, reason: `this room's ballot is ${shareOptionsFor(state.band).join("/")} — not a raw percent` };
      }
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

    if (action.type === "arrowPredict") {
      // The REVEAL-half lens (gate-l3-play repair 3): one tap, before stage 4,
      // on the pair's OWN club. It changes no economics — it is the difference
      // between a reveal happening to the room and with it.
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair predicts" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the prediction is taken during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= 4) return { ok: false, reason: "the arrows are already on the projector" };
      const choice = action["choice"];
      if (choice !== "moved" && choice !== "flat") return { ok: false, reason: "predict moved or flat" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      return { ok: true, state: withClub(state, { ...open.club, arrowPrediction: choice }) };
    }

    if (action.type === "kingsVote") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair votes" };
      if (ctx.phase !== "ARGUE") return { ok: false, reason: `the Board of Governors votes in ARGUE (session is in ${ctx.phase})` };
      if (state.kingsSplitShown) return { ok: false, reason: "the room's tally is already on the projector" };
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
        // Commit, then the room's own verdict alone, then the owners' answer.
        if (!state.kingsSplitShown) return { ok: true, state: { ...state, kingsSplitShown: true } };
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
      // Institution 1 sealed — the floor rounds open next, never straight to
      // the season: the second institution is a real second vote, not a rider.
      if (state.stage === "adopted") return { ok: true, state: openFloorRounds(state) };
      return { ok: false, reason: "the season is already running" };
    }

    if (action.type === "proposeFloor") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated student proposes the floor" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the floor is written in PLAY (session is in ${ctx.phase})` };
      if (state.stage === "rounds" || state.stage === "adopted") {
        return { ok: false, reason: "the floor vote opens once the share vote is sealed" };
      }
      if (state.stage === "floorAdopted" || state.stage === "season" || state.stage === "seasonDone") {
        return { ok: false, reason: "the floor vote is sealed — the two-thirds test already ran" };
      }
      if (state.stage !== "floorRounds") return { ok: false, reason: "the floor vote is not open right now" };
      if (state.floorRoundIndex >= FLOOR_ROUND_COUNT) {
        return { ok: false, reason: "the floor vote is sealed — round 2 closed and the two-thirds test runs on the numbers that were in" };
      }
      const raw = { on: action["on"], level: action["level"], recipient: action["recipient"] };
      if (!isValidFloorProposal(state.band, raw)) return { ok: false, reason: "the floor proposal is not a valid shape for this room's band" };
      const open = requireLiveClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      const floorProposal = normalizeFloorProposal(state.band, raw as { on: boolean; level?: number; recipient?: FloorRecipient });
      return { ok: true, state: withClub(state, { ...open.club, floorProposal }) };
    }

    if (action.type === "teacher:institutionStep") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher paces the floor vote" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the floor is voted in PLAY (session is in ${ctx.phase})` };
      if (state.stage === "floorRounds") {
        if (state.floorRoundIndex < FLOOR_ROUND_COUNT) return { ok: true, state: closeFloorRound(state) };
        return { ok: true, state: adoptFloor(state) };
      }
      if (state.stage === "floorAdopted") return { ok: true, state: { ...state, stage: "season" } };
      return { ok: false, reason: "there is no floor vote running right now" };
    }

    if (action.type === "teacher:reviewStage") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the institution review" };
      if (ctx.phase !== "ARGUE") return { ok: false, reason: `the institutions are reviewed in ARGUE (session is in ${ctx.phase})` };
      // Placeholder total (SHARE, then FLOOR) — widens when the review card's
      // own view ships; the paging mechanic itself is what this wave wires.
      const total = 2;
      const delta = action["direction"] === "back" ? -1 : 1;
      const reviewStage = (state.reviewStage + delta + total) % total;
      return { ok: true, state: { ...state, reviewStage } };
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
      if (state.stage === "rounds" || state.stage === "adopted" || state.stage === "floorRounds" || state.stage === "floorAdopted") {
        return { ok: false, reason: "the season has not opened yet — finish the rule first" };
      }
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
      const synthPage = (state.synthPage + delta + total) % total;
      return { ok: true, state: { ...state, synthPage, synthSeen: Math.max(state.synthSeen ?? 0, synthPage) } };
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
        return [
          "takeSeat",
          "propose",
          "proposeFloor",
          "setPrice",
          "setReinvest",
          "lock",
          "teacher:ruleStep",
          "teacher:institutionStep",
          "teacher:realRule",
          "teacher:closeWeek",
        ];
      // takeSeat stays offered after the season closes: a device arriving now is
      // landed as an observer by `reduce`, and a runtime-level refusal here would
      // strand it on "Finding your club..." with nothing to retry into.
      case "REVEAL":
        return ["takeSeat", "arrowPredict", "teacher:revealNext"];
      case "COUNTERFACTUAL":
        return ["takeSeat", "teacher:counterfactual"];
      case "ARGUE":
        return ["takeSeat", "kingsVote", "teacher:commitReveal", "teacher:reviewStage"];
      case "SYNTHESIS":
        return ["takeSeat", "teacher:synthPage", "teacher:synthPageBack"];
      default:
        return ["takeSeat"];
    }
  },

  studentView(state, seatId, phase) {
    const slot = state.seatToSlot[seatId];
    if (slot === undefined) {
      // gate-l3-teacher B4: a pair that arrived after the league closed used to
      // read "You're in — finding your club…" forever. They now get a real
      // screen that says what happened and what to do about it.
      if ((state.observerSeats ?? []).includes(seatId)) {
        const seasonClosed = phase !== "LOBBY" && phase !== "HOOK" && phase !== "PLAY";
        return tag({
          seated: false,
          observer: true,
          observerEyebrow: seasonClosed ? "You arrived after the last week closed" : "You arrived after the league closed",
          message: seasonClosed
            ? "You got here after the last week closed, so there is no club left to hand you — all three weeks are already in the books. Sit with the desk next to you and read their screen with them: everything from here is the whole room's."
            : "You arrived after this league closed, so every club already has a pair running it. Sit with the desk next to you — you are on their club now, and you get a say in what they do with it.",
          rule: ruleView(state),
          ruleNote: state.adopted
            ? `The rule in force is SHARE ${state.adopted.share}% · CONDITION ${state.adopted.condition ? `${CONDITION_MIN_REINVEST}% or you collect half a share` : "OFF"}. The room voted on it before you got here.`
            : "The room is still writing its rule. Your neighbour's screen has the dials on it.",
          houseRules: HOUSE_RULES,
        });
      }
      return tag({ seated: false, observer: false, message: "Finding your club…" });
    }
    const club = state.clubs[slot]!;
    const agg = computeAggregate(state);
    const card = clubCard(state, slot);
    // Wave 3b: THE FLOOR joins THE SHARE on every surface once institution 2
    // has actually run its own test — `floorRounds` (still being argued) is
    // deliberately excluded; that stage carries its own `floor` ballot object
    // instead (see below), never a verdict that has not been reached yet.
    const institutionsView =
      state.stage === "floorAdopted" || state.stage === "season" || state.stage === "seasonDone"
        ? { share: ruleView(state), floor: floorInstitutionView(state) }
        : null;
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
      ...(institutionsView ? { institutions: institutionsView } : {}),
    };
    switch (phase) {
      case "LOBBY":
        return tag({ ...base, message: LOBBY_COPY, houseRules: HOUSE_RULES, league: leagueTable(state, slot) });
      case "HOOK":
        return tag({
          ...base,
          message: HOOK_COPY,
          question: HOOK_QUESTION,
          pick: club.hookPick,
          revealed: state.hookRevealed,
          ...(state.hookRevealed ? { revealCopy: HOOK_REVEAL_COPY, split: agg.hookSplit } : {}),
          league: leagueTable(state, slot),
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
            band: ADOPT_BAND,
            // THE VOTE IS SEALED once round 3 has closed. The dial, the toggle
            // and the commit control are all dead, and the desk says why rather
            // than silently swallowing a press (gate-l3-play, biggest failure).
            sealed: state.roundIndex >= ROUND_COUNT,
            sealedNote:
              "The vote is sealed. Round 3 has closed and the two-thirds test runs on the numbers that were in — nothing you do now can change the rule this room adopts.",
            // Abstention honesty, in the desk's own words, whenever this desk
            // has no number in this round (teacher B6 — the director claims this
            // sentence is here, so it has to be here).
            abstainNote:
              club.proposal === null
                ? "You have not put a number in this round. A desk with no number in has ABSTAINED: it is not counted in the room's middle number, and it cannot be inside the ten-point band — so the two-thirds test counts it as a desk that did not back the rule."
                : null,
            league: leagueTable(state, slot),
          });
        }
        if (state.stage === "adopted") {
          return tag({
            ...base,
            mode: "adopted",
            adoption: adoptionLineClaimed(agg).text,
            seasonCopy: seasonCopyFor(state.adopted?.how),
            league: leagueTable(state, slot),
          });
        }
        if (state.stage === "floorRounds") {
          // Wave 3b: institution 2's own ballot screen, parallel to the
          // "rounds" branch above — one authored line at 5-6 (an ON/OFF
          // choice, never a percent), three at 7-8, plus the stakes card
          // `openFloorRounds` already printed for this club alone before this
          // screen ever renders.
          const levels = floorLevelsFor(state.band);
          const lines = levels.map((level) => ({ level, levelText: money(level), on: true }));
          const recipientChoices = FLOOR_RECIPIENTS.map((id) => ({
            id,
            label: id === "everyone" ? "Every club in the league" : "Only the clubs that cleared the floor",
          }));
          return tag({
            ...base,
            mode: "floorRounds",
            round: Math.min(state.floorRoundIndex + 1, FLOOR_ROUND_COUNT),
            roundCount: FLOOR_ROUND_COUNT,
            floor: {
              round: Math.min(state.floorRoundIndex + 1, FLOOR_ROUND_COUNT),
              roundCount: FLOOR_ROUND_COUNT,
              lines,
              recipientChoices,
              mine: club.floorProposal
                ? {
                    on: club.floorProposal.on,
                    level: club.floorProposal.level,
                    levelText: money(club.floorProposal.level),
                    recipient: club.floorProposal.recipient,
                  }
                : null,
              stakes: club.stakesCard
                ? {
                    atLevelText: money(club.stakesCard.atLevel),
                    ownReinvestText: money(club.stakesCard.ownReinvest),
                    wouldClear: club.stakesCard.wouldClear,
                    costIfBoundText: money(club.stakesCard.costIfBound),
                  }
                : null,
            },
            sealed: state.floorRoundIndex >= FLOOR_ROUND_COUNT,
            sealedNote:
              "The floor vote is sealed. Round 2 has closed and the two-thirds test runs on the numbers that were in — nothing you do now can change what this room adopts.",
            league: leagueTable(state, slot),
          });
        }
        if (state.stage === "floorAdopted") {
          return tag({
            ...base,
            mode: "floorAdopted",
            league: leagueTable(state, slot),
          });
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
      case "REVEAL": {
        // gate-l3-play repair 3: the student device was BYTE-IDENTICAL across
        // all five reveal stages, so for twenty-eight minutes a pair had no row
        // to find, nothing to mark and nothing to predict. Each stage now hands
        // this desk ITS OWN number for that stage, and stage 3 takes a one-tap
        // prediction about this club's own price arrow before stage 4 renders it.
        const mine = agg.arrows.find((a) => a.deskHandle === deskHandleFor(club)) ?? null;
        const flow = agg.potFlows.find((f) => f.deskNumber === club.deskNumber) ?? null;
        const era = agg.reinvestEra.find((r) => r.deskNumber === club.deskNumber) ?? null;
        const lens = [
          { stage: 1, label: "The rule you are living under", value: state.adopted ? `SHARE ${state.adopted.share}% · CONDITION ${state.adopted.condition ? "ON" : "OFF"}` : "—" },
          { stage: 2, label: "Your club's own net from the pot, three weeks", value: flow ? flow.netText : "—" },
          { stage: 3, label: "You paid in / you took out", value: flow ? `${flow.paidInText} in · ${flow.tookOutText} out` : "—" },
          {
            stage: 4,
            label: "Your best price, with the rule and without it",
            value: mine ? `$${mine.priceAtZero} ${mine.priceSteps === 0 ? "· no change" : `→ $${mine.priceAtAdopted}`}` : "—",
          },
          {
            stage: 5,
            label: "What you put back, a week",
            value: era ? `${money(Math.round(era.l3Dollars))}${era.l2Dollars !== null ? ` · last lesson ${money(Math.round(era.l2Dollars))}` : ""}` : "—",
          },
        ];
        return tag({
          ...base,
          message: "Look up at the board — and find your own club's number for this beat, on this screen.",
          revealStage: state.revealStage,
          revealSteps: REVEAL_STEPS,
          lens,
          myLens: lens.find((l) => l.stage === state.revealStage) ?? null,
          // The predict-the-arrow commit: open at stage 3, resolved at stage 4.
          predictOpen: state.revealStage === 3 && club.arrowPrediction === null,
          predictPrompt: "Before the arrows go up: did YOUR club's best ticket price move under this rule, or not move at all?",
          prediction: club.arrowPrediction,
          predictionResolved:
            state.revealStage >= 4 && club.arrowPrediction !== null && mine
              ? { actual: mine.priceSteps === 0 ? "flat" : "moved", right: (mine.priceSteps === 0 ? "flat" : "moved") === club.arrowPrediction }
              : null,
          arrowWhy: state.revealStage >= 4 ? arrowWhyLine(agg) : null,
          weeks: club.weeks.map((w) => viewWeek(state, club, w)),
          transfer: flow,
          // R1: the three-week attribution sentence was registered as a claim on
          // `play:desk-N:transferLine` and rendered on no surface at all — the
          // audited string was never seen and the seen string was never audited.
          // It is now printed where its own numbers are, from the same call the
          // sweep registers.
          transferSeasonLine: flow ? transferLineClaimed(flow).text : null,
          question: consequenceQuestionFor(state, agg),
        });
      }
      case "CONSEQUENCE": {
        const flow = agg.potFlows.find((f) => f.deskNumber === club.deskNumber) ?? null;
        return tag({
          ...base,
          message: "Look up at the board — and check your own transfer column while you do.",
          weeks: club.weeks.map((w) => viewWeek(state, club, w)),
          transfer: flow,
          transferSeasonLine: flow ? transferLineClaimed(flow).text : null,
          question: consequenceQuestionFor(state, agg),
        });
      }
      case "COUNTERFACTUAL":
        return tag({ ...base, message: COUNTERFACTUAL_HONESTY, weeks: club.weeks.map((w) => viewWeek(state, club, w)) });
      case "ARGUE":
        return tag({
          ...base,
          message: ARGUE_COPY,
          prompt: ARGUE_PROMPT,
          vote: club.kingsVote,
          // SR A2: /teach told the teacher the term sheets were on the students'
          // screens with the numbers on them. They were not on any surface.
          termSheets: TERM_SHEETS,
          termSheetNote: ARGUE_TERM_SHEET_NOTE,
          splitShown: state.kingsSplitShown,
          revealed: state.kingsRevealed,
          ...(state.kingsSplitShown ? { split: agg.kingsSplit } : {}),
          ...(state.kingsRevealed ? { revealCopy: ARGUE_REVEAL_COPY } : {}),
        });
      case "SYNTHESIS": {
        // The desk used to carry the whole deck the moment SYNTHESIS opened, so
        // at CARD 1 OF 7 on the projector every pair was already reading card
        // 7's title off their own screen. That is the exact defect D26 was
        // written to kill in Lesson 2's reveal, and this is the module finale —
        // the one stretch of the course where the room is supposed to be
        // looking up together.
        //
        // The desk now carries the cards the board has actually reached, newest
        // last, so a pair can still scroll back through what has been said and
        // cannot read ahead of the room.
        const all = synthesisCards(state, agg);
        const page = Math.min(Math.max(0, Math.max(state.synthPage, state.synthSeen ?? 0)), Math.max(0, all.length - 1));
        return tag({
          ...base,
          message: "Look up at the board. Every card you have seen is here too — scroll back through them any time.",
          exitPrompt: EXIT_PROMPT,
          cards: all.slice(0, page + 1),
          synthPage: page + 1,
          synthPageCount: all.length,
          simplifications: SIMPLIFICATIONS,
          sources: SOURCE_NOTES,
        });
      }
      case "COMPLETE":
        return tag({ ...base, message: completeCopyFor(state.adopted?.how), ruleTitle: completeTitleFor(state.adopted?.how), rule: ruleView(state) });
      default:
        return tag({ ...base, message: "" });
    }
  },

  teacherView(state, phase) {
    const agg = computeAggregate(state);
    const live = state.clubs.filter((c) => c.seatId !== null).length;
    const nextStage = state.revealStage < REVEAL_STEPS ? revealStagesFor(state)[state.revealStage] ?? null : null;
    const room = roomRead(
      state,
      state.clubs
        .slice(0, state.leagueSize)
        .filter((c) => c.seatId !== null)
        .map((c) => {
          // Movement is only ever claimed against a number this desk chose
          // itself. A week the bell settled for them is not a decision they
          // moved off, and a round they sat out is not a position they changed.
          const ownWeek = [...c.weeks].reverse().find((w) => !w.auto) ?? null;
          const ownRound = [...c.proposals].reverse().find((p) => p !== null) ?? null;
          return {
            handle: deskHandleFor(c),
            proposal: c.proposal,
            ownLastProposal: ownRound ?? null,
            roundsPlayed: c.proposals.length,
            price: c.price,
            reinvest: c.reinvest,
            locked: c.locked,
            weeksPlayed: c.weeks.length,
            ownLastReinvest: ownWeek ? ownWeek.reinvest : null,
          };
        }),
    );
    return tag({
      phase,
      room,
      // THE DESKS: the same room, named. Teacher-only — see deskStripOf().
      deskStrip: deskStripOf(state),
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
          ? `Nobody has put a number in yet — 0 of ${live} desks. Closing the round now records every desk as an ABSTENTION: no number goes into the room's middle number, and no desk can be inside the band. Close it anyway?`
          : state.stage === "rounds" && state.roundIndex >= ROUND_COUNT
            ? "This runs the two-thirds test and prints the rule this room will play under. It cannot be re-run. Print it?"
            : null,
      realRuleAvailable: state.stage === "rounds" || state.stage === "adopted",
      realRuleWarn: `This replaces the room's own vote with the league office's rule (SHARE ${REAL_RULE_SHARE}% · CONDITION ${REAL_RULE_CONDITION ? "ON" : "OFF"}) and cannot be undone. Use it if the room cannot agree or the period has run short. Operate the league office's rule?`,
      commitRevealAvailable: (phase === "HOOK" && !state.hookRevealed) || (phase === "ARGUE" && !state.kingsRevealed),
      commitRevealLabel:
        phase === "ARGUE" ? (state.kingsSplitShown ? "Read the owners' 22-8 vote" : "Show THIS ROOM's tally (the owners come next)") : "Show what Boston did",
      commitRevealWarn:
        phase === "ARGUE"
          ? state.kingsSplitShown
            ? "This reads out the owners' 22-8. The room has already seen its own tally. Reveal?"
            : `This closes the vote and puts THIS ROOM's own tally on the projector, alone — the owners' 22-8 is a second press after it. ${agg.kingsSplit.undecided} desk(s) have not voted yet and will not be able to after this. Show the room's tally?`
          : `This shows what Boston did. ${agg.hookSplit.undecided} desk(s) have not locked a position and will not be able to after this. Reveal?`,
      kingsSplitShown: state.kingsSplitShown,
      observerCount: (state.observerSeats ?? []).length,
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
      synthPageNote: "One card at a time on the projector. Each desk gets the cards you have already turned to, so a pair can look back without reading ahead of the room.",
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
            band: ADOPT_BAND,
            // The two-thirds tension, made visible while it is still live
            // (gate-l3-play repair 2). Counts only — no desk, no money, no name.
            gauge:
              state.closedRounds.length > 0
                ? {
                    inBand: agg.rounds[agg.rounds.length - 1]!.inBand,
                    needed: agg.rounds[agg.rounds.length - 1]!.needed,
                    roomSize: agg.rounds[agg.rounds.length - 1]!.roomSize,
                    abstained: agg.rounds[agg.rounds.length - 1]!.abstained,
                  }
                : null,
            sealed: state.roundIndex >= ROUND_COUNT,
          });
        }
        if (state.stage === "adopted") {
          return tag({
            ...common,
            mode: "adopted",
            title: state.adopted?.how === "leagueOffice" ? "THE LEAGUE OFFICE'S RULE" : state.adopted?.how === "statusQuo" ? "THE RULE THAT HELD" : "THE RULE",
            adoptionLine: adoptionLineClaimed(agg).text,
            statusQuoCopy: state.adopted?.how === "statusQuo" ? STATUS_QUO_COPY : state.adopted?.how === "leagueOffice" ? LEAGUE_OFFICE_COPY : null,
          });
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
          arrows: state.revealStage >= 4 ? (agg.arrowsMovedAny ? agg.arrows : agg.arrowsWouldMove) : [],
          // On the no-movement branch the frame shows what WOULD have moved, and
          // says so in the column header (econ B1 / gate-l3-play repair 5).
          arrowsAreCounterfactual: state.revealStage >= 4 && !agg.arrowsMovedAny,
          arrowsCounterfactualShare: agg.arrowsWouldMoveShare,
          arrowLine: state.revealStage >= 4 ? arrowLineClaimed(agg).text : null,
          arrowWhy: state.revealStage >= 4 ? arrowWhyLine(agg) : null,
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
          l2MeanDollars: agg.l2MeanDollars,
          l3MeanDollars: agg.l3MeanDollars,
          horizonNote:
            "Three weeks shows the transfer. What the effort that stopped actually costs lands in DRAW, next season — and nothing in this lesson prices a point of Draw in dollars.",
          question: consequenceQuestionFor(state, agg),
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
          termSheets: TERM_SHEETS,
          termSheetNote: ARGUE_TERM_SHEET_NOTE,
          splitShown: state.kingsSplitShown,
          revealed: state.kingsRevealed,
          // Two presses: the room's own verdict stands alone on the projector
          // before the owners answer (gate-l3-projector 5).
          ...(state.kingsSplitShown && !state.kingsRevealed
            ? {
                roomSplitLine: `This room voted ${agg.kingsSplit.deny} to deny and ${agg.kingsSplit.approve} to approve${agg.kingsSplit.undecided > 0 ? `, with ${agg.kingsSplit.undecided} undecided` : ""}. Nobody has seen what the owners did.`,
                split: agg.kingsSplit,
              }
            : {}),
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
        return tag({
          ...common,
          mode: "complete",
          title: completeTitleFor(state.adopted?.how),
          copy: completeCopyFor(state.adopted?.how),
          adoptionLine: adoptionLineClaimed(agg).text,
        });
      default:
        return tag({ ...common, mode: "idle", title: "" });
    }
  },

  aggregate(state) {
    return computeAggregate(state);
  },
};
