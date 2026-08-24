import { ApiError, apiFetch } from "../shared/api.js";
import { crestStyle } from "../shared/crest.js";
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
  if (view["module"] === "m2-box-office") {
    const mode = String(view["mode"] ?? "");
    backdrop.classList.toggle("peak", PEAK_MODES.has(mode));
    renderBoxOfficeBoard(view, mode);
    return;
  }
  if (view["module"] === "m1l2-trade-deadline") {
    const mode = String(view["mode"] ?? "");
    backdrop.classList.toggle("peak", PEAK_MODES.has(mode));
    renderTradeDeadlineBoard(view, mode);
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
      const gallery = view["gallery"] as {
        franchise: { name: string; crestIndex: number };
        spent: number;
        strategy: string;
        positions: { slot: string; price: number }[];
      }[];
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
          // G4: label every bar with its franchise (crest + fictional name) — never a
          // student name — so a class can point at the projector and say "that's ours!"
          return `<div class="barwrap"><div class="barcount">$${g.spent}M</div><div class="stack" style="height:${(g.spent / maxSpend) * 100}%;">${segs}</div>
            <div class="franchise-badge" style="flex-direction:column; gap:2px;">
              <span style="${crestStyle(g.franchise.crestIndex, 28)}"></span>
              <span class="barlabel" style="font-weight:700; color:var(--ink-primary);">${escapeHtml(g.franchise.name)}</span>
            </div>
            <div class="barlabel">${g.strategy}</div></div>`;
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

/* ------------------------------------------------------ box office render -- */

type Franchise = { name: string; crestIndex: number };
type ScatterPoint = { franchise: Franchise; homestand: 1 | 2; price: number; revenue: number; zone: string | null };

const ZONE_TITLE: Record<string, string> = { over: "Empty Seats", under: "Cash Crunch", sweet: "Raise or Hold" };

function renderBoxOfficeBoard(view: Record<string, unknown>, mode: string): void {
  switch (mode) {
    case "lobby":
      stage.innerHTML = `<div class="label">The Box Office</div><div class="banner">Waiting for the room to start — ${view["pairCount"]} pairs joined</div>`;
      return;

    case "hook":
      stage.innerHTML = `<div class="label">The Box Office</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    case "building":
      stage.innerHTML = `
        <div class="label">Homestand 1 — Setting Prices</div>
        <div class="kpirow">
          <div class="kpi"><div class="num">${view["lockedCount"]}</div><div class="lbl">Locked</div></div>
          <div class="kpi"><div class="num">${view["totalPairs"]}</div><div class="lbl">Pairs in the room</div></div>
        </div>`;
      return;

    case "reveal": {
      const scatter = (view["scatter"] as ScatterPoint[]) ?? [];
      if (scatter.length === 0) {
        stage.innerHTML = `<div class="label">Class Scatter</div><div class="banner">No prices locked yet.</div>`;
        return;
      }
      stage.innerHTML = `
        <div class="label">Class Scatter · Homestand 1</div>
        <div class="banner" style="max-width:70vw;">${scatter.length} price${scatter.length === 1 ? "" : "s"}, ${scatter.length} results. Every dot is a real price one of you set.</div>
        <div class="scatter-wrap">${renderScatterSvg(scatter, { connect: false })}</div>`;
      return;
    }

    case "consequence": {
      const zc = (view["zoneCounts"] as { over: number; under: number; sweet: number }) ?? { over: 0, under: 0, sweet: 0 };
      stage.innerHTML = `
        <div class="label">Homestand 2 Opens</div>
        <div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>
        <div class="kpirow">
          <div class="kpi"><div class="num" style="color:#ff9aa4;">${zc.over}</div><div class="lbl">Empty Seats</div></div>
          <div class="kpi"><div class="num" style="color:#ffd98a;">${zc.under}</div><div class="lbl">Cash Crunch</div></div>
          <div class="kpi"><div class="num" style="color:var(--cap-safe);">${zc.sweet}</div><div class="lbl">Raise or Hold</div></div>
        </div>`;
      return;
    }

    case "adapt":
      stage.innerHTML = `<div class="label">Adapt</div><div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    case "counterfactual":
      stage.innerHTML = `
        <div class="label">Homestand 2 — Setting Prices</div>
        <div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>
        <div class="kpirow">
          <div class="kpi"><div class="num">${view["lockedCount"]}</div><div class="lbl">Locked</div></div>
          <div class="kpi"><div class="num">${view["totalPairs"]}</div><div class="lbl">Pairs back in the room</div></div>
        </div>`;
      return;

    case "argue": {
      const scatter = (view["scatter"] as ScatterPoint[]) ?? [];
      stage.innerHTML = `
        <div class="label">Class Scatter · Both Homestands</div>
        <div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"]))}</div>
        <div class="scatter-wrap">${renderScatterSvg(scatter, { connect: true })}</div>
        <div class="scatter-legend"><span class="legend-dot h1"></span>Homestand 1<span class="legend-dot h2" style="margin-left:14px;"></span>Homestand 2</div>`;
      return;
    }

    case "synthesis": {
      const cards = (view["cards"] as { id: string; title: string; body: string }[]) ?? [];
      stage.innerHTML = `
        <div class="label">${escapeHtml(String(view["heading"]))}</div>
        <div class="synthesis-note" style="max-width:70vw; font-style:italic;">${escapeHtml(String(view["formalization"]))}</div>
        <div class="cardgrid">${cards.map((c) => `<div class="synthcard"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.body)}</p></div>`).join("")}</div>
        <div class="synthesis-note">${escapeHtml(String(view["beyondSports"]))}</div>
        <div class="exit-prompt">${escapeHtml(String(view["exitPrompt"]))}</div>`;
      return;
    }

    case "complete":
      stage.innerHTML = `<div class="label">The Box Office — Complete</div><div class="banner">Nice work, Operators. See you at the next homestand.</div>`;
      return;

    default:
      stage.innerHTML = `<div class="label">${escapeHtml(mode)}</div>`;
  }
}

/* --------------------------------------------------- trade deadline render -- */

type TDFranchise = { name: string; crestIndex: number };
type TDRevealedTarget = { id: string; name: string; position: string; floor: number; ceiling: number; trueValue: number; bidCount: number; winnerFranchise: TDFranchise | null; winningBid: number | null; verdict: "steal" | "curse" | "fair" | "unsold" };
const TD_VERDICT_LABEL: Record<string, string> = { steal: "STEAL", curse: "WINNER'S CURSE", fair: "FAIR PRICE", unsold: "UNSOLD" };
const TD_VERDICT_COLOR: Record<string, string> = { steal: "var(--cap-safe)", curse: "#ff9aa4", fair: "var(--ink-secondary)", unsold: "var(--cap-tight)" };

function renderTradeDeadlineBoard(view: Record<string, unknown>, mode: string): void {
  switch (mode) {
    case "lobby":
      stage.innerHTML = `<div class="label">The Trade Deadline</div><div class="banner">Waiting for the room to start — ${view["teamCount"]} teams joined</div>`;
      return;

    case "hook":
      stage.innerHTML = `<div class="label">Midseason Report</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"]))}</div><div class="kpirow"><div class="kpi"><div class="num">${view["claimedCount"]}</div><div class="lbl">Franchises claimed</div></div></div>`;
      return;

    case "building":
      stage.innerHTML = `
        <div class="label">The Deadline Window Is Open</div>
        <div class="kpirow">
          <div class="kpi"><div class="num">${view["committedCount"]}</div><div class="lbl">Decisions locked in</div></div>
          <div class="kpi"><div class="num">${view["totalTeams"]}</div><div class="lbl">Teams in the room</div></div>
        </div>`;
      return;

    case "reveal": {
      const revealed = (view["revealed"] as TDRevealedTarget[]) ?? [];
      const nextName = view["nextTargetName"] as string | null;
      const allRevealed = Boolean(view["allRevealed"]);
      const cards = revealed
        .map(
          (r) => `
        <div class="synthcard">
          <h3>${escapeHtml(r.name)} <span style="font-size:0.7em; color:var(--ink-muted); text-transform:none; letter-spacing:0;">· ${r.position}</span></h3>
          <p style="margin-bottom:8px;">${r.bidCount} bid${r.bidCount === 1 ? "" : "s"} in.</p>
          ${
            r.winnerFranchise
              ? `<p style="display:flex; align-items:center; gap:8px; margin:0;"><span style="${crestStyle(r.winnerFranchise.crestIndex, 22)}"></span><strong style="color:var(--ink-primary);">${escapeHtml(r.winnerFranchise.name)}</strong> won at <span class="numeric" style="color:var(--accent-gold);">$${r.winningBid}M</span></p>`
              : `<p style="margin:0; color:var(--ink-muted);">${r.bidCount === 0 ? "Nobody bid on this one." : "Every bid came in under the hidden reserve — nobody signed this one."}</p>`
          }
          <p style="margin-top:8px; font-weight:800; color:${TD_VERDICT_COLOR[r.verdict]};">${TD_VERDICT_LABEL[r.verdict]}${r.winnerFranchise ? ` — turned out to be worth about $${r.trueValue}M` : ""}</p>
        </div>`,
        )
        .join("");
      stage.innerHTML = `
        <div class="label">The Reveal</div>
        ${revealed.length > 0 ? `<div class="cardgrid">${cards}</div>` : `<div class="banner">Waiting for the teacher to reveal the first target…</div>`}
        <div class="synthesis-note">${allRevealed ? "Every target has been revealed." : `Next up: ${escapeHtml(nextName ?? "")}`}</div>`;
      return;
    }

    case "adapt":
      stage.innerHTML = `
        <div class="label">Aftermath</div>
        <div class="banner" style="max-width:66vw;">Any team left with an open slot signs a fallback now. Everyone else already has a full wall — nothing left to do.</div>
        <div class="kpirow"><div class="kpi"><div class="num">${view["rescuedCount"]}/${view["openSlotCount"]}</div><div class="lbl">Open slots rescued</div></div></div>`;
      return;

    case "synthesis": {
      const cards = (view["cards"] as { id: string; title: string; body: string }[]) ?? [];
      stage.innerHTML = `
        <div class="label">${escapeHtml(String(view["heading"]))}</div>
        <div class="cardgrid">${cards.map((c) => `<div class="synthcard"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.body)}</p></div>`).join("")}</div>
        <div class="synthesis-note">${escapeHtml(String(view["beyondSports"]))}</div>
        <div class="exit-prompt">${escapeHtml(String(view["exitPrompt"]))}</div>`;
      return;
    }

    case "complete":
      stage.innerHTML = `<div class="label">Trade Deadline Complete</div><div class="banner">See you next class.</div>`;
      return;

    default:
      stage.innerHTML = `<div class="label">${escapeHtml(mode)}</div>`;
  }
}

/**
 * The Class Scatter: price × revenue, one dot per pair per homestand,
 * connected across rounds once both exist (VISUAL_IDENTITY.md's chart
 * style — hairline axes, ≥10px marks with a surface-panel ring, one
 * dimension of color per chart: homestand, via series-1/series-2).
 */
function renderScatterSvg(points: ScatterPoint[], opts: { connect: boolean }): string {
  const W = 900;
  const H = 460;
  const marginL = 64;
  const marginR = 24;
  const marginT = 20;
  const marginB = 40;
  const xMin = 10;
  const xMax = 120;
  const maxRevenue = Math.max(50_000, ...points.map((p) => p.revenue), 1);
  const yMax = Math.ceil((maxRevenue * 1.15) / 10_000) * 10_000;

  const x = (price: number) => marginL + ((price - xMin) / (xMax - xMin)) * (W - marginL - marginR);
  const y = (rev: number) => H - marginB - (rev / yMax) * (H - marginT - marginB);

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="scatter-svg" role="img" aria-label="Price versus revenue, one dot per pair">`;
  svg += `<line x1="${marginL}" y1="${H - marginB}" x2="${W - marginR}" y2="${H - marginB}" style="stroke:rgba(255,255,255,0.10); stroke-width:1;"/>`;
  svg += `<line x1="${marginL}" y1="${marginT}" x2="${marginL}" y2="${H - marginB}" style="stroke:rgba(255,255,255,0.10); stroke-width:1;"/>`;

  for (const px of [10, 35, 60, 85, 120]) {
    svg += `<text x="${x(px)}" y="${H - marginB + 20}" text-anchor="middle" style="font:12px Inter, sans-serif; fill:var(--ink-muted);">$${px}</text>`;
  }
  for (let i = 0; i <= 4; i += 1) {
    const rv = Math.round((yMax * i) / 4);
    svg += `<text x="${marginL - 10}" y="${y(rv) + 4}" text-anchor="end" style="font:12px Inter, sans-serif; fill:var(--ink-muted);">$${Math.round(rv / 1000)}k</text>`;
  }
  svg += `<text x="${(marginL + (W - marginR)) / 2}" y="${H - 4}" text-anchor="middle" style="font:11px Inter, sans-serif; letter-spacing:.08em; fill:var(--ink-muted);">TICKET PRICE</text>`;

  if (opts.connect) {
    const byFranchise = new Map<string, ScatterPoint[]>();
    for (const p of points) {
      const key = p.franchise.name;
      if (!byFranchise.has(key)) byFranchise.set(key, []);
      byFranchise.get(key)!.push(p);
    }
    for (const pts of byFranchise.values()) {
      const h1 = pts.find((p) => p.homestand === 1);
      const h2 = pts.find((p) => p.homestand === 2);
      if (h1 && h2) {
        svg += `<line x1="${x(h1.price)}" y1="${y(h1.revenue)}" x2="${x(h2.price)}" y2="${y(h2.revenue)}" style="stroke:var(--ink-secondary); stroke-width:1.5; opacity:0.55;"/>`;
      }
    }
  }

  for (const p of points) {
    const color = p.homestand === 1 ? "var(--series-1)" : "var(--series-2)";
    const title = `${p.franchise.name} · Homestand ${p.homestand} · $${p.price} → $${p.revenue.toLocaleString()}${p.zone ? ` · ${ZONE_TITLE[p.zone] ?? p.zone}` : ""}`;
    svg += `<circle cx="${x(p.price)}" cy="${y(p.revenue)}" r="9" style="fill:${color}; stroke:var(--surface-panel); stroke-width:2;"><title>${escapeHtml(title)}</title></circle>`;
  }

  svg += `</svg>`;
  return svg;
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
