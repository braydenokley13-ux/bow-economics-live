/**
 * MODULE 1 · LESSON 2 — "THE SEASON" — DATA.
 *
 * Sourced from `docs/gauntlet/module-1/rebuild/W2_SEASON_RESEARCH.md` (read
 * 2026-09-04). Two tables: the job report (§1, authored per named player from
 * `world.ts`'s own BOARD) and the February market (§2, real 2026 in-season
 * waivers). Both are DEALT in arrival — every desk gets whatever it gets —
 * and BY-CHOICE in content: what the report says depends on whom the desk
 * signed in July; what the February market refuses depends on the wall the
 * desk drew in July.
 *
 * A VERDICT IS A PURE FUNCTION OF THE PLAYER, NEVER OF THE DEAL. The research
 * is explicit and repeated: "Verdicts are authored from the dated fact on his
 * own card and from nothing else — never from what the desk paid, never from
 * a die." `JOB_REPORTS` is keyed by playerId alone; nothing here reads an
 * `annual`, a `tool` or a `years` to decide a verdict, by construction — a
 * desk that overpaid and a desk that got the exact same man at the exact same
 * price always read the exact same report, which is the whole point of
 * DECISION QUALITY vs OUTCOME.
 *
 * THREE CARDS GENUINELY DO NOT RESOLVE ONE WAY on the evidence alone (research
 * §1: Simons, Oubre, Nurkic). Those three, and only those three, branch on
 * `hash(sessionId, playerId)` — deterministic per room, so a re-run of the
 * same class reproduces the exact same report, and different rooms may
 * legitimately disagree about a genuinely ambiguous man.
 */
import type { JobRole } from "./world.js";

export type JobVerdict = "DOES_MORE_THAN_THE_JOB" | "DOES_THE_JOB" | "DOES_NOT_DO_THE_JOB";

export type JobReportCard = {
  readonly playerId: string;
  readonly role: JobRole;
  readonly verdict: JobVerdict;
  /** The sentence a student reads. Grade-neutral; both bands read the same fact. */
  readonly sentence: string;
};

type FixedEntry = { readonly kind: "fixed"; readonly card: JobReportCard };
type BranchEntry = {
  readonly kind: "branch";
  readonly role: JobRole;
  readonly a: { readonly verdict: JobVerdict; readonly sentence: string };
  readonly b: { readonly verdict: JobVerdict; readonly sentence: string };
};

/**
 * A tiny, stable string hash (FNV-1a, 32-bit). Not cryptographic and not meant
 * to be: the only property this needs is "the same two strings always produce
 * the same bit", so the same session asks the same ambiguous card the same
 * question every time it is read, and a different session is free to land on
 * the other branch.
 */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** `true` picks branch A, `false` picks branch B. Exported so a test can assert both branches are reachable. */
export function branchPick(sessionId: string, playerId: string): boolean {
  return fnv1a(`${sessionId}:${playerId}`) % 2 === 0;
}

/**
 * THE FOURTEEN AUTHORED CARDS (research §1: 5 MORE, 4 DOES, 5 NOT) plus the
 * three seeded branches. Every named player on `world.ts`'s BOARD has exactly
 * one entry here. The three generic MINIMUM_MARKET bodies are handled
 * separately (`genericReport`) — inventing a scouting verdict for a body with
 * no name would be inventing a person, the one thing this module refuses to
 * do (`world.ts` MINIMUM_MARKET comment).
 */
const REPORTS: Readonly<Record<string, FixedEntry | BranchEntry>> = {
  vucevic: {
    kind: "fixed",
    card: {
      playerId: "vucevic",
      role: "BIG",
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a big. He started 49 games and scored 15.1 a night.",
    },
  },
  robinson: {
    kind: "fixed",
    card: {
      playerId: "robinson",
      role: "BIG",
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a big. He grabbed 8.8 rebounds in 19.6 minutes and blocked 1.2 shots.",
    },
  },
  achiuwa: {
    kind: "fixed",
    card: {
      playerId: "achiuwa",
      role: "BIG",
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a big. He started 57 games and set career highs in points and rebounds.",
    },
  },
  hardaway: {
    kind: "fixed",
    card: {
      playerId: "hardaway",
      role: "WING",
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a wing. He played 80 games and made .407 of his threes.",
    },
  },
  dosunmu: {
    kind: "fixed",
    card: {
      playerId: "dosunmu",
      role: "GUARD",
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a guard. He played 69 games and made .439 of his threes.",
    },
  },
  watford: {
    kind: "fixed",
    card: {
      playerId: "watford",
      role: "WING",
      verdict: "DOES_THE_JOB",
      sentence: "You signed him to cover a wing. He played 53 games and made .515 of his shots.",
    },
  },
  hayes: {
    kind: "fixed",
    card: {
      playerId: "hayes",
      role: "BIG",
      verdict: "DOES_THE_JOB",
      sentence: "You signed him to cover a big. He played 66 games and made .756 of his shots.",
    },
  },
  okogie: {
    kind: "fixed",
    card: {
      playerId: "okogie",
      role: "WING",
      verdict: "DOES_THE_JOB",
      sentence: "You signed him to cover a wing. He played 78 games and made .385 of his threes.",
    },
  },
  alvarado: {
    kind: "fixed",
    card: {
      playerId: "alvarado",
      role: "GUARD",
      verdict: "DOES_THE_JOB",
      sentence: "You signed him to cover a guard. He played 69 games and set up 3.4 baskets a night.",
    },
  },
  horford: {
    kind: "fixed",
    card: {
      playerId: "horford",
      role: "BIG",
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He is 40 and played 45 games last season. The deal runs a second year at 41.",
    },
  },
  nance: {
    kind: "fixed",
    card: {
      playerId: "nance",
      role: "BIG",
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He played 35 games last season, 12.8 minutes a night, and made .419 of his shots.",
    },
  },
  payton: {
    kind: "fixed",
    card: {
      playerId: "payton",
      role: "GUARD",
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He made .291 of his threes and started one game in 73. The guard job is still open.",
    },
  },
  kuminga: {
    kind: "fixed",
    card: {
      playerId: "kuminga",
      role: "WING",
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He played 36 games of 82 and started 14. He has never started more than 46 in a season.",
    },
  },
  grimes: {
    kind: "fixed",
    card: {
      playerId: "grimes",
      role: "GUARD",
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He started 19 games of 75, and none in the playoffs. You owe him three more years.",
    },
  },
  // THE THREE SEEDED BRANCHES (research §1). Genuinely ambiguous on the
  // evidence itself, so the report asks a real question rather than forcing a
  // verdict the evidence does not support.
  simons: {
    kind: "branch",
    role: "GUARD",
    a: {
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a guard. He scored 14.3 a night off the bench and made .385 from three.",
    },
    b: {
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He started 70 games two seasons ago and five last season. He came off the bench again.",
    },
  },
  oubre: {
    kind: "branch",
    role: "WING",
    a: {
      verdict: "DOES_THE_JOB",
      sentence: "You signed him to cover a wing. He started 41 games and played 31.5 minutes a night.",
    },
    b: {
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He played 50 games of 82. The wing job was open the other 32 nights.",
    },
  },
  nurkic: {
    kind: "branch",
    role: "BIG",
    a: {
      verdict: "DOES_MORE_THAN_THE_JOB",
      sentence: "You signed him to cover a big. He grabbed 10.4 rebounds and passed for 4.8 assists a night.",
    },
    b: {
      verdict: "DOES_NOT_DO_THE_JOB",
      sentence: "He played 41 games of 82, and has topped 60 games once in five seasons.",
    },
  },
};

/** A generic minimum-market body always does the job — a body at a price, never a scouting report. */
export function genericReport(playerId: string, role: JobRole): JobReportCard {
  return { playerId, role, verdict: "DOES_THE_JOB", sentence: "A minimum body, doing a minimum job. Nobody signed him to be more than that." };
}

/**
 * Read the job report for a named player. `sessionId` decides only the three
 * seeded branches; every other card is identical in every room, forever, by
 * construction — this function never reads a price.
 */
export function jobReportFor(sessionId: string, playerId: string, role: JobRole): JobReportCard | null {
  const entry = REPORTS[playerId];
  if (!entry) return playerId.startsWith("min-") ? genericReport(playerId, role) : null;
  if (entry.kind === "fixed") return entry.card;
  const pick = branchPick(sessionId, playerId) ? entry.a : entry.b;
  return { playerId, role: entry.role, verdict: pick.verdict, sentence: pick.sentence };
}

/** Every player id this file has an authored (non-generic) report for. Used by the sweep test. */
export const AUTHORED_PLAYER_IDS: readonly string[] = Object.keys(REPORTS);

/* ------------------------------------------------------- price twins -- */

/**
 * DECISION QUALITY vs OUTCOME, without a die (research §1). Two real prices,
 * one role, one hundred thousand dollars apart, opposite verdicts. The
 * secondary pair is flagged `approx` because Grimes' figure is a 4-year
 * average (`S8-ask-basis` in `world.ts`), not a first-year salary, so a
 * teacher must never present it as an exact-dollar comparison.
 */
export type PriceTwin = {
  readonly role: JobRole;
  readonly a: { readonly playerId: string; readonly name: string; readonly priceText: string; readonly verdict: JobVerdict };
  readonly b: { readonly playerId: string; readonly name: string; readonly priceText: string; readonly verdict: JobVerdict };
  readonly approx: boolean;
};

export const PRICE_TWINS: readonly PriceTwin[] = [
  {
    role: "BIG",
    a: { playerId: "vucevic", name: "Nikola Vucevic", priceText: "$3,900,000", verdict: "DOES_MORE_THAN_THE_JOB" },
    b: { playerId: "nance", name: "Larry Nance Jr.", priceText: "$4,000,000", verdict: "DOES_NOT_DO_THE_JOB" },
    approx: false,
  },
  {
    role: "BIG",
    a: { playerId: "robinson", name: "Mitchell Robinson", priceText: "$15,044,000", verdict: "DOES_MORE_THAN_THE_JOB" },
    b: { playerId: "grimes", name: "Quentin Grimes", priceText: "about $15,000,000", verdict: "DOES_NOT_DO_THE_JOB" },
    approx: true,
  },
] as const;

/* ------------------------------------------------- ten-day / rest-of-season charges -- */

/**
 * WHAT A JANUARY OR FEBRUARY SIGNING ACTUALLY CHARGES.
 *
 * Neither is a full-season minimum, and printing one would overstate the tax
 * clock several-fold and understate the option-value lesson (research §4). A
 * minimum player's charge is subsidised to his years-of-service minimum and
 * then PRORATED to the days actually left; a January ten-day and a
 * late-February rest-of-season deal are two different fractions of one.
 */
export const TEN_DAY_CHARGE = 119_972; // cbaguide.com worked example (Elfrid Payton), read 2026-09-04
export const REST_OF_SEASON_CHARGE = 514_682; // Tyus Jones, Denver, signed 2026-03-05 — hoopsrumors, read 2026-09-04
/** Mason Plumlee's own late-February figure (San Antonio, 2026-02-27) — used on his own card only. */
export const REST_OF_SEASON_CHARGE_LATE = 593_864;

export const MARCH_FIRST_NOTE =
  "March 1 is the real deadline: a player waived after it cannot play in the postseason for a new team. That is why every name on this board was cut in February.";

/* ---------------------------------------------------------- february market -- */

export type FebruaryCandidate = {
  readonly id: string;
  readonly name: string;
  readonly role: JobRole;
  /** The salary he was earning the day he was waived. Decides the apron rule (research §3), never his new price. */
  readonly preWaiverSalary: number;
  readonly preWaiverSalaryVerified: boolean;
  /** What signing him now actually costs, this season, prorated (never a full minimum). */
  readonly ask: number;
  readonly waivedBy: string;
  readonly waivedOn: string;
  readonly why: string;
  readonly source: string;
  readonly verified: boolean;
};

/**
 * THE FEBRUARY MARKET (research §2). Real 2026 in-season waivers, staged into
 * this room's February the same way the July BOARD is staged into one summer
 * (`world.ts` S4). Copy reads "was cut in February 2026", never "is
 * available" (research §6) — six of these eight were still unsigned weeks
 * later in real life, and several will have 2026-27 contracts by the time a
 * class meets them.
 *
 * Chris Paul is deliberately absent: waived by Toronto in February 2026, he
 * announced his retirement, and offering him would be fiction.
 *
 * Ben Simmons is THE SHOCK B CARD — the one card in this market a first-apron
 * desk cannot reach, because his pre-waiver salary was far above the NTMLE.
 * His transaction is dated February 2025 (research §2), a year outside this
 * room's own July, staged in exactly the way the spec allows and flagged so.
 */
export const FEBRUARY_MARKET: readonly FebruaryCandidate[] = [
  {
    id: "feb-simmons",
    name: "Ben Simmons",
    role: "GUARD",
    preWaiverSalary: 40_300_000,
    preWaiverSalaryVerified: false, // "far above the NTMLE" is verified; the exact 2024-25 digit is not (research §2)
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Brooklyn",
    waivedOn: "2025-02-08",
    why: "Three years, 90 games, back surgeries. Both sides wanted out. Bought out by Brooklyn, signed two days later with the Clippers — for a salary the first apron does not let some of these desks match.",
    source: "hoopsrumors.com 2025-02-08 \"Nets Buy Out Ben Simmons\"; 2025-02-10 \"Clippers Sign Ben Simmons\"",
    verified: true,
  },
  {
    id: "feb-ball",
    name: "Lonzo Ball",
    role: "GUARD",
    preWaiverSalary: 10_000_000,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Utah",
    waivedOn: "2026-02-05",
    why: "Traded to Utah and waived the same window. Cleveland paid two second-round picks just to move the salary. Career lows in points and shooting.",
    source: "hoopsrumors.com 2026-02-05 \"Jazz Cut Lonzo Ball, Chris Boucher\"",
    verified: true,
  },
  {
    id: "feb-anderson",
    name: "Kyle Anderson",
    role: "WING",
    preWaiverSalary: 9_200_000,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Memphis",
    waivedOn: "2026-02-26",
    why: "A twelve-year veteran on a rebuilding team, four games removed from a deadline trade. Memphis still owed him $2,300,000 at the buyout.",
    source: "hoopsrumors.com 2026-03-02",
    verified: true,
  },
  {
    id: "feb-sochan",
    name: "Jeremy Sochan",
    role: "WING",
    preWaiverSalary: 7_100_000,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "San Antonio",
    waivedOn: "2026-02-11",
    why: "Out of the rotation since December, at 22. His rookie-scale deal was expiring anyway.",
    source: "hoopsrumors.com 2026-02-11 \"Spurs Agree To Waive Jeremy Sochan\"",
    verified: true,
  },
  {
    id: "feb-jones",
    name: "Tyus Jones",
    role: "GUARD",
    preWaiverSalary: 7_000_000,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Dallas",
    waivedOn: "2026-02-28",
    why: "Salary-dumped twice in one month. Averaged 3.1 points in his last stop before this.",
    source: "hoopsrumors.com 2026-03-05 \"Tyus Jones Signs With Nuggets\"",
    verified: true,
  },
  {
    id: "feb-boucher",
    name: "Chris Boucher",
    role: "BIG",
    preWaiverSalary: 0, // minimum-scale — no real threshold to clear at all
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Utah",
    waivedOn: "2026-02-05",
    why: "Nine games in Boston before a salary-dump trade sent him to Utah, which waived him the same day. Minimum-scale — every club can reach him.",
    source: "hoopsrumors.com 2026-02-05",
    verified: true,
  },
  {
    id: "feb-plumlee",
    name: "Mason Plumlee",
    role: "BIG",
    preWaiverSalary: 0,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE_LATE,
    waivedBy: "Oklahoma City",
    waivedOn: "2026-02-27",
    why: "Third-string center in Charlotte after December groin surgery. A ten-day with San Antonio came first; this is the rest-of-season deal that followed it.",
    source: "hoopsrumors.com 2026-02-17, 2026-02-27",
    verified: true,
  },
  {
    id: "feb-anthony",
    name: "Cole Anthony",
    role: "GUARD",
    preWaiverSalary: 0,
    preWaiverSalaryVerified: true,
    ask: REST_OF_SEASON_CHARGE,
    waivedBy: "Phoenix",
    waivedOn: "2026-02-27",
    why: "Acquired in a salary dump and never reported to the team.",
    source: "hoopsrumors.com 2026-02-27 \"Suns Waive Cole Anthony\"",
    verified: true,
  },
] as const;
