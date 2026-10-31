/** Общий разбор суммы. Файл не должен импортировать секреты или серверные модули. */

const MIN_RUB = 1;
const MAX_RUB = 1_000_000;

export type TopupAmount =
  | { ok: true; rubles: number }
  | { ok: false; message: string };

function reject(message: string): TopupAmount {
  return { ok: false, message };
}

function inRange(rubles: number): TopupAmount {
  if (!Number.isInteger(rubles) || rubles < MIN_RUB || rubles > MAX_RUB) {
    return reject("Введите сумму от 1 до 1 000 000 ₽");
  }
  return { ok: true, rubles };
}

/** Целые рубли: как поле `users.balance` и подпись на карточке. */
export function parseTopupAmount(raw: unknown): TopupAmount {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
      return reject("Введите сумму в целых рублях");
    }
    return inRange(raw);
  }
  if (typeof raw !== "string") {
    return reject("Введите сумму");
  }
  const trimmed = raw.trim();
  if (!/^[1-9]\d{0,6}$/.test(trimmed)) {
    return reject("Введите сумму в целых рублях");
  }
  return inRange(Number(trimmed));
}
