import { Buffer } from "node:buffer";
import { PaymentFlowError } from "./paymentFlowError.ts";
import { buildCreatePaymentBody, isConfirmationUrl, parseRemotePayment } from "./yookassa.ts";
import type { RemotePayment } from "./types.ts";

const API = "https://api.yookassa.ru/v3";

export type YookassaEnv = {
  shopId: string;
  secretKey: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function basicAuthHeader(shopId: string, secretKey: string): string {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`, "utf8").toString("base64")}`;
}

function redact(text: string, secrets: readonly string[]): string {
  let safe = text;
  for (const secret of secrets) {
    if (secret.length > 0) {
      safe = safe.split(secret).join("[secret]");
    }
  }
  return safe;
}

function yookassaMessage(status: number, body: unknown, secrets: readonly string[]): string {
  if (status === 401 || status === 403) {
    return "ЮKassa отклонила ключи магазина";
  }
  const description = isRecord(body) && typeof body.description === "string" ? body.description.trim() : "";
  const safe = redact(description, secrets);
  if (safe.length > 0 && safe.length <= 240 && !safe.includes("[secret]")) {
    return safe;
  }
  return "Не удалось создать платёж";
}

export function createYookassaClient(env: YookassaEnv, fetchImpl: typeof fetch) {
  const secrets = [env.shopId, env.secretKey];

  async function call(
    path: string,
    method: string,
    body?: object,
    idempotenceKey?: string,
  ): Promise<unknown> {
    if (env.shopId.trim() === "" || env.secretKey.trim() === "") {
      throw new PaymentFlowError(503, "Платёжная система не настроена");
    }
    const headers = new Headers();
    headers.set("Authorization", basicAuthHeader(env.shopId, env.secretKey));
    headers.set("Accept", "application/json");
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (idempotenceKey !== undefined) {
      headers.set("Idempotence-Key", idempotenceKey);
    }
    let response: Response;
    try {
      response = await fetchImpl(`${API}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new PaymentFlowError(502, "Не удалось связаться с ЮKassa");
    }
    const text = await response.text();
    let parsed: unknown = null;
    if (text.trim().length > 0) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = null;
      }
    }
    if (!response.ok) {
      throw new PaymentFlowError(502, yookassaMessage(response.status, parsed, secrets));
    }
    return parsed;
  }

  return {
    async createPayment(input: {
      amountRub: number;
      returnUrl: string;
      userId: string;
      paymentId: string;
      idempotenceKey: string;
    }): Promise<{ id: string; confirmationUrl: string }> {
      const payload = buildCreatePaymentBody(input);
      const parsed = await call("/payments", "POST", payload, input.idempotenceKey);
      if (!isRecord(parsed) || typeof parsed.id !== "string") {
        throw new PaymentFlowError(502, "ЮKassa вернула некорректный ответ");
      }
      const confirmation = parsed.confirmation;
      const confirmationUrl = isRecord(confirmation) && typeof confirmation.confirmation_url === "string"
        ? confirmation.confirmation_url
        : "";
      if (!isConfirmationUrl(confirmationUrl)) {
        throw new PaymentFlowError(502, "ЮKassa не вернула ссылку на оплату");
      }
      return { id: parsed.id, confirmationUrl };
    },

    async getPayment(id: string): Promise<RemotePayment> {
      const parsed = await call(`/payments/${encodeURIComponent(id)}`, "GET");
      const remote = parseRemotePayment(parsed);
      if (remote === null || remote.id !== id) {
        throw new PaymentFlowError(502, "ЮKassa вернула некорректный ответ");
      }
      return remote;
    },
  };
}
