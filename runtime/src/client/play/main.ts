import { ApiError, apiFetch } from "../shared/api.js";
import { crestStyle } from "../shared/crest.js";
import { ActionOutbox } from "../shared/outbox.js";
import { startPolling } from "../shared/poll.js";
import { clearPlayCredentials, loadPlayCredentials, savePlayCredentials, type PlayCredentials } from "../shared/storage.js";

type Franchise = { name: string; crestIndex: number };

type SessionInfo = { code: string; title: string; phase: string; paused: boolean; frozen: boolean; ended: boolean; version: number };
type StudentPayload = {
  session: SessionInfo;
  seat: { id: string; displayName: string };
  deviceToken?: string;
  rejoinPin?: string;
  view: Record<string, unknown>;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const joinCard = $("joinCard");
const rejoinCard = $("rejoinCard");
const pinCard = $("pinCard");
const gameCard = $("gameCard");
const errEl = $("err");
const syncStatus = $("syncStatus");

let creds: PlayCredentials | null = loadPlayCredentials();
let outbox: ActionOutbox | null = null;

function showError(message: string): void {
  errEl.textContent = message;
}
function setSyncLabel(text: string): void {
  syncStatus.textContent = text;
}
function describe(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

$("btnShowRejoin").addEventListener("click", () => {
  joinCard.hidden = true;
  rejoinCard.hidden = false;
  showError("");
});
$("btnShowJoin").addEventListener("click", () => {
  rejoinCard.hidden = true;
  joinCard.hidden = false;
  showError("");
});

$("btnJoin").addEventListener("click", () => {
  void (async () => {
    showError("");
    const code = $<HTMLInputElement>("joinCode").value.trim().toUpperCase();
    const first = $<HTMLInputElement>("joinName").value.trim();
    const second = $<HTMLInputElement>("joinName2").value.trim();
    if (!code || !first) return showError("Enter a class code and your name.");
    const displayName = second ? `${first} & ${second}` : first;
    try {
      const payload = await apiFetch<StudentPayload>(`/api/sessions/${code}/join`, {
        method: "POST",
        body: JSON.stringify({ displayName }),
      });
      onSeated(payload, code);
    } catch (error) {
      showError(describe(error, "Could not join — check the code."));
    }
  })();
});

$("btnRejoin").addEventListener("click", () => {
  void (async () => {
    showError("");
    const code = $<HTMLInputElement>("rejoinCode").value.trim().toUpperCase();
    const name = $<HTMLInputElement>("rejoinName").value.trim();
    const pin = $<HTMLInputElement>("rejoinPin").value.trim();
    if (!code || !name || pin.length !== 4) return showError("Enter your class code, name, and 4-digit PIN.");
    try {
      const payload = await apiFetch<StudentPayload>(`/api/sessions/${code}/rejoin`, {
        method: "POST",
        body: JSON.stringify({ displayName: name, pin }),
      });
      onSeated(payload, code);
    } catch (error) {
      showError(describe(error, "Could not rejoin — check name and PIN."));
    }
  })();
});

function onSeated(payload: StudentPayload, code: string): void {
  if (!payload.deviceToken) return showError("Server did not issue a device token.");
  creds = { deviceToken: payload.deviceToken, sessionCode: code, seatId: payload.seat.id, displayName: payload.seat.displayName, rejoinPin: payload.rejoinPin };
  savePlayCredentials(creds);
  joinCard.hidden = true;
  rejoinCard.hidden = true;
  if (payload.rejoinPin) {
    pinCard.hidden = false;
    $("pinDisplay").textContent = payload.rejoinPin;
  }
  startGame();
}

function startGame(): void {
  if (!creds) return;
  gameCard.hidden = false;
  outbox = new ActionOutbox(
    () => `/api/sessions/${creds!.sessionCode}/actions`,
    () => creds?.deviceToken ?? null,
    {
      onRetired: () => {
        clearPlayCredentials();
        creds = null;
        location.reload();
      },
      onRejected: (_action, error) => showError(error.message),
      onSent: (_action, response) => {
        // The action is a discrete, immediately-resolved command — render its
        // own response right away instead of waiting for the next poll tick,
        // so the wall, meter, and Foregone Panel feel live, not laggy.
        showError("");
        renderGame(response as StudentPayload);
      },
      onPending: (count) => setSyncLabel(count > 0 ? `syncing… (${count} pending)` : "synced"),
    },
    creds.seatId,
  );

  startPolling<StudentPayload>(
    "/api/me",
    1200,
    (payload) => {
      showError("");
      setSyncLabel(outbox && outbox.pendingCount > 0 ? `syncing… (${outbox.pendingCount} pending)` : "synced");
      outbox?.retryNow();
      renderGame(payload);
    },
    {
      headers: (): Record<string, string> => (creds ? { Authorization: `Bearer ${creds.deviceToken}` } : {}),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearPlayCredentials();
          creds = null;
          location.reload();
          return;
        }
        setSyncLabel("offline — retrying");
      },
    },
  );

  window.addEventListener("online", () => outbox?.retryNow());
}

/* ---------------------------------------------------------------- render -- */

function renderGame(payload: StudentPayload): void {
  const s = payload.session;
  const header = $("gameHeader");
  const franchise = payload.view["franchise"] as Franchise | null | undefined;
  header.innerHTML = "";
  const headerText = document.createElement("span");
  headerText.textContent = `${s.title || "Session"} · seated as ${payload.seat.displayName}`;
  header.appendChild(headerText);
  // G4: once a team has placed a card, it has a fictional franchise identity — show it in the header
  // from then on so the reveal's "that's ours!" moment starts registering well before REVEAL itself.
  if (franchise) {
    const badge = document.createElement("span");
    badge.className = "franchise-badge";
    badge.style.marginLeft = "10px";
    badge.innerHTML = `<span style="${crestStyle(franchise.crestIndex, 18)}"></span><span class="franchise-badge-name" style="font-size:11px;">${escapeHtml(franchise.name)}</span>`;
    header.appendChild(badge);
  }
  const body = $("gameBody");

  if (s.ended) {
    body.innerHTML = `<div class="banner">This session has ended. Thanks for playing!</div>`;
    return;
  }
  if (s.frozen) {
    body.innerHTML = `<div class="banner">Your teacher has frozen the session. Hang tight.</div>`;
    return;
  }
  if (s.paused) {
    body.innerHTML = `<div class="banner">Paused — everything you've done is saved. We'll pick back up shortly.</div>`;
    return;
  }

  const view = payload.view;
  if (view["module"] === "m1l1-draft-day") {
    renderDraftDay(s, view);
    return;
  }

  // lobby-demo fallback (still registered, proves the runtime is genuinely generic)
  if (s.phase === "LOBBY") {
    body.innerHTML = `<div class="banner">You're in! Waiting for your teacher to start.</div>`;
    return;
  }
  if (s.phase === "PLAY" && Array.isArray(view["colors"])) {
    body.innerHTML = "";
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr 1fr";
    grid.style.gap = "12px";
    for (const color of view["colors"] as string[]) {
      const swatch = document.createElement("div");
      swatch.style.height = "96px";
      swatch.style.borderRadius = "12px";
      swatch.style.cursor = "pointer";
      swatch.style.background = color;
      swatch.title = color;
      swatch.addEventListener("click", () => outbox?.submit({ type: "pick", color }));
      grid.appendChild(swatch);
    }
    body.appendChild(grid);
    return;
  }
  body.innerHTML = `<pre class="banner" style="text-align:left; white-space:pre-wrap;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
}

/* ------------------------------------------------------ draft day render -- */

type Player = { id: string; name: string; position: string; price: number; rating: number };
type SlotView = { id: string; player: Player | null };
type SwapSuggestion = {
  freeSlot: string;
  freePlayerId: string;
  freePlayerName: string;
  freePlayerPrice: number;
  unlocks: { id: string; name: string; price: number };
};

const POSITION_ICON: Record<string, string> = { SCORER: "◆", PLAYMAKER: "●", DEFENDER: "■", REBOUNDER: "▲", WILDCARD: "★" };

function renderDraftDay(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  switch (s.phase) {
    case "LOBBY":
      body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "You're in! Waiting for your teacher to start Draft Day."))}</div>`;
      return;

    case "HOOK":
      body.innerHTML = `
        <div class="panel" style="padding:20px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Draft Day</div>
          <p style="font-size:16px; line-height:1.5; color:var(--ink-primary); margin:0;">${escapeHtml(String(view["message"]))}</p>
          <div class="pill" style="margin-top:14px;">$${view["cap"]}M cap · ${view["slotCount"]} slots · $${view["step"]}M steps</div>
        </div>`;
      return;

    case "PLAY":
      renderPlay(view);
      return;

    case "REVEAL":
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["message"]))}</div>
        ${renderRosterSummary((view["myRoster"] as { slot: string; player: Player | null }[]) ?? [])}
      `;
      return;

    case "CONSEQUENCE": {
      const hit = view["hit"] as boolean;
      body.innerHTML = `
        <div class="panel" style="padding:18px; border-color:${hit ? "var(--over-the-line)" : "rgba(255,255,255,0.08)"};">
          <div class="eyebrow" style="font-size:12px; color:${hit ? "#ff9aa4" : "var(--ink-muted)"};">Consequence</div>
          <p style="margin:10px 0 0; font-size:15px; line-height:1.5;">${escapeHtml(String(view["message"]))}</p>
          ${hit ? `<div class="numeric" style="color:var(--accent-gold); margin-top:12px; font-size:20px;">$${view["remaining"]}M freed up</div>` : ""}
        </div>`;
      return;
    }

    case "ADAPT": {
      const openSlot = view["openSlot"] as string | null;
      const repaired = view["repaired"] as boolean | null;
      if (!openSlot) {
        body.innerHTML = `<div class="banner">Your roster wasn't hit by the shock — nothing to repair.</div>`;
        return;
      }
      if (repaired) {
        body.innerHTML = `<div class="banner">Repaired. Your ${escapeHtml(openSlot)} slot is filled again.</div>`;
        return;
      }
      const candidates = (view["candidates"] as Player[]) ?? [];
      body.innerHTML = `
        <div class="panel" style="padding:16px;">
          <div class="eyebrow" style="font-size:12px;">Repair your ${escapeHtml(openSlot)} slot</div>
          <p style="margin:6px 0 0; font-size:12px; color:var(--ink-muted);">That player signed elsewhere for good. Here's a short-notice repair budget to find someone new.</p>
          <div class="numeric" style="color:var(--accent-gold); margin:8px 0 14px; font-size:18px;">$${view["budget"]}M repair budget</div>
          <div class="market-grid" id="adaptCandidates"></div>
        </div>`;
      const grid = $("adaptCandidates");
      if (candidates.length === 0) {
        grid.innerHTML = `<div class="banner">Nothing left you can afford here — talk to your teacher.</div>`;
      }
      for (const p of candidates) {
        grid.appendChild(marketCardEl(p, { used: false, affordable: true }, () => outbox?.submit({ type: "adaptFill", playerId: p.id })));
      }
      return;
    }

    case "COUNTERFACTUAL": {
      const gaveUp = (view["gaveUp"] as Player[]) ?? [];
      body.innerHTML = `
        <div class="panel" style="padding:16px;">
          <p style="margin:0 0 12px; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
          <div id="gaveUpList"></div>
        </div>`;
      const list = $("gaveUpList");
      if (gaveUp.length === 0) {
        list.innerHTML = `<div class="eyebrow" style="font-size:12px;">You could afford everything you wanted. Rare.</div>`;
      }
      for (const p of gaveUp) {
        const row = document.createElement("div");
        row.className = "foregone-row";
        row.innerHTML = `<span>${escapeHtml(p.name)} <span style="color:var(--ink-muted);">· ${escapeHtml(p.position)}</span></span><span class="price numeric">$${p.price}M</span>`;
        list.appendChild(row);
      }
      return;
    }

    case "ARGUE":
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["prompt"]))}</div>
        ${renderRosterSummary((view["myRoster"] as { slot: string; player: Player | null }[]) ?? [])}
      `;
      return;

    case "SYNTHESIS":
      body.innerHTML = `
        <div class="banner">Look up at the board.</div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Talk with your partner</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["exitPrompt"]))}</p>
        </div>`;
      return;

    case "COMPLETE":
      body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"]))}</div>`;
      return;

    default:
      body.innerHTML = `<pre class="banner" style="text-align:left; white-space:pre-wrap;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
  }
}

function renderRosterSummary(slots: { slot: string; player: Player | null }[]): string {
  return `<div class="roster-wall" style="margin-top:12px;">${slots
    .map(
      (s) => `
      <div class="roster-slot ${s.player ? "filled" : ""}">
        <div class="roster-slot-label">${POSITION_ICON[s.slot] ?? ""} ${s.slot}</div>
        ${
          s.player
            ? `<div class="mini-card"><div class="mini-card-name">${escapeHtml(s.player.name)}</div><div class="mini-card-pos">${s.player.position}</div><div class="mini-card-rating">RTG ${s.player.rating}</div><div class="mini-card-salary">$${s.player.price}M</div></div>`
            : `<div class="roster-slot-empty-glyph">—</div>`
        }
      </div>`,
    )
    .join("")}</div>`;
}

function renderPlay(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const locked = view["locked"] as boolean;
  const spent = view["spent"] as number;
  const cap = view["cap"] as number;
  const remaining = view["remaining"] as number;
  // G5: comfortable/tight/at-cap — no "over" state exists, because the reducer makes exceeding the cap impossible.
  const capState = view["capState"] as "comfortable" | "tight" | "at-cap";
  const slots = view["slots"] as SlotView[];
  const market = view["market"] as (Player & { used: boolean; affordable: boolean })[];
  const foregone = view["foregone"] as Player[];
  const suggestions = view["suggestions"] as { slot: string; candidates: Player[]; swaps: SwapSuggestion[] }[];
  const filledCount = slots.filter((s) => s.player !== null).length;

  body.innerHTML = "";

  const capLabel = capState === "at-cap" ? "AT THE CAP" : capState.toUpperCase();
  // cap meter
  const meter = document.createElement("div");
  meter.className = "cap-meter";
  const pct = Math.min(100, (spent / cap) * 100);
  meter.innerHTML = `
    <div class="cap-meter-head">
      <span class="eyebrow" style="font-size:11px;">Salary Cap</span>
      <span class="pill pill-${capState}"><span class="pill-dot"></span>${capLabel}</span>
    </div>
    <div class="cap-meter-track">
      <div class="cap-meter-zone" style="left:0; width:90%; background:var(--cap-safe);"></div>
      <div class="cap-meter-zone" style="left:90%; width:10%; background:var(--cap-tight);"></div>
      <div class="cap-meter-fill ${capState === "at-cap" ? "at-cap" : capState === "tight" ? "tight" : ""}" style="width:calc(${pct}% - 6px);"></div>
    </div>
    <div class="cap-meter-readout">
      <span>SPENT <span class="numeric" style="color:var(--ink-primary);">$${spent}M</span> / $${cap}M</span>
      <span class="big">$${remaining}M left</span>
    </div>`;
  body.appendChild(meter);

  // roster wall
  const wallWrap = document.createElement("div");
  wallWrap.style.marginTop = "14px";
  wallWrap.innerHTML = `<div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Roster Wall ${locked ? "· LOCKED" : `(${filledCount}/5)`}</div>`;
  const wall = document.createElement("div");
  wall.className = "roster-wall" + (locked ? " lock-settle" : "");
  for (const slot of slots) {
    const el = document.createElement("div");
    el.className = "roster-slot" + (slot.player ? " filled arrive" : "");
    if (slot.player) {
      // G6: a clear, unmistakable remove control right on the card — not a small text link.
      el.innerHTML = `
        <div class="roster-slot-label">${POSITION_ICON[slot.id] ?? ""} ${slot.id}</div>
        <div class="mini-card">
          <div class="mini-card-name">${escapeHtml(slot.player.name)}</div>
          <div class="mini-card-pos">${slot.player.position}</div>
          <div class="mini-card-rating">RTG ${slot.player.rating}</div>
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:auto;">
            <div class="mini-card-salary" style="margin-top:0;">$${slot.player.price}M</div>
            ${locked ? "" : `<button class="mini-card-remove-btn" data-slot="${slot.id}" title="Remove ${escapeHtml(slot.player.name)}" aria-label="Remove">×</button>`}
          </div>
        </div>`;
      if (!locked) {
        el.querySelector(".mini-card-remove-btn")?.addEventListener("click", (e) => {
          e.stopPropagation();
          outbox?.submit({ type: "remove", slotId: slot.id });
        });
      }
    } else {
      const sugg = suggestions.find((x) => x.slot === slot.id);
      const hasCandidates = sugg && sugg.candidates.length > 0;
      const hasSwaps = sugg && sugg.candidates.length === 0 && sugg.swaps.length > 0;
      el.innerHTML = `
        <div class="roster-slot-label">${POSITION_ICON[slot.id] ?? ""} ${slot.id}</div>
        <div class="roster-slot-empty-glyph">+</div>
        ${
          hasCandidates && !locked
            ? `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">${sugg!.candidates
                .map((c) => `<span class="pill" style="font-size:10px; cursor:pointer;" data-place="${c.id}" data-slot="${slot.id}">${escapeHtml(c.name.split(" ")[0] ?? c.name)} $${c.price}M</span>`)
                .join("")}</div>`
            : ""
        }
        ${
          hasSwaps && !locked
            ? sugg!.swaps
                .map(
                  (s) =>
                    `<div class="swap-suggestion" data-swap-free="${s.freeSlot}" data-swap-place-slot="${slot.id}" data-swap-place-id="${s.unlocks.id}">
                       Free up $${s.freePlayerPrice}M by moving out <strong>${escapeHtml(s.freePlayerName)}</strong> → afford ${escapeHtml(s.unlocks.name)} ($${s.unlocks.price}M)
                     </div>`,
                )
                .join("")
            : ""
        }`;
    }
    wall.appendChild(el);
  }
  // wire up the guided-narrow suggestion chips
  wall.querySelectorAll<HTMLElement>("[data-place]").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      outbox?.submit({ type: "place", slotId: chip.dataset["slot"], playerId: chip.dataset["place"] });
    });
  });
  // G6: a swap suggestion is two actions in sequence — remove the blocker, then place the unlocked candidate.
  // The outbox is strictly ordered (one in flight at a time, submission order), so queuing both here is safe.
  wall.querySelectorAll<HTMLElement>("[data-swap-free]").forEach((row) => {
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      const freeSlot = row.dataset["swapFree"];
      const placeSlot = row.dataset["swapPlaceSlot"];
      const placeId = row.dataset["swapPlaceId"];
      if (!freeSlot || !placeSlot || !placeId) return;
      outbox?.submit({ type: "remove", slotId: freeSlot });
      outbox?.submit({ type: "place", slotId: placeSlot, playerId: placeId });
    });
  });
  wallWrap.appendChild(wall);
  body.appendChild(wallWrap);

  // lock button
  const lockWrap = document.createElement("div");
  lockWrap.style.marginTop = "12px";
  const lockBtn = document.createElement("button");
  lockBtn.id = "btnLock";
  lockBtn.className = "btn btn-primary full";
  lockBtn.textContent = locked ? "Roster locked" : filledCount === 5 ? "Lock your roster" : `Fill all 5 slots to lock (${filledCount}/5)`;
  lockBtn.disabled = locked || filledCount < 5;
  lockBtn.addEventListener("click", () => outbox?.submit({ type: "lock" }));
  lockWrap.appendChild(lockBtn);
  body.appendChild(lockWrap);

  // foregone panel — live, ambient, always visible while building
  if (!locked) {
    const foregoneEl = document.createElement("div");
    foregoneEl.className = "foregone-panel";
    foregoneEl.style.marginTop = "14px";
    foregoneEl.innerHTML = `<h3>Priced out right now</h3>`;
    if (foregone.length === 0) {
      foregoneEl.innerHTML += `<div class="foregone-row"><span>Everything on the board is still in reach.</span></div>`;
    } else {
      for (const p of foregone.slice(0, 10)) {
        const row = document.createElement("div");
        row.className = "foregone-row";
        row.innerHTML = `<span>${escapeHtml(p.name)} <span style="color:var(--ink-muted);">· ${escapeHtml(p.position)}</span></span><span class="price numeric">$${p.price}M</span>`;
        foregoneEl.appendChild(row);
      }
      if (foregone.length > 10) {
        const more = document.createElement("div");
        more.className = "eyebrow";
        more.style.fontSize = "11px";
        more.style.marginTop = "4px";
        more.textContent = `+ ${foregone.length - 10} more out of reach`;
        foregoneEl.appendChild(more);
      }
    }
    body.appendChild(foregoneEl);
  }

  // player market
  const marketWrap = document.createElement("div");
  marketWrap.style.marginTop = "14px";
  marketWrap.innerHTML = `<div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Player Market</div>`;
  const grid = document.createElement("div");
  grid.className = "market-grid";
  for (const p of market) {
    grid.appendChild(
      marketCardEl(p, { used: p.used, affordable: p.affordable }, () => {
        if (locked || p.used || !p.affordable) return;
        placeAuto(p, slots);
      }),
    );
  }
  marketWrap.appendChild(grid);
  body.appendChild(marketWrap);
}

function marketCardEl(p: Player, state: { used: boolean; affordable: boolean }, onClick: () => void): HTMLElement {
  const el = document.createElement("div");
  el.className = "market-card" + (state.used ? " used" : !state.affordable ? " unaffordable" : "");
  el.innerHTML = `
    <div class="market-card-name">${escapeHtml(p.name)}</div>
    <div class="mini-card-pos">${p.position}</div>
    <div class="market-card-meta">
      <span class="market-card-price numeric">$${p.price}M</span>
      <span class="market-card-rating">RTG ${p.rating}</span>
    </div>`;
  if (!state.used && state.affordable) el.addEventListener("click", onClick);
  return el;
}

/** Tap-to-place auto-targeting: the card's own position slot if open, else WILDCARD if open. */
function placeAuto(p: Player, slots: SlotView[]): void {
  const ownSlot = slots.find((s) => s.id === p.position && s.player === null);
  if (ownSlot) {
    outbox?.submit({ type: "place", slotId: ownSlot.id, playerId: p.id });
    return;
  }
  const wildcard = slots.find((s) => s.id === "WILDCARD" && s.player === null);
  if (wildcard) {
    outbox?.submit({ type: "place", slotId: "WILDCARD", playerId: p.id });
    return;
  }
  showError(`No open slot for ${p.name} — remove someone first.`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// ---- boot ----
if (creds) {
  joinCard.hidden = true;
  gameCard.hidden = false;
  startGame();
}
