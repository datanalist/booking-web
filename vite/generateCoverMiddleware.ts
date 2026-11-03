/** Единая причина изменения: хук генерации обложки проверяет сессию PocketBase и не отдаёт ключ OpenRouter. */
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Connect } from "vite";
import { readRequestBody } from "./readRequestBody.ts";
import { coverBadgeLines, type CoverBadgeLine, type CoverCardInput } from "./cover/coverBadgeLines.ts";
import { assertNoRemoteImageSource, loadCoverPhoto } from "./cover/loadCoverImage.ts";
import { CoverFlowError, enhanceCoverPhoto } from "./cover/openRouterCover.ts";
import { withDeadline } from "./payments/withDeadline.ts";

const DEFAULT_PB_URL = "https://pb.booking.vallome.ru";
const BODY_LIMIT = 12_000_000;
const PB_TIMEOUT_MS = 15_000;
const TEXT_MAX = 500;

export type GenerateCoverEnv = {
  apiKey: string;
  pbUrl: string;
  dataDir: string;
};

export type GenerateCoverMiddlewareOptions = {
  env?: GenerateCoverEnv;
  fetchImpl?: typeof fetch;
};

export function readGenerateCoverEnv(
  source: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): GenerateCoverEnv {
  const pbUrl = firstNonEmpty(source.VITE_POCKETBASE_URL, source.POCKETBASE_URL, DEFAULT_PB_URL).replace(/\/+$/, "");
  return {
    apiKey: source.OPENROUTER_API_KEY?.trim() ?? "",
    pbUrl,
    dataDir: path.resolve(cwd, "data"),
  };
}

/** POST /api/vallome/generate-cover. Ключ OpenRouter остаётся в процессе. */
export function createGenerateCoverMiddleware(
  options: GenerateCoverMiddlewareOptions = {},
): Connect.NextHandleFunction {
  const env = options.env ?? readGenerateCoverEnv();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  return (req, res, next) => {
    void handle(req, res, next).catch((error: unknown) => {
      if (res.headersSent) {
        return;
      }
      if (error instanceof CoverFlowError) {
        sendJson(res, error.status, { message: error.message });
        return;
      }
      logSafe(error, env.apiKey);
      sendJson(res, 500, { message: "Не удалось сгенерировать обложку" });
    });
  };

  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/api/vallome/generate-cover") {
      next();
      return;
    }
    if ((req.method ?? "GET") !== "POST") {
      res.statusCode = 405;
      res.setHeader("Allow", "POST");
      res.end();
      return;
    }
    const token = bearer(req);
    if (token === null) {
      sendJson(res, 401, { message: "Войдите в аккаунт" });
      return;
    }
    const userId = await authUser(env.pbUrl, token, fetchImpl);
    const body = await readJson(req);
    assertNoRemoteImageSource(body);
    if (env.apiKey.length === 0) {
      throw new CoverFlowError(503, "Генерация обложки не настроена");
    }
    const card = readCard(body);
    const lines = coverBadgeLines(card);
    const photo = await loadCoverPhoto(
      {
        imageBase64: typeof body.imageBase64 === "string" ? body.imageBase64 : undefined,
        photo: typeof body.photo === "string" ? body.photo : undefined,
        listingId: typeof body.listingId === "string" ? body.listingId : undefined,
      },
      {
        pbUrl: env.pbUrl,
        dataDir: env.dataDir,
        userId,
        userToken: token,
        fetchImpl,
      },
    );
    const enhanced = await enhanceCoverPhoto(photo.bytes, photo.mediaType, env.apiKey, fetchImpl);
    sendJson(res, 200, {
      imageBase64: enhanced.bytes.toString("base64"),
      mediaType: enhanced.mediaType,
      lines,
    });
  }
}

async function authUser(pbUrl: string, token: string, fetchImpl: typeof fetch): Promise<string> {
  let response: Response;
  try {
    response = await withDeadline(PB_TIMEOUT_MS, (signal) => fetchImpl(
      `${pbUrl}/api/collections/users/auth-refresh`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        redirect: "error",
        signal,
      },
    ));
  } catch {
    throw new CoverFlowError(502, "Не удалось проверить сессию");
  }
  if (response.status === 401 || response.status === 403) {
    throw new CoverFlowError(401, "Войдите в аккаунт");
  }
  const text = await response.text();
  let payload: unknown = null;
  if (text.trim().length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  if (response.status !== 200 || !isRecord(payload) || !isRecord(payload.record)) {
    throw new CoverFlowError(502, "Не удалось проверить сессию");
  }
  const id = payload.record.id;
  if (typeof id !== "string" || id.length === 0 || id.length > 80 || /[\\/]/.test(id)) {
    throw new CoverFlowError(401, "Войдите в аккаунт");
  }
  return id;
}

function readCard(body: Record<string, unknown>): CoverCardInput {
  return {
    title: readText(body.title),
    address: readText(body.address),
    priceNight: readNumber(body.priceNight),
    maxGuests: readNumber(body.maxGuests),
    hasKitchen: readKitchen(body.hasKitchen),
  };
}

function readText(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  if (value.length > TEXT_MAX) {
    throw new CoverFlowError(400, "Слишком длинное поле обложки");
  }
  return value;
}

function readNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  return value;
}

function readKitchen(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  return value;
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const type = header(req, "content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  const read = await readRequestBody(req, BODY_LIMIT);
  if (!read.ok) {
    throw new CoverFlowError(413, "Слишком большой запрос");
  }
  if (read.buffer.length === 0) {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(read.buffer.toString("utf8")) as unknown;
  } catch {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  if (!isRecord(payload)) {
    throw new CoverFlowError(400, "Некорректный запрос");
  }
  return payload;
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

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown> | { message: string; imageBase64?: string; mediaType?: string; lines?: CoverBadgeLine[] }): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function logSafe(error: unknown, apiKey: string): void {
  const raw = error instanceof Error ? error.message : "error";
  const text = apiKey.length > 3 ? raw.split(apiKey).join("[secret]") : raw;
  console.error(`generate-cover: ${text.slice(0, 300)}`);
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim() ?? "";
    if (trimmed !== "") {
      return trimmed;
    }
  }
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
