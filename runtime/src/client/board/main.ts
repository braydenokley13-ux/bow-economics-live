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
  if (view["module"] === "m1l3-free-agency") {
    const mode = String(view["mode"] ?? "");
    backdrop.classList.toggle("peak", mode === "reveal" || mode === "counterfactual" || mode === "synthesis");
    renderFreeAgencyBoard(view, mode);
    return;
  }
  if (view["module"] === "m2l1-full-house") {
    const mode = String(view["mode"] ?? "");
    backdrop.classList.toggle("peak", mode === "reveal" || mode === "adapt" || mode === "counterfactual" || mode === "synthesis");
    renderFullHouseBoard(view, mode);
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
      stage.innerHTML = `<div class="label">Trade Deadline Complete</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"] ?? "See you next class."))}</div>`;
      return;

    default:
      stage.innerHTML = `<div class="label">${escapeHtml(mode)}</div>`;
  }
}

/* --------------------------------------------------------- free agency render -- */

type FAFranchise2 = { name: string; crestIndex: number };
type FAAgentTicker = { id: string; name: string; position: string; tier: string; factorHint: string; ask: number; trend: number; interestCount: number; signed: boolean; signedAmount: number | null; signedFranchise: FAFranchise2 | null };
type FAStanding2 = { seatId: string; franchise: FAFranchise2; form: number; capRoom: number; rank: number };
type FAMatch2 = { a: FAStanding2; b: FAStanding2; winner: FAStanding2 };
type FAPlayoffs2 = { field: FAStanding2[]; semis: FAMatch2[]; final: FAMatch2 | null; champion: FAStanding2 | null };
type FAAward2 = { id: string; title: string; body: string };
const FA_TIER_LABEL: Record<string, string> = { star: "STAR", solid: "SOLID", value: "VALUE" };

function faTrendGlyph(trend: number): string {
  if (trend > 0) return `<span class="fa-ticker-trend up">▲ rising</span>`;
  if (trend < 0) return `<span class="fa-ticker-trend down">▼ falling</span>`;
  return `<span class="fa-ticker-trend flat">– steady</span>`;
}

function faTickerHtml(market: FAAgentTicker[]): string {
  return `<div class="fa-ticker">${market
    .map(
      (a) => `
    <div class="fa-ticker-card ${a.signed ? "signed" : ""}">
      <div class="fa-ticker-name">${escapeHtml(a.name)}</div>
      <div class="fa-ticker-meta">${a.position} · ${FA_TIER_LABEL[a.tier] ?? a.tier}</div>
      ${a.factorHint ? `<div class="fa-ticker-meta" style="color:var(--accent-blue); text-transform:none; font-style:italic; margin-top:.3vh;">"${escapeHtml(a.factorHint)}"</div>` : ""}
      <div class="fa-ticker-ask-row"><span class="fa-ticker-ask">$${a.signed ? a.signedAmount : a.ask}M</span>${a.signed ? "" : faTrendGlyph(a.trend)}</div>
      ${a.signed ? `<div class="fa-ticker-signed">✓ signed — ${a.signedFranchise ? escapeHtml(a.signedFranchise.name) : ""}</div>` : `<div class="fa-ticker-interest">${a.interestCount} team${a.interestCount === 1 ? "" : "s"} interested now</div>`}
    </div>`,
    )
    .join("")}</div>`;
}

function faStandingsHtml(standings: FAStanding2[]): string {
  return standings
    .map(
      (r) => `
    <div class="fa-standings-row ${r.rank <= 4 ? "playoff-line" : ""}">
      <span class="fa-standings-rank">#${r.rank}</span>
      <span style="${crestStyle(r.franchise.crestIndex, 26)}"></span>
      <span class="fa-standings-name">${escapeHtml(r.franchise.name)}</span>
      <span class="fa-standings-form">${r.form}</span>
    </div>`,
    )
    .join("");
}

function faMatchHtml(label: string, m: FAMatch2): string {
  return `
    <div class="fa-bracket-card">
      <div class="fa-bracket-title">${label}</div>
      <div class="fa-bracket-side ${m.winner.seatId === m.a.seatId ? "winner" : ""}"><span>${escapeHtml(m.a.franchise.name)}</span><span>${m.a.form}</span></div>
      <div class="fa-bracket-side ${m.winner.seatId === m.b.seatId ? "winner" : ""}"><span>${escapeHtml(m.b.franchise.name)}</span><span>${m.b.form}</span></div>
    </div>`;
}

function renderFreeAgencyBoard(view: Record<string, unknown>, mode: string): void {
  switch (mode) {
    case "lobby":
      stage.innerHTML = `<div class="label">Free Agency</div><div class="banner">Waiting for the room to start — ${view["teamCount"]} franchises joined</div>`;
      return;

    case "hook":
      stage.innerHTML = `<div class="label">The Signing Window Opens</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"]))}</div><div class="kpirow"><div class="kpi"><div class="num">${view["claimedCount"]}</div><div class="lbl">Franchises claimed</div></div><div class="kpi"><div class="num">$${view["cap"]}M</div><div class="lbl">The new cap</div></div></div>`;
      return;

    case "play": {
      const windowClosed = Boolean(view["windowClosed"]);
      const market = (view["market"] as FAAgentTicker[]) ?? [];
      const capRooms = (view["capRooms"] as { franchise: FAFranchise2; capRoom: number }[]) ?? [];
      const standings = (view["standings"] as FAStanding2[]) ?? [];
      stage.innerHTML = `
        <div class="label">${windowClosed ? "Signing Window Closed" : `Day ${view["day"]} of ${view["windowDays"]}`}</div>
        <div class="kpirow"><div class="kpi"><div class="num">${view["actedCount"]}/${view["totalTeams"]}</div><div class="lbl">Teams acted today</div></div></div>
        ${faTickerHtml(market)}
        ${capRooms.length > 0 ? `<div class="fa-caproom-row">${capRooms.map((c) => `<div class="fa-caproom-tile"><span style="${crestStyle(c.franchise.crestIndex, 16)}"></span> ${escapeHtml(c.franchise.name)}: <span class="num">$${c.capRoom}M</span></div>`).join("")}</div>` : ""}
        ${standings.length > 0 ? `<div class="synthesis-note" style="margin-top:2vh;">Playoff line — top ${Math.min(4, standings.length)}: ${standings.map((s) => escapeHtml(s.franchise.name)).join(", ")}</div>` : ""}
      `;
      return;
    }

    case "reveal": {
      const recap = view["windowRecap"] as { signedCount: number; totalAgents: number; totalSpent: number; biggestContract: { agentName: string; amount: number; franchise: FAFranchise2 } | null; steepestFall: { agentName: string; from: number; to: number } | null } | null;
      const agents = (view["agents"] as (FAAgentTicker & { revealed: boolean; playoffFactor: number | null })[]) ?? [];
      const standings = view["standings"] as FAStanding2[] | null;
      const playoffs = view["playoffs"] as FAPlayoffs2 | null;
      const awards = view["awards"] as FAAward2[] | null;
      const revealedAgents = agents.filter((a) => a.revealed);

      let html = `<div class="label">The Playoff Push</div>`;
      if (recap) {
        html += `<div class="banner" style="max-width:74vw;">${recap.signedCount} of ${recap.totalAgents} agents signed · $${recap.totalSpent}M total spent${recap.biggestContract ? ` · biggest deal: ${escapeHtml(recap.biggestContract.agentName)} at $${recap.biggestContract.amount}M (${escapeHtml(recap.biggestContract.franchise.name)})` : ""}</div>`;
      }
      if (revealedAgents.length > 0) {
        html += `<div class="cardgrid">${revealedAgents
          .map((a) => {
            const sign = a.playoffFactor !== null && a.playoffFactor > 0 ? "+" : "";
            return `<div class="synthcard"><h3>${escapeHtml(a.name)} <span style="font-size:0.7em; color:var(--ink-muted); text-transform:none; letter-spacing:0;">· ${a.position}</span></h3><p style="font-weight:800; color:${a.playoffFactor !== null && a.playoffFactor > 0 ? "var(--cap-safe)" : a.playoffFactor !== null && a.playoffFactor < 0 ? "#ff9aa4" : "var(--ink-secondary)"};">${sign}${a.playoffFactor} playoff factor</p><p>${a.signed ? `Signed by ${a.signedFranchise ? escapeHtml(a.signedFranchise.name) : "a team"} for $${a.signedAmount}M.` : "Went unsigned this window."}</p></div>`;
          })
          .join("")}</div>`;
      }
      if (standings) html += `<div class="label" style="font-size:1.6vw; margin-top:3vh;">Final Standings</div>${faStandingsHtml(standings)}`;
      if (playoffs && (playoffs.final || playoffs.semis.length > 0)) {
        html += `<div class="label" style="font-size:1.6vw; margin-top:3vh;">The Bracket</div><div class="fa-bracket-row">`;
        playoffs.semis.forEach((m, i) => (html += faMatchHtml(playoffs.semis.length > 1 ? `Semifinal ${i + 1}` : "Play-in", m)));
        if (playoffs.final) html += faMatchHtml("Final", playoffs.final);
        html += `</div>`;
        if (playoffs.champion) html += `<div class="exit-prompt">🏆 ${escapeHtml(playoffs.champion.franchise.name)} — champion</div>`;
      }
      if (awards) {
        html += `<div class="label" style="font-size:1.6vw; margin-top:3vh;">GM Awards</div>`;
        html += awards.length > 0 ? `<div class="cardgrid">${awards.map((a) => `<div class="synthcard"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body)}</p></div>`).join("")}</div>` : `<div class="synthesis-note">Nothing to award this round.</div>`;
      }
      stage.innerHTML = html;
      return;
    }

    case "counterfactual": {
      const classCards = (view["classCards"] as { id: string; title: string; body: string }[]) ?? [];
      const debatePrompts = (view["debatePrompts"] as string[]) ?? [];
      stage.innerHTML = `
        <div class="label">What If?</div>
        <div class="cardgrid">${classCards.map((c) => `<div class="synthcard"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.body)}</p></div>`).join("")}</div>
        <div class="synthesis-note">${debatePrompts.map(escapeHtml).join(" &nbsp;·&nbsp; ")}</div>`;
      return;
    }

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
      stage.innerHTML = `<div class="label">Module 1 Complete</div><div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"]))}</div>`;
      return;

    default:
      stage.innerHTML = `<div class="label">${escapeHtml(mode)}</div>`;
  }
}

/* --------------------------------------------------------- full house board -- */

type FHPoint = { marketId: string; cardId: string; deskHandle: string; price: number; turnout: number; fillPct: number; soldOut: boolean };
type FHTwoPeaksB = {
  marketId: string;
  cardId: string;
  ticketPeakPrice: number;
  totalPeakPrice: number;
  gapDollars: number;
  gapSteps: number;
  ticketRevenueAtTicketPeak: number;
  totalRevenueAtTicketPeak: number;
  totalRevenueAtTotalPeak: number;
  moneySeries?: { price: number; ticket: number; total: number }[];
};
type FHRepeat = {
  deskHandle: string;
  marketId: string;
  n1Price: number;
  n1Turnout: number;
  n5Price: number;
  n5Turnout: number;
  renewalsStart: number;
  renewalsAtN5: number;
  samePrice: boolean;
  /** econ-l1-n5-attribution R4: the honest channel split behind this row's two crowds. */
  channelLine?: string | null;
};
type FHBooksB = { marketId: string; club: string; deskCount: number; medianCash: number; medianRenewals: number; bestFillPct: number; fullHouseNights: number };
type FHMarketB = { id: string; club: string; building: string; plainLine: string; capacity: number; capacityNote?: string; bill?: number; planPrice?: number };
type FHCardB = { id: string; label: string; index: number; of: number; day: string; visitor: string; draw: number; tv: string; notes: string[]; bowlOffer: boolean; repeatOf: string | null };

const FH_SERIES: Record<string, string> = { "new-york": "var(--series-1)", memphis: "var(--series-2)" };

type FHSlateB = { id: string; label: string; day: string; visitor: string; draw: number; tv: string };

/** The five-night schedule, public before the first price (gate-l1-econ B4 / gate-l1-play P2). */
function fhSlateBoardHtml(slate: FHSlateB[]): string {
  if (slate.length === 0) return "";
  return `
    <div class="fh-slate-board">
      ${slate
        .map(
          (n) =>
            `<div class="fh-slate-card"><div class="fh-slate-night">${escapeHtml(n.label)}</div><div class="fh-slate-day">${escapeHtml(n.day)}</div><div class="fh-slate-visitor">${escapeHtml(n.visitor)}</div><div class="fh-slate-draw">DRAW <span class="num">${n.draw}</span></div><div class="fh-slate-tv">${n.tv === "national" ? "NATIONAL TV" : n.tv === "local" ? "LOCAL TV" : "NOT ON TV"}</div></div>`,
        )
        .join("")}
    </div>`;
}

function fhCardBanner(card: FHCardB): string {
  return `
    <div class="fh-board-card">
      <div class="fh-board-card-top">
        <span class="fh-board-night">${escapeHtml(card.label)} of ${card.of}</span>
        <span class="fh-board-tv">${card.tv === "national" ? "NATIONAL TV" : card.tv === "local" ? "LOCAL TV" : "NOT ON TV"}</span>
      </div>
      <div class="fh-board-matchup">${escapeHtml(card.day)} &nbsp;·&nbsp; ${escapeHtml(card.visitor)}</div>
      <div class="fh-board-draw">VISITING CLUB'S DRAW <span class="num">${card.draw}</span> / 100</div>
      <div class="fh-board-notes">${card.notes.map((n) => `<div>${escapeHtml(n)}</div>`).join("")}</div>
    </div>`;
}

/**
 * gate-l1-play P1 (BLOCKING dissent `play-board-curve-pooled`) and
 * gate-l1-econ B5: this chart used to join every desk-night in a market into
 * one price-sorted polyline labelled "THE ROOM'S OWN CURVE". Five different
 * cards are five different demand worlds, so the joined line contained
 * stretches climbing to the right — the projector arguing that a higher price
 * drew a bigger crowd, in the room the lesson asks to reason from it.
 *
 * The repair: no joining stroke at all, and every dot is attributable to its
 * demand world — colour by market, shape by night, with an on-screen key.
 * Nothing is pooled into a line, so no rendered series can slope the wrong
 * way; the comparison the room is asked to make (ARGUE_PROMPT) is inside one
 * colour and one shape.
 */
const FH_NIGHT_SHAPE: Record<string, string> = { N1: "circle", N2: "square", N3: "triangle", N4: "diamond", N5: "ring" };

function fhMark(cx: number, cy: number, cardId: string, color: string, big: boolean, title: string, scale = 1): string {
  const r = (big ? 11 : 8.5) * scale;
  const ring = `stroke:var(--surface-panel); stroke-width:${(2 * scale).toFixed(1)};`;
  const t = `<title>${escapeHtml(title)}</title>`;
  switch (FH_NIGHT_SHAPE[cardId]) {
    case "square":
      return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="2" style="fill:${color}; ${ring}">${t}</rect>`;
    case "triangle":
      return `<polygon points="${cx},${cy - r - 1} ${cx + r + 1},${cy + r} ${cx - r - 1},${cy + r}" style="fill:${color}; ${ring}">${t}</polygon>`;
    case "diamond":
      return `<polygon points="${cx},${cy - r - 2} ${cx + r + 2},${cy} ${cx},${cy + r + 2} ${cx - r - 2},${cy}" style="fill:${color}; ${ring}">${t}</polygon>`;
    case "ring":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:none; stroke:${color}; stroke-width:4;">${t}</circle>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${color}; ${ring}">${t}</circle>`;
  }
}

/**
 * Deterministic jitter (gate-l1-play 1b): all ten Memphis desk-nights land
 * between $10 and $16 in every session — the plan price is $16 and the renewals
 * rule punishes undercutting it — so half the room's evidence rendered as ~10
 * overlapping marks inside a ~50px box on the projector. This spreads
 * co-located marks by a fixed offset derived from the desk and the night, so it
 * is stable across polls and reveal stages (a mark never appears to move) and
 * never large enough to change which price a mark reads as.
 */
function fhJitter(seed: string, span: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 2 * span;
}

/**
 * The projector's back-row legibility floor is 2.6% of screen height
 * (`gate-l1-projector`). HTML type holds it because it is set in `vw`; SVG type
 * does not, because it scales with the box the chart is drawn in — the W3
 * re-adjudication measured this same chart at 2.86% full width, 1.56% compacted
 * and 1.30% in the two-column COUNTERFACTUAL, i.e. the compaction repair bought
 * fit by shrinking the evidence.
 *
 * So the caller states how wide the chart will actually render, as a fraction of
 * the viewport, and the type is sized from it. On a 16:9 projector,
 * `renderedPx = font * frac * vw / W` and `2.6% of height = 0.026 * vw * 9/16`,
 * so `font >= 0.014625 * W / frac`. Margins, mark size and tick density follow
 * the type rather than the other way round.
 */
function fhAxisType(frac: number, viewBoxWidth: number): { font: number; mL: number; mB: number; scale: number } {
  const font = Math.max(18, Math.ceil((0.014625 * viewBoxWidth) / Math.max(0.05, frac)));
  return {
    font,
    mL: Math.round(font * 3.4 + 18),
    mB: Math.round(font * 2.4 + 10),
    scale: font / 18,
  };
}

/**
 * gate-l1-visual P3: the analysis backdrop's brightest point sits inside the
 * plot rect and its faint specks render at chart-mark size inside it. The plot
 * area gets its own quiet ground so the data is never read against the art.
 */
function fhPlotScrim(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" style="fill:rgba(8,13,20,0.62);"/>`;
}

function fhCurveSvg(points: FHPoint[], markets: string[], widthFrac = 0.84, plotHeight = 324): string {
  const W = 960;
  const { font, mL, mB, scale } = fhAxisType(widthFrac, W);
  const mR = 24;
  const mT = 18;
  const H = plotHeight + mT + mB;
  const xMin = 10;
  const xMax = 120;
  const yMax = Math.max(5000, ...points.map((p) => p.turnout)) * 1.12;
  const x = (price: number) => mL + ((price - xMin) / (xMax - xMin)) * (W - mL - mR);
  const y = (t: number) => H - mB - (t / yMax) * (H - mT - mB);
  // Big type needs fewer labels or they collide with each other.
  const xTicks = font > 24 ? [10, 45, 80, 120] : [10, 30, 50, 70, 90, 120];
  const yTicks = font > 24 ? 3 : 4;

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="scatter-svg" role="img" aria-label="Ticket price against how many people came, one mark per desk-night, coloured by market and shaped by night">`;
  svg += fhPlotScrim(mL, mT, W - mL - mR, H - mT - mB);
  svg += `<line x1="${mL}" y1="${H - mB}" x2="${W - mR}" y2="${H - mB}" style="stroke:rgba(255,255,255,0.18); stroke-width:1;"/>`;
  svg += `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${H - mB}" style="stroke:rgba(255,255,255,0.18); stroke-width:1;"/>`;
  for (const px of xTicks) {
    svg += `<text x="${x(px)}" y="${H - mB + font + 6}" text-anchor="middle" style="font:600 ${font}px Inter, sans-serif; fill:var(--ink-secondary);">$${px}</text>`;
  }
  for (let i = 0; i <= yTicks; i += 1) {
    const t = Math.round((yMax * i) / yTicks);
    svg += `<text x="${mL - 10}" y="${y(t) + font * 0.34}" text-anchor="end" style="font:600 ${font}px Inter, sans-serif; fill:var(--ink-secondary);">${(t / 1000).toFixed(0)}k</text>`;
  }
  svg += `<text x="${(mL + (W - mR)) / 2}" y="${H - 6}" text-anchor="middle" style="font:${font}px Inter, sans-serif; letter-spacing:.08em; fill:var(--ink-secondary);">TICKET PRICE</text>`;
  const yTitleX = Math.round(font * 0.9);
  svg += `<text x="${yTitleX}" y="${(mT + H - mB) / 2}" text-anchor="middle" transform="rotate(-90 ${yTitleX} ${(mT + H - mB) / 2})" style="font:${font}px Inter, sans-serif; letter-spacing:.08em; fill:var(--ink-secondary);">PEOPLE WHO CAME</text>`;

  // No joining stroke: five nights are five demand worlds and a line through
  // them is a false picture (gate-l1-play P1). One mark per desk-night, shaped
  // by night so the room can compare like with like.
  void markets;
  for (const p of points) {
    const color = FH_SERIES[p.marketId] ?? "var(--accent-blue)";
    const seed = `${p.deskHandle}|${p.cardId}`;
    svg += fhMark(
      x(p.price) + fhJitter(seed, 11 * scale),
      y(p.turnout) + fhJitter(`${seed}|y`, 8 * scale),
      p.cardId,
      color,
      p.soldOut,
      `${p.deskHandle} · ${p.cardId} · $${p.price} · ${p.turnout.toLocaleString()} came · ${p.fillPct}% full`,
      scale,
    );
  }
  svg += `</svg>`;
  return svg;
}

const FH_NIGHT_LABEL: Record<string, string> = { N1: "N1 Tue", N2: "N2 Sat", N3: "N3 Wed", N4: "N4 Sat", N5: "N5 Tue" };

function fhLegend(points: FHPoint[]): string {
  const ids = [...new Set(points.map((p) => p.marketId))];
  const nights = [...new Set(points.map((p) => p.cardId))].sort();
  const label: Record<string, string> = { "new-york": "New York", memphis: "Memphis" };
  const shapeKey = nights
    .map(
      (n) =>
        `<span class="legend-shape"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${fhMark(12, 12, n, "var(--ink-secondary)", false, "")}</svg>${escapeHtml(FH_NIGHT_LABEL[n] ?? n)}</span>`,
    )
    .join("");
  return `<div class="scatter-legend">${ids
    .map((id) => `<span class="legend-dot" style="background:${FH_SERIES[id] ?? "var(--accent-blue)"}; margin-left:14px;"></span>${escapeHtml(label[id] ?? id)}`)
    .join("")}<span class="legend-sep"></span>${shapeKey}</div>
    <div class="synthesis-note" style="font-size:1.5vw; max-width:82vw;">Every dot is one desk on one night — this picture is NOT a demand curve. Compare dots of the SAME colour and the SAME shape — that is one building on one night, and only that is a demand curve. Different nights are different crowds, so they are never joined up.</div>`;
}

/**
 * gate-l1-play: "Two Peaks SURVIVED as a statement, weakened as a proof" — the
 * panel asserted two prices while the chart above it plotted people, not
 * money, with no marker at either price. This is the money view: both revenue
 * curves for that desk's frozen Night 3 curve, with a marked peak on each, so
 * the room can see the two peaks rather than be told about them.
 */
function fhMoneySvg(p: FHTwoPeaksB): string {
  const series = p.moneySeries ?? [];
  if (series.length < 3) return "";
  const W = 420;
  // Same floor as the class chart: this panel renders at ~32vw, so its own type
  // has to be sized in the viewBox to clear 2.6% of screen height. It measured
  // 1.56% before this — the peak prices, which ARE the beat, were the smallest
  // live text on the frame.
  const { font, mL, mB } = fhAxisType(0.32, W);
  const H = 150 + 22 + mB;
  const mR = 10;
  const mT = 22;
  const xMin = Math.min(...series.map((s) => s.price));
  const xMax = Math.max(...series.map((s) => s.price));
  const yMax = Math.max(...series.map((s) => s.total)) * 1.1;
  const x = (v: number) => mL + ((v - xMin) / (xMax - xMin)) * (W - mL - mR);
  const y = (v: number) => H - mB - (v / yMax) * (H - mT - mB);
  const path = (key: "ticket" | "total") =>
    series.map((s, i) => `${i === 0 ? "M" : "L"}${x(s.price).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");
  const mark = (price: number, key: "ticket" | "total", color: string, label: string) => {
    const point = series.reduce((a, b) => (Math.abs(b.price - price) < Math.abs(a.price - price) ? b : a));
    return (
      `<line x1="${x(point.price)}" y1="${y(point[key])}" x2="${x(point.price)}" y2="${H - mB}" style="stroke:${color}; stroke-width:1.5; stroke-dasharray:3 3; opacity:.7;"/>` +
      `<circle cx="${x(point.price)}" cy="${y(point[key])}" r="7" style="fill:${color}; stroke:var(--surface-panel); stroke-width:2;"/>` +
      `<text x="${x(point.price)}" y="${y(point[key]) - 12}" text-anchor="middle" style="font:700 ${font}px Inter, sans-serif; fill:${color};">${escapeHtml(label)}</text>`
    );
  };
  const yTitleX = Math.round(font * 0.8);
  return `
    <svg viewBox="0 0 ${W} ${H}" class="fh-money-svg" role="img" aria-label="Money against ticket price: tickets alone, and tickets plus what people spend inside, each with its own peak">
      ${fhPlotScrim(mL, mT, W - mL - mR, H - mT - mB)}
      <line x1="${mL}" y1="${H - mB}" x2="${W - mR}" y2="${H - mB}" style="stroke:rgba(255,255,255,0.2); stroke-width:1;"/>
      <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${H - mB}" style="stroke:rgba(255,255,255,0.2); stroke-width:1;"/>
      <path d="${path("total")}" fill="none" stroke="var(--accent-gold)" stroke-width="3"/>
      <path d="${path("ticket")}" fill="none" stroke="var(--ink-secondary)" stroke-width="2" stroke-dasharray="5 4"/>
      ${mark(p.ticketPeakPrice, "ticket", "var(--ink-secondary)", `$${p.ticketPeakPrice}`)}
      ${mark(p.totalPeakPrice, "total", "var(--accent-gold)", `$${p.totalPeakPrice}`)}
      <text x="${(mL + W - mR) / 2}" y="${H - 6}" text-anchor="middle" style="font:${font}px Inter, sans-serif; letter-spacing:.08em; fill:var(--ink-secondary);">TICKET PRICE</text>
      <text x="${yTitleX}" y="${(mT + H - mB) / 2}" text-anchor="middle" transform="rotate(-90 ${yTitleX} ${(mT + H - mB) / 2})" style="font:${font}px Inter, sans-serif; letter-spacing:.08em; fill:var(--ink-secondary);">MONEY IN</text>
    </svg>
    <div class="fh-money-key"><span class="fh-money-swatch dash"></span>Tickets alone<span class="fh-money-swatch solid"></span>Tickets + what they spend inside</div>`;
}

/**
 * `gate-l1-projector` W3 repair 1 (BLOCKING): every PLAY frame that carries the
 * room's own evidence overflowed the projector — +152px with the class chart up,
 * +280px once the Two Peaks money view landed, with the punchline
 * "The cheaper ticket made more money." entirely below the fold at the moment
 * the teacher releases it. The cause is composition, not type size: the full
 * card banner (175px) and the KPI tile (92px) were stacked ABOVE a panel that
 * needs the whole screen, and every pair already has tonight's card on its own
 * device. While evidence is up, the card and the lock count collapse into one
 * strip so the evidence gets the frame. Nothing shrinks.
 */
function fhPlayStrip(card: FHCardB, locked: number, deskCount: number): string {
  return `
    <div class="fh-play-strip">
      <span class="fh-play-strip-night">${escapeHtml(card.label)} of ${card.of}</span>
      <span class="fh-play-strip-card">${escapeHtml(card.day)} · ${escapeHtml(card.visitor)} · DRAW ${card.draw}</span>
      <span class="fh-play-strip-locked"><span class="num">${locked}/${deskCount}</span> locked in</span>
    </div>`;
}

function fhTwoPeaksPanel(peaks: FHTwoPeaksB[]): string {
  if (peaks.length === 0) return "";
  return `
    <div class="fh-peaks-board">
      <div class="fh-peaks-title">THE TWO PEAKS</div>
      ${peaks
        .map(
          (p) => `
        <div class="fh-peaks-market">
          <div class="fh-peaks-club">${escapeHtml(p.marketId === "new-york" ? "New York" : "Memphis")}</div>
          <div class="fh-peaks-line"><span>Tickets alone peak at</span><span class="num">$${p.ticketPeakPrice}</span></div>
          <div class="fh-peaks-line hot"><span>Tickets + what they spend inside peak at</span><span class="num">$${p.totalPeakPrice}</span></div>
          <div class="fh-peaks-gap">$${p.gapDollars} lower · ${p.gapSteps} clicks of the dial</div>
          ${fhMoneySvg(p)}
        </div>`,
        )
        .join("")}
      <div class="fh-peaks-punch">The cheaper ticket made more money.</div>
    </div>`;
}

function renderFullHouseBoard(view: Record<string, unknown>, mode: string): void {
  const honesty = String(view["honestyLine"] ?? "");
  // `gate-l1-projector` BLOCKING repair 2 ("`#stage` must fit its content at
  // 1366x768 and 1920x1080 — scale down, tighten, or split the panel"): the
  // round-3 repair substituted `overflow-y:auto` for all three named remedies,
  // which makes content REACHABLE but still requires the teacher to scroll a
  // projector mid-beat. The two frames that still overflowed are the beats that
  // stack a previous panel under the current one. Remedy chosen: TIGHTEN the
  // stacked frames and SPLIT the last REVEAL beat (the season books stop
  // carrying the Two Peaks panel that already had its own stage). This class
  // carries the tightening; it is cleared on every other frame.
  stage.classList.remove("fh-tight", "fh-synth");
  switch (mode) {
    case "lobby": {
      const markets = (view["markets"] as FHMarketB[]) ?? [];
      const assignments = (view["assignments"] as { handle: string; crestIndex: number; marketId: string }[]) ?? [];
      stage.innerHTML = `
        <div class="label">Full House</div>
        <div class="banner" style="max-width:66vw;">${escapeHtml(String(view["message"] ?? ""))}</div>
        <div class="fh-market-row">${markets
          .map(
            (m) => `<div class="fh-market-tile"><div class="fh-market-club">${escapeHtml(m.club)}</div><div class="fh-market-building">${escapeHtml(m.building)}</div><div class="fh-market-line">${escapeHtml(m.plainLine)}</div><div class="fh-market-cap">${m.capacity.toLocaleString()} seats</div><div class="fh-market-stamp">${escapeHtml(m.capacityNote ?? "")}</div></div>`,
          )
          .join("")}</div>
        <div class="fh-desk-row">${assignments
          .map(
            (a) => `<div class="fh-desk-chip"><span style="${crestStyle(a.crestIndex, 22)}"></span>${escapeHtml(a.handle)}</div>`,
          )
          .join("")}</div>
        <div class="synthesis-note">${assignments.length} desk${assignments.length === 1 ? "" : "s"} in the room. Odd desks run New York, even desks run Memphis — same five nights, different building.</div>`;
      return;
    }

    case "hook": {
      const markets = (view["markets"] as FHMarketB[]) ?? [];
      stage.innerHTML = `
        <div class="label">Full House</div>
        <div class="banner" style="max-width:74vw;">${escapeHtml(String(view["message"] ?? ""))}</div>
        <div class="fh-market-row">${markets
          .map(
            (m) => `<div class="fh-market-tile"><div class="fh-market-club">${escapeHtml(m.club)}</div><div class="fh-market-building">${escapeHtml(m.building)}</div><div class="fh-market-cap">${m.capacity.toLocaleString()} seats · bill $${(m.bill ?? 0).toLocaleString()} a night · season plan $${m.planPrice}</div><div class="fh-market-stamp">${escapeHtml(m.capacityNote ?? "")}</div></div>`,
          )
          .join("")}</div>
        <div class="synthesis-note" style="max-width:70vw;">${escapeHtml(String(view["objective"] ?? ""))}</div>
        ${fhSlateBoardHtml((view["slate"] as FHSlateB[]) ?? [])}
        <div class="exit-prompt" style="font-size:1.1vw; color:var(--ink-muted);">${escapeHtml(honesty)} ${escapeHtml(String(view["horizonLine"] ?? ""))} ${escapeHtml(String(view["modeledDollarsLine"] ?? ""))}</div>`;
      return;
    }

    case "play": {
      if (view["allNightsDone"]) {
        // gate-l1-projector repair 3: the last bell used to dump all 25 marks and
        // the turned-away total here automatically, and REVEAL then wiped them and
        // replayed the same five nights one press at a time. The centrepiece
        // reveal was pre-spoiled and then repeated. The module now sends no
        // curves in this state; the board holds.
        stage.innerHTML = `
          <div class="label">Five Nights, In The Books</div>
          <div class="banner" style="max-width:70vw;">${escapeHtml(String(view["subMessage"] ?? ""))}</div>
          <div class="synthesis-note">${escapeHtml(honesty)}</div>`;
        return;
      }
      const card = view["card"] as FHCardB;
      const points = (view["curves"] as FHPoint[]) ?? [];
      const peaks = (view["twoPeaks"] as FHTwoPeaksB[]) ?? [];
      const curveUp = points.length > 0 && peaks.length === 0;
      const peaksUp = peaks.length > 0;
      const evidenceUp = curveUp || peaksUp;
      if (evidenceUp) stage.classList.add("fh-tight");
      const locked = Number(view["lockedCount"] ?? 0);
      const deskCount = Number(view["deskCount"] ?? 0);
      stage.innerHTML = evidenceUp
        ? `
        ${fhPlayStrip(card, locked, deskCount)}
        ${view["shockCopy"] ? `<div class="synthesis-note" style="max-width:74vw; font-size:1.2vw; color:#ffd98a;">${escapeHtml(String(view["shockCopy"]))}</div>` : ""}
        ${curveUp ? `<div class="scatter-wrap" style="width:60vw;">${fhCurveSvg(points, ["new-york", "memphis"], 0.6)}</div>${fhLegend(points)}` : ""}
        ${peaksUp ? fhTwoPeaksPanel(peaks) : ""}
        <div class="synthesis-note" style="font-size:1.1vw;">${escapeHtml(honesty)}</div>`
        : `
        <div class="label">Tonight's Card</div>
        ${fhCardBanner(card)}
        <div class="kpirow">
          <div class="kpi"><div class="num">${locked}/${deskCount}</div><div class="lbl">Desks locked in</div></div>
        </div>
        ${view["shockCopy"] ? `<div class="synthesis-note" style="max-width:66vw; color:#ffd98a;">${escapeHtml(String(view["shockCopy"]))}</div>` : ""}
        <div class="synthesis-note" style="font-size:1.1vw;">${escapeHtml(honesty)}</div>`;
      return;
    }

    case "reveal": {
      const points = (view["curves"] as FHPoint[]) ?? [];
      const shown = (view["shownCards"] as string[]) ?? [];
      const peaks = (view["twoPeaks"] as FHTwoPeaksB[]) ?? [];
      const books = (view["books"] as FHBooksB[]) ?? [];
      // The projector is a fixed, non-scrolling surface. As each staged panel
      // lands, the curve gives up room rather than pushing anything off screen.
      const crowded = Boolean(view["twoPeaksReleased"]);
      const booksUp = Boolean(view["booksReleased"]);
      // `gate-l1-play` recheck2, BLOCKING dissent `play-l1-repairs-below-fold`:
      // the renewals rule rendered LAST on this stage, under the class chart,
      // its legend and the legend's own paragraph — measured top 764 of 768 at
      // 1366x768, 1073 of 1080 at 1920x1080. The room was told to read a rule it
      // could not see, and /teach asserted it was "on the screen now". On its own
      // stage the rule is now the beat: it renders directly under the headline,
      // above the chart, and the chart drops to `compact` to pay for the room.
      const ruleUp = Boolean(view["renewalsRule"]);
      // W3 repair 2: the shock stage carries the Sports Reality anchor (the dated
      // Fever attendance line), which was sliced at 724..839 in a 768px viewport
      // and took its sourcing line off screen with it. The anchor IS the beat, so
      // the chart gives up the room for it — the same trade the renewals rule
      // stage already makes.
      const shockUp = Boolean(view["shockCopy"]);
      const showCurve = points.length > 0 && !booksUp && !crowded;
      const compactCurve = crowded || ruleUp || shockUp;
      // SPLIT (projector repair 2): the final beat is the season books. Two
      // Peaks had its own stage one press earlier; carrying it under the books
      // made the last REVEAL frame 962px tall in a 768px projector. Each beat
      // owns its own screen from here.
      const showTwoPeaks = crowded && !booksUp;
      // TIGHTEN: stage 5 (rule + compacted chart + legend + the turned-away line
      // + the sourcing footnote) measured its footnote at 739-775 of 768 — the
      // 1d contradiction line sliced mid-sentence. Stage 7 stacks the books row
      // under the same furniture. Both give up leading, never type size: the
      // projector review's evidence-tier floor stands.
      // W3 repair 2: REVEAL stages 1-3 overflowed by 8-9px as scroll frames, so
      // the tightening is no longer opt-in per stage — every REVEAL beat gives up
      // leading, and only the beats that stack a second panel give up chart width.
      stage.classList.add("fh-tight");
      void ruleUp;
      void booksUp;
      const ruleHtml = ruleUp
        ? `<div id="fhRenewalsRule" class="fh-reveal-rule">${escapeHtml(String(view["renewalsRule"]))}</div>`
        : "";
      stage.innerHTML = `
        <div class="label">${escapeHtml(String(view["stageHeadline"] ?? (booksUp ? "The Season, Market By Market" : `The Room's Own Nights · ${shown.length ? shown.join(" · ") : "waiting"}`)))}</div>
        ${shown.length > 0 ? `<div class="fh-nights-up">Nights up: ${shown.join(" · ")}</div>` : ""}
        ${ruleHtml}
        ${showCurve ? `<div class="scatter-wrap${compactCurve ? " compact" : ""}">${fhCurveSvg(points, ["new-york", "memphis"], compactCurve ? 0.44 : 0.8)}</div>${fhLegend(points)}` : points.length === 0 ? `<div class="banner">Waiting for your teacher to put up the first night.</div>` : ""}
        ${Number(view["totalTurnedAway"] ?? 0) > 0 ? `<div class="synthesis-note" style="font-size:1.5vw; color:var(--ink-primary);">${Number(view["totalTurnedAway"]).toLocaleString()} people in this room's five nights wanted a seat and could not get one.</div>` : ""}
        ${view["shockCopy"] ? `<div class="synthesis-note" style="max-width:74vw; font-size:1.2vw; color:#ffd98a;">${escapeHtml(String(view["shockCopy"]))}</div>` : ""}
        ${showTwoPeaks ? fhTwoPeaksPanel(peaks) : ""}
        ${
          view["booksReleased"]
            ? `<div class="fh-books-row">${books
                .map(
                  (b) => `<div class="fh-books-tile"><div class="fh-books-club">${escapeHtml(b.club)}</div>
                    <div class="fh-books-stat"><span>Desks</span><span class="num">${b.deskCount}</span></div>
                    <div class="fh-books-stat"><span>Fullest house</span><span class="num">${b.bestFillPct}%</span></div>
                    <div class="fh-books-stat"><span>Sold-out nights</span><span class="num">${b.fullHouseNights}</span></div>
                    <div class="fh-books-stat"><span>Median renewals</span><span class="num">${b.medianRenewals}%</span></div></div>`,
                )
                .join("")}</div>
               <div class="synthesis-note">${escapeHtml(String(view["capacityDefence"] ?? ""))}</div>`
            : ""
        }
        <div class="exit-prompt" style="font-size:1.1vw; color:var(--ink-muted);">${escapeHtml(honesty)}</div>`;
      return;
    }

    case "adapt": {
      const questions = (view["questions"] as string[]) ?? [];
      const points = (view["curves"] as FHPoint[]) ?? [];
      // W3 repair 2: ADAPT overflowed by 29px/39px and cut its sourcing line
      // mid-sentence. Same trade as REVEAL — leading first, then chart width.
      stage.classList.add("fh-tight");
      stage.innerHTML = `
        <div class="label">What Moved The Crowd?</div>
        <div class="fh-questions-board">${questions.map((q) => `<div>${escapeHtml(q)}</div>`).join("")}</div>
        ${points.length > 0 ? `<div class="scatter-wrap" style="width:58vw;">${fhCurveSvg(points, ["new-york", "memphis"], 0.58)}</div>${fhLegend(points)}` : ""}
        <div class="synthesis-note" style="font-size:1.1vw;">${escapeHtml(honesty)}</div>`;
      return;
    }

    case "counterfactual": {
      const rows = (view["repeatCard"] as FHRepeat[]) ?? [];
      // gate-l1-play 1a (BLOCKING P1-b): the prompt in the largest type on this
      // board tells the room to find two dots "on the board" — and the scatter
      // was rendered in REVEAL and ADAPT only, so the designated argue-fuel
      // pointed off-screen at the exact moment the argument was asked for.
      const cfPoints = (view["curves"] as FHPoint[]) ?? [];
      const max = Math.max(1, ...rows.flatMap((r) => [r.n1Turnout, r.n5Turnout]));
      // `gate-l1-play` recheck3 P11-b (BLOCKING dissent `play-l1-repairs-below-fold`)
      // and the wave-2 analyst's biggest-failure finding: this grid rendered
      // `rows.map(...)` uncapped. At ten desks, six repeat rows AND the class
      // summary were off a 1366x768 projector (six rows off at 1920x1080 too),
      // under a prompt in the largest type on the board telling the room to argue
      // from exactly that evidence — and the e2e guard asserted only `#fhCfScatter`
      // and the prompt, both at the TOP of the layout, so it could never see it.
      // The module now hands over ONE teacher-advanced group of at most
      // CF_ROWS_PER_PAGE rows; the class summary is computed over every row and
      // rendered outside the paged column, so it is on screen for every group.
      const pageCount = Number(view["cfPageCount"] ?? 1);
      const pageLabel = String(view["cfPageLabel"] ?? "");
      // Same TIGHTEN limb as the stacked REVEAL beats: leading and chart width
      // give ground so the group, the scatter and the class summary all fit.
      stage.classList.add("fh-tight");
      stage.innerHTML = `
        <div class="label">Night 1 vs Night 5 — The Same Card</div>
        <div class="exit-prompt" style="max-width:88vw;">${escapeHtml(String(view["prompt"] ?? ""))}</div>
        <div class="fh-cf-grid">
          <div class="fh-cf-col">
            ${pageLabel ? `<div class="fh-cf-pager" id="fhCfPager">${escapeHtml(pageLabel)}</div>` : ""}
            <div class="fh-repeat-board" id="fhCfRows">${rows
              .map(
                (r) => `
              <div class="fh-repeat-row" data-cf-row="1">
                <div class="fh-repeat-handle">${escapeHtml(r.deskHandle)}${r.samePrice ? ` <span class="fh-repeat-same">same price $${r.n1Price}</span>` : ` <span class="fh-repeat-same diff">$${r.n1Price} → $${r.n5Price}</span>`}</div>
                <div class="fh-repeat-bars">
                  <div class="fh-repeat-bar n1" style="width:${(r.n1Turnout / max) * 100}%"><span>${r.n1Turnout.toLocaleString()}</span></div>
                  <div class="fh-repeat-bar n5" style="width:${(r.n5Turnout / max) * 100}%"><span>${r.n5Turnout.toLocaleString()}</span></div>
                </div>
                <div class="fh-repeat-renew">renewals ${r.renewalsStart}% → ${r.renewalsAtN5}%${r.channelLine ? ` · ${escapeHtml(r.channelLine)}` : ""}</div>
              </div>`,
              )
              .join("")}</div>
          </div>
          <div class="fh-cf-col">
            ${
              cfPoints.length > 0
                ? `<div class="scatter-wrap" id="fhCfScatter">${fhCurveSvg(cfPoints, ["new-york", "memphis"], 0.44, 240)}</div>${fhLegend(cfPoints)}`
                : ""
            }
          </div>
        </div>
        <div class="synthesis-note fh-cf-summary" id="fhCfSummary">${escapeHtml(String(view["repeatSummary"] ?? ""))}</div>
        ${pageCount > 1 ? `<div class="fh-cf-pager-hint">The whole room's desks are on this card — your teacher walks the groups.</div>` : ""}
        <div class="synthesis-note" style="font-size:1vw;">${escapeHtml(String(view["honestLimit"] ?? ""))}</div>`;
      return;
    }

    case "synthesis": {
      const cards = (view["cards"] as { id: string; title: string; body: string }[]) ?? [];
      const notes = (view["sourceNotes"] as string[]) ?? [];
      // `gate-l1-visual` (SYNTHESIS = SCHOOL-UI, the module's weakest board) and
      // `gate-l1-projector` (the explicit-formalization moment is the least
      // readable board in the lesson, clipped top AND bottom at both
      // resolutions). This is a composition repair — hierarchy and type, no new
      // art: one headline slot, an evidence tier of six cards whose TITLES carry
      // the economics and whose bodies are support, then the beyond-sports line
      // promoted to the closing statement it is (the econ gate calls it the
      // strongest link in the chain, and it was set smaller and dimmer than the
      // sourcing rail underneath it — H4's inverted type weight). The sources
      // become one quiet rail, which is what sourcing discipline should look
      // like on a projector: present, dated, and not competing.
      //
      // W3 RE-GRADE N1 + W3 projector repair: the round-4 repair un-clipped this
      // frame by SHRINKING it — measured 11.20px card bodies and 9.29px sources
      // at 1366x768, against a 2.6%-of-height (≈20px) back-row floor. That is a
      // dashboard grid of ~850 words on a projector, which VISUAL_IDENTITY.md
      // forbids outright. Undone here: the frame is STAGED instead. One card at a
      // time under the teacher's own pager, type back above the floor, the
      // beyond-sports close on every page because it is the module's closing
      // statement, and the sourcing rail on the last page where it belongs.
      stage.classList.add("fh-tight", "fh-synth");
      const synthPageLabel = String(view["synthPageLabel"] ?? "");
      const railUp = Boolean(view["synthRail"]);
      stage.innerHTML = `
        <div class="label fh-synth-head">${escapeHtml(String(view["heading"] ?? ""))}</div>
        ${synthPageLabel ? `<div class="fh-synth-pager" id="fhSynthPager">${escapeHtml(synthPageLabel)}</div>` : ""}
        <div class="cardgrid">${cards.map((c) => `<div class="synthcard"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.body)}</p></div>`).join("")}</div>
        <div class="fh-synth-close" id="fhSynthClose">${escapeHtml(String(view["beyondSports"] ?? ""))}</div>
        ${railUp ? `<div class="exit-prompt fh-synth-exit">${escapeHtml(String(view["exitPrompt"] ?? ""))}</div>
        <div class="fh-sources">${notes.map((n) => `<span>${escapeHtml(n)}</span>`).join("")}</div>` : ""}`;
      return;
    }

    case "complete":
      stage.innerHTML = `
        <div class="label">Full House — Complete</div>
        <div class="banner" style="max-width:70vw;">${escapeHtml(String(view["message"] ?? ""))}</div>`;
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
