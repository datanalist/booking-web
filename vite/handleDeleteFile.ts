import { unlink } from "node:fs/promises";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { isStoredPhotoFileName } from "./isStoredPhotoFileName.ts";

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, string>,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/** DELETE /api/files/:name — удаляет файл из dataDir. */
export async function handleDeleteFile(
  fileName: string,
  dataDir: string,
  res: ServerResponse,
): Promise<void> {
  if (!isStoredPhotoFileName(fileName)) {
    sendJson(res, 400, { error: "invalid_name" });
    return;
  }

  const filePath = path.join(dataDir, fileName);
  try {
    await unlink(filePath);
  } catch {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  sendJson(res, 200, { ok: "true" });
}
