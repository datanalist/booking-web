import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type MenuAnchor = {
  /** Distance from the viewport top to the bottom edge of the trigger. */
  top: number;
  /** Distance from the viewport bottom to the top edge of the trigger. */
  bottom: number;
  /** Distance from the viewport right edge to the right edge of the trigger. */
  right: number;
};

type ConfirmedBookingMenuPopupProps = {
  anchor: MenuAnchor;
  onClose: () => void;
  children: ReactNode;
};

/** Fixed-position popup (rendered in a portal so table overflow does not clip it). */
export function ConfirmedBookingMenuPopup({
  anchor,
  onClose,
  children,
}: ConfirmedBookingMenuPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [placeAbove, setPlaceAbove] = useState(false);

  // Flip above the trigger when the popup would overflow the viewport bottom.
  useLayoutEffect(() => {
    const height = popupRef.current?.offsetHeight ?? 0;
    setPlaceAbove(anchor.top + height > window.innerHeight);
  }, [anchor]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (
        event.target instanceof Node &&
        popupRef.current?.contains(event.target) === false &&
        !(event.target instanceof Element && event.target.closest("[data-booking-menu-trigger]"))
      ) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popupRef}
      role="menu"
      style={
        placeAbove
          ? { bottom: anchor.bottom, right: anchor.right }
          : { top: anchor.top, right: anchor.right }
      }
      className={`fixed z-40 rounded-2xl ${placeAbove ? "rounded-br-none" : "rounded-tr-none"} bg-absolute-white py-5 pl-5 pr-7 font-sans shadow-[0px_12px_36px_0px_rgba(23,24,32,0.07),0px_0px_4px_0px_rgba(23,24,32,0.06)]`}
    >
      {children}
    </div>,
    document.body,
  );
}
