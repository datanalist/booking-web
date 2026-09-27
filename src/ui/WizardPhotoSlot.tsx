/** Единая причина изменения: слот фото мастера объявления (пусто / превью / DnD / удаление). */
import type { DragEvent } from "react";
import { dataTransferHasFiles } from "../lib/dataTransferHasFiles";
import { imageFileListFromDataTransfer } from "../lib/imageFileListFromDataTransfer";
import { WIZARD_PHOTO_DRAG_MIME } from "../lib/wizardPhotoDragMime";

type WizardPhotoSlotProps = {
  variant: "cover" | "thumb";
  index: number;
  previewUrl: string | null;
  canAdd: boolean;
  getDragFromIndex: () => number | null;
  onAdd: () => void;
  onRemove: () => void;
  onDragFromChange: (index: number | null) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onFilesDropped: (files: FileList) => void;
};

export function WizardPhotoSlot({
  variant,
  index,
  previewUrl,
  canAdd,
  getDragFromIndex,
  onAdd,
  onRemove,
  onDragFromChange,
  onReorder,
  onFilesDropped,
}: WizardPhotoSlotProps) {
  const isCover = variant === "cover";
  const filled = previewUrl !== null;

  function allowDrop(event: DragEvent<HTMLElement>): void {
    const types = Array.from(event.dataTransfer.types);
    const isReorder =
      getDragFromIndex() !== null || types.includes(WIZARD_PHOTO_DRAG_MIME);
    const isFiles = dataTransferHasFiles(event.dataTransfer);
    if (!isReorder && !(isFiles && canAdd)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = isReorder ? "move" : "copy";
  }

  function handleDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();

    const fromIndex = getDragFromIndex();
    onDragFromChange(null);

    if (fromIndex !== null && filled) {
      onReorder(fromIndex, index);
      return;
    }

    if (!canAdd) {
      return;
    }
    const files = imageFileListFromDataTransfer(event.dataTransfer);
    if (files !== null) {
      onFilesDropped(files);
    }
  }

  if (filled) {
    return (
      <div
        draggable
        className={`relative shrink-0 cursor-grab overflow-hidden active:cursor-grabbing ${
          isCover
            ? "h-[264px] w-[437px] rounded-[16px]"
            : "size-[100px] rounded-[8px]"
        }`}
        onDragStart={(event) => {
          onDragFromChange(index);
          event.dataTransfer.setData(WIZARD_PHOTO_DRAG_MIME, String(index));
          event.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => {
          onDragFromChange(null);
        }}
        onDragOver={allowDrop}
        onDrop={handleDrop}
      >
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 size-full object-cover ${
            isCover ? "rounded-[16px]" : "rounded-[8px]"
          }`}
        />
        <button
          type="button"
          aria-label="Удалить фото"
          className={`absolute top-0 right-0 flex cursor-pointer items-center rounded-[20px] border-0 bg-[var(--color-accent)] p-[2px] ${
            isCover ? "m-3" : "m-1"
          }`}
          onClick={onRemove}
          onDragStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <img
            src="/icon-photo-close.svg"
            alt=""
            width={20}
            height={20}
            draggable={false}
            className="block size-5"
          />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={isCover ? "Добавить обложку" : "Добавить фото"}
      className={`relative shrink-0 cursor-pointer overflow-hidden border border-dashed border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] p-0 ${
        isCover
          ? "h-[264px] w-[437px] rounded-[16px]"
          : "size-[100px] rounded-[8px]"
      }`}
      onClick={onAdd}
      onDragOver={allowDrop}
      onDrop={handleDrop}
    >
      <img
        src="/icon-plus.svg"
        alt=""
        width={32}
        height={32}
        draggable={false}
        className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2"
      />
    </button>
  );
}
