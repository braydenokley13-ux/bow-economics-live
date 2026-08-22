/**
 * In-memory `Repository` backed by a JSON snapshot file.
 *
 * This is the one and only backend this product ships (D12: no external
 * database, no cloud services). It plays the role the donor split across
 * `memory-repository.ts` (in-memory maps, used for tests) and
 * `supabase-repository.ts` (durable persistence) — here those are one
 * class, because durability requirements are modest (one classroom, one
 * process, restart-survival is enough; there is no multi-instance
 * deployment to coordinate).
 *
 * Every mutation updates the in-memory maps synchronously (so a request
 * immediately after a write sees it) and schedules an async disk write.
 * Disk writes are serialized through a single promise chain — the same
 * "only one thing in flight" trick the donor's save-coordinator uses for
 * network requests — so two mutations in quick succession cannot interleave
 * their writes to the snapshot file. Each write goes to a temp file first,
 * then `fs.rename`s over the real path, which is atomic on the same
 * filesystem: a crash mid-write leaves either the old snapshot or the new
 * one, never a half-written file.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { RepositoryError, type Repository } from "./repository.js";
import type {
  NewSeat,
  NewSession,
  SeatId,
  SeatPatch,
  SeatRow,
  SessionId,
  SessionPatch,
  SessionRow,
  SessionUpdateResult,
} from "./types.js";

type SnapshotFile = {
  version: 1;
  sessions: SessionRow[];
  seats: SeatRow[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class SnapshotRepository implements Repository {
  private sessions = new Map<SessionId, SessionRow>();
  private seats = new Map<SeatId, SeatRow>();
  private readonly filePath: string | null;
  private writeChain: Promise<void> = Promise.resolve();
  private ready: Promise<void>;

  /** Overridable so tests can pin timestamps. */
  now: () => string = () => new Date().toISOString();

  constructor(filePath: string | null) {
    this.filePath = filePath;
    this.ready = this.filePath ? this.load(this.filePath) : Promise.resolve();
  }

  /** Resolves once any snapshot on disk has been loaded into memory. Call before serving traffic. */
  async whenReady(): Promise<void> {
    await this.ready;
  }

  /**
   * R4 repair (VERIFY_RUNTIME.md BLOCKING/REQUIRED-REPAIR): a corrupted
   * snapshot file used to re-throw straight through `whenReady()`, and
   * `main()`'s only handling was `console.error` + `process.exit(1)` — one
   * bad byte (a bad manual restore, a flaky removable drive) took the whole
   * classroom down with no recovery path short of shell access. Read and
   * parse are now separate try/catches: a read failure other than ENOENT
   * (permissions, a missing mount) is still fatal — that's a real
   * environment problem, not something to silently paper over — but a
   * parse failure quarantines the bad file (renamed aside, never deleted)
   * and boots with a fresh empty store instead. Loud, not silent: both
   * paths log to stderr so a teacher/support sees exactly what happened.
   */
  private async load(filePath: string): Promise<void> {
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === "ENOENT") return; // no snapshot yet — a fresh install, nothing to load
      throw error; // a genuine filesystem problem — still fatal, not a corruption case
    }
    try {
      const parsed = JSON.parse(raw) as SnapshotFile;
      for (const session of parsed.sessions ?? []) this.sessions.set(session.id, session);
      for (const seat of parsed.seats ?? []) this.seats.set(seat.id, seat);
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error("[snapshot] FAILED TO PARSE snapshot file — quarantining it and starting fresh:", parseError);
      try {
        const quarantinePath = `${filePath}.corrupt-${Date.now()}`;
        await rename(filePath, quarantinePath);
        // eslint-disable-next-line no-console
        console.error(`[snapshot] corrupted file moved aside to ${quarantinePath} — it was NOT deleted`);
      } catch (renameError) {
        // eslint-disable-next-line no-console
        console.error("[snapshot] could not quarantine the corrupted file (continuing with a fresh store anyway):", renameError);
      }
      // Fall through with whatever was already loaded (nothing, in
      // practice, since a single JSON.parse spans the whole file) — the
      // server still comes up and starts serving new sessions.
    }
  }

  private persist(): void {
    if (!this.filePath) return;
    const snapshot: SnapshotFile = {
      version: 1,
      sessions: [...this.sessions.values()],
      seats: [...this.seats.values()],
    };
    const filePath = this.filePath;
    this.writeChain = this.writeChain
      .then(async () => {
        await mkdir(path.dirname(filePath), { recursive: true });
        const tmp = `${filePath}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(snapshot), "utf8");
        await rename(tmp, filePath);
      })
      .catch((error) => {
        // A snapshot write failure must not crash the live session — the
        // in-memory state (already applied) stays the source of truth for
        // this run; the next successful write catches disk back up.
        // eslint-disable-next-line no-console
        console.error("[snapshot] write failed:", error);
      });
  }

  /** Resolves once every write queued so far has landed on disk. Used by tests and clean shutdown. */
  async flushToDisk(): Promise<void> {
    await this.writeChain;
  }

  /* -------------------------------------------------------------- sessions -- */

  async createSession(input: NewSession): Promise<SessionRow> {
    const clash = await this.getSessionByCode(input.code);
    if (clash) throw new RepositoryError("join code already in use", 409);
    const at = this.now();
    const row: SessionRow = {
      id: randomUUID(),
      code: input.code,
      title: input.title,
      lessonModuleId: input.lessonModuleId,
      phase: input.phase,
      paused: false,
      frozen: false,
      ended: false,
      state: input.state,
      version: 1,
      checkpoint: null,
      teacherKeyHash: input.teacherKeyHash,
      createdAt: at,
      updatedAt: at,
    };
    this.sessions.set(row.id, row);
    this.persist();
    return clone(row);
  }

  async listSessions(): Promise<SessionRow[]> {
    return [...this.sessions.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .map(clone);
  }

  async getSessionById(id: SessionId): Promise<SessionRow | null> {
    const row = this.sessions.get(id);
    return row ? clone(row) : null;
  }

  async getSessionByCode(code: string): Promise<SessionRow | null> {
    for (const row of this.sessions.values()) {
      if (row.code === code) return clone(row);
    }
    return null;
  }

  async updateSession(
    id: SessionId,
    patch: SessionPatch,
    expectedVersion: number | null,
  ): Promise<SessionUpdateResult> {
    const row = this.sessions.get(id);
    if (!row) return { ok: false, conflict: false, session: null };
    if (expectedVersion !== null && row.version !== expectedVersion) {
      return { ok: false, conflict: true, session: clone(row) };
    }
    const next: SessionRow = { ...row, ...patch, version: row.version + 1, updatedAt: this.now() };
    this.sessions.set(id, next);
    this.persist();
    return { ok: true, session: clone(next) };
  }

  /* ----------------------------------------------------------------- seats -- */

  async createSeat(input: NewSeat): Promise<SeatRow> {
    const clash = await this.getSeatBySessionAndName(input.sessionId, input.displayNameNormalized);
    if (clash) throw new RepositoryError("name already in use in this session", 409);
    const at = this.now();
    const row: SeatRow = {
      id: randomUUID(),
      sessionId: input.sessionId,
      displayName: input.displayName,
      displayNameNormalized: input.displayNameNormalized,
      deviceTokenHash: input.deviceTokenHash,
      rejoinPinHash: input.rejoinPinHash,
      joinedAt: at,
      lastSeenAt: at,
      failedRejoinAttempts: 0,
    };
    this.seats.set(row.id, row);
    this.persist();
    return clone(row);
  }

  async getSeatById(id: SeatId): Promise<SeatRow | null> {
    const row = this.seats.get(id);
    return row ? clone(row) : null;
  }

  async getSeatByDeviceTokenHash(hash: string): Promise<SeatRow | null> {
    for (const row of this.seats.values()) {
      if (row.deviceTokenHash === hash) return clone(row);
    }
    return null;
  }

  async getSeatBySessionAndName(sessionId: SessionId, normalizedName: string): Promise<SeatRow | null> {
    for (const row of this.seats.values()) {
      if (row.sessionId === sessionId && row.displayNameNormalized === normalizedName) return clone(row);
    }
    return null;
  }

  async listSeatsForSession(sessionId: SessionId): Promise<SeatRow[]> {
    return [...this.seats.values()]
      .filter((row) => row.sessionId === sessionId)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
      .map(clone);
  }

  async updateSeat(id: SeatId, patch: SeatPatch): Promise<SeatRow | null> {
    const row = this.seats.get(id);
    if (!row) return null;
    const next: SeatRow = { ...row, ...patch };
    this.seats.set(id, next);
    this.persist();
    return clone(next);
  }
}
