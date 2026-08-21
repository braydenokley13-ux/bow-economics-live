import { ApiError, apiFetch } from "../shared/api.js";
import { startPolling } from "../shared/poll.js";

type SessionSummary = { code: string; ended: boolean };
type BoardPayload = {
  phase: string;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  version: number;
  view: unknown;
};

const stage = document.getElementById("stage")!;
const hud = document.getElementById("hud")!;

function setHud(text: string): void {
  hud.textContent = text;
}

async function resolveCode(): Promise<string | null> {
  const fromQuery = new URL(location.href).searchParams.get("code");
  if (fromQuery) return fromQuery.toUpperCase();
  try {
    const { sessions } = await apiFetch<{ sessions: SessionSummary[] }>("/api/sessions");
    const active = sessions.find((s) => !s.ended);
    return active?.code ?? null;
  } catch {
    return null;
  }
}

function render(payload: BoardPayload): void {
  setHud(`v${payload.version} · ${payload.phase}`);

  if (payload.ended) {
    stage.innerHTML = `<div class="label">Session complete</div><div class="banner">Thanks, everyone!</div>`;
    return;
  }
  if (payload.frozen) {
    stage.innerHTML = `<div class="label">Frozen</div>`;
    return;
  }
  if (payload.paused) {
    stage.innerHTML = `<div class="label">Paused</div>`;
    return;
  }

  const view = payload.view as { mode?: string; tally?: Record<string, number>; total?: number; note?: string; pickedCount?: number };

  if (payload.phase === "LOBBY") {
    stage.innerHTML = `<div class="label">Waiting to start</div>`;
    return;
  }

  if (view?.mode === "reveal" || view?.mode === "synthesis") {
    const tally = view.tally ?? {};
    const max = Math.max(1, ...Object.values(tally));
    const bars = Object.entries(tally)
      .map(
        ([color, count]) => `
        <div class="barwrap">
          <div class="barcount">${count}</div>
          <div class="bar ${color}" style="height:${Math.max(4, Math.round((count / max) * 100))}%;"></div>
          <div class="barlabel">${color}</div>
        </div>`,
      )
      .join("");
    stage.innerHTML = `
      <div class="label">${view.mode === "synthesis" ? "Synthesis" : "Reveal"}</div>
      <div class="bars">${bars}</div>
      ${view.mode === "synthesis" && view.note ? `<div class="synthesis-note">${view.note}</div>` : ""}
    `;
    return;
  }

  if (view?.mode === "waiting") {
    stage.innerHTML = `<div class="label">Class is deciding…</div><div class="banner">${view.pickedCount ?? 0} picked so far</div>`;
    return;
  }

  stage.innerHTML = `<div class="label">${payload.phase}</div>`;
}

async function boot(): Promise<void> {
  const code = await resolveCode();
  if (!code) {
    stage.innerHTML = `<div class="label">No active session</div><div class="sub">Ask your teacher to start one at /teach</div>`;
    setTimeout(() => void boot(), 3000);
    return;
  }
  startPolling<BoardPayload>(`/api/sessions/${code}/board`, 1000, render, {
    onError: (error) => {
      setHud(error instanceof ApiError && error.status === 404 ? "session ended — looking for a new one" : "reconnecting…");
      if (error instanceof ApiError && error.status === 404) {
        setTimeout(() => void boot(), 2000);
      }
    },
  });
}

void boot();
