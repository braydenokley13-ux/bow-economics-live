/**
 * Module 2 · Lesson 2 — "YOU DON'T PLAY ALONE."
 *
 * Built against docs/gauntlet/module-2/DESIGN_C_FIRSTPRINCIPLES.md (L2), the
 * binding build charter in ARCHITECTURE_SELECTION.md (BC-3, BC-5, BC-7), the
 * economic contract's C3/C4/C5/C9/C10 instantiation tests, and the Stage-0
 * hosting loop that rated FUNCTIONAL (stage0/l2-hosting.html + PLAY_REVIEW.md).
 *
 * THE LESSON. Every desk runs a real NBA club's building inside one league.
 * Each week you HOST one club and VISIT another. Your home gate is a direct
 * function of the visiting club's DRAW — and that club is another desk in the
 * room, whose Draw is that desk's own doing. Nobody wins by making a classmate
 * worse off: the transmission is through the product, not through competition
 * for a prize (C5, and the reason this cannot collapse into M1 L3).
 *
 * TWO BOOKS THAT DO NOT ADD UP (R4): CASH (dollars) and DRAW (0-100, the number
 * of people your club's name puts in somebody else's building). The reinvest
 * dial trades one for the other and there is no exchange rate: a Draw point is
 * not a dollar, and the money a Draw point earns mostly lands on OTHER desks'
 * books.
 *
 * WHAT IS HIDDEN AND WHY. `base0`, `sens`, `ownDrawFans`, `visitorFans`,
 * `effortScale` and `drawDollars` are module-scope constants and are never
 * serialized into any view — not before the lock, not after it, not on the
 * board, not to the teacher. Views carry only derived outcomes of an action
 * already committed, plus printed operating facts a real desk would know
 * (capacity, the weekly bill, the league's Draw numbers, the schedule). There
 * is no preview of any kind (R2); see `hostTheLeague.test.ts`.
 *
 * THE DECOMPOSITION IS COMPUTED, NOT ASSERTED (BC-5). `settleHome` returns the
 * night's crowd split into three channels by running the SAME clamped
 * settlement three times — at the league Draw floor for both clubs, then with
 * the host's own Draw, then with the visitor's. The three differences sum to
 * the turnout exactly, are non-negative by monotonicity, and survive the
 * capacity clamp (a sold-out night attributes to the visitor exactly the extra
 * people the visitor got through the door). Residual is 0 by construction, in
 * fans and in dollars. This is the repair for the Stage-0 attribution defect
 * PLAY_REVIEW named: that build printed "what your decision did (your own draw
 * x your open sections)" over a figure that did not move when Draw went 30 to
 * 100.
 *
 * BC-3 / SELECTION_SR_REVIEW C-2 (the pipe magnitudes, RE-DERIVED). C-2 found
 * Design C's indicative L2 pipe table inconsistent with its own gate-share
 * ledger, with SR-1 ("the Knicks have the league's highest gate"), and with its
 * own horizon compression — because a per-night-sized gate was printed beside a
 * per-season-sized national check. Everything in this module is on ONE scale.
 * The derivation, in full:
 *
 *   - One "week" here is one home date and one road date.
 *   - Real national media: ~$76B over 11 years (2025-26 through 2035-36) across
 *     30 clubs is on the order of $200M+ per club per year before the players'
 *     share; over 41 home dates that is ~$4.9M per club per date (SR-2).
 *   - This lesson's dollars are shrunk to classroom size by the same factor L1
 *     uses (modeled ticket prices $10-$120 against real NBA averages), about
 *     5x. $4.9M / 5 ~ $950,000 — `NATIONAL`, identical for every club.
 *   - Gate is a fifth to a quarter of NBA club revenue NEAR A CLUB'S HOUSE
 *     PRICE (C's own R11 ledger). Recomputed from the shipped constants at
 *     neutral Draw 40/40, each profile at its own housePrice: New York @ $56
 *     takes $665,280 at the gate + $213,840 in-arena + $830,000 local +
 *     $950,000 national = $2,659,120 total, gate 25.0%, national 35.7%.
 *     Memphis @ $44: $352,880 + $96,240 + $470,000 + $950,000 = $1,869,120,
 *     gate 18.9%, national 50.8%. These are the README's figures and they
 *     reproduce; an earlier version of this header printed 23.7% / 22.7% /
 *     $2.79M, which did not (`gate-l2-sr` MODERATE-4 — the README wins).
 *     Away from the house price the share moves a long way (8.1% at $120,
 *     8.4% at $10), which is why MODELED_DOLLARS_LINE no longer states the
 *     band as a universal.
 *   - National is the single tallest pipe on a TYPICAL club's bar without
 *     being 52% of the biggest market's total, which was C-2's specific
 *     complaint. It is not tallest everywhere: `localMediaFor` overtakes
 *     `NATIONAL` at Draw 50 on the new-york profile and Draw 54 on
 *     golden-state, so Boston (startDraw 55) and the Lakers (68) out-earn the
 *     national check on local money from week 1. That is the reinvest dial
 *     working, not a defect — but no copy may call national "the biggest pipe
 *     for every club".
 *   - This header previously claimed "New York has the league's highest gate
 *     at every comparable matchup (SR-1)". RETRACTED (`gate-l2-sr`
 *     MODERATE-3): `wantedAt()` is capacity-independent and `turnout =
 *     min(capacity, wanted)`, so on any sold-out week at equal price Chicago
 *     (20,917), Philadelphia (20,478) and Detroit (20,332) — all on the
 *     new-york profile — strictly out-gate Madison Square Garden's 19,812.
 *     The profile carries the demand curve; the club carries its own real
 *     building. No surface asserts a real-world gate ranking.
 *
 * NO RNG ANYWHERE. Every number in this lesson is a pure function of the
 * schedule, the printed Draws and the room's own committed dials. The one
 * exogenous event (the week-2 star departure) is announced on the card before
 * anybody commits, lands on a deterministic club, and is named again at
 * debrief (R7).
 */
import { CREST_COUNT } from "./draftDay.js";
import type { LessonAction, LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";
import { bandOrDefault, type GradeBand } from "../shared/gradeBand.js";

/* ------------------------------------------------------------- markets -- */

export type MarketId = "new-york" | "golden-state" | "oklahoma-city" | "memphis";

/**
 * A market profile's printed operating facts plus its hidden demand constants.
 * Everything under HIDDEN never leaves this module.
 *
 * Four profiles, four real clubs (SR-1): big/rich, big/owns-its-building,
 * small/champion, small/lean. Every other club in the league is assigned to one
 * of these four profiles — the profile carries the ECONOMICS, the club carries
 * its own real building and real listed capacity. No club-specific demand
 * constant is invented anywhere: two clubs on the same profile have identical
 * curves, and the board says so.
 */
export type MarketProfile = {
  readonly id: MarketId;
  /** The real club this profile is modeled on, named as a typographic wordmark (no logos/marks). */
  readonly anchorClub: string;
  /**
   * One sentence a student who has never watched a game can act on.
   *
   * `gate-l2-sr` BLOCKING-1: this string renders under EVERY club on the
   * profile, so it may only say things that are true of every one of them. It
   * describes the MODEL's market band and this profile's own printed operating
   * facts — never a claim about a named real club. Club-specific facts live in
   * `ClubDef.identityLine`, which is present only where it is true.
   */
  readonly plainLine: string;
  /** A neutral size band. Never a club's distinguishing fact (see BLOCKING-1). */
  readonly sizeLabel: string;
  /* ---- printed operating facts (these DO appear in views) ---- */
  /** Everything it costs to run the club for a week, packed into one line. */
  readonly bill: number;
  /** Structural local media + local sponsorship, before any Draw money. */
  readonly localBase: number;
  /** In-arena spend per fan. Printed: a real building knows its own per-head. */
  readonly ancillary: number;
  /* ---- HIDDEN demand constants (never serialized) ---- */
  readonly base0: number;
  readonly sens: number;
  /** Fans of home demand per point of the HOST's own Draw above the league floor. */
  readonly ownDrawFans: number;
  /** Fans of home demand per point of the VISITING club's Draw above the league floor. Deliberately NOT named `visitorFans`: that is a settled OUTCOME field on every view, and a hidden constant may never share a key name with a published one. */
  readonly visitorDrawFans: number;
  /** Dollars of reinvest that count as one unit of "effort" toward Draw. */
  readonly effortScale: number;
  /** Local media + sponsorship dollars per Draw point per week. */
  readonly drawDollars: number;
  /** What a bot club charges. Deterministic, printed, and deliberately not optimal. */
  readonly housePrice: number;
};

/**
 * Modeled on real market differences — NOT any club's actual measured demand.
 * Market sizes, buildings and capacities are real; the curves are ours (R11,
 * and the board says so every time a number appears).
 *
 * Constant choice is not free-hand. At every profile:
 *   - the total-revenue optimum sits clear of the capacity clamp at a neutral
 *     matchup, so regret is the symmetric parabola (R6, verified by the
 *     tuning harness at every reachable Draw pair);
 *   - every building can reach a full house at some legal price against a
 *     strong visitor (R8);
 *   - the weekly bill is clearable from EVERY reachable state at EVERY legal
 *     price, because the national check is unconditional (R5) — which is also
 *     the lesson;
 *   - the cash-optimal reinvest share is interior and differs by profile
 *     (small markets buy more Draw per dollar of door money), so no fixed
 *     reinvest rule is optimal for a majority of seats (R1).
 */
export const MARKET_PROFILES: readonly MarketProfile[] = [
  {
    id: "new-york",
    anchorClub: "New York Knicks",
    plainLine: "A big-market club: a large metro area, a big building, and local media money to match. Fans here will pay more per seat than a small market can ask.",
    sizeLabel: "BIG MARKET",
    bill: 1_600_000,
    localBase: 470_000,
    ancillary: 18,
    base0: 21_120,
    sens: 165,
    ownDrawFans: 104,
    visitorDrawFans: 139,
    effortScale: 132_000,
    drawDollars: 12_000,
    housePrice: 56,
  },
  {
    id: "golden-state",
    anchorClub: "Golden State Warriors",
    plainLine: "A big-market club with a strong building business — the people who come through the door here spend more once they are inside than anywhere else in this league.",
    sizeLabel: "BIG MARKET",
    bill: 1_550_000,
    localBase: 420_000,
    ancillary: 22,
    base0: 19_800,
    sens: 158,
    ownDrawFans: 99,
    visitorDrawFans: 132,
    effortScale: 129_000,
    drawDollars: 12_000,
    housePrice: 56,
  },
  {
    id: "oklahoma-city",
    anchorClub: "Oklahoma City Thunder",
    plainLine: "A small-market club: fewer people in the metro area, so a lower bill — and a dollar put back into the club goes further here than it does in a big market.",
    sizeLabel: "SMALL MARKET",
    bill: 1_050_000,
    localBase: 150_000,
    ancillary: 12,
    base0: 15_600,
    sens: 150,
    ownDrawFans: 89,
    visitorDrawFans: 118,
    effortScale: 76_000,
    drawDollars: 12_000,
    housePrice: 46,
  },
  {
    id: "memphis",
    anchorClub: "Memphis Grizzlies",
    plainLine: "A small, lean market. Fewer people, price matters more here — and a dollar put back into the club buys more Draw than it would in a big market.",
    sizeLabel: "SMALL MARKET",
    bill: 950_000,
    localBase: 110_000,
    ancillary: 12,
    base0: 14_400,
    sens: 145,
    ownDrawFans: 84,
    visitorDrawFans: 112,
    effortScale: 67_000,
    drawDollars: 12_000,
    housePrice: 44,
  },
];
const PROFILE_BY_ID: ReadonlyMap<MarketId, MarketProfile> = new Map(MARKET_PROFILES.map((m) => [m.id, m]));

/**
 * The league's clubs, in league-slot order. Desks claim slots in join order, so
 * slot 0 is Desk 1.
 *
 * Every name, building and capacity here is real and dated. The ECONOMICS comes
 * from the four profiles above and nothing else — there is no club-specific
 * invented constant anywhere in this file, which is the discipline
 * SELECTION_SR_REVIEW's B-2 finding asks for.
 *
 * `startDraw` is a modeled starting position, deliberately UNCORRELATED with
 * market size: the biggest market in the league does not start with the biggest
 * Draw, and two of the four highest starting Draws are small markets. That is
 * the C4/FL6 antidote built into the deal rather than argued at debrief, and it
 * has a real anchor — Oklahoma City is one of the league's smallest markets and
 * won the 2025 title.
 */
export type ClubDef = {
  readonly name: string;
  readonly short: string;
  readonly building: string;
  readonly capacity: number;
  /** BC-3: the season stamp travels with the seat count wherever it is printed. */
  readonly capacityNote: string;
  readonly profileId: MarketId;
  readonly startDraw: number;
  /**
   * A dated, checkable fact about THIS club — present only where it is true of
   * this club.
   *
   * `gate-l2-sr` BLOCKING-1: the four anchor clubs' identity sentences used to
   * ride on the shared `MarketProfile.plainLine`, so "the biggest market in
   * American sports, and the league's biggest gate" rendered under Detroit and
   * "one of the league's smallest markets — and the 2025 champions" rendered
   * under Denver. A student who knows no basketball has no defence against
   * that. The profile now says only what is true of the model's market band;
   * anything about a named club lives here, and sixteen clubs correctly carry
   * nothing.
   */
  readonly identityLine?: string;
};

export const CLUBS: readonly ClubDef[] = [
  { name: "New York Knicks", short: "New York", building: "Madison Square Garden", capacity: 19_812, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 44, identityLine: "The biggest market in American sports, and the league's biggest gate — about $193M in gate receipts in 2024-25, a franchise record and the largest in the NBA." },
  { name: "Memphis Grizzlies", short: "Memphis", building: "FedExForum", capacity: 17_794, capacityNote: "modeled seat count · published figures range 16,667-18,119", profileId: "memphis", startDraw: 62, identityLine: "One of the league's smallest markets. In the leaked 2016-17 league year its local media deal was worth under $10M a year, against about $149M for the Lakers." },
  { name: "Golden State Warriors", short: "Golden State", building: "Chase Center", capacity: 18_064, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 30, identityLine: "Paid for Chase Center itself — about $1.4B, privately financed, opened 2019 — and owns it, so it keeps the concert money and the real estate too. $833M of revenue in 2024-25, the highest in the NBA." },
  { name: "Oklahoma City Thunder", short: "Oklahoma City", building: "Paycom Center", capacity: 18_203, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 71, identityLine: "One of the league's smallest markets — and the 2025 champions, 4-3 over Indiana." },
  { name: "Milwaukee Bucks", short: "Milwaukee", building: "Fiserv Forum", capacity: 17_341, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 38 },
  { name: "Boston Celtics", short: "Boston", building: "TD Garden", capacity: 19_156, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 55 },
  { name: "Indiana Pacers", short: "Indiana", building: "Gainbridge Fieldhouse", capacity: 17_274, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 26 },
  { name: "Los Angeles Lakers", short: "L.A. Lakers", building: "Crypto.com Arena", capacity: 18_997, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 68, identityLine: "One of the biggest markets in the league — and it does NOT own its building: AEG owns and operates Crypto.com Arena, and the Lakers are tenants on a lease running to 2041." },
  { name: "Denver Nuggets", short: "Denver", building: "Ball Arena", capacity: 19_520, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 34 },
  { name: "Philadelphia 76ers", short: "Philadelphia", building: "Xfinity Mobile Arena", capacity: 20_478, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 49 },
  { name: "New Orleans Pelicans", short: "New Orleans", building: "Smoothie King Center", capacity: 16_867, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 72 },
  { name: "Chicago Bulls", short: "Chicago", building: "United Center", capacity: 20_917, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 28 },
  { name: "Sacramento Kings", short: "Sacramento", building: "Golden 1 Center", capacity: 17_608, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 58 },
  { name: "Toronto Raptors", short: "Toronto", building: "Scotiabank Arena", capacity: 19_800, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 40 },
  { name: "Utah Jazz", short: "Utah", building: "Delta Center", capacity: 18_206, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 65 },
  { name: "Miami Heat", short: "Miami", building: "Kaseya Center", capacity: 19_600, capacityNote: "listed basketball capacity · 2025-26", profileId: "golden-state", startDraw: 33 },
  { name: "Cleveland Cavaliers", short: "Cleveland", building: "Rocket Arena", capacity: 19_432, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 51 },
  { name: "Portland Trail Blazers", short: "Portland", building: "Moda Center", capacity: 19_393, capacityNote: "listed basketball capacity · 2025-26", profileId: "oklahoma-city", startDraw: 36 },
  { name: "Orlando Magic", short: "Orlando", building: "Kia Center", capacity: 18_846, capacityNote: "listed basketball capacity · 2025-26", profileId: "memphis", startDraw: 60 },
  { name: "Detroit Pistons", short: "Detroit", building: "Little Caesars Arena", capacity: 20_332, capacityNote: "listed basketball capacity · 2025-26", profileId: "new-york", startDraw: 31 },
];

/** The most desks this league can seat. Always leaves at least two bot clubs. */
export const MAX_DESKS = CLUBS.length - 2;
export const MIN_LEAGUE = 6;

/* --------------------------------------------------------------- dials -- */

export const PRICE_MIN = 10;
export const PRICE_MAX = 120;
export const PRICE_STEP = 2;
/** Reinvest is a whole-percent share of the week's door money, in 5-point steps. */
export const SHARE_MIN = 0;
export const SHARE_MAX = 40;
export const SHARE_STEP = 5;

export const WEEK_COUNT = 3;

export const DRAW_START = 40;
export const DRAW_MIN = 10;
export const DRAW_MAX = 100;
/** Draw slips this many points a week for a club that puts nothing back. */
export const DRAW_DECAY = 4;
/** The most Draw one week of reinvest can buy, before the ceiling term. Same for every market. */
export const DRAW_GAIN_MAX = 34;

/** The national media check. Identical for every club in the league, every week. */
export const NATIONAL = 950_000;

/** Where the star-departure club's Draw lands, for the rest of the lesson. */
export const SHOCK_DRAW = 12;

/* ------------------------------------------------------------ the pool -- */

/**
 * W5 "YOU DON'T PLAY ALONE" — THE POOL.
 *
 * D59 ruling 4: set BELOW the plausible Week 6 outcome (0-60%) so the room's
 * own rule reads as an escalation, not a repeat. Internal state holds the
 * fraction; no surface may print it as a fraction or a percentage at 5-6
 * (`allowsPercentages: false`) — every 5-6 rendered string says
 * `LEVY_LINE_5_6` instead. This is a printed constant, not a dial: nobody in
 * the room can move it, and nothing here is a ballot (non-negotiable 1).
 */
export const LEVY_FRACTION = 0.2;
/**
 * The exact base named, not "local revenue" generically: `gate + localMedia`,
 * the SAME base Week 6 taxes (`writeTheRule.ts` `taxedLocal`) — never
 * in-arena spend, never the national check. Naming the base precisely is
 * what keeps Week 6's own rule from reading as a denominator trick.
 */
export const LEVY_LINE_5_6 = "$2 out of every $10 of gate and local TV money";
export const LEVY_LINE_7_8 = "a 20% levy on gate and local media revenue (never in-arena spend, never the national check)";
export const levyLineFor = (band: GradeBand): string => (band === "5-6" ? LEVY_LINE_5_6 : LEVY_LINE_7_8);

export type PoolChip = "nothing" | "a little" | "a lot";
export const POOL_CHIPS: readonly PoolChip[] = ["nothing", "a little", "a lot"];

/**
 * One club's pool line for one settled week. `assessedLocalRevenue` is
 * `gate + localMedia` for that club that week — deliberately NOT `doorMoney`
 * (which also carries in-arena spend) and never the equal national check,
 * which is already shared and would double the lesson. This is the SAME base
 * Week 6 taxes (`writeTheRule.ts` `taxedLocal`), on purpose. Computed in
 * `settleWeek`, alongside the settlement it is assessed against, so it can
 * never drift from the numbers the desk actually saw.
 *
 * Restricted to LIVE desks only (`club.seatId !== null`): the ritual is about
 * the room's own franchises, and a league-office bot has no student behind it
 * to feel either half of the reveal. Recorded in `SIMPLIFICATIONS`.
 */
export type PoolWeek = {
  week: number;
  slot: number;
  assessedLocalRevenue: number;
  paidIn: number;
  tookOut: number;
  /** tookOut - paidIn. May be negative in state; a 5-6 view never prints the sign (see `netDirectionLine`). */
  net: number;
};

/** A flat cash penalty for a franchise that did not clear its Week 4 bill — named, never silent (non-negotiable, seed-in rule). */
export const MISSED_BILL_PENALTY = 200_000;
/** No carried franchise opens unable to operate, however bad its Week 4 books were. */
export const MIN_CARRIED_CASH = -300_000;

/** One club's Week-4 carry, as this room kept it after validation and normalisation. */
export type CarriedClub = {
  slot: number;
  /** The opening cash this club starts Week 5 with, after any penalty and the playability floor. */
  cashOpening: number;
  /** The named penalty applied, or 0. */
  penalty: number;
  /** Whether Week 4 says this franchise cleared its own bill. `null` when the seed said nothing about it. */
  billCleared: boolean | null;
  /** True if `cashOpening` was floored at `MIN_CARRIED_CASH` for playability. */
  clamped: boolean;
};

export const POOL_RITUAL_STAGE_NAMES = [
  "THE BILL LINE",
  "FILL",
  "THE BOWL STANDS",
  "DRAW",
  "NET",
  "THE FREE RIDE",
] as const;
export const POOL_RITUAL_STEPS = POOL_RITUAL_STAGE_NAMES.length;

export const isValidPrice = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= PRICE_MIN && v <= PRICE_MAX && (v - PRICE_MIN) % PRICE_STEP === 0;

export const isValidShare = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= SHARE_MIN && v <= SHARE_MAX && v % SHARE_STEP === 0;

export const PRICE_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) out.push(p);
  return out;
})();

export const SHARE_GRID: readonly number[] = (() => {
  const out: number[] = [];
  for (let s = SHARE_MIN; s <= SHARE_MAX; s += SHARE_STEP) out.push(s);
  return out;
})();

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/* -------------------------------------------------- the hidden economics -- */

/**
 * One home week, settled — and decomposed, exactly.
 *
 * The three fan channels are computed by running the clamped settlement three
 * times, so they sum to `turnout` with no residual and stay non-negative under
 * both clamps (`turnout` is monotone non-decreasing in each Draw).
 */
export type HomeSettlement = {
  price: number;
  capacity: number;
  wanted: number;
  turnout: number;
  fillPct: number;
  turnedAway: number;
  soldOut: boolean;
  /** People this building and this price would draw with nobody's name on the marquee. */
  bareFans: number;
  /** Extra people the HOST club's own Draw brought. */
  ownFans: number;
  /** Extra people the VISITING club brought. */
  visitorFans: number;
  gate: number;
  inArena: number;
  /** gate + inArena — the money that came through the door. */
  doorMoney: number;
  bareDollars: number;
  ownDollars: number;
  visitorDollars: number;
};

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
  const perFan = price + profile.ancillary;

  const bareFans = bare;
  const ownFans = withOwn - bare;
  const visitorFans = turnout - withOwn;

  return {
    price,
    capacity,
    wanted,
    turnout,
    fillPct: Math.round((turnout / capacity) * 1000) / 10,
    turnedAway: Math.max(0, wanted - turnout),
    soldOut: turnout >= capacity,
    bareFans,
    ownFans,
    visitorFans,
    gate: price * turnout,
    inArena: profile.ancillary * turnout,
    doorMoney: perFan * turnout,
    bareDollars: perFan * bareFans,
    ownDollars: perFan * ownFans,
    visitorDollars: perFan * visitorFans,
  };
}

/** Local media + sponsorship for a week, keyed to the Draw the club STARTED the week with (the slow pipe, one week late). */
export const localMediaFor = (profile: MarketProfile, drawAtWeekStart: number): number =>
  Math.max(0, Math.round(profile.localBase + profile.drawDollars * (drawAtWeekStart - DRAW_MIN)));

/**
 * What one week of reinvest does to Draw.
 *
 * Two brakes, both required by the contract's Family-5 warning and by the
 * design's "a big market cannot buy dominance":
 *   - diminishing returns in money (the saturating `effort/(effort+1)` term);
 *   - a ceiling term `(DRAW_MAX - draw)/DRAW_MAX` that is IDENTICAL for every
 *     market, so no amount of big-market money reaches a Draw a small market
 *     cannot reach. FL7 is removed structurally, not rhetorically.
 * Money is normalised by the club's own `effortScale`, so a dollar goes further
 * in a small market — which is true, and which is the small market's winning
 * path (C4) rather than a handicap bolted on for fairness.
 */
export function drawGain(profile: MarketProfile, draw: number, spendDollars: number): number {
  if (spendDollars <= 0) return 0;
  const effort = spendDollars / profile.effortScale;
  return DRAW_GAIN_MAX * (effort / (effort + 1)) * ((DRAW_MAX - draw) / DRAW_MAX);
}

/** Next week's Draw. Decay applies whether or not anything was spent, and the floor is hard (R5). */
export const nextDraw = (profile: MarketProfile, draw: number, spendDollars: number): number =>
  clamp(Math.round(draw - DRAW_DECAY + drawGain(profile, draw, spendDollars)), DRAW_MIN, DRAW_MAX);

/* ------------------------------------------------------------ schedule -- */

/**
 * The round-robin, and why it is a rotation rather than a draw.
 *
 * Week `w` pairs league slot `i` as HOST of slot `(i + OFFSETS[w]) % size`. That
 * makes every club host exactly one visitor and visit exactly one host every
 * week — "who visits me" and "whose building I am in" are both always answered,
 * for every club, with no byes and no RNG. Distinct offsets mean no pairing
 * repeats across the three weeks.
 *
 * Desks claim slots in join order, so live desks occupy a contiguous block at
 * the front. Small offsets therefore put live desks in front of live desks as
 * often as the league's size allows, which is the whole point: an interdependence
 * lesson in which most desks host a bot is a lesson about nothing.
 */
export const OFFSETS: readonly number[] = [1, 2, 3];

export type Pairing = { host: number; visitor: number };

export function scheduleFor(week: number, leagueSize: number): Pairing[] {
  const off = OFFSETS[week] ?? 1;
  const out: Pairing[] = [];
  for (let i = 0; i < leagueSize; i += 1) out.push({ host: i, visitor: (i + off) % leagueSize });
  return out;
}

export const visitorSlotFor = (slot: number, week: number, leagueSize: number): number =>
  (slot + (OFFSETS[week] ?? 1)) % leagueSize;

export const hostSlotFor = (slot: number, week: number, leagueSize: number): number =>
  (slot - (OFFSETS[week] ?? 1) + leagueSize * 2) % leagueSize;

/* --------------------------------------------------------------- state -- */

export type SettledWeek = {
  week: number;
  /** Draws both clubs carried INTO the week — what the schedule card printed. */
  hostDrawBefore: number;
  visitorSlot: number;
  visitorDrawBefore: number;
  price: number;
  share: number;
  /** True when the week bell closed on a desk that never locked. */
  auto: boolean;
  /** True for weeks the league office ran before a desk claimed this club. */
  stock: boolean;
  home: HomeSettlement;
  localMedia: number;
  national: number;
  bill: number;
  reinvestPaid: number;
  net: number;
  cashAfter: number;
  drawAfter: number;
  drawMove: number;
  /** The building this club visited, and the dollars its Draw put on those books. */
  roadHostSlot: number;
  roadHostDrawBefore: number;
  roadDollars: number;
  roadTurnoutLift: number;
  /**
   * The gate call that stood when the week bell rang, or null on a desk that
   * did not make one (and on any week rehydrated from a snapshot written before
   * the call existed). Frozen here so the settlement resolves against what the
   * pair actually said, not against a later state.
   */
  gateCall: GateCall | null;
  /**
   * The pool position this club called for THIS week, taken while locked and
   * waiting for the room — same lifecycle as `gateCall`. Frozen onto the
   * settled week when it settles, then cleared. `null` on a club that never
   * called one and on any week rehydrated from a snapshot written before it
   * existed. Optional at construction time — every read goes through
   * `poolPositionOf()`, never a direct field access, so a settled week built
   * before this field existed is still a valid week.
   */
  poolPosition?: { chip: PoolChip; line: string } | null;
};

export type Club = {
  slot: number;
  profileId: MarketId;
  seatId: SeatId | null;
  deskNumber: number | null;
  crestIndex: number;
  draw: number;
  cash: number;
  price: number;
  share: number;
  locked: boolean;
  joinedAtWeek: number;
  starGone: boolean;
  weeks: SettledWeek[];
  /**
   * The pair's one call during REVEAL: did their Draw put MORE money on other
   * clubs' books than the visiting clubs put on theirs? Taken before beat 2
   * answers it. `null` on a desk that never called it, and on any club
   * rehydrated from a snapshot written before this field existed.
   */
  ledgerPrediction: "gave" | "took" | null;
  /**
   * The pair's call on THIS week's crowd, made while locked and waiting for the
   * room. Cleared when the week settles (it moves onto the settled week), and
   * null on any club rehydrated from a snapshot written before it existed.
   */
  gateCall: GateCall | null;
  /**
   * W5 pool position capture (Bible §13.2): "This week I'm putting back
   * [chip] because [line]." Taken while locked and waiting for the room, same
   * lifecycle as `gateCall` — cleared onto the settled week at the bell. Never
   * shown to another seat (`spotlightViewFor` reads only the caller's own).
   */
  poolPosition?: { chip: PoolChip; line: string } | null;
};

export type HostLeagueState = {
  clubs: Club[];
  seatToSlot: Record<SeatId, number>;
  deskCount: number;
  leagueSize: number;
  leagueFrozen: boolean;
  /** 0-based index of the week currently open. WEEK_COUNT once all three have settled. */
  weekIndex: number;
  /** The club whose star left. Fixed the moment week 2 opens; null before that. */
  shockSlot: number | null;
  /** Teacher-released mid-lesson decomposition (the Handed-To-You bar + the pipe table). */
  barReleased: boolean;
  /**
   * The `weekIndex` at the moment the bar went up, or null.
   *
   * REVEAL stage 5 asks whether the room changed its mind AFTER seeing the bar.
   * Without this, the beat cannot tell a room that saw the bar before week 3
   * from a room that never saw it at all, and it asserted the bar as the cause
   * either way (`gate-l2-play` R3, `gate-l2-econ` FL-F).
   */
  barReleasedAtWeek: number | null;
  /**
   * How many live desks were already LOCKED into the open week at the moment
   * the bar went up, or null if it never went up.
   *
   * `gate-l2-projector` W4-1 (BLOCKING). `barReleasedAtWeek === WEEK_COUNT - 1`
   * covers two different rooms — the clean one `/teach` prescribes (released
   * right after the week-2 bell, when no desk has touched a week-3 dial) and
   * the messy one (released mid-week-3, with some desks already committed) —
   * and the stage-5 frame asserted the messy one unconditionally: "some desks
   * had already locked", printed to a room in which zero desks had. Observed
   * live, both projector shapes, on the release path `/teach` itself
   * prescribes. The existing state could not tell the two apart, so this is the
   * variable that tells them apart.
   *
   * May be `undefined` on a snapshot written before this field existed; every
   * read goes through `lockedAtBarRelease()`.
   */
  lockedAtBarRelease: number | null;
  /**
   * `gate-l2-teacher` W5 N-3. Pairs who arrived after the last week was closed.
   *
   * A device that joined during ADAPT used to be refused with a bare 409, retry
   * in a loop, and sit on "You're in — finding your club…" for the rest of the
   * period while `/teach` listed the pair in the join list and said nothing
   * about them. L3 already had the honest landing (`observerSeats`), and this is
   * that pattern, with one deliberate difference recorded below in `seatLate`.
   *
   * Optional at read time: a snapshot written before this field existed is
   * still a valid session, and must boot rather than quarantine.
   */
  observerSeats?: string[];
  revealStage: number;
  barPage: number;
  synthPage: number;
  /**
   * Which class this room is for. Fixed at createSession (D22's second
   * attachment point). Optional at read time — a snapshot written before this
   * field existed is still a valid session — so every read goes through
   * `bandOfRoom()`, never a direct field access.
   */
  gradeBand?: GradeBand;
  /**
   * W5 seed-IN from Week 4 ("m2l1-full-house"), validated per club, never per
   * seed. Empty on an unseeded room. Optional at read time — a snapshot
   * written before this field existed reads as `[]` via `carriedClubsOf()`.
   */
  carried?: CarriedClub[];
  /**
   * Teacher-readable account of what the Week-4 link did (or why it did
   * nothing): no seed, wrong `lessonModuleId`, a band mismatch, or how many
   * franchises carried in and how many opened with a named penalty. `null` on
   * an unseeded room and on any snapshot written before this field existed.
   */
  seedNote?: string | null;
  /**
   * THE POOL, printed as a fraction internally; never as a fraction or a
   * percentage on a 5-6 surface (`levyLineFor`). Optional at read time — a
   * snapshot written before this field existed reads as `LEVY_FRACTION` via
   * `levyOf()`.
   */
  levy?: number;
  /**
   * Every live club's pool line, every settled week, flat and append-only.
   * Optional at read time — a snapshot written before this field existed
   * reads as `[]` via `poolOf()`.
   */
  pool?: PoolWeek[];
  /**
   * THE RITUAL. 0 = not started; 1-6 = one of `POOL_RITUAL_STAGE_NAMES`,
   * teacher-pressed only (`teacher:poolStage`), never a timer. Lives inside
   * REVEAL — "no new phase" (spec, Both weeks — implementation shape).
   * Optional at read time — a snapshot written before this field existed
   * reads as `0` via `ritualStageOf()`.
   */
  ritualStage?: number;
  /** Paging within the NET ritual stage (stage 5), same idiom as `barPage`. */
  poolPage?: number;
  /**
   * D62 R-14 (7-8 only). THE NO-BOWL SEASON: the same three weeks, every
   * live desk's own recorded price and reinvest held fixed, replayed with
   * `levy = 0` — the "before" this room never played, computed rather than
   * invented. Teacher-pressed once (`teacher:noBowl`), never a timer, never
   * offered at 5-6. `null`/absent means the press has not run (or this is a
   * snapshot from before this field existed) — every read goes through
   * `noBowlOf()`, never a direct field access.
   */
  noBowl?: NoBowlResult | null;
};

/** Snapshot-safe band read: a state with no `gradeBand` reads as "5-6". */
export const bandOfRoom = (state: HostLeagueState): GradeBand => bandOrDefault(state.gradeBand);
/** Snapshot-safe carry read: a state with no `carried` reads as `[]`. */
export const carriedClubsOf = (state: HostLeagueState): readonly CarriedClub[] => state.carried ?? [];
/** Snapshot-safe levy read: a state with no `levy` reads as `LEVY_FRACTION`. */
export const levyOf = (state: HostLeagueState): number => state.levy ?? LEVY_FRACTION;
/** Snapshot-safe pool read: a state with no `pool` reads as `[]`. */
export const poolOf = (state: HostLeagueState): readonly PoolWeek[] => state.pool ?? [];
/** Snapshot-safe ritual-stage read: a state with no `ritualStage` reads as `0`. */
export const ritualStageOf = (state: HostLeagueState): number => state.ritualStage ?? 0;
/** Snapshot-safe pool-page read: a state with no `poolPage` reads as `0`. */
export const poolPageOf = (state: HostLeagueState): number => state.poolPage ?? 0;
/** Snapshot-safe read of a club or settled week's pool position — `undefined` and `null` both read as no call. */
export const poolPositionOf = (o: { poolPosition?: { chip: PoolChip; line: string } | null }): { chip: PoolChip; line: string } | null =>
  o.poolPosition ?? null;

/**
 * D62 R-14. One live club's season, both ways: what actually happened (with
 * the bowl) beside the computed replay at `levy = 0` (no bowl), same
 * recorded price and reinvest every week. `reinvestWithBowl` and
 * `reinvestNoBowl` are computed separately rather than assumed equal (see
 * `computeNoBowl`) even though the shipped reinvest formula never reads the
 * levy — a desk's dial, held fixed, cannot itself have changed.
 */
export type NoBowlRow = {
  slot: number;
  club: string;
  cashWithBowl: number;
  cashNoBowl: number;
  reinvestWithBowl: number;
  reinvestNoBowl: number;
};
export type NoBowlResult = {
  rows: NoBowlRow[];
  leagueReinvestWithBowl: number;
  leagueReinvestNoBowl: number;
  roomReinvestLineWithBowl: string;
  roomReinvestLineNoBowl: string;
  /**
   * D62 R-14 EXTENSION — THE BEST-RESPONSE LAYER. `reinvestWithBowl`/
   * `reinvestNoBowl` above are the SAME played dial (dials held, D62 R-14's
   * own point: the bowl only ever moves cash). This is the OTHER number the
   * INCENTIVE chain needs: what each club's own best reinvest WOULD have
   * been, re-decided from scratch under `bestResponseFor`, at the room's
   * actual levy versus at levy 0. A computed re-decision, never a played
   * one — see `SIMPLIFICATIONS`.
   */
  bestResponse: NoBowlBestResponse;
};

/** One live club's own best-response reinvest, mean over the three settled weeks, both ways. */
export type NoBowlBestResponseRow = {
  slot: number;
  club: string;
  bestReinvestWithBowl: number;
  bestReinvestNoBowl: number;
  bestReinvestDollarsWithBowl: number;
  bestReinvestDollarsNoBowl: number;
};
export type NoBowlBestResponse = {
  rows: NoBowlBestResponseRow[];
  leagueMeanWithBowl: number;
  leagueMeanNoBowl: number;
  line: string;
};
/** Snapshot-safe read: a state with no `noBowl` (never pressed, or pre-dates the field) reads as `null`. */
export const noBowlOf = (state: HostLeagueState): NoBowlResult | null => state.noBowl ?? null;

/**
 * Bars per projector frame on the Handed-To-You board.
 *
 * FIVE is a measured cap, not a taste, and it is the same discipline L1's
 * `CF_ROWS_PER_PAGE` records: the rows scale with the class and the screen does
 * not. `runtime/scripts/e2e-m2l2.cjs` asserts every rendered bar's own box, the
 * class summary's box, and that `#stage` does not overflow AT ALL at 1366x768
 * and 1920x1080 with twelve desks — raise this and that instrument fails rather
 * than silently clipping the room's evidence.
 */
export const BARS_PER_PAGE = 5;
export const barPageCount = (rows: number): number => Math.max(1, Math.ceil(rows / BARS_PER_PAGE));
export const barPageDeskNames = (rows: readonly { deskHandle: string }[], page: number): string =>
  rows
    .slice(page * BARS_PER_PAGE, page * BARS_PER_PAGE + BARS_PER_PAGE)
    .map((r) => r.deskHandle.split(" · ")[0])
    .join(", ");

export const SYNTH_CARDS_PER_PAGE = 1;
export const synthPageCount = (cards: number): number => Math.max(1, Math.ceil(cards / SYNTH_CARDS_PER_PAGE));

export const REVEAL_STEPS = 5;

/* ------------------------------------------------------ the gate call -- */

/**
 * THE GATE CALL (W6 repair `play-l2-locked-dead-time`).
 *
 * A pair that commits early used to sit on a screen that said, in the product's
 * own words, "Locked. Nothing to do but find out" — with the bottom half of the
 * device blank — until the slowest desk in the room finished. Three weeks of
 * that is three stretches of dead air in a fifty-minute class, and dead air is
 * where a room stops being in the lesson.
 *
 * The wait is real and should stay teacher-paced, so the repair does not remove
 * it. It gives the wait the one thing the pair genuinely does not know and
 * cannot look up: the crowd. The call is free, changeable while the week is
 * open, and carries no money — its whole job is to make the pair COMMIT to a
 * reading before the building answers, so that the settlement is an answer to
 * something they said rather than a number that merely arrives.
 *
 * The three bands are honestly uncertain at the prices pairs actually choose:
 * measured across the sixteen real clubs, the six league Draws and the $16-$60
 * band, they come out 26% / 28% / 46%. A call nobody can get wrong teaches
 * nothing, and neither does one nobody can get right.
 */
export type GateCall = "packed" | "busy" | "quiet";

/** The fill fraction at or above which the building reads PACKED. */
export const GATE_PACKED_FLOOR = 0.85;
/** The fill fraction at or above which the building reads BUSY. */
export const GATE_BUSY_FLOOR = 0.7;

export const GATE_BANDS: readonly { id: GateCall; label: string; blurb: string }[] = [
  { id: "packed", label: "PACKED", blurb: "nearly every seat sold" },
  { id: "busy", label: "BUSY", blurb: "a good crowd, real gaps in it" },
  { id: "quiet", label: "QUIET", blurb: "a lot of empty seats" },
];

export const GATE_CALL_PROMPT = "Your price is in. Nobody knows the crowd yet — not even you. Call it: how full does your building get?";
export const GATE_CALL_HEADING = "While the rest of the league commits";
/** What the card says before the pair has called, and after. Both authored here, never in the client. */
export const GATE_CALL_FOOT_OPEN = "No money rides on this. It is only worth something if you say it out loud before you know.";
export const gateCallFootCalledFor = (building: string): string =>
  `Your call is in — ${building} answers when the week closes. You can change it until then.`;

/**
 * How much of the room has committed, as an aggregate. Never a seat identity —
 * `/play` is private and stays private (D14/CLAUDE.md 11); this is the same
 * class-level fact the projector already carries, and it is what turns "wait"
 * into a finite, legible thing the pair can see the end of.
 */
export function roomLockLine(state: HostLeagueState): { locked: number; seated: number; line: string } {
  const seatedClubs = state.clubs.slice(0, state.leagueSize).filter((c) => c.seatId !== null);
  const locked = seatedClubs.filter((c) => c.locked).length;
  const seated = seatedClubs.length;
  const waiting = seated - locked;
  return {
    locked,
    seated,
    line:
      waiting <= 0
        ? `All ${seated} desks are in. Your teacher closes the week.`
        : `${locked} of ${seated} desks are in. ${waiting === 1 ? "One desk is" : `${waiting} desks are`} still deciding.`,
  };
}

/** Which band a settled home night actually landed in. */
export function gateBandOf(home: HomeSettlement): GateCall {
  const fill = home.capacity > 0 ? home.turnout / home.capacity : 0;
  return fill >= GATE_PACKED_FLOOR ? "packed" : fill >= GATE_BUSY_FLOOR ? "busy" : "quiet";
}

const gateLabel = (band: GateCall): string => GATE_BANDS.find((b) => b.id === band)!.label;

/**
 * How the settled week answers the pair's call.
 *
 * Deliberately forecasting language, never a verdict on the price: reading a
 * crowd right and pricing well are different skills, and the product must not
 * let one stand in for the other. `null` on a week nobody called.
 */
export function gateCallResolvedFor(week: SettledWeek): { called: GateCall; actual: GateCall; right: boolean; line: string } | null {
  const called = week.gateCall;
  if (called === null) return null;
  const actual = gateBandOf(week.home);
  const fill = Math.round((week.home.turnout / Math.max(1, week.home.capacity)) * 100);
  const crowd = `${week.home.turnout.toLocaleString()} came — ${fill}% of the building`;
  return {
    called,
    actual,
    right: called === actual,
    line:
      called === actual
        ? `You called ${gateLabel(called)}. ${crowd}. You read it.`
        : `You called ${gateLabel(called)}. ${crowd}, which is ${gateLabel(actual)}. The building did not go the way you read it.`,
  };
}

/**
 * The horizon rule, in the shortest true form that still teaches it, for the
 * projector's standing chip on REVEAL stage 5. Every desk was shown this rule
 * before it priced week 3 (`reinvestRuleFor`), which is exactly why the class
 * has to be able to see it while it argues about what the room did.
 */
export const LAST_WEEK_RULE_CHIP = "LAST-WEEK RULE — week 3 was the end. Draw bought in week 3 earns nothing else in this lesson.";

export type RevealStage = { stage: number; name: string; headline: string; say: string };

/** Where the class is, in this lesson's words rather than the engine's. Never what it found. */
const PHASE_EVENT: Partial<Record<CanonicalPhase, string>> = {
  HOOK: "Your teacher set up the league.",
  PLAY: "The league opened \u2014 clubs started pricing weeks and setting reinvest.",
  REVEAL: "The season went up on the projector.",
  CONSEQUENCE: "The class started reading what the season cost.",
  ADAPT: "The class went back over the reinvest decision.",
  COUNTERFACTUAL: "The class started replaying the season under other rules.",
  ARGUE: "The class started arguing from the board.",
  SYNTHESIS: "Your teacher started naming the economics.",
  COMPLETE: "The lesson finished.",
};

export const REVEAL_STAGES: readonly RevealStage[] = [
  {
    stage: 1,
    name: "The Handed-To-You bar — the whole season",
    headline: "WHO FILLED YOUR BUILDING?",
    say: "One bar per desk, three weeks of home games. Ask them to point at the block that is not theirs.",
  },
  {
    stage: 2,
    name: "Who paid for whose night — the visitor ledger",
    headline: "WHAT YOU GAVE, WHAT YOU GOT",
    say: "Every desk put money on somebody else's books and took money off somebody else's Draw. Read one row out loud and stop.",
  },
  {
    stage: 3,
    name: "The four pipes — where the money actually comes from",
    headline: "FOUR PIPES, ONE CLUB",
    say: "For almost every club here the tallest block is the one nobody in this room can move. If a desk out-gated it, ask that desk what it charged.",
  },
  {
    stage: 4,
    name: "The small-market path",
    headline: "SMALL BUILDING, BIG NIGHT",
    say: "This is the room's own arithmetic, not a slogan. Ask which they would rather have: a big market or a big visitor.",
  },
  {
    stage: 5,
    name: "Did the room change its mind — or run out of tomorrow?",
    headline: "WHAT YOU DID IN THE LAST WEEK",
    say: "The room's own reinvest per week, with the last-week rule printed beside it. Say the rule out loud — week 3 was the end, and Draw bought then earns nothing else in this lesson — and THEN ask them why the room did what it did. Do not resolve it: this board deliberately refuses to choose between the rule and the bar.",
  },
];

/* --------------------------------------------------------------- seating -- */

const profileOf = (club: Club): MarketProfile => PROFILE_BY_ID.get(club.profileId)!;
const defOf = (club: Club): ClubDef => CLUBS[club.slot]!;

/** `carried` is the room's own Week-4 seed-in list (see `readWeek4Seed`); a slot the seed omits opens at its stock cash. */
function makeClub(slot: number, carried: readonly CarriedClub[] = []): Club {
  const def = CLUBS[slot]!;
  const carry = carried.find((c) => c.slot === slot) ?? null;
  return {
    slot,
    profileId: def.profileId,
    seatId: null,
    deskNumber: null,
    crestIndex: slot % CREST_COUNT,
    draw: def.startDraw,
    cash: carry ? carry.cashOpening : 0,
    price: PROFILE_BY_ID.get(def.profileId)!.housePrice,
    share: 0,
    locked: false,
    joinedAtWeek: 1,
    starGone: false,
    weeks: [],
    ledgerPrediction: null,
    gateCall: null,
    poolPosition: null,
  };
}

function withLeagueSize(state: HostLeagueState, size: number): HostLeagueState {
  if (size <= state.clubs.length) return { ...state, leagueSize: size };
  const clubs = state.clubs.slice();
  const carried = carriedClubsOf(state);
  for (let i = clubs.length; i < size; i += 1) clubs.push(makeClub(i, carried));
  return { ...state, clubs, leagueSize: size };
}

/**
 * Full House's real `marketId` values (`ClubId`, `sameLine/world.ts:366-374`)
 * that this league also carries as a real club — matched by the same NBA
 * club, never by string coincidence. A `marketId` not in this table (Full
 * House currently carries "brooklyn" and "minnesota", neither of which is one
 * of this league's twenty clubs) falls back to slot order, and the seed note
 * says so — never a silent drop and never an invented match.
 */
const WEEK4_MARKET_TO_SLOT: Readonly<Record<string, number>> = {
  memphis: 1,
  detroit: 19,
  milwaukee: 4,
  boston: 5,
  sacramento: 12,
  "new-york": 0,
};

/**
 * W5 SEED-IN FROM WEEK 4 (`m2l1-full-house`).
 *
 * `seed` is untrusted input from the runtime (`lessonModule.ts`'s own
 * contract) and its `state` half is Full House's own state
 * (`fullHouse.ts:1115` `Desk`, `:1185` `deskOrder`) — read defensively: every
 * field checked with `typeof`, nothing thrown, no assumption that a field
 * present today stays present. Validated PER DESK, never per seed (one
 * malformed desk is skipped, never a reason to reject every other one).
 *
 * Every non-ok or partial outcome is named in the returned `note` — a
 * teacher-readable how-you-got-here sentence, never a silent stock start.
 */
function readWeek4Seed(seed: unknown, gradeBand: GradeBand): { clubs: CarriedClub[]; note: string | null } {
  if (seed === undefined || seed === null) {
    return { clubs: [], note: "This room has no Week 4 link — every building opens at its stock start." };
  }
  if (typeof seed !== "object") {
    return { clubs: [], note: "This room's Week 4 link was unreadable, so every building opened at its stock start." };
  }
  const env = seed as Record<string, unknown>;
  if (env["lessonModuleId"] !== "m2l1-full-house") {
    return {
      clubs: [],
      note: "This room's Week 4 link pointed at a different lesson, so it was ignored — every building opened at its stock start.",
    };
  }
  const seedBand = env["sourceGradeBand"];
  if (typeof seedBand === "string" && seedBand !== gradeBand) {
    return {
      clubs: [],
      note: `The linked Week 4 room was a ${seedBand} class; this room is ${gradeBand}. The link was refused — every building opened at its stock start.`,
    };
  }
  const inner = env["state"];
  if (typeof inner !== "object" || inner === null) {
    return { clubs: [], note: "The linked Week 4 room's books could not be read, so every building opened at its stock start." };
  }
  const innerRec = inner as Record<string, unknown>;
  const deskOrder = innerRec["deskOrder"];
  const desksById = innerRec["desks"];
  if (!Array.isArray(deskOrder) || typeof desksById !== "object" || desksById === null) {
    return { clubs: [], note: "The linked Week 4 room named no desks, so every building opened at its stock start." };
  }
  const desksRec = desksById as Record<string, unknown>;

  const out: CarriedClub[] = [];
  const usedSlots = new Set<number>();
  const fallbackDesks: Record<string, unknown>[] = [];
  let penaltyCount = 0;
  let clampedCount = 0;
  let unclearedNoted = 0;

  for (const seatId of deskOrder) {
    if (typeof seatId !== "string") continue;
    const raw = desksRec[seatId];
    if (typeof raw !== "object" || raw === null) continue;
    const d = raw as Record<string, unknown>;
    const marketId = d["marketId"];
    const slot = typeof marketId === "string" ? WEEK4_MARKET_TO_SLOT[marketId] : undefined;
    if (slot === undefined || usedSlots.has(slot)) {
      fallbackDesks.push(d);
      continue;
    }
    usedSlots.add(slot);
    out.push(carriedClubFrom(d, slot, () => {
      penaltyCount += 1;
    }, () => {
      clampedCount += 1;
    }, () => {
      unclearedNoted += 1;
    }));
  }
  // Fallback: a desk whose real club is not one of this league's twenty
  // (Full House currently carries "brooklyn" and "minnesota") still carries
  // its CASH in, by slot order, into whichever slot is not already spoken
  // for — named, never a silent drop.
  let nextFreeSlot = 0;
  let unmatchedCount = 0;
  for (const d of fallbackDesks) {
    while (usedSlots.has(nextFreeSlot) && nextFreeSlot < CLUBS.length) nextFreeSlot += 1;
    if (nextFreeSlot >= CLUBS.length) break;
    usedSlots.add(nextFreeSlot);
    unmatchedCount += 1;
    out.push(carriedClubFrom(d, nextFreeSlot, () => {
      penaltyCount += 1;
    }, () => {
      clampedCount += 1;
    }, () => {
      unclearedNoted += 1;
    }));
  }

  if (out.length === 0) {
    return { clubs: [], note: "The linked Week 4 room named no readable desks, so every building opened at its stock start." };
  }
  const notes: string[] = [`${out.length} building${out.length === 1 ? "" : "s"} carried in from Week 4.`];
  if (unmatchedCount > 0) {
    notes.push(`${unmatchedCount} carried a club this league does not seat, so ${unmatchedCount === 1 ? "it" : "they"} carried in by desk order instead of by club.`);
  }
  if (penaltyCount > 0) {
    notes.push(
      `${penaltyCount} of them didn't cover their own Week 4 bill and opened here with a named $${MISSED_BILL_PENALTY.toLocaleString()} penalty on their how-you-got-here card.`,
    );
  }
  if (unclearedNoted > 0) {
    notes.push(`${unclearedNoted} carried no record of whether their Week 4 bill cleared, so this room treated it as cleared.`);
  }
  if (clampedCount > 0) {
    notes.push(
      `${clampedCount} opened with cash floored at $${Math.abs(MIN_CARRIED_CASH).toLocaleString()} in debt so no carried building started unable to operate.`,
    );
  }
  return { clubs: out, note: notes.join(" ") };
}

/** One Full House `Desk`, validated and normalised into this league's `CarriedClub` for the given slot. */
function carriedClubFrom(
  d: Record<string, unknown>,
  slot: number,
  onPenalty: () => void,
  onClamp: () => void,
  onUnclearedRecord: () => void,
): CarriedClub {
  const cash = typeof d["cash"] === "number" && Number.isFinite(d["cash"]) ? (d["cash"] as number) : 0;
  const clearedField = d["clearedTheBill"];
  // Absent (still mid-season, or a snapshot older than the field) reads as
  // cleared, and the seed note says so rather than inventing a penalty for a
  // franchise that was never actually judged.
  let billCleared: boolean | null;
  if (typeof clearedField === "boolean") {
    billCleared = clearedField;
  } else {
    billCleared = null;
    onUnclearedRecord();
  }
  let cashOpening = cash;
  let penalty = 0;
  if (billCleared === false) {
    penalty = MISSED_BILL_PENALTY;
    cashOpening -= penalty;
    onPenalty();
  }
  let clamped = false;
  if (cashOpening < MIN_CARRIED_CASH) {
    cashOpening = MIN_CARRIED_CASH;
    clamped = true;
    onClamp();
  }
  return { slot, cashOpening, penalty, billCleared, clamped };
}

/**
 * A desk that joins late is not broken and not blank: its club has been in the
 * league all along, run by the league office at the same bot policy every other
 * unclaimed club uses. The desk inherits that club's real books and its real
 * Draw, marked `stock` on its own screen and never a silent zero.
 */
function seatDesk(state: HostLeagueState, seatId: SeatId): ReduceResult<HostLeagueState> {
  if (state.seatToSlot[seatId] !== undefined) return { ok: true, state };
  const deskNumber = state.deskCount + 1;
  if (deskNumber > MAX_DESKS) {
    return { ok: false, reason: `this league is full — it seats ${MAX_DESKS} desks and every club already has one` };
  }
  let next = state;
  if (!next.leagueFrozen) {
    next = withLeagueSize(next, Math.max(MIN_LEAGUE, Math.min(CLUBS.length, deskNumber + 2)));
  }
  const slot = next.clubs.findIndex((c) => c.seatId === null && c.slot < next.leagueSize && c.slot !== next.shockSlot);
  if (slot < 0) {
    return {
      ok: false,
      reason: `this league is full — it seats ${MAX_DESKS} desks and every club already has one`,
    };
  }
  const clubs = next.clubs.slice();
  clubs[slot] = { ...clubs[slot]!, seatId, deskNumber, joinedAtWeek: Math.min(next.weekIndex + 1, WEEK_COUNT) };
  return {
    ok: true,
    state: { ...next, clubs, seatToSlot: { ...next.seatToSlot, [seatId]: slot }, deskCount: deskNumber },
  };
}

/** Pairs recorded as observers, tolerant of a snapshot written before the field existed. */
export const observersOf = (state: HostLeagueState): readonly string[] => state.observerSeats ?? [];

/**
 * THE LATE ARRIVAL, AFTER THE SEASON — `gate-l2-teacher` W5 N-3.
 *
 * L3 offers a late pair a HANDOVER first (take over a league-office club) and
 * falls back to OBSERVER. This lesson deliberately takes only the observer
 * limb once the weeks are closed, and the reason is the lesson's own evidence:
 * every figure the room has already been shown — the bars, the by-choice
 * ledger, the room's joint effect, the sweet-spot band, every synthesis card —
 * is computed over the LIVE desks. Seating a new desk during REVEAL or ADAPT
 * would silently re-derive numbers the teacher has already read out loud to the
 * room, and put a bar on the projector for a club nobody in the room played.
 * A 409 was wrong; rewriting the class's own evidence to avoid it is worse.
 *
 * So: they are recorded, their device is told the truth and told what to do,
 * and `/teach` gets a WATCH FOR entry that names them. Nothing is silent, and
 * nothing the room has already seen moves. During PLAY a late pair still gets a
 * real club — that path is unchanged, and it is the one that matters.
 */
function seatLate(state: HostLeagueState, seatId: SeatId): ReduceResult<HostLeagueState> {
  if (state.seatToSlot[seatId] !== undefined) return { ok: true, state };
  const observers = observersOf(state);
  if (observers.includes(seatId)) return { ok: true, state };
  return { ok: true, state: { ...state, observerSeats: [...observers, seatId] } };
}

/* --------------------------------------------------------------- bots -- */

/**
 * The league office's reinvest policy for an unclaimed club: a fixed ladder by
 * league slot, so the room's Draw table spreads instead of moving in lockstep,
 * and so a bot is never secretly playing better than a pair. It is printed on
 * every surface that shows a bot ("run by the league office"), and it never
 * reads a desk's decisions.
 */
export const BOT_SHARES: readonly number[] = [20, 0, 30, 10, 25, 5, 35, 15];

export function botShareFor(slot: number, week: number, starGone: boolean): number {
  if (starGone) return 0;
  return BOT_SHARES[(slot + week) % BOT_SHARES.length]!;
}

/* ------------------------------------------------------------- settling -- */

/**
 * THE POOL's own split arithmetic, one week: every live slot pays a fixed
 * fraction of its own assessed local revenue in, and the bowl comes back out
 * as an equal share with any leftover dollar going to the first live slots in
 * slot order (rounding stated, never hidden — see `poolRoundingNoteFor`).
 *
 * Factored out of `settleWeek` so D62 R-14's no-bowl replay (`computeNoBowl`)
 * calls this SAME formula at `levy = 0` rather than re-deriving or assuming
 * the result — at `levy = 0` every `paidIn` and `tookOut` collapses to zero,
 * but it collapses because the formula says so, not because the caller
 * hard-coded it.
 */
function poolSplitFor(
  size: number,
  liveSlots: readonly number[],
  assessedLocalRevenue: readonly number[],
  levy: number,
): { paidIn: number[]; tookOut: number[] } {
  const paidIn: number[] = new Array(size).fill(0);
  let bowlTotal = 0;
  for (const i of liveSlots) {
    const paid = Math.round(assessedLocalRevenue[i]! * levy);
    paidIn[i] = paid;
    bowlTotal += paid;
  }
  const liveCount = liveSlots.length;
  const splitBase = liveCount > 0 ? Math.floor(bowlTotal / liveCount) : 0;
  const splitRemainder = liveCount > 0 ? bowlTotal - splitBase * liveCount : 0;
  const tookOut: number[] = new Array(size).fill(0);
  liveSlots.forEach((slot, idx) => {
    tookOut[slot] = splitBase + (idx < splitRemainder ? 1 : 0);
  });
  return { paidIn, tookOut };
}

function settleWeek(state: HostLeagueState, honorPendingDials: boolean): HostLeagueState {
  const week = state.weekIndex;
  if (week >= WEEK_COUNT) return state;
  const size = state.leagueSize;
  const drawBefore = state.clubs.map((c) => c.draw);

  // Every club's committed dials for this week, resolved first so no club's
  // settlement can depend on the order the room happened to lock in.
  const prices: number[] = [];
  const shares: number[] = [];
  const autos: boolean[] = [];
  for (let i = 0; i < size; i += 1) {
    const club = state.clubs[i]!;
    const profile = profileOf(club);
    if (club.seatId === null) {
      prices.push(profile.housePrice);
      shares.push(botShareFor(i, week, club.starGone));
      autos.push(false);
      continue;
    }
    const auto = !club.locked;
    const usePending = honorPendingDials && !club.locked;
    prices.push(auto && !usePending ? profile.housePrice : club.price);
    shares.push(auto && !usePending ? 0 : club.share);
    autos.push(auto);
  }

  // Every home night, computed before anything is written back.
  const homes: HomeSettlement[] = [];
  const localMediaArr: number[] = [];
  for (let i = 0; i < size; i += 1) {
    const club = state.clubs[i]!;
    const profile = profileOf(club);
    const v = visitorSlotFor(i, week, size);
    homes.push(settleHome(profile, defOf(club).capacity, drawBefore[i]!, drawBefore[v]!, prices[i]!));
    localMediaArr.push(localMediaFor(profile, drawBefore[i]!));
  }

  // THE POOL (W5 non-negotiable 1: assessed and imposed, never voted). Every
  // LIVE club is levied a fixed fraction of ITS OWN `gate + localMedia` —
  // deliberately NOT `doorMoney` (which also carries in-arena spend) and
  // NEVER the equal national check, which is already shared. This is the
  // SAME base Week 6 taxes (`writeTheRule.ts` `taxedLocal`), on purpose: the
  // room's own Week 6 rule must read as a true escalation of Week 5's
  // levy, never a denominator trick that makes the same number look bigger
  // or smaller depending which week is asking. Restricted to live desks
  // (`SIMPLIFICATIONS`): a league-office bot has no student behind it to
  // feel either half of the reveal.
  const liveSlots: number[] = [];
  for (let i = 0; i < size; i += 1) if (state.clubs[i]!.seatId !== null) liveSlots.push(i);
  const levy = levyOf(state);
  const assessedLocalRevenue: number[] = new Array(size).fill(0);
  for (const i of liveSlots) assessedLocalRevenue[i] = homes[i]!.gate + localMediaArr[i]!;
  // Extracted as `poolSplitFor` so D62 R-14's no-bowl replay can call the
  // EXACT same split formula at `levy = 0` instead of re-deriving it.
  const { paidIn: poolPaidIn, tookOut: poolTookOut } = poolSplitFor(size, liveSlots, assessedLocalRevenue, levy);

  const clubs = state.clubs.slice();
  const poolRows: PoolWeek[] = [];
  for (let i = 0; i < size; i += 1) {
    const club = state.clubs[i]!;
    const profile = profileOf(club);
    const visitorSlot = visitorSlotFor(i, week, size);
    const roadHostSlot = hostSlotFor(i, week, size);
    const home = homes[i]!;
    const roadHome = homes[roadHostSlot]!;
    const localMedia = localMediaArr[i]!;
    const reinvestPaid = Math.round((shares[i]! / 100) * home.doorMoney);
    const isLive = club.seatId !== null;
    const paidIn = poolPaidIn[i]!;
    const tookOut = poolTookOut[i]!;
    const poolNet = tookOut - paidIn;
    // `net` stays EXACTLY the pre-pool hosting decomposition (BC-5): every
    // instrument that reproduces or re-derives this figure independently
    // (`priceCounterfactualFor`'s `keptAt`, the give/take ledger, the tuning
    // harness) computes it from `home`/`localMedia`/`national`/`bill`/
    // `reinvestPaid` alone and must keep matching this field exactly. THE
    // POOL is a second, orthogonal deduction/credit against actual cash —
    // real (it changes what the desk can spend next week) but never mixed
    // into the hosting decomposition's own arithmetic.
    const net = home.doorMoney + localMedia + NATIONAL - profile.bill - reinvestPaid;
    const cashAfter = club.cash + net + poolNet;
    const drawAfter = nextDraw(profile, drawBefore[i]!, reinvestPaid);
    if (isLive) {
      poolRows.push({ week, slot: i, assessedLocalRevenue: assessedLocalRevenue[i]!, paidIn, tookOut, net: poolNet });
    }
    const settled: SettledWeek = {
      week,
      hostDrawBefore: drawBefore[i]!,
      visitorSlot,
      visitorDrawBefore: drawBefore[visitorSlot]!,
      price: prices[i]!,
      share: shares[i]!,
      auto: autos[i]!,
      stock: club.seatId === null,
      home,
      localMedia,
      national: NATIONAL,
      bill: profile.bill,
      reinvestPaid,
      net,
      cashAfter,
      drawAfter,
      drawMove: drawAfter - drawBefore[i]!,
      roadHostSlot,
      roadHostDrawBefore: drawBefore[roadHostSlot]!,
      roadDollars: roadHome.visitorDollars,
      roadTurnoutLift: roadHome.visitorFans,
      gateCall: club.gateCall ?? null,
      poolPosition: poolPositionOf(club),
    };
    clubs[i] = {
      ...club,
      cash: cashAfter,
      draw: drawAfter,
      price: profile.housePrice,
      share: 0,
      locked: false,
      gateCall: null,
      poolPosition: null,
      weeks: [...club.weeks, settled],
    };
  }

  let next: HostLeagueState = { ...state, clubs, weekIndex: week + 1, pool: [...poolOf(state), ...poolRows] };
  // The star departure lands the moment week 2 OPENS, so it is printed on the
  // week-2 card before anybody prices (R7) and never applied silently mid-week.
  if (next.weekIndex === 1) next = applyStarDeparture(next);
  return next;
}

/**
 * The week-2 exogenous beat (SR-11's frame).
 *
 * The club is chosen EXOGENOUSLY — the lowest-numbered club the league office is
 * running — so nothing a desk did makes the shock more or less likely to land on
 * it. Choosing it by "highest Draw" would have taught the opposite of the
 * lesson: reinvest, and get punished for it.
 */
function applyStarDeparture(state: HostLeagueState): HostLeagueState {
  if (state.shockSlot !== null) return state;
  let slot = state.clubs.findIndex((c) => c.seatId === null && c.slot < state.leagueSize);
  if (slot < 0) slot = state.leagueSize - 1;
  const clubs = state.clubs.slice();
  clubs[slot] = { ...clubs[slot]!, starGone: true, draw: SHOCK_DRAW };
  return { ...state, clubs, shockSlot: slot, leagueFrozen: true };
}

/* ---------------------------------------------------------- aggregates -- */

/**
 * THE ROOM — the live class read on /teach, and nowhere else. L2's own.
 *
 * The console shape is L1's (`fullHouse.roomRead`), because a teacher who
 * learned to read it on Monday must not have to learn a second console on
 * Tuesday. What it is a read OF is this lesson's, and it is not the price.
 *
 * L2's economics is the give and take: what a club puts back into itself is
 * what moves its Draw, and its Draw is what it hands the clubs it visits. So
 * the SHAPE the teacher needs during an open week is the reinvest dial — is
 * this a room of free riders, a room of investors, or two camps? — and the
 * histogram bins that. Price is still the loudest number on a desk, so it is
 * carried as the spread sentence rather than dropped.
 *
 * Two disciplines, both inherited and both load-bearing:
 *
 * - TEACHER-PRIVATE. Nothing here may reach `boardView` while a week is open.
 *   The room committing blind is what makes the ledger reveal land; a live
 *   histogram on the projector ends that in one press.
 * - Movement is claimed only for a desk whose previous week was its OWN
 *   decision. A bell-committed week is not a share anybody chose, and a week
 *   the league office covered before the pair arrived is not theirs at all.
 */
type L2RoomDesk = { handle: string; price: number; share: number; locked: boolean; weeksPlayed: number; ownLastShare: number | null };

function roomRead(desks: readonly L2RoomDesk[], weekIndex: number): Record<string, unknown> | null {
  if (desks.length === 0) return null;

  // Committed decisions only. Measured over every desk, the sentence reports
  // the house price the dial opens on, which is a number nobody chose.
  const committed = desks.filter((d) => d.locked);
  const prices = committed.map((d) => d.price).sort((a, b) => a - b);
  const min = prices.length > 0 ? prices[0]! : null;
  const max = prices.length > 0 ? prices[prices.length - 1]! : null;
  const mid =
    prices.length === 0
      ? null
      : prices.length % 2 === 1
        ? prices[(prices.length - 1) / 2]!
        : Math.round((prices[prices.length / 2 - 1]! + prices[prices.length / 2]!) / 2);

  // The histogram bins EVERY desk on the reinvest dial's own grid — a teacher
  // needs to see where the undecided dials are sitting too — and the dial is
  // short enough (0-40 in fives) that every step is its own bar.
  const bins: { from: number; to: number; label: string; count: number; lockedCount: number; handles: string[] }[] = [];
  for (let from = SHARE_MIN; from <= SHARE_MAX; from += SHARE_STEP) {
    const inBin = desks.filter((d) => d.share === from);
    bins.push({
      from,
      to: from,
      label: `${from}%`,
      count: inBin.length,
      lockedCount: inBin.filter((d) => d.locked).length,
      handles: inBin.map((d) => d.handle),
    });
  }

  let raised = 0;
  let held = 0;
  let lowered = 0;
  let noOwnPrior = 0;
  let noPrior = 0;
  let deciding = 0;
  for (const d of desks) {
    if (!d.locked) deciding += 1;
    else if (d.weeksPlayed === 0) noPrior += 1;
    else if (d.ownLastShare === null) noOwnPrior += 1;
    else if (d.share > d.ownLastShare) raised += 1;
    else if (d.share < d.ownLastShare) lowered += 1;
    else held += 1;
  }
  const moved = raised + held + lowered;
  const inSoFar = moved + noOwnPrior + noPrior;
  const lockedShares = committed.map((d) => d.share);
  const freeRiders = lockedShares.filter((v) => v === 0).length;

  return {
    deskCount: desks.length,
    lockedCount: committed.length,
    decidingCount: deciding,
    countLine: `${committed.length} of ${desks.length} locked in \u00b7 week ${weekIndex + 1} of ${WEEK_COUNT}`,
    spread: min === null || max === null || mid === null ? null : { min, max, median: mid, range: max - min },
    bins,
    movement: { raised, held, lowered, basis: moved, noOwnPrior, noPrior, deciding },
    firstNight: noPrior > 0 && moved === 0 && noOwnPrior === 0,
    movementLine:
      inSoFar === 0
        ? "Nobody is in yet — movement shows up as desks lock."
        : noPrior === inSoFar
          ? "First week — there is nothing behind these desks to have moved off yet."
          : moved === 0
            ? "Nobody in so far has a week of their own to have moved off."
            : `Of the ${inSoFar} in so far, on the reinvest dial: ${raised} put back more, ${held} held, ${lowered} put back less${
                noOwnPrior > 0 ? ` \u00b7 ${noOwnPrior} moving off a week the bell committed for them` : ""
              }${noPrior > 0 ? ` \u00b7 ${noPrior} on their first week` : ""}.`,
    spreadLine:
      min === null || max === null || mid === null
        ? "Nothing is committed yet \u2014 every dial is still sitting where the week opened."
        : `${
            prices.length === desks.length ? "The room" : `The ${prices.length} in so far`
          } ${min === max ? `all priced $${min}` : `priced between $${min} and $${max}, middle $${mid}`}\u2014 and ${
            freeRiders === 0
              ? "not one of them is putting nothing back"
              : freeRiders === prices.length
                ? `every one of them is putting NOTHING back`
                : `${freeRiders} of them are putting NOTHING back`
          }.`,
    privacyNote:
      "Yours only \u2014 the projector never shows this while the week is open. Reading the reinvest shape out before the bell tells the room what to copy, and the ledger reveal is built on them not knowing.",
  };
}

export const deskHandleFor = (club: Club): string => `Desk ${club.deskNumber} · ${CLUBS[club.slot]!.short}`;

/**
 * THE DESKS — the teacher's walk-to list. THE ROOM gives the shape of the room
 * and deliberately names nobody; this names the desks so the console can pair a
 * handle with the pair actually sitting there. Teacher-only, never `boardView`.
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

function deskStripOf(state: HostLeagueState): DeskStrip | null {
  const live = state.clubs
    .filter((c) => c.seatId !== null)
    .sort((a, b) => (a.deskNumber ?? 0) - (b.deskNumber ?? 0));
  if (live.length === 0) return null;
  const windowOpen = state.weekIndex < WEEK_COUNT;
  const weekNo = Math.min(state.weekIndex + 1, WEEK_COUNT);

  const entries: DeskStripEntry[] = live.map((c) => {
    const autos = c.weeks.filter((w) => w.auto).length;
    const own = c.weeks.filter((w) => !w.auto && !w.stock);
    const label = deskHandleFor(c);
    // `joinedAtWeek` is 1-based: a pair seated in the lobby joined at week 1.
    const covered = c.joinedAtWeek - 1;
    // Only weeks this pair was actually at count against them — see the same
    // guard in fullHouse: a covered week is not a week they failed to commit.
    const theirs = c.weeks.filter((w) => !w.stock);
    const [note, flag]: [string | null, boolean] =
      theirs.length >= 1 && own.length === 0
        ? ["Has never once locked a week of its own — every week so far was settled by the bell or covered before they arrived.", true]
        : autos >= 2
          ? [`The bell has settled ${autos} of this desk's weeks.`, true]
          : covered > 0
            ? [`Joined at Week ${c.joinedAtWeek}; the first ${covered} week${covered === 1 ? " was" : "s were"} covered for them.`, false]
            : c.cash < 0
              ? ["Books are in the red.", false]
              : [null, false];
    if (!windowOpen) return { seatId: c.seatId!, label, state: "closed", stateLabel: "Three weeks in", note, flag };
    if (c.locked) return { seatId: c.seatId!, label, state: "in", stateLabel: `Locked Week ${weekNo}`, note, flag };
    return { seatId: c.seatId!, label, state: "deciding", stateLabel: "Still deciding", note, flag };
  });

  const deciding = entries.filter((e) => e.state === "deciding").length;
  const countLine = windowOpen
    ? `${entries.length - deciding} of ${entries.length} locked · week ${weekNo} of ${WEEK_COUNT}`
    : `${entries.length} desk${entries.length === 1 ? "" : "s"} · all three weeks settled`;
  return { countLine, entries };
}
export const clubHandleFor = (club: Club): string =>
  club.seatId === null ? `${CLUBS[club.slot]!.short} · league office` : deskHandleFor(club);

/**
 * THE ABSTENTION ATOM — `gate-l2-teacher` W5 B-1 (BLOCKING).
 *
 * A desk that NEVER pressed LOCK in any week is not a chooser. Its weeks were
 * auto-committed at the league office's house price with nothing reinvested
 * because nobody touched the console — the outcome is $0 spend, and the outcome
 * is the ONLY thing it shares with the desk that locked in and picked 0%.
 *
 * The defect this exists to make unrepeatable: three surfaces each recomputed
 * "did this desk choose nothing?" from a DIFFERENT quantity. `/teach`'s WATCH
 * FOR read `weeks.every(auto || stock)` and told the teacher "they did not
 * choose 0%, they chose nothing"; the same desk's own device read `spend === 0`
 * and told the pair "Those three zeroes are not missing numbers — they are your
 * decision... You chose to give nothing back". The teacher was sent to a desk
 * to say the opposite of what that desk's screen said, in the lesson's most
 * delicate moment.
 *
 * So there is now exactly ONE predicate, and every surface that distinguishes
 * ABSTENTION from CHOICE reads it: the desk's own ADAPT card, its heading, the
 * WATCH FOR entries (both limbs), the give/take teacher framing, and the claim
 * sweep that audits all of them. `spend === 0` still decides what the ARITHMETIC
 * says; it never again decides what the room is TOLD it chose.
 *
 * `stock` weeks (the league office ran the club before this pair claimed it) are
 * not this desk's non-decisions either, so they cannot rescue a desk from the
 * flag — but a desk whose weeks are ALL stock never had a console to press, and
 * a desk with no settled weeks at all has abstained from nothing yet.
 */
export const neverLockedFor = (club: Club): boolean =>
  club.seatId !== null && club.weeks.length >= 1 && club.weeks.every((w) => w.auto || w.stock);

/** Of a desk's settled weeks, the ones it actually committed itself. */
export const chosenWeeksFor = (club: Club): SettledWeek[] => club.weeks.filter((w) => !w.auto && !w.stock);

/** One desk's whole home season, decomposed. Every field is dollars, and they sum exactly. */
export type HomeDecomposition = {
  slot: number;
  deskNumber: number;
  deskHandle: string;
  club: string;
  building: string;
  marketId: MarketId;
  sizeLabel: string;
  weeksPlayed: number;
  /** What this building and this desk's own prices drew with nobody's name on the marquee. */
  fromBuilding: number;
  /** What this desk's OWN Draw added to its own gate. */
  fromOwnDraw: number;
  /** What the visiting clubs added. */
  fromVisitorDraw: number;
  localMedia: number;
  national: number;
  total: number;
  /** fromBuilding + fromOwnDraw + fromVisitorDraw + localMedia + national - total. Always 0. */
  residual: number;
  /** True when the visiting clubs' block is the biggest of the three door blocks. */
  visitorLed: boolean;
  /** The visiting clubs, in week order, with the dollars each one put on this desk's books. */
  visitors: { week: number; club: string; short: string; draw: number; dollars: number; live: boolean; deskNumber: number | null }[];
};

/** One matchup. `gateLift` is the money the visiting club's Draw put on the host's books. */
export type VisitorLedgerRow = {
  week: number;
  hostSlot: number;
  hostHandle: string;
  hostClub: string;
  visitorSlot: number;
  visitorHandle: string;
  visitorClub: string;
  visitorDraw: number;
  gateLift: number;
  hostTurnout: number;
  hostPrice: number;
  hostSoldOut: boolean;
};

/**
 * What one desk gave the league through its Draw, and what the league gave it.
 *
 * TWO INSTRUMENTS, AND THEY MEASURE DIFFERENT THINGS. `gate-l2-econ` N1
 * (BLOCKING, and the wave's highest-severity finding) established that the
 * `gave`/`received` pair measures the DEAL, not the DECISION: `gave` correlated
 * 0.959 with `startDraw` and only 0.644 with mean reinvest share, so in a room
 * where every desk reinvested nothing the board still printed gave/received
 * spreads of $293,088-$1,523,568 and named a desk that spent $0 as the room's
 * biggest giver. Three surfaces read it as if it measured spending.
 *
 * So the row now carries both, and every surface that asks a question about a
 * DECISION reads the `...ByChoice` fields:
 *
 *   - `gave` / `received` / `net` — the dealt totals. True, and the right
 *     magnitude for "a basketball night is a shared product". Mostly the Draw
 *     you were handed.
 *   - `gaveByChoice` / `receivedByChoice` / `netByChoice` / `ownGain` — the
 *     same dollars recomputed against a strict counterfactual in which THIS
 *     desk (or, for `receivedByChoice`, the desk visiting it) reinvested
 *     nothing all lesson, every other input held at what actually happened.
 *     Zero reinvest anywhere in the room makes every one of these exactly $0,
 *     which is what makes free-riding visible instead of confounded.
 *
 * `ownGain` is the same counterfactual run on the desk's own books: what
 * reinvesting was worth to ITS cash, on ITS schedule. That is the luck control
 * `gate-l2-play`'s free-rider finding asked for — a within-desk comparison on
 * the same calendar, so a kind schedule cannot masquerade as a good decision.
 */
export type GiveAndTakeRow = {
  slot: number;
  deskNumber: number;
  deskHandle: string;
  club: string;
  /** Dollars this club's Draw generated in OTHER buildings. Mostly dealt, not bought. */
  gave: number;
  /** Dollars visiting clubs generated in THIS building. Mostly dealt, not bought. */
  received: number;
  net: number;
  /** Dollars this desk reinvested across the season. */
  spend: number;
  /**
   * W5 B-1. TRUE when this desk never locked a week — an ABSTENTION, not a
   * choice of zero. Read `neverLockedFor`, never `spend === 0`, wherever a
   * surface is about to tell somebody what they decided.
   */
  neverLocked: boolean;
  /** Weeks this desk actually committed itself. Zero on an abstaining desk. */
  chosenWeeks: number;
  /** Of `gave`, the part that exists because THIS desk chose to reinvest. */
  gaveByChoice: number;
  /** Of `received`, the part that exists because the VISITING desks chose to reinvest. */
  receivedByChoice: number;
  netByChoice: number;
  /** What reinvesting was worth to this desk's OWN cash, same schedule, same prices. */
  ownGain: number;
  meanShare: number;
  drawStart: number;
  drawEnd: number;
};

/** Room-level totals of the by-choice instrument. Every figure is $0 in a room that never reinvested. */
export type ChoiceTotals = {
  spend: number;
  gaveByChoice: number;
  receivedByChoice: number;
  /**
   * The SUM OF PER-DESK PRIVATE PARTIALS: for each desk, its own cash against
   * the same desk having reinvested nothing, everything else held. This is a
   * correct per-desk instrument and a misleading room-level one (econ B8/N10):
   * every dollar a desk's spending put in somebody else's building is charged
   * to the payer's external column and never returns to the room's own books,
   * so the sum reverses sign against the joint effect in reachable rooms.
   * Never print it as a room-level effect — print `roomJointGain` for that.
   */
  ownGain: number;
  /**
   * The JOINT effect, exactly computed: this room's cash minus the same room's
   * cash in the counterfactual where every live desk reinvested nothing, at the
   * same prices, the same schedule and the same bot/stock/shock carve-outs.
   * Draw is a private stock — a club's Draw path depends only on its own spend —
   * so the all-zero world's Draw path for each club is exactly its own
   * `baselineDrawPathFor`, and the joint figure needs no re-simulation.
   */
  roomJointGain: number;
  /**
   * The room's own books read at every setting on the dial (econ N17/B11). The
   * joint figure above is a TOTAL against a zero baseline and can never decide
   * a question about LEVEL; this is the level, computed from the same family.
   * Any sentence that tells the room how much SHOULD have gone back in must be
   * built from this and from nothing else.
   */
  roomOptimum: RoomOptimum;
  /** `ownGain + gaveByChoice` — the value reinvesting created, own books plus other people's. */
  created: number;
  /**
   * Of the value reinvesting created, the share that landed elsewhere — or
   * `null` where that ratio is not a coherent percentage (econ B7/N9). It is
   * incoherent whenever `created` is not a whole to take a share OF: `created
   * <= 0` used to print 0% beside $1,577,412 of spillover, and `gaveByChoice >
   * created` used to print above 100% in 58 of 200 random rooms.
   *
   * A null here is not a gap in the evidence and it is NOT a verdict about the
   * room (econ N11). It says only that no percentage is printable. Whether the
   * room over-invested or under-provided is a separate question with a separate
   * answer — the sign of `roomJointGain` — and `spilloverClaim` branches its
   * noun on that and never on this.
   */
  externalPct: number | null;
  anySpend: boolean;
};

export type PipeRow = {
  slot: number;
  deskHandle: string;
  club: string;
  marketId: MarketId;
  sizeLabel: string;
  gate: number;
  inArena: number;
  localMedia: number;
  national: number;
  total: number;
  gatePct: number;
  nationalPct: number;
};

export type SmallMarketPath = {
  found: boolean;
  smallHandle: string;
  smallClub: string;
  smallVisitorClub: string;
  smallVisitorDraw: number;
  smallDoorMoney: number;
  smallPrice: number;
  bigHandle: string;
  bigClub: string;
  bigVisitorClub: string;
  bigVisitorDraw: number;
  bigDoorMoney: number;
  bigPrice: number;
  /** The door-money gap, split by the SAME three blocks the room has been reading all lesson. They sum to the gap exactly. */
  gapFromVisitor: number;
  gapFromBuildingAndPrice: number;
  gapFromOwnDraw: number;
  /**
   * THE PRICE CONTROL (econ B3, unchanged through two rounds). The same two
   * nights re-settled with both clubs at the SAME ticket price — once at the
   * small market's price, once at the big market's — everything else held.
   * Positive means the small market still wins at that common price.
   */
  gapAtSmallPrice: number;
  gapAtBigPrice: number;
  /** True only when the small market's win survives BOTH common prices. */
  survivesPriceControl: boolean;
  /**
   * Which block actually carried the gap. Computed, never asserted — and
   * `price` whenever the win does not survive the price control, because a win
   * that disappears when both clubs charge the same is a price gap wearing a
   * market-size costume.
   */
  driver: "visitor" | "building-and-price" | "own-draw" | "price" | "none";
  line: string;
  claims: readonly ClaimAtom[];
};

export type DrawRow = {
  slot: number;
  handle: string;
  club: string;
  short: string;
  live: boolean;
  deskNumber: number | null;
  draw: number;
  startDraw: number;
  starGone: boolean;
  marketId: MarketId;
  sizeLabel: string;
};

export type HostLeagueAggregate = {
  deskCount: number;
  leagueSize: number;
  weekIndex: number;
  weeksSettled: number;
  lockedCount: number;
  autoWeekCount: number;
  drawTable: DrawRow[];
  homeRevenueDecomposition: HomeDecomposition[];
  visitorLedger: VisitorLedgerRow[];
  giveAndTake: GiveAndTakeRow[];
  /** Room totals of the by-choice instrument (econ B1). All zero in a room that never reinvested. */
  choiceTotals: ChoiceTotals;
  pipes: PipeRow[];
  smallMarketPath: SmallMarketPath;
  /** The room's mean reinvest share, per week — the C7 evidence for "did seeing it change you?". */
  meanShareByWeek: (number | null)[];
  visitorLedCount: number;
  barSummary: string;
};

const money = (n: number): string => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

/* ------------------------------------------------------- claim binding -- */

/**
 * `analyst-wave3` recommendation, and the single defect class behind econ B3,
 * B7, B8, projector R-1 and play N-3: **the room is told things the model does
 * not support**, on the synthesis surfaces where the economics is formalized.
 *
 * Four separate tickets owned by three critics all had the same shape — a
 * sentence built by hand beside a number computed somewhere else, free to drift
 * from it in SIGN ("reinvesting was worth -$1.15M" over a room $546K better
 * off), in QUANTIFIER ("WHO WAS VISITING carried it" where price carried it),
 * or in BOUND (a percentage printing 0% beside $1,577,412, and 119% elsewhere).
 *
 * The fix is structural, not another round of copy edits. A claim string may
 * only be built by a builder that takes the computed value and renders it, so
 * the printed figure IS the computed figure by construction; and every asserted
 * relation the sentence carries — the sign it implies, the quantifier it uses,
 * the bound it presumes — is emitted alongside the text as a machine-checkable
 * `ClaimAtom`. `moduleClaims()` then sweeps every claim-carrying surface in the
 * lesson, and the claim-audit family in the L2 tuning harness recomputes each
 * atom against the reducer and fails on any disagreement.
 *
 * Nothing here is a rendering helper for its own sake: an atom that is never
 * audited is not worth carrying, and a sentence that carries no atom is a
 * sentence the audit cannot see.
 */
export type ClaimSign = "positive" | "negative" | "nonNegative" | "zero" | "any";

export type ClaimAtom = {
  /** Stable id. The audit dispatches its independent recomputation on this. */
  id: string;
  /** The exact substring the surface must contain. Rendered FROM `value`. */
  rendered: string;
  /** The computed number the substring was built from. */
  value: number;
  /** `percent1` is a one-decimal percentage — the shape the pipe shares print in. */
  format: "money" | "percent" | "percent1" | "int";
  /** The sign the surrounding sentence asserts about `value`. */
  assertsSign: ClaimSign;
  /** Hard bounds the value must obey for the sentence to be printable at all. */
  bounds?: { min?: number; max?: number };
  /**
   * A quantifier or causal word the sentence uses, with the predicate it
   * claims. The audit recomputes the predicate independently and fails on
   * disagreement; `word` must be present in the rendered surface.
   */
  quantifier?: { word: string; claims: boolean };
  /**
   * A phrase that must NOT appear anywhere in the rendered surface. This is how
   * a self-contradiction is made falsifiable rather than proof-read: the DOWN
   * branch of reveal 5 may not name the Handed-To-You bar as a candidate cause
   * on a frame that has just told the room nothing on it can be about the bar
   * (`gate-l2-play` N-3, second residual).
   */
  absent?: string;
};

/**
 * A computed finding, in two renderings.
 *
 * `text` is the authoritative one: every clause the economics needs, and the
 * string the claim audit recomputes against. `board` is what the PROJECTOR is
 * allowed to hold — the finding itself, short enough to read from the back row
 * of a classroom in one breath.
 *
 * They exist separately because of a defect this repair is named for. REVEAL
 * stages 2 and 5 accreted a clause per econ finding — each one individually
 * necessary, each one correct — until the projector was holding 190 and 150
 * words of body copy in front of a room of ten-year-olds. That is not a reveal,
 * it is a lecture nobody can read, and it fails `<spectacle_budget>`'s
 * consequence beat and the projector's own legibility rule at once.
 *
 * Nothing is deleted: `board` never says anything `text` does not, every figure
 * it renders is still an atom in `claims`, and the full text goes to `/teach`'s
 * projector mirror where the teacher — who is standing three feet from their
 * own screen — reads it and says it. The wall gets the finding; the teacher
 * gets the reasoning. A surface with no `board` rendering keeps using `text`.
 */
export type Claimed = { text: string; board?: string; claims: readonly ClaimAtom[] };

/** What the projector shows for a finding: its short rendering, or its only one. */
export const onBoard = (c: Claimed): string => c.board ?? c.text;

const renderClaim = (value: number, format: ClaimAtom["format"]): string =>
  format === "money"
    ? money(value)
    : format === "percent"
      ? `${Math.round(value)}%`
      : format === "percent1"
        ? `${Math.round(value * 10) / 10}%`
        : `${Math.round(value)}`;

/**
 * Build a claim atom. The ONLY way a number reaches a claim string: callers
 * interpolate `atom.rendered`, never a separately formatted copy of the value.
 */
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

/** A claim about a WORD rather than a number — the quantifier limb of the audit. */
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

/** One claim-carrying surface: the rendered text plus every relation it asserts. */
export type ClaimSurface = { surface: string; text: string; claims: readonly ClaimAtom[] };

function decompositionFor(state: HostLeagueState, club: Club): HomeDecomposition {
  const def = defOf(club);
  const profile = profileOf(club);
  let fromBuilding = 0;
  let fromOwnDraw = 0;
  let fromVisitorDraw = 0;
  let localMedia = 0;
  let national = 0;
  const visitors: HomeDecomposition["visitors"] = [];
  for (const w of club.weeks) {
    fromBuilding += w.home.bareDollars;
    fromOwnDraw += w.home.ownDollars;
    fromVisitorDraw += w.home.visitorDollars;
    localMedia += w.localMedia;
    national += w.national;
    const v = state.clubs[w.visitorSlot]!;
    visitors.push({
      week: w.week + 1,
      club: CLUBS[w.visitorSlot]!.name,
      short: CLUBS[w.visitorSlot]!.short,
      draw: w.visitorDrawBefore,
      dollars: w.home.visitorDollars,
      live: v.seatId !== null,
      deskNumber: v.deskNumber,
    });
  }
  const total = fromBuilding + fromOwnDraw + fromVisitorDraw + localMedia + national;
  return {
    slot: club.slot,
    deskNumber: club.deskNumber ?? 0,
    deskHandle: deskHandleFor(club),
    club: def.name,
    building: def.building,
    marketId: club.profileId,
    sizeLabel: profile.sizeLabel,
    weeksPlayed: club.weeks.length,
    fromBuilding,
    fromOwnDraw,
    fromVisitorDraw,
    localMedia,
    national,
    total,
    residual: fromBuilding + fromOwnDraw + fromVisitorDraw + localMedia + national - total,
    visitorLed: fromVisitorDraw >= fromBuilding && fromVisitorDraw >= fromOwnDraw,
    visitors,
  };
}

/**
 * The Draw this club would have carried into each of its settled weeks if the
 * DESK had reinvested nothing all lesson.
 *
 * Three deliberate carve-outs, all so the counterfactual stays honest rather
 * than flattering:
 *  - `stock` weeks (a club the league office ran before a desk claimed it) keep
 *    their actual spend: they are not this desk's decisions.
 *  - bot clubs keep their actual spend for the same reason — the instrument
 *    measures what THIS ROOM chose, and a bot chose nothing.
 *  - the star-departure club is pinned to its actual path. The shock is
 *    exogenous, announced before commitment and lands on a league-office club
 *    (R7); pretending a spending path could have avoided it would invent a
 *    decision nobody had.
 *
 * Week 1 is identical under both paths by construction — reinvest buys Draw
 * that arrives NEXT week — so the counterfactual only ever diverges where the
 * model says it should.
 */
export function baselineDrawPathFor(state: HostLeagueState, club: Club): number[] {
  const profile = profileOf(club);
  const out: number[] = [];
  const pinned = state.shockSlot === club.slot;
  let d = club.weeks[0]?.hostDrawBefore ?? club.draw;
  for (const w of club.weeks) {
    if (pinned) d = w.hostDrawBefore;
    out.push(d);
    const counterfactualSpend = club.seatId !== null && !w.stock ? 0 : w.reinvestPaid;
    d = nextDraw(profile, d, counterfactualSpend);
  }
  return out;
}

/**
 * The by-choice ledger for one desk: the same dollars the dealt ledger reports,
 * recomputed with this desk's reinvest set to zero and everything else — the
 * schedule, every price, every other club's Draw — held at what actually
 * happened. Each figure is a clean partial derivative of one decision.
 */
export function choiceLedgerFor(
  state: HostLeagueState,
  club: Club,
  baselines: ReadonlyMap<number, number[]>,
): { spend: number; gaveByChoice: number; receivedByChoice: number; ownGain: number } {
  const profile = profileOf(club);
  const capacity = defOf(club).capacity;
  const mine = baselines.get(club.slot) ?? [];
  let spend = 0;
  let gaveByChoice = 0;
  let receivedByChoice = 0;
  let cashActual = 0;
  let cashBaseline = 0;

  club.weeks.forEach((w, i) => {
    const myBaselineDraw = mine[i] ?? w.hostDrawBefore;
    const isMine = club.seatId !== null && !w.stock;
    spend += isMine ? w.reinvestPaid : 0;

    // GAVE BY CHOICE — my Draw's effect on the building I visited, at my draw
    // vs at my never-reinvested draw. Their price, their Draw, their building.
    const roadHost = state.clubs[w.roadHostSlot];
    const roadWeek = roadHost?.weeks.find((x) => x.week === w.week);
    if (roadHost && roadWeek) {
      const counterfactual = settleHome(
        profileOf(roadHost),
        defOf(roadHost).capacity,
        w.roadHostDrawBefore,
        myBaselineDraw,
        roadWeek.home.price,
      ).visitorDollars;
      gaveByChoice += w.roadDollars - counterfactual;
    }

    // RECEIVED BY CHOICE — the visitor's effect on MY building, at their draw
    // vs at their never-reinvested draw. My price, my Draw, my building.
    const visitor = state.clubs[w.visitorSlot];
    if (visitor) {
      const vPath = baselines.get(visitor.slot) ?? [];
      const vIndex = visitor.weeks.findIndex((x) => x.week === w.week);
      const visitorBaselineDraw = vIndex >= 0 ? (vPath[vIndex] ?? w.visitorDrawBefore) : w.visitorDrawBefore;
      const counterfactual = settleHome(profile, capacity, w.hostDrawBefore, visitorBaselineDraw, w.home.price).visitorDollars;
      receivedByChoice += w.home.visitorDollars - counterfactual;
    }

    // OWN GAIN — my own books, same schedule, same prices, nothing put back.
    cashActual += w.net;
    const homeB = settleHome(profile, capacity, myBaselineDraw, w.visitorDrawBefore, w.home.price);
    const reinvestB = isMine ? 0 : w.reinvestPaid;
    cashBaseline += homeB.doorMoney + localMediaFor(profile, myBaselineDraw) + w.national - w.bill - reinvestB;
  });

  return {
    spend: Math.round(spend),
    gaveByChoice: Math.round(gaveByChoice),
    receivedByChoice: Math.round(receivedByChoice),
    ownGain: Math.round(cashActual - cashBaseline),
  };
}

/**
 * The room's cash against the same room where NOBODY reinvested — the joint
 * effect, not a sum of one-desk-at-a-time partials.
 *
 * `gate-l2-econ` B8/N10 (BLOCKING): the board and the SPILLOVER card told a
 * mixed room that reinvesting cost it $1,153,068 when the room was $546,124
 * better off for having done it. The residue is `receivedByChoice` — the split
 * charges every spillover dollar to the payer's external column and never
 * returns it to the room's own books, so a sum of private partials is
 * systematically pessimistic about the room and reverses sign where the
 * spillover is large relative to private return.
 *
 * This is the joint quantity, computed exactly rather than approximated: for
 * every live desk, every settled week is re-settled with BOTH the host's and
 * the visitor's never-reinvested Draw, at the week's actual price. The
 * carve-outs are `baselineDrawPathFor`'s (stock weeks, bot clubs and the pinned
 * shock club keep their actual spend), so the two instruments answer the same
 * counterfactual question at two different scopes.
 */
export function roomJointGain(state: HostLeagueState, baselines: ReadonlyMap<number, number[]>): number {
  let actual = 0;
  let joint = 0;
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null || club.weeks.length === 0) continue;
    const profile = profileOf(club);
    const capacity = defOf(club).capacity;
    const mine = baselines.get(club.slot) ?? [];
    club.weeks.forEach((w, i) => {
      actual += w.net;
      const myBaselineDraw = mine[i] ?? w.hostDrawBefore;
      const visitor = state.clubs[w.visitorSlot];
      let visitorBaselineDraw = w.visitorDrawBefore;
      if (visitor) {
        const vPath = baselines.get(visitor.slot) ?? [];
        const vIndex = visitor.weeks.findIndex((x) => x.week === w.week);
        if (vIndex >= 0) visitorBaselineDraw = vPath[vIndex] ?? w.visitorDrawBefore;
      }
      const homeB = settleHome(profile, capacity, myBaselineDraw, visitorBaselineDraw, w.home.price);
      const reinvestB = club.seatId !== null && !w.stock ? 0 : w.reinvestPaid;
      joint += homeB.doorMoney + localMediaFor(profile, myBaselineDraw) + w.national - w.bill - reinvestB;
    });
  }
  return Math.round(actual - joint);
}

/**
 * How wide the room's "sweet spot" is allowed to be, as a fraction of the FULL
 * SPREAD of its own room-cash-by-share curve.
 *
 * This is a rendering tolerance, not a game constant: it decides only how many
 * neighbouring dial settings are close enough to the room's best to be named
 * beside it, and it is scale-free so it means the same thing in an 8-desk $30
 * room and a 12-desk $110 one. Nothing in the reducer, the grids or the
 * settlement reads it.
 */
export const OPTIMUM_BAND_TOLERANCE = 0.05;

/**
 * THE ROOM'S OWN BOOKS UNDER A COUNTERFACTUAL SET OF DIALS (econ N17 / B11).
 *
 * `roomJointGain` answers ONE counterfactual — "what if nobody had put anything
 * back" — and answers it as a total against a zero baseline. It cannot decide a
 * question about LEVEL. This is the same season re-run at a different set of
 * dials: identical schedule, identical prices, identical shock, with each live
 * desk's reinvest dial replaced by `shareFor(club, week)`.
 *
 * Two deliberate differences from `baselineDrawPathFor`'s carve-outs, both
 * because this instrument compares NON-ZERO worlds and that one does not:
 *  - a league-office club (and a `stock` week a desk had not claimed yet) keeps
 *    its recorded reinvest SHARE, not its recorded dollars. Its share is a
 *    published policy (`botShareFor`) and its door money moves with the visiting
 *    desk's counterfactual Draw, so holding the share is what the reducer would
 *    actually have done; holding the dollars is only correct at the all-zero
 *    point, where nothing about the room moved the bots' doors much. This makes
 *    `roomCashAtShares` agree with a full REPLAY of the season through the
 *    reducer, which is the computation the econ critic's contradiction test
 *    used and the one the audit re-runs.
 *  - the star-departure club stays pinned to its actual Draw path: the shock is
 *    exogenous and announced before commitment (R7).
 * Only live desks' cash is counted, exactly as `roomJointGain` counts it.
 *
 * It cannot reuse `baselineDrawPathFor` because above 0% the counterfactual is
 * COUPLED: what a desk spends is a share of a door that depends on the visiting
 * desk's counterfactual Draw. So the whole league is marched forward one week at
 * a time, every home night settled before any Draw is written back — the same
 * ordering `settleWeek` uses, so no club's counterfactual can depend on the
 * order the loop happened to visit it. `shareFor` returning each week's own
 * `share` reproduces the room's ACTUAL cash exactly (a test asserts it).
 */
export function roomCashAtShares(state: HostLeagueState, shareFor: (club: Club, week: SettledWeek) => number): number {
  const inLeague = state.clubs.slice(0, state.leagueSize);
  const weekCount = inLeague.reduce((n, c) => Math.max(n, c.weeks.length), 0);
  const draw = new Map<number, number>();
  for (const c of inLeague) draw.set(c.slot, c.weeks[0]?.hostDrawBefore ?? c.draw);

  let cash = 0;
  for (let i = 0; i < weekCount; i += 1) {
    const homes = new Map<number, HomeSettlement>();
    for (const c of inLeague) {
      const w = c.weeks[i];
      if (!w) continue;
      const visitorDraw = draw.get(w.visitorSlot) ?? w.visitorDrawBefore;
      homes.set(c.slot, settleHome(profileOf(c), defOf(c).capacity, draw.get(c.slot)!, visitorDraw, w.home.price));
    }
    const after = new Map<number, number>();
    for (const c of inLeague) {
      const w = c.weeks[i];
      if (!w) continue;
      const profile = profileOf(c);
      const before = draw.get(c.slot)!;
      const home = homes.get(c.slot)!;
      const isMine = c.seatId !== null && !w.stock;
      const share = isMine ? shareFor(c, w) : w.share;
      const spend = Math.round((share / 100) * home.doorMoney);
      if (c.seatId !== null) cash += home.doorMoney + localMediaFor(profile, before) + w.national - w.bill - spend;
      after.set(c.slot, state.shockSlot === c.slot ? (c.weeks[i + 1]?.hostDrawBefore ?? c.draw) : nextDraw(profile, before, spend));
    }
    for (const [slot, d] of after) draw.set(slot, d);
  }
  return Math.round(cash);
}

/** The room's books with every live desk's dial pinned to the same `share`. */
export const roomCashAtUniformShare = (state: HostLeagueState, share: number): number => roomCashAtShares(state, () => share);

/**
 * The room's books with every live desk's dial moved `delta` points from where
 * that desk ACTUALLY set it, week by week, clamped to the dial.
 *
 * This — not a uniform flattening — is the quantity a direction word is about.
 * It is exactly the measurement econ N17 used to falsify the old clause ("every
 * desk +5pp -> the room is jointly WORSE off in 68 of 86"), and no surface may
 * name a direction that this disagrees with.
 */
export const roomCashAtShiftedShares = (state: HostLeagueState, delta: number): number =>
  roomCashAtShares(state, (_c, w) => clamp(w.share + delta, SHARE_MIN, SHARE_MAX));

/**
 * The room's own answer to "how much SHOULD have gone back in" — computed, not
 * asserted, and computed from the room's own books rather than from the sign of
 * anything.
 *
 * `relation` is the only thing any surface is allowed to turn a direction word
 * on, and it is deliberately conservative in two ways (econ N17 / FL-L):
 *  - a direction is named only where the room's actual level sits OUTSIDE the
 *    band, and
 *  - only where a one-step move in that direction actually raises the room's
 *    cash. The critic's blocking finding was a card that told 68 of 86 rooms to
 *    put MORE back in while a uniform +5pp step made those rooms jointly WORSE
 *    off; that sentence is now unreachable, because `"below"` cannot be
 *    returned unless the +5pp step measurably pays.
 * Where the two disagree the relation is `"unclear"` and no direction may print.
 */
export type RoomOptimum = {
  /** Room cash at every setting on the dial's own grid, in `SHARE_GRID` order. */
  byShare: readonly number[];
  /** The grid share the room's own books do best at (lowest share on a tie). */
  bestShare: number;
  /** The band around `bestShare` within `OPTIMUM_BAND_TOLERANCE` of the spread. */
  bandLo: number;
  bandHi: number;
  /** The room's actual mean chosen share, over live desks' non-stock weeks. */
  actualShare: number;
  /** Room cash at the dials the room actually set, and one step either side of them. */
  cashAtActual: number;
  cashOneStepUp: number;
  cashOneStepDown: number;
  /**
   * Where the room's level sits against its own band, and whether the room's
   * own one-step gradient agrees. `underButFlat` / `overButFlat` are the arms
   * where they DISAGREE — the level is outside the band, but this room's actual
   * mix of dials does not gain from a step toward it — and no surface may print
   * a prescription on those.
   */
  relation: "below" | "inside" | "above" | "underButFlat" | "overButFlat";
};

export function roomOptimumFor(state: HostLeagueState): RoomOptimum {
  const byShare = SHARE_GRID.map((s) => roomCashAtUniformShare(state, s));
  let bestIdx = 0;
  for (let i = 1; i < byShare.length; i += 1) if (byShare[i]! > byShare[bestIdx]!) bestIdx = i;
  const max = byShare[bestIdx]!;
  const min = byShare.reduce((m, v) => Math.min(m, v), max);
  const floor = max - (max - min) * OPTIMUM_BAND_TOLERANCE;
  let lo = bestIdx;
  let hi = bestIdx;
  while (lo > 0 && byShare[lo - 1]! >= floor) lo -= 1;
  while (hi < byShare.length - 1 && byShare[hi + 1]! >= floor) hi += 1;

  let chosenWeeks = 0;
  let chosenShare = 0;
  for (const c of state.clubs.slice(0, state.leagueSize)) {
    if (c.seatId === null) continue;
    for (const w of c.weeks) {
      if (w.stock) continue;
      chosenShare += w.share;
      chosenWeeks += 1;
    }
  }
  const actualShare = chosenWeeks === 0 ? 0 : Math.round(chosenShare / chosenWeeks);
  // The GRADIENT, measured where the room actually is rather than at a uniform
  // flattening of it: every desk one dial step up, and every desk one dial step
  // down, from that desk's own settings. This is econ N17's own measurement.
  const cashAtActual = roomCashAtShiftedShares(state, 0);
  const cashOneStepUp = roomCashAtShiftedShares(state, SHARE_STEP);
  const cashOneStepDown = roomCashAtShiftedShares(state, -SHARE_STEP);
  const bandLo = SHARE_GRID[lo]!;
  const bandHi = SHARE_GRID[hi]!;
  // A direction word needs BOTH: the room's level outside the band the room's
  // own curve names, AND a one-step move that way that measurably pays. Either
  // alone is what FL-L was.
  const relation: RoomOptimum["relation"] =
    actualShare < bandLo
      ? cashOneStepUp > cashAtActual
        ? "below"
        : "underButFlat"
      : actualShare > bandHi
        ? cashOneStepDown > cashAtActual
          ? "above"
          : "overButFlat"
        : "inside";

  return { byShare, bestShare: SHARE_GRID[bestIdx]!, bandLo, bandHi, actualShare, cashAtActual, cashOneStepUp, cashOneStepDown, relation };
}

export function computeAggregate(state: HostLeagueState): HostLeagueAggregate {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const inLeague = state.clubs.slice(0, state.leagueSize);

  const drawTable: DrawRow[] = inLeague.map((c) => ({
    slot: c.slot,
    handle: clubHandleFor(c),
    club: CLUBS[c.slot]!.name,
    short: CLUBS[c.slot]!.short,
    live: c.seatId !== null,
    deskNumber: c.deskNumber,
    draw: c.draw,
    startDraw: CLUBS[c.slot]!.startDraw,
    starGone: c.starGone,
    marketId: c.profileId,
    sizeLabel: PROFILE_BY_ID.get(c.profileId)!.sizeLabel,
  }));

  const decomposition = live
    .filter((c) => c.weeks.length > 0)
    .map((c) => decompositionFor(state, c))
    .sort((a, b) => a.deskNumber - b.deskNumber);

  const visitorLedger: VisitorLedgerRow[] = [];
  for (const club of inLeague) {
    for (const w of club.weeks) {
      const visitor = state.clubs[w.visitorSlot]!;
      if (club.seatId === null && visitor.seatId === null) continue; // bot-vs-bot is not the room's evidence
      visitorLedger.push({
        week: w.week + 1,
        hostSlot: club.slot,
        hostHandle: clubHandleFor(club),
        hostClub: CLUBS[club.slot]!.short,
        visitorSlot: w.visitorSlot,
        visitorHandle: clubHandleFor(visitor),
        visitorClub: CLUBS[w.visitorSlot]!.short,
        visitorDraw: w.visitorDrawBefore,
        gateLift: w.home.visitorDollars,
        hostTurnout: w.home.turnout,
        hostPrice: w.home.price,
        hostSoldOut: w.home.soldOut,
      });
    }
  }
  visitorLedger.sort((a, b) => a.week - b.week || a.hostSlot - b.hostSlot);

  // One baseline path per club in the league — the visitor-side term needs the
  // OTHER desk's counterfactual, so they are all built before any row is.
  const baselines = new Map<number, number[]>();
  for (const c of inLeague) baselines.set(c.slot, baselineDrawPathFor(state, c));

  const giveAndTake: GiveAndTakeRow[] = live
    .filter((c) => c.weeks.length > 0)
    .map((c) => {
      const gave = c.weeks.reduce((sum, w) => sum + w.roadDollars, 0);
      const received = c.weeks.reduce((sum, w) => sum + w.home.visitorDollars, 0);
      const shares = c.weeks.map((w) => w.share);
      const choice = choiceLedgerFor(state, c, baselines);
      return {
        slot: c.slot,
        deskNumber: c.deskNumber ?? 0,
        deskHandle: deskHandleFor(c),
        club: CLUBS[c.slot]!.short,
        gave,
        received,
        net: received - gave,
        spend: choice.spend,
        neverLocked: neverLockedFor(c),
        chosenWeeks: chosenWeeksFor(c).length,
        gaveByChoice: choice.gaveByChoice,
        receivedByChoice: choice.receivedByChoice,
        netByChoice: choice.receivedByChoice - choice.gaveByChoice,
        ownGain: choice.ownGain,
        meanShare: shares.length === 0 ? 0 : Math.round(shares.reduce((a, b) => a + b, 0) / shares.length),
        drawStart: c.weeks[0]!.hostDrawBefore,
        drawEnd: c.draw,
      };
    })
    .sort((a, b) => a.deskNumber - b.deskNumber);

  const choiceTotals: ChoiceTotals = (() => {
    const spend = giveAndTake.reduce((s, r) => s + r.spend, 0);
    const gaveByChoice = giveAndTake.reduce((s, r) => s + r.gaveByChoice, 0);
    const receivedByChoice = giveAndTake.reduce((s, r) => s + r.receivedByChoice, 0);
    const ownGain = giveAndTake.reduce((s, r) => s + r.ownGain, 0);
    const created = ownGain + gaveByChoice;
    // econ B7/N9: the ratio is a coherent percentage only when the value
    // created is positive AND the external part is no larger than the whole.
    // Everywhere else the room over-invested, and the honest sentence is the
    // one that states both dollar figures rather than a number between 0 and
    // 100 that is not the share of anything.
    const coherent = created > 0 && gaveByChoice >= 0 && gaveByChoice <= created;
    return {
      spend,
      gaveByChoice,
      receivedByChoice,
      ownGain,
      roomJointGain: roomJointGain(state, baselines),
      roomOptimum: roomOptimumFor(state),
      created,
      externalPct: coherent ? Math.round((gaveByChoice / created) * 100) : null,
      anySpend: spend > 0,
    };
  })();

  const pipes: PipeRow[] = live
    .filter((c) => c.weeks.length > 0)
    .map((c) => {
      const gate = c.weeks.reduce((s, w) => s + w.home.gate, 0);
      const inArena = c.weeks.reduce((s, w) => s + w.home.inArena, 0);
      const localMedia = c.weeks.reduce((s, w) => s + w.localMedia, 0);
      const national = c.weeks.reduce((s, w) => s + w.national, 0);
      const total = gate + inArena + localMedia + national;
      return {
        slot: c.slot,
        deskHandle: deskHandleFor(c),
        club: CLUBS[c.slot]!.short,
        marketId: c.profileId,
        sizeLabel: PROFILE_BY_ID.get(c.profileId)!.sizeLabel,
        gate,
        inArena,
        localMedia,
        national,
        total,
        gatePct: total > 0 ? Math.round((gate / total) * 1000) / 10 : 0,
        nationalPct: total > 0 ? Math.round((national / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => a.slot - b.slot);

  const meanShareByWeek: (number | null)[] = [];
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const shares = live.map((c) => c.weeks.find((x) => x.week === w)).filter((x): x is SettledWeek => x !== undefined && !x.stock).map((x) => x.share);
    meanShareByWeek.push(shares.length === 0 ? null : Math.round((shares.reduce((a, b) => a + b, 0) / shares.length) * 10) / 10);
  }

  const visitorLedCount = decomposition.filter((d) => d.visitorLed).length;

  return {
    deskCount: live.length,
    leagueSize: state.leagueSize,
    weekIndex: state.weekIndex,
    weeksSettled: Math.min(state.weekIndex, WEEK_COUNT),
    lockedCount: live.filter((c) => c.locked).length,
    autoWeekCount: live.reduce((s, c) => s + c.weeks.filter((w) => w.auto).length, 0),
    drawTable,
    homeRevenueDecomposition: decomposition,
    visitorLedger,
    giveAndTake,
    choiceTotals,
    pipes,
    smallMarketPath: smallMarketPathFrom(state),
    meanShareByWeek,
    visitorLedCount,
    barSummary: barSummaryFrom(decomposition, visitorLedCount),
  };
}

/**
 * C4's required demonstration, read off the room's own weeks rather than
 * asserted: a SMALL-market desk hosting a strong visitor out-earning a
 * BIG-market desk hosting a weak one. If the room's schedule never produced the
 * pair, the board says exactly that instead of inventing one.
 *
 * `gate-l2-econ` B3 / FL-A and `gate-l2-play` R4 (both BLOCKING). This selector
 * used to maximise the door-money gap subject only to
 * `smallVisitorDraw > bigVisitorDraw` and then print "and it won it on WHO WAS
 * VISITING" over the result. In a reachable room (odd desks $110, even desks
 * $30) it printed that sentence over an $80 price gap: Philadelphia priced $110
 * and drew 152 people. The board asserted a cause the decomposition the class
 * had just learned directly refutes, and a synthesis card repeated it verbatim.
 *
 * Round 2 split the gap by the same three blocks the room has been reading all
 * lesson and computed the driver instead of asserting it. The econ gate refuted
 * that repair (B3, NOT DISCHARGED, second round): splitting the gap does not
 * control for price, because price moves all three blocks. Measured over 40
 * rooms, `driver` came back `"visitor"` in **40 of 40** — the selector searched
 * every small x big x week pair and *preferred* a visitor-driven one, which is
 * selection on the conclusion across a candidate set large enough that a
 * confirming pair is essentially always available — while **7 of 40** printed
 * pairs failed a price control outright (worst: a "win" of $195,668 that is a
 * loss of $212,172 at $60 and $169,932 at $100, i.e. the entire win was the
 * price gap), and **23 of 40** printed a visitor block LARGER THAN THE WHOLE
 * GAP it was explaining (worst 220%), with the other two blocks computed and
 * never rendered.
 *
 * Round 3, this one:
 *
 *  1. **The price control is a selection filter, not a footnote.** Every
 *     candidate pair is re-settled with both clubs at the SAME ticket price —
 *     once at each side's own price, everything else held — and a pair may only
 *     carry a market-size causal claim if the small market still wins at BOTH.
 *  2. **A pair that fails the control is not discarded, it is told truthfully.**
 *     `driver` becomes `"price"` and the sentence says the win is the price gap
 *     and shows the room the two controlled figures.
 *  3. **All three block figures always print**, beside both door figures. A
 *     block larger than the gap it explains can therefore never print alone,
 *     and the room can always reconcile the arithmetic it is shown.
 */
export function smallMarketPathFrom(state: HostLeagueState): SmallMarketPath {
  const empty: SmallMarketPath = {
    found: false,
    smallHandle: "",
    smallClub: "",
    smallVisitorClub: "",
    smallVisitorDraw: 0,
    smallDoorMoney: 0,
    smallPrice: 0,
    bigHandle: "",
    bigClub: "",
    bigVisitorClub: "",
    bigVisitorDraw: 0,
    bigDoorMoney: 0,
    bigPrice: 0,
    gapFromVisitor: 0,
    gapFromBuildingAndPrice: 0,
    gapFromOwnDraw: 0,
    gapAtSmallPrice: 0,
    gapAtBigPrice: 0,
    survivesPriceControl: false,
    driver: "none",
    line: "This room's schedule did not put a small-market desk in front of a big visitor on the same week a big-market desk hosted a weak one, so there is no honest matchup here to compare. Look at the bars instead: the visitor block is the one that moves.",
    claims: [],
  };
  type Cand = { club: Club; w: SettledWeek };
  const smalls: Cand[] = [];
  const bigs: Cand[] = [];
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null) continue;
    const big = club.profileId === "new-york" || club.profileId === "golden-state";
    for (const w of club.weeks) {
      if (w.stock) continue;
      (big ? bigs : smalls).push({ club, w });
    }
  }
  if (smalls.length === 0 || bigs.length === 0) return empty;

  // The gap, split by the same three blocks the room has been reading all
  // lesson. They sum to the door-money gap exactly, because each side's three
  // blocks sum to its own door money exactly (BC-5, residual 0).
  const splitGap = (s: Cand, b: Cand) => ({
    visitor: s.w.home.visitorDollars - b.w.home.visitorDollars,
    bare: s.w.home.bareDollars - b.w.home.bareDollars,
    own: s.w.home.ownDollars - b.w.home.ownDollars,
  });

  /** The same night at a different ticket price. Everything else held. */
  const doorAtPrice = (c: Cand, price: number): number =>
    settleHome(profileOf(c.club), defOf(c.club).capacity, c.w.hostDrawBefore, c.w.visitorDrawBefore, price).doorMoney;

  type Best = {
    small: Cand;
    big: Cand;
    gap: number;
    parts: ReturnType<typeof splitGap>;
    visitorDriven: boolean;
    atSmall: number;
    atBig: number;
    survives: boolean;
  };
  let bestControlledVisitor: Best | null = null;
  let bestControlled: Best | null = null;
  let bestAny: Best | null = null;
  for (const s of smalls) {
    for (const b of bigs) {
      if (s.w.visitorDrawBefore <= b.w.visitorDrawBefore) continue;
      const gap = s.w.home.doorMoney - b.w.home.doorMoney;
      if (gap <= 0) continue;
      const parts = splitGap(s, b);
      const atSmall = doorAtPrice(s, s.w.home.price) - doorAtPrice(b, s.w.home.price);
      const atBig = doorAtPrice(s, b.w.home.price) - doorAtPrice(b, b.w.home.price);
      const survives = atSmall > 0 && atBig > 0;
      // A block bigger than the gap it explains cannot be that gap's cause.
      const visitorDriven = parts.visitor > 0 && parts.visitor >= parts.bare && parts.visitor >= parts.own && parts.visitor <= gap;
      const cand: Best = { small: s, big: b, gap, parts, visitorDriven, atSmall, atBig, survives };
      if (!bestAny || gap > bestAny.gap) bestAny = cand;
      if (survives && (!bestControlled || gap > bestControlled.gap)) bestControlled = cand;
      if (survives && visitorDriven && (!bestControlledVisitor || gap > bestControlledVisitor.gap)) bestControlledVisitor = cand;
    }
  }
  const best = bestControlledVisitor ?? bestControlled ?? bestAny;
  if (!best) return empty;
  const s = best.small;
  const b = best.big;
  const parts = best.parts;
  // The driver is what survives the control. A win that vanishes when both
  // clubs charge the same price was carried by PRICE, whatever the blocks say.
  const driver: SmallMarketPath["driver"] = !best.survives
    ? "price"
    : parts.visitor >= parts.bare && parts.visitor >= parts.own && parts.visitor <= best.gap
      ? "visitor"
      : parts.bare >= parts.own
        ? "building-and-price"
        : "own-draw";

  const smallPrice = s.w.home.price;
  const bigPrice = b.w.home.price;
  const claims: ClaimAtom[] = [];
  const gapClaim = claim("market.gap", best.gap, "money", { assertsSign: "positive" });
  const visitorBlock = claim("market.gapFromVisitor", parts.visitor, "money");
  const bareBlock = claim("market.gapFromBuildingAndPrice", parts.bare, "money");
  const ownBlock = claim("market.gapFromOwnDraw", parts.own, "money");
  const atSmall = claim("market.gapAtSmallPrice", best.atSmall, "money");
  const atBig = claim("market.gapAtBigPrice", best.atBig, "money");
  claims.push(gapClaim, visitorBlock, bareBlock, ownBlock, atSmall, atBig);

  const setup = `${deskHandleFor(s.club)} runs one of the league's smallest markets. Hosting ${CLUBS[s.w.visitorSlot]!.short} at Draw ${s.w.visitorDrawBefore}, priced at $${smallPrice}, that building took ${money(s.w.home.doorMoney)} through the door. ${deskHandleFor(b.club)} runs one of the biggest. Hosting ${CLUBS[b.w.visitorSlot]!.short} at Draw ${b.w.visitorDrawBefore}, priced at $${bigPrice}, it took ${money(b.w.home.doorMoney)}.`;

  // The whole split, every time. No single block ever prints alone.
  const blocks = `The gap is ${gapClaim.rendered}, and here is all of it: ${visitorBlock.rendered} the visiting club, ${bareBlock.rendered} the building and the price, ${ownBlock.rendered} that desk's own Draw. Those three are the gap, exactly.`;

  // The control, printed either way, so the room can check the claim.
  const control = best.survives
    ? `Hold the price still and it still holds: at $${smallPrice} both ways the small market is ${atSmall.rendered} ahead, at $${bigPrice} both ways ${atBig.rendered} ahead.`
    : `Now hold the price still. At $${smallPrice} both ways the gap is ${atSmall.rendered}; at $${bigPrice} both ways it is ${atBig.rendered}. The win does not survive charging the same price.`;

  let attribution: string;
  if (driver === "price") {
    const word = "THE PRICE GAP carried it";
    claims.push(claimWord("market.driverPrice", word, true));
    attribution = `${word}, not the market: these two desks charged $${smallPrice} and $${bigPrice} for the same product.`;
  } else if (driver === "visitor") {
    const word = "WHO WAS VISITING carried it";
    claims.push(claimWord("market.driverVisitor", word, true));
    attribution = `The biggest block is the visiting club, and the win survives the price control, so ${word}.`;
  } else if (driver === "building-and-price") {
    const word = "BUILDING AND PRICE carried it";
    claims.push(claimWord("market.driverBuilding", word, true));
    attribution = `The biggest block is not the visitor — ${word}${smallPrice === bigPrice ? "" : `, at $${smallPrice} against $${bigPrice}`}. Do not credit the visiting club for this one.`;
  } else {
    const word = "THAT DESK'S OWN DRAW carried it";
    claims.push(claimWord("market.driverOwn", word, true));
    attribution = `The biggest block is not the visitor and not the building: ${word}. That desk built this, over three weeks, with its reinvest dial.`;
  }

  return {
    found: true,
    smallHandle: deskHandleFor(s.club),
    smallClub: CLUBS[s.club.slot]!.short,
    smallVisitorClub: CLUBS[s.w.visitorSlot]!.short,
    smallVisitorDraw: s.w.visitorDrawBefore,
    smallDoorMoney: s.w.home.doorMoney,
    smallPrice,
    bigHandle: deskHandleFor(b.club),
    bigClub: CLUBS[b.club.slot]!.short,
    bigVisitorClub: CLUBS[b.w.visitorSlot]!.short,
    bigVisitorDraw: b.w.visitorDrawBefore,
    bigDoorMoney: b.w.home.doorMoney,
    bigPrice,
    gapFromVisitor: Math.round(parts.visitor),
    gapFromBuildingAndPrice: Math.round(parts.bare),
    gapFromOwnDraw: Math.round(parts.own),
    gapAtSmallPrice: Math.round(best.atSmall),
    gapAtBigPrice: Math.round(best.atBig),
    survivesPriceControl: best.survives,
    driver,
    line: `${setup} ${blocks} ${control} ${attribution}`,
    claims,
  };
}

/**
 * The caption under REVEAL stage 2, computed.
 *
 * `gate-l2-econ` N1 / B2 (BLOCKING). The gave/got bars used to be the dealt
 * totals, which correlate 0.959 with `startDraw` and 0.644 with mean reinvest
 * share — so the beat that exists to make free-riding arguable reproduced its
 * whole pattern in a room where nobody reinvested at all. The bars are now the
 * by-choice figures, which are exactly $0 for every desk in that room, and this
 * caption says so out loud rather than leaving a blank frame.
 */
/**
 * THE ONE PLACE the room's reinvest arithmetic is turned into a sentence.
 *
 * `gate-l2-econ` B7 (N9) and B8 (N10), both BLOCKING, and the analyst's
 * "printed claim vs recomputed model" defect class. The same three figures were
 * being narrated by three hand-written sentences on three surfaces — the
 * SPILLOVER synthesis card, the reveal-2 caption and the ADAPT Q3 answer key —
 * and all three inherited the same two falsehoods:
 *
 *  - a percentage that printed **0% beside $1,577,412** of measured spillover
 *    (the `created <= 0` branch, which fires in the three most likely teacher
 *    set-piece rooms including the one-spender-versus-eleven-free-riders room)
 *    and **above 100% in 58 of 200** random rooms;
 *  - "reinvesting was worth -$1,153,068 to these desks' own books" printed as
 *    if it were the room's joint result, in a room that was **$546,124 better
 *    off** for having reinvested.
 *
 * Both are fixed by saying what each number actually is. The private column is
 * labelled as a sum of one-desk-at-a-time partials; the joint figure is printed
 * beside it with its own sign; and the percentage prints only where it is a
 * coherent share of something, with the over-investment case getting its own
 * honest sentence instead of a number between 0 and 100 that means nothing.
 *
 * Every figure comes back as a `ClaimAtom` so the audit can recompute it.
 */
export function spilloverClaim(ct: ChoiceTotals): Claimed {
  if (!ct.anySpend) {
    const word = "Nobody in this room put a single dollar back";
    return {
      text: `${word} into their club, so nobody here gave anything they CHOSE to give.`,
      board: `${word}.`,
      claims: [claimWord("spillover.nobodySpent", word, !ct.anySpend)],
    };
  }

  const claims: ClaimAtom[] = [];
  const own = claim("spillover.ownGain", ct.ownGain, "money", { assertsSign: ct.ownGain > 0 ? "positive" : ct.ownGain < 0 ? "negative" : "zero" });
  const gave = claim("spillover.gaveByChoice", ct.gaveByChoice, "money", { assertsSign: "nonNegative" });
  // The joint figure prints as a magnitude plus a direction word, because
  // "left this room -$399,172 better off" is not a sentence. The magnitude is
  // bound-checked; the DIRECTION is the quantifier the audit recomputes against
  // `sign(roomJointGain)` — that pairing is exactly econ B8's discharge
  // condition ("the printed total does not disagree in SIGN with
  // cash(actual) - cash(nobody-spends) at the same prices").
  const joint = claim("spillover.roomJointMagnitude", Math.abs(ct.roomJointGain), "money", { assertsSign: "nonNegative", bounds: { min: 0 } });
  claims.push(own, gave, joint);

  // The private column, always labelled as what it is: a sum of partials.
  const privateLine =
    ct.ownGain >= 0
      ? `Desk by desk, adding up what reinvesting was worth to each desk's OWN cash: ${own.rendered}.`
      : `Desk by desk, adding up what reinvesting was worth to each desk's OWN cash: ${own.rendered} — these desks spent more on Draw than their own books got back.`;

  // The external column, and the percentage ONLY where it is a coherent share.
  let externalLine: string;
  if (ct.externalPct !== null) {
    const pct = claim("spillover.externalPct", ct.externalPct, "percent", { bounds: { min: 0, max: 100 } });
    claims.push(pct, claimWord("spillover.pctPrinted", "of the value it created landed somewhere", true));
    externalLine = `That same spending put ${gave.rendered} on OTHER clubs' books — ${pct.rendered} of the value it created landed somewhere the desk that paid for it never sees.`;
  } else {
    const spend = claim("spillover.spend", ct.spend, "money", { assertsSign: "positive" });
    claims.push(spend);
    // econ N11 / B9 (BLOCKING). Withholding the PERCENTAGE is a question about
    // the denominator: `created = ownGain + gaveByChoice` is not a coherent
    // whole here, so no share can be printed. Naming the SITUATION is a
    // different question entirely, and it has exactly one honest answer: the
    // sign of `roomJointGain`, the room counted as one set of books.
    //
    // The shipped card branched the noun off `created` instead, which is the
    // aggregate this file's own `ChoiceTotals` docstring forbids using at room
    // level. It printed "over-investment" in 173 of 177 plausible-price rooms
    // that were in fact jointly BETTER off — up to $2.4M better off — three
    // clauses before the joint line said so. Privately unprofitable and
    // socially profitable is not over-investment; it is under-provision under a
    // positive externality, which is the concept this module is named for and
    // the premise L3 rests on. A room told it over-invested has been told to
    // spend less, which is the inverted lesson.
    //
    // So: the noun is branched on `roomJointGain` and NOTHING else, and the
    // branch word itself is an atom carrying the opposite noun as a forbidden
    // phrase, so the audit checks the word and not merely the numbers beside it.
    if (ct.roomJointGain > 0) {
      // econ N17 / FL-L (BLOCKING). This arm used to end "…so LESS WENT BACK IN
      // THAN THIS ROOM'S OWN NUMBERS WOULD JUSTIFY" — a claim about the LEVEL of
      // reinvestment, decided by the SIGN of a total. The arm fires only at
      // shares >= 25%, and the room's own books peak at 10-15%, so the sentence
      // printed in exactly the region where it is false: a uniform +5pp step
      // made the room jointly WORSE off in 68 of 86 measured rooms. The noun
      // this branch is entitled to is the one the joint figure actually decides
      // — better off or worse off, counted as one set of books. The level is a
      // separate sentence, built from `roomOptimum` (see `levelLine`).
      const word = "the room as a whole still came out ahead";
      claims.push(claimWord("spillover.branchNoun", word, true, "over-invest"));
      externalLine = `This room spent ${spend.rendered} on Draw and put ${gave.rendered} of it on OTHER clubs' books. Desk by desk that spending reads as a loss, because the desk that pays for Draw keeps only part of what the Draw earns — but ${word}. There is no share to print here: you cannot take a percentage of a number that went the wrong way for the desks who paid.`;
    } else if (ct.roomJointGain < 0) {
      const word = "this room over-invested";
      claims.push(claimWord("spillover.branchNoun", word, true, "less went back in than"));
      externalLine = `This room spent ${spend.rendered} on Draw and put ${gave.rendered} of it on OTHER clubs' books, and counted as one set of books ${word} — the spending cost the room more than it made anywhere. That is over-investment AND spillover at the same time, and both of them are real. There is no share to print here: you cannot take a percentage of a number that went the wrong way.`;
    } else {
      const word = "the room came out exactly level";
      claims.push(claimWord("spillover.branchNoun", word, true, "over-invest"));
      externalLine = `This room spent ${spend.rendered} on Draw and put ${gave.rendered} of it on OTHER clubs' books, and counted as one set of books ${word} — every dollar the desks lost privately turned up in somebody else's building in this room. There is no share to print here: you cannot take a percentage of a number that went the wrong way for the desks who paid.`;
    }
  }

  // THE LEVEL COLUMN (econ N17 / B11). The one place any surface is allowed to
  // say anything about how much SHOULD have gone back in — and it says it by
  // printing the room's OWN computed range rather than a direction word.
  //
  // `roomOptimum` runs this room's identical season at every setting on the
  // dial, through the same computation family `roomJointGain` uses, and reports
  // the band its own books do best in. The range prints always; a direction
  // prints only where the room's level is outside that band AND a one-step move
  // that way measurably pays. Where those disagree, `relation` is `"unclear"`
  // and this sentence names no direction at all.
  const opt = ct.roomOptimum;
  const bandLo = claim("spillover.bandLo", opt.bandLo, "percent", { bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  const bandHi = claim("spillover.bandHi", opt.bandHi, "percent", { bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  const level = claim("spillover.actualShare", opt.actualShare, "percent", { bounds: { min: SHARE_MIN, max: SHARE_MAX } });
  // Every one of these five words is true BY CONSTRUCTION of the branch above,
  // and only two of them carry a prescription. The two `Flat` arms are the rooms
  // where the band and this room's own gradient disagree; they say so, in the
  // room's own terms, and they prescribe nothing.
  const relationWord =
    opt.relation === "below"
      ? "under that band, so putting more back in would have left this room holding more money, not less"
      : opt.relation === "above"
        ? "over that band, so the dollars past it cost this room more than they brought back"
        : opt.relation === "inside"
          ? "inside that band"
          : opt.relation === "underButFlat"
            ? "under that band — and yet one more step on every dial in this room would NOT have left it holding more, which is worth arguing about"
            : "over that band — and yet one step back on every dial in this room would NOT have left it holding more, which is worth arguing about";
  claims.push(bandLo, bandHi, level, claimWord("spillover.levelRelation", relationWord, true));
  const range = opt.bandLo === opt.bandHi ? `at ${bandLo.rendered}` : `between ${bandLo.rendered} and ${bandHi.rendered}`;
  const levelLine = `Run this room's own books at every setting on the dial and the room keeps the most ${range} — and this room's dials averaged ${level.rendered}, ${relationWord}.`;

  // The joint column — the room counted as one set of books.
  const direction = ct.roomJointGain > 0 ? "better off" : ct.roomJointGain < 0 ? "worse off" : "exactly level";
  const jointLine =
    ct.roomJointGain === 0
      ? `Counted as one room instead of desk by desk, reinvesting left this room ${direction}.`
      : `Counted as one room instead of desk by desk — because a dollar that lands on another desk's books is still a dollar in this room — reinvesting left this room ${joint.rendered} ${direction}.`;
  claims.push(claimWord("spillover.jointDirection", direction, true));

  // The projector's share of this. The private column, the level band and the
  // "no share to print" clause are all reasoning ABOUT the two figures below;
  // the figures are the finding. Both are atoms already pushed on every arm.
  const boardJoint =
    ct.roomJointGain === 0
      ? `counted as one room, reinvesting left it exactly level`
      : `counted as one room, reinvesting left it ${joint.rendered} ${direction}`;
  return {
    text: `${privateLine} ${externalLine} ${jointLine} ${levelLine}`,
    board: `${gave.rendered} of this room's own spending landed on OTHER clubs' books \u2014 and ${boardJoint}.`,
    claims,
  };
}

export function giveAndTakeSummaryClaimed(agg: HostLeagueAggregate): Claimed {
  const ct = agg.choiceTotals;
  if (!ct.anySpend) {
    const core = spilloverClaim(ct);
    return {
      text: `Every bar here is EMPTY, and that is the finding. ${core.text} All the money that moved between these buildings came from the Draw each desk was dealt. Ask them what it would have taken to make a bar appear.`,
      board: `Every bar here is EMPTY, and that is the finding. ${onBoard(core)}`,
      claims: core.claims,
    };
  }
  const core = spilloverClaim(ct);
  return {
    text: `These bars are what the DESKS CHOSE, not what they were dealt. ${core.text} The dealt totals — every dollar drawing power moved, most of it Draw nobody bought — are printed under each row.`,
    board: `These bars are what the DESKS CHOSE, not what they were dealt. ${onBoard(core)}`,
    claims: core.claims,
  };
}

/** The full finding — the teacher's mirror and the claim audit. */
export function giveAndTakeSummary(agg: HostLeagueAggregate): string {
  return giveAndTakeSummaryClaimed(agg).text;
}

/** What the projector holds for it. */
export function giveAndTakeSummaryBoard(agg: HostLeagueAggregate): string {
  return onBoard(giveAndTakeSummaryClaimed(agg));
}

export function barSummaryFromClaimed(rows: readonly HomeDecomposition[], visitorLed: number): Claimed {
  if (rows.length === 0) return { text: "No desk has played a home week yet.", claims: [] };
  const totalVisitor = rows.reduce((s, r) => s + r.fromVisitorDraw, 0);
  const totalDoor = rows.reduce((s, r) => s + r.fromBuilding + r.fromOwnDraw + r.fromVisitorDraw, 0);
  const pct = totalDoor > 0 ? Math.round((totalVisitor / totalDoor) * 100) : 0;
  const claims: ClaimAtom[] = [];
  // The SPILLOVER quantifier limb the analyst named: "every" / "all N" / "N of
  // N" are the only three shapes this sentence may take, and which one prints
  // is recomputed from `visitorLedCount` by the audit.
  const led = claim("barSummary.visitorLedCount", visitorLed, "int", { bounds: { min: 0, max: rows.length } });
  const pctClaim = claim("barSummary.visitorPct", pct, "percent", { bounds: { min: 0, max: 100 } });
  claims.push(led, pctClaim);
  const lead =
    visitorLed === 0
      ? (() => {
          claims.push(claimWord("barSummary.quantifier", "On every bar in this room, the visiting clubs were NOT the biggest block", true));
          return "On every bar in this room, the visiting clubs were NOT the biggest block — the buildings and the prices were.";
        })()
      : visitorLed === rows.length
        ? (() => {
            claims.push(claimWord("barSummary.quantifier", `On all ${rows.length} bars`, true));
            return `On all ${rows.length} bars, the biggest block at the door is the visiting club.`;
          })()
        : (() => {
            claims.push(claimWord("barSummary.quantifier", `On ${led.rendered} of ${rows.length} bars`, true));
            return `On ${led.rendered} of ${rows.length} bars, the biggest block at the door is the visiting club.`;
          })();
  return {
    text: `${lead} Across the room, ${pctClaim.rendered} of every dollar that came through a door was brought by a club somebody else was running. Nobody in this room decided that about their own building.`,
    claims,
  };
}

export function barSummaryFrom(rows: readonly HomeDecomposition[], visitorLed: number): string {
  return barSummaryFromClaimed(rows, visitorLed).text;
}

/* ------------------------------------------------------------ the copy -- */

export const MODULE_ID = "m2l2-host-league" as const;
/**
 * The single funnel every view return travels through — `studentView`,
 * `teacherView` and `boardView` each resolve their per-phase payload then hand
 * it here once, so `band` (the D22 seam's per-view exposure) is stamped
 * exactly once per surface instead of re-typed into every phase branch.
 */
const tag = <T extends object>(obj: T, band: GradeBand): T & { module: typeof MODULE_ID; band: GradeBand } => ({
  module: MODULE_ID,
  ...obj,
  band,
});

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "HOOK", "PLAY", "REVEAL", "ADAPT", "ARGUE", "SYNTHESIS", "COMPLETE"];

export const HOOK_COPY =
  "Same job as last lesson, bigger world. This room is the league now. Every week you HOST one club and you VISIT another — and every club in this league is somebody's desk. You still set the price. What you no longer own is most of the reason people show up.";

/**
 * `gate-l2-econ` B5 / FL-D. The shipped line used to end "You cannot turn Draw
 * back into cash", which is false of this model: a Draw point pays $12,000 a
 * week in local media plus $4,704-$7,722 on every home night, and the econ gate
 * measured a real exchange rate of $25,912 per Draw point on the
 * Memphis-profile frontier. A student reasoning correctly from the printed rule
 * reached the wrong dial. The two-book structure survives the correction: the
 * books still do not convert on demand, and the return is slow, partial and
 * shared.
 */
export const OBJECTIVE_COPY =
  "Two books again, and they still do not add up to one number. CASH is what your club keeps. DRAW is how many people your club's name puts in a building — yours, and somebody else's. You can buy Draw with cash. Draw pays you back the other way slowly: through your local media money and your own gate, a week late — and it pays the buildings you visit at the same time, on the same night, and you never see that part.";

export const HOOK_QUESTION = "Same league. Same rules. Why?";

/** BC-3 / SELECTION_SR_REVIEW C-4: the stamp lives on the board, not only in a ledger. */
export const HOOK_REAL_LINE =
  "In one leaked league year — 2016-17, reported by ESPN in September 2017 — the Los Angeles Lakers' local media deal was worth about $149M a year. The Memphis Grizzlies' was worth under $10M. Same league. Same season. Fifteen to one.";

export const HOUSE_RULES: readonly string[] = [
  "Every week you set a PRICE ($10-$120) for your home game and a REINVEST share (0-40%) of what comes through your door. Then you lock. There is no preview — the dials show a price and a percentage and nothing else.",
  "Your home crowd is built from three things, and only three: your building and your price, your OWN club's Draw, and the DRAW OF THE CLUB VISITING YOU. Every one of those numbers is printed before you touch a dial. There is no luck in this game.",
  "REINVEST buys DRAW, and Draw lands NEXT week — never this week. It never buys wins, and the ceiling is the same for every club in this league, so no amount of big-market money buys a Draw a small market cannot reach.",
  "Put nothing back and your Draw slips 4 points a week. Put money in and it climbs — fast when your Draw is low, barely at all when it is already high.",
  "Your bill is due every week whether 400 people come or 19,000 do. The national television check arrives every week too, and it is exactly the same number for every club in this league — nobody in this room can move it.",
  "When both Draws on the card are high, your building is going to sell out. Once every seat is sold a cheaper ticket brings nobody new — it just charges less to the same full house. On those weeks, being under the right price costs you more than being over it.",
];

export const BOARD_HONESTY_LINE =
  "Buildings, seat counts and market sizes are real. The demand curves are ours — this is a model of how a league's money moves, not any club's measured books. Clubs sharing a market size share the same curve.";

export const HORIZON_LINE =
  "Three weeks here stand in for a whole season. Each week is one home game and one road game; a real NBA club plays 41 at home.";

/**
 * `gate-l2-sr` BLOCKING-2. Both clauses shipped as universals and both are
 * falsified by the board's own per-desk pipe bar rendered beside them: gate
 * share is 25.0% at a New York house price but 8.1% at $120 and 8.4% at $10,
 * and local media overtakes the national check at Draw 50 on the new-york
 * profile (Boston starts at 55, the Lakers at 68 — before anybody prices).
 * Quantified honestly, and the bars are invited to be the evidence.
 */
/**
 * The same disclosure, at the length a ten-year-old will actually read.
 *
 * The full line below is five sentences of methodology and it was the HOOK
 * banner on the student device — a paragraph about the shape of a revenue
 * parabola, in front of a pair who had not yet priced a single seat. Its
 * content is not wrong and it is not optional (CLAUDE.md: when the economics
 * is simplified, say what changed), but WHERE it lands is a choice. The desk
 * gets the one sentence that changes how a pair reads a number; the projector
 * and the teacher keep the whole thing at SYNTHESIS, where the room is being
 * told how to trust what it just saw.
 */
export const MODELED_DOLLARS_SHORT =
  "The dollars here are shrunk to classroom size — all of them by the same amount — so it is the SHARES that are real, not the totals.";

export const MODELED_DOLLARS_LINE =
  "The dollars are shrunk to classroom size, all of them by the same amount, so the SHARES are the real story. Near a club's house price the gate is about a fifth to a quarter of what it earns — price far above or far below that and the share moves a long way. For most clubs here the national check is the biggest single pipe, and a club that builds a big Draw can push its local money past it. The bars on this board say which is which; do not take our word for it.";

/** BC-3: every real figure in product copy carries its date. */
export const SOURCE_NOTES: readonly string[] = [
  "The Lakers' local media deal ran about $149M a year against the Grizzlies' under $10M in one leaked league year, 2016-17 (reported by ESPN, September 2017; verified as of 2026-08-31). In that same leaked year 14 of 30 clubs lost money before revenue sharing and 9 after.",
  "The NBA's national media deal runs about $76 billion over eleven years, 2025-26 through 2035-36, with Disney/ESPN at about $2.6B a year, NBC/Peacock, and Amazon at about $1.8B a year (agreed July 2024; verified as of 2026-08-31). Split across 30 clubs that is on the order of $200M+ per club per year before the players' share.",
  "Indiana Fever home attendance went from 4,066 a game in 2023 to 17,036 a game in 2024, the best in the WNBA, and six opposing clubs moved Fever games out of their own buildings and into bigger ones — United Center, State Farm Arena, TD Garden and American Airlines Center among them (2024 season; verified as of 2026-08-31).",
  "LeBron James left Cleveland in 2010 and the Cavaliers' ticket demand and franchise value fell hard; his July 2014 return sold out season tickets within hours (historical record; the exact per-year dollar swings are not verified to a single figure, so none is quoted).",
  "The Golden State Warriors privately financed the roughly $1.4B Chase Center, opened 2019, and own it; their 2024-25 revenue of $833M was the NBA's highest, about 34% above the second-place Knicks (Sportico, 2025; verified as of 2026-08-31).",
  "On 1-2 February 2025 the Dallas Mavericks traded Luka Doncic to the Los Angeles Lakers. Season-ticket cancellations and protests followed and the general manager who made the trade was fired on 11 November 2025 after a 3-8 start. Dallas then won the 2025 draft lottery and drafted Cooper Flagg (reported November 2025 and May-June 2025; verified as of 2026-08-31).",
  "The 2025-26 salary cap rose the maximum permitted 10% to $154.647M, and 6.7% to $164.961M for 2026-27 (NBA.com, June 2025 and June 2026; verified as of 2026-08-31).",
  "Club names, buildings and listed capacities are real (2025-26), and a fact printed under one club is printed under that club only: Knicks gate receipts about $193M in 2024-25, the NBA's largest; Oklahoma City beat Indiana 4-3 in the 2025 Finals; the Lakers are tenants of AEG's Crypto.com Arena. Every dollar figure here is a modeled magnitude, not an audited club financial, and clubs are named as typographic wordmarks only — no logos, marks, photographs or likenesses (verified as of 2026-09-01).",
];

export const SIMPLIFICATIONS: readonly { what: string; why: string; risk: string }[] = [
  {
    what: "Four market profiles cover every club in the league, so two clubs of the same market size have identical demand curves.",
    why: "Only four NBA markets are verified on this lesson's anchor sheet (SR-1). Inventing a separate strength constant for each of twenty real clubs would be presenting invented numbers under real names — the exact failure the architecture review flagged in a rival design.",
    risk: "A student may conclude two real clubs are economically identical. They are not: what is real here is the market SIZE grouping and the buildings, and the board says so. If a fan objects that their club is bigger than that, they are right and the honest answer is 'yes — this model only has four sizes'.",
  },
  {
    what: "Every club starts at a printed Draw that has nothing to do with its market size.",
    why: "Draw in this lesson is what the ROOM builds. Starting a big market with a big Draw would teach that money buys attention, which is the false lesson this module exists to remove.",
    risk: "A student may read the starting Draws as a real ranking of clubs. They are not — they are a modeled starting position, deliberately shuffled against market size. Say so once, at the schedule.",
  },
  {
    what: "Reinvest buys DRAW and never buys wins, and the Draw ceiling is identical for every market.",
    why: "In a capped league, spending relates to on-court quality weakly and with sharply diminishing returns. Modelling money-to-wins would teach the strongest false lesson in this space.",
    risk: "Students may still infer money buys wins. The counter is in the deal: Oklahoma City is one of the league's smallest markets and won the 2025 title, and the ceiling on this dial is the same for the biggest and the smallest club here.",
  },
  {
    what: "The national check is a fixed, equal, unconditional pipe.",
    why: "It IS fixed and shared equally, and that is the single most surprising true thing in this lesson.",
    risk: "'TV money is free money' is false and is the misconception this pipe invites. It is payment for a product the league must deliver, and the league gives up real things for it — start times, the schedule, the playoff format. Say the line: Amazon and NBC pay $76 billion, and in exchange they get to say when your team plays.",
  },
  {
    what: "A club's local media and sponsorship money moves with its Draw, one week late, at the same dollars per Draw point for every market.",
    why: "Local money really does answer to drawing power, and giving small markets the same dollars per point is the catch-up channel that stops the biggest market running away with the lesson.",
    risk: "It compresses the real local-media gap. The real 2016-17 spread was about 15 to 1 (Lakers to Grizzlies); the structural part of ours is about 5 to 1, and the Draw money narrows it further. Quote the real number from the sources rail, not ours.",
  },
  {
    what: "The weekly bill is always clearable, at any legal price, from any state.",
    why: "The national check is bigger than the bill everywhere in this league. That is not a safety net bolted on — it is the arithmetic the lesson is about.",
    risk: "A student may conclude clubs cannot lose money. Real clubs do: in that same leaked 2016-17 year 14 of 30 lost money before revenue sharing. Our bill is one lumped line and does not include everything a real club pays.",
  },
  {
    what: "One week is one home game and one road game, and three weeks stand in for a season.",
    why: "A real 41-date home season cannot be played in 50 minutes, and the decomposition needs weeks a student can hold in their head.",
    risk: "A club does not make its money in three nights. Say the horizon line out loud before the first price.",
  },
  {
    what: "On a week when the building sells out, under-pricing costs more than over-pricing by the same amount.",
    why: "It is the arithmetic of a full house, not a moral: below the sell-out price every extra dollar is pure gain on the same crowd, while above it you start losing people. Everywhere the building does NOT fill, the two mistakes cost within 3x of each other, measured at every reachable Draw combination.",
    risk: "The mirror of the usual worry: not 'charging high is greedy' but 'charging low is safe'. It is not safe on a big week, and the card tells them the week is big before they price — both Draws are printed. HOUSE_RULES says the sentence; say it again if a desk sells out cheap.",
  },
  {
    what: "No randomness at all: no injuries, no weather, no winning streaks.",
    why: "Every outcome has to be attributable to a decision somebody in this room made, or the debrief is a shrug.",
    risk: "Real front offices are guessing under genuine uncertainty. This room is not — it is reasoning under printed information, which is a different and easier thing.",
  },
  {
    what: "THE POOL only touches live desks — a league-office (bot) club neither pays the levy nor receives the equal split.",
    why: "The ritual is about the room's own franchises feeling a rule together. A bot has no student behind it to feel either half of the reveal, so taxing or paying one would be arithmetic with nobody home.",
    risk: "A partial room (fewer live desks than the league seats) sees a smaller bowl than a full room would at the same prices — the levy base scales with who is actually playing, not with the league's printed size. Say so if a room seats fewer than the schedule shows.",
  },
  {
    what: "A franchise that did not clear its Week 4 bill opens Week 5 with a flat, modeled penalty — not the actual size of what it owed.",
    why: "Full House's own bill shape is being extended concurrently; a flat, named, printed number is honest and legible on day one without hard-coding a linkage to a field this module does not own.",
    risk: "Two franchises that missed their bill by very different amounts open Week 5 identically penalized. Say the number is modeled, not measured, if a student asks why.",
  },
  {
    what: "This classroom's pool splits the bowl equally — every live desk takes out the same share, regardless of market size.",
    why: "An equal split is legible in one reveal and lets the room see 'the bars IN are different; the bars OUT are the same' without a second formula to explain.",
    risk: "The real NBA's revenue sharing is a confidential, market-size-adjusted formula, not an equal split — some big-market clubs are net payers and some are net receivers, and the exact terms are not public. Say plainly: the real pot is not split evenly the way this room's is.",
  },
  {
    what: "THE NO-BOWL SEASON's best-response layer holds every dial the room actually played for the reinvest-with-bowl side, and only re-decides the club under test — no other desk's price or reinvest is ever re-optimized alongside it. Reinvest itself is scored by this week's own cash plus the Draw it buys valued FORWARD at `profile.drawDollars` (the same per-Draw-point local-media rate `localMediaFor` already charges every week) across the season's remaining weeks, RETAINED net of the levy's equal split (a club keeps only `(1 - levy) + levy / liveSlots.length` of that future dollar, since THE POOL assesses and splits future local media exactly like this week's) — zero on the last settled week, same as `reinvestRuleFor`'s own framing.",
    why: "A full re-equilibration (every club re-deciding against every other club's re-decision, repeated to a fixed point) is a different and much heavier computation than a live 50-minute press can carry, and the INCENTIVE chain only needs one club's own best response to the SAME levy question — not a league-wide re-equilibrium. A purely single-week cash objective is worse than useless here: reinvest is pure cost the week it is spent, so it would always brute-force to zero and manufacture the false lesson 'nobody should ever reinvest.' Valuing the Draw forward through the local-media channel alone (never re-running `settleHome` for future weeks) is the cheapest fix that still lets reinvest win some cells.",
    risk: "Two false lessons sit on either side of this number. 'The levy changed nobody's mind' — the held-dial press alone invites exactly this, which is why this layer exists. And the opposite overclaim: 'the levy alone decides the dial' — it does not; it is one input into a best response computed against everything else in the room held fixed, not a formula that outputs a club's reinvest by itself. A third risk is specific to the forward valuation: it prices a Draw point ONLY through local media, never through the extra gate revenue a higher Draw also pulls in future weeks (`ownDrawFans`/`visitorDrawFans` in `settleHome`) — so this best-response number understates the true value of reinvest and is a floor, not the club's actual optimum. Say all three: the mechanism is real (best-response reinvest falls as the levy rises), this number is a computed re-decision never a played one, and it is a conservative estimate of that re-decision, not an exact one.",
  },
];

export const SHOCK_REVEAL_COPY =
  "That was modeled on a real one. LeBron James left Cleveland in 2010 and the Cavaliers' ticket demand and franchise value fell hard; when he came back in July 2014 the season tickets sold out within hours. Here is the part that is easy to miss: the money did not only move in Cleveland. Every building he was scheduled to visit felt it too — and none of those clubs had done anything at all.";

export const FEVER_REVEAL_COPY =
  "Real clubs act on this. Indiana Fever home attendance went from 4,066 a game in 2023 to 17,036 in 2024 — best in the WNBA — and six opposing clubs moved Fever games OUT of their own buildings and into bigger ones: the United Center, State Farm Arena, TD Garden and American Airlines Center among them. They did not do that because their own club got better. They did it because of who was visiting.";

export const PIPES_REVEAL_COPY =
  "The national check is about $76 billion over eleven years, 2025-26 through 2035-36, from Disney, NBC and Amazon — on the order of $200M a club a year before the players' share. It is the same number for every club here and nobody in this room can move it by one dollar. It is not free money: in exchange, the networks get to say when your team plays.";

export const WARRIORS_LINE =
  "And there are more pipes than these four. The Golden State Warriors paid for Chase Center themselves and own it, so they keep the concert money, the naming rights and the real estate — $833M of revenue in 2024-25, the highest in the NBA and about 34% above the second-place Knicks.";

export const ARGUE_COPY =
  "On 1 and 2 February 2025 the Dallas Mavericks traded Luka Doncic to the Los Angeles Lakers. Season-ticket holders cancelled, fans protested in the arena, and the general manager who made the trade was fired that November after a 3-8 start. Nobody changed the price of a ticket. And in the same breath, the part that complicates it: Dallas then won the 2025 draft lottery and drafted Cooper Flagg. Outcome is not the same thing as decision quality — in both directions.";

export const ARGUE_PROMPT = "The ticket price never changed. The curve did. Who moved it — and who else did it cost?";

export const ADAPT_QUESTIONS: readonly string[] = [
  "Look at your biggest home week and your smallest. Which block on your bar changed the most between them?",
  "Somebody in this room made your best week. Who was it, and how much of it did they choose?",
  "You put money into your Draw. Who got that money back — you, or the buildings you visited?",
];

export const EXIT_PROMPT = "Name one week where your money went up or down because of a decision you did not make.";

export const BEYOND_SPORTS_LINE =
  "One great store that brings the whole mall its foot traffic. A group project where one person's work sets everybody's grade. A street where one shop closing empties the block. A band that needs the other bands on the bill to fill the room.";

export const M1_BRIDGE_LINE =
  "One last thing, and it goes back to Module 1. The 2025-26 salary cap rose the most the rules allow — 10%, to $154.647M — and 6.7% again to $164.961M for 2026-27. One television contract raised every club's budget. The cap you fought inside of in Module 1 is made out of the money you just counted.";

export const COMPLETE_COPY =
  "That is You Don't Play Alone. You priced your own building, you watched somebody else's club fill it or empty it, and you found out that the biggest check any of you got was the one nobody in this room could move. Next lesson: this room writes the rule that decides how much of it gets shared.";

/* ------------------------------------------------------- view builders -- */

/** What a view is allowed to know about a market: printed operating facts only, never a curve. */
export type ProfileFacts = {
  id: MarketId;
  sizeLabel: string;
  plainLine: string;
  bill: number;
  housePrice: number;
};
export const profileFacts = (m: MarketProfile): ProfileFacts => ({
  id: m.id,
  sizeLabel: m.sizeLabel,
  plainLine: m.plainLine,
  bill: m.bill,
  housePrice: m.housePrice,
});

function clubCard(state: HostLeagueState, slot: number) {
  const club = state.clubs[slot]!;
  const def = CLUBS[slot]!;
  return {
    slot,
    name: def.name,
    short: def.short,
    building: def.building,
    capacity: def.capacity,
    capacityNote: def.capacityNote,
    draw: club.draw,
    live: club.seatId !== null,
    deskNumber: club.deskNumber,
    handle: clubHandleFor(club),
    starGone: club.starGone,
    sizeLabel: PROFILE_BY_ID.get(club.profileId)!.sizeLabel,
  };
}

/**
 * The three-week slate, printed before the first price.
 *
 * The pairings are fixed the moment the league fills; the DRAWS on it are live,
 * because every club's Draw is another desk's running decision. That is the
 * anticipation this lesson is built on — "who visits ME next week" is a real
 * question with a real answer, and the answer's number is still moving.
 */
function slateFor(state: HostLeagueState, slot: number) {
  const out = [];
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const v = visitorSlotFor(slot, w, state.leagueSize);
    const h = hostSlotFor(slot, w, state.leagueSize);
    out.push({
      week: w + 1,
      settled: w < state.weekIndex,
      open: w === state.weekIndex,
      hosting: clubCard(state, v),
      visiting: clubCard(state, h),
    });
  }
  return out;
}

/**
 * THE POST-HOC PRICE COUNTERFACTUAL — `gate-l2-play` N-5, the rating ceiling.
 *
 * The re-check's precise diagnosis of why this lesson caps at FUNCTIONAL:
 * "only one of the two dials carries a consequence the desk can feel inside the
 * lesson. The price dial has consequence but no counterfactual — nothing
 * anywhere tells a pair what $46 would have taken on the night they priced
 * $78." The reinvest dial got its within-desk counterfactual in the last round;
 * the dial the pair actually touches every week still had none, so across three
 * weeks a pair plays one live dial and one dial the game says does not pay.
 *
 * This is that counterfactual and nothing more: the SAME settled night — same
 * visitor, same Draw on both sides, same building, same reinvest share — priced
 * differently. It is computed only after the bell, so the build's no-preview
 * rule is untouched: nothing here can be read before the pair commits.
 *
 * Two honesty constraints, both load-bearing:
 *  - it reports that WEEK's KEPT on the same arithmetic the week itself used
 *    (door money + local media + national - bill - the same reinvest share of a
 *    different door), so at the price they actually charged it must reproduce
 *    `w.net` exactly. The audit asserts that identity — it is what makes the
 *    exhibit a measurement rather than an illustration;
 *  - it does NOT re-run the weeks after it. A different price would have bought
 *    a different reinvest dollar and therefore a different Draw next week, and
 *    the card says so out loud rather than quietly implying the whole season
 *    would have followed.
 */
export type PriceCounterfactualRow = {
  price: number;
  turnout: number;
  kept: number;
  /** The rendered figure, built FROM `kept` by the claim binder — the client prints this, never its own copy. */
  keptRendered: string;
  delta: number;
  you: boolean;
  soldOut: boolean;
};
export type PriceCounterfactual = {
  yourPrice: number;
  yourKept: number;
  rows: PriceCounterfactualRow[];
  bestPrice: number;
  bestKept: number;
  bestDelta: number;
  foundBest: boolean;
  line: string;
  /** The whole exhibit as one auditable string: every row's figure plus the verdict. */
  tableText: string;
  verdict: string;
  claims: readonly ClaimAtom[];
};

export function priceCounterfactualFor(state: HostLeagueState, club: Club, w: SettledWeek): PriceCounterfactual {
  const profile = profileOf(club);
  const capacity = defOf(club).capacity;
  const keptAt = (price: number): { kept: number; turnout: number; soldOut: boolean } => {
    const home = settleHome(profile, capacity, w.hostDrawBefore, w.visitorDrawBefore, price);
    const reinvest = Math.round((w.share / 100) * home.doorMoney);
    return { kept: home.doorMoney + w.localMedia + w.national - w.bill - reinvest, turnout: home.turnout, soldOut: home.soldOut };
  };

  const yours = keptAt(w.price);
  let bestPrice = w.price;
  let bestKept = yours.kept;
  for (const p of PRICE_GRID) {
    const k = keptAt(p).kept;
    if (k > bestKept) {
      bestKept = k;
      bestPrice = p;
    }
  }

  // Two probes either side of what they actually charged, snapped to the legal
  // grid, so the pair reads a shape rather than a single alternative.
  const snap = (p: number): number => Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round((p - PRICE_MIN) / PRICE_STEP) * PRICE_STEP + PRICE_MIN));
  const probes = new Set<number>([snap(w.price - 20), w.price, snap(w.price + 20), bestPrice]);
  const claims: ClaimAtom[] = [];
  const rows: PriceCounterfactualRow[] = [...probes]
    .sort((a, b) => a - b)
    .map((price) => {
      const k = keptAt(price);
      const atom = claim(`priceCf.kept.$${price}`, k.kept, "money");
      claims.push(atom);
      return { price, turnout: k.turnout, kept: k.kept, keptRendered: atom.rendered, delta: k.kept - yours.kept, you: price === w.price, soldOut: k.soldOut };
    });

  const foundBest = bestPrice === w.price;
  const yourKept = claim("priceCf.yourKept", yours.kept, "money");
  const bestKeptClaim = claim("priceCf.bestKept", bestKept, "money");
  const bestDelta = claim("priceCf.bestDelta", bestKept - yours.kept, "money", { assertsSign: "nonNegative", bounds: { min: 0 } });
  claims.push(yourKept, bestKeptClaim);
  // The gap to the best price is only PRINTED when there is one, so it is only
  // claimed when it is printed. Its bound (never negative — a better price
  // cannot keep less) is asserted for every week by the unit suite and by the
  // harness sweep, printed or not.
  if (!foundBest) claims.push(bestDelta);
  claims.push(
    foundBest
      ? claimWord("priceCf.foundBest", "the best price on the board for that night", true)
      : claimWord("priceCf.foundBest", "would have kept", false),
  );

  const verdict = foundBest
    ? `At $${w.price} you found the best price on the board for that night. Nothing on the dial beats ${yourKept.rendered}.`
    : `$${bestPrice} would have kept ${bestKeptClaim.rendered} — ${bestDelta.rendered} more than you did. It was on the dial the whole time, and nothing on this screen told you.`;

  return {
    yourPrice: w.price,
    yourKept: yours.kept,
    rows,
    bestPrice,
    bestKept,
    bestDelta: bestKept - yours.kept,
    foundBest,
    line: "Same night. Same visitor. Same Draw on both sides. Same building. Only the price moves — and this is that ONE week's KEPT, not a re-run of the weeks after it.",
    tableText: rows.map((r) => `$${r.price} kept ${r.keptRendered}`).join(" · "),
    verdict,
    claims,
  };
}

/**
 * `gate-l2-play` N-4 (BLOCKING for STRONG). A desk that free-rode all lesson
 * read its "WHAT YOUR OWN DECISIONS DID" block as $0 / $0 / $0 under a sentence
 * describing a counterfactual identical to what it did. Three zeroes are the
 * arithmetically correct answer and a blank presentation of it: the observed
 * desk free-rode three weeks, finished 2nd of 6 in cash, and neither its card
 * nor the board ever told it what its choice was.
 *
 * The zeroes stay — inventing a number here would be exactly the confound the
 * by-choice instrument exists to remove. What changes is that the block says
 * what they mean, and puts beside them the one figure a free-rider's own card
 * was never showing: what the rest of the room's spending put in ITS building.
 */
const LOCKED_IN = "You locked in";

export function deskChoiceLineClaimed(row: GiveAndTakeRow): Claimed {
  const got = claim("desk.receivedByChoice", row.receivedByChoice, "money", { assertsSign: "nonNegative" });
  const spent = claim("desk.spend", row.spend, "money", { assertsSign: row.spend > 0 ? "positive" : "zero" });
  // The same atom on the OTHER side of the branch. Without it, only the
  // abstention arm is audited and the copy could drift back on the arms that
  // outnumber it 20:1 — which is exactly how the defect shipped.
  const notNeverLocked = claimWord("desk.neverLocked", LOCKED_IN, false, "nobody at this desk pressed LOCK");
  // W5 B-1 (BLOCKING). The ABSTENTION branch, and it comes FIRST — before the
  // arithmetic branch, because `spend === 0` is true of this desk too and used
  // to capture it. This pair never pressed LOCK, so nothing on this block is a
  // decision they made, and the card may not tell them it is. It says what
  // actually happened to their club instead, and leaves the door open: the
  // teacher walking over has been told the same thing by /teach.
  if (row.neverLocked) {
    const abstained = claimWord("desk.neverLocked", "nobody at this desk pressed LOCK", true, "chose to give nothing");
    return {
      text: `These zeroes are not a decision — they are the weeks that ran without you. ${abstained.rendered} in any week, so the league office settled your club at its house price with nothing put back: ${spent.rendered}, every week, marked AUTO in your own history above. That is not you choosing to give nothing; it is you not having chosen yet.${
        row.receivedByChoice > 0
          ? ` What IS yours: ${got.rendered} landed in your building because OTHER desks chose to spend, on the nights they visited you.`
          : ` And nobody else's spending reached your building either — ${got.rendered} came your way from anybody else's choices.`
      }`,
      claims: [spent, got, abstained],
    };
  }
  if (row.spend > 0) {
    const own = claim("desk.ownGain", row.ownGain, "money", {
      assertsSign: row.ownGain > 0 ? "positive" : row.ownGain < 0 ? "negative" : "zero",
    });
    const verdict = row.ownGain > 0 ? "ahead" : row.ownGain < 0 ? "behind" : "exactly level";
    return {
      text: `Same schedule, same prices, same everything — except you put nothing back. That is the only fair thing to compare yourself to, because nobody chose their calendar. ${LOCKED_IN} and put ${spent.rendered} back in, and on your own books that left you ${own.rendered} — ${verdict}. Other desks' spending put ${got.rendered} in your building.`,
      claims: [
        spent,
        got,
        own,
        claimWord("desk.ownGainDirection", verdict, true),
        claimWord("desk.choseNothing", "you put nothing back", false, "chose to give nothing"),
        notNeverLocked,
      ],
    };
  }
  const nothing = claimWord("desk.choseNothing", "chose to give nothing", true);
  return {
    text:
      row.receivedByChoice > 0
        ? `Those zeroes are not missing numbers — they are your decision. ${LOCKED_IN} and you ${nothing.rendered} back to your club: ${spent.rendered}, every week you played. So nothing you did put a dollar in anybody else's building, and there is no "what if you had not" to compare, because you did not. And you received ${got.rendered} from the room — that is what OTHER desks chose to spend, turning up in your building on the nights they visited you.`
        : `Those zeroes are not missing numbers — they are your decision. ${LOCKED_IN} and you ${nothing.rendered} back to your club: ${spent.rendered}, every week you played. And this time nobody else's spending reached your building either — ${got.rendered} came your way from anybody else's choices. Every zero in this block is somebody's decision, including yours.`,
    claims: [spent, got, nothing, notNeverLocked],
  };
}

/**
 * The desk block's HEADING, W5 B-1's second half.
 *
 * The heading was a hand-written ternary in `client/play/main.ts` branching on
 * `give.spend > 0`, so the abstaining desk's screen was topped by "YOU SPENT
 * NOTHING, AND THAT IS A DECISION" no matter what the sentence underneath was
 * repaired to say. It is computed here, from the same one atom, and swept.
 */
export function deskChoiceHeadingClaimed(row: GiveAndTakeRow): Claimed {
  if (row.neverLocked) {
    const abstained = claimWord("desk.neverLocked", "nobody at this desk pressed LOCK", true, "that is a decision");
    return {
      text: `What your own DECISIONS did — ${abstained.rendered}, so these weeks ran at the house default`,
      claims: [abstained],
    };
  }
  if (row.spend > 0) {
    const spent = claim("desk.spend", row.spend, "money", { assertsSign: "positive" });
    return {
      text: `What your own DECISIONS did — you locked in and spent ${spent.rendered}`,
      claims: [spent, claimWord("desk.neverLocked", "you locked in", false, "nobody at this desk pressed LOCK")],
    };
  }
  return {
    text: "What your own DECISIONS did — you locked in and spent nothing, and that is a decision",
    claims: [claimWord("desk.neverLocked", "you locked in", false, "nobody at this desk pressed LOCK")],
  };
}

/**
 * The sub-label over the desk's give/take bars.
 *
 * `gate-l2-econ` N14 / FL-K. The shipped label was a hand-written static string
 * in `client/play/main.ts` — "Everything your Draw moved — MOST OF IT the Draw
 * you were DEALT" — carrying an unbound quantifier that the model contradicts
 * in 16 of 96 probed desk-instances (worst measured: 12 desks @ $90 all-40%,
 * desk 7 gave $847,704 of which $511,224 — 60% — was bought, not dealt). It was
 * false in exactly the high-reinvest rooms the lesson wants to celebrate.
 *
 * The share is now computed and printed. `gave` is everything this club's Draw
 * put in other buildings; `gaveByChoice` is the part that exists because this
 * desk reinvested; the rest is the Draw the schedule dealt it. No quantifier is
 * asserted that is not the rendered number.
 */
export function dealtLineClaimed(row: GiveAndTakeRow): Claimed {
  if (row.gave <= 0) {
    return {
      text: "Everything your Draw moved. Your Draw put nothing in anybody else's building this season.",
      claims: [claim("desk.dealtPct", 0, "percent", { bounds: { min: 0, max: 100 } })],
    };
  }
  const dealtDollars = Math.max(0, row.gave - row.gaveByChoice);
  const pctValue = Math.round((dealtDollars / row.gave) * 100);
  const pct = claim("desk.dealtPct", pctValue, "percent", { bounds: { min: 0, max: 100 } });
  const bought = claim("desk.boughtShare", 100 - pctValue, "percent", { bounds: { min: 0, max: 100 } });
  return {
    text: `Everything your Draw moved — ${pct.rendered} of it the Draw you were DEALT, ${bought.rendered} of it Draw you BOUGHT.`,
    claims: [pct, bought],
  };
}

function viewWeek(state: HostLeagueState, club: Club, w: SettledWeek) {
  const visitorDef = CLUBS[w.visitorSlot]!;
  const roadDef = CLUBS[w.roadHostSlot]!;
  const priceCf = priceCounterfactualFor(state, club, w);
  return {
    priceCf,
    // How the pair's locked-and-waiting call came out. The SENTENCE is authored
    // here, never in the client: the desk renders words, it does not write
    // verdicts (R-1).
    call: gateCallResolvedFor(w),
    week: w.week + 1,
    price: w.price,
    share: w.share,
    auto: w.auto,
    stock: w.stock,
    visitor: visitorDef.short,
    visitorFull: visitorDef.name,
    visitorDraw: w.visitorDrawBefore,
    hostDrawBefore: w.hostDrawBefore,
    turnout: w.home.turnout,
    capacity: w.home.capacity,
    fillPct: w.home.fillPct,
    turnedAway: w.home.turnedAway,
    soldOut: w.home.soldOut,
    bareFans: w.home.bareFans,
    ownFans: w.home.ownFans,
    visitorFans: w.home.visitorFans,
    gate: w.home.gate,
    inArena: w.home.inArena,
    doorMoney: w.home.doorMoney,
    bareDollars: w.home.bareDollars,
    ownDollars: w.home.ownDollars,
    visitorDollars: w.home.visitorDollars,
    localMedia: w.localMedia,
    national: w.national,
    bill: w.bill,
    reinvestPaid: w.reinvestPaid,
    net: w.net,
    cashAfter: w.cashAfter,
    drawAfter: w.drawAfter,
    drawMove: w.drawMove,
    road: {
      host: roadDef.short,
      hostFull: roadDef.name,
      hostDraw: w.roadHostDrawBefore,
      dollars: w.roadDollars,
      fans: w.roadTurnoutLift,
      line: `Your club visited ${roadDef.short}. Your Draw put ${w.roadTurnoutLift.toLocaleString()} extra people in their building and ${money(w.roadDollars)} on THEIR books. You do not get any of it.`,
    },
    decompositionLine: `${w.home.turnout.toLocaleString()} came. ${w.home.bareFans.toLocaleString()} for your building at your price, ${w.home.ownFans.toLocaleString()} for your own club, ${w.home.visitorFans.toLocaleString()} for ${visitorDef.short}.`,
  };
}

function deskIdentity(state: HostLeagueState, club: Club) {
  const def = defOf(club);
  const profile = profileOf(club);
  return {
    deskNumber: club.deskNumber,
    handle: deskHandleFor(club),
    crestIndex: club.crestIndex,
    club: def.name,
    short: def.short,
    building: def.building,
    capacity: def.capacity,
    capacityNote: def.capacityNote,
    profile: profileFacts(profile),
    // BLOCKING-1: present only where it is true of THIS club. Sixteen of the
    // twenty clubs carry nothing here, and their screens say nothing about a
    // named club they are not.
    identityLine: def.identityLine ?? null,
    joinedAtWeek: club.joinedAtWeek,
  };
}

const booksFor = (club: Club) => ({ cash: club.cash, draw: club.draw, inDebt: club.cash < 0 });

export type ReinvestRule = {
  /** Always visible, at the dial. Kept short on purpose — see below. */
  line: string;
  /** The mechanics, behind a disclosure. Same words, off the fold. */
  detail: string[];
};

/**
 * The reinvest dial's payback rule, printed BEFORE the commitment. A rule of
 * the game, not a preview.
 *
 * `gate-l2-econ` B4 / FL-E (BLOCKING). This used to end "About a fifth of your
 * door money keeps your Draw where it is; more than that grows it." Measured
 * break-even (drawGain >= DRAW_DECAY) at house price, every profile: Draw 20-50
 * needs 5%, Draw 60-70 needs 10%, Draw 80 needs 20%, and at Draw 90 NO legal
 * share holds it. Desks start at Draw 26-72, so the printed number was 2-4x too
 * high for most of the room and unreachable at the top, and a student following
 * it over-spent by roughly $200,000-$400,000 a season.
 *
 * The number is gone rather than retuned, and it is not replaced by a computed
 * one: the true break-even depends on the week's door money, which depends on
 * `base0`/`sens` — printing it would be a demand-curve preview and would breach
 * R2. What is printed instead is the true SHAPE of the rule, which is
 * state-dependent, non-leaking, and checkable in `hostTheLeague.test.ts`:
 * holding a Draw costs more the higher it already is, and above the high 80s no
 * share on this dial can hold it at all (at Draw 89, DRAW_GAIN_MAX * 0.11 =
 * 3.74 < DRAW_DECAY = 4, at any spend whatsoever).
 *
 * `gate-l2-play` R10 / R1-R2 (the fold). The old rule was one ~90-word block
 * sitting between the dials and LOCK IT IN on every single week, and at
 * 1024x600 it was the reason the primary action was at y=650 in a 600px
 * viewport. `line` is what stays at the dial; `detail` is the same content one
 * disclosure away. Nothing was deleted, it was moved off the fold.
 */
/** Profile-independent by construction: the maintenance shape is set by DRAW_GAIN_MAX, DRAW_DECAY and the ceiling term, none of which vary by market. */
export function reinvestRuleFor(weekNumber: number): ReinvestRule {
  const last = weekNumber >= WEEK_COUNT;
  return {
    line: last
      ? "LAST WEEK. Draw you buy now earns you nothing more in this lesson — it is what your club carries into the next one."
      : "Reinvest buys DRAW. It costs you this week; the Draw arrives next week.",
    detail: [
      "It takes a share of what comes through your door THIS week and puts it back into the club. This week's books are visibly worse for it.",
      "The Draw arrives NEXT week — never this one. Put nothing back and your Draw slips 4 points a week.",
      "It climbs fastest when your Draw is low and barely moves when your Draw is already high, so holding a Draw steady costs more the higher it already is — and near the top of the scale no share on this dial can hold it at all.",
      "The ceiling is the same for every club in this league. No amount of big-market money reaches a Draw a small market cannot reach.",
      ...(last
        ? [
            "This is the last week of the lesson. Draw bought now brings you no more money here — it is what your club carries into the next lesson. That is the whole calculation, and it is yours to make.",
          ]
        : []),
    ],
  };
}

/* --------------------------------------------------------------- module -- */

const openWeekNumber = (state: HostLeagueState): number => Math.min(state.weekIndex + 1, WEEK_COUNT);

function requireOpenClub(
  state: HostLeagueState,
  seatId: SeatId,
): { ok: true; club: Club; profile: MarketProfile } | { ok: false; reason: string } {
  const slot = state.seatToSlot[seatId];
  if (slot === undefined) return { ok: false, reason: "this seat has no club yet — reload and rejoin" };
  const club = state.clubs[slot]!;
  if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "all three weeks are in the books" };
  if (club.locked) return { ok: false, reason: "this week is locked — you cannot change it" };
  return { ok: true, club, profile: profileOf(club) };
}

/** Live desks locked into the currently open week, right now. */
export function lockedNow(state: HostLeagueState): number {
  return state.clubs.filter((c) => c.seatId !== null && c.locked).length;
}

/** Live desks seated right now — the denominator stage 5 prints its lock count against. */
export function liveDeskCount(state: HostLeagueState): number {
  return state.clubs.filter((c) => c.seatId !== null).length;
}

/**
 * The locked count stamped at bar release, tolerant of a snapshot written
 * before the field existed. A missing stamp is `null`, and stage 5 then refuses
 * to make any claim about who had committed rather than guessing one.
 */
export function lockedAtBarRelease(state: HostLeagueState): number | null {
  const v = (state as { lockedAtBarRelease?: number | null }).lockedAtBarRelease;
  return v === undefined ? null : v;
}

const withClub = (state: HostLeagueState, club: Club): HostLeagueState => {
  const clubs = state.clubs.slice();
  clubs[club.slot] = club;
  return { ...state, clubs };
};

/* ------------------------------------------------------- the pool views -- */

/** Every pool row for one settled week, slot order. */
export function poolRowsFor(state: HostLeagueState, week: number): PoolWeek[] {
  return poolOf(state)
    .filter((p) => p.week === week)
    .slice()
    .sort((a, b) => a.slot - b.slot);
}

/** What the live league put into the bowl in one settled week. */
export function bowlTotalFor(state: HostLeagueState, week: number): number {
  return poolRowsFor(state, week).reduce((s, p) => s + p.paidIn, 0);
}

/**
 * The rounding sentence for one week's equal split (test list item 8): the
 * bowl divides evenly across the live franchises with, at most, one dollar
 * of remainder per club, and this says exactly where that dollar landed
 * rather than leaving a silent gap between "equal split" and the total.
 */
export function poolRoundingNoteFor(state: HostLeagueState, week: number): string {
  const rows = poolRowsFor(state, week);
  if (rows.length === 0) return "";
  const bowl = rows.reduce((s, p) => s + p.paidIn, 0);
  const n = rows.length;
  const base = Math.floor(bowl / n);
  const remainder = bowl - base * n;
  if (remainder === 0) return `Split evenly: every one of the ${n} live franchises got $${base.toLocaleString()}.`;
  return `Split evenly at $${base.toLocaleString()} each, with $${remainder.toLocaleString()} left over from dividing $${bowl.toLocaleString()} by ${n} — that leftover dollar went to the first ${remainder} club${remainder === 1 ? "" : "s"} in the schedule, one extra dollar each, so the split lands on the bowl exactly.`;
}

/** Totals across every settled week, per live club, slot order. */
export type PoolTotals = { slot: number; club: string; paidInTotal: number; tookOutTotal: number; netTotal: number };
export function poolTotalsAll(state: HostLeagueState): PoolTotals[] {
  const bySlot = new Map<number, PoolTotals>();
  for (const p of poolOf(state)) {
    const cur = bySlot.get(p.slot) ?? { slot: p.slot, club: CLUBS[p.slot]!.short, paidInTotal: 0, tookOutTotal: 0, netTotal: 0 };
    cur.paidInTotal += p.paidIn;
    cur.tookOutTotal += p.tookOut;
    cur.netTotal += p.net;
    bySlot.set(p.slot, cur);
  }
  return Array.from(bySlot.values()).sort((a, b) => a.slot - b.slot);
}

/**
 * D62 R-14 EXTENSION — THE BEST-RESPONSE LAYER. One live club, one already-
 * settled week: holding every OTHER live club's recorded price and reinvest
 * for that week fixed (no other club's assessed local revenue can move —
 * `settleHome`'s `gate`/`localMediaFor` never read another club's price or
 * reinvest, only Draws printed before the week opened), brute-force THIS
 * club's own price x reinvest over the module's own legal grids (`PRICE_GRID`
 * x `SHARE_GRID`, 56 x 9 = 504 evaluations — inside the ~2,000-per-club-per-
 * week budget for a live press) through the SAME `settleHome` /
 * `poolSplitFor` calls `settleWeek` itself uses, at the supplied `levy`, and
 * return whichever cell maximises this club's own OBJECTIVE: this week's own
 * cash (`net + poolNet`, exactly what `settleWeek` would add to this club's
 * books that week) PLUS the Draw this reinvest buys valued FORWARD at
 * `profile.drawDollars` across the season's remaining settled weeks (zero on
 * the last one), RETAINED net of the levy's equal split — future local media
 * is assessed and pooled exactly like this week's (`assessedLocalRevenue =
 * gate + localMedia`), so only `(1 - levy) + levy / liveSlots.length` of that
 * future dollar is this club's own (see the retention comment inline and
 * `SIMPLIFICATIONS`). A pure single-week cash objective would brute-force to
 * reinvest = 0 always, since reinvest is pure cost the week it is paid.
 * `null` when the slot was not a live desk in that settled week (nothing to
 * re-decide).
 */
export function bestResponseFor(
  state: HostLeagueState,
  slot: number,
  weekIndex: number,
  levy: number,
): { price: number; reinvest: number; reinvestDollars: number; take: number } | null {
  const club = state.clubs.find((c) => c.slot === slot);
  if (!club || club.seatId === null) return null;
  const week = club.weeks[weekIndex];
  if (!week || week.stock) return null;
  const profile = profileOf(club);
  const capacity = week.home.capacity;
  const localMedia = week.localMedia;
  const size = state.leagueSize;
  const weekRows = poolRowsFor(state, weekIndex);
  const liveSlots = weekRows.some((p) => p.slot === slot) ? weekRows.map((p) => p.slot) : [...weekRows.map((p) => p.slot), slot];
  const assessedLocalRevenue: number[] = new Array(size).fill(0);
  for (const p of weekRows) assessedLocalRevenue[p.slot] = p.assessedLocalRevenue;

  let best: { price: number; reinvest: number; reinvestDollars: number; take: number } | null = null;
  for (const price of PRICE_GRID) {
    const home = settleHome(profile, capacity, week.hostDrawBefore, week.visitorDrawBefore, price);
    assessedLocalRevenue[slot] = home.gate + localMedia;
    for (const reinvest of SHARE_GRID) {
      const reinvestDollars = Math.round((reinvest / 100) * home.doorMoney);
      const net = home.doorMoney + localMedia + NATIONAL - profile.bill - reinvestDollars;
      const { paidIn, tookOut } = poolSplitFor(size, liveSlots, assessedLocalRevenue, levy);
      const poolNet = (tookOut[slot] ?? 0) - (paidIn[slot] ?? 0);
      // Forward half of the objective: the Draw this reinvest buys earns nothing
      // THIS week (`reinvestRuleFor`'s own "LAST WEEK" framing) — it is worth the
      // extra local media/sponsorship it draws on every REMAINING settled week,
      // priced at `profile.drawDollars`, the shipped per-Draw-point rate
      // `localMediaFor` already charges every week. Zero on the last settled
      // week, matching that framing exactly. Ignores any forward gate-side Draw
      // benefit (`ownDrawFans` in `settleHome`) — see `SIMPLIFICATIONS`.
      const drawAfter = nextDraw(profile, week.hostDrawBefore, reinvestDollars);
      // The Draw this reinvest buys shows up as MORE local media in a future
      // week, which THE POOL then assesses and splits equally (`poolSplitFor`,
      // same as line ~1373's `assessedLocalRevenue = gate + localMedia`) — so
      // the club keeps only `(1 - levy) + levy / liveSlots.length` of every
      // extra future local-media dollar its own Draw earns, never the whole
      // dollar. At `levy = 0` this retention factor is exactly 1 (no bowl, no
      // split, nothing lost) — the free-ride mechanism itself is what makes
      // the levy move this argmax at all.
      const retained = (1 - levy) + levy / liveSlots.length;
      const forwardDrawValue = (drawAfter - week.hostDrawBefore) * profile.drawDollars * (WEEK_COUNT - 1 - weekIndex) * retained;
      const take = net + poolNet + forwardDrawValue;
      if (best === null || take > best.take + 1e-9) {
        best = { price, reinvest, reinvestDollars, take };
      }
    }
  }
  return best;
}

/**
 * D62 R-14 EXTENSION. Every live club's own best-response reinvest, mean over
 * the three settled weeks, at the room's actual levy versus at levy 0 —
 * `bestResponseFor` run twice per club per week. This is the number the
 * held-dial replay above cannot produce (`reinvestWithBowl === reinvestNoBowl`
 * always there, by construction): a re-decided dial, not a played one.
 */
function bestResponseSummaryFor(state: HostLeagueState): NoBowlBestResponse {
  const totals = poolTotalsAll(state);
  const levy = levyOf(state);
  const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  const rows: NoBowlBestResponseRow[] = totals.map((t): NoBowlBestResponseRow => {
    const withBowl: { reinvest: number; dollars: number }[] = [];
    const noBowl: { reinvest: number; dollars: number }[] = [];
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      const wb = bestResponseFor(state, t.slot, w, levy);
      const nb = bestResponseFor(state, t.slot, w, 0);
      if (wb) withBowl.push({ reinvest: wb.reinvest, dollars: wb.reinvestDollars });
      if (nb) noBowl.push({ reinvest: nb.reinvest, dollars: nb.reinvestDollars });
    }
    return {
      slot: t.slot,
      club: t.club,
      bestReinvestWithBowl: Math.round(mean(withBowl.map((x) => x.reinvest))),
      bestReinvestNoBowl: Math.round(mean(noBowl.map((x) => x.reinvest))),
      bestReinvestDollarsWithBowl: Math.round(mean(withBowl.map((x) => x.dollars))),
      bestReinvestDollarsNoBowl: Math.round(mean(noBowl.map((x) => x.dollars))),
    };
  });
  const leagueMeanWithBowl = Math.round(mean(rows.map((r) => r.bestReinvestWithBowl)));
  const leagueMeanNoBowl = Math.round(mean(rows.map((r) => r.bestReinvestNoBowl)));
  return {
    rows,
    leagueMeanWithBowl,
    leagueMeanNoBowl,
    line: `Had every club re-decided with no bowl, the room's best reinvest would have been ${leagueMeanNoBowl}% instead of ${leagueMeanWithBowl}%.`,
  };
}

/**
 * D62 R-14 — THE NO-BOWL SEASON. The same three weeks, every live desk's own
 * recorded price and reinvest held fixed, replayed with `levy = 0`: the
 * "before" this room never played, computed rather than invented.
 *
 * Reinvest (`reinvestPaid`) and every dollar figure that feeds it (`home`,
 * `localMedia`, draw evolution) never reads the levy in `settleWeek` — held
 * dials produce identical reinvest with or without the bowl, so
 * `reinvestWithBowl === reinvestNoBowl` always. The only thing the bowl ever
 * moves is cash, via the per-week pool net (`tookOut - paidIn`), computed
 * here at `levy = 0` through the exact same `poolSplitFor` `settleWeek`
 * calls — never a re-derived or assumed zero.
 */
export function computeNoBowl(state: HostLeagueState): NoBowlResult {
  const size = state.leagueSize;
  const totals = poolTotalsAll(state);
  const noBowlNetTotal = new Map<number, number>();
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const weekRows = poolRowsFor(state, w);
    if (weekRows.length === 0) continue;
    const liveSlots = weekRows.map((p) => p.slot);
    const assessedLocalRevenue: number[] = new Array(size).fill(0);
    for (const p of weekRows) assessedLocalRevenue[p.slot] = p.assessedLocalRevenue;
    const { paidIn, tookOut } = poolSplitFor(size, liveSlots, assessedLocalRevenue, 0);
    for (const slot of liveSlots) {
      noBowlNetTotal.set(slot, (noBowlNetTotal.get(slot) ?? 0) + (tookOut[slot]! - paidIn[slot]!));
    }
  }
  const rows: NoBowlRow[] = totals
    .map((t): NoBowlRow => {
      const club = state.clubs.find((c) => c.slot === t.slot)!;
      const cashWithBowl = club.cash;
      const cashNoBowl = cashWithBowl - t.netTotal + (noBowlNetTotal.get(t.slot) ?? 0);
      const reinvestTotal = club.weeks.filter((w) => !w.stock).reduce((s, w) => s + w.reinvestPaid, 0);
      return { slot: t.slot, club: t.club, cashWithBowl, cashNoBowl, reinvestWithBowl: reinvestTotal, reinvestNoBowl: reinvestTotal };
    })
    .sort((a, b) => a.slot - b.slot);
  const leagueReinvestWithBowl = Math.round(rows.reduce((s, r) => s + r.reinvestWithBowl, 0));
  const leagueReinvestNoBowl = Math.round(rows.reduce((s, r) => s + r.reinvestNoBowl, 0));
  return {
    rows,
    leagueReinvestWithBowl,
    leagueReinvestNoBowl,
    roomReinvestLineWithBowl: `With the bowl running, the room put back $${leagueReinvestWithBowl.toLocaleString()} of its own money across the whole season.`,
    roomReinvestLineNoBowl: `Replayed with no bowl at all — same prices, same reinvest calls — the room still puts back $${leagueReinvestNoBowl.toLocaleString()}. Nobody's reinvest call changes; only whose books the cash ends up sitting on does.`,
    bestResponse: bestResponseSummaryFor(state),
  };
}

/**
 * A 5-6 view of a pool net never prints a minus sign (`allowsNegatives:
 * false`) — direction words instead. At 7-8 it is signed.
 */
export function netDirectionLine(band: GradeBand, net: number): string {
  const abs = Math.abs(Math.round(net));
  if (band === "7-8") return `${net < 0 ? "-" : "+"}$${abs.toLocaleString()}`;
  if (net > 0) return `BROUGHT IN $${abs.toLocaleString()}`;
  if (net < 0) return `SENT AWAY $${abs.toLocaleString()}`;
  return "BROKE EVEN — $0";
}

/**
 * THE FREE RIDE (spec stage 6; Economic Truth ruling): defined on REINVEST,
 * never on pool contributions. The clubs that put back LEAST into their own
 * team, beside what they took OUT of the pool — not beside what they paid
 * in, and never ranked or scripted by market size. Two or three clubs, the
 * lowest mean reinvest share among live desks that have played at least one
 * week; ties broken by slot so the board is deterministic.
 */
export type FreeRideRow = { slot: number; club: string; meanReinvestShare: number; meanReinvestDollars: number; tookOutTotal: number };
/** 5-6 board projection of a FreeRideRow: no percent-shaped field at all. */
export type FreeRideRowBand56 = { slot: number; club: string; meanReinvestDollars: number; tookOutTotal: number };
export function freeRideRows(state: HostLeagueState): FreeRideRow[] {
  const totals = new Map(poolTotalsAll(state).map((t) => [t.slot, t.tookOutTotal]));
  const rows: FreeRideRow[] = [];
  for (const club of state.clubs) {
    if (club.seatId === null || club.weeks.length === 0) continue;
    const meanReinvestShare = club.weeks.reduce((s, w) => s + w.share, 0) / club.weeks.length;
    const meanReinvestDollars = club.weeks.reduce((s, w) => s + w.reinvestPaid, 0) / club.weeks.length;
    rows.push({ slot: club.slot, club: CLUBS[club.slot]!.short, meanReinvestShare, meanReinvestDollars, tookOutTotal: totals.get(club.slot) ?? 0 });
  }
  rows.sort((a, b) => a.meanReinvestShare - b.meanReinvestShare || a.slot - b.slot);
  return rows.slice(0, Math.min(3, rows.length));
}

/**
 * Band gate (D62 repair 4): 5-6 never sees a percent-shaped number. At 5-6
 * every FreeRideRow the board prints drops `meanReinvestShare` (a 0-100
 * share) and speaks only in dollars via `meanReinvestDollars`; 7-8 keeps
 * both. Same rows either way — only the field visible to the client differs.
 */
function freeRideRowsForBand(state: HostLeagueState, band: GradeBand): FreeRideRow[] | FreeRideRowBand56[] {
  const rows = freeRideRows(state);
  if (band === "5-6") {
    return rows.map(({ slot, club, meanReinvestDollars, tookOutTotal }) => ({ slot, club, meanReinvestDollars, tookOutTotal }));
  }
  return rows;
}

/**
 * The two-sentence honest reveal for one live club (non-negotiable 4): both
 * halves computed from THIS club's own numbers, never asserted as a rule
 * about market size — Economic Truth's measured check found market size does
 * not predict the pool's sign at the shipped constants, so nothing here may
 * claim it does. Returns null for a club that never played a week.
 */
export function poolTwoSentenceRevealFor(state: HostLeagueState, slot: number): { paidInLine: string; visitorGateLine: string } | null {
  const club = state.clubs[slot];
  if (!club || club.weeks.length === 0) return null;
  const totals = poolTotalsAll(state).find((t) => t.slot === slot);
  const paidIn = totals?.paidInTotal ?? 0;
  const tookOut = totals?.tookOutTotal ?? 0;
  const visitorDollars = club.weeks.reduce((s, w) => s + w.home.visitorDollars, 0);
  const name = CLUBS[slot]!.short;
  const paidInLine =
    paidIn === tookOut
      ? `${name} paid the same into the pool as it took out, across the weeks it played.`
      : paidIn > tookOut
        ? `${name} paid $${(paidIn - tookOut).toLocaleString()} more into the pool than it took out, across the weeks it played.`
        : `${name} took $${(tookOut - paidIn).toLocaleString()} more out of the pool than it paid in, across the weeks it played.`;
  const visitorGateLine = `${name}'s own gate was $${Math.round(visitorDollars).toLocaleString()} higher than it would have been in a league where the clubs visiting it could not afford to be worth watching.`;
  return { paidInLine, visitorGateLine };
}

/**
 * THE SPOTLIGHT — the module's own half of the runtime's Press Conference
 * primitive. Public only: the caller's own pool position and what THEIR
 * franchise knew when it locked, never another seat's dial.
 */
export function spotlightViewFor(state: HostLeagueState, seatId: SeatId, phase: CanonicalPhase): unknown {
  const slot = state.seatToSlot[seatId];
  if (slot === undefined) return null;
  const club = state.clubs[slot]!;
  const lastWeek = club.weeks[club.weeks.length - 1] ?? null;
  const position = poolPositionOf(club) ?? (lastWeek ? poolPositionOf(lastWeek) : null);
  return {
    phase,
    club: CLUBS[slot]!.short,
    marketBand: profileOf(club).sizeLabel,
    poolPosition: position,
    knewAssessedLastWeek: lastWeek ? lastWeek.home.gate + lastWeek.localMedia : null,
  };
}

/**
 * THE SHORTLIST. Ranked by contrast against the pool and by a mismatch
 * between a franchise's own stated position and what its dial actually did —
 * never by who is winning, never a coin flip (same purity contract as
 * `spotlightView`).
 */
export function pressCandidatesFor(state: HostLeagueState, phase: CanonicalPhase): readonly { seatId: SeatId; label: string; why: string }[] {
  const totals = new Map(poolTotalsAll(state).map((t) => [t.slot, t]));
  const out: { seatId: SeatId; label: string; why: string; score: number }[] = [];
  for (const club of state.clubs) {
    if (club.seatId === null) continue;
    const t = totals.get(club.slot);
    const chips = club.weeks.map((w) => poolPositionOf(w)?.chip).filter((c): c is PoolChip => c != null);
    const saidALot = chips.filter((c) => c === "a lot").length;
    const saidNothing = chips.filter((c) => c === "nothing").length;
    const meanShare = club.weeks.length > 0 ? club.weeks.reduce((s, w) => s + w.share, 0) / club.weeks.length : 0;
    const mismatch = (saidALot > 0 && meanShare <= SHARE_MIN + SHARE_STEP) || (saidNothing > 0 && meanShare >= SHARE_MAX - SHARE_STEP);
    const netAbs = t ? Math.abs(t.netTotal) : 0;
    const why = mismatch
      ? `Called its own pool position "${saidALot > 0 ? "a lot" : "nothing"}" while its own reinvest averaged ${Math.round(meanShare)} points a week — worth asking why the words and the dial did not match.`
      : t
        ? `${t.netTotal >= 0 ? "Took more out of the pool than it paid in" : "Paid more into the pool than it took out"}, across every week it played.`
        : "Never locked a week, so the pool never touched its books.";
    out.push({ seatId: club.seatId!, label: deskHandleFor(club), why, score: (mismatch ? 1_000_000 : 0) + netAbs });
  }
  return out.sort((a, b) => b.score - a.score).map(({ seatId, label, why }) => ({ seatId, label, why }));
}

/**
 * THE SEED OUT TO WEEK 6. Not a new envelope shape — `writeTheRule.
 * extractCarriedClubs` already reads `slot`/`draw`/`cash`/`weeks[].share`/
 * `weeks[].reinvestPaid` straight off `HostLeagueState.clubs` (the runtime
 * hands the whole state across as the seed's `state`, unmodified — see
 * `sessionService.ts`'s `createSession`). This is the convenience surface for
 * everything W5_W6_SPEC.md asks Week 6 to add, computed from fields already on
 * `state` (`pool`, `weeks[].poolPosition`) so a Week 6 reader can take these
 * numbers directly instead of re-deriving them.
 */
export type ClubSeedOut = {
  slot: number;
  draw: number;
  cash: number;
  paidInTotal: number;
  tookOutTotal: number;
  poolNet: number;
  marketBand: string;
  positionChips: PoolChip[];
  meanReinvestShare: number;
  meanReinvestDollars: number;
};
export function seedOutClubs(state: HostLeagueState): ClubSeedOut[] {
  const totals = new Map(poolTotalsAll(state).map((t) => [t.slot, t]));
  return state.clubs
    .filter((c) => c.seatId !== null)
    .map((c) => {
      const t = totals.get(c.slot);
      const positionChips = c.weeks.map((w) => poolPositionOf(w)?.chip).filter((chip): chip is PoolChip => chip != null);
      const meanReinvestShare = c.weeks.length > 0 ? c.weeks.reduce((s, w) => s + w.share, 0) / c.weeks.length : 0;
      const meanReinvestDollars = c.weeks.length > 0 ? c.weeks.reduce((s, w) => s + w.reinvestPaid, 0) / c.weeks.length : 0;
      return {
        slot: c.slot,
        draw: c.draw,
        cash: c.cash,
        paidInTotal: t?.paidInTotal ?? 0,
        tookOutTotal: t?.tookOutTotal ?? 0,
        poolNet: t?.netTotal ?? 0,
        marketBand: profileOf(c).sizeLabel,
        positionChips,
        meanReinvestShare,
        meanReinvestDollars,
      };
    });
}

/**
 * THE RITUAL, PROJECTOR HALF. Season-aggregate (all weeks played so far
 * summed per club), never a per-desk private figure, never a seat id — club
 * wordmarks only (non-negotiable 12). One stage of `POOL_RITUAL_STAGE_NAMES`
 * per press (`teacher:poolStage`), so every field below is null until the
 * stage that reveals it has been pressed. No chip count or paid-in/took-out
 * sign is asserted here as a market-size rule (Economic Truth ruling) — every
 * number is read straight off `state.pool`.
 */
export type PoolRitualBoard = {
  stage: number;
  stageName: string | null;
  levyLine: string;
  billLine: { club: string; assessed: number }[] | null;
  fill: { club: string; chips: number }[] | null;
  fillGrandTotal: number | null;
  bowlTotal: number | null;
  draw: { club: string; tookOut: number }[] | null;
  net: { club: string; paidIn: number; tookOut: number; netLine: string }[] | null;
  netPage: number;
  netPageCount: number;
  netPageLabel: string;
  freeRide: FreeRideRow[] | FreeRideRowBand56[] | null;
  roundingNote: string | null;
  /** D61 R-12: the dollars other clubs' fans put on each live club's own books, summed across every week it played. Never a seat identity. */
  visitorLine: { club: string; visitorDollars: number }[] | null;
  /** D62 repair 1: the dollars a club's own Draw put on OTHER clubs' books on its away nights, summed across every week it played. Same stage as visitorLine, no seat identity. */
  roadLine: { club: string; roadDollars: number }[] | null;
};
const POOL_CHIP_UNIT = 50_000;

/** D61 R-12 — THE VISITOR LINE. Season sum of `HomeSettlement.visitorDollars` per live club, slot order. */
export function visitorLineFor(state: HostLeagueState): { slot: number; club: string; visitorDollars: number }[] {
  return state.clubs
    .filter((c) => c.seatId !== null)
    .sort((a, b) => a.slot - b.slot)
    .map((c) => ({ slot: c.slot, club: CLUBS[c.slot]!.short, visitorDollars: Math.round(c.weeks.reduce((s, w) => s + w.home.visitorDollars, 0)) }));
}

/** D62 repair 1 — THE ROAD LINE. Season sum of `SettledWeek.roadDollars` per live club (what its own Draw put on someone else's books on its away nights), slot order. */
export function roadLineFor(state: HostLeagueState): { slot: number; club: string; roadDollars: number }[] {
  return state.clubs
    .filter((c) => c.seatId !== null)
    .sort((a, b) => a.slot - b.slot)
    .map((c) => ({ slot: c.slot, club: CLUBS[c.slot]!.short, roadDollars: Math.round(c.weeks.reduce((s, w) => s + w.roadDollars, 0)) }));
}

export function poolRitualBoardFor(state: HostLeagueState, band: GradeBand): PoolRitualBoard | null {
  const stage = ritualStageOf(state);
  if (stage === 0) return null;
  const liveClubs = state.clubs.filter((c) => c.seatId !== null).sort((a, b) => a.slot - b.slot);
  const totals = poolTotalsAll(state);
  const totalFor = (slot: number): PoolTotals | undefined => totals.find((t) => t.slot === slot);
  const assessedTotals = new Map<number, number>();
  for (const p of poolOf(state)) assessedTotals.set(p.slot, (assessedTotals.get(p.slot) ?? 0) + p.assessedLocalRevenue);

  const billLine = stage >= 1 ? liveClubs.map((c) => ({ club: CLUBS[c.slot]!.short, assessed: Math.round(assessedTotals.get(c.slot) ?? 0) })) : null;
  const fill = stage >= 2 ? liveClubs.map((c) => ({ club: CLUBS[c.slot]!.short, chips: Math.max(0, Math.round((assessedTotals.get(c.slot) ?? 0) / POOL_CHIP_UNIT)) })) : null;
  const bowlTotal = totals.reduce((s, t) => s + t.paidInTotal, 0);
  // Beside THE BOWL STANDS (stage 3): the room's shared-product number, not
  // the pool's — teacher-pressed together, never conflated as the same pipe.
  const visitorLine = stage >= 3 ? visitorLineFor(state).map(({ club, visitorDollars }) => ({ club, visitorDollars })) : null;
  const roadLine = stage >= 3 ? roadLineFor(state).map(({ club, roadDollars }) => ({ club, roadDollars })) : null;
  const draw = stage >= 4 ? liveClubs.map((c) => ({ club: CLUBS[c.slot]!.short, tookOut: totalFor(c.slot)?.tookOutTotal ?? 0 })) : null;
  const netRows =
    stage >= 5
      ? liveClubs.map((c) => {
          const t = totalFor(c.slot);
          return { club: CLUBS[c.slot]!.short, paidIn: t?.paidInTotal ?? 0, tookOut: t?.tookOutTotal ?? 0, netLine: netDirectionLine(band, t?.netTotal ?? 0) };
        })
      : null;
  const netPageCount = netRows ? barPageCount(netRows.length) : 1;
  const netPage = Math.min(poolPageOf(state), netPageCount - 1);
  const netPaged = netRows ? netRows.slice(netPage * BARS_PER_PAGE, netPage * BARS_PER_PAGE + BARS_PER_PAGE) : null;

  return {
    stage,
    stageName: POOL_RITUAL_STAGE_NAMES[stage - 1] ?? null,
    levyLine: levyLineFor(band),
    billLine,
    fill,
    fillGrandTotal: fill ? bowlTotal : null,
    bowlTotal: stage >= 3 ? bowlTotal : null,
    visitorLine,
    roadLine,
    draw,
    net: netPaged,
    netPage: netPage + 1,
    netPageCount,
    netPageLabel: netRows && netPageCount > 1 ? `Group ${netPage + 1} of ${netPageCount}` : "",
    freeRide: stage >= 6 ? freeRideRowsForBand(state, band) : null,
    roundingNote:
      stage >= 3
        ? "Split evenly among the live franchises every week the bowl filled; any leftover dollar that week went to the first club in the schedule."
        : null,
  };
}

/** THE RITUAL, DIRECTOR HALF — one NOW / ASK / DON'T EXPLAIN YET / TRIGGER beat per stage, keyed to `ritualStage`. */
function poolRitualDirectorBeat(
  state: HostLeagueState,
  ritual: number,
): { now: string[]; ask: { q: string; answer: string | null }[]; dontExplainYet: string[]; trigger: string | null } {
  if (ritual === 0) {
    return {
      now: ["The five-stage season reveal is done. Press THE BILL LINE to start the pool — a bowl every building in the league pays into, whether it locked every week or not."],
      ask: [],
      dontExplainYet: ["Do not say the levy's number as a percent. It is printed as \"$2 out of every $10\" and nothing else."],
      trigger: "Next press: THE BILL LINE (1 of 6).",
    };
  }
  const stageName = POOL_RITUAL_STAGE_NAMES[ritual - 1] ?? "the next stage";
  const beats: Record<number, { now: string[]; ask: { q: string; answer: string | null }[]; dontExplainYet: string[] }> = {
    1: {
      now: ["One row per club, this week's — this season's — assessed money. Read one row out loud and stop. Say nothing about who is bigger or smaller."],
      ask: [],
      dontExplainYet: ["Do not say which building will pay the most into the bowl. Let FILL show them."],
    },
    2: {
      now: ["Press FILL and say nothing while it fills. One chip per $50,000 assessed. Let the room count for itself.", "A desk that never locked a week still paid into this bowl — sitting a week out lowers nothing it owes."],
      ask: [],
      dontExplainYet: ["Do not predict which building drops the most chips. The room is about to see it, and a wrong guess from you costs the beat its whole tension."],
    },
    3: {
      now: ["One number, large. Hold silence seven seconds before you say anything.", "THE VISITOR LINE is beside it — the money other clubs' fans put on each building's own books this season. Read it as a SEPARATE number from the bowl, never added to it."],
      ask: [{ q: "That's what the league put in. What do you think comes back out — the same amounts, or something else?", answer: "Hold it. DRAW answers it in one press." }],
      dontExplainYet: ["Not \"fair\" or \"unfair\" yet. Just the number."],
    },
    4: {
      now: ["Press DRAW. Every outflow bar is identical while every inflow bar was not — that contrast is the whole lesson. No caption needed."],
      ask: [{ q: "Every building just got the same amount back. Did every building put in the same amount?", answer: null }],
      dontExplainYet: ["Still no \"fair\"."],
    },
    5: {
      now: ["PAID IN / TOOK OUT / NET, one page at a time. Page through every club before you argue about any one of them."],
      ask: [{ q: "Find a building that paid in more than it took out. Is that the same building whose own gate was the biggest in the league?", answer: "Sometimes, not always — market size does not decide this on its own. Read the actual row before answering for them." }],
      dontExplainYet: ["Do not say \"sharing pays the payer.\" It usually doesn't, and the room's own numbers are about to show you which way it actually went."],
    },
    6: {
      now: ["THE FREE RIDE — the two or three buildings that put back the LEAST into their own team, beside what they drew out of the bowl. This is about REINVEST, not about who paid the most into the pool."],
      ask: [{ q: `${freeRideRows(state)[0]?.club ?? "One building"} put back the least of anyone and still drew the same split as everybody else. Is that a problem?`, answer: "Hold it — do not resolve it. This grievance is next lesson's fuel." }],
      dontExplainYet: ["Do not say free-riding or externality. Not one of them, not yet — that is Week 6's word."],
    },
  };
  const beat = beats[ritual] ?? { now: [], ask: [], dontExplainYet: [] };
  if (ritual >= POOL_RITUAL_STEPS && bandOfRoom(state) === "7-8") {
    // D62 R-14. 7-8 only, and only after the room has seen its own season AND
    // the whole pool ritual — the computed "before" this room never played.
    const run = noBowlOf(state) !== null;
    return {
      now: run
        ? [...beat.now, "THE NO-BOWL SEASON is up: same prices, same reinvest calls, levy at zero. Read the room's total reinvest line first — it did not move. Then read one club's cash both ways."]
        : [...beat.now, "One more press, 7-8 only: THE NO-BOWL SEASON — the same three weeks replayed with no levy at all, computed from what this room actually did."],
      ask: run
        ? [...beat.ask, { q: "Did the room put back less into its own teams because of the bowl?", answer: "No — the reinvest total is identical either way. The bowl never touched what anybody chose to spend; it only moved cash between clubs after the fact." }]
        : beat.ask,
      dontExplainYet: run ? beat.dontExplainYet : [...beat.dontExplainYet, "Do not let the room call this \"the bowl cost us money\" before you press it — press first, then read the reinvest line out loud."],
      trigger: run ? `${stageName} was the last stage. THE NO-BOWL SEASON has run. Move on to ADAPT.` : "Next press: THE NO-BOWL SEASON (7-8 only).",
    };
  }
  const trigger = ritual < POOL_RITUAL_STEPS ? `Next press: ${POOL_RITUAL_STAGE_NAMES[ritual] ?? "the next stage"} (${ritual + 1} of ${POOL_RITUAL_STEPS}).` : `${stageName} was the last stage. Move on to ADAPT.`;
  return { ...beat, trigger };
}

export const hostTheLeagueModule: LessonModule<HostLeagueState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 2 — You Don't Play Alone",
  phases: PHASES,

  /**
   * SEEDING: superseded. This header used to argue for none, on three
   * grounds that still stand for L1's HIDDEN demand terms (BC-5 attribution,
   * the two-markets-to-one-club mapping, and the national check making
   * carried cash mechanically inert). D59 / W5_W6_SPEC.md narrows the carry
   * to exactly what those three objections do not cover: cash, and only
   * cash, and only per club, validated defensively against an envelope this
   * module does not control the shape of on the sending side (Full House is
   * being extended concurrently — see `readWeek4Seed`).
   *
   *  1. Still true: no per-desk demand term is carried. Only `cash` moves.
   *  2. Still true: no market is carried. `readWeek4Seed` reads `slot`, which
   *     is this league's own club index, not Full House's market id.
   *  3. No longer a reason to skip the carry: the point is not that the
   *     penalty survives week 1 (it may not, if the national check clears
   *     it) — the point is that a franchise that missed its Week 4 bill
   *     opens Week 5 having been TOLD so, on its own how-you-got-here card,
   *     before it prices anything. That is a narrative/attribution fact, not
   *     a mechanical one, and it is the one thing D59's seed-in rule actually
   *     asks for.
   *
   * The lesson-level chain in copy (L1 closes on "most of the people in your
   * building came to see somebody else's team"; this lesson opens on it)
   * still stands unchanged.
   */
  initialState(input) {
    const seedResult = readWeek4Seed(input.seed, input.gradeBand);
    const carried = seedResult.clubs;
    const clubs: Club[] = [];
    for (let i = 0; i < MIN_LEAGUE; i += 1) clubs.push(makeClub(i, carried));
    return {
      clubs,
      seatToSlot: {},
      deskCount: 0,
      leagueSize: MIN_LEAGUE,
      leagueFrozen: false,
      weekIndex: 0,
      shockSlot: null,
      barReleased: false,
      barReleasedAtWeek: null,
      lockedAtBarRelease: null,
      revealStage: 0,
      barPage: 0,
      synthPage: 0,
      gradeBand: input.gradeBand,
      carried,
      seedNote: seedResult.note,
      levy: LEVY_FRACTION,
      pool: [],
      ritualStage: 0,
      poolPage: 0,
    };
  },

  /**
   * Manual-fallback discipline: no reveal in this lesson depends on a click
   * that may never come. Leaving PLAY settles every week still open (the first
   * one on the pairs' own dials, per D17's honour-what-was-submitted
   * precedent) and releases the mid-lesson bar; leaving REVEAL plays out every
   * remaining stage.
   */
  /**
   * TIME CUT for You Don't Play Alone. The round is a WEEK.
   *
   * Same policy as Lesson 1, for the same reason and stated in the club's own
   * terms: a club that never locks plays the week at its house price with
   * nothing put back in. The league-office clubs are not desks and are never
   * unresolved — they always have a line to play.
   */
  round: {
    closeHook: "teacher:closeWeek",
    noun: "week",
    fallbackPolicy:
      "A club that never locks plays this week at its own house price with nothing put back into the club — the dial it is sitting on does not count as a decision.",
    currentKey(state, phase) {
      if (phase !== "PLAY") return null;
      return state.weekIndex < WEEK_COUNT ? `W${state.weekIndex + 1}` : null;
    },
    unresolved(state, phase, seatIds) {
      if (phase !== "PLAY" || state.weekIndex >= WEEK_COUNT) return [];
      const seated = new Set(seatIds);
      const out: UnresolvedSeat[] = [];
      for (const club of state.clubs) {
        if (club.seatId === null || !seated.has(club.seatId) || club.locked) continue;
        const house = profileOf(club).housePrice;
        out.push({
          seatId: club.seatId,
          label: deskHandleFor(club),
          fallback:
            club.price === house && club.share === 0
              ? `plays at its $${house} house price (their dial is already there)`
              : `plays at its $${house} house price, NOT the $${club.price} on their dial`,
          selfFallback:
            club.price === house && club.share === 0
              ? `Lock in, or this week plays at your $${house} house price — which is where your dial already is.`
              : `Lock in, or this week plays at your $${house} house price, NOT the $${club.price} you have dialled.`,
        });
      }
      return out;
    },
  },

  /**
   * WHILE YOU WERE AWAY, in this lesson's nouns. Class-level only — the log is
   * read back by whichever desk returns, so nothing about one club's books can
   * be written into it. See `LessonModule.classEvents`.
   */
  classEvents(prev, next, { fromPhase, toPhase }) {
    const out: string[] = [];
    // Forward only. A restore rewinds the log with the state, and a differ that
    // fired on the way back would announce a week the teacher took back.
    for (let w = prev.weekIndex; w < next.weekIndex; w += 1) {
      out.push(`Week ${w + 1} closed. Every building in the league settled at once against the Draws that were already printed.`);
    }
    if (!prev.barReleased && next.barReleased) {
      out.push("The Handed-To-You bar went up on the projector \u2014 who actually filled each building.");
    }
    for (let i = prev.revealStage; i < next.revealStage; i += 1) {
      const stage = REVEAL_STAGES[i];
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
    if (fromPhase === "HOOK") next = { ...next, leagueFrozen: true };
    if (fromPhase === "PLAY") {
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
      if (!next.barReleased) next = { ...next, barReleased: true, barReleasedAtWeek: next.weekIndex, lockedAtBarRelease: lockedNow(next) };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    // Manual-fallback discipline again, for the ritual: a teacher who advances
    // past REVEAL before pressing all six pool stages does not strand the
    // room mid-bowl. The ECONOMICS (`state.pool`) was already complete the
    // moment the third week settled — only the REVEAL of it was staged.
    if (fromPhase === "REVEAL" && ritualStageOf(next) < POOL_RITUAL_STEPS) next = { ...next, ritualStage: POOL_RITUAL_STEPS };
    return next;
  },

  reduce(state, action: LessonAction, ctx: ReduceContext): ReduceResult<HostLeagueState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk can take a club" };
      // W5 N-3: after the weeks are closed there is no club to hand out, but a
      // refusal is not an answer either — the device retried forever. Record the
      // pair instead; their screen and /teach both get told.
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") return seatLate(state, ctx.seatId);
      return seatDesk(state, ctx.seatId);
    }

    if (action.type === "setPrice" || action.type === "setShare" || action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only run a week during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk can work a club" };
      const open = requireOpenClub(state, ctx.seatId);
      if (!open.ok) return { ok: false, reason: open.reason };
      if (action.type === "setPrice") {
        if (!isValidPrice(action["price"])) {
          return { ok: false, reason: `price must be $${PRICE_MIN}-$${PRICE_MAX} in $${PRICE_STEP} steps` };
        }
        return { ok: true, state: withClub(state, { ...open.club, price: action["price"] as number }) };
      }
      if (action.type === "setShare") {
        if (!isValidShare(action["share"])) {
          return { ok: false, reason: `reinvest must be ${SHARE_MIN}-${SHARE_MAX}% in ${SHARE_STEP}-point steps` };
        }
        return { ok: true, state: withClub(state, { ...open.club, share: action["share"] as number }) };
      }
      // Locking is what freezes the league: a pairing a pair has already priced
      // against can never change under them.
      return { ok: true, state: { ...withClub(state, { ...open.club, locked: true }), leagueFrozen: true } };
    }

    if (action.type === "teacher:closeWeek") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher closes the week" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `weeks close during PLAY (session is in ${ctx.phase})` };
      if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "all three weeks are already in the books" };
      return { ok: true, state: settleWeek({ ...state, leagueFrozen: true }, false) };
    }

    if (action.type === "teacher:handedTo") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher releases the Handed-To-You bar" };
      if (ctx.phase !== "PLAY" && ctx.phase !== "REVEAL") {
        return { ok: false, reason: `the bar is released in PLAY or REVEAL (session is in ${ctx.phase})` };
      }
      if (state.weekIndex < 1) return { ok: false, reason: "close week 1 first — the bar is drawn on weeks the room has played" };
      if (state.barReleased) return { ok: false, reason: "the Handed-To-You bar is already up" };
      // projector W4-1: stamp WHO HAD ALREADY COMMITTED, not just when. The
      // prescribed press (straight after the week-2 bell) and a mid-week-3
      // press both stamp `weekIndex === WEEK_COUNT - 1`; only this tells them
      // apart, and stage 5 says something different about each.
      return { ok: true, state: { ...state, barReleased: true, barReleasedAtWeek: state.weekIndex, lockedAtBarRelease: lockedNow(state) } };
    }

    if (action.type === "gateCall") {
      // The locked-and-waiting beat. Free, carries no money, changes no settled
      // number — its whole job is to have the pair COMMIT to a reading of the
      // crowd before the building answers. Changeable while the week is open on
      // purpose: a fifth-grader's misclick must not lock a wrong call in for a
      // whole week, and the commitment that matters is the one standing when
      // the bell rings, which is what the settlement freezes.
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk calls the gate" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the gate is called during PLAY (session is in ${ctx.phase})` };
      const slot = state.seatToSlot[ctx.seatId];
      if (slot === undefined) return { ok: false, reason: "this seat has no club" };
      const club = state.clubs[slot]!;
      if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "the season is in the books" };
      if (!club.locked) return { ok: false, reason: "commit your price first — the call is what you do while the room finishes" };
      const band = action["band"];
      if (band !== "packed" && band !== "busy" && band !== "quiet") return { ok: false, reason: "call it packed, busy or quiet" };
      const clubs = state.clubs.slice();
      clubs[slot] = { ...club, gateCall: band };
      return { ok: true, state: { ...state, clubs } };
    }

    if (action.type === "ledgerPredict") {
      // ONE CALL, before beat 2 answers it. This changes no economics and no
      // settled number: it is the difference between a reveal happening TO the
      // room and WITH it. The desk was otherwise byte-identical across all six
      // presses of the teacher's advance button.
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk calls the ledger" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the call is taken during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= 2) return { ok: false, reason: "the ledger is already on the projector" };
      const choice = action["choice"];
      if (choice !== "gave" && choice !== "took") return { ok: false, reason: "call it gave or took" };
      const slot = state.seatToSlot[ctx.seatId];
      if (slot === undefined) return { ok: false, reason: "this seat has no club" };
      const clubs = state.clubs.slice();
      clubs[slot] = { ...clubs[slot]!, ledgerPrediction: choice };
      return { ok: true, state: { ...state, clubs } };
    }

    if (action.type === "teacher:revealNext") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher advances the reveal" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the reveal advances during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage >= REVEAL_STEPS) return { ok: false, reason: "every reveal stage has already played" };
      // Each staged beat opens on the FIRST group of desks. Without this the
      // ledger beat opens on whatever group the teacher happened to leave the
      // bar on two minutes earlier, which reads as a skipped page in front of
      // the room.
      return {
        ok: true,
        state: {
          ...state,
          revealStage: state.revealStage + 1,
          barReleased: true,
          barReleasedAtWeek: state.barReleased ? state.barReleasedAtWeek : state.weekIndex,
          lockedAtBarRelease: state.barReleased ? lockedAtBarRelease(state) : lockedNow(state),
          barPage: 0,
        },
      };
    }

    if (action.type === "teacher:barPage" || action.type === "teacher:barPageBack") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the Handed-To-You bar" };
      if (ctx.phase !== "PLAY" && ctx.phase !== "REVEAL" && ctx.phase !== "ADAPT") {
        return { ok: false, reason: `the bar is paged in PLAY, REVEAL or ADAPT (session is in ${ctx.phase})` };
      }
      const pages = barPageCount(computeAggregate(state).homeRevenueDecomposition.length);
      if (pages <= 1) return { ok: false, reason: "every desk on the bar is already on the projector" };
      const step = action.type === "teacher:barPage" ? 1 : pages - 1;
      return { ok: true, state: { ...state, barPage: ((state.barPage ?? 0) + step) % pages } };
    }

    if (action.type === "teacher:synthPage" || action.type === "teacher:synthPageBack") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher turns the synthesis cards" };
      if (ctx.phase !== "SYNTHESIS") {
        return { ok: false, reason: `the synthesis cards are turned during SYNTHESIS (session is in ${ctx.phase})` };
      }
      const pages = synthPageCount(synthesisCards(state, computeAggregate(state)).length);
      if (pages <= 1) return { ok: false, reason: "there is only one card to show" };
      const step = action.type === "teacher:synthPage" ? 1 : pages - 1;
      return { ok: true, state: { ...state, synthPage: ((state.synthPage ?? 0) + step) % pages } };
    }

    // W5 pool position capture (Bible §13.2): "This week I'm putting back
    // [chip] because [line]." Requires LOCKED, same beat as the gate call —
    // the room's own raw material for the Week 6 stakes card.
    if (action.type === "poolPosition") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk sets its own pool position" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the pool position is set during PLAY (session is in ${ctx.phase})` };
      const slot = state.seatToSlot[ctx.seatId];
      if (slot === undefined) return { ok: false, reason: "this seat has no club" };
      const club = state.clubs[slot]!;
      if (state.weekIndex >= WEEK_COUNT) return { ok: false, reason: "the season is in the books" };
      if (!club.locked) return { ok: false, reason: "lock your price in first — the pool position is a call you make while the room finishes" };
      const chip = action["chip"];
      if (chip !== "nothing" && chip !== "a little" && chip !== "a lot") {
        return { ok: false, reason: 'call your pool position "nothing", "a little" or "a lot"' };
      }
      const rawLine = action["line"];
      const line = typeof rawLine === "string" ? rawLine.trim().slice(0, 140) : "";
      const clubs = state.clubs.slice();
      clubs[slot] = { ...club, poolPosition: { chip: chip as PoolChip, line } };
      return { ok: true, state: { ...state, clubs } };
    }

    // THE RITUAL — six teacher presses, no timer (non-negotiable 9). Lives
    // inside REVEAL, after the existing five-stage season reveal has played,
    // so a room always sees its own season before it sees the league's bowl.
    if (action.type === "teacher:poolStage") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher advances the pool ritual" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the pool ritual runs during REVEAL (session is in ${ctx.phase})` };
      if (state.revealStage < REVEAL_STEPS) return { ok: false, reason: "finish the season reveal first — press REVEAL through its five stages" };
      const stage = ritualStageOf(state);
      if (stage >= POOL_RITUAL_STEPS) return { ok: false, reason: "every pool-ritual stage has already played" };
      return { ok: true, state: { ...state, ritualStage: stage + 1, poolPage: 0 } };
    }

    if (action.type === "teacher:poolPage" || action.type === "teacher:poolPageBack") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the pool ritual" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the pool ritual runs during REVEAL (session is in ${ctx.phase})` };
      // Stage 5 is NET — the only paged stage (spec: "PAID IN / TOOK OUT / NET per club... paged").
      if (ritualStageOf(state) !== 5) return { ok: false, reason: "paging is only available on the NET stage" };
      const rows = poolTotalsAll(state).length;
      const pages = barPageCount(rows);
      if (pages <= 1) return { ok: false, reason: "every club's net already fits on the projector" };
      const step = action.type === "teacher:poolPage" ? 1 : pages - 1;
      return { ok: true, state: { ...state, poolPage: (poolPageOf(state) + step) % pages } };
    }

    // D62 R-14 — THE NO-BOWL SEASON. 7-8 only, one press, after the room has
    // seen its own season AND the whole pool ritual — never a "before" week
    // the room plays, always a computed replay of the season it already did.
    if (action.type === "teacher:noBowl") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher runs the no-bowl comparison" };
      if (bandOfRoom(state) !== "7-8") return { ok: false, reason: "the no-bowl comparison only exists at 7-8" };
      if (ctx.phase !== "REVEAL") return { ok: false, reason: `the no-bowl comparison runs during REVEAL (session is in ${ctx.phase})` };
      if (ritualStageOf(state) < POOL_RITUAL_STEPS) return { ok: false, reason: "finish THE RITUAL first — every pool-ritual stage must have played" };
      if (state.weekIndex < WEEK_COUNT) return { ok: false, reason: "all three weeks must be settled first" };
      if (noBowlOf(state) !== null) return { ok: false, reason: "the no-bowl comparison has already run" };
      return { ok: true, state: { ...state, noBowl: computeNoBowl(state) } };
    }

    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "LOBBY" || phase === "HOOK") return ["takeSeat"];
    if (phase === "PLAY") return ["takeSeat", "setPrice", "setShare", "lock", "gateCall", "poolPosition"];
    if (phase === "REVEAL") return ["takeSeat", "ledgerPredict", "teacher:poolStage", "teacher:poolPage", "teacher:poolPageBack", "teacher:noBowl"];
    // W5 N-3: still offered, so a late device gets an answer instead of a 409 loop.
    return ["takeSeat"];
  },

  spotlightView: spotlightViewFor,
  pressCandidates: pressCandidatesFor,

  studentView(state, seatId, phase) {
    const slot = state.seatToSlot[seatId];
    const view = ((): Record<string, unknown> => {
      if (slot === undefined) {
        // W5 N-3: "finding your club…" was true in LOBBY and a lie afterwards.
        if (observersOf(state).includes(seatId)) {
          return {
            phase,
            seated: false,
            observer: true,
            message: "You got here after the last week closed, so there is no club left to hand you — the three weeks are already in the books.",
            observerAction:
              "Pull your chair up to the nearest desk and read their screen with them. Everything from here is the whole room's: the board, the argument, and the questions. You are not missing a turn, because nobody is taking one.",
          };
        }
        return { phase, seated: false, observer: false, message: "You're in! Finding your club…" };
      }
      const club = state.clubs[slot]!;
      const profile = profileOf(club);
      const identity = deskIdentity(state, club);
      const history = club.weeks.map((w) => viewWeek(state, club, w));
      const shockClub = state.shockSlot !== null ? clubCard(state, state.shockSlot) : null;

      switch (phase) {
        case "LOBBY":
          return {
            phase,
            seated: true,
            ...identity,
            message: `You have Desk ${club.deskNumber}. This lesson you run the ${identity.club}' building — ${identity.building}.`,
            plainLine: profile.plainLine,
            leagueSize: state.leagueSize,
          };

        case "HOOK":
          return {
            phase,
            seated: true,
            ...identity,
            message: HOOK_COPY,
            objective: OBJECTIVE_COPY,
            rules: HOUSE_RULES,
            plainLine: profile.plainLine,
            books: booksFor(club),
            horizonLine: HORIZON_LINE,
            modeledDollarsLine: MODELED_DOLLARS_SHORT,
            slate: slateFor(state, slot),
            league: state.clubs.slice(0, state.leagueSize).map((c) => clubCard(state, c.slot)),
            // W5 seed-in from Week 4 — a franchise's own how-you-got-here card, never silent.
            levyLine: levyLineFor(bandOfRoom(state)),
            weekFourNote: state.seedNote ?? null,
            howYouGotHere: (() => {
              const carry = carriedClubsOf(state).find((c) => c.slot === slot) ?? null;
              if (!carry) return null;
              return {
                cashOpening: carry.cashOpening,
                penalty: carry.penalty,
                billCleared: carry.billCleared,
                clamped: carry.clamped,
                line:
                  carry.penalty > 0
                    ? `You carried in from Week 4 having not cleared your own bill — a named $${carry.penalty.toLocaleString()} penalty, already taken off your opening books.`
                    : "You carried in from Week 4 having cleared your own bill.",
              };
            })(),
          };

        case "PLAY": {
          if (state.weekIndex >= WEEK_COUNT) {
            return {
              phase,
              seated: true,
              ...identity,
              allWeeksDone: true,
              books: booksFor(club),
              history,
              // WEEK 3'S SETTLEMENT. Every other week's result reaches the desk
              // because the NEXT week's pre-lock payload carries `lastSettled`
              // and the client draws it first. There is no week 4, so the last
              // week — the one with the retired reinvest dial, the highest
              // stakes and the whole lesson riding on it — was the only one that
              // settled into a three-row summary table and "look up at the
              // board". The biggest week produced the least feedback on the
              // device the pair is actually looking at.
              lastSettled: history[history.length - 1] ?? null,
              message: "That is week 3, and the season. Read what your last call did, then look up at the board.",
            };
          }
          const weekNumber = openWeekNumber(state);
          const hostingSlot = visitorSlotFor(slot, state.weekIndex, state.leagueSize);
          const visitingSlot = hostSlotFor(slot, state.weekIndex, state.leagueSize);
          // BLIND COMMITMENT: nothing in this payload is derived from the
          // pending price or share. The pair has the card, the printed Draws,
          // the schedule and its own realized history — and nothing else.
          return {
            phase,
            seated: true,
            ...identity,
            weekNumber,
            weekCount: WEEK_COUNT,
            lastWeek: weekNumber >= WEEK_COUNT,
            hosting: clubCard(state, hostingSlot),
            visiting: clubCard(state, visitingSlot),
            slate: slateFor(state, slot),
            shock:
              shockClub && state.weekIndex >= 1
                ? {
                    club: shockClub.short,
                    full: shockClub.name,
                    draw: shockClub.draw,
                    hostingThem: hostingSlot === state.shockSlot,
                    line: `${shockClub.name} has lost their best player. Their Draw has fallen to ${shockClub.draw} for the rest of the season.${
                      hostingSlot === state.shockSlot ? " They are the club visiting YOU this week." : ""
                    }`,
                  }
                : null,
            locked: club.locked,
            price: club.price,
            share: club.share,
            priceMin: PRICE_MIN,
            priceMax: PRICE_MAX,
            priceStep: PRICE_STEP,
            shareMin: SHARE_MIN,
            shareMax: SHARE_MAX,
            shareStep: SHARE_STEP,
            books: booksFor(club),
            rules: HOUSE_RULES,
            reinvestRule: reinvestRuleFor(weekNumber),
            modeledDollarsLine: MODELED_DOLLARS_SHORT,
            history,
            lastSettled: history[history.length - 1] ?? null,
            // The locked-and-waiting beat (W6 `play-l2-locked-dead-time`). The
            // room line is an aggregate, never a seat: /play still never learns
            // which desk is which.
            ...(club.locked
              ? {
                  gateCall: {
                    prompt: GATE_CALL_PROMPT,
                    heading: GATE_CALL_HEADING,
                    bands: GATE_BANDS,
                    called: club.gateCall ?? null,
                    foot: club.gateCall ? gateCallFootCalledFor(defOf(club).building) : GATE_CALL_FOOT_OPEN,
                    building: defOf(club).building,
                    capacity: defOf(club).capacity,
                    room: roomLockLine(state),
                  },
                  // W5 pool position capture (Bible §13.2). Two inputs, taken
                  // while locked and waiting for the room — this desk's own
                  // raw material for the Week 6 stakes card. Never another
                  // seat's chip or line.
                  poolPosition: {
                    prompt: "This week I'm putting back",
                    chips: POOL_CHIPS,
                    current: poolPositionOf(club),
                    levyLine: levyLineFor(bandOfRoom(state)),
                  },
                }
              : {}),
            message: club.locked
              ? "Your price is in. The week closes when your teacher says so."
              : "No preview. Read the card, read the Draws, and commit.",
          };
        }

        case "REVEAL":
        case "ADAPT": {
          const agg = computeAggregate(state);
          const mine = agg.homeRevenueDecomposition.find((d) => d.slot === slot) ?? null;
          const give = agg.giveAndTake.find((g) => g.slot === slot) ?? null;
          const beat = phase === "ADAPT" ? REVEAL_STEPS : state.revealStage;
          // Beat 4's version of this desk: the home week that took the most at
          // the door, and who was in the building for it.
          const bestSettled =
            club.weeks.length > 0 ? club.weeks.reduce((a, b) => (b.home.doorMoney > a.home.doorMoney ? b : a)) : null;
          const bestHomeWeek = bestSettled
            ? {
                week: bestSettled.week,
                price: bestSettled.price,
                visitor: defOf(state.clubs[bestSettled.visitorSlot]!).short,
                visitorDraw: bestSettled.visitorDrawBefore,
                turnout: bestSettled.home.turnout,
                doorMoney: Math.round(bestSettled.home.doorMoney),
                visitorDollars: Math.round(bestSettled.home.visitorDollars),
              }
            : null;
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(club),
            history,
            // ONE BEAT AT A TIME, IN THE PAYLOAD — not only in the renderer.
            // Gating this on the client would leave every beat's numbers sitting
            // in the desk's payload from beat 0, one devtools panel away, and
            // would put the choreography in a place no unit test can reach. The
            // beat a number belongs to is a property of the lesson, so the
            // lesson decides it.
            ...(beat >= 1 && mine
              ? {
                  doorBlocks: {
                    fromBuilding: mine.fromBuilding,
                    fromOwnDraw: mine.fromOwnDraw,
                    fromVisitorDraw: mine.fromVisitorDraw,
                    visitors: mine.visitors,
                  },
                }
              : {}),
            ...(beat >= 2 && give ? { give } : {}),
            ...(beat >= 3 && mine ? { mine } : {}),
            ...(beat >= 4 && bestHomeWeek ? { bestNight: bestHomeWeek } : {}),
            ...(beat >= 5 ? { ownReinvest: club.weeks.map((w) => ({ week: w.week, share: w.share, auto: w.auto })) } : {}),
            // D62 R-14 — THE NO-BOWL SEASON. This desk's own two rows only,
            // and only once the teacher has pressed it. 7-8 only; absent (not
            // null) at 5-6 and before the press.
            ...(bandOfRoom(state) === "7-8" && noBowlOf(state)
              ? {
                  noBowl: (() => {
                    const nb = noBowlOf(state)!;
                    const row = nb.rows.find((r) => r.slot === slot) ?? null;
                    const brRow = nb.bestResponse.rows.find((r) => r.slot === slot) ?? null;
                    return row
                      ? {
                          club: row.club,
                          cashWithBowl: row.cashWithBowl,
                          cashNoBowl: row.cashNoBowl,
                          reinvestWithBowl: row.reinvestWithBowl,
                          reinvestNoBowl: row.reinvestNoBowl,
                          // D62 R-14 EXTENSION — this desk's own re-decided best
                          // reinvest only, both ways.
                          bestResponse: brRow
                            ? {
                                bestReinvestWithBowl: brRow.bestReinvestWithBowl,
                                bestReinvestNoBowl: brRow.bestReinvestNoBowl,
                                bestReinvestDollarsWithBowl: brRow.bestReinvestDollarsWithBowl,
                                bestReinvestDollarsNoBowl: brRow.bestReinvestDollarsNoBowl,
                              }
                            : null,
                        }
                      : null;
                  })(),
                }
              : {}),
            // play N-4: the free-riding desk's block is three zeroes, and the
            // sentence under it has to be about ITS decision, not about a
            // counterfactual identical to what it did.
            giveLine: beat >= 2 && give ? deskChoiceLineClaimed(give).text : "",
            // W5 B-1: the heading was the last hand-written branch on `spend`,
            // and it sat directly above the repaired sentence contradicting it.
            giveHeading: beat >= 2 && give ? deskChoiceHeadingClaimed(give).text : "",
            // econ FL-K: the "most of it was DEALT" sub-label is computed, not asserted.
            dealtLine: beat >= 2 && give ? dealtLineClaimed(give).text : "",
            revealStage: state.revealStage,
            totalRevealSteps: REVEAL_STEPS,
            /**
             * THE BEAT THE DESK IS ON.
             *
             * The reveal is five teacher-paced beats on the projector, and the
             * desk used to print EVERY number all five of them are about from
             * beat 0 — the season decomposition, the full give-and-take ledger,
             * the four pipes — before the teacher had revealed anything. The
             * student device was spoiling the projector: a pair that looked down
             * had already read the answer to every question the room was about
             * to be asked, and the choreography the whole lesson is built around
             * was defeated by the screen in front of them.
             *
             * The desk now unfolds WITH the board, one beat at a time, showing
             * this club's own version of the beat that is up:
             *   1  the three door blocks — who filled THIS building
             *   2  this desk's give-and-take ledger (and the call resolves)
             *   3  all five pipes, including the two nobody in the room can move
             *   4  this desk's biggest night and what made it
             *   5  this desk's own reinvest, week by week
             * ADAPT is after the reveal, so ADAPT shows everything.
             */
            deskBeat: beat,
            // ONE CALL, taken before beat 2 answers it, on this pair's own club.
            predictOpen: phase === "REVEAL" && state.revealStage < 2 && (club.ledgerPrediction ?? null) === null,
            predictPrompt:
              "Across your three home weeks: did YOUR drawing power put more money on other clubs' books than the clubs who visited you put on yours?",
            prediction: club.ledgerPrediction ?? null,
            // The verdict sentence is computed HERE, off the settled ledger,
            // rather than assembled on the client: it is a statement about what
            // this desk's own season did, and the claim audit is right that the
            // client is not the place to author one.
            predictionResolved: (() => {
              if (state.revealStage < 2 || (club.ledgerPrediction ?? null) === null || !give) return null;
              const actual: "gave" | "took" = give.gave > give.received ? "gave" : "took";
              const right = actual === club.ledgerPrediction;
              const said = club.ledgerPrediction === "gave" ? "you put more on theirs" : "they put more on yours";
              const was = actual === "gave" ? "You put more on theirs." : "They put more on yours.";
              return {
                actual,
                right,
                line: `You called ${said}. ${was} ${right ? "You had it." : "That is the one worth arguing about."}`,
              };
            })(),
            questions: phase === "ADAPT" ? ADAPT_QUESTIONS : [],
            message:
              phase === "ADAPT"
                ? "Talk to your partner before you answer out loud."
                : "Your three weeks, in the books. Look up at the board for the room's.",
          };
        }

        case "ARGUE":
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(club),
            argue: ARGUE_COPY,
            prompt: ARGUE_PROMPT,
            message: "Nothing to click. Everything to argue about.",
          };

        case "SYNTHESIS": {
          // The desk used to be one frozen sentence — "Look up at the board." —
          // byte-identical through every card the teacher turned, for the whole
          // last stretch of the period. It now mirrors the card the projector is
          // on, page for page, exactly as M2 L1 does: same registered title, same
          // computed body, nothing seat-private (this is the public board card).
          const cards = synthesisCards(state, computeAggregate(state));
          const pages = synthPageCount(cards.length);
          const page = Math.min(Math.max(0, state.synthPage ?? 0), pages - 1);
          const card = cards[page] ?? null;
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(club),
            message: "Look up at the board.",
            exitPrompt: EXIT_PROMPT,
            synthPage: page + 1,
            synthPageCount: pages,
            synthCardTitle: card?.title ?? "",
            synthCardBody: card?.body ?? "",
          };
        }

        case "COMPLETE":
          return { phase, seated: true, ...identity, books: booksFor(club), message: COMPLETE_COPY, exitPrompt: EXIT_PROMPT };

        default:
          return { phase, seated: true, ...identity };
      }
    })();
    return tag(view, bandOfRoom(state));
  },

  teacherView(state, phase) {
    const agg = computeAggregate(state);
    const desks = state.clubs
      .filter((c) => c.seatId !== null)
      .sort((a, b) => (a.deskNumber ?? 0) - (b.deskNumber ?? 0))
      .map((c) => ({
        seatId: c.seatId!,
        deskNumber: c.deskNumber,
        handle: deskHandleFor(c),
        club: CLUBS[c.slot]!.short,
        marketId: c.profileId,
        sizeLabel: PROFILE_BY_ID.get(c.profileId)!.sizeLabel,
        locked: c.locked,
        price: c.price,
        share: c.share,
        cash: c.cash,
        draw: c.draw,
        inDebt: c.cash < 0,
        weeksPlayed: c.weeks.length,
        // gate-l2-teacher B3 / hidden-knowledge: AUTO existed only on the
        // student's own private screen, so the teacher could not see, at any
        // point, that a desk had never once committed.
        autoWeeks: c.weeks.filter((w) => w.auto).length,
        neverLocked: c.weeks.length >= 1 && c.weeks.every((w) => w.auto || w.stock),
        coveredWeeks: c.weeks.filter((w) => w.stock).length,
        joinedAtWeek: c.joinedAtWeek,
        hostingThisWeek: state.weekIndex < WEEK_COUNT ? CLUBS[visitorSlotFor(c.slot, state.weekIndex, state.leagueSize)]!.short : null,
        lastFillPct: c.weeks[c.weeks.length - 1]?.home.fillPct ?? null,
      }));
    const barRows = agg.homeRevenueDecomposition;
    const barPages = barPageCount(barRows.length);
    const barPage = Math.min(Math.max(0, state.barPage ?? 0), barPages - 1);
    const cards = synthesisCards(state, agg);
    const synthPages = synthPageCount(cards.length);
    const synthPage = Math.min(Math.max(0, state.synthPage ?? 0), synthPages - 1);
    const synthTitle = (i: number): string => cards[i * SYNTH_CARDS_PER_PAGE]?.title ?? "";
    const stagesNow = revealStagesFor(state);
    // THE ROOM: the shape of the reinvest dial while the week is open.
    // Teacher-only — never handed to `boardView` (see roomRead).
    const room =
      state.weekIndex >= WEEK_COUNT
        ? null
        : roomRead(
            state.clubs
              .slice(0, state.leagueSize)
              .filter((c) => c.seatId !== null)
              .map((c) => {
                const own = [...c.weeks].reverse().find((w) => !w.auto && !w.stock) ?? null;
                return {
                  handle: deskHandleFor(c),
                  price: c.price,
                  share: c.share,
                  locked: c.locked,
                  weeksPlayed: c.weeks.length,
                  ownLastShare: own ? own.share : null,
                };
              }),
            state.weekIndex,
          );
    return tag({
      phase,
      room,
      // THE DESKS: the same room, named. Teacher-only — see deskStripOf().
      deskStrip: deskStripOf(state),
      weekIndex: state.weekIndex,
      weekNumber: openWeekNumber(state),
      weekCount: WEEK_COUNT,
      allWeeksDone: state.weekIndex >= WEEK_COUNT,
      leagueSize: state.leagueSize,
      deskCount: desks.length,
      lockedCount: desks.filter((d) => d.locked).length,
      barReleased: state.barReleased,
      barAvailable: state.weekIndex >= 1 && !state.barReleased,
      barReason: state.barReleased
        ? "Already on the projector."
        : state.weekIndex < 1
          ? "Available once week 1 is closed — the bar is drawn on weeks the room has played."
          : state.weekIndex < 2
            ? "Ready. It lands hardest after WEEK 2, when every desk has hosted two different clubs — but it is your call and the button waits."
            : "Ready. This is the moment: release it, then let them play week 3 knowing what they now know.",
      revealStage: state.revealStage,
      totalRevealSteps: REVEAL_STEPS,
      // projector W4-2: the stage list `/teach` prints is resolved against THIS
      // room's bar release, not the static script.
      revealStages: stagesNow,
      nextRevealStage: stagesNow[state.revealStage] ?? null,
      currentRevealStage: stagesNow[state.revealStage - 1] ?? null,
      barPage: barPage + 1,
      barPageCount: barPages,
      barRowTotal: barRows.length,
      barPageAvailable: (phase === "PLAY" || phase === "REVEAL" || phase === "ADAPT") && barPages > 1,
      barCurrentPageLabel:
        barRows.length === 0
          ? "No desk has played a home week yet."
          : barPages <= 1
            ? `On the projector: all ${barRows.length} desk${barRows.length === 1 ? "" : "s"}`
            : `On the projector now: group ${barPage + 1} of ${barPages} — ${barPageDeskNames(barRows, barPage)}`,
      barNextPageLabel:
        barPages <= 1
          ? barRows.length === 0
            ? "No desk has played a home week yet."
            : `All ${barRows.length} desk${barRows.length === 1 ? "" : "s"} are on the projector.`
          : `Next group — group ${((barPage + 1) % barPages) + 1} of ${barPages}: ${barPageDeskNames(barRows, (barPage + 1) % barPages)}`,
      barPrevPageLabel:
        barPages <= 1
          ? "Back a group"
          : `Back — group ${((barPage + barPages - 1) % barPages) + 1} of ${barPages}: ${barPageDeskNames(barRows, (barPage + barPages - 1) % barPages)}`,
      barPageNote:
        barPages <= 1
          ? "The whole bar fits on the projector in one look."
          : `The projector shows ${BARS_PER_PAGE} desks at a time so every bar stays readable from the back. The class summary underneath stays up for every group. Pressing past the last group comes back round to the first.`,
      synthPage: synthPage + 1,
      synthPageCount: synthPages,
      synthPageAvailable: phase === "SYNTHESIS" && synthPages > 1,
      synthCurrentLabel: synthPages <= 1 ? `On the projector: ${synthTitle(synthPage)}` : `On the projector now: card ${synthPage + 1} of ${synthPages} — ${synthTitle(synthPage)}`,
      synthNextLabel: synthPages <= 1 ? "One card only" : `Next card — ${((synthPage + 1) % synthPages) + 1} of ${synthPages}: ${synthTitle((synthPage + 1) % synthPages)}`,
      synthPrevLabel: synthPages <= 1 ? "Back a card" : `Back — card ${((synthPage + synthPages - 1) % synthPages) + 1}: ${synthTitle((synthPage + synthPages - 1) % synthPages)}`,
      synthPageNote: "One card at a time, in your own time. The outside-sports line stays up on every card; the exit question and the dated sources land on the last one.",
      shock:
        state.shockSlot !== null
          ? { club: CLUBS[state.shockSlot]!.name, short: CLUBS[state.shockSlot]!.short, draw: state.clubs[state.shockSlot]!.draw, live: state.clubs[state.shockSlot]!.seatId !== null }
          : null,
      desks,
      aggregate: agg,
      watchFor: teacherWatchFor(state, phase),
      director: teacherDirector(state, phase),
      projectorNow: projectorMirror(state, phase),
      studentScreen: studentScreenMechanics(state),
      simplifications: SIMPLIFICATIONS,
      bellNote:
        state.weekIndex >= WEEK_COUNT
          ? "All three weeks are in the books."
          : `Closing week ${openWeekNumber(state)} settles every building in the league at once, against the Draws that were printed before anybody touched a dial. A desk that has not locked settles at its club's house price with nothing reinvested, marked AUTO on its own screen — nobody is skipped and nobody gets a zero.`,
      // W5 seed-in from Week 4 — teacher-readable, never silent.
      seedNote: state.seedNote ?? null,
      carried: carriedClubsOf(state),
      // W5 THE POOL — teacher controls for the ritual, gated the same way the reducer gates the press.
      levyLine: levyLineFor(bandOfRoom(state)),
      ritualStage: ritualStageOf(state),
      ritualStageName: POOL_RITUAL_STAGE_NAMES[ritualStageOf(state) - 1] ?? null,
      ritualNextStageName: POOL_RITUAL_STAGE_NAMES[ritualStageOf(state)] ?? null,
      ritualStageCount: POOL_RITUAL_STEPS,
      ritualCanAdvance: phase === "REVEAL" && state.revealStage >= REVEAL_STEPS && ritualStageOf(state) < POOL_RITUAL_STEPS,
      ritualReady: phase === "REVEAL" && state.revealStage < REVEAL_STEPS ? "Finish the season reveal first — press REVEAL through its five stages before THE BILL LINE." : "",
      poolRitual: poolRitualBoardFor(state, bandOfRoom(state)),
      // D62 R-14 — THE NO-BOWL SEASON. 7-8 only, one press, after THE RITUAL
      // and every week is settled. `available` reflects whether the press can
      // fire NOW (false once it has already run — a second press is refused).
      noBowl: ((): { available: boolean; reason: string; run: boolean; rows: NoBowlRow[]; leagueLine: string; bestResponse: NoBowlBestResponse | null } => {
        const band = bandOfRoom(state);
        const nb = noBowlOf(state);
        const run = nb !== null;
        const ritualDone = ritualStageOf(state) >= POOL_RITUAL_STEPS;
        const weeksDone = state.weekIndex >= WEEK_COUNT;
        const reason =
          band !== "7-8"
            ? "The no-bowl comparison only exists at 7-8."
            : phase !== "REVEAL"
              ? "The no-bowl comparison runs during REVEAL."
              : !weeksDone
                ? "All three weeks must be settled first."
                : !ritualDone
                  ? "Finish THE RITUAL first — every pool-ritual stage must have played."
                  : run
                    ? "Already run."
                    : "Ready to press.";
        return {
          available: band === "7-8" && phase === "REVEAL" && weeksDone && ritualDone && !run,
          reason,
          run,
          rows: nb?.rows ?? [],
          leagueLine: nb ? `${nb.roomReinvestLineWithBowl} ${nb.roomReinvestLineNoBowl}` : "",
          // D62 R-14 EXTENSION — teacher gets the full best-response layer:
          // every club's row plus the league means and the Cap Room line.
          bestResponse: nb?.bestResponse ?? null,
        };
      })(),
    }, bandOfRoom(state));
  },

  boardView(state, phase) {
    const agg = computeAggregate(state);
    const barRows = agg.homeRevenueDecomposition;
    const barPages = barPageCount(barRows.length);
    const barPage = Math.min(Math.max(0, state.barPage ?? 0), barPages - 1);
    const pagedBars = barRows.slice(barPage * BARS_PER_PAGE, barPage * BARS_PER_PAGE + BARS_PER_PAGE);
    const barPageLabel =
      barRows.length === 0
        ? "No desk has played a home week yet."
        : barPages === 1
          ? `All ${barRows.length} desk${barRows.length === 1 ? "" : "s"}`
          : `Group ${barPage + 1} of ${barPages} — ${barPageDeskNames(barRows, barPage)}`;

    const view = ((): Record<string, unknown> => {
      switch (phase) {
        case "LOBBY":
          return {
            mode: "lobby",
            deskCount: agg.deskCount,
            leagueSize: state.leagueSize,
            league: state.clubs.slice(0, state.leagueSize).map((c) => clubCard(state, c.slot)),
            message: "This room is the league.",
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "HOOK":
          return {
            mode: "hook",
            message: HOOK_COPY,
            objective: OBJECTIVE_COPY,
            question: HOOK_QUESTION,
            realLine: HOOK_REAL_LINE,
            deskCount: agg.deskCount,
            league: state.clubs.slice(0, state.leagueSize).map((c) => clubCard(state, c.slot)),
            honestyLine: BOARD_HONESTY_LINE,
            horizonLine: HORIZON_LINE,
            modeledDollarsLine: MODELED_DOLLARS_LINE,
          };

        case "PLAY": {
          if (state.weekIndex >= WEEK_COUNT) {
            return {
              mode: "play",
              allWeeksDone: true,
              barReleased: state.barReleased,
              bars: state.barReleased ? pagedBars : [],
              barPageLabel,
              barSummary: agg.barSummary,
              message: "Three weeks, in the books.",
              subMessage: state.barReleased ? "" : "Nobody has seen the room's whole picture yet. It goes up one beat at a time.",
              honestyLine: BOARD_HONESTY_LINE,
            };
          }
          // W5 B-2: the frame is composed ONCE, here, and the same composition
          // is what /teach's mirror is written from. The board client already
          // dropped the pairing grid and the departure card the moment the bar
          // went up (the projector cannot scroll); shipping them anyway is what
          // let the teacher's description of the frame drift off the frame.
          const comp = playBoardComposition(state);
          const pairings = comp.showsPairings
            ? scheduleFor(state.weekIndex, state.leagueSize).map((p) => ({
                host: clubCard(state, p.host),
                visitor: clubCard(state, p.visitor),
              }))
            : [];
          return {
            mode: "play",
            weekNumber: comp.weekNumber,
            weekCount: WEEK_COUNT,
            pairings,
            lockedCount: agg.lockedCount,
            deskCount: agg.deskCount,
            shock:
              comp.showsShock
                ? { club: CLUBS[state.shockSlot!]!.name, short: CLUBS[state.shockSlot!]!.short, draw: state.clubs[state.shockSlot!]!.draw }
                : null,
            barReleased: state.barReleased,
            bars: state.barReleased ? pagedBars : [],
            barPageLabel,
            barSummary: state.barReleased ? agg.barSummary : "",
            barInstruction: state.barReleased ? "Point at the club that paid for your night." : "",
            feverCopy: state.barReleased ? FEVER_REVEAL_COPY : null,
            honestyLine: BOARD_HONESTY_LINE,
          };
        }

        case "REVEAL": {
          const stage = REVEAL_STAGES[state.revealStage - 1] ?? null;
          return {
            mode: "reveal",
            revealStage: state.revealStage,
            totalRevealSteps: REVEAL_STEPS,
            stageName: stage?.name ?? null,
            stageHeadline: stage?.headline ?? null,
            // One beat per press: each REVEAL stage owns its whole frame, so
            // nothing from the previous press is still on the projector under
            // it. `hostTheLeague.test.ts` asserts exactly one panel per stage.
            bars: state.revealStage === 1 ? pagedBars : [],
            barPageLabel,
            barSummary: state.revealStage === 1 ? agg.barSummary : "",
            barInstruction: state.revealStage === 1 ? "Point at the club that paid for your night." : "",
            feverCopy: state.revealStage === 1 ? FEVER_REVEAL_COPY : null,
            ledger: state.revealStage === 2 ? agg.giveAndTake.slice(barPage * BARS_PER_PAGE, barPage * BARS_PER_PAGE + BARS_PER_PAGE) : [],
            ledgerTotal: agg.giveAndTake.length,
            // econ B1: the bars on this beat measure the DECISION. The dealt
            // totals stay on the row as a foot, because they are the true
            // shared-product magnitude and the room has been reading them all
            // lesson — but they are no longer what the beat's question is
            // answered with.
            ledgerAnySpend: state.revealStage === 2 ? agg.choiceTotals.anySpend : false,
            ledgerSummary: state.revealStage === 2 ? giveAndTakeSummaryBoard(agg) : "",
            shockCopy: state.revealStage === 2 ? SHOCK_REVEAL_COPY : null,
            pipes: state.revealStage === 3 ? agg.pipes : [],
            pipesCopy: state.revealStage === 3 ? PIPES_REVEAL_COPY : null,
            warriorsLine: state.revealStage === 3 ? WARRIORS_LINE : null,
            smallMarketPath: state.revealStage === 4 ? agg.smallMarketPath : null,
            meanShareByWeek: state.revealStage === 5 ? agg.meanShareByWeek : null,
            changeLine: state.revealStage === 5 ? reinvestChangeLineBoard(agg, state) : null,
            // W6/RC2. The horizon rule used to be sentence two of a 150-word
            // paragraph on the projector, which is where a rule goes to die.
            // It is the controlling variable of this whole beat, so it gets the
            // frame's standing chip — the same treatment L3 gives the rule in
            // force — and stays legible for as long as the class argues under
            // it. `REVEAL_STAGES[4].say` promises the teacher it is "printed
            // beside" the chart; this is that promise, discharged.
            ruleChip: state.revealStage === 5 ? LAST_WEEK_RULE_CHIP : null,
            // The honest comparison the sentence beside it makes: week 3 read
            // against the weeks-1-2 mean. Without it the three near-equal bars
            // carry none of the claim — and zooming the axis to manufacture a
            // visible drop would misrepresent a 1.9-point move as a collapse.
            meanBaseline: state.revealStage === 5 ? reinvestBaseline(agg) : null,
            honestyLine: BOARD_HONESTY_LINE,
            // W5 THE POOL — a second stage machine inside REVEAL (spec "Both
            // weeks — implementation shape": "no new phase"). Null until the
            // season reveal above has played all five of its own stages, so a
            // room never sees the league's bowl before it has seen its own
            // season. Club wordmarks and totals only — never a seat id.
            pool: poolRitualBoardFor(state, bandOfRoom(state)),
            // D62 R-14 — THE NO-BOWL SEASON. 7-8 only, and only once the
            // teacher has pressed it: league totals and per-club rows by club
            // wordmark, never a seat identity. `%` allowed at 7-8 only.
            noBowl:
              bandOfRoom(state) === "7-8" && noBowlOf(state)
                ? {
                    leagueReinvestWithBowl: noBowlOf(state)!.leagueReinvestWithBowl,
                    leagueReinvestNoBowl: noBowlOf(state)!.leagueReinvestNoBowl,
                    leagueLine: `${noBowlOf(state)!.roomReinvestLineWithBowl} ${noBowlOf(state)!.roomReinvestLineNoBowl}`,
                    rows: noBowlOf(state)!.rows.map(({ club, cashWithBowl, cashNoBowl, reinvestWithBowl, reinvestNoBowl }) => ({
                      club,
                      cashWithBowl,
                      cashNoBowl,
                      reinvestWithBowl,
                      reinvestNoBowl,
                    })),
                    // D62 R-14 EXTENSION — club rows and the room's mean line,
                    // never a seat id (same club-wordmark discipline as above).
                    bestResponse: {
                      leagueMeanWithBowl: noBowlOf(state)!.bestResponse.leagueMeanWithBowl,
                      leagueMeanNoBowl: noBowlOf(state)!.bestResponse.leagueMeanNoBowl,
                      line: noBowlOf(state)!.bestResponse.line,
                      rows: noBowlOf(state)!.bestResponse.rows.map(({ club, bestReinvestWithBowl, bestReinvestNoBowl }) => ({
                        club,
                        bestReinvestWithBowl,
                        bestReinvestNoBowl,
                      })),
                    },
                  }
                : null,
          };
        }

        case "ADAPT":
          return {
            mode: "adapt",
            questions: ADAPT_QUESTIONS,
            bars: pagedBars,
            barPageLabel,
            barSummary: agg.barSummary,
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "ARGUE":
          return {
            mode: "argue",
            headline: "THE PRICE NEVER MOVED",
            copy: ARGUE_COPY,
            prompt: ARGUE_PROMPT,
            honestLimit:
              "We can show you what the money would have done. We cannot show you what you would have done. That is why we played it instead of arguing about it.",
            honestyLine: BOARD_HONESTY_LINE,
          };

        case "SYNTHESIS": {
          const cards = synthesisCards(state, agg);
          const pages = synthPageCount(cards.length);
          const page = Math.min(Math.max(0, state.synthPage ?? 0), pages - 1);
          return {
            mode: "synthesis",
            heading: "WHAT ECONOMICS DID WE JUST USE?",
            cards: cards.slice(page * SYNTH_CARDS_PER_PAGE, page * SYNTH_CARDS_PER_PAGE + SYNTH_CARDS_PER_PAGE),
            cardCount: cards.length,
            synthPage: page + 1,
            synthPageCount: pages,
            synthPageLabel: pages > 1 ? `Card ${page + 1} of ${pages}` : "",
            synthRail: page === pages - 1,
            beyondSports: BEYOND_SPORTS_LINE,
            exitPrompt: EXIT_PROMPT,
            sourceNotes: SOURCE_NOTES,
            honestyLine: BOARD_HONESTY_LINE,
          };
        }

        case "COMPLETE":
          return { mode: "complete", message: COMPLETE_COPY, sourceNotes: SOURCE_NOTES };

        default:
          return { mode: "idle", phase };
      }
    })();
    return tag(view, bandOfRoom(state));
  },

  aggregate(state) {
    return computeAggregate(state);
  },
};

/**
 * REVEAL stage 5, rebuilt. Three findings land on this one beat:
 *
 *  - `gate-l2-play` R3 (BLOCKING). The shipped line ended "Nobody told this
 *    room to move" and fired in BOTH directions — a 10-point fall in one played
 *    session and a 19-point rise in another produced the same sentence. Worse,
 *    in the session that fell, the fall was caused by THE APP'S OWN week-3 copy
 *    telling every desk that reinvest no longer pays this lesson. The board
 *    credited the bar for a move the product scripted. That claim is gone: the
 *    beat now states the direction, names every candidate cause it can actually
 *    see, and refuses to pick between them.
 *  - `gate-l2-econ` FL-F (repair required). The instrument had no controlling
 *    variable. Week 3 is structurally different: reinvest in the last week buys
 *    Draw that no week-3 quantity consumes, so the cash-optimal week-3 share is
 *    measured at 0% for EVERY desk (40% costs $216,901-$568,155). A flat
 *    reading is therefore already a large attitude change and a fall is
 *    rational play. The control is now printed beside the numbers.
 *  - `gate-l2-econ` dominant-strategies, "honest at the dial and unhandled at
 *    the projector". The horizon effect is real economics — investment dies
 *    when there is no tomorrow — and this is where it gets taught rather than
 *    left as an unexplained dip.
 *
 * The bar can only be named as a candidate when the room actually saw it before
 * it played week 3. `barReleasedAtWeek` is the controlling variable for that.
 *
 * `gate-l2-projector` R-1 and `gate-l2-play` N-3, both BLOCKING, both the same
 * off-by-one. `barReleasedAtWeek` is `state.weekIndex` at press time, and
 * `weekIndex` is already `WEEK_COUNT - 1` the moment the week-2 bell lands —
 * so the test `barReleasedAtWeek < WEEK_COUNT - 1` scored the release that
 * `/teach` itself prescribes ("it lands hardest after WEEK 2 — hold it one more
 * week if you can") as "after week 3", and the projector printed "This room did
 * NOT see the Handed-To-You bar before it played week 3" to a room that had
 * been reading the bar while it priced week 3. Confirmed by two-arm probe by
 * the projector critic and independently observed by the play critic.
 *
 * The honest boundary is the week-3 BELL, not the week-2 bell: `weekIndex`
 * advances only when a week settles, so `barReleasedAtWeek <= WEEK_COUNT - 1`
 * is exactly "released before week 3 was locked in". Releases at or after the
 * final bell — including `onPhaseExit`'s fallback release and the automatic
 * release on the first REVEAL press, both of which stamp `WEEK_COUNT` — score
 * as not seen, which is true of them.
 *
 * A release DURING the last week is a third case and gets its own clause: some
 * desks had already locked. It still makes the bar a candidate cause, and the
 * DOWN branch may name the bar in exactly the cases where this predicate holds
 * and in no others (the old DOWN sentence named it unconditionally, four
 * sentences after asserting nothing on the frame could be about it).
 */
export function sawBarBeforeWeek3(state: HostLeagueState): boolean {
  return state.barReleased && state.barReleasedAtWeek !== null && state.barReleasedAtWeek <= WEEK_COUNT - 1;
}

/** True only for a release inside the final week's open window — before its bell, after it opened. */
export function barReleasedDuringLastWeek(state: HostLeagueState): boolean {
  return sawBarBeforeWeek3(state) && state.barReleasedAtWeek === WEEK_COUNT - 1;
}

/**
 * THE FOUR ARMS OF THE BAR RELEASE, computed once and used by every surface
 * that says anything about it.
 *
 * `gate-l2-projector` W4-1 and W4-2, both BLOCKING, both the same root cause:
 * the room's release timing was described in one place (the board) and NOT
 * described in another (`/teach`'s ON-THE-PROJECTOR mirror, byte-identical
 * across all four arms including the one where the board had already chosen).
 * A teacher who never pressed the optional button — a plausible random-teacher
 * path, which is why the module ships an auto-release fallback at all — was
 * coached to run a two-candidate argument the projector behind them had closed.
 *
 * One function, four arms, and every surface that speaks about the release
 * derives its sentence from this rather than writing its own:
 *
 *  - `never`               the room never saw the bar in time (arm C). The
 *                          board CHOOSES: the last-week rule is the only cause
 *                          on the table.
 *  - `beforeLastWeek`      released during week 2's open window (arm B).
 *  - `lastWeekNoneLocked`  released after the week-2 bell, before any desk
 *                          committed week 3 — the release `/teach` prescribes
 *                          (arm A). EVERY desk saw it before it priced.
 *  - `lastWeekSomeLocked`  released mid-week-3 with desks already committed
 *                          (arm D). Only these desks could have been moved.
 *  - `lastWeekLockCountUnknown` a pre-W4-1 snapshot with no stamp: say nothing
 *                          about who had committed rather than assert either.
 */
export type BarReleaseArm = "never" | "beforeLastWeek" | "lastWeekNoneLocked" | "lastWeekSomeLocked" | "lastWeekLockCountUnknown";

export function barReleaseArm(state: HostLeagueState): BarReleaseArm {
  if (!sawBarBeforeWeek3(state)) return "never";
  if (!barReleasedDuringLastWeek(state)) return "beforeLastWeek";
  const n = lockedAtBarRelease(state);
  if (n === null) return "lastWeekLockCountUnknown";
  return n > 0 ? "lastWeekSomeLocked" : "lastWeekNoneLocked";
}

/**
 * The weeks-1-2 mean, or null when there is no before to compare against.
 * Same arithmetic `reinvestChangeLineClaimed` prints, so the reference line on
 * the projector and the sentence under it cannot disagree.
 */
export function reinvestBaseline(agg: HostLeagueAggregate): number | null {
  const [w1, w2, w3] = agg.meanShareByWeek;
  if (w3 === null || w3 === undefined) return null;
  const before = [w1, w2].filter((x): x is number => typeof x === "number");
  if (before.length === 0) return null;
  return Math.round((before.reduce((a, b) => a + b, 0) / before.length) * 10) / 10;
}

export function reinvestChangeLineClaimed(agg: HostLeagueAggregate, state: HostLeagueState): Claimed {
  const [w1, w2, w3] = agg.meanShareByWeek;
  const HORIZON =
    "Read that with the last-week rule in your hand: week 3 was the end. Every desk's screen said so before it priced — Draw bought in week 3 earns nothing else in this lesson. A desk doing the arithmetic had a reason to put the dial DOWN in week 3 whatever it thought of the bar. That is not cynicism, it is the horizon: investment dies when there is no tomorrow to collect in.";
  if (w3 === null || w3 === undefined) {
    return {
      text: `Week 3 was not played, so there is no after to compare. What the room did in weeks 1 and 2 is still its own: nobody was told what the dial was worth. ${HORIZON}`,
      board: "Week 3 was not played, so there is no after to compare.",
      claims: [],
    };
  }
  const before = [w1, w2].filter((x): x is number => typeof x === "number");
  if (before.length === 0) {
    return {
      text: `Only one week is in the books, so there is no before and after to compare. ${HORIZON}`,
      board: "Only one week is in the books, so there is no before and after to compare.",
      claims: [],
    };
  }
  const mean = Math.round((before.reduce((a, b) => a + b, 0) / before.length) * 10) / 10;
  const delta = Math.round((w3 - mean) * 10) / 10;

  // The bar is only a candidate cause if the room saw it BEFORE the last bell.
  // Otherwise nothing on this frame can be about the bar at all.
  const saw = sawBarBeforeWeek3(state);
  const arm = barReleaseArm(state);
  const claims: ClaimAtom[] = [];
  // projector W4-1: the DURING-week-3 clause used to assert "some desks had
  // already locked" for BOTH mid-week-3 releases and the clean prescribed one,
  // and it was false in the prescribed one — which is also the cleanest setup
  // the beat can have ("every desk saw it before it priced"). Four arms, four
  // sentences, and the lock count is printed rather than presumed.
  const lockedAt = lockedAtBarRelease(state);
  const liveNow = liveDeskCount(state);
  const barClause =
    arm === "never"
      ? "This room did NOT see the Handed-To-You bar before it played week 3, so nothing on this frame can be about the bar."
      : arm === "lastWeekNoneLocked"
        ? "This room saw the Handed-To-You bar DURING week 3, before the last bell and before a single desk had locked week 3 in — so every desk in this room priced its last week having seen it, and the bar is one of the things that could have moved it."
        : arm === "lastWeekSomeLocked"
          ? `This room saw the Handed-To-You bar DURING week 3, before the last bell — ${lockedAt} of ${liveNow} desks had already locked — so the bar is one of the things that could have moved it, for the desks that had not.`
          : arm === "lastWeekLockCountUnknown"
            ? "This room saw the Handed-To-You bar DURING week 3, before the last bell, so the bar is one of the things that could have moved it."
            : "This room did see the Handed-To-You bar before it played week 3, so the bar is one of the things that could have moved it.";
  claims.push(
    claimWord(
      "reveal5.sawBar",
      arm === "never"
        ? "did NOT see the Handed-To-You bar"
        : arm === "beforeLastWeek"
          ? "did see the Handed-To-You bar"
          : "saw the Handed-To-You bar DURING week 3",
      saw,
      saw ? "did NOT see the Handed-To-You bar" : "could have moved it",
    ),
  );
  if (arm === "lastWeekNoneLocked") {
    claims.push(claimWord("reveal5.someLocked", "before a single desk had locked week 3 in", false, "desks had already locked"));
  } else if (arm === "lastWeekSomeLocked") {
    claims.push(claim("reveal5.lockedAtRelease", lockedAt ?? 0, "int", { assertsSign: "positive", bounds: { min: 1, max: liveNow } }));
    claims.push(claimWord("reveal5.someLocked", `${lockedAt} of ${liveNow} desks had already locked`, true));
  }

  const numbers = `Weeks 1-2: ${mean}% of the door money, on average. Week 3: ${w3}%${
    Math.abs(delta) < 1 ? " — level" : ` — ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} points`
  }.`;

  // play N-3, second residual: the DOWN sentence used to name the bar
  // unconditionally, four sentences after asserting nothing on the frame could
  // be about it. It may name the bar exactly when the room saw it.
  const downRest = saw
    ? "At least two things could have done that and this board will not choose between them: the last-week rule, which every desk was shown, and whatever they made of the bar. Ask them which one it was — and believe them."
    : "This room never saw the bar in time, so the bar is not on the table: the last-week rule, which every desk was shown, is the cause this board can see. Ask them whether that is really why — and believe them.";
  if (Math.abs(delta) >= 1 && delta < 0) {
    claims.push(
      saw
        ? claimWord("reveal5.barNamedAsCause", "whatever they made of the bar", true)
        : claimWord("reveal5.barNamedAsCause", "the bar is not on the table", false, "whatever they made of the bar"),
    );
  }

  // The direction splits at its first sentence. The head IS the finding and goes
  // on the wall with the numbers; the rest is the argument the teacher runs, and
  // goes to the mirror.
  const [directionHead, directionRest] =
    Math.abs(delta) < 1
      ? [
          "The room held its dial where it was.",
          "Under the last-week rule that is itself a move: holding steady in a week the arithmetic told them to cut is a choice about something other than this week's cash. Ask them what.",
        ]
      : delta > 0
        ? [
            "The room went UP — against the last-week rule, which pushed the other way.",
            "Whatever moved these desks, it was not the arithmetic of this lesson. Ask them.",
          ]
        : ["The room went DOWN.", downRest];

  return {
    text: `${numbers} ${HORIZON} ${barClause} ${directionHead} ${directionRest}`,
    // The wall holds the room's own three numbers and which way it moved. The
    // horizon rule, the bar-release arm and the "do not resolve it" instruction
    // are the teacher's beat, not the projector's paragraph.
    board: `${numbers} ${directionHead}`,
    claims,
  };
}

/** The full finding — the teacher's mirror and the claim audit. */
export function reinvestChangeLine(agg: HostLeagueAggregate, state: HostLeagueState): string {
  return reinvestChangeLineClaimed(agg, state).text;
}

/** What the projector holds for it. */
export function reinvestChangeLineBoard(agg: HostLeagueAggregate, state: HostLeagueState): string {
  return onBoard(reinvestChangeLineClaimed(agg, state));
}

/**
 * WHAT THE PROJECTOR IS ACTUALLY HOLDING DURING PLAY — `gate-l2-teacher` W5 B-2.
 *
 * The composition of the PLAY frame was decided in THREE places: `boardView`
 * (which shipped `pairings` and `shock` unconditionally), the board client
 * (which throws both away the moment the Handed-To-You bar is up, because the
 * projector cannot scroll and a panel has to give up the frame), and
 * `projectorMirror` (which described the frame from scratch, by hand). So at the
 * single highest-stakes control press in the lesson — releasing the bar at the
 * moment `/teach` itself prescribes — the teacher's mirror read "Every pairing
 * in the league... The star-departure card is up... The Handed-To-You bar is up
 * underneath the schedule" while the projector held only the week strip, the
 * pager, the bars, the legend and the summary. Three of four sentences false,
 * with the room still pricing week 3.
 *
 * There is now ONE decision. `boardView` composes the frame from this, the board
 * client renders exactly what `boardView` sends, and the mirror is written from
 * the same object — so a panel cannot leave the projector without leaving the
 * teacher's description of it at the same time.
 */
export type PlayBoardComposition = {
  allWeeksDone: boolean;
  /** The Handed-To-You bar has the frame. When true, the schedule is NOT on it. */
  barsUp: boolean;
  weekNumber: number;
  /** The pairing grid — surrendered to the bar, which is why it is a computed flag. */
  showsPairings: boolean;
  /** The star-departure card — the same surrender, and W5 B-2's second false sentence. */
  showsShock: boolean;
  shockClubName: string | null;
  shockDraw: number | null;
  lockedCount: number;
  deskCount: number;
};

export function playBoardComposition(state: HostLeagueState): PlayBoardComposition {
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  const allWeeksDone = state.weekIndex >= WEEK_COUNT;
  const barsUp = state.barReleased;
  const shockUp = state.shockSlot !== null && state.weekIndex >= 1;
  return {
    allWeeksDone,
    barsUp,
    weekNumber: openWeekNumber(state),
    showsPairings: !allWeeksDone && !barsUp,
    showsShock: !allWeeksDone && !barsUp && shockUp,
    shockClubName: state.shockSlot !== null ? CLUBS[state.shockSlot]!.name : null,
    shockDraw: state.shockSlot !== null ? state.clubs[state.shockSlot]!.draw : null,
    lockedCount: live.filter((c) => c.locked).length,
    deskCount: live.length,
  };
}

/**
 * `/teach`'s ON-THE-PROJECTOR mirror for PLAY, written FROM the composition
 * above rather than from a second reading of the state. Every sentence is
 * gated on the flag that decides whether the panel it describes is on the
 * projector at all, and the two arms — schedule up, bar up — say opposite
 * things about the schedule because the projector does.
 */
export function teachPlayMirrorClaimed(state: HostLeagueState): Claimed {
  const c = playBoardComposition(state);
  if (c.allWeeksDone) {
    const word = c.barsUp ? "the bar is on the projector" : "the projector is still holding";
    return {
      text: c.barsUp
        ? `Three weeks are in the books and ${word}: the Handed-To-You bar for the group you have paged to, its legend and its summary line, and nothing else. The schedule is gone — every desk has this week's pairing on its own device.`
        : `Three weeks are in the books and ${word}: the room has NOT seen the whole picture yet, and there is no schedule and no bar on the frame. It goes up one beat at a time in REVEAL.`,
      claims: [claimWord("teachPlay.barsUp", word, c.barsUp, c.barsUp ? "the projector is still holding" : "the bar is on the projector")],
    };
  }
  const lock = claim("teachPlay.lockedCount", c.lockedCount, "int", { assertsSign: "nonNegative", bounds: { min: 0, max: MAX_DESKS } });
  if (c.barsUp) {
    // The arm W5 B-2 was written against. Note what is NOT said: no pairings, no
    // departure card, and explicitly not "underneath the schedule".
    const word = "the bar has REPLACED the schedule";
    return {
      text: `Week ${c.weekNumber} of ${WEEK_COUNT} — and ${word}. The projector is holding the week strip (${lock.rendered} of ${c.deskCount} locked in), the group pager, the Handed-To-You bars, "Point at the club that paid for your night", and the summary line. That is all of it. The pairing grid and the star-departure card are NOT on the frame any more — there is no control to put them back, and there does not need to be: every desk has this week's pairing and every Draw on its own device. Point at the bars, not at the schedule.`,
      claims: [
        lock,
        claimWord("teachPlay.barsUp", word, true, "underneath the schedule"),
        claimWord("teachPlay.showsPairings", "The pairing grid and the star-departure card are NOT on the frame", false, "Every pairing in the league"),
      ],
    };
  }
  const pairings = "Every pairing in the league";
  return {
    text: `Week ${c.weekNumber} of ${WEEK_COUNT} — the schedule. ${pairings}: who hosts whom, with both clubs' Draw printed.${
      c.showsShock ? ` The star-departure card is up beside it: ${c.shockClubName}, Draw ${c.shockDraw}.` : ""
    } Desks locked in: ${lock.rendered} of ${c.deskCount}. Nothing about this week's crowds is on the projector until you close the week, and the Handed-To-You bar is not up.`,
    claims: [
      lock,
      claimWord("teachPlay.barsUp", "the Handed-To-You bar is not up", false, "the bar has REPLACED the schedule"),
      claimWord("teachPlay.showsPairings", pairings, true, "are NOT on the frame"),
    ],
  };
}

/**
 * `/teach`'s ON-THE-PROJECTOR mirror for REVEAL stage 5.
 *
 * `gate-l2-projector` W4-2 (BLOCKING). The shipped mirror was one hard-coded
 * string on `REVEAL_STAGES[4].say` — byte-identical across all four release
 * arms, and in every one of them it told the teacher *"Do not resolve it: this
 * board deliberately refuses to choose between the rule and the bar."* In the
 * arm where the bar was never released in time the board has ALREADY chosen
 * ("the bar is not on the table"), so the teacher was coached to run a
 * two-candidate argument the screen behind them had closed — the same defect
 * shape as P-3's freeze mirror, at the lesson's argument beat.
 *
 * The mirror now describes the arm the board is actually in, derives that arm
 * from the same `barReleaseArm` the board's own clause derives it from, and
 * carries claim atoms so the sweep audits the two against each other. Whether
 * the board refuses to choose is not a fact about this lesson's script; it is a
 * fact about this room's release.
 */
export function teachStage5MirrorClaimed(state: HostLeagueState): Claimed {
  const base =
    "The room's own reinvest per week, with the last-week rule printed beside it. Say the rule out loud — week 3 was the end, and Draw bought then earns nothing else in this lesson — and THEN ask them why the room did what it did.";
  const arm = barReleaseArm(state);
  const lockedAt = lockedAtBarRelease(state);
  const liveNow = liveDeskCount(state);
  if (arm === "never") {
    const word = "this board has ALREADY chosen";
    return {
      text: `${base} The bar never went up in time, so ${word}: the frame says the bar is not on the table and names the last-week rule as the only cause it can see. Do NOT offer the bar as a second candidate — the screen behind you has closed it. Ask them whether the rule is really why, and believe them.`,
      claims: [claimWord("teach5.boardChose", word, true, "refuses to choose")],
    };
  }
  const refuses = "this board deliberately refuses to choose between the rule and the bar";
  if (arm === "lastWeekSomeLocked") {
    const n = claim("teach5.lockedAtRelease", lockedAt ?? 0, "int", { assertsSign: "positive", bounds: { min: 1, max: liveNow } });
    return {
      text: `${base} Do not resolve it: ${refuses}. One thing to say out loud before you ask — you released the bar mid-week-3, and ${n.rendered} of ${liveNow} desks had already locked. Ask the desks that had NOT locked; the rest could not have used it.`,
      claims: [claimWord("teach5.boardChose", refuses, false, "ALREADY chosen"), n, claimWord("teach5.someLocked", "had already locked", true)],
    };
  }
  if (arm === "lastWeekNoneLocked") {
    return {
      text: `${base} Do not resolve it: ${refuses}. This is the cleanest version of the beat: you released it after the week-2 bell and NOT ONE desk had locked week 3 yet, so every desk in this room priced its last week having seen the bar. Ask the whole room, not a subset.`,
      claims: [claimWord("teach5.boardChose", refuses, false, "ALREADY chosen"), claimWord("teach5.someLocked", "NOT ONE desk had locked", false, "had already locked")],
    };
  }
  if (arm === "lastWeekLockCountUnknown") {
    return {
      text: `${base} Do not resolve it: ${refuses}. The bar went up during week 3; this session was restored from a snapshot that did not record how many desks had already locked, so do not tell the room either way.`,
      claims: [claimWord("teach5.boardChose", refuses, false, "ALREADY chosen")],
    };
  }
  return {
    text: `${base} Do not resolve it: ${refuses}. The room saw the bar during week 2, so every desk had it in hand for the whole of week 3. Ask the whole room.`,
    claims: [claimWord("teach5.boardChose", refuses, false, "ALREADY chosen")],
  };
}

/** The `say` line `/teach` prints for a stage — computed for stage 5, static elsewhere. */
export function revealStageSay(state: HostLeagueState, stage: number): string {
  if (stage === 5) return teachStage5MirrorClaimed(state).text;
  return REVEAL_STAGES[stage - 1]?.say ?? "";
}

/** REVEAL_STAGES with every `say` resolved against THIS room's state (projector W4-2). */
export function revealStagesFor(state: HostLeagueState): RevealStage[] {
  return REVEAL_STAGES.map((s) => ({ ...s, say: revealStageSay(state, s.stage) }));
}

/* --------------------------------------------------------- teacher aids -- */

export type WatchFlag = {
  id: string;
  label: string;
  desks: string[];
  action: string;
  urgency: "now" | "later";
};

/**
 * `gate-l2-teacher` B5 (BLOCKING). The /teach landing page tells a first-time
 * teacher to create an empty session and press Advance through every phase, and
 * promises the whole period is rehearsable that way. It was not: with zero
 * desks WATCH FOR never rendered at all, because every flag is computed off
 * live desks. A teacher who rehearsed exactly as instructed met the room's only
 * diagnostic panel for the first time in front of a class.
 *
 * These are the real flags with stand-in desks, every label prefixed REHEARSAL
 * so they can never be mistaken for a live room, and they render ONLY when the
 * session has no desks in it at all.
 */
function rehearsalWatchFor(phase: CanonicalPhase): WatchFlag[] {
  const sample = (label: string, desks: string[], action: string, urgency: "now" | "later"): WatchFlag => ({
    id: `rehearsal-${label.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24)}`,
    label: `REHEARSAL — ${label}`,
    desks,
    action,
    urgency,
  });
  const flags: WatchFlag[] = [
    sample(
      "this panel is a sample, because nobody has joined",
      ["Desk 1 · New York", "Desk 2 · Memphis"],
      "With a real class this panel is computed live and names your actual desks. You are seeing the shapes so none of them is new to you at 11:40 on the day.",
      "now",
    ),
  ];
  if (phase === "PLAY") {
    flags.push(
      sample(
        "Hosting a big Draw this week — their building is going to fill",
        ["Desk 3 · Boston"],
        "Say nothing about the price. Watch whether they RAISE it. If they charge last week's number into a full house they will feel it, and that is the cleanest thing you can debrief.",
        "later",
      ),
      sample(
        "Hosting a collapsed Draw this week — through no fault of their own",
        ["Desk 4 · Denver"],
        "This is the emotional risk of the lesson. Frame it as economics, never as blame: they did not choose their schedule, and the desk that visits them is not their enemy.",
        "now",
      ),
      sample(
        "Has never locked a week — every week settled automatically",
        ["Desk 5 · Chicago"],
        "A participation problem, not a strategy. Go to the desk. Never use these on the gave/got board — they did not choose 0%, they chose nothing.",
        "now",
      ),
    );
  }
  if (phase === "REVEAL" || phase === "ADAPT" || phase === "SYNTHESIS") {
    flags.push(
      sample(
        "CHOSE to put nothing back, two weeks running",
        ["Desk 6 · Indiana"],
        "These desks locked in and picked zero — that is a decision, and it is what Lesson 3 exists to argue about. Do not call it cheating. Read the by-choice column, not the dealt one.",
        "later",
      ),
      sample(
        "Reinvesting hard every week",
        ["Desk 2 · Memphis"],
        "Ask them at ADAPT who got the money their Draw earned. Some of it landed in the buildings they visited, and the room's own totals say how much.",
        "later",
      ),
    );
  }
  return flags;
}

function teacherWatchFor(state: HostLeagueState, phase: CanonicalPhase): WatchFlag[] {
  const out: WatchFlag[] = [];
  const live = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize);
  // W5 N-3. This comes FIRST and before the rehearsal short-circuit: a pair
  // standing in the doorway is the most urgent thing on the panel, and the
  // teacher had no line for them at all.
  const observers = observersOf(state);
  if (observers.length > 0) {
    out.push({
      id: "late-observers",
      label: `${observers.length} student${observers.length === 1 ? "" : "s"} arrived after the last week closed and could not be given a club`,
      desks: observers.map((_, i) => `Late student ${i + 1}`),
      action:
        "There is no club left to hand them — the weeks are in the books and seating them now would change numbers this room has already been shown. Their screen says so and tells them to pull up to the nearest desk; say the same out loud and seat them at a desk near the door. Everything from here — the board, the argument, the synthesis — is the whole room's, so they lose nothing but the three weeks.",
      urgency: "now",
    });
  }
  if (live.length === 0) return [...out, ...rehearsalWatchFor(phase)];
  const windowOpen = phase === "PLAY" && state.weekIndex < WEEK_COUNT;

  if (windowOpen && live.length > 0) {
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
  }

  if (windowOpen) {
    const hostingMarquee = live
      .filter((c) => {
        const v = visitorSlotFor(c.slot, state.weekIndex, state.leagueSize);
        return state.clubs[v]!.draw >= 60;
      })
      .map(deskHandleFor);
    if (hostingMarquee.length > 0) {
      out.push({
        id: "marquee",
        label: "Hosting a big Draw this week — their building is going to fill",
        desks: hostingMarquee,
        action: "Say nothing about the price. Watch whether they RAISE it. If they charge last week's number into a full house they will feel it, and that is the cleanest thing you can debrief.",
        urgency: "later",
      });
    }
    const hostingWeak = live
      .filter((c) => {
        const v = visitorSlotFor(c.slot, state.weekIndex, state.leagueSize);
        return state.clubs[v]!.draw <= 25;
      })
      .map(deskHandleFor);
    if (hostingWeak.length > 0) {
      out.push({
        id: "weak-visitor",
        label: "Hosting a collapsed Draw this week — through no fault of their own",
        desks: hostingWeak,
        action: "This is the emotional risk of the lesson. Frame it as economics, never as blame: they did not choose their schedule, and the desk that visits them is not their enemy. The bar makes this legible; hold it until then.",
        urgency: "now",
      });
    }
  }

  // `gate-l2-teacher` B3 (BLOCKING). This flag used to sweep up the desk that
  // NEVER LOCKED A SINGLE WEEK and was auto-settled at house price with 0%
  // reinvest by construction, and then instructed the teacher to make that pair
  // the protagonist of the room's argument — a strategic choice they did not
  // make. Never-locked is now its own flag with its own director copy, and
  // "put nothing back" counts only weeks a desk actually committed.
  const neverLocked = live.filter(neverLockedFor).map(deskHandleFor);
  if (neverLocked.length > 0) {
    out.push({
      id: "never-locked",
      label: "Has never locked a week — every week settled automatically",
      desks: neverLocked,
      action:
        // W5 B-1: the second sentence is new, and it is the whole repair on
        // this surface. The teacher was already told to treat this pair as
        // absent; what they were NOT told is what that pair's own screen says
        // while they walk over. It now says the same thing, and the teacher
        // knows it does, so the two surfaces cannot collide in front of the room.
        "This is a participation problem, not a strategy. Their weeks were auto-committed at the club's house price with nothing reinvested because nobody pressed the button — they did not choose 0%, they chose nothing. Their own screen agrees with you: it reads \"These zeroes are not a decision — they are the weeks that ran without you\", and it does not tell them they chose anything. Go to the desk and say the same. Do NOT use them on the gave/got board and do not name them in the argument: they are not the free-rider case, they are the desk you have not reached yet.",
      urgency: "now",
    });
  }

  const bankers = live
    .filter((c) => {
      const chosen = chosenWeeksFor(c);
      return chosen.length >= 2 && chosen.every((w) => w.share === 0);
    })
    .map(deskHandleFor);
  if (bankers.length > 0) {
    out.push({
      id: "free-rider",
      label: "CHOSE to put nothing back, two weeks running",
      desks: bankers,
      action:
        "These desks locked in and picked zero — that is a decision, and it is the exact behaviour Lesson 3 exists to argue about. Do not call it cheating. Save them for the WHAT YOU GAVE, WHAT YOU GOT board and read the by-choice column, not the dealt one: a desk that spent nothing gave nothing IT chose to give, however big the Draw it was handed.",
      urgency: "later",
    });
  }

  const heavy = live
    .filter((c) => {
      const chosen = c.weeks.filter((w) => !w.auto && !w.stock);
      return chosen.length >= 2 && chosen.every((w) => w.share >= 30);
    })
    .map(deskHandleFor);
  if (heavy.length > 0) {
    out.push({
      id: "heavy-invest",
      label: "Reinvesting hard every week",
      desks: heavy,
      action: "Ask them at ADAPT who got the money their Draw earned. Most of it landed in the buildings they visited. That question is the whole lesson and they have the receipts for it.",
      urgency: "later",
    });
  }

  const debt = live.filter((c) => c.cash < 0).map(deskHandleFor);
  if (debt.length > 0) {
    out.push({
      id: "debt",
      label: "In the red",
      desks: debt,
      action: "Recoverable, always: the national check alone clears the weekly bill for every club in this league. Say so if a desk looks sunk.",
      urgency: "now",
    });
  }

  const soldOut = live.filter((c) => c.weeks.some((w) => w.home.turnedAway > 800)).map(deskHandleFor);
  if (soldOut.length > 0) {
    out.push({
      id: "turned-away",
      label: "Turned away 800+ people on some week",
      desks: soldOut,
      action: "Ask what on the schedule card should have told them, before you say anything about the answer.",
      urgency: "later",
    });
  }

  // W5 THE FREE RIDE, WATCH FOR half. A desk that never locked a week paid
  // the levy and drew the split exactly like everyone else — sitting a week
  // out is not an abstention that lowers what it owes or raises what anyone
  // else gets, and this is the console's own reminder of that, not just the
  // director card's.
  if (phase === "REVEAL" && ritualStageOf(state) >= 6) {
    const ride = freeRideRows(state);
    if (ride.length > 0) {
      out.push({
        id: "free-ride",
        label: "THE FREE RIDE is up — the low-reinvest desks are named on the board",
        desks: ride.map((r) => r.club),
        action: 'Do not say "free-riding" or "externality" — that is Week 6\'s word. Ask what each of these desks would say for itself before the room does.',
        urgency: "now",
      });
    }
  }
  const neverLockedLive = live.filter((c) => c.weeks.length > 0 && c.weeks.every((w) => w.auto)).map(deskHandleFor);
  if (phase === "REVEAL" && ritualStageOf(state) > 0 && neverLockedLive.length > 0) {
    out.push({
      id: "pool-abstain",
      label: `${neverLockedLive.length} desk${neverLockedLive.length === 1 ? "" : "s"} never locked a single week and still paid the levy and drew the split`,
      desks: neverLockedLive,
      action: "Sitting a week out lowered nothing this desk owed and raised nothing anyone else got — say that if the room assumes otherwise.",
      urgency: "later",
    });
  }

  // D62 R-14. Once THE NO-BOWL SEASON has run, guard the obvious misreading:
  // the room's total reinvest is identical with or without the bowl (held
  // dials, never re-decided) — what changed is only whose books the cash
  // sits on, not what anyone chose to spend.
  if (phase === "REVEAL" && bandOfRoom(state) === "7-8" && noBowlOf(state) !== null) {
    out.push({
      id: "bowl-cost-us",
      label: "THE NO-BOWL SEASON is up — watch for \"the bowl cost us money\"",
      desks: live.map(deskHandleFor),
      action:
        "It didn't. The room's total reinvest is the same number with or without the bowl — the same prices, the same reinvest calls, replayed at zero levy still add up to it. What differs is only which club's cash the bowl moved, not what the room put back into itself.",
      urgency: "now",
    });
  }

  return out.filter((f) => f.desks.length > 0);
}

export type DirectorPanel = {
  phase: CanonicalPhase;
  minuteBudget: string;
  now: string[];
  ask: { q: string; answer: string | null }[];
  dontExplainYet: string[];
  trigger: string | null;
  timeCut: string;
};

function projectorMirror(state: HostLeagueState, phase: CanonicalPhase): { title: string; lines: string[] } {
  const live = state.clubs.filter((c) => c.seatId !== null).length;
  const locked = state.clubs.filter((c) => c.seatId !== null && c.locked).length;
  switch (phase) {
    case "LOBBY":
      return {
        title: "The league filling up",
        lines: [
          '"This room is the league."',
          `Every club in the league with its building, its market size and its starting Draw. ${state.leagueSize} clubs, ${live} of them run by a desk; the rest are run by the league office and say so.`,
        ],
      };
    case "HOOK":
      return {
        title: "The brief, and the real number",
        lines: [
          "The Lakers' local media money against the Grizzlies', stamped 2016-17, with the question under it: same league, same rules, why?",
          "Also up: the two books, the whole league's Draw table, and the modelling caveats.",
        ],
      };
    case "PLAY": {
      // W5 B-2: composed from the frame `boardView` actually sends, never
      // re-described here. The title branches on the same one flag.
      const c = playBoardComposition(state);
      return {
        title: c.allWeeksDone
          ? c.barsUp
            ? "Three weeks in the books — the bar has the frame"
            : "Three weeks in the books — the picture is being held"
          : c.barsUp
            ? `Week ${c.weekNumber} of ${WEEK_COUNT} — the bar has REPLACED the schedule`
            : `Week ${c.weekNumber} of ${WEEK_COUNT} — the schedule`,
        lines: [teachPlayMirrorClaimed(state).text],
      };
    }
    case "REVEAL": {
      // projector W4-2: `say` is resolved against this room's release arm.
      const stage = revealStagesFor(state)[state.revealStage - 1] ?? null;
      if (!stage) {
        return {
          title: "Waiting for the first press",
          lines: ['An empty frame and "Waiting for your teacher to put up the first beat."'],
        };
      }
      // The full computed finding for the stages whose projector rendering is
      // deliberately short. The wall holds the finding; these are the clauses
      // the teacher says out loud, and they are here BECAUSE they are not up
      // there — a mirror that repeats the wall verbatim tells the teacher
      // nothing they cannot already see from where they are standing.
      const agg = computeAggregate(state);
      const full =
        stage.stage === 2
          ? giveAndTakeSummary(agg)
          : stage.stage === 5
            ? reinvestChangeLine(agg, state)
            : null;
      const board =
        stage.stage === 2
          ? giveAndTakeSummaryBoard(agg)
          : stage.stage === 5
            ? reinvestChangeLineBoard(agg, state)
            : null;
      const lines = [stage.headline, stage.say];
      if (full !== null && board !== null && full !== board) {
        lines.push(`On the frame, word for word: "${board}" — that is the whole of it up there.`);
        lines.push(`YOURS TO SAY, not on the wall: ${full}`);
      }
      return {
        title: `Stage ${stage.stage} of ${REVEAL_STEPS} — ${stage.name}`,
        lines,
      };
    }
    case "ADAPT":
      return {
        title: "The bar and the three questions",
        lines: ["The Handed-To-You bar stays up beside the questions so every answer can be pointed at.", ...ADAPT_QUESTIONS],
      };
    case "ARGUE":
      return {
        title: "THE PRICE NEVER MOVED",
        lines: [
          "The Dallas trade, February 2025, with the Flagg lottery attached in the same breath.",
          `Prompt on screen: "${ARGUE_PROMPT}"`,
        ],
      };
    case "SYNTHESIS":
      return {
        title: "WHAT ECONOMICS DID WE JUST USE?",
        lines: [
          "ONE card at a time, in the order you press them. Every number on them is computed from this class's own weeks.",
          "The outside-sports line is under every card. The exit question and the dated sources land on the last one.",
        ],
      };
    case "COMPLETE":
      return { title: "Closing card", lines: [COMPLETE_COPY] };
    default:
      return { title: "", lines: [] };
  }
}

function studentScreenMechanics(state: HostLeagueState): string[] {
  const lines = MARKET_PROFILES.map(
    (m) =>
      `${m.sizeLabel} (modeled on the ${m.anchorClub}): weekly bill ${money(m.bill)} · the league office prices these clubs at $${m.housePrice}.`,
  );
  lines.push(
    "Both dials are blind: no preview of any kind exists on the student screen. They see this week's pairing, every club's Draw, the three-week schedule and their own history.",
  );
  lines.push(
    `The reinvest dial is a SHARE (${SHARE_MIN}-${SHARE_MAX}% in ${SHARE_STEP}s) of what comes through their own door THIS week — so they commit the percentage before they know the dollars.`,
  );
  if (state.weekIndex === WEEK_COUNT - 1) {
    lines.push(
      "This is the last week, and their screen says so in plain words: Draw bought now brings them no more money in this lesson — it is what their club carries into the next one.",
    );
  }
  lines.push(
    "A desk that visits a bot club still sees the money its own Draw put on those books. Bot clubs are labelled 'league office' everywhere they appear.",
  );
  return lines;
}

/**
 * ADAPT question 3's answer key, computed from the room's own by-choice ledger.
 *
 * Two blocking findings meet on this one string. `gate-l2-econ` B1: the shipped
 * answer was "the buildings they visited, BY A DISTANCE", which is false of the
 * model — the local-media Draw term is a private annuity worth $12,000 per Draw
 * point per week and drives ~92% of the reinvest decision, so a desk that
 * reinvests keeps roughly half of what it creates and takes all of it back
 * privately at the margin. `gate-l2-teacher` B4: the same answer sent the
 * teacher to the WHAT YOU GAVE, WHAT YOU GOT board, which is REVEAL stage 2 and
 * cannot be put back on the projector — there is no reveal-back control. It now
 * points at the surface that IS live during ADAPT: every pair's own device
 * carries its own two numbers under that exact heading, and the teacher is told
 * so.
 */
export function adaptSpendAnswerClaimed(state: HostLeagueState): Claimed {
  const ct = computeAggregate(state).choiceTotals;
  const where =
    "You do not need the reveal board back for this — every desk has its own two numbers on its own screen right now, under WHAT YOU GAVE, WHAT YOU GOT. Tell them to read their own.";
  if (!ct.anySpend) {
    return {
      text: `Careful — nobody in this room put anything back, so this question has no spending to be about. Ask it the other way: what would it have cost you, and who else would it have paid? ${where}`,
      claims: [],
    };
  }
  // econ B7/B8 reached this answer key verbatim through a second hand-written
  // copy of the same sentence. There is now exactly one builder.
  const spill = spilloverClaim(ct);
  return {
    text: `BOTH, and this room's own numbers say in what proportion. ${spill.text} So do not tell them the buildings took it all. The honest answer is that it pays you back, slowly, through your local money and your own gate — AND it pays somebody else at the same time, on the night, and you never see that part. That is the problem, not a wrong. Say the next lesson is about what a league does with it. ${where}`,
    claims: spill.claims,
  };
}

export function adaptSpendAnswer(state: HostLeagueState): string {
  return adaptSpendAnswerClaimed(state).text;
}

/**
 * THE GIVE/TAKE FRAMING LINE FOR THE ABSTAINING DESK — `gate-l2-teacher` W5 B-1.
 *
 * The give/take INSTRUMENT already separates abstention from choice: a desk that
 * never locked has $0 in every by-choice column because it never spent, and the
 * WATCH FOR panel refuses to put it on the gave/got board. What the teacher was
 * never handed was a SENTENCE — so at the beat where the room is pointed at the
 * gave/got numbers and asked who gave, the one desk that must not be named as
 * the free-rider had no line attached to it anywhere in the give/take framing.
 *
 * The line is computed from the same `neverLockedFor` atom, names this room's
 * actual desks, and appears in the ADAPT answer key beside the question that
 * sends the room to those numbers. In a room where every desk locked at least
 * once it is not printed at all, because there is nothing to say.
 */
export function neverLockedFramingClaimed(state: HostLeagueState): Claimed | null {
  const abstained = state.clubs.filter((c) => c.seatId !== null && c.slot < state.leagueSize).filter(neverLockedFor);
  if (abstained.length === 0) return null;
  const handles = abstained.map(deskHandleFor).join(", ");
  const n = claim("teachGiveTake.neverLockedCount", abstained.length, "int", { assertsSign: "positive", bounds: { min: 1, max: MAX_DESKS } });
  const word = claimWord("teachGiveTake.neverLocked", "never locked", true, "chose to put nothing back");
  return {
    text: `${n.rendered} desk${abstained.length === 1 ? "" : "s"} in this room ${word.rendered} a week — ${handles}. Those weeks were auto-committed at the league office's default price with nothing reinvested, so their $0 is an ABSENCE, not a decision. Do not read them off the gave/got board and do not make them the free-rider example: treat them as absent. Their own screens say the same words you do — "these zeroes are not a decision — they are the weeks that ran without you". The desks worth naming here are the ones who locked in and still put nothing back.`,
    claims: [n, word],
  };
}

/**
 * EVERY claim-carrying surface in this lesson, in one sweep.
 *
 * This is the entry point for the claim-audit family (`P11` in the L2 tuning
 * harness): for each surface it returns the exact string the room is shown and
 * every relation that string asserts, so the audit can recompute each relation
 * from the reducer and fail on disagreement in sign, quantifier or bound.
 *
 * A surface missing from this list is a surface the audit cannot see, so adding
 * a claim-carrying board/synthesis/ADAPT string without adding it here is the
 * one way to reintroduce the defect class. The harness asserts the sweep
 * actually covers the ids it names.
 */
export function moduleClaims(state: HostLeagueState): ClaimSurface[] {
  const agg = computeAggregate(state);
  const out: ClaimSurface[] = [];
  const push = (surface: string, c: Claimed): void => {
    if (c.claims.length > 0) out.push({ surface, text: c.text, claims: c.claims });
  };

  push("board:reveal-1:barSummary", barSummaryFromClaimed(agg.homeRevenueDecomposition, agg.visitorLedCount));
  push("board:reveal-2:ledgerSummary", giveAndTakeSummaryClaimed(agg));
  const path = agg.smallMarketPath;
  if (path.found) push("board:reveal-4:smallMarketPath", { text: path.line, claims: path.claims });
  push("board:reveal-5:changeLine", reinvestChangeLineClaimed(agg, state));
  // projector W4-2: the teacher's ON-THE-PROJECTOR mirror for the same beat is
  // a claim ABOUT the board, so it is swept beside the board's own clause and
  // the two are audited against one recomputed release arm.
  push("teach:reveal-5:projectorMirror", teachStage5MirrorClaimed(state));
  push("teach:adapt-q3:answerKey", adaptSpendAnswerClaimed(state));
  // W5 B-1: the abstention framing the teacher is handed at the gave/got beat,
  // audited against the same predicate the desk's own card branches on. Absent
  // (not empty) in a room where every desk locked at least one week.
  const framing = neverLockedFramingClaimed(state);
  if (framing) push("teach:give-take:neverLocked", framing);
  // W5 B-2: the PLAY-phase ON-THE-PROJECTOR mirror, composed from the same
  // board frame the projector renders. See `playBoardComposition`.
  push("teach:play:projectorMirror", teachPlayMirrorClaimed(state));
  for (const card of synthesisCards(state, agg)) {
    // econ N14: a card that ships zero atoms used to vanish from the sweep
    // silently. `beyond` is the one legitimate case — it carries real-world
    // facts, which are `gate-l2-sr`'s to verify and not computable from state.
    // Every other card is registered, and a NEW card with no atoms is now a
    // detectable hole rather than an invisible one.
    if (card.claims && card.claims.length > 0) push(`synthesis:${card.id}`, { text: card.body, claims: card.claims });
    else out.push({ surface: `synthesis:${card.id}`, text: card.body, claims: [] });
  }
  for (const row of agg.giveAndTake) {
    push(`play:desk-${row.deskNumber}:choiceLine`, deskChoiceLineClaimed(row));
    // W5 B-1: the heading over the same three zeroes, swept beside the sentence
    // it sits on top of — the two used to branch on different quantities.
    push(`play:desk-${row.deskNumber}:choiceHeading`, deskChoiceHeadingClaimed(row));
    // econ FL-K: the give/take sub-label is a computed share, and swept.
    push(`play:desk-${row.deskNumber}:dealtLine`, dealtLineClaimed(row));
  }
  for (const club of state.clubs.slice(0, state.leagueSize)) {
    if (club.seatId === null) continue;
    for (const w of club.weeks) {
      const cf = priceCounterfactualFor(state, club, w);
      push(`play:desk-${club.deskNumber}:week-${w.week + 1}:priceCounterfactual`, { text: `${cf.line} ${cf.tableText} ${cf.verdict}`, claims: cf.claims });
    }
  }
  return out;
}

export function teacherDirector(state: HostLeagueState, phase: CanonicalPhase): DirectorPanel {
  const live = state.clubs.filter((c) => c.seatId !== null).length;
  const locked = state.clubs.filter((c) => c.seatId !== null && c.locked).length;
  const weekNumber = openWeekNumber(state);
  const barDue = state.weekIndex >= 1 && !state.barReleased;
  const timeCut =
    "Past minute 44? Drop week 3 entirely. Two weeks is enough for the decomposition, and the Handed-To-You bar IS the lesson — go straight to it and keep the seven minutes of synthesis.";

  switch (phase) {
    case "LOBBY":
      return {
        phase,
        minuteBudget: "2 min",
        now: [
          "Pairs join at /play on one device. Clubs are handed out by desk number, visibly, and the board shows the whole league as it fills.",
          'Read the board line out loud: "This room is the league."',
          `${live} desk${live === 1 ? "" : "s"} in so far, in a ${state.leagueSize}-club league.`,
          "Tell the room to write their 4-digit rejoin PIN somewhere that is not the screen showing it — the back of a hand, a corner of a notebook. If a Chromebook dies, that PIN puts them straight back at their own desk. If they lost it, press Reseat beside their name and read them a new one.",
        ],
        ask: [{ q: "Whose building are you running? Say the club and the city.", answer: null }],
        dontExplainYet: [
          "Do not explain Draw yet — the board does it in HOOK.",
          "Say nothing about who is visiting whom. Let them find their own schedule.",
        ],
        trigger: live === 0 ? "Nobody has joined yet. The join URL and code are at the top of this console." : null,
        timeCut,
      };

    case "HOOK":
      return {
        phase,
        minuteBudget: "4 min",
        now: [
          "Put the two real numbers up and read them slowly: the Lakers' local television money, about $149M a year; the Grizzlies', under $10M. Same league, same season, 2016-17.",
          'Ask the question on the board and take exactly two answers. Do not evaluate them — you are collecting, not marking.',
          "Then point at the league table: every club, its market size, and the Draw it starts on. Say once that the starting Draws have nothing to do with market size.",
        ],
        ask: [
          { q: HOOK_QUESTION, answer: "Take whatever they give you. The honest answer is market size, and they will get there on their own in about twenty minutes." },
          { q: "Whose club is visiting you first? What is their Draw?", answer: "Every desk can read this straight off their own screen. You are just making sure everybody has found it." },
        ],
        dontExplainYet: [
          "REVENUE SHARING. Not one word of it today — it is the whole of the next lesson and it lands flat if they meet it before they have suffered the problem.",
          "The words EXTERNALITY and SPILLOVER. They are earned at SYNTHESIS, not given at HOOK.",
          "Do not tell them the visitor matters. That is the discovery.",
        ],
        trigger: null,
        timeCut,
      };

    case "PLAY": {
      const done = state.weekIndex >= WEEK_COUNT;
      const isWeek2 = state.weekIndex === 1;
      const isWeek3 = state.weekIndex === WEEK_COUNT - 1;
      return {
        phase,
        minuteBudget: done ? "wrap up — move to REVEAL" : isWeek3 ? "Week 3: 5 min" : "Weeks 1-2: 12 min",
        now: done
          ? [
              "All three weeks are in the books.",
              state.barReleased
                ? "The bar is already up. Advance to REVEAL and stage the rest — the ledger, the pipes, the small-market path, and what the room did after it saw the bar."
                : "The projector is holding. Advance to REVEAL and put it up one beat at a time.",
            ]
          : isWeek2
            ? [
                `Week ${weekNumber} of ${WEEK_COUNT}. Read the star-departure card off the board slowly — name the club, name the new Draw, and name the desks who are hosting them.`,
                "Do not soften it and do not apologise for it. Somebody's building is about to be half empty for a reason they did not cause. That is the lesson arriving.",
                `${locked}/${live} desks locked in.`,
              ]
            : isWeek3
              ? [
                  `Week ${weekNumber} of ${WEEK_COUNT} — the last one, and the one that is worth watching.`,
                  "They have now seen who filled their buildings. Watch the reinvest dial, not the price: does anybody move it, and which way?",
                  "Say nothing about what the right move is. The board will show the room its own answer in four minutes.",
                  `${locked}/${live} desks locked in.`,
                ]
              : [
                  `Week ${weekNumber} of ${WEEK_COUNT}. Read the schedule off the board, then get out of the way. Pairs commit blind — there is no preview on their screen and there is not supposed to be.`,
                  "Close the week yourself when the room is ready. Every building in the league settles at the same moment.",
                  `${locked}/${live} desks locked in.`,
                ],
        ask: done
          ? [
              { q: "Before we look: whose building was fullest, and who was visiting them?", answer: "Hold the answer — the first reveal beat puts every desk's own split on the projector and they can read it off their own bar." },
              { q: "Who had a week they could not explain?", answer: null },
            ]
          : [
              {
                q: isWeek3 ? "You have seen who fills your building. Does that change what you do with your money?" : "Who is visiting you this week, and what is their Draw?",
                answer: isWeek3
                  ? "Do not answer it. The reinvest dial buys Draw, and Draw mostly earns money in OTHER people's buildings — a genuinely uncomfortable fact that Lesson 3 exists to do something about. Let them sit in it."
                  : "It is printed on every screen. You are checking that the room has noticed the number, not testing them.",
              },
              { q: "(after the week closes) Who is surprised? Say the number you expected first.", answer: null },
            ],
        dontExplainYet: [
          "Still no REVENUE SHARING, and still no EXTERNALITY.",
          "Do not tell the room that the visitor was the biggest block on their bar. The bar says it, and it is worth far more if they see it first.",
        ],
        trigger: barDue
          ? state.weekIndex >= 2
            ? "TRIGGER: this is the moment. Release the HANDED-TO-YOU BAR now, before week 3, so the room plays its last week knowing what it now knows."
            : "The Handed-To-You bar is available. It lands hardest after WEEK 2 — hold it one more week if you can."
          : state.weekIndex < 1
            ? "The Handed-To-You bar unlocks once week 1 is closed."
            : null,
        timeCut,
      };
    }

    case "REVEAL": {
      const ritual = ritualStageOf(state);
      const ritualBeat =
        state.revealStage < REVEAL_STEPS
          ? {
              now: [] as string[],
              ask: [] as { q: string; answer: string | null }[],
              dontExplainYet: [] as string[],
              trigger: null as string | null,
            }
          : poolRitualDirectorBeat(state, ritual);
      return {
        phase,
        minuteBudget: "8 min · POOL RITUAL 9 min",
        now: [
          "Five presses, one beat each. The next one is named on the button — read it before you press it.",
          "Between presses, say one sentence and stop. The line for each stage is under the button.",
          "On the bar: give the instruction on screen and then be quiet. \"Point at the club that paid for your night.\" Let them point.",
          ...ritualBeat.now,
        ],
        ask: [
          {
            q: "Your building was fuller in one week than another. What was different?",
            answer:
              "Almost always the visiting club's Draw, and the bar prints each desk's own split so nobody has to be told. The three door blocks are: this building at this price, this desk's own Draw, and the visiting club's. Read the desk's own numbers rather than naming a cause yourself.",
          },
          {
            q: "Whose money is the tallest block on every single bar?",
            answer:
              "For almost every club in this room it is the national television check — identical for everybody, and nobody here can move it by a dollar. Read the printed percentages rather than asserting it: if a desk priced high into big visitors its own gate can beat the check, and that desk is worth asking. Then say the part that keeps it honest either way: it is not free money. The networks pay about $76 billion over eleven years and in exchange they get to say when your team plays.",
          },
          ...ritualBeat.ask,
        ],
        dontExplainYet: ["Hold REVENUE SHARING until the last card of SYNTHESIS, where it is named as the NEXT lesson, not this one.", ...ritualBeat.dontExplainYet],
        trigger:
          state.revealStage < REVEAL_STEPS
            ? `Next press: ${REVEAL_STAGES[state.revealStage]?.name ?? "the next stage"} (${state.revealStage + 1} of ${REVEAL_STEPS}).`
            : (ritualBeat.trigger ?? "Every reveal stage has played. Move on to ADAPT."),
        timeCut,
      };
    }

    case "ADAPT":
      return {
        phase,
        minuteBudget: "5 min",
        now: [
          "Ask the three questions IN THIS ORDER. Take answers from desks, not from yourself.",
          "The bar is still on the projector. Point at it; make them point at it.",
          "If a desk blames a classmate, do not referee it — turn it into economics: \"what would they have had to do differently, and would it have been worth it to them?\"",
        ],
        ask: [
          {
            q: ADAPT_QUESTIONS[0]!,
            answer: "The visiting club's block, on almost every desk. It is the only block on the bar that the desk did not choose, and it is usually the one that moved most between their best and worst weeks.",
          },
          {
            q: ADAPT_QUESTIONS[1]!,
            answer: `Name the desk and let them answer for themselves — but hold the honest proportion in your head, because it is the whole difference between economics and blame. Most of any club's Draw was DEALT, not bought: moving the whole room from 0% to 40% for three straight weeks only moves the visitor block about 30%, and at realistic dials it is nearer 19%. So the true answer is usually 'whoever was dealt the club the schedule sent you' plus a slice somebody chose. Ask the second half out loud: what could they have done to make it bigger, and would it have been worth it to them?${
              // W5 B-1: this is the beat that sends the room to the gave/got
              // numbers. The abstaining desk gets its line HERE, where the
              // teacher is about to name desks, not three panels away.
              neverLockedFramingClaimed(state) ? ` ${neverLockedFramingClaimed(state)!.text}` : ""
            }`,
          },
          {
            q: ADAPT_QUESTIONS[2]!,
            answer: adaptSpendAnswer(state),
          },
        ],
        dontExplainYet: [
          "You can now say SPILLOVER if the room gets there. Hold EXTERNALITY unless somebody asks for the grown-up word.",
        ],
        trigger: null,
        timeCut,
      };

    case "ARGUE":
      return {
        phase,
        minuteBudget: "6 min",
        now: [
          "Read the Dallas story off the board — the whole of it, including the lottery, in the same breath. Never one without the other.",
          "Then ask the question and take three answers. Do not resolve it.",
        ],
        ask: [
          {
            q: ARGUE_PROMPT,
            answer:
              "Nobody changed a ticket price and demand collapsed anyway — the club's own Draw fell because of a decision about people, not about money. And the part this room now has the equipment to see: every building Dallas was scheduled to visit lost money too, and none of those clubs had done anything.",
          },
          { q: "Dallas won the lottery afterwards. Does that make the trade a good decision?", answer: "No, and the reverse is also true. Outcome is not decision quality — in both directions. That is the same rule Module 1 taught and it does not stop being true here." },
        ],
        dontExplainYet: ["Do not let this become a conversation about whether the trade was good. It is a conversation about who else it cost."],
        trigger: null,
        timeCut: "This is the designated cut. Past minute 46, skip ARGUE and go to SYNTHESIS — the module survives without it.",
      };

    case "SYNTHESIS":
      return {
        phase,
        minuteBudget: "7 min",
        now: [
          "This is the part the simulation does not do for you. Name each thing they already felt, in order, off the board's own cards.",
          "The cards come up ONE at a time — press 'Next card' when you have said this one. Short of time? The first two are the lesson.",
          "Every number on those cards is computed from THIS class's weeks — you can point at any figure and it belongs to somebody in the room.",
        ],
        ask: [
          {
            q: "Say it in your own words: why can't you run a basketball club on your own?",
            answer: "Because the thing you sell is a game, and a game takes two clubs. Half of what filled your building was a club you do not control. The grown-up words are SHARED PRODUCT and SPILLOVER.",
          },
          {
            q: "The national check is the same for everybody and nobody in this room can move it. Is that fair?",
            answer: "Do not answer it — that is next lesson, and this is the question that opens it. What you CAN say is what it costs: the league sells one product to the networks, and to sell it, it gives up start times, the schedule and the playoff format.",
          },
          { q: EXIT_PROMPT, answer: "No single right answer. You want a week named, and a club named that is not their own." },
        ],
        dontExplainYet: ["Nothing. This is the beat where every term gets said out loud — except the rule itself, which is next lesson's."],
        trigger: null,
        // gate-l2-teacher N2: this named a card title ("YOU DON'T PLAY ALONE")
        // that exists nowhere in the live deck — it was the zero-student
        // placeholder's title. Cards are named by number and live title now.
        timeCut: "Past minute 55? Say card 1, SHARED PRODUCT, and card 2, SPILLOVER, and stop. Those two are the lesson.",
      };

    case "COMPLETE":
      return {
        phase,
        minuteBudget: "1 min",
        now: ["Read the closing line off the board and tell them what the next lesson does: this room writes the rule."],
        ask: [{ q: EXIT_PROMPT, answer: null }],
        dontExplainYet: [],
        trigger: null,
        timeCut,
      };

    default:
      return { phase, minuteBudget: "", now: [], ask: [], dontExplainYet: [], trigger: null, timeCut };
  }
}

/* ------------------------------------------------------------ synthesis -- */

export type SynthesisCard = { id: string; title: string; body: string; claims?: readonly ClaimAtom[] };

/** Every card is computed from THIS class's own weeks — never scripted, never recomputed against numbers the room did not play. */
export function synthesisCards(state: HostLeagueState, agg: HostLeagueAggregate): SynthesisCard[] {
  // `gate-l2-teacher` B5 (BLOCKING). The rehearsal the product prescribes ran
  // with zero desks, and the five-card deck collapsed to one placeholder titled
  // YOU DON'T PLAY ALONE — a title that exists nowhere in the live deck, and
  // which the SYNTHESIS time-cut then told the teacher to say. A teacher who
  // rehearsed as instructed met five unseen cards in the last seven minutes of
  // a real period. These are the five real card TEMPLATES with stand-in
  // figures, every one marked REHEARSAL in the title so no live room could
  // read them as its own arithmetic.
  if (agg.homeRevenueDecomposition.length === 0) {
    const stand = (title: string, body: string): SynthesisCard => ({
      id: `rehearsal-${title.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24)}`,
      title: `REHEARSAL — ${title}`,
      body: `${body}\n\nEvery figure above is a STAND-IN. With a real class this card is computed from your room's own weeks and names your own desks.`,
    });
    return [
      stand(
        "SHARED PRODUCT",
        "44% of every dollar that came through a door in this room was brought by a club somebody else was running. The single biggest example is Desk 1 · New York's week 3: Oklahoma City visited at Draw 73 and put $858,186 on New York's books. You cannot play a basketball game on your own, so you cannot earn a basketball game's money on your own either. Economists call that a SHARED PRODUCT — one thing, made by two clubs, sold once.",
      ),
      stand(
        "SPILLOVER",
        "Putting money back into your club paid YOU and it paid the buildings you visited. Across this room, reinvesting was worth $612,000 to the desks' own books and put $498,000 on other clubs' books — 45% of the value it created landed somewhere the desk that paid for it never sees. A cost or a benefit that lands on somebody who did not choose it is a SPILLOVER — the grown-up word is EXTERNALITY. Nobody here did anything wrong; the money simply does not land where the effort goes.",
      ),
      stand(
        "THE CHECK NOBODY CONTROLS",
        `For Desk 5 · Milwaukee, the national check was 55.6% of everything the club earned and the gate was 16.6%. For Desk 8 · L.A. Lakers it was 29.1% against a gate of 26.3%. Four pipes, four different shapes: the gate you set tonight, the in-arena money that follows BODIES and not price, the local money that grows slowly with your Draw, and one fixed national check that is identical for every club and that nobody in this room can move. ${PIPES_REVEAL_COPY}`,
      ),
      stand(
        "MARKET SIZE IS NOT DESTINY",
        "Desk 4 · Oklahoma City runs one of the league's smallest markets. Hosting Boston at Draw 68, priced at $52, that building took $785,680 through the door. Desk 3 · Golden State runs one of the biggest. Hosting Indiana at Draw 24, priced at $56, it took $523,212. The small market won that week by $262,468, and the three blocks say why: $301,004 of that gap is the visiting club. WHO WAS VISITING carried it. Market size is real and you did not choose it. It is also not the only thing in the arithmetic.",
      ),
      stand("AND ONE MORE THING", `${M1_BRIDGE_LINE} Next lesson this room decides how much of the money you just counted gets shared — and then lives under its own rule.`),
    ];
  }
  const cards: SynthesisCard[] = [];
  const rows = agg.homeRevenueDecomposition;
  const totalVisitor = rows.reduce((s, r) => s + r.fromVisitorDraw, 0);
  const totalDoor = rows.reduce((s, r) => s + r.fromBuilding + r.fromOwnDraw + r.fromVisitorDraw, 0);
  const pct = totalDoor > 0 ? Math.round((totalVisitor / totalDoor) * 100) : 0;
  const biggest = [...agg.visitorLedger].sort((a, b) => b.gateLift - a.gateLift)[0] ?? null;

  const pctClaim = claim("sharedProduct.visitorPct", pct, "percent", { bounds: { min: 0, max: 100 } });
  // W5 THE POOL / THE VISITOR LINE (D61 R-12). This card already names the
  // room's shared-product mechanism, so the pool's own visitor-money number
  // lands here rather than as a separate card — a fixed synthesis deck length
  // is asserted by test. EXTERNALITY is named ONLY at 7-8 (R-13, pending
  // founder confirmation); at 5-6 the same fact is said plainly.
  const poolVisitorTotal = poolOf(state).length > 0 ? visitorLineFor(state).reduce((s, v) => s + v.visitorDollars, 0) : null;
  const poolVisitorClaim = poolVisitorTotal !== null ? claim("sharedProduct.poolVisitorTotal", poolVisitorTotal, "money", { assertsSign: "nonNegative", bounds: { min: 0 } }) : null;
  const band = bandOfRoom(state);
  cards.push({
    id: "shared-product",
    claims: poolVisitorClaim ? [pctClaim, poolVisitorClaim] : [pctClaim],
    title: "SHARED PRODUCT",
    body: `${pctClaim.rendered} of every dollar that came through a door in this room was brought by a club somebody else was running.${
      biggest
        ? ` The single biggest example is ${biggest.hostHandle}'s week ${biggest.week}: ${biggest.visitorClub} visited at Draw ${biggest.visitorDraw} and put ${money(biggest.gateLift)} on ${biggest.hostHandle.split(" · ")[0]}'s books.`
        : ""
    } You cannot play a basketball game on your own, so you cannot earn a basketball game's money on your own either. Economists call that a SHARED PRODUCT — one thing, made by two clubs, sold once.${
      poolVisitorClaim
        ? ` Add up every building's season and it comes to ${poolVisitorClaim.rendered} that landed on this room's own books because of a visitor's own drawing power${band === "7-8" ? " — money that lands on somebody who did not choose it is a SPILLOVER, and the grown-up word for it is EXTERNALITY" : ", not a decision the home building made"}.`
        : ""
    }`,
  });

  // `gate-l2-econ` N1 / N3 / B1 / B6 (BLOCKING x2). This card used to open
  // "most of what it earned did not land on your books" — false on totals
  // (52/48 the desk's own way at the private optimum) — and then name the
  // MINIMUM-`net` desk as the room's biggest giver. In a probed 12-desk room
  // that desk was New Orleans, which reinvested $0 all season and was simply
  // dealt startDraw 72: the card named a real desk in the room and attributed
  // to its spending something it never spent.
  //
  // It now reads the by-choice instrument, prints the MEASURED share instead of
  // a quantifier, and handles the case the old card could not see at all — a
  // room where nobody reinvested has no givers, and saying so is the honest
  // card and the more interesting one.
  const ct = agg.choiceTotals;
  const biggestGiver = [...agg.giveAndTake].sort((a, b) => b.gaveByChoice - a.gaveByChoice)[0] ?? null;
  const biggestTaker = [...agg.giveAndTake].sort((a, b) => b.netByChoice - a.netByChoice)[0] ?? null;
  const spill = spilloverClaim(ct);
  const spillClaims: ClaimAtom[] = [...spill.claims];
  const namedGiver =
    biggestGiver && biggestGiver.gaveByChoice > 0
      ? (() => {
          const spent = claim("spillover.giverSpend", biggestGiver.spend, "money", { assertsSign: "positive" });
          const put = claim("spillover.giverGave", biggestGiver.gaveByChoice, "money", { assertsSign: "positive" });
          spillClaims.push(spent, put);
          return ` ${biggestGiver.deskHandle} put ${spent.rendered} back into its club, and ${put.rendered} of what that bought turned up in other people's buildings.`;
        })()
      : "";
  const namedTaker =
    biggestTaker && biggestGiver && biggestTaker.slot !== biggestGiver.slot && biggestTaker.netByChoice > 0
      ? (() => {
          const ahead = claim("spillover.takerNet", biggestTaker.netByChoice, "money", { assertsSign: "positive" });
          spillClaims.push(ahead);
          return ` ${biggestTaker.deskHandle} came out ${ahead.rendered} ahead on money other desks chose to spend.`;
        })()
      : "";
  cards.push({
    id: "spillover",
    title: "SPILLOVER",
    // D62 repair 5: EXTERNALITY is named only at 7-8; 5-6 gets the same fact
    // in plain words and never sees the term.
    body: ct.anySpend
      ? `Putting money back into your club pays two sets of books at once. ${spill.text}${namedGiver}${namedTaker} A cost or a benefit that lands on somebody who did not choose it is a SPILLOVER${
          band === "7-8" ? " — the grown-up word is EXTERNALITY" : " — it lands on a building that made no decision at all"
        }. Nobody here did anything wrong; the money simply does not land where the effort goes.`
      : `${spill.text} Every dollar that filled your building came from the Draw you were dealt and from who the schedule sent you — and it still did not land where it was earned. That is the point, and it is sharper this way: a cost or a benefit that lands on somebody who did not choose it is a SPILLOVER${
          band === "7-8" ? ", the grown-up word is EXTERNALITY," : ", it lands on a building that made no decision at all,"
        } and it does not need anybody to be generous. It only needs the thing you sell to be made by two clubs.`,
    claims: spillClaims,
  });

  const pipes = [...agg.pipes].sort((a, b) => b.nationalPct - a.nationalPct);
  const mostDependent = pipes[0] ?? null;
  const leastDependent = pipes[pipes.length - 1] ?? null;
  // econ N14: this card shipped four model-derived percentages and ZERO atoms,
  // so the sweep could not see it at all — an unregistered claim surface is
  // exactly the hole the claim layer exists to close. They are shares of a
  // total, so the drift risk is lower than spillover's; "lower" is not "audited".
  const compClaims: ClaimAtom[] = [];
  const mostNat = mostDependent ? claim("composition.mostNationalPct", mostDependent.nationalPct, "percent1", { bounds: { min: 0, max: 100 } }) : null;
  const mostGate = mostDependent ? claim("composition.mostGatePct", mostDependent.gatePct, "percent1", { bounds: { min: 0, max: 100 } }) : null;
  const showLeast = Boolean(leastDependent && mostDependent && leastDependent.slot !== mostDependent.slot);
  const leastNat = showLeast ? claim("composition.leastNationalPct", leastDependent!.nationalPct, "percent1", { bounds: { min: 0, max: 100 } }) : null;
  const leastGate = showLeast ? claim("composition.leastGatePct", leastDependent!.gatePct, "percent1", { bounds: { min: 0, max: 100 } }) : null;
  for (const a of [mostNat, mostGate, leastNat, leastGate]) if (a) compClaims.push(a);
  // econ N21 / FL-M. The title was "THE BIGGEST CHECK IS THE ONE NOBODY
  // CONTROLS" — an unbound superlative, and false for 28-30 of every 100 desk
  // instances at every price probed (a desk's local media routinely beats its
  // national check). The title now claims only what is true of every desk in
  // the league — the national check is the one nobody controls — and the
  // superlative it used to assert is printed as a COUNTED fact in the body,
  // where the audit can recompute it.
  const nationalBiggest = pipes.filter((p) => p.national >= p.gate && p.national >= p.inArena && p.national >= p.localMedia).length;
  const natCount = claim("composition.nationalBiggestCount", nationalBiggest, "int", { bounds: { min: 0, max: pipes.length } });
  const deskCount = claim("composition.pipeDeskCount", pipes.length, "int", { bounds: { min: 0 } });
  const natWord = `on ${natCount.rendered} of ${deskCount.rendered} desks`;
  if (pipes.length > 0) compClaims.push(natCount, deskCount, claimWord("composition.nationalBiggestQuantifier", natWord, true));
  cards.push({
    id: "composition",
    claims: compClaims,
    title: "THE CHECK NOBODY CONTROLS",
    body: `${
      mostDependent && mostNat && mostGate
        ? `For ${mostDependent.deskHandle}, the national check was ${mostNat.rendered} of everything the club earned and the gate was ${mostGate.rendered}.`
        : ""
    }${showLeast && leastNat && leastGate ? ` For ${leastDependent!.deskHandle} it was ${leastNat.rendered} against a gate of ${leastGate.rendered}.` : ""}${
      pipes.length > 0 ? ` That national check was the single biggest of the four pipes ${natWord} in this room tonight — and it is the one pipe no desk here can move a dollar of.` : ""
    } Four pipes, four different shapes: the gate you set tonight, the in-arena money that follows BODIES and not price, the local money that grows slowly with your Draw, and one fixed national check that is identical for every club and that nobody in this room can move. ${PIPES_REVEAL_COPY}`,
  });

  const path = agg.smallMarketPath;
  cards.push({
    id: "market-size",
    claims: path.claims,
    title: "MARKET SIZE IS NOT DESTINY",
    body: path.found
      ? `${path.line} Market size is real and you did not choose it. It is also not the only thing in the arithmetic — and Oklahoma City, one of the league's smallest markets, won the 2025 title.`
      : `${path.line} Market size is real and you did not choose it — it is inherited, it is printed, and it is never a score. Oklahoma City is one of the league's smallest markets and won the 2025 title.`,
  });

  cards.push({
    id: "beyond",
    title: "AND ONE MORE THING",
    body: `${M1_BRIDGE_LINE} Next lesson this room decides how much of the money you just counted gets shared — and then lives under its own rule.`,
  });

  return cards;
}
