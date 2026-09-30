declare const photoUrlBrand: unique symbol;

/** URL загруженного фото: только `/data/<uuid>.<ext>`. */
export type PhotoUrl = string & { readonly [photoUrlBrand]: true };

const PHOTO_URL_RE =
  /^\/data\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** Парсит строку в PhotoUrl; иначе null (parse, don't validate). */
export function parsePhotoUrl(value: unknown): PhotoUrl | null {
  if (typeof value !== "string") {
    return null;
  }
  if (!PHOTO_URL_RE.test(value)) {
    return null;
  }
  return value as PhotoUrl;
}
