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
    // gate-l1-projector repair 6: auto-collapse so the decision surface gets its
    // first viewport back. The pair can reopen it from the strip at any time.
    window.setTimeout(hidePin, 20_000);
  }
  startGame();
}

function hidePin(): void {
  if (pinCard.hidden) return;
  pinCard.hidden = true;
  $("btnShowPin").hidden = false;
}
$("btnHidePin").addEventListener("click", hidePin);
$("btnShowPin").addEventListener("click", () => {
  pinCard.hidden = false;
  $("btnShowPin").hidden = true;
});

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
  if (view["module"] === "m1l3-free-agency") {
    renderFreeAgency(s, view);
    return;
  }
  if (view["module"] === "m2l1-full-house") {
    renderFullHouse(s, view);
    return;
  }
  if (view["module"] === "m2l2-host-league") {
    renderHostLeague(s, view);
    return;
  }
  if (view["module"] === "m2l3-write-rule") {
    renderWriteRule(s, view);
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

/** Shared by HOOK's claim picker and PLAY's late-joiner claim picker (M1 repair, VERIFY_L2.md MODERATE) — same
 *  markup/behavior either way, just a different lead-in message the caller supplies via `view.message`. */
function renderTDClaimPicker(view: Record<string, unknown>): void {
  const body = $("gameBody");
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
}

function renderTDHook(view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (!view["claimed"]) {
    renderTDClaimPicker(view);
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

  // M1 repair (VERIFY_L2.md MODERATE): a late joiner (never claimed, but PLAY still allows it — see the
  // module's studentView) gets the same claim picker HOOK offers, not a dead end. No uncontrolled input lives
  // on this screen, so it's fine to just let it rebuild every poll like most screens do.
  if (view["claimed"] === false) {
    tdPlayMounted = null;
    renderTDClaimPicker(view);
    return;
  }
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

/* ------------------------------------------------------- free agency render -- */

type FAFranchise = { name: string; crestIndex: number; origin?: string };
type FACard = { playerId: string; name: string; position: string; price: number; form: number } | null;
type FARosterSlot = { id: string; player: FACard; releaseDeadCap: number };
type FAAvailable = { index: number; name: string; crestIndex: number; origin: string; deadCapCarried: number; capRoom: number; roster: FACard[] };
type FAAgentCard = {
  id: string;
  name: string;
  position: string;
  tier: string;
  flavor: string;
  factorHint: string;
  openingAsk: number;
  ask: number;
  trend: number;
  priceHistory: number[];
  interestCount: number;
  signed: boolean;
  signedAmount: number | null;
  signedDay: number | null;
  signedFranchise: FAFranchise | null;
};
type FAResolutionRow = {
  agentId: string;
  agentName: string;
  signed: boolean;
  franchise?: FAFranchise | null;
  amount?: number | null;
  offerCount: number;
  askBefore?: number;
  askAfter?: number;
  ownAmount?: number | null;
  allOffers?: { seatId: string; amount: number }[] | null;
};
type FADayHistory = { day: number; resolutions: FAResolutionRow[] };
type FAStanding = { seatId: string; franchise: FAFranchise; form: number; capRoom: number; rank: number };
type FAAgentReveal = FAAgentCard & { revealed: boolean; playoffFactor: number | null; signedAmount: number | null };
type FAWindowRecap = { signedCount: number; totalAgents: number; totalSpent: number; biggestContract: { agentName: string; amount: number; day: number; franchise: FAFranchise } | null; steepestFall: { agentName: string; from: number; to: number } | null };
type FAPlayoffMatch = { a: FAStanding; b: FAStanding; winner: FAStanding };
type FAPlayoffs = { field: FAStanding[]; semis: FAPlayoffMatch[]; final: FAPlayoffMatch | null; champion: FAStanding | null };
type FAAward = { id: string; title: string; franchise: FAFranchise | null; agentName: string | null; body: string };

const FA_TIER_LABEL: Record<string, string> = { star: "STAR", solid: "SOLID", value: "VALUE" };

// The offer composer holds live, uncontrolled input state (the amount stepper) — same guarded-rebuild
// discipline as trade deadline's own PLAY screen (tdPlayMounted) and box office's price dial: only tear down
// and rebuild the DOM when something the SERVER actually changed (day, acted state, or which agent's
// composer is open), never on every ~1.2s poll tick, so an in-progress stepper value survives.
let faPlayMounted: { day: number; acted: boolean; held: boolean; outForDay: boolean; openAgentId: string | null } | null = null;
let faComposerSlot: string | null = null;
let faComposerAmount = 0;

function renderFreeAgency(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (s.phase !== "PLAY") faPlayMounted = null;

  switch (s.phase) {
    case "LOBBY":
      body.innerHTML = `<div class="banner">${escapeHtml(String(view["message"] ?? "You're in! Waiting for your teacher to start Free Agency."))}</div>`;
      return;
    case "HOOK":
      renderFAHook(view);
      return;
    case "PLAY":
      renderFAPlay(view);
      return;
    case "REVEAL":
      renderFAReveal(view);
      return;
    case "COUNTERFACTUAL":
      renderFACounterfactual(view);
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

/** Shared by HOOK's claim picker and PLAY's late-joiner claim picker. */
function renderFAClaimPicker(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const available = (view["available"] as FAAvailable[]) ?? [];
  body.innerHTML = `
    <div class="panel" style="padding:16px;">
      <div class="eyebrow" style="font-size:12px;">Claim your franchise</div>
      <p style="margin:8px 0 14px; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
      <div class="claim-grid" id="faClaimGrid"></div>
    </div>`;
  const grid = $("faClaimGrid");
  for (const entry of available) {
    const card = document.createElement("div");
    card.className = "claim-card";
    card.dataset["carriedIndex"] = String(entry.index);
    const originLabel = entry.origin === "l2" ? "FROM THE DEADLINE" : entry.origin === "l1" ? "FROM DRAFT DAY" : "EXPANSION";
    card.innerHTML = `
      <div class="claim-card-head"><span style="${crestStyle(entry.crestIndex, 22)}"></span><span class="claim-card-name">${escapeHtml(entry.name)}</span></div>
      <div class="claim-card-meta">${originLabel} · $${entry.capRoom}M cap room${entry.deadCapCarried > 0 ? ` · $${entry.deadCapCarried}M dead cap carried` : ""}</div>
      <div class="claim-card-roster">${entry.roster.filter((p): p is NonNullable<FACard> => p !== null).map((p) => `<span>${escapeHtml(p.name.split(" ")[0] ?? p.name)} $${p.price}M</span>`).join("")}</div>`;
    card.addEventListener("click", () => outbox?.submit({ type: "claim", carriedIndex: entry.index }));
    grid.appendChild(card);
  }
  const stock = document.createElement("div");
  stock.className = "claim-card stock";
  stock.innerHTML = `
    <div class="claim-card-head"><span class="claim-card-name">Start an expansion franchise</span></div>
    <div class="claim-card-meta">A fresh, balanced, league-typical roster — no history behind it.</div>`;
  stock.addEventListener("click", () => outbox?.submit({ type: "claim", carriedIndex: null }));
  grid.appendChild(stock);
}

function renderFAHook(view: Record<string, unknown>): void {
  if (!view["claimed"]) {
    renderFAClaimPicker(view);
    return;
  }
  const body = $("gameBody");
  const franchise = view["franchise"] as FAFranchise;
  const roster = (view["roster"] as { id: string; player: FACard }[]) ?? [];
  const standing = view["standing"] as { rank: number; totalTeams: number; inHunt: boolean } | null;
  const marketPreview = (view["marketPreview"] as { id: string; name: string; position: string; tier: string; flavor: string; openingAsk: number; factorHint: string }[]) ?? [];
  body.innerHTML = `
    <div class="panel" style="padding:16px;">
      <div class="claim-card-head" style="margin-bottom:10px;"><span style="${crestStyle(franchise.crestIndex, 26)}"></span><span class="claim-card-name" style="font-size:17px;">${escapeHtml(franchise.name)}</span>${franchise.origin === "stock" ? '<span class="pill" style="margin-left:6px; font-size:10px;">EXPANSION</span>' : ""}</div>
      <p style="margin:0 0 12px; font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["message"]))}</p>
      <div class="fa-cap-sheet">
        <div class="fa-cap-sheet-row"><span>Cap room ($130M cap)</span><span class="num">$${view["capRoom"]}M</span></div>
        ${Number(view["deadCapCarried"]) > 0 ? `<div class="fa-cap-sheet-row deadcap"><span>Dead cap carried in</span><span class="num">$${view["deadCapCarried"]}M</span></div>` : ""}
      </div>
      <div class="roster-wall" style="margin-top:12px;">${roster.map((r) => rosterSlotHtml(r.id, r.player)).join("")}</div>
    </div>
    ${standing ? `<div class="standing-card"><span>Playoff picture</span><span class="standing-rank">#${standing.rank} of ${standing.totalTeams}</span><span style="font-size:12px; color:${standing.inHunt ? "var(--cap-safe)" : "var(--ink-muted)"};">${standing.inHunt ? "In the playoff hunt" : "On the outside looking in"}</span></div>` : ""}
    ${marketRulesHtml((view["marketRules"] as string[]) ?? [])}
    <div class="eyebrow" style="font-size:12px; margin:16px 0 4px;">The market preview</div>
    <div class="fa-market-grid" id="faMarketPreview"></div>`;
  const grid = $("faMarketPreview");
  for (const a of marketPreview) {
    const card = document.createElement("div");
    card.className = "fa-agent-card";
    card.style.cursor = "default";
    card.innerHTML = `
      <div class="fa-agent-head"><span class="fa-agent-name">${escapeHtml(a.name)}</span><span class="fa-agent-meta">${a.position} · ${FA_TIER_LABEL[a.tier] ?? a.tier}</span></div>
      <div class="fa-agent-flavor">${escapeHtml(a.flavor)}</div>
      ${a.factorHint ? `<div class="fa-agent-hint">"${escapeHtml(a.factorHint)}"</div>` : ""}
      <div class="fa-ask-row"><span class="fa-ask">$${a.openingAsk}M</span><span class="eyebrow" style="font-size:10px;">opening ask</span></div>`;
    grid.appendChild(card);
  }
}

/** R1 repair (VERIFY_L3.md R1): a compact, collapsible rules panel — grade 5-6 copy the server itself owns
 *  (`MARKET_RULES`), rendered wherever a student is about to decide something (HOOK's market preview, and
 *  right beside the PLAY composer). `<details>` keeps it out of the way until tapped, native and dependency-free. */
function marketRulesHtml(rules: string[]): string {
  if (rules.length === 0) return "";
  return `
    <details class="fa-rules">
      <summary>How the market works</summary>
      <ul>${rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </details>`;
}

function rosterSlotHtml(slotId: string, player: FACard): string {
  return `
    <div class="roster-slot ${player ? "filled" : ""}">
      <div class="roster-slot-label">${POSITION_ICON[slotId] ?? ""} ${slotId}</div>
      ${player ? `<div class="mini-card"><div class="mini-card-name">${escapeHtml(player.name)}</div><div class="mini-card-pos">${player.position}</div><div class="mini-card-rating">FORM ${player.form}</div><div class="mini-card-salary">$${player.price}M</div></div>` : `<div class="roster-slot-empty-glyph">—</div>`}
    </div>`;
}

function trendGlyph(trend: number): string {
  if (trend > 0) return `<span class="fa-trend up">▲</span>`;
  if (trend < 0) return `<span class="fa-trend down">▼</span>`;
  return `<span class="fa-trend flat">–</span>`;
}

function sparklineSvg(points: number[]): string {
  if (points.length < 2) return "";
  const w = 100;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / span) * h).toFixed(1)}`).join(" ");
  return `<svg class="fa-sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="price history"><polyline points="${coords}" fill="none" stroke="var(--accent-blue)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function renderFAPlay(view: Record<string, unknown>): void {
  const body = $("gameBody");

  if (view["claimed"] === false) {
    faPlayMounted = null;
    renderFAClaimPicker(view);
    return;
  }

  const day = Number(view["day"] ?? 1);
  const windowClosed = Boolean(view["windowClosed"]);
  const acted = Boolean(view["acted"]);
  const held = Boolean(view["held"]);
  const outForDay = Boolean(view["outForDay"]);
  const pendingOffer = view["pendingOffer"] as { agentId: string; amount: number; slot: string } | null;
  const franchise = view["franchise"] as FAFranchise;
  const roster = (view["roster"] as FARosterSlot[]) ?? [];
  const market = (view["market"] as FAAgentCard[]) ?? [];
  const history = (view["history"] as FADayHistory[]) ?? [];
  const openAgentId = document.getElementById("faComposerRoot")?.getAttribute("data-agent") ?? null;

  // R2 repair: `held`/`outForDay` must be their own signature fields, not folded only into `acted` — a
  // withdraw flips held/outForDay from false->true while `acted` was ALREADY true (a pending offer already
  // made it true), so `acted` alone wouldn't notice the transition and the stale "offer in, withdraw" banner
  // would never refresh into the honest "out for today" state.
  const signature = { day, acted, held, outForDay, openAgentId };
  const rootMissing = !document.getElementById("faPlayRoot");
  const alreadyMounted =
    faPlayMounted &&
    faPlayMounted.day === signature.day &&
    faPlayMounted.acted === signature.acted &&
    faPlayMounted.held === signature.held &&
    faPlayMounted.outForDay === signature.outForDay &&
    faPlayMounted.openAgentId === signature.openAgentId &&
    !rootMissing;
  if (alreadyMounted) return; // preserves the composer's in-progress stepper value across poll ticks
  faPlayMounted = signature;

  body.innerHTML = `
    <div id="faPlayRoot">
      <div class="row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="fa-day-pill ${windowClosed ? "closed" : ""}">${windowClosed ? "WINDOW CLOSED" : `DAY ${day} OF ${view["windowDays"]}`}</span>
        <div class="claim-card-head" style="margin:0;"><span style="${crestStyle(franchise.crestIndex, 20)}"></span><span class="claim-card-name" style="font-size:13px;">${escapeHtml(franchise.name)}</span></div>
      </div>
      <div class="fa-cap-sheet">
        <div class="fa-cap-sheet-row"><span>Cap room</span><span class="num">$${view["capRoom"]}M</span></div>
        <div class="fa-cap-sheet-row deadcap"><span>Dead cap on the books</span><span class="num">$${view["deadCap"]}M</span></div>
      </div>
      <div class="roster-wall" style="margin-top:10px;">${roster.map((r) => rosterSlotHtml(r.id, r.player)).join("")}</div>
      <div id="faActedBanner" style="margin-top:12px;"></div>
      <div id="faMarketWrap" style="margin-top:14px;"></div>
      <div id="faHistoryWrap" style="margin-top:16px;"></div>
    </div>`;

  const actedBanner = $("faActedBanner");
  if (windowClosed) {
    actedBanner.innerHTML = `<div class="banner">The signing window has closed. Look up at the board for the finale.</div>`;
  } else if (outForDay) {
    // R2 repair (VERIFY_L3.md R2): a withdrawal is NOT the same as a plain hold — it's already cost this
    // team its day. The composer is honest about that: no way back into today's market, just a wait for
    // tomorrow.
    actedBanner.innerHTML = `<div class="banner">You pulled out of talks today. The market saw you go — no new offer until tomorrow.</div>`;
  } else if (acted) {
    actedBanner.innerHTML = held
      ? `<div class="banner">You're holding today — waiting on the market. You can still change your mind before the day closes.</div>`
      : `<div class="banner">Offer in: $${pendingOffer?.amount}M on ${market.find((a) => a.id === pendingOffer?.agentId)?.name ?? "your target"} (${pendingOffer?.slot}). Sealed until the day closes. <button id="faWithdraw" class="btn" style="margin-left:8px;">Withdraw</button></div>`;
    if (!held) {
      $("faWithdraw")?.addEventListener("click", () => {
        if (confirm("Pull your offer back? This ends your day — no new offer until tomorrow. Editing your offer instead (pick a different agent, amount, or slot) is free and doesn't cost you anything.")) {
          outbox?.submit({ type: "withdrawOffer" });
        }
      });
    }
  } else {
    actedBanner.innerHTML = `<button id="faHoldBtn" class="btn btn-warn full">Hold today — wait on the market</button>`;
    $("faHoldBtn")?.addEventListener("click", () => outbox?.submit({ type: "holdDay" }));
  }

  const marketWrap = $("faMarketWrap");
  marketWrap.innerHTML = `${marketRulesHtml((view["marketRules"] as string[]) ?? [])}<div class="eyebrow" style="font-size:12px; margin:10px 0 6px;">The market</div><div class="fa-market-grid" id="faMarketGrid"></div><div id="faComposerRoot"></div>`;
  const grid = $("faMarketGrid");
  for (const a of market) {
    const card = document.createElement("div");
    card.className = "fa-agent-card" + (a.signed ? " signed" : outForDay ? " unaffordable" : "");
    card.dataset["agentId"] = a.id;
    card.innerHTML = `
      <div class="fa-agent-head"><span class="fa-agent-name">${escapeHtml(a.name)}</span><span class="fa-agent-meta">${a.position} · ${FA_TIER_LABEL[a.tier] ?? a.tier}</span></div>
      ${a.factorHint ? `<div class="fa-agent-hint">"${escapeHtml(a.factorHint)}"</div>` : ""}
      <div class="fa-ask-row"><span class="fa-ask">$${a.ask}M</span>${trendGlyph(a.trend)}</div>
      ${sparklineSvg(a.priceHistory)}
      ${
        a.signed
          ? `<div class="fa-signed-stamp">✓ SIGNED — ${a.signedFranchise ? escapeHtml(a.signedFranchise.name) : ""} $${a.signedAmount}M (day ${a.signedDay})</div>`
          : `<div class="fa-interest-badge">${a.interestCount} team${a.interestCount === 1 ? "" : "s"} interested right now</div>`
      }`;
    if (!a.signed && !windowClosed && !outForDay) {
      card.addEventListener("click", () => {
        const root = document.getElementById("faComposerRoot");
        const currentlyOpen = root?.getAttribute("data-agent");
        if (currentlyOpen === a.id) {
          root?.removeAttribute("data-agent");
          if (root) root.innerHTML = "";
          faPlayMounted = null; // force rebuild so the signature check reflects the closed composer
        } else {
          faComposerSlot = null;
          faComposerAmount = a.ask;
          renderFAComposer(a, roster);
        }
      });
    }
    grid.appendChild(card);
  }

  const historyWrap = $("faHistoryWrap");
  if (history.length > 0) {
    historyWrap.innerHTML = `<div class="eyebrow" style="font-size:12px; margin-bottom:6px;">Day-by-day results</div>`;
    for (const day of [...history].reverse()) {
      const dayEl = document.createElement("div");
      dayEl.className = "panel";
      dayEl.style.padding = "10px 12px";
      dayEl.style.marginBottom = "8px";
      dayEl.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:6px;">Day ${day.day}</div>` + day.resolutions.map(resolutionRowHtml).join("");
      historyWrap.appendChild(dayEl);
    }
  }
}

function resolutionRowHtml(r: FAResolutionRow): string {
  if (r.signed) {
    return `<div class="foregone-row"><span>${escapeHtml(r.agentName)} — <strong style="color:var(--ink-primary);">${r.franchise ? escapeHtml(r.franchise.name) : "signed"}</strong></span><span class="price numeric">$${r.amount}M</span></div>`;
  }
  const ownNote = r.ownAmount != null ? ` (your offer: $${r.ownAmount}M)` : "";
  return `<div class="foregone-row"><span>${escapeHtml(r.agentName)} — unsigned, ${r.offerCount} offer${r.offerCount === 1 ? "" : "s"}${ownNote}</span><span class="price numeric">$${r.askBefore}M → $${r.askAfter}M</span></div>`;
}

function renderFAComposer(agent: FAAgentCard, roster: FARosterSlot[]): void {
  const root = document.getElementById("faComposerRoot");
  if (!root) return;
  root.setAttribute("data-agent", agent.id);
  const eligibleSlots = roster.filter((r) => r.id === "WILDCARD" || r.id === agent.position);
  root.innerHTML = `
    <div class="fa-offer-composer">
      <div class="eyebrow" style="font-size:12px;">Offer on ${escapeHtml(agent.name)}</div>
      <div class="fa-slot-picker" id="faSlotPicker"></div>
      <div class="bid-stepper">
        <button type="button" data-fa-step="-1" class="btn">−</button>
        <span class="bid-stepper-readout" id="faAmountReadout">$${faComposerAmount}M</span>
        <button type="button" data-fa-step="1" class="btn">+</button>
      </div>
      <button type="button" id="faSubmitOffer" class="btn btn-danger full" style="margin-top:10px;" disabled>Pick a slot first</button>
    </div>`;
  const slotPicker = $("faSlotPicker");
  for (const slot of eligibleSlots) {
    const chip = document.createElement("span");
    chip.className = "fa-slot-chip";
    chip.dataset["slot"] = slot.id;
    chip.textContent = slot.player ? `${slot.id} (release ${slot.player.name.split(" ")[0]}, $${slot.releaseDeadCap}M dead cap)` : `${slot.id} (open)`;
    chip.addEventListener("click", () => {
      faComposerSlot = slot.id;
      slotPicker.querySelectorAll(".fa-slot-chip").forEach((el) => el.classList.remove("selected"));
      chip.classList.add("selected");
      const submitBtn = $<HTMLButtonElement>("faSubmitOffer");
      submitBtn.disabled = false;
      submitBtn.textContent = `Offer $${faComposerAmount}M for the ${slot.id} slot`;
    });
    slotPicker.appendChild(chip);
  }
  const readout = $("faAmountReadout");
  root.querySelectorAll<HTMLButtonElement>("[data-fa-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset["faStep"]) * 5;
      faComposerAmount = Math.max(5, faComposerAmount + delta);
      readout.textContent = `$${faComposerAmount}M`;
      const submitBtn = $<HTMLButtonElement>("faSubmitOffer");
      if (faComposerSlot) submitBtn.textContent = `Offer $${faComposerAmount}M for the ${faComposerSlot} slot`;
    });
  });
  $("faSubmitOffer").addEventListener("click", () => {
    if (!faComposerSlot) return;
    outbox?.submit({ type: "offer", agentId: agent.id, amount: faComposerAmount, slot: faComposerSlot });
  });
  // N1 repair (VERIFY_L3.md N1): at the classroom Chromebook shape (~1024x600), the composer opens roughly a
  // full market grid below the fold with zero cue anything happened. `block: "nearest"` brings it fully
  // on-screen without yanking the whole page to the top when it's already partly visible. Instant, not
  // smooth — a mid-animation scroll position is not a real "reachable" state to leave a student in.
  root.scrollIntoView({ behavior: "auto", block: "nearest" });
}

function renderFAReveal(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const franchise = view["franchise"] as FAFranchise | undefined;
  const recap = view["windowRecap"] as FAWindowRecap | null;
  const agents = (view["agents"] as FAAgentReveal[]) ?? [];
  const standings = view["standings"] as FAStanding[] | null;
  const playoffs = view["playoffs"] as FAPlayoffs | null;
  const awards = view["awards"] as FAAward[] | null;

  let html = franchise ? `<div class="panel" style="padding:12px;"><div class="claim-card-head"><span style="${crestStyle(franchise.crestIndex, 18)}"></span><span class="claim-card-name" style="font-size:13px;">${escapeHtml(franchise.name)}</span></div></div>` : "";

  if (recap) {
    html += `
      <div class="panel" style="padding:14px; margin-top:10px;">
        <div class="eyebrow" style="font-size:12px;">The window, in numbers</div>
        <p style="margin:8px 0 0; font-size:13px; color:var(--ink-secondary);">${recap.signedCount} of ${recap.totalAgents} agents signed · $${recap.totalSpent}M total spent</p>
        ${recap.biggestContract ? `<p style="margin:6px 0 0; font-size:13px;">Biggest contract: <strong>${escapeHtml(recap.biggestContract.agentName)}</strong>, $${recap.biggestContract.amount}M (${escapeHtml(recap.biggestContract.franchise.name)}, day ${recap.biggestContract.day})</p>` : ""}
        ${recap.steepestFall ? `<p style="margin:6px 0 0; font-size:13px;">Steepest fall: <strong>${escapeHtml(recap.steepestFall.agentName)}</strong>, $${recap.steepestFall.from}M → $${recap.steepestFall.to}M</p>` : ""}
      </div>`;
  }

  const revealedAgents = agents.filter((a) => a.revealed);
  if (revealedAgents.length > 0) {
    html += `<div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">Playoff factors revealed</div>`;
    for (const a of revealedAgents) {
      const sign = a.playoffFactor !== null && a.playoffFactor > 0 ? "+" : "";
      html += `
        <div class="reveal-target-card">
          <div class="reveal-target-head">
            <span class="claim-card-name" style="font-size:13px;">${escapeHtml(a.name)} <span style="color:var(--ink-muted); font-weight:400; font-size:11px;">· ${a.position}</span></span>
            <span class="verdict-badge ${a.playoffFactor !== null && a.playoffFactor > 0 ? "steal" : a.playoffFactor !== null && a.playoffFactor < 0 ? "curse" : "fair"}">${sign}${a.playoffFactor}</span>
          </div>
          <p style="margin:8px 0 0; font-size:12px; color:var(--ink-secondary);">${a.signed ? `Signed by <strong style="color:var(--ink-primary);">${a.signedFranchise ? escapeHtml(a.signedFranchise.name) : "a team"}</strong> for $${a.signedAmount}M.` : "Went unsigned this window."}</p>
        </div>`;
    }
  }

  if (standings) html += standingsHtml(standings);
  if (playoffs) html += playoffsHtml(playoffs);
  if (awards) html += awardsHtml(awards);

  body.innerHTML = html || `<div class="banner">Watch the board.</div>`;
}

function standingsHtml(standings: FAStanding[]): string {
  return `
    <div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">Final standings</div>
    ${standings.map((r) => `<div class="fa-standing-row ${r.rank <= 4 ? "playoff-line" : ""}"><span class="fa-standing-rank">#${r.rank}</span><span style="${crestStyle(r.franchise.crestIndex, 18)}"></span><span style="flex:1;">${escapeHtml(r.franchise.name)}</span><span class="numeric" style="color:var(--accent-gold);">${r.form}</span></div>`).join("")}`;
}

function matchHtml(label: string, m: FAPlayoffMatch): string {
  return `
    <div class="fa-bracket-match">
      <div class="eyebrow" style="font-size:10px; margin-bottom:4px;">${label}</div>
      <div class="fa-bracket-side ${m.winner.seatId === m.a.seatId ? "winner" : ""}"><span>${escapeHtml(m.a.franchise.name)}</span><span>${m.a.form}</span></div>
      <div class="fa-bracket-side ${m.winner.seatId === m.b.seatId ? "winner" : ""}"><span>${escapeHtml(m.b.franchise.name)}</span><span>${m.b.form}</span></div>
    </div>`;
}

function playoffsHtml(playoffs: FAPlayoffs): string {
  if (!playoffs.final && !playoffs.champion) return "";
  let html = `<div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">The playoff push</div>`;
  playoffs.semis.forEach((m, i) => (html += matchHtml(playoffs.semis.length > 1 ? `Semifinal ${i + 1}` : "Play-in", m)));
  if (playoffs.final) html += matchHtml("Final", playoffs.final);
  if (playoffs.champion) html += `<div class="banner" style="margin-top:8px;">🏆 ${escapeHtml(playoffs.champion.franchise.name)} — champion</div>`;
  return html;
}

function awardsHtml(awards: FAAward[]): string {
  if (awards.length === 0) return `<div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">GM Awards</div><p style="font-size:12px; color:var(--ink-muted);">Nothing to award this round.</p>`;
  return `<div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">GM Awards</div>${awards.map((a) => `<div class="fa-award-card"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body)}</p></div>`).join("")}`;
}

function renderFACounterfactual(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const franchise = view["franchise"] as FAFranchise | undefined;
  const timeline = (view["timeline"] as { label: string; body: string }[]) ?? [];
  const whatIfs = (view["whatIfs"] as string[]) ?? [];
  const debatePrompts = (view["debatePrompts"] as string[]) ?? [];
  body.innerHTML = `
    ${franchise ? `<div class="panel" style="padding:12px;"><div class="claim-card-head"><span style="${crestStyle(franchise.crestIndex, 18)}"></span><span class="claim-card-name" style="font-size:13px;">${escapeHtml(franchise.name)}</span></div></div>` : ""}
    <div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">Your three-lesson journey</div>
    <div class="fa-timeline">${timeline.map((t) => `<div class="fa-timeline-stop"><div class="label">${escapeHtml(t.label)}</div><div class="body">${escapeHtml(t.body)}</div></div>`).join("")}</div>
    ${whatIfs.length > 0 ? `<div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">What if?</div>${whatIfs.map((w) => `<div class="fa-whatif-card">${escapeHtml(w)}</div>`).join("")}` : ""}
    <div class="eyebrow" style="font-size:12px; margin:14px 0 6px;">Be ready to argue</div>
    ${debatePrompts.map((p) => `<p style="font-size:13px; color:var(--ink-secondary); margin:4px 0;">${escapeHtml(p)}</p>`).join("")}`;
}

/* -------------------------------------------------------- full house render -- */

type FHMarket = {
  id: string;
  club: string;
  building: string;
  plainLine: string;
  capacity: number;
  bill: number;
  planPrice: number;
  eventMax: number;
  bowlSeats: number;
  bowlCost: number;
  capacityNote: string;
  spendRule: string;
};
type FHSlateNight = { id: string; label: string; index: number; day: string; visitor: string; draw: number; tv: "none" | "local" | "national"; repeatOf: string | null; bowlOffer: boolean };
type FHCard = {
  id: string;
  label: string;
  index: number;
  of: number;
  day: string;
  visitor: string;
  draw: number;
  tv: "none" | "local" | "national";
  notes: string[];
  bowlOffer: boolean;
  repeatOf: string | null;
};
type FHNight = {
  cardId: string;
  label: string;
  day: string;
  visitor: string;
  draw: number;
  price: number;
  spend: number;
  openBowl: boolean;
  auto: boolean;
  stock: boolean;
  turnout: number;
  seatsOpen: number;
  fillPct: number;
  turnedAway: number;
  soldOut: boolean;
  gate: number;
  inArena: number;
  total: number;
  bill: number;
  spendPaid: number;
  bowlCost: number;
  net: number;
  renewalsBefore: number;
  renewalsAfter: number;
  renewalMove: number;
  cashAfter: number;
  resaleNote: string | null;
  /** R6/P2: last night's event money, confirmed or refuted by this night's seats. */
  spendVerdict: { carryFans: number; seated: number; wasted: number; label: string } | null;
};
type FHBooks = { cash: number; renewals: number; inDebt: boolean };
type FHTwoPeaks = { ticketPeakPrice: number; totalPeakPrice: number; gapDollars: number; gapSteps: number };
type FHReplay = { label: string; cash: number; renewals: number; note: string };

const TV_LABEL: Record<string, string> = {
  none: "Not on TV",
  local: "Local TV",
  national: "NATIONAL TV",
};

let fhSeatRequested = false;
let fhMountKey: string | null = null;
/** Local dial state while dragging — the server only hears about it on release. */
let fhLocalPrice: number | null = null;

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function renderFullHouse(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (view["seated"] === false) {
    if (!fhSeatRequested) {
      fhSeatRequested = true;
      outbox?.submit({ type: "takeSeat" });
    }
    body.innerHTML = `<div class="banner">You're in — finding your desk…</div>`;
    return;
  }
  if (s.phase !== "PLAY") {
    fhMountKey = null;
    document.body.classList.remove("fh-compact-play");
  }

  switch (s.phase) {
    case "LOBBY":
      renderFHLobby(view);
      return;
    case "HOOK":
      renderFHHook(view);
      return;
    case "PLAY":
      renderFHPlay(view);
      return;
    case "REVEAL":
      renderFHReveal(view);
      return;
    case "ADAPT":
      renderFHAdapt(view);
      return;
    case "COUNTERFACTUAL":
      renderFHCounterfactual(view);
      return;
    case "SYNTHESIS":
      body.innerHTML = `
        ${fhDeskHeader(view)}
        <div class="banner">${escapeHtml(String(view["message"] ?? "Look up at the board."))}</div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Talk with your partner</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["exitPrompt"] ?? ""))}</p>
        </div>`;
      return;
    case "COMPLETE":
      body.innerHTML = `${fhDeskHeader(view)}<div class="banner">${escapeHtml(String(view["message"] ?? ""))}</div>`;
      return;
    default:
      body.innerHTML = `<pre class="banner" style="text-align:left; white-space:pre-wrap;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
  }
}

function fhDeskHeader(view: Record<string, unknown>): string {
  const market = view["market"] as FHMarket | undefined;
  if (!market) return "";
  return `
    <div class="fh-desk-head">
      <span style="${crestStyle(Number(view["crestIndex"] ?? 0), 24)}"></span>
      <span class="fh-desk-name">${escapeHtml(String(view["handle"] ?? ""))}</span>
      <span class="fh-desk-building">${escapeHtml(market.building)}</span>
    </div>`;
}

/**
 * gate-l1-projector repair 6: the desk header and the two-book scoreboard used
 * ~110px of a 600px viewport before the pair saw a card. On the PLAY surface
 * they are one strip; every other phase keeps the full-height version.
 */
function fhTopStrip(view: Record<string, unknown>): string {
  const market = view["market"] as FHMarket | undefined;
  const books = view["books"] as FHBooks | undefined;
  if (!market || !books) return `${fhDeskHeader(view)}${fhBooksHtml(books)}`;
  return `
    <div class="fh-topstrip">
      <span style="${crestStyle(Number(view["crestIndex"] ?? 0), 20)}"></span>
      <span class="fh-topstrip-name fh-desk-name">${escapeHtml(String(view["handle"] ?? ""))}</span>
      <span class="fh-topstrip-book ${books.inDebt ? "debt" : ""}"><span>Cash</span><span class="numeric">${money(books.cash)}</span></span>
      <span class="fh-topstrip-book"><span>Renewals</span><span class="numeric">${books.renewals}%</span></span>
    </div>
    ${books.inDebt ? `<div class="fh-lag" style="display:block; margin:6px 0 0;">In the red — no night spend until you're back above zero.</div>` : ""}`;
}

function fhBooksHtml(books: FHBooks | undefined): string {
  if (!books) return "";
  return `
    <div class="fh-books">
      <div class="fh-book ${books.inDebt ? "debt" : ""}">
        <div class="fh-book-label">Cash</div>
        <div class="fh-book-value numeric">${money(books.cash)}</div>
        ${books.inDebt ? `<div class="fh-book-note">In the red — no night spend until you're back above zero.</div>` : ""}
      </div>
      <div class="fh-book">
        <div class="fh-book-label">Renewals</div>
        <div class="fh-book-value numeric">${books.renewals}%</div>
        <div class="fh-book-note">Season-ticket holders coming back</div>
      </div>
    </div>`;
}

function fhCardHtml(card: FHCard, market: FHMarket): string {
  const dots = Array.from({ length: 5 }, (_, i) => `<span class="fh-dot ${i < Math.round(card.draw / 20) ? "on" : ""}"></span>`).join("");
  return `
    <div class="fh-card ${card.repeatOf ? "repeat" : ""} ${card.bowlOffer ? "shock" : ""}">
      <div class="fh-card-top">
        <span class="fh-card-night">${escapeHtml(card.label)} of ${card.of}</span>
        <span class="fh-card-tv ${card.tv}">${TV_LABEL[card.tv] ?? ""}</span>
      </div>
      <div class="fh-card-line">${escapeHtml(card.day)} · ${escapeHtml(card.visitor)}</div>
      <div class="fh-card-draw"><span class="fh-card-draw-label">Visiting club's draw</span><span class="fh-dots">${dots}</span><span class="numeric fh-card-draw-num">${card.draw}/100</span></div>
      <ul class="fh-card-notes">${card.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
      <div class="fh-card-facts">
        <span>${market.capacity.toLocaleString()} seats<span class="fh-stamp"> · ${escapeHtml(market.capacityNote ?? "")}</span></span>
        <span>Tonight's bill ${money(market.bill)}</span>
        <span>Season plan $${market.planPrice} a seat</span>
      </div>
    </div>`;
}

/**
 * Tomorrow's card, printed before tonight's commitment (gate-l1-econ B4,
 * gate-l1-play P2). Four printed facts, one night ahead — no outcome, no
 * money, nothing about tonight. The night-spend dial pays on the NEXT night,
 * so this is the information that decision needs to be reasonable about.
 */
function fhNextCardHtml(next: FHCard | null): string {
  if (!next) {
    return `<div class="fh-next"><span class="fh-next-label">After tonight</span><span>Nothing. Tonight is the last night of the five — money spent on the event tonight has no night left to land on.</span></div>`;
  }
  const tv = next.tv === "national" ? "national TV" : next.tv === "local" ? "local TV" : "not on TV";
  return `<div class="fh-next"><span class="fh-next-label">Tomorrow</span><span>${escapeHtml(next.label)} · ${escapeHtml(next.day)} · ${escapeHtml(next.visitor)} · draw ${next.draw}/100 · ${tv}</span></div>`;
}

function fhSlateHtml(slate: FHSlateNight[]): string {
  if (slate.length === 0) return "";
  return `
    <details class="fa-rules" style="margin-top:12px;">
      <summary>All five nights on the schedule</summary>
      <div class="fh-slate">
        ${slate
          .map(
            (n) =>
              `<div class="fh-slate-row"><span>${escapeHtml(n.label)}</span><span>${escapeHtml(n.day)}</span><span>${escapeHtml(n.visitor)}</span><span class="numeric">draw ${n.draw}</span><span>${n.tv === "national" ? "national TV" : n.tv === "local" ? "local TV" : "not on TV"}</span></div>`,
          )
          .join("")}
      </div>
      <p style="margin:8px 0 0; font-size:12px; color:var(--ink-secondary);">The schedule is public in a real building months ahead. What it does not tell you is what a seat is worth on any of these nights.</p>
    </details>`;
}

function fhHistoryHtml(history: FHNight[], market: FHMarket): string {
  if (history.length === 0) {
    return `<div class="fh-history-empty">Nothing behind you yet. Your first price is a judgement call — the season plan works out to $${market.planPrice} a seat, and that is the only number you have.</div>`;
  }
  return `
    <div class="fh-history">
      <div class="fh-history-row head"><span>Night</span><span>Price</span><span>Came</span><span>Full</span><span>Net</span></div>
      ${history
        .map(
          (h) => `
        <div class="fh-history-row ${h.stock ? "stock" : ""}">
          <span>${escapeHtml(h.label.replace("Night ", "N"))} <span class="fh-history-sub">${escapeHtml(h.day.slice(0, 3))} · draw ${h.draw}</span>${h.stock ? ' <span class="fh-flag">covered</span>' : ""}${h.auto ? ' <span class="fh-flag">auto</span>' : ""}</span>
          <span class="numeric">$${h.price}</span>
          <span class="numeric">${h.turnout.toLocaleString()}</span>
          <span class="numeric">${h.fillPct}%</span>
          <span class="numeric ${h.net < 0 ? "neg" : ""}">${money(h.net)}</span>
        </div>`,
        )
        .join("")}
    </div>`;
}

function fhNightResultHtml(n: FHNight, title: string): string {
  // gate-l1-visual H2 / D1: FULL HOUSE is the name of the lesson and it used to
  // be eight monospace characters inside a ledger row, below the fold, under the
  // next night's controls. It is now the loudest thing in the settlement, with
  // the turned-away count as its own number rather than a grey sentence.
  const sellout = n.soldOut
    ? `<div class="fh-sellout">
         <div class="fh-sellout-title">FULL HOUSE</div>
         <div class="fh-sellout-sub">${n.turnout.toLocaleString()} of ${n.seatsOpen.toLocaleString()} seats · every one sold</div>
         ${
           n.turnedAway > 0
             ? `<div class="fh-sellout-turned"><span class="numeric">${n.turnedAway.toLocaleString()}</span><span>could not get in</span></div>`
             : ""
         }
       </div>`
    : "";
  return `
    <div class="fh-result ${n.soldOut ? "soldout" : ""}">
      <div class="fh-result-head">
        <span>${escapeHtml(title)}</span>
        <span class="numeric">$${n.price}${n.openBowl ? " · extra seats open" : ""}</span>
      </div>
      ${sellout}
      <div class="fh-fill-track"><div class="fh-fill-bar ${n.soldOut ? "soldout" : ""}" style="width:${Math.min(100, n.fillPct)}%"></div></div>
      <!-- gate-l1-visual P2 (SCHOOL-UI, /play nightly P&L): this was an unstyled
           two-column ledger in which "Kept $215,384" — the number the whole night
           was about — carried exactly the same size and weight as the word
           "Tickets". The settlement is a box score now: the lesson's own identity
           (people x price = ticket money) reads across the top in the scoreboard
           face, the costs are supporting rows underneath, and KEPT is the one
           dominant number on the card. Composition only: no new art, no glyphs,
           same palette and tokens. -->
      <div class="fh-boxscore">
        <div class="fh-boxscore-cell">
          <span class="fh-boxscore-label">Came</span>
          <span class="fh-boxscore-num numeric">${n.turnout.toLocaleString()}</span>
          <span class="fh-boxscore-sub">of ${n.seatsOpen.toLocaleString()} · ${n.fillPct}%</span>
        </div>
        <div class="fh-boxscore-op">×</div>
        <div class="fh-boxscore-cell">
          <span class="fh-boxscore-label">Price</span>
          <span class="fh-boxscore-num numeric">$${n.price}</span>
          <span class="fh-boxscore-sub">a seat</span>
        </div>
        <div class="fh-boxscore-op">=</div>
        <div class="fh-boxscore-cell">
          <span class="fh-boxscore-label">Ticket money</span>
          <span class="fh-boxscore-num numeric">${money(n.gate)}</span>
          <span class="fh-boxscore-sub">gate only</span>
        </div>
      </div>
      <div class="fh-result-row"><span>Spent inside the building</span><span class="numeric">${money(n.inArena)}</span></div>
      <div class="fh-result-row total"><span>Money in</span><span class="numeric">${money(n.total)}</span></div>
      <div class="fh-result-row"><span>Building bill</span><span class="numeric neg">-${money(n.bill).replace("$", "$")}</span></div>
      ${n.spendPaid > 0 ? `<div class="fh-result-row"><span>Making it an event</span><span class="numeric neg">-${money(n.spendPaid)}</span></div>` : ""}
      ${n.bowlCost > 0 ? `<div class="fh-result-row"><span>Opening more of the building</span><span class="numeric neg">-${money(n.bowlCost)}</span></div>` : ""}
      <div class="fh-kept ${n.net < 0 ? "neg" : ""}">
        <span class="fh-kept-label">Kept</span>
        <span class="fh-kept-num numeric">${money(n.net)}</span>
      </div>
      <div class="fh-result-row"><span>Renewals</span><span class="numeric">${n.renewalsBefore}% → ${n.renewalsAfter}% (${n.renewalMove >= 0 ? "+" : ""}${n.renewalMove})</span></div>
      ${n.resaleNote ? `<div class="fh-resale">${escapeHtml(n.resaleNote)}</div>` : ""}
      <!-- gate-l1-play R6 / P2 second clause: the forward-looking receipt on the
           dial promised "if there is room for them". This is the night that
           answers it, either way, in the desk's own numbers. -->
      ${n.spendVerdict ? `<div class="fh-spend-verdict ${n.spendVerdict.seated <= 0 ? "waste" : n.spendVerdict.wasted > 0 ? "part" : "paid"}" id="fhSpendVerdict">${escapeHtml(n.spendVerdict.label)}</div>` : ""}
    </div>`;
}

function renderFHLobby(view: Record<string, unknown>): void {
  const market = view["market"] as FHMarket;
  $("gameBody").innerHTML = `
    ${fhDeskHeader(view)}
    <div class="panel" style="padding:18px;">
      <p style="margin:0 0 10px; font-size:16px; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
      <p style="margin:0; font-size:14px; color:var(--ink-secondary);">${escapeHtml(market?.plainLine ?? "")}</p>
    </div>
    <div class="banner" style="margin-top:12px;">Waiting for your teacher to start.</div>`;
}

function renderFHHook(view: Record<string, unknown>): void {
  const market = view["market"] as FHMarket;
  const rules = (view["rules"] as string[]) ?? [];
  $("gameBody").innerHTML = `
    ${fhDeskHeader(view)}
    <div class="panel" style="padding:18px;">
      <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Full House</div>
      <p style="margin:0 0 12px; font-size:15px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
      <p style="margin:0; font-size:14px; line-height:1.5; color:var(--ink-secondary);">${escapeHtml(String(view["objective"] ?? ""))}</p>
    </div>
    ${fhBooksHtml(view["books"] as FHBooks)}
    <div class="panel" style="padding:16px; margin-top:12px;">
      <div class="eyebrow" style="font-size:12px; margin-bottom:6px;">Your building</div>
      <div class="fh-market-facts">
        <div><span>${escapeHtml(market.club)}</span><span>${escapeHtml(market.building)}</span></div>
        <div><span>Seats</span><span class="numeric">${market.capacity.toLocaleString()}</span></div>
        <div><span>Bill, every night</span><span class="numeric">${money(market.bill)}</span></div>
        <div><span>Season plan, per seat</span><span class="numeric">$${market.planPrice}</span></div>
      </div>
      <div class="fh-stamp" style="margin-top:6px;">${escapeHtml(market.capacityNote ?? "")}</div>
      <p style="margin:10px 0 0; font-size:13px; color:var(--ink-secondary);">${escapeHtml(market.plainLine)}</p>
    </div>
    <details class="fa-rules" style="margin-top:12px;">
      <summary>How the five nights work</summary>
      <ul>${rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </details>
    ${fhSlateHtml((view["slate"] as FHSlateNight[]) ?? [])}
    <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["horizonLine"] ?? ""))}</div>
    <div class="banner" style="margin-top:8px;">${escapeHtml(String(view["modeledDollarsLine"] ?? ""))}</div>`;
}

function renderFHPlay(view: Record<string, unknown>): void {
  const body = $("gameBody");
  // gate-l1-projector repair 6 (the Chromebook fold): the decision — dial and
  // LOCK IT IN — has to clear a 1024x600 viewport without scrolling, every
  // night. Scoped to this one screen so no other lesson's surface tightens.
  document.body.classList.toggle("fh-compact-play", !view["allNightsDone"]);
  if (view["allNightsDone"]) {
    fhMountKey = null;
    body.innerHTML = `
      ${fhDeskHeader(view)}
      ${fhBooksHtml(view["books"] as FHBooks)}
      <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
      ${fhHistoryHtml((view["history"] as FHNight[]) ?? [], view["market"] as FHMarket)}`;
    return;
  }

  const card = view["card"] as FHCard;
  const market = view["market"] as FHMarket;
  const locked = Boolean(view["locked"]);
  const history = (view["history"] as FHNight[]) ?? [];
  const lastNight = view["lastNight"] as FHNight | null;
  const spendCap = Number(view["spendCap"] ?? 0);

  // Rebuild only when the night, the lock state or the number of settled nights
  // actually changes — a poll tick must never yank the dial out from under a
  // pair mid-drag.
  const key = `${card.id}|${locked}|${history.length}|${spendCap}`;
  if (fhMountKey === key && document.getElementById("fhPlayRoot")) return;
  fhMountKey = key;
  if (fhLocalPrice === null || !locked) fhLocalPrice = Number(view["price"] ?? market.planPrice);
  const price = locked ? Number(view["price"]) : fhLocalPrice;
  const spend = Number(view["spend"] ?? 0);

  const renewalRule = String(view["renewalRule"] ?? "");
  const receipt = view["spendReceipt"] as { spend: number; fans: number; label: string } | null;

  body.innerHTML = `
    <div id="fhPlayRoot">
      ${fhTopStrip(view)}
      ${fhCardHtml(card, market)}
      ${
        locked
          ? `<div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
             <div class="fh-locked-recap"><span>Locked at</span><span class="numeric">$${price}</span>${spend > 0 ? `<span>· ${money(spend)} on the night</span>` : ""}${view["openBowl"] ? "<span>· extra seats open</span>" : ""}</div>`
          : `
        <div class="panel fh-dials" style="padding:14px; margin-top:10px;">
          <div class="eyebrow" style="font-size:12px;">Price of a seat</div>
          <div class="fh-price-readout numeric" id="fhPriceReadout">$${price}</div>
          <!-- gate-l1-visual P2 + N2: the track carried the reserved three-zone
               CAP ramp (a semantic token spent on a non-cap meaning) and the
               season-plan price was printed CENTRED under a $10-$120 track while
               the plan sits ~13% along it — a mislabelled axis on the control the
               whole lesson turns on. Drawn well, and the plan is a notch AT its
               own price. -->
          <div class="fh-dial" style="--plan-frac:${((market.planPrice - Number(view["priceMin"])) / Math.max(1, Number(view["priceMax"]) - Number(view["priceMin"]))).toFixed(4)};">
            <input class="price-dial-input" type="range" id="fhPriceDial" min="${view["priceMin"]}" max="${view["priceMax"]}" step="${view["priceStep"]}" value="${price}" />
            <div class="fh-dial-notch" aria-hidden="true"><span class="fh-dial-tick"></span><span class="fh-dial-tick-label">PLAN $${market.planPrice}</span></div>
          </div>
          <div class="price-dial-ends"><span>$${view["priceMin"]}</span><span>$${view["priceMax"]}</span></div>
          <!-- gate-l1-play P10 (BLOCKING dissent play-l1-renewals-unexplained):
               the rule that drives half the scoreboard, beside the dial that
               drives it, before the commit. -->
          <div class="fh-renewal-rule">${escapeHtml(renewalRule)}</div>

          <div class="eyebrow" style="font-size:12px; margin-top:12px;">Making it an event <span class="fh-lag">pays off next night</span></div>
          ${fhNextCardHtml(view["nextCard"] as FHCard | null)}
          ${receipt ? `<div class="fh-receipt">${escapeHtml(receipt.label)}</div>` : ""}
          <div class="fh-spend-row">

            <div class="bid-stepper">
              <button type="button" class="btn" id="fhSpendDown">−</button>
              <span class="bid-stepper-readout" id="fhSpendReadout">${money(spend)}</span>
              <button type="button" class="btn" id="fhSpendUp">+</button>
            </div>
            <span class="fh-lag">${spendCap === 0 ? "In the red — locked at $0" : `up to ${money(spendCap)}`}</span>
          </div>
          <details class="fh-rule-details">
            <summary>What does this money actually do?</summary>
            <p>${escapeHtml(market.spendRule ?? "")}</p>
            ${spendCap === 0 ? `<p>Your books are in the red — the night-spend dial is locked at $0 until you're back above zero. One good night clears it.</p>` : ""}
          </details>

          ${
            card.bowlOffer
              ? `<button type="button" class="fh-bowl-plate ${view["openBowl"] ? "on" : ""}" id="fhBowl" aria-pressed="${view["openBowl"] ? "true" : "false"}">
                   <span class="fh-bowl-state">${view["openBowl"] ? "OPEN" : "CLOSED"}</span>
                   <span class="fh-bowl-main">Open ${market.bowlSeats.toLocaleString()} more seats tonight</span>
                   <span class="fh-bowl-cost numeric">${money(market.bowlCost)}</span>
                   <span class="fh-bowl-note">paid whether they fill or not</span>
                 </button>`
              : ""
          }
          <!-- gate-l1-qa D2: 38px measured at 1366x768, under the comfortable
               touch target for two students sharing one Chromebook. -->
          <button class="btn btn-primary full" id="fhLock" style="margin-top:12px; min-height:44px;">LOCK IT IN</button>
          <div class="fh-blind-note">No preview. Nothing on this screen tells you what tonight will make.</div>
        </div>`
      }
      ${lastNight ? fhNightResultHtml(lastNight, `${lastNight.label} — how it went`) : ""}
      ${fhSlateHtml((view["slate"] as FHSlateNight[]) ?? [])}
      <div class="eyebrow" style="font-size:12px; margin:16px 0 6px;">Your nights so far</div>
      ${fhHistoryHtml(history, market)}
    </div>`;

  if (locked) return;

  const dial = $<HTMLInputElement>("fhPriceDial");
  const readout = $("fhPriceReadout");
  dial.addEventListener("input", () => {
    fhLocalPrice = Number(dial.value);
    readout.textContent = `$${dial.value}`;
  });
  // Commit on release, not on every drag tick: nothing comes back from the
  // server that the pair could read anyway, and a Chromebook on a school LAN
  // should not fire fifty actions per drag.
  const commitPrice = () => outbox?.submit({ type: "setPrice", price: Number(dial.value) });
  dial.addEventListener("change", commitPrice);

  let localSpend = spend;
  const spendReadout = $("fhSpendReadout");
  const stepSpend = (dir: number) => {
    const step = Number(view["spendStep"] ?? 5000);
    localSpend = Math.max(0, Math.min(spendCap, localSpend + dir * step));
    spendReadout.textContent = money(localSpend);
    outbox?.submit({ type: "setSpend", spend: localSpend });
  };
  $("fhSpendUp").addEventListener("click", () => stepSpend(1));
  $("fhSpendDown").addEventListener("click", () => stepSpend(-1));
  if (card.bowlOffer) {
    const plate = $<HTMLButtonElement>("fhBowl");
    plate.addEventListener("click", () => {
      const next = plate.getAttribute("aria-pressed") !== "true";
      plate.setAttribute("aria-pressed", next ? "true" : "false");
      plate.classList.toggle("on", next);
      const state = plate.querySelector(".fh-bowl-state");
      if (state) state.textContent = next ? "OPEN" : "CLOSED";
      outbox?.submit({ type: "setBowl", open: next });
    });
  }
  $("fhLock").addEventListener("click", () => {
    if (confirm(`Lock ${escapeHtml(card.label)} at $${dial.value}? You cannot change it after this.`)) {
      outbox?.submit({ type: "setPrice", price: Number(dial.value) });
      outbox?.submit({ type: "lock" });
    }
  });
}

function renderFHReveal(view: Record<string, unknown>): void {
  const history = (view["history"] as FHNight[]) ?? [];
  const peaks = (view["twoPeaks"] as FHTwoPeaks[]) ?? [];
  $("gameBody").innerHTML = `
    ${fhDeskHeader(view)}
    ${fhBooksHtml(view["books"] as FHBooks)}
    <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
    ${
      peaks.length > 0
        ? `<div class="fh-peaks">
             <div class="eyebrow" style="font-size:12px;">The two peaks — Night 3, your market</div>
             <div class="fh-peaks-row"><span>Tickets alone made the most at</span><span class="numeric">$${peaks[0]!.ticketPeakPrice}</span></div>
             <div class="fh-peaks-row"><span>Tickets + what they spent inside peaked at</span><span class="numeric hot">$${peaks[0]!.totalPeakPrice}</span></div>
             <div class="fh-peaks-note">$${peaks[0]!.gapDollars} lower — ${peaks[0]!.gapSteps} clicks of the dial. The cheaper ticket made more money.</div>
           </div>`
        : ""
    }
    <div class="eyebrow" style="font-size:12px; margin:16px 0 6px;">Your five nights</div>
    ${history.map((n) => fhNightResultHtml(n, n.label)).join("")}`;
}

function renderFHAdapt(view: Record<string, unknown>): void {
  const questions = (view["questions"] as string[]) ?? [];
  $("gameBody").innerHTML = `
    ${fhDeskHeader(view)}
    ${fhBooksHtml(view["books"] as FHBooks)}
    <div class="panel" style="padding:16px; margin-top:12px;">
      <div class="eyebrow" style="font-size:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
      <ol class="fh-questions">${questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>
    </div>
    ${fhHistoryHtml((view["history"] as FHNight[]) ?? [], view["market"] as FHMarket)}`;
}

function renderFHCounterfactual(view: Record<string, unknown>): void {
  const repeat = view["repeat"] as {
    n1Price: number;
    n1Turnout: number;
    n5Price: number;
    n5Turnout: number;
    renewalsAtN1: number;
    renewalsAtN5: number;
    samePrice: boolean;
    // `econ-l1-n5-attribution` residual on the PRIVATE surface (wave-2 analyst
    // catch; `gate-l1-play` recheck3 "Also observed"). The board decomposed this
    // desk's crowd change into its channels while the desk's own card showed
    // only two crowds and two renewals figures beside "the only thing that
    // changed was you" — so a pair reading their own device attributed all of
    // Desk 4's +1,760 to renewals when it was renewals +800 and event money
    // +960. Same computed split, same function (`repeatRowFor`), both surfaces.
    renewalsFans: number;
    carryFans: number;
    n4Spend: number;
    priceFans: number;
    seatedDelta: number;
    wantedDelta: number;
    clamped: boolean;
    floored: boolean;
    biggestChannel: "renewals" | "spend" | "price" | "none";
    channelLine: string;
  } | null;
  const replays = (view["replays"] as FHReplay[]) ?? [];
  $("gameBody").innerHTML = `
    ${fhDeskHeader(view)}
    ${
      repeat
        ? `<div class="fh-repeat">
             <div class="eyebrow" style="font-size:12px;">Night 1 and Night 5 were the same card</div>
             <div class="fh-repeat-grid">
               <div><span class="fh-repeat-label">Night 1</span><span class="numeric">$${repeat.n1Price}</span><span class="numeric big">${repeat.n1Turnout.toLocaleString()}</span><span class="fh-repeat-sub">renewals ${repeat.renewalsAtN1}%</span></div>
               <div><span class="fh-repeat-label">Night 5</span><span class="numeric">$${repeat.n5Price}</span><span class="numeric big">${repeat.n5Turnout.toLocaleString()}</span><span class="fh-repeat-sub">renewals ${repeat.renewalsAtN5}%</span></div>
             </div>
             <div class="fh-repeat-split" id="fhRepeatSplit">
               <span class="fh-repeat-split-label">Where that change came from</span>
               <span class="fh-repeat-split-line">${escapeHtml(repeat.channelLine)}</span>
             </div>
             <div class="fh-peaks-note">${
               repeat.samePrice
                 ? repeat.biggestChannel === "renewals"
                   ? "Same price both nights. The biggest thing that changed was your own renewals."
                   : repeat.biggestChannel === "spend"
                     ? "Same price both nights — and the biggest thing that changed was NOT your renewals. It was the event money you spent the night before."
                     : "Same price both nights. Read the split above before you decide what changed it."
                 : "You changed the price — so part of the gap is the price. The split above says how much."
             }</div>
           </div>`
        : ""
    }
    <div class="eyebrow" style="font-size:12px; margin:16px 0 6px;">What if?</div>
    ${replays
      .map(
        (r) => `
      <div class="fh-replay">
        <div class="fh-replay-head"><span>${escapeHtml(r.label)}</span><span class="numeric">${money(r.cash)} · ${r.renewals}%</span></div>
        <div class="fh-replay-note">${escapeHtml(r.note)}</div>
      </div>`,
      )
      .join("")}
    <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["honestLimit"] ?? ""))}</div>
    <div class="panel" style="padding:16px; margin-top:12px;">
      <div class="eyebrow" style="font-size:12px;">Be ready to argue</div>
      <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["prompt"] ?? ""))}</p>
    </div>`;
}


/* ------------------------------------------------ M2 L2 host the league -- */

type HLClub = {
  slot: number;
  name: string;
  short: string;
  building: string;
  capacity: number;
  capacityNote: string;
  draw: number;
  live: boolean;
  deskNumber: number | null;
  handle: string;
  starGone: boolean;
  sizeLabel: string;
};
type HLProfile = { id: string; sizeLabel: string; plainLine: string; bill: number; housePrice: number };
type HLBooks = { cash: number; draw: number; inDebt: boolean };
type HLSlateRow = { week: number; settled: boolean; open: boolean; hosting: HLClub; visiting: HLClub };
type HLWeek = {
  week: number;
  price: number;
  share: number;
  auto: boolean;
  stock: boolean;
  visitor: string;
  visitorFull: string;
  visitorDraw: number;
  hostDrawBefore: number;
  turnout: number;
  capacity: number;
  fillPct: number;
  turnedAway: number;
  soldOut: boolean;
  bareFans: number;
  ownFans: number;
  visitorFans: number;
  gate: number;
  inArena: number;
  doorMoney: number;
  bareDollars: number;
  ownDollars: number;
  visitorDollars: number;
  localMedia: number;
  national: number;
  bill: number;
  reinvestPaid: number;
  net: number;
  cashAfter: number;
  drawAfter: number;
  drawMove: number;
  road: { host: string; hostFull: string; hostDraw: number; dollars: number; fans: number; line: string };
  decompositionLine: string;
  priceCf?: HLPriceCf;
};
/** play N-5: the post-hoc price counterfactual for one settled night. */
type HLPriceCf = {
  yourPrice: number;
  yourKept: number;
  rows: { price: number; turnout: number; kept: number; keptRendered: string; delta: number; you: boolean; soldOut: boolean }[];
  bestPrice: number;
  bestKept: number;
  bestDelta: number;
  foundBest: boolean;
  line: string;
  verdict: string;
};
type HLMine = {
  fromBuilding: number;
  fromOwnDraw: number;
  fromVisitorDraw: number;
  localMedia: number;
  national: number;
  total: number;
  visitorLed: boolean;
  visitors: { week: number; club: string; short: string; draw: number; dollars: number; live: boolean; deskNumber: number | null }[];
};
type HLGive = {
  gave: number;
  received: number;
  net: number;
  spend: number;
  gaveByChoice: number;
  receivedByChoice: number;
  netByChoice: number;
  ownGain: number;
  meanShare: number;
  drawStart: number;
  drawEnd: number;
};

let hlSeatRequested = false;
let hlMountKey: string | null = null;
let hlLocalPrice: number | null = null;
/** Which settlement this device has already been scrolled to, so a re-render never yanks the page back. */
let hlLastSettledSeen: string | null = null;

function renderHostLeague(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (view["seated"] === false) {
    if (!hlSeatRequested) {
      hlSeatRequested = true;
      outbox?.submit({ type: "takeSeat" });
    }
    body.innerHTML = `<div class="banner">You're in — finding your club…</div>`;
    return;
  }
  if (s.phase !== "PLAY") {
    hlMountKey = null;
    document.body.classList.remove("fh-compact-play");
  }
  switch (s.phase) {
    case "LOBBY":
      body.innerHTML = `
        ${hlDeskHeader(view)}
        <div class="panel" style="padding:18px;">
          <p style="margin:0 0 10px; font-size:16px; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
          <p style="margin:0; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["plainLine"] ?? ""))}</p>
          ${hlIdentityHtml(view)}
        </div>
        <div class="banner" style="margin-top:12px;">Waiting for your teacher to start.</div>`;
      return;
    case "HOOK":
      renderHLHook(view);
      return;
    case "PLAY":
      renderHLPlay(view);
      return;
    case "REVEAL":
    case "ADAPT":
      renderHLReveal(view);
      return;
    case "ARGUE":
      body.innerHTML = `
        ${hlDeskHeader(view)}
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">February 2025</div>
          <p style="margin:0; font-size:15px; line-height:1.55; color:var(--ink-primary);">${escapeHtml(String(view["argue"] ?? ""))}</p>
        </div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Be ready to argue</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["prompt"] ?? ""))}</p>
        </div>`;
      return;
    case "SYNTHESIS":
      body.innerHTML = `
        ${hlDeskHeader(view)}
        <div class="banner">${escapeHtml(String(view["message"] ?? "Look up at the board."))}</div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Talk with your partner</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["exitPrompt"] ?? ""))}</p>
        </div>`;
      return;
    case "COMPLETE":
      body.innerHTML = `${hlDeskHeader(view)}<div class="banner">${escapeHtml(String(view["message"] ?? ""))}</div>`;
      return;
    default:
      body.innerHTML = `<pre class="banner" style="text-align:left; white-space:pre-wrap;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
  }
}

/**
 * `gate-l2-sr` BLOCKING-1. The profile's sentence renders under every club on
 * that profile, so it may only say what is true of all of them; anything
 * club-specific comes from `identityLine`, which the module supplies only where
 * it is true. Sixteen of twenty clubs render nothing here, which is the point:
 * silence is correct, and "Detroit is the biggest market in American sports"
 * was not.
 */
function hlIdentityHtml(view: Record<string, unknown>): string {
  const line = view["identityLine"];
  if (typeof line !== "string" || line.length === 0) return "";
  return `<p class="hl-identity">${escapeHtml(line)}</p>`;
}

function hlDeskHeader(view: Record<string, unknown>): string {
  if (!view["club"]) return "";
  return `
    <div class="fh-desk-head">
      <span style="${crestStyle(Number(view["crestIndex"] ?? 0), 24)}"></span>
      <span class="fh-desk-name">${escapeHtml(String(view["handle"] ?? ""))}</span>
      <span class="fh-desk-building">${escapeHtml(String(view["building"] ?? ""))}</span>
    </div>`;
}

function hlTopStrip(view: Record<string, unknown>): string {
  const books = view["books"] as HLBooks | undefined;
  if (!books) return hlDeskHeader(view);
  return `
    <div class="fh-topstrip">
      <span style="${crestStyle(Number(view["crestIndex"] ?? 0), 20)}"></span>
      <span class="fh-topstrip-name fh-desk-name">${escapeHtml(String(view["handle"] ?? ""))}</span>
      <span class="fh-topstrip-book ${books.inDebt ? "debt" : ""}"><span>Cash</span><span class="numeric">${money(books.cash)}</span></span>
      <span class="fh-topstrip-book"><span>Draw</span><span class="numeric">${books.draw}</span></span>
    </div>`;
}

function hlBooksHtml(books: HLBooks | undefined): string {
  if (!books) return "";
  return `
    <div class="fh-books">
      <div class="fh-book ${books.inDebt ? "debt" : ""}">
        <div class="fh-book-label">Cash</div>
        <div class="fh-book-value numeric">${money(books.cash)}</div>
        ${books.inDebt ? `<div class="fh-book-note">In the red — one week's national check clears it.</div>` : ""}
      </div>
      <div class="fh-book">
        <div class="fh-book-label">Draw</div>
        <div class="fh-book-value numeric">${books.draw}</div>
        <div class="fh-book-note">People your club's name puts in someone else's building</div>
      </div>
    </div>`;
}

function hlDrawPips(draw: number): string {
  return Array.from({ length: 5 }, (_, i) => `<span class="fh-dot ${i < Math.round(draw / 20) ? "on" : ""}"></span>`).join("");
}

function hlClubLine(label: string, club: HLClub, tone: string): string {
  return `
    <div class="hl-matchup-side ${tone}">
      <span class="hl-matchup-label">${escapeHtml(label)}</span>
      <span class="hl-matchup-club">${escapeHtml(club.short)}</span>
      <span class="hl-matchup-who">${club.live ? `Desk ${club.deskNumber}` : "league office"}</span>
      <span class="hl-matchup-draw"><span class="fh-dots">${hlDrawPips(club.draw)}</span><span class="numeric">Draw ${club.draw}</span></span>
    </div>`;
}

/**
 * The anticipation surface. `forceOpen` is true on the weeks where the pair is
 * about to price with nothing else competing for the fold — play R2 asks for at
 * least the Week 2 row to be visible on first contact without scrolling, and a
 * collapsed <details> cannot satisfy that.
 */
function hlSlateHtml(slate: HLSlateRow[], forceOpen = false, terse = false): string {
  if (slate.length === 0) return "";
  const rows = slate
    .map(
      (r) =>
        `<div class="fh-slate-row${r.open ? " hl-open-week" : ""}"><span>Week ${r.week}${r.open ? " · now" : r.settled ? " · played" : ""}</span><span>HOST ${escapeHtml(r.hosting.short)}</span><span class="numeric">Draw ${r.hosting.draw}</span><span>VISIT ${escapeHtml(r.visiting.short)}</span><span class="numeric">Draw ${r.visiting.draw}</span></div>`,
    )
    .join("");
  // play N-6: inside the decision column the strip is the ANTICIPATION surface
  // and nothing else — its 90-word footnote and its long summary are what
  // pushed the dials 70px under the fold. The footnote moves into the block's
  // own disclosure, so nothing is deleted and nothing is above the dials.
  if (terse) {
    const tight = slate
      .map(
        (r) =>
          `<div class="fh-slate-row${r.open ? " hl-open-week" : ""}"><span>W${r.week}${r.open ? " · now" : r.settled ? " · played" : ""}</span><span>HOST ${escapeHtml(
            r.hosting.short,
          )} <span class="numeric">${r.hosting.draw}</span></span><span>AT ${escapeHtml(r.visiting.short)} <span class="numeric">${r.visiting.draw}</span></span></div>`,
      )
      .join("");
    return `
      <div class="hl-slate-block hl-slate-terse" style="margin-top:8px;">
        <div class="eyebrow" style="font-size:11px; margin-bottom:2px;">The three weeks — pairings fixed, every Draw still moving</div>
        <div class="fh-slate">${tight}</div>
      </div>`;
  }
  return `
    <details class="fa-rules hl-slate-block" style="margin-top:10px;" ${forceOpen || slate.some((r) => r.open) ? "open" : ""}>
      <summary>The three-week schedule — who visits you, and whose building you are in</summary>
      <div class="fh-slate">${rows}</div>
      <p style="margin:8px 0 0; font-size:12px; color:var(--ink-secondary);">The pairings are fixed. The Draw numbers are not — every one of them is another desk still deciding.</p>
    </details>`;
}

function hlLeagueTable(league: HLClub[]): string {
  if (league.length === 0) return "";
  return `
    <details class="fa-rules" style="margin-top:12px;">
      <summary>Every club in the league</summary>
      <div class="fh-slate">
        ${league
          .map(
            (c) =>
              `<div class="fh-slate-row"><span>${escapeHtml(c.short)}</span><span>${escapeHtml(c.sizeLabel)}</span><span>${c.live ? `Desk ${c.deskNumber}` : "league office"}</span><span class="numeric">Draw ${c.draw}</span></div>`,
          )
          .join("")}
      </div>
    </details>`;
}

function renderHLHook(view: Record<string, unknown>): void {
  const rules = (view["rules"] as string[]) ?? [];
  const profile = view["profile"] as HLProfile;
  $("gameBody").innerHTML = `
    ${hlDeskHeader(view)}
    <div class="panel" style="padding:18px;">
      <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">You Don't Play Alone</div>
      <p style="margin:0 0 12px; font-size:15px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
      <p style="margin:0; font-size:14px; line-height:1.5; color:var(--ink-secondary);">${escapeHtml(String(view["objective"] ?? ""))}</p>
    </div>
    ${hlBooksHtml(view["books"] as HLBooks)}
    <div class="panel" style="padding:16px; margin-top:12px;">
      <div class="eyebrow" style="font-size:12px; margin-bottom:6px;">Your club</div>
      <div class="fh-market-facts">
        <div><span>${escapeHtml(String(view["club"] ?? ""))}</span><span>${escapeHtml(String(view["building"] ?? ""))}</span></div>
        <div><span>Seats</span><span class="numeric">${Number(view["capacity"] ?? 0).toLocaleString()}</span></div>
        <div><span>Bill, every week</span><span class="numeric">${money(profile?.bill ?? 0)}</span></div>
        <div><span>Market</span><span>${escapeHtml(profile?.sizeLabel ?? "")}</span></div>
      </div>
      <div class="fh-stamp" style="margin-top:6px;">${escapeHtml(String(view["capacityNote"] ?? ""))}</div>
      <p style="margin:10px 0 0; font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["plainLine"] ?? ""))}</p>
      ${hlIdentityHtml(view)}
    </div>
    ${hlSlateHtml((view["slate"] as HLSlateRow[]) ?? [])}
    <details class="fa-rules" style="margin-top:12px;">
      <summary>How the three weeks work</summary>
      <ul>${rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </details>
    ${hlLeagueTable((view["league"] as HLClub[]) ?? [])}
    <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["horizonLine"] ?? ""))}</div>
    <div class="banner" style="margin-top:8px;">${escapeHtml(String(view["modeledDollarsLine"] ?? ""))}</div>`;
}

/**
 * `gate-l2-play` N-5 — the rating ceiling, and the only feature in this bundle.
 *
 * The re-check's cause for FUNCTIONAL: "the price dial has consequence but no
 * counterfactual — nothing anywhere tells a pair what $46 would have taken on
 * the night they priced $78." This is that, on the settlement screen, after the
 * bell, for the week that just happened: same visitor, same Draws, same
 * building, same reinvest share, only the price moves. Every figure is computed
 * by the module (`priceCounterfactualFor`), never here.
 */
function hlPriceCfHtml(w: HLWeek): string {
  const cf = w.priceCf;
  if (!cf || cf.rows.length < 2) return "";
  return `
    <div class="hl-pricecf" id="hlPriceCf">
      <div class="hl-split-title">What another price would have done</div>
      <div class="hl-pricecf-rows">
        ${cf.rows
          .map(
            (r) => `<div class="hl-pricecf-row${r.you ? " you" : ""}${r.price === cf.bestPrice && !r.you ? " best" : ""}">
              <span class="numeric">$${r.price}</span>
              <span>${r.you ? "what you charged" : r.price === cf.bestPrice ? "the best on the dial" : r.price < cf.yourPrice ? "cheaper" : "dearer"}</span>
              <span class="numeric">${r.turnout.toLocaleString()} came${r.soldOut ? " · full" : ""}</span>
              <span class="numeric ${r.kept < 0 ? "neg" : ""}">${escapeHtml(r.keptRendered)}</span>
            </div>`,
          )
          .join("")}
      </div>
      <div class="hl-pricecf-verdict">${escapeHtml(cf.verdict)}</div>
      <div class="hl-give-note">${escapeHtml(cf.line)}</div>
    </div>`;
}

function hlWeekResultHtml(w: HLWeek, title: string): string {
  const sellout = w.soldOut
    ? `<div class="fh-sellout">
         <div class="fh-sellout-title">FULL HOUSE</div>
         <div class="fh-sellout-sub">${w.turnout.toLocaleString()} of ${w.capacity.toLocaleString()} seats · every one sold</div>
         ${w.turnedAway > 0 ? `<div class="fh-sellout-turned"><span class="numeric">${w.turnedAway.toLocaleString()}</span><span>could not get in</span></div>` : ""}
       </div>`
    : "";
  const door = Math.max(1, w.doorMoney);
  return `
    <div class="fh-result ${w.soldOut ? "soldout" : ""}">
      <div class="fh-result-head">
        <span>${escapeHtml(title)} <span class="fh-history-sub">vs ${escapeHtml(w.visitor)} · Draw ${w.visitorDraw}</span>${w.auto ? ' <span class="fh-flag">auto</span>' : ""}${w.stock ? ' <span class="fh-flag">covered</span>' : ""}</span>
        <span class="numeric">$${w.price}${w.share > 0 ? ` · ${w.share}% back in` : ""}</span>
      </div>
      ${sellout}
      <div class="fh-fill-track"><div class="fh-fill-bar ${w.soldOut ? "soldout" : ""}" style="width:${Math.min(100, w.fillPct)}%"></div></div>
      <div class="hl-split" id="hlSplit">
        <div class="hl-split-title">Who filled your building</div>
        <div class="hl-split-bar">
          <span class="hl-seg bare" style="width:${(w.bareDollars / door) * 100}%"></span>
          <span class="hl-seg own" style="width:${(w.ownDollars / door) * 100}%"></span>
          <span class="hl-seg visitor" style="width:${(w.visitorDollars / door) * 100}%"></span>
        </div>
        <div class="hl-split-rows">
          <div class="hl-split-row"><span class="hl-key bare"></span><span>Your building at $${w.price}</span><span class="numeric">${w.bareFans.toLocaleString()} · ${money(w.bareDollars)}</span></div>
          <div class="hl-split-row"><span class="hl-key own"></span><span>Your own Draw (${w.hostDrawBefore})</span><span class="numeric">${w.ownFans.toLocaleString()} · ${money(w.ownDollars)}</span></div>
          <div class="hl-split-row"><span class="hl-key visitor"></span><span>${escapeHtml(w.visitor)} visiting (Draw ${w.visitorDraw})</span><span class="numeric">${w.visitorFans.toLocaleString()} · ${money(w.visitorDollars)}</span></div>
        </div>
      </div>
      <div class="fh-kept ${w.net < 0 ? "neg" : ""}" data-hl-kept="1">
        <span class="fh-kept-label">Kept</span>
        <span class="fh-kept-num numeric">${money(w.net)}</span>
      </div>
      <div class="hl-road" id="hlRoad">${escapeHtml(w.road.line)}</div>
      ${hlPriceCfHtml(w)}
      <div class="hl-ledger-block">
        <div class="fh-result-row"><span>Ticket money</span><span class="numeric">${money(w.gate)}</span></div>
        <div class="fh-result-row"><span>Spent inside the building</span><span class="numeric">${money(w.inArena)}</span></div>
        <div class="fh-result-row"><span>Local media and sponsors</span><span class="numeric">${money(w.localMedia)}</span></div>
        <div class="fh-result-row"><span>National television check</span><span class="numeric">${money(w.national)}</span></div>
        <div class="fh-result-row total"><span>Money in</span><span class="numeric">${money(w.gate + w.inArena + w.localMedia + w.national)}</span></div>
        <div class="fh-result-row"><span>Weekly bill</span><span class="numeric neg">-${money(w.bill)}</span></div>
        ${w.reinvestPaid > 0 ? `<div class="fh-result-row"><span>Put back into the club (${w.share}%)</span><span class="numeric neg">-${money(w.reinvestPaid)}</span></div>` : ""}
        <div class="fh-result-row"><span>Draw</span><span class="numeric">${w.hostDrawBefore} → ${w.drawAfter} (${w.drawMove >= 0 ? "+" : ""}${w.drawMove})</span></div>
      </div>
    </div>`;
}

function hlHistoryHtml(history: HLWeek[]): string {
  if (history.length === 0) {
    return `<div class="fh-history-empty">Nothing behind you yet. Your first price is a judgement call — read who is visiting and what their Draw is.</div>`;
  }
  return `
    <div class="fh-history">
      <div class="fh-history-row head"><span>Week</span><span>Price</span><span>Came</span><span>Full</span><span>Kept</span></div>
      ${history
        .map(
          (h) => `
        <div class="fh-history-row ${h.stock ? "stock" : ""}">
          <span>W${h.week} <span class="fh-history-sub">vs ${escapeHtml(h.visitor)} · D${h.visitorDraw}</span>${h.stock ? ' <span class="fh-flag">covered</span>' : ""}${h.auto ? ' <span class="fh-flag">auto</span>' : ""}</span>
          <span class="numeric">$${h.price}</span>
          <span class="numeric">${h.turnout.toLocaleString()}</span>
          <span class="numeric">${h.fillPct}%</span>
          <span class="numeric ${h.net < 0 ? "neg" : ""}">${money(h.net)}</span>
        </div>`,
        )
        .join("")}
    </div>`;
}

function renderHLPlay(view: Record<string, unknown>): void {
  const body = $("gameBody");
  document.body.classList.toggle("fh-compact-play", !view["allWeeksDone"]);
  if (view["allWeeksDone"]) {
    hlMountKey = null;
    document.body.classList.remove("hl-has-lockbar");
    body.innerHTML = `
      ${hlDeskHeader(view)}
      ${hlBooksHtml(view["books"] as HLBooks)}
      <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
      ${hlHistoryHtml((view["history"] as HLWeek[]) ?? [])}`;
    return;
  }

  const hosting = view["hosting"] as HLClub;
  const visiting = view["visiting"] as HLClub;
  const locked = Boolean(view["locked"]);
  const history = (view["history"] as HLWeek[]) ?? [];
  const last = view["lastSettled"] as HLWeek | null;
  const shock = view["shock"] as { club: string; full: string; draw: number; hostingThem: boolean; line: string } | null;
  const weekNumber = Number(view["weekNumber"] ?? 1);

  // play N-6 / projector W4-3: the rejoin-PIN card eats ~119px — a fifth of a
  // 600px Chromebook — and it sat in the hero slot of the decision surface for
  // any pair that joined inside the 20-second auto-collapse window, or rejoined
  // mid-lesson. The decision surface owns the first viewport; the PIN collapses
  // to the fixed reopen strip, which is one press away and always reachable.
  hidePin();

  const key = `${weekNumber}|${locked}|${history.length}`;
  if (hlMountKey === key && document.getElementById("hlPlayRoot")) return;
  hlMountKey = key;
  if (hlLocalPrice === null || !locked) hlLocalPrice = Number(view["price"] ?? 44);
  const price = locked ? Number(view["price"]) : hlLocalPrice;
  const share = Number(view["share"] ?? 0);

  const rule = (view["reinvestRule"] as { line: string; detail: string[] } | undefined) ?? { line: "", detail: [] };

  // ---------------------------------------------------------------- the fold
  // `gate-l2-play` R1/R2 (BLOCKING, and the reason the lesson rated FUNCTIONAL
  // rather than STRONG). Measured live at 1024x600: after the week bell the
  // page was 1543px tall, auto-landed the pair at y=261 with the REINVEST
  // instruction paragraph at eye level, and put #hlSplit's bottom edge at 749,
  // KEPT at ~1050 and #hlRoad — the externality sentence the whole synthesis is
  // built on — at 1103. The consequence of the week the room had just played
  // was ~500px below the fold, underneath the controls for a week that had not
  // started. A grade-5 pair that does not think to scroll experiences the bell
  // as nothing happening.
  //
  // Three changes, and they are ordering changes rather than deletions:
  //  1. When a week has just settled, the SETTLEMENT is first in the document
  //     and the page is put at the top, so the decomposition, KEPT and the road
  //     card are what lands. Next week's dials are below it, where they belong
  //     at that moment.
  //  2. LOCK IT IN moved into a bar pinned to the bottom of the viewport, so
  //     the primary action is reachable at every scroll position in every week
  //     — including while the pair is still reading the result. (This is also
  //     `gate-l2-projector` P-7's recommendation.)
  //  3. The ~90-word REINVEST paragraph that used to sit between the dials and
  //     the button on every single week is one line at the dial plus a
  //     disclosure. Nothing was deleted; it was moved off the fold (play R10).
  // ------------------------------------------------- the decision band (N-6)
  // `gate-l2-play` N-6 (BLOCKING) — the finding that capped the lesson at
  // FUNCTIONAL. Round 3 put the settlement in a full-width span ABOVE the two
  // columns, which cleared week 1 and rotated the same defect into weeks 2 and
  // 3: measured at 1024x600 with no manual scroll, the band held last week's
  // result and a pinned LOCK button and NOTHING ELSE — both dials, the visiting
  // club and the schedule strip were 350-700px below it, and the critic
  // completed two of the lesson's three decisions by pressing LOCK twice
  // without ever seeing a dial, committing the house-price/0% free-ride default
  // both times.
  //
  // The shape is now the SAME in every week rather than reordered per week, and
  // it is the split the surfaces actually are:
  //   left column  = EVIDENCE. Last week's settlement (decomposition, KEPT, the
  //                  road card, the price counterfactual) and the history table.
  //   right column = THE DECISION. Who is visiting, the star departure, the
  //                  three-week schedule strip, both dials — the whole decision
  //                  set, in one place, the same place, every week.
  // The span above holds only the bell head and the topstrip, so both columns
  // start high enough that the decision set and the settlement coexist in the
  // band instead of taking turns. Week 1 is not a special case any more; it is
  // the same layout with an empty evidence column.
  const justSettled = last !== null && last.week === weekNumber - 1;
  const settlementHtml = justSettled ? hlWeekResultHtml(last!, `Week ${last!.week} — how it went`) : "";
  const weekCardHtml = `
      <div class="hl-week-card" id="hlWeekCard">
        <div class="hl-week-top">
          <span class="hl-week-num">Week ${weekNumber} of ${view["weekCount"]}</span>
          <span class="hl-week-cap">${Number(view["capacity"] ?? 0).toLocaleString()} seats</span>
        </div>
        <div class="hl-matchup">
          ${hlClubLine("Visiting you", hosting, "host")}
          ${hlClubLine("You are visiting", visiting, "away")}
        </div>
        ${shock ? `<div class="hl-shock ${shock.hostingThem ? "mine" : ""}" id="hlShock">${escapeHtml(shock.line)}</div>` : ""}
      </div>`;
  const dialsHtml = locked
    ? `<div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
       <div class="fh-locked-recap"><span>Locked at</span><span class="numeric">$${price}</span><span>· ${share}% back into the club</span></div>`
    : `
        <div class="panel fh-dials" style="padding:14px; margin-top:10px;">
          <div class="eyebrow" style="font-size:12px;">Price of a seat</div>
          <div class="fh-price-readout numeric" id="hlPriceReadout">$${price}</div>
          <div class="fh-dial">
            <input class="price-dial-input" type="range" id="hlPriceDial" min="${view["priceMin"]}" max="${view["priceMax"]}" step="${view["priceStep"]}" value="${price}" />
          </div>
          <div class="price-dial-ends"><span>$${view["priceMin"]}</span><span>$${view["priceMax"]}</span></div>

          <div class="eyebrow" style="font-size:12px; margin-top:12px;">Put back into the club <span class="fh-lag">arrives next week</span></div>
          <div class="fh-spend-row">
            <div class="bid-stepper">
              <button type="button" class="btn" id="hlShareDown">−</button>
              <span class="bid-stepper-readout" id="hlShareReadout">${share}%</span>
              <button type="button" class="btn" id="hlShareUp">+</button>
            </div>
            <span class="fh-lag">of what comes through your door this week</span>
          </div>
          <div class="hl-reinvest-rule">${escapeHtml(rule.line)}</div>
          <details class="fa-rules hl-reinvest-more">
            <summary>How the reinvest dial works</summary>
            <ul>${rule.detail.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
          </details>
          <div class="fh-blind-note">No preview. Nothing on this screen tells you what this week will make.</div>
        </div>`;

  // play N-2 (BLOCKING). Reordering and shrinking had already been tried: the
  // dials still measured 595..617 in a 600px viewport at the moment of
  // decision, because a single 640px column cannot hold the week card, the
  // schedule strip AND the decision surface above a Chromebook fold. The
  // decision surface now gets its own column beside the context it is read
  // against, so the pair sees what it is deciding and the two dials it decides
  // with at the same time, without scrolling. The settlement, when there is
  // one, spans both columns above them — it is still the thing the bell lands.
  const evidenceHtml = justSettled
    ? `<div class="hl-bell-head" id="hlBellHead">THE WEEK IS IN THE BOOKS</div>${settlementHtml}`
    : last
      ? hlWeekResultHtml(last, `Week ${last.week} — how it went`)
      : "";
  body.innerHTML = `
    <div id="hlPlayRoot" class="hl-decide">
      <div class="hl-span">${hlTopStrip(view)}</div>
      <div class="hl-col-context">
        ${evidenceHtml}
        <div class="eyebrow" style="font-size:12px; margin:16px 0 6px;">Your weeks so far</div>
        ${hlHistoryHtml(history)}
      </div>
      <div class="hl-col-decide" id="hlDecisionBand">
        ${weekCardHtml}
        ${hlSlateHtml((view["slate"] as HLSlateRow[]) ?? [], true, true)}
        ${dialsHtml}
      </div>
    </div>
    ${
      locked
        ? ""
        : `<div class="hl-lockbar" id="hlLockBar">
             <span class="hl-lockbar-vals" id="hlLockVals">Week ${weekNumber} · <b id="hlLockPrice">$${price}</b> · <b id="hlLockShare">${share}%</b> back in</span>
             <button class="btn btn-primary" id="hlLock" disabled data-hl-armed="0">LOCK IT IN</button>
           </div>`
    }`;
  document.body.classList.toggle("hl-has-lockbar", !locked);

  // play N-1/N-2: the shell reserves the lock bar's band as body padding, so
  // the bar's real rendered height has to be the number the CSS reserves. Read
  // it rather than hard-coding it — the button's min-height, the safe-area
  // inset and the pair's font settings all move it.
  const lockBar = document.getElementById("hlLockBar");
  if (lockBar) document.body.style.setProperty("--hl-lockbar-h", `${Math.ceil(lockBar.getBoundingClientRect().height)}px`);
  else document.body.style.removeProperty("--hl-lockbar-h");

  // The bell put a result on this screen, and next week's decision beside it.
  // Land the pair at the top of both. Instant, never smooth: a mid-animation
  // scroll position is not a real reachable state to leave a student in. `main`
  // is the scroll container while the lock bar is up, so both have to be reset.
  if (justSettled && hlLastSettledSeen !== `${weekNumber}|${history.length}`) {
    hlLastSettledSeen = `${weekNumber}|${history.length}`;
    window.scrollTo({ top: 0, behavior: "auto" });
    const scroller = document.querySelector("main");
    if (scroller) scroller.scrollTop = 0;
  }

  if (locked) return;

  const dial = $<HTMLInputElement>("hlPriceDial");
  const readout = $("hlPriceReadout");
  const lockPrice = document.getElementById("hlLockPrice");
  const lockShare = document.getElementById("hlLockShare");

  // ------------------------------------------------ the arming guard (N-6)
  // The second half of N-6: "until it holds, #hlLock must not commit a default
  // the pair has not been shown." The layout above is meant to make both dials
  // present at first contact in every week; this makes a REGRESSION of that
  // layout impossible to walk into blind rather than merely unlikely.
  //
  // LOCK IT IN ships disabled and arms the first time the two dials have
  // actually been on screen together (or the moment either is touched). If the
  // band ever stops holding them — a narrower Chromebook, a longer club name, a
  // future card inserted above — the pair is told to go and look at the dials
  // instead of silently committing house price and 0% reinvest. In the intended
  // layout this arms within one frame of first paint and the pair never sees it.
  const lockBtn = document.getElementById("hlLock") as HTMLButtonElement | null;
  const lockVals = document.getElementById("hlLockVals");
  const lockValsHtml = lockVals?.innerHTML ?? "";
  const seenDials = new Set<string>();
  const armLock = (): void => {
    if (!lockBtn || lockBtn.dataset["hlArmed"] === "1") return;
    lockBtn.dataset["hlArmed"] = "1";
    lockBtn.disabled = false;
    if (lockVals) lockVals.innerHTML = lockValsHtml;
  };
  if (lockBtn) {
    if (lockVals) lockVals.textContent = "Read the two dials before you commit";
    const targets = [document.getElementById("hlPriceDial"), document.getElementById("hlShareUp"), document.getElementById("hlShareDown")].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (typeof IntersectionObserver === "function" && targets.length === 3) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) seenDials.add(e.target.id);
          if (seenDials.size === targets.length) {
            armLock();
            io.disconnect();
          }
        },
        { threshold: 0.6 },
      );
      for (const t of targets) io.observe(t);
    } else {
      armLock(); // no observer available: never trap a pair behind a guard
    }
    for (const t of targets) {
      t.addEventListener("pointerdown", armLock);
      t.addEventListener("focus", armLock);
      t.addEventListener("input", armLock);
    }
  }
  dial.addEventListener("input", () => {
    hlLocalPrice = Number(dial.value);
    readout.textContent = `$${dial.value}`;
    if (lockPrice) lockPrice.textContent = `$${dial.value}`;
  });
  dial.addEventListener("change", () => outbox?.submit({ type: "setPrice", price: Number(dial.value) }));

  let localShare = share;
  const shareReadout = $("hlShareReadout");
  const shareUp = $<HTMLButtonElement>("hlShareUp");
  const shareDown = $<HTMLButtonElement>("hlShareDown");
  const shareMin = Number(view["shareMin"] ?? 0);
  const shareMax = Number(view["shareMax"] ?? 40);
  // play R11: the + button stayed enabled at the 40% cap and the last click did
  // nothing at all.
  const syncShareButtons = () => {
    shareUp.disabled = localShare >= shareMax;
    shareDown.disabled = localShare <= shareMin;
  };
  const stepShare = (dir: number) => {
    const step = Number(view["shareStep"] ?? 5);
    const next = Math.max(shareMin, Math.min(shareMax, localShare + dir * step));
    if (next === localShare) return;
    localShare = next;
    shareReadout.textContent = `${localShare}%`;
    if (lockShare) lockShare.textContent = `${localShare}%`;
    syncShareButtons();
    outbox?.submit({ type: "setShare", share: localShare });
  };
  syncShareButtons();
  shareUp.addEventListener("click", () => stepShare(1));
  shareDown.addEventListener("click", () => stepShare(-1));
  $("hlLock").addEventListener("click", () => {
    if (confirm(`Lock week ${weekNumber} at $${dial.value} with ${localShare}% back into the club? You cannot change it after this.`)) {
      outbox?.submit({ type: "setPrice", price: Number(dial.value) });
      outbox?.submit({ type: "setShare", share: localShare });
      outbox?.submit({ type: "lock" });
    }
  });
}

function renderHLReveal(view: Record<string, unknown>): void {
  const history = (view["history"] as HLWeek[]) ?? [];
  const mine = view["mine"] as HLMine | null;
  const give = view["give"] as HLGive | null;
  const questions = (view["questions"] as string[]) ?? [];
  const total = Math.max(1, mine?.total ?? 1);
  $("gameBody").innerHTML = `
    ${hlDeskHeader(view)}
    ${hlBooksHtml(view["books"] as HLBooks)}
    <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
    ${
      mine
        ? `<div class="hl-split" id="hlSeasonSplit">
             <div class="hl-split-title">Your three weeks, where the money came from</div>
             <div class="hl-split-bar">
               <span class="hl-seg bare" style="width:${(mine.fromBuilding / total) * 100}%"></span>
               <span class="hl-seg own" style="width:${(mine.fromOwnDraw / total) * 100}%"></span>
               <span class="hl-seg visitor" style="width:${(mine.fromVisitorDraw / total) * 100}%"></span>
               <span class="hl-seg local" style="width:${(mine.localMedia / total) * 100}%"></span>
               <span class="hl-seg national" style="width:${(mine.national / total) * 100}%"></span>
             </div>
             <div class="hl-split-rows">
               <div class="hl-split-row"><span class="hl-key bare"></span><span>Your building at your prices</span><span class="numeric">${money(mine.fromBuilding)}</span></div>
               <div class="hl-split-row"><span class="hl-key own"></span><span>Your own Draw</span><span class="numeric">${money(mine.fromOwnDraw)}</span></div>
               <div class="hl-split-row"><span class="hl-key visitor"></span><span>The clubs who visited you</span><span class="numeric">${money(mine.fromVisitorDraw)}</span></div>
               <div class="hl-split-row"><span class="hl-key local"></span><span>Local media and sponsors</span><span class="numeric">${money(mine.localMedia)}</span></div>
               <div class="hl-split-row"><span class="hl-key national"></span><span>National television check</span><span class="numeric">${money(mine.national)}</span></div>
             </div>
             <div class="hl-split-visitors">${mine.visitors
               .map((v) => `<span>W${v.week}: ${escapeHtml(v.short)} (Draw ${v.draw}) brought ${money(v.dollars)}</span>`)
               .join("")}</div>
           </div>`
        : ""
    }
    ${
      give
        ? `<div class="hl-give" id="hlGive">
             <div class="hl-split-title">What you gave, what you got</div>
             <div class="hl-give-sub" id="hlDealtLine">${escapeHtml(String(view["dealtLine"] ?? ""))}</div>
             <div class="hl-give-row"><span>Your Draw put this on OTHER clubs' books</span><span class="numeric">${money(give.gave)}</span></div>
             <div class="hl-give-row"><span>Visiting clubs put this on YOURS</span><span class="numeric">${money(give.received)}</span></div>
             <div class="hl-give-row net"><span>Net</span><span class="numeric">${money(give.net)}</span></div>
             <div class="hl-give-note">This is not money you kept or lost. It is money that moved because of drawing power — yours and theirs.</div>
             <div class="hl-give-sub" id="hlGiveChoice">${
               give.spend > 0 ? `What your own DECISIONS did — you spent ${money(give.spend)}` : "What your own DECISIONS did — you spent nothing, and that is a decision"
             }</div>
             <div class="hl-give-row"><span>Of the above, what YOUR spending put in other buildings</span><span class="numeric">${money(give.gaveByChoice)}</span></div>
             <div class="hl-give-row"><span>What OTHER desks' spending put in yours</span><span class="numeric">${money(give.receivedByChoice)}</span></div>
             <div class="hl-give-row net"><span>What your spending was worth to YOUR OWN cash</span><span class="numeric ${give.ownGain < 0 ? "neg" : ""}">${money(give.ownGain)}</span></div>
             <div class="hl-give-note" id="hlGiveLine">${escapeHtml(String(view["giveLine"] ?? ""))} Your Draw went from ${give.drawStart} to ${give.drawEnd}; you put an average of ${give.meanShare}% of your door money back in.</div>
           </div>`
        : ""
    }
    ${questions.length > 0 ? `<div class="panel" style="padding:16px; margin-top:12px;"><div class="eyebrow" style="font-size:12px;">Talk to your partner</div><ol class="fh-questions">${questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol></div>` : ""}
    <div class="eyebrow" style="font-size:12px; margin:16px 0 6px;">Your weeks</div>
    ${history.map((w) => hlWeekResultHtml(w, `Week ${w.week}`)).join("")}`;
}

/* ================= M2 L3 "Writing the Rule" — student device =================
   Same architecture as L2, deliberately: the pinned commit bar, the two-column
   decision band, the arming guard, and the same Cap Room type classes. The
   Chromebook fold behaviour of this shell is the one thing in the module that
   is already proven at 1024x600, so the finale inherits it rather than
   re-inventing it under a deadline. Only the decisions are new. */

let wrSeatRequested = false;
let wrMountKey: string | null = null;
let wrLocalPrice: number | null = null;
let wrLocalShare: number | null = null;
let wrLocalCondition: boolean | null = null;
let wrLastSettledSeen: string | null = null;

type WRRule = { share: number; condition: boolean; how: string; supporting: number; liveDesks: number; conditionMin: number } | null;
type WRHistogram = {
  round: number;
  bins: { share: number; count: number }[];
  median: number;
  conditionYes: number;
  submitted: number;
  abstained: number;
  inBand: number;
  needed: number;
  roomSize: number;
};
type WRTermSheet = { id: string; city: string; headline: string; lines: string[] };
type WRLens = { stage: number; label: string; value: string };
type WRWeek = {
  week: number;
  price: number;
  reinvest: number;
  auto: boolean;
  visitor: string;
  visitorDraw: number;
  turnout: number;
  capacity: number;
  soldOut: boolean;
  turnedAway: number;
  gate: number;
  inArena: number;
  localMedia: number;
  national: number;
  bill: number;
  reinvestSpend: number;
  paidIn: number;
  tookOut: number;
  potNet: number;
  docked: boolean;
  cashDelta: number;
  cashAfter: number;
  drawAfter: number;
  roadDollarsGiven: number;
  transferLine: string;
};
type WRSlateRow = { week: number; open: boolean; settled: boolean; hosting: { short: string; draw: number }; visiting: { short: string; draw: number } };
type WRCard = {
  id: string;
  title: string;
  body: string;
  rails: { rememberWhen: string; ourClass: string; inSports: string; economistsCall: string; outsideSports: string };
};

function wrDeskHeader(view: Record<string, unknown>): string {
  if (!view["club"]) return "";
  return `
    <div class="fh-desk-head" id="wrIdentity">
      <span style="${crestStyle(Number(view["crestIndex"] ?? 0), 24)}"></span>
      <span class="fh-desk-name">${escapeHtml(String(view["handle"] ?? ""))}</span>
      <span class="fh-desk-building">${escapeHtml(String(view["sizeLabel"] ?? ""))} · ${escapeHtml(String(view["building"] ?? ""))}</span>
    </div>`;
}

function wrRuleStrip(rule: WRRule): string {
  if (!rule) return "";
  return `
    <div class="fh-topstrip" id="wrRuleStrip">
      <span class="fh-topstrip-name fh-desk-name">RULE IN FORCE</span>
      <span class="fh-topstrip-book"><span>Share</span><span class="numeric">${rule.share}%</span></span>
      <span class="fh-topstrip-book"><span>Condition</span><span class="numeric">${rule.condition ? `${rule.conditionMin}%+` : "OFF"}</span></span>
    </div>`;
}

function wrBooks(view: Record<string, unknown>): string {
  return `
    <div class="fh-books">
      <div class="fh-book ${Number(view["cash"] ?? 0) < 0 ? "debt" : ""}">
        <div class="fh-book-label">Cash</div>
        <div class="fh-book-value numeric">${money(Number(view["cash"] ?? 0))}</div>
      </div>
      <div class="fh-book">
        <div class="fh-book-label">Draw</div>
        <div class="fh-book-value numeric">${Number(view["draw"] ?? 0)}</div>
        <div class="fh-book-note">People your club's name puts in someone else's building</div>
      </div>
    </div>`;
}

function wrLeagueTable(view: Record<string, unknown>): string {
  const league = (view["league"] as { deskNumber: number; short: string; sizeLabel: string; draw: number; live: boolean }[]) ?? [];
  if (league.length === 0) return "";
  return `
    <details class="fa-rules" style="margin-top:12px;">
      <summary>Every club in the league</summary>
      <div class="fh-slate">
        ${league
          .map(
            (c) =>
              `<div class="fh-slate-row"><span>${escapeHtml(c.short)}</span><span>${escapeHtml(c.sizeLabel)}</span><span>${c.live ? `Desk ${c.deskNumber}` : "league office"}</span><span class="numeric">Draw ${c.draw}</span></div>`,
          )
          .join("")}
      </div>
    </details>`;
}

function wrHistogramHtml(h: WRHistogram | null, held: boolean, heldCopy: string, band: number): string {
  if (held || !h) {
    return `<div class="panel" id="wrHistogram" style="padding:14px; margin-top:10px;">
      <div class="eyebrow" style="font-size:12px;">The room's numbers</div>
      <p style="margin:8px 0 0; font-size:13px; color:var(--ink-secondary);">${escapeHtml(heldCopy)}</p>
    </div>`;
  }
  const max = Math.max(1, ...h.bins.map((b) => b.count));
  return `
    <div class="panel" id="wrHistogram" style="padding:14px; margin-top:10px;">
      <div class="eyebrow" style="font-size:12px;">Round ${h.round} — every desk's number, no names</div>
      <div class="wr-hist">
        ${h.bins
          .map((b) => {
            const inBand = Math.abs(b.share - h.median) <= band + 1e-9;
            return `<div class="wr-hist-col ${inBand ? "inband" : "outband"}"><div class="wr-hist-bar" style="height:${Math.round((b.count / max) * 46) + 2}px;"></div><div class="wr-hist-tick">${b.share}</div></div>`;
          })
          .join("")}
      </div>
      <div class="hl-give-note" id="wrHistBand">Middle number: <b class="numeric">${h.median}%</b> · the highlighted columns are within ${band} points of it, and <b class="numeric">${h.inBand}</b> of <b class="numeric">${h.roomSize}</b> desks are in there — <b class="numeric">${h.needed}</b> are needed to pass.${h.abstained > 0 ? ` ${h.abstained} desk${h.abstained === 1 ? "" : "s"} put no number in.` : ""}</div>
      <div class="hl-give-note">${h.conditionYes} of ${h.submitted} desks wanted the condition on. Unsorted, no money, no names.</div>
    </div>`;
}

function wrTransferHtml(w: WRWeek): string {
  return `
    <div class="hl-give" id="wrTransfer">
      <div class="hl-split-title">Paid in, took out</div>
      <div class="hl-give-row"><span>You paid into the pot</span><span class="numeric" data-wr-paid>${money(w.paidIn)}</span></div>
      <div class="hl-give-row"><span>You took back out</span><span class="numeric" data-wr-took>${money(w.tookOut)}</span></div>
      <div class="hl-give-row net"><span>Net from the pot</span><span class="numeric ${w.potNet < 0 ? "neg" : ""}" data-wr-net>${money(w.potNet)}</span></div>
      ${w.docked ? `<div class="hl-give-note">Docked: you were under the condition the room voted in, so you collected half a share.</div>` : ""}
      <div class="hl-give-note">${escapeHtml(w.transferLine)}</div>
    </div>`;
}

/**
 * The week's settlement, ordered for the lesson it belongs to.
 *
 * The e2e's occlusion instrument found the first version's transfer column at
 * 503..653 in a 600px viewport, behind the pinned commit bar — the exact defect
 * class the L2 gate caught once already. The fix is an ORDERING one, not a
 * deletion: the pot column is the highest-value attribution surface in this
 * lesson (BC-6 fix 3, "a reader of this alone can say whether a gain came from
 * the transfer or from their own dial"), so it is first in the document and the
 * six revenue lines move into a disclosure underneath. Nothing is removed.
 */
function wrWeekResult(w: WRWeek): string {
  return `
    <div class="fh-result" id="wrResult">
      <div class="hl-split-title">Week ${w.week} — how it went${w.auto ? " · AUTO" : ""}</div>
      ${
        w.soldOut
          ? `<div class="fh-sellout"><div class="fh-sellout-title">FULL HOUSE</div><div class="fh-sellout-sub">${w.turnout.toLocaleString()} of ${w.capacity.toLocaleString()} seats · every one sold</div>${w.turnedAway > 0 ? `<div class="fh-sellout-turned"><span class="numeric">${w.turnedAway.toLocaleString()}</span><span>could not get in</span></div>` : ""}</div>`
          : ""
      }
      ${wrTransferHtml(w)}
      <div class="hl-give-row net"><span>Cash this week</span><span class="numeric ${w.cashDelta < 0 ? "neg" : ""}" data-wr-kept>${money(w.cashDelta)}</span></div>
      <details class="fa-rules" id="wrSplitBlock" style="margin-top:8px;">
        <summary>Where the money came from, line by line</summary>
        <div class="hl-split" id="wrSplit">
          <div class="hl-split-rows">
            <div class="hl-split-row"><span>Gate at $${w.price} · ${w.turnout.toLocaleString()} in</span><span class="numeric">${money(w.gate)}</span></div>
            <div class="hl-split-row"><span>Spent inside the building</span><span class="numeric">${money(w.inArena)}</span></div>
            <div class="hl-split-row"><span>Local television</span><span class="numeric">${money(w.localMedia)}</span></div>
            <div class="hl-split-row"><span>National check (never taxed)</span><span class="numeric">${money(w.national)}</span></div>
            <div class="hl-split-row"><span>Building bill</span><span class="numeric neg">${money(-w.bill)}</span></div>
            <div class="hl-split-row"><span>Put back into the club (${w.reinvest}%)</span><span class="numeric neg">${money(-w.reinvestSpend)}</span></div>
          </div>
        </div>
      </details>
      <div class="hl-give-note" id="wrRoad">Your Draw put ${money(w.roadDollarsGiven)} on THEIR books, in the building you visited. Your Draw next week: ${w.drawAfter}.</div>
    </div>`;
}

function wrSlateHtml(slate: WRSlateRow[]): string {
  if (slate.length === 0) return "";
  return `
    <div class="hl-slate-block hl-slate-terse" style="margin-top:8px;">
      <div class="eyebrow" style="font-size:11px; margin-bottom:2px;">The three weeks — pairings fixed, every Draw still moving</div>
      <div class="fh-slate">
        ${slate
          .map(
            (r) =>
              `<div class="fh-slate-row${r.open ? " hl-open-week" : ""}"><span>W${r.week}${r.open ? " · now" : r.settled ? " · played" : ""}</span><span>HOST ${escapeHtml(r.hosting.short)} <span class="numeric">${r.hosting.draw}</span></span><span>AT ${escapeHtml(r.visiting.short)} <span class="numeric">${r.visiting.draw}</span></span></div>`,
          )
          .join("")}
      </div>
    </div>`;
}

function wrCardsHtml(cards: WRCard[]): string {
  return cards
    .map(
      (c) => `
      <div class="panel wr-card" style="padding:14px; margin-top:10px;">
        <div class="eyebrow" style="font-size:12px;">${escapeHtml(c.title)}</div>
        <div class="wr-rail"><span>REMEMBER WHEN</span><p>${escapeHtml(c.rails.rememberWhen)}</p></div>
        <div class="wr-rail"><span>OUR CLASS</span><p>${escapeHtml(c.rails.ourClass)}</p></div>
        <div class="wr-rail"><span>IN SPORTS</span><p>${escapeHtml(c.rails.inSports)}</p></div>
        <div class="wr-rail"><span>ECONOMISTS CALL THIS</span><p>${escapeHtml(c.rails.economistsCall)}</p></div>
        <div class="wr-rail"><span>OUTSIDE SPORTS</span><p>${escapeHtml(c.rails.outsideSports)}</p></div>
      </div>`,
    )
    .join("");
}

function renderWriteRule(s: SessionInfo, view: Record<string, unknown>): void {
  const body = $("gameBody");
  if (view["seated"] === false) {
    if (!wrSeatRequested) {
      wrSeatRequested = true;
      outbox?.submit({ type: "takeSeat" });
    }
    // gate-l3-teacher B4: a pair arriving after the league closed used to sit on
    // "finding your club…" forever with a 409 in their console. If the runtime
    // has told us they are an observer, say so and tell them what to do.
    if (view["observer"]) {
      const rule = view["rule"] as WRRule;
      body.innerHTML = `
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">You arrived after the league closed</div>
          <p style="margin:0 0 10px; font-size:16px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
          <p style="margin:0; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["ruleNote"] ?? ""))}</p>
        </div>
        ${rule ? wrRuleStrip(rule) : ""}
        <details class="fa-rules" style="margin-top:12px;" open>
          <summary>How today works</summary>
          <ul>${((view["houseRules"] as string[]) ?? []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </details>`;
      return;
    }
    body.innerHTML = `<div class="banner">You're in — finding your club…</div>`;
    return;
  }
  if (s.phase !== "PLAY") {
    wrMountKey = null;
    document.body.classList.remove("hl-has-lockbar", "fh-compact-play");
  }
  switch (s.phase) {
    case "LOBBY":
      body.innerHTML = `
        ${wrDeskHeader(view)}
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Writing the Rule</div>
          <p style="margin:0 0 10px; font-size:16px; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
          <p style="margin:0 0 8px; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["plainLine"] ?? ""))}</p>
          ${view["identityLine"] ? `<p class="hl-identity">${escapeHtml(String(view["identityLine"]))}</p>` : ""}
        </div>
        <div class="panel" id="wrHowYouGotHere" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">How you got here</div>
          <p style="margin:8px 0 0; font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["seedNote"] ?? ""))}</p>
          ${view["l2Reinvest"] !== undefined ? `<p style="margin:6px 0 0; font-size:13px; color:var(--ink-secondary);">Last lesson you put back an average of <b class="numeric">${Number(view["l2Reinvest"])}%</b> of what came through your door.</p>` : ""}
        </div>
        ${wrBooks(view)}
        <details class="fa-rules" style="margin-top:12px;" open>
          <summary>How today works</summary>
          <ul>${((view["houseRules"] as string[]) ?? []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </details>
        ${wrLeagueTable(view)}
        <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["horizonLine"] ?? ""))}</div>`;
      return;

    case "HOOK": {
      const revealed = Boolean(view["revealed"]);
      const pick = view["pick"];
      const split = view["split"] as { pay: number; breakup: number; undecided: number } | undefined;
      body.innerHTML = `
        ${wrDeskHeader(view)}
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Boston, June 2025</div>
          <p style="margin:0; font-size:15px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
        </div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">${escapeHtml(String(view["question"] ?? ""))}</div>
          <div class="wr-choice">
            <button type="button" class="btn ${pick === "pay" ? "btn-primary" : ""}" id="wrHookPay" ${revealed ? "disabled" : ""}>PAY IT</button>
            <button type="button" class="btn ${pick === "breakup" ? "btn-primary" : ""}" id="wrHookBreak" ${revealed ? "disabled" : ""}>BREAK IT UP</button>
          </div>
          ${pick ? `<div class="hl-give-note">Locked: ${pick === "pay" ? "pay it" : "break it up"}. Nobody is scored on this.</div>` : ""}
        </div>
        ${
          revealed
            ? `<div class="panel" id="wrHookReveal" style="padding:16px; margin-top:12px;">
                 <div class="eyebrow" style="font-size:12px;">What happened</div>
                 <p style="margin:8px 0 0; font-size:14px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["revealCopy"] ?? ""))}</p>
                 ${split ? `<div class="hl-give-note">This room: ${split.pay} pay it · ${split.breakup} break it up.</div>` : ""}
               </div>`
            : ""
        }`;
      if (!revealed) {
        const send = (choice: string) => outbox?.submit({ type: "hookPick", choice });
        document.getElementById("wrHookPay")?.addEventListener("click", () => send("pay"));
        document.getElementById("wrHookBreak")?.addEventListener("click", () => send("breakup"));
      }
      return;
    }

    case "PLAY":
      renderWRPlay(view);
      return;

    case "REVEAL": {
      // gate-l3-play repair 3: the desk was byte-identical across all five
      // reveal stages. It now carries THIS club's own number for the beat that
      // is up, plus a one-tap prediction before the arrows land.
      const weeks = (view["weeks"] as WRWeek[]) ?? [];
      const stageNo = Number(view["revealStage"] ?? 0);
      const myLens = view["myLens"] as WRLens | null;
      const predictOpen = Boolean(view["predictOpen"]);
      const prediction = view["prediction"] as string | null;
      const resolved = view["predictionResolved"] as { actual: string; right: boolean } | null;
      const key = `reveal|${stageNo}|${prediction ?? "none"}|${resolved ? String(resolved.right) : "no"}`;
      if (wrMountKey === key && document.getElementById("wrLens")) return;
      wrMountKey = key;
      body.innerHTML = `
        ${wrDeskHeader(view)}
        ${wrRuleStrip(view["rule"] as WRRule)}
        <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
        <div class="panel" id="wrLens" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Beat ${stageNo || "—"} of ${Number(view["revealSteps"] ?? 5)} — your club</div>
          ${
            myLens
              ? `<div class="hl-give-row"><span>${escapeHtml(myLens.label)}</span><span class="numeric" id="wrLensValue">${escapeHtml(myLens.value)}</span></div>`
              : `<p style="margin:8px 0 0; font-size:14px; color:var(--ink-secondary);">Your teacher has not put up the first beat yet. When they do, your club's own number for it lands here.</p>`
          }
          ${
            predictOpen
              ? `<div style="margin-top:10px;">
                   <div class="eyebrow" style="font-size:12px;">${escapeHtml(String(view["predictPrompt"] ?? ""))}</div>
                   <div class="wr-choice">
                     <button type="button" class="btn" id="wrPredictMoved">IT MOVED</button>
                     <button type="button" class="btn" id="wrPredictFlat">IT DID NOT MOVE</button>
                   </div>
                 </div>`
              : ""
          }
          ${prediction && !resolved ? `<div class="hl-give-note" id="wrPredictLocked">You said your best price ${prediction === "moved" ? "moved" : "did not move"}. The arrows are next.</div>` : ""}
          ${
            resolved
              ? `<div class="hl-give-note" id="wrPredictResult">You said ${prediction === "moved" ? "it moved" : "it did not move"}. It ${resolved.actual === "moved" ? "moved" : "did not move"}. ${resolved.right ? "You called it." : "Not what you expected — that is the thing to ask about."}</div>`
              : ""
          }
          ${view["arrowWhy"] ? `<div class="hl-give-note" id="wrArrowWhy">${escapeHtml(String(view["arrowWhy"]))}</div>` : ""}
          ${view["transferSeasonLine"] ? `<div class="hl-give-note" id="wrSeasonTransfer">${escapeHtml(String(view["transferSeasonLine"]))}</div>` : ""}
        </div>
        ${weeks.map((w) => wrWeekResult(w)).join("")}`;
      if (predictOpen) {
        const send = (choice: string) => outbox?.submit({ type: "arrowPredict", choice });
        document.getElementById("wrPredictMoved")?.addEventListener("click", () => send("moved"));
        document.getElementById("wrPredictFlat")?.addEventListener("click", () => send("flat"));
      }
      return;
    }

    case "CONSEQUENCE": {
      const weeks = (view["weeks"] as WRWeek[]) ?? [];
      body.innerHTML = `
        ${wrDeskHeader(view)}
        ${wrRuleStrip(view["rule"] as WRRule)}
        <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Talk with your partner</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["question"] ?? ""))}</p>
          ${view["transferSeasonLine"] ? `<div class="hl-give-note" id="wrSeasonTransfer">${escapeHtml(String(view["transferSeasonLine"]))}</div>` : ""}
        </div>
        ${weeks.map((w) => wrWeekResult(w)).join("")}`;
      return;
    }

    case "COUNTERFACTUAL":
      body.innerHTML = `
        ${wrDeskHeader(view)}
        ${wrRuleStrip(view["rule"] as WRRule)}
        <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
        ${((view["weeks"] as WRWeek[]) ?? []).map((w) => wrWeekResult(w)).join("")}`;
      return;

    case "ARGUE": {
      const revealed = Boolean(view["revealed"]);
      const splitShown = Boolean(view["splitShown"]);
      const closed = revealed || splitShown;
      const vote = view["vote"];
      const split = view["split"] as { deny: number; approve: number; undecided: number } | undefined;
      const sheets = (view["termSheets"] as WRTermSheet[]) ?? [];
      body.innerHTML = `
        ${wrDeskHeader(view)}
        <div class="panel" style="padding:18px;">
          <div class="eyebrow" style="font-size:12px; margin-bottom:8px;">Sacramento, 2013 — the Board of Governors</div>
          <p style="margin:0; font-size:15px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["message"] ?? ""))}</p>
        </div>
        <div id="wrTermSheets">
          ${sheets
            .map(
              (s) => `
            <div class="panel wr-term" data-wr-term style="padding:14px; margin-top:10px;">
              <div class="eyebrow" style="font-size:12px;">${escapeHtml(s.city)}</div>
              <div class="fh-price-readout numeric" style="font-size:26px;">${escapeHtml(s.headline)}</div>
              <ul style="margin:6px 0 0; padding-left:18px;">${s.lines.map((l) => `<li style="font-size:13.5px; line-height:1.45; color:var(--ink-primary);">${escapeHtml(l)}</li>`).join("")}</ul>
            </div>`,
            )
            .join("")}
          <div class="hl-give-note">${escapeHtml(String(view["termSheetNote"] ?? ""))}</div>
        </div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">${escapeHtml(String(view["prompt"] ?? ""))}</div>
          <div class="wr-choice">
            <button type="button" class="btn ${vote === "deny" ? "btn-primary" : ""}" id="wrKingsDeny" ${closed ? "disabled" : ""}>DENY — KEEP IT IN SACRAMENTO</button>
            <button type="button" class="btn ${vote === "approve" ? "btn-primary" : ""}" id="wrKingsApprove" ${closed ? "disabled" : ""}>APPROVE — LET IT MOVE TO SEATTLE</button>
          </div>
          ${vote ? `<div class="hl-give-note">Locked: ${vote === "deny" ? "deny" : "approve"}. There is no score.</div>` : ""}
        </div>
        ${
          splitShown && !revealed
            ? `<div class="panel" id="wrKingsRoomSplit" style="padding:16px; margin-top:12px;">
                 <div class="eyebrow" style="font-size:12px;">This room</div>
                 <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${split ? `${split.deny} deny · ${split.approve} approve` : ""}. Nobody has seen what the owners did.</p>
               </div>`
            : ""
        }
        ${
          revealed
            ? `<div class="panel" id="wrKingsReveal" style="padding:16px; margin-top:12px;">
                 <div class="eyebrow" style="font-size:12px;">The vote</div>
                 <p style="margin:8px 0 0; font-size:14px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["revealCopy"] ?? ""))}</p>
                 ${split ? `<div class="hl-give-note">This room: ${split.deny} deny · ${split.approve} approve.</div>` : ""}
               </div>`
            : ""
        }`;
      if (!closed) {
        const send = (choice: string) => outbox?.submit({ type: "kingsVote", choice });
        document.getElementById("wrKingsDeny")?.addEventListener("click", () => send("deny"));
        document.getElementById("wrKingsApprove")?.addEventListener("click", () => send("approve"));
      }
      return;
    }

    case "SYNTHESIS":
      body.innerHTML = `
        ${wrDeskHeader(view)}
        ${wrRuleStrip(view["rule"] as WRRule)}
        <div class="banner" style="margin-top:12px;">${escapeHtml(String(view["message"] ?? ""))}</div>
        <div class="panel" style="padding:16px; margin-top:12px;">
          <div class="eyebrow" style="font-size:12px;">Talk with your partner</div>
          <p style="margin:8px 0 0; font-size:15px; color:var(--ink-primary);">${escapeHtml(String(view["exitPrompt"] ?? ""))}</p>
        </div>
        <div id="wrFinale">${wrCardsHtml((view["cards"] as WRCard[]) ?? [])}</div>
        <details class="fa-rules" style="margin-top:12px;">
          <summary>What this lesson simplified, and what it risks</summary>
          <ul>${((view["simplifications"] as { what: string; why: string; risk: string }[]) ?? [])
            .map((x) => `<li><b>${escapeHtml(x.what)}</b><br>${escapeHtml(x.why)}<br><i>Risk: ${escapeHtml(x.risk)}</i></li>`)
            .join("")}</ul>
        </details>
        <details class="fa-rules" style="margin-top:8px;">
          <summary>Where the real numbers came from</summary>
          <ul>${((view["sources"] as string[]) ?? []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </details>`;
      return;

    case "COMPLETE": {
      const rule = view["rule"] as WRRule;
      body.innerHTML = `
        ${wrDeskHeader(view)}
        <div class="banner">${escapeHtml(String(view["message"] ?? ""))}</div>
        ${rule ? `<div class="panel" style="padding:16px; margin-top:12px;"><div class="eyebrow" style="font-size:12px;">${escapeHtml(String(view["ruleTitle"] ?? "Your rule"))}</div><p style="margin:8px 0 0; font-size:16px; color:var(--ink-primary);">SHARE ${rule.share}% · CONDITION ${rule.condition ? "ON" : "OFF"}</p></div>` : ""}`;
      return;
    }

    default:
      body.innerHTML = `<pre class="banner" style="text-align:left; white-space:pre-wrap;">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`;
  }
}

function renderWRPlay(view: Record<string, unknown>): void {
  const mode = String(view["mode"] ?? "");
  if (mode === "rounds") {
    renderWRRounds(view);
    return;
  }
  if (mode === "adopted") {
    wrMountKey = null;
    document.body.classList.remove("hl-has-lockbar", "fh-compact-play");
    $("gameBody").innerHTML = `
      ${wrDeskHeader(view)}
      ${wrRuleStrip(view["rule"] as WRRule)}
      <div class="panel" id="wrAdopted" style="padding:18px; margin-top:12px;">
        <div class="eyebrow" style="font-size:12px;">The rule</div>
        <p style="margin:8px 0 0; font-size:16px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["adoption"] ?? ""))}</p>
        <p style="margin:10px 0 0; font-size:14px; color:var(--ink-secondary);">${escapeHtml(String(view["seasonCopy"] ?? ""))}</p>
      </div>
      ${wrBooks(view)}`;
    return;
  }
  renderWRSeason(view);
}

function renderWRRounds(view: Record<string, unknown>): void {
  document.body.classList.remove("fh-compact-play");
  const round = Number(view["round"] ?? 1);
  const proposal = view["proposal"] as { share: number; condition: boolean } | null;
  const grid = (view["shareGrid"] as number[]) ?? [0, 5, 10];
  const sealed = Boolean(view["sealed"]);
  const key = `rounds|${round}|${proposal ? `${proposal.share}|${proposal.condition}` : "none"}|${Boolean(view["histogramHeld"])}|${sealed}`;
  if (wrMountKey === key && document.getElementById("wrRoundsRoot")) return;
  wrMountKey = key;
  hidePin();
  if (wrLocalShare === null) wrLocalShare = proposal?.share ?? 20;
  if (wrLocalCondition === null) wrLocalCondition = proposal?.condition ?? false;
  const share = wrLocalShare;
  const condition = wrLocalCondition;

  $("gameBody").innerHTML = `
    <div id="wrRoundsRoot" class="hl-decide">
      <div class="hl-span">${wrDeskHeader(view)}</div>
      <div class="hl-col-context">
        <div class="panel" id="wrVeil" style="padding:14px;">
          <div class="eyebrow" style="font-size:12px;">Before you write anything</div>
          <p style="margin:8px 0 0; font-size:14px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["veil"] ?? ""))}</p>
        </div>
        <div class="panel" style="padding:14px; margin-top:10px;">
          <div class="eyebrow" style="font-size:12px;">Your club, while you vote</div>
          <div class="fh-market-facts">
            <div><span>${escapeHtml(String(view["club"] ?? ""))}</span><span>${escapeHtml(String(view["sizeLabel"] ?? ""))}</span></div>
            <div><span>Seats</span><span class="numeric">${Number(view["capacity"] ?? 0).toLocaleString()}</span></div>
            <div><span>Bill, every week</span><span class="numeric">${money(Number(view["bill"] ?? 0))}</span></div>
            <div><span>Your Draw</span><span class="numeric">${Number(view["draw"] ?? 0)}</span></div>
            <div><span>Cash</span><span class="numeric">${money(Number(view["cash"] ?? 0))}</span></div>
          </div>
          <div class="hl-give-note">${escapeHtml(String(view["plainLine"] ?? ""))}</div>
        </div>
        ${
          !sealed && view["abstainNote"]
            ? `<div class="panel" id="wrAbstain" style="padding:12px; margin-top:10px;">
                 <div class="eyebrow" style="font-size:12px;">You have not put a number in</div>
                 <div class="hl-give-note">${escapeHtml(String(view["abstainNote"]))}</div>
               </div>`
            : ""
        }
        ${wrHistogramHtml(view["histogram"] as WRHistogram | null, Boolean(view["histogramHeld"]), "Round 1 is blind on purpose. Everybody's numbers go up here once this round closes.", Number(view["band"] ?? 10))}
      </div>
      <div class="hl-col-decide" id="wrDecisionBand">
        <div class="hl-week-card">
          <div class="hl-week-top">
            <span class="hl-week-num">Round ${round} of ${view["roundCount"]}</span>
            <span class="hl-week-cap">${escapeHtml(String(view["sizeLabel"] ?? ""))}</span>
          </div>
          <div class="hl-give-note">${escapeHtml(String(view["ruleCopy"] ?? ""))}</div>
        </div>
        ${
          sealed
            ? `<div class="panel" id="wrSealed" style="padding:14px; margin-top:10px; border-color: rgba(244,185,66,0.5);">
                 <div class="eyebrow" style="font-size:12px;">THE VOTE IS SEALED</div>
                 <p style="margin:8px 0 0; font-size:14px; line-height:1.5; color:var(--ink-primary);">${escapeHtml(String(view["sealedNote"] ?? ""))}</p>
               </div>`
            : ""
        }
        <div class="panel fh-dials" style="padding:14px; margin-top:10px;">
          <div class="eyebrow" style="font-size:12px;">SHARE — how much of every club's local money goes into the pot</div>
          <div class="fh-price-readout numeric" id="wrShareReadout">${share}%</div>
          <div class="fh-dial">
            <input class="price-dial-input" type="range" id="wrShareDial" min="${grid[0]}" max="${grid[grid.length - 1]}" step="5" value="${share}" ${sealed ? "disabled" : ""} />
          </div>
          <div class="price-dial-ends"><span>${grid[0]}%</span><span>${grid[grid.length - 1]}%</span></div>

          <div class="eyebrow" style="font-size:12px; margin-top:12px;">CONDITION</div>
          <div class="fh-spend-row">
            <button type="button" class="btn ${condition ? "btn-primary" : ""}" id="wrCondition" aria-pressed="${condition}" ${sealed ? "disabled" : ""}>${condition ? "ON" : "OFF"}</button>
            <span class="fh-lag">A club must put at least ${view["conditionMin"]}% back into its own product to collect its full share.</span>
          </div>
          <div class="fh-blind-note">No preview. Nothing on this screen tells you what a share will be worth to you.</div>
        </div>
        <div class="panel" style="padding:12px; margin-top:10px;">
          <div class="hl-give-note">${escapeHtml(String(view["adoptCopy"] ?? ""))}</div>
        </div>
      </div>
    </div>
    <div class="hl-lockbar" id="wrLockBar">
      <span class="hl-lockbar-vals" id="wrProposeVals">${sealed ? "Sealed — the two-thirds test runs on the numbers that were in" : `Round ${round} · <b id="wrProposeShare">${share}%</b> · condition <b id="wrProposeCond">${condition ? "ON" : "OFF"}</b>`}</span>
      <button class="btn btn-primary" id="wrPropose" disabled data-wr-armed="${sealed ? "1" : "0"}">${sealed ? "VOTE SEALED" : "PUT IT IN"}</button>
    </div>`;
  document.body.classList.add("hl-has-lockbar");
  const bar = document.getElementById("wrLockBar");
  if (bar) document.body.style.setProperty("--hl-lockbar-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);

  const dial = $<HTMLInputElement>("wrShareDial");
  const readout = $("wrShareReadout");
  const condBtn = $<HTMLButtonElement>("wrCondition");
  const submit = $<HTMLButtonElement>("wrPropose");
  const barShare = document.getElementById("wrProposeShare");
  const barCond = document.getElementById("wrProposeCond");
  const vals = document.getElementById("wrProposeVals");
  const valsHtml = vals?.innerHTML ?? "";
  // THE SEALED ROUND. Every control on this screen is dead once round 3 has
  // closed, and the bar says why. The reducer refuses a late `propose` too — the
  // seal is enforced in the model, not only in the UI (gate-l3-play, probe D).
  if (sealed) {
    submit.disabled = true;
    dial.disabled = true;
    condBtn.disabled = true;
    return;
  }
  if (vals) vals.textContent = "Read both controls before you put a number in";

  // The same arming guard L2 ships: the commit control may never be the only
  // live thing in the visible band, and it may never commit a default the pair
  // has not been shown.
  const seen = new Set<string>();
  const arm = (): void => {
    if (submit.dataset["wrArmed"] === "1") return;
    submit.dataset["wrArmed"] = "1";
    submit.disabled = false;
    if (vals) vals.innerHTML = valsHtml;
  };
  const targets = [dial, condBtn];
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) seen.add(e.target.id);
        if (seen.size === targets.length) {
          arm();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    for (const t of targets) io.observe(t);
  } else {
    arm();
  }
  for (const t of targets) {
    t.addEventListener("pointerdown", arm);
    t.addEventListener("focus", arm);
    t.addEventListener("input", arm);
  }

  dial.addEventListener("input", () => {
    wrLocalShare = Number(dial.value);
    readout.textContent = `${dial.value}%`;
    if (barShare) barShare.textContent = `${dial.value}%`;
  });
  condBtn.addEventListener("click", () => {
    wrLocalCondition = !wrLocalCondition;
    condBtn.textContent = wrLocalCondition ? "ON" : "OFF";
    condBtn.setAttribute("aria-pressed", String(wrLocalCondition));
    condBtn.classList.toggle("btn-primary", wrLocalCondition);
    if (barCond) barCond.textContent = wrLocalCondition ? "ON" : "OFF";
    arm();
  });
  submit.addEventListener("click", () => {
    outbox?.submit({ type: "propose", share: Number(dial.value), condition: Boolean(wrLocalCondition) });
    submit.textContent = "IN";
  });
}

function renderWRSeason(view: Record<string, unknown>): void {
  const body = $("gameBody");
  const done = Boolean(view["done"]);
  document.body.classList.toggle("fh-compact-play", !done);
  const weeks = (view["weeks"] as WRWeek[]) ?? [];
  if (done) {
    wrMountKey = null;
    document.body.classList.remove("hl-has-lockbar");
    body.innerHTML = `
      ${wrDeskHeader(view)}
      ${wrRuleStrip(view["rule"] as WRRule)}
      ${wrBooks(view)}
      <div class="banner" style="margin-top:12px;">Three weeks in the books. Look up at the board.</div>
      ${weeks.map((w) => wrWeekResult(w)).join("")}`;
    return;
  }

  const weekNumber = Number(view["weekNumber"] ?? 1);
  const locked = Boolean(view["locked"]);
  const last = weeks.length > 0 ? weeks[weeks.length - 1]! : null;
  const justSettled = last !== null && last.week === weekNumber - 1;
  const rookie = view["rookie"] as { club: string; mine: boolean; copy: string } | undefined;
  const visitor = view["visitor"] as { short: string; draw: number; deskNumber: number; live: boolean };
  hidePin();

  const key = `season|${weekNumber}|${locked}|${weeks.length}`;
  if (wrMountKey === key && document.getElementById("wrPlayRoot")) return;
  wrMountKey = key;
  if (wrLocalPrice === null || !locked) wrLocalPrice = Number(view["price"] ?? 46);
  const price = locked ? Number(view["price"]) : wrLocalPrice;
  const reinvest = Number(view["reinvest"] ?? 0);

  const dialsHtml = locked
    ? `<div class="banner" style="margin-top:12px;">Locked in. Waiting for the rest of the league.</div>
       <div class="fh-locked-recap"><span>Locked at</span><span class="numeric">$${price}</span><span>· ${reinvest}% back into the club</span></div>`
    : `
      <div class="panel fh-dials" style="padding:14px; margin-top:10px;">
        <div class="eyebrow" style="font-size:12px;">Price of a seat</div>
        <div class="fh-price-readout numeric" id="wrPriceReadout">$${price}</div>
        <div class="fh-dial">
          <input class="price-dial-input" type="range" id="wrPriceDial" min="${view["priceMin"]}" max="${view["priceMax"]}" step="${view["priceStep"]}" value="${price}" />
        </div>
        <div class="price-dial-ends"><span>$${view["priceMin"]}</span><span>$${view["priceMax"]}</span></div>

        <div class="eyebrow" style="font-size:12px; margin-top:12px;">Put back into the club <span class="fh-lag">arrives next week</span></div>
        <div class="fh-spend-row">
          <div class="bid-stepper">
            <button type="button" class="btn" id="wrReinvestDown">−</button>
            <span class="bid-stepper-readout" id="wrReinvestReadout">${reinvest}%</span>
            <button type="button" class="btn" id="wrReinvestUp">+</button>
          </div>
          <span class="fh-lag">of what comes through your door this week</span>
        </div>
        <div class="fh-blind-note">${escapeHtml(String(view["noPreview"] ?? ""))}</div>
      </div>`;

  body.innerHTML = `
    <div id="wrPlayRoot" class="hl-decide">
      <div class="hl-span">${wrRuleStrip(view["rule"] as WRRule)}</div>
      <div class="hl-col-context">
        ${justSettled ? `<div class="hl-bell-head" id="wrBellHead">THE WEEK IS IN THE BOOKS</div>` : ""}
        ${last ? wrWeekResult(last) : ""}
        ${
          rookie
            ? `<details class="fa-rules" id="wrRookieNote" style="margin-top:10px;"><summary>How the rookie was decided — and how the real league does it</summary><p style="margin:6px 0 0; font-size:12.5px; line-height:1.45; color:var(--ink-secondary);">${escapeHtml(rookie.copy)}</p></details>`
            : ""
        }
      </div>
      <div class="hl-col-decide" id="wrDecisionBand">
        <div class="hl-week-card" id="wrWeekCard">
          <div class="hl-week-top">
            <span class="hl-week-num">Week ${weekNumber} of ${view["weekCount"]}</span>
            <span class="hl-week-cap">${Number(view["capacity"] ?? 0).toLocaleString()} seats</span>
          </div>
          <div class="hl-matchup">
            <div class="hl-matchup-side host">
              <span class="hl-matchup-label">Visiting you</span>
              <span class="hl-matchup-club">${escapeHtml(visitor?.short ?? "")}</span>
              <span class="hl-matchup-who">${visitor?.live ? `Desk ${visitor.deskNumber}` : "league office"}</span>
              <span class="hl-matchup-draw"><span class="numeric">Draw ${visitor?.draw ?? 0}</span></span>
            </div>
          </div>
          ${
            rookie
              ? `<div class="hl-shock ${rookie.mine ? "mine" : ""}" id="wrRookie">${escapeHtml(
                  rookie.mine ? `THE ROOKIE LANDED HERE — ${rookie.club}. Draw 100 for the rest of the season.` : `The rookie landed at ${rookie.club} — Draw 100 for the rest of the season.`,
                )}</div>`
              : ""
          }
        </div>
        ${wrSlateHtml((view["slate"] as WRSlateRow[]) ?? [])}
        ${dialsHtml}
      </div>
    </div>
    ${
      locked
        ? ""
        : `<div class="hl-lockbar" id="wrLockBar">
             <span class="hl-lockbar-vals" id="wrLockVals">Week ${weekNumber} · <b id="wrLockPrice">$${price}</b> · <b id="wrLockReinvest">${reinvest}%</b> back in</span>
             <button class="btn btn-primary" id="wrLock" disabled data-wr-armed="0">LOCK IT IN</button>
           </div>`
    }`;
  document.body.classList.toggle("hl-has-lockbar", !locked);
  const lockBar = document.getElementById("wrLockBar");
  if (lockBar) document.body.style.setProperty("--hl-lockbar-h", `${Math.ceil(lockBar.getBoundingClientRect().height)}px`);
  else document.body.style.removeProperty("--hl-lockbar-h");

  if (justSettled && wrLastSettledSeen !== `${weekNumber}|${weeks.length}`) {
    wrLastSettledSeen = `${weekNumber}|${weeks.length}`;
    window.scrollTo({ top: 0, behavior: "auto" });
    const scroller = document.querySelector("main");
    if (scroller) scroller.scrollTop = 0;
  }
  if (locked) return;

  const dial = $<HTMLInputElement>("wrPriceDial");
  const readout = $("wrPriceReadout");
  const lockPrice = document.getElementById("wrLockPrice");
  const lockReinvest = document.getElementById("wrLockReinvest");
  const lockBtn = document.getElementById("wrLock") as HTMLButtonElement | null;
  const lockVals = document.getElementById("wrLockVals");
  const lockValsHtml = lockVals?.innerHTML ?? "";
  const seenDials = new Set<string>();
  const armLock = (): void => {
    if (!lockBtn || lockBtn.dataset["wrArmed"] === "1") return;
    lockBtn.dataset["wrArmed"] = "1";
    lockBtn.disabled = false;
    if (lockVals) lockVals.innerHTML = lockValsHtml;
  };
  if (lockBtn) {
    if (lockVals) lockVals.textContent = "Read the two dials before you commit";
    const targets = [document.getElementById("wrPriceDial"), document.getElementById("wrReinvestUp"), document.getElementById("wrReinvestDown")].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (typeof IntersectionObserver === "function" && targets.length === 3) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) seenDials.add(e.target.id);
          if (seenDials.size === targets.length) {
            armLock();
            io.disconnect();
          }
        },
        { threshold: 0.6 },
      );
      for (const t of targets) io.observe(t);
    } else {
      armLock();
    }
    for (const t of targets) {
      t.addEventListener("pointerdown", armLock);
      t.addEventListener("focus", armLock);
      t.addEventListener("input", armLock);
    }
  }
  dial.addEventListener("input", () => {
    wrLocalPrice = Number(dial.value);
    readout.textContent = `$${dial.value}`;
    if (lockPrice) lockPrice.textContent = `$${dial.value}`;
  });
  dial.addEventListener("change", () => outbox?.submit({ type: "setPrice", price: Number(dial.value) }));

  let localReinvest = reinvest;
  const rReadout = $("wrReinvestReadout");
  const rUp = $<HTMLButtonElement>("wrReinvestUp");
  const rDown = $<HTMLButtonElement>("wrReinvestDown");
  const rMin = Number(view["reinvestMin"] ?? 0);
  const rMax = Number(view["reinvestMax"] ?? 40);
  const syncR = () => {
    rUp.disabled = localReinvest >= rMax;
    rDown.disabled = localReinvest <= rMin;
  };
  const stepR = (dir: number) => {
    const step = Number(view["reinvestStep"] ?? 5);
    const next = Math.max(rMin, Math.min(rMax, localReinvest + dir * step));
    if (next === localReinvest) return;
    localReinvest = next;
    rReadout.textContent = `${localReinvest}%`;
    if (lockReinvest) lockReinvest.textContent = `${localReinvest}%`;
    syncR();
    outbox?.submit({ type: "setReinvest", reinvest: localReinvest });
  };
  syncR();
  rUp.addEventListener("click", () => stepR(1));
  rDown.addEventListener("click", () => stepR(-1));
  lockBtn?.addEventListener("click", () => {
    outbox?.submit({ type: "lock" });
    lockBtn.disabled = true;
  });
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
