/**
 * The change bus: who to wake when a session moves.
 *
 * W4. Until now the three surfaces learned about a change only by asking again
 * on their own timer, so the room's slowest visible reaction to a teacher
 * pressing a button was a whole poll interval — a second on the projector, one
 * and a half on the teacher's own console — and the only way to make that
 * shorter was to poll harder, which costs every desk in the room.
 *
 * The founder's shape is PUSH PRIMARY + CANONICAL SERVER TRUTH + POLL
 * FALLBACK, and the second clause is the one that decides the design: what
 * this bus carries is a NUDGE, never a payload. A subscriber is told only that
 * the session it is watching has moved; it then re-reads truth through exactly
 * the same authenticated, ETagged endpoint it was already polling. So the push
 * path can be lossy, out of order, or entirely absent without any surface ever
 * rendering something the server did not rule on — and the poll loop stays
 * live underneath as reconciliation rather than being replaced.
 *
 * Deliberately not an EventEmitter subclass and deliberately not a dependency:
 * one Map of sets, no wildcard listeners, and a hard cap so a client that
 * reconnects in a loop cannot pin the process (D12 — one Node process, one
 * machine, no external service).
 */
export type BusListener = (nudge: { version: number; seatEpoch: number }) => void;

/** Guardrail, not a class-size limit: 32 desks + a projector + a console + rejoin churn, with room to spare. */
const MAX_LISTENERS_PER_SESSION = 200;

export class SessionBus {
  private readonly listeners = new Map<string, Set<BusListener>>();
  /**
   * Seat mutations do not bump session.version — a join changes no session
   * state — but they DO change the teacher's view. This counter is bumped on
   * every seat change so a nudge is distinguishable from the last one even when
   * the session itself has not moved.
   */
  private readonly seatEpochs = new Map<string, number>();

  subscribe(sessionId: string, listener: BusListener): () => void {
    let set = this.listeners.get(sessionId);
    if (!set) {
      set = new Set();
      this.listeners.set(sessionId, set);
    }
    if (set.size >= MAX_LISTENERS_PER_SESSION) {
      // Refusing is safe: the caller falls back to polling, which is the whole
      // point of the fallback existing. Silently accepting an unbounded number
      // of open responses is not.
      return () => {};
    }
    set.add(listener);
    return () => {
      const live = this.listeners.get(sessionId);
      if (!live) return;
      live.delete(listener);
      if (live.size === 0) this.listeners.delete(sessionId);
    };
  }

  /** A session's own state moved. */
  publish(sessionId: string, version: number): void {
    this.fan(sessionId, version);
  }

  /** A seat joined, rejoined, or changed. Carries the session's current version unchanged. */
  publishSeatChange(sessionId: string, version: number): void {
    this.seatEpochs.set(sessionId, (this.seatEpochs.get(sessionId) ?? 0) + 1);
    this.fan(sessionId, version);
  }

  /** How many surfaces are currently listening to this session. Reported by the health route. */
  listenerCount(sessionId: string): number {
    return this.listeners.get(sessionId)?.size ?? 0;
  }

  private fan(sessionId: string, version: number): void {
    const set = this.listeners.get(sessionId);
    if (!set) return;
    const nudge = { version, seatEpoch: this.seatEpochs.get(sessionId) ?? 0 };
    // Copied before iterating: a listener that unsubscribes itself while being
    // notified (a closed connection is the normal case) must not corrupt the
    // walk, and one that throws must not silence the rest of the room.
    for (const listener of [...set]) {
      try {
        listener(nudge);
      } catch {
        set.delete(listener);
      }
    }
  }
}
