export const CONFIRMED_STATUS_SORT_OPTIONS = [
  "all",
  "awaitingPrepayment",
  "prepaymentPaid",
  "staying",
  "stayCompleted",
] as const;

export type ConfirmedStatusSortOption =
  (typeof CONFIRMED_STATUS_SORT_OPTIONS)[number];

export const CONFIRMED_STATUS_SORT_LABELS: Record<
  ConfirmedStatusSortOption,
  string
> = {
  all: "Все",
  awaitingPrepayment: "Ожидание предоплаты",
  prepaymentPaid: "Предоплата внесена",
  staying: "Проживание",
  stayCompleted: "Аренда завершилась",
};
