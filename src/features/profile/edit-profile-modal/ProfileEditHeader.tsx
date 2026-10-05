import type { ReactElement } from "react";

type ProfileEditHeaderProps = {
  titleId: string;
  onClose: () => void;
};

export function ProfileEditHeader({
  titleId,
  onClose,
}: ProfileEditHeaderProps): ReactElement {
  return (
    <div className="flex w-full items-start justify-between">
      <h2
        id={titleId}
        className="m-0 min-w-0 flex-1 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]"
      >
        Редактировать данные профиля
      </h2>
      <button
        type="button"
        aria-label="Закрыть"
        className="flex shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-2.5"
        onClick={onClose}
      >
        <img src="/profile/icon-close.svg" alt="" width={20} height={20} />
      </button>
    </div>
  );
}
