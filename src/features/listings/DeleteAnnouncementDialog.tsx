import { useEffect, useId, useRef, type ReactElement } from "react";
import { StagePortal } from "../../app/stagePortal";
import { Button } from "../../ui/Button";
import { useFocusTrap } from "./useFocusTrap";

type DeleteAnnouncementDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

export function DeleteAnnouncementDialog({
  open,
  onClose,
  onConfirm,
}: DeleteAnnouncementDialogProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <StagePortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#525353]/80 font-sans"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative flex w-96 flex-col items-center gap-10 overflow-hidden rounded-xl bg-white p-6 ${CARD_SHADOW}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-start justify-between gap-4">
            <h2
              id={titleId}
              className="m-0 flex-1 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]"
            >
              Удалить объявление?
            </h2>
            <button
              type="button"
              aria-label="Закрыть"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0"
              onClick={onClose}
            >
              <img
                src="/icon-modal-close.svg"
                alt=""
                width={20}
                height={20}
              />
            </button>
          </div>
          <p
            id={descriptionId}
            className="m-0 text-[16px] font-normal leading-[1.45] text-[#1a1b1d]"
          >
            Все данные объявления будут удалены
            <br />
            из приложения
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button
            variant="outlined"
            className="h-auto flex-1 whitespace-nowrap !rounded-lg px-6 py-5"
            onClick={onClose}
          >
            Вернуться
          </Button>
          <Button
            variant="filled"
            className="h-auto flex-1 whitespace-nowrap !rounded-lg px-6 py-5"
            onClick={onConfirm}
          >
            Да, удалить
          </Button>
        </div>
      </div>
    </div>
    </StagePortal>
  );
}
