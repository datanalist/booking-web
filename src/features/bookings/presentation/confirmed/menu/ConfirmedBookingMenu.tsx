import { Eye, MoreVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { ConfirmedBookingMenuItem } from "./ConfirmedBookingMenuItem";
import {
  ConfirmedBookingMenuPopup,
  type MenuAnchor,
} from "./ConfirmedBookingMenuPopup";

type ConfirmedBookingMenuProps = {
  booking: ConfirmedBooking;
  onOpenRequest: (bookingId: string) => void;
};

/** "Три точки" menu; statuses without actions keep a disabled trigger. */
export function ConfirmedBookingMenu({
  booking,
  onOpenRequest,
}: ConfirmedBookingMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const hasActions = booking.status.kind === "request";

  function toggle(): void {
    if (anchor !== null) {
      setAnchor(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect !== undefined) {
      setAnchor({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Меню бронирования"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        data-booking-menu-trigger
        disabled={!hasActions}
        onClick={toggle}
        className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {anchor !== null && booking.status.kind === "request" ? (
        <ConfirmedBookingMenuPopup
          anchor={anchor}
          onClose={() => setAnchor(null)}
        >
          <ConfirmedBookingMenuItem
            icon={Eye}
            label="Открыть"
            onSelect={() => {
              setAnchor(null);
              onOpenRequest(booking.id);
            }}
          />
        </ConfirmedBookingMenuPopup>
      ) : null}
    </>
  );
}
