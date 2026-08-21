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
 * Transport: short-interval polling with ETag/If-None-Match, not SSE/WS.
 * Justified at length in runtime/README.md; the summary is that a real
 * classroom AP is exactly the environment where a long-lived connection
 * (SSE or a WebSocket) is most likely to be silently killed by an idle
 * timeout or a proxy, and polling's failure mode is simply "try again next
 * tick" — identical code path for the initial load, a dropped packet, and
 * a full reconnect after the teacher's laptop sleeps.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
    sendJson(res, error.status, { error: { code: error.code, message: error.message } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[http] unexpected error:", error);
  sendJson(res, 500, { error: { code: "internal", message: "something went wrong" } });
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
};

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
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
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

export function createHttpServer(service: SessionService): http.Server {
  return http.createServer((req, res) => {
    void handle(service, req, res).catch((error) => sendError(res, error));
  });
}

async function handle(service: SessionService, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method ?? "GET";

  // ---- static shell surfaces ----
  if (method === "GET" && (parts.length === 0)) {
    res.writeHead(302, { Location: "/teach" });
    res.end();
    return;
  }
  if (method === "GET" && parts[0] && ["teach", "play", "board", "shared"].includes(parts[0])) {
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
      const payload = await service.createSession({ lessonModuleId, title });
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
      // derives from session state/phase, so version alone is a correct
      // change fingerprint here.
      const etag = `"${payload.session.version}"`;
      if (maybeNotModified(req, res, etag)) return;
      sendJson(res, 200, payload, { ETag: etag });
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

      // POST /api/sessions/:code/control
      if (method === "POST" && sub === "control" && parts.length === 4) {
        const body = await readJson(req);
        const type = String(body["type"] ?? "");
        const allowed = new Set(["advance", "reveal", "pause", "unpause", "freeze", "unfreeze", "hook", "end", "restore"]);
        if (!allowed.has(type)) throw new ServiceError(400, "bad_control", `unknown control action "${type}"`);
        const action = type === "hook" ? { type: "hook" as const, hook: String(body["hook"] ?? "") } : { type: type as Exclude<typeof type, "hook"> };
        const payload = await service.control(code, action as Parameters<SessionService["control"]>[1]);
        sendJson(res, 200, payload);
        return;
      }

      // GET /api/sessions/:code/teacher
      if (method === "GET" && sub === "teacher" && parts.length === 4) {
        const payload = await service.teacherView(code);
        // session.version alone misses one thing: a seat joining does not
        // mutate session state, so it does not bump session.version. The
        // roster's own composition (count + most recent join) is folded in
        // so a new join always invalidates the teacher's cached view — the
        // live join list has to update on its own, not piggyback on a
        // phase change.
        const lastJoin = payload.seats.at(-1)?.joinedAt ?? "";
        const etag = `"${payload.session.version}-${payload.seats.length}-${lastJoin}"`;
        if (maybeNotModified(req, res, etag)) return;
        sendJson(res, 200, payload, { ETag: etag });
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
