import assert from "node:assert/strict";
import { test } from "node:test";
import { generateDeviceToken, generateJoinCode, generatePin, hashDeviceToken, hashPin, hashPinSync, verifyPin } from "../server/crypto.js";

test("hashPin/verifyPin round-trips correctly", async () => {
  const pin = "4821";
  const hashed = await hashPin(pin);
  assert.equal(await verifyPin(pin, hashed), true);
});

test("verifyPin rejects a wrong PIN", async () => {
  const hashed = await hashPin("1234");
  assert.equal(await verifyPin("9999", hashed), false);
});

test("verifyPin rejects garbage stored digests without throwing", async () => {
  assert.equal(await verifyPin("1234", "not-a-real-digest"), false);
  assert.equal(await verifyPin("1234", ""), false);
});

test("the sync form and the async form produce interchangeable digests", async () => {
  // The request path must never call the sync form (it blocks the event loop
  // for ~38ms per call, and a 30-device join burst blocked the whole server for
  // over a second before this split). The sync form exists for tests and
  // tooling, and this guards that the two cannot drift apart.
  assert.equal(await verifyPin("7788", hashPinSync("7788")), true);
  assert.equal(await verifyPin("0000", hashPinSync("7788")), false);
});

test("generatePin always returns four digits, zero-padded", () => {
  for (let i = 0; i < 50; i += 1) {
    const pin = generatePin();
    assert.match(pin, /^\d{4}$/);
  }
});

test("generateDeviceToken/hashDeviceToken are consistent and unique per call", () => {
  const a = generateDeviceToken();
  const b = generateDeviceToken();
  assert.notEqual(a, b);
  assert.equal(hashDeviceToken(a), hashDeviceToken(a));
  assert.notEqual(hashDeviceToken(a), hashDeviceToken(b));
});

test("generateJoinCode matches prefix + alphabet + length", () => {
  const code = generateJoinCode("BOW", "34679ACDEFGHJKLMNPQRTUVWXY", 3);
  assert.match(code, /^BOW[34679ACDEFGHJKLMNPQRTUVWXY]{3}$/);
});
