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
 *  3. EVERY DECK THAT IS OPEN TONIGHT IS LIT TO THE SAME PROPORTION
 *     (m2-visual-quality-war wave 2, Economic Truth R-7, BLOCKING). The model
 *     has ONE undifferentiated seat pool: it does not decide which seats sell
 *     first, so the picture must not either. The old drawing filled the lower
 *     bowl, then the club, then the upper — a seat-allocation mechanism
 *     `settleNight` does not have. Each deck now fills from its own front row
 *     back to an EQUAL-AREA seam, so lit seat area / open seat area is exactly
 *     `turnout / seatsOpen` in every deck at once. If you ever make one deck
 *     fill before another, you are drawing arithmetic that is not in the
 *     module, and R-7 goes red again.
 *  4. The upper bowl is a real third state, not a legend swatch: `bowlOpen:
 *     false` (or absent) draws it SHUTTERED (a closed dark deck with no seats
 *     showing) on EVERY night it is not open, whether or not the option was on
 *     the card (W2 repair-4 R4-8: one ring, one meaning); `bowlOpen:true`
 *     draws it open, part of the pool, lit at
 *     the same proportion as every other open deck, with its own rail light.
 *     `bowlSeats` is accepted for compatibility and changes nothing in the
 *     drawing: only `bowlOpen` decides the outer deck's state.
 *  5. `turnedAway` is drawn as people outside the gates. It is a count of
 *     people, never converted into money (E12 rule 3).
 *  6. Nobody came = a dark building (visual-critic-3 direction 1). At
 *     `turnout === 0` the house light is OFF: no floodlights, no lit floor, no
 *     gate glow. The brightest object on a 0% night must not be the court.
 *  7. The caller supplies `label`. This module composes no economic sentence
 *     and prints no number, so nothing here can invent a claim (R-1).
 *
 * SIMPLIFICATIONS the picture introduces (recorded in the module's
 * `SIMPLIFICATIONS` list, R-7): the decks are architecture, not price tiers —
 * they all light to the same proportion because the model has one pool; each
 * deck is drawn filling front-row-first, which is a drawing order, not a
 * model rule; and the openable upper bowl is drawn as about a fifth of the
 * seat area when the seats it stands for are about a tenth of the pool, so
 * the deck can be seen at all at classroom size.
 *
 * GEOMETRY / FRAMING (visual-critic-3 gap 1, defect 3): the arena is rendered
 * into PANEL-shaped boxes — measured 500x116 and 448x92 (the settled-night
 * outcome panel) and 900x240 / 900x150 (the locked-waiting building). The old
 * drawing composed a 620x380 / 900x420 square-ish frame and shipped
 * `preserveAspectRatio="slice"` with intrinsic pixel dimensions, so the panel
 * showed a cropped quadrant of a building. This file now derives a panoramic
 * viewBox per view, fits the WHOLE silhouette inside it, and scales to the box
 * with `meet` at `width/height = 100%`: nothing is ever cropped, at any
 * container aspect. Edges fade to void so a letterboxed band is seamless.
 *
 * No DOM access at import time or at call time: this returns a string.
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
  /**
   * Pixel height of the generated viewBox. HONOURED ONLY IF IT IS ALREADY A
   * PANEL SHAPE (width/height >= 3). The drawing is composed for the wide,
   * short boxes `/play` actually renders it into; a squarer height would
   * letterbox or crop the building, which is the defect this file fixes.
   */
  height?: number;
  /**
   * "hero"     the building as a wide plate behind copy (locked-waiting, the
   *            pre-lock backdrop): the whole silhouette, centred.
   * "outcome"  the same building in the shorter settled-night panel.
   * "backdrop" a very low-contrast projector wash.
   */
  view?: ArenaView;
  /** The seats OPEN tonight — the fill denominator, not building capacity. */
  capacity?: number;
  /** Settled turnout. 0 (or `lit:"idle"`) is the dark building. */
  turnout?: number;
  /** Settled sellout flag; adds the roof ring. */
  soldOut?: boolean;
  /** Settled count of people outside the gates. Drawn as people, never money. */
  turnedAway?: number;
  /**
   * Seats in the openable upper bowl. Pass it and the top deck becomes the
   * third state; leave it out and the top deck is an ordinary open deck.
   */
  bowlSeats?: number;
  /** Was that upper bowl OPEN tonight? Default false = drawn shuttered. */
  bowlOpen?: boolean;
  /** Light state. Pre-lock is always "idle". */
  lit?: ArenaLit;
  /** Seeds the section layout so one desk's building is stable across renders. */
  seed?: number;
  /** Opt in to the ambient flood breathe + the sellout ring flash. */
  motion?: boolean;
  /** Accessible name. Supply payload-derived text; never composed here. */
  label?: string;
  /**
   * ATTRIBUTION BANDS inside the lit crowd, innermost (front row) outward.
   *
   * The default drawing answers one question: how full is the building. M2 L2
   * asks a second one that no bar chart answers as well — WHO in this crowd is
   * here because of you, and who was brought by the club you are hosting. The
   * whole lesson is that the biggest block of people in your building is
   * usually somebody else's doing, and the honest way to say that is to colour
   * the people.
   *
   * The bands are WEDGES OF THE HOUSE, not rings. That is deliberate on two
   * counts. A ring encoding would put one group in the front rows and another
   * in the back, which is a claim about seat quality the model does not make
   * and the lesson does not mean. And wedges are how people actually talk about
   * this in a real building — a third of the arena wearing the other team's
   * colours — so the picture names a phenomenon a student may have seen.
   *
   * The two encodings stay separate and each says exactly one thing: the RADIAL
   * seam still says how full the building is, by equal area, on every open deck
   * (law 3, untouched); the ANGULAR wedges say who brought the crowd that is
   * there. A half-full building shows three colours in its front rows.
   *
   * Each `share` is a share of the CROWD and the bands sum to 1. Shares that
   * sum to less leave the remainder in the house tone; pass none and the crowd
   * is drawn in one tone as before.
   */
  bands?: readonly ArenaBand[];
}

/** One attribution wedge of the lit crowd: its share of the people, and its colour. */
export interface ArenaBand {
  /** Share of TURNOUT this wedge accounts for. Bands sum to 1. */
  share: number;
  /** Base hue of the wedge's seats, so the surface's own legend can match it. */
  hue: number;
  /** Base saturation. The three depth tones vary lightness around it, as before. */
  sat: number;
}

type Pt = [number, number];

interface Deck {
  key: "lower" | "club" | "bowl";
  rIn: number;
  rOut: number;
  sections: number;
}

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

/* Camera: a low three-quarter, because the panel is three to six times wider
   than it is tall. Every ring is an ellipse squashed to SQUASH and then again
   by the per-view vertical scale VS, which is what lets a whole building sit
   inside a 500x116 panel. `rake` is the downward offset of a ring: the far
   bank of seats opens toward the camera while the near bank foreshortens to a
   lip. PERSP widens the near half of every ring so the thing has a front and
   a back instead of being a flat target. */
const SQUASH = 0.55;
const PERSP = 0.09;
const WALL = 0.235; /* facade height below the roof lip, in R */

const R_FLOOR = 0.3;
const R_ROOF_IN = 0.952;
const R_ROOF_OUT = 1.02;

/** The three decks. Radii are chosen so drawn AREA splits ~41 / 39 / 20. */
const DECKS: Deck[] = [
  { key: "lower", rIn: 0.315, rOut: 0.6, sections: 16 },
  { key: "club", rIn: 0.625, rOut: 0.8, sections: 18 },
  { key: "bowl", rIn: 0.825, rOut: 0.93, sections: 20 },
];

/* the silhouette, in units of R, at VS = 1 — used to fit the drawing to its box */
const SIL_W = 2.1;
const SIL_H = 1.41;
/* the flattest camera we will accept before the drawing has to shrink instead */
const VS_MIN = 0.58;
const VS_MAX = 0.86;

/** How far a ring at radius r sits below the roof plane (the rake). */
function rake(r: number): number {
  const t = clamp((r - R_FLOOR) / 0.63, 0, 1);
  return 0.313 - 0.19 * t - 0.103 * t * t;
}

/* ------------------------------------------------------------------ */
/* main                                                               */
/* ------------------------------------------------------------------ */

export function arenaSvg(opts: ArenaOptions = {}): string {
  const view: ArenaView = opts.view || "outcome";
  const width = opts.width || (view === "hero" ? 900 : 620);
  /* Panel aspect per view: the geometric middle of the boxes /play measured at
     1366x768 and 1024x600, so `meet` wastes <7% of either box. */
  const pano = view === "hero" ? 4.74 : view === "backdrop" ? 3.2 : 4.6;
  const givenH = opts.height || 0;
  const height = givenH > 0 && width / givenH >= 3 ? givenH : Math.round(width / pano);

  const capacity = Math.max(1, opts.capacity || 17794);
  const turnout = clamp(opts.turnout === undefined ? 0 : opts.turnout, 0, capacity);
  const soldOut = !!opts.soldOut;
  const turnedAway = opts.turnedAway || 0;
  /* W2 repair-4 R4-8: the outer deck has ONE meaning. It is drawn open only
     on a night the pair actually opened it (bowlOpen) and shuttered on every
     other night — offered-and-declined and not-offered render identically.
     The base pool the ordinary nights light is the lower two decks; whether
     the option was on the card changes nothing in the drawing. */
  const bowlOpen = !!opts.bowlOpen;
  const litMode: ArenaLit = opts.lit || "night";
  const bandsIn = opts.bands ?? [];
  const motion = !!opts.motion;
  const uid = "ar" + (++UID).toString(36);
  const rand = mulberry32(((opts.seed === undefined ? 7 : opts.seed) * 2654435761) ^ 0x5f3759df);

  /* --- the one number the picture encodes ---------------------------- */
  /* Fill is turnout / seats opened tonight, and it is applied IDENTICALLY to
     every deck that is open (law 3). No deck fills before another. */
  const fill = soldOut ? 1 : clamp(turnout / capacity, 0, 1);
  const isOpenDeck = (d: Deck): boolean => (d.key === "bowl" ? bowlOpen : true);

  /* --- composition --------------------------------------------------- */
  const dim = view === "backdrop" ? 0.195 : view === "hero" ? 0.94 : 1;
  const detail: "high" | "low" = view === "backdrop" ? "low" : "high";

  const boxW = width * 0.94;
  const boxH = height * 0.9;
  let R = boxW / SIL_W;
  let VS = boxH / (SIL_H * R);
  if (VS < VS_MIN) {
    VS = VS_MIN;
    R = boxH / (SIL_H * VS);
  } else if (VS > VS_MAX) {
    VS = VS_MAX;
    R = Math.min(R, boxW / SIL_W);
  }
  const cx = width * 0.5;
  /* centre the silhouette's own extent, not the ring origin */
  const cy = height * 0.5 - 0.1625 * VS * R;

  /** project a point at polar (r, a), pushed down by `drop` (in R). */
  const pt = (r: number, a: number, drop?: number): Pt => {
    const s = 1 + PERSP * Math.sin(a);
    return [
      cx + R * r * Math.cos(a) * s,
      cy + VS * R * (r * SQUASH * Math.sin(a) * s + rake(r) + (drop || 0)),
    ];
  };

  const arc = (r: number, a0: number, a1: number, steps: number, prefix: string, drop?: number): string => {
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const q = pt(r, a0 + ((a1 - a0) * i) / steps, drop);
      d += (i === 0 ? prefix : "L") + n(q[0]) + " " + n(q[1]);
    }
    return d;
  };
  const ring = (r: number, steps?: number, drop?: number): string =>
    arc(r, 0, Math.PI * 2, steps || (detail === "high" ? 64 : 40), "M", drop) + "Z";
  /** a closed band between two radii over an angular span */
  const band = (rA: number, rB: number, a0: number, a1: number, steps: number, drop?: number): string =>
    arc(rA, a0, a1, steps, "M", drop) + arc(rB, a1, a0, steps, "L", drop) + "Z";

  /* THE CLOSED BUILDING and THE NIGHT NOBODY CAME are the same picture: every
     light in the building is off (law 6). "idle" is not "dimmer". */
  const houseOn = litMode !== "idle" && (turnout > 0 || soldOut);
  const light = !houseOn ? 0 : litMode === "sellout" || soldOut ? 1.12 : 1;

  const out: string[] = [];
  const defs: string[] = [];
  const id = (k: string): string => uid + "-" + k;

  /* --- defs ---------------------------------------------------------- */
  const tile = clamp(R * 0.019, 3, 6.4);
  defs.push(
    '<pattern id="' +
      id("crowd") +
      '" width="' +
      n(tile) +
      '" height="' +
      n(tile) +
      '" patternUnits="userSpaceOnUse">' +
      '<circle cx="' + n(tile * 0.26) + '" cy="' + n(tile * 0.28) + '" r="' + n(tile * 0.17) + '" fill="#fff"/>' +
      '<circle cx="' + n(tile * 0.72) + '" cy="' + n(tile * 0.62) + '" r="' + n(tile * 0.15) + '" fill="#fff"/>' +
      '<circle cx="' + n(tile * 0.4) + '" cy="' + n(tile * 0.88) + '" r="' + n(tile * 0.11) + '" fill="#fff"/>' +
      "</pattern>"
  );
  defs.push(
    '<radialGradient id="' + id("plaza") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#121124" stop-opacity="' + n(0.5 * dim) + '"/>' +
      '<stop offset="52%" stop-color="#0a0a13" stop-opacity="' + n(0.36 * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<radialGradient id="' + id("flood") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fff4dc" stop-opacity="' + n(0.6 * light * dim) + '"/>' +
      '<stop offset="20%" stop-color="' + GOLD + '" stop-opacity="' + n(0.15 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="' + GOLD + '" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  /* Gate light scales with `light`: a dark building's doors are dark. */
  defs.push(
    '<radialGradient id="' + id("gate") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#ffdca8" stop-opacity="' + n(0.3 * light * dim) + '"/>' +
      '<stop offset="100%" stop-color="#ffdca8" stop-opacity="0"/>' +
      "</radialGradient>"
  );
  defs.push(
    '<radialGradient id="' + id("floorglow") + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fffaf0" stop-opacity="' + n(0.5 * light * dim) + '"/>' +
      '<stop offset="42%" stop-color="#ffe3b4" stop-opacity="' + n(0.15 * light * dim) + '"/>' +
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
  /* The floor is lit by the building: the wood goes all the way down when the
     house lights are off, so a dark building has no glowing court in it. */
  const woodL = (0.09 + 0.91 * light) * (0.4 + 0.6 * dim);
  defs.push(
    '<linearGradient id="' + id("wood") + '" x1="0.1" y1="0" x2="0.5" y2="1">' +
      '<stop offset="0%" stop-color="' + hsl(34, 52, 52 * woodL) + '"/>' +
      '<stop offset="45%" stop-color="' + hsl(32, 50, 44 * woodL) + '"/>' +
      '<stop offset="100%" stop-color="' + hsl(28, 44, 33 * woodL) + '"/>' +
      "</linearGradient>"
  );
  defs.push(
    '<linearGradient id="' + id("wallfall") + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#05050b" stop-opacity="0.92"/>' +
      '<stop offset="30%" stop-color="#05050b" stop-opacity="0.42"/>' +
      '<stop offset="50%" stop-color="#05050b" stop-opacity="0.18"/>' +
      '<stop offset="70%" stop-color="#05050b" stop-opacity="0.42"/>' +
      '<stop offset="100%" stop-color="#05050b" stop-opacity="0.92"/>' +
      "</linearGradient>"
  );
  /* The one blur in the file. Everything soft reuses it. */
  defs.push(
    '<filter id="' + id("soft") + '" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feGaussianBlur stdDeviation="' + n(R * 0.016) + '"/></filter>'
  );

  /* --- 1. sky, city, ground ------------------------------------------ */
  out.push('<rect width="' + width + '" height="' + height + '" fill="' + VOID + '"/>');

  const horizon = cy - VS * R * 0.42;
  const skyN = detail === "high" ? 13 : 8;
  let sky = "";
  for (let i = 0; i < skyN; i++) {
    const bw = R * (0.05 + rand() * 0.11);
    const bx = rand() * (width + R) - R * 0.5;
    const bh = VS * R * (0.1 + rand() * 0.42);
    sky += '<rect x="' + n(bx) + '" y="' + n(horizon - bh) + '" width="' + n(bw) +
      '" height="' + n(bh + VS * R * 0.5) + '"/>';
  }
  out.push(
    '<g fill="#0a0a12" fill-opacity="' + n(0.85 * dim) + '" filter="url(#' + id("soft") + ')">' + sky + "</g>"
  );

  const bokehN = detail === "high" ? 40 : 22;
  let bokeh = "";
  for (let i = 0; i < bokehN; i++) {
    const bx = rand() * width;
    const by = horizon - VS * R * 0.4 + rand() * VS * R * 0.6;
    const br = R * (0.004 + rand() * 0.009);
    bokeh +=
      '<circle cx="' + n(bx) + '" cy="' + n(by) + '" r="' + n(br) + '" fill="' +
      (rand() > 0.4 ? "#ffd9a0" : "#9fbdff") + '" fill-opacity="' + n((0.12 + rand() * 0.4) * dim) + '"/>';
  }
  out.push('<g filter="url(#' + id("soft") + ')">' + bokeh + "</g>");

  /* ground pool around the building */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy + VS * R * 0.44) + '" rx="' + n(R * 1.52) +
      '" ry="' + n(VS * R * 0.62) + '" fill="url(#' + id("plaza") + ')"/>'
  );

  if (light > 0) {
    defs.push(
      '<radialGradient id="' + id("spill") + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#a78dff" stop-opacity="' + n(0.22 * light * dim) + '"/>' +
        '<stop offset="42%" stop-color="' + VIOLET + '" stop-opacity="' + n(0.09 * light * dim) + '"/>' +
        '<stop offset="100%" stop-color="' + VIOLET + '" stop-opacity="0"/>' +
        "</radialGradient>"
    );
    out.push(
      '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(R * 1.5) + '" ry="' +
        n(VS * R * 1.5) + '" fill="url(#' + id("spill") + ')"/>'
    );
  }

  /* --- 2. building mass ---------------------------------------------- */
  /* contact shadow so the building sits on the ground */
  out.push(
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy + VS * R * (rake(R_ROOF_OUT) + WALL + 0.02)) + '" rx="' +
      n(R * R_ROOF_OUT * 1.05) + '" ry="' + n(VS * R * R_ROOF_OUT * SQUASH * 0.92) +
      '" fill="#05050a" fill-opacity="' + n(0.7 * dim) + '" filter="url(#' + id("soft") + ')"/>'
  );
  const facadePath =
    arc(R_ROOF_OUT, 0, Math.PI, 44, "M") + arc(R_ROOF_OUT, Math.PI, 0, 44, "L", WALL) + "Z";
  out.push('<path d="' + facadePath + '" fill="url(#' + id("facade") + ')"/>');
  /* cladding: vertical mullions + two horizontal reveals */
  let mull = "";
  for (let i = 0; i <= 26; i++) {
    const a = (i / 26) * Math.PI;
    const t = pt(R_ROOF_OUT, a);
    const b = pt(R_ROOF_OUT, a, WALL);
    mull += "M" + n(t[0]) + " " + n(t[1]) + "L" + n(b[0]) + " " + n(b[1]);
  }
  for (const f of [0.36, 0.68]) mull += arc(R_ROOF_OUT, 0, Math.PI, 40, "M", WALL * f);
  out.push(
    '<path d="' + mull + '" stroke="#7c7ca0" stroke-opacity="' + n(0.06 * dim) +
      '" stroke-width="1" fill="none"/>'
  );
  out.push('<path d="' + facadePath + '" fill="url(#' + id("wallfall") + ')"/>');
  /* roof edge: a lit band along the near lip so the roof has thickness */
  out.push(
    '<path d="' + arc(R_ROOF_OUT, 0, Math.PI, 44, "M") + arc(R_ROOF_OUT, Math.PI, 0, 44, "L", 0.026) +
      'Z" fill="#2f2f44"/>'
  );
  out.push(
    '<path d="' + arc(R_ROOF_OUT, 0.02, Math.PI - 0.02, 44, "M") +
      '" fill="none" stroke="#9a9ac4" stroke-opacity="' + n(0.3 * dim) + '" stroke-width="1.3"/>'
  );
  /* window slits: the concourse behind the cladding, faintly lit */
  let slits = "";
  for (let i = 0; i < 38; i++) {
    const a = 0.07 + (i / 37) * (Math.PI - 0.14);
    const t1 = pt(R_ROOF_OUT, a, WALL * 0.3);
    const t2 = pt(R_ROOF_OUT, a, WALL * 0.52);
    const sw = R * 0.007;
    slits += "M" + n(t1[0] - sw) + " " + n(t1[1]) + "h" + n(sw * 2) + "L" + n(t2[0] + sw) +
      " " + n(t2[1]) + "h" + n(-sw * 2) + "Z";
  }
  out.push('<path d="' + slits + '" fill="#cfd6ff" fill-opacity="' + n(0.085 * dim) + '"/>');

  /* gates: discrete doorways along the near base; lit only when the house is */
  const gateAngles = [0.5, 0.96, 1.42, 1.88, 2.34];
  let doors = "";
  let doorGlow = "";
  for (let g = 0; g < gateAngles.length; g++) {
    const a = gateAngles[g]!;
    const t = pt(R_ROOF_OUT, a, WALL * 0.62);
    const b = pt(R_ROOF_OUT, a, WALL * 0.98);
    const dw = R * 0.02 * (0.7 + 0.4 * Math.sin(a));
    doors += '<path d="M' + n(t[0] - dw) + " " + n(t[1]) + "L" + n(t[0] + dw) + " " + n(t[1]) +
      "L" + n(b[0] + dw) + " " + n(b[1]) + "L" + n(b[0] - dw) + " " + n(b[1]) + 'Z"/>';
    if (light > 0) {
      doorGlow += '<ellipse cx="' + n(b[0]) + '" cy="' + n(b[1] + VS * R * 0.01) + '" rx="' +
        n(R * 0.07) + '" ry="' + n(VS * R * 0.06) + '" fill="url(#' + id("gate") + ')"/>';
    }
  }
  out.push(
    '<g fill="' + (light > 0 ? "#ffcf8a" : "#14141d") + '" fill-opacity="' +
      n((light > 0 ? 0.34 * light : 0.9) * dim) + '">' + doors + "</g>"
  );
  if (doorGlow) out.push("<g>" + doorGlow + "</g>");

  /* --- 3. roof -------------------------------------------------------- */
  out.push(
    '<path fill-rule="evenodd" d="' + ring(R_ROOF_OUT) + ring(R_ROOF_IN) +
      '" fill="url(#' + id("roof") + ')"/>'
  );
  let ribs = "";
  const ribN = detail === "high" ? 40 : 24;
  for (let i = 0; i < ribN; i++) {
    const a = (i / ribN) * Math.PI * 2;
    const o = pt(R_ROOF_OUT, a);
    const q = pt(R_ROOF_IN, a);
    ribs += "M" + n(o[0]) + " " + n(o[1]) + "L" + n(q[0]) + " " + n(q[1]);
  }
  out.push(
    '<path d="' + ribs + '" stroke="#33334c" stroke-opacity="' + n(0.22 * dim) +
      '" stroke-width="1" fill="none"/>'
  );
  out.push(
    '<path d="' + ring(R_ROOF_IN) + '" fill="none" stroke="#5b5b7d" stroke-opacity="' +
      n(0.3 * dim) + '" stroke-width="1.2"/>'
  );

  /* --- 4. THE BOWL — the fill encoding -------------------------------- */
  /*
   * One rule, three decks: every OPEN deck is lit from its own front row back
   * to a seam whose radius is chosen so the LIT AREA of that deck is exactly
   * `fill` of the deck (r_seam = sqrt(rIn^2 + fill*(rOut^2 - rIn^2))). Lit
   * blocks below the seam, hard dark blocks above it, a bright rail on the
   * seam itself. No deck fills before another (law 3); no brightness ramp
   * carries the number (visual-critic-3 direction 1).
   */
  const seatSteps = detail === "high" ? 5 : 3;
  /* Attribution bands, innermost first, clipped so they can never claim more
     of the bowl than the crowd actually fills. With no bands this is the one
     house-tone band the drawing has always had. */
  const HOUSE_BAND: ArenaBand = { share: 1, hue: 256, sat: 34 };
  const bands: ArenaBand[] = [];
  if (bandsIn.length > 0 && fill > 0) {
    let used = 0;
    for (const b of bandsIn) {
      const share = clamp(b.share, 0, 1 - used);
      if (share > 0) bands.push({ ...b, share });
      used += share;
      if (used >= 1 - 1e-9) break;
    }
    /* Whatever the caller's wedges do not account for stays house tone, so a
       band list that undershoots loses no people from the picture. */
    if (used < 1 - 1e-9) bands.push({ share: 1 - used, hue: 256, sat: 34 });
  } else if (fill > 0) {
    bands.push(HOUSE_BAND);
  }
  /*
   * Wedge boundaries, sized by the area each one will actually OCCUPY in the
   * drawing rather than by angle.
   *
   * Equal angle is nowhere near equal drawn area in this bowl. Two effects
   * push in opposite directions — `PERSP` swells the near side, and the seat
   * rake stretches the far side vertically — and the rake wins by a long way.
   * Measured on the shipped constants by rendering one wedge at a time and
   * counting its pixels, four equal quarters of the house drew as 14.6%, 35.4%,
   * 35.3% and 14.7% of the crowd. A picture in which a quarter of the building
   * can look like a seventh or like a third, depending only on where it lands,
   * is misrepresenting a magnitude, and no legend underneath undoes that.
   *
   * An analytic correction is not trustworthy here: the closed form for the
   * perspective term alone left the error at ±42%, because the rake is the
   * dominant term and it is piecewise. So the area is MEASURED, off the same
   * `pt()` projection the drawing itself uses — the lit region of every open
   * deck, swept in 360 steps, accumulated by shoelace. Whatever the geometry
   * does, the wedges own their share of what is drawn.
   *
   * The radial seam is untouched: it still says how full the house is, by equal
   * area, on every open deck (law 3).
   */
  const WEDGE_START = Math.PI / 2;
  const SWEEP_STEPS = 360;
  /** Drawn area of the lit crowd in each of `SWEEP_STEPS` slices from WEDGE_START. */
  const sweep: number[] = new Array<number>(SWEEP_STEPS).fill(0);
  if (bands.length > 1 && fill > 0.004) {
    for (const deck of DECKS) {
      if (!isOpenDeck(deck)) continue;
      const rSeam = Math.sqrt(deck.rIn * deck.rIn + fill * (deck.rOut * deck.rOut - deck.rIn * deck.rIn));
      for (let i = 0; i < SWEEP_STEPS; i += 1) {
        const a0 = WEDGE_START + (i / SWEEP_STEPS) * Math.PI * 2;
        const a1 = WEDGE_START + ((i + 1) / SWEEP_STEPS) * Math.PI * 2;
        const q: Pt[] = [pt(deck.rIn, a0), pt(deck.rIn, a1), pt(rSeam, a1), pt(rSeam, a0)];
        let A = 0;
        for (let k = 0; k < 4; k += 1) {
          const [x1, y1] = q[k]!;
          const [x2, y2] = q[(k + 1) % 4]!;
          A += x1 * y2 - x2 * y1;
        }
        sweep[i] = sweep[i]! + Math.abs(A) / 2;
      }
    }
  }
  const sweepTotal = sweep.reduce((a, x) => a + x, 0);
  /** The angle by which the DRAWN crowd has covered `c` of its area since WEDGE_START. */
  const angleForArea = (c: number): number => {
    if (c <= 0) return WEDGE_START;
    if (c >= 1) return WEDGE_START + Math.PI * 2;
    if (sweepTotal <= 0) return WEDGE_START + c * Math.PI * 2;
    let acc = 0;
    const want = c * sweepTotal;
    for (let i = 0; i < SWEEP_STEPS; i += 1) {
      const nextAcc = acc + sweep[i]!;
      if (nextAcc >= want) {
        /* linear inside the slice — one slice is a degree of arc */
        const t = sweep[i]! > 0 ? (want - acc) / sweep[i]! : 0;
        return WEDGE_START + ((i + t) / SWEEP_STEPS) * Math.PI * 2;
      }
      acc = nextAcc;
    }
    return WEDGE_START + Math.PI * 2;
  };
  const wedges: { a0: number; a1: number; band: ArenaBand }[] = [];
  {
    let cum = 0;
    for (const b of bands) {
      const next = cum + b.share;
      wedges.push({ a0: angleForArea(cum), a1: angleForArea(next), band: b });
      cum = next;
    }
  }
  /* One tone-group triple per band, so depth shading survives the colouring. */
  const litPaths: string[][][] = bands.map(() => [[], [], []]); /* far / side / near, per wedge */
  const darkPaths: string[][] = [[], [], []];
  const litUnion: string[] = [];
  const emptyUnion: string[] = [];
  let seamPath = "";
  let seamShadow = "";
  let rowPath = "";
  let shutterPath = "";
  let shutterRibs = "";
  let railPath = "";

  for (let di = 0; di < DECKS.length; di++) {
    const deck = DECKS[di]!;
    const open = isOpenDeck(deck);
    const rSeam = Math.sqrt(deck.rIn * deck.rIn + fill * (deck.rOut * deck.rOut - deck.rIn * deck.rIn));

    if (!open) {
      /* SHUTTERED: a closed deck. No seats, no rows, no crowd — a dark cover
         with ribs, so "closed" cannot be misread as "open and empty". */
      shutterPath += band(deck.rIn, deck.rOut, 0, Math.PI * 2, detail === "high" ? 64 : 40);
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        const q1 = pt(deck.rIn, a);
        const q2 = pt(deck.rOut, a);
        shutterRibs += "M" + n(q1[0]) + " " + n(q1[1]) + "L" + n(q2[0]) + " " + n(q2[1]);
      }
      continue;
    }

    for (let si = 0; si < deck.sections; si++) {
      const a0 = (si / deck.sections) * Math.PI * 2;
      const a1 = ((si + 1) / deck.sections) * Math.PI * 2;
      const gap = (a1 - a0) * 0.05; /* the aisle, thin on purpose: a wide gap
                                       reads as empty seats on a full house */
      const b0 = a0 + gap / 2;
      const b1 = a1 - gap / 2;
      const mid = (b0 + b1) / 2;
      const nearness = 0.5 + 0.5 * Math.sin(mid);
      const tone = nearness < 0.34 ? 0 : nearness < 0.7 ? 1 : 2;

      darkPaths[tone]!.push(band(deck.rIn, deck.rOut, b0, b1, seatSteps));
      emptyUnion.push(band(rSeam, deck.rOut, b0, b1, seatSteps));
      if (fill > 0.004) {
        /* This section's slice of each wedge. The radial extent is the same
           rIn..rSeam every section has; only the ANGULAR span is split, so the
           fill law is untouched and the wedge shares are exact rather than
           quantised to the section count. */
        for (let bi = 0; bi < wedges.length; bi += 1) {
          const wg = wedges[bi]!;
          /* Wedges run past 2*PI; compare this section against both turns. */
          for (const shift of [0, Math.PI * 2, -Math.PI * 2]) {
            const s0 = Math.max(b0, wg.a0 + shift);
            const s1 = Math.min(b1, wg.a1 + shift);
            if (s1 - s0 <= 1e-6) continue;
            const d = band(deck.rIn, rSeam, s0, s1, seatSteps);
            litPaths[bi]![tone]!.push(d);
            litUnion.push(d);
          }
        }
      }
      if (detail === "high") {
        rowPath += arc(deck.rIn + (deck.rOut - deck.rIn) * 0.5, b0, b1, 3, "M");
      }
    }
    if (fill > 0.02 && fill < 0.995) {
      seamPath += arc(rSeam - (deck.rOut - deck.rIn) * 0.04, 0, Math.PI * 2, detail === "high" ? 56 : 36, "M");
      seamShadow += arc(rSeam, 0, Math.PI * 2, detail === "high" ? 56 : 36, "M");
    }
    /* the third state's own signature: an open upper bowl carries a rail
       light on its lip that a shuttered one cannot have */
    if (deck.key === "bowl" && open && light > 0) {
      railPath += arc(deck.rOut, 0, Math.PI * 2, detail === "high" ? 56 : 36, "M");
    }
  }

  const DARK_L = [9, 10.6, 12.4];
  const LIT_L = [34, 41, 49];
  for (let t = 0; t < 3; t++) {
    if (darkPaths[t]!.length) {
      out.push(
        '<path d="' + darkPaths[t]!.join("") + '" fill="' +
          hsl(234, 11, DARK_L[t]! * (0.5 + 0.5 * light) * dim + 1.2) + '"/>'
      );
    }
  }
  if (emptyUnion.length) {
    /* empty seats: moulded plastic still catches a little light */
    out.push(
      '<path d="' + emptyUnion.join("") + '" fill="url(#' + id("crowd") + ')" fill-opacity="' +
        n(0.05 * dim) + '"/>'
    );
  }
  for (let bi = 0; bi < bands.length; bi++) {
    const b = bands[bi]!;
    for (let t = 0; t < 3; t++) {
      if (litPaths[bi]![t]!.length) {
        out.push(
          '<path d="' + litPaths[bi]![t]!.join("") + '" fill="' +
            hsl(b.hue - t * 6, b.sat + t * 4, LIT_L[t]! * (0.62 + 0.38 * light) * dim + 1.5) + '"/>'
        );
      }
    }
  }
  if (litUnion.length) {
    /* crowd texture: thousands of heads, one element */
    out.push(
      '<path d="' + litUnion.join("") + '" fill="url(#' + id("crowd") + ')" fill-opacity="' +
        n(0.22 * light * dim) + '"/>'
    );
  }
  if (shutterPath) {
    out.push('<path d="' + shutterPath + '" fill="' + hsl(228, 10, 6.5 * dim + 1) + '"/>');
    out.push(
      '<path d="' + shutterRibs + '" fill="none" stroke="#3b3b55" stroke-opacity="' + n(0.7 * dim) +
        '" stroke-width="' + n(Math.max(0.7, R * 0.005)) + '"/>'
    );
    out.push(
      '<path d="' + ring(DECKS[2]!.rIn, detail === "high" ? 56 : 36) + '" fill="none" stroke="#1b1b2a" stroke-opacity="' +
        n(0.9 * dim) + '" stroke-width="' + n(Math.max(1, R * 0.006)) + '"/>'
    );
  }
  if (rowPath) {
    out.push(
      '<path d="' + rowPath + '" fill="none" stroke="#04040a" stroke-opacity="' + n(0.3 * dim) +
        '" stroke-width="0.8"/>'
    );
  }
  if (seamShadow) {
    out.push(
      '<path d="' + seamShadow + '" fill="none" stroke="#04040a" stroke-opacity="' + n(0.8 * dim) +
        '" stroke-width="' + n(Math.max(1, R * 0.008)) + '"/>'
    );
  }
  if (seamPath) {
    out.push(
      '<path d="' + seamPath + '" fill="none" stroke="#efe6ff" stroke-opacity="' +
        n((0.2 + 0.5 * light) * dim) + '" stroke-width="' + n(Math.max(1.1, R * 0.009)) + '"/>'
    );
  }
  if (railPath) {
    out.push(
      '<path d="' + railPath + '" fill="none" stroke="#c3b0ff" stroke-opacity="' + n(0.5 * light * dim) +
        '" stroke-width="' + n(Math.max(1, R * 0.006)) + '"/>'
    );
  }

  /* concourse shadow between decks */
  const shade = (r: number, w: number, o: number): string =>
    '<path d="' + ring(r, detail === "high" ? 56 : 36) + '" fill="none" stroke="#04040a" stroke-opacity="' +
    n(o * dim) + '" stroke-width="' + n(w) + '"/>';
  out.push(shade(DECKS[0]!.rOut + 0.012, R * 0.014, 0.6));
  out.push(shade(DECKS[1]!.rOut + 0.012, R * 0.014, 0.6));
  out.push(shade(DECKS[0]!.rIn - 0.008, R * 0.008, 0.45));

  /* near roof lip overhanging the near top rows */
  out.push(
    '<path d="' + arc(R_ROOF_IN, 0.1, Math.PI - 0.1, 40, "M") +
      arc(R_ROOF_IN * 0.985, Math.PI - 0.1, 0.1, 40, "L") +
      'Z" fill="#0c0c14" fill-opacity="' + n(0.75 * dim) + '"/>'
  );

  /* --- 5. floor + court ------------------------------------------------ */
  const fcx = cx;
  const fcy = cy + VS * R * rake(R_FLOOR);
  out.push(
    '<ellipse cx="' + n(fcx) + '" cy="' + n(fcy) + '" rx="' + n(R * R_FLOOR) +
      '" ry="' + n(VS * R * R_FLOOR * SQUASH) + '" fill="' + hsl(248, 14, 9 * dim + 1.2) + '"/>'
  );
  let apron = "";
  for (let i = 1; i <= 2; i++) {
    apron += ring(R_FLOOR * (1 - i * 0.09), 36);
  }
  out.push(
    '<path d="' + apron + '" fill="none" stroke="#2a2740" stroke-opacity="' + n(0.5 * dim) +
      '" stroke-width="' + n(Math.max(0.7, R * 0.004)) + '"/>'
  );

  const hx = R * 0.212;
  const hy = VS * R * 0.212 * (50 / 94) * SQUASH * 1.2;
  const CP = (u: number, v: number): [number, number] => [n(fcx + u * hx * (1 + 0.05 * v)), n(fcy + v * hy)];
  const courtPoly =
    "M" + CP(-1, -1).join(" ") + "L" + CP(1, -1).join(" ") + "L" + CP(1, 1).join(" ") +
    "L" + CP(-1, 1).join(" ") + "Z";

  if (light > 0) {
    out.push(
      '<ellipse cx="' + n(fcx) + '" cy="' + n(fcy - hy * 0.4) + '" rx="' + n(hx * 2.1) +
        '" ry="' + n(hy * 4.2) + '" fill="url(#' + id("floorglow") + ')"/>'
    );
  }
  out.push('<path d="' + courtPoly + '" fill="url(#' + id("wood") + ')"/>');

  /* Court markings are paint, not light: they go out with the house lights,
     so a dark building does not glow white at the middle (law 6). */
  const ink = "rgba(246,244,238," + n(0.72 * dim * (0.06 + 0.94 * light)) + ")";
  const lw = Math.max(0.7, R * 0.004);
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
  const paint = (sign: number): string =>
    '<path d="M' + CP(sign, -kw).join(" ") + "L" + CP(sign - sign * kd, -kw).join(" ") +
    "L" + CP(sign - sign * kd, kw).join(" ") + "L" + CP(sign, kw).join(" ") + 'Z" fill="' +
    hsl(24, 46, 30 * woodL) + '" fill-opacity="' + n(0.75 * dim) + '"/>';
  out.push(paint(-1), paint(1));
  out.push('<path d="' + marks + '" fill="none" stroke="' + ink + '" stroke-width="' + n(lw) + '"/>');
  const ell = (u: number, v: number, rft: number): string =>
    '<ellipse cx="' + CP(u, v)[0] + '" cy="' + CP(u, v)[1] + '" rx="' + n((rft / 47) * hx) +
    '" ry="' + n((rft / 25) * hy) + '" fill="none" stroke="' + ink + '" stroke-width="' + n(lw) + '"/>';
  out.push(ell(0, 0, 6));
  out.push(ell(-1 + kd, 0, 6));
  out.push(ell(1 - kd, 0, 6));

  /* the lit floor is the brightest thing in the building — when it is lit */
  if (light > 0) {
    out.push('<path d="' + courtPoly + '" fill="#fff6de" fill-opacity="' + n(0.15 * light * dim) + '"/>');
  }
  out.push(
    '<path d="' + courtPoly + '" fill="none" stroke="#0a0a12" stroke-opacity="' + n(0.5 * dim) +
      '" stroke-width="' + n(R * 0.014) + '"/>'
  );

  /* --- 6. lighting ----------------------------------------------------- */
  if (light > 0) {
    defs.push(
      '<radialGradient id="' + id("wash") + '" cx="50%" cy="42%" r="56%">' +
        '<stop offset="0%" stop-color="#c3b0ff" stop-opacity="' + n(0.15 * light * dim) + '"/>' +
        '<stop offset="58%" stop-color="' + VIOLET + '" stop-opacity="' + n(0.1 * light * dim) + '"/>' +
        '<stop offset="100%" stop-color="' + VIOLET + '" stop-opacity="0"/>' +
        "</radialGradient>"
    );
    out.push(
      '<ellipse cx="' + n(cx) + '" cy="' + n(cy + VS * R * 0.1) + '" rx="' + n(R * 0.78) + '" ry="' +
        n(VS * R * 0.6) + '" fill="url(#' + id("wash") + ')"/>'
    );
    const rRig = R_ROOF_IN * 0.985;
    out.push(
      '<path d="' + ring(rRig, 48) + '" fill="none" stroke="' + GOLD + '" stroke-opacity="' +
        n(0.07 * light * dim) + '" stroke-width="' + n(R * 0.03) + '" filter="url(#' + id("soft") + ')"/>'
    );
    let heads = "";
    let glows = "";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.11;
      const q = pt(rRig, a);
      const w = Math.max(1.3, R * 0.009);
      heads += '<rect x="' + n(q[0] - w) + '" y="' + n(q[1] - w * 0.45) + '" width="' + n(w * 2) +
        '" height="' + n(w * 0.9) + '" rx="' + n(w * 0.35) + '"/>';
      glows += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" r="' + n(R * 0.03) +
        '" fill="url(#' + id("flood") + ')"/>';
    }
    out.push('<g class="' + uid + '-flood">' + glows + "</g>");
    out.push('<g fill="#3a3a52" fill-opacity="' + n(0.8 * dim) + '">' + heads + "</g>");
  }

  /* --- 7. sellout signature -------------------------------------------- */
  if (soldOut) {
    out.push(
      '<path d="' + ring(R_ROOF_IN, 56) + '" fill="none" stroke="' + GOLD +
        '" stroke-opacity="' + n(0.26 * dim) + '" stroke-width="' + n(Math.max(2, R * 0.012)) +
        '" filter="url(#' + id("soft") + ')"/>'
    );
    out.push(
      '<path class="' + uid + '-ring" d="' + ring(R_ROOF_IN, 56) +
        '" fill="none" stroke="#ffe9b8" stroke-opacity="' + n(0.5 * dim) + '" stroke-width="' +
        n(Math.max(1.2, R * 0.004)) + '"/>'
    );
  }

  /* --- 8. turned away at the gates -------------------------------------- */
  if (turnedAway > 0) {
    const q = clamp(turnedAway / (capacity * 0.45), 0.1, 1);
    let dots = "";
    let glow = "";
    for (let g = 0; g < gateAngles.length; g++) {
      const a = gateAngles[g]!;
      const b = pt(R_ROOF_OUT, a, WALL);
      glow += '<ellipse cx="' + n(b[0]) + '" cy="' + n(b[1] + VS * R * 0.02) + '" rx="' + n(R * 0.13) +
        '" ry="' + n(VS * R * 0.09) + '" fill="url(#' + id("gate") + ')" opacity="' + n(0.45 + 0.55 * q) + '"/>';
      const nDots = Math.round(9 + q * 30);
      const spread = R * (0.06 + 0.1 * q);
      for (let d2 = 0; d2 < nDots; d2++) {
        const along = (rand() + rand() - 1) * spread;
        const back = Math.pow(rand(), 1.7) * VS * R * 0.12 * (0.5 + 0.5 * q);
        const px = b[0] + along;
        const py = b[1] + VS * R * 0.02 + back;
        const sw = Math.max(0.7, R * 0.005);
        dots += "M" + n(px) + " " + n(py) + "h" + n(sw) + "v" + n(sw * 2.2) + "h" + n(-sw) + "Z";
      }
    }
    out.push(glow);
    out.push('<path d="' + dots + '" fill="#ffdda8" fill-opacity="' + n((0.45 + 0.4 * q) * dim) + '"/>');
  }

  /* --- 9. atmosphere + edge fade ---------------------------------------- */
  if (light > 0) {
    out.push(
      '<ellipse cx="' + n(cx) + '" cy="' + n(cy - VS * R * 0.24) + '" rx="' + n(R * 0.82) + '" ry="' +
        n(VS * R * 0.42) + '" fill="#7b68dd" fill-opacity="' + n(0.05 * light * dim) +
        '" filter="url(#' + id("soft") + ')"/>'
    );
  }
  /* The drawing is scaled to its box with `meet`, so a box whose aspect is not
     the viewBox's shows a letterbox band of the container's own background.
     Fading the four edges to void makes that band seamless instead of a seam
     (visual-critic-3 defect 3). */
  defs.push(
    '<linearGradient id="' + id("fx") + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + VOID + '" stop-opacity="1"/>' +
      '<stop offset="9%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      '<stop offset="91%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="' + VOID + '" stop-opacity="1"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + id("fy") + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + VOID + '" stop-opacity="1"/>' +
      '<stop offset="14%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      '<stop offset="86%" stop-color="' + VOID + '" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="' + VOID + '" stop-opacity="1"/>' +
      "</linearGradient>"
  );
  out.push('<rect width="' + width + '" height="' + height + '" fill="url(#' + id("fx") + ')"/>');
  out.push('<rect width="' + width + '" height="' + height + '" fill="url(#' + id("fy") + ')"/>');

  if (view === "backdrop") {
    /* the projector backdrop is atmosphere: the room reads the data, not this */
    defs.push(
      '<radialGradient id="' + id("bvig") + '" cx="50%" cy="50%" r="62%">' +
        '<stop offset="55%" stop-color="#000" stop-opacity="0"/>' +
        '<stop offset="100%" stop-color="#000" stop-opacity="0.6"/>' +
        "</radialGradient>"
    );
    out.push('<rect width="' + width + '" height="' + height + '" fill="url(#' + id("bvig") + ')"/>');
  }

  /* --- style / motion --------------------------------------------------- */
  /* Both animations carry their own reduced-motion collapse inside the SVG,
     because the SVG is injected as markup and may outlive any stylesheet
     rule that targets it (A10 / DIRECTION non-negotiable 9). */
  let style = "";
  if (motion) {
    style =
      "<style>" +
      "@keyframes " + uid + "-breathe{0%,100%{opacity:.9}50%{opacity:1}}" +
      "." + uid + "-flood{animation:" + uid + "-breathe 5.4s ease-in-out infinite}" +
      "@keyframes " + uid + "-flash{0%{stroke-opacity:1;stroke-width:" + n(Math.max(4, R * 0.016)) +
      "px}100%{stroke-opacity:.7}}" +
      "." + uid + "-ring{animation:" + uid + "-flash 260ms cubic-bezier(.22,1,.36,1) 1}" +
      "@media (prefers-reduced-motion: reduce){." + uid + "-flood,." + uid +
      "-ring{animation:none!important}}" +
      "</style>";
  }

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
    '" width="100%" height="100%" role="img" aria-label="' +
    label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") +
    '" preserveAspectRatio="xMidYMid meet" style="display:block">' +
    style + "<defs>" + defs.join("") + "</defs>" + out.join("") + "</svg>"
  );
}

export default arenaSvg;
