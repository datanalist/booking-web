import { Button } from "../../../../ui/Button";
import { Modal } from "../../../../ui/Modal";

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
      className="!max-w-[384px] shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]"
    >
      <div className="flex w-full flex-col gap-6">
        <p className="m-0 text-[16px] leading-[1.45] text-[var(--color-text)]">
          Отслеживайте статус предоплаты в разделе подтвержденных бронирований
        </p>
        <Button className="w-full !rounded-lg" onClick={onClose}>
          Ок
        </Button>
      </div>
    </Modal>
  );
}
