import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans">
      {/*
        На кадре 1440px левая колонка 523px (форма left 149, ширина 320),
        правая 917px. Доли flex сохраняют это соотношение и тянутся с окном.
      */}
      <div className="relative flex h-full min-w-0 flex-[523_1_0%] items-center">
        <img
          src="/logo-globalstay.svg"
          alt="GlobalStay"
          width={181}
          height={60}
          className="absolute left-8 top-4 h-[60px] w-[181px] object-contain object-left"
        />
        <div className="ml-[clamp(2rem,10.35vw,149px)] max-h-full w-80 overflow-y-auto">
          {children}
        </div>
      </div>
      {/*
        Справа: p-16 и кадр на всю оставшуюся высоту. Скругление на
        overflow-hidden обёртке и на img — угол виден на самом фото.
      */}
      <div className="flex h-full min-w-0 flex-[917_1_0%] items-center justify-end p-16">
        <div className="h-full w-full overflow-hidden rounded-[20px]">
          <img
            src="/auth-side.jpg"
            alt=""
            className="h-full w-full rounded-[20px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
