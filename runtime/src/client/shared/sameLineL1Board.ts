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
  /*
   * TWELVE FIT ON A WALL, AND THE REST GET COUNTED OUT LOUD.
   *
   * A market frame that silently drops rows hides the players nobody has bid
   * on, which on a scarcity board are exactly the rows a teacher wants to point
   * at. Twelve is what fits at 1366x768 with type a back row can read
   * (`assertBoardFits` holds that); anything past twelve is named in a line
   * under the table rather than disappearing.
   */
  const SHOWN = 12;
  const hidden = Math.max(0, market.length - SHOWN);
  const rows = market
    .slice(0, SHOWN)
    .map((m) => {
      const n = num(m["interest"]);
      const bar = Array.from({ length: Math.min(n, 8) }, () => `<i></i>`).join("");
      return `
      <tr data-hot="${n >= 3 ? "yes" : n > 0 ? "some" : "no"}">
        <td class="slb-name">${esc(str(m["name"]))}</td>
        <td class="slb-role">${esc(str(m["role"]))}</td>
        <td class="slb-age">${num(m["age"]) > 0 ? num(m["age"]) : "—"}</td>
        <td class="slb-stat">${esc(str(m["statText"], "—"))}</td>
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
    <div class="slb-market-wrap">
    <table class="slb-market">
      <thead><tr><th>PLAYER</th><th>JOB</th><th>AGE</th><th>PTS A GAME</th><th>ASKING</th><th>DESKS ON HIM</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <p class="slb-foot">${
      hidden > 0 ? `<b>${hidden} more ${hidden === 1 ? "player is" : "players are"} still on the board below these.</b> ` : ""
    }Nobody can see anybody else's offer. Every club's is opened at the same moment. Points are last completed season, per game.</p>
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
      ${
        /* A veteran-minimum deal settles at the CHARGE, which is smaller than
           the ask this room read off the board. Unlabelled it looks like a desk
           talked him down, or like the board lied. */
        str(sg["chargeNote"]) ? `<span class="slb-signed-note">${esc(str(sg["chargeNote"]))}</span>` : ""
      }
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

/**
 * BEAT 1. One player, the clubs that chased him, and what each of them actually
 * paid — where "paid" includes the people the winner can no longer have.
 *
 * This shipped as its own title over an empty wall, which is the worst thing a
 * projector can do at the peak of a lesson: it made the module's thesis look
 * like a slogan. The frozen forgone list is the evidence, it has always been in
 * state, and it belongs on the wall next to the man it was spent on.
 */
function samePlayerFrame(v: V, beat: number, of: number): string {
  const sp = v["samePlayer"] as V | null | undefined;
  if (!sp) {
    return `<div class="slb slb--hero">
      <p class="slb-eyebrow">REVEAL · ${beat + 1} OF ${of}</p>
      <h1 class="slb-hero slb-hero--beat">NOBODY IN THIS ROOM WANTED THE SAME MAN.</h1>
      <p class="slb-hero-sub">Every club shopped in a different aisle. That is a result too — ask them why.</p>
    </div>`;
  }
  const chasers = arr(sp["chasers"]);
  return `
  <div class="slb">
    <div class="slb-top">
      <div>
        <p class="slb-eyebrow">REVEAL · ${beat + 1} OF ${of} · ${chasers.length} CLUBS WERE IN ON HIM</p>
        <h1 class="slb-title">${esc(str(sp["player"]))}</h1>
      </div>
      <p class="slb-top-note">${esc(str(sp["role"]))} · ASKING ${esc(str(sp["askText"]))}</p>
    </div>
    <div class="slb-cost">
      ${chasers
        .map(
          (c) => `
        <div class="slb-cost-col" data-won="${c["won"] === true ? "yes" : "no"}">
          <p class="slb-cost-club">${esc(str(c["club"]))}</p>
          <p class="slb-cost-out">${esc(str(c["outcome"]))}</p>
          ${
            /*
             * Three cases, not two.
             *
             * The winner who forwent NOTHING was falling into the same branch
             * as the winner who forwent five people, and rendering the words
             * AND GAVE UP over an empty list — the peak frame of the lesson
             * printing a label with no evidence under it. It is also the most
             * interesting of the three: a club that got its man and gave up
             * nothing is a club nobody else could outbid, and that is the
             * question to put to the room.
             */
            arr(c["lost"]).length > 0
              ? `<p class="slb-cost-lab">AND GAVE UP</p>
                 <ul class="slb-cost-list">${(c["lost"] as string[] | undefined ?? [])
                   .map((n) => `<li>${esc(String(n))}</li>`)
                   .join("")}</ul>${
                   num(c["lostMore"]) > 0
                     ? `<p class="slb-cost-more">and ${num(c["lostMore"])} more</p>`
                     : ""
                 }`
              : c["won"] === true
                ? `<p class="slb-cost-none">Gave up nobody. Nothing else on the board was in reach that day.</p>`
                : `<p class="slb-cost-none">Kept its money. Lost the day.</p>`
          }
        </div>`,
        )
        .join("")}
    </div>
    <p class="slb-foot">${esc(str(sp["foot"]))}</p>
  </div>`;
}

/**
 * BEAT 2. The two desks that hold the same club, opened side by side.
 *
 * The only controlled experiment in the module: identical opening books,
 * identical board, identical morning. Every difference below the first line was
 * put there by somebody in this room.
 */
function twoBooksFrame(v: V, beat: number, of: number): string {
  const tb = v["twoBooks"] as V | null | undefined;
  if (!tb) {
    return `<div class="slb slb--hero">
      <p class="slb-eyebrow">REVEAL · ${beat + 1} OF ${of}</p>
      <h1 class="slb-hero slb-hero--beat">THE TWIN DESKS DID THE SAME THING.</h1>
      <p class="slb-hero-sub">Same club, same board, same answer. Ask them whether that was the only answer.</p>
    </div>`;
  }
  const col = (side: V, tag: string): string => `
    <div class="slb-book">
      <p class="slb-book-tag">${esc(tag)}</p>
      ${
        arr(side["signings"]).length === 0
          ? `<p class="slb-book-none">SIGNED NOBODY</p>`
          : `<ul class="slb-book-list">${arr(side["signings"])
              .map(
                (sg) =>
                  `<li><span>${esc(str(sg["name"]))}</span><b>${esc(str(sg["priceText"]))}</b></li>`,
              )
              .join("")}</ul>`
      }
      <dl class="slb-book-foot">
        <div><dt>COMMITTED</dt><dd>${esc(str(side["committedText"]))}</dd></div>
        <div><dt>HOLES</dt><dd>${esc(str(side["openText"]))}</dd></div>
        <div><dt>WALL</dt><dd>${esc(str(side["wallText"]))}</dd></div>
      </dl>
    </div>`;
  return `
  <div class="slb">
    <div class="slb-top">
      <div>
        <p class="slb-eyebrow">REVEAL · ${beat + 1} OF ${of} · BOTH DESKS OPENED AT ${esc(str(tb["openingText"]))}</p>
        <h1 class="slb-title">${esc(str(tb["club"]))}, TWICE</h1>
      </div>
    </div>
    <div class="slb-books">
      ${col(v0(tb["a"]), "DESK A")}
      ${col(v0(tb["b"]), "DESK B")}
    </div>
    <p class="slb-foot">${esc(str(tb["foot"]))}</p>
  </div>`;
}

const v0 = (x: unknown): V => (x && typeof x === "object" ? (x as V) : {});

function beatFrame(v: V): string {
  const beat = num(v["beat"]);
  const of = arr(v["beats"]).length;
  if (beat === 0) return signedFrame(v, "WHO SIGNED WHERE");
  if (beat === 1) return samePlayerFrame(v, beat, of);
  if (beat === 2) return twoBooksFrame(v, beat, of);
  return disagreeFrame(v);
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
