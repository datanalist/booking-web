import type { YearMonth } from "./YearMonth";

const GENITIVE_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

/** Подпись выбранного дня: «15 декабря». */
export function formatCalendarDayLabel(month: YearMonth, day: number): string {
  const name = GENITIVE_MONTHS[month.month - 1];
  if (name === undefined) {
    return String(day);
  }
  return `${day} ${name}`;
}
