/**
 * arena.ts — the drawn NBA-scale bowl, as procedural SVG.
 *
 * Module 2's flagship consequence visual. No raster, no external image, no
 * font, no network: one string of SVG built from arithmetic, so it costs
 * nothing to ship on a Chromebook LAN (D12).
 *
 * ECONOMIC LAW THIS FILE IS SUBJECT TO — read before changing anything:
 *
 *  1. The bowl renders a SETTLED turnout and nothing else (E12 rule 1;
 *     DIRECTION non-negotiable 2). It is never a preview, it never moves with
 *     a dial, and it never appears lit on a pre-lock screen. The pre-lock hero
 *     is called with `lit: "idle"` and `turnout: 0`, which renders the building
 *     DARK AND CLOSED: house lights off, floor unlit, gates dark.
 *  2. `capacity` here means THE SEATS OPEN TONIGHT (`seatsOpen`), not the
 *     building's capacity. Fill is `turnout / seatsOpen` (R-2). On the night
 *     the upper bowl can open, opening it changes this denominator.
 *  3. `turnedAway` is drawn as people outside the gates. It is a count of
 *     people, never converted into money (E12 rule 3).
 *  4. The caller supplies `label`. This module composes no economic sentence
 *     and prints no number, so nothing here can invent a claim (R-1).
 *
 * SIMPLIFICATIONS the picture introduces (recorded in the module's
 * `SIMPLIFICATIONS` list by Lane C, R-7): the seat pool is drawn as one
 * undifferentiated evenly-lit proportion — the model has no price tiers,
 * sections or view quality; and the upper bowl is a third state that changes
 * the denominator, so the same crowd can draw a shorter bar.
 *
 * Ported from the wave-2 prototype `assets/arena/arena.mjs` with types added
 * and the closed-building light path made real. No DOM access at import time
 * or at call time: this returns a string.
 */

/* ------------------------------------------------------------------ */
/* palette                                                            */
/* ------------------------------------------------------------------ */

/* Gold is retired as a UI accent on Module 2 (Boss ruling Q1(a)). It survives
   HERE, and only here, as the colour of the floodlights and the wood. */
const VOID = "#07070d";
const GOLD = "#f4b942";
const VIOLET = "#7a5cff";

/* ------------------------------------------------------------------ */
/* types                                                              */
/* ------------------------------------------------------------------ */

export type ArenaView = "hero" | "outcome" | "backdrop";

/** "idle" = the building is closed and dark. "night" = doors open, house lit. */
export type ArenaLit = "idle" | "night" | "sellout";

export interface ArenaOptions {
  /** Pixel width of the generated viewBox. */
  width?: number;
  /** Pixel height of the generated viewBox. */
  height?: number;
  /**
   * "hero"     header backdrop; the bowl bleeds off the right and the left
   *            fades to canvas so copy stays legible.
   * "outcome"  the whole bowl centred in a panel, with legend margins.
   * "backdrop" a very low-contrast projector wash.
   */
  view?: ArenaView;
  /** The seats OPEN tonight — the fill denominator, not building capacity. */
  capacity?: number;
  /** Settled turnout. 0 (with lit:"idle") is the dark, closed building. */
  turnout?: number;
  /** Settled sellout flag; adds the roof ring. */
  soldOut?: boolean;
  /** Settled count of people outside the gates. Drawn as people, never money. */
  turnedAway?: number;
  /** Light state. Pre-lock is always "idle". */
  lit?: ArenaLit;
  /** Seeds the section layout so one desk's building is stable across renders. */
  seed?: number;
  /** Opt in to the ambient flood breathe + the sellout ring flash. */
  motion?: boolean;
  /** Accessible name. Supply payload-derived text; never composed here. */
  label?: string;
}

interface Ring {
  rx: number;
  ry: number;
  dy: number;
}

interface Section {
  a0: number;
  a1: number;
  mid: number;
  span: number;
  jitter: number;
}

type Pt = [number, number];
type Projector = (ring: Ring, a: number) => Pt;

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

let UID = 0;

function mulberry32(a: number): () => number {
  let s = a | 0;
  return function (): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v: number): number => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const hsl = (h: number, s: number, l: number): string =>
  "hsl(" + n(h) + "," + n(clamp(s, 0, 100)) + "%," + n(clamp(l, 0, 100)) + "%)";

/* ------------------------------------------------------------------ */
/* bowl geometry                                                      */
/* ------------------------------------------------------------------ */

/* Camera: high three-quarter, roughly 35 degrees above the roof plane.
   Every ring is an ellipse squashed to SQUASH; the downward centre offset
   `dy` grows as the ring gets closer to the floor, and that offset is the
   whole illusion — the far bank of seats opens toward the camera while the
   near bank foreshortens to a lip. PERSP widens the near half of every ring
   so the thing has a front and a back instead of being a flat target. */
const SQUASH = 0.55;
const PERSP = 0.09;

const R_ = (rx: number, dy: number): Ring => ({ rx, ry: rx * SQUASH, dy });

const RINGS = {
  plaza: R_(1.5, 0.5),
  roofOut: R_(1.02, 0.0),
  roofIn: R_(0.905, 0.022),
  upperOut: R_(0.888, 0.034),
  upperIn: R_(0.688, 0.126),
  clubOut: R_(0.66, 0.146),
  clubIn: R_(0.548, 0.199),
  lowerOut: R_(0.52, 0.219),
  lowerIn: R_(0.316, 0.302),
  floor: R_(0.3, 0.313),
};

type RingKey = keyof typeof RINGS;

interface Tier {
  key: string;
  out: RingKey;
  in: RingKey;
  sections: number;
  share: number;
  lift: number;
}

const TIERS: Tier[] = [
  { key: "lower", out: "lowerOut", in: "lowerIn", sections: 28, share: 0.34, lift: 8 },
  { key: "club", out: "clubOut", in: "clubIn", sections: 34, share: 0.16, lift: 1 },
  { key: "upper", out: "upperOut", in: "upperIn", sections: 42, share: 0.5, lift: -5 },
];

const WALL = 0.24; /* facade height, in R */

/* ------------------------------------------------------------------ */
/* projection                                                         */
/* ------------------------------------------------------------------ */

function makeProjector(cx: number, cy: number, R: number): Projector {
  return function (ring: Ring, a: number): Pt {
    const s = 1 + PERSP * Math.sin(a);
    return [cx + R * ring.rx * Math.cos(a) * s, cy + R * (ring.ry * Math.sin(a) * s + ring.dy)];
  };
}

function ringPath(p: Projector, ring: Ring, steps?: number): string {
  let d = "";
  const k = steps || 72;
  for (let i = 0; i <= k; i++) {
    const q = p(ring, (i / k) * Math.PI * 2);
    d += (i === 0 ? "M" : "L") + n(q[0]) + " " + n(q[1]);
  }
  return d + "Z";
}

function arcSeg(p: Projector, ring: Ring, a0: number, a1: number, samples: number, prefix: string): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const q = p(ring, a0 + ((a1 - a0) * i) / samples);
    d += (i === 0 ? prefix : "L") + n(q[0]) + " " + n(q[1]);
  }
  return d;
}

const lerpRing = (a: Ring, b: Ring, t: number): Ring => ({
  rx: a.rx + (b.rx - a.rx) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  dy: a.dy + (b.dy - a.dy) * t,
});

/* ------------------------------------------------------------------ */
/* section layout — built, not generated                              */
/* ------------------------------------------------------------------ */

function buildSections(tier: Tier, rand: () => number): Section[] {
  const count = tier.sections;
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const sideline = Math.abs(Math.sin(a)); /* 1 at the sidelines, 0 behind the baskets */
    weights.push(0.84 + 0.3 * sideline + rand() * 0.16);
  }
  const total = weights.reduce((x, y) => x + y, 0);
  const out: Section[] = [];
  let cursor = -Math.PI / 2;
  for (let i = 0; i < count; i++) {
    const span = (weights[i]! / total) * Math.PI * 2;
    const portal = i % 7 === 3; /* a wider vomitory every few sections */
    const gap = span * (portal ? 0.26 : 0.09 + rand() * 0.04);
    const a0 = cursor + gap / 2;
    const a1 = cursor + span - gap / 2;
    out.push({ a0, a1, mid: (a0 + a1) / 2, span: a1 - a0, jitter: rand() });
    cursor += span;
  }
  return out;
}

/* the order a real building fills: prime sideline seats first, corners and
   behind-the-basket last, with noise so it never reads as a clean wedge */
function fillOrder(sections: Section[], rand: () => number): number[] {
  return sections
    .map((s, i) => ({ i, score: Math.abs(Math.sin(s.mid)) + 0.16 * Math.sin(s.mid) + rand() * 0.2 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.i);
}

/* ------------------------------------------------------------------ */
/* main                                                               */
/* ------------------------------------------------------------------ */

export function arenaSvg(opts: ArenaOptions = {}): string {
  const view: ArenaView = opts.view || "outcome";
  const width = opts.width || (view === "hero" ? 1200 : 1000);
  const height = opts.height || (view === "hero" ? 750 : 640);
  const capacity = opts.capacity || 17794;
  const turnout = clamp(opts.turnout === undefined ? 0 : opts.turnout, 0, capacity);
  const soldOut = !!opts.soldOut;
  const turnedAway = opts.turnedAway || 0;
  const litMode: ArenaLit = opts.lit || "night";
  const motion = !!opts.motion;
  const uid = "ar" + (++UID).toString(36);
  const rand = mulberry32(((opts.seed === undefined ? 7 : opts.seed) * 2654435761) ^ 0x5f3759df);

  /* --- composition ------------------------------------------------- */
  let cx: number;
  let cy: number;
  let R: number;
  let dim: number;
  let detail: "high" | "low";
  if (view === "hero") {
    /* the court lands at ~78% x / ~62% y of the frame; the bowl bleeds off
       the right and bottom, the left 45% fades to canvas for copy */
    R = height * 0.446;
    cx = width * 0.78;
    cy = height * 0.62 - R * RINGS.floor.dy;
    dim = 0.92;
    detail = "high";
  } else if (view === "backdrop") {
    R = Math.min(width * 0.34, height * 0.6);
    cx = width * 0.5;
    cy = height * 0.55;
    dim = 0.195;
    detail = "low";
  } else {
    R = Math.min(width * 0.385, height * 0.6);
    cx = width * 0.5;
    cy = height * 0.41;
    dim = 1.0;
    detail = "high";
  }

  const p = makeProjector(cx, cy, R);

  /* THE CLOSED BUILDING. "idle" is not "dimmer" — it is the building before
     doors, so every light in it is off: no house wash, no floodlights, no lit
     floor, no gate glow, and (because turnout is 0 on a pre-lock hero) no lit
     section anywhere. The prototype used 0.52 here, which read as a half-lit
     arena and would have been a picture of a pending night. */
  const lightBase = litMode === "idle" ? 0.06 : litMode === "sellout" ? 1.14 : 1.0;
  const light = lightBase * (soldOut ? 1.06 : 1);

  const out: string[] = [];
  const defs: string[] = [];
  const id = (k: string): string => uid + "-" + k;

  /* --- defs -------------------------------------------------------- */
  const tile = clamp(R * 0.0105, 3.2, 7);
  defs.push(
    '<pattern id="' +
      id("crowd") +
      '" width="' +
      n(tile) +
      '" height="' +
      n(tile) +
      '" patternUnits="userSpaceOnUse">' +
      '<circle cx="' + n(tile * 0.26) + '" cy="' + n(tile * 0.28) + '" r="' + n(tile * 0.17) + '" fill="#fff"/>' +
      '<circle cx="' + n(tile * 0.72) + '" cy="' + n(tile * 0.62) + '" r="' + n(tile * 0.14) + '" fill="#fff"/>' +
      '<circle cx="' + n(tile * 0.4) + '" cy="' + n(tile * 0.85) + '" r="' + n(tile * 0.1) + '" fill="#fff"/>' +
      '<rect x="0" y="' + n(tile * 0.94) + '" width="' + n(tile) + '" height="' + n(tile * 0.06) +
      '" fill="#fff" fill-opacity="0.55"/>' +
      "</pattern>"
  );
  defs.push(
    '<radialGradient id="' + id("plaza") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#121124" stop-opacity="' + n(0.55 * dim) + '"/>' +
      '<stop offset="52%" stop-color="#0a0a13" stop-opacity="' + n(0.4 * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<radialGradient id="' + id("flood") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fff4dc" stop-opacity="' + n(0.62 * light * dim) + '"/>' +
      '<stop offset="18%" stop-color="' + GOLD + '" stop-opacity="' + n(0.16 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + GOLD + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  /* Gate light scales with `light`: a closed building's doors are dark. */
  defs.push(
    '<radialGradient id="' + id("gate") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#ffdca8" stop-opacity="' + n(0.3 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="#ffdca8" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<radialGradient id="' + id("wash") + '" cx="50%" cy="42%" r="56%">' +
      '<stop offset="0%" stop-color="#c3b0ff" stop-opacity="' + n(0.17 * light * dim) + '"/>' +
      '<stop offset="58%" stop-color="' + VIOLET + '" stop-opacity="' + n(0.11 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + VIOLET + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<radialGradient id="' + id("floorglow") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fffaf0" stop-opacity="' + n(0.52 * light * dim) + '"/>' +
      '<stop offset="40%" stop-color="#ffe3b4" stop-opacity="' + n(0.16 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="#ffd49a" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<linearGradient id="' + id("facade") + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#191922"/>' +
      '<stop offset="45%" stop-color="#101017"/>' +
      '<stop offset="100%" stop-color="#08080e"/>' +
      "</linearGradient>"
  );
  defs.push(
    '<linearGradient id="' + id("roof") + '" x1="0.05" y1="0" x2="0.95" y2="1">' +
      '<stop offset="0%" stop-color="#13131d"/>' +
      '<stop offset="45%" stop-color="#0d0d15"/>' +
      '<stop offset="100%" stop-color="#181826"/>' +
      "</linearGradient>"
  );
  /* The floor is lit by the building, so the wood darkens all the way down
     when the building is closed (the prototype floored this at 0.62 and left
     a lit court glowing inside a dark arena). Identical at light = 1. */
  const woodL = (0.18 + 0.82 * light) * (0.4 + 0.6 * dim);
  defs.push(
    '<linearGradient id="' + id("wood") + '" x1="0.1" y1="0" x2="0.5" y2="1">' +
      '<stop offset="0%" stop-color="' + hsl(34, 52, 52 * woodL) + '"/>' +
      '<stop offset="45%" stop-color="' + hsl(32, 50, 44 * woodL) + '"/>' +
      '<stop offset="100%" stop-color="' + hsl(28, 44, 33 * woodL) + '"/>' +
      "</linearGradient>"
  );
  if (view === "hero") {
    defs.push(
      '<linearGradient id="' + id("maskgrad") + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#000"/>' +
        '<stop offset="30%" stop-color="#101010"/>' +
        '<stop offset="45%" stop-color="#3c3c3c"/>' +
        '<stop offset="68%" stop-color="#c4c4c4"/>' +
        '<stop offset="86%" stop-color="#fff"/>' +
        "</linearGradient>" +
        '<mask id="' + id("mask") + '"><rect width="' + width + '" height="' + height +
        '" fill="url(#' + id("maskgrad") + ')"/></mask>'
    );
  }
  defs.push(
    '<linearGradient id="' + id("wallfall") + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#05050b" stop-opacity="0.92"/>' +
      '<stop offset="28%" stop-color="#05050b" stop-opacity="0.5"/>' +
      '<stop offset="50%" stop-color="#05050b" stop-opacity="0.22"/>' +
      '<stop offset="72%" stop-color="#05050b" stop-opacity="0.5"/>' +
      '<stop offset="100%" stop-color="#05050b" stop-opacity="0.92"/>' +
      "</linearGradient>"
  );
  /* The one blur in the file. Everything soft reuses it. */
  defs.push(
    '<filter id="' + id("soft") + '" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feGaussianBlur stdDeviation="' + n(R * 0.014) + '"/></filter>'
  );

  /* --- 1. sky, city, ground ---------------------------------------- */
  out.push('<rect width="' + width + '" height="' + height + '" fill="' + VOID + '"/>');

  const horizon = cy - R * 0.5;
  const skyN = detail === "high" ? 22 : 14;
  let sky = "";
  for (let i = 0; i < skyN; i++) {
    const bw = R * (0.05 + rand() * 0.1);
    const bx = rand() * (width + R) - R * 0.5;
    const bh = R * (0.06 + rand() * 0.26);
    sky += '<rect x="' + n(bx) + '" y="' + n(horizon - bh) + '" width="' + n(bw) +
      '" height="' + n(bh + R * 0.5) + '"/>';
  }
  out.push('<g fill="#0b0b14" fill-opacity="' + n(0.9 * dim) + '">' + sky + "</g>");

  const bokehN = detail === "high" ? 54 : 30;
  let bokeh = "";
  for (let i = 0; i < bokehN; i++) {
    const bx = rand() * width;
    const by = horizon - R * 0.3 + rand() * R * 0.42;
    const br = R * (0.0035 + rand() * 0.01);
    bokeh +=
      '<circle cx="' + n(bx) + '" cy="' + n(by) + '" r="' + n(br) + '" fill="' +
      (rand() > 0.4 ? "#ffd9a0" : "#9fbdff") + '" fill-opacity="' + n((0.12 + rand() * 0.42) * dim) + '"/>';
  }
  out.push('<g filter="url(#' + id("soft") + ')">' + bokeh + "</g>");
  out.push(
    '<rect x="0" y="' + n(horizon - R * 0.05) + '" width="' + width + '" height="' + n(R * 0.42) +
      '" fill="#191a2e" opacity="' + n(0.35 * dim) + '" filter="url(#' + id("soft") + ')"/>'
  );

  /* ground pool around the building */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy + R * RINGS.plaza.dy) + '" rx="' + n(R * RINGS.plaza.rx) +
      '" ry="' + n(R * RINGS.plaza.ry) + '" fill="url(#' + id("plaza") + ')"/>'
  );

  defs.push(
    '<radialGradient id="' + id("spill") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#a78dff" stop-opacity="' + n(0.24 * light * dim) + '"/>' +
      '<stop offset="42%" stop-color="' + VIOLET + '" stop-opacity="' + n(0.1 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + VIOLET + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy - R * 0.06) + '" rx="' + n(R * 1.62) + '" ry="' +
      n(R * 1.05) + '" fill="url(#' + id("spill") + ')"/>'
  );

  const deckY = cy + R * (RINGS.roofOut.dy + WALL + 0.03);
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(deckY) + '" rx="' + n(R * 1.34) + '" ry="' +
      n(R * 1.34 * SQUASH * 0.72) + '" fill="#0c0c15" fill-opacity="' + n(0.55 * dim) + '"/>'
  );

  /* --- 2. building mass -------------------------------------------- */
  const baseRing: Ring = { rx: RINGS.roofOut.rx, ry: RINGS.roofOut.ry, dy: RINGS.roofOut.dy + WALL };
  /* contact shadow so the building sits on the ground */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy + R * (baseRing.dy + 0.02)) + '" rx="' +
      n(R * baseRing.rx * 1.06) + '" ry="' + n(R * baseRing.ry * 0.95) + '" fill="#05050a" fill-opacity="' +
      n(0.7 * dim) + '" filter="url(#' + id("soft") + ')"/>'
  );
  out.push(
    '<path d="' + arcSeg(p, RINGS.roofOut, 0, Math.PI, 44, "M") +
      arcSeg(p, baseRing, Math.PI, 0, 44, "L") + 'Z" fill="url(#' + id("facade") + ')"/>'
  );
  /* cladding: vertical mullions + two horizontal reveals */
  let mull = "";
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI;
    const t = p(RINGS.roofOut, a);
    const b = p(baseRing, a);
    mull += "M" + n(t[0]) + " " + n(t[1]) + "L" + n(b[0]) + " " + n(b[1]);
  }
  for (const f of [0.34, 0.66]) {
    mull += arcSeg(p, { rx: baseRing.rx, ry: baseRing.ry, dy: RINGS.roofOut.dy + WALL * f }, 0, Math.PI, 40, "M");
  }
  out.push(
    '<path d="' + mull + '" stroke="#7c7ca0" stroke-opacity="' + n(0.055 * dim) +
      '" stroke-width="1" fill="none"/>'
  );
  out.push(
    '<path d="' + arcSeg(p, RINGS.roofOut, 0, Math.PI, 44, "M") +
      arcSeg(p, baseRing, Math.PI, 0, 44, "L") + 'Z" fill="url(#' + id("wallfall") + ')"/>'
  );
  /* roof edge: a lit band along the near lip so the roof has thickness */
  const lipOut: Ring = { rx: RINGS.roofOut.rx, ry: RINGS.roofOut.ry, dy: RINGS.roofOut.dy + 0.028 };
  out.push(
    '<path d="' + arcSeg(p, RINGS.roofOut, 0, Math.PI, 44, "M") +
      arcSeg(p, lipOut, Math.PI, 0, 44, "L") + 'Z" fill="#2f2f44"/>'
  );
  out.push(
    '<path d="' + arcSeg(p, RINGS.roofOut, 0.02, Math.PI - 0.02, 44, "M") +
      '" fill="none" stroke="#9a9ac4" stroke-opacity="' + n(0.34 * dim) + '" stroke-width="1.4"/>'
  );
  out.push(
    '<path d="' + arcSeg(p, lipOut, 0.06, Math.PI - 0.06, 44, "M") +
      '" fill="none" stroke="#05050b" stroke-opacity="' + n(0.7 * dim) + '" stroke-width="1.2"/>'
  );
  /* window slits: the concourse behind the cladding, faintly lit */
  let slits = "";
  for (let i = 0; i < 46; i++) {
    const a = 0.06 + (i / 45) * (Math.PI - 0.12);
    for (let b2 = 0; b2 < 2; b2++) {
      const yTop = RINGS.roofOut.dy + WALL * (0.22 + b2 * 0.34);
      const t1 = p({ rx: baseRing.rx, ry: baseRing.ry, dy: yTop }, a);
      const t2 = p({ rx: baseRing.rx, ry: baseRing.ry, dy: yTop + WALL * 0.13 }, a);
      const sw = R * 0.008;
      slits += "M" + n(t1[0] - sw) + " " + n(t1[1]) + "h" + n(sw * 2) + "L" + n(t2[0] + sw) +
        " " + n(t2[1]) + "h" + n(-sw * 2) + "Z";
    }
  }
  out.push('<path d="' + slits + '" fill="#cfd6ff" fill-opacity="' + n(0.09 * dim) + '"/>');

  /* gates: discrete lit doorways along the near base, not a lit hoop */
  const gateAngles = [0.42, 0.86, 1.3, 1.74, 2.18, 2.62];
  let doors = "";
  let doorGlow = "";
  for (let g = 0; g < gateAngles.length; g++) {
    const a = gateAngles[g]!;
    const t = p({ rx: baseRing.rx, ry: baseRing.ry, dy: baseRing.dy - WALL * 0.16 }, a);
    const b = p({ rx: baseRing.rx, ry: baseRing.ry, dy: baseRing.dy - WALL * 0.02 }, a);
    const dw = R * 0.018 * (0.7 + 0.4 * Math.sin(a));
    doors += '<path d="M' + n(t[0] - dw) + " " + n(t[1]) + "L" + n(t[0] + dw) + " " + n(t[1]) +
      "L" + n(b[0] + dw) + " " + n(b[1]) + "L" + n(b[0] - dw) + " " + n(b[1]) + 'Z"/>';
    doorGlow += '<ellipse cx="' + n(b[0]) + '" cy="' + n(b[1] + R * 0.006) + '" rx="' + n(R * 0.055) +
      '" ry="' + n(R * 0.022) + '" fill="url(#' + id("gate") + ')"/>';
  }
  out.push('<g fill="#ffcf8a" fill-opacity="' + n(0.34 * light * dim) + '">' + doors + "</g>");
  out.push("<g>" + doorGlow + "</g>");

  /* --- 3. roof + ribs ---------------------------------------------- */
  out.push(
    '<path fill-rule="evenodd" d="' + ringPath(p, RINGS.roofOut) + ringPath(p, RINGS.roofIn) +
      '" fill="url(#' + id("roof") + ')"/>'
  );
  let ribs = "";
  const ribN = detail === "high" ? 56 : 40;
  for (let i = 0; i < ribN; i++) {
    const a = (i / ribN) * Math.PI * 2;
    const o = p(RINGS.roofOut, a);
    const q = p(RINGS.roofIn, a);
    ribs += "M" + n(o[0]) + " " + n(o[1]) + "L" + n(q[0]) + " " + n(q[1]);
  }
  out.push(
    '<path d="' + ribs + '" stroke="#33334c" stroke-opacity="' + n(0.22 * dim) +
      '" stroke-width="1" fill="none"/>'
  );
  out.push(
    '<path d="' + ringPath(p, RINGS.roofOut) + '" fill="none" stroke="#54547a" stroke-opacity="' +
      n(0.3 * dim) + '" stroke-width="1.3"/>'
  );
  out.push(
    '<path d="' + ringPath(p, RINGS.roofIn) + '" fill="none" stroke="#5b5b7d" stroke-opacity="' +
      n(0.3 * dim) + '" stroke-width="1.2"/>'
  );

  /* --- 4. the bowl -------------------------------------------------- */
  const seatsPerTier = TIERS.map((t) => capacity * t.share);
  let remaining = soldOut ? capacity : turnout;

  const fills: string[] = [];
  const rowPaths: string[] = [];
  const lipPaths: string[] = [];
  const litUnion: string[] = [];
  const emptyUnion: string[] = [];

  for (let ti = 0; ti < TIERS.length; ti++) {
    const tier = TIERS[ti]!;
    const tierSeats = seatsPerTier[ti]!;
    const secs = buildSections(tier, rand);
    const order = fillOrder(secs, rand);
    const spanTotal = secs.reduce((x, s) => x + s.span, 0);
    const seats = secs.map((s) => (s.span / spanTotal) * tierSeats);
    const ratio: number[] = new Array<number>(secs.length).fill(0);
    let left = clamp(remaining, 0, tierSeats);
    for (let k = 0; k < order.length && left > 0; k++) {
      const si = order[k]!;
      const take = Math.min(left, seats[si]!);
      ratio[si] = seats[si]! > 0 ? take / seats[si]! : 0;
      left -= take;
    }
    remaining -= clamp(remaining, 0, tierSeats);

    const ringOut = RINGS[tier.out];
    const ringIn = RINGS[tier.in];
    const samp = detail === "high" ? 5 : 4;

    for (let si = 0; si < secs.length; si++) {
      const s = secs[si]!;
      const d =
        arcSeg(p, ringIn, s.a0, s.a1, samp, "M") + arcSeg(p, ringOut, s.a1, s.a0, samp, "L") + "Z";
      const f = ratio[si]!;
      /* the near (bottom) half of the bowl catches more of the stage wash */
      const near = 0.5 + 0.5 * Math.sin(s.mid);
      const dark = hsl(
        232 + s.jitter * 10,
        12 + s.jitter * 5,
        (11 + tier.lift * 0.2 + s.jitter * 2.4 + near * 2.8) * dim + 1.8
      );
      const vary = 0.9 + 0.2 * s.jitter; /* +/-10% per section, seeded */
      const bright = hsl(
        252 + s.jitter * 14 - near * 12,
        30 + s.jitter * 14 + near * 8,
        (29 + tier.lift + near * 6.5) * vary * (0.6 + 0.4 * light) * dim + 2
      );

      fills.push('<path d="' + d + '" fill="' + (f > 0.985 ? bright : dark) + '"/>');
      if (f < 0.985) emptyUnion.push(d);
      if (f > 0.985) {
        litUnion.push(d);
      } else if (f > 0.03) {
        /* a part-sold section fills from the front rows back, the way a
           section actually sells — not a uniform mid-tone */
        const edge = lerpRing(ringIn, ringOut, clamp(f, 0.12, 0.94));
        const dPart =
          arcSeg(p, ringIn, s.a0, s.a1, samp, "M") + arcSeg(p, edge, s.a1, s.a0, samp, "L") + "Z";
        fills.push('<path d="' + dPart + '" fill="' + bright + '"/>');
        litUnion.push(dPart);
      }

      if (detail === "high") {
        const rows = f > 0.03 ? 3 : 2;
        for (let r = 1; r <= rows; r++) {
          rowPaths.push(arcSeg(p, lerpRing(ringIn, ringOut, r / (rows + 1)), s.a0, s.a1, 3, "M"));
        }
      }
      if (f > 0.2) lipPaths.push(arcSeg(p, lerpRing(ringIn, ringOut, 0.06), s.a0, s.a1, 3, "M"));
    }
  }

  out.push("<g>" + fills.join("") + "</g>");
  if (emptyUnion.length) {
    /* empty seats: the moulded plastic still catches a little light */
    out.push(
      '<path d="' + emptyUnion.join("") + '" fill="url(#' + id("crowd") + ')" fill-opacity="' +
        n(0.05 * dim) + '"/>'
    );
  }
  if (litUnion.length) {
    /* crowd texture: thousands of heads, one element */
    out.push(
      '<path d="' + litUnion.join("") + '" fill="url(#' + id("crowd") + ')" fill-opacity="' +
        n(0.2 * light * dim) + '"/>'
    );
  }
  if (rowPaths.length) {
    out.push(
      '<path d="' + rowPaths.join("") + '" fill="none" stroke="#04040a" stroke-opacity="' +
        n(0.26 * dim) + '" stroke-width="0.85"/>'
    );
  }
  if (lipPaths.length) {
    out.push(
      '<path d="' + lipPaths.join("") + '" fill="none" stroke="#efe6ff" stroke-opacity="' +
        n(0.16 * light * dim) + '" stroke-width="1.1"/>'
    );
  }

  /* concourse shadow between tiers, and the shadow the roof throws on the
     top rows of the upper bowl */
  const shade = (ring: Ring, w: number, o: number): string =>
    '<path d="' + ringPath(p, ring) + '" fill="none" stroke="#04040a" stroke-opacity="' +
    n(o * dim) + '" stroke-width="' + n(w) + '"/>';
  out.push(shade(RINGS.upperOut, R * 0.018, 0.55));
  out.push(shade(RINGS.upperIn, R * 0.012, 0.6));
  out.push(shade(RINGS.clubIn, R * 0.009, 0.5));
  out.push(shade(RINGS.lowerIn, R * 0.008, 0.42));

  /* near roof lip overhanging the near upper rows */
  out.push(
    '<path d="' + arcSeg(p, RINGS.roofIn, 0.12, Math.PI - 0.12, 40, "M") +
      arcSeg(p, lerpRing(RINGS.roofIn, RINGS.upperIn, 0.12), Math.PI - 0.12, 0.12, 40, "L") +
      'Z" fill="#0c0c14" fill-opacity="' + n(0.8 * dim) + '"/>'
  );

  /* --- 5. floor + court -------------------------------------------- */
  const fcx = cx;
  const fcy = cy + R * RINGS.floor.dy;
  out.push(
    '<ellipse cx="' + n(fcx) + '" cy="' + n(fcy) + '" rx="' + n(R * RINGS.floor.rx) +
      '" ry="' + n(R * RINGS.floor.ry) + '" fill="' + hsl(248, 14, 11 * dim + 1.4) + '"/>'
  );
  /* floor seats / camera risers ringing the court */
  let apron = "";
  for (let i = 1; i <= 3; i++) {
    const rr = 1 - i * 0.08;
    apron += ringPath(p, { rx: RINGS.floor.rx * rr, ry: RINGS.floor.ry * rr, dy: RINGS.floor.dy }, 40);
  }
  out.push(
    '<path d="' + apron + '" fill="none" stroke="#2a2740" stroke-opacity="' + n(0.55 * dim) +
      '" stroke-width="' + n(Math.max(0.7, R * 0.004)) + '"/>'
  );

  const hx = R * 0.246;
  const hy = R * 0.246 * (50 / 94) * SQUASH * 1.18;
  const CP = (u: number, v: number): [number, number] => [n(fcx + u * hx * (1 + 0.05 * v)), n(fcy + v * hy)];
  const courtPoly =
    "M" + CP(-1, -1).join(" ") + "L" + CP(1, -1).join(" ") + "L" + CP(1, 1).join(" ") +
    "L" + CP(-1, 1).join(" ") + "Z";

  out.push(
    '<ellipse cx="' + n(fcx) + '" cy="' + n(fcy - hy * 0.4) + '" rx="' + n(hx * 2.2) +
      '" ry="' + n(hy * 4.6) + '" fill="url(#' + id("floorglow") + ')"/>'
  );
  out.push('<path d="' + courtPoly + '" fill="url(#' + id("wood") + ')"/>');

  let planks = "";
  for (let i = 1; i < 26; i++) {
    const u = -1 + (i / 26) * 2;
    planks += "M" + CP(u, -1).join(" ") + "L" + CP(u, 1).join(" ");
  }
  out.push(
    '<path d="' + planks + '" stroke="#000" stroke-opacity="' + n(0.09 * dim) +
      '" stroke-width="0.7" fill="none"/>'
  );

  /* Court markings are painted lines, not light sources: they fade with the
     house lights so a closed building does not glow white at the middle. */
  const ink = "rgba(246,244,238," + n(0.72 * dim * (0.12 + 0.88 * light)) + ")";
  const lw = Math.max(0.8, R * 0.0035);
  const kd = 19 / 47;
  const kw = 8 / 25;
  const marks =
    "M" + CP(-1, -1).join(" ") + "L" + CP(1, -1).join(" ") + "L" + CP(1, 1).join(" ") +
    "L" + CP(-1, 1).join(" ") + "Z" +
    "M" + CP(0, -1).join(" ") + "L" + CP(0, 1).join(" ") +
    "M" + CP(-1, -kw).join(" ") + "L" + CP(-1 + kd, -kw).join(" ") + "L" + CP(-1 + kd, kw).join(" ") +
    "L" + CP(-1, kw).join(" ") +
    "M" + CP(1, -kw).join(" ") + "L" + CP(1 - kd, -kw).join(" ") + "L" + CP(1 - kd, kw).join(" ") +
    "L" + CP(1, kw).join(" ");
  out.push('<path d="' + marks + '" fill="none" stroke="' + ink + '" stroke-width="' + n(lw) + '"/>');

  /* painted keys */
  const paint = (sign: number): string =>
    '<path d="M' + CP(sign, -kw).join(" ") + "L" + CP(sign - sign * kd, -kw).join(" ") +
    "L" + CP(sign - sign * kd, kw).join(" ") + "L" + CP(sign, kw).join(" ") + 'Z" fill="' +
    hsl(24, 46, 30 * woodL) + '" fill-opacity="' + n(0.75 * dim) + '"/>';
  out.splice(out.length - 1, 0, paint(-1), paint(1));

  const ell = (u: number, v: number, rft: number, w?: number): string =>
    '<ellipse cx="' + CP(u, v)[0] + '" cy="' + CP(u, v)[1] + '" rx="' + n((rft / 47) * hx) +
    '" ry="' + n((rft / 25) * hy) + '" fill="none" stroke="' + ink + '" stroke-width="' + n(w || lw) + '"/>';
  out.push(ell(0, 0, 6));
  out.push(ell(0, 0, 2, lw * 0.8));
  out.push(ell(-1 + kd, 0, 6));
  out.push(ell(1 - kd, 0, 6));

  const tp = (sign: number): string => {
    const rx3 = (23.75 / 47) * hx;
    const ry3 = (23.75 / 25) * hy;
    const cx3 = fcx + sign * (1 - 5.25 / 47) * hx;
    const cornerV = 22 / 25;
    const y0 = fcy - cornerV * hy;
    const y1 = fcy + cornerV * hy;
    const dx = Math.sqrt(Math.max(0, 1 - cornerV * cornerV)) * rx3;
    const ex = cx3 + sign * dx;
    return (
      '<path d="M' + n(fcx + sign * hx * (1 - 0.05 * cornerV)) + " " + n(y0) + "L" + n(ex) + " " + n(y0) +
      "A" + n(rx3) + " " + n(ry3) + " 0 0 " + (sign > 0 ? 0 : 1) + " " + n(ex) + " " + n(y1) +
      "L" + n(fcx + sign * hx * (1 + 0.05 * cornerV)) + " " + n(y1) +
      '" fill="none" stroke="' + ink + '" stroke-width="' + n(lw) + '"/>'
    );
  };
  out.push(tp(-1), tp(1));

  /* the lit floor is the brightest thing in the building — when it is lit */
  out.push('<path d="' + courtPoly + '" fill="#fff6de" fill-opacity="' + n(0.16 * light * dim) + '"/>');
  /* courtside tables / camera risers reading as a dark frame */
  out.push(
    '<path d="' + courtPoly + '" fill="none" stroke="#0a0a12" stroke-opacity="' + n(0.5 * dim) +
      '" stroke-width="' + n(R * 0.012) + '"/>'
  );

  /* --- 6. lighting -------------------------------------------------- */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy + R * 0.11) + '" rx="' + n(R * 0.8) + '" ry="' +
      n(R * 0.55) + '" fill="url(#' + id("wash") + ')"/>'
  );

  /* a continuous warm wash under the roof rim — the rim light reads as one
     band of light, with individual fixtures inside it, not a necklace */
  const rigRing = lerpRing(RINGS.roofIn, RINGS.upperIn, 0.04);
  out.push(
    '<path d="' + ringPath(p, rigRing) + '" fill="none" stroke="' + GOLD + '" stroke-opacity="' +
      n(0.075 * light * dim) + '" stroke-width="' + n(R * 0.028) + '" filter="url(#' + id("soft") + ')"/>'
  );
  const lightN = 16;
  let heads = "";
  let glows = "";
  let spill = "";
  for (let i = 0; i < lightN; i++) {
    const a = (i / lightN) * Math.PI * 2 + 0.11;
    const q = p(rigRing, a);
    const w = Math.max(1.4, R * 0.0095);
    heads += '<rect x="' + n(q[0] - w) + '" y="' + n(q[1] - w * 0.55) + '" width="' + n(w * 2) +
      '" height="' + n(w * 1.1) + '" rx="' + n(w * 0.35) + '"/>';
    glows += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" r="' + n(R * 0.032) +
      '" fill="url(#' + id("flood") + ')"/>';
    if (i % 4 === 1) {
      const t1 = p(RINGS.lowerIn, a - 0.34);
      const t2 = p(RINGS.lowerIn, a + 0.34);
      spill += "M" + n(q[0]) + " " + n(q[1]) + "L" + n(t1[0]) + " " + n(t1[1]) + "L" + n(t2[0]) +
        " " + n(t2[1]) + "Z";
    }
  }
  out.push(
    '<path d="' + spill + '" fill="#fff0cc" fill-opacity="' + n(0.03 * light * dim) +
      '" filter="url(#' + id("soft") + ')"/>'
  );
  out.push('<g class="' + uid + '-flood">' + glows + "</g>");
  out.push('<g fill="#3a3a52" fill-opacity="' + n(0.8 * dim) + '">' + heads + "</g>");

  /* --- 7. sellout signature ---------------------------------------- */
  if (soldOut) {
    out.push(
      '<path d="' + ringPath(p, RINGS.roofIn) + '" fill="none" stroke="' + GOLD +
        '" stroke-opacity="' + n(0.26 * dim) + '" stroke-width="' + n(Math.max(2, R * 0.01)) +
        '" filter="url(#' + id("soft") + ')"/>'
    );
    out.push(
      '<path class="' + uid + '-ring" d="' + ringPath(p, RINGS.roofIn) +
        '" fill="none" stroke="#ffe9b8" stroke-opacity="' + n(0.5 * dim) + '" stroke-width="' +
        n(Math.max(1.2, R * 0.0035)) + '"/>'
    );
  }

  /* --- 8. turned away at the gates --------------------------------- */
  if (turnedAway > 0) {
    const q = clamp(turnedAway / (capacity * 0.45), 0.1, 1);
    const gates = [0.42, 1.02, 1.62, 2.2, 2.78];
    let dots = "";
    let glow = "";
    for (let g = 0; g < gates.length; g++) {
      const a = gates[g]!;
      const b = p({ rx: baseRing.rx, ry: baseRing.ry, dy: baseRing.dy }, a);
      glow += '<ellipse cx="' + n(b[0]) + '" cy="' + n(b[1] + R * 0.012) + '" rx="' + n(R * 0.12) +
        '" ry="' + n(R * 0.05) + '" fill="url(#' + id("gate") + ')" opacity="' + n(0.45 + 0.55 * q) + '"/>';
      const nDots = Math.round(10 + q * 44);
      const spread = R * (0.05 + 0.09 * q);
      for (let d2 = 0; d2 < nDots; d2++) {
        const along = (rand() + rand() - 1) * spread;
        const back = Math.pow(rand(), 1.7) * R * 0.055 * (0.5 + 0.5 * q);
        const px = b[0] + along;
        const py = b[1] + R * 0.01 + back * 0.5 + (rand() - 0.5) * R * 0.006;
        const s2 = Math.max(0.7, R * 0.0038);
        dots += "M" + n(px) + " " + n(py) + "h" + n(s2) + "v" + n(s2 * 2.1) + "h" + n(-s2) + "Z";
      }
    }
    out.push(glow);
    out.push('<path d="' + dots + '" fill="#ffdda8" fill-opacity="' + n((0.42 + 0.4 * q) * dim) + '"/>');
  }

  /* --- 9. atmosphere ------------------------------------------------ */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy - R * 0.28) + '" rx="' + n(R * 0.85) + '" ry="' +
      n(R * 0.4) + '" fill="#7b68dd" fill-opacity="' + n(0.05 * light * dim) +
      '" filter="url(#' + id("soft") + ')"/>'
  );

  /* --- style / motion ----------------------------------------------- */
  /* Both animations carry their own reduced-motion collapse inside the SVG,
     because the SVG is injected as markup and may outlive any stylesheet
     rule that targets it (A10 / DIRECTION non-negotiable 9). */
  let style = "";
  if (motion) {
    style =
      "<style>" +
      "@keyframes " + uid + "-breathe{0%,100%{opacity:.9}50%{opacity:1}}" +
      "." + uid + "-flood{animation:" + uid + "-breathe 5.4s ease-in-out infinite}" +
      "@keyframes " + uid + "-flash{0%{stroke-opacity:1;stroke-width:" + n(Math.max(4, R * 0.014)) +
      "px}100%{stroke-opacity:.7}}" +
      "." + uid + "-ring{animation:" + uid + "-flash 260ms cubic-bezier(.22,1,.36,1) 1}" +
      "@media (prefers-reduced-motion: reduce){." + uid + "-flood,." + uid +
      "-ring{animation:none!important}}" +
      "</style>";
  }

  if (view === "backdrop") {
    /* the projector backdrop is atmosphere: the room reads the data, not this */
    defs.push(
      '<linearGradient id="' + id("bfade") + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + VOID + '" stop-opacity="0.72"/>' +
        '<stop offset="42%" stop-color="' + VOID + '" stop-opacity="0.28"/>' +
        '<stop offset="100%" stop-color="' + VOID + '" stop-opacity="0.55"/>' +
        "</linearGradient>" +
        '<radialGradient id="' + id("bvig") + '" cx="50%" cy="50%" r="62%">' +
        '<stop offset="55%" stop-color="#000" stop-opacity="0"/>' +
        '<stop offset="100%" stop-color="#000" stop-opacity="0.6"/>' +
        "</radialGradient>"
    );
    out.push(
      '<rect width="' + width + '" height="' + height + '" fill="url(#' + id("bfade") + ')"/>' +
        '<rect width="' + width + '" height="' + height + '" fill="url(#' + id("bvig") + ')"/>'
    );
  }

  const body = out.join("");
  const wrapped = view === "hero" ? '<g mask="url(#' + id("mask") + ')">' + body + "</g>" : body;

  /* No number and no economic sentence is composed here (R-1). The default
     names the picture; a caller that needs more passes registered copy. */
  const label =
    opts.label !== undefined
      ? opts.label
      : litMode === "idle"
        ? "Drawn arena bowl, dark and closed"
        : turnedAway > 0
          ? "Drawn arena bowl, lit, with a crowd outside the gates"
          : "Drawn arena bowl, lit";

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + " " + height +
    '" width="' + width + '" height="' + height + '" role="img" aria-label="' +
    label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") +
    '" preserveAspectRatio="xMidYMid slice">' +
    style + "<defs>" + defs.join("") + "</defs>" +
    (view === "hero" ? '<rect width="' + width + '" height="' + height + '" fill="' + VOID + '"/>' : "") +
    wrapped + "</svg>"
  );
}

export default arenaSvg;
