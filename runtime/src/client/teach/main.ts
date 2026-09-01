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
const directorEl = $("director");

let currentCode: string | null = null;
// B1 repair (VERIFY_L2.md): what the Advance button's confirm() warning needs to know, refreshed every render()
// so the click handler (which fires later, async from render) always checks the latest known state. Extended
// for L3: leaving PLAY early doesn't just skip a staged reveal theater (L2's case) — it permanently ends the
// whole signing window, so days that were never opened simply never happen (charter §6a). Both are "you're
// about to skip real content" warnings, just triggered by different lessons/phases.
type AdvanceWarnState =
  | { kind: "td-reveal"; revealedCount: number; totalTargets: number }
  | { kind: "fa-play"; day: number; windowDays: number; actedCount: number; claimedCount: number }
  // M2 L1's version of the same risk (gate-l1-qa D1/D3, BLOCKING): leaving PLAY
  // ends the whole five-night window at once, and every night nobody has played
  // yet settles on the spot.
  | { kind: "fh-play"; nightNumber: number; nightCount: number; lockedCount: number; deskCount: number }
  | null;
let advanceWarnState: AdvanceWarnState = null;
// R1: the per-session teacher credential — required on every /control and
// GET /teacher call from here on. Held in memory plus localStorage (see
// storage.ts) so a page refresh doesn't strand the teacher outside their
// own room.
let teacherKey: string | null = null;
let poller: { stop: () => void } | null = null;

const TRADE_DEADLINE_ID = "m1l2-trade-deadline";
const DRAFT_DAY_ID = "m1l1-draft-day";
const FREE_AGENCY_ID = "m1l3-free-agency";
const FULL_HOUSE_ID = "m2l1-full-house";

async function loadLessons(): Promise<void> {
  const { lessons } = await apiFetch<{ lessons: Lesson[] }>("/api/lessons");
  const select = $<HTMLSelectElement>("lesson");
  select.innerHTML = "";
  // Draft Day first — this is the module the teacher actually runs class with.
  const ordered = [...lessons].sort((a, b) => (a.id === DRAFT_DAY_ID ? -1 : b.id === DRAFT_DAY_ID ? 1 : 0));
  for (const lesson of ordered) {
    const option = document.createElement("option");
    option.value = lesson.id;
    option.textContent = `${lesson.title} (${lesson.phases.join(" → ")})`;
    select.appendChild(option);
  }
  select.addEventListener("change", () => void syncSourceSessionRow());
  await syncSourceSessionRow();
}

/** L2's linked-creation picker, extended for L3: Trade Deadline lists every Draft Day (L1) session (live or
 *  ended — an ended one is exactly the normal end-of-class state, see sessionService.test.ts's SEED tests);
 *  Free Agency lists BOTH — a completed Trade Deadline (L2, preferred) or a Draft Day (L1, fallback) source,
 *  per the charter's "accepting L2 or L1 sources" (§8) — so the teacher can carry a real class's franchises
 *  forward through however much of the arc that class actually played. */
async function syncSourceSessionRow(): Promise<void> {
  const row = $("sourceSessionRow");
  const label = $("sourceSessionLabel");
  const lessonId = $<HTMLSelectElement>("lesson").value;
  if (lessonId !== TRADE_DEADLINE_ID && lessonId !== FREE_AGENCY_ID) {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  label.textContent =
    lessonId === FREE_AGENCY_ID
      ? "Link to a completed Trade Deadline (L2, preferred) or Draft Day (L1) session — carries franchises into the signing window"
      : "Link to a completed Draft Day (L1) session — carries each locked roster forward";
  const select = $<HTMLSelectElement>("sourceSession");
  select.innerHTML = `<option value="">No link — stock/expansion franchises only</option>`;
  try {
    const { sessions } = await apiFetch<{ sessions: { id: string; code: string; title: string; lessonModuleId: string; phase: string; ended: boolean }[] }>("/api/sessions");
    const eligibleModuleIds = lessonId === FREE_AGENCY_ID ? [TRADE_DEADLINE_ID, DRAFT_DAY_ID] : [DRAFT_DAY_ID];
    const eligible = sessions.filter((s) => eligibleModuleIds.includes(s.lessonModuleId)).sort((a, b) => eligibleModuleIds.indexOf(a.lessonModuleId) - eligibleModuleIds.indexOf(b.lessonModuleId));
    for (const s of eligible) {
      const option = document.createElement("option");
      option.value = s.id;
      const moduleLabel = s.lessonModuleId === TRADE_DEADLINE_ID ? "L2" : "L1";
      option.textContent = `[${moduleLabel}] ${s.title || s.code} (${s.code}) — ${s.ended ? "ended" : `live, ${s.phase}`}`;
      select.appendChild(option);
    }
  } catch {
    /* if the listing fails, the teacher can still create an unlinked session — degrade quietly */
  }
}

async function createSession(): Promise<void> {
  const lessonModuleId = $<HTMLSelectElement>("lesson").value;
  const title = $<HTMLInputElement>("title").value.trim();
  const sourceSessionId = lessonModuleId === TRADE_DEADLINE_ID || lessonModuleId === FREE_AGENCY_ID ? $<HTMLSelectElement>("sourceSession").value || undefined : undefined;
  const payload = await apiFetch<TeacherPayload>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ lessonModuleId, title, sourceSessionId }),
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
  // Re-verification finding (VERIFY_L2.md, against 662f04b): "Jump to REVEAL" while ALREADY in REVEAL is
  // never meaningful — it's not skipping ahead to anything, just re-entering the same phase — so disable it
  // there rather than leave a same-phase click possible at all. (The runtime's own sessionService also now
  // guarantees onPhaseExit never fires on a same-phase transition, independent of this UI guard — see
  // applyPhaseChange — but removing the pointless affordance is the cheaper, clearer fix for a human.)
  $<HTMLButtonElement>("btnReveal").disabled = s.ended || !s.phases.includes("REVEAL") || s.phase === "REVEAL";
  $<HTMLButtonElement>("btnPause").disabled = s.ended;
  $<HTMLButtonElement>("btnPause").textContent = s.paused ? "Unpause" : "Pause";
  $<HTMLButtonElement>("btnFreeze").disabled = s.ended;
  $<HTMLButtonElement>("btnFreeze").textContent = s.frozen ? "Unfreeze" : "Freeze";
  $<HTMLButtonElement>("btnRestore").disabled = !s.hasCheckpoint;
  $<HTMLButtonElement>("btnEnd").disabled = s.ended;
  // The shock is Draft Day's own consequence hook and only ever makes sense in CONSEQUENCE.
  // The Box Office needs neither manual hook — its CONSEQUENCE and COUNTERFACTUAL states are
  // computed automatically from the price/zone already stored at lock time, not teacher-triggered.
  const isDraftDay = s.lessonModuleId === DRAFT_DAY_ID;
  const isTradeDeadline = s.lessonModuleId === TRADE_DEADLINE_ID;
  const isFreeAgency = s.lessonModuleId === FREE_AGENCY_ID;
  const isFullHouse = s.lessonModuleId === FULL_HOUSE_ID;
  $<HTMLButtonElement>("btnShock").hidden = !isDraftDay;
  $<HTMLButtonElement>("btnShock").disabled = s.ended || s.phase !== "CONSEQUENCE";
  $<HTMLButtonElement>("btnCounterfactual").hidden =
    isDraftDay || isTradeDeadline || isFreeAgency || isFullHouse || s.lessonModuleId === "m2-box-office";
  // The staged per-target auction theater (charter point 6, and L3's own staged finale): one click reveals
  // exactly the next not-yet-revealed step, so the teacher paces the reveal instead of dumping every result
  // at once. Same control, same label, works for both lessons' own reveal-staging counters.
  $<HTMLButtonElement>("btnRevealNext").hidden = !isTradeDeadline && !isFreeAgency && !isFullHouse;
  $<HTMLButtonElement>("btnRevealNext").disabled = s.ended || s.phase !== "REVEAL";
  {
    // gate-l1-teacher TT-B2 / gate-l1-projector repair 5: "Reveal next" was a
    // blind press seven times running. Name what the press will put up, with
    // its number, to the same standard as the night bell's label.
    const btn = $<HTMLButtonElement>("btnRevealNext");
    const next = payload.view["nextRevealStage"] as { stage: number; name: string } | null | undefined;
    const total = Number(payload.view["totalRevealSteps"] ?? 0);
    btn.textContent = isFullHouse
      ? next
        ? `Reveal ${next.stage} of ${total} — ${next.name}`
        : "Every reveal has played"
      : "Reveal next";
  }
  // M2 L1's own pacing controls: the night bell (every desk settles at once against the card that
  // was printed before anyone touched a dial) and the manual Two Peaks release. Both are teacher-
  // triggered, never timed; leaving PLAY fires both automatically so nothing can be stranded.
  {
    const closeNight = $<HTMLButtonElement>("btnCloseNight");
    const twoPeaks = $<HTMLButtonElement>("btnTwoPeaks");
    closeNight.hidden = !isFullHouse;
    twoPeaks.hidden = !isFullHouse;
    if (isFullHouse) {
      const allDone = Boolean(payload.view["allNightsDone"]);
      closeNight.disabled = s.ended || s.phase !== "PLAY" || allDone;
      // gate-l1-visual P8: the emoji bell was reported repaired and was not. A
      // drawn 16px glyph in the ink palette carries the same meaning in the
      // Cap Room register. `escapeHtml` guards the interpolated counts.
      closeNight.innerHTML = allDone
        ? `${BELL_GLYPH}All five nights are in the books`
        : `${BELL_GLYPH}Open the doors — Night ${escapeHtml(String(payload.view["nightNumber"]))} (${escapeHtml(String(payload.view["lockedCount"]))}/${escapeHtml(String(payload.view["deskCount"]))} locked)`;
      twoPeaks.disabled = s.ended || !payload.view["twoPeaksAvailable"] || (s.phase !== "PLAY" && s.phase !== "REVEAL");
      // TT-B5: the button used to become silently enabled after the Night 3 bell
      // with no reason on it while disabled, and a `held`/`up` tile in undefined
      // vocabulary beside it.
      twoPeaks.textContent = payload.view["twoPeaksReleased"] ? "Two Peaks is on the projector" : "Release the Two Peaks";
      twoPeaks.title = String(payload.view["twoPeaksReason"] ?? "");
      // TT-B6: say on the bell what ringing it does to a desk that never locked.
      closeNight.title = String(payload.view["bellNote"] ?? "");
    }
  }
  // `gate-l1-play` recheck3 P11-b: the COUNTERFACTUAL repeat card is paged so
  // every row stays fully on the projector at class size. The teacher walks the
  // groups; the control names what the next press will put up, to the same
  // standard as the reveal button and the bell.
  {
    const cfPage = $<HTMLButtonElement>("btnCfPage");
    cfPage.hidden = !isFullHouse || s.phase !== "COUNTERFACTUAL";
    if (isFullHouse) {
      const available = Boolean(payload.view["cfPageAvailable"]);
      cfPage.disabled = s.ended || !available;
      cfPage.textContent = String(payload.view["cfNextPageLabel"] ?? "Next group of desks");
      cfPage.title = String(payload.view["cfPageNote"] ?? "");
    }
  }
  // L3's own market day-close hook (charter §2): resolves every still-open agent for the currently open day,
  // simultaneously and deterministically, then advances the day counter. A close with zero offers is legal.
  $<HTMLButtonElement>("btnCloseDay").hidden = !isFreeAgency;
  $<HTMLButtonElement>("btnCloseDay").disabled = s.ended || s.phase !== "PLAY" || Boolean(payload.view["windowClosed"]);
  {
    const pendingCount = Number(payload.view["pendingCount"] ?? 0);
    const actedCount = Number(payload.view["actedCount"] ?? 0);
    const claimedCount = Number(payload.view["claimedCount"] ?? 0);
    $<HTMLButtonElement>("btnCloseDay").innerHTML = isFreeAgency
      ? `${BELL_GLYPH}Close signing day (${actedCount}/${claimedCount} acted, ${pendingCount} offer${pendingCount === 1 ? "" : "s"} in)`
      : `${BELL_GLYPH}Close signing day`;
  }
  // B1 repair (VERIFY_L2.md BLOCKER): the runtime now auto-resolves any unrevealed target the instant the
  // teacher advances out of REVEAL (see tradeDeadline.ts's onPhaseExit), so the numbers can no longer go wrong
  // — but the staged, one-at-a-time reveal theater is still lost on whatever's skipped, so warn before that
  // happens rather than let it happen silently. L3's own risk is sharper: leaving PLAY early doesn't just
  // skip theater, it PERMANENTLY ends the signing window (charter §6a) — days that were never opened never
  // happen, so this warns whenever a real day is still open, regardless of who has or hasn't acted yet.
  if (isTradeDeadline) {
    advanceWarnState = { kind: "td-reveal", revealedCount: Number(payload.view["revealedCount"] ?? 0), totalTargets: Number(payload.view["totalTargets"] ?? 0) };
  } else if (isFullHouse && s.phase === "PLAY" && !Boolean(payload.view["allNightsDone"])) {
    advanceWarnState = {
      kind: "fh-play",
      nightNumber: Number(payload.view["nightNumber"] ?? 1),
      nightCount: Number(payload.view["nightCount"] ?? 5),
      lockedCount: Number(payload.view["lockedCount"] ?? 0),
      deskCount: Number(payload.view["deskCount"] ?? 0),
    };
  } else if (isFreeAgency && s.phase === "PLAY" && !Boolean(payload.view["windowClosed"])) {
    advanceWarnState = {
      kind: "fa-play",
      day: Number(payload.view["day"] ?? 1),
      windowDays: Number(payload.view["windowDays"] ?? 4),
      actedCount: Number(payload.view["actedCount"] ?? 0),
      claimedCount: Number(payload.view["claimedCount"] ?? 0),
    };
  } else {
    advanceWarnState = null;
  }

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

  // TT-B1/B2/B3: the director layer, only for the lesson that ships one.
  if (payload.view["module"] === FULL_HOUSE_ID) {
    directorEl.hidden = false;
    $("directorHeading").textContent = `Directing ${s.phase}`;
    $("directorBody").innerHTML = "";
    $("directorBody").appendChild(renderDirector(payload.view, s.phase));
  } else {
    directorEl.hidden = true;
  }
}

/* ------------------------------------------------------ full house director -- */

type FHDirector = {
  phase: string;
  minuteBudget: string;
  now: string[];
  ask: { q: string; answer: string | null }[];
  dontExplainYet: string[];
  trigger: string | null;
  timeCut: string;
};
type FHRevealStage = { stage: number; name: string; headline: string; say: string };
type FHWatchFlag = { id: string; label: string; desks: string[]; action: string; urgency: "now" | "later" };
type FHProjector = { title: string; lines: string[] };

function block(eyebrow: string, inner: string, tone = ""): string {
  return `<div class="dir-block ${tone}"><div class="dir-eyebrow">${escapeHtml(eyebrow)}</div>${inner}</div>`;
}
function bullets(items: string[]): string {
  return `<ul class="dir-list">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

/**
 * The per-phase teacher panels. Deliberately NOT a teleprompter: NOW is what
 * should be happening, ASK is the question for this beat (with the answer the
 * teacher needs to have, not a line to read out), DON'T EXPLAIN YET is what to
 * withhold, TRIGGER and WATCH FOR are computed from live state, TIME CUT is
 * what to drop. A teacher reading these aloud verbatim would sound like a
 * robot; a teacher glancing at them can run the room.
 */
function renderDirector(view: Record<string, unknown>, phase: string): HTMLElement {
  const wrap = document.createElement("div");
  const d = view["director"] as FHDirector | undefined;
  const projector = view["projectorNow"] as FHProjector | undefined;
  const watchFor = (view["watchFor"] as FHWatchFlag[]) ?? [];
  const stages = (view["revealStages"] as FHRevealStage[]) ?? [];
  const nextStage = view["nextRevealStage"] as FHRevealStage | null;
  const currentStage = view["currentRevealStage"] as FHRevealStage | null;
  const parts: string[] = [];

  if (d) {
    parts.push(
      block(
        `Now — ${d.minuteBudget}`,
        bullets(d.now),
        "now",
      ),
    );
  }

  // TT-B3: the projector mirror stays alive through REVEAL..SYNTHESIS, the four
  // phases where the projector IS the lesson and the teacher is narrating it.
  if (projector && projector.title) {
    parts.push(
      block(
        "On the projector right now",
        `<div class="dir-projector-title">${escapeHtml(projector.title)}</div>${bullets(projector.lines)}`,
        "projector",
      ),
    );
  }

  // TT-B7: a stalled desk has to be unmissable, and after the window closes
  // nobody is "dialling" any more.
  if (watchFor.length > 0) {
    parts.push(
      block(
        "Watch for",
        watchFor
          .map(
            (f) =>
              `<div class="dir-flag ${f.urgency}">
                 <div class="dir-flag-label">${escapeHtml(f.label)}</div>
                 <div class="dir-flag-desks">${f.desks.map((x) => `<span class="dir-desk">${escapeHtml(x)}</span>`).join("")}</div>
                 <div class="dir-flag-action">${escapeHtml(f.action)}</div>
               </div>`,
          )
          .join(""),
        "watch",
      ),
    );
  }

  if (d?.trigger) parts.push(block("Trigger", `<p class="dir-p">${escapeHtml(d.trigger)}</p>`, "trigger"));

  // TT-B2: name every stage, mark the one on the projector and the one the next
  // press will land, and carry the line to say as each arrives.
  if (phase === "REVEAL" && stages.length > 0) {
    parts.push(
      block(
        "The seven reveals",
        stages
          .map((st) => {
            const isNext = nextStage?.stage === st.stage;
            const isNow = currentStage?.stage === st.stage;
            return `<div class="dir-stage ${isNow ? "current" : ""} ${isNext ? "next" : ""}">
              <span class="dir-stage-num">${st.stage}/${stages.length}</span>
              <span class="dir-stage-name">${escapeHtml(st.name)}${isNow ? " — on the projector" : isNext ? " — next press" : ""}</span>
              <span class="dir-stage-say">${escapeHtml(st.say)}</span>
            </div>`;
          })
          .join(""),
        "stages",
      ),
    );
  }

  if (d && d.ask.length > 0) {
    parts.push(
      block(
        "Ask",
        d.ask
          .map(
            (a) =>
              `<div class="dir-ask"><div class="dir-ask-q">${escapeHtml(a.q)}</div>${
                a.answer ? `<div class="dir-ask-a">${escapeHtml(a.answer)}</div>` : ""
              }</div>`,
          )
          .join(""),
        "ask",
      ),
    );
  }

  if (d && d.dontExplainYet.length > 0) parts.push(block("Don't explain yet", bullets(d.dontExplainYet), "hold"));

  const bellNote = String(view["bellNote"] ?? "");
  if (bellNote) parts.push(block("The bell", `<p class="dir-p">${escapeHtml(bellNote)}</p>`, ""));

  const studentScreen = (view["studentScreen"] as string[]) ?? [];
  const simplifications = (view["simplifications"] as { what: string; why: string; risk: string }[]) ?? [];
  const extras: string[] = [];
  if (studentScreen.length > 0) {
    extras.push(
      `<details class="dir-details"><summary>What the students are looking at (you cannot see their screen)</summary>${bullets(studentScreen)}</details>`,
    );
  }
  if (simplifications.length > 0) {
    extras.push(
      `<details class="dir-details"><summary>Where this model simplifies the real thing</summary>${simplifications
        .map(
          (s2) =>
            `<div class="dir-simp"><div class="dir-simp-what">${escapeHtml(s2.what)}</div><div class="dir-simp-why">${escapeHtml(
              s2.why,
            )}</div><div class="dir-simp-risk">Risk: ${escapeHtml(s2.risk)}</div></div>`,
        )
        .join("")}</details>`,
    );
  }
  if (d?.timeCut) extras.push(`<div class="dir-timecut"><span class="dir-eyebrow">Time cut</span>${escapeHtml(d.timeCut)}</div>`);
  if (extras.length > 0) parts.push(extras.join(""));

  wrap.innerHTML = parts.join("");
  return wrap;
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
  if (view["module"] === TRADE_DEADLINE_ID) return renderTradeDeadlineAggregate(view, seats);
  if (view["module"] === FREE_AGENCY_ID) return renderFreeAgencyAggregate(view, seats);
  if (view["module"] === FULL_HOUSE_ID) return renderFullHouseAggregate(view, seats);

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
      ${t.shocked ? `<div class="statline"><span>${t.repaired ? "repaired" : `${GLYPH_HIT}hit`}</span><span></span></div>` : ""}
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

/* -------------------------------------------------- trade deadline aggregate -- */

type TDTeamStat = {
  seatId: string;
  claimed: boolean;
  franchise: { name: string; crestIndex: number; origin: string } | null;
  spend: number | null;
  path: string | null;
  cutSlot: string | null;
  deadCapCharge: number;
  bidTargetId: string | null;
  bidAmount: number | null;
  bidOutcome: string | null;
  openSlot: boolean | null;
  rescued: boolean;
  capUsed: number;
};
type TDAggregate = {
  standPatCount: number; veteranCount: number; bidCount: number; bidWonCount: number; bidLostCount: number;
  totalDeadCapPaid: number; openSlotCount: number; rescuedCount: number; revealedCount: number;
};

function renderTradeDeadlineAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const teams = (view["teams"] as TDTeamStat[]) ?? [];
  const agg = view["aggregate"] as TDAggregate;
  const seatById = new Map(seats.map((s) => [s.id, s]));
  const wrap = document.createElement("div");

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${view["claimedCount"]}/${view["carriedFranchiseCount"]}</div><div class="lbl">Claimed carried franchises</div></div>
    <div class="kpi"><div class="num">${agg.standPatCount}/${agg.veteranCount}/${agg.bidCount}</div><div class="lbl">Stood pat / veteran / bid</div></div>
    <div class="kpi"><div class="num">$${agg.totalDeadCapPaid}M</div><div class="lbl">Total dead cap paid</div></div>
    <div class="kpi"><div class="num">${view["revealedCount"]}/${view["totalTargets"]}</div><div class="lbl">Targets revealed</div></div>
    <div class="kpi"><div class="num">${agg.rescuedCount}/${agg.openSlotCount}</div><div class="lbl">Rescued open slots</div></div>
  `;
  wrap.appendChild(kpis);

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  teams.forEach((t) => {
    const seat = seatById.get(t.seatId);
    const tile = document.createElement("div");
    tile.className = "teamtile";
    const franchiseRow = t.franchise
      ? `<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"><span style="${crestStyle(t.franchise.crestIndex, 16)}"></span><strong>${escapeHtml(t.franchise.name)}</strong>${t.franchise.origin === "stock" ? ' <span style="font-size:9px; color:var(--ink-muted);">EXP</span>' : ""}</div>`
      : `<strong>${seat ? escapeHtml(seat.displayName) : "Not claimed"}</strong>`;
    const pathLabel = t.path === "standPat" ? "stood pat" : t.path === "veteran" ? `cut → veteran` : t.path === "bid" ? `cut → bid ($${t.bidAmount ?? "?"}M)` : "deciding…";
    const outcomeLabel = t.path === "bid" ? (t.bidOutcome ? (t.bidOutcome === "won" ? "won bid" : "lost bid") : "sealed — pending") : "";
    tile.innerHTML = `
      ${franchiseRow}
      <div class="statline"><span>${seat ? escapeHtml(seat.displayName) : ""}</span><span>${t.claimed ? `$${t.capUsed}M` : ""}</span></div>
      <div class="statline"><span>${escapeHtml(pathLabel)}</span><span>${escapeHtml(outcomeLabel)}</span></div>
      ${t.openSlot ? `<div class="statline"><span style="color:${t.rescued ? "var(--cap-safe)" : "#ff9aa4"};">${t.rescued ? "rescued" : `${GLYPH_WARN}open slot`}</span><span></span></div>` : ""}
    `;
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* --------------------------------------------------------- free agency aggregate -- */

type FATeamStat = {
  seatId: string;
  claimed: boolean;
  franchise: { name: string; crestIndex: number; origin: string } | null;
  capUsed: number;
  capRoom: number;
  deadCap: number;
  signingsCount: number;
  pendingOffer: { agentId: string; amount: number; slot: string } | null;
  held: boolean;
  outForDay: boolean;
  acted: boolean;
};
type FAAgentStat = { id: string; name: string; position: string; tier: string; ask: number; signed: boolean; signedBy: string | null; signedAmount: number | null };

function renderFreeAgencyAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const teams = (view["teams"] as FATeamStat[]) ?? [];
  const agents = (view["agents"] as FAAgentStat[]) ?? [];
  const seatById = new Map(seats.map((s) => [s.id, s]));
  // N2 repair (VERIFY_L3.md N2): the pending-offer label used to show the raw internal agent id
  // (e.g. "fa-value-df") instead of its name -- the `agents` array already carries the friendly name.
  const agentNameById = new Map(agents.map((a) => [a.id, a.name]));
  const wrap = document.createElement("div");

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${view["windowClosed"] ? "closed" : `${view["day"]}/${view["windowDays"] ?? 4}`}</div><div class="lbl">Signing day</div></div>
    <div class="kpi"><div class="num">${view["claimedCount"]}/${view["carriedFranchiseCount"]}</div><div class="lbl">Claimed franchises</div></div>
    <div class="kpi"><div class="num">${view["actedCount"]}</div><div class="lbl">Acted today</div></div>
    <div class="kpi"><div class="num">${view["pendingCount"]}</div><div class="lbl">Sealed offers in</div></div>
    <div class="kpi"><div class="num">${view["revealStage"]}/${view["totalRevealSteps"]}</div><div class="lbl">Reveal stages played</div></div>
  `;
  wrap.appendChild(kpis);

  const marketRow = document.createElement("div");
  marketRow.style.marginBottom = "14px";
  marketRow.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Market snapshot</div>` + agents
    .map((a) => {
      const status = a.signed ? `SIGNED $${a.signedAmount}M` : `ask $${a.ask}M`;
      return `<div class="row" style="margin:2px 0;"><span style="width:130px; font-size:11px; color:var(--ink-secondary);">${escapeHtml(a.name)} <span style="color:var(--ink-muted);">· ${a.position}</span></span><span style="font-size:11px; color:${a.signed ? "var(--cap-safe)" : "var(--ink-muted)"};">${status}</span></div>`;
    })
    .join("");
  wrap.appendChild(marketRow);

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  teams.forEach((t) => {
    const seat = seatById.get(t.seatId);
    const tile = document.createElement("div");
    tile.className = "teamtile";
    const franchiseRow = t.franchise
      ? `<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"><span style="${crestStyle(t.franchise.crestIndex, 16)}"></span><strong>${escapeHtml(t.franchise.name)}</strong></div>`
      : `<strong>${seat ? escapeHtml(seat.displayName) : "Not claimed"}</strong>`;
    const actedLabel = t.pendingOffer
      ? `offer: $${t.pendingOffer.amount}M on ${escapeHtml(agentNameById.get(t.pendingOffer.agentId) ?? t.pendingOffer.agentId)}`
      : t.outForDay
        ? "withdrew — out for today"
        : t.held
          ? "holding"
          : t.acted
            ? "acted"
            : "deciding…";
    tile.innerHTML = `
      ${franchiseRow}
      <div class="statline"><span>${seat ? escapeHtml(seat.displayName) : ""}</span><span>$${t.capUsed}M used</span></div>
      <div class="statline"><span>${t.deadCap > 0 ? `$${t.deadCap}M dead cap` : "clean books"}</span><span>${t.signingsCount} signed</span></div>
      <div class="statline"><span style="color:${t.acted ? "var(--cap-safe)" : "var(--ink-muted)"};">${actedLabel}</span><span></span></div>
    `;
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* --------------------------------------------------------- full house aggregate -- */

type FHDeskStat = {
  seatId: string;
  deskNumber: number;
  handle: string;
  marketId: string;
  club: string;
  locked: boolean;
  price: number;
  spend: number;
  openBowl: boolean;
  cash: number;
  renewals: number;
  inDebt: boolean;
  nightsPlayed: number;
  joinedAtNight: number;
  lastFillPct: number | null;
  heldSamePriceRun: number;
};

function renderFullHouseAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const desks = (view["desks"] as FHDeskStat[]) ?? [];
  const card = view["card"] as { label: string; day: string; visitor: string; draw: number; tv: string; bowlOffer: boolean } | null;
  const seatById = new Map(seats.map((s) => [s.id, s]));
  const wrap = document.createElement("div");

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${view["allNightsDone"] ? "done" : `${view["nightNumber"]}/${view["nightCount"]}`}</div><div class="lbl">Night</div></div>
    <div class="kpi"><div class="num">${view["lockedCount"]}/${view["deskCount"]}</div><div class="lbl">Locked in</div></div>
    <div class="kpi"><div class="num" style="font-size:15px;">${view["twoPeaksReleased"] ? "on the projector" : view["twoPeaksAvailable"] ? "ready to release" : "not yet"}</div><div class="lbl">Two Peaks panel</div></div>
    <div class="kpi"><div class="num">${view["revealStage"]}/${view["totalRevealSteps"]}</div><div class="lbl">Reveal stages</div></div>`;
  wrap.appendChild(kpis);

  if (card) {
    const cardRow = document.createElement("div");
    cardRow.style.marginBottom = "12px";
    cardRow.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">On the projector right now</div>
      <div style="font-size:13px; color:var(--ink-secondary);">${escapeHtml(card.label)} — ${escapeHtml(card.day)} vs ${escapeHtml(card.visitor)} · draw ${card.draw}/100 · ${escapeHtml(card.tv)} TV${card.bowlOffer ? " · capacity option offered" : ""}</div>`;
    wrap.appendChild(cardRow);
  }

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  // TT-B7: after the five-night window closes nobody is "dialling" anything, and
  // while it is open a desk that has not locked has to be unmissable.
  const windowClosed = Boolean(view["allNightsDone"]);
  for (const d of desks) {
    const seat = seatById.get(d.seatId);
    const tile = document.createElement("div");
    tile.className = `teamtile${!windowClosed && !d.locked ? " stalled" : ""}`;
    tile.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"><strong>${escapeHtml(d.handle)}</strong></div>
      <div class="statline"><span>${seat ? escapeHtml(seat.displayName) : d.seatId}</span><span>${
        windowClosed ? `finished · ${d.nightsPlayed} nights in the books` : d.locked ? `LOCKED $${d.price}` : `<span class="dir-stalled">still dialling $${d.price}</span>`
      }</span></div>
      <div class="statline"><span class="pill pill-${d.inDebt ? "at-cap" : "comfortable"}" style="font-size:10px;">$${d.cash.toLocaleString()}</span><span>${d.renewals}% renewals</span></div>
      <div class="statline"><span>${d.nightsPlayed} night${d.nightsPlayed === 1 ? "" : "s"}${d.joinedAtNight > 1 ? ` · joined N${d.joinedAtNight}` : ""}</span><span>${d.lastFillPct !== null ? `${d.lastFillPct}% full` : ""}</span></div>
      ${d.spend > 0 ? `<div class="statline"><span>$${d.spend.toLocaleString()} on the night</span><span>${d.openBowl ? "extra seats" : ""}</span></div>` : ""}
      ${d.heldSamePriceRun >= 3 ? `<div class="statline"><span style="color:var(--cap-tight);">held one price ${d.heldSamePriceRun} nights</span><span></span></div>` : ""}`;
    grid.appendChild(tile);
  }
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
/**
 * The "you are about to skip real content" guard, shared by `Advance ▸` and
 * `Jump to REVEAL`.
 *
 * `gate-l1-teacher` recheck2 gap 3 / TT-R2: `Jump to REVEAL` sits immediately
 * beside `Advance ▸` and was a silent one-click end to the game — pressed at
 * Night 2 with three nights unplayed it jumped straight to REVEAL with no
 * dialog, no tooltip and no warning. It consumes exactly what advancing out of
 * PLAY consumes, so it asks exactly what advancing asks.
 */
function confirmSkippingContent(via: "advance" | "reveal"): boolean {
  // B1 repair (VERIFY_L2.md BLOCKER): same confirm() idiom btnEnd already uses below — no new dialog
  // framework. The economics stay correct either way (the runtime auto-resolves whatever's pending), this is
  // purely "you're about to skip real content" — the staged reveal theater for L2, or up to three whole
  // unplayed signing days for L3.
  const w = advanceWarnState;
  const lead = via === "reveal" ? "Jump to REVEAL. " : "";
  if (w?.kind === "td-reveal" && w.revealedCount < w.totalTargets) {
    const remaining = w.totalTargets - w.revealedCount;
    return confirm(
      `${lead}${remaining} of ${w.totalTargets} target${w.totalTargets === 1 ? "" : "s"} unrevealed — ${via === "reveal" ? "this" : "advancing"} resolves ${remaining === 1 ? "it" : "them"} automatically, without the staged reveal. Continue?`,
    );
  } else if (w?.kind === "fh-play") {
    const remaining = w.nightCount - w.nightNumber;
    const unlocked = Math.max(0, w.deskCount - w.lockedCount);
    return confirm(
      `${lead}Night ${w.nightNumber} of ${w.nightCount} is still open (${w.lockedCount}/${w.deskCount} desks locked in). This is not the night bell — ${
        via === "reveal" ? "this button" : "advancing now"
      } settles tonight for every desk AND ends the five-night window early, so ${
        remaining === 1 ? "1 night" : `${remaining} nights`
      } will never be played.${
        unlocked > 0
          ? ` ${unlocked} desk${unlocked === 1 ? "" : "s"} ${unlocked === 1 ? "has" : "have"} not locked; ${
              unlocked === 1 ? "it settles" : "they settle"
            } at whatever price is on ${unlocked === 1 ? "its" : "their"} dial right now.`
          : ""
      } Continue?`,
    );
  } else if (w?.kind === "fa-play") {
    const remainingDays = w.windowDays - w.day;
    return confirm(
      `${lead}Day ${w.day} of ${w.windowDays} is still open (${w.actedCount}/${w.claimedCount} teams have acted). ${
        via === "reveal" ? "This button" : "Advancing now"
      } closes today's day automatically AND ends the signing window early — ${remainingDays} day${remainingDays === 1 ? "" : "s"} will never happen. Continue?`,
    );
  }
  return true;
}

$("btnAdvance").addEventListener("click", () => {
  if (!confirmSkippingContent("advance")) return;
  void sendControl({ type: "advance" });
});
$("btnReveal").addEventListener("click", () => {
  if (!confirmSkippingContent("reveal")) return;
  void sendControl({ type: "reveal" });
});
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
$("btnRevealNext").addEventListener("click", () => void sendControl({ type: "hook", hook: "revealNext" }));
$("btnCloseDay").addEventListener("click", () => void sendControl({ type: "hook", hook: "closeDay" }));
$("btnCloseNight").addEventListener("click", () => void sendControl({ type: "hook", hook: "closeNight" }));
$("btnTwoPeaks").addEventListener("click", () => void sendControl({ type: "hook", hook: "twoPeaks" }));
$("btnCfPage").addEventListener("click", () => void sendControl({ type: "hook", hook: "cfPage" }));

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
