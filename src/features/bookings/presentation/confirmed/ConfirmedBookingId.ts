/** Identifier of a confirmed booking; not interchangeable with arbitrary strings. */
export type ConfirmedBookingId = string & {
  readonly __brand: "ConfirmedBookingId";
};

export function confirmedBookingId(raw: string): ConfirmedBookingId {
  if (raw === "") {
    throw new Error("Confirmed booking id must not be empty");
  }
  // Safe: the only way to build the brand is this checked constructor.
  return raw as ConfirmedBookingId;
}
