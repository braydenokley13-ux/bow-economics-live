/**
 * THE RENDERED-CLAIM SOURCE LIMB.
 *
 * `ECON_ADAPTATION_RULINGS.md` §0, restated in `VISUAL_REFERENCE_CONTRACT.md` §G:
 * every economic-truth protection Module 2 Lesson 1 has stops at the module
 * boundary. No test in this repository read a single line of
 * `runtime/src/client/**`, so a builder could compute a projected attendance in
 * the client, print "Target: $110-$120" as a literal, or label CASH "profit",
 * and `npm test` stayed green. R-1 closes that with two limbs: a browser limb in
 * `scripts/e2e-m2l1.cjs` (which recomputes the settlement and reads the DOM),
 * and this one — a source-level grep that runs inside `npm test`, catches the
 * label class with no browser, and costs nothing.
 *
 * WHAT IT CHECKS. Every string literal and template-literal chunk in the three
 * client entry points, against the forbidden vocabulary R-1 lists. Comments are
 * not checked: a comment explaining why there is no forecast is exactly the kind
 * of writing this repo wants. `${...}` expressions inside template literals are
 * skipped as code, not text.
 *
 * TWO ESCAPE HATCHES, both explicit:
 *  1. `// claim-ok: <reason>` on the source line — for a hit in code this lane
 *     owns, where the reason fits on the line.
 *  2. `clientClaims.allow.json` — one entry per line-pattern, each with a
 *     reason, for the hits that already existed at head (Module 1 domain nouns,
 *     DOM ids, CSS class names, payload key names, and the word "projector",
 *     which is the name of a surface). An entry that matches nothing is a
 *     failure too, so the allowlist cannot rot into a blanket waiver.
 *
 * The scanner is a heuristic, not a parser: an apostrophe inside a comment can
 * open a phantom string, so single- and double-quoted literals are abandoned at
 * end of line (which is also what JavaScript does). It errs toward reporting.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** dist/test -> runtime/ */
const RUNTIME = path.resolve(here, "..", "..");
const SRC = path.join(RUNTIME, "src", "client");
const ALLOW_FILE = path.join(RUNTIME, "src", "test", "clientClaims.allow.json");

const SURFACES = ["play", "board", "teach"] as const;

/**
 * R-1's list, verbatim, plus the three the contract adds elsewhere:
 * "strong round" (E14), "of capacity" (R-2's forbidden denominator) and
 * "weather" (R-5 / E27 — the model has no weather and the shifters chip set
 * must not grow one).
 */
const FORBIDDEN = [
  "project",
  "forecast",
  "estimate",
  "expected",
  "preview",
  "target",
  "profit",
  "readiness",
  "momentum",
  "time remaining",
  "strong round",
  "of capacity",
  "weather",
] as const;

type Literal = { line: number; text: string };

/**
 * Every string / template chunk in a TypeScript source, with the line it starts
 * on. Nesting matters and is handled: this renderer's real copy lives inside
 * nested template literals inside `${...}` interpolations, so a scanner that
 * skipped interpolations wholesale would read almost none of it (it did, in the
 * first cut of this file, and missed the M2 L1 blind note that the browser limb
 * then caught). Frames carry their own buffer; comments and quoted strings are
 * frames too; a quoted string is abandoned at a newline, which is both what
 * JavaScript does and what stops an apostrophe in prose from desynchronising
 * the rest of the file.
 */
function literals(src: string): Literal[] {
  const out: Literal[] = [];
  type Frame =
    | { kind: "code"; depth: number }
    | { kind: "tpl"; buf: string; startLine: number }
    | { kind: "str"; quote: string; buf: string; startLine: number };
  const stack: Frame[] = [{ kind: "code", depth: 0 }];
  let i = 0;
  let line = 1;
  const emit = (buf: string, startLine: number) => {
    if (buf.trim()) out.push({ line: startLine, text: buf });
  };
  while (i < src.length) {
    const top = stack[stack.length - 1]!;
    const c = src[i]!;
    const n = src[i + 1];
    if (top.kind === "code") {
      if (c === "\n") { line += 1; i += 1; continue; }
      if (c === "/" && n === "/") {
        while (i < src.length && src[i] !== "\n") i += 1;
        continue;
      }
      if (c === "/" && n === "*") {
        i += 2;
        while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
          if (src[i] === "\n") line += 1;
          i += 1;
        }
        i += 2;
        continue;
      }
      if (c === '"' || c === "'") { stack.push({ kind: "str", quote: c, buf: "", startLine: line }); i += 1; continue; }
      if (c === "`") { stack.push({ kind: "tpl", buf: "", startLine: line }); i += 1; continue; }
      if (c === "{") { top.depth += 1; i += 1; continue; }
      if (c === "}") {
        if (top.depth === 0 && stack.length > 1) stack.pop(); // end of a ${...}
        else top.depth -= 1;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (top.kind === "str") {
      if (c === "\\") { top.buf += src.slice(i, i + 2); i += 2; continue; }
      if (c === "\n") { stack.pop(); line += 1; i += 1; continue; } // phantom open, abandon
      if (c === top.quote) { emit(top.buf, top.startLine); stack.pop(); i += 1; continue; }
      top.buf += c;
      i += 1;
      continue;
    }
    // template literal
    if (c === "\\") { top.buf += src.slice(i, i + 2); i += 2; continue; }
    if (c === "`") { emit(top.buf, top.startLine); stack.pop(); i += 1; continue; }
    if (c === "$" && n === "{") {
      emit(top.buf, top.startLine);
      top.buf = "";
      top.startLine = line;
      stack.push({ kind: "code", depth: 0 });
      i += 2;
      continue;
    }
    if (c === "\n") {
      emit(top.buf, top.startLine);
      top.buf = "";
      line += 1;
      top.startLine = line;
      i += 1;
      continue;
    }
    top.buf += c;
    i += 1;
  }
  return out;
}

type AllowEntry = { file: string; word: string; literal: string; reason: string; transient?: boolean };

function loadAllowlist(): AllowEntry[] {
  const raw = JSON.parse(fs.readFileSync(ALLOW_FILE, "utf8")) as { entries: AllowEntry[] };
  for (const e of raw.entries) {
    assert.ok(e.file && e.word && e.literal, `allowlist entry is incomplete: ${JSON.stringify(e)}`);
    assert.ok(
      typeof e.reason === "string" && e.reason.trim().length >= 20,
      `allowlist entry for "${e.literal}" carries no real reason — an unexplained waiver is not a waiver`,
    );
    assert.ok((FORBIDDEN as readonly string[]).includes(e.word), `allowlist entry waives "${e.word}", which is not on the list`);
  }
  return raw.entries;
}

type Hit = { surface: string; line: number; word: string; text: string; source: string };

function scan(): { hits: Hit[]; allowed: Hit[]; used: Set<number>; allow: AllowEntry[] } {
  const allow = loadAllowlist();
  const used = new Set<number>();
  const hits: Hit[] = [];
  const allowed: Hit[] = [];
  for (const surface of SURFACES) {
    const file = path.join(SRC, surface, "main.ts");
    assert.ok(fs.existsSync(file), `${file} is missing — this limb cannot claim the client is clean`);
    const src = fs.readFileSync(file, "utf8");
    const lines = src.split("\n");
    const rel = `src/client/${surface}/main.ts`;
    for (const lit of literals(src)) {
      const low = lit.text.toLowerCase();
      for (const word of FORBIDDEN) {
        if (!low.includes(word)) continue;
        const hit: Hit = { surface: rel, line: lit.line, word, text: lit.text.trim(), source: (lines[lit.line - 1] ?? "").trim() };
        if (/\/\/\s*claim-ok:\s*\S/.test(lines[lit.line - 1] ?? "")) {
          allowed.push(hit);
          continue;
        }
        const idx = allow.findIndex(
          (e) => e.file === rel && e.word === word && new RegExp(e.literal, "i").test(lit.text.trim()),
        );
        if (idx >= 0) {
          used.add(idx);
          allowed.push(hit);
          continue;
        }
        hits.push(hit);
      }
    }
  }
  return { hits, allowed, used, allow };
}

test("R-1 source limb: no client renders a forecast, a target, a profit or a readiness score", () => {
  const { hits } = scan();
  const report = hits
    .map((h) => `  ${h.surface}:${h.line}  [${h.word}]  ${h.text.slice(0, 120)}`)
    .join("\n");
  assert.equal(
    hits.length,
    0,
    `the client renders ${hits.length} claim-vocabulary string(s) that nothing has justified.\n` +
      `Each one is either a real claim (delete it — the sentence belongs in the module payload),\n` +
      `or a justified non-claim (add "// claim-ok: <reason>" to the line, or an entry with a reason\n` +
      `to src/test/clientClaims.allow.json).\n${report}`,
  );
});

test("R-1 source limb: the allowlist has no dead entries and no blanket waivers", () => {
  const { used, allow, allowed } = scan();
  // `transient` entries cover a line another lane is actively rewriting, so
  // their disappearance is expected and is not a failure — everything else must
  // still match something.
  const dead = allow.filter((e, i) => !used.has(i) && !e.transient);
  assert.deepEqual(
    dead.map((e) => `${e.file} [${e.word}] /${e.literal}/`),
    [],
    "these allowlist entries match nothing in the client any more — delete them, or the waiver outlives the code it was written for",
  );
  // A waiver may not be the bare forbidden word: that would wave through every
  // use of it on the surface.
  for (const e of allow) {
    assert.notEqual(
      e.literal.toLowerCase(),
      e.word,
      `allowlist entry /${e.literal}/ on ${e.file} waives the whole word "${e.word}" — too broad`,
    );
  }
  assert.ok(allowed.length > 0, "the scanner found nothing at all — it has stopped reading the client");
});
