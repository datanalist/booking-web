import { Star } from "lucide-react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { resolveReviewMenuItem } from "../review/resolveReviewMenuItem";
import { useBookingReview } from "../review/useBookingReview";
import { ConfirmedBookingMenuItem } from "./ConfirmedBookingMenuItem";

type ReviewMenuItemProps = {
  booking: ConfirmedBooking;
  onSelect: () => void;
};

/** «Оставить отзыв» for a finished stay; turns into an inert «Отзыв оставлен» once reviewed. */
export function ReviewMenuItem({ booking, onSelect }: ReviewMenuItemProps) {
  const review = useBookingReview(booking.id);
  const state = resolveReviewMenuItem(booking.status, review !== undefined);
  switch (state) {
    case "hidden":
      return null;
    case "submitted":
      return (
        <ConfirmedBookingMenuItem
          icon={Star}
          label="Отзыв оставлен"
          tone="muted"
          iconClassName="fill-orange-400 text-orange-400"
        />
      );
    case "available":
      return (
        <ConfirmedBookingMenuItem
          icon={Star}
          label="Оставить отзыв"
          onSelect={onSelect}
        />
      );
  }
}
