import { ApiError, apiFetch } from "../shared/api.js";
import { ActionOutbox } from "../shared/outbox.js";
import { startPolling } from "../shared/poll.js";
import { clearPlayCredentials, loadPlayCredentials, savePlayCredentials, type PlayCredentials } from "../shared/storage.js";

type StudentPayload = {
  session: { code: string; title: string; phase: string; paused: boolean; frozen: boolean; ended: boolean; version: number };
  seat: { id: string; displayName: string };
  deviceToken?: string;
  rejoinPin?: string;
  view: { phase: string; myPick: string | null; colors: string[] };
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

function describe(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
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

function renderGame(payload: StudentPayload): void {
  const s = payload.session;
  $("gameHeader").textContent = `${s.title || "Session"} · seated as ${payload.seat.displayName}`;
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
  if (s.phase === "LOBBY") {
    body.innerHTML = `<div class="banner">You're in! Waiting for your teacher to start.</div>`;
    return;
  }
  if (s.phase === "PLAY" && Array.isArray(view.colors)) {
    body.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "colors";
    for (const color of view.colors) {
      const swatch = document.createElement("div");
      swatch.className = `swatch ${color}${view.myPick === color ? " selected" : ""}`;
      swatch.title = color;
      swatch.addEventListener("click", () => {
        outbox?.submit({ type: "pick", color });
        // optimistic local echo — the next poll confirms it
        view.myPick = color;
        renderGame(payload);
      });
      grid.appendChild(swatch);
    }
    body.appendChild(grid);
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.textContent = view.myPick ? `You picked ${view.myPick}. Tap again to change your mind.` : "Tap a color.";
    body.appendChild(hint);
    return;
  }
  if (s.phase === "REVEAL" || s.phase === "SYNTHESIS") {
    body.innerHTML = `<div class="banner">Look up at the board!</div>`;
    return;
  }
  body.innerHTML = `<pre class="muted" style="white-space:pre-wrap;">${JSON.stringify(view, null, 2)}</pre>`;
}

// ---- boot ----
if (creds) {
  joinCard.hidden = true;
  gameCard.hidden = false;
  startGame();
}
