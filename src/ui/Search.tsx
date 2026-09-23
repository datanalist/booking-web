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
    <input
      type="search"
      className="h-10 w-full max-w-md rounded-[8px] border border-[#d0d0d0] px-3 font-sans text-[14px] outline-none focus:border-[var(--color-accent)]"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
