#!/usr/bin/env node
/**
 * Compares two m1-extended baseline capture directories for reproducibility.
 * Same documented fallback as compare-m1.cjs: pngjs is not resolvable from
 * /opt/node22/lib/node_modules on this machine, so this is a byte-equality
 * (sha256) comparison per PNG file, not a true per-pixel diff. For any file
 * that DIFFERS, a companion Python/Pillow pass (diff-crop.py, run
 * separately) computes the actual differing bounding box and crops it from
 * both runs for visual evidence.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const A = path.resolve(arg("a"));
const B = path.resolve(arg("b"));
const OUT = arg("out", path.join(path.dirname(A), "compare-result-extended.json"));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const filesA = fs.readdirSync(A).filter((f) => f.endsWith(".png")).sort();
const filesB = new Set(fs.readdirSync(B).filter((f) => f.endsWith(".png")));

const results = [];
for (const f of filesA) {
  if (!filesB.has(f)) {
    results.push({ file: f, status: "MISSING_IN_B" });
    continue;
  }
  const sa = sha256(path.join(A, f));
  const sb = sha256(path.join(B, f));
  const statA = fs.statSync(path.join(A, f));
  const statB = fs.statSync(path.join(B, f));
  results.push({
    file: f,
    status: sa === sb ? "IDENTICAL" : "DIFFERS",
    sizeA: statA.size,
    sizeB: statB.size,
    shaA: sa.slice(0, 12),
    shaB: sb.slice(0, 12),
  });
}

const stable = results.filter((r) => r.status === "IDENTICAL");
const unstable = results.filter((r) => r.status !== "IDENTICAL");

console.log(`Compared ${results.length} PNGs (byte-equality / sha256, pngjs unavailable):`);
for (const r of results) {
  if (r.status === "IDENTICAL") console.log(`  IDENTICAL   ${r.file}  (${r.sizeA} bytes)`);
  else if (r.status === "DIFFERS") console.log(`  DIFFERS     ${r.file}  A=${r.sizeA}B/${r.shaA} B=${r.sizeB}B/${r.shaB}`);
  else console.log(`  ${r.status}  ${r.file}`);
}
console.log(`\n${stable.length}/${results.length} byte-identical across the two runs.`);
if (unstable.length > 0) console.log(`Non-stable: ${unstable.map((r) => r.file).join(", ")}`);

fs.writeFileSync(OUT, JSON.stringify({ a: A, b: B, results, stableCount: stable.length, total: results.length }, null, 2));
console.log("wrote", OUT);
