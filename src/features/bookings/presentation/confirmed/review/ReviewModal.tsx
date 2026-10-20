import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { BookingReview } from "./BookingReview";
import type { ReviewDraft } from "./ReviewDraft";
import { ReviewCommentField } from "./ReviewCommentField";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { parseBookingReview } from "./parseBookingReview";
import { useDialogFocusTrap } from "../dialog/useDialogFocusTrap";
import { usePortalElement } from "../../../../../app/stagePortal";

type ReviewModalProps = {
  booking: ConfirmedBooking;
  onClose: () => void;
  onSubmit: (review: BookingReview) => void;
};

const EMPTY_DRAFT: ReviewDraft = { rating: null, comment: "" };

const CARD_CLASS =
  "flex w-96 max-w-[calc(100%-2rem)] flex-col gap-10 rounded-xl bg-absolute-white p-6 font-sans shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)] outline-none";

const BUTTON_BASE =
  "flex-1 cursor-pointer rounded-lg px-6 py-5 font-sans text-lg font-bold tracking-tight";

export function ReviewModal({ booking, onClose, onSubmit }: ReviewModalProps) {
  const [draft, setDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  const review = parseBookingReview(booking.id, draft);
  const portal = usePortalElement();

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-600/70"
      onClick={(event) => {
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
        className={CARD_CLASS}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2
              id={titleId}
              className="m-0 text-2xl font-bold leading-7 text-absolute-black"
            >
              Оставить отзыв
            </h2>
            <button
              type="button"
              aria-label="Закрыть"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2.5 text-neutral-600 hover:bg-neutral-600/10"
              onClick={onClose}
            >
              <X aria-hidden className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <img
              src={booking.guestAvatarUrl}
              alt=""
              width={80}
              height={80}
              className="size-20 rounded-full object-cover"
            />
            <span className="text-base leading-6 text-absolute-black">
              {booking.guestName}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="m-0 w-64 text-center text-base font-bold leading-5 text-absolute-black">
              Насколько вам понравилось сдавать жилье клиенту?
            </p>
            <ReviewRatingStars
              value={draft.rating}
              onChange={(rating) => setDraft({ ...draft, rating })}
            />
          </div>

          <ReviewCommentField
            value={draft.comment}
            onChange={(comment) => setDraft({ ...draft, comment })}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className={`${BUTTON_BASE} bg-transparent text-orange-400 outline outline-1 outline-offset-[-1px] outline-orange-400`}
            onClick={onClose}
          >
            Вернуться
          </button>
          <button
            type="button"
            disabled={review === null}
            className={`${BUTTON_BASE} disabled:cursor-not-allowed ${
              review === null
                ? "bg-transparent text-orange-400 opacity-40 outline outline-1 outline-offset-[-1px] outline-orange-400"
                : "border-0 bg-orange-400 text-absolute-white"
            }`}
            onClick={() => {
              if (review !== null) {
                onSubmit(review);
              }
            }}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>,
    portal,
  );
}
