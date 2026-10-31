import { afterEach, expect, test, vi } from "vitest";
import { PB_TOKEN_KEY } from "../../../api/pocketbase/pbSession";
import { requestTopup, TOPUP_TIMEOUT_MESSAGE } from "./topupApi";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

test("ответ сервера с ошибкой показывается как есть", async () => {
  localStorage.setItem(PB_TOKEN_KEY, "token");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    message: "ЮKassa отклонила ключи магазина",
  }), { status: 502, headers: { "Content-Type": "application/json" } })));

  await expect(requestTopup(1000, 1_000)).rejects.toThrow("ЮKassa отклонила ключи магазина");
});

test("зависший запрос создания платежа заканчивается понятной ошибкой", async () => {
  localStorage.setItem(PB_TOKEN_KEY, "token");
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
  const started = Date.now();

  await expect(requestTopup(1000, 40)).rejects.toThrow(TOPUP_TIMEOUT_MESSAGE);
  expect(Date.now() - started).toBeLessThan(1_000);
});

test("быстрый ответ с ссылкой возвращает её", async () => {
  localStorage.setItem(PB_TOKEN_KEY, "token");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    confirmationUrl: "https://yoomoney.ru/checkout/payments/v2/contract?orderId=1",
  }), { status: 200, headers: { "Content-Type": "application/json" } })));

  await expect(requestTopup(1000, 1_000)).resolves.toEqual({
    confirmationUrl: "https://yoomoney.ru/checkout/payments/v2/contract?orderId=1",
  });
});
