import { ApiError, apiFetch } from "../shared/api.js";
import { crestStyle } from "../shared/crest.js";
import { createFreshness } from "../shared/freshness.js";
import { startPolling } from "../shared/poll.js";
import { loadTeachSessionCode, loadTeachSessionKey, saveTeachSessionCode, saveTeachSessionKey } from "../shared/storage.js";
import { renderSameLineL1Aggregate } from "../shared/sameLineL1Teach.js";
import { renderSameLineL2Aggregate } from "../shared/sameLineL2Teach.js";
import { renderSameLineL3Aggregate } from "../shared/sameLineL3Teach.js";

type Lesson = { id: string; title: string; phases: string[] };
type TeacherSeat = { id: string; displayName: string; joinedAt: string; lastSeenAt: string; quietBucket?: 0 | 1 | 2 | 3 | 4; rejoinLocked: boolean };
/** Mirrors `RoundPublic` on the server. `serverNow` is what lets a Chromebook with a wrong clock draw the same countdown as the projector. */
type RoundPublic = {
  status: "OPEN" | "FINAL_CALL" | "CLOSED";
  key: string;
  endsAt: string | null;
  serverNow: string;
  closedBy: "final_call_expired" | "close_now" | "module" | null;
};
type UnresolvedSeat = { seatId: string; label: string; fallback: string };
/** Who is at the podium, teacher-private — the one payload allowed to name the seat. */
type TeacherSpotlight = { seatId: string; label: string; since: string; question: string | null };
/** §12.2 INVITE FIRST: who is invited and awaiting an answer, teacher-private. */
type TeacherInvite = { seatId: string; label: string; question: string | null; since: string };
/** The console's shortlist for who to call up next — the module's own ranking, never the runtime's. `declined` is the runtime's own seat-level fact, folded in server-side. */
type PressCandidate = { seatId: string; label: string; why: string; declined: boolean };
type TeacherPayload = {
  session: {
    id: string; code: string; title: string; lessonModuleId: string; phase: string; phases: string[];
    paused: boolean; pausedAt?: string | null; frozen: boolean; ended: boolean; version: number; hasCheckpoint: boolean;
    checkpointLabel: string | null;
    boardSeenBucket?: 0 | 1 | 2;
    createdAt?: string; serverNow?: string;
  };
  teacherKey?: string;
  seats: TeacherSeat[];
  round: RoundPublic | null;
  timeCut: { policy: string; unresolved: UnresolvedSeat[]; resolvedCount: number } | null;
  spotlight: TeacherSpotlight | null;
  pressInvite: TeacherInvite | null;
  pressCandidates: PressCandidate[];
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
const timeCutEl = $("timecut");
const pressConfEl = $("pressconf");
const liveRoomEl = $("liveroom");
const desksEl = $("desks");
const projPreviewEl = $("projpreview"); // claim-ok: an element id, not a rendered word

let currentCode: string | null = null;
const freshness = createFreshness<TeacherPayload>((p) => ({ code: p.session?.code ?? null, version: p.session?.version ?? NaN }));
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
  // M2 L2: leaving PLAY settles every week still open, in one press.
  | { kind: "hl-play"; weekNumber: number; weekCount: number; lockedCount: number; deskCount: number }
  // M2 L3 (gate-l3-teacher B3, BLOCKING): L3 regressed against its own sibling.
  // `Advance ▸` and `Jump to REVEAL` were unguarded through the WHOLE of PLAY,
  // so one click during the vote threw away the vote AND all three weeks, and
  // the console then offered five reveal beats for a season nobody played with
  // no warning anywhere that the class had been derailed. The consequence is
  // larger here than in either sibling, and it names the two arms separately.
  | { kind: "wr-vote"; round: number; roundCount: number; submitted: number; deskCount: number; sealed: boolean }
  | { kind: "wr-season"; weekNumber: number; weekCount: number; lockedCount: number; deskCount: number }
  | null;
let advanceWarnState: AdvanceWarnState = null;
/** M2 L2's week bell, when it would settle a league with nobody locked in (gate-l2-teacher N5). */
let closeWeekWarn: string | null = null;
let ruleStepWarn: string | null = null;
// Wave 3b: THE FLOOR's own pacing shares btnRuleStep with THE SHARE's — the
// hook the click handler fires depends on which institution is running.
let ruleStepHook: "ruleStep" | "institutionStep" = "ruleStep";
let realRuleWarn: string | null = null;
let commitRevealWarn: string | null = null;
// R1: the per-session teacher credential — required on every /control and
// GET /teacher call from here on. Held in memory plus localStorage (see
// storage.ts) so a page refresh doesn't strand the teacher outside their
// own room.
let teacherKey: string | null = null;
let poller: { stop: () => void } | null = null;

const TRADE_DEADLINE_ID = "m1l2-trade-deadline";
const DRAFT_DAY_ID = "m1l1-draft-day";
const FREE_AGENCY_ID = "m1l3-free-agency";
const THE_WINDOW_ID = "m1l1-the-window";
const FULL_HOUSE_ID = "m2l1-full-house";
const HOST_LEAGUE_ID = "m2l2-host-league";
/** Mirrors `MISSED_BILL_PENALTY` in hostTheLeague.ts ($200,000) — display only; the module is the authority. */
const MISSED_BILL_PENALTY_TEXT = "200,000";
const WRITE_RULE_ID = "m2l3-write-rule";
const LOBBY_DEMO_ID = "lobby-demo";
const THE_SEASON_ID = "m1l2-the-season";
const THE_DEADLINE_ID = "m1l3-the-deadline";

/**
 * Which earlier lessons a room may be linked to, in order of preference, and
 * what the link carries — the six-week chain (D59/D60) plus the legacy arc.
 * A lesson absent here has no link row: its franchises open stock.
 */
const LINKABLE: Readonly<Record<string, { readonly sources: readonly string[]; readonly label: string }>> = {
  [THE_SEASON_ID]: {
    sources: [THE_WINDOW_ID],
    label: "Link to a completed THE WINDOW (Week 1) session — every desk's July books open its own season",
  },
  [THE_DEADLINE_ID]: {
    sources: [THE_SEASON_ID, THE_WINDOW_ID],
    label: "Link to a completed THE SEASON (Week 2, preferred) or THE WINDOW (Week 1) session — carries each desk's books and roster to the deadline",
  },
  [FULL_HOUSE_ID]: {
    sources: [THE_WINDOW_ID],
    label: "Link to a completed THE WINDOW (Week 1) session — carries each desk's signed roster and its bill into the building",
  },
  [HOST_LEAGUE_ID]: {
    sources: [FULL_HOUSE_ID],
    label: "Link to a completed Full House (Week 4) session — carries each building's cash and whether it cleared the bill into the shared league",
  },
  [WRITE_RULE_ID]: {
    sources: [HOST_LEAGUE_ID],
    label: "Link to a completed You Don't Play Alone (M2 L2) session — carries every club's Draw, bank balance and reinvest history into the rule vote",
  },
  [TRADE_DEADLINE_ID]: {
    sources: [DRAFT_DAY_ID],
    label: "Link to a completed Draft Day (L1) session — carries each locked roster forward",
  },
  [FREE_AGENCY_ID]: {
    sources: [TRADE_DEADLINE_ID, DRAFT_DAY_ID],
    label: "Link to a completed Trade Deadline (L2, preferred) or Draft Day (L1) session — carries franchises into the signing window",
  },
};
const MODULE_SHORT: Readonly<Record<string, string>> = {
  [THE_WINDOW_ID]: "W1", [THE_SEASON_ID]: "W2", [THE_DEADLINE_ID]: "W3", [FULL_HOUSE_ID]: "W4",
  [HOST_LEAGUE_ID]: "M2 L2", [TRADE_DEADLINE_ID]: "L2", [DRAFT_DAY_ID]: "L1",
};

/**
 * gate-l1-visual P8 (reported repaired at round 4, and was not — the bell was
 * still rendering as an emoji on the control room's biggest button). Drawn 16px
 * marks in the ink palette, the same `.btn-glyph` the shock control already uses.
 */
const BELL_GLYPH = `<span class="btn-glyph" aria-hidden="true">◗</span>`;
const GLYPH_HIT = `<span class="btn-glyph" aria-hidden="true">/</span>`;
const GLYPH_WARN = `<span class="btn-glyph" aria-hidden="true">!</span>`;

/**
 * The pre-session rehearsal note, per lesson — `gate-l2-teacher` W5 N-1.
 *
 * The shipped note was written for M2 L3 and never changed with the picker, so
 * a teacher preparing M2 L2 was told to rehearse a round step and a two-thirds
 * test that do not exist in this lesson, and warned about throwing away a vote
 * this lesson never takes. What every version says is the part that is true of
 * all of them (rehearse cold, do not press Advance ▸ through PLAY); what changes
 * is the list of interior controls, which is the whole point of the paragraph.
 */
const REHEARSE_COMMON =
  "Never run this lesson before? Create a session now with nobody in it and walk the console. The directing panel — what to say, what to ask, what to hold back, and the line for each reveal — is all there with zero students, and WATCH FOR and the synthesis cards show you the real shapes with stand-in desks, every one of them marked REHEARSAL.";

/**
 * `gate-l2-teacher` (BLOCKING). The sentence above is a promise about a panel
 * that only three of the seven registered lessons ship. Told to a teacher
 * preparing Draft Day, it sent them looking for a director that does not exist
 * and let them believe the walk-through had done its job. The console must
 * never claim a surface it does not have.
 */
const REHEARSE_UNDIRECTED =
  "Never run this lesson before? Create a session now with nobody in it and walk the console. Be warned: <strong>this lesson does not ship a directing panel.</strong> The console gives you the phase controls, the roster and the class aggregate, and nothing that tells you what to say. Prepare it from its own lesson plan, not from this screen.";

/** The three lessons whose modules author a director, WATCH FOR and a rehearsal deck. */
const DIRECTED_LESSONS: ReadonlySet<string> = new Set([FULL_HOUSE_ID, HOST_LEAGUE_ID, WRITE_RULE_ID]);

function rehearseNoteFor(lessonId: string): string {
  const advanceWarning =
    "<strong>Do not just press Advance ▸ through PLAY:</strong> in PLAY that button jumps straight past the interior, which is about half the period, and in a real class it settles everything still open in one click.";
  switch (lessonId) {
    case WRITE_RULE_ID:
      return `${REHEARSE_COMMON} ${advanceWarning} Rehearse PLAY with its own controls — the <strong>round step</strong> (once per round, then once more for the two-thirds test, then once more to open the season) and the <strong>week bell</strong> (once per week) — and use Advance ▸ only to leave a phase that is finished.`;
    case HOST_LEAGUE_ID:
      return `${REHEARSE_COMMON} ${advanceWarning} This lesson has exactly two interior controls: the <strong>week bell</strong>, which you press once per week to settle every building in the league at the same moment, and the <strong>Handed-To-You bar</strong>, which you release ONCE, by hand, at the moment the panel tells you to — straight after the week-2 bell, before the room prices week 3. Rehearse both, then rehearse the five <strong>reveal presses</strong> and the <strong>synthesis cards</strong>, one press each. Use Advance ▸ only to leave a phase that is finished.`;
    case FULL_HOUSE_ID:
      return `${REHEARSE_COMMON} ${advanceWarning} Rehearse PLAY with the <strong>night bell</strong> (once per night) and the staged <strong>reveal presses</strong>, and use Advance ▸ only to leave a phase that is finished.`;
    case FREE_AGENCY_ID:
      return `${REHEARSE_UNDIRECTED} ${advanceWarning} Rehearse PLAY with the <strong>signing-day close</strong> (once per day) — leaving PLAY early permanently ends the signing window, and a day that was never opened is never played. Use Advance ▸ only to leave a phase that is finished.`;
    case LOBBY_DEMO_ID:
      return "This is not a lesson. It is the two-minute connection test: make a session, put one device on the join code, press a colour, and check that the board moves. Use it to prove the room's wifi and the projector before a class, then create the real session.";
    default:
      return `${REHEARSE_UNDIRECTED} ${advanceWarning} Walk every phase and press each of that phase's own controls at least once before the room is in front of you, and use Advance ▸ only to leave a phase that is finished.`;
  }
}

function syncRehearseNote(): void {
  const note = document.getElementById("rehearseNote");
  if (note) note.innerHTML = rehearseNoteFor($<HTMLSelectElement>("lesson").value);
}

async function loadLessons(): Promise<void> {
  const { lessons } = await apiFetch<{ lessons: Lesson[] }>("/api/lessons");
  const select = $<HTMLSelectElement>("lesson");
  select.innerHTML = "";
  // `gate-l2-teacher` (BLOCKING). The picker used to open on Draft Day, under a
  // comment claiming it was "the module the teacher actually runs class with" —
  // and Draft Day is one of the four lessons with no directing panel, so the
  // console's own default contradicted the rehearsal note directly beneath it.
  // The directed lessons come first now, the connection test comes last, and
  // the option itself says which kind of thing each one is.
  const rank = (id: string): number => (id === LOBBY_DEMO_ID ? 2 : DIRECTED_LESSONS.has(id) ? 0 : 1);
  const ordered = [...lessons].sort((a, b) => rank(a.id) - rank(b.id));
  for (const lesson of ordered) {
    const option = document.createElement("option");
    option.value = lesson.id;
    const kind = lesson.id === LOBBY_DEMO_ID ? " — connection test, not a lesson" : DIRECTED_LESSONS.has(lesson.id) ? " — directed" : " — no directing panel";
    option.textContent = `${lesson.title}${kind}`;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    syncRehearseNote();
    void syncSourceSessionRow();
  });
  syncRehearseNote();
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
  const link = LINKABLE[lessonId];
  if (!link) {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  label.textContent = link.label;
  const select = $<HTMLSelectElement>("sourceSession");
  select.innerHTML = `<option value="">No link — stock/expansion franchises only</option>`;
  try {
    const { sessions } = await apiFetch<{ sessions: { id: string; code: string; title: string; lessonModuleId: string; phase: string; ended: boolean }[] }>(
      "/api/sessions",
      { headers: setupAuthHeaders() },
    );
    const eligibleModuleIds = link.sources;
    const eligible = sessions.filter((s) => eligibleModuleIds.includes(s.lessonModuleId)).sort((a, b) => eligibleModuleIds.indexOf(a.lessonModuleId) - eligibleModuleIds.indexOf(b.lessonModuleId));
    const liveIds = new Set<string>();
    for (const s of eligible) {
      const option = document.createElement("option");
      option.value = s.id;
      if (!s.ended) liveIds.add(s.id);
      const moduleLabel = MODULE_SHORT[s.lessonModuleId] ?? s.lessonModuleId;
      option.textContent = `[${moduleLabel}] ${s.title || s.code} (${s.code}) — ${s.ended ? "ended" : `live, ${s.phase}`}`;
      select.appendChild(option);
    }
    // A session that has not finished can still be linked, and sometimes should
    // be (a room that ran long, a period split across two days). What must not
    // happen is a teacher doing it by accident: the books carried forward are
    // whatever that room had at the instant this one was created, so a league
    // linked mid-week arrives half-played and nothing downstream can tell.
    select.onchange = (): void => {
      const warn = $("sourceLiveWarn");
      const live = liveIds.has(select.value);
      warn.hidden = !live;
      if (live) {
        warn.textContent =
          "That session has not finished. Linking it copies its books exactly as they stand right now, mid-lesson — if you meant a session from an earlier period or yesterday, pick one marked \u201cended\u201d.";
      }
    };
    select.onchange(new Event("change"));
    // The listing only answers a teacher of a room on this server, because it
    // hands out join codes. On a browser that has never run one there is
    // nothing to show — and a teacher who DID run that lesson, on another
    // machine or before this browser was wiped, needs telling how to get at it
    // rather than quietly seeing "no link" and assuming the feature is broken.
    const hint = $("sourceSessionHint");
    if (eligible.length === 0) {
      hint.hidden = false;
      hint.textContent = sessions.length === 0
        ? "Nothing to link to on this device. If you ran that lesson on another computer, reopen it here with its teacher key first — that also unlocks this list."
        : "No completed session of the right lesson to link to yet.";
    } else {
      hint.hidden = true;
    }
  } catch {
    // Degrading quietly here is what hid a server-side failure behind an empty
    // picker: the teacher saw "nothing to link to", believed yesterday's session
    // was gone, and started an unlinked room. Creating an unlinked session still
    // works — but say that this is a failure, not an absence.
    const hint = $("sourceSessionHint");
    hint.hidden = false;
    hint.textContent =
      "Could not read the list of earlier sessions from this server. You can still start an unlinked session — today's league opens on a stock spread — or try again in a moment.";
  }
}

async function createSession(): Promise<void> {
  const lessonModuleId = $<HTMLSelectElement>("lesson").value;
  const title = $<HTMLInputElement>("title").value.trim();
  const sourceSessionId = LINKABLE[lessonModuleId] ? $<HTMLSelectElement>("sourceSession").value || undefined : undefined;
  const payload = await apiFetch<TeacherPayload>("/api/sessions", {
    method: "POST",
    headers: setupAuthHeaders(),
    body: JSON.stringify({ lessonModuleId, title, sourceSessionId, gradeBand: $<HTMLSelectElement>("gradeBand").value }),
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

/**
 * The setup screen's credential, before this browser has a session of its own.
 *
 * Listing sessions and seeding a new one from an old one both now require
 * proof that the caller runs SOME room on this server, because both were open
 * to any student who could reach it — the listing hands out every live class's
 * join code, and a seed reads another room's state. At setup there is no
 * current session, so the key that proves it is the one this machine was left
 * holding by the last room it ran, which is also the only room a teacher can
 * sensibly be linking to.
 *
 * A first-ever session on a fresh browser has no key and no link to make: the
 * picker degrades to "no link" and creating an unlinked session is unchanged.
 */
function setupAuthHeaders(): Record<string, string> {
  const key = teacherKey ?? loadTeachSessionKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

function openSession(code: string): void {
  currentCode = code;
  setupEl.hidden = true;
  roomEl.hidden = false;
  controlsEl.hidden = false;
  rosterEl.hidden = false;
  aggregateEl.hidden = false;
  timeCutEl.hidden = true; // shown by render(), only once the lesson actually has a round open
  $("joinUrl").textContent = `${location.origin}/play`;
  $("code").textContent = code;
  // The key this console is actually holding, made readable so the reopen form
  // on the setup screen is usable at all.
  const keyBox = $<HTMLDetailsElement>("teacherKeyBox");
  if (teacherKey) {
    keyBox.hidden = false;
    $("teacherKeyValue").textContent = teacherKey;
  } else {
    keyBox.hidden = true;
  }
  // gate-l2-teacher B1: the projector URL, printed, with its code already in it.
  $("boardUrl").textContent = `${location.origin}/board?code=${code}`;
  mountProjectorPreview(code);
  poller?.stop();
  // W2: the console fires the controls, so it is the surface most likely to
  // have a poll in flight when the room moves. A response older than one
  // already rendered would put a phase chip, a reveal stage or a lock count
  // back where it was — under a teacher's hand, mid-press.
  freshness.reset();
  poller = startPolling<TeacherPayload>(
    `/api/sessions/${code}/teacher`,
    1500,
    (payload) => {
      if (!freshness.accept(payload)) return;
      render(payload);
    },
    {
      streamUrl: `/api/sessions/${code}/stream`,
      onPushState: (connected) => {
        pushLive = connected;
      },
      headers: authHeaders,
      onError: (err) => {
        if (err instanceof ApiError && err.status === 401) {
          // This branch was dead code until `poll.ts` started passing a typed
          // error. Now that it fires, it must not fire into a dead end: the
          // console had hidden #setup and offered no way back, so a rejected
          // key left the teacher looking at controls that did nothing.
          poller?.stop();
          poller = null;
          statusEl.textContent =
            "This teacher key no longer controls this room. Reopen with the key, or start a new session.";
          roomEl.hidden = true;
          controlsEl.hidden = true;
          rosterEl.hidden = true;
          aggregateEl.hidden = true;
          timeCutEl.hidden = true;
          liveRoomEl.hidden = true;
          mountProjectorPreview(null);
          clearDeck();
          stopTimeCutClock();
          $("director").hidden = true;
          setupEl.hidden = false;
          $<HTMLInputElement>("reopenCode").value = currentCode ?? "";
          return;
        }
        statusEl.textContent = describeError(err);
      },
    },
  );
}

$("btnCopyKey").addEventListener("click", () => {
  const key = teacherKey;
  if (!key) return;
  const done = (msg: string): void => {
    const btn = $("btnCopyKey");
    btn.textContent = msg;
    window.setTimeout(() => (btn.textContent = "Copy"), 1600);
  };
  // The clipboard API needs a secure context, and this server is deliberately
  // plain HTTP on the classroom LAN. Selecting the text is the fallback that
  // always works, so the key is never unreachable.
  void navigator.clipboard
    ?.writeText(key)
    .then(() => done("Copied"))
    .catch(() => {
      const el = $("teacherKeyValue");
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      done("Selected — press Ctrl+C");
    });
});

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "error" in (err as Record<string, unknown>)) {
    const e = (err as { error?: { message?: string } }).error;
    return e?.message ?? "connection trouble — retrying";
  }
  return "connection trouble — retrying";
}

/** What Restore would currently undo — read by the confirm dialog. */
let lastCheckpointLabel: string | null = null;
/** Whether the push stream is carrying this console, shown in the status line. */
let pushLive = false;

/* ------------------------------------------------------------------ TIME CUT --
 * The founder's two closing controls, and the thing that makes either safe to
 * press. The order matters: a teacher must be able to see WHO has committed
 * nothing and WHAT closing does to them BEFORE they close, not afterwards in a
 * settlement they cannot undo without a restore.
 *
 * The countdown is drawn from `endsAt - serverNow`, converted once into a local
 * deadline, and ticked locally at 4Hz. Every surface does this the same way, so
 * a Chromebook whose clock is an hour out still shows the projector's twenty
 * seconds — no client clock is ever compared against a server timestamp
 * directly, and none of them decide anything: the server alone rules on whether
 * an action was in time.
 * ---------------------------------------------------------------------------- */

/** Local performance-clock deadline for the running final call, or null. */
let timeCutDeadline: number | null = null;
let timeCutTimer: ReturnType<typeof setInterval> | null = null;
/** What the close would do, kept fresh for the CLOSE NOW confirm dialog. */
let timeCutConfirm: { unresolvedCount: number; policy: string } | null = null;

function stopTimeCutClock(): void {
  if (timeCutTimer !== null) {
    clearInterval(timeCutTimer);
    timeCutTimer = null;
  }
  timeCutDeadline = null;
}

function paintTimeCutClock(): void {
  const clock = $("tcClock");
  if (timeCutDeadline === null) {
    clock.hidden = true;
    return;
  }
  const left = Math.max(0, timeCutDeadline - Date.now());
  clock.hidden = false;
  clock.textContent = `${(left / 1000).toFixed(1)}s`;
  clock.classList.toggle("late", left <= 5000);
}

/** What roomRead() hands over. Mirrored, not shared — the module owns the shape. */
type RoomRead = {
  deskCount: number;
  lockedCount: number;
  decidingCount: number;
  spread: { min: number; max: number; median: number; range: number } | null;
  bins: { from: number; to: number; label: string; count: number; lockedCount: number; handles: string[] }[];
  movement: { raised: number; held: number; lowered: number; basis: number; noOwnPrior: number; noPrior: number; deciding: number };
  firstNight: boolean;
  countLine: string;
  movementLine: string;
  spreadLine: string;
  privacyNote: string;
};
/** Mirrors `DeskStrip` in each M2 module. Teacher-only; /board is never handed it. */
type DeskStrip = {
  countLine: string;
  entries: { seatId: string; label: string; state: "in" | "deciding" | "auto" | "closed"; stateLabel: string; note: string | null; flag: boolean }[];
};
/**
 * Dollars, with the minus sign where a reader expects it.
 *
 * The console was printing a desk in the red as `$-38,800`. It is the one
 * number on the tile a teacher scans for, and it read like a typo at exactly
 * the moment it mattered — the sign belongs in front of the currency, the way
 * every other surface in this product already writes it.
 */
function money(n: number): string {
  return `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

/**
 * THE ROOM, on the console.
 *
 * The teacher's job during an open night is to read the room and pick the
 * question that opens the argument. Until now the console gave them sixteen
 * tiles and left the reading to them, which is the difference between a console
 * that administrates a lesson and one that directs it. Three facts, in the order
 * a teacher says them: how far apart the room is, what shape it is in, and who
 * moved.
 *
 * Everything here is teacher-private by construction — it comes from
 * `teacherView`, which the projector never sees.
 */
/* ------------------------------------------------- the projector preview -- */

/**
 * THE PROJECTOR, on the console.
 *
 * A teacher running this lesson spends most of it facing the room, which means
 * facing away from the board. The director panel can SAY what is on the
 * projector; it cannot show whether the reveal actually landed, whether the
 * board is still on the previous stage, or whether the thing at the front of
 * the room is the frozen single word rather than the lesson. So this is the
 * board itself — same page, same session, same poll — scaled down and made
 * completely inert. A mirror built by re-rendering board data in a second
 * renderer could drift from the board and quietly lie about the room's own
 * evidence; an iframe of `/board` structurally cannot.
 *
 * It carries nothing private for the same structural reason: it is exactly what
 * the class can already see.
 */
const PP_COLLAPSE_KEY = "bow.teach.projectorPreview.collapsed"; // claim-ok: a localStorage key, never rendered
let ppMountedCode: string | null = null;
let ppObserver: ResizeObserver | null = null;

function ppRescale(): void {
  const frame = $("ppFrame");
  const width = frame.getBoundingClientRect().width;
  if (width <= 0) return;
  // The board is authored at 1280x720 and is NOT reflowed to fit this box:
  // a preview that re-laid itself out would stop being a preview.
  frame.style.setProperty("--pp-scale", String(width / 1280));
}

function mountProjectorPreview(code: string | null): void {
  if (!code) {
    projPreviewEl.hidden = true;
    ppMountedCode = null;
    ($("ppBoard") as HTMLIFrameElement).removeAttribute("src");
    return;
  }
  projPreviewEl.hidden = false;
  if (ppMountedCode !== code) {
    ppMountedCode = code;
    // Set once per session. Re-assigning `src` on every poll would reload the
    // board four hundred times a class and guarantee it is showing a blank
    // frame at the exact moment a teacher looks at it.
    // `preview=1` marks this mirror as the console's own, so it is not counted
    // as a projector watching the room — see BOARD LIVE above.
    ($("ppBoard") as HTMLIFrameElement).src = `/board?code=${encodeURIComponent(code)}&preview=1`; // claim-ok: a query flag, never rendered
    ($("ppOpen") as HTMLAnchorElement).href = `/board?code=${encodeURIComponent(code)}`;
  }
  if (!ppObserver && typeof ResizeObserver !== "undefined") {
    ppObserver = new ResizeObserver(ppRescale);
    ppObserver.observe($("ppFrame"));
  }
  ppRescale();
}

function initProjectorPreview(): void {
  const toggle = $<HTMLButtonElement>("ppToggle");
  const apply = (collapsed: boolean): void => {
    projPreviewEl.classList.toggle("collapsed", collapsed);
    toggle.textContent = collapsed ? "Show" : "Hide";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (!collapsed) ppRescale();
  };
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(PP_COLLAPSE_KEY) === "1";
  } catch {
    /* a console in a locked-down profile still runs the class */
  }
  apply(collapsed);
  toggle.addEventListener("click", () => {
    collapsed = !projPreviewEl.classList.contains("collapsed");
    apply(collapsed);
    try {
      localStorage.setItem(PP_COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* nothing here is worth failing a live class over */
    }
  });
  window.addEventListener("resize", ppRescale);
}

/**
 * THE DESKS — the room, named.
 *
 * The console had a join list of student names with no desks, and a WATCH FOR
 * list of desk handles with no names. A teacher who decided to walk over had to
 * do that join in their head, standing up, mid-class. This is the join done for
 * them: the module's own desk handle, the pair actually sitting there, what the
 * desk is doing right now, and the one thing worth walking over for.
 *
 * The quiet marker is the SERVER's own reading, in buckets: the gap is measured
 * on the clock that stamps `lastSeenAt`, against the same threshold that opens a
 * student's "while you were away" recap. Subtracting a server timestamp from
 * this laptop's Date.now() would read every desk in the room as gone on a
 * Chromebook whose clock had drifted, and a live millisecond count inside an
 * ETagged payload would freeze mid-count and then lie about how long.
 */
let deskFilterOn = false;
let deskLastPayload: TeacherPayload | null = null;

/**
 * CLASS INTELLIGENCE — the patterns the teacher would otherwise have to find by
 * reading sixteen cap sheets from the front of the room.
 *
 * Each item is computed from live state by the module and arrives with the
 * question already written, because "four franchises are chasing a centre" is
 * an observation and "if everybody needs the same thing, what happens to its
 * price?" is a lesson. An intelligence item with no question attached is a
 * dashboard tile, and the module's own tests reject one.
 *
 * MARKET COLLISION is the live one — it is true only while the room is still
 * deciding, and it is the single most useful thing a teacher can know in that
 * window, because it names the argument that is about to happen.
 */
type IntelItem = { kind: string; label: string; text: string; ask: string };

/**
 * WHAT TO SAY NOW — the naming stage's director card.
 *
 * The random-teacher standard (CLAUDE.md §4) is load-bearing here in a way it
 * is not anywhere else in this lesson: a teacher who says "opportunity cost"
 * before a student has said the idea has turned the best moment in the hour
 * into vocabulary. So the console prints the question FIRST, what a right
 * answer sounds like coming out of a twelve-year-old, and what must not be
 * explained yet — and only then the term, so the teacher's own eye meets it in
 * the same order the room will.
 */
function renderNaming(payload: TeacherPayload): void {
  const el = document.getElementById("naming");
  if (!el) return;
  const n = payload.view["naming"] as Record<string, unknown> | null | undefined;
  if (!n || payload.session.ended) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const s = (k: string): string => (typeof n[k] === "string" ? (n[k] as string) : "");
  const i = typeof n["index"] === "number" ? (n["index"] as number) : 0;
  const c = typeof n["count"] === "number" ? (n["count"] as number) : 1;
  const left = Math.max(0, c - i - 1);
  const set = (id: string, text: string): void => {
    const t = document.getElementById(id);
    if (t) t.textContent = text;
  };
  set("namingCount", left === 0 ? `last one \u2014 ${i + 1} of ${c}` : `${i + 1} of ${c} \u2014 ${left} still to come`);
  set("namingMoment", s("moment"));
  set("namingAsk", s("ask"));
  set("namingListen", s("listenFor"));
  set("namingHold", s("hold"));
  const term = document.getElementById("namingTerm");
  if (term) {
    term.innerHTML = `${escapeHtml(s("term"))}<small>${escapeHtml(s("means"))}</small>`;
  }
}

function renderIntel(payload: TeacherPayload): void {
  const el = document.getElementById("intel");
  if (!el) return;
  const items = (payload.view["intel"] as IntelItem[] | undefined) ?? null;
  if (!Array.isArray(items) || items.length === 0 || payload.session.ended) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const count = document.getElementById("intelCount");
  if (count) {
    count.textContent =
      items.length === 1 ? "one thing worth saying out loud" : `${items.length} things worth saying out loud`;
  }
  const list = document.getElementById("intelList");
  if (!list) return;
  list.innerHTML = items
    .map(
      (i) => `<div class="intel-item" data-kind="${escapeHtml(i.kind)}">
        <span class="intel-label">${escapeHtml(i.label)}</span>
        <p class="intel-text">${escapeHtml(i.text)}</p>
        <p class="intel-ask">${escapeHtml(i.ask)}</p>
      </div>`,
    )
    .join("");
}

function renderDesks(payload: TeacherPayload): void {
  const strip = (payload.view["deskStrip"] as DeskStrip | null | undefined) ?? null;
  const ended = payload.session.ended;
  // `gate-l2-teacher` (REQUIRED). This whole panel used to stand down the
  // instant PLAY ended, which is exactly when a device dying stops being
  // visible: a pair whose Chromebook goes dark in REVEAL sits through the
  // reveal, the argument and the synthesis with a black screen, and the console
  // said nothing. Decision state IS stale once the window closes — nobody is
  // "still dialling" during REVEAL — but device health is not.
  const playing = payload.session.phase === "PLAY";
  if (!strip || ended || strip.entries.length === 0) {
    desksEl.hidden = true;
    deskLastPayload = null;
    return;
  }

  const seatById = new Map(payload.seats.map((s) => [s.id, s]));
  const QUIET_WORDS = ["", "Device quiet 30s+", "Device quiet 1m+", "Device quiet 5m+", "Device quiet 15m+"] as const;
  const quietOf = (seatId: string): string | null => {
    const bucket = seatById.get(seatId)?.quietBucket ?? 0;
    return bucket > 0 ? QUIET_WORDS[bucket]! : null;
  };

  const all = strip.entries.map((e) => {
    const quiet = quietOf(e.seatId);
    // A note is not automatically a reason to walk over — the module says which
    // of its notes are (`flag`). Context on a chip is for reading the desk's
    // books, not for pulling the teacher out of the front of the room.
    // Outside PLAY only the device matters: the decision states below are the
    // last closed round's, and chasing a desk about them would be wrong.
    const needsMe = quiet !== null || (playing && (e.state === "deciding" || e.state === "auto" || e.flag));
    return { ...e, quiet, needsMe, who: seatById.get(e.seatId)?.displayName ?? null };
  });
  // Outside PLAY this is a device-health strip, not a walk-to list: it appears
  // only when something is actually dark, and shows only what is dark.
  const rows = playing ? all : all.filter((r) => r.quiet !== null);
  if (rows.length === 0) {
    desksEl.hidden = true;
    deskLastPayload = null;
    return;
  }
  desksEl.hidden = false;
  deskLastPayload = payload;
  $("deskCount").textContent = playing
    ? strip.countLine
    : `${rows.length} device${rows.length === 1 ? "" : "s"} has gone quiet since the window closed`;

  const attention = rows.filter((r) => r.needsMe).length;
  const shown = deskFilterOn && playing ? rows.filter((r) => r.needsMe) : rows;

  $("deskGrid").innerHTML = shown
    .map((r) => {
      const cls = r.quiet !== null ? "desk-chip quiet" : r.needsMe ? "desk-chip attn" : "desk-chip";
      const quiet = r.quiet !== null ? `<span class="dk-quiet">${escapeHtml(r.quiet)}</span>` : "";
      // A seat with no name is a device that joined without one, not an error.
      const who = r.who ? escapeHtml(r.who) : "\u2014";
      return `<div class="${cls}">
        <span class="dk-handle">${escapeHtml(r.label)}</span>
        <span class="dk-who">${who}</span>
        <span class="dk-row"><span class="dk-state">${escapeHtml(r.stateLabel)}</span>${quiet}</span>
        ${r.note ? `<span class="dk-note">${escapeHtml(r.note)}</span>` : ""}
      </div>`;
    })
    .join("");

  const filterBtn = $<HTMLButtonElement>("deskFilter");
  filterBtn.hidden = attention === 0 || !playing;
  filterBtn.setAttribute("aria-pressed", deskFilterOn ? "true" : "false");
  filterBtn.textContent = deskFilterOn ? `Show all ${rows.length}` : `Only the ${attention} that need me`;

  $("deskNote").textContent = !playing
    ? "The window is closed, so nothing here is about a decision \u2014 these are devices that have stopped talking to the room. Their screens may be dark for the reveal. This list is yours alone \u2014 real names never reach the projector."
    : attention === 0
      ? "Every desk is committed and every device is still talking to the room. Nothing here needs you."
      : `${attention} of ${rows.length} desk${rows.length === 1 ? "" : "s"} could use you. This list is yours alone \u2014 real names never reach the projector.`;
}

function renderLiveRoom(payload: TeacherPayload): void {
  const room = (payload.view["room"] as RoomRead | null | undefined) ?? null;
  const live = !payload.session.ended && payload.session.phase === "PLAY";
  if (!room || !live || room.deskCount === 0) {
    liveRoomEl.hidden = true;
    return;
  }
  liveRoomEl.hidden = false;
  // The heading is the module's own sentence. "Locked in" is not universal —
  // one lesson's desks propose a number at the league rather than committing a
  // dial — and the renderer is not the place that decides what a desk did.
  $("roomCount").textContent = room.countLine;

  // The spread sentence, with the numbers pulled out so they read at a glance
  // from a standing teacher's distance rather than being buried in prose.
  $("roomSpread").innerHTML = escapeHtml(room.spreadLine).replace(/\$\d+|\d+%/g, (m) => `<b>${m}</b>`);

  const peak = Math.max(1, ...room.bins.map((b) => b.count));
  $("roomHist").innerHTML = room.bins
    .map((b) => {
      const deciding = b.count - b.lockedCount;
      const unit = 100 / peak;
      // A locked desk and a desk sitting on a dial it has not committed are
      // different facts. Stacked rather than merged: the solid part of a bar is
      // decisions, the ghosted part is where the undecided dials happen to be.
      const title =
        b.count === 0
          ? `${b.label}: nobody`
          : `${b.label}: ${b.handles.join(", ")}${deciding > 0 ? ` (${b.lockedCount} locked, ${deciding} still deciding)` : ""}`;
      return `<span class="room-bar${b.count === 0 ? " empty" : ""}" title="${escapeHtml(title)}">
        <u>${b.count === 0 ? "" : b.count}</u>
        <i class="ghost" style="height:${deciding === 0 ? 0 : Math.max(3, deciding * unit)}%;"></i>
        <i style="height:${b.lockedCount === 0 ? (b.count === 0 ? 2 : 0) : Math.max(3, b.lockedCount * unit)}%;"></i>
      </span>`;
    })
    .join("");
  $("roomAxis").innerHTML = room.bins.map((b) => `<span>${escapeHtml(b.label)}</span>`).join("");

  const chips: string[] = [];
  if (room.movement.basis > 0) {
    chips.push(`<span class="room-chip"><b>${room.movement.raised}</b> raised \u25b2</span>`);
    chips.push(`<span class="room-chip"><b>${room.movement.held}</b> held =</span>`);
    chips.push(`<span class="room-chip"><b>${room.movement.lowered}</b> lowered \u25bc</span>`);
  }
  // Locked, but against a night the bell committed for them. Kept out of the
  // three counts on purpose — see roomRead() — and named so a teacher does not
  // wonder why the numbers do not add up to the room.
  if (room.movement.noOwnPrior > 0) {
    chips.push(`<span class="room-chip"><b>${room.movement.noOwnPrior}</b> off a bell-committed night</span>`);
  }
  // Only when it is not the whole story. On night one every locked desk is in
  // this bucket, the line already says so, and a chip counting it would be a
  // statistic about nothing.
  if (room.movement.noPrior > 0 && !room.firstNight) {
    chips.push(`<span class="room-chip"><b>${room.movement.noPrior}</b> on their first night</span>`);
  }
  if (room.decidingCount > 0) {
    chips.push(`<span class="room-chip deciding"><b>${room.decidingCount}</b> still deciding</span>`);
  }
  $("roomMove").innerHTML = chips.join("");
  $("roomNote").textContent = `${room.movementLine} ${room.privacyNote}`;
}

function renderTimeCut(payload: TeacherPayload): void {
  const round = payload.round;
  const cut = payload.timeCut;
  // No round contract, or no round open (the lesson is between rounds, or out
  // of PLAY entirely): the panel is not applicable and is not shown. An empty
  // "time cut" card in SYNTHESIS is noise a teacher has to learn to ignore.
  if (!round || payload.session.ended) {
    timeCutEl.hidden = true;
    stopTimeCutClock();
    timeCutConfirm = null;
    return;
  }
  timeCutEl.hidden = false;

  const calling = round.status === "FINAL_CALL";
  timeCutEl.classList.toggle("calling", calling);
  $("tcState").textContent =
    round.status === "CLOSED"
      ? "closed — waiting for the next round"
      : calling
        ? "final call running — decisions are still being taken"
        : "open — the room is deciding";

  if (calling && round.endsAt) {
    // One conversion, from a server-measured duration to a local deadline.
    const remaining = Date.parse(round.endsAt) - Date.parse(round.serverNow);
    timeCutDeadline = Date.now() + Math.max(0, remaining);
    if (timeCutTimer === null) timeCutTimer = setInterval(paintTimeCutClock, 250);
    paintTimeCutClock();
  } else {
    stopTimeCutClock();
    paintTimeCutClock();
  }

  const open = round.status !== "CLOSED";
  $<HTMLButtonElement>("btnFinalCall").disabled = !open || calling;
  $<HTMLButtonElement>("btnCloseNow").disabled = !open;
  $<HTMLButtonElement>("btnCancelFinalCall").disabled = !calling;
  $<HTMLButtonElement>("btnCancelFinalCall").hidden = !calling;

  const policyEl = $("tcPolicy");
  const listEl = $("tcUnresolved");
  listEl.innerHTML = "";
  if (!cut) {
    policyEl.textContent = "";
    timeCutConfirm = null;
    return;
  }
  timeCutConfirm = { unresolvedCount: cut.unresolved.length, policy: cut.policy };
  policyEl.textContent = cut.policy;
  if (cut.unresolved.length === 0) {
    const ok = document.createElement("p");
    ok.className = "tc-ok";
    ok.textContent = `Every desk is in — ${cut.resolvedCount} of ${cut.resolvedCount}. Closing now takes nothing away from anybody.`;
    listEl.appendChild(ok);
    return;
  }
  const head = document.createElement("p");
  head.className = "tc-ok";
  head.textContent = `${cut.resolvedCount} in · ${cut.unresolved.length} still deciding. Close now and this is what happens to them:`;
  listEl.appendChild(head);
  const ul = document.createElement("ul");
  ul.className = "tc-list";
  for (const seat of cut.unresolved) {
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = seat.label;
    li.appendChild(b);
    li.appendChild(document.createTextNode(` — ${seat.fallback}`));
    ul.appendChild(li);
  }
  listEl.appendChild(ul);
}

/**
 * THE PRESS CONFERENCE panel — the console's half of a server-owned
 * primitive. This never decides who goes to the podium; it only shows the
 * shortlist the lesson's own state proposes (ranked by the module, not by
 * this file) and a manual picker over every seat, for the desk the module
 * did not think to propose. Teacher-private throughout: display names are
 * fine here and nowhere else this feature reaches.
 */
function renderPressConference(payload: TeacherPayload): void {
  if (payload.session.ended) {
    pressConfEl.hidden = true;
    return;
  }
  pressConfEl.hidden = false;
  const spotlight = payload.spotlight;
  const invite = payload.pressInvite;
  const state = $("pcState");
  const clockNote = $("pcClockNote");
  const endBtn = $<HTMLButtonElement>("btnEndPressConference");
  const cancelBtn = $<HTMLButtonElement>("btnCancelInvite");
  endBtn.disabled = !spotlight;
  cancelBtn.disabled = !invite;

  if (spotlight) {
    state.textContent = `at the podium: ${spotlight.label}`;
    // The clock is stopped for the whole room, not only the podium desk — a
    // press conference IS a pause. If a final call was running when the
    // teacher called it, `pausedAt` marks the instant it stopped moving, and
    // the seconds it had left are frozen there until "End press conference".
    const round = payload.round;
    if (round?.status === "FINAL_CALL" && round.endsAt && payload.session.pausedAt) {
      const leftMs = Math.max(0, Date.parse(round.endsAt) - Date.parse(payload.session.pausedAt));
      clockNote.textContent = `the clock is stopped; ${Math.round(leftMs / 1000)}s were left on the final call.`;
      clockNote.hidden = false;
    } else {
      clockNote.hidden = true;
    }
  } else if (invite) {
    // §12.2 INVITE FIRST: the podium has not gone live yet — the room keeps
    // running while this desk decides. Nothing is paused, so the clock note
    // never applies here.
    state.textContent = `invited — waiting: ${invite.label}`;
    clockNote.hidden = true;
  } else {
    state.textContent = "not running";
    clockNote.hidden = true;
  }

  const listEl = $("pcCandidates");
  listEl.innerHTML = "";
  if (payload.pressCandidates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "tc-ok";
    empty.textContent = "Nothing in this lesson's state stands out yet — use the picker below for any desk.";
    listEl.appendChild(empty);
  } else {
    const ul = document.createElement("ul");
    ul.className = "pc-cand-list";
    for (const c of payload.pressCandidates) {
      const li = document.createElement("li");
      li.className = "pc-cand";
      const text = document.createElement("span");
      const b = document.createElement("b");
      b.textContent = c.label;
      text.appendChild(b);
      text.appendChild(document.createTextNode(` — `));
      // The candidate's own `why` seeds the suggested first question — the
      // console never invents reasoning of its own.
      const why = document.createElement("span");
      why.className = "pc-cand-why";
      why.textContent = c.why;
      text.appendChild(why);
      if (c.declined) {
        const d = document.createElement("span");
        d.className = "pc-cand-declined";
        d.textContent = " — has used its one decline";
        text.appendChild(d);
      }
      li.appendChild(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      const isHere = spotlight?.seatId === c.seatId;
      const isInvited = invite?.seatId === c.seatId;
      btn.textContent = isHere ? "At the podium" : isInvited ? "Invited — waiting" : "Invite to podium";
      btn.disabled = isHere || isInvited || Boolean(spotlight) || Boolean(invite);
      btn.addEventListener("click", () =>
        void sendControl({ type: "invitePress", seatId: c.seatId, question: $<HTMLInputElement>("pcQuestion").value.trim() || c.why }),
      );
      li.appendChild(btn);
      ul.appendChild(li);
    }
    listEl.appendChild(ul);
  }

  // The manual picker: every seat, labelled by the module's own shortlist
  // when it has an opinion about that seat, and by the roster's display name
  // (teacher-private, same as everywhere else on this console) otherwise.
  const labelFor = new Map(payload.pressCandidates.map((c) => [c.seatId, c.label] as const));
  const picker = $<HTMLSelectElement>("pcSeatPicker");
  const prior = picker.value;
  picker.innerHTML = "";
  for (const seat of payload.seats) {
    const opt = document.createElement("option");
    opt.value = seat.id;
    opt.textContent = labelFor.get(seat.id) ?? seat.displayName;
    picker.appendChild(opt);
  }
  if (prior && payload.seats.some((s) => s.id === prior)) picker.value = prior;
  const pickerRow = $("pcPickerRow");
  pickerRow.hidden = payload.seats.length === 0;
  const invitePickedBtn = $<HTMLButtonElement>("btnPcInvitePicked");
  const callPickedBtn = $<HTMLButtonElement>("btnPcCallPicked");
  invitePickedBtn.disabled = Boolean(spotlight) || Boolean(invite);
  callPickedBtn.disabled = Boolean(spotlight);
}

function render(payload: TeacherPayload): void {
  statusEl.textContent = `live · v${payload.session.version}${pushLive ? "" : " · polling"}`;
  lastCheckpointLabel = payload.session.checkpointLabel;

  // Is a projector actually watching this room? The console can see every
  // reveal land in its own preview iframe and still be talking to a dark wall:
  // the preview is THIS laptop's copy of /board, not the one on the projector.
  const ppLive = document.getElementById("ppLive");
  if (ppLive) {
    const bucket = payload.session.boardSeenBucket ?? 2;
    ppLive.className = `pp-live ${bucket === 0 ? "on" : bucket === 1 ? "stale" : "off"}`;
    ppLive.textContent = bucket === 0 ? "BOARD LIVE" : bucket === 1 ? "BOARD QUIET" : "BOARD NOT SEEN";
    ppLive.title =
      bucket === 0
        ? "A projector polled this room in the last few seconds."
        : bucket === 1
          ? "No projector has polled for a while. It may be asleep or on a different session."
          : "No projector is polling this room. Check the cable, the display, and that /board is open on this session's code before you say \u201clook at the board\u201d.";
  }
  const s = payload.session;
  const pillClass = s.ended ? "ended" : s.frozen ? "frozen" : s.paused ? "paused" : "live";
  const pillText = s.ended ? "ENDED" : s.frozen ? "FROZEN" : s.paused ? "PAUSED" : "LIVE";
  const pill = $("statePill");
  pill.className = `pill pill-${pillClass === "live" ? "comfortable" : pillClass === "paused" ? "tight" : "at-cap"}`;
  pill.textContent = pillText;
  $("seatCount").textContent = `${payload.seats.length} joined`;
  renderTimeCut(payload);
  renderPressConference(payload);
  renderLiveRoom(payload);
  renderNaming(payload);
  renderIntel(payload);
  renderDesks(payload);
  // The preview lives for the whole session, not just PLAY — REVEAL through
  // SYNTHESIS is exactly when the projector IS the lesson. It goes away when
  // the session does, so an ended room cannot leave a stale board on the
  // console next to controls that no longer do anything.
  if (s.ended) mountProjectorPreview(null);

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
  // Freeze sets BOTH `frozen` and `paused`, so while the room is frozen this
  // button read "Unpause" — and pressing it cleared only `paused`, flipping the
  // label to "Pause" (which reads as "the room is live") while every student
  // device still said FROZEN and the board still said FROZEN. The same failure
  // shape as the unfreeze defect already repaired in sessionService; this is
  // its pause arm. Freeze owns the room while it holds it: pause is inert until
  // the teacher unfreezes, and says which control to use.
  $<HTMLButtonElement>("btnPause").disabled = s.ended || s.frozen;
  $<HTMLButtonElement>("btnPause").textContent = s.frozen ? "Frozen — use Unfreeze" : s.paused ? "Unpause" : "Pause";
  $<HTMLButtonElement>("btnFreeze").disabled = s.ended;
  $<HTMLButtonElement>("btnFreeze").textContent = s.frozen ? "Unfreeze" : "Freeze";
  // "Restore last good state" told the teacher nothing about WHICH state, and
  // undo with no idea what it undoes is not a recovery mechanism. The server
  // now labels every checkpoint with the action it precedes.
  const restoreBtn = $<HTMLButtonElement>("btnRestore");
  restoreBtn.disabled = !s.hasCheckpoint;
  restoreBtn.textContent = s.checkpointLabel ? `Undo: ${s.checkpointLabel}` : "Restore last good state";
  $<HTMLButtonElement>("btnEnd").disabled = s.ended;
  // The shock is Draft Day's own consequence hook and only ever makes sense in CONSEQUENCE.
  // The Box Office needs neither manual hook — its CONSEQUENCE and COUNTERFACTUAL states are
  // computed automatically from the price/zone already stored at lock time, not teacher-triggered.
  const isDraftDay = s.lessonModuleId === DRAFT_DAY_ID;
  const isTradeDeadline = s.lessonModuleId === TRADE_DEADLINE_ID;
  const isFreeAgency = s.lessonModuleId === FREE_AGENCY_ID;
  const isTheWindow = s.lessonModuleId === THE_WINDOW_ID;
  const isFullHouse = s.lessonModuleId === FULL_HOUSE_ID;
  const isHostLeague = s.lessonModuleId === HOST_LEAGUE_ID;
  const isWriteRule = s.lessonModuleId === WRITE_RULE_ID;
  const isTheSeason = s.lessonModuleId === THE_SEASON_ID;
  const isTheDeadline = s.lessonModuleId === THE_DEADLINE_ID;
  $<HTMLButtonElement>("btnShock").hidden = !isDraftDay;
  $<HTMLButtonElement>("btnShock").disabled = s.ended || s.phase !== "CONSEQUENCE";
  $<HTMLButtonElement>("btnCounterfactual").hidden =
    isDraftDay || isTradeDeadline || isFreeAgency || isFullHouse || isHostLeague || s.lessonModuleId === "m2-box-office";
  if (isWriteRule) {
    // M2 L3 owns a real COUNTERFACTUAL phase: the season replayed under the
    // runner-up share with every pair's actions held fixed.
    const cf = $<HTMLButtonElement>("btnCounterfactual");
    cf.hidden = false;
    cf.disabled = s.ended || s.phase !== "COUNTERFACTUAL" || Boolean(payload.view["counterfactualRun"]);
    cf.textContent = payload.view["counterfactualRun"] ? "The replay is on the projector" : "Replay the season under the runner-up rule";
  }
  // The staged per-target auction theater (charter point 6, and L3's own staged finale): one click reveals
  // exactly the next not-yet-revealed step, so the teacher paces the reveal instead of dumping every result
  // at once. Same control, same label, works for both lessons' own reveal-staging counters.
  $<HTMLButtonElement>("btnRevealNext").hidden =
    !isTradeDeadline && !isFreeAgency && !isFullHouse && !isHostLeague && !isWriteRule && !isTheWindow && !isTheSeason && !isTheDeadline;
  /* THE SAME LINE walks beats in three phases, not one: the four reveal beats,
     then CONSEQUENCE, then the naming — where the teacher advances one concept
     at a time and the count is however many the room EARNED. Leaving this rule
     at REVEAL-only disabled the only control that moves the naming forward, so
     a teacher reached the stage and could not run it. */
  /* THE SEASON (W2) walks three HOOK beats and then the naming; THE DEADLINE
     (W3) walks only the naming. Neither has a staged REVEAL of its own, so the
     press is disabled there — the button says which control moves the room. */
  const seasonNaming = payload.view["naming"] as { index?: number; count?: number } | null | undefined;
  const seasonBeatsLeft = isTheSeason && s.phase === "HOOK" ? Math.max(0, Number(payload.view["beatCount"] ?? 3) - Number(payload.view["beat"] ?? 0) - 1) : 0;
  const namesLeft = seasonNaming ? Math.max(0, Number(seasonNaming.count ?? 1) - Number(seasonNaming.index ?? 0) - 1) : 0;
  $<HTMLButtonElement>("btnRevealNext").disabled =
    s.ended ||
    (isTheSeason
      ? !((s.phase === "HOOK" && seasonBeatsLeft > 0) || (s.phase === "SYNTHESIS" && namesLeft > 0))
      : isTheDeadline
        ? !(s.phase === "SYNTHESIS" && namesLeft > 0)
        : s.phase !== "REVEAL" && !(isTheWindow && (s.phase === "CONSEQUENCE" || s.phase === "SYNTHESIS")));
  {
    // gate-l1-teacher TT-B2 / gate-l1-projector repair 5: "Reveal next" was a
    // blind press seven times running. Name what the press will put up, with
    // its number, to the same standard as the night bell's label.
    const btn = $<HTMLButtonElement>("btnRevealNext");
    const next = payload.view["nextRevealStage"] as { stage: number; name: string } | null | undefined;
    const total = Number(payload.view["totalRevealSteps"] ?? 0);
    btn.textContent = isFullHouse || isHostLeague || isWriteRule
      ? next
        ? `Reveal ${next.stage} of ${total} — ${next.name}`
        : "Every reveal has played"
      : isTheSeason && s.phase === "HOOK"
        ? seasonBeatsLeft === 0
          ? "That was the last beat — advance the phase"
          : `Next beat (${seasonBeatsLeft} to go)`
        : (isTheSeason || isTheDeadline) && s.phase === "SYNTHESIS"
          ? seasonNaming === null || seasonNaming === undefined
            ? "This room earned no naming"
            : namesLeft === 0
              ? "That was the last one"
              : `Next name (${namesLeft} to go)`
          : (isTheSeason || isTheDeadline)
            ? "Nothing to reveal in this phase"
            : isTheWindow && s.phase === "SYNTHESIS"
        ? (() => {
            // At the naming the press is not "reveal next", it is "say the next
            // one" — and a teacher pressing it needs to know how many are left
            // before they decide the room is done arguing about this one.
            const n = payload.view["naming"] as { index?: number; count?: number } | null | undefined;
            const left = n ? Math.max(0, Number(n.count ?? 1) - Number(n.index ?? 0) - 1) : 0;
            return left === 0 ? "That was the last one" : `Next name (${left} to go)`;
          })()
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
  // M2 L2's own pacing controls: the week bell (every building in the league
  // settles at once against the Draws printed before anybody touched a dial)
  // and the manual Handed-To-You release, which is the mid-lesson reveal the
  // room plays its last week under. Both teacher-triggered, never timed;
  // leaving PLAY fires both automatically so nothing can be stranded.
  {
    const closeWeek = $<HTMLButtonElement>("btnCloseWeek");
    const handedTo = $<HTMLButtonElement>("btnHandedTo");
    closeWeek.hidden = !isHostLeague && !isWriteRule;
    handedTo.hidden = !isHostLeague;
    if (isWriteRule) {
      // M2 L3's season bell. Same control, same confirm discipline; the module
      // supplies both the label and the consequence-stating warning.
      const allDone = Boolean(payload.view["allWeeksDone"]);
      closeWeek.disabled = s.ended || s.phase !== "PLAY" || allDone || !payload.view["seasonOpen"];
      closeWeek.innerHTML = allDone
        ? `${BELL_GLYPH}All three weeks are in the books`
        : `${BELL_GLYPH}Close week ${escapeHtml(String(payload.view["weekNumber"]))} (${escapeHtml(String(payload.view["lockedCount"]))}/${escapeHtml(String(payload.view["deskCount"]))} locked)`;
      closeWeek.title = String(payload.view["bellNote"] ?? "");
      closeWeekWarn = (payload.view["closeWeekWarn"] as string | null) ?? null;
    }
    if (isHostLeague) {
      const allDone = Boolean(payload.view["allWeeksDone"]);
      closeWeek.disabled = s.ended || s.phase !== "PLAY" || allDone;
      closeWeek.innerHTML = allDone
        ? `${BELL_GLYPH}All three weeks are in the books`
        : `${BELL_GLYPH}Close week ${escapeHtml(String(payload.view["weekNumber"]))} (${escapeHtml(String(payload.view["lockedCount"]))}/${escapeHtml(String(payload.view["deskCount"]))} locked)`;
      closeWeek.title = String(payload.view["bellNote"] ?? "");
      // gate-l2-teacher N5: Advance and Jump to REVEAL both carry
      // consequence-stating confirms; the bell carried none, and pressing it
      // with nobody locked settles the whole league at house price instantly.
      // That is the misclick most likely early in a period.
      closeWeekWarn =
        !allDone && Number(payload.view["lockedCount"] ?? 0) === 0 && Number(payload.view["deskCount"] ?? 0) > 0
          ? `Nobody has locked in yet — 0 of ${payload.view["deskCount"]} desks. This is the week bell: it settles week ${payload.view["weekNumber"]} for every building in the league right now, and every desk that has not locked settles at its club's house price with nothing reinvested, marked AUTO. Ring it anyway?`
          : null;
      handedTo.disabled = s.ended || !payload.view["barAvailable"] || (s.phase !== "PLAY" && s.phase !== "REVEAL");
      handedTo.textContent = payload.view["barReleased"] ? "The bar is on the projector" : "Release the Handed-To-You bar";
      handedTo.title = String(payload.view["barReason"] ?? "");
    }
  }
  // The bar is paged for the same reason L1's repeat card is: the rows scale
  // with the class and the projector does not.
  {
    const barPage = $<HTMLButtonElement>("btnBarPage");
    const barBack = $<HTMLButtonElement>("btnBarPageBack");
    const paged = isHostLeague && (s.phase === "PLAY" || s.phase === "REVEAL" || s.phase === "ADAPT");
    barPage.hidden = !paged;
    barBack.hidden = !paged;
    if (paged) {
      const available = Boolean(payload.view["barPageAvailable"]);
      barPage.disabled = s.ended || !available;
      barBack.disabled = s.ended || !available;
      barPage.textContent = String(payload.view["barNextPageLabel"] ?? "Next group of desks");
      barBack.textContent = String(payload.view["barPrevPageLabel"] ?? "Back a group");
      barPage.title = String(payload.view["barPageNote"] ?? "");
      barBack.title = String(payload.view["barPageNote"] ?? "");
    }
  }
  // `gate-l1-play` recheck3 P11-b: the COUNTERFACTUAL repeat card is paged so
  // every row stays fully on the projector at class size. The teacher walks the
  // groups; the control names what the next press will put up, to the same
  // standard as the reveal button and the bell.
  {
    const cfPage = $<HTMLButtonElement>("btnCfPage");
    const cfBack = $<HTMLButtonElement>("btnCfPageBack");
    const synthPage = $<HTMLButtonElement>("btnSynthPage");
    const synthBack = $<HTMLButtonElement>("btnSynthPageBack");
    const pagerNow = $("pagerNow");
    cfPage.hidden = !isFullHouse || s.phase !== "COUNTERFACTUAL";
    cfBack.hidden = cfPage.hidden;
    synthPage.hidden = !(isFullHouse || isHostLeague || isWriteRule) || s.phase !== "SYNTHESIS";
    synthBack.hidden = synthPage.hidden;
    pagerNow.hidden = cfPage.hidden && synthPage.hidden && !(isHostLeague && (s.phase === "PLAY" || s.phase === "REVEAL" || s.phase === "ADAPT"));
    if (isWriteRule) {
      const synthAvailable = Boolean(payload.view["synthPageAvailable"]);
      synthPage.disabled = s.ended || !synthAvailable;
      synthBack.disabled = s.ended || !synthAvailable;
      synthPage.textContent = String(payload.view["synthNextLabel"] ?? "Next card");
      synthBack.textContent = String(payload.view["synthPrevLabel"] ?? "Back a card");
      synthPage.title = String(payload.view["synthPageNote"] ?? "");
      synthBack.title = String(payload.view["synthPageNote"] ?? "");
      pagerNow.textContent = s.phase === "SYNTHESIS" ? String(payload.view["synthCurrentLabel"] ?? "") : "";
    }
    if (isHostLeague) {
      const synthAvailable = Boolean(payload.view["synthPageAvailable"]);
      synthPage.disabled = s.ended || !synthAvailable;
      synthBack.disabled = s.ended || !synthAvailable;
      synthPage.textContent = String(payload.view["synthNextLabel"] ?? "Next card");
      synthBack.textContent = String(payload.view["synthPrevLabel"] ?? "Back a card");
      synthPage.title = String(payload.view["synthPageNote"] ?? "");
      synthBack.title = String(payload.view["synthPageNote"] ?? "");
      pagerNow.textContent =
        s.phase === "SYNTHESIS"
          ? String(payload.view["synthCurrentLabel"] ?? "")
          : String(payload.view["barCurrentPageLabel"] ?? "");
    }
    if (isFullHouse) {
      const available = Boolean(payload.view["cfPageAvailable"]);
      cfPage.disabled = s.ended || !available;
      cfPage.textContent = String(payload.view["cfNextPageLabel"] ?? "Next group of desks");
      cfPage.title = String(payload.view["cfPageNote"] ?? "");
      // W3-2: a back control, and a readout of the group that is up RIGHT NOW —
      // the room's own evidence, not only the next press.
      cfBack.disabled = s.ended || !available;
      cfBack.textContent = String(payload.view["cfPrevPageLabel"] ?? "Back a group");
      cfBack.title = String(payload.view["cfPageNote"] ?? "");
      const synthAvailable = Boolean(payload.view["synthPageAvailable"]);
      synthPage.disabled = s.ended || !synthAvailable;
      synthBack.disabled = s.ended || !synthAvailable;
      synthPage.textContent = String(payload.view["synthNextLabel"] ?? "Next card");
      synthBack.textContent = String(payload.view["synthPrevLabel"] ?? "Back a card");
      synthPage.title = String(payload.view["synthPageNote"] ?? "");
      synthBack.title = String(payload.view["synthPageNote"] ?? "");
      pagerNow.textContent =
        s.phase === "COUNTERFACTUAL"
          ? String(payload.view["cfCurrentPageLabel"] ?? "")
          : s.phase === "SYNTHESIS"
            ? String(payload.view["synthCurrentLabel"] ?? "")
            : "";
    }
  }
  // W5 THE POOL — six teacher presses inside REVEAL, after the season
  // reveal's own five stages have played. Same discipline as the bell and the
  // Handed-To-You release: the button names the next stage, and paging is
  // gated to the one stage the reducer allows it on (NET).
  {
    const poolStage = $<HTMLButtonElement>("btnPoolStage");
    const poolPage = $<HTMLButtonElement>("btnPoolPage");
    const poolPageBack = $<HTMLButtonElement>("btnPoolPageBack");
    poolStage.hidden = !isHostLeague || s.phase !== "REVEAL";
    poolPage.hidden = !isHostLeague || s.phase !== "REVEAL" || Number(payload.view["ritualStage"] ?? 0) !== 5;
    poolPageBack.hidden = poolPage.hidden;
    if (isHostLeague && s.phase === "REVEAL") {
      const canAdvance = Boolean(payload.view["ritualCanAdvance"]);
      const nextName = payload.view["ritualNextStageName"] as string | null;
      const stageCount = Number(payload.view["ritualStageCount"] ?? 6);
      poolStage.disabled = s.ended || !canAdvance;
      poolStage.textContent = nextName ? `${nextName} (${Number(payload.view["ritualStage"] ?? 0) + 1} of ${stageCount})` : "Every pool stage has played";
      poolStage.title = String(payload.view["ritualReady"] ?? "");
      if (!poolPage.hidden) {
        poolPage.disabled = s.ended;
        poolPageBack.disabled = s.ended;
        const pageLabel = payload.view["poolRitual"] ? (payload.view["poolRitual"] as { netPageLabel?: string }).netPageLabel : "";
        poolPage.title = pageLabel ? String(pageLabel) : "";
        poolPageBack.title = poolPage.title;
      }
    }
  }
  // M2 L3's own pacing controls. Three buttons, each with a module-supplied
  // consequence-stating confirm, because each of them is irreversible: closing
  // a round records every silent desk at the status quo; the two-thirds test
  // prints the rule the room will play under; the league office's rule replaces
  // the room's own vote; a commit reveal locks out any desk still deciding.
  {
    const ruleStep = $<HTMLButtonElement>("btnRuleStep");
    const realRule = $<HTMLButtonElement>("btnRealRule");
    const commit = $<HTMLButtonElement>("btnCommitReveal");
    const reviewStageBtn = $<HTMLButtonElement>("btnReviewStage");
    ruleStep.hidden = !isWriteRule || s.phase !== "PLAY";
    realRule.hidden = !isWriteRule || s.phase !== "PLAY";
    commit.hidden = !isWriteRule || (s.phase !== "HOOK" && s.phase !== "ARGUE");
    reviewStageBtn.hidden = !isWriteRule || s.phase !== "ARGUE";
    if (isWriteRule) {
      // Wave 3b: THE FLOOR's own console (`floorRound`) is non-null only
      // while institution 2 is being voted, and `stage === "floorAdopted"`
      // covers the one press between the floor's own two-thirds test and the
      // season opening. Neither `ruleStepLabel` nor `ruleStepAvailable` know
      // about the floor — this button's label/hook is derived here instead,
      // the way `ruleStepLabel` itself derives from `state.roundIndex`.
      const stage = String(payload.view["stage"] ?? "");
      const floorRound = payload.view["floorRound"] as { index: number; count: number; proposalCount: number; deskCount: number } | null;
      if (floorRound || stage === "floorAdopted") {
        ruleStepHook = "institutionStep";
        ruleStep.disabled = s.ended || s.phase !== "PLAY";
        ruleStep.textContent = floorRound
          ? floorRound.index < floorRound.count
            ? `Close floor round ${floorRound.index} of ${floorRound.count} (${floorRound.proposalCount}/${floorRound.deskCount} proposals in)`
            : "Set the floor"
          : "Open the season";
        ruleStepWarn = null;
      } else {
        ruleStepHook = "ruleStep";
        ruleStep.disabled = s.ended || s.phase !== "PLAY" || !payload.view["ruleStepAvailable"];
        ruleStep.textContent = String(payload.view["ruleStepLabel"] ?? "Close the round");
        ruleStepWarn = (payload.view["ruleStepWarn"] as string | null) ?? null;
      }
      realRule.disabled = s.ended || s.phase !== "PLAY" || !payload.view["realRuleAvailable"];
      realRule.title = String(payload.view["realRuleWarn"] ?? "");
      realRuleWarn = (payload.view["realRuleWarn"] as string | null) ?? null;
      commit.disabled = s.ended || !payload.view["commitRevealAvailable"];
      commit.textContent = String(payload.view["commitRevealLabel"] ?? "Reveal");
      commitRevealWarn = (payload.view["commitRevealWarn"] as string | null) ?? null;
      const reviewStage = payload.view["reviewStage"] as { index: number; count: number; stageName: string } | null;
      if (reviewStage && !reviewStageBtn.hidden) {
        reviewStageBtn.disabled = s.ended;
        reviewStageBtn.textContent = `Show ${reviewStage.stageName} (${reviewStage.index + 1} of ${reviewStage.count})`;
      }
    }
  }
  // L3's own market day-close hook (charter §2): resolves every still-open agent for the currently open day,
  // simultaneously and deterministically, then advances the day counter. A close with zero offers is legal.
  $<HTMLButtonElement>("btnCloseDay").hidden = !isFreeAgency && !isTheWindow && !isTheSeason && !isTheDeadline;
  $<HTMLButtonElement>("btnCloseDay").disabled = isTheSeason
    ? // W2: the bell closes whichever window is open — January's ten-days in
      // PLAY, February's buyouts in ADAPT. `round` is null once it has rung.
      s.ended || (s.phase !== "PLAY" && s.phase !== "ADAPT") || payload.view["round"] === null || Boolean(payload.view["windowClosed"])
    : isTheDeadline
      ? s.ended || s.phase !== "PLAY" || Boolean(payload.view["marketClosed"])
      : s.ended || s.phase !== "PLAY" || Boolean(payload.view["windowClosed"]);
  {
    const pendingCount = Number(payload.view["pendingCount"] ?? 0);
    const actedCount = Number(payload.view["actedCount"] ?? 0);
    const claimedCount = Number(payload.view["claimedCount"] ?? 0);
    const seasonRound = payload.view["round"];
    const seasonPending = Array.isArray(payload.view["perDesk"])
      ? (payload.view["perDesk"] as { pending?: unknown; waived?: unknown[] }[]).filter((d) => d.pending || (Array.isArray(d.waived) && d.waived.length > 0)).length
      : 0;
    const seasonDesks = Array.isArray(payload.view["perDesk"]) ? (payload.view["perDesk"] as unknown[]).length : 0;
    const hour = Number(payload.view["hour"] ?? 1);
    $<HTMLButtonElement>("btnCloseDay").innerHTML =
      isFreeAgency || isTheWindow
        ? `${BELL_GLYPH}Close signing day (${actedCount}/${claimedCount} acted, ${pendingCount} offer${pendingCount === 1 ? "" : "s"} in)`
        : isTheSeason
          ? seasonRound === "JANUARY"
            ? `${BELL_GLYPH}Close the ten-day window (${seasonPending}/${seasonDesks} desks have a move in)`
            : seasonRound === "FEBRUARY"
              ? `${BELL_GLYPH}Close the buyout window (${seasonPending}/${seasonDesks} desks have a move in)`
              : `${BELL_GLYPH}The window is closed`
          : isTheDeadline
            ? payload.view["marketClosed"]
              ? `${BELL_GLYPH}The deadline has passed`
              : `${BELL_GLYPH}Close hour ${hour} of 2${hour === 2 ? " — the deadline" : ""}`
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
  } else if (isHostLeague && s.phase === "PLAY" && !Boolean(payload.view["allWeeksDone"])) {
    advanceWarnState = {
      kind: "hl-play",
      weekNumber: Number(payload.view["weekNumber"] ?? 1),
      weekCount: Number(payload.view["weekCount"] ?? 3),
      lockedCount: Number(payload.view["lockedCount"] ?? 0),
      deskCount: Number(payload.view["deskCount"] ?? 0),
    };
  } else if (isWriteRule && s.phase === "PLAY" && String(payload.view["stage"] ?? "") !== "seasonDone") {
    const stage = String(payload.view["stage"] ?? "");
    advanceWarnState =
      stage === "season"
        ? {
            kind: "wr-season",
            weekNumber: Number(payload.view["weekNumber"] ?? 1),
            weekCount: Number(payload.view["weekCount"] ?? 3),
            lockedCount: Number(payload.view["lockedCount"] ?? 0),
            deskCount: Number(payload.view["deskCount"] ?? 0),
          }
        : {
            kind: "wr-vote",
            round: Number(payload.view["round"] ?? 1),
            roundCount: Number(payload.view["roundCount"] ?? 3),
            submitted: Number(payload.view["proposalCount"] ?? 0),
            deskCount: Number(payload.view["deskCount"] ?? 0),
            sealed: stage === "adopted",
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
  // THE WINDOW: one student, one franchise (D59). The seat's club sits beside
  // the name, and a seat that has not picked yet says so — the lobby's job is
  // to get every student into a front office before the bell.
  const seatClubs = isTheWindow ? ((payload.view["seatClubs"] as Record<string, string> | undefined) ?? {}) : null;
  for (const seat of payload.seats) {
    const li = document.createElement("li");
    const joined = new Date(seat.joinedAt).toLocaleTimeString();
    const club = seatClubs ? (seatClubs[seat.id] ?? null) : null;
    li.innerHTML = `<span>${escapeHtml(seat.displayName)}${
      seatClubs ? `<span style="color:var(--ink-muted);"> · ${club ? escapeHtml(club) : s.ended ? "no club" : "choosing a club…"}</span>` : ""
    }</span>`;
    const right = document.createElement("span");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "8px";
    // Every seat gets this, in every phase: a device dies when it dies, and the
    // pair whose Chromebook went dark in REVEAL needs it as much as one in PLAY.
    const reseatBtn = document.createElement("button");
    reseatBtn.className = "btn";
    reseatBtn.style.fontSize = "11px";
    reseatBtn.style.padding = "3px 8px";
    reseatBtn.textContent = "Reseat";
    reseatBtn.title = "Their device died — put this pair back in the same desk on another device";
    reseatBtn.addEventListener("click", () => void reseatPair(seat.id, seat.displayName));
    right.appendChild(reseatBtn);
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
  if (DIRECTED_LESSONS.has(String(payload.view["module"]))) {
    directorEl.hidden = false;
    $("directorHeading").textContent = `Directing ${s.phase}`;
    $("directorBody").innerHTML = "";
    $("directorBody").appendChild(renderDirector(payload.view, s.phase, { frozen: s.frozen, paused: s.paused }));
  } else {
    directorEl.hidden = true;
  }

  // Last, deliberately: the deck picks up whichever controls this render just
  // decided are live, so it has to run after every button's state is settled.
  renderDeck(payload);
}

/* ----------------------------------------------------------------- the deck -- */

/**
 * THE DECK — the sticky live bar.
 *
 * The bell is the beat these lessons turn on and the teacher presses it five
 * times in fifty minutes. It was sitting halfway down a 2800px console, below
 * a thousand pixels of director script: a teacher running a room does not
 * scroll to find that.
 *
 * The deck HOSTS its controls, it does not copy them. Each button is MOVED out
 * of its home row and moved back, leaving a comment node behind to mark the
 * spot, so there is exactly one of each button in the document at all times —
 * one node, one listener, one disabled state, and no way to fire the night bell
 * twice because two copies of it disagreed about whether it was still enabled.
 */
const DECK_PRIMARY: readonly string[] = [
  "btnRuleStep", // M2 L3 — close the round, run the two-thirds test, open the season
  "btnCommitReveal", // M2 L3 — the commit-then-reveal beat in HOOK and ARGUE
  "btnCloseNight", // M2 L1 — the night bell
  "btnCloseWeek", // M2 L2 and L3 — the week and season bells
  "btnCloseDay", // M1 L3 — the signing-day bell
  "btnRevealNext", // the staged class reveal
  "btnBarPage", // paged class evidence
  "btnCfPage",
  "btnSynthPage",
  "btnPoolStage", // M2 L2 W5 — THE POOL ritual, one press per stage
];

const PHASE_LABEL: Record<string, string> = {
  LOBBY: "Waiting on the room",
  HOOK: "The hook",
  PLAY: "The window is open",
  REVEAL: "The reveal",
  CONSEQUENCE: "What it cost",
  ADAPT: "Second look",
  COUNTERFACTUAL: "What if",
  ARGUE: "The argument",
  SYNTHESIS: "Naming it",
  COMPLETE: "Class over",
};

const deckEl = $("deck");
const deckSlotEl = $("deckSlot");
/** Where each hosted button came from, so it can be put back exactly. */
const deckHomes = new Map<string, Comment>();
let deckHosting = "";

function hostInDeck(id: string): void {
  const btn = $(id);
  if (deckHomes.has(id)) return;
  const mark = document.createComment(`deck:${id}`);
  btn.parentNode?.insertBefore(mark, btn);
  deckHomes.set(id, mark);
  deckSlotEl.appendChild(btn);
}

function sendHome(id: string): void {
  const mark = deckHomes.get(id);
  if (!mark) return;
  deckHomes.delete(id);
  mark.parentNode?.insertBefore($(id), mark);
  mark.remove();
}

/** Empty the deck and put every button back where the markup had it. */
function clearDeck(): void {
  for (const id of [...deckHomes.keys()]) sendHome(id);
  deckHosting = "";
  deckEl.classList.remove("on", "held");
}

function renderDeck(payload: TeacherPayload): void {
  const s = payload.session;
  if (controlsEl.hidden || s.ended) {
    clearDeck();
    return;
  }

  // Only controls this render left both visible and pressable are worth a
  // teacher's thumb. Two at most: a deck that lists everything is the console
  // we are trying to get out of.
  const live = DECK_PRIMARY.filter((id) => {
    const btn = $<HTMLButtonElement>(id);
    return !btn.hidden && !btn.disabled;
  }).slice(0, 2);
  const wanted = [...live, "btnAdvance"];

  const key = wanted.join(",");
  if (key !== deckHosting) {
    // Move only on a real change. This render runs on every poll, and
    // re-appending a button the teacher is mid-press on would take the click.
    for (const id of [...deckHomes.keys()]) if (!wanted.includes(id)) sendHome(id);
    for (const id of wanted) hostInDeck(id);
    for (const id of wanted) deckSlotEl.appendChild($(id)); // keep deck order stable
    deckHosting = key;
  }

  deckEl.classList.add("on");
  deckEl.classList.toggle("held", s.paused || s.frozen);
  $("deckWhere").textContent = PHASE_LABEL[s.phase] ?? s.phase;
  clockSession = s;
  paintClassMinute();

  const locked = payload.view["lockedCount"];
  const desks = payload.view["deskCount"];
  const sub = s.frozen
    ? "Frozen — every desk is held"
    : s.paused
      ? "Paused — every desk is held"
      : typeof locked === "number" && typeof desks === "number" && s.phase === "PLAY"
        ? `${locked} of ${desks} locked in`
        : `${payload.seats.length} joined`;
  $("deckSub").textContent = sub;
}

/**
 * The class clock.
 *
 * Every lesson's TIME CUT line is written as "past minute 45?", and the console
 * had no clock at all — so the most-repeated pacing instruction in the product
 * was one the teacher had to answer from memory while running seven reveals.
 *
 * Measured against the server's clock, not this laptop's: the offset is read
 * ONCE from the first body that carries `serverNow` and then held, because a
 * conditionally-cached payload cannot keep a live timestamp honest and a
 * Chromebook whose clock is twenty minutes out would otherwise invent a period
 * that started before the teacher arrived.
 */
let clockSkewMs: number | null = null;
/**
 * The clock ticks on its own timer, not on the poll.
 *
 * A conditional poll answers 304 while nothing in the room changes, and during
 * a quiet stretch of PLAY that can be minutes — long enough for a clock that
 * only redraws on a fresh body to sit still at exactly the moment the teacher
 * looks down to answer "past minute 45?".
 */
let clockSession: TeacherPayload["session"] | null = null;
function paintClassMinute(): void {
  const el = document.getElementById("deckMin");
  if (!el) return;
  const minute = clockSession ? classMinute(clockSession) : null;
  el.textContent = minute === null ? "" : `MIN ${minute}`;
}
window.setInterval(paintClassMinute, 15_000);

function classMinute(s: TeacherPayload["session"]): number | null {
  if (!s.createdAt) return null;
  if (clockSkewMs === null && s.serverNow) {
    const server = Date.parse(s.serverNow);
    if (Number.isFinite(server)) clockSkewMs = server - Date.now();
  }
  const started = Date.parse(s.createdAt);
  if (!Number.isFinite(started)) return null;
  const elapsed = Date.now() + (clockSkewMs ?? 0) - started;
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;
  return Math.floor(elapsed / 60_000);
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
function renderDirector(
  view: Record<string, unknown>,
  phase: string,
  session: { frozen: boolean; paused: boolean } = { frozen: false, paused: false },
): HTMLElement {
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
  //
  // `gate-l2-projector` teacher-fallback defect: while the session was frozen
  // the board showed the single word FROZEN and this panel went on claiming
  // "Week 1 of 3 — the schedule / Every pairing in the league". The teacher
  // could say "look at the board" at a blank board. The module's mirror cannot
  // see session-level freeze/pause, so the truth is applied here, where it is
  // known, and the mirror is never allowed to contradict the projector.
  if (session.frozen || session.paused) {
    parts.push(
      block(
        "On the projector right now",
        `<div class="dir-projector-title">${session.frozen ? "FROZEN — one word on an otherwise empty projector" : "PAUSED — one word on an otherwise empty projector"}</div>${bullets([
          session.frozen
            ? "The board is NOT showing the lesson. Every student device has lost its controls and reads \u201cYour teacher has frozen the session. Hang tight.\u201d"
            : "The board is NOT showing the lesson. Every student device reads \u201cPaused \u2014 everything you\u2019ve done is saved. We\u2019ll pick back up shortly.\u201d",
          "Do not say \u201clook at the board\u201d until you press " + (session.frozen ? "Unfreeze" : "Resume") + ". This is the beat for eyes on you.",
        ])}`,
        "projector",
      ),
    );
  } else if (projector && projector.title) {
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
        `The ${stages.length} reveals`,
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
  // NOT the TIME CUT panel above. This cue is the lesson's "you are running out
  // of CLASS time, here is what to drop"; the panel is "close this round". Two
  // different decisions, and sharing a name on one screen was a trap.
  if (d?.timeCut) extras.push(`<div class="dir-timecut"><span class="dir-eyebrow">If you are running late</span>${escapeHtml(d.timeCut)}</div>`);
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

/**
 * Put a pair back in their own seat on a different device — `gate-l2-teacher`
 * (BLOCKING). A dead Chromebook takes the device token and the PIN screen with
 * it in the same instant, and until now the console had no move: rejoining as a
 * new name means a new desk and a blank book, in the middle of the evidence the
 * class is about to be shown. This mints a fresh PIN for the seat they already
 * hold, retires the dead device, and keeps the desk, the books and the history.
 *
 * The PIN is shown to the TEACHER, who reads it to the pair. It is deliberately
 * sticky rather than a toast: a teacher crossing a room to a spare laptop must
 * still be able to read it when they get there.
 */
async function reseatPair(seatId: string, displayName: string): Promise<void> {
  if (!currentCode) return;
  if (!confirm(`Reseat ${displayName} on a different device?\n\nTheir old device stops working straight away. You will get a new 4-digit PIN to read to them; they rejoin with the SAME name and keep their desk and everything in its books.`)) return;
  try {
    const out = await apiFetch<{ seatId: string; displayName: string; pin: string }>(
      `/api/sessions/${currentCode}/seats/${seatId}/reseat`,
      { method: "POST", headers: authHeaders() },
    );
    showReseatPin(out.displayName, out.pin);
  } catch (error) {
    statusEl.textContent = error instanceof ApiError ? error.message : "could not reseat that pair";
  }
}

function showReseatPin(displayName: string, pin: string): void {
  const box = document.getElementById("reseatBox");
  if (!box) return;
  box.hidden = false;
  box.innerHTML = `<div class="reseat-head">READ THIS TO ${escapeHtml(displayName.toUpperCase())}</div>
    <div class="reseat-pin">${escapeHtml(pin)}</div>
    <p class="reseat-note">On the spare device: open the join page, type the SAME name — <strong>${escapeHtml(displayName)}</strong> — and this PIN. Their desk, their money and their history are exactly where they left them. Their old device no longer works.</p>
    <button class="btn" id="reseatDone" type="button">Done</button>`;
  document.getElementById("reseatDone")?.addEventListener("click", () => { box.hidden = true; });
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
  if (view["module"] === HOST_LEAGUE_ID) return renderHostLeagueAggregate(view, seats);
  if (view["module"] === WRITE_RULE_ID) return renderWriteRuleAggregate(view, seats);
  if (view["module"] === THE_WINDOW_ID) return renderSameLineL1Aggregate(view, seats);
  if (view["module"] === "m1l2-the-season") return renderSameLineL2Aggregate(view, seats);
  if (view["module"] === "m1l3-the-deadline") return renderSameLineL3Aggregate(view, seats);

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
  // D59 W4 ruling 3: the console always sees the 7-8 percent/net shape, never
  // the 5-6 bar — independent of the room's own student-facing grade band.
  billCoverage: { coveragePercent?: number; net?: number } | null;
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
      <div class="statline"><span class="pill pill-${d.inDebt ? "at-cap" : "comfortable"}" style="font-size:10px;">${money(d.cash)}</span><span>${d.renewals}% renewals</span></div>
      <div class="statline"><span>${d.nightsPlayed} night${d.nightsPlayed === 1 ? "" : "s"}${d.joinedAtNight > 1 ? ` · joined N${d.joinedAtNight}` : ""}</span><span>${d.lastFillPct !== null ? `${d.lastFillPct}% full` : ""}</span></div>
      ${d.spend > 0 ? `<div class="statline"><span>$${d.spend.toLocaleString()} on the night</span><span>${d.openBowl ? "extra seats" : ""}</span></div>` : ""}
      ${
        d.billCoverage
          ? `<div class="statline"><span>Bill covered: ${Math.round(d.billCoverage.coveragePercent ?? 0)}%</span><span style="color:${(d.billCoverage.net ?? 0) < 0 ? "var(--cap-tight)" : "var(--ink-secondary)"};">${money(d.billCoverage.net ?? 0)}</span></div>`
          : ""
      }
      ${d.heldSamePriceRun >= 3 ? `<div class="statline"><span style="color:var(--cap-tight);">held one price ${d.heldSamePriceRun} nights</span><span></span></div>` : ""}`;
    grid.appendChild(tile);
  }
  wrap.appendChild(grid);
  return wrap;
}


/* ------------------------------------------------- host league aggregate -- */

type HLDeskStat = {
  seatId: string;
  deskNumber: number | null;
  handle: string;
  club: string;
  sizeLabel: string;
  locked: boolean;
  price: number;
  share: number;
  cash: number;
  draw: number;
  inDebt: boolean;
  weeksPlayed: number;
  autoWeeks: number;
  neverLocked: boolean;
  coveredWeeks: number;
  joinedAtWeek: number;
  hostingThisWeek: string | null;
  lastFillPct: number | null;
};
type HLDrawRow = { slot: number; handle: string; short: string; live: boolean; draw: number; starGone: boolean; sizeLabel: string };

/**
 * M2 L3's control-room panel. Deliberately narrow: the rule and where it came
 * from, the pot's two columns per desk, and the before/after effort rows. No
 * cash column anywhere — cash is never ranked on any surface in this module,
 * and the teacher panel is a surface.
 */
function renderWriteRuleAggregate(view: Record<string, unknown>, _seats: TeacherSeat[]): HTMLElement {
  const agg =
    (view["aggregate"] as {
      potFlows?: { deskHandle: string; paidInText: string; tookOutText: string; netText: string; net: number; docked: boolean }[];
      reinvestEra?: { deskHandle: string; l2: number | null; l3: number }[];
      rounds?: { round: number; median: number; submitted: number; conditionYes: number }[];
      hookSplit?: { pay: number; breakup: number; undecided: number };
      kingsSplit?: { deny: number; approve: number; undecided: number };
    }) ?? {};
  const rule = view["rule"] as { share: number; condition: boolean; how: string } | null;
  const wrap = document.createElement("div");

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num" style="font-size:15px;">${escapeHtml(String(view["stage"] ?? ""))}</div><div class="lbl">Stage</div></div>
    <div class="kpi"><div class="num">${view["stage"] === "rounds" ? `${view["round"]}/${view["roundCount"]}` : `${view["weekNumber"]}/${view["weekCount"]}`}</div><div class="lbl">${view["stage"] === "rounds" ? "Round" : "Week"}</div></div>
    <div class="kpi"><div class="num">${view["stage"] === "rounds" ? `${view["proposalCount"]}/${view["deskCount"]}` : `${view["lockedCount"]}/${view["deskCount"]}`}</div><div class="lbl">${view["stage"] === "rounds" ? "Numbers in" : "Locked in"}</div></div>
    <div class="kpi"><div class="num" style="font-size:15px;">${rule ? `${rule.share}% · ${rule.condition ? "ON" : "OFF"}` : "not written"}</div><div class="lbl">Rule</div></div>`;
  wrap.appendChild(kpis);

  const line = document.createElement("div");
  line.style.marginBottom = "12px";
  line.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">The rule, as it stands</div>
    <div style="font-size:13px; color:var(--ink-secondary);">${escapeHtml(String(view["adoptionLine"] ?? ""))}</div>`;
  wrap.appendChild(line);

  const rounds = agg.rounds ?? [];
  if (rounds.length > 0) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Closed rounds</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">${rounds
        .map(
          (r) =>
            `<span class="chip">R${r.round} · middle ${r.median}% · ${r.submitted} in · ${r.conditionYes} for the condition</span>`,
        )
        .join("")}</div>`;
    wrap.appendChild(row);
  }

  const flows = agg.potFlows ?? [];
  if (flows.length > 0) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Paid in / took out — sorted by desk number, never by money</div>
      ${flows
        .map(
          (f) =>
            `<div class="row" style="margin:3px 0; font-size:12.5px;"><span style="width:190px;">${escapeHtml(f.deskHandle)}</span><span style="width:110px; color:var(--ink-muted);">in ${escapeHtml(f.paidInText)}</span><span style="width:110px; color:var(--ink-muted);">out ${escapeHtml(f.tookOutText)}</span><span style="color:${f.net < 0 ? "var(--accent-violet)" : "var(--accent-gold)"};">${escapeHtml(f.netText)}${f.docked ? " · docked" : ""}</span></div>`,
        )
        .join("")}`;
    wrap.appendChild(row);
  }

  const era = agg.reinvestEra ?? [];
  if (era.length > 0) {
    const row = document.createElement("div");
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Put back last lesson vs this lesson</div>
      ${era
        .map(
          (e) =>
            `<div class="row" style="margin:3px 0; font-size:12.5px;"><span style="width:190px;">${escapeHtml(e.deskHandle)}</span><span style="width:110px; color:var(--ink-muted);">${e.l2 === null ? "no L2 link" : `L2 ${Math.round(e.l2 * 10) / 10}%`}</span><span>L3 ${Math.round(e.l3 * 10) / 10}%</span></div>`,
        )
        .join("")}`;
    wrap.appendChild(row);
  }

  // Wave 3b: THE FLOOR's own round table — parallel to the SHARE rounds
  // chips above, live only while institution 2 is being voted. `wouldClear
  // === false` on a desk's own ON proposal is `self-bound` (watchFor already
  // names it) and is flagged here in the same colour.
  const floorRound = view["floorRound"] as
    | {
        index: number;
        count: number;
        proposals: { label: string; on: boolean | null; level: number | null; levelText: string | null; recipient: string | null; wouldClear: boolean | null }[];
        proposalCount: number;
        deskCount: number;
        medianText: string | null;
      }
    | null;
  if (floorRound) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">THE FLOOR — round ${floorRound.index} of ${floorRound.count} · ${floorRound.proposalCount}/${floorRound.deskCount} proposals in${floorRound.medianText ? ` · median ${floorRound.medianText}` : ""}</div>
      ${floorRound.proposals
        .map((p) => {
          const selfBound = p.on === true && p.wouldClear === false;
          const onText = p.on === null ? "—" : p.on ? "ON" : "OFF";
          const clearText = p.wouldClear === null ? "" : p.wouldClear ? "would clear" : "would NOT clear — self-bound";
          return `<div class="row" style="margin:3px 0; font-size:12.5px; ${selfBound ? "color:var(--accent-gold);" : ""}"><span style="width:190px;">${escapeHtml(p.label)}</span><span style="width:60px;">${onText}</span><span style="width:90px; color:var(--ink-muted);">${p.levelText ? escapeHtml(p.levelText) : "—"}</span><span style="width:170px; color:var(--ink-muted);">${p.recipient ? escapeHtml(p.recipient) : "—"}</span><span>${clearText}</span></div>`;
        })
        .join("")}`;
    wrap.appendChild(row);
  }

  const institutions = view["institutions"] as
    | { share: { share: number; condition: boolean } | null; floor: { on: boolean; levelText: string; recipientLabel: string } | null }
    | null;
  if (institutions) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Both institutions</div>
      <div style="font-size:13px; color:var(--ink-secondary);">SHARE ${institutions.share ? `${institutions.share.share}% · condition ${institutions.share.condition ? "ON" : "OFF"}` : "not written"} · FLOOR ${institutions.floor ? `${escapeHtml(institutions.floor.levelText)} — ${escapeHtml(institutions.floor.recipientLabel)}` : "NO FLOOR"}</div>`;
    wrap.appendChild(row);
  }
  return wrap;
}

function renderHostLeagueAggregate(view: Record<string, unknown>, seats: TeacherSeat[]): HTMLElement {
  const desks = (view["desks"] as HLDeskStat[]) ?? [];
  const agg = (view["aggregate"] as { drawTable?: HLDrawRow[] } | undefined) ?? {};
  const draws = agg.drawTable ?? [];
  const seatById = new Map(seats.map((s) => [s.id, s]));
  const wrap = document.createElement("div");

  const kpis = document.createElement("div");
  kpis.className = "kpirow";
  kpis.style.marginBottom = "14px";
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${view["allWeeksDone"] ? "done" : `${view["weekNumber"]}/${view["weekCount"]}`}</div><div class="lbl">Week</div></div>
    <div class="kpi"><div class="num">${view["lockedCount"]}/${view["deskCount"]}</div><div class="lbl">Locked in</div></div>
    <div class="kpi"><div class="num" style="font-size:15px;">${view["barReleased"] ? "on the projector" : view["barAvailable"] ? "ready to release" : "not yet"}</div><div class="lbl">Handed-To-You bar</div></div>
    <div class="kpi"><div class="num">${view["revealStage"]}/${view["totalRevealSteps"]}</div><div class="lbl">Reveal stages</div></div>`;
  wrap.appendChild(kpis);

  // W5 seed-in from Week 4: what the link did to the books, in the teacher's own words, never silent.
  const seedNote = typeof view["seedNote"] === "string" ? (view["seedNote"] as string) : "";
  const carried = Array.isArray(view["carried"]) ? (view["carried"] as { slot: number; cashOpening: number; penalty: number; billCleared: boolean | null; clamped: boolean }[]) : [];
  if (seedNote || carried.length > 0) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    const penalised = carried.filter((c) => c.penalty > 0).length;
    const clamped = carried.filter((c) => c.clamped).length;
    const carriedLine =
      carried.length > 0
        ? `${carried.length} building${carried.length === 1 ? "" : "s"} opened on Week 4 books` +
          (penalised > 0 ? ` · ${penalised} missed the bill and open $${MISSED_BILL_PENALTY_TEXT} lighter` : "") +
          (clamped > 0 ? ` · ${clamped} held at the playability floor` : "")
        : "";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Week 4 link</div>
      <div style="font-size:13px; color:var(--ink-secondary);">${escapeHtml(seedNote || carriedLine)}${seedNote && carriedLine ? `<br>${escapeHtml(carriedLine)}` : ""}</div>`;
    wrap.appendChild(row);
  }

  const shock = view["shock"] as { club: string; short: string; draw: number; live: boolean } | null;
  if (shock) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">The star departure</div>
      <div style="font-size:13px; color:var(--ink-secondary);">${escapeHtml(shock.club)} — Draw ${shock.draw} for the rest of the season. ${shock.live ? "This club is run by a desk." : "This club is run by the league office."}</div>`;
    wrap.appendChild(row);
  }

  if (draws.length > 0) {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `<div class="eyebrow" style="font-size:11px; margin-bottom:4px;">Every club's Draw right now</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">${draws
        .map(
          (d) =>
            `<span class="pill" style="font-size:10px; ${d.live ? "" : "opacity:.6;"}">${escapeHtml(d.short)} ${d.draw}${d.starGone ? " ✚" : ""}</span>`,
        )
        .join("")}</div>`;
    wrap.appendChild(row);
  }

  const grid = document.createElement("div");
  grid.className = "teamgrid";
  const windowClosed = Boolean(view["allWeeksDone"]);
  for (const d of desks) {
    const seat = seatById.get(d.seatId);
    const tile = document.createElement("div");
    tile.className = `teamtile${!windowClosed && !d.locked ? " stalled" : ""}`;
    tile.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"><strong>${escapeHtml(d.handle)}</strong></div>
      <div class="statline"><span>${seat ? escapeHtml(seat.displayName) : d.seatId}</span><span>${
        windowClosed ? `finished · ${d.weeksPlayed} weeks` : d.locked ? `LOCKED $${d.price} · ${d.share}%` : `<span class="dir-stalled">still dialling $${d.price} · ${d.share}%</span>`
      }</span></div>
      <div class="statline"><span class="pill pill-${d.inDebt ? "at-cap" : "comfortable"}" style="font-size:10px;">${money(d.cash)}</span><span>Draw ${d.draw}</span></div>
      <div class="statline"><span>${escapeHtml(d.sizeLabel)}</span><span>${d.lastFillPct !== null ? `${d.lastFillPct}% full` : ""}</span></div>
      ${d.hostingThisWeek ? `<div class="statline"><span>hosting ${escapeHtml(d.hostingThisWeek)}</span><span>${d.joinedAtWeek > 1 ? `joined W${d.joinedAtWeek}` : ""}</span></div>` : ""}
      ${
        // gate-l2-teacher B3 / hidden-knowledge: AUTO lived only on the
        // student's own private screen, so the teacher could not see that a
        // desk had never once committed — and the free-rider WATCH FOR then
        // named it as the author of a strategic choice. "COVERED" (a late desk
        // inheriting weeks the league office ran) had no teacher-facing
        // explanation anywhere either.
        d.neverLocked || d.autoWeeks > 0 || d.coveredWeeks > 0
          ? `<div class="statline"><span>${
              d.neverLocked
                ? `<span class="dir-stalled">never locked a week — ${d.autoWeeks} settled AUTO</span>`
                : d.autoWeeks > 0
                  ? `${d.autoWeeks} week${d.autoWeeks === 1 ? "" : "s"} settled AUTO`
                  : ""
            }</span><span>${d.coveredWeeks > 0 ? `${d.coveredWeeks} week${d.coveredWeeks === 1 ? "" : "s"} COVERED by the league office before they joined` : ""}</span></div>`
          : ""
      }`;
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
    // Same gate as the poll. This is the frame that moves the room, so it also
    // sets the floor: a poll issued before this press can answer after it, and
    // without recording this version that older frame is not recognisably old.
    if (!freshness.accept(payload)) return;
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
/**
 * What "Restore" actually gives you, said the same way everywhere it matters.
 * The runtime keeps ONE checkpoint: restoring swaps the room with the state it
 * is about to replace, so a wrong restore is itself undoable — and there is no
 * second step backwards. A teacher who believes this is a history stack will
 * press it twice looking for the night before last and get the night they just
 * undid instead.
 */
const UNDO_DEPTH_NOTE =
  "Undo goes ONE step back \u2014 Restore returns the room to the last saved boundary, and pressing Restore again puts it back the way it is now. There is no second step backwards.";

function confirmSkippingContent(via: "advance" | "reveal"): boolean {
  // B1 repair (VERIFY_L2.md BLOCKER): same confirm() idiom btnEnd already uses below — no new dialog
  // framework. The economics stay correct either way (the runtime auto-resolves whatever's pending), this is
  // purely "you're about to skip real content" — the staged reveal theater for L2, or up to three whole
  // unplayed signing days for L3.
  const w = advanceWarnState;
  const lead = via === "reveal" ? "Jump to REVEAL. " : "";
  // `gate-l2-teacher` (REQUIRED). Two of these branches said "Restore last good
  // state is the only way back" and the other four said nothing, so the same
  // click was described as recoverable in one lesson and unqualified in the
  // next. And "the only way back" was never the whole truth: the undo is ONE
  // checkpoint deep. Every branch now says the same thing, in the same words.
  const ask = (message: string): boolean => confirm(`${message}\n\n${UNDO_DEPTH_NOTE}`);
  if (w?.kind === "td-reveal" && w.revealedCount < w.totalTargets) {
    const remaining = w.totalTargets - w.revealedCount;
    return ask(
      `${lead}${remaining} of ${w.totalTargets} target${w.totalTargets === 1 ? "" : "s"} unrevealed — ${via === "reveal" ? "this" : "advancing"} resolves ${remaining === 1 ? "it" : "them"} automatically, without the staged reveal. Continue?`,
    );
  } else if (w?.kind === "fh-play") {
    const remaining = w.nightCount - w.nightNumber;
    const unlocked = Math.max(0, w.deskCount - w.lockedCount);
    return ask(
      `${lead}Night ${w.nightNumber} of ${w.nightCount} is still open (${w.lockedCount}/${w.deskCount} desks locked in). This is not the night bell — ${
        via === "reveal" ? "this button" : "advancing now"
      } settles tonight for every desk AND ends the five-night window early, so ${
        remaining === 1 ? "1 night" : `${remaining} nights`
      } will never be played.${
        unlocked > 0
          ? ` ${unlocked} desk${unlocked === 1 ? "" : "s"} ${unlocked === 1 ? "has" : "have"} not locked; ${
              unlocked === 1 ? "it settles" : "they settle"
            } at ${unlocked === 1 ? "its" : "their"} season plan price with nothing spent, marked AUTO — NOT the number on ${
              unlocked === 1 ? "its dial" : "their dials"
            }.`
          : ""
      } Continue?`,
    );
  } else if (w?.kind === "hl-play") {
    const remaining = w.weekCount - w.weekNumber;
    const unlocked = Math.max(0, w.deskCount - w.lockedCount);
    return ask(
      `${lead}Week ${w.weekNumber} of ${w.weekCount} is still open (${w.lockedCount}/${w.deskCount} desks locked in). This is not the week bell — ${
        via === "reveal" ? "this button" : "advancing now"
      } settles this week for every club AND ends the season early, so ${
        remaining === 1 ? "1 week" : `${remaining} weeks`
      } will never be played.${
        unlocked > 0
          ? ` ${unlocked} desk${unlocked === 1 ? "" : "s"} ${unlocked === 1 ? "has" : "have"} not locked; ${
              unlocked === 1 ? "it settles" : "they settle"
            } at ${unlocked === 1 ? "its" : "their"} club's house price with nothing reinvested, marked AUTO — NOT the number on ${
              unlocked === 1 ? "its dial" : "their dials"
            }.`
          : ""
      } Continue?`,
    );
  } else if (w?.kind === "wr-vote") {
    const missing = Math.max(0, w.deskCount - w.submitted);
    return ask(
      `${lead}${
        w.sealed
          ? "The rule is printed but the season has not opened."
          : `Round ${w.round} of ${w.roundCount} is still open (${w.submitted}/${w.deskCount} desks have a number in${missing > 0 ? `, ${missing} abstaining so far` : ""}).`
      } This is NOT the round step and it is NOT the week bell — ${
        via === "reveal" ? "this button" : "advancing now"
      } abandons the rest of the vote AND the whole three-week season: every round still open closes at once, the two-thirds test runs, and all three weeks settle without anybody playing them. Continue?`,
    );
  } else if (w?.kind === "wr-season") {
    const remaining = w.weekCount - w.weekNumber;
    const unlocked = Math.max(0, w.deskCount - w.lockedCount);
    return ask(
      `${lead}Week ${w.weekNumber} of ${w.weekCount} is still open (${w.lockedCount}/${w.deskCount} desks locked in). This is not the week bell — ${
        via === "reveal" ? "this button" : "advancing now"
      } settles this week for every club AND ends the season early, so ${remaining === 1 ? "1 week" : `${remaining} weeks`} will never be played.${
        unlocked > 0
          ? ` ${unlocked} desk${unlocked === 1 ? "" : "s"} ${unlocked === 1 ? "has" : "have"} not locked; ${unlocked === 1 ? "it settles" : "they settle"} at ${unlocked === 1 ? "its" : "their"} club's house price with nothing put back, marked AUTO.`
          : ""
      } Continue?`,
    );
  } else if (w?.kind === "fa-play") {
    const remainingDays = w.windowDays - w.day;
    return ask(
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
$("btnRestore").addEventListener("click", () => {
  // The most destructive control in the room was the one unguarded button,
  // sitting beside a guarded End. It discards everything since the checkpoint.
  const what = lastCheckpointLabel ? `Undo "${lastCheckpointLabel}"?` : "Restore the last saved state?";
  if (confirm(`${what}\n\nAnything the class has done since then is rolled back. ${UNDO_DEPTH_NOTE}`)) {
    void sendControl({ type: "restore" });
  }
});
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
$("btnCfPageBack").addEventListener("click", () => void sendControl({ type: "hook", hook: "cfPageBack" }));
$("btnSynthPage").addEventListener("click", () => void sendControl({ type: "hook", hook: "synthPage" }));
$("btnSynthPageBack").addEventListener("click", () => void sendControl({ type: "hook", hook: "synthPageBack" }));
$("btnCloseWeek").addEventListener("click", () => {
  if (closeWeekWarn && !confirm(closeWeekWarn)) return;
  void sendControl({ type: "hook", hook: "closeWeek" });
});
$("btnHandedTo").addEventListener("click", () => void sendControl({ type: "hook", hook: "handedTo" }));
$("btnRuleStep").addEventListener("click", () => {
  if (ruleStepWarn && !confirm(ruleStepWarn)) return;
  void sendControl({ type: "hook", hook: ruleStepHook });
});
$("btnReviewStage").addEventListener("click", () => {
  void sendControl({ type: "hook", hook: "reviewStage" });
});
$("btnRealRule").addEventListener("click", () => {
  if (realRuleWarn && !confirm(realRuleWarn)) return;
  void sendControl({ type: "hook", hook: "realRule" });
});
$("btnCommitReveal").addEventListener("click", () => {
  if (commitRevealWarn && !confirm(commitRevealWarn)) return;
  void sendControl({ type: "hook", hook: "commitReveal" });
});
$("btnPcInvitePicked").addEventListener("click", () => {
  const seatId = $<HTMLSelectElement>("pcSeatPicker").value;
  const question = $<HTMLInputElement>("pcQuestion").value.trim();
  if (seatId) void sendControl({ type: "invitePress", seatId, ...(question ? { question } : {}) });
});
// The manual fallback (§12.2): a desk that volunteered out loud, called
// straight to the podium with no invite step at all.
$("btnPcCallPicked").addEventListener("click", () => {
  const seatId = $<HTMLSelectElement>("pcSeatPicker").value;
  const question = $<HTMLInputElement>("pcQuestion").value.trim();
  if (seatId) void sendControl({ type: "pressConference", seatId, ...(question ? { question } : {}) });
});
$("btnCancelInvite").addEventListener("click", () => void sendControl({ type: "cancelInvite" }));
$("btnEndPressConference").addEventListener("click", () => void sendControl({ type: "endPressConference" }));
$("btnFinalCall").addEventListener("click", () => void sendControl({ type: "finalCall", durationMs: 20000 }));
$("btnCancelFinalCall").addEventListener("click", () => void sendControl({ type: "cancelFinalCall" }));
$("btnCloseNow").addEventListener("click", () => {
  // The only control in the room that takes a decision away from a student who
  // has not made one. It names how many and what happens to them, because the
  // settlement it triggers is not undoable without a restore.
  const c = timeCutConfirm;
  if (c && c.unresolvedCount > 0) {
    const desks = c.unresolvedCount === 1 ? "1 desk has" : `${c.unresolvedCount} desks have`;
    if (!confirm(`Close now? ${desks} committed nothing.\n\n${c.policy}`)) return;
  }
  void sendControl({ type: "closeNow" });
});
$("btnBarPage").addEventListener("click", () => void sendControl({ type: "hook", hook: "barPage" }));
$("btnBarPageBack").addEventListener("click", () => void sendControl({ type: "hook", hook: "barPageBack" }));
$("btnPoolStage").addEventListener("click", () => void sendControl({ type: "hook", hook: "poolStage" }));
$("btnPoolPage").addEventListener("click", () => void sendControl({ type: "hook", hook: "poolPage" }));
$("btnPoolPageBack").addEventListener("click", () => void sendControl({ type: "hook", hook: "poolPageBack" }));

/**
 * `gate-l2-teacher` B2 (BLOCKING). The auto-reopen below already existed, but it
 * was SILENT and asynchronous: a teacher who opened /teach in a second tab, on a
 * second machine, or after clicking the wordmark saw "START A SESSION" and one
 * available move — create a new session — which strands the whole room on the
 * old code. The resume is now an affordance the teacher can see and press, shown
 * synchronously the moment a stored code exists, plus a code+key entry for the
 * second-machine case where localStorage has nothing.
 */
function attemptResume(code: string, key: string, onFail: (message: string) => void): void {
  teacherKey = key;
  apiFetch<TeacherPayload>(`/api/sessions/${code}/teacher`, { headers: authHeaders() })
    .then(() => {
      saveTeachSessionCode(code);
      saveTeachSessionKey(key);
      openSession(code);
    })
    .catch((err) => {
      teacherKey = null;
      onFail(
        err instanceof ApiError && err.status === 401
          ? `That teacher key does not open ${code}.`
          : `Session ${code} is no longer on this server.`,
      );
    });
}

$("btnReopen").addEventListener("click", () => {
  const code = $<HTMLInputElement>("reopenCode").value.trim().toUpperCase();
  const key = $<HTMLInputElement>("reopenKey").value.trim();
  if (!code || !key) {
    statusEl.textContent = "a code AND a teacher key are both needed to reopen a room";
    return;
  }
  statusEl.textContent = `reopening ${code}…`;
  attemptResume(code, key, (message) => {
    statusEl.textContent = message;
  });
});

initProjectorPreview();
$("deskFilter").addEventListener("click", () => {
  deskFilterOn = !deskFilterOn;
  // Redraw off the payload already in hand: a teacher pressing this is looking
  // for a desk NOW, not on the next poll tick.
  if (deskLastPayload) renderDesks(deskLastPayload);
});

void loadLessons().then(() => {
  const remembered = loadTeachSessionCode();
  const rememberedKey = loadTeachSessionKey();
  // R1: without the teacher key there is nothing safe to auto-reopen —
  // fall through to the create-session form rather than guessing.
  if (remembered && rememberedKey) {
    const row = $("resumeRow");
    row.hidden = false;
    $("resumeCode").textContent = remembered;
    $("resumeNote").textContent = "Checking that it is still live…";
    $("btnResume").addEventListener("click", () => {
      $("resumeNote").textContent = "Reopening…";
      attemptResume(remembered, rememberedKey, (message) => {
        $("resumeNote").textContent = `${message} Start a new one below.`;
      });
    });
    attemptResume(remembered, rememberedKey, (message) => {
      $("resumeNote").textContent = `${message} Start a new one below.`;
    });
  }
});
