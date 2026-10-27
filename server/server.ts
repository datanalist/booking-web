import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { createDataStoreMiddleware } from "../vite/createDataStoreMiddleware.ts";

/**
 * Прод-сервер кабинета: статика из dist (SPA-fallback) и файловое хранилище фото
 * (POST/DELETE /api/files, GET /data/:name) на том же middleware, что и в Vite.
 * Без зависимостей; запускается на Node 24 (типы вырезаются нативно).
 */

const PORT = Number(process.env.PORT ?? 8080);
const DIST_DIR = path.resolve(process.env.DIST_DIR ?? "dist");
const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "data");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const dataStore = createDataStoreMiddleware({ dataDir: DATA_DIR });

async function fileIfExists(filePath: string): Promise<string | null> {
  try {
    const info = await stat(filePath);
    return info.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");

  if (url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  dataStore(req as never, res, (err?: unknown) => {
    if (err !== undefined) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      res.end();
      return;
    }
    void serveStatic(url.pathname, req.method ?? "GET", res);
  });
});

async function serveStatic(
  pathname: string,
  method: string,
  res: import("node:http").ServerResponse,
): Promise<void> {
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  const candidate = path.join(DIST_DIR, path.normalize(decoded));
  const inside = candidate === DIST_DIR || candidate.startsWith(DIST_DIR + path.sep);

  let target = inside ? await fileIfExists(candidate) : null;
  const isAsset = decoded.startsWith("/assets/");
  if (target === null && isAsset) {
    res.writeHead(404);
    res.end();
    return;
  }
  // SPA-fallback: любой неизвестный маршрут отдаёт index.html.
  target ??= path.join(DIST_DIR, "index.html");

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Cache-Control": isAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  if (method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(target).pipe(res);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`booking-web: :${PORT}, dist=${DIST_DIR}, data=${DATA_DIR}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
