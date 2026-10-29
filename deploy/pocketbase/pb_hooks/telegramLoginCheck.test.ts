import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { expect, test } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "deploy/pocketbase/pb_hooks/telegramLoginCheck.js"),
  "utf8",
);
const sandbox: { module: { exports: Record<string, unknown> }; exports: Record<string, unknown> } = {
  module: { exports: {} },
  exports: {},
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(source, sandbox);

const telegramAuthDecision = sandbox.module.exports.telegramAuthDecision as (
  body: Record<string, unknown>,
  botToken: string,
  nowSeconds: number,
) => { ok: boolean; status?: number; message?: string; user?: { id: string; name: string } };

const sha256 = sandbox.module.exports.sha256 as (bytes: number[]) => number[];
const bytesToHex = sandbox.module.exports.bytesToHex as (bytes: number[]) => string;

function signed(fields: Record<string, string>, botToken: string): Record<string, string> {
  const lines = Object.keys(fields)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${fields[key]}`);
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secret).update(lines.join("\n")).digest("hex");
  return { ...fields, hash };
}

test("sha256 пустой строки совпадает с эталоном", () => {
  expect(bytesToHex(sha256([]))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("верная подпись виджета принимается", () => {
  const fields = signed(
    { id: "42", auth_date: "1700000000", first_name: "Иван", username: "ivan" },
    "123456:bot-token",
  );
  const decision = telegramAuthDecision(fields, "123456:bot-token", 1700000100);
  expect(decision.ok).toBe(true);
  expect(decision.user).toEqual({ id: "42", firstName: "Иван", lastName: "", name: "Иван" });
});

test("подмена имени отклоняется", () => {
  const fields = signed(
    { id: "42", auth_date: "1700000000", first_name: "Иван" },
    "123456:bot-token",
  );
  fields.first_name = "Пётр";
  const decision = telegramAuthDecision(fields, "123456:bot-token", 1700000100);
  expect(decision.ok).toBe(false);
  expect(decision.message).toBe("Telegram не подтвердил вход");
});

test("устаревший auth_date отклоняется", () => {
  const fields = signed(
    { id: "42", auth_date: "1700000000", first_name: "Иван" },
    "123456:bot-token",
  );
  const decision = telegramAuthDecision(fields, "123456:bot-token", 1700000000 + 86401);
  expect(decision.ok).toBe(false);
  expect(decision.message).toBe("Время входа через Telegram истекло");
});

test("без токена бота вход не настроен", () => {
  const decision = telegramAuthDecision({ id: "1", auth_date: "1", hash: "ab" }, "", 10);
  expect(decision.ok).toBe(false);
  expect(decision.status).toBe(503);
});
