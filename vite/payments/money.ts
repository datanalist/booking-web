/** Сложение рублей через копейки, чтобы не копить ошибку float. */
export function addRubles(balanceRub: number, amountRub: number): number {
  const balance = Math.round(balanceRub * 100);
  const amount = Math.round(amountRub * 100);
  return (balance + amount) / 100;
}

export function sameRubles(left: number, right: number): boolean {
  return Math.round(left * 100) === Math.round(right * 100);
}

/** Строка ЮKassa: два знака после точки. */
export function yookassaAmountValue(amountRub: number): string {
  return amountRub.toFixed(2);
}
