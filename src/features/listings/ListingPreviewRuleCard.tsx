import type { ReactElement } from "react";

type ListingPreviewRuleCardProps = {
  label: string;
  value: string;
};

/** Плашка правила жилья на предпросмотре. */
export function ListingPreviewRuleCard({
  label,
  value,
}: ListingPreviewRuleCardProps): ReactElement {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-solid border-amber-400/20 bg-amber-400/5 p-3 text-sm leading-[1.4]">
      <p className="m-0 text-neutral-600">{label}</p>
      <p className="m-0 font-bold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
