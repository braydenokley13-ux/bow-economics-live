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
export type PollHandle = { stop: () => void };

export function startPolling<T>(
  url: string,
  intervalMs: number,
  onData: (data: T) => void,
  options: { headers?: () => Record<string, string>; onError?: (error: unknown) => void } = {},
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
        // unchanged — nothing to do
      } else if (res.ok) {
        etag = res.headers.get("ETag");
        onData((await res.json()) as T);
      } else {
        const body = await res.json().catch(() => ({}));
        options.onError?.(body);
      }
    } catch (error) {
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
