import { blockRangesToBookingOverrides } from "../../api/pocketbase/listingBlocksMapper";
import { photosFromPb } from "../../api/pocketbase/listingPhotos";
import type { PbListingBlockRecord } from "../../api/pocketbase/pbTypes";
import {
  formatGuestName,
  formatGuestPhone,
  formatListingAddress,
  pbFileUrl,
  stayFromRecord,
} from "../bookings/pocketbase/pbBookingDisplay";
import { isoDayKey } from "../bookings/pocketbase/pbBookingTime";
import type { PbBookingListing, PbBookingRecord, PbBookingStatus } from "../bookings/pocketbase/pbBookingTypes";
import { formatNights } from "../bookings/presentation/confirmed/stay/formatNights";
import { formatStayLong } from "../bookings/presentation/confirmed/stay/formatStayLong";
import type {
  BookingCalendarDemo,
  BookingCalendarGuest,
  BookingCalendarGuestTone,
  BookingCalendarMonthMarks,
  BookingCalendarRange,
} from "./bookingCalendarDemo";
import { daysInYearMonth } from "./daysInYearMonth";
import { toIsoDate } from "./toIsoDate";
import type { YearMonth } from "./YearMonth";

const TONES: readonly BookingCalendarGuestTone[] = ["purple", "green", "blue"];
const USERS_COLLECTION = "users";
const AVATAR_PLACEHOLDER = "/avatar-placeholder.png";

/** Статусы, при которых даты брони занимают календарь хозяина. Отменённые не показываем. */
const CALENDAR_STATUSES = new Set<PbBookingStatus>([
  "pending_host",
  "awaiting_prepayment",
  "confirmed",
  "completed",
  "cancel_requested",
  "change_requested",
]);

export type ListingBookingCalendarData = {
  baseUrl: string;
  records: readonly PbBookingRecord[];
  listing: PbBookingListing | null;
  blocks: readonly PbListingBlockRecord[];
};

export const EMPTY_LISTING_BOOKING_CALENDAR: ListingBookingCalendarData = {
  baseUrl: "",
  records: [],
  listing: null,
  blocks: [],
};

export type ListingBookingCalendarViewModel = {
  content: BookingCalendarDemo;
  marks: BookingCalendarMonthMarks;
};

/**
 * Брони и блокировки объявления → карточки гостей и отметки открытого месяца.
 * Закрашенные дни — ночи [заезд, выезд): утро выезда свободно для следующей брони.
 */
export function bookingCalendarFromBookings(
  data: ListingBookingCalendarData,
  month: YearMonth,
): ListingBookingCalendarViewModel {
  const stays = calendarStays(data.records);
  const ranges: BookingCalendarRange[] = [];
  const guests: BookingCalendarGuest[] = [];

  stays.forEach((stay, index) => {
    const tone = TONES[index % TONES.length] ?? "purple";
    const clipped = nightsInMonth(stay.checkIn, stay.checkOut, month);
    if (clipped === null) {
      return;
    }
    ranges.push({ fromDay: clipped.fromDay, toDay: clipped.toDay, tone });
    guests.push(guestCard(stay.record, stay, tone, data.baseUrl));
  });

  return {
    content: {
      ...listingSummary(data.listing, data.baseUrl),
      guests,
    },
    marks: {
      year: month.year,
      month: month.month,
      unavailableDays: blockedDaysInMonth(data.blocks, month),
      ranges,
    },
  };
}

type StayRow = {
  record: PbBookingRecord;
  checkIn: string;
  checkOut: string;
};

function calendarStays(records: readonly PbBookingRecord[]): StayRow[] {
  const stays: StayRow[] = [];
  for (const record of records) {
    if (!CALENDAR_STATUSES.has(record.status)) {
      continue;
    }
    const stay = stayFromRecord(record.check_in, record.check_out);
    if (stay === null) {
      continue;
    }
    stays.push({ record, checkIn: stay.checkIn, checkOut: stay.checkOut });
  }
  stays.sort((left, right) => {
    if (left.checkIn !== right.checkIn) {
      return left.checkIn < right.checkIn ? -1 : 1;
    }
    return left.record.id < right.record.id ? -1 : left.record.id > right.record.id ? 1 : 0;
  });
  return stays;
}

function nightsInMonth(
  checkIn: string,
  checkOut: string,
  month: YearMonth,
): { fromDay: number; toDay: number } | null {
  const last = daysInYearMonth(month);
  let fromDay = 0;
  let toDay = 0;
  for (let day = 1; day <= last; day += 1) {
    const date = toIsoDate(month, day);
    if (date === null || date < checkIn || date >= checkOut) {
      continue;
    }
    if (fromDay === 0) {
      fromDay = day;
    }
    toDay = day;
  }
  if (fromDay === 0) {
    return null;
  }
  return { fromDay, toDay };
}

function guestCard(
  record: PbBookingRecord,
  stay: StayRow,
  tone: BookingCalendarGuestTone,
  baseUrl: string,
): BookingCalendarGuest {
  const guest = record.expand?.guest;
  const guestId = guest?.id.trim() || record.guest;
  const avatar = pbFileUrl(baseUrl, USERS_COLLECTION, guestId, guest?.avatar);
  const name = formatGuestName(guest);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const booked = stayFromRecord(stay.checkIn, stay.checkOut);
  return {
    id: record.id,
    name: name === "" ? "Гость" : name,
    phone: formatGuestPhone(guest?.phone),
    dates: booked === null ? "" : formatStayLong(booked),
    nights: formatNights(nights),
    avatarUrl: avatar === "" ? AVATAR_PLACEHOLDER : avatar,
    tone,
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = isoDayKey(checkIn);
  const end = isoDayKey(checkOut);
  const startUtc = Date.UTC(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10)),
  );
  const endUtc = Date.UTC(
    Number(end.slice(0, 4)),
    Number(end.slice(5, 7)) - 1,
    Number(end.slice(8, 10)),
  );
  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
}

function listingSummary(
  listing: PbBookingListing | null,
  baseUrl: string,
): Pick<BookingCalendarDemo, "listingTitle" | "listingAddress" | "listingCoverUrl"> {
  if (listing === null) {
    return { listingTitle: "", listingAddress: "", listingCoverUrl: "" };
  }
  const photos = photosFromPb([...(listing.photos ?? [])], listing.id, baseUrl);
  return {
    listingTitle: listing.title?.trim() ?? "",
    listingAddress: formatListingAddress(listing),
    listingCoverUrl: photos[0] ?? "",
  };
}

function blockedDaysInMonth(
  blocks: readonly PbListingBlockRecord[],
  month: YearMonth,
): number[] {
  const blocked = blockRangesToBookingOverrides(blocks).blocked;
  const days: number[] = [];
  const last = daysInYearMonth(month);
  for (let day = 1; day <= last; day += 1) {
    const date = toIsoDate(month, day);
    if (date !== null && blocked.has(date)) {
      days.push(day);
    }
  }
  return days;
}
