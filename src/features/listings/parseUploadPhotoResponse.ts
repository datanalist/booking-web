import { parsePhotoUrl, type PhotoUrl } from "./PhotoUrl";

export type UploadPhotoResponse = {
  url: PhotoUrl;
};

/** Разбирает JSON-ответ POST /api/files на границе. */
export function parseUploadPhotoResponse(
  value: unknown,
): UploadPhotoResponse | null {
  if (value === null || typeof value !== "object") {
    return null;
  }
  if (!("url" in value)) {
    return null;
  }
  const url = parsePhotoUrl(value.url);
  if (url === null) {
    return null;
  }
  return { url };
}
