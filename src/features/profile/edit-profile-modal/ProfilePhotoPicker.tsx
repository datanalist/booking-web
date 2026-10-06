import { useRef, type ChangeEvent, type ReactElement } from "react";

type ProfilePhotoPickerProps = {
  onPickFile: (file: File) => void;
};

function takeFirstFile(event: ChangeEvent<HTMLInputElement>): File | undefined {
  const file = event.target.files?.item(0) ?? undefined;
  event.target.value = "";
  return file;
}

export function ProfilePhotoPicker({
  onPickFile,
}: ProfilePhotoPickerProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker(): void {
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = takeFirstFile(event);
    if (file === undefined) {
      return;
    }
    onPickFile(file);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Изменить фото"
        className="absolute top-[76px] left-[76px] flex size-6 items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
        onClick={openPicker}
      >
        <img src="/profile/icon-camera-edit.svg" alt="" width={24} height={24} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChange}
      />
    </>
  );
}
