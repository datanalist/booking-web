import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function RegisterPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setEmailError("");
    setConfirmError("");
    if (password !== confirm) {
      setConfirmError("Пароли не совпадают");
      return;
    }
    setPending(true);
    try {
      await auth.register(email, password);
      navigate("/onboarding");
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "EMAIL_TAKEN" || err.message.includes("уже зарегистрирован")) {
        setEmailError(err.message);
      } else if (err.code === "INVALID_EMAIL") {
        setEmailError(err.message);
      } else if (err.code === "INVALID_PASSWORD") {
        setConfirmError(err.message);
      } else {
        setEmailError(err.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="mb-2 text-[32px] font-bold text-[var(--color-ink)]">
        Регистрация
      </h1>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="Введите email"
        error={emailError}
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Минимум 8 символов"
      />
      <Input
        label="Подтвердите пароль"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Повторите пароль"
        error={confirmError}
      />
      <p className="text-[12px] leading-snug text-[#757575]">
        <span>
          Продолжая, Вы соглашаетесь с Условиями использования и Политикой
          конфиденциальности
        </span>
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        Создать аккаунт
      </Button>
      <p className="text-[14px] text-[var(--color-text)]">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="text-[var(--color-accent)] no-underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
