/**
 * THE SAME LINE — L1, the projector.
 *
 * The student's screen is MY FRANCHISE. This one is THE LEAGUE: what the room
 * as a whole is doing, and what the room disagrees about.
 *
 * The one hard rule here is structural rather than editorial — `boardView` is
 * never handed a seat identity, so nothing on this surface can be traced to a
 * child even by a reader who knows where everyone is sitting. During an open
 * day that means counts and never clubs; after a day settles, a signing is
 * public and is shown by CLUB, never by student name.
 *
 * A projector cannot scroll and cannot be leaned toward, so every frame here
 * must FIT and must be readable from the back row.
 */

import { esc } from "./m2ui.js";

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

/* ------------------------------------------------------------- frames -- */

function lobbyFrame(v: V): string {
  const n = num(v["desks"]);
  return `
  <div class="slb slb--hero">
    <p class="slb-eyebrow">MODULE 1 · THE OFFSEASON</p>
    <h1 class="slb-hero">ONE SUMMER.<br>ONE BOARD.<br>EVERY CLUB IN THIS ROOM.</h1>
    <p class="slb-hero-sub">${n === 0 ? "Waiting for the room" : `${n} front ${n === 1 ? "office is" : "offices are"} in`}</p>
  </div>`;
}

/**
 * The live market.
 *
 * The interest column is the whole point of putting this on a wall: a class can
 * watch demand concentrate on one man in real time. It is a count of desks, and
 * the moment it became anything else it would be a seat's private position on a
 * projector.
 */
function playFrame(v: V): string {
  const market = arr(v["market"]);
  const hot = market.filter((m) => num(m["interest"]) > 0).length;
  const rows = market
    .slice(0, 10)
    .map((m) => {
      const n = num(m["interest"]);
      const bar = Array.from({ length: Math.min(n, 8) }, () => `<i></i>`).join("");
      return `
      <tr data-hot="${n >= 3 ? "yes" : n > 0 ? "some" : "no"}">
        <td class="slb-name">${esc(str(m["name"]))}</td>
        <td class="slb-role">${esc(str(m["role"]))}</td>
        <td class="slb-ask">${esc(str(m["askText"]))}</td>
        <td class="slb-int"><span class="slb-dots">${bar}</span><b>${n === 0 ? "—" : n}</b></td>
      </tr>`;
    })
    .join("");
  return `
  <div class="slb">
    <div class="slb-top">
      <div>
        <p class="slb-eyebrow">THE OFFSEASON · SIGNING DAY ${num(v["day"])} OF ${num(v["ofDays"], 3)}</p>
        <h1 class="slb-title">THE BOARD</h1>
      </div>
      <dl class="slb-stats">
        <div><dt>STILL UNSIGNED</dt><dd>${num(v["remaining"])}</dd></div>
        <div><dt>OFFERS IN</dt><dd>${num(v["offersIn"])} <small>of ${num(v["desks"])}</small></dd></div>
        <div><dt>BEING CHASED</dt><dd>${hot}</dd></div>
      </dl>
    </div>
    <table class="slb-market">
      <thead><tr><th>PLAYER</th><th>JOB</th><th>ASKING</th><th>DESKS ON HIM</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="slb-foot">Nobody can see anybody else's offer. Every club's is opened at the same moment.</p>
  </div>`;
}

/** Who signed where. Public the instant a day settles; club names, never students. */
function signedFrame(v: V, title: string): string {
  const signed = arr(v["signed"]);
  if (signed.length === 0) {
    return `<div class="slb slb--hero"><h1 class="slb-hero">NOBODY SIGNED.</h1><p class="slb-hero-sub">The whole board is still there.</p></div>`;
  }
  const cards = signed
    .map(
      (sg) => `
    <li class="slb-signed">
      <span class="slb-signed-name">${esc(str(sg["player"]))}</span>
      <span class="slb-signed-to">${esc(str(sg["club"]))}</span>
      <span class="slb-signed-price">${esc(str(sg["priceText"]))}</span>
    </li>`,
    )
    .join("");
  return `
  <div class="slb">
    <div class="slb-top"><div><p class="slb-eyebrow">THE OFFSEASON</p><h1 class="slb-title">${esc(title)}</h1></div></div>
    <ul class="slb-signed-list">${cards}</ul>
  </div>`;
}

/**
 * THE ROOM DISAGREES.
 *
 * The slot where the founder's mockup put a live ranked "who's winning". No
 * ranking: every line is a computed split, no desk sits above another, and each
 * one is an argument the teacher can open immediately. Written by the module as
 * claim atoms; this renders the short form.
 */
function disagreeFrame(v: V): string {
  const items = arr(v["disagreements"]);
  if (items.length === 0) {
    return `<div class="slb slb--hero"><h1 class="slb-hero">THE ROOM AGREES SO FAR.</h1><p class="slb-hero-sub">Give it a day.</p></div>`;
  }
  return `
  <div class="slb">
    <div class="slb-top"><div><p class="slb-eyebrow">WHAT THIS ROOM DOES NOT AGREE ON</p><h1 class="slb-title">THE ROOM DISAGREES</h1></div></div>
    <ul class="slb-disagree">
      ${items.map((d) => `<li>${esc(str(d["board"], str(d["text"])))}</li>`).join("")}
    </ul>
    <p class="slb-foot">There is no winner on this screen. There are different bets.</p>
  </div>`;
}

function beatFrame(v: V): string {
  const title = str(v["beatTitle"]);
  const beat = num(v["beat"]);
  if (beat === 0) return signedFrame(v, "WHO SIGNED WHERE");
  if (beat === 3) return disagreeFrame(v);
  return `
  <div class="slb slb--hero">
    <p class="slb-eyebrow">REVEAL · ${beat + 1} OF ${arr(v["beats"]).length}</p>
    <h1 class="slb-hero slb-hero--beat">${esc(title)}</h1>
  </div>`;
}

/* ------------------------------------------------------------- render -- */

export function renderSameLineL1Board(view: Record<string, unknown>, phase: string): { html: string; peak: boolean } {
  const v = view as V;
  switch (phase) {
    case "LOBBY":
    case "HOOK":
      return { html: lobbyFrame(v), peak: false };
    case "PLAY":
      return { html: playFrame(v), peak: false };
    case "REVEAL":
    case "CONSEQUENCE":
      return { html: beatFrame(v), peak: true };
    case "SYNTHESIS":
      return { html: disagreeFrame(v), peak: true };
    case "COMPLETE":
      return { html: signedFrame(v, "THE SUMMER THIS ROOM RAN"), peak: true };
    default:
      return { html: lobbyFrame(v), peak: false };
  }
}
