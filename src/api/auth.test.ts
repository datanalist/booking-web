import { expect, test } from "vitest";
import { createAuthApi } from "./auth";
import { emptyDraft } from "../lib/emptyDraft";
import { MemoryStorage } from "../lib/memoryStorage";
import { createListingsApi } from "./listings";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "./keys";
import type { UserRecord } from "./types";

function api() {
  return createAuthApi(new MemoryStorage());
}

test("register does not open a session", async () => {
  localStorage.clear();
  const auth = createAuthApi(localStorage);
  const result = await auth.register("A@Mail.ru", "secret12");
  expect(result).toEqual({ email: "a@mail.ru" });
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  const session = await auth.login("a@mail.ru", "secret12");
  expect(session.email).toBe("a@mail.ru");
  localStorage.clear();
});

test("login rejects an unverified user", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  const users = JSON.parse(storage.getItem(USERS_KEY) ?? "[]") as UserRecord[];
  const user = users[0];
  if (user === undefined) {
    throw new Error("пользователь не создан");
  }
  user.verified = false;
  storage.setItem(USERS_KEY, JSON.stringify(users));
  await expect(auth.login("a@mail.ru", "secret12")).rejects.toMatchObject({
    code: "EMAIL_NOT_VERIFIED",
    message: "Подтвердите почту по кнопке в письме",
  });
  expect(storage.getItem(SESSION_KEY)).toBeNull();
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
  await auth.login("a@mail.ru", "secret12");
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

test("updateProfile rewrites the user and session and keeps userId", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  const session = await auth.login("a@mail.ru", "secret12");
  await auth.completeOnboarding({ name: "Анна", phone: "+7 (900) 123-45-67" });
  const next = await auth.updateProfile({
    name: "  Мария  ",
    phone: "+7 (900) 111-22-33",
    email: "New@Mail.ru",
    photoUrl: "data:image/png;base64,new",
  });
  expect(next.userId).toBe(session.userId);
  expect(next.name).toBe("Мария");
  expect(next.phone).toBe("+79001112233");
  expect(next.email).toBe("new@mail.ru");
  expect(next.photoUrl).toBe("data:image/png;base64,new");
  expect(next.onboardingComplete).toBe(true);
  expect(storage.getItem(SESSION_KEY)).toContain("\"email\":\"new@mail.ru\"");
  await auth.logout();
  const again = await auth.login("new@mail.ru", "secret12");
  expect(again.userId).toBe(session.userId);
  expect(again.photoUrl).toBe("data:image/png;base64,new");
});

test("updateProfile rejects invalid name, phone and email", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  await auth.login("a@mail.ru", "secret12");
  await expect(
    auth.updateProfile({ name: "А", phone: "+79001234567", email: "a@mail.ru" }),
  ).rejects.toMatchObject({ code: "INVALID_NAME" });
  await expect(
    auth.updateProfile({ name: "Анна", phone: "123", email: "a@mail.ru" }),
  ).rejects.toMatchObject({ code: "INVALID_PHONE" });
  await expect(
    auth.updateProfile({ name: "Анна", phone: "+79001234567", email: "not-an-email" }),
  ).rejects.toMatchObject({ code: "INVALID_EMAIL" });
});

test("updateProfile rejects an email taken by another user", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.register("b@mail.ru", "secret12");
  await auth.login("b@mail.ru", "secret12");
  await expect(
    auth.updateProfile({
      name: "Борис",
      phone: "+79001234567",
      email: "A@mail.ru",
    }),
  ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  expect(storage.getItem(SESSION_KEY)).toContain("\"email\":\"b@mail.ru\"");
});

test("updateProfile removes the photo when photoUrl is omitted", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.login("a@mail.ru", "secret12");
  await auth.completeOnboarding({
    name: "Анна",
    phone: "+79001234567",
    photo: "data:image/png;base64,old",
  });
  const next = await auth.updateProfile({
    name: "Анна",
    phone: "+79001234567",
    email: "a@mail.ru",
  });
  expect(next).not.toHaveProperty("photoUrl");
  const sessionRaw = storage.getItem(SESSION_KEY) ?? "";
  const usersRaw = storage.getItem(USERS_KEY) ?? "";
  expect(sessionRaw).not.toContain("photoUrl");
  expect(usersRaw).not.toContain("photoUrl");
});

test("updateProfile keeps listings on userId and reset tokens on the new email", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  const session = await auth.login("a@mail.ru", "secret12");
  await auth.completeOnboarding({ name: "Анна", phone: "+79001234567" });
  storage.setItem(
    LISTINGS_KEY,
    JSON.stringify([{ ...emptyDraft(session.userId), id: "lst-1" }]),
  );
  const token = await auth.requestPasswordReset("a@mail.ru");
  await auth.updateProfile({
    name: "Анна",
    phone: "+79001234567",
    email: "b@mail.ru",
  });
  const listings = createListingsApi(storage, () => session.userId);
  const listing = await listings.get("lst-1");
  expect(listing.ownerId).toBe(session.userId);
  await auth.confirmPasswordReset(token, "newpass12");
  const again = await auth.login("b@mail.ru", "newpass12");
  expect(again.userId).toBe(session.userId);
});

test("session has no password after logout", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.login("a@mail.ru", "secret12");
  await auth.logout();
  expect(storage.getItem(SESSION_KEY)).toBeNull();
});
