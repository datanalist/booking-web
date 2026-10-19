import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen justify-center overflow-hidden bg-white font-sans">
      {/*
        Холст без overflow-hidden: иначе квадратный родитель срезает
        rounded-[20px] у фото, когда оно близко к краю кадра.
      */}
      <div className="relative h-[1020px] w-[1440px] shrink-0 bg-white">
        <img
          src="/logo-globalstay.svg"
          alt="GlobalStay"
          width={181}
          height={60}
          className="absolute left-8 top-4 h-[60px] w-[181px] object-contain object-left"
        />
        <div className="absolute left-[149px] top-[305px] w-80">{children}</div>
        {/*
          Справа: p-16 (64px) + кадр 789×938. Скругление на overflow-hidden
          обёртке и на img — угол виден на самом фото.
        */}
        <div className="absolute inset-y-0 right-0 flex w-[917px] items-center justify-end p-16">
          <div className="h-[938px] w-[789px] shrink-0 overflow-hidden rounded-[20px]">
            <img
              src="/auth-side.jpg"
              alt=""
              className="h-full w-full rounded-[20px] object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
