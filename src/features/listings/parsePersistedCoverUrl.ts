import { isDataUrl } from "./isDataUrl";

/** Лёгкий URL обложки из Storage: путь/http, не data-URL. */
export function parsePersistedCoverUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || isDataUrl(trimmed)) {
    return undefined;
  }
  return trimmed;
}
