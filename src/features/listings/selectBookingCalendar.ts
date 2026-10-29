import { photosFromPb } from "../../api/pocketbase/listingPhotos";
import { formatGuestName, formatGuestPhone, pbFileUrl } from "../bookings/pocketbase/pbBookingDisplay";
import { isoDayKey } from "../bookings/pocketbase/pbBookingTime";
import type { PbBookingRecord, PbBookingStatus } from "../bookings/pocketbase/pbBookingTypes";
import { formatNights } from "../bookings/presentation/confirmed/stay/formatNights";
import type { BookingCalendarDemo, BookingCalendarGuestTone, BookingCalendarMonthMarks, BookingCalendarRange } from "./bookingCalendarDemo";
import { formatCalendarDayLabel } from "./formatCalendarDayLabel";
import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import type { YearMonth } from "./YearMonth";
import type { BookingCalendarLoad } from "./loadBookingCalendar";

/** Статусы, которые занимают даты в хуке `occupied-dates`. */
export const BOOKING_CALENDAR_OCCUPYING_STATUSES = [
  "pending_host",
  "awaiting_prepayment",
  "confirmed",
  "change_requested",
] as const satisfies readonly PbBookingStatus[];

const OCCUPYING = new Set<string>(BOOKING_CALENDAR_OCCUPYING_STATUSES);

const TONES: readonly BookingCalendarGuestTone[] = ["purple", "green", "blue"];

const COVER_FALLBACK = "/booking-listing-studio.svg";
const AVATAR_FALLBACK = "/avatar-placeholder.png";
const USERS_COLLECTION = "users";

export type BookingCalendarSelection = {
  panel: BookingCalendarDemo;
  marks: BookingCalendarMonthMarks;
};

type StayRange = {
  readonly start: IsoDate;
  readonly end: IsoDate;
};

type OccupyingStay = {
  readonly record: PbBookingRecord;
  readonly tone: BookingCalendarGuestTone;
  readonly display: StayRange;
  readonly ranges: readonly StayRange[];
};

/** Шапка, строки гостей и отметки дней месяца из записи объявления и его броней. */
export function selectBookingCalendar(
  load: BookingCalendarLoad,
  month: YearMonth,
): BookingCalendarSelection {
  const stays = occupyingStays(load.bookings).filter((stay) =>
    stay.ranges.some((range) => overlapsMonth(range, month)),
  );
  return {
    panel: {
      listingTitle: load.listing?.title.trim() ?? "",
      listingAddress: formatListingAddress(load.listing?.city ?? "", load.listing?.address ?? ""),
      listingCoverUrl: coverUrl(load),
      guests: stays.map((stay) => toGuest(stay, load.baseUrl)),
    },
    marks: {
      year: month.year,
      month: month.month,
      unavailableDays: [],
      ranges: stays.flatMap((stay) => monthRanges(stay, month)),
    },
  };
}

function occupyingStays(bookings: readonly PbBookingRecord[]): OccupyingStay[] {
  const stays: { record: PbBookingRecord; display: StayRange; ranges: StayRange[]; sortKey: string }[] = [];
  for (const record of bookings) {
    if (!OCCUPYING.has(record.status)) {
      continue;
    }
    const ranges = occupancyRanges(record);
    const display = displayRange(record);
    if (ranges.length === 0 || display === null) {
      continue;
    }
    stays.push({
      record,
      display,
      ranges,
      sortKey: `${ranges[0]?.start ?? display.start}\t${record.id}`,
    });
  }
  stays.sort((left, right) => (left.sortKey < right.sortKey ? -1 : left.sortKey > right.sortKey ? 1 : 0));
  return stays.map((stay, index) => ({
    record: stay.record,
    display: stay.display,
    ranges: stay.ranges,
    tone: TONES[index % TONES.length] ?? "purple",
  }));
}

function occupancyRanges(record: PbBookingRecord): StayRange[] {
  const ranges: StayRange[] = [];
  const primary = parseStay(record.check_in, record.check_out);
  if (primary !== null) {
    ranges.push(primary);
  }
  const requested = parseStay(record.requested_check_in, record.requested_check_out);
  if (requested !== null && !sameStay(primary, requested)) {
    ranges.push(requested);
  }
  return ranges;
}

function displayRange(record: PbBookingRecord): StayRange | null {
  return parseStay(record.check_in, record.check_out)
    ?? parseStay(record.requested_check_in, record.requested_check_out);
}

function toGuest(stay: OccupyingStay, baseUrl: string): BookingCalendarDemo["guests"][number] {
  const guest = stay.record.expand?.guest;
  const guestId = guest?.id.trim() || stay.record.guest.trim();
  const avatar = pbFileUrl(baseUrl, USERS_COLLECTION, guestId, guest?.avatar);
  const nights = nightsBetween(stay.display.start, stay.display.end);
  return {
    id: stay.record.id,
    name: formatGuestName(guest),
    phone: formatGuestPhone(guest?.phone),
    dates: formatStayDates(stay.display.start, stay.display.end),
    nights: formatNights(nights),
    avatarUrl: avatar === "" ? AVATAR_FALLBACK : avatar,
    tone: stay.tone,
  };
}

function monthRanges(stay: OccupyingStay, month: YearMonth): BookingCalendarRange[] {
  const ranges: BookingCalendarRange[] = [];
  for (const range of stay.ranges) {
    const clipped = clipNights(range, month);
    if (clipped === null) {
      continue;
    }
    ranges.push({ fromDay: clipped.fromDay, toDay: clipped.toDay, tone: stay.tone });
  }
  return ranges;
}

function coverUrl(load: BookingCalendarLoad): string {
  const listing = load.listing;
  if (listing === null) {
    return COVER_FALLBACK;
  }
  const photos = photosFromPb(listing.photos, listing.id, load.baseUrl);
  return photos[0] ?? COVER_FALLBACK;
}

function formatListingAddress(city: string, address: string): string {
  const trimmedCity = city.trim();
  const trimmedAddress = address.trim();
  const cityAlreadyInAddress = trimmedCity !== ""
    && trimmedAddress.toLowerCase().includes(trimmedCity.toLowerCase());
  if (trimmedCity !== "" && trimmedAddress !== "" && !cityAlreadyInAddress) {
    return `${trimmedCity}, ${trimmedAddress}`;
  }
  return trimmedAddress !== "" ? trimmedAddress : trimmedCity;
}

function formatStayDates(start: IsoDate, end: IsoDate): string {
  const startMonth = yearMonthOf(start);
  const endMonth = yearMonthOf(end);
  const startDay = dayOf(start);
  const endDay = dayOf(end);
  if (startMonth.year === endMonth.year && startMonth.month === endMonth.month) {
    const label = formatCalendarDayLabel(startMonth, startDay);
    const space = label.indexOf(" ");
    const genitive = space === -1 ? label : label.slice(space + 1);
    return `${startDay}-${endDay} ${genitive}`;
  }
  return `${formatCalendarDayLabel(startMonth, startDay)} – ${formatCalendarDayLabel(endMonth, endDay)}`;
}

function clipNights(range: StayRange, month: YearMonth): { fromDay: number; toDay: number } | null {
  const bounds = monthBounds(month);
  const lastNight = addDays(range.end, -1);
  const from = range.start > bounds.start ? range.start : bounds.start;
  const to = lastNight < bounds.last ? lastNight : bounds.last;
  if (from > to) {
    return null;
  }
  return { fromDay: dayOf(from), toDay: dayOf(to) };
}

function overlapsMonth(range: StayRange, month: YearMonth): boolean {
  const bounds = monthBounds(month);
  return range.start < bounds.next && range.end > bounds.start;
}

function parseStay(checkIn: string, checkOut: string): StayRange | null {
  const start = parseIsoDate(isoDayKey(checkIn));
  const end = parseIsoDate(isoDayKey(checkOut));
  if (start === null || end === null || start >= end) {
    return null;
  }
  return { start, end };
}

function sameStay(left: StayRange | null, right: StayRange): boolean {
  return left !== null && left.start === right.start && left.end === right.end;
}

function nightsBetween(start: IsoDate, end: IsoDate): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

function yearMonthOf(date: IsoDate): YearMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

function dayOf(date: IsoDate): number {
  return Number(date.slice(8, 10));
}

function monthBounds(month: YearMonth): { start: IsoDate; next: IsoDate; last: IsoDate } {
  const start = mustIso(month.year, month.month, 1);
  const next = month.month === 12
    ? mustIso(month.year + 1, 1, 1)
    : mustIso(month.year, month.month + 1, 1);
  return { start, next, last: addDays(next, -1) };
}

function addDays(date: IsoDate, days: number): IsoDate {
  const utc = new Date(Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)) + days,
  ));
  const parsed = parseIsoDate(utc.toISOString().slice(0, 10));
  if (parsed === null) {
    throw new Error("INVALID_DATE");
  }
  return parsed;
}

function mustIso(year: number, month: number, day: number): IsoDate {
  const parsed = parseIsoDate(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
  if (parsed === null) {
    throw new Error("INVALID_DATE");
  }
  return parsed;
}
