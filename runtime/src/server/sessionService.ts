/**
 * The business logic layer. Every route handler in http.ts calls into this
 * module and never touches the Repository or a LessonModule directly — the
 * same "one gateway" discipline the donor used for its `service.ts`.
 *
 * This is where the phase-gate mechanism from bow-finlit's
 * `shared/classroom.ts` (`CLASS_PHASES`/`PHASE_CEILING`/`allowedStepCeiling`/
 * `gateReasonFor`) gets adapted rather than ported. The donor's gate is a
 * fixed 35-item `StepId` union with a hand-authored ceiling map — that shape
 * is exactly what Track 101 cannot reuse, because the whole point of the
 * LessonModule contract is that lessons define their own phase list at
 * registration time, not at compile time. What ports is the *algorithm*:
 * one phase index, action must match the session's current phase exactly
 * (no queued future-phase actions, no stale past-phase replays), a hard
 * stop while paused/frozen/ended. That algorithm is `assertActionable`
 * below.
 */
import { randomUUID } from "node:crypto";
import type { AnyLessonModule, UnresolvedSeat } from "../shared/lessonModule.js";
import { isOrderedSubsequence, type CanonicalPhase } from "../shared/phases.js";
import {
  generateDeviceToken,
  generateJoinCode,
  generatePin,
  hashDeviceToken,
  hashPin,
  verifyPin,
} from "./crypto.js";
import { RepositoryError, type Repository } from "./repository.js";
import type { RoundState, SeatPatch, SeatRow, SessionPatch, SessionRow } from "./types.js";

/**
 * Every refusal this layer issues says, explicitly, whether trying again could
 * ever succeed.
 *
 * This one bit is the difference between a classroom that keeps a student's
 * decision and one that loses it. The client holds a durable outbox; without a
 * retryability signal its only safe reading of a 4xx is "the server has ruled,
 * drop it", and a decision that arrived a quarter-second into a teacher's pause
 * was gone for good. Reproduced against the real server before this existed: a
 * `setPrice` during a pause returned 423 and a `lock` a moment after a phase
 * advance returned 409, and the outbox discarded both — a student's committed
 * choice, deleted by the teacher's timing rather than their own.
 *
 * Retryable means: nothing about this action is wrong, the room is momentarily
 * not accepting it. Not retryable means the server has made a semantic ruling
 * that more attempts cannot change, and the student is owed the reason.
 */
export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  constructor(status: number, code: string, message: string, retryable = false) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const notFound = (what: string) => new ServiceError(404, "not_found", `${what} not found`);
const REJOIN_LOCKOUT_THRESHOLD = 5;

/**
 * How many applied action ids a seat remembers.
 *
 * The window only has to outlive a retry, and a retry follows within a poll
 * tick or two. Sixty is far more than a class needs (a Full House desk submits
 * on the order of twenty actions across five nights) and small enough that the
 * snapshot file does not grow meaningfully.
 */
const APPLIED_ACTION_MEMORY = 60;

/**
 * How long a desk has to be silent before coming back counts as coming BACK.
 *
 * /play polls every 1.2s and reconciles every 6s, and Chromium throttles a
 * backgrounded tab's timers to about once a minute — which is the point: a
 * tab that was not on screen was not in the room. Set well clear of a dropped
 * poll or a slow reconcile so a network hiccup never produces a recap, and
 * well under the length of anything a class actually does.
 */
const AWAY_MS = 30_000;
/**
 * Silence, in buckets a stale payload cannot lie about.
 *
 * Bucket 0 is a device still talking to the room; 1 opens at the same AWAY_MS
 * that opens a student's own "while you were away" recap, so the console and
 * the returning pair never disagree about who was gone.
 */
export function quietBucketOf(quietMs: number): 0 | 1 | 2 | 3 | 4 {
  if (quietMs >= 900_000) return 4;
  if (quietMs >= 300_000) return 3;
  if (quietMs >= 60_000) return 2;
  if (quietMs >= AWAY_MS) return 1;
  return 0;
}

/** How much of the class's history is kept. Five nights of beats, with room. */
const CLASS_LOG_LIMIT = 60;

/** Nothing one write does to a class is more than a handful of things. */
const MAX_EVENTS_PER_WRITE = 6;

/** A recap is a card on a student's screen, not a transcript. */
const MAX_RECAP_LINES = 6;

/** Default FINAL CALL length. The teacher can ask for a different one per call. */
export const DEFAULT_FINAL_CALL_MS = 20_000;
/** Bounds on a teacher-chosen FINAL CALL, so a mistyped number cannot strand the room. */
const FINAL_CALL_MIN_MS = 5_000;
const FINAL_CALL_MAX_MS = 120_000;

/**
 * What the round lifecycle looks like from outside the server.
 *
 * `serverNow` travels with it deliberately. A countdown has to be drawn from
 * the difference between two clocks that agree, and a Chromebook's clock does
 * not agree with anything; the client renders `endsAt - serverNow` as a
 * duration and counts down locally from there, so a device an hour off shows
 * the same twenty seconds as the projector.
 */
export type RoundPublic = {
  status: RoundState["status"];
  key: string;
  endsAt: string | null;
  serverNow: string;
  closedBy: RoundState["closedBy"];
};

export type StudentPayload = {
  session: { code: string; title: string; phase: CanonicalPhase; paused: boolean; frozen: boolean; ended: boolean; version: number };
  seat: { id: string; displayName: string };
  deviceToken?: string;
  rejoinPin?: string;
  round: RoundPublic | null;
  /**
   * Whether THIS desk has committed for the round now open. Null when the
   * lesson has no round contract, or none is open.
   *
   * Computed through the same `unresolved()` the teacher panel uses, so the
   * warning a pair sees during FINAL CALL and the line their teacher is reading
   * about them cannot disagree — one contract, two audiences.
   */
  committed: boolean | null;
  /** What closing the round would do to THIS desk, said TO the pair, when it has committed nothing. */
  fallback: string | null;
  /**
   * WHILE YOU WERE AWAY.
   *
   * Present only when this desk went dark long enough to miss something and
   * has not acknowledged it yet. It is a card ON TOP of current truth, never a
   * rewind: `view` above is the room as it stands right now, unchanged by the
   * fact that this pair was not watching it happen.
   */
  away: { since: string; awayMs: number; lines: readonly string[] } | null;
  view: unknown;
};

export type TeacherPayload = {
  session: {
    id: string;
    code: string;
    title: string;
    lessonModuleId: string;
    phase: CanonicalPhase;
    phases: readonly CanonicalPhase[];
    /** When this room was created — the anchor for the console's class clock. */
    createdAt: string;
    /** The server's clock at the moment this body was built; the console reads the offset once. */
    serverNow: string;
    paused: boolean;
    frozen: boolean;
    ended: boolean;
    version: number;
    hasCheckpoint: boolean;
    /** What pressing Restore would undo, in words. Null when there is nothing to restore. */
    checkpointLabel: string | null;
  };
  /** Only ever populated on the createSession response — the one moment this credential is issued (R1). */
  teacherKey?: string;
  seats: Array<{
    id: string;
    displayName: string;
    joinedAt: string;
    lastSeenAt: string;
    /**
     * How long this seat's device has been silent, as a coarse bucket rather
     * than a live number. See quietBucketOf(): a millisecond count inside an
     * ETagged payload freezes at whatever it was when the body was last sent,
     * and a frozen "quiet 31s" that is really four minutes old is worse than no
     * number at all. The bucket is part of the teacher payload's fingerprint, so
     * crossing one is what re-sends the body.
     */
    quietBucket: 0 | 1 | 2 | 3 | 4;
    rejoinLocked: boolean;
  }>;
  round: RoundPublic | null;
  /**
   * The TIME CUT panel: what closing the round right now would do, and to whom.
   * Present whenever the lesson declares a round contract and one is open —
   * the teacher must never be asked to close a window without being shown who
   * it closes on.
   */
  timeCut: {
    /** The lesson's fallback policy, in one sentence. */
    policy: string;
    /** Desks with nothing committed, and what the close will apply to each. */
    unresolved: readonly UnresolvedSeat[];
    /** Seats that have committed. Count only — who committed WHAT is not the teacher panel's business here. */
    resolvedCount: number;
  } | null;
  view: unknown;
};

export type BoardPayload = {
  phase: CanonicalPhase;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  version: number;
  round: RoundPublic | null;
  view: unknown;
};

/**
 * The outcome of one submitted action, as the client needs to understand it.
 *
 * `applied` and `duplicate` are both successes and both return the current
 * view: a retry whose first attempt already landed is not an error and must
 * never be shown to a student as one.
 */
export type ActionOutcome = StudentPayload & { disposition: "applied" | "duplicate" };

export class SessionService {
  private readonly modules = new Map<string, AnyLessonModule>();

  constructor(private readonly repo: Repository) {}

  registerModule(mod: AnyLessonModule): void {
    if (!isOrderedSubsequence(mod.phases)) {
      throw new Error(`lesson module "${mod.id}" declares an out-of-order phase list`);
    }
    this.modules.set(mod.id, mod);
  }

  listModules(): Array<{ id: string; title: string; phases: readonly CanonicalPhase[] }> {
    return [...this.modules.values()].map((m) => ({ id: m.id, title: m.title, phases: m.phases }));
  }

  private moduleFor(session: SessionRow): AnyLessonModule {
    const mod = this.modules.get(session.lessonModuleId);
    if (!mod) throw new ServiceError(500, "module_missing", `lesson module "${session.lessonModuleId}" is not registered`);
    return mod;
  }

  /* ---------------------------------------------------------------- create -- */

  /**
   * R1 repair (VERIFY_RUNTIME.md B1/B2): every joined student necessarily
   * holds the join code (they typed it to join) and the `/control` /
   * teacher-state routes checked nothing but that code — any student with
   * a browser console could pause, skip, spoil, or end the session, or
   * read every team's private in-progress build before reveal. A per-
   * session teacher key is now issued once here, hashed at rest exactly
   * like a device token, and required as a bearer credential on every
   * `control()`/`teacherView()` call thereafter (`assertTeacher`).
   */
  async createSession(input: {
    lessonModuleId: string;
    title: string;
    sourceSessionId?: string;
    teacherKey?: string | null;
  }): Promise<TeacherPayload> {
    const mod = this.modules.get(input.lessonModuleId);
    if (!mod) throw new ServiceError(400, "unknown_module", `no lesson module registered as "${input.lessonModuleId}"`);
    // Creating a room is open — this product has no accounts and never asked
    // for one (D12). Reading ANOTHER room's state as a seed is not: that is
    // the one thing creation can do to a session it does not own.
    if (input.sourceSessionId) await this.assertAnyTeacher(input.teacherKey ?? null);
    const sessionId = randomUUID();
    // Cross-lesson continuity hook (e.g. M1 L2 carrying forward L1's
    // franchise state): resolve the named source session's own stored
    // state, hand it to the new module as an opaque seed, and let the
    // module decide what (if anything) it means. The runtime never reads
    // into `source.state` itself — a missing/unresolvable source session
    // is not an error here, it just means no seed (`undefined`), and the
    // receiving module is required to normalize that gracefully (its own
    // "stock franchise" story), same as any other malformed-seed case.
    let seed: unknown;
    if (input.sourceSessionId) {
      const source = await this.repo.getSessionById(input.sourceSessionId);
      if (source) seed = { lessonModuleId: source.lessonModuleId, state: source.state };
    }
    const state = mod.initialState({ sessionId, seatIds: [], seed });
    let code = "";
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = generateJoinCode();
      if (!(await this.repo.getSessionByCode(candidate))) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new ServiceError(500, "code_exhausted", "could not allocate a unique join code");
    const teacherKey = generateDeviceToken(); // same shape/entropy as a device token — an opaque bearer credential, not a low-entropy PIN
    const row = await this.repo.createSession({
      code,
      title: input.title || mod.title,
      lessonModuleId: mod.id,
      phase: mod.phases[0]!,
      state,
      teacherKeyHash: hashDeviceToken(teacherKey),
    });
    const payload = await this.buildTeacherPayload(row);
    payload.teacherKey = teacherKey;
    return payload;
  }

  /** Throws 401 unless `teacherKey` matches the session's own credential. Gates every teacher-only route (R1). */
  private assertTeacher(session: SessionRow, teacherKey: string | null): void {
    if (!teacherKey || hashDeviceToken(teacherKey) !== session.teacherKeyHash) {
      throw new ServiceError(401, "bad_teacher_key", "missing or incorrect teacher key for this session");
    }
  }

  /**
   * Proof that the caller runs SOME room in this building.
   *
   * The per-session key answers "may you control THIS session". Two calls need
   * a different question — "are you a teacher at all" — because they are about
   * the set of sessions rather than one of them, and they had no answer, so
   * they were open to anyone who could reach the server:
   *
   *   GET /api/sessions      handed every live class's join code and title to
   *                          any student on the school wifi, which is a way
   *                          into any other room in the building.
   *   POST /api/sessions     with `sourceSessionId` reads another session's
   *                          stored state as a seed — one class's franchises
   *                          out of another class's room.
   *
   * A key from any live session clears this, which is exactly the right bar:
   * every key was issued by creating a room, a student never holds one, and
   * the linking feature is only ever used to link to a lesson the same teacher
   * already ran on this machine (which is where their key came from). It
   * invents no accounts, no login, and no second credential — D12 stands.
   */
  private async isTeacherHere(teacherKey: string | null): Promise<boolean> {
    if (!teacherKey) return false;
    const hash = hashDeviceToken(teacherKey);
    return (await this.repo.listSessions()).some((row) => row.teacherKeyHash === hash);
  }

  private async assertAnyTeacher(teacherKey: string | null): Promise<void> {
    if (!(await this.isTeacherHere(teacherKey))) {
      throw new ServiceError(
        401,
        "bad_teacher_key",
        "this needs a teacher key from a session on this server — create or reopen a session first",
      );
    }
  }

  /**
   * The sessions a teacher may link a new lesson to.
   *
   * Unproven callers get an EMPTY list rather than a refusal, and the
   * difference matters twice. It is still closed — no join code, no title, no
   * session id leaves here without proof — and the question this answers is
   * "which rooms can I link to", whose honest answer for someone who runs none
   * is "none", not an error. A first-ever session on a fresh browser has no key
   * and nothing to link to, and it must not put a 401 in the console every
   * time a teacher opens the lesson picker.
   */
  async listSessions(teacherKey: string | null): Promise<TeacherPayload["session"][]> {
    if (!(await this.isTeacherHere(teacherKey))) return [];
    const rows = await this.repo.listSessions();
    // One row naming a lesson this build does not register used to throw out of
    // the whole listing (moduleFor 500s), so a single stale snapshot — a renamed
    // module, a session carried over from an older build — took down the "link
    // to a previous session" picker for every lesson, and /teach swallowed the
    // error and showed an empty list. A session whose module is gone is exactly
    // the one thing this list cannot offer anyway, so it is skipped, not fatal.
    const out: TeacherPayload["session"][] = [];
    for (const row of rows) {
      if (!this.modules.has(row.lessonModuleId)) continue;
      out.push(this.teacherPayload(row).session);
    }
    return out;
  }

  /* ------------------------------------------------------------------ join -- */

  async join(code: string, displayName: string): Promise<StudentPayload> {
    const session = await this.requireSession(code);
    if (session.ended) throw new ServiceError(410, "session_ended", "this session has ended");
    const name = displayName.trim();
    if (name.length < 1 || name.length > 40) {
      throw new ServiceError(400, "bad_name", "name must be 1-40 characters");
    }
    const normalized = normalizeName(name);
    const existing = await this.repo.getSeatBySessionAndName(session.id, normalized);
    if (existing) {
      throw new ServiceError(
        409,
        "name_taken",
        "that name is already in this session — use the rejoin PIN if this is you",
      );
    }
    const deviceToken = generateDeviceToken();
    const rejoinPin = generatePin();
    let seat: SeatRow;
    try {
      seat = await this.repo.createSeat({
        sessionId: session.id,
        displayName: name,
        displayNameNormalized: normalized,
        deviceTokenHash: hashDeviceToken(deviceToken),
        rejoinPinHash: await hashPin(rejoinPin),
      });
    } catch (error) {
      if (error instanceof RepositoryError && error.status === 409) {
        throw new ServiceError(409, "name_taken", "that name is already in this session");
      }
      throw error;
    }
    return this.studentPayload(session, seat, { deviceToken, rejoinPin });
  }

  /** Instant resume by device token — no code or name required. */
  async resumeByToken(deviceToken: string): Promise<StudentPayload> {
    const seat = await this.repo.getSeatByDeviceTokenHash(hashDeviceToken(deviceToken));
    if (!seat) throw new ServiceError(401, "retired", "this device is not signed in to any seat");
    const found = await this.repo.getSessionById(seat.sessionId);
    if (!found) throw notFound("session");
    const session = await this.sweepRound(found);
    return this.studentPayload(session, await this.markSeen(session, seat));
  }

  /**
   * Short rejoin-PIN fallback for a browser that lost its device token.
   *
   * R3 repair (VERIFY_RUNTIME.md REQUIRED-REPAIR #1): the 4-digit PIN space
   * (10,000 values) was exhaustible in ~7 minutes at realistic scripted
   * concurrency with zero throttling — a successful guess silently retires
   * the real student's device token, locking them out of their own seat.
   * A seat now locks out after 5 consecutive wrong PINs; a locked seat
   * rejects immediately (not even attempting the PIN check) until the
   * teacher clears it via `unlockRejoin` — see that method and the new
   * `/control`-adjacent HTTP route.
   */
  async rejoin(code: string, displayName: string, pin: string): Promise<StudentPayload> {
    const session = await this.requireSession(code);
    const normalized = normalizeName(displayName.trim());
    const seat = await this.repo.getSeatBySessionAndName(session.id, normalized);
    if (!seat) throw new ServiceError(401, "bad_rejoin", "name and PIN do not match a seat in this session");
    if (seat.failedRejoinAttempts >= REJOIN_LOCKOUT_THRESHOLD) {
      throw new ServiceError(423, "rejoin_locked", "too many wrong PIN attempts — ask your teacher to reset your seat");
    }
    if (!(await verifyPin(pin, seat.rejoinPinHash))) {
      await this.repo.updateSeat(seat.id, { failedRejoinAttempts: seat.failedRejoinAttempts + 1 });
      throw new ServiceError(401, "bad_rejoin", "name and PIN do not match a seat in this session");
    }
    // Rotate the device token: the old browser's token is retired the moment
    // a rejoin succeeds, so a lost/duplicated laptop cannot keep writing.
    const deviceToken = generateDeviceToken();
    const rotated = await this.repo.updateSeat(seat.id, {
      deviceTokenHash: hashDeviceToken(deviceToken),
      failedRejoinAttempts: 0,
    });
    if (!rotated) throw notFound("seat");
    // A rejoin is a return by definition — the browser lost its token, which
    // means it was closed, reloaded, or replaced. Same seen/away bookkeeping
    // as a poll, so a pair who came back the hard way is told what they missed
    // rather than being the one case that is not.
    return this.studentPayload(session, await this.markSeen(session, rotated), { deviceToken });
  }

  /** Teacher-only: clears a seat's rejoin lockout counter (R3's "until the teacher re-enables"). */
  async unlockRejoin(code: string, seatId: string, teacherKey: string | null): Promise<void> {
    const session = await this.requireSession(code);
    this.assertTeacher(session, teacherKey);
    const seat = await this.repo.getSeatById(seatId);
    if (!seat || seat.sessionId !== session.id) throw notFound("seat");
    await this.repo.updateSeat(seat.id, { failedRejoinAttempts: 0 });
  }

  /* ---------------------------------------------------------------- action -- */

  /**
   * The action boundary.
   *
   * The contract this method exists to keep: a valid decision taken inside an
   * open window is applied EXACTLY ONCE, or refused with a reason the student
   * is owed. There is no third outcome, and in particular there is no outcome
   * where the decision quietly ceases to exist because of when it arrived.
   *
   * Three mechanisms together make that true, and each is load-bearing:
   *
   *  1. IDEMPOTENCY. Every action carries a client-generated id. An id this
   *     seat has already had applied returns the current view as a `duplicate`
   *     success, not a second application. Without this, retrying would
   *     double-apply any action whose RESPONSE was lost rather than whose
   *     request was — and on a school access point, a lost response is the
   *     ordinary case, not the exotic one.
   *
   *  2. RETRYABILITY. A refusal that a later attempt could satisfy — the room
   *     is paused, frozen, or a write raced — is marked retryable, and the
   *     client's durable outbox keeps it rather than discarding it. Only a
   *     semantic ruling is final.
   *
   *  3. THE ROUND SWEEP. The server's own clock, never a device's, decides
   *     whether a FINAL CALL has expired. It is applied here, before the
   *     action is judged, so an action and the deadline it is racing are
   *     evaluated against the same instant.
   *
   * The read/reduce/version-checked-write sequence below is not atomic by
   * construction — it is atomic today only because this repository resolves
   * without real I/O, so a request runs to completion before another can
   * interleave. That is a property of the current storage, not a guarantee of
   * the design, so the version check stays and its conflict is reported as
   * retryable rather than fatal. Measured at 16 and 32 simultaneous desks
   * against the real server (`scripts/concurrency-harness.cjs`): zero
   * conflicts today, and a lost decision if one ever occurs is now impossible
   * rather than merely unlikely.
   */
  async submitAction(
    deviceToken: string,
    action: { type: string; [key: string]: unknown },
  ): Promise<ActionOutcome> {
    const seat = await this.repo.getSeatByDeviceTokenHash(hashDeviceToken(deviceToken));
    if (!seat) throw new ServiceError(401, "retired", "this device is not signed in to any seat");
    let session = await this.requireSessionById(seat.sessionId);
    session = await this.sweepRound(session);
    const mod = this.moduleFor(session);

    // (1) Already applied? Say so and hand back current truth. Checked before
    // the phase gate on purpose: a retry of an action that landed just before
    // the teacher advanced must report success, not "wrong phase".
    const actionId = typeof action["id"] === "string" ? (action["id"] as string) : null;
    if (actionId && seat.appliedActionIds.includes(actionId)) {
      return { ...this.studentPayload(session, seat), disposition: "duplicate" };
    }

    this.assertActionable(session);

    // (2) Did this decision cross a TIME CUT?
    //
    // The founder's list of things the architecture must tell apart ends with
    // "a valid action crossing TIME CUT", and it is the subtlest one: the round
    // the pair was deciding on closed while their tap was in the air, and the
    // NEXT round is already open. Without this check the action is applied to
    // the new round instead — a lock placed on a night whose card the pair has
    // never seen, indistinguishable to them from the decision they meant to
    // make. That is not a lost decision; it is a substituted one, which is
    // worse. So the client sends the round key it was looking at, and a
    // mismatch is refused definitively, in the lesson's own noun.
    const roundContract = this.roundContractFor(session);
    const claimedRound = typeof action["round"] === "string" ? (action["round"] as string) : null;
    if (claimedRound && roundContract) {
      const openKey = roundContract.currentKey(session.state, session.phase);
      if (openKey !== claimedRound) {
        throw new ServiceError(
          409,
          "stale_round",
          openKey === null
            ? `That ${roundContract.noun} closed while your choice was still sending, so it was not applied.`
            : `That ${roundContract.noun} closed while your choice was still sending, so it was not applied to the new one. Have another look and decide again.`,
          /* retryable */ false,
        );
      }
    }

    const result = mod.reduce(session.state, action, {
      phase: session.phase,
      seatId: seat.id,
      seatIds: (await this.repo.listSeatsForSession(session.id)).map((s) => s.id),
      now: Date.now(),
    });
    if (!result.ok) {
      // A module refusal is a semantic ruling: the action is wrong for this
      // state, and no amount of retrying makes it right. The student is owed
      // the module's own words for why.
      throw new ServiceError(409, "rejected", result.reason, /* retryable */ false);
    }

    const outcome = await this.repo.updateSession(
      session.id,
      this.withClassLog(session, { state: result.state }),
      session.version,
    );
    if (!outcome.ok) {
      if (outcome.conflict) {
        throw new ServiceError(
          409,
          "version_conflict",
          "another desk wrote first — this will be retried automatically",
          /* retryable */ true,
        );
      }
      throw notFound("session");
    }

    const applied = actionId
      ? [...seat.appliedActionIds, actionId].slice(-APPLIED_ACTION_MEMORY)
      : seat.appliedActionIds;
    // An action is presence, and it is also the moment a desk that has been
    // away is unambiguously back — so the same seen/away bookkeeping runs here
    // as on a poll, against the session this write just produced.
    const seen = await this.markSeen(outcome.session, seat);
    const updatedSeat = actionId ? (await this.repo.updateSeat(seat.id, { appliedActionIds: applied })) ?? seen : seen;
    return { ...this.studentPayload(outcome.session, updatedSeat), disposition: "applied" };
  }

  /* ----------------------------------------------------------- time cut -- */

  /**
   * The module's round contract, if it declares one.
   *
   * A lesson without rounds (Draft Day, Trade Deadline) gets no TIME CUT
   * controls and no round record — not a degraded version of them.
   */
  private roundContractFor(session: SessionRow): AnyLessonModule["round"] | undefined {
    return this.moduleFor(session).round;
  }

  /**
   * Bring the round record up to date against the SERVER's clock, and settle
   * the round if its FINAL CALL has run out.
   *
   * Called at the top of every path that reads or writes session truth, which
   * is what makes the deadline real without a timer: whichever surface asks
   * first (three of them poll) applies it, and a mid-class restart re-applies
   * it from the persisted `finalCallEndsAt` rather than losing it. A timer
   * would be an optimisation on top of this, never a substitute for it — a
   * timer that dies with the process is not a fairness mechanism.
   *
   * It also keeps the record keyed to the module's own round id, so a FINAL
   * CALL the teacher started and then abandoned cannot arm itself against the
   * next round: if the module has moved on, the stale record is dropped.
   */
  private async sweepRound(session: SessionRow): Promise<SessionRow> {
    const contract = this.roundContractFor(session);
    if (!contract) return session;
    const key = contract.currentKey(session.state, session.phase);
    const round = session.round;

    // No round open: clear any record left behind by the last one.
    if (key === null) {
      if (!round) return session;
      return this.write(session, { round: null });
    }
    // A new round opened: start it clean, whatever the previous one was doing.
    if (!round || round.key !== key) {
      return this.write(session, {
        round: { status: "OPEN", key, finalCallEndsAt: null, finalCallStartedAt: null, closedBy: null },
      });
    }
    if (round.status !== "FINAL_CALL" || !round.finalCallEndsAt) return session;
    if (Date.now() < Date.parse(round.finalCallEndsAt)) return session;
    return this.closeRound(session, contract, "final_call_expired");
  }

  /**
   * Settle the open round through the module's OWN close hook.
   *
   * Deliberately not a separate code path: a round the clock closes and a round
   * the teacher closes by hand run the identical reducer call, so the two can
   * never settle to different economics. The lesson's fallback for uncommitted
   * desks is whatever that hook already does — the runtime does not invent one.
   */
  private async closeRound(
    session: SessionRow,
    contract: NonNullable<AnyLessonModule["round"]>,
    closedBy: NonNullable<RoundState["closedBy"]>,
  ): Promise<SessionRow> {
    const mod = this.moduleFor(session);
    const key = contract.currentKey(session.state, session.phase) ?? session.round?.key ?? "";
    const result = mod.reduce(
      session.state,
      { type: contract.closeHook },
      { phase: session.phase, seatId: "teacher", seatIds: [], now: Date.now() },
    );
    // A close the module refuses is not a crash: the round is marked closed so
    // the room stops waiting on a window that is not accepting anything, and
    // the state is left exactly as the module last had it.
    const state = result.ok ? result.state : session.state;
    return this.write(
      session,
      {
        state,
        round: { status: "CLOSED", key, finalCallEndsAt: null, finalCallStartedAt: session.round?.finalCallStartedAt ?? null, closedBy },
      },
      `close ${key}`,
    );
  }

  /**
   * The phase gate. An action is actionable only when the session is live
   * (not ended), not frozen, and not paused. There is no per-action
   * ceiling to compute — unlike the donor's 35-step ladder, a Track 101
   * lesson module only ever exposes actions valid in the *current* phase
   * (via `allowedActions`/`reduce`), so "is this the right phase" is
   * answered by the module's own reducer, not by a separate index compare.
   * What the runtime enforces here is the class-wide hard stops a module
   * cannot see: ended, frozen, paused.
   */
  private assertActionable(session: SessionRow): void {
    // Ended is the one hard stop with no future: nothing about this session
    // will ever accept another action, so holding the action would be a lie.
    if (session.ended) throw new ServiceError(410, "session_ended", "this session has ended", false);
    // Frozen and paused are the teacher holding the room for thirty seconds.
    // The student's decision is not wrong; the room is not taking it YET. These
    // were the two most common ways a real decision was being destroyed — the
    // teacher pauses to get attention, a pair taps LOCK IT IN a beat later, and
    // the outbox discarded it as a definitive refusal. Held and retried now.
    if (session.frozen) throw new ServiceError(423, "frozen", "the teacher has frozen the session", true);
    if (session.paused) throw new ServiceError(423, "paused", "the teacher has paused the session", true);
  }

  /* --------------------------------------------------------------- control -- */

  async control(
    code: string,
    action:
      | { type: "advance" }
      | { type: "reveal" }
      | { type: "pause" }
      | { type: "unpause" }
      | { type: "freeze" }
      | { type: "unfreeze" }
      | { type: "hook"; hook: string }
      | { type: "end" }
      | { type: "restore" }
      | { type: "finalCall"; durationMs?: number }
      | { type: "closeNow" }
      | { type: "cancelFinalCall" },
    teacherKey: string | null,
  ): Promise<TeacherPayload> {
    let session = await this.requireSession(code);
    this.assertTeacher(session, teacherKey);
    if (session.ended && action.type !== "restore") {
      throw new ServiceError(410, "session_ended", "this session has ended");
    }
    session = await this.sweepRound(session);
    const mod = this.moduleFor(session);

    switch (action.type) {
      case "advance": {
        const idx = mod.phases.indexOf(session.phase);
        const next = mod.phases[idx + 1];
        if (!next) throw new ServiceError(400, "no_next_phase", "already at the final phase — use end");
        return this.applyPhaseChange(session, next);
      }
      case "reveal": {
        if (!mod.phases.includes("REVEAL")) {
          throw new ServiceError(400, "no_reveal_phase", "this lesson module has no REVEAL phase");
        }
        return this.applyPhaseChange(session, "REVEAL");
      }
      case "pause":
        return this.buildTeacherPayload(await this.patch(session, { paused: true }));
      case "unpause":
        return this.buildTeacherPayload(await this.patch(session, { paused: false }));
      case "freeze":
        return this.buildTeacherPayload(
          await this.patch(session, { frozen: true, paused: true }, /* checkpoint */ true),
        );
      // gate-l1-projector, blocking classroom-reliability defect: `freeze` sets
      // BOTH flags, and `unfreeze` used to clear only `frozen`. Observed in a
      // real session: the teacher freezes to get the room's attention, presses
      // the button now labelled "Unfreeze", and the projector goes from FROZEN
      // to PAUSED with no control anywhere still reading "Unfreeze" — a dead
      // room and no message explaining it. Freeze is one gesture, so unfreeze is
      // its exact inverse: it clears what freeze set.
      case "unfreeze":
        return this.buildTeacherPayload(await this.patch(session, { frozen: false, paused: false }));
      case "hook": {
        const result = mod.reduce(
          session.state,
          { type: `teacher:${action.hook}` },
          { phase: session.phase, seatId: "teacher", seatIds: [], now: Date.now() },
        );
        if (!result.ok) throw new ServiceError(400, "hook_rejected", result.reason);
        return this.buildTeacherPayload(await this.patch(session, { state: result.state }, true));
      }
      /* ------------------------------------------------------------ TIME CUT --
       * FINAL CALL and CLOSE NOW are two different teacher intentions and the
       * founder asked for both, not a compromise between them.
       *
       * FINAL CALL is the ordinary one: announce the closing window on all
       * three surfaces, keep accepting decisions for its whole length — that
       * acceptance IS the drain, and it is what makes a last-second change land
       * instead of vanishing — then settle on the server's own clock. The
       * teacher does not have to remember to press anything again.
       *
       * CLOSE NOW is for when the room has moved on and waiting is worse than
       * cutting: it settles immediately, from either OPEN or a running FINAL
       * CALL, skipping whatever drain remained.
       * ---------------------------------------------------------------------- */
      case "finalCall": {
        const contract = this.roundContractFor(session);
        if (!contract) throw new ServiceError(400, "no_rounds", "this lesson has no round to close");
        const key = contract.currentKey(session.state, session.phase);
        if (key === null) throw new ServiceError(400, "no_open_round", "there is no open round to call time on");
        if (session.round?.status === "CLOSED" && session.round.key === key) {
          throw new ServiceError(400, "round_closed", "this round has already closed");
        }
        const requested = action.durationMs ?? DEFAULT_FINAL_CALL_MS;
        if (!Number.isFinite(requested)) throw new ServiceError(400, "bad_duration", "final call length must be a number");
        const ms = Math.min(FINAL_CALL_MAX_MS, Math.max(FINAL_CALL_MIN_MS, Math.round(requested)));
        const now = Date.now();
        return this.buildTeacherPayload(
          await this.write(
            session,
            {
              round: {
                status: "FINAL_CALL",
                key,
                finalCallStartedAt: new Date(now).toISOString(),
                finalCallEndsAt: new Date(now + ms).toISOString(),
                closedBy: null,
              },
            },
            `final call on ${key}`,
          ),
        );
      }
      case "closeNow": {
        const contract = this.roundContractFor(session);
        if (!contract) throw new ServiceError(400, "no_rounds", "this lesson has no round to close");
        if (contract.currentKey(session.state, session.phase) === null) {
          throw new ServiceError(400, "no_open_round", "there is no open round to close");
        }
        return this.buildTeacherPayload(await this.closeRound(session, contract, "close_now"));
      }
      /**
       * The teacher changes their mind mid-countdown — a real thing that
       * happens when a pair says "wait, ours didn't save". The window returns
       * to OPEN with nothing settled and nothing lost.
       */
      case "cancelFinalCall": {
        if (session.round?.status !== "FINAL_CALL") {
          throw new ServiceError(400, "no_final_call", "no final call is running");
        }
        return this.buildTeacherPayload(
          await this.write(
            session,
            { round: { ...session.round, status: "OPEN", finalCallEndsAt: null, finalCallStartedAt: null } },
            `cancel final call on ${session.round.key}`,
          ),
        );
      }
      case "end":
        // R2 repair: capture a checkpoint before ending, same as every
        // other risky transition — previously "end" was the one control
        // action that never snapshotted first, so `restore` structurally
        // could not undo it (see the "restore" case and Checkpoint.ended).
        return this.buildTeacherPayload(await this.patch(session, { ended: true }, true));
      case "restore": {
        if (!session.checkpoint) throw new ServiceError(400, "no_checkpoint", "no checkpoint to restore");
        const cp = session.checkpoint;
        // Restore is the most destructive control in the room and was the only
        // one that did not snapshot before acting: it discarded everything since
        // the checkpoint with no way back, so a misclick cost a night (or five)
        // permanently. It now captures the state it is about to replace, which
        // makes a wrong restore itself undoable — pressing Restore twice returns
        // the room to where it started rather than digging further backwards.
        return this.buildTeacherPayload(
          await this.patch(session, {
            phase: cp.phase,
            state: cp.state,
            paused: cp.paused,
            frozen: cp.frozen,
            // R2 repair: restore now also clears `ended` when the checkpoint
            // predates it — a teacher's accidental "End Session" click,
            // freeze->unfreeze->end, is now actually recoverable, closing
            // VERIFY_RUNTIME.md B3 (restore couldn't undo the riskiest
            // transition, the one most likely to be a fat-fingered mistake
            // live in front of a class).
            ended: cp.ended,
            // The round window is part of what is being restored. Without it,
            // undoing a close would leave the lesson back in an open night
            // while the runtime still believed that night had settled — the
            // teacher's Restore would produce a room nobody could act in.
            round: cp.round ?? null,
            // And the record of what the class did goes back with the class.
            // An append-only log across an undo tells the next desk to come
            // back from a dark Chromebook that a night the teacher took back
            // closed twice.
            log: cp.log ?? [],
          }, /* captureCheckpoint */ true, "the restore you just did"),
        );
      }
    }
  }

  /**
   * `onPhaseExit` (optional on a module) runs here, before the phase itself
   * is committed — the one place every teacher-triggered forward transition
   * passes through, whether it's a normal `advance` or a `reveal` jump. See
   * `shared/lessonModule.ts`'s doc comment; VERIFY_L2.md B1 is the module
   * that actually uses this today (auto-resolving any target left pending
   * when a teacher leaves REVEAL early).
   */
  private async applyPhaseChange(session: SessionRow, next: CanonicalPhase): Promise<TeacherPayload> {
    const mod = this.moduleFor(session);
    const patch: Parameters<Repository["updateSession"]>[1] = { phase: next };
    // Root-cause fix for a re-verification finding against `onPhaseExit`'s first use (VERIFY_L2.md's
    // "Jump to REVEAL while already in REVEAL" MODERATE): `onPhaseExit`'s contract is "the phase being LEFT" —
    // when `next` is the session's current phase, nothing is actually being left, so nothing should fire. This
    // guards every module that ever implements the hook, not just this one case: `reveal` is the only control
    // action that can target a phase the session may already be in (`advance` always moves strictly forward by
    // construction), but any future control path with the same shape gets the same protection for free.
    if (mod.onPhaseExit && session.phase !== next) {
      const resolvedState = mod.onPhaseExit(session.state, session.phase, next);
      if (resolvedState !== session.state) patch.state = resolvedState;
    }
    return this.buildTeacherPayload(await this.patch(session, patch, true));
  }

  /**
   * A write that does NOT take a checkpoint.
   *
   * Round bookkeeping (opening, calling time, closing) must not consume the
   * one recovery slot: a teacher who presses Restore after a bad reveal means
   * "put the lesson back", and finding that the slot holds "a night opened" is
   * a recovery mechanism that recovers nothing. The `label` is carried for the
   * few round writes that DO deserve to be recoverable — closing a round — and
   * ignored otherwise.
   */
  private async write(
    session: SessionRow,
    patch: Parameters<Repository["updateSession"]>[1],
    checkpointLabel?: string,
  ): Promise<SessionRow> {
    return checkpointLabel ? this.patch(session, patch, true, checkpointLabel) : this.patch(session, patch, false);
  }

  /** Applies a patch with optimistic concurrency; optionally captures a pre-change checkpoint first. */
  private async patch(
    session: SessionRow,
    patch: Parameters<Repository["updateSession"]>[1],
    captureCheckpoint = false,
    checkpointLabel = "the last teacher action",
  ): Promise<SessionRow> {
    // Every teacher-side write funnels through here — phase changes, hooks,
    // round closes, restore, end — so this is where the class log is kept for
    // all of them.
    patch = this.withClassLog(session, patch);
    const withCheckpoint = captureCheckpoint
      ? {
          ...patch,
          checkpoint: {
            phase: session.phase,
            state: session.state,
            paused: session.paused,
            frozen: session.frozen,
            ended: session.ended,
            round: session.round,
            log: session.log,
            capturedAt: new Date().toISOString(),
            label: checkpointLabel,
          },
        }
      : patch;
    const outcome = await this.repo.updateSession(session.id, withCheckpoint, session.version);
    if (!outcome.ok) {
      if (outcome.conflict) throw new ServiceError(409, "version_conflict", "session changed underneath this control action");
      throw notFound("session");
    }
    return outcome.session;
  }

  /* ------------------------------------------------------------------ views -- */

  async teacherView(code: string, teacherKey: string | null): Promise<TeacherPayload> {
    const session = await this.requireSession(code);
    this.assertTeacher(session, teacherKey);
    return this.buildTeacherPayload(await this.sweepRound(session));
  }

  /**
   * The session's id and current version for a join code, and nothing else.
   *
   * Used by the nudge stream, which needs to know WHICH session to subscribe to
   * without reading any of its content. Returns null rather than throwing so a
   * projector left on a dead code gets a 404 it can act on.
   */
  async sessionIdForCode(code: string): Promise<{ id: string; version: number } | null> {
    const session = await this.repo.getSessionByCode(code);
    return session ? { id: session.id, version: session.version } : null;
  }

  async boardView(code: string): Promise<BoardPayload> {
    const session = await this.sweepRound(await this.requireSession(code));
    const mod = this.moduleFor(session);
    return {
      phase: session.phase,
      paused: session.paused,
      frozen: session.frozen,
      ended: session.ended,
      version: session.version,
      round: this.roundPublic(session),
      view: mod.boardView(session.state, session.phase),
    };
  }

  /**
   * The round record as the three surfaces receive it, with the server's own
   * clock attached so a countdown can be drawn as a DURATION rather than as a
   * comparison between two disagreeing clocks.
   */
  private roundPublic(session: SessionRow): RoundPublic | null {
    if (!session.round) return null;
    return {
      status: session.round.status,
      key: session.round.key,
      endsAt: session.round.finalCallEndsAt,
      serverNow: new Date().toISOString(),
      closedBy: session.round.closedBy,
    };
  }

  /* --------------------------------------------------- while you were away -- */

  /**
   * Fold the class events this write produces into the patch that carries it.
   *
   * One place, so a beat cannot reach the room through a path that forgot to
   * log it, and so the log lands in the SAME version bump as the change it
   * describes — a log written separately could be read by a returning desk
   * before, or without, the state it is talking about.
   *
   * The runtime asks the module what just happened and does not look at the
   * answer beyond bounding it. With no `classEvents`, the only thing the
   * runtime knows on its own is the phase, so that is all it claims.
   */
  private withClassLog(
    session: SessionRow,
    patch: SessionPatch,
  ): SessionPatch {
    // A caller that sets `log` itself is rewinding the record on purpose
    // (restore). An undo announces nothing: it is the class un-happening.
    if ("log" in patch) return patch;
    const mod = this.moduleFor(session);
    const nextState = "state" in patch ? patch.state : session.state;
    const toPhase = patch.phase ?? session.phase;
    const moved = toPhase !== session.phase;
    let lines: readonly string[];
    try {
      lines = mod.classEvents
        ? mod.classEvents(session.state, nextState, { fromPhase: session.phase, toPhase })
        : moved
          ? [`The class moved on to ${toPhase}.`]
          : [];
    } catch {
      // A module that throws in here must not cost the class the write itself.
      // The recap is the thing worth losing; the night is not.
      lines = [];
    }
    const usable = lines.filter((l) => typeof l === "string" && l.trim().length > 0).slice(0, MAX_EVENTS_PER_WRITE);
    if (usable.length === 0) return patch;
    const at = new Date().toISOString();
    let seq = session.log.at(-1)?.seq ?? 0;
    const appended = usable.map((text) => ({ seq: (seq += 1), at, text: text.trim().slice(0, 240) }));
    return { ...patch, log: [...session.log, ...appended].slice(-CLASS_LOG_LIMIT) };
  }

  /**
   * Mark this desk seen, and work out whether it has just come back.
   *
   * Called on every student truth-read. Three outcomes:
   *
   *   present   — the gap is short. The desk has been in the room, so it has
   *               seen whatever the room did: `seenSeq` advances to the head.
   *   returning — the gap is long AND something happened. `awaySince` opens;
   *               `seenSeq` deliberately does NOT advance, so the recap
   *               survives a refresh, a rejoin, and the desk's own next poll.
   *   pending   — a recap is already open and unacknowledged. Left alone, and
   *               anything that happens meanwhile joins it.
   *
   * A long gap over which the class did nothing is not a recap. Being away
   * while nothing happened is not something a pair needs told.
   */
  private async markSeen(session: SessionRow, seat: SeatRow): Promise<SeatRow> {
    const now = Date.now();
    const head = session.log.at(-1)?.seq ?? 0;
    const patch: SeatPatch = { lastSeenAt: new Date(now).toISOString() };
    if (seat.seenSeq > head) {
      // The log was rewound under this seat by a restore. Level it with the
      // record that now exists rather than leaving it waiting for sequence
      // numbers that will be re-issued for different events.
      return (await this.repo.updateSeat(seat.id, { ...patch, seenSeq: head, awaySince: null })) ?? seat;
    }
    if (seat.awaySince === null) {
      const gap = now - Date.parse(seat.lastSeenAt);
      if (Number.isFinite(gap) && gap >= AWAY_MS && head > seat.seenSeq) {
        patch.awaySince = seat.lastSeenAt;
      } else {
        patch.seenSeq = head;
      }
    }
    return (await this.repo.updateSeat(seat.id, patch)) ?? seat;
  }

  /** The recap card, or null when this desk has missed nothing it has not been shown. */
  private awayFor(session: SessionRow, seat: SeatRow): StudentPayload["away"] {
    if (seat.awaySince === null) return null;
    const missed = session.log.filter((e) => e.seq > seat.seenSeq);
    if (missed.length === 0) return null;
    // Oldest first — the class did these in order, and a recap read backwards
    // is a puzzle. Trimmed from the FRONT when it overflows, because the beats
    // nearest to now are the ones the pair is about to act on.
    const lines = missed.slice(-MAX_RECAP_LINES).map((e) => e.text);
    return {
      since: seat.awaySince,
      awayMs: Math.max(0, Date.now() - Date.parse(seat.awaySince)),
      lines,
    };
  }

  /**
   * The pair has read it. Everything up to the head is now seen, and the card
   * goes away — for good, not until the next poll.
   */
  async acknowledgeRecap(deviceToken: string): Promise<StudentPayload> {
    const seat = await this.repo.getSeatByDeviceTokenHash(hashDeviceToken(deviceToken));
    if (!seat) throw new ServiceError(401, "retired", "this device is not signed in to any seat");
    const found = await this.repo.getSessionById(seat.sessionId);
    if (!found) throw notFound("session");
    const session = await this.sweepRound(found);
    const updated =
      (await this.repo.updateSeat(seat.id, {
        awaySince: null,
        seenSeq: session.log.at(-1)?.seq ?? 0,
        lastSeenAt: new Date().toISOString(),
      })) ?? seat;
    return this.studentPayload(session, updated);
  }

  private studentPayload(
    session: SessionRow,
    seat: SeatRow,
    credentials?: { deviceToken?: string; rejoinPin?: string },
  ): StudentPayload {
    const mod = this.moduleFor(session);
    const contract = this.roundContractFor(session);
    const roundOpen = Boolean(contract && contract.currentKey(session.state, session.phase) !== null);
    const mine = contract && roundOpen ? contract.unresolved(session.state, session.phase, [seat.id])[0] ?? null : null;
    return {
      round: this.roundPublic(session),
      committed: roundOpen ? mine === null : null,
      fallback: mine?.selfFallback ?? null,
      session: {
        code: session.code,
        title: session.title,
        phase: session.phase,
        paused: session.paused,
        frozen: session.frozen,
        ended: session.ended,
        version: session.version,
      },
      seat: { id: seat.id, displayName: seat.displayName },
      away: this.awayFor(session, seat),
      ...credentials,
      view: mod.studentView(session.state, seat.id, session.phase),
    };
  }

  private teacherPayload(session: SessionRow): TeacherPayload {
    const mod = this.moduleFor(session);
    return {
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        lessonModuleId: session.lessonModuleId,
        phase: session.phase,
        phases: mod.phases,
        // Every time-cut instruction in every lesson is written as "past minute
        // 45?" — and the console had no clock, so the most-repeated pacing
        // instruction in the product was unactionable. `createdAt` is constant
        // (safe inside a conditionally-cached body); `serverNow` lets the
        // console measure the offset between this laptop's clock and the one
        // that stamped it, once, so a drifting Chromebook does not invent a
        // period that started twenty minutes ago.
        createdAt: session.createdAt,
        serverNow: new Date().toISOString(),
        paused: session.paused,
        frozen: session.frozen,
        ended: session.ended,
        version: session.version,
        hasCheckpoint: session.checkpoint !== null,
        checkpointLabel: session.checkpoint?.label ?? null,
      },
      seats: [],
      round: this.roundPublic(session),
      timeCut: null,
      view: mod.teacherView(session.state, session.phase),
    };
  }

  /** teacherPayload with the live roster and the TIME CUT panel attached — the shape /teach actually polls. */
  private async buildTeacherPayload(session: SessionRow): Promise<TeacherPayload> {
    const payload = this.teacherPayload(session);
    const seats = await this.repo.listSeatsForSession(session.id);
    // `quietMs` is measured HERE, on the one clock that also stamps `lastSeenAt`.
    // The console used to subtract a server timestamp from its own Date.now(),
    // which on a school laptop with a drifting clock reads every desk in the
    // room as gone (or none of them). `away` uses the same AWAY_MS the student's
    // own "while you were away" recap uses, so the two never disagree.
    const seenAt = Date.now();
    payload.seats = seats.map((s) => {
      const gap = seenAt - Date.parse(s.lastSeenAt);
      const quietMs = Number.isFinite(gap) ? Math.max(0, gap) : 0;
      return {
        id: s.id,
        displayName: s.displayName,
        joinedAt: s.joinedAt,
        lastSeenAt: s.lastSeenAt,
        quietBucket: quietBucketOf(quietMs),
        rejoinLocked: s.failedRejoinAttempts >= REJOIN_LOCKOUT_THRESHOLD,
      };
    });

    // The founder's rule: before the teacher closes the round, /teach makes
    // clear who is unresolved and what fallback will happen to them. A close
    // control that does not say who it closes on is an ADMIN control, not a
    // director's.
    const contract = this.roundContractFor(session);
    if (contract && contract.currentKey(session.state, session.phase) !== null) {
      const seatIds = seats.map((s) => s.id);
      const unresolved = contract.unresolved(session.state, session.phase, seatIds);
      payload.timeCut = {
        policy: contract.fallbackPolicy,
        unresolved,
        resolvedCount: Math.max(0, seatIds.length - unresolved.length),
      };
    }
    return payload;
  }

  private async requireSession(code: string): Promise<SessionRow> {
    const session = await this.repo.getSessionByCode(code);
    if (!session) throw notFound("session");
    return session;
  }

  private async requireSessionById(id: string): Promise<SessionRow> {
    const session = await this.repo.getSessionById(id);
    if (!session) throw notFound("session");
    return session;
  }
}

const normalizeName = (raw: string): string => raw.trim().toLowerCase().replace(/\s+/g, " ");
