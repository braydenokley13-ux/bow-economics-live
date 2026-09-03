/**
 * The transport for all three surfaces: ETagged polling, optionally driven by a
 * push nudge.
 *
 * The loop never dies: a network failure or a non-2xx response reports to
 * `onError` and simply schedules the next tick anyway. That is the whole of
 * this product's "auto-reconnect" story — there is no connection to
 * re-establish, only a fetch to try again, which is what makes it robust on
 * a flaky school AP.
 *
 * W4 adds `streamUrl`: a server-sent event stream that carries ONLY "the
 * session moved", never a payload. When it is connected, a nudge fires a tick
 * immediately and the timer stretches to a long reconciliation interval; when
 * it drops — a proxy kills it, the AP blinks, the laptop sleeps — the timer
 * snaps back to the original short interval and the surface keeps working
 * exactly as it did before any of this existed. Push decides WHEN to ask;
 * this fetch is still the only thing that decides WHAT IS TRUE.
 *
 * The two paths cannot diverge, because there is only one path: a nudge does
 * not carry state, it calls the same `tick()` the timer calls.
 */
import { ApiError } from "./api.js";

export type PollHandle = {
  stop: () => void;
  /** Whether the push stream is currently connected. Surfaces show this; nothing depends on it. */
  readonly pushing: boolean;
};

export function startPolling<T>(
  url: string,
  intervalMs: number,
  onData: (data: T) => void,
  options: {
    headers?: () => Record<string, string>;
    onError?: (error: unknown) => void;
    /**
     * W2 repair-2 D1 (Kid A #8a): a 304 took the "nothing to do" branch without
     * telling the caller anything, so a sync label written by `onError` could
     * never clear itself — a desk sat on a false "offline — retrying" for 95
     * seconds while `/api/me` was answering. Additive and optional: a caller
     * that does not pass it sees no behaviour change at all.
     */
    onUnchanged?: () => void;
    /**
     * SSE endpoint carrying change nudges for this session. Optional: without
     * it this behaves exactly as it always has.
     */
    streamUrl?: string;
    /**
     * How often to poll while the stream is healthy. Still polls — a push
     * transport that is trusted to be lossless is a push transport that will
     * eventually lose something in a room nobody is debugging.
     */
    reconcileMs?: number;
    /** Called when the push stream connects or drops, for surfaces that show it. */
    onPushState?: (connected: boolean) => void;
  } = {},
): PollHandle {
  let etag: string | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let source: EventSource | null = null;
  let pushing = false;
  /** Guards against a nudge and a timer tick overlapping into two in-flight fetches. */
  let inFlight = false;
  /**
   * A nudge that arrived while a fetch was already running. It must not be
   * dropped: the in-flight request may have been issued BEFORE the change, so
   * discarding the nudge silently downgrades that surface to its slow
   * reconciliation interval for one whole beat — which was measured as a desk
   * taking a full poll to see a reveal while the projector took 43ms.
   */
  let missedNudge = false;
  const reconcileMs = options.reconcileMs ?? Math.max(intervalMs * 5, 6000);
  /**
   * Nudges are spent from a small token bucket: a few may fire a tick
   * immediately, and after that the rate is capped.
   *
   * The cap exists because a write caused by a read is a feedback loop, and a
   * feedback loop with no ceiling is a classroom taking itself down. One did:
   * a presence stamp on every /play poll nudged the room, the nudge woke every
   * desk, and two desks produced ~230 requests per second. That cause is
   * repaired at its source; this is what keeps the next one an annoyance
   * instead of an outage.
   *
   * The bucket rather than a flat interval, because a flat one taxes the thing
   * the push transport exists for. A teacher's reveal is usually two or three
   * writes in quick succession, so a leading-edge-only gate charged the desk
   * ~120ms for the nudge that actually mattered — measured at 148ms to a desk
   * against 53ms to the projector. Three tokens covers a normal reveal at full
   * speed; a storm still cannot exceed one tick per REFILL.
   */
  const NUDGE_REFILL_MS = 120;
  const NUDGE_BURST = 3;
  let nudgeTokens = NUDGE_BURST;
  let tokensAt = Date.now();
  let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

  const currentInterval = (): number => (pushing ? reconcileMs : intervalMs);

  /**
   * Which transport is carrying this surface, on the document itself.
   * Not decoration: "the room feels laggy" is a thing a teacher reports and
   * nobody can currently answer, and it is the one fact that separates a slow
   * network from a blocked stream.
   */
  function markTransport(connected: boolean): void {
    try {
      document.documentElement.dataset["push"] = connected ? "on" : "off";
    } catch {
      /* no document (a harness): nothing to mark */
    }
  }

  /** Ask for a tick on a nudge's behalf, spending a token or waiting for one. */
  function nudge(): void {
    if (stopped || coalesceTimer !== null) return;
    const now = Date.now();
    nudgeTokens = Math.min(NUDGE_BURST, nudgeTokens + (now - tokensAt) / NUDGE_REFILL_MS);
    tokensAt = now;
    if (nudgeTokens >= 1) {
      nudgeTokens -= 1;
      void tick();
      return;
    }
    coalesceTimer = setTimeout(
      () => {
        coalesceTimer = null;
        nudgeTokens = 0;
        tokensAt = Date.now();
        void tick();
      },
      Math.ceil((1 - nudgeTokens) * NUDGE_REFILL_MS),
    );
  }

  function reschedule(): void {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void tick(), currentInterval());
  }

  async function tick(): Promise<void> {
    if (stopped) return;
    if (inFlight) {
      missedNudge = true;
      return;
    }
    inFlight = true;
    try {
      const headers = { ...(options.headers?.() ?? {}) };
      if (etag) headers["If-None-Match"] = etag;
      const res = await fetch(url, { headers });
      if (res.status === 304) {
        // unchanged — no new data, but the transport is demonstrably alive.
        options.onUnchanged?.();
      } else if (res.ok) {
        etag = res.headers.get("ETag");
        onData((await res.json()) as T);
      } else {
        // A TYPED error, not a parsed body.
        //
        // This handed `onError` the raw JSON body, while all three surfaces
        // wrote their recovery branches as `error instanceof ApiError && ...`.
        // Every one of those branches was therefore dead code: /play's was
        // found and worked around locally (matching on the code string), and
        // /board's "wrong or dead session code" and /teach's "this key no
        // longer controls this room" were never found at all — a projector on a
        // bad code sat on "reconnecting..." forever with no input to correct it,
        // and a teacher whose key stopped working kept polling behind controls
        // that did nothing. Fixing the contract here fixes all three at once
        // and stops the next surface inheriting the same trap.
        const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string; retryable?: boolean } };
        const err = body.error;
        options.onError?.(
          new ApiError(res.status, err?.code ?? "unknown", err?.message ?? res.statusText, err?.retryable === true),
        );
      }
    } catch (error) {
      // A genuine transport failure — no response at all. Deliberately NOT an
      // ApiError: "the network is down" and "the server ruled against you" are
      // different things and a caller must be able to tell them apart.
      options.onError?.(error);
    } finally {
      inFlight = false;
      if (missedNudge && !stopped) {
        missedNudge = false;
        nudge();
      } else {
        reschedule();
      }
    }
  }

  if (options.streamUrl && typeof EventSource !== "undefined") {
    markTransport(false);
    try {
      source = new EventSource(options.streamUrl);
      source.onopen = () => {
        pushing = true;
        markTransport(true);
        options.onPushState?.(true);
        reschedule(); // stretch the timer out; the stream is carrying the room now
      };
      source.onmessage = () => {
        // The nudge says nothing except "ask again", which is the point.
        nudge();
      };
      source.onerror = () => {
        // EventSource reconnects on its own; what matters here is that the
        // moment it is not carrying the room, the short poll interval is.
        if (pushing) {
          pushing = false;
          markTransport(false);
          options.onPushState?.(false);
        }
        reschedule();
      };
    } catch {
      source = null; // no stream: polling alone, exactly as before
    }
  }

  void tick();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (coalesceTimer) clearTimeout(coalesceTimer);
      coalesceTimer = null;
      source?.close();
      source = null;
      pushing = false;
    },
    get pushing() {
      return pushing;
    },
  };
}
