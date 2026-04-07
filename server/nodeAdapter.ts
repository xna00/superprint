import assert from "node:assert";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { dirname, extname, join, relative } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { apiHandler } from "./api/handler.ts";
import {createWebSocketServer} from './ws/index.ts'

console.log(createWebSocketServer)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const port = 8000;
const base = `http://localhost:${port}`;

export const makeRequest = (req: IncomingMessage): Request => {
  assert(req.url);
  const method = req.method;
  const r = new Request(new URL(req.url, base), {
    method,
    duplex: "half",
    headers: Object.entries(req.headers).map(([k, v]) => [
      k,
      v?.toString() ?? "",
    ]),
    body: method === "GET" || method === "HEAD" ? null : Readable.toWeb(req),
  });

  return r;
};

export const respond = (
  res: ServerResponse<IncomingMessage> & {
    req: IncomingMessage;
  },
  response: Response
) => {
  res.writeHead(
    response.status,
    response.statusText,
    Object.fromEntries(response.headers)
  );
  if (response.body) {
    Readable.fromWeb(response.body).pipe(res, { end: true });
  } else {
    res.end();
  }
};

const loadStaticFiles = (distPath: string): Record<string, number[]> => {
  const files: Record<string, number[]> = {};
  
  if (!existsSync(distPath)) {
    console.warn(`Dist directory not found: ${distPath}`);
    return files;
  }

  const loadDir = (dir: string) => {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        loadDir(fullPath);
      } else {
        const relativePath = '/' + relative(distPath, fullPath);
        const content = readFileSync(fullPath);
        files[relativePath] = Array.from(content);
      }
    }
  };

  loadDir(distPath);
  return files;
};

const staticFiles: Record<string, number[]> = loadStaticFiles(join(__dirname, '../web/dist'));


const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer({}, (req, res) => {
  console.log(req.url);

  assert(req.url);
  const pathname = new URL(req.url, base).pathname;
  if (req.url.startsWith("/api/")) {
    apiHandler(makeRequest(req)).then(respond.bind(null, res));
  } else {
    const path = staticFiles[pathname] !== undefined ? pathname : "/index.html";
    const ext = extname(path).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, "OK", {
      "content-type": contentType,
    });
    res.end(Buffer.from(staticFiles[path]));
  }
});

createWebSocketServer(server)

server.listen(port, "::");
console.log(base);
