/** Единая причина изменения: хук обложки пускает только свою сессию и не отдаёт ключ модели. */
/** @vitest-environment node */
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { imageSize } from "./cover/imageBytes.ts";
import { COVER_KEY_REJECTED, COVER_NOT_CONFIGURED } from "./cover/openRouterCover.ts";
import { createGenerateCoverMiddleware, type GenerateCoverEnv } from "./generateCoverMiddleware.ts";

const USER = "user00000000001";
const OTHER = "user20000000002";
const API_KEY = "openrouter-test-key-do-not-leak";
const USER_TOKEN = "pb-user-token-do-not-forward";
const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const PNG = Buffer.from(PNG_B64, "base64");

const env: GenerateCoverEnv = {
  apiKey: API_KEY,
  pbUrl: "https://pb.test",
  dataDir: "",
};

type Call = { url: string; auth: string; body: string };

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

test("пустой ключ отвечает 503 и не зовёт OpenRouter", async () => {
  const seen = await listen(undefined, path.join(tmpdir(), "cover-empty"), { apiKey: "" });
  try {
    const response = await post(seen.base, { imageBase64: PNG_B64, title: "Студия" }, USER_TOKEN);
    expect(response.status).toBe(503);
    expect(response.text).toContain(COVER_NOT_CONFIGURED);
    expect(response.text).not.toContain(API_KEY);
    expect(seen.calls.some((call) => call.url.includes("openrouter.ai"))).toBe(false);
  } finally {
    await seen.close();
  }
});

test("отклонённый ключ не подменяется общей ошибкой и не попадает в ответ", async () => {
  const seen = await listen(async (url) => {
    if (url.startsWith("https://openrouter.ai/")) {
      return json(401, { error: { message: API_KEY } });
    }
    return null;
  });
  try {
    const response = await post(seen.base, { imageBase64: PNG_B64, title: "Студия" }, USER_TOKEN);
    expect(response.status).toBe(502);
    expect(response.text).toContain(COVER_KEY_REJECTED);
    expect(response.text).not.toContain(API_KEY);
  } finally {
    await seen.close();
  }
});

test("без токена отвечает 401 и не зовёт OpenRouter", async () => {
  const seen = await listen();
  try {
    const response = await post(seen.base, { title: "Студия" }, null);
    expect(response.status).toBe(401);
    expect(response.text).not.toContain(API_KEY);
    expect(seen.calls.some((call) => call.url.includes("openrouter.ai"))).toBe(false);
    expect(seen.calls).toHaveLength(0);
  } finally {
    await seen.close();
  }
});

test("чужой токен не доходит до OpenRouter", async () => {
  const seen = await listen();
  try {
    const response = await post(seen.base, { imageBase64: PNG_B64, title: "Студия" }, "someone-else");
    expect(response.status).toBe(401);
    expect(response.text).not.toContain(API_KEY);
    expect(seen.calls.some((call) => call.url.includes("openrouter.ai"))).toBe(false);
    expect(seen.calls.every((call) => call.url.startsWith("https://pb.test/"))).toBe(true);
  } finally {
    await seen.close();
  }
});

test("отказывает чужому URL и не скачивает его", async () => {
  const seen = await listen();
  try {
    const response = await post(seen.base, {
      imageUrl: "https://evil.test/secret.jpg",
      photo: "https://169.254.169.254/latest/meta-data",
      title: "Студия",
    }, USER_TOKEN);
    expect(response.status).toBe(400);
    expect(response.text).toContain("ссылке");
    expect(response.text).not.toContain(API_KEY);
    expect(seen.calls.some((call) => /evil|169\.254/.test(call.url))).toBe(false);
    expect(seen.calls.some((call) => call.url.includes("openrouter.ai"))).toBe(false);
  } finally {
    await seen.close();
  }
});

test("чужое объявление не скачивается и не уходит в модель", async () => {
  const seen = await listen();
  try {
    const response = await post(seen.base, {
      listingId: "bbb123def456789",
      photo: "cover.jpg",
      title: "Студия",
    }, USER_TOKEN);
    expect(response.status).toBe(403);
    expect(seen.calls.some((call) => call.url.includes("/api/files/"))).toBe(false);
    expect(seen.calls.some((call) => call.url.includes("openrouter.ai"))).toBe(false);
  } finally {
    await seen.close();
  }
});

test("успешный путь возвращает картинку, точные плашки и не светит ключ", async () => {
  const seen = await listen();
  try {
    const response = await post(seen.base, {
      imageBase64: PNG_B64,
      title: "Студия рядом с центром",
      address: "",
      priceNight: 3000,
      maxGuests: 1,
      hasKitchen: false,
    }, USER_TOKEN);
    expect(response.status).toBe(200);
    expect(response.text).not.toContain(API_KEY);
    expect(response.text).not.toContain(USER_TOKEN);
    const body = response.json as {
      imageBase64: string;
      mediaType: string;
      lines: Array<{ text: string; role: string }>;
    };
    expect(body.mediaType).toBe("image/png");
    const bytes = Buffer.from(body.imageBase64, "base64");
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(imageSize(bytes)).toEqual({ width: 1, height: 1 });
    expect(body.lines.map((line) => line.text)).toEqual([
      "СТУДИЯ РЯДОМ С ЦЕНТРОМ",
      "ДО 3000₽/СУТКИ",
      "ДЛЯ 1 ГОСТЯ",
    ]);
    expect(body.lines.some((line) => line.text.includes("КУХН"))).toBe(false);
    const model = seen.calls.find((call) => call.url.includes("openrouter.ai"));
    expect(model?.auth).toBe(`Bearer ${API_KEY}`);
    expect(model?.auth).not.toContain(USER_TOKEN);
    const sent = JSON.parse(model?.body ?? "{}") as { model?: string; prompt?: string; input_references?: Array<{ image_url?: { url?: string } }> };
    expect(sent.model).toBe("bytedance-seed/seedream-5-0-flash");
    expect(sent.prompt ?? "").not.toContain("3000");
    expect(sent.prompt ?? "").not.toContain("ТВЕРСКАЯ");
    expect(sent.input_references?.[0]?.image_url?.url?.startsWith("data:image/png;base64,")).toBe(true);
  } finally {
    await seen.close();
  }
});

test("ошибка модели не возвращает ключ", async () => {
  const seen = await listen(async (url) => {
    if (url.includes("openrouter.ai")) {
      return new Response(JSON.stringify({ error: API_KEY }), { status: 500 });
    }
    return null;
  });
  try {
    const errors: string[] = [];
    const spy = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map((item) => String(item)).join(" "));
    };
    try {
      const response = await post(seen.base, { imageBase64: PNG_B64, title: "Студия" }, USER_TOKEN);
      expect(response.status).toBe(502);
      expect(response.text).not.toContain(API_KEY);
      expect(errors.join("\n")).not.toContain(API_KEY);
    } finally {
      console.error = spy;
    }
  } finally {
    await seen.close();
  }
});

test("локальный файл читается из data, путь наружу отвергается", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "cover-"));
  dirs.push(dir);
  const name = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png";
  await writeFile(path.join(dir, name), PNG);
  const seen = await listen(undefined, dir);
  try {
    const ok = await post(seen.base, { photo: name, title: "Дом", maxGuests: 5, hasKitchen: true }, USER_TOKEN);
    expect(ok.status).toBe(200);
    const lines = (ok.json as { lines: Array<{ text: string }> }).lines.map((line) => line.text);
    expect(lines).toContain("ДОМ");
    expect(lines).toContain("ДЛЯ 5 ГОСТЕЙ");
    expect(lines).toContain("ЕСТЬ КУХНЯ");
    const blocked = await post(seen.base, { photo: "../.env.local", title: "Дом" }, USER_TOKEN);
    expect(blocked.status).toBe(400);
    expect(seen.calls.some((call) => call.url.includes(".env"))).toBe(false);
  } finally {
    await seen.close();
  }
});

async function listen(
  extra?: (url: string, init?: RequestInit) => Promise<Response | null>,
  dataDir = path.join(tmpdir(), "cover-empty"),
  envOverride: Partial<GenerateCoverEnv> = {},
) {
  const calls: Call[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      auth: headers.get("Authorization") ?? "",
      body: typeof init?.body === "string" ? init.body : "",
    });
    if (/evil\.test|169\.254/.test(url)) {
      throw new Error("ssrf");
    }
    const overridden = extra === undefined ? null : await extra(url, init);
    if (overridden !== null) {
      return overridden;
    }
    if (url.endsWith("/auth-refresh")) {
      if ((headers.get("Authorization") ?? "") !== `Bearer ${USER_TOKEN}`) {
        return json(401, { message: "unauthorized" });
      }
      return json(200, { token: USER_TOKEN, record: { id: USER } });
    }
    if (url.includes("/api/collections/listings/records/")) {
      const host = url.includes("bbb123def456789") ? OTHER : USER;
      return json(200, { id: "abc123def456789", host, photos: ["cover.jpg"] });
    }
    if (url.includes("/api/files/listings/")) {
      return new Response(PNG, { status: 200, headers: { "Content-Type": "image/png" } });
    }
    if (url.startsWith("https://openrouter.ai/")) {
      expect(headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
      return json(200, { data: [{ b64_json: PNG_B64, media_type: "image/png" }] });
    }
    return json(500, { message: "unexpected" });
  };
  const middleware = createGenerateCoverMiddleware({
    env: { ...env, dataDir, ...envOverride },
    fetchImpl,
  });
  const server = createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("fallback");
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return {
    base: `http://127.0.0.1:${port}`,
    calls,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    }),
  };
}

async function post(base: string, body: unknown, token: string | null) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${base}/api/vallome/generate-cover`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let jsonBody: unknown = null;
  try {
    jsonBody = JSON.parse(text) as unknown;
  } catch {
    jsonBody = null;
  }
  return { status: response.status, text, json: jsonBody };
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
