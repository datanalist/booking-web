import { useEffect, useId, useRef, type ReactElement } from "react";
import { Button } from "../../ui/Button";
import { useFocusTrap } from "./useFocusTrap";

type PublishAnnouncementDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

/** Диалог публикации — макет Figma 1:22505 (438×273, p-24, gap-40). */
export function PublishAnnouncementDialog({
  open,
  onClose,
  onConfirm,
}: PublishAnnouncementDialogProps): ReactElement | null {
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
        className={`relative flex w-[438px] flex-col items-center gap-10 rounded-xl bg-white p-6 ${CARD_SHADOW}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-start justify-between">
            <h2
              id={titleId}
              className="m-0 min-w-0 flex-1 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]"
            >
              Опубликовать объявление?
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
            Объявление будет отображаться пользователям и станет доступным для
            бронирования
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button
            variant="outlined"
            className="h-auto min-w-0 flex-1 whitespace-nowrap !rounded-lg border-orange-400 !px-6 py-5 !text-lg text-orange-400"
            onClick={onClose}
          >
            Вернуться
          </Button>
          <Button
            variant="filled"
            className="h-auto min-w-0 flex-1 whitespace-nowrap !rounded-lg !bg-orange-400 !px-6 py-5 !text-lg text-white"
            onClick={onConfirm}
          >
            Да, опубликовать
          </Button>
        </div>
      </div>
    </div>
  );
}
