import type { CalendarDayMark } from "./CalendarDayMark";

export type DayAvailabilityControl = {
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
};

/** Подпись и состояние переключателя по отметке выбранного дня. */
export function dayAvailabilityControl(
  mark: CalendarDayMark,
): DayAvailabilityControl {
  if (mark.kind === "booked") {
    return { label: "забронировано", checked: false, disabled: true };
  }
  if (mark.kind === "unavailable") {
    return {
      label: "недоступно для бронирования",
      checked: false,
      disabled: false,
    };
  }
  return {
    label: "доступно для бронирования",
    checked: true,
    disabled: false,
  };
}
