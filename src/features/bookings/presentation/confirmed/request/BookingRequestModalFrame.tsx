import { useId, useRef, type ReactNode } from "react";
import { BookingRequestGuestSection } from "./BookingRequestGuestSection";
import { BookingRequestHousingSection } from "./BookingRequestHousingSection";
import { BookingRequestModalFooter } from "./BookingRequestModalFooter";
import { BookingRequestModalHeader } from "./BookingRequestModalHeader";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";
import type { RequestDecision } from "./RequestDecision";
import { useDialogFocusTrap } from "../dialog/useDialogFocusTrap";

type BookingRequestModalFrameProps = {
  title: string;
  description: string;
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
  /** Request-specific sections rendered after "Жилье" and "Клиент". */
  children?: ReactNode;
};

/** Shared shell of the request modals: overlay, card, header, housing/guest blocks, footer. */
export function BookingRequestModalFrame({
  title,
  description,
  booking,
  onClose,
  onDecision,
  children,
}: BookingRequestModalFrameProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-600/70 font-sans"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[calc(100%-2rem)] w-96 max-w-[calc(100%-2rem)] flex-col gap-10 overflow-y-auto rounded-xl bg-absolute-white p-6 shadow-[0px_8px_8px_-4px_rgba(16,24,40,0.03),0px_20px_24px_-4px_rgba(16,24,40,0.08)] outline-none"
      >
        <div className="flex flex-col gap-8">
          <BookingRequestModalHeader
            titleId={titleId}
            title={title}
            description={description}
            onClose={onClose}
          />
          <BookingRequestHousingSection booking={booking} />
          <BookingRequestGuestSection booking={booking} />
          {children}
        </div>
        <BookingRequestModalFooter onDecision={onDecision} />
      </div>
    </div>
  );
}
