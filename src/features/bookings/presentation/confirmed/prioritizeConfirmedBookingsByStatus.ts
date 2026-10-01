import type { ConfirmedBooking } from "./ConfirmedBooking";
import type { ConfirmedBookingStatusKind } from "./confirmedBookingStatus";

export function prioritizeConfirmedBookingsByStatus(
  items: readonly ConfirmedBooking[],
  selected: readonly ConfirmedBookingStatusKind[],
): ConfirmedBooking[] {
  if (selected.length === 0) {
    return [...items];
  }

  const selectedKinds = new Set<ConfirmedBookingStatusKind>(selected);
  const preferred: ConfirmedBooking[] = [];
  const rest: ConfirmedBooking[] = [];

  for (const item of items) {
    if (selectedKinds.has(item.status.kind)) {
      preferred.push(item);
    } else {
      rest.push(item);
    }
  }

  return [...preferred, ...rest];
}
