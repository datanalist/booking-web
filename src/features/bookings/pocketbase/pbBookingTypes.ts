export const PB_BOOKING_STATUSES = [
  "pending_host",
  "awaiting_prepayment",
  "confirmed",
  "completed",
  "cancel_requested",
  "change_requested",
  "cancelled",
] as const;

export type PbBookingStatus = (typeof PB_BOOKING_STATUSES)[number];

export const PB_CANCEL_REASONS = [
  "",
  "guest",
  "host",
  "host_timeout",
  "prepay_timeout",
] as const;

export type PbCancelReason = (typeof PB_CANCEL_REASONS)[number];

export type PbBookingGuest = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
};

export type PbBookingListing = {
  id: string;
  title?: string;
  city?: string;
  address?: string;
  photos?: readonly string[];
};

export type PbBookingRecord = {
  id: string;
  listing: string;
  guest: string;
  host: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  pets: number;
  guest_note: string;
  total: number;
  prepay: number;
  remainder: number;
  commission: number;
  host_amount: number;
  prepaid_at: string;
  status: PbBookingStatus;
  cancel_reason: PbCancelReason;
  cancel_comment: string;
  host_respond_until: string;
  prepay_until: string;
  requested_check_in: string;
  requested_check_out: string;
  expand?: {
    guest?: PbBookingGuest;
    listing?: PbBookingListing;
  };
};

export const PB_REVIEW_KINDS = ["listing", "guest"] as const;

export type PbReviewKind = (typeof PB_REVIEW_KINDS)[number];

export type PbReviewRating = 1 | 2 | 3 | 4 | 5;

export type PbReviewRecord = {
  booking: string;
  author: string;
  listing?: string;
  subject?: string;
  kind: PbReviewKind;
  rating: PbReviewRating;
  comment: string;
};

export type PbReviewCreatePayload = {
  kind: "guest";
  booking: string;
  author: string;
  subject?: string;
  listing?: string;
  rating: PbReviewRating;
  comment: string;
};

export type PbAcceptBookingPayload = {
  status: "awaiting_prepayment";
};

export type PbHostCancelPayload = {
  status: "cancelled";
  cancel_reason: "host";
  cancel_comment: string;
};

export type PbResolveBookingRequestPayload =
  | { status: "cancelled"; cancel_reason: "guest" }
  | { status: "confirmed" }
  | { status: "confirmed"; check_in: string; check_out: string }
  | {
      status: "confirmed";
      requested_check_in: "";
      requested_check_out: "";
    };
