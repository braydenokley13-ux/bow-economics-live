/**
 * THE SEASON (`m1l2-the-season`) — the teacher console's aggregate panel.
 *
 * Modelled on `sameLineL1Teach.ts`: `teach/main.ts` has no branch for this
 * module's id, so without this file the whole `teacherView` payload would
 * land on the console as a raw JSON dump (CLAUDE.md §4). This file owns the
 * one slot `renderAggregate()` gives a module — nothing else in `teach/main.ts`
 * is touched.
 *
 * SCOPE. The generic panels `teach/main.ts` already ships — the press
 * conference picker (`payload.pressCandidates`, `payload.spotlight`; spec §6
 * calls these `podiumCandidates`/`podiumFrame`, the Contract note in the spec
 * maps them onto the runtime's own `pressCandidates`/`spotlightView`), the
 * time-cut panel, the naming director card, the device-health strip — read
 * off fields this module either does not need to duplicate (`naming`) or
 * does not own the wiring for (press conference, time cut). This file does
 * not re-render any of those. What it owns: a per-desk reading of the
 * room's books, in the plain vocabulary of the lesson, built from the
 * spec §7 `teacherView` shape (`perDesk`, `unresolved`, `director`) — every
 * field read defensively, so a module that ships different names degrades to
 * an empty panel rather than a crash. Conform this file once
 * `runtime/src/modules/sameLine/l2.ts` exists; see the builder's report for
 * the diff, not this comment.
 *
 * THE TYPED LINE IS TEACHER-ONLY (Integrator ruling on spec §14). This panel
 * is the one place in the whole product that is allowed to print it — never
 * `/board`, never a shared surface. `perDesk[].line` is rendered here and
 * nowhere else in this builder's three files.
 */

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

type TeacherSeatLike = { id: string; displayName: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function el(tag: string, className?: string): HTMLDivElement {
  const node = document.createElement("div");
  if (className) node.className = className;
  return node;
}

/** One row per desk — the standing teacher's whole scan, per spec §7 `perDesk`. */
function renderDeskTable(wrap: HTMLElement, view: Record<string, unknown>): void {
  const rows = arr(view["perDesk"]);
  if (rows.length === 0) return;
  const table = document.createElement("table");
  table.className = "slt-desktable";
  table.innerHTML = `
    <thead><tr><th>Desk</th><th>Band</th><th>Open</th><th>Wall</th><th>Committed</th><th>Pending</th><th>Chip</th><th>Line</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `
      <tr>
        <td>${escapeHtml(str(r["label"]))}</td>
        <td>${escapeHtml(str(r["band"]))}</td>
        <td>${num(r["openJobs"])}</td>
        <td>${escapeHtml(str(r["wall"], "—"))}</td>
        <td>${escapeHtml(str(r["committed"], "—"))}</td>
        <td>${r["pending"] ? "yes" : "—"}</td>
        <td>${escapeHtml(str(r["chip"], "—"))}</td>
        <td class="slt-desktable-line">${escapeHtml(str(r["line"], "—"))}</td>
      </tr>`,
      )
      .join("")}</tbody>`;
  wrap.appendChild(table);
}

/** Desks the room is still waiting on. Named the same way the time-cut panel names them elsewhere on this console. */
function renderUnresolved(wrap: HTMLElement, view: Record<string, unknown>): void {
  const rows = arr(view["unresolved"]);
  if (rows.length === 0) return;
  const note = document.createElement("p");
  note.className = "slt-instruction";
  note.textContent = `${rows.length} desk${rows.length === 1 ? "" : "s"} still deciding: ${rows
    .map((r) => str(r["label"], str(r["seatId"])))
    .join(", ")}`;
  wrap.appendChild(note);
}

/** The lesson's own NOW/WATCH FOR/ASK/DON'T EXPLAIN YET/TRIGGER, if the module ships one (spec §11), read generically. */
function renderDirector(wrap: HTMLElement, view: Record<string, unknown>): void {
  const d = view["director"];
  if (!d || typeof d !== "object") return;
  const director = d as V;
  const block = el("div", "dir-block now");
  const now = arr(director["now"]);
  const ask = str(director["ask"]);
  const dontExplainYet = str(director["dontExplainYet"]);
  const trigger = str(director["trigger"]);
  block.innerHTML = `
    <div class="dir-eyebrow">Now</div>
    ${now.length ? `<ul class="dir-list">${now.map((n) => `<li>${escapeHtml(String(n))}</li>`).join("")}</ul>` : ""}
    ${ask ? `<p class="slt-note"><b>Ask:</b> ${escapeHtml(ask)}</p>` : ""}
    ${dontExplainYet ? `<p class="slt-note"><b>Don't explain yet:</b> ${escapeHtml(dontExplainYet)}</p>` : ""}
    ${trigger ? `<p class="slt-note"><b>Trigger:</b> ${escapeHtml(trigger)}</p>` : ""}`;
  wrap.appendChild(block);
}

export function renderSameLineL2Aggregate(view: Record<string, unknown>, seats: readonly TeacherSeatLike[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "slt-wrap";
  void seats;
  renderDirector(wrap, view);
  renderUnresolved(wrap, view);
  renderDeskTable(wrap, view);
  if (wrap.children.length === 0) {
    const note = document.createElement("p");
    note.className = "slt-instruction";
    note.textContent = "Nothing to show for this stage yet.";
    wrap.appendChild(note);
  }
  return wrap;
}
