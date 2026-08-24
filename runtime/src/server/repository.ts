/**
 * The data gateway, adapted from bow-finlit's `api/_lib/repository.ts`.
 *
 * The interface shape (typed rows, optimistic-version patches, a
 * conflict-as-value update result) ports directly — that pattern is what
 * lets `sessionService` be tested with no server running. The concrete
 * backend does not: the donor paired this interface with a Supabase
 * implementation, which D12 rules out (no external database, no cloud
 * services — `npm install && npm run dev` on one machine only). The one
 * implementation here, `SnapshotRepository`, is new: in-memory maps backed
 * by an atomically-written JSON snapshot file.
 */
import type { NewSeat, NewSession, SeatId, SeatPatch, SeatRow, SessionId, SessionPatch, SessionRow, SessionUpdateResult } from "./types.js";

export interface Repository {
  createSession(input: NewSession): Promise<SessionRow>;
  listSessions(): Promise<SessionRow[]>;
  getSessionById(id: SessionId): Promise<SessionRow | null>;
  getSessionByCode(code: string): Promise<SessionRow | null>;
  /** `expectedVersion` of `null` means "write regardless"; a number enforces optimistic concurrency. */
  updateSession(id: SessionId, patch: SessionPatch, expectedVersion: number | null): Promise<SessionUpdateResult>;

  createSeat(input: NewSeat): Promise<SeatRow>;
  getSeatById(id: SeatId): Promise<SeatRow | null>;
  getSeatByDeviceTokenHash(hash: string): Promise<SeatRow | null>;
  getSeatBySessionAndName(sessionId: SessionId, normalizedName: string): Promise<SeatRow | null>;
  listSeatsForSession(sessionId: SessionId): Promise<SeatRow[]>;
  updateSeat(id: SeatId, patch: SeatPatch): Promise<SeatRow | null>;
}

export class RepositoryError extends Error {
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "RepositoryError";
    this.status = status;
  }
}
