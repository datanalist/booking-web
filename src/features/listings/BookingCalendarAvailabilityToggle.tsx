import type { ReactElement } from "react";

/** Переключатель «Доступно для бронирования»: только вид и aria, без данных. */
export function BookingCalendarAvailabilityToggle(): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked
      aria-label="доступно для бронирования"
      className="relative h-6 w-[44px] shrink-0 cursor-pointer overflow-hidden rounded-[1000px] border-0 bg-[#f88a2a] p-0"
    >
      <span
        aria-hidden
        className="absolute top-0 left-5 size-6 rounded-[1000px] border-2 border-solid border-[#f88a2a] bg-white"
      />
    </button>
  );
}
