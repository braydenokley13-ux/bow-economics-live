/**
 * MODULE 1 · LESSON 3 — "THE DEADLINE" — MARKET UNIT TESTS.
 *
 * Pure `market.ts` only: legality, the room-absorption matching rule, the
 * apron-team-salary distinction, the counter's one-change rule, and the
 * sealed contested-hour resolution. The sweep (`same-line-l3-sweep.mjs`)
 * proves these hold over a declared family of played rooms; this file proves
 * the individual rules against hand-built fixtures, including the exact
 * worked cases the Economic Truth review named (D61).
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTrade,
  apronSalaryOf,
  checkTrade,
  isContract,
  isOneChange,
  isPick,
  outBar,
  resolveContested,
  resolveOwned,
  salaryOf,
  sumSalary,
  type ContestEntry,
  type ContractObject,
  type PickObject,
  type TradeDeskLike,
} from "../modules/sameLine/market.js";
import { LINE, ROSTER, type ClubId } from "../modules/sameLine/world.js";
import { profileFor } from "../shared/gradeBand.js";

const P56 = profileFor("5-6");
const P78 = profileFor("7-8");

function contract(id: string, annual: number, extra: Partial<ContractObject> = {}): ContractObject {
  return { kind: "contract", contractId: id, playerId: id, name: id, role: "BIG", annual, yearsRemaining: 2, jobState: "DOES_JOB", acquiredWeek: 1, ...extra };
}
function pick(id: string): PickObject {
  return { kind: "pick", pickId: id, year: 2029, round: 1, label: "2029 first" };
}
function desk(seatId: string, clubId: ClubId, twin: 0 | 1, committed: number, roster: ContractObject[], picksOwned: PickObject[] = [pick(`${seatId}-p1`), pick(`${seatId}-p2`)], holds = 0, wall: number | null = null): TradeDeskLike {
  return { seatId, clubId, twin, roster, picksOwned, books: { committed, holds, wall } };
}
const roster14 = (prefix: string, annual = 3_000_000): ContractObject[] => Array.from({ length: 14 }, (_, i) => contract(`${prefix}-${i}`, annual));

test("R8 — twin desks never transact, regardless of amounts", () => {
  const a = desk("a", "memphis", 0, LINE.cap - 1_000_000, [contract("watford", 2_900_000)]);
  const b = desk("b", "memphis", 1, LINE.cap - 1_000_000, [contract("kuminga", 1)]);
  const r = checkTrade(a, b, ["watford"], ["kuminga"], P56);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /same books/);
});

test("outBar — an over-cap desk's bar collapses to exactly what it sends (100% matching)", () => {
  const overCap = LINE.cap + 5_000_000;
  assert.equal(outBar(overCap, 1_000_000), 1_000_000);
});

test("outBar — a desk with cap room absorbs more than it sends (D61 worked case)", () => {
  // Memphis, committed $161,034,793 (world.ts), sends Watford ($2,900,000).
  const committed = 161_034_793;
  const sent = 2_900_000;
  const afterSendingOnly = committed - sent; // 158,134,793
  const expectedRoom = LINE.cap - afterSendingOnly; // 6,826,207 at cap $164,961,000
  assert.equal(expectedRoom, 6_826_207);
  assert.equal(outBar(committed, sent), sent + expectedRoom); // $9,726,207
});

test("D61 worked case — Memphis sends Watford ($2.9M), receives Kuminga ($6,064,000): legal", () => {
  const memphis = desk("memphis-a", "memphis", 0, 161_034_793, [contract("watford", 2_900_000)]);
  const detroit = desk("detroit-a", "detroit", 0, LINE.cap - 20_000_000, [contract("kuminga", 6_064_000)]);
  const r = checkTrade(memphis, detroit, ["watford"], ["kuminga"], P78);
  assert.equal(r.ok, true, r.ok ? "" : r.reason);
});

test("room-absorption rule clears the market: 14 distinct contract salaries still trade, not only exact matches", () => {
  // The defect this rule replaces: incoming<=outgoing on BOTH sides forces
  // dollar-exact trades. A desk with real room must legally take back MORE
  // than it sends.
  const rich = desk("rich", "memphis", 0, LINE.cap - 30_000_000, [contract("cheap", 1_000_000)]);
  const other = desk("other", "detroit", 0, LINE.cap - 5_000_000, [contract("pricier", 9_000_000)]);
  const r = checkTrade(rich, other, ["cheap"], ["pricier"], P78);
  assert.equal(r.ok, true, r.ok ? "" : r.reason);
});

test("room-absorption rule — a desk already over the cap cannot absorb more than it sends", () => {
  const taxpayer = desk("tax", "boston", 0, LINE.apron1 + 2_000_000, [contract("small", 2_000_000)]);
  const other = desk("other", "detroit", 0, LINE.cap - 5_000_000, [contract("big", 6_000_000)]);
  const r = checkTrade(taxpayer, other, ["small"], ["big"], P78);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /take back/);
});

test("D61 — apron tests run on committed-holds, never raw committed", () => {
  // Detroit: raw committed sits ABOVE the first apron, but holds are large
  // enough that committed-holds sits BELOW it. A wall drawn at the first
  // apron must therefore treat this desk as still under that line.
  const rawCommitted = LINE.apron1 + 1_000_000;
  const holds = 2_000_000; // apron salary = apron1 - 1,000,000: below the line
  assert.ok(apronSalaryOf(rawCommitted, holds) < LINE.apron1);
  const detroit = desk("det", "detroit", 0, rawCommitted, [], [pick("det-p1"), pick("det-p2")], holds, LINE.apron1);
  const other = desk("other", "boston", 0, LINE.cap - 10_000_000, [contract("small", 500_000)]);
  // Detroit sends a $0 pick, receives a small contract. Post-trade apron
  // salary is still under the apron1 wall, so this must be legal even though
  // post-trade RAW committed ($LINE.apron1 + 1,500,000) sits past it.
  const r = checkTrade(detroit, other, ["det-p1"], ["small"], P78);
  assert.equal(r.ok, true, r.ok ? "" : r.reason);
});

test("R3 — a wall tested on apron salary still refuses a trade that would cross it", () => {
  const committed = LINE.apron1 - 100_000;
  const holds = 0; // apron salary == committed here
  const detroit = desk("det", "detroit", 0, committed, [], [pick("det-p1"), pick("det-p2")], holds, LINE.apron1);
  const other = desk("other", "boston", 0, LINE.cap - 10_000_000, [contract("big", 500_000)]);
  const r = checkTrade(detroit, other, ["det-p1"], ["big"], P78);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /wall/);
});

test("picks contribute $0 to both sides of the matching comparison", () => {
  const a = desk("a", "memphis", 0, LINE.apron2 + 10_000_000, [], [pick("a-p1"), pick("a-p2")]);
  const b = desk("b", "detroit", 0, LINE.apron2 + 10_000_000, [], [pick("b-p1"), pick("b-p2")]);
  const r = checkTrade(a, b, ["a-p1"], ["b-p1"], P56);
  assert.equal(r.ok, true, r.ok ? "" : r.reason);
});

test("R6 — roster slots must stay within ROSTER.min..ROSTER.max", () => {
  const thin = desk("thin", "memphis", 0, LINE.cap - 5_000_000, roster14("thin").slice(0, 14));
  const other = desk("other", "detroit", 0, LINE.cap - 5_000_000, [contract("only-one", 1_000_000)]);
  // thin sends two contracts, receives one -> ends at 13, below ROSTER.min.
  const twoContracts = [thin.roster[0]!.contractId, thin.roster[1]!.contractId];
  const r = checkTrade(thin, other, twoContracts, ["only-one"], P78);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /players under contract/);
  void ROSTER;
});

test("R4 — aggregating two outgoing contracts is refused past the second apron, allowed under it", () => {
  const send1 = contract("s1", 5_000_000);
  const send2 = contract("s2", 5_000_000);
  const nearApron2 = desk("agg", "memphis", 0, LINE.apron2 - 8_000_000, [send1, send2]);
  const rich = desk("rich", "detroit", 0, LINE.cap - 20_000_000, [contract("get", 1_000_000)]);
  const overLimit = checkTrade(nearApron2, rich, ["s1", "s2"], ["get"], P78);
  assert.equal(overLimit.ok, false);
  if (!overLimit.ok) assert.match(overLimit.reason, /second apron/);

  const roomy = desk("agg2", "memphis", 0, LINE.apron2 - 20_000_000, [contract("s3", 1_000_000), contract("s4", 1_000_000)]);
  const under = checkTrade(roomy, rich, ["s3", "s4"], ["get"], P78);
  assert.equal(under.ok, true, under.ok ? "" : under.reason);
});

test("5-6 composer never exposes more than one object per side", () => {
  const a = desk("a", "memphis", 0, LINE.cap - 5_000_000, [contract("x", 1_000_000), contract("y", 1_000_000)]);
  const b = desk("b", "detroit", 0, LINE.cap - 5_000_000, [contract("z", 1_000_000)]);
  const r = checkTrade(a, b, ["x", "y"], ["z"], P56);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /up to 1/);
});

test("resolveOwned refuses an object not on that desk's own books", () => {
  const a = desk("a", "memphis", 0, LINE.cap, [contract("x", 1_000_000)]);
  assert.equal(resolveOwned(a, ["not-mine"]), null);
  assert.equal(resolveOwned(a, ["x"])?.length, 1);
});

test("isOneChange — a counter may swap one object, or add/remove exactly one pick", () => {
  const isPickId = (id: string) => id.startsWith("p");
  assert.equal(isOneChange(["c1"], ["c2"], ["c1"], ["c3"], isPickId), true); // swap
  assert.equal(isOneChange(["c1"], ["c2", "p1"], ["c1"], ["c2"], isPickId), true); // remove a pick
  assert.equal(isOneChange(["c1"], ["c2"], ["c1"], ["c2", "p1"], isPickId), true); // add a pick
  assert.equal(isOneChange(["c1"], ["c2"], ["c3"], ["c4"], isPickId), false); // two swaps
  assert.equal(isOneChange(["c1"], ["c2", "p1"], ["c1"], ["c3"], isPickId), false); // remove a non-pick + add
});

test("resolveContested — fills-an-open-job beats a larger salary, deterministically, regardless of input order", () => {
  const entries: ContestEntry[] = [
    { offerId: "o1", acceptedBy: "seat", counterpartyClubId: "boston", counterpartyTwin: 0, fillsOpenJob: false, outgoingSalaryFromAccepting: 9_000_000 },
    { offerId: "o2", acceptedBy: "seat", counterpartyClubId: "detroit", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
  ];
  const forward = resolveContested(entries);
  const backward = resolveContested([...entries].reverse());
  assert.deepEqual(forward, backward);
  assert.deepEqual(forward.clears, ["o2"]);
  assert.deepEqual(forward.voided, ["o1"]);
});

test("resolveContested — tie on fillsOpenJob broken by larger outgoing salary, then by club order, then by twin", () => {
  const tieOnJob: ContestEntry[] = [
    { offerId: "low", acceptedBy: "s", counterpartyClubId: "boston", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
    { offerId: "high", acceptedBy: "s", counterpartyClubId: "detroit", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 5_000_000 },
  ];
  assert.deepEqual(resolveContested(tieOnJob).clears, ["high"]);

  const tieOnSalary: ContestEntry[] = [
    { offerId: "later-club", acceptedBy: "s", counterpartyClubId: "minnesota", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
    { offerId: "earlier-club", acceptedBy: "s", counterpartyClubId: "brooklyn", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
  ];
  assert.deepEqual(resolveContested(tieOnSalary).clears, ["earlier-club"]);

  const tieOnTwin: ContestEntry[] = [
    { offerId: "twinB", acceptedBy: "s", counterpartyClubId: "boston", counterpartyTwin: 1, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
    { offerId: "twinA", acceptedBy: "s", counterpartyClubId: "boston", counterpartyTwin: 0, fillsOpenJob: true, outgoingSalaryFromAccepting: 1_000_000 },
  ];
  assert.deepEqual(resolveContested(tieOnTwin).clears, ["twinA"]);
});

test("applyTrade — transfers named objects only, updates committed/taxSalary by the executed annuals, and touches nothing else", () => {
  const from = { roster: [contract("send-me", 3_000_000), contract("keep-me", 1_000_000)], picksOwned: [pick("from-p1")], committed: 100_000_000, taxSalary: 100_000_000 };
  const to = { roster: [contract("want-me", 5_000_000)], picksOwned: [pick("to-p1")], committed: 90_000_000, taxSalary: 90_000_000 };
  const effect = applyTrade(from, to, ["send-me"], ["want-me"], 3);
  assert.deepEqual(effect.from.roster.map((c) => c.contractId).sort(), ["keep-me", "want-me"]);
  assert.deepEqual(effect.to.roster.map((c) => c.contractId), ["send-me"]);
  assert.equal(effect.from.committed, 100_000_000 - 3_000_000 + 5_000_000);
  assert.equal(effect.to.committed, 90_000_000 - 5_000_000 + 3_000_000);
  assert.equal(effect.from.taxSalary, effect.from.committed);
  assert.equal(effect.to.taxSalary, effect.to.committed);
  // Acquired stamp: the object that moved carries acquiredWeek 3 on its new desk.
  assert.equal(effect.to.roster[0]!.acquiredWeek, 3);
});

test("isContract / isPick / salaryOf / sumSalary — the object-type discipline", () => {
  const c = contract("c1", 4_000_000);
  const p = pick("p1");
  assert.equal(isContract(c), true);
  assert.equal(isPick(c), false);
  assert.equal(isPick(p), true);
  assert.equal(salaryOf(c), 4_000_000);
  assert.equal(salaryOf(p), 0);
  assert.equal(sumSalary([c, p]), 4_000_000);
});
