import { PaymentFlowError } from "./paymentFlowError.ts";
import { decideSettlement } from "./yookassa.ts";
import type { RemotePayment, StoredPayment } from "./types.ts";

export type SettleResult = {
  status: "succeeded" | "already" | "pending" | "canceled" | "rejected";
  message: string;
  balance?: number;
};

export type CreditInsert =
  | { created: true; creditId: string }
  | { created: false; creditId: "" };

export type SettlePorts = {
  getPayment(id: string): Promise<StoredPayment | null>;
  updatePayment(id: string, patch: { status?: StoredPayment["status"]; credited?: boolean }): Promise<void>;
  createCredit(payment: StoredPayment): Promise<CreditInsert>;
  markCreditApplied(creditId: string): Promise<void>;
  getBalance(userId: string): Promise<number>;
  addBalance(userId: string, amountRub: number): Promise<number>;
  withUserLock<T>(userId: string, task: () => Promise<T>): Promise<T>;
};

const MESSAGES = {
  succeeded: "Баланс пополнен",
  already: "Этот платёж уже зачислен",
  pending: "Платёж ещё не подтверждён",
  canceled: "Оплата отменена",
  processing: "Платёж обрабатывается. Обновите страницу.",
} as const;

async function creditedResult(
  ports: SettlePorts,
  userId: string,
  status: "succeeded" | "already",
): Promise<SettleResult> {
  const balance = await ports.getBalance(userId);
  return { status, message: MESSAGES[status], balance };
}

/** Сверяет платёж с ЮKassa и зачисляет сумму один раз. */
export async function settleStoredPayment(
  ports: SettlePorts,
  stored: StoredPayment,
  remote: RemotePayment,
): Promise<SettleResult> {
  const decision = decideSettlement(stored, remote);
  if (decision.action === "reject") {
    return { status: "rejected", message: decision.message };
  }
  if (decision.action === "already") {
    return creditedResult(ports, stored.userId, "already");
  }
  if (decision.action === "pending") {
    return { status: "pending", message: MESSAGES.pending };
  }
  if (decision.action === "cancel") {
    if (!stored.credited && stored.status !== "canceled") {
      await ports.updatePayment(stored.id, { status: "canceled" });
    }
    return { status: "canceled", message: MESSAGES.canceled };
  }

  return ports.withUserLock(stored.userId, async () => {
    const fresh = await ports.getPayment(stored.id);
    if (fresh === null) {
      return { status: "rejected", message: "Платёж не найден" };
    }
    if (fresh.credited) {
      return creditedResult(ports, fresh.userId, "already");
    }
    if (fresh.status !== "succeeded") {
      await ports.updatePayment(fresh.id, { status: "succeeded" });
    }
    const inserted = await ports.createCredit(fresh);
    const after = await ports.getPayment(fresh.id);
    if (after?.credited) {
      return creditedResult(ports, fresh.userId, "succeeded");
    }
    if (!inserted.created) {
      return { status: "pending", message: MESSAGES.processing };
    }
    const balance = await ports.addBalance(fresh.userId, fresh.amountRub);
    await ports.updatePayment(fresh.id, { credited: true, status: "succeeded" });
    try {
      await ports.markCreditApplied(inserted.creditId);
    } catch (error) {
      if (!(error instanceof PaymentFlowError)) {
        throw error;
      }
    }
    return { status: "succeeded", message: MESSAGES.succeeded, balance };
  });
}
