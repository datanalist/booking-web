import { MoreVertical, Star } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { ReviewModal } from "./ReviewModal";
import { bookingReviewsStore } from "./bookingReviewsStore";
import { resolveReviewMenuItem } from "./resolveReviewMenuItem";
import { useBookingReview } from "./useBookingReview";

type StayCompletedReviewMenuProps = {
  booking: ConfirmedBooking;
};

const POPUP_CLASS =
  "absolute right-full top-0 z-20 m-0 list-none rounded-bl-2xl rounded-br-2xl rounded-tl-2xl bg-white py-5 pl-5 pr-7 shadow-[0px_12px_36px_0px_rgba(23,24,32,0.07),0px_0px_4px_0px_rgba(23,24,32,0.06)]";

const ITEM_CLASS =
  "inline-flex items-center gap-3 whitespace-nowrap border-0 bg-transparent p-0 font-sans text-sm font-normal leading-5 text-black";

/** Меню «три точки» для статуса «Аренда завершилась»: пункт «Оставить отзыв». */
export function StayCompletedReviewMenu({
  booking,
}: StayCompletedReviewMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasModalOpenRef = useRef(false);
  const menuId = useId();
  const review = useBookingReview(booking.id);
  const itemState = resolveReviewMenuItem(booking.status, review !== undefined);

  useEffect(() => {
    if (wasModalOpenRef.current && !modalOpen) {
      triggerRef.current?.focus();
    }
    wasModalOpenRef.current = modalOpen;
  }, [modalOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    itemRef.current?.focus();

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Меню бронирования"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)]"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {menuOpen ? (
        <ul id={menuId} role="menu" className={POPUP_CLASS}>
          <li role="none">
            {itemState === "submitted" ? (
              <button
                ref={itemRef}
                type="button"
                role="menuitem"
                aria-disabled="true"
                className={`${ITEM_CLASS} cursor-default text-neutral-600`}
              >
                <Star
                  aria-hidden
                  strokeWidth={1.5}
                  className="size-6 fill-orange-400 text-orange-400"
                />
                Отзыв оставлен
              </button>
            ) : (
              <button
                ref={itemRef}
                type="button"
                role="menuitem"
                className={`${ITEM_CLASS} cursor-pointer`}
                onClick={() => {
                  setMenuOpen(false);
                  setModalOpen(true);
                }}
              >
                <Star aria-hidden strokeWidth={1.5} className="size-6" />
                Оставить отзыв
              </button>
            )}
          </li>
        </ul>
      ) : null}
      {modalOpen ? (
        <ReviewModal
          booking={booking}
          onClose={() => setModalOpen(false)}
          onSubmit={(submitted) => {
            bookingReviewsStore.save(submitted);
            setModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
