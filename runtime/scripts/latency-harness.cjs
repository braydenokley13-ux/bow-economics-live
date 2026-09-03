/**
 * Class-scale latency, measured rather than asserted.
 *
 * The founder's instruction was explicitly not to invent a threshold first, so
 * this measures the three delays a room actually feels, at 1 / 16 / 32 desks,
 * and prints percentiles. The number that matters is not the median — it is
 * the desk in the back row on the slowest tick.
 *
 *   teacher action -> projector update     (the reveal the room watches)
 *   teacher action -> student update       (the phase change every desk waits on)
 *   student lock   -> teacher desk state   (what the teacher is looking at when
 *                                           they decide whether to close)
 *
 * Each is measured end to end from the client's point of view: the clock starts
 * when the teacher's control request RETURNS (the change is now true on the
 * server) and stops when a surface's own transport has fetched a payload that
 * contains it. That is the delay a human sees, not a server-internal one.
 *
 *   node scripts/latency-harness.cjs [--desks 16] [--samples 12] [--no-stream]
 */
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const DESKS = Number(arg("desks", 16));
const SAMPLES = Number(arg("samples", 12));
const PORT = Number(arg("port", 4407));
const USE_STREAM = !process.argv.includes("--no-stream");
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, { body, token, headers = {} } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { status: res.status, body: json, etag: res.headers.get("ETag") };
}

const pct = (xs, p) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};
const summary = (xs) => ({ n: xs.length, p50: pct(xs, 50), p90: pct(xs, 90), p99: pct(xs, 99), max: xs.length ? Math.round(Math.max(...xs)) : null });

/**
 * A surface, modelled exactly as the browser runs it: an ETagged poll loop,
 * optionally woken early by the SSE nudge stream. `waitFor` resolves the moment
 * a fetched payload satisfies a predicate, which is when a human would see it.
 */
function surface({ url, intervalMs, token, streamUrl, reconcileMs }) {
  const self = { latest: null, stop: null, pushing: false };
  let etag = null;
  let stopped = false;
  let timer = null;
  let inFlight = false;
  let missedNudge = false;
  let waiter = null;

  const deliver = (payload) => {
    self.latest = payload;
    if (waiter && waiter.test(payload)) {
      waiter.resolve(Date.now());
      waiter = null;
    }
  };
  const interval = () => (self.pushing ? (reconcileMs ?? intervalMs * 5) : intervalMs);
  const schedule = () => {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void tick(), interval());
  };
  async function tick() {
    if (stopped) return;
    if (inFlight) { missedNudge = true; return; }
    inFlight = true;
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (etag) headers["If-None-Match"] = etag;
      const res = await fetch(`${BASE}${url}`, { headers });
      if (res.status === 200) {
        etag = res.headers.get("ETag");
        deliver(await res.json());
      } else {
        await res.text();
      }
    } catch { /* keep going, same as the real loop */ } finally {
      inFlight = false;
      if (missedNudge && !stopped) { missedNudge = false; void tick(); } else { schedule(); }
    }
  }

  // A minimal SSE reader. The browser has EventSource; this Node build does
  // not expose it as a global, and silently falling back to poll-only would
  // have measured the wrong transport and reported it as the right one.
  let abort = null;
  if (streamUrl) {
    abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${BASE}${streamUrl}`, { signal: abort.signal, headers: { Accept: "text/event-stream" } });
        if (!res.ok || !res.body) return;
        self.pushing = true;
        schedule();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let cut;
          while ((cut = buf.indexOf("\n\n")) >= 0) {
            const frame = buf.slice(0, cut);
            buf = buf.slice(cut + 2);
            if (frame.split("\n").some((l) => l.startsWith("data:"))) void tick();
          }
        }
      } catch { /* aborted or dropped */ } finally {
        self.pushing = false;
        schedule();
      }
    })();
  }

  void tick();
  self.stop = () => { stopped = true; if (timer) clearTimeout(timer); abort?.abort(); };
  self.waitFor = (test, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      if (self.latest && test(self.latest)) return resolve(Date.now());
      waiter = { test, resolve };
      setTimeout(() => {
        if (waiter) { waiter = null; reject(new Error("timed out waiting for a surface to catch up")); }
      }, timeoutMs);
    });
  return self;
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "bow-lat-"));
  const child = spawn(process.execPath, ["dist/server/index.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: String(PORT), RUNTIME_SNAPSHOT_FILE: path.join(dir, "s.json") },
    stdio: ["ignore", "ignore", "pipe"],
  });
  const report = { desks: DESKS, samples: SAMPLES, transport: USE_STREAM ? "push + poll reconciliation" : "poll only" };
  const surfaces = [];
  try {
    for (let i = 0; i < 200; i += 1) {
      try { if ((await fetch(`${BASE}/api/lessons`)).ok) break; } catch { /* not up */ }
      await sleep(50);
    }

    const created = await req("POST", "/api/sessions", { body: { lessonModuleId: "m2l1-full-house", title: "latency" } });
    const code = created.body.session.code;
    const key = created.body.teacherKey;

    const seats = [];
    for (let i = 0; i < DESKS; i += 1) {
      const r = await req("POST", `/api/sessions/${code}/join`, { body: { displayName: `Desk ${i + 1}` } });
      seats.push(r.body.deviceToken);
    }

    const stream = USE_STREAM ? `/api/sessions/${code}/stream` : undefined;
    const board = surface({ url: `/api/sessions/${code}/board`, intervalMs: 1000, streamUrl: stream });
    const teacher = surface({ url: `/api/sessions/${code}/teacher`, intervalMs: 1500, token: key, streamUrl: stream });
    const desks = seats.map((t) => surface({ url: "/api/me", intervalMs: 1200, token: t, streamUrl: stream }));
    surfaces.push(board, teacher, ...desks);
    await sleep(600); // let every surface connect and take its first read

    await req("POST", `/api/sessions/${code}/control`, { body: { type: "advance" }, token: key }); // HOOK
    await req("POST", `/api/sessions/${code}/control`, { body: { type: "advance" }, token: key }); // PLAY
    for (const t of seats) await req("POST", `/api/sessions/${code}/actions`, { body: { type: "takeSeat" }, token: t });
    await sleep(400);

    /* -- teacher action -> projector, and -> every desk ---------------------- */
    const toBoard = [];
    const toDesk = [];
    for (let i = 0; i < SAMPLES; i += 1) {
      // Pause/unpause is the cheapest teacher action that every surface renders
      // and that can be repeated without consuming lesson content.
      const want = i % 2 === 0;
      const t0 = Date.now();
      await req("POST", `/api/sessions/${code}/control`, { body: { type: want ? "pause" : "unpause" }, token: key });
      const boardAt = board.waitFor((p) => p.paused === want);
      const deskAts = desks.map((d) => d.waitFor((p) => p.session.paused === want));
      toBoard.push((await boardAt) - t0);
      // The room does not move on until the LAST desk has it.
      const each = await Promise.all(deskAts);
      for (const at of each) toDesk.push(at - t0);
      await sleep(150);
    }
    report.teacherToProjector = summary(toBoard);
    report.teacherToStudent = summary(toDesk);

    /* -- student lock -> the teacher's own desk panel ------------------------ */
    const toTeacher = [];
    for (let i = 0; i < Math.min(SAMPLES, DESKS); i += 1) {
      const t0 = Date.now();
      await req("POST", `/api/sessions/${code}/actions`, { body: { type: "lock" }, token: seats[i] });
      const at = await teacher.waitFor((p) => (p.view?.lockedCount ?? 0) >= i + 1);
      toTeacher.push(at - t0);
      await sleep(120);
    }
    report.studentLockToTeacher = summary(toTeacher);
    report.pushConnected = { board: board.pushing, teacher: teacher.pushing, desks: desks.filter((d) => d.pushing).length };
  } finally {
    for (const s of surfaces) s.stop?.();
    child.kill("SIGKILL");
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error("latency harness failed:", e); process.exit(2); });
