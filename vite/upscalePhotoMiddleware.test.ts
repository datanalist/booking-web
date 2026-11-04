/** @vitest-environment node */
/** Единая причина изменения: апскейл не зовёт OpenRouter без сессии и не ходит по чужому URL. */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { expect, test } from "vitest";
import { UPSCALE_KEY_REJECTED, UPSCALE_MODEL, UPSCALE_NOT_CONFIGURED } from "./upscale/openRouterUpscale.ts";
import { createUpscalePhotoMiddleware, type UpscaleEnv } from "./upscalePhotoMiddleware.ts";

const USER = "user00000000001";
const OTHER = "user20000000002";
const LISTING = "listing00000001";
const API_KEY = "test-openrouter-key";

const env: UpscaleEnv = {
  openRouterApiKey: API_KEY,
  pbUrl: "https://pb.test",
};

function png(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    return out;
  };
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const TINY = png(8, 8);

type Call = { url: string; method: string; auth: string; body: string };

function world(options?: { host?: string; refreshStatus?: number }) {
  const calls: Call[] = [];
  const host = options?.host ?? USER;
  const refreshStatus = options?.refreshStatus ?? 200;

  async function fetchImpl(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" ? init.body : "";
    calls.push({ url, method, auth: headers.get("Authorization") ?? "", body });
    const parsed = new URL(url);
    const json = (status: number, payload: unknown) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    if (parsed.pathname.endsWith("/auth-refresh")) {
      if (refreshStatus !== 200) {
        return json(refreshStatus, { message: "expired" });
      }
      if (headers.get("Authorization") !== "Bearer user-token") {
        return json(401, { message: "unauthorized" });
      }
      return json(200, { token: "user-token", record: { id: USER } });
    }
    if (parsed.origin === "https://openrouter.ai") {
      return json(200, {
        data: [{ b64_json: TINY.toString("base64"), media_type: "image/png" }],
      });
    }
    if (parsed.pathname === `/api/collections/listings/records/${LISTING}`) {
      return json(200, { id: LISTING, host, photos: ["room.png"] });
    }
    if (parsed.pathname.startsWith("/api/files/")) {
      return new Response(TINY, { status: 200, headers: { "Content-Type": "image/png" } });
    }
    return json(500, { message: "unexpected" });
  }

  return { calls, fetchImpl };
}

async function listen(envOverride: UpscaleEnv = env, fetchImpl?: typeof fetch) {
  const box = world();
  const middleware = createUpscalePhotoMiddleware({
    env: envOverride,
    fetchImpl: fetchImpl ?? box.fetchImpl,
  });
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("fallback");
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("no port");
  }
  return {
    calls: box.calls,
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function post(
  base: string,
  body: unknown,
  token?: string,
  contentType = "application/json",
): Promise<{ status: number; text: string }> {
  const headers = new Headers({ "Content-Type": contentType });
  if (token !== undefined) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  const response = await fetch(`${base}/api/vallome/upscale-photo`, {
    method: "POST",
    headers,
    body: payload,
  });
  return { status: response.status, text: await response.text() };
}

function dataUrl(): string {
  return `data:image/png;base64,${TINY.toString("base64")}`;
}

test("без токена апскейл отвечает 401 и не зовёт OpenRouter", async () => {
  const server = await listen();
  try {
    const response = await post(server.base, { image: dataUrl() });
    expect(response.status).toBe(401);
    expect(response.text).not.toContain(API_KEY);
    expect(server.calls).toHaveLength(0);
  } finally {
    await server.close();
  }
});

test("пустой ключ отвечает 503 и не зовёт OpenRouter", async () => {
  const server = await listen({ ...env, openRouterApiKey: "" });
  try {
    const response = await post(server.base, { image: dataUrl() }, "user-token");
    expect(response.status).toBe(503);
    expect(response.text).toContain(UPSCALE_NOT_CONFIGURED);
    expect(response.text).not.toContain(API_KEY);
    expect(server.calls.map((call) => call.url).join(" ")).not.toContain("openrouter.ai");
  } finally {
    await server.close();
  }
});

test("отклонённый ключ не маскируется общей ошибкой и не светится в ответе", async () => {
  const box = world();
  const failing = createUpscalePhotoMiddleware({
    env,
    fetchImpl: async (input, init) => {
      const url = String(input);
      if (new URL(url).pathname.endsWith("/auth-refresh")) {
        return box.fetchImpl(input, init);
      }
      return new Response(JSON.stringify({ error: { message: API_KEY } }), { status: 401 });
    },
  });
  const local = createServer((req, res) => {
    failing(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise<void>((resolve) => {
    local.listen(0, "127.0.0.1", () => resolve());
  });
  const address = local.address();
  if (address === null || typeof address === "string") {
    throw new Error("no port");
  }
  try {
    const response = await post(`http://127.0.0.1:${address.port}`, { image: dataUrl() }, "user-token");
    expect(response.status).toBe(502);
    expect(response.text).toContain(UPSCALE_KEY_REJECTED);
    expect(response.text).not.toContain(API_KEY);
  } finally {
    await new Promise<void>((resolve, reject) => {
      local.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("просроченный токен не доходит до OpenRouter", async () => {
  const box = world({ refreshStatus: 401 });
  const server = await listen(env, box.fetchImpl);
  try {
    const response = await post(server.base, { image: dataUrl() }, "user-token");
    expect(response.status).toBe(401);
    expect(response.text).not.toContain(API_KEY);
    expect(server.calls.map((call) => call.url).join(" ")).not.toContain("openrouter.ai");
  } finally {
    await server.close();
  }
});

test("чужой URL не скачивается и не уходит в OpenRouter", async () => {
  const server = await listen();
  try {
    const response = await post(
      server.base,
      { image: "https://evil.example/secret.png" },
      "user-token",
    );
    expect(response.status).toBe(400);
    expect(response.text).toContain("Ссылка на чужой адрес не принимается");
    expect(response.text).not.toContain(API_KEY);
    const urls = server.calls.map((call) => call.url).join(" ");
    expect(urls).not.toContain("evil.example");
    expect(urls).not.toContain("openrouter.ai");
  } finally {
    await server.close();
  }
});

test("чужое фото объявления не скачивается", async () => {
  const box = world({ host: OTHER });
  const server = await listen(env, box.fetchImpl);
  try {
    const response = await post(
      server.base,
      { pocketbase: { recordId: LISTING, filename: "room.png" } },
      "user-token",
    );
    expect(response.status).toBe(404);
    expect(response.text).not.toContain(API_KEY);
    const urls = server.calls.map((call) => call.url).join(" ");
    expect(urls).not.toContain("/api/files/");
    expect(urls).not.toContain("openrouter.ai");
  } finally {
    await server.close();
  }
});

test("ключ не попадает в ответ, даже если OpenRouter вернул его в ошибке", async () => {
  const box = world();
  const failing = createUpscalePhotoMiddleware({
    env,
    fetchImpl: async (input, init) => {
      const url = String(input);
      if (new URL(url).pathname.endsWith("/auth-refresh")) {
        return box.fetchImpl(input, init);
      }
      return new Response(JSON.stringify({ error: API_KEY }), { status: 500 });
    },
  });
  const local = createServer((req, res) => {
    failing(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise<void>((resolve) => {
    local.listen(0, "127.0.0.1", () => resolve());
  });
  const address = local.address();
  if (address === null || typeof address === "string") {
    throw new Error("no port");
  }
  try {
    const response = await post(`http://127.0.0.1:${address.port}`, { image: dataUrl() }, "user-token");
    expect(response.status).toBe(502);
    expect(response.text).not.toContain(API_KEY);
    expect(response.text).not.toContain("openrouter");
  } finally {
    await new Promise<void>((resolve, reject) => {
      local.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("успешный путь возвращает картинку и шлёт в OpenRouter только data URL", async () => {
  const server = await listen();
  try {
    const response = await post(server.base, { image: dataUrl() }, "user-token");
    expect(response.status).toBe(200);
    const payload = JSON.parse(response.text) as { image?: string };
    expect(payload.image?.startsWith("data:image/png;base64,")).toBe(true);
    expect(response.text).not.toContain(API_KEY);
    const upstream = server.calls.find((call) => call.url.startsWith("https://openrouter.ai"));
    expect(upstream?.method).toBe("POST");
    expect(upstream?.auth).toBe(`Bearer ${API_KEY}`);
    expect(upstream?.body).toContain(UPSCALE_MODEL);
    expect(upstream?.body).toContain("data:image/png;base64,");
    expect(upstream?.body).not.toContain("https://");
  } finally {
    await server.close();
  }
});

test("multipart с картинкой тоже возвращает результат", async () => {
  const server = await listen();
  try {
    const boundary = "----upscale-bound";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      TINY,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const response = await post(
      server.base,
      body,
      "user-token",
      `multipart/form-data; boundary=${boundary}`,
    );
    expect(response.status).toBe(200);
    expect(response.text).toContain("data:image/png;base64,");
    expect(response.text).not.toContain(API_KEY);
  } finally {
    await server.close();
  }
});

test("слишком большое число пикселей не уходит в OpenRouter", async () => {
  const server = await listen();
  try {
    const response = await post(
      server.base,
      { image: `data:image/png;base64,${png(9000, 8).toString("base64")}` },
      "user-token",
    );
    expect(response.status).toBe(413);
    expect(server.calls.map((call) => call.url).join(" ")).not.toContain("openrouter.ai");
  } finally {
    await server.close();
  }
});
