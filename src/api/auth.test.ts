import { expect, test } from "vitest";
import { createAuthApi } from "./auth";
import { MemoryStorage } from "../lib/memoryStorage";
import { SESSION_KEY } from "./keys";

function api() {
  return createAuthApi(new MemoryStorage());
}

test("register then login", async () => {
  const auth = api();
  const session = await auth.register("A@Mail.ru", "secret12");
  expect(session.email).toBe("a@mail.ru");
  expect(session.onboardingComplete).toBe(false);
  expect(session).not.toHaveProperty("password");
  expect(session).not.toHaveProperty("passwordHash");
  const again = await auth.login("a@mail.ru", "secret12");
  expect(again.userId).toBe(session.userId);
});

test("duplicate email", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  await expect(auth.register("A@mail.ru", "secret12")).rejects.toThrow("Такой email уже зарегистрирован");
});

test("wrong password", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  await expect(auth.login("a@mail.ru", "nope0000")).rejects.toThrow("Неверный email или пароль");
});

test("onboarding requires name and phone", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  const done = await auth.completeOnboarding({ name: "Анна", phone: "+7 (900) 123-45-67" });
  expect(done.onboardingComplete).toBe(true);
  expect(done.name).toBe("Анна");
  expect(done.phone).toBe("+79001234567");
});

test("reset token works; bad token fails", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.requestPasswordReset("a@mail.ru");
  const tokenKey = [...Array(storage.length)].map((_, i) => storage.key(i)).find((k) => k?.startsWith("gs.reset."));
  const token = tokenKey!.replace("gs.reset.", "");
  await auth.confirmPasswordReset(token, "newpass12");
  await auth.login("a@mail.ru", "newpass12");
  await expect(auth.confirmPasswordReset("bad", "newpass13")).rejects.toThrow("Ссылка недействительна");
});

test("session has no password after logout", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.logout();
  expect(storage.getItem(SESSION_KEY)).toBeNull();
});
