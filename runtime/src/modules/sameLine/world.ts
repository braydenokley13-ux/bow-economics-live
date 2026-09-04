/**
 * MODULE 1 · "THE SAME LINE" — THE WORLD.
 *
 * Every real-world number Module 1 renders lives in this file, with its source
 * and the date it was true. Nothing else in the module may hard-code an NBA
 * figure; a number without a row here is a number nobody can re-verify.
 *
 * WHY A DATA FILE AND NOT CONSTANTS SPRINKLED THROUGH A REDUCER (BC-9). It is
 * 2026-09-03 and several real clubs sit within a few million dollars of a
 * threshold. A lesson beat resting on "San Antonio is $37,083 over the tax
 * line" is true for about a week. So the volatile facts are quarantined here,
 * every row carries `asOf`, and `REFRESH` below states out loud what a teacher
 * or a builder has to re-check before a class and how. The module is written so
 * that no beat depends on a club's exact distance to a line — only on which
 * BAND it is in, which is the durable fact.
 *
 * ONE PAYROLL DEFINITION (BC-7). Every club figure below is **cap hit including
 * cap holds and dead money**, as published by SalarySwish. The other common
 * definition — roster salary, as published by HoopsHype — differs by up to
 * ~$52M on one club. That gap is not an error and it is not noise: it is what
 * a club's own unsigned free agents cost it while it has not decided about
 * them. This module prints the definition beside every payroll it renders, and
 * never mixes the two.
 *
 * WHAT IS NOT HERE, DELIBERATELY. Nothing on the do-not-render list in
 * `docs/gauntlet/module-1/rebuild/NBA_FINANCIAL_TRUTH.md` §8.2. In particular:
 * no trade salary-matching percentage, no luxury-tax dollar bill, no
 * revenue-sharing percentage, no market-size tier, no figure for a season the
 * league has not announced, and no club whose reported hard-cap status
 * contradicts its own reported salary (Golden State, Cleveland, Indiana,
 * Miami — §7.3), and neither the Clippers nor Toronto (§4.3 roster conflict).
 */

/* ------------------------------------------------------------ provenance -- */

/**
 * `stats-database` was added for the production lines. It is worth naming
 * separately because it is the module's FIRST source that is not a cap tracker
 * and not a reporter: nearly every 2026 dollar figure in this file traces back
 * through one publisher to one reporter, so "two outlets" has never meant two
 * sources. A completed season's box score is an independent public record, and
 * it is the only thing in this file that cannot be revised by a later report.
 */
export type SourceTier =
  | "official-nba"
  | "cba"
  | "team-official"
  | "cap-database"
  | "stats-database"
  | "reporting";

export type Sourced<T> = {
  readonly value: T;
  /** The day this was true. Not the day it was written down. */
  readonly asOf: string;
  readonly source: string;
  readonly tier: SourceTier;
};

const fact = <T>(value: T, asOf: string, source: string, tier: SourceTier): Sourced<T> => ({
  value,
  asOf,
  source,
  tier,
});

/**
 * What has to be re-checked before a class, and how often.
 *
 * The two halves age at completely different rates and must not be refreshed
 * on one schedule. League thresholds are set once a year by the league and are
 * stable for the whole league year. Club positions move every week of the
 * offseason and every trade deadline.
 */
export const REFRESH = {
  thresholds: {
    cadence: "once per league year, after the NBA announces the new cap (late June / early July)",
    check: "pr.nba.com's salary-cap release for the coming season",
    lastDone: "2026-09-03",
  },
  clubs: {
    cadence: "before any class, and after any trade deadline",
    check:
      "salaryswish.com team pages for the cap hit, then spot-check one club against a second tracker; " +
      "if a club has moved into a different BAND (under cap / under tax / under first apron / under second " +
      "apron / over second apron), its row here is wrong and the seat must be re-cut",
    lastDone: "2026-09-03",
  },
  /**
   * THE BOARD, which ages in two completely different ways.
   *
   * A completed season's box score never changes: the twelve production lines
   * below are the most durable facts in the module and need no cadence at all.
   * What ages is the FRAMING around them — "last season" stops being last
   * season in late October, and a contract date or a reported dollar figure can
   * be corrected by a later report months after the fact. Three of the six rows
   * re-checked on 2026-09-03 disagreed with what this file said.
   */
  board: {
    cadence: "once per league year, before the new season starts (late October)",
    check:
      "basketball-reference.com player pages for the production lines (the season label, not the numbers, is " +
      "what expires) and hoopsrumors.com for each contract's date, term and FIRST-YEAR salary; never " +
      "basketball-reference's forward-season TEAM pages, which lag signings by months",
    lastDone: "2026-09-03",
  },
  /**
   * The one property the whole module rests on, which a refresh must not break:
   * the eight seats must still span at least four different bands, and at least
   * one seat must still be genuinely under the cap.
   */
  invariant: "SEATS span >= 4 bands and >= 1 seat is under the cap",
} as const;

/* ------------------------------------------------------------ the lines -- */

/**
 * THE FIVE LINES, AND WHAT KIND OF THING EACH ONE IS.
 *
 * This is the module's title concept and the graft the architecture selection
 * took from Candidate C: the cap is not one wall with five marks on it. Each
 * line does a categorically different thing to a club that reaches it, and the
 * `kind` field is rendered to students as the line's own label. A student who
 * learns only "there is a limit" has learned the wrong shape of the institution.
 */
export type LineKind = "compulsion" | "permission" | "price" | "confiscation" | "prohibition";

export type Line = {
  readonly id: "floor" | "cap" | "tax" | "apron1" | "apron2";
  readonly label: string;
  readonly amount: number;
  readonly kind: LineKind;
  /** What this line DOES, in the product's own voice. Grade 5-6 readable. */
  readonly does: string;
  readonly asOf: string;
  readonly source: string;
};

const CAP_AMOUNT = 164_961_000;

export const LINES: readonly Line[] = [
  {
    id: "floor",
    label: "THE FLOOR",
    amount: 148_465_000,
    kind: "compulsion",
    does: "You have to spend at least this much. Fall short and you pay the difference anyway — to the players, not to your team.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release; exactly 90% of the cap",
  },
  {
    id: "cap",
    label: "THE CAP",
    amount: CAP_AMOUNT,
    kind: "permission",
    does: "Under this line you may sign anyone you can afford. Cross it and you may only sign people the rules give you special permission to sign.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release",
  },
  {
    id: "tax",
    label: "THE TAX LINE",
    amount: 200_428_000,
    kind: "price",
    does: "Past this line every extra dollar of salary costs your owner more than a dollar. Nothing becomes illegal. It just gets expensive.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release; 121.5% of the cap",
  },
  {
    id: "apron1",
    label: "THE FIRST APRON",
    amount: 209_015_000,
    kind: "confiscation",
    does: "Past this line the league takes tools away from you. Your biggest signing tool is gone, and so is your ability to take a player in a sign-and-trade.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release",
  },
  {
    id: "apron2",
    label: "THE SECOND APRON",
    amount: 221_686_000,
    kind: "prohibition",
    does: "Past this line almost every way of adding a player is simply not allowed. You may still keep your own players. That is nearly all you may do.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release",
  },
] as const;

export const LINE = Object.fromEntries(LINES.map((l) => [l.id, l.amount])) as Record<Line["id"], number>;

/** Which band a committed salary sits in. The durable fact; the distance to a line is not. */
export type Band = "under-floor" | "under-cap" | "under-tax" | "under-apron1" | "under-apron2" | "over-apron2";

export function bandOf(committed: number): Band {
  if (committed < LINE.floor) return "under-floor";
  if (committed < LINE.cap) return "under-cap";
  if (committed < LINE.tax) return "under-tax";
  if (committed < LINE.apron1) return "under-apron1";
  if (committed < LINE.apron2) return "under-apron2";
  return "over-apron2";
}

/* ------------------------------------------------------------ the tools -- */

/**
 * THE POCKETS — the exception rack, grafted from Candidate A.
 *
 * The ladder $15,044,000 -> $9,366,000 -> $6,064,000 -> nothing is, in the
 * dossier's own words, "the cleanest 'your tool shrinks as you spend more'
 * image available." It is also the repair for the defect two prosecutors found
 * independently in the winning candidate: an over-cap club whose only tool
 * above the minimum is the non-taxpayer mid-level has ONE reachable price, so
 * every strategy lands on the same number and the student's offer stops
 * mattering (BC-3).
 *
 * The hard-cap effect is the mechanic the dossier calls "the single best
 * mechanic in the system for a classroom": a team is not assigned a wall. Using
 * a restricted tool CONVERTS a line into a wall it may not cross for the rest
 * of the year. Your own July choice removes your February options, with no
 * vocabulary required.
 */
export type ToolId = "room" | "ntmle" | "roomMle" | "taxMle" | "bae" | "minimum" | "bird";

export type Tool = {
  readonly id: ToolId;
  readonly label: string;
  /** Maximum annual salary this tool can pay, or null when the tool's ceiling is computed. */
  readonly ceiling: number | null;
  readonly maxYears: number;
  /** The line this tool converts into a wall when used, or null. */
  readonly drawsWallAt: Line["id"] | null;
  /** One sentence, grade 5-6 readable, on what this tool is for. */
  readonly does: string;
  readonly asOf: string;
  readonly source: string;
};

export const TOOLS: readonly Tool[] = [
  {
    id: "room",
    label: "CAP ROOM",
    ceiling: null, // computed: cap minus committed
    maxYears: 4,
    drawsWallAt: null,
    does: "The plain money you have under the cap. Spend it on anyone. Using it costs you your bigger exceptions.",
    asOf: "2026-06-30",
    source: "NBA_FINANCIAL_TRUTH §2.4",
  },
  {
    id: "ntmle",
    label: "THE BIG EXCEPTION",
    ceiling: 15_044_000,
    maxYears: 4,
    drawsWallAt: "apron1",
    does: "The largest signing an over-the-cap team is allowed. Using it draws a wall you cannot cross for the rest of the year.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release (non-taxpayer mid-level exception)",
  },
  {
    id: "roomMle",
    label: "THE LEFTOVER EXCEPTION",
    ceiling: 9_366_000,
    maxYears: 3,
    drawsWallAt: null,
    does: "A smaller exception you get only after you have spent your cap room.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release (room mid-level exception)",
  },
  {
    id: "taxMle",
    label: "THE SMALL EXCEPTION",
    ceiling: 6_064_000,
    maxYears: 2,
    // CORRECTED 2026-09-03. This said `null` — that the small exception draws
    // no wall at all — and that is false. Using the taxpayer mid-level
    // exception hard-caps a club at the SECOND apron for the rest of the year.
    // Two independent sources say so plainly
    // (hoopsrumors.com/2026/07/nba-teams-with-hard-caps-for-2026-27.html lists
    // it under the second-apron triggers; overtheapron.com/terms/hard-cap says
    // the same), and the first names Golden State and Houston as clubs walled
    // there this way.
    //
    // The correction makes the lesson BETTER, not fussier. "One exception draws
    // a wall and the other does not" was a false and rather boring choice. The
    // truth is that both draw one, at different lines — so the real question a
    // club asks is not "will I be walled?" but "where, and am I anywhere near
    // it?" A wall $18M above you costs you nothing today; the same wall drawn
    // at your own feet ends your window.
    drawsWallAt: "apron2",
    does: "Smaller than the big one, and it draws its wall much further away — which is sometimes worth more than the extra money.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release (taxpayer mid-level exception); hard-cap trigger per hoopsrumors.com 2026-27 hard-cap tracker and overtheapron.com/terms/hard-cap, both read 2026-09-03",
  },
  {
    id: "bae",
    label: "THE EVERY-OTHER-YEAR EXCEPTION",
    ceiling: 5_477_000,
    maxYears: 2,
    drawsWallAt: "apron1",
    does: "A small extra exception you may only use every second year. It also draws a wall.",
    asOf: "2026-07-01",
    // §7.4: the only 2026-27 figure here that is NOT in the official league
    // release. Cap-database only, high confidence on the number. Nothing in the
    // lesson is allowed to turn on this exact figure.
    source: "hoopsrumors.com 2026-27 exception values (bi-annual exception) — NOT in the official NBA release, §7.4",
  },
  {
    id: "minimum",
    label: "A MINIMUM DEAL",
    ceiling: 2_449_421,
    maxYears: 1,
    drawsWallAt: null,
    does: "Always allowed, for anyone, no matter how much you have spent. It never runs out.",
    asOf: "2026-07-01",
    source: "hoopsrumors.com 2026-27 minimum salaries — the team-cost cap on a 3+ year veteran minimum",
  },
  {
    id: "bird",
    label: "YOUR OWN PLAYER",
    ceiling: null, // computed: the player's own ask, no cap-based ceiling
    maxYears: 5,
    drawsWallAt: null,
    does: "You may always keep a player who is already yours, however much you have spent. It is the one thing no line takes away.",
    asOf: "2026-06-30",
    source: "NBA_FINANCIAL_TRUTH §2.3 and §2.5 — Bird rights survive both aprons",
  },
] as const;

export const TOOL = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, Tool>;

/** The empty-roster backstop: you cannot manufacture room by fielding nobody. */
export const ROSTER = {
  /**
   * The season limit on standard contracts. Enforced at settlement.
   */
  max: 15,
  /**
   * The OFFSEASON limit, which is the one that binds during a signing window.
   *
   * This distinction is not pedantry, and getting it wrong froze a seat solid:
   * a club carrying 16 filled roster spots in September is entirely normal and
   * is not in breach of anything, because clubs may carry up to 21 until the
   * season starts. Modelling the window against the 15-man season limit made
   * that club unable to make a single legal signing, which the sweep caught as
   * a seat with no game.
   */
  windowMax: 21,
  min: 14,
  /** Below this many players, each empty slot is charged against the cap. */
  backstopAt: 12,
  emptySlotCharge: fact(1_357_763, "2026-07-01", "hoopsrumors.com 2026-27 minimum salaries (rookie minimum)", "cap-database"),
} as const;

/**
 * Raise rates. Real, and the reason a club can keep its own player more cheaply
 * in total than a rival can take him: at the same annual salary the incumbent's
 * deal is longer and rises faster, so it is worth more money to the player.
 */
export const RAISES = {
  incumbent: fact(0.08, "2026-06-30", "NBA_FINANCIAL_TRUTH §8.1 #10 — re-signing your own player: 5 years, 8% raises", "cba"),
  rival: fact(0.05, "2026-06-30", "NBA_FINANCIAL_TRUTH §8.1 #10 — signing elsewhere: 4 years, 5% raises", "cba"),
} as const;

/* ---------------------------------------------------------------- clubs -- */

export type ClubId =
  | "brooklyn"
  | "memphis"
  | "detroit"
  | "milwaukee"
  | "boston"
  | "sacramento"
  | "new-york"
  | "minnesota";

export type JobRole = "BIG" | "WING" | "GUARD";

export type Club = {
  readonly id: ClubId;
  /** Named, never branded: a wordmark, no logo art, no colours of the real club. */
  readonly name: string;
  readonly city: string;
  /** Cap hit including cap holds and dead money. THE one definition (BC-7). */
  readonly committed: Sourced<number>;
  /** Money already owed to players who are not on this roster. Zero is a real answer. */
  readonly deadMoney: Sourced<number>;
  readonly contracts: Sourced<number>;
  /** The two open jobs this club starts L1 with. */
  readonly jobs: readonly JobRole[];
  /**
   * One sentence a student reads before they choose anything. Every clause must
   * be checkable against `committed`, `deadMoney` or a cited fact — no
   * atmosphere, no adjectives the model cannot support.
   */
  readonly situation: string;
  /** A fact that is true and memorable and does not decide anything. */
  readonly colour: Sourced<string>;
};

/**
 * THE EIGHT SEATS.
 *
 * Chosen to span the ladder — two under the cap, two between cap and tax, two
 * between tax and the first apron, one over the first apron, one over the
 * second — because the module's whole thesis is that one rule drawn in one
 * place does a different thing to each of them (BC-14: no dead seats, every
 * club held by at least two desks).
 *
 * Deliberately excluded and why: Golden State, Cleveland, Indiana and Miami are
 * each reported hard-capped at a line their own reported salary exceeds (§7.3,
 * logically impossible as published); the Clippers and Toronto have an
 * unresolved roster conflict (§4.3); San Antonio ($37,083 over the tax) and
 * Phoenix ($1,736,556 under the second apron) sit so close to a line that a
 * single September signing moves them into another band, and BC-9 forbids
 * resting a beat on a figure inside a stated volatility band. Oklahoma City is
 * held out of L1 for the same reason ($2,820,601 of room) and appears in L2's
 * league board, where its exact distance is not load-bearing.
 */
export const CLUBS: readonly Club[] = [
  {
    id: "memphis",
    name: "Memphis",
    city: "Memphis",
    committed: fact(161_034_793, "2026-09-03", "salaryswish.com/teams/grizzlies", "cap-database"),
    deadMoney: fact(21_909_021, "2026-09-03", "salaryswish.com/teams/grizzlies", "cap-database"),
    contracts: fact(13, "2026-09-03", "salaryswish.com/teams/grizzlies", "cap-database"),
    jobs: ["WING", "BIG"],
    situation:
      "You are under the cap — and the money you owe players who already left is bigger than the money you have left to spend.",
    colour: fact(
      "Memphis owns Utah's, the Lakers' and Cleveland's first-round picks for 2027, on top of all of its own.",
      "2026-09-03",
      "salaryswish.com/teams/grizzlies",
      "cap-database",
    ),
  },
  {
    id: "brooklyn",
    name: "Brooklyn",
    city: "Brooklyn",
    committed: fact(162_780_296, "2026-09-03", "salaryswish.com/teams/nets", "cap-database"),
    deadMoney: fact(0, "2026-09-03", "salaryswish.com/teams/nets", "cap-database"),
    contracts: fact(12, "2026-09-03", "salaryswish.com/teams/nets", "cap-database"),
    jobs: ["BIG", "GUARD"],
    // CORRECTED 2026-09-03. This said "you have real money under the cap", and
    // the money is $2,180,704 — less than the minimum charge of $2,449,421, so
    // it cannot sign one single human being. The seat's whole lesson is that
    // cap space sounds like the good outcome and frequently is not; telling the
    // pair they were rich made the lesson unlearnable and the copy false.
    situation:
      "You are under the cap — by $2,180,704, which is not enough to sign anybody at all. Cap room only helps a club that has a lot of it, and you may be better off giving yours up.",
    colour: fact(
      "The youngest roster in the league, average age 23.7, holding four future first-round picks with no protections on them.",
      "2026-09-03",
      "salaryswish.com/teams/nets",
      "cap-database",
    ),
  },
  {
    id: "detroit",
    name: "Detroit",
    city: "Detroit",
    committed: fact(188_615_753, "2026-09-03", "salaryswish.com/teams/pistons", "cap-database"),
    deadMoney: fact(0, "2026-09-03", "salaryswish.com/teams/pistons", "cap-database"),
    contracts: fact(12, "2026-09-03", "salaryswish.com/teams/pistons", "cap-database"),
    jobs: ["WING", "BIG"],
    situation: "You are over the cap but well short of the tax, and your biggest signing tool is still unused.",
    colour: fact(
      "Detroit holds seven first-round picks through 2033.",
      "2026-09-03",
      "salaryswish.com/teams/pistons",
      "cap-database",
    ),
  },
  {
    id: "milwaukee",
    name: "Milwaukee",
    city: "Milwaukee",
    committed: fact(190_298_316, "2026-09-03", "salaryswish.com/teams/bucks", "cap-database"),
    deadMoney: fact(21_977_720, "2026-09-03", "salaryswish.com/teams/bucks", "cap-database"),
    contracts: fact(13, "2026-09-03", "salaryswish.com/teams/bucks", "cap-database"),
    jobs: ["WING", "GUARD"],
    situation:
      "Your third-biggest salary belongs to a player who plays for somebody else, and you owe it every year until 2031.",
    colour: fact(
      "Milwaukee pays Damian Lillard $21,311,053 a year through 2030-31 after waiving him. He plays elsewhere.",
      "2026-09-03",
      "salaryswish.com/teams/bucks; corroborated by the league's own waiver announcement",
      "cap-database",
    ),
  },
  {
    id: "boston",
    name: "Boston",
    city: "Boston",
    committed: fact(203_623_048, "2026-09-03", "salaryswish.com/teams/celtics", "cap-database"),
    deadMoney: fact(0, "2026-09-03", "salaryswish.com/teams/celtics", "cap-database"),
    contracts: fact(14, "2026-09-03", "salaryswish.com/teams/celtics", "cap-database"),
    jobs: ["BIG", "WING"],
    situation: "You are past the tax line. Nothing is illegal yet — everything is just more expensive than it looks.",
    colour: fact(
      "Two Boston players are paid $112.6M between them, on a roster of fourteen.",
      "2026-09-03",
      "salaryswish.com/teams/celtics",
      "cap-database",
    ),
  },
  {
    id: "sacramento",
    name: "Sacramento",
    city: "Sacramento",
    committed: fact(202_859_372, "2026-09-03", "salaryswish.com/teams/kings", "cap-database"),
    // Corrected 2026-09-03 from 0: SalarySwish carries $10,000,000 of dead money
    // for DeMar DeRozan, waived. A club with the module's second-largest dead
    // money was being shown as carrying none, which is precisely the fact this
    // seat exists to teach.
    deadMoney: fact(10_000_000, "2026-09-03", "salaryswish.com/teams/kings", "cap-database"),
    contracts: fact(16, "2026-09-03", "salaryswish.com/teams/kings", "cap-database"),
    jobs: ["WING", "BIG"],
    // CORRECTED 2026-09-03. This said the club had "already spent most of your
    // big exception", and `openingPosition` hands every club `spent: []` — it
    // has the whole thing. What is true, and better, is that the wall clips it:
    // Sacramento sits $6,155,628 under the first apron, so the moment it
    // reaches for a $14,104,000 exception the apron cuts the reach down to what
    // fits underneath.
    situation:
      "You are past the tax line and $6,155,628 under the first apron. Your big exception is worth $14,104,000 to clubs with room to use it, and using it draws a wall you are almost touching — so you can only reach for the part that fits underneath.",
    colour: fact(
      "Two Sacramento players are paid roughly $94M between them.",
      "2026-09-03",
      "salaryswish.com/teams/kings",
      "cap-database",
    ),
  },
  {
    id: "new-york",
    name: "New York",
    city: "New York",
    committed: fact(218_412_232, "2026-09-03", "salaryswish.com/teams/knicks", "cap-database"),
    deadMoney: fact(0, "2026-09-03", "salaryswish.com/teams/knicks", "cap-database"),
    contracts: fact(13, "2026-09-03", "salaryswish.com/teams/knicks", "cap-database"),
    // THREE holes, and the tools to close two. That asymmetry is the seat.
    // A club past the first apron is a capped-out contender with a thin bench,
    // which is exactly why it has more openings than a rebuilding club — and
    // the league has just taken away the one tool big enough to fix them. With
    // two holes and an always-available minimum market the choice evaporated:
    // the sweep found a single plan dominating everything, because there was
    // nothing to leave undone. With three, which hole you live with is the
    // decision.
    jobs: ["BIG", "GUARD", "WING", "BIG"],
    situation: "You are past the first apron. The league has already taken your biggest tool away, and you are in the biggest market in the sport.",
    colour: fact(
      "Four New York players are paid roughly $171M between them, and every one of those four contracts contains a player option.",
      "2026-09-03",
      "salaryswish.com/teams/knicks",
      "cap-database",
    ),
  },
  {
    id: "minnesota",
    name: "Minnesota",
    city: "Minnesota",
    committed: fact(214_930_955, "2026-09-03", "salaryswish.com/teams/timberwolves", "cap-database"),
    deadMoney: fact(2_055_000, "2026-09-03", "salaryswish.com/teams/timberwolves", "cap-database"),
    contracts: fact(13, "2026-09-03", "salaryswish.com/teams/timberwolves", "cap-database"),
    jobs: ["WING", "GUARD", "BIG", "WING"],
    situation:
      "You are past the first apron too — a small market carrying a big-market payroll, with the same tools taken away.",
    /*
     * WITHDRAWN 2026-09-03: this line asserted that Minnesota had drawn a hard
     * cap by aggregating salaries. Published hard-cap status is not reliable —
     * SalarySwish's own tracker lists Minnesota hard-capped at the first apron
     * while showing its apron salary $7,665,955 ABOVE that same line, which
     * cannot both be true, and the same contradiction appears for Miami,
     * Cleveland and Indiana. No club colour may assert hard-cap status until a
     * source resolves it.
     *
     * Replaced with a consequence that follows from the club's position by
     * rule rather than from a status claim, and that is the seat's whole
     * lesson: past the first apron, the one thing NOT taken away is your own
     * players.
     */
    colour: fact(
      "Past the first apron the only outside player Minnesota may sign is a small-exception or minimum one — but it may still pay its own free agents whatever it takes to keep them.",
      "2026-09-03",
      "2023 CBA Art. VII s6(j); pr.nba.com 2026-27 cap release",
      "cba",
    ),
  },
] as const;

/**
 * DENVER — shown to the class, never handed to a desk.
 *
 * The sweep demoted this seat, and the demotion is the honest outcome rather
 * than a retreat. Past the second apron a real club may sign minimum contracts
 * and keep its own free agents, and nothing else — so with no free agent of its
 * own in this window, Denver's entire reachable action space is one price. The
 * harness measured exactly one distinct reachable price and one outcome vector,
 * which is BC-14's definition of a seat with no game.
 *
 * BC-14 permits reshaping such a seat or demoting it to a projector case, and a
 * projector case is strictly the better lesson: the room LOOKS at a club that
 * cannot act, for one beat, instead of one pair spending twenty minutes being
 * unable to act. The second apron is more legible from outside it than inside.
 */
export const PROJECTOR_CASES = [
  {
    id: "denver",
    name: "Denver",
    committed: fact(227_422_947, "2026-09-03", "salaryswish.com/teams/nuggets", "cap-database"),
    line: "past the second apron",
    what: "Minimum contracts, and keeping its own players. That is the whole list.",
  },
] as const;

export const CLUB = Object.fromEntries(CLUBS.map((c) => [c.id, c])) as Record<ClubId, Club>;

/** The declared payroll definition, printed beside every payroll figure (BC-7). */
export const PAYROLL_DEFINITION =
  "Cap hit including cap holds and dead money (SalarySwish, 2026-09-03). A different published " +
  "definition, roster salary, leaves out money held against a club for players it has not yet " +
  "decided about — the two differ by up to $52M on one club. This room uses one and says which.";

/* ---------------------------------------------------------- free agents -- */

/**
 * WHAT HE ACTUALLY DID, LAST COMPLETED SEASON.
 *
 * Added because a board that prints PRICE and no PRODUCTION asserts a quality
 * ordering that the real numbers contradict. On this board the cheapest big
 * out-scored every expensive one and the second-cheapest guard out-scored a
 * guard costing two and a half times as much. A student reading price alone
 * learns something false about how clubs value players; a student reading
 * price beside production, age and term learns the true thing, which is that
 * price on a free-agent board buys YEARS and YOUTH, not last season's points.
 *
 * These are hand-entered public box-score facts with attribution, one row per
 * card — not an ingested dataset. If anyone proposes automated scraping of a
 * statistics publisher into this repo, that is a different question and it
 * gets escalated rather than answered here.
 *
 * Every field is per game and from the same source row, so no two numbers on a
 * card can come from different seasons.
 */
export type Production = {
  /** The season these are from, printed, so "last season" can never silently rot. */
  readonly season: string;
  readonly games: number;
  readonly started: number;
  readonly minutes: number;
  readonly points: number;
  readonly rebounds: number;
  readonly assists: number;
  readonly blocks: number;
  /** Field-goal percentage, as a decimal. */
  readonly fg: number;
  /** Three-point percentage. `null` when he did not take enough to be worth printing. */
  readonly three: number | null;
};

/**
 * WHAT THE `ask` NUMBER ACTUALLY IS.
 *
 * The module charges `ask` against a cap, and a cap charges a club its
 * FIRST-YEAR salary — an average annual value is not a cap hit. Most rows here
 * are first-year salaries. Two are averages, because the first year was never
 * separately reported in any source read, and a plausible first year worked
 * out by dividing by the raise ladder would be an invented number printed as an
 * NBA fact. So the basis is stored, printed on the card, and never guessed.
 */
export type AskBasis = "first-year" | "average";

export type FreeAgent = {
  readonly id: string;
  readonly name: string;
  readonly role: JobRole;
  /**
   * THE RESERVE: the least he will accept, in annual dollars.
   *
   * It is the real annual value of the real contract he really signed — the
   * price at which a real club really got him, so it is exactly a price he was
   * willing to take. A club may offer more, and beating a rival is the only
   * reason to. That is what makes the number a student types a decision rather
   * than a formality: every dollar above the reserve buys certainty and costs
   * something else.
   */
  readonly ask: Sourced<number>;
  /** The real date the contract was agreed, printed on the card. */
  readonly signedOn: string;
  /**
   * True when the real deal was a stated veteran minimum.
   *
   * It matters mechanically, not decoratively: a minimum contract charges the
   * club the team-cost cap ($2,449,421) while the player is paid the full
   * minimum for his service, because the league reimburses the difference. So a
   * minimum-scale player is signable by ANY club, at ANY point past ANY line,
   * for less than he is paid. That is the real rule, and it is why no club in
   * this lesson is ever completely stuck.
   */
  readonly minimumScale: boolean;
  /** Who really signed it, printed on the card so the staging is never implied away. */
  readonly reallySignedWith: string;
  /**
   * A generic minimum-scale signing rather than a named person.
   *
   * The real minimum market is DEEP: there is always somebody available at the
   * minimum, which is precisely why a club past the last line is constrained
   * rather than paralysed. Modelling the board as seven named people and
   * nothing else made the most constrained seat in the room unable to sign
   * anyone at all, because every named minimum player was outbid by a club with
   * an exception. These entries are the depth, and they are never contested:
   * one desk taking one does not remove it from another.
   */
  readonly generic?: boolean;
  /** The real term of the deal, in years. Drives how long a job stays covered. */
  readonly years: number;
  /** One plain-language strength a person who has never watched a game can act on. */
  readonly strength: string;
  /** One plain-language risk, equally readable. Never a rating, never a number to sort on. */
  readonly risk: string;
  /** The club that already holds his rights, if any — the incumbent advantage in the tie-break. */
  readonly incumbent: ClubId | null;
  /** Whether `ask` is a first-year salary or an average. Printed, never guessed. */
  readonly askBasis: AskBasis;
  /**
   * How old he was ON THE DAY HE SIGNED.
   *
   * Deliberately not "how old he is", which would be wrong for five of twelve
   * cards by the following spring. Age at signing is a fixed historical fact
   * that goes with the fixed historical price, and age is half of why the price
   * ordering on this board looks upside down.
   */
  readonly ageAtSigning: number;
  /** Last completed season, per game. `null` only for the generic minimum bodies. */
  readonly production: Sourced<Production> | null;
};

/**
 * THE BOARD.
 *
 * Populated from `docs/gauntlet/module-1/rebuild/FREE_AGENT_BOARD_RESEARCH.md`.
 * Every entry is a real player who genuinely reached free agency, at the real
 * annual value of the deal he really signed, on the date shown.
 *
 * WHAT THE PRODUCT SAYS OUT LOUD ABOUT THIS (D49 Q3, and CLAUDE.md §3's
 * requirement to record what was simplified). These are real contracts real
 * clubs really signed, on the dates shown. They did not all happen in one
 * window; we have gathered them into one so a class can shop them against each
 * other. The module prints that sentence on the student surface rather than
 * implying a free agency that never existed — which is the defect an
 * independent Sports Reality review found in all four architecture candidates.
 */
export const BOARD: readonly FreeAgent[] = [
  {
    id: "watford",
    name: "Trendon Watford",
    role: "WING",
    ask: fact(2_900_000, "2026-08-17", "reported 1 year, $2,900,000 with New Orleans, a stated veteran minimum", "reporting"),
    askBasis: "first-year",
    signedOn: "2026-08-17",
    reallySignedWith: "New Orleans",
    years: 1,
    ageAtSigning: 25,
    minimumScale: true,
    // The only undrafted player on the board: nobody picked him at all, and he
    // has played five seasons. Was "can play several positions" until a source
    // check found basketball-reference lists him at two — power forward and
    // small forward. Two is not several, and the card now says two.
    strength: "Undrafted — nobody picked him — and he plays either forward spot, for the least the rules allow.",
    risk: "One year only. Next summer you are looking for this player again.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 53, started: 7, minutes: 16.3, points: 6.5, rebounds: 3.3, assists: 2.5, blocks: 0.4, fg: 0.515, three: null },
      "2026-09-03",
      "basketball-reference.com/players/w/watfotr01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "vucevic",
    name: "Nikola Vucevic",
    role: "BIG",
    ask: fact(3_900_000, "2026-07-02", "reported 1 year, $3,900,000 with Orlando, a stated veteran minimum", "reporting"),
    askBasis: "first-year",
    signedOn: "2026-07-02",
    reallySignedWith: "Orlando",
    years: 1,
    ageAtSigning: 35,
    minimumScale: true,
    // THE LOUDEST TRUE THING ON THIS BOARD, and it is one glance wide.
    //
    // He is the fourth-cheapest card here and he out-scored every other big by
    // five points a game -- including the one costing four times as much. The
    // card directly beside his, Larry Nance Jr., costs $100,000 MORE for a
    // quarter of the production. That is not a bug in the board and it is not
    // an argument that NBA clubs are bad at their jobs: it is what happens when
    // a 35-year-old takes one year at the minimum and a club pays real money
    // for youth and term instead. Printing price without production would have
    // taught the class the reverse, which is why production is on the card.
    strength: "The biggest scorer on this whole board, for the least money the rules allow.",
    risk: "He turns 36 in October, and the deal is only one year.",
    incumbent: "boston",
    production: fact(
      { season: "2025-26", games: 64, started: 49, minutes: 28.4, points: 15.1, rebounds: 8.4, assists: 3.3, blocks: 0.6, fg: 0.493, three: 0.369 },
      "2026-09-03",
      "basketball-reference.com/players/v/vucevni01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "payton",
    name: "Gary Payton II",
    role: "GUARD",
    ask: fact(3_900_000, "2026-08-01", "reported 1 year, $3,900,000 re-signing with Golden State; stated veteran minimum of $3,876,529", "reporting"),
    askBasis: "first-year",
    signedOn: "2026-08-01",
    reallySignedWith: "Golden State",
    years: 1,
    ageAtSigning: 33,
    minimumScale: true,
    strength: "Played 73 games — nearly every night — and made more than half his shots.",
    risk: "He does not score much, and the deal is one year.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 73, started: 1, minutes: 15.6, points: 7.5, rebounds: 3.6, assists: 1.7, blocks: 0.3, fg: 0.583, three: 0.291 },
      "2026-09-03",
      "basketball-reference.com/players/p/paytoga02.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "horford",
    name: "Al Horford",
    role: "BIG",
    ask: fact(7_000_000, "2026-07-06", "reported 2 years, $14,000,000 re-signing with Golden State; the first-year salary was not separately reported in the source read, so this is the average", "reporting"),
    askBasis: "average",
    signedOn: "2026-07-06",
    reallySignedWith: "Golden State",
    years: 2,
    ageAtSigning: 40,
    minimumScale: false,
    strength: "A big man who has played in the biggest games there are, and the deal runs two years.",
    risk: "He is 40, and two years is a long time to promise a 40-year-old.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 45, started: 13, minutes: 21.5, points: 8.3, rebounds: 4.9, assists: 2.6, blocks: 1.1, fg: 0.426, three: 0.361 },
      "2026-09-03",
      "basketball-reference.com/players/h/horfoal01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "nance",
    name: "Larry Nance Jr.",
    role: "BIG",
    ask: fact(4_000_000, "2026-07-08", "reported 1 year, $4,000,000 with Indiana", "reporting"),
    askBasis: "first-year",
    signedOn: "2026-07-08",
    reallySignedWith: "Indiana",
    years: 1,
    ageAtSigning: 33,
    minimumScale: false,
    strength: "A big man who does the unglamorous work.",
    // Verified rather than asserted: 35, 24, 61, 65 and 46 games in the last
    // five seasons. The old copy said the same thing without the number.
    risk: "He played 35 games last season, and has missed long stretches before.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 35, started: 3, minutes: 12.8, points: 3.7, rebounds: 2.7, assists: 1.0, blocks: 0.2, fg: 0.419, three: 0.333 },
      "2026-09-03",
      "basketball-reference.com/players/n/nancela02.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "simons",
    name: "Anfernee Simons",
    role: "GUARD",
    ask: fact(
      6_000_000,
      "2026-07-06",
      "hoopsrumors.com 2026-27 mid-level exception tracker (published 2026-07-16) — Philadelphia used $6,000,000 on Simons; this is the first-year salary, not the 2-year average",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-06",
    reallySignedWith: "Philadelphia",
    years: 2,
    ageAtSigning: 27,
    minimumScale: false,
    strength: "Scored 14.3 a game off the bench — nearly as much as the guard here costing two and a half times more.",
    // Was "his teams have not defended well with him on the floor", which was a
    // scouting claim nobody had sourced. Replaced with the fact that actually
    // explains his price, which a source check does support: 70 starts and 19.3
    // points a game for Portland in 2024-25, then zero starts in 49 games for
    // Boston. That collapse is why a 27-year-old scorer is cheap.
    risk: "He started 70 games two seasons ago and none at all last season. Somebody decided he should not start.",
    // NOT A DESK IN THIS ROOM.
    //
    // This said `boston` until his 2026 game log was actually read: Boston
    // through 2026-02-01, Chicago from 2026-02-05. Chicago held his rights on
    // the day he signed, and Chicago is not one of the eight clubs in this
    // room -- so no desk here has an incumbent claim on him, and the Boston
    // seat was being handed a tie-break it never had.
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 55, started: 5, minutes: 24.9, points: 14.3, rebounds: 2.5, assists: 2.4, blocks: 0.1, fg: 0.44, three: 0.385 },
      "2026-09-03",
      "basketball-reference.com/players/s/simonan01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "oubre",
    name: "Kelly Oubre Jr.",
    role: "WING",
    ask: fact(
      8_050_000,
      "2026-07-07",
      "hoopsrumors.com 2026-27 mid-level exception tracker (published 2026-07-16) — Indiana used $8,050,000 on Oubre; this is the first-year salary, not the 2-year average",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-07",
    reallySignedWith: "Indiana",
    years: 2,
    ageAtSigning: 30,
    minimumScale: false,
    strength: "Played the most minutes a night of anyone on this board, and started 41 of his 50 games.",
    risk: "He takes hard shots, and some nights they do not go in.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 50, started: 41, minutes: 31.5, points: 14.1, rebounds: 5.0, assists: 1.6, blocks: 0.5, fg: 0.467, three: 0.36 },
      "2026-09-03",
      "basketball-reference.com/players/o/oubreke01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "nurkic",
    name: "Jusuf Nurkic",
    role: "BIG",
    ask: fact(11_000_000, "2026-07-09", "reported 2 years, $22,000,000 re-signing with Utah; the first-year salary was not separately reported in the source read, so this is the average", "reporting"),
    askBasis: "average",
    signedOn: "2026-07-09",
    reallySignedWith: "Utah",
    years: 2,
    ageAtSigning: 31,
    minimumScale: false,
    strength: "The only man here who averaged double-figure rebounds, and he passes better than any other big.",
    // Was "he is slow, and quick teams can play him off the floor" -- a
    // scouting judgment with no source behind it. Availability is measurable
    // and was measured: 41, 51, 76, 52, 56 games in the last five seasons.
    risk: "He has played more than 60 games once in five seasons.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 41, started: 36, minutes: 26.4, points: 10.9, rebounds: 10.4, assists: 4.8, blocks: 0.5, fg: 0.503, three: 0.352 },
      "2026-09-03",
      "basketball-reference.com/players/n/nurkiju01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "robinson",
    name: "Mitchell Robinson",
    role: "BIG",
    ask: fact(
      15_044_000,
      "2026-07-06",
      "reported 3 years, $47,388,600 signing with Boston; first-year salary $15,044,000, which is Boston's entire non-taxpayer mid-level exception to the dollar. Corroborated to the dollar by hoopsrumors.com's 2026-27 mid-level tracker (published 2026-07-16)",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-06",
    reallySignedWith: "Boston",
    years: 3,
    ageAtSigning: 28,
    minimumScale: false,
    // Was "one of the best rebounders and rim protectors who changed teams this
    // summer" -- a ranking nobody had verified. These three facts are verified,
    // and they are more useful to a ten-year-old than a superlative: he grabs
    // 8.8 boards in 19.6 minutes, blocks 1.2 shots, and makes nearly three of
    // every four shots he takes. (Do NOT upgrade that to "led the league in
    // shooting" -- he did not qualify for the leaderboard.)
    strength: "Almost three of every four shots he takes go in, and he rebounds and blocks shots.",
    risk: "He scored 5.7 a game — the most expensive card here is not the biggest scorer. And he has missed large parts of several seasons.",
    // NEW YORK'S OWN FREE AGENT, AND THE SHARPEST CARD ON THE BOARD.
    //
    // What makes it sharp is NOT the thing it is easy to say about it. The
    // first apron did not stop New York keeping him: they held full Bird
    // rights and could legally have paid anything at all. What stopped them
    // was the SECOND apron, a little over three million dollars away. So the
    // honest sentence is not "the rules would not let them" -- it is "the
    // rules let them keep him, and they still could not afford to", which is
    // both true and the better lesson. Said the other way it would be a
    // factual fantasy about how the apron system works, printed as NBA truth.
    incumbent: "new-york",
    production: fact(
      { season: "2025-26", games: 60, started: 16, minutes: 19.6, points: 5.7, rebounds: 8.8, assists: 0.9, blocks: 1.2, fg: 0.723, three: null },
      "2026-09-03",
      "basketball-reference.com/players/r/robinmi01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "kuminga",
    name: "Jonathan Kuminga",
    role: "WING",
    ask: fact(
      6_064_000,
      "2026-08-26",
      "hoopsrumors.com, \"Jonathan Kuminga Agrees To Two-Year Deal With Timberwolves\" (published 2026-08-26) — reported 2 years, roughly $13,000,000 with a second-year player option, on Minnesota's taxpayer mid-level exception; $6,064,000 in year one, which is that exception exactly",
      "reporting",
    ),
    askBasis: "first-year",
    // Was 2026-07-06, which was wrong by seven weeks. The date matters to the
    // Minnesota pair below: Dosunmu was July and Kuminga was late August,
    // because Minnesota had to clear room under its own hard cap first. That is
    // a better story than "one club, one week", and it is the true one.
    signedOn: "2026-08-26",
    reallySignedWith: "Minnesota",
    years: 2,
    ageAtSigning: 23,
    minimumScale: false,
    strength: "The youngest player on this board by three years, and he won a championship at 19.",
    risk: "He has never started more than 46 games in a season, and he played only 36 last year.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 36, started: 14, minutes: 23.1, points: 12.2, rebounds: 5.6, assists: 2.3, blocks: 0.3, fg: 0.463, three: 0.333 },
      "2026-09-03",
      "basketball-reference.com/players/k/kuminjo01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "dosunmu",
    name: "Ayo Dosunmu",
    role: "GUARD",
    ask: fact(
      19_310_345,
      "2026-07-10",
      "reported 5 years, $112,000,000 re-signing with Minnesota; first-year salary $19,310,345, on Bird rights",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-10",
    reallySignedWith: "Minnesota",
    years: 5,
    ageAtSigning: 26,
    minimumScale: false,
    // Was "a starting guard entering his prime", which a source check does not
    // support: he started 19 of 69 games. "Paid like a starter, played as a
    // third guard" is the true version and it is the more interesting one. The
    // shooting number is what separates his card from Grimes' -- without it the
    // two are the same card at a $4.3M price gap.
    strength: "The best shooter on this board — .439 from three — and the longest commitment available here.",
    risk: "He started 19 games of 69. Five years is a long time, and the money grows every one of them.",
    // MINNESOTA'S OWN, AND THE PAIR THAT PROVES THE WHOLE APRON SYSTEM.
    //
    // One club, one summer, past the same line: Minnesota paid its own player
    // $19,310,345 and an outsider $6,064,000 -- and the second number is the
    // taxpayer mid-level exception to the dollar, because that is the most the
    // rules let a club past the first apron offer somebody who is not already
    // theirs. Same buyer, same line, three times the price, and the only
    // difference is whose player he was. Nothing else in the dossier makes the
    // asymmetry that undeniable, and it is real, dated and sourced.
    incumbent: "minnesota",
    production: fact(
      { season: "2025-26", games: 69, started: 19, minutes: 27.3, points: 14.8, rebounds: 3.4, assists: 3.6, blocks: 0.3, fg: 0.517, three: 0.439 },
      "2026-09-03",
      "basketball-reference.com/players/d/dosunay01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "grimes",
    name: "Quentin Grimes",
    role: "GUARD",
    ask: fact(
      15_000_000,
      "2026-07-07",
      "reported 4 years, $60,000,000 with the LA Lakers, agreement reported 2026-07-01 and announced by the club 2026-07-07; the first-year salary was not separately reported in the source read, so this is the average",
      "reporting",
    ),
    askBasis: "average",
    // Was 2026-07-15. No source read supports that date; the agreement was
    // reported 2026-07-01 and the club announced it 2026-07-07.
    signedOn: "2026-07-07",
    reallySignedWith: "LA Lakers",
    years: 4,
    ageAtSigning: 26,
    minimumScale: false,
    // Was "a young starting guard". He started 19 of 75 games and none of 11
    // playoff games, and the reporting calls him the third guard in the
    // rotation. Paid like a starter, played as a third guard -- which is both
    // true and exactly the lesson.
    strength: "Played 75 games, more than anyone here, and the deal runs four years — the job stays shut.",
    risk: "Paid like a starter; started 19 games of 75. The most expensive tool you own barely reaches him, and it draws a wall.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 75, started: 19, minutes: 29.4, points: 13.4, rebounds: 3.6, assists: 3.3, blocks: 0.4, fg: 0.45, three: 0.334 },
      "2026-09-03",
      "basketball-reference.com/players/g/grimequ01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "achiuwa",
    name: "Precious Achiuwa",
    role: "BIG",
    ask: fact(
      5_477_000,
      "2026-06-30",
      "reported 2 years, $11,230,000 re-signing with Sacramento, agreed 2026-06-30 and official 2026-07-07; hoopsrumors.com confirmed the Kings used their FULL bi-annual exception, so the first-year salary is $5,477,000 — the exception to the dollar. Both years guaranteed",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-06-30",
    reallySignedWith: "Sacramento",
    years: 2,
    ageAtSigning: 26,
    minimumScale: false,
    strength: "Started 57 games and set career highs in points, rebounds and assists.",
    risk: "He has never shot from outside — under three of every ten for his career.",
    // HE PLAYED FOR SACRAMENTO AND SACRAMENTO STILL COULD NOT SIMPLY KEEP HIM.
    //
    // `incumbent` is null on purpose, and the reason is the best rules lesson
    // on this board. Hoops Rumors, reporting the agreement: "The Kings only had
    // Achiuwa's NON-BIRD rights and the terms of his agreement suggest they'll
    // pay him more than those rights allow." So the club that had him all
    // season had to spend an exception to keep him -- which is exactly why he
    // is contested here rather than quietly theirs.
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 73, started: 57, minutes: 23.9, points: 10.1, rebounds: 6.7, assists: 1.4, blocks: 0.7, fg: 0.528, three: 0.278 },
      "2026-09-04",
      "basketball-reference.com/players/a/achiupr01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "hayes",
    name: "Jaxson Hayes",
    role: "BIG",
    ask: fact(
      6_000_000,
      "2026-07-01",
      "reported 2 years, $12,000,000 with Utah with a second-year team option, agreed 2026-07-01 and announced 2026-07-10, on the non-taxpayer mid-level exception; hoopsrumors.com's 2026-27 mid-level tracker lists Utah's first-year use at $6,000,000",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-01",
    reallySignedWith: "Utah",
    years: 2,
    ageAtSigning: 26,
    minimumScale: false,
    strength: "Three of every four shots he takes go in. Nobody else here is close.",
    risk: "Almost every one of them is right at the rim, and he started nine games all season.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 66, started: 9, minutes: 18.3, points: 7.5, rebounds: 4.1, assists: 0.9, blocks: 0.8, fg: 0.756, three: null },
      "2026-09-04",
      "basketball-reference.com/players/h/hayesja02.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "okogie",
    name: "Josh Okogie",
    role: "WING",
    ask: fact(
      6_000_000,
      "2026-07-03",
      "reported 2 years, $12,000,000 with Utah with a second-year team option, agreed 2026-07-03 and announced 2026-07-10, on the non-taxpayer mid-level exception; hoopsrumors.com's 2026-27 mid-level tracker lists Utah's second first-year use at $6,000,000",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-07-03",
    reallySignedWith: "Utah",
    years: 2,
    ageAtSigning: 27,
    minimumScale: false,
    strength: "Played 78 games — more than anyone here — and shot a career-best .385 from three.",
    risk: "He scored 4.5 points a game. Whatever this money is buying, it is not scoring.",
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 78, started: 32, minutes: 17.4, points: 4.5, rebounds: 2.6, assists: 0.9, blocks: 0.2, fg: 0.425, three: 0.385 },
      "2026-09-04",
      "basketball-reference.com/players/o/okogijo01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "hardaway",
    name: "Tim Hardaway Jr.",
    role: "WING",
    ask: fact(
      6_065_000,
      "2026-06-30",
      "reported 1 year with Miami, agreed 2026-06-30 and official 2026-07-06. First reported at $6,500,000; hoopsrumors.com's contract-details round-up corrected it to $6,065,000, which its 2026-27 mid-level tracker also lists",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-06-30",
    reallySignedWith: "Miami",
    years: 1,
    ageAtSigning: 34,
    minimumScale: false,
    strength: "Scored 13.5 a game off the bench and made .407 of his threes — third in the voting for best sixth man.",
    risk: "He is 34, and the deal is one year.",
    // A THOUSAND DOLLARS. THAT IS THE WHOLE LESSON.
    //
    // His real first-year salary is $6,065,000. The taxpayer mid-level -- the
    // only exception a club past the first apron gets -- tops out at
    // $6,064,000. So four of the eight clubs in this room cannot reach the best
    // shooter available to them, and they miss him by ONE THOUSAND DOLLARS.
    // Nobody made that up to teach a point; it is what the two numbers are.
    incumbent: null,
    production: fact(
      { season: "2025-26", games: 80, started: 6, minutes: 26.6, points: 13.5, rebounds: 2.6, assists: 1.4, blocks: 0.1, fg: 0.447, three: 0.407 },
      "2026-09-04",
      "basketball-reference.com/players/h/hardati02.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
  {
    id: "alvarado",
    name: "Jose Alvarado",
    role: "GUARD",
    ask: fact(
      4_439_656,
      "2026-06-26",
      "reported 3 years, $14,384,484 re-signing with New York on BIRD RIGHTS, agreed 2026-06-26 and official 2026-07-06 (hoopsrumors.com's Knicks offseason check-in, re-read 2026-09-04); salaryswish.com gives the 2026-27 cap hit as $4,439,656",
      "reporting",
    ),
    askBasis: "first-year",
    signedOn: "2026-06-26",
    reallySignedWith: "New York",
    years: 3,
    ageAtSigning: 28,
    minimumScale: false,
    strength: "Undrafted out of college, and he still takes the ball off somebody about once a night.",
    risk: "He came off the bench in 66 of his 69 games. His own club's price is what they think that is worth.",
    // NEW YORK'S SECOND OWN PLAYER, AND THE ONE THAT GIVES IT A CHOICE.
    //
    // Before this row New York had nothing at all between the minimum charge
    // ($2,449,421) and Mitchell Robinson ($15,044,000): its taxpayer exception
    // is clipped to $3,273,768 by the second apron and no named player lived in
    // that gap. One seat in the room therefore had two moves and no middle,
    // which the sweep found as a collapsed frontier. He is not filler -- he is
    // a real man New York really kept on real Bird rights, and keeping him
    // takes them past the second apron, which is the choice.
    incumbent: "new-york",
    production: fact(
      { season: "2025-26", games: 69, started: 3, minutes: 19.9, points: 7.4, rebounds: 2.5, assists: 3.4, blocks: 0.1, fg: 0.416, three: 0.352 },
      "2026-09-04",
      "basketball-reference.com/players/a/alvarjo01.html — per-game table, 2025-26 row; season complete, figures final",
      "stats-database",
    ),
  },
] as const;

/* ------------------------------------------------ registered simplifications -- */

export type Simplification = {
  readonly id: string;
  /** What the NBA actually does. */
  readonly real: string;
  /** What this module does instead. */
  readonly bow: string;
  /** Why the simplification is pedagogically necessary. */
  readonly why: string;
  /** What a student might now wrongly believe, and what the product does about it. */
  readonly misconceptionRisk: string;
  /** The economic truth the simplification preserves. */
  readonly preserves: string;
};

export const SIMPLIFICATIONS: readonly Simplification[] = [
  {
    id: "S1-trade-matching",
    real:
      "Salary matching in a trade is a bracketed ladder that depends on how much salary is going out and " +
      "which side of which apron the club LANDS ON AFTER the trade. A club that finishes above the FIRST apron " +
      "must go dollar-for-dollar: it may not take back more salary than it sends. Above the SECOND apron it " +
      "additionally may not combine two players' salaries into one incoming contract, and may not send cash.",
    bow: "No percentage is ever printed. The module teaches only the shape: once you are over the cap a trade has to be roughly even, and the further past the lines you are, the tighter 'roughly' gets.",
    why:
      "The brackets are administrative detail a grade 5-8 student cannot act on, and the widest band needs a percentage " +
      "the grade band does not have. The shape is the economics; the brackets are the paperwork. Corrected 2026-09-03: " +
      "an earlier draft of this field placed the dollar-for-dollar restriction at the second apron. It is the FIRST " +
      "(CBA Art. VII s6(j)(3); see NBA_TRADE_TRUTH.md), and the test is the club's position AFTER the trade, not before.",
    misconceptionRisk:
      "A student may infer matching is a single fixed percentage. Mitigated by never printing one, and by making the tightening-with-spend visible instead.",
    preserves: "That spending removes your freedom to transact, not merely your money.",
  },
  {
    id: "S2-room-fork",
    real:
      "Whether a club may use the non-taxpayer mid-level after going under the cap depends on a finer eligibility " +
      "test in the CBA than a single switch.",
    bow: "The moment a club makes a signing out of cap room, its big exception and its every-other-year exception are spent, and the leftover exception becomes available.",
    why: "One switch is legible in a sentence; the real test is not, and the trade-off it creates is identical either way.",
    misconceptionRisk:
      "A student may believe the rule is a single binary. Mitigated by the teacher note naming it as a simplification during synthesis.",
    preserves: "That using cap room costs you your bigger exception — a genuine two-path choice with no dominant option.",
  },
  {
    id: "S3-taxmle-eligibility",
    real: "Taxpayer mid-level eligibility turns on a finer test than a club's position between two aprons.",
    bow: "The small exception is available to any club under the second apron.",
    why: "The finer test never changes which tool a student would pick, and naming it would cost a paragraph.",
    misconceptionRisk: "Low. A student over-generalises a threshold that is genuinely threshold-shaped.",
    preserves: "That the tool shrinks as you spend, and disappears entirely at the last line.",
  },
  {
    id: "S4-staged-window",
    real: "The real contracts on the board were signed on different days, by different clubs, in different offseasons.",
    bow: "They are gathered into one three-day signing window so a class can shop them against each other.",
    why:
      "A board restricted to players available in one real window is too small to give every club a genuinely " +
      "different reachable set, which is the property the whole lesson rests on.",
    misconceptionRisk:
      "A student may believe these players were all available at once. Mitigated by saying so on the student surface, in the module's own voice, with each contract's real date printed on its card.",
    preserves: "Every price is a real price a real club really paid. Nothing about what a player costs is invented.",
  },
  {
    id: "S6-term-from-tool",
    real:
      "The length of a contract is negotiated between the club and the player, inside a maximum the " +
      "signing tool sets: one year at the minimum, two with the taxpayer mid-level, four with the " +
      "non-taxpayer mid-level, five to re-sign your own player.",
    bow: "A signing always runs for the tool's maximum. The club picks the tool and the price; the term follows the tool.",
    why:
      "One fewer control on a screen a ten-year-old has to read, and the economics is not in the negotiation — " +
      "it is in the fact that a longer commitment costs a bigger tool. Letting a student also pick a term " +
      "would add a third variable to a decision the pedagogy budget allows two.",
    misconceptionRisk:
      "A student may believe contract length is fixed by rule rather than agreed. Mitigated in synthesis, " +
      "where the teacher names it: the rules set the ceiling, the people set the number.",
    preserves:
      "That covering a job for longer costs a bigger tool, and that the bigger tool is exactly what the lines take away.",
  },
  {
    id: "S7-real-term-not-quoted",
    real: "Each player on the board really signed a deal of a particular length, printed on his card.",
    bow: "The term he signs for HERE is whatever the club's tool allows, which may be longer or shorter than his real deal.",
    why: "See S6: the term has to be the tool's for the tool to be a decision.",
    misconceptionRisk:
      "A student may believe the real player really signed for the years shown in this room. Mitigated by printing " +
      "the real deal's own length and date on the card, beside the term this room is offering.",
    preserves: "Every PRICE on the board is a real price a real club really paid.",
  },
  {
    id: "S8-ask-basis",
    real:
      "A club's cap is charged a contract's FIRST-YEAR salary. Reported deals are usually quoted as a total " +
      "and a term, from which an average annual value is easy to compute and a first-year salary is not — " +
      "the raise ladder inside a deal is negotiated and is often not reported at all.",
    bow:
      "Ten of the twelve named cards charge a first-year salary that a source states. Two — Al Horford and " +
      "Jusuf Nurkic — charge the average, because no source read stated their first year. Every card prints " +
      "which of the two its number is.",
    why:
      "The alternative was to divide the total by a raise ladder and print the result as the player's salary. " +
      "That would be an invented dollar figure presented as an NBA fact, on a card a child is told is real.",
    misconceptionRisk:
      "A student may take an average for a salary. Mitigated by printing the basis on the card in the module's " +
      "own words, and by the fact that on a two-year deal the two differ by under three percent.",
    preserves: "That the number the cap charges you is a real reported number, not one this room worked out.",
  },
  {
    id: "S9-production-is-last-season",
    real:
      "A free agent's price is set by what clubs expect him to do next, over the length of the deal, at the " +
      "age he will be. Last season's box score is one input among many, and not the biggest one.",
    bow:
      "Each card prints one completed season, per game, beside the price, the player's age on the day he " +
      "signed, and the real length of the real deal.",
    why:
      "Price alone asserts a quality ordering, and on this board the real production contradicts it: the " +
      "cheapest big out-scored every expensive one. A student given price and no production learns something " +
      "false. Age and term are on the card because they are what make the inversion honest — the money is " +
      "buying years and youth, not last season's points.",
    misconceptionRisk:
      "A student may conclude the cheap high scorer is simply a better buy, or that clubs are bad at their " +
      "jobs. Mitigated structurally: the two numbers that explain the price sit on the same card as the " +
      "price, and the debrief asks the room what the expensive clubs were buying.",
    preserves:
      "That price is information about the future and production is information about the past, and that " +
      "confusing the two is the most expensive mistake a front office makes.",
  },
  {
    id: "S5-future-lines",
    real: "The NBA has not announced cap or apron figures for seasons beyond 2026-27.",
    bow: "Where a later season's line is needed, the class works it out from the real rule — the cap may never fall, and may never rise by more than one tenth in a year — and the result is labelled as the room's own arithmetic.",
    why: "Printing an invented figure as a league number would be a factual fantasy presented as NBA reality.",
    misconceptionRisk:
      "A student may quote the room's number as a league figure. Mitigated by labelling it at every appearance: this room's number, worked out from the real rule.",
    preserves: "That the line moves, that its movement is itself governed by a rule, and that the rule is knowable.",
  },
];

/**
 * THE MINIMUM MARKET — the depth behind the seven named cards.
 *
 * Not decoration and not filler. A club past the second apron may sign nobody
 * except at the minimum, and if the only minimum-scale players in the world
 * were two named men that a richer club could outbid, that club would have no
 * game at all — which is exactly what the sweep found before this existed.
 * In the real league there is always someone at the minimum, so there is here.
 *
 * They carry no names, because inventing a person would be the one thing this
 * module refuses to do, and no risk/strength copy that pretends to scouting.
 * What they are is honest: a body, at a role, at the price the rules set.
 */
export const MINIMUM_MARKET: readonly FreeAgent[] = (["BIG", "WING", "GUARD"] as const).map((role) => ({
  id: `min-${role.toLowerCase()}`,
  name: `A veteran ${role.toLowerCase()} on a minimum deal`,
  role,
  ask: fact(
    2_449_421,
    "2026-07-01",
    "hoopsrumors.com 2026-27 minimum salaries — the team-cost cap on a 3+ year veteran minimum",
    "cap-database",
  ),
  signedOn: "",
  reallySignedWith: "",
  years: 1,
  minimumScale: true,
  generic: true,
  strength: "Available to every club, however much it has already spent.",
  risk: "One year, and he is the same player every other club could have had.",
  incumbent: null,
  askBasis: "first-year",
  /*
   * A generic body has no age and no box score, because inventing either would
   * be inventing a person -- the one thing this module refuses to do. Zero is
   * the sentinel the card reader checks; `production: null` is what makes it
   * render as a body at a price and never as a scouting report.
   */
  ageAtSigning: 0,
  production: null,
}));

/** The whole market: the seven real, dated contracts plus the minimum depth behind them. */
export const MARKET: readonly FreeAgent[] = [...BOARD, ...MINIMUM_MARKET];
