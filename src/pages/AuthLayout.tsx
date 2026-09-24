import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen justify-center overflow-hidden bg-white font-sans">
      <div className="relative h-[1020px] w-[1440px] shrink-0 overflow-hidden bg-white">
        <img
          src="/logo-globalstay.svg"
          alt="GlobalStay"
          width={176}
          height={56}
          className="absolute left-8 top-4 h-14 w-44 object-contain object-left"
        />
        <div className="absolute left-[149px] top-[305px] w-80">{children}</div>
        <p className="absolute left-[149px] top-[942px] m-0 w-80 text-center text-[12px] leading-[1.5]">
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
        {/*
          Скругление на обёртке с overflow-hidden: угол 20px не срезается
          overflow родителя холста, в отличие от border-radius на самом img.
        */}
        <div className="absolute left-[619px] top-[41px] h-[938px] w-[789px] overflow-hidden rounded-[20px]">
          <img
            src="/auth-side.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
