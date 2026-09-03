/**
 * MODULE 1 · "THE SAME LINE" — THE ENGINE.
 *
 * Pure functions. No state, no clock, no randomness, no I/O. Everything the
 * lesson claims about money is computed here and nowhere else, so a sweep can
 * enumerate the whole reachable action space without booting a server, and so
 * the reveal, the student view, the teacher panel and the harness cannot
 * disagree about arithmetic.
 *
 * THE ONE PREDICATE. `legalOffers(club)` is the only place that decides what a
 * club may do. The student surface dims a card with it, the reducer refuses an
 * action with it, the teacher panel counts options with it, and the sweep
 * enumerates with it. A second copy of this logic anywhere is how a product
 * ends up telling a student a move is legal and then refusing it.
 *
 * WHAT MAKES THIS LESSON WORK, IN ONE PARAGRAPH. Five lines are drawn in the
 * same place for every club in the room. A club's position relative to those
 * lines determines not how much money it has but WHICH TOOLS EXIST for it —
 * and the tools are not a smooth ladder of money, they are categorically
 * different objects with different ceilings, different terms, and different
 * side effects. So the same player costs two clubs two completely different
 * things, and the cheaper club is not always the one that gets him.
 */
import {
  BOARD,
  CLUB,
  LINE,
  RAISES,
  ROSTER,
  TOOL,
  bandOf,
  type Band,
  type ClubId,
  type FreeAgent,
  type JobRole,
  type ToolId,
} from "./world.js";

/* ---------------------------------------------------------- club position -- */

/**
 * A club's live financial position inside one signing window.
 *
 * `wall` is the mechanic the dossier calls the best in the system: no club is
 * assigned a wall. Using a restricted tool CONVERTS a line into a wall for the
 * rest of the year. It is null until the club does that to itself.
 */
export type Position = {
  readonly clubId: ClubId;
  readonly committed: number;
  readonly slots: number;
  /** Tools already spent this window. A tool is a one-shot object, not a budget. */
  readonly spent: readonly ToolId[];
  /**
   * Whether this club has given up its cap room to operate over the cap.
   *
   * A real and routine decision, and at these clubs the sharpest one on the
   * board. A club with a few million of room may keep it — and be able to sign
   * nobody with it — or renounce it and pick up the big exception, which is
   * worth several times more. "Cap space" sounds like the good outcome and
   * frequently is not, which is the false intuition this seat exists to break.
   * Irreversible for the window: you cannot look at what the room did and then
   * change your mind about which club you were.
   */
  readonly overCapDeclared: boolean;
  /** The line this club has converted into an absolute wall, or null. */
  readonly wall: number | null;
  /** Jobs still open, in the club's own order. */
  readonly openJobs: readonly JobRole[];
  /** Signings made, oldest first. */
  readonly signings: readonly Signing[];
};

export type Signing = {
  readonly playerId: string;
  readonly name: string;
  readonly role: JobRole;
  readonly annual: number;
  readonly tool: ToolId;
  readonly years: number;
  /** The last season this job is covered through, as a season label. */
  readonly coveredThrough: string;
};

export function openingPosition(clubId: ClubId): Position {
  const club = CLUB[clubId];
  return {
    clubId,
    committed: club.committed.value,
    slots: club.contracts.value,
    spent: [],
    overCapDeclared: false,
    wall: null,
    openJobs: club.jobs,
    signings: [],
  };
}

/* ------------------------------------------------------------- the tools -- */

export type Offer = {
  readonly playerId: string;
  readonly tool: ToolId;
  readonly annual: number;
};

/**
 * How far past the wall this tool would leave the club, or 0 when it would not.
 *
 * THE RULE THIS ENCODES, AND WHY IT IS NOT A DESIGN CHOICE. A hard cap is not a
 * penalty a club takes on and then lives above. The apron limitations bind on
 * the club's position AFTER the transaction: a first-apron-restricted move is
 * prohibited outright "if the Team's Apron Team Salary exceeds the applicable
 * Apron Threshold after executing the transaction"
 * (cbaguide.com/thresholds/apron, read 2026-09-03; the same post-transaction
 * test the trade-matching rule uses, corrected in `world.ts` S1).
 *
 * We shipped this wrong. `applySigning` drew the wall at the line regardless of
 * where the signing landed the club, so a club already past the apron could use
 * the big exception, draw a wall BEHIND itself, and be unable to sign anybody —
 * not even a minimum — for the rest of the window. At Boston and Sacramento
 * that was ten of the eleven reachable players at the price the product
 * pre-filled: a quarter of a sixteen-desk room eliminated in minute three by
 * making the obvious move. It was also, simply, an illegal transaction being
 * offered to a child as the recommended one.
 *
 * Making it a ceiling rather than a rejection is deliberate. The student does
 * not discover the wall by being refused; they see the tool's reach shortened
 * by the wall before they choose, which is what a real front office sees.
 */
function wallHeadroom(tool: ToolId, p: Position): number | null {
  const line = TOOL[tool].drawsWallAt;
  if (line === null) return null;
  return LINE[line] - p.committed;
}

/** What one tool can pay this club right now, or null when the tool is unavailable. */
export function ceilingOf(tool: ToolId, p: Position, player?: FreeAgent): number | null {
  const raw = rawCeilingOf(tool, p, player);
  if (raw === null) return null;
  const headroom = wallHeadroom(tool, p);
  if (headroom === null) return raw;
  // The tool cannot be used at all if the club is already at or past the line
  // it would convert into a wall.
  if (headroom <= 0) return null;
  const capped = Math.min(raw, headroom);
  // A minimum deal is a fixed charge, not a number the club sets, so it cannot
  // be shaved to fit under a wall — it either fits or the tool is unavailable.
  // (No minimum-scale tool draws a wall today; this keeps that true if one does.)
  if (tool === "minimum") return raw <= headroom ? raw : null;
  return capped > 0 ? capped : null;
}

function rawCeilingOf(tool: ToolId, p: Position, player?: FreeAgent): number | null {
  if (p.slots >= ROSTER.windowMax) return null;
  if (p.spent.includes(tool)) return null;
  // A minimum-market body is a minimum contract and nothing else. Spending an
  // exception on one would be legal in the CBA and absurd in the lesson: it
  // would let a club burn its big exception on the cheapest thing available and
  // call that a decision, and it put the generic bodies on the ladder the
  // ladder property measures.
  if (player?.generic && tool !== "minimum") return null;
  const overApron1 = p.committed >= LINE.apron1;
  const overApron2 = p.committed >= LINE.apron2;

  switch (tool) {
    case "room": {
      // Cap room is not a tool you "have" — it is the gap, and it closes as you
      // use it. A club at or over the cap has none, whatever else is true, and
      // neither has one that gave its room up on purpose.
      if (p.overCapDeclared) return null;
      const room = LINE.cap - p.committed;
      return room > 0 ? room : null;
    }
    case "ntmle": {
      // Confiscated at the first apron. This is the line's whole meaning.
      if (overApron1) return null;
      // And it is not a tool an under-cap club has at all: below the cap you
      // spend room, and the room exception is what is left afterwards. A club
      // that wants the big exception has to stop being an under-cap club.
      const overTheCap = p.committed >= LINE.cap || p.overCapDeclared;
      return overTheCap ? TOOL.ntmle.ceiling : null;
    }
    case "roomMle":
      // Only exists once the club has actually spent room (S2).
      return p.spent.includes("room") ? TOOL.roomMle.ceiling : null;
    case "taxMle":
      // Prohibited past the last line (S3).
      return overApron2 ? null : TOOL.taxMle.ceiling;
    case "bae":
      return overApron1 ? null : TOOL.bae.ceiling;
    case "minimum":
      // Always, and only for a player whose real deal was a stated veteran
      // minimum. The charge is the team-cost cap: the club pays that, the
      // player is paid the full minimum for his years of service, and the
      // league covers the difference. So a minimum-scale player is reachable by
      // every club past every line, for less than he is paid — which is exactly
      // why no club in this lesson is ever completely stuck.
      // Asked about a specific player, this is an eligibility question: only a
      // player whose real deal was a stated veteran minimum can be signed this
      // way. Asked in general — `pocketsFor`, the panel that tells a desk what
      // it still holds — it is a question about the TOOL, and the answer is
      // that the minimum is always there. Returning null to the general
      // question told every club, on every screen, that the one tool no line
      // can take away from it was unavailable.
      return player === undefined ? TOOL.minimum.ceiling : player.minimumScale ? TOOL.minimum.ceiling : null;
    case "bird":
      // The one thing the second apron does not take: you may keep your own.
      // Available only for a player whose rights this club already holds.
      return player && player.incumbent === p.clubId ? player.ask.value : null;
  }
}

/**
 * Would this signing be legal, and if not, in the product's own words, why not.
 *
 * The reason string is rendered to the student on a dimmed card. It never says
 * "invalid" — it names the constraint, because naming the constraint is the
 * lesson.
 */
export type Legality = { ok: true } | { ok: false; reason: string };

export function checkOffer(p: Position, offer: Offer, player: FreeAgent): Legality {
  if (p.slots >= ROSTER.windowMax) {
    return { ok: false, reason: `You already have ${ROSTER.windowMax} players under contract. There is no room for anyone else until the season starts.` };
  }
  const ceiling = ceilingOf(offer.tool, p, player);
  if (ceiling === null) {
    return { ok: false, reason: unavailableReason(offer.tool, p) };
  }
  if (offer.annual <= 0) return { ok: false, reason: "An offer has to be for some money." };
  if (offer.tool === "minimum") {
    // A minimum deal is not a number you choose. The player is paid the league
    // minimum for his years of service; the club is charged the team-cost cap
    // and the league pays the rest. There is nothing to bid, which is exactly
    // what makes it the tool that is always there.
    if (offer.annual !== TOOL.minimum.ceiling) {
      return { ok: false, reason: `A minimum deal always costs you ${money(TOOL.minimum.ceiling!)}. It is not an amount you set.` };
    }
  } else if (offer.annual < player.ask.value) {
    return {
      ok: false,
      reason: `${player.name} will not sign for less than ${money(player.ask.value)}.`,
    };
  }
  if (offer.annual > ceiling) {
    const line = TOOL[offer.tool].drawsWallAt;
    const headroom = wallHeadroom(offer.tool, p);
    // When the wall is what shortened the tool, say so. "The most you can offer
    // is $5.4M" is a number; "the wall this draws is $5.4M away" is the lesson.
    if (line !== null && headroom !== null && headroom === ceiling) {
      return {
        ok: false,
        reason: `${TOOL[offer.tool].label} draws a wall at ${money(LINE[line])}. You are ${money(headroom)} short of it, so that is the most this tool can pay anybody — one more dollar and the signing would put you past a line you would not be allowed to cross.`,
      };
    }
    return {
      ok: false,
      reason: `The most you can offer with ${TOOL[offer.tool].label} is ${money(ceiling)}.`,
    };
  }
  if (p.wall !== null && p.committed + offer.annual > p.wall) {
    return {
      ok: false,
      reason: `You drew a wall at ${money(p.wall)} earlier in this window. This signing would take you past it, and you may not cross it for any reason.`,
    };
  }
  return { ok: true };
}

function unavailableReason(tool: ToolId, p: Position): string {
  const band = bandOf(p.committed);
  // Checked before the per-tool reasons: when a club is already past the line a
  // tool would wall it at, that is the binding constraint and nothing else is.
  const headroom = wallHeadroom(tool, p);
  const line = TOOL[tool].drawsWallAt;
  if (headroom !== null && headroom <= 0 && line !== null && !p.spent.includes(tool)) {
    return `${TOOL[tool].label} draws a wall at ${money(LINE[line])}, and you are already past it. You cannot use it at all.`;
  }
  switch (tool) {
    case "room":
      return `You are over ${money(LINE.cap)}, so you have no cap room. Over the cap you may only sign people the rules give you special permission to sign.`;
    case "ntmle":
      if (p.spent.includes("ntmle")) return "You have already used your big exception this window.";
      if (p.spent.includes("room")) return "You spent cap room, which costs you the big exception. You have the leftover exception instead.";
      return `You are past the first apron, and past that line the league takes the big exception away from you.`;
    case "roomMle":
      return "The leftover exception only exists after you have spent cap room.";
    case "taxMle":
      if (p.spent.includes("taxMle")) return "You have already used your small exception this window.";
      return "You are past the last line. Past it, no exception of any kind is allowed.";
    case "bae":
      if (p.spent.includes("bae")) return "You have already used this exception.";
      return "You are past the first apron, and past that line this exception is gone too.";
    case "minimum":
      return `You already have ${ROSTER.windowMax} players under contract.`;
    case "bird":
      return "He is not your player. Only the club that already holds his rights may keep him this way.";
  }
  // Exhaustive above; band is read only to keep the reason honest if a tool is added.
  return `Not available from where you are (${band}).`;
}

/**
 * THE BID GRID — the price points the sweep enumerates for one club.
 *
 * The student types a free number; a sweep cannot. So the harness enumerates a
 * grid, and the grid has to be fine enough that it cannot miss a winning
 * threshold sitting between two of its rungs. `BID_STEP` is that resolution.
 *
 * It is deliberately NOT the student's granularity. The student may type any
 * whole dollar; the grid exists so an exhaustive proof is finite, and every
 * property the harness asserts is a property of the grid's coarser space, which
 * is a subset of the student's. A dominance the grid finds is real. A dominance
 * the grid misses is the one risk, and it is bounded by the step.
 */
export const BID_STEP = 250_000;

/**
 * Every legal, materially different offer this club could make right now.
 *
 * Two things make an offer "materially different". The TOOL: the same
 * $3,000,000 through the big exception and through the small one is the same
 * signing with a different side effect, and the side effect is exactly what the
 * lesson is about. And the PRICE: a player's printed number is what he will
 * ACCEPT, not what he costs. Offer more and you beat a rival to him; offer more
 * and the money is gone. That is the whole decision, and it is why the number
 * the student types is the game rather than a formality.
 */
export function legalOffers(
  p: Position,
  board: readonly FreeAgent[] = BOARD,
  taken: ReadonlySet<string> = new Set(),
): readonly Offer[] {
  return offersAtPrices(p, board, null, taken);
}

/** Everyone this club has already signed. A club never signs the same man twice. */
export function signedBy(p: Position): ReadonlySet<string> {
  return new Set(p.signings.filter((sg) => !sg.playerId.startsWith("min-")).map((sg) => sg.playerId));
}

/**
 * The OUTCOME-DISTINCT offers: every legal signing, priced only at the points
 * where the result can change.
 *
 * Against a known set of rival bids the outcome is a step function of the
 * price. Below the best rival bid you lose him; at or above it you get him; and
 * every dollar past the winning threshold buys nothing and costs something. So
 * only two prices per (player, tool) can ever matter -- the reserve, and the
 * least amount that beats the room -- and enumerating those two is EXHAUSTIVE
 * OVER OUTCOMES rather than a sample of a grid.
 *
 * That distinction is the whole reason this is a proof. A $250,000 grid across
 * three days is on the order of 10^8 plans per seat and cannot be run at all;
 * a grid coarse enough to run can step straight over a winning threshold and
 * miss the dominance living there. Boundaries have neither problem.
 *
 * `rivalBids` maps a player id to the best price any other desk is offering him
 * today. Pass null when no environment is known, and the reserve and the
 * ceiling are used as the two ends of the interval.
 */
export function offersAtPrices(
  p: Position,
  board: readonly FreeAgent[],
  rivalBids: ReadonlyMap<string, { value: number; annual: number }> | null,
  taken: ReadonlySet<string> = new Set(),
): readonly Offer[] {
  const out: Offer[] = [];
  for (const player of board) {
    // A SIGNED PLAYER IS GONE, FOR EVERYONE, FOR GOOD.
    //
    // Not a nicety — its absence was making the whole lesson degenerate. With
    // nothing removing a signed man from the board, the best plan at a club
    // past the first apron was to sign the single cheapest player on it three
    // times over and close three different holes with three copies of one
    // person. The sweep reported that seat's entire Pareto frontier as one
    // point and it took a plan dump to see why. The minimum market is the sole
    // exception, because its whole premise is that there is always somebody.
    if (!player.generic && taken.has(player.id)) continue;
    const reserve = player.ask.value;
    for (const tool of Object.keys(TOOL) as ToolId[]) {
      const ceiling = ceilingOf(tool, p, player);
      if (ceiling === null) continue;
      if (tool === "minimum") {
        // Exactly one price, and it is not the player's ask.
        const min: Offer = { playerId: player.id, tool, annual: ceiling };
        if (checkOffer(p, min, player).ok) out.push(min);
        continue;
      }
      if (ceiling < reserve) continue; // cannot even meet what he will accept
      const prices = new Set<number>([reserve]);
      if (rivalBids === null) {
        prices.add(ceiling);
      } else {
        const best = rivalBids.get(player.id);
        if (best !== undefined) {
          // Walk up from the reserve until this tool's total value clears the
          // rival's. Bounded by the ceiling, so a tool that cannot win at any
          // price simply contributes its reserve and nothing more.
          for (let annual = reserve; annual <= ceiling; annual += BID_STEP) {
            if (offerValue({ playerId: player.id, tool, annual }, player, player.incumbent === p.clubId) > best.value) {
              prices.add(annual);
              break;
            }
          }
        }
      }
      for (const annual of prices) {
        const candidate: Offer = { playerId: player.id, tool, annual };
        if (checkOffer(p, candidate, player).ok) out.push(candidate);
      }
    }
  }
  return out;
}

/** The largest annual salary this club may legally pay anyone right now. */
export function reach(p: Position, board: readonly FreeAgent[] = BOARD): number {
  let best = 0;
  for (const tool of Object.keys(TOOL) as ToolId[]) {
    // `bird` and `minimum` are per-player; they are covered in the loop below.
    if (tool === "bird" || tool === "minimum") continue;
    const c = ceilingOf(tool, p, undefined);
    if (c !== null && c > best) best = c;
  }
  for (const player of board) {
    for (const tool of ["bird", "minimum"] as ToolId[]) {
      const c = ceilingOf(tool, p, player);
      if (c !== null && c > best) best = c;
    }
  }
  return best;
}

/* --------------------------------------------------------------- applying -- */

export const SEASON = 2026;
const seasonLabel = (start: number): string => `${start}-${String((start + 1) % 100).padStart(2, "0")}`;

/**
 * Give up cap room in exchange for the tools an over-the-cap club has.
 *
 * Legal only while the club still has room to give up and has not spent any of
 * it. Once made, it stands for the window: a club cannot watch the market and
 * then retroactively decide which kind of club it was.
 */
export function canDeclareOverCap(p: Position): boolean {
  return !p.overCapDeclared && p.committed < LINE.cap && !p.spent.includes("room");
}

export function declareOverCap(p: Position): Position {
  return { ...p, overCapDeclared: true };
}

/**
 * How many guaranteed years this tool can buy for this player.
 *
 * Shorter than the tool's maximum when the player's real deal was shorter: the
 * module does not invent a longer commitment than the contract it is quoting.
 */
export function yearsFor(tool: ToolId, player: FreeAgent): number {
  // THE TERM COMES FROM THE TOOL, NOT FROM THE PLAYER.
  //
  // An earlier version capped this at the length of the real contract the
  // player actually signed, on the reasoning that the module should not invent
  // a longer commitment than the deal it is quoting. That was conservative in
  // the wrong direction and it silently removed the lesson: for every player
  // whose real deal ran one year, every tool bought one year, so the tool a
  // club reached for changed nothing about what it got. The sweep saw it as a
  // collapsed Pareto frontier at both clubs past the first apron.
  //
  // It is also not how free agency works. Years are negotiated, not a property
  // of the person: what the rules fix is the MAXIMUM a given tool may offer —
  // one at the minimum, two with the small exception, four with the big one,
  // five to keep your own. So the term is the tool's, the price is the club's,
  // and the trade-off between covering a job cheaply now and covering it for
  // longer is a real choice with a real cost. Registered as S6.
  const max = TOOL[tool].maxYears;
  return tool === "bird" ? max : max;
}

/**
 * WHAT AN OFFER IS WORTH TO THE PLAYER — total guaranteed dollars, not the
 * first-year number.
 *
 * This is the correction that removed the lesson's dominant strategy, and the
 * reason it is also the truthful model. Comparing offers on first-year salary
 * made a minimum contract indistinguishable from a real one whenever the player
 * would accept the minimum: two clubs, same player, and the one that spent
 * nothing won. So at both clubs past the first apron the best plan was "sign
 * the cheap men at the minimum", it beat everything, and the whole Pareto
 * frontier collapsed onto it.
 *
 * Players do not compare first-year salaries; they compare guaranteed money,
 * and guaranteed money is annual times YEARS. Years are not a free choice —
 * they come with the tool. A minimum deal buys one year. The small exception
 * buys two. The big exception buys four. So the same player, at a similar
 * annual number, is worth several times more from a club willing to spend a
 * real tool on him, and that is why the tool you reach for is the decision
 * rather than a formality.
 */
export function offerValue(offer: Offer, player: FreeAgent, incumbent: boolean): number {
  const years = yearsFor(offer.tool, player);
  const raise = incumbent ? RAISES.incumbent.value : RAISES.rival.value;
  let total = 0;
  let annual = offer.annual;
  for (let y = 0; y < years; y += 1) {
    total += annual;
    annual *= 1 + raise;
  }
  return Math.round(total);
}

/** Apply a won signing to a position. Pure; returns a new Position. */
/**
 * What this club could still do AFTER making this signing.
 *
 * The lesson's sharpest seats — Sacramento against the first apron, New York
 * and Minnesota against the second — can make exactly one signing and then are
 * finished for the window. That is not a bug and it is not unfair: it is what
 * a club a few million under a hard cap actually faces, and it is the single
 * best piece of economics in the module.
 *
 * What was unfair was that it happened in silence. The pair clicked the tool
 * the product had chosen for them, at the price the product had filled in, and
 * discovered two days later that every row was grey. So the product now
 * computes the consequence BEFORE the click, says it in the composer, and
 * refuses to auto-select a terminating tool when a non-terminating one reaches
 * the same player.
 *
 * `terminal` means: after this, there is no legal signing of anyone left.
 */
export type Outlook = {
  readonly movesLeft: number;
  readonly terminal: boolean;
  readonly wallAt: number | null;
  /** Distance from the post-signing position to the wall, when one is drawn. */
  readonly roomToWall: number | null;
};

export function outlookAfter(
  p: Position,
  player: FreeAgent,
  offer: Offer,
  board: readonly FreeAgent[],
  taken: ReadonlySet<string>,
): Outlook {
  const after = applySigning(p, player, offer);
  const gone = new Set(taken);
  gone.add(player.id);
  let movesLeft = 0;
  for (const q of board) {
    if (!q.generic && gone.has(q.id)) continue;
    if (legalOffers(after, [q], gone).length > 0) movesLeft++;
  }
  return {
    movesLeft,
    terminal: movesLeft === 0,
    wallAt: after.wall,
    roomToWall: after.wall === null ? null : after.wall - after.committed,
  };
}

export function applySigning(p: Position, player: FreeAgent, offer: Offer): Position {
  const tool = TOOL[offer.tool];
  const spent: ToolId[] = [...p.spent];
  // A minimum deal never runs out; every other tool is one-shot.
  if (offer.tool !== "minimum") spent.push(offer.tool);
  // S2: spending room closes the two big exceptions and opens the leftover one.
  if (offer.tool === "room") {
    if (!spent.includes("ntmle")) spent.push("ntmle");
    if (!spent.includes("bae")) spent.push("bae");
  }
  const wallLine = tool.drawsWallAt ? LINE[tool.drawsWallAt] : null;
  const wall = wallLine === null ? p.wall : p.wall === null ? wallLine : Math.min(p.wall, wallLine);

  const years = yearsFor(offer.tool, player);
  const openJobs = [...p.openJobs];
  // A MINIMUM BODY FILLS A ROSTER SPOT AND DOES NOT CLOSE A JOB.
  //
  // The sweep caught this as a dominant strategy and it is worth naming
  // precisely, because the version that was wrong looked reasonable. When a
  // generic minimum signing closed a job exactly as a real signing did, "fill
  // both your holes with minimum bodies" strictly dominated every other plan at
  // both clubs past the first apron: identical job coverage, a fraction of the
  // money, no wall drawn. Their whole Pareto frontier collapsed to that one
  // point.
  //
  // It is also economically false, and it is the false lesson a ten-year-old
  // would take straight out of the room: that a roster hole and a roster spot
  // are the same thing. They are not. A minimum veteran keeps you legal — he
  // counts against the fourteen you must carry, and his salary counts toward
  // the floor — and he does not fix the reason you had an opening. Closing a
  // job takes a real signing, reaching a real signing takes a real tool, and
  // which tools you have is what the lines decide. That chain IS the lesson.
  if (!player.generic) {
    const jobIndex = openJobs.indexOf(player.role);
    if (jobIndex >= 0) openJobs.splice(jobIndex, 1);
  }

  return {
    ...p,
    committed: p.committed + offer.annual,
    slots: p.slots + 1,
    spent,
    wall,
    openJobs,
    signings: [
      ...p.signings,
      {
        playerId: player.id,
        name: player.name,
        role: player.role,
        annual: offer.annual,
        tool: offer.tool,
        years,
        coveredThrough: seasonLabel(SEASON + years - 1),
      },
    ],
  };
}

/* ------------------------------------------------------------ the market -- */

/**
 * Resolve one signing day across every desk at once.
 *
 * Deterministic, and the tie-breaks are IN THE MODEL rather than in arrival
 * order. A market that awards a contested player to whoever's packet landed
 * first teaches that the way to win is to click quickly, which is the opposite
 * of the lesson.
 *
 * The order is the real one:
 *   1. the highest annual salary wins;
 *   2. at equal annual, the club that already holds his rights wins, because
 *      it may offer more years at a faster raise, so its offer is worth more
 *      money to the player even at the same first-year number (RAISES);
 *   3. at equal annual with no incumbent, the club that would still have the
 *      most room left after signing wins — the player takes the club that can
 *      still build around him;
 *   4. club id, alphabetically, documented and asserted to be rare.
 */
export type DayOffer = { readonly clubId: ClubId; readonly offer: Offer };

export type Award = {
  readonly playerId: string;
  readonly name: string;
  readonly winner: ClubId;
  readonly annual: number;
  readonly tool: ToolId;
  /** Which rule decided it. `tiebreak-id` is the one that must stay rare. */
  readonly decidedBy: "highest" | "incumbent" | "room-left" | "tiebreak-id";
  readonly contested: number;
};

export function resolveDay(
  positions: ReadonlyMap<ClubId, Position>,
  offers: readonly DayOffer[],
  board: readonly FreeAgent[] = BOARD,
  taken: ReadonlySet<string> = new Set(),
): { awards: readonly Award[]; positions: ReadonlyMap<ClubId, Position>; taken: ReadonlySet<string> } {
  const byPlayer = new Map<string, DayOffer[]>();
  for (const d of offers) {
    const list = byPlayer.get(d.offer.playerId) ?? [];
    list.push(d);
    byPlayer.set(d.offer.playerId, list);
  }

  const awards: Award[] = [];
  const next = new Map(positions);
  const gone = new Set(taken);

  // Players are resolved in board order so the whole day is reproducible.
  for (const player of board) {
    if (!player.generic && gone.has(player.id)) continue;
    if (player.generic) {
      // The minimum market has depth: every desk that reached for one gets one,
      // because in the real league there is always somebody at the minimum.
      // Contesting a bottomless supply would be a scarcity the model does not
      // have, and inventing one is the thing this harness exists to catch.
      for (const bid of byPlayer.get(player.id) ?? []) {
        const pos = next.get(bid.clubId);
        if (!pos) continue;
        next.set(bid.clubId, applySigning(pos, player, bid.offer));
        awards.push({
          playerId: player.id,
          name: player.name,
          winner: bid.clubId,
          annual: bid.offer.annual,
          tool: bid.offer.tool,
          decidedBy: "highest",
          contested: 1,
        });
      }
      continue;
    }
    const bids = byPlayer.get(player.id);
    if (!bids || bids.length === 0) continue;

    let best = bids[0]!;
    let decidedBy: Award["decidedBy"] = "highest";
    for (const bid of bids.slice(1)) {
      const cmp = compareBids(bid, best, player, positions);
      if (cmp.better) {
        best = bid;
        decidedBy = cmp.by;
      }
    }
    // With one bid nothing was decided by a tie-break.
    if (bids.length === 1) decidedBy = "highest";

    const winnerPos = next.get(best.clubId);
    if (!winnerPos) continue;
    next.set(best.clubId, applySigning(winnerPos, player, best.offer));
    gone.add(player.id);
    awards.push({
      playerId: player.id,
      name: player.name,
      winner: best.clubId,
      annual: best.offer.annual,
      tool: best.offer.tool,
      decidedBy,
      contested: bids.length,
    });
  }
  return { awards, positions: next, taken: gone };
}

function compareBids(
  a: DayOffer,
  b: DayOffer,
  player: FreeAgent,
  positions: ReadonlyMap<ClubId, Position>,
): { better: boolean; by: Award["decidedBy"] } {
  const av = offerValue(a.offer, player, player.incumbent === a.clubId);
  const bv = offerValue(b.offer, player, player.incumbent === b.clubId);
  if (av !== bv) return { better: av > bv, by: "highest" };
  if (a.offer.annual !== b.offer.annual) {
    return { better: a.offer.annual > b.offer.annual, by: "highest" };
  }
  const aIncumbent = player.incumbent === a.clubId;
  const bIncumbent = player.incumbent === b.clubId;
  if (aIncumbent !== bIncumbent) return { better: aIncumbent, by: "incumbent" };

  const roomAfter = (d: DayOffer): number => {
    const p = positions.get(d.clubId);
    if (!p) return -Infinity;
    const after = p.committed + d.offer.annual;
    const ceiling = p.wall ?? LINE.apron2;
    return ceiling - after;
  };
  const ra = roomAfter(a);
  const rb = roomAfter(b);
  if (ra !== rb) return { better: ra > rb, by: "room-left" };

  return { better: a.clubId < b.clubId, by: "tiebreak-id" };
}

/* ------------------------------------------------------- window settlement -- */

/**
 * What the window costs a club after the last day, whatever it did.
 *
 * These are the real anti-gaming backstops, and they are why "sign nobody" is
 * not a free strategy: an empty roster is charged for, a short roster is filled
 * at the minimum, and a club under the floor pays the shortfall to the players
 * anyway. Money you refuse to spend on your own team is money you spend on
 * everybody else's.
 */
export type Settlement = {
  readonly committedBefore: number;
  readonly emptySlotCharge: number;
  readonly autoSignings: number;
  readonly autoSigningCost: number;
  readonly committedAfter: number;
  readonly floorShortfall: number;
  readonly band: Band;
};

export function settle(p: Position): Settlement {
  const emptySlots = Math.max(0, ROSTER.backstopAt - p.slots);
  const emptySlotCharge = emptySlots * ROSTER.emptySlotCharge.value;

  const autoSignings = Math.max(0, ROSTER.min - Math.max(p.slots, ROSTER.backstopAt));
  const autoSigningCost = autoSignings * ROSTER.emptySlotCharge.value;

  const committedAfter = p.committed + emptySlotCharge + autoSigningCost;
  const floorShortfall = Math.max(0, LINE.floor - committedAfter);
  return {
    committedBefore: p.committed,
    emptySlotCharge,
    autoSignings,
    autoSigningCost,
    committedAfter,
    floorShortfall,
    band: bandOf(committedAfter),
  };
}

/* ---------------------------------------------------------- the readings -- */

/**
 * WHAT THE CLASS COMPARES.
 *
 * BC-1 is the charter's first item and it exists because the winning design's
 * reveal measured what a club HAD rather than what it DID: two of its five
 * readings were topped by the club that did nothing, which is how passivity
 * survived the domination test. Every reading below is a function of actions
 * taken inside the window. None is computable from the opening position alone,
 * and the sweep asserts that.
 *
 * There is no total, no rank and no combining function anywhere. Five different
 * questions with five different answers is the point: a desk can top one and be
 * last on another, and the argument that starts there is the lesson.
 */
export type Readings = {
  /** How many of your two open jobs you closed. */
  readonly jobsClosed: number;
  /** Job-years bought: the sum of the terms of the deals that closed a job. */
  readonly jobYears: number;
  /** The cheapest annual salary at which this desk closed a job. Infinity if none. */
  readonly cheapestJobClosed: number;
  /**
   * Contested players won. COMPUTED, and deliberately NOT one of the five
   * class-facing readings.
   *
   * It was, and the sweep showed why it could not be. A club past the first
   * apron can offer two guaranteed years where an under-cap club can offer
   * four, so it loses every bidding war it enters — Minnesota scored zero on
   * this across all 359 of its reachable plans. A reading a seat can never
   * move is not a reading of what that desk DID; it is its inherited position
   * wearing an activity label, which is the exact defect BC-1 exists to
   * prevent. It stays in the model because the reveal has real things to say
   * about who lost what to whom, and it stays off the board.
   */
  readonly contestedWon: number;
  /**
   * THE LONGEST COMMITMENT — the term of the longest deal this desk signed.
   *
   * The fifth class-facing reading, and the win-now-versus-later axis in its
   * purest form. Every seat can move it, because the term comes from the tool
   * and every seat has at least two tools with different terms: one year at
   * the minimum, two with the small exception, four with the big one, five to
   * keep your own. And it pulls directly against room left, which is what makes
   * the pair of them an argument rather than a scoreboard.
   */
  readonly longestCommitment: number;
  /** Did this desk end the window with a wall it drew itself? */
  readonly drewWall: boolean;
  /** What the window cost, above what the club already owed. */
  readonly spent: number;
  /**
   * ROOM LEFT — the dollars between where this club finished and the next line
   * above it, or its own wall if it drew one lower.
   *
   * The reading the frontier was missing, and its absence was teaching the
   * exact false lesson this module exists to break. With jobs, years, contests
   * and walls on the board but nothing measuring what a signing COSTS, the best
   * plan at every constrained seat was to sign everybody at the highest price
   * available: money was free, so more of it was never worse. Every one of
   * those seats reported a Pareto frontier of one point.
   *
   * Spending does not cost you an abstract number. It costs you the distance to
   * the next line, and the distance to the next line is what your February
   * looks like. So this is the true opposite of closing another job, it is a
   * function of what the desk DID rather than what it was dealt (BC-1), and it
   * is the quantity a student can be asked to defend giving up.
   */
  readonly roomLeft: number;
};

export function readingsFor(opening: Position, closing: Position, awards: readonly Award[]): Readings {
  const jobsClosedList = closing.signings.filter((s) => opening.openJobs.includes(s.role));
  // A club with two open BIG jobs cannot close three of them; count distinct.
  const openCounts = new Map<JobRole, number>();
  for (const role of opening.openJobs) openCounts.set(role, (openCounts.get(role) ?? 0) + 1);
  let jobsClosed = 0;
  let jobYears = 0;
  let cheapest = Infinity;
  for (const s of jobsClosedList) {
    const left = openCounts.get(s.role) ?? 0;
    if (left <= 0) continue;
    openCounts.set(s.role, left - 1);
    jobsClosed += 1;
    jobYears += s.years;
    if (s.annual < cheapest) cheapest = s.annual;
  }
  const mine = new Set(closing.signings.map((s) => s.playerId));
  // The next line above where this club finished — the one its next move would
  // have to clear — or its own wall, if it drew one lower than that.
  const above = [LINE.cap, LINE.tax, LINE.apron1, LINE.apron2].find((l) => l > closing.committed) ?? LINE.apron2;
  const ceiling = closing.wall !== null ? Math.min(closing.wall, above) : above;
  const roomLeft = Math.max(0, ceiling - closing.committed);
  const contestedWon = awards.filter((a) => a.winner === closing.clubId && a.contested > 1 && mine.has(a.playerId)).length;
  const longestCommitment = closing.signings.reduce((m, sg) => Math.max(m, sg.years), 0);
  return {
    jobsClosed,
    jobYears,
    cheapestJobClosed: cheapest,
    contestedWon,
    longestCommitment,
    drewWall: closing.wall !== null,
    spent: closing.committed - opening.committed,
    roomLeft,
  };
}

/** The five class-facing readings, in the order the projector shows them. */
export const READING_IDS = ["jobsClosed", "jobYears", "cheapestJobClosed", "longestCommitment", "roomLeft"] as const;
export type ReadingId = (typeof READING_IDS)[number];

/* ----------------------------------------------------------------- format -- */

/** The one money formatter. Whole dollars, grouped — never a percentage, never a negative. */
export function money(n: number): string {
  const rounded = Math.round(n);
  return "$" + Math.abs(rounded).toLocaleString("en-US");
}

/** Dollars in millions to one decimal, for a bar label where the full figure will not fit. */
export function millions(n: number): string {
  return "$" + (Math.round(n / 100_000) / 10).toFixed(1) + "M";
}

export { RAISES, bandOf };
