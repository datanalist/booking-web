import { X } from "lucide-react";
import { useId, useRef, useState, type MouseEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../dialog/useDialogFocusTrap";
import { usePortalElement } from "../../../../../app/stagePortal";
import {
  CANCEL_REASON_MAX_LENGTH,
  parseCancelReason,
  type AcceptedCancelReason,
} from "./parseCancelReason";

const EXPLANATION =
  "Бронирование будет отменено в одностороннем порядке. Освободившиеся даты будут доступны другим пользователям для бронирования";

const CARD_CLASS =
  "flex w-96 flex-col gap-10 rounded-xl bg-absolute-white p-6 outline-none shadow-[0px_8px_8px_-4px_rgba(16,24,40,0.03),0px_20px_24px_-4px_rgba(16,24,40,0.08)]";

type CancelBookingModalProps = {
  onClose: () => void;
  onSubmit: (reason: AcceptedCancelReason) => void;
};

export function CancelBookingModal({
  onClose,
  onSubmit,
}: CancelBookingModalProps) {
  const titleId = useId();
  const reasonId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);
  const [reason, setReason] = useState("");
  const portal = usePortalElement();

  return createPortal(
    <CancelBookingDialogSurface
      dialogRef={dialogRef}
      titleId={titleId}
      reasonId={reasonId}
      reason={reason}
      onReasonChange={setReason}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
    portal,
  );
}

type CancelBookingDialogSurfaceProps = {
  dialogRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  reasonId: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: (reason: AcceptedCancelReason) => void;
};

function CancelBookingDialogSurface({
  dialogRef,
  titleId,
  reasonId,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
}: CancelBookingDialogSurfaceProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-600/80 font-sans"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={CARD_CLASS}
        onClick={stopCancelOverlayClick}
      >
        <div className="flex flex-col gap-4">
          <CancelBookingModalHeader titleId={titleId} onClose={onClose} />
          <p className="m-0 text-base leading-6 text-absolute-black">{EXPLANATION}</p>
          <CancelBookingReasonField
            reasonId={reasonId}
            reason={reason}
            onChange={onReasonChange}
          />
        </div>
        <CancelBookingModalFooter
          onBack={onClose}
          onSubmit={() => submitCancelReason(reason, onSubmit)}
        />
      </div>
    </div>
  );
}

function stopCancelOverlayClick(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

function submitCancelReason(
  reason: string,
  onSubmit: (reason: AcceptedCancelReason) => void,
): void {
  const parsed = parseCancelReason(reason);
  if (parsed.state !== "accepted") {
    return;
  }
  onSubmit(parsed);
}

type CancelBookingModalHeaderProps = {
  titleId: string;
  onClose: () => void;
};

function CancelBookingModalHeader({
  titleId,
  onClose,
}: CancelBookingModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2
        id={titleId}
        className="m-0 text-2xl font-bold leading-7 text-absolute-black"
      >
        Отменить бронирование
      </h2>
      <button
        type="button"
        aria-label="Закрыть"
        className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2.5 text-absolute-black"
        onClick={onClose}
      >
        <X aria-hidden className="size-5" width={20} height={20} strokeWidth={1.75} />
      </button>
    </div>
  );
}

type CancelBookingReasonFieldProps = {
  reasonId: string;
  reason: string;
  onChange: (reason: string) => void;
};

function CancelBookingReasonField({
  reasonId,
  reason,
  onChange,
}: CancelBookingReasonFieldProps) {
  return (
    <div className="flex h-40 flex-col gap-1">
      <label
        htmlFor={reasonId}
        className="text-sm font-normal leading-5 text-neutral-600"
      >
        Причина
      </label>
      <textarea
        id={reasonId}
        value={reason}
        maxLength={CANCEL_REASON_MAX_LENGTH}
        placeholder="Укажите причину отмены"
        className="min-h-0 w-full flex-1 resize-none rounded-lg border-0 bg-amber-400/5 px-3.5 py-2.5 font-sans text-base leading-6 text-absolute-black outline outline-1 outline-offset-[-1px] outline-amber-400/20 placeholder:text-neutral-600"
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="self-end text-xs leading-4 text-neutral-600">
        {reason.length}/{CANCEL_REASON_MAX_LENGTH}
      </span>
    </div>
  );
}

type CancelBookingModalFooterProps = {
  onBack: () => void;
  onSubmit: () => void;
};

function CancelBookingModalFooter({
  onBack,
  onSubmit,
}: CancelBookingModalFooterProps) {
  const buttonClass =
    "flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-lg px-6 py-5 font-sans text-lg font-bold tracking-tight";

  return (
    <div className="flex gap-3">
      <button
        type="button"
        className={`${buttonClass} bg-transparent text-orange-400 outline outline-1 outline-offset-[-1px] outline-orange-400`}
        onClick={onBack}
      >
        Вернуться
      </button>
      <button
        type="button"
        className={`${buttonClass} border-0 bg-orange-400 text-absolute-white`}
        onClick={onSubmit}
      >
        Отправить
      </button>
    </div>
  );
}
