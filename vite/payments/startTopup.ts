import { randomUUID } from "node:crypto";
import { PaymentFlowError } from "./paymentFlowError.ts";
import { isConfirmationUrl, topupReturnUrl } from "./yookassa.ts";
import type { StoredPayment } from "./types.ts";

export type StartTopupPorts = {
  createPayment(input: { userId: string; amountRub: number; idempotenceKey: string }): Promise<StoredPayment>;
  saveYookassa(id: string, yookassaPaymentId: string): Promise<void>;
  cancelPayment(id: string): Promise<void>;
  createRemote(input: {
    amountRub: number;
    returnUrl: string;
    userId: string;
    paymentId: string;
    idempotenceKey: string;
  }): Promise<{ id: string; confirmationUrl: string }>;
};

export async function startTopup(
  ports: StartTopupPorts,
  input: { userId: string; amountRub: number; origin: string },
): Promise<{ confirmationUrl: string; paymentId: string }> {
  const idempotenceKey = randomUUID();
  const payment = await ports.createPayment({
    userId: input.userId,
    amountRub: input.amountRub,
    idempotenceKey,
  });
  const returnUrl = topupReturnUrl(input.origin, payment.id);
  let remote: { id: string; confirmationUrl: string };
  try {
    remote = await ports.createRemote({
      amountRub: input.amountRub,
      returnUrl,
      userId: input.userId,
      paymentId: payment.id,
      idempotenceKey,
    });
  } catch (error) {
    await ports.cancelPayment(payment.id).catch(() => undefined);
    throw error;
  }
  if (!isConfirmationUrl(remote.confirmationUrl)) {
    await ports.cancelPayment(payment.id).catch(() => undefined);
    throw new PaymentFlowError(502, "ЮKassa не вернула ссылку на оплату");
  }
  try {
    await ports.saveYookassa(payment.id, remote.id);
  } catch (error) {
    await ports.cancelPayment(payment.id).catch(() => undefined);
    throw error instanceof PaymentFlowError
      ? error
      : new PaymentFlowError(502, "Не удалось сохранить платёж");
  }
  return { confirmationUrl: remote.confirmationUrl, paymentId: payment.id };
}
