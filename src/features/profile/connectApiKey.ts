/**
 * Мок подключения ключа TravelLine: настоящего API нет.
 * `connected` — непустая строка из цифр длиной от 6; иначе `error`.
 */
export type ConnectApiKeyResult =
  | { status: "connected" }
  | { status: "error" };

const CONNECTED_KEY = /^\d{6,}$/;

export function connectApiKey(key: string): ConnectApiKeyResult {
  const trimmed = key.trim();
  if (CONNECTED_KEY.test(trimmed)) {
    return { status: "connected" };
  }
  return { status: "error" };
}
