import { X } from "lucide-react";

type BookingRequestModalHeaderProps = {
  titleId: string;
  title: string;
  description: string;
  onClose: () => void;
};

export function BookingRequestModalHeader({
  titleId,
  title,
  description,
  onClose,
}: BookingRequestModalHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h2
          id={titleId}
          className="m-0 text-2xl font-bold leading-7 text-absolute-black"
        >
          {title}
        </h2>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="-m-2.5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2.5 text-absolute-black"
        >
          <X aria-hidden className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <p className="m-0 text-base leading-6 text-absolute-black">
        {description}
      </p>
    </header>
  );
}
