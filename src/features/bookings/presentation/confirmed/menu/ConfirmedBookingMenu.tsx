import { Eye, MoreVertical, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingDialog } from "../dialog/ConfirmedBookingDialog";
import { ConfirmedBookingMenuItem } from "./ConfirmedBookingMenuItem";
import {
  ConfirmedBookingMenuPopup,
  type MenuAnchor,
} from "./ConfirmedBookingMenuPopup";
import { resolveConfirmedBookingMenuEntry } from "./resolveConfirmedBookingMenuEntry";
import { ReviewMenuItem } from "./ReviewMenuItem";

type ConfirmedBookingMenuProps = {
  booking: ConfirmedBooking;
  onOpenDialog: (dialog: ConfirmedBookingDialog) => void;
};

/** "Три точки" menu; statuses without actions keep a disabled trigger. */
export function ConfirmedBookingMenu({
  booking,
  onOpenDialog,
}: ConfirmedBookingMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const entry = resolveConfirmedBookingMenuEntry(booking.status);

  function toggle(): void {
    if (anchor !== null) {
      setAnchor(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect !== undefined) {
      setAnchor({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }

  function openDialog(kind: ConfirmedBookingDialog["kind"]): void {
    setAnchor(null);
    // The dialog focus trap restores focus to the element focused when it opens: the trigger.
    triggerRef.current?.focus();
    onOpenDialog({ kind, bookingId: booking.id });
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
        disabled={entry === "none"}
        onClick={toggle}
        className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {anchor !== null && entry !== "none" ? (
        <ConfirmedBookingMenuPopup
          anchor={anchor}
          onClose={() => setAnchor(null)}
        >
          {renderEntry(entry, booking, openDialog)}
        </ConfirmedBookingMenuPopup>
      ) : null}
    </>
  );
}

function renderEntry(
  entry: Exclude<ReturnType<typeof resolveConfirmedBookingMenuEntry>, "none">,
  booking: ConfirmedBooking,
  openDialog: (kind: ConfirmedBookingDialog["kind"]) => void,
) {
  switch (entry) {
    case "review":
      return (
        <ReviewMenuItem booking={booking} onSelect={() => openDialog("review")} />
      );
    case "cancel":
      return (
        <ConfirmedBookingMenuItem
          icon={Trash2}
          label="Отменить бронирование"
          tone="danger"
          onSelect={() => openDialog("cancel")}
        />
      );
    case "openRequest":
      return (
        <ConfirmedBookingMenuItem
          icon={Eye}
          label="Открыть"
          onSelect={() => openDialog("request")}
        />
      );
  }
}
