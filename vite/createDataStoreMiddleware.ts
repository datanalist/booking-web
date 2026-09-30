import type { Connect } from "vite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { handleDeleteFile } from "./handleDeleteFile.ts";
import { handleGetFile } from "./handleGetFile.ts";
import { handlePostFile } from "./handlePostFile.ts";

export type DataStoreMiddlewareOptions = {
  /** Каталог хранения; по умолчанию ./data от cwd. */
  dataDir?: string;
  /** Лимит тела POST в байтах (по умолчанию 10 МБ). */
  maxBytes?: number;
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Connect-middleware: POST/DELETE /api/files и GET /data/:name.
 * dataDir задаётся явно в тестах (временная папка).
 */
export function createDataStoreMiddleware(
  options: DataStoreMiddlewareOptions = {},
): Connect.NextHandleFunction {
  const dataDir = path.resolve(options.dataDir ?? path.join(process.cwd(), "data"));
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  mkdirSync(dataDir, { recursive: true });

  return (req, res, next) => {
    void (async () => {
      const method = req.method ?? "GET";
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const pathname = url.pathname;

      if (method === "POST" && pathname === "/api/files") {
        await handlePostFile(req, res, { dataDir, maxBytes });
        return;
      }

      const deleteMatch = /^\/api\/files\/([^/]+)$/.exec(pathname);
      if (method === "DELETE" && deleteMatch !== null) {
        const name = deleteMatch[1];
        if (name === undefined) {
          next();
          return;
        }
        await handleDeleteFile(decodeURIComponent(name), dataDir, res);
        return;
      }

      const getMatch = /^\/data\/([^/]+)$/.exec(pathname);
      if (method === "GET" && getMatch !== null) {
        const name = getMatch[1];
        if (name === undefined) {
          next();
          return;
        }
        await handleGetFile(decodeURIComponent(name), dataDir, res);
        return;
      }

      next();
    })().catch(next);
  };
}
