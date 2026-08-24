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
  if (view["module"] === "m2-box-office") {
    renderBoxOffice(s, view);
    return;
  }
  if (view["module"] === "m1l2-trade-deadline") {
    renderTradeDeadline(s, view);
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
          <p style="margin:6px 0 0; font-size:12px; color:var(--ink-muted);">That player signed elsewhere for good. Your repair budget is their salary back, plus any room you already had left under the $100M cap.</p>
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

/* ------------------------------------------------------ box office render -- */

type BoxMarket = { id: string; name: string; flavor: string };
type BoxPreview = { attendance: number; fillPct: number; ticketRevenue: number; tvRevenue: number; merchRevenue: number; totalRevenue: number };
type BoxResult = BoxPreview & { price: number };

const ZONE_TITLE: Record<string, string> = { over: "EMPTY SEATS", under: "CASH CRUNCH", sweet: "RAISE OR HOLD" };
const FAN_DOT_COUNT = 100;

// The dial screen is rebuilt only when the phase/locked state actually
// changes — every live-drag update after that patches text/dot classes in
// place. Rebuilding the DOM on every server response (as draftDay does for
// its discrete, click-driven actions) would tear the <input type="range">
// out from under an in-progress pointer drag; this element is the one
// truly continuous control in the whole runtime, so it gets this extra care.
let boxDialMounted: { phase: string; locked: boolean } | null = null;
let boxDragging = false;
let boxLatestPrice: number | null = null;
let boxThrottleTimer: number | null = null;

/** Trailing-edge throttle: at most one setPrice submission per ~90ms, always carrying the latest value. */
function queueSetPrice(price: number, immediate = false): void {
  boxLatestPrice = price;
  if (immediate) {
    if (boxThrottleTimer !== null) {
      window.clearTimeout(boxThrottleTimer);
      boxThrottleTimer = null;
    }
    outbox?.submit({ type: "setPrice", price });
    return;
  }
  if (boxThrottleTimer !== null) return;
  boxThrottleTimer = window.setTimeout(() => {
    boxThrottleTimer = null;
    if (boxLatestPrice !== null) outbox?.submit({ type: "setPrice", price: boxLatestPrice });
  }, 90);
}

function renderBoxOffice(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  const phase = s.phase;
  if (phase !== "PLAY" && phase !== "COUNTERFACTUAL") boxDialMounted = null;

  switch (phase) {
    case "LOBBY":
      body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "You're in! Waiting for your teacher to start The Box Office."))}</div>`;
      return;

    case "HOOK":
      body.innerHTML = `
        <div class="panel" style="padding:20px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">The Box Office</div>
          <p style="font-size:16px; line-height:1.5; color:var(--ink-primary); margin:0;">${escapeHtml(String(view["message"]))}</p>
          <div class="pill" style="margin-top:14px;">$${view["priceMin"]}–$${view["priceMax"]} dial · $${Number(view["payrollTarget"]).toLocaleString()} payroll</div>
        </div>`;
      return;

    case "PLAY":
    case "COUNTERFACTUAL":
      renderBoxDialScreen(phase, view);
      return;

    case "REVEAL": {
      const result = view["result"] as BoxResult | null;
      const market = view["market"] as BoxMarket | null;
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["message"]))}</div>
        ${market && result != null && view["price"] != null ? renderResultCard("Homestand 1", market, Number(view["price"]), result, Number(view["payrollTarget"])) : ""}
      `;
      return;
    }

    case "CONSEQUENCE": {
      const zone = view["zone"] as string | undefined;
      if (!zone) {
        body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"]))}</div>`;
        return;
      }
      body.innerHTML = `
        <div class="zone-banner ${zone}">
          <div class="zone-banner-title">${escapeHtml(String(view["title"]))}</div>
          <p style="margin:10px 0 0; font-size:14px; line-height:1.5; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
        </div>`;
      return;
    }

    case "ADAPT":
      body.innerHTML = `
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px;">Adapt</div>
          <p style="margin:10px 0 0; font-size:15px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"]))}</p>
        </div>`;
      return;

    case "ARGUE": {
      const h1 = view["h1"] as BoxResult | null;
      const h2 = view["h2"] as BoxResult | null;
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["prompt"]))}</div>
        <div class="argue-compare">
          ${h1 ? renderCompareCol("Homestand 1", h1) : `<div class="argue-col"><div class="eyebrow" style="font-size:11px;">Homestand 1</div><p style="font-size:12px; color:var(--ink-muted);">Not locked.</p></div>`}
          ${h2 ? renderCompareCol("Homestand 2", h2) : `<div class="argue-col"><div class="eyebrow" style="font-size:11px;">Homestand 2</div><p style="font-size:12px; color:var(--ink-muted);">Not locked.</p></div>`}
        </div>`;
      return;
    }

    case "SYNTHESIS":
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["message"]))}</div>
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

function renderResultCard(label: string, market: BoxMarket, price: number, result: BoxResult, payrollTarget: number): string {
  const delta = result.totalRevenue - payrollTarget;
  return `
    <div class="panel" style="padding:16px; margin-top:12px;">
      <div class="eyebrow" style="font-size:11px;">${escapeHtml(label)} · ${escapeHtml(market.name)}</div>
      <div class="numeric" style="font-size:26px; color:var(--accent-gold); margin-top:6px;">$${price} a ticket</div>
      <div class="statline" style="margin-top:8px; color:var(--ink-secondary); display:flex; justify-content:space-between;"><span>${result.attendance.toLocaleString()} fans</span><span>$${result.totalRevenue.toLocaleString()} total</span></div>
      <div class="pill ${delta >= 0 ? "pill-comfortable" : "pill-tight"}" style="margin-top:8px;">${delta >= 0 ? `+$${delta.toLocaleString()} over payroll` : `−$${Math.abs(delta).toLocaleString()} short of payroll`}</div>
    </div>`;
}

function renderCompareCol(label: string, r: BoxResult): string {
  return `
    <div class="argue-col">
      <div class="eyebrow" style="font-size:11px;">${escapeHtml(label)}</div>
      <div class="numeric" style="font-size:22px; color:var(--accent-gold);">$${r.price}</div>
      <div style="font-size:12px; color:var(--ink-secondary); margin-top:4px;">${r.attendance.toLocaleString()} fans</div>
      <div style="font-size:12px; color:var(--ink-secondary);">$${r.totalRevenue.toLocaleString()} revenue</div>
    </div>`;
}

function renderBoxDialScreen(phase: "PLAY" | "COUNTERFACTUAL", view: Record<string, unknown>): void {
  const body = $("gameBody");
  const locked = Boolean(view["locked"]);
  const market = view["market"] as BoxMarket | null;

  if (view["blocked"]) {
    body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"]))}</div>`;
    boxDialMounted = null;
    return;
  }

  if (locked) {
    body.innerHTML = `
      <div class="panel" style="padding:18px;">
        <div class="eyebrow" style="font-size:12px;">${market ? escapeHtml(market.name) : ""}</div>
        <div class="numeric" style="font-size:30px; color:var(--accent-gold); margin-top:8px;">$${view["price"]} locked</div>
        <p style="margin-top:10px; font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
      </div>`;
    boxDialMounted = { phase, locked: true };
    return;
  }

  const price = Number(view["price"] ?? 10);
  const priceMin = Number(view["priceMin"] ?? 10);
  const priceMax = Number(view["priceMax"] ?? 120);
  const priceStep = Number(view["priceStep"] ?? 5);
  const payrollTarget = Number(view["payrollTarget"] ?? 0);
  const preview = (view["preview"] as BoxPreview | null) ?? null;
  const zone = view["zone"] as string | undefined;

  const signature = { phase, locked: false };
  const rootMissing = !document.getElementById("boxDialRoot");
  const needsFullBuild = rootMissing || !boxDialMounted || boxDialMounted.phase !== signature.phase || boxDialMounted.locked !== signature.locked;

  if (needsFullBuild) {
    body.innerHTML = `
      <div id="boxDialRoot">
        ${market ? `<div class="market-flavor-card"><div class="market-flavor-name">${escapeHtml(market.name)}</div><div class="market-flavor-text">${escapeHtml(market.flavor)}</div></div>` : ""}
        ${zone ? `<div class="pill pill-tight" style="margin-bottom:10px;">Homestand 2 opened: ${ZONE_TITLE[zone] ?? zone.toUpperCase()}</div>` : ""}
        <div class="price-dial-wrap">
          <div class="eyebrow" style="font-size:11px; text-align:center;">Price Dial</div>
          <div class="price-dial-readout" id="boxPriceReadout">$${price}</div>
          <input type="range" id="boxPriceInput" class="price-dial-input" min="${priceMin}" max="${priceMax}" step="${priceStep}" value="${price}" />
          <div class="price-dial-ends"><span>$${priceMin}</span><span>$${priceMax}</span></div>
        </div>
        <div class="fan-meter-wrap">
          <div class="eyebrow" style="font-size:11px;">Fan Meter</div>
          <div class="fan-meter" id="boxFanMeter">${Array.from({ length: FAN_DOT_COUNT }, () => `<div class="fan-dot"></div>`).join("")}</div>
          <div class="fan-meter-readout"><span id="boxAttendanceReadout">— fans</span><span>capacity live</span></div>
        </div>
        <div class="revenue-flow">
          <div class="eyebrow" style="font-size:11px;">Revenue Flow</div>
          <div class="revenue-pipe"><span class="revenue-pipe-label">Ticket</span><div class="revenue-pipe-track"><div class="revenue-pipe-fill ticket" id="boxTicketBar" style="width:0%;"></div></div><span class="revenue-pipe-num numeric" id="boxTicketNum">$0</span></div>
          <div class="revenue-pipe"><span class="revenue-pipe-label">TV</span><div class="revenue-pipe-track"><div class="revenue-pipe-fill tv" id="boxTvBar" style="width:0%;"></div></div><span class="revenue-pipe-num numeric" id="boxTvNum">$0</span></div>
          <div class="revenue-pipe"><span class="revenue-pipe-label">Merch</span><div class="revenue-pipe-track"><div class="revenue-pipe-fill merch" id="boxMerchBar" style="width:0%;"></div></div><span class="revenue-pipe-num numeric" id="boxMerchNum">$0</span></div>
          <div class="revenue-total-row">
            <span class="eyebrow" style="font-size:11px;">Total vs $${payrollTarget.toLocaleString()} payroll</span>
            <span class="revenue-total-num numeric" id="boxTotalNum">$0</span>
          </div>
          <div id="boxPayrollDelta" class="pill" style="margin-top:6px;"></div>
        </div>
        <button id="boxLockBtn" class="btn btn-primary full" style="margin-top:14px;">Lock this price</button>
      </div>`;
    wireBoxDialEvents();
    boxDialMounted = signature;
  }

  const readout = document.getElementById("boxPriceReadout");
  if (readout) readout.textContent = `$${price}`;
  const input = document.getElementById("boxPriceInput") as HTMLInputElement | null;
  if (input && !boxDragging) input.value = String(price);
  patchBoxDialLive(preview, payrollTarget);
}

function wireBoxDialEvents(): void {
  const input = document.getElementById("boxPriceInput") as HTMLInputElement | null;
  const readout = document.getElementById("boxPriceReadout");
  if (input) {
    const onDragStart = () => {
      boxDragging = true;
    };
    const onDragEnd = () => {
      boxDragging = false;
    };
    input.addEventListener("pointerdown", onDragStart);
    input.addEventListener("pointerup", onDragEnd);
    input.addEventListener("touchstart", onDragStart, { passive: true });
    input.addEventListener("touchend", onDragEnd);
    input.addEventListener("input", () => {
      const price = Number(input.value);
      if (readout) readout.textContent = `$${price}`;
      queueSetPrice(price);
    });
    input.addEventListener("change", () => {
      boxDragging = false;
      queueSetPrice(Number(input.value), true);
    });
  }
  document.getElementById("boxLockBtn")?.addEventListener("click", () => outbox?.submit({ type: "lock" }));
}

function patchBoxDialLive(preview: BoxPreview | null, payrollTarget: number): void {
  if (!preview) return;
  const dots = document.querySelectorAll<HTMLElement>("#boxFanMeter .fan-dot");
  const filled = Math.round((preview.fillPct / 100) * dots.length);
  dots.forEach((dot, i) => dot.classList.toggle("filled", i < filled));

  setText("boxAttendanceReadout", `${preview.attendance.toLocaleString()} fans`);
  setText("boxTicketNum", `$${preview.ticketRevenue.toLocaleString()}`);
  setText("boxTvNum", `$${preview.tvRevenue.toLocaleString()}`);
  setText("boxMerchNum", `$${preview.merchRevenue.toLocaleString()}`);
  setText("boxTotalNum", `$${preview.totalRevenue.toLocaleString()}`);

  const maxBar = Math.max(preview.ticketRevenue, preview.tvRevenue, preview.merchRevenue, 1);
  setWidth("boxTicketBar", preview.ticketRevenue, maxBar);
  setWidth("boxTvBar", preview.tvRevenue, maxBar);
  setWidth("boxMerchBar", preview.merchRevenue, maxBar);

  const delta = preview.totalRevenue - payrollTarget;
  const deltaEl = document.getElementById("boxPayrollDelta");
  if (deltaEl) {
    deltaEl.textContent = delta >= 0 ? `+$${delta.toLocaleString()} over payroll` : `−$${Math.abs(delta).toLocaleString()} short of payroll`;
    deltaEl.className = `pill ${delta >= 0 ? "pill-comfortable" : "pill-tight"}`;
  }
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setWidth(id: string, value: number, max: number): void {
  const el = document.getElementById(id);
  if (el) el.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

/* ------------------------------------------------------ trade deadline render -- */

type TDFranchise = { name: string; crestIndex: number; origin?: string };
type TDPlayer = { id: string; name: string; position: string; price: number; rating: number };
type TDReportRow = { slot: string; name: string; position: string; price: number; draftRating: number; formTag: "slumping" | "steady" | "breaking-out"; currentForm: number; reason: string };
type TDStanding = { rank: number; totalTeams: number; avgForm: number; inHunt: boolean };
type TDAvailable = { index: number; name: string; crestIndex: number; spend: number; capRoom: number; roster: (TDPlayer | null)[] };
type TDSlot = { id: string; player: TDPlayer | null; cutBudget: number };
type TDTarget = { id: string; name: string; position: string; flavor: string; floor: number; ceiling: number };
type TDRevealedTarget = { id: string; name: string; position: string; floor: number; ceiling: number; trueValue: number; bidCount: number; winnerFranchise: TDFranchise | null; winningBid: number | null; verdict: "steal" | "curse" | "fair" | "unsold" };

const STAND_PAT_COPY: Record<string, string> = {
  "happy-with-roster": "We like what we built. Not fixing what isn't broken.",
  "protect-cap-room": "We're protecting our cap room for later, not spending it now.",
  "risk-too-high": "Every option on the table right now is too risky for what we'd gain.",
  "no-good-fit": "Nothing available actually fits what our roster needs.",
};
const VERDICT_LABEL: Record<string, string> = { steal: "STEAL", curse: "WINNER'S CURSE", fair: "FAIR PRICE", unsold: "UNSOLD" };

// The uncommitted PLAY decision screen holds real, uncontrolled <input> state (the bid stepper's current value) —
// re-rendering its DOM on every poll tick (nothing server-side changes while uncommitted) would wipe whatever a
// student was mid-typing. Same guarded-rebuild discipline as box office's price dial.
let tdPlayMounted: { phase: string; committed: boolean } | null = null;

function renderTradeDeadline(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (s.phase !== "PLAY") tdPlayMounted = null;

  switch (s.phase) {
    case "LOBBY":
      body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "You're in! Waiting for your teacher to start the Trade Deadline."))}</div>`;
      return;

    case "HOOK":
      renderTDHook(view);
      return;

    case "PLAY":
      renderTDPlay(view);
      return;

    case "REVEAL":
      renderTDReveal(view);
      return;

    case "ADAPT":
      renderTDAdapt(view);
      return;

    case "SYNTHESIS":
      body.innerHTML = `
        <div class="banner">${escapeHtml(String(view["message"]))}</div>
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

function renderTDHook(view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (!view["claimed"]) {
    const available = (view["available"] as TDAvailable[]) ?? [];
    body.innerHTML = `
      <div class="panel" style="padding:16px;">
        <div class="eyebrow" style="font-size:12px;">Claim your franchise</div>
        <p style="margin:8px 0 14px; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
        <div class="claim-grid" id="claimGrid"></div>
      </div>`;
    const grid = $("claimGrid");
    for (const entry of available) {
      const card = document.createElement("div");
      card.className = "claim-card";
      card.dataset["carriedIndex"] = String(entry.index);
      card.innerHTML = `
        <div class="claim-card-head"><span style="${crestStyle(entry.crestIndex, 22)}"></span><span class="claim-card-name">${escapeHtml(entry.name)}</span></div>
        <div class="claim-card-meta">$${entry.spend}M spent · $${entry.capRoom}M cap room left</div>
        <div class="claim-card-roster">${entry.roster.filter((p): p is TDPlayer => p !== null).map((p) => `<span>${escapeHtml(p.name.split(" ")[0] ?? p.name)} $${p.price}M</span>`).join("")}</div>`;
      card.addEventListener("click", () => outbox?.submit({ type: "claim", carriedIndex: entry.index }));
      grid.appendChild(card);
    }
    const stock = document.createElement("div");
    stock.className = "claim-card stock";
    stock.innerHTML = `
      <div class="claim-card-head"><span class="claim-card-name">Start an expansion franchise</span></div>
      <div class="claim-card-meta">A fresh, balanced, league-typical roster — no Draft Day history behind it.</div>`;
    stock.addEventListener("click", () => outbox?.submit({ type: "claim", carriedIndex: null }));
    grid.appendChild(stock);
    return;
  }

  const franchise = view["franchise"] as TDFranchise;
  const report = (view["report"] as TDReportRow[]) ?? [];
  const weakestSlot = view["weakestSlot"] as string | null;
  const standing = view["standing"] as TDStanding | null;
  body.innerHTML = `
    <div class="panel" style="padding:16px;">
      <div class="claim-card-head" style="margin-bottom:10px;"><span style="${crestStyle(franchise.crestIndex, 26)}"></span><span class="claim-card-name" style="font-size:17px;">${escapeHtml(franchise.name)}</span>${franchise.origin === "stock" ? '<span class="pill" style="margin-left:6px; font-size:10px;">EXPANSION</span>' : ""}</div>
      <p style="margin:0 0 12px; font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
      <div class="pill">$${view["spend"]}M spent · $${view["capRoom"]}M cap room</div>
      <div class="eyebrow" style="font-size:12px; margin:16px 0 4px;">Midseason report</div>
      <div id="reportList"></div>
    </div>
    ${standing ? `<div class="standing-card"><span>League standing</span><span class="standing-rank">#${standing.rank} of ${standing.totalTeams}</span><span style="font-size:12px; color:${standing.inHunt ? "var(--cap-safe)" : "var(--ink-muted)"};">${standing.inHunt ? "In the playoff hunt" : "On the outside looking in"}</span></div>` : ""}`;
  const list = $("reportList");
  for (const row of report) {
    const el = document.createElement("div");
    el.className = "report-row" + (row.slot === weakestSlot ? " weakest" : "");
    el.innerHTML = `
      <div class="report-row-main">
        <span class="report-row-name">${escapeHtml(row.name)} <span style="color:var(--ink-muted); font-weight:400;">· ${row.position} · $${row.price}M</span></span>
        <div class="report-row-reason">${escapeHtml(row.reason)}</div>
      </div>
      <span class="form-badge ${row.formTag}">${row.formTag.replace("-", " ")}</span>`;
    list.appendChild(el);
  }
}

function renderTDPlay(view: Record<string, unknown>): void {
  const body = $("gameBody");

  if (!view["franchise"] && !view["committed"]) {
    body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "You never claimed a franchise — talk to your teacher."))}</div>`;
    tdPlayMounted = null;
    return;
  }

  const committed = Boolean(view["committed"]);
  const signature = { phase: "PLAY", committed };
  const rootMissing = !committed && !document.getElementById("tdWall");
  const alreadyMounted = tdPlayMounted && tdPlayMounted.phase === signature.phase && tdPlayMounted.committed === signature.committed && !rootMissing;
  if (alreadyMounted) {
    // Nothing about this screen's server-derived content changes while uncommitted (the market of veterans/
    // targets/reasons is fixed, cutBudget is stable pre-cut) — skip the rebuild so a bid stepper or any other
    // in-progress, uncontrolled DOM state a student is mid-interacting-with survives the next poll tick.
    return;
  }
  tdPlayMounted = signature;

  if (committed) {
    body.innerHTML = `<div class="banner">Your deadline decision is locked in. Look up at the board when the reveal starts.</div>${renderTDDecisionRecap(view)}`;
    return;
  }

  const franchise = view["franchise"] as TDFranchise;
  const slots = (view["slots"] as TDSlot[]) ?? [];
  const veterans = (view["veterans"] as TDPlayer[]) ?? [];
  const targets = (view["targets"] as TDTarget[]) ?? [];
  const standPatReasons = (view["standPatReasons"] as string[]) ?? [];
  const bidStep = Number(view["bidStep"] ?? 5);
  const minBid = Number(view["minBid"] ?? 5);

  body.innerHTML = `
    <div class="panel" style="padding:14px;">
      <div class="claim-card-head"><span style="${crestStyle(franchise.crestIndex, 20)}"></span><span class="claim-card-name">${escapeHtml(franchise.name)}</span></div>
      <div class="pill" style="margin-top:8px;">$${view["capRoom"]}M cap room right now</div>
    </div>

    <div class="panel" style="padding:14px; margin-top:12px;">
      <div class="eyebrow" style="font-size:12px;">Stand pat — keep this exact roster</div>
      <div class="reason-grid" id="standPatGrid"></div>
    </div>

    <div class="eyebrow" style="font-size:12px; margin:16px 0 8px;">Or, cut a player</div>
    <div class="roster-wall" id="tdWall"></div>
    <div id="tdDecisionPanel" style="margin-top:14px;"></div>`;

  const spGrid = $("standPatGrid");
  for (const reason of standPatReasons) {
    const btn = document.createElement("button");
    btn.className = "btn full";
    btn.style.textAlign = "left";
    btn.style.fontSize = "12px";
    btn.dataset["reason"] = reason;
    btn.innerHTML = STAND_PAT_COPY[reason] ?? reason;
    btn.addEventListener("click", () => {
      if (confirm(`Stand pat: "${STAND_PAT_COPY[reason] ?? reason}" — this locks your roster exactly as-is for the deadline. Continue?`)) {
        outbox?.submit({ type: "standPat", reason });
      }
    });
    spGrid.appendChild(btn);
  }

  const wall = $("tdWall");
  for (const slot of slots) {
    const el = document.createElement("div");
    el.className = "roster-slot filled";
    el.style.cursor = "pointer";
    el.dataset["slot"] = slot.id;
    if (slot.player) {
      el.innerHTML = `
        <div class="roster-slot-label">${POSITION_ICON[slot.id] ?? ""} ${slot.id}</div>
        <div class="mini-card">
          <div class="mini-card-name">${escapeHtml(slot.player.name)}</div>
          <div class="mini-card-pos">${slot.player.position}</div>
          <div class="mini-card-rating">RTG ${slot.player.rating}</div>
          <div class="mini-card-salary">$${slot.player.price}M</div>
        </div>`;
      el.addEventListener("click", () => renderTDDecisionPanel(slot, veterans, targets, bidStep, minBid));
    } else {
      el.innerHTML = `<div class="roster-slot-label">${POSITION_ICON[slot.id] ?? ""} ${slot.id}</div><div class="roster-slot-empty-glyph">—</div>`;
    }
    wall.appendChild(el);
  }
}

/** Rendered on demand when a student taps a roster slot to consider cutting it — the veteran/target choices for
 *  that exact slot (position-matched, or every option for WILDCARD), each with its own affordability check. */
function renderTDDecisionPanel(slot: TDSlot, veterans: TDPlayer[], targets: TDTarget[], bidStep: number, minBid: number): void {
  const panel = $("tdDecisionPanel");
  const isWildcard = slot.id === "WILDCARD";
  const eligibleVeterans = isWildcard ? veterans : veterans.filter((v) => v.position === slot.id);
  const eligibleTargets = isWildcard ? targets : targets.filter((t) => t.position === slot.id);

  panel.innerHTML = `
    <div class="panel" style="padding:14px; border-color:var(--over-the-line);">
      <div class="eyebrow" style="font-size:12px; color:#ff9aa4;"><span class="tear-icon" style="display:inline-block; vertical-align:middle; margin-right:4px;"></span>Cutting ${escapeHtml(slot.player!.name)}</div>
      <p style="margin:8px 0 4px; font-size:12px; color:var(--ink-secondary);">You get back ~90% of their $${slot.player!.price}M salary — the rest stays on the cap as dead cap. Your budget for this slot: <strong style="color:var(--accent-gold);">$${slot.cutBudget}M</strong>.</p>

      <div class="eyebrow" style="font-size:11px; margin-top:14px;">Safe: sign a known veteran</div>
      <div id="tdVeteranList"></div>

      <div class="eyebrow" style="font-size:11px; margin-top:16px;">Risky: sealed bid on a deadline target</div>
      <div id="tdTargetList"></div>
    </div>`;

  const vetList = $("tdVeteranList");
  if (eligibleVeterans.length === 0) {
    vetList.innerHTML = `<div class="eyebrow" style="font-size:11px; color:var(--ink-muted);">No veteran fits this slot.</div>`;
  }
  for (const v of eligibleVeterans) {
    const affordable = v.price <= slot.cutBudget;
    const row = document.createElement("div");
    row.className = "veteran-card";
    row.dataset["veteranId"] = v.id;
    row.style.marginTop = "6px";
    row.style.opacity = affordable ? "1" : "0.4";
    row.style.cursor = affordable ? "pointer" : "not-allowed";
    row.innerHTML = `<span>${escapeHtml(v.name)} <span style="color:var(--ink-muted); font-size:11px;">· ${v.position} · RTG ${v.rating}</span></span><span class="numeric" style="color:var(--accent-gold);">$${v.price}M</span>`;
    if (affordable) {
      row.addEventListener("click", () => {
        if (confirm(`Cut ${slot.player!.name} and sign ${v.name} for $${v.price}M? This is final.`)) {
          outbox?.submit({ type: "cutForVeteran", slot: slot.id, veteranId: v.id });
        }
      });
    }
    vetList.appendChild(row);
  }

  const tgtList = $("tdTargetList");
  if (eligibleTargets.length === 0) {
    tgtList.innerHTML = `<div class="eyebrow" style="font-size:11px; color:var(--ink-muted);">No target fits this slot.</div>`;
  }
  for (const t of eligibleTargets) {
    const card = document.createElement("div");
    card.className = "target-card";
    card.dataset["targetId"] = t.id;
    card.style.marginTop = "8px";
    const maxBid = Math.max(minBid, Math.floor(slot.cutBudget / bidStep) * bidStep);
    const canBid = slot.cutBudget >= minBid;
    card.innerHTML = `
      <div class="target-card-name">${escapeHtml(t.name)} <span style="color:var(--ink-muted); font-weight:400; font-size:11px;">· ${t.position}</span></div>
      <div class="target-card-flavor">${escapeHtml(t.flavor)}</div>
      <div class="target-band"><span>$${t.floor}M</span><div class="target-band-track"></div><span>$${t.ceiling}M</span></div>
      ${
        canBid
          ? `<div class="bid-stepper">
              <button type="button" data-step="-1" class="btn">−</button>
              <span class="bid-stepper-readout" data-readout>$${minBid}M</span>
              <button type="button" data-step="1" class="btn">+</button>
            </div>
            <button type="button" class="btn btn-danger full" style="margin-top:8px;" data-submit-bid>Cut &amp; submit sealed bid</button>`
          : `<div class="eyebrow" style="font-size:11px; color:var(--ink-muted); margin-top:8px;">Your budget here ($${slot.cutBudget}M) can't cover even the minimum bid.</div>`
      }`;
    if (canBid) {
      let current = minBid;
      const readout = card.querySelector<HTMLElement>("[data-readout]")!;
      card.querySelectorAll<HTMLButtonElement>("[data-step]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const delta = Number(btn.dataset["step"]) * bidStep;
          current = Math.max(minBid, Math.min(maxBid, current + delta));
          readout.textContent = `$${current}M`;
        });
      });
      card.querySelector("[data-submit-bid]")?.addEventListener("click", () => {
        if (confirm(`Cut ${slot.player!.name} and bid $${current}M on ${t.name}? Sealed — nobody can see this number until the reveal. This is final either way.`)) {
          outbox?.submit({ type: "cutForBid", slot: slot.id, targetId: t.id, bidAmount: current });
        }
      });
    }
    tgtList.appendChild(card);
  }
}

function renderTDDecisionRecap(view: Record<string, unknown>): string {
  const path = view["path"] as string;
  if (path === "standPat") {
    const reason = view["standPatReason"] as string;
    return `<div class="panel" style="padding:16px; margin-top:12px;"><div class="eyebrow" style="font-size:12px;">Stood pat</div><p style="margin:8px 0 0; font-size:14px;">${escapeHtml(STAND_PAT_COPY[reason] ?? reason)}</p></div>`;
  }
  const cutPlayer = view["cutPlayer"] as TDPlayer | null;
  const deadCap = view["deadCapCharge"] as number;
  const cutLine = cutPlayer
    ? `<div class="panel" style="padding:14px;"><div class="eyebrow" style="font-size:11px; color:#ff9aa4;"><span class="tear-icon" style="display:inline-block; vertical-align:middle; margin-right:4px;"></span>Cut ${escapeHtml(cutPlayer.name)}</div><p style="margin:6px 0 0; font-size:12px; color:var(--ink-secondary);">$${deadCap}M dead cap stayed on the books.</p></div>`
    : "";
  if (path === "veteran") {
    const vet = view["veteran"] as TDPlayer | null;
    return `${cutLine}<div class="panel" style="padding:14px; margin-top:10px;"><div class="eyebrow" style="font-size:11px;">Signed</div><p style="margin:6px 0 0; font-size:14px;">${vet ? escapeHtml(vet.name) + ` — $${vet.price}M, RTG ${vet.rating}` : ""}</p></div>`;
  }
  if (path === "bid") {
    const target = view["target"] as { name: string } | null;
    const bidAmount = view["bidAmount"] as number;
    const outcome = view["bidOutcome"] as string | null;
    return `${cutLine}<div class="panel" style="padding:14px; margin-top:10px;"><div class="eyebrow" style="font-size:11px;">Sealed bid — target: ${target ? escapeHtml(target.name) : ""}</div><p style="margin:6px 0 0; font-size:14px;">Your bid: $${bidAmount}M ${outcome ? `— <strong>${outcome === "won" ? "WON" : "LOST"}</strong>` : "(sealed — nobody can see this yet)"}</p></div>`;
  }
  return "";
}

function renderTDReveal(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const franchise = view["franchise"] as TDFranchise | undefined;
  const yourDecision = view["yourDecision"] as Record<string, unknown> | undefined;
  const revealed = (view["revealed"] as TDRevealedTarget[]) ?? [];
  const waitingOn = view["waitingOn"] as string | null;

  body.innerHTML = `
    ${franchise ? `<div class="panel" style="padding:12px;"><div class="claim-card-head"><span style="${crestStyle(franchise.crestIndex, 18)}"></span><span class="claim-card-name" style="font-size:13px;">${escapeHtml(franchise.name)}</span></div></div>` : ""}
    ${yourDecision ? `<div style="margin-top:10px;">${renderTDDecisionRecap(yourDecision)}</div>` : ""}
    ${waitingOn ? `<div class="banner" style="margin-top:12px;">Your target hasn't been revealed yet — watch the board.</div>` : ""}
    <div class="eyebrow" style="font-size:12px; margin:16px 0 8px;">Revealed so far</div>
    <div id="revealList"></div>`;

  const list = $("revealList");
  if (revealed.length === 0) {
    list.innerHTML = `<div class="eyebrow" style="font-size:11px; color:var(--ink-muted);">Nothing revealed yet — watch the board.</div>`;
  }
  for (const r of revealed) {
    const card = document.createElement("div");
    card.className = "reveal-target-card";
    card.innerHTML = `
      <div class="reveal-target-head">
        <span class="claim-card-name" style="font-size:13px;">${escapeHtml(r.name)} <span style="color:var(--ink-muted); font-weight:400; font-size:11px;">· ${r.position}</span></span>
        <span class="verdict-badge ${r.verdict}">${VERDICT_LABEL[r.verdict] ?? r.verdict}</span>
      </div>
      <p style="margin:8px 0 0; font-size:12px; color:var(--ink-secondary);">${r.bidCount} bid${r.bidCount === 1 ? "" : "s"} came in. ${
        r.winnerFranchise
          ? `<strong style="color:var(--ink-primary);">${escapeHtml(r.winnerFranchise.name)}</strong> won at <span class="numeric" style="color:var(--accent-gold);">$${r.winningBid}M</span> — turned out to be worth about $${r.trueValue}M.`
          : r.bidCount === 0
            ? "Nobody bid on this one."
            : "Every bid came in under the hidden reserve — nobody signed this one."
      }</p>`;
    list.appendChild(card);
  }
}

function renderTDAdapt(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const openSlot = view["openSlot"] as string | null;
  if (!openSlot) {
    body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "Your roster is full going into the rest of the season — nothing to do here."))}</div>`;
    return;
  }
  if (view["rescued"]) {
    body.innerHTML = `<div class="banner">Rescue signed. Your ${escapeHtml(openSlot)} slot is filled again.</div>`;
    return;
  }
  const candidates = (view["candidates"] as TDPlayer[]) ?? [];
  body.innerHTML = `
    <div class="panel" style="padding:16px;">
      <div class="eyebrow" style="font-size:12px; color:#ff9aa4;">Open slot: ${escapeHtml(openSlot)}</div>
      <p style="margin:8px 0 12px; font-size:12px; color:var(--ink-secondary);">Your sealed bid didn't clear — the slot's still empty. Sign a fallback now.</p>
      <div class="rescue-grid" id="rescueGrid"></div>
    </div>`;
  const grid = $("rescueGrid");
  for (const p of candidates) {
    grid.appendChild(
      marketCardEl(p, { used: false, affordable: true }, () => {
        if (confirm(`Sign ${p.name} for $${p.price}M?`)) outbox?.submit({ type: "rescueFill", playerId: p.id });
      }),
    );
  }
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
