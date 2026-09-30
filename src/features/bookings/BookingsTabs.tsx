import {
  BOOKING_TABS,
  type BookingTabId,
} from "./domain/BookingTabId";

type BookingsTabsProps = {
  value: BookingTabId;
  onChange: (id: BookingTabId) => void;
};

export function BookingsTabs({ value, onChange }: BookingsTabsProps) {
  return (
    <div className="flex border-b border-orange-200 font-sans" role="tablist">
      {BOOKING_TABS.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`w-40 cursor-pointer border-0 bg-transparent p-2.5 text-center text-sm font-normal leading-5 ${
              selected
                ? "border-b-2 border-black text-black"
                : "text-neutral-600"
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
