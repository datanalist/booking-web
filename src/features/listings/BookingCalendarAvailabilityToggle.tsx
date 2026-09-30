import type { ReactElement } from "react";

type BookingCalendarAvailabilityToggleProps = {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
};

/** Переключатель доступности выбранного дня. Включён — день можно бронировать. */
export function BookingCalendarAvailabilityToggle({
  checked,
  disabled,
  label,
  onToggle,
}: BookingCalendarAvailabilityToggleProps): ReactElement {
  const track = checked ? "bg-[#f88a2a]" : "bg-[#e4e4e4]";
  const knob = checked
    ? "left-5 border-[#f88a2a]"
    : "left-0 border-[#e4e4e4]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-[44px] shrink-0 overflow-hidden rounded-[1000px] border-0 p-0 ${track} ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0 size-6 rounded-[1000px] border-2 border-solid bg-white ${knob}`}
      />
    </button>
  );
}
