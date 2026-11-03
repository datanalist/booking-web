/** Единая причина изменения: проверка типа, размера и числа пикселей перед апскейлом. */
import { UpscaleFlowError } from "./upscaleFlowError.ts";

export type RasterMediaType = "image/jpeg" | "image/png" | "image/webp";

export const MAX_BODY_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
export const MAX_PIXELS = 12_000_000;
export const MAX_EDGE = 8_000;

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

export function sniffRaster(bytes: Buffer): RasterMediaType | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIG)) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12
    && bytes.toString("ascii", 0, 4) === "RIFF"
    && bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function assertRaster(bytes: Buffer): { mediaType: RasterMediaType; width: number; height: number } {
  if (bytes.length === 0) {
    throw new UpscaleFlowError(400, "Пустое изображение");
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new UpscaleFlowError(413, "Изображение слишком большое");
  }
  const mediaType = sniffRaster(bytes);
  if (mediaType === null) {
    throw new UpscaleFlowError(415, "Можно отправить только JPEG, PNG или WebP");
  }
  const size = imageSize(bytes, mediaType);
  if (size === null) {
    throw new UpscaleFlowError(400, "Не удалось прочитать изображение");
  }
  if (size.width > MAX_EDGE || size.height > MAX_EDGE || size.width * size.height > MAX_PIXELS) {
    throw new UpscaleFlowError(413, "Слишком много пикселей");
  }
  return { mediaType, width: size.width, height: size.height };
}

export function assertOutputRaster(bytes: Buffer): RasterMediaType {
  if (bytes.length === 0 || bytes.length > MAX_OUTPUT_BYTES) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  const mediaType = sniffRaster(bytes);
  if (mediaType === null || imageSize(bytes, mediaType) === null) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  return mediaType;
}

function imageSize(bytes: Buffer, mediaType: RasterMediaType): { width: number; height: number } | null {
  if (mediaType === "image/png") {
    return pngSize(bytes);
  }
  if (mediaType === "image/jpeg") {
    return jpegSize(bytes);
  }
  return webpSize(bytes);
}

function pngSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes.toString("ascii", 12, 16) !== "IHDR") {
    return null;
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width === 0 || height === 0) {
    return null;
  }
  return { width, height };
}

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= bytes.length) {
      return null;
    }
    const marker = bytes[offset] ?? 0;
    offset += 1;
    if (marker === 0xd9) {
      return null;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      continue;
    }
    if (offset + 1 >= bytes.length) {
      return null;
    }
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      return null;
    }
    if (SOF.has(marker)) {
      if (length < 7) {
        return null;
      }
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      if (width === 0 || height === 0) {
        return null;
      }
      return { width, height };
    }
    offset += length;
  }
  return null;
}

function webpSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 30) {
    return null;
  }
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    const width = 1 + bytes.readUIntLE(24, 3);
    const height = 1 + bytes.readUIntLE(27, 3);
    return positive(width, height);
  }
  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null;
    }
    return positive(bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff);
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) {
      return null;
    }
    const bits = bytes.readUInt32LE(21);
    return positive((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
  }
  return null;
}

function positive(width: number, height: number): { width: number; height: number } | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}
