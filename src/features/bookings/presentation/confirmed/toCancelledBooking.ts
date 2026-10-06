import type { CancelledBooking } from "../cancelled/CancelledBooking";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { parseRubLabel } from "./parseRubLabel";
import { formatStayTable } from "./stay/formatStayTable";

/**
 * Snapshot of a confirmed booking for the «Отменены» tab (guest, housing, dates, price).
 * The tab has no column for reason or initiator, so they are not stored.
 */
export function toCancelledBooking(booking: ConfirmedBooking): CancelledBooking {
  return {
    id: booking.id,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestAvatarUrl: booking.guestAvatarUrl,
    housingTitle: booking.housingTitle,
    housingAddress: booking.housingAddress,
    housingPhotoUrl: booking.housingPhotoUrl,
    datesLabel: formatStayTable(booking.stay),
    price: parseRubLabel(booking.priceLabel),
  };
}
