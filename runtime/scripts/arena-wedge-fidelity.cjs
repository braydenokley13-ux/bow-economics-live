#!/usr/bin/env node
/**
 * DOES THE PICTURE TELL THE TRUTH ABOUT THE SIZE OF EACH BLOCK?
 *
 * M2 L2 draws the home crowd as wedges of the house: this many people are here
 * because of your building and your price, this many because of your own Draw,
 * this many because of the club you are hosting. A picture is only allowed to
 * carry that if a wedge's share of the drawing IS its share of the crowd — a
 * lesson about magnitudes may not misstate one (`<economic_truth>`).
 *
 * It very nearly did. Equal angle is nowhere near equal drawn area in this
 * bowl: `PERSP` swells the near side and the seat rake stretches the far side,
 * and the rake wins. Before the repair, four equal quarters of the house drew
 * as 14.6%, 35.4%, 35.3% and 14.7%. A closed-form correction for the
 * perspective term alone left the error at ±42%, because the rake is the term
 * that matters and it is piecewise; the shipped fix measures the drawn area off
 * the same projection the drawing uses.
 *
 * This instrument does not trust that reasoning. It renders the real SVG in a
 * real browser, one wedge at a time in red against house-tone neighbours, and
 * COUNTS PIXELS. The building's own amber — floor, gates, floodlights — reads
 * as red too and is present in every frame, so a no-wedge baseline is measured
 * and subtracted; without that, a thin wedge appears to double.
 *
 * Run from runtime/ after `npm run build`. Never calls `playwright install`.
 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const assert = require("node:assert/strict");

/** Relative tolerance. Antialiasing on a thin wedge's two long edges is a few percent of it. */
const TOLERANCE = 0.10;
/** ...but a wedge below this share is too thin for the pixel count to be the authority. */
const MIN_MEASURABLE = 0.03;

const CASES = [
  { name: "four equal quarters — the case the defect was found on", turnout: 1000, capacity: 1000, shares: [0.25, 0.25, 0.25, 0.25] },
  { name: "a sold-out L2 week (New York hosting Memphis)", turnout: 1000, capacity: 1000, shares: [0.6148, 0.1785, 0.2067] },
  { name: "the same split in a half-empty building", turnout: 500, capacity: 1000, shares: [0.6148, 0.1785, 0.2067] },
  { name: "a visitor who brought almost nobody", turnout: 800, capacity: 1000, shares: [0.85, 0.1, 0.05] },
  { name: "a visitor who brought most of the house", turnout: 900, capacity: 1000, shares: [0.2, 0.12, 0.68] },
  { name: "a quarter-full building", turnout: 250, capacity: 1000, shares: [0.5, 0.2, 0.3] },
];

async function redPixels(page, svg) {
  await page.setContent(`<body style="margin:0;background:#000">${svg}</body>`);
  await page.waitForTimeout(80);
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 620, height: 135 } });
  return page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let red = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > d[i + 1] + 25 && d[i] > d[i + 2] + 25) red += 1;
    return red;
  }, "data:image/png;base64," + shot.toString("base64"));
}

async function main() {
  const { arenaSvg } = await import("../dist/client/shared/arena.js");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 620, height: 200 } });
    let worst = { rel: 0, where: "" };
    for (const c of CASES) {
      const render = (bands) =>
        arenaSvg({ view: "outcome", width: 620, height: 135, capacity: c.capacity, turnout: c.turnout, lit: "night", seed: 11, motion: false, label: c.name, bands });
      const house = c.shares.map((s) => ({ share: s, hue: 240, sat: 0 }));
      const base = await redPixels(page, render(house));
      const net = [];
      for (let k = 0; k < c.shares.length; k += 1) {
        const bands = house.map((b, i) => (i === k ? { ...b, hue: 0, sat: 100 } : b));
        net.push(Math.max(0, (await redPixels(page, render(bands))) - base));
      }
      const total = net.reduce((a, x) => a + x, 0);
      assert.ok(total > 0, `${c.name}: nothing was drawn at all`);
      const report = [];
      for (let i = 0; i < c.shares.length; i += 1) {
        const asked = c.shares[i];
        const drawn = net[i] / total;
        const rel = Math.abs(drawn - asked) / asked;
        report.push(`${(asked * 100).toFixed(1)}%→${(drawn * 100).toFixed(1)}%`);
        if (asked < MIN_MEASURABLE) continue;
        if (rel > worst.rel) worst = { rel, where: `${c.name}, wedge ${i + 1}` };
        assert.ok(
          rel <= TOLERANCE,
          `${c.name}: wedge ${i + 1} of ${c.shares.length} is ${(asked * 100).toFixed(1)}% of the crowd but ${(drawn * 100).toFixed(1)}% of the drawing — ${(rel * 100).toFixed(0)}% off. The picture is misstating how big a block of people is.`,
        );
      }
      console.log(`[wedge] ${c.name}: ${report.join("  ")}`);
    }
    // NON-VACUITY. A pixel counter that cannot tell a wrong picture from a
    // right one would pass everything. Draw a house split 40/20/20/20 and ask
    // the instrument whether it is four equal quarters; it has to say no.
    const wrong = [0.4, 0.2, 0.2, 0.2];
    const render = (bands) => arenaSvg({ view: "outcome", width: 620, height: 135, capacity: 1000, turnout: 1000, lit: "night", seed: 11, motion: false, label: "poison", bands });
    const house = wrong.map((s) => ({ share: s, hue: 240, sat: 0 }));
    const base = await redPixels(page, render(house));
    const net = [];
    for (let k = 0; k < wrong.length; k += 1) {
      net.push(Math.max(0, (await redPixels(page, render(house.map((b, i) => (i === k ? { ...b, hue: 0, sat: 100 } : b))))) - base));
    }
    const tot = net.reduce((a, x) => a + x, 0);
    const caught = net.filter((n) => Math.abs(n / tot - 0.25) / 0.25 > TOLERANCE).length;
    assert.ok(caught >= 2, `NON-VACUITY: a 40/20/20/20 house read as four equal quarters within tolerance on ${4 - caught} of 4 wedges — this instrument cannot see the defect it exists for`);

    console.log(`[wedge] PASS — worst wedge is ${(worst.rel * 100).toFixed(1)}% off (${worst.where}), tolerance ${(TOLERANCE * 100).toFixed(0)}%`);
    console.log(`[wedge] NON-VACUITY — a 40/20/20/20 house is rejected as equal quarters on ${caught} of 4 wedges`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`[wedge] FAIL: ${e.message}`);
  process.exit(1);
});
