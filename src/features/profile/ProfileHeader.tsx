import type { ReactElement } from "react";

export type ProfileHeaderProps = {
  onEditClick: () => void;
  onLogoutClick: () => void;
  onSupportClick: () => void;
};

const iconButtonClass =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-[#f88a2a] bg-transparent p-2";

/** Шапка главной профиля, Figma 1:17904: заголовок и три действия справа. */
export function ProfileHeader({
  onEditClick,
  onLogoutClick,
  onSupportClick,
}: ProfileHeaderProps): ReactElement {
  return (
    <header className="flex h-10 w-full shrink-0 items-center justify-between font-sans">
      <h1 className="text-[24px] font-bold leading-[1.2] whitespace-nowrap text-[#1a1b1d]">
        Профиль
      </h1>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Редактировать профиль"
          onClick={onEditClick}
        >
          <img
            src="/profile/icon-edit.svg"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
        </button>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Выйти из аккаунта"
          onClick={onLogoutClick}
        >
          <img
            src="/profile/icon-logout.svg"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
        </button>
        <button
          type="button"
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-[#f88a2a] bg-transparent px-5 py-2.5 text-[14px] font-normal leading-[1.4] whitespace-nowrap text-[#f88a2a]"
          onClick={onSupportClick}
        >
          Написать в поддержку
        </button>
      </div>
    </header>
  );
}
