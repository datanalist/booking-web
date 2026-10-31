import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { expect, test } from "vitest";
import { creditsCollectionDefinition, paymentsCollectionDefinition } from "./collections.ts";

const source = readFileSync(path.resolve("deploy/pocketbase/pb_hooks/paymentCredit.js"), "utf8");
const sandbox: { module: { exports: Record<string, unknown> }; exports: Record<string, unknown> } = {
  module: { exports: {} },
  exports: {},
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(source, sandbox, { filename: "paymentCredit.js" });
const credit = sandbox.module.exports as {
  creditBlockReason: (
    payment: { credited: boolean; status: string; user: string; amount: number } | null,
    row: { user: string; amount: number },
  ) => string;
  nextBalance: (balance: number, amount: number) => number | null;
};

test("правила платежей закрыты для клиента", () => {
  const payments = paymentsCollectionDefinition();
  expect(payments.createRule).toBeNull();
  expect(payments.updateRule).toBeNull();
  expect(payments.deleteRule).toBeNull();
  expect(payments.listRule).toBe("user = @request.auth.id");
  const credits = creditsCollectionDefinition("paymentsId");
  expect(credits.createRule).toBeNull();
  expect(credits.updateRule).toBeNull();
  expect(credits.listRule).toBeNull();
  const migration = readFileSync(
    path.resolve("deploy/pocketbase/pb_migrations/1793404800_payments.js"),
    "utf8",
  );
  expect(migration).toContain("createRule: null");
  expect(migration).toContain("updateRule: null");
  expect(migration).toContain("idx_payment_credits_payment");
  const hook = readFileSync(path.resolve("deploy/pocketbase/pb_hooks/payments_credit.pb.js"), "utf8");
  expect(hook).toContain("payment_credits");
  expect(hook).not.toContain("YOOKASSA_SECRET_KEY");
});

test("хук не зачисляет чужую или повторную сумму и складывает баланс один раз", () => {
  const payment = { credited: false, status: "succeeded", user: "user1", amount: 10 };
  expect(credit.creditBlockReason(payment, { user: "user1", amount: 10 })).toBe("");
  expect(credit.creditBlockReason({ ...payment, credited: true }, { user: "user1", amount: 10 })).toBe("Платёж уже зачислен");
  expect(credit.creditBlockReason({ ...payment, status: "pending" }, { user: "user1", amount: 10 })).toBe("Платёж не оплачен");
  expect(credit.creditBlockReason(payment, { user: "other", amount: 10 })).toBe("Платёж принадлежит другому пользователю");
  expect(credit.creditBlockReason(payment, { user: "user1", amount: 11 })).toBe("Сумма не совпадает");
  expect(credit.nextBalance(5, 10)).toBe(15);
  expect(credit.nextBalance(5, 10)).toBe(15);
});
