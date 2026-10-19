import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const pocketBaseDir = path.resolve("deploy/pocketbase");

const REQUIRED_SNIPPETS = [
  "onMailerRecordVerificationSend",
  "/api/vallome/confirm-verification?token=",
  "Подтвердить почту",
  "Подтвердите почту в vallome.booking",
  "Referrer-Policy",
  "no-referrer",
  "/login?verified=1",
  "CABINET_URL",
  "http://127.0.0.1:5173",
  "onRecordAuthWithPasswordRequest",
  "Подтвердите почту по кнопке в письме",
  "Ссылка недействительна или устарела",
];

test("письмо подтверждения ведёт на кнопку, а пароль без verified закрыт", () => {
  const hook = readFileSync(path.join(pocketBaseDir, "pb_hooks/email_verification.pb.js"), "utf8");

  for (const snippet of REQUIRED_SNIPPETS) {
    expect(hook).toContain(snippet);
  }

  expect(hook).not.toContain("magic-auth");
  expect(hook).not.toMatch(/[?&](?:email|identity)=/);
  expect(hook).not.toMatch(/encodeURIComponent\(\s*(?:email|identity)\b/);

  const passwordCheck = hook.indexOf("record.validatePassword(password)");
  const deny = hook.indexOf('new BadRequestError("Подтвердите почту по кнопке в письме")');
  expect(passwordCheck).toBeGreaterThanOrEqual(0);
  expect(deny).toBeGreaterThan(passwordCheck);

  const envExample = readFileSync(path.join(pocketBaseDir, ".env.example"), "utf8");
  expect(envExample).toContain("CABINET_URL=http://127.0.0.1:5173");
});
