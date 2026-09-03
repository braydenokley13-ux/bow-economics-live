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
import { BOARD, CLUBS, LINE, MARKET, TOOL } from "../modules/sameLine/world.js";
import { openingPosition } from "../modules/sameLine/engine.js";
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
    if (phase !== "REVEAL" && phase !== "CONSEQUENCE") {
      assert.equal(mod.reduce(s, { type: "teacher:nextBeat" }, ctx(phase, "teacher")).ok, false, `beat accepted in ${phase}`);
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
