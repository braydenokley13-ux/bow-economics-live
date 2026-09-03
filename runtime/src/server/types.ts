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
  /** The round lifecycle as it stood before the change being undone. */
  round: RoundState | null;
  /**
   * The class log as it stood before the change being undone.
   *
   * Restore rewinds the class; the record of what the class did has to rewind
   * with it. Without this the log is append-only across an undo, so a night
   * the teacher took back is still in it — and the next desk to come back
   * from a dark Chromebook is told the same night closed twice.
   */
  log: ClassEvent[];
  capturedAt: string;
  /**
   * Why this checkpoint was taken, in words a teacher can read on the restore
   * control. "Undo" with no idea what it undoes is not a recovery mechanism.
   */
  label: string;
};

/**
 * TIME CUT, as runtime state rather than teacher guidance.
 *
 * A "round" is the unit a lesson closes and settles — Full House's night,
 * Host the League's week, Free Agency's day. It lives INSIDE the PLAY phase,
 * not beside it: a lesson runs several rounds without ever leaving PLAY, so
 * this is session state keyed to the module's own round id, not a new entry in
 * the canonical phase vocabulary.
 *
 *   OPEN        decisions are being taken; nothing is announced
 *   FINAL_CALL  the teacher has started the closing window. Decisions are
 *               still accepted — that IS the drain, and it is what makes a
 *               last-second change land instead of vanishing. What changes is
 *               that the room is told, on all three surfaces, that the window
 *               is closing, and that the close is now scheduled rather than a
 *               separate thing the teacher has to remember to press.
 *   CLOSED      the round has settled. A decision arriving now is refused with
 *               a reason naming what happened, never dropped in silence.
 *
 * `finalCallEndsAt` is a SERVER timestamp. Clients render a countdown from it,
 * but no client clock is ever consulted to decide whether an action was in
 * time: the server compares its own `Date.now()` against this field, so a
 * Chromebook with a wrong clock cannot buy itself extra seconds or lose any.
 */
export type RoundState = {
  status: "OPEN" | "FINAL_CALL" | "CLOSED";
  /** The module's own id for the round this record is about (e.g. a night id). */
  key: string;
  /** Server clock. Set only in FINAL_CALL. */
  finalCallEndsAt: string | null;
  /** Server clock, for "how long has the room had?" on /teach. */
  finalCallStartedAt: string | null;
  /** How the round ended, once it has. */
  closedBy: "final_call_expired" | "close_now" | "module" | null;
};

/**
 * One thing the CLASS did, in the lesson's own words.
 *
 * The founder's rule for a student who comes back — a slept Chromebook, a
 * closed tab, a trip to the nurse — is "current authoritative state plus a
 * compact recap; do NOT rewind the class." That needs a record of what
 * happened while they were gone, and the runtime cannot write one itself: it
 * does not know a night from a week from a signing day, and must not learn
 * (§12). So the module names the events and the runtime keeps the log.
 *
 * Class-level only. Nothing seat-private is ever written here — the log is
 * read back by whichever desk returns, and a line naming one desk's decision
 * would be handed to another desk's screen.
 */
export type ClassEvent = {
  /** Monotonic within a session. A seat remembers the last one it has been shown. */
  seq: number;
  at: string;
  text: string;
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
  /** TIME CUT state for the round currently in play. Null outside PLAY, or before the first round opens. */
  round: RoundState | null;
  /** What the class has done, newest last, bounded. See `ClassEvent`. */
  log: ClassEvent[];
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
  /**
   * Ids of actions this seat has already had applied, newest last, bounded.
   *
   * This is what makes retrying an action SAFE, and retrying is what stops a
   * transient refusal (paused, frozen, a version race) from destroying a
   * student's decision. Without it, "keep it queued and try again" would
   * double-apply every action whose response was lost in flight — a worse bug
   * than the one it fixes. Persisted with the seat, so a mid-class server
   * restart does not reopen the window.
   */
  appliedActionIds: string[];
  /**
   * The last class event this desk has been shown.
   *
   * Advanced silently on every poll while the desk is present — being in the
   * room IS having seen it. It stops advancing the moment `awaySince` is set,
   * so the recap a returning pair has not read yet cannot be erased by their
   * own next poll.
   */
  seenSeq: number;
  /**
   * When this desk went dark, if it has come back and not yet acknowledged
   * what it missed. Null the rest of the time.
   */
  awaySince: string | null;
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
  Pick<SessionRow, "phase" | "paused" | "frozen" | "ended" | "state" | "checkpoint" | "round" | "log">
>;

export type NewSeat = {
  sessionId: SessionId;
  displayName: string;
  displayNameNormalized: string;
  deviceTokenHash: string;
  rejoinPinHash: string;
};

export type SeatPatch = Partial<
  // `rejoinPinHash` is writable for exactly one reason: a teacher reseating a
  // pair whose device died mints a new PIN for the seat they already hold.
  // Nothing student-facing can reach that path.
  Pick<SeatRow, "deviceTokenHash" | "rejoinPinHash" | "lastSeenAt" | "failedRejoinAttempts" | "appliedActionIds" | "seenSeq" | "awaySince">
>;

/** A version-conflict result is a normal outcome, not an exception. */
export type SessionUpdateResult =
  | { ok: true; session: SessionRow }
  | { ok: false; conflict: true; session: SessionRow }
  | { ok: false; conflict: false; session: null };
