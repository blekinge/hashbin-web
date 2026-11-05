// Minimal zero-dependency static file server for local preview of dist/.
// Usage: node scripts/serve.mjs [port]   (default 5173)
// Serves ./dist with correct MIME types and directory -> index.html resolution.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";

const port = Number(process.argv[2] ?? 5173);
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    // Resolve within root; block path traversal.
    let filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    try {
      await readFile(filePath); // probe; if it's a directory this throws
    } catch {
      filePath = join(filePath, "index.html"); // extensionless routes -> index.html
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": TYPES[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
}).listen(port, () => console.log(`hashbin-web static server: http://localhost:${port}/`));
