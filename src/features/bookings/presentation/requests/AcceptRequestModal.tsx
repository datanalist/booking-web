import { Button } from "../../../../ui/Button";
import { Modal } from "../../../../ui/Modal";

const CARD_CLASS =
  "!w-96 !max-w-[calc(100%-2rem)] shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

type AcceptRequestModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AcceptRequestModal({ open, onClose }: AcceptRequestModalProps) {
  return (
    <Modal
      open={open}
      title="Заявка принята"
      onClose={onClose}
      overlayClassName="bg-neutral-600"
      titleClassName="text-2xl font-bold leading-7 text-[var(--color-ink)]"
      className={CARD_CLASS}
    >
      <div className="flex w-full flex-col gap-10">
        <p className="m-0 text-base leading-6 text-[var(--color-text)]">
          Отслеживайте статус предоплаты в разделе подтвержденных бронирований
        </p>
        <Button
          className="w-full !h-auto !rounded-lg !bg-orange-400 !px-6 !py-5 !text-lg"
          onClick={onClose}
        >
          Ок
        </Button>
      </div>
    </Modal>
  );
}
