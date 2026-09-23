import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function LoginPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setPasswordError("");
    setPending(true);
    try {
      const session = await auth.login(email, password);
      navigate(session.onboardingComplete ? "/listings" : "/onboarding");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Неверный email или пароль";
      setPasswordError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="mb-2 text-[32px] font-bold text-[var(--color-ink)]">
        Войти
      </h1>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="Введите email"
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Введите пароль"
        error={passwordError}
      />
      <Link
        to="/forgot-password"
        className="text-[14px] text-[var(--color-accent)] no-underline"
      >
        Забыли пароль?
      </Link>
      <p className="text-[12px] leading-snug text-[#757575]">
        <span>
          Продолжая, Вы соглашаетесь с Условиями использования и Политикой
          конфиденциальности
        </span>
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        Начать работу
      </Button>
      <p className="text-[14px] text-[var(--color-text)]">
        Нет аккаунта?{" "}
        <Link to="/register" className="text-[var(--color-accent)] no-underline">
          Создать аккаунт
        </Link>
      </p>
    </form>
  );
}
