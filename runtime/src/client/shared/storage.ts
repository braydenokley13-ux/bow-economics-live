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
