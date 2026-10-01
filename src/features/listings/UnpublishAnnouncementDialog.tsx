import { useEffect, useId, useRef, type ReactElement } from "react";
import { useFocusTrap } from "./useFocusTrap";

type UnpublishAnnouncementDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

/** Модалка подтверждения снятия объявления с публикации (макет 1:22494). */
export function UnpublishAnnouncementDialog({
  open,
  onClose,
  onConfirm,
}: UnpublishAnnouncementDialogProps): ReactElement | null {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
        tabIndex={-1}
        className={`relative flex w-96 flex-col gap-10 rounded-xl bg-white p-6 ${CARD_SHADOW}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-start justify-between gap-2">
            <h2
              id={titleId}
              className="m-0 min-w-0 flex-1 text-2xl font-bold leading-[1.2] text-[var(--color-ink)]"
            >
              Снять объявление с публикации?
            </h2>
            <button
              type="button"
              aria-label="Закрыть"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2.5"
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
          <p className="m-0 text-base leading-[1.45] text-[var(--color-ink)]">
            Объявление перестанет отображаться пользователям и станет недоступным
            для бронирования. Вы сможете опубликовать объявление повторно из
            раздела Архив
          </p>
        </div>
        <div className="flex w-full gap-3">
          <button
            type="button"
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-orange-400 bg-transparent px-6 py-5 text-lg font-bold tracking-[0.018px] text-orange-400"
            onClick={onClose}
          >
            Вернуться
          </button>
          <button
            type="button"
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-0 bg-orange-400 px-6 py-5 text-lg font-bold tracking-[0.018px] text-white"
            onClick={onConfirm}
          >
            Да, снять
          </button>
        </div>
      </div>
    </div>
  );
}
