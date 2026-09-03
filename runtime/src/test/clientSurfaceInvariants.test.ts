/**
 * Source-level guards for three /play defects that a passing suite, a green
 * build, and a screenshot of Lesson 1 all missed. Each is a structural
 * invariant, not a rendering opinion, so a grep is the honest test: the browser
 * limb that PROVES the rendering lives in `scripts/e2e-*.cjs`, and this limb is
 * what stops the same class of regression re-entering between browser runs.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** dist/test -> runtime/ */
const RUNTIME = path.resolve(here, "..", "..");
const PLAY = fs.readFileSync(path.join(RUNTIME, "src", "client", "play", "main.ts"), "utf8");
const THEME = fs.readFileSync(path.join(RUNTIME, "src", "client", "shared", "theme.css"), "utf8");
const M2 = fs.readFileSync(path.join(RUNTIME, "src", "client", "shared", "m2.css"), "utf8");

/* ------------------------------------------------------------------------ *
 * 1. The M2 design layer is opt-in per renderer, never per lesson number.
 *
 * `theme.css` switches OFF every legacy `.fh-*` / `.price-dial-input` rule
 * under `html[data-module="m2"]`, on the promise that `m2.css` re-provides that
 * look. Only a renderer that was ported to `m2.css` can keep that promise.
 * Gating the attribute on the `m2l` id prefix put L2 and L3 — whose renderers
 * still emit the legacy classes — inside a scope that styles none of them:
 * measured in Chromium, their price dial fell back to the browser default
 * (`appearance: auto`) and the price readout dropped 22px -> 15px.
 * ------------------------------------------------------------------------ */
test("data-module=\"m2\" is granted by an explicit renderer allowlist, not an id prefix", () => {
  assert.match(
    PLAY,
    /const M2_DESIGN_LAYER_MODULES = new Set\(\[[^\]]*\]\)/,
    "the ported-renderer allowlist is gone — the M2 scope is being granted some other way",
  );
  assert.match(
    PLAY,
    /if \(M2_DESIGN_LAYER_MODULES\.has\(moduleId\)\) document\.documentElement\.dataset\.module = "m2"/,
    "the M2 scope must be granted from the allowlist",
  );
  assert.ok(
    !/startsWith\("m2l"\)/.test(PLAY),
    "an `m2l` id-prefix test is back: that sweeps every future M2 lesson into the scope whether or not its renderer was ported",
  );
});

test("every renderer inside the M2 scope has its legacy classes re-provided by m2.css", () => {
  const allow = /const M2_DESIGN_LAYER_MODULES = new Set\(\[([^\]]*)\]\)/.exec(PLAY);
  assert.ok(allow, "allowlist not found");
  const ported = [...allow[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(ported, ["m2l1-full-house"], "a lesson joined the M2 scope — port its renderer and re-measure the dial before widening this");

  // Any class the legacy sheet switches off under the scope must either be
  // re-provided by m2.css or not be emitted at all by a ported renderer.
  const switchedOff = new Set(
    [...THEME.matchAll(/html:not\(\[data-module="m2"\]\)\s+\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]!),
  );
  assert.ok(switchedOff.size > 0, "the legacy exclusion scope vanished — the leak guard it protects is gone too");
  assert.ok(switchedOff.has("price-dial-input"), "the price dial is no longer scoped; re-check which sheet styles it");
  // The dial the ported renderer emits carries the M2 class, so m2.css reaches it.
  assert.match(
    PLAY,
    /class="m2-range price-dial-input"/,
    "the ported renderer's dial lost its .m2-range class and has no styling in either sheet",
  );
  assert.match(M2, /html\[data-module="m2"\] \.m2-range \{/, "m2.css no longer styles .m2-range");
});

/* ------------------------------------------------------------------------ *
 * 2. Per-seat render caches do not outlive the seat.
 *
 * The renderers memoise outside the DOM (mount keys, local dial values,
 * seat-requested latches). This page never reloads when a pair signs out and
 * rejoins, or when a shared Chromebook is handed to a different pair, so a
 * cache that is not cleared is inherited by the next seat.
 * ------------------------------------------------------------------------ */
test("every module-level /play render cache is cleared on a seat change", () => {
  const reset = /function resetSeatRenderState\(\): void \{([\s\S]*?)\n\}/.exec(PLAY);
  assert.ok(reset, "resetSeatRenderState() is gone — seat caches now outlive the seat");
  const body = reset[1]!;

  // Both directions: claiming a seat and losing one.
  assert.match(PLAY, /savePlayCredentials\(creds\);\n[\s\S]{0,200}?resetSeatRenderState\(\);/, "a new seat does not clear the previous seat's caches");
  assert.match(PLAY, /clearPlayCredentials\(\);\n\s*creds = null;\n\s*resetSeatRenderState\(\);/, "signing out does not clear the seat's caches");

  // Enumerate the module-level `let` render caches and require each be reset.
  // Deliberately narrow: transport singletons (creds/outbox/poll) are owned by
  // the join and sign-out paths themselves, not by this function.
  const TRANSPORT = new Set(["creds", "outbox", "poll", "fhResizeBound", "fhResizeTimer"]);
  const declared = [...PLAY.matchAll(/^let ([a-zA-Z0-9_]+)\s*[:=]/gm)].map((m) => m[1]!);
  const caches = declared.filter((n) => !TRANSPORT.has(n));
  assert.ok(caches.length >= 15, `expected the per-seat cache set to be substantial, found ${caches.length}`);
  const missing = caches.filter((n) => !new RegExp(`\\b${n}\\s*=`).test(body));
  assert.deepEqual(
    missing,
    [],
    `these module-level /play caches survive a seat change: ${missing.join(", ")} — add them to resetSeatRenderState()`,
  );
});

/* ------------------------------------------------------------------------ *
 * 3. The settled building draws the people who could not get in.
 *
 * `arena.ts` draws `turnedAway` as a crowd outside the gates — the consequence
 * of underpricing a night is a picture of people left on the pavement, not only
 * a figure on the slate. The settled wrapper passed a hard-coded 0, so that
 * drawing was unreachable from the product.
 * ------------------------------------------------------------------------ */
test("the settled arena is handed the real turned-away count", () => {
  assert.ok(
    !/turnedAway: 0,/.test(PLAY),
    "a hard-coded `turnedAway: 0` is back in /play — the crowd outside the gates cannot render",
  );
  assert.match(
    PLAY,
    /view: "outcome"[^}]*turnedAway: n\.turnedAway/,
    "the settled (outcome) arena frame is not passed the night's own turned-away count",
  );
  assert.match(PLAY, /turnedAway: o\.turnedAway \?\? 0,/, "fhArenaFrame no longer forwards its caller's count");
});
