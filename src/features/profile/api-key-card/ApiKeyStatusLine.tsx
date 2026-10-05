import type { ReactElement } from "react";
import type { ApiKeyStatus } from "./ApiKeyStatus";

type ApiKeyStatusLineProps = {
  status: ApiKeyStatus;
};

function StatusRow({
  iconSrc,
  label,
  textClassName,
}: {
  iconSrc: string;
  label: string;
  textClassName: string;
}): ReactElement {
  return (
    <div role="status" className="flex h-6 items-center gap-[6px]">
      <img src={iconSrc} alt="" width={24} height={24} />
      <span className={`text-[14px] font-normal leading-5 ${textClassName}`}>
        {label}
      </span>
    </div>
  );
}

export function ApiKeyStatusLine({
  status,
}: ApiKeyStatusLineProps): ReactElement | null {
  switch (status) {
    case "disconnected":
      return null;
    case "connected":
      return (
        <StatusRow
          iconSrc="/profile/icon-check-circle.svg"
          label="Подключено"
          textClassName="text-[#4aa446]"
        />
      );
    case "error":
      return (
        <StatusRow
          iconSrc="/profile/icon-warning-circle.svg"
          label="Ошибка подключения"
          textClassName="text-[#e34043]"
        />
      );
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}
