import {
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type RefObject,
} from "react";
import { useFocusTrap } from "../../listings/useFocusTrap";

export type LogoutConfirmModalProps = {
  open: boolean;
  /** Идёт выход: обе кнопки disabled. */
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

const ACTION_BUTTON_CLASS =
  "flex h-[65px] flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-[#f88a2a] px-6 py-5 text-center font-sans text-[18px] font-bold leading-[23px] tracking-[0.018px] disabled:cursor-not-allowed";

type LogoutConfirmHeaderProps = {
  titleId: string;
  onClose: () => void;
};

function LogoutConfirmHeader({
  titleId,
  onClose,
}: LogoutConfirmHeaderProps): ReactElement {
  return (
    <div className="flex w-full items-start justify-between">
      <h2
        id={titleId}
        className="m-0 flex-1 text-[24px] font-bold leading-[28px] text-[#1a1b1d]"
      >
        Выйти из аккаунта?
      </h2>
      <button
        type="button"
        aria-label="Закрыть"
        className="flex shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-2.5"
        onClick={onClose}
      >
        <img src="/profile/icon-close.svg" alt="" width={20} height={20} />
      </button>
    </div>
  );
}

type LogoutConfirmActionsProps = {
  pending: boolean;
  cancelRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
};

function LogoutConfirmActions({
  pending,
  cancelRef,
  onCancel,
  onConfirm,
}: LogoutConfirmActionsProps): ReactElement {
  const pendingClass = pending ? "opacity-50" : "";

  return (
    <div className="flex w-full items-start gap-3 self-stretch">
      <button
        ref={cancelRef}
        type="button"
        disabled={pending}
        className={`${ACTION_BUTTON_CLASS} bg-transparent text-[#f88a2a] ${pendingClass}`}
        onClick={onCancel}
      >
        Вернуться
      </button>
      <button
        type="button"
        disabled={pending}
        className={`${ACTION_BUTTON_CLASS} bg-[#f88a2a] text-white ${pendingClass}`}
        onClick={onConfirm}
      >
        Да, выйти
      </button>
    </div>
  );
}

type LogoutConfirmDialogProps = {
  titleId: string;
  cardRef: RefObject<HTMLDivElement | null>;
  cancelRef: RefObject<HTMLButtonElement | null>;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function LogoutConfirmDialog(props: LogoutConfirmDialogProps): ReactElement {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#525353]/80 font-sans"
      role="presentation"
      onClick={props.onCancel}
    >
      <div
        ref={props.cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.titleId}
        tabIndex={-1}
        className={`relative flex w-[438px] flex-col items-center gap-10 overflow-hidden rounded-xl bg-white p-6 ${CARD_SHADOW}`}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <LogoutConfirmHeader titleId={props.titleId} onClose={props.onCancel} />
        <LogoutConfirmActions
          pending={props.pending}
          cancelRef={props.cancelRef}
          onCancel={props.onCancel}
          onConfirm={props.onConfirm}
        />
      </div>
    </div>
  );
}

function useEscapeToCancel(open: boolean, onCancel: () => void): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);
}

function useInitialCancelFocus(
  open: boolean,
  pending: boolean,
  cancelRef: RefObject<HTMLButtonElement | null>,
): void {
  useEffect(() => {
    if (!open || pending) {
      return;
    }
    cancelRef.current?.focus();
  }, [open, pending, cancelRef]);
}

export function LogoutConfirmModal({
  open,
  pending,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps): ReactElement | null {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(cardRef, open);
  useEscapeToCancel(open, onCancel);
  useInitialCancelFocus(open, pending, cancelRef);

  if (!open) {
    return null;
  }

  return (
    <LogoutConfirmDialog
      titleId={titleId}
      cardRef={cardRef}
      cancelRef={cancelRef}
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
