import { isRecord } from "./isRecord";
import type { PbAuthResult, PbFetch } from "./pbClient";

export const TELEGRAM_PROVIDER = "oidc";
export const TELEGRAM_SCOPES = ["openid", "profile"] as const;

const OAUTH_TOPIC = "@oauth2";
const LOGIN_TIMEOUT_MS = 180_000;

export type TelegramPopup = {
  readonly closed: boolean;
  location: { href: string };
  close(): void;
};

export type TelegramRealtime = {
  clientId: string;
  waitFor(topic: string): Promise<Record<string, unknown>>;
  close(): void;
};

type OidcProvider = {
  authURL: string;
  codeVerifier: string;
};

export function oauthRedirectUrl(
  authURL: string,
  redirectURL: string,
  state: string,
  scopes: readonly string[],
): string {
  const joined = authURL + encodeURIComponent(redirectURL);
  const queryIndex = joined.indexOf("?");
  const path = queryIndex >= 0 ? joined.slice(0, queryIndex) : joined;
  const params = new URLSearchParams(queryIndex >= 0 ? joined.slice(queryIndex + 1) : "");
  params.set("state", state);
  params.set("scope", scopes.join(" "));
  return `${path}?${params.toString()}`;
}

export async function completeTelegramLogin(input: {
  baseUrl: string;
  fetchFn: PbFetch;
  popup: TelegramPopup;
  openRealtime?: (baseUrl: string, fetchFn: PbFetch) => Promise<TelegramRealtime>;
}): Promise<PbAuthResult> {
  const openRealtime = input.openRealtime ?? openPocketBaseRealtime;
  const redirectURL = `${input.baseUrl}/api/oauth2-redirect`;
  const realtime = await openRealtime(input.baseUrl, input.fetchFn);
  try {
    const provider = await loadOidcProvider(input.baseUrl, input.fetchFn);
    const code = await navigateAndWait(input.popup, realtime, provider, redirectURL);
    return await exchangeCode(input.baseUrl, input.fetchFn, provider.codeVerifier, redirectURL, code);
  } finally {
    realtime.close();
    input.popup.close();
  }
}

export function openPocketBaseRealtime(baseUrl: string, fetchFn: PbFetch): Promise<TelegramRealtime> {
  return new Promise((resolve, reject) => {
    const source = new EventSource(`${baseUrl}/api/realtime`);
    let opened = false;
    const fail = (message: string): void => {
      source.close();
      reject(new Error(message));
    };
    source.onerror = () => {
      if (!opened) {
        fail("Не удалось открыть соединение с PocketBase");
      }
    };
    source.addEventListener("PB_CONNECT", (event) => {
      void submitRealtime(baseUrl, fetchFn, source, event as MessageEvent)
        .then((realtime) => {
          opened = true;
          resolve(realtime);
        })
        .catch((error: unknown) => {
          source.close();
          reject(error instanceof Error ? error : new Error("PocketBase не принял подписку на вход"));
        });
    });
  });
}

async function navigateAndWait(
  popup: TelegramPopup,
  realtime: TelegramRealtime,
  provider: OidcProvider,
  redirectURL: string,
): Promise<string> {
  const pending = waitForCode(realtime, popup);
  popup.location.href = oauthRedirectUrl(provider.authURL, redirectURL, realtime.clientId, TELEGRAM_SCOPES);
  return pending;
}

function waitForCode(realtime: TelegramRealtime, popup: TelegramPopup): Promise<string> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (callback: () => void): void => {
      if (done) {
        return;
      }
      done = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      callback();
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error("Окно входа Telegram закрыто")));
      }
    }, 400);
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("Время входа через Telegram истекло")));
    }, LOGIN_TIMEOUT_MS);
    realtime.waitFor(OAUTH_TOPIC).then((data) => {
      finish(() => {
        try {
          resolve(readOAuthCode(data, realtime.clientId));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Не удалось войти через Telegram"));
        }
      });
    }).catch((error: unknown) => {
      finish(() => reject(error instanceof Error ? error : new Error("Не удалось войти через Telegram")));
    });
  });
}

function readOAuthCode(data: Record<string, unknown>, clientId: string): string {
  if (data.state !== clientId) {
    throw new Error("Ответ Telegram не совпал с запросом входа");
  }
  if (typeof data.error === "string" && data.error.length > 0) {
    throw new Error("Telegram отклонил вход");
  }
  if (typeof data.code !== "string" || data.code.length === 0) {
    throw new Error("Telegram не вернул код входа");
  }
  return data.code;
}

async function loadOidcProvider(baseUrl: string, fetchFn: PbFetch): Promise<OidcProvider> {
  const body = await readJson(await fetchFn(`${baseUrl}/api/collections/users/auth-methods`, { method: "GET" }));
  return readOidcProvider(body);
}

async function exchangeCode(
  baseUrl: string,
  fetchFn: PbFetch,
  codeVerifier: string,
  redirectURL: string,
  code: string,
): Promise<PbAuthResult> {
  const body = await readJson(await fetchFn(`${baseUrl}/api/collections/users/auth-with-oauth2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: TELEGRAM_PROVIDER,
      code,
      codeVerifier,
      redirectURL,
      createData: { roles: ["host"], account_status: "active" },
    }),
  }));
  if (!isRecord(body) || typeof body.token !== "string" || !isRecord(body.record)) {
    throw new Error("Некорректный ответ авторизации");
  }
  return { token: body.token, record: body.record };
}

async function submitRealtime(
  baseUrl: string,
  fetchFn: PbFetch,
  source: EventSource,
  event: MessageEvent,
): Promise<TelegramRealtime> {
  const clientId = event.lastEventId;
  if (clientId.length === 0) {
    throw new Error("PocketBase не выдал идентификатор соединения");
  }
  const response = await fetchFn(`${baseUrl}/api/realtime`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, subscriptions: [OAUTH_TOPIC] }),
  });
  if (!response.ok) {
    throw new Error("PocketBase не принял подписку на вход");
  }
  return {
    clientId,
    waitFor: (topic) => waitForTopic(source, topic),
    close: () => source.close(),
  };
}

function waitForTopic(source: EventSource, topic: string): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    source.addEventListener(topic, (event) => {
      resolve(parseEventData((event as MessageEvent).data));
    });
  });
}

function parseEventData(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string") {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readOidcProvider(value: unknown): OidcProvider {
  if (!isRecord(value) || !isRecord(value.oauth2) || !Array.isArray(value.oauth2.providers)) {
    throw new Error("PocketBase не отдал способы входа");
  }
  const provider = value.oauth2.providers.find((item) => isRecord(item) && item.name === TELEGRAM_PROVIDER);
  if (!isRecord(provider) || typeof provider.authURL !== "string" || typeof provider.codeVerifier !== "string") {
    throw new Error("В PocketBase не включён вход через Telegram");
  }
  return { authURL: provider.authURL, codeVerifier: provider.codeVerifier };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  const body: unknown = text.length === 0 ? null : JSON.parse(text);
  if (!response.ok) {
    const message = isRecord(body) && typeof body.message === "string"
      ? body.message
      : "PocketBase отклонил вход через Telegram";
    throw new Error(message);
  }
  return body;
}
