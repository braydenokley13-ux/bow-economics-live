// Copies the non-TypeScript client assets (index.html per surface, the
// shared theme stylesheet, and the visual team's SVG assets) into dist/
// alongside the tsc-compiled JS. No bundler needed: the compiled JS is
// already standard browser ES modules with explicit .js import extensions
// (see tsconfig's NodeNext module setting).
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const surfaces = ["teach", "play", "board"];

for (const surface of surfaces) {
  const from = path.join(root, "src", "client", surface, "index.html");
  const toDir = path.join(root, "dist", "client", surface);
  mkdirSync(toDir, { recursive: true });
  cpSync(from, path.join(toDir, "index.html"));
}
console.log(`copied ${surfaces.length} static index.html file(s) into dist/client/`);

// EVERY stylesheet under src/client/shared/, not theme.css by name: the
// Module-2 layer (shared/m2.css) was added in the visual rebuild, the three
// index.html files link it, and a build that copies one stylesheet by name
// serves a 404 for the other on every clean checkout.
const sharedDir = path.join(root, "src", "client", "shared");
if (existsSync(sharedDir)) {
  const toDir = path.join(root, "dist", "client", "shared");
  mkdirSync(toDir, { recursive: true });
  const sheets = readdirSync(sharedDir).filter((f) => f.endsWith(".css"));
  for (const file of sheets) cpSync(path.join(sharedDir, file), path.join(toDir, file));
  console.log(`copied ${sheets.length} shared stylesheet(s) into dist/client/shared/: ${sheets.join(", ")}`);
}

// Self-hosted webfonts (gate-l1-visual P1/D3). They ship in the repo and are
// served off the same origin as everything else, so the "no internet, no CDN"
// promise in runtime/README.md is unchanged — nothing here reaches the network.
const fontsFrom = path.join(root, "src", "client", "shared", "fonts");
if (existsSync(fontsFrom)) {
  const toDir = path.join(root, "dist", "client", "shared", "fonts");
  mkdirSync(toDir, { recursive: true });
  const files = readdirSync(fontsFrom).filter((f) => f.endsWith(".woff2"));
  for (const file of files) cpSync(path.join(fontsFrom, file), path.join(toDir, file));
  console.log(`copied ${files.length} webfont file(s) into dist/client/shared/fonts/`);
}

// The visual identity SVGs live in the sibling design/ directory, owned by
// a different agent — read-only here, never written back. Copied into
// dist/client/assets/ at build time so the runtime's own static router
// (which only ever serves dist/client/**) can hand them to the browser
// with no separate asset server and no change to design/ itself.
const designAssetsDir = path.join(root, "..", "design", "assets");
if (existsSync(designAssetsDir)) {
  const toDir = path.join(root, "dist", "client", "assets");
  mkdirSync(toDir, { recursive: true });
  const svgs = readdirSync(designAssetsDir).filter((f) => f.endsWith(".svg"));
  for (const file of svgs) {
    cpSync(path.join(designAssetsDir, file), path.join(toDir, file));
  }
  console.log(`copied ${svgs.length} design asset(s) into dist/client/assets/`);
} else {
  console.log("design/assets/ not found yet — skipping visual asset copy (structural styling only)");
}
