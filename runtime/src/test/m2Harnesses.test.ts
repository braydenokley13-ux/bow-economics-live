import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

/**
 * THE M2 TUNING HARNESSES, INSIDE THE SUITE.
 *
 * econ re-check R2 (blocking): the COVERAGE / VALUE / QUANTIFIER / LEVEL / RENDER
 * limbs of the M2 claim audit — and every constant-tuning property the three
 * lessons' economics rest on — lived only in
 * `docs/gauntlet/module-2/stage0/l{1,2,3}-tuning-harness.mjs`, wired into no npm
 * script. The dissent's own discharge condition was "a value-drift mutant fails
 * THE SUITE", and it did not: it failed a file somebody had to remember to run.
 *
 * These are thin wrappers. They spawn each harness against the build `npm test`
 * has just produced and assert exit 0 — the harnesses' own contract ("EXIT CODE
 * IS THE EVIDENCE", no warn tier). The properties, the thresholds and the
 * mutation limbs stay where they are; nothing is duplicated or softened here, so
 * a constant change that reddens a harness now reddens `npm test`.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..", "..");
const STAGE0 = path.join(REPO, "docs", "gauntlet", "module-2", "stage0");

const harnesses = [
  { id: "l1", file: "l1-tuning-harness.mjs", what: "M2 L1 The Box Office — demand, capacity and the price curve" },
  { id: "l2", file: "l2-tuning-harness.mjs", what: "M2 L2 Hosting the League — draw, sharing and the road ledger" },
  { id: "l3", file: "l3-tuning-harness.mjs", what: "M2 L3 Writing the Rule — the rule engine and the claim audit" },
];

for (const h of harnesses) {
  test(`${h.id} tuning harness exits 0 at the shipped constants (${h.what})`, { timeout: 300_000 }, () => {
    const script = path.join(STAGE0, h.file);
    assert.ok(fs.existsSync(script), `${h.file} is missing — the suite cannot claim the harness passed`);
    const run = spawnSync(process.execPath, [script], { cwd: REPO, encoding: "utf8", timeout: 280_000 });
    if (run.status !== 0) {
      const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
      const failed = out
        .split("\n")
        .filter((line) => line.startsWith("FAIL") || line.includes("VERDICT:"))
        .join("\n");
      assert.fail(`${h.file} exited ${run.status}${run.signal ? ` (signal ${run.signal})` : ""}\n${failed || out.slice(-4000)}`);
    }
    assert.match(String(run.stdout), /VERDICT: ALL \d+ PROPERTIES HOLD/);
  });
}
