/**
 * A monotonic freshness gate for a polled surface (W2, action integrity).
 *
 * The transport serialises its own fetches, so two POLL responses cannot land
 * out of order. An ACTION is a different request on a different socket, and
 * that opens a window nothing was closing:
 *
 *     t0  the desk's poll leaves, carrying session version 10
 *     t1  the pair locks; the POST lands; the room is now version 11
 *     t2  the t0 response arrives, still version 10, and is rendered
 *     t3  the next poll arrives and puts version 11 back
 *
 * Nothing is lost on the server — which is exactly why this never showed up in
 * a state test — but between t2 and t3 the pair watches their own committed
 * decision come undone: the dial back where it was, LOCK armed again. A
 * fifth-grader's response to that is to press it again. Reproduced in the
 * browser by holding one `/api/me` response at the transport, locking
 * underneath it and releasing it: `scripts/e2e-stale-poll.cjs`.
 *
 * The fix is not to serialise actions against polls — that would make every
 * decision wait on a poll — but to refuse to move a surface BACKWARDS. The
 * server bumps `version` on every write and never lowers it, so the last
 * version a surface rendered is a floor.
 *
 * Equal versions pass. The same version legitimately carries a different frame
 * (a countdown's `serverNow`, a recap arriving), and dropping those would stop
 * clocks. Only a version strictly older than one already rendered is a frame
 * from the past.
 */
export type Stamp = { code: string | null; version: number } | null;

export type Freshness<T> = {
  /** True when this payload is at least as new as the newest one already rendered. */
  accept: (payload: T) => boolean;
  /** Forget everything — for a surface that has been pointed at another room. */
  reset: () => void;
  /** The newest version this gate has accepted, for surfaces that report it. */
  readonly version: number;
};

/**
 * `read` pulls the room's identity and version out of whatever shape the
 * surface polls — /play and /teach carry them under `session`, /board carries
 * them at the top level. The three surfaces do not share a payload type and
 * are not being given one here.
 */
export function createFreshness<T>(read: (payload: T) => Stamp): Freshness<T> {
  let code: string | null = null;
  let version = -1;
  let seen = false;
  return {
    accept(payload): boolean {
      let stamp: Stamp = null;
      try {
        stamp = read(payload);
      } catch {
        stamp = null;
      }
      // A payload with no version to compare is not a stale frame — it is a
      // shape this gate does not understand, and swallowing it would blank a
      // live surface. Let the renderer deal with it.
      if (!stamp || typeof stamp.version !== "number" || !Number.isFinite(stamp.version)) return true;
      // A different room is not a rewind. A teacher who reopens another session
      // (or a projector re-pointed at a new code) starts from that room's own
      // version, which is usually far LOWER than the one just left.
      if (!seen || stamp.code !== code) {
        seen = true;
        code = stamp.code;
        version = stamp.version;
        return true;
      }
      if (stamp.version < version) return false;
      version = stamp.version;
      return true;
    },
    reset(): void {
      code = null;
      version = -1;
      seen = false;
    },
    get version(): number {
      return version;
    },
  };
}
