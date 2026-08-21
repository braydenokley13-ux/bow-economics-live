import type { CanonicalPhase } from "../shared/phases.js";

export type SessionId = string;
export type SeatId = string;

/** A snapshot of (phase, state, paused, frozen) captured before a risky teacher transition. */
export type Checkpoint = {
  phase: CanonicalPhase;
  state: unknown;
  paused: boolean;
  frozen: boolean;
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
};

export type NewSession = {
  code: string;
  title: string;
  lessonModuleId: string;
  phase: CanonicalPhase;
  state: unknown;
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

export type SeatPatch = Partial<Pick<SeatRow, "deviceTokenHash" | "lastSeenAt">>;

/** A version-conflict result is a normal outcome, not an exception. */
export type SessionUpdateResult =
  | { ok: true; session: SessionRow }
  | { ok: false; conflict: true; session: SessionRow }
  | { ok: false; conflict: false; session: null };
