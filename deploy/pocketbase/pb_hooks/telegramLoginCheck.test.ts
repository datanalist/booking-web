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

const telegramIdTokenDecision = sandbox.module.exports.telegramIdTokenDecision as (
  idToken: string,
  audience: string,
  nonce: string,
  nowSeconds: number,
  keys?: Array<{ kid: string; n: string; e: string }>,
) => {
  ok: boolean;
  status?: number;
  message?: string;
  user?: { id: string; name: string; phone: string; firstName: string };
};

const sha256 = sandbox.module.exports.sha256 as (bytes: number[]) => number[];
const bytesToHex = sandbox.module.exports.bytesToHex as (bytes: number[]) => string;
const rememberNonce = sandbox.module.exports.rememberNonce as (
  map: object,
  nonce: string,
  now: number,
) => Record<string, number>;
const consumeNonce = sandbox.module.exports.consumeNonce as (
  map: object,
  nonce: string,
  now: number,
) => { ok: boolean; map: Record<string, number> };

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" });
const testKey = { kid: "test-key", n: String(jwk.n), e: String(jwk.e) };

function b64url(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

function sign(payload: Record<string, unknown>, kid = testKey.kid): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(data), privateKey);
  return `${data}.${b64url(signature)}`;
}

const payload = {
  iss: "https://oauth.telegram.org",
  aud: "9158776426",
  nonce: "nonce-1",
  iat: 1700000000,
  exp: 1700003600,
  id: 42,
  name: "Иван Петров",
  given_name: "Иван",
  family_name: "Петров",
  preferred_username: "ivan",
  phone_number: "79001234567",
};

test("sha256 пустой строки совпадает с эталоном", () => {
  expect(bytesToHex(sha256([]))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("верный id_token принимается", () => {
  const decision = telegramIdTokenDecision(sign(payload), "9158776426", "nonce-1", 1700000100, [testKey]);
  expect(decision.ok).toBe(true);
  expect(decision.user).toMatchObject({
    id: "42",
    firstName: "Иван",
    name: "Иван Петров",
    phone: "+79001234567",
  });
});

test("без id принимается sub", () => {
  const claims: Record<string, unknown> = { ...payload, sub: "42" };
  delete claims.id;
  const decision = telegramIdTokenDecision(sign(claims), "9158776426", "nonce-1", 1700000100, [testKey]);
  expect(decision.ok).toBe(true);
  expect(decision.user?.id).toBe("42");
});

test("при расхождении id и sub берётся id, а битый id отклоняется", () => {
  const matched = telegramIdTokenDecision(
    sign({ ...payload, sub: "42" }),
    "9158776426",
    "nonce-1",
    1700000100,
    [testKey],
  );
  expect(matched.ok).toBe(true);
  expect(matched.user?.id).toBe("42");

  const mismatched = telegramIdTokenDecision(
    sign({ ...payload, sub: "7" }),
    "9158776426",
    "nonce-1",
    1700000100,
    [testKey],
  );
  expect(mismatched.ok).toBe(true);
  expect(mismatched.user?.id).toBe("42");

  const brokenId = telegramIdTokenDecision(
    sign({ ...payload, id: "nope", sub: "42" }),
    "9158776426",
    "nonce-1",
    1700000100,
    [testKey],
  );
  expect(brokenId.ok).toBe(false);
  expect(brokenId.message).toBe("Telegram не подтвердил вход");
});

test("подмена payload отклоняется", () => {
  const token = sign(payload);
  const parts = token.split(".");
  parts[1] = b64url(JSON.stringify({ ...payload, id: 99 }));
  const decision = telegramIdTokenDecision(parts.join("."), "9158776426", "nonce-1", 1700000100, [testKey]);
  expect(decision.ok).toBe(false);
  expect(decision.message).toBe("Telegram не подтвердил вход");
});

test("чужой nonce и аудитория отклоняются", () => {
  const token = sign(payload);
  expect(telegramIdTokenDecision(token, "9158776426", "other", 1700000100, [testKey]).ok).toBe(false);
  expect(telegramIdTokenDecision(token, "1", "nonce-1", 1700000100, [testKey]).ok).toBe(false);
});

test("истёкший id_token отклоняется", () => {
  const decision = telegramIdTokenDecision(sign(payload), "9158776426", "nonce-1", 1700003600 + 61, [testKey]);
  expect(decision.ok).toBe(false);
  expect(decision.message).toBe("Время входа через Telegram истекло");
});

test("nonce одноразовый", () => {
  const saved = rememberNonce({}, "nonce-1", 100);
  const first = consumeNonce(saved, "nonce-1", 100);
  expect(first.ok).toBe(true);
  expect(consumeNonce(first.map, "nonce-1", 100).ok).toBe(false);
});

test("rememberNonce держит 200 новейших и забывает просроченные", () => {
  let map = rememberNonce({}, "expired", 1);
  for (let index = 0; index < 205; index += 1) {
    map = rememberNonce(map, `n${index}`, 1000);
  }
  const names = Object.keys(map);
  expect(names).toHaveLength(200);
  expect(names[0]).toBe("n5");
  expect(names[199]).toBe("n204");
  expect(consumeNonce(map, "expired", 1000).ok).toBe(false);
  expect(consumeNonce(map, "n4", 1000).ok).toBe(false);
  const kept = consumeNonce(map, "n5", 1000);
  expect(kept.ok).toBe(true);
  expect(consumeNonce(kept.map, "n5", 1000).ok).toBe(false);
});

test("ключи __proto__ и toString потребляются после JSON", () => {
  let map = rememberNonce(Object.create(null), "__proto__", 100);
  map = rememberNonce(map, "toString", 100);
  map = rememberNonce(map, "constructor", 100);
  const stored = JSON.parse(JSON.stringify(map)) as Record<string, number>;
  const afterToString = consumeNonce(stored, "toString", 100);
  expect(afterToString.ok).toBe(true);
  const afterProto = consumeNonce(afterToString.map, "__proto__", 100);
  expect(afterProto.ok).toBe(true);
  const afterCtor = consumeNonce(afterProto.map, "constructor", 100);
  expect(afterCtor.ok).toBe(true);
  expect(Object.keys(afterCtor.map)).toEqual([]);
});

test("без аудитории вход не настроен", () => {
  const decision = telegramIdTokenDecision(sign(payload), "", "nonce-1", 1700000100, [testKey]);
  expect(decision.status).toBe(503);
});
