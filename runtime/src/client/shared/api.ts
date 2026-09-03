export type ApiErrorPayload = { error: { code: string; message: string; retryable?: boolean } };

export class ApiError extends Error {
  status: number;
  code: string;
  /**
   * Whether the server says a later attempt could still succeed.
   *
   * Read off the wire, never guessed from the status code: one 409 means "the
   * price you sent is not a legal price" and another means "another write
   * landed first", and the outbox's choice between discarding a student's
   * decision and holding it hangs on telling them apart. A server that does not
   * send the field is assumed to mean final — the safe reading for an old
   * server talking to a new client is "do not retry forever".
   */
  retryable: boolean;
  constructor(status: number, code: string, message: string, retryable = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.headers) Object.assign(headers, init.headers as Record<string, string>);
  const res = await fetch(url, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as ApiErrorPayload).error ?? { code: "unknown", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.retryable === true);
  }
  return body as T;
}
