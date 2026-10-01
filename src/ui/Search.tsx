type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function Search({
  value,
  onChange,
  placeholder = "Поиск",
}: SearchProps) {
  return (
    <label className="relative block h-10 w-full font-sans">
      <span className="sr-only">{placeholder}</span>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#525353]"
      >
        <path
          d="M9 15.5A6.5 6.5 0 1 0 9 2.5a6.5 6.5 0 0 0 0 13Zm7 1.5-3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="search"
        className="h-10 w-full rounded-[8px] border border-[#d0d0d0] bg-white py-2 pr-3 pl-9 text-[14px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
