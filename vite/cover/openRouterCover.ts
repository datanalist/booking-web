/** Единая причина изменения: отклонённый ключ OpenRouter не маскируется общей ошибкой обложки. */
import { withDeadline } from "../payments/withDeadline.ts";
import { sniffImage, type CoverMediaType, MAX_COVER_IMAGE_BYTES } from "./imageBytes.ts";

export const COVER_MODEL = "bytedance-seed/seedream-5-0-flash";
const OPENROUTER_IMAGES = "https://openrouter.ai/api/v1/images";
const OPENROUTER_TIMEOUT_MS = 55_000;

export const COVER_NOT_CONFIGURED = "Генерация обложки не настроена. Задайте OPENROUTER_API_KEY в окружении сервера.";
export const COVER_KEY_REJECTED = "Ключ OPENROUTER_API_KEY отклонён. Создайте новый ключ OpenRouter.";
export const COVER_NO_CREDIT = "На счёте OpenRouter недостаточно средств для генерации обложки.";

const PROMPT = [
  "Keep this exact interior photograph: the same room, furniture, windows, plants and lighting.",
  "Improve clarity slightly if needed.",
  "Do not add people, objects, borders, logos, watermarks, captions, letters, numbers or any other text.",
  "Leave the upper-left of the frame visually clear.",
].join(" ");

export class CoverFlowError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CoverFlowError";
    this.status = status;
  }
}

export async function enhanceCoverPhoto(
  photo: Buffer,
  mediaType: CoverMediaType,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<{ bytes: Buffer; mediaType: CoverMediaType }> {
  let response: Response;
  try {
    response = await withDeadline(OPENROUTER_TIMEOUT_MS, (signal) => fetchImpl(OPENROUTER_IMAGES, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: COVER_MODEL,
        prompt: PROMPT,
        n: 1,
        resolution: "1K",
        aspect_ratio: "auto",
        input_references: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType};base64,${photo.toString("base64")}` },
          },
        ],
      }),
      redirect: "error",
      signal,
    }));
  } catch {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }

  const text = await response.text();
  if (!response.ok) {
    throw coverProviderFailure(response.status);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }
  if (!isRecord(payload) || !Array.isArray(payload.data) || !isRecord(payload.data[0])) {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }
  const encoded = payload.data[0].b64_json;
  if (typeof encoded !== "string" || encoded.length === 0) {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length === 0 || bytes.length > MAX_COVER_IMAGE_BYTES) {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }
  const sniffed = sniffImage(bytes);
  if (sniffed === null) {
    throw new CoverFlowError(502, "Не удалось сгенерировать обложку");
  }
  return { bytes, mediaType: sniffed };
}

function coverProviderFailure(status: number): CoverFlowError {
  if (status === 401 || status === 403) {
    return new CoverFlowError(502, COVER_KEY_REJECTED);
  }
  if (status === 402) {
    return new CoverFlowError(502, COVER_NO_CREDIT);
  }
  return new CoverFlowError(502, "Не удалось сгенерировать обложку");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
