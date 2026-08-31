// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import path from "node:path";

export class BossError extends Error {
  constructor(message, code = "BOSS_ERROR", details = undefined) {
    super(message);
    this.name = "BossError";
    this.code = code;
    this.details = details;
  }
}

export function invariant(condition, message, code = "INVALID_INPUT", details = undefined) {
  if (!condition) throw new BossError(message, code, details);
}

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function unique(values) {
  return [...new Set(values)];
}

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
}

export function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashFile(filePath) {
  return sha256(readFileSync(filePath));
}

export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new BossError(`Cannot read valid JSON from ${filePath}: ${error.message}`, "INVALID_JSON");
  }
}

export function writeJsonAtomic(filePath, value) {
  writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeTextAtomic(filePath, text) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`;
  const fd = openSync(tempPath, "wx", 0o600);
  try {
    writeSync(fd, text, undefined, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tempPath, filePath);
}

export function appendLineSynced(filePath, line) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const fd = openSync(filePath, "a", 0o600);
  try {
    writeSync(fd, `${line}\n`, undefined, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

export function normalizeRunId(value) {
  invariant(isNonEmptyString(value), "Run id is required.");
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  invariant(/^[a-z0-9][a-z0-9-]{2,63}$/.test(normalized), `Invalid run id: ${value}`);
  return normalized;
}

export function normalizeId(value, label = "id") {
  invariant(isNonEmptyString(value), `${label} is required.`);
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  invariant(normalized.length >= 2, `Invalid ${label}: ${value}`);
  return normalized;
}

export function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(current, ".boss", "config", "project.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new BossError("Run this command inside the BOW repository.", "REPO_NOT_FOUND");
}

export function bossPaths(root, runId = undefined) {
  const boss = path.join(root, ".boss");
  const result = {
    root,
    boss,
    config: path.join(boss, "config"),
    schemas: path.join(boss, "schemas"),
    runs: path.join(boss, "runs"),
    lessons: path.join(boss, "lessons", "index.json"),
    precedents: path.join(boss, "precedents", "index.json"),
    metrics: path.join(boss, "metrics", "aggregate.json"),
  };
  if (runId) {
    const run = path.join(result.runs, normalizeRunId(runId));
    return {
      ...result,
      run,
      events: path.join(run, "events.jsonl"),
      state: path.join(run, "state.json"),
      summary: path.join(run, "SUMMARY.md"),
      contract: path.join(run, "contract.md"),
      evidence: path.join(run, "evidence"),
      reports: path.join(run, "reports"),
      meetings: path.join(run, "meetings"),
      shipCases: path.join(run, "ship-cases"),
      lock: path.join(run, ".lock"),
    };
  }
  return result;
}

export function loadConfig(root) {
  const configDir = bossPaths(root).config;
  return {
    project: readJson(path.join(configDir, "project.json")),
    levels: readJson(path.join(configDir, "levels.json")),
    activation: readJson(path.join(configDir, "activation-rules.json")),
    roles: readJson(path.join(configDir, "roles.json")),
    models: readJson(path.join(configDir, "models.json")),
    meetings: readJson(path.join(configDir, "meetings.json")),
  };
}

export function parseArgv(argv) {
  const positional = [];
  const flags = {};
  let remainder = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") {
      remainder = argv.slice(index + 1);
      break;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const equal = token.indexOf("=");
    if (equal !== -1) {
      flags[token.slice(2, equal)] = token.slice(equal + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags, remainder };
}

export function requireFlag(flags, name) {
  const value = flags[name];
  invariant(isNonEmptyString(value), `Missing required --${name}.`);
  return value;
}

export function listFlag(value) {
  if (value === undefined || value === false) return [];
  if (Array.isArray(value)) return value.flatMap(listFlag);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function jsonInput(value, root = process.cwd()) {
  invariant(isNonEmptyString(value), "JSON input is required.");
  if (value.startsWith("@")) return readJson(path.resolve(root, value.slice(1)));
  const possiblePath = path.resolve(root, value);
  if (existsSync(possiblePath)) return readJson(possiblePath);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new BossError(`Expected inline JSON or a JSON file path: ${error.message}`, "INVALID_JSON_INPUT");
  }
}

export function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024,
    shell: false,
  });
  return {
    command,
    args,
    exitCode: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? (result.error?.message ?? ""),
    signal: result.signal ?? null,
  };
}

export function git(root, args, { allowFailure = false } = {}) {
  const result = runProcess("git", args, { cwd: root });
  if (!allowFailure && result.exitCode !== 0) {
    throw new BossError(`git ${args.join(" ")} failed: ${result.stderr.trim()}`, "GIT_ERROR", result);
  }
  return result;
}

export function gitSnapshot(root) {
  const branch = git(root, ["branch", "--show-current"]).stdout.trim();
  const commit = git(root, ["rev-parse", "HEAD"]).stdout.trim();
  const status = git(root, ["status", "--porcelain", "--untracked-files=normal"]).stdout;
  const defaultBase = git(root, ["rev-parse", "--verify", "origin/main"], { allowFailure: true });
  return {
    branch,
    commit,
    dirty: status.trim().length > 0,
    statusLines: status.trim() ? status.trim().split("\n") : [],
    originMain: defaultBase.exitCode === 0 ? defaultBase.stdout.trim() : null,
  };
}

export function withDirectoryLock(lockPath, action, { timeoutMs = 5000 } = {}) {
  const started = Date.now();
  mkdirSync(path.dirname(lockPath), { recursive: true });
  for (;;) {
    try {
      mkdirSync(lockPath);
      writeFileSync(path.join(lockPath, "owner.json"), `${JSON.stringify({ pid: process.pid, at: new Date().toISOString() })}\n`, {
        mode: 0o600,
      });
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (Date.now() - started >= timeoutMs) {
        throw new BossError(`Run is locked: ${lockPath}`, "RUN_LOCKED");
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    return action();
  } finally {
    rmSync(lockPath, { recursive: true, force: true });
  }
}

export function copyImmutableEvidence(sourcePath, destinationDir, id) {
  const absolute = path.resolve(sourcePath);
  invariant(existsSync(absolute), `Evidence file does not exist: ${sourcePath}`, "MISSING_EVIDENCE_FILE");
  const sourceStat = statSync(absolute);
  invariant(sourceStat.isFile(), `Evidence is not a file: ${sourcePath}`, "INVALID_EVIDENCE_FILE");
  mkdirSync(destinationDir, { recursive: true });
  const safeName = path.basename(absolute).replace(/[^a-zA-Z0-9._-]/g, "-");
  const destination = path.join(destinationDir, `${normalizeId(id, "evidence id")}--${safeName}`);
  invariant(!existsSync(destination), `Evidence destination already exists: ${destination}`, "IMMUTABLE_EVIDENCE");
  copyFileSync(absolute, destination);
  return {
    destination,
    sha256: hashFile(destination),
    size: statSync(destination).size,
  };
}

export function pathOverlaps(left, right) {
  const a = path.posix.normalize(left.replaceAll("\\", "/")).replace(/^\.\//, "").replace(/\/$/, "");
  const b = path.posix.normalize(right.replaceAll("\\", "/")).replace(/^\.\//, "").replace(/\/$/, "");
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

export function toRelative(root, filePath) {
  const relative = path.relative(root, path.resolve(filePath));
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `Path must be inside repository: ${filePath}`);
  return relative.replaceAll(path.sep, "/");
}

export function now() {
  return new Date().toISOString();
}

// Independent-review repair: fingerprint of the whole harness constitution
// (all config files), frozen into RunCreated and re-checked at every gate so
// mid-run edits to roles, levels, activation rules, meetings, models, or
// project law cannot silently change what a running wave is held to.
export function configFingerprint(root) {
  return sha256(canonicalJson(loadConfig(root)));
}
