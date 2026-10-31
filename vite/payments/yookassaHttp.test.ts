import { expect, test } from "vitest";
import { yookassaFailureMessage } from "./yookassaHttp.ts";

const secrets = ["shop", "super-secret-key"];

test("401 invalid_credentials говорит про ключи и не повторяет секрет", () => {
  const message = yookassaFailureMessage(401, {
    code: "invalid_credentials",
    description: "Error in shopId or secret key super-secret-key",
  }, secrets);
  expect(message).toBe("ЮKassa отклонила ключи магазина");
  expect(message).not.toContain("super-secret-key");
});

test("401 про тип авторизации не называется отказом ключей", () => {
  expect(yookassaFailureMessage(401, {
    code: "invalid_credentials",
    description: "Authentication type is not allowed",
  }, secrets)).toBe("ЮKassa не приняла способ авторизации");
});

test("403 и 400 не притворяются отказом ключей", () => {
  expect(yookassaFailureMessage(403, { description: "Forbidden" }, secrets))
    .toBe("ЮKassa запретила операцию");
  expect(yookassaFailureMessage(400, { description: "Invalid amount value" }, secrets))
    .toBe("Invalid amount value");
  expect(yookassaFailureMessage(400, { description: "bad super-secret-key" }, secrets))
    .toBe("ЮKassa не приняла данные платежа");
});
