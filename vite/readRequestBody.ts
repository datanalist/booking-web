import type { IncomingMessage } from "node:http";

export type ReadRequestBodyResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; reason: "too_large" };

/** Читает тело запроса с лимитом размера; при превышении дочитывает и возвращает too_large. */
export async function readRequestBody(
  req: IncomingMessage,
  maxBytes: number,
): Promise<ReadRequestBodyResult> {
  const chunks: Buffer[] = [];
  let total = 0;
  let overflow = false;

  for await (const chunk of req) {
    if (overflow) {
      continue;
    }
    const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += piece.length;
    if (total > maxBytes) {
      overflow = true;
      chunks.length = 0;
      continue;
    }
    chunks.push(piece);
  }

  if (overflow) {
    return { ok: false, reason: "too_large" };
  }

  return { ok: true, buffer: Buffer.concat(chunks) };
}
