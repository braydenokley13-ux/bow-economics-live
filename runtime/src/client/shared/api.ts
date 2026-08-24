export type ApiErrorPayload = { error: { code: string; message: string } };

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.headers) Object.assign(headers, init.headers as Record<string, string>);
  const res = await fetch(url, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as ApiErrorPayload).error ?? { code: "unknown", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return body as T;
}
