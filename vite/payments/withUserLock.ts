const tails = new Map<string, Promise<void>>();

/** Очередь на пользователя внутри процесса: два зачисления не читают баланс одновременно. */
export function withUserLock<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = tails.get(userId) ?? Promise.resolve();
  const run = previous.then(task, task);
  tails.set(userId, run.then(() => undefined, () => undefined));
  return run;
}
