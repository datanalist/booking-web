/** Единая причина изменения: проверка байтов фото обложки без скачивания чужих ссылок. */

export type CoverMediaType = "image/jpeg" | "image/png" | "image/webp";

export const MAX_COVER_IMAGE_BYTES = 8_000_000;

export function sniffImage(buffer: Buffer): CoverMediaType | null {
  if (buffer.length < 12) {
    return null;
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export function imageSize(buffer: Buffer): { width: number; height: number } | null {
  const kind = sniffImage(buffer);
  if (kind === "image/png") {
    return pngSize(buffer);
  }
  if (kind === "image/jpeg") {
    return jpegSize(buffer);
  }
  if (kind === "image/webp") {
    return webpSize(buffer);
  }
  return null;
}

function pngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return sane(width, height);
}

function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return null;
    }
    const marker = buffer[offset + 1] ?? 0;
    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) {
      return null;
    }
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return sane(width, height);
    }
    offset += 2 + length;
  }
  return null;
}

function webpSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) {
    return null;
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return sane(1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3));
  }
  if (chunk === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return sane(buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff);
  }
  if (chunk === "VP8L" && buffer[20] === 0x2f) {
    const b1 = buffer[21] ?? 0;
    const b2 = buffer[22] ?? 0;
    const b3 = buffer[23] ?? 0;
    const b4 = buffer[24] ?? 0;
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return sane(width, height);
  }
  return null;
}

function sane(width: number, height: number): { width: number; height: number } | null {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return null;
  }
  if (width < 1 || height < 1 || width > 8000 || height > 8000) {
    return null;
  }
  return { width, height };
}
