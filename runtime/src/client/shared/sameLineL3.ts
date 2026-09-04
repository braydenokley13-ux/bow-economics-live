/**
 * THE SAME LINE — L3 "THE DEADLINE" (`m1l3-the-deadline`), the student surface.
 *
 * Built against the REAL `studentView`/`reduce` in
 * `runtime/src/modules/sameLine/l3.ts`. Field names below (`label`, `club`,
 * `hour`, `marketClosed`, `books.{committedText,taxSalaryText,wallText,
 * standing}`, `roster`, `picksOwned`, `picksOwed`, `openJobs`, `myOffers`,
 * `market`, `capturePrompts`, `maxObjectsPerSide`, `reachBlocked`, `settled`,
 * `naming`) are copied verbatim.
 *
 * RECONCILED 2026-09-04 against the engine's second pass, which closed the
 * gaps the first pass of this file had to work around:
 * - `market[]` now carries `holderId` (`"<clubId>-<twin>"`, public, never a
 *   seat id) AND `annualText` — the composer can target a desk and show the
 *   real WHAT-I-WANT bar. `propose` takes `{toDesk: holderId, ...}`.
 * - `myOffers[]` gained `counterpartyId` (same `holderId` shape) — used
 *   below to resolve a counter's CURRENT `send` package against exactly the
 *   counterparty's own market listings, rather than a room-wide guess.
 * - `books.taxSalaryText` exists — rendered as its own line.
 * - `settled {coveredJobs, openJobs} | null` at REVEAL/CONSEQUENCE and
 *   `naming {index,count,term,moment,means,outside} | null` at
 *   SYNTHESIS/COMPLETE are both real now; a `real` field on `naming` is
 *   rendered defensively for a follow-up that hasn't landed.
 * - `reachBlocked` (a desk-private integer on `studentView`, ONE summed
 *   integer on `boardView` — never per-desk on the board, an Economic Truth
 *   ruling) is surfaced as a small note, never a per-object grey reason,
 *   because the view still does not say WHICH listing is blocked.
 *
 * ONE GAP REMAINS BY CONSTRUCTION, not oversight: `counter` needs the
 * negotiation's CURRENT `send`/`want` as `ObjectId[]`, but `myOffers` only
 * ever gives label strings. `want` (always MY OWN objects, when I'm the one
 * countering) resolves for free from my own `roster`/`picksOwned` ids —
 * always available. `send` (the counterparty's objects) only resolves if
 * those objects are THEMSELVES on `market` under `counterpartyId` — if the
 * counterparty sent something unlisted, this file can't counter it and says
 * so, rather than guessing an id.
 *
 * `withdrawAccept` is 5–6 only (D61); band is read from `gradeBand` if the
 * view ever carries it, else inferred from `maxObjectsPerSide` (1 at 5–6,
 * 2 at 7–8 — the same signal `capturePrompts` already keys off of).
 *
 * Escrow is inferred by NAME match against `myOffers[].sendLabels`/
 * `wantLabels` for any offer in an escrowing state (LIVE/COUNTERED/
 * ACCEPTED) — objects are unique room-wide by construction (spec §2) but
 * the view never echoes an escrow flag directly on `roster`/`picksOwned`.
 */

import { esc } from "./m2ui.js";
import { renderHq, observeHqBand, panel, type HqNavItem, type HqShell, type HqTriadCell } from "./hq.js";

type V = Record<string, unknown>;
const rec = (v: unknown): V => (v && typeof v === "object" ? (v as V) : {});
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const bool = (v: unknown): boolean => v === true;

export type Submit = (action: { type: string; [key: string]: unknown }) => void;

/* --------------------------------------------------------- local state -- */

let mountKey = "";
let error: string | null = null;
let seatRequested = false;
/** hour + marketClosed — a new hour clears every open draft (spec §7 onPhaseExit / closeHour). */
let roundKey: string | null = null;

/* composer — a market object id seeds WHAT I WANT; the rest is staged here. */
let wantIds: string[] = [];
let sendIds: string[] = [];
let chip: string | null = null;
let line = "";

/* counter — offerId + the one resolvable move, never an arbitrary swap. */
let counterOfferId: string | null = null;

/* decline — offerId + the required chip. */
let declineOfferId: string | null = null;
let declineChip: string | null = null;

/* defend — COUNTERFACTUAL / ARGUE free text. */
let defendText = "";
let defendSent = false;

function clearComposer(): void {
  wantIds = [];
  sendIds = [];
  chip = null;
  line = "";
}
function clearCounter(): void {
  counterOfferId = null;
}
function clearDecline(): void {
  declineOfferId = null;
  declineChip = null;
}

/** Forget only the mount (a takeover screen replaced the DOM); every draft survives. */
export function invalidateSameLineL3Mount(): void {
  mountKey = "";
}

/** Forget everything when a new session or a new desk arrives. */
export function resetSameLineL3(): void {
  mountKey = "";
  error = null;
  seatRequested = false;
  roundKey = null;
  clearComposer();
  clearCounter();
  clearDecline();
  defendText = "";
  defendSent = false;
}

export function sameLineL3Error(message: string | null): void {
  error = message;
}

/* --------------------------------------------------------- word count -- */

function wordCount(s: string): number {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

function parseMoney(s: string | null | undefined): number {
  if (!s) return 0;
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 1 at 5–6, 2 at 7–8 — `capturePrompts`/composer already key off this exact signal. */
function bandOf(v: V): "5-6" | "7-8" {
  const explicit = v["gradeBand"];
  if (explicit === "5-6" || explicit === "7-8") return explicit;
  return num(v["maxObjectsPerSide"], 1) >= 2 ? "7-8" : "5-6";
}

/* -------------------------------------------------------------- shell -- */

function shellFor(v: V, main: string, side: string): string {
  const hour = num(v["hour"], 1);
  const marketClosed = bool(v["marketClosed"]);
  const openJobs = strArr(v["openJobs"]).length;
  const inboxCount = arr(v["myOffers"]).filter((o) => bool(o["awaitingMe"])).length;
  const nav: HqNavItem[] = [
    { id: "war", label: "War Room", state: "live" },
    { id: "market", label: "The Market", state: "open" },
    { id: "inbox", label: "Inbox", state: "open", count: inboxCount || null },
    { id: "roster", label: "Roster", state: "open", count: arr(v["roster"]).length },
    { id: "boardroom", label: "The Boardroom", state: "locked" },
  ];
  const triad: HqTriadCell[] = [
    { label: "HOUR", value: marketClosed ? "DEADLINE PASSED" : `${hour} OF 2`, live: !marketClosed },
    { label: "OPEN JOBS", value: String(openJobs), live: openJobs > 0 },
  ];
  const wallText = rec(v["books"])["wallText"];
  if (typeof wallText === "string" && wallText) triad.push({ label: "WALL", value: wallText });

  const club = str(v["club"], "Your club");
  const shell: HqShell = {
    eyebrow: "MODULE 1 · THE DEADLINE",
    title: club,
    sub: str(v["seedWarning"]) || null,
    clubId: club.toLowerCase().replace(/\s+/g, "-") || null,
    nav,
    triad,
    acts: ["THE OFFSEASON", "THE SEASON", "THE DEADLINE", "THE BOARDROOM"],
    actIndex: 2,
    main,
    side,
  };
  return renderHq(shell);
}

/* -------------------------------------------------------- not seated -- */

function findingDeskNote(): string {
  return `<div class="sl-note" style="margin:24px;"><p style="margin:0">Finding your desk…</p></div>`;
}
function observerNote(v: V): string {
  return `<div class="sl-note" style="margin:24px;"><p style="margin:0">${esc(
    str(v["message"], "You're watching this deadline, not running a desk."),
  )}</p></div>`;
}

/* ------------------------------------------------------------- books -- */

const JOBSTATE_LABEL: Readonly<Record<string, string>> = {
  DOES_JOB: "DOES THE JOB",
  MORE_THAN_JOB: "DOES MORE THAN THE JOB",
  DOES_NOT_DO_JOB: "DOES NOT DO THE JOB",
};
const JOBSTATE_TONE: Readonly<Record<string, string>> = {
  DOES_JOB: "ok",
  MORE_THAN_JOB: "good",
  DOES_NOT_DO_JOB: "bad",
};

function booksPanel(v: V): string {
  const books = rec(v["books"]);
  const rows: string[] = [];
  rows.push(row("CAP POSITION", str(books["committedText"], "—")));
  const tax = books["taxSalaryText"];
  if (typeof tax === "string" && tax) rows.push(row("TAX SALARY", tax));
  if (typeof books["wallText"] === "string" && books["wallText"]) rows.push(row("YOUR WALL", str(books["wallText"])));
  rows.push(row("STANDING", str(books["standing"], "—")));
  return panel({ title: "YOUR BOOKS" }, `<dl class="sl3-books">${rows.join("")}</dl>`);
  function row(label: string, value: string): string {
    return `<div class="sl3-books-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  }
}

function openJobsPanel(v: V): string {
  const jobs = strArr(v["openJobs"]);
  if (!jobs.length) return panel({ title: "OPEN JOBS" }, `<p class="sl-note">Every job on your desk is filled.</p>`);
  return panel({ title: "OPEN JOBS" }, `<div class="sl3-jobs">${jobs.map((j) => `<span class="sl3-job-chip">${esc(j)}</span>`).join("")}</div>`);
}

function owedPanel(v: V): string {
  const owed = arr(v["picksOwed"]);
  if (!owed.length) return "";
  return panel(
    { title: "OWED" },
    `<div class="sl3-owed">${owed.map((o) => `<p class="sl3-owed-line">${esc(str(o["label"]))}</p>`).join("")}</div>`,
  );
}

function sidePanels(v: V): string {
  return [booksPanel(v), openJobsPanel(v), owedPanel(v)].join("");
}

/* ------------------------------------------------------------- escrow -- */

function escrowedNames(v: V): Set<string> {
  const set = new Set<string>();
  for (const o of arr(v["myOffers"])) {
    const st = str(o["state"]);
    if (st === "LIVE" || st === "COUNTERED" || st === "ACCEPTED") {
      for (const n of strArr(o["sendLabels"])) set.add(n);
      for (const n of strArr(o["wantLabels"])) set.add(n);
    }
  }
  return set;
}

/** `give`/`get` in MY frame, regardless of who originally proposed the offer. */
function perspective(o: V): { give: string[]; get: string[] } {
  const send = strArr(o["sendLabels"]);
  const want = strArr(o["wantLabels"]);
  return str(o["direction"]) === "sent" ? { give: send, get: want } : { give: want, get: send };
}

/** My own objects — ids always known, regardless of market-listing status. */
function myIndex(v: V): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of arr(v["roster"])) map.set(str(r["name"]), str(r["id"]));
  for (const p of arr(v["picksOwned"])) map.set(str(p["label"]), str(p["id"]));
  return map;
}
/** A specific desk's listed objects, keyed by the public `holderId`. */
function marketIndexByHolder(v: V, holderId: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of arr(v["market"])) if (str(m["holderId"]) === holderId) map.set(str(m["label"]), str(m["id"]));
  return map;
}

/* ------------------------------------------------------------- roster -- */

function rosterSection(v: V): string {
  const escrowed = escrowedNames(v);
  const marketIds = new Set(arr(v["market"]).map((m) => str(m["id"])));
  const rows = arr(v["roster"])
    .map((c) => {
      const name = str(c["name"]);
      const id = str(c["id"]);
      const isEscrowed = escrowed.has(name);
      const isListed = marketIds.has(id);
      const tone = JOBSTATE_TONE[str(c["jobState"])] ?? "ok";
      return `
      <div class="sl3-roster-row" data-tone="${tone}">
        <div class="sl3-roster-head">
          <span class="sl3-roster-name">${esc(name)}</span>
          <span class="sl3-roster-role">${esc(str(c["role"]))}</span>
        </div>
        <div class="sl3-roster-meta">
          <span>${esc(str(c["annualText"]))}</span>
          <span>${num(c["yearsRemaining"])} yr${num(c["yearsRemaining"]) === 1 ? "" : "s"} left</span>
          <span class="sl3-roster-job">${esc(JOBSTATE_LABEL[str(c["jobState"])] ?? str(c["jobState"]))}</span>
        </div>
        <div class="sl3-roster-actions">
          ${
            isEscrowed
              ? `<span class="sl3-escrow-tag">IN A DEAL</span>`
              : isListed
                ? `<button type="button" class="sl-pass sl3-unlist" data-object="${esc(id)}">TAKE OFF THE MARKET</button>`
                : `<button type="button" class="sl-pass sl3-list" data-object="${esc(id)}">LIST ON THE MARKET</button>`
          }
        </div>
      </div>`;
    })
    .join("");
  const picks = arr(v["picksOwned"])
    .map((p) => {
      const label = str(p["label"]);
      const id = str(p["id"]);
      const isEscrowed = escrowed.has(label);
      const isListed = marketIds.has(id);
      return `
      <div class="sl3-pick-row">
        <span class="sl3-pick-label">${esc(label)}</span>
        ${
          isEscrowed
            ? `<span class="sl3-escrow-tag">IN A DEAL</span>`
            : isListed
              ? `<button type="button" class="sl-pass sl3-unlist" data-object="${esc(id)}">TAKE OFF THE MARKET</button>`
              : `<button type="button" class="sl-pass sl3-list" data-object="${esc(id)}">LIST ON THE MARKET</button>`
        }
      </div>`;
    })
    .join("");
  return panel(
    { title: "YOUR ROSTER" },
    `<div class="sl3-roster-list">${rows || `<p class="sl-note">Nothing signed yet.</p>`}</div>
     <div class="sl3-pick-list">${picks}</div>`,
  );
}

/* -------------------------------------------------------------- market -- */

function marketSection(v: V): string {
  const market = arr(v["market"]);
  const mine = new Set([...arr(v["roster"]).map((r) => str(r["id"])), ...arr(v["picksOwned"]).map((p) => str(p["id"]))]);
  const composing = wantIds.length > 0;
  const composingHolderId = composing ? str(market.find((m) => wantIds.includes(str(m["id"])))?.["holderId"]) : null;
  const reachBlocked = num(v["reachBlocked"]);
  if (!market.length) return panel({ title: "ON THE MARKET" }, `<p class="sl-note">Nothing listed yet.</p>`);
  const rows = market
    .map((m) => {
      const id = str(m["id"]);
      const isMine = mine.has(id);
      const holderId = str(m["holderId"]);
      const holderLabel = str(m["holderLabel"], "unknown");
      const interest = num(m["interestCount"]);
      const inThisComposer = wantIds.includes(id);
      const disabledForComposer = composing && !inThisComposer && composingHolderId !== holderId;
      return `
      <div class="sl3-market-row" data-mine="${isMine ? "yes" : "no"}" data-reach="${disabledForComposer ? "no" : "yes"}">
        <span class="sl3-market-name">${esc(str(m["label"]))}</span>
        <span class="sl3-market-holder">${esc(holderLabel)}</span>
        <span class="sl3-market-interest">${interest > 0 ? `${interest} desk${interest === 1 ? "" : "s"} talking` : ""}</span>
        ${
          isMine
            ? `<span class="sl3-market-mine">YOURS</span>`
            : disabledForComposer
              ? `<span class="sl3-market-why">a different desk</span>`
              : `<button type="button" class="sl-commit sl3-want" data-object="${esc(id)}" aria-pressed="${inThisComposer ? "true" : "false"}">${
                  inThisComposer ? "IN YOUR OFFER" : "MAKE AN OFFER"
                }</button>`
        }
      </div>`;
    })
    .join("");
  const note = `${market.length} listed${reachBlocked > 0 ? ` · ${reachBlocked} out of reach for your desk right now` : ""}`;
  return panel({ title: "ON THE MARKET", note }, `<div class="sl3-market-list">${rows}</div>`);
}

/* ------------------------------------------------------------ composer -- */

function composerPanel(v: V): string {
  if (wantIds.length === 0) return "";
  const market = arr(v["market"]);
  const wantEntries = market.filter((m) => wantIds.includes(str(m["id"])));
  if (!wantEntries.length) return "";
  const holderId = str(wantEntries[0]!["holderId"]);
  const holderLabel = str(wantEntries[0]!["holderLabel"], "this desk");
  const maxSide = Math.max(1, num(v["maxObjectsPerSide"], 1));
  const canSubmit = holderId.length > 0;

  const roster = arr(v["roster"]);
  const picks = arr(v["picksOwned"]);
  const escrowed = escrowedNames(v);
  const sendable = [...roster, ...picks].filter((o) => {
    const label = str(o["name"], str(o["label"]));
    return !escrowed.has(label);
  });
  const sendRows = sendable
    .map((o) => {
      const id = str(o["id"]);
      const label = str(o["name"], str(o["label"]));
      const picked = sendIds.includes(id);
      const disabled = !picked && sendIds.length >= maxSide;
      return `<button type="button" class="sl3-composer-pick" data-object="${esc(id)}" aria-pressed="${picked ? "true" : "false"}" ${
        disabled ? "disabled" : ""
      }>${esc(label)}</button>`;
    })
    .join("");

  const outTotal = sendable.filter((o) => sendIds.includes(str(o["id"]))).reduce((sum, o) => sum + parseMoney(str(o["annualText"], "")), 0);
  const inTotal = wantEntries.reduce((sum, e) => sum + parseMoney(str(e["annualText"], "")), 0);
  const outText = sendIds.length === 0 ? "—" : `$${outTotal.toLocaleString("en-US")}`;
  const inText = `$${inTotal.toLocaleString("en-US")}`;
  const withinBar = sendIds.length > 0 ? inTotal <= outTotal : true;

  const cc = rec(v["capturePrompts"]);
  const chips = strArr(cc["send"]);
  const limit = num(cc["lineWordLimit"], 12);
  const words = wordCount(line);
  const canAddMoreWant = wantIds.length < maxSide;

  return panel(
    { title: `YOUR OFFER TO ${holderLabel.toUpperCase()}` },
    `
    <div class="sl3-composer">
      ${!canSubmit ? `<p class="sl3-composer-warn">This listing doesn't carry a desk key yet — SEND OFFER is off. Tell your teacher.</p>` : ""}
      <p class="sl3-composer-sub">WHAT I WANT: ${wantEntries.map((e) => `<b>${esc(str(e["label"]))}</b>`).join(", ")}${
        canAddMoreWant ? ` <span class="sl3-composer-note">(pick more from ${esc(holderLabel)} if you want)</span>` : ""
      }</p>
      <p class="sl3-composer-lab">WHAT I SEND</p>
      <div class="sl3-composer-picklist">${sendRows || `<p class="sl-note">Nothing left to send.</p>`}</div>
      <div class="sl3-bars" data-within="${withinBar ? "yes" : "no"}">
        <div class="sl3-barrow" data-kind="out">
          <span class="sl3-barrow-label">WHAT I SEND</span>
          <span class="sl3-barrow-value">${esc(outText)}</span>
        </div>
        <div class="sl3-barrow" data-kind="in">
          <span class="sl3-barrow-label">WHAT I WANT</span>
          <span class="sl3-barrow-value">${esc(inText)}</span>
        </div>
      </div>
      <p class="sl3-bars-note">${withinBar ? "This fits the room's bars, but the league office still checks the math." : "This looks bigger than what you're sending — it may still be legal if you have cap room. The league office checks the math."}</p>
      <div class="sl3-capture">
        <p class="sl3-capture-eyebrow">BEFORE THAT'S REAL — SENDING</p>
        <div class="sl3-chips" role="group" aria-label="What are you giving up">
          ${chips.map((c) => `<button type="button" class="sl3-chip" data-chip="${esc(c)}" aria-pressed="${chip === c ? "true" : "false"}">${esc(c)}</button>`).join("")}
        </div>
        <label class="sl3-line-lab" for="sl3Line">In one line: what do you expect this to fix?</label>
        <textarea id="sl3Line" class="sl3-line-input" rows="2">${esc(line)}</textarea>
        <p class="sl3-line-count">${words} of ${limit} words</p>
        <div class="sl3-capture-actions">
          <button type="button" class="sl-commit" id="sl3Send" ${
            sendIds.length && chip && line.trim() && wordCount(line) <= limit && canSubmit ? "" : "disabled"
          }>SEND OFFER</button>
          <button type="button" class="sl-pass" id="sl3CancelCompose">NEVER MIND</button>
        </div>
        ${error ? `<p class="sl-err">${esc(error)}</p>` : ""}
      </div>
    </div>`,
  );
}

/* -------------------------------------------------------------- inbox -- */

function offerBaseCard(o: V, extraActions: string, extraPanel: string): string {
  const id = str(o["id"]);
  const from = str(o["counterpartyLabel"], "a desk");
  const { give, get } = perspective(o);
  return `
  <div class="sl3-offer-card" data-offer="${esc(id)}" data-state="${esc(str(o["state"]))}">
    <p class="sl3-offer-from">${esc(from)}</p>
    <p class="sl3-offer-line"><b>YOU'D GET</b> ${get.map((n) => esc(n)).join(", ") || "nothing"}</p>
    <p class="sl3-offer-line"><b>YOU'D GIVE</b> ${give.map((n) => esc(n)).join(", ") || "nothing"}</p>
    ${o["voidNote"] ? `<p class="sl3-offer-void">${esc(str(o["voidNote"]))}</p>` : ""}
    ${str(o["state"]) === "ACCEPTED" ? `<p class="sl3-offer-pending">PENDING — the league office checks the math.</p>` : ""}
    ${o["declineReason"] ? `<p class="sl3-offer-void">You said no: ${esc(str(o["declineReason"]))}</p>` : ""}
    <div class="sl3-offer-actions">${extraActions}</div>
    ${extraPanel}
  </div>`;
}

function inboxSection(v: V): string {
  const offers = arr(v["myOffers"]).filter((o) => bool(o["awaitingMe"]));
  if (!offers.length) return panel({ title: "INBOX" }, `<p class="sl-note">Nothing waiting on you.</p>`);
  const cards = offers
    .map((o) => {
      const id = str(o["id"]);
      const countered = bool(o["countered"]);
      const actions = `
        <button type="button" class="sl-commit sl3-accept" data-offer="${esc(id)}">ACCEPT</button>
        ${!countered ? `<button type="button" class="sl-pass sl3-counter-open" data-offer="${esc(id)}">COUNTER</button>` : ""}
        <button type="button" class="sl-pass sl3-decline-open" data-offer="${esc(id)}">DECLINE</button>`;
      const extra = counterOfferId === id ? counterPanel(o, v) : declineOfferId === id ? declinePanel(v) : "";
      return offerBaseCard(o, actions, extra);
    })
    .join("");
  return panel({ title: "INBOX", note: `${offers.length} waiting on you` }, `<div class="sl3-offers">${cards}</div>`);
}

function counterPanel(o: V, v: V): string {
  const id = str(o["id"]);
  const counterpartyId = str(o["counterpartyId"]);
  const sendLabels = strArr(o["sendLabels"]); // their items (what I'd get)
  const wantLabels = strArr(o["wantLabels"]); // my items (what I'd give)
  const mine = myIndex(v);
  const theirs = counterpartyId ? marketIndexByHolder(v, counterpartyId) : new Map<string, string>();

  const wantIdsResolved = wantLabels.map((l) => mine.get(l)).filter((x): x is string => !!x);
  const sendIdsResolved = sendLabels.map((l) => theirs.get(l)).filter((x): x is string => !!x);
  const wantOk = wantIdsResolved.length === wantLabels.length;
  const sendOk = sendIdsResolved.length === sendLabels.length;

  if (!wantOk || !sendOk) {
    return `<div class="sl3-counter"><p class="sl-note">This build can't reconstruct ${
      !sendOk ? `what ${theirs.size ? "they'd" : "they'd"} send you (it isn't listed on the market)` : "your own side"
    } well enough to counter it. Decline it and ask them to try again, or accept it as is.</p>
    <button type="button" class="sl-pass sl3-counter-cancel">NEVER MIND</button></div>`;
  }

  const escrowed = escrowedNames(v);
  const myOtherSendables = [...arr(v["roster"]), ...arr(v["picksOwned"])].filter((o2) => {
    const label = str(o2["name"], str(o2["label"]));
    return !escrowed.has(label) && !wantLabels.includes(label);
  });
  const theirOtherListings = [...theirs.entries()].filter(([label]) => !sendLabels.includes(label));
  const myUnescrowedPicks = arr(v["picksOwned"]).filter((p) => !escrowed.has(str(p["label"])) && !wantLabels.includes(str(p["label"])));
  const myPicksAlreadyIn = arr(v["picksOwned"]).filter((p) => wantLabels.includes(str(p["label"])));

  const swapGive =
    wantLabels.length === 1
      ? myOtherSendables
          .map(
            (o2) =>
              `<button type="button" class="sl-pass sl3-counter-swap-want" data-offer="${esc(id)}" data-object="${esc(str(o2["id"]))}">OFFER ${esc(
                str(o2["name"], str(o2["label"])),
              )} INSTEAD</button>`,
          )
          .join("")
      : "";
  const swapAsk =
    sendLabels.length === 1
      ? theirOtherListings
          .map(([label, objId]) => `<button type="button" class="sl-pass sl3-counter-swap-send" data-offer="${esc(id)}" data-object="${esc(objId)}">ASK FOR ${esc(label)} INSTEAD</button>`)
          .join("")
      : "";
  const addRemovePicks = `
    ${myUnescrowedPicks.map((p) => `<button type="button" class="sl-pass sl3-counter-add" data-offer="${esc(id)}" data-pick="${esc(str(p["id"]))}">ADD ${esc(str(p["label"]))}</button>`).join("")}
    ${myPicksAlreadyIn.map((p) => `<button type="button" class="sl-pass sl3-counter-remove" data-offer="${esc(id)}" data-pick="${esc(str(p["id"]))}">REMOVE ${esc(str(p["label"]))}</button>`).join("")}`;

  return `
  <div class="sl3-counter">
    <p class="sl3-counter-lab">A counter can change exactly one thing.</p>
    <div class="sl3-counter-picks">${swapGive}${swapAsk}${addRemovePicks}</div>
    ${!swapGive && !swapAsk && !myUnescrowedPicks.length && !myPicksAlreadyIn.length ? `<p class="sl-note">Nothing available to change right now.</p>` : ""}
    <button type="button" class="sl-pass sl3-counter-cancel">NEVER MIND</button>
  </div>`;
}

function declinePanel(v: V): string {
  const chips = strArr(rec(v["capturePrompts"])["decline"]);
  return `
  <div class="sl3-decline">
    <p class="sl3-counter-lab">Why no?</p>
    <div class="sl3-chips" role="group" aria-label="Why no">
      ${chips.map((c) => `<button type="button" class="sl3-chip sl3-decline-chip" data-chip="${esc(c)}" aria-pressed="${declineChip === c ? "true" : "false"}">${esc(c)}</button>`).join("")}
    </div>
    <div class="sl3-capture-actions">
      <button type="button" class="sl-commit sl3-decline-confirm" ${declineChip ? "" : "disabled"}>CONFIRM DECLINE</button>
      <button type="button" class="sl-pass sl3-decline-cancel">NEVER MIND</button>
    </div>
  </div>`;
}

/* -------------------------------------------------------------- outbox -- */

function outboxSection(v: V): string {
  const band = bandOf(v);
  const offers = arr(v["myOffers"]).filter(
    (o) => str(o["direction"]) === "sent" && !bool(o["awaitingMe"]) && (str(o["state"]) === "LIVE" || str(o["state"]) === "COUNTERED" || str(o["state"]) === "ACCEPTED"),
  );
  if (!offers.length) return panel({ title: "OUTBOX" }, `<p class="sl-note">Nothing out right now.</p>`);
  const cards = offers
    .map((o) => {
      const id = str(o["id"]);
      const canWithdraw = str(o["state"]) === "LIVE";
      const canWithdrawAccept = str(o["state"]) === "ACCEPTED" && band === "5-6";
      const actions = `
        ${canWithdraw ? `<button type="button" class="sl-pass sl3-withdraw" data-offer="${esc(id)}">WITHDRAW</button>` : ""}
        ${canWithdrawAccept ? `<button type="button" class="sl-pass sl3-withdraw-accept" data-offer="${esc(id)}">WITHDRAW MY ACCEPT</button>` : ""}
      `;
      return offerBaseCard(o, actions, "");
    })
    .join("");
  return panel({ title: "OUTBOX", note: `${offers.length} out` }, `<div class="sl3-offers">${cards}</div>`);
}

function historySection(v: V): string {
  const executed = arr(v["myOffers"]).filter((o) => str(o["state"]) === "EXECUTED");
  if (!executed.length) return "";
  const rows = executed
    .map((o) => {
      const { give, get } = perspective(o);
      return `<p class="sl3-history-item">Hour ${num(o["hour"])}: sent ${give.map((n) => esc(n)).join(", ") || "nothing"} to ${esc(
        str(o["counterpartyLabel"], "a desk"),
      )} for ${get.map((n) => esc(n)).join(", ") || "nothing"}.</p>`;
    })
    .join("");
  return panel({ title: "TRADES YOU MADE" }, rows);
}

function settlePanel(v: V): string {
  const s = v["settled"];
  if (!s || typeof s !== "object") return "";
  const settle = s as V;
  return panel(
    { title: "YOUR SEASON SETTLES" },
    `<div class="sl3-settle">
       <p class="sl3-settle-line"><b>${num(settle["coveredJobs"])}</b> job${num(settle["coveredJobs"]) === 1 ? "" : "s"} covered by what you traded for</p>
       <p class="sl3-settle-line"><b>${num(settle["openJobs"])}</b> job${num(settle["openJobs"]) === 1 ? "" : "s"} still open</p>
     </div>`,
  );
}

/* --------------------------------------------------------------- phases -- */

function lobbyMain(): string {
  return `
  <div class="sl3-hero">
    <p class="sl3-hero-eyebrow">PREVIOUSLY ON</p>
    <h2 class="sl3-hero-title">Your books walk in exactly as the season left them.</h2>
    <p class="sl3-hero-sub">Same books on day one. What happens next is yours.</p>
  </div>`;
}

function hookMain(): string {
  return `
  <div class="sl3-hero">
    <p class="sl3-hero-eyebrow">THE DEADLINE BRIEF</p>
    <h2 class="sl3-hero-title">Two hours on the clock. A phone that only lights up when a real offer arrives.</h2>
    <p class="sl3-hero-sub">
      February 5, 2026: Boston sent Anfernee Simons (about $27.7M, expiring) and a second-round
      pick to Chicago for Nikola Vučević (about $21.5M, expiring) and a future second. Boston's
      own summary line: it filled a hole at centre AND dropped its projected tax bill by more
      than $22M, from about $39.5M to $17M — below the first apron. One trade did all three
      things this room is about to try to do. (Hoops Rumors, 2026-02-05.)
    </p>
    <p class="sl3-hero-ask">Who on your desk has something you don't need?</p>
  </div>`;
}

function playMain(v: V): string {
  return `
  <div class="sl3-play">
    <div class="sl3-play-left">
      ${marketSection(v)}
      ${composerPanel(v)}
    </div>
    <div class="sl3-play-right">
      ${inboxSection(v)}
      ${outboxSection(v)}
    </div>
  </div>`;
}

function revealMain(v: V): string {
  return `
  <div class="sl3-hero">
    <p class="sl3-hero-eyebrow">THE DEADLINE PASSED</p>
    <h2 class="sl3-hero-title">Here is the desk you're left holding.</h2>
  </div>
  ${settlePanel(v)}
  ${historySection(v)}
  ${rosterSection(v)}`;
}

function consequenceMain(v: V): string {
  return `
  <div class="sl3-hero">
    <p class="sl3-hero-eyebrow">THE SEASON SETTLES</p>
    <h2 class="sl3-hero-title">The season reads the roster you now hold, not the one you started with.</h2>
  </div>
  ${settlePanel(v)}
  ${owedPanel(v)}
  ${historySection(v)}`;
}

function defendMain(phase: string): string {
  const question =
    phase === "COUNTERFACTUAL"
      ? "What would have to be true for you to be wrong?"
      : "The decision, not the outcome — make your case.";
  const words = wordCount(defendText);
  return `
  <div class="sl3-argue">
    <p class="sl3-hero-eyebrow">MAKE YOUR CASE</p>
    <h2 class="sl3-hero-title">${esc(question)}</h2>
    ${
      defendSent
        ? `<p class="sl-note">Sent. The room hears it live.</p>`
        : `
      <textarea id="sl3Defend" class="sl3-line-input" rows="4">${esc(defendText)}</textarea>
      <p class="sl3-line-count">${words} words</p>
      <button type="button" class="sl-commit" id="sl3DefendSend" ${defendText.trim() ? "" : "disabled"}>SEND IT UP</button>`
    }
  </div>`;
}

function namingMain(v: V): string {
  const n = v["naming"];
  if (n === null || n === undefined) {
    return `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`;
  }
  const f = rec(n);
  return panel(
    { title: "WHAT THAT WAS CALLED" },
    `<p class="sl-naming-moment">${esc(str(f["moment"]))}</p>
     <p class="sl-naming-term">${esc(str(f["term"]))}</p>
     <p class="sl-naming-means">${esc(str(f["means"]))}</p>
     ${f["real"] ? `<p class="sl3-naming-real">${esc(str(f["real"]))}</p>` : ""}
     <p class="sl-naming-outside"><b>OUTSIDE BASKETBALL</b> ${esc(str(f["outside"]))}</p>`,
  );
}

/* ------------------------------------------------------------ render -- */

export function renderSameLineL3(phase: string, view: Record<string, unknown>, host: HTMLElement, submit: Submit): void {
  const v = view as V;

  if (v["seated"] === false) {
    if (v["observer"] === true) {
      host.innerHTML = observerNote(v);
      mountKey = "";
      return;
    }
    if (!seatRequested) {
      seatRequested = true;
      submit({ type: "takeSeat" });
    }
    host.innerHTML = findingDeskNote();
    mountKey = "";
    return;
  }

  const key0 = `${num(v["hour"])}-${bool(v["marketClosed"])}`;
  if (key0 !== roundKey) {
    roundKey = key0;
    clearComposer();
    clearCounter();
    clearDecline();
    error = null;
  }

  let main: string;
  switch (phase) {
    case "LOBBY":
      main = lobbyMain();
      break;
    case "HOOK":
      main = hookMain();
      break;
    case "PLAY":
      main = playMain(v);
      break;
    case "REVEAL":
      main = revealMain(v);
      break;
    case "CONSEQUENCE":
      main = consequenceMain(v);
      break;
    case "COUNTERFACTUAL":
    case "ARGUE":
      main = defendMain(phase);
      break;
    case "SYNTHESIS":
    case "COMPLETE":
      main = namingMain(v);
      break;
    default:
      main = `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`;
  }

  const roster = arr(v["roster"]);
  const market = arr(v["market"]);
  const myOffers = arr(v["myOffers"]);
  const key = [
    phase,
    roundKey,
    roster.map((r) => `${str(r["id"])}:${str(r["jobState"])}`).join(","),
    market.map((m) => `${str(m["id"])}:${num(m["interestCount"])}`).join(","),
    myOffers.map((o) => `${str(o["id"])}:${str(o["state"])}:${bool(o["awaitingMe"])}`).join(","),
    num(v["reachBlocked"]),
    JSON.stringify(v["settled"] ?? null),
    JSON.stringify(v["naming"] ?? null),
    wantIds.join(","),
    sendIds.join(","),
    chip ?? "-",
    line,
    counterOfferId ?? "-",
    declineOfferId ?? "-",
    declineChip ?? "-",
    defendText,
    defendSent ? "sent" : "draft",
    error ?? "-",
  ].join("|");

  if (key !== mountKey) {
    host.innerHTML = shellFor(v, main, sidePanels(v));
    mountKey = key;
    observeHqBand(host);
    bind(host, v, submit);
  }
}

function bind(host: HTMLElement, v: V, submit: Submit): void {
  const phase = str(v["phase"]);
  const rerender = (): void => {
    mountKey = "";
    renderSameLineL3(phase, v, host, submit);
  };

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-list"))) {
    el.addEventListener("click", () => {
      error = null;
      submit({ type: "list", objectId: el.dataset["object"] });
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-unlist"))) {
    el.addEventListener("click", () => {
      error = null;
      submit({ type: "unlist", objectId: el.dataset["object"] });
    });
  }

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-want"))) {
    el.addEventListener("click", () => {
      const id = el.dataset["object"] ?? "";
      if (wantIds.includes(id)) {
        wantIds = wantIds.filter((x) => x !== id);
      } else {
        const maxSide = Math.max(1, num(v["maxObjectsPerSide"], 1));
        wantIds = wantIds.length >= maxSide ? [id] : [...wantIds, id];
      }
      error = null;
      rerender();
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-composer-pick"))) {
    el.addEventListener("click", () => {
      const id = el.dataset["object"] ?? "";
      const maxSide = Math.max(1, num(v["maxObjectsPerSide"], 1));
      if (sendIds.includes(id)) {
        sendIds = sendIds.filter((x) => x !== id);
      } else if (sendIds.length < maxSide) {
        sendIds = [...sendIds, id];
      }
      rerender();
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-chip"))) {
    if (el.classList.contains("sl3-decline-chip")) continue;
    el.addEventListener("click", () => {
      chip = el.dataset["chip"] ?? null;
      rerender();
    });
  }
  const line3 = host.querySelector<HTMLTextAreaElement>("#sl3Line");
  line3?.addEventListener("input", () => {
    line = line3.value;
    const count = host.querySelector(".sl3-composer .sl3-line-count");
    if (count) count.textContent = `${wordCount(line)} word${wordCount(line) === 1 ? "" : "s"}`;
    const btn = host.querySelector<HTMLButtonElement>("#sl3Send");
    if (btn) {
      const market = arr(v["market"]);
      const canSubmit = market.filter((m) => wantIds.includes(str(m["id"]))).every((e) => str(e["holderId"]).length > 0);
      btn.disabled = !(sendIds.length && chip && line.trim() && canSubmit);
    }
  });
  host.querySelector("#sl3CancelCompose")?.addEventListener("click", () => {
    clearComposer();
    error = null;
    rerender();
  });
  host.querySelector("#sl3Send")?.addEventListener("click", () => {
    if (!sendIds.length || !chip || !line.trim()) return;
    const market = arr(v["market"]);
    const wantEntries = market.filter((m) => wantIds.includes(str(m["id"])));
    const toDesk = wantEntries.length ? str(wantEntries[0]!["holderId"]) : "";
    if (!toDesk) {
      error = "This listing doesn't carry a desk key yet — tell your teacher.";
      rerender();
      return;
    }
    error = null;
    submit({ type: "propose", toDesk, send: sendIds, want: wantIds, chip, line: line.trim() });
    clearComposer();
  });

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-accept"))) {
    el.addEventListener("click", () => {
      error = null;
      submit({ type: "accept", offerId: el.dataset["offer"] });
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-withdraw"))) {
    el.addEventListener("click", () => {
      error = null;
      submit({ type: "withdraw", offerId: el.dataset["offer"] });
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-withdraw-accept"))) {
    el.addEventListener("click", () => {
      error = null;
      submit({ type: "withdrawAccept", offerId: el.dataset["offer"] });
    });
  }

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-counter-open"))) {
    el.addEventListener("click", () => {
      counterOfferId = el.dataset["offer"] ?? null;
      declineOfferId = null;
      rerender();
    });
  }
  host.querySelector(".sl3-counter-cancel")?.addEventListener("click", () => {
    clearCounter();
    rerender();
  });
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-counter-add, .sl3-counter-remove"))) {
    el.addEventListener("click", () => {
      const offerId = el.dataset["offer"] ?? "";
      const pickId = el.dataset["pick"] ?? "";
      const offer = arr(v["myOffers"]).find((o) => str(o["id"]) === offerId);
      if (!offer) return;
      const mine = myIndex(v);
      const counterpartyId = str(offer["counterpartyId"]);
      const theirs = counterpartyId ? marketIndexByHolder(v, counterpartyId) : new Map<string, string>();
      const sendIdsResolved = strArr(offer["sendLabels"]).map((l) => theirs.get(l)).filter((x): x is string => !!x);
      const wantIdsResolved = strArr(offer["wantLabels"]).map((l) => mine.get(l)).filter((x): x is string => !!x);
      const adding = el.classList.contains("sl3-counter-add");
      const newWant = adding ? [...wantIdsResolved, pickId] : wantIdsResolved.filter((x) => x !== pickId);
      error = null;
      submit({ type: "counter", offerId, send: sendIdsResolved, want: newWant });
      clearCounter();
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-counter-swap-want"))) {
    el.addEventListener("click", () => {
      const offerId = el.dataset["offer"] ?? "";
      const objectId = el.dataset["object"] ?? "";
      const offer = arr(v["myOffers"]).find((o) => str(o["id"]) === offerId);
      if (!offer) return;
      const counterpartyId = str(offer["counterpartyId"]);
      const theirs = counterpartyId ? marketIndexByHolder(v, counterpartyId) : new Map<string, string>();
      const sendIdsResolved = strArr(offer["sendLabels"]).map((l) => theirs.get(l)).filter((x): x is string => !!x);
      error = null;
      submit({ type: "counter", offerId, send: sendIdsResolved, want: [objectId] });
      clearCounter();
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-counter-swap-send"))) {
    el.addEventListener("click", () => {
      const offerId = el.dataset["offer"] ?? "";
      const objectId = el.dataset["object"] ?? "";
      const offer = arr(v["myOffers"]).find((o) => str(o["id"]) === offerId);
      if (!offer) return;
      const mine = myIndex(v);
      const wantIdsResolved = strArr(offer["wantLabels"]).map((l) => mine.get(l)).filter((x): x is string => !!x);
      error = null;
      submit({ type: "counter", offerId, send: [objectId], want: wantIdsResolved });
      clearCounter();
    });
  }

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-decline-open"))) {
    el.addEventListener("click", () => {
      declineOfferId = el.dataset["offer"] ?? null;
      counterOfferId = null;
      declineChip = null;
      rerender();
    });
  }
  host.querySelector(".sl3-decline-cancel")?.addEventListener("click", () => {
    clearDecline();
    rerender();
  });
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl3-decline-chip"))) {
    el.addEventListener("click", () => {
      declineChip = el.dataset["chip"] ?? null;
      rerender();
    });
  }
  host.querySelector(".sl3-decline-confirm")?.addEventListener("click", () => {
    if (!declineChip || !declineOfferId) return;
    error = null;
    submit({ type: "decline", offerId: declineOfferId, chip: declineChip });
    clearDecline();
  });

  const defendArea = host.querySelector<HTMLTextAreaElement>("#sl3Defend");
  defendArea?.addEventListener("input", () => {
    defendText = defendArea.value;
    const count = host.querySelector(".sl3-argue .sl3-line-count");
    if (count) count.textContent = `${wordCount(defendText)} words`;
    const btn = host.querySelector<HTMLButtonElement>("#sl3DefendSend");
    if (btn) btn.disabled = !defendText.trim();
  });
  host.querySelector("#sl3DefendSend")?.addEventListener("click", () => {
    if (!defendText.trim()) return;
    submit({ type: "defend", text: defendText.trim() });
    defendSent = true;
    rerender();
  });
}
