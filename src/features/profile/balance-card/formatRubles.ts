const NBSP = "\u00A0";

const GROUPING_SEPARATOR = /[\u00A0\u202F\u2009 ]/g;

/** Целые рубли: группы разрядов и знак ₽ через неразрывный пробел. */
export function formatRubles(amountRub: number): string {
  const grouped = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amountRub);
  const digits = grouped.replace(GROUPING_SEPARATOR, NBSP);
  return `${digits}${NBSP}₽`;
}
