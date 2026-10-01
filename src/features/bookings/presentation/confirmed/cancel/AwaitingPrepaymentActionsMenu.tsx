import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { CancelBookingModal } from "./CancelBookingModal";
import type { CancelConfirmedBooking } from "./cancelAwaitingPrepaymentBooking";
import { canShowCancelBookingMenu } from "./canShowCancelBookingMenu";

const MENU_CLASS =
  "fixed z-40 w-max bg-absolute-white pl-5 pr-7 py-5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-[0px_12px_36px_0px_rgba(23,24,32,0.07),0px_0px_4px_0px_rgba(23,24,32,0.06)]";

type AwaitingPrepaymentActionsMenuProps = {
  booking: ConfirmedBooking;
  onCancel: CancelConfirmedBooking;
};

type MenuAnchorPoint = {
  readonly top: number;
  readonly right: number;
};

export function AwaitingPrepaymentActionsMenu({
  booking,
  onCancel,
}: AwaitingPrepaymentActionsMenuProps) {
  const canCancel = canShowCancelBookingMenu(booking.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useDismissCancelMenu(menuOpen, setMenuOpen, buttonRef, menuRef);

  if (!canCancel) {
    return <DisabledBookingMenuButton />;
  }

  return (
    <>
      <CancelMenuTrigger
        buttonRef={buttonRef}
        menuOpen={menuOpen}
        menuId={menuId}
        onToggle={() => setMenuOpen((open) => !open)}
      />
      {menuOpen ? (
        <CancelBookingMenuPopover
          menuId={menuId}
          menuRef={menuRef}
          anchorRef={buttonRef}
          onSelect={() => {
            setMenuOpen(false);
            setDialogOpen(true);
          }}
        />
      ) : null}
      <CancelBookingModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(reason) => {
          onCancel(booking.id, reason);
          setDialogOpen(false);
        }}
      />
    </>
  );
}

type CancelMenuTriggerProps = {
  buttonRef: { readonly current: HTMLButtonElement | null };
  menuOpen: boolean;
  menuId: string;
  onToggle: () => void;
};

function CancelMenuTrigger({
  buttonRef,
  menuOpen,
  menuId,
  onToggle,
}: CancelMenuTriggerProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Меню бронирования"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-controls={menuOpen ? menuId : undefined}
      className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)]"
      onClick={onToggle}
    >
      <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
    </button>
  );
}

function DisabledBookingMenuButton() {
  return (
    <button
      type="button"
      aria-label="Меню бронирования"
      disabled
      className="inline-flex size-6 cursor-not-allowed items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)] opacity-50"
    >
      <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
    </button>
  );
}

type CancelBookingMenuPopoverProps = {
  menuId: string;
  menuRef: { readonly current: HTMLDivElement | null };
  anchorRef: { readonly current: HTMLButtonElement | null };
  onSelect: () => void;
};

function CancelBookingMenuPopover({
  menuId,
  menuRef,
  anchorRef,
  onSelect,
}: CancelBookingMenuPopoverProps) {
  const [point, setPoint] = useState<MenuAnchorPoint | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    setPoint({ top: rect.bottom, right: viewportWidth - rect.right });
  }, [anchorRef]);

  if (!point) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      style={{ top: point.top, right: point.right }}
      className={MENU_CLASS}
    >
      <button
        type="button"
        role="menuitem"
        className="inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 font-sans text-sm font-normal leading-5 text-red-500"
        onClick={onSelect}
      >
        <Trash2
          aria-hidden
          className="size-6 shrink-0 text-red-500"
          strokeWidth={1.5}
        />
        Отменить бронирование
      </button>
    </div>,
    document.body,
  );
}

function useDismissCancelMenu(
  open: boolean,
  setOpen: (open: boolean) => void,
  buttonRef: { readonly current: HTMLButtonElement | null },
  menuRef: { readonly current: HTMLDivElement | null },
): void {
  useEffect(() => {
    if (!open) {
      return;
    }
    return listenCancelMenuDismiss(setOpen, buttonRef, menuRef);
  }, [open, setOpen, buttonRef, menuRef]);
}

function listenCancelMenuDismiss(
  setOpen: (open: boolean) => void,
  buttonRef: { readonly current: HTMLButtonElement | null },
  menuRef: { readonly current: HTMLDivElement | null },
): () => void {
  function close(): void {
    setOpen(false);
  }

  function onPointerDown(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || isCancelMenuTarget(target, buttonRef, menuRef)) {
      return;
    }
    close();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      close();
    }
  }

  document.addEventListener("mousedown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", close);
  return () => {
    document.removeEventListener("mousedown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", close);
  };
}

function isCancelMenuTarget(
  target: Node,
  buttonRef: { readonly current: HTMLButtonElement | null },
  menuRef: { readonly current: HTMLDivElement | null },
): boolean {
  return (
    buttonRef.current?.contains(target) === true ||
    menuRef.current?.contains(target) === true
  );
}
