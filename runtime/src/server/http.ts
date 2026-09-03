/**
 * The HTTP layer: a small manual router over node:http.
 *
 * No web framework. The route table below is fixed and small (a dozen API
 * routes plus three static pages) — hand-rolling a switch over it is not
 * "reinventing a router" in the fragile sense the brief warns about, and it
 * keeps this product's dependency list at zero runtime packages, which
 * matters directly for cold-start on a teacher's laptop plugged in five
 * minutes before class.
 *
 * Transport (W4): a nudge stream in front of the same ETagged polling, never
 * instead of it. `GET /api/sessions/:code/stream` is a server-sent event
 * stream carrying ONLY "this session moved to version N" — no payload, no
 * private data, nothing a surface renders. Every surface still re-reads truth
 * through the authenticated endpoint it was already polling; the stream only
 * decides WHEN. So the original argument for polling still holds in full: a
 * classroom AP that silently kills a long-lived connection costs the room
 * nothing but latency, because the poll loop underneath never stopped, and the
 * failure path for a dead stream, a dropped packet, a cold load and a laptop
 * waking from sleep is still the identical "ask again" tick.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SessionBus } from "./sessionBus.js";
import { ServiceError, type SessionService } from "./sessionService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(here, "..", "client");
const MAX_BODY_BYTES = 64 * 1024;

type Json = Record<string, unknown>;

function sendJson(res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(payload);
}

function sendError(res: http.ServerResponse, error: unknown): void {
  if (error instanceof ServiceError) {
    // `retryable` is the field the student's durable outbox reads to decide
    // whether to hold an action or discard it. It is on the wire explicitly
    // rather than inferred from the status code, because the same 409 covers
    // both a semantic ruling ("price must be $10-$120") and a transient write
    // race, and a client guessing between them is how a decision gets lost.
    sendJson(res, error.status, { error: { code: error.code, message: error.message, retryable: error.retryable } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[http] unexpected error:", error);
  // An unexpected server fault says nothing about the action's validity, so the
  // action is worth trying again.
  sendJson(res, 500, { error: { code: "internal", message: "something went wrong", retryable: true } });
}

async function readJson(req: http.IncomingMessage): Promise<Json> {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    if (req.method === "GET" || req.method === "HEAD") return {};
    throw new ServiceError(400, "bad_content_type", "expected application/json");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new ServiceError(413, "body_too_large", "request body too large");
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Json;
  } catch {
    throw new ServiceError(400, "bad_json", "request body is not valid JSON");
  }
}

function bearerToken(req: http.IncomingMessage): string | null {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

const STATIC_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  // Self-hosted webfonts (gate-l1-visual P1). Cached hard: the file name is
  // content-stable and a Chromebook should fetch each face exactly once.
  ".woff2": "font/woff2",
};

/** Fonts are immutable; everything else must never be cached across a class. */
const STATIC_CACHE: Record<string, string> = { ".woff2": "public, max-age=31536000, immutable" };

async function serveStatic(res: http.ServerResponse, relativePath: string): Promise<boolean> {
  const resolved = path.normalize(path.join(CLIENT_DIR, relativePath));
  if (!resolved.startsWith(CLIENT_DIR)) return false; // path traversal guard
  const ext = path.extname(resolved);
  const contentType = STATIC_TYPES[ext];
  if (!contentType) return false;
  try {
    const info = await stat(resolved);
    if (!info.isFile()) return false;
  } catch {
    return false;
  }
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": STATIC_CACHE[ext] ?? "no-cache" });
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(resolved);
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.pipe(res);
  });
  return true;
}

/** ETag = session version. Handles If-None-Match and returns true if it already answered 304. */
function maybeNotModified(req: http.IncomingMessage, res: http.ServerResponse, etag: string): boolean {
  const inm = req.headers["if-none-match"];
  if (inm === etag) {
    res.writeHead(304, { ETag: etag });
    res.end();
    return true;
  }
  return false;
}

/** Keeps a proxy or an idle-timeout from quietly closing a stream nobody is talking on. */
const SSE_HEARTBEAT_MS = 15_000;

export function createHttpServer(service: SessionService, bus?: SessionBus): http.Server {
  const server = http.createServer((req, res) => {
    void handle(service, req, res, bus).catch((error) => sendError(res, error));
  });
  // An SSE response is open for the whole lesson. Node's default 5s
  // keep-alive/headers timeouts are about IDLE sockets between requests, but
  // being explicit here stops a future default from cutting a class in half.
  server.keepAliveTimeout = 0;
  server.headersTimeout = 0;
  server.requestTimeout = 0;
  return server;
}

/**
 * The nudge stream.
 *
 * Carries the session's version and a seat-change epoch, and nothing else. It
 * is reachable with the join code alone — deliberately, because that is exactly
 * what it discloses: that a room somebody already has the code for has moved.
 * Every byte a surface actually renders still comes from the authenticated,
 * ETagged endpoint behind it.
 */
async function serveStream(
  service: SessionService,
  bus: SessionBus,
  code: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const session = await service.sessionIdForCode(code);
  if (!session) {
    sendJson(res, 404, { error: { code: "not_found", message: "no such session", retryable: false } });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Nginx and friends buffer text/event-stream by default, which turns a
    // push stream into a very slow poll.
    "X-Accel-Buffering": "no",
  });
  // The first frame doubles as the client's "the stream is live" signal, and it
  // carries current truth so a surface that connects mid-class refetches once
  // immediately rather than waiting for the next change.
  res.write(`retry: 2000\ndata: ${JSON.stringify({ version: session.version, seatEpoch: 0, hello: true })}\n\n`);

  const unsubscribe = bus.subscribe(session.id, (nudge) => {
    res.write(`data: ${JSON.stringify(nudge)}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": ping\n\n"), SSE_HEARTBEAT_MS);
  heartbeat.unref?.();
  const close = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };
  req.on("close", close);
  res.on("close", close);
  res.on("error", close);
}

async function handle(
  service: SessionService,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  bus?: SessionBus,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method ?? "GET";

  // ---- static shell surfaces ----
  if (method === "GET" && (parts.length === 0)) {
    res.writeHead(302, { Location: "/teach" });
    res.end();
    return;
  }
  if (method === "GET" && parts[0] && ["teach", "play", "board", "shared", "assets"].includes(parts[0])) {
    const rel = parts.length === 1 ? `${parts[0]}/index.html` : parts.join("/");
    if (await serveStatic(res, rel)) return;
    sendJson(res, 404, { error: { code: "not_found", message: "asset not found" } });
    return;
  }

  if (parts[0] !== "api") {
    sendJson(res, 404, { error: { code: "not_found", message: "not found" } });
    return;
  }

  try {
    // GET /api/lessons
    if (method === "GET" && parts[1] === "lessons" && parts.length === 2) {
      sendJson(res, 200, { lessons: service.listModules() });
      return;
    }

    // POST /api/sessions
    if (method === "POST" && parts[1] === "sessions" && parts.length === 2) {
      const body = await readJson(req);
      const lessonModuleId = String(body["lessonModuleId"] ?? "");
      const title = String(body["title"] ?? "");
      // Optional cross-lesson continuity link (e.g. M1 L2 linked to a
      // completed L1 session) — an opaque id, meaningless to this layer.
      const sourceSessionId = body["sourceSessionId"] ? String(body["sourceSessionId"]) : undefined;
      const payload = await service.createSession({ lessonModuleId, title, sourceSessionId });
      sendJson(res, 201, payload);
      return;
    }

    // GET /api/sessions
    if (method === "GET" && parts[1] === "sessions" && parts.length === 2) {
      sendJson(res, 200, { sessions: await service.listSessions() });
      return;
    }

    // GET /api/me  (student poll, Authorization: Bearer <deviceToken>)
    if (method === "GET" && parts[1] === "me" && parts.length === 2) {
      const token = bearerToken(req);
      if (!token) throw new ServiceError(401, "no_token", "missing device token");
      const payload = await service.resumeByToken(token);
      // Every session mutation — the student's own action or a teacher
      // control — bumps session.version, and a seat's view only ever
      // derives from session state/phase, so version alone would be a correct
      // change fingerprint for the view.
      //
      // It is NOT a correct fingerprint for the whole payload. WHILE YOU WERE
      // AWAY turns on seat bookkeeping that deliberately does not bump the
      // session version — a desk coming back is not a change to the class —
      // so on version alone the poll that discovers the recap answers 304 with
      // no body and the recap never reaches the pair who missed the class. It
      // is part of the fingerprint.
      const etag = `"${payload.session.version}${payload.away ? `:away${payload.away.lines.length}` : ""}"`;
      if (maybeNotModified(req, res, etag)) return;
      sendJson(res, 200, payload, { ETag: etag });
      return;
    }

    // POST /api/me/recap/seen  (the pair has read what they missed)
    if (method === "POST" && parts[1] === "me" && parts[2] === "recap" && parts[3] === "seen" && parts.length === 4) {
      const token = bearerToken(req);
      if (!token) throw new ServiceError(401, "no_token", "missing device token");
      sendJson(res, 200, await service.acknowledgeRecap(token));
      return;
    }

    if (parts[1] === "sessions" && parts.length >= 3 && parts[2]) {
      const code = decodeURIComponent(parts[2]).toUpperCase();
      const sub = parts[3];

      // POST /api/sessions/:code/join
      if (method === "POST" && sub === "join" && parts.length === 4) {
        const body = await readJson(req);
        const payload = await service.join(code, String(body["displayName"] ?? ""));
        sendJson(res, 201, payload);
        return;
      }

      // POST /api/sessions/:code/rejoin
      if (method === "POST" && sub === "rejoin" && parts.length === 4) {
        const body = await readJson(req);
        const payload = await service.rejoin(code, String(body["displayName"] ?? ""), String(body["pin"] ?? ""));
        sendJson(res, 200, payload);
        return;
      }

      // POST /api/sessions/:code/actions
      if (method === "POST" && sub === "actions" && parts.length === 4) {
        const token = bearerToken(req);
        if (!token) throw new ServiceError(401, "no_token", "missing device token");
        const body = await readJson(req);
        const type = String(body["type"] ?? "");
        if (!type) throw new ServiceError(400, "bad_action", "action requires a type");
        const payload = await service.submitAction(token, { ...body, type });
        sendJson(res, 200, payload);
        return;
      }

      // POST /api/sessions/:code/control  (R1: requires the teacher key issued at createSession, as a bearer token)
      if (method === "POST" && sub === "control" && parts.length === 4) {
        const teacherKey = bearerToken(req);
        const body = await readJson(req);
        const type = String(body["type"] ?? "");
        const allowed = new Set([
          "advance", "reveal", "pause", "unpause", "freeze", "unfreeze", "hook", "end", "restore",
          // TIME CUT
          "finalCall", "closeNow", "cancelFinalCall",
        ]);
        if (!allowed.has(type)) throw new ServiceError(400, "bad_control", `unknown control action "${type}"`);
        const action =
          type === "hook"
            ? { type: "hook" as const, hook: String(body["hook"] ?? "") }
            : type === "finalCall"
              ? { type: "finalCall" as const, ...(body["durationMs"] === undefined ? {} : { durationMs: Number(body["durationMs"]) }) }
              : { type: type as Exclude<typeof type, "hook"> };
        const payload = await service.control(code, action as Parameters<SessionService["control"]>[1], teacherKey);
        sendJson(res, 200, payload);
        return;
      }

      // POST /api/sessions/:code/seats/:seatId/unlock  (R3: teacher-only, clears a seat's rejoin lockout)
      if (method === "POST" && sub === "seats" && parts[5] === "unlock" && parts.length === 6) {
        const teacherKey = bearerToken(req);
        const seatId = decodeURIComponent(parts[4]!);
        await service.unlockRejoin(code, seatId, teacherKey);
        sendJson(res, 200, { ok: true });
        return;
      }

      // GET /api/sessions/:code/teacher  (R1: requires the teacher key)
      if (method === "GET" && sub === "teacher" && parts.length === 4) {
        const teacherKey = bearerToken(req);
        const payload = await service.teacherView(code, teacherKey);
        // session.version alone misses one thing: a seat joining does not
        // mutate session state, so it does not bump session.version. The
        // roster's own composition (count + most recent join) is folded in
        // so a new join always invalidates the teacher's cached view — the
        // live join list has to update on its own, not piggyback on a
        // phase change.
        const lastJoin = payload.seats.at(-1)?.joinedAt ?? "";
        // A seat crossing the rejoin-lockout threshold changes none of
        // version/count/lastJoin, so the teacher's conditional poll answered 304
        // and the "PIN LOCKED" pill and its Unlock button never rendered — the
        // one control that can free that student was unreachable, and in LOBBY
        // or right after a restart nothing else was bumping the version to
        // shake it loose. Reproduced: five wrong PINs, then a conditional GET
        // returning 304 while an unconditional GET showed rejoinLocked: true.
        // The lock count is now part of the room's fingerprint.
        const locked = payload.seats.reduce((n, s) => n + (s.rejoinLocked ? 1 : 0), 0);
        const etag = `"${payload.session.version}-${payload.seats.length}-${lastJoin}-L${locked}"`;
        if (maybeNotModified(req, res, etag)) return;
        sendJson(res, 200, payload, { ETag: etag });
        return;
      }

      // GET /api/sessions/:code/stream  (SSE nudges; W4)
      if (method === "GET" && sub === "stream" && parts.length === 4) {
        if (!bus) {
          // No bus wired (a test harness, an older embedding): say so plainly
          // rather than hanging an EventSource open forever. The client falls
          // back to its polling interval, which is the designed behaviour.
          sendJson(res, 501, { error: { code: "no_stream", message: "this server has no push stream", retryable: false } });
          return;
        }
        await serveStream(service, bus, code, req, res);
        return;
      }

      // GET /api/sessions/:code/board
      if (method === "GET" && sub === "board" && parts.length === 4) {
        const payload = await service.boardView(code);
        const etag = `"${payload.version}"`;
        if (maybeNotModified(req, res, etag)) return;
        sendJson(res, 200, payload, { ETag: etag });
        return;
      }
    }

    sendJson(res, 404, { error: { code: "not_found", message: "no such route" } });
  } catch (error) {
    sendError(res, error);
  }
}
