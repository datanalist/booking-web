/** Срок вызова истёк. Отдельно от сетевой ошибки, чтобы текст для человека задавал вызывающий код. */
export class DeadlineError extends Error {
  constructor() {
    super("timeout");
    this.name = "DeadlineError";
  }
}

export function isDeadlineError(error: unknown): boolean {
  return error instanceof DeadlineError
    || (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"));
}

/**
 * Ждёт `work` не дольше `timeoutMs`.
 * Сигнал передаётся в fetch, а таймер всё равно отклоняет ожидание, если тело ответа зависло после заголовков.
 */
export function withDeadline<T>(
  timeoutMs: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const signal = AbortSignal.timeout(timeoutMs);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DeadlineError()), timeoutMs);
    let pending: Promise<T>;
    try {
      pending = work(signal);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
      return;
    }
    pending.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
