import { expect, test, vi } from "vitest";
import type { PbFetch } from "./pbClient";
import { completeTelegramLogin, oauthRedirectUrl, type TelegramPopup, type TelegramRealtime } from "./telegramLogin";

const authURL = "https://oauth.telegram.org/auth?client_id=1&scope=openid+email+profile&state=old&redirect_uri=";

function popup(): TelegramPopup {
  return { location: { href: "" }, closed: false, close: vi.fn() };
}

function realtime(code: Record<string, unknown>): TelegramRealtime & { close: ReturnType<typeof vi.fn> } {
  return {
    clientId: "rt-1",
    waitFor: vi.fn(async () => code),
    close: vi.fn(),
  };
}

function fetchFn(calls: { url: string; body: string }[]): PbFetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, body: typeof init?.body === "string" ? init.body : "" });
    if (url.endsWith("/auth-methods")) {
      return new Response(JSON.stringify({
        oauth2: { providers: [{ name: "oidc", authURL, codeVerifier: "verifier" }] },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      token: "tg-token",
      record: { id: "user-tg" },
    }), { status: 200 });
  };
}

test("oauthRedirectUrl ставит state соединения и scope без email", () => {
  const url = oauthRedirectUrl(authURL, "https://pb.example/api/oauth2-redirect", "rt-1", ["openid", "profile"]);
  const params = new URL(url).searchParams;
  expect(params.get("state")).toBe("rt-1");
  expect(params.get("scope")).toBe("openid profile");
  expect(params.get("scope")).not.toContain("email");
  expect(params.get("redirect_uri")).toBe("https://pb.example/api/oauth2-redirect");
});

test("вход через Telegram создаёт хозяина и возвращает токен", async () => {
  const calls: { url: string; body: string }[] = [];
  const windowPopup = popup();
  const link = realtime({ state: "rt-1", code: "auth-code" });
  const result = await completeTelegramLogin({
    baseUrl: "https://pb.example",
    fetchFn: fetchFn(calls),
    popup: windowPopup,
    openRealtime: async () => link,
  });
  expect(result.token).toBe("tg-token");
  expect(new URL(windowPopup.location.href).searchParams.get("scope")).toBe("openid profile");
  const exchange = calls.find((call) => call.url.endsWith("/auth-with-oauth2"));
  expect(JSON.parse(exchange?.body ?? "{}")).toMatchObject({
    provider: "oidc",
    code: "auth-code",
    codeVerifier: "verifier",
    redirectURL: "https://pb.example/api/oauth2-redirect",
    createData: { roles: ["host"], account_status: "active" },
  });
  expect(link.close).toHaveBeenCalled();
  expect(windowPopup.close).toHaveBeenCalled();
});

test("чужой state не обменивается на токен", async () => {
  const windowPopup = popup();
  await expect(completeTelegramLogin({
    baseUrl: "https://pb.example",
    fetchFn: fetchFn([]),
    popup: windowPopup,
    openRealtime: async () => realtime({ state: "other", code: "auth-code" }),
  })).rejects.toThrow("Ответ Telegram не совпал с запросом входа");
  expect(windowPopup.close).toHaveBeenCalled();
});
