import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import { readRequestBody } from "./readRequestBody.ts";
import { PaymentFlowError } from "./payments/paymentFlowError.ts";
import { parseTopupAmount } from "./payments/parseTopupAmount.ts";
import { createPbAdmin, type PbAdmin } from "./payments/pbAdmin.ts";
import { settleStoredPayment } from "./payments/settleTopup.ts";
import { startTopup } from "./payments/startTopup.ts";
import { withUserLock } from "./payments/withUserLock.ts";
import { createYookassaClient } from "./payments/yookassaHttp.ts";
import {
  isPaymentRecordId,
  isYookassaNotificationIp,
  isYookassaPaymentId,
  notificationClientIp,
  readWebhookPaymentId,
  requestOrigin,
} from "./payments/yookassa.ts";

const DEFAULT_PB_URL = "https://pb.booking.vallome.ru";
const BODY_LIMIT = 65_536;

export type PaymentsEnv = {
  shopId: string;
  secretKey: string;
  pbUrl: string;
  pbAdmin: string;
  pbPassword: string;
};

export type PaymentsMiddlewareOptions = {
  env?: PaymentsEnv;
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

export function readPaymentsEnv(source: NodeJS.ProcessEnv = process.env): PaymentsEnv {
  return {
    shopId: source.YOOKASSA_SHOP_ID?.trim() ?? "",
    secretKey: source.YOOKASSA_SECRET_KEY?.trim() ?? "",
    pbUrl: firstNonEmpty(source.VITE_POCKETBASE_URL, source.POCKETBASE_URL, DEFAULT_PB_URL).replace(/\/+$/, ""),
    pbAdmin: source.POCKETBASE_SU?.trim() ?? "",
    pbPassword: source.POCKETBASE_SU_PASSWORD?.trim() ?? "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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

function logSafe(error: unknown, env: PaymentsEnv): void {
  const raw = error instanceof Error ? error.message : "error";
  let text = raw;
  for (const secret of [env.secretKey, env.shopId, env.pbPassword, env.pbAdmin]) {
    if (secret.length > 3) {
      text = text.split(secret).join("[secret]");
    }
  }
  console.error(`payments: ${text.slice(0, 300)}`);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const read = await readRequestBody(req, BODY_LIMIT);
  if (!read.ok) {
    throw new PaymentFlowError(413, "Слишком большой запрос");
  }
  if (read.buffer.length === 0) {
    return {};
  }
  try {
    return JSON.parse(read.buffer.toString("utf8")) as unknown;
  } catch {
    throw new PaymentFlowError(400, "Некорректный запрос");
  }
}

function settlePorts(admin: PbAdmin) {
  return {
    getPayment: (id: string) => admin.getPayment(id),
    updatePayment: (id: string, patch: { status?: "pending" | "succeeded" | "canceled"; credited?: boolean }) =>
      admin.updatePayment(id, patch),
    createCredit: (payment: Parameters<PbAdmin["createCredit"]>[0]) => admin.createCredit(payment),
    markCreditApplied: (creditId: string) => admin.markCreditApplied(creditId),
    getBalance: (userId: string) => admin.getBalance(userId),
    addBalance: (userId: string, amountRub: number) => admin.addBalance(userId, amountRub),
    withUserLock,
  };
}

async function requireUser(admin: PbAdmin, req: IncomingMessage): Promise<string> {
  const token = bearer(req);
  if (token === null) {
    throw new PaymentFlowError(401, "Войдите в аккаунт");
  }
  const userId = await admin.authUser(token);
  if (userId === null) {
    throw new PaymentFlowError(401, "Войдите в аккаунт");
  }
  return userId;
}

function resultBody(result: { status: string; message: string; balance?: number }): Record<string, unknown> {
  return {
    status: result.status,
    message: result.message,
    ...(result.balance !== undefined ? { balance: result.balance } : {}),
  };
}

/** POST /api/payments, /confirm и /webhook. Секрет ЮKassa остаётся в процессе. */
export function createPaymentsMiddleware(
  options: PaymentsMiddlewareOptions = {},
): Connect.NextHandleFunction {
  const env = options.env ?? readPaymentsEnv();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const admin = createPbAdmin(env, fetchImpl);
  const yookassa = createYookassaClient(env, fetchImpl);

  return (req, res, next) => {
    void handle(req, res, next).catch((error: unknown) => {
      if (res.headersSent) {
        return;
      }
      if (error instanceof PaymentFlowError) {
        sendJson(res, error.status, { message: error.message });
        return;
      }
      logSafe(error, env);
      sendJson(res, 500, { message: "Не удалось обработать платёж" });
    });
  };

  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const pathname = url.pathname;
    if (
      pathname !== "/api/payments"
      && pathname !== "/api/payments/confirm"
      && pathname !== "/api/payments/webhook"
    ) {
      next();
      return;
    }
    if ((req.method ?? "GET") !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { message: "Метод не поддерживается" });
      return;
    }
    if (pathname === "/api/payments") {
      await handleCreate(req, res);
      return;
    }
    if (pathname === "/api/payments/confirm") {
      await handleConfirm(req, res);
      return;
    }
    await handleWebhook(req, res);
  }

  async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = await requireUser(admin, req);
    const body = await readJson(req);
    const parsed = parseTopupAmount(isRecord(body) ? body.amount : undefined);
    if (!parsed.ok) {
      throw new PaymentFlowError(400, parsed.message);
    }
    if (env.shopId === "" || env.secretKey === "") {
      throw new PaymentFlowError(503, "Платёжная система не настроена");
    }
    await admin.ensureSchema();
    const origin = requestOrigin(
      header(req, "origin"),
      header(req, "x-forwarded-host") ?? header(req, "host"),
      header(req, "x-forwarded-proto"),
    );
    const created = await startTopup({
      createPayment: (input) => admin.createPayment(input),
      saveYookassa: (id, yookassaPaymentId) => admin.updatePayment(id, { yookassaPaymentId }),
      cancelPayment: async (id) => {
        await admin.updatePayment(id, { status: "canceled" });
      },
      createRemote: (input) => yookassa.createPayment(input),
    }, {
      userId,
      amountRub: parsed.rubles,
      origin,
    });
    sendJson(res, 200, created);
  }

  async function handleConfirm(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = await requireUser(admin, req);
    const body = await readJson(req);
    const paymentId = isRecord(body) && typeof body.paymentId === "string" ? body.paymentId : "";
    if (!isPaymentRecordId(paymentId)) {
      throw new PaymentFlowError(400, "Некорректный платёж");
    }
    await admin.ensureSchema();
    const stored = await admin.getPayment(paymentId);
    if (stored === null || stored.userId !== userId) {
      throw new PaymentFlowError(404, "Платёж не найден");
    }
    if (!isYookassaPaymentId(stored.yookassaPaymentId)) {
      sendJson(res, 200, { status: "pending", message: "Платёж ещё не подтверждён" });
      return;
    }
    const remote = await yookassa.getPayment(stored.yookassaPaymentId);
    const result = await settleStoredPayment(settlePorts(admin), stored, remote);
    sendJson(res, result.status === "rejected" ? 409 : 200, resultBody(result));
  }

  async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ip = notificationClientIp(req.socket.remoteAddress, header(req, "x-forwarded-for"));
    if (!isYookassaNotificationIp(ip)) {
      throw new PaymentFlowError(403, "Источник уведомления не подтверждён");
    }
    const body = await readJson(req);
    const event = readWebhookPaymentId(body);
    if (event.kind === "invalid") {
      throw new PaymentFlowError(400, "Некорректное уведомление");
    }
    if (event.kind === "ignore") {
      sendJson(res, 200, { status: "ignored" });
      return;
    }
    await admin.ensureSchema();
    const remote = await yookassa.getPayment(event.id);
    const stored = await admin.findByYookassaId(remote.id);
    if (stored === null) {
      sendJson(res, 200, { status: "ignored" });
      return;
    }
    const result = await settleStoredPayment(settlePorts(admin), stored, remote);
    if (result.status === "rejected") {
      throw new PaymentFlowError(409, result.message);
    }
    sendJson(res, 200, { status: result.status });
  }
}
