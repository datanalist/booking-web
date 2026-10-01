export const BOOKING_TABS = [
  { id: "requests", label: "Заявки" },
  { id: "confirmed", label: "Подтверждены" },
  { id: "rejected", label: "Отклонены" },
  { id: "cancelled", label: "Отменены" },
] as const;

export type BookingTabId = (typeof BOOKING_TABS)[number]["id"];

export function isBookingTabId(value: string | null): value is BookingTabId {
  return (
    value === "requests" ||
    value === "confirmed" ||
    value === "rejected" ||
    value === "cancelled"
  );
}
