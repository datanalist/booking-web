import { Eye, MoreVertical, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingDialog } from "../dialog/ConfirmedBookingDialog";
import type { ConfirmedBookingRowActions } from "./ConfirmedBookingRowActions";
import { ConfirmedBookingMenuItem } from "./ConfirmedBookingMenuItem";
import {
  ConfirmedBookingMenuPopup,
  type MenuAnchor,
} from "./ConfirmedBookingMenuPopup";
import { resolveConfirmedBookingMenuEntry } from "./resolveConfirmedBookingMenuEntry";
import { ReviewMenuItem } from "./ReviewMenuItem";

type ConfirmedBookingMenuProps = {
  booking: ConfirmedBooking;
  actions: ConfirmedBookingRowActions;
};

/** "Три точки" menu; statuses without actions keep a disabled trigger. */
export function ConfirmedBookingMenu({
  booking,
  actions,
}: ConfirmedBookingMenuProps) {
  const { openMenuId, onToggleMenu, onCloseMenu, onOpenDialog } = actions;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const entry = resolveConfirmedBookingMenuEntry(booking.status);
  const open = openMenuId === booking.id;

  function toggle(): void {
    // Re-measured on every click, so a menu reopened later never uses a stale position.
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect !== undefined) {
      setAnchor({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
    }
    onToggleMenu(booking.id);
  }

  function openDialog(kind: ConfirmedBookingDialog["kind"]): void {
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
        aria-expanded={open}
        data-booking-menu-trigger
        disabled={entry === "none"}
        onClick={toggle}
        className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {open && anchor !== null && entry !== "none" ? (
        <ConfirmedBookingMenuPopup anchor={anchor} onClose={onCloseMenu}>
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
