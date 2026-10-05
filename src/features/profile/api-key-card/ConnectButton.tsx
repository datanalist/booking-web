import type { ReactElement } from "react";

type ConnectButtonProps = {
  onClick: () => void;
};

export function ConnectButton({ onClick }: ConnectButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="box-border inline-flex h-10 cursor-pointer items-center justify-center rounded-[30px] border-0 bg-[#f88a2a] px-5 py-2.5 font-sans text-[14px] font-normal leading-[1.4] text-white"
    >
      Подключить
    </button>
  );
}
