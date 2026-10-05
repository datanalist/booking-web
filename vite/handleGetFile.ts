import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { contentTypeForStoredPhotoExt } from "./contentTypeForStoredPhotoExt.ts";
import {
  isStoredPhotoFileName,
  type StoredPhotoFileName,
} from "./isStoredPhotoFileName.ts";
import type { StoredPhotoExt } from "./extensionForImageContentType.ts";

function extOf(fileName: StoredPhotoFileName): StoredPhotoExt {
  if (fileName.endsWith(".png")) {
    return "png";
  }
  if (fileName.endsWith(".webp")) {
    return "webp";
  }
  return "jpg";
}

/** GET /data/:name — отдаёт файл из dataDir с корректным Content-Type. */
export async function handleGetFile(
  fileName: string,
  dataDir: string,
  res: ServerResponse,
): Promise<void> {
  if (!isStoredPhotoFileName(fileName)) {
    res.statusCode = 400;
    res.end("Bad Request");
    return;
  }

  const filePath = path.join(dataDir, fileName);
  try {
    await access(filePath);
  } catch {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeForStoredPhotoExt(extOf(fileName)));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  createReadStream(filePath).pipe(res);
}
