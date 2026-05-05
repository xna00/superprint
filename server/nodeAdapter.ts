import assert from "node:assert";
import { createReadStream, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { apiHandler } from "./api/handler.ts";
import {createWebSocketServer} from './ws/index.ts'
import { logger } from './logger.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticDir = join(__dirname, 'static');


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

const serveStatic = (pathname: string, res: ServerResponse) => {
  const normalizedPath = normalize(pathname);
  let filePath = join(staticDir, normalizedPath);
  
  const resolvedPath = resolve(filePath);
  const resolvedStaticDir = resolve(staticDir);
  
  if (!resolvedPath.startsWith(resolvedStaticDir)) {
    res.writeHead(403, "Forbidden");
    res.end("Forbidden");
    return;
  }
  
  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) {
      throw new Error("not a file");
    }
  } catch {
    filePath = join(staticDir, 'index.html');
  }
  
  const ext = extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  
  res.writeHead(200, "OK", {
    "content-type": contentType,
  });
  
  createReadStream(filePath).pipe(res);
};

const server = createServer({}, (req, res) => {
  logger.log(req.method, req.url);

  assert(req.url);
  const pathname = new URL(req.url, base).pathname;
  if (req.url.startsWith("/api/")) {
    apiHandler(makeRequest(req)).then(respond.bind(null, res));
  } else {
    serveStatic(pathname, res);
  }
});

createWebSocketServer(server)

server.listen(port, "::");
logger.log(base);
