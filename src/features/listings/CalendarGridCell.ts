import type { CalendarDayMark } from "./CalendarDayMark";

/** Ячейка сетки: пустой отступ или день текущего месяца. */
export type CalendarGridCell =
  | { readonly kind: "pad" }
  | {
      readonly kind: "day";
      readonly day: number;
      readonly mark: CalendarDayMark;
    };
