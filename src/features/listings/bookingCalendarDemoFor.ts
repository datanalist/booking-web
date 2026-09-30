import {
  BOOKING_CALENDAR_GUEST_TEMPLATES,
  type BookingCalendarDemo,
} from "./bookingCalendarDemo";
import { formatCalendarDayLabel } from "./formatCalendarDayLabel";
import type { YearMonth } from "./YearMonth";

/** Карточки гостей с теми же днями, что и отметки, и названием месяца `today`. */
export function bookingCalendarDemoFor(today: Date): BookingCalendarDemo {
  const month: YearMonth = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  };
  const genitive = genitiveMonthName(month);
  return {
    listingTitle: "Уютная студия в центре Москвы",
    listingAddress: "Москва, ул. Невская 48",
    listingCoverUrl: "/listings/cover-studio.jpg",
    guests: BOOKING_CALENDAR_GUEST_TEMPLATES.map((guest) => ({
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      dates: `${guest.fromDay}-${guest.toDay} ${genitive}`,
      nights: guest.nights,
      avatarUrl: guest.avatarUrl,
      tone: guest.tone,
    })),
  };
}

function genitiveMonthName(month: YearMonth): string {
  const label = formatCalendarDayLabel(month, 1);
  const space = label.indexOf(" ");
  if (space === -1) {
    return label;
  }
  return label.slice(space + 1);
}
