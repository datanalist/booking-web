import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import type { YearMonth } from "./YearMonth";

/** Календарный день месяца как `YYYY-MM-DD`, либо null если дата невозможна. */
export function toIsoDate(month: YearMonth, day: number): IsoDate | null {
  const year = String(month.year).padStart(4, "0");
  const monthText = String(month.month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return parseIsoDate(`${year}-${monthText}-${dayText}`);
}
