import type { ReviewRating } from "./reviewRating";

/** Состояние формы отзыва: рейтинг ещё может быть не выбран. */
export type ReviewDraft = {
  rating: ReviewRating | null;
  comment: string;
};
