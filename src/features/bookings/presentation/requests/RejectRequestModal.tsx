import { useEffect, useState } from "react";
import { Button } from "../../../../ui/Button";
import { Modal } from "../../../../ui/Modal";

const REASON_MAX = 500;

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
      className="!max-w-[384px] shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]"
    >
      <div className="flex w-full flex-col gap-6">
        <p className="m-0 text-[16px] leading-[1.45] text-[var(--color-text)]">
          Заявка переместится в раздел отклоненных бронирований
        </p>

        <div className="flex w-full flex-col gap-1">
          <label
            htmlFor="reject-reason"
            className="text-[14px] font-normal text-[var(--color-text)]"
          >
            Причина
          </label>
          <textarea
            id="reject-reason"
            className="box-border min-h-[120px] w-full resize-none rounded-[8px] border border-[#d0d0d0] px-3 py-2 font-sans text-[16px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            value={reason}
            placeholder="Укажите причину отказа"
            maxLength={REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
          />
          <span className="self-end text-[12px] text-[#525353]">
            {reason.length}/{REASON_MAX}
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outlined"
            className="flex-1 !rounded-lg"
            onClick={onClose}
          >
            Вернуться
          </Button>
          <Button
            className="flex-1 !rounded-lg"
            onClick={() => onSubmit(reason)}
          >
            Отправить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
