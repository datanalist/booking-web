/** Единая причина изменения: фото обложки читается локально или из своего объявления, не по произвольному URL. */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { isStoredPhotoFileName } from "../isStoredPhotoFileName.ts";
import { withDeadline } from "../payments/withDeadline.ts";
import { CoverFlowError } from "./openRouterCover.ts";
import { MAX_COVER_IMAGE_BYTES, sniffImage, type CoverMediaType } from "./imageBytes.ts";

const PB_TIMEOUT_MS = 15_000;
const LISTING_ID = /^[a-z0-9]{15}$/;

export type CoverSourceBody = {
  imageBase64?: string;
  photo?: string;
  listingId?: string;
};

export async function loadCoverPhoto(
  body: CoverSourceBody,
  options: {
    pbUrl: string;
    dataDir: string;
    userId: string;
    userToken: string;
    fetchImpl: typeof fetch;
  },
): Promise<{ bytes: Buffer; mediaType: CoverMediaType }> {
  if (typeof body.imageBase64 === "string" && body.imageBase64.trim().length > 0) {
    return decodeImage(body.imageBase64);
  }
  const photo = typeof body.photo === "string" ? body.photo.trim() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (photo.length === 0) {
    throw new CoverFlowError(400, "Нет фото обложки");
  }
  if (isRemoteUrl(photo) || isRemoteUrl(listingId)) {
    throw new CoverFlowError(400, "Нельзя скачивать обложку по ссылке");
  }
  if (listingId.length === 0) {
    if (!isStoredPhotoFileName(photo)) {
      throw new CoverFlowError(400, "Некорректное фото");
    }
    return readLocalPhoto(options.dataDir, photo);
  }
  if (!LISTING_ID.test(listingId) || !isSafeFileName(photo)) {
    throw new CoverFlowError(400, "Некорректное фото");
  }
  return readOwnedListingPhoto(options, listingId, photo);
}

export function assertNoRemoteImageSource(body: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") {
      continue;
    }
    const lower = key.toLowerCase();
    if (lower.includes("url") || lower === "src" || lower === "href" || lower === "image") {
      throw new CoverFlowError(400, "Нельзя скачивать обложку по ссылке");
    }
    if ((lower === "photo" || lower === "listingid" || lower === "imagebase64") && isRemoteUrl(value)) {
      throw new CoverFlowError(400, "Нельзя скачивать обложку по ссылке");
    }
  }
}

function isRemoteUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("//")) {
    return true;
  }
  if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(trimmed)) {
    return false;
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function isSafeFileName(value: string): boolean {
  if (value.length < 1 || value.length > 180) {
    return false;
  }
  if (value.includes("..") || /[\\/:]/.test(value) || value.includes("%")) {
    return false;
  }
  return /^[\w.\- ()\u0400-\u04FF]+$/u.test(value);
}

function decodeImage(value: string): { bytes: Buffer; mediaType: CoverMediaType } {
  const dataUrl = /^data:image\/(?:jpeg|png|webp);base64,([a-z0-9+/=\r\n]+)$/i.exec(value.trim());
  const payload = (dataUrl?.[1] ?? value.trim()).replace(/\s/g, "");
  if (!/^[a-z0-9+/=]+$/i.test(payload)) {
    throw new CoverFlowError(400, "Некорректное фото");
  }
  const bytes = Buffer.from(payload, "base64");
  return checked(bytes);
}

async function readLocalPhoto(
  dataDir: string,
  fileName: string,
): Promise<{ bytes: Buffer; mediaType: CoverMediaType }> {
  const root = path.resolve(dataDir);
  const filePath = path.resolve(root, fileName);
  if (filePath !== path.join(root, fileName)) {
    throw new CoverFlowError(400, "Некорректное фото");
  }
  let size = 0;
  try {
    size = (await stat(filePath)).size;
  } catch {
    throw new CoverFlowError(404, "Фото не найдено");
  }
  if (size <= 0 || size > MAX_COVER_IMAGE_BYTES) {
    throw new CoverFlowError(413, "Фото слишком большое");
  }
  return checked(await readFile(filePath));
}

async function readOwnedListingPhoto(
  options: {
    pbUrl: string;
    userId: string;
    userToken: string;
    fetchImpl: typeof fetch;
  },
  listingId: string,
  fileName: string,
): Promise<{ bytes: Buffer; mediaType: CoverMediaType }> {
  const record = await pbJson(
    options.fetchImpl,
    `${options.pbUrl}/api/collections/listings/records/${listingId}`,
    options.userToken,
  );
  if (record.status === 404) {
    throw new CoverFlowError(404, "Объявление не найдено");
  }
  if (record.status === 401 || record.status === 403) {
    throw new CoverFlowError(403, "Обложка недоступна");
  }
  if (record.status !== 200 || !isRecord(record.body)) {
    throw new CoverFlowError(502, "Не удалось прочитать объявление");
  }
  const host = typeof record.body.host === "string" ? record.body.host : "";
  if (host !== options.userId) {
    throw new CoverFlowError(403, "Обложка недоступна");
  }
  const photos = Array.isArray(record.body.photos) ? record.body.photos : [];
  if (!photos.some((item) => item === fileName)) {
    throw new CoverFlowError(404, "Фото не найдено");
  }
  const fileUrl = `${options.pbUrl}/api/files/listings/${listingId}/${encodeURIComponent(fileName)}`;
  const parsed = new URL(fileUrl);
  if (parsed.origin !== new URL(options.pbUrl).origin) {
    throw new CoverFlowError(400, "Нельзя скачивать обложку по ссылке");
  }
  const bytes = await pbBytes(options.fetchImpl, fileUrl, options.userToken);
  return checked(bytes);
}

async function pbJson(
  fetchImpl: typeof fetch,
  url: string,
  token: string,
): Promise<{ status: number; body: unknown }> {
  let response: Response;
  try {
    response = await withDeadline(PB_TIMEOUT_MS, (signal) => fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      redirect: "error",
      signal,
    }));
  } catch {
    throw new CoverFlowError(502, "Не удалось связаться с PocketBase");
  }
  const text = await response.text();
  if (text.trim().length === 0) {
    return { status: response.status, body: null };
  }
  try {
    return { status: response.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, body: null };
  }
}

async function pbBytes(fetchImpl: typeof fetch, url: string, token: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await withDeadline(PB_TIMEOUT_MS, (signal) => fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/octet-stream", Authorization: `Bearer ${token}` },
      redirect: "error",
      signal,
    }));
  } catch {
    throw new CoverFlowError(502, "Не удалось прочитать фото");
  }
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    throw new CoverFlowError(404, "Фото не найдено");
  }
  if (!response.ok) {
    throw new CoverFlowError(502, "Не удалось прочитать фото");
  }
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_COVER_IMAGE_BYTES) {
    throw new CoverFlowError(413, "Фото слишком большое");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_COVER_IMAGE_BYTES) {
    throw new CoverFlowError(413, "Фото слишком большое");
  }
  return bytes;
}

function checked(bytes: Buffer): { bytes: Buffer; mediaType: CoverMediaType } {
  if (bytes.length === 0 || bytes.length > MAX_COVER_IMAGE_BYTES) {
    throw new CoverFlowError(413, "Фото слишком большое");
  }
  const mediaType = sniffImage(bytes);
  if (mediaType === null) {
    throw new CoverFlowError(400, "Некорректное фото");
  }
  return { bytes, mediaType };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
