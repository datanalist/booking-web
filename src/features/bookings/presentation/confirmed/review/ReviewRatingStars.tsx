import { Star } from "lucide-react";
import { REVIEW_RATINGS, type ReviewRating } from "./reviewRating";

type ReviewRatingStarsProps = {
  value: ReviewRating | null;
  onChange: (rating: ReviewRating) => void;
};

export function ReviewRatingStars({ value, onChange }: ReviewRatingStarsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Оценка клиента"
      className="inline-flex items-center gap-[5px]"
    >
      {REVIEW_RATINGS.map((rating) => {
        const filled = value !== null && rating <= value;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${rating} из ${REVIEW_RATINGS.length}`}
            className="inline-flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
            onClick={() => onChange(rating)}
          >
            <Star
              aria-hidden
              strokeWidth={1.5}
              className={`size-8 ${
                filled
                  ? "fill-orange-400 text-orange-400"
                  : "fill-amber-400/20 text-amber-400/20"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
