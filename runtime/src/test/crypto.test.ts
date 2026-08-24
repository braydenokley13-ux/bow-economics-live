import assert from "node:assert/strict";
import { test } from "node:test";
import { generateDeviceToken, generateJoinCode, generatePin, hashDeviceToken, hashPin, verifyPin } from "../server/crypto.js";

test("hashPin/verifyPin round-trips correctly", () => {
  const pin = "4821";
  const hashed = hashPin(pin);
  assert.equal(verifyPin(pin, hashed), true);
});

test("verifyPin rejects a wrong PIN", () => {
  const hashed = hashPin("1234");
  assert.equal(verifyPin("9999", hashed), false);
});

test("verifyPin rejects garbage stored digests without throwing", () => {
  assert.equal(verifyPin("1234", "not-a-real-digest"), false);
  assert.equal(verifyPin("1234", ""), false);
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
