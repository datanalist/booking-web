import type { ReactNode } from "react";

type BookingRequestSectionProps = {
  title: string;
  children: ReactNode;
};

export function BookingRequestSection({
  title,
  children,
}: BookingRequestSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="m-0 text-base font-bold leading-5 text-absolute-black">
        {title}
      </h3>
      {children}
    </section>
  );
}
