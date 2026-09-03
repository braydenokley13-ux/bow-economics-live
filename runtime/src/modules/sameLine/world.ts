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

export type SourceTier = "official-nba" | "cba" | "team-official" | "cap-database" | "reporting";

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
    drawsWallAt: null,
    does: "Smaller than the big one, but it draws no wall — and that is sometimes worth more than the extra money.",
    asOf: "2026-06-30",
    source: "pr.nba.com 2026-27 salary cap release (taxpayer mid-level exception)",
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
    situation:
      "You have real money under the cap and almost nothing already promised. Every choice from here is yours, and so is the blame.",
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
    situation: "You are past the tax line and you have already spent most of your big exception on somebody else.",
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
    signedOn: "2026-08-17",
    reallySignedWith: "New Orleans",
    years: 1,
    minimumScale: true,
    strength: "Can play several positions, so he fits whatever hole you have.",
    risk: "One year only. Next summer you are looking for this player again.",
    incumbent: null,
  },
  {
    id: "vucevic",
    name: "Nikola Vucevic",
    role: "BIG",
    ask: fact(3_900_000, "2026-07-02", "reported 1 year, $3,900,000 with Orlando, a stated veteran minimum", "reporting"),
    signedOn: "2026-07-02",
    reallySignedWith: "Orlando",
    years: 1,
    minimumScale: true,
    strength: "A big man who scores, available for the least money the rules allow.",
    risk: "He is 36 in this season, and the deal is only one year.",
    incumbent: "boston",
  },
  {
    id: "payton",
    name: "Gary Payton II",
    role: "GUARD",
    ask: fact(3_900_000, "2026-08-01", "reported 1 year, $3,900,000 re-signing with Golden State; stated veteran minimum of $3,876,529", "reporting"),
    signedOn: "2026-08-01",
    reallySignedWith: "Golden State",
    years: 1,
    minimumScale: true,
    strength: "A guard who takes the other team's best guard, for the least money the rules allow.",
    risk: "He does not score much, and the deal is one year.",
    incumbent: null,
  },
  {
    id: "horford",
    name: "Al Horford",
    role: "BIG",
    ask: fact(7_000_000, "2026-07-06", "reported 2 years, $14,000,000 re-signing with Golden State", "reporting"),
    signedOn: "2026-07-06",
    reallySignedWith: "Golden State",
    years: 2,
    minimumScale: false,
    strength: "A big man who has played in the biggest games there are, and the deal runs two years.",
    risk: "He is 40 in this season, and two years is a long time to promise a 40-year-old.",
    incumbent: null,
  },
  {
    id: "nance",
    name: "Larry Nance Jr.",
    role: "BIG",
    ask: fact(4_000_000, "2026-07-08", "reported 1 year, $4,000,000 with Indiana", "reporting"),
    signedOn: "2026-07-08",
    reallySignedWith: "Indiana",
    years: 1,
    minimumScale: false,
    strength: "A big man who does the unglamorous work, cheap.",
    risk: "He has missed long stretches with injuries before.",
    incumbent: null,
  },
  {
    id: "simons",
    name: "Anfernee Simons",
    role: "GUARD",
    ask: fact(6_150_000, "2026-07-06", "reported 2 years, $12,300,000 with Philadelphia", "reporting"),
    signedOn: "2026-07-06",
    reallySignedWith: "Philadelphia",
    years: 2,
    minimumScale: false,
    strength: "A guard who can score in a hurry when the offence stalls.",
    risk: "His teams have not defended well with him on the floor.",
    incumbent: "boston",
  },
  {
    id: "oubre",
    name: "Kelly Oubre Jr.",
    role: "WING",
    ask: fact(8_500_000, "2026-07-07", "reported 2 years, $17,000,000 with Indiana", "reporting"),
    signedOn: "2026-07-07",
    reallySignedWith: "Indiana",
    years: 2,
    minimumScale: false,
    strength: "A starting wing at a price well below what starting wings usually cost.",
    risk: "He takes hard shots, and some nights they do not go in.",
    incumbent: null,
  },
  {
    id: "nurkic",
    name: "Jusuf Nurkic",
    role: "BIG",
    ask: fact(11_000_000, "2026-07-09", "reported 2 years, $22,000,000 re-signing with Utah", "reporting"),
    signedOn: "2026-07-09",
    reallySignedWith: "Utah",
    years: 2,
    minimumScale: false,
    strength: "A large, experienced centre who rebounds and passes.",
    risk: "He is slow, and quick teams can play him off the floor.",
    incumbent: null,
  },
  {
    id: "robinson",
    name: "Mitchell Robinson",
    role: "BIG",
    ask: fact(
      15_044_000,
      "2026-07-06",
      "reported 3 years, $47,388,600 signing with Boston; first-year salary $15,044,000, which is Boston's entire non-taxpayer mid-level exception to the dollar",
      "reporting",
    ),
    signedOn: "2026-07-06",
    reallySignedWith: "Boston",
    years: 3,
    minimumScale: false,
    strength: "One of the best rebounders and rim protectors who changed teams this summer.",
    risk: "He has missed large parts of several seasons, and the deal runs three years.",
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
  },
  {
    id: "kuminga",
    name: "Jonathan Kuminga",
    role: "WING",
    ask: fact(
      6_064_000,
      "2026-07-06",
      "reported 2 years, $12,431,200 signing with Minnesota; $6,064,000 in year one, which is the taxpayer mid-level exception exactly",
      "reporting",
    ),
    signedOn: "2026-07-06",
    reallySignedWith: "Minnesota",
    years: 2,
    minimumScale: false,
    strength: "A young forward who can score, at the most a capped-out club is allowed to offer an outsider.",
    risk: "He has not yet done it as a starter for a whole season.",
    incumbent: null,
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
    signedOn: "2026-07-10",
    reallySignedWith: "Minnesota",
    years: 5,
    minimumScale: false,
    strength: "A starting guard entering his prime, and the longest commitment available here.",
    risk: "Five years is a long time, and the money grows every one of them.",
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
  },
  {
    id: "grimes",
    name: "Quentin Grimes",
    role: "GUARD",
    ask: fact(15_000_000, "2026-07-15", "reported 4 years, $60,000,000 with the LA Lakers", "reporting"),
    signedOn: "2026-07-15",
    reallySignedWith: "LA Lakers",
    years: 4,
    minimumScale: false,
    strength: "A young starting guard, and the deal runs four years — the job stays shut.",
    risk: "The most expensive player here. Reaching him takes your biggest tool, and that draws a wall.",
    incumbent: null,
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
}));

/** The whole market: the seven real, dated contracts plus the minimum depth behind them. */
export const MARKET: readonly FreeAgent[] = [...BOARD, ...MINIMUM_MARKET];
