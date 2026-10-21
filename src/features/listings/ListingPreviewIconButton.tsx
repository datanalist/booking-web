import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

type ListingPreviewIconButtonProps = {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
};

/** Круглая иконка-кнопка шапки предпросмотра (outline orange-400). */
export function ListingPreviewIconButton({
  label,
  icon: Icon,
  disabled = false,
  onClick,
}: ListingPreviewIconButtonProps): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[var(--color-accent)] bg-white p-2 text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon aria-hidden className="size-6" strokeWidth={1.75} />
    </button>
  );
}
