import type { ReactElement, ReactNode } from "react";

export type ProfileLayoutProps = {
  header: ReactNode;
  personal: ReactNode;
  apiKey: ReactNode;
  balance: ReactNode;
};

/** Раскладка главной профиля: поле 1205×1020 и белая карточка с тремя колонками. */
export function ProfileLayout({
  header,
  personal,
  apiKey,
  balance,
}: ProfileLayoutProps): ReactElement {
  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      {header}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white p-5">
        <div className="flex w-full items-start gap-8">
          <div data-slot="personal" className="w-[300px] shrink-0">
            {personal}
          </div>
          <div data-slot="api-key" className="min-w-0 flex-1">
            {apiKey}
          </div>
          <div data-slot="balance" className="min-w-0 flex-1">
            {balance}
          </div>
        </div>
      </div>
    </section>
  );
}
