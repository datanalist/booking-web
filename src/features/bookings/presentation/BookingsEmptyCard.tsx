import { EmptyState } from "../../../ui/EmptyState";
import type { BookingEmptyCopy } from "../bookingEmptyCopy";
import { BookingsEmptyIllustration } from "./BookingsEmptyIllustration";

type BookingsEmptyCardProps = {
  copy: BookingEmptyCopy;
};

export function BookingsEmptyCard({ copy }: BookingsEmptyCardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-amber-400/20 bg-white">
      <EmptyState
        title={copy.title}
        description={copy.description}
        illustration={<BookingsEmptyIllustration />}
      />
    </div>
  );
}
