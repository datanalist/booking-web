import type { LucideIcon } from "lucide-react";

type ConfirmedBookingMenuItemProps = {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
};

export function ConfirmedBookingMenuItem({
  icon: Icon,
  label,
  onSelect,
}: ConfirmedBookingMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 font-sans text-sm leading-5 text-absolute-black"
    >
      <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.5} />
      {label}
    </button>
  );
}
