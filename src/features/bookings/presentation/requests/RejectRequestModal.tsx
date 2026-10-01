import { useEffect, useState } from "react";
import { Button } from "../../../../ui/Button";
import { Modal } from "../../../../ui/Modal";

const REASON_MAX = 500;

const CARD_CLASS =
  "!w-96 !max-w-[calc(100%-2rem)] shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

type RejectRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function RejectRequestModal({
  open,
  onClose,
  onSubmit,
}: RejectRequestModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Отклонить заявку"
      onClose={onClose}
      overlayClassName="bg-neutral-600"
      titleClassName="text-2xl font-bold leading-7 text-[var(--color-ink)]"
      className={CARD_CLASS}
    >
      <div className="flex w-full flex-col gap-10">
        <div className="flex w-full flex-col gap-4">
          <p className="m-0 text-base leading-6 text-[var(--color-text)]">
            Заявка переместится в раздел отклоненных бронирований
          </p>

          <div className="flex h-40 w-full flex-col gap-1">
            <label
              htmlFor="reject-reason"
              className="text-sm font-normal text-[var(--color-text)]"
            >
              Причина
            </label>
            <textarea
              id="reject-reason"
              className="box-border min-h-0 w-full flex-1 resize-none rounded-lg bg-amber-400/5 px-3.5 py-2.5 font-sans text-base text-[var(--color-text)] outline outline-1 outline-offset-[-1px] outline-amber-400/20 placeholder:text-neutral-600 focus:outline-amber-400/40"
              value={reason}
              placeholder="Укажите причину отказа"
              maxLength={REASON_MAX}
              onChange={(event) => setReason(event.target.value)}
            />
            <span className="self-end text-xs text-neutral-600">
              {reason.length}/{REASON_MAX}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outlined"
            className="flex-1 !h-auto !rounded-lg !border-orange-400 !px-6 !py-5 !text-lg !text-orange-400"
            onClick={onClose}
          >
            Вернуться
          </Button>
          <Button
            className="flex-1 !h-auto !rounded-lg !bg-orange-400 !px-6 !py-5 !text-lg"
            onClick={() => onSubmit(reason)}
          >
            Отправить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
