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
import type { LessonAction, LessonModule, ReduceContext, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

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
  revealStage: number;
  barPage: number;
  synthPage: number;
};

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

export type RevealStage = { stage: number; name: string; headline: string; say: string };

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

function makeClub(slot: number): Club {
  const def = CLUBS[slot]!;
  return {
    slot,
    profileId: def.profileId,
    seatId: null,
    deskNumber: null,
    crestIndex: slot % CREST_COUNT,
    draw: def.startDraw,
    cash: 0,
    price: PROFILE_BY_ID.get(def.profileId)!.housePrice,
    share: 0,
    locked: false,
    joinedAtWeek: 1,
    starGone: false,
    weeks: [],
  };
}

function withLeagueSize(state: HostLeagueState, size: number): HostLeagueState {
  if (size <= state.clubs.length) return { ...state, leagueSize: size };
  const clubs = state.clubs.slice();
  for (let i = clubs.length; i < size; i += 1) clubs.push(makeClub(i));
  return { ...state, clubs, leagueSize: size };
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
  for (let i = 0; i < size; i += 1) {
    const club = state.clubs[i]!;
    const v = visitorSlotFor(i, week, size);
    homes.push(settleHome(profileOf(club), defOf(club).capacity, drawBefore[i]!, drawBefore[v]!, prices[i]!));
  }

  const clubs = state.clubs.slice();
  for (let i = 0; i < size; i += 1) {
    const club = state.clubs[i]!;
    const profile = profileOf(club);
    const visitorSlot = visitorSlotFor(i, week, size);
    const roadHostSlot = hostSlotFor(i, week, size);
    const home = homes[i]!;
    const roadHome = homes[roadHostSlot]!;
    const localMedia = localMediaFor(profile, drawBefore[i]!);
    const reinvestPaid = Math.round((shares[i]! / 100) * home.doorMoney);
    const net = home.doorMoney + localMedia + NATIONAL - profile.bill - reinvestPaid;
    const cashAfter = club.cash + net;
    const drawAfter = nextDraw(profile, drawBefore[i]!, reinvestPaid);
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
    };
    clubs[i] = {
      ...club,
      cash: cashAfter,
      draw: drawAfter,
      price: profile.housePrice,
      share: 0,
      locked: false,
      weeks: [...club.weeks, settled],
    };
  }

  let next: HostLeagueState = { ...state, clubs, weekIndex: week + 1 };
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

export const deskHandleFor = (club: Club): string => `Desk ${club.deskNumber} · ${CLUBS[club.slot]!.short}`;
export const clubHandleFor = (club: Club): string =>
  club.seatId === null ? `${CLUBS[club.slot]!.short} · league office` : deskHandleFor(club);

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

export type Claimed = { text: string; claims: readonly ClaimAtom[] };

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
 * THE ROOM'S OWN BOOKS AT ONE UNIFORM DIAL SETTING (econ N17 / B11).
 *
 * `roomJointGain` answers ONE counterfactual — "what if nobody had put anything
 * back" — and answers it as a total against a zero baseline. It cannot decide a
 * question about LEVEL. This is the same computation, generalised: the identical
 * season, the identical schedule and the identical prices, with every desk's
 * reinvest dial pinned at `share` instead of at 0.
 *
 * It is the same family and the same carve-outs, deliberately:
 *  - `stock` weeks, bot clubs and the pinned star-departure club keep their
 *    ACTUAL spend and (for the pinned club) their actual Draw path, exactly as
 *    `baselineDrawPathFor` declares;
 *  - only live desks' cash is counted, exactly as `roomJointGain` counts it;
 *  - `roomCashAtUniformShare(state, 0)` is by construction the same number
 *    `roomJointGain` subtracts (a test asserts it).
 *
 * It cannot reuse `baselineDrawPathFor` because above 0% the counterfactual is
 * COUPLED: what a desk spends is a share of a door that depends on the visiting
 * desk's counterfactual Draw. So the whole league is marched forward one week at
 * a time, every home night settled before any Draw is written back — the same
 * ordering `settleWeek` uses, so no club's counterfactual can depend on the
 * order the loop happened to visit it.
 */
export function roomCashAtUniformShare(state: HostLeagueState, share: number): number {
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
      const spend = isMine ? Math.round((share / 100) * home.doorMoney) : w.reinvestPaid;
      if (c.seatId !== null) cash += home.doorMoney + localMediaFor(profile, before) + w.national - w.bill - spend;
      after.set(c.slot, state.shockSlot === c.slot ? (c.weeks[i + 1]?.hostDrawBefore ?? c.draw) : nextDraw(profile, before, spend));
    }
    for (const [slot, d] of after) draw.set(slot, d);
  }
  return Math.round(cash);
}

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
  /** Room cash at `actualShare`, and one dial step either side of it. */
  cashAtActual: number;
  cashOneStepUp: number | null;
  cashOneStepDown: number | null;
  relation: "below" | "inside" | "above" | "unclear";
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
  const cashAtActual = roomCashAtUniformShare(state, actualShare);
  const cashOneStepUp = actualShare + SHARE_STEP <= SHARE_MAX ? roomCashAtUniformShare(state, actualShare + SHARE_STEP) : null;
  const cashOneStepDown = actualShare - SHARE_STEP >= SHARE_MIN ? roomCashAtUniformShare(state, actualShare - SHARE_STEP) : null;
  const bandLo = SHARE_GRID[lo]!;
  const bandHi = SHARE_GRID[hi]!;
  const relation: RoomOptimum["relation"] =
    actualShare < bandLo
      ? cashOneStepUp !== null && cashOneStepUp > cashAtActual
        ? "below"
        : "unclear"
      : actualShare > bandHi
        ? cashOneStepDown !== null && cashOneStepDown > cashAtActual
          ? "above"
          : "unclear"
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
    line: "This room's schedule did not put a small-market desk in front of a big visitor on the same week a big-market desk hosted a weak one, so there is no honest pair here to compare. Look at the bars instead: the visitor block is the one that moves.",
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
  const relationWord =
    opt.relation === "below"
      ? "under that band"
      : opt.relation === "above"
        ? "over that band"
        : opt.relation === "inside"
          ? "inside that band"
          : "on neither side of that band";
  const relationTail =
    opt.relation === "below"
      ? ", so putting more back in would have left this room holding more money, not less"
      : opt.relation === "above"
        ? ", so the dollars past it cost this room more than they brought back"
        : "";
  claims.push(bandLo, bandHi, level, claimWord("spillover.levelRelation", relationWord, true));
  const range = opt.bandLo === opt.bandHi ? `at ${bandLo.rendered}` : `between ${bandLo.rendered} and ${bandHi.rendered}`;
  const levelLine = `Run this room's own books at every setting on the dial and the room keeps the most ${range} — and this room's dials averaged ${level.rendered}, ${relationWord}${relationTail}.`;

  // The joint column — the room counted as one set of books.
  const direction = ct.roomJointGain > 0 ? "better off" : ct.roomJointGain < 0 ? "worse off" : "exactly level";
  const jointLine =
    ct.roomJointGain === 0
      ? `Counted as one room instead of desk by desk, reinvesting left this room ${direction}.`
      : `Counted as one room instead of desk by desk — because a dollar that lands on another desk's books is still a dollar in this room — reinvesting left this room ${joint.rendered} ${direction}.`;
  claims.push(claimWord("spillover.jointDirection", direction, true));

  return { text: `${privateLine} ${externalLine} ${jointLine} ${levelLine}`, claims };
}

export function giveAndTakeSummaryClaimed(agg: HostLeagueAggregate): Claimed {
  const ct = agg.choiceTotals;
  if (!ct.anySpend) {
    const core = spilloverClaim(ct);
    return {
      text: `Every bar here is EMPTY, and that is the finding. ${core.text} All the money that moved between these buildings came from the Draw each desk was dealt. Ask them what it would have taken to make a bar appear.`,
      claims: core.claims,
    };
  }
  const core = spilloverClaim(ct);
  return {
    text: `These bars are what the DESKS CHOSE, not what they were dealt. ${core.text} The dealt totals — every dollar drawing power moved, most of it Draw nobody bought — are printed under each row.`,
    claims: core.claims,
  };
}

export function giveAndTakeSummary(agg: HostLeagueAggregate): string {
  return giveAndTakeSummaryClaimed(agg).text;
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
const tag = <T extends object>(obj: T): T & { module: typeof MODULE_ID } => ({ module: MODULE_ID, ...obj });

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
    why: "It is the arithmetic of a full house, not a moral: below the sell-out price every extra dollar is pure gain on the same crowd, while above it you start losing people. Everywhere the building does NOT fill, the two mistakes cost within 3x of each other, measured at every reachable Draw pair.",
    risk: "The mirror of the usual worry: not 'charging high is greedy' but 'charging low is safe'. It is not safe on a big week, and the card tells them the week is big before they price — both Draws are printed. HOUSE_RULES says the sentence; say it again if a desk sells out cheap.",
  },
  {
    what: "No randomness at all: no injuries, no weather, no winning streaks.",
    why: "Every outcome has to be attributable to a decision somebody in this room made, or the debrief is a shrug.",
    risk: "Real front offices are guessing under genuine uncertainty. This room is not — it is reasoning under printed information, which is a different and easier thing.",
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
export function deskChoiceLineClaimed(row: GiveAndTakeRow): Claimed {
  const got = claim("desk.receivedByChoice", row.receivedByChoice, "money", { assertsSign: "nonNegative" });
  const spent = claim("desk.spend", row.spend, "money", { assertsSign: row.spend > 0 ? "positive" : "zero" });
  if (row.spend > 0) {
    const own = claim("desk.ownGain", row.ownGain, "money", {
      assertsSign: row.ownGain > 0 ? "positive" : row.ownGain < 0 ? "negative" : "zero",
    });
    const verdict = row.ownGain > 0 ? "ahead" : row.ownGain < 0 ? "behind" : "exactly level";
    return {
      text: `Same schedule, same prices, same everything — except you put nothing back. That is the only fair thing to compare yourself to, because nobody chose their calendar. You put ${spent.rendered} back in, and on your own books that left you ${own.rendered} — ${verdict}. Other desks' spending put ${got.rendered} in your building.`,
      claims: [spent, got, own, claimWord("desk.ownGainDirection", verdict, true), claimWord("desk.choseNothing", "you put nothing back", false, "chose to give nothing")],
    };
  }
  const nothing = claimWord("desk.choseNothing", "chose to give nothing", true);
  return {
    text:
      row.receivedByChoice > 0
        ? `Those three zeroes are not missing numbers — they are your decision. You ${nothing.rendered} back to your club: ${spent.rendered}, every week. So nothing you did put a dollar in anybody else's building, and there is no "what if you had not" to compare, because you did not. And you received ${got.rendered} from the room — that is what OTHER desks chose to spend, turning up in your building on the nights they visited you.`
        : `Those three zeroes are not missing numbers — they are your decision. You ${nothing.rendered} back to your club: ${spent.rendered}, every week. And this time nobody else's spending reached your building either — ${got.rendered} came your way from anybody else's choices. Every zero in this block is somebody's decision, including yours.`,
    claims: [spent, got, nothing],
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

export const hostTheLeagueModule: LessonModule<HostLeagueState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 2 — You Don't Play Alone",
  phases: PHASES,

  /**
   * SEEDING: none, deliberately, and this is the reasoned answer to the wave
   * contract's open question rather than an omission.
   *
   * D9 persists state only where yesterday's choice creates today's problem.
   * In this lesson today's problem is created by the OTHER DESKS' decisions
   * TODAY — the visitor term is the entire mechanism. Three specific reasons
   * not to carry L1's books:
   *
   *  1. BC-5 binds the decomposition to be attributable from the UI alone. A
   *     carried per-desk demand term would put a fourth channel on every bar
   *     that nobody in the room created this lesson and nobody can see another
   *     desk's version of.
   *  2. L1 runs two markets across every desk; L2 gives every desk its own
   *     club. The design's "carry your market into L2" limb is not
   *     implementable as written without inventing a mapping.
   *  3. L1's carried CASH would be mechanically inert here: the equal national
   *     check clears any carried debt inside week 1, so it would be continuity
   *     theatre rather than a constraint.
   *
   * What IS carried is the lesson-level chain, in copy: L1 closes on "most of
   * the people in your building came to see somebody else's team" and this
   * lesson opens on it. If a later gate wants mechanical continuity, the
   * cheapest honest limb is L1 renewals -> this club's `base0` offset, printed
   * on a how-you-got-here card and named inside the `fromBuilding` block.
   */
  initialState() {
    const clubs: Club[] = [];
    for (let i = 0; i < MIN_LEAGUE; i += 1) clubs.push(makeClub(i));
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
    };
  },

  /**
   * Manual-fallback discipline: no reveal in this lesson depends on a click
   * that may never come. Leaving PLAY settles every week still open (the first
   * one on the pairs' own dials, per D17's honour-what-was-submitted
   * precedent) and releases the mid-lesson bar; leaving REVEAL plays out every
   * remaining stage.
   */
  onPhaseExit(state, fromPhase) {
    let next = state;
    if (fromPhase === "HOOK") next = { ...next, leagueFrozen: true };
    if (fromPhase === "PLAY") {
      let first = true;
      while (next.weekIndex < WEEK_COUNT) {
        next = settleWeek(next, first);
        first = false;
      }
      if (!next.barReleased) next = { ...next, barReleased: true, barReleasedAtWeek: next.weekIndex, lockedAtBarRelease: lockedNow(next) };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    return next;
  },

  reduce(state, action: LessonAction, ctx: ReduceContext): ReduceResult<HostLeagueState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a club" };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: false, reason: `clubs are handed out in LOBBY, HOOK or PLAY (session is in ${ctx.phase})` };
      }
      return seatDesk(state, ctx.seatId);
    }

    if (action.type === "setPrice" || action.type === "setShare" || action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only run a week during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can work a club" };
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

    return { ok: false, reason: `unknown action "${action.type}"` };
  },

  allowedActions(phase) {
    if (phase === "LOBBY" || phase === "HOOK") return ["takeSeat"];
    if (phase === "PLAY") return ["takeSeat", "setPrice", "setShare", "lock"];
    return [];
  },

  studentView(state, seatId, phase) {
    const slot = state.seatToSlot[seatId];
    const view = ((): Record<string, unknown> => {
      if (slot === undefined) return { phase, seated: false, message: "You're in! Finding your club…" };
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
            modeledDollarsLine: MODELED_DOLLARS_LINE,
            slate: slateFor(state, slot),
            league: state.clubs.slice(0, state.leagueSize).map((c) => clubCard(state, c.slot)),
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
              message: "All three weeks are in the books. Look up at the board.",
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
            modeledDollarsLine: MODELED_DOLLARS_LINE,
            history,
            lastSettled: history[history.length - 1] ?? null,
            message: club.locked
              ? "Locked. Nothing to do but find out — the week closes when your teacher says so."
              : "No preview. Read the card, read the Draws, and commit.",
          };
        }

        case "REVEAL":
        case "ADAPT": {
          const agg = computeAggregate(state);
          const mine = agg.homeRevenueDecomposition.find((d) => d.slot === slot) ?? null;
          const give = agg.giveAndTake.find((g) => g.slot === slot) ?? null;
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(club),
            history,
            mine,
            give,
            // play N-4: the free-riding desk's block is three zeroes, and the
            // sentence under it has to be about ITS decision, not about a
            // counterfactual identical to what it did.
            giveLine: give ? deskChoiceLineClaimed(give).text : "",
            // econ FL-K: the "most of it was DEALT" sub-label is computed, not asserted.
            dealtLine: give ? dealtLineClaimed(give).text : "",
            revealStage: state.revealStage,
            totalRevealSteps: REVEAL_STEPS,
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

        case "SYNTHESIS":
          return { phase, seated: true, ...identity, books: booksFor(club), message: "Look up at the board.", exitPrompt: EXIT_PROMPT };

        case "COMPLETE":
          return { phase, seated: true, ...identity, books: booksFor(club), message: COMPLETE_COPY, exitPrompt: EXIT_PROMPT };

        default:
          return { phase, seated: true, ...identity };
      }
    })();
    return tag(view);
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
    return tag({
      phase,
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
    });
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
          const pairings = scheduleFor(state.weekIndex, state.leagueSize).map((p) => ({
            host: clubCard(state, p.host),
            visitor: clubCard(state, p.visitor),
          }));
          return {
            mode: "play",
            weekNumber: openWeekNumber(state),
            weekCount: WEEK_COUNT,
            pairings,
            lockedCount: agg.lockedCount,
            deskCount: agg.deskCount,
            shock:
              state.shockSlot !== null && state.weekIndex >= 1
                ? { club: CLUBS[state.shockSlot]!.name, short: CLUBS[state.shockSlot]!.short, draw: state.clubs[state.shockSlot]!.draw }
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
            ledgerSummary: state.revealStage === 2 ? giveAndTakeSummary(agg) : "",
            shockCopy: state.revealStage === 2 ? SHOCK_REVEAL_COPY : null,
            pipes: state.revealStage === 3 ? agg.pipes : [],
            pipesCopy: state.revealStage === 3 ? PIPES_REVEAL_COPY : null,
            warriorsLine: state.revealStage === 3 ? WARRIORS_LINE : null,
            smallMarketPath: state.revealStage === 4 ? agg.smallMarketPath : null,
            meanShareByWeek: state.revealStage === 5 ? agg.meanShareByWeek : null,
            changeLine: state.revealStage === 5 ? reinvestChangeLine(agg, state) : null,
            honestyLine: BOARD_HONESTY_LINE,
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
    return tag(view);
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

export function reinvestChangeLineClaimed(agg: HostLeagueAggregate, state: HostLeagueState): Claimed {
  const [w1, w2, w3] = agg.meanShareByWeek;
  const HORIZON =
    "Read that with the last-week rule in your hand: week 3 was the end. Every desk's screen said so before it priced — Draw bought in week 3 earns nothing else in this lesson. A desk doing the arithmetic had a reason to put the dial DOWN in week 3 whatever it thought of the bar. That is not cynicism, it is the horizon: investment dies when there is no tomorrow to collect in.";
  if (w3 === null || w3 === undefined) {
    return { text: `Week 3 was not played, so there is no after to compare. What the room did in weeks 1 and 2 is still its own: nobody was told what the dial was worth. ${HORIZON}`, claims: [] };
  }
  const before = [w1, w2].filter((x): x is number => typeof x === "number");
  if (before.length === 0) return { text: `Only one week is in the books, so there is no before and after to compare. ${HORIZON}`, claims: [] };
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
  const downLine = saw
    ? "The room went DOWN. At least two things could have done that and this board will not choose between them: the last-week rule, which every desk was shown, and whatever they made of the bar. Ask them which one it was — and believe them."
    : "The room went DOWN. This room never saw the bar in time, so the bar is not on the table: the last-week rule, which every desk was shown, is the cause this board can see. Ask them whether that is really why — and believe them.";
  if (Math.abs(delta) >= 1 && delta < 0) {
    claims.push(
      saw
        ? claimWord("reveal5.barNamedAsCause", "whatever they made of the bar", true)
        : claimWord("reveal5.barNamedAsCause", "the bar is not on the table", false, "whatever they made of the bar"),
    );
  }

  const direction =
    Math.abs(delta) < 1
      ? "The room held its dial where it was. Under the last-week rule that is itself a move: holding steady in a week the arithmetic told them to cut is a choice about something other than this week's cash. Ask them what."
      : delta > 0
        ? "The room went UP — against the last-week rule, which pushed the other way. Whatever moved these desks, it was not the arithmetic of this lesson. Ask them."
        : downLine;

  return { text: `${numbers} ${HORIZON} ${barClause} ${direction}`, claims };
}

export function reinvestChangeLine(agg: HostLeagueAggregate, state: HostLeagueState): string {
  return reinvestChangeLineClaimed(agg, state).text;
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
      text: `${base} Do not resolve it: ${refuses}. This is the cleanest version of the beat: you released it after the week-2 bell and NOT ONE desk had locked week 3 yet, so every pair in this room priced its last week having seen the bar. Ask the whole room, not a subset.`,
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
  if (live.length === 0) return rehearsalWatchFor(phase);
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
  const neverLocked = live.filter((c) => c.weeks.length >= 1 && c.weeks.every((w) => w.auto || w.stock)).map(deskHandleFor);
  if (neverLocked.length > 0) {
    out.push({
      id: "never-locked",
      label: "Has never locked a week — every week settled automatically",
      desks: neverLocked,
      action:
        "This is a participation problem, not a strategy. Their weeks were settled at the club's house price with nothing reinvested because nobody pressed the button — they did not choose 0%, they chose nothing. Go to the desk. Do NOT use them on the gave/got board and do not name them in the argument: they are not the free-rider case, they are the pair you have not reached yet.",
      urgency: "now",
    });
  }

  const bankers = live
    .filter((c) => {
      const chosen = c.weeks.filter((w) => !w.auto && !w.stock);
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
      action: "Recoverable, always: the national check alone clears the weekly bill for every club in this league. Say so if a pair looks sunk.",
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
      if (state.weekIndex >= WEEK_COUNT) {
        return {
          title: state.barReleased ? "Three weeks in the books — the bar is up" : "Three weeks in the books — the picture is being held",
          lines: state.barReleased
            ? ["The Handed-To-You bar is on the projector for the group you have paged to."]
            : ["The room has NOT seen the whole picture yet. It goes up one beat at a time in REVEAL."],
        };
      }
      return {
        title: `Week ${openWeekNumber(state)} of ${WEEK_COUNT} — the schedule`,
        lines: [
          "Every pairing in the league: who hosts whom, with both clubs' Draw printed.",
          `Desks locked in: ${locked} of ${live}. Nothing about this week's crowds is on the projector until you close the week.`,
          ...(state.shockSlot !== null && state.weekIndex >= 1
            ? [`The star-departure card is up: ${CLUBS[state.shockSlot]!.name}, Draw ${state.clubs[state.shockSlot]!.draw}.`]
            : []),
          ...(state.barReleased ? ["The Handed-To-You bar is up underneath the schedule."] : []),
        ],
      };
    }
    case "REVEAL": {
      // projector W4-2: `say` is resolved against this room's release arm.
      const stage = revealStagesFor(state)[state.revealStage - 1] ?? null;
      return {
        title: stage ? `Stage ${stage.stage} of ${REVEAL_STEPS} — ${stage.name}` : "Waiting for the first press",
        lines: stage ? [stage.headline, stage.say] : ['An empty frame and "Waiting for your teacher to put up the first beat."'],
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
    "You do not need the reveal board back for this — every pair has its own two numbers on its own screen right now, under WHAT YOU GAVE, WHAT YOU GOT. Tell them to read their own.";
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

    case "REVEAL":
      return {
        phase,
        minuteBudget: "8 min",
        now: [
          "Five presses, one beat each. The next one is named on the button — read it before you press it.",
          "Between presses, say one sentence and stop. The line for each stage is under the button.",
          "On the bar: give the instruction on screen and then be quiet. \"Point at the club that paid for your night.\" Let them point.",
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
        ],
        dontExplainYet: ["Hold REVENUE SHARING until the last card of SYNTHESIS, where it is named as the NEXT lesson, not this one."],
        trigger:
          state.revealStage < REVEAL_STEPS
            ? `Next press: ${REVEAL_STAGES[state.revealStage]?.name ?? "the next stage"} (${state.revealStage + 1} of ${REVEAL_STEPS}).`
            : "Every stage has played. Move on to ADAPT.",
        timeCut,
      };

    case "ADAPT":
      return {
        phase,
        minuteBudget: "5 min",
        now: [
          "Ask the three questions IN THIS ORDER. Take answers from desks, not from yourself.",
          "The bar is still on the projector. Point at it; make them point at it.",
          "If a pair blames a classmate, do not referee it — turn it into economics: \"what would they have had to do differently, and would it have been worth it to them?\"",
        ],
        ask: [
          {
            q: ADAPT_QUESTIONS[0]!,
            answer: "The visiting club's block, on almost every desk. It is the only block on the bar that the desk did not choose, and it is usually the one that moved most between their best and worst weeks.",
          },
          {
            q: ADAPT_QUESTIONS[1]!,
            answer:
              "Name the desk and let them answer for themselves — but hold the honest proportion in your head, because it is the whole difference between economics and blame. Most of any club's Draw was DEALT, not bought: moving the whole room from 0% to 40% for three straight weeks only moves the visitor block about 30%, and at realistic dials it is nearer 19%. So the true answer is usually 'whoever was dealt the club the schedule sent you' plus a slice somebody chose. Ask the second half out loud: what could they have done to make it bigger, and would it have been worth it to them?",
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
  cards.push({
    id: "shared-product",
    claims: [pctClaim],
    title: "SHARED PRODUCT",
    body: `${pctClaim.rendered} of every dollar that came through a door in this room was brought by a club somebody else was running.${
      biggest
        ? ` The single biggest example is ${biggest.hostHandle}'s week ${biggest.week}: ${biggest.visitorClub} visited at Draw ${biggest.visitorDraw} and put ${money(biggest.gateLift)} on ${biggest.hostHandle.split(" · ")[0]}'s books.`
        : ""
    } You cannot play a basketball game on your own, so you cannot earn a basketball game's money on your own either. Economists call that a SHARED PRODUCT — one thing, made by two clubs, sold once.`,
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
    body: ct.anySpend
      ? `Putting money back into your club pays two sets of books at once. ${spill.text}${namedGiver}${namedTaker} A cost or a benefit that lands on somebody who did not choose it is a SPILLOVER — the grown-up word is EXTERNALITY. Nobody here did anything wrong; the money simply does not land where the effort goes.`
      : `${spill.text} Every dollar that filled your building came from the Draw you were dealt and from who the schedule sent you — and it still did not land where it was earned. That is the point, and it is sharper this way: a cost or a benefit that lands on somebody who did not choose it is a SPILLOVER, the grown-up word is EXTERNALITY, and it does not need anybody to be generous. It only needs the thing you sell to be made by two clubs.`,
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
