# M1 L3 e2e flake — attribution note (wave 3)

During L2 repair verification, `runtime/scripts/e2e-l3.cjs` failed intermittently
at day-3 `submitOffer(fa-star-sc)` ("element was detached from the DOM" / null
boundingBox). Attribution runs, this session (2026-09-01), lead-integrator:

- **HEAD (post-L2-repair):** 6 runs → rc `0,0,0,1,1,1` (3/6 fail)
- **Wave-2 checkpoint `5cf1a58` (predates all L2 work),** fresh worktree, fresh
  install/build: 6 runs → rc `0,0,0,0,1,0` (1/6 fail)

The failure mode is identical at both heads and the checkpoint predates every
L2 change, so this is a **pre-existing race in M1 L3's play client**, not a
Module-2 regression: `faPlayMounted`'s poll-driven remount wipes
`#faComposerRoot` while a click is pending; day 3 is the only step where two
desks contest one agent, so `interestCount` changes mid-click. The rate difference between heads (1/6 vs 3/6) is UNRESOLVED — n=6 per head has no
statistical power (Fisher p~0.55), and one live mechanism is unexamined: Module 2's
lessons ship inside the same shared `client/play/main.ts` the race lives in. "Pre-existing"
is proven; "unaffected by M2" is not.

Disposition per the wave contract's non-goals (M1 changes only for proven
regressions caused by this wave): **not repaired here**; recorded as a known
M1 reliability issue. It is a real classroom risk in miniature — a student's
offer click during a contested-interest update can hit a remounted composer —
and deserves a bounded M1 fix (mount-guard or event-delegation) with the e2e
run N times as its acceptance check.
