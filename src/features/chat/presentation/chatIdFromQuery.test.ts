import { afterEach, expect, test, vi } from "vitest";
import { chatIdFromQuery } from "./chatIdFromQuery";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("в моке query открывает только сид", () => {
  expect(chatIdFromQuery("chat-support")).toBe("chat-support");
  expect(chatIdFromQuery("gc134dxdyo7je7w")).toBeNull();
  expect(chatIdFromQuery("  ")).toBeNull();
  expect(chatIdFromQuery(null)).toBeNull();
});

test("в pocketbase query принимает id записи", () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  expect(chatIdFromQuery("gc134dxdyo7je7w")).toBe("gc134dxdyo7je7w");
  expect(chatIdFromQuery(" chat-support ")).toBe("chat-support");
});
