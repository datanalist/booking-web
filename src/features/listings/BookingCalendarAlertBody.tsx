import type { ReactElement } from "react";
import type { BookingCalendarDemo } from "./bookingCalendarDemo";
import { BookingCalendarGuestCard } from "./BookingCalendarGuestCard";
import { BookingCalendarLegend } from "./BookingCalendarLegend";
import {
  BookingCalendarMonthCard,
  type BookingCalendarMonthCardProps,
} from "./BookingCalendarMonthCard";

type BookingCalendarAlertBodyProps = {
  panel: BookingCalendarDemo;
  monthCard: BookingCalendarMonthCardProps;
  onMessageGuest: (guestId: string) => void;
  onDeleteBooking: (guestId: string) => void;
};

/** Тело алерта: календарь слева, объявление и гости справа. */
export function BookingCalendarAlertBody({
  panel,
  monthCard,
  onMessageGuest,
  onDeleteBooking,
}: BookingCalendarAlertBodyProps): ReactElement {
  return (
    <div className="flex items-start gap-8">
      <div className="flex flex-col gap-6">
        <BookingCalendarMonthCard {...monthCard} />
        <BookingCalendarLegend />
      </div>
      <div className="flex flex-col gap-8">
        <ListingSummary
          title={panel.listingTitle}
          address={panel.listingAddress}
          coverUrl={panel.listingCoverUrl}
        />
        <div className="flex flex-col gap-4">
          {panel.guests.map((guest) => (
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
