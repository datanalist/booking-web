type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
};

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-2 font-sans" role="tablist">
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rounded-full px-4 py-2 text-[14px] font-normal cursor-pointer border-0 ${
              selected
                ? "bg-[var(--color-accent)] text-white"
                : "bg-transparent text-[var(--color-text)]"
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
