import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clientToStage, usePortalElement, useStagePortalRoot } from "../../app/stagePortal";
import type { ListingRowMenuActionId } from "./listingRowMenuItemsByStatus";
import { ListingRowMenu } from "./ListingRowMenu";
import type { ListingTableStatus } from "./listingTableStatus";

type ListingRowMenuButtonProps = {
  listingId: string;
  listingTitle: string;
  status: ListingTableStatus;
  open: boolean;
  onOpenChange: (listingId: string | null) => void;
  onAction: (actionId: ListingRowMenuActionId) => void;
};

/** Зазор между правым краем меню и кнопкой «⋯» (меню слева от точек). */
const MENU_GAP_PX = 3;

type MenuBox = {
  top: number;
  right: number;
};

/** Кнопка «⋯» строки таблицы с поповером действий по статусу. */
export function ListingRowMenuButton({
  listingId,
  listingTitle,
  status,
  open,
  onOpenChange,
  onAction,
}: ListingRowMenuButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstDotRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);
  const stage = useStagePortalRoot();
  const portal = usePortalElement();

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }

    function updateMenuBox(): void {
      const button = buttonRef.current;
      const firstDot = firstDotRef.current;
      if (!button || !firstDot) {
        return;
      }
      const buttonRect = button.getBoundingClientRect();
      const firstDotRect = firstDot.getBoundingClientRect();
      if (stage) {
        const dot = clientToStage(firstDotRect.left, firstDotRect.top, stage);
        const edge = clientToStage(buttonRect.left, buttonRect.top, stage);
        setMenuBox({
          top: dot.y,
          right: stage.offsetWidth - edge.x + MENU_GAP_PX,
        });
        return;
      }
      setMenuBox({
        top: firstDotRect.top,
        right: window.innerWidth - buttonRect.left + MENU_GAP_PX,
      });
    }

    updateMenuBox();
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    return () => {
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
    };
  }, [open, stage]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      onOpenChange(null);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onOpenChange(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Действия для «${listingTitle}»`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-5 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)]"
        onClick={() => onOpenChange(open ? null : listingId)}
      >
        <span aria-hidden className="flex flex-col items-center gap-[3px]">
          <span
            ref={firstDotRef}
            className="block size-[3px] rounded-full bg-current"
          />
          <span className="block size-[3px] rounded-full bg-current" />
          <span className="block size-[3px] rounded-full bg-current" />
        </span>
      </button>
      {open && menuBox
        ? createPortal(
            <ListingRowMenu
              ref={menuRef}
              status={status}
              style={{
                position: "fixed",
                top: menuBox.top,
                right: menuBox.right,
              }}
              onAction={(actionId) => {
                onOpenChange(null);
                onAction(actionId);
              }}
            />,
            portal,
          )
        : null}
    </div>
  );
}
