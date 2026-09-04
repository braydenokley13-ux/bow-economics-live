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
import type { LessonModule, ReduceContext, ReduceResult, SeatId, UnresolvedSeat } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";
import type { GradeBand } from "../shared/gradeBand.js";
import { extractWindowCarry, type CarriedFranchise } from "./sameLine/carry.js";
import { CLUB, type ClubId } from "./sameLine/world.js";

/* ------------------------------------------------------------- markets -- */

/**
 * The two ARCHETYPE markets are the only two demand curves this lesson has
 * (`MARKETS`). D59 opens Week 4 on the student's OWN franchise carried from
 * THE WINDOW, whose world has eight clubs, so a market id is now one of those
 * eight club ids. New York and Memphis are the archetypes themselves; the other
 * six are built by `marketForClub` — the club's own printed facts over the
 * nearest archetype's hidden curve. See `CARRIED_MARKET_SIMPLIFICATION`.
 */
export type ArchetypeId = "new-york" | "memphis";
export type MarketId = ClubId;
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
   *
   * ROUND 3 (`gate-l1-play` recheck2 P12 + `gate-l1-econ-r2`): 10 fans a point
   * made the N5-repeats-N1 beat subliminal — measured in real play at +170
   * (+1.0%) and -360 (-2.1%) on two of three repeat desks, and at New York the
   * undercutting desk's punishment could not land at all, because $10 sold the
   * building out on BOTH nights. Raised to 25 with `planSlope` 1.8 -> 3.6 to pay
   * for it.
   *
   * `gate-l1-econ-r3` R8 CORRECTS THIS COMMENT. It used to read "THE CONFLICT IS
   * REAL AND THIS IS THE CEILING ... every point at renewalFans >= 30 fails P14
   * at every planSlope tried." The conflict half stands. The CEILING claim is
   * REFUTED and is withdrawn: what was actually swept here was
   * (renewalFans 10-60) x (planSlope 1.2-3.6), so planSlope was never raised
   * above 3.6 at renewalFans 30. The Economic Truth critic's independent
   * 84-point sweep (renewalFans 10-100 x planSlope 1.2-6.0, fine spend grid,
   * both markets) found `renewalFans 30 / planSlope 4.5` and `30 / 6.0` pass all
   * four P14 bars in BOTH markets WITH headroom on the margin bar (16/15 and
   * 17/16 against a bar of 15) and give a +720 Night-5 beat instead of +600.
   * 25/3.6 is therefore not the only truthful pair — it is the pair this build
   * shipped and kept, per RULING 2's ACCEPTED-WITH-REASON on the felt-scale
   * tradeoff and the wave's explicit non-goal of further constant retuning.
   * Do not cite this comment as a reason not to sweep.
   *
   * What IS structural, and is not a tuning question: the Player gate's felt bar
   * (a repeat delta >= 10% of a real 19,800 / 17,794-seat building) needs about
   * 82 (NY) / 74 (MEM) fans a point on the honest plan-price line, while P14
   * breaks somewhere above 30 — the two regions are disjoint by more than 3x and
   * no pair satisfies both, because real arena capacity is a founder invariant
   * (CLAUDE.md §3) and cannot move. Truth over drama, per charter: the beat is
   * carried by the printed per-desk decomposition (`repeatRowFor`) rather than
   * by bar length. Recorded as a tradeoff in `SIMPLIFICATIONS`, asserted by
   * harness P15.
   */
  readonly renewalFans: number;
  /** In-arena spend per fan (hidden pre-lock; revealed only as a settled dollar total). */
  readonly ancillary: number;
  /** Fans added to NEXT night's base per dollar of tonight's event spend. */
  readonly eventFans: number;
  /**
   * Dollars of event spend that buy one renewal point tonight.
   *
   * `gate-l1-econ-r3` W3-R14 CORRECTS THIS COMMENT. It read "the whole dial is
   * worth about +2 points in both markets", which R7 refuted and replaced
   * everywhere else: +2 is a CEILING, not a rate. Measured over all 280
   * card-price states per market, the full dial buys 0 points in 62% (New York)
   * and 65% (Memphis) of them — every one of those on the `RENEWAL_DELTA_CEIL` /
   * `RENEWAL_DELTA_FLOOR` clamp, because the spend term is added inside the band
   * — and it never exceeds +2 anywhere. `HOUSE_RULES[2]`, `spendRuleFor` and the
   * SIMPLIFICATIONS ledger all say "at most". This is now printed on
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
   *
   * Raised again 1.8 -> 3.6 in round 3, as the price of `renewalFans` 10 -> 25:
   * with a renewal point worth 2.5x more future crowd, the cash-max season
   * shades its prices down to keep points, and only a steeper gouge arm keeps
   * the pure-cash line far enough below the flat plan for P14's four bars to
   * hold. At the shipped pair: flat 80% vs cash-max 65% in BOTH markets,
   * against a 15-point bar.
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
  /** Which of the two tuned curves this market's hidden constants come from. */
  readonly archetype: ArchetypeId;
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
    renewalFans: 25,
    ancillary: 18,
    eventFans: 0.01,
    eventRenewalDollars: 60_000,
    planSlope: 3.2,
    premiumSpan: 92,
    capacityNote: "listed basketball capacity 19,812 · 2025-26",
    archetype: "new-york",
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
    renewalFans: 25,
    ancillary: 12,
    eventFans: 0.016,
    eventRenewalDollars: 30_000,
    planSlope: 4.1,
    premiumSpan: 90,
    capacityNote: "modeled seat count · published figures range 16,667-18,119",
    archetype: "memphis",
  },
];

/* --------------------------------------------- the carried-club markets -- */

/**
 * THE BUILDINGS. Printed facts for the six clubs that have no tuned curve of
 * their own. Every row carries its source and date because it is printed on a
 * student screen (BC-3); the six rows marked UNVERIFIED are placeholders the
 * Sports Reality pass fills — nothing here has been checked against a primary
 * source by this build, and the note says so wherever the seat count is printed.
 * New York and Memphis keep the records in `MARKETS`.
 */
export type BuildingFact = {
  readonly clubId: ClubId;
  readonly club: string;
  readonly building: string;
  readonly capacity: number;
  readonly source: string;
  readonly asOf: string;
  readonly verified: boolean;
};
const WIKI = "Wikipedia, basketball capacity, read 2026-09-04 (MEDIUM)";
export const CLUB_BUILDINGS: readonly BuildingFact[] = [
  { clubId: "detroit", club: "Detroit Pistons", building: "Little Caesars Arena", capacity: 20_332, source: WIKI, asOf: "2026-09-04", verified: true },
  { clubId: "milwaukee", club: "Milwaukee Bucks", building: "Fiserv Forum", capacity: 17_385, source: WIKI, asOf: "2026-09-04", verified: true },
  { clubId: "boston", club: "Boston Celtics", building: "TD Garden", capacity: 19_156, source: WIKI, asOf: "2026-09-04", verified: true },
  { clubId: "brooklyn", club: "Brooklyn Nets", building: "Barclays Center", capacity: 17_732, source: WIKI, asOf: "2026-09-04", verified: true },
  { clubId: "sacramento", club: "Sacramento Kings", building: "Golden 1 Center", capacity: 17_608, source: WIKI, asOf: "2026-09-04", verified: true },
  { clubId: "minnesota", club: "Minnesota Timberwolves", building: "Target Center", capacity: 18_798, source: WIKI, asOf: "2026-09-04", verified: true },
];

/**
 * REAL GATE, 2024-25, per club (Forbes estimate, calc. Oct 2025, read
 * 2026-09-04, MEDIUM; "includes club seats", may include playoff dates). Printed
 * at 7-8 beside the modeled night, divided by 41, so the D59 units seam —
 * classroom dollars against real dollars — is visible rather than hidden.
 * Never enters a computation.
 */
export const CLUB_GATE_2024_25: Readonly<Record<ClubId, number>> = {
  "new-york": 193_000_000,
  boston: 140_000_000,
  milwaukee: 75_000_000,
  brooklyn: 68_000_000,
  sacramento: 61_000_000,
  minnesota: 59_000_000,
  detroit: 56_000_000,
  memphis: 37_000_000,
};
export const CLUB_GATE_SOURCE = "Forbes estimate, Oct 2025";

/** Which tuned curve stands in for each club. Big markets take New York's; the rest take Memphis's. */
export const ARCHETYPE_OF: Readonly<Record<ClubId, ArchetypeId>> = {
  "new-york": "new-york",
  brooklyn: "new-york",
  boston: "new-york",
  memphis: "memphis",
  sacramento: "memphis",
  milwaukee: "memphis",
  minnesota: "memphis",
  detroit: "memphis",
};

/**
 * The market a carried desk runs.
 *
 * PRINTED facts (club, building, capacity, its stamp) are the club's own.
 * HIDDEN constants are the nearest archetype's, with `base0` and `weekendBase`
 * — the two absolute crowd terms — rescaled by capacity / archetype capacity so
 * the building still fills at some legal price (BC-2/R8 kept for every
 * building). Everything else (bill, plan price, dials, slopes, the renewals
 * book) is copied unchanged: the tuned properties were swept over the two
 * archetypes only, and this build does not re-tune them. Registered in
 * `SIMPLIFICATIONS`.
 */
const carriedMarketCache = new Map<ClubId, Market>();
export function marketForClub(clubId: ClubId): Market {
  const own = MARKETS.find((m) => m.id === clubId);
  if (own) return own;
  const cached = carriedMarketCache.get(clubId);
  if (cached) return cached;
  const fact = CLUB_BUILDINGS.find((b) => b.clubId === clubId);
  const arch = MARKETS.find((m) => m.id === ARCHETYPE_OF[clubId])!;
  if (!fact) return arch;
  const ratio = fact.capacity / arch.capacity;
  const market: Market = {
    ...arch,
    id: clubId,
    club: fact.club,
    building: fact.building,
    plainLine: arch.plainLine,
    capacity: fact.capacity,
    base0: Math.round(arch.base0 * ratio),
    weekendBase: Math.round(arch.weekendBase * ratio),
    capacityNote: `listed basketball capacity ${fact.capacity.toLocaleString()} · ${fact.source}`,
    archetype: ARCHETYPE_OF[clubId],
  };
  carriedMarketCache.set(clubId, market);
  return market;
}

/** Every market a desk in this room could be running: the two archetypes, then the six built clubs. */
export const ALL_MARKETS: readonly Market[] = [...MARKETS, ...CLUB_BUILDINGS.map((b) => marketForClub(b.clubId))];
const MARKET_BY_ID: ReadonlyMap<MarketId, Market> = new Map(ALL_MARKETS.map((m) => [m.id, m]));

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
  /**
   * W2 repair-2 A2/A3: the one-line version of `spendRule`, printed AT the
   * stepper inside the first viewport. The full rule stays one disclosure away,
   * verbatim. This says strictly less than `spendRule`; it adds nothing.
   */
  spendShortRule: string;
  /**
   * W2 repair-2 A3/B1: the one-line version of `renewalRuleFor`, printed under
   * the dial and again on the settled night's RENEWALS card so the movement is
   * attributable without recall. Same claims, fewer words; the full rule stays
   * one disclosure away, verbatim.
   */
  renewalShortRule: string;
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
  spendShortRule: spendShortRuleFor(m),
  renewalShortRule: renewalShortRuleFor(m),
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
  // gate-l1-econ-r3 R7: "worth about +2 renewal points" was false in 62-65% of
  // card-price states — the dial buys zero whenever the night's price has already
  // driven `renewalDelta` to its +12 ceiling or -20 floor, which is where a
  // cash-playing desk usually is. Stated as a ceiling with the zero case named.
  return `Every $${dollarsPerFan.toLocaleString()} here brings about 1 extra person NEXT night — nobody extra tonight. That person pays tomorrow's ticket price and spends inside the building, so the money comes back only on a night you can charge for. It comes back as nothing at all if tomorrow sells out without them. It can do one more thing, tonight: people who had a good night out are readier to renew, so the full $${m.eventMax.toLocaleString()} dial is worth AT MOST +${renewalPoints} renewal ${renewalPoints === 1 ? "point" : "points"} — and nothing at all on a night when your price has already moved renewals as far as they can go. Small either way, next to what your price does.`;
}

/**
 * The same rule as `spendRuleFor`, in one sentence, for the slot beside the
 * stepper (W2 repair-2 A2, Kid A #1). It carries only the first and least
 * conditional clause of the full rule — the dollars-per-person conversion and
 * the one-night lag. It claims nothing the full rule does not claim.
 */
export function spendShortRuleFor(m: Market): string {
  const dollarsPerFan = Math.round(1 / m.eventFans);
  return `Every $${dollarsPerFan.toLocaleString()} here brings about 1 extra person NEXT night, and nobody extra tonight.`;
}

/**
 * The same rule as `renewalRuleFor`, in one sentence (W2 repair-2 A3/B1). Both
 * arms of the tent are kept — under the plan price and above what tonight is
 * worth — because dropping either one would leave a false monotone rule
 * (FL-V11). The Draw/TV clause lives in the full rule, one disclosure away.
 */
export function renewalShortRuleFor(m: Market): string {
  return `Renewals follow your $${m.planPrice} season plan: price well UNDER it and the plan looks like a waste, price ABOVE what tonight is worth to them and they quit.`;
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

/**
 * W2 repair-4 R4-4a (Economic Truth re-check finding 1): the settled night's
 * cause line is the FULL rule — the short form drops the apex, the only clause
 * that can explain a renewals GAIN, and it was printed under gains. This is
 * `renewalRuleFor` split at its sentence ends, one line per clause (the lead
 * and the three arms of the tent), for a frame with room for lines; joined
 * with spaces it is the registered rule, character for character.
 */
export function renewalRuleLinesFor(m: Market): string[] {
  return renewalRuleFor(m).split(/(?<=\.) (?=[A-Z])/);
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
  /**
   * Everything NEW about tonight is on this card (R7). Two carried terms are
   * not: the desk's own renewals and last night's event spend, both of which
   * enter `curveFor`'s base and are disclosed in `HOUSE_RULES`, `renewalRule`
   * and `spendRule` on the student's own screen (gate-l1-econ-r2 N-g).
   */
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
export const RENEWAL_DELTA_FLOOR = -26;
export const RENEWAL_DELTA_CEIL = 12;
/** Renewal points lost per $1 the price sits BELOW the season-plan price (the low arm). */
export const RENEWAL_UNDERCUT_SLOPE = 2.5;
/** Extra renewal points at the top of the "your plan is a bargain tonight" ramp. */
export const RENEWAL_BARGAIN_BONUS = 6;
/**
 * How fast the gouging arm stops getting worse (W6 repair `econ-l1-renewals-dead-arm`).
 *
 * The arm used to be straight: `planSlope` renewal points per dollar over what
 * the night is worth, all the way up, and then a hard clip at the one-night
 * limit. The clip arrived a few dollars above the reference price — which on
 * three of the five cards is BELOW the night's own cash optimum. On Night 2 in
 * New York the renewals number was identical at the cash-best price, at $80 and
 * at $120, a price that draws nobody at all. A pair could not read its own
 * choice out of the second book, and worse, playing the money book WELL scored
 * the same as gouging an empty building — FL3 ("charging high is greedy")
 * reintroduced through the clip on the majority of the lesson's nights.
 *
 * The arm is bent instead of clipped: `bend * ln(1 + planSlope * over / bend)`.
 * Two properties earn it. Its slope at `over = 0` is exactly `planSlope`, so the
 * local tradeoff every earlier round tuned is preserved to first order. And it
 * keeps rising forever, so the one-night limit is still reached — just out where
 * the cash book has already collapsed, which is the only place a flat penalty is
 * honest ("you have already lost everyone you were going to lose").
 *
 * W6 SECOND PASS — THE BEND DID NOT ACTUALLY CLEAR THE CLIP. The repair above
 * shipped `bend` 12 with `planSlope` raised 3.6 -> 9.0 and the one-night limit
 * deepened -20 -> -26, because at a cheap near-field slope the season
 * cash-maximising policy kept its renewals too and P14 limb (i) — the flat line
 * must end at least 15 renewal points ahead of the most-cash line — fell to a
 * margin of 7. Bending the arm and then tripling its slope put the clip back
 * where it started: measured on those constants, `renewalDelta` returned the
 * -26 floor at 41 of the 56 legal prices on Nights 1 and 5 and on 50% of the
 * whole grid. The board's own class line printed median renewals New York 2%,
 * Memphis 0%. The defect the bend exists to kill was still shipping.
 *
 * What the sweep found is that limb (i) does not need a steep New York arm at
 * all; it needs a steep MEMPHIS one. Memphis prices from a $16 plan against New
 * York's $24, so a dollar of gouging is half again as large a share of the
 * ticket there, and the season cash-max policy is the one that notices. Exact
 * forward DP over (renewals x carry) at each candidate — the same DP P14 runs —
 * gives, at `bend` 9:
 *
 *   New York  planSlope 3.2 : margin 17 (bar 15) · range 37 (bar 30) ·
 *             renewals cost 7.2% of season cash (bar 4%) · 8 frontier points ·
 *             floor binds on 4% of the grid
 *   Memphis   planSlope 4.1 : margin 16 · range 36 · 4.6% · 6 frontier points ·
 *             floor binds on 12% of the grid
 *
 * Both sit mid-plateau, not on a knife edge: New York holds margin >= 15 across
 * 2.8-3.4 and Memphis across 3.9-4.2. Floor-binding falls from 50% of the grid
 * to 8%, and every price a desk would reach while actually playing the money
 * book now returns its own number. Asserted by P14 in
 * `docs/gauntlet/module-2/stage0/l1-tuning-harness.mjs` and by "R4-5" in the
 * suite; the deepened -26 one-night limit is kept, because it is what gives the
 * bent arm somewhere to go.
 */
export const RENEWAL_GOUGE_BEND = 9;

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
  /** The doors: what it costs to open the building tonight. Never includes players. */
  bill: number;
  /**
   * The players: tonight's fifth of the season's player bill on a carried desk
   * (D59, `obligationFor`). Zero on a stock desk and on every night settled by a
   * build before this field existed. Kept apart from `bill` so nothing is ever
   * counted twice — the two are added ONCE, here, into `net`.
   */
  payrollLine: number;
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
  payrollLine = 0,
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
    payrollLine,
    spendPaid: spend,
    bowlCost,
    net: total - market.bill - payrollLine - spend - bowlCost,
    soldOut: turnout >= seatsOpen,
  };
}

/* ------------------------------------------------------ THE BILL (D59) -- */

/**
 * THE BILL MODEL — how a real season's player bill becomes a line on a
 * classroom night. One block, so every number a student sees on the bill can
 * be traced to one of these constants and to the carried payroll.
 *
 * THE BILL IS A SEASON, NEVER A NIGHT (W4_BILL_RESEARCH.md §6-7). Stated over
 * ONE horizon, the 41-date home season, in this order:
 *
 *   tax salary (real, annual: roster salary + dead money; cap holds EXCLUDED —
 *       a hold is paid to nobody, so charging cash for it overstates Detroit
 *       by up to $52M. The BC-7 cap hit is shown as cap POSITION only.)
 *     − national TV money (real, annual, the same check for every club)
 *     = the gap (real, annual)
 *     + the luxury tax bill (real, cash, charged on tax salary above the line)
 *     = what local revenue must cover (real, annual)
 *     ÷ 41 home dates = the local share per real night
 *     × MODEL_SCALE = the players line on one classroom night
 *     × 5 nights = the season bill on this desk
 *
 * Nothing here is a cap charge counted as cash. Nothing demands one gate pay a
 * year: 41 dates split it. Nothing omits the other streams to make a desk poor:
 * the TV check comes off the top, and the sentence on screen says the rest
 * comes from tickets, food, sponsors AND local TV — tonight's gate is one of
 * those, on one of 41 nights. Revenue sharing is real and lifts a small
 * market's league money above this figure by a confidential amount; it is
 * named on the teacher surface and never given a percentage.
 *
 * MODEL_SCALE — 0.36 — is chosen so that a $200M-tax-salary club's players
 * line is about half of a good New York night's modeled take at the plan
 * price. Worked at the shipped constants: Night 2 (Saturday, Draw 51, local TV)
 * at the $24 plan price with renewals at 50 sells the Garden out —
 * 19,800 × ($24 + $18 in-arena) = $831,600. Half of that is $415,800. A $200M
 * tax salary less $153M TV money is $47M, no tax; over 41 dates that is
 * $1,146,341 a night; 0.36 of it is $412,683. So a club at the tax line
 * carries a players line about the size of one good night's second half, and
 * a club at the second apron carries more than the doors ($520,000) — the
 * cost-coverage problem the founder named, not a change in the price that
 * maximises the night. Asserted by `fullHouseCarry.test.ts`.
 */
export const BILL_MODEL = {
  /**
   * National media money per club, 2026-27, real dollars. National TV ONLY —
   * other central money and revenue sharing are kept out (unverified per club
   * / confidential). Projected from $143M in 2025-26 at the deal's ~7% average
   * step (Sportico 2025-11-12, read 2026-09-04). MEDIUM, ±$10M.
   */
  LEAGUE_MONEY_PER_CLUB: 153_000_000,
  /** Real dollars of local share per night -> classroom dollars. See the block comment. */
  MODEL_SCALE: 0.36,
  /** A real NBA home season. The horizon every cost and receipt on the bill is stated over. */
  HOME_DATES: 41,
  /** The classroom nights that stand in for the 41. */
  NIGHTS: NIGHT_COUNT,
  asOf: "2026-09-04",
  source:
    "LEAGUE_MONEY_PER_CLUB: docs/gauntlet/module-2/W4_BILL_RESEARCH.md §1/§7 (Sportico 2025-11-12, read 2026-09-04). HOME_DATES: NBA regular season, 41 home games. MODEL_SCALE: derived from this module's own Night 2 New York settlement at the plan price (see comment).",
  confidence: "LEAGUE_MONEY_PER_CLUB MEDIUM (±$10M, projected step); HOME_DATES HIGH; MODEL_SCALE a modelling choice, not a fact",
} as const;

/**
 * LUXURY TAX, 2026-27 (2023 CBA). Charged on tax salary above the tax line,
 * in bands $6,064,000 wide; a REPEATER (in the tax three of the prior four
 * seasons) pays the higher scale. cbaguide.com/thresholds/luxurytax and Hoops
 * Rumors glossary 2026-08, read 2026-09-04 — rates agree (HIGH, unchecked
 * against the CBA text). Hoops Rumors' repeater "maximum penalty" column is
 * arithmetically wrong and is NOT used here.
 */
export const LUXURY_TAX = {
  bandWidth: 6_064_000,
  standard: [1.0, 1.25, 3.5, 4.75] as const,
  repeater: [3.0, 3.25, 5.5, 6.75] as const,
  /** Each band past the fourth adds this to the previous band's rate. */
  furtherStep: 0.5,
  /** Clubs that were taxpayers in 2023-24, 2024-25 and 2025-26 (Hoops Rumors 2026-04, MEDIUM). */
  repeaters: ["boston", "milwaukee"] as readonly ClubId[],
  asOf: "2026-09-04",
  source: "W4_BILL_RESEARCH.md §3",
} as const;

/** The tax bill on a tax salary, at the standard or repeater scale. Zero at or under the line. */
export function luxuryTaxFor(taxSalary: number, taxLine: number, repeater: boolean): number {
  let over = Math.max(0, taxSalary - taxLine);
  if (over <= 0) return 0;
  const scale = repeater ? LUXURY_TAX.repeater : LUXURY_TAX.standard;
  let bill = 0;
  let band = 0;
  while (over > 0) {
    const rate = band < scale.length ? scale[band]! : scale[scale.length - 1]! + LUXURY_TAX.furtherStep * (band - scale.length + 1);
    const slice = Math.min(over, LUXURY_TAX.bandWidth);
    bill += slice * rate;
    over -= slice;
    band += 1;
  }
  return Math.round(bill);
}

export type ObligationSigning = {
  readonly name: string;
  readonly role: string;
  readonly annual: number;
  readonly annualText: string;
  readonly years: number;
  readonly tool: string;
  /** "2028-29" style season label from THE WINDOW. Carries a dash: 7-8 surfaces only. */
  readonly coveredThrough: string;
};

/**
 * What a carried desk owes, computed once at seating from the carry record and
 * frozen on the desk. Real figures are real; `perNightModel` and
 * `seasonBillModel` are the only two classroom-scale numbers.
 */
export type Obligation = {
  readonly label: string;
  readonly club: string;
  /** TAX SALARY — every dollar below is computed from this. */
  readonly payroll: number;
  readonly payrollText: string;
  /** The BC-7 cap hit (holds included). Cap POSITION only; never a cash input. */
  readonly capHit: number;
  readonly capHitText: string;
  readonly holds: number;
  readonly holdsVerified: boolean;
  readonly signings: readonly ObligationSigning[];
  readonly band: string;
  /** How far past the tax line the tax salary sits, as a magnitude (0 when under it). */
  readonly overTaxBy: number;
  readonly taxLine: number;
  readonly repeater: boolean;
  /** The luxury tax bill, real cash, on this season's tax salary. */
  readonly taxBill: number;
  readonly leagueMoney: number;
  /** max(0, tax salary − TV money): the part of the players' pay the TV check does not reach. */
  readonly gapReal: number;
  /** gap + tax: what local revenue must cover this season. (The task's `gateShareReal`, with the tax in it.) */
  readonly gateShareReal: number;
  readonly perNightReal: number;
  readonly perNightModel: number;
  readonly seasonBillModel: number;
  /** Real 2024-25 gate (Forbes estimate) and its 41st, for the 7-8 units seam. */
  readonly realGate: number;
  readonly realGatePerDate: number;
  readonly realGateSource: string;
};

/** "$203.6M" — the shape THE WINDOW printed the same figure in. */
export const millionsText = (n: number): string => `$${(n / 1_000_000).toFixed(1)}M`;
/** "$204 million" — whole millions, no decimal point, for the 5-6 sentence. */
export const wholeMillionsText = (n: number): string => `$${Math.round(n / 1_000_000).toLocaleString()} million`;

export function obligationFor(f: CarriedRecord, taxLine: number): Obligation {
  const payroll = Math.round(f.taxSalary);
  const leagueMoney = BILL_MODEL.LEAGUE_MONEY_PER_CLUB;
  const repeater = LUXURY_TAX.repeaters.includes(f.clubId);
  const taxBill = luxuryTaxFor(payroll, taxLine, repeater);
  const gapReal = Math.max(0, payroll - leagueMoney);
  const gateShareReal = gapReal + taxBill;
  const perNightReal = Math.round(gateShareReal / BILL_MODEL.HOME_DATES);
  const perNightModel = Math.round(perNightReal * BILL_MODEL.MODEL_SCALE);
  const realGate = CLUB_GATE_2024_25[f.clubId];
  return {
    label: f.label,
    club: f.club,
    payroll,
    payrollText: millionsText(payroll),
    capHit: Math.round(f.committed),
    capHitText: millionsText(f.committed),
    holds: f.holds,
    holdsVerified: f.holdsVerified,
    signings: f.signings,
    band: f.band,
    overTaxBy: Math.max(0, payroll - taxLine),
    taxLine,
    repeater,
    taxBill,
    leagueMoney,
    gapReal,
    gateShareReal,
    perNightReal,
    perNightModel,
    seasonBillModel: perNightModel * BILL_MODEL.NIGHTS,
    realGate,
    realGatePerDate: Math.round(realGate / BILL_MODEL.HOME_DATES),
    realGateSource: CLUB_GATE_SOURCE,
  };
}

/** The carry record as this room stores it — every field copied by name, nothing raw. */
function carriedRecordOf(f: CarriedFranchise): CarriedRecord {
  return {
    label: f.label,
    clubId: f.clubId,
    club: f.club,
    city: f.city,
    twin: f.twin,
    committed: f.committed,
    deadMoney: f.deadMoney,
    holds: f.holds,
    holdsVerified: f.holdsVerified,
    taxSalary: f.taxSalary,
    band: f.band,
    openJobs: [...f.openJobs],
    signings: f.signings.map((sg) => ({
      name: sg.name,
      role: sg.role,
      annual: sg.annual,
      annualText: millionsText(sg.annual),
      years: sg.years,
      tool: sg.tool,
      coveredThrough: sg.coveredThrough,
    })),
    overCapDeclared: f.overCapDeclared,
    forgone: f.forgone.map((r) => ({ day: r.day, signed: r.signed, atPrice: r.atPrice, lost: [...r.lost] })),
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
  return clamp(renewalDeltaRaw(market, card, price, spend), RENEWAL_DELTA_FLOOR, RENEWAL_DELTA_CEIL);
}

/** The rule's answer BEFORE the one-night clamp (W2 repair-4 R4-4b). */
/**
 * The gouging arm's diminishing bite (`RENEWAL_GOUGE_BEND`). Takes the straight
 * arm's answer and bends it: unchanged in slope where the excess is small,
 * still climbing without limit where it is large.
 */
function gougeBite(straight: number): number {
  return straight <= 0 ? 0 : RENEWAL_GOUGE_BEND * Math.log(1 + straight / RENEWAL_GOUGE_BEND);
}

export function renewalDeltaRaw(market: Market, card: NightCard, price: number, spend: number): number {
  const reference = renewalReferencePrice(market, card);
  const span = reference - market.planPrice;
  const ramp = span > 0 ? clamp((price - market.planPrice) / span, 0, 1) : 0;
  const value =
    RENEWAL_TENT_PEAK +
    RENEWAL_BARGAIN_BONUS * ramp * ramp -
    RENEWAL_UNDERCUT_SLOPE * Math.max(0, market.planPrice - price) -
    gougeBite(market.planSlope * Math.max(0, price - reference)) +
    spend / market.eventRenewalDollars;
  return Math.round(value);
}

/**
 * W2 repair-4 R4-4b (Economic Truth re-check finding 4): `renewalFloorLineFor`
 * explains the RULE's clamp — "at most 20 points off in one night" — so it may
 * only be printed when that clamp is what the pair is looking at: the printed
 * move IS the clamp, and the rule asked for strictly more. It never fires on
 * the book's own floor (a desk at 7% that loses 7 points was not clamped by
 * the rule) and never when the rule asked for exactly the clamp.
 */
export function renewalFloorBinds(rawDelta: number, move: number): boolean {
  return move === RENEWAL_DELTA_FLOOR && rawDelta < RENEWAL_DELTA_FLOOR;
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
  /**
   * The gate call that stood when the bell rang, or null on a desk that made
   * none (and on any night rehydrated from a snapshot written before the call
   * existed). Frozen here so the bell answers what the pair actually said.
   */
  gateCall: GateCall | null;
  /** Frozen at lock (D15). NEVER serialized — see viewNight(). */
  hidden: Curve;
};

export type Desk = {
  deskNumber: number;
  marketId: MarketId;
  crestIndex: number;
  joinedAtNight: number;
  /**
   * D59: the franchise this desk carried in from THE WINDOW — "Memphis A",
   * "Memphis B" — or absent on a stock desk and on any snapshot written before
   * the carry existed. Two desks may hold one club, so the LABEL is the desk's
   * name everywhere it is named, never the club alone.
   */
  label?: string;
  /** True when this desk was dealt a stock building (no carry, or the carry ran out / was dropped). */
  stock?: boolean;
  /** THE BILL on a carried desk; null on a stock desk. See `obligationFor`. */
  obligation?: Obligation | null;
  /** Set once the fifth night settles: season cash at or above zero. Read by Week 5. */
  clearedTheBill?: boolean;
  cash: number;
  renewals: number;
  price: number;
  spend: number;
  openBowl: boolean;
  locked: boolean;
  /**
   * The pair's call on TONIGHT's crowd, made while locked and waiting for the
   * room. Cleared when the night settles (it moves onto the settled night), and
   * null on any desk rehydrated from a snapshot written before it existed.
   */
  gateCall: GateCall | null;
  nights: SettledNight[];
};

/** One carried franchise as this room keeps it: the parsed record, never the raw seed. */
export type CarriedRecord = {
  readonly label: string;
  readonly clubId: ClubId;
  readonly club: string;
  readonly city: string;
  readonly twin: 0 | 1;
  /** BC-7 cap hit, holds included. Cap POSITION only. */
  readonly committed: number;
  readonly deadMoney: number;
  readonly holds: number;
  readonly holdsVerified: boolean;
  /** Roster salary + dead money. Every dollar bill is computed from this. */
  readonly taxSalary: number;
  readonly band: string;
  readonly openJobs: readonly string[];
  readonly signings: readonly ObligationSigning[];
  readonly overCapDeclared: boolean;
  /** Frozen opportunity-cost evidence from THE WINDOW. Shown to a human, never read by a reducer. */
  readonly forgone: readonly { day: number; signed: string; atPrice: number; lost: readonly string[] }[];
};

export type CarryState = {
  readonly ok: boolean;
  readonly reason?: string;
  readonly warnings: readonly string[];
  readonly franchises: readonly CarriedRecord[];
  /** Label -> the seat holding it. Seat-private: never reaches the board. */
  readonly claims: Record<string, SeatId>;
  readonly lines: { readonly floor: number; readonly cap: number; readonly tax: number; readonly apron1: number; readonly apron2: number } | null;
  readonly payrollDefinition: string | null;
  readonly sourceSessionId: string | null;
};

export type FullHouseState = {
  desks: Record<SeatId, Desk>;
  deskOrder: SeatId[];
  /** Which class this room is for. Absent on a snapshot written before the band existed: read as 5-6. */
  gradeBand?: GradeBand;
  /** D59: what walked in from THE WINDOW. Absent on an unseeded room and on older snapshots. */
  carry?: CarryState;
  /** 0-based index of the night currently open. NIGHT_COUNT once all five have settled. */
  nightIndex: number;
  twoPeaksReleased: boolean;
  revealStage: number;
  /**
   * Which group of COUNTERFACTUAL repeat rows is on the projector, 0-based.
   *
   * `gate-l1-play` recheck3 P11-b (BLOCKING dissent `play-l1-repairs-below-fold`)
   * and the analyst's biggest-failure finding: the board rendered `rows.map(...)`
   * with no cap, so at ten desks six rows and the class summary were off a
   * 1366x768 projector (and six rows off at 1920x1080), while the largest type on
   * the board told the room to argue from them. The rows scale with the class;
   * the screen does not. The remedy chosen is a hard cap plus teacher paging —
   * the argue beat stays ONE LOOK per group instead of one scroll, and the class
   * summary is out of the paged column so it is on screen for every group.
   */
  cfPage: number;
  /**
   * Which synthesis card is on the projector.
   *
   * `gate-l1-visual` W3 N1 + `gate-l1-projector` W3: the six-card grid was made
   * to fit by shrinking it — 11.20px bodies and 9.29px sources at 1366x768,
   * against a 2.6%-of-height back-row floor — which trades the room's ability to
   * read the lesson's formalization for a passing clip check. The cards are
   * staged one at a time under the teacher's own control instead, exactly like
   * the reveal beats and the repeat-card groups.
   */
  synthPage: number;
  /**
   * Pairs who arrived after the fifth bell and could not be given a desk.
   * Optional so a snapshot written before this field existed still loads.
   */
  observerSeats?: string[];
};

/**
 * Repeat rows per COUNTERFACTUAL group.
 *
 * THREE is not a taste — it is the measured number that fits. Four rows plus the
 * headline, the argue prompt, the class scatter and the class summary measured
 * 854px of content in a 768px projector (`e2e-m2l1`, 12-desk session), so the
 * group had to give up a row. `runtime/scripts/e2e-m2l1.cjs` asserts every
 * rendered row's own box, the summary's box, and that `#stage` does not overflow
 * at all, at 1366x768 and 1920x1080 — if this constant is raised past what fits,
 * that instrument fails rather than silently clipping the room's evidence again.
 */
export const CF_ROWS_PER_PAGE = 3;

/** How many teacher-advanced groups this room's repeat card needs. */
export const cfPageCount = (rowCount: number): number => Math.max(1, Math.ceil(rowCount / CF_ROWS_PER_PAGE));

/**
 * `gate-l1-projector` W3F-1: `orderRepeatRows` sorts by how much a row can
 * teach, not by desk number, so a group's rows are no longer a contiguous
 * desk range — "DESKS 1-3 OF 12" printed over Desk 2, Desk 3 and Desk 4 the
 * moment the ordering shipped. A pager label must name the desks actually in
 * the group, not claim a position. Takes the already-ordered card (as
 * `computeAggregate` returns it) and the group's rows verbatim, so this and
 * the rows rendered beneath it can never drift apart.
 *
 * Prints "Desk N" only, not the full row handle (which also carries the
 * franchise, e.g. "Desk 11 · Memphis Grizzlies") — the franchise is already on
 * the row itself a moment later, and three full handles joined together wrap
 * to a second line on the pager at 1366x768, which is exactly the row this
 * card's `CF_ROWS_PER_PAGE` cap was measured to fit
 * (`runtime/scripts/e2e-m2l1.cjs`, class-scale 12-desk instrument).
 */
export const cfPageDeskNames = (rows: readonly RepeatRow[], page: number): string =>
  rows
    .slice(page * CF_ROWS_PER_PAGE, page * CF_ROWS_PER_PAGE + CF_ROWS_PER_PAGE)
    .map((r) => r.deskHandle.split(" · ")[0])
    .join(", ");

/**
 * Synthesis cards per projector frame. ONE, for the same reason the repeat card
 * is capped at three: `design/VISUAL_IDENTITY.md` allows "one chart, one number,
 * or one reveal state at a time, never a dashboard grid" on `/board`, and the
 * six-card grid could only be made to fit by dropping its body type to 1.46% of
 * screen height. One card holds its title at 4.3% and its body at 2.85%.
 */
export const SYNTH_CARDS_PER_PAGE = 1;

export const synthPageCount = (cardCount: number): number =>
  Math.max(1, Math.ceil(cardCount / SYNTH_CARDS_PER_PAGE));

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

/**
 * What the class moving into a phase is called, out loud, in this lesson.
 *
 * The runtime's own fallback is the phase name — "The class moved on to
 * CONSEQUENCE" — which is a word from the engine's vocabulary, not the room's.
 * Nothing here is a spoiler: it says where the class IS, never what it found.
 */
const PHASE_EVENT: Partial<Record<CanonicalPhase, string>> = {
  HOOK: "Your teacher set up the season.",
  PLAY: "The doors opened \u2014 the room started pricing nights.",
  REVEAL: "The season went up on the projector.",
  CONSEQUENCE: "The class started reading what the season cost.",
  ADAPT: "The class went looking for the price it should have charged.",
  COUNTERFACTUAL: "The class started replaying the season at other prices.",
  ARGUE: "The class started arguing from the board.",
  SYNTHESIS: "Your teacher started naming the economics.",
  COMPLETE: "The lesson finished.",
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

/* ------------------------------------------------------ the gate call -- */

/**
 * THE GATE CALL (W6 repair `play-l1-locked-dead-time`).
 *
 * A pair that commits early sits in front of a dark building until the slowest
 * desk in the room finishes, five times in a fifty-minute class. The screen was
 * already the right picture — H1's dark house, no timer, no spinner — and it
 * still said, in the product's own words, "Nothing to do but find out".
 *
 * The wait stays teacher-paced. It gets the one thing the pair cannot look up:
 * the crowd in the building they are looking at. Free, carries no money,
 * changes no settled number; its whole job is to make the pair COMMIT to a
 * reading before the doors open, so the bell answers something they said.
 *
 * The bands are the same three names L2 uses -- one ritual across the module --
 * but the FLOORS are tuned per lesson, because two lessons with different
 * demand models and different buildings do not become uncertain at the same
 * numbers. Measured over both markets, all five cards, renewals 20-80 and the
 * $16-$70 band, these land 32% / 30% / 39%. L2's own floors give this lesson a
 * 14% middle band, which is a call nobody makes.
 */
export type GateCall = "packed" | "busy" | "quiet";

/** The fill fraction at or above which the house reads PACKED. */
export const GATE_PACKED_FLOOR = 0.85;
/** The fill fraction at or above which the house reads BUSY. */
export const GATE_BUSY_FLOOR = 0.55;

export const GATE_BANDS: readonly { id: GateCall; label: string; blurb: string }[] = [
  { id: "packed", label: "PACKED", blurb: "nearly every seat sold" },
  { id: "busy", label: "BUSY", blurb: "a good crowd, real gaps in it" },
  { id: "quiet", label: "QUIET", blurb: "a lot of empty seats" },
];

export const GATE_CALL_PROMPT = "Your price is in. Nobody knows tonight's crowd yet — not even you. Call it: how full does this building get?";
export const GATE_CALL_HEADING = "While the rest of the room commits";
/** What the card says before the pair has called, and after. Both authored here (R-H/E4). */
export const GATE_CALL_FOOT_OPEN = "No money rides on this. It is only worth something if you say it out loud before you know.";
export const gateCallFootCalledFor = (building: string): string =>
  `Your call is in — ${building} answers when the bell rings. You can change it until then.`;

/**
 * How much of the room has committed, as an aggregate. Never a seat identity —
 * `/play` is private and stays private (CLAUDE.md 11); this is the class-level
 * fact the projector already carries, and it is what turns "wait" into a finite
 * thing the pair can see the end of.
 */
export function roomLockLine(state: FullHouseState): { locked: number; seated: number; line: string } {
  const desks = state.deskOrder.map((id) => state.desks[id]!).filter(Boolean);
  const locked = desks.filter((d) => d.locked).length;
  const seated = desks.length;
  const waiting = seated - locked;
  return {
    locked,
    seated,
    line:
      waiting <= 0
        ? `All ${seated} desks are in. Your teacher rings the bell.`
        : `${locked} of ${seated} desks are in. ${waiting === 1 ? "One desk is" : `${waiting} desks are`} still deciding.`,
  };
}

/**
 * Which band a settled night actually landed in.
 *
 * Fill is of the seats the desk OPENED, never of capacity — on Night 4 those
 * are different numbers and `fillQualifier` already says so everywhere else on
 * this surface (R-2).
 */
export function gateBandOf(settlement: NightSettlement): GateCall {
  const fill = settlement.seatsOpen > 0 ? settlement.turnout / settlement.seatsOpen : 0;
  return fill >= GATE_PACKED_FLOOR ? "packed" : fill >= GATE_BUSY_FLOOR ? "busy" : "quiet";
}

const gateLabel = (band: GateCall): string => GATE_BANDS.find((b) => b.id === band)!.label;

/**
 * How the settled night answers the pair's call.
 *
 * Forecasting language, never a verdict on the price: reading a crowd and
 * pricing well are different skills and the product must not let one stand in
 * for the other. `null` on a night nobody called.
 */
export function gateCallResolvedFor(night: SettledNight): { called: GateCall; actual: GateCall; right: boolean; line: string } | null {
  const called = night.gateCall;
  if (called === null || called === undefined) return null;
  const actual = gateBandOf(night.settlement);
  const crowd = `${night.settlement.turnout.toLocaleString()} came — ${night.settlement.fillPct}% of the seats you opened`;
  return {
    called,
    actual,
    right: called === actual,
    line:
      called === actual
        ? `You called ${gateLabel(called)}. ${crowd}. You read it.`
        : `You called ${gateLabel(called)}. ${crowd}, which is ${gateLabel(actual)}. The night did not go the way you read it.`,
  };
}

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
  const settlement = settleNight(market, curve, price, spend, openBowl, card.bowlOffer, desk.obligation?.perNightModel ?? 0);
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
    gateCall: desk.gateCall ?? null,
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
    gateCall: null,
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
function seatDesk(state: FullHouseState, seatId: SeatId, franchise: CarriedRecord | null = null): FullHouseState {
  if (state.desks[seatId]) return state;
  const deskNumber = state.deskOrder.length + 1;
  const marketId: MarketId = franchise ? franchise.clubId : marketForDesk(deskNumber);
  const market = MARKET_BY_ID.get(marketId)!;
  const carried = Boolean(franchise);
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
    gateCall: null,
    nights: [],
    // A room with a carry names every desk honestly — carried by label, or
    // STOCK. A room without one keeps the shape it always had.
    ...(state.carry
      ? franchise
        ? { label: franchise.label, stock: false, obligation: obligationFor(franchise, state.carry.lines?.tax ?? 0) }
        : { stock: true, obligation: null }
      : {}),
  };
  for (let i = 0; i < state.nightIndex; i += 1) {
    const card = CARDS[i]!;
    desk = applyNight(desk, market, card, market.planPrice, 0, false, { auto: false, stock: true });
  }
  const claims = carried && state.carry ? { ...state.carry.claims, [franchise!.label]: seatId } : state.carry?.claims;
  return {
    ...state,
    desks: { ...state.desks, [seatId]: desk },
    deskOrder: [...state.deskOrder, seatId],
    ...(state.carry && claims ? { carry: { ...state.carry, claims } } : {}),
  };
}

/** The carried franchises nobody has picked up yet, in the carry's own stable order. */
export function unclaimedFranchises(state: FullHouseState): readonly CarriedRecord[] {
  const carry = state.carry;
  if (!carry || !carry.ok) return [];
  return carry.franchises.filter((f) => carry.claims[f.label] === undefined);
}

/**
 * DEAL ME ONE. The next unclaimed carried franchise in list order — the same
 * deterministic deal THE WINDOW used — and a stock building only when the carry
 * has none left (or never had any). The desk says which it got.
 */
function dealDesk(state: FullHouseState, seatId: SeatId): FullHouseState {
  if (state.desks[seatId]) return state;
  const next = unclaimedFranchises(state)[0] ?? null;
  return seatDesk(state, seatId, next);
}

/** Pick up one carried franchise by its label. Idempotent for the seat that already holds it. */
function claimDesk(state: FullHouseState, seatId: SeatId, label: unknown): ReduceResult<FullHouseState> {
  if (typeof label !== "string" || !label) return { ok: false, reason: "say which franchise you are picking up, by its label" };
  const carry = state.carry;
  if (!carry || !carry.ok) return { ok: false, reason: "this room has no carried franchises — press DEAL ME ONE" };
  const existing = state.desks[seatId];
  if (existing) {
    if (existing.label === label) return { ok: true, state };
    return { ok: false, reason: `you already have ${existing.label ?? `Desk ${existing.deskNumber}`}` };
  }
  const franchise = carry.franchises.find((f) => f.label === label);
  if (!franchise) return { ok: false, reason: `there is no carried franchise called "${label}"` };
  const holder = carry.claims[label];
  if (holder !== undefined && holder !== seatId) return { ok: false, reason: `${label} is already taken by another desk` };
  return { ok: true, state: seatDesk(state, seatId, franchise) };
}

/** Pairs recorded as observers, tolerant of a snapshot written before the field existed. */
export const observersOf = (state: FullHouseState): readonly string[] => state.observerSeats ?? [];

/**
 * THE LATE ARRIVAL, AFTER THE NIGHTS.
 *
 * During LOBBY, HOOK and PLAY a late pair gets a REAL desk, with the nights it
 * missed played at its own season plan price and labelled as such — that path is
 * unchanged and it is the one that matters. From REVEAL onwards it cannot have
 * one, and not because a 409 is convenient: every figure the room has already
 * been shown — the class curve, the two peaks, the repeat-card rows, every
 * synthesis card — is computed over the desks that played. Seating a new desk
 * during REVEAL would silently re-derive numbers the teacher has already read
 * out loud and put a point on the projector for a desk nobody in the room
 * played. Rewriting the class's own evidence to avoid a refusal is worse than
 * the refusal.
 *
 * What was actually broken is what happened instead: the refusal was definitive,
 * the outbox correctly dropped it, and the device sat on "You're in — finding
 * your desk…" for the rest of the lesson with nothing said to anybody. So the
 * pair is now RECORDED, their own screen is told the truth and told what to do,
 * and `/teach` gets a WATCH FOR entry that names them. Nothing is silent.
 */
function seatLate(state: FullHouseState, seatId: SeatId): FullHouseState {
  if (state.desks[seatId]) return state;
  const observers = observersOf(state);
  if (observers.includes(seatId)) return state;
  return { ...state, observerSeats: [...observers, seatId] };
}

export const OBSERVER_EYEBROW = "You arrived after the last night closed";
export const OBSERVER_MESSAGE =
  "You got here after the last night closed, so there is no desk left to hand you \u2014 all five nights are already in the books.";
export const OBSERVER_ACTION =
  "Pull your chair up to the nearest desk and read their screen with them. Everything from here is the whole room's: the board, the argument, and the questions. You are not missing a turn, because nobody is taking one.";

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
    // Week 5 reads this. Set on every desk at the last bell — a stock desk's
    // answer is the same question with a smaller bill.
    if (state.nightIndex + 1 >= NIGHT_COUNT) desks[seatId] = { ...desks[seatId]!, clearedTheBill: desks[seatId]!.cash >= 0 };
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
  /* ---- W3 lane B, VISUAL_REFERENCE_CONTRACT E2, ECON R-4 / E16 -----------
   * The projector's per-night class-results frame renders four columns and
   * only four: DESK (handle + market crest) - TICKET PRICE - WHO CAME - FILL.
   * Three fields are added here, each because that frame cannot be drawn
   * without it. None is money and none is seat-private: the handle, the price
   * and the turnout of every desk already reach the projector through the
   * class scatter, and the crest already reaches it in the LOBBY assignments.
   *
   *   crestIndex - E2's DESK column is "handle + market crest".
   *   seatsOpen  - E2 words FILL "of the seats that desk opened" (R-2). The
   *                denominator is per desk, not per class: it differs between
   *                the two buildings and again on the bowl night, so the frame
   *                prints it. E18 forbids one class-wide capacity number, so
   *                the frame may not divide by a single capacity.
   *   openBowl   - says WHY a desk's denominator is larger on the bowl night.
   *                Without it the larger denominator reads as an error.
   *
   * Authorised by contract E2 ("`seatsOpen`/`openBowl` on `CurvePoint` only
   * via Economic Truth"). NO revenue, gate, net, cash, renewals or any other
   * money field is added here, and none reaches the class-results payload
   * built by `classResultsFor` below. Per-desk money stays off the projector.
   */
  crestIndex: number;
  seatsOpen: number;
  openBowl: boolean;
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

/**
 * `gate-l1-econ-r2` R4 (BLOCKING dissent `econ-l1-n5-attribution`): this row
 * carried the two crowds and the two renewals figures and nothing else, so the
 * board and the `NIGHT 5 WAS NIGHT 1` synthesis card attributed the whole
 * Night-5 crowd change to renewals — while, for any desk that spent on Night 4,
 * the unnamed carry channel was the larger one and could point the other way
 * (measured: a New York desk at 14,142 -> 15,202 with renewals DOWN 14 points).
 *
 * Night 5 replays Night 1's card exactly, so `curveFor`'s `sens` and every card
 * term are identical between the two nights. The whole difference in the number
 * of people who WANTED in is therefore closed-form, with no residual:
 *
 *   wantedN5 - wantedN1 = renewalFans * (renewalsAtN5 - renewalsAtN1)   [renewals]
 *                       + carryFans (= eventFans * Night-4 spend)        [last night's money]
 *                       - sens * (n5Price - n1Price)                     [the desk's own price]
 *
 * and what the building actually SEATS can differ from that again, when either
 * night hit the capacity clamp. All four terms are carried here as data, so no
 * copy anywhere has to guess which one caused the crowd.
 */
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
  /** Fans of demand base from the desk's own renewals move. Signed. */
  renewalsFans: number;
  /** Fans of demand base carried in from Night 4's event spend. Never negative. */
  carryFans: number;
  /** Dollars the desk put into Night 4. */
  n4Spend: number;
  /** Fans of demand base from the desk changing its own price. Signed; 0 when `samePrice`. */
  priceFans: number;
  /** People who WANTED in on N5 minus people who wanted in on N1 — the sum of the three channels. */
  wantedDelta: number;
  /** People who actually got in: N5 turnout minus N1 turnout. Differs from `wantedDelta` under the clamp. */
  seatedDelta: number;
  /** True when either night was capacity-clamped, so the seated delta is not the wanted delta. */
  clamped: boolean;
  /**
   * `gate-l1-econ-r3` R6: true when either night's demand was FLOORED at zero —
   * the price was above where this curve crosses the axis, so `wanted` was
   * clamped UP to 0 and the three channels below did not reach the door. The
   * identity (`wantedDelta` = renewals + spend + price fans) does not close in
   * this band: measured, 102 of 224 flat seasons break it, worst residual
   * +1,250 fans, reachable from $84 (New York) and $58 (Memphis) upward. The row
   * had a branch for the clamp at the top and none for the floor at the bottom,
   * so the card printed "0 then 0 — 0 people, and that is renewals -1,250".
   */
  floored: boolean;
  /**
   * True when BOTH nights were floored — nobody wanted in at this price either
   * time. `gate-l1-econ-r3` W3-R10: `floored` is an OR, and every copy site that
   * consumed it read it as an AND, so a desk that drew 670 people on Night 1 and
   * 0 on Night 5 was described on the projector as one where "nobody walked in
   * either time", in the same clause that printed the 670. The two cases need
   * different sentences, so the row states which one it is.
   */
  bothFloored: boolean;
  /** The name of the biggest channel behind this row: "renewals", "spend", "price" or "none". */
  biggestChannel: "renewals" | "spend" | "price" | "none";
  /** One projector-length sentence, computed from the four terms above. */
  channelLine: string;
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

/** "Desk 3 · Memphis A" on a carried desk; "Desk 3 · Memphis Grizzlies" on a stock one. The label is the desk's name (D59). */
export const deskHandle = (desk: Desk): string => `Desk ${desk.deskNumber} · ${desk.label ?? marketOf(desk).club}`;

/* --------------------------------------------------------------- desks -- */

/**
 * THE DESKS — the teacher's walk-to list.
 *
 * THE ROOM says the shape of the room ("nine desks between $28 and $70, three
 * still deciding"). It deliberately never names a desk, because shape is what
 * you read out loud. But the moment a teacher decides to DO something about it
 * they need the other half: which desk, run by whom, and what is actually wrong
 * with it. That cross-reference used to be manual — the console showed a join
 * list of names with no desks, and a WATCH FOR list of desks with no names.
 *
 * Teacher-only, like THE ROOM: this pairs desk handles with seat ids so the
 * console can put the pair's real names on the chip. `boardView` is never
 * handed it.
 */
export type DeskStripEntry = {
  seatId: SeatId;
  label: string;
  /** A small closed vocabulary the console styles against; the words come from `stateLabel`. */
  state: "in" | "deciding" | "auto" | "closed";
  stateLabel: string;
  note: string | null;
  /**
   * True when the note is a reason to WALK OVER, not merely context. A desk that
   * has never committed a night is a reason; a desk that joined late and carries
   * covered nights in its books is something to know when you read them.
   */
  flag: boolean;
};
export type DeskStrip = { countLine: string; entries: DeskStripEntry[] };

function deskStripOf(state: FullHouseState): DeskStrip | null {
  const seatIds = state.deskOrder.filter((id) => state.desks[id] !== undefined);
  if (seatIds.length === 0) return null;
  const windowOpen = state.nightIndex < NIGHT_COUNT;
  const nightNo = Math.min(state.nightIndex + 1, NIGHT_COUNT);

  const entries: DeskStripEntry[] = seatIds.map((seatId) => {
    const desk = state.desks[seatId]!;
    const own = desk.nights.filter((n) => !n.auto && !n.stock);
    const autos = desk.nights.filter((n) => n.auto).length;
    const label = deskHandle(desk);

    // The note is the reason to walk over, and only one thing is worth saying.
    // Ordered by what a teacher can still act on tonight: a pair that has never
    // decided anything outranks a pair that is merely in the red.
    // `joinedAtNight` is 1-based: a pair seated in the lobby joined at night 1.
    const covered = desk.joinedAtNight - 1;
    // Only nights this pair was actually AT count against them. A pair who
    // joined at Night 4 has one night in its books it never saw; calling that
    // "never once locked a night of its own" would send a teacher across the
    // room to scold a pair that has not had a turn yet.
    const theirs = desk.nights.filter((n) => !n.stock);
    const [note, flag]: [string | null, boolean] =
      theirs.length >= 1 && own.length === 0
        ? ["Has never once locked a night of its own — every night so far was settled by the bell or covered before they arrived.", true]
        : autos >= 2
          ? [`The bell has settled ${autos} of this desk's nights.`, true]
          : covered > 0
            ? [`Joined at Night ${desk.joinedAtNight}; the first ${covered} night${covered === 1 ? " was" : "s were"} covered for them.`, false]
            : desk.cash < 0
              ? ["Books are in the red.", false]
              : [null, false];

    if (!windowOpen) {
      return { seatId, label, state: "closed", stateLabel: "Five nights in", note, flag };
    }
    if (desk.locked) return { seatId, label, state: "in", stateLabel: `Locked Night ${nightNo}`, note, flag };
    return { seatId, label, state: "deciding", stateLabel: "Still dialling", note, flag };
  });

  const deciding = entries.filter((e) => e.state === "deciding").length;
  const countLine = windowOpen
    ? `${entries.length - deciding} of ${entries.length} locked · night ${nightNo} of ${NIGHT_COUNT}`
    : `${entries.length} desk${entries.length === 1 ? "" : "s"} · all five nights settled`;
  return { countLine, entries };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * R4's decomposition, computed — never written. Every number below comes out of
 * the two settled nights and the market's own published conversion rates
 * (`renewalFans` is the "10 fans per renewal point" the SIMPLIFICATIONS ledger
 * states; `eventFans` is the `spendRule` the pair read before they spent).
 */
export function repeatRowFor(
  desk: Desk,
  market: Market,
  n1: SettledNight,
  n5: SettledNight,
  n4Spend: number,
): RepeatRow {
  const renewalPoints = n5.renewalsBefore - n1.renewalsBefore;
  const renewalsFans = market.renewalFans * renewalPoints;
  const carryFans = Math.round(market.eventFans * n4Spend);
  // N5 replays N1's card, so `sens` is the same number on both nights and the
  // price term is exact rather than estimated. It is 0 for the desks the card
  // quotes (same price both nights).
  const priceFans = -Math.round(n5.hidden.sens * (n5.price - n1.price));
  const wantedN1 = n1.settlement.turnout + n1.settlement.turnedAway;
  const wantedN5 = n5.settlement.turnout + n5.settlement.turnedAway;
  const wantedDelta = wantedN5 - wantedN1;
  const seatedDelta = n5.settlement.turnout - n1.settlement.turnout;
  const clamped = n1.settlement.soldOut || n5.settlement.soldOut;
  // R6: the OTHER clamp. `settleNight` floors `wanted` at 0, so above the price
  // where this curve crosses the axis the channels move a demand base nobody can
  // see. Read off the same curve the night settled on (D15), never recomputed.
  const rawWantedN1 = Math.round(n1.hidden.base - n1.hidden.sens * n1.price);
  const rawWantedN5 = Math.round(n5.hidden.base - n5.hidden.sens * n5.price);
  // W6: the boundary is `<= 0`, not `< 0`. A night whose raw demand lands on
  // EXACTLY zero drew nobody, same as one that landed below it, but under `< 0`
  // it counted as readable — so a desk with 0 then 0 was told a crowd hit zero
  // "on one of the two nights". The predicate is "did anybody come", and it has
  // to match what the room saw.
  const flooredN1 = rawWantedN1 <= 0;
  const flooredN5 = rawWantedN5 <= 0;
  const floored = flooredN1 || flooredN5;
  const bothFloored = flooredN1 && flooredN5;
  const samePrice = n1.price === n5.price;

  const channels: { id: "renewals" | "spend" | "price"; size: number }[] = [
    { id: "renewals", size: Math.abs(renewalsFans) },
    { id: "spend", size: Math.abs(carryFans) },
    { id: "price", size: samePrice ? 0 : Math.abs(priceFans) },
  ];
  const top = channels.reduce((a, b) => (b.size > a.size ? b : a));
  // R6: a floored row has no readable channel. The three moves are real moves of
  // the demand BASE, but no crowd registered them, so this row may not be
  // counted toward any "the biggest thing that changed was X" claim on any
  // surface. `repeatSummary` and `pathDependenceCardBody` both filter on it.
  const biggestChannel: RepeatRow["biggestChannel"] = floored ? "none" : top.size === 0 ? "none" : top.id;

  const say = (n: number): string => `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
  const parts: string[] = [];
  if (renewalsFans !== 0) parts.push(`renewals ${say(renewalsFans)}`);
  if (carryFans !== 0) parts.push(`Night 4's $${n4Spend.toLocaleString()} of event money ${say(carryFans)}`);
  if (!samePrice && priceFans !== 0) parts.push(`their own price change ${say(priceFans)}`);
  let channelLine: string;
  if (floored) {
    // R6. Never assert a channel size over a crowd that did not move. Say what
    // actually happened: the price was above where anybody in this model still
    // wanted a ticket, so the carried-over moves had nothing to act on.
    const moved = parts.length === 0 ? "nothing carried over" : parts.join(", ");
    channelLine = bothFloored
      ? `nobody wanted in at $${n5.price} on either night, so the crowd was 0 both times — underneath it ${moved}, and none of it could reach the door`
      : `${say(seatedDelta)} people — at this price demand ran out before the door on one of the two nights, so the crowd cannot show what moved underneath it (${moved})`;
  } else if (parts.length === 0) {
    channelLine = "nothing carried over: same renewals, no event money, same price";
  } else if (clamped && seatedDelta !== wantedDelta) {
    channelLine = `wanted in ${say(wantedDelta)} (${parts.join(", ")}) · seats only allowed ${say(seatedDelta)}`;
  } else {
    // W2 repair-5 R5-4 (Kid C final re-read): this line used to read
    // "-1,100 people, and that is renewals -1,100" — two signed numbers with no
    // verb between them, on the card that is meant to explain the season. Same
    // terms, same arithmetic, said as a sentence.
    // Each channel keeps its magnitude directly attached to its name — no
    // reader is told a cause without its size, and the reveal harness's P16
    // reads those exact terms off this line ("renewals -975", "event money
    // +400"), so the wording may grow a verb but must never come between a
    // channel and its number.
    const size = Math.abs(wantedDelta).toLocaleString();
    channelLine =
      wantedDelta === 0
        ? `The same crowd came both times. Underneath it, ${parts.join(" and ")}.`
        : `${size} ${wantedDelta > 0 ? "more" : "fewer"} people came. That change came from ${parts.join(" and ")}.`;
  }
  return {
    deskHandle: deskHandle(desk),
    marketId: desk.marketId,
    n1Price: n1.price,
    n1Turnout: n1.settlement.turnout,
    n5Price: n5.price,
    n5Turnout: n5.settlement.turnout,
    renewalsStart: n1.renewalsBefore,
    renewalsAtN5: n5.renewalsBefore,
    samePrice,
    renewalsFans,
    carryFans,
    n4Spend,
    priceFans,
    wantedDelta,
    seatedDelta,
    clamped,
    floored,
    bothFloored,
    biggestChannel,
    channelLine,
  };
}

/**
 * `gate-l1-play` W3-2. Grouping the repeat card by desk number ordered the beats
 * by accident: the critic's own twelve-desk session put TWO BYTE-IDENTICAL rows
 * (Desk 1 and Desk 3, both New York at $24, both 16,862 -> 17,462) in group 1
 * while every row worth arguing about — a price-change split and a floored row —
 * landed in group 4, four presses away. The model is deterministic, so a
 * clustered room (which is what a real room does at the plan price) reliably
 * produces duplicate rows.
 *
 * Two rules, in this order:
 *   1. Rows are sorted by how much they can teach — the card's own beat (same
 *      price, and a crowd that moved) first, then the rows that show the second
 *      channel or the demand floor, then the price-change rows.
 *   2. No group may contain two identical rows while a differing row is
 *      un-shown: identical signatures are dealt into different groups.
 * Every row is kept. Nothing is merged, so the room still sees all twelve desks.
 */
export function orderRepeatRows(rows: readonly RepeatRow[]): RepeatRow[] {
  const signature = (r: RepeatRow): string =>
    `${r.marketId}|${r.n1Price}|${r.n5Price}|${r.n1Turnout}|${r.n5Turnout}|${r.channelLine}`;
  const interest = (r: RepeatRow): number => {
    let s = r.samePrice ? 40 : 10;
    if (r.samePrice && r.n5Turnout !== r.n1Turnout) s += 20;
    if (r.biggestChannel === "spend") s += 12; // the channel a room never guesses
    if (r.floored) s += 8; // the demand floor, said out loud
    if (r.clamped) s += 4; // a sold-out night the room can argue about
    return s;
  };
  const sorted = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => interest(b.row) - interest(a.row) || a.index - b.index)
    .map((x) => x.row);

  const remaining = [...sorted];
  const out: RepeatRow[] = [];
  while (remaining.length > 0) {
    const used = new Set<string>();
    for (let slot = 0; slot < CF_ROWS_PER_PAGE && remaining.length > 0; slot += 1) {
      let pick = remaining.findIndex((r) => !used.has(signature(r)));
      if (pick === -1) pick = 0; // only duplicates left — nothing differing is being withheld
      const [row] = remaining.splice(pick, 1);
      out.push(row!);
      used.add(signature(row!));
    }
  }
  return out;
}

/** The two archetypes, then any carried-club market a desk in this room is actually running. Unseeded rooms: exactly `MARKETS`. */
export function marketsInRoom(desks: readonly Desk[]): readonly Market[] {
  const extra = ALL_MARKETS.filter((m) => !MARKETS.includes(m) && desks.some((d) => d.marketId === m.id));
  return extra.length === 0 ? MARKETS : [...MARKETS, ...extra];
}

export function computeAggregate(state: FullHouseState): FullHouseAggregate {
  const desks = Object.values(state.desks);
  const curves: CurvePoint[] = [];
  // W3 lane B / contract E2 acceptance 4 ("stable desk order across frames"):
  // the marks used to be built from `Object.values(state.desks)`, whose order is
  // an object-key order that survives a snapshot round-trip only by convention.
  // The projector now prints one ROW per desk, so the order is read by the room
  // across five night frames and has to be the seat order the module already
  // keeps. `deskOrder` is that order; anything not in it is appended rather than
  // dropped, so a desk can never fall off the board because of a bookkeeping gap.
  const ordered = [
    ...state.deskOrder.map((seatId) => state.desks[seatId]).filter((d): d is Desk => d !== undefined),
    ...desks.filter((d) => !state.deskOrder.some((seatId) => state.desks[seatId] === d)),
  ];
  for (const desk of ordered) {
    for (const night of desk.nights) {
      curves.push({
        marketId: desk.marketId,
        cardId: night.cardId,
        deskHandle: deskHandle(desk),
        price: night.price,
        turnout: night.settlement.turnout,
        fillPct: night.settlement.fillPct,
        soldOut: night.settlement.soldOut,
        crestIndex: desk.crestIndex,
        seatsOpen: night.settlement.seatsOpen,
        openBowl: night.openBowl,
      });
    }
  }

  // Two Peaks is drawn on the reveal card, against a REAL desk's locked-at-time
  // curve in that market (D15) — never a fresh recomputation from today's state.
  const twoPeaks: TwoPeaks[] = [];
  for (const market of marketsInRoom(desks)) {
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
    const market = marketOf(desk);
    const n1 = desk.nights.find((n) => n.cardId === "N1");
    const n5 = desk.nights.find((n) => n.cardId === "N5");
    if (!n1 || !n5) continue;
    const n5Index = desk.nights.indexOf(n5);
    const nightBeforeN5 = n5Index > 0 ? desk.nights[n5Index - 1] : undefined;
    repeatCard.push(repeatRowFor(desk, market, n1, n5, nightBeforeN5?.spend ?? 0));
  }
  const orderedRepeatCard = orderRepeatRows(repeatCard);

  const books: MarketBooks[] = marketsInRoom(desks).map((market) => {
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
    repeatCard: orderedRepeatCard,
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

/* ------------------------------------------------- the season frontier -- */

export type FrontierPoint = {
  /** Renewals this season ends on. */
  renewals: number;
  /** The most cash this model will give up while ending on exactly that many renewal points. */
  cash: number;
  plan: SeasonPlan;
};

const frontierCache = new Map<MarketId, readonly FrontierPoint[]>();

/**
 * `gate-l1-econ-r3` R5 (BLOCKING dissent `econ-l1-two-book-baseline`).
 *
 * The module's central formalization — two books that do not add up — was staged
 * on the projector against "never moved the dial", which is **Pareto-dominated**:
 * measured, New York 84% @ $2,391,834 beats it by $1,153,622 AND four renewal
 * points, Memphis 80% @ $1,947,068 beats it by $1,101,636 at equal renewals. The
 * room was therefore led to infer that protecting a season-ticket base costs
 * about $1.2M when the model charges $25,050 — wrong by 47x (NY) / 70x (MEM), on
 * the last surface of the last beat.
 *
 * This is the fix: the model's own exact frontier, so every season line the
 * product PRINTS can be one nobody can beat on both books at once.
 *
 * Exact, not heuristic. Forward dynamic program over the complete reachable
 * state space (renewals 0-100) x (fans carried in from last night's event
 * spend), keeping the maximum cash in every state — which is exact here because
 * cash enters the model in exactly one other place (a desk in debt may not
 * spend), and more cash is never worse for that constraint. Then the true Pareto
 * set is extracted over the FINAL states, which is strictly stronger than a
 * lambda sweep: it finds points inside the convex hull too.
 *
 * Cost: ~5 x (states x 56 prices x spend levels) plain-array iterations per
 * market, run once and cached. It is never on a per-poll path — `replaysFor` and
 * `synthesisCards` both read the cache.
 */
export function seasonFrontier(market: Market): readonly FrontierPoint[] {
  const cached = frontierCache.get(market.id);
  if (cached) return cached;

  const spendLevels = SPEND_LEVELS(market);
  const carryOf = spendLevels.map((s) => Math.round(market.eventFans * s));
  const S = 101 * spendLevels.length;
  const key = (r: number, si: number): number => r * spendLevels.length + si;
  // Renewal moves depend on (card, price, spend) only — never on the state — so
  // the whole table is computed once per night instead of once per state.
  const deltaTable = CARDS.map((card) =>
    PRICE_GRID.map((price) => spendLevels.map((spend) => renewalDelta(market, card, price, spend))),
  );

  const NEG = Number.NEGATIVE_INFINITY;
  let cash = new Float64Array(S).fill(NEG);
  // One (back-pointer, choice) layer per night, so the exact five-night plan
  // behind any frontier point can be walked out. `choice` packs the price index
  // and the spend index into one integer.
  const trailBack: Int32Array[] = [];
  const trailChoice: Int32Array[] = [];
  cash[key(RENEWALS_START, 0)] = 0;

  for (let n = 0; n < CARDS.length; n += 1) {
    const nextCash = new Float64Array(S).fill(NEG);
    const nextBack = new Int32Array(S).fill(-1);
    const nextChoice = new Int32Array(S).fill(-1);
    const nightDeltas = deltaTable[n]!;
    for (let r = 0; r <= 100; r += 1) {
      for (let si0 = 0; si0 < spendLevels.length; si0 += 1) {
        const from = key(r, si0);
        const have = cash[from]!;
        if (have === NEG) continue;
        const curve = curveFor(market, CARDS[n]!, r, carryOf[si0]!);
        const canSpend = have >= 0; // the same rule replayPlan applies: no dial while in debt
        for (let pi = 0; pi < PRICE_GRID.length; pi += 1) {
          const price = PRICE_GRID[pi]!;
          const q = Math.min(market.capacity, Math.max(0, Math.round(curve.base - curve.sens * price)));
          const netBeforeSpend = price * q + market.ancillary * q - market.bill;
          const priceDeltas = nightDeltas[pi]!;
          for (let si = 0; si < spendLevels.length; si += 1) {
            const spend = spendLevels[si]!;
            if (spend > 0 && !canSpend) continue;
            const value = have + netBeforeSpend - spend;
            const nr = clamp(r + priceDeltas[si]!, 0, 100);
            const to = key(nr, si);
            if (value > nextCash[to]!) {
              nextCash[to] = value;
              nextBack[to] = from;
              nextChoice[to] = pi * spendLevels.length + si;
            }
          }
        }
      }
    }
    trailBack.push(nextBack);
    trailChoice.push(nextChoice);
    cash = nextCash;
  }

  // Best cash per final renewals level, then the true Pareto set.
  const bestByRenewals = new Float64Array(101).fill(NEG);
  const bestState = new Int32Array(101).fill(-1);
  for (let r = 0; r <= 100; r += 1) {
    for (let si = 0; si < spendLevels.length; si += 1) {
      const k = key(r, si);
      if (cash[k]! > bestByRenewals[r]!) {
        bestByRenewals[r] = cash[k]!;
        bestState[r] = k;
      }
    }
  }
  const frontier: FrontierPoint[] = [];
  let bestSoFar = NEG;
  for (let r = 100; r >= 0; r -= 1) {
    const c = bestByRenewals[r]!;
    if (c === NEG) continue;
    if (c <= bestSoFar) continue; // dominated: some higher-renewals season made at least as much
    bestSoFar = c;
    // Walk the trail back for the exact five-night plan behind this point.
    const prices: number[] = new Array(CARDS.length).fill(market.planPrice);
    const spends: number[] = new Array(CARDS.length).fill(0);
    let k = bestState[r]!;
    for (let n = CARDS.length - 1; n >= 0; n -= 1) {
      const ch = trailChoice[n]![k]!;
      prices[n] = PRICE_GRID[Math.floor(ch / spendLevels.length)]!;
      spends[n] = spendLevels[ch % spendLevels.length]!;
      k = trailBack[n]![k]!;
    }
    frontier.push({ renewals: r, cash: Math.round(c), plan: { prices, spends } });
  }
  // Highest renewals first, cash rising as renewals fall.
  const out: readonly FrontierPoint[] = frontier;
  frontierCache.set(market.id, out);
  return out;
}

/** The undominated season that ends on the MOST renewals this model allows. */
export function renewalsCornerSeason(market: Market): FrontierPoint {
  return seasonFrontier(market)[0]!;
}

/**
 * What one renewal point actually costs on this model, at both ends of the
 * frontier — R5 limb (ii). The whole economic content of the two-book claim is
 * that this number is NOT constant: cheap points first, ruinous points last.
 */
export function renewalMarginalCost(market: Market): { cheapest: number; dearest: number; averageOverRange: number; range: number } {
  const f = seasonFrontier(market);
  let cheapest = Number.POSITIVE_INFINITY;
  let dearest = 0;
  for (let i = 0; i + 1 < f.length; i += 1) {
    const dearer = f[i]!; // more renewals, less cash
    const cheaper = f[i + 1]!;
    const points = dearer.renewals - cheaper.renewals;
    if (points <= 0) continue;
    const perPoint = (cheaper.cash - dearer.cash) / points;
    if (perPoint < cheapest) cheapest = perPoint;
    if (perPoint > dearest) dearest = perPoint;
  }
  const top = f[0]!;
  const bottom = f[f.length - 1]!;
  const range = top.renewals - bottom.renewals;
  return {
    cheapest: Number.isFinite(cheapest) ? Math.round(cheapest) : 0,
    dearest: Math.round(dearest),
    averageOverRange: range > 0 ? Math.round((bottom.cash - top.cash) / range) : 0,
    range,
  };
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
  // D59: a carried desk pays its players line on every night of every replay.
  // A fixed cost shifts every row by the same amount and changes no gap between
  // rows — the best price is the best price whatever the payroll.
  const seasonBill = desk.obligation?.seasonBillModel ?? 0;
  const flatPlan = replayPlan(market, { prices: CARDS.map(() => market.planPrice), spends: CARDS.map(() => 0) });
  const strongest = bestFoundSeason(market);
  const spentOn = CARDS.filter((_c, i) => (strongest.plan.spends[i] ?? 0) > 0).map((c) => c.label.replace("Night ", "N"));
  // `gate-l1-econ-r3` R5 limb (i): the renewals-friendly row the room is asked to
  // read must be one nobody can beat on BOTH books. "Never moved the dial" is
  // not that row — it is beaten outright — so it stays as the honest "what if we
  // did nothing" line and says out loud that it is beatable, while the frontier's
  // own maximum-renewals season carries the two-book comparison.
  const renewalsCorner = renewalsCornerSeason(market);
  const marginal = renewalMarginalCost(market);
  const renewalGap = renewalsCorner.renewals - strongest.renewals;
  const cashGap = strongest.cash - renewalsCorner.cash;
  const beatsFlatCash = renewalsCorner.cash - flatPlan.cash;
  const beatsFlatPoints = renewalsCorner.renewals - flatPlan.renewals;
  const flatNote =
    beatsFlatCash > 0 && beatsFlatPoints >= 0
      ? `Never moved the dial. Safe, and beatable on BOTH books at once: the renewals line below ends $${beatsFlatCash.toLocaleString()} ahead of it in cash${
          beatsFlatPoints > 0 ? ` and ${beatsFlatPoints} renewal ${beatsFlatPoints === 1 ? "point" : "points"} ahead of it` : " at the same renewals"
        }. Doing nothing is not what protecting your plan holders costs.`
      : `Never moved the dial. It leaves money on the table on the big nights, and on this room's numbers it does not buy a better renewals book either.`;
  const strongNote =
    renewalGap > 0
      ? `Not a proven maximum — the best line we could search out: a different price on every night, and event money on ${
          spentOn.length === 0 ? "no night at all" : spentOn.join(" and ")
        }. Against the renewals line above it, it made $${Math.abs(cashGap).toLocaleString()} more and paid ${renewalGap} renewal ${
          renewalGap === 1 ? "point" : "points"
        } for it. There is no exchange rate between those two numbers. You have to choose.`
      : `Not a proven maximum — the best line we could search out: a different price on every night, and event money on ${
          spentOn.length === 0 ? "no night at all" : spentOn.join(" and ")
        }. On this model it is ahead on both books, so on these five nights the money did not cost the plan holders anything.`;
  const renewalsNote =
    renewalGap > 0
      ? `The other corner: no line in this model ends with more season-ticket holders than ${renewalsCorner.renewals}%, and this is the most cash we could find that still gets there. The ${renewalGap} points between this line and the one below it are NOT all the same price — the cheapest cost about $${marginal.cheapest.toLocaleString()} each and the last one costs $${marginal.dearest.toLocaleString()}. Protecting the base starts cheap and ends expensive.`
      : `The other corner: the most renewals this model will end on. At these numbers it is not behind on cash either.`;
  return [
    {
      label: "What you actually did",
      cash: desk.cash,
      renewals: desk.renewals,
      note: "Your five nights, your two dials.",
    },
    {
      label: `Same price every night ($${market.planPrice})`,
      cash: flatPlan.cash - seasonBill,
      renewals: flatPlan.renewals,
      note: flatNote,
    },
    {
      label: "The best renewals book we could find",
      cash: renewalsCorner.cash - seasonBill,
      renewals: renewalsCorner.renewals,
      note: renewalsNote,
    },
    {
      label: "The most cash we could find",
      cash: strongest.cash - seasonBill,
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

/** Said on a stock desk in a room that carried franchises in (D59). */
export const STOCK_DESK_NOTE =
  "This is a stock building, not one carried in from THE WINDOW: every carried franchise was already picked up, or this desk's record could not be read. Your teacher's console says which. You pay the doors each night and no players line.";
export const OBJECTIVE_COPY =
  "You are keeping two books, and they do not add up to one number. CASH is the money the building made after the bill. RENEWALS is the share of season-ticket holders who come back next year. A price that is great for one is usually worse for the other — that is the job.";

export const HOUSE_RULES: readonly string[] = [
  "Every night you set a PRICE ($10-$120) and how much of tonight's money you put into MAKING IT AN EVENT. Then you lock. There is no preview — the dials show dollars and nothing else.",
  // gate-l1-econ-r2 N-g: this used to end "Nothing else moves it", which the
  // rule two lines below it contradicted and the model refutes — carried
  // renewals move tonight's base by up to +/-1,250 fans (renewalFans 25 across
  // the 0-100 renewals range; this comment said 500, which was the number before
  // the round-3 retune) and last night's event money by up to 1,200. Both were
  // disclosed elsewhere on the same screen; the
  // sentence saying they did not exist was the only false one.
  "Everything NEW about tonight is printed on tonight's card before you touch a dial: the day, the visiting club's Draw out of 100, and whether it is on TV. Two things you already did come with you as well — your RENEWALS, and the event money you spent LAST night. Nothing else moves tonight's crowd; there is no luck in this game.",
  // gate-l1-econ-r3 R7: the third clause used to read "the whole dial is worth
  // about two points" flat. Measured over all 280 card-price states per market,
  // the dial buys EXACTLY ZERO renewal points in 62% (New York) / 65% (Memphis)
  // of them — including at each night's cash-best price on Nights 1, 2 and 5 —
  // because `renewalDelta` clamps to [-20, +12] AFTER the spend term is added.
  // A pre-commit claim on the student's own screen may not be false two-thirds
  // of the time, so the ceiling is stated as a ceiling and the zero case is
  // named. Same bound, same words, in `spendRuleFor`.
  "Money you spend on the night never changes tonight's crowd. It lands on the NEXT night — and tonight's books are visibly worse for it. It can also nudge RENEWALS up on the night you spend it: the whole dial is worth AT MOST two points, and often nothing at all — if your price has already pushed renewals to the top or the bottom of what they can move in one night, the money buys none.",
  "Your building's bill is due every night whether 200 people come or 19,000 do.",
  // gate-l1-econ-r1 N-a and N-b, both measured: the bargain arm peaks at +12 on
  // Night 3 (draw 88, national TV) exactly as it does on Night 4 (draw 97, no
  // TV) — national TV moves WHERE the forgiveness line sits ($56 vs $112 in New
  // York), never whether the arm fires. And one dial step under the plan price
  // is still +1, so "below the plan price" had to become "well under".
  "RENEWALS follow your season-ticket plan price and what tonight is worth to the people who hold that plan. Charge well UNDER the plan price and the plan looks like a waste, so they stop buying it. Charge above what tonight is worth to them and they quit. The bigger the visiting club's Draw, the higher the price they will forgive — and a national-TV listing pulls that line back down, because they can watch it at home for nothing.",
];

/**
 * The Module-2 Lesson-1 interface copy the /play surface renders.
 *
 * Every economic sentence and every claim-bearing label on the student screen
 * comes from here, not from a client literal (ECON_ADAPTATION_RULINGS R-1/R-2/R-3,
 * VISUAL_REFERENCE_CONTRACT G). The renderer's job is layout; the words are the
 * module's. `twoBooksLine` is SLICED out of `OBJECTIVE_COPY` rather than retyped
 * so the two can never drift apart.
 */
export const FULL_HOUSE_UI_COPY = {
  /** The bell line on the locked-waiting state. Teacher-paced, never a timer. */
  doorsLine: "Doors open when your teacher rings the bell.",
  /**
   * R-2: `fillPct` is turnout / seatsOpen, and `seatsOpen` changes on Night 4.
   * Every fill figure on this surface carries this qualifier. "of capacity" is
   * forbidden, because on the bowl night it is false.
   */
  fillQualifier: "of the seats you opened tonight",
  /** The settled night's hero label — the crowd, not the money (E10/C2). */
  whoCameLabel: "WHO CAME",
  historyTitle: "YOUR NIGHTS SO FAR",
  historyCaption: "One dot per night. Two nights are only comparable when the card is the same.",
  /** Verbatim first clause of OBJECTIVE_COPY — printed wherever CASH and RENEWALS appear together (R-3). */
  twoBooksLine: `${OBJECTIVE_COPY.split(". ")[0]}.`,
  /**
   * W2 repair-2 B5 / Kid C #3: ONE name for the Night-4 option everywhere the
   * pair meets it. The pre-lock plate says "Open 2,400 more seats tonight", so
   * "MORE SEATS" is the name the receipt, the chain and the picture use too.
   * "UPPER BOWL" appeared nowhere before the lock and is retired from the
   * student surface (it survives on the teacher surface and in the model).
   */
  extraSeatsLabel: "MORE SEATS",
  /**
   * W2 repair-2 B5: the drawn building is labelled directly, not by a swatch
   * key. The two labels name the two sides of the hard fill seam repair 3's
   * redraw puts in the picture, so the number and the drawing say the same
   * thing. "MORE SEATS" rather than "upper bowl" everywhere the student meets
   * it: the pre-lock plate says "Open 2,400 more seats tonight", and one name
   * is what Kid C asked for.
   */
  cameLabel: "came — the lit seats",
  openSeatsLabel: "empty — the dark seats above the line",
  moreSeatsOpenLabel: "More seats open",
  moreSeatsClosedLabel: "More seats closed",
  /**
   * W2 repair-2 E1 (Economic Truth finding 5): the rail dock carries the season
   * book and the night chain carries tonight's. Neither is ever a bare `CASH`
   * again.
   */
  seasonQualifier: "season so far",
  tonightQualifier: "tonight",
  /**
   * W2 repair-2 A3 / Economic Truth finding 6: the old empty state said the
   * season plan "is the only number you have", which was false — the bill, the
   * capacity, the Draw and the TV listing are all printed on the same screen.
   * It says what the card is for instead.
   */
  noNightsYetLine: "No nights yet. Your first dot lands here after the first bell.",
  /** The disclosure that holds the full registered rules, verbatim, one press away. */
  moreLabel: "More about tonight",
  /**
   * W2 repair-4 R4-5 (Economic Truth R-H / E4): sentences the renderer used
   * to author. Every one is a fact about the model or a printed rule, so
   * every one is registered here and read off the payload.
   */
  twoPeaksTitle: "The two peaks — Night 3, your market",
  twoPeaksTicketLabel: "Tickets alone made the most at",
  twoPeaksTotalLabel: "Tickets + what they spent inside peaked at",
  noTomorrowLine: "Nothing. Tonight is the last night of the five — money spent on the event tonight has no night left to land on.",
  stockNightLine: "This night was covered for you before you sat down.",
  autoNightLine: "Nobody locked this night — the bell settled it at the season-plan price.",
  inArenaNote: "what those same people spent inside",
  bowlPaidNote: "paid whether they fill or not",
  renewalsCaption: "season-ticket holders coming back",
  /** The CASH decomposition chain's labels. No label here says "profit" or "revenue" (R-3). */
  chainLabels: {
    tickets: "TICKETS",
    inArena: "IN-ARENA",
    bill: "BUILDING BILL",
    players: "PLAYERS",
    event: "EVENT MONEY",
    bowl: "MORE SEATS",
    cash: "CASH",
    renewals: "RENEWALS",
  },
} as const;

/**
 * The settled night's price-and-card line (W2 repair-2 B1, Kid C #1). It was
 * composed in the renderer; it is registered here because it is the sentence
 * that makes the night's outcome attributable to the pair's own choice.
 */
export function nightFactLineFor(price: number, day: string, draw: number): string {
  return `You charged $${price} · ${day} · draw ${draw}/100`;
}

/**
 * W2 repair-5 R5-2 (Kid C final re-read): the turnout hero — the largest figure
 * on the settled night — had no cause line. The four-clause renewals rule sat
 * beside it, byte-identical at byte-identical coordinates after a zero night
 * and after a sellout, and WHAT HAPPENED only re-printed the pair's own inputs,
 * so nothing on the frame said anything about the number the night turns on.
 *
 * This sentence names which side of the night bound the crowd: what people
 * would pay at this price on this card, or the seats the desk opened. Both
 * quantities are already printed on the same frame (the turnout in the hero,
 * the turned-away count on a sellout), so it discloses nothing new about the
 * demand curve — no slope, no base, no other price. It grades nothing and it
 * previews nothing, and it speaks only to the crowd: the renewals book keeps
 * its own rule, in its own card.
 */
export function turnoutCauseFor(
  price: number,
  cardLabel: string,
  turnout: number,
  seatsOpen: number,
  turnedAway: number,
): string {
  const seats = seatsOpen.toLocaleString();
  const head = `${cardLabel} \u00b7 at $${price}, `;
  if (turnedAway > 0) {
    return `${head}more people wanted in than the ${seats} seats you opened. The limit was the seats, not the price.`;
  }
  if (turnout >= seatsOpen) {
    return `${head}exactly the ${seats} seats you opened filled. The price and the seats met at the same number.`;
  }
  if (turnout === 0) {
    return `${head}nobody wanted in, so all ${seats} seats you opened stayed empty. The limit was the price, not the seats.`;
  }
  return `${head}${turnout.toLocaleString()} people wanted in and you opened ${seats} seats. The limit was the price, not the seats.`;
}

/**
 * Night 5's callback on the pair's OWN screen (W2 repair-2 B6, Kid A #3 /
 * Kid C #5). Two figures and the two prices, no interpretation: the ADAPT and
 * COUNTERFACTUAL frames keep the explanation.
 */
export function repeatCallbackLineFor(
  refLabel: string,
  refPrice: number,
  refTurnout: number,
  price: number,
  turnout: number,
): string {
  return `${refLabel}'s card again · $${refPrice} → ${refTurnout.toLocaleString()} then · $${price} → ${turnout.toLocaleString()} tonight`;
}

/**
 * W2 repair-2 E5 (Kid B #2): the dial opens every night at the season-plan
 * price — `applyNight` resets `price` to `market.planPrice` when a night
 * settles — so the number standing in it is often one this desk has already
 * charged. The line states where the dial is and where that number came from;
 * it says nothing about whether the number is a good one.
 *
 * W2 repair-5 R5-5: the doc comment used to say the dial KEEPS the last price
 * charged, which the reducer has never done. The shipped behaviour is the
 * reset; the comment is now the reducer.
 *
 * The caller must only pass a night the PAIR chose. Matching on price alone
 * told a desk whose Night 3 the bell auto-committed at the plan price "the
 * price you charged on Night 3" — a price that desk never picked.
 */
export function dialCarriedLineFor(price: number, nightLabel: string): string {
  return `Your dial is at $${price} — the price you charged on ${nightLabel}.`;
}

/**
 * W2 repair-2 E2 (Economic Truth R-F): the renewals delta clamps at
 * `RENEWAL_DELTA_FLOOR`. When it did, the number the pair sees is the clamp,
 * not the rule's answer, and nothing on the surface said so.
 */
/**
 * W2 repair-4 R4-5: the Two Peaks gap sentence, registered. It restates the
 * two argmaxes the reveal already carries; it adds no claim about why.
 */
export function twoPeaksNoteFor(gapDollars: number, gapSteps: number): string {
  return `$${gapDollars} lower — ${gapSteps} clicks of the dial. The cheaper ticket made more money.`;
}

/**
 * W2 repair-4 R4-5: the settled night's second fact line — what the pair put
 * into the night and whether the extra seats were open. Null when neither.
 */
export function spendFactLineFor(spend: number, openBowl: boolean): string | null {
  if (spend <= 0 && !openBowl) return null;
  return `You also put $${spend.toLocaleString("en-US")} into the night${openBowl ? ` with the ${FULL_HOUSE_UI_COPY.extraSeatsLabel.toLowerCase()} open` : ""}.`;
}

export function renewalFloorLineFor(): string {
  return `The renewals rule takes at most ${Math.abs(RENEWAL_DELTA_FLOOR)} points off in one night. Tonight's price asked for more than that.`;
}

/**
 * The next-night control's label, composed server-side from the printed facts of
 * the night the desk is about to play — day, Draw and TV, the same three the
 * slate has published since HOOK. It carries nothing derived from a pending
 * action (BC-4). Null when there is no next night.
 */
function nextNightLabelFor(card: NightCard | null, index: number): string | null {
  if (!card) return null;
  const tv = card.tv === "national" ? "national TV" : card.tv === "local" ? "local TV" : "not on TV";
  return `NEXT: NIGHT ${index + 1} → ${card.day} · Draw ${card.draw} · ${tv}`;
}

/** `FULL_HOUSE_UI_COPY` plus the one label that depends on which night is open. */
function uiCopyFor(card: NightCard | null, index: number) {
  return { ...FULL_HOUSE_UI_COPY, nextNightLabel: nextNightLabelFor(card, index) };
}

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

/**
 * D59 THE BILL: the season-long obligation, said BEFORE the first price, in the
 * same breath as the horizon and the money scale — and contradicting neither.
 */
export const BILL_HORIZON_LINE =
  "Your players are paid for the whole season, not for one night. Five nights here stand in for all 41 home dates, so each night here carries one fifth of the season's player bill.";
export const BILL_SCALE_LINE =
  "The player bill is shrunk by the same rule as everything else on this screen: real dollars cut to classroom size, so tonight's ticket money and tonight's bill are on one scale.";
/** Tax salary, in words a fifth-grader can act on. No date, no dash. */
export const TAX_SALARY_DEFINITION_56 = "Payroll here is what your players are paid this season, plus money still owed to players who have already left.";
export const TAX_SALARY_DEFINITION_78 =
  "Tax salary: roster salary plus dead money, the figure the luxury tax is charged on. Cap holds are left out — a hold is charged against the cap for a player the club has not decided about, and is paid to nobody.";
/**
 * The approved 5-6 register (W4_BILL_RESEARCH.md §6), verbatim with the payroll
 * filled in. "About $150 million" is the doc's own rounding of the $153M constant.
 */
export const billLine56 = (payrollWholeMillions: string): string =>
  `Every team gets the same TV check from the league — about $150 million a year. Your players cost about ${payrollWholeMillions}. The TV check pays most of that. The rest of their pay, the staff, the lights and any tax come from your own city: tickets, food, sponsors, local TV. Tonight is one of 41 home nights carrying that.`;
/** The approved 7-8 addition (W4_BILL_RESEARCH.md §6), verbatim, as the translation table's caption. */
export const BILL_CAPTION_78 =
  "Players as a group are promised about half of all NBA money, so payroll is roughly half of revenue by design. Your TV check covers about Memphis ~95%, Boston ~75%, New York ~70% of payroll. Tax is charged on the end-of-season number — $1 per $1 in the first band, $3 if you were in the tax three of the last four years — and half of it goes to the teams that stayed under.";
export const HOLDS_CAVEAT_78 = "Cap holds not separately verified for this club: the tax salary shown equals the cap hit, which may overstate it.";
export const BILL_SEASON_LINE_78 = (payrollText: string, leagueText: string): string =>
  `National TV ≈ ${leagueText} against payroll ${payrollText}; the gap, plus tax, plus running the building, comes from local revenue, of which tonight's gate is one of 41.`;

/** BC-3: every real figure in product copy carries its date. */
export const SOURCE_NOTES: readonly string[] = [
  "THE BILL (D59): national media money per club is projected at about $153M for 2026-27 from $143M in 2025-26 at the deal's roughly 7% average step (Sportico 2025-11-12, read 2026-09-04; MEDIUM, ±$10M). Real 2024-25 gate per club is a Forbes estimate, Oct 2025 (MEDIUM). Luxury-tax bands and rates for 2026-27 from cbaguide.com and the Hoops Rumors glossary, read 2026-09-04 (HIGH on rates). Tax salary excludes cap holds. Details: docs/gauntlet/module-2/W4_BILL_RESEARCH.md.",
  "Carried-club buildings: Little Caesars Arena 20,332; Fiserv Forum 17,385; TD Garden 19,156; Barclays Center 17,732; Golden 1 Center 17,608; Target Center 18,798 (Wikipedia basketball capacities, read 2026-09-04; MEDIUM). Demand curves for those six buildings are the New York or Memphis curve rescaled to the seat count, not the club's own measured demand.",
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
    what: "Renewals move the crowd, but only a little (25 fans per renewal point), so Night 5's crowd change is small next to the size of the building.",
    why: "Renewals ARE partly next year's ticket demand, so the channel is real. Its size is capped by an honesty constraint, not a design taste: push it far enough and a renewal point starts being worth more future cash than it costs to buy, the cash-maximising season starts chasing renewals as well, and the two books stop trading off at all. What was actually swept when 25 was chosen was renewalFans 10-60 against planSlope 1.2-3.6; a later independent sweep found 30/4.5, 30/6.0 and 35/6.0 also keep the two books trading off, with a larger Night-5 move. So 25 is A truthful setting, not the largest one — it is the pair this build shipped and kept rather than retune. What IS a hard ceiling is arithmetic, not taste: a crowd change big enough to read off a bar chart without numbers would need about 80 fans a point in a 19,800-seat building, and the books stop trading off long before that. We chose the true tradeoff over the louder moment.",
    risk: "The Night 5 crowd change may be too small to read off the projector without the numbers — so read the numbers. The Night 1 vs Night 5 board prints each desk's own split (how many people came from renewals, how many from the event money it spent on Night 4). Do not let the room conclude renewals barely matter: they matter enormously, NEXT season, which is outside these five nights, and that is exactly why the two books do not add up.",
  },
  {
    what: "Two different things you did on earlier nights arrive on tonight's crowd: your renewals, and last night's event money.",
    why: "Both are real building economics — a season-ticket base is who shows up before anyone buys a walk-up ticket, and a promotion sells the NEXT night, not the one you paid for it on.",
    risk: "They are easy to confuse for one another, and the event-money channel can be the bigger one on Night 5. Never attribute a Night-5 crowd change to renewals without checking the desk's own split on the board — the model prints both.",
  },
  {
    // gate-l1-econ-r3 R7's ledger limb.
    what: "The event-money dial's renewals value is a ceiling, not a rate: at most +2 points, and exactly zero at most prices.",
    why: "One night can only move renewals within a fixed band (-20 to +12 points). The spend term is added inside that band, so once your price has already driven the night to the top or the bottom of it, more money buys no more points. Measured over every card-and-price state in the model, the dial buys zero points in 62% (New York) and 65% (Memphis) of them — including at the cash-best price on Nights 1, 2 and 5.",
    risk: "A pair can read '+2 points' as a rate they can always buy and spend for it. The student screen and the house rules now say 'at most', and name the zero case. If a desk spends and its renewals do not move, that is the model being consistent, not a bug — say so.",
  },
  {
    // gate-l1-econ-r3 W3-R12's ledger limb.
    what: "The renewals card says protecting your base \"starts cheap and ends expensive\" and prints the cheapest and the dearest point. That is the trend, not the shape.",
    why: "The season frontier's cost per renewal point rises strongly overall (under $3,000 a point below 93%, $9,000-$51,478 above it), but it is not monotone: walking the frontier there are 7 local drops at New York and 8 at Memphis, and the single cheapest step is in the middle of the range, not at the start.",
    risk: "A sharp student who compares two ADJACENT points can find a step that is cheaper than the one before it and conclude the card is wrong. It is not — the printed numbers are the two extremes of a sawtoothed but strongly rising sequence. Say that the price of the NEXT point depends on which night you have to move to buy it.",
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
  // m2-visual-quality-war R-7: the drawn arena is a picture of the model that the
  // model does not make. Two entries, one per thing the picture adds.
  {
    what: "The drawn arena lights every deck that is open tonight to one evenly-lit proportion of a single pool: the decks are architecture, not price tiers, and no deck fills before another.",
    why: "The model has one undifferentiated seat pool and never decides which seats sell first, so the picture must not either. Each open deck is lit from its own front row back to an equal-area seam, which makes lit seat area over open seat area equal to turnout/seatsOpen in every deck at once.",
    risk: "A student reads the lit ring as \"the cheap seats filled first\" — a mechanism this model does not have, and one that would change every answer if it did. The picture now denies it, because every open deck is lit to the same proportion; but filling each deck front-row-back is still a drawing convention, not a model rule. Say that tonight every seat in the building is the same seat at the same price.",
  },
  {
    what: "The Night-4 upper bowl is a third state of the same picture — shuttered on every night it is not open (whether or not the option was on the card), open and lit to the same proportion as every other deck on the one night the pair opens it — and it is drawn as about a quarter of the seat area (measured 25.9%) when the seats it stands for are about a tenth of the pool. The ordinary building is the lower two decks.",
    why: "`seatsOpen` grows when the bowl opens, so the same crowd draws a shorter bar — the picture is honest about the building, not about the decision. The deck is drawn larger than its true share because 2,400 seats out of 22,200 is a four-pixel band at classroom size, and a state nobody can see is not a state.",
    risk: "Opening the bowl LOWERS the fill picture while RAISING turnout and zeroing turnaways. A student reading the picture alone concludes opening was worse, when what changed was the denominator. Every fill figure is labelled \"of the seats you opened tonight\" for exactly this reason; read the turnout beside it, not the bar alone. Do not read the SIZE of the drawn upper deck as the size of the option either — it is about a quarter of the drawn seats and about a tenth of the real ones.",
  },
  // m2-visual-quality-war R-10 (econ K2): measured, not theoretical — on Night 4
  // renewals GAIN at the season-high price in both markets.
  {
    what: "The renewals forgiveness line is a modelled construct (`renewalReferencePrice`) that moves with the card and is never printed.",
    why: "The rules state its shape in words — charge well under the plan price and the plan looks like a waste; charge above what tonight is worth to them and they quit; a bigger Draw raises the line and a national-TV listing pulls it back down — but printing the number would hand the pair the answer to the night before they set the dial.",
    risk: "A pair that generalises \"a high price loses renewals\" from Nights 1-3 will be wrong on Night 4, where the line sits above $100 and renewals GAIN at the season-high price in both markets. Let that happen, then name why: what moved was not their price, it was what the night was worth to the people holding the plan.",
  },
  // D59 Week 4: the carried-club markets and THE BILL.
  {
    what: "Only two demand curves exist (New York, Memphis). A carried desk on any other club runs its own building — real name, real seat count — over the nearest archetype's hidden curve, with the two absolute crowd terms rescaled to the seat count. Bill, plan price and every slope are copied unchanged.",
    why: "Every demand constant was tuned and swept on two markets. Adding six untuned curves would put six unverified economies in front of a class; borrowing the nearest tuned one keeps every property the harness checks, and the building still fills at some legal price.",
    risk: "A student may read the Brooklyn desk's crowd as Brooklyn's real demand. It is not — it is the Knicks' modeled demand in a 17,732-seat building. The board's honesty line covers this; say it again when two carried clubs are compared.",
  },
  {
    what: "THE BILL: the season's player cost is (tax salary − one national TV check + luxury tax) ÷ 41, scaled to classroom dollars, and charged as one fifth per night on top of the doors. Real gate, sponsors, local TV and revenue sharing are named, not modeled.",
    why: "The founder's test is that a student traces tonight's obligation to a roster decision they made themselves, and can tell revenue from clearing the bill. Stating the bill over the same 41-date horizon as the receipts, taking the TV check off the top first, and charging tax on tax salary (not the cap hit with holds) are what keep that honest.",
    risk: "Three false lessons wait here. (1) 'Payroll is paid from tickets': it is not — money is fungible and the gate is one local stream of four; the screen says so. (2) 'The cap hit is cash': cap holds are charged against the cap and paid to nobody, which is why every dollar here is computed from tax salary and the cap hit is shown only as a position. (3) 'A bigger payroll means a higher ticket price': a fixed cost moves every replay row by the same amount and never moves the best price — it changes whether the season clears the bill. Revenue sharing lifts a small market's league money above the TV figure by a confidential amount: name it, never give it a percentage.",
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

/**
 * `gate-l1-play` recheck2 R6 / P2 second clause (BLOCKING, carried): the
 * night-spend receipt was a forward-looking conditional — "about 960 extra
 * people into tonight's building, IF there is room for them" — and nothing on
 * any surface ever came back to say whether there was. Two of one desk's four
 * landed spends went onto nights that sold out, so $120,000 bought nothing and
 * the room was never told.
 *
 * This settles it, from the model rather than from copy. The carried fans are
 * already inside the night's demand base; take them back out and re-clamp
 * against the seats that were open, and the difference is exactly how many of
 * them the building could actually seat.
 */
export function spendVerdictFor(
  market: Market,
  night: SettledNight,
  carryFansIn: number,
): { carryFans: number; seated: number; wasted: number; label: string } | null {
  if (carryFansIn <= 0) return null;
  const spend = Math.round(carryFansIn / market.eventFans);
  const wanted = night.settlement.turnout + night.settlement.turnedAway;
  const seatedWithout = Math.min(night.settlement.seatsOpen, Math.max(0, wanted - carryFansIn));
  const seated = night.settlement.turnout - seatedWithout;
  const wasted = carryFansIn - seated;
  const dollars = `$${spend.toLocaleString()}`;
  const label =
    seated <= 0
      ? `Last night's ${dollars} bought nothing. It brought about ${carryFansIn.toLocaleString()} more people to the door — and the building sold out anyway, so not one of them got a seat you had not already sold.`
      : wasted > 0
        ? `Last night's ${dollars} bought about ${seated.toLocaleString()} extra people through the door. The other ${wasted.toLocaleString()} could not get in — the building ran out.`
        : `Last night's ${dollars} bought about ${seated.toLocaleString()} extra people, and every one of them got in and paid tonight's price.`;
  return { carryFans: carryFansIn, seated, wasted, label };
}

/**
 * The settled night's headline, composed here rather than in the renderer so the
 * client never assembles an economic claim out of loose numbers (R-1). Both
 * forms are settled facts only. The sellout form leads with the crowd and the
 * two denominators, never with a grading word (D4 / R-4). Numbers are formatted
 * exactly as the surfaces format them (`Number.toLocaleString()`); the price is
 * a whole-dollar dial position and carries no separator.
 */
function resultHeadlineFor(night: SettledNight): string {
  const nightNumber = CARDS.findIndex((c) => c.id === night.cardId) + 1;
  const s = night.settlement;
  if (s.soldOut) {
    return `FULL HOUSE · ${s.turnout.toLocaleString()} of ${s.seatsOpen.toLocaleString()} · ${s.turnedAway.toLocaleString()} turned away`;
  }
  return `NIGHT ${nightNumber} · ${s.turnout.toLocaleString()} CAME AT $${night.price}`;
}

/** The ONLY function that turns a settled night into something a view may carry. `hidden` never crosses it. */
function viewNight(night: SettledNight, market: Market, carryFansIn = 0) {
  const nightCard = CARD_BY_ID.get(night.cardId) ?? null;
  return {
    // How the pair's locked-and-waiting call came out. The SENTENCE is authored
    // here, never in the client: the desk renders words, it does not write
    // verdicts (R-1).
    call: gateCallResolvedFor(night),
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
    // D59: the players line, kept apart from the doors. Zero on a stock desk.
    payrollLine: night.settlement.payrollLine ?? 0,
    billTotal: night.settlement.bill + (night.settlement.payrollLine ?? 0),
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
    // R-1: the headline is composed server-side from settled facts, so the
    // renderer prints a sentence instead of building one.
    resultHeadline: resultHeadlineFor(night),
    // W2 repair-5 R5-2: the cause line for the TURNOUT, computed from this
    // night's own settled facts, so a zero night and a sellout never render the
    // same sentence.
    turnoutCause: turnoutCauseFor(
      night.price,
      nightCard?.label ?? night.cardId,
      night.settlement.turnout,
      night.settlement.seatsOpen,
      night.settlement.turnedAway,
    ),
    // W2 repair-2 B1: the price-and-card line, registered rather than composed
    // in the renderer, so the settled outcome is attributable to the choice.
    factLine: nightFactLineFor(night.price, nightCard?.day ?? "", nightCard?.draw ?? 0),
    // W2 repair-4 R4-5: the spend-and-seats line, registered rather than composed.
    spendLine: spendFactLineFor(night.spend, night.openBowl),
    // W2 repair-2 E2: TRUE when the renewals rule's answer for this night's
    // price and spend was below the floor and the printed move is the clamp.
    // Recomputed from this night's own inputs through the exported model
    // function; no constant and no new mechanic.
    // W2 repair-4 R4-4b: only when the 20-point clamp itself bound (see
    // `renewalFloorBinds`), never on the book's 0 floor.
    renewalAtFloor: nightCard ? renewalFloorBinds(renewalDeltaRaw(market, nightCard, night.price, night.spend), night.renewalMove) : false,
    renewalFloorLine: renewalFloorLineFor(),
    // R6/P2: was last night's event money confirmed or refuted by this night?
    spendVerdict: spendVerdictFor(market, night, carryFansIn),
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
    // D59: the carried label is the desk's name; a stock desk says so.
    label: desk.label ?? null,
    carried: Boolean(desk.obligation),
    stock: desk.stock ?? false,
  };
}

const bandOfRoom = (state: FullHouseState): GradeBand => state.gradeBand ?? "5-6";

/**
 * THE BILL as a desk sees it. 5-6: one number, the names, one sentence — no
 * percent sign, no dash before a digit, no date. 7-8: the whole translation,
 * real term per signing, real gate beside the modeled night, the holds caveat.
 */
export function billView(desk: Desk, band: GradeBand, payrollDefinition: string | null) {
  const o = desk.obligation;
  if (!o) return null;
  const market = marketOf(desk);
  const tonight = { doors: market.bill, players: o.perNightModel, total: market.bill + o.perNightModel };
  if (band === "5-6") {
    return {
      band,
      label: o.label,
      club: o.club,
      payrollText: wholeMillionsText(o.payroll),
      definition: TAX_SALARY_DEFINITION_56,
      signings: o.signings.map((sg) => ({ name: sg.name, years: sg.years, yearsText: `${sg.years} ${sg.years === 1 ? "year" : "years"}` })),
      line: billLine56(wholeMillionsText(o.payroll)),
      leagueMoneyText: "about $150 million",
      seasonBill: o.seasonBillModel,
      seasonBillText: `$${o.seasonBillModel.toLocaleString()}`,
      tonight,
      tonightText: `$${tonight.players.toLocaleString()}`,
      horizonLine: BILL_HORIZON_LINE,
      scaleLine: BILL_SCALE_LINE,
    };
  }
  return {
    band,
    label: o.label,
    club: o.club,
    payroll: o.payroll,
    payrollText: o.payrollText,
    definition: TAX_SALARY_DEFINITION_78,
    capHit: o.capHit,
    capHitText: o.capHitText,
    capHitDefinition: payrollDefinition,
    holds: o.holds,
    holdsCaveat: o.holdsVerified ? null : HOLDS_CAVEAT_78,
    bandName: o.band,
    overTaxBy: o.overTaxBy,
    taxLine: o.taxLine,
    repeater: o.repeater,
    taxBill: o.taxBill,
    signings: o.signings.map((sg) => ({ name: sg.name, role: sg.role, annualText: sg.annualText, years: sg.years, coveredThrough: sg.coveredThrough, tool: sg.tool })),
    seasonLine: BILL_SEASON_LINE_78(o.payrollText, millionsText(o.leagueMoney)),
    caption: BILL_CAPTION_78,
    table: [
      { step: "Tax salary (players this season)", real: o.payroll },
      { step: "National TV money, off the top", real: o.leagueMoney },
      { step: "The gap the TV check does not reach", real: o.gapReal },
      { step: o.repeater ? "Luxury tax, repeater scale" : "Luxury tax", real: o.taxBill },
      { step: "What local revenue must cover", real: o.gateShareReal },
      { step: "÷ 41 home dates", real: o.perNightReal },
      { step: `× ${BILL_MODEL.MODEL_SCALE} classroom scale`, model: o.perNightModel },
      { step: "× 5 nights here", model: o.seasonBillModel },
    ],
    realGate: o.realGate,
    realGatePerDate: o.realGatePerDate,
    realGateSource: o.realGateSource,
    seasonBill: o.seasonBillModel,
    tonight,
    horizonLine: BILL_HORIZON_LINE,
    scaleLine: BILL_SCALE_LINE,
  };
}

/** The unseated picker: every carried franchise nobody holds yet, by label. */
function availableFranchises(state: FullHouseState) {
  return unclaimedFranchises(state).map((f) => ({
    label: f.label,
    club: marketForClub(f.clubId).club,
    city: f.city,
    band: f.band,
    committed: f.committed,
    committedText: millionsText(f.committed),
    signings: f.signings.map((sg) => sg.name),
  }));
}

function booksFor(desk: Desk) {
  return { cash: desk.cash, renewals: desk.renewals, inDebt: desk.cash < 0 };
}

/* ------------------------------------------------- W3: the projector -- */
/**
 * WAVE 3, LANE B. Everything the projector's new per-night CLASS RESULTS frame
 * is allowed to know, in one place, so that the column law is readable as law
 * rather than as a render detail.
 *
 * VISUAL_REFERENCE_CONTRACT E1/E2/E4; ECON_ADAPTATION_RULINGS R-2, R-4, E16,
 * E18, E19; D-law "`/board` never shows a seat's private data".
 *
 * THE COLUMN LAW. The frame carries DESK, TICKET PRICE, WHO CAME and FILL, and
 * nothing else. Revenue and profit columns are FORBIDDEN (E16). Per-desk money
 * never reaches the projector at all: money appears once, at the season-books
 * stage of REVEAL, as per-market medians. `ClassResultRow` below is the whole
 * per-desk payload and it has no money field to render.
 *
 * THE FILL LAW. Fill is turnout over the seats THAT DESK opened (R-2), never
 * "of capacity" — false on the bowl night, where a desk's own denominator
 * grows by its building's bowl seats. Each row therefore prints its own
 * denominator, and each building prints its own capacity note. There is no
 * class-wide capacity number anywhere on the frame (E18).
 *
 * THE HELD-STATE LAW. This payload is built only from nights that have already
 * settled. Nothing about the open night is on it (R13), and the last bell still
 * closes on a held state, so the staged REVEAL remains the first time the room
 * sees all five nights at once.
 */
export const BOARD_CLASS_RESULTS_COPY = {
  frameTitle: "CLASS RESULTS",
  deskColumn: "DESK",
  priceColumn: "TICKET PRICE",
  turnoutColumn: "WHO CAME",
  fillColumn: "FILL",
  /** R-2 on a public surface: the desk's own open seats, in the third person. */
  fillQualifier: "of the seats that desk opened",
  soldOutTag: "FULL HOUSE",
  /** One name for the Night-4 option on every surface (W2 repair-2 B5). */
  moreSeatsTag: FULL_HOUSE_UI_COPY.moreSeatsOpenLabel,
  /** E16, said out loud on the frame that could have carried a money column. */
  noMoneyNote:
    "No desk's money is on this board. Cash and renewals stay on each desk's own screen until the season is read out.",
  /** E2: one night, one building. The frame refuses the cross-building read. */
  oneBuildingNote:
    "One night, one building. Two desks are comparable only when they ran the same building on the same night.",
  autoTag: "auto",
} as const;

/** Q4: past this many desks in one building, the frame pages instead of shrinking. */
export const BOARD_RESULTS_ROWS_PER_PAGE = 8;

export type ClassResultRow = {
  deskHandle: string;
  crestIndex: number;
  price: number;
  turnout: number;
  /** The desk's OWN denominator (R-2). Never a class-wide capacity (E18). */
  seatsOpen: number;
  fillPct: number;
  soldOut: boolean;
  openBowl: boolean;
};

export type ClassResultsGroup = {
  marketId: MarketId;
  club: string;
  building: string;
  capacity: number;
  capacityNote: string;
  /** 1-based group index within this building, and how many groups it has. */
  group: number;
  groupCount: number;
  rows: ClassResultRow[];
  /**
   * The WHO CAME bar's full length, in people: the largest number of seats any
   * desk in this building opened tonight. The bar is a HEADCOUNT against the
   * building, which is why the FILL column is not redundant with it, and why a
   * bar only reaches the end of its track when that desk actually sold out.
   */
  barBasis: number;
};

export type ClassResults = {
  cardId: string;
  cardLabel: string;
  nightNumber: number;
  nightCount: number;
  day: string;
  visitor: string;
  draw: number;
  deskCount: number;
  /** One entry per building, then per group of at most 8 desks inside it. */
  groups: ClassResultsGroup[];
  copy: typeof BOARD_CLASS_RESULTS_COPY;
};

/**
 * Build the class-results payload for ONE settled night.
 *
 * Returns null before the first bell, which is what holds the frame back while
 * a night is open. `agg.curves` is already in `deskOrder` order (see
 * `computeAggregate`), so filtering preserves the stable desk order the room
 * reads across all five night frames.
 */
export function classResultsFor(state: FullHouseState, agg: FullHouseAggregate, cardId: string | null): ClassResults | null {
  if (!cardId) return null;
  const card = CARD_BY_ID.get(cardId);
  if (!card) return null;
  const nightPoints = agg.curves.filter((p) => p.cardId === cardId);
  if (nightPoints.length === 0) return null;
  const groups: ClassResultsGroup[] = [];
  for (const market of MARKETS) {
    const inMarket = nightPoints.filter((p) => p.marketId === market.id);
    if (inMarket.length === 0) continue;
    const barBasis = Math.max(1, ...inMarket.map((p) => p.seatsOpen));
    const groupCount = Math.max(1, Math.ceil(inMarket.length / BOARD_RESULTS_ROWS_PER_PAGE));
    for (let g = 0; g < groupCount; g += 1) {
      groups.push({
        marketId: market.id,
        club: market.club,
        building: market.building,
        capacity: market.capacity,
        capacityNote: market.capacityNote,
        group: g + 1,
        groupCount,
        barBasis,
        rows: inMarket.slice(g * BOARD_RESULTS_ROWS_PER_PAGE, (g + 1) * BOARD_RESULTS_ROWS_PER_PAGE).map((p) => ({
          deskHandle: p.deskHandle,
          crestIndex: p.crestIndex,
          price: p.price,
          turnout: p.turnout,
          seatsOpen: p.seatsOpen,
          fillPct: p.fillPct,
          soldOut: p.soldOut,
          openBowl: p.openBowl,
        })),
      });
    }
  }
  return {
    cardId: card.id,
    cardLabel: card.label,
    nightNumber: CARDS.findIndex((c) => c.id === card.id) + 1,
    nightCount: NIGHT_COUNT,
    day: card.day,
    visitor: card.visitor,
    draw: card.draw,
    deskCount: agg.deskCount,
    groups,
    copy: BOARD_CLASS_RESULTS_COPY,
  };
}

/**
 * E4, the projector's left rail, on every frame: which night the room is on,
 * and the capacity of each building WITH its own capacity note. E18 forbids a
 * single class-wide capacity number, so this is per market and never summed.
 */
export type BoardRail = {
  nightNumber: number;
  nightCount: number;
  pips: { id: string; label: string; state: "settled" | "open" | "ahead" }[];
  markets: { id: MarketId; club: string; building: string; capacity: number; capacityNote: string }[];
  deskCount: number;
};

export function boardRailFor(state: FullHouseState, agg: FullHouseAggregate): BoardRail {
  const settled = Math.min(state.nightIndex, NIGHT_COUNT);
  return {
    nightNumber: Math.min(state.nightIndex + 1, NIGHT_COUNT),
    nightCount: NIGHT_COUNT,
    pips: CARDS.map((c, i) => ({
      id: c.id,
      label: c.label,
      state: i < settled ? "settled" : i === settled ? "open" : "ahead",
    })),
    markets: MARKETS.map((m) => ({
      id: m.id,
      club: m.club,
      building: m.building,
      capacity: m.capacity,
      capacityNote: m.capacityNote,
    })),
    deskCount: agg.deskCount,
  };
}

/* --------------------------------------------------------------- module -- */

/* ----------------------------------------------- D59: the carry surfaces -- */

function carryTeacherView(state: FullHouseState) {
  const carry = state.carry;
  if (!carry) return null;
  const desks = state.deskOrder.map((id) => state.desks[id]).filter((d): d is Desk => d !== undefined);
  const claimed = carry.franchises
    .filter((f) => carry.claims[f.label] !== undefined)
    .map((f) => {
      const desk = desks.find((d) => d.label === f.label);
      return { label: f.label, handle: desk ? deskHandle(desk) : null, seatId: carry.claims[f.label]!, payrollText: millionsText(f.taxSalary) };
    });
  const unclaimed = carry.franchises.filter((f) => carry.claims[f.label] === undefined).map((f) => f.label);
  const stock = desks.filter((d) => d.stock).map((d) => deskHandle(d));
  return {
    ok: carry.ok,
    reason: carry.reason ?? null,
    warnings: carry.warnings,
    sourceSessionId: carry.sourceSessionId,
    claimed,
    unclaimed,
    stock,
    stockReason:
      !carry.ok
        ? `Every desk is stock: ${carry.reason ?? "the carry was refused"}.`
        : stock.length === 0
          ? null
          : unclaimed.length === 0
            ? "Every carried franchise was picked up; later desks were dealt stock buildings."
            : "A stock desk in a room that still has unclaimed franchises means a desk was dealt after a drop — see the warnings.",
    payrollDefinition: carry.payrollDefinition,
    lines: carry.lines,
    leagueMoney: BILL_MODEL.LEAGUE_MONEY_PER_CLUB,
    revenueSharingNote:
      "Revenue sharing is real and lifts a small market's league money above the TV figure by a confidential amount. Name it if asked; never give it a percentage.",
  };
}

function carrySeedNote(state: FullHouseState): string {
  const carry = state.carry;
  if (!carry) return "No source session was linked. Every desk runs a stock building with no players line.";
  if (!carry.ok) return `The linked session could not be carried: ${carry.reason ?? "unreadable"}. Every desk runs a stock building.`;
  const n = carry.franchises.length;
  return `${n} franchise${n === 1 ? "" : "s"} carried in from THE WINDOW${carry.sourceSessionId ? ` (session ${carry.sourceSessionId})` : ""}. Each desk picks its own up by label; a desk that presses DEAL ME ONE gets the next unclaimed one.${
    carry.warnings.length > 0 ? ` ${carry.warnings.length} warning${carry.warnings.length === 1 ? "" : "s"} — read them below.` : ""
  }`;
}

/** The projector's bills-by-label frame. Carried desks only, sorted highest first, plus the spread. Never a seat id. */
export function billsBoard(state: FullHouseState) {
  if (!state.carry?.ok) return null;
  const rows = state.deskOrder
    .map((id) => state.desks[id])
    .filter((d): d is Desk => d !== undefined && Boolean(d.obligation))
    .map((d) => ({
      label: d.label ?? deskHandle(d),
      club: marketOf(d).club,
      payrollText: d.obligation!.payrollText,
      seasonBill: d.obligation!.seasonBillModel,
      tonight: d.obligation!.perNightModel,
      doors: marketOf(d).bill,
      bandName: d.obligation!.band,
    }))
    .sort((a, b) => b.seasonBill - a.seasonBill || a.label.localeCompare(b.label));
  const stockCount = state.deskOrder.filter((id) => state.desks[id]?.stock).length;
  const spread =
    rows.length >= 2
      ? {
          highestLabel: rows[0]!.label,
          highest: rows[0]!.seasonBill,
          lowestLabel: rows[rows.length - 1]!.label,
          lowest: rows[rows.length - 1]!.seasonBill,
          gap: rows[0]!.seasonBill - rows[rows.length - 1]!.seasonBill,
        }
      : null;
  return { rows, spread, stockCount, unclaimed: unclaimedFranchises(state).map((f) => f.label) };
}

export const fullHouseModule: LessonModule<FullHouseState> = {
  id: MODULE_ID,
  title: "Module 2 · Lesson 1 — Full House",
  phases: PHASES,

  initialState(input) {
    const base: FullHouseState = { desks: {}, deskOrder: [], nightIndex: 0, twoPeaksReleased: false, revealStage: 0, cfPage: 0, synthPage: 0 };
    // No seed: the state is exactly what it always was. A seeded room stores
    // the PARSED carry and its band — never the raw envelope — and keeps a
    // refused carry's reason so the console can say why every desk is stock.
    if (input.seed === undefined || input.seed === null) return base;
    const read = extractWindowCarry(input.seed, input.gradeBand);
    const carry: CarryState = read.ok
      ? {
          ok: true,
          warnings: read.warnings,
          franchises: read.franchises.map(carriedRecordOf),
          claims: {},
          lines: read.lines,
          payrollDefinition: read.payrollDefinition,
          sourceSessionId: read.sourceSessionId,
        }
      : { ok: false, reason: read.reason, warnings: [], franchises: [], claims: {}, lines: null, payrollDefinition: null, sourceSessionId: null };
    return { ...base, gradeBand: input.gradeBand, carry };
  },

  /**
   * Manual-fallback discipline: no reveal in this lesson depends on a click
   * that may never come. Leaving PLAY closes whatever night is still open
   * (every desk settles with the same math the bell uses) and releases the
   * Two Peaks panel; leaving REVEAL plays out every remaining reveal stage.
   */
  /**
   * TIME CUT for Full House. The round is a NIGHT; the bell settles it.
   *
   * The fallback is the one the desk's own screen, the bell's confirm line and
   * the WATCH FOR flag all already promise: a pair who never pressed LOCK IT IN
   * did not choose, so the night settles on the season plan with nothing spent.
   * Naming it per desk, with the desk's actual dialled number beside the number
   * it would actually settle at, is what turns that from a trap into a stake.
   */
  round: {
    closeHook: "teacher:closeNight",
    noun: "night",
    fallbackPolicy:
      "A desk that never locks settles tonight at its season plan price with nothing spent — the dial it is sitting on does not count as a decision.",
    currentKey(state, phase) {
      if (phase !== "PLAY") return null;
      const card = openCard(state);
      return card ? card.id : null;
    },
    unresolved(state, phase, seatIds) {
      if (phase !== "PLAY" || !openCard(state)) return [];
      const out: UnresolvedSeat[] = [];
      for (const seatId of seatIds) {
        const desk = state.desks[seatId];
        if (!desk || desk.locked) continue;
        const market = marketOf(desk);
        const dialled = desk.price;
        out.push({
          seatId,
          label: deskHandle(desk),
          fallback:
            dialled === market.planPrice && desk.spend === 0 && !desk.openBowl
              ? `settles at the $${market.planPrice} season plan (their dial is already there)`
              : `settles at the $${market.planPrice} season plan, NOT the $${dialled} on their dial`,
          selfFallback:
            dialled === market.planPrice && desk.spend === 0 && !desk.openBowl
              ? `Lock in, or tonight settles at your $${market.planPrice} season plan — which is where your dial already is.`
              : `Lock in, or tonight settles at your $${market.planPrice} season plan, NOT the $${dialled} you have dialled.`,
        });
      }
      return out;
    },
  },

  /**
   * WHILE YOU WERE AWAY, in Full House's own nouns.
   *
   * A pair whose Chromebook slept through the Night 3 bell comes back to a
   * settled book and no idea why. This is the "what did the ROOM do" half of
   * that; their own numbers are already on their screen, because the runtime
   * hands back current truth and never rewinds.
   *
   * Class-level only — no desk is ever named here. The log this feeds is read
   * back by whichever desk returns, so a line about one pair's price would be
   * printed on another pair's screen, and this lesson's whole reveal depends
   * on the room not seeing each other's dials before the bell.
   */
  classEvents(prev, next, { fromPhase, toPhase }) {
    const out: string[] = [];
    // Nights only ever move forward here. Restore walks the index BACK, and a
    // recap that announced Night 3 settling because the teacher undid it would
    // be telling the room the opposite of what happened.
    for (let n = prev.nightIndex; n < next.nightIndex; n += 1) {
      const card = CARDS[n];
      out.push(
        card
          ? `${card.label} closed. Every desk settled at once against the card that was printed before anybody touched a dial.`
          : "A night closed and settled.",
      );
    }
    if (!prev.twoPeaksReleased && next.twoPeaksReleased && next.nightIndex < NIGHT_COUNT) {
      out.push("The Two Peaks went up on the projector.");
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
    if (fromPhase === "PLAY") {
      // The night that is actually open settles on the pair's own dials (see
      // closeNight); nights nobody ever saw settle at the plan price, which is
      // where every dial rests after a night is applied anyway.
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
      while (next.nightIndex < NIGHT_COUNT) next = closeNight(next, false);
      if (!next.twoPeaksReleased) next = { ...next, twoPeaksReleased: true };
    }
    if (fromPhase === "REVEAL" && next.revealStage < REVEAL_STEPS) next = { ...next, revealStage: REVEAL_STEPS };
    return next;
  },

  reduce(state, action, ctx): ReduceResult<FullHouseState> {
    if (action.type === "takeSeat") {
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can take a desk" };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        // Not a refusal: an honest landing. See `seatLate`.
        return { ok: true, state: seatLate(state, ctx.seatId) };
      }
      return { ok: true, state: dealDesk(state, ctx.seatId) };
    }
    if (action.type === "claim") {
      // D59: pick up your own franchise by its label. Same phases as takeSeat;
      // after the nights close there is nothing left to pick up (see seatLate).
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated desk can pick up a franchise" };
      if (ctx.phase !== "LOBBY" && ctx.phase !== "HOOK" && ctx.phase !== "PLAY") {
        return { ok: true, state: seatLate(state, ctx.seatId) };
      }
      return claimDesk(state, ctx.seatId, action["label"]);
    }
    if (action.type === "setPrice" || action.type === "setSpend" || action.type === "setBowl" || action.type === "lock") {
      if (ctx.phase !== "PLAY") return { ok: false, reason: `you can only price a night during PLAY (session is in ${ctx.phase})` };
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair can work a desk" };
      if (action.type === "setPrice") return doSetPrice(state, action["price"], ctx.seatId);
      if (action.type === "setSpend") return doSetSpend(state, action["spend"], ctx.seatId);
      if (action.type === "setBowl") return doSetBowl(state, action["open"], ctx.seatId);
      return doLock(state, ctx.seatId);
    }
    if (action.type === "gateCall") {
      // The locked-and-waiting beat. Free, carries no money, changes no settled
      // number. Changeable while the night is open on purpose: a fifth-grader's
      // misclick must not cost a whole night, and what the bell freezes is the
      // call standing when it rings.
      if (ctx.seatId === "teacher") return { ok: false, reason: "only a seated pair calls the gate" };
      if (ctx.phase !== "PLAY") return { ok: false, reason: `the gate is called during PLAY (session is in ${ctx.phase})` };
      const desk = state.desks[ctx.seatId];
      if (!desk) return { ok: false, reason: "this seat has no desk" };
      if (state.nightIndex >= NIGHT_COUNT) return { ok: false, reason: "all five nights are already in the books" };
      if (!desk.locked) return { ok: false, reason: "commit your price first — the call is what you do while the room finishes" };
      const band = action["band"];
      if (band !== "packed" && band !== "busy" && band !== "quiet") return { ok: false, reason: "call it packed, busy or quiet" };
      return { ok: true, state: { ...state, desks: { ...state.desks, [ctx.seatId]: { ...desk, gateCall: band } } } };
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
    if (action.type === "teacher:cfPage") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the Night 1 vs Night 5 card" };
      if (ctx.phase !== "COUNTERFACTUAL") {
        return { ok: false, reason: `the repeat card is paged during COUNTERFACTUAL (session is in ${ctx.phase})` };
      }
      const pages = cfPageCount(computeAggregate(state).repeatCard.length);
      if (pages <= 1) return { ok: false, reason: "every desk on this card is already on the projector" };
      // Wraps on purpose: a teacher who wants the first group back at the end of
      // the argument must never hit a dead control in front of the room.
      return { ok: true, state: { ...state, cfPage: ((state.cfPage ?? 0) + 1) % pages } };
    }
    // `gate-l1-play` W3-2: forward-only paging made a room that wanted the
    // previous group again press forward until it wrapped. Tolerable at twelve
    // desks, not at twenty.
    if (action.type === "teacher:cfPageBack") {
      if (ctx.seatId !== "teacher") return { ok: false, reason: "only the teacher pages the Night 1 vs Night 5 card" };
      if (ctx.phase !== "COUNTERFACTUAL") {
        return { ok: false, reason: `the repeat card is paged during COUNTERFACTUAL (session is in ${ctx.phase})` };
      }
      const pages = cfPageCount(computeAggregate(state).repeatCard.length);
      if (pages <= 1) return { ok: false, reason: "every desk on this card is already on the projector" };
      return { ok: true, state: { ...state, cfPage: ((state.cfPage ?? 0) + pages - 1) % pages } };
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
    if (phase === "LOBBY" || phase === "HOOK") return ["takeSeat", "claim"];
    if (phase === "PLAY") return ["takeSeat", "claim", "setPrice", "setSpend", "setBowl", "lock", "gateCall"];
    // Still offered after the nights close, so a late device gets an answer
    // instead of a silent 409 loop behind "finding your desk…" (see `seatLate`).
    return ["takeSeat"];
  },

  studentView(state, seatId, phase) {
    const desk = state.desks[seatId];
    const view = ((): Record<string, unknown> => {
      if (!desk) {
        // "Taking a desk…" is true in LOBBY and a lie afterwards.
        if (observersOf(state).includes(seatId)) {
          return {
            phase,
            seated: false,
            observer: true,
            uiCopy: uiCopyFor(null, 0),
            observerEyebrow: OBSERVER_EYEBROW,
            message: OBSERVER_MESSAGE,
            observerAction: OBSERVER_ACTION,
          };
        }
        const available = phase === "LOBBY" || phase === "HOOK" || phase === "PLAY" ? availableFranchises(state) : [];
        return {
          phase,
          seated: false,
          observer: false,
          uiCopy: uiCopyFor(null, 0),
          // D59: pick up your own franchise by name, or take the next one dealt.
          available,
          carry: state.carry ? { ok: state.carry.ok, reason: state.carry.reason ?? null } : null,
          message: available.length > 0 ? "Which franchise is yours? Pick it up where THE WINDOW left it." : "You're in! Taking a desk…",
        };
      }
      const market = marketOf(desk);
      const identity = deskIdentity(desk);
      const bill = billView(desk, bandOfRoom(state), state.carry?.payrollDefinition ?? null);
      // Each night's carried fans come from the night before it — the same
      // `carryFansFor` conversion the pair was shown before it spent (R6/P2).
      const history = desk.nights.map((n, i) => {
        const v = viewNight(n, market, i > 0 ? Math.round(market.eventFans * desk.nights[i - 1]!.spend) : 0);
        // W2 repair-2 B6: a night that repeats an earlier card carries the two
        // figures for both nights on the pair's OWN screen, at the moment the
        // result lands, instead of only two phases later on the board.
        const refId = CARD_BY_ID.get(n.cardId)?.repeatOf ?? null;
        const ref = refId ? desk.nights.find((x) => x.cardId === refId) : undefined;
        return {
          ...v,
          repeatCallback:
            refId && ref
              ? repeatCallbackLineFor(
                  CARD_BY_ID.get(refId)?.label ?? refId,
                  ref.price,
                  ref.settlement.turnout,
                  n.price,
                  n.settlement.turnout,
                )
              : null,
        };
      });
      switch (phase) {
        case "LOBBY":
          return {
            phase,
            seated: true,
            ...identity,
            message: desk.label
              ? `You have ${desk.label} — Desk ${desk.deskNumber}. Tonight you run the ${market.club}' building — ${market.building}.`
              : `You have Desk ${desk.deskNumber}. Tonight you run the ${market.club}' building — ${market.building}.`,
            plainLine: market.plainLine,
            uiCopy: uiCopyFor(null, 0),
            bill,
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
            uiCopy: uiCopyFor(null, 0),
            // D59: THE BILL is the dominant object on a carried desk's HOOK.
            bill,
            stockNote: desk.stock ? STOCK_DESK_NOTE : null,
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
              lastNight,
              // The settled-night state renders from this payload too, so the
              // rules its RENEWALS card prints have to survive the last bell.
              renewalRule: renewalRuleFor(market),
            renewalRuleLines: renewalRuleLinesFor(market),
              priceMin: PRICE_MIN,
              priceMax: PRICE_MAX,
              uiCopy: uiCopyFor(null, state.nightIndex),
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
            // D59: tonight's bill, doors + players, before the first price.
            bill,
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
            renewalRuleLines: renewalRuleLinesFor(market),
            // W2 repair-2 E5 (Kid B #2): the dial opens each night at the season
            // plan price. When the number standing in it is one this desk has
            // already charged, say which night it came from — a fact about the
            // desk's own history, not a judgement about the number.
            //
            // W2 repair-5 R5-5: only a night this PAIR priced can be named. A
            // night the bell auto-committed, and a night the desk manager
            // covered before the seat joined, were both run at the plan price by
            // someone other than the pair, so "the price you charged on Night 3"
            // was false of exactly the desks most likely to see it — the dial
            // reopens at that same plan price every night.
            dialCarriedLine: ((): string | null => {
              if (desk.locked) return null;
              const prior = [...desk.nights].reverse().find((n) => n.price === desk.price && !n.auto && !n.stock);
              if (!prior) return null;
              return dialCarriedLineFor(desk.price, CARD_BY_ID.get(prior.cardId)?.label ?? prior.cardId);
            })(),
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
            // R-1 / contract G: every claim-bearing label and sentence this desk
            // renders comes from the module. `nextNightLabel` names the night the
            // desk is about to play (the open card), from its printed facts only.
            uiCopy: uiCopyFor(card, state.nightIndex),
            // The locked-and-waiting beat (W6 `play-l1-locked-dead-time`).
            ...(desk.locked
              ? {
                  gateCall: {
                    prompt: GATE_CALL_PROMPT,
                    heading: GATE_CALL_HEADING,
                    bands: GATE_BANDS,
                    called: desk.gateCall ?? null,
                    foot: desk.gateCall ? gateCallFootCalledFor(market.building) : GATE_CALL_FOOT_OPEN,
                    room: roomLockLine(state),
                  },
                }
              : {}),
            message: desk.locked
              ? "Your price is in. The doors open when your teacher rings the bell."
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
            // R-9 (econ K2 / contract G, BLOCKING): `onPhaseExit` force-sets
            // `twoPeaksReleased` when PLAY closes, so this desk used to carry its
            // own market's peak prices, gap and revenue figures from REVEAL stage
            // 0 — six teacher presses before the room is shown them. The gate now
            // mirrors `boardView` exactly (`revealStage >= NIGHT_COUNT + 1`), on
            // the payload rather than in the renderer, because a client-side gate
            // is the class of protection nothing in this repo tests.
            twoPeaksReleased: state.twoPeaksReleased && state.revealStage >= NIGHT_COUNT + 1,
            twoPeaks:
              state.twoPeaksReleased && state.revealStage >= NIGHT_COUNT + 1
                ? computeAggregate(state)
                    .twoPeaks.filter((t) => t.marketId === desk.marketId)
                    // W2 repair-4 R4-5: the gap sentence travels with the numbers.
                    .map((t) => ({ ...t, note: twoPeaksNoteFor(t.gapDollars, t.gapSteps) }))
                : [],
            uiCopy: uiCopyFor(null, state.nightIndex),
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
            uiCopy: uiCopyFor(null, state.nightIndex),
            message: "Talk to your partner before you answer out loud.",
          };

        case "COUNTERFACTUAL": {
          const n1 = desk.nights.find((n) => n.cardId === "N1");
          const n5 = desk.nights.find((n) => n.cardId === "N5");
          // `gate-l1-play` recheck3 / analyst wave-2 catch: `econ-l1-n5-attribution`
          // was discharged on BOARD evidence while the same defect stayed live on
          // this private surface — the desk's own card showed the two crowds and
          // the two renewals figures and nothing else, so a pair reading only
          // their own device attributed the whole change to renewals (Desk 4's
          // +1,760 was renewals +800 and event money +960). The desk now gets the
          // same computed decomposition the board prints, from the same function.
          const n5Index = n5 ? desk.nights.indexOf(n5) : -1;
          const beforeN5 = n5Index > 0 ? desk.nights[n5Index - 1] : undefined;
          const row = n1 && n5 ? repeatRowFor(desk, market, n1, n5, beforeN5?.spend ?? 0) : null;
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            repeat:
              n1 && n5 && row
                ? {
                    n1Price: n1.price,
                    n1Turnout: n1.settlement.turnout,
                    n5Price: n5.price,
                    n5Turnout: n5.settlement.turnout,
                    renewalsAtN1: n1.renewalsBefore,
                    renewalsAtN5: n5.renewalsBefore,
                    samePrice: n1.price === n5.price,
                    renewalsFans: row.renewalsFans,
                    carryFans: row.carryFans,
                    n4Spend: row.n4Spend,
                    priceFans: row.priceFans,
                    seatedDelta: row.seatedDelta,
                    wantedDelta: row.wantedDelta,
                    clamped: row.clamped,
                    floored: row.floored,
                    biggestChannel: row.biggestChannel,
                    channelLine: row.channelLine,
                  }
                : null,
            replays: replaysFor(desk),
            honestLimit:
              "We can show you what the money would have done. We cannot show you what you would have done — that is why you played it.",
            prompt: ARGUE_PROMPT,
            uiCopy: uiCopyFor(null, state.nightIndex),
          };
        }

        case "SYNTHESIS": {
          // W2 repair-2 C2 / contract D2: the student device mirrors the card
          // the teacher is on — the card's registered title and the SAME
          // computed body the projector is showing, page for page, so the
          // device is not a still picture through six teacher presses. Card
          // set, order, staging and bodies are unchanged (E27): this reads
          // `synthesisCards` and adds nothing to it. Nothing seat-private
          // crosses here — this is the public board card.
          const cards = synthesisCards(state, computeAggregate(state));
          const pages = synthPageCount(cards.length);
          const page = Math.min(Math.max(0, state.synthPage ?? 0), pages - 1);
          const card = cards[page] ?? null;
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            history,
            message: "Look up at the board.",
            exitPrompt: EXIT_PROMPT,
            synthPage: page + 1,
            synthPageCount: pages,
            synthCardTitle: card?.title ?? "",
            synthCardBody: card?.body ?? "",
            uiCopy: uiCopyFor(null, state.nightIndex),
          };
        }

        case "COMPLETE":
          return {
            phase,
            seated: true,
            ...identity,
            books: booksFor(desk),
            history,
            message: COMPLETE_COPY,
            exitPrompt: EXIT_PROMPT,
            // W2 repair-2 C4 / contract D4: COMPLETE closes on EXIT_PROMPT and
            // BEYOND_SPORTS_LINE verbatim. The renderer already reads this key;
            // the payload never carried it.
            beyondSports: BEYOND_SPORTS_LINE,
            uiCopy: uiCopyFor(null, state.nightIndex),
          };

        default:
          return { phase, seated: true, ...identity, uiCopy: uiCopyFor(null, state.nightIndex) };
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
        label: desk.label ?? null,
        stock: desk.stock ?? false,
        seasonBill: desk.obligation?.seasonBillModel ?? 0,
        perNightBill: desk.obligation?.perNightModel ?? 0,
        payrollText: desk.obligation?.payrollText ?? null,
        clearedTheBill: desk.clearedTheBill ?? null,
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
        // W6: where this desk moved from, so the teacher can see adaptation
        // rather than reconstruct it from sixteen tiles. `ownLastPrice` is null
        // when the previous night was not the pair's own decision (the bell
        // auto-committed it, or the desk manager covered it before they
        // joined) — moving off a number you never chose is not adaptation, and
        // calling it that would be a story about desks that did not decide.
        ownLastPrice: ((): number | null => {
          const last = desk.nights[desk.nights.length - 1];
          return last && !last.auto && !last.stock ? last.price : null;
        })(),
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
      // THE ROOM: spread, shape and movement of the live dials. Teacher-only —
      // see roomRead(). Null once the window is closed: after the last bell
      // there is no live dial to read, and the reveal owns the numbers.
      room: state.nightIndex >= NIGHT_COUNT ? null : roomRead(desks, state.nightIndex),
      // THE DESKS: the same room, named. Teacher-only — see deskStripOf().
      deskStrip: deskStripOf(state),
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
      // P11-b: the teacher's own control for the paged repeat card, named the
      // way the reveal button is named — what the next press will put up.
      ...((): Record<string, unknown> => {
        const rows = computeAggregate(state).repeatCard;
        const pages = cfPageCount(rows.length);
        const page = Math.min(Math.max(0, state.cfPage ?? 0), pages - 1);
        const nextPage = pages <= 1 ? page : (page + 1) % pages;
        const prevPage = pages <= 1 ? page : (page + pages - 1) % pages;
        // W3-2: the control said only what the NEXT press would put up, so a
        // teacher who lost their place had to read it off the projector.
        // W3F-1: named desks, not a positional range — `orderRepeatRows`
        // groups by what a row can teach, so a group is not a contiguous
        // desk-number span.
        return {
          cfPage: page + 1,
          cfPageCount: pages,
          cfRowTotal: rows.length,
          cfPageAvailable: phase === "COUNTERFACTUAL" && pages > 1,
          cfCurrentPageLabel:
            rows.length === 0
              ? "Nothing on the repeat card yet."
              : pages <= 1
                ? `On the projector: all ${rows.length} desk${rows.length === 1 ? "" : "s"}`
                : `On the projector now: group ${page + 1} of ${pages} — ${cfPageDeskNames(rows, page)}`,
          cfPrevPageLabel:
            pages <= 1
              ? "Back a group"
              : `Back — group ${prevPage + 1} of ${pages}: ${cfPageDeskNames(rows, prevPage)}`,
          cfNextPageLabel:
            pages <= 1
              ? rows.length === 0
                ? "No desk has played both Night 1 and Night 5 yet."
                : `All ${rows.length} desk${rows.length === 1 ? "" : "s"} are on the projector.`
              : `Next group — group ${nextPage + 1} of ${pages}: ${cfPageDeskNames(rows, nextPage)}`,
          cfPageNote:
            pages <= 1
              ? "The whole repeat card fits on the projector in one look."
              : `The projector shows ${CF_ROWS_PER_PAGE} desks at a time so every row stays readable from the back. The class summary underneath stays up for every group. Pressing past the last group comes back round to the first.`,
        };
      })(),
      // W3 N1: the synthesis cards are staged the same way, for the same reason.
      ...((): Record<string, unknown> => {
        const cards = synthesisCards(state, computeAggregate(state));
        const pages = synthPageCount(cards.length);
        const page = Math.min(Math.max(0, state.synthPage ?? 0), pages - 1);
        const nextPage = pages <= 1 ? page : (page + 1) % pages;
        const prevPage = pages <= 1 ? page : (page + pages - 1) % pages;
        const title = (i: number): string => cards[i * SYNTH_CARDS_PER_PAGE]?.title ?? "";
        return {
          synthPage: page + 1,
          synthPageCount: pages,
          synthPageAvailable: phase === "SYNTHESIS" && pages > 1,
          synthCurrentLabel:
            pages <= 1 ? `On the projector: ${title(page)}` : `On the projector now: card ${page + 1} of ${pages} — ${title(page)}`,
          synthNextLabel: pages <= 1 ? "One card only" : `Next card — ${nextPage + 1} of ${pages}: ${title(nextPage)}`,
          synthPrevLabel: pages <= 1 ? "Back a card" : `Back — card ${prevPage + 1}: ${title(prevPage)}`,
          synthPageNote:
            "One card at a time, in your own time. The 'what this looks like outside sports' line stays up on every card; the exit question and the sources land on the last one.",
        };
      })(),
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
      // D59: what walked in from THE WINDOW, and where every desk came from.
      seeded: Boolean(state.carry?.ok),
      seedNote: carrySeedNote(state),
      carry: carryTeacherView(state),
      gradeBand: bandOfRoom(state),
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
            markets: marketsInRoom(Object.values(state.desks)).map((m) => ({ id: m.id, club: m.club, building: m.building, plainLine: m.plainLine, capacity: m.capacity, capacityNote: m.capacityNote })),
            message: "You are not the GM today. You run the building.",
            bills: billsBoard(state),
          };

        case "HOOK":
          return {
            mode: "hook",
            message: HOOK_COPY,
            objective: OBJECTIVE_COPY,
            deskCount: agg.deskCount,
            markets: marketsInRoom(Object.values(state.desks)).map((m) => ({ id: m.id, club: m.club, building: m.building, plainLine: m.plainLine, capacity: m.capacity, capacityNote: m.capacityNote, bill: m.bill, planPrice: m.planPrice })),
            // D59: the room's bills by desk label — class evidence, never a seat.
            bills: billsBoard(state),
            billHorizonLine: state.carry?.ok ? BILL_HORIZON_LINE : null,
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
            // W3 lane B / contract E2: the per-night CLASS RESULTS frame. Built
            // from SETTLED nights only, so nothing about the open night is on
            // the projector while it is open (R13), and null before the first
            // bell. The last bell is handled by the `allNightsDone` branch
            // above, which stays held so the staged REVEAL is still the first
            // time the room sees all five nights at once (E19).
            classResults: classResultsFor(state, agg, settledCards[settledCards.length - 1] ?? null),
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

        case "COUNTERFACTUAL": {
          // P11-b: cap what goes up at once, and let the teacher walk the room
          // through the groups. The class summary is computed over EVERY row —
          // it is the class-level statement — and rendered outside the paged
          // column so it never leaves the screen.
          const allRows = agg.repeatCard;
          const pages = cfPageCount(allRows.length);
          const page = Math.min(Math.max(0, state.cfPage ?? 0), pages - 1);
          const from = page * CF_ROWS_PER_PAGE;
          const shown = allRows.slice(from, from + CF_ROWS_PER_PAGE);
          return {
            mode: "counterfactual",
            repeatCard: shown,
            repeatRowTotal: allRows.length,
            cfPage: page + 1,
            cfPageCount: pages,
            // W3F-1: named desks, not a positional range — the group's own
            // rows, not a "from-to of total" claim the reordered card broke.
            cfPageLabel:
              allRows.length === 0
                ? "No desk has played both nights yet."
                : pages === 1
                  ? `All ${allRows.length} desk${allRows.length === 1 ? "" : "s"} that played both nights`
                  : `Group ${page + 1} of ${pages} — ${cfPageDeskNames(allRows, page)}`,
            repeatSummary: repeatSummary(allRows),
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
        }

        case "SYNTHESIS": {
          // W3: staged, not shrunk. One card owns the frame; the beyond-sports
          // line stays up on every page because it is the module's closing
          // statement (the econ gate calls it the strongest link in the chain);
          // the exit prompt and the sourcing rail land on the last page.
          const allCards = synthesisCards(state, agg);
          const pages = synthPageCount(allCards.length);
          const page = Math.min(Math.max(0, state.synthPage ?? 0), pages - 1);
          const from = page * SYNTH_CARDS_PER_PAGE;
          return {
            mode: "synthesis",
            heading: "WHAT ECONOMICS DID WE JUST USE?",
            cards: allCards.slice(from, from + SYNTH_CARDS_PER_PAGE),
            cardCount: allCards.length,
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
    // E4: the projector's left rail is frame furniture, not frame content — it
    // is on every board frame, so it is attached once, here, rather than being
    // spread into nine payloads that could drift apart.
    return tag({ ...view, rail: boardRailFor(state, agg) });
  },

  aggregate(state) {
    return computeAggregate(state);
  },
};

/* --------------------------------------------------------- teacher aids -- */

/** Longest run of identical prices — the design's "WATCH FOR" voice at ADAPT. */
/** One desk as the live-room read sees it: what it is dialling and where it came from. */
type RoomDesk = { handle: string; price: number; locked: boolean; nightsPlayed: number; ownLastPrice: number | null };

/**
 * THE ROOM — the live class read on /teach, and nowhere else.
 *
 * A teacher directing sixteen desks was being handed sixteen tiles and asked to
 * do the arithmetic in their head while a night ran. The three facts they
 * actually need out loud are the spread (how far apart is this room?), the shape
 * (is it one cluster or two camps?), and the movement (who adapted, and which
 * way?) — and all three are already sitting in state, uncomputed.
 *
 * Two disciplines this must keep:
 *
 * - It is TEACHER-PRIVATE. Nothing here may reach `boardView` while a night is
 *   open: the room committing blind is what makes the reveal land (R13), and a
 *   live histogram on the projector would end that in one press.
 * - Movement is only claimed for a desk whose previous night was its OWN
 *   decision. A bell-committed AUTO night is not a price anybody chose, so
 *   "moved off it" is not adaptation, and counting it as such would tell the
 *   room a story about desks that never decided.
 */
function roomRead(desks: readonly RoomDesk[], nightIndex: number): Record<string, unknown> | null {
  if (desks.length === 0) return null;

  // THE SPREAD IS A FACT ABOUT DECISIONS, NOT ABOUT DIALS.
  //
  // Measured over every desk, this sentence read "The room is between $16 and
  // $24, middle $20" at nought-of-six locked — which is not the room at all,
  // it is the two season plan prices the dials open on. A teacher reading that
  // out has told the class a spread that nobody chose. Committed decisions
  // only; where the undecided dials are sitting stays visible as the ghosted
  // half of each bar, which is a position and is drawn as one.
  const committed = desks.filter((d) => d.locked);
  const prices = committed.map((d) => d.price).sort((a, b) => a - b);
  const min = prices.length > 0 ? prices[0]! : null;
  const max = prices.length > 0 ? prices[prices.length - 1]! : null;
  const mid = prices.length === 0
    ? null
    : prices.length % 2 === 1
      ? prices[(prices.length - 1) / 2]!
      : Math.round((prices[prices.length / 2 - 1]! + prices[prices.length / 2]!) / 2);

  // The histogram still bins EVERY desk — the teacher needs to see where the
  // undecided dials are sitting — so its grid is set by the whole room.
  const allPrices = desks.map((d) => d.price).sort((a, b) => a - b);
  const binMin = allPrices[0]!;
  const binMax = allPrices[allPrices.length - 1]!;

  // Bin width on the dial's own grid, so a bar edge is always a price a desk
  // could actually have chosen. Capped at a dozen bars: past that a histogram
  // stops being a shape and becomes a comb.
  const span = Math.max(PRICE_STEP, binMax - binMin);
  const width = Math.max(PRICE_STEP, Math.ceil(span / 12 / PRICE_STEP) * PRICE_STEP);
  const start = binMin - ((binMin - PRICE_MIN) % width);
  const bins: { from: number; to: number; label: string; count: number; lockedCount: number; handles: string[] }[] = [];
  for (let from = start; from <= binMax; from += width) {
    const to = from + width - PRICE_STEP;
    const inBin = desks.filter((d) => d.price >= from && d.price <= to);
    bins.push({
      from,
      to,
      label: width === PRICE_STEP ? `$${from}` : `$${from}\u2013${to}`,
      count: inBin.length,
      // Split so the teacher can see decisions and dials apart at a glance: a
      // desk that has not locked is sitting wherever its dial opened, which is
      // a position, not a choice.
      lockedCount: inBin.filter((d) => d.locked).length,
      handles: inBin.map((d) => d.handle),
    });
  }

  // MOVEMENT IS COUNTED OVER COMMITTED DECISIONS ONLY.
  //
  // The obvious version — compare every desk's current dial to its last night —
  // reports moves nobody made. The dial reopens each night at the desk's season
  // plan price, so a pair who has not touched anything yet appears to have cut
  // their price, and a console that says "3 lowered" when two desks lowered is
  // worse than one that says nothing. A lock is the only thing in this lesson
  // that means "we decided".
  let raised = 0;
  let held = 0;
  let lowered = 0;
  let noOwnPrior = 0;
  let noPrior = 0;
  let deciding = 0;
  for (const d of desks) {
    if (!d.locked) {
      deciding += 1;
    } else if (d.nightsPlayed === 0) {
      // Night one. There is nothing behind this desk to have moved off, which
      // is a fact about the night, not about the desk.
      noPrior += 1;
    } else if (d.ownLastPrice === null) {
      // Locked, but the night it is being compared to was not its own decision
      // (the bell auto-committed it, or the desk manager covered it before this
      // pair joined). Moving off a number you never chose is not adaptation.
      noOwnPrior += 1;
    } else if (d.price > d.ownLastPrice) {
      raised += 1;
    } else if (d.price < d.ownLastPrice) {
      lowered += 1;
    } else {
      held += 1;
    }
  }
  const moved = raised + held + lowered;
  const inSoFar = moved + noOwnPrior + noPrior;

  return {
    deskCount: desks.length,
    lockedCount: desks.filter((d) => d.locked).length,
    decidingCount: deciding,
    // The panel's own heading. Authored here rather than in the renderer so a
    // lesson whose desks do not "lock" can say what its desks actually do.
    countLine: `${desks.filter((d) => d.locked).length} of ${desks.length} locked in \u00b7 night ${nightIndex + 1} of ${NIGHT_COUNT}`,
    spread: min === null || max === null || mid === null ? null : { min, max, median: mid, range: max - min },
    bins,
    movement: { raised, held, lowered, basis: moved, noOwnPrior, noPrior, deciding },
    firstNight: noPrior > 0 && moved === 0 && noOwnPrior === 0,
    // The sentence a teacher can say without doing arithmetic on a projector.
    movementLine:
      inSoFar === 0
        ? "Nobody is in yet — movement shows up as desks lock."
        : noPrior === inSoFar
          ? "First night — there is nothing behind these desks to have moved off yet."
          : moved === 0
            ? "Nobody in so far has a night of their own to have moved off."
            : `Of the ${inSoFar} in so far: ${raised} raised, ${held} held, ${lowered} lowered${
                noOwnPrior > 0 ? ` \u00b7 ${noOwnPrior} moving off a night the bell committed for them` : ""
              }${noPrior > 0 ? ` \u00b7 ${noPrior} on their first night` : ""}.`,
    spreadLine:
      min === null || max === null
        ? "Nothing is committed yet \u2014 every dial is still sitting where the night opened."
        : prices.length === 1
          ? `One desk is in, at $${min}.`
          : min === max
            ? `${prices.length === desks.length ? "Every desk is in" : `All ${prices.length} in so far are`} on $${min}.`
            : prices.length === desks.length
              ? `The room is between $${min} and $${max}, middle $${mid}.`
              : `The ${prices.length} in so far are between $${min} and $${max}, middle $${mid}.`,
    // The guard that keeps this panel from destroying the thing it serves.
    privacyNote: "Yours only \u2014 the projector never shows this while the night is open. Reading it out before the bell tells the room what to copy.",
  };
}

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

/**
 * `gate-l2-teacher` B5 (BLOCKING) — the same repair the sibling module already
 * carries, missing here. The /teach landing page tells a first-time teacher to
 * open an empty session and press Advance through every phase, and promises the
 * whole period is rehearsable that way. It was not: with zero desks WATCH FOR
 * rendered nothing at all, because every flag is computed off live desks. A
 * teacher who rehearsed exactly as instructed met the room's only diagnostic
 * panel for the first time in front of a class.
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
      ["Desk 1 · New York Knicks", "Desk 2 · Memphis Grizzlies"],
      "With a real class this panel is computed live and names your actual desks. You are seeing the shapes now so none of them is new to you in front of the room.",
      "now",
    ),
  ];
  if (phase === "PLAY") {
    flags.push(
      sample(
        "3 of 8 desks have not locked tonight",
        ["Desk 4 · Memphis Grizzlies", "Desk 6 · New York Knicks", "Desk 7 · Memphis Grizzlies"],
        "Ring the bell when you are ready — an unlocked desk settles at its own season-plan price and is marked AUTO on its own screen. Nobody is skipped and nobody gets a zero.",
        "now",
      ),
      sample(
        "Held the same price 3+ nights",
        ["Desk 3 · New York Knicks"],
        "Call on this desk when you reach the ADAPT questions — a desk that never moved the dial is the clearest contrast in the room.",
        "later",
      ),
      sample(
        "Paid to open more of the building on Night 4",
        ["Desk 5 · New York Knicks", "Desk 8 · Memphis Grizzlies"],
        "Keep this for the Night 4 reveal. Opening seats never beat pricing the night right — it only ever refunds part of a price that was already too low.",
        "later",
      ),
    );
  }
  if (phase === "REVEAL" || phase === "ADAPT" || phase === "COUNTERFACTUAL" || phase === "SYNTHESIS") {
    flags.push(
      sample(
        "Turned away 500+ fans on some night",
        ["Desk 5 · New York Knicks", "Desk 2 · Memphis Grizzlies"],
        "Ask what on the card should have told them, before you say anything about the answer.",
        "later",
      ),
      sample(
        "In the red — their night-spend dial is locked at $0 until the books clear",
        ["Desk 7 · Memphis Grizzlies"],
        "This is recoverable and usually recovers on its own; one good night clears it. Say so if the pair looks sunk.",
        "now",
      ),
    );
  }
  return flags;
}

function teacherWatchFor(state: FullHouseState, phase: CanonicalPhase): WatchFlag[] {
  const out: WatchFlag[] = [];
  const desks = Object.values(state.desks);
  const windowOpen = phase === "PLAY" && state.nightIndex < NIGHT_COUNT;

  // A pair standing in the room with a device that cannot join the lesson is
  // the teacher's problem to solve in the next ten seconds, so it goes first.
  const observers = observersOf(state);
  if (observers.length > 0) {
    out.push({
      id: "late-observers",
      label: `${observers.length} pair${observers.length === 1 ? "" : "s"} arrived after the last night closed and could not be given a desk`,
      desks: observers.map((_, i) => `Late pair ${i + 1}`),
      action:
        "There is no desk left to hand them \u2014 the nights are in the books and seating them now would change numbers this room has already been shown. Their screen says so and tells them to pull up to the nearest desk; say the same out loud and pair them with a desk near the door. Everything from here \u2014 the board, the argument, the synthesis \u2014 is the whole room's, so they lose nothing but the five nights.",
      urgency: "now",
    });
  }

  // Comes after the doorway flag and before everything else: a pair standing in
  // the room outranks a rehearsal, and a rehearsal session has no desks at all.
  if (desks.length === 0) return [...out, ...rehearsalWatchFor(phase)];

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
          `Up to ${CF_ROWS_PER_PAGE} desks at a time — their two crowds on the same card, their renewals either side, and each one's own split.`,
          "Beside them: the class chart, and the class summary, which stays on screen for every group.",
          `Prompt on screen: "${ARGUE_PROMPT}"`,
          "This board names desks publicly, worst line included.",
        ],
      };
    case "SYNTHESIS":
      return {
        title: "WHAT ECONOMICS DID WE JUST USE?",
        lines: [
          "ONE card at a time, in the order you press them: REVENUE = PRICE x PEOPLE · THE CARD MOVED THE CROWD · THE TICKET IS NOT THE PRODUCT · NIGHT 5 WAS NIGHT 1 · TWO BOOKS, NO EXCHANGE RATE · YOUR JOB IS REAL. Every number on them is computed from this class's own nights.",
          "The outside-sports line is under every card. The exit question and the dated sources land on the last one.",
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
          "Tell the room to write their 4-digit rejoin PIN somewhere that is not the screen showing it — the back of a hand, a corner of a notebook. If a Chromebook dies, that PIN puts the pair straight back in their own desk. If they lost it, press Reseat beside their name and read them a new one.",
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
        // R4: this answer named renewals as THE cause. Two carried channels feed
        // Night 5, and the board now prints each desk's split, so the answer
        // points at that split instead of asserting one of them.
        ask: [
          {
            q: "Same night, same visitor. Why did more people come the second time?",
            answer:
              "Two things carried over, and the board prints both for each desk. Their own renewals: a desk that kept its season-ticket holders walked into Night 5 with a bigger base. And event money spent on Night 4: that lands on the NEXT night, and Night 5 is the next night. Read the desk's own line before you name a cause — for a desk that spent big on Night 4 the money is usually the bigger half.",
          },
        ],
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
              "Two things they did on earlier nights, and the Night 1 vs Night 5 board splits them per desk. RENEWALS: four nights of their own pricing moved their season-ticket base, and that base is who shows up — price well under your own plan price and the plan looks like a waste; price above what the night is worth to a plan holder and they quit. EVENT MONEY: whatever they put into Night 4 lands on Night 5. Take the desk's own numbers off the board rather than naming one of them yourself.",
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
          "Every desk is looking at its own season next to three other lines: never moving the dial, the best renewals book the model could find, and the most cash it could find.",
          "Expect a student to say \"so doing nothing was better\". Doing nothing is NOT the price of keeping your plan holders — the renewals line beats it on both books at once. Put that to the room; it is the whole lesson arriving early.",
          `The repeat card underneath goes up ${CF_ROWS_PER_PAGE} desks at a time — press the group button and walk the room through them so every row is readable from the back.`,
          "This board ranks desks in public, including the worst one. Frame it before you show it: this is a room full of people who priced blind, and the interesting desks are the surprising ones, not the winning ones.",
        ],
        ask: [
          {
            q: "Which line kept the most season-ticket holders, and what did it give up?",
            answer:
              "The renewals line — and it is not the do-nothing line, which is beaten on both books. Compare the renewals line with the most-cash line: the points between them are real money, and they get dearer the higher you go. The first few are cheap; the last one is brutal. Nothing in the game converts a renewal into a dollar, which is what \"no exchange rate\" means.",
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
          "The cards come up ONE at a time — press \u2018Next card\u2019 when you have said this one. Short of time? The first three are the lesson.",
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

export function repeatSummary(rows: readonly RepeatRow[]): string {
  const same = rows.filter((r) => r.samePrice);
  if (same.length === 0) {
    return rows.length === 0
      ? "No desk has played both Night 1 and Night 5 yet."
      : `${rows.length} desk${rows.length === 1 ? "" : "s"} played the same card twice. Nobody charged the same price both times — so compare the crowds against the renewals each desk carried in.`;
  }
  const up = same.filter((r) => r.n5Turnout > r.n1Turnout).length;
  const down = same.filter((r) => r.n5Turnout < r.n1Turnout).length;
  // R4: "the only thing that changed was five nights of their own choices" is
  // true, but the room was left to assume WHICH choice. Name the channels by
  // how many desks each one led, computed from the rows themselves.
  // gate-l1-econ-r3 R6: a floored desk (nobody wanted in at its price) has no
  // readable channel, so it is counted separately and never inside a "moved most
  // by" claim — the old line could say "3 were moved most by their own renewals"
  // about desks whose crowd was 0 on both nights.
  const readable = same.filter((r) => !r.floored);
  // W3-R10: `floored` is an OR over the two nights. Counting a one-sided desk as
  // "nobody came either night" printed a sentence the row's own crowd number
  // refutes, in the band ($82-$84 New York, $58 Memphis) a pair reaches by
  // trying "higher price, more money".
  const flooredRows = same.filter((r) => r.floored);
  const both = flooredRows.filter((r) => r.bothFloored).length;
  const oneSided = flooredRows.length - both;
  const floored = flooredRows.length;
  const byRenewals = readable.filter((r) => r.biggestChannel === "renewals").length;
  const bySpend = readable.filter((r) => r.biggestChannel === "spend").length;
  const noneReadable =
    both > 0 && oneSided > 0
      ? `On ${both === 1 ? "one of them" : `${both} of them`} nobody came on either night, and on ${oneSided === 1 ? "the other" : `the other ${oneSided}`} the crowd ran out before the door on one of the two nights. Either way a crowd that hit zero cannot show what moved underneath it.`
      : oneSided > 0
        ? `On ${oneSided === 1 ? "it" : "every one of them"} the price was above what anybody in this model would pay on ONE of the two nights, so that night's crowd was 0 — and a crowd of nobody cannot show what moved underneath it.`
        : "On every one of them the price was above what anybody in this model would pay, so nobody came either night — and a crowd of nobody cannot show what moved underneath it.";
  const led =
    readable.length === 0
      ? noneReadable
      : bySpend === 0
        ? `For every one of the ${readable.length} that drew a crowd, the biggest carried-over thing was their own renewals.`
        : byRenewals === 0
          ? `For every one of the ${readable.length} that drew a crowd, the biggest carried-over thing was the event money they spent on Night 4, which lands on the next night.`
          : `${byRenewals} were moved most by their own renewals, ${bySpend} by the event money they spent on Night 4 — it lands on the next night, and this is the next night.`;
  // W3-R10, third site: this said "priced high enough that nobody wanted in at
  // all" about a desk that drew 670 people on Night 1.
  const flooredLine =
    floored > 0 && readable.length > 0
      ? ` ${
          oneSided > 0 && both > 0
            ? `${both} priced high enough that nobody wanted in on either night and ${oneSided} on one of the two nights`
            : oneSided > 0
              ? `${oneSided} priced high enough that on one of the two nights nobody wanted in at all`
              : `${both} priced high enough that nobody wanted in at all`
        }, so ${floored === 1 ? "its" : "their"} crowd cannot show what changed underneath it.`
      : "";
  return `${same.length} desk${same.length === 1 ? "" : "s"} charged the SAME price on Night 1 and Night 5. ${up} drew a bigger crowd the second time, ${down} drew a smaller one. Same day, same visitor, same price — everything that changed, they did on an earlier night. ${led}${flooredLine}`;
}

/* ------------------------------------------------------------ synthesis -- */

/* -- W3 Lane S · ruling R-5 · contract §D2/§E6: computed synthesis visuals --
 *
 * R-5 requires the module's two most important pictures to be COMPUTED, not
 * asserted in prose: the demand visual is the class's realized dots for one
 * market on one card (never a fitted curve), and the tradeoffs visual is a
 * two-axis frontier read off `seasonFrontier` / `renewalMarginalCost` in the two
 * books' own units (never a balance scale, never a percent as a hero figure).
 *
 * `visual` is ADDITIVE and OPTIONAL. The six cards, their order, their staging
 * and their bodies are unchanged (E27). The payload carries DATA and the
 * captions the data supports — never a rendered string a client invented, never
 * a picture. Every figure a caption prints is also a field on the payload, so a
 * DOM audit can prove no surface printed a number this module did not compute.
 */
export type SynthesisDot = { readonly price: number; readonly turnout: number; readonly soldOut: boolean };

/** One market's frontier panel, in the two books' own units: dollars and renewal points. */
export type FrontierPanel = {
  readonly marketId: MarketId;
  readonly club: string;
  /** The model's own undominated seasons, renewals ASCENDING. Not a fit, not a smoothing. */
  readonly line: readonly { readonly renewals: number; readonly cash: number }[];
  /**
   * Where the room's desks finished. ANONYMOUS on purpose: E16 keeps per-desk
   * money off the projector, so a dot carries no handle, no crest and no title.
   * Only desks that played every night are plotted — a desk that joined late has
   * fewer nights of cash and would read as a bad decision instead of a short season.
   */
  readonly deskDots: readonly { readonly renewals: number; readonly cash: number }[];
  readonly deskDotCount: number;
  readonly partialDeskCount: number;
  readonly desksOnLine: number;
  readonly cashBestRenewals: number;
  readonly cashBestCash: number;
  readonly cornerRenewals: number;
  readonly cornerCash: number;
  readonly gapDollars: number;
  readonly gapPoints: number;
  readonly gapFans: number;
  readonly fansPerPoint: number;
  /** The bend, computed: the renewals level where half the line's money has been given up. */
  readonly kneeRenewals: number;
  readonly cheapPoints: number;
  readonly cheapCost: number;
  readonly cheapPerPoint: number;
  readonly dearPoints: number;
  readonly dearCost: number;
  readonly dearPerPoint: number;
  /** Axis bounds for the room view (dots inside the line) and for the close-up of the line alone. */
  readonly cashAxisMin: number;
  readonly cashAxisMax: number;
  readonly lineAxisMin: number;
  readonly lineAxisMax: number;
  readonly renewalsAxisMin: number;
  readonly renewalsAxisMax: number;
  readonly gapCaption: string;
  readonly bendCaption: string;
  readonly roomCaption: string;
  /** Present only on a student device, for that pair's own desk (never on /board). */
  readonly ownDot?: {
    readonly renewals: number;
    readonly cash: number;
    readonly ceilingCash: number;
    readonly gapToLine: number;
    readonly nightsPlayed: number;
    readonly nightCount: number;
  };
  readonly ownCaption?: string;
};

export type SynthesisVisual =
  | {
      readonly kind: "dots";
      readonly marketId: MarketId;
      readonly club: string;
      readonly cardId: string;
      readonly cardLabel: string;
      readonly day: string;
      readonly draw: number;
      readonly tv: string;
      /** Realized nights only. A night nobody played has no mark. */
      readonly dots: readonly SynthesisDot[];
      readonly deskCount: number;
      readonly comparable: boolean;
      readonly lowPrice: number;
      readonly lowTurnout: number;
      readonly highPrice: number;
      readonly highTurnout: number;
      readonly priceAxisMin: number;
      readonly priceAxisMax: number;
      readonly turnoutAxisMax: number;
      readonly caption: string;
    }
  | {
      readonly kind: "frontier";
      readonly fansPerPoint: number;
      readonly markets: readonly FrontierPanel[];
      readonly axisCaption: string;
    }
  | {
      readonly kind: "shifters";
      readonly marketId: MarketId;
      readonly club: string;
      /** People one renewal point is worth on the base of every night's crowd, so the carried chip's figure is traceable. */
      readonly fansPerPoint: number;
      readonly tonightLabel: string;
      readonly carriedLabel: string;
      readonly nights: readonly {
        readonly cardId: string;
        readonly cardLabel: string;
        readonly day: string;
        readonly draw: number;
        readonly tv: string;
        readonly price: number;
        readonly turnout: number;
      }[];
      readonly tonight: readonly { readonly key: string; readonly a: string; readonly b: string }[];
      readonly carried: readonly { readonly key: string; readonly note: string }[];
      readonly samePrice: boolean;
      readonly caption: string;
    };

export type SynthesisCard = { id: string; title: string; body: string; visual?: SynthesisVisual };

/** How a TV listing is printed on every M2 surface. One spelling, one place. */
function tvLabelFor(card: NightCard): string {
  return card.tv === "national" ? "national TV" : card.tv === "local" ? "local TV" : "not on TV";
}

/* ------------------------------- W3 Lane S: the three computed visuals -- */

/**
 * The demand visual (R-5): the class's realized dots for ONE market on ONE
 * card. Never a fitted curve, never a mark for a night nobody played, never two
 * different nights in one picture — five nights are five demand worlds and a
 * line through them is a false picture (E3 / gate-l1-play P1).
 */
function dotsVisualFor(agg: FullHouseAggregate): SynthesisVisual | undefined {
  const { best, widest } = revenueGroups(agg);
  const group = best ?? widest;
  if (!group || group.points.length === 0) return undefined;
  const card = CARD_BY_ID.get(group.cardId);
  const market = MARKET_BY_ID.get(group.marketId);
  if (!card || !market) return undefined;
  const comparable = best !== null && group === best;
  const dots = group.points
    .map((p) => ({ price: p.price, turnout: p.turnout, soldOut: p.soldOut }))
    .sort((a, b) => a.price - b.price);
  const turnoutAxisMax = Math.max(1000, ...dots.map((d) => d.turnout));
  const caption = comparable
    ? `${card.label} · ${market.club}. ${dots.length} desk${dots.length === 1 ? "" : "s"} played this night in this building. $${group.low.price} drew ${group.low.turnout.toLocaleString()}. $${group.high.price} drew ${group.high.turnout.toLocaleString()}. One dot per desk-night. Nothing joins them: the dots are what the room did, not a line anybody drew.`
    : `${card.label} · ${market.club}. ${dots.length} desk${dots.length === 1 ? "" : "s"} played this night in this building. No two of them priced far enough apart to read a demand curve off, so these are the room's dots and nothing more. One dot per desk-night, nothing joining them.`;
  return {
    kind: "dots",
    marketId: group.marketId,
    club: market.club,
    cardId: group.cardId,
    cardLabel: card.label,
    day: card.day,
    draw: card.draw,
    tv: tvLabelFor(card),
    dots,
    deskCount: dots.length,
    comparable,
    lowPrice: group.low.price,
    lowTurnout: group.low.turnout,
    highPrice: group.high.price,
    highTurnout: group.high.turnout,
    priceAxisMin: PRICE_MIN,
    priceAxisMax: PRICE_MAX,
    turnoutAxisMax,
    caption,
  };
}

/**
 * The demand-shifter chips (R-5): DAY / DRAW / TV are what tonight's card
 * printed; RENEWALS and LAST NIGHT'S EVENT MONEY are CARRIED and live in their
 * own labelled group, because they are not facts about tonight — they are the
 * pair's own earlier choices arriving late. "Weather" is not one of the four
 * reference chips and does not exist in this model, so it is not drawn and not
 * named.
 */
function shiftersVisualFor(agg: FullHouseAggregate): SynthesisVisual | undefined {
  const picked = shifterPick(agg);
  if (!picked) return undefined;
  const cardA = CARD_BY_ID.get(picked.a.cardId);
  const cardB = CARD_BY_ID.get(picked.b.cardId);
  if (!cardA || !cardB) return undefined;
  const m = picked.market;
  const caption = picked.samePrice
    ? `${m.club}: the same $${picked.a.price}, two different crowds — ${picked.a.turnout.toLocaleString()} and ${picked.b.turnout.toLocaleString()}. The three chips on the left were printed on the card before anybody locked. The two on the right are the desk's own earlier nights arriving late. Nothing else moves the crowd — there is no luck in this model.`
    : `${m.club}: ${picked.a.turnout.toLocaleString()} came at $${picked.a.price}, ${picked.b.turnout.toLocaleString()} at $${picked.b.price}. Two different prices, so part of that gap is the price and this pair does not prove the card on its own. The three chips on the left were printed on the card before anybody locked; the two on the right are the desk's own earlier nights arriving late.`;
  return {
    kind: "shifters",
    marketId: m.id,
    club: m.club,
    fansPerPoint: m.renewalFans,
    tonightLabel: "PRINTED ON TONIGHT'S CARD",
    carriedLabel: "CARRIED IN FROM YOUR OWN EARLIER NIGHTS",
    nights: [
      { cardId: cardA.id, cardLabel: cardA.label, day: cardA.day, draw: cardA.draw, tv: tvLabelFor(cardA), price: picked.a.price, turnout: picked.a.turnout },
      { cardId: cardB.id, cardLabel: cardB.label, day: cardB.day, draw: cardB.draw, tv: tvLabelFor(cardB), price: picked.b.price, turnout: picked.b.turnout },
    ],
    tonight: [
      { key: "DAY", a: cardA.day, b: cardB.day },
      { key: "DRAW", a: `${cardA.draw} / 100`, b: `${cardB.draw} / 100` },
      { key: "TV", a: tvLabelFor(cardA), b: tvLabelFor(cardB) },
    ],
    carried: [
      { key: "RENEWALS", note: `Your own, from earlier nights. One point is ${m.renewalFans} people on the base of every night's crowd.` },
      { key: "LAST NIGHT'S EVENT MONEY", note: "Money spent on a night never changes that night's crowd. It lands on the next one." },
    ],
    samePrice: picked.samePrice,
    caption,
  };
}

/**
 * The tradeoffs visual (R-5): a two-axis frontier, both axes in the two books'
 * own units — dollars up, renewal points across — drawn from `seasonFrontier`'s
 * own undominated seasons. Never a balance scale, never a percent as a hero
 * figure, never a caption asserting how big the trade-off is.
 *
 * The bend is computed rather than asserted: walking the line UP from its cash
 * corner, `kneeRenewals` is the renewals level at which HALF the money the whole
 * line costs has been given up. Below it the points are cheap, above it they are
 * ruinous — rising opportunity cost, which is the only reading this model
 * supports. (A "first step above the average price per point" rule was written
 * and thrown away: the line is not monotone in per-point cost — Memphis has a
 * $4,380 step at 79 renewals — and that rule put the bend 14 points apart in two
 * markets whose shape is the same.)
 *
 * `deskDots` are anonymous: E16 keeps per-desk money off the projector, so a dot
 * carries no handle and no title, and only desks that played all five nights are
 * plotted (a late joiner's short season is not a bad decision).
 */
function frontierPanelFor(market: Market, desks: readonly Desk[]): FrontierPanel {
  const asc = [...seasonFrontier(market)].reverse(); // renewals ascending, cash falling
  const cashBest = asc[0]!;
  const corner = asc[asc.length - 1]!;
  const gapDollars = cashBest.cash - corner.cash;
  const gapPoints = corner.renewals - cashBest.renewals;
  const half = gapDollars / 2;
  let given = 0;
  let kneeIndex = asc.length - 1;
  for (let i = 0; i + 1 < asc.length; i += 1) {
    given += asc[i]!.cash - asc[i + 1]!.cash;
    if (given >= half) {
      kneeIndex = i + 1;
      break;
    }
  }
  const knee = asc[kneeIndex]!;
  const cheapPoints = knee.renewals - cashBest.renewals;
  const cheapCost = cashBest.cash - knee.cash;
  const dearPoints = corner.renewals - knee.renewals;
  const dearCost = knee.cash - corner.cash;
  const ceilingAt = (r: number): number => asc.find((p) => p.renewals >= r)?.cash ?? cashBest.cash;

  const own = desks.filter((d) => d.marketId === market.id);
  const full = own.filter((d) => d.nights.length >= NIGHT_COUNT);
  const deskDots = full.map((d) => ({ renewals: d.renewals, cash: d.cash }));
  const desksOnLine = deskDots.filter((d) => d.cash >= ceilingAt(d.renewals)).length;
  const fansPerPoint = market.renewalFans;
  const gapFans = gapPoints * fansPerPoint;

  const cashAxisMin = Math.min(corner.cash, ...deskDots.map((d) => d.cash), 0);
  const cashAxisMax = Math.max(cashBest.cash, ...deskDots.map((d) => d.cash));
  const renewalsAxisMin = Math.max(0, Math.min(cashBest.renewals, ...deskDots.map((d) => d.renewals)) - 5);
  const renewalsAxisMax = 100;

  const gapCaption = `${market.club}: the whole line is ${gapPoints} renewal points wide and $${gapDollars.toLocaleString()} deep — from $${cashBest.cash.toLocaleString()} at ${cashBest.renewals} renewals to $${corner.cash.toLocaleString()} at ${corner.renewals}. ${gapPoints} renewal points is ${gapFans.toLocaleString()} people on the base of every night's crowd, at ${fansPerPoint} people a point.`;
  const bendCaption = `The points are not all the same price. The first ${cheapPoints} cost $${cheapCost.toLocaleString()} — about $${cheapPerPointOf(cheapCost, cheapPoints).toLocaleString()} each. The last ${dearPoints} cost $${dearCost.toLocaleString()} — about $${cheapPerPointOf(dearCost, dearPoints).toLocaleString()} each.`;
  const roomCaption =
    deskDots.length === 0
      ? `No desk in ${market.club} has a full five nights in the books yet, so nothing of the room's own is on this picture.`
      : desksOnLine === 0
        ? `${deskDots.length} desk${deskDots.length === 1 ? "" : "s"} played all five nights in ${market.club}. None of them finished on the line. The line is the ceiling of this room, not a wall down the middle of it.`
        : `${deskDots.length} desk${deskDots.length === 1 ? "" : "s"} played all five nights in ${market.club}. ${desksOnLine} finished on the line — nothing in this model beats that season on both books at once.`;

  return {
    marketId: market.id,
    club: market.club,
    line: asc.map((p) => ({ renewals: p.renewals, cash: p.cash })),
    deskDots,
    deskDotCount: deskDots.length,
    partialDeskCount: own.length - full.length,
    desksOnLine,
    cashBestRenewals: cashBest.renewals,
    cashBestCash: cashBest.cash,
    cornerRenewals: corner.renewals,
    cornerCash: corner.cash,
    gapDollars,
    gapPoints,
    gapFans,
    fansPerPoint,
    kneeRenewals: knee.renewals,
    cheapPoints,
    cheapCost,
    cheapPerPoint: cheapPerPointOf(cheapCost, cheapPoints),
    dearPoints,
    dearCost,
    dearPerPoint: cheapPerPointOf(dearCost, dearPoints),
    cashAxisMin,
    cashAxisMax,
    lineAxisMin: corner.cash,
    lineAxisMax: cashBest.cash,
    renewalsAxisMin,
    renewalsAxisMax,
    gapCaption,
    bendCaption,
    roomCaption,
  };
}

function cheapPerPointOf(cost: number, points: number): number {
  return points > 0 ? Math.round(cost / points) : 0;
}

function frontierVisualFor(state: FullHouseState): SynthesisVisual {
  const desks = Object.values(state.desks);
  return {
    kind: "frontier",
    fansPerPoint: MARKETS[0]!.renewalFans,
    markets: MARKETS.map((m) => frontierPanelFor(m, desks)),
    axisCaption: "Across: renewal points the season ends on. Up: cash the season ends on. Two units, two axes — there is no exchange rate between them, which is why they are not added.",
  };
}

/**
 * The /play mirror of the frontier (R-5, contract §D2/§D3): the pair's OWN dot
 * and their own market only. Nothing about another desk crosses to a student
 * device, and the board's anonymous room dots are dropped rather than mirrored.
 */
export function frontierVisualForDesk(visual: SynthesisVisual | undefined, desk: Desk): SynthesisVisual | undefined {
  if (!visual || visual.kind !== "frontier") return visual;
  const panel = visual.markets.find((p) => p.marketId === desk.marketId);
  if (!panel) return undefined;
  const asc = panel.line;
  const ceilingCash = asc.find((p) => p.renewals >= desk.renewals)?.cash ?? panel.cashBestCash;
  const gapToLine = ceilingCash - desk.cash;
  const own = { renewals: desk.renewals, cash: desk.cash, ceilingCash, gapToLine, nightsPlayed: desk.nights.length, nightCount: NIGHT_COUNT };
  const ownCaption =
    desk.nights.length < NIGHT_COUNT
      ? `Your desk has ${desk.nights.length} of ${NIGHT_COUNT} nights in the books, so your dot is a short season — it is not on the same footing as the line.`
      : gapToLine <= 0
        ? `Your desk finished at $${desk.cash.toLocaleString()} and ${desk.renewals} renewals — on the line. Nothing in this model beats that season on both books at once.`
        : `Your desk finished at $${desk.cash.toLocaleString()} and ${desk.renewals} renewals. The best season this model can find that keeps ${desk.renewals} renewals makes $${ceilingCash.toLocaleString()} — $${gapToLine.toLocaleString()} above your dot.`;
  return {
    ...visual,
    markets: [{ ...panel, deskDots: [], deskDotCount: 0, ownDot: own, ownCaption }],
  };
}

/**
 * The season-long half of TWO BOOKS, NO EXCHANGE RATE. It is read off the
 * model's own exact frontier for one market and depends on nothing the class
 * played, which is why the rehearsal deck can print it verbatim: it is the one
 * sentence on that card that is already true before a single desk joins.
 */
function seasonTradeoffLine(): string {
  const market = MARKETS[0]!;
  const strong = bestFoundSeason(market);
  const corner = renewalsCornerSeason(market);
  const marginal = renewalMarginalCost(market);
  const gap = corner.renewals - strong.renewals;
  if (gap <= 0) {
    return "On this model, over five nights, the two books did not pull against each other as hard as they do night by night — the choice is sharpest inside one night.";
  }
  const perPoint = Math.round((strong.cash - corner.cash) / gap);
  return `Over the whole five nights at the ${market.club}: the most cash we could find was $${strong.cash.toLocaleString()}, ending at ${strong.renewals}% renewals. The most season-ticket holders we could find was ${corner.renewals}%, and the best that line could make was $${corner.cash.toLocaleString()}. So ${gap} renewal points cost $${(strong.cash - corner.cash).toLocaleString()} — about $${perPoint.toLocaleString()} a point on average. But they do not cost the same: the cheapest points go for about $${marginal.cheapest.toLocaleString()} each and the last one costs $${marginal.dearest.toLocaleString()}. That rising price is what a real season-ticket book feels like — and it is still not an exchange rate, because a renewal is not a dollar.`;
}

/**
 * Every card is computed from THIS class's locked-at-time numbers (D15) —
 * never scripted, never recomputed against a curve the room did not play.
 */
export function synthesisCards(state: FullHouseState, agg: FullHouseAggregate): SynthesisCard[] {
  const cards: SynthesisCard[] = [];
  // `gate-l2-teacher` B5 (BLOCKING), the L1 regression. The rehearsal this
  // product prescribes runs with zero desks, and this deck collapsed to ONE
  // placeholder card. A teacher who rehearsed exactly as instructed then met
  // six unseen cards in the last seven minutes of a real period — the phase
  // where the economics is finally named out loud and the teacher is doing the
  // most talking. These are the six real card TEMPLATES with stand-in figures,
  // every one marked REHEARSAL in the title so no live room could ever read
  // them as its own arithmetic.
  if (agg.curves.length === 0) {
    const stand = (id: string, title: string, body: string): SynthesisCard => ({
      id: `rehearsal-${id}`,
      title: `REHEARSAL — ${title}`,
      body: `${body}\n\nEvery figure above is a STAND-IN. With a real class this card is computed from your room's own five nights and names your own desks.`,
    });
    return [
      stand(
        "revenue",
        "REVENUE = PRICE × PEOPLE",
        "Night 2 at the Memphis Grizzlies, the same Saturday card for every desk in that market. One desk charged $34 and 14,904 people came — $506,736. Another charged $58 and 9,120 came — $528,960. The higher price took more money that night. Night 3 in the same building, the desk that charged $71 took $1,015,300 and the desk that charged $92 took $846,400: there the higher price took LESS. The number on the dial is not the revenue. Price times people is.",
      ),
      stand(
        "shifters",
        "THE CARD MOVED THE CROWD",
        "The best price this room found on the quiet Tuesday card was $31. On the Saturday card, in the same building, with the same dial, it was $49. Nothing about the arena changed. What changed was the night: the day of the week, who was visiting, and whether it was on TV. The card moves the whole crowd, and the best price moves with it.",
      ),
      stand(
        "loss-leader",
        "THE TICKET IS NOT THE PRODUCT",
        "On Night 3 in New York, tickets alone made the most money at $84. Add what those same people spent inside the building and the best price drops to $66 — $18 lower, 6 clicks of the dial. The cheaper ticket made more money, because a cheaper ticket brings more people and every one of them buys something. Stores call that a loss leader.",
      ),
      stand(
        "path-dependence",
        "NIGHT 5 WAS NIGHT 1",
        "Night 5 was Night 1's card again — the same Tuesday, the same visiting club, no TV. 6 desks charged the exact same price both nights. Every one of them drew a different crowd the second time. The desks that had filled their building over the middle three nights drew MORE on Night 5 than they did on Night 1; the desks that had priced people out drew fewer. Nothing on the card changed. What changed was what those five nights had already done to the building's habit of showing up.",
      ),
      stand(
        "two-books",
        "TWO BOOKS, NO EXCHANGE RATE",
        `Best full house each market managed: New York Knicks 99% · Memphis Grizzlies 100%. Median renewals: New York Knicks 61% · Memphis Grizzlies 58%. You cannot add a dollar to a renewal, and no price is best on both. ${seasonTradeoffLine()}`,
      ),
      // The one card with no stand-in figures in it at all: it is the same
      // sentence in a rehearsal and in a live room, because it is about the
      // world rather than about this class.
      { id: "rehearsal-real-world", title: "REHEARSAL — YOUR JOB IS REAL", body: DYNAMIC_PRICING_COPY },
    ];
  }

  // W3 Lane S / R-5: `visual` is additive. Title, order and body are untouched (E27).
  cards.push({ id: "revenue", title: "REVENUE = PRICE × PEOPLE", body: revenueCardBody(agg), visual: dotsVisualFor(agg) });

  // Demand shifters: the same market, two cards, two different best prices —
  // read off the room's own curve, not asserted.
  const shifterBody = shifterCardBody(agg);
  cards.push({ id: "shifters", title: "THE CARD MOVED THE CROWD", body: shifterBody, visual: shiftersVisualFor(agg) });

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
    body: pathDependenceCardBody(repeat, same),
  });

  // gate-l1-econ-r1 R1/R2: the season claim on this card is now READ OFF the two
  // season lines the COUNTERFACTUAL card printed, in the same market, rather than
  // asserted. At the shipped constants the most-cash line ends 26-27 renewal
  // points below the never-move-the-dial line in both markets, so the tradeoff
  // the card names is one the room's own evidence shows — and if a retune ever
  // collapses it again, this sentence changes with it instead of going false.
  const bestFill = agg.books.map((b) => `${b.club} ${b.bestFillPct}%`).join(" · ");
  // `gate-l1-econ-r3` R5 (BLOCKING dissent `econ-l1-two-book-baseline`), limbs
  // (i) and (ii): this sentence used to compare the cash corner against "never
  // touching the dial" — a Pareto-DOMINATED season — which made the card imply
  // that 15 renewal points cost $1,178,672 when the model charges $25,050 for
  // them (47x New York / 70x Memphis). Both lines quoted here are now corners of
  // the model's own exact frontier (`seasonFrontier`), so the exchange rate the
  // room infers is the model's true average marginal cost over exactly that
  // range — and the card says the thing that makes it economics rather than a
  // pair of numbers: the points are not all the same price.
  const seasonTradeoff = seasonTradeoffLine();
  cards.push({
    id: "two-books",
    title: "TWO BOOKS, NO EXCHANGE RATE",
    visual: frontierVisualFor(state),
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
type RevenueGroup = {
  marketId: MarketId;
  cardId: string;
  points: CurvePoint[];
  low: CurvePoint;
  high: CurvePoint;
  spread: number;
};

/**
 * W3 Lane S (R-5): the group this card quotes is now picked ONCE and shared with
 * the card's computed dot visual, so the picture and the sentence can never be
 * about two different nights. `best` is exactly the selection this card has
 * always made (one market, one card, the two turnouts moving against the two
 * prices — B5); `widest` is the largest realized group whatever its shape, which
 * the dots may draw when there is no comparable pair, because a dot is honest
 * even when a sentence about it would not be.
 */
function revenueGroups(agg: FullHouseAggregate): { best: RevenueGroup | null; widest: RevenueGroup | null } {
  type Group = { marketId: MarketId; cardId: string; points: CurvePoint[] };
  const groups: Group[] = [];
  for (const point of agg.curves) {
    const found = groups.find((g) => g.marketId === point.marketId && g.cardId === point.cardId);
    if (found) found.points.push(point);
    else groups.push({ marketId: point.marketId, cardId: point.cardId, points: [point] });
  }
  const scored: RevenueGroup[] = groups.map((g) => {
    const low = g.points.reduce((a, b) => (b.price < a.price ? b : a));
    const high = g.points.reduce((a, b) => (b.price > a.price ? b : a));
    return { ...g, low, high, spread: high.price - low.price };
  });
  const usable = scored
    .filter((g) => g.spread > 0 && g.high.turnout < g.low.turnout)
    .sort((a, b) => b.spread - a.spread);
  const widest = [...scored].sort((a, b) => b.points.length - a.points.length || b.spread - a.spread)[0] ?? null;
  return { best: usable[0] ?? null, widest };
}

function revenueCardBody(agg: FullHouseAggregate): string {
  const club = (id: MarketId): string => MARKET_BY_ID.get(id)?.club ?? id;
  const best = revenueGroups(agg).best;
  if (!best) {
    return `Every desk-night in this room is a price multiplied by a crowd — that product is the money, and neither number is the money on its own. Tonight the room did not give us two desks in the same building charging different prices on the same night, so there is no honest pair to quote: compare dots of the same colour and the same shape on the board, never two different nights.`;
  }
  const label = CARD_BY_ID.get(best.cardId)?.label ?? best.cardId;
  return `${label}, ${club(best.marketId)} — the same night in the same building. One desk charged $${best.low.price} and ${best.low.turnout.toLocaleString()} came. Another charged $${best.high.price} and ${best.high.turnout.toLocaleString()} came. Higher price, smaller crowd: that is a demand curve, and it is only readable one night at a time. Neither number alone is the money — the money is the two of them multiplied, which is why the biggest crowd and the biggest night are almost never the same night.`;
}

/**
 * `gate-l1-econ-r2` R4 (BLOCKING dissent `econ-l1-n5-attribution`) — discharge
 * limb (a). This card used to assert one cause ("because four nights of your own
 * choices had already moved your renewals") for a crowd change the model builds
 * out of TWO carried channels, and the unnamed one was the bigger one for every
 * desk that spent on Night 4. The card now quotes each desk with its own split
 * and only makes the renewals claim where renewals is the larger channel for the
 * desks it quotes; where it is not, it says which channel was, in that desk's own
 * fans. Nothing here is written prose about a cause: `biggestChannel`,
 * `renewalsFans` and `carryFans` are computed in `repeatRowFor`.
 */
export function pathDependenceCardBody(repeat: readonly RepeatRow[], same: readonly RepeatRow[]): string {
  // gate-l1-econ-r3 R6: quote desks whose crowd can actually show the split.
  // A floored desk prints "0 then 0" and the verdict under it used to say the
  // biggest thing that changed was its renewals — self-refuting on the projector.
  const pool = same.length > 0 ? same : repeat;
  const readable = pool.filter((r) => !r.floored);
  const quoted = (readable.length > 0 ? readable : pool).slice(0, 3);
  const allFloored = readable.length === 0 && pool.length > 0;
  // W3-R10: `allFloored` says only that no row has a readable crowd on BOTH
  // nights. Whether nobody came at all is a different fact, and the card printed
  // the stronger one over crowds of 542 and 670.
  const allBothFloored = allFloored && pool.every((r) => r.bothFloored);
  if (quoted.length === 0) {
    return `No desk in this room has played both Night 1 and Night 5 yet. ${RENEWALS_RULE_BOARD}`;
  }
  const lines = quoted
    .map(
      (r) =>
        `${r.deskHandle}: ${r.n1Turnout.toLocaleString()} then ${r.n5Turnout.toLocaleString()} — ${r.channelLine}`,
    )
    .join(" · ");
  const renewalsLed = quoted.filter((r) => r.biggestChannel === "renewals").length;
  const opener =
    same.length > 0
      ? `${same.length} desk${same.length === 1 ? "" : "s"} charged the same price on both nights. Same day, same visiting club, same price — and ${
          allBothFloored
            ? "at that price nobody walked in either time"
            : allFloored
              ? "on one of those two nights the price was above what anybody in this model would pay, so that night's crowd was zero"
              : "a different crowd walked in"
        }.`
      : `${repeat.length} desk${repeat.length === 1 ? "" : "s"} played that card twice and every one of them changed the price too, so part of every gap below is the price.`;
  const verdict = allFloored
    ? `${
        allBothFloored
          ? "Nothing carried over could show up in a crowd of nobody."
          : "A crowd that fell to nobody on one of the two nights cannot show what carried over into it — the gap you can see is the price, not the past."
      } That is the order of operations in this building: the price decides whether there is a crowd at all, and only then can anything you did earlier move it.`
    : renewalsLed === quoted.length
      ? "For every desk on this card the biggest thing that changed was its own renewals: four nights of their own pricing decided who walked in on the fifth."
      : renewalsLed === 0
        ? "Read the split: on these desks renewals were NOT the biggest thing that changed. Last night's event money was — it lands on the next night, and Night 5 is the next night. Both are the same idea: what you did earlier decided what tonight could be."
        : `Read the split: ${renewalsLed} of these ${quoted.length} desks were moved most by their own renewals, the rest by last night's event money. Both are things they did on an earlier night.`;
  return `${opener} ${lines}. ${verdict} ${RENEWALS_RULE_BOARD}`;
}

/**
 * W3 Lane S (R-5): the two nights this card quotes are picked ONCE and shared
 * with the card's DAY / DRAW / TV chip visual, so the chips and the sentence are
 * always about the same two nights of the same building. Selection is unchanged:
 * the first market that played both N1 and N2, a same-price pair if the room
 * produced one, otherwise each card's best crowd (which the body then refuses to
 * read as proof, because part of that gap is the price).
 */
type ShifterPick = { market: Market; a: CurvePoint; b: CurvePoint; samePrice: boolean };

function shifterPick(agg: FullHouseAggregate): ShifterPick | null {
  for (const market of MARKETS) {
    const n1 = agg.curves.filter((p) => p.marketId === market.id && p.cardId === "N1");
    const n2 = agg.curves.filter((p) => p.marketId === market.id && p.cardId === "N2");
    if (n1.length === 0 || n2.length === 0) continue;
    const pair = n1.flatMap((a) => n2.filter((b) => b.price === a.price).map((b) => ({ a, b })))[0];
    if (pair) return { market, a: pair.a, b: pair.b, samePrice: true };
    const bestN1 = n1.reduce((a, b) => (b.turnout > a.turnout ? b : a));
    const bestN2 = n2.reduce((a, b) => (b.turnout > a.turnout ? b : a));
    return { market, a: bestN1, b: bestN2, samePrice: false };
  }
  return null;
}

function shifterCardBody(agg: FullHouseAggregate): string {
  // Highest-turnout point on each of two cards in the same market — the room's own evidence
  // that the same price does not mean the same crowd.
  const picked = shifterPick(agg);
  if (picked) {
    const market = picked.market;
    const pair = picked.samePrice ? { a: picked.a, b: picked.b } : null;
    if (pair) {
      return `${market.club}: somebody charged $${pair.a.price} on the quiet Tuesday and drew ${pair.a.turnout.toLocaleString()}. Somebody charged the same $${pair.a.price} on Saturday against a better visiting club and drew ${pair.b.turnout.toLocaleString()}. Same price, different crowd. The day, the visiting club's Draw and the TV listing were all printed on the card before anyone locked.`;
    }
    // gate-l1-econ N5 (unrepaired at the recheck): this fallback used to quote two
    // DIFFERENT prices and then close with "nothing else moved the crowd", which
    // reads as evidence that the card alone moved it when the price moved too.
    // No desk in this room charged the same price on both cards, so the honest
    // move is to say the comparison is not clean and name the second cause.
    const bestN1 = picked.a;
    const bestN2 = picked.b;
    return `${market.club}: the best Tuesday crowd in this room was ${bestN1.turnout.toLocaleString()} at $${bestN1.price}; the best Saturday crowd was ${bestN2.turnout.toLocaleString()} at $${bestN2.price}. Those are two different prices, so this pair does not prove it on its own — part of that gap is the price. What the card can tell you is on the board: find two desks in the SAME building charging the SAME price on the two nights, and whatever is left over is the day, the Draw and the TV listing.`;
  }
  return "The day, the visiting club's Draw and the TV listing were printed on every card before anyone locked. Nothing else moved the crowd — there is no luck in this model.";
}
