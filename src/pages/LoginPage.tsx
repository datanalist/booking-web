import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { resolveCabinetDataSource } from "../api/pocketbase/dataSource";
import type { TelegramLoginFields } from "../api/types";
import { Button } from "../ui/Button";
import { ForgotPasswordModal } from "../ui/ForgotPasswordModal";
import { Input } from "../ui/Input";
import { EmailVerifiedInlineNotice } from "./EmailVerifiedNotice";
import { subscribeEmailVerifiedNotice } from "./emailVerifiedNoticeChannel";

const TELEGRAM_WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

type TelegramLoginApi = {
  auth(
    options: { bot_id: string; request_access?: boolean },
    callback: (data: TelegramLoginFields | false) => void,
  ): void;
};

function telegramBotId(): string {
  const value: unknown = import.meta.env.VITE_TELEGRAM_BOT_ID;
  return typeof value === "string" ? value.trim() : "";
}

function telegramLoginApi(): TelegramLoginApi | null {
  const widget = (window as Window & { Telegram?: { Login?: TelegramLoginApi } }).Telegram?.Login;
  return typeof widget?.auth === "function" ? widget : null;
}

function preloadTelegramWidget(): void {
  if (telegramLoginApi() || document.querySelector(`script[src="${TELEGRAM_WIDGET_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = TELEGRAM_WIDGET_SRC;
  script.async = true;
  document.head.appendChild(script);
}

type LoginLocationState = {
  forgot?: boolean;
  verified?: boolean;
  email?: string;
};

export function LoginPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const arrival = location.state as LoginLocationState | null;
  const [emailVerified, setEmailVerified] = useState(() => Boolean(arrival?.verified));
  const [email, setEmail] = useState(() => arrival?.email ?? "");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldsInvalid, setFieldsInvalid] = useState(false);
  const [pending, setPending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => subscribeEmailVerifiedNotice(() => setEmailVerified(true)), []);

  const telegramEnabled = resolveCabinetDataSource() === "pocketbase";
  const botId = telegramBotId();

  useEffect(() => {
    if (telegramEnabled && botId !== "") preloadTelegramWidget();
  }, [telegramEnabled, botId]);

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    if (state?.verified) {
      setEmailVerified(true);
      if (state.email) setEmail(state.email);
    }
    if (!state?.forgot) return;
    setForgotOpen(true);
    navigate(location.pathname, {
      replace: true,
      state: state.verified ? { verified: true, email: state.email } : null,
    });
  }, [location.pathname, location.state, navigate]);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError("");
    setFieldsInvalid(false);
    setPending(true);
    try {
      const session = await auth.login(email, password);
      navigate(session.onboardingComplete ? "/listings" : "/onboarding");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Неверный email или пароль";
      setFieldsInvalid(true);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  function onTelegram(): void {
    if (botId === "") {
      setFormError("Вход через Telegram не настроен");
      return;
    }
    const widget = telegramLoginApi();
    if (!widget) {
      setFormError("Не удалось открыть вход Telegram");
      return;
    }
    setFormError("");
    setFieldsInvalid(false);
    setPending(true);
    widget.auth({ bot_id: botId, request_access: true }, (data) => {
      if (!data) {
        setPending(false);
        setFormError("Вход через Telegram отменён");
        return;
      }
      void auth.loginWithTelegram(data).then((session) => {
        navigate(session.onboardingComplete ? "/listings" : "/onboarding");
      }).catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : "Не удалось войти через Telegram");
      }).finally(() => setPending(false));
    });
  }

  const invalid = fieldsInvalid;

  return (
    <>
      <form
        className="flex w-full flex-col items-center gap-10"
        onSubmit={onSubmit}
      >
        <h1 className="m-0 text-center text-[32px] font-bold leading-normal text-[#1a1b1d]">
          Войти
        </h1>

        <div className="flex w-full flex-col items-stretch gap-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Введите email"
            variant="auth"
            invalid={invalid}
          />
          <div className="flex w-full flex-col items-stretch gap-2">
            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Введите пароль"
              variant="auth"
              passwordToggle
              invalid={invalid}
            />
            <button
              type="button"
              className="w-full border-0 bg-transparent p-0 text-right text-[14px] leading-[1.4] text-[var(--color-accent)]"
              onClick={() => setForgotOpen(true)}
            >
              Забыли пароль?
            </button>
          </div>
          {emailVerified ? <EmailVerifiedInlineNotice /> : null}
          {formError ? (
            <p className="m-0 w-full text-[14px] leading-[1.4] text-[#e34043]">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <Button
            type="submit"
            disabled={pending}
            className="h-auto w-full !rounded-lg !px-6 !py-5"
          >
            Начать работу
          </Button>
          {telegramEnabled ? (
            <div className="flex w-full flex-col items-start gap-2.5">
              <p className="m-0 text-[15px] leading-[1.3] text-[#8d8d8d]">
                или войдите с помощью
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Войти через Telegram"
                  disabled={pending}
                  onClick={onTelegram}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] border-0 bg-[#2AABEE] p-0 text-white hover:bg-[#229ED9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M9.42 15.18 9.02 20.76c.57 0 .81-.24 1.11-.54l2.66-2.54 5.52 4.04c1.01.56 1.73.27 2-.93l3.62-17.03c.32-1.5-.54-2.08-1.53-1.71L1.05 9.38c-1.45.56-1.43 1.37-.25 1.74l5.44 1.69L18.95 6.28c.6-.39 1.14-.18.69.22"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}
          <p className="m-0 w-full text-center text-[14px] leading-[1.4]">
            <span className="text-[#525353]">Нет аккаунта?</span>
            <Link
              to="/register"
              className="text-[var(--color-accent)] no-underline"
            >
              {" "}
              Создать аккаунт
            </Link>
          </p>
        </div>
      </form>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onDone={() => setForgotOpen(false)}
      />
    </>
  );
}
