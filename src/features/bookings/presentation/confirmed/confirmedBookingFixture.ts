import type { ConfirmedBooking } from "./ConfirmedBooking";
import { confirmedBookingId } from "./ConfirmedBookingId";
import type {
  ConfirmedBookingStatus,
  ConfirmedBookingStatusKind,
} from "./confirmedBookingStatus";
import { bookingStay } from "./stay/BookingStay";

/** Test fixture: a status of the given kind with neutral payload. */
export function statusFixture(
  kind: ConfirmedBookingStatusKind,
): ConfirmedBookingStatus {
  switch (kind) {
    case "awaitingPrepayment":
      return { kind, remainingLabel: "осталось 1 час" };
    case "request":
      return {
        kind,
        previousStatus: { kind: "prepaymentPaid" },
        request: { kind: "cancel" },
      };
    case "prepaymentPaid":
    case "stayCompleted":
    case "staying":
      return { kind };
  }
}

/** Test fixture: a confirmed booking whose guest name equals its id. */
export function confirmedBookingFixture(
  id: string,
  status: ConfirmedBookingStatus,
): ConfirmedBooking {
  return {
    id: confirmedBookingId(id),
    guestName: id,
    guestPhone: "+7 (900) 123-45-67",
    guestAvatarUrl: "/a.png",
    housingTitle: "Жильё",
    housingAddress: "Адрес",
    housingPhotoUrl: "/h.jpg",
    stay: bookingStay("2024-12-05", "2024-12-10"),
    priceLabel: "15 460 ₽",
    status,
  };
}
