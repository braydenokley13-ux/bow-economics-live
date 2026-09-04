/**
 * THE STATIC ROUTE, AS A CLASSROOM SURFACE.
 *
 * Two defects this file exists to keep fixed, both found by reading the
 * platform rather than by playing it, and both invisible to every other test
 * in the suite because no test had ever asked the server for a file.
 *
 * 1. RASTER ART WAS UNSERVABLE. `serveStatic` returns false for any extension
 *    missing from `STATIC_TYPES`, and the table listed html/js/css/json/svg/
 *    woff2 only. A `.png` in `dist/client` therefore fell through to the 404
 *    branch. Nothing said so: the build copied only `.svg`, so no raster file
 *    ever existed to 404, and the ceiling read as a design preference instead
 *    of a lookup table. Module 1's visual target asks for painted
 *    environmental art, so the ceiling had to go before the art was drawn.
 *
 * 2. EVERY RELOAD REFETCHED THE WHOLE CLIENT. The route sent
 *    `Cache-Control: no-cache` and no validator at all. `no-cache` is not
 *    `no-store` — it means "keep it, but ask first" — and a browser with
 *    nothing to ask WITH re-downloads. So a /play refresh pulled the compiled
 *    client, `theme.css` and `m2.css` down again in full, and a refresh is not
 *    an unusual event on a classroom Chromebook. An ETag turns that into a
 *    304.
 *
 * These are asserted against a REAL server on a real socket, because both
 * defects live in header behaviour that a unit call on the handler would not
 * reproduce.
 */
import assert from "node:assert/strict";
import { createHttpServer } from "../server/http.js";
import { SessionService } from "../server/sessionService.js";
import { SessionBus } from "../server/sessionBus.js";
import { SnapshotRepository } from "../server/snapshotRepository.js";
import { lobbyDemoModule } from "../modules/lobbyDemo.js";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { AddressInfo } from "node:net";

const here = path.dirname(fileURLToPath(import.meta.url));
/** dist/test -> dist */
const DIST = path.resolve(here, "..");
const CLIENT = path.join(DIST, "client");

async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "bow-static-"));
  const bus = new SessionBus();
  const repo = new SnapshotRepository(path.join(dir, "snap.json"), { bus });
  await repo.whenReady();
  const service = new SessionService(repo);
  service.registerModule(lobbyDemoModule);
  const server = createHttpServer(service, bus);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

/**
 * A one-pixel PNG, written into the served tree for the duration of one test
 * and removed afterwards. Bytes rather than a fixture file so the test cannot
 * be made to pass by a build step that happens to copy something.
 */
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test("a PNG under the client tree is served as an image, not 404'd", async () => {
  const artDir = path.join(CLIENT, "shared", "art");
  fs.mkdirSync(artDir, { recursive: true });
  const file = path.join(artDir, "__test-pixel.png");
  fs.writeFileSync(file, ONE_PIXEL_PNG);
  try {
    await withServer(async (base) => {
      const res = await fetch(`${base}/shared/art/__test-pixel.png`);
      assert.equal(res.status, 200, "a .png in the client tree must be served, not 404'd");
      assert.equal(res.headers.get("content-type"), "image/png");
      const body = Buffer.from(await res.arrayBuffer());
      assert.equal(body.length, ONE_PIXEL_PNG.length, "the bytes on the wire are the bytes on disk");
    });
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test("every raster type the build copies is a type the router can serve", async () => {
  // The build's ART_EXTENSIONS and the router's STATIC_TYPES are two lists in
  // two files that must agree. A file the build copies and the router cannot
  // type is a silent 404; the reverse is a silent missing asset. Rather than
  // import the build script (an .mjs outside tsc's program), this asserts the
  // router half directly for every extension the build is allowed to copy.
  const buildScript = fs.readFileSync(path.resolve(DIST, "..", "scripts", "copy-static.mjs"), "utf8");
  const match = buildScript.match(/const ART_EXTENSIONS = \[([^\]]+)\]/);
  assert.ok(match, "copy-static.mjs must declare ART_EXTENSIONS so this test can read it");
  const extensions = match[1]!.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  assert.ok(extensions.length >= 5, `expected the build to copy several art types, saw ${extensions.join(" ")}`);

  const artDir = path.join(CLIENT, "shared", "art");
  fs.mkdirSync(artDir, { recursive: true });
  const written: string[] = [];
  for (const ext of extensions) {
    const file = path.join(artDir, `__test-agree${ext}`);
    fs.writeFileSync(file, ext === ".svg" ? '<svg xmlns="http://www.w3.org/2000/svg"/>' : ONE_PIXEL_PNG);
    written.push(file);
  }
  try {
    await withServer(async (base) => {
      for (const ext of extensions) {
        const res = await fetch(`${base}/shared/art/__test-agree${ext}`);
        assert.equal(res.status, 200, `the build copies ${ext} but the router will not serve it`);
        await res.arrayBuffer();
      }
    });
  } finally {
    for (const f of written) fs.rmSync(f, { force: true });
  }
});

test("a static file carries an ETag, and a matching If-None-Match gets a 304 with no body", async () => {
  await withServer(async (base) => {
    const first = await fetch(`${base}/play/index.html`);
    assert.equal(first.status, 200);
    const etag = first.headers.get("etag");
    assert.ok(etag, "a no-cache static response with no validator forces a full refetch on every reload");
    const body = await first.text();
    assert.ok(body.length > 0);

    const second = await fetch(`${base}/play/index.html`, { headers: { "If-None-Match": etag! } });
    assert.equal(second.status, 304, "the second load of an unchanged file must revalidate, not re-download");
    assert.equal((await second.text()).length, 0, "a 304 carries no body");
    assert.equal(second.headers.get("etag"), etag, "the 304 re-states the validator it matched");
  });
});

test("the compiled client bundle and its stylesheets all revalidate", async () => {
  // The three files a /play refresh actually pays for. Named individually so a
  // regression on any one of them is legible in the failure message.
  const paths = ["/play/main.js", "/shared/theme.css", "/shared/m2.css"];
  await withServer(async (base) => {
    for (const p of paths) {
      const first = await fetch(`${base}${p}`);
      assert.equal(first.status, 200, `${p} must be served`);
      const etag = first.headers.get("etag");
      assert.ok(etag, `${p} must carry a validator`);
      await first.arrayBuffer();
      const second = await fetch(`${base}${p}`, { headers: { "If-None-Match": etag! } });
      assert.equal(second.status, 304, `${p} must 304 on an unchanged reload`);
      await second.arrayBuffer();
    }
  });
});

test("a changed file invalidates its own ETag", async () => {
  const artDir = path.join(CLIENT, "shared", "art");
  fs.mkdirSync(artDir, { recursive: true });
  const file = path.join(artDir, "__test-changes.json");
  fs.writeFileSync(file, '{"v":1}');
  try {
    await withServer(async (base) => {
      const first = await fetch(`${base}/shared/art/__test-changes.json`);
      const etag = first.headers.get("etag")!;
      await first.text();

      // A longer, later file: both limbs of the validator move, so this also
      // fails if the ETag were ever reduced to a constant.
      fs.writeFileSync(file, '{"v":2,"padding":"aaaaaaaaaaaaaaaaaaaa"}');
      const now = Date.now() + 5_000;
      fs.utimesSync(file, now / 1000, now / 1000);

      const second = await fetch(`${base}/shared/art/__test-changes.json`, { headers: { "If-None-Match": etag } });
      assert.equal(second.status, 200, "a rebuilt asset must not be served from a stale cache entry");
      assert.notEqual(second.headers.get("etag"), etag);
      assert.match(await second.text(), /"v":2/);
    });
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test("fonts stay immutably cached and everything else stays revalidate-only", async () => {
  await withServer(async (base) => {
    const html = await fetch(`${base}/play/index.html`);
    assert.equal(html.headers.get("cache-control"), "no-cache", "lesson code must never be cached across a class");
    await html.text();

    const fontDir = path.join(CLIENT, "shared", "fonts");
    if (!fs.existsSync(fontDir)) return;
    const face = fs.readdirSync(fontDir).find((f) => f.endsWith(".woff2"));
    if (!face) return;
    const res = await fetch(`${base}/shared/fonts/${face}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "font/woff2");
    assert.match(String(res.headers.get("cache-control")), /immutable/);
    await res.arrayBuffer();
  });
});

test("the path-traversal guard still holds for the newly servable types", async () => {
  await withServer(async (base) => {
    for (const attempt of [
      "/play/../../../../etc/passwd",
      "/shared/art/..%2f..%2f..%2f..%2fetc%2fpasswd",
      "/play/..%2F..%2Fpackage.json",
    ]) {
      const res = await fetch(`${base}${attempt}`);
      assert.notEqual(res.status, 200, `${attempt} must never be served`);
      await res.arrayBuffer();
    }
  });
});
