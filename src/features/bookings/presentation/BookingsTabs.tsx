type BookingsTabItem = {
  id: string;
  label: string;
};

type BookingsTabsProps = {
  items: readonly BookingsTabItem[];
  value: string;
  onChange: (id: string) => void;
};

export function BookingsTabs({ items, value, onChange }: BookingsTabsProps) {
  return (
    <div
      className="flex border-b border-orange-200 font-sans"
      role="tablist"
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`w-40 cursor-pointer border-0 bg-transparent p-2.5 text-sm font-normal ${
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
