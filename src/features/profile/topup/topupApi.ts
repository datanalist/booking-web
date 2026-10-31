import { readPbToken } from "../../../api/pocketbase/pbSession";
import { isDeadlineError, withDeadline } from "../../../../vite/payments/withDeadline";
import { isConfirmationUrl } from "../../../../vite/payments/yookassa";

export const TOPUP_REQUEST_TIMEOUT_MS = 15_000;
export const TOPUP_TIMEOUT_MESSAGE = "Сервер не ответил вовремя. Попробуйте ещё раз.";
export const TOPUP_OPEN_MESSAGE = "Не удалось открыть страницу оплаты. Попробуйте ещё раз.";

export type ConfirmTopupResult = {
  status: "succeeded" | "already" | "pending" | "canceled";
  message: string;
  balance?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function messageFrom(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === "string" && body.message.trim() !== "") {
    return body.message;
  }
  return fallback;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function authHeader(): string {
  const token = readPbToken(localStorage);
  if (token === null) {
    throw new Error("Войдите в аккаунт");
  }
  return `Bearer ${token}`;
}

function failure(error: unknown, fallback: string): Error {
  if (isDeadlineError(error)) {
    return new Error(TOPUP_TIMEOUT_MESSAGE);
  }
  return new Error(fallback);
}

/** Создаёт платёж на сервере и возвращает ссылку ЮKassa. Сумму на баланс здесь не пишет. */
export async function requestTopup(
  amountRub: number,
  timeoutMs = TOPUP_REQUEST_TIMEOUT_MS,
): Promise<{ confirmationUrl: string }> {
  const authorization = authHeader();
  let outcome: { ok: boolean; body: unknown };
  try {
    outcome = await withDeadline(timeoutMs, async (signal) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({ amount: amountRub }),
        signal,
      });
      return { ok: response.ok, body: await readBody(response) };
    });
  } catch (error) {
    throw failure(error, "Не удалось создать платёж");
  }
  if (!outcome.ok) {
    throw new Error(messageFrom(outcome.body, "Не удалось создать платёж"));
  }
  const confirmationUrl = isRecord(outcome.body) && typeof outcome.body.confirmationUrl === "string"
    ? outcome.body.confirmationUrl
    : "";
  if (!isConfirmationUrl(confirmationUrl)) {
    throw new Error("Не удалось создать платёж");
  }
  return { confirmationUrl };
}

/** Просит сервер сверить платёж с ЮKassa и зачислить его, если он успешен. */
export async function confirmTopup(
  paymentId: string,
  timeoutMs = TOPUP_REQUEST_TIMEOUT_MS,
): Promise<ConfirmTopupResult> {
  const authorization = authHeader();
  let outcome: { ok: boolean; body: unknown };
  try {
    outcome = await withDeadline(timeoutMs, async (signal) => {
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({ paymentId }),
        signal,
      });
      return { ok: response.ok, body: await readBody(response) };
    });
  } catch (error) {
    throw failure(error, "Не удалось проверить платёж");
  }
  const body = outcome.body;
  if (!outcome.ok) {
    throw new Error(messageFrom(body, "Не удалось проверить платёж"));
  }
  if (!isRecord(body)) {
    throw new Error("Не удалось проверить платёж");
  }
  const status = body.status;
  if (status !== "succeeded" && status !== "already" && status !== "pending" && status !== "canceled") {
    throw new Error(messageFrom(body, "Не удалось проверить платёж"));
  }
  const balance = typeof body.balance === "number" && Number.isFinite(body.balance) ? body.balance : undefined;
  return {
    status,
    message: messageFrom(body, "Не удалось проверить платёж"),
    ...(balance !== undefined ? { balance } : {}),
  };
}
