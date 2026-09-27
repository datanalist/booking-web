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
    <div className="flex border-b border-[#ffe4b8] font-sans" role="tablist">
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`w-[160px] cursor-pointer border-0 bg-transparent p-[10px] text-[14px] font-normal ${
              selected
                ? "border-b-2 border-[var(--color-ink)] text-[var(--color-ink)]"
                : "text-[#525353]"
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
