/** Поле даты: отображение всегда DD.MM.YYYY, выбор через нативный picker. */
import { useId, useRef } from "react";
import {
  formatIsoDateDisplay,
  parseIsoDate,
  type IsoDate,
} from "../lib/isoDate";

type DateFieldProps = {
  label: string;
  value: IsoDate | "";
  onChange: (value: IsoDate | "") => void;
  "aria-label"?: string;
};

export function DateField({
  label,
  value,
  onChange,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const id = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const display = value === "" ? "" : formatIsoDateDisplay(value);

  function openPicker(): void {
    const el = pickerRef.current;
    if (!el) {
      return;
    }
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // Unsupported or blocked; fall through to click().
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="flex w-[180px] flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[14px] font-normal leading-[1.4] text-[#525353]"
      >
        {label}
      </label>
      <div className="relative box-border flex h-11 items-center rounded-[8px] border border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] px-[14px] py-2.5">
        <input
          id={id}
          type="text"
          readOnly
          value={display}
          placeholder="ДД.ММ.ГГГГ"
          aria-label={ariaLabel ?? label}
          className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent font-sans text-[16px] leading-[1.45] text-[var(--color-ink)] outline-none placeholder:text-[#525353]"
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
        />
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0"
          aria-label="Выбрать дату"
          onClick={openPicker}
        >
          <img src="/icon-calendar.svg" alt="" width={16} height={18} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          value={value}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange("");
              return;
            }
            const parsed = parseIsoDate(raw);
            if (parsed !== null) {
              onChange(parsed);
            }
          }}
        />
      </div>
    </div>
  );
}
