/**
 * m2ui.ts — the Module 2 shared UI vocabulary, as pure HTML-string builders.
 *
 * Every function here returns a string and touches no DOM, reads no global,
 * and holds no state. They are shape only: the caller supplies every word and
 * every number, and every word the caller supplies comes from the module
 * payload. Nothing in this file composes an economic sentence, formats a
 * currency, derives a percentage, or decides what a number means — that would
 * put a claim on the client where no audit can see it (R-1).
 *
 * The classes are defined in `shared/m2.css` and only take effect inside
 * `html[data-module="m2"]`.
 *
 * TWO THINGS THAT MUST NOT BE ADDED HERE:
 *  - a line/area/trend/fit series of any kind. `dotChart` draws marks and
 *    nothing else: joining a pair's settled nights would draw a relationship
 *    the model does not contain, because every night is a different demand
 *    world (E2/E3 FORBIDDEN).
 *  - any "projected", "expected", "target" or "forecast" affordance. There is
 *    no such quantity in this product (E1/E8 FORBIDDEN).
 */

/* ------------------------------------------------------------------ */
/* escaping                                                            */
/* ------------------------------------------------------------------ */

/** Escape text for an HTML text node or a double-quoted attribute. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Clamp a 0-100 percentage that is about to become a pixel width. */
function pct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 100 ? 100 : value;
}

/* ------------------------------------------------------------------ */
/* brand mark                                                          */
/* ------------------------------------------------------------------ */

/**
 * The compass rose: four long cardinal points, four short diagonals, a dark
 * hub. It is a compass — a thing that tells you where you are — and
 * deliberately not a star, a badge or an award glyph (D4).
 */
export function brandMark(sizePx = 32): string {
  const s = Math.round(sizePx);
  return (
    '<svg class="m2-brand-mark" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" ' +
    'role="img" aria-label="BOW Economics" focusable="false">' +
    '<defs><radialGradient id="m2-compass-grad" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#c3b0ff"/>' +
    '<stop offset="55%" stop-color="#7a5cff"/>' +
    '<stop offset="100%" stop-color="#5b3df0"/>' +
    "</radialGradient></defs>" +
    '<path d="M24.00 1.00 L26.14 18.83 L32.84 15.16 L29.17 21.86 L47.00 24.00 L29.17 26.14 ' +
    "L32.84 32.84 L26.14 29.17 L24.00 47.00 L21.86 29.17 L15.16 32.84 L18.83 26.14 L1.00 24.00 " +
    'L18.83 21.86 L15.16 15.16 L21.86 18.83 Z" fill="url(#m2-compass-grad)"/>' +
    '<circle cx="24" cy="24" r="3.1" fill="#08080f"/>' +
    '<circle cx="24" cy="24" r="1.35" fill="#d8cfff"/>' +
    "</svg>"
  );
}

/* ------------------------------------------------------------------ */
/* icon sprite                                                         */
/* ------------------------------------------------------------------ */

/**
 * Sixteen line glyphs on a 24-unit grid, stroked with `currentColor`.
 *
 * The style tile's set carried a `target` bullseye. It is not here: "target"
 * is forbidden vocabulary on this lesson (E8, and the R-1 source grep), and
 * there is no target quantity for it to name.
 */
const SPRITE = {
  ticket:
    '<path d="M3.2 8.6a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v1.1a2.3 2.3 0 0 0 0 4.6v1.1a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2v-1.1a2.3 2.3 0 0 0 0-4.6Z"/>' +
    '<path d="M14.4 7.4v1.9M14.4 11.1v1.8M14.4 14.7v1.9"/>',
  people:
    '<circle cx="9.6" cy="8.2" r="3.3"/>' +
    '<path d="M3.4 19.8v-1.2a4 4 0 0 1 4-4h4.4a4 4 0 0 1 4 4v1.2"/>' +
    '<path d="M16.4 5.3a3.3 3.3 0 0 1 0 6.1M17.6 14.9a4 4 0 0 1 3 3.7v1.2"/>',
  arena:
    '<path d="M2.6 14.6a9.4 7.6 0 0 1 18.8 0"/>' +
    '<path d="M6.9 14.6a5.1 4.1 0 0 1 10.2 0"/>' +
    '<path d="M1.9 14.6h20.2"/><path d="M7.4 18.4h9.2"/>',
  dollar: '<path d="M12 3.4v17.2"/><path d="M15.9 7.3H10.1a2.85 2.85 0 0 0 0 5.7h3.8a2.85 2.85 0 0 1 0 5.7H7.7"/>',
  "trend-up": '<path d="M3.4 16.8 9.6 10.6l3.5 3.5 7.1-7.1"/><path d="M15.4 7h4.8v4.8"/>',
  bulb:
    '<path d="M8.3 13.9a5 5 0 1 1 7.4 0c-.9 1-1.4 1.9-1.5 3.1H9.8c-.1-1.2-.6-2.1-1.5-3.1Z"/>' +
    '<path d="M9.9 20.4h4.2M9.4 17h5.2"/>',
  lock: '<rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.3"/><path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8"/>',
  /* the doors of the building, for the beat between commitment and consequence */
  door:
    '<path d="M3.4 20.2h17.2"/><path d="M5.6 20.2V4.6a1.2 1.2 0 0 1 1.2-1.2h3.6v16.8"/>' +
    '<path d="M18.4 20.2V4.6a1.2 1.2 0 0 0-1.2-1.2h-3.6v16.8"/><path d="M8.4 12.4h.1M15.6 12.4h.1"/>',
  eye: '<path d="M2.4 12S6.1 5.8 12 5.8 21.6 12 21.6 12 17.9 18.2 12 18.2 2.4 12 2.4 12Z"/><circle cx="12" cy="12" r="2.9"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 6.9v5.4l3.4 2"/>',
  calendar:
    '<rect x="3.4" y="5.4" width="17.2" height="15.2" rx="2.2"/>' +
    '<path d="M3.4 10.2h17.2M8.2 3.4v4M15.8 3.4v4"/>',
  pause: '<path d="M9.2 5.4v13.2M14.8 5.4v13.2"/>',
  projector:
    '<rect x="2.4" y="7.4" width="19.2" height="9.6" rx="2.4"/><circle cx="9.6" cy="12.2" r="2.7"/>' +
    '<path d="M17 11.2h1.6M6.2 17v2.2M17.8 17v2.2"/>',
  chevron: '<path d="M9.2 5.4 15.8 12l-6.6 6.6"/>',
  alert: '<path d="M12 4.1 21.3 19.6H2.7Z"/><path d="M12 10v4.1M12 17.3v.1"/>',
  "chart-bars": '<path d="M3.2 20.2h17.6"/><path d="M6.8 20.2v-6.4M12 20.2V7.4M17.2 20.2v-9"/>',
  scale:
    '<path d="M12 5.2v14.4M7.4 19.6h9.2M4.4 8.1 12 6.6l7.6 1.5"/>' +
    '<path d="M4.4 8.1 1.9 13.4a2.9 2.9 0 0 0 5 0Z"/><path d="M19.6 8.1 17.1 13.4a2.9 2.9 0 0 0 5 0Z"/>',
};

export type IconName = keyof typeof SPRITE;

/** Every glyph name, in sprite order. */
export const ICON_NAMES: readonly IconName[] = Object.keys(SPRITE) as IconName[];

/**
 * The sprite itself. Inject this ONCE per surface (it is `position:absolute;
 * width:0` and paints nothing); `icon()` then costs one `<use>` per call.
 */
export function iconSprite(): string {
  let symbols = "";
  for (const [name, glyph] of Object.entries(SPRITE)) {
    symbols +=
      '<symbol id="m2i-' + name + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.33" stroke-linecap="round" stroke-linejoin="round">' + glyph + "</symbol>";
  }
  return '<svg class="m2-sprite" aria-hidden="true" focusable="false"><defs>' + symbols + "</defs></svg>";
}

/** One glyph. Decorative by default; give it a `title` when it carries meaning alone. */
export function icon(name: IconName | string, extraClass = ""): string {
  const cls = extraClass ? "m2-icon " + esc(extraClass) : "m2-icon";
  return (
    '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#m2i-' + esc(String(name)) + '"/></svg>'
  );
}

/* ------------------------------------------------------------------ */
/* stat card                                                           */
/* ------------------------------------------------------------------ */

export type Tone = "default" | "money" | "violet";

export interface StatCardOptions {
  /** Glyph name from the sprite. */
  icon: IconName | string;
  /** The caps eyebrow. */
  label: string;
  /** The figure, already formatted by the caller from payload data. */
  figure: string;
  /** The line under the figure — a printed fact or a registered rule, never advice. */
  qualifier?: string;
  /** `money` is green and is reserved for positive CASH; never for renewals. */
  tone?: Tone;
  /** Extra classes on the card (e.g. `is-compact`). */
  cardClass?: string;
  /** Arbitrary markup in place of the figure (a sub-dial, a plate). */
  body?: string;
  /** Optional element id. */
  id?: string;
}

export function statCard(opts: StatCardOptions): string {
  const tone: Tone = opts.tone || "default";
  const badgeClass = "m2-badge is-sm" + (tone === "money" ? " is-money" : "");
  const figClass = "m2-figure" + (tone === "money" ? " is-money" : tone === "violet" ? " is-violet" : "");
  const cardClass = "m2-card m2-stat" + (opts.cardClass ? " " + esc(opts.cardClass) : "");
  const idAttr = opts.id ? ' id="' + esc(opts.id) + '"' : "";
  const figure = opts.body !== undefined
    ? opts.body
    : '<span class="' + figClass + '">' + esc(opts.figure) + "</span>";
  return (
    '<div class="' + cardClass + '"' + idAttr + ">" +
    '<div class="m2-card-head"><span class="' + badgeClass + '">' + icon(opts.icon, "is-16") + "</span>" +
    '<span class="m2-label">' + esc(opts.label) + "</span></div>" +
    figure +
    (opts.qualifier ? '<span class="m2-qualifier">' + esc(opts.qualifier) + "</span>" : "") +
    "</div>"
  );
}

/* ------------------------------------------------------------------ */
/* pill                                                                */
/* ------------------------------------------------------------------ */

export type PillTone = "neutral" | "locked" | "adjusting" | "attention" | "violet";

export interface PillOptions {
  tone?: PillTone;
  /** Sprite glyph name. A pill without a glyph would be colour-only state. */
  glyph: IconName | string;
  label: string;
}

/**
 * Status pill. Colour is never the only carrier of meaning: every pill ships a
 * glyph AND a word (VISUAL_IDENTITY colour law; DIRECTION non-negotiable 6).
 */
export function pill(opts: PillOptions): string {
  const tone: PillTone = opts.tone || "neutral";
  const cls = "m2-pill" + (tone === "neutral" ? "" : " is-" + tone);
  return '<span class="' + cls + '">' + icon(opts.glyph) + "<span>" + esc(opts.label) + "</span></span>";
}

/* ------------------------------------------------------------------ */
/* radial gauge                                                        */
/* ------------------------------------------------------------------ */

const GAUGE_R = 52;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R; /* 326.73 */
const GAUGE_ARC = GAUGE_CIRC * 0.75; /* 270 degrees */

/**
 * A 270-degree fill gauge. ALLOWED only as a secondary figure beside the
 * chain, never as the hero of a results state, and never as a score: there is
 * no target ring, and the stroke colour does not change as the number rises
 * (E11 — fill and cash conflict on 8 of 10 market-nights, so a gauge that
 * celebrates 100% teaches something false).
 *
 * `label` must carry the denominator the caller means, e.g. the registered
 * "of the seats you opened tonight" (R-2). "of capacity" is forbidden.
 */
export function radialGauge(percent: number, label: string, sizePx = 140): string {
  const v = pct(percent);
  const value = (GAUGE_ARC * v) / 100;
  const s = Math.round(sizePx);
  const inner = sizePx < 90 ? "" :
    '<text class="g-num" x="70" y="74">' + esc(String(Math.round(v))) + "%</text>" +
    '<text class="g-sub" x="70" y="94">' + esc(label) + "</text>";
  const aria = sizePx < 90 ? ' role="img" aria-label="' + esc(String(Math.round(v)) + "% " + label) + '"' : "";
  return (
    '<svg class="m2-gauge" width="' + s + '" height="' + s + '" viewBox="0 0 140 140"' + aria + ">" +
    '<circle class="track" cx="70" cy="70" r="' + GAUGE_R + '" transform="rotate(135 70 70)" ' +
    'stroke-dasharray="' + GAUGE_ARC.toFixed(2) + " " + GAUGE_CIRC.toFixed(2) + '"/>' +
    '<circle class="value" cx="70" cy="70" r="' + GAUGE_R + '" transform="rotate(135 70 70)" ' +
    'stroke-dasharray="' + value.toFixed(2) + " " + GAUGE_CIRC.toFixed(2) + '"/>' +
    inner +
    "</svg>"
  );
}

/* ------------------------------------------------------------------ */
/* bar pill                                                            */
/* ------------------------------------------------------------------ */

/** A 7px bar. `money` green is for positive CASH only — never for renewals. */
export function barPill(percent: number, tone: "violet" | "money" = "violet"): string {
  const v = pct(percent);
  return (
    '<div class="m2-bar' + (tone === "money" ? " is-money" : "") + '">' +
    '<i style="width:' + v.toFixed(1) + '%"></i></div>'
  );
}

/* ------------------------------------------------------------------ */
/* dot chart                                                           */
/* ------------------------------------------------------------------ */

export interface DotPoint {
  /** Horizontal value in axis units (price). */
  x: number;
  /** Vertical value in axis units (people who came). */
  y: number;
  /** The mark's own label — say which card the night was, so two dots are
      only compared when they are comparable (E3 constraint 1). */
  label: string;
}

export interface DotAxes {
  xLabel: string;
  yLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  width?: number;
  height?: number;
  /** Shown when `points` is empty. Caller supplies registered copy. */
  emptyLine?: string;
}

/**
 * Settled nights as marks. DOTS ONLY.
 *
 * There is no path, polyline, area, trend or fit in this function and there
 * must never be one: `curveFor` re-derives the demand world per card, so a
 * line through N1 -> N2 -> N3 asserts a relationship the model does not have
 * (E3 constraint 1, FORBIDDEN). There is also no mark, tick or crosshair for
 * the pending night — an axis of realized turnouts with "you are here" on it
 * is a projection built by the reader (E3 constraint 2, BC-4).
 */
export function dotChart(points: DotPoint[], axes: DotAxes): string {
  const w = axes.width || 420;
  const h = axes.height || 168;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const spanX = axes.xMax - axes.xMin || 1;
  const spanY = axes.yMax - axes.yMin || 1;
  const px = (x: number): number => padL + ((x - axes.xMin) / spanX) * plotW;
  const py = (y: number): number => padT + plotH - ((y - axes.yMin) / spanY) * plotH;
  const f = (v: number): string => v.toFixed(1);

  /* Two hairlines, no frame box, no grid (A6). They are <line> elements: this
     SVG contains no <path> at all, so "no path joins the dots" is checkable by
     a selector, not a reading (W2 repair-4 R4-3). */
  let svg =
    '<svg class="m2-chart" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' +
    esc(axes.yLabel + " against " + axes.xLabel) + '">' +
    '<line class="axis" x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + plotH) + '"/>' +
    '<line class="axis" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (padL + plotW) + '" y2="' + (padT + plotH) + '"/>';

  /* The y axis is fitted to the data, so its ends are printed: the reader can
     see the axis does not start at zero instead of inferring a scale. */
  svg +=
    '<text class="axis-label" x="' + padL + '" y="' + (h - 6) + '">' + esc(axes.xLabel) + "</text>" +
    '<text class="axis-label" x="4" y="' + (padT - 3) + '">' + esc(axes.yLabel) + "</text>" +
    (points.length > 0
      ? '<text class="axis-tick" x="' + (padL - 4) + '" y="' + (padT + 11) + '" text-anchor="end">' + esc(fmt(axes.yMax)) + "</text>" +
        '<text class="axis-tick" x="' + (padL - 4) + '" y="' + (padT + plotH) + '" text-anchor="end">' + esc(fmt(axes.yMin)) + "</text>"
      : "");

  if (points.length === 0) {
    if (axes.emptyLine) {
      svg +=
        '<text class="axis-label" x="' + (padL + plotW / 2) + '" y="' + (padT + plotH / 2) +
        '" text-anchor="middle">' + esc(axes.emptyLine) + "</text>";
    }
    return svg + "</svg>";
  }

  /* Marks. Two nights at the same price and the same crowd would print one
     dot; the later one is nudged 6 units sideways so both marks exist. The
     label carries the exact price, so the nudge misstates nothing. */
  const marks: Array<{ cx: number; cy: number; i: number }> = [];
  points.forEach((pt, i) => {
    let cx = px(pt.x);
    const cy = py(pt.y);
    while (marks.some((m) => Math.abs(m.cx - cx) < 4 && Math.abs(m.cy - cy) < 4)) cx += 6;
    marks.push({ cx, cy, i });
  });
  let marksSvg = "";
  for (const m of marks) marksSvg += '<circle class="pt" cx="' + f(m.cx) + '" cy="' + f(m.cy) + '" r="5"/>';

  /* Labels: the latest night is always labelled; an earlier night is labelled
     only if its box intersects no label already placed. A box is clamped
     inside the plot, below its mark when there is room and above it otherwise.
     No leader lines: a label that cannot sit by its mark is not drawn, and the
     ledger beside the chart carries every night in full. */
  type Box = { l: number; r: number; t: number; b: number };
  const CH = 6.3; /* Inter 600 at 10.5 units: mean advance, measured generously */
  const LH = 12;
  const hit = (a: Box, b: Box): boolean => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const placed: Box[] = [];
  const markBoxes: Box[] = marks.map((m) => ({ l: m.cx - 6, r: m.cx + 6, t: m.cy - 6, b: m.cy + 6 }));
  let labelsSvg = "";
  const order = marks.map((m) => m.i).sort((a, b) => b - a); /* latest first */
  for (const i of order) {
    const m = marks[i]!;
    const text = points[i]!.label;
    const tw = text.length * CH;
    let cx = m.cx;
    cx = Math.max(padL + tw / 2, Math.min(padL + plotW - tw / 2, cx));
    const candidates: number[] = [m.cy + 17, m.cy - 9];
    let chosen: Box | null = null;
    for (const baseline of candidates) {
      const by = Math.max(padT + LH, Math.min(padT + plotH - 1, baseline));
      const box: Box = { l: cx - tw / 2, r: cx + tw / 2, t: by - LH + 2, b: by + 2 };
      const overMark = markBoxes.some((mb, j) => j !== i && hit(box, mb));
      if (placed.some((p) => hit(p, box)) || overMark) continue;
      chosen = box;
      labelsSvg +=
        '<text class="pt-label" x="' + f(cx) + '" y="' + f(by) + '" text-anchor="middle">' + esc(text) + "</text>";
      break;
    }
    if (chosen) placed.push(chosen);
  }
  return svg + marksSvg + labelsSvg + "</svg>";
}

function fmt(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}

/* ------------------------------------------------------------------ */
/* chain row                                                           */
/* ------------------------------------------------------------------ */

export interface ChainRowOptions {
  /** A second line under the label — the registered note for that step. */
  note?: string;
  /** The settled-cash line: bigger, and green only when the caller says so. */
  total?: boolean;
  /** Suppresses green on the total when the desk is in debt. */
  debt?: boolean;
  id?: string;
}

/**
 * One step of the CASH decomposition.
 *
 * The chain exists because a single money hero is forbidden (E10/R-3): the
 * student sees `TICKETS -> + IN-ARENA -> - BUILDING BILL -> - EVENT MONEY ->
 * CASH`, and RENEWALS sits beside it in a different unit at equal weight.
 * `op` is the arithmetic operator printed in the gutter: "", "+", "−", "=".
 */
export function chainRow(label: string, value: string, op = "", opts: ChainRowOptions = {}): string {
  const cls =
    "m2-chain-row" + (opts.total ? " is-total" : "") + (opts.total && opts.debt ? " is-debt" : "");
  const idAttr = opts.id ? ' id="' + esc(opts.id) + '"' : "";
  return (
    '<div class="' + cls + '"' + idAttr + ">" +
    '<span class="m2-chain-op">' + esc(op) + "</span>" +
    '<span class="m2-chain-label">' + esc(label) +
    (opts.note ? '<span class="m2-chain-note">' + esc(opts.note) + "</span>" : "") +
    "</span>" +
    '<span class="m2-chain-value">' + esc(value) + "</span>" +
    "</div>"
  );
}
