import { expect, test } from "vitest";
import { addRubles, sameRubles } from "./money.ts";
import type { RemotePayment, StoredPayment } from "./types.ts";
import {
  buildCreatePaymentBody,
  decideSettlement,
  isYookassaNotificationIp,
  notificationClientIp,
  parseRemotePayment,
  readWebhookPaymentId,
  topupReturnUrl,
} from "./yookassa.ts";

const stored = (patch: Partial<StoredPayment> = {}): StoredPayment => ({
  id: "pay000000000001",
  userId: "user00000000001",
  amountRub: 10,
  status: "pending",
  credited: false,
  yookassaPaymentId: "yk-payment-1",
  ...patch,
});

const remote = (patch: Partial<RemotePayment> = {}): RemotePayment => ({
  id: "yk-payment-1",
  status: "succeeded",
  currency: "RUB",
  amountRub: 10,
  userId: "user00000000001",
  paymentId: "pay000000000001",
  amountMetaRub: 10,
  ...patch,
});

test("тело платежа — рубли с копейками, capture и metadata владельца", () => {
  expect(buildCreatePaymentBody({
    amountRub: 10,
    returnUrl: "http://localhost:5173/profile?payment=pay000000000001",
    userId: "user00000000001",
    paymentId: "pay000000000001",
  })).toEqual({
    amount: { value: "10.00", currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: "http://localhost:5173/profile?payment=pay000000000001",
    },
    description: "Пополнение баланса",
    metadata: {
      user_id: "user00000000001",
      amount: "10.00",
      payment_id: "pay000000000001",
    },
  });
  expect(topupReturnUrl("http://localhost:5173/", "pay000000000001")).toBe(
    "http://localhost:5173/profile?payment=pay000000000001",
  );
});

test("успешный ответ ЮKassa можно разобрать, без metadata — нет", () => {
  expect(parseRemotePayment({
    id: "yk-payment-1",
    status: "succeeded",
    amount: { value: "10.00", currency: "RUB" },
    metadata: { user_id: "user00000000001", amount: "10.00", payment_id: "pay000000000001" },
  })?.amountRub).toBe(10);
  expect(parseRemotePayment({
    id: "yk-payment-1",
    status: "succeeded",
    amount: { value: "10.00", currency: "RUB" },
  })).toBeNull();
});

test("зачисление только если статус succeeded и реквизиты совпали", () => {
  expect(decideSettlement(stored(), remote()).action).toBe("credit");
  expect(decideSettlement(stored({ credited: true }), remote()).action).toBe("already");
  expect(decideSettlement(stored(), remote({ status: "pending" })).action).toBe("pending");
  expect(decideSettlement(stored(), remote({ status: "canceled" })).action).toBe("cancel");
  expect(decideSettlement(stored(), remote({ userId: "other0000000002" })).action).toBe("reject");
  expect(decideSettlement(stored(), remote({ amountRub: 11 })).action).toBe("reject");
  expect(decideSettlement(stored(), remote({ amountMetaRub: 9 })).action).toBe("reject");
  expect(decideSettlement(stored(), remote({ paymentId: "other0000000002" })).action).toBe("reject");
  expect(decideSettlement(stored({ credited: true }), remote({ status: "canceled" })).action).toBe("already");
});

test("сложение рублей не теряет копейку на целых суммах", () => {
  expect(addRubles(0, 10)).toBe(10);
  expect(addRubles(10, 10)).toBe(20);
  expect(sameRubles(10, 10.0)).toBe(true);
  expect(sameRubles(10, 10.01)).toBe(false);
});

test("IP ЮKassa узнаётся, подмена X-Forwarded-For с публичного адреса — нет", () => {
  expect(isYookassaNotificationIp("185.71.76.10")).toBe(true);
  expect(isYookassaNotificationIp("185.71.76.32")).toBe(false);
  expect(isYookassaNotificationIp("77.75.156.11")).toBe(true);
  expect(isYookassaNotificationIp("::ffff:77.75.156.35")).toBe(true);
  expect(isYookassaNotificationIp("2a02:5180::1")).toBe(true);
  expect(isYookassaNotificationIp("8.8.8.8")).toBe(false);
  expect(notificationClientIp("8.8.8.8", "185.71.76.10")).toBe("8.8.8.8");
  expect(notificationClientIp("127.0.0.1", "185.71.76.10")).toBe("185.71.76.10");
});

test("webhook читает только id события, не сумму из тела", () => {
  expect(readWebhookPaymentId({
    event: "payment.succeeded",
    object: { id: "yk-payment-1", status: "succeeded", amount: { value: "999.00" } },
  })).toEqual({ kind: "payment", id: "yk-payment-1" });
  expect(readWebhookPaymentId({ event: "payment.waiting_for_capture", object: { id: "yk-payment-1" } }).kind)
    .toBe("ignore");
  expect(readWebhookPaymentId({ event: "payment.succeeded" }).kind).toBe("invalid");
});
