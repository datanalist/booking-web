import type { YearMonth } from "./YearMonth";

/** Число дней в месяце, включая 29 февраля високосного года. */
export function daysInYearMonth(month: YearMonth): number {
  return new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
}
