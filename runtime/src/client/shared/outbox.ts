/**
 * A durable action outbox — adapted in *concept*, not ported, from
 * bow-finlit's `app/src/net/save-coordinator.ts`.
 *
 * The donor solves a different problem: reconciling repeated saves of one
 * continuous state blob, where a queued write can go stale mid-flight and
 * has to be *rebased* onto a newer server version rather than replayed.
 * Track 101 student actions are discrete, one-shot commands (tap a color,
 * submit a decision) — there is no "newer local edit" to rebase a stale one
 * onto, so the donor's revision/rebase machinery has nothing to attach to
 * here. What does carry over is the shape of the underlying problem and its
 * guardrails, reimplemented much smaller:
 *   - durable-first: an action is written to localStorage before it is
 *     sent, so a crashed tab or a dead network cannot lose it;
 *   - exactly one request in flight, in submission order;
 *   - a definitive rejection (wrong phase, bad payload, retired token) is
 *     dropped rather than retried forever — replaying an action the server
 *     has already authoritatively refused would only spin;
 *   - a network failure or 5xx leaves the action queued and stops, to be
 *     retried on the next `retryNow()` (called from the poll loop's
 *     success path and from the browser's `online` event).
 */
import { ApiError, apiFetch } from "./api.js";
import { randomId } from "./id.js";

export type QueuedAction = { id: string; type: string; [key: string]: unknown };

export type OutboxEvents = {
  onSent?: (action: QueuedAction, response: unknown) => void;
  onRejected?: (action: QueuedAction, error: ApiError) => void;
  onRetired?: () => void;
  onPending?: (count: number) => void;
};

export class ActionOutbox {
  private queue: QueuedAction[] = [];
  private sending = false;
  private readonly storageKey: string;

  constructor(
    private readonly actionsUrl: () => string,
    private readonly tokenGetter: () => string | null,
    private readonly events: OutboxEvents = {},
    storageScope = "default",
  ) {
    this.storageKey = `bow-play-outbox:${storageScope}`;
    this.queue = this.readDurable();
    if (this.queue.length > 0) void this.pump();
  }

  private readDurable(): QueuedAction[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
    } catch {
      return [];
    }
  }

  private writeDurable(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch {
      /* best-effort */
    }
    this.events.onPending?.(this.queue.length);
  }

  submit(action: { type: string; [key: string]: unknown }): void {
    const entry: QueuedAction = { id: randomId(), ...action };
    this.queue.push(entry);
    this.writeDurable();
    void this.pump();
  }

  /** Call on reconnect: the `online` event, or after a poll succeeds following failures. */
  retryNow(): void {
    void this.pump();
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  private async pump(): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      while (this.queue.length > 0) {
        const next = this.queue[0]!;
        const token = this.tokenGetter();
        if (!token) return; // no seat to send against yet
        try {
          const response = await apiFetch(this.actionsUrl(), {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(next),
          });
          this.queue.shift();
          this.writeDurable();
          this.events.onSent?.(next, response);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            this.events.onRetired?.();
            return; // retrying with a retired token is noise, not resilience
          }
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            this.queue.shift();
            this.writeDurable();
            this.events.onRejected?.(next, error);
            continue;
          }
          return; // network failure / 5xx: stays queued, try again later
        }
      }
    } finally {
      this.sending = false;
    }
  }
}
