# REPAIR_W2_THEME_LEAK — legacy `theme.css` gold/Bebas leak onto Module 2 `/play`

Role `builder-r1`, assignment `w2-repair-1-theme-leak`, Boss run `m2-visual-quality-war` wave 2.
Fixes BROWSER_TRUTH_W2 defect 1 (BLOCKING) against contract rows A2 and A4.
All findings AGENT-PLAYTESTED. Nothing here is HUMAN-TESTED or CLASSROOM-PROVEN.
Builders do not certify acceptance; this records work and evidence only.

## Highest-severity first

The defect was **wider than reported**. The audit found the leak on **all 33 `/play` states**
(not only the sellout), and two leaking selectors the QA report did not name:
`.fh-card-night` (Bebas on the night eyebrow, every pre-lock state) and `.fh-repeat-split`
(gold border in COUNTERFACTUAL). Two of the QA report's named items were **not** reproducible:
`.fh-sellout-title` did not render gold (the renderer sets `color` inline; the leak there is
`font-family` only), and `.fh-card`'s gold border was already beaten by
`html[data-module="m2"] .m2-card`.

## Change

- `runtime/src/client/shared/theme.css` — 68 legacy rules prefixed `html:not([data-module="m2"])`,
  plus a header comment recording the invariant. Stripping the prefix reproduces the old file
  byte-for-byte, so no declaration was altered.
- `runtime/src/client/shared/m2.css` — one added declaration: `font-family: var(--m2-font)` on
  the existing `html[data-module="m2"] #gameHeader` rule (that element carries the shared
  `.eyebrow` class and sits outside `#gameBody`, so the theme.css scoping does not reach it).
- `runtime/src/client/play/main.ts` — **unchanged.**

Why scoping and not per-property overrides in `m2.css`: scoping makes the leak structurally
impossible instead of neutralising ~40 individual declarations, and it is provably inert for
`/board` and `/teach` — those surfaces never set `data-module` (only `play/main.ts:207` does),
and, stronger, they use a disjoint `fh-board-*/fh-slate-*/fh-market-*/fh-synth*` class family
styled inline in `board/index.html`; `teach/main.ts` uses one `fh-*` token (`fh-play`) that has
no rule here. A rebuilt `dist/` differed from the pristine `dist/` in the two stylesheets only.

## Proof (browser truth)

Playwright script `proof.cjs` drives a real 4-desk, 5-night class (Desk 2 holds the Memphis
season plan at $16 and sells out on Nights 2 and 4; Desk 4 sells out on Night 4; Desk 3 prices
$120 on the low-draw card) through LOBBY, HOOK, pre-lock, locked-waiting, 20 result states,
all-nights-done, REVEAL (+ last stage), ADAPT, COUNTERFACTUAL (2 pages), SYNTHESIS (2 pages)
and COMPLETE. On each state it walks **every element** in `#gameBody` and fails on any computed
`font-family` containing "Bebas" or any computed
`color`/`border-*-color`/`background-color`/`background-image`/`outline-color`/`box-shadow`
containing the gold triplet `244, 185, 66`, with a carve-out inside the drawn arena SVG (A2).

| run | states | elements checked | states with violations | verdict |
|---|---|---|---|---|
| BEFORE (pristine `dist`, git `6c4c7cc`) | 33 | 11,137 | **33** | LEAK PRESENT (exit 1) |
| AFTER (scratch build with the fix) | 33 | 11,240 | **0** | CLEAN (exit 0) |

A separate whole-document pass (not just `#gameBody`) on the M2 PLAY state confirms
`#gameHeader` now computes Inter, and leaves 12 gold hits — all inside the **hidden** join
card (`#btnJoin`, `#btnRejoin`, the "Join your class" `.eyebrow`), which is the pre-lesson
join flow: `data-module` is not yet set while it is visible. Recorded, not fixed.

## Commands run this session (scratch copy only; the real `runtime/` was not built)

- `npm run build` in the scratch copy — exit 0
- `npm test` in the scratch copy — exit 0, **468/468 pass**
  (a first run showed 3 failures, all `l{1,2,3}-tuning-harness.mjs is missing`, an artefact of
  the scratch layout: those harnesses live in `docs/gauntlet/module-2/stage0/`, outside
  `runtime/`. With `docs/` linked into the scratch parent, all 468 pass.)
- `scripts/e2e-m2l1.cjs` and the misclick e2e — **NOT RUN** (coordinator instruction to finish).
  NOT VERIFIED.
- M1 extended baseline capture (`tools/shots-m1-extended.cjs`) — **NOT RUN**. NOT VERIFIED;
  the `/board`-`/teach`-unchanged claim rests on the source and `dist` arguments above, not on
  a pixel baseline.

## Artefacts

- Audit table (133 emitted classes → 68 theme.css rules → leaked properties → fix):
  `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-repair-1/AUDIT.md`
- Proof log (both runs): `.../w2-repair-1/proof.log`; driver `.../w2-repair-1/proof.cjs`
- Test log: `.../w2-repair-1/npm-test.log`
- Screenshots: `docs/gauntlet/module-2/premium/screens-w2-repair-1/` (before/after pairs for the
  Night-4 sellout, an ordinary settled night, and the pre-lock state, all 1366×768)
