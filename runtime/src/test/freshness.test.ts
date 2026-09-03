/**
 * The freshness gate (W2, action integrity).
 *
 * A poll issued before a decision can answer after it. The server never lowers
 * a session's version, so a surface refusing to move backwards is enough to
 * stop a frame from before the decision being drawn over the decision itself —
 * without making any action wait on a poll. Reproduced in the browser by
 * `scripts/e2e-stale-poll.cjs`; this file pins the rule.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createFreshness } from "../client/shared/freshness.js";

type Frame = { session?: { code?: string; version?: number } | null };
const gate = () =>
  createFreshness<Frame>((p) => ({ code: p.session?.code ?? null, version: p.session?.version ?? NaN }));
const at = (code: string, version: number): Frame => ({ session: { code, version } });

test("a frame from before one already drawn is refused, and never becomes the new floor", () => {
  const g = gate();
  assert.equal(g.accept(at("BOW1", 10)), true);
  assert.equal(g.accept(at("BOW1", 9)), false, "a version-9 frame drew over a version-10 one");
  assert.equal(g.version, 10, "a refused frame must not lower the floor");
  // ...and the room keeps moving normally afterwards.
  assert.equal(g.accept(at("BOW1", 11)), true);
  assert.equal(g.version, 11);
});

test("an equal version passes — the same version legitimately carries a different frame", () => {
  // A countdown's serverNow, a while-you-were-away recap arriving, a seat list
  // refresh: all of these come back at the version they were read at. Dropping
  // them would stop clocks on every surface.
  const g = gate();
  assert.equal(g.accept(at("BOW1", 4)), true);
  assert.equal(g.accept(at("BOW1", 4)), true);
  assert.equal(g.accept(at("BOW1", 4)), true);
});

test("a different room is not a rewind", () => {
  // A teacher who ends a long class and opens a fresh one lands on version 1,
  // far below the room they just left. A gate that treated that as stale would
  // leave the console frozen on the previous class for the whole lesson.
  const g = gate();
  assert.equal(g.accept(at("BOW1", 40)), true);
  assert.equal(g.accept(at("BOW2", 1)), true, "the new room's first frame was refused as stale");
  assert.equal(g.version, 1);
  assert.equal(g.accept(at("BOW2", 2)), true);
  // And the OLD room's late frames are now the stale ones.
  assert.equal(g.accept(at("BOW1", 39)), true, "a frame from another room is not comparable and must not be swallowed");
});

test("reset clears the floor, for a surface pointed at a room again", () => {
  const g = gate();
  g.accept(at("BOW1", 20));
  g.reset();
  assert.equal(g.version, -1);
  assert.equal(g.accept(at("BOW1", 3)), true, "after a reset the next frame is the floor, whatever it is");
});

test("a payload this gate cannot read is passed through, never swallowed", () => {
  // Swallowing an unrecognised shape would blank a live surface for the rest of
  // the class. The renderer is allowed to deal with its own payloads.
  const g = gate();
  assert.equal(g.accept({} as Frame), true);
  assert.equal(g.accept({ session: null } as Frame), true);
  assert.equal(g.accept({ session: { code: "BOW1" } } as Frame), true, "a versionless frame is not a stale frame");
  const throwing = createFreshness<Frame>(() => {
    throw new Error("no");
  });
  assert.equal(throwing.accept(at("BOW1", 1)), true, "a reader that throws must not take the surface down");
});

test("the gate reads whatever shape the surface polls", () => {
  // /board carries `version` at the top level and has no `session` object at
  // all. The three surfaces are not being given a shared payload type.
  type BoardFrame = { version: number };
  const g = createFreshness<BoardFrame>((p) => ({ code: "BOW1", version: p.version }));
  assert.equal(g.accept({ version: 7 }), true);
  assert.equal(g.accept({ version: 6 }), false);
  assert.equal(g.accept({ version: 8 }), true);
});
