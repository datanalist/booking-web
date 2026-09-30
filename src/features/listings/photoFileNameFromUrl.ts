/** Имя файла из PhotoUrl (`/data/name` → `name`). */
import type { PhotoUrl } from "./PhotoUrl";

export function photoFileNameFromUrl(url: PhotoUrl): string {
  return url.slice("/data/".length);
}
