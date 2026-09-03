/**
 * THE FRONT OFFICE — the shell three lessons share.
 *
 * Founder §11 asks for "spatial / persistent product memory": the student
 * should feel they return to the same organisation each lesson. That is a
 * CHROME concern, not a state concern, so this module renders a frame from a
 * plain descriptor and knows nothing whatever about any lesson's state. Each
 * module keeps its own state, reducer and panels exactly as `LessonModule`
 * requires (CLAUDE.md §12); the shell only says where they sit.
 *
 * Nothing here computes a value. If a number reaches this file it was already
 * computed and named by a module's view — the shell has no opinions to smuggle.
 */

import { esc } from "./m2ui.js";

/* --------------------------------------------------------------- crest -- */

/**
 * An original club mark.
 *
 * Deliberately NOT a team logo and deliberately not a team's official colours:
 * founder §4 forbids copying branding packages for realism, so identity comes
 * from BOW geometry plus a hue derived from the club id. Eight clubs land far
 * enough apart on the wheel to read at a glance, and the mark is ours.
 */
function hueOf(clubId: string): number {
  let h = 0;
  for (let i = 0; i < clubId.length; i += 1) h = (h * 31 + clubId.charCodeAt(i)) % 360;
  // Nudge off the two hues that read as semantic in this palette (red = over
  // the line, green = safe), so a crest never argues with a cap reading.
  if (h > 340 || h < 14) h = (h + 40) % 360;
  if (h > 100 && h < 150) h = (h + 60) % 360;
  return h;
}

export function clubCrest(clubId: string, label: string, sizePx = 34): string {
  const h = hueOf(clubId);
  const initials = label
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const style = [
    `width:${sizePx}px`,
    `height:${Math.round(sizePx * 1.1)}px`,
    `font-size:${Math.round(sizePx * 0.44)}px`,
    `background:linear-gradient(155deg,hsl(${h} 62% 46%),hsl(${(h + 26) % 360} 58% 27%))`,
  ].join(";");
  return `<span class="hq-crest" style="${style}" aria-hidden="true">${esc(initials)}</span>`;
}

/** The club's hue as a CSS custom property, for tinting the frame. */
export function clubTint(clubId: string): string {
  const h = hueOf(clubId);
  return `--hq-club:hsl(${h} 66% 66%);--hq-club-dim:hsl(${h} 60% 50% / 0.16)`;
}

/* ---------------------------------------------------------- descriptor -- */

export interface HqNavItem {
  readonly id: string;
  readonly label: string;
  /** `live` is where the student is now; `locked` is not reachable yet. */
  readonly state: "live" | "open" | "locked";
  readonly count?: number | null;
}

export interface HqTriadCell {
  readonly label: string;
  readonly value: string;
  readonly live?: boolean;
}

export interface HqShell {
  readonly eyebrow: string;
  readonly title: string;
  readonly sub?: string | null;
  readonly clubId?: string | null;
  readonly nav: readonly HqNavItem[];
  readonly triad: readonly HqTriadCell[];
  /** The module arc. `index` is the act now running, zero-based. */
  readonly acts: readonly string[];
  readonly actIndex: number;
  /** Rendered HTML for the two content regions. */
  readonly main: string;
  readonly side: string;
}

/* ------------------------------------------------------------- render -- */

const navItem = (n: HqNavItem): string => `
  <div class="hq-nav-item" data-state="${esc(n.state)}" role="listitem" title="${esc(n.label)}">
    <span class="hq-dot"></span><span>${esc(n.label)}</span>${
      n.count == null ? "" : `<span class="hq-nav-count">${n.count}</span>`
    }
  </div>`;

const triadCell = (c: HqTriadCell): string => `
  <div class="hq-triad-cell" data-live="${c.live ? "yes" : "no"}" data-cell="${esc(
    c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  )}">
    <dt>${esc(c.label)}</dt><dd class="hq-cell-value">${esc(c.value)}</dd>
  </div>`;

const act = (label: string, i: number, now: number): string => {
  const state = i < now ? "done" : i === now ? "now" : "next";
  return `<li class="hq-act" data-state="${state}"${
    i === now ? ' aria-current="step"' : ""
  }><span class="hq-act-node"></span>${esc(label)}</li>`;
};

export function renderHq(s: HqShell): string {
  const tint = s.clubId ? ` style="${clubTint(s.clubId)}"` : "";
  const crest = s.clubId ? clubCrest(s.clubId, s.title, 40) : "";
  const railCrest = s.clubId ? clubCrest(s.clubId, s.title, 26) : "";
  return `
<div class="hq"${tint}>
  <div class="hq-rail" role="navigation" aria-label="Front office">
    <div class="hq-brand">
      <span class="hq-brand-word">BOW<small>ECONOMICS</small></span>
    </div>
    <p class="hq-rail-label">FRONT OFFICE</p>
    <div class="hq-nav" role="list">${s.nav.map(navItem).join("")}</div>
    <div class="hq-rail-foot">${railCrest}</div>
  </div>

  <div class="hq-band" role="banner">
    <div class="hq-band-top">
      <div class="hq-band-id">
        ${crest}
        <div>
          <p class="hq-eyebrow">${esc(s.eyebrow)}</p>
          <h1 class="hq-title">${esc(s.title)}</h1>
        </div>
      </div>
      ${s.triad.length ? `<dl class="hq-triad">${s.triad.map(triadCell).join("")}</dl>` : ""}
    </div>
    <div class="hq-band-foot">
      ${s.sub ? `<p class="hq-sub">${esc(s.sub)}</p>` : ""}
      <ol class="hq-acts">${s.acts.map((a, i) => act(a, i, s.actIndex)).join("")}</ol>
    </div>
  </div>

  <div class="hq-main" role="main">${s.main}</div>
  <div class="hq-side" role="complementary" aria-label="Cap sheet">${s.side}</div>
</div>`;
}

/* ------------------------------------------------------- panel helpers -- */

export interface PanelOptions {
  readonly title: string;
  readonly note?: string | null;
  readonly live?: string | null;
  readonly flush?: boolean;
}

export function panel(o: PanelOptions, body: string): string {
  return `
<section class="hq-panel">
  <div class="hq-panel-head">
    <h2>${esc(o.title)}</h2>
    ${o.note ? `<span class="hq-panel-note">${esc(o.note)}</span>` : ""}
    ${o.live ? `<span class="hq-panel-note--live">${esc(o.live)}</span>` : ""}
  </div>
  <div class="hq-panel-body${o.flush ? " hq-panel-body--flush" : ""}">${body}</div>
</section>`;
}

/* ------------------------------------------------------- self-measurement -- */

let bandObserver: ResizeObserver | null = null;

/**
 * Publish the band's real height as `--hq-bandh` on the shell.
 *
 * A lesson's panels need to bound themselves to what is left of the viewport,
 * and the band is not a fixed size: the club situation line wraps to two rows
 * on a narrow screen, the triad gains a cell in one lesson and loses one in
 * another, and the compaction media query changes it again. Every attempt to
 * express that as a constant in CSS was a magic number that was wrong at some
 * width — measured 8px over the fold at 1024x600 with the last one.
 *
 * So the shell measures itself. Call once after mounting; it re-measures on
 * resize and on any reflow of the band.
 */
export function observeHqBand(root: ParentNode = document): void {
  const shell = root.querySelector<HTMLElement>(".hq");
  const band = root.querySelector<HTMLElement>(".hq-band");
  if (!shell || !band) return;
  const publish = (): void => {
    shell.style.setProperty("--hq-bandh", `${Math.round(band.getBoundingClientRect().height)}px`);
  };
  publish();
  bandObserver?.disconnect();
  if (typeof ResizeObserver === "undefined") return;
  bandObserver = new ResizeObserver(publish);
  bandObserver.observe(band);
}
