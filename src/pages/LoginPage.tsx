import { FormEvent, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { ForgotPasswordModal } from "../ui/ForgotPasswordModal";
import { Input } from "../ui/Input";

type LoginLocationState = {
  forgot?: boolean;
};

export function LoginPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailVerified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    if (state?.forgot) {
      setForgotOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError("");
    setPending(true);
    try {
      const session = await auth.login(email, password);
      navigate(session.onboardingComplete ? "/listings" : "/onboarding");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Неверный email или пароль";
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  const invalid = Boolean(formError);

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
          {emailVerified ? (
            <p className="m-0 w-full text-[14px] leading-[1.4] text-[#1a1b1d]">
              Почта подтверждена. Войдите, чтобы продолжить.
            </p>
          ) : null}
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
