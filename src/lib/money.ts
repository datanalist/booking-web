import { SERVICE_COMMISSION_RATE } from "../config";

/**
 * Whole rubles (RUB). Domain money unit for listing daily prices.
 * Prefer constructing via `rub()` so invalid amounts become a safe zero.
 */
export type Rub = number & { readonly __rubBrand: unique symbol };

export function rub(amount: number): Rub {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0 as Rub;
  }
  return Math.round(amount) as Rub;
}

export function formatRub(amount: Rub | number): string {
  const value = rub(typeof amount === "number" ? amount : amount);
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function commissionOf(base: number): Rub {
  return rub(Math.round(base * SERVICE_COMMISSION_RATE));
}

export function clientPriceOf(base: number): Rub {
  return rub(base + Number(commissionOf(base)));
}
