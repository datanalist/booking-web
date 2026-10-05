import type { YearMonth } from "./YearMonth";

/** Соседний месяц. `delta` — только шаг на один месяц. */
export function shiftYearMonth(month: YearMonth, delta: -1 | 1): YearMonth {
  const absolute = month.year * 12 + (month.month - 1) + delta;
  const year = Math.floor(absolute / 12);
  const monthIndex = absolute - year * 12;
  return { year, month: monthIndex + 1 };
}
