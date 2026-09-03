/**
 * W5 — WHILE YOU WERE AWAY, at the service boundary.
 *
 * A Chromebook sleeps through a bell. A tab is closed for five minutes. A pair
 * goes to the nurse and comes back to a settled book with no idea what moved.
 *
 * The founder's ruling for that return is exact: the desk gets CURRENT
 * AUTHORITATIVE STATE plus a compact recap of what it missed, and the class is
 * NOT rewound. This proves the whole shape of that — who is told, who is not,
 * what is in the log, and the several ways it could quietly fail to arrive.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fullHouseModule } from "../modules/fullHouse.js";
import { SessionService } from "../server/sessionService.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";

const AWAY_MS = 30_000;

function harness() {
  const repo = new SnapshotRepository(null);
  const svc = new SessionService(repo);
  svc.registerModule(fullHouseModule);
  return { repo, svc };
}

/** Drive a session to PLAY with seated desks. */
async function inPlay(names: string[]) {
  const { repo, svc } = harness();
  const created = await svc.createSession({ lessonModuleId: fullHouseModule.id, title: "" });
  const code = created.session.code;
  const key = created.teacherKey!;
  const seats = [];
  for (const name of names) seats.push(await svc.join(code, name));
  await svc.control(code, { type: "advance" }, key); // LOBBY -> HOOK
  await svc.control(code, { type: "advance" }, key); // HOOK -> PLAY
  for (const seat of seats) await svc.submitAction(seat.deviceToken!, { type: "takeSeat" });
  return { repo, svc, code, key, seats };
}

/** Put a desk's clock back far enough that its next poll is a RETURN. */
async function goDark(repo: SnapshotRepository, seatId: string, ms = AWAY_MS + 5_000): Promise<void> {
  await repo.updateSeat(seatId, { lastSeenAt: new Date(Date.now() - ms).toISOString() });
}

test("a desk that slept through a bell is told what the class did, and is not rewound", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben", "Ada & Cy"]);
  const away = seats[0]!;
  const present = seats[1]!;

  // Both desks price night one; then one goes dark and the class runs on.
  for (const s of seats) {
    await svc.submitAction(s.deviceToken!, { type: "setPrice", price: 30 });
    await svc.submitAction(s.deviceToken!, { type: "lock" });
  }
  await goDark(repo, away.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);

  const back = await svc.resumeByToken(away.deviceToken!);
  assert.ok(back.away, "a desk that missed a bell must be told it missed one");
  assert.ok(back.away!.lines.length > 0);
  assert.ok(
    back.away!.lines.some((l) => /Night 1 closed/.test(l)),
    `the bell must be in the recap: ${JSON.stringify(back.away!.lines)}`,
  );

  // NOT A REWIND. The view handed back is the room as it stands now — night
  // two — exactly what the desk that never left is looking at.
  const here = await svc.resumeByToken(present.deviceToken!);
  assert.equal(here.away, null, "a desk that never left must not be handed a recap");
  assert.deepEqual(
    (back.view as Record<string, unknown>)["nightNumber"],
    (here.view as Record<string, unknown>)["nightNumber"],
    "the returning desk must be on the same night as the room",
  );
  assert.equal(back.session.version, here.session.version);
});

test("being away while nothing happened is not something a pair is told", async () => {
  const { repo, svc, seats } = await inPlay(["Rae & Ben"]);
  await goDark(repo, seats[0]!.seat.id, 10 * 60_000);
  const back = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(back.away, null, "ten quiet minutes is not a recap");
});

test("a blink is not an absence", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  // Just under the threshold: a dropped poll or a slow reconcile, not a desk
  // that left the room. The class moves on underneath it.
  await goDark(repo, seats[0]!.seat.id, AWAY_MS - 5_000);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const back = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(back.away, null, "a network hiccup must never produce a recap");
});

test("the recap survives the desk's own next poll, and a refresh, until it is acknowledged", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  await goDark(repo, seats[0]!.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);

  const first = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.ok(first.away);
  // This is the failure the design exists to prevent: the poll that discovers
  // the recap also stamps the seat, and a naive implementation erases the card
  // 1.2 seconds later — before anybody has read it.
  const second = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.ok(second.away, "the recap must survive the poll that follows it");
  assert.deepEqual(second.away!.lines, first.away!.lines);

  const acknowledged = await svc.acknowledgeRecap(seats[0]!.deviceToken!);
  assert.equal(acknowledged.away, null, "'Got it' must clear it");
  const after = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(after.away, null, "and it must stay cleared");
});

test("what happens while the card is still up joins it rather than replacing it", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  await goDark(repo, seats[0]!.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const first = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(first.away!.lines.length, 1);

  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const grown = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(grown.away!.lines.length, 2, "the second bell joins the card, it does not replace it");
  assert.ok(grown.away!.lines[0]!.includes("Night 1"));
  assert.ok(grown.away!.lines[1]!.includes("Night 2"));
});

test("an action is presence: a desk that comes back and plays is not still away", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  await goDark(repo, seats[0]!.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const back = await svc.submitAction(seats[0]!.deviceToken!, { type: "setPrice", price: 40 });
  // The card is still owed — the pair has not read it — but the desk is not
  // accruing a SECOND absence on top of the first.
  assert.ok(back.away, "the recap is owed until it is acknowledged, action or no action");
  await svc.acknowledgeRecap(seats[0]!.deviceToken!);
  const later = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.equal(later.away, null);
});

test("a pair joining mid-class is level with the room — the lesson so far is not a recap", async () => {
  const { svc, code, key } = await inPlay(["Rae & Ben"]);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const late = await svc.join(code, "Nell & Ozzie");
  assert.equal(late.away, null, "a desk cannot have missed what happened before it existed");
});

test("the class log is class-level: no desk's decision is ever written into it", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben", "Ada & Cy"]);
  for (const [i, s] of seats.entries()) {
    await svc.submitAction(s.deviceToken!, { type: "setPrice", price: 20 + i * 20 });
    await svc.submitAction(s.deviceToken!, { type: "lock" });
  }
  await goDark(repo, seats[0]!.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  await svc.control(code, { type: "advance" }, key); // PLAY -> REVEAL

  const back = await svc.resumeByToken(seats[0]!.deviceToken!);
  const text = back.away!.lines.join(" ");
  // The recap is read back by whichever desk returns. A line naming a price or
  // a pair would be printing one desk's private decision on another's screen —
  // and this lesson's entire reveal depends on the room not seeing each
  // other's dials before the bell.
  for (const forbidden of ["Rae", "Ben", "Ada", "Cy", "$20", "$40"]) {
    assert.ok(!text.includes(forbidden), `the class log leaked "${forbidden}": ${text}`);
  }
  assert.ok(/projector/i.test(text) || /Night/.test(text), `the recap said nothing useful: ${text}`);
});

test("a restore never announces the night it undid", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  await svc.control(code, { type: "restore" }, key);
  await goDark(repo, seats[0]!.seat.id);
  await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  const back = await svc.resumeByToken(seats[0]!.deviceToken!);
  const nights = back.away!.lines.filter((l) => /closed/.test(l));
  assert.equal(nights.length, 1, `a rewound night must not be recapped as two: ${JSON.stringify(back.away!.lines)}`);
});

test("the recap is bounded — a desk away for the whole lesson gets a card, not a transcript", async () => {
  const { repo, svc, code, key, seats } = await inPlay(["Rae & Ben"]);
  await goDark(repo, seats[0]!.seat.id);
  for (let n = 0; n < 5; n += 1) await svc.control(code, { type: "hook", hook: "closeNight" }, key);
  await svc.control(code, { type: "advance" }, key);
  await svc.control(code, { type: "advance" }, key);
  const back = await svc.resumeByToken(seats[0]!.deviceToken!);
  assert.ok(back.away!.lines.length <= 6, `a recap must stay a card: ${back.away!.lines.length} lines`);
  // Trimmed from the front: the beats nearest to now are the ones the pair is
  // about to act on.
  assert.ok(
    /CONSEQUENCE|naming|reading|projector/i.test(back.away!.lines.at(-1)!),
    `the last line should be the most recent beat: "${back.away!.lines.at(-1)}"`,
  );
});
