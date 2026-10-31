import { readPbToken } from "../../../api/pocketbase/pbSession";
import { isConfirmationUrl } from "../../../../vite/payments/yookassa";

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

/** Создаёт платёж на сервере и возвращает ссылку ЮKassa. Сумму на баланс здесь не пишет. */
export async function requestTopup(amountRub: number): Promise<{ confirmationUrl: string }> {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ amount: amountRub }),
  }).catch(() => {
    throw new Error("Не удалось создать платёж");
  });
  const body = await readBody(response);
  if (!response.ok) {
    throw new Error(messageFrom(body, "Не удалось создать платёж"));
  }
  const confirmationUrl = isRecord(body) && typeof body.confirmationUrl === "string"
    ? body.confirmationUrl
    : "";
  if (!isConfirmationUrl(confirmationUrl)) {
    throw new Error("Не удалось создать платёж");
  }
  return { confirmationUrl };
}

/** Просит сервер сверить платёж с ЮKassa и зачислить его, если он успешен. */
export async function confirmTopup(paymentId: string): Promise<ConfirmTopupResult> {
  const response = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ paymentId }),
  }).catch(() => {
    throw new Error("Не удалось проверить платёж");
  });
  const body = await readBody(response);
  if (!response.ok) {
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
