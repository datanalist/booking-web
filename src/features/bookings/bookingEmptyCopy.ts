import type { BookingTabId } from "./bookingTabId";

export type BookingEmptyCopy = {
  title: string;
  description: string;
};

export const BOOKING_EMPTY_COPY: Record<BookingTabId, BookingEmptyCopy> = {
  requests: {
    title: "Нет заявок",
    description: "Заявки на бронирование жилья появятся здесь!",
  },
  confirmed: {
    title: "Нет бронирований",
    description: "Подтверждённые заявки на бронирования появятся здесь!",
  },
  rejected: {
    title: "Нет бронирований",
    description: "Отклонённые заявки на бронирования появятся здесь!",
  },
  cancelled: {
    title: "Нет бронирований",
    description:
      "Отменённые вами или пользователями бронирования появятся здесь!",
  },
};
