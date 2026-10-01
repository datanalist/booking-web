/**
 * Пишет ключ в Storage; при любой ошибке записи (QuotaExceeded и др.) — false.
 * Сужение через instanceof DOMException / Error, без проброса наружу.
 */
export function trySetStorageItem(
  storage: Storage,
  key: string,
  value: string,
): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException || error instanceof Error) {
      return false;
    }
    return false;
  }
}
