# screens-w2-repair-4 — before/after frames (Playwright, scratch build of the same source, scrollY=0)

Driver: scratchpad `boss/w2-repair-4/drive.cjs` (4 desks x 5 nights; d0/d2 at 1366x768, d1/d3 at 1024x600;
d0/d1 priced $40/$60/$80/$100/$40, d1 opened the bowl and spent on Night 4; d2 priced $16 with Night 2 untouched;
d3 priced $10 x5 and opened the bowl on Night 4). `before/measure.json` = head a34b292 (f65e865 product);
`after/measure.json` = d9c5b1b. Same filenames in both folders.

| file | shows |
|---|---|
| result-n2-d3-1024 | 1024x600 sellout, bowl not offered (R4-1: NEXT 623 -> 468, turned-away 685 -> 448) |
| result-n4-d3-1024 | 1024x600 sellout, bowl open (R4-1: NEXT 662 -> 497, turned-away 710 -> 448) |
| result-n4-d1-1024 | 1024x600 bowl-open + spend night (R4-1: NEXT 578 -> 483) |
| result-n2-d2-1366 / result-n4-d2-1366 | 1366 sellouts — cause line is now the full four-clause rule (R4-4a); PIN chip 710..745 (R4-7) |
| prelock-n4-d1-1024 | Night 4 at 1024: bowl plate beside YOUR NIGHTS (top 586 -> 456) (R4-1) |
| prelock-n3-d2-1366 | `.fh-dial-carried` renders on a night that opened at Night 2's price (R4-2) |
| prelock-n4-d0-1366 | pre-lock with the fitted chart (R4-3) |
| closed-d0-1366 / closed-d2-1366 / closed-d3-1024 | five-night chart: ladder prices, $16 x5, $10 x5 (R4-3: 0 intersecting labels, 0 <path>) |
| reveal-final-d0-1366 | REVEAL final stage with the registered Two Peaks note (R4-5) |
| hook-d0-1366 / hook-d1-1024 | HOOK: dark building + hero line + five-card slate (R4-6) |
| counterfactual-d0-1366 / synthesis-p1-d0-1366 / synthesis-p2-d0-1366 | SYNTHESIS page 1 differs from COUNTERFACTUAL (R4-7, not reproduced) |
| after/arena-60pct-{not-offered,offered-declined,open}.png | R4-8: first two pixel-identical (md5 de2841134d33), open differs |
