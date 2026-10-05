import type { ReactElement } from "react";

const EMPTY_ILLUSTRATION_SRC = "/profile/photo-empty-illustration.svg";

type ProfilePhoto =
  | { readonly kind: "empty" }
  | { readonly kind: "filled"; readonly url: string };

function toProfilePhoto(photoUrl: string | undefined): ProfilePhoto {
  if (photoUrl === undefined || photoUrl.length === 0) {
    return { kind: "empty" };
  }
  return { kind: "filled", url: photoUrl };
}

function renderProfilePhoto(photo: ProfilePhoto): ReactElement {
  switch (photo.kind) {
    case "empty":
      return (
        <div className="flex h-[244px] w-full shrink-0 items-center justify-center rounded-[12px] border border-[rgba(251,192,40,0.17)]">
          <img
            src={EMPTY_ILLUSTRATION_SRC}
            alt=""
            width={188}
            height={159}
            className="block h-[159px] w-[188px] shrink-0"
          />
        </div>
      );
    case "filled":
      return (
        <img
          src={photo.url}
          alt="Фото профиля"
          className="h-[244px] w-full shrink-0 rounded-lg object-cover"
        />
      );
  }
}

type ProfilePhotoFrameProps = {
  photoUrl: string | undefined;
};

export function ProfilePhotoFrame({
  photoUrl,
}: ProfilePhotoFrameProps): ReactElement {
  return renderProfilePhoto(toProfilePhoto(photoUrl));
}
