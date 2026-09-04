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
 * time-cut panel, the device-health strip — read off fields this module
 * either does not need to duplicate (`naming`) or does not own the wiring
 * for (press conference, time cut). This file does not re-render any of
 * those. What it owns: a per-desk reading of the room's books, in the plain
 * vocabulary of the lesson.
 *
 * RECONCILED against the real `l2.ts` `teacherView` (2026-09-04):
 * `perDesk[]` is `{ label, dealt, band, openJobs, wall, committed, pending,
 * report }` — `openJobs` is an array of roles (not a count), `wall` and
 * `committed` are raw numbers (not pre-rendered text), and there is no
 * top-level `chip`/`line`/`unresolved`/`director` field anywhere on this
 * view. `renderUnresolved`/`renderDirector` below read fields this module's
 * `teacherView` does not ship (no round-unresolved list, no NOW/WATCH FOR
 * director block) and so degrade to a no-op, by the same defensive design as
 * everything else here — kept in case a later module revision adds them.
 *
 * THE TYPED LINE IS TEACHER-ONLY (Integrator ruling on spec §14). The real
 * shape only carries it inside `perDesk[].pending.{chip,line}` — populated
 * once a February offer is staged, never during January (a ten-day resolves
 * instantly, with no pending record at all). This panel is the one place in
 * the whole product that is allowed to print it — never `/board`, never a
 * shared surface.
 */

type V = Record<string, unknown>;
const arr = (v: unknown): V[] => (Array.isArray(v) ? (v as V[]) : []);
const arrStr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const dollars = (v: unknown): string | null => (typeof v === "number" && Number.isFinite(v) ? `$${Math.round(v).toLocaleString("en-US")}` : null);

type TeacherSeatLike = { id: string; displayName: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function el(tag: string, className?: string): HTMLDivElement {
  const node = document.createElement("div");
  if (className) node.className = className;
  return node;
}

/** One row per desk — the standing teacher's whole scan, off the real `perDesk` shape. */
function renderDeskTable(wrap: HTMLElement, view: Record<string, unknown>): void {
  const rows = arr(view["perDesk"]);
  if (rows.length === 0) return;
  const table = document.createElement("table");
  table.className = "slt-desktable";
  table.innerHTML = `
    <thead><tr><th>Desk</th><th>Band</th><th>Open</th><th>Wall</th><th>Committed</th><th>Pending</th><th>Chip</th><th>Line</th></tr></thead>
    <tbody>${rows
      .map((r) => {
        const pending = r["pending"] && typeof r["pending"] === "object" ? (r["pending"] as V) : null;
        const openJobs = arrStr(r["openJobs"]).join(", ");
        const dealt = r["dealt"] === true ? " (dealt)" : "";
        return `
      <tr>
        <td>${escapeHtml(str(r["label"]))}${escapeHtml(dealt)}</td>
        <td>${escapeHtml(str(r["band"]))}</td>
        <td>${escapeHtml(openJobs || "—")}</td>
        <td>${escapeHtml(dollars(r["wall"]) ?? "—")}</td>
        <td>${escapeHtml(dollars(r["committed"]) ?? "—")}</td>
        <td>${pending ? "yes" : "—"}</td>
        <td>${escapeHtml(pending ? str(pending["chip"], "—") : "—")}</td>
        <td class="slt-desktable-line">${escapeHtml(pending ? str(pending["line"], "—") : "—")}</td>
      </tr>`;
      })
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
