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
 *
 * W2 repair — the one that was losing real student decisions. This queue used
 * to drop EVERY 4xx, which reads sensible until you notice which 4xx a live
 * class actually produces: a pair locks their price at the exact moment the
 * teacher hits Pause (423), or a beat after the teacher advances the phase
 * (409). Neither is the student's mistake and neither is a decision the server
 * refuses on the merits — the first is "not right now", the second is a race
 * with the room. Both destroyed the choice silently.
 *
 * So the server now says on the wire whether a refusal is transient
 * (`error.retryable`), and this queue holds those actions and retries them
 * with backoff instead of shredding them. That is only safe because every
 * action carries a client-minted `id` the server remembers per seat: a retry
 * of something that already landed comes back as a duplicate, not a second
 * ticket sale. Holding does not spin forever either — a held action drains as
 * soon as the room moves, and if the round closes underneath it the server
 * returns a definitive answer and it is dropped with a reason.
 */
import { ApiError, apiFetch } from "./api.js";
import { randomId } from "./id.js";

export type QueuedAction = { id: string; type: string; [key: string]: unknown };

export type OutboxEvents = {
  onSent?: (action: QueuedAction, response: unknown) => void;
  onRejected?: (action: QueuedAction, error: ApiError) => void;
  onRetired?: () => void;
  onPending?: (count: number) => void;
  /** The head of the queue was refused for a transient reason and is being held, not lost. */
  onHolding?: (action: QueuedAction, error: ApiError, attempt: number) => void;
};

/** Backoff for a held action. Short enough that a pause lifting feels instant, long enough not to hammer a frozen room. */
const HOLD_BACKOFF_MS = [250, 500, 1000, 2000, 3000, 5000] as const;

export class ActionOutbox {
  private queue: QueuedAction[] = [];
  private sending = false;
  private holdAttempts = 0;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly storageKey: string;

  constructor(
    private readonly actionsUrl: () => string,
    private readonly tokenGetter: () => string | null,
    private readonly events: OutboxEvents = {},
    storageScope = "default",
    /**
     * The round this desk is deciding on, read at SUBMIT time — never at send
     * time. Stamping it when the action is queued is the whole point: it
     * records which night/week the pair was actually looking at, so an action
     * that sits in the queue across a close is refused rather than silently
     * applied to a round whose card they have never seen.
     */
    private readonly roundKeyGetter: () => string | null = () => null,
    /** Actions that are not decisions about a round (joining the lesson) and must survive a close. */
    private readonly roundExemptTypes: ReadonlySet<string> = new Set<string>(),
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
    const round = this.roundExemptTypes.has(action.type) ? null : this.roundKeyGetter();
    const entry: QueuedAction = { id: randomId(), ...(round ? { round } : {}), ...action };
    this.queue.push(entry);
    this.writeDurable();
    void this.pump();
  }

  /** Call on reconnect: the `online` event, or after a poll succeeds following failures. */
  retryNow(): void {
    this.clearHoldTimer();
    void this.pump();
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  /** True while the head action has been refused transiently and is waiting to go again. */
  get holding(): boolean {
    return this.holdTimer !== null;
  }

  /** Stop the retry clock. Call when the seat goes away, so a dead outbox does not keep firing. */
  stop(): void {
    this.clearHoldTimer();
  }

  private clearHoldTimer(): void {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private scheduleRetry(): void {
    if (this.holdTimer !== null) return;
    const wait = HOLD_BACKOFF_MS[Math.min(this.holdAttempts, HOLD_BACKOFF_MS.length - 1)]!;
    this.holdTimer = setTimeout(() => {
      this.holdTimer = null;
      void this.pump();
    }, wait);
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
          this.holdAttempts = 0;
          this.writeDurable();
          this.events.onSent?.(next, response);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            this.events.onRetired?.();
            return; // retrying with a retired token is noise, not resilience
          }
          if (error instanceof ApiError && error.retryable) {
            // Paused, frozen, or a write race. The room will move; the decision keeps.
            this.holdAttempts += 1;
            this.events.onHolding?.(next, error, this.holdAttempts);
            this.scheduleRetry();
            return;
          }
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            this.queue.shift();
            this.holdAttempts = 0;
            this.writeDurable();
            this.events.onRejected?.(next, error);
            continue;
          }
          this.scheduleRetry(); // network failure / 5xx: stays queued and keeps trying
          return;
        }
      }
    } finally {
      this.sending = false;
    }
  }
}
