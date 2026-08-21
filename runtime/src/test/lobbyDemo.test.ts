import assert from "node:assert/strict";
import { test } from "node:test";
import { lobbyDemoModule, type LobbyDemoState } from "../modules/lobbyDemo.js";
import { isOrderedSubsequence } from "../shared/phases.js";

const ctx = (phase: "LOBBY" | "PLAY" | "REVEAL" | "SYNTHESIS" | "COMPLETE", seatId = "seat-1") => ({
  phase,
  seatId,
  seatIds: [seatId],
  now: Date.now(),
});

test("lobbyDemoModule declares a well-ordered phase subsequence", () => {
  assert.equal(isOrderedSubsequence(lobbyDemoModule.phases), true);
});

test("reduce rejects a pick outside PLAY", () => {
  const result = lobbyDemoModule.reduce({ picks: {} }, { type: "pick", color: "red" }, ctx("LOBBY"));
  assert.equal(result.ok, false);
});

test("reduce rejects an unknown action type", () => {
  const result = lobbyDemoModule.reduce({ picks: {} }, { type: "nonsense" }, ctx("PLAY"));
  assert.equal(result.ok, false);
});

test("reduce rejects a malformed color", () => {
  const result = lobbyDemoModule.reduce({ picks: {} }, { type: "pick", color: "purple" }, ctx("PLAY"));
  assert.equal(result.ok, false);
});

test("reduce records a valid pick and allows overwriting it", () => {
  let state: LobbyDemoState = { picks: {} };
  const first = lobbyDemoModule.reduce(state, { type: "pick", color: "red" }, ctx("PLAY"));
  assert.equal(first.ok, true);
  if (!first.ok) return;
  state = first.state;
  assert.equal(state.picks["seat-1"], "red");

  const second = lobbyDemoModule.reduce(state, { type: "pick", color: "blue" }, ctx("PLAY"));
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.state.picks["seat-1"], "blue");
});

test("reduce rejects a teacher trying to pick", () => {
  const result = lobbyDemoModule.reduce({ picks: {} }, { type: "pick", color: "red" }, ctx("PLAY", "teacher"));
  assert.equal(result.ok, false);
});

test("aggregate tallies picks correctly across seats", () => {
  const state = { picks: { a: "red" as const, b: "red" as const, c: "blue" as const } };
  const tally = lobbyDemoModule.aggregate(state, "REVEAL") as Record<string, number>;
  assert.equal(tally.red, 2);
  assert.equal(tally.blue, 1);
  assert.equal(tally.green, 0);
  assert.equal(tally.yellow, 0);
});

test("boardView is distinct across reveal and synthesis modes", () => {
  const state = { picks: { a: "red" as const } };
  const reveal = lobbyDemoModule.boardView(state, "REVEAL") as { mode: string };
  const synthesis = lobbyDemoModule.boardView(state, "SYNTHESIS") as { mode: string; note?: string };
  assert.equal(reveal.mode, "reveal");
  assert.equal(synthesis.mode, "synthesis");
  assert.ok(synthesis.note && synthesis.note.length > 0);
});

test("studentView never includes another seat's pick", () => {
  const state = { picks: { "seat-1": "red" as const, "seat-2": "blue" as const } };
  const view = lobbyDemoModule.studentView(state, "seat-1", "PLAY") as Record<string, unknown>;
  assert.deepEqual(Object.keys(view).sort(), ["colors", "myPick", "phase"]);
  assert.equal(view["myPick"], "red");
});
