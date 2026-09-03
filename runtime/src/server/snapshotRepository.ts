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
import type { SessionBus } from "./sessionBus.js";
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
  /**
   * Lookup indexes for the two hot paths.
   *
   * `getSeatByDeviceTokenHash` runs on EVERY student poll and every action, and
   * `getSessionByCode` on every teacher and projector poll; both were linear
   * scans over every row ever stored. Nothing is pruned in this product, so
   * that cost grows across a term rather than across a class. Maintained
   * alongside the maps rather than derived on read, so a lookup is O(1) and the
   * only thing that can go stale is a write that forgets to update them — which
   * is why every mutation funnels through the small number of setters below.
   */
  private seatsByDeviceTokenHash = new Map<string, SeatId>();
  private sessionsByCode = new Map<string, SessionId>();
  /**
   * Where every mutation is announced. Optional: the repository works exactly
   * as before without one, which is what the unit tests use. It lives HERE
   * rather than in the service because this is the single choke point every
   * write already passes through — a change that reaches disk and not the bus
   * would be a change some surface never hears about.
   */
  private readonly bus: SessionBus | null;
  private readonly filePath: string | null;
  private writeChain: Promise<void> = Promise.resolve();
  /**
   * Coalescing state for disk writes.
   *
   * Every `/api/me` poll touches the seat's `lastSeenAt`, and every seat write
   * re-serialised the ENTIRE store. Thirty students at a 1.2s poll interval is
   * ~25 full-file rewrites a second, on a file that only grows. The in-memory
   * store is already the source of truth for a live session, so a write can be
   * deferred a moment and satisfy many mutations at once. Durability is
   * unchanged in the way that matters: the flush is bounded, `flushToDisk()`
   * still forces one, and clean shutdown still awaits it.
   */
  private dirty = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  /** How long a mutation may sit in memory before it must reach disk. */
  private readonly flushDelayMs: number;
  private ready: Promise<void>;

  /** Overridable so tests can pin timestamps. */
  now: () => string = () => new Date().toISOString();

  constructor(filePath: string | null, options: { flushDelayMs?: number; bus?: SessionBus } = {}) {
    this.filePath = filePath;
    this.bus = options.bus ?? null;
    // Zero means "write through on every mutation" — what the tests want, so
    // they never have to reason about a timer.
    this.flushDelayMs = options.flushDelayMs ?? 200;
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
      // SHAPE, not just syntax. Only a JSON.parse failure used to quarantine —
      // a file that is valid JSON but the wrong shape (`{"sessions": "..."}`,
      // an older schema, a hand-edited restore) was loaded straight into the
      // store, where rows with missing ids produce 500s from routes that sort
      // or index them. A snapshot this build cannot serve is a corrupt snapshot
      // as far as the classroom is concerned, and gets the same treatment: set
      // aside, never deleted, boot fresh and say so.
      if (!Array.isArray(parsed?.sessions) || !Array.isArray(parsed?.seats)) {
        throw new Error("snapshot does not contain session and seat arrays");
      }
      const okSession = (r: unknown): r is SessionRow =>
        !!r && typeof r === "object" && typeof (r as SessionRow).id === "string" && typeof (r as SessionRow).code === "string";
      const okSeat = (r: unknown): r is SeatRow =>
        !!r && typeof r === "object" && typeof (r as SeatRow).id === "string" && typeof (r as SeatRow).sessionId === "string";
      if (!parsed.sessions.every(okSession) || !parsed.seats.every(okSeat)) {
        throw new Error("snapshot contains rows without the identifying fields this build requires");
      }
      // Fields added after a snapshot was written are absent from it. Defaulted
      // here rather than guarded at every use: a snapshot is the state of a
      // class that may be mid-period, and "the runtime was upgraded between
      // periods" must not be a way to lose a room.
      for (const session of parsed.sessions) {
        this.putSession({ ...session, round: session.round ?? null, log: session.log ?? [] });
      }
      for (const seat of parsed.seats) {
        this.putSeat({
          ...seat,
          appliedActionIds: seat.appliedActionIds ?? [],
          // A pre-upgrade snapshot has no log, so there is nothing anyone can
          // have missed: every seat starts level with the empty log rather
          // than being told it missed events that were never recorded.
          seenSeq: seat.seenSeq ?? 0,
          awaySince: seat.awaySince ?? null,
        });
      }
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
      // Nothing partially loaded is kept: a snapshot that failed validation
      // must not leave half a class in memory.
      this.sessions.clear();
      this.seats.clear();
      this.sessionsByCode.clear();
      this.seatsByDeviceTokenHash.clear();
    }
  }

  /** The one place a session row enters the store, so its index cannot drift. */
  private putSession(row: SessionRow, previousCode?: string): void {
    if (previousCode !== undefined && previousCode !== row.code) this.sessionsByCode.delete(previousCode);
    this.sessions.set(row.id, row);
    this.sessionsByCode.set(row.code, row.id);
  }

  /** The one place a seat row enters the store, so its index cannot drift. */
  private putSeat(row: SeatRow, previousTokenHash?: string): void {
    if (previousTokenHash !== undefined && previousTokenHash !== row.deviceTokenHash) {
      this.seatsByDeviceTokenHash.delete(previousTokenHash);
    }
    this.seats.set(row.id, row);
    this.seatsByDeviceTokenHash.set(row.deviceTokenHash, row.id);
  }

  private persist(): void {
    if (!this.filePath) return;
    if (this.flushDelayMs <= 0) {
      this.writeNow();
      return;
    }
    this.dirty = true;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (this.dirty) this.writeNow();
    }, this.flushDelayMs);
    // A pending flush must never hold a clean shutdown open.
    this.flushTimer.unref?.();
  }

  private writeNow(): void {
    if (!this.filePath) return;
    this.dirty = false;
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

  /** Resolves once every mutation so far has landed on disk. Used by tests and clean shutdown. */
  async flushToDisk(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.dirty) this.writeNow();
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
      round: null,
      log: [],
      teacherKeyHash: input.teacherKeyHash,
      createdAt: at,
      updatedAt: at,
    };
    this.putSession(row);
    this.persist();
    this.bus?.publish(row.id, row.version);
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
    const id = this.sessionsByCode.get(code);
    const row = id ? this.sessions.get(id) : undefined;
    return row ? clone(row) : null;
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
    this.putSession(next, row.code);
    this.persist();
    this.bus?.publish(next.id, next.version);
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
      appliedActionIds: [],
      // A seat joining mid-class is level with the room as it stands: what it
      // missed before it existed is the lesson, not a recap.
      seenSeq: this.sessions.get(input.sessionId)?.log.at(-1)?.seq ?? 0,
      awaySince: null,
    };
    this.putSeat(row);
    this.persist();
    this.bus?.publishSeatChange(row.sessionId, this.sessions.get(row.sessionId)?.version ?? 0);
    return clone(row);
  }

  async getSeatById(id: SeatId): Promise<SeatRow | null> {
    const row = this.seats.get(id);
    return row ? clone(row) : null;
  }

  async getSeatByDeviceTokenHash(hash: string): Promise<SeatRow | null> {
    const id = this.seatsByDeviceTokenHash.get(hash);
    const row = id ? this.seats.get(id) : undefined;
    // A rejoin rotates the token, retiring the old hash. The index is updated
    // on that write, so a stale hash simply misses — but the belt-and-braces
    // check keeps a retired token from ever resolving to a live seat if an
    // index entry were somehow left behind.
    return row && row.deviceTokenHash === hash ? clone(row) : null;
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
    this.putSeat(next, row.deviceTokenHash);
    this.persist();
    // A seat change moves no session state, so nothing else here would announce
    // it — and the teacher's live join list is built out of exactly this.
    //
    // But a PRESENCE-ONLY write must stay silent, and that is not a nicety. Every
    // /play poll stamps `lastSeenAt`; when that stamp nudged the room, the nudge
    // woke every desk, every woken desk polled, every poll stamped again, and the
    // room drove itself. Measured in Chromium with two desks: ~230 requests per
    // second, sustained, from one teacher page — a self-inflicted denial of
    // service that gets worse with every desk added, which is the opposite of
    // what 16 desks are supposed to feel like. Presence is not a class event; it
    // rides the next reconciliation poll, seconds later, which is soon enough for
    // a roster dot and quiet enough to leave the room alone.
    if (announcesSeatChange(patch)) {
      this.bus?.publishSeatChange(next.sessionId, this.sessions.get(next.sessionId)?.version ?? 0);
    }
    return clone(next);
  }
}

/**
 * Fields whose only job is to record that a device is still breathing. A write
 * touching nothing else changes no surface anyone is looking at.
 */
const PRESENCE_ONLY_FIELDS: ReadonlySet<string> = new Set([
  "lastSeenAt",
  "failedRejoinAttempts",
  // Written on the same poll as `lastSeenAt` — every poll, from every desk.
  // If this announced, the storm the presence rule exists to stop would be
  // back with a different field name on it.
  "seenSeq",
]);

function announcesSeatChange(patch: SeatPatch): boolean {
  return Object.keys(patch).some((k) => !PRESENCE_ONLY_FIELDS.has(k));
}
