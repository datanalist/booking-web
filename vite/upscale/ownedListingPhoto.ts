/** Единая причина изменения: файл объявления скачивается только у вызвавшего хозяина. */
import { UpscaleFlowError } from "./upscaleFlowError.ts";

const PB_TIMEOUT_MS = 15_000;
const FILE_LIMIT = 4 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameOrigin(url: URL, root: URL): void {
  if (url.origin !== root.origin) {
    throw new UpscaleFlowError(400, "Некорректное фото");
  }
}

export async function authenticateUser(
  pbUrl: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const root = new URL(pbUrl);
  const url = new URL("/api/collections/users/auth-refresh", root);
  sameOrigin(url, root);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    });
  } catch {
    throw new UpscaleFlowError(502, "Не удалось проверить сессию");
  }
  if (response.status === 401 || response.status === 403) {
    throw new UpscaleFlowError(401, "Войдите в аккаунт");
  }
  const text = await response.text();
  if (response.status !== 200) {
    throw new UpscaleFlowError(502, "Не удалось проверить сессию");
  }
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    throw new UpscaleFlowError(502, "Не удалось проверить сессию");
  }
  if (!isRecord(body) || !isRecord(body.record) || typeof body.record.id !== "string" || body.record.id.length === 0) {
    throw new UpscaleFlowError(502, "Не удалось проверить сессию");
  }
  return body.record.id;
}

export async function loadOwnedListingPhoto(
  pbUrl: string,
  userId: string,
  token: string,
  recordId: string,
  filename: string,
  fetchImpl: typeof fetch,
): Promise<Buffer> {
  const root = new URL(pbUrl);
  const recordUrl = new URL(`/api/collections/listings/records/${recordId}`, root);
  sameOrigin(recordUrl, root);
  let recordResponse: Response;
  try {
    recordResponse = await fetchImpl(recordUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "error",
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    });
  } catch {
    throw new UpscaleFlowError(502, "Не удалось прочитать объявление");
  }
  if (recordResponse.status === 401 || recordResponse.status === 403 || recordResponse.status === 404) {
    throw new UpscaleFlowError(404, "Фото не найдено");
  }
  if (recordResponse.status !== 200) {
    throw new UpscaleFlowError(502, "Не удалось прочитать объявление");
  }
  let record: unknown;
  try {
    record = JSON.parse(await recordResponse.text()) as unknown;
  } catch {
    throw new UpscaleFlowError(502, "Не удалось прочитать объявление");
  }
  if (!isRecord(record) || hostId(record) !== userId || !ownsFilename(record.photos, filename)) {
    throw new UpscaleFlowError(404, "Фото не найдено");
  }
  const fileUrl = new URL(
    `/api/files/listings/${recordId}/${encodeURIComponent(filename)}`,
    root,
  );
  sameOrigin(fileUrl, root);
  let fileResponse: Response;
  try {
    fileResponse = await fetchImpl(fileUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    });
  } catch {
    throw new UpscaleFlowError(404, "Фото не найдено");
  }
  if (!fileResponse.ok) {
    throw new UpscaleFlowError(404, "Фото не найдено");
  }
  const bytes = Buffer.from(await fileResponse.arrayBuffer());
  if (bytes.length > FILE_LIMIT) {
    throw new UpscaleFlowError(413, "Изображение слишком большое");
  }
  return bytes;
}

function hostId(record: Record<string, unknown>): string {
  const host = record.host;
  if (typeof host === "string") {
    return host;
  }
  if (isRecord(host) && typeof host.id === "string") {
    return host.id;
  }
  return "";
}

function ownsFilename(photos: unknown, filename: string): boolean {
  return Array.isArray(photos) && photos.some((item) => item === filename);
}
