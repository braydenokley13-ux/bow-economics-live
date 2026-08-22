import type { CanonicalPhase } from "../shared/phases.js";

export type SessionId = string;
export type SeatId = string;

/**
 * A snapshot of (phase, state, paused, frozen, ended) captured before a
 * risky teacher transition. R2 repair: `ended` was missing from this shape
 * entirely, so `restore` could never revive a session the teacher ended by
 * mistake — the single riskiest transition wasn't covered by the runtime's
 * own one-click recovery. See `SessionService.control`'s "end"/"restore"
 * cases.
 */
export type Checkpoint = {
  phase: CanonicalPhase;
  state: unknown;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  capturedAt: string;
};

export type SessionRow = {
  id: SessionId;
  code: string;
  title: string;
  lessonModuleId: string;
  phase: CanonicalPhase;
  paused: boolean;
  frozen: boolean;
  ended: boolean;
  /** Opaque lesson state, owned entirely by the LessonModule. */
  state: unknown;
  /** Bumped on every mutation. Doubles as the ETag for all three polling surfaces. */
  version: number;
  checkpoint: Checkpoint | null;
  /**
   * R1 repair: SHA-256 digest of the per-session teacher credential issued
   * once at `createSession` and required (as a bearer token) on every
   * `/control` and teacher-state call thereafter — closes the gap where
   * anyone holding only the join code (i.e. every seated student) could
   * pause, skip, spoil, or end the session, or read every team's
   * in-progress build before reveal.
   */
  teacherKeyHash: string;
  createdAt: string;
  updatedAt: string;
};

export type SeatRow = {
  id: SeatId;
  sessionId: SessionId;
  displayName: string;
  displayNameNormalized: string;
  deviceTokenHash: string;
  rejoinPinHash: string;
  joinedAt: string;
  lastSeenAt: string;
  /** R3 repair: consecutive wrong-PIN rejoin attempts against this seat; locked out at 5 until the teacher clears it. */
  failedRejoinAttempts: number;
};

export type NewSession = {
  code: string;
  title: string;
  lessonModuleId: string;
  phase: CanonicalPhase;
  state: unknown;
  teacherKeyHash: string;
};

export type SessionPatch = Partial<
  Pick<SessionRow, "phase" | "paused" | "frozen" | "ended" | "state" | "checkpoint">
>;

export type NewSeat = {
  sessionId: SessionId;
  displayName: string;
  displayNameNormalized: string;
  deviceTokenHash: string;
  rejoinPinHash: string;
};

export type SeatPatch = Partial<Pick<SeatRow, "deviceTokenHash" | "lastSeenAt" | "failedRejoinAttempts">>;

/** A version-conflict result is a normal outcome, not an exception. */
export type SessionUpdateResult =
  | { ok: true; session: SessionRow }
  | { ok: false; conflict: true; session: SessionRow }
  | { ok: false; conflict: false; session: null };
