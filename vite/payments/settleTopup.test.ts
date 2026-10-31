import { expect, test } from "vitest";
import { settleStoredPayment, type SettlePorts } from "./settleTopup.ts";
import type { RemotePayment, StoredPayment } from "./types.ts";

function payment(patch: Partial<StoredPayment> = {}): StoredPayment {
  return {
    id: "pay000000000001",
    userId: "user00000000001",
    amountRub: 10,
    status: "pending",
    credited: false,
    yookassaPaymentId: "yk-payment-1",
    ...patch,
  };
}

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

function memoryPorts(hook: boolean): SettlePorts & { balance: () => number; adds: () => number } {
  let row = payment();
  let balance = 0;
  let adds = 0;
  let credit: { applied: boolean } | null = null;
  const ports: SettlePorts = {
    async getPayment() {
      return { ...row };
    },
    async updatePayment(_id, patch) {
      row = { ...row, ...patch };
    },
    async createCredit(current) {
      if (credit !== null || row.credited) {
        return { created: false, creditId: "" };
      }
      credit = { applied: false };
      if (hook) {
        if (current.status !== "succeeded" && row.status !== "succeeded") {
          credit = null;
          throw new Error("Платёж не оплачен");
        }
        balance += row.amountRub;
        row = { ...row, credited: true, status: "succeeded" };
        credit = { applied: true };
      }
      return { created: true, creditId: "cr0000000000001" };
    },
    async markCreditApplied() {
      if (credit !== null) {
        credit = { applied: true };
      }
    },
    async getBalance() {
      return balance;
    },
    async addBalance(_userId, amountRub) {
      adds += 1;
      balance += amountRub;
      return balance;
    },
    async withUserLock(_userId, task) {
      return task();
    },
  };
  return { ...ports, balance: () => balance, adds: () => adds };
}

test("без хука сумма зачисляется один раз", async () => {
  const ports = memoryPorts(false);
  const stale = payment();
  const first = await settleStoredPayment(ports, stale, remote());
  const second = await settleStoredPayment(ports, stale, remote());
  expect(first).toMatchObject({ status: "succeeded", balance: 10 });
  expect(second).toMatchObject({ status: "already", balance: 10 });
  expect(ports.adds()).toBe(1);
  expect(ports.balance()).toBe(10);
});

test("хук зачисляет сам, повторный вызов баланс не трогает", async () => {
  const ports = memoryPorts(true);
  const first = await settleStoredPayment(ports, payment(), remote());
  expect(first).toMatchObject({ status: "succeeded", balance: 10 });
  expect(ports.adds()).toBe(0);
  const again = await settleStoredPayment(ports, payment({ credited: true, status: "succeeded" }), remote());
  expect(again.status).toBe("already");
  expect(ports.balance()).toBe(10);
});

test("pending и чужая сумма баланс не меняют", async () => {
  const pending = memoryPorts(false);
  expect((await settleStoredPayment(pending, payment(), remote({ status: "pending" }))).status).toBe("pending");
  expect(pending.balance()).toBe(0);
  expect(pending.adds()).toBe(0);

  const mismatch = memoryPorts(false);
  expect((await settleStoredPayment(mismatch, payment(), remote({ userId: "other0000000002" }))).status).toBe("rejected");
  expect(mismatch.balance()).toBe(0);

  const canceled = memoryPorts(false);
  expect((await settleStoredPayment(canceled, payment(), remote({ status: "canceled" }))).status).toBe("canceled");
  expect(canceled.balance()).toBe(0);
});
