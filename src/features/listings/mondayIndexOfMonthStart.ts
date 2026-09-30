import type { YearMonth } from "./YearMonth";

/** Индекс дня недели 1-го числа: 0 — понедельник, 6 — воскресенье. */
export function mondayIndexOfMonthStart(month: YearMonth): number {
  const sundayBased = new Date(
    Date.UTC(month.year, month.month - 1, 1),
  ).getUTCDay();
  return (sundayBased + 6) % 7;
}
