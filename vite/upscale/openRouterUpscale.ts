/** Единая причина изменения: пустой и отклонённый ключ OpenRouter дают разные ответы. */
import { assertOutputRaster, type RasterMediaType } from "./imageBytes.ts";
import { UpscaleFlowError } from "./upscaleFlowError.ts";

export const UPSCALE_MODEL = "bytedance-seed/seedream-5-0-flash";
const OPENROUTER_IMAGES = "https://openrouter.ai/api/v1/images";
const MAX_RESPONSE_CHARS = 12_000_000;

export const UPSCALE_NOT_CONFIGURED = "Улучшение фото не настроено. Задайте OPENROUTER_API_KEY в окружении сервера.";
export const UPSCALE_KEY_REJECTED = "Ключ OPENROUTER_API_KEY отклонён. Создайте новый ключ OpenRouter.";
export const UPSCALE_BLOCKED = "OpenRouter закрыл доступ с адреса сервера (регион или политика безопасности). Нужен выход через прокси.";
export const UPSCALE_NO_CREDIT = "На счёте OpenRouter недостаточно средств для улучшения фото.";

const UPSCALE_PROMPT = [
  "Increase the resolution of the reference photo.",
  "Preserve the exact composition, objects, lighting, and framing.",
  "Do not add text, captions, borders, frames, watermarks, or any new objects.",
].join(" ");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function upscaleWithOpenRouter(
  bytes: Buffer,
  mediaType: RasterMediaType,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<{ bytes: Buffer; mediaType: RasterMediaType }> {
  const key = apiKey.trim();
  if (key === "") {
    throw new UpscaleFlowError(503, UPSCALE_NOT_CONFIGURED);
  }
  const endpoint = new URL(OPENROUTER_IMAGES);
  if (endpoint.origin !== "https://openrouter.ai") {
    throw new UpscaleFlowError(500, "Не удалось улучшить фото");
  }
  const dataUrl = `data:${mediaType};base64,${bytes.toString("base64")}`;
  if (!dataUrl.startsWith("data:image/")) {
    throw new UpscaleFlowError(400, "Можно отправить только изображение");
  }
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: UPSCALE_MODEL,
        prompt: UPSCALE_PROMPT,
        resolution: "2K",
        aspect_ratio: "auto",
        n: 1,
        input_references: [
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      }),
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  const text = await response.text();
  if (!response.ok) {
    throw providerFailure(response.status);
  }
  if (text.length === 0 || text.length > MAX_RESPONSE_CHARS) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  const encoded = readB64(parsed);
  const output = Buffer.from(encoded, "base64");
  return { bytes: output, mediaType: assertOutputRaster(output) };
}

function providerFailure(status: number): UpscaleFlowError {
  if (status === 401) {
    return new UpscaleFlowError(502, UPSCALE_KEY_REJECTED);
  }
  if (status === 403) {
    return new UpscaleFlowError(502, UPSCALE_BLOCKED);
  }
  if (status === 402) {
    return new UpscaleFlowError(502, UPSCALE_NO_CREDIT);
  }
  return new UpscaleFlowError(502, "Не удалось улучшить фото");
}

function readB64(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.data) || value.data.length === 0) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  const first = value.data[0];
  if (!isRecord(first) || typeof first.b64_json !== "string" || first.b64_json.length === 0) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(first.b64_json)) {
    throw new UpscaleFlowError(502, "Не удалось улучшить фото");
  }
  return first.b64_json;
}
