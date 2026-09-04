/**
 * THE SAME LINE — L2 "THE SEASON" (`m1l2-the-season`), the projector.
 *
 * Built against `docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md` §7
 * before `runtime/src/modules/sameLine/l2.ts` existed — see the header note
 * in `sameLineL2.ts` for the same caveat: field names here are the spec's
 * (`openJobsByRole`, `commitsIn`, `deskCount`, `wallsDrawn`, `ticker`,
 * `naming`), read through defensive accessors, and this file conforms to the
 * real module the day it lands.
 *
 * `boardView` is never handed a seat identity (spec §7, BOW test #9); nothing
 * in this file reads or renders a seat id, a chip, or the typed reasoning
 * line — the typed line is teacher-only by the Integrator ruling and simply
 * has no field this file ever looks at.
 *
 * THE PODIUM is not this file's job. The runtime's Press Conference primitive
 * (`pressConference.ts`) takes the whole projector — "LEAGUE PAUSED — PRESS
 * CONFERENCE" plus the module's own `spotlightView` — from `board/main.ts`,
 * BEFORE any module branch runs at all (see `payload.spotlight` there). By
 * the time `renderSameLineL2Board` is ever called, there is no press
 * conference running. A `podiumFrame` key on `boardView`, if the eventual
 * module still ships one, is not rendered here for that reason.
 */

import { esc } from "./m2ui.js";

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const rec = (v: unknown): V => (v !== null && typeof v === "object" ? (v as V) : {});

/* ------------------------------------------------------------- frames -- */

function lobbyFrame(v: V): string {
  const n = num(v["desks"]);
  return `
  <div class="slb slb--hero">
    <p class="slb-eyebrow">MODULE 1 · THE SEASON</p>
    <h1 class="slb-hero">JULY IS OVER.<br>THE SEASON HAS AN OPINION.</h1>
    <p class="slb-hero-sub">${n === 0 ? "Waiting for the room" : `${n} desk${n === 1 ? "" : "s"} back at work`}</p>
  </div>`;
}

/** Counts by role only — the room's own demand evidence, never a seat's position (spec §3 "What the board shows mid-play"). */
function openJobsFrame(v: V): string {
  const rows = arr(v["openJobsByRole"]);
  if (rows.length === 0) {
    return `<div class="slb slb--hero"><h1 class="slb-hero">EVERY JOB IN THE ROOM IS FILLED.</h1><p class="slb-hero-sub">Depth still costs the same room.</p></div>`;
  }
  return `<table class="slb-market"><thead><tr><th>JOB</th><th>OPEN ACROSS THE ROOM</th></tr></thead><tbody>${rows
    .map((r) => `<tr><td class="slb-name">${esc(str(r["role"]))}</td><td class="slb-int"><b>${num(r["count"])}</b></td></tr>`)
    .join("")}</tbody></table>`;
}

function playFrame(v: V, title: string): string {
  const commitsIn = num(v["commitsIn"]);
  const deskCount = num(v["deskCount"]);
  const wallsDrawn = num(v["wallsDrawn"]);
  return `
  <div class="slb">
    <div class="slb-top">
      <div><p class="slb-eyebrow">THE SEASON</p><h1 class="slb-title">${esc(title)}</h1></div>
      <dl class="slb-stats">
        <div><dt>MOVES IN</dt><dd>${commitsIn} <small>of ${deskCount}</small></dd></div>
        <div><dt>WALLS DRAWN</dt><dd>${wallsDrawn}</dd></div>
      </dl>
    </div>
    ${openJobsFrame(v)}
    <p class="slb-foot">Nobody can see anybody else's move. Every window opens at the same moment.</p>
  </div>`;
}

/** Who moved where, once a window settles. Club/desk labels, never students (mirrors sameLineL1Board's `signedFrame`). */
function tickerFrame(v: V, title: string): string {
  const ticker = arr(v["ticker"]);
  if (ticker.length === 0) {
    return `<div class="slb slb--hero"><h1 class="slb-hero">NOBODY MOVED.</h1><p class="slb-hero-sub">The board is unchanged.</p></div>`;
  }
  return `
  <div class="slb">
    <div class="slb-top"><div><p class="slb-eyebrow">THE SEASON</p><h1 class="slb-title">${esc(title)}</h1></div></div>
    <ul class="slb-signed-list">${ticker
      .map(
        (t) => `
      <li class="slb-signed">
        <span class="slb-signed-name">${esc(str(t["name"], str(t["headline"])))}</span>
        <span class="slb-signed-to">${esc(str(t["club"], str(t["label"])))}</span>
        ${t["priceText"] ? `<span class="slb-signed-price">${esc(str(t["priceText"]))}</span>` : ""}
      </li>`,
      )
      .join("")}</ul>
  </div>`;
}

/** THE NAMING — same three-band shape as `sameLineL1Board.ts`'s `namingFrame`. */
function namingFrame(v: V): string {
  const n = v["naming"];
  if (n === null || n === undefined) return "";
  const f = rec(n);
  const count = num(f["count"]);
  const dots = Array.from({ length: count }, (_, i) => `<i class="${i <= num(f["index"]) ? "on" : ""}"></i>`).join("");
  return `
  <div class="slb slb-naming">
    <header class="slb-head">
      <p class="slb-kicker">THE SEASON</p>
      <h1 class="slb-title">WHAT THAT WAS CALLED</h1>
      <span class="slb-naming-dots">${dots}</span>
    </header>
    <section class="slb-naming-body">
      <p class="slb-naming-lab">WHAT HAPPENED HERE</p>
      <p class="slb-naming-moment">${esc(str(f["moment"]))}</p>
      <p class="slb-naming-term">${esc(str(f["term"]))}</p>
      <p class="slb-naming-means">${esc(str(f["means"]))}</p>
      <p class="slb-naming-lab">OUTSIDE BASKETBALL</p>
      <p class="slb-naming-outside">${esc(str(f["outside"]))}</p>
    </section>
  </div>`;
}

export function renderSameLineL2Board(view: Record<string, unknown>, phase: string): { html: string; peak: boolean } {
  const v = view as V;
  switch (phase) {
    case "LOBBY":
    case "HOOK":
      return { html: lobbyFrame(v), peak: false };
    case "PLAY":
      return { html: playFrame(v, "THE TEN-DAY WINDOW"), peak: false };
    case "REVEAL":
      return { html: tickerFrame(v, "WHO SIGNED WHERE"), peak: true };
    case "CONSEQUENCE":
      return { html: playFrame(v, "THE TAX CLOCK"), peak: true };
    case "ADAPT":
      return { html: playFrame(v, "THE BUYOUT WINDOW"), peak: false };
    case "COUNTERFACTUAL":
      return { html: tickerFrame(v, "THE TAPE"), peak: true };
    case "ARGUE":
      return { html: tickerFrame(v, "THE ROOM ARGUES"), peak: true };
    case "SYNTHESIS":
      return { html: namingFrame(v) || tickerFrame(v, "THE SEASON THIS ROOM RAN"), peak: true };
    case "COMPLETE":
      return { html: tickerFrame(v, "THE SEASON THIS ROOM RAN"), peak: true };
    default:
      return { html: lobbyFrame(v), peak: false };
  }
}
