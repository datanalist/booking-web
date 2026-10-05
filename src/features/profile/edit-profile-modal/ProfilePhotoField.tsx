import type { ReactElement } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfilePhotoPicker } from "./ProfilePhotoPicker";

type ProfilePhotoFieldProps = {
  photoUrl: string | undefined;
  onPickFile: (file: File) => void;
  onDelete: () => void;
};

export function ProfilePhotoField({
  photoUrl,
  onPickFile,
  onDelete,
}: ProfilePhotoFieldProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative size-[100px] shrink-0">
        <ProfileAvatar photoUrl={photoUrl} />
        <ProfilePhotoPicker onPickFile={onPickFile} />
      </div>
      {photoUrl !== undefined ? (
        <button
          type="button"
          className="rounded-[30px] py-1 text-[12px] leading-[1.3] font-normal text-[#f88a2a] underline"
          onClick={onDelete}
        >
          Удалить фото
        </button>
      ) : null}
    </div>
  );
}
