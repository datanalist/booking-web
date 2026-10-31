import { sameRubles, yookassaAmountValue } from "./money.ts";
import type { RemotePayment, StoredPayment } from "./types.ts";

const TOPUP_DESCRIPTION = "Пополнение баланса";

const YOOKASSA_NETS: ReadonlyArray<readonly [string, number]> = [
  ["185.71.76.0", 27],
  ["185.71.77.0", 27],
  ["77.75.153.0", 25],
  ["77.75.154.128", 25],
];

const YOOKASSA_HOSTS = new Set(["77.75.156.11", "77.75.156.35"]);

export type SettleDecision =
  | { action: "credit" }
  | { action: "cancel" }
  | { action: "pending" }
  | { action: "already" }
  | { action: "reject"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    value = value * 256 + octet;
  }
  return value >>> 0;
}

export function normalizeIp(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith("::ffff:")) {
    const mapped = trimmed.slice("::ffff:".length);
    if (mapped.includes(".")) {
      return mapped;
    }
  }
  return trimmed;
}

function inCidr(ip: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) {
    return false;
  }
  const mask = bits === 0 ? 0 : ((0xffffffff << (32 - bits)) >>> 0);
  return (ip & mask) === (baseInt & mask);
}

/** Адреса, с которых ЮKassa шлёт уведомления. */
export function isYookassaNotificationIp(raw: string): boolean {
  const ip = normalizeIp(raw);
  if (ip.includes(":")) {
    return ip.startsWith("2a02:5180:");
  }
  if (YOOKASSA_HOSTS.has(ip)) {
    return true;
  }
  const value = ipv4ToInt(ip);
  if (value === null) {
    return false;
  }
  return YOOKASSA_NETS.some(([base, bits]) => inCidr(value, base, bits));
}

function isPrivateOrLoopback(ip: string): boolean {
  if (ip === "::1" || ip === "localhost") {
    return true;
  }
  const value = ipv4ToInt(ip);
  if (value === null) {
    return false;
  }
  return inCidr(value, "127.0.0.0", 8)
    || inCidr(value, "10.0.0.0", 8)
    || inCidr(value, "192.168.0.0", 16)
    || inCidr(value, "172.16.0.0", 12);
}

/**
 * За прокси берём первый X-Forwarded-For только если сокет — локальный.
 * Прямой клиент не может подменить адрес заголовком.
 */
export function notificationClientIp(
  remoteAddress: string | undefined,
  forwardedFor: string | undefined,
): string {
  const remote = normalizeIp(remoteAddress ?? "");
  if (isPrivateOrLoopback(remote) && forwardedFor !== undefined) {
    const first = forwardedFor.split(",")[0]?.trim() ?? "";
    if (first !== "") {
      return normalizeIp(first);
    }
  }
  return remote;
}

export function topupReturnUrl(origin: string, paymentId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/profile?payment=${encodeURIComponent(paymentId)}`;
}

export function buildCreatePaymentBody(input: {
  amountRub: number;
  returnUrl: string;
  userId: string;
  paymentId: string;
}): {
  amount: { value: string; currency: "RUB" };
  capture: true;
  confirmation: { type: "redirect"; return_url: string };
  description: string;
  metadata: { user_id: string; amount: string; payment_id: string };
} {
  const amount = yookassaAmountValue(input.amountRub);
  return {
    amount: { value: amount, currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: input.returnUrl },
    description: TOPUP_DESCRIPTION,
    metadata: {
      user_id: input.userId,
      amount,
      payment_id: input.paymentId,
    },
  };
}

function parseMoney(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) {
    return null;
  }
  const rubles = Number(value);
  return Number.isFinite(rubles) ? rubles : null;
}

export function parseRemotePayment(value: unknown): RemotePayment | null {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }
  if (typeof value.status !== "string") {
    return null;
  }
  if (!isRecord(value.amount)) {
    return null;
  }
  const amountRub = parseMoney(value.amount.value);
  const currency = value.amount.currency;
  if (amountRub === null || currency !== "RUB") {
    return null;
  }
  if (!isRecord(value.metadata)) {
    return null;
  }
  const userId = value.metadata.user_id;
  const paymentId = value.metadata.payment_id;
  const amountMetaRub = parseMoney(value.metadata.amount);
  if (typeof userId !== "string" || userId.trim() === "") {
    return null;
  }
  if (typeof paymentId !== "string" || paymentId.trim() === "") {
    return null;
  }
  if (amountMetaRub === null) {
    return null;
  }
  return {
    id: value.id.trim(),
    status: value.status,
    currency,
    amountRub,
    userId: userId.trim(),
    paymentId: paymentId.trim(),
    amountMetaRub,
  };
}

export function isConfirmationUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username !== "" || url.password !== "") {
    return false;
  }
  if (url.protocol === "https:") {
    return true;
  }
  return url.protocol === "http:"
    && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

export function isPaymentRecordId(value: string): boolean {
  return /^[a-z0-9]{15}$/.test(value);
}

export function isYookassaPaymentId(value: string): boolean {
  return /^[A-Za-z0-9-]{10,64}$/.test(value);
}

export function readWebhookPaymentId(body: unknown):
  | { kind: "ignore" }
  | { kind: "invalid" }
  | { kind: "payment"; id: string } {
  if (!isRecord(body) || typeof body.event !== "string") {
    return { kind: "invalid" };
  }
  if (body.event !== "payment.succeeded" && body.event !== "payment.canceled") {
    return { kind: "ignore" };
  }
  if (!isRecord(body.object) || typeof body.object.id !== "string") {
    return { kind: "invalid" };
  }
  const id = body.object.id.trim();
  if (!isYookassaPaymentId(id)) {
    return { kind: "invalid" };
  }
  return { kind: "payment", id };
}

function remoteMatches(stored: StoredPayment, remote: RemotePayment): boolean {
  return remote.id === stored.yookassaPaymentId
    && stored.yookassaPaymentId !== ""
    && remote.currency === "RUB"
    && remote.userId === stored.userId
    && remote.paymentId === stored.id
    && sameRubles(remote.amountRub, stored.amountRub)
    && sameRubles(remote.amountMetaRub, stored.amountRub);
}

/** Зачислять можно только после сверки ответа ЮKassa с нашей записью. */
export function decideSettlement(stored: StoredPayment, remote: RemotePayment): SettleDecision {
  if (!remoteMatches(stored, remote)) {
    return { action: "reject", message: "Данные платежа не совпали" };
  }
  if (stored.credited) {
    return { action: "already" };
  }
  if (remote.status === "succeeded") {
    return { action: "credit" };
  }
  if (remote.status === "canceled") {
    return { action: "cancel" };
  }
  return { action: "pending" };
}

export function requestOrigin(headerOrigin: string | undefined, host: string | undefined, proto: string | undefined): string {
  if (headerOrigin !== undefined && /^https?:\/\/[a-z0-9.:-]+$/i.test(headerOrigin)) {
    return headerOrigin.replace(/\/$/, "");
  }
  if (host !== undefined && /^[a-z0-9.:-]+$/i.test(host)) {
    const scheme = proto === "https" ? "https" : "http";
    return `${scheme}://${host}`;
  }
  return "http://localhost:5173";
}
