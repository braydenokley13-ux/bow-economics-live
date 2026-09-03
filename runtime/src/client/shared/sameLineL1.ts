/**
 * THE SAME LINE — L1, the student surface.
 *
 * Renders `m1l1-the-window`'s student view inside the front-office shell. Every
 * number on this screen was computed by the module and arrived in the payload;
 * this file formats and never derives. That is not a style preference — the
 * economic contract is only defensible if the thing the student reads is the
 * thing the sweep proved, and a client that computes its own figure can drift
 * from the model silently.
 *
 * Re-render discipline: the payload arrives on a poll, so a naive innerHTML
 * rebuild would yank the price dial out from under a thumb mid-drag. The
 * renderer rebuilds only when the mount key changes — the phase, the day, the
 * membership of the board, or this desk's own committed offer — and patches
 * live counts in place otherwise.
 */

import { esc } from "./m2ui.js";
import { renderHq, observeHqBand, panel, type HqNavItem, type HqShell, type HqTriadCell } from "./hq.js";

type V = Record<string, unknown>;
const rec = (v: unknown): V => (v && typeof v === "object" ? (v as V) : {});
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

export type Submit = (action: { type: string; [key: string]: unknown }) => void;

/* --------------------------------------------------------- local state -- */

let selected: string | null = null;
let tool: string | null = null;
let annual: number | null = null;
let mountKey = "";
/**
 * The signing day the local selection belongs to.
 *
 * When the bell goes, the board is a different board: the player this pair was
 * looking at may be somebody else's now, and the money they had in mind may not
 * reach anybody left. Carrying a selection across that boundary left the pair
 * pointing at a name that no longer existed, and left the composer holding a
 * price for a decision that was over. A new day is a new decision.
 */
let selectionDay = -1;
let error: string | null = null;
let seatRequested = false;

/** Forget everything when a new session or a new desk arrives. */
export function resetSameLineL1(): void {
  selectionDay = -1;
  selected = null;
  tool = null;
  annual = null;
  mountKey = "";
  error = null;
  seatRequested = false;
}

export function sameLineL1Error(message: string | null): void {
  error = message;
}

/* -------------------------------------------------------------- money -- */

/**
 * Dollars, in full.
 *
 * Deliberately not abbreviated to "$14.2M" on the student's own decision. The
 * whole number is the thing that makes a fifth grader stop: the module's own
 * research turned up Minnesota paying its own player $19,310,345 and an
 * outsider exactly $6,064,000, and the digits are why that lands. Millions
 * shorthand appears only where a row would otherwise not fit.
 */
const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
const millions = (n: number): string => `$${(n / 1_000_000).toFixed(1)}M`;

/* --------------------------------------------------------------- side -- */

function capSheet(hq: V): string {
  const lines = arr(hq["lines"]);
  const rows = lines
    .map((l) => {
      const live = l["live"] === true;
      const side = str(l["side"], "under");
      // `space` arrives as a magnitude; `side` carries the sign as a word.
      const space = num(l["space"]);
      /*
       * Which side is the BAD side depends on the kind of line.
       *
       * THE FLOOR is a compulsion — you are required to spend at least that
       * much — so being past it is fine and being under it is the problem.
       * Every other line is a permission, a price, a confiscation or a
       * prohibition, where crossing is what costs you. Colouring by side alone
       * painted a healthy club's floor reading red and told a student they were
       * in trouble for obeying a rule.
       */
      const kind = str(l["kind"]);
      const badSide = kind === "compulsion" ? "under" : "over";
      const tone = side === badSide ? "bad" : "good";
      const word =
        kind === "compulsion"
          ? side === "under"
            ? `${dollars(space)} short of what you must spend`
            : `${dollars(space)} above the least you may spend`
          : side === "under"
            ? `${dollars(space)} of room before this line`
            : `${dollars(space)} past this line`;
      return `
      <div class="hq-line" data-side="${esc(side)}" data-tone="${tone}" data-live="${live ? "yes" : "no"}">
        <span class="hq-line-name">${esc(str(l["label"]))}</span>
        <span class="hq-line-amount">${esc(str(l["amountText"]))}</span>
        ${live ? `<span class="hq-line-does">${esc(str(l["does"]))}</span>` : ""}
        ${live ? `<span class="hq-line-space">${esc(word)}</span>` : ""}
      </div>`;
    })
    .join("");
  return `
    <dl class="hq-payroll">
      <dt>YOUR PAYROLL</dt>
      <dd>${esc(str(hq["payrollText"]))}</dd>
      <p>Every dollar you have already promised, including money owed to players who have left.</p>
    </dl>
    <div class="hq-lines">${rows}</div>`;
}

function needsPanel(hq: V): string {
  const needs = arr(hq["needs"]);
  if (needs.length === 0) {
    return `<p class="hq-needs-empty">Every job on this roster is filled. Anything you sign now is depth — and it still costs you the same room.</p>`;
  }
  return `<div class="hq-needs">${needs
    .map(
      (n, i) => `
    <div class="hq-need">
      <span class="hq-need-rank">${num(n["rank"], i + 1)}</span>
      <span class="hq-need-role">${esc(str(n["role"]))}</span>
      ${i === 0 ? `<span class="hq-need-tag">MOST URGENT</span>` : ""}
    </div>`,
    )
    .join("")}</div>`;
}

function rosterStrip(hq: V): string {
  const slots = rec(hq["slots"]);
  const filled = num(slots["filled"]);
  const max = num(slots["max"], 21);
  const signings = arr(hq["signings"]);
  const inherited = Math.max(0, filled - signings.length);
  const cells: string[] = [];
  for (let i = 0; i < max; i += 1) {
    const state = i < inherited ? "filled" : i < filled ? "signed" : "empty";
    cells.push(`<span class="hq-slot" data-state="${state}"></span>`);
  }
  const open = num(slots["open"]);
  return `
    <div class="hq-slots">${cells.join("")}</div>
    <p class="hq-slot-note">${filled} under contract · ${open} spot${open === 1 ? "" : "s"} left in this window${
      signings.length ? ` · <b style="color:var(--accent-gold)">${signings.length} signed by you</b>` : ""
    }</p>`;
}

function leaguePanel(view: V): string {
  const feed = arr(view["league"]);
  if (feed.length === 0) {
    return panel(
      { title: "OFF THE BOARD", note: "what the room has taken", flush: true },
      `<p class="hq-feed-empty">Nobody has signed anybody yet. The whole board is still there — for now.</p>`,
    );
  }
  const rows = feed
    .slice(0, 8)
    .map(
      (f) => `
    <div class="hq-feed-row">
      <span class="hq-feed-day">DAY ${num(f["day"])}</span>
      <span class="hq-feed-name">${esc(str(f["name"]))}</span>
      <span class="hq-feed-terms">${esc(str(f["annualText"]))}</span>
      <span class="hq-feed-to">to <b>${esc(str(f["club"]))}</b>${
        num(f["contested"]) > 1 ? ` · ${num(f["contested"])} clubs wanted him` : " · nobody else bid"
      }</span>
    </div>`,
    )
    .join("");
  return panel({ title: "OFF THE BOARD", note: "gone for good", flush: true }, `<div class="hq-feed">${rows}</div>`);
}

/* -------------------------------------------------------------- board -- */

function interestCell(n: number): string {
  if (n === 0) {
    return `<div class="sl-interest"><span class="sl-interest-lab">NOBODY YET</span></div>`;
  }
  const dots = Array.from({ length: Math.min(n, 5) }, () => `<span class="sl-interest-dot"></span>`).join("");
  return `
    <div class="sl-interest" data-hot="${n >= 3 ? "yes" : "no"}">
      <span class="sl-interest-dots">${dots}</span>
      <span class="sl-interest-lab">${n} DESK${n === 1 ? "" : "S"} WANT HIM</span>
    </div>`;
}

function boardRow(c: V): string {
  const reach = c["reachable"] === true;
  const id = str(c["id"]);
  return `
  <button type="button" class="sl-row" data-player="${esc(id)}" data-reach="${reach ? "yes" : "no"}"
          aria-pressed="${selected === id ? "true" : "false"}"${reach ? "" : " disabled"}>
    <span class="sl-row-name">${esc(str(c["name"]))}${
      c["yours"] === true ? `<span class="sl-row-yours">YOUR PLAYER</span>` : ""
    }</span>
    <span class="sl-row-ask">${esc(str(c["askText"]))}</span>
    <span class="sl-row-role">${esc(str(c["role"]))}</span>
    <span class="sl-row-asklab">HE IS ASKING</span>
    ${interestCell(num(c["interest"]))}
    ${reach ? "" : `<span class="sl-row-why">${esc(str(c["unreachableReason"]))}</span>`}
  </button>`;
}

/* --------------------------------------------------------- the composer -- */

function composer(card: V, band: string): string {
  const best = rec(card["best"]);
  const tools = arr(card["tools"]);
  const chosen = tools.find((t) => str(t["tool"]) === tool) ?? best;
  const max = num(chosen["max"], num(best["max"]));
  const ask = num(card["ask"]);
  const floor = Math.min(ask, max);
  const lo = Math.min(floor, max);
  const value = annual === null ? Math.min(ask, max) : Math.max(lo, Math.min(max, annual));
  const years = num(chosen["years"], num(best["years"], 1));
  const fill = max > lo ? Math.round(((value - lo) / (max - lo)) * 100) : 100;
  const drawsWall = chosen["drawsWall"] === true;

  const toolButtons =
    tools.length > 1
      ? `<div class="sl-tools" role="group" aria-label="How you pay">${tools
          .map(
            (t) => `
        <button type="button" class="sl-tool" data-tool="${esc(str(t["tool"]))}"
                data-wall="${t["drawsWall"] === true ? "yes" : "no"}"
                aria-pressed="${str(t["tool"]) === str(chosen["tool"]) ? "true" : "false"}">
          ${esc(str(t["label"]))}<small>up to ${esc(str(t["maxText"]))} · ${num(t["years"])} yr${
            num(t["years"]) === 1 ? "" : "s"
          }${t["terminal"] === true ? " · ENDS YOUR WINDOW" : str(t["wallAtText"]) ? ` · wall at ${esc(str(t["wallAtText"]))}` : ""}</small>
        </button>`,
          )
          .join("")}</div>`
      : `<p class="sl-ceiling">You are paying him with <b>${esc(str(chosen["label"], str(best["label"])))}</b>. It is the only way you have that reaches him.</p>`;

  return `
  <div class="sl-compose">
    <div class="sl-compose-top">
      <h3>YOUR OFFER</h3>
      <span class="sl-compose-ask">He is asking ${esc(str(card["askText"]))} a year</span>
    </div>
    ${toolButtons}
    <div class="sl-money">
      <span class="sl-money-read" id="slRead">${dollars(value)}</span>
      <span class="sl-money-per">A YEAR</span>
      <dl class="sl-money-total">
        <dt>${years} YEAR${years === 1 ? "" : "S"}, ALL GUARANTEED</dt>
        <dd id="slTotal">${dollars(value * years)}</dd>
      </dl>
    </div>
    <div class="sl-dial" style="--sl-fill:${fill}%">
      <input type="range" id="slDial" min="${lo}" max="${max}" step="100000" value="${value}"
             aria-label="How much you offer each year"
             aria-valuetext="${dollars(value)} a year for ${years} years">
      <div class="sl-dial-ends"><span>${millions(lo)}</span><span>most you can pay ${millions(max)}</span></div>
    </div>
    ${
      value < ask
        ? `<p class="sl-ceiling">That is <b>${dollars(ask - value)}</b> under what he asked for. Another club may not be under.</p>`
        : `<p class="sl-ceiling">That meets what he asked for. It does not mean you win him.</p>`
    }
    ${
      /*
       * The warning that outranks every other sentence on this screen: after
       * this signing there is nothing left you can legally do. It is shown to
       * BOTH bands — the old wall note was 5-6 only, and 7-8 walking into a
       * dead window unwarned is not "more responsibility", it is a trap — and
       * it replaces the generic wall line rather than stacking with it,
       * because two warnings is one warning.
       */
      str(chosen["lastSigningWarning"], str(best["lastSigningWarning"]))
        ? `<p class="sl-lastsign"><b>THIS IS YOUR LAST SIGNING</b>${esc(
            str(chosen["lastSigningWarning"], str(best["lastSigningWarning"])).replace(/^This is your last signing of the window\.\s*/, " "),
          )}</p>`
        : chosen["terminal"] === true
          ? `<p class="sl-lastsign"><b>THIS IS YOUR LAST SIGNING</b> After it there is nobody left you could legally pay.</p>`
          : drawsWall
            ? `<p class="sl-wallwarn">This draws a wall at ${esc(
                str(chosen["wallAtText"], str(best["wallAtText"])),
              )}. For the rest of the year you may not cross it — not for anybody, no matter what happens.${
                num(chosen["movesLeft"], num(best["movesLeft"], -1)) >= 0
                  ? ` You would still be able to sign ${num(chosen["movesLeft"], num(best["movesLeft"]))} of the people left.`
                  : ""
              }</p>`
            : ""
    }
    <button type="button" class="sl-commit" id="slCommit">PUT THE OFFER IN</button>
    ${error ? `<p class="sl-err">${esc(error)}</p>` : ""}
  </div>`;
}

function playerCard(card: V, band: string): string {
  return `
  <div class="sl-card">
   <div class="sl-card-scroll">
    <div class="sl-card-head">
      <p class="sl-card-role">${esc(str(card["role"]))}${
        card["yours"] === true ? " · YOUR OWN PLAYER" : ""
      }</p>
      <h2 class="sl-card-name">${esc(str(card["name"]))}</h2>
      <div class="sl-card-lines">
        <p class="sl-card-line"><b>HE GIVES</b><span>${esc(str(card["strength"]))}</span></p>
        <p class="sl-card-line sl-card-line--risk"><b>THE RISK</b><span>${esc(str(card["risk"]))}</span></p>
      </div>
    </div>
    ${composer(card, band)}
    ${
      /*
       * The staging note sits BELOW the decision, not above it.
       *
       * Saying out loud that this player really signed elsewhere is required
       * (D49 Q3) — the module must not imply the class is changing history. But
       * it is context, not an input, and measured at 65px it was one of the
       * things pushing PUT THE OFFER IN off a 768px Chromebook. Context goes
       * under the control it contextualises.
       */
      str(card["reallySignedWith"])
        ? `<p class="sl-card-staging">In real life he signed with ${esc(str(card["reallySignedWith"]))}${
            str(card["signedOn"]) ? ` on ${esc(str(card["signedOn"]))}` : ""
          }. In this room he is still on the board, because your class is running the summer again.</p>`
        : ""
    }
   </div>
  </div>`;
}

function committedCard(pending: V, board: V[]): string {
  const card = board.find((c) => str(c["id"]) === str(pending["playerId"]));
  return `
  <div class="sl-committed">
    <p class="sl-committed-lab">YOUR OFFER IS IN</p>
    <h2 class="sl-committed-name">${esc(str(card?.["name"], "your target"))}</h2>
    <p class="sl-committed-terms">${dollars(num(pending["annual"]))} a year</p>
    <p class="sl-committed-note">You can still change it until the day closes. When it closes, every club's offer is opened at once — nobody sees anybody else's until then.</p>
    <button type="button" class="sl-commit" data-mode="replace" id="slChange">CHANGE MY OFFER</button>
    <button type="button" class="sl-pass" id="slPass">TAKE IT BACK AND SIGN NOBODY TODAY</button>
    ${error ? `<p class="sl-err">${esc(error)}</p>` : ""}
  </div>`;
}

/* ------------------------------------------------------------- shell -- */

function shellFor(view: V, main: string, side: string): string {
  const hq = rec(view["hq"]);
  const act = rec(hq["act"]);
  const acts = (Array.isArray(act["rail"]) ? (act["rail"] as unknown[]) : []).map((a) => String(a));
  const openJobs = arr(hq["needs"]).length;
  const nav: HqNavItem[] = [
    { id: "war", label: "War Room", state: "live" },
    { id: "board", label: "The Board", state: "open" },
    { id: "cap", label: "Cap Sheet", state: "open" },
    { id: "roster", label: "Roster", state: "open", count: num(rec(hq["slots"])["filled"]) },
    { id: "league", label: "Around the League", state: "open" },
    { id: "trade", label: "Trade Hub", state: "locked" },
    { id: "board2", label: "Boardroom", state: "locked" },
  ];
  const triad: HqTriadCell[] = [];
  if (typeof view["day"] === "number") {
    /*
     * The window has three signing days, and after the third one settles the
     * module's day counter is 4. The console read "SIGNING DAY 4 / 3" — a
     * number outside its own denominator, on the projector-facing triad, at the
     * exact moment the room is looking hardest. The counter is right; what it
     * needed was to stop counting and say what had happened instead.
     */
    const dayNow = num(view["day"]);
    const ofDays = num(view["ofDays"], 3);
    triad.push(
      dayNow > ofDays
        ? { label: "SIGNING DAY", value: "WINDOW CLOSED", live: true }
        : { label: "SIGNING DAY", value: `${dayNow} / ${ofDays}`, live: true },
    );
  }
  triad.push({ label: "JOBS OPEN", value: String(openJobs), live: openJobs > 0 });
  triad.push({ label: "SPOTS LEFT", value: String(num(rec(hq["slots"])["open"])) });

  const shell: HqShell = {
    eyebrow: `MODULE 1 · ${str(act["label"], "THE OFFSEASON")}`,
    title: str(hq["club"], str(view["club"])),
    sub: str(hq["situation"]),
    clubId: str(hq["club"]).toLowerCase().replace(/\s+/g, "-") || null,
    nav,
    triad,
    acts: acts.length ? acts : ["THE OFFSEASON", "THE SEASON", "THE DEADLINE", "THE BOARDROOM"],
    actIndex: num(act["index"]),
    main,
    side,
  };
  return renderHq(shell);
}

/* ------------------------------------------------------------ phases -- */

/**
 * THE WIRE — the bell, said to this desk.
 *
 * This is the loudest recurring moment in the lesson and it used to happen
 * entirely off-screen: the offer cleared, the row vanished from the board, and
 * the pair worked out from an absence that somebody else had signed the player
 * they wanted. The founder's whole social test is answered here or nowhere.
 *
 * It sits ABOVE the board, before anything else, because it is the reason
 * today's board looks different from yesterday's. LOST is the loud one — gold
 * rule, name in full caps — because that is the sentence the pair will still be
 * arguing about at the end of the lesson.
 */
function wirePanel(view: V): string {
  const wire = view["wire"] ? rec(view["wire"]) : null;
  if (!wire) return "";
  const items = arr(wire["items"]);
  if (items.length === 0) return "";
  return `
  <div class="sl-wire" id="slWire" data-lead="${esc(str(items[0]?.["kind"], "gone"))}">
    <div class="sl-wire-head">
      <span class="sl-wire-tag">THE WIRE</span>
      <span class="sl-wire-day">DAY ${num(wire["day"])} IS SETTLED</span>
    </div>
    ${items
      .map(
        (i) => `
      <div class="sl-wire-item" data-kind="${esc(str(i["kind"]))}">
        <p class="sl-wire-line">${esc(str(i["headline"]))}</p>
        <p class="sl-wire-detail">${esc(str(i["detail"]))}</p>
      </div>`,
      )
      .join("")}
    <button type="button" class="sl-wire-seen" id="slWireSeen">GOT IT</button>
  </div>`;
}

/**
 * THE FLOOR — the bodies nobody competes for.
 *
 * Deliberately not board rows. A board row is scarce and can be taken from you;
 * these three cannot be, they cost the same for every club in the room, and
 * there is no bidding. They are why nobody in this lesson is ever completely
 * stuck, and they were modelled in the engine and rendered nowhere, which meant
 * a desk with no move genuinely had no move.
 */
/**
 * THE FORK — give up the room, take the exception.
 *
 * Offered only to the two seats that have it, and only while it is still
 * theirs. It is the sharpest choice in the lesson and the one that most
 * reliably breaks "cap space is the good outcome": Brooklyn's room is
 * $2,180,704, which reaches nobody, and the exception it can trade the room for
 * is worth six times that.
 *
 * Deliberately not a button among buttons. It is irreversible, it is the only
 * decision on the screen that is not about a person, and it is confirmed —
 * because a ten-year-old fat-fingering it away would be the one mistake in this
 * lesson that is genuinely unrecoverable.
 */
function forkPanel(view: V): string {
  const fork = view["fork"] ? rec(view["fork"]) : null;
  if (!fork) return "";
  return `
  <div class="sl-fork">
    <p class="sl-fork-lab">A CHOICE ABOUT WHAT KIND OF CLUB YOU ARE</p>
    <div class="sl-fork-scale">
      <div class="sl-fork-side" data-have="yes">
        <span class="sl-fork-tag">WHAT YOU HAVE</span>
        <b>${esc(str(fork["roomText"]))}</b>
        <span class="sl-fork-note">of cap room</span>
      </div>
      <span class="sl-fork-or">OR</span>
      <div class="sl-fork-side">
        <span class="sl-fork-tag">WHAT YOU COULD HAVE</span>
        <b>${esc(str(fork["exceptionText"]))}</b>
        <span class="sl-fork-note">the big exception</span>
      </div>
    </div>
    <p class="sl-fork-line">${esc(str(fork["line"]))}</p>
    <p class="sl-fork-warn">${esc(str(fork["warning"]))}</p>
    <button type="button" class="sl-fork-go" id="slFork" data-armed="no">GIVE UP MY CAP ROOM</button>
  </div>`;
}

function floorStrip(view: V): string {
  const floor = arr(view["floor"]);
  if (floor.length === 0) return "";
  const usable = floor.filter((f) => f["reachable"] === true);
  return panel(
    {
      title: "ALWAYS AVAILABLE",
      note: usable.length === 0 ? "out of reach" : `${esc(str(floor[0]?.["askText"]))} each`,
      flush: true,
    },
    `<p class="sl-floor-say">Nobody can take these from you and nobody is bidding against you. They fill a hole; they do not win you anything.</p>
     <div class="sl-floor">${floor
       .map(
         (f) => `
       <button type="button" class="sl-floor-row" data-floor="${esc(str(f["id"]))}"
               ${f["reachable"] === true ? "" : "disabled"}>
         <span class="sl-floor-role">${esc(str(f["role"]))}</span>
         <span class="sl-floor-name">A veteran on a minimum deal${f["fillsAJob"] === true ? " · FILLS A HOLE" : ""}</span>
         <span class="sl-floor-ask">${esc(str(f["askText"]))}</span>
       </button>`,
       )
       .join("")}</div>`,
  );
}

function playMain(view: V): string {
  const board = arr(view["board"]);
  const pending = view["pending"] ? rec(view["pending"]) : null;
  const band = str(view["band"], "5-6");
  const card = selected ? board.find((c) => str(c["id"]) === selected) : undefined;

  const right = pending
    ? committedCard(pending, [...board, ...arr(view["floor"])])
    : card
      ? playerCard(card, band)
      : `<div class="sl-note"><strong>Pick a player.</strong> Everyone on this board is really a free agent this summer, and every other club in this room can see the same names you can. The ones you cannot reach are greyed out, and it says why.</div>`;

  return `
  ${wirePanel(view)}
  <div class="sl-play">
    <div class="sl-left">
      ${panel(
        { title: "THE BOARD", note: `${board.length} still unsigned`, live: str(view["roomLine"]), flush: true },
        `<div class="sl-board">${board.map(boardRow).join("")}</div>`,
      )}
      ${forkPanel(view)}
      ${floorStrip(view)}
    </div>
    <div>${right}</div>
  </div>
  ${leaguePanel(view)}`;
}

function sidePanels(view: V): string {
  const hq = rec(view["hq"]);
  return [
    panel({ title: "CAP SHEET", note: "2026-27", flush: true }, capSheet(hq)),
    panel({ title: "WHAT THIS ROSTER NEEDS" }, needsPanel(hq)),
    panel({ title: "ROSTER" }, rosterStrip(hq)),
  ].join("");
}

function forgonePanel(view: V): string {
  const forgone = arr(view["forgone"]);
  if (forgone.length === 0) return "";
  const items = forgone
    .map((f) => {
      const lost = arr(f["lost"]);
      return `
      <div>
        <p class="sl-forgone-lead">Signing <b style="color:var(--accent-gold)">${esc(str(f["signed"]))}</b> at ${dollars(
          num(f["atPrice"]),
        )} a year cost you these, by name:</p>
        ${lost
          .map(
            (l) => `
          <div class="sl-forgone-item">
            <span class="sl-forgone-x">✕</span>
            <span class="sl-forgone-name">${esc(str(l["name"], String(l)))}</span>
            <span class="sl-forgone-why">${esc(str(l["why"]))}</span>
          </div>`,
          )
          .join("")}
      </div>`;
    })
    .join("");
  return panel({ title: "WHAT IT COST YOU", note: "frozen the moment you committed" }, `<div class="sl-forgone">${items}</div>`);
}


/* ------------------------------------------------------------- reveal -- */

/**
 * The student's own reveal, one beat at a time.
 *
 * Per-beat gating happens in the MODULE, not here: a beat the teacher has not
 * pressed to was never sent, so this renders what arrived rather than deciding
 * what to hide. That ordering is the whole reason a desk cannot read ahead by
 * opening dev tools.
 *
 * The projector carries the class picture; this carries the one thing the
 * projector must never carry — what it cost THIS desk, by name.
 */
function revealMain(v: V): string {
  const beat = num(v["beat"]);
  const parts: string[] = [];

  parts.push(`
    <div class="sl-beat">
      <p class="sl-beat-step">BEAT ${beat + 1} OF 4</p>
      <h2 class="sl-beat-title">${esc(str(v["beatTitle"]))}</h2>
    </div>`);

  const signings = arr(v["yourSignings"]);
  if (v["yourSignings"] !== undefined) {
    parts.push(
      panel(
        { title: "WHAT YOU SIGNED", note: signings.length === 0 ? "nothing" : `${signings.length} deal${signings.length === 1 ? "" : "s"}` },
        signings.length === 0
          ? `<p class="sl-forgone-lead">You did not sign anybody. That is a real answer, and it is the only one that keeps every dollar you started with.</p>`
          : `<div class="sl-forgone">${signings
              .map(
                (sg) => `
              <div class="sl-forgone-item">
                <span class="sl-forgone-name">${esc(str(sg["name"]))}</span>
                <span class="sl-forgone-why">${esc(str(sg["role"]))} · ${num(sg["years"])} yr${num(sg["years"]) === 1 ? "" : "s"}</span>
                <span style="font-family:var(--font-number);color:var(--accent-gold);margin-left:12px;">${dollars(num(sg["annual"]))}</span>
              </div>`,
              )
              .join("")}</div>`,
      ),
    );
  }

  if (v["yourForgone"] !== undefined) parts.push(forgonePanel({ forgone: v["yourForgone"] }));

  if (v["yourRoomLeft"] !== undefined) {
    parts.push(
      panel(
        { title: "WHAT YOU HAVE LEFT", note: "after three days" },
        `<p class="sl-money-read" style="font-size:34px">${dollars(num(v["yourRoomLeft"]))}</p>
         <p class="sl-forgone-lead" style="margin-top:8px">This is the part of the summer you did not spend. It is not left over — it is the next problem you can still solve.</p>`,
      ),
    );
  }

  if (v["yourReadings"] !== undefined) {
    const r = rec(v["yourReadings"]);
    const cheapest = num(r["cheapestJobClosed"]);
    const rows: [string, string, string][] = [
      ["HOLES YOU CLOSED", String(num(r["jobsClosed"])), "of the jobs this club started with open"],
      ["YEARS OF COVER", String(num(r["jobYears"])), "how long those holes stay closed"],
      [
        "CHEAPEST HOLE CLOSED",
        Number.isFinite(cheapest) && cheapest > 0 ? dollars(cheapest) : "—",
        "the least you paid to fix something real",
      ],
      ["LONGEST COMMITMENT", `${num(r["longestCommitment"])} yr`, "how far into the future you are promised"],
      ["ROOM LEFT", dollars(num(r["roomLeft"])), "what you can still do"],
    ];
    parts.push(
      panel(
        { title: "FIVE WAYS TO READ YOUR SUMMER", note: "no total, on purpose" },
        `<div class="sl-readings">${rows
          .map(
            ([k, val, why]) => `
          <div class="sl-reading">
            <dt>${esc(k)}</dt>
            <dd>${esc(val)}</dd>
            <p>${esc(why)}</p>
          </div>`,
          )
          .join("")}</div>
         <p class="sl-forgone-lead" style="margin-top:12px">These do not add up to a score, and that is not a missing feature. A club that is best on one of them is usually worst on another — which is the argument the room is about to have.</p>`,
      ),
    );
  }

  return parts.join("");
}

/* ------------------------------------------------------------ render -- */

export function renderSameLineL1(
  phase: string,
  view: Record<string, unknown>,
  host: HTMLElement,
  submit: Submit,
): void {
  const v = view as V;

  if (v["seated"] === false) {
    // Ask for a desk. The module is idempotent on `takeSeat`, so a retry is not
    // an error — but without this the pair sits on the waiting copy forever and
    // nothing on screen says anything is wrong. Guarded so a poll every second
    // does not turn into a request every second.
    if (v["observer"] !== true && !seatRequested) {
      seatRequested = true;
      submit({ type: "takeSeat" });
    }
    host.innerHTML = `<div class="sl-note" style="margin:24px;">${
      str(v["observerEyebrow"]) ? `<strong>${esc(str(v["observerEyebrow"]))}</strong>` : ""
    }<p style="margin:8px 0 0">${esc(str(v["message"], "You're in. Finding your club…"))}</p>${
      str(v["observerAction"]) ? `<p style="margin:8px 0 0">${esc(str(v["observerAction"]))}</p>` : ""
    }</div>`;
    mountKey = "";
    return;
  }

  /*
   * A NEW DAY IS A NEW DECISION.
   *
   * When the bell goes the board is a different board: the player this pair was
   * looking at may belong to somebody else now, and the price they had in mind
   * may not reach anybody left. Carrying the selection across that boundary
   * left the composer holding a decision that was already over, and left a
   * click landing on a row that the very next patch replaced. Cleared before
   * anything is rendered, so the render key and the markup agree.
   */
  const day = num(v["day"], -1);
  if (day !== selectionDay) {
    selectionDay = day;
    selected = null;
    tool = null;
    annual = null;
    error = null;
  }

  let main: string;
  switch (phase) {
    case "PLAY":
      main = playMain(v);
      break;
    case "REVEAL":
    case "CONSEQUENCE":
      main = revealMain(v);
      break;
    case "SYNTHESIS":
    case "COMPLETE":
      main = forgonePanel(v) || `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`;
      break;
    default:
      main = `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`;
  }

  // Mount key: the things whose change must rebuild the DOM. The price dial is
  // deliberately NOT in it, so a poll landing mid-drag does not move the thumb.
  const board = arr(v["board"]);
  const key = [
    phase,
    num(v["day"]),
    board.map((c) => str(c["id"])).join(","),
    v["pending"] ? str(rec(v["pending"])["playerId"]) : "-",
    num(v["beat"], -1),
    v["wire"] ? String(num(rec(v["wire"])["day"])) : "-",
    v["fork"] ? "fork" : "-",
    selected ?? "-",
    tool ?? "-",
    error ?? "-",
  ].join("|");

  if (key !== mountKey) {
    host.innerHTML = shellFor(v, main, sidePanels(v));
    mountKey = key;
    observeHqBand(host);
    bind(host, v, submit);
  } else {
    patchLive(host, v);
  }
}

/** Numbers that move without a rebuild: the room's interest and the day line. */
function patchLive(host: HTMLElement, v: V): void {
  const live = host.querySelector(".hq-panel-note--live");
  if (live) live.textContent = str(v["roomLine"]);
  for (const c of arr(v["board"])) {
    const row = host.querySelector(`.sl-row[data-player="${CSS.escape(str(c["id"]))}"]`);
    const cell = row?.querySelector(".sl-interest");
    if (!cell) continue;
    const n = num(c["interest"]);
    const next = interestCell(n);
    if (cell.outerHTML !== next) cell.outerHTML = next;
  }
}

function bind(host: HTMLElement, v: V, submit: Submit): void {
  const band = str(v["band"], "5-6");
  const board = arr(v["board"]);

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl-row[data-reach='yes']"))) {
    el.addEventListener("click", () => {
      const id = el.dataset["player"] ?? null;
      selected = selected === id ? null : id;
      tool = null;
      annual = null;
      error = null;
      mountKey = "";
      renderSameLineL1(str(v["phase"], "PLAY"), v, host, submit);
    });
  }

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl-tool"))) {
    el.addEventListener("click", () => {
      tool = el.dataset["tool"] ?? null;
      annual = null;
      mountKey = "";
      renderSameLineL1("PLAY", v, host, submit);
    });
  }

  const dial = host.querySelector<HTMLInputElement>("#slDial");
  const read = host.querySelector<HTMLElement>("#slRead");
  const total = host.querySelector<HTMLElement>("#slTotal");
  if (dial) {
    const card = board.find((c) => str(c["id"]) === selected);
    const best = rec(card?.["best"]);
    const tools = arr(card?.["tools"]);
    const chosen = tools.find((t) => str(t["tool"]) === tool) ?? best;
    const years = num(chosen["years"], 1);
    dial.addEventListener("input", () => {
      annual = Number(dial.value);
      if (read) read.textContent = dollars(annual);
      if (total) total.textContent = dollars(annual * years);
      const lo = Number(dial.min);
      const hi = Number(dial.max);
      const fill = hi > lo ? Math.round(((annual - lo) / (hi - lo)) * 100) : 100;
      dial.parentElement?.style.setProperty("--sl-fill", `${fill}%`);
      dial.setAttribute("aria-valuetext", `${dollars(annual)} a year for ${years} years`);
    });
  }

  host.querySelector("#slCommit")?.addEventListener("click", () => {
    const card = board.find((c) => str(c["id"]) === selected);
    if (!card) return;
    const best = rec(card["best"]);
    const tools = arr(card["tools"]);
    const chosen = tools.find((t) => str(t["tool"]) === tool) ?? best;
    const max = num(chosen["max"]);
    const value = annual === null ? Math.min(num(card["ask"]), max) : annual;
    error = null;
    submit({ type: "offer", playerId: selected, tool: str(chosen["tool"]), annual: value });
  });

  /* The floor. One click signs a minimum body: there is no price to set and
     nobody to outbid, which is the whole point of it. */
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl-floor-row:not([disabled])"))) {
    el.addEventListener("click", () => {
      const id = el.dataset["floor"];
      const row = arr(v["floor"]).find((f) => str(f["id"]) === id);
      if (!id || !row) return;
      error = null;
      submit({ type: "offer", playerId: id, tool: "minimum", annual: num(row["ask"]) });
    });
  }

  /* Two presses, because it cannot be undone. The first press changes the
     button into the sentence it is actually asking. */
  const forkBtn = host.querySelector<HTMLButtonElement>("#slFork");
  forkBtn?.addEventListener("click", () => {
    if (forkBtn.dataset["armed"] !== "yes") {
      forkBtn.dataset["armed"] = "yes";
      forkBtn.textContent = "YES — GIVE IT UP. I CANNOT TAKE THIS BACK.";
      return;
    }
    error = null;
    submit({ type: "declareOverCap" });
  });

  /* The wire is dismissed locally: it is news, not state, and asking the server
     to remember that a pair has read a sentence would put a round trip between
     them and their next decision. It comes back on the next bell because the
     next bell is different news. */
  host.querySelector("#slWireSeen")?.addEventListener("click", () => {
    host.querySelector("#slWire")?.remove();
  });

  host.querySelector("#slChange")?.addEventListener("click", () => {
    const pending = rec(v["pending"]);
    selected = str(pending["playerId"]);
    tool = str(pending["tool"]);
    annual = num(pending["annual"]);
    error = null;
    submit({ type: "pass" });
  });

  host.querySelector("#slPass")?.addEventListener("click", () => {
    selected = null;
    tool = null;
    annual = null;
    error = null;
    submit({ type: "pass" });
  });

  void band;
}
