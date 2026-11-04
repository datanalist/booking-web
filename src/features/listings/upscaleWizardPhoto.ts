/** Единая причина изменения: имя переменной ключа доходит до экрана, сам ключ — нет. */
import { readPbToken } from "../../api/pocketbase/pbSession";
import { resolvePocketBaseUrl } from "../../api/pocketbase/pbClient";
import { uploadPhoto } from "./uploadPhoto";

const UPSCALE_PATH = "/api/vallome/upscale-photo";
const LOCAL_PHOTO = /^\/data\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const PB_FILE = /\/api\/files\/listings\/([a-z0-9]{15})\/([^/?#]+)$/;
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(?:jpe?g|png|webp)$/;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export class UpscalePhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpscalePhotoError";
  }
}

type PocketBaseRef = { recordId: string; filename: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function upscaleWizardPhoto(
  previewUrl: string,
  token: string | null = readPbToken(localStorage),
): Promise<string> {
  if (token === null || token.trim() === "") {
    throw new UpscalePhotoError("Войдите в аккаунт");
  }
  const response = await fetch(UPSCALE_PATH, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await requestBody(previewUrl)),
  });
  let payload: unknown = null;
  try {
    payload = await response.json() as unknown;
  } catch {
    payload = null;
  }
  if (response.status === 401) {
    throw new UpscalePhotoError("Войдите в аккаунт");
  }
  if (!response.ok) {
    throw new UpscalePhotoError(safeMessage(payload) ?? "Не удалось улучшить фото. Исходное фото сохранено.");
  }
  const dataUrl = imageFromPayload(payload);
  try {
    return await uploadPhoto(dataUrlToBlob(dataUrl));
  } catch {
    throw new UpscalePhotoError("Не удалось сохранить улучшенное фото. Исходное фото сохранено.");
  }
}

async function requestBody(previewUrl: string): Promise<{ image: string } | { pocketbase: PocketBaseRef }> {
  const pocketbase = listingFileRef(previewUrl);
  if (pocketbase !== null) {
    return { pocketbase };
  }
  if (DATA_URL.test(previewUrl.trim())) {
    return { image: previewUrl.trim() };
  }
  if (!LOCAL_PHOTO.test(previewUrl) && !previewUrl.startsWith("blob:")) {
    throw new UpscalePhotoError("Не удалось прочитать фото");
  }
  const loaded = await fetch(previewUrl);
  if (!loaded.ok) {
    throw new UpscalePhotoError("Не удалось прочитать фото");
  }
  const blob = await loaded.blob();
  const type = blob.type === "image/png" || blob.type === "image/webp" ? blob.type : "image/jpeg";
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { image: `data:${type};base64,${bytesToBase64(bytes)}` };
}

function listingFileRef(previewUrl: string): PocketBaseRef | null {
  let pathname = previewUrl;
  if (/^[a-z][a-z0-9+.-]*:/i.test(previewUrl)) {
    if (!/^https?:/i.test(previewUrl)) {
      return null;
    }
    let url: URL;
    try {
      url = new URL(previewUrl);
    } catch {
      return null;
    }
    let allowed: URL;
    try {
      allowed = new URL(resolvePocketBaseUrl());
    } catch {
      return null;
    }
    if (url.origin !== allowed.origin) {
      return null;
    }
    pathname = url.pathname;
  } else if (!previewUrl.startsWith("/")) {
    return null;
  }
  const match = PB_FILE.exec(pathname);
  const recordId = match?.[1] ?? "";
  const rawName = match?.[2] ?? "";
  if (recordId === "" || rawName === "") {
    return null;
  }
  let filename = rawName;
  try {
    filename = decodeURIComponent(rawName);
  } catch {
    return null;
  }
  if (!FILE_NAME.test(filename)) {
    return null;
  }
  return { recordId, filename };
}

function imageFromPayload(payload: unknown): string {
  if (!isRecord(payload) || typeof payload.image !== "string" || !DATA_URL.test(payload.image)) {
    throw new UpscalePhotoError("Не удалось улучшить фото. Исходное фото сохранено.");
  }
  return payload.image;
}

function safeMessage(payload: unknown): string | null {
  if (!isRecord(payload) || typeof payload.message !== "string") {
    return null;
  }
  const message = payload.message.trim();
  if (message.length === 0 || message.length > 200) {
    return null;
  }
  if (/sk-|bearer\s+\S|eyJ[A-Za-z0-9_-]{10,}/i.test(message)) {
    return null;
  }
  return message;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = DATA_URL.exec(dataUrl);
  if (match === null) {
    throw new UpscalePhotoError("Не удалось улучшить фото. Исходное фото сохранено.");
  }
  const binary = atob(match[2] ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: match[1] });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    binary += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return btoa(binary);
}
