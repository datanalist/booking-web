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
  const track = checked
    ? "border-0 bg-[#f88a2a]"
    : "border-2 border-solid border-[#f88a2a] bg-white";
  const knob = checked
    ? "top-0 left-5 border-[#f88a2a]"
    : "top-[-2px] left-[-2px] border-[#f88a2a]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative box-border h-6 w-[44px] shrink-0 rounded-[1000px] p-0 ${track} ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      <span
        aria-hidden
        className={`absolute size-6 rounded-[1000px] border-2 border-solid bg-white ${knob}`}
      />
    </button>
  );
}
