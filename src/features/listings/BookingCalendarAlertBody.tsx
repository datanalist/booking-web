import type { ReactElement } from "react";
import type {
  BookingCalendarDemo,
  BookingCalendarMonthMarks,
} from "./bookingCalendarDemo";
import { BookingCalendarGuestCard } from "./BookingCalendarGuestCard";
import { BookingCalendarLegend } from "./BookingCalendarLegend";
import { BookingCalendarMonthCard } from "./BookingCalendarMonthCard";
import type { BookingCalendarView } from "./BookingCalendarView";

type BookingCalendarAlertBodyProps = {
  demo: BookingCalendarDemo;
  marks: BookingCalendarMonthMarks;
  view: BookingCalendarView;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMessageGuest: (guestId: string) => void;
  onDeleteBooking: (guestId: string) => void;
};

/** Тело алерта: календарь слева, объявление и гости справа. */
export function BookingCalendarAlertBody({
  demo,
  marks,
  view,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onMessageGuest,
  onDeleteBooking,
}: BookingCalendarAlertBodyProps): ReactElement {
  return (
    <div className="flex items-start gap-8">
      <div className="flex flex-col gap-6">
        <BookingCalendarMonthCard
          view={view}
          marks={marks}
          onSelectDay={onSelectDay}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
        <BookingCalendarLegend />
      </div>
      <div className="flex flex-col gap-8">
        <ListingSummary
          title={demo.listingTitle}
          address={demo.listingAddress}
          coverUrl={demo.listingCoverUrl}
        />
        <div className="flex flex-col gap-4">
          {demo.guests.map((guest) => (
            <BookingCalendarGuestCard
              key={guest.id}
              name={guest.name}
              phone={guest.phone}
              dates={guest.dates}
              nights={guest.nights}
              avatarUrl={guest.avatarUrl}
              tone={guest.tone}
              onMessage={() => onMessageGuest(guest.id)}
              onDelete={() => onDeleteBooking(guest.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListingSummary({
  title,
  address,
  coverUrl,
}: {
  title: string;
  address: string;
  coverUrl: string;
}): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <img
        src={coverUrl}
        alt=""
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-lg object-cover"
      />
      <div className="flex flex-col gap-1.5 text-[#1a1b1d]">
        <p className="m-0 text-[18px] font-bold leading-normal tracking-[0.018px]">
          {title}
        </p>
        <p className="m-0 text-[16px] font-normal leading-[1.45]">{address}</p>
      </div>
    </div>
  );
}
