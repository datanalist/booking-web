import { buildPbFileUrl, resolvePocketBaseUrl } from "./pbClient";

const LISTINGS_COLLECTION = "listings";
const REMOTE_PHOTO = /^(https?:|data:|blob:)/i;

export function photosFromPb(
  photos: readonly string[],
  recordId: string,
  baseUrl?: string,
): string[] {
  const root = resolvePocketBaseUrl(baseUrl);
  const urls: string[] = [];
  for (const photo of photos) {
    const trimmed = photo.trim();
    if (trimmed.length === 0) {
      continue;
    }
    urls.push(
      REMOTE_PHOTO.test(trimmed)
        ? trimmed
        : buildPbFileUrl(root, LISTINGS_COLLECTION, recordId, trimmed),
    );
  }
  return urls;
}

export function photosToPb(photos: readonly string[]): string[] | undefined {
  const names: string[] = [];
  for (const photo of photos) {
    const name = filenameOf(photo);
    if (name !== null && !names.includes(name)) {
      names.push(name);
    }
  }
  return names.length > 0 ? names : undefined;
}

function filenameOf(photo: string): string | null {
  const trimmed = photo.trim();
  if (trimmed.length === 0 || /^(data:|blob:)/i.test(trimmed)) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return filenameFromUrl(trimmed);
  }
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return null;
  }
  return trimmed;
}

function filenameFromUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const parts = url.pathname.split("/").filter((part) => part.length > 0);
  const filesIndex = parts.indexOf("files");
  if (filesIndex < 0 || parts.length < filesIndex + 4) {
    return null;
  }
  const filename = parts[parts.length - 1];
  if (filename === undefined) {
    return null;
  }
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}
