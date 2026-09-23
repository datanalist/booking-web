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
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center font-sans">
      {illustration ? <div aria-hidden>{illustration}</div> : null}
      <h2 className="m-0 text-[20px] font-bold text-[var(--color-text)]">
        {title}
      </h2>
      {description ? (
        <p className="m-0 max-w-md text-[14px] text-[#757575]">{description}</p>
      ) : null}
    </div>
  );
}
