/**
 * THE SAME LINE — L2 "THE SEASON" (`m1l2-the-season`), the student surface.
 *
 * Built against `docs/gauntlet/module-1/rebuild/W2_THE_SEASON_SPEC.md` §7
 * before `runtime/src/modules/sameLine/l2.ts` existed. Field names below are
 * the spec's own vocabulary (`hq`, `report`, `board`, `pockets`, `wall`,
 * `roleAsk`, `commitCapture`, `pending`, `yourForgone`, `tape`, `naming`);
 * every read goes through the same defensive `rec/arr/str/num` accessors
 * `sameLineL1.ts` uses, so a field the eventual module omits, renames, or
 * ships with a different shape degrades to an empty panel instead of a
 * crash. Once `l2.ts` lands, conform this file to its real shapes and record
 * the diff — see the builder's final report, not this comment, for that
 * diff, because a comment here would rot the moment the module changes again.
 *
 * Commitment Capture (spec §4) is the one piece of UI logic this file adds
 * that L1 does not have: every `sign`, `pass` or `waive` is staged locally
 * (which player/role/contract, which tool) and only reaches the server once
 * BOTH a chip and a typed line are present — never on a browse, matching the
 * spec's "two inputs, on every consequential commit" and BOW tests #5/#6
 * ("every commit without a chip/line is refused"). The server is the actual
 * enforcement; this file exists so a student can only ever produce a legal
 * request in the first place.
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
/** playerId for sign, role for pass, contractId for waive. */
let draftTarget: string | null = null;
let tool: string | null = null;
let annual: number | null = null;
let term: number | null = null;
let chip: string | null = null;
let line = "";

function clearDraft(): void {
  draftKind = null;
  draftTarget = null;
  tool = null;
  annual = null;
  term = null;
  chip = null;
  line = "";
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
  const openJobs = arr(hq["needs"]).length || arr(view["pockets"]).filter((p) => p["filled"] !== true).length;
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
  const round = str(view["round"]);
  if (round) triad.push({ label: "WINDOW", value: round === "JANUARY" ? "JANUARY" : "FEBRUARY", live: true });
  triad.push({ label: "JOBS OPEN", value: String(openJobs), live: openJobs > 0 });
  const taxSalary = rec(view["wall"])["taxSalaryText"];
  if (typeof taxSalary === "string" && taxSalary) triad.push({ label: "TAX SALARY", value: taxSalary });

  const shell: HqShell = {
    eyebrow: `MODULE 1 · ${str(act["label"], "THE SEASON")}`,
    title: str(hq["club"], str(view["club"])),
    sub: str(hq["situation"]),
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
 * `renderPicker`), renamed to this lesson's own noun. A dealt desk is
 * labelled on its own screen, verbatim, per spec §7 Seed IN: "This July was
 * dealt to you, not played by you."
 */
function renderPicker(v: V, choices: V[], host: HTMLElement, submit: Submit): void {
  const key = "pick:" + choices.map((c) => `${str(c["clubId"])}=${num(c["open"], 1)}`).join(",") + (error ? "!" : "");
  if (mountKey === key) return;
  mountKey = key;
  const cards = choices
    .map((c) => {
      const open = num(c["open"], 1);
      const dealt = bool(c["dealt"]);
      const jobs = arr(c["jobs"]).length ? arr(c["jobs"]).map((j) => esc(String(j))).join(" · ") : "";
      return `<button type="button" class="sl2-pick" data-club="${esc(str(c["clubId"]))}" data-open="${open}" ${
        open === 0 ? 'disabled aria-disabled="true"' : ""
      }>
        <span class="sl2-pick-name">${esc(str(c["club"]))}</span>
        <span class="sl2-pick-city">${esc(str(c["city"]))}</span>
        ${dealt ? `<span class="sl2-pick-dealt">THIS JULY WAS DEALT TO YOU, NOT PLAYED BY YOU</span>` : ""}
        <span class="sl2-pick-sit">${esc(str(c["situation"]))}</span>
        ${jobs ? `<span class="sl2-pick-meta">OPEN ${jobs}</span>` : ""}
        <span class="sl2-pick-open" data-open="${open}">${esc(str(c["openText"], open > 0 ? "OPEN" : "TAKEN"))}</span>
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
      submit({ type: "claimDesk", clubId: b.dataset["club"] });
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
  "DOES MORE THAN THE JOB": "good",
  "DOES THE JOB": "ok",
  "DOES NOT DO THE JOB": "bad",
};

function reportCard(r: V): string {
  const verdict = str(r["verdict"]);
  const tone = VERDICT_TONE[verdict] ?? "ok";
  return `
  <div class="sl2-report-card" data-tone="${tone}">
    <p class="sl2-report-role">${esc(str(r["role"]))}</p>
    <h3 class="sl2-report-name">${esc(str(r["name"]))}</h3>
    <p class="sl2-report-verdict">${esc(verdict)}</p>
    <p class="sl2-report-why">${esc(str(r["why"]))}</p>
  </div>`;
}

function hookMain(v: V): string {
  const report = arr(v["report"]);
  const beat = typeof v["beat"] === "number" ? num(v["beat"]) : null;
  return `
  <div class="sl2-hook">
    <p class="sl2-hook-eyebrow">PREVIOUSLY ON</p>
    <h2 class="sl2-hook-title">${esc(
      str(v["hookLine"], "You signed those contracts in July. It is January, and the season has an opinion."),
    )}</h2>
    ${beat !== null ? `<p class="sl2-hook-beat">BEAT ${beat + 1}</p>` : ""}
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
  const verb = draftKind === "sign" ? "SIGNING" : draftKind === "waive" ? "WAIVING" : "PASSING";
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

function bindCommitCapture(host: HTMLElement, v: V, submit: Submit): void {
  const panelEl = host.querySelector<HTMLElement>("#sl2Capture");
  if (!panelEl) return;
  panelEl.querySelectorAll<HTMLButtonElement>(".sl2-chip").forEach((b) => {
    b.addEventListener("click", () => {
      chip = b.dataset["chip"] ?? null;
      mountKey = "";
      renderSameLineL2(str(v["phase"]), v, host, submit);
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
    renderSameLineL2(str(v["phase"]), v, host, submit);
  });
  panelEl.querySelector("#sl2Lock")?.addEventListener("click", () => {
    if (!chip || !line.trim() || !draftKind) return;
    error = null;
    if (draftKind === "sign") {
      submit({
        type: "sign",
        playerId: draftTarget,
        tool: tool ?? "minimum",
        ...(term !== null ? { years: term } : {}),
        ...(annual !== null ? { annual } : {}),
        chip,
        line: line.trim(),
      });
    } else if (draftKind === "waive") {
      submit({ type: "waive", contractId: draftTarget, chip, line: line.trim() });
    } else {
      submit({ type: "pass", role: draftTarget ?? undefined, chip, line: line.trim() });
    }
    clearDraft();
  });
}

/* -------------------------------------------------------------- board -- */

function offerMath(card: V) {
  const best = rec(card["best"]);
  const tools = arr(card["tools"]);
  const chosen = tools.find((t) => str(t["tool"]) === tool) ?? best;
  const max = num(chosen["max"], num(best["max"]));
  const ask = num(card["ask"]);
  const lo = Math.min(ask, max || ask);
  const value = annual === null ? Math.min(ask, max || ask) : Math.max(lo, Math.min(max || ask, annual));
  const maxYears = num(chosen["maxYears"], num(chosen["years"], num(best["years"], 1)));
  const choosesTerm = card["choosesTerm"] === true && maxYears > 1;
  const years = choosesTerm ? Math.max(1, Math.min(maxYears, term ?? maxYears)) : num(chosen["years"], num(best["years"], 1));
  const fill = max > lo ? Math.round(((value - lo) / (max - lo)) * 100) : 100;
  return { best, tools, chosen, max, ask, lo, value, maxYears, choosesTerm, years, fill };
}

function boardRow(c: V): string {
  const reach = c["reachable"] !== false;
  const id = str(c["id"]);
  const selected = draftTarget === id && draftKind === "sign";
  return `
  <button type="button" class="sl2-row" data-player="${esc(id)}" data-reach="${reach ? "yes" : "no"}"
          aria-pressed="${selected ? "true" : "false"}"${reach ? "" : " disabled"}>
    <span class="sl2-row-name">${esc(str(c["name"]))}</span>
    <span class="sl2-row-role">${esc(str(c["role"]))}</span>
    <span class="sl2-row-ask">${esc(str(c["askText"]))}</span>
    ${reach ? "" : `<span class="sl2-row-why">${esc(str(c["unreachableReason"]))}</span>`}
  </button>`;
}

function composer(card: V, band: string, round: string): string {
  const { tools, chosen, ask, value, maxYears, choosesTerm, years } = offerMath(card);
  // January is the ten-day window: minimum salary, no negotiation, no dial
  // (spec §3 ROUND 1 — "uncontested", "the depth is generic"). February opens
  // real choice for the 7-8 band only (spec §8 `maxVariables`).
  const canChooseTerms = round === "FEBRUARY" && band === "7-8";
  const toolButtons =
    canChooseTerms && tools.length > 1
      ? `<div class="sl2-tools" role="group" aria-label="How you pay">${tools
          .map(
            (t) =>
              `<button type="button" class="sl2-tool" data-tool="${esc(str(t["tool"]))}" aria-pressed="${
                str(t["tool"]) === str(chosen["tool"]) ? "true" : "false"
              }">${esc(str(t["label"]))}<small>up to ${esc(str(t["maxText"]))}</small></button>`,
          )
          .join("")}</div>`
      : "";
  const termButtons =
    canChooseTerms && choosesTerm
      ? `<div class="sl2-term" role="group" aria-label="How many years">
          <span class="sl2-term-lab">FOR HOW LONG</span>
          <div class="sl2-term-row">${Array.from({ length: maxYears }, (_, i) => i + 1)
            .map((y) => `<button type="button" class="sl2-term-btn" data-years="${y}" aria-pressed="${y === years ? "true" : "false"}">${y}<small>yr${y === 1 ? "" : "s"}</small></button>`)
            .join("")}</div>
        </div>`
      : "";
  const dial =
    canChooseTerms
      ? `<div class="sl2-dial" style="--sl-fill:${offerMath(card).fill}%">
          <input type="range" id="sl2Dial" min="${offerMath(card).lo}" max="${offerMath(card).max}" step="100000" value="${value}"
                 aria-label="How much you offer each year">
        </div>`
      : "";
  return `
  <div class="sl2-compose">
    <p class="sl2-compose-ask">${round === "JANUARY" ? "Minimum salary" : `He is asking ${esc(str(card["askText"], dollars(ask)))} a year`}</p>
    ${toolButtons}
    ${termButtons}
    ${dial}
    <div class="sl2-money"><span id="sl2Read">${dollars(value)}</span><span class="sl2-money-per">A YEAR</span></div>
    <button type="button" class="sl-commit" id="sl2Sign">${round === "JANUARY" ? "SIGN THE TEN-DAY" : "PUT THE OFFER IN"}</button>
  </div>`;
}

function pendingCard(pending: V, board: V[]): string {
  const card = board.find((c) => str(c["id"]) === str(pending["playerId"]));
  return `
  <div class="sl-committed">
    <p class="sl-committed-lab">YOUR MOVE IS IN</p>
    <h2 class="sl-committed-name">${esc(str(card?.["name"], "your player"))}</h2>
    <p class="sl-committed-note">Windows close all at once. Nobody sees anybody else's move until they do.</p>
  </div>`;
}

function pocketsPanel(v: V): string {
  const pockets = arr(v["pockets"]);
  if (pockets.length === 0) return "";
  return panel(
    { title: "OPEN JOBS ON YOUR DESK" },
    `<div class="sl2-pockets">${pockets
      .map(
        (p) => `
      <div class="sl2-pocket" data-filled="${bool(p["filled"]) ? "yes" : "no"}">
        <span class="sl2-pocket-role">${esc(str(p["role"]))}</span>
        <span class="sl2-pocket-state">${bool(p["filled"]) ? "FILLED" : "OPEN"}</span>
        ${
          !bool(p["filled"])
            ? `<button type="button" class="sl2-pocket-pass" data-role="${esc(str(p["role"]))}">HOLD FOR FEBRUARY</button>`
            : ""
        }
      </div>`,
      )
      .join("")}</div>`,
  );
}

function wallPanel(v: V): string {
  const wall = rec(v["wall"]);
  if (Object.keys(wall).length === 0) {
    return panel({ title: "YOUR WALL" }, `<p class="sl2-note">No wall drawn yet.</p>`);
  }
  return panel(
    { title: "YOUR WALL" },
    `<p class="sl2-wall-amount">${esc(str(wall["amountText"], "—"))}</p>
     ${wall["attribution"] ? `<p class="sl2-wall-attr">${esc(str(wall["attribution"]))}</p>` : ""}`,
  );
}

function roleAskPanel(v: V): string {
  const roleAsk = v["roleAsk"];
  const rows = Array.isArray(roleAsk)
    ? arr(roleAsk)
    : roleAsk && typeof roleAsk === "object"
      ? Object.entries(roleAsk as V).map(([role, askText]) => ({ role, askText }) as V)
      : [];
  if (rows.length === 0) return "";
  return panel(
    { title: "GOING RATE BY JOB" },
    `<dl class="sl2-roleask">${rows
      .map((r) => `<div><dt>${esc(str(r["role"]))}</dt><dd>${esc(str(r["askText"]))}</dd></div>`)
      .join("")}</dl>`,
  );
}

function marketMain(v: V, round: string): string {
  const board = arr(v["board"]);
  const pending = v["pending"] ? rec(v["pending"]) : null;
  const band = str(v["band"], "5-6");
  const card = draftKind === "sign" && draftTarget ? board.find((c) => str(c["id"]) === draftTarget) : undefined;

  const right = pending
    ? pendingCard(pending, board)
    : card
      ? `<div class="sl2-card"><h3 class="sl2-card-name">${esc(str(card["name"]))}</h3><p class="sl2-card-role">${esc(
          str(card["role"]),
        )}</p>${composer(card, band, round)}</div>`
      : `<div class="sl-note">Pick somebody off the board, or hold a job open for the next window.</div>`;

  return `
  <div class="sl-play">
    <div class="sl-left">
      ${panel(
        { title: round === "JANUARY" ? "THE TEN-DAY MARKET" : "THE BUYOUT MARKET", note: `${board.length} on the wire` },
        `<div class="sl2-board">${board.map(boardRow).join("")}</div>`,
      )}
      ${pocketsPanel(v)}
    </div>
    <div>
      ${right}
      ${commitCapturePanel(v)}
    </div>
  </div>`;
}

/* --------------------------------------------------------- consequence -- */

function consequenceMain(v: V): string {
  const wall = rec(v["wall"]);
  return `
  <div class="sl2-consequence">
    <p class="sl2-hook-eyebrow">THE TAX CLOCK</p>
    <h2 class="sl2-hook-title">${esc(str(v["taxClockLine"], "The bill is read on what the season ends with, not on what July signed."))}</h2>
    ${wall["amountText"] ? `<p class="sl2-wall-amount">${esc(str(wall["amountText"]))}</p>` : ""}
    ${wall["attribution"] ? `<p class="sl2-wall-attr">${esc(str(wall["attribution"]))}</p>` : ""}
  </div>`;
}

/* --------------------------------------------------------------- tape -- */

function tapeEntryCard(t: V, i: number): string {
  const known = rec(t["known"]);
  const chose = rec(t["chose"]);
  const forgone = rec(t["forgone"]);
  const result = t["result"] ? rec(t["result"]) : null;
  const options = arr(t["options"]);
  return `
  <div class="sl2-tape-card">
    <p class="sl2-tape-eyebrow">TAPE ${i + 1} · ${esc(str(t["round"]))}</p>
    <p class="sl2-tape-chose">${
      chose["passed"] === true ? "You passed." : `You chose ${esc(str(chose["name"], "somebody"))}.`
    }</p>
    ${
      options.length
        ? `<div class="sl2-tape-options"><p class="sl2-tape-lab">WHAT ELSE WAS ON THE BOARD</p><ul>${options
            .map((o) => `<li>${esc(str(o["name"]))} — ${esc(str(o["price"], ""))}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${
      arr(forgone["names"]).length
        ? `<p class="sl2-tape-forgone">GAVE UP: ${arr(forgone["names"]).map((n) => esc(String(n))).join(", ")}</p>`
        : ""
    }
    ${result ? `<p class="sl2-tape-result">${esc(str(result["verdict"], ""))}</p>` : ""}
    ${known["openJobs"] !== undefined ? `<p class="sl2-tape-known">${num(known["openJobs"])} jobs open at the time</p>` : ""}
  </div>`;
}

function tapeMain(v: V): string {
  const tape = arr(v["tape"]);
  if (tape.length === 0) return `<div class="sl-note">Nothing on your tape yet.</div>`;
  return `<div class="sl2-tape">${tape.map(tapeEntryCard).join("")}</div>`;
}

function argueMain(v: V): string {
  return `
  <div class="sl2-argue">
    <p class="sl2-hook-eyebrow">MAKE YOUR CASE</p>
    <h2 class="sl2-hook-title">${esc(str(v["argueLine"], "What would have to be true for you to be wrong?"))}</h2>
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

function forgonePanel(v: V): string {
  const forgone = v["yourForgone"];
  const items = arr(forgone);
  if (items.length === 0) return "";
  return panel(
    { title: "WHAT IT COST YOU" },
    `<div class="sl-forgone">${items
      .map((f) => {
        const names = arr(f["names"]).length ? arr(f["names"]).map((n) => esc(String(n))).join(", ") : esc(String(f));
        return `<div class="sl-forgone-item"><span class="sl-forgone-name">${names}</span></div>`;
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
      host.innerHTML = `<div class="sl-note" style="margin:24px;">${
        str(v["observerEyebrow"]) ? `<strong>${esc(str(v["observerEyebrow"]))}</strong>` : ""
      }<p style="margin:8px 0 0">${esc(str(v["message"], "You're in."))}</p></div>`;
      mountKey = "";
      return;
    }
    const choices = arr(v["choices"]);
    if (v["canChoose"] !== true || choices.length === 0) {
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
      main = argueMain(v);
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
    board.map((c) => str(c["id"])).join(","),
    v["pending"] ? str(rec(v["pending"])["playerId"]) : "-",
    draftKind ?? "-",
    draftTarget ?? "-",
    tool ?? "-",
    term === null ? "-" : String(term),
    chip ?? "-",
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
  const board = arr(v["board"]);
  const phase = str(v["phase"]);

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-row[data-reach='yes']"))) {
    el.addEventListener("click", () => {
      const id = el.dataset["player"] ?? null;
      draftKind = draftKind === "sign" && draftTarget === id ? null : "sign";
      draftTarget = draftKind ? id : null;
      tool = null;
      annual = null;
      term = null;
      chip = null;
      line = "";
      error = null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-tool"))) {
    el.addEventListener("click", () => {
      tool = el.dataset["tool"] ?? null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }
  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-term-btn"))) {
    el.addEventListener("click", () => {
      term = Number(el.dataset["years"]);
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }
  const dial = host.querySelector<HTMLInputElement>("#sl2Dial");
  const read = host.querySelector<HTMLElement>("#sl2Read");
  dial?.addEventListener("input", () => {
    annual = Number(dial.value);
    if (read) read.textContent = dollars(annual);
  });

  host.querySelector("#sl2Sign")?.addEventListener("click", () => {
    // Staging only — this becomes a real `sign` once commit capture (chip +
    // line) is filled in `bindCommitCapture`.
    if (!draftTarget) return;
    const card = board.find((c) => str(c["id"]) === draftTarget);
    if (!card) return;
    const { chosen } = offerMath(card);
    tool = str(chosen["tool"], "minimum");
    error = null;
    mountKey = "";
    renderSameLineL2(phase, v, host, submit);
  });

  for (const el of Array.from(host.querySelectorAll<HTMLButtonElement>(".sl2-pocket-pass"))) {
    el.addEventListener("click", () => {
      draftKind = "pass";
      draftTarget = el.dataset["role"] ?? null;
      chip = null;
      line = "";
      error = null;
      mountKey = "";
      renderSameLineL2(phase, v, host, submit);
    });
  }

  bindCommitCapture(host, v, submit);
}
