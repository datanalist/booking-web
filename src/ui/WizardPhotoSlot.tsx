/** Единая причина изменения: слот фото мастера объявления (пусто / превью / удаление). */

type WizardPhotoSlotProps = {
  variant: "cover" | "thumb";
  previewUrl: string | null;
  onAdd: () => void;
  onRemove: () => void;
};

export function WizardPhotoSlot({
  variant,
  previewUrl,
  onAdd,
  onRemove,
}: WizardPhotoSlotProps) {
  const isCover = variant === "cover";
  const filled = previewUrl !== null;

  if (filled) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden ${
          isCover
            ? "h-[264px] w-[437px] rounded-[16px]"
            : "size-[100px] rounded-[8px]"
        }`}
      >
        <img
          src={previewUrl}
          alt=""
          className={`absolute inset-0 size-full object-cover ${
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
        >
          <img
            src="/icon-photo-close.svg"
            alt=""
            width={20}
            height={20}
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
    >
      <img
        src="/icon-plus.svg"
        alt=""
        width={32}
        height={32}
        className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2"
      />
    </button>
  );
}
