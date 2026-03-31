import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root ?? ".");
const port = Number(args.port ?? 8085);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
};

const server = createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end("Missing request URL");
    return;
  }

  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const absolutePath = normalize(join(root, relativePath));

  if (!absolutePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const finalPath = existsSync(absolutePath) && statSync(absolutePath).isDirectory()
    ? join(absolutePath, "index.html")
    : absolutePath;

  if (!existsSync(finalPath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const contentType = contentTypes[extname(finalPath)] ?? "application/octet-stream";
  response.writeHead(200, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  createReadStream(finalPath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}
