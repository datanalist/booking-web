import { Search } from "lucide-react";

type BookingsGuestSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function BookingsGuestSearch({
  value,
  onChange,
}: BookingsGuestSearchProps) {
  return (
    <label className="flex h-10 w-80 shrink-0 items-center gap-3 overflow-hidden rounded-lg bg-amber-400/5 px-3.5 py-2.5 font-sans outline outline-1 outline-offset-[-1px] outline-neutral-600">
      <Search
        aria-hidden
        className="size-4 shrink-0 text-[var(--color-ink)]"
        strokeWidth={1.75}
      />
      <input
        type="search"
        value={value}
        placeholder="Введите имя или номер гостя"
        aria-label="Введите имя или номер гостя"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5 text-[var(--color-ink)] outline-none placeholder:text-neutral-600"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
