/**
 * THE WINDOW (`m1l1-the-window`) — the teacher console's aggregate panel.
 *
 * Before this file existed, `renderAggregate` in `teach/main.ts` had no branch
 * for this module's id, so the whole `teacherView` payload — five levels of
 * nested objects, none of it meant for a human mid-class — landed on the
 * console as a raw JSON dump (CLAUDE.md §4: a random teacher reading that
 * dump learns nothing a live class needs in the next ten seconds).
 *
 * SCOPE. `teacherView` (l1.ts ~1740) already ships the desk-by-desk walk-to
 * strip, the class-intelligence items and the SYNTHESIS naming director card
 * as their own payload keys, and `teach/main.ts` already renders all three as
 * generic, module-agnostic panels (`renderDesks`, `renderIntel`, `renderNaming`).
 * This file does not touch or re-render any of them. What it owns is the one
 * thing nothing else on the console says: WHERE THE ROOM IS RIGHT NOW, in the
 * plain vocabulary of this lesson's four stages, and the two or three numbers
 * that belong to that stage and no other.
 *
 * WHAT DECIDES THE STAGE. `teacherView` does not carry a `phase` field (only
 * `boardView` does), and the one edit this builder is permitted to make in
 * `teach/main.ts` is the single dispatch line that hands this function `view`
 * and `seats` — nothing more. So the stage shown here is INFERRED from fields
 * `teacherView` already carries:
 *   - `windowClosed` false  -> before the bell has ever rung (LOBBY/HOOK) or a
 *     signing day is live (PLAY). Distinguished by the desk strip's own
 *     per-desk `state`, which the module already computes as "deciding"/"in"
 *     only while `phase === "PLAY"` (see `teacherView`'s `deskStrip.entries`)
 *     and as "closed" at every other phase. A room with zero claimed desks
 *     yet reads as LOBBY/HOOK, which is also the correct message for it.
 *   - `windowClosed` true and `naming` non-null -> SYNTHESIS. `naming` is only
 *     populated by the module `phase === "SYNTHESIS"` (l1.ts `teacherView`),
 *     never for the COMPLETE phase that can follow it — a module-level gap
 *     this builder cannot repair (owned by `src/modules/**`, out of scope for
 *     this task). A session that has moved on to COMPLETE therefore falls
 *     back to the REVEAL/CONSEQUENCE bucket below. Cosmetic only: the naming
 *     director card (`renderNaming`) keeps working off its own signal either
 *     way, and this panel's job at that stage is "say nothing new."
 *   - `windowClosed` true and `naming` null -> REVEAL or CONSEQUENCE.
 *
 * WHAT IS DELIBERATELY NOT HERE. The taken-players list: `teacherView` carries
 * no signed/taken roster at all (only `boardView`'s `signed` array does, and
 * that surface is structurally never handed a seat identity by design — see
 * l1.ts `boardView`). The projector already prints every signing the instant
 * it settles, so this panel does not reconstruct that list from a payload
 * that was never given it, and does not compute one client-side either.
 *
 * NO DOLLAR FIGURE IS EVER COMPUTED HERE. Every amount this file prints (the
 * projector case's committed payroll) is a number `teacherView` already
 * carries; this file only formats it for reading, the same way every other
 * aggregate renderer in `teach/main.ts` does (`$${x.toLocaleString()}`). The
 * five-line ladder itself (floor/cap/tax/apron1/apron2, with amounts) is NOT
 * in `teacherView` at all — only `boardView` carries it, pre-rendered as
 * `amountText`. What `teacherView` does carry that touches the lines is
 * `PROJECTOR_CASES` (the Denver case, printed with its real committed payroll
 * and what a club past the second apron may still do) and `SIMPLIFICATIONS`
 * (text, no amounts). This panel shows the projector case when one exists and
 * otherwise shows nothing for that slot — it does not invent a ladder.
 */

type TeacherSeatLike = { id: string; displayName: string };

type DeskStripLike = { countLine?: unknown; entries?: readonly { state?: unknown }[] } | null;

type RevealBeatLike = { id?: unknown; title?: unknown };

type ProjectorCaseLike = {
  id?: unknown;
  name?: unknown;
  committed?: { value?: unknown } | unknown;
  line?: unknown;
  what?: unknown;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Presentation only — every number handed in here already came out of the payload. */
function money(n: number): string {
  return `$${Math.round(Math.abs(n)).toLocaleString()}`;
}

const numberOf = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const stringOf = (v: unknown): string => (typeof v === "string" ? v : "");

type Bucket = "before" | "play" | "reveal" | "synthesis";

function bucketOf(view: Record<string, unknown>): Bucket {
  const windowClosed = Boolean(view["windowClosed"]);
  if (windowClosed) {
    return view["naming"] ? "synthesis" : "reveal";
  }
  const strip = (view["deskStrip"] as DeskStripLike) ?? null;
  const entries = Array.isArray(strip?.entries) ? strip.entries : [];
  const inPlay = entries.some((e) => e.state === "in" || e.state === "deciding");
  return inPlay ? "play" : "before";
}

function el(tag: string, className?: string): HTMLDivElement {
  const node = document.createElement("div");
  if (className) node.className = className;
  return node;
}

function renderBefore(wrap: HTMLElement, view: Record<string, unknown>, seats: readonly TeacherSeatLike[]): void {
  const claimed = numberOf(view["claimedCount"]);
  const openFranchises = numberOf(view["openFranchises"]);
  const kpis = el("div", "kpirow slt-kpirow");
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${claimed}/${seats.length}</div><div class="lbl">Students with a club</div></div>
    <div class="kpi"><div class="num">${openFranchises}</div><div class="lbl">Front offices open</div></div>`;
  wrap.appendChild(kpis);

  const note = document.createElement("p");
  note.className = "slt-instruction";
  note.textContent = "Every student picks a club on their screen. Nobody is dealt one unless they ask.";
  wrap.appendChild(note);
}

function renderPlay(wrap: HTMLElement, view: Record<string, unknown>): void {
  const day = numberOf(view["day"]);
  const ofDays = numberOf(view["ofDays"]);
  const pending = numberOf(view["pendingCount"]);
  const claimed = numberOf(view["claimedCount"]);
  const kpis = el("div", "kpirow slt-kpirow");
  kpis.innerHTML = `
    <div class="kpi"><div class="num">${day}/${ofDays}</div><div class="lbl">Signing day</div></div>
    <div class="kpi"><div class="num">${pending}/${claimed}</div><div class="lbl">Offers in</div></div>`;
  wrap.appendChild(kpis);

  /*
   * TAKEN-PLAYERS LIST: intentionally not rendered. `teacherView` carries no
   * signed/taken roster — only `boardView`'s `signed` array does, and that
   * surface is structurally never handed a seat identity (l1.ts boardView).
   * The projector already prints every signing the moment it settles; this
   * panel does not reconstruct that list from a payload that does not carry
   * it.
   */

  const payrollDefinition = stringOf(view["payrollDefinition"]);
  const casesRaw = Array.isArray(view["projectorCases"]) ? (view["projectorCases"] as readonly ProjectorCaseLike[]) : [];
  if (payrollDefinition || casesRaw.length > 0) {
    const row = el("div", "slt-lines");
    const eyebrow = `<div class="eyebrow slt-eyebrow">If a desk asks what a number means</div>`;
    const def = payrollDefinition ? `<p class="slt-note">${escapeHtml(payrollDefinition)}</p>` : "";
    const cases = casesRaw
      .map((c) => {
        const name = stringOf(c.name);
        const line = stringOf(c.line);
        const what = stringOf(c.what);
        const committed = c.committed && typeof c.committed === "object" ? numberOf((c.committed as { value?: unknown }).value) : 0;
        if (!name) return "";
        return `<div class="slt-case"><strong>${escapeHtml(name)}</strong> — ${escapeHtml(line)}: ${escapeHtml(what)}${
          committed > 0 ? ` <span class="slt-case-amt">${money(committed)} committed</span>` : ""
        }</div>`;
      })
      .join("");
    row.innerHTML = `${eyebrow}${def}${cases}`;
    wrap.appendChild(row);
  }
}

function renderReveal(wrap: HTMLElement, view: Record<string, unknown>): void {
  const beat = numberOf(view["beat"]);
  const beatsRaw = Array.isArray(view["beats"]) ? (view["beats"] as readonly RevealBeatLike[]) : [];
  const total = beatsRaw.length;
  const kpis = el("div", "kpirow slt-kpirow");
  kpis.innerHTML = `<div class="kpi"><div class="num">${Math.min(beat + 1, Math.max(total, 1))}/${total}</div><div class="lbl">On the wall</div></div>`;
  wrap.appendChild(kpis);

  if (total > 0) {
    const list = el("div", "slt-beats");
    list.innerHTML = beatsRaw
      .map((b, i) => `<span class="slt-beat${i === beat ? " slt-beat-current" : ""}">${escapeHtml(stringOf(b.title))}</span>`)
      .join("");
    wrap.appendChild(list);
  }
}

function renderSynthesis(wrap: HTMLElement): void {
  const note = document.createElement("p");
  note.className = "slt-instruction";
  note.textContent = "The director card above has the words for this stage.";
  wrap.appendChild(note);
}

export function renderSameLineL1Aggregate(view: Record<string, unknown>, seats: readonly TeacherSeatLike[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "slt-wrap";
  const bucket = bucketOf(view);
  if (bucket === "before") renderBefore(wrap, view, seats);
  else if (bucket === "play") renderPlay(wrap, view);
  else if (bucket === "reveal") renderReveal(wrap, view);
  else renderSynthesis(wrap);
  return wrap;
}
