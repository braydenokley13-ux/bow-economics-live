/**
 * Class-scale concurrency harness.
 *
 * Boots the real compiled server on a scratch snapshot file, seats N desks,
 * and fires their actions as simultaneously as the process can manage. Every
 * request's outcome is classified, then the server's own final state is read
 * back and compared against what the desks believe they submitted.
 *
 * The question it answers is the one the program's action-integrity contract
 * asks: did a valid action inside an open window get applied exactly once, or
 * get an authoritative semantic rejection? Anything else — a version conflict,
 * a silent drop — is a defect, and this prints it rather than summarising it
 * away.
 *
 *   node scripts/concurrency-harness.cjs [--desks 16] [--rounds 3] [--port 4399]
 */
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

const { assertPortFree } = require("./lib/port.cjs");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const DESKS = Number(arg("desks", 16));
const ROUNDS = Number(arg("rounds", 3));
const PORT = Number(arg("port", 4399));
const LESSON = arg("lesson", "m2l1-full-house");
const BASE = `http://127.0.0.1:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { status: res.status, body: json, raw: text };
}

async function waitForServer() {
  for (let i = 0; i < 200; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/lessons`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await sleep(50);
  }
  throw new Error("server did not come up");
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "bow-conc-"));
  const snapshot = path.join(dir, "snapshot.json");
  await assertPortFree(PORT, require("path").basename(__filename));
  const child = spawn(process.execPath, ["dist/server/index.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: snapshot },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const serverLog = [];
  child.stdout.on("data", (d) => serverLog.push(String(d)));
  child.stderr.on("data", (d) => serverLog.push(String(d)));

  const report = { desks: DESKS, rounds: ROUNDS, lesson: LESSON, findings: [], rounds_detail: [] };
  try {
    await waitForServer();

    const created = await req("POST", "/api/sessions", {
      body: { lessonModuleId: LESSON, title: "concurrency harness" },
    });
    if (created.status !== 201) throw new Error(`createSession failed: ${created.status} ${created.raw}`);
    const code = created.body.session.code;
    const teacherKey = created.body.teacherKey;

    // Seat every desk (sequential — join is not the thing under test).
    const seats = [];
    for (let i = 0; i < DESKS; i += 1) {
      const r = await req("POST", `/api/sessions/${code}/join`, { body: { displayName: `Desk ${i + 1}` } });
      if (r.status !== 201) throw new Error(`join ${i} failed: ${r.status} ${r.raw}`);
      seats.push({ index: i, token: r.body.deviceToken, seatId: r.body.seat.id });
    }

    // Drive to PLAY and let each desk claim a franchise.
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "advance" }, token: teacherKey }); // HOOK
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "advance" }, token: teacherKey }); // PLAY

    // takeSeat, fired all at once — the first real concurrent burst.
    const takeResults = await Promise.all(
      seats.map((s) => req("POST", `/api/sessions/${code}/actions`, { body: { type: "takeSeat" }, token: s.token })),
    );
    const takeConflicts = takeResults.filter((r) => r.body?.error?.code === "version_conflict").length;
    const takeRejected = takeResults.filter((r) => r.status !== 200);
    report.takeSeat = {
      ok: takeResults.filter((r) => r.status === 200).length,
      version_conflict: takeConflicts,
      other_failures: takeRejected
        .filter((r) => r.body?.error?.code !== "version_conflict")
        .map((r) => ({ status: r.status, code: r.body?.error?.code, message: r.body?.error?.message })),
    };
    if (takeConflicts > 0) {
      report.findings.push({
        severity: "correctness",
        what: `takeSeat burst: ${takeConflicts}/${DESKS} desks got 409 version_conflict`,
        why: "a desk that never gets a franchise cannot play; the client outbox drops 4xx, so this is a permanent loss",
      });
    }

    // The main event: every desk sets a price and locks, all at once, every round.
    for (let round = 1; round <= ROUNDS; round += 1) {
      // On the lesson's own grid ($10-$120 in $2 steps) — an off-grid price is a
      // harness bug that reads as 16 product rejections.
      const intents = seats.map((s) => ({ seat: s, price: 20 + ((s.index * 3) % 40) * 2 }));
      const results = await Promise.all(
        intents.map(async (it) => {
          const set = await req("POST", `/api/sessions/${code}/actions`, {
            body: { type: "setPrice", price: it.price },
            token: it.seat.token,
          });
          return { it, set };
        }),
      );
      const locks = await Promise.all(
        intents.map((it) =>
          req("POST", `/api/sessions/${code}/actions`, { body: { type: "lock" }, token: it.seat.token }).then((lock) => ({ it, lock })),
        ),
      );

      const classify = (rows, key) => {
        const out = { ok: 0, version_conflict: 0, semantic: [], transport: [] };
        for (const row of rows) {
          const r = row[key];
          if (r.status === 200) { out.ok += 1; continue; }
          const c = r.body?.error?.code;
          if (c === "version_conflict") out.version_conflict += 1;
          else if (r.status >= 400 && r.status < 500) out.semantic.push({ code: c, message: r.body?.error?.message });
          else out.transport.push({ status: r.status, raw: r.raw?.slice(0, 200) });
        }
        return out;
      };
      const setStats = classify(results, "set");
      const lockStats = classify(locks, "lock");

      // Ground truth: ask the server what it actually recorded.
      const teacher = await req("GET", `/api/sessions/${code}/teacher`, { token: teacherKey });
      const view = teacher.body?.view ?? {};
      const lockedCount =
        typeof view.lockedCount === "number"
          ? view.lockedCount
          : Array.isArray(view.desks)
            ? view.desks.filter((d) => d.locked).length
            : null;

      report.rounds_detail.push({ round, setPrice: setStats, lock: lockStats, serverLockedCount: lockedCount, teacherViewKeys: Object.keys(view) });

      if (setStats.version_conflict > 0 || lockStats.version_conflict > 0) {
        report.findings.push({
          severity: "correctness",
          what: `round ${round}: ${setStats.version_conflict} setPrice + ${lockStats.version_conflict} lock actions lost to 409 version_conflict`,
          why: "a transport race, not a semantic rejection — the client outbox treats 4xx as definitive and drops the action",
        });
      }

      // Advance the night so the next round has an open card.
      await req("POST", `/api/sessions/${code}/control`, { body: { type: "hook", hook: "closeNight" }, token: teacherKey });
    }

    /* ------------------------------------------------------------------ *
     * The loss scenarios.
     *
     * The version race the program brief hypothesised does not reproduce on
     * this storage (see the counts above — zero conflicts at 16 and at 32).
     * These three are the races that DO destroy decisions in a live class, and
     * each is run through a model of the real client outbox: a refusal marked
     * `retryable` is held and re-sent with backoff, anything else is dropped.
     * A scenario passes only when every desk's decision ends up applied exactly
     * once, or refused for a reason a student can be told.
     * ------------------------------------------------------------------ */

    /** The client outbox, modelled: hold and re-send a retryable refusal, drop a definitive one. */
    async function outboxSend(seat, body, attempts = 8) {
      const held = [];
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const r = await req("POST", `/api/sessions/${code}/actions`, { body, token: seat.token });
        if (r.status === 200) return { outcome: "applied", attempts: attempt + 1, held, disposition: r.body?.disposition };
        if (r.body?.error?.retryable === true) {
          held.push(r.body.error.code);
          await sleep(40 * (attempt + 1));
          continue;
        }
        return { outcome: "refused", code: r.body?.error?.code, message: r.body?.error?.message, attempts: attempt + 1, held };
      }
      return { outcome: "GAVE_UP", held, attempts };
    }

    const lockedNow = async () => {
      const t = await req("GET", `/api/sessions/${code}/teacher`, { token: teacherKey });
      const v = t.body?.view ?? {};
      return typeof v.lockedCount === "number" ? v.lockedCount : null;
    };

    // --- A. The teacher pauses at the exact moment the room locks in. -------
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "pause" }, token: teacherKey });
    // Deliberately NOT awaited yet: these requests must still be in the outbox,
    // being held and re-sent, when the room comes back.
    const pauseRace = seats.map((s) => outboxSend(s, { id: `pause-${s.index}`, type: "lock" }));
    // The room comes back a beat later, as it always does.
    await sleep(120);
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "unpause" }, token: teacherKey });
    const pauseSettled = await Promise.all(pauseRace);
    const pauseLost = pauseSettled.filter((r) => r.outcome !== "applied");
    report.pauseRace = {
      applied: pauseSettled.filter((r) => r.outcome === "applied").length,
      held_at_least_once: pauseSettled.filter((r) => r.held.length > 0).length,
      lost: pauseLost,
      serverLockedCount: await lockedNow(),
    };
    if (pauseLost.length > 0) {
      report.findings.push({
        severity: "correctness",
        what: `pause race: ${pauseLost.length}/${DESKS} desks lost a lock the teacher's pause collided with`,
        why: "the pause is the teacher holding the room, not a ruling on the student's decision",
      });
    }
    if (report.pauseRace.serverLockedCount !== null && report.pauseRace.serverLockedCount !== DESKS) {
      report.findings.push({
        severity: "correctness",
        what: `pause race: server recorded ${report.pauseRace.serverLockedCount} locks, expected ${DESKS}`,
        why: "the desks believe they locked in; the room disagrees",
      });
    }
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "hook", hook: "closeNight" }, token: teacherKey });

    // --- B. The same decision retried while it is still in flight. ---------
    // A flaky AP re-sends a request whose response never arrived. This must
    // buy exactly one ticket price, not two.
    const dupRace = await Promise.all(
      seats.flatMap((s) => {
        const body = { id: `dup-${s.index}`, type: "setPrice", price: 30 + ((s.index % 10) * 2) };
        return [outboxSend(s, body), outboxSend(s, body)];
      }),
    );
    const dupApplied = dupRace.filter((r) => r.outcome === "applied");
    const dupDuplicates = dupApplied.filter((r) => r.disposition === "duplicate").length;
    report.duplicateRace = {
      sent: dupRace.length,
      applied: dupApplied.length,
      reported_duplicate: dupDuplicates,
      refused: dupRace.filter((r) => r.outcome !== "applied"),
    };
    if (dupApplied.length !== dupRace.length) {
      report.findings.push({
        severity: "correctness",
        what: `duplicate race: ${dupRace.length - dupApplied.length} of ${dupRace.length} retries were refused instead of recognised`,
        why: "a re-sent action whose first response was lost must be recognised, not rejected",
      });
    }
    if (dupDuplicates < DESKS) {
      report.findings.push({
        severity: "correctness",
        what: `duplicate race: only ${dupDuplicates} of ${DESKS} retries were reported as duplicates`,
        why: "an unrecognised retry has been applied twice — the idempotency ring is not holding",
      });
    }

    // --- C. TIME CUT: locks in flight when the window closes. --------------
    // Stamped with the round the desk was looking at, exactly as the real
    // outbox does — which is what makes "crossed the cut" distinguishable from
    // "a fresh decision on the new round".
    const openRound = (await req("GET", `/api/sessions/${code}/teacher`, { token: teacherKey })).body?.round?.key ?? null;
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "finalCall", durationMs: 5000 }, token: teacherKey });
    const cutRace = Promise.all(
      seats.map((s) => outboxSend(s, { id: `cut-${s.index}`, type: "lock", round: openRound }, 3)),
    );
    // The teacher cuts the window while those are in the air. No sleep: the
    // close is dispatched into the same event-loop turn as the locks, which is
    // as close as this process can get to a real simultaneous cut.
    await sleep(0);
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "closeNow" }, token: teacherKey });
    const cut = await cutRace;
    const cutApplied = cut.filter((r) => r.outcome === "applied").length;
    const cutRefused = cut.filter((r) => r.outcome === "refused");
    const cutGaveUp = cut.filter((r) => r.outcome === "GAVE_UP");
    report.timeCutRace = {
      applied: cutApplied,
      refused_with_a_reason: cutRefused.length,
      refusal_codes: [...new Set(cutRefused.map((r) => r.code))],
      gave_up: cutGaveUp.length,
    };
    // The contract: applied exactly once, OR an explicit authoritative refusal.
    // Nothing may end in limbo, and no refusal may be reasonless.
    if (cutGaveUp.length > 0) {
      report.findings.push({
        severity: "correctness",
        what: `time cut: ${cutGaveUp.length} actions were still being retried when the harness gave up`,
        why: "an action crossing the cut must reach a terminal answer, not spin",
      });
    }
    for (const r of cutRefused) {
      if (!r.code || !r.message) {
        report.findings.push({
          severity: "correctness",
          what: `time cut: an action was refused with no reason (${JSON.stringify(r)})`,
          why: "a student whose decision is refused must be told why",
        });
      }
    }

    // And a lock arriving strictly AFTER the cut: the one case that SHOULD be
    // refused. It must be refused definitively and with a sentence, never held.
    const afterCut = await Promise.all(
      seats.slice(0, 4).map((s) => outboxSend(s, { id: `after-${s.index}`, type: "lock", round: openRound }, 2)),
    );
    report.afterCut = afterCut.map((r) => ({ outcome: r.outcome, code: r.code, message: r.message, held: r.held.length }));
    for (const r of afterCut) {
      if (r.outcome !== "refused" || r.code !== "stale_round" || !r.message) {
        report.findings.push({
          severity: "correctness",
          what: `after the cut: a decision for the closed round was ${r.outcome} (${JSON.stringify(r)})`,
          why: "applying it to the NEXT round substitutes a decision the pair never made, on a card they never saw",
        });
      }
    }

    report.serverLog = serverLog.join("").split("\n").filter((l) => l.includes("error") || l.includes("Error")).slice(0, 10);
  } finally {
    child.kill("SIGKILL");
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.findings.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("harness failed:", e);
  process.exit(2);
});
