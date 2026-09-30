type BookingsEmptyPanelProps = {
  title: string;
  description: string;
};

export function BookingsEmptyPanel({
  title,
  description,
}: BookingsEmptyPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
      <div className="flex flex-col items-center justify-center gap-6 text-center font-sans">
        <div aria-hidden>
          <img
            src="/listings-empty.svg"
            alt=""
            width={214}
            height={200}
            className="mb-0"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="m-0 text-[24px] font-bold text-[var(--color-ink)]">
            {title}
          </h2>
          <p className="m-0 max-w-md text-[16px] leading-[1.45] text-[#525353]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
