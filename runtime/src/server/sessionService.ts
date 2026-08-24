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
import type { AnyLessonModule } from "../shared/lessonModule.js";
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
import type { SeatRow, SessionRow } from "./types.js";

export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.code = code;
  }
}

const notFound = (what: string) => new ServiceError(404, "not_found", `${what} not found`);
const REJOIN_LOCKOUT_THRESHOLD = 5;

export type StudentPayload = {
  session: { code: string; title: string; phase: CanonicalPhase; paused: boolean; frozen: boolean; ended: boolean; version: number };
  seat: { id: string; displayName: string };
  deviceToken?: string;
  rejoinPin?: string;
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
    paused: boolean;
    frozen: boolean;
    ended: boolean;
    version: number;
    hasCheckpoint: boolean;
  };
  /** Only ever populated on the createSession response — the one moment this credential is issued (R1). */
  teacherKey?: string;
  seats: Array<{ id: string; displayName: string; joinedAt: string; lastSeenAt: string; rejoinLocked: boolean }>;
  view: unknown;
};

export type BoardPayload = {
  phase: CanonicalPhase;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  version: number;
  view: unknown;
};

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
  async createSession(input: { lessonModuleId: string; title: string; sourceSessionId?: string }): Promise<TeacherPayload> {
    const mod = this.modules.get(input.lessonModuleId);
    if (!mod) throw new ServiceError(400, "unknown_module", `no lesson module registered as "${input.lessonModuleId}"`);
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

  async listSessions(): Promise<TeacherPayload["session"][]> {
    const rows = await this.repo.listSessions();
    return rows.map((row) => this.teacherPayload(row).session);
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
        rejoinPinHash: hashPin(rejoinPin),
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
    const session = await this.repo.getSessionById(seat.sessionId);
    if (!session) throw notFound("session");
    await this.repo.updateSeat(seat.id, { lastSeenAt: new Date().toISOString() });
    return this.studentPayload(session, seat);
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
    if (!verifyPin(pin, seat.rejoinPinHash)) {
      await this.repo.updateSeat(seat.id, { failedRejoinAttempts: seat.failedRejoinAttempts + 1 });
      throw new ServiceError(401, "bad_rejoin", "name and PIN do not match a seat in this session");
    }
    // Rotate the device token: the old browser's token is retired the moment
    // a rejoin succeeds, so a lost/duplicated laptop cannot keep writing.
    const deviceToken = generateDeviceToken();
    const updated = await this.repo.updateSeat(seat.id, {
      deviceTokenHash: hashDeviceToken(deviceToken),
      lastSeenAt: new Date().toISOString(),
      failedRejoinAttempts: 0,
    });
    if (!updated) throw notFound("seat");
    return this.studentPayload(session, updated, { deviceToken });
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

  async submitAction(
    deviceToken: string,
    action: { type: string; [key: string]: unknown },
  ): Promise<StudentPayload> {
    const seat = await this.repo.getSeatByDeviceTokenHash(hashDeviceToken(deviceToken));
    if (!seat) throw new ServiceError(401, "retired", "this device is not signed in to any seat");
    const session = await this.requireSessionById(seat.sessionId);
    const mod = this.moduleFor(session);
    this.assertActionable(session);

    const result = mod.reduce(session.state, action, {
      phase: session.phase,
      seatId: seat.id,
      seatIds: (await this.repo.listSeatsForSession(session.id)).map((s) => s.id),
      now: Date.now(),
    });
    if (!result.ok) throw new ServiceError(409, "rejected", result.reason);

    const outcome = await this.repo.updateSession(session.id, { state: result.state }, session.version);
    if (!outcome.ok) throw new ServiceError(409, "version_conflict", "session changed underneath this action — refresh and retry");

    await this.repo.updateSeat(seat.id, { lastSeenAt: new Date().toISOString() });
    return this.studentPayload(outcome.session, seat);
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
    if (session.ended) throw new ServiceError(410, "session_ended", "this session has ended");
    if (session.frozen) throw new ServiceError(423, "frozen", "the teacher has frozen the session");
    if (session.paused) throw new ServiceError(423, "paused", "the teacher has paused the session");
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
      | { type: "restore" },
    teacherKey: string | null,
  ): Promise<TeacherPayload> {
    const session = await this.requireSession(code);
    this.assertTeacher(session, teacherKey);
    if (session.ended && action.type !== "restore") {
      throw new ServiceError(410, "session_ended", "this session has ended");
    }
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
      case "unfreeze":
        return this.buildTeacherPayload(await this.patch(session, { frozen: false }));
      case "hook": {
        const result = mod.reduce(
          session.state,
          { type: `teacher:${action.hook}` },
          { phase: session.phase, seatId: "teacher", seatIds: [], now: Date.now() },
        );
        if (!result.ok) throw new ServiceError(400, "hook_rejected", result.reason);
        return this.buildTeacherPayload(await this.patch(session, { state: result.state }, true));
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
          }),
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
    if (mod.onPhaseExit) {
      const resolvedState = mod.onPhaseExit(session.state, session.phase, next);
      if (resolvedState !== session.state) patch.state = resolvedState;
    }
    return this.buildTeacherPayload(await this.patch(session, patch, true));
  }

  /** Applies a patch with optimistic concurrency; optionally captures a pre-change checkpoint first. */
  private async patch(
    session: SessionRow,
    patch: Parameters<Repository["updateSession"]>[1],
    captureCheckpoint = false,
  ): Promise<SessionRow> {
    const withCheckpoint = captureCheckpoint
      ? {
          ...patch,
          checkpoint: {
            phase: session.phase,
            state: session.state,
            paused: session.paused,
            frozen: session.frozen,
            ended: session.ended,
            capturedAt: new Date().toISOString(),
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
    return this.buildTeacherPayload(session);
  }

  async boardView(code: string): Promise<BoardPayload> {
    const session = await this.requireSession(code);
    const mod = this.moduleFor(session);
    return {
      phase: session.phase,
      paused: session.paused,
      frozen: session.frozen,
      ended: session.ended,
      version: session.version,
      view: mod.boardView(session.state, session.phase),
    };
  }

  private studentPayload(
    session: SessionRow,
    seat: SeatRow,
    credentials?: { deviceToken?: string; rejoinPin?: string },
  ): StudentPayload {
    const mod = this.moduleFor(session);
    return {
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
        paused: session.paused,
        frozen: session.frozen,
        ended: session.ended,
        version: session.version,
        hasCheckpoint: session.checkpoint !== null,
      },
      seats: [],
      view: mod.teacherView(session.state, session.phase),
    };
  }

  /** teacherPayload with the live roster attached — the shape /teach actually polls. */
  private async buildTeacherPayload(session: SessionRow): Promise<TeacherPayload> {
    const payload = this.teacherPayload(session);
    const seats = await this.repo.listSeatsForSession(session.id);
    payload.seats = seats.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      joinedAt: s.joinedAt,
      lastSeenAt: s.lastSeenAt,
      rejoinLocked: s.failedRejoinAttempts >= REJOIN_LOCKOUT_THRESHOLD,
    }));
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
