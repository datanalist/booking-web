export type BookingRequestId = string & {
  readonly __brand: "BookingRequestId";
};

export function bookingRequestId(value: string): BookingRequestId {
  return value as BookingRequestId;
}

export type BookingRequest = {
  id: BookingRequestId;
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  listingTitle: string;
  listingAddress: string;
  listingPhotoUrl: string;
  datesLabel: string;
  priceLabel: string;
};
