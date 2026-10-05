import { expect, test } from "vitest";
import { connectApiKey } from "./connectApiKey";

test("пустой и короткий ключ дают ошибку", () => {
  expect(connectApiKey("")).toEqual({ status: "error" });
  expect(connectApiKey("   ")).toEqual({ status: "error" });
  expect(connectApiKey("12345")).toEqual({ status: "error" });
});

test("ключ из цифр длиной от 6 считается подключённым", () => {
  expect(connectApiKey("123456")).toEqual({ status: "connected" });
  expect(connectApiKey("  1234567  ")).toEqual({ status: "connected" });
});

test("ключ не из одних цифр даёт ошибку", () => {
  expect(connectApiKey("12345a")).toEqual({ status: "error" });
  expect(connectApiKey("12 3456")).toEqual({ status: "error" });
});
