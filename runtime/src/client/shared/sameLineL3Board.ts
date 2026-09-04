/**
 * THE SAME LINE — L3 "THE DEADLINE" (`m1l3-the-deadline`), the projector.
 *
 * Built against the REAL `boardView` in `runtime/src/modules/sameLine/l3.ts`
 * (unlike `sameLineL2Board.ts`, which was written against a guessed shape).
 * Field names below — `hour`, `marketClosed`, `market.{contractsOnMarket,
 * picksOnMarket,objects}`, `executedBroadcast`, `seasonSettle` — are copied
 * verbatim. `boardView` is structurally never handed a seat identity (spec
 * §7, BOW test #19) and this file never reads or renders one: `market.
 * objects[].holderLabel` is a club/desk LABEL, never a seat id, and nothing
 * here prints a price, a package term, or a refusal — only names, counts,
 * and the already-executed broadcast the reducer itself decided to publish.
 *
 * RECONCILED 2026-09-04: `boardView` now carries `reachBlocked` (ONE
 * integer, summed room-wide by the reducer — an Economic Truth ruling
 * against ever showing it per desk on a public surface) and `naming
 * {index,count,term,moment,means,outside} | null`. `namingFrame` still reads
 * defensively (a `real` field is rendered if a follow-up ever adds one) and
 * still falls back to the executed-deal ticker when `naming` is null.
 *
 * THE PODIUM is not this file's job — see the header note on
 * `sameLineL2Board.ts`; the same applies here verbatim.
 */

import { esc } from "./m2ui.js";

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const rec = (v: unknown): V => (v !== null && typeof v === "object" ? (v as V) : {});
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/* ------------------------------------------------------------- frames -- */

function lobbyFrame(): { html: string; peak: boolean } {
  return {
    html: `
  <div class="slb slb--hero">
    <p class="slb-eyebrow">MODULE 1 · THE DEADLINE</p>
    <h1 class="slb-hero">THE PHONES ARE ABOUT TO LIGHT UP.</h1>
    <p class="slb-hero-sub">Same books on day one. Different rooms are about to answer them.</p>
  </div>`,
    peak: false,
  };
}

function hookFrame(): { html: string; peak: boolean } {
  return {
    html: `
  <div class="slb slb--hero">
    <p class="slb-eyebrow">THE DEADLINE BRIEF</p>
    <h1 class="slb-hero">TWO HOURS ON THE CLOCK.</h1>
    <p class="slb-hero-sub">Boston — Chicago, Feb 5, 2026: one trade filled a hole AND cut a $22M tax bill.</p>
  </div>`,
    peak: false,
  };
}

function marketFrame(v: V): { html: string; peak: boolean } {
  const hour = num(v["hour"]);
  const marketClosed = Boolean(v["marketClosed"]);
  const market = rec(v["market"]);
  const objects = arr(market["objects"]);
  const rows = objects.length
    ? `<table class="slb-market"><thead><tr><th>ON THE MARKET</th><th>HELD BY</th><th>DESKS TALKING</th></tr></thead><tbody>${objects
        .map(
          (o) => `<tr><td class="slb-name">${esc(str(o["name"]))}</td><td>${esc(str(o["holderLabel"]))}</td><td class="slb-int"><b>${num(
            o["interestCount"],
          )}</b></td></tr>`,
        )
        .join("")}</tbody></table>`
    : `<p class="slb-hero-sub">Nothing listed yet.</p>`;
  return {
    html: `
  <div class="slb">
    <div class="slb-top">
      <div><p class="slb-eyebrow">THE DEADLINE</p><h1 class="slb-title">${marketClosed ? "DEADLINE PASSED" : `HOUR ${hour} OF 2`}</h1></div>
      <dl class="slb-stats">
        <div><dt>CONTRACTS ON THE MARKET</dt><dd>${num(market["contractsOnMarket"])}</dd></div>
        <div><dt>PICKS ON THE MARKET</dt><dd>${num(market["picksOnMarket"])}</dd></div>
      </dl>
    </div>
    ${rows}
    ${num(v["reachBlocked"]) > 0 ? `<p class="slb-hero-sub">${num(v["reachBlocked"])} reach${num(v["reachBlocked"]) === 1 ? "" : "es"} across the room are blocked by the bars right now.</p>` : ""}
  </div>`,
    peak: false,
  };
}

function executedFrame(v: V, title: string): { html: string; peak: boolean } {
  const executed = arr(v["executedBroadcast"]);
  if (executed.length === 0) {
    return {
      html: `<div class="slb slb--hero"><h1 class="slb-hero">NOBODY HAS TRADED YET.</h1><p class="slb-hero-sub">Standing pat is a real strategy — it has to be defended too.</p></div>`,
      peak: true,
    };
  }
  return {
    html: `
  <div class="slb">
    <div class="slb-top"><div><p class="slb-eyebrow">THE DEADLINE</p><h1 class="slb-title">${esc(title)}</h1></div></div>
    <ul class="slb-signed-list">${executed
      .map(
        (d) => `
      <li class="slb-signed">
        <span class="slb-signed-name">${esc(str(d["fromLabel"]))} sent ${strArr(d["sent"]).map((n) => esc(n)).join(", ")}</span>
        <span class="slb-signed-to">to ${esc(str(d["toLabel"]))} for ${strArr(d["got"]).map((n) => esc(n)).join(", ")}</span>
      </li>`,
      )
      .join("")}</ul>
  </div>`,
    peak: true,
  };
}

function settleFrame(v: V): { html: string; peak: boolean } {
  const settle = v["seasonSettle"];
  if (!Array.isArray(settle) || settle.length === 0) {
    return executedFrame(v, "WHAT HAPPENED AT THE DEADLINE");
  }
  const rows = (settle as V[])
    .map(
      (s) =>
        `<tr><td class="slb-name">${esc(str(s["label"]))}</td><td class="slb-int"><b>${num(s["coveredJobs"])}</b></td><td class="slb-int">${num(
          s["openJobs"],
        )}</td></tr>`,
    )
    .join("");
  return {
    html: `
  <div class="slb">
    <div class="slb-top"><div><p class="slb-eyebrow">THE SEASON SETTLES</p><h1 class="slb-title">JOBS COVERED, NOT SCORES</h1></div></div>
    <table class="slb-market"><thead><tr><th>DESK</th><th>JOBS COVERED</th><th>JOBS STILL OPEN</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`,
    peak: true,
  };
}

/** Naming has no field on this build's `boardView` — see the file header. Falls back to the executed ticker exactly like `sameLineL2Board.ts` does. */
function namingFrame(v: V): { html: string; peak: boolean } | null {
  const n = v["naming"];
  if (n === null || n === undefined) return null;
  const f = rec(n);
  const count = num(f["count"]);
  const dots = Array.from({ length: count }, (_, i) => `<i class="${i <= num(f["index"]) ? "on" : ""}"></i>`).join("");
  return {
    html: `
  <div class="slb slb-naming">
    <header class="slb-head">
      <p class="slb-kicker">THE DEADLINE</p>
      <h1 class="slb-title">WHAT THAT WAS CALLED</h1>
      <span class="slb-naming-dots">${dots}</span>
    </header>
    <section class="slb-naming-body">
      <p class="slb-naming-lab">WHAT HAPPENED HERE</p>
      <p class="slb-naming-moment">${esc(str(f["moment"]))}</p>
      <p class="slb-naming-term">${esc(str(f["term"]))}</p>
      <p class="slb-naming-means">${esc(str(f["means"]))}</p>
      ${f["real"] ? `<p class="slb-naming-means">${esc(str(f["real"]))}</p>` : ""}
      <p class="slb-naming-lab">OUTSIDE BASKETBALL</p>
      <p class="slb-naming-outside">${esc(str(f["outside"]))}</p>
    </section>
  </div>`,
    peak: true,
  };
}

export function renderSameLineL3Board(view: Record<string, unknown>, phase: string): { html: string; peak: boolean } {
  const v = view as V;
  switch (phase) {
    case "LOBBY":
      return lobbyFrame();
    case "HOOK":
      return hookFrame();
    case "PLAY":
      return marketFrame(v);
    case "REVEAL":
      return executedFrame(v, "THE DEADLINE PASSED");
    case "CONSEQUENCE":
      return settleFrame(v);
    case "COUNTERFACTUAL":
    case "ARGUE":
      return {
        html: `<div class="slb slb--hero"><h1 class="slb-hero">THE ROOM ARGUES.</h1><p class="slb-hero-sub">Same books on day one — different rooms answered them.</p></div>`,
        peak: true,
      };
    case "SYNTHESIS":
    case "COMPLETE":
      return namingFrame(v) ?? executedFrame(v, "THE DEADLINE THIS ROOM RAN");
    default:
      return lobbyFrame();
  }
}
