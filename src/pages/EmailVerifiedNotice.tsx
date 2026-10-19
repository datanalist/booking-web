import { useEffect } from "react";
import { publishEmailVerifiedNotice } from "./emailVerifiedNotice";

export const EMAIL_CONFIRMED_TITLE = "Ваша почта подтверждена";
export const EMAIL_CONFIRMED_RETURN_TEXT =
  "Пожалуйста, вернитесь на страницу входа.";

export const EMAIL_CONFIRMED_LOGIN_TEXT =
  "Почта подтверждена. Войдите, чтобы продолжить.";

export function EmailVerifiedNotice() {
  useEffect(() => {
    publishEmailVerifiedNotice();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-8 font-sans">
      <div className="flex w-full max-w-[360px] flex-col items-center text-center">
        <span
          aria-hidden
          className="mb-8 flex size-14 items-center justify-center rounded-[18px] bg-[#fff4eb]"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M5 11.4 9.1 15.5 17.2 6.8"
              stroke="#f88a2a"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="m-0 text-[28px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f]">
          {EMAIL_CONFIRMED_TITLE}
        </h1>
        <p className="m-0 mt-4 text-[15px] leading-[1.55] tracking-[-0.01em] text-[#6e6e73]">
          {EMAIL_CONFIRMED_RETURN_TEXT}
        </p>
      </div>
    </main>
  );
}

export function EmailVerifiedInlineNotice() {
  return (
    <div className="w-full rounded-[12px] border border-[var(--color-accent)] bg-white px-4 py-3">
      <p className="m-0 text-[14px] leading-[1.4] text-[#1a1b1d]">
        {EMAIL_CONFIRMED_LOGIN_TEXT}
      </p>
    </div>
  );
}
