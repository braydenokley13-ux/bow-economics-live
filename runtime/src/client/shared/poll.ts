/**
 * Short-interval polling with ETag/If-None-Match. This is the one transport
 * used by all three surfaces — see runtime/README.md for why it was chosen
 * over SSE/WebSockets.
 *
 * The loop never dies: a network failure or a non-2xx response reports to
 * `onError` and simply schedules the next tick anyway. That is the whole of
 * this product's "auto-reconnect" story — there is no connection to
 * re-establish, only a fetch to try again, which is what makes it robust on
 * a flaky school AP.
 */
import { ApiError } from "./api.js";

export type PollHandle = { stop: () => void };

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
  } = {},
): PollHandle {
  let etag: string | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick(): Promise<void> {
    if (stopped) return;
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
      if (!stopped) timer = setTimeout(() => void tick(), intervalMs);
    }
  }

  void tick();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
