import type { ReactElement } from "react";
import { useAccountPhotoSrc } from "../../../ui/useAccountPhotoSrc";

type ProfileAvatarProps = {
  photoUrl: string | undefined;
};

export function ProfileAvatar({ photoUrl }: ProfileAvatarProps): ReactElement {
  const resolved = useAccountPhotoSrc(photoUrl);
  if (resolved !== undefined) {
    return (
      <img
        src={resolved}
        alt=""
        className="size-[100px] rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex size-[100px] items-center justify-center overflow-hidden rounded-full border border-solid border-[#f88a2a] shadow-[0px_10px_20px_rgba(0,0,0,0.03)]">
      <img
        src="/onboarding/avatar-placeholder.svg"
        alt=""
        width={41}
        height={49}
      />
    </span>
  );
}
