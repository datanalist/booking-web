/** Единая причина изменения: пустой ключ OpenRouter называется в ответе апскейла. */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import { readRequestBody } from "./readRequestBody.ts";
import { assertRaster, MAX_BODY_BYTES } from "./upscale/imageBytes.ts";
import { authenticateUser, loadOwnedListingPhoto } from "./upscale/ownedListingPhoto.ts";
import { UPSCALE_NOT_CONFIGURED, upscaleWithOpenRouter } from "./upscale/openRouterUpscale.ts";
import { parseUpscaleBody } from "./upscale/parseUpscaleBody.ts";
import { UpscaleFlowError } from "./upscale/upscaleFlowError.ts";

const DEFAULT_PB_URL = "https://pb.booking.vallome.ru";
const PATH = "/api/vallome/upscale-photo";

export type UpscaleEnv = {
  openRouterApiKey: string;
  pbUrl: string;
};

export type UpscaleMiddlewareOptions = {
  env?: UpscaleEnv;
  fetchImpl?: typeof fetch;
};

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim() ?? "";
    if (trimmed !== "") {
      return trimmed;
    }
  }
  return "";
}

export function readUpscaleEnv(source: NodeJS.ProcessEnv = process.env): UpscaleEnv {
  return {
    openRouterApiKey: source.OPENROUTER_API_KEY?.trim() ?? "",
    pbUrl: firstNonEmpty(source.VITE_POCKETBASE_URL, source.POCKETBASE_URL, DEFAULT_PB_URL).replace(/\/+$/, ""),
  };
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (first !== undefined && first.trim() !== "") {
      return first.trim();
    }
  }
  return undefined;
}

function bearer(req: IncomingMessage): string | null {
  const value = header(req, "authorization");
  if (value === undefined) {
    return null;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(value);
  const token = match?.[1] ?? "";
  if (token.length === 0 || token.length > 8192) {
    return null;
  }
  return token;
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function redact(text: string, secret: string): string {
  if (secret.length < 4) {
    return text;
  }
  return text.split(secret).join("[secret]");
}

export function createUpscalePhotoMiddleware(
  options: UpscaleMiddlewareOptions = {},
): Connect.NextHandleFunction {
  const env = options.env ?? readUpscaleEnv();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  return (req, res, next) => {
    void handle(req, res, next).catch((error: unknown) => {
      if (res.headersSent) {
        return;
      }
      if (error instanceof UpscaleFlowError) {
        sendJson(res, error.status, { message: error.message });
        return;
      }
      const raw = error instanceof Error ? error.message : "error";
      console.error(`upscale: ${redact(raw, env.openRouterApiKey).slice(0, 200)}`);
      sendJson(res, 500, { message: "Не удалось улучшить фото" });
    });
  };

  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== PATH) {
      next();
      return;
    }
    if ((req.method ?? "GET") !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { message: "Метод не поддерживается" });
      return;
    }
    const token = bearer(req);
    if (token === null) {
      throw new UpscaleFlowError(401, "Войдите в аккаунт");
    }
    if (env.pbUrl.trim() === "") {
      throw new UpscaleFlowError(503, "Сервер не подключён к PocketBase");
    }
    const userId = await authenticateUser(env.pbUrl, token, fetchImpl);
    if (env.openRouterApiKey.trim() === "") {
      throw new UpscaleFlowError(503, UPSCALE_NOT_CONFIGURED);
    }
    const contentType = header(req, "content-type");
    if (contentType === undefined) {
      throw new UpscaleFlowError(415, "Можно отправить только изображение");
    }
    const read = await readRequestBody(req, MAX_BODY_BYTES);
    if (!read.ok) {
      throw new UpscaleFlowError(413, "Слишком большой запрос");
    }
    const source = parseUpscaleBody(contentType, read.buffer);
    const bytes = source.kind === "bytes"
      ? source.bytes
      : await loadOwnedListingPhoto(
        env.pbUrl,
        userId,
        token,
        source.recordId,
        source.filename,
        fetchImpl,
      );
    const raster = assertRaster(bytes);
    const result = await upscaleWithOpenRouter(
      bytes,
      raster.mediaType,
      env.openRouterApiKey,
      fetchImpl,
    );
    const image = `data:${result.mediaType};base64,${result.bytes.toString("base64")}`;
    sendJson(res, 200, { image });
  }
}
