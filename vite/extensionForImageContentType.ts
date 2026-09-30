/** Допустимые Content-Type загружаемых фото → расширение файла. */
const CONTENT_TYPE_TO_EXT: Readonly<Record<string, "jpg" | "png" | "webp">> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type StoredPhotoExt = "jpg" | "png" | "webp";

export function extensionForImageContentType(
  contentType: string,
): StoredPhotoExt | null {
  const normalized = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return CONTENT_TYPE_TO_EXT[normalized] ?? null;
}
