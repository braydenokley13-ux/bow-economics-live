/**
 * THE SAME LINE — L2 "THE SEASON" (`m1l2-the-season`), the student surface.
 *
 * RECONCILED against the real `runtime/src/modules/sameLine/l2.ts`
 * `studentView`/`reduce` (2026-09-04) — this file was originally built
 * against the spec's inferred vocabulary before the module existed. See the
 * builder's report for the full field/action diff. Every read still goes
 * through the same defensive `rec/arr/str/num` accessors `sameLineL1.ts`
 * uses, so a field the module later renames or omits degrades to an empty
 * panel instead of a crash.
 *
 * THE REAL SHAPE HAS NO NEGOTIATION. Unlike L1's July market, neither the
 * January ten-day window nor the February buyout window lets a desk choose a
 * tool, a term, or a dollar amount — every price on the board is fixed
 * (`l2.ts` `januaryOptions`/`februaryOptions`). The composer/dial/term-picker
 * this file originally built for an inferred negotiable market is gone;
 * picking a board row goes straight to Commitment Capture.
 *
 * THE SIGN ACTION'S PAYLOAD DIFFERS BY ROUND (the reducer wins): in January
 * `sign` takes `{ role, chip, line }` (the board row's `role`, not a
 * `playerId` — every ten-day is generic depth, `l2.ts`'s own comment: "the
 * depth is generic"); in February `sign` takes `{ playerId, chip, line }`.
 * `pass` never takes a role at all — the reducer reads only `chip`/`line` —
 * so holding a window open is one action, not one per open job.
 *
 * Commitment Capture (spec §4) is the one piece of UI logic this file adds
 * that L1 does not have: every `sign`, `pass` or `waive` is staged locally
 * (which role/player/contract) and only reaches the server once BOTH a chip
 * and a typed line are present — never on a browse, matching BOW tests
 * #5/#6 ("every commit without a chip/line is refused"). The server is the
 * actual enforcement; this file exists so a student can only ever produce a
 * legal request in the first place.
 *
 * Per the Integrator ruling in the spec header: the typed line is
 * teacher-only and never reaches `/board` — enforced structurally by not
 * existing anywhere in `sameLineL2Board.ts`, not by a client-side filter.
 */

import { esc } from "./m2ui.js";
import { renderHq, observeHqBand, panel, type HqNavItem, type HqShell, type HqTriadCell } from "./hq.js";

type V = Record<string, unknown>;
const rec = (v: unknown): V => (v && typeof v === "object" ? (v as V) : {});
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
/** For payload arrays of plain strings (`hq.openJobs`, `roster`) rather than objects. */
const arrStr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const bool = (v: unknown): boolean => v === true;

export type Submit = (action: { type: string; [key: string]: unknown }) => void;

/* --------------------------------------------------------- local state -- */

let mountKey = "";
let error: string | null = null;
let seatRequested = false;
/** The round this desk's local draft belongs to — a new round is a new decision (mirrors sameLineL1's `selectionDay`). */
let roundKey: string | null = null;

/** What is being staged for commitment capture, before it is a real request. */
type DraftKind = "sign" | "pass" | "waive" | null;
let draftKind: DraftKind = null;
/** A January `sign`'s role, a February `sign`'s playerId, or a `waive`'s contractId. Unused for `pass`. */
let draftTarget: string | null = null;
let chip: string | null = null;
let line = "";

function clearDraft(): void {
  draftKind = null;
  draftTarget = null;
  chip = null;
  line = "";
}

/** Forget only the mount (a takeover screen replaced the DOM); the draft survives. */
export function invalidateSameLineL2Mount(): void {
  mountKey = "";
}

/** Forget everything when a new session or a new desk arrives. */
export function resetSameLineL2(): void {
  mountKey = "";
  error = null;
  seatRequested = false;
  roundKey = null;
  clearDraft();
}

export function sameLineL2Error(message: string | null): void {
  error = message;
}

/* -------------------------------------------------------------- money -- */

const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/* --------------------------------------------------------- word count -- */

function wordCount(s: string): number {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

/* ------------------------------------------------------------- shell -- */

function shellFor(view: V, main: string, side: string): string {
  const hq = rec(view["hq"]);
  const act = rec(hq["act"]);
  const acts = (Array.isArray(act["rail"]) ? (act["rail"] as unknown[]) : []).map((a) => String(a));
  const openJobs = arrStr(hq["openJobs"]);
  const nav: HqNavItem[] = [
    { id: "war", label: "War Room", state: "live" },
    { id: "board", label: "The Board", state: "open" },
    { id: "cap", label: "Cap Sheet", state: "open" },
    { id: "roster", label: "Roster", state: "open", count: num(hq["slots"]) },
    { id: "league", label: "Around the League", state: "open" },
    { id: "trade", label: "Trade Hub", state: "locked" },
    { id: "board2", label: "Boardroom", state: "locked" },
  ];
  const triad: HqTriadCell[] = [];
  const round = str(view["round"]);
  if (round) triad.push({ label: "WINDOW", value: round === "JANUARY" ? "JANUARY" : "FEBRUARY", live: true });
  triad.push({ label: "JOBS OPEN", value: String(openJobs.length), live: openJobs.length > 0 });
  const taxSalary = hq["taxSalaryText"];
  if (typeof taxSalary === "string" && taxSalary) triad.push({ label: "TAX SALARY", value: taxSalary });

  const shell: HqShell = {
    eyebrow: `MODULE 1 · ${str(act["label"], "THE SEASON")}`,
    title: str(hq["club"]),
    sub: str(hq["dealtNote"], ""),
    clubId: str(hq["club"]).toLowerCase().replace(/\s+/g, "-") || null,
    nav,
    triad,
    acts: acts.length ? acts : ["THE OFFSEASON", "THE SEASON", "THE DEADLINE", "THE BOARDROOM"],
    actIndex: num(act["index"], 1),
    main,
    side,
  };
  return renderHq(shell);
}

/* -------------------------------------------------------------- picker -- */

/**
 * PICK YOUR DESK — same idiom as L1's club picker (`sameLineL1.ts`
 * `renderPicker`), renamed to this lesson's own noun. `choices` (real shape:
 * `{ sourceSeatId, clubId, label, dealt }`) comes from `state.unclaimed`; a
 * dealt desk is labelled verbatim per spec §7 Seed IN: "This July was dealt
 * to you, not played by you." Clicking a card claims that exact source seat
 * (`claimDesk` with `sourceSeatId`); DEAL ME A DESK omits it and lets the
 * reducer's own fallback pick one.
 */
function renderPicker(v: V, choices: V[], host: HTMLElement, submit: Submit): void {
  const key = "pick:" + choices.map((c) => `${str(c["sourceSeatId"], "-")}=${str(c["clubId"])}`).join(",") + (error ? "!" : "");
  if (mountKey === key) return;
  mountKey = key;
  const cards = choices
    .map((c) => {
      const dealt = bool(c["dealt"]);
      const source = str(c["sourceSeatId"], "");
      return `<button type="button" class="sl2-pick" data-source="${esc(source)}" data-club="${esc(str(c["clubId"]))}">
        <span class="sl2-pick-name">${esc(str(c["label"]))}</span>
        ${dealt ? `<span class="sl2-pick-dealt">THIS JULY WAS DEALT TO YOU, NOT PLAYED BY YOU</span>` : ""}
      </button>`;
    })
    .join("");
  host.innerHTML = `<div class="sl2-picker">
    <div class="sl2-picker-head">
      <div class="sl2-picker-eyebrow">YOUR JULY, RETURNING</div>
      <h2 class="sl2-picker-title">${esc(str(v["message"], "Pick your desk from July."))}</h2>
      ${error ? `<div class="sl-err" role="alert">${esc(error)}</div>` : ""}
    </div>
    <div class="sl2-pick-grid">${cards}</div>
    <div class="sl2-picker-foot"><button type="button" class="sl-deal" data-deal>DEAL ME A DESK</button></div>
  </div>`;
  const lock = (): void => {
    host.querySelectorAll<HTMLButtonElement>(".sl2-pick, .sl-deal").forEach((b) => { b.disabled = true; });
  };
  host.querySelectorAll<HTMLButtonElement>(".sl2-pick").forEach((b) => {
    b.addEventListener("click", () => {
      error = null;
      lock();
      const source = b.dataset["source"];
      submit(source ? { type: "claimDesk", sourceSeatId: source } : { type: "claimDesk" });
    });
  });
  host.querySelector<HTMLButtonElement>("[data-deal]")?.addEventListener("click", () => {
    error = null;
    lock();
    submit({ type: "claimDesk" });
  });
}

/* --------------------------------------------------------- job report -- */

const VERDICT_TONE: Record<string, string> = {
  DOES_MORE_THAN_THE_JOB: "good",
  DOES_THE_JOB: "ok",
  DOES_NOT_DO_THE_JOB: "bad",
};

function verdictLabel(verdict: string): string {
  return verdict.replace(/_/g, " ");
}

function reportCard(r: V): string {
  const verdict = str(r["verdict"]);
  const tone = VERDICT_TONE[verdict] ?? "ok";
  return `
  <div class="sl2-report-card" data-tone="${tone}">
    <p class="sl2-report-role">${esc(str(r["role"]))}</p>
    <h3 class="sl2-report-name">${esc(str(r["name"]))}</h3>
    <p class="sl2-report-verdict">${esc(verdictLabel(verdict))}</p>
    <p class="sl2-report-why">${esc(str(r["sentence"]))}</p>
  </div>`;
}

function hookMain(v: V): string {
  const report = arr(v["report"]);
  const beat = typeof v["beat"] === "number" ? num(v["beat"]) : null;
  const beatCount = typeof v["beatCount"] === "number" ? num(v["beatCount"]) : null;
  return `
  <div class="sl2-hook">
    <p class="sl2-hook-eyebrow">PREVIOUSLY ON</p>
    <h2 class="sl2-hook-title">${esc(
      str(v["hookMessage"], "You signed those contracts in July. It is January, and the season has an opinion."),
    )}</h2>
    ${beat !== null ? `<p class="sl2-hook-beat">BEAT ${beat + 1}${beatCount !== null ? ` OF ${beatCount}` : ""}</p>` : ""}
    ${
      report.length === 0
        ? `<p class="sl2-note">Your report is not in yet.</p>`
        : `<div class="sl2-report-grid">${report.map(reportCard).join("")}</div>`
    }
  </div>`;
}

/* ----------------------------------------------------- commit capture -- */

/**
 * THE TWO INPUTS (spec §4) — a one-tap chip and a short typed line — staged
 * for whatever draft (`sign`/`pass`/`waive`) is currently selected. Nothing
 * here reaches the server until both are present; `LOCK IT IN` stays
 * disabled otherwise, so a student cannot produce the illegal request the
 * server would refuse anyway (BOW tests #5, #6).
 */
function commitCapturePanel(v: V): string {
  if (!draftKind) return "";
  const cc = rec(v["commitCapture"]);
  const chips = arr(cc["chips"]).length ? arr(cc["chips"]).map((c) => str(c)) : (Array.isArray(cc["chips"]) ? (cc["chips"] as unknown[]).map(String) : []);
  const prompt = str(cc["prompt"], "What do you lose by doing this?");
  const words = wordCount(line);
  const verb = draftKind === "sign" ? "SIGNING" : draftKind === "waive" ? "WAIVING" : "HOLDING";
  return `
  <div class="sl2-capture" id="sl2Capture">
    <p class="sl2-capture-eyebrow">BEFORE THAT'S REAL — ${verb}</p>
    <div class="sl2-chips" role="group" aria-label="Why">
      ${chips
        .map(
          (c) =>
            `<button type="button" class="sl2-chip" data-chip="${esc(c)}" aria-pressed="${chip === c ? "true" : "false"}">${esc(c)}</button>`,
        )
        .join("")}
    </div>
    <label class="sl2-line-lab" for="sl2Line">${esc(prompt)}</label>
    <textarea id="sl2Line" class="sl2-line-input" rows="2">${esc(line)}</textarea>
    <p class="sl2-line-count">${words} word${words === 1 ? "" : "s"}</p>
    <div class="sl2-capture-actions">
      <button type="button" class="sl-commit" id="sl2Lock" ${chip && line.trim() ? "" : "disabled"}>LOCK IT IN</button>
      <button type="button" class="sl-pass" id="sl2CancelDraft">NEVER MIND</button>
    </div>
    ${error ? `<p class="sl-err">${esc(error)}</p>` : ""}
  </div>`;
}

function bindCommitCapture(host: HTMLElement, v: V, submit: Submit, phase: string): void {
  const panelEl = host.querySelector<HTMLElement>("#sl2Capture");
  if (!panelEl) return;
  panelEl.querySelectorAll<HTMLButtonElement>(".sl2-chip").forEach((b) => {
    b.addEventListener("click", () => {
      chip = b.dataset["chip"] ?? null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  });
  const ta = panelEl.querySelector<HTMLTextAreaElement>("#sl2Line");
  ta?.addEventListener("input", () => {
    line = ta.value;
    const count = panelEl.querySelector(".sl2-line-count");
    if (count) count.textContent = `${wordCount(line)} word${wordCount(line) === 1 ? "" : "s"}`;
    const lockBtn = panelEl.querySelector<HTMLButtonElement>("#sl2Lock");
    if (lockBtn) lockBtn.disabled = !(chip && line.trim());
  });
  panelEl.querySelector("#sl2CancelDraft")?.addEventListener("click", () => {
    clearDraft();
    error = null;
    mountKey = "";
    renderSameLineL2(phase, v, host, submit);
  });
  panelEl.querySelector("#sl2Lock")?.addEventListener("click", () => {
    if (!chip || !line.trim() || !draftKind) return;
    error = null;
    const round = str(v["round"]);
    if (draftKind === "sign") {
      // January's `sign` takes a `role`; February's takes a `playerId` — the reducer wins (l2.ts `reduce` "sign").
      if (round === "JANUARY") {
        submit({ type: "sign", role: draftTarget, chip, line: line.trim() });
      } else {
        submit({ type: "sign", playerId: draftTarget, chip, line: line.trim() });
      }
    } else if (draftKind === "waive") {
      submit({ type: "waive", contractId: draftTarget, chip, line: line.trim() });
    } else {
      // `pass` reads only chip/line — no role, no round-specific field (l2.ts `reduce` "pass").
      submit({ type: "pass", chip, line: line.trim() });
    }
    clearDraft();
  });
}

/* -------------------------------------------------------------- board -- */

/**
 * A board row's identity is its `role` in January (every ten-day option is
 * generic depth, keyed `min-<role>`) and its `playerId` in February (a real
 * named candidate). Never a negotiated price — `l2.ts` ships one fixed
 * `price` per row in both windows.
 */
function rowKey(o: V, round: string): string {
  return round === "JANUARY" ? str(o["role"]) : str(o["playerId"]);
}

function boardRow(o: V, round: string, selectedKey: string | null): string {
  const key = rowKey(o, round);
  const selected = draftKind === "sign" && selectedKey === key;
  const barred = round === "FEBRUARY" && bool(o["barred"]);
  return `
  <button type="button" class="sl2-row" data-key="${esc(key)}" ${barred ? 'aria-disabled="true" disabled' : ""}
          aria-pressed="${selected ? "true" : "false"}">
    <span class="sl2-row-name">${esc(str(o["name"]))}</span>
    <span class="sl2-row-role">${esc(str(o["role"]))}</span>
    <span class="sl2-row-ask">${esc(dollars(num(o["price"])))}</span>
    ${barred ? `<span class="sl2-row-why">Off this desk's board — the apron rule.</span>` : ""}
  </button>`;
}

function selectedSummary(card: V, round: string): string {
  const priceText = dollars(num(card["price"]));
  const askLine = round === "JANUARY" ? "Minimum salary. No negotiation." : `He is asking ${priceText} a year.`;
  const why = round === "FEBRUARY" ? str(card["why"]) : "";
  return `
  <div class="sl2-card">
    <h3 class="sl2-card-name">${esc(str(card["name"]))}</h3>
    <p class="sl2-card-role">${esc(str(card["role"]))}</p>
    <p class="sl2-compose-ask">${esc(askLine)}</p>
    ${why ? `<p class="sl2-compose-ask">${esc(why)}</p>` : ""}
    <div class="sl2-money"><span>${esc(priceText)}</span><span class="sl2-money-per">A YEAR</span></div>
  </div>`;
}

function pendingCard(pending: V, board: V[]): string {
  const card = board.find((c) => str(c["playerId"]) === str(pending["playerId"]));
  return `
  <div class="sl-committed">
    <p class="sl-committed-lab">YOUR MOVE IS IN</p>
    <h2 class="sl-committed-name">${esc(str(card?.["name"], "your player"))}</h2>
    <p class="sl-committed-note">Windows close all at once. Nobody sees anybody else's move until they do.</p>
  </div>`;
}

/**
 * OPEN JOBS ON YOUR DESK — January reads `roster` (a plain list of open
 * roles, no per-role action: a ten-day is generic depth, not tied to a
 * specific opening). February reads `waivable` (this desk's own contracts)
 * and gives each one a WAIVE affordance — the only place `waive` is offered.
 */
function openJobsPanel(v: V, round: string): string {
  if (round === "JANUARY") {
    const roster = arrStr(v["roster"]);
    if (roster.length === 0) return "";
    return panel(
      { title: "OPEN JOBS ON YOUR DESK" },
      `<div class="sl2-pockets">${roster
        .map((role) => `<div class="sl2-pocket"><span class="sl2-pocket-role">${esc(role)}</span><span class="sl2-pocket-state">OPEN</span></div>`)
        .join("")}</div>`,
    );
  }
  const waivable = arr(v["waivable"]);
  if (waivable.length === 0) return "";
  return panel(
    { title: "YOUR CONTRACTS" },
    `<div class="sl2-pockets">${waivable
      .map(
        (w) => `
      <div class="sl2-pocket">
        <span class="sl2-pocket-role">${esc(str(w["name"]))} · ${esc(str(w["role"]))}</span>
        <button type="button" class="sl2-pocket-pass sl2-waive-btn" data-contract="${esc(str(w["contractId"]))}">WAIVE</button>
      </div>`,
      )
      .join("")}</div>`,
  );
}

function wallPanel(v: V): string {
  const wall = v["wall"];
  if (typeof wall === "string" && wall) {
    return panel({ title: "YOUR WALL" }, `<p class="sl2-wall-amount">${esc(wall)}</p>`);
  }
  return panel({ title: "YOUR WALL" }, `<p class="sl2-note">No wall drawn yet.</p>`);
}

function roleAskPanel(v: V): string {
  const roleAsk = v["roleAsk"];
  const rows =
    roleAsk && typeof roleAsk === "object" && !Array.isArray(roleAsk)
      ? Object.entries(roleAsk as V).map(([role, ask]) => ({ role, ask: num(ask) }))
      : [];
  if (rows.length === 0) return "";
  return panel(
    { title: "GOING RATE BY JOB" },
    `<dl class="sl2-roleask">${rows.map((r) => `<div><dt>${esc(r.role)}</dt><dd>${esc(dollars(r.ask))}</dd></div>`).join("")}</dl>`,
  );
}

function marketMain(v: V, round: string): string {
  const board = arr(v["board"]);
  const pending = v["pending"] ? rec(v["pending"]) : null;
  const selectedKey = draftKind === "sign" ? draftTarget : null;
  const card = selectedKey ? board.find((c) => rowKey(c, round) === selectedKey) : undefined;
  const marchFirst = round === "FEBRUARY" ? str(v["marchFirst"]) : "";

  const right = pending
    ? pendingCard(pending, board)
    : card
      ? selectedSummary(card, round)
      : draftKind === "pass"
        ? `<div class="sl-note">Holding this window. Say why below.</div>`
        : draftKind === "waive"
          ? `<div class="sl-note">Waiving a contract. Say why below.</div>`
          : `<div class="sl-note">Pick somebody off the board, or hold the window open.</div>`;

  return `
  <div class="sl-play">
    <div class="sl-left">
      ${panel(
        { title: round === "JANUARY" ? "THE TEN-DAY MARKET" : "THE BUYOUT MARKET", note: `${board.length} on the wire` },
        `${marchFirst ? `<p class="sl2-note">${esc(marchFirst)}</p>` : ""}<div class="sl2-board">${board
          .map((o) => boardRow(o, round, selectedKey))
          .join("")}</div>`,
      )}
      ${openJobsPanel(v, round)}
      <button type="button" class="sl-pass" id="sl2Hold">HOLD THIS WINDOW</button>
    </div>
    <div>
      ${right}
      ${commitCapturePanel(v)}
    </div>
  </div>`;
}

/* --------------------------------------------------------- consequence -- */

function consequenceMain(v: V): string {
  const wall = v["wall"];
  const wallText = typeof wall === "string" ? wall : null;
  return `
  <div class="sl2-consequence">
    <p class="sl2-hook-eyebrow">THE TAX CLOCK</p>
    <h2 class="sl2-hook-title">The bill is read on what the season ends with, not on what July signed.</h2>
    ${wallText ? `<p class="sl2-wall-amount">${esc(wallText)}</p>` : ""}
  </div>`;
}

/* --------------------------------------------------------------- tape -- */

function tapeEntryCard(t: V, i: number): string {
  const known = rec(t["known"]);
  const chose = rec(t["chose"]);
  const result = t["result"] ? rec(t["result"]) : null;
  const options = arr(t["options"]);
  const kind = str(t["kind"]);
  const choseLine =
    kind === "pass" || chose["passed"] === true
      ? "You passed."
      : kind === "waive"
        ? `You waived ${esc(str(chose["waived"], "a contract"))}.`
        : `You chose ${esc(str(chose["name"], "somebody"))}.`;
  const outcome = result ? str(result["outcome"]) : "";
  const costLater = result ? num(result["costLaterSeasons"]) : 0;
  return `
  <div class="sl2-tape-card">
    <p class="sl2-tape-eyebrow">TAPE ${i + 1} · ${esc(str(t["round"]))}</p>
    <p class="sl2-tape-chose">${choseLine}</p>
    ${
      options.length
        ? `<div class="sl2-tape-options"><p class="sl2-tape-lab">WHAT ELSE WAS ON THE BOARD</p><ul>${options
            .map((o) => `<li>${esc(str(o["name"]))} — ${esc(dollars(num(o["price"])))}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${outcome ? `<p class="sl2-tape-result">${esc(outcome.toUpperCase())}</p>` : ""}
    ${costLater > 0 ? `<p class="sl2-tape-result">DEAD MONEY LATER: ${esc(dollars(costLater))}</p>` : ""}
    ${known["openJobs"] !== undefined ? `<p class="sl2-tape-known">${arr(known["openJobs"]).length} jobs open at the time</p>` : ""}
  </div>`;
}

function tapeMain(v: V): string {
  const tape = arr(v["tape"]);
  if (tape.length === 0) return `<div class="sl-note">Nothing on your tape yet.</div>`;
  return `<div class="sl2-tape">${tape.map(tapeEntryCard).join("")}</div>`;
}

function argueMain(): string {
  return `
  <div class="sl2-argue">
    <p class="sl2-hook-eyebrow">MAKE YOUR CASE</p>
    <h2 class="sl2-hook-title">What would have to be true for you to be wrong?</h2>
  </div>`;
}

/* ------------------------------------------------------------- naming -- */

function namingPanel(v: V): string {
  const n = v["naming"];
  if (n === null || n === undefined) return "";
  const f = rec(n);
  return panel(
    { title: "WHAT THAT WAS CALLED", note: `${num(f["index"]) + 1} of ${num(f["count"])}` },
    `<p class="sl-naming-moment">${esc(str(f["moment"]))}</p>
     <p class="sl-naming-term">${esc(str(f["term"]))}</p>
     <p class="sl-naming-means">${esc(str(f["means"]))}</p>
     <p class="sl-naming-outside"><b>OUTSIDE BASKETBALL</b> ${esc(str(f["outside"]))}</p>`,
  );
}

/** `yourForgone` is `ForgoneRecord[]` (`{ day, signed, atPrice, lost }`) carried from L1 — not a `names` list. */
function forgonePanel(v: V): string {
  const items = arr(v["yourForgone"]);
  if (items.length === 0) return "";
  return panel(
    { title: "WHAT JULY COST YOU" },
    `<div class="sl-forgone">${items
      .map((f) => {
        const lost = arrStr(f["lost"]).join(", ");
        return `<div class="sl-forgone-item"><span class="sl-forgone-name">Signing ${esc(str(f["signed"]))} for ${esc(
          dollars(num(f["atPrice"])),
        )} put ${esc(lost || "other names")} out of reach.</span></div>`;
      })
      .join("")}</div>`,
  );
}

/* -------------------------------------------------------------- panels -- */

function sidePanels(v: V): string {
  return [wallPanel(v), roleAskPanel(v)].join("");
}

/* ------------------------------------------------------------ render -- */

export function renderSameLineL2(phase: string, view: Record<string, unknown>, host: HTMLElement, submit: Submit): void {
  const v = view as V;

  if (v["seated"] === false) {
    if (v["observer"] === true) {
      host.innerHTML = `<div class="sl-note" style="margin:24px;"><p style="margin:0">${esc(
        str(v["message"], "Every desk in this room is taken."),
      )}</p></div>`;
      mountKey = "";
      return;
    }
    const choices = arr(v["choices"]);
    if (choices.length === 0) {
      if (!seatRequested) {
        seatRequested = true;
        submit({ type: "claimDesk" });
      }
      host.innerHTML = `<div class="sl-note" style="margin:24px;"><p style="margin:0">${esc(
        str(v["message"], "You're in. Finding your desk…"),
      )}</p></div>`;
      mountKey = "";
      return;
    }
    renderPicker(v, choices, host, submit);
    return;
  }

  const round = str(v["round"]) || null;
  if (round !== roundKey) {
    roundKey = round;
    clearDraft();
    error = null;
  }

  let main: string;
  switch (phase) {
    case "HOOK":
      main = hookMain(v);
      break;
    case "PLAY":
      main = marketMain(v, "JANUARY");
      break;
    case "REVEAL":
      main = hookMain(v);
      break;
    case "CONSEQUENCE":
      main = consequenceMain(v);
      break;
    case "ADAPT":
      main = marketMain(v, "FEBRUARY");
      break;
    case "COUNTERFACTUAL":
      main = tapeMain(v);
      break;
    case "ARGUE":
      main = argueMain();
      break;
    case "SYNTHESIS":
    case "COMPLETE":
      main = namingPanel(v) + (forgonePanel(v) || `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`);
      break;
    default:
      main = `<div class="sl-note">${esc(str(v["message"], "Look up — this part is the whole room's."))}</div>`;
  }

  const board = arr(v["board"]);
  const key = [
    phase,
    round ?? "-",
    board.map((c) => str(c["playerId"])).join(","),
    v["pending"] ? str(rec(v["pending"])["playerId"]) : "-",
    draftKind ?? "-",
    draftTarget ?? "-",
    chip ?? "-",
    error ?? "-",
  ].join("|");

  if (key !== mountKey) {
    host.innerHTML = shellFor(v, main, sidePanels(v));
    mountKey = key;
    observeHqBand(host);
    bind(host, v, submit, phase);
  }
}

function bind(host: HTMLElement, v: V, submit: Submit, phase: string): void {
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-row:not([disabled])"))) {
    el.addEventListener("click", () => {
      const key = el.dataset["key"] ?? null;
      draftKind = draftKind === "sign" && draftTarget === key ? null : "sign";
      draftTarget = draftKind ? key : null;
      chip = null;
      line = "";
      error = null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }

  host.querySelector<HTMLButtonElement>("#sl2Hold")?.addEventListener("click", () => {
    draftKind = "pass";
    draftTarget = null;
    chip = null;
    line = "";
    error = null;
    mountKey = "";
    renderSameLineL2(phase, v, host, submit);
  });

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-waive-btn"))) {
    el.addEventListener("click", () => {
      draftKind = "waive";
      draftTarget = el.dataset["contract"] ?? null;
      chip = null;
      line = "";
      error = null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }

  bindCommitCapture(host, v, submit, phase);
}
