import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen min-w-[1440px] overflow-hidden bg-white font-sans">
      <div className="relative flex w-[calc(41.67%+19px)] min-w-0 flex-col px-16 pb-10 pt-10">
        <img
          src="/logo-globalstay.svg"
          alt="GlobalStay"
          width={181}
          height={60}
          className="shrink-0"
        />
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-[320px]">{children}</div>
        </div>
        <p className="mx-auto w-[320px] text-center text-[12px] leading-[1.5]">
          <span className="text-[#525353]">Продолжая, Вы соглашаетесь с </span>
          <Link
            to="/terms"
            className="text-[var(--color-accent)] no-underline"
          >
            Условиями использования
          </Link>
          <span className="text-[#525353]"> и </span>
          <Link
            to="/privacy"
            className="text-[var(--color-accent)] no-underline"
          >
            Политикой конфиденциальности
          </Link>
        </p>
      </div>
      <div className="flex flex-1 items-stretch py-[41px] pr-[32px]">
        <img
          src="/auth-side.jpg"
          alt=""
          className="h-full w-full rounded-[20px] object-cover"
        />
      </div>
    </div>
  );
}
