/**
 * THE PRESS CONFERENCE — generic chrome, shared by /board and /play.
 *
 * The runtime hands every surface here nothing but a label and a module's own
 * `spotlightView`, typed `unknown` — this file has never seen the shape of a
 * lesson's payload and is not allowed to guess at it beyond "is this an
 * object, an array, or something to print as a line". A lesson that wants a
 * bespoke podium frame ships its own renderer and calls it instead of
 * `renderSpotlightValue`; this is only ever the fallback that keeps every
 * lesson usable the day this feature ships, not the ceiling on what a podium
 * can look like.
 *
 * Copy here is Cap Room register, never the runtime's own vocabulary: a
 * student reads "League paused — press conference", not a status code.
 */

function escapeHtmlPc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function describeScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** "lockedEarly" -> "locked Early" -> "locked early" is close enough for a fallback nobody designed a label sheet for. */
function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.length > 0 ? spaced[0]!.toLowerCase() + spaced.slice(1) : spaced;
}

/**
 * The one piece of real rendering logic in this file: turn an unknown
 * module view into something legible without knowing what lesson it came
 * from. An object becomes a key/value list, an array becomes a bullet list,
 * anything else becomes a single line. `null`/`undefined` — a module that
 * declared no `spotlightView`, or one that has nothing to say yet — reads as
 * a plain, honest "nothing to show yet", never a blank hole in the frame.
 */
export function renderSpotlightValue(view: unknown): string {
  if (view === null || view === undefined) {
    return `<p class="pc-empty">Nothing to show yet.</p>`;
  }
  if (Array.isArray(view)) {
    if (view.length === 0) return `<p class="pc-empty">Nothing to show yet.</p>`;
    return `<ul class="pc-list">${view.map((item) => `<li>${escapeHtmlPc(describeScalar(item))}</li>`).join("")}</ul>`;
  }
  if (typeof view === "object") {
    const entries = Object.entries(view as Record<string, unknown>);
    if (entries.length === 0) return `<p class="pc-empty">Nothing to show yet.</p>`;
    return `<dl class="pc-kv">${entries
      .map(([k, v]) => `<dt>${escapeHtmlPc(humanizeKey(k))}</dt><dd>${escapeHtmlPc(describeScalar(v))}</dd>`)
      .join("")}</dl>`;
  }
  return `<p class="pc-single">${escapeHtmlPc(describeScalar(view))}</p>`;
}

/**
 * The board's full-dark takeover. Called from `/board`'s `render()` BEFORE
 * any module branch — a press conference wins over every renderer, the same
 * way `ended`/`frozen`/`paused` already do, because it is a more specific
 * fact about the same state (a press conference always carries `paused` too).
 */
export function renderBoardSpotlight(spotlight: { label: string; view: unknown }): string {
  return `
    <div class="pc-board">
      <div class="pc-board-line">LEAGUE PAUSED &mdash; PRESS CONFERENCE</div>
      <div class="pc-board-label">${escapeHtmlPc(spotlight.label)}</div>
      <div class="pc-board-view">${renderSpotlightValue(spotlight.view)}</div>
    </div>`;
}

/** The lock screen every desk that is NOT at the podium sees on /play while a press conference runs. */
export function renderPlayLock(label: string): string {
  return `
    <div class="pc-lock">
      <div class="pc-lock-line">League paused &mdash; press conference</div>
      <div class="pc-lock-label">${escapeHtmlPc(label)}</div>
    </div>`;
}

/** The podium desk's own /play screen: the identical public view the board and every lock screen are showing, on their own device. */
export function renderPlayPodium(label: string, view: unknown): string {
  return `
    <div class="pc-podium">
      <div class="pc-podium-line">YOU&rsquo;RE AT THE PODIUM &mdash; ${escapeHtmlPc(label)}</div>
      <div class="pc-podium-view">${renderSpotlightValue(view)}</div>
    </div>`;
}
