import type { ReactElement } from "react";

/** Локальная кнопка: shared Button — пилюля 30px, в алерте нужен rounded-lg. */
export function ProfileEditSaveButton(): ReactElement {
  return (
    <button
      type="submit"
      className="cursor-pointer self-stretch rounded-lg border-0 bg-[#f88a2a] px-6 py-5 font-sans text-lg leading-normal font-bold tracking-[0.018px] text-white"
    >
      Сохранить
    </button>
  );
}
