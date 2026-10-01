import type { BookingStay } from "../stay/BookingStay";

export type ConfirmedBookingRequest =
  | { kind: "cancel" }
  | {
      kind: "changeDates";
      proposedStay: BookingStay;
      proposedPriceLabel: string;
    };

export type ConfirmedBookingRequestKind = ConfirmedBookingRequest["kind"];
