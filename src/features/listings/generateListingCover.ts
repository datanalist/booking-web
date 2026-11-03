/** Единая причина изменения: клиент просит обложку у своего хука и впечатывает плашки в кадр. */
import { readPbToken } from "../../api/pocketbase/pbSession";
import { uploadPhoto } from "./uploadPhoto";
import { bakeCoverImage, type CoverPaintLine } from "./paintCoverBadges";

const REQUEST_TIMEOUT_MS = 70_000;

export type GenerateListingCoverInput = {
  coverUrl: string;
  title: string;
  address: string;
  priceNight: number;
  maxGuests: number;
  hasKitchen: boolean;
};

export async function generateListingCover(input: GenerateListingCoverInput): Promise<string> {
  const token = readPbToken(localStorage);
  if (token === null) {
    throw new Error("Войдите в аккаунт");
  }
  const source = await coverSource(input.coverUrl);
  const response = await fetch("/api/vallome/generate-cover", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      address: input.address,
      priceNight: input.priceNight,
      maxGuests: input.maxGuests,
      hasKitchen: input.hasKitchen,
      ...source,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await readBody(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload, "Не удалось сгенерировать обложку"));
  }
  const image = readImage(payload);
  const lines = readLines(payload);
  const baked = await bakeCoverImage(image, lines);
  return uploadPhoto(baked);
}

async function coverSource(coverUrl: string): Promise<Record<string, string>> {
  const local = /^\/data\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp))$/i.exec(coverUrl);
  if (local?.[1] !== undefined) {
    return { photo: local[1] };
  }
  const listing = /\/api\/files\/listings\/([a-z0-9]{15})\/([^/?#]+)$/i.exec(coverUrl);
  if (listing?.[1] !== undefined && listing[2] !== undefined) {
    let filename = listing[2];
    try {
      filename = decodeURIComponent(listing[2]);
    } catch {
      throw new Error("Не удалось прочитать фото");
    }
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      throw new Error("Не удалось прочитать фото");
    }
    return { listingId: listing[1], photo: filename };
  }
  const response = await fetch(coverUrl);
  if (!response.ok) {
    throw new Error("Не удалось прочитать фото");
  }
  const blob = await response.blob();
  if (blob.size <= 0 || blob.size > 8_000_000) {
    throw new Error("Фото слишком большое");
  }
  return {
    imageBase64: await blobToBase64(blob),
    mediaType: blob.type.trim().length > 0 ? blob.type : "image/jpeg",
  };
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function readImage(payload: unknown): Blob {
  if (!isRecord(payload) || typeof payload.imageBase64 !== "string" || typeof payload.mediaType !== "string") {
    throw new Error("Не удалось сгенерировать обложку");
  }
  if (payload.mediaType !== "image/jpeg" && payload.mediaType !== "image/png" && payload.mediaType !== "image/webp") {
    throw new Error("Не удалось сгенерировать обложку");
  }
  const binary = atob(payload.imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: payload.mediaType });
}

function readLines(payload: unknown): CoverPaintLine[] {
  if (!isRecord(payload) || !Array.isArray(payload.lines)) {
    throw new Error("Не удалось сгенерировать обложку");
  }
  const lines: CoverPaintLine[] = [];
  for (const item of payload.lines) {
    if (!isRecord(item) || (item.role !== "title" && item.role !== "detail") || typeof item.text !== "string") {
      continue;
    }
    const text = item.text.trim();
    if (text.length === 0 || text.length > 240) {
      continue;
    }
    lines.push({ text, role: item.role });
    if (lines.length === 5) {
      break;
    }
  }
  return lines;
}

function messageFrom(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim() !== "") {
    return payload.message;
  }
  return fallback;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать фото"));
    reader.readAsDataURL(blob);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
