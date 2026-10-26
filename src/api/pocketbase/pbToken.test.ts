import { describe, expect, test } from "vitest";
import { isPbTokenExpired, pbTokenExpiresAtMs } from "./pbToken";

function jwt(payload: object): string {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

describe("срок токена PocketBase", () => {
  test("exp в будущем ещё действует", () => {
    const expMs = 1_800_000_000_000;
    const token = jwt({ exp: expMs / 1000 });
    expect(pbTokenExpiresAtMs(token)).toBe(expMs);
    expect(isPbTokenExpired(token, expMs - 1)).toBe(false);
  });

  test("exp в прошлом или ровно сейчас уже истёк", () => {
    const expMs = 1_800_000_000_000;
    const token = jwt({ exp: expMs / 1000 });
    expect(isPbTokenExpired(token, expMs)).toBe(true);
    expect(isPbTokenExpired(token, expMs + 1)).toBe(true);
  });

  test("строка без exp не считается истёкшей", () => {
    expect(pbTokenExpiresAtMs("token")).toBeNull();
    expect(isPbTokenExpired("token", 1)).toBe(false);
    expect(isPbTokenExpired(jwt({ id: "u" }), 1)).toBe(false);
  });
});
