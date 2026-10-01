import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useCancelBookingFocusTrap(
  open: boolean,
  onClose: () => void,
): RefObject<HTMLDivElement | null> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    return bindCancelDialogKeys(dialog, () => {
      onCloseRef.current();
    });
  }, [open]);

  return dialogRef;
}

function bindCancelDialogKeys(
  dialog: HTMLDivElement,
  onClose: () => void,
): () => void {
  const previouslyFocused = document.activeElement;
  dialog.focus();

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      trapCancelDialogTab(dialog, event);
    }
  }

  document.addEventListener("keydown", onKeyDown);
  return () => {
    document.removeEventListener("keydown", onKeyDown);
    restoreCancelDialogFocus(previouslyFocused);
  };
}

function restoreCancelDialogFocus(previouslyFocused: Element | null): void {
  if (previouslyFocused instanceof HTMLElement) {
    previouslyFocused.focus();
  }
}

function listCancelDialogFocusable(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

function trapCancelDialogTab(dialog: HTMLElement, event: KeyboardEvent): void {
  const focusable = listCancelDialogFocusable(dialog);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }

  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
