import type { YearMonth } from "./YearMonth";

const NOMINATIVE_MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

/** Заголовок месяца: «Декабрь 2024». */
export function formatYearMonthLabel(month: YearMonth): string {
  const name = NOMINATIVE_MONTHS[month.month - 1];
  if (name === undefined) {
    return String(month.year);
  }
  return `${name} ${month.year}`;
}
