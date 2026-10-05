import type { StoredPhotoExt } from "./extensionForImageContentType.ts";

const EXT_TO_CONTENT_TYPE: Readonly<Record<StoredPhotoExt, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Content-Type для отдачи файла из ./data по расширению. */
export function contentTypeForStoredPhotoExt(ext: StoredPhotoExt): string {
  return EXT_TO_CONTENT_TYPE[ext];
}
