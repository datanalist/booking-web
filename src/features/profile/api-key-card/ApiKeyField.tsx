import { useId, type ReactElement } from "react";

type ApiKeyFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ApiKeyField({ value, onChange }: ApiKeyFieldProps): ReactElement {
  const id = useId();

  return (
    <div className="flex h-[68px] w-full flex-col items-start justify-center gap-1 self-stretch rounded-lg">
      <label
        htmlFor={id}
        className="font-sans text-[14px] font-normal leading-[1.4] text-[#525353]"
      >
        API Key
      </label>
      <input
        id={id}
        className="box-border h-11 w-full rounded-lg border border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] px-3.5 py-2.5 font-sans text-[16px] font-normal leading-[1.45] text-[#1a1b1d] outline-none placeholder:text-[#525353]"
        type="text"
        value={value}
        placeholder="Введите код"
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}
