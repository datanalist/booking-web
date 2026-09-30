/** Извлекает строковый `code` с ошибки API без слепых кастов. */
export function errorCodeOf(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }
  if (!("code" in error)) {
    return null;
  }
  const code: unknown = error.code;
  return typeof code === "string" ? code : null;
}
