/**
 * The contract the gameplay team builds against.
 *
 * A LessonModule is a pure, content-owning plug-in: it declares its phase
 * list (drawn from the canonical vocabulary in phases.ts), owns its own
 * state shape, and provides a pure reducer plus three view functions (one
 * per surface). The runtime never inspects lesson state — it stores
 * whatever the module hands back, gates actions by phase before the
 * reducer ever sees them, and calls the module's view functions to render
 * each surface. Nothing about /teach, /play, or /board changes when a new
 * lesson module is registered.
 */
import type { CanonicalPhase } from "./phases.js";

export type SeatId = string;

/** A student action. `type` is the only field the runtime reads; everything else is the module's. */
export type LessonAction = { type: string; [key: string]: unknown };

export type ReduceContext = {
  phase: CanonicalPhase;
  /** The seat submitting the action, or "teacher" for a teacher-triggered hook. */
  seatId: SeatId | "teacher";
  seatIds: readonly SeatId[];
  now: number;
};

export type ReduceResult<TState> =
  | { ok: true; state: TState }
  | { ok: false; reason: string };

export interface LessonModule<TState = unknown> {
  id: string;
  title: string;

  /**
   * Ordered subset of CANONICAL_PHASES this lesson uses. Must be a strictly
   * increasing subsequence of the canonical order (isOrderedSubsequence).
   */
  phases: readonly CanonicalPhase[];

  /**
   * `seed` is the runtime's one hook for cross-lesson continuity (e.g. M1
   * L2 carrying forward L1's franchise state): an opaque
   * `{ lessonModuleId, state }` blob resolved from another session by the
   * server at createSession time, or `undefined` when no source session was
   * requested. The runtime never inspects it — only the receiving module
   * knows what shape to expect from which source module id, and must treat
   * everything about it (including its own presence) as untrusted input to
   * validate, never assume.
   */
  initialState(input: { sessionId: string; seatIds: readonly SeatId[]; seed?: unknown }): TState;

  /**
   * The single source of truth. Must reject (ok:false) anything malformed or
   * not valid for the given phase — the server trusts nothing else, and the
   * runtime calls this only after confirming the action's declared phase
   * matches the session's current phase.
   */
  reduce(state: TState, action: LessonAction, ctx: ReduceContext): ReduceResult<TState>;

  /** Documentation/UI hint only — reduce() is the real gate. */
  allowedActions(phase: CanonicalPhase): readonly string[];

  /** What one seat should see. Must never leak another seat's private data. */
  studentView(state: TState, seatId: SeatId, phase: CanonicalPhase): unknown;

  /** The teacher control-room's per-phase aggregate panel. */
  teacherView(state: TState, phase: CanonicalPhase): unknown;

  /** The projector surface. Must never show anything student-private. */
  boardView(state: TState, phase: CanonicalPhase): unknown;

  /** Class-wide aggregation used for reveal/board/teacher panels. */
  aggregate(state: TState, phase: CanonicalPhase): unknown;

  /**
   * TIME CUT, declared by the lesson rather than assumed by the runtime.
   *
   * A lesson that closes and settles in rounds — Full House's night, Host the
   * League's week, Free Agency's day — describes that here, and the runtime
   * gains a real closing window for it (FINAL CALL / CLOSE NOW, a
   * server-authoritative deadline, and a drain during which a last-second
   * change still lands). A lesson with no such unit omits this entirely and
   * nothing about it changes.
   *
   * The point of making it a declaration is the FALLBACK. Every round that
   * closes has to do something about the students who never committed, and
   * "something" is an economic claim: carrying yesterday's price forward,
   * honouring the dials as they stand, and charging a neutral default are
   * three different lessons. So the module states its policy in words, and
   * names — per seat, before the teacher closes — exactly what is about to
   * happen to each unresolved desk. No universal mystery fallback, and
   * nothing random unless the lesson has proved randomness is the honest
   * model.
   */
  round?: RoundContract<TState>;

  /**
   * Optional lifecycle hook: called by the runtime on every teacher-
   * triggered phase transition (`advance`/`reveal`), right before the new
   * phase is committed, with the phase being left and the phase being
   * entered. Lets a module finish work that would otherwise be stranded the
   * moment a phase-gated action stops being offered — e.g. a lesson with a
   * teacher-staged reveal auto-resolving anything left pending so no
   * reachable post-transition state depends on a click that may never come.
   * Must be pure and deterministic (same inputs, same result, every time —
   * this can run on any transition, not just ones a human is watching).
   * Most modules need nothing here; omit it entirely rather than returning
   * `state` unchanged for every phase. Not called by `restore` (that's a
   * full checkpoint revert, not a forward transition) or `end`. The runtime
   * guarantees `fromPhase !== toPhase` — a control action that targets the
   * session's own current phase (e.g. `reveal` while already in REVEAL) is
   * not a transition and never invokes this hook, so `fromPhase === "X"`
   * inside an implementation can be trusted to mean "actually leaving X,"
   * never "asked to re-enter X."
   */
  onPhaseExit?(state: TState, fromPhase: CanonicalPhase, toPhase: CanonicalPhase): TState;
}

/** One desk that has not committed, and what closing the round will do about it. */
export type UnresolvedSeat = {
  seatId: SeatId;
  /** How this desk is named on /teach — the module's handle, not a raw id. */
  label: string;
  /**
   * What the close will apply for this desk, in words a teacher can read out.
   * Concrete and per-desk ("keeps last night's $48"), never the generic policy
   * sentence: the teacher is deciding whether to wait, and needs to know what
   * waiting would save.
   */
  fallback: string;
};

export interface RoundContract<TState = unknown> {
  /**
   * The teacher hook (`teacher:<name>`) that settles the open round. The
   * runtime calls it through the module's own `reduce`, exactly as a teacher
   * pressing the button would, so a round closed by the clock and a round
   * closed by hand travel the identical code path and cannot diverge.
   */
  closeHook: string;
  /**
   * What this lesson calls a round, lower case, singular — "night", "week",
   * "signing day". The runtime uses it to tell a student, in this lesson's own
   * language, that the thing they were deciding on closed while their choice
   * was still in the air.
   */
  noun: string;

  /**
   * Stable id of the round currently open, or null when none is (between
   * rounds, after the last one, outside PLAY). The runtime keys its TIME CUT
   * record to this so a FINAL CALL started on one round can never close the
   * next one — the case a teacher creates by starting the call, changing their
   * mind, and letting the room run on.
   */
  currentKey(state: TState, phase: CanonicalPhase): string | null;

  /** One sentence naming this lesson's fallback policy. Shown on /teach beside the close control. */
  fallbackPolicy: string;

  /** Who has not committed, and what closing will do to each. Empty when the room is ready. */
  unresolved(state: TState, phase: CanonicalPhase, seatIds: readonly SeatId[]): readonly UnresolvedSeat[];
}

/** Type-erasing helper so the registry can hold modules of differing TState. */
export type AnyLessonModule = LessonModule<unknown>;
