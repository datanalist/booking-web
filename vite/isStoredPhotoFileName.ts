/** Имя файла в ./data: только uuid + допустимое расширение (защита от path traversal). */
const STORED_PHOTO_FILE_NAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export type StoredPhotoFileName = string & {
  readonly __brand: "StoredPhotoFileName";
};

export function isStoredPhotoFileName(
  value: string,
): value is StoredPhotoFileName {
  return STORED_PHOTO_FILE_NAME_RE.test(value);
}
