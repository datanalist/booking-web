import { describe, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../keys";
import { createPbClient } from "./pbClient";
import { PB_TOKEN_KEY } from "./pbSession";
import { createPbAuthApi } from "./createPbAuthApi";

const user = {
  id: "user1",
  email: "host@example.com",
  verified: true,
  name: "Анна Иваненко",
  first_name: "Анна",
  last_name: "Иваненко",
  birthdate: "",
  phone: "+79001234567",
  avatar: "",
  limited_browse: false,
  bio: "",
  roles: ["host"],
  account_status: "active",
  verified_host: false,
  years_hosting: 0,
  rating: 0,
  reviews_count: 0,
  balance: 1000,
  created: "",
  updated: "",
};

function storage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key); },
    setItem: (key, value) => { items.set(key, value); },
  };
}

describe("createPbAuthApi", () => {
  test("login пишет токен и сессию кабинета", async () => {
    const box = storage();
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({ token: "tok", record: user }), { status: 200 }),
    });
    const session = await createPbAuthApi({ client, storage: box }).login("host@example.com", "password1");
    expect(session.userId).toBe("user1");
    expect(session.balance).toBe(1000);
    expect(box.getItem(PB_TOKEN_KEY)).toBe("tok");
    expect(box.getItem(SESSION_KEY)).toContain("host@example.com");
  });

  test("Telegram пишет токен без почты и оставляет онбординг", async () => {
    const box = storage();
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response("{}", { status: 200 }),
    });
    client.authWithTelegram = async () => ({
      token: "tg-token",
      record: { ...user, email: "", phone: "", name: "Иван" },
    });
    const session = await createPbAuthApi({ client, storage: box }).loginWithTelegram({
      id_token: "header.payload.signature",
      nonce: "nonce-1",
    });
    expect(session.email).toBe("");
    expect(session.name).toBe("Иван");
    expect(session.onboardingComplete).toBe(false);
    expect(box.getItem(PB_TOKEN_KEY)).toBe("tg-token");
  });

  test("logout стирает токен и сессию", async () => {
    const box = storage();
    box.setItem(PB_TOKEN_KEY, "tok");
    box.setItem(SESSION_KEY, "{}");
    const client = createPbClient({ baseUrl: "https://pb.example", fetchFn: async () => new Response("{}", { status: 200 }) });
    await createPbAuthApi({ client, storage: box }).logout();
    expect(box.getItem(PB_TOKEN_KEY)).toBeNull();
    expect(box.getItem(SESSION_KEY)).toBeNull();
  });

  test("отказ auth-with-password становится INVALID_CREDENTIALS", async () => {
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({ message: "Failed to authenticate." }), { status: 400 }),
    });
    await expect(createPbAuthApi({ client, storage: storage() }).login("a@b.c", "password1"))
      .rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  test("register создаёт хозяина, запрашивает письмо и не входит", async () => {
    const calls: { url: string; body: string }[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        calls.push({ url, body: typeof init?.body === "string" ? init.body : "" });
        return new Response(JSON.stringify({ id: "user1" }), { status: 200 });
      },
    });
    const box = storage();
    const result = await createPbAuthApi({ client, storage: box }).register("Host@Example.com", "pass.word,;");
    expect(result).toEqual({ email: "host@example.com" });
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual({
      email: "host@example.com",
      password: "pass.word,;",
      passwordConfirm: "pass.word,;",
      roles: ["host"],
      account_status: "active",
    });
    expect(calls[1]?.url).toContain("/api/collections/users/request-verification");
    expect(JSON.parse(calls[1]?.body ?? "")).toEqual({ email: "host@example.com" });
    expect(box.getItem(PB_TOKEN_KEY)).toBeNull();
    expect(box.getItem(SESSION_KEY)).toBeNull();
  });

  test("register при отказе письма не открывает сессию", async () => {
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("request-verification")) {
          return new Response(JSON.stringify({ message: "mail down" }), { status: 500 });
        }
        return new Response(JSON.stringify({ id: "user1" }), { status: 200 });
      },
    });
    const box = storage();
    await expect(
      createPbAuthApi({ client, storage: box }).register("host@example.com", "pass.word,;"),
    ).rejects.toThrow("Не удалось отправить письмо. Попробуйте ещё раз");
    expect(box.getItem(PB_TOKEN_KEY)).toBeNull();
    expect(box.getItem(SESSION_KEY)).toBeNull();
  });

  test("login при неподтверждённой почте бросает EMAIL_NOT_VERIFIED и не пишет токен", async () => {
    const box = storage();
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({
        token: "tok",
        record: { ...user, verified: false },
      }), { status: 200 }),
    });
    await expect(
      createPbAuthApi({ client, storage: box }).login("host@example.com", "password1"),
    ).rejects.toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
      message: "Подтвердите почту по кнопке в письме",
    });
    expect(box.getItem(PB_TOKEN_KEY)).toBeNull();
    expect(box.getItem(SESSION_KEY)).toBeNull();
  });

  test("login превращает 400 с текстом про почту в EMAIL_NOT_VERIFIED", async () => {
    const box = storage();
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({
        message: "Подтвердите почту по кнопке в письме",
      }), { status: 400 }),
    });
    await expect(
      createPbAuthApi({ client, storage: box }).login("host@example.com", "password1"),
    ).rejects.toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
      message: "Подтвердите почту по кнопке в письме",
    });
    expect(box.getItem(PB_TOKEN_KEY)).toBeNull();
    expect(box.getItem(SESSION_KEY)).toBeNull();
  });

  test("register на ответ 400 с email в теле даёт EMAIL_TAKEN", async () => {
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({
        message: "Failed to create record.",
        data: { email: { code: "validation_not_unique", message: "Value must be unique." } },
      }), { status: 400 }),
    });
    await expect(createPbAuthApi({ client, storage: storage() }).register("host@example.com", "password1"))
      .rejects.toMatchObject({
        code: "EMAIL_TAKEN",
        message: "Такой email уже зарегистрирован",
      });
  });

  test("updateProfile шлёт PATCH с name и phone", async () => {
    const box = storage();
    box.setItem(SESSION_KEY, JSON.stringify({
      userId: "user1",
      email: "host@example.com",
      name: "Анна Иваненко",
      phone: "+79001234567",
      onboardingComplete: true,
    }));
    const calls: { method: string; body: string }[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (_input, init) => {
        calls.push({
          method: init?.method ?? "",
          body: typeof init?.body === "string" ? init.body : "",
        });
        return new Response(JSON.stringify({
          ...user,
          name: "Мария Петрова",
          first_name: "Мария",
          last_name: "Петрова",
          phone: "+79001112233",
        }), { status: 200 });
      },
    });
    const session = await createPbAuthApi({ client, storage: box }).updateProfile({
      name: "Мария Петрова",
      phone: "+7 (900) 111-22-33",
      email: "host@example.com",
    });
    const patch = calls.find((call) => call.method === "PATCH");
    expect(JSON.parse(patch?.body ?? "")).toEqual({
      name: "Мария Петрова",
      first_name: "Мария",
      last_name: "Петрова",
      phone: "+79001112233",
    });
    expect(session.name).toBe("Мария Петрова");
    expect(session.phone).toBe("+79001112233");
    expect(box.getItem(SESSION_KEY)).toContain("Мария Петрова");
  });

  test("data URL уходит файлом avatar, пустой photoUrl сбрасывает его", async () => {
    const box = storage();
    box.setItem(SESSION_KEY, JSON.stringify({
      userId: "user1",
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      onboardingComplete: true,
    }));
    const bodies: Array<FormData | string> = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (_input, init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Content-Type")).toBeNull();
        if (init?.body instanceof FormData) {
          bodies.push(init.body);
        }
        return new Response(JSON.stringify({ ...user, avatar: "avatar.png" }), { status: 200 });
      },
    });
    await createPbAuthApi({ client, storage: box }).updateProfile({
      name: "Анна",
      phone: "+79001234567",
      email: "host@example.com",
      photoUrl: "data:image/png;base64,YQ==",
    });
    const form = bodies[0];
    expect(form).toBeInstanceOf(FormData);
    expect(form?.get("name")).toBe("Анна");
    expect(form?.get("phone")).toBe("+79001234567");
    const avatar = form?.get("avatar");
    expect(avatar).toBeInstanceOf(Blob);
    expect(avatar instanceof File ? avatar.name : "").toBe("avatar.png");

    const jsonBodies: string[] = [];
    const clearing = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (_input, init) => {
        if (typeof init?.body === "string") {
          jsonBodies.push(init.body);
        }
        return new Response(JSON.stringify({ ...user, avatar: "" }), { status: 200 });
      },
    });
    const cleared = await createPbAuthApi({ client: clearing, storage: box }).updateProfile({
      name: "Анна",
      phone: "+79001234567",
      email: "host@example.com",
      photoUrl: "",
    });
    expect(JSON.parse(jsonBodies[0] ?? "")).toMatchObject({
      name: "Анна",
      phone: "+79001234567",
      avatar: "",
    });
    expect(cleared.photoUrl).toBeUndefined();
  });

  test("смена email пишет pending-адрес поверх записи и не вызывает getRecord", async () => {
    const box = storage();
    box.setItem(SESSION_KEY, JSON.stringify({
      userId: "user1",
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      onboardingComplete: true,
    }));
    const methods: string[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        methods.push(`${init?.method ?? ""} ${url}`);
        if (url.includes("change-email")) {
          return new Response(JSON.stringify({ email: "next@example.com", pending: true }), { status: 200 });
        }
        return new Response(JSON.stringify(user), { status: 200 });
      },
    });
    const session = await createPbAuthApi({ client, storage: box }).updateProfile({
      name: "Анна",
      phone: "+79001234567",
      email: "Next@Example.com",
    });
    expect(session.email).toBe("next@example.com");
    expect(box.getItem(SESSION_KEY)).toContain("next@example.com");
    expect(methods.some((call) => call.startsWith("GET "))).toBe(false);
    expect(methods.some((call) => call.includes("/records/user1") && call.startsWith("PATCH "))).toBe(true);
    expect(methods.some((call) => call.includes("change-email"))).toBe(true);
  });
});
