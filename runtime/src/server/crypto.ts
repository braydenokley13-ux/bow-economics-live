/**
 * Secrets handling, adapted from bow-finlit's `api/_lib/crypto.ts`.
 *
 * Kept as-is: scrypt PIN digest, SHA-256 token digest, constant-time compare
 * internals (via node:crypto's own timingSafeEqual inside scrypt verify) —
 * these are generic and portable, zero finlit imports in the original.
 *
 * Dropped: the founder-session HMAC cookie signer. This product has one
 * teacher on one laptop running the server locally for their own class —
 * there is no second party to authenticate against, so a signed session
 * cookie is pure friction with nothing to protect. If a future need for
 * teacher auth appears (e.g. a hosted multi-teacher deployment), the donor's
 * `signFounderSession`/`verifyFounderSession` pattern is the one to bring
 * back; it is not reimplemented here on the "unproven until needed" theory.
 *
 * Renamed for this product's vocabulary: `generateAccessToken` ->
 * `generateDeviceToken` (the /play resume credential), `generateClassCode`
 * -> `generateJoinCode`.
 */
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

/** Hash a rejoin PIN. Format is self-describing so parameters can change without a migration. */
export function hashPin(pin: string, salt: Buffer = randomBytes(16)): string {
  const derived = scryptSync(pin, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), derived.toString("base64")].join(
    "$",
  );
}

export function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltRaw = parts[4];
  const digestRaw = parts[5];
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || !saltRaw || !digestRaw) {
    return false;
  }
  const salt = Buffer.from(saltRaw, "base64");
  const expected = Buffer.from(digestRaw, "base64");
  let derived: Buffer;
  try {
    derived = scryptSync(pin, salt, expected.length, { N: n, r, p });
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** A four-digit rejoin PIN drawn from a cryptographic source, leading zeros kept. */
export const generatePin = (): string => String(randomInt(0, 10_000)).padStart(4, "0");

/** The opaque device token handed to a student's browser for instant resume. Never stored as issued. */
export const generateDeviceToken = (): string => randomBytes(32).toString("base64url");

export const hashDeviceToken = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex");

/**
 * A readable join code, drawn from a cryptographic source so codes are not
 * guessable in sequence. Uniqueness against existing sessions is the
 * caller's job.
 *
 * `I`, `O`, `S`, `Z`, `0`, `1`, `5`, `2` are left out of the alphabet so a
 * code read aloud across a classroom, or copied off the projector, cannot
 * be misheard or mistyped.
 */
export function generateJoinCode(
  prefix = "BOW",
  alphabet = "34679ACDEFGHJKLMNPQRTUVWXY",
  length = 3,
): string {
  let tail = "";
  for (let i = 0; i < length; i += 1) tail += alphabet[randomInt(0, alphabet.length)];
  return `${prefix}${tail}`;
}
