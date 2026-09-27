/** Единая причина изменения: UI шага «2. Фото» мастера создания объявления. */
import { useRef, type DragEvent } from "react";
import { PHOTO_MAX, PHOTO_MIN } from "../config";
import { dataTransferHasFiles } from "../lib/dataTransferHasFiles";
import { imageFileListFromDataTransfer } from "../lib/imageFileListFromDataTransfer";
import { reorderPhotos } from "../lib/reorderPhotos";
import { WIZARD_PHOTO_DRAG_MIME } from "../lib/wizardPhotoDragMime";
import { WizardPhotoSlot } from "./WizardPhotoSlot";

type WizardPhotosStepProps = {
  photos: string[];
  error?: string;
  pending?: boolean;
  onPhotosChange: (photos: string[]) => void;
  onFilesSelected: (files: FileList) => void;
  onBack: () => void;
  onNext: () => void;
};

export function WizardPhotosStep({
  photos,
  error,
  pending = false,
  onPhotosChange,
  onFilesSelected,
  onBack,
  onNext,
}: WizardPhotosStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFromIndexRef = useRef<number | null>(null);
  const canAdd = photos.length < PHOTO_MAX;
  const canProceed = photos.length >= PHOTO_MIN;
  const slots = Array.from({ length: PHOTO_MAX }, (_, index) => photos[index] ?? null);

  function openPicker(): void {
    if (!canAdd) {
      return;
    }
    inputRef.current?.click();
  }

  function removeAt(index: number): void {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  function handleReorder(fromIndex: number, toIndex: number): void {
    onPhotosChange(reorderPhotos(photos, fromIndex, toIndex));
  }

  function getDragFromIndex(): number | null {
    return dragFromIndexRef.current;
  }

  function setDragFromIndex(index: number | null): void {
    dragFromIndexRef.current = index;
  }

  function allowGridFileDrop(event: DragEvent<HTMLDivElement>): void {
    if (!canAdd || !dataTransferHasFiles(event.dataTransfer)) {
      return;
    }
    if (
      dragFromIndexRef.current !== null ||
      Array.from(event.dataTransfer.types).includes(WIZARD_PHOTO_DRAG_MIME)
    ) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleGridFileDrop(event: DragEvent<HTMLDivElement>): void {
    if (!canAdd || dragFromIndexRef.current !== null) {
      return;
    }
    event.preventDefault();
    const files = imageFileListFromDataTransfer(event.dataTransfer);
    if (files !== null) {
      onFilesSelected(files);
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-[437px] flex-col items-start gap-8 py-10">
        <div className="flex flex-col items-start gap-2">
          <h2 className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
            Добавьте фото жилья
          </h2>
          <p className="m-0 text-[14px] leading-[1.4] text-[#525353]">
            Минимум {PHOTO_MIN} фото
          </p>
        </div>

        <div
          className="flex w-full flex-wrap content-start items-start justify-between gap-y-5"
          onDragOver={allowGridFileDrop}
          onDrop={handleGridFileDrop}
        >
          {slots.map((previewUrl, index) => (
            <WizardPhotoSlot
              key={index === 0 ? "cover" : `thumb-${index}`}
              variant={index === 0 ? "cover" : "thumb"}
              index={index}
              previewUrl={previewUrl}
              canAdd={canAdd}
              getDragFromIndex={getDragFromIndex}
              onAdd={openPicker}
              onRemove={() => removeAt(index)}
              onDragFromChange={setDragFromIndex}
              onReorder={handleReorder}
              onFilesDropped={onFilesSelected}
            />
          ))}
        </div>

        {error ? <p className="m-0 text-[14px] text-red-600">{error}</p> : null}

        <div className="inline-flex items-start justify-start gap-5 self-stretch">
          <button
            type="button"
            disabled={pending}
            className="flex-1 cursor-pointer rounded-lg border-0 bg-transparent px-6 py-5 font-sans text-[18px] font-bold text-orange-400 outline outline-1 outline-offset-[-1px] outline-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onBack}
          >
            Вернуться
          </button>
          <button
            type="button"
            disabled={pending || !canProceed}
            className="flex-1 cursor-pointer rounded-lg border-0 bg-orange-400 px-6 py-5 font-sans text-[18px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onNext}
          >
            Далее
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
              onFilesSelected(files);
            }
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
