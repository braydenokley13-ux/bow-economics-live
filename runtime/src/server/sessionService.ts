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
 * registration time, not at compile time.
 *
 * WHAT ACTUALLY PORTED IS THE HARD STOP, NOT THE PHASE COMPARE. This comment
 * used to claim that "action must match the session's current phase exactly",
 * and `assertActionable` below has never done that: it checks ended, frozen
 * and paused, and returns. There is no phase field on an action and nothing
 * reads one. Phase correctness is the MODULE'S job, in its own reducer, using
 * the `phase` on the `ReduceContext` — a module that accepts `lock` without
 * asking what phase it is in accepts a `lock` in SYNTHESIS, and no layer here
 * will stop it. The claim is corrected rather than implemented because the
 * built lessons already gate in `reduce` and adding a second gate here would
 * silently change which of their actions are legal; the fix that matters is
 * that the next module author reads the truth.
 */
import { randomUUID } from "node:crypto";
import type { AnyLessonModule, SeatId, UnresolvedSeat } from "../shared/lessonModule.js";
import { bandOrDefault, type GradeBand } from "../shared/gradeBand.js";
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

/** THE FIRST QUESTION (§12.2), trimmed to a real string or `null` — never an empty string on the wire. */
const normalizeQuestion = (raw: string | undefined): string | null => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

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

/**
 * How recently a projector polled, coarsely. 15s is comfortably longer than the
 * board's own poll interval and short enough that a teacher who unplugs the
 * cable is told before they finish the sentence.
 */
export function boardSeenBucketOf(sinceMs: number | null): 0 | 1 | 2 {
  if (sinceMs === null || sinceMs >= 90_000) return 2;
  if (sinceMs >= 15_000) return 1;
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
  session: {
    code: string;
    title: string;
    phase: CanonicalPhase;
    paused: boolean;
    frozen: boolean;
    ended: boolean;
    version: number;
    /** Null except while a press conference is running. See `StudentSpotlight`. */
    spotlight: StudentSpotlight | null;
  };
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
   * §12.2's INVITE FIRST, as this seat's own payload sees it. Present ONLY on
   * the invited seat's own payload — every other seat's `pressInvite` is
   * `null`, and no payload on any surface ever carries the invited seat's id.
   * `canDecline` is false once this seat has already used its one decline
   * this session; the client drops the DECLINE button and says so plainly
   * rather than silently disabling it.
   */
  pressInvite: { question: string | null; canDecline: boolean } | null;
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

/**
 * The podium record as a STUDENT surface receives it — deliberately the
 * smallest thing on the wire. `mine` is the only thing this desk is told that
 * every other desk is not: whether it is the one at the podium. No seat id
 * travels here at all, on this payload or any other surface's — a seat that
 * is not spotlighted must never be able to work out, from its own poll
 * response, which seat is.
 */
export type StudentSpotlight = {
  label: string;
  mine: boolean;
  /**
   * THE FIRST QUESTION (§12.2: "the instructor takes the first question to
   * model tone"), on the one payload allowed to carry it besides the board —
   * the podium seat's own. Every other seat's `spotlight.question` is `null`,
   * exactly like `mine` is `false` for them: the fact that a question was set
   * is podium-and-board content, not something a locked-out desk is told.
   */
  question: string | null;
};

export type TeacherPayload = {
  session: {
    id: string;
    code: string;
    title: string;
    lessonModuleId: string;
    /** The band this room is for. On the console so a teacher can see which class they opened. */
    gradeBand: GradeBand;
    phase: CanonicalPhase;
    phases: readonly CanonicalPhase[];
    /** When this room was created — the anchor for the console's class clock. */
    createdAt: string;
    /** The server's clock at the moment this body was built; the console reads the offset once. */
    serverNow: string;
    paused: boolean;
    /**
     * When the room became paused, or null. Teacher-only — this is what lets
     * the Press Conference panel say how much of the final call was left at
     * the moment the teacher paused, rather than a number that keeps counting
     * down against a clock the room is not actually running.
     */
    pausedAt: string | null;
    frozen: boolean;
    ended: boolean;
    version: number;
    hasCheckpoint: boolean;
    /** What pressing Restore would undo, in words. Null when there is nothing to restore. */
    checkpointLabel: string | null;
    /**
     * Whether a projector is actually watching this room, as a coarse bucket:
     * 0 = a board polled within the last 15s, 1 = 15-90s, 2 = longer ago or
     * never on this server.
     *
     * A teacher says "look at the board" with their back to it. A dead HDMI
     * cable, a sleeping projector or a /board tab on the wrong session are all
     * silent from the console, and the class stares at a blank wall while the
     * teacher narrates a reveal. Bucketed and in the ETag fingerprint for the
     * same reason `quietBucket` is (D35): a live millisecond count inside a
     * cacheable body freezes and then lies.
     */
    boardSeenBucket: 0 | 1 | 2;
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
  /** Who is at the podium right now, teacher-private (this is the one payload allowed to name the seat). Null outside a press conference. */
  spotlight: { seatId: string; label: string; since: string; question: string | null } | null;
  /**
   * §12.2 INVITE FIRST, teacher-private: the seat currently invited and
   * awaiting an answer, or null. The one payload (besides the invited seat's
   * own) allowed to name it — the console needs the seat id to offer Cancel.
   */
  pressInvite: { seatId: string; label: string; question: string | null; since: string } | null;
  /**
   * The console's shortlist for who to call up next — the module's own
   * ranking, or `[]` for a lesson that declares none. `declined` is folded in
   * by the runtime (the module has no seat-level memory of this) so the
   * console can mark a desk that has already used its one decline, without
   * ever putting that fact on a shared surface.
   */
  pressCandidates: readonly { seatId: string; label: string; why: string; declined: boolean }[];
  view: unknown;
};

export type BoardPayload = {
  phase: CanonicalPhase;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  version: number;
  round: RoundPublic | null;
  /**
   * The full-dark takeover. `view` is exactly the module's own `spotlightView`
   * for the podium seat — never `null` as a way of hiding that a module has no
   * such view (the board must be able to tell "nothing to show yet" apart from
   * "no press conference"), and NEVER the seat id: the projector is public.
   */
  spotlight: { label: string; view: unknown; question: string | null } | null;
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
  /** sessionId -> the last time a projector polled this room. In memory only; see `boardView`. */
  private readonly boardSeenAt = new Map<string, number>();

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
    /** Which class this room is for. Defaults to 5-6, the band that existed first. */
    gradeBand?: unknown;
    sourceSessionId?: string;
    teacherKey?: string | null;
  }): Promise<TeacherPayload> {
    const gradeBand = bandOrDefault(input.gradeBand);
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
    //
    // The envelope carries PROVENANCE alongside the state, because the two
    // questions a receiving module has to answer about a carry are "what shape
    // is this" and "should I trust it", and it used to be handed the answer to
    // only the first. D39 makes linking a session that has not finished
    // deliberate but permitted — and that warning lives entirely in the /teach
    // UI, so a module inheriting a half-played room cannot tell, even though
    // whether the source ROUND closed is exactly the kind of thing a carry
    // rule turns on. `sourceEnded` and `sourcePhase` say it; `sourceSessionId`
    // lets a module name the room it came from rather than assert one.
    // Additive: a module reading only `lessonModuleId` and `state` is
    // unaffected.
    let seed: unknown;
    if (input.sourceSessionId) {
      const source = await this.repo.getSessionById(input.sourceSessionId);
      if (source) {
        seed = {
          lessonModuleId: source.lessonModuleId,
          state: source.state,
          sourceSessionId: source.id,
          sourcePhase: source.phase,
          sourceEnded: source.ended,
          // THE THIRD ATTACHMENT POINT, and the one D38 did not name.
          //
          // Without it a 7-8 room seeded from a 5-6 room accepts the carry in
          // silence, and nothing in the runtime is able to notice: the
          // receiving module sees a well-formed envelope from the right module
          // id and every reason to trust it. The runtime still does not JUDGE
          // this -- judging a cross-band carry is the module's call, because
          // only the module knows whether its own state means the same thing in
          // both bands. What the runtime owes is the fact.
          sourceGradeBand: source.gradeBand,
        };
      }
    }
    const state = mod.initialState({ sessionId, seatIds: [], seed, gradeBand });
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
      gradeBand,
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

  /**
   * Teacher-only: put a pair back in their own seat on a different device.
   *
   * `gate-l2-teacher` (BLOCKING). The rejoin path assumes the pair still has
   * something the seat will accept: their device token, or the PIN their
   * device showed them once at join. A Chromebook that dies, sleeps into a
   * wiped profile, or gets carried off by the pair before it took the last
   * charge leaves BOTH gone at the same moment, and there was no teacher-side
   * move at all: `unlockRejoin` clears a lockout counter, and a pair who never
   * knew the PIN is not locked out, they are simply outside. In a fifty-minute
   * period the alternatives were to rejoin as a NEW seat — a fresh desk, a
   * blank book, the room's evidence quietly changed — or to lose the pair.
   *
   * This mints a NEW rejoin PIN and hands it to the teacher, who reads it to
   * the pair. It rotates the device token in the same write, so the dead
   * device is retired the instant the recovery is offered rather than when it
   * is used: nothing that comes back to life later can write to this seat with
   * the old credential. The desk, its books, its history and its identity in
   * the room's evidence are untouched — the pair walks back into the same
   * seat, which is the whole point.
   *
   * It is deliberately NOT reachable by a student: a valid teacher key is the
   * only thing that mints a credential for someone else's seat.
   */
  async reseatSeat(code: string, seatId: string, teacherKey: string | null): Promise<{ seatId: string; displayName: string; pin: string }> {
    const session = await this.requireSession(code);
    this.assertTeacher(session, teacherKey);
    const seat = await this.repo.getSeatById(seatId);
    if (!seat || seat.sessionId !== session.id) throw notFound("seat");
    const pin = generatePin();
    const updated = await this.repo.updateSeat(seat.id, {
      rejoinPinHash: await hashPin(pin),
      // Retire whatever the old device held. A reseat is only ever asked for
      // because that device is gone; if it is not, it must not keep writing.
      deviceTokenHash: hashDeviceToken(generateDeviceToken()),
      failedRejoinAttempts: 0,
    });
    if (!updated) throw notFound("seat");
    return { seatId: seat.id, displayName: seat.displayName, pin };
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

    // §12.2 INVITE FIRST — the seat's own half of the invite exchange.
    // Neither branch touches `mod.reduce`: accepting or declining a podium
    // invitation is not lesson content, it is this runtime's own primitive,
    // exactly like `pressConference`/`endPressConference` are on the teacher
    // side. Both branches still go through the ordinary idempotency check
    // above and the ordinary seen/appliedActionIds tail below, so a lost
    // response retries safely like any other student action.
    if (action.type === "acceptPress" || action.type === "declinePress") {
      const invite = session.pressInvite;
      if (!invite || invite.seatId !== seat.id) {
        // Never says WHO is invited, or that anyone is — a seat with no
        // invite of its own must not learn from this refusal that a podium
        // exchange is happening elsewhere in the room.
        throw new ServiceError(409, "no_invite", "there is no press conference invitation to respond to", false);
      }
      if (action.type === "declinePress" && seat.pressDeclined) {
        // §12.2: "A desk may decline once per course" — once, not once per
        // invitation. A second decline from the same seat is a semantic
        // refusal, not a transient one: no retry ever makes it succeed.
        throw new ServiceError(400, "decline_used", "you've already used your one decline this session", false);
      }
      const patch: Parameters<Repository["updateSession"]>[1] =
        action.type === "acceptPress"
          ? {
              paused: true,
              pausedAt: this.pauseAnchor(session),
              spotlight: { seatId: seat.id, label: invite.label, since: new Date().toISOString(), question: invite.question },
              pressInvite: null,
            }
          : { pressInvite: null };
      const outcome = await this.repo.updateSession(session.id, patch, session.version);
      if (!outcome.ok) {
        if (outcome.conflict) {
          throw new ServiceError(409, "version_conflict", "another desk wrote first — this will be retried automatically", true);
        }
        throw notFound("session");
      }
      const seatPatch: SeatPatch = {};
      if (action.type === "declinePress") seatPatch.pressDeclined = true;
      if (actionId) seatPatch.appliedActionIds = [...seat.appliedActionIds, actionId].slice(-APPLIED_ACTION_MEMORY);
      const seen = await this.markSeen(outcome.session, seat);
      const updatedSeat = Object.keys(seatPatch).length > 0 ? (await this.repo.updateSeat(seat.id, seatPatch)) ?? seen : seen;
      return { ...this.studentPayload(outcome.session, updatedSeat), disposition: "applied" };
    }

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
      seatIds: await this.seatIdsOf(session),
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
    // CLOCK HONESTY UNDER PAUSE. A paused room is the teacher holding the
    // room, and "holding" has to mean the whole room, including a deadline
    // nobody in it can see moving — a FINAL CALL that quietly expired while
    // every screen read PAUSED was reproducible before this guard: pause set
    // the flag, but this sweep still compared `Date.now()` against a
    // `finalCallEndsAt` that never stopped. No deadline may elapse while
    // paused, full stop — the debt (however long the pause turns out to
    // last) is settled once, in full, exactly when the pause ends. See
    // `clockShiftForResume`, called from every control action that ends one.
    if (session.paused) return session;
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
      { phase: session.phase, seatId: "teacher", seatIds: await this.seatIdsOf(session), now: Date.now() },
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
  /**
   * Who is in this room, for a `ReduceContext`.
   *
   * Every path that reduces must use this. Two of them used to pass `[]`
   * instead — `closeRound` and the generic teacher `hook` — which is worse
   * than it sounds, because `RoundContract.unresolved` IS handed the real
   * roster to build the teacher's per-desk "what closing will do to them"
   * list. The runtime therefore told the module exactly who had not committed,
   * and then closed the round without telling it anyone existed. A fallback
   * policy that has to act ON the uncommitted desks — which is every honest
   * one — could not see them at the only moment it runs.
   */
  private async seatIdsOf(session: SessionRow): Promise<readonly SeatId[]> {
    return (await this.repo.listSeatsForSession(session.id)).map((s) => s.id);
  }

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

  /**
   * The timestamp a new pause anchors on.
   *
   * `pause`, `freeze`, and `pressConference` all set `paused: true`, and any
   * one of them can land on a room that is already paused by another of the
   * three (freeze on top of an existing pause; a press conference called
   * while frozen). The anchor must not move in that case — it names when the
   * room STOPPED, and restarting it every time a second hold is layered on
   * would under-count the pause and claw back real seconds from a FINAL CALL
   * that never actually ran. Only a room that was actually live starts a
   * fresh clock.
   */
  private pauseAnchor(session: SessionRow): string {
    return session.paused && session.pausedAt ? session.pausedAt : new Date().toISOString();
  }

  /**
   * THE DEBT, SETTLED. Called from every control action that ends a pause —
   * `unpause`, `unfreeze`, `endPressConference`, and a `restore` that reverts
   * into a live room — never from `sweepRound` itself, which is exactly the
   * point: while paused, `sweepRound` returns before it ever compares a clock
   * to `finalCallEndsAt` (see its own comment), so the deadline sits exactly
   * where it was the instant the pause began. This is where that debt is paid,
   * once, in whichever direction it is owed: if `round` is mid FINAL CALL, its
   * deadline moves forward by exactly how long `session.pausedAt` says the
   * room was actually stopped, so the desks in it get back precisely the
   * seconds the pause took and not one more or fewer — a pause of 3 seconds
   * and a pause of 3 minutes must both leave the SAME time on the clock they
   * had when the room stopped. A round that is not in FINAL CALL, or has no
   * deadline, or a session that was never paused, passes through unchanged.
   */
  private clockShiftForResume(session: SessionRow, round: RoundState | null): RoundState | null {
    if (session.pausedAt === null || !round || round.status !== "FINAL_CALL" || !round.finalCallEndsAt) {
      return round;
    }
    const pausedMs = Math.max(0, Date.now() - Date.parse(session.pausedAt));
    if (pausedMs <= 0) return round;
    return { ...round, finalCallEndsAt: new Date(Date.parse(round.finalCallEndsAt) + pausedMs).toISOString() };
  }

  /**
   * THE PODIUM'S NAME. What `pressConference` writes into `spotlight.label`.
   *
   * The teacher's manual seat picker can call up ANY seat, not only one the
   * module proposed, so this cannot simply read a label off `pressCandidates`'
   * own list and stop there — it asks the SAME list (the one true source for
   * "what does this lesson call this desk"), and only falls back to the
   * founder-specified generic when the module either declares no shortlist at
   * all or has nothing to say about this particular seat. A student's own
   * fictional display name is deliberately never consulted: that name is
   * teacher-private furniture (`SeatRow.displayName`), and `spotlight.label` is
   * the one field of this whole feature that reaches the projector.
   */
  private spotlightLabelFor(session: SessionRow, seatId: SeatId): string {
    const mod = this.moduleFor(session);
    const candidates = mod.pressCandidates?.(session.state, session.phase) ?? [];
    return candidates.find((c) => c.seatId === seatId)?.label ?? "A FRONT OFFICE";
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
      | { type: "cancelFinalCall" }
      // THE PRESS CONFERENCE. Calling one directly is a pause with a podium
      // attached (the manual fallback — a desk that volunteered out loud);
      // ending one is the ordinary resume, on the same clock-honesty path as
      // `unpause`/`unfreeze` — see `clockShiftForResume`. `question` is the
      // optional first question (§12.2) shown on the board and the podium.
      | { type: "pressConference"; seatId: string; question?: string }
      | { type: "endPressConference" }
      // §12.2 INVITE FIRST: propose the podium to a seat without pausing
      // anything. The podium only goes live if that seat accepts.
      | { type: "invitePress"; seatId: string; question?: string }
      | { type: "cancelInvite" },
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
        // A session whose stored phase is not in this module's list has no
        // "next" — and the arithmetic below would invent one. `indexOf` returns
        // -1, `phases[-1 + 1]` is `phases[0]`, and the `!next` guard does not
        // fire: pressing ADVANCE would send the whole room back to the FIRST
        // phase of the lesson, mid-class, with the projector following it.
        // Reachable whenever a stored phase and a registered module disagree —
        // a lesson whose phase list changed between builds, restored from a
        // snapshot the loader only checks for `id` and `code`
        // (snapshotRepository.ts). D32 says a surface never moves backwards;
        // this is the one place the server itself could push it there.
        if (idx === -1) {
          throw new ServiceError(
            409,
            "phase_not_in_module",
            `this room is in ${session.phase}, which is not a phase of ${mod.id} — it was probably created by a different build. Restore, or start a new room.`,
          );
        }
        const next = mod.phases[idx + 1];
        if (!next) throw new ServiceError(400, "no_next_phase", "already at the final phase — use end");
        return this.applyPhaseChange(session, next);
      }
      case "reveal": {
        if (!mod.phases.includes("REVEAL")) {
          throw new ServiceError(400, "no_reveal_phase", "this lesson module has no REVEAL phase");
        }
        // REVEAL is a jump, not a step, so unlike `advance` it can name a phase
        // the class is already past — a teacher on SYNTHESIS who presses the
        // reveal control lands the room back on REVEAL. Two things break at
        // once: the room moves backwards (D32), and `onPhaseExit` fires on a
        // BACKWARD transition, though its whole contract is written in forward
        // language and modules act on that — L2 and L3 both auto-resolve
        // pending work "because the phase offering it is being left." Firing
        // that in reverse resolves work the class has already been shown.
        const here = mod.phases.indexOf(session.phase);
        const revealAt = mod.phases.indexOf("REVEAL");
        if (here !== -1 && revealAt < here) {
          throw new ServiceError(
            409,
            "phase_would_rewind",
            `this room is already past REVEAL (it is in ${session.phase}) — use Undo to go back, not the reveal control.`,
          );
        }
        return this.applyPhaseChange(session, "REVEAL");
      }
      case "pause":
        return this.buildTeacherPayload(await this.patch(session, { paused: true, pausedAt: this.pauseAnchor(session) }));
      case "unpause":
        return this.buildTeacherPayload(
          await this.patch(session, { paused: false, pausedAt: null, round: this.clockShiftForResume(session, session.round) }),
        );
      case "freeze":
        return this.buildTeacherPayload(
          await this.patch(session, { frozen: true, paused: true, pausedAt: this.pauseAnchor(session) }, /* checkpoint */ true),
        );
      // gate-l1-projector, blocking classroom-reliability defect: `freeze` sets
      // BOTH flags, and `unfreeze` used to clear only `frozen`. Observed in a
      // real session: the teacher freezes to get the room's attention, presses
      // the button now labelled "Unfreeze", and the projector goes from FROZEN
      // to PAUSED with no control anywhere still reading "Unfreeze" — a dead
      // room and no message explaining it. Freeze is one gesture, so unfreeze is
      // its exact inverse: it clears what freeze set.
      case "unfreeze":
        return this.buildTeacherPayload(
          await this.patch(session, {
            frozen: false,
            paused: false,
            pausedAt: null,
            round: this.clockShiftForResume(session, session.round),
          }),
        );
      /* --------------------------------------------------------- PRESS CONFERENCE --
       * A press conference IS a pause with a podium attached, not a second hold
       * mechanism next to it: it reuses the exact `paused`/`pausedAt` machinery
       * `pause` and `freeze` already own, so `assertActionable`, `sweepRound`'s
       * paused-early-return, and every retryable-423 path a student's outbox
       * already understands apply to it for free. Ending one is the ordinary
       * resume, on the identical clock-shift path as `unpause`/`unfreeze`.
       * ------------------------------------------------------------------------- */
      case "pressConference": {
        const seatId = action.seatId;
        if (typeof seatId !== "string" || seatId.length === 0) {
          throw new ServiceError(400, "bad_seat", "pressConference requires a seatId");
        }
        const seat = await this.repo.getSeatById(seatId);
        if (!seat || seat.sessionId !== session.id) throw notFound("seat");
        const question = normalizeQuestion(action.question);
        return this.buildTeacherPayload(
          await this.patch(session, {
            paused: true,
            pausedAt: this.pauseAnchor(session),
            spotlight: { seatId, label: this.spotlightLabelFor(session, seatId), since: new Date().toISOString(), question },
            // The direct call-up is the manual fallback and always wins over
            // whatever the invite flow was doing — a teacher who calls a desk
            // up directly is not waiting on an answer to anything.
            pressInvite: null,
          }),
        );
      }
      case "endPressConference":
        return this.buildTeacherPayload(
          await this.patch(session, {
            paused: false,
            pausedAt: null,
            spotlight: null,
            pressInvite: null,
            round: this.clockShiftForResume(session, session.round),
          }),
        );
      /* ---------------------------------------------------------- INVITE FIRST --
       * §12.2 FOUNDER LOCKED: "A desk's first Press Conference of the course
       * is invited, never cold-called." An invite proposes the podium to a
       * seat WITHOUT pausing the room — the pause with a podium attached only
       * begins if and when that seat accepts (`acceptPress`, in
       * `submitAction`). A decline (`declinePress`) or a teacher `cancelInvite`
       * both clear it with no pause ever having happened.
       * ------------------------------------------------------------------------- */
      case "invitePress": {
        const seatId = action.seatId;
        if (typeof seatId !== "string" || seatId.length === 0) {
          throw new ServiceError(400, "bad_seat", "invitePress requires a seatId");
        }
        const seat = await this.repo.getSeatById(seatId);
        if (!seat || seat.sessionId !== session.id) throw notFound("seat");
        const question = normalizeQuestion(action.question);
        return this.buildTeacherPayload(
          await this.patch(session, {
            pressInvite: { seatId, label: this.spotlightLabelFor(session, seatId), question, since: new Date().toISOString() },
          }),
        );
      }
      case "cancelInvite":
        return this.buildTeacherPayload(await this.patch(session, { pressInvite: null }));
      case "hook": {
        const result = mod.reduce(
          session.state,
          { type: `teacher:${action.hook}` },
          { phase: session.phase, seatId: "teacher", seatIds: await this.seatIdsOf(session), now: Date.now() },
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
        // Nobody stays at a podium — or waits on an invite — in a session that
        // no longer exists.
        return this.buildTeacherPayload(await this.patch(session, { ended: true, spotlight: null, pressInvite: null }, true));
      case "restore": {
        if (!session.checkpoint) throw new ServiceError(400, "no_checkpoint", "no checkpoint to restore");
        const cp = session.checkpoint;
        // Restore is the most destructive control in the room and was the only
        // one that did not snapshot before acting: it discarded everything since
        // the checkpoint with no way back, so a misclick cost a night (or five)
        // permanently. It now captures the state it is about to replace, which
        // makes a wrong restore itself undoable — pressing Restore twice returns
        // the room to where it started rather than digging further backwards.
        //
        // Restore is also one of the three places a pause can end (the other
        // two are `unpause`/`unfreeze`): the common case is a checkpoint from
        // BEFORE the pause began (freeze -> restore), which is a real resume —
        // `cp.paused` is false and any running FINAL CALL owes the room the
        // exact clock-shift `unpause` gives it, using the LIVE session's own
        // `pausedAt` as the anchor (the checkpoint's round is what is coming
        // back; the pause that just ended happened on this session, not on the
        // snapshot). If the checkpoint itself was captured mid-pause, restore
        // is not a resume — the pause continues, and the anchor is preserved
        // (or, if the live session had somehow already lost it, restarted now
        // rather than left null, since a paused room with no anchor could never
        // be resumed honestly).
        const cpRound = cp.round ?? null;
        const resuming = !cp.paused;
        const round = resuming ? this.clockShiftForResume(session, cpRound) : cpRound;
        const pausedAt = resuming ? null : session.pausedAt ?? new Date().toISOString();
        return this.buildTeacherPayload(
          await this.patch(session, {
            phase: cp.phase,
            state: cp.state,
            paused: cp.paused,
            pausedAt,
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
            round,
            // Nobody stays at a podium across an undo — the room being restored
            // to a moment before (or after) the press conference never asked for
            // it, and the seat id must not survive a control path that skips
            // `endPressConference` entirely. Same logic for a pending invite:
            // the room being restored to never asked that question either.
            spotlight: null,
            pressInvite: null,
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

  /** Milliseconds since a projector last polled this room, or null if none has on this server. */
  private boardSeenSince(sessionId: string): number | null {
    const at = this.boardSeenAt.get(sessionId);
    return at === undefined ? null : Date.now() - at;
  }

  /**
   * @param preview  True when the caller is the teacher console's own embedded
   *   mirror rather than a projector. It must NOT count as a board being
   *   watched: the console always has one open, so counting it would make
   *   BOARD LIVE permanently true and the indicator worthless — the exact
   *   failure it exists to catch is a console that looks right to the teacher
   *   while the room stares at a dark wall.
   */
  async boardView(code: string, preview = false): Promise<BoardPayload> {
    const session = await this.sweepRound(await this.requireSession(code));
    // Deliberately in memory and NOT on the session row: a projector poll must
    // not bump the session version or write to disk twice a second. Losing it
    // across a restart is honest — this process has not been watched yet, and
    // a live board says so again within its next poll.
    if (!preview) this.boardSeenAt.set(session.id, Date.now());
    const mod = this.moduleFor(session);
    return {
      phase: session.phase,
      paused: session.paused,
      frozen: session.frozen,
      ended: session.ended,
      version: session.version,
      round: this.roundPublic(session),
      // THE TAKEOVER. `spotlightView` is optional on a module, and its absence
      // is not the same fact as "no press conference" — a lesson with nothing
      // yet worth putting on a podium still gets `view: null`, distinguishable
      // from `spotlight: null` (no podium at all). Never the seat id: this is
      // the one payload the room's projector actually renders.
      spotlight: session.spotlight
        ? {
            label: session.spotlight.label,
            view: mod.spotlightView?.(session.state, session.spotlight.seatId, session.phase) ?? null,
            // THE FIRST QUESTION (§12.2), public: it is asked in front of the
            // whole room, so the board gets it in full — never the reason a
            // decline happened, which never reaches this surface at all.
            question: session.spotlight.question,
          }
        : null,
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
    const atPodium = session.spotlight?.seatId === seat.id;
    const invitedHere = session.pressInvite?.seatId === seat.id;
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
        // NO SEAT ID TRAVELS HERE, on this seat's own payload or any other
        // seat's — `mine` is the only fact a desk that is not spotlighted is
        // ever told about who is. `question` is likewise only ever true
        // content for the podium seat itself — every other seat reads null,
        // the same way every other seat reads `mine: false`.
        spotlight: session.spotlight
          ? { label: session.spotlight.label, mine: atPodium, question: atPodium ? session.spotlight.question : null }
          : null,
      },
      seat: { id: seat.id, displayName: seat.displayName },
      // §12.2 INVITE FIRST: present only on the invited seat's OWN payload —
      // every other seat's `pressInvite` is null, and the invited seat's id
      // never travels on any payload but this one (it already knows who it is).
      pressInvite: invitedHere ? { question: session.pressInvite!.question, canDecline: !seat.pressDeclined } : null,
      away: this.awayFor(session, seat),
      ...credentials,
      // THE PODIUM SEES WHAT THE ROOM SEES. While this desk is spotlighted, its
      // own `view` is not `studentView` (this desk's private state) but the
      // SAME `spotlightView` the projector and every other lock screen are
      // shown — the founder's rule for the podium is that the pair sees
      // exactly what the room sees, not more. Every other desk, spotlighted or
      // not, keeps its ordinary private view; a lock screen that ignored it
      // costs nothing (the client does not render `view` while locked), and a
      // client that is out of date and DOES render it has lost nothing private
      // — `studentView` was already scoped to that seat alone.
      view: atPodium ? mod.spotlightView?.(session.state, seat.id, session.phase) ?? null : mod.studentView(session.state, seat.id, session.phase),
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
        gradeBand: session.gradeBand,
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
        pausedAt: session.pausedAt,
        frozen: session.frozen,
        ended: session.ended,
        version: session.version,
        hasCheckpoint: session.checkpoint !== null,
        checkpointLabel: session.checkpoint?.label ?? null,
        boardSeenBucket: boardSeenBucketOf(this.boardSeenSince(session.id)),
      },
      seats: [],
      round: this.roundPublic(session),
      timeCut: null,
      spotlight: session.spotlight ? { ...session.spotlight } : null,
      pressInvite: session.pressInvite ? { ...session.pressInvite } : null,
      // `declined` is filled in by `buildTeacherPayload`, which has the seat
      // roster this method does not; defaulted false here so the shape is
      // complete for any caller of the bare (roster-less) payload.
      pressCandidates: (mod.pressCandidates?.(session.state, session.phase) ?? []).map((c) => ({ ...c, declined: false })),
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

    // §12.2: mark, on the console's own shortlist, a desk that has already
    // used its one decline — never on a shared surface, only here. The
    // module's `pressCandidates()` has no seat-level memory of this; the
    // runtime is the only layer that does.
    const declinedSeats = new Set(seats.filter((s) => s.pressDeclined).map((s) => s.id));
    payload.pressCandidates = payload.pressCandidates.map((c) => ({ ...c, declined: declinedSeats.has(c.seatId) }));

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
