import type { LucideIcon } from "lucide-react";

type AmenityChipProps = {
  label: string;
  selected: boolean;
  icon: LucideIcon;
  onToggle: () => void;
};

export function AmenityChip({
  label,
  selected,
  icon: Icon,
  onToggle,
}: AmenityChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[30px] border border-solid px-3 py-2 font-sans text-[16px] leading-[1.45] transition-colors ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
          : "border-[#525353] bg-white text-[#525353]"
      }`}
    >
      <Icon
        aria-hidden
        className="size-5 shrink-0"
        strokeWidth={1.75}
      />
      <span>{label}</span>
    </button>
  );
}
