import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  illustration?: ReactNode;
};

export function EmptyState({
  title,
  description,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center font-sans">
      {illustration ? <div aria-hidden>{illustration}</div> : null}
      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 text-[24px] font-bold text-[var(--color-ink)]">
          {title}
        </h2>
        {description ? (
          <p className="m-0 text-[16px] leading-[1.45] text-[#525353]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
