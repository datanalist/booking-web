import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extensionForImageContentType } from "./extensionForImageContentType.ts";
import { readRequestBody } from "./readRequestBody.ts";

export type HandlePostFileOptions = {
  dataDir: string;
  maxBytes: number;
};

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, string>,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/** POST /api/files — сохраняет бинарное изображение в dataDir. */
export async function handlePostFile(
  req: IncomingMessage,
  res: ServerResponse,
  options: HandlePostFileOptions,
): Promise<void> {
  const contentTypeHeader = req.headers["content-type"];
  if (typeof contentTypeHeader !== "string") {
    sendJson(res, 415, { error: "unsupported_media_type" });
    return;
  }

  const ext = extensionForImageContentType(contentTypeHeader);
  if (ext === null) {
    sendJson(res, 415, { error: "unsupported_media_type" });
    return;
  }

  const body = await readRequestBody(req, options.maxBytes);
  if (!body.ok) {
    sendJson(res, 413, { error: "payload_too_large" });
    return;
  }

  if (body.buffer.length === 0) {
    sendJson(res, 400, { error: "empty_body" });
    return;
  }

  await mkdir(options.dataDir, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = path.join(options.dataDir, fileName);
  await writeFile(filePath, body.buffer);

  sendJson(res, 201, { url: `/data/${fileName}` });
}
