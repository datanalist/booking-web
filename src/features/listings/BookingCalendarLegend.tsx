import type { ReactElement, ReactNode } from "react";

/** Легенда статусов дат в алерте календаря (Figma 1:22281). */
export function BookingCalendarLegend(): ReactElement {
  return (
    <div className="flex w-[287px] flex-col gap-1">
      <LegendRow>
        <span className="flex size-9 items-center justify-center text-center text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          15
        </span>
        <span className="text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          Доступно для бронирования
        </span>
      </LegendRow>
      <LegendRow>
        <span className="flex size-9 items-center justify-center text-center text-[14px] font-normal leading-[1.4] text-[#525353] line-through">
          15
        </span>
        <span className="text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          Не доступно для бронирования
        </span>
      </LegendRow>
      <LegendRow>
        <span className="flex size-9 items-center justify-center rounded-[40px] bg-[rgba(77,56,232,0.23)] text-center text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          15
        </span>
        <span className="text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          Забронировано
        </span>
      </LegendRow>
    </div>
  );
}

function LegendRow({ children }: { children: ReactNode }): ReactElement {
  return <div className="flex items-center gap-2">{children}</div>;
}
