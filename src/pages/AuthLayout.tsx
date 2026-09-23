import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen min-w-[1440px] bg-white font-sans">
      <div className="flex w-1/2 flex-col px-16 py-10">
        <div className="mb-16 text-[28px] font-bold text-[var(--color-ink)]">
          GlobalStay
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="w-[320px]">{children}</div>
        </div>
      </div>
      <div className="w-1/2 overflow-hidden">
        <img
          src="/auth-side.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
