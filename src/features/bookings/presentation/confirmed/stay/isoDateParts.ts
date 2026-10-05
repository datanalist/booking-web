import type { IsoDate } from "./IsoDate";

export type IsoDateParts = {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
};

export function isoDateParts(date: IsoDate): IsoDateParts {
  const [year = "", month = "", day = ""] = date.split("-");
  return { year: Number(year), month: Number(month), day: Number(day) };
}
