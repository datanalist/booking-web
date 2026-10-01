import type { ReactElement } from "react";

type ListingPreviewNumberedLinesProps = {
  lines: string[];
};

/** Нумерованный список строк (доступ / правила проживания). */
export function ListingPreviewNumberedLines({
  lines,
}: ListingPreviewNumberedLinesProps): ReactElement {
  return (
    <ol className="m-0 flex list-decimal flex-col gap-2 py-0 pl-5 text-sm leading-[1.4] text-[var(--color-ink)]">
      {lines.map((line) => (
        <li key={line} className="pl-1">
          {line}
        </li>
      ))}
    </ol>
  );
}
