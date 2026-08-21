/**
 * `crypto.randomUUID()` is restricted to secure contexts (HTTPS or
 * localhost). This server is deliberately plain HTTP on the classroom LAN
 * (a teacher's laptop IP, e.g. http://10.0.x.x:4300) — there is no
 * certificate to hand out to thirty Chromebooks five minutes before class.
 * `crypto.getRandomValues` has no such restriction, so it is what this app
 * uses for client-side ids.
 */
export function randomId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
