import { ApiError, apiFetch } from "../shared/api.js";
import { startPolling } from "../shared/poll.js";

type SessionSummary = { code: string; ended: boolean };
type BoardPayload = {
  phase: string;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  version: number;
  view: Record<string, unknown>;
};

const stage = document.getElementById("stage")!;
const hud = document.getElementById("hud")!;
const backdrop = document.getElementById("backdrop")!;

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

const PEAK_MODES = new Set(["reveal", "synthesis", "consequence"]);

function render(payload: BoardPayload): void {
  setHud(`v${payload.version} · ${payload.phase}`);

  if (payload.ended) {
    backdrop.classList.remove("peak");
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

  const view = payload.view;
  if (view["module"] === "m1l1-draft-day") {
    const mode = String(view["mode"] ?? "");
    backdrop.classList.toggle("peak", PEAK_MODES.has(mode));
    renderDraftDay(view, mode);
    return;
  }

  backdrop.classList.remove("peak");
  const legacy = view as { mode?: string; tally?: Record<string, number>; total?: number; note?: string; pickedCount?: number };

  if (payload.phase === "LOBBY") {
    stage.innerHTML = `<div class="label">Waiting to start</div>`;
    return;
  }
  if (legacy?.mode === "reveal" || legacy?.mode === "synthesis") {
    const tally = legacy.tally ?? {};
    const max = Math.max(1, ...Object.values(tally));
    const bars = Object.entries(tally)
      .map(
        ([color, count]) => `
        <div class="barwrap"><div class="barcount">${count}</div>
        <div class="stack" style="height:${Math.max(4, Math.round((count / max) * 100))}%;"><div class="seg" style="height:100%; background:${color};"></div></div>
        <div class="barlabel">${color}</div></div>`,
      )
      .join("");
    stage.innerHTML = `<div class="label">${legacy.mode === "synthesis" ? "Synthesis" : "Reveal"}</div><div class="bars">${bars}</div>
      ${legacy.mode === "synthesis" && legacy.note ? `<div class="synthesis-note">${legacy.note}</div>` : ""}`;
    return;
  }
  if (legacy?.mode === "waiting") {
    stage.innerHTML = `<div class="label">Class is deciding…</div><div class="banner">${legacy.pickedCount ?? 0} picked so far</div>`;
    return;
  }
  stage.innerHTML = `<div class="label">${payload.phase}</div>`;
}

/* ------------------------------------------------------ draft day render -- */

const POSITION_COLOR: Record<string, string> = {
  SCORER: "var(--series-1)",
  PLAYMAKER: "var(--series-2)",
  DEFENDER: "var(--series-3)",
  REBOUNDER: "var(--accent-violet)",
  WILDCARD: "var(--accent-blue)",
};

function renderDraftDay(view: Record<string, unknown>, mode: string): void {
  switch (mode) {
    case "lobby":
      stage.innerHTML = `<div class="label">Draft Day</div><div class="banner">Waiting for the room to start — ${view["teamCount"]} pairs joined</div>`;
      return;

    case "hook":
      stage.innerHTML = `<div class="label">Draft Day</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    case "building":
      stage.innerHTML = `
        <div class="label">Class is building</div>
        <div class="kpirow">
          <div class="kpi"><div class="num">${view["lockedCount"]}</div><div class="lbl">Locked</div></div>
          <div class="kpi"><div class="num">${view["totalTeams"]}</div><div class="lbl">Pairs in the room</div></div>
        </div>`;
      return;

    case "reveal": {
      const gallery = view["gallery"] as { spent: number; strategy: string; positions: { slot: string; price: number }[] }[];
      if (gallery.length === 0) {
        stage.innerHTML = `<div class="label">Class Gallery</div><div class="banner">No rosters locked yet.</div>`;
        return;
      }
      const maxSpend = Math.max(1, ...gallery.map((g) => g.spent));
      const bars = gallery
        .map((g) => {
          // Each segment's height is a share of THIS team's own stack (so the five
          // segments always sum to exactly 100% of it); the stack's own height is
          // this team's spend as a share of the class-wide max, so shorter-spend
          // rosters read as visibly shorter columns next to bigger spenders.
          const segs = g.positions
            .map((p) => `<div class="seg" title="${p.slot} $${p.price}M" style="height:${g.spent > 0 ? (p.price / g.spent) * 100 : 0}%; background:${POSITION_COLOR[p.slot] ?? "var(--accent-blue)"};"></div>`)
            .join("");
          return `<div class="barwrap"><div class="barcount">$${g.spent}M</div><div class="stack" style="height:${(g.spent / maxSpend) * 100}%;">${segs}</div><div class="barlabel">${g.strategy}</div></div>`;
        })
        .join("");
      stage.innerHTML = `<div class="label">Class Gallery · ${gallery.length} rosters</div><div class="bars">${bars}</div>
        <div class="synthesis-note">Same $100M start. What do you notice?</div>`;
      return;
    }

    case "consequence":
      stage.innerHTML = `
        <div class="label">The Shock</div>
        <div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>
        <div class="kpirow">
          <div class="kpi"><div class="num">${view["hitCount"]}</div><div class="lbl">of ${view["teamCount"]} rosters hit</div></div>
        </div>`;
      return;

    case "adapt":
      stage.innerHTML = `
        <div class="label">Adapt</div>
        <div class="banner">Every hit roster is repairing its weakest slot within what's left.</div>
        <div class="kpirow"><div class="kpi"><div class="num">${view["repairedCount"]}/${view["hitCount"]}</div><div class="lbl">Repaired so far</div></div></div>`;
      return;

    case "counterfactual":
      stage.innerHTML = `<div class="label">Counterfactual</div><div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    case "argue":
      stage.innerHTML = `<div class="label">Argue It Out</div><div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    case "synthesis": {
      const cards = view["cards"] as { id: string; title: string; body: string }[];
      stage.innerHTML = `
        <div class="label">${escapeHtml(String(view["heading"]))}</div>
        <div class="cardgrid">${cards.map((c) => `<div class="synthcard"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.body)}</p></div>`).join("")}</div>
        <div class="synthesis-note">${escapeHtml(String(view["beyondSports"]))}</div>
        <div class="exit-prompt">${escapeHtml(String(view["exitPrompt"]))}</div>`;
      return;
    }

    case "complete":
      stage.innerHTML = `<div class="label">Draft Day Complete</div><div class="banner">Nice work, GMs. These rosters come back next class.</div>`;
      return;

    default:
      stage.innerHTML = `<div class="label">${escapeHtml(mode)}</div>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
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
