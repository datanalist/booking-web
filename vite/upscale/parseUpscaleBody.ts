/** Единая причина изменения: тело апскейла — только файл, data URL или своё фото в PocketBase. */
import { MAX_IMAGE_BYTES, sniffRaster } from "./imageBytes.ts";
import { UpscaleFlowError } from "./upscaleFlowError.ts";

const RECORD_ID = /^[a-z0-9]{15}$/;
const FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(?:jpe?g|png|webp)$/;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export type UpscaleSource =
  | { kind: "bytes"; bytes: Buffer }
  | { kind: "pocketbase"; recordId: string; filename: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseUpscaleBody(contentType: string, body: Buffer): UpscaleSource {
  const type = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (type === "application/json") {
    return parseJson(body);
  }
  if (type === "multipart/form-data") {
    return { kind: "bytes", bytes: extractMultipartFile(contentType, body) };
  }
  throw new UpscaleFlowError(415, "Можно отправить только изображение");
}

function parseJson(body: Buffer): UpscaleSource {
  let value: unknown;
  try {
    value = JSON.parse(body.toString("utf8")) as unknown;
  } catch {
    throw new UpscaleFlowError(400, "Некорректный запрос");
  }
  if (!isRecord(value)) {
    throw new UpscaleFlowError(400, "Некорректный запрос");
  }
  if ("url" in value || "image_url" in value || "src" in value) {
    throw new UpscaleFlowError(400, "Ссылка на чужой адрес не принимается");
  }
  const hasImage = "image" in value;
  const hasPocketBase = "pocketbase" in value;
  if (hasImage === hasPocketBase) {
    throw new UpscaleFlowError(400, "Можно отправить только изображение");
  }
  if (hasPocketBase) {
    return parsePocketBase(value.pocketbase);
  }
  if (typeof value.image !== "string") {
    throw new UpscaleFlowError(400, "Можно отправить только изображение");
  }
  return { kind: "bytes", bytes: decodeDataUrl(value.image.trim()) };
}

function parsePocketBase(value: unknown): UpscaleSource {
  if (!isRecord(value)) {
    throw new UpscaleFlowError(400, "Некорректное фото");
  }
  if ("url" in value || "image" in value || "src" in value) {
    throw new UpscaleFlowError(400, "Ссылка на чужой адрес не принимается");
  }
  const recordId = value.recordId;
  const filename = value.filename;
  if (typeof recordId !== "string" || !RECORD_ID.test(recordId)) {
    throw new UpscaleFlowError(400, "Некорректное фото");
  }
  if (typeof filename !== "string" || !FILENAME.test(filename)) {
    throw new UpscaleFlowError(400, "Некорректное фото");
  }
  return { kind: "pocketbase", recordId, filename };
}

export function decodeDataUrl(value: string): Buffer {
  if (/^(https?:|\/\/)/i.test(value)) {
    throw new UpscaleFlowError(400, "Ссылка на чужой адрес не принимается");
  }
  const match = DATA_URL.exec(value);
  if (match === null) {
    throw new UpscaleFlowError(400, "Можно отправить только изображение");
  }
  const declared = match[1] === "jpeg" ? "image/jpeg" : match[1] === "png" ? "image/png" : "image/webp";
  const b64 = match[2] ?? "";
  if (b64.length > MAX_IMAGE_BYTES * 2) {
    throw new UpscaleFlowError(413, "Изображение слишком большое");
  }
  const bytes = Buffer.from(b64, "base64");
  const sniffed = sniffRaster(bytes);
  if (sniffed === null || sniffed !== declared) {
    throw new UpscaleFlowError(415, "Можно отправить только JPEG, PNG или WebP");
  }
  return bytes;
}

function extractMultipartFile(contentType: string, body: Buffer): Buffer {
  const match = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = (match?.[1] ?? match?.[2] ?? "").trim();
  if (boundary.length === 0 || boundary.length > 120 || /[\r\n]/.test(boundary)) {
    throw new UpscaleFlowError(400, "Некорректный запрос");
  }
  const marker = Buffer.from(`--${boundary}`);
  let cursor = body.indexOf(marker);
  if (cursor < 0) {
    throw new UpscaleFlowError(400, "Некорректный запрос");
  }
  cursor += marker.length;
  while (cursor < body.length) {
    if (body[cursor] === 45 && body[cursor + 1] === 45) {
      break;
    }
    if (body[cursor] === 13 && body[cursor + 1] === 10) {
      cursor += 2;
    }
    const next = body.indexOf(marker, cursor);
    if (next < 0) {
      break;
    }
    let part = body.subarray(cursor, next);
    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.subarray(0, part.length - 2);
    }
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd >= 0) {
      const headers = part.subarray(0, headerEnd).toString("latin1").toLowerCase();
      if (headers.includes('name="image"')) {
        return Buffer.from(part.subarray(headerEnd + 4));
      }
    }
    cursor = next + marker.length;
  }
  throw new UpscaleFlowError(400, "В запросе нет изображения");
}
