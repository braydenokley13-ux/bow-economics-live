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

/** Type-erasing helper so the registry can hold modules of differing TState. */
export type AnyLessonModule = LessonModule<unknown>;
