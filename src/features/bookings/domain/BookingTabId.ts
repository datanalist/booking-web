export const BOOKING_TABS = [
  { id: "requests", label: "Заявки" },
  { id: "confirmed", label: "Подтверждены" },
  { id: "rejected", label: "Отклонены" },
  { id: "cancelled", label: "Отменены" },
] as const;

export type BookingTabId = (typeof BOOKING_TABS)[number]["id"];

export const DEFAULT_BOOKING_TAB: BookingTabId = "requests";
