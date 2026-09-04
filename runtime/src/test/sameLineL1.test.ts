/**
 * MODULE 1 LESSON 1 — "THE WINDOW."
 *
 * The economics is proven separately and exhaustively by
 * `scripts/same-line-sweep.mjs`, which enumerates every legal (player, tool,
 * price) triple on every day at every seat against three rival environments at
 * sixteen desks and poisons itself before any result is believed. Nothing here
 * re-litigates that. This file tests the things a sweep cannot see: the gate,
 * the privacy boundary, the fallback, and the two bands.
 *
 * THE GATE IS THE BIG ONE. The runtime does NOT check an action against the
 * current phase — it checks ended, frozen and paused, and calls the reducer.
 * Every "wrong phase" test below is therefore a test of this module and not of
 * the platform, and a module that forgot one of these would accept a signing
 * during the closing argument.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { sameLineL1Module as mod, DAYS, SAME_LINE_L1_ID, forgoneBy, type SameLineL1State } from "../modules/sameLine/l1.js";
import { BOARD, CLUBS, LINE, MARKET, MINIMUM_MARKET, TOOL } from "../modules/sameLine/world.js";
import { applySigning, jobClosingSignings, readingsFor, ceilingOf, checkOffer, legalOffers, offerValue, openingPosition, outlookAfter, yearsFor } from "../modules/sameLine/engine.js";
import { isOrderedSubsequence } from "../shared/phases.js";
import type { CanonicalPhase } from "../shared/phases.js";
import type { GradeBand } from "../shared/gradeBand.js";

const ctx = (phase: CanonicalPhase, seatId: string, seatIds: string[] = [seatId]) => ({
  phase,
  seatId,
  seatIds,
  now: 1_760_000_000_000,
});

function fresh(band: GradeBand = "5-6"): SameLineL1State {
  return mod.initialState({ sessionId: "s", seatIds: [], gradeBand: band });
}

function seat(state: SameLineL1State, seatId: string, phase: CanonicalPhase = "PLAY"): SameLineL1State {
  const r = mod.reduce(state, { type: "takeSeat" }, ctx(phase, seatId));
  assert.ok(r.ok, r.ok ? "" : r.reason);
  return r.state;
}

function seatMany(count: number, band: GradeBand = "5-6"): SameLineL1State {
  let s = fresh(band);
  for (let i = 0; i < count; i += 1) s = seat(s, `seat-${i}`);
  return s;
}

/* ---------------------------------------------------------- the contract -- */

test("the phase list is a legal subsequence of the canonical vocabulary", () => {
  assert.ok(isOrderedSubsequence(mod.phases));
  assert.equal(mod.phases[0], "LOBBY");
});

test("a desk is allocated lazily, because the runtime never says anyone joined", () => {
  // initialState runs once with an empty roster and `join` never enters the
  // module, so a lesson that gives each desk a different starting position has
  // exactly one place to do it: the seat's own first action.
  const empty = fresh();
  assert.equal(Object.keys(empty.desks).length, 0);
  const one = seat(empty, "a");
  assert.equal(Object.keys(one.desks).length, 1);
  assert.ok(one.desks["a"]!.clubId);
});

test("taking a seat twice is idempotent, so a retried action cannot move a pair's club", () => {
  const s1 = seat(fresh(), "a");
  const club = s1.desks["a"]!.clubId;
  const s2 = seat(s1, "a");
  assert.equal(s2.desks["a"]!.clubId, club);
  assert.equal(Object.keys(s2.desks).length, 1);
});

test("sixteen desks fill every club twice — THE TWIN DESK", () => {
  const s = seatMany(16);
  const perClub = new Map<string, number>();
  for (const d of Object.values(s.desks)) perClub.set(d.clubId, (perClub.get(d.clubId) ?? 0) + 1);
  assert.equal(perClub.size, CLUBS.length, "every club is held");
  for (const [club, n] of perClub) assert.equal(n, 2, `${club} is held by ${n} desks, not 2`);
});

test("a small room still spreads across the bands instead of piling onto one", () => {
  // The clubs are listed from the least committed upward, so the first eight
  // desks take one club each rather than eight variations on one position.
  const s = seatMany(8);
  const clubs = new Set(Object.values(s.desks).map((d) => d.clubId));
  assert.equal(clubs.size, 8);
});

/* ----------------------------------------------------------- the gate -- */

test("THE GATE: an offer is refused in every phase except PLAY", () => {
  const s = seat(fresh(), "a");
  const player = BOARD[0]!;
  const offer = { type: "offer", playerId: player.id, tool: "minimum", annual: TOOL.minimum.ceiling };
  for (const phase of mod.phases) {
    const r = mod.reduce(s, offer, ctx(phase, "a"));
    if (phase === "PLAY") continue;
    assert.equal(r.ok, false, `an offer was accepted in ${phase}; the runtime does not check this, the module must`);
  }
});

test("THE GATE: passing, closing the day and moving a reveal beat are each refused outside their phase", () => {
  const s = seat(fresh(), "a");
  for (const phase of mod.phases) {
    if (phase !== "PLAY") {
      assert.equal(mod.reduce(s, { type: "pass" }, ctx(phase, "a")).ok, false, `pass accepted in ${phase}`);
      assert.equal(mod.reduce(s, { type: "teacher:closeDay" }, ctx(phase, "teacher")).ok, false, `close accepted in ${phase}`);
    }
    /* SYNTHESIS joined the beat-walking phases when the naming stage shipped:
       the teacher advances one concept at a time with the same control, so the
       gate is now three phases wide rather than two. Everywhere else the beat
       action is still refused, which is what this line is protecting. */
    if (phase !== "REVEAL" && phase !== "CONSEQUENCE" && phase !== "SYNTHESIS") {
      assert.equal(mod.reduce(s, { type: "teacher:revealNext" }, ctx(phase, "teacher")).ok, false, `beat accepted in ${phase}`);
    }
  }
});

test("an unknown action is refused by name rather than ignored", () => {
  const s = seat(fresh(), "a");
  const r = mod.reduce(s, { type: "definitelyNotAnAction" }, ctx("PLAY", "a"));
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.reason, /definitelyNotAnAction/);
});

test("a desk cannot offer before it has a club", () => {
  const r = mod.reduce(fresh(), { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: 1 }, ctx("PLAY", "nobody"));
  assert.equal(r.ok, false);
});

test("an illegal offer is refused with the constraint named, never with the word invalid", () => {
  let s = seat(fresh(), "a");
  // Find a club that is over the cap so cap room is genuinely unavailable.
  const overCap = Object.values(s.desks).find((d) => d.position.committed >= LINE.cap) ?? null;
  if (!overCap) return;
  const r = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "room", annual: 1_000_000 }, ctx("PLAY", overCap.seatId));
  assert.equal(r.ok, false);
  const reason = r.ok ? "" : r.reason;
  assert.ok(reason.length > 20, "a refusal names the constraint; naming the constraint is the lesson");
  assert.ok(!/invalid|error|failed/i.test(reason), `refusal read as an error rather than a rule: ${reason}`);
});

test("a player who has signed cannot be offered for again, by anyone", () => {
  let s = seatMany(4);
  const seats = Object.keys(s.desks);
  const target = BOARD.find((p) => p.minimumScale)!;
  const r = mod.reduce(s, { type: "offer", playerId: target.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seats[0]!));
  assert.ok(r.ok);
  s = mod.reduce(r.state, { type: "teacher:closeDay" }, ctx("PLAY", "teacher")).ok
    ? (mod.reduce(r.state, { type: "teacher:closeDay" }, ctx("PLAY", "teacher")) as { ok: true; state: SameLineL1State }).state
    : r.state;
  if (!s.taken.includes(target.id)) return; // he was not won; nothing to assert
  const again = mod.reduce(s, { type: "offer", playerId: target.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seats[1]!));
  assert.equal(again.ok, false);
  assert.match(again.ok ? "" : again.reason, /already signed/);
});

/* --------------------------------------------------------------- privacy -- */

test("PRIVACY: the board never carries a seat id, a desk label, or anyone's offer", () => {
  let s = seatMany(6);
  const seats = Object.keys(s.desks);
  for (const [i, seatId] of seats.entries()) {
    const p = BOARD[i % BOARD.length]!;
    const r = mod.reduce(s, { type: "offer", playerId: p.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seatId));
    if (r.ok) s = r.state;
  }
  for (const phase of mod.phases) {
    const json = JSON.stringify(mod.boardView(s, phase));
    for (const seatId of seats) {
      assert.ok(!json.includes(seatId), `the projector carried the seat id ${seatId} in ${phase}`);
    }
    assert.ok(!json.includes('"pending"'), "the projector carried live offers");
  }
});

test("PRIVACY: one desk's view never contains another desk's offer", () => {
  let s = seatMany(4);
  const seats = Object.keys(s.desks);
  for (const seatId of seats) {
    const r = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seatId));
    if (r.ok) s = r.state;
  }
  for (const mine of seats) {
    const json = JSON.stringify(mod.studentView(s, mine, "PLAY"));
    for (const other of seats) {
      if (other === mine) continue;
      assert.ok(!json.includes(other), `desk ${mine} could see desk ${other}`);
    }
  }
});

test("PRIVACY: the room line is an aggregate and names nobody", () => {
  let s = seatMany(5);
  const seats = Object.keys(s.desks);
  const r = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seats[0]!));
  assert.ok(r.ok);
  const view = mod.studentView(r.state, seats[1]!, "PLAY") as Record<string, unknown>;
  const line = String(view["roomLine"]);
  assert.match(line, /1 of 5 desks/);
  for (const seatId of seats) assert.ok(!line.includes(seatId));
});

/* ------------------------------------------------------- the reveal gate -- */

test("no reveal beat's numbers reach a desk before the teacher presses it", () => {
  // The invariant is per KEY, against the beat that key belongs to. An earlier
  // version of this test only checked that later beats ADDED keys, which a
  // renderer sending everything at beat 0 passes trivially — and a mutant doing
  // exactly that went through it. Each key is now named with the beat it is
  // allowed to appear at, and asserted absent at every beat before it.
  const OWNED_BY: Readonly<Record<string, number>> = {
    yourSignings: 0,
    yourForgone: 1,
    yourRoomLeft: 2,
    yourReadings: 3,
  };
  let s = seatMany(4);
  s = { ...s, day: DAYS, windowClosed: true };
  const seatId = Object.keys(s.desks)[0]!;

  for (let beat = 0; beat < 4; beat += 1) {
    const view = mod.studentView({ ...s, beat }, seatId, "REVEAL") as Record<string, unknown>;
    for (const [key, ownedBeat] of Object.entries(OWNED_BY)) {
      const present = key in view;
      if (beat < ownedBeat) {
        assert.equal(present, false, `${key} reached the desk at beat ${beat}, but belongs to beat ${ownedBeat}`);
      } else {
        assert.equal(present, true, `${key} is missing at beat ${beat}, where it should have arrived`);
      }
    }
  }

  // And the gate must be in the PAYLOAD, not merely in what a renderer draws:
  // a value that is absent from the object cannot be read out of devtools.
  const atZero = JSON.stringify(mod.studentView({ ...s, beat: 0 }, seatId, "REVEAL"));
  assert.ok(!atZero.includes("roomLeft"), "the last beat's number was sitting in the first beat's payload");
});

/* ------------------------------------------------------------- the round -- */

test("the round contract names a day, and only while one is open", () => {
  const s = seatMany(2);
  assert.equal(mod.round!.currentKey(s, "PLAY"), "day-1");
  assert.equal(mod.round!.currentKey(s, "REVEAL"), null);
  assert.equal(mod.round!.currentKey({ ...s, windowClosed: true }, "PLAY"), null);
});

test("the fallback is stated per desk, in both voices, and only for desks that have not committed", () => {
  let s = seatMany(3);
  const seats = Object.keys(s.desks);
  const r = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seats[0]!));
  assert.ok(r.ok);
  const unresolved = mod.round!.unresolved(r.state, "PLAY", seats);
  assert.equal(unresolved.length, 2, "the desk that committed is not unresolved");
  for (const u of unresolved) {
    assert.ok(u.label && !u.label.includes("seat-"), "a desk is named by its handle, not its seat id");
    assert.ok(u.fallback.length > 10);
    assert.match(u.selfFallback, /^You /, "the pair's own warning is written to them, in second person");
  }
});

test("the fallback policy is honest: nothing is charged and nothing is chosen for a desk that passed", () => {
  const policy = mod.round!.fallbackPolicy;
  assert.match(policy, /signs nobody/);
  assert.ok(!/random/i.test(policy), "nothing in this lesson is random");
});

test("closing a day advances it, clears the offers, and ends the window after the last one", () => {
  let s = seatMany(4);
  for (let day = 0; day < DAYS; day += 1) {
    assert.equal(s.day, day);
    const r = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher"));
    assert.ok(r.ok, r.ok ? "" : r.reason);
    s = r.state;
    assert.deepEqual(s.pending, {});
  }
  assert.equal(s.windowClosed, true);
  assert.equal(mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher")).ok, false);
});

/* ------------------------------------------------------- while you were away -- */

test("classEvents says what the ROOM did, in the past tense, naming no desk", () => {
  let s = seatMany(4);
  const seats = Object.keys(s.desks);
  const withOffer = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seats[0]!));
  assert.ok(withOffer.ok);
  const closed = mod.reduce(withOffer.state, { type: "teacher:closeDay" }, ctx("PLAY", "teacher"));
  assert.ok(closed.ok);
  const lines = mod.classEvents!(withOffer.state, closed.state, { fromPhase: "PLAY", toPhase: "PLAY" });
  assert.ok(lines.length >= 1);
  for (const line of lines) {
    for (const seatId of seats) assert.ok(!line.includes(seatId), "a recap named a desk; another desk reads this");
    assert.ok(!/should|better|worse|mistake|wrong/i.test(line), `a recap delivered a verdict: ${line}`);
  }
});

test("an ordinary offer produces no class event, because the log is a card and not a transcript", () => {
  const s = seatMany(2);
  const seatId = Object.keys(s.desks)[0]!;
  const r = mod.reduce(s, { type: "offer", playerId: BOARD[0]!.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seatId));
  assert.ok(r.ok);
  assert.deepEqual(mod.classEvents!(s, r.state, { fromPhase: "PLAY", toPhase: "PLAY" }), []);
});

/* ---------------------------------------------------------- the two bands -- */

test("ONE REDUCER: both bands resolve an identical sequence of actions identically", () => {
  // The economics is the economics. What differs is what a desk is shown and
  // how much reasoning the product does for it — never the arithmetic.
  const run = (band: GradeBand) => {
    let s = seatMany(8, band);
    const seats = Object.keys(s.desks);
    for (let day = 0; day < DAYS; day += 1) {
      for (const [i, seatId] of seats.entries()) {
        const p = MARKET[(i + day) % MARKET.length]!;
        for (const tool of Object.keys(TOOL)) {
          const r = mod.reduce(
            s,
            { type: "offer", playerId: p.id, tool, annual: tool === "minimum" ? TOOL.minimum.ceiling : p.ask.value },
            ctx("PLAY", seatId),
          );
          if (r.ok) {
            s = r.state;
            break;
          }
        }
      }
      const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher"));
      assert.ok(closed.ok);
      s = closed.state;
    }
    return s;
  };
  const young = run("5-6");
  const older = run("7-8");
  const strip = (s: SameLineL1State) => JSON.stringify({ ...s, gradeBand: null });
  assert.equal(strip(young), strip(older), "the two bands diverged in the MODEL, which is a content fork");
});

test("the bands differ where the evidence says they must: variables, ladder, and who does the reasoning", () => {
  const seatIdOf = (s: SameLineL1State) => Object.keys(s.desks)[0]!;
  const young = seatMany(4, "5-6");
  const older = seatMany(4, "7-8");
  const yv = mod.studentView(young, seatIdOf(young), "PLAY") as Record<string, unknown>;
  const ov = mod.studentView(older, seatIdOf(older), "PLAY") as Record<string, unknown>;

  // 5-6 chooses WHO and HOW MUCH; the tool is chosen for them. 7-8 chooses the tool too.
  const yCards = yv["board"] as { tools: unknown[] }[];
  const oCards = ov["board"] as { tools: unknown[] }[];
  assert.ok(yCards.every((c) => c.tools.length === 0), "5-6 was handed a third decision variable");
  assert.ok(oCards.some((c) => c.tools.length > 0), "7-8 was not given the tool choice");

  // Five lines are DRAWN in both bands; how many are LIVE differs (D49 Q1).
  const yLadder = yv["ladder"] as { live: boolean }[];
  const oLadder = ov["ladder"] as { live: boolean }[];
  assert.equal(yLadder.length, 5);
  assert.equal(oLadder.length, 5);
  assert.equal(yLadder.filter((l) => l.live).length, 2);
  assert.equal(oLadder.filter((l) => l.live).length, 5);

  // 5-6 is told what a tool would cost them; 7-8 is left to notice.
  const yPockets = yv["pockets"] as { warning: string | null }[];
  const oPockets = ov["pockets"] as { warning: string | null }[];
  assert.ok(yPockets.some((p) => p.warning !== null), "5-6 was not told the wall was coming");
  assert.ok(oPockets.every((p) => p.warning === null), "7-8 was handed the reasoning it is there to do");
});

test("no percentage or minus sign reaches a grades 5-6 screen", () => {
  // Grade 5 has no percent, ratio or negative-number standard. This is a hard
  // gate, not a preference.
  let s = seatMany(8, "5-6");
  const seats = Object.keys(s.desks);
  for (const [i, seatId] of seats.entries()) {
    const p = MARKET[i % MARKET.length]!;
    const r = mod.reduce(s, { type: "offer", playerId: p.id, tool: "minimum", annual: TOOL.minimum.ceiling }, ctx("PLAY", seatId));
    if (r.ok) s = r.state;
  }
  const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher"));
  assert.ok(closed.ok);
  s = closed.state;
  for (const phase of mod.phases) {
    for (const seatId of seats) {
      const json = JSON.stringify(mod.studentView(s, seatId, phase));
      assert.ok(!/\d%/.test(json), `a percentage reached a 5-6 screen in ${phase}`);
      // A shooting percentage written `.439` under a label reading `3P%` clears
      // the line above on a technicality and is still a percentage. The band
      // gate is about what a ten-year-old can read, not about the glyph.
      assert.ok(!/"(3P|FG)%"/.test(json), `a shooting percentage reached a 5-6 screen in ${phase}`);
      assert.ok(!/[:,]\s*-\d/.test(json), `a negative number reached a 5-6 screen in ${phase}`);
    }
  }
});

/* ------------------------------------------------- opportunity cost, frozen -- */

test("the forgone list names PEOPLE, and is frozen at the moment of commitment", () => {
  let s = seatMany(4);
  const seatId = Object.keys(s.desks)[0]!;
  const desk = s.desks[seatId]!;
  const reachable = BOARD.filter((p) => {
    const r = mod.reduce(s, { type: "offer", playerId: p.id, tool: "ntmle", annual: p.ask.value }, ctx("PLAY", seatId));
    return r.ok;
  });
  if (reachable.length < 2) return;
  const dear = reachable.reduce((a, b) => (b.ask.value > a.ask.value ? b : a));
  const lost = forgoneBy(s, desk, { playerId: dear.id, tool: "ntmle", annual: dear.ask.value });
  for (const name of lost) {
    assert.ok(
      BOARD.some((p) => p.name === name),
      `the forgone list carried "${name}", which is not a person on the board — names, never categories`,
    );
  }
});

/* ------------------------------------------------------------ the fiction -- */

test("no seat is a club the dossier says must not be used", () => {
  // Four clubs are reported hard-capped above their own reported salary, two
  // have an unresolved roster conflict, and three sit inside a stated
  // volatility band. None of them is a seat.
  const forbidden = ["golden-state", "cleveland", "indiana", "miami", "clippers", "toronto", "san-antonio", "phoenix", "oklahoma-city", "denver"];
  for (const club of CLUBS) assert.ok(!forbidden.includes(club.id), `${club.id} is a seat and should not be`);
});

test("every board card carries the real club and date that really signed it", () => {
  for (const p of BOARD) {
    assert.ok(p.reallySignedWith.length > 0, `${p.name} does not say who really signed him`);
    assert.match(p.signedOn, /^\d{4}-\d{2}-\d{2}$/, `${p.name} has no real signing date`);
    assert.ok(p.ask.source.length > 20, `${p.name}'s price has no source`);
  }
});

test("a card offers no rating and no number a student could sort on beyond the price", () => {
  for (const p of BOARD) {
    const card = JSON.stringify({ strength: p.strength, risk: p.risk });
    assert.ok(!/\b\d+\s*(?:overall|ovr|rating|rank)\b/i.test(card), `${p.name} carries a rating`);
    assert.ok(p.strength.length > 0 && p.risk.length > 0, `${p.name} is missing a plain-language strength or risk`);
  }
});

test("the module id is the one the client and the picker will look for", () => {
  assert.equal(mod.id, SAME_LINE_L1_ID);
  assert.equal(mod.id, "m1l1-the-window");
});

test("openingPosition is the club's own published figure, not a rounded one", () => {
  for (const club of CLUBS) {
    assert.equal(openingPosition(club.id).committed, club.committed.value);
  }
});

/* ------------------------------------------------------ the wall, and the -- *
 *                                                          brick it caused    */

/*
 * These seven cover the highest-severity defect found in the L1 prosecution:
 * at Boston and Sacramento, ten of the eleven reachable named players, signed
 * on day one with the tool the product pre-selected at the price the product
 * pre-filled, left the desk with zero legal moves for the remaining two days —
 * a quarter of a sixteen-desk room eliminated in minute three by making the
 * obvious move. Six hundred and seventy-four tests passed while it shipped, so
 * the point of these is coverage, not ceremony: each one fails on the code as
 * it was.
 */

test("a tool may not be used at all when the club is already past the line it walls at", () => {
  // The apron limitations bind on the club's position AFTER the transaction, so
  // a first-apron-restricted move by a club already over the first apron is
  // prohibited outright — not merely terminal.
  // cbaguide.com/thresholds/apron, read 2026-09-03.
  for (const club of CLUBS) {
    const p = openingPosition(club.id);
    for (const toolId of Object.keys(TOOL) as (keyof typeof TOOL)[]) {
      const line = TOOL[toolId].drawsWallAt;
      if (line === null) continue;
      if (p.committed < LINE[line]) continue;
      assert.equal(
        ceilingOf(toolId, p, undefined),
        null,
        `${club.id} is at ${p.committed}, past ${line} (${LINE[line]}), and ${toolId} is still offered to it`,
      );
    }
  }
});

test("no signing ever draws a wall behind the club that drew it", () => {
  const taken = new Set<string>();
  for (const club of CLUBS) {
    const p = openingPosition(club.id);
    for (const player of MARKET) {
      for (const offer of legalOffers(p, [player], taken)) {
        const after = applySigning(p, player, offer);
        if (after.wall === null) continue;
        assert.ok(
          after.committed <= after.wall,
          `${club.id} signing ${player.name} with ${offer.tool} at ${offer.annual} lands at ${after.committed}, past its own new wall at ${after.wall}`,
        );
      }
    }
  }
});

test("a signing that ends the window says so before the click, on every band", () => {
  // The constraint is real and stays real: a club a few million under a hard cap
  // genuinely gets one signing and then stops. What is not allowed is silence.
  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    for (const seatId of Object.keys(s.desks)) {
      const view = mod.studentView(s, seatId, "PLAY") as { board: readonly Record<string, any>[] };
      for (const card of view.board) {
        if (!card["best"]) continue;
        if (card["best"].terminal !== true) continue;
        assert.ok(
          typeof card["best"].lastSigningWarning === "string" && card["best"].lastSigningWarning.length > 0,
          `${band} ${seatId}: signing ${card["name"]} ends the window and the composer says nothing`,
        );
      }
    }
  }
});

test("the auto-chosen tool never ends the window when another tool reaches the same player and does not", () => {
  // Grades 5-6 never pick a tool; the product picks for them. Picking the one
  // that terminates their lesson, to reach $91,628 further, is indefensible.
  const pool = [...BOARD, ...MINIMUM_MARKET];
  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    for (const [seatId, desk] of Object.entries(s.desks)) {
      const view = mod.studentView(s, seatId, "PLAY") as { board: readonly Record<string, any>[] };
      for (const card of view.board) {
        const best = card["best"];
        if (!best || best.terminal !== true) continue;
        const player = MARKET.find((p) => p.id === card["id"])!;
        const survivor = legalOffers(desk.position, [player], new Set(s.taken)).find((o) => {
          const atAsk = { ...o, annual: o.tool === "minimum" ? o.annual : Math.min(o.annual, player.ask.value) };
          return !outlookAfter(desk.position, player, atAsk, pool, new Set(s.taken)).terminal;
        });
        assert.equal(
          survivor,
          undefined,
          `${band} ${seatId}: chose ${best.tool} for ${card["name"]}, which ends the window, when ${survivor?.tool} would not have`,
        );
      }
    }
  }
});

test("the small exception draws its wall at the second apron", () => {
  // Corrected 2026-09-03: this was recorded as drawing no wall at all, which is
  // false. Using the taxpayer mid-level exception hard-caps a club at the
  // SECOND apron for the remainder of the year (hoopsrumors 2026-27 hard-cap
  // tracker; overtheapron.com/terms/hard-cap). The lesson turns on where each
  // wall lands, so an absent wall was not a harmless omission.
  assert.equal(TOOL.taxMle.drawsWallAt, "apron2");
  assert.equal(TOOL.ntmle.drawsWallAt, "apron1");
  assert.equal(TOOL.bae.drawsWallAt, "apron1");
});

test("the minimum is offered to every club, on every screen", () => {
  // It is the tool no line can take away, and the reason no club is ever
  // completely stuck. `pocketsFor` asked about it without naming a player and
  // was told null, so every desk in the room was shown its one guaranteed move
  // as unavailable.
  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    for (const seatId of Object.keys(s.desks)) {
      const view = mod.studentView(s, seatId, "PLAY") as { pockets: readonly Record<string, any>[]; floor: readonly Record<string, any>[] };
      const min = view.pockets.find((p) => p["id"] === "minimum");
      assert.ok(min, `${band} ${seatId}: no minimum pocket`);
      assert.equal(min!["available"], true, `${band} ${seatId}: the minimum is shown as unavailable`);
      assert.equal(view.floor.length, 3, `${band} ${seatId}: the floor of the market is not rendered`);
    }
  }
});

test("an unreachable player names the choice that closed the door, not the seat's opening facts", () => {
  // The old whyNot took the first refusal in key order, which begins with
  // `room`, so every greyed card on every board said "you are over the cap".
  // The reason, once a desk has actually spent something, is the thing it spent.
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seatId = Object.keys(s.desks)[0]!;
  const desk = s.desks[seatId]!;
  const spendable = legalOffers(desk.position, [...BOARD], new Set())[0];
  assert.ok(spendable, "the first desk cannot sign anybody, so this test proves nothing");
  const player = BOARD.find((p) => p.id === spendable!.playerId)!;
  const after = applySigning(desk.position, player, spendable!);
  const withSpend: SameLineL1State = {
    ...s,
    day: 1,
    taken: [player.id],
    desks: { ...s.desks, [seatId]: { ...desk, position: after } },
  };
  const view = mod.studentView(withSpend, seatId, "PLAY") as { board: readonly Record<string, any>[] };
  const blocked = view.board.filter((c) => c["reachable"] === false);
  for (const card of blocked) {
    const reason = String(card["unreachableReason"]);
    // Whatever it says, it may not be a bare restatement of the opening
    // position while a spent tool is the real answer.
    const spentToolWouldReach = after.spent.some((t) => {
      const hypothetical = { ...after, spent: after.spent.filter((x) => x !== t) };
      const q = MARKET.find((p) => p.id === card["id"])!;
      return checkOffer(hypothetical, { playerId: q.id, tool: t, annual: q.ask.value }, q).ok;
    });
    if (!spentToolWouldReach) continue;
    assert.ok(
      /spent it on|already used it/.test(reason),
      `${card["name"]} is blocked by a tool this desk spent, and the card says: ${reason}`,
    );
  }
});

/* ---------------------------------------------------------------- the wire -- */

test("a desk that loses a contested player is told, by name, who got him", () => {
  // The loudest recurring moment in the lesson used to be silent on the student
  // device: `pending` cleared, the row vanished, and the pair inferred from an
  // absence.
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  // Find a player two different desks can both legally reach.
  let contested: { player: (typeof BOARD)[number]; a: string; b: string } | null = null;
  for (const player of BOARD) {
    const able = seats.filter((id) => legalOffers(s.desks[id]!.position, [player], new Set()).length > 0);
    if (able.length >= 2) {
      contested = { player, a: able[0]!, b: able[1]! };
      break;
    }
  }
  assert.ok(contested, "no player in this world is reachable by two desks at once");
  for (const id of [contested!.a, contested!.b]) {
    const o = legalOffers(s.desks[id]!.position, [contested!.player], new Set())[0]!;
    const r = mod.reduce(s, { type: "offer", playerId: o.playerId, tool: o.tool, annual: o.annual }, ctx("PLAY", id, seats));
    assert.ok(r.ok, r.ok ? "" : r.reason);
    s = r.state;
  }
  const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher", seats));
  assert.ok(closed.ok, closed.ok ? "" : closed.reason);

  const winner = closed.state.history[0]!.awards.find((a) => a.playerId === contested!.player.id);
  assert.ok(winner, "a contested player settled with no winner");
  const loser = (winner!.winner as unknown as string) === contested!.a ? contested!.b : contested!.a;
  const view = mod.studentView(closed.state, loser, "PLAY") as { wire: { items: readonly Record<string, any>[] } | null };
  assert.ok(view.wire, "the losing desk got no wire at all");
  const lost = view.wire!.items.find((i) => i["kind"] === "lost");
  assert.ok(lost, `the losing desk was not told it lost: ${JSON.stringify(view.wire)}`);
  assert.match(String(lost!["headline"]), new RegExp(contested!.player.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("the wire never carries what another desk offered", () => {
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  const amounts: number[] = [];
  for (const id of seats) {
    const o = legalOffers(s.desks[id]!.position, [...BOARD], new Set())[0];
    if (!o) continue;
    const r = mod.reduce(s, { type: "offer", playerId: o.playerId, tool: o.tool, annual: o.annual }, ctx("PLAY", id, seats));
    if (!r.ok) continue;
    s = r.state;
    amounts.push(o.annual);
  }
  const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher", seats));
  assert.ok(closed.ok, closed.ok ? "" : closed.reason);
  const won = new Set(closed.state.history[0]!.awards.map((a) => a.annual));
  for (const id of seats) {
    const view = mod.studentView(closed.state, id, "PLAY") as { wire: { items: readonly Record<string, any>[] } | null };
    if (!view.wire) continue;
    const text = JSON.stringify(view.wire);
    for (const amount of amounts) {
      // A settled contract is public; a losing bid never is.
      if (won.has(amount)) continue;
      assert.ok(
        !text.includes(String(amount)) && !text.includes(amount.toLocaleString("en-US")),
        `${id}'s wire carries ${amount}, which nobody signed for — that is somebody's losing bid`,
      );
    }
  }
});

test("the console's class intelligence never ranks one desk above another", () => {
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  for (const id of seats) {
    const o = legalOffers(s.desks[id]!.position, [...BOARD], new Set())[0];
    if (!o) continue;
    const r = mod.reduce(s, { type: "offer", playerId: o.playerId, tool: o.tool, annual: o.annual }, ctx("PLAY", id, seats));
    if (r.ok) s = r.state;
  }
  const view = mod.teacherView(s, "PLAY") as { intel: readonly Record<string, any>[] };
  assert.ok(Array.isArray(view.intel));
  for (const item of view.intel) {
    const text = `${item["text"]} ${item["ask"]}`.toLowerCase();
    for (const banned of ["winning", "best decision", "leading", "in first", "ahead of", "worst", "losing to"]) {
      assert.ok(!text.includes(banned), `class intelligence ranks the room: "${text}"`);
    }
    assert.ok(String(item["ask"]).length > 0, "an intelligence item with no question to ask is a dashboard tile");
  }
});

/* ---------------------------------------------------------------- the fork -- */

test("giving up cap room is offered only to the seats that have room, and only once", () => {
  // `canDeclareOverCap`/`declareOverCap` were modelled in the engine, enumerated
  // by the sweep, and reachable from no action in the product, so the two
  // under-cap seats had a one-path lesson where the design says they have a
  // fork — and the sweep was proving a game that did not ship.
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);

  const withRoom = seats.filter((id) => s.desks[id]!.position.committed < LINE.cap);
  const overCap = seats.filter((id) => s.desks[id]!.position.committed >= LINE.cap);
  assert.ok(withRoom.length > 0 && overCap.length > 0, "this world has no fork to test");

  for (const id of overCap) {
    const view = mod.studentView(s, id, "PLAY") as { fork: unknown };
    assert.equal(view.fork, null, `${id} is over the cap and was offered the fork anyway`);
    const r = mod.reduce(s, { type: "declareOverCap" }, ctx("PLAY", id, seats));
    assert.equal(r.ok, false, `${id} is over the cap and was allowed to give up room it does not have`);
  }

  const id = withRoom[0]!;
  const before = mod.studentView(s, id, "PLAY") as { fork: Record<string, unknown> | null };
  assert.ok(before.fork, `${id} is under the cap and was not offered the fork`);
  assert.match(String(before.fork!["warning"]), /cannot take this back/i);

  const taken = mod.reduce(s, { type: "declareOverCap" }, ctx("PLAY", id, seats));
  assert.ok(taken.ok, taken.ok ? "" : taken.reason);
  const after = mod.studentView(taken.state, id, "PLAY") as { fork: unknown };
  assert.equal(after.fork, null, "the fork is still on offer after it has been taken");
  const again = mod.reduce(taken.state, { type: "declareOverCap" }, ctx("PLAY", id, seats));
  assert.equal(again.ok, false, "the fork can be taken twice");
});

test("giving up cap room takes back an offer that was being paid with it", () => {
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  const id = seats.find((x) => s.desks[x]!.position.committed < LINE.cap)!;
  const roomOffer = legalOffers(s.desks[id]!.position, [...BOARD], new Set()).find((o) => o.tool === "room");
  if (!roomOffer) return; // this seat's room reaches nobody, which is its own lesson
  const put = mod.reduce(s, { type: "offer", ...roomOffer }, ctx("PLAY", id, seats));
  assert.ok(put.ok, put.ok ? "" : put.reason);
  assert.ok(put.state.pending[id], "the offer did not land");
  const gone = mod.reduce(put.state, { type: "declareOverCap" }, ctx("PLAY", id, seats));
  assert.ok(gone.ok, gone.ok ? "" : gone.reason);
  assert.equal(
    gone.state.pending[id],
    undefined,
    "a committed offer paid with cap room survived the club giving up the cap room",
  );
});

/* ------------------------------------------------------------- the beats -- */

test("the reveal beats carry the room's own numbers, not just their titles", () => {
  // Beats 1 and 2 shipped as hero titles over empty space — the module's thesis
  // rendered as a slogan at the peak of the lesson. Both are computable from
  // state that has existed since the first day the reducer ran.
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  // Drive two desks onto the same player so beat 1 has something to show.
  let contestedName: string | null = null;
  for (const player of BOARD) {
    const able = seats.filter((id) => legalOffers(s.desks[id]!.position, [player], new Set()).length > 0);
    if (able.length < 2) continue;
    for (const id of able.slice(0, 2)) {
      const o = legalOffers(s.desks[id]!.position, [player], new Set())[0]!;
      const r = mod.reduce(s, { type: "offer", ...o }, ctx("PLAY", id, seats));
      if (r.ok) s = r.state;
    }
    contestedName = player.name;
    break;
  }
  assert.ok(contestedName, "no player in this world is reachable by two desks at once");
  const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher", seats));
  assert.ok(closed.ok, closed.ok ? "" : closed.reason);

  const bv = mod.boardView(closed.state, "REVEAL") as { samePlayer: Record<string, unknown> | null };
  assert.ok(bv.samePlayer, "beat 1 has nothing under its title after a contested day");
  assert.equal(bv.samePlayer!["player"], contestedName);
  const chasers = bv.samePlayer!["chasers"] as Record<string, unknown>[];
  assert.ok(chasers.length >= 2, "beat 1 shows fewer clubs than were in on him");
  assert.equal(chasers.filter((c) => c["won"] === true).length, 1, "beat 1 shows something other than exactly one winner");
});

test("the projector's beats never carry a student name", () => {
  let s = fresh("5-6");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  for (const id of seats) {
    const o = legalOffers(s.desks[id]!.position, [...BOARD], new Set())[0];
    if (!o) continue;
    const r = mod.reduce(s, { type: "offer", ...o }, ctx("PLAY", id, seats));
    if (r.ok) s = r.state;
  }
  const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher", seats));
  assert.ok(closed.ok, closed.ok ? "" : closed.reason);
  for (let beat = 0; beat < 4; beat += 1) {
    const json = JSON.stringify(mod.boardView({ ...closed.state, beat }, "REVEAL"));
    for (const id of seats) {
      assert.ok(!json.includes(`"${id}"`), `beat ${beat} carries a seat id (${id})`);
    }
  }
});

/* --------------------------------------------------------------- the term -- */

test("the term is the club's choice, up to the tool's real maximum", () => {
  // Years used to come with the tool, which made them free: a longer tool
  // outvalued a shorter one at every price, so the tool decided every contest
  // and the number a student typed decided almost nothing.
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  const id = seats[0]!;
  const o = legalOffers(s.desks[id]!.position, [...BOARD], new Set()).find((x) => x.tool !== "minimum");
  assert.ok(o, "the first desk cannot sign anybody with a term to choose");
  const player = MARKET.find((p) => p.id === o!.playerId)!;
  const max = yearsFor(o!.tool, player);

  for (let years = 1; years <= max; years += 1) {
    const r = mod.reduce(s, { type: "offer", ...o, years }, ctx("PLAY", id, seats));
    assert.ok(r.ok, `${years} years is legal with ${o!.tool} and was refused: ${r.ok ? "" : r.reason}`);
    assert.equal(r.state.pending[id]!.years, years);
  }
  const tooLong = mod.reduce(s, { type: "offer", ...o, years: max + 1 }, ctx("PLAY", id, seats));
  assert.equal(tooLong.ok, false, `${max + 1} years is longer than ${o!.tool} allows and was accepted`);
  const tooShort = mod.reduce(s, { type: "offer", ...o, years: 0 }, ctx("PLAY", id, seats));
  assert.equal(tooShort.ok, false, "a zero-year contract was accepted");
});

test("a longer offer is worth more to the player than a shorter one at the same price", () => {
  // The mechanic only teaches anything if the term genuinely buys something.
  const player = BOARD.find((p) => !p.minimumScale)!;
  const short = offerValue({ playerId: player.id, tool: "ntmle", annual: player.ask.value, years: 1 }, player, false);
  const long = offerValue({ playerId: player.id, tool: "ntmle", annual: player.ask.value, years: 4 }, player, false);
  assert.ok(long > short, `four years (${long}) is not worth more than one (${short}) at the same annual`);
});

test("the term a desk chose is the term its signing carries", () => {
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seats = Object.keys(s.desks);
  const id = seats[0]!;
  const o = legalOffers(s.desks[id]!.position, [...BOARD], new Set()).find(
    (x) => yearsFor(x.tool, MARKET.find((p) => p.id === x.playerId)!) > 1,
  );
  assert.ok(o, "no multi-year tool is reachable at the first desk");
  const put = mod.reduce(s, { type: "offer", ...o, years: 1 }, ctx("PLAY", id, seats));
  assert.ok(put.ok, put.ok ? "" : put.reason);
  const closed = mod.reduce(put.state, { type: "teacher:closeDay" }, ctx("PLAY", "teacher", seats));
  assert.ok(closed.ok, closed.ok ? "" : closed.reason);
  const signing = closed.state.desks[id]!.position.signings.find((sg) => sg.playerId === o!.playerId);
  if (!signing) return; // somebody outbid this desk, which is its own lesson
  assert.equal(signing.years, 1, "a desk asked for one year and the signing carries a different term");
});

test("grades 5-6 are never asked to choose a term", () => {
  let s = fresh("5-6");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  for (const seatId of Object.keys(s.desks)) {
    const view = mod.studentView(s, seatId, "PLAY") as { choosesTerm: unknown };
    assert.equal(view.choosesTerm, false, `${seatId}: the 5-6 band was offered the term control`);
  }
  let o = fresh("7-8");
  for (const [i] of CLUBS.entries()) o = seat(o, `d${i}`);
  const anyOlder = mod.studentView(o, Object.keys(o.desks)[0]!, "PLAY") as { choosesTerm: unknown };
  assert.equal(anyOlder.choosesTerm, true, "the 7-8 band was not offered the term control");
});

/* ------------------------------------------------------------------------ */
/* WHAT HE ACTUALLY DID.                                                     */
/*                                                                          */
/* The board printed a price and no production, which asserts a quality      */
/* ordering the real numbers contradict — the cheapest big out-scored every  */
/* expensive one. `PLAYER_PRODUCTION_RESEARCH.md` §0 raised that as a        */
/* blocking economic-truth finding. These tests hold the repair in place and */
/* trip if a refresh quietly walks it back.                                  */
/* ------------------------------------------------------------------------ */

test("every named player on the board carries a sourced production line", () => {
  for (const p of BOARD) {
    assert.ok(p.production, `${p.id}: a named player with a price and no production`);
    const s = p.production!.value;
    assert.match(p.production!.source, /basketball-reference/, `${p.id}: production not attributed`);
    assert.equal(p.production!.tier, "stats-database", `${p.id}: production on the wrong source tier`);
    assert.match(s.season, /^\d{4}-\d{2}$/, `${p.id}: the season is not printed, so "last season" can rot`);
    assert.ok(s.games > 0 && s.games <= 82, `${p.id}: impossible games played`);
    assert.ok(s.started >= 0 && s.started <= s.games, `${p.id}: more starts than games`);
    assert.ok(s.fg > 0 && s.fg < 1, `${p.id}: field-goal percentage is not a percentage`);
    assert.ok(s.three === null || (s.three > 0 && s.three < 1), `${p.id}: three-point percentage is not a percentage`);
    assert.ok(p.ageAtSigning >= 18 && p.ageAtSigning <= 45, `${p.id}: implausible age at signing`);
  }
});

test("a generic minimum body has no age and no box score", () => {
  // Inventing production for a person who does not exist is inventing a
  // person. The card reader keys off exactly these two.
  for (const p of MINIMUM_MARKET) {
    assert.equal(p.production, null, `${p.id}: a generic body was given a box score`);
    assert.equal(p.ageAtSigning, 0, `${p.id}: a generic body was given an age`);
  }
});

test("the price ordering on this board really is upside down — the tripwire", () => {
  /*
   * NOT a test of the code. A test of the DATA, and deliberately so.
   *
   * The whole card design — production, age at signing and the real term
   * printed together — exists because on these twelve real contracts the
   * cheapest big out-produced the dearest one. If a board refresh ever makes
   * price and production agree, the design is solving a problem that no longer
   * exists and somebody has to look at the cards again. That is what this test
   * is for. It failing is a prompt, not a bug.
   */
  const bigs = BOARD.filter((p) => p.role === "BIG" && p.production);
  const cheapest = bigs.reduce((a, b) => (a.ask.value <= b.ask.value ? a : b));
  const dearest = bigs.reduce((a, b) => (a.ask.value >= b.ask.value ? a : b));
  assert.ok(
    cheapest.production!.value.points > dearest.production!.value.points,
    "price and production now agree among the bigs — re-read PLAYER_PRODUCTION_RESEARCH.md §3 before shipping",
  );
});

test("an ask that is an average says so, and one that is a salary does not", () => {
  let s = fresh("7-8");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const seen = new Map<string, string | null>();
  for (const seatId of Object.keys(s.desks)) {
    const view = mod.studentView(s, seatId, "PLAY") as { board?: { id: string; askNote: string | null }[] };
    for (const c of view.board ?? []) seen.set(c.id, c.askNote);
  }
  for (const p of BOARD) {
    if (!seen.has(p.id)) continue;
    const note = seen.get(p.id) ?? null;
    if (p.askBasis === "average") {
      assert.ok(note, `${p.id}: charges an average against a cap and never says so (S8)`);
      assert.match(note!, /average/i, `${p.id}: the note does not name what the number is`);
    } else {
      assert.equal(note, null, `${p.id}: a real first-year salary was hedged as an average`);
    }
  }
});

test("every player card a student can open shows four numbers and the season", () => {
  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    for (const seatId of Object.keys(s.desks)) {
      const view = mod.studentView(s, seatId, "PLAY") as {
        board?: { id: string; stat: { label: string; big: { label: string; value: string }[] } | null }[];
      };
      for (const c of view.board ?? []) {
        const p = BOARD.find((x) => x.id === c.id)!;
        assert.ok(c.stat, `${band}/${c.id}: a card with a price and no production`);
        assert.equal(c.stat!.big.length, 4, `${band}/${c.id}: not four numbers`);
        assert.match(c.stat!.label, /\d{4}-\d{2}/, `${band}/${c.id}: the season is not on the card`);
        // The fourth number is the one that separates him from the next card in
        // his role. Without it Dosunmu and Grimes are the same card.
        const fourth = c.stat!.big[3]!.label;
        const shootingLabel =
          band === "7-8"
            ? p.production!.value.three === null
              ? "FG%"
              : "3P%"
            : p.production!.value.three === null
              ? "FROM THE FLOOR"
              : "FROM THREE";
        assert.equal(
          fourth,
          p.role === "BIG" ? "BLK" : shootingLabel,
          `${band}/${c.id}: the fourth number does not separate him from his role`,
        );
        if (band === "5-6" && p.role !== "BIG") {
          assert.match(c.stat!.big[3]!.value, /^\d+ OF 10$/, `${band}/${c.id}: 5-6 got a decimal shooting rate`);
        }
        for (const b of c.stat!.big) assert.match(b.value, /^[.\d]/, `${band}/${c.id}/${b.label}: unrenderable`);
      }
    }
  }
});

test("the three corrected board facts stay corrected", () => {
  /*
   * Each of these was WRONG in a shipped file and was caught only by opening
   * the source. They are pinned here with the corrected value so a later edit
   * has to argue with a test rather than with nobody. See
   * PLAYER_PRODUCTION_RESEARCH.md §4.
   */
  const by = (id: string) => BOARD.find((p) => p.id === id)!;
  assert.equal(by("simons").incumbent, null, "Chicago held Simons' rights, and Chicago is not a desk in this room");
  assert.equal(by("kuminga").signedOn, "2026-08-26", "Kuminga's signing date was wrong by seven weeks");
  assert.equal(by("grimes").signedOn, "2026-07-07", "no source supports Grimes signing on 2026-07-15");
  assert.equal(by("simons").ask.value, 6_000_000, "Simons' ask was an average, not the first-year salary the cap charges");
  assert.equal(by("oubre").ask.value, 8_050_000, "Oubre's ask was an average, not the first-year salary the cap charges");
});

test("the projector shows the room both ladders at once", () => {
  let s = fresh("5-6");
  for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
  const view = mod.boardView(s, "PLAY") as { market?: { name: string; statText: string; age: number }[] };
  const market = view.market ?? [];
  assert.ok(market.length > 0, "the projector market is empty during PLAY");
  for (const m of market) {
    assert.match(m.statText, /^\d+\.\d$/, `${m.name}: no production on the wall beside the price`);
    assert.ok(m.age > 0, `${m.name}: no age on the wall`);
  }
});

test("a veteran-minimum signing never prints a number the room cannot explain", () => {
  /*
   * FOUND ON A PROJECTOR SCREENSHOT, not by any assertion in this file.
   *
   * The board told the room "Nikola Vucevic — HE IS ASKING $3,900,000". Four
   * minutes later the reveal printed "Nikola Vucevic · Sacramento ·
   * $2,449,421". Nothing on the student card, the projector or the teacher
   * console connected them. Both numbers are correct — a veteran-minimum deal
   * pays the player his full service-based minimum and charges the club only
   * the two-year amount, with the league covering the difference — but the room
   * was never told that, and the only inference left to a ten-year-old is that
   * a desk talked him down or that the board lied.
   *
   * So: every minimum-scale player whose ask exceeds the charge must carry the
   * explanation on the card BEFORE the choice, and any settled signing that
   * lands on the charge must carry it on the wall.
   */
  const charge = TOOL.minimum.ceiling!;
  const subsidised = BOARD.filter((p) => p.minimumScale && !p.generic && p.ask.value > charge);
  assert.ok(subsidised.length > 0, "no minimum-scale player on the board — this test has stopped testing anything");

  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    const v = mod.studentView(s, "d0" as never, "PLAY") as { board?: Record<string, unknown>[] };
    const cards = v.board ?? [];
    assert.ok(cards.length > 0, `${band}: no cards to check`);
    for (const p of subsidised) {
      const card = cards.find((c) => c["id"] === p.id);
      if (!card) continue; // unreachable for this desk is a different question
      const note = String(card["minimumNote"] ?? "");
      assert.ok(note.length > 0, `${band}/${p.id}: the card shows an ask of ${p.ask.value} and no word about the charge`);
      assert.ok(
        note.includes(charge.toLocaleString("en-US")),
        `${band}/${p.id}: the note never names the ${charge} actually charged`,
      );
      // 7-8 names both figures; 5-6 reads the ask off the line the note hangs
      // from, so requiring it twice in one sentence would only make it longer.
      if (band === "7-8") {
        assert.ok(
          note.includes(p.ask.value.toLocaleString("en-US")),
          `${band}/${p.id}: the note never names the ${p.ask.value} he is paid`,
        );
      }
      // 5-6 gate: the explanation is the likeliest place for a stray percent.
      if (band === "5-6") assert.ok(!/[%−-]\d/.test(note), `${band}/${p.id}: the note leaks a percent or a minus`);
    }
    // And a card that is NOT a minimum-scale deal must not claim to be one.
    for (const card of cards) {
      const p = BOARD.find((x) => x.id === card["id"]);
      if (p && !p.minimumScale) {
        assert.equal(card["minimumNote"], null, `${band}/${p.id}: a full-price contract is described as a minimum deal`);
      }
    }
  }
});

test("a card never tells a desk it has one way to pay when it has four", () => {
  /*
   * The 5-6 composer renders no tool buttons by design, and it read that
   * emptiness as "there is only one tool", printing "It is the only way you
   * have that reaches him" under EVERY card in the younger band. At Memphis on
   * day one that sentence was false on every reachable card: four legal tools.
   * The count is now sent to both bands and the copy branches on it.
   */
  for (const band of ["5-6", "7-8"] as const) {
    let s = fresh(band);
    for (const [i] of CLUBS.entries()) s = seat(s, `d${i}`);
    for (const seatId of ["d0", "d4", "d6"]) {
      const v = mod.studentView(s, seatId as never, "PLAY") as { board?: Record<string, unknown>[] };
      for (const card of v.board ?? []) {
        if (card["reachable"] !== true) continue;
        const n = card["toolCount"];
        assert.equal(typeof n, "number", `${band}/${seatId}/${card["id"]}: no tool count on a reachable card`);
        assert.ok((n as number) >= 1, `${band}/${seatId}/${card["id"]}: reachable with zero tools`);
        // The count must agree with the engine, not merely exist.
        const desk = (s.desks as Record<string, { position: Parameters<typeof legalOffers>[0] }>)[seatId]!;
        const player = BOARD.find((p) => p.id === card["id"])!;
        const tools = new Set(legalOffers(desk.position, [player], new Set()).map((o) => o.tool));
        assert.equal(n, tools.size, `${band}/${seatId}/${card["id"]}: card says ${n} ways, the engine allows ${tools.size}`);
      }
    }
  }
});

test("a minimum body never closes a hole, on any surface", () => {
  /*
   * THE MODULE WAS COMPUTING ITS OWN NAMED FALSE LESSON.
   *
   * `applySigning` refuses to close a job for a generic minimum body, and says
   * why in seventeen lines: a roster hole and a roster spot are not the same
   * thing, and "fill both your holes with bodies" collapsed every constrained
   * seat's Pareto frontier when they were. `readingsFor` then counted the body
   * anyway. Measured at Boston before the repair: sign one generic body,
   * `openJobs` stays [BIG, WING] and `readings.jobsClosed` says 1. Sign three,
   * it says 2 — $7.3M of bodies, zero holes filled, and two of the five class
   * readings topped. The projector then argued FROM that number.
   *
   * There is one predicate now. This test asserts all three views agree with
   * it, and that a club with one BIG job open cannot close two of them.
   */
  const club = CLUBS.find((c) => c.id === "boston")!;
  const open = openingPosition("boston");
  const bodies = MINIMUM_MARKET.filter((p) => p.generic);
  assert.ok(bodies.length > 0, "no generic bodies in the minimum market");

  let p = open;
  for (const b of bodies) {
    p = applySigning(p, b, { playerId: b.id, tool: "minimum", annual: TOOL.minimum.ceiling!, years: 1 });
  }
  assert.deepEqual([...p.openJobs].sort(), [...open.openJobs].sort(), "a body closed a hole in the position");
  const r = readingsFor(open, p, []);
  assert.equal(r.jobsClosed, 0, `${bodies.length} minimum bodies were counted as ${r.jobsClosed} holes closed`);
  assert.equal(r.jobYears, 0, "bodies bought years of cover for holes they did not fill");
  assert.equal(jobClosingSignings(club.jobs, p.signings).length, 0, "the shared predicate disagrees with the reading");

  // ...and two real signings in one role cannot close two jobs when one is open.
  const bigs = BOARD.filter((x) => x.role === "BIG" && !x.generic).slice(0, 2);
  assert.equal(bigs.length, 2, "not enough real bigs on the board to test the cap");
  const oneBigJob = { ...open, openJobs: ["BIG"] as const };
  let q = oneBigJob as typeof open;
  for (const b of bigs) q = applySigning(q, b, { playerId: b.id, tool: "minimum", annual: TOOL.minimum.ceiling!, years: 1 });
  assert.equal(
    jobClosingSignings(oneBigJob.openJobs, q.signings).length,
    1,
    "two bigs signed against one open BIG job read as two holes closed",
  );
});

test("room left never rises because you spent money", () => {
  /*
   * It used to. The reference was "the next line above where you finished",
   * which moves when you cross one. Measured at Boston: committed
   * $209,014,999 printed ROOM LEFT $1; one more dollar printed $12,671,000 —
   * a twelve-million-dollar jump in the direction that rewards crossing the
   * first apron, at the exact moment the club loses the big exception and the
   * small one. Across that entire range the club's real reach never moved.
   *
   * The reading is now measured to the line the club started the window under,
   * so it falls monotonically as the club commits money, and going past that
   * line is a real outcome rather than a reset.
   */
  const open = openingPosition("boston");
  let previous = Infinity;
  for (const extra of [0, 1_000_000, 5_391_951, 5_391_952, 5_391_953, 6_349_421, 12_000_000]) {
    const closing = { ...open, committed: open.committed + extra };
    const r = readingsFor(open, closing, []);
    assert.ok(
      r.roomLeft <= previous,
      `spending ${extra} RAISED room left to ${r.roomLeft} from ${previous} — the reading rewards crossing a line`,
    );
    assert.equal(r.roomLeft, open.committed + 5_391_952 - closing.committed, `room left is not the distance to the opening line at +${extra}`);
    previous = r.roomLeft;
  }
  // Every seat, not just the one the defect was found at.
  for (const c of CLUBS) {
    const o = openingPosition(c.id);
    let last = Infinity;
    for (const extra of [0, 1, 2_449_421, 6_064_000, 15_044_000, 30_000_000]) {
      const r = readingsFor(o, { ...o, committed: o.committed + extra }, []);
      assert.ok(r.roomLeft <= last, `${c.id}: room left rose from ${last} to ${r.roomLeft} after spending ${extra}`);
      last = r.roomLeft;
    }
  }
});

test("the naming is earned from the room's own numbers, and both bands get their list", () => {
  /*
   * CLAUDE.md §1 ends the loop on explicit economics formalization, and calls
   * that stage essential: "the simulation does not replace economics
   * instruction, it makes it understandable." An economic-truth prosecution
   * looking for the map from the five readings to named concepts found that no
   * such map existed in the runtime — SYNTHESIS shipped the readings and a
   * placeholder. This is the stage that was missing.
   *
   * The rule that makes it worth having rather than a slide: every naming opens
   * with what THIS room did, in this room's numbers. So the test plays a real
   * window and then insists the moment text carries the room's own figures.
   */
  for (const band of ["5-6", "7-8"] as const) {
    let s = seatMany(8, band);
    const seats = Object.keys(s.desks);
    // Three days of real signings, so the room actually produces evidence.
    for (let day = 0; day < DAYS; day += 1) {
      for (const [i, seatId] of seats.entries()) {
        const view = mod.studentView(s, seatId as never, "PLAY") as { board?: Record<string, unknown>[] };
        const pick = (view.board ?? []).filter((c) => c["reachable"] === true)[(i + day) % 3];
        if (!pick) continue;
        const best = pick["best"] as Record<string, unknown> | null;
        if (!best) continue;
        const r = mod.reduce(
          s,
          { type: "offer", playerId: String(pick["id"]), tool: String(best["tool"]), annual: Number(best["max"]) },
          ctx("PLAY", seatId),
        );
        if (r.ok) s = r.state;
      }
      const closed = mod.reduce(s, { type: "teacher:closeDay" }, ctx("PLAY", "teacher"));
      if (closed.ok) s = closed.state;
    }

    const board = mod.boardView(s, "SYNTHESIS") as { naming?: Record<string, unknown> | null };
    const n = board.naming;
    assert.ok(n, `${band}: SYNTHESIS reached the wall with no naming at all`);
    assert.ok(String(n["term"]).length > 0, `${band}: a naming with no term`);
    assert.ok(String(n["outside"]).length > 20, `${band}: the naming never leaves basketball`);
    // EARNED: the moment must carry a number this room actually produced.
    assert.match(String(n["moment"]), /\d/, `${band}: the naming's moment cites no number from this room`);

    // The band decides the list. 5-6 gets exactly scarcity and opportunity cost.
    const terms: string[] = [];
    let walk = s;
    for (let i = 0; i < 8; i += 1) {
      const f = (mod.boardView(walk, "SYNTHESIS") as { naming?: Record<string, unknown> | null }).naming;
      if (!f) break;
      if (!terms.includes(String(f["term"]))) terms.push(String(f["term"]));
      const nx = mod.reduce(walk, { type: "teacher:revealNext" }, ctx("SYNTHESIS", "teacher"));
      if (!nx.ok) break;
      if (nx.state === walk) break;
      walk = nx.state;
    }
    assert.ok(terms.includes("SCARCITY"), `${band}: the room never gets told what scarcity is`);
    assert.ok(terms.includes("OPPORTUNITY COST"), `${band}: the room never gets told what opportunity cost is`);
    if (band === "5-6") {
      assert.deepEqual(
        terms.sort(),
        ["OPPORTUNITY COST", "SCARCITY"],
        "5-6 gets exactly two concepts and got a different list",
      );
    } else {
      assert.ok(terms.length > 2, "7-8 got the same two concepts as 5-6");
    }

    // The teacher gets the direction, and the ORDER is the product: the
    // question comes before the term, and what not to say is stated.
    const t = mod.teacherView(s, "SYNTHESIS") as { naming?: Record<string, unknown> | null };
    assert.ok(t.naming, `${band}: the console gives the teacher nothing at the naming`);
    assert.ok(String(t.naming!["ask"]).length > 10, `${band}: no question for the teacher to open with`);
    assert.ok(String(t.naming!["hold"]).length > 10, `${band}: nothing said about what not to explain yet`);

    // The wall is structurally never handed a seat's own case.
    assert.equal(n["yours"], null, `${band}: a desk's own case reached the projector`);
    const own = (mod.studentView(s, seats[0]! as never, "SYNTHESIS") as { naming?: Record<string, unknown> | null }).naming;
    assert.ok(own, `${band}: the pair's own screen shows no naming`);
    assert.ok(String(own!["yours"] ?? "").length > 0, `${band}: the pair is shown the concept but not their own case of it`);
  }
});

test("a naming is never shown for something the room did not do", () => {
  /*
   * A naming with an invented moment is worse than no naming: it teaches the
   * concept AND teaches that the numbers on the wall are decoration. A room
   * where nobody signed anybody has no opportunity cost to point at, and must
   * not be told it does.
   */
  const s = seatMany(8, "7-8"); // seated, nothing played, no history
  const board = mod.boardView(s, "SYNTHESIS") as { naming?: Record<string, unknown> | null };
  if (board.naming) {
    assert.ok(
      board.naming["term"] !== "OPPORTUNITY COST",
      "a room that signed nobody was told what its opportunity cost was",
    );
    assert.ok(
      board.naming["term"] !== "COMPETITION SETS PRICE",
      "a room with no contested signing was shown a bidding war",
    );
  }
});
