export type RejectedBookingId = string & {
  readonly __brand: "RejectedBookingId";
};

export function rejectedBookingId(value: string): RejectedBookingId {
  return value as RejectedBookingId;
}

export type RejectedBooking = {
  id: RejectedBookingId;
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  listingTitle: string;
  listingAddress: string;
  listingPhotoUrl: string;
  datesLabel: string;
  priceLabel: string;
};
