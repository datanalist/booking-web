import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

type ListingPreviewAmenityPillProps = {
  label: string;
  icon: LucideIcon;
};

/** Пилюля удобства на предпросмотре (outline orange, только отображение). */
export function ListingPreviewAmenityPill({
  label,
  icon: Icon,
}: ListingPreviewAmenityPillProps): ReactElement {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-[30px] border border-solid border-[var(--color-accent)] px-3 py-2 font-sans text-[14px] leading-[1.4] text-[var(--color-accent)]">
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      <span>{label}</span>
    </span>
  );
}
