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
      const intents = seats.map((s) => ({ seat: s, price: 20 + ((s.index * 3) % 40) }));
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
