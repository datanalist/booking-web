/** @vitest-environment node */
import { expect, test } from "vitest";
import { DeadlineError, withDeadline } from "./withDeadline.ts";
import { createYookassaClient } from "./yookassaHttp.ts";

test("таймер отклоняет ожидание, даже если fetch игнорирует отмену", async () => {
  const started = Date.now();
  const pending = withDeadline(40, () => new Promise(() => undefined));
  await expect(pending).rejects.toBeInstanceOf(DeadlineError);
  expect(Date.now() - started).toBeLessThan(1_000);
});

test("зависшее тело ЮKassa не держит создание платежа", async () => {
  const fetchImpl: typeof fetch = (_input, init) => {
    const stream = new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () => {
          controller.error(init.signal?.reason ?? new Error("aborted"));
        }, { once: true });
      },
    });
    return Promise.resolve(new Response(stream, { status: 200 }));
  };
  const client = createYookassaClient({ shopId: "shop", secretKey: "test_key" }, fetchImpl, 40);
  const started = Date.now();
  await expect(client.createPayment({
    amountRub: 1000,
    returnUrl: "https://app.example/profile?payment=pay000000000001",
    userId: "user00000000001",
    paymentId: "pay000000000001",
    idempotenceKey: "idem-1",
  })).rejects.toMatchObject({
    name: "PaymentFlowError",
    status: 502,
    message: "Не удалось связаться с ЮKassa",
  });
  expect(Date.now() - started).toBeLessThan(1_000);
});
