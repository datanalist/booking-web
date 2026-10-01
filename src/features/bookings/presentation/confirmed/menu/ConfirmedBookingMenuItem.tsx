import type { LucideIcon } from "lucide-react";

export type ConfirmedBookingMenuItemTone = "default" | "danger";

type ConfirmedBookingMenuItemProps = {
  icon: LucideIcon;
  label: string;
  tone?: ConfirmedBookingMenuItemTone;
  onSelect: () => void;
};

const TONE_CLASS: Record<ConfirmedBookingMenuItemTone, string> = {
  default: "text-absolute-black",
  danger: "text-red-500",
};

export function ConfirmedBookingMenuItem({
  icon: Icon,
  label,
  tone = "default",
  onSelect,
}: ConfirmedBookingMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={`inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 font-sans text-sm leading-5 ${TONE_CLASS[tone]}`}
    >
      <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.5} />
      {label}
    </button>
  );
}
