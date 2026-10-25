export type BookingCalendarGuestTone = "purple" | "green" | "blue";

export type BookingCalendarGuest = {
  id: string;
  name: string;
  phone: string;
  dates: string;
  nights: string;
  avatarUrl: string;
  tone: BookingCalendarGuestTone;
};

export type BookingCalendarRange = {
  readonly fromDay: number;
  readonly toDay: number;
  readonly tone: BookingCalendarGuestTone;
};

export type BookingCalendarMonthMarks = {
  readonly year: number;
  readonly month: number;
  readonly unavailableDays: readonly number[];
  readonly ranges: readonly BookingCalendarRange[];
};

export type BookingCalendarDemo = {
  listingTitle: string;
  listingAddress: string;
  listingCoverUrl: string;
  guests: readonly BookingCalendarGuest[];
};
