/**
 * localStorage helpers, defensive: a private window, cleared site data, or a
 * browser configured to block storage must not crash the page — it should
 * just fall back to "no saved seat, show the join form."
 */
export type PlayCredentials = {
  deviceToken: string;
  sessionCode: string;
  seatId: string;
  displayName: string;
  rejoinPin?: string;
};

const PLAY_KEY = "bow-play-credentials";
const TEACH_KEY = "bow-teach-session-code";
const TEACH_TEACHER_KEY = "bow-teach-session-key";

export function loadPlayCredentials(): PlayCredentials | null {
  try {
    const raw = localStorage.getItem(PLAY_KEY);
    return raw ? (JSON.parse(raw) as PlayCredentials) : null;
  } catch {
    return null;
  }
}

export function savePlayCredentials(c: PlayCredentials): void {
  try {
    localStorage.setItem(PLAY_KEY, JSON.stringify(c));
  } catch {
    /* best-effort */
  }
}

export function clearPlayCredentials(): void {
  try {
    localStorage.removeItem(PLAY_KEY);
  } catch {
    /* best-effort */
  }
}

export function loadTeachSessionCode(): string | null {
  try {
    return localStorage.getItem(TEACH_KEY);
  } catch {
    return null;
  }
}

export function saveTeachSessionCode(code: string): void {
  try {
    localStorage.setItem(TEACH_KEY, code);
  } catch {
    /* best-effort */
  }
}

/**
 * R1: the per-session teacher credential, issued once at createSession.
 * Stored separately from the join code (which is fine to keep around and
 * even to say out loud in class) since this is the actual secret that
 * gates /control and the teacher view — losing it (private window,
 * cleared storage) means the "remembered session" reload can't safely
 * reopen as teacher and should fall through to a fresh create-session
 * form instead of guessing.
 */
export function loadTeachSessionKey(): string | null {
  try {
    return localStorage.getItem(TEACH_TEACHER_KEY);
  } catch {
    return null;
  }
}

export function saveTeachSessionKey(key: string): void {
  try {
    localStorage.setItem(TEACH_TEACHER_KEY, key);
  } catch {
    /* best-effort */
  }
}

export function clearTeachSession(): void {
  try {
    localStorage.removeItem(TEACH_KEY);
    localStorage.removeItem(TEACH_TEACHER_KEY);
  } catch {
    /* best-effort */
  }
}
