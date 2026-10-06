import type { LucideIcon } from "lucide-react";

export type ConfirmedBookingMenuItemTone = "default" | "danger" | "muted";

type ConfirmedBookingMenuItemProps = {
  icon: LucideIcon;
  label: string;
  tone?: ConfirmedBookingMenuItemTone;
  /** Without a handler the item is an inert marker (e.g. «Отзыв оставлен»). */
  onSelect?: () => void;
  iconClassName?: string;
};

const TONE_CLASS: Record<ConfirmedBookingMenuItemTone, string> = {
  default: "text-absolute-black",
  danger: "text-red-500",
  muted: "text-neutral-600",
};

export function ConfirmedBookingMenuItem({
  icon: Icon,
  label,
  tone = "default",
  onSelect,
  iconClassName = "",
}: ConfirmedBookingMenuItemProps) {
  const interactive = onSelect !== undefined;
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={interactive ? undefined : true}
      onClick={onSelect}
      className={`inline-flex items-center gap-3 whitespace-nowrap border-0 bg-transparent p-0 font-sans text-sm leading-5 ${TONE_CLASS[tone]} ${
        interactive ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <Icon
        aria-hidden
        className={`size-6 shrink-0 ${iconClassName}`}
        strokeWidth={1.5}
      />
      {label}
    </button>
  );
}
