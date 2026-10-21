import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactElement } from "react";
import { usePortalElement } from "../../app/stagePortal";
import { bookingCalendarDemoFor } from "./bookingCalendarDemoFor";
import type { BookingCalendarDemo } from "./bookingCalendarDemo";
import { bookingCalendarMarksFor } from "./bookingCalendarMarksFor";
import { BookingCalendarAlertBody } from "./BookingCalendarAlertBody";
import { toggleSelectedBookingDay } from "./toggleSelectedBookingDay";
import { useBookingCalendarView } from "./useBookingCalendarView";
import { useBookingDayOverrides } from "./useBookingDayOverrides";

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

export type BookingCalendarAlertProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
  onMessageGuest?: (guestId: string) => void;
  onDeleteBooking?: (guestId: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  today?: Date;
  listingId?: string;
  storage?: Storage;
  demo?: BookingCalendarDemo;
};

/**
 * Алерт «Календарь бронирования» — макет Figma 1:22281.
 * Подложка кадра сплошная #525353, карточка белая, p-24 gap-40 rounded-xl, Shadow/xl.
 */
export function BookingCalendarAlert({
  open,
  onOpenChange,
  onCancel,
  onMessageGuest,
  onDeleteBooking,
  onPrevMonth,
  onNextMonth,
  today = new Date(),
  listingId = "demo",
  storage = localStorage,
  demo,
}: BookingCalendarAlertProps): ReactElement {
  const resolvedDemo = demo ?? bookingCalendarDemoFor(today);
  const marks = bookingCalendarMarksFor(today);
  const { view, selectDay, shiftMonth } = useBookingCalendarView(open, today);
  const { overrides, toggleDay } = useBookingDayOverrides(listingId, storage);

  function handleOpenChange(next: boolean): void {
    onOpenChange(next);
    if (!next) {
      onCancel?.();
    }
  }

  function handlePrevMonth(): void {
    shiftMonth(-1);
    onPrevMonth?.();
  }

  function handleNextMonth(): void {
    shiftMonth(1);
    onNextMonth?.();
  }

  function handleToggleAvailability(): void {
    toggleSelectedBookingDay(view, marks, overrides, toggleDay);
  }

  const portal = usePortalElement();

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal container={portal}>
        <AlertDialog.Overlay
          data-booking-calendar-overlay=""
          className="fixed inset-0 z-50 bg-[#525353]"
        />
        <AlertDialog.Content
          data-listing-id={listingId}
          className={`fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100%-48px)] w-max max-w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-10 overflow-auto rounded-xl bg-white p-6 font-sans ${CARD_SHADOW}`}
        >
          <AlertHeader />
          <AlertDialog.Description className="sr-only">
            Календарь занятости объявления и список бронирований
          </AlertDialog.Description>
          <BookingCalendarAlertBody
            demo={resolvedDemo}
            monthCard={{
              view,
              marks,
              overrides,
              onSelectDay: selectDay,
              onPrevMonth: handlePrevMonth,
              onNextMonth: handleNextMonth,
              onToggleAvailability: handleToggleAvailability,
            }}
            onMessageGuest={(guestId) => onMessageGuest?.(guestId)}
            onDeleteBooking={(guestId) => onDeleteBooking?.(guestId)}
          />
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function AlertHeader(): ReactElement {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full items-center justify-between">
        <AlertDialog.Title className="m-0 min-w-0 flex-1 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]">
          Календарь бронирования
        </AlertDialog.Title>
        <AlertDialog.Cancel
          aria-label="Закрыть"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2.5"
        >
          <img src="/icon-modal-close.svg" alt="" width={20} height={20} />
        </AlertDialog.Cancel>
      </div>
    </div>
  );
}
