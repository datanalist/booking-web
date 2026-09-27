/** Единая причина изменения: UI шага «2. Фото» мастера создания объявления. */
import { useRef } from "react";
import { PHOTO_MAX, PHOTO_MIN } from "../config";
import { Button } from "./Button";
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

        <div className="flex w-full flex-wrap content-start items-start justify-between gap-y-5">
          {slots.map((previewUrl, index) => (
            <WizardPhotoSlot
              key={index === 0 ? "cover" : `thumb-${index}`}
              variant={index === 0 ? "cover" : "thumb"}
              previewUrl={previewUrl}
              onAdd={openPicker}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>

        {error ? <p className="m-0 text-[14px] text-red-600">{error}</p> : null}

        <div className="flex w-full gap-5">
          <Button
            variant="outlined"
            disabled={pending}
            className="h-auto min-w-0 flex-1 rounded-[8px] px-6 py-5"
            onClick={onBack}
          >
            Вернуться
          </Button>
          <Button
            disabled={pending || !canProceed}
            className="h-auto min-w-0 flex-1 rounded-[8px] px-6 py-5 disabled:opacity-40"
            onClick={onNext}
          >
            Далее
          </Button>
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
