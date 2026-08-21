import { ApiError, apiFetch } from "../shared/api.js";
import { startPolling } from "../shared/poll.js";
import { loadTeachSessionCode, saveTeachSessionCode } from "../shared/storage.js";

type Lesson = { id: string; title: string; phases: string[] };
type TeacherSeat = { id: string; displayName: string; joinedAt: string; lastSeenAt: string };
type TeacherPayload = {
  session: {
    id: string; code: string; title: string; lessonModuleId: string; phase: string; phases: string[];
    paused: boolean; frozen: boolean; ended: boolean; version: number; hasCheckpoint: boolean;
  };
  seats: TeacherSeat[];
  view: unknown;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const statusEl = $("status");
const setupEl = $("setup");
const roomEl = $("room");
const controlsEl = $("controls");
const rosterEl = $("roster");
const aggregateEl = $("aggregate");

let currentCode: string | null = null;
let poller: { stop: () => void } | null = null;

async function loadLessons(): Promise<void> {
  const { lessons } = await apiFetch<{ lessons: Lesson[] }>("/api/lessons");
  const select = $<HTMLSelectElement>("lesson");
  select.innerHTML = "";
  for (const lesson of lessons) {
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
  saveTeachSessionCode(payload.session.code);
  openSession(payload.session.code);
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
    { onError: (err) => (statusEl.textContent = describeError(err)) },
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
  pill.className = `pill ${pillClass}`;
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

  const roster = $("rosterList");
  roster.innerHTML = "";
  for (const seat of payload.seats) {
    const li = document.createElement("li");
    const joined = new Date(seat.joinedAt).toLocaleTimeString();
    li.innerHTML = `<span>${escapeHtml(seat.displayName)}</span><span class="muted">${joined}</span>`;
    roster.appendChild(li);
  }
  if (payload.seats.length === 0) {
    roster.innerHTML = '<li class="muted">Waiting for students to join…</li>';
  }

  $("aggregateBody").innerHTML = renderAggregate(payload.view);
}

/** The shell renders whatever shape a lesson module's teacherView returns. A tally
 *  object gets a small bar chart; anything else falls back to a readable JSON dump. */
function renderAggregate(view: unknown): string {
  if (view && typeof view === "object" && "tally" in (view as Record<string, unknown>)) {
    const tally = (view as { tally: Record<string, number> }).tally;
    const max = Math.max(1, ...Object.values(tally));
    return Object.entries(tally)
      .map(
        ([key, count]) =>
          `<div class="row" style="margin:4px 0;"><span style="width:70px;">${escapeHtml(key)}</span>
           <div class="bar" style="width:${Math.round((count / max) * 260)}px;"></div>
           <span class="muted">${count}</span></div>`,
      )
      .join("");
  }
  return `<pre class="muted" style="white-space:pre-wrap; margin:0;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendControl(body: Record<string, unknown>): Promise<void> {
  if (!currentCode) return;
  try {
    const payload = await apiFetch<TeacherPayload>(`/api/sessions/${currentCode}/control`, {
      method: "POST",
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
  if (remembered) {
    apiFetch<TeacherPayload>(`/api/sessions/${remembered}/teacher`)
      .then(() => openSession(remembered))
      .catch(() => {
        /* stale/gone — fall through to the create-session form */
      });
  }
});
