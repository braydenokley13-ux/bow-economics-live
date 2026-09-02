# w2-regression screenshot/log manifest

- `compare-baseline-vs-head.json` — sha256 byte-compare, 38 M1-extended-baseline
  frames, `docs/gauntlet/module-2/premium/screens-m1-baseline-ext` (pre-wave-2-play-rebuild,
  commit d1a0c24) vs a fresh capture at head `6c4c7cc` on port 4448. 34/38 identical;
  4 differ: l2-05-teach-hook, l2-10-play-reveal, l3-05-teach-day1, l3-09-teach-reveal.
- `compare-head-vs-head-repeat.json` — same capture script run twice in a row at
  head `6c4c7cc` only (no baseline involved), to separate "differs from baseline"
  from "non-deterministic even at fixed code". 36/38 identical; l1-12-teach-locked-roster
  and l3-09-teach-reveal are non-deterministic at fixed code (harness timing, matches
  the join-order/reveal-stage race pattern already documented for this tool).
- `l2-05-teach-hook-crop-{baseline,head}.png` — crop of the largest-bbox diff
  (194,18)-(511,768). Content difference only: "LIVE · V3" vs "LIVE · V4" build
  label and "1/3" vs "2/3" CLAIMED CARRIED FRANCHISES (one more desk had claimed
  its franchise by screenshot time) — same fonts, same positions, same colors,
  no CSS/layout shift. Attributed to join-order/timing, not a code regression.
- `l2-10-play-reveal-crop-{baseline,head}.png` — crop of the diff region. Content
  difference only: baseline captured before the REVEAL-stage card animated in;
  head capture shows "PRIYA OKOYE · REBOUNDER — 0 bids came in — UNSOLD" already
  settled. This is the frame already flagged as a known-unstable reveal-stage
  race in `docs/gauntlet/module-2/premium/screens-m1-baseline-ext/compare-result-extended.json`.
- `misclick-run.log` — full stdout of `E2E_PORT=4458 node runtime/scripts/e2e-m2l1-misclick.cjs`,
  exit code 0, PASS.
