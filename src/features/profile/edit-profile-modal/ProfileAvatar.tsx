import type { ReactElement } from "react";

type ProfileAvatarProps = {
  photoUrl: string | undefined;
};

export function ProfileAvatar({ photoUrl }: ProfileAvatarProps): ReactElement {
  if (photoUrl !== undefined) {
    return (
      <img
        src={photoUrl}
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
