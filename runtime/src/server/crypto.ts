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
import { createHash, randomBytes, randomInt, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * scrypt on the THREAD POOL rather than the event loop.
 *
 * Measured on this machine: `scryptSync` at these parameters costs ~38ms per
 * call, and a start-of-class burst of 30 devices joining at once blocked the
 * single process for ~1.1 seconds — during which a `/board` poll issued in
 * parallel took ~1.0s to answer. That is the projector visibly freezing at the
 * exact moment a class begins, and it scales with the size of the room.
 *
 * The work itself is not the problem and the cost parameters are not lowered:
 * a rejoin PIN is four digits and its digest is the only thing standing between
 * a guesser and somebody else's seat. What changes is where it runs. Node's
 * async scrypt hands the work to the libuv thread pool, so joins proceed in
 * parallel with each other and, more importantly, with every poll the rest of
 * the room is making.
 */
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

const encode = (salt: Buffer, derived: Buffer): string =>
  ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), derived.toString("base64")].join("$");

/** Hash a rejoin PIN off the event loop. Format is self-describing so parameters can change without a migration. */
export async function hashPin(pin: string, salt: Buffer = randomBytes(16)): Promise<string> {
  const derived = await scryptAsync(pin, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return encode(salt, derived);
}

/** Synchronous form, for tests and tooling only — never on a request path. */
export function hashPinSync(pin: string, salt: Buffer = randomBytes(16)): string {
  return encode(salt, scryptSync(pin, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }));
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
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
    derived = await scryptAsync(pin, salt, expected.length, { N: n, r, p });
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
