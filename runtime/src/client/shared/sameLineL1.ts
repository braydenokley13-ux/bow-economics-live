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
let term: number | null = null;
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
  term = null;
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
    <span class="sl-row-role">${esc(str(c["role"]))}</span>
    ${
      /* PRODUCTION SITS LEFT OF PRICE, in the same row, unclicked.
         Four of these rows are cheaper than a row above them and better than
         it. That is the argument the whole board is for, and it is only an
         argument if a student can see both numbers without opening anything. */
      str(c["rowStat"])
        ? `<span class="sl-row-stat">${esc(str(c["rowStat"]))}</span>
           <span class="sl-row-statlab">A GAME</span>`
        : ""
    }
    <span class="sl-row-ask">${esc(str(c["askText"]))}</span>
    <span class="sl-row-asklab">HE IS ASKING</span>
    ${interestCell(num(c["interest"]))}
    ${reach ? "" : `<span class="sl-row-why">${esc(str(c["unreachableReason"]))}</span>`}
  </button>`;
}

/* --------------------------------------------------------- the composer -- */

/**
 * THE NUMBERS THE OFFER IS MADE OF.
 *
 * Extracted because the same arithmetic now feeds two places that no longer
 * sit together: the machinery that scrolls (which tool, how many years) and
 * the bar that never scrolls (the money, the dial, the button). Two copies of
 * this would be two chances for the bar to disagree with the composer about
 * what is being offered, and the bar is what the pair presses.
 */
function offerMath(card: V) {
  const best = rec(card["best"]);
  const tools = arr(card["tools"]);
  const chosen = tools.find((t) => str(t["tool"]) === tool) ?? best;
  const max = num(chosen["max"], num(best["max"]));
  const ask = num(card["ask"]);
  const lo = Math.min(ask, max);
  const value = annual === null ? Math.min(ask, max) : Math.max(lo, Math.min(max, annual));
  const maxYears = num(chosen["maxYears"], num(chosen["years"], num(best["years"], 1)));
  const choosesTerm = card["choosesTerm"] === true && maxYears > 1;
  const years = choosesTerm
    ? Math.max(1, Math.min(maxYears, term ?? maxYears))
    : num(chosen["years"], num(best["years"], 1));
  const fill = max > lo ? Math.round(((value - lo) / (max - lo)) * 100) : 100;
  return { best, tools, chosen, max, ask, lo, value, maxYears, choosesTerm, years, fill, drawsWall: chosen["drawsWall"] === true };
}

function composer(card: V, band: string): string {
  const { best, tools, chosen, ask, value, maxYears, choosesTerm, years, drawsWall } = offerMath(card);

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
      : (() => {
          /*
           * "The only way you have that reaches him" is TRUE only when it is.
           * At 5-6 no tool buttons are rendered at all, so this branch ran on
           * every card in the band and asserted single-option where there were
           * four. The module now sends the real count.
           */
          const label = esc(str(chosen["label"], str(best["label"])));
          const others = Math.max(0, num(card["toolCount"], 1) - 1);
          return others === 0
            ? `<p class="sl-ceiling">You are paying him with <b>${label}</b>. It is the only way you have that reaches him.</p>`
            : `<p class="sl-ceiling">You are paying him with <b>${label}</b> — the biggest offer you can make him. You have ${others} other way${
                others === 1 ? "" : "s"
              } to pay him, and ${others === 1 ? "it is" : "they are all"} smaller.</p>`;
        })();

  return `
  <div class="sl-compose">
    <div class="sl-compose-top">
      <h3>YOUR OFFER</h3>
      <span class="sl-compose-ask">He is asking ${esc(str(card["askText"]))} a year${
        /*
         * Both notes hang off the ask because both explain THAT number: one
         * says the figure is an average of a real multi-year deal, the other
         * says only part of it will be charged to you.
         *
         * THE MINIMUM NOTE IS GATED ON THE SELECTED TOOL, and it has to be.
         * Ungated it printed "only $2,449,421 of that counts against your
         * money" directly above an offer of $4,300,000 made with the small
         * exception — two contradictory numbers a hand's width apart, which is
         * worse than the silence it was written to fix. The charge is a fact
         * about the MINIMUM DEAL, not about the player, so it appears exactly
         * when that is the deal on the table.
         */
        str(chosen["tool"], str(best["tool"])) === "minimum" && str(card["minimumNote"])
          ? ` <em class="sl-compose-note">${esc(str(card["minimumNote"]))}</em>`
          : ""
      }${
        str(card["askNote"]) ? ` <em class="sl-compose-note">${esc(str(card["askNote"]))}</em>` : ""
      }</span>
    </div>
    ${toolButtons}
    ${
      /*
       * THE TERM, as a control rather than a fact about the tool.
       *
       * Years used to come with the tool, which made them free: a longer tool
       * outvalued a shorter one at every price, so the tool decided every
       * contest and the number the pair typed decided almost nothing. Handing
       * the term to the club puts a second real lever in their hands and prices
       * it honestly in both directions — more years is worth more to the player
       * and wins contests money cannot, and more years is a commitment that is
       * still on the books when the season turns.
       *
       * 7-8 only. This is the founder's extra responsibility for the older
       * band: a GM decision, not another sum.
       */
      choosesTerm
        ? `<div class="sl-term" role="group" aria-label="How many years you offer">
             <span class="sl-term-lab">FOR HOW LONG</span>
             <div class="sl-term-row">${Array.from({ length: maxYears }, (_, i) => i + 1)
               .map(
                 (y) =>
                   `<button type="button" class="sl-term-btn" data-years="${y}" aria-pressed="${
                     y === years ? "true" : "false"
                   }">${y}<small>yr${y === 1 ? "" : "s"}</small></button>`,
               )
               .join("")}</div>
             <p class="sl-term-say">${
               years === maxYears
                 ? "The longest this way of paying allows. He will like that — and you own the hole either way."
                 : years === 1
                   ? "One year. You are back here next summer, and so is he."
                   : `${years} years. Long enough to matter, short enough to get out of.`
             }</p>
           </div>`
        : ""
    }
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
  </div>`;
}

/**
 * THE OFFER BAR — the money, the dial that moves it, and the button.
 *
 * Measured at 1024x600, the school Chromebook this product promises to run on
 * (PLATFORM_REALITY §34): the composer was 661px tall inside a 445px scroller,
 * so a pair saw 125px of it. What they saw was the ask, one payment tool, and
 * PUT THE OFFER IN pinned across the bottom — and the amount that button was
 * about to commit, the dial that sets it, and the total were all below the
 * fold. A student could press the loudest control on the screen without ever
 * having seen the number it commits, which is not a decision; it is a dare.
 *
 * So the three things the pair is actually deciding leave the scroller and
 * become the floor of the card. The machinery scrolls above them — which tool,
 * how many years, what the deal does to the books. The money never moves off
 * the screen, because "signing him changes what else I can do" is the whole
 * beat and it cannot land on a number you cannot see.
 */
function offerBar(card: V): string {
  const { max, ask, lo, value, years, fill } = offerMath(card);
  return `
  <div class="sl-offerbar">
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
    <button type="button" class="sl-commit" id="slCommit">PUT THE OFFER IN</button>
    ${error ? `<p class="sl-err">${esc(error)}</p>` : ""}
  </div>`;
}

/**
 * WHAT HE DID, ABOVE WHAT HE SAYS ABOUT HIMSELF.
 *
 * Deliberately placed between the name and the two prose lines. A student who
 * reads nothing else on this card reads four numbers, and those four numbers
 * are the only thing here that a rival desk cannot spin. The age and the term
 * sit in the same block because they are the answer to the question the numbers
 * provoke: if he is the best scorer here, why is he the cheapest?
 */
function statBlock(card: V): string {
  const st = card["stat"];
  if (!st || typeof st !== "object") return "";
  const s = st as V;
  const age = num(card["age"]);
  const yrs = num(card["realYears"]);
  return `
    <div class="sl-stat">
      <p class="sl-stat-lab">${esc(str(s["label"]))}</p>
      <dl class="sl-stat-grid">
        ${arr(s["big"])
          .map(
            (b) =>
              `<div><dt>${esc(str(b["label"]))}</dt><dd>${esc(str(b["value"]))}</dd></div>`,
          )
          .join("")}
      </dl>
      <p class="sl-stat-detail">${
        age > 0 ? `<b>AGE ${age}</b> WHEN HE SIGNED · <b>${yrs} YEAR${yrs === 1 ? "" : "S"}</b> · ` : ""
      }${esc(str(s["detail"]))}</p>
    </div>`;
}

function playerCard(card: V, band: string): string {
  return `
  <div class="sl-card">
   <div class="sl-card-body">
    <div class="sl-card-head">
      <p class="sl-card-role">${esc(str(card["role"]))}${
        card["yours"] === true ? " · YOUR OWN PLAYER" : ""
      }</p>
      <h2 class="sl-card-name">${esc(str(card["name"]))}</h2>
      ${statBlock(card)}
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
   ${offerBar(card)}
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
      ? playerCard({ ...card, choosesTerm: view["choosesTerm"] === true }, band)
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
/**
 * THE NAMING, on the pair's own screen.
 *
 * The wall carries the concept and the generalisation, in front of everybody.
 * This carries THEIR case of it — their own forgone list, their own hole never
 * filled, their own wall — because "opportunity cost" is a phrase and "signing
 * Kelly Oubre Jr. is what put Mitchell Robinson out of your reach" is a thing
 * that happened to you.
 *
 * The term is deliberately last in the reading order on this surface: moment,
 * then your case, then the name. A pair that reads the word first stops reading.
 */
function namingPanel(v: V): string {
  const n = v["naming"];
  if (n === null || n === undefined) return "";
  const f = rec(n);
  const yours = str(f["yours"]);
  return panel(
    { title: "WHAT THAT WAS CALLED", note: `${num(f["index"]) + 1} of ${num(f["count"])}` },
    `<p class="sl-naming-moment">${esc(str(f["moment"]))}</p>
     ${yours ? `<p class="sl-naming-yours">${esc(yours)}</p>` : ""}
     <p class="sl-naming-term">${esc(str(f["term"]))}</p>
     <p class="sl-naming-means">${esc(str(f["means"]))}</p>
     <p class="sl-naming-outside"><b>OUTSIDE BASKETBALL</b> ${esc(str(f["outside"]))}</p>`,
  );
}

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
        /* The copy has to be derived from the number, not asserted beside it:
           "the next problem you can still solve" is false for a club that went
           past its line, and that club is exactly the one this beat is for. */
        v["yourPastLine"] !== true
          ? `<p class="sl-money-read" style="font-size:34px">${esc(str(v["yourRoomLeftText"], dollars(num(v["yourRoomLeft"]))))}</p>
         <p class="sl-forgone-lead" style="margin-top:8px">This is the part of the summer you did not spend, measured to the line you started under. It is not left over — it is the next problem you can still solve.</p>`
          : `<p class="sl-money-read" style="font-size:34px">${esc(str(v["yourRoomLeftText"], dollars(num(v["yourRoomLeft"]))))}</p>
         <p class="sl-forgone-lead" style="margin-top:8px">You went past the line you started the summer under. That was a choice, and it bought you something — but from here on, the rules give you less to work with than they gave you in June.</p>`,
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
      [
        "ROOM LEFT",
        // Rendered by the module, so the sign never has to survive a trip
        // through the client. `roomLeft` here is a magnitude.
        str(r["roomLeftText"], dollars(num(r["roomLeft"]))),
        r["pastLine"] === true ? "you crossed the line you started under" : "before the line you started under",
      ],
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

/* ------------------------------------------------------------ picker -- */

/**
 * PICK YOUR CLUB — the student's first act of ownership.
 *
 * One student, one franchise (D59). Eight clubs, two front offices each; a
 * club with one desk on it is still open and says so. Rebuilt only when the
 * openness of the room changes, so a poll does not steal a click; a card that
 * fills while the student is reading greys out on the next patch rather than
 * silently accepting a pick the server will refuse.
 */
function renderPicker(v: V, choices: V[], host: HTMLElement, submit: Submit): void {
  // The refusal text is part of the key so a second, different refusal also
  // rebuilds the grid with live buttons (see play/main.ts onRejected).
  const key = "pick:" + choices.map((c) => `${str(c["clubId"])}=${num(c["open"])}`).join(",") + "|" + (error ?? "");
  if (mountKey === key) return;
  mountKey = key;
  const cards = choices
    .map((c, i) => {
      const open = num(c["open"]);
      const jobs = (Array.isArray(c["jobs"]) ? (c["jobs"] as unknown[]) : []).map((j) => esc(String(j))).join(" · ");
      return `<button type="button" class="sl-pick" data-club="${esc(str(c["clubId"]))}" data-index="${i}" data-open="${open}" ${open === 0 ? 'disabled aria-disabled="true"' : ""}>
        <span class="sl-pick-name">${esc(str(c["club"]))}</span>
        <span class="sl-pick-city">${esc(str(c["city"]))} · ${esc(str(c["standing"]))}</span>
        <span class="sl-pick-sit">${esc(str(c["situation"]))}</span>
        <span class="sl-pick-meta"><span>NEEDS ${jobs}</span>${str(c["committedText"]) ? `<span>PAYROLL ${esc(str(c["committedText"]))}</span>` : ""}</span>
        <span class="sl-pick-open" data-open="${open}">${esc(str(c["openText"]))}</span>
      </button>`;
    })
    .join("");
  host.innerHTML = `<div class="sl-picker">
    <div class="sl-picker-head">
      <div class="sl-picker-eyebrow">YOUR FRONT OFFICE</div>
      <h2 class="sl-picker-title">${esc(str(v["message"], "Pick the club you will run."))}</h2>
      <p class="sl-picker-prompt">${esc(str(v["choosePrompt"]))}</p>
      ${error ? `<div class="sl-err" role="alert">${esc(error)}</div>` : ""}
    </div>
    <div class="sl-pick-grid">${cards}</div>
    <div class="sl-picker-foot"><button type="button" class="sl-deal" data-deal>DEAL ME ONE</button></div>
  </div>`;
  const lock = (): void => {
    host.querySelectorAll<HTMLButtonElement>(".sl-pick, .sl-deal").forEach((b) => { b.disabled = true; });
  };
  host.querySelectorAll<HTMLButtonElement>(".sl-pick").forEach((b) => {
    b.addEventListener("click", () => {
      error = null;
      lock();
      submit({ type: "chooseClub", clubId: b.dataset["club"] });
    });
  });
  host.querySelector<HTMLButtonElement>("[data-deal]")?.addEventListener("click", () => {
    error = null;
    lock();
    submit({ type: "takeSeat" });
  });
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
    if (v["observer"] === true) {
      host.innerHTML = `<div class="sl-note" style="margin:24px;">${
        str(v["observerEyebrow"]) ? `<strong>${esc(str(v["observerEyebrow"]))}</strong>` : ""
      }<p style="margin:8px 0 0">${esc(str(v["message"], "You're in."))}</p>${
        str(v["observerAction"]) ? `<p style="margin:8px 0 0">${esc(str(v["observerAction"]))}</p>` : ""
      }</div>`;
      mountKey = "";
      return;
    }
    const choices = arr(v["choices"]);
    if (v["canChoose"] !== true || choices.length === 0) {
      // No choice on offer (a phase past the window, or an older server): fall
      // back to being dealt a club. The module is idempotent on `takeSeat`, so a
      // retry is not an error — but without this the student sits on the
      // waiting copy forever. Guarded so a poll every second does not turn into
      // a request every second.
      if (!seatRequested) {
        seatRequested = true;
        submit({ type: "takeSeat" });
      }
      host.innerHTML = `<div class="sl-note" style="margin:24px;"><p style="margin:0">${esc(
        str(v["message"], "You're in. Finding your club…"),
      )}</p></div>`;
      mountKey = "";
      return;
    }
    renderPicker(v, choices, host, submit);
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
    term = null;
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
      main =
        namingPanel(v) +
        (forgonePanel(v) || `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`);
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
    term === null ? "-" : String(term),
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

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl-term-btn"))) {
    el.addEventListener("click", () => {
      term = Number(el.dataset["years"]);
      mountKey = "";
      renderSameLineL1("PLAY", v, host, submit);
    });
  }

  const dial = host.querySelector<HTMLInputElement>("#slDial");
  const read = host.querySelector<HTMLElement>("#slRead");
  const total = host.querySelector<HTMLElement>("#slTotal");
  if (dial) {
    const card = board.find((c) => str(c["id"]) === selected);
    /*
     * The term the PAIR chose, not the one the tool defaults to.
     *
     * This read `num(chosen["years"], 1)`. For a 7-8 desk that had set the
     * term to four years on a two-year tool, dragging the dial rewrote the
     * total as annual x 2 — the contract's own size, wrong, on the surface
     * they are deciding from, and only while they are moving the number.
     * `offerMath` is now the single place that answers "how many years".
     */
    const years = card === undefined ? 1 : offerMath(card).years;
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
    const maxY = num(chosen["maxYears"], num(chosen["years"], 1));
    error = null;
    submit({
      type: "offer",
      playerId: selected,
      tool: str(chosen["tool"]),
      annual: value,
      ...(v["choosesTerm"] === true && term !== null ? { years: Math.max(1, Math.min(maxY, term)) } : {}),
    });
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
