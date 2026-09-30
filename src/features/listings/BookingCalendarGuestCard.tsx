import { Mail } from "lucide-react";
import type { ReactElement } from "react";
import type { BookingCalendarGuestTone } from "./bookingCalendarDemo";

const TONE_BG: Record<BookingCalendarGuestTone, string> = {
  purple: "bg-[rgba(77,56,232,0.23)]",
  green: "bg-[rgba(47,235,39,0.3)]",
  blue: "bg-[rgba(91,197,242,0.3)]",
};

type BookingCalendarGuestCardProps = {
  name: string;
  phone: string;
  dates: string;
  nights: string;
  avatarUrl: string;
  tone: BookingCalendarGuestTone;
  onMessage: () => void;
  onDelete: () => void;
};

/** Карточка гостя в алерте календаря бронирования (Figma 1:22281). */
export function BookingCalendarGuestCard({
  name,
  phone,
  dates,
  nights,
  avatarUrl,
  tone,
  onMessage,
  onDelete,
}: BookingCalendarGuestCardProps): ReactElement {
  return (
    <div className={`flex items-center gap-5 rounded-xl p-4 ${TONE_BG[tone]}`}>
      <div className="flex w-[260px] shrink-0 items-center gap-3">
        <img
          src={avatarUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full border border-solid border-white object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-[16px] font-bold leading-[1.2] text-[#1a1b1d]">
            {name}
          </p>
          <p className="m-0 text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
            {phone}
          </p>
        </div>
      </div>
      <div className="flex w-[200px] shrink-0 items-center gap-3">
        <p className="m-0 whitespace-nowrap text-[16px] font-normal leading-[1.45] text-[#1a1b1d]">
          {dates}
        </p>
        <span
          aria-hidden
          className="size-[3px] shrink-0 rounded-full bg-[#1a1b1d]"
        />
        <p className="m-0 whitespace-nowrap text-[16px] font-normal leading-[1.45] text-[#1a1b1d]">
          {nights}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Написать ${name}`}
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[#1a1b1d]"
        onClick={onMessage}
      >
        <Mail aria-hidden className="size-6" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={`Удалить бронирование ${name}`}
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        onClick={onDelete}
      >
        <img src="/icon-delete.svg" alt="" width={24} height={24} />
      </button>
    </div>
  );
}
