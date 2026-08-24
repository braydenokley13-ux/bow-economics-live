/**
 * The tiny proof-of-loop lesson: students tap a color, the teacher reveals
 * the class distribution on the board. This exists to prove the whole
 * runtime end-to-end (join, phase-gate, action, reduce, aggregate, reveal,
 * synthesis, restart-safe persistence) with zero real gameplay content —
 * the gameplay team's first real module replaces this file, not the
 * runtime around it.
 */
import type { LessonModule, ReduceResult, SeatId } from "../shared/lessonModule.js";
import type { CanonicalPhase } from "../shared/phases.js";

export const COLORS = ["red", "blue", "green", "yellow"] as const;
export type Color = (typeof COLORS)[number];
const isColor = (v: unknown): v is Color => typeof v === "string" && (COLORS as readonly string[]).includes(v);

export type LobbyDemoState = {
  picks: Record<SeatId, Color>;
};

type PickAction = { type: "pick"; color: Color };

const PHASES: readonly CanonicalPhase[] = ["LOBBY", "PLAY", "REVEAL", "SYNTHESIS", "COMPLETE"];

export const lobbyDemoModule: LessonModule<LobbyDemoState> = {
  id: "lobby-demo",
  title: "Lobby Demo: Pick a Color",
  phases: PHASES,

  initialState() {
    return { picks: {} };
  },

  reduce(state, action, ctx): ReduceResult<LobbyDemoState> {
    if (ctx.phase !== "PLAY") {
      return { ok: false, reason: `picks are only accepted during PLAY (session is in ${ctx.phase})` };
    }
    if (action.type !== "pick") {
      return { ok: false, reason: `unknown action "${action.type}"` };
    }
    const pick = action as PickAction;
    if (!isColor(pick.color)) {
      return { ok: false, reason: `"${String(pick.color)}" is not a color this lesson accepts` };
    }
    if (ctx.seatId === "teacher") {
      return { ok: false, reason: "only a seated student can pick" };
    }
    return { ok: true, state: { picks: { ...state.picks, [ctx.seatId]: pick.color } } };
  },

  allowedActions(phase) {
    return phase === "PLAY" ? ["pick"] : [];
  },

  studentView(state, seatId, phase) {
    return { phase, myPick: state.picks[seatId] ?? null, colors: COLORS };
  },

  teacherView(state, phase) {
    const total = Object.keys(state.picks).length;
    if (phase === "REVEAL" || phase === "SYNTHESIS" || phase === "COMPLETE") {
      return { phase, pickedCount: total, tally: tally(state) };
    }
    return { phase, pickedCount: total };
  },

  boardView(state, phase) {
    if (phase === "REVEAL") {
      return { mode: "reveal", tally: tally(state), total: Object.keys(state.picks).length };
    }
    if (phase === "SYNTHESIS") {
      return {
        mode: "synthesis",
        tally: tally(state),
        total: Object.keys(state.picks).length,
        note: "Every seat's tap became one bar on this chart — that's the whole loop: a private action, aggregated, shown back to the room.",
      };
    }
    if (phase === "PLAY") {
      return { mode: "waiting", pickedCount: Object.keys(state.picks).length };
    }
    return { mode: "idle", phase };
  },

  aggregate(state) {
    return tally(state);
  },
};

function tally(state: LobbyDemoState): Record<Color, number> {
  const counts: Record<Color, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const color of Object.values(state.picks)) counts[color] += 1;
  return counts;
}
