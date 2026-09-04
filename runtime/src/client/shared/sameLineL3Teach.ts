/**
 * THE DEADLINE (`m1l3-the-deadline`) — the teacher console's aggregate panel.
 *
 * Modelled on `sameLineL2Teach.ts` and, before it, `sameLineL1Teach.ts`:
 * `teach/main.ts` has no branch for this module's id, so without this file
 * the whole `teacherView` payload would land on the console as a raw JSON
 * dump (CLAUDE.md §4). This file owns the one slot `renderAggregate()`
 * gives a module — nothing else in `teach/main.ts` is touched.
 *
 * Built against the REAL `teacherView` in `l3.ts` — `hour`, `marketClosed`,
 * `desks[].{seatId,label,committedText,liveOut,liveIn,executed,walkTo,
 * seedWarning}`, `directorCard` (a single string, not the NOW/WATCH FOR/ASK
 * structured object `sameLineL2Teach.ts` guessed at), `pressCandidates[].
 * {seatId,label,why}`, `warnings`, `settled`. Every field read defensively,
 * so a reshape degrades to an empty panel rather than a crash.
 *
 * The generic panels `teach/main.ts` already ships — the press conference
 * picker, the time-cut / unresolved panel, the device-health strip — read
 * off fields this module does not own the wiring for. This file does not
 * re-render any of those; `pressCandidates` here is a plain read-only list
 * for the teacher's own scan, not the picker control itself.
 */

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

type TeacherSeatLike = { id: string; displayName: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function el(tag: string, className?: string): HTMLDivElement {
  const node = document.createElement("div");
  if (className) node.className = className;
  return node;
}

function renderDirector(wrap: HTMLElement, view: Record<string, unknown>): void {
  const card = str((view as V)["directorCard"]);
  if (!card) return;
  const block = el("div", "dir-block now");
  block.innerHTML = `<div class="dir-eyebrow">Now</div><p class="slt-note">${escapeHtml(card)}</p>`;
  wrap.appendChild(block);
}

function renderWarnings(wrap: HTMLElement, view: Record<string, unknown>): void {
  const warnings = strArr((view as V)["warnings"]);
  if (!warnings.length) return;
  const note = document.createElement("p");
  note.className = "slt-instruction";
  note.textContent = warnings.join(" · ");
  wrap.appendChild(note);
}

/** One row per desk — the standing teacher's whole scan of the market. */
function renderDeskTable(wrap: HTMLElement, view: Record<string, unknown>): void {
  const rows = arr((view as V)["desks"]);
  if (rows.length === 0) return;
  const table = document.createElement("table");
  table.className = "slt-desktable";
  table.innerHTML = `
    <thead><tr><th>Desk</th><th>Committed</th><th>Sent, live</th><th>Received, live</th><th>Executed</th><th>Walk to</th></tr></thead>
    <tbody>${rows
      .map((r) => {
        const walk = strArr(r["walkTo"]);
        return `
      <tr>
        <td>${escapeHtml(str(r["label"]))}</td>
        <td>${escapeHtml(str(r["committedText"], "—"))}</td>
        <td>${num(r["liveOut"])}</td>
        <td>${num(r["liveIn"])}</td>
        <td>${num(r["executed"])}</td>
        <td class="slt-desktable-line">${walk.length ? walk.map((w) => escapeHtml(w)).join(", ") : "—"}${
          r["seedWarning"] ? ` · ${escapeHtml(str(r["seedWarning"]))}` : ""
        }</td>
      </tr>`;
      })
      .join("")}</tbody>`;
  wrap.appendChild(table);
}

function renderPressCandidates(wrap: HTMLElement, view: Record<string, unknown>): void {
  const rows = arr((view as V)["pressCandidates"]);
  if (!rows.length) return;
  const block = el("div", "dir-block");
  block.innerHTML = `<div class="dir-eyebrow">Press conference candidates</div>
    <ol class="dir-list">${rows
      .slice(0, 5)
      .map((r) => `<li>${escapeHtml(str(r["label"]))} — ${escapeHtml(str(r["why"]))}</li>`)
      .join("")}</ol>`;
  wrap.appendChild(block);
}

function renderSettle(wrap: HTMLElement, view: Record<string, unknown>): void {
  const settle = (view as V)["settled"];
  if (!Array.isArray(settle) || settle.length === 0) return;
  const table = document.createElement("table");
  table.className = "slt-desktable";
  table.innerHTML = `
    <thead><tr><th>Desk</th><th>Jobs covered</th><th>Jobs still open</th></tr></thead>
    <tbody>${(settle as V[])
      .map((s) => `<tr><td>${escapeHtml(str(s["label"]))}</td><td>${num(s["coveredJobs"])}</td><td>${num(s["openJobs"])}</td></tr>`)
      .join("")}</tbody>`;
  wrap.appendChild(table);
}

export function renderSameLineL3Aggregate(view: Record<string, unknown>, seats: readonly TeacherSeatLike[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "slt-wrap";
  void seats;
  const v = view as V;
  const clockNote = document.createElement("p");
  clockNote.className = "slt-instruction";
  clockNote.textContent = v["marketClosed"] === true ? "DEADLINE PASSED" : `Hour ${num(v["hour"], 1)} of 2`;
  wrap.appendChild(clockNote);
  renderDirector(wrap, view);
  renderWarnings(wrap, view);
  renderDeskTable(wrap, view);
  renderSettle(wrap, view);
  renderPressCandidates(wrap, view);
  if (wrap.children.length === 0) {
    const note = document.createElement("p");
    note.className = "slt-instruction";
    note.textContent = "Nothing to show for this stage yet.";
    wrap.appendChild(note);
  }
  return wrap;
}
