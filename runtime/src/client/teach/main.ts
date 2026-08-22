import { ApiError, apiFetch } from "../shared/api.js";
import { crestStyle } from "../shared/crest.js";
import { startPolling } from "../shared/poll.js";
import { loadTeachSessionCode, loadTeachSessionKey, saveTeachSessionCode, saveTeachSessionKey } from "../shared/storage.js";

type Lesson = { id: string; title: string; phases: string[] };
type TeacherSeat = { id: string; displayName: string; joinedAt: string; lastSeenAt: string; rejoinLocked: boolean };
type TeacherPayload = {
  session: {
    id: string; code: string; title: string; lessonModuleId: string; phase: string; phases: string[];
    paused: boolean; frozen: boolean; ended: boolean; version: number; hasCheckpoint: boolean;
  };
  teacherKey?: string;
  seats: TeacherSeat[];
  view: Record<string, unknown>;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const statusEl = $("status");
const setupEl = $("setup");
const roomEl = $("room");
const controlsEl = $("controls");
const rosterEl = $("roster");
const aggregateEl = $("aggregate");

let currentCode: string | null = null;
// R1: the per-session teacher credential — required on every /control and
// GET /teacher call from here on. Held in memory plus localStorage (see
// storage.ts) so a page refresh doesn't strand the teacher outside their
// own room.
let teacherKey: string | null = null;
let poller: { stop: () => void } | null = null;

async function loadLessons(): Promise<void> {
  const { lessons } = await apiFetch<{ lessons: Lesson[] }>("/api/lessons");
  const select = $<HTMLSelectElement>("lesson");
  select.innerHTML = "";
  // Draft Day first — this is the module the teacher actually runs class with.
  const ordered = [...lessons].sort((a, b) => (a.id === "m1l1-draft-day" ? -1 : b.id === "m1l1-draft-day" ? 1 : 0));
  for (const lesson of ordered) {
    const option = document.createElement("option");
    option.value = lesson.id;
    option.textContent = `${lesson.title} (${lesson.phases.join(" → ")})`;
    select.appendChild(option);
  }
}

async function createSession(): Promise<void> {
  const lessonModuleId = $<HTMLSelectElement>("lesson").value;
  const title = $<HTMLInputElement>("title").value.trim();
  const payload = await apiFetch<TeacherPayload>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ lessonModuleId, title }),
  });
  if (!payload.teacherKey) {
    statusEl.textContent = "server did not issue a teacher key — cannot continue safely";
    return;
  }
  teacherKey = payload.teacherKey;
  saveTeachSessionCode(payload.session.code);
  saveTeachSessionKey(payload.teacherKey);
  openSession(payload.session.code);
}

function authHeaders(): Record<string, string> {
  return teacherKey ? { Authorization: `Bearer ${teacherKey}` } : {};
}

function openSession(code: string): void {
  currentCode = code;
  setupEl.hidden = true;
  roomEl.hidden = false;
  controlsEl.hidden = false;
  rosterEl.hidden = false;
  aggregateEl.hidden = false;
  $("joinUrl").textContent = `${location.origin}/play`;
  $("code").textContent = code;
  poller?.stop();
  poller = startPolling<TeacherPayload>(
    `/api/sessions/${code}/teacher`,
    1500,
    render,
    {
      headers: authHeaders,
      onError: (err) => {
        if (err instanceof ApiError && err.status === 401) {
          statusEl.textContent = "teacher key rejected — this room can no longer be controlled from here";
          poller?.stop();
          return;
        }
        statusEl.textContent = describeError(err);
      },
    },
  );
}

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "error" in (err as Record<string, unknown>)) {
    const e = (err as { error?: { message?: string } }).error;
    return e?.message ?? "connection trouble — retrying";
  }
  return "connection trouble — retrying";
}

function render(payload: TeacherPayload): void {
  statusEl.textContent = `live · v${payload.session.version}`;
  const s = payload.session;
  const pillClass = s.ended ? "ended" : s.frozen ? "frozen" : s.paused ? "paused" : "live";
  const pillText = s.ended ? "ENDED" : s.frozen ? "FROZEN" : s.paused ? "PAUSED" : "LIVE";
  const pill = $("statePill");
  pill.className = `pill pill-${pillClass === "live" ? "comfortable" : pillClass === "paused" ? "tight" : "at-cap"}`;
  pill.textContent = pillText;
  $("seatCount").textContent = `${payload.seats.length} joined`;

  const phaseRow = $("phaseRow");
  phaseRow.innerHTML = "";
  const currentIdx = s.phases.indexOf(s.phase);
  s.phases.forEach((phase, idx) => {
    const chip = document.createElement("span");
    chip.className = `phasechip ${idx === currentIdx ? "current" : idx < currentIdx ? "done" : ""}`;
    chip.textContent = phase;
    phaseRow.appendChild(chip);
  });

  $<HTMLButtonElement>("btnAdvance").disabled = s.ended || currentIdx === s.phases.length - 1;
  $<HTMLButtonElement>("btnReveal").disabled = s.ended || !s.phases.includes("REVEAL");
  $<HTMLButtonElement>("btnPause").disabled = s.ended;
  $<HTMLButtonElement>("btnPause").textContent = s.paused ? "Unpause" : "Pause";
  $<HTMLButtonElement>("btnFreeze").disabled = s.ended;
  $<HTMLButtonElement>("btnFreeze").textContent = s.frozen ? "Unfreeze" : "Freeze";
  $<HTMLButtonElement>("btnRestore").disabled = !s.hasCheckpoint;
  $<HTMLButtonElement>("btnEnd").disabled = s.ended;
  // The shock is Draft Day's own consequence hook and only ever makes sense in CONSEQUENCE.
  // The Box Office needs neither manual hook — its CONSEQUENCE and COUNTERFACTUAL states are
  // computed automatically from the price/zone already stored at lock time, not teacher-triggered.
  const isDraftDay = s.lessonModuleId === "m1l1-draft-day";
  $<HTMLButtonElement>("btnShock").hidden = !isDraftDay;
  $<HTMLButtonElement>("btnShock").disabled = s.ended || s.phase !== "CONSEQUENCE";
  $<HTMLButtonElement>("btnCounterfactual").hidden = isDraftDay || s.lessonModuleId === "m2-box-office";

  const roster = $("rosterList");
  roster.innerHTML = "";
  for (const seat of payload.seats) {
    const li = document.createElement("li");
    const joined = new Date(seat.joinedAt).toLocaleTimeString();
    li.innerHTML = `<span>${escapeHtml(seat.displayName)}</span>`;
    const right = document.createElement("span");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "8px";
    if (seat.rejoinLocked) {
      // R3: a visible, one-click way for the teacher to clear a seat's rejoin lockout.
      const warn = document.createElement("span");
      warn.className = "pill pill-tight";
      warn.style.fontSize = "10px";
      warn.textContent = "PIN LOCKED";
      const unlockBtn = document.createElement("button");
      unlockBtn.className = "btn";
      unlockBtn.style.fontSize = "11px";
      unlockBtn.style.padding = "3px 8px";
      unlockBtn.textContent = "Unlock";
      unlockBtn.addEventListener("click", () => void unlockSeat(seat.id));
      right.appendChild(warn);
      right.appendChild(unlockBtn);
    }
    const time = document.createElement("span");
    time.style.color = "var(--ink-muted)";
    time.textContent = joined;
    right.appendChild(time);
    li.appendChild(right);
    roster.appendChild(li);
  }
  if (payload.seats.length === 0) {
    roster.innerHTML = '<li style="color:var(--ink-muted);">Waiting for students to join…</li>';
  }

  $("aggregateBody").innerHTML = "";
  $("aggregateBody").appendChild(renderAggregate(payload.view, payload.seats));
}

async function unlockSeat(seatId: string): Promise<void> {
  if (!currentCode) return;
  try {
    await apiFetch(`/api/sessions/${currentCode}/seats/${seatId}/unlock`, { method: "POST", headers: authHeaders() });
  } catch (error) {
    statusEl.textContent = error instanceof ApiError ? error.message : "could not unlock that seat";
  }
}

/** The shell renders whatever shape a lesson module's teacherView returns: Draft Day gets a
 *  purpose-built per-pair tile grid; a tally object gets a small bar chart; anything else
 *  falls back to a readable JSON dump. */
function renderAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  if (view["module"] === "m1l1-draft-day") return renderDraftDayAggregate(view, seats);
  if (view["module"] === "m2-box-office") return renderBoxOfficeAggregate(view, seats);

  const wrap = document.createElement("div");
  if (view && typeof view === "object" && "tally" in view) {
    const tally = (view as { tally: Record<string, number> }).tally;
    const max = Math.max(1, ...Object.values(tally));
    wrap.innerHTML = Object.entries(tally)
      .map(
        ([key, count]) =>
          `<div class="row" style="margin:4px 0;"><span style="width:70px;">${escapeHtml(key)}</span>
           <div class="bar" style="width:${Math.round((count / max) * 260)}px;"></div>
           <span style="color:var(--ink-muted);">${count}</span></div>`,
      )
      .join("");
    return wrap;
  }
  wrap.innerHTML = `<pre style="color:var(--ink-muted); white-space:pre-wrap; margin:0;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
  return wrap;
}

type Franchise = { name: string; crestIndex: number };
type TeamStat = {
  seatId: string;
  franchise: Franchise | null;
  locked: boolean; filled: number; spent: number; remaining: number; capState: "comfortable" | "tight" | "at-cap";
  strategy: string | null; shocked: boolean; repaired: boolean | null;
};
type Aggregate = {
  totalTeams: number; lockedTeams: number; spentToCapCount: number; avgSpent: number;
  starSignerCount: number; starSignerCheapFillCount: number; balancedCount: number;
  strategyCounts: Record<string, number>; hitCount: number; repairedCount: number; shockApplied: boolean;
};

function renderDraftDayAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const teams = view["teams"] as TeamStat[];
  const agg = view["aggregate"] as Aggregate;
  const wrap = document.createElement("div");
  // G4: look up each team's own seat by seatId — teacherView is explicitly
  // seat-identifying (only boardView is not) — rather than assuming the
  // two arrays share array order, which was never actually guaranteed
  // (a team's entry appears on its first *placement*, not on join).
  const seatById = new Map(seats.map((s) => [s.id, s]));

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${view["lockedCount"]}/${view["teamCount"]}</div><div class="lbl">Locked</div></div>
    <div class="kpi"><div class="num">${agg.spentToCapCount}</div><div class="lbl">Spent to cap</div></div>
    <div class="kpi"><div class="num">$${agg.avgSpent}M</div><div class="lbl">Avg spend</div></div>
    <div class="kpi"><div class="num">${agg.starSignerCount}</div><div class="lbl">Signed a $60M star</div></div>
    ${agg.shockApplied ? `<div class="kpi"><div class="num">${agg.repairedCount}/${agg.hitCount}</div><div class="lbl">Repaired after shock</div></div>` : ""}
  `;
  wrap.appendChild(kpis);

  const strategyRow = document.createElement("div");
  strategyRow.style.marginBottom = "14px";
  const maxStrat = Math.max(1, ...Object.values(agg.strategyCounts));
  strategyRow.innerHTML = Object.entries(agg.strategyCounts)
    .map(
      ([k, v]) =>
        `<div class="row" style="margin:3px 0;"><span style="width:110px; font-size:12px; color:var(--ink-secondary);">${escapeHtml(k)}</span>
         <div class="bar" style="width:${Math.round((v / maxStrat) * 260)}px; background:var(--accent-violet);"></div>
         <span style="color:var(--ink-muted); font-size:12px;">${v}</span></div>`,
    )
    .join("");
  wrap.appendChild(strategyRow);

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  teams.forEach((t) => {
    const seat = seatById.get(t.seatId);
    const tile = document.createElement("div");
    tile.className = "teamtile";
    const franchiseRow = t.franchise
      ? `<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"><span style="${crestStyle(t.franchise.crestIndex, 16)}"></span><strong>${escapeHtml(t.franchise.name)}</strong></div>`
      : `<strong>${seat ? escapeHtml(seat.displayName) : "Not started"}</strong>`;
    tile.innerHTML = `
      ${franchiseRow}
      <div class="statline"><span>${seat ? escapeHtml(seat.displayName) : ""}</span><span>${t.locked ? "locked" : `${t.filled}/5`}</span></div>
      <div class="statline"><span class="pill pill-${t.capState}" style="font-size:10px;">$${t.spent}M</span><span>${t.strategy ? escapeHtml(t.strategy) : ""}</span></div>
      ${t.shocked ? `<div class="statline"><span>${t.repaired ? "repaired" : "⚡ hit"}</span><span></span></div>` : ""}
    `;
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ---------------------------------------------------- box office aggregate -- */

type BoxMarket = { id: string; name: string; flavor: string };
type BoxSeatStat = {
  seatId: string;
  market: BoxMarket | null;
  currentPrice: number | null;
  priceH1: number | null;
  priceH2: number | null;
  zone: string | null;
  h1Locked: boolean;
  h2Locked: boolean;
};
type BoxAggregate = {
  totalPairs: number;
  h1LockedCount: number;
  h2LockedCount: number;
  zoneCounts: { over: number; under: number; sweet: number };
  avgPriceH1: number | null;
  avgPriceH2: number | null;
  payrollClearedH1Count: number;
  payrollClearedH2Count: number;
};

function renderBoxOfficeAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const boxSeats = (view["seats"] as BoxSeatStat[]) ?? [];
  const agg = view["aggregate"] as BoxAggregate;
  const wrap = document.createElement("div");
  const seatById = new Map(seats.map((s) => [s.id, s]));

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${agg.h1LockedCount}/${agg.totalPairs}</div><div class="lbl">Homestand 1 locked</div></div>
    <div class="kpi"><div class="num">${agg.h2LockedCount}/${agg.totalPairs}</div><div class="lbl">Homestand 2 locked</div></div>
    <div class="kpi"><div class="num">${agg.avgPriceH1 ?? "—"}</div><div class="lbl">Avg H1 price</div></div>
    <div class="kpi"><div class="num">${agg.payrollClearedH1Count}</div><div class="lbl">Cleared payroll (H1)</div></div>
  `;
  wrap.appendChild(kpis);

  const zoneRow = document.createElement("div");
  zoneRow.style.marginBottom = "14px";
  const maxZone = Math.max(1, agg.zoneCounts.over, agg.zoneCounts.under, agg.zoneCounts.sweet);
  const zoneEntries: [string, number, string][] = [
    ["Overpriced", agg.zoneCounts.over, "var(--over-the-line)"],
    ["Underpriced", agg.zoneCounts.under, "var(--cap-tight)"],
    ["Sweet spot", agg.zoneCounts.sweet, "var(--cap-safe)"],
  ];
  zoneRow.innerHTML = zoneEntries
    .map(
      ([label, count, color]) =>
        `<div class="row" style="margin:3px 0;"><span style="width:110px; font-size:12px; color:var(--ink-secondary);">${label}</span>
         <div class="bar" style="width:${Math.round((count / maxZone) * 260)}px; background:${color};"></div>
         <span style="color:var(--ink-muted); font-size:12px;">${count}</span></div>`,
    )
    .join("");
  wrap.appendChild(zoneRow);

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  boxSeats.forEach((bs) => {
    const seat = seatById.get(bs.seatId);
    const tile = document.createElement("div");
    tile.className = "teamtile";
    const priceLine = bs.h1Locked
      ? `H1 $${bs.priceH1}${bs.h2Locked ? ` → H2 $${bs.priceH2}` : ""}`
      : bs.currentPrice != null
        ? `dragging: $${bs.currentPrice}`
        : "not started";
    tile.innerHTML = `
      <strong>${seat ? escapeHtml(seat.displayName) : bs.seatId}</strong>
      <div class="statline"><span>${bs.market ? escapeHtml(bs.market.name) : "—"}</span><span>${bs.zone ? bs.zone.toUpperCase() : ""}</span></div>
      <div class="statline"><span>${escapeHtml(priceLine)}</span><span>${bs.h1Locked ? (bs.h2Locked ? "H2 locked" : "H1 locked") : ""}</span></div>
    `;
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendControl(body: Record<string, unknown>): Promise<void> {
  if (!currentCode) return;
  try {
    const payload = await apiFetch<TeacherPayload>(`/api/sessions/${currentCode}/control`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    render(payload);
  } catch (error) {
    statusEl.textContent = error instanceof ApiError ? error.message : "control action failed";
  }
}

$("create").addEventListener("click", () => void createSession().catch((e) => (statusEl.textContent = String(e))));
$("btnAdvance").addEventListener("click", () => void sendControl({ type: "advance" }));
$("btnReveal").addEventListener("click", () => void sendControl({ type: "reveal" }));
$("btnPause").addEventListener("click", () => {
  const paused = $("btnPause").textContent === "Unpause";
  void sendControl({ type: paused ? "unpause" : "pause" });
});
$("btnFreeze").addEventListener("click", () => {
  const frozen = $("btnFreeze").textContent === "Unfreeze";
  void sendControl({ type: frozen ? "unfreeze" : "freeze" });
});
$("btnRestore").addEventListener("click", () => void sendControl({ type: "restore" }));
$("btnEnd").addEventListener("click", () => {
  if (confirm("End this session? Students will no longer be able to act.")) void sendControl({ type: "end" });
});
$("btnShock").addEventListener("click", () => void sendControl({ type: "hook", hook: "shock" }));
$("btnCounterfactual").addEventListener("click", () => void sendControl({ type: "hook", hook: "counterfactual" }));

void loadLessons().then(() => {
  const remembered = loadTeachSessionCode();
  const rememberedKey = loadTeachSessionKey();
  // R1: without the teacher key there is nothing safe to auto-reopen —
  // fall through to the create-session form rather than guessing.
  if (remembered && rememberedKey) {
    teacherKey = rememberedKey;
    apiFetch<TeacherPayload>(`/api/sessions/${remembered}/teacher`, { headers: authHeaders() })
      .then(() => openSession(remembered))
      .catch(() => {
        teacherKey = null;
        /* stale/gone/wrong key — fall through to the create-session form */
      });
  }
});
