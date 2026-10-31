/** @vitest-environment node */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { expect, test } from "vitest";
import { createPaymentsMiddleware, type PaymentsEnv } from "./paymentsMiddleware.ts";

const USER = "user00000000001";
const OTHER = "user20000000002";
const env: PaymentsEnv = {
  shopId: "shop",
  secretKey: "super-secret-key",
  pbUrl: "https://pb.test",
  pbAdmin: "admin@test",
  pbPassword: "pb-pass",
};

type Pay = {
  id: string;
  user: string;
  amount: number;
  status: string;
  credited: boolean;
  yookassa_payment_id: string;
  idempotence_key: string;
};

function world() {
  const state = {
    balance: 0,
    payments: [] as Pay[],
    credits: 0,
    userPatches: 0,
    yookassa: [] as Array<{ method: string; headers: Headers; body: unknown }>,
    remoteStatus: "pending",
    metadataUser: USER,
    hook: false,
  };

  async function fetchImpl(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const auth = headers.get("Authorization") ?? "";
    const json = (status: number, payload: unknown) =>
      new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

    if (url.origin === "https://api.yookassa.ru") {
      state.yookassa.push({ method, headers, body });
      if (method === "POST") {
        return json(200, {
          id: "yk-payment-1",
          status: "pending",
          confirmation: { type: "redirect", confirmation_url: "https://yoomoney.ru/checkout/payments/v2/contract?orderId=1" },
        });
      }
      const created = state.yookassa.find((call) => call.method === "POST")?.body;
      const payload = created !== undefined && typeof created === "object" && created !== null
        ? created as { amount?: unknown; metadata?: { user_id?: string; amount?: string; payment_id?: string } }
        : {};
      const metadata = { ...(payload.metadata ?? {}) };
      metadata.user_id = state.metadataUser;
      return json(200, {
        id: "yk-payment-1",
        status: state.remoteStatus,
        amount: payload.amount,
        metadata,
      });
    }

    if (url.pathname.endsWith("/auth-with-password")) {
      return json(200, { token: "admin-token" });
    }
    if (url.pathname.endsWith("/auth-refresh")) {
      if (auth === "Bearer user-2") {
        return json(200, { token: "user-2", record: { id: OTHER } });
      }
      if (auth !== "Bearer user-token") {
        return json(401, { message: "unauthorized" });
      }
      return json(200, { token: "user-token", record: { id: USER } });
    }
    if (url.pathname === "/api/collections/payments" || url.pathname === "/api/collections/payment_credits") {
      return json(200, { id: url.pathname.endsWith("payments") ? "colpay000000001" : "colcred00000001" });
    }
    if (method === "POST" && url.pathname === "/api/collections/payments/records") {
      const record = body as { user: string; amount: number; idempotence_key: string };
      const row: Pay = {
        id: "pay000000000001",
        user: record.user,
        amount: record.amount,
        status: "pending",
        credited: false,
        yookassa_payment_id: "",
        idempotence_key: record.idempotence_key,
      };
      state.payments.push(row);
      return json(200, row);
    }
    const paymentMatch = /^\/api\/collections\/payments\/records\/([^/]+)$/.exec(url.pathname);
    if (paymentMatch !== null) {
      const row = state.payments.find((item) => item.id === paymentMatch[1]);
      if (row === undefined) {
        return json(404, { message: "not found" });
      }
      if (method === "PATCH" && body !== undefined && typeof body === "object") {
        Object.assign(row, body);
      }
      return json(200, row);
    }
    if (method === "GET" && url.pathname === "/api/collections/payments/records") {
      const filter = url.searchParams.get("filter") ?? "";
      const row = state.payments.find((item) => filter.includes(item.yookassa_payment_id) && item.yookassa_payment_id !== "");
      return json(200, { items: row === undefined ? [] : [row] });
    }
    if (method === "POST" && url.pathname === "/api/collections/payment_credits/records") {
      const row = state.payments[0];
      if (state.credits > 0 || row?.credited) {
        return json(400, { message: "Failed to create record.", data: { payment: { code: "validation_not_unique" } } });
      }
      state.credits += 1;
      if (state.hook && row !== undefined) {
        row.credited = true;
        row.status = "succeeded";
        state.balance += row.amount;
      }
      return json(200, { id: "cr0000000000001", applied: state.hook });
    }
    const userMatch = /^\/api\/collections\/users\/records\/([^/]+)$/.exec(url.pathname);
    if (userMatch !== null && method === "GET") {
      return json(200, { id: userMatch[1], balance: state.balance });
    }
    if (userMatch !== null && method === "PATCH") {
      const patch = body as { balance?: number };
      state.balance = patch.balance ?? state.balance;
      state.userPatches += 1;
      return json(200, { id: userMatch[1], balance: state.balance });
    }
    return json(500, { message: `unexpected ${method} ${url.pathname}` });
  }

  return { state, fetchImpl };
}

async function listen(envOverride: PaymentsEnv = env, fetchImpl?: typeof fetch) {
  const box = world();
  const middleware = createPaymentsMiddleware({
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
    state: box.state,
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function post(base: string, path: string, body: unknown, token?: string): Promise<{ status: number; text: string; json: unknown }> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token !== undefined) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await response.text();
  return { status: response.status, text, json: JSON.parse(text) as unknown };
}

test("без токена платёж не создаётся", async () => {
  const server = await listen();
  try {
    const response = await post(server.base, "/api/payments", { amount: 10 });
    expect(response.status).toBe(401);
    expect(response.text).not.toContain("super-secret-key");
    expect(response.text).not.toContain("at ");
    expect(server.state.payments).toHaveLength(0);
    expect(server.state.yookassa).toHaveLength(0);
  } finally {
    await server.close();
  }
});

test("пустые ключи дают понятную ошибку и не меняют баланс", async () => {
  const server = await listen({ ...env, shopId: "", secretKey: "" });
  try {
    const response = await post(server.base, "/api/payments", { amount: 10, userId: "hacker" }, "user-token");
    expect(response.status).toBe(503);
    expect(response.json).toEqual({ message: "Платёжная система не настроена" });
    expect(response.text).not.toContain("stack");
    expect(server.state.balance).toBe(0);
    expect(server.state.yookassa).toHaveLength(0);
  } finally {
    await server.close();
  }
});

test("создание уходит в ЮKassa от имени сессии, а не поля userId", async () => {
  const server = await listen();
  try {
    const response = await post(server.base, "/api/payments", { amount: 10, userId: "hacker" }, "user-token");
    expect(response.status).toBe(200);
    expect(response.json).toMatchObject({
      paymentId: "pay000000000001",
      confirmationUrl: "https://yoomoney.ru/checkout/payments/v2/contract?orderId=1",
    });
    expect(server.state.payments[0]?.user).toBe(USER);
    const call = server.state.yookassa[0];
    expect(call?.method).toBe("POST");
    expect(call?.headers.get("Idempotence-Key")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(Buffer.from((call?.headers.get("Authorization") ?? "").slice(6), "base64").toString("utf8"))
      .toBe("shop:super-secret-key");
    expect(call?.body).toMatchObject({
      amount: { value: "10.00", currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect" },
      description: "Пополнение баланса",
      metadata: { user_id: USER, amount: "10.00", payment_id: "pay000000000001" },
    });
    expect(server.state.balance).toBe(0);
  } finally {
    await server.close();
  }
});

test("пока ЮKassa не подтвердила succeeded, баланс не меняется", async () => {
  const server = await listen();
  try {
    await post(server.base, "/api/payments", { amount: 10 }, "user-token");
    const pending = await post(server.base, "/api/payments/confirm", { paymentId: "pay000000000001" }, "user-token");
    expect(pending.json).toMatchObject({ status: "pending" });
    expect(server.state.balance).toBe(0);
    expect(server.state.userPatches).toBe(0);

    server.state.remoteStatus = "canceled";
    const canceled = await post(server.base, "/api/payments/confirm", { paymentId: "pay000000000001" }, "user-token");
    expect(canceled.json).toMatchObject({ status: "canceled" });
    expect(server.state.balance).toBe(0);
  } finally {
    await server.close();
  }
});

test("succeeded зачисляет один раз, чужой платёж и ложный webhook — нет", async () => {
  const server = await listen();
  try {
    await post(server.base, "/api/payments", { amount: 10 }, "user-token");
    const foreign = await post(server.base, "/api/payments/confirm", { paymentId: "pay000000000001" }, "user-2");
    expect(foreign.status).toBe(404);
    expect(server.state.balance).toBe(0);

    const lied = await fetch(`${server.base}/api/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "185.71.76.10" },
      body: JSON.stringify({
        event: "payment.succeeded",
        object: { id: "yk-payment-1", status: "succeeded", amount: { value: "10.00", currency: "RUB" } },
      }),
    });
    expect(lied.status).toBe(200);
    expect(server.state.balance).toBe(0);

    server.state.remoteStatus = "succeeded";
    const credited = await post(server.base, "/api/payments/confirm", { paymentId: "pay000000000001" }, "user-token");
    expect(credited.json).toMatchObject({ status: "succeeded", balance: 10 });
    const again = await post(server.base, "/api/payments/confirm", { paymentId: "pay000000000001" }, "user-token");
    expect(again.json).toMatchObject({ status: "already", balance: 10 });
    expect(server.state.balance).toBe(10);
    expect(server.state.userPatches).toBe(1);
  } finally {
    await server.close();
  }
});

test("webhook не с адреса ЮKassa отклоняется и баланс не трогает", async () => {
  const server = await listen();
  try {
    await post(server.base, "/api/payments", { amount: 10 }, "user-token");
    server.state.remoteStatus = "succeeded";
    const response = await fetch(`${server.base}/api/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "payment.succeeded", object: { id: "yk-payment-1" } }),
    });
    expect(response.status).toBe(403);
    expect(server.state.balance).toBe(0);
    expect(server.state.userPatches).toBe(0);
  } finally {
    await server.close();
  }
});

test("ошибка ЮKassa не становится 500 со стеком", async () => {
  const server = await listen(env, async (input, init) => {
    const url = String(input);
    if (url.includes("auth-refresh")) {
      return new Response(JSON.stringify({ token: "user-token", record: { id: USER } }), { status: 200 });
    }
    if (url.includes("api.yookassa.ru")) {
      return new Response(JSON.stringify({ description: "authentication failed super-secret-key" }), { status: 401 });
    }
    if (url.includes("auth-with-password")) {
      return new Response(JSON.stringify({ token: "admin-token" }), { status: 200 });
    }
    if (url.endsWith("/api/collections/payments") || url.endsWith("/api/collections/payment_credits")) {
      return new Response(JSON.stringify({ id: "colpay000000001" }), { status: 200 });
    }
    if (init?.method === "POST" && url.endsWith("/api/collections/payments/records")) {
      return new Response(JSON.stringify({
        id: "pay000000000001",
        user: USER,
        amount: 10,
        status: "pending",
        credited: false,
        yookassa_payment_id: "",
      }), { status: 200 });
    }
    if (init?.method === "PATCH") {
      return new Response(JSON.stringify({ id: "pay000000000001", status: "canceled" }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: url }), { status: 500 });
  });
  try {
    const response = await post(server.base, "/api/payments", { amount: 10 }, "user-token");
    expect(response.status).toBe(502);
    expect(response.json).toEqual({ message: "ЮKassa отклонила ключи магазина" });
    expect(response.text).not.toContain("super-secret-key");
    expect(response.text).not.toContain("\n");
  } finally {
    await server.close();
  }
});
