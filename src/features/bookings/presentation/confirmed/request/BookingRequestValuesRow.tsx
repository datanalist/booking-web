import { Fragment } from "react";

type BookingRequestValuesRowProps = {
  values: readonly string[];
};

/** Values separated by a 3px dot: "5-10 декабря • 5 ночей". */
export function BookingRequestValuesRow({
  values,
}: BookingRequestValuesRowProps) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-3 text-base leading-6 text-absolute-black">
      {values.map((value, index) => (
        <Fragment key={`${index}-${value}`}>
          {index > 0 ? (
            <span
              aria-hidden
              className="size-[3px] shrink-0 rounded-full bg-absolute-black"
            />
          ) : null}
          <span>{value}</span>
        </Fragment>
      ))}
    </p>
  );
}
