function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (normalized.length % 4)) % 4;
  return atob(normalized + "=".repeat(pad));
}

/** `exp` JWT в миллисекундах. У строки без claim `exp` срока нет. */
export function pbTokenExpiresAtMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (payload === undefined || payload.length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payload));
    if (typeof parsed !== "object" || parsed === null || !("exp" in parsed)) {
      return null;
    }
    const exp = parsed.exp;
    if (typeof exp !== "number" || !Number.isFinite(exp)) {
      return null;
    }
    return exp * 1000;
  } catch {
    return null;
  }
}

/** Истёк, если в токене есть `exp` и он уже наступил. Токен без `exp` не трогаем. */
export function isPbTokenExpired(token: string, now = Date.now()): boolean {
  const exp = pbTokenExpiresAtMs(token);
  if (exp === null) {
    return false;
  }
  return exp <= now;
}
