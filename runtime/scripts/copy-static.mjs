// Copies the non-TypeScript client assets (index.html per surface) into
// dist/ alongside the tsc-compiled JS. No bundler needed: the compiled JS
// is already standard browser ES modules with explicit .js import
// extensions (see tsconfig's NodeNext module setting).
import { cpSync, mkdirSync } from "node:fs";
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
