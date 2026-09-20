import { expect, test } from "vitest";
import { sha256Hex } from "./hash";

test("hashes utf-8 password", async () => {
  const hex = await sha256Hex("secret12");
  expect(hex).toMatch(/^[a-f0-9]{64}$/);
  expect(hex).toBe(await sha256Hex("secret12"));
  expect(hex).not.toBe(await sha256Hex("secret13"));
});
