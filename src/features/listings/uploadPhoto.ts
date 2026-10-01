import type { PhotoUrl } from "./PhotoUrl";
import { parseUploadPhotoResponse } from "./parseUploadPhotoResponse";

export class PhotoUploadError extends Error {
  readonly code: "UPLOAD_FAILED" | "INVALID_RESPONSE";

  constructor(code: "UPLOAD_FAILED" | "INVALID_RESPONSE", message: string) {
    super(message);
    this.name = "PhotoUploadError";
    this.code = code;
  }
}

/**
 * Загружает сжатое изображение (Blob) на POST /api/files.
 * Content-Type берётся из blob.type.
 */
export async function uploadPhoto(file: Blob): Promise<PhotoUrl> {
  const contentType =
    file.type.trim().length > 0 ? file.type : "image/jpeg";

  const response = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!response.ok) {
    throw new PhotoUploadError(
      "UPLOAD_FAILED",
      `Upload failed with status ${response.status}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new PhotoUploadError("INVALID_RESPONSE", "Response is not JSON");
  }

  const parsed = parseUploadPhotoResponse(json);
  if (parsed === null) {
    throw new PhotoUploadError("INVALID_RESPONSE", "Invalid upload response");
  }

  return parsed.url;
}
