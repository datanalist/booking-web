import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function listFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((node) => !node.hasAttribute("disabled") && node.tabIndex !== -1);
}

/** Ловит Tab внутри контейнера и возвращает фокус при закрытии. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const container = containerRef.current;
    if (container !== null) {
      const focusable = listFocusable(container);
      const first = focusable[0];
      if (first !== undefined) {
        first.focus();
      } else {
        container.focus();
      }
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Tab") {
        return;
      }
      const root = containerRef.current;
      if (root === null) {
        return;
      }
      const focusable = listFocusable(root);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !root.contains(current)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef]);
}
