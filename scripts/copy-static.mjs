// Copy static assets from public/ into dist/ after tsc has compiled src/ -> dist/js.
// Zero dependencies; runs under Node (build-time only).
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "public");
const outDir = join(root, "dist");

mkdirSync(outDir, { recursive: true });
cpSync(srcDir, outDir, { recursive: true });
console.log(`copied ${srcDir} -> ${outDir}`);
