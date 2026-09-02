# screens-w2-repair-3 — MANIFEST

All frames rendered at deviceScaleFactor 2 into the boxes `/play` measures on this build.
01-04 are BEFORE (head `aea9b06`); 01-03 are element screenshots of the real `.fh-arena` panel
driven through the live product; 04 is the real `.m2-doors` card. 05-11 are AFTER, from the
scratch build of the repaired `arena.ts`. 12 is the repaired build inside the real product.

- 01-BEFORE-outcome-0pct.png — settled night, $120, nobody came: warmly lit court and floods (4.35% warm pixels).
- 02-BEFORE-outcome-71pct.png — $34: bowl cropped at the panel top, letterboxed.
- 03-BEFORE-outcome-100pct.png — $10 sellout: grey wedges remain; differs from 02 mainly by an outer-ring dim.
- 04-BEFORE-locked-waiting.png — the locked-waiting card: one clipped quadrant of a bowl in a black rectangle.
- 05-AFTER-outcome-0pct.png — nobody came: the building is dark. 0.00% warm pixels.
- 06-AFTER-outcome-71pct.png — 71.4%: lit blocks to the seam, dark seats above it, whole silhouette in frame.
- 07-AFTER-outcome-100pct-sellout.png — full house: lit to the deck edge, gold rim, turned-away crowd at the gates.
- 08-AFTER-outcome-90pct-bowlshuttered.png — upper bowl CLOSED: a ribbed dark cover, no seats.
- 09-AFTER-outcome-90pct-bowlopen.png — upper bowl OPEN: third lit deck at the same proportion + rail light.
- 10-AFTER-locked-waiting-dark.png — the `hero` view at 900x240: complete dark building, centred.
- 11-AFTER-outcome-71pct-1024.png — the same night in the 448x92 panel (1024x600 first contact).
- 12-AFTER-in-product-e2e-sellout.png — `scripts/e2e-m2l1.cjs` frame `08-play-shock-soldout`: the repaired arena inside the real product.
- measurements-before.txt / measurements-after.txt / measurements-after.json — the full ladder in all four boxes.
