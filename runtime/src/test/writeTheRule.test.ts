/**
 * Module 2 · Lesson 3 "Writing the Rule" — reducer and property tests.
 *
 * Five jobs:
 *  1. the runtime contract (phases, action gating, teacher hooks, seating,
 *     the manual-fallback discipline on every phase exit);
 *  2. the SEED (D9): a real L2 seed is read, and a missing, malformed, foreign
 *     or partially-corrupt one degrades to a playable stock league rather than
 *     throwing — the seed is untrusted input including its own presence;
 *  3. the RULE: the two-thirds test, the status-quo outcome, the condition's
 *     majority-of-the-supporting-bloc rule, and the league office's fallback;
 *  4. the POT IDENTITY: every week, what leaves the clubs equals what reaches
 *     them, including under the condition's dock-and-redistribute branch;
 *  5. PRIVACY and CLAIM BINDING — no surface carries a hidden constant, another
 *     desk's cash, or a seat identity on the projector; and every atom a claim
 *     string emits is actually present in the string it was built for.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  ADOPT_BAND,
  CLUBS,
  CONDITION_MIN_REINVEST,
  DRAW_MAX,
  DRAW_MIN,
  MARKET_PROFILES,
  MAX_DESKS,
  MODULE_ID,
  NATIONAL,
  PRICE_GRID,
  REAL_RULE_CONDITION,
  REAL_RULE_SHARE,
  REINVEST_GRID,
  REINVEST_MAX,
  REVEAL_STEPS,
  ROUND_COUNT,
  SHARE_GRID,
  SHARE_MAX,
  STATUS_QUO_SHARE,
  WEEK_COUNT,
  adoptRule,
  adoptionLineClaimed,
  arrowFor,
  bestPriceUnder,
  bestReinvestUnder,
  computeAggregate,
  counterfactualRows,
  extractCarriedClubs,
  hypotheticalRule,
  keepFraction,
  medianOf,
  moduleClaims,
  runAdoption,
  runnerUpShare,
  settleHome,
  snapShare,
  synthesisCards,
  teacherDirector,
  teacherWatchFor,
  writeTheRuleModule,
  type WriteRuleState,
} from "../modules/writeTheRule.js";
import { CANONICAL_PHASES, isOrderedSubsequence, type CanonicalPhase } from "../shared/phases.js";

const ctx = (phase: CanonicalPhase, seatId: string) => ({ phase, seatId, seatIds: [], now: 0 });

function fresh(seed?: unknown): WriteRuleState {
  return writeTheRuleModule.initialState({ sessionId: "t", seatIds: [], seed });
}

function withDesks(count: number, seed?: unknown): WriteRuleState {
  let state = fresh(seed);
  for (let i = 0; i < count; i += 1) {
    const out = writeTheRuleModule.reduce(state, { type: "takeSeat" }, ctx("LOBBY", `seat-${i}`));
    assert.ok(out.ok, out.ok ? "" : out.reason);
    state = out.state;
  }
  return state;
}

function apply(state: WriteRuleState, action: Record<string, unknown>, phase: CanonicalPhase, seatId: string): WriteRuleState {
  const out = writeTheRuleModule.reduce(state, action as never, ctx(phase, seatId));
  assert.ok(out.ok, out.ok ? "" : `${String(action["type"])} rejected: ${out.reason}`);
  return out.state;
}

function reject(state: WriteRuleState, action: Record<string, unknown>, phase: CanonicalPhase, seatId: string): string {
  const out = writeTheRuleModule.reduce(state, action as never, ctx(phase, seatId));
  assert.equal(out.ok, false, `${String(action["type"])} should have been rejected in ${phase}`);
  return out.ok ? "" : out.reason;
}

/** Propose for every seated desk, then close the round. */
function proposeAll(state: WriteRuleState, shares: number[], conditions: boolean[]): WriteRuleState {
  let next = state;
  const live = next.clubs.filter((c) => c.seatId !== null);
  live.forEach((club, i) => {
    next = apply(next, { type: "propose", share: shares[i % shares.length], condition: conditions[i % conditions.length] }, "PLAY", club.seatId!);
  });
  return next;
}

/** Run the whole rule stage to an adopted rule. */
function toAdopted(state: WriteRuleState, shares: number[], conditions: boolean[] = [false]): WriteRuleState {
  let next = state;
  for (let r = 0; r < ROUND_COUNT; r += 1) {
    next = proposeAll(next, shares, conditions);
    next = apply(next, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  }
  next = apply(next, { type: "teacher:ruleStep" }, "PLAY", "teacher"); // adopt
  return next;
}

const toSeason = (state: WriteRuleState): WriteRuleState => apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");

function playSeason(state: WriteRuleState, opts: { reinvest?: number } = {}): WriteRuleState {
  let next = state;
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    for (const club of next.clubs.filter((c) => c.seatId !== null)) {
      next = apply(next, { type: "setPrice", price: 46 + (club.slot % 5) * 2 }, "PLAY", club.seatId!);
      next = apply(next, { type: "setReinvest", reinvest: opts.reinvest ?? REINVEST_GRID[club.slot % REINVEST_GRID.length]! }, "PLAY", club.seatId!);
      next = apply(next, { type: "lock" }, "PLAY", club.seatId!);
    }
    next = apply(next, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  }
  return next;
}

/* ------------------------------------------------------ runtime contract -- */

test("phases are an ordered subsequence of the canonical vocabulary", () => {
  assert.ok(isOrderedSubsequence(writeTheRuleModule.phases));
  for (const p of writeTheRuleModule.phases) assert.ok((CANONICAL_PHASES as readonly string[]).includes(p));
  assert.equal(writeTheRuleModule.id, MODULE_ID);
});

test("the rule stage, the season and every reveal live in phases that can hold them", () => {
  // The rule is written, adopted AND lived under inside PLAY, because the phase
  // vocabulary is strictly increasing and the season cannot come after REVEAL.
  assert.ok(writeTheRuleModule.phases.includes("PLAY"));
  assert.ok(writeTheRuleModule.phases.includes("REVEAL"));
  assert.ok(writeTheRuleModule.phases.includes("CONSEQUENCE"));
  assert.ok(writeTheRuleModule.phases.includes("COUNTERFACTUAL"));
  assert.ok(writeTheRuleModule.phases.includes("ARGUE"));
  assert.ok(writeTheRuleModule.phases.includes("SYNTHESIS"));
});

test("seating hands out clubs in join order and stops at the league's capacity", () => {
  const state = withDesks(12);
  assert.equal(state.deskCount, 12);
  assert.equal(state.leagueSize, 12);
  for (let i = 0; i < 12; i += 1) assert.equal(state.clubs[i]!.seatId, `seat-${i}`);
  let over = state;
  for (let i = 12; i < MAX_DESKS; i += 1) over = apply(over, { type: "takeSeat" }, "LOBBY", `seat-${i}`);
  const out = writeTheRuleModule.reduce(over, { type: "takeSeat" }, ctx("LOBBY", "one-too-many"));
  assert.equal(out.ok, false);
});

test("every student action is refused from the wrong phase and from the teacher", () => {
  const state = withDesks(6);
  reject(state, { type: "propose", share: 20, condition: false }, "HOOK", "seat-0");
  reject(state, { type: "hookPick", choice: "pay" }, "PLAY", "seat-0");
  reject(state, { type: "kingsVote", choice: "deny" }, "PLAY", "seat-0");
  reject(state, { type: "setPrice", price: 46 }, "PLAY", "seat-0"); // season not open
  reject(state, { type: "propose", share: 20, condition: false }, "PLAY", "teacher");
  reject(state, { type: "teacher:closeWeek" }, "PLAY", "seat-0");
  reject(state, { type: "teacher:ruleStep" }, "PLAY", "seat-0");
});

test("malformed dial values are refused, not clamped", () => {
  const state = withDesks(6);
  reject(state, { type: "propose", share: 7, condition: false }, "PLAY", "seat-0");
  reject(state, { type: "propose", share: SHARE_MAX + 5, condition: false }, "PLAY", "seat-0");
  reject(state, { type: "propose", share: 20, condition: "yes" }, "PLAY", "seat-0");
  const season = toSeason(toAdopted(state, [20]));
  reject(season, { type: "setPrice", price: 47 }, "PLAY", "seat-0");
  reject(season, { type: "setReinvest", reinvest: 7 }, "PLAY", "seat-0");
  reject(season, { type: "setReinvest", reinvest: REINVEST_MAX + 5 }, "PLAY", "seat-0");
});

/* -------------------------------------------------------------- the seed -- */

test("an absent, foreign or malformed seed produces a playable stock league", () => {
  for (const seed of [
    undefined,
    null,
    42,
    "nope",
    { lessonModuleId: "m1l1-draft-day", state: {} },
    { lessonModuleId: "m2l2-host-league" },
    { lessonModuleId: "m2l2-host-league", state: { clubs: "not an array" } },
    { lessonModuleId: "m2l2-host-league", state: { clubs: [{ slot: "x", draw: 5 }, null, 7] } },
  ]) {
    const state = fresh(seed);
    assert.equal(state.seeded, false, `seed ${JSON.stringify(seed)} should not have been trusted`);
    assert.ok(state.seedNote.length > 0);
    assert.equal(state.clubs.length >= 6, true);
    // ...and it still plays.
    const played = playSeason(toSeason(toAdopted(withDesks(6, seed), [20])));
    assert.equal(played.weekIndex, WEEK_COUNT);
  }
});

test("a real L2 seed carries Draw, cash and each club's mean reinvest", () => {
  const seed = {
    lessonModuleId: "m2l2-host-league",
    state: {
      clubs: [
        { slot: 0, draw: 77, cash: 4_000_000, weeks: [{ share: 10 }, { share: 20 }, { share: 30 }] },
        { slot: 1, draw: 21, cash: -500_000, weeks: [{ share: 0 }, { share: 0 }, { share: 0 }] },
        { slot: 2, draw: 900, cash: 1_000_000, weeks: [] },
      ],
    },
  };
  const carried = extractCarriedClubs(seed);
  assert.equal(carried.length, 3);
  assert.equal(carried[0]!.draw, 77);
  assert.equal(carried[0]!.meanReinvest, 20);
  assert.equal(carried[1]!.meanReinvest, 0);
  // R5: a club that ended L2 in debt does not start L3 unable to operate.
  assert.equal(carried[1]!.cash, NATIONAL);
  // Out-of-range Draw is clamped to the league's own range, never trusted raw.
  assert.equal(carried[2]!.draw, DRAW_MAX);

  const state = fresh(seed);
  assert.equal(state.seeded, true);
  assert.equal(state.clubs[0]!.draw, 77);
  assert.equal(state.clubs[0]!.l2Reinvest, 20);
  assert.equal(state.l2MeanReinvest, 10); // (20 + 0) / 2 — the third club has no weeks
});

test("the L2 mean is the left-hand bar and its absence is stated, never faked", () => {
  const unseeded = computeAggregate(playSeason(toSeason(toAdopted(withDesks(6), [20]))));
  assert.equal(unseeded.l2Mean, null);
  const line = moduleClaims(playSeason(toSeason(toAdopted(withDesks(6), [20])))).find((s) => s.surface === "board:consequence:era");
  assert.ok(line);
  assert.match(line!.text, /no Lesson 2 numbers/);
});

/* ----------------------------------------------------------- the HOOK -- */

test("Boston's micro-round is commit-then-reveal and carries no score", () => {
  let state = withDesks(6);
  state = apply(state, { type: "hookPick", choice: "pay" }, "HOOK", "seat-0");
  state = apply(state, { type: "hookPick", choice: "breakup" }, "HOOK", "seat-1");
  reject(state, { type: "hookPick", choice: "maybe" }, "HOOK", "seat-2");
  const before = writeTheRuleModule.boardView(state, "HOOK") as Record<string, unknown>;
  assert.equal(before["revealed"], false);
  assert.equal(before["revealCopy"], undefined, "the board must not carry the answer before the reveal");
  state = apply(state, { type: "teacher:commitReveal" }, "HOOK", "teacher");
  const after = writeTheRuleModule.boardView(state, "HOOK") as Record<string, unknown>;
  assert.equal(after["revealed"], true);
  assert.match(String(after["splitLine"]), /no score/i);
  // A late desk cannot change its answer after the room has seen the result.
  reject(state, { type: "hookPick", choice: "pay" }, "HOOK", "seat-2");
});

/* --------------------------------------------------------- the offer rounds -- */

test("the histogram is withheld until round 1 has closed (anti-herding)", () => {
  let state = proposeAll(withDesks(9), [10, 30, 50], [false]);
  const boardR1 = writeTheRuleModule.boardView(state, "PLAY") as Record<string, unknown>;
  assert.equal(boardR1["histogramHeld"], true);
  assert.equal(boardR1["histogram"], null);
  const playR1 = writeTheRuleModule.studentView(state, "seat-0", "PLAY") as Record<string, unknown>;
  assert.equal(playR1["histogramHeld"], true);
  assert.equal(playR1["histogram"], null);

  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  const boardR2 = writeTheRuleModule.boardView(state, "PLAY") as Record<string, unknown>;
  assert.equal(boardR2["histogramHeld"], false);
  assert.ok(boardR2["histogram"]);
  const hist = boardR2["histogram"] as { bins: { share: number; count: number }[]; median: number };
  assert.equal(
    hist.bins.reduce((a, b) => a + b.count, 0),
    9,
  );
  // No names and no money on the histogram, ever.
  assert.equal(JSON.stringify(hist).includes("seat-"), false);
  assert.equal(JSON.stringify(hist).includes("Desk"), false);
});

/**
 * ABSTENTION. This test used to assert the OPPOSITE — that a desk with no number
 * in was "recorded at the status quo" — and that was the defect, not the
 * contract: a pair distracted for ninety seconds silently cast a 5% vote nobody
 * made, it dragged the room's middle number toward zero, and no surface said so
 * (gate-l3-play, probe C). A non-vote is now a true abstention on the median and
 * carries NO relief on the two-thirds denominator, so staying quiet can never
 * lower the bar and can never move the room's number.
 */
test("a desk with no number in ABSTAINS: no number in the median, and no relief on the two-thirds", () => {
  let state = withDesks(6);
  state = apply(state, { type: "propose", share: 40, condition: false }, "PLAY", "seat-0");
  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  const round = state.closedRounds[0]!;
  assert.equal(round.shares.length, 6, "every live desk is still on the record");
  assert.equal(round.shares.filter((s) => s === null).length, 5, "five desks abstained and none was given a number");
  assert.equal(round.shares.filter((s) => s === STATUS_QUO_SHARE).length, 0, "no desk may be recorded at a number it never proposed");
  // The middle number is the one number that was actually said out loud.
  assert.equal(round.median, 40);

  // ...and the denominator does not shrink: two-thirds of SIX is still needed,
  // so one voice cannot carry a rule by everybody else going quiet.
  const outcome = runAdoption(state);
  assert.equal(outcome.needed, 4);
  assert.equal(outcome.voted, 1);
  assert.equal(outcome.abstained, 5);
  assert.equal(outcome.inBand, 1);
  assert.equal(outcome.adopted.how, "statusQuo");

  // The desk's own screen says all of this, in its own words (teacher B6).
  const desk = writeTheRuleModule.studentView(withDesks(6), "seat-1", "PLAY") as Record<string, unknown>;
  assert.match(String(desk["abstainNote"] ?? ""), /ABSTAINED/);
  assert.match(String(desk["abstainNote"] ?? ""), /cannot be inside the ten-point band/);
});

/**
 * THE SEAL. gate-l3-play's biggest failure: with the full histogram and the
 * middle number on the projector, a desk could still drag its dial and press PUT
 * IT IN, and that late number replaced its round-3 vote and changed the rule the
 * class adopted. The seal is enforced in the REDUCER, not only on the screen.
 */
test("the vote is sealed at the close of round 3 — a late proposal cannot change the adopted rule", () => {
  let state = proposeAll(withDesks(3), [20, 25, 30], [false]);
  for (let r = 0; r < 3; r += 1) {
    if (r > 0) state = proposeAll(state, [20, 25, 30], [false]);
    state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  }
  const sealedRule = runAdoption(state).adopted;
  assert.equal(sealedRule.share, 25);
  assert.equal(sealedRule.supporting, 3);

  // The re-aim that used to work, refused by the model.
  const late = writeTheRuleModule.reduce(
    state,
    { type: "propose", share: 60, condition: true },
    { phase: "PLAY", seatId: "seat-0", seatIds: [], now: 0 },
  );
  assert.equal(late.ok, false);
  assert.match(late.ok ? "" : late.reason, /sealed/i);

  // ...and the rule that gets printed is the sealed one, whatever the state says.
  const adopted = adoptRule(state).adopted!;
  assert.equal(adopted.share, 25);
  assert.equal(adopted.supporting, 3);

  // The desk's own controls are dead and the desk says why.
  const desk = writeTheRuleModule.studentView(state, "seat-0", "PLAY") as Record<string, unknown>;
  assert.equal(desk["sealed"], true);
  assert.match(String(desk["sealedNote"] ?? ""), /sealed/i);
});

/**
 * projector B2: `closeRound` never cleared the live proposal, so rounds 2 and 3
 * opened with every "submitted" count asserting the room had already finished.
 */
test("closing a round clears every desk's live proposal, so round 2 opens at zero", () => {
  let state = proposeAll(withDesks(6), [20], [false]);
  assert.equal(state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length, 6);
  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");
  assert.equal(state.clubs.filter((c) => c.seatId !== null && c.proposal !== null).length, 0);
  const board = writeTheRuleModule.boardView(state, "PLAY") as Record<string, unknown>;
  assert.equal(board["submitted"], 0);
  const teach = writeTheRuleModule.teacherView(state, "PLAY") as Record<string, unknown>;
  assert.equal(teach["proposalCount"], 0);
  assert.match(String(teach["ruleStepLabel"]), /\(0\/6 in\)/);
  // ...and the round the room just closed is still on the record.
  assert.equal(state.closedRounds[0]!.shares.filter((s) => s === 20).length, 6);
});

/** econ B4: a condition with no compliant club may not burn half the pot. */
test("with NOBODY meeting the condition, the pot still closes at zero — no bonfire", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(6), [40], [true])), { reinvest: 0 });
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const paid = state.clubs.slice(0, state.leagueSize).reduce((a, c) => a + (c.weeks[w]?.pot.paidIn ?? 0), 0);
    const took = state.clubs.slice(0, state.leagueSize).reduce((a, c) => a + (c.weeks[w]?.pot.tookOut ?? 0), 0);
    assert.ok(paid > 0, `week ${w + 1} formed no pot to test`);
    assert.ok(
      Math.abs(paid - took) <= state.leagueSize,
      `week ${w + 1}: ${paid} left the clubs and only ${took} reached them — the condition destroyed money`,
    );
  }
  // ...and nobody is told they were docked when nobody was.
  assert.equal(
    state.clubs.slice(0, state.leagueSize).some((c) => c.weeks.some((w) => w.pot.docked)),
    false,
  );
});

/* ------------------------------------------------------------ adoption -- */

test("two-thirds inside the band adopts; short of it, the status quo holds", () => {
  // A room clustered at 25/30/35 — median 30, everybody inside +/-10.
  const clustered = runAdoption(proposeAll(withDesks(9), [25, 30, 35], [false]));
  assert.equal(clustered.adopted.how, "voted");
  assert.equal(clustered.adopted.share, 30);
  assert.equal(clustered.adopted.supporting, 9);

  // A room split hard: 0 / 30 / 60. Median 30; only a third are within 10.
  const split = runAdoption(proposeAll(withDesks(9), [0, 30, 60], [false]));
  assert.equal(split.adopted.how, "statusQuo");
  assert.equal(split.adopted.share, STATUS_QUO_SHARE);
  assert.ok(split.inBand < split.needed);
});

test("the condition rides with a majority of the supporting bloc, ties resolving OFF", () => {
  const yes = runAdoption(proposeAll(withDesks(9), [30], [true, true, false]));
  assert.equal(yes.adopted.condition, true);
  const no = runAdoption(proposeAll(withDesks(9), [30], [true, false, false]));
  assert.equal(no.adopted.condition, false);
  const tie = runAdoption(proposeAll(withDesks(8), [30], [true, false]));
  assert.equal(tie.adopted.condition, false, "a tie must resolve to the less intrusive rule");
});

test("the adopted share is snapped to the dial the room was given", () => {
  const outcome = runAdoption(proposeAll(withDesks(8), [20, 25], [false]));
  assert.ok(SHARE_GRID.includes(outcome.adopted.share), `${outcome.adopted.share} is not on the dial`);
  assert.equal(snapShare(22.5), 25, "a half-step median rounds up, deterministically");
  assert.equal(snapShare(22.4), 20);
  assert.equal(medianOf([10, 20, 30]), 20);
  assert.equal(medianOf([10, 20, 30, 40]), 25);
});

test("the league office's rule is a real alternative path with its own provenance", () => {
  const state = apply(withDesks(6), { type: "teacher:realRule" }, "PLAY", "teacher");
  assert.equal(state.adopted!.how, "leagueOffice");
  assert.equal(state.adopted!.share, REAL_RULE_SHARE);
  assert.equal(state.adopted!.condition, REAL_RULE_CONDITION);
  assert.match(adoptionLineClaimed(computeAggregate(state)).text, /This room did not write it/);
  // ...and it cannot be used to change the rule after the season has started.
  reject(toSeason(state), { type: "teacher:realRule" }, "PLAY", "teacher");
});

test("the runner-up share is a different number from the adopted one", () => {
  const proposals = [10, 10, 30, 30, 30, 50];
  assert.notEqual(runnerUpShare(proposals, 30), 30);
  assert.ok(SHARE_GRID.includes(runnerUpShare(proposals, 30)));
  assert.ok(SHARE_GRID.includes(runnerUpShare([], STATUS_QUO_SHARE)));
});

/* --------------------------------------------------------- the season -- */

test("the pot identity closes exactly every week, with and without the condition", () => {
  for (const condition of [false, true]) {
    const played = playSeason(toSeason(toAdopted(withDesks(12), [30], [condition])));
    assert.equal(played.adopted!.condition, condition);
    for (let w = 0; w < WEEK_COUNT; w += 1) {
      let paid = 0;
      let took = 0;
      for (const club of played.clubs.slice(0, played.leagueSize)) {
        paid += club.weeks[w]!.pot.paidIn;
        took += club.weeks[w]!.pot.tookOut;
      }
      assert.ok(
        Math.abs(paid - took) <= played.leagueSize,
        `week ${w + 1} (condition ${condition}): ${paid} left the clubs but ${took} reached them`,
      );
    }
  }
});

test("the condition docks a non-compliant club and pays the forfeit to the compliant ones", () => {
  let state = toSeason(toAdopted(withDesks(9), [30], [true]));
  assert.equal(state.adopted!.condition, true);
  for (const club of state.clubs.filter((c) => c.seatId !== null)) {
    // Desk 1 goes under the floor; everybody else clears it.
    const r = club.slot === 0 ? 0 : CONDITION_MIN_REINVEST + 5;
    state = apply(state, { type: "setPrice", price: 48 }, "PLAY", club.seatId!);
    state = apply(state, { type: "setReinvest", reinvest: r }, "PLAY", club.seatId!);
    state = apply(state, { type: "lock" }, "PLAY", club.seatId!);
  }
  state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  const docked = state.clubs[0]!.weeks[0]!;
  const compliant = state.clubs[1]!.weeks[0]!;
  assert.equal(docked.pot.docked, true);
  assert.equal(compliant.pot.docked, false);
  assert.ok(docked.pot.tookOut < compliant.pot.tookOut, "the docked club must collect less than a compliant one");
});

test("an unlocked desk settles at its club's house price with nothing reinvested, marked AUTO", () => {
  let state = toSeason(toAdopted(withDesks(6), [20]));
  state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");
  const week = state.clubs[0]!.weeks[0]!;
  assert.equal(week.auto, true);
  assert.equal(week.reinvest, 0);
  const profile = MARKET_PROFILES.find((p) => p.id === state.clubs[0]!.profileId)!;
  assert.equal(week.price, profile.housePrice);
});

test("no seat is left unable to clear its bill at some legal price, under any rule", () => {
  for (const share of SHARE_GRID) {
    const state = toSeason(toAdopted(withDesks(12), [share]));
    const rule = state.adopted!;
    for (const club of state.clubs.slice(0, state.leagueSize)) {
      const vSlot = (club.slot + 1) % state.leagueSize;
      let best = Number.NEGATIVE_INFINITY;
      for (const p of PRICE_GRID) {
        const home = settleHome(
          MARKET_PROFILES.find((m) => m.id === club.profileId)!,
          CLUBS[club.slot]!.capacity,
          club.draw,
          state.clubs[vSlot]!.draw,
          p,
        );
        const profile = MARKET_PROFILES.find((m) => m.id === club.profileId)!;
        const localMedia = profile.localBase + profile.drawDollars * (club.draw - DRAW_MIN);
        const contribution = (rule.share / 100) * (home.gate + localMedia);
        best = Math.max(best, home.gate + home.inArena + localMedia + NATIONAL - profile.bill - contribution);
      }
      assert.ok(best >= 0, `${CLUBS[club.slot]!.short} cannot clear its bill at share ${rule.share}% even before any payout`);
    }
  }
});

test("the rookie is deterministic, unknowable in advance, and nameable afterwards", () => {
  const a = playSeason(toSeason(toAdopted(withDesks(12), [25])));
  const b = playSeason(toSeason(toAdopted(withDesks(12), [25])));
  assert.equal(a.rookieSlot, b.rookieSlot);
  assert.notEqual(a.rookieSlot, null);
  assert.equal(a.clubs[a.rookieSlot!]!.weeks[1]!.hostDrawAtTip, DRAW_MAX);
  // No cash ranking anywhere reveals it in advance.
  const beforeBoard = JSON.stringify(writeTheRuleModule.boardView(toSeason(toAdopted(withDesks(12), [25])), "PLAY"));
  assert.equal(beforeBoard.includes("rookie"), false);
});

/* -------------------------------------------- BC-1's two teaching objects -- */

test("BC-1: at least one market's best PRICE moves with the share and at least one does not", () => {
  const state = withDesks(12);
  const moves: string[] = [];
  const flat: string[] = [];
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id)!;
    const vDraw = state.clubs[(club.slot + 1) % state.leagueSize]!.draw;
    const at0 = bestPriceUnder(state, club, null, club.draw, vDraw);
    const at60 = bestPriceUnder(state, club, hypotheticalRule(SHARE_MAX, false), club.draw, vDraw);
    (at0 === at60 ? flat : moves).push(profile.id);
    assert.ok(at60 <= at0, `${profile.id}: sharing must never RAISE the best price`);
  }
  assert.ok(moves.length > 0, "no market's best price moved with the share — the untaxed stream is not doing its work");
  assert.ok(flat.length > 0, "no market held its price flat — the capacity-bound teaching object is missing");
});

test("BC-1: the best REINVEST falls by at least two dial steps across the adopted shares", () => {
  const state = withDesks(12);
  for (const profile of MARKET_PROFILES) {
    const club = state.clubs.find((c) => c.profileId === profile.id)!;
    const at0 = bestReinvestUnder(state, club, null);
    const at60 = bestReinvestUnder(state, club, hypotheticalRule(SHARE_MAX, false));
    const steps = (at0 - at60) / 5;
    assert.ok(steps >= 2, `${profile.id}: best reinvest moved ${steps} dial steps (${at0}% -> ${at60}%), BC-1 requires at least 2`);
  }
});

test("the marginal keep fraction is the mechanism, and it is not 1 - s", () => {
  // A club pays s and gets 1/N of it back, so it keeps 1 - s(N-1)/N. The gap
  // between that and (1-s) is exactly why a bigger league shares harder.
  assert.ok(keepFraction(50, 12) > keepFraction(50, 30));
  assert.equal(Math.round(keepFraction(0, 12) * 1000) / 1000, 1);
  assert.ok(keepFraction(60, 12) < keepFraction(30, 12));
});

test("the arrows the board prints are the numbers the model computes", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [35])));
  const agg = computeAggregate(state);
  for (const club of state.clubs.filter((c) => c.seatId !== null)) {
    const row = arrowFor(state, club);
    const printed = agg.arrows.find((a) => a.deskHandle === row.deskHandle)!;
    assert.deepEqual(printed, row);
    assert.equal(printed.priceSteps, Math.round((printed.priceAtZero - printed.priceAtAdopted) / 2));
  }
});

/* ------------------------------------------------ counterfactual honesty -- */

test("the counterfactual changes only the rule, never a single action", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [35])));
  const rows = counterfactualRows(state, 10);
  assert.equal(rows.length, 12);
  // Holding actions fixed, transfers must still net out across the league.
  const total = rows.reduce((a, r) => a + r.delta, 0);
  assert.ok(Math.abs(total) < 12 * state.leagueSize * 2, "the counterfactual invented or destroyed money");
  const at35 = counterfactualRows(state, 35);
  for (const r of at35) assert.equal(r.delta, 0, "replaying the adopted share must change nothing");
});

/* -------------------------------------------------------------- privacy -- */

test("the projector is never handed a seat identity, a hidden constant or another desk's cash", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  for (const phase of writeTheRuleModule.phases) {
    const json = JSON.stringify(writeTheRuleModule.boardView(state, phase));
    assert.equal(json.includes("seat-"), false, `${phase}: a seat id reached the projector`);
    assert.equal(json.includes("seatId"), false, `${phase}: a seat identity reached the projector`);
    for (const key of ["base0", "sens", "ownDrawFans", "visitorDrawFans", "effortScale", "terminalDrawDollars"]) {
      assert.equal(json.includes(key), false, `${phase}: hidden constant ${key} reached the projector`);
    }
    assert.equal(/"cash"\s*:/.test(json), false, `${phase}: a club's cash reached the projector`);
  }
});

test("board rows are ordered by desk number and never by money", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const agg = computeAggregate(state);
  const desks = agg.potFlows.map((f) => f.deskNumber);
  assert.deepEqual(desks, [...desks].sort((a, b) => a - b));
  const era = agg.reinvestEra.map((f) => f.deskNumber);
  assert.deepEqual(era, [...era].sort((a, b) => a - b));
});

test("a student view carries this seat's club and no other seat's private state", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  for (const phase of writeTheRuleModule.phases) {
    const view = writeTheRuleModule.studentView(state, "seat-3", phase) as Record<string, unknown>;
    const json = JSON.stringify(view);
    assert.equal(json.includes("seat-4"), false, `${phase}: another seat's id leaked`);
    for (const key of ["base0", "sens", "effortScale", "terminalDrawDollars", "ownDrawFans"]) {
      assert.equal(json.includes(key), false, `${phase}: hidden constant ${key} leaked to a student device`);
    }
  }
});

test("the pre-lock season screen carries no outcome and says there is no preview", () => {
  const state = toSeason(toAdopted(withDesks(6), [20]));
  const view = writeTheRuleModule.studentView(state, "seat-0", "PLAY") as Record<string, unknown>;
  assert.equal(view["mode"], "season");
  assert.deepEqual(view["weeks"], []);
  assert.match(String(view["noPreview"]), /No preview/);
});

/* ------------------------------------------------------- claim binding -- */

test("every claim atom is actually present in the sentence it was built for", () => {
  for (const state of [
    withDesks(12),
    playSeason(toSeason(toAdopted(withDesks(12), [45], [true]))),
    playSeason(toSeason(toAdopted(withDesks(9), [0, 30, 60], [false]))), // status quo path
  ]) {
    const surfaces = moduleClaims(state);
    assert.ok(surfaces.length > 0);
    for (const s of surfaces) {
      for (const atom of s.claims) {
        assert.ok(s.text.includes(atom.rendered), `${s.surface}: atom ${atom.id} renders "${atom.rendered}" which is absent from the sentence`);
        if (atom.quantifier) {
          assert.ok(s.text.includes(atom.quantifier.word), `${s.surface}: quantifier "${atom.quantifier.word}" absent`);
        }
        if (atom.absent !== undefined) {
          assert.equal(s.text.includes(atom.absent), false, `${s.surface}: forbidden phrase "${atom.absent}" is present`);
        }
        if (atom.bounds?.min !== undefined) assert.ok(atom.value >= atom.bounds.min - 1e-9, `${s.surface}: ${atom.id} under its bound`);
        if (atom.bounds?.max !== undefined) assert.ok(atom.value <= atom.bounds.max + 1e-9, `${s.surface}: ${atom.id} over its bound`);
        if (atom.assertsSign === "positive") assert.ok(atom.value > 0, `${s.surface}: ${atom.id} asserts positive but is ${atom.value}`);
        if (atom.assertsSign === "nonNegative") assert.ok(atom.value >= 0, `${s.surface}: ${atom.id} asserts non-negative but is ${atom.value}`);
        if (atom.assertsSign === "negative") assert.ok(atom.value < 0, `${s.surface}: ${atom.id} asserts negative but is ${atom.value}`);
      }
    }
  }
});

test("the claim sweep covers every synthesis card, including the ones with no atoms", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const cards = synthesisCards(state, computeAggregate(state));
  const surfaces = new Set(moduleClaims(state).map((s) => s.surface));
  for (const card of cards) assert.ok(surfaces.has(`synthesis:${card.id}`), `card ${card.id} is invisible to the audit`);
});

/* -------------------------------------------------------- the finale -- */

test("every finale card carries all five rails and both computed rails are non-empty", () => {
  const state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const cards = synthesisCards(state, computeAggregate(state));
  assert.ok(cards.length >= 6, `the module finale must cover the module: got ${cards.length} cards`);
  for (const card of cards) {
    for (const rail of ["rememberWhen", "ourClass", "inSports", "economistsCall", "outsideSports"] as const) {
      assert.ok(card.rails[rail].length > 20, `${card.id}: rail ${rail} is empty or a stub`);
    }
    assert.ok(card.title.length > 0);
  }
});

test("the finale is pageable in both directions and wraps", () => {
  let state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const total = synthesisCards(state, computeAggregate(state)).length;
  assert.equal(state.synthPage, 0);
  state = apply(state, { type: "teacher:synthPageBack" }, "SYNTHESIS", "teacher");
  assert.equal(state.synthPage, total - 1, "paging back from the first card must wrap to the last");
  for (let i = 0; i < total; i += 1) state = apply(state, { type: "teacher:synthPage" }, "SYNTHESIS", "teacher");
  assert.equal(state.synthPage, total - 1);
});

/* ----------------------------------------------- manual-fallback discipline -- */

test("no beat in this lesson depends on a click that may never come", () => {
  // Leaving HOOK reveals Boston.
  const hook = writeTheRuleModule.onPhaseExit!(withDesks(6), "HOOK", "PLAY") as WriteRuleState;
  assert.equal(hook.hookRevealed, true);

  // Leaving PLAY closes every round, adopts, and settles every week.
  const play = writeTheRuleModule.onPhaseExit!(withDesks(12), "PLAY", "REVEAL") as WriteRuleState;
  assert.equal(play.weekIndex, WEEK_COUNT);
  assert.ok(play.adopted);
  assert.equal(play.stage, "seasonDone");

  // Leaving REVEAL plays out every stage; COUNTERFACTUAL runs; ARGUE reveals.
  const reveal = writeTheRuleModule.onPhaseExit!(play, "REVEAL", "CONSEQUENCE") as WriteRuleState;
  assert.equal(reveal.revealStage, REVEAL_STEPS);
  const cf = writeTheRuleModule.onPhaseExit!(reveal, "COUNTERFACTUAL", "ARGUE") as WriteRuleState;
  assert.equal(cf.counterfactualRun, true);
  const argue = writeTheRuleModule.onPhaseExit!(cf, "ARGUE", "SYNTHESIS") as WriteRuleState;
  assert.equal(argue.kingsRevealed, true);
});

test("a session driven only by Advance still produces a complete, claim-bound lesson", () => {
  let state: WriteRuleState = withDesks(12);
  const phases = writeTheRuleModule.phases;
  for (let i = 0; i < phases.length - 1; i += 1) {
    state = writeTheRuleModule.onPhaseExit!(state, phases[i]!, phases[i + 1]!) as WriteRuleState;
  }
  const agg = computeAggregate(state);
  assert.equal(agg.weeksPlayed, WEEK_COUNT);
  assert.ok(agg.adopted);
  assert.ok(moduleClaims(state).length > 0);
});

/* --------------------------------------------------------- teacher aids -- */

test("the director panel renders for every phase, with a rehearsal room and a live room", () => {
  const empty = fresh();
  const live = playSeason(toSeason(toAdopted(withDesks(12), [40], [true])));
  for (const phase of writeTheRuleModule.phases) {
    for (const state of [empty, live]) {
      const panel = teacherDirector(state, phase);
      assert.equal(panel.phase, phase);
      assert.ok(panel.minuteBudget.length > 0, `${phase}: no minute budget`);
      assert.ok(panel.now.length > 0, `${phase}: NOW is empty`);
      assert.ok(panel.timeCut.length > 0, `${phase}: no TIME CUT`);
    }
    // The rehearsal room must still get WATCH FOR, or a teacher meets the
    // panel for the first time in front of a class.
    const flags = teacherWatchFor(empty, phase);
    assert.ok(flags.length > 0, `${phase}: an empty rehearsal session rendered no WATCH FOR at all`);
    for (const f of flags) assert.match(f.label, /^REHEARSAL — /);
  }
});

test("DON'T EXPLAIN YET withholds the module's two words until synthesis", () => {
  const live = toSeason(toAdopted(withDesks(9), [30]));
  for (const phase of ["HOOK", "PLAY"] as CanonicalPhase[]) {
    const panel = teacherDirector(live, phase);
    assert.ok(
      panel.dontExplainYet.some((d) => /REVENUE SHARING|INCENTIVE|MORAL HAZARD/i.test(d)),
      `${phase}: the words are not being withheld`,
    );
  }
  const synth = teacherDirector(live, "SYNTHESIS");
  assert.ok(synth.dontExplainYet.some((d) => /Nothing is held back/i.test(d)));
});

/* ------------------------------------------------------------ determinism -- */

test("the same session replays to the same numbers, twice", () => {
  const a = playSeason(toSeason(toAdopted(withDesks(12), [15, 30, 45], [true, false])));
  const b = playSeason(toSeason(toAdopted(withDesks(12), [15, 30, 45], [true, false])));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.deepEqual(computeAggregate(a), computeAggregate(b));
});

test("no reachable settlement depends on a random source", () => {
  // Belt and braces on R7: the module's source contains no RNG at all, and the
  // reducer is a pure function of (state, action, ctx) — proven by replaying the
  // same season from the same state and diffing the whole object above.
  const state = toSeason(toAdopted(withDesks(12), [30]));
  const once = writeTheRuleModule.reduce(state, { type: "teacher:closeWeek" }, ctx("PLAY", "teacher"));
  const twice = writeTheRuleModule.reduce(state, { type: "teacher:closeWeek" }, ctx("PLAY", "teacher"));
  assert.ok(once.ok && twice.ok);
  assert.deepEqual(once.state, twice.state);
});

test("ADOPT_BAND, the dial and the two-thirds rule are the numbers the copy promises", () => {
  assert.equal(ADOPT_BAND, 10);
  assert.equal(SHARE_GRID[0], 0);
  assert.equal(SHARE_GRID[SHARE_GRID.length - 1], SHARE_MAX);
  assert.equal(ROUND_COUNT, 3);
  assert.equal(WEEK_COUNT, 3);
});

/* ------------------------------------------------------- the league floor -- */

/**
 * W6/RC3 — the room is asked to tax itself while looking at how unequal it is.
 *
 * The league strip on the vote screen draws every club's opening bank on one
 * baseline. That is only safe because every place it is sent is PRE-SEASON: no
 * week has settled, so no figure in it can carry another desk's decision. The
 * season view must never ask for it, and this test is what stops a later arm
 * from adding `league:` to a settled-week payload without noticing that it has
 * just published eleven other desks' outcomes to a private screen.
 */
test("W6/RC3: the league floor carries what it draws, and never survives into the season", () => {
  const desks = 9;
  const seated = withDesks(desks);

  for (const phase of ["LOBBY", "HOOK"] as const) {
    const v = writeTheRuleModule.studentView(seated, "seat-3", phase) as Record<string, unknown>;
    assert.ok(Array.isArray(v["league"]), `${phase} must carry the league`);
  }

  const rounds = writeTheRuleModule.studentView(seated, "seat-3", "PLAY") as Record<string, unknown>;
  const league = rounds["league"] as { short: string; code: string; cash: number; capacity: number; draw: number; you: boolean }[];
  assert.ok(Array.isArray(league) && league.length === seated.leagueSize, "the vote screen must carry every club in the league");
  assert.equal(league.filter((c) => c.you).length, 1, "exactly one club on the floor is this desk's own");
  for (const c of league) {
    assert.equal(typeof c.cash, "number", `${c.short} has no bank to draw`);
    assert.ok(c.cash > 0 && Number.isFinite(c.cash), `${c.short} drew a bar off a nonsense number`);
    assert.ok(c.code.length >= 2 && c.code.length <= 4, `${c.short} has no usable league code`);
    assert.ok(c.capacity > 1000, `${c.short} has no building`);
  }
  // The gap is worth drawing: if every club opened with the same money the strip
  // would be twelve identical bars saying nothing, and this lesson's whole
  // argument ("the pot is the big markets' money") would have no picture.
  const cashes = league.map((c) => c.cash);
  assert.ok(Math.max(...cashes) / Math.min(...cashes) >= 2, "the league floor is drawing an equality this lesson does not have");

  // Codes must be unique or two columns are indistinguishable.
  const codes = new Set(league.map((c) => c.code));
  assert.equal(codes.size, league.length, "two clubs share a league code");

  // PRE-SEASON ONLY. Once a week settles, cash is a decision outcome.
  const adopted = toAdopted(seated, [20, 25, 30]);
  const adoptedView = writeTheRuleModule.studentView(adopted, "seat-3", "PLAY") as Record<string, unknown>;
  assert.ok(Array.isArray(adoptedView["league"]), "the adoption screen is still pre-season");

  const season = playSeason(toSeason(adopted));
  const settled = writeTheRuleModule.studentView(season, "seat-3", "PLAY") as Record<string, unknown>;
  assert.equal(
    settled["league"],
    undefined,
    "a settled-week view carried the league table — that publishes every other desk's cash outcome to a private screen",
  );
});

/* -------------------------------------------------- THE ROOM (W6) -- */

type L3Room = {
  deskCount: number;
  lockedCount: number;
  decidingCount: number;
  spread: { min: number; max: number; median: number; range: number } | null;
  bins: { from: number; to: number; label: string; count: number; lockedCount: number; handles: string[] }[];
  movement: { raised: number; held: number; lowered: number; basis: number; noOwnPrior: number; noPrior: number; deciding: number };
  countLine: string;
  movementLine: string;
  spreadLine: string;
  privacyNote: string;
};
const roomOf = (state: WriteRuleState): L3Room | null =>
  (writeTheRuleModule.teacherView(state, "PLAY") as Record<string, unknown>)["room"] as L3Room | null;

test("THE ROOM reads the rule rounds as a bargaining spread, and never reaches the projector", () => {
  // The two-thirds test is only worth running on numbers the desks chose. A
  // live median on the projector ends that in one press, so this read exists on
  // the teacher's console and nowhere else.
  let state = withDesks(6);
  const live = state.clubs.filter((c) => c.seatId !== null);
  const shares = [0, 10, 10, 20, 40];
  live.slice(0, 5).forEach((club, i) => {
    state = apply(state, { type: "propose", share: shares[i]!, condition: i >= 3 }, "PLAY", club.seatId!);
  });

  const room = roomOf(state)!;
  assert.equal(room.deskCount, 6);
  assert.equal(room.lockedCount, 5, "five numbers are in");
  assert.equal(room.decidingCount, 1, "and one desk has proposed nothing");
  assert.deepEqual(room.spread, { min: 0, max: 40, median: 10, range: 40 });
  assert.equal(room.bins.reduce((n, b) => n + b.count, 0), 5, "only proposals are on the grid");
  assert.equal(
    room.bins.reduce((n, b) => n + b.lockedCount, 0),
    5,
    "a proposal IS the commitment in this stage — there is no ghosted half to draw",
  );
  assert.deepEqual(
    room.bins.map((b) => b.from),
    [...SHARE_GRID],
    "the bars stand on the dial the room was actually given",
  );
  assert.match(room.countLine, /5 of 6 numbers in .* round 1 of 3/);
  assert.doesNotMatch(room.countLine, /locked/i, "desks propose in this stage, they do not lock");
  assert.match(room.spreadLine, /between 0% and 40%, middle 10%/, room.spreadLine);
  assert.match(room.spreadLine, /2 of them want the CONDITION on/, room.spreadLine);
  assert.match(room.privacyNote, /never shows this while the round is open/);

  // The projector must not be carrying any of it.
  const board = JSON.stringify(writeTheRuleModule.boardView(state, "PLAY"));
  assert.ok(!board.includes("spreadLine"), "the projector is carrying the class spread read");
  assert.ok(!board.includes("movementLine"), "the projector is carrying the class movement read");
  assert.ok(!/seat-\d/.test(board), "the projector is carrying a seat identity");

  // First round: nothing behind these desks to have moved off.
  assert.equal(room.movement.basis, 0);
  assert.equal(room.movement.noPrior, 5);
  assert.match(room.movementLine, /First round/, room.movementLine);
});

test("THE ROOM counts round movement against a desk's OWN previous number, not against an abstention", () => {
  let state = withDesks(4);
  const live = state.clubs.filter((c) => c.seatId !== null);
  // Round 1: three desks propose, the fourth abstains.
  state = apply(state, { type: "propose", share: 10, condition: false }, "PLAY", live[0]!.seatId!);
  state = apply(state, { type: "propose", share: 20, condition: false }, "PLAY", live[1]!.seatId!);
  state = apply(state, { type: "propose", share: 30, condition: false }, "PLAY", live[2]!.seatId!);
  state = apply(state, { type: "teacher:ruleStep" }, "PLAY", "teacher");

  // Round 2: one moves up, one holds, one moves down, and the abstainer joins.
  state = apply(state, { type: "propose", share: 25, condition: false }, "PLAY", live[0]!.seatId!);
  state = apply(state, { type: "propose", share: 20, condition: false }, "PLAY", live[1]!.seatId!);
  state = apply(state, { type: "propose", share: 15, condition: false }, "PLAY", live[2]!.seatId!);
  state = apply(state, { type: "propose", share: 20, condition: false }, "PLAY", live[3]!.seatId!);

  const room = roomOf(state)!;
  assert.equal(room.movement.raised, 1, "one desk asked for more than it asked for last round");
  assert.equal(room.movement.held, 1);
  assert.equal(room.movement.lowered, 1);
  assert.equal(room.movement.basis, 3);
  assert.equal(
    room.movement.noOwnPrior,
    1,
    "the desk that sat round 1 out has no number of its own to have moved off — it is not a 'held'",
  );
  assert.equal(room.movement.noPrior, 0, "round 2 is not anybody's first round");
  assert.match(room.movementLine, /1 asked for more, 1 held their number, 1 asked for less/, room.movementLine);
  assert.match(room.movementLine, /1 moving off a round they sat out/, room.movementLine);
  assert.match(room.countLine, /round 2 of 3/);
});

test("THE ROOM switches to a compliance spread once the season opens under the room's own rule", () => {
  // The rule the room voted in taxes and conditions on the reinvest dial, so
  // that is the shape; price is the sentence. The teacher needs to see who is
  // about to be bitten by a rule this room wrote.
  let state = withDesks(5);
  state = toAdopted(state, [20], [true]);
  assert.equal(state.adopted!.condition, true, "this fixture needs the condition ON to test the compliance read");
  state = toSeason(state);

  const live = state.clubs.filter((c) => c.seatId !== null);
  // Four commit; the fifth leaves its dial parked without locking.
  const set = [
    { price: 30, reinvest: 0 },
    { price: 40, reinvest: 5 },
    { price: 50, reinvest: 20 },
    { price: 60, reinvest: 40 },
  ];
  set.forEach((row, i) => {
    state = apply(state, { type: "setPrice", price: row.price }, "PLAY", live[i]!.seatId!);
    state = apply(state, { type: "setReinvest", reinvest: row.reinvest }, "PLAY", live[i]!.seatId!);
    state = apply(state, { type: "lock" }, "PLAY", live[i]!.seatId!);
  });
  state = apply(state, { type: "setPrice", price: 120 }, "PLAY", live[4]!.seatId!);
  state = apply(state, { type: "setReinvest", reinvest: 35 }, "PLAY", live[4]!.seatId!);

  const room = roomOf(state)!;
  assert.equal(room.lockedCount, 4);
  assert.equal(room.decidingCount, 1);
  assert.deepEqual(room.spread, { min: 30, max: 60, median: 45, range: 30 }, "the uncommitted $120 dial must not widen the spread");
  assert.match(room.countLine, /4 of 5 locked in .* week 1 of 3/);
  assert.match(room.spreadLine, /between \$30 and \$60, middle \$45/, room.spreadLine);
  assert.match(
    room.spreadLine,
    new RegExp(`2 of them are under the ${CONDITION_MIN_REINVEST}% condition this room voted in`),
    room.spreadLine,
  );
  assert.deepEqual(room.bins.map((b) => b.from), [...REINVEST_GRID], "the bars stand on the reinvest dial's own grid");
  assert.equal(room.bins.reduce((n, b) => n + b.count, 0), 5, "an undecided dial is still drawn where it actually is");
  assert.equal(room.bins.reduce((n, b) => n + b.lockedCount, 0), 4, "and it is not drawn as a decision");
  const parked = room.bins.find((b) => b.from === 35)!;
  assert.equal(parked.count - parked.lockedCount, 1, "the parked dial sits in its own bar as an undecided position");
  assert.match(room.privacyNote, /never shows this while the week is open/);

  const board = JSON.stringify(writeTheRuleModule.boardView(state, "PLAY"));
  assert.ok(!board.includes("spreadLine") && !board.includes("movementLine"), "the projector is carrying the live read");
});

test("THE ROOM claims season movement only off a week the desk decided itself", () => {
  let state = withDesks(3);
  state = toSeason(toAdopted(state, [10], [false]));
  const live = state.clubs.filter((c) => c.seatId !== null);
  // Week 1: two desks decide, the third is committed by the bell (AUTO).
  for (const i of [0, 1]) {
    state = apply(state, { type: "setReinvest", reinvest: 20 }, "PLAY", live[i]!.seatId!);
    state = apply(state, { type: "lock" }, "PLAY", live[i]!.seatId!);
  }
  state = apply(state, { type: "teacher:closeWeek" }, "PLAY", "teacher");

  // Week 2: one raises, one holds, and the AUTO desk locks for the first time.
  state = apply(state, { type: "setReinvest", reinvest: 30 }, "PLAY", live[0]!.seatId!);
  state = apply(state, { type: "lock" }, "PLAY", live[0]!.seatId!);
  state = apply(state, { type: "setReinvest", reinvest: 20 }, "PLAY", live[1]!.seatId!);
  state = apply(state, { type: "lock" }, "PLAY", live[1]!.seatId!);
  state = apply(state, { type: "setReinvest", reinvest: 5 }, "PLAY", live[2]!.seatId!);
  state = apply(state, { type: "lock" }, "PLAY", live[2]!.seatId!);

  const room = roomOf(state)!;
  assert.equal(room.movement.raised, 1);
  assert.equal(room.movement.held, 1);
  assert.equal(room.movement.lowered, 0);
  assert.equal(room.movement.basis, 2);
  assert.equal(room.movement.noOwnPrior, 1, "an AUTO week is not a decision the desk moved off");
  assert.match(room.movementLine, /1 moving off a week the bell committed for them/, room.movementLine);
});

test("THE ROOM is silent where there is no live decision to read", () => {
  // Between the last round and the season, and after the final bell, there is
  // no open window — a panel reporting a stale shape would be reporting a room
  // that no longer exists.
  assert.equal(roomOf(fresh()), null, "no desks, no read");
  const adopted = toAdopted(withDesks(4), [15], [false]);
  assert.equal(adopted.stage, "adopted");
  assert.equal(roomOf(adopted), null, "the rule is written and the season has not opened");
  const done = playSeason(toSeason(adopted));
  assert.equal(roomOf(done), null, "the season is over");
});

/* ------------------------------------------------------------------------ */
/* A pair who walks in after the season closed                              */
/* ------------------------------------------------------------------------ */

test("a pair who arrives after the last week closed is landed honestly, not left finding a club", () => {
  const state = withDesks(3);
  // The runtime asks the module what it may forward. If takeSeat is not offered
  // after PLAY, a late device is refused one layer above this file and never
  // reaches the landing below at all.
  for (const phase of ["REVEAL", "CONSEQUENCE", "COUNTERFACTUAL", "ARGUE", "SYNTHESIS", "COMPLETE"] as const) {
    assert.ok(
      (writeTheRuleModule.allowedActions?.(phase) ?? []).includes("takeSeat"),
      `takeSeat is not forwardable in ${phase}, so a late pair is refused before the module can land them`,
    );
  }

  const landed = apply(state, { type: "takeSeat" }, "REVEAL", "walk-in");
  assert.equal(landed.seatToSlot["walk-in"], undefined, "a late pair was handed a club after the season settled");
  assert.deepEqual(landed.observerSeats, ["walk-in"]);

  const view = writeTheRuleModule.studentView(landed, "walk-in", "REVEAL") as Record<string, unknown>;
  assert.equal(view["seated"], false);
  assert.equal(view["observer"], true);
  const message = String(view["message"]);
  assert.equal(/Finding your club/i.test(message), false, "the late pair is still being told we are finding their club");
  assert.match(message, /after the last week closed/i);
  assert.match(message, /three weeks are already in the books/i);
  assert.ok(view["ruleNote"], "the observer screen never says what rule the room voted in");

  // Idempotent: a retrying device is one pair, not five.
  const again = apply(landed, { type: "takeSeat" }, "ARGUE", "walk-in");
  assert.deepEqual(again.observerSeats, ["walk-in"]);

  // The console is told, in seat-free language, with something to do.
  const flags = teacherWatchFor(again, "REVEAL");
  const flag = flags.find((f) => f.id === "late-observers");
  assert.ok(flag, "the console was never told a pair is standing in the doorway");
  assert.equal(flag.urgency, "now");
  assert.deepEqual(flag.desks, ["Late pair 1"]);
  assert.match(flag.label, /after the last week closed/i);
  assert.match(flag.action, /seat them beside a desk/i);
  assert.equal(/walk-in|seat-/.test(`${flag.label} ${flag.action} ${flag.desks.join(" ")}`), false, "a seat id reached the console");

  // And nothing about them reaches the projector as a club.
  const board = JSON.stringify(writeTheRuleModule.boardView(again, "REVEAL"));
  assert.equal(board.includes("walk-in"), false, "a late observer's seat id reached the projector");
});

test("a full league during PLAY still says the league is full, not that the season ended", () => {
  // Leaving HOOK freezes the league; with all 12 clubs taken there is nothing to
  // hand over, so a thirteenth device lands as an observer while play continues.
  const frozen = writeTheRuleModule.onPhaseExit!(withDesks(12), "HOOK", { phase: "HOOK", seatIds: [], now: 0 } as never);
  assert.equal(frozen.leagueFrozen, true);
  const landed = apply(frozen, { type: "takeSeat" }, "PLAY", "thirteenth");
  assert.deepEqual(landed.observerSeats, ["thirteenth"]);
  const view = writeTheRuleModule.studentView(landed, "thirteenth", "PLAY") as Record<string, unknown>;
  assert.match(String(view["message"]), /every club already has a pair running it/i);
  const flag = teacherWatchFor(landed, "PLAY").find((f) => f.id === "late-observers");
  assert.ok(flag);
  assert.match(flag.label, /after the league closed/i);
});

/* ------------------------------------------------------------------------ */
/* THE DESKS — the walk-to list                                             */
/* ------------------------------------------------------------------------ */

test("the desk strip reads the round it is actually in, and stays teacher-only", () => {
  type Strip = { countLine: string; entries: { seatId: string; label: string; state: string; stateLabel: string; note: string | null }[] };
  const stripOf = (s: WriteRuleState, phase: CanonicalPhase = "PLAY"): Strip | null =>
    ((writeTheRuleModule.teacherView(s, phase) as Record<string, unknown>)["deskStrip"] as Strip | null) ?? null;

  assert.equal(stripOf(fresh()), null);
  const state = withDesks(4);
  const rounds = stripOf(state)!;
  assert.equal(rounds.entries.length, 4);
  // A desk in the offer rounds has not "locked" anything — it either has a
  // number at the league or it does not.
  assert.match(rounds.countLine, /0 of 4 numbers in · round 1 of 3/);
  for (const e of rounds.entries) assert.equal(e.stateLabel, "No number yet");

  const proposed = apply(state, { type: "propose", share: 30, condition: false }, "PLAY", "seat-1");
  const after = stripOf(proposed)!;
  assert.match(after.countLine, /1 of 4 numbers in/);
  assert.match(after.entries.find((e) => e.seatId === "seat-1")!.stateLabel, /Number in · round 1/);

  // The season is a different window and says so.
  const season = toSeason(toAdopted(state, [30], [false]));
  const week = stripOf(season)!;
  assert.match(week.countLine, /locked · week 1 of 3/);
  assert.equal(week.entries[0]!.stateLabel, "Still deciding");

  for (const phase of writeTheRuleModule.phases) {
    const board = JSON.stringify(writeTheRuleModule.boardView(season, phase));
    assert.equal(board.includes("deskStrip"), false, `the projector carries the walk-to list in ${phase}`);
    assert.equal(/seat-\d/.test(board), false, `a seat id reached the projector in ${phase}`);
  }
  assert.equal(JSON.stringify(writeTheRuleModule.studentView(season, "seat-1", "PLAY")).includes("deskStrip"), false);
});

test("a cold walk marks every finale card, and a played room never sees a mark", () => {
  // `gate-l2-teacher` B5, third limb. This deck never collapsed on a zero-desk
  // rehearsal — it rendered the real cards against an empty room, so the walk
  // the console prescribes put "Nobody in this room ended down on the pot this
  // time" on the projector as a fact about a class that does not exist.
  const cold = synthesisCards(fresh(), computeAggregate(fresh()));
  const played = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const live = synthesisCards(played, computeAggregate(played));

  assert.equal(cold.length, live.length, "the rehearsal deck is a different length from the live deck");
  assert.deepEqual(
    cold.map((c) => c.title.replace(/^REHEARSAL — /, "")),
    live.map((c) => c.title),
    "the rehearsal deck teaches card titles the live deck does not have",
  );
  for (const card of cold) {
    assert.match(card.title, /^REHEARSAL — /, `${card.id} could be read as this room's own card`);
    assert.match(card.rails.ourClass, /STAND-IN/, `${card.id}: the computed rail does not say it is imaginary`);
    assert.match(card.rails.rememberWhen, /STAND-IN/, `${card.id}: the remembered moment does not say it is imaginary`);
    // The dated real-world rails are the same sentence tomorrow, so they are
    // left exactly alone — marking them would be a lie in the other direction.
    assert.equal(/STAND-IN/.test(card.rails.inSports), false, `${card.id}: a dated real-world fact was marked as a stand-in`);
  }
  for (const card of live) {
    assert.equal(/REHEARSAL/.test(card.title), false, `${card.id} leaked the rehearsal deck into a played room`);
    assert.equal(/STAND-IN/.test(card.rails.ourClass), false, `${card.id} leaked a stand-in warning into a played room`);
  }
});

test("the finale desk never reads ahead of the projector", () => {
  // The desk used to carry the whole deck the instant SYNTHESIS opened, so at
  // CARD 1 OF 7 on the projector every pair already had card 7's title on their
  // own screen — the exact defect D26 was written to kill in Lesson 2's reveal,
  // in the module finale, the one stretch where the room looks up together.
  let state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const seat = state.clubs.find((c) => c.seatId !== null)!.seatId!;
  const all = synthesisCards(state, computeAggregate(state));
  assert.ok(all.length > 2, "guard: the fixture must produce a multi-card finale");

  for (let page = 0; page < all.length; page += 1) {
    const student = writeTheRuleModule.studentView(state, seat, "SYNTHESIS") as Record<string, unknown>;
    const shown = (student["cards"] as { title: string }[]) ?? [];
    assert.equal(shown.length, page + 1, `the desk carried ${shown.length} cards while the board was on card ${page + 1}`);
    assert.equal(shown[shown.length - 1]!.title, all[page]!.title, "the newest card on the desk is not the one on the board");
    // Everything the room has already seen is still there to scroll back to.
    for (let i = 0; i <= page; i += 1) assert.equal(shown[i]!.title, all[i]!.title);
    // And nothing it has not.
    const blob = JSON.stringify(shown);
    for (let i = page + 1; i < all.length; i += 1) {
      assert.equal(blob.includes(all[i]!.title), false, `the desk leaked "${all[i]!.title}" while the board was on card ${page + 1}`);
    }
    if (page < all.length - 1) state = apply(state, { type: "teacher:synthPage" }, "SYNTHESIS", "teacher");
  }
});

test("paging the finale backwards does not take cards off thirty desks", () => {
  // The desk carries what the board has REACHED, which has to be a high-water
  // mark. Read off `synthPage` alone, the teacher's own Back button — and the
  // forward wrap past the last card — would delete cards the room had already
  // discussed from every student device mid-discussion.
  let state = playSeason(toSeason(toAdopted(withDesks(12), [30])));
  const seat = state.clubs.find((c) => c.seatId !== null)!.seatId!;
  const all = synthesisCards(state, computeAggregate(state));
  const held = (): number => (((writeTheRuleModule.studentView(state, seat, "SYNTHESIS") as Record<string, unknown>)["cards"] as unknown[]) ?? []).length;

  for (let i = 1; i < all.length; i += 1) state = apply(state, { type: "teacher:synthPage" }, "SYNTHESIS", "teacher");
  assert.equal(held(), all.length, "the desk does not hold the whole deck once the board has walked it");

  state = apply(state, { type: "teacher:synthPageBack" }, "SYNTHESIS", "teacher");
  assert.equal(held(), all.length, "paging back stripped the deck the room had already seen");

  // Forward from the last card wraps the projector to card 1. The desk keeps its deck.
  for (let i = 0; i < 2; i += 1) state = apply(state, { type: "teacher:synthPage" }, "SYNTHESIS", "teacher");
  assert.equal((state as unknown as { synthPage: number }).synthPage, 0, "guard: the projector did not wrap");
  assert.equal(held(), all.length, "the forward wrap emptied every desk's finale deck");
});
